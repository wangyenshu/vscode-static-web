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
define(["require", "exports", "vs/workbench/common/views", "vs/nls", "vs/workbench/browser/parts/views/treeView", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataSync", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/resources", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/platform/theme/common/themeService", "vs/platform/telemetry/common/telemetry", "vs/platform/notification/common/notification", "vs/base/common/codicons", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/common/editor", "vs/platform/hover/browser/hover", "vs/workbench/services/accessibility/common/accessibleViewInformationService"], function (require, exports, views_1, nls_1, treeView_1, instantiation_1, userDataSync_1, actions_1, contextkey_1, uri_1, editorService_1, userDataSync_2, resources_1, DOM, keybinding_1, contextView_1, configuration_1, opener_1, themeService_1, telemetry_1, notification_1, codicons_1, userDataProfile_1, editor_1, hover_1, accessibleViewInformationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncConflictsViewPane = void 0;
    let UserDataSyncConflictsViewPane = class UserDataSyncConflictsViewPane extends treeView_1.TreeViewPane {
        constructor(options, editorService, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, notificationService, hoverService, userDataSyncService, userDataSyncWorkbenchService, userDataSyncEnablementService, userDataProfilesService, accessibleViewVisibilityService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, notificationService, hoverService, accessibleViewVisibilityService);
            this.editorService = editorService;
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataProfilesService = userDataProfilesService;
            this._register(this.userDataSyncService.onDidChangeConflicts(() => this.treeView.refresh()));
            this.registerActions();
        }
        renderTreeView(container) {
            super.renderTreeView(DOM.append(container, DOM.$('')));
            const that = this;
            this.treeView.message = (0, nls_1.localize)('explanation', "Please go through each entry and merge to resolve conflicts.");
            this.treeView.dataProvider = { getChildren() { return that.getTreeItems(); } };
        }
        async getTreeItems() {
            const roots = [];
            const conflictResources = this.userDataSyncService.conflicts
                .map(conflict => conflict.conflicts.map(resourcePreview => ({ ...resourcePreview, syncResource: conflict.syncResource, profile: conflict.profile })))
                .flat()
                .sort((a, b) => a.profile.id === b.profile.id ? 0 : a.profile.isDefault ? -1 : b.profile.isDefault ? 1 : a.profile.name.localeCompare(b.profile.name));
            const conflictResourcesByProfile = [];
            for (const previewResource of conflictResources) {
                let result = conflictResourcesByProfile[conflictResourcesByProfile.length - 1]?.[0].id === previewResource.profile.id ? conflictResourcesByProfile[conflictResourcesByProfile.length - 1][1] : undefined;
                if (!result) {
                    conflictResourcesByProfile.push([previewResource.profile, result = []]);
                }
                result.push(previewResource);
            }
            for (const [profile, resources] of conflictResourcesByProfile) {
                const children = [];
                for (const resource of resources) {
                    const handle = JSON.stringify(resource);
                    const treeItem = {
                        handle,
                        resourceUri: resource.remoteResource,
                        label: { label: (0, resources_1.basename)(resource.remoteResource), strikethrough: resource.mergeState === "accepted" /* MergeState.Accepted */ && (resource.localChange === 3 /* Change.Deleted */ || resource.remoteChange === 3 /* Change.Deleted */) },
                        description: (0, userDataSync_2.getSyncAreaLabel)(resource.syncResource),
                        collapsibleState: views_1.TreeItemCollapsibleState.None,
                        command: { id: `workbench.actions.sync.openConflicts`, title: '', arguments: [{ $treeViewId: '', $treeItemHandle: handle }] },
                        contextValue: `sync-conflict-resource`
                    };
                    children.push(treeItem);
                }
                roots.push({
                    handle: profile.id,
                    label: { label: profile.name },
                    collapsibleState: views_1.TreeItemCollapsibleState.Expanded,
                    children
                });
            }
            return conflictResourcesByProfile.length === 1 && conflictResourcesByProfile[0][0].isDefault ? roots[0].children ?? [] : roots;
        }
        parseHandle(handle) {
            const parsed = JSON.parse(handle);
            return {
                syncResource: parsed.syncResource,
                profile: (0, userDataProfile_1.reviveProfile)(parsed.profile, this.userDataProfilesService.profilesHome.scheme),
                localResource: uri_1.URI.revive(parsed.localResource),
                remoteResource: uri_1.URI.revive(parsed.remoteResource),
                baseResource: uri_1.URI.revive(parsed.baseResource),
                previewResource: uri_1.URI.revive(parsed.previewResource),
                acceptedResource: uri_1.URI.revive(parsed.acceptedResource),
                localChange: parsed.localChange,
                remoteChange: parsed.remoteChange,
                mergeState: parsed.mergeState,
            };
        }
        registerActions() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class OpenConflictsAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.openConflicts`,
                        title: (0, nls_1.localize)({ key: 'workbench.actions.sync.openConflicts', comment: ['This is an action title to show the conflicts between local and remote version of resources'] }, "Show Conflicts"),
                    });
                }
                async run(accessor, handle) {
                    const conflict = that.parseHandle(handle.$treeItemHandle);
                    return that.open(conflict);
                }
            }));
            this._register((0, actions_1.registerAction2)(class AcceptRemoteAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.acceptRemote`,
                        title: (0, nls_1.localize)('workbench.actions.sync.acceptRemote', "Accept Remote"),
                        icon: codicons_1.Codicon.cloudDownload,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', userDataSync_2.SYNC_CONFLICTS_VIEW_ID), contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-conflict-resource')),
                            group: 'inline',
                            order: 1,
                        },
                    });
                }
                async run(accessor, handle) {
                    const conflict = that.parseHandle(handle.$treeItemHandle);
                    await that.userDataSyncWorkbenchService.accept({ syncResource: conflict.syncResource, profile: conflict.profile }, conflict.remoteResource, undefined, that.userDataSyncEnablementService.isEnabled());
                }
            }));
            this._register((0, actions_1.registerAction2)(class AcceptLocalAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.acceptLocal`,
                        title: (0, nls_1.localize)('workbench.actions.sync.acceptLocal', "Accept Local"),
                        icon: codicons_1.Codicon.cloudUpload,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', userDataSync_2.SYNC_CONFLICTS_VIEW_ID), contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-conflict-resource')),
                            group: 'inline',
                            order: 2,
                        },
                    });
                }
                async run(accessor, handle) {
                    const conflict = that.parseHandle(handle.$treeItemHandle);
                    await that.userDataSyncWorkbenchService.accept({ syncResource: conflict.syncResource, profile: conflict.profile }, conflict.localResource, undefined, that.userDataSyncEnablementService.isEnabled());
                }
            }));
        }
        async open(conflictToOpen) {
            if (!this.userDataSyncService.conflicts.some(({ conflicts }) => conflicts.some(({ localResource }) => (0, resources_1.isEqual)(localResource, conflictToOpen.localResource)))) {
                return;
            }
            const remoteResourceName = (0, nls_1.localize)({ key: 'remoteResourceName', comment: ['remote as in file in cloud'] }, "{0} (Remote)", (0, resources_1.basename)(conflictToOpen.remoteResource));
            const localResourceName = (0, nls_1.localize)('localResourceName', "{0} (Local)", (0, resources_1.basename)(conflictToOpen.remoteResource));
            await this.editorService.openEditor({
                input1: { resource: conflictToOpen.remoteResource, label: (0, nls_1.localize)('Theirs', 'Theirs'), description: remoteResourceName },
                input2: { resource: conflictToOpen.localResource, label: (0, nls_1.localize)('Yours', 'Yours'), description: localResourceName },
                base: { resource: conflictToOpen.baseResource },
                result: { resource: conflictToOpen.previewResource },
                options: {
                    preserveFocus: true,
                    revealIfVisible: true,
                    pinned: true,
                    override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id
                }
            });
            return;
        }
    };
    exports.UserDataSyncConflictsViewPane = UserDataSyncConflictsViewPane;
    exports.UserDataSyncConflictsViewPane = UserDataSyncConflictsViewPane = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, views_1.IViewDescriptorService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, notification_1.INotificationService),
        __param(12, hover_1.IHoverService),
        __param(13, userDataSync_1.IUserDataSyncService),
        __param(14, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(15, userDataSync_1.IUserDataSyncEnablementService),
        __param(16, userDataProfile_1.IUserDataProfilesService),
        __param(17, accessibleViewInformationService_1.IAccessibleViewInformationService)
    ], UserDataSyncConflictsViewPane);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jQ29uZmxpY3RzVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3VzZXJEYXRhU3luYy9icm93c2VyL3VzZXJEYXRhU3luY0NvbmZsaWN0c1ZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOEJ6RixJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE4QixTQUFRLHVCQUFZO1FBRTlELFlBQ0MsT0FBNEIsRUFDSyxhQUE2QixFQUMxQyxpQkFBcUMsRUFDcEMsa0JBQXVDLEVBQ3JDLG9CQUEyQyxFQUM5QyxpQkFBcUMsRUFDakMscUJBQTZDLEVBQzlDLG9CQUEyQyxFQUNsRCxhQUE2QixFQUM5QixZQUEyQixFQUN2QixnQkFBbUMsRUFDaEMsbUJBQXlDLEVBQ2hELFlBQTJCLEVBQ0gsbUJBQXlDLEVBQ2hDLDRCQUEyRCxFQUMxRCw2QkFBNkQsRUFDbkUsdUJBQWlELEVBQ3pELCtCQUFrRTtZQUVyRyxLQUFLLENBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLG9CQUFvQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsbUJBQW1CLEVBQUUsWUFBWSxFQUFFLCtCQUErQixDQUFDLENBQUM7WUFsQjlOLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQVl2Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ2hDLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7WUFDMUQsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFnQztZQUNuRSw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBSTVGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxD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