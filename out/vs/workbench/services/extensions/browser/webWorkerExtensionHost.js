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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/iframe", "vs/base/browser/window", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/label/common/label", "vs/platform/layout/browser/layoutService", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/extensions/common/extensionHostProtocol"], function (require, exports, dom, iframe_1, window_1, async_1, buffer_1, errors_1, event_1, lifecycle_1, network_1, platform, resources_1, uri_1, uuid_1, label_1, layoutService_1, log_1, productService_1, storage_1, telemetry_1, telemetryUtils_1, userDataProfile_1, workspace_1, environmentService_1, extensionHostProtocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebWorkerExtensionHost = void 0;
    let WebWorkerExtensionHost = class WebWorkerExtensionHost extends lifecycle_1.Disposable {
        constructor(runningLocation, startup, _initDataProvider, _telemetryService, _contextService, _labelService, _logService, _loggerService, _environmentService, _userDataProfilesService, _productService, _layoutService, _storageService) {
            super();
            this.runningLocation = runningLocation;
            this.startup = startup;
            this._initDataProvider = _initDataProvider;
            this._telemetryService = _telemetryService;
            this._contextService = _contextService;
            this._labelService = _labelService;
            this._logService = _logService;
            this._loggerService = _loggerService;
            this._environmentService = _environmentService;
            this._userDataProfilesService = _userDataProfilesService;
            this._productService = _productService;
            this._layoutService = _layoutService;
            this._storageService = _storageService;
            this.pid = null;
            this.remoteAuthority = null;
            this.extensions = null;
            this._onDidExit = this._register(new event_1.Emitter());
            this.onExit = this._onDidExit.event;
            this._isTerminating = false;
            this._protocolPromise = null;
            this._protocol = null;
            this._extensionHostLogsLocation = (0, resources_1.joinPath)(this._environmentService.extHostLogsPath, 'webWorker');
        }
        async _getWebWorkerExtensionHostIframeSrc() {
            const suffixSearchParams = new URLSearchParams();
            if (this._environmentService.debugExtensionHost && this._environmentService.debugRenderer) {
                suffixSearchParams.set('debugged', '1');
            }
            network_1.COI.addSearchParam(suffixSearchParams, true, true);
            const suffix = `?${suffixSearchParams.toString()}`;
            const iframeModulePath = 'vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.html';
            if (platform.isWeb) {
                const webEndpointUrlTemplate = this._productService.webEndpointUrlTemplate;
                const commit = this._productService.commit;
                const quality = this._productService.quality;
                if (webEndpointUrlTemplate && commit && quality) {
                    // Try to keep the web worker extension host iframe origin stable by storing it in workspace storage
                    const key = 'webWorkerExtensionHostIframeStableOriginUUID';
                    let stableOriginUUID = this._storageService.get(key, 1 /* StorageScope.WORKSPACE */);
                    if (typeof stableOriginUUID === 'undefined') {
                        stableOriginUUID = (0, uuid_1.generateUuid)();
                        this._storageService.store(key, stableOriginUUID, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                    }
                    const hash = await (0, iframe_1.parentOriginHash)(window_1.mainWindow.origin, stableOriginUUID);
                    const baseUrl = (webEndpointUrlTemplate
                        .replace('{{uuid}}', `v--${hash}`) // using `v--` as a marker to require `parentOrigin`/`salt` verification
                        .replace('{{commit}}', commit)
                        .replace('{{quality}}', quality));
                    const res = new URL(`${baseUrl}/out/${iframeModulePath}${suffix}`);
                    res.searchParams.set('parentOrigin', window_1.mainWindow.origin);
                    res.searchParams.set('salt', stableOriginUUID);
                    return res.toString();
                }
                console.warn(`The web worker extension host is started in a same-origin iframe!`);
            }
            const relativeExtensionHostIframeSrc = network_1.FileAccess.asBrowserUri(iframeModulePath);
            return `${relativeExtensionHostIframeSrc.toString(true)}${suffix}`;
        }
        async start() {
            if (!this._protocolPromise) {
                this._protocolPromise = this._startInsideIframe();
                this._protocolPromise.then(protocol => this._protocol = protocol);
            }
            return this._protocolPromise;
        }
        async _startInsideIframe() {
            const webWorkerExtensionHostIframeSrc = await this._getWebWorkerExtensionHostIframeSrc();
            const emitter = this._register(new event_1.Emitter());
            const iframe = document.createElement('iframe');
            iframe.setAttribute('class', 'web-worker-ext-host-iframe');
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            iframe.setAttribute('allow', 'usb; serial; hid; cross-origin-isolated;');
            iframe.setAttribute('aria-hidden', 'true');
            iframe.style.display = 'none';
            const vscodeWebWorkerExtHostId = (0, uuid_1.generateUuid)();
            iframe.setAttribute('src', `${webWorkerExtensionHostIframeSrc}&vscodeWebWorkerExtHostId=${vscodeWebWorkerExtHostId}`);
            const barrier = new async_1.Barrier();
            let port;
            let barrierError = null;
            let barrierHasError = false;
            let startTimeout = null;
            const rejectBarrier = (exitCode, error) => {
                barrierError = error;
                barrierHasError = true;
                (0, errors_1.onUnexpectedError)(barrierError);
                clearTimeout(startTimeout);
                this._onDidExit.fire([81 /* ExtensionHostExitCode.UnexpectedError */, barrierError.message]);
                barrier.open();
            };
            const resolveBarrier = (messagePort) => {
                port = messagePort;
                clearTimeout(startTimeout);
                barrier.open();
            };
            startTimeout = setTimeout(() => {
                console.warn(`The Web Worker Extension Host did not start in 60s, that might be a problem.`);
            }, 60000);
            this._register(dom.addDisposableListener(window_1.mainWindow, 'message', (event) => {
                if (event.source !== iframe.contentWindow) {
                    return;
                }
                if (event.data.vscodeWebWorkerExtHostId !== vscodeWebWorkerExtHostId) {
                    return;
                }
                if (event.data.error) {
                    const { name, message, stack } = event.data.error;
                    const err = new Error();
                    err.message = message;
                    err.name = name;
                    err.stack = stack;
                    return rejectBarrier(81 /* ExtensionHostExitCode.UnexpectedError */, err);
                }
                const { data } = event.data;
                if (barrier.isOpen() || !(data instanceof MessagePort)) {
                    console.warn('UNEXPECTED message', event);
                    const err = new Error('UNEXPECTED message');
                    return rejectBarrier(81 /* ExtensionHostExitCode.UnexpectedError */, err);
                }
                resolveBarrier(data);
            }));
            this._layoutService.mainContainer.appendChild(iframe);
            this._register((0, lifecycle_1.toDisposable)(() => iframe.remove()));
            // await MessagePort and use it to directly communicate
            // with the worker extension host
            await barrier.wait();
            if (barrierHasError) {
                throw barrierError;
            }
            // Send over message ports for extension API
            const messagePorts = this._environmentService.options?.messagePorts ?? new Map();
            iframe.contentWindow.postMessage({ type: 'vscode.init', data: messagePorts }, '*', [...messagePorts.values()]);
            port.onmessage = (event) => {
                const { data } = event;
                if (!(data instanceof ArrayBuffer)) {
                    console.warn('UNKNOWN data received', data);
                    this._onDidExit.fire([77, 'UNKNOWN data received']);
                    return;
                }
                emitter.fire(buffer_1.VSBuffer.wrap(new Uint8Array(data, 0, data.byteLength)));
            };
            const protocol = {
                onMessage: emitter.event,
                send: vsbuf => {
                    const data = vsbuf.buffer.buffer.slice(vsbuf.buffer.byteOffset, vsbuf.buffer.byteOffset + vsbuf.buffer.byteLength);
                    port.postMessage(data, [data]);
                }
            };
            return this._performHandshake(protocol);
        }
        async _performHandshake(protocol) {
            // extension host handshake happens below
            // (1) <== wait for: Ready
            // (2) ==> send: init data
            // (3) <== wait for: Initialized
            await event_1.Event.toPromise(event_1.Event.filter(protocol.onMessage, msg => (0, extensionHostProtocol_1.isMessageOfType)(msg, 1 /* MessageType.Ready */)));
            if (this._isTerminating) {
                throw (0, errors_1.canceled)();
            }
            protocol.send(buffer_1.VSBuffer.fromString(JSON.stringify(await this._createExtHostInitData())));
            if (this._isTerminating) {
                throw (0, errors_1.canceled)();
            }
            await event_1.Event.toPromise(event_1.Event.filter(protocol.onMessage, msg => (0, extensionHostProtocol_1.isMessageOfType)(msg, 0 /* MessageType.Initialized */)));
            if (this._isTerminating) {
                throw (0, errors_1.canceled)();
            }
            return protocol;
        }
        dispose() {
            if (this._isTerminating) {
                return;
            }
            this._isTerminating = true;
            this._protocol?.send((0, extensionHostProtocol_1.createMessageOfType)(2 /* MessageType.Terminate */));
            super.dispose();
        }
        getInspectPort() {
            return undefined;
        }
        enableInspectPort() {
            return Promise.resolve(false);
        }
        async _createExtHostInitData() {
            const initData = await this._initDataProvider.getInitData();
            this.extensions = initData.extensions;
            const workspace = this._contextService.getWorkspace();
            const nlsBaseUrl = this._productService.extensionsGallery?.nlsBaseUrl;
            let nlsUrlWithDetails = undefined;
            // Only use the nlsBaseUrl if we are using a language other than the default, English.
            if (nlsBaseUrl && this._productService.commit && !platform.Language.isDefaultVariant()) {
                nlsUrlWithDetails = uri_1.URI.joinPath(uri_1.URI.parse(nlsBaseUrl), this._productService.commit, this._productService.version, platform.Language.value());
            }
            return {
                commit: this._productService.commit,
                version: this._productService.version,
                quality: this._productService.quality,
                parentPid: 0,
                environment: {
                    isExtensionDevelopmentDebug: this._environmentService.debugRenderer,
                    appName: this._productService.nameLong,
                    appHost: this._productService.embedderIdentifier ?? (platform.isWeb ? 'web' : 'desktop'),
                    appUriScheme: this._productService.urlProtocol,
                    appLanguage: platform.language,
                    extensionTelemetryLogResource: this._environmentService.extHostTelemetryLogFile,
                    isExtensionTelemetryLoggingOnly: (0, telemetryUtils_1.isLoggingOnly)(this._productService, this._environmentService),
                    extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
                    extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
                    globalStorageHome: this._userDataProfilesService.defaultProfile.globalStorageHome,
                    workspaceStorageHome: this._environmentService.workspaceStorageHome,
                    extensionLogLevel: this._environmentService.extensionLogLevel
                },
                workspace: this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ? undefined : {
                    configuration: workspace.configuration || undefined,
                    id: workspace.id,
                    name: this._labelService.getWorkspaceLabel(workspace),
                    transient: workspace.transient
                },
                consoleForward: {
                    includeStack: false,
                    logNative: this._environmentService.debugRenderer
                },
                extensions: this.extensions.toSnapshot(),
                nlsBaseUrl: nlsUrlWithDetails,
                telemetryInfo: {
                    sessionId: this._telemetryService.sessionId,
                    machineId: this._telemetryService.machineId,
                    sqmId: this._telemetryService.sqmId,
                    firstSessionDate: this._telemetryService.firstSessionDate,
                    msftInternal: this._telemetryService.msftInternal
                },
                logLevel: this._logService.getLevel(),
                loggers: [...this._loggerService.getRegisteredLoggers()],
                logsLocation: this._extensionHostLogsLocation,
                autoStart: (this.startup === 1 /* ExtensionHostStartup.EagerAutoStart */),
                remote: {
                    authority: this._environmentService.remoteAuthority,
                    connectionData: null,
                    isRemote: false
                },
                uiKind: platform.isWeb ? extensionHostProtocol_1.UIKind.Web : extensionHostProtocol_1.UIKind.Desktop
            };
        }
    };
    exports.WebWorkerExtensionHost = WebWorkerExtensionHost;
    exports.WebWorkerExtensionHost = WebWorkerExtensionHost = __decorate([
        __param(3, telemetry_1.ITelemetryService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, label_1.ILabelService),
        __param(6, log_1.ILogService),
        __param(7, log_1.ILoggerService),
        __param(8, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(9, userDataProfile_1.IUserDataProfilesService),
        __param(10, productService_1.IProductService),
        __param(11, layoutService_1.ILayoutService),
        __param(12, storage_1.IStorageService)
    ], WebWorkerExtensionHost);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViV29ya2VyRXh0ZW5zaW9uSG9zdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2Jyb3dzZXIvd2ViV29ya2VyRXh0ZW5zaW9uSG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQ3pGLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEsc0JBQVU7UUFlckQsWUFDaUIsZUFBOEMsRUFDOUMsT0FBNkIsRUFDNUIsaUJBQXNELEVBQ3BELGlCQUFxRCxFQUM5QyxlQUEwRCxFQUNyRSxhQUE2QyxFQUMvQyxXQUF5QyxFQUN0QyxjQUErQyxFQUMxQixtQkFBeUUsRUFDcEYsd0JBQW1FLEVBQzVFLGVBQWlELEVBQ2xELGNBQStDLEVBQzlDLGVBQWlEO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBZFEsb0JBQWUsR0FBZixlQUFlLENBQStCO1lBQzlDLFlBQU8sR0FBUCxPQUFPLENBQXNCO1lBQzVCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBcUM7WUFDbkMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUM3QixvQkFBZSxHQUFmLGVBQWUsQ0FBMEI7WUFDcEQsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDOUIsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDckIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ1Qsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQztZQUNuRSw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQzNELG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNqQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDN0Isb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBMUJuRCxRQUFHLEdBQUcsSUFBSSxDQUFDO1lBQ1gsb0JB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