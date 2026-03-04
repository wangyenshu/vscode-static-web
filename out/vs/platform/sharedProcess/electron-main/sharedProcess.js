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
define(["require", "exports", "vs/base/parts/ipc/electron-main/ipcMain", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/policy/common/policy", "vs/platform/log/electron-main/loggerService", "vs/platform/utilityProcess/electron-main/utilityProcess", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/environment/node/environmentService", "vs/base/common/types", "vs/platform/sharedProcess/common/sharedProcess"], function (require, exports, ipcMain_1, async_1, lifecycle_1, environmentMainService_1, lifecycleMainService_1, log_1, userDataProfile_1, policy_1, loggerService_1, utilityProcess_1, telemetryUtils_1, environmentService_1, types_1, sharedProcess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcess = void 0;
    let SharedProcess = class SharedProcess extends lifecycle_1.Disposable {
        constructor(machineId, sqmId, environmentMainService, userDataProfilesService, lifecycleMainService, logService, loggerMainService, policyService) {
            super();
            this.machineId = machineId;
            this.sqmId = sqmId;
            this.environmentMainService = environmentMainService;
            this.userDataProfilesService = userDataProfilesService;
            this.lifecycleMainService = lifecycleMainService;
            this.logService = logService;
            this.loggerMainService = loggerMainService;
            this.policyService = policyService;
            this.firstWindowConnectionBarrier = new async_1.Barrier();
            this.utilityProcess = undefined;
            this.utilityProcessLogListener = undefined;
            this._whenReady = undefined;
            this._whenIpcReady = undefined;
            this.registerListeners();
        }
        registerListeners() {
            // Shared process channel connections from workbench windows
            ipcMain_1.validatedIpcMain.on(sharedProcess_1.SharedProcessChannelConnection.request, (e, nonce) => this.onWindowConnection(e, nonce, sharedProcess_1.SharedProcessChannelConnection.response));
            // Shared process raw connections from workbench windows
            ipcMain_1.validatedIpcMain.on(sharedProcess_1.SharedProcessRawConnection.request, (e, nonce) => this.onWindowConnection(e, nonce, sharedProcess_1.SharedProcessRawConnection.response));
            // Lifecycle
            this._register(this.lifecycleMainService.onWillShutdown(() => this.onWillShutdown()));
        }
        async onWindowConnection(e, nonce, responseChannel) {
            this.logService.trace(`[SharedProcess] onWindowConnection for: ${responseChannel}`);
            // release barrier if this is the first window connection
            if (!this.firstWindowConnectionBarrier.isOpen()) {
                this.firstWindowConnectionBarrier.open();
            }
            // await the shared process to be overall ready
            // we do not just wait for IPC ready because the
            // workbench window will communicate directly
            await this.whenReady();
            // connect to the shared process passing the responseChannel
            // as payload to give a hint what the connection is about
            const port = await this.connect(responseChannel);
            // Check back if the requesting window meanwhile closed
            // Since shared process is delayed on startup there is
            // a chance that the window close before the shared process
            // was ready for a connection.
            if (e.sender.isDestroyed()) {
                return port.close();
            }
            // send the port back to the requesting window
            e.sender.postMessage(responseChannel, nonce, [port]);
        }
        onWillShutdown() {
            this.logService.trace('[SharedProcess] onWillShutdown');
            this.utilityProcess?.postMessage(sharedProcess_1.SharedProcessLifecycle.exit);
            this.utilityProcess = undefined;
        }
        whenReady() {
            if (!this._whenReady) {
                this._whenReady = (async () => {
                    // Wait for shared process being ready to accept connection
                    await this.whenIpcReady;
                    // Overall signal that the shared process was loaded and
                    // all services within have been created.
                    const whenReady = new async_1.DeferredPromise();
                    this.utilityProcess?.once(sharedProcess_1.SharedProcessLifecycle.initDone, () => whenReady.complete());
                    await whenReady.p;
                    this.utilityProcessLogListener?.dispose();
                    this.logService.trace('[SharedProcess] Overall ready');
                })();
            }
            return this._whenReady;
        }
        get whenIpcReady() {
            if (!this._whenIpcReady) {
                this._whenIpcReady = (async () => {
                    // Always wait for first window asking for connection
                    await this.firstWindowConnectionBarrier.wait();
                    // Spawn shared process
                    this.createUtilityProcess();
                    // Wait for shared process indicating that IPC connections are accepted
                    const sharedProcessIpcReady = new async_1.DeferredPromise();
                    this.utilityProcess?.once(sharedProcess_1.SharedProcessLifecycle.ipcReady, () => sharedProcessIpcReady.complete());
                    await sharedProcessIpcReady.p;
                    this.logService.trace('[SharedProcess] IPC ready');
                })();
            }
            return this._whenIpcReady;
        }
        createUtilityProcess() {
            this.utilityProcess = this._register(new utilityProcess_1.UtilityProcess(this.logService, telemetryUtils_1.NullTelemetryService, this.lifecycleMainService));
            // Install a log listener for very early shared process warnings and errors
            this.utilityProcessLogListener = this.utilityProcess.onMessage((e) => {
                if (typeof e.warning === 'string') {
                    this.logService.warn(e.warning);
                }
                else if (typeof e.error === 'string') {
                    this.logService.error(e.error);
                }
            });
            const inspectParams = (0, environmentService_1.parseSharedProcessDebugPort)(this.environmentMainService.args, this.environmentMainService.isBuilt);
            let execArgv = undefined;
            if (inspectParams.port) {
                execArgv = ['--nolazy'];
                if (inspectParams.break) {
                    execArgv.push(`--inspect-brk=${inspectParams.port}`);
                }
                else {
                    execArgv.push(`--inspect=${inspectParams.port}`);
                }
            }
            this.utilityProcess.start({
                type: 'shared-process',
                entryPoint: 'vs/code/node/sharedProcess/sharedProcessMain',
                payload: this.createSharedProcessConfiguration(),
                execArgv
            });
        }
        createSharedProcessConfiguration() {
            return {
                machineId: this.machineId,
                sqmId: this.sqmId,
                codeCachePath: this.environmentMainService.codeCachePath,
                profiles: {
                    home: this.userDataProfilesService.profilesHome,
                    all: this.userDataProfilesService.profiles,
                },
                args: this.environmentMainService.args,
                logLevel: this.loggerMainService.getLogLevel(),
                loggers: this.loggerMainService.getRegisteredLoggers(),
                policiesData: this.policyService.serialize()
            };
        }
        async connect(payload) {
            // Wait for shared process being ready to accept connection
            await this.whenIpcReady;
            // Connect and return message port
            const utilityProcess = (0, types_1.assertIsDefined)(this.utilityProcess);
            return utilityProcess.connect(payload);
        }
    };
    exports.SharedProcess = SharedProcess;
    exports.SharedProcess = SharedProcess = __decorate([
        __param(2, environmentMainService_1.IEnvironmentMainService),
        __param(3, userDataProfile_1.IUserDataProfilesService),
        __param(4, lifecycleMainService_1.ILifecycleMainService),
        __param(5, log_1.ILogService),
        __param(6, loggerService_1.ILoggerMainService),
        __param(7, policy_1.IPolicyService)
    ], SharedProcess);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkUHJvY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3NoYXJlZFByb2Nlc3MvZWxlY3Ryb24tbWFpbi9zaGFyZWRQcm9jZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYyxTQUFRLHNCQUFVO1FBTzVDLFlBQ2tCLFNBQWlCLEVBQ2pCLEtBQWEsRUFDTCxzQkFBZ0UsRUFDL0QsdUJBQWtFLEVBQ3JFLG9CQUE0RCxFQUN0RSxVQUF3QyxFQUNqQyxpQkFBc0QsRUFDMUQsYUFBOEM7WUFFOUQsS0FBSyxFQUFFLENBQUM7WUFUUyxjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ2pCLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDWSwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQzlDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDcEQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2hCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDekMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBYjlDLGlDQUE0QixHQUFHLElBQUksZUFBTyxFQUFFLENBQUM7WUFFdEQsbUJBQWMsR0FBK0IsU0FBUyxDQUFDO1lBQ3ZELDhCQUF5QixHQUE0QixTQUFTLENBQUM7WUFvRS9ELGVBQVUsR0FBOEIsU0FBUyxDQUFDO1lBdUJsRCxrQkFBYSxHQUE4QixTQUFTLENBQUM7WUE3RTVELElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFFeEIsNERBQTREO1lBQzVELDBCQUFnQixDQUFDLEVBQUUsQ0FBQyw4Q0FBOEIsQ0FBQyxP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