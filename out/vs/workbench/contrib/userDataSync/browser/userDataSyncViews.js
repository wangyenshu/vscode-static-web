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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/nls", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/treeView", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataSync", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/workbench/services/editor/common/editorService", "vs/platform/theme/common/themeService", "vs/base/common/date", "vs/platform/dialogs/common/dialogs", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/codicons", "vs/base/common/actions", "vs/workbench/services/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/platform/quickinput/common/quickInput", "vs/platform/notification/common/notification", "vs/base/common/resources", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/files/common/files", "vs/platform/environment/common/environment", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/commands/common/commands", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/contrib/userDataSync/browser/userDataSyncConflictsView"], function (require, exports, platform_1, views_1, nls_1, descriptors_1, treeView_1, instantiation_1, userDataSync_1, actions_1, contextkey_1, uri_1, editorService_1, themeService_1, date_1, dialogs_1, event_1, lifecycle_1, codicons_1, actions_2, userDataSync_2, userDataSyncMachines_1, quickInput_1, notification_1, resources_1, editorCommands_1, files_1, environment_1, uriIdentity_1, commands_1, userDataProfile_1, userDataSyncConflictsView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncDataViews = void 0;
    let UserDataSyncDataViews = class UserDataSyncDataViews extends lifecycle_1.Disposable {
        constructor(container, instantiationService, userDataSyncEnablementService, userDataSyncMachinesService, userDataSyncService) {
            super();
            this.instantiationService = instantiationService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.userDataSyncService = userDataSyncService;
            this.registerViews(container);
        }
        registerViews(container) {
            this.registerConflictsView(container);
            this.registerActivityView(container, true);
            this.registerMachinesView(container);
            this.registerActivityView(container, false);
            this.registerTroubleShootView(container);
            this.registerExternalActivityView(container);
        }
        registerConflictsView(container) {
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            const viewName = (0, nls_1.localize2)('conflicts', "Conflicts");
            viewsRegistry.registerViews([{
                    id: userDataSync_2.SYNC_CONFLICTS_VIEW_ID,
                    name: viewName,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(userDataSyncConflictsView_1.UserDataSyncConflictsViewPane),
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_ENABLE_SYNC_CONFLICTS_VIEW, userDataSync_2.CONTEXT_HAS_CONFLICTS),
                    canToggleVisibility: false,
                    canMoveView: false,
                    treeView: this.instantiationService.createInstance(treeView_1.TreeView, userDataSync_2.SYNC_CONFLICTS_VIEW_ID, viewName.value),
                    collapsed: false,
                    order: 100,
                }], container);
        }
        registerMachinesView(container) {
            const id = `workbench.views.sync.machines`;
            const name = (0, nls_1.localize2)('synced machines', "Synced Machines");
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name.value);
            const dataProvider = this.instantiationService.createInstance(UserDataSyncMachinesViewDataProvider, treeView);
            treeView.showRefreshAction = true;
            treeView.canSelectMany = true;
            treeView.dataProvider = dataProvider;
            this._register(event_1.Event.any(this.userDataSyncMachinesService.onDidChange, this.userDataSyncService.onDidResetRemote)(() => treeView.refresh()));
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS),
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    order: 300,
                }], container);
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.editMachineName`,
                        title: (0, nls_1.localize)('workbench.actions.sync.editMachineName', "Edit Name"),
                        icon: codicons_1.Codicon.edit,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', id)),
                            group: 'inline',
                        },
                    });
                }
                async run(accessor, handle) {
                    const changed = await dataProvider.rename(handle.$treeItemHandle);
                    if (changed) {
                        await treeView.refresh();
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.turnOffSyncOnMachine`,
                        title: (0, nls_1.localize)('workbench.actions.sync.turnOffSyncOnMachine', "Turn off Settings Sync"),
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', id), contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-machine')),
                        },
                    });
                }
                async run(accessor, handle, selected) {
                    if (await dataProvider.disable((selected || [handle]).map(handle => handle.$treeItemHandle))) {
                        await treeView.refresh();
                    }
                }
            }));
        }
        registerActivityView(container, remote) {
            const id = `workbench.views.sync.${remote ? 'remote' : 'local'}Activity`;
            const name = remote ? (0, nls_1.localize2)('remote sync activity title', "Sync Activity (Remote)") : (0, nls_1.localize2)('local sync activity title', "Sync Activity (Local)");
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name.value);
            treeView.showCollapseAllAction = true;
            treeView.showRefreshAction = true;
            treeView.dataProvider = remote ? this.instantiationService.createInstance(RemoteUserDataSyncActivityViewDataProvider)
                : this.instantiationService.createInstance(LocalUserDataSyncActivityViewDataProvider);
            this._register(event_1.Event.any(this.userDataSyncEnablementService.onDidChangeResourceEnablement, this.userDataSyncEnablementService.onDidChangeEnablement, this.userDataSyncService.onDidResetLocal, this.userDataSyncService.onDidResetRemote)(() => treeView.refresh()));
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS),
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    order: remote ? 200 : 400,
                    hideByDefault: !remote,
                }], container);
            this.registerDataViewActions(id);
        }
        registerExternalActivityView(container) {
            const id = `workbench.views.sync.externalActivity`;
            const name = (0, nls_1.localize2)('downloaded sync activity title', "Sync Activity (Developer)");
            const dataProvider = this.instantiationService.createInstance(ExtractedUserDataSyncActivityViewDataProvider, undefined);
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name.value);
            treeView.showCollapseAllAction = false;
            treeView.showRefreshAction = false;
            treeView.dataProvider = dataProvider;
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS,
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    hideByDefault: false,
                }], container);
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.loadActivity`,
                        title: (0, nls_1.localize)('workbench.actions.sync.loadActivity', "Load Sync Activity"),
                        icon: codicons_1.Codicon.cloudUpload,
                        menu: {
                            id: actions_1.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.equals('view', id),
                            group: 'navigation',
                        },
                    });
                }
                async run(accessor) {
                    const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                    const result = await fileDialogService.showOpenDialog({
                        title: (0, nls_1.localize)('select sync activity file', "Select Sync Activity File or Folder"),
                        canSelectFiles: true,
                        canSelectFolders: true,
                        canSelectMany: false,
                    });
                    if (!result?.[0]) {
                        return;
                    }
                    dataProvider.activityDataResource = result[0];
                    await treeView.refresh();
                }
            }));
        }
        registerDataViewActions(viewId) {
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.${viewId}.resolveResource`,
                        title: (0, nls_1.localize)('workbench.actions.sync.resolveResourceRef', "Show raw JSON sync data"),
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-resource-.*/i))
                        },
                    });
                }
                async run(accessor, handle) {
                    const { resource } = JSON.parse(handle.$treeItemHandle);
                    const editorService = accessor.get(editorService_1.IEditorService);
                    await editorService.openEditor({ resource: uri_1.URI.parse(resource), options: { pinned: true } });
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.${viewId}.compareWithLocal`,
                        title: (0, nls_1.localize)('workbench.actions.sync.compareWithLocal', "Compare with Local"),
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-associatedResource-.*/i))
                        },
                    });
                }
                async run(accessor, handle) {
                    const commandService = accessor.get(commands_1.ICommandService);
                    const { resource, comparableResource } = JSON.parse(handle.$treeItemHandle);
                    const remoteResource = uri_1.URI.parse(resource);
                    const localResource = uri_1.URI.parse(comparableResource);
                    return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, remoteResource, localResource, (0, nls_1.localize)('remoteToLocalDiff', "{0} ↔ {1}", (0, nls_1.localize)({ key: 'leftResourceName', comment: ['remote as in file in cloud'] }, "{0} (Remote)", (0, resources_1.basename)(remoteResource)), (0, nls_1.localize)({ key: 'rightResourceName', comment: ['local as in file in disk'] }, "{0} (Local)", (0, resources_1.basename)(localResource))), undefined);
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.${viewId}.replaceCurrent`,
                        title: (0, nls_1.localize)('workbench.actions.sync.replaceCurrent', "Restore"),
                        icon: codicons_1.Codicon.discard,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-resource-.*/i), contextkey_1.ContextKeyExpr.notEquals('viewItem', `sync-resource-${"profiles" /* SyncResource.Profiles */}`)),
                            group: 'inline',
                        },
                    });
                }
                async run(accessor, handle) {
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const userDataSyncService = accessor.get(userDataSync_1.IUserDataSyncService);
                    const { syncResourceHandle, syncResource } = JSON.parse(handle.$treeItemHandle);
                    const result = await dialogService.confirm({
                        message: (0, nls_1.localize)({ key: 'confirm replace', comment: ['A confirmation message to replace current user data (settings, extensions, keybindings, snippets) with selected version'] }, "Would you like to replace your current {0} with selected?", (0, userDataSync_2.getSyncAreaLabel)(syncResource)),
                        type: 'info',
                        title: userDataSync_2.SYNC_TITLE.value
                    });
                    if (result.confirmed) {
                        return userDataSyncService.replace({ created: syncResourceHandle.created, uri: uri_1.URI.revive(syncResourceHandle.uri) });
                    }
                }
            }));
        }
        registerTroubleShootView(container) {
            const id = `workbench.views.sync.troubleshoot`;
            const name = (0, nls_1.localize2)('troubleshoot', "Troubleshoot");
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name.value);
            const dataProvider = this.instantiationService.createInstance(UserDataSyncTroubleshootViewDataProvider);
            treeView.showRefreshAction = true;
            treeView.dataProvider = dataProvider;
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS,
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    order: 500,
                    hideByDefault: true
                }], container);
        }
    };
    exports.UserDataSyncDataViews = UserDataSyncDataViews;
    exports.UserDataSyncDataViews = UserDataSyncDataViews = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, userDataSync_1.IUserDataSyncEnablementService),
        __param(3, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(4, userDataSync_1.IUserDataSyncService)
    ], UserDataSyncDataViews);
    let UserDataSyncActivityViewDataProvider = class UserDataSyncActivityViewDataProvider {
        constructor(userDataSyncService, userDataSyncResourceProviderService, userDataAutoSyncService, userDataSyncWorkbenchService, notificationService, userDataProfilesService) {
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncResourceProviderService = userDataSyncResourceProviderService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.notificationService = notificationService;
            this.userDataProfilesService = userDataProfilesService;
            this.syncResourceHandlesByProfile = new Map();
        }
        async getChildren(element) {
            try {
                if (!element) {
                    return await this.getRoots();
                }
                if (element.profile || element.handle === this.userDataProfilesService.defaultProfile.id) {
                    let promise = this.syncResourceHandlesByProfile.get(element.handle);
                    if (!promise) {
                        this.syncResourceHandlesByProfile.set(element.handle, promise = this.getSyncResourceHandles(element.profile));
                    }
                    return await promise;
                }
                if (element.syncResourceHandle) {
                    return await this.getChildrenForSyncResourceTreeItem(element);
                }
                return [];
            }
            catch (error) {
                if (!(error instanceof userDataSync_1.UserDataSyncError)) {
                    error = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
                }
                if (error instanceof userDataSync_1.UserDataSyncError && error.code === "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */) {
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: error.message,
                        actions: {
                            primary: [
                                new actions_2.Action('reset', (0, nls_1.localize)('reset', "Reset Synced Data"), undefined, true, () => this.userDataSyncWorkbenchService.resetSyncedData()),
                            ]
                        }
                    });
                }
                else {
                    this.notificationService.error(error);
                }
                throw error;
            }
        }
        async getRoots() {
            this.syncResourceHandlesByProfile.clear();
            const roots = [];
            const profiles = await this.getProfiles();
            if (profiles.length) {
                const profileTreeItem = {
                    handle: this.userDataProfilesService.defaultProfile.id,
                    label: { label: this.userDataProfilesService.defaultProfile.name },
                    collapsibleState: views_1.TreeItemCollapsibleState.Expanded,
                };
                roots.push(profileTreeItem);
            }
            else {
                const defaultSyncResourceHandles = await this.getSyncResourceHandles();
                roots.push(...defaultSyncResourceHandles);
            }
            for (const profile of profiles) {
                const profileTreeItem = {
                    handle: profile.id,
                    label: { label: profile.name },
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                    profile,
                };
                roots.push(profileTreeItem);
            }
            return roots;
        }
        async getChildrenForSyncResourceTreeItem(element) {
            const syncResourceHandle = element.syncResourceHandle;
            const associatedResources = await this.userDataSyncResourceProviderService.getAssociatedResources(syncResourceHandle);
            const previousAssociatedResources = syncResourceHandle.previous ? await this.userDataSyncResourceProviderService.getAssociatedResources(syncResourceHandle.previous) : [];
            return associatedResources.map(({ resource, comparableResource }) => {
                const handle = JSON.stringify({ resource: resource.toString(), comparableResource: comparableResource.toString() });
                const previousResource = previousAssociatedResources.find(previous => (0, resources_1.basename)(previous.resource) === (0, resources_1.basename)(resource))?.resource;
                return {
                    handle,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    resourceUri: resource,
                    command: previousResource ? {
                        id: editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID,
                        title: '',
                        arguments: [
                            previousResource,
                            resource,
                            (0, nls_1.localize)('sideBySideLabels', "{0} ↔ {1}", `${(0, resources_1.basename)(resource)} (${(0, date_1.fromNow)(syncResourceHandle.previous.created, true)})`, `${(0, resources_1.basename)(resource)} (${(0, date_1.fromNow)(syncResourceHandle.created, true)})`),
                            undefined
                        ]
                    } : {
                        id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                        title: '',
                        arguments: [resource, undefined, undefined]
                    },
                    contextValue: `sync-associatedResource-${syncResourceHandle.syncResource}`
                };
            });
        }
        async getSyncResourceHandles(profile) {
            const treeItems = [];
            const result = await Promise.all(userDataSync_1.ALL_SYNC_RESOURCES.map(async (syncResource) => {
                const resourceHandles = await this.getResourceHandles(syncResource, profile);
                return resourceHandles.map((resourceHandle, index) => ({ ...resourceHandle, syncResource, previous: resourceHandles[index + 1] }));
            }));
            const syncResourceHandles = result.flat().sort((a, b) => b.created - a.created);
            for (const syncResourceHandle of syncResourceHandles) {
                const handle = JSON.stringify({ syncResourceHandle, syncResource: syncResourceHandle.syncResource });
                treeItems.push({
                    handle,
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                    label: { label: (0, userDataSync_2.getSyncAreaLabel)(syncResourceHandle.syncResource) },
                    description: (0, date_1.fromNow)(syncResourceHandle.created, true),
                    tooltip: new Date(syncResourceHandle.created).toLocaleString(),
                    themeIcon: themeService_1.FolderThemeIcon,
                    syncResourceHandle,
                    contextValue: `sync-resource-${syncResourceHandle.syncResource}`
                });
            }
            return treeItems;
        }
    };
    UserDataSyncActivityViewDataProvider = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, userDataSync_1.IUserDataSyncResourceProviderService),
        __param(2, userDataSync_1.IUserDataAutoSyncService),
        __param(3, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(4, notification_1.INotificationService),
        __param(5, userDataProfile_1.IUserDataProfilesService)
    ], UserDataSyncActivityViewDataProvider);
    class LocalUserDataSyncActivityViewDataProvider extends UserDataSyncActivityViewDataProvider {
        getResourceHandles(syncResource, profile) {
            return this.userDataSyncResourceProviderService.getLocalSyncResourceHandles(syncResource, profile);
        }
        async getProfiles() {
            return this.userDataProfilesService.profiles
                .filter(p => !p.isDefault)
                .map(p => ({
                id: p.id,
                collection: p.id,
                name: p.name,
            }));
        }
    }
    let RemoteUserDataSyncActivityViewDataProvider = class RemoteUserDataSyncActivityViewDataProvider extends UserDataSyncActivityViewDataProvider {
        constructor(userDataSyncService, userDataSyncResourceProviderService, userDataAutoSyncService, userDataSyncMachinesService, userDataSyncWorkbenchService, notificationService, userDataProfilesService) {
            super(userDataSyncService, userDataSyncResourceProviderService, userDataAutoSyncService, userDataSyncWorkbenchService, notificationService, userDataProfilesService);
            this.userDataSyncMachinesService = userDataSyncMachinesService;
        }
        async getChildren(element) {
            if (!element) {
                this.machinesPromise = undefined;
            }
            return super.getChildren(element);
        }
        getMachines() {
            if (this.machinesPromise === undefined) {
                this.machinesPromise = this.userDataSyncMachinesService.getMachines();
            }
            return this.machinesPromise;
        }
        getResourceHandles(syncResource, profile) {
            return this.userDataSyncResourceProviderService.getRemoteSyncResourceHandles(syncResource, profile);
        }
        getProfiles() {
            return this.userDataSyncResourceProviderService.getRemoteSyncedProfiles();
        }
        async getChildrenForSyncResourceTreeItem(element) {
            const children = await super.getChildrenForSyncResourceTreeItem(element);
            if (children.length) {
                const machineId = await this.userDataSyncResourceProviderService.getMachineId(element.syncResourceHandle);
                if (machineId) {
                    const machines = await this.getMachines();
                    const machine = machines.find(({ id }) => id === machineId);
                    children[0].description = machine?.isCurrent ? (0, nls_1.localize)({ key: 'current', comment: ['Represents current machine'] }, "Current") : machine?.name;
                }
            }
            return children;
        }
    };
    RemoteUserDataSyncActivityViewDataProvider = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, userDataSync_1.IUserDataSyncResourceProviderService),
        __param(2, userDataSync_1.IUserDataAutoSyncService),
        __param(3, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(4, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(5, notification_1.INotificationService),
        __param(6, userDataProfile_1.IUserDataProfilesService)
    ], RemoteUserDataSyncActivityViewDataProvider);
    let ExtractedUserDataSyncActivityViewDataProvider = class ExtractedUserDataSyncActivityViewDataProvider extends UserDataSyncActivityViewDataProvider {
        constructor(activityDataResource, userDataSyncService, userDataSyncResourceProviderService, userDataAutoSyncService, userDataSyncWorkbenchService, notificationService, userDataProfilesService, fileService, uriIdentityService) {
            super(userDataSyncService, userDataSyncResourceProviderService, userDataAutoSyncService, userDataSyncWorkbenchService, notificationService, userDataProfilesService);
            this.activityDataResource = activityDataResource;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
        }
        async getChildren(element) {
            if (!element) {
                this.machinesPromise = undefined;
                if (!this.activityDataResource) {
                    return [];
                }
                const stat = await this.fileService.resolve(this.activityDataResource);
                if (stat.isDirectory) {
                    this.activityDataLocation = this.activityDataResource;
                }
                else {
                    this.activityDataLocation = this.uriIdentityService.extUri.joinPath(this.uriIdentityService.extUri.dirname(this.activityDataResource), 'remoteActivity');
                    try {
                        await this.fileService.del(this.activityDataLocation, { recursive: true });
                    }
                    catch (e) { /* ignore */ }
                    await this.userDataSyncService.extractActivityData(this.activityDataResource, this.activityDataLocation);
                }
            }
            return super.getChildren(element);
        }
        getResourceHandles(syncResource, profile) {
            return this.userDataSyncResourceProviderService.getLocalSyncResourceHandles(syncResource, profile, this.activityDataLocation);
        }
        async getProfiles() {
            return this.userDataSyncResourceProviderService.getLocalSyncedProfiles(this.activityDataLocation);
        }
        async getChildrenForSyncResourceTreeItem(element) {
            const children = await super.getChildrenForSyncResourceTreeItem(element);
            if (children.length) {
                const machineId = await this.userDataSyncResourceProviderService.getMachineId(element.syncResourceHandle);
                if (machineId) {
                    const machines = await this.getMachines();
                    const machine = machines.find(({ id }) => id === machineId);
                    children[0].description = machine?.isCurrent ? (0, nls_1.localize)({ key: 'current', comment: ['Represents current machine'] }, "Current") : machine?.name;
                }
            }
            return children;
        }
        getMachines() {
            if (this.machinesPromise === undefined) {
                this.machinesPromise = this.userDataSyncResourceProviderService.getLocalSyncedMachines(this.activityDataLocation);
            }
            return this.machinesPromise;
        }
    };
    ExtractedUserDataSyncActivityViewDataProvider = __decorate([
        __param(1, userDataSync_1.IUserDataSyncService),
        __param(2, userDataSync_1.IUserDataSyncResourceProviderService),
        __param(3, userDataSync_1.IUserDataAutoSyncService),
        __param(4, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(5, notification_1.INotificationService),
        __param(6, userDataProfile_1.IUserDataProfilesService),
        __param(7, files_1.IFileService),
        __param(8, uriIdentity_1.IUriIdentityService)
    ], ExtractedUserDataSyncActivityViewDataProvider);
    let UserDataSyncMachinesViewDataProvider = class UserDataSyncMachinesViewDataProvider {
        constructor(treeView, userDataSyncMachinesService, quickInputService, notificationService, dialogService, userDataSyncWorkbenchService) {
            this.treeView = treeView;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
        }
        async getChildren(element) {
            if (!element) {
                this.machinesPromise = undefined;
            }
            try {
                let machines = await this.getMachines();
                machines = machines.filter(m => !m.disabled).sort((m1, m2) => m1.isCurrent ? -1 : 1);
                this.treeView.message = machines.length ? undefined : (0, nls_1.localize)('no machines', "No Machines");
                return machines.map(({ id, name, isCurrent, platform }) => ({
                    handle: id,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    label: { label: name },
                    description: isCurrent ? (0, nls_1.localize)({ key: 'current', comment: ['Current machine'] }, "Current") : undefined,
                    themeIcon: platform && (0, userDataSyncMachines_1.isWebPlatform)(platform) ? codicons_1.Codicon.globe : codicons_1.Codicon.vm,
                    contextValue: 'sync-machine'
                }));
            }
            catch (error) {
                this.notificationService.error(error);
                return [];
            }
        }
        getMachines() {
            if (this.machinesPromise === undefined) {
                this.machinesPromise = this.userDataSyncMachinesService.getMachines();
            }
            return this.machinesPromise;
        }
        async disable(machineIds) {
            const machines = await this.getMachines();
            const machinesToDisable = machines.filter(({ id }) => machineIds.includes(id));
            if (!machinesToDisable.length) {
                throw new Error((0, nls_1.localize)('not found', "machine not found with id: {0}", machineIds.join(',')));
            }
            const result = await this.dialogService.confirm({
                type: 'info',
                message: machinesToDisable.length > 1 ? (0, nls_1.localize)('turn off sync on multiple machines', "Are you sure you want to turn off sync on selected machines?")
                    : (0, nls_1.localize)('turn off sync on machine', "Are you sure you want to turn off sync on {0}?", machinesToDisable[0].name),
                primaryButton: (0, nls_1.localize)({ key: 'turn off', comment: ['&& denotes a mnemonic'] }, "&&Turn off"),
            });
            if (!result.confirmed) {
                return false;
            }
            if (machinesToDisable.some(machine => machine.isCurrent)) {
                await this.userDataSyncWorkbenchService.turnoff(false);
            }
            const otherMachinesToDisable = machinesToDisable.filter(machine => !machine.isCurrent)
                .map(machine => ([machine.id, false]));
            if (otherMachinesToDisable.length) {
                await this.userDataSyncMachinesService.setEnablements(otherMachinesToDisable);
            }
            return true;
        }
        async rename(machineId) {
            const disposableStore = new lifecycle_1.DisposableStore();
            const inputBox = disposableStore.add(this.quickInputService.createInputBox());
            inputBox.placeholder = (0, nls_1.localize)('placeholder', "Enter the name of the machine");
            inputBox.busy = true;
            inputBox.show();
            const machines = await this.getMachines();
            const machine = machines.find(({ id }) => id === machineId);
            if (!machine) {
                inputBox.hide();
                disposableStore.dispose();
                throw new Error((0, nls_1.localize)('not found', "machine not found with id: {0}", machineId));
            }
            inputBox.busy = false;
            inputBox.value = machine.name;
            const validateMachineName = (machineName) => {
                machineName = machineName.trim();
                return machineName && !machines.some(m => m.id !== machineId && m.name === machineName) ? machineName : null;
            };
            disposableStore.add(inputBox.onDidChangeValue(() => inputBox.validationMessage = validateMachineName(inputBox.value) ? '' : (0, nls_1.localize)('valid message', "Machine name should be unique and not empty")));
            return new Promise((c, e) => {
                disposableStore.add(inputBox.onDidAccept(async () => {
                    const machineName = validateMachineName(inputBox.value);
                    disposableStore.dispose();
                    if (machineName && machineName !== machine.name) {
                        try {
                            await this.userDataSyncMachinesService.renameMachine(machineId, machineName);
                            c(true);
                        }
                        catch (error) {
                            e(error);
                        }
                    }
                    else {
                        c(false);
                    }
                }));
            });
        }
    };
    UserDataSyncMachinesViewDataProvider = __decorate([
        __param(1, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, notification_1.INotificationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, userDataSync_2.IUserDataSyncWorkbenchService)
    ], UserDataSyncMachinesViewDataProvider);
    let UserDataSyncTroubleshootViewDataProvider = class UserDataSyncTroubleshootViewDataProvider {
        constructor(fileService, userDataSyncWorkbenchService, environmentService, uriIdentityService) {
            this.fileService = fileService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.environmentService = environmentService;
            this.uriIdentityService = uriIdentityService;
        }
        async getChildren(element) {
            if (!element) {
                return [{
                        handle: 'SYNC_LOGS',
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                        label: { label: (0, nls_1.localize)('sync logs', "Logs") },
                        themeIcon: codicons_1.Codicon.folder,
                    }, {
                        handle: 'LAST_SYNC_STATES',
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                        label: { label: (0, nls_1.localize)('last sync states', "Last Synced Remotes") },
                        themeIcon: codicons_1.Codicon.folder,
                    }];
            }
            if (element.handle === 'LAST_SYNC_STATES') {
                return this.getLastSyncStates();
            }
            if (element.handle === 'SYNC_LOGS') {
                return this.getSyncLogs();
            }
            return [];
        }
        async getLastSyncStates() {
            const result = [];
            for (const syncResource of userDataSync_1.ALL_SYNC_RESOURCES) {
                const resource = (0, userDataSync_1.getLastSyncResourceUri)(undefined, syncResource, this.environmentService, this.uriIdentityService.extUri);
                if (await this.fileService.exists(resource)) {
                    result.push({
                        handle: resource.toString(),
                        label: { label: (0, userDataSync_2.getSyncAreaLabel)(syncResource) },
                        collapsibleState: views_1.TreeItemCollapsibleState.None,
                        resourceUri: resource,
                        command: { id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID, title: '', arguments: [resource, undefined, undefined] },
                    });
                }
            }
            return result;
        }
        async getSyncLogs() {
            const logResources = await this.userDataSyncWorkbenchService.getAllLogResources();
            const result = [];
            for (const syncLogResource of logResources) {
                const logFolder = this.uriIdentityService.extUri.dirname(syncLogResource);
                result.push({
                    handle: syncLogResource.toString(),
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    resourceUri: syncLogResource,
                    label: { label: this.uriIdentityService.extUri.basename(logFolder) },
                    description: this.uriIdentityService.extUri.isEqual(logFolder, this.environmentService.logsHome) ? (0, nls_1.localize)({ key: 'current', comment: ['Represents current log file'] }, "Current") : undefined,
                    command: { id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID, title: '', arguments: [syncLogResource, undefined, undefined] },
                });
            }
            return result;
        }
    };
    UserDataSyncTroubleshootViewDataProvider = __decorate([
        __param(0, files_1.IFileService),
        __param(1, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], UserDataSyncTroubleshootViewDataProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jVmlld3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi91c2VyRGF0YVN5bmMvYnJvd3Nlci91c2VyRGF0YVN5bmNWaWV3cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQ3pGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7UUFFcEQsWUFDQyxTQUF3QixFQUNnQixvQkFBMkMsRUFDbEMsNkJBQTZELEVBQy9ELDJCQUF5RCxFQUNqRSxtQkFBeUM7WUFFaEYsS0FBSyxFQUFFLENBQUM7WUFMZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNsQyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1lBQy9ELGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBOEI7WUFDakUsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUdoRixJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFTyxhQUFhLENBQUMsU0FBd0I7WUFDN0MsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXRDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXJDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRU8scUJBQXFCLENBQUMsU0FBd0I7WUFDckQsTUFBTSxhQUFhLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWlCLGtCQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDNUUsTUFBTSxRQUFRLEdBQUcsSUFBQSxlQUFTLEVBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3JELGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBc0I7b0JBQ2pELEVBQUUsRUFBRSxxQ0FBc0I7b0JBQzFCLElBQUksRUFBRSxRQUFRO29CQUNkLGNBQWMsRUFBRSxJQUFJLDRCQUFjLENBQUMseURBQTZCLENBQUM7b0JBQ2pFLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxpREFBa0MsRUFBRSxvQ0FBcUIsQ0FBQztvQkFDbkYsbUJBQW1CLEVBQUUsS0FBSztvQkFDMUIsV0FBVyxFQUFFLEtBQUs7b0JBQ2xCLFFBQVEsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1CQUFRLEVBQUUscUNBQXNCLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQztvQkFDcEcsU0FBUyxFQUFFLEtBQUs7b0JBQ2hCLEtBQUssRUFBRSxHQUFHO2lCQUNWLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNoQixDQUFDO1FBRU8sb0JBQW9CLENBQUMsU0FBd0I7WUFDcEQsTUFBTSxFQUFFLEdBQUcsK0JBQStCLENBQUM7WUFDM0MsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFTLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUM3RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1CQUFRLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG9DQUFvQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzlHLFFBQVEsQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFDbEMsUUFBUSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDOUIsUUFBUSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7WUFFckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3SSxNQUFNLGFBQWEsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBaUIsa0JBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM1RSxhQUFhLENBQUMsYUFBYSxDQUFDLENBQXNCO29CQUNqRCxFQUFFO29CQUNGLElBQUk7b0JBQ0osY0FBYyxFQUFFLElBQUksNEJBQWMsQ0FBQyx1QkFBWSxDQUFDO29CQUNoRCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsaUNBQWtCLENBQUMsV0FBVyxnREFBMEIsRUFBRSxvQ0FBcUIsQ0FBQyxTQUFTLDJDQUF5QixFQUFFLDRDQUE2QixDQUFDO29CQUMzSyxtQkFBbUIsRUFBRSxJQUFJO29CQUN6QixXQUFXLEVBQUUsS0FBSztvQkFDbEIsUUFBUTtvQkFDUixTQUFTLEVBQUUsS0FBSztvQkFDaEIsS0FBSyxFQUFFLEdBQUc7aUJBQ1YsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRWYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO2dCQUNuRDtvQkFDQyxLQUFLLENBQUM7d0JBQ0wsRUFBRSxFQUFFLHdDQUF3Qzt3QkFDNUMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHdDQUF3QyxFQUFFLFdBQVcsQ0FBQzt3QkFDdEUsSUFBSSxFQUFFLGtCQUFPLENBQUMsSUFBSTt3QkFDbEIsSUFBSSxFQUFFOzRCQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGVBQWU7NEJBQzFCLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQywyQkFBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7NEJBQzNELEtBQUssRUFBRSxRQUFRO3lCQUNmO3FCQUNELENBQUMsQ0FBQztnQkFDSixDQUFDO2dCQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxNQUE2QjtvQkFDbEUsTUFBTSxPQUFPLEdBQUcsTUFBTSxZQUFZLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDbEUsSUFBSSxPQUFPLEVBQUUsQ0FBQzt3QkFDYixNQUFNLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDMUIsQ0FBQztnQkFDRixDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87Z0JBQ25EO29CQUNDLEtBQUssQ0FBQzt3QkFDTCxFQUFFLEVBQUUsNkNBQTZDO3dCQUNqRCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkNBQTZDLEVBQUUsd0JBQXdCLENBQUM7d0JBQ3hGLElBQUksRUFBRTs0QkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxlQUFlOzRCQUMxQixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMkJBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLDJCQUFjLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQzt5QkFDOUc7cUJBQ0QsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQTZCLEVBQUUsUUFBa0M7b0JBQ3RHLElBQUksTUFBTSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUM5RixNQUFNLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDMUIsQ0FBQztnQkFDRixDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7UUFFTCxDQUFDO1FBRU8sb0JBQW9CLENBQUMsU0FBd0IsRUFBRSxNQUFlO1lBQ3JFLE1BQU0sRUFBRSxHQUFHLHdCQUF3QixNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxVQUFVLENBQUM7WUFDekUsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFBLGVBQVMsRUFBQyw0QkFBNEIsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGVBQVMsRUFBQywyQkFBMkIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQzFKLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsbUJBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BGLFFBQVEsQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7WUFDdEMsUUFBUSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztZQUNsQyxRQUFRLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywwQ0FBMEMsQ0FBQztnQkFDcEgsQ0FBQyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMseUNBQXlDLENBQUMsQ0FBQztZQUV2RixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLDZCQUE2QixFQUN4RixJQUFJLENBQUMsNkJBQTZCLENBQUMscUJBQXFCLEVBQ3hELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLEVBQ3hDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkUsTUFBTSxhQUFhLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWlCLGtCQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDNUUsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFzQjtvQkFDakQsRUFBRTtvQkFDRixJQUFJO29CQUNKLGNBQWMsRUFBRSxJQUFJLDRCQUFjLENBQUMsdUJBQVksQ0FBQztvQkFDaEQsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGlDQUFrQixDQUFDLFdBQVcsZ0RBQTBCLEVBQUUsb0NBQXFCLENBQUMsU0FBUywyQ0FBeUIsRUFBRSw0Q0FBNkIsQ0FBQztvQkFDM0ssbUJBQW1CLEVBQUUsSUFBSTtvQkFDekIsV0FBVyxFQUFFLEtBQUs7b0JBQ2xCLFFBQVE7b0JBQ1IsU0FBUyxFQUFFLEtBQUs7b0JBQ2hCLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRztvQkFDekIsYUFBYSxFQUFFLENBQUMsTUFBTTtpQkFDdEIsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRWYsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFTyw0QkFBNEIsQ0FBQyxTQUF3QjtZQUM1RCxNQUFNLEVBQUUsR0FBRyx1Q0FBdUMsQ0FBQztZQUNuRCxNQUFNLElBQUksR0FBRyxJQUFBLGVBQVMsRUFBQyxnQ0FBZ0MsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkNBQTZDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDeEgsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtQkFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEYsUUFBUSxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQztZQUN2QyxRQUFRLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1lBQ25DLFFBQVEsQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1lBRXJDLE1BQU0sYUFBYSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFpQixrQkFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzVFLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBc0I7b0JBQ2pELEVBQUU7b0JBQ0YsSUFBSTtvQkFDSixjQUFjLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHVCQUFZLENBQUM7b0JBQ2hELElBQUksRUFBRSw0Q0FBNkI7b0JBQ25DLG1CQUFtQixFQUFFLElBQUk7b0JBQ3pCLFdBQVcsRUFBRSxLQUFLO29CQUNsQixRQUFRO29CQUNSLFNBQVMsRUFBRSxLQUFLO29CQUNoQixhQUFhLEVBQUUsS0FBSztpQkFDcEIsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRWYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO2dCQUNuRDtvQkFDQyxLQUFLLENBQUM7d0JBQ0wsRUFBRSxFQUFFLHFDQUFxQzt3QkFDekMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHFDQUFxQyxFQUFFLG9CQUFvQixDQUFDO3dCQUM1RSxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxXQUFXO3dCQUN6QixJQUFJLEVBQUU7NEJBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsU0FBUzs0QkFDcEIsSUFBSSxFQUFFLDJCQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7NEJBQ3ZDLEtBQUssRUFBRSxZQUFZO3lCQUNuQjtxQkFDRCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO29CQUNuQyxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQWtCLENBQUMsQ0FBQztvQkFDM0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxjQUFjLENBQUM7d0JBQ3JELEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSxxQ0FBcUMsQ0FBQzt3QkFDbkYsY0FBYyxFQUFFLElBQUk7d0JBQ3BCLGdCQUFnQixFQUFFLElBQUk7d0JBQ3RCLGFBQWEsRUFBRSxLQUFLO3FCQUNwQixDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ2xCLE9BQU87b0JBQ1IsQ0FBQztvQkFDRCxZQUFZLENBQUMsb0JBQW9CLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM5QyxNQUFNLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDMUIsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLHVCQUF1QixDQUFDLE1BQWM7WUFDN0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO2dCQUNuRDtvQkFDQyxLQUFLLENBQUM7d0JBQ0wsRUFBRSxFQUFFLDBCQUEwQixNQUFNLGtCQUFrQjt3QkFDdEQsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDJDQUEyQyxFQUFFLHlCQUF5QixDQUFDO3dCQUN2RixJQUFJLEVBQUU7NEJBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTs0QkFDMUIsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDJCQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSwyQkFBYyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsbUJBQW1CLENBQUMsQ0FBQzt5QkFDdEg7cUJBQ0QsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQTZCO29CQUNsRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQXlCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUM5RSxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztvQkFDbkQsTUFBTSxhQUFhLENBQUMsVUFBVSxDQUFDLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDOUYsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO2dCQUNuRDtvQkFDQyxLQUFLLENBQUM7d0JBQ0wsRUFBRSxFQUFFLDBCQUEwQixNQUFNLG1CQUFtQjt3QkFDdkQsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHlDQUF5QyxFQUFFLG9CQUFvQixDQUFDO3dCQUNoRixJQUFJLEVBQUU7NEJBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTs0QkFDMUIsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDJCQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSwyQkFBYyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsNkJBQTZCLENBQUMsQ0FBQzt5QkFDaEk7cUJBQ0QsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQTZCO29CQUNsRSxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBCQUFlLENBQUMsQ0FBQztvQkFDckQsTUFBTSxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxHQUFxRCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDOUgsTUFBTSxjQUFjLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDM0MsTUFBTSxhQUFhLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO29CQUNwRCxPQUFPLGNBQWMsQ0FBQyxjQUFjLENBQUMsZ0RBQStCLEVBQ25FLGNBQWMsRUFDZCxhQUFhLEVBQ2IsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxDQUFDLDRCQUE0QixDQUFDLEVBQUUsRUFBRSxjQUFjLEVBQUUsSUFBQSxvQkFBUSxFQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsbUJBQW1CLEVBQUUsT0FBTyxFQUFFLENBQUMsMEJBQTBCLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFBLG9CQUFRLEVBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUMzUixTQUFTLENBQ1QsQ0FBQztnQkFDSCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87Z0JBQ25EO29CQUNDLEtBQUssQ0FBQzt3QkFDTCxFQUFFLEVBQUUsMEJBQTBCLE1BQU0saUJBQWlCO3dCQUNyRCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUNBQXVDLEVBQUUsU0FBUyxDQUFDO3dCQUNuRSxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxPQUFPO3dCQUNyQixJQUFJLEVBQUU7NEJBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTs0QkFDMUIsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDJCQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSwyQkFBYyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsbUJBQW1CLENBQUMsRUFBRSwyQkFBYyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLHNDQUFxQixFQUFFLENBQUMsQ0FBQzs0QkFDdE0sS0FBSyxFQUFFLFFBQVE7eUJBQ2Y7cUJBQ0QsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQTZCO29CQUNsRSxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUFjLENBQUMsQ0FBQztvQkFDbkQsTUFBTSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG1DQUFvQixDQUFDLENBQUM7b0JBQy9ELE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsR0FBb0YsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ2pLLE1BQU0sTUFBTSxHQUFHLE1BQU0sYUFBYSxDQUFDLE9BQU8sQ0FBQzt3QkFDMUMsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxDQUFDLHlIQUF5SCxDQUFDLEVBQUUsRUFBRSwyREFBMkQsRUFBRSxJQUFBLCtCQUFnQixFQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUNoUixJQUFJLEVBQUUsTUFBTTt3QkFDWixLQUFLLEVBQUUseUJBQVUsQ0FBQyxLQUFLO3FCQUN2QixDQUFDLENBQUM7b0JBQ0gsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ3RCLE9BQU8sbUJBQW1CLENBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsU0FBRyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3RILENBQUM7Z0JBQ0YsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1FBRUwsQ0FBQztRQUVPLHdCQUF3QixDQUFDLFNBQXdCO1lBQ3hELE1BQU0sRUFBRSxHQUFHLG1DQUFtQyxDQUFDO1lBQy9DLE1BQU0sSUFBSSxHQUFHLElBQUEsZUFBUyxFQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUN2RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1CQUFRLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7WUFDeEcsUUFBUSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztZQUNsQyxRQUFRLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztZQUVyQyxNQUFNLGFBQWEsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBaUIsa0JBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM1RSxhQUFhLENBQUMsYUFBYSxDQUFDLENBQXNCO29CQUNqRCxFQUFFO29CQUNGLElBQUk7b0JBQ0osY0FBYyxFQUFFLElBQUksNEJBQWMsQ0FBQyx1QkFBWSxDQUFDO29CQUNoRCxJQUFJLEVBQUUsNENBQTZCO29CQUNuQyxtQkFBbUIsRUFBRSxJQUFJO29CQUN6QixXQUFXLEVBQUUsS0FBSztvQkFDbEIsUUFBUTtvQkFDUixTQUFTLEVBQUUsS0FBSztvQkFDaEIsS0FBSyxFQUFFLEdBQUc7b0JBQ1YsYUFBYSxFQUFFLElBQUk7aUJBQ25CLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUVoQixDQUFDO0tBRUQsQ0FBQTtJQTVSWSxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQUkvQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsNkNBQThCLENBQUE7UUFDOUIsV0FBQSxtREFBNEIsQ0FBQTtRQUM1QixXQUFBLG1DQUFvQixDQUFBO09BUFYscUJBQXFCLENBNFJqQztJQWtCRCxJQUFlLG9DQUFvQyxHQUFuRCxNQUFlLG9DQUFvQztRQUlsRCxZQUN1QixtQkFBNEQsRUFDNUMsbUNBQTRGLEVBQ3hHLHVCQUFvRSxFQUMvRCw0QkFBNEUsRUFDckYsbUJBQTBELEVBQ3RELHVCQUFvRTtZQUxyRCx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ3pCLHdDQUFtQyxHQUFuQyxtQ0FBbUMsQ0FBc0M7WUFDckYsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUM5QyxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBQ3BFLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDbkMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQVI5RSxpQ0FBNEIsR0FBRyxJQUFJLEdBQUcsRUFBaUQsQ0FBQztRQVNyRyxDQUFDO1FBRUwsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFtQjtZQUNwQyxJQUFJLENBQUM7Z0JBQ0osSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNkLE9BQU8sTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzlCLENBQUM7Z0JBQ0QsSUFBc0IsT0FBUSxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzdHLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNwRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2QsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQXNCLE9BQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUNySSxDQUFDO29CQUNELE9BQU8sTUFBTSxPQUFPLENBQUM7Z0JBQ3RCLENBQUM7Z0JBQ0QsSUFBaUMsT0FBUSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQzlELE9BQU8sTUFBTSxJQUFJLENBQUMsa0NBQWtDLENBQTZCLE9BQU8sQ0FBQyxDQUFDO2dCQUMzRixDQUFDO2dCQUNELE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxDQUFDLEtBQUssWUFBWSxnQ0FBaUIsQ0FBQyxFQUFFLENBQUM7b0JBQzNDLEtBQUssR0FBRyxnQ0FBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdEQsQ0FBQztnQkFDRCxJQUFJLEtBQUssWUFBWSxnQ0FBaUIsSUFBSSxLQUFLLENBQUMsSUFBSSxzRkFBb0QsRUFBRSxDQUFDO29CQUMxRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDO3dCQUMvQixRQUFRLEVBQUUsdUJBQVEsQ0FBQyxLQUFLO3dCQUN4QixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87d0JBQ3RCLE9BQU8sRUFBRTs0QkFDUixPQUFPLEVBQUU7Z0NBQ1IsSUFBSSxnQkFBTSxDQUFDLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxPQUFPLEVBQUUsbUJBQW1CLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxlQUFlLEVBQUUsQ0FBQzs2QkFDdkk7eUJBQ0Q7cUJBQ0QsQ0FBQyxDQUFDO2dCQUNKLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO2dCQUNELE1BQU0sS0FBSyxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsUUFBUTtZQUNyQixJQUFJLENBQUMsNEJBQTRCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFMUMsTUFBTSxLQUFLLEdBQWdCLEVBQUUsQ0FBQztZQUU5QixNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxlQUFlLEdBQUc7b0JBQ3ZCLE1BQU0sRUFBRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLEVBQUU7b0JBQ3RELEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRTtvQkFDbEUsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsUUFBUTtpQkFDbkQsQ0FBQztnQkFDRixLQUFLLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzdCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLDBCQUEwQixHQUFHLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ3ZFLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRywwQkFBMEIsQ0FBQyxDQUFDO1lBQzNDLENBQUM7WUFFRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLGVBQWUsR0FBb0I7b0JBQ3hDLE1BQU0sRUFBRSxPQUFPLENBQUMsRUFBRTtvQkFDbEIsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUU7b0JBQzlCLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLFNBQVM7b0JBQ3BELE9BQU87aUJBQ1AsQ0FBQztnQkFDRixLQUFLLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzdCLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFUyxLQUFLLENBQUMsa0NBQWtDLENBQUMsT0FBbUM7WUFDckYsTUFBTSxrQkFBa0IsR0FBZ0MsT0FBUSxDQUFDLGtCQUFrQixDQUFDO1lBQ3BGLE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxJQUFJLENBQUMsbUNBQW1DLENBQUMsc0JBQXNCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUN0SCxNQUFNLDJCQUEyQixHQUFHLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsbUNBQW1DLENBQUMsc0JBQXNCLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUMxSyxPQUFPLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLEVBQUUsRUFBRTtnQkFDbkUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNwSCxNQUFNLGdCQUFnQixHQUFHLDJCQUEyQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUEsb0JBQVEsRUFBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBQSxvQkFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDO2dCQUNwSSxPQUFPO29CQUNOLE1BQU07b0JBQ04sZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsSUFBSTtvQkFDL0MsV0FBVyxFQUFFLFFBQVE7b0JBQ3JCLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7d0JBQzNCLEVBQUUsRUFBRSxnREFBK0I7d0JBQ25DLEtBQUssRUFBRSxFQUFFO3dCQUNULFNBQVMsRUFBRTs0QkFDVixnQkFBZ0I7NEJBQ2hCLFFBQVE7NEJBQ1IsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLEdBQUcsSUFBQSxvQkFBUSxFQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUEsY0FBTyxFQUFDLGtCQUFrQixDQUFDLFFBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUEsb0JBQVEsRUFBQyxRQUFRLENBQUMsS0FBSyxJQUFBLGNBQU8sRUFBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQzs0QkFDbk0sU0FBUzt5QkFDVDtxQkFDRCxDQUFDLENBQUMsQ0FBQzt3QkFDSCxFQUFFLEVBQUUsMkNBQTBCO3dCQUM5QixLQUFLLEVBQUUsRUFBRTt3QkFDVCxTQUFTLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQztxQkFDM0M7b0JBQ0QsWUFBWSxFQUFFLDJCQUEyQixrQkFBa0IsQ0FBQyxZQUFZLEVBQUU7aUJBQzFFLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxLQUFLLENBQUMsc0JBQXNCLENBQUMsT0FBVztZQUMvQyxNQUFNLFNBQVMsR0FBaUMsRUFBRSxDQUFDO1lBQ25ELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBa0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFDLFlBQVksRUFBQyxFQUFFO2dCQUM1RSxNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzdFLE9BQU8sZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLGNBQWMsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLGVBQWUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hGLEtBQUssTUFBTSxrQkFBa0IsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO2dCQUN0RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLGtCQUFrQixDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQ3JHLFNBQVMsQ0FBQyxJQUFJLENBQUM7b0JBQ2QsTUFBTTtvQkFDTixnQkFBZ0IsRUFBRSxnQ0FBd0IsQ0FBQyxTQUFTO29CQUNwRCxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBQSwrQkFBZ0IsRUFBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsRUFBRTtvQkFDbkUsV0FBVyxFQUFFLElBQUEsY0FBTyxFQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUM7b0JBQ3RELE9BQU8sRUFBRSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxjQUFjLEVBQUU7b0JBQzlELFNBQVMsRUFBRSw4QkFBZTtvQkFDMUIsa0JBQWtCO29CQUNsQixZQUFZLEVBQUUsaUJBQWlCLGtCQUFrQixDQUFDLFlBQVksRUFBRTtpQkFDaEUsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7S0FJRCxDQUFBO0lBeEljLG9DQUFvQztRQUtoRCxXQUFBLG1DQUFvQixDQUFBO1FBQ3BCLFdBQUEsbURBQW9DLENBQUE7UUFDcEMsV0FBQSx1Q0FBd0IsQ0FBQTtRQUN4QixXQUFBLDRDQUE2QixDQUFBO1FBQzdCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSwwQ0FBd0IsQ0FBQTtPQVZaLG9DQUFvQyxDQXdJbEQ7SUFFRCxNQUFNLHlDQUEwQyxTQUFRLG9DQUEwRDtRQUV2RyxrQkFBa0IsQ0FBQyxZQUEwQixFQUFFLE9BQXlDO1lBQ2pHLE9BQU8sSUFBSSxDQUFDLG1DQUFtQyxDQUFDLDJCQUEyQixDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRyxDQUFDO1FBRVMsS0FBSyxDQUFDLFdBQVc7WUFDMUIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUTtpQkFDMUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2lCQUN6QixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNWLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDUixVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hCLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTthQUNaLENBQUMsQ0FBQyxDQUFDO1FBQ04sQ0FBQztLQUNEO0lBRUQsSUFBTSwwQ0FBMEMsR0FBaEQsTUFBTSwwQ0FBMkMsU0FBUSxvQ0FBMEQ7UUFJbEgsWUFDdUIsbUJBQXlDLEVBQ3pCLG1DQUF5RSxFQUNyRix1QkFBaUQsRUFDNUIsMkJBQXlELEVBQ3pFLDRCQUEyRCxFQUNwRSxtQkFBeUMsRUFDckMsdUJBQWlEO1lBRTNFLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxtQ0FBbUMsRUFBRSx1QkFBdUIsRUFBRSw0QkFBNEIsRUFBRSxtQkFBbUIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBTHRILGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBOEI7UUFNekcsQ0FBQztRQUVRLEtBQUssQ0FBQyxXQUFXLENBQUMsT0FBbUI7WUFDN0MsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO1lBQ2xDLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVPLFdBQVc7WUFDbEIsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN2RSxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7UUFFUyxrQkFBa0IsQ0FBQyxZQUEwQixFQUFFLE9BQThCO1lBQ3RGLE9BQU8sSUFBSSxDQUFDLG1DQUFtQyxDQUFDLDRCQUE0QixDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNyRyxDQUFDO1FBRVMsV0FBVztZQUNwQixPQUFPLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQzNFLENBQUM7UUFFa0IsS0FBSyxDQUFDLGtDQUFrQyxDQUFDLE9BQW1DO1lBQzlGLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLGtDQUFrQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pFLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNyQixNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQzFHLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2YsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQzFDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUM7b0JBQzVELFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUcsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDLDRCQUE0QixDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQztnQkFDakosQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLFFBQVEsQ0FBQztRQUNqQixDQUFDO0tBQ0QsQ0FBQTtJQWxESywwQ0FBMEM7UUFLN0MsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLG1EQUFvQyxDQUFBO1FBQ3BDLFdBQUEsdUNBQXdCLENBQUE7UUFDeEIsV0FBQSxtREFBNEIsQ0FBQTtRQUM1QixXQUFBLDRDQUE2QixDQUFBO1FBQzdCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSwwQ0FBd0IsQ0FBQTtPQVhyQiwwQ0FBMEMsQ0FrRC9DO0lBRUQsSUFBTSw2Q0FBNkMsR0FBbkQsTUFBTSw2Q0FBOEMsU0FBUSxvQ0FBMEQ7UUFNckgsWUFDUSxvQkFBcUMsRUFDdEIsbUJBQXlDLEVBQ3pCLG1DQUF5RSxFQUNyRix1QkFBaUQsRUFDNUMsNEJBQTJELEVBQ3BFLG1CQUF5QyxFQUNyQyx1QkFBaUQsRUFDNUMsV0FBeUIsRUFDbEIsa0JBQXVDO1lBRTdFLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxtQ0FBbUMsRUFBRSx1QkFBdUIsRUFBRSw0QkFBNEIsRUFBRSxtQkFBbUIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBVjlKLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBaUI7WUFPYixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNsQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1FBRzlFLENBQUM7UUFFUSxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQW1CO1lBQzdDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztnQkFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO29CQUNoQyxPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDO2dCQUNELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3ZFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUN0QixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO2dCQUN2RCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7b0JBQ3pKLElBQUksQ0FBQzt3QkFBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUFDLENBQUM7b0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFBLFlBQVksQ0FBQyxDQUFDO29CQUM3RyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBQzFHLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFUyxrQkFBa0IsQ0FBQyxZQUEwQixFQUFFLE9BQXlDO1lBQ2pHLE9BQU8sSUFBSSxDQUFDLG1DQUFtQyxDQUFDLDJCQUEyQixDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDL0gsQ0FBQztRQUVrQixLQUFLLENBQUMsV0FBVztZQUNuQyxPQUFPLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNuRyxDQUFDO1FBRWtCLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxPQUFtQztZQUM5RixNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6RSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsbUNBQW1DLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUMxRyxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUNmLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUMxQyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQyxDQUFDO29CQUM1RCxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxHQUFHLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUM7Z0JBQ2pKLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVPLFdBQVc7WUFDbEIsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNuSCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7S0FDRCxDQUFBO0lBakVLLDZDQUE2QztRQVFoRCxXQUFBLG1DQUFvQixDQUFBO1FBQ3BCLFdBQUEsbURBQW9DLENBQUE7UUFDcEMsV0FBQSx1Q0FBd0IsQ0FBQTtRQUN4QixXQUFBLDRDQUE2QixDQUFBO1FBQzdCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSwwQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLGlDQUFtQixDQUFBO09BZmhCLDZDQUE2QyxDQWlFbEQ7SUFFRCxJQUFNLG9DQUFvQyxHQUExQyxNQUFNLG9DQUFvQztRQUl6QyxZQUNrQixRQUFrQixFQUNZLDJCQUF5RCxFQUNuRSxpQkFBcUMsRUFDbkMsbUJBQXlDLEVBQy9DLGFBQTZCLEVBQ2QsNEJBQTJEO1lBTDFGLGFBQVEsR0FBUixRQUFRLENBQVU7WUFDWSxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQThCO1lBQ25FLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbkMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUMvQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDZCxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1FBRTVHLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQW1CO1lBQ3BDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztZQUNsQyxDQUFDO1lBQ0QsSUFBSSxDQUFDO2dCQUNKLElBQUksUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN4QyxRQUFRLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQzdGLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQzNELE1BQU0sRUFBRSxFQUFFO29CQUNWLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLElBQUk7b0JBQy9DLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7b0JBQ3RCLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7b0JBQzFHLFNBQVMsRUFBRSxRQUFRLElBQUksSUFBQSxvQ0FBYSxFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsa0JBQU8sQ0FBQyxFQUFFO29CQUMzRSxZQUFZLEVBQUUsY0FBYztpQkFDNUIsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdEMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1FBQ0YsQ0FBQztRQUVPLFdBQVc7WUFDbEIsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN2RSxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQW9CO1lBQ2pDLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzFDLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLGdDQUFnQyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO2dCQUMvQyxJQUFJLEVBQUUsTUFBTTtnQkFDWixPQUFPLEVBQUUsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsb0NBQW9DLEVBQUUsOERBQThELENBQUM7b0JBQ3JKLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSxnREFBZ0QsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ3BILGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQzthQUM5RixDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN2QixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUMxRCxNQUFNLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUVELE1BQU0sc0JBQXNCLEdBQXdCLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztpQkFDekcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLElBQUksc0JBQXNCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ25DLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQy9FLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQWlCO1lBQzdCLE1BQU0sZUFBZSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzlDLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7WUFDOUUsUUFBUSxDQUFDLFdBQVcsR0FBRyxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUsK0JBQStCLENBQUMsQ0FBQztZQUNoRixRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNyQixRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDaEIsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDMUMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQztZQUM1RCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQixlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLGdDQUFnQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckYsQ0FBQztZQUNELFFBQVEsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO1lBQ3RCLFFBQVEsQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUM5QixNQUFNLG1CQUFtQixHQUFHLENBQUMsV0FBbUIsRUFBaUIsRUFBRTtnQkFDbEUsV0FBVyxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxXQUFXLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxTQUFTLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDOUcsQ0FBQyxDQUFDO1lBQ0YsZUFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQ2xELFFBQVEsQ0FBQyxpQkFBaUIsR0FBRyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLDZDQUE2QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BKLE9BQU8sSUFBSSxPQUFPLENBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3BDLGVBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksRUFBRTtvQkFDbkQsTUFBTSxXQUFXLEdBQUcsbUJBQW1CLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN4RCxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzFCLElBQUksV0FBVyxJQUFJLFdBQVcsS0FBSyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ2pELElBQUksQ0FBQzs0QkFDSixNQUFNLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDOzRCQUM3RSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ1QsQ0FBQzt3QkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDOzRCQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ1YsQ0FBQztvQkFDRixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNWLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7SUFoSEssb0NBQW9DO1FBTXZDLFdBQUEsbURBQTRCLENBQUE7UUFDNUIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLG1DQUFvQixDQUFBO1FBQ3BCLFdBQUEsd0JBQWMsQ0FBQTtRQUNkLFdBQUEsNENBQTZCLENBQUE7T0FWMUIsb0NBQW9DLENBZ0h6QztJQUVELElBQU0sd0NBQXdDLEdBQTlDLE1BQU0sd0NBQXdDO1FBRTdDLFlBQ2dDLFdBQXlCLEVBQ1IsNEJBQTJELEVBQ3JFLGtCQUF1QyxFQUN2QyxrQkFBdUM7WUFIOUMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDUixpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBQ3JFLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdkMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtRQUU5RSxDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFtQjtZQUNwQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxDQUFDO3dCQUNQLE1BQU0sRUFBRSxXQUFXO3dCQUNuQixnQkFBZ0IsRUFBRSxnQ0FBd0IsQ0FBQyxTQUFTO3dCQUNwRCxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxFQUFFO3dCQUMvQyxTQUFTLEVBQUUsa0JBQU8sQ0FBQyxNQUFNO3FCQUN6QixFQUFFO3dCQUNGLE1BQU0sRUFBRSxrQkFBa0I7d0JBQzFCLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLFNBQVM7d0JBQ3BELEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxxQkFBcUIsQ0FBQyxFQUFFO3dCQUNyRSxTQUFTLEVBQUUsa0JBQU8sQ0FBQyxNQUFNO3FCQUN6QixDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLGtCQUFrQixFQUFFLENBQUM7Z0JBQzNDLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDakMsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDcEMsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDM0IsQ0FBQztZQUVELE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVPLEtBQUssQ0FBQyxpQkFBaUI7WUFDOUIsTUFBTSxNQUFNLEdBQWdCLEVBQUUsQ0FBQztZQUMvQixLQUFLLE1BQU0sWUFBWSxJQUFJLGlDQUFrQixFQUFFLENBQUM7Z0JBQy9DLE1BQU0sUUFBUSxHQUFHLElBQUEscUNBQXNCLEVBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMxSCxJQUFJLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQzt3QkFDWCxNQUFNLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRTt3QkFDM0IsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUEsK0JBQWdCLEVBQUMsWUFBWSxDQUFDLEVBQUU7d0JBQ2hELGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLElBQUk7d0JBQy9DLFdBQVcsRUFBRSxRQUFRO3dCQUNyQixPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsMkNBQTBCLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFO3FCQUNuRyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyxLQUFLLENBQUMsV0FBVztZQUN4QixNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQ2xGLE1BQU0sTUFBTSxHQUFnQixFQUFFLENBQUM7WUFDL0IsS0FBSyxNQUFNLGVBQWUsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDNUMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQzFFLE1BQU0sQ0FBQyxJQUFJLENBQUM7b0JBQ1gsTUFBTSxFQUFFLGVBQWUsQ0FBQyxRQUFRLEVBQUU7b0JBQ2xDLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLElBQUk7b0JBQy9DLFdBQVcsRUFBRSxlQUFlO29CQUM1QixLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7b0JBQ3BFLFdBQVcsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsNkJBQTZCLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO29CQUNoTSxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsMkNBQTBCLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxlQUFlLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFO2lCQUMxRyxDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO0tBRUQsQ0FBQTtJQXRFSyx3Q0FBd0M7UUFHM0MsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSw0Q0FBNkIsQ0FBQTtRQUM3QixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsaUNBQW1CLENBQUE7T0FOaEIsd0NBQXdDLENBc0U3QyJ9