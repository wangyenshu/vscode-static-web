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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/storage/common/storageIpc", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/node/workspaces", "vs/platform/native/common/native", "vs/platform/ipc/common/mainProcessService", "vs/base/common/network"], function (require, exports, async_1, errors_1, lifecycle_1, path_1, pfs_1, environment_1, log_1, storageIpc_1, workspace_1, workspaces_1, native_1, mainProcessService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnusedWorkspaceStorageDataCleaner = void 0;
    let UnusedWorkspaceStorageDataCleaner = class UnusedWorkspaceStorageDataCleaner extends lifecycle_1.Disposable {
        constructor(environmentService, logService, nativeHostService, mainProcessService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.nativeHostService = nativeHostService;
            this.mainProcessService = mainProcessService;
            const scheduler = this._register(new async_1.RunOnceScheduler(() => {
                this.cleanUpStorage();
            }, 30 * 1000 /* after 30s */));
            scheduler.schedule();
        }
        async cleanUpStorage() {
            this.logService.trace('[storage cleanup]: Starting to clean up workspace storage folders for unused empty workspaces.');
            try {
                const workspaceStorageHome = this.environmentService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath;
                const workspaceStorageFolders = await pfs_1.Promises.readdir(workspaceStorageHome);
                const storageClient = new storageIpc_1.StorageClient(this.mainProcessService.getChannel('storage'));
                await Promise.all(workspaceStorageFolders.map(async (workspaceStorageFolder) => {
                    const workspaceStoragePath = (0, path_1.join)(workspaceStorageHome, workspaceStorageFolder);
                    if (workspaceStorageFolder.length === workspaces_1.NON_EMPTY_WORKSPACE_ID_LENGTH) {
                        return; // keep workspace storage for folders/workspaces that can be accessed still
                    }
                    if (workspaceStorageFolder === workspace_1.EXTENSION_DEVELOPMENT_EMPTY_WINDOW_WORKSPACE.id) {
                        return; // keep workspace storage for empty extension development workspaces
                    }
                    const windows = await this.nativeHostService.getWindows({ includeAuxiliaryWindows: false });
                    if (windows.some(window => window.workspace?.id === workspaceStorageFolder)) {
                        return; // keep workspace storage for empty workspaces opened as window
                    }
                    const isStorageUsed = await storageClient.isUsed(workspaceStoragePath);
                    if (isStorageUsed) {
                        return; // keep workspace storage for empty workspaces that are in use
                    }
                    this.logService.trace(`[storage cleanup]: Deleting workspace storage folder ${workspaceStorageFolder} as it seems to be an unused empty workspace.`);
                    await pfs_1.Promises.rm(workspaceStoragePath);
                }));
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
        }
    };
    exports.UnusedWorkspaceStorageDataCleaner = UnusedWorkspaceStorageDataCleaner;
    exports.UnusedWorkspaceStorageDataCleaner = UnusedWorkspaceStorageDataCleaner = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, native_1.INativeHostService),
        __param(3, mainProcessService_1.IMainProcessService)
    ], UnusedWorkspaceStorageDataCleaner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZURhdGFDbGVhbmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvY29kZS9ub2RlL3NoYXJlZFByb2Nlc3MvY29udHJpYi9zdG9yYWdlRGF0YUNsZWFuZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFNLGlDQUFpQyxHQUF2QyxNQUFNLGlDQUFrQyxTQUFRLHNCQUFVO1FBRWhFLFlBQzZDLGtCQUE2QyxFQUMzRCxVQUF1QixFQUNoQixpQkFBcUMsRUFDcEMsa0JBQXVDO1lBRTdFLEtBQUssRUFBRSxDQUFDO1lBTG9DLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBMkI7WUFDM0QsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNoQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3BDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFJN0UsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFDLEdBQUcsRUFBRTtnQkFDMUQsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3ZCLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDL0IsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFTyxLQUFLLENBQUMsY0FBYztZQUMzQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxnR0FBZ0csQ0FBQyxDQUFDO1lBRXhILElBQUksQ0FBQztnQkFDSixNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQkFDaEgsTUFBTSx1QkFBdUIsR0FBRyxNQUFNLGNBQVEsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDN0UsTUFBTSxhQUFhLEdBQUcsSUFBSSwwQkFBYSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFFdkYsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUMsc0JBQXNCLEVBQUMsRUFBRTtvQkFDNUUsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLFdBQUksRUFBQyxvQkFBb0IsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO29CQUVoRixJQUFJLHNCQUFzQixDQUFDLE1BQU0sS0FBSywwQ0FBNkIsRUFBRSxDQUFDO3dCQUNyRSxPQUFPLENBQUMsMkVBQTJFO29CQUNwRixDQUFDO29CQUVELElBQUksc0JBQXNCLEtBQUssd0RBQTRDLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQ2hGLE9BQU8sQ0FBQyxvRUFBb0U7b0JBQzdFLENBQUM7b0JBRUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLEVBQUUsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztvQkFDNUYsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLEtBQUssc0JBQXNCLENBQUMsRUFBRSxDQUFDO3dCQUM3RSxPQUFPLENBQUMsK0RBQStEO29CQUN4RSxDQUFDO29CQUVELE1BQU0sYUFBYSxHQUFHLE1BQU0sYUFBYSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO29CQUN2RSxJQUFJLGFBQWEsRUFBRSxDQUFDO3dCQUNuQixPQUFPLENBQUMsOERBQThEO29CQUN2RSxDQUFDO29CQUVELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHdEQUF3RCxzQkFBc0IsK0NBQStDLENBQUMsQ0FBQztvQkFFckosTUFBTSxjQUFRLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3pDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBQSwwQkFBaUIsRUFBQyxLQUFLLENBQUMsQ0FBQztZQUMxQixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUFyRFksOEVBQWlDO2dEQUFqQyxpQ0FBaUM7UUFHM0MsV0FBQSx1Q0FBeUIsQ0FBQTtRQUN6QixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLDJCQUFrQixDQUFBO1FBQ2xCLFdBQUEsd0NBQW1CLENBQUE7T0FOVCxpQ0FBaUMsQ0FxRDdDIn0=