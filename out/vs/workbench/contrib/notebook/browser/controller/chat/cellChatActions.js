/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/keyCodes", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatContext", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatController", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/controller/insertCellActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys"], function (require, exports, codicons_1, keyCodes_1, editorContextKeys_1, nls_1, accessibility_1, actions_1, commands_1, configuration_1, contextkey_1, contextkeys_1, inlineChat_1, notebookChatContext_1, notebookChatController_1, coreActions_1, insertCellActions_1, notebookBrowser_1, notebookCommon_1, notebookContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.accept',
                title: (0, nls_1.localize2)('notebook.cell.chat.accept', "Make Request"),
                icon: codicons_1.Codicon.send,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 3 /* KeyCode.Enter */
                },
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_INPUT,
                    group: 'navigation',
                    order: 1,
                    when: notebookChatContext_1.CTX_NOTEBOOK_CHAT_HAS_ACTIVE_REQUEST.negate()
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.acceptInput();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.arrowOutUp',
                title: (0, nls_1.localize)('arrowUp', 'Cursor Up'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_INNER_CURSOR_FIRST, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate(), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 7,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            const idx = editor.getCellIndex(activeCell);
            if (typeof idx !== 'number') {
                return;
            }
            if (idx < 1 || editor.getLength() === 0) {
                // we don't do loop
                return;
            }
            const newCell = editor.cellAt(idx - 1);
            const newFocusMode = newCell.cellKind === notebookCommon_1.CellKind.Markup && newCell.getEditState() === notebookBrowser_1.CellEditState.Preview ? 'container' : 'editor';
            const focusEditorLine = newCell.textBuffer.getLineCount();
            await editor.focusNotebookCell(newCell, newFocusMode, { focusEditorLine: focusEditorLine });
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.arrowOutDown',
                title: (0, nls_1.localize)('arrowDown', 'Cursor Down'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_INNER_CURSOR_LAST, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate(), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 7,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            await notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focusNext();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: 'notebook.cell.focusChatWidget',
                title: (0, nls_1.localize)('focusChatWidget', 'Focus Chat Widget'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate(), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('bottom'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none')), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 7,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            const index = context.notebookEditor.getCellIndex(context.cell);
            await notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focusNearestWidget(index, 'above');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: 'notebook.cell.focusNextChatWidget',
                title: (0, nls_1.localize)('focusNextChatWidget', 'Focus Next Cell Chat Widget'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate(), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('top'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none')), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 7,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            const index = context.notebookEditor.getCellIndex(context.cell);
            await notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focusNearestWidget(index, 'below');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.stop',
                title: (0, nls_1.localize2)('notebook.cell.chat.stop', "Stop Request"),
                icon: codicons_1.Codicon.debugStop,
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_INPUT,
                    group: 'navigation',
                    order: 1,
                    when: notebookChatContext_1.CTX_NOTEBOOK_CHAT_HAS_ACTIVE_REQUEST
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.cancelCurrentRequest(false);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.close',
                title: (0, nls_1.localize2)('notebook.cell.chat.close', "Close Chat"),
                icon: codicons_1.Codicon.close,
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET,
                    group: 'navigation',
                    order: 2
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.dismiss(false);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.acceptChanges',
                title: (0, nls_1.localize2)('apply1', "Accept Changes"),
                shortTitle: (0, nls_1.localize)('apply2', 'Accept'),
                icon: codicons_1.Codicon.check,
                tooltip: (0, nls_1.localize)('apply3', 'Accept Changes'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate()),
                        weight: 100 /* KeybindingWeight.EditorContrib */ + 10,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, notebookChatContext_1.CTX_NOTEBOOK_CHAT_USER_DID_EDIT, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate()),
                        weight: 0 /* KeybindingWeight.EditorCore */ + 10,
                        primary: 9 /* KeyCode.Escape */
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate(), notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.isEqualTo('below')),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                ],
                menu: [
                    {
                        id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_STATUS,
                        group: 'inline',
                        order: 0,
                        when: inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("onlyMessages" /* InlineChatResponseTypes.OnlyMessages */),
                    }
                ],
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.acceptSession();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.discard',
                title: (0, nls_1.localize)('discard', 'Discard'),
                icon: codicons_1.Codicon.discard,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, notebookChatContext_1.CTX_NOTEBOOK_CHAT_USER_DID_EDIT.negate(), notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate()),
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */
                },
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_STATUS,
                    group: 'main',
                    order: 1
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.discard();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.feedbackHelpful',
                title: (0, nls_1.localize)('feedback.helpful', 'Helpful'),
                icon: codicons_1.Codicon.thumbsup,
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_FEEDBACK,
                    group: 'inline',
                    order: 1,
                    when: inlineChat_1.CTX_INLINE_CHAT_LAST_RESPONSE_TYPE.notEqualsTo(undefined),
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.feedbackLast(1 /* InlineChatResponseFeedbackKind.Helpful */);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.feedbackUnhelpful',
                title: (0, nls_1.localize)('feedback.unhelpful', 'Unhelpful'),
                icon: codicons_1.Codicon.thumbsdown,
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_FEEDBACK,
                    group: 'inline',
                    order: 2,
                    when: inlineChat_1.CTX_INLINE_CHAT_LAST_RESPONSE_TYPE.notEqualsTo(undefined),
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.feedbackLast(0 /* InlineChatResponseFeedbackKind.Unhelpful */);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.reportIssueForBug',
                title: (0, nls_1.localize)('feedback.reportIssueForBug', 'Report Issue'),
                icon: codicons_1.Codicon.report,
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_FEEDBACK,
                    group: 'inline',
                    order: 3,
                    when: inlineChat_1.CTX_INLINE_CHAT_LAST_RESPONSE_TYPE.notEqualsTo(undefined),
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.feedbackLast(4 /* InlineChatResponseFeedbackKind.Bug */);
        }
    });
    async function startChat(accessor, context, index, input, autoSend, source) {
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const commandService = accessor.get(commands_1.ICommandService);
        if (configurationService.getValue(notebookCommon_1.NotebookSetting.cellChat)) {
            context.notebookEditor.focusContainer();
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.run(index, input, autoSend);
        }
        else if (configurationService.getValue(notebookCommon_1.NotebookSetting.cellGenerate)) {
            const activeCell = context.notebookEditor.getActiveCell();
            const targetCell = activeCell?.getTextLength() === 0 && source !== 'insertToolbar' ? activeCell : (await (0, insertCellActions_1.insertNewCell)(accessor, context, notebookCommon_1.CellKind.Code, 'below', true));
            if (targetCell) {
                targetCell.enableAutoLanguageDetection();
                await context.notebookEditor.revealFirstLineIfOutsideViewport(targetCell);
                const codeEditor = context.notebookEditor.codeEditors.find(ce => ce[0] === targetCell)?.[1];
                if (codeEditor) {
                    codeEditor.focus();
                    commandService.executeCommand('inlineChat.start');
                }
            }
        }
    }
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.start',
                title: {
                    value: '$(sparkle) ' + (0, nls_1.localize)('notebookActions.menu.insertCodeCellWithChat', "Generate"),
                    original: '$(sparkle) Generate',
                },
                tooltip: (0, nls_1.localize)('notebookActions.menu.insertCodeCellWithChat.tooltip', "Start Chat to Generate Code"),
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.menu.insertCodeCellWithChat.tooltip', "Start Chat to Generate Code"),
                    args: [
                        {
                            name: 'args',
                            schema: {
                                type: 'object',
                                required: ['index'],
                                properties: {
                                    'index': {
                                        type: 'number'
                                    },
                                    'input': {
                                        type: 'string'
                                    },
                                    'autoSend': {
                                        type: 'boolean'
                                    }
                                }
                            }
                        }
                    ]
                },
                f1: false,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellChat}`, true), contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellGenerate}`, true))),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */,
                    secondary: [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 39 /* KeyCode.KeyI */)],
                },
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellBetween,
                        group: 'inline',
                        order: -1,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellChat}`, true), contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellGenerate}`, true)))
                    }
                ]
            });
        }
        getEditorContextFromArgsOrActive(accessor, ...args) {
            const [firstArg] = args;
            if (!firstArg) {
                const notebookEditor = (0, coreActions_1.getEditorFromArgsOrActivePane)(accessor);
                if (!notebookEditor) {
                    return undefined;
                }
                const activeCell = notebookEditor.getActiveCell();
                if (!activeCell) {
                    return undefined;
                }
                return {
                    cell: activeCell,
                    notebookEditor,
                    input: undefined,
                    autoSend: undefined
                };
            }
            if (typeof firstArg !== 'object' || typeof firstArg.index !== 'number') {
                return undefined;
            }
            const notebookEditor = (0, coreActions_1.getEditorFromArgsOrActivePane)(accessor);
            if (!notebookEditor) {
                return undefined;
            }
            const cell = firstArg.index <= 0 ? undefined : notebookEditor.cellAt(firstArg.index - 1);
            return {
                cell,
                notebookEditor,
                input: firstArg.input,
                autoSend: firstArg.autoSend
            };
        }
        async runWithContext(accessor, context) {
            const index = Math.max(0, context.cell ? context.notebookEditor.getCellIndex(context.cell) + 1 : 0);
            await startChat(accessor, context, index, context.input, context.autoSend, context.source);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.startAtTop',
                title: {
                    value: '$(sparkle) ' + (0, nls_1.localize)('notebookActions.menu.insertCodeCellWithChat', "Generate"),
                    original: '$(sparkle) Generate',
                },
                tooltip: (0, nls_1.localize)('notebookActions.menu.insertCodeCellWithChat.tooltip', "Start Chat to Generate Code"),
                f1: false,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellListTop,
                        group: 'inline',
                        order: -1,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellChat}`, true), contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellGenerate}`, true)))
                    },
                ]
            });
        }
        async runWithContext(accessor, context) {
            await startChat(accessor, context, 0, '', false);
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookToolbar, {
        command: {
            id: 'notebook.cell.chat.start',
            icon: codicons_1.Codicon.sparkle,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode.ontoolbar', "Generate"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Start Chat to Generate Code")
        },
        order: -10,
        group: 'navigation/add',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'betweenCells'), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'hidden'), inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellChat}`, true), contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellGenerate}`, true)))
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.focus',
                title: (0, nls_1.localize)('focusNotebookChat', 'Focus Chat'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.isEqualTo('above')),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.isEqualTo('below')),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                ],
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focus();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.focusNextCell',
                title: (0, nls_1.localize)('focusNextCell', 'Focus Next Cell'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                ],
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focusNext();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.focusPreviousCell',
                title: (0, nls_1.localize)('focusPreviousCell', 'Focus Previous Cell'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                ],
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focusAbove();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.previousFromHistory',
                title: (0, nls_1.localize2)('notebook.cell.chat.previousFromHistory', "Previous From History"),
                precondition: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 10,
                    primary: 16 /* KeyCode.UpArrow */,
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.populateHistory(true);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.nextFromHistory',
                title: (0, nls_1.localize2)('notebook.cell.chat.nextFromHistory', "Next From History"),
                precondition: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 10,
                    primary: 18 /* KeyCode.DownArrow */
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.populateHistory(false);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.restore',
                title: (0, nls_1.localize2)('notebookActions.restoreCellprompt', "Generate"),
                icon: codicons_1.Codicon.sparkle,
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    group: coreActions_1.CELL_TITLE_CELL_GROUP_ID,
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, notebookContextKeys_1.NOTEBOOK_CELL_GENERATED_BY_CHAT, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellChat}`, true))
                },
                f1: false
            });
        }
        async runWithContext(accessor, context) {
            const cell = context.cell;
            if (!cell) {
                return;
            }
            const notebookEditor = context.notebookEditor;
            const controller = notebookChatController_1.NotebookChatController.get(notebookEditor);
            if (!controller) {
                return;
            }
            const prompt = controller.getPromptFromCache(cell);
            if (prompt) {
                controller.restore(cell, prompt);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbENoYXRBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cm9sbGVyL2NoYXQvY2VsbENoYXRBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBd0JoRyxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLDRCQUFjO1FBQzNDO1lBQ0MsS0FBSyxDQUNKO2dCQUNDLEVBQUUsRUFBRSwyQkFBMkI7Z0JBQy9CLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQywyQkFBMkIsRUFBRSxjQUFjLENBQUM7Z0JBQzdELElBQUksRUFBRSxrQkFBTyxDQUFDLElBQUk7Z0JBQ2xCLFVBQVUsRUFBRTtvQkFDWCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsb0RBQThCLEVBQUUsb0NBQXVCLEVBQUUsa0RBQTRCLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3hILE1BQU0sNkNBQW1DO29CQUN6QyxPQUFPLHVCQUFlO2lCQUN0QjtnQkFDRCxJQUFJLEVBQUU7b0JBQ0wsRUFBRSxFQUFFLDBDQUFvQjtvQkFDeEIsS0FBSyxFQUFFLFlBQVk7b0JBQ25CLEtBQUssRUFBRSxDQUFDO29CQUNSLElBQUksRUFBRSwwREFBb0MsQ0FBQyxNQUFNLEVBQUU7aUJBQ25EO2dCQUNELEVBQUUsRUFBRSxLQUFLO2FBQ1QsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBMEIsRUFBRSxPQUErQjtZQUMvRSwrQ0FBc0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ25FLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxT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