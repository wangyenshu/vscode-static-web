/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/keyCodes", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/browser/widget/diffEditor/embeddedDiffEditorWidget", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/common/editorContextKeys", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/services/codeEditorService", "vs/base/common/date", "./inlineChatSessionService", "vs/workbench/contrib/chat/browser/actions/chatAccessibilityHelp", "vs/platform/accessibility/common/accessibility", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/platform/theme/common/iconRegistry", "vs/workbench/services/preferences/common/preferences", "vs/platform/log/common/log"], function (require, exports, codicons_1, keyCodes_1, editorBrowser_1, editorExtensions_1, embeddedDiffEditorWidget_1, embeddedCodeEditorWidget_1, editorContextKeys_1, inlineChatController_1, inlineChat_1, nls_1, actions_1, clipboardService_1, contextkey_1, instantiation_1, quickInput_1, editorService_1, codeEditorService_1, date_1, inlineChatSessionService_1, chatAccessibilityHelp_1, accessibility_1, lifecycle_1, commands_1, accessibleViewActions_1, iconRegistry_1, preferences_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineAccessibilityHelpContribution = exports.ViewInChatAction = exports.CopyRecordings = exports.MoveToPreviousHunk = exports.MoveToNextHunk = exports.ConfigureInlineChatAction = exports.CloseAction = exports.CancelSessionAction = exports.AcceptChanges = exports.ToggleDiffForChange = exports.DiscardUndoToNewFileAction = exports.DiscardToClipboardAction = exports.DiscardAction = exports.DiscardHunkAction = exports.FocusInlineChat = exports.ArrowOutDownAction = exports.ArrowOutUpAction = exports.AbstractInlineChatAction = exports.UnstashSessionAction = exports.StartSessionAction = exports.START_INLINE_CHAT = exports.LOCALIZED_START_INLINE_CHAT_STRING = void 0;
    exports.setHoldForSpeech = setHoldForSpeech;
    commands_1.CommandsRegistry.registerCommandAlias('interactiveEditor.start', 'inlineChat.start');
    commands_1.CommandsRegistry.registerCommandAlias('interactive.acceptChanges', inlineChat_1.ACTION_ACCEPT_CHANGES);
    exports.LOCALIZED_START_INLINE_CHAT_STRING = (0, nls_1.localize2)('run', 'Start in Editor');
    exports.START_INLINE_CHAT = (0, iconRegistry_1.registerIcon)('start-inline-chat', codicons_1.Codicon.sparkle, (0, nls_1.localize)('startInlineChat', 'Icon which spawns the inline chat from the editor toolbar.'));
    let _holdForSpeech = undefined;
    function setHoldForSpeech(holdForSpeech) {
        _holdForSpeech = holdForSpeech;
    }
    class StartSessionAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlineChat.start',
                title: exports.LOCALIZED_START_INLINE_CHAT_STRING,
                category: AbstractInlineChatAction.category,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, editorContextKeys_1.EditorContextKeys.writable),
                keybinding: {
                    when: editorContextKeys_1.EditorContextKeys.focus,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */,
                    secondary: [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 39 /* KeyCode.KeyI */)],
                },
                icon: exports.START_INLINE_CHAT
            });
        }
        runEditorCommand(accessor, editor, ..._args) {
            const ctrl = inlineChatController_1.InlineChatController.get(editor);
            if (!ctrl) {
                return;
            }
            if (_holdForSpeech) {
                accessor.get(instantiation_1.IInstantiationService).invokeFunction(_holdForSpeech, ctrl, this);
            }
            let options;
            const arg = _args[0];
            if (arg && inlineChatController_1.InlineChatRunOptions.isInteractiveEditorOptions(arg)) {
                options = arg;
            }
            inlineChatController_1.InlineChatController.get(editor)?.run({ ...options });
        }
    }
    exports.StartSessionAction = StartSessionAction;
    class UnstashSessionAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlineChat.unstash',
                title: (0, nls_1.localize2)('unstash', "Resume Last Dismissed Inline Chat"),
                category: AbstractInlineChatAction.category,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_HAS_STASHED_SESSION, editorContextKeys_1.EditorContextKeys.writable),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 56 /* KeyCode.KeyZ */,
                }
            });
        }
        async runEditorCommand(_accessor, editor, ..._args) {
            const ctrl = inlineChatController_1.InlineChatController.get(editor);
            if (ctrl) {
                const session = ctrl.unstashLastSession();
                if (session) {
                    ctrl.run({
                        existingSession: session,
                        isUnstashed: true
                    });
                }
            }
        }
    }
    exports.UnstashSessionAction = UnstashSessionAction;
    class AbstractInlineChatAction extends editorExtensions_1.EditorAction2 {
        static { this.category = (0, nls_1.localize2)('cat', "Inline Chat"); }
        constructor(desc) {
            super({
                ...desc,
                category: AbstractInlineChatAction.category,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, desc.precondition)
            });
        }
        runEditorCommand(accessor, editor, ..._args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const logService = accessor.get(log_1.ILogService);
            let ctrl = inlineChatController_1.InlineChatController.get(editor);
            if (!ctrl) {
                const { activeTextEditorControl } = editorService;
                if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                    editor = activeTextEditorControl;
                }
                else if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
                    editor = activeTextEditorControl.getModifiedEditor();
                }
                ctrl = inlineChatController_1.InlineChatController.get(editor);
            }
            if (!ctrl) {
                logService.warn('[IE] NO controller found for action', this.desc.id, editor.getModel()?.uri);
                return;
            }
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                editor = editor.getParentEditor();
            }
            if (!ctrl) {
                for (const diffEditor of accessor.get(codeEditorService_1.ICodeEditorService).listDiffEditors()) {
                    if (diffEditor.getOriginalEditor() === editor || diffEditor.getModifiedEditor() === editor) {
                        if (diffEditor instanceof embeddedDiffEditorWidget_1.EmbeddedDiffEditorWidget) {
                            this.runEditorCommand(accessor, diffEditor.getParentEditor(), ..._args);
                        }
                    }
                }
                return;
            }
            this.runInlineChatCommand(accessor, ctrl, editor, ..._args);
        }
    }
    exports.AbstractInlineChatAction = AbstractInlineChatAction;
    class ArrowOutUpAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.arrowOutUp',
                title: (0, nls_1.localize)('arrowUp', 'Cursor Up'),
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_INNER_CURSOR_FIRST, editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate(), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                keybinding: {
                    weight: 0 /* KeybindingWeight.EditorCore */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */
                }
            });
        }
        runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            ctrl.arrowOut(true);
        }
    }
    exports.ArrowOutUpAction = ArrowOutUpAction;
    class ArrowOutDownAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.arrowOutDown',
                title: (0, nls_1.localize)('arrowDown', 'Cursor Down'),
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_INNER_CURSOR_LAST, editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate(), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                keybinding: {
                    weight: 0 /* KeybindingWeight.EditorCore */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */
                }
            });
        }
        runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            ctrl.arrowOut(false);
        }
    }
    exports.ArrowOutDownAction = ArrowOutDownAction;
    class FocusInlineChat extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlineChat.focus',
                title: (0, nls_1.localize2)('focus', "Focus Input"),
                f1: true,
                category: AbstractInlineChatAction.category,
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_FOCUSED.negate(), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                keybinding: [{
                        weight: 0 /* KeybindingWeight.EditorCore */ + 10, // win against core_command
                        when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_OUTER_CURSOR_POSITION.isEqualTo('above'), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                    }, {
                        weight: 0 /* KeybindingWeight.EditorCore */ + 10, // win against core_command
                        when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_OUTER_CURSOR_POSITION.isEqualTo('below'), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                    }]
            });
        }
        runEditorCommand(_accessor, editor, ..._args) {
            inlineChatController_1.InlineChatController.get(editor)?.focus();
        }
    }
    exports.FocusInlineChat = FocusInlineChat;
    class DiscardHunkAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.discardHunkChange',
                title: (0, nls_1.localize)('discard', 'Discard'),
                icon: codicons_1.Codicon.clearAll,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                    when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("onlyMessages" /* InlineChatResponseTypes.OnlyMessages */), inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("empty" /* InlineChatResponseTypes.Empty */), inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.isEqualTo("live" /* EditMode.Live */)),
                    group: '0_main',
                    order: 3
                }
            });
        }
        async runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            return ctrl.discardHunk();
        }
    }
    exports.DiscardHunkAction = DiscardHunkAction;
    actions_1.MenuRegistry.appendMenuItem(inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS, {
        submenu: inlineChat_1.MENU_INLINE_CHAT_WIDGET_DISCARD,
        title: (0, nls_1.localize)('discardMenu', "Discard..."),
        icon: codicons_1.Codicon.discard,
        group: '0_main',
        order: 2,
        when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.notEqualsTo("preview" /* EditMode.Preview */), inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.notEqualsTo("live" /* EditMode.Live */), inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("onlyMessages" /* InlineChatResponseTypes.OnlyMessages */)),
        rememberDefaultAction: true
    });
    class DiscardAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.discard',
                title: (0, nls_1.localize)('discard', 'Discard'),
                icon: codicons_1.Codicon.discard,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 1,
                    primary: 9 /* KeyCode.Escape */,
                    when: inlineChat_1.CTX_INLINE_CHAT_USER_DID_EDIT.negate()
                },
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_DISCARD,
                    group: '0_main',
                    order: 0
                }
            });
        }
        async runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            await ctrl.cancelSession();
        }
    }
    exports.DiscardAction = DiscardAction;
    class DiscardToClipboardAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.discardToClipboard',
                title: (0, nls_1.localize)('undo.clipboard', 'Discard to Clipboard'),
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_DID_EDIT),
                // keybinding: {
                // 	weight: KeybindingWeight.EditorContrib + 10,
                // 	primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ,
                // 	mac: { primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyZ },
                // },
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_DISCARD,
                    group: '0_main',
                    order: 1
                }
            });
        }
        async runInlineChatCommand(accessor, ctrl) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const changedText = await ctrl.cancelSession();
            if (changedText !== undefined) {
                clipboardService.writeText(changedText);
            }
        }
    }
    exports.DiscardToClipboardAction = DiscardToClipboardAction;
    class DiscardUndoToNewFileAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.discardToFile',
                title: (0, nls_1.localize)('undo.newfile', 'Discard to New File'),
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_DID_EDIT),
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_DISCARD,
                    group: '0_main',
                    order: 2
                }
            });
        }
        async runInlineChatCommand(accessor, ctrl, editor, ..._args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const changedText = await ctrl.cancelSession();
            if (changedText !== undefined) {
                const input = { forceUntitled: true, resource: undefined, contents: changedText, languageId: editor.getModel()?.getLanguageId() };
                editorService.openEditor(input, editorService_1.SIDE_GROUP);
            }
        }
    }
    exports.DiscardUndoToNewFileAction = DiscardUndoToNewFileAction;
    class ToggleDiffForChange extends AbstractInlineChatAction {
        constructor() {
            super({
                id: inlineChat_1.ACTION_TOGGLE_DIFF,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.isEqualTo("live" /* EditMode.Live */), inlineChat_1.CTX_INLINE_CHAT_CHANGE_HAS_DIFF),
                title: (0, nls_1.localize2)('showChanges', 'Toggle Changes'),
                icon: codicons_1.Codicon.diffSingle,
                toggled: {
                    condition: inlineChat_1.CTX_INLINE_CHAT_CHANGE_SHOWS_DIFF,
                },
                menu: [
                    {
                        id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                        group: '1_main',
                        when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.isEqualTo("live" /* EditMode.Live */), inlineChat_1.CTX_INLINE_CHAT_CHANGE_HAS_DIFF)
                    }
                ]
            });
        }
        runInlineChatCommand(accessor, ctrl) {
            ctrl.toggleDiff();
        }
    }
    exports.ToggleDiffForChange = ToggleDiffForChange;
    class AcceptChanges extends AbstractInlineChatAction {
        constructor() {
            super({
                id: inlineChat_1.ACTION_ACCEPT_CHANGES,
                title: (0, nls_1.localize2)('apply1', "Accept Changes"),
                shortTitle: (0, nls_1.localize)('apply2', 'Accept'),
                icon: codicons_1.Codicon.check,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, contextkey_1.ContextKeyExpr.or(inlineChat_1.CTX_INLINE_CHAT_DOCUMENT_CHANGED.toNegated(), inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.notEqualsTo("preview" /* EditMode.Preview */))),
                keybinding: [{
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    }],
                menu: {
                    when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("onlyMessages" /* InlineChatResponseTypes.OnlyMessages */), inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("empty" /* InlineChatResponseTypes.Empty */)),
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                    group: '0_main',
                    order: 0
                }
            });
        }
        async runInlineChatCommand(_accessor, ctrl) {
            ctrl.acceptHunk();
        }
    }
    exports.AcceptChanges = AcceptChanges;
    class CancelSessionAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.cancel',
                title: (0, nls_1.localize)('cancel', 'Cancel'),
                icon: codicons_1.Codicon.clearAll,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.isEqualTo("preview" /* EditMode.Preview */)),
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 1,
                    primary: 9 /* KeyCode.Escape */
                },
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                    when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.isEqualTo("preview" /* EditMode.Preview */), inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("empty" /* InlineChatResponseTypes.Empty */)),
                    group: '0_main',
                    order: 3
                }
            });
        }
        async runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            ctrl.cancelSession();
        }
    }
    exports.CancelSessionAction = CancelSessionAction;
    class CloseAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.close',
                title: (0, nls_1.localize)('close', 'Close'),
                icon: codicons_1.Codicon.close,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 1,
                    primary: 9 /* KeyCode.Escape */,
                    when: inlineChat_1.CTX_INLINE_CHAT_USER_DID_EDIT.negate()
                },
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET,
                    group: 'navigation',
                    order: 10,
                }
            });
        }
        async runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            ctrl.cancelSession();
        }
    }
    exports.CloseAction = CloseAction;
    class ConfigureInlineChatAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.configure',
                title: (0, nls_1.localize)('configure', 'Configure '),
                icon: codicons_1.Codicon.settingsGear,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET,
                    group: 'config',
                    order: 1,
                }
            });
        }
        async runInlineChatCommand(accessor, ctrl, _editor, ..._args) {
            accessor.get(preferences_1.IPreferencesService).openSettings({ query: 'inlineChat' });
        }
    }
    exports.ConfigureInlineChatAction = ConfigureInlineChatAction;
    class MoveToNextHunk extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.moveToNextHunk',
                title: (0, nls_1.localize2)('moveToNextHunk', 'Move to Next Change'),
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 65 /* KeyCode.F7 */
                }
            });
        }
        runInlineChatCommand(accessor, ctrl, editor, ...args) {
            ctrl.moveHunk(true);
        }
    }
    exports.MoveToNextHunk = MoveToNextHunk;
    class MoveToPreviousHunk extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.moveToPreviousHunk',
                title: (0, nls_1.localize2)('moveToPreviousHunk', 'Move to Previous Change'),
                f1: true,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ | 65 /* KeyCode.F7 */
                }
            });
        }
        runInlineChatCommand(accessor, ctrl, editor, ...args) {
            ctrl.moveHunk(false);
        }
    }
    exports.MoveToPreviousHunk = MoveToPreviousHunk;
    class CopyRecordings extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.copyRecordings',
                f1: true,
                title: (0, nls_1.localize2)('copyRecordings', "(Developer) Write Exchange to Clipboard")
            });
        }
        async runInlineChatCommand(accessor) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const quickPickService = accessor.get(quickInput_1.IQuickInputService);
            const ieSessionService = accessor.get(inlineChatSessionService_1.IInlineChatSessionService);
            const recordings = ieSessionService.recordings().filter(r => r.exchanges.length > 0);
            if (recordings.length === 0) {
                return;
            }
            const picks = recordings.map(rec => {
                return {
                    rec,
                    label: (0, nls_1.localize)('label', "'{0}' and {1} follow ups ({2})", rec.exchanges[0].prompt, rec.exchanges.length - 1, (0, date_1.fromNow)(rec.when, true)),
                    tooltip: rec.exchanges.map(ex => ex.prompt).join('\n'),
                };
            });
            const pick = await quickPickService.pick(picks, { canPickMany: false });
            if (pick) {
                clipboardService.writeText(JSON.stringify(pick.rec, undefined, 2));
            }
        }
    }
    exports.CopyRecordings = CopyRecordings;
    class ViewInChatAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: inlineChat_1.ACTION_VIEW_IN_CHAT,
                title: (0, nls_1.localize)('viewInChat', 'View in Chat'),
                icon: codicons_1.Codicon.commentDiscussion,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                    when: inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.isEqualTo("onlyMessages" /* InlineChatResponseTypes.OnlyMessages */),
                    group: '0_main',
                    order: 1
                }
            });
        }
        runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            ctrl.viewInChat();
        }
    }
    exports.ViewInChatAction = ViewInChatAction;
    class InlineAccessibilityHelpContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(106, 'inlineChat', async (accessor) => {
                const codeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getActiveCodeEditor() || accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
                if (!codeEditor) {
                    return;
                }
                (0, chatAccessibilityHelp_1.runAccessibilityHelpAction)(accessor, codeEditor, 'inlineChat');
            }, contextkey_1.ContextKeyExpr.or(inlineChat_1.CTX_INLINE_CHAT_RESPONSE_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED)));
        }
    }
    exports.InlineAccessibilityHelpContribution = InlineAccessibilityHelpContribution;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2Jyb3dzZXIvaW5saW5lQ2hhdEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNENoRyw0Q0FFQztJQWRELDJCQUFnQixDQUFDLG9CQUFvQixDQUFDLHlCQUF5QixFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDckYsMkJBQWdCLENBQUMsb0JBQW9CLENBQUMsMkJBQTJCLEVBQUUsa0NBQXFCLENBQUMsQ0FBQztJQUU3RSxRQUFBLGtDQUFrQyxHQUFHLElBQUEsZUFBUyxFQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQ3pFLFFBQUEsaUJBQWlCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLG1CQUFtQixFQUFFLGtCQUFPLENBQUMsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLDREQUE0RCxDQUFDLENBQUMsQ0FBQztJQU8vSyxJQUFJLGNBQWMsR0FBK0IsU0FBUyxDQUFDO0lBQzNELFNBQWdCLGdCQUFnQixDQUFDLGFBQTZCO1FBQzdELGNBQWMsR0FBRyxhQUFhLENBQUM7SUFDaEMsQ0FBQztJQUVELE1BQWEsa0JBQW1CLFNBQVEsZ0NBQWE7UUFFcEQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGtCQUFrQjtnQkFDdEIsS0FBSyxFQUFFLDBDQUFrQztnQkFDekMsUUFBUSxFQUFFLHdCQUF3QixDQUFDLFFBQVE7Z0JBQzNDLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFlBQVksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyx5Q0FBNEIsRUFBRSxxQ0FBaUIsQ0FBQyxRQUFRLENBQUM7Z0JBQzFGLFVBQVUsRUFBRTtvQkFDWCxJQUFJ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