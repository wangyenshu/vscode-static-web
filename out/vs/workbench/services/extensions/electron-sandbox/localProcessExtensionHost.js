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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/processes", "vs/base/common/stopwatch", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/electron-sandbox/ipc.mp", "vs/nls", "vs/platform/debug/common/extensionHostDebug", "vs/platform/extensions/common/extensionHostStarter", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/native/common/native", "vs/platform/notification/common/notification", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/environment/electron-sandbox/shellEnvironmentService", "vs/workbench/services/extensions/common/extensionHostEnv", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/services/host/browser/host", "vs/workbench/services/lifecycle/common/lifecycle", "../common/extensionDevOptions"], function (require, exports, async_1, buffer_1, errors_1, event_1, lifecycle_1, objects, platform, processes_1, stopwatch_1, uri_1, uuid_1, ipc_net_1, ipc_mp_1, nls, extensionHostDebug_1, extensionHostStarter_1, label_1, log_1, native_1, notification_1, productService_1, telemetry_1, telemetryUtils_1, userDataProfile_1, workspace_1, environmentService_1, shellEnvironmentService_1, extensionHostEnv_1, extensionHostProtocol_1, host_1, lifecycle_2, extensionDevOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLocalProcessExtensionHost = exports.ExtensionHostProcess = void 0;
    class ExtensionHostProcess {
        get onStdout() {
            return this._extensionHostStarter.onDynamicStdout(this._id);
        }
        get onStderr() {
            return this._extensionHostStarter.onDynamicStderr(this._id);
        }
        get onMessage() {
            return this._extensionHostStarter.onDynamicMessage(this._id);
        }
        get onExit() {
            return this._extensionHostStarter.onDynamicExit(this._id);
        }
        constructor(id, _extensionHostStarter) {
            this._extensionHostStarter = _extensionHostStarter;
            this._id = id;
        }
        start(opts) {
            return this._extensionHostStarter.start(this._id, opts);
        }
        enableInspectPort() {
            return this._extensionHostStarter.enableInspectPort(this._id);
        }
        kill() {
            return this._extensionHostStarter.kill(this._id);
        }
    }
    exports.ExtensionHostProcess = ExtensionHostProcess;
    let NativeLocalProcessExtensionHost = class NativeLocalProcessExtensionHost {
        constructor(runningLocation, startup, _initDataProvider, _contextService, _notificationService, _nativeHostService, _lifecycleService, _environmentService, _userDataProfilesService, _telemetryService, _logService, _loggerService, _labelService, _extensionHostDebugService, _hostService, _productService, _shellEnvironmentService, _extensionHostStarter) {
            this.runningLocation = runningLocation;
            this.startup = startup;
            this._initDataProvider = _initDataProvider;
            this._contextService = _contextService;
            this._notificationService = _notificationService;
            this._nativeHostService = _nativeHostService;
            this._lifecycleService = _lifecycleService;
            this._environmentService = _environmentService;
            this._userDataProfilesService = _userDataProfilesService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._loggerService = _loggerService;
            this._labelService = _labelService;
            this._extensionHostDebugService = _extensionHostDebugService;
            this._hostService = _hostService;
            this._productService = _productService;
            this._shellEnvironmentService = _shellEnvironmentService;
            this._extensionHostStarter = _extensionHostStarter;
            this.pid = null;
            this.remoteAuthority = null;
            this.extensions = null;
            this._onExit = new event_1.Emitter();
            this.onExit = this._onExit.event;
            this._onDidSetInspectPort = new event_1.Emitter();
            this._toDispose = new lifecycle_1.DisposableStore();
            const devOpts = (0, extensionDevOptions_1.parseExtensionDevOptions)(this._environmentService);
            this._isExtensionDevHost = devOpts.isExtensionDevHost;
            this._isExtensionDevDebug = devOpts.isExtensionDevDebug;
            this._isExtensionDevDebugBrk = devOpts.isExtensionDevDebugBrk;
            this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
            this._terminating = false;
            this._inspectListener = null;
            this._extensionHostProcess = null;
            this._messageProtocol = null;
            this._toDispose.add(this._onExit);
            this._toDispose.add(this._lifecycleService.onWillShutdown(e => this._onWillShutdown(e)));
            this._toDispose.add(this._extensionHostDebugService.onClose(event => {
                if (this._isExtensionDevHost && this._environmentService.debugExtensionHost.debugId === event.sessionId) {
                    this._nativeHostService.closeWindow();
                }
            }));
            this._toDispose.add(this._extensionHostDebugService.onReload(event => {
                if (this._isExtensionDevHost && this._environmentService.debugExtensionHost.debugId === event.sessionId) {
                    this._hostService.reload();
                }
            }));
        }
        dispose() {
            if (this._terminating) {
                return;
            }
            this._terminating = true;
            this._toDispose.dispose();
        }
        start() {
            if (this._terminating) {
                // .terminate() was called
                throw new errors_1.CancellationError();
            }
            if (!this._messageProtocol) {
                this._messageProtocol = this._start();
            }
            return this._messageProtocol;
        }
        async _start() {
            const [extensionHostCreationResult, portNumber, processEnv] = await Promise.all([
                this._extensionHostStarter.createExtensionHost(),
                this._tryFindDebugPort(),
                this._shellEnvironmentService.getShellEnv(),
            ]);
            this._extensionHostProcess = new ExtensionHostProcess(extensionHostCreationResult.id, this._extensionHostStarter);
            const env = objects.mixin(processEnv, {
                VSCODE_AMD_ENTRYPOINT: 'vs/workbench/api/node/extensionHostProcess',
                VSCODE_HANDLES_UNCAUGHT_ERRORS: true
            });
            if (this._environmentService.debugExtensionHost.env) {
                objects.mixin(env, this._environmentService.debugExtensionHost.env);
            }
            (0, processes_1.removeDangerousEnvVariables)(env);
            if (this._isExtensionDevHost) {
                // Unset `VSCODE_CODE_CACHE_PATH` when developing extensions because it might
                // be that dependencies, that otherwise would be cached, get modified.
                delete env['VSCODE_CODE_CACHE_PATH'];
            }
            const opts = {
                responseWindowId: this._nativeHostService.windowId,
                responseChannel: 'vscode:startExtensionHostMessagePortResult',
                responseNonce: (0, uuid_1.generateUuid)(),
                env,
                // We only detach the extension host on windows. Linux and Mac orphan by default
                // and detach under Linux and Mac create another process group.
                // We detach because we have noticed that when the renderer exits, its child processes
                // (i.e. extension host) are taken down in a brutal fashion by the OS
                detached: !!platform.isWindows,
                execArgv: undefined,
                silent: true
            };
            const inspectHost = '127.0.0.1';
            if (portNumber !== 0) {
                opts.execArgv = [
                    '--nolazy',
                    (this._isExtensionDevDebugBrk ? '--inspect-brk=' : '--inspect=') + `${inspectHost}:${portNumber}`
                ];
            }
            else {
                opts.execArgv = ['--inspect-port=0'];
            }
            if (this._environmentService.extensionTestsLocationURI) {
                opts.execArgv.unshift('--expose-gc');
            }
            if (this._environmentService.args['prof-v8-extensions']) {
                opts.execArgv.unshift('--prof');
            }
            // Refs https://github.com/microsoft/vscode/issues/189805
            opts.execArgv.unshift('--dns-result-order=ipv4first');
            const onStdout = this._handleProcessOutputStream(this._extensionHostProcess.onStdout, this._toDispose);
            const onStderr = this._handleProcessOutputStream(this._extensionHostProcess.onStderr, this._toDispose);
            const onOutput = event_1.Event.any(event_1.Event.map(onStdout.event, o => ({ data: `%c${o}`, format: [''] })), event_1.Event.map(onStderr.event, o => ({ data: `%c${o}`, format: ['color: red'] })));
            // Debounce all output, so we can render it in the Chrome console as a group
            const onDebouncedOutput = event_1.Event.debounce(onOutput, (r, o) => {
                return r
                    ? { data: r.data + o.data, format: [...r.format, ...o.format] }
                    : { data: o.data, format: o.format };
            }, 100);
            // Print out extension host output
            this._toDispose.add(onDebouncedOutput(output => {
                const inspectorUrlMatch = output.data && output.data.match(/ws:\/\/([^\s]+):(\d+)\/[^\s]+/);
                if (inspectorUrlMatch) {
                    const [, host, port] = inspectorUrlMatch;
                    if (!this._environmentService.isBuilt && !this._isExtensionDevTestFromCli) {
                        console.log(`%c[Extension Host] %cdebugger inspector at devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=${inspectorUrlMatch[1]}`, 'color: blue', 'color:');
                    }
                    if (!this._inspectListener) {
                        this._inspectListener = { host, port: Number(port) };
                        this._onDidSetInspectPort.fire();
                    }
                }
                else {
                    if (!this._isExtensionDevTestFromCli) {
                        console.group('Extension Host');
                        console.log(output.data, ...output.format);
                        console.groupEnd();
                    }
                }
            }));
            // Lifecycle
            this._extensionHostProcess.onExit(({ code, signal }) => this._onExtHostProcessExit(code, signal));
            // Notify debugger that we are ready to attach to the process if we run a development extension
            if (portNumber) {
                if (this._isExtensionDevHost && this._isExtensionDevDebug && this._environmentService.debugExtensionHost.debugId) {
                    this._extensionHostDebugService.attachSession(this._environmentService.debugExtensionHost.debugId, portNumber);
                }
                this._inspectListener = { port: portNumber, host: inspectHost };
                this._onDidSetInspectPort.fire();
            }
            // Help in case we fail to start it
            let startupTimeoutHandle;
            if (!this._environmentService.isBuilt && !this._environmentService.remoteAuthority || this._isExtensionDevHost) {
                startupTimeoutHandle = setTimeout(() => {
                    this._logService.error(`[LocalProcessExtensionHost]: Extension host did not start in 10 seconds (debugBrk: ${this._isExtensionDevDebugBrk})`);
                    const msg = this._isExtensionDevDebugBrk
                        ? nls.localize('extensionHost.startupFailDebug', "Extension host did not start in 10 seconds, it might be stopped on the first line and needs a debugger to continue.")
                        : nls.localize('extensionHost.startupFail', "Extension host did not start in 10 seconds, that might be a problem.");
                    this._notificationService.prompt(notification_1.Severity.Warning, msg, [{
                            label: nls.localize('reloadWindow', "Reload Window"),
                            run: () => this._hostService.reload()
                        }], {
                        sticky: true,
                        priority: notification_1.NotificationPriority.URGENT
                    });
                }, 10000);
            }
            // Initialize extension host process with hand shakes
            const protocol = await this._establishProtocol(this._extensionHostProcess, opts);
            await this._performHandshake(protocol);
            clearTimeout(startupTimeoutHandle);
            return protocol;
        }
        /**
         * Find a free port if extension host debugging is enabled.
         */
        async _tryFindDebugPort() {
            if (typeof this._environmentService.debugExtensionHost.port !== 'number') {
                return 0;
            }
            const expected = this._environmentService.debugExtensionHost.port;
            const port = await this._nativeHostService.findFreePort(expected, 10 /* try 10 ports */, 5000 /* try up to 5 seconds */, 2048 /* skip 2048 ports between attempts */);
            if (!this._isExtensionDevTestFromCli) {
                if (!port) {
                    console.warn('%c[Extension Host] %cCould not find a free port for debugging', 'color: blue', 'color:');
                }
                else {
                    if (port !== expected) {
                        console.warn(`%c[Extension Host] %cProvided debugging port ${expected} is not free, using ${port} instead.`, 'color: blue', 'color:');
                    }
                    if (this._isExtensionDevDebugBrk) {
                        console.warn(`%c[Extension Host] %cSTOPPED on first line for debugging on port ${port}`, 'color: blue', 'color:');
                    }
                    else {
                        console.info(`%c[Extension Host] %cdebugger listening on port ${port}`, 'color: blue', 'color:');
                    }
                }
            }
            return port || 0;
        }
        _establishProtocol(extensionHostProcess, opts) {
            (0, extensionHostEnv_1.writeExtHostConnection)(new extensionHostEnv_1.MessagePortExtHostConnection(), opts.env);
            // Get ready to acquire the message port from the shared process worker
            const portPromise = (0, ipc_mp_1.acquirePort)(undefined /* we trigger the request via service call! */, opts.responseChannel, opts.responseNonce);
            return new Promise((resolve, reject) => {
                const handle = setTimeout(() => {
                    reject('The local extension host took longer than 60s to connect.');
                }, 60 * 1000);
                portPromise.then((port) => {
                    this._toDispose.add((0, lifecycle_1.toDisposable)(() => {
                        // Close the message port when the extension host is disposed
                        port.close();
                    }));
                    clearTimeout(handle);
                    const onMessage = new ipc_net_1.BufferedEmitter();
                    port.onmessage = ((e) => {
                        if (e.data) {
                            onMessage.fire(buffer_1.VSBuffer.wrap(e.data));
                        }
                    });
                    port.start();
                    resolve({
                        onMessage: onMessage.event,
                        send: message => port.postMessage(message.buffer),
                    });
                });
                // Now that the message port listener is installed, start the ext host process
                const sw = stopwatch_1.StopWatch.create(false);
                extensionHostProcess.start(opts).then(({ pid }) => {
                    if (pid) {
                        this.pid = pid;
                    }
                    this._logService.info(`Started local extension host with pid ${pid}.`);
                    const duration = sw.elapsed();
                    if (platform.isCI) {
                        this._logService.info(`IExtensionHostStarter.start() took ${duration} ms.`);
                    }
                }, (err) => {
                    // Starting the ext host process resulted in an error
                    reject(err);
                });
            });
        }
        _performHandshake(protocol) {
            // 1) wait for the incoming `ready` event and send the initialization data.
            // 2) wait for the incoming `initialized` event.
            return new Promise((resolve, reject) => {
                let timeoutHandle;
                const installTimeoutCheck = () => {
                    timeoutHandle = setTimeout(() => {
                        reject('The local extension host took longer than 60s to send its ready message.');
                    }, 60 * 1000);
                };
                const uninstallTimeoutCheck = () => {
                    clearTimeout(timeoutHandle);
                };
                // Wait 60s for the ready message
                installTimeoutCheck();
                const disposable = protocol.onMessage(msg => {
                    if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 1 /* MessageType.Ready */)) {
                        // 1) Extension Host is ready to receive messages, initialize it
                        uninstallTimeoutCheck();
                        this._createExtHostInitData().then(data => {
                            // Wait 60s for the initialized message
                            installTimeoutCheck();
                            protocol.send(buffer_1.VSBuffer.fromString(JSON.stringify(data)));
                        });
                        return;
                    }
                    if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 0 /* MessageType.Initialized */)) {
                        // 2) Extension Host is initialized
                        uninstallTimeoutCheck();
                        // stop listening for messages here
                        disposable.dispose();
                        // release this promise
                        resolve();
                        return;
                    }
                    console.error(`received unexpected message during handshake phase from the extension host: `, msg);
                });
            });
        }
        async _createExtHostInitData() {
            const initData = await this._initDataProvider.getInitData();
            this.extensions = initData.extensions;
            const workspace = this._contextService.getWorkspace();
            return {
                commit: this._productService.commit,
                version: this._productService.version,
                quality: this._productService.quality,
                parentPid: 0,
                environment: {
                    isExtensionDevelopmentDebug: this._isExtensionDevDebug,
                    appRoot: this._environmentService.appRoot ? uri_1.URI.file(this._environmentService.appRoot) : undefined,
                    appName: this._productService.nameLong,
                    appHost: this._productService.embedderIdentifier || 'desktop',
                    appUriScheme: this._productService.urlProtocol,
                    extensionTelemetryLogResource: this._environmentService.extHostTelemetryLogFile,
                    isExtensionTelemetryLoggingOnly: (0, telemetryUtils_1.isLoggingOnly)(this._productService, this._environmentService),
                    appLanguage: platform.language,
                    extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
                    extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
                    globalStorageHome: this._userDataProfilesService.defaultProfile.globalStorageHome,
                    workspaceStorageHome: this._environmentService.workspaceStorageHome,
                    extensionLogLevel: this._environmentService.extensionLogLevel
                },
                workspace: this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ? undefined : {
                    configuration: workspace.configuration ?? undefined,
                    id: workspace.id,
                    name: this._labelService.getWorkspaceLabel(workspace),
                    isUntitled: workspace.configuration ? (0, workspace_1.isUntitledWorkspace)(workspace.configuration, this._environmentService) : false,
                    transient: workspace.transient
                },
                remote: {
                    authority: this._environmentService.remoteAuthority,
                    connectionData: null,
                    isRemote: false
                },
                consoleForward: {
                    includeStack: !this._isExtensionDevTestFromCli && (this._isExtensionDevHost || !this._environmentService.isBuilt || this._productService.quality !== 'stable' || this._environmentService.verbose),
                    logNative: !this._isExtensionDevTestFromCli && this._isExtensionDevHost
                },
                extensions: this.extensions.toSnapshot(),
                telemetryInfo: {
                    sessionId: this._telemetryService.sessionId,
                    machineId: this._telemetryService.machineId,
                    sqmId: this._telemetryService.sqmId,
                    firstSessionDate: this._telemetryService.firstSessionDate,
                    msftInternal: this._telemetryService.msftInternal
                },
                logLevel: this._logService.getLevel(),
                loggers: [...this._loggerService.getRegisteredLoggers()],
                logsLocation: this._environmentService.extHostLogsPath,
                autoStart: (this.startup === 1 /* ExtensionHostStartup.EagerAutoStart */),
                uiKind: extensionHostProtocol_1.UIKind.Desktop
            };
        }
        _onExtHostProcessExit(code, signal) {
            if (this._terminating) {
                // Expected termination path (we asked the process to terminate)
                return;
            }
            this._onExit.fire([code, signal]);
        }
        _handleProcessOutputStream(stream, store) {
            let last = '';
            let isOmitting = false;
            const event = new event_1.Emitter();
            stream((chunk) => {
                // not a fancy approach, but this is the same approach used by the split2
                // module which is well-optimized (https://github.com/mcollina/split2)
                last += chunk;
                const lines = last.split(/\r?\n/g);
                last = lines.pop();
                // protected against an extension spamming and leaking memory if no new line is written.
                if (last.length > 10_000) {
                    lines.push(last);
                    last = '';
                }
                for (const line of lines) {
                    if (isOmitting) {
                        if (line === "END_NATIVE_LOG" /* NativeLogMarkers.End */) {
                            isOmitting = false;
                        }
                    }
                    else if (line === "START_NATIVE_LOG" /* NativeLogMarkers.Start */) {
                        isOmitting = true;
                    }
                    else if (line.length) {
                        event.fire(line + '\n');
                    }
                }
            }, undefined, store);
            return event;
        }
        async enableInspectPort() {
            if (!!this._inspectListener) {
                return true;
            }
            if (!this._extensionHostProcess) {
                return false;
            }
            const result = await this._extensionHostProcess.enableInspectPort();
            if (!result) {
                return false;
            }
            await Promise.race([event_1.Event.toPromise(this._onDidSetInspectPort.event), (0, async_1.timeout)(1000)]);
            return !!this._inspectListener;
        }
        getInspectPort() {
            return this._inspectListener ?? undefined;
        }
        _onWillShutdown(event) {
            // If the extension development host was started without debugger attached we need
            // to communicate this back to the main side to terminate the debug session
            if (this._isExtensionDevHost && !this._isExtensionDevTestFromCli && !this._isExtensionDevDebug && this._environmentService.debugExtensionHost.debugId) {
                this._extensionHostDebugService.terminateSession(this._environmentService.debugExtensionHost.debugId);
                event.join((0, async_1.timeout)(100 /* wait a bit for IPC to get delivered */), { id: 'join.extensionDevelopment', label: nls.localize('join.extensionDevelopment', "Terminating extension debug session") });
            }
        }
    };
    exports.NativeLocalProcessExtensionHost = NativeLocalProcessExtensionHost;
    exports.NativeLocalProcessExtensionHost = NativeLocalProcessExtensionHost = __decorate([
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, notification_1.INotificationService),
        __param(5, native_1.INativeHostService),
        __param(6, lifecycle_2.ILifecycleService),
        __param(7, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(8, userDataProfile_1.IUserDataProfilesService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, log_1.ILogService),
        __param(11, log_1.ILoggerService),
        __param(12, label_1.ILabelService),
        __param(13, extensionHostDebug_1.IExtensionHostDebugService),
        __param(14, host_1.IHostService),
        __param(15, productService_1.IProductService),
        __param(16, shellEnvironmentService_1.IShellEnvironmentService),
        __param(17, extensionHostStarter_1.IExtensionHostStarter)
    ], NativeLocalProcessExtensionHost);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxQcm9jZXNzRXh0ZW5zaW9uSG9zdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2VsZWN0cm9uLXNhbmRib3gvbG9jYWxQcm9jZXNzRXh0ZW5zaW9uSG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4Q2hHLE1BQWEsb0JBQW9CO1FBSWhDLElBQVcsUUFBUTtZQUNsQixPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxJQUFXLFFBQVE7WUFDbEIsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRUQsSUFBVyxTQUFTO1lBQ25CLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsSUFBVyxNQUFNO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELFlBQ0MsRUFBVSxFQUNPLHFCQUE0QztZQUE1QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBRTdELElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVNLEtBQUssQ0FBQyxJQUFrQztZQUM5QyxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBRU0saUJBQWlCO1lBQ3ZC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