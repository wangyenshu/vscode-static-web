/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/workbench/services/editor/common/editorService", "vs/platform/commands/common/commands", "vs/workbench/browser/actions/workspaceCommands", "vs/platform/dialogs/common/dialogs", "vs/platform/actions/common/actions", "vs/workbench/common/contextkeys", "vs/workbench/services/host/browser/host", "vs/base/common/keyCodes", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspaces/common/workspaces", "vs/platform/contextkey/common/contextkeys", "vs/platform/action/common/actionCommonCategories"], function (require, exports, nls_1, workspace_1, workspaceEditing_1, editorService_1, commands_1, workspaceCommands_1, dialogs_1, actions_1, contextkeys_1, host_1, keyCodes_1, contextkey_1, environmentService_1, workspaces_1, contextkeys_2, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoveRootFolderAction = exports.AddRootFolderAction = exports.OpenFileFolderAction = exports.OpenFolderViaWorkspaceAction = exports.OpenFolderAction = exports.OpenFileAction = void 0;
    const workspacesCategory = (0, nls_1.localize2)('workspaces', 'Workspaces');
    class OpenFileAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.files.openFile'; }
        constructor() {
            super({
                id: OpenFileAction.ID,
                title: (0, nls_1.localize2)('openFile', 'Open File...'),
                category: actionCommonCategories_1.Categories.File,
                f1: true,
                keybinding: {
                    when: contextkeys_2.IsMacNativeContext.toNegated(),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */
                }
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickFileAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    }
    exports.OpenFileAction = OpenFileAction;
    class OpenFolderAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.files.openFolder'; }
        constructor() {
            super({
                id: OpenFolderAction.ID,
                title: (0, nls_1.localize2)('openFolder', 'Open Folder...'),
                category: actionCommonCategories_1.Categories.File,
                f1: true,
                precondition: contextkeys_1.OpenFolderWorkspaceSupportContext,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: undefined,
                    linux: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */)
                    },
                    win: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */)
                    }
                }
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    }
    exports.OpenFolderAction = OpenFolderAction;
    class OpenFolderViaWorkspaceAction extends actions_1.Action2 {
        // This action swaps the folders of a workspace with
        // the selected folder and is a workaround for providing
        // "Open Folder..." in environments that do not support
        // this without having a workspace open (e.g. web serverless)
        static { this.ID = 'workbench.action.files.openFolderViaWorkspace'; }
        constructor() {
            super({
                id: OpenFolderViaWorkspaceAction.ID,
                title: (0, nls_1.localize2)('openFolder', 'Open Folder...'),
                category: actionCommonCategories_1.Categories.File,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.OpenFolderWorkspaceSupportContext.toNegated(), contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */
                }
            });
        }
        run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            return commandService.executeCommand(workspaceCommands_1.SET_ROOT_FOLDER_COMMAND_ID);
        }
    }
    exports.OpenFolderViaWorkspaceAction = OpenFolderViaWorkspaceAction;
    class OpenFileFolderAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.files.openFileFolder'; }
        static { this.LABEL = (0, nls_1.localize2)('openFileFolder', 'Open...'); }
        constructor() {
            super({
                id: OpenFileFolderAction.ID,
                title: OpenFileFolderAction.LABEL,
                category: actionCommonCategories_1.Categories.File,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_2.IsMacNativeContext, contextkeys_1.OpenFolderWorkspaceSupportContext),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */
                }
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickFileFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    }
    exports.OpenFileFolderAction = OpenFileFolderAction;
    class OpenWorkspaceAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openWorkspace'; }
        constructor() {
            super({
                id: OpenWorkspaceAction.ID,
                title: (0, nls_1.localize2)('openWorkspaceAction', 'Open Workspace from File...'),
                category: actionCommonCategories_1.Categories.File,
                f1: true,
                precondition: contextkeys_1.EnterMultiRootWorkspaceSupportContext
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickWorkspaceAndOpen({ telemetryExtraData: data });
        }
    }
    class CloseWorkspaceAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.closeFolder'; }
        constructor() {
            super({
                id: CloseWorkspaceAction.ID,
                title: (0, nls_1.localize2)('closeWorkspace', 'Close Workspace'),
                category: workspacesCategory,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkeys_1.EmptyWorkspaceSupportContext),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 36 /* KeyCode.KeyF */)
                }
            });
        }
        async run(accessor) {
            const hostService = accessor.get(host_1.IHostService);
            const environmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
            return hostService.openWindow({ forceReuseWindow: true, remoteAuthority: environmentService.remoteAuthority });
        }
    }
    class OpenWorkspaceConfigFileAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openWorkspaceConfigFile'; }
        constructor() {
            super({
                id: OpenWorkspaceConfigFileAction.ID,
                title: (0, nls_1.localize2)('openWorkspaceConfigFile', 'Open Workspace Configuration File'),
                category: workspacesCategory,
                f1: true,
                precondition: contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')
            });
        }
        async run(accessor) {
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const configuration = contextService.getWorkspace().configuration;
            if (configuration) {
                await editorService.openEditor({ resource: configuration, options: { pinned: true } });
            }
        }
    }
    class AddRootFolderAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.addRootFolder'; }
        constructor() {
            super({
                id: AddRootFolderAction.ID,
                title: workspaceCommands_1.ADD_ROOT_FOLDER_LABEL,
                category: workspacesCategory,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'))
            });
        }
        run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            return commandService.executeCommand(workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID);
        }
    }
    exports.AddRootFolderAction = AddRootFolderAction;
    class RemoveRootFolderAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.removeRootFolder'; }
        constructor() {
            super({
                id: RemoveRootFolderAction.ID,
                title: (0, nls_1.localize2)('globalRemoveFolderFromWorkspace', 'Remove Folder from Workspace...'),
                category: workspacesCategory,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'), contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')))
            });
        }
        async run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const folder = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
            if (folder) {
                await workspaceEditingService.removeFolders([folder.uri]);
            }
        }
    }
    exports.RemoveRootFolderAction = RemoveRootFolderAction;
    class SaveWorkspaceAsAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.saveWorkspaceAs'; }
        constructor() {
            super({
                id: SaveWorkspaceAsAction.ID,
                title: (0, nls_1.localize2)('saveWorkspaceAsAction', 'Save Workspace As...'),
                category: workspacesCategory,
                f1: true,
                precondition: contextkeys_1.EnterMultiRootWorkspaceSupportContext
            });
        }
        async run(accessor) {
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const configPathUri = await workspaceEditingService.pickNewWorkspacePath();
            if (configPathUri && (0, workspace_1.hasWorkspaceFileExtension)(configPathUri)) {
                switch (contextService.getWorkbenchState()) {
                    case 1 /* WorkbenchState.EMPTY */:
                    case 2 /* WorkbenchState.FOLDER */: {
                        const folders = contextService.getWorkspace().folders.map(folder => ({ uri: folder.uri }));
                        return workspaceEditingService.createAndEnterWorkspace(folders, configPathUri);
                    }
                    case 3 /* WorkbenchState.WORKSPACE */:
                        return workspaceEditingService.saveAndEnterWorkspace(configPathUri);
                }
            }
        }
    }
    class DuplicateWorkspaceInNewWindowAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.duplicateWorkspaceInNewWindow'; }
        constructor() {
            super({
                id: DuplicateWorkspaceInNewWindowAction.ID,
                title: (0, nls_1.localize2)('duplicateWorkspaceInNewWindow', 'Duplicate As Workspace in New Window'),
                category: workspacesCategory,
                f1: true,
                precondition: contextkeys_1.EnterMultiRootWorkspaceSupportContext
            });
        }
        async run(accessor) {
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const hostService = accessor.get(host_1.IHostService);
            const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
            const environmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
            const folders = workspaceContextService.getWorkspace().folders;
            const remoteAuthority = environmentService.remoteAuthority;
            const newWorkspace = await workspacesService.createUntitledWorkspace(folders, remoteAuthority);
            await workspaceEditingService.copyWorkspaceSettings(newWorkspace);
            return hostService.openWindow([{ workspaceUri: newWorkspace.configPath }], { forceNewWindow: true, remoteAuthority });
        }
    }
    // --- Actions Registration
    (0, actions_1.registerAction2)(AddRootFolderAction);
    (0, actions_1.registerAction2)(RemoveRootFolderAction);
    (0, actions_1.registerAction2)(OpenFileAction);
    (0, actions_1.registerAction2)(OpenFolderAction);
    (0, actions_1.registerAction2)(OpenFolderViaWorkspaceAction);
    (0, actions_1.registerAction2)(OpenFileFolderAction);
    (0, actions_1.registerAction2)(OpenWorkspaceAction);
    (0, actions_1.registerAction2)(OpenWorkspaceConfigFileAction);
    (0, actions_1.registerAction2)(CloseWorkspaceAction);
    (0, actions_1.registerAction2)(SaveWorkspaceAsAction);
    (0, actions_1.registerAction2)(DuplicateWorkspaceInNewWindowAction);
    // --- Menu Registration
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFileAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenFile', comment: ['&& denotes a mnemonic'] }, "&&Open File...")
        },
        order: 1,
        when: contextkeys_2.IsMacNativeContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFolderAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenFolder', comment: ['&& denotes a mnemonic'] }, "Open &&Folder...")
        },
        order: 2,
        when: contextkeys_1.OpenFolderWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFolderViaWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenFolder', comment: ['&& denotes a mnemonic'] }, "Open &&Folder...")
        },
        order: 2,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.OpenFolderWorkspaceSupportContext.toNegated(), contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFileFolderAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpen', comment: ['&& denotes a mnemonic'] }, "&&Open...")
        },
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_2.IsMacNativeContext, contextkeys_1.OpenFolderWorkspaceSupportContext)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenWorkspace', comment: ['&& denotes a mnemonic'] }, "Open Wor&&kspace from File...")
        },
        order: 3,
        when: contextkeys_1.EnterMultiRootWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '3_workspace',
        command: {
            id: workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID,
            title: (0, nls_1.localize)({ key: 'miAddFolderToWorkspace', comment: ['&& denotes a mnemonic'] }, "A&&dd Folder to Workspace...")
        },
        when: contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')),
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '3_workspace',
        command: {
            id: SaveWorkspaceAsAction.ID,
            title: (0, nls_1.localize)('miSaveWorkspaceAs', "Save Workspace As...")
        },
        order: 2,
        when: contextkeys_1.EnterMultiRootWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '3_workspace',
        command: {
            id: DuplicateWorkspaceInNewWindowAction.ID,
            title: (0, nls_1.localize)('duplicateWorkspace', "Duplicate Workspace")
        },
        order: 3,
        when: contextkeys_1.EnterMultiRootWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: CloseWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miCloseFolder', comment: ['&& denotes a mnemonic'] }, "Close &&Folder")
        },
        order: 3,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('folder'), contextkeys_1.EmptyWorkspaceSupportContext)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: CloseWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miCloseWorkspace', comment: ['&& denotes a mnemonic'] }, "Close &&Workspace")
        },
        order: 3,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), contextkeys_1.EmptyWorkspaceSupportContext)
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL2FjdGlvbnMvd29ya3NwYWNlQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLE1BQU0sa0JBQWtCLEdBQXFCLElBQUEsZUFBUyxFQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztJQUVuRixNQUFhLGNBQWUsU0FBUSxpQkFBTztpQkFFMUIsT0FBRSxHQUFHLGlDQUFpQyxDQUFDO1FBRXZEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxjQUFjLENBQUMsRUFBRTtnQkFDckIsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLFVBQVUsRUFBRSxjQUFjLENBQUM7Z0JBQzVDLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLElBQUk7Z0JBQ3pCLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFVBQVUsRUFBRTtvQkFDWCxJQUFJLEVBQUUsZ0NBQWtCLENBQUMsU0FBUyxFQUFFO29CQUNwQyxNQUFNLDZDQUFtQztvQkFDekMsT0FBTyxFQUFFLGlEQUE2QjtpQkFDdEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLElBQXFCO1lBQ25FLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBa0IsQ0FBQyxDQUFDO1lBRTNELE9BQU8saUJBQWlCLENBQUMsZUFBZSxDQUFDLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQy9GLENBQUM7O0lBdEJGLHdDQXVCQztJQUVELE1BQWEsZ0JBQWlCLFNBQVEsaUJBQU87aUJBRTVCLE9BQUUsR0FBRyxtQ0FBbUMs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