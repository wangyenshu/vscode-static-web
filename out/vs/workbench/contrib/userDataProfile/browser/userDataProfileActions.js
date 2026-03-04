/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/base/common/codicons", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, actions_1, codicons_1, nls_1, actionCommonCategories_1, menuEntryActionViewItem_1, actions_2, commands_1, contextkey_1, notification_1, quickInput_1, userDataProfile_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenameProfileAction = void 0;
    class CreateTransientProfileAction extends actions_2.Action2 {
        static { this.ID = 'workbench.profiles.actions.createTemporaryProfile'; }
        static { this.TITLE = (0, nls_1.localize2)('create temporary profile', "Create a Temporary Profile"); }
        constructor() {
            super({
                id: CreateTransientProfileAction.ID,
                title: CreateTransientProfileAction.TITLE,
                category: userDataProfile_2.PROFILES_CATEGORY,
                f1: true,
                precondition: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
            });
        }
        async run(accessor) {
            return accessor.get(userDataProfile_2.IUserDataProfileManagementService).createAndEnterTransientProfile();
        }
    }
    (0, actions_2.registerAction2)(CreateTransientProfileAction);
    class RenameProfileAction extends actions_2.Action2 {
        static { this.ID = 'workbench.profiles.actions.renameProfile'; }
        constructor() {
            super({
                id: RenameProfileAction.ID,
                title: (0, nls_1.localize2)('rename profile', "Rename..."),
                category: userDataProfile_2.PROFILES_CATEGORY,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT, userDataProfile_2.HAS_PROFILES_CONTEXT),
            });
        }
        async run(accessor, profile) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const userDataProfileService = accessor.get(userDataProfile_2.IUserDataProfileService);
            const userDataProfilesService = accessor.get(userDataProfile_1.IUserDataProfilesService);
            const userDataProfileManagementService = accessor.get(userDataProfile_2.IUserDataProfileManagementService);
            const notificationService = accessor.get(notification_1.INotificationService);
            if (!profile) {
                profile = await this.pickProfile(quickInputService, userDataProfileService, userDataProfilesService);
            }
            if (!profile || profile.isDefault) {
                return;
            }
            const name = await quickInputService.input({
                value: profile.name,
                title: (0, nls_1.localize)('select profile to rename', 'Rename {0}', profile.name),
                validateInput: async (value) => {
                    if (profile.name !== value && userDataProfilesService.profiles.some(p => p.name === value)) {
                        return (0, nls_1.localize)('profileExists', "Profile with name {0} already exists.", value);
                    }
                    return undefined;
                }
            });
            if (name && name !== profile.name) {
                try {
                    await userDataProfileManagementService.updateProfile(profile, { name });
                }
                catch (error) {
                    notificationService.error(error);
                }
            }
        }
        async pickProfile(quickInputService, userDataProfileService, userDataProfilesService) {
            const profiles = userDataProfilesService.profiles.filter(p => !p.isDefault && !p.isTransient);
            if (!profiles.length) {
                return undefined;
            }
            const pick = await quickInputService.pick(profiles.map(profile => ({
                label: profile.name,
                description: profile.id === userDataProfileService.currentProfile.id ? (0, nls_1.localize)('current', "Current") : undefined,
                profile
            })), {
                title: (0, nls_1.localize)('rename specific profile', "Rename Profile..."),
                placeHolder: (0, nls_1.localize)('pick profile to rename', "Select Profile to Rename"),
            });
            return pick?.profile;
        }
    }
    exports.RenameProfileAction = RenameProfileAction;
    (0, actions_2.registerAction2)(RenameProfileAction);
    (0, actions_2.registerAction2)(class ManageProfilesAction extends actions_2.Action2 {
        constructor() {
            super({
                id: userDataProfile_2.MANAGE_PROFILES_ACTION_ID,
                title: (0, nls_1.localize2)('mange', "Manage..."),
                category: userDataProfile_2.PROFILES_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT, userDataProfile_2.HAS_PROFILES_CONTEXT),
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const menuService = accessor.get(actions_2.IMenuService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const commandService = accessor.get(commands_1.ICommandService);
            const menu = menuService.createMenu(userDataProfile_2.ProfilesMenu, contextKeyService);
            const actions = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, undefined, actions);
            menu.dispose();
            if (actions.length) {
                const picks = actions.map(action => {
                    if (action instanceof actions_1.Separator) {
                        return { type: 'separator' };
                    }
                    return {
                        id: action.id,
                        label: `${action.label}${action.checked ? ` $(${codicons_1.Codicon.check.id})` : ''}`,
                    };
                });
                const pick = await quickInputService.pick(picks, { canPickMany: false, title: userDataProfile_2.PROFILES_CATEGORY.value });
                if (pick?.id) {
                    await commandService.executeCommand(pick.id);
                }
            }
        }
    });
    // Developer Actions
    (0, actions_2.registerAction2)(class CleanupProfilesAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.profiles.actions.cleanupProfiles',
                title: (0, nls_1.localize2)('cleanup profile', "Cleanup Profiles"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                precondition: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
            });
        }
        async run(accessor) {
            return accessor.get(userDataProfile_1.IUserDataProfilesService).cleanUp();
        }
    });
    (0, actions_2.registerAction2)(class ResetWorkspacesAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.profiles.actions.resetWorkspaces',
                title: (0, nls_1.localize2)('reset workspaces', "Reset Workspace Profiles Associations"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                precondition: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
            });
        }
        async run(accessor) {
            const userDataProfilesService = accessor.get(userDataProfile_1.IUserDataProfilesService);
            return userDataProfilesService.resetWorkspaces();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3VzZXJEYXRhUHJvZmlsZS9icm93c2VyL3VzZXJEYXRhUHJvZmlsZUFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JoRyxNQUFNLDRCQUE2QixTQUFRLGlCQUFPO2lCQUNqQyxPQUFFLEdBQUcsbURBQW1ELENBQUM7aUJBQ3pELFVBQUssR0FBRyxJQUFBLGVBQVMsRUFBQywwQkFBMEIsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1FBQzVGO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw0QkFBNEIsQ0FBQyxFQUFFO2dCQUNuQyxLQUFLLEVBQUUsNEJBQTRCLENBQUMsS0FBSztnQkFDekMsUUFBUSxFQUFFLG1DQUFpQjtnQkFDM0IsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsWUFBWSxFQUFFLDZDQUEyQjthQUN6QyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUNuQyxPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsbURBQWlDLENBQUMsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1FBQ3pGLENBQUM7O0lBR0YsSUFBQSx5QkFBZSxFQUFDLDRCQUE0QixDQUFDLENBQUM7SUFFOUMsTUFBYSxtQkFBb0IsU0FBUSxpQkFBTztpQkFDL0IsT0FBRSxHQUFHLDBDQUEwQyxDQUFDO1FBQ2hFO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFO2dCQUMxQixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDO2dCQUMvQyxRQUFRLEVBQUUsbUNBQWlCO2dCQUMzQixFQUFF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