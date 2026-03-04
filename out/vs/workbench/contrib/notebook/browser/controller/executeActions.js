/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/resources", "vs/base/common/themables", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatContext", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatController", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, iterator_1, resources_1, themables_1, language_1, nls_1, actions_1, configuration_1, contextkey_1, debug_1, inlineChatController_1, inlineChat_1, cellOperations_1, notebookChatContext_1, notebookChatController_1, coreActions_1, notebookBrowser_1, icons, notebookCommon_1, notebookContextKeys_1, notebookEditorInput_1, notebookExecutionStateService_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.executeThisCellCondition = exports.executeCondition = void 0;
    const EXECUTE_NOTEBOOK_COMMAND_ID = 'notebook.execute';
    const CANCEL_NOTEBOOK_COMMAND_ID = 'notebook.cancelExecution';
    const INTERRUPT_NOTEBOOK_COMMAND_ID = 'notebook.interruptExecution';
    const CANCEL_CELL_COMMAND_ID = 'notebook.cell.cancelExecution';
    const EXECUTE_CELL_FOCUS_CONTAINER_COMMAND_ID = 'notebook.cell.executeAndFocusContainer';
    const EXECUTE_CELL_SELECT_BELOW = 'notebook.cell.executeAndSelectBelow';
    const EXECUTE_CELL_INSERT_BELOW = 'notebook.cell.executeAndInsertBelow';
    const EXECUTE_CELL_AND_BELOW = 'notebook.cell.executeCellAndBelow';
    const EXECUTE_CELLS_ABOVE = 'notebook.cell.executeCellsAbove';
    const RENDER_ALL_MARKDOWN_CELLS = 'notebook.renderAllMarkdownCells';
    const REVEAL_RUNNING_CELL = 'notebook.revealRunningCell';
    const REVEAL_LAST_FAILED_CELL = 'notebook.revealLastFailedCell';
    // If this changes, update getCodeCellExecutionContextKeyService to match
    exports.executeCondition = contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('code'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.greater(notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.key, 0), contextkey_1.ContextKeyExpr.greater(notebookContextKeys_1.NOTEBOOK_KERNEL_SOURCE_COUNT.key, 0), notebookContextKeys_1.NOTEBOOK_MISSING_KERNEL_EXTENSION));
    exports.executeThisCellCondition = contextkey_1.ContextKeyExpr.and(exports.executeCondition, notebookContextKeys_1.NOTEBOOK_CELL_EXECUTING.toNegated());
    function renderAllMarkdownCells(context) {
        for (let i = 0; i < context.notebookEditor.getLength(); i++) {
            const cell = context.notebookEditor.cellAt(i);
            if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                cell.updateEditState(notebookBrowser_1.CellEditState.Preview, 'renderAllMarkdownCells');
            }
        }
    }
    async function runCell(editorGroupsService, context) {
        const group = editorGroupsService.activeGroup;
        if (group) {
            if (group.activeEditor) {
                group.pinEditor(group.activeEditor);
            }
        }
        if (context.ui && context.cell) {
            await context.notebookEditor.executeNotebookCells(iterator_1.Iterable.single(context.cell));
            if (context.autoReveal) {
                const cellIndex = context.notebookEditor.getCellIndex(context.cell);
                context.notebookEditor.revealCellRangeInView({ start: cellIndex, end: cellIndex + 1 });
            }
        }
        else if (context.selectedCells?.length || context.cell) {
            const selectedCells = context.selectedCells?.length ? context.selectedCells : [context.cell];
            await context.notebookEditor.executeNotebookCells(selectedCells);
            const firstCell = selectedCells[0];
            if (firstCell && context.autoReveal) {
                const cellIndex = context.notebookEditor.getCellIndex(firstCell);
                context.notebookEditor.revealCellRangeInView({ start: cellIndex, end: cellIndex + 1 });
            }
        }
        let foundEditor = undefined;
        for (const [, codeEditor] of context.notebookEditor.codeEditors) {
            if ((0, resources_1.isEqual)(codeEditor.getModel()?.uri, (context.cell ?? context.selectedCells?.[0])?.uri)) {
                foundEditor = codeEditor;
                break;
            }
        }
        if (!foundEditor) {
            return;
        }
        const controller = inlineChatController_1.InlineChatController.get(foundEditor);
        if (!controller) {
            return;
        }
        controller.createSnapshot();
    }
    (0, actions_1.registerAction2)(class RenderAllMarkdownCellsAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: RENDER_ALL_MARKDOWN_CELLS,
                title: (0, nls_1.localize)('notebookActions.renderMarkdown', "Render All Markdown Cells"),
            });
        }
        async runWithContext(accessor, context) {
            renderAllMarkdownCells(context);
        }
    });
    (0, actions_1.registerAction2)(class ExecuteNotebookAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: EXECUTE_NOTEBOOK_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.executeNotebook', "Run All"),
                icon: icons.executeAllIcon,
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.executeNotebook', "Run All"),
                    args: [
                        {
                            name: 'uri',
                            description: 'The document uri'
                        }
                    ]
                },
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        order: -1,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, coreActions_1.executeNotebookCondition, contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated(), notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING.toNegated()), contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true))
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        order: -1,
                        group: 'navigation/execute',
                        when: contextkey_1.ContextKeyExpr.and(coreActions_1.executeNotebookCondition, contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated(), notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING.toNegated()), contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated())?.negate(), contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true))
                    }
                ]
            });
        }
        getEditorContextFromArgsOrActive(accessor, context) {
            return (0, coreActions_1.getContextFromUri)(accessor, context) ?? (0, coreActions_1.getContextFromActiveEditor)(accessor.get(editorService_1.IEditorService));
        }
        async runWithContext(accessor, context) {
            renderAllMarkdownCells(context);
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).find(editor => editor.editor instanceof notebookEditorInput_1.NotebookEditorInput && editor.editor.viewType === context.notebookEditor.textModel.viewType && editor.editor.resource.toString() === context.notebookEditor.textModel.uri.toString());
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            if (editor) {
                const group = editorGroupService.getGroup(editor.groupId);
                group?.pinEditor(editor.editor);
            }
            return context.notebookEditor.executeNotebookCells();
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCell extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.EXECUTE_CELL_COMMAND_ID,
                precondition: exports.executeThisCellCondition,
                title: (0, nls_1.localize)('notebookActions.execute', "Execute Cell"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED)),
                    primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */,
                    win: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */
                    },
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellExecutePrimary,
                    when: exports.executeThisCellCondition,
                    group: 'inline'
                },
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.execute', "Execute Cell"),
                    args: coreActions_1.cellExecutionArgs
                },
                icon: icons.executeIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            if (context.ui) {
                await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            const chatController = notebookChatController_1.NotebookChatController.get(context.notebookEditor);
            const editingCell = chatController?.getEditingCell();
            if (chatController?.hasFocus() && editingCell) {
                const group = editorGroupsService.activeGroup;
                if (group) {
                    if (group.activeEditor) {
                        group.pinEditor(group.activeEditor);
                    }
                }
                await context.notebookEditor.executeNotebookCells([editingCell]);
                return;
            }
            await runCell(editorGroupsService, context);
        }
    });
    (0, actions_1.registerAction2)(class ExecuteAboveCells extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXECUTE_CELLS_ABOVE,
                precondition: exports.executeCondition,
                title: (0, nls_1.localize)('notebookActions.executeAbove', "Execute Above Cells"),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellExecute,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, true))
                    },
                    {
                        id: actions_1.MenuId.NotebookCellTitle,
                        order: 1 /* CellToolbarOrder.ExecuteAboveCells */,
                        group: coreActions_1.CELL_TITLE_CELL_GROUP_ID,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, false))
                    }
                ],
                icon: icons.executeAboveIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            let endCellIdx = undefined;
            if (context.ui) {
                endCellIdx = context.notebookEditor.getCellIndex(context.cell);
                await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            else {
                endCellIdx = Math.min(...context.selectedCells.map(cell => context.notebookEditor.getCellIndex(cell)));
            }
            if (typeof endCellIdx === 'number') {
                const range = { start: 0, end: endCellIdx };
                const cells = context.notebookEditor.getCellsInRange(range);
                context.notebookEditor.executeNotebookCells(cells);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellAndBelow extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_AND_BELOW,
                precondition: exports.executeCondition,
                title: (0, nls_1.localize)('notebookActions.executeBelow', "Execute Cell and Below"),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellExecute,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, true))
                    },
                    {
                        id: actions_1.MenuId.NotebookCellTitle,
                        order: 2 /* CellToolbarOrder.ExecuteCellAndBelow */,
                        group: coreActions_1.CELL_TITLE_CELL_GROUP_ID,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, false))
                    }
                ],
                icon: icons.executeBelowIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            let startCellIdx = undefined;
            if (context.ui) {
                startCellIdx = context.notebookEditor.getCellIndex(context.cell);
                await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            else {
                startCellIdx = Math.min(...context.selectedCells.map(cell => context.notebookEditor.getCellIndex(cell)));
            }
            if (typeof startCellIdx === 'number') {
                const range = { start: startCellIdx, end: context.notebookEditor.getLength() };
                const cells = context.notebookEditor.getCellsInRange(range);
                context.notebookEditor.executeNotebookCells(cells);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellFocusContainer extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_FOCUS_CONTAINER_COMMAND_ID,
                precondition: exports.executeThisCellCondition,
                title: (0, nls_1.localize)('notebookActions.executeAndFocusContainer', "Execute Cell and Focus Container"),
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.executeAndFocusContainer', "Execute Cell and Focus Container"),
                    args: coreActions_1.cellExecutionArgs
                },
                icon: icons.executeIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            if (context.ui) {
                await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            else {
                const firstCell = context.selectedCells[0];
                if (firstCell) {
                    await context.notebookEditor.focusNotebookCell(firstCell, 'container', { skipReveal: true });
                }
            }
            await runCell(editorGroupsService, context);
        }
    });
    const cellCancelCondition = contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals(notebookContextKeys_1.NOTEBOOK_CELL_EXECUTION_STATE.key, 'executing'), contextkey_1.ContextKeyExpr.equals(notebookContextKeys_1.NOTEBOOK_CELL_EXECUTION_STATE.key, 'pending'));
    (0, actions_1.registerAction2)(class CancelExecuteCell extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: CANCEL_CELL_COMMAND_ID,
                precondition: cellCancelCondition,
                title: (0, nls_1.localize)('notebookActions.cancel', "Stop Cell Execution"),
                icon: icons.stopIcon,
                menu: {
                    id: actions_1.MenuId.NotebookCellExecutePrimary,
                    when: cellCancelCondition,
                    group: 'inline'
                },
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.cancel', "Stop Cell Execution"),
                    args: [
                        {
                            name: 'options',
                            description: 'The cell range options',
                            schema: {
                                'type': 'object',
                                'required': ['ranges'],
                                'properties': {
                                    'ranges': {
                                        'type': 'array',
                                        items: [
                                            {
                                                'type': 'object',
                                                'required': ['start', 'end'],
                                                'properties': {
                                                    'start': {
                                                        'type': 'number'
                                                    },
                                                    'end': {
                                                        'type': 'number'
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    'document': {
                                        'type': 'object',
                                        'description': 'The document uri',
                                    }
                                }
                            }
                        }
                    ]
                },
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
                return context.notebookEditor.cancelNotebookCells(iterator_1.Iterable.single(context.cell));
            }
            else {
                return context.notebookEditor.cancelNotebookCells(context.selectedCells);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellSelectBelow extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_SELECT_BELOW,
                precondition: contextkey_1.ContextKeyExpr.or(exports.executeThisCellCondition, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                title: (0, nls_1.localize)('notebookActions.executeAndSelectBelow', "Execute Notebook Cell and Select Below"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED.negate()),
                    primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const idx = context.notebookEditor.getCellIndex(context.cell);
            if (typeof idx !== 'number') {
                return;
            }
            const languageService = accessor.get(language_1.ILanguageService);
            const config = accessor.get(configuration_1.IConfigurationService);
            const scrollBehavior = config.getValue(notebookCommon_1.NotebookSetting.scrollToRevealCell);
            let focusOptions;
            if (scrollBehavior === 'none') {
                focusOptions = { skipReveal: true };
            }
            else {
                focusOptions = {
                    revealBehavior: scrollBehavior === 'fullCell' ? notebookBrowser_1.ScrollToRevealBehavior.fullCell : notebookBrowser_1.ScrollToRevealBehavior.firstLine
                };
            }
            if (context.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                const nextCell = context.notebookEditor.cellAt(idx + 1);
                context.cell.updateEditState(notebookBrowser_1.CellEditState.Preview, EXECUTE_CELL_SELECT_BELOW);
                if (nextCell) {
                    await context.notebookEditor.focusNotebookCell(nextCell, 'container', focusOptions);
                }
                else {
                    const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, notebookCommon_1.CellKind.Markup, 'below');
                    if (newCell) {
                        await context.notebookEditor.focusNotebookCell(newCell, 'editor', focusOptions);
                    }
                }
                return;
            }
            else {
                const nextCell = context.notebookEditor.cellAt(idx + 1);
                if (nextCell) {
                    await context.notebookEditor.focusNotebookCell(nextCell, 'container', focusOptions);
                }
                else {
                    const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, notebookCommon_1.CellKind.Code, 'below');
                    if (newCell) {
                        await context.notebookEditor.focusNotebookCell(newCell, 'editor', focusOptions);
                    }
                }
                return runCell(editorGroupsService, context);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellInsertBelow extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_INSERT_BELOW,
                precondition: contextkey_1.ContextKeyExpr.or(exports.executeThisCellCondition, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                title: (0, nls_1.localize)('notebookActions.executeAndInsertBelow', "Execute Notebook Cell and Insert Below"),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED,
                    primary: 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */,
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const idx = context.notebookEditor.getCellIndex(context.cell);
            const languageService = accessor.get(language_1.ILanguageService);
            const newFocusMode = context.cell.focusMode === notebookBrowser_1.CellFocusMode.Editor ? 'editor' : 'container';
            const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, context.cell.cellKind, 'below');
            if (newCell) {
                await context.notebookEditor.focusNotebookCell(newCell, newFocusMode);
            }
            if (context.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                context.cell.updateEditState(notebookBrowser_1.CellEditState.Preview, EXECUTE_CELL_INSERT_BELOW);
            }
            else {
                runCell(editorGroupsService, context);
            }
        }
    });
    class CancelNotebook extends coreActions_1.NotebookAction {
        getEditorContextFromArgsOrActive(accessor, context) {
            return (0, coreActions_1.getContextFromUri)(accessor, context) ?? (0, coreActions_1.getContextFromActiveEditor)(accessor.get(editorService_1.IEditorService));
        }
        async runWithContext(accessor, context) {
            return context.notebookEditor.cancelNotebookCells();
        }
    }
    (0, actions_1.registerAction2)(class CancelAllNotebook extends CancelNotebook {
        constructor() {
            super({
                id: CANCEL_NOTEBOOK_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.cancelNotebook', "Stop Execution"),
                icon: icons.stopIcon,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        order: -1,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated(), contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true))
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        order: -1,
                        group: 'navigation/execute',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated(), contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true))
                    }
                ]
            });
        }
    });
    (0, actions_1.registerAction2)(class InterruptNotebook extends CancelNotebook {
        constructor() {
            super({
                id: INTERRUPT_NOTEBOOK_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.interruptNotebook', "Interrupt"),
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL),
                icon: icons.stopIcon,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        order: -1,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true))
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        order: -1,
                        group: 'navigation/execute',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL, contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true))
                    },
                    {
                        id: actions_1.MenuId.InteractiveToolbar,
                        group: 'navigation/execute'
                    }
                ]
            });
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookToolbar, {
        title: (0, nls_1.localize)('revealRunningCellShort', "Go To"),
        submenu: actions_1.MenuId.NotebookCellExecuteGoTo,
        group: 'navigation/execute',
        order: 20,
        icon: themables_1.ThemeIcon.modify(icons.executingStateIcon, 'spin')
    });
    (0, actions_1.registerAction2)(class RevealRunningCellAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: REVEAL_RUNNING_CELL,
                title: (0, nls_1.localize)('revealRunningCell', "Go to Running Cell"),
                tooltip: (0, nls_1.localize)('revealRunningCell', "Go to Running Cell"),
                shortTitle: (0, nls_1.localize)('revealRunningCell', "Go to Running Cell"),
                precondition: notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true)),
                        group: 'navigation',
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.NotebookCellExecuteGoTo,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL, contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)),
                        group: 'navigation/execute',
                        order: 20
                    },
                    {
                        id: actions_1.MenuId.InteractiveToolbar,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL, contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive')),
                        group: 'navigation',
                        order: 10
                    }
                ],
                icon: themables_1.ThemeIcon.modify(icons.executingStateIcon, 'spin')
            });
        }
        async runWithContext(accessor, context) {
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const notebook = context.notebookEditor.textModel.uri;
            const executingCells = notebookExecutionStateService.getCellExecutionsForNotebook(notebook);
            if (executingCells[0]) {
                const topStackFrameCell = this.findCellAtTopFrame(accessor, notebook);
                const focusHandle = topStackFrameCell ?? executingCells[0].cellHandle;
                const cell = context.notebookEditor.getCellByHandle(focusHandle);
                if (cell) {
                    context.notebookEditor.focusNotebookCell(cell, 'container');
                }
            }
        }
        findCellAtTopFrame(accessor, notebook) {
            const debugService = accessor.get(debug_1.IDebugService);
            for (const session of debugService.getModel().getSessions()) {
                for (const thread of session.getAllThreads()) {
                    const sf = thread.getTopStackFrame();
                    if (sf) {
                        const parsed = notebookCommon_1.CellUri.parse(sf.source.uri);
                        if (parsed && parsed.notebook.toString() === notebook.toString()) {
                            return parsed.handle;
                        }
                    }
                }
            }
            return undefined;
        }
    });
    (0, actions_1.registerAction2)(class RevealLastFailedCellAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: REVEAL_LAST_FAILED_CELL,
                title: (0, nls_1.localize)('revealLastFailedCell', "Go to Most Recently Failed Cell"),
                tooltip: (0, nls_1.localize)('revealLastFailedCell', "Go to Most Recently Failed Cell"),
                shortTitle: (0, nls_1.localize)('revealLastFailedCellShort', "Go to Most Recently Failed Cell"),
                precondition: notebookContextKeys_1.NOTEBOOK_LAST_CELL_FAILED,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_LAST_CELL_FAILED, notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL.toNegated(), contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true)),
                        group: 'navigation',
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.NotebookCellExecuteGoTo,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_LAST_CELL_FAILED, notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL.toNegated(), contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)),
                        group: 'navigation/execute',
                        order: 20
                    },
                ],
                icon: icons.errorStateIcon,
            });
        }
        async runWithContext(accessor, context) {
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const notebook = context.notebookEditor.textModel.uri;
            const lastFailedCellHandle = notebookExecutionStateService.getLastFailedCellForNotebook(notebook);
            if (lastFailedCellHandle !== undefined) {
                const lastFailedCell = context.notebookEditor.getCellByHandle(lastFailedCellHandle);
                if (lastFailedCell) {
                    context.notebookEditor.focusNotebookCell(lastFailedCell, 'container');
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0ZUFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyb2xsZXIvZXhlY3V0ZUFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK0JoRyxNQUFNLDJCQUEyQixHQUFHLGtCQUFrQixDQUFDO0lBQ3ZELE1BQU0sMEJBQTBCLEdBQUcsMEJBQTBCLENBQUM7SUFDOUQsTUFBTSw2QkFBNkIsR0FBRyw2QkFBNkIsQ0FBQztJQUNwRSxNQUFNLHNCQUFzQixHQUFHLCtCQUErQixDQUFDO0lBQy9ELE1BQU0sdUNBQXVDLEdBQUcsd0NBQXdDLENBQUM7SUFDekYsTUFBTSx5QkFBeUIsR0FBRyxxQ0FBcUMsQ0FBQztJQUN4RSxNQUFNLHlCQUF5QixHQUFHLHFDQUFxQyxDQUFDO0lBQ3hFLE1BQU0sc0JBQXNCLEdBQUcsbUNBQW1DLENBQUM7SUFDbkUsTUFBTSxtQkFBbUIsR0FBRyxpQ0FBaUMsQ0FBQztJQUM5RCxNQUFNLHlCQUF5QixHQUFHLGlDQUFpQyxDQUFDO0lBQ3BFLE1BQU0sbUJBQW1CLEdBQUcsNEJBQTRCLENBQUM7SUFDekQsTUFBTSx1QkFBdUIsR0FBRywrQkFBK0IsQ0FBQztJQUVoRSx5RUFBeUU7SUFDNUQsUUFBQSxnQkFBZ0IsR0FBRywyQkFBYyxDQUFDLEdBQUcsQ0FDakQsd0NBQWtCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUNwQywyQkFBYyxDQUFDLEVBQUUsQ0FDaEIsMkJBQWMsQ0FBQyxPQUFPLENBQUMsMkNBQXFCLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUNwRCwyQkFBYyxDQUFDLE9BQU8sQ0FBQyxrREFBNEIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQzNELHVEQUFp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