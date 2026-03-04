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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/views/treeView", "vs/workbench/common/views", "vs/workbench/contrib/editSessions/common/editSessions", "vs/base/common/uri", "vs/base/common/date", "vs/base/common/codicons", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspace", "vs/base/common/resources", "vs/platform/files/common/files", "vs/base/common/path"], function (require, exports, lifecycle_1, nls_1, descriptors_1, instantiation_1, platform_1, treeView_1, views_1, editSessions_1, uri_1, date_1, codicons_1, editorCommands_1, actions_1, contextkey_1, commands_1, dialogs_1, workspace_1, resources_1, files_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditSessionsDataViews = void 0;
    const EDIT_SESSIONS_COUNT_KEY = 'editSessionsCount';
    const EDIT_SESSIONS_COUNT_CONTEXT_KEY = new contextkey_1.RawContextKey(EDIT_SESSIONS_COUNT_KEY, 0);
    let EditSessionsDataViews = class EditSessionsDataViews extends lifecycle_1.Disposable {
        constructor(container, instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this.registerViews(container);
        }
        registerViews(container) {
            const viewId = editSessions_1.EDIT_SESSIONS_DATA_VIEW_ID;
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, viewId, editSessions_1.EDIT_SESSIONS_TITLE.value);
            treeView.showCollapseAllAction = true;
            treeView.showRefreshAction = true;
            treeView.dataProvider = this.instantiationService.createInstance(EditSessionDataViewDataProvider);
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id: viewId,
                    name: editSessions_1.EDIT_SESSIONS_TITLE,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    when: contextkey_1.ContextKeyExpr.and(editSessions_1.EDIT_SESSIONS_SHOW_VIEW),
                    order: 100,
                    hideByDefault: true,
                }], container);
            viewsRegistry.registerViewWelcomeContent(viewId, {
                content: (0, nls_1.localize)('noStoredChanges', 'You have no stored changes in the cloud to display.\n{0}', `[${(0, nls_1.localize)('storeWorkingChangesTitle', 'Store Working Changes')}](command:workbench.editSessions.actions.store)`),
                when: contextkey_1.ContextKeyExpr.equals(EDIT_SESSIONS_COUNT_KEY, 0),
                order: 1
            });
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.resume',
                        title: (0, nls_1.localize)('workbench.editSessions.actions.resume.v2', "Resume Working Changes"),
                        icon: codicons_1.Codicon.desktopDownload,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /edit-session/i)),
                            group: 'inline'
                        }
                    });
                }
                async run(accessor, handle) {
                    const editSessionId = uri_1.URI.parse(handle.$treeItemHandle).path.substring(1);
                    const commandService = accessor.get(commands_1.ICommandService);
                    await commandService.executeCommand('workbench.editSessions.actions.resumeLatest', editSessionId, true);
                    await treeView.refresh();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.store',
                        title: (0, nls_1.localize)('workbench.editSessions.actions.store.v2', "Store Working Changes"),
                        icon: codicons_1.Codicon.cloudUpload,
                    });
                }
                async run(accessor, handle) {
                    const commandService = accessor.get(commands_1.ICommandService);
                    await commandService.executeCommand('workbench.editSessions.actions.storeCurrent');
                    await treeView.refresh();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.delete',
                        title: (0, nls_1.localize)('workbench.editSessions.actions.delete.v2', "Delete Working Changes"),
                        icon: codicons_1.Codicon.trash,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /edit-session/i)),
                            group: 'inline'
                        }
                    });
                }
                async run(accessor, handle) {
                    const editSessionId = uri_1.URI.parse(handle.$treeItemHandle).path.substring(1);
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const editSessionStorageService = accessor.get(editSessions_1.IEditSessionsStorageService);
                    const result = await dialogService.confirm({
                        message: (0, nls_1.localize)('confirm delete.v2', 'Are you sure you want to permanently delete your working changes with ref {0}?', editSessionId),
                        detail: (0, nls_1.localize)('confirm delete detail.v2', ' You cannot undo this action.'),
                        type: 'warning',
                        title: editSessions_1.EDIT_SESSIONS_TITLE.value
                    });
                    if (result.confirmed) {
                        await editSessionStorageService.delete('editSessions', editSessionId);
                        await treeView.refresh();
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.deleteAll',
                        title: (0, nls_1.localize)('workbench.editSessions.actions.deleteAll', "Delete All Working Changes from Cloud"),
                        icon: codicons_1.Codicon.trash,
                        menu: {
                            id: actions_1.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.greater(EDIT_SESSIONS_COUNT_KEY, 0)),
                        }
                    });
                }
                async run(accessor) {
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const editSessionStorageService = accessor.get(editSessions_1.IEditSessionsStorageService);
                    const result = await dialogService.confirm({
                        message: (0, nls_1.localize)('confirm delete all', 'Are you sure you want to permanently delete all stored changes from the cloud?'),
                        detail: (0, nls_1.localize)('confirm delete all detail', ' You cannot undo this action.'),
                        type: 'warning',
                        title: editSessions_1.EDIT_SESSIONS_TITLE.value
                    });
                    if (result.confirmed) {
                        await editSessionStorageService.delete('editSessions', null);
                        await treeView.refresh();
                    }
                }
            }));
        }
    };
    exports.EditSessionsDataViews = EditSessionsDataViews;
    exports.EditSessionsDataViews = EditSessionsDataViews = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], EditSessionsDataViews);
    let EditSessionDataViewDataProvider = class EditSessionDataViewDataProvider {
        constructor(editSessionsStorageService, contextKeyService, workspaceContextService, fileService) {
            this.editSessionsStorageService = editSessionsStorageService;
            this.contextKeyService = contextKeyService;
            this.workspaceContextService = workspaceContextService;
            this.fileService = fileService;
            this.editSessionsCount = EDIT_SESSIONS_COUNT_CONTEXT_KEY.bindTo(this.contextKeyService);
        }
        async getChildren(element) {
            if (!element) {
                return this.getAllEditSessions();
            }
            const [ref, folderName, filePath] = uri_1.URI.parse(element.handle).path.substring(1).split('/');
            if (ref && !folderName) {
                return this.getEditSession(ref);
            }
            else if (ref && folderName && !filePath) {
                return this.getEditSessionFolderContents(ref, folderName);
            }
            return [];
        }
        async getAllEditSessions() {
            const allEditSessions = await this.editSessionsStorageService.list('editSessions');
            this.editSessionsCount.set(allEditSessions.length);
            const editSessions = [];
            for (const session of allEditSessions) {
                const resource = uri_1.URI.from({ scheme: editSessions_1.EDIT_SESSIONS_SCHEME, authority: 'remote-session-content', path: `/${session.ref}` });
                const sessionData = await this.editSessionsStorageService.read('editSessions', session.ref);
                if (!sessionData) {
                    continue;
                }
                const content = JSON.parse(sessionData.content);
                const label = content.folders.map((folder) => folder.name).join(', ') ?? session.ref;
                const machineId = content.machine;
                const machineName = machineId ? await this.editSessionsStorageService.getMachineById(machineId) : undefined;
                const description = machineName === undefined ? (0, date_1.fromNow)(session.created, true) : `${(0, date_1.fromNow)(session.created, true)}\u00a0\u00a0\u2022\u00a0\u00a0${machineName}`;
                editSessions.push({
                    handle: resource.toString(),
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                    label: { label },
                    description: description,
                    themeIcon: codicons_1.Codicon.repo,
                    contextValue: `edit-session`
                });
            }
            return editSessions;
        }
        async getEditSession(ref) {
            const data = await this.editSessionsStorageService.read('editSessions', ref);
            if (!data) {
                return [];
            }
            const content = JSON.parse(data.content);
            if (content.folders.length === 1) {
                const folder = content.folders[0];
                return this.getEditSessionFolderContents(ref, folder.name);
            }
            return content.folders.map((folder) => {
                const resource = uri_1.URI.from({ scheme: editSessions_1.EDIT_SESSIONS_SCHEME, authority: 'remote-session-content', path: `/${data.ref}/${folder.name}` });
                return {
                    handle: resource.toString(),
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                    label: { label: folder.name },
                    themeIcon: codicons_1.Codicon.folder
                };
            });
        }
        async getEditSessionFolderContents(ref, folderName) {
            const data = await this.editSessionsStorageService.read('editSessions', ref);
            if (!data) {
                return [];
            }
            const content = JSON.parse(data.content);
            const currentWorkspaceFolder = this.workspaceContextService.getWorkspace().folders.find((folder) => folder.name === folderName);
            const editSessionFolder = content.folders.find((folder) => folder.name === folderName);
            if (!editSessionFolder) {
                return [];
            }
            return Promise.all(editSessionFolder.workingChanges.map(async (change) => {
                const cloudChangeUri = uri_1.URI.from({ scheme: editSessions_1.EDIT_SESSIONS_SCHEME, authority: 'remote-session-content', path: `/${data.ref}/${folderName}/${change.relativeFilePath}` });
                if (currentWorkspaceFolder?.uri) {
                    // find the corresponding file in the workspace
                    const localCopy = (0, resources_1.joinPath)(currentWorkspaceFolder.uri, change.relativeFilePath);
                    if (change.type === editSessions_1.ChangeType.Addition && await this.fileService.exists(localCopy)) {
                        return {
                            handle: cloudChangeUri.toString(),
                            resourceUri: cloudChangeUri,
                            collapsibleState: views_1.TreeItemCollapsibleState.None,
                            label: { label: change.relativeFilePath },
                            themeIcon: codicons_1.Codicon.file,
                            command: {
                                id: 'vscode.diff',
                                title: (0, nls_1.localize)('compare changes', 'Compare Changes'),
                                arguments: [
                                    localCopy,
                                    cloudChangeUri,
                                    `${(0, path_1.basename)(change.relativeFilePath)} (${(0, nls_1.localize)('local copy', 'Local Copy')} \u2194 ${(0, nls_1.localize)('cloud changes', 'Cloud Changes')})`,
                                    undefined
                                ]
                            }
                        };
                    }
                }
                return {
                    handle: cloudChangeUri.toString(),
                    resourceUri: cloudChangeUri,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    label: { label: change.relativeFilePath },
                    themeIcon: codicons_1.Codicon.file,
                    command: {
                        id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                        title: (0, nls_1.localize)('open file', 'Open File'),
                        arguments: [cloudChangeUri, undefined, undefined]
                    }
                };
            }));
        }
    };
    EditSessionDataViewDataProvider = __decorate([
        __param(0, editSessions_1.IEditSessionsStorageService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, files_1.IFileService)
    ], EditSessionDataViewDataProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zVmlld3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9lZGl0U2Vzc2lvbnMvYnJvd3Nlci9lZGl0U2Vzc2lvbnNWaWV3cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1QmhHLE1BQU0sdUJBQXVCLEdBQUcsbUJBQW1CLENBQUM7SUFDcEQsTUFBTSwrQkFBK0IsR0FBRyxJQUFJLDBCQUFhLENBQVMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFdkYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxzQkFBVTtRQUNwRCxZQUNDLFNBQXdCLEVBQ2dCLG9CQUEyQztZQUVuRixLQUFLLEVBQUUsQ0FBQztZQUZnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBR25GLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVPLGFBQWEsQ0FBQyxTQUF3QjtZQUM3QyxNQUFNLE1BQU0sR0FBRyx5Q0FBMEIsQ0FBQztZQUMxQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1CQUFRLEVBQUUsTUFBTSxFQUFFLGtDQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZHLFFBQVEsQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7WUFDdEMsUUFBUSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztZQUNsQyxRQUFRLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsK0JBQStCLENBQUMsQ0FBQztZQUVsRyxNQUFNLGFBQWEsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBaUIsa0JBQVUsQ0FBQyxhQUFhLENBQUMs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