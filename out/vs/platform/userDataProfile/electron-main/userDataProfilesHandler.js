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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/workspace/common/workspace", "vs/base/common/async", "vs/platform/windows/electron-main/windows"], function (require, exports, lifecycle_1, lifecycleMainService_1, userDataProfile_1, workspace_1, async_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfilesHandler = void 0;
    let UserDataProfilesHandler = class UserDataProfilesHandler extends lifecycle_1.Disposable {
        constructor(lifecycleMainService, userDataProfilesService, windowsMainService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            this.windowsMainService = windowsMainService;
            this._register(lifecycleMainService.onWillLoadWindow(e => {
                if (e.reason === 2 /* LoadReason.LOAD */) {
                    this.unsetProfileForWorkspace(e.window);
                }
            }));
            this._register(lifecycleMainService.onBeforeCloseWindow(window => this.unsetProfileForWorkspace(window)));
            this._register(new async_1.RunOnceScheduler(() => this.cleanUpEmptyWindowAssociations(), 30 * 1000 /* after 30s */)).schedule();
        }
        async unsetProfileForWorkspace(window) {
            const workspace = this.getWorkspace(window);
            const profile = this.userDataProfilesService.getProfileForWorkspace(workspace);
            if (profile?.isTransient) {
                this.userDataProfilesService.unsetWorkspace(workspace, profile.isTransient);
                if (profile.isTransient) {
                    await this.userDataProfilesService.cleanUpTransientProfiles();
                }
            }
        }
        getWorkspace(window) {
            return window.openedWorkspace ?? (0, workspace_1.toWorkspaceIdentifier)(window.backupPath, window.isExtensionDevelopmentHost);
        }
        cleanUpEmptyWindowAssociations() {
            const associatedEmptyWindows = this.userDataProfilesService.getAssociatedEmptyWindows();
            if (associatedEmptyWindows.length === 0) {
                return;
            }
            const openedWorkspaces = this.windowsMainService.getWindows().map(window => this.getWorkspace(window));
            for (const associatedEmptyWindow of associatedEmptyWindows) {
                if (openedWorkspaces.some(openedWorkspace => openedWorkspace.id === associatedEmptyWindow.id)) {
                    continue;
                }
                this.userDataProfilesService.unsetWorkspace(associatedEmptyWindow, false);
            }
        }
    };
    exports.UserDataProfilesHandler = UserDataProfilesHandler;
    exports.UserDataProfilesHandler = UserDataProfilesHandler = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, userDataProfile_1.IUserDataProfilesMainService),
        __param(2, windows_1.IWindowsMainService)
    ], UserDataProfilesHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlc0hhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVByb2ZpbGUvZWxlY3Ryb24tbWFpbi91c2VyRGF0YVByb2ZpbGVzSGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTtRQUV0RCxZQUN3QixvQkFBMkMsRUFDbkIsdUJBQXFELEVBQzlELGtCQUF1QztZQUU3RSxLQUFLLEVBQUUsQ0FBQztZQUh1Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQThCO1lBQzlELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFHN0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDeEQsSUFBSSxDQUFDLENBQUMsTUFBTSw0QkFBb0IsRUFBRSxDQUFDO29CQUNsQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN6QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsOEJBQThCLEVBQUUsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDekgsQ0FBQztRQUVPLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxNQUFtQjtZQUN6RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMvRSxJQUFJLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUM1RSxJQUFJLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDekIsTUFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDL0QsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sWUFBWSxDQUFDLE1BQW1CO1lBQ3ZDLE9BQU8sTUFBTSxDQUFDLGVBQWUsSUFBSSxJQUFBLGlDQUFxQixFQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDOUcsQ0FBQztRQUVPLDhCQUE4QjtZQUNyQyxNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQ3hGLElBQUksc0JBQXNCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN6QyxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN2RyxLQUFLLE1BQU0scUJBQXFCLElBQUksc0JBQXNCLEVBQUUsQ0FBQztnQkFDNUQsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsRUFBRSxLQUFLLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQy9GLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzNFLENBQUM7UUFDRixDQUFDO0tBRUQsQ0FBQTtJQTlDWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQUdqQyxXQUFBLDRDQUFxQixDQUFBO1FBQ3JCLFdBQUEsOENBQTRCLENBQUE7UUFDNUIsV0FBQSw2QkFBbUIsQ0FBQTtPQUxULHVCQUF1QixDQThDbkMifQ==