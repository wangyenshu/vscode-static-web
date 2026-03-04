/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/extensions/common/extensionHostKind", "vs/workbench/services/extensions/common/rpcProtocol"], function (require, exports, async_1, buffer_1, errors, event_1, lifecycle_1, stopwatch_1, nls, actionCommonCategories_1, actions_1, instantiation_1, log_1, remoteAuthorityResolver_1, telemetry_1, editorService_1, environmentService_1, extHostCustomers_1, extensionHostKind_1, rpcProtocol_1) {
    "use strict";
    var ExtensionHostManager_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostManager = void 0;
    exports.friendlyExtHostName = friendlyExtHostName;
    // Enable to see detailed message communication between window and extension host
    const LOG_EXTENSION_HOST_COMMUNICATION = false;
    const LOG_USE_COLORS = true;
    let ExtensionHostManager = ExtensionHostManager_1 = class ExtensionHostManager extends lifecycle_1.Disposable {
        get pid() {
            return this._extensionHost.pid;
        }
        get kind() {
            return this._extensionHost.runningLocation.kind;
        }
        get startup() {
            return this._extensionHost.startup;
        }
        get friendyName() {
            return friendlyExtHostName(this.kind, this.pid);
        }
        constructor(extensionHost, initialActivationEvents, _internalExtensionService, _instantiationService, _environmentService, _telemetryService, _logService) {
            super();
            this._internalExtensionService = _internalExtensionService;
            this._instantiationService = _instantiationService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._onDidChangeResponsiveState = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveState = this._onDidChangeResponsiveState.event;
            this._hasStarted = false;
            this._cachedActivationEvents = new Map();
            this._resolvedActivationEvents = new Set();
            this._rpcProtocol = null;
            this._customers = [];
            this._extensionHost = extensionHost;
            this.onDidExit = this._extensionHost.onExit;
            const startingTelemetryEvent = {
                time: Date.now(),
                action: 'starting',
                kind: (0, extensionHostKind_1.extensionHostKindToString)(this.kind)
            };
            this._telemetryService.publicLog2('extensionHostStartup', startingTelemetryEvent);
            this._proxy = this._extensionHost.start().then((protocol) => {
                this._hasStarted = true;
                // Track healthy extension host startup
                const successTelemetryEvent = {
                    time: Date.now(),
                    action: 'success',
                    kind: (0, extensionHostKind_1.extensionHostKindToString)(this.kind)
                };
                this._telemetryService.publicLog2('extensionHostStartup', successTelemetryEvent);
                return this._createExtensionHostCustomers(this.kind, protocol);
            }, (err) => {
                this._logService.error(`Error received from starting extension host (kind: ${(0, extensionHostKind_1.extensionHostKindToString)(this.kind)})`);
                this._logService.error(err);
                // Track errors during extension host startup
                const failureTelemetryEvent = {
                    time: Date.now(),
                    action: 'error',
                    kind: (0, extensionHostKind_1.extensionHostKindToString)(this.kind)
                };
                if (err && err.name) {
                    failureTelemetryEvent.errorName = err.name;
                }
                if (err && err.message) {
                    failureTelemetryEvent.errorMessage = err.message;
                }
                if (err && err.stack) {
                    failureTelemetryEvent.errorStack = err.stack;
                }
                this._telemetryService.publicLog2('extensionHostStartup', failureTelemetryEvent);
                return null;
            });
            this._proxy.then(() => {
                initialActivationEvents.forEach((activationEvent) => this.activateByEvent(activationEvent, 0 /* ActivationKind.Normal */));
                this._register(registerLatencyTestProvider({
                    measure: () => this.measure()
                }));
            });
        }
        dispose() {
            if (this._extensionHost) {
                this._extensionHost.dispose();
            }
            if (this._rpcProtocol) {
                this._rpcProtocol.dispose();
            }
            for (let i = 0, len = this._customers.length; i < len; i++) {
                const customer = this._customers[i];
                try {
                    customer.dispose();
                }
                catch (err) {
                    errors.onUnexpectedError(err);
                }
            }
            this._proxy = null;
            super.dispose();
        }
        async measure() {
            const proxy = await this._proxy;
            if (!proxy) {
                return null;
            }
            const latency = await this._measureLatency(proxy);
            const down = await this._measureDown(proxy);
            const up = await this._measureUp(proxy);
            return {
                remoteAuthority: this._extensionHost.remoteAuthority,
                latency,
                down,
                up
            };
        }
        async ready() {
            await this._proxy;
        }
        async _measureLatency(proxy) {
            const COUNT = 10;
            let sum = 0;
            for (let i = 0; i < COUNT; i++) {
                const sw = stopwatch_1.StopWatch.create();
                await proxy.test_latency(i);
                sw.stop();
                sum += sw.elapsed();
            }
            return (sum / COUNT);
        }
        static _convert(byteCount, elapsedMillis) {
            return (byteCount * 1000 * 8) / elapsedMillis;
        }
        async _measureUp(proxy) {
            const SIZE = 10 * 1024 * 1024; // 10MB
            const buff = buffer_1.VSBuffer.alloc(SIZE);
            const value = Math.ceil(Math.random() * 256);
            for (let i = 0; i < buff.byteLength; i++) {
                buff.writeUInt8(i, value);
            }
            const sw = stopwatch_1.StopWatch.create();
            await proxy.test_up(buff);
            sw.stop();
            return ExtensionHostManager_1._convert(SIZE, sw.elapsed());
        }
        async _measureDown(proxy) {
            const SIZE = 10 * 1024 * 1024; // 10MB
            const sw = stopwatch_1.StopWatch.create();
            await proxy.test_down(SIZE);
            sw.stop();
            return ExtensionHostManager_1._convert(SIZE, sw.elapsed());
        }
        _createExtensionHostCustomers(kind, protocol) {
            let logger = null;
            if (LOG_EXTENSION_HOST_COMMUNICATION || this._environmentService.logExtensionHostCommunication) {
                logger = new RPCLogger(kind);
            }
            else if (TelemetryRPCLogger.isEnabled()) {
                logger = new TelemetryRPCLogger(this._telemetryService);
            }
            this._rpcProtocol = new rpcProtocol_1.RPCProtocol(protocol, logger);
            this._register(this._rpcProtocol.onDidChangeResponsiveState((responsiveState) => this._onDidChangeResponsiveState.fire(responsiveState)));
            let extensionHostProxy = null;
            let mainProxyIdentifiers = [];
            const extHostContext = {
                remoteAuthority: this._extensionHost.remoteAuthority,
                extensionHostKind: this.kind,
                getProxy: (identifier) => this._rpcProtocol.getProxy(identifier),
                set: (identifier, instance) => this._rpcProtocol.set(identifier, instance),
                dispose: () => this._rpcProtocol.dispose(),
                assertRegistered: (identifiers) => this._rpcProtocol.assertRegistered(identifiers),
                drain: () => this._rpcProtocol.drain(),
                //#region internal
                internalExtensionService: this._internalExtensionService,
                _setExtensionHostProxy: (value) => {
                    extensionHostProxy = value;
                },
                _setAllMainProxyIdentifiers: (value) => {
                    mainProxyIdentifiers = value;
                },
                //#endregion
            };
            // Named customers
            const namedCustomers = extHostCustomers_1.ExtHostCustomersRegistry.getNamedCustomers();
            for (let i = 0, len = namedCustomers.length; i < len; i++) {
                const [id, ctor] = namedCustomers[i];
                try {
                    const instance = this._instantiationService.createInstance(ctor, extHostContext);
                    this._customers.push(instance);
                    this._rpcProtocol.set(id, instance);
                }
                catch (err) {
                    this._logService.error(`Cannot instantiate named customer: '${id.sid}'`);
                    this._logService.error(err);
                    errors.onUnexpectedError(err);
                }
            }
            // Customers
            const customers = extHostCustomers_1.ExtHostCustomersRegistry.getCustomers();
            for (const ctor of customers) {
                try {
                    const instance = this._instantiationService.createInstance(ctor, extHostContext);
                    this._customers.push(instance);
                }
                catch (err) {
                    this._logService.error(err);
                    errors.onUnexpectedError(err);
                }
            }
            if (!extensionHostProxy) {
                throw new Error(`Missing IExtensionHostProxy!`);
            }
            // Check that no named customers are missing
            this._rpcProtocol.assertRegistered(mainProxyIdentifiers);
            return extensionHostProxy;
        }
        async activate(extension, reason) {
            const proxy = await this._proxy;
            if (!proxy) {
                return false;
            }
            return proxy.activate(extension, reason);
        }
        activateByEvent(activationEvent, activationKind) {
            if (activationKind === 1 /* ActivationKind.Immediate */ && !this._hasStarted) {
                return Promise.resolve();
            }
            if (!this._cachedActivationEvents.has(activationEvent)) {
                this._cachedActivationEvents.set(activationEvent, this._activateByEvent(activationEvent, activationKind));
            }
            return this._cachedActivationEvents.get(activationEvent);
        }
        activationEventIsDone(activationEvent) {
            return this._resolvedActivationEvents.has(activationEvent);
        }
        async _activateByEvent(activationEvent, activationKind) {
            if (!this._proxy) {
                return;
            }
            const proxy = await this._proxy;
            if (!proxy) {
                // this case is already covered above and logged.
                // i.e. the extension host could not be started
                return;
            }
            if (!this._extensionHost.extensions.containsActivationEvent(activationEvent)) {
                this._resolvedActivationEvents.add(activationEvent);
                return;
            }
            await proxy.activateByEvent(activationEvent, activationKind);
            this._resolvedActivationEvents.add(activationEvent);
        }
        async getInspectPort(tryEnableInspector) {
            if (this._extensionHost) {
                if (tryEnableInspector) {
                    await this._extensionHost.enableInspectPort();
                }
                const port = this._extensionHost.getInspectPort();
                if (port) {
                    return port;
                }
            }
            return undefined;
        }
        async resolveAuthority(remoteAuthority, resolveAttempt) {
            const sw = stopwatch_1.StopWatch.create(false);
            const prefix = () => `[${(0, extensionHostKind_1.extensionHostKindToString)(this._extensionHost.runningLocation.kind)}${this._extensionHost.runningLocation.affinity}][resolveAuthority(${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)},${resolveAttempt})][${sw.elapsed()}ms] `;
            const logInfo = (msg) => this._logService.info(`${prefix()}${msg}`);
            const logError = (msg, err = undefined) => this._logService.error(`${prefix()}${msg}`, err);
            logInfo(`obtaining proxy...`);
            const proxy = await this._proxy;
            if (!proxy) {
                logError(`no proxy`);
                return {
                    type: 'error',
                    error: {
                        message: `Cannot resolve authority`,
                        code: remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown,
                        detail: undefined
                    }
                };
            }
            logInfo(`invoking...`);
            const intervalLogger = new async_1.IntervalTimer();
            try {
                intervalLogger.cancelAndSet(() => logInfo('waiting...'), 1000);
                const resolverResult = await proxy.resolveAuthority(remoteAuthority, resolveAttempt);
                intervalLogger.dispose();
                if (resolverResult.type === 'ok') {
                    logInfo(`returned ${resolverResult.value.authority.connectTo}`);
                }
                else {
                    logError(`returned an error`, resolverResult.error);
                }
                return resolverResult;
            }
            catch (err) {
                intervalLogger.dispose();
                logError(`returned an error`, err);
                return {
                    type: 'error',
                    error: {
                        message: err.message,
                        code: remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown,
                        detail: err
                    }
                };
            }
        }
        async getCanonicalURI(remoteAuthority, uri) {
            const proxy = await this._proxy;
            if (!proxy) {
                throw new Error(`Cannot resolve canonical URI`);
            }
            return proxy.getCanonicalURI(remoteAuthority, uri);
        }
        async start(extensionRegistryVersionId, allExtensions, myExtensions) {
            const proxy = await this._proxy;
            if (!proxy) {
                return;
            }
            const deltaExtensions = this._extensionHost.extensions.set(extensionRegistryVersionId, allExtensions, myExtensions);
            return proxy.startExtensionHost(deltaExtensions);
        }
        async extensionTestsExecute() {
            const proxy = await this._proxy;
            if (!proxy) {
                throw new Error('Could not obtain Extension Host Proxy');
            }
            return proxy.extensionTestsExecute();
        }
        representsRunningLocation(runningLocation) {
            return this._extensionHost.runningLocation.equals(runningLocation);
        }
        async deltaExtensions(incomingExtensionsDelta) {
            const proxy = await this._proxy;
            if (!proxy) {
                return;
            }
            const outgoingExtensionsDelta = this._extensionHost.extensions.delta(incomingExtensionsDelta);
            if (!outgoingExtensionsDelta) {
                // The extension host already has this version of the extensions.
                return;
            }
            return proxy.deltaExtensions(outgoingExtensionsDelta);
        }
        containsExtension(extensionId) {
            return this._extensionHost.extensions?.containsExtension(extensionId) ?? false;
        }
        async setRemoteEnvironment(env) {
            const proxy = await this._proxy;
            if (!proxy) {
                return;
            }
            return proxy.setRemoteEnvironment(env);
        }
    };
    exports.ExtensionHostManager = ExtensionHostManager;
    exports.ExtensionHostManager = ExtensionHostManager = ExtensionHostManager_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, log_1.ILogService)
    ], ExtensionHostManager);
    function friendlyExtHostName(kind, pid) {
        if (pid) {
            return `${(0, extensionHostKind_1.extensionHostKindToString)(kind)} pid: ${pid}`;
        }
        return `${(0, extensionHostKind_1.extensionHostKindToString)(kind)}`;
    }
    const colorTables = [
        ['#2977B1', '#FC802D', '#34A13A', '#D3282F', '#9366BA'],
        ['#8B564C', '#E177C0', '#7F7F7F', '#BBBE3D', '#2EBECD']
    ];
    function prettyWithoutArrays(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && typeof data === 'object' && typeof data.toString === 'function') {
            const result = data.toString();
            if (result !== '[object Object]') {
                return result;
            }
        }
        return data;
    }
    function pretty(data) {
        if (Array.isArray(data)) {
            return data.map(prettyWithoutArrays);
        }
        return prettyWithoutArrays(data);
    }
    class RPCLogger {
        constructor(_kind) {
            this._kind = _kind;
            this._totalIncoming = 0;
            this._totalOutgoing = 0;
        }
        _log(direction, totalLength, msgLength, req, initiator, str, data) {
            data = pretty(data);
            const colorTable = colorTables[initiator];
            const color = LOG_USE_COLORS ? colorTable[req % colorTable.length] : '#000000';
            let args = [`%c[${(0, extensionHostKind_1.extensionHostKindToString)(this._kind)}][${direction}]%c[${String(totalLength).padStart(7)}]%c[len: ${String(msgLength).padStart(5)}]%c${String(req).padStart(5)} - ${str}`, 'color: darkgreen', 'color: grey', 'color: grey', `color: ${color}`];
            if (/\($/.test(str)) {
                args = args.concat(data);
                args.push(')');
            }
            else {
                args.push(data);
            }
            console.log.apply(console, args);
        }
        logIncoming(msgLength, req, initiator, str, data) {
            this._totalIncoming += msgLength;
            this._log('Ext \u2192 Win', this._totalIncoming, msgLength, req, initiator, str, data);
        }
        logOutgoing(msgLength, req, initiator, str, data) {
            this._totalOutgoing += msgLength;
            this._log('Win \u2192 Ext', this._totalOutgoing, msgLength, req, initiator, str, data);
        }
    }
    let TelemetryRPCLogger = class TelemetryRPCLogger {
        static isEnabled() {
            // this will be a very high frequency event, so we only log a small percentage of them
            return Math.trunc(Math.random() * 1000) < 0.5;
        }
        constructor(_telemetryService) {
            this._telemetryService = _telemetryService;
            this._pendingRequests = new Map();
        }
        logIncoming(msgLength, req, initiator, str) {
            if (initiator === 0 /* RequestInitiator.LocalSide */ && /^receiveReply(Err)?:/.test(str)) {
                // log the size of reply messages
                const requestStr = this._pendingRequests.get(req) ?? 'unknown_reply';
                this._pendingRequests.delete(req);
                this._telemetryService.publicLog2('extensionhost.incoming', {
                    type: `${str} ${requestStr}`,
                    length: msgLength
                });
            }
            if (initiator === 1 /* RequestInitiator.OtherSide */ && /^receiveRequest /.test(str)) {
                // incoming request
                this._telemetryService.publicLog2('extensionhost.incoming', {
                    type: `${str}`,
                    length: msgLength
                });
            }
        }
        logOutgoing(msgLength, req, initiator, str) {
            if (initiator === 0 /* RequestInitiator.LocalSide */ && str.startsWith('request: ')) {
                this._pendingRequests.set(req, str);
                this._telemetryService.publicLog2('extensionhost.outgoing', {
                    type: str,
                    length: msgLength
                });
            }
        }
    };
    TelemetryRPCLogger = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], TelemetryRPCLogger);
    const providers = [];
    function registerLatencyTestProvider(provider) {
        providers.push(provider);
        return {
            dispose: () => {
                for (let i = 0; i < providers.length; i++) {
                    if (providers[i] === provider) {
                        providers.splice(i, 1);
                        return;
                    }
                }
            }
        };
    }
    function getLatencyTestProviders() {
        return providers.slice(0);
    }
    (0, actions_1.registerAction2)(class MeasureExtHostLatencyAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'editor.action.measureExtHostLatency',
                title: nls.localize2('measureExtHostLatency', "Measure Extension Host Latency"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const measurements = await Promise.all(getLatencyTestProviders().map(provider => provider.measure()));
            editorService.openEditor({ resource: undefined, contents: measurements.map(MeasureExtHostLatencyAction._print).join('\n\n'), options: { pinned: true } });
        }
        static _print(m) {
            if (!m) {
                return '';
            }
            return `${m.remoteAuthority ? `Authority: ${m.remoteAuthority}\n` : ``}Roundtrip latency: ${m.latency.toFixed(3)}ms\nUp: ${MeasureExtHostLatencyAction._printSpeed(m.up)}\nDown: ${MeasureExtHostLatencyAction._printSpeed(m.down)}\n`;
        }
        static _printSpeed(n) {
            if (n <= 1024) {
                return `${n} bps`;
            }
            if (n < 1024 * 1024) {
                return `${(n / 1024).toFixed(1)} kbps`;
            }
            return `${(n / 1024 / 1024).toFixed(1)} Mbps`;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9jb21tb24vZXh0ZW5zaW9uSG9zdE1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9kaEcsa0RBS0M7SUEzYkQsaUZBQWlGO0lBQ2pGLE1BQU0sZ0NBQWdDLEdBQUcsS0FBSyxDQUFDO0lBQy9DLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQztJQXNCckIsSUFBTSxvQkFBb0IsNEJBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFrQm5ELElBQVcsR0FBRztZQUNiLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUM7UUFDaEMsQ0FBQztRQUVELElBQVcsSUFBSTtZQUNkLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDO1FBQ2pELENBQUM7UUFFRCxJQUFXLE9BQU87WUFDakIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQztRQUNwQyxDQUFDO1FBRUQsSUFBVyxXQUFXO1lBQ3JCLE9BQU8sbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELFlBQ0MsYUFBNkIsRUFDN0IsdUJBQWlDLEVBQ2hCLHlCQUFvRCxFQUM5QyxxQkFBNkQsRUFDdEQsbUJBQWtFLEVBQzdFLGlCQUFxRCxFQUMzRCxXQUF5QztZQUV0RCxLQUFLLEVBQUUsQ0FBQztZQU5TLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBMkI7WUFDN0IsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNyQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENB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