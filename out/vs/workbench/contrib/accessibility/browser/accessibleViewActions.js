/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/browser/editorExtensions", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/editor/browser/services/codeEditorService", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController"], function (require, exports, codicons_1, editorExtensions_1, nls_1, actions_1, contextkey_1, accessibilityConfiguration_1, accessibleView_1, codeEditorService_1, inlineCompletionsController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibleViewAction = exports.AccessibilityHelpAction = void 0;
    const accessibleViewMenu = {
        id: actions_1.MenuId.AccessibleView,
        group: 'navigation',
        when: accessibilityConfiguration_1.accessibleViewIsShown
    };
    const commandPalette = {
        id: actions_1.MenuId.CommandPalette,
        group: '',
        order: 1
    };
    class AccessibleViewNextAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "editor.action.accessibleViewNext" /* AccessibilityCommandId.ShowNext */,
                precondition: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibleViewSupportsNavigation),
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 94 /* KeyCode.BracketRight */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: [
                    commandPalette,
                    {
                        ...accessibleViewMenu,
                        when: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibleViewSupportsNavigation),
                    }
                ],
                icon: codicons_1.Codicon.arrowDown,
                title: (0, nls_1.localize)('editor.action.accessibleViewNext', "Show Next in Accessible View")
            });
        }
        run(accessor) {
            accessor.get(accessibleView_1.IAccessibleViewService).next();
        }
    }
    (0, actions_1.registerAction2)(AccessibleViewNextAction);
    class AccessibleViewNextCodeBlockAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "editor.action.accessibleViewNextCodeBlock" /* AccessibilityCommandId.NextCodeBlock */,
                precondition: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewContainsCodeBlocks, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "panelChat" /* AccessibleViewProviderId.Chat */)),
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */, },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                },
                icon: codicons_1.Codicon.arrowRight,
                menu: {
                    ...accessibleViewMenu,
                    when: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibleViewSupportsNavigation),
                },
                title: (0, nls_1.localize)('editor.action.accessibleViewNextCodeBlock', "Accessible View: Next Code Block")
            });
        }
        run(accessor) {
            accessor.get(accessibleView_1.IAccessibleViewService).navigateToCodeBlock('next');
        }
    }
    (0, actions_1.registerAction2)(AccessibleViewNextCodeBlockAction);
    class AccessibleViewPreviousCodeBlockAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "editor.action.accessibleViewPreviousCodeBlock" /* AccessibilityCommandId.PreviousCodeBlock */,
                precondition: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewContainsCodeBlocks, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "panelChat" /* AccessibleViewProviderId.Chat */)),
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */, },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                },
                icon: codicons_1.Codicon.arrowLeft,
                menu: {
                    ...accessibleViewMenu,
                    when: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibleViewSupportsNavigation),
                },
                title: (0, nls_1.localize)('editor.action.accessibleViewPreviousCodeBlock', "Accessible View: Previous Code Block")
            });
        }
        run(accessor) {
            accessor.get(accessibleView_1.IAccessibleViewService).navigateToCodeBlock('previous');
        }
    }
    (0, actions_1.registerAction2)(AccessibleViewPreviousCodeBlockAction);
    class AccessibleViewPreviousAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "editor.action.accessibleViewPrevious" /* AccessibilityCommandId.ShowPrevious */,
                precondition: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibleViewSupportsNavigation),
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 92 /* KeyCode.BracketLeft */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                icon: codicons_1.Codicon.arrowUp,
                menu: [
                    commandPalette,
                    {
                        ...accessibleViewMenu,
                        when: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibleViewSupportsNavigation),
                    }
                ],
                title: (0, nls_1.localize)('editor.action.accessibleViewPrevious', "Show Previous in Accessible View")
            });
        }
        run(accessor) {
            accessor.get(accessibleView_1.IAccessibleViewService).previous();
        }
    }
    (0, actions_1.registerAction2)(AccessibleViewPreviousAction);
    class AccessibleViewGoToSymbolAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "editor.action.accessibleViewGoToSymbol" /* AccessibilityCommandId.GoToSymbol */,
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibilityHelpIsShown), accessibilityConfiguration_1.accessibleViewGoToSymbolSupported),
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 45 /* KeyCode.KeyO */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 89 /* KeyCode.Period */],
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10
                },
                icon: codicons_1.Codicon.symbolField,
                menu: [
                    commandPalette,
                    {
                        ...accessibleViewMenu,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibilityHelpIsShown), accessibilityConfiguration_1.accessibleViewGoToSymbolSupported),
                    }
                ],
                title: (0, nls_1.localize)('editor.action.accessibleViewGoToSymbol', "Go To Symbol in Accessible View")
            });
        }
        run(accessor) {
            accessor.get(accessibleView_1.IAccessibleViewService).goToSymbol();
        }
    }
    (0, actions_1.registerAction2)(AccessibleViewGoToSymbolAction);
    function registerCommand(command) {
        command.register();
        return command;
    }
    exports.AccessibilityHelpAction = registerCommand(new editorExtensions_1.MultiCommand({
        id: "editor.action.accessibilityHelp" /* AccessibilityCommandId.OpenAccessibilityHelp */,
        precondition: undefined,
        kbOpts: {
            primary: 512 /* KeyMod.Alt */ | 59 /* KeyCode.F1 */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            linux: {
                primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 59 /* KeyCode.F1 */,
                secondary: [512 /* KeyMod.Alt */ | 59 /* KeyCode.F1 */]
            },
            kbExpr: accessibilityConfiguration_1.accessibilityHelpIsShown.toNegated()
        },
        menuOpts: [{
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: (0, nls_1.localize)('editor.action.accessibilityHelp', "Open Accessibility Help"),
                order: 1
            }],
    }));
    exports.AccessibleViewAction = registerCommand(new editorExtensions_1.MultiCommand({
        id: "editor.action.accessibleView" /* AccessibilityCommandId.OpenAccessibleView */,
        precondition: undefined,
        kbOpts: {
            primary: 512 /* KeyMod.Alt */ | 60 /* KeyCode.F2 */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            linux: {
                primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 60 /* KeyCode.F2 */,
                secondary: [512 /* KeyMod.Alt */ | 60 /* KeyCode.F2 */]
            }
        },
        menuOpts: [{
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: (0, nls_1.localize)('editor.action.accessibleView', "Open Accessible View"),
                order: 1
            }],
    }));
    class AccessibleViewDisableHintAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "editor.action.accessibleViewDisableHint" /* AccessibilityCommandId.DisableVerbosityHint */,
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibilityHelpIsShown), accessibilityConfiguration_1.accessibleViewVerbosityEnabled),
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 64 /* KeyCode.F6 */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                icon: codicons_1.Codicon.bellSlash,
                menu: [
                    commandPalette,
                    {
                        id: actions_1.MenuId.AccessibleView,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibilityHelpIsShown), accessibilityConfiguration_1.accessibleViewVerbosityEnabled),
                    }
                ],
                title: (0, nls_1.localize)('editor.action.accessibleViewDisableHint', "Disable Accessible View Hint")
            });
        }
        run(accessor) {
            accessor.get(accessibleView_1.IAccessibleViewService).disableHint();
        }
    }
    (0, actions_1.registerAction2)(AccessibleViewDisableHintAction);
    class AccessibleViewAcceptInlineCompletionAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "editor.action.accessibleViewAcceptInlineCompletion" /* AccessibilityCommandId.AccessibleViewAcceptInlineCompletion */,
                precondition: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "inlineCompletions" /* AccessibleViewProviderId.InlineCompletions */)),
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 90 /* KeyCode.Slash */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 90 /* KeyCode.Slash */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                icon: codicons_1.Codicon.check,
                menu: [
                    commandPalette,
                    {
                        id: actions_1.MenuId.AccessibleView,
                        group: 'navigation',
                        order: 0,
                        when: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "inlineCompletions" /* AccessibleViewProviderId.InlineCompletions */))
                    }
                ],
                title: (0, nls_1.localize)('editor.action.accessibleViewAcceptInlineCompletionAction', "Accept Inline Completion")
            });
        }
        async run(accessor) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const editor = codeEditorService.getActiveCodeEditor() || codeEditorService.getFocusedCodeEditor();
            if (!editor) {
                return;
            }
            const model = inlineCompletionsController_1.InlineCompletionsController.get(editor)?.model.get();
            const state = model?.state.get();
            if (!model || !state) {
                return;
            }
            await model.accept(editor);
            model.stop();
            editor.focus();
        }
    }
    (0, actions_1.registerAction2)(AccessibleViewAcceptInlineCompletionAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJsZVZpZXdBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYWNjZXNzaWJpbGl0eS9icm93c2VyL2FjY2Vzc2libGVWaWV3QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBTSxrQkFBa0IsR0FBRztRQUMxQixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxjQUFjO1FBQ3pCLEtBQUssRUFBRSxZQUFZO1FBQ25CLElBQUksRUFBRSxrREFBcUI7S0FDM0IsQ0FBQztJQUNGLE1BQU0sY0FBYyxHQUFHO1FBQ3RCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGNBQWM7UUFDekIsS0FBSyxFQUFFLEVBQUU7UUFDVCxLQUFLLEVBQUUsQ0FBQztLQUNSLENBQUM7SUFDRixNQUFNLHdCQUF5QixTQUFRLGlCQUFPO1FBQzdDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsMEVBQWlDO2dCQUNuQyxZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsa0RBQXFCLEVBQUUsNkRBQWdDLENBQUM7Z0JBQ3pGLFVBQVUsRUFBRTtvQkFDWCxPQUFPLEVBQUUsb0RBQWlDO29CQUMxQyxNQUFNLDZDQUFtQztpQkFDekM7Z0JBQ0QsSUFBSSxFQUFFO29CQUNMLGNBQWM7b0JBQ2Q7d0JBQ0MsR0FBRyxrQkFBa0I7d0JBQ3JCLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxrREFBcUIsRUFBRSw2REFBZ0MsQ0FBQztxQkFDakY7aUJBQUM7Z0JBQ0gsSUFBSSxFQUFFLGtCQUFPLENBQUMsU0FBUztnQkFDdkIsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGtDQUFrQyxFQUFFLDhCQUE4QixDQUFDO2FBQ25GLENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxH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