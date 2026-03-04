/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/hierarchicalKind", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/codeAction/browser/codeAction", "vs/nls", "vs/platform/contextkey/common/contextkey", "../common/types", "./codeActionController", "./codeActionModel"], function (require, exports, hierarchicalKind_1, strings_1, editorExtensions_1, editorContextKeys_1, codeAction_1, nls, contextkey_1, types_1, codeActionController_1, codeActionModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AutoFixAction = exports.FixAllAction = exports.OrganizeImportsAction = exports.SourceAction = exports.RefactorAction = exports.CodeActionCommand = exports.QuickFixAction = void 0;
    function contextKeyForSupportedActions(kind) {
        return contextkey_1.ContextKeyExpr.regex(codeActionModel_1.SUPPORTED_CODE_ACTIONS.keys()[0], new RegExp('(\\s|^)' + (0, strings_1.escapeRegExpCharacters)(kind.value) + '\\b'));
    }
    const argsSchema = {
        type: 'object',
        defaultSnippets: [{ body: { kind: '' } }],
        properties: {
            'kind': {
                type: 'string',
                description: nls.localize('args.schema.kind', "Kind of the code action to run."),
            },
            'apply': {
                type: 'string',
                description: nls.localize('args.schema.apply', "Controls when the returned actions are applied."),
                default: "ifSingle" /* CodeActionAutoApply.IfSingle */,
                enum: ["first" /* CodeActionAutoApply.First */, "ifSingle" /* CodeActionAutoApply.IfSingle */, "never" /* CodeActionAutoApply.Never */],
                enumDescriptions: [
                    nls.localize('args.schema.apply.first', "Always apply the first returned code action."),
                    nls.localize('args.schema.apply.ifSingle', "Apply the first returned code action if it is the only one."),
                    nls.localize('args.schema.apply.never', "Do not apply the returned code actions."),
                ]
            },
            'preferred': {
                type: 'boolean',
                default: false,
                description: nls.localize('args.schema.preferred', "Controls if only preferred code actions should be returned."),
            }
        }
    };
    function triggerCodeActionsForEditorSelection(editor, notAvailableMessage, filter, autoApply, triggerAction = types_1.CodeActionTriggerSource.Default) {
        if (editor.hasModel()) {
            const controller = codeActionController_1.CodeActionController.get(editor);
            controller?.manualTriggerAtCurrentPosition(notAvailableMessage, triggerAction, filter, autoApply);
        }
    }
    class QuickFixAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.quickFixCommandId,
                label: nls.localize('quickfix.trigger.label', "Quick Fix..."),
                alias: 'Quick Fix...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.quickFix.noneMessage', "No code actions available"), undefined, undefined, types_1.CodeActionTriggerSource.QuickFix);
        }
    }
    exports.QuickFixAction = QuickFixAction;
    class CodeActionCommand extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: codeAction_1.codeActionCommandId,
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                metadata: {
                    description: 'Trigger a code action',
                    args: [{ name: 'args', schema: argsSchema, }]
                }
            });
        }
        runEditorCommand(_accessor, editor, userArgs) {
            const args = types_1.CodeActionCommandArgs.fromUser(userArgs, {
                kind: hierarchicalKind_1.HierarchicalKind.Empty,
                apply: "ifSingle" /* CodeActionAutoApply.IfSingle */,
            });
            return triggerCodeActionsForEditorSelection(editor, typeof userArgs?.kind === 'string'
                ? args.preferred
                    ? nls.localize('editor.action.codeAction.noneMessage.preferred.kind', "No preferred code actions for '{0}' available", userArgs.kind)
                    : nls.localize('editor.action.codeAction.noneMessage.kind', "No code actions for '{0}' available", userArgs.kind)
                : args.preferred
                    ? nls.localize('editor.action.codeAction.noneMessage.preferred', "No preferred code actions available")
                    : nls.localize('editor.action.codeAction.noneMessage', "No code actions available"), {
                include: args.kind,
                includeSourceActions: true,
                onlyIncludePreferredActions: args.preferred,
            }, args.apply);
        }
    }
    exports.CodeActionCommand = CodeActionCommand;
    class RefactorAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.refactorCommandId,
                label: nls.localize('refactor.label', "Refactor..."),
                alias: 'Refactor...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: '1_modification',
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.Refactor)),
                },
                metadata: {
                    description: 'Refactor...',
                    args: [{ name: 'args', schema: argsSchema }]
                }
            });
        }
        run(_accessor, editor, userArgs) {
            const args = types_1.CodeActionCommandArgs.fromUser(userArgs, {
                kind: types_1.CodeActionKind.Refactor,
                apply: "never" /* CodeActionAutoApply.Never */
            });
            return triggerCodeActionsForEditorSelection(editor, typeof userArgs?.kind === 'string'
                ? args.preferred
                    ? nls.localize('editor.action.refactor.noneMessage.preferred.kind', "No preferred refactorings for '{0}' available", userArgs.kind)
                    : nls.localize('editor.action.refactor.noneMessage.kind', "No refactorings for '{0}' available", userArgs.kind)
                : args.preferred
                    ? nls.localize('editor.action.refactor.noneMessage.preferred', "No preferred refactorings available")
                    : nls.localize('editor.action.refactor.noneMessage', "No refactorings available"), {
                include: types_1.CodeActionKind.Refactor.contains(args.kind) ? args.kind : hierarchicalKind_1.HierarchicalKind.None,
                onlyIncludePreferredActions: args.preferred
            }, args.apply, types_1.CodeActionTriggerSource.Refactor);
        }
    }
    exports.RefactorAction = RefactorAction;
    class SourceAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.sourceActionCommandId,
                label: nls.localize('source.label', "Source Action..."),
                alias: 'Source Action...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                contextMenuOpts: {
                    group: '1_modification',
                    order: 2.1,
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.Source)),
                },
                metadata: {
                    description: 'Source Action...',
                    args: [{ name: 'args', schema: argsSchema }]
                }
            });
        }
        run(_accessor, editor, userArgs) {
            const args = types_1.CodeActionCommandArgs.fromUser(userArgs, {
                kind: types_1.CodeActionKind.Source,
                apply: "never" /* CodeActionAutoApply.Never */
            });
            return triggerCodeActionsForEditorSelection(editor, typeof userArgs?.kind === 'string'
                ? args.preferred
                    ? nls.localize('editor.action.source.noneMessage.preferred.kind', "No preferred source actions for '{0}' available", userArgs.kind)
                    : nls.localize('editor.action.source.noneMessage.kind', "No source actions for '{0}' available", userArgs.kind)
                : args.preferred
                    ? nls.localize('editor.action.source.noneMessage.preferred', "No preferred source actions available")
                    : nls.localize('editor.action.source.noneMessage', "No source actions available"), {
                include: types_1.CodeActionKind.Source.contains(args.kind) ? args.kind : hierarchicalKind_1.HierarchicalKind.None,
                includeSourceActions: true,
                onlyIncludePreferredActions: args.preferred,
            }, args.apply, types_1.CodeActionTriggerSource.SourceAction);
        }
    }
    exports.SourceAction = SourceAction;
    class OrganizeImportsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.organizeImportsCommandId,
                label: nls.localize('organizeImports.label', "Organize Imports"),
                alias: 'Organize Imports',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.SourceOrganizeImports)),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 45 /* KeyCode.KeyO */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.organize.noneMessage', "No organize imports action available"), { include: types_1.CodeActionKind.SourceOrganizeImports, includeSourceActions: true }, "ifSingle" /* CodeActionAutoApply.IfSingle */, types_1.CodeActionTriggerSource.OrganizeImports);
        }
    }
    exports.OrganizeImportsAction = OrganizeImportsAction;
    class FixAllAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.fixAllCommandId,
                label: nls.localize('fixAll.label', "Fix All"),
                alias: 'Fix All',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.SourceFixAll))
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('fixAll.noneMessage', "No fix all action available"), { include: types_1.CodeActionKind.SourceFixAll, includeSourceActions: true }, "ifSingle" /* CodeActionAutoApply.IfSingle */, types_1.CodeActionTriggerSource.FixAll);
        }
    }
    exports.FixAllAction = FixAllAction;
    class AutoFixAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.autoFixCommandId,
                label: nls.localize('autoFix.label', "Auto Fix..."),
                alias: 'Auto Fix...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.QuickFix)),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 89 /* KeyCode.Period */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 89 /* KeyCode.Period */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.autoFix.noneMessage', "No auto fixes available"), {
                include: types_1.CodeActionKind.QuickFix,
                onlyIncludePreferredActions: true
            }, "ifSingle" /* CodeActionAutoApply.IfSingle */, types_1.CodeActionTriggerSource.AutoFix);
        }
    }
    exports.AutoFixAction = AutoFixAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbkNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29kZUFjdGlvbi9icm93c2VyL2NvZGVBY3Rpb25Db21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLFNBQVMsNkJBQTZCLENBQUMsSUFBc0I7UUFDNUQsT0FBTywyQkFBYyxDQUFDLEtBQUssQ0FDMUIsd0NBQXNCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQ2hDLElBQUksTUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFBLGdDQUFzQixFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCxNQUFNLFVBQVUsR0FBZ0I7UUFDL0IsSUFBSSxFQUFFLFFBQVE7UUFDZCxlQUFlLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQ3pDLFVBQVUsRUFBRTtZQUNYLE1BQU0sRUFBRTtnQkFDUCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxpQ0FBaUMsQ0FBQzthQUNoRjtZQUNELE9BQU8sRUFBRTtnQkFDUixJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxpREFBaUQsQ0FBQztnQkFDakcsT0FBTywrQ0FBOEI7Z0JBQ3JDLElBQUksRUFBRSxpSUFBb0Y7Z0JBQzFGLGdCQUFnQixFQUFFO29CQUNqQixHQUFHLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUFFLDhDQUE4QyxDQUFDO29CQUN2RixHQUFHLENBQUMsUUFBUSxD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