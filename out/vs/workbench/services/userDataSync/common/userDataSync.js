/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/nls", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/platform/action/common/actionCommonCategories"], function (require, exports, instantiation_1, contextkey_1, nls_1, codicons_1, iconRegistry_1, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DOWNLOAD_ACTIVITY_ACTION_DESCRIPTOR = exports.SYNC_CONFLICTS_VIEW_ID = exports.SYNC_VIEW_CONTAINER_ID = exports.SHOW_SYNC_LOG_COMMAND_ID = exports.CONFIGURE_SYNC_COMMAND_ID = exports.CONTEXT_HAS_CONFLICTS = exports.CONTEXT_ENABLE_SYNC_CONFLICTS_VIEW = exports.CONTEXT_ENABLE_ACTIVITY_VIEWS = exports.CONTEXT_ACCOUNT_STATE = exports.CONTEXT_SYNC_ENABLEMENT = exports.CONTEXT_SYNC_STATE = exports.SYNC_VIEW_ICON = exports.SYNC_TITLE = exports.AccountStatus = exports.IUserDataSyncWorkbenchService = void 0;
    exports.getSyncAreaLabel = getSyncAreaLabel;
    exports.IUserDataSyncWorkbenchService = (0, instantiation_1.createDecorator)('IUserDataSyncWorkbenchService');
    function getSyncAreaLabel(source) {
        switch (source) {
            case "settings" /* SyncResource.Settings */: return (0, nls_1.localize)('settings', "Settings");
            case "keybindings" /* SyncResource.Keybindings */: return (0, nls_1.localize)('keybindings', "Keyboard Shortcuts");
            case "snippets" /* SyncResource.Snippets */: return (0, nls_1.localize)('snippets', "User Snippets");
            case "tasks" /* SyncResource.Tasks */: return (0, nls_1.localize)('tasks', "User Tasks");
            case "extensions" /* SyncResource.Extensions */: return (0, nls_1.localize)('extensions', "Extensions");
            case "globalState" /* SyncResource.GlobalState */: return (0, nls_1.localize)('ui state label', "UI State");
            case "profiles" /* SyncResource.Profiles */: return (0, nls_1.localize)('profiles', "Profiles");
            case "workspaceState" /* SyncResource.WorkspaceState */: return (0, nls_1.localize)('workspace state label', "Workspace State");
        }
    }
    var AccountStatus;
    (function (AccountStatus) {
        AccountStatus["Unavailable"] = "unavailable";
        AccountStatus["Available"] = "available";
    })(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
    exports.SYNC_TITLE = (0, nls_1.localize2)('sync category', "Settings Sync");
    exports.SYNC_VIEW_ICON = (0, iconRegistry_1.registerIcon)('settings-sync-view-icon', codicons_1.Codicon.sync, (0, nls_1.localize)('syncViewIcon', 'View icon of the Settings Sync view.'));
    // Contexts
    exports.CONTEXT_SYNC_STATE = new contextkey_1.RawContextKey('syncStatus', "uninitialized" /* SyncStatus.Uninitialized */);
    exports.CONTEXT_SYNC_ENABLEMENT = new contextkey_1.RawContextKey('syncEnabled', false);
    exports.CONTEXT_ACCOUNT_STATE = new contextkey_1.RawContextKey('userDataSyncAccountStatus', "unavailable" /* AccountStatus.Unavailable */);
    exports.CONTEXT_ENABLE_ACTIVITY_VIEWS = new contextkey_1.RawContextKey(`enableSyncActivityViews`, false);
    exports.CONTEXT_ENABLE_SYNC_CONFLICTS_VIEW = new contextkey_1.RawContextKey(`enableSyncConflictsView`, false);
    exports.CONTEXT_HAS_CONFLICTS = new contextkey_1.RawContextKey('hasConflicts', false);
    // Commands
    exports.CONFIGURE_SYNC_COMMAND_ID = 'workbench.userDataSync.actions.configure';
    exports.SHOW_SYNC_LOG_COMMAND_ID = 'workbench.userDataSync.actions.showLog';
    // VIEWS
    exports.SYNC_VIEW_CONTAINER_ID = 'workbench.view.sync';
    exports.SYNC_CONFLICTS_VIEW_ID = 'workbench.views.sync.conflicts';
    exports.DOWNLOAD_ACTIVITY_ACTION_DESCRIPTOR = {
        id: 'workbench.userDataSync.actions.downloadSyncActivity',
        title: (0, nls_1.localize2)('download sync activity title', "Download Settings Sync Activity"),
        category: actionCommonCategories_1.Categories.Developer,
        f1: true,
        precondition: contextkey_1.ContextKeyExpr.and(exports.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), exports.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */))
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhU3luYy9jb21tb24vdXNlckRhdGFTeW5jLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtEaEcsNENBV0M7SUF4Q1ksUUFBQSw2QkFBNkIsR0FBRyxJQUFBLCtCQUFlLEVBQWdDLCtCQUErQixDQUFDLENBQUM7SUE2QjdILFNBQWdCLGdCQUFnQixDQUFDLE1BQW9CO1FBQ3BELFFBQVEsTUFBTSxFQUFFLENBQUM7WUFDaEIsMkNBQTBCLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNwRSxpREFBNkIsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFDcEYsMkNBQTBCLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUN6RSxxQ0FBdUIsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2hFLCtDQUE0QixDQUFDLENBQUMsT0FBTyxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDMUUsaURBQTZCLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzdFLDJDQUEwQixDQUFDLENBQUMsT0FBTyxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDcEUsdURBQWdDLENBQUMsQ0FBQyxPQUFPLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDL0YsQ0FBQztJQUNGLENBQUM7SUFFRCxJQUFrQixhQUdqQjtJQUhELFdBQWtCLGFBQWE7UUFDOUIsNENBQTJCLENBQUE7UUFDM0Isd0NBQXVCLENBQUE7SUFDeEIsQ0FBQyxFQUhpQixhQUFhLDZCQUFiLGFBQWEsUUFHOUI7SUFNWSxRQUFBLFVBQVUsR0FBcUIsSUFBQSxlQUFTLEVBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBRTNFLFFBQUEsY0FBYyxHQUFHLElBQUEsMkJBQVksRUFBQyx5QkFBeUIsRUFBRSxrQkFBTyxDQUFDLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsc0NBQXNDLENBQUMsQ0FBQyxDQUFDO0lBRXRKLFdBQVc7SUFDRSxRQUFBLGtCQUFrQixHQUFHLElBQUksMEJBQWEsQ0FBUyxZQUFZLGlEQUEyQixDQUFDO0lBQ3ZGLFFBQUEsdUJBQXVCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzRSxRQUFBLHFCQUFxQixHQUFHLElBQUksMEJBQWEsQ0FBUywyQkFBMkIsZ0RBQTRCLENBQUM7SUFDMUcsUUFBQSw2QkFBNkIsR0FBRyxJQUFJLDBCQUFhLENBQVUseUJBQXlCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDN0YsUUFBQSxrQ0FBa0MsR0FBRyxJQUFJLDBCQUFhLENBQVUseUJBQXlCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbEcsUUFBQSxxQkFBcUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXZGLFdBQVc7SUFDRSxRQUFBLHlCQUF5QixHQUFHLDBDQUEwQyxDQUFDO0lBQ3ZFLFFBQUEsd0JBQXdCLEdBQUcsd0NBQXdDLENBQUM7SUFFakYsUUFBUTtJQUNLLFFBQUEsc0JBQXNCLEdBQUcscUJBQXFCLENBQUM7SUFDL0MsUUFBQSxzQkFBc0IsR0FBRyxnQ0FBZ0MsQ0FBQztJQUUxRCxRQUFBLG1DQUFtQyxHQUE4QjtRQUM3RSxFQUFFLEVBQUUscURBQXFEO1FBQ3pELEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyw4QkFBOEIsRUFBRSxpQ0FBaUMsQ0FBQztRQUNuRixRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO1FBQzlCLEVBQUUsRUFBRSxJQUFJO1FBQ1IsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDZCQUFxQixDQUFDLFNBQVMsMkNBQXlCLEVBQUUsMEJBQWtCLENBQUMsV0FBVyxnREFBMEIsQ0FBQztLQUNwSixDQUFDIn0=