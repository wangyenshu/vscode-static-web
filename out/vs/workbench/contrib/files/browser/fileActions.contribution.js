/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/contrib/files/browser/fileActions", "vs/workbench/contrib/files/browser/editors/textFileSaveErrorHandler", "vs/platform/actions/common/actions", "vs/workbench/contrib/files/browser/fileCommands", "vs/workbench/contrib/files/browser/fileConstants", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/contrib/files/common/files", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/list/browser/listService", "vs/base/common/network", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/files/browser/files", "vs/base/common/codicons", "vs/platform/action/common/actionCommonCategories"], function (require, exports, nls, fileActions_1, textFileSaveErrorHandler_1, actions_1, fileCommands_1, fileConstants_1, commands_1, contextkey_1, keybindingsRegistry_1, files_1, workspaceCommands_1, editorCommands_1, filesConfigurationService_1, listService_1, network_1, contextkeys_1, contextkeys_2, files_2, codicons_1, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.appendEditorTitleContextMenuItem = appendEditorTitleContextMenuItem;
    exports.appendToCommandPalette = appendToCommandPalette;
    // Contribute Global Actions
    (0, actions_1.registerAction2)(fileActions_1.GlobalCompareResourcesAction);
    (0, actions_1.registerAction2)(fileActions_1.FocusFilesExplorer);
    (0, actions_1.registerAction2)(fileActions_1.ShowActiveFileInExplorer);
    (0, actions_1.registerAction2)(fileActions_1.CompareWithClipboardAction);
    (0, actions_1.registerAction2)(fileActions_1.CompareNewUntitledTextFilesAction);
    (0, actions_1.registerAction2)(fileActions_1.ToggleAutoSaveAction);
    (0, actions_1.registerAction2)(fileActions_1.OpenActiveFileInEmptyWorkspace);
    (0, actions_1.registerAction2)(fileActions_1.SetActiveEditorReadonlyInSession);
    (0, actions_1.registerAction2)(fileActions_1.SetActiveEditorWriteableInSession);
    (0, actions_1.registerAction2)(fileActions_1.ToggleActiveEditorReadonlyInSession);
    (0, actions_1.registerAction2)(fileActions_1.ResetActiveEditorReadonlyInSession);
    // Commands
    commands_1.CommandsRegistry.registerCommand('_files.windowOpen', fileCommands_1.openWindowCommand);
    commands_1.CommandsRegistry.registerCommand('_files.newWindow', fileCommands_1.newWindowCommand);
    const explorerCommandsWeightBonus = 10; // give our commands a little bit more weight over other default list/tree commands
    const RENAME_ID = 'renameFile';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: RENAME_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext),
        primary: 60 /* KeyCode.F2 */,
        mac: {
            primary: 3 /* KeyCode.Enter */
        },
        handler: fileActions_1.renameHandler
    });
    const MOVE_FILE_TO_TRASH_ID = 'moveFileToTrash';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: MOVE_FILE_TO_TRASH_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext, files_1.ExplorerResourceMoveableToTrash),
        primary: 20 /* KeyCode.Delete */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
            secondary: [20 /* KeyCode.Delete */]
        },
        handler: fileActions_1.moveFileToTrashHandler
    });
    const DELETE_FILE_ID = 'deleteFile';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: DELETE_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext),
        primary: 1024 /* KeyMod.Shift */ | 20 /* KeyCode.Delete */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 1 /* KeyCode.Backspace */
        },
        handler: fileActions_1.deleteFileHandler
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: DELETE_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext, files_1.ExplorerResourceMoveableToTrash.toNegated()),
        primary: 20 /* KeyCode.Delete */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */
        },
        handler: fileActions_1.deleteFileHandler
    });
    const CUT_FILE_ID = 'filesExplorer.cut';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: CUT_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext),
        primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */,
        handler: fileActions_1.cutFileHandler,
    });
    const COPY_FILE_ID = 'filesExplorer.copy';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: COPY_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated()),
        primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
        handler: fileActions_1.copyFileHandler,
    });
    const PASTE_FILE_ID = 'filesExplorer.paste';
    commands_1.CommandsRegistry.registerCommand(PASTE_FILE_ID, fileActions_1.pasteFileHandler);
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: `^${PASTE_FILE_ID}`, // the `^` enables pasting files into the explorer by preventing default bubble up
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext),
        primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'filesExplorer.cancelCut',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceCut),
        primary: 9 /* KeyCode.Escape */,
        handler: async (accessor) => {
            const explorerService = accessor.get(files_2.IExplorerService);
            await explorerService.setToCopy([], true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'filesExplorer.openFilePreserveFocus',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerFolderContext.toNegated()),
        primary: 10 /* KeyCode.Space */,
        handler: fileActions_1.openFilePreserveFocusHandler
    });
    const copyPathCommand = {
        id: fileConstants_1.COPY_PATH_COMMAND_ID,
        title: nls.localize('copyPath', "Copy Path")
    };
    const copyRelativePathCommand = {
        id: fileConstants_1.COPY_RELATIVE_PATH_COMMAND_ID,
        title: nls.localize('copyRelativePath', "Copy Relative Path")
    };
    // Editor Title Context Menu
    appendEditorTitleContextMenuItem(fileConstants_1.COPY_PATH_COMMAND_ID, copyPathCommand.title, contextkeys_1.ResourceContextKey.IsFileSystemResource, '1_cutcopypaste');
    appendEditorTitleContextMenuItem(fileConstants_1.COPY_RELATIVE_PATH_COMMAND_ID, copyRelativePathCommand.title, contextkeys_1.ResourceContextKey.IsFileSystemResource, '1_cutcopypaste');
    appendEditorTitleContextMenuItem(fileConstants_1.REVEAL_IN_EXPLORER_COMMAND_ID, nls.localize('revealInSideBar', "Reveal in Explorer View"), contextkeys_1.ResourceContextKey.IsFileSystemResource, '2_files', 1);
    function appendEditorTitleContextMenuItem(id, title, when, group, order) {
        // Menu
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, {
            command: { id, title },
            when,
            group,
            order
        });
    }
    // Editor Title Menu for Conflict Resolution
    appendSaveConflictEditorTitleAction('workbench.files.action.acceptLocalChanges', nls.localize('acceptLocalChanges', "Use your changes and overwrite file contents"), codicons_1.Codicon.check, -10, textFileSaveErrorHandler_1.acceptLocalChangesCommand);
    appendSaveConflictEditorTitleAction('workbench.files.action.revertLocalChanges', nls.localize('revertLocalChanges', "Discard your changes and revert to file contents"), codicons_1.Codicon.discard, -9, textFileSaveErrorHandler_1.revertLocalChangesCommand);
    function appendSaveConflictEditorTitleAction(id, title, icon, order, command) {
        // Command
        commands_1.CommandsRegistry.registerCommand(id, command);
        // Action
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
            command: { id, title, icon },
            when: contextkey_1.ContextKeyExpr.equals(textFileSaveErrorHandler_1.CONFLICT_RESOLUTION_CONTEXT, true),
            group: 'navigation',
            order
        });
    }
    // Menu registration - command palette
    function appendToCommandPalette({ id, title, category, metadata }, when) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id,
                title,
                category,
                metadata
            },
            when
        });
    }
    appendToCommandPalette({
        id: fileConstants_1.COPY_PATH_COMMAND_ID,
        title: nls.localize2('copyPathOfActive', "Copy Path of Active File"),
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.COPY_RELATIVE_PATH_COMMAND_ID,
        title: nls.localize2('copyRelativePathOfActive', "Copy Relative Path of Active File"),
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.SAVE_FILE_COMMAND_ID,
        title: fileConstants_1.SAVE_FILE_LABEL,
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID,
        title: fileConstants_1.SAVE_FILE_WITHOUT_FORMATTING_LABEL,
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.SAVE_ALL_IN_GROUP_COMMAND_ID,
        title: nls.localize2('saveAllInGroup', "Save All in Group"),
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.SAVE_FILES_COMMAND_ID,
        title: nls.localize2('saveFiles', "Save All Files"),
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.REVERT_FILE_COMMAND_ID,
        title: nls.localize2('revert', "Revert File"),
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.COMPARE_WITH_SAVED_COMMAND_ID,
        title: nls.localize2('compareActiveWithSaved', "Compare Active File with Saved"),
        category: actionCommonCategories_1.Categories.File,
        metadata: {
            description: nls.localize2('compareActiveWithSavedMeta', "Opens a new diff editor to compare the active file with the version on disk.")
        }
    });
    appendToCommandPalette({
        id: fileConstants_1.SAVE_FILE_AS_COMMAND_ID,
        title: fileConstants_1.SAVE_FILE_AS_LABEL,
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileActions_1.NEW_FILE_COMMAND_ID,
        title: fileActions_1.NEW_FILE_LABEL,
        category: actionCommonCategories_1.Categories.File
    }, contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'));
    appendToCommandPalette({
        id: fileActions_1.NEW_FOLDER_COMMAND_ID,
        title: fileActions_1.NEW_FOLDER_LABEL,
        category: actionCommonCategories_1.Categories.File,
        metadata: { description: nls.localize2('newFolderDescription', "Create a new folder or directory") }
    }, contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'));
    appendToCommandPalette({
        id: fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID,
        title: fileConstants_1.NEW_UNTITLED_FILE_LABEL,
        category: actionCommonCategories_1.Categories.File
    });
    // Menu registration - open editors
    const isFileOrUntitledResourceContextKey = contextkey_1.ContextKeyExpr.or(contextkeys_1.ResourceContextKey.IsFileSystemResource, contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.untitled));
    const openToSideCommand = {
        id: fileConstants_1.OPEN_TO_SIDE_COMMAND_ID,
        title: nls.localize('openToSide', "Open to the Side")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: 'navigation',
        order: 10,
        command: openToSideCommand,
        when: isFileOrUntitledResourceContextKey
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '1_open',
        order: 10,
        command: {
            id: editorCommands_1.REOPEN_WITH_COMMAND_ID,
            title: nls.localize('reopenWith', "Reopen Editor With...")
        },
        when: contextkeys_1.ActiveEditorAvailableEditorIdsContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '1_cutcopypaste',
        order: 10,
        command: copyPathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '1_cutcopypaste',
        order: 20,
        command: copyRelativePathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 10,
        command: {
            id: fileConstants_1.SAVE_FILE_COMMAND_ID,
            title: fileConstants_1.SAVE_FILE_LABEL,
            precondition: fileConstants_1.OpenEditorsDirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.or(
        // Untitled Editors
        contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.untitled), 
        // Or:
        contextkey_1.ContextKeyExpr.and(
        // Not: editor groups
        fileConstants_1.OpenEditorsGroupContext.toNegated(), 
        // Not: readonly editors
        fileConstants_1.OpenEditorsReadonlyEditorContext.toNegated(), 
        // Not: auto save after short delay
        filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated()))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 20,
        command: {
            id: fileConstants_1.REVERT_FILE_COMMAND_ID,
            title: nls.localize('revert', "Revert File"),
            precondition: fileConstants_1.OpenEditorsDirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.and(
        // Not: editor groups
        fileConstants_1.OpenEditorsGroupContext.toNegated(), 
        // Not: readonly editors
        fileConstants_1.OpenEditorsReadonlyEditorContext.toNegated(), 
        // Not: untitled editors (revert closes them)
        contextkeys_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.untitled), 
        // Not: auto save after short delay
        filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 30,
        command: {
            id: fileConstants_1.SAVE_ALL_IN_GROUP_COMMAND_ID,
            title: nls.localize('saveAll', "Save All"),
            precondition: contextkeys_1.DirtyWorkingCopiesContext
        },
        // Editor Group
        when: fileConstants_1.OpenEditorsGroupContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 10,
        command: {
            id: fileConstants_1.COMPARE_WITH_SAVED_COMMAND_ID,
            title: nls.localize('compareWithSaved', "Compare with Saved"),
            precondition: fileConstants_1.OpenEditorsDirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.IsFileSystemResource, filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated(), listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const compareResourceCommand = {
        id: fileConstants_1.COMPARE_RESOURCE_COMMAND_ID,
        title: nls.localize('compareWithSelected', "Compare with Selected")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 20,
        command: compareResourceCommand,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.HasResource, fileConstants_1.ResourceSelectedForCompareContext, isFileOrUntitledResourceContextKey, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const selectForCompareCommand = {
        id: fileConstants_1.SELECT_FOR_COMPARE_COMMAND_ID,
        title: nls.localize('compareSource', "Select for Compare")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 30,
        command: selectForCompareCommand,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.HasResource, isFileOrUntitledResourceContextKey, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const compareSelectedCommand = {
        id: fileConstants_1.COMPARE_SELECTED_COMMAND_ID,
        title: nls.localize('compareSelected', "Compare Selected")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 30,
        command: compareSelectedCommand,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection, isFileOrUntitledResourceContextKey)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 10,
        command: {
            id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
            title: nls.localize('close', "Close")
        },
        when: fileConstants_1.OpenEditorsGroupContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 20,
        command: {
            id: editorCommands_1.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID,
            title: nls.localize('closeOthers', "Close Others")
        },
        when: fileConstants_1.OpenEditorsGroupContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 30,
        command: {
            id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID,
            title: nls.localize('closeSaved', "Close Saved")
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 40,
        command: {
            id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
            title: nls.localize('closeAll', "Close All")
        }
    });
    // Menu registration - explorer
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 4,
        command: {
            id: fileActions_1.NEW_FILE_COMMAND_ID,
            title: fileActions_1.NEW_FILE_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 6,
        command: {
            id: fileActions_1.NEW_FOLDER_COMMAND_ID,
            title: fileActions_1.NEW_FOLDER_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 10,
        command: openToSideCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 20,
        command: {
            id: fileConstants_1.OPEN_WITH_EXPLORER_COMMAND_ID,
            title: nls.localize('explorerOpenWith', "Open With..."),
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), files_1.ExplorerResourceAvailableEditorIdsContext),
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 20,
        command: compareResourceCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource, fileConstants_1.ResourceSelectedForCompareContext, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 30,
        command: selectForCompareCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 30,
        command: compareSelectedCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 8,
        command: {
            id: CUT_FILE_ID,
            title: nls.localize('cut', "Cut")
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 10,
        command: {
            id: COPY_FILE_ID,
            title: fileActions_1.COPY_FILE_LABEL
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 20,
        command: {
            id: PASTE_FILE_ID,
            title: fileActions_1.PASTE_FILE_LABEL,
            precondition: contextkey_1.ContextKeyExpr.and(files_1.ExplorerResourceNotReadonlyContext, fileActions_1.FileCopiedContext)
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, ({
        group: '5b_importexport',
        order: 10,
        command: {
            id: fileActions_1.DOWNLOAD_COMMAND_ID,
            title: fileActions_1.DOWNLOAD_LABEL
        },
        when: contextkey_1.ContextKeyExpr.or(
        // native: for any remote resource
        contextkey_1.ContextKeyExpr.and(contextkeys_2.IsWebContext.toNegated(), contextkeys_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.file)), 
        // web: for any files
        contextkey_1.ContextKeyExpr.and(contextkeys_2.IsWebContext, files_1.ExplorerFolderContext.toNegated(), files_1.ExplorerRootContext.toNegated()), 
        // web: for any folders if file system API support is provided
        contextkey_1.ContextKeyExpr.and(contextkeys_2.IsWebContext, contextkeys_1.HasWebFileSystemAccess))
    }));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, ({
        group: '5b_importexport',
        order: 20,
        command: {
            id: fileActions_1.UPLOAD_COMMAND_ID,
            title: fileActions_1.UPLOAD_LABEL,
        },
        when: contextkey_1.ContextKeyExpr.and(
        // only in web
        contextkeys_2.IsWebContext, 
        // only on folders
        files_1.ExplorerFolderContext, 
        // only on editable folders
        files_1.ExplorerResourceNotReadonlyContext)
    }));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '6_copypath',
        order: 10,
        command: copyPathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '6_copypath',
        order: 20,
        command: copyRelativePathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '2_workspace',
        order: 10,
        command: {
            id: workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID,
            title: workspaceCommands_1.ADD_ROOT_FOLDER_LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '2_workspace',
        order: 30,
        command: {
            id: fileConstants_1.REMOVE_ROOT_FOLDER_COMMAND_ID,
            title: fileConstants_1.REMOVE_ROOT_FOLDER_LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, files_1.ExplorerFolderContext, contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'), contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'))))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 10,
        command: {
            id: RENAME_ID,
            title: fileActions_1.TRIGGER_RENAME_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 20,
        command: {
            id: MOVE_FILE_TO_TRASH_ID,
            title: fileActions_1.MOVE_FILE_TO_TRASH_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        alt: {
            id: DELETE_FILE_ID,
            title: nls.localize('deleteFile', "Delete Permanently"),
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceMoveableToTrash)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 20,
        command: {
            id: DELETE_FILE_ID,
            title: nls.localize('deleteFile', "Delete Permanently"),
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceMoveableToTrash.toNegated())
    });
    // Empty Editor Group / Editor Tabs Container Context Menu
    for (const menuId of [actions_1.MenuId.EmptyEditorGroupContext, actions_1.MenuId.EditorTabsBarContext]) {
        actions_1.MenuRegistry.appendMenuItem(menuId, { command: { id: fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID, title: nls.localize('newFile', "New Text File") }, group: '1_file', order: 10 });
        actions_1.MenuRegistry.appendMenuItem(menuId, { command: { id: 'workbench.action.quickOpen', title: nls.localize('openFile', "Open File...") }, group: '1_file', order: 20 });
    }
    // File menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '1_new',
        command: {
            id: fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miNewFile', comment: ['&& denotes a mnemonic'] }, "&&New Text File")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileConstants_1.SAVE_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miSave', comment: ['&& denotes a mnemonic'] }, "&&Save"),
            precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorContext, contextkey_1.ContextKeyExpr.and(files_1.FoldersViewVisibleContext, contextkeys_1.SidebarFocusContext))
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileConstants_1.SAVE_FILE_AS_COMMAND_ID,
            title: nls.localize({ key: 'miSaveAs', comment: ['&& denotes a mnemonic'] }, "Save &&As..."),
            precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorContext, contextkey_1.ContextKeyExpr.and(files_1.FoldersViewVisibleContext, contextkeys_1.SidebarFocusContext))
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileConstants_1.SAVE_ALL_COMMAND_ID,
            title: nls.localize({ key: 'miSaveAll', comment: ['&& denotes a mnemonic'] }, "Save A&&ll"),
            precondition: contextkeys_1.DirtyWorkingCopiesContext
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '5_autosave',
        command: {
            id: fileActions_1.ToggleAutoSaveAction.ID,
            title: nls.localize({ key: 'miAutoSave', comment: ['&& denotes a mnemonic'] }, "A&&uto Save"),
            toggled: contextkey_1.ContextKeyExpr.notEquals('config.files.autoSave', 'off')
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: fileConstants_1.REVERT_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miRevert', comment: ['&& denotes a mnemonic'] }, "Re&&vert File"),
            precondition: contextkey_1.ContextKeyExpr.or(
            // Active editor can revert
            contextkey_1.ContextKeyExpr.and(contextkeys_1.ActiveEditorCanRevertContext), 
            // Explorer focused but not on untitled
            contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.untitled), files_1.FoldersViewVisibleContext, contextkeys_1.SidebarFocusContext)),
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
            title: nls.localize({ key: 'miCloseEditor', comment: ['&& denotes a mnemonic'] }, "&&Close Editor"),
            precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorContext, contextkey_1.ContextKeyExpr.and(files_1.FoldersViewVisibleContext, contextkeys_1.SidebarFocusContext))
        },
        order: 2
    });
    // Go to menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '3_global_nav',
        command: {
            id: 'workbench.action.quickOpen',
            title: nls.localize({ key: 'miGotoFile', comment: ['&& denotes a mnemonic'] }, "Go to &&File...")
        },
        order: 1
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUFjdGlvbnMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvYnJvd3Nlci9maWxlQWN0aW9ucy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE4SmhHLDRFQVNDO0lBc0JELHdEQVVDO0lBNUtELDRCQUE0QjtJQUU1QixJQUFBLHlCQUFlLEVBQUMsMENBQTRCLENBQUMsQ0FBQztJQUM5QyxJQUFBLHlCQUFlLEVBQUMsZ0NBQWtCLENBQUMsQ0FBQztJQUNwQyxJQUFBLHlCQUFlLEVBQUMsc0NBQXdCLENBQUMsQ0FBQztJQUMxQyxJQUFBLHlCQUFlLEVBQUMsd0NBQTBCLENBQUMsQ0FBQztJQUM1QyxJQUFBLHlCQUFlLEVBQUMsK0NBQWlDLENBQUMsQ0FBQztJQUNuRCxJQUFBLHlCQUFlLEVBQUMsa0NBQW9CLENBQUMsQ0FBQztJQUN0QyxJQUFBLHlCQUFlLEVBQUMsNENBQThCLENBQUMsQ0FBQztJQUNoRCxJQUFBLHlCQUFlLEVBQUMsOENBQWdDLENBQUMsQ0FBQztJQUNsRCxJQUFBLHlCQUFlLEVBQUMsK0NBQWlDLENBQUMsQ0FBQztJQUNuRCxJQUFBLHlCQUFlLEVBQUMsaURBQW1DLENBQUMsQ0FBQztJQUNyRCxJQUFBLHlCQUFlLEVBQUMsZ0RBQWtDLENBQUMsQ0FBQztJQUVwRCxXQUFXO0lBQ1gsMkJBQWdCLENBQUMsZUFBZSxDQUFDLG1CQUFtQixFQUFFLGdDQUFpQixDQUFDLENBQUM7SUFDekUsMkJBQWdCLENBQUMsZUFBZSxDQUFDLGtCQUFrQixFQUFFLCtCQUFnQixDQUFDLENBQUM7SUFFdkUsTUFBTSwyQkFBMkIsR0FBRyxFQUFFLENBQUMsQ0FBQyxtRkFBbUY7SUFFM0gsTUFBTSxTQUFTLEdBQUcs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