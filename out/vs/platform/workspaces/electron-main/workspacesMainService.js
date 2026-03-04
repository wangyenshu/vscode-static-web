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
define(["require", "exports", "vs/platform/backup/electron-main/backup", "vs/platform/windows/electron-main/windows", "vs/platform/workspaces/electron-main/workspacesHistoryMainService", "vs/platform/workspaces/electron-main/workspacesManagementMainService"], function (require, exports, backup_1, windows_1, workspacesHistoryMainService_1, workspacesManagementMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacesMainService = void 0;
    let WorkspacesMainService = class WorkspacesMainService {
        constructor(workspacesManagementMainService, windowsMainService, workspacesHistoryMainService, backupMainService) {
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.windowsMainService = windowsMainService;
            this.workspacesHistoryMainService = workspacesHistoryMainService;
            this.backupMainService = backupMainService;
            //#endregion
            //#region Workspaces History
            this.onDidChangeRecentlyOpened = this.workspacesHistoryMainService.onDidChangeRecentlyOpened;
        }
        //#region Workspace Management
        async enterWorkspace(windowId, path) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                return this.workspacesManagementMainService.enterWorkspace(window, this.windowsMainService.getWindows(), path);
            }
            return undefined;
        }
        createUntitledWorkspace(windowId, folders, remoteAuthority) {
            return this.workspacesManagementMainService.createUntitledWorkspace(folders, remoteAuthority);
        }
        deleteUntitledWorkspace(windowId, workspace) {
            return this.workspacesManagementMainService.deleteUntitledWorkspace(workspace);
        }
        getWorkspaceIdentifier(windowId, workspacePath) {
            return this.workspacesManagementMainService.getWorkspaceIdentifier(workspacePath);
        }
        getRecentlyOpened(windowId) {
            return this.workspacesHistoryMainService.getRecentlyOpened();
        }
        addRecentlyOpened(windowId, recents) {
            return this.workspacesHistoryMainService.addRecentlyOpened(recents);
        }
        removeRecentlyOpened(windowId, paths) {
            return this.workspacesHistoryMainService.removeRecentlyOpened(paths);
        }
        clearRecentlyOpened(windowId) {
            return this.workspacesHistoryMainService.clearRecentlyOpened();
        }
        //#endregion
        //#region Dirty Workspaces
        async getDirtyWorkspaces() {
            return this.backupMainService.getDirtyWorkspaces();
        }
    };
    exports.WorkspacesMainService = WorkspacesMainService;
    exports.WorkspacesMainService = WorkspacesMainService = __decorate([
        __param(0, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, workspacesHistoryMainService_1.IWorkspacesHistoryMainService),
        __param(3, backup_1.IBackupMainService)
    ], WorkspacesMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlc01haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd29ya3NwYWNlcy9lbGVjdHJvbi1tYWluL3dvcmtzcGFjZXNNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBcUI7UUFJakMsWUFDbUMsK0JBQWtGLEVBQy9GLGtCQUF3RCxFQUM5Qyw0QkFBNEUsRUFDdkYsaUJBQXNEO1lBSHZCLG9DQUErQixHQUEvQiwrQkFBK0IsQ0FBa0M7WUFDOUUsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM3QixpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBQ3RFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUEyQjNFLFlBQVk7WUFFWiw0QkFBNEI7WUFFbkIsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLHlCQUF5QixDQUFDO1FBN0JqRyxDQUFDO1FBRUQsOEJBQThCO1FBRTlCLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBZ0IsRUFBRSxJQUFTO1lBQy9DLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0QsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDWixPQUFPLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoSCxDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELHVCQUF1QixDQUFDLFFBQWdCLEVBQUUsT0FBd0MsRUFBRSxlQUF3QjtZQUMzRyxPQUFPLElBQUksQ0FBQywrQkFBK0IsQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDL0YsQ0FBQztRQUVELHVCQUF1QixDQUFDLFFBQWdCLEVBQUUsU0FBK0I7WUFDeEUsT0FBTyxJQUFJLENBQUMsK0JBQStCLENBQUMsdUJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVELHNCQUFzQixDQUFDLFFBQWdCLEVBQUUsYUFBa0I7WUFDMUQsT0FBTyxJQUFJLENBQUMsK0JBQStCLENBQUMsc0JBQXNCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQVFELGlCQUFpQixDQUFDLFFBQWdCO1lBQ2pDLE9BQU8sSUFBSSxDQUFDLDRCQUE0QixDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDOUQsQ0FBQztRQUVELGlCQUFpQixDQUFDLFFBQWdCLEVBQUUsT0FBa0I7WUFDckQsT0FBTyxJQUFJLENBQUMsNEJBQTRCLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVELG9CQUFvQixDQUFDLFFBQWdCLEVBQUUsS0FBWTtZQUNsRCxPQUFPLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRUQsbUJBQW1CLENBQUMsUUFBZ0I7WUFDbkMsT0FBTyxJQUFJLENBQUMsNEJBQTRCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUNoRSxDQUFDO1FBRUQsWUFBWTtRQUdaLDBCQUEwQjtRQUUxQixLQUFLLENBQUMsa0JBQWtCO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDcEQsQ0FBQztLQUdELENBQUE7SUFuRVksc0RBQXFCO29DQUFyQixxQkFBcUI7UUFLL0IsV0FBQSxrRUFBZ0MsQ0FBQTtRQUNoQyxXQUFBLDZCQUFtQixDQUFBO1FBQ25CLFdBQUEsNERBQTZCLENBQUE7UUFDN0IsV0FBQSwyQkFBa0IsQ0FBQTtPQVJSLHFCQUFxQixDQW1FakMifQ==