/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatContext"], function (require, exports, codicons_1, language_1, nls_1, actions_1, contextkey_1, contextkeys_1, cellOperations_1, coreActions_1, notebookContextKeys_1, notebookCommon_1, notebookChatContext_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InsertCellCommand = void 0;
    exports.insertNewCell = insertNewCell;
    const INSERT_CODE_CELL_ABOVE_COMMAND_ID = 'notebook.cell.insertCodeCellAbove';
    const INSERT_CODE_CELL_BELOW_COMMAND_ID = 'notebook.cell.insertCodeCellBelow';
    const INSERT_CODE_CELL_ABOVE_AND_FOCUS_CONTAINER_COMMAND_ID = 'notebook.cell.insertCodeCellAboveAndFocusContainer';
    const INSERT_CODE_CELL_BELOW_AND_FOCUS_CONTAINER_COMMAND_ID = 'notebook.cell.insertCodeCellBelowAndFocusContainer';
    const INSERT_CODE_CELL_AT_TOP_COMMAND_ID = 'notebook.cell.insertCodeCellAtTop';
    const INSERT_MARKDOWN_CELL_ABOVE_COMMAND_ID = 'notebook.cell.insertMarkdownCellAbove';
    const INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID = 'notebook.cell.insertMarkdownCellBelow';
    const INSERT_MARKDOWN_CELL_AT_TOP_COMMAND_ID = 'notebook.cell.insertMarkdownCellAtTop';
    function insertNewCell(accessor, context, kind, direction, focusEditor) {
        let newCell = null;
        if (context.ui) {
            context.notebookEditor.focus();
        }
        const languageService = accessor.get(language_1.ILanguageService);
        if (context.cell) {
            const idx = context.notebookEditor.getCellIndex(context.cell);
            newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, kind, direction, undefined, true);
        }
        else {
            const focusRange = context.notebookEditor.getFocus();
            const next = Math.max(focusRange.end - 1, 0);
            newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, next, kind, direction, undefined, true);
        }
        return newCell;
    }
    class InsertCellCommand extends coreActions_1.NotebookAction {
        constructor(desc, kind, direction, focusEditor) {
            super(desc);
            this.kind = kind;
            this.direction = direction;
            this.focusEditor = focusEditor;
        }
        async runWithContext(accessor, context) {
            const newCell = await insertNewCell(accessor, context, this.kind, this.direction, this.focusEditor);
            if (newCell) {
                await context.notebookEditor.focusNotebookCell(newCell, this.focusEditor ? 'editor' : 'container');
            }
        }
    }
    exports.InsertCellCommand = InsertCellCommand;
    (0, actions_1.registerAction2)(class InsertCodeCellAboveAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_ABOVE_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellAbove', "Insert Code Cell Above"),
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 0
                }
            }, notebookCommon_1.CellKind.Code, 'above', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellAboveAndFocusContainerAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_ABOVE_AND_FOCUS_CONTAINER_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellAboveAndFocusContainer', "Insert Code Cell Above and Focus Container")
            }, notebookCommon_1.CellKind.Code, 'above', false);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellBelowAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellBelow', "Insert Code Cell Below"),
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkeys_1.InputFocusedContext.toNegated(), notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.isEqualTo('')),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 1
                }
            }, notebookCommon_1.CellKind.Code, 'below', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellBelowAndFocusContainerAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_BELOW_AND_FOCUS_CONTAINER_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellBelowAndFocusContainer', "Insert Code Cell Below and Focus Container"),
            }, notebookCommon_1.CellKind.Code, 'below', false);
        }
    });
    (0, actions_1.registerAction2)(class InsertMarkdownCellAboveAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_ABOVE_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertMarkdownCellAbove', "Insert Markdown Cell Above"),
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 2
                }
            }, notebookCommon_1.CellKind.Markup, 'above', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertMarkdownCellBelowAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertMarkdownCellBelow', "Insert Markdown Cell Below"),
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 3
                }
            }, notebookCommon_1.CellKind.Markup, 'below', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellAtTopAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: INSERT_CODE_CELL_AT_TOP_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellAtTop', "Add Code Cell At Top"),
                f1: false
            });
        }
        async run(accessor, context) {
            context = context ?? this.getEditorContextFromArgsOrActive(accessor);
            if (context) {
                this.runWithContext(accessor, context);
            }
        }
        async runWithContext(accessor, context) {
            const languageService = accessor.get(language_1.ILanguageService);
            const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, 0, notebookCommon_1.CellKind.Code, 'above', undefined, true);
            if (newCell) {
                await context.notebookEditor.focusNotebookCell(newCell, 'editor');
            }
        }
    });
    (0, actions_1.registerAction2)(class InsertMarkdownCellAtTopAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_AT_TOP_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertMarkdownCellAtTop', "Add Markdown Cell At Top"),
                f1: false
            });
        }
        async run(accessor, context) {
            context = context ?? this.getEditorContextFromArgsOrActive(accessor);
            if (context) {
                this.runWithContext(accessor, context);
            }
        }
        async runWithContext(accessor, context) {
            const languageService = accessor.get(language_1.ILanguageService);
            const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, 0, notebookCommon_1.CellKind.Markup, 'above', undefined, true);
            if (newCell) {
                await context.notebookEditor.focusNotebookCell(newCell, 'editor');
            }
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellBetween, {
        command: {
            id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
            title: '$(add) ' + (0, nls_1.localize)('notebookActions.menu.insertCode', "Code"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellBetween, {
        command: {
            id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode.minimalToolbar', "Add Code"),
            icon: codicons_1.Codicon.add,
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.equals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookToolbar, {
        command: {
            id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
            icon: codicons_1.Codicon.add,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode.ontoolbar', "Code"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: -5,
        group: 'navigation/add',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'betweenCells'), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'hidden'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellListTop, {
        command: {
            id: INSERT_CODE_CELL_AT_TOP_COMMAND_ID,
            title: '$(add) ' + (0, nls_1.localize)('notebookActions.menu.insertCode', "Code"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellListTop, {
        command: {
            id: INSERT_CODE_CELL_AT_TOP_COMMAND_ID,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode.minimaltoolbar', "Add Code"),
            icon: codicons_1.Codicon.add,
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.equals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellBetween, {
        command: {
            id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
            title: '$(add) ' + (0, nls_1.localize)('notebookActions.menu.insertMarkdown', "Markdown"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.tooltip', "Add Markdown Cell")
        },
        order: 1,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookToolbar, {
        command: {
            id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
            icon: codicons_1.Codicon.add,
            title: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.ontoolbar', "Markdown"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.tooltip', "Add Markdown Cell")
        },
        order: -5,
        group: 'navigation/add',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'betweenCells'), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'hidden'), contextkey_1.ContextKeyExpr.notEquals(`config.${notebookCommon_1.NotebookSetting.globalToolbarShowLabel}`, false), contextkey_1.ContextKeyExpr.notEquals(`config.${notebookCommon_1.NotebookSetting.globalToolbarShowLabel}`, 'never'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellListTop, {
        command: {
            id: INSERT_MARKDOWN_CELL_AT_TOP_COMMAND_ID,
            title: '$(add) ' + (0, nls_1.localize)('notebookActions.menu.insertMarkdown', "Markdown"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.tooltip', "Add Markdown Cell")
        },
        order: 1,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zZXJ0Q2VsbEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyb2xsZXIvaW5zZXJ0Q2VsbEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkJoRyxzQ0FpQkM7SUExQkQsTUFBTSxpQ0FBaUMsR0FBRyxtQ0FBbUMsQ0FBQztJQUM5RSxNQUFNLGlDQUFpQyxHQUFHLG1DQUFtQyxDQUFDO0lBQzlFLE1BQU0scURBQXFELEdBQUcsb0RBQW9ELENBQUM7SUFDbkgsTUFBTSxxREFBcUQsR0FBRyxvREFBb0QsQ0FBQztJQUNuSCxNQUFNLGtDQUFrQyxHQUFHLG1DQUFtQyxDQUFDO0lBQy9FLE1BQU0scUNBQXFDLEdBQUcsdUNBQXVDLENBQUM7SUFDdEYsTUFBTSxxQ0FBcUMsR0FBRyx1Q0FBdUMsQ0FBQztJQUN0RixNQUFNLHNDQUFzQyxHQUFHLHVDQUF1QyxDQUFDO0lBRXZGLFNBQWdCLGFBQWEsQ0FBQyxRQUEwQixFQUFFLE9BQStCLEVBQUUsSUFBYyxFQUFFLFNBQTRCLEVBQUUsV0FBb0I7UUFDNUosSUFBSSxPQUFPLEdBQXlCLElBQUksQ0FBQztRQUN6QyxJQUFJLE9BQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNoQixPQUFPLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFFRCxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7UUFDdkQsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEIsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lB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