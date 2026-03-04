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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/ipc/electron-sandbox/services", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/native/common/native", "vs/platform/notification/common/notification", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/network", "vs/base/parts/ipc/common/ipc", "vs/base/common/lifecycle"], function (require, exports, contributions_1, userDataSync_1, services_1, actions_1, nls_1, environment_1, files_1, native_1, notification_1, userDataSync_2, network_1, ipc_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncServicesContribution = class UserDataSyncServicesContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.userDataSyncServices'; }
        constructor(userDataSyncUtilService, sharedProcessService) {
            super();
            sharedProcessService.registerChannel('userDataSyncUtil', ipc_1.ProxyChannel.fromService(userDataSyncUtilService, this._store));
        }
    };
    UserDataSyncServicesContribution = __decorate([
        __param(0, userDataSync_1.IUserDataSyncUtilService),
        __param(1, services_1.ISharedProcessService)
    ], UserDataSyncServicesContribution);
    (0, contributions_1.registerWorkbenchContribution2)(UserDataSyncServicesContribution.ID, UserDataSyncServicesContribution, 1 /* WorkbenchPhase.BlockStartup */);
    (0, actions_1.registerAction2)(class OpenSyncBackupsFolder extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.userData.actions.openSyncBackupsFolder',
                title: (0, nls_1.localize2)('Open Backup folder', "Open Local Backups Folder"),
                category: userDataSync_2.SYNC_TITLE,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */),
                }
            });
        }
        async run(accessor) {
            const syncHome = accessor.get(environment_1.IEnvironmentService).userDataSyncHome;
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const fileService = accessor.get(files_1.IFileService);
            const notificationService = accessor.get(notification_1.INotificationService);
            if (await fileService.exists(syncHome)) {
                const folderStat = await fileService.resolve(syncHome);
                const item = folderStat.children && folderStat.children[0] ? folderStat.children[0].resource : syncHome;
                return nativeHostService.showItemInFolder(item.with({ scheme: network_1.Schemas.file }).fsPath);
            }
            else {
                notificationService.info((0, nls_1.localize)('no backups', "Local backups folder does not exist"));
            }
        }
    });
    (0, actions_1.registerAction2)(class DownloadSyncActivityAction extends actions_1.Action2 {
        constructor() {
            super(userDataSync_2.DOWNLOAD_ACTIVITY_ACTION_DESCRIPTOR);
        }
        async run(accessor) {
            const userDataSyncWorkbenchService = accessor.get(userDataSync_2.IUserDataSyncWorkbenchService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const hostService = accessor.get(native_1.INativeHostService);
            const folder = await userDataSyncWorkbenchService.downloadSyncActivity();
            if (folder) {
                notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('download sync activity complete', "Successfully downloaded Settings Sync activity."), [{
                        label: (0, nls_1.localize)('open', "Open Folder"),
                        run: () => hostService.showItemInFolder(folder.fsPath)
                    }]);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3VzZXJEYXRhU3luYy9lbGVjdHJvbi1zYW5kYm94L3VzZXJEYXRhU3luYy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFpQmhHLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWlDLFNBQVEsc0JBQVU7aUJBRXhDLE9BQUUsR0FBRyx3Q0FBd0MsQUFBM0MsQ0FBNEM7UUFFOUQsWUFDMkIsdUJBQWlELEVBQ3BELG9CQUEyQztZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQUNSLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxrQkFBWSxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMxSCxDQUFDOztJQVZJLGdDQUFnQztRQUtuQyxXQUFBLHVDQUF3QixDQUFBO1FBQ3hCLFdBQUEsZ0NBQXFCLENBQUE7T0FObEIsZ0NBQWdDLENBV3JDO0lBRUQsSUFBQSw4Q0FBOEIsRUFBQyxnQ0FBZ0MsQ0FBQyxFQUFFLEVBQUUsZ0NBQWdDLHNDQUE4QixDQUFDO0lBRW5JLElBQUEseUJBQWUsRUFBQyxNQUFNLHFCQUFzQixTQUFRLGlCQUFPO1FBQzFEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxrREFBa0Q7Z0JBQ3RELEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxvQkFBb0IsRUFBRSwyQkFBMkIsQ0FBQztnQkFDbkUsUUFBUSxFQUFFLHlCQUFVO2dCQUNwQixJQUFJLEVBQUU7b0JBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsY0FBYztvQkFDekIsSUFBSSxFQUFFLGlDQUFr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