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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/platform/log/common/log", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/base/common/async", "vs/platform/utilityProcess/electron-main/utilityProcess", "vs/platform/windows/electron-main/windows", "vs/platform/telemetry/common/telemetry"], function (require, exports, errors_1, event_1, log_1, lifecycleMainService_1, async_1, utilityProcess_1, windows_1, telemetry_1) {
    "use strict";
    var ExtensionHostStarter_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostStarter = void 0;
    let ExtensionHostStarter = class ExtensionHostStarter {
        static { ExtensionHostStarter_1 = this; }
        static { this._lastId = 0; }
        constructor(_logService, _lifecycleMainService, _windowsMainService, _telemetryService) {
            this._logService = _logService;
            this._lifecycleMainService = _lifecycleMainService;
            this._windowsMainService = _windowsMainService;
            this._telemetryService = _telemetryService;
            this._extHosts = new Map();
            this._shutdown = false;
            // On shutdown: gracefully await extension host shutdowns
            this._lifecycleMainService.onWillShutdown(e => {
                this._shutdown = true;
                e.join('extHostStarter', this._waitForAllExit(6000));
            });
        }
        dispose() {
            // Intentionally not killing the extension host processes
        }
        _getExtHost(id) {
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                throw new Error(`Unknown extension host!`);
            }
            return extHostProcess;
        }
        onDynamicStdout(id) {
            return this._getExtHost(id).onStdout;
        }
        onDynamicStderr(id) {
            return this._getExtHost(id).onStderr;
        }
        onDynamicMessage(id) {
            return this._getExtHost(id).onMessage;
        }
        onDynamicExit(id) {
            return this._getExtHost(id).onExit;
        }
        async createExtensionHost() {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const id = String(++ExtensionHostStarter_1._lastId);
            const extHost = new utilityProcess_1.WindowUtilityProcess(this._logService, this._windowsMainService, this._telemetryService, this._lifecycleMainService);
            this._extHosts.set(id, extHost);
            extHost.onExit(({ pid, code, signal }) => {
                this._logService.info(`Extension host with pid ${pid} exited with code: ${code}, signal: ${signal}.`);
                setTimeout(() => {
                    extHost.dispose();
                    this._extHosts.delete(id);
                });
                // See https://github.com/microsoft/vscode/issues/194477
                // We have observed that sometimes the process sends an exit
                // event, but does not really exit and is stuck in an endless
                // loop. In these cases we kill the process forcefully after
                // a certain timeout.
                setTimeout(() => {
                    try {
                        process.kill(pid, 0); // will throw if the process doesn't exist anymore.
                        this._logService.error(`Extension host with pid ${pid} still exists, forcefully killing it...`);
                        process.kill(pid);
                    }
                    catch (er) {
                        // ignore, as the process is already gone
                    }
                }, 1000);
            });
            return { id };
        }
        async start(id, opts) {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const extHost = this._getExtHost(id);
            extHost.start({
                ...opts,
                type: 'extensionHost',
                entryPoint: 'vs/workbench/api/node/extensionHostProcess',
                args: ['--skipWorkspaceStorageLock'],
                execArgv: opts.execArgv,
                allowLoadingUnsignedLibraries: true,
                forceAllocationsToV8Sandbox: true,
                correlationId: id
            });
            const pid = await event_1.Event.toPromise(extHost.onSpawn);
            return { pid };
        }
        async enableInspectPort(id) {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                return false;
            }
            return extHostProcess.enableInspectPort();
        }
        async kill(id) {
            if (this._shutdown) {
                throw (0, errors_1.canceled)();
            }
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                // already gone!
                return;
            }
            extHostProcess.kill();
        }
        async _killAllNow() {
            for (const [, extHost] of this._extHosts) {
                extHost.kill();
            }
        }
        async _waitForAllExit(maxWaitTimeMs) {
            const exitPromises = [];
            for (const [, extHost] of this._extHosts) {
                exitPromises.push(extHost.waitForExit(maxWaitTimeMs));
            }
            return async_1.Promises.settled(exitPromises).then(() => { });
        }
    };
    exports.ExtensionHostStarter = ExtensionHostStarter;
    exports.ExtensionHostStarter = ExtensionHostStarter = ExtensionHostStarter_1 = __decorate([
        __param(0, log_1.ILogService),
        __param(1, lifecycleMainService_1.ILifecycleMainService),
        __param(2, windows_1.IWindowsMainService),
        __param(3, telemetry_1.ITelemetryService)
    ], ExtensionHostStarter);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdFN0YXJ0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25zL2VsZWN0cm9uLW1haW4vZXh0ZW5zaW9uSG9zdFN0YXJ0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWF6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFvQjs7aUJBSWpCLFlBQU8sR0FBVyxDQUFDLEFBQVosQ0FBYTtRQUtuQyxZQUNjLFdBQXlDLEVBQy9CLHFCQUE2RCxFQUMvRCxtQkFBeUQsRUFDM0QsaUJBQXFEO1lBSDFDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ2QsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM5Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQzFDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFQeEQsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO1lBQzdELGNBQVMsR0FBRyxLQUFLLENBQUM7WUFTekIseURBQXlEO1lBQ3pELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzdDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUN0QixDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0RCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxPQUFPO1lBQ04seURBQXlEO1FBQzFELENBQUM7UUFFTyxXQUFXLENBQUMsRUFBVTtZQUM3QixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5QyxJQUFJ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