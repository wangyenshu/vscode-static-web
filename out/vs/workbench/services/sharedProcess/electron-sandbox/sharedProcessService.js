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
define(["require", "exports", "vs/base/parts/ipc/common/ipc.mp", "vs/base/parts/ipc/common/ipc", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/platform/sharedProcess/common/sharedProcess", "vs/base/common/performance", "vs/base/common/async", "vs/base/parts/ipc/electron-sandbox/ipc.mp"], function (require, exports, ipc_mp_1, ipc_1, log_1, lifecycle_1, sharedProcess_1, performance_1, async_1, ipc_mp_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcessService = void 0;
    let SharedProcessService = class SharedProcessService extends lifecycle_1.Disposable {
        constructor(windowId, logService) {
            super();
            this.windowId = windowId;
            this.logService = logService;
            this.restoredBarrier = new async_1.Barrier();
            this.withSharedProcessConnection = this.connect();
        }
        async connect() {
            this.logService.trace('Renderer->SharedProcess#connect');
            // Our performance tests show that a connection to the shared
            // process can have significant overhead to the startup time
            // of the window because the shared process could be created
            // as a result. As such, make sure we await the `Restored`
            // phase before making a connection attempt, but also add a
            // timeout to be safe against possible deadlocks.
            await Promise.race([this.restoredBarrier.wait(), (0, async_1.timeout)(2000)]);
            // Acquire a message port connected to the shared process
            (0, performance_1.mark)('code/willConnectSharedProcess');
            this.logService.trace('Renderer->SharedProcess#connect: before acquirePort');
            const port = await (0, ipc_mp_2.acquirePort)(sharedProcess_1.SharedProcessChannelConnection.request, sharedProcess_1.SharedProcessChannelConnection.response);
            (0, performance_1.mark)('code/didConnectSharedProcess');
            this.logService.trace('Renderer->SharedProcess#connect: connection established');
            return this._register(new ipc_mp_1.Client(port, `window:${this.windowId}`));
        }
        notifyRestored() {
            if (!this.restoredBarrier.isOpen()) {
                this.restoredBarrier.open();
            }
        }
        getChannel(channelName) {
            return (0, ipc_1.getDelayedChannel)(this.withSharedProcessConnection.then(connection => connection.getChannel(channelName)));
        }
        registerChannel(channelName, channel) {
            this.withSharedProcessConnection.then(connection => connection.registerChannel(channelName, channel));
        }
        async createRawConnection() {
            // Await initialization of the shared process
            await this.withSharedProcessConnection;
            // Create a new port to the shared process
            this.logService.trace('Renderer->SharedProcess#createRawConnection: before acquirePort');
            const port = await (0, ipc_mp_2.acquirePort)(sharedProcess_1.SharedProcessRawConnection.request, sharedProcess_1.SharedProcessRawConnection.response);
            this.logService.trace('Renderer->SharedProcess#createRawConnection: connection established');
            return port;
        }
    };
    exports.SharedProcessService = SharedProcessService;
    exports.SharedProcessService = SharedProcessService = __decorate([
        __param(1, log_1.ILogService)
    ], SharedProcessService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkUHJvY2Vzc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2hhcmVkUHJvY2Vzcy9lbGVjdHJvbi1zYW5kYm94L3NoYXJlZFByb2Nlc3NTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVl6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVO1FBUW5ELFlBQ1UsUUFBZ0IsRUFDWixVQUF3QztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQUhDLGFBQVEsR0FBUixRQUFRLENBQVE7WUFDSyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBSnJDLG9CQUFlLEdBQUcsSUFBSSxlQUFPLEVBQUUsQ0FBQztZQVFoRCxJQUFJLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25ELENBQUM7UUFFTyxLQUFLLENBQUMsT0FBTztZQUNwQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1lBRXpELDZEQUE2RDtZQUM3RCw0REFBNEQ7WUFDNUQsNERBQTREO1lBQzVELDBEQUEwRDtZQUMxRCwyREFBMkQ7WUFDM0QsaURBQWlEO1lBRWpELE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBQSxlQUFPLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWpFLHlEQUF5RDtZQUN6RCxJQUFBLGtCQUFJLEVBQUMsK0JBQStCLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSxvQkFBVyxFQUFDLDhDQUE4QixDQUFDLE9BQU8sRUFBRSw4Q0FBOEIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoSCxJQUFBLGtCQUFJLEVBQUMsOEJBQThCLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO1lBRWpGLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQWlCLENBQUMsSUFBSSxFQUFFLFVBQVUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRUQsY0FBYztZQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDN0IsQ0FBQztRQUNGLENBQUM7UUFFRCxVQUFVLENBQUMsV0FBbUI7WUFDN0IsT0FBTyxJQUFBLHVCQUFpQixFQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuSCxDQUFDO1FBRUQsZUFBZSxDQUFDLFdBQW1CLEVBQUUsT0FBK0I7WUFDbkUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdkcsQ0FBQztRQUVELEtBQUssQ0FBQyxtQkFBbUI7WUFFeEIsNkNBQTZDO1lBQzdDLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDO1lBRXZDLDBDQUEwQztZQUMxQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxpRUFBaUUsQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSxvQkFBVyxFQUFDLDBDQUEwQixDQUFDLE9BQU8sRUFBRSwwQ0FBMEIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxxRUFBcUUsQ0FBQyxDQUFDO1lBRTdGLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztLQUNELENBQUE7SUFqRVksb0RBQW9CO21DQUFwQixvQkFBb0I7UUFVOUIsV0FBQSxpQkFBVyxDQUFBO09BVkQsb0JBQW9CLENBaUVoQyJ9