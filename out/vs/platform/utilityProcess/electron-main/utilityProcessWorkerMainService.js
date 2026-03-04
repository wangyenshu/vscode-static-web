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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/windows/electron-main/windows", "vs/platform/utilityProcess/electron-main/utilityProcess", "vs/platform/telemetry/common/telemetry", "vs/base/common/hash", "vs/base/common/event", "vs/base/common/async", "vs/platform/lifecycle/electron-main/lifecycleMainService"], function (require, exports, lifecycle_1, instantiation_1, log_1, windows_1, utilityProcess_1, telemetry_1, hash_1, event_1, async_1, lifecycleMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UtilityProcessWorkerMainService = exports.IUtilityProcessWorkerMainService = void 0;
    exports.IUtilityProcessWorkerMainService = (0, instantiation_1.createDecorator)('utilityProcessWorker');
    let UtilityProcessWorkerMainService = class UtilityProcessWorkerMainService extends lifecycle_1.Disposable {
        constructor(logService, windowsMainService, telemetryService, lifecycleMainService) {
            super();
            this.logService = logService;
            this.windowsMainService = windowsMainService;
            this.telemetryService = telemetryService;
            this.lifecycleMainService = lifecycleMainService;
            this.workers = new Map();
        }
        async createWorker(configuration) {
            const workerLogId = `window: ${configuration.reply.windowId}, moduleId: ${configuration.process.moduleId}`;
            this.logService.trace(`[UtilityProcessWorker]: createWorker(${workerLogId})`);
            // Ensure to dispose any existing process for config
            const workerId = this.hash(configuration);
            if (this.workers.has(workerId)) {
                this.logService.warn(`[UtilityProcessWorker]: createWorker() found an existing worker that will be terminated (${workerLogId})`);
                this.disposeWorker(configuration);
            }
            // Create new worker
            const worker = new UtilityProcessWorker(this.logService, this.windowsMainService, this.telemetryService, this.lifecycleMainService, configuration);
            if (!worker.spawn()) {
                return { reason: { code: 1, signal: 'EINVALID' } };
            }
            this.workers.set(workerId, worker);
            const onDidTerminate = new async_1.DeferredPromise();
            event_1.Event.once(worker.onDidTerminate)(reason => {
                if (reason.code === 0) {
                    this.logService.trace(`[UtilityProcessWorker]: terminated normally with code ${reason.code}, signal: ${reason.signal}`);
                }
                else {
                    this.logService.error(`[UtilityProcessWorker]: terminated unexpectedly with code ${reason.code}, signal: ${reason.signal}`);
                }
                this.workers.delete(workerId);
                onDidTerminate.complete({ reason });
            });
            return onDidTerminate.p;
        }
        hash(configuration) {
            return (0, hash_1.hash)({
                moduleId: configuration.process.moduleId,
                windowId: configuration.reply.windowId
            });
        }
        async disposeWorker(configuration) {
            const workerId = this.hash(configuration);
            const worker = this.workers.get(workerId);
            if (!worker) {
                return;
            }
            this.logService.trace(`[UtilityProcessWorker]: disposeWorker(window: ${configuration.reply.windowId}, moduleId: ${configuration.process.moduleId})`);
            worker.kill();
            this.workers.delete(workerId);
        }
    };
    exports.UtilityProcessWorkerMainService = UtilityProcessWorkerMainService;
    exports.UtilityProcessWorkerMainService = UtilityProcessWorkerMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, lifecycleMainService_1.ILifecycleMainService)
    ], UtilityProcessWorkerMainService);
    let UtilityProcessWorker = class UtilityProcessWorker extends lifecycle_1.Disposable {
        constructor(logService, windowsMainService, telemetryService, lifecycleMainService, configuration) {
            super();
            this.logService = logService;
            this.windowsMainService = windowsMainService;
            this.telemetryService = telemetryService;
            this.lifecycleMainService = lifecycleMainService;
            this.configuration = configuration;
            this._onDidTerminate = this._register(new event_1.Emitter());
            this.onDidTerminate = this._onDidTerminate.event;
            this.utilityProcess = new utilityProcess_1.WindowUtilityProcess(this.logService, this.windowsMainService, this.telemetryService, this.lifecycleMainService);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.utilityProcess.onExit(e => this._onDidTerminate.fire({ code: e.code, signal: e.signal })));
            this._register(this.utilityProcess.onCrash(e => this._onDidTerminate.fire({ code: e.code, signal: 'ECRASH' })));
        }
        spawn() {
            const window = this.windowsMainService.getWindowById(this.configuration.reply.windowId);
            const windowPid = window?.win?.webContents.getOSProcessId();
            return this.utilityProcess.start({
                type: this.configuration.process.type,
                entryPoint: this.configuration.process.moduleId,
                parentLifecycleBound: windowPid,
                windowLifecycleBound: true,
                correlationId: `${this.configuration.reply.windowId}`,
                responseWindowId: this.configuration.reply.windowId,
                responseChannel: this.configuration.reply.channel,
                responseNonce: this.configuration.reply.nonce
            });
        }
        kill() {
            this.utilityProcess.kill();
        }
    };
    UtilityProcessWorker = __decorate([
        __param(0, log_1.ILogService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, lifecycleMainService_1.ILifecycleMainService)
    ], UtilityProcessWorker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0eVByb2Nlc3NXb3JrZXJNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3V0aWxpdHlQcm9jZXNzL2VsZWN0cm9uLW1haW4vdXRpbGl0eVByb2Nlc3NXb3JrZXJNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjbkYsUUFBQSxnQ0FBZ0MsR0FBRyxJQUFBLCtCQUFlLEVBQW1DLHNCQUFzQixDQUFDLENBQUM7SUFPbkgsSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBZ0MsU0FBUSxzQkFBVTtRQU05RCxZQUNjLFVBQXdDLEVBQ2hDLGtCQUF3RCxFQUMxRCxnQkFBb0QsRUFDaEQsb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBTHNCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDZix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3pDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDL0IseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQU5uRSxZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQXlDLENBQUM7UUFTNUUsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLENBQUMsYUFBdUQ7WUFDekUsTUFBTSxXQUFXLEdBQUcsV0FBVyxhQUFhLENBQUMsS0FBSyxDQUFDLFFBQVEsZUFBZSxhQUFhLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzNHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHdDQUF3QyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBRTlFLG9EQUFvRDtZQUNwRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzFDLElBQUksSUFBSSxDQUFDLE9B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