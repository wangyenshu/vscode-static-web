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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/quickinput/common/quickInput", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/base/common/uri", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/tags/common/workspaceTags", "vs/base/common/errors", "vs/platform/action/common/actionCommonCategories", "vs/platform/opener/common/opener"], function (require, exports, lifecycle_1, platform_1, nls_1, actions_1, contextkey_1, userDataProfile_1, lifecycle_2, userDataProfile_2, quickInput_1, notification_1, dialogs_1, uri_1, telemetry_1, workspace_1, workspaceTags_1, errors_1, actionCommonCategories_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfilesWorkbenchContribution = void 0;
    let UserDataProfilesWorkbenchContribution = class UserDataProfilesWorkbenchContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.userDataProfiles'; }
        constructor(userDataProfileService, userDataProfilesService, userDataProfileManagementService, userDataProfileImportExportService, telemetryService, workspaceContextService, workspaceTagsService, contextKeyService, lifecycleService) {
            super();
            this.userDataProfileService = userDataProfileService;
            this.userDataProfilesService = userDataProfilesService;
            this.userDataProfileManagementService = userDataProfileManagementService;
            this.userDataProfileImportExportService = userDataProfileImportExportService;
            this.telemetryService = telemetryService;
            this.workspaceContextService = workspaceContextService;
            this.workspaceTagsService = workspaceTagsService;
            this.lifecycleService = lifecycleService;
            this.profilesDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.currentprofileActionsDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.currentProfileContext = userDataProfile_2.CURRENT_PROFILE_CONTEXT.bindTo(contextKeyService);
            userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT.bindTo(contextKeyService).set(this.userDataProfilesService.isEnabled());
            this.isCurrentProfileTransientContext = userDataProfile_2.IS_CURRENT_PROFILE_TRANSIENT_CONTEXT.bindTo(contextKeyService);
            this.currentProfileContext.set(this.userDataProfileService.currentProfile.id);
            this.isCurrentProfileTransientContext.set(!!this.userDataProfileService.currentProfile.isTransient);
            this._register(this.userDataProfileService.onDidChangeCurrentProfile(e => {
                this.currentProfileContext.set(this.userDataProfileService.currentProfile.id);
                this.isCurrentProfileTransientContext.set(!!this.userDataProfileService.currentProfile.isTransient);
            }));
            this.hasProfilesContext = userDataProfile_2.HAS_PROFILES_CONTEXT.bindTo(contextKeyService);
            this.hasProfilesContext.set(this.userDataProfilesService.profiles.length > 1);
            this._register(this.userDataProfilesService.onDidChangeProfiles(e => this.hasProfilesContext.set(this.userDataProfilesService.profiles.length > 1)));
            this.registerActions();
            if (platform_1.isWeb) {
                lifecycleService.when(4 /* LifecyclePhase.Eventually */).then(() => userDataProfilesService.cleanUp());
            }
            this.reportWorkspaceProfileInfo();
        }
        registerActions() {
            this.registerProfileSubMenu();
            this._register(this.registerSwitchProfileAction());
            this.registerProfilesActions();
            this._register(this.userDataProfilesService.onDidChangeProfiles(() => this.registerProfilesActions()));
            this.registerCurrentProfilesActions();
            this._register(this.userDataProfileService.onDidChangeCurrentProfile(() => this.registerCurrentProfilesActions()));
            this.registerCreateFromCurrentProfileAction();
            this.registerCreateProfileAction();
            this.registerDeleteProfileAction();
            this.registerHelpAction();
        }
        registerProfileSubMenu() {
            const getProfilesTitle = () => {
                return (0, nls_1.localize)('profiles', "Profiles ({0})", this.userDataProfileService.currentProfile.name);
            };
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                get title() {
                    return getProfilesTitle();
                },
                submenu: userDataProfile_2.ProfilesMenu,
                group: '2_configuration',
                order: 1,
            });
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
                get title() {
                    return getProfilesTitle();
                },
                submenu: userDataProfile_2.ProfilesMenu,
                group: '2_configuration',
                order: 1,
                when: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
            });
        }
        registerProfilesActions() {
            this.profilesDisposable.value = new lifecycle_1.DisposableStore();
            for (const profile of this.userDataProfilesService.profiles) {
                this.profilesDisposable.value.add(this.registerProfileEntryAction(profile));
            }
        }
        registerProfileEntryAction(profile) {
            const that = this;
            return (0, actions_1.registerAction2)(class ProfileEntryAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.profiles.actions.profileEntry.${profile.id}`,
                        title: profile.name,
                        toggled: contextkey_1.ContextKeyExpr.equals(userDataProfile_2.CURRENT_PROFILE_CONTEXT.key, profile.id),
                        menu: [
                            {
                                id: userDataProfile_2.ProfilesMenu,
                                group: '0_profiles',
                                when: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
                            }
                        ]
                    });
                }
                async run(accessor) {
                    if (that.userDataProfileService.currentProfile.id !== profile.id) {
                        return that.userDataProfileManagementService.switchProfile(profile);
                    }
                }
            });
        }
        registerSwitchProfileAction() {
            return (0, actions_1.registerAction2)(class SwitchProfileAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.profiles.actions.switchProfile`,
                        title: (0, nls_1.localize2)('switchProfile', 'Switch Profile...'),
                        category: userDataProfile_2.PROFILES_CATEGORY,
                        f1: true,
                        precondition: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
                    });
                }
                async run(accessor) {
                    const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                    const menuService = accessor.get(actions_1.IMenuService);
                    const menu = menuService.createMenu(userDataProfile_2.ProfilesMenu, accessor.get(contextkey_1.IContextKeyService));
                    const actions = menu.getActions().find(([group]) => group === '0_profiles')?.[1] ?? [];
                    try {
                        const result = await quickInputService.pick(actions.map(action => ({
                            action,
                            label: action.checked ? `$(check) ${action.label}` : action.label,
                        })), {
                            placeHolder: (0, nls_1.localize)('selectProfile', "Select Profile")
                        });
                        await result?.action.run();
                    }
                    finally {
                        menu.dispose();
                    }
                }
            });
        }
        registerCurrentProfilesActions() {
            this.currentprofileActionsDisposable.value = new lifecycle_1.DisposableStore();
            this.currentprofileActionsDisposable.value.add(this.registerEditCurrentProfileAction());
            this.currentprofileActionsDisposable.value.add(this.registerShowCurrentProfileContentsAction());
            this.currentprofileActionsDisposable.value.add(this.registerExportCurrentProfileAction());
            this.currentprofileActionsDisposable.value.add(this.registerImportProfileAction());
        }
        registerEditCurrentProfileAction() {
            const that = this;
            return (0, actions_1.registerAction2)(class RenameCurrentProfileAction extends actions_1.Action2 {
                constructor() {
                    const when = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.notEquals(userDataProfile_2.CURRENT_PROFILE_CONTEXT.key, that.userDataProfilesService.defaultProfile.id), userDataProfile_2.IS_CURRENT_PROFILE_TRANSIENT_CONTEXT.toNegated());
                    super({
                        id: `workbench.profiles.actions.editCurrentProfile`,
                        title: (0, nls_1.localize2)('edit profile', "Edit Profile..."),
                        precondition: when,
                        f1: true,
                        menu: [
                            {
                                id: userDataProfile_2.ProfilesMenu,
                                group: '2_manage_current',
                                when,
                                order: 2
                            }
                        ]
                    });
                }
                run() {
                    return that.userDataProfileImportExportService.editProfile(that.userDataProfileService.currentProfile);
                }
            });
        }
        registerShowCurrentProfileContentsAction() {
            const id = 'workbench.profiles.actions.showProfileContents';
            return (0, actions_1.registerAction2)(class ShowProfileContentsAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id,
                        title: (0, nls_1.localize2)('show profile contents', "Show Profile Contents"),
                        category: userDataProfile_2.PROFILES_CATEGORY,
                        menu: [
                            {
                                id: userDataProfile_2.ProfilesMenu,
                                group: '2_manage_current',
                                order: 3
                            }, {
                                id: actions_1.MenuId.CommandPalette
                            }
                        ]
                    });
                }
                async run(accessor) {
                    const userDataProfileImportExportService = accessor.get(userDataProfile_2.IUserDataProfileImportExportService);
                    return userDataProfileImportExportService.showProfileContents();
                }
            });
        }
        registerExportCurrentProfileAction() {
            const that = this;
            const disposables = new lifecycle_1.DisposableStore();
            const id = 'workbench.profiles.actions.exportProfile';
            disposables.add((0, actions_1.registerAction2)(class ExportProfileAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id,
                        title: (0, nls_1.localize2)('export profile', "Export Profile..."),
                        category: userDataProfile_2.PROFILES_CATEGORY,
                        precondition: userDataProfile_2.IS_PROFILE_EXPORT_IN_PROGRESS_CONTEXT.toNegated(),
                        menu: [
                            {
                                id: userDataProfile_2.ProfilesMenu,
                                group: '4_import_export_profiles',
                                order: 1
                            }, {
                                id: actions_1.MenuId.CommandPalette
                            }
                        ]
                    });
                }
                async run(accessor) {
                    const userDataProfileImportExportService = accessor.get(userDataProfile_2.IUserDataProfileImportExportService);
                    return userDataProfileImportExportService.exportProfile();
                }
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarShare, {
                command: {
                    id,
                    title: (0, nls_1.localize2)('export profile in share', "Export Profile ({0})...", that.userDataProfileService.currentProfile.name),
                    precondition: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
                },
            }));
            return disposables;
        }
        registerImportProfileAction() {
            const disposables = new lifecycle_1.DisposableStore();
            const id = 'workbench.profiles.actions.importProfile';
            const that = this;
            disposables.add((0, actions_1.registerAction2)(class ImportProfileAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id,
                        title: (0, nls_1.localize2)('import profile', "Import Profile..."),
                        category: userDataProfile_2.PROFILES_CATEGORY,
                        precondition: userDataProfile_2.IS_PROFILE_IMPORT_IN_PROGRESS_CONTEXT.toNegated(),
                        menu: [
                            {
                                id: userDataProfile_2.ProfilesMenu,
                                group: '4_import_export_profiles',
                                when: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
                                order: 2
                            }, {
                                id: actions_1.MenuId.CommandPalette,
                                when: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
                            }
                        ]
                    });
                }
                async run(accessor) {
                    const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                    const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                    const userDataProfileImportExportService = accessor.get(userDataProfile_2.IUserDataProfileImportExportService);
                    const notificationService = accessor.get(notification_1.INotificationService);
                    const disposables = new lifecycle_1.DisposableStore();
                    const quickPick = disposables.add(quickInputService.createQuickPick());
                    const profileTemplateQuickPickItems = await that.getProfileTemplatesQuickPickItems();
                    const updateQuickPickItems = (value) => {
                        const quickPickItems = [];
                        if (value) {
                            quickPickItems.push({ label: quickPick.value, description: (0, nls_1.localize)('import from url', "Import from URL") });
                        }
                        quickPickItems.push({ label: (0, nls_1.localize)('import from file', "Select File...") });
                        if (profileTemplateQuickPickItems.length) {
                            quickPickItems.push({
                                type: 'separator',
                                label: (0, nls_1.localize)('templates', "Profile Templates")
                            }, ...profileTemplateQuickPickItems);
                        }
                        quickPick.items = quickPickItems;
                    };
                    quickPick.title = (0, nls_1.localize)('import profile quick pick title', "Import from Profile Template...");
                    quickPick.placeholder = (0, nls_1.localize)('import profile placeholder', "Provide Profile Template URL");
                    quickPick.ignoreFocusOut = true;
                    disposables.add(quickPick.onDidChangeValue(updateQuickPickItems));
                    updateQuickPickItems();
                    quickPick.matchOnLabel = false;
                    quickPick.matchOnDescription = false;
                    disposables.add(quickPick.onDidAccept(async () => {
                        quickPick.hide();
                        const selectedItem = quickPick.selectedItems[0];
                        if (!selectedItem) {
                            return;
                        }
                        try {
                            if (selectedItem.url) {
                                return await that.userDataProfileImportExportService.createProfile(uri_1.URI.parse(selectedItem.url));
                            }
                            const profile = selectedItem.label === quickPick.value ? uri_1.URI.parse(quickPick.value) : await this.getProfileUriFromFileSystem(fileDialogService);
                            if (profile) {
                                await userDataProfileImportExportService.importProfile(profile);
                            }
                        }
                        catch (error) {
                            notificationService.error((0, nls_1.localize)('profile import error', "Error while creating profile: {0}", (0, errors_1.getErrorMessage)(error)));
                        }
                    }));
                    disposables.add(quickPick.onDidHide(() => disposables.dispose()));
                    quickPick.show();
                }
                async getProfileUriFromFileSystem(fileDialogService) {
                    const profileLocation = await fileDialogService.showOpenDialog({
                        canSelectFolders: false,
                        canSelectFiles: true,
                        canSelectMany: false,
                        filters: userDataProfile_2.PROFILE_FILTER,
                        title: (0, nls_1.localize)('import profile dialog', "Select Profile Template File"),
                    });
                    if (!profileLocation) {
                        return null;
                    }
                    return profileLocation[0];
                }
            }));
            disposables.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarShare, {
                command: {
                    id,
                    title: (0, nls_1.localize2)('import profile share', "Import Profile..."),
                    precondition: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
                },
            }));
            return disposables;
        }
        registerCreateFromCurrentProfileAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class CreateFromCurrentProfileAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.profiles.actions.createFromCurrentProfile',
                        title: (0, nls_1.localize2)('save profile as', "Save Current Profile As..."),
                        category: userDataProfile_2.PROFILES_CATEGORY,
                        f1: true,
                        precondition: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT
                    });
                }
                run(accessor) {
                    return that.userDataProfileImportExportService.createProfile(that.userDataProfileService.currentProfile);
                }
            }));
        }
        registerCreateProfileAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class CreateProfileAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.profiles.actions.createProfile',
                        title: (0, nls_1.localize2)('create profile', "Create Profile..."),
                        category: userDataProfile_2.PROFILES_CATEGORY,
                        precondition: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
                        f1: true,
                        menu: [
                            {
                                id: userDataProfile_2.ProfilesMenu,
                                group: '3_manage_profiles',
                                when: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
                                order: 1
                            }
                        ]
                    });
                }
                async run(accessor) {
                    return that.userDataProfileImportExportService.createProfile();
                }
            }));
        }
        registerDeleteProfileAction() {
            this._register((0, actions_1.registerAction2)(class DeleteProfileAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.profiles.actions.deleteProfile',
                        title: (0, nls_1.localize2)('delete profile', "Delete Profile..."),
                        category: userDataProfile_2.PROFILES_CATEGORY,
                        f1: true,
                        precondition: contextkey_1.ContextKeyExpr.and(userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT, userDataProfile_2.HAS_PROFILES_CONTEXT),
                        menu: [
                            {
                                id: userDataProfile_2.ProfilesMenu,
                                group: '3_manage_profiles',
                                when: userDataProfile_2.PROFILES_ENABLEMENT_CONTEXT,
                                order: 2
                            }
                        ]
                    });
                }
                async run(accessor) {
                    const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                    const userDataProfileService = accessor.get(userDataProfile_2.IUserDataProfileService);
                    const userDataProfilesService = accessor.get(userDataProfile_1.IUserDataProfilesService);
                    const userDataProfileManagementService = accessor.get(userDataProfile_2.IUserDataProfileManagementService);
                    const notificationService = accessor.get(notification_1.INotificationService);
                    const profiles = userDataProfilesService.profiles.filter(p => !p.isDefault && !p.isTransient);
                    if (profiles.length) {
                        const picks = await quickInputService.pick(profiles.map(profile => ({
                            label: profile.name,
                            description: profile.id === userDataProfileService.currentProfile.id ? (0, nls_1.localize)('current', "Current") : undefined,
                            profile
                        })), {
                            title: (0, nls_1.localize)('delete specific profile', "Delete Profile..."),
                            placeHolder: (0, nls_1.localize)('pick profile to delete', "Select Profiles to Delete"),
                            canPickMany: true
                        });
                        if (picks) {
                            try {
                                await Promise.all(picks.map(pick => userDataProfileManagementService.removeProfile(pick.profile)));
                            }
                            catch (error) {
                                notificationService.error(error);
                            }
                        }
                    }
                }
            }));
        }
        registerHelpAction() {
            this._register((0, actions_1.registerAction2)(class HelpAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.profiles.actions.help',
                        title: userDataProfile_2.PROFILES_TITLE,
                        category: actionCommonCategories_1.Categories.Help,
                        menu: [{
                                id: actions_1.MenuId.CommandPalette,
                            }],
                    });
                }
                run(accessor) {
                    return accessor.get(opener_1.IOpenerService).open(uri_1.URI.parse('https://aka.ms/vscode-profiles-help'));
                }
            }));
        }
        async getProfileTemplatesQuickPickItems() {
            const quickPickItems = [];
            const profileTemplates = await this.userDataProfileManagementService.getBuiltinProfileTemplates();
            for (const template of profileTemplates) {
                quickPickItems.push({
                    label: template.name,
                    ...template
                });
            }
            return quickPickItems;
        }
        async reportWorkspaceProfileInfo() {
            await this.lifecycleService.when(4 /* LifecyclePhase.Eventually */);
            const workspaceId = await this.workspaceTagsService.getTelemetryWorkspaceId(this.workspaceContextService.getWorkspace(), this.workspaceContextService.getWorkbenchState());
            this.telemetryService.publicLog2('workspaceProfileInfo', {
                workspaceId,
                defaultProfile: this.userDataProfileService.currentProfile.isDefault
            });
        }
    };
    exports.UserDataProfilesWorkbenchContribution = UserDataProfilesWorkbenchContribution;
    exports.UserDataProfilesWorkbenchContribution = UserDataProfilesWorkbenchContribution = __decorate([
        __param(0, userDataProfile_2.IUserDataProfileService),
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, userDataProfile_2.IUserDataProfileManagementService),
        __param(3, userDataProfile_2.IUserDataProfileImportExportService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, workspaceTags_1.IWorkspaceTagsService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, lifecycle_2.ILifecycleService)
    ], UserDataProfilesWorkbenchContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXNlckRhdGFQcm9maWxlL2Jyb3dzZXIvdXNlckRhdGFQcm9maWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXlCekYsSUFBTSxxQ0FBcUMsR0FBM0MsTUFBTSxxQ0FBc0MsU0FBUSxzQkFBVTtpQkFFcEQsT0FBRSxHQUFHLG9DQUFvQyxBQUF2QyxDQUF3QztRQU0xRCxZQUMwQixzQkFBZ0UsRUFDL0QsdUJBQWtFLEVBQ3pELGdDQUFvRixFQUNsRixrQ0FBd0YsRUFDMUcsZ0JBQW9ELEVBQzdDLHVCQUFrRSxFQUNyRSxvQkFBNEQsRUFDL0QsaUJBQXFDLEVBQ3RDLGdCQUFvRDtZQUV2RSxLQUFLLEVBQUUsQ0FBQztZQVZrQywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQzlDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDeEMscUNBQWdDLEdBQWhDLGdDQUFnQyxDQUFtQztZQUNqRSx1Q0FBa0MsR0FBbEMsa0NBQWtDLENBQXFDO1lBQ3pGLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDNUIsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUNwRCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBRS9DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFvRXZELHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBbUIsQ0FBQyxDQUFDO1lBZ0U5RSxvQ0FBK0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQW1CLENBQUMsQ0FBQztZQWhJM0csSUFBSSxDQUFDLHFCQUFxQixHQUFHLHlDQUF1QixD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