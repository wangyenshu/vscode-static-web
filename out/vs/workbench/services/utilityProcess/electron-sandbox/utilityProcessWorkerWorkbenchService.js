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
define(["require", "exports", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/platform/ipc/common/mainProcessService", "vs/base/parts/ipc/common/ipc.mp", "vs/platform/instantiation/common/instantiation", "vs/base/parts/ipc/common/ipc", "vs/base/common/uuid", "vs/base/parts/ipc/electron-sandbox/ipc.mp", "vs/platform/utilityProcess/common/utilityProcessWorkerService", "vs/base/common/async"], function (require, exports, log_1, lifecycle_1, mainProcessService_1, ipc_mp_1, instantiation_1, ipc_1, uuid_1, ipc_mp_2, utilityProcessWorkerService_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UtilityProcessWorkerWorkbenchService = exports.IUtilityProcessWorkerWorkbenchService = void 0;
    exports.IUtilityProcessWorkerWorkbenchService = (0, instantiation_1.createDecorator)('utilityProcessWorkerWorkbenchService');
    let UtilityProcessWorkerWorkbenchService = class UtilityProcessWorkerWorkbenchService extends lifecycle_1.Disposable {
        get utilityProcessWorkerService() {
            if (!this._utilityProcessWorkerService) {
                const channel = this.mainProcessService.getChannel(utilityProcessWorkerService_1.ipcUtilityProcessWorkerChannelName);
                this._utilityProcessWorkerService = ipc_1.ProxyChannel.toService(channel);
            }
            return this._utilityProcessWorkerService;
        }
        constructor(windowId, logService, mainProcessService) {
            super();
            this.windowId = windowId;
            this.logService = logService;
            this.mainProcessService = mainProcessService;
            this._utilityProcessWorkerService = undefined;
            this.restoredBarrier = new async_1.Barrier();
        }
        async createWorker(process) {
            this.logService.trace('Renderer->UtilityProcess#createWorker');
            // We want to avoid heavy utility process work to happen before
            // the window has restored. As such, make sure we await the
            // `Restored` phase before making a connection attempt, but also
            // add a timeout to be safe against possible deadlocks.
            await Promise.race([this.restoredBarrier.wait(), (0, async_1.timeout)(2000)]);
            // Get ready to acquire the message port from the utility process worker
            const nonce = (0, uuid_1.generateUuid)();
            const responseChannel = 'vscode:createUtilityProcessWorkerMessageChannelResult';
            const portPromise = (0, ipc_mp_2.acquirePort)(undefined /* we trigger the request via service call! */, responseChannel, nonce);
            // Actually talk with the utility process service
            // to create a new process from a worker
            const onDidTerminate = this.utilityProcessWorkerService.createWorker({
                process,
                reply: { windowId: this.windowId, channel: responseChannel, nonce }
            });
            // Dispose worker upon disposal via utility process service
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                this.logService.trace('Renderer->UtilityProcess#disposeWorker', process);
                this.utilityProcessWorkerService.disposeWorker({
                    process,
                    reply: { windowId: this.windowId }
                });
            }));
            const port = await portPromise;
            const client = disposables.add(new ipc_mp_1.Client(port, `window:${this.windowId},module:${process.moduleId}`));
            this.logService.trace('Renderer->UtilityProcess#createWorkerChannel: connection established');
            onDidTerminate.then(({ reason }) => {
                if (reason?.code === 0) {
                    this.logService.trace(`[UtilityProcessWorker]: terminated normally with code ${reason.code}, signal: ${reason.signal}`);
                }
                else {
                    this.logService.error(`[UtilityProcessWorker]: terminated unexpectedly with code ${reason?.code}, signal: ${reason?.signal}`);
                }
            });
            return { client, onDidTerminate, dispose: () => disposables.dispose() };
        }
        notifyRestored() {
            if (!this.restoredBarrier.isOpen()) {
                this.restoredBarrier.open();
            }
        }
    };
    exports.UtilityProcessWorkerWorkbenchService = UtilityProcessWorkerWorkbenchService;
    exports.UtilityProcessWorkerWorkbenchService = UtilityProcessWorkerWorkbenchService = __decorate([
        __param(1, log_1.ILogService),
        __param(2, mainProcessService_1.IMainProcessService)
    ], UtilityProcessWorkerWorkbenchService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0eVByb2Nlc3NXb3JrZXJXb3JrYmVuY2hTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3V0aWxpdHlQcm9jZXNzL2VsZWN0cm9uLXNhbmRib3gvdXRpbGl0eVByb2Nlc3NXb3JrZXJXb3JrYmVuY2hTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWFuRixRQUFBLHFDQUFxQyxHQUFHLElBQUEsK0JBQWUsRUFBd0Msc0NBQXNDLENBQUMsQ0FBQztJQXVEN0ksSUFBTSxvQ0FBb0MsR0FBMUMsTUFBTSxvQ0FBcUMsU0FBUSxzQkFBVTtRQUtuRSxJQUFZLDJCQUEyQjtZQUN0QyxJQUFJLENBQUMsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7Z0JBQ3hDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsZ0VBQWtDLENBQUMsQ0FBQztnQkFDdkYsSUFBSSxDQUFDLDRCQUE0QixHQUFHLGtCQUFZLENBQUMsU0FBUyxDQUErQixPQUFPLENBQUMsQ0FBQztZQUNuRyxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsNEJBQTRCLENBQUM7UUFDMUMsQ0FBQztRQUlELFlBQ1UsUUFBZ0IsRUFDWixVQUF3QyxFQUNoQyxrQkFBd0Q7WUFFN0UsS0FBSyxFQUFFLENBQUM7WUFKQyxhQUFRLEdBQVIsUUFBUSxDQUFRO1lBQ0ssZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNmLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFmdEUsaUNBQTRCLEdBQTZDLFNBQVMsQ0FBQztZQVUxRSxvQkFBZSxHQUFHLElBQUksZUFBTyxFQUFFLENBQUM7UUFRakQsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBcUM7WUFDdkQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQztZQUUvRCwrREFBK0Q7WUFDL0QsMkRBQTJEO1lBQzNELGdFQUFnRTtZQUNoRSx1REFBdUQ7WUFFdkQsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFakUsd0VBQXdFO1lBQ3hFLE1BQU0sS0FBSyxHQUFHLElBQUEsbUJBQVksR0FBRSxDQUFDO1lBQzdCLE1BQU0sZUFBZSxHQUFHLHVEQUF1RCxDQUFDO1lBQ2hGLE1BQU0sV0FBVyxHQUFHLElBQUEsb0JBQVcsRUFBQyxTQUFTLENBQUMsOENBQThDLEVBQUUsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWxILGlEQUFpRDtZQUNqRCx3Q0FBd0M7WUFDeEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFlBQVksQ0FBQztnQkFDcEUsT0FBTztnQkFDUCxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRTthQUNuRSxDQUFDLENBQUM7WUFFSCwyREFBMkQ7WUFDM0QsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDMUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUNqQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFFekUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGFBQWEsQ0FBQztvQkFDOUMsT0FBTztvQkFDUCxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRTtpQkFDbEMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDO1lBQy9CLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFpQixDQUFDLElBQUksRUFBRSxVQUFVLElBQUksQ0FBQyxRQUFRLFdBQVcsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsSCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxzRUFBc0UsQ0FBQyxDQUFDO1lBRTlGLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7Z0JBQ2xDLElBQUksTUFBTSxFQUFFLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDeEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMseURBQXlELE1BQU0sQ0FBQyxJQUFJLGFBQWEsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ3pILENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyw2REFBNkQsTUFBTSxFQUFFLElBQUksYUFBYSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDL0gsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1FBQ3pFLENBQUM7UUFFRCxjQUFjO1lBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM3QixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUE3RVksb0ZBQW9DO21EQUFwQyxvQ0FBb0M7UUFrQjlDLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsd0NBQW1CLENBQUE7T0FuQlQsb0NBQW9DLENBNkVoRCJ9