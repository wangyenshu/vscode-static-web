/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/editor/common/editorContextKeys", "vs/editor/contrib/stickyScroll/browser/stickyScrollController"], function (require, exports, editorExtensions_1, nls_1, actionCommonCategories_1, actions_1, configuration_1, contextkey_1, editorContextKeys_1, stickyScrollController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectEditor = exports.GoToStickyScrollLine = exports.SelectPreviousStickyScrollLine = exports.SelectNextStickyScrollLine = exports.FocusStickyScroll = exports.ToggleStickyScroll = void 0;
    class ToggleStickyScroll extends actions_1.Action2 {
        constructor() {
            super({
                id: 'editor.action.toggleStickyScroll',
                title: {
                    ...(0, nls_1.localize2)('toggleEditorStickyScroll', "Toggle Editor Sticky Scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mitoggleStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Toggle Editor Sticky Scroll"),
                },
                metadata: {
                    description: (0, nls_1.localize2)('toggleEditorStickyScroll.description', "Toggle/enable the editor sticky scroll which shows the nested scopes at the top of the viewport"),
                },
                category: actionCommonCategories_1.Categories.View,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.equals('config.editor.stickyScroll.enabled', true),
                    title: (0, nls_1.localize)('stickyScroll', "Sticky Scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Sticky Scroll"),
                },
                menu: [
                    { id: actions_1.MenuId.CommandPalette },
                    { id: actions_1.MenuId.MenubarAppearanceMenu, group: '4_editor', order: 3 },
                    { id: actions_1.MenuId.StickyScrollContext }
                ]
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('editor.stickyScroll.enabled');
            return configurationService.updateValue('editor.stickyScroll.enabled', newValue);
        }
    }
    exports.ToggleStickyScroll = ToggleStickyScroll;
    const weight = 100 /* KeybindingWeight.EditorContrib */;
    class FocusStickyScroll extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.focusStickyScroll',
                title: {
                    ...(0, nls_1.localize2)('focusStickyScroll', "Focus on the editor sticky scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mifocusStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Focus Sticky Scroll"),
                },
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('config.editor.stickyScroll.enabled'), editorContextKeys_1.EditorContextKeys.stickyScrollVisible),
                menu: [
                    { id: actions_1.MenuId.CommandPalette },
                ]
            });
        }
        runEditorCommand(_accessor, editor) {
            stickyScrollController_1.StickyScrollController.get(editor)?.focus();
        }
    }
    exports.FocusStickyScroll = FocusStickyScroll;
    class SelectNextStickyScrollLine extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.selectNextStickyScrollLine',
                title: (0, nls_1.localize2)('selectNextStickyScrollLine.title', "Select the next editor sticky scroll line"),
                precondition: editorContextKeys_1.EditorContextKeys.stickyScrollFocused.isEqualTo(true),
                keybinding: {
                    weight,
                    primary: 18 /* KeyCode.DownArrow */
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            stickyScrollController_1.StickyScrollController.get(editor)?.focusNext();
        }
    }
    exports.SelectNextStickyScrollLine = SelectNextStickyScrollLine;
    class SelectPreviousStickyScrollLine extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.selectPreviousStickyScrollLine',
                title: (0, nls_1.localize2)('selectPreviousStickyScrollLine.title', "Select the previous sticky scroll line"),
                precondition: editorContextKeys_1.EditorContextKeys.stickyScrollFocused.isEqualTo(true),
                keybinding: {
                    weight,
                    primary: 16 /* KeyCode.UpArrow */
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            stickyScrollController_1.StickyScrollController.get(editor)?.focusPrevious();
        }
    }
    exports.SelectPreviousStickyScrollLine = SelectPreviousStickyScrollLine;
    class GoToStickyScrollLine extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.goToFocusedStickyScrollLine',
                title: (0, nls_1.localize2)('goToFocusedStickyScrollLine.title', "Go to the focused sticky scroll line"),
                precondition: editorContextKeys_1.EditorContextKeys.stickyScrollFocused.isEqualTo(true),
                keybinding: {
                    weight,
                    primary: 3 /* KeyCode.Enter */
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            stickyScrollController_1.StickyScrollController.get(editor)?.goToFocused();
        }
    }
    exports.GoToStickyScrollLine = GoToStickyScrollLine;
    class SelectEditor extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.selectEditor',
                title: (0, nls_1.localize2)('selectEditor.title', "Select Editor"),
                precondition: editorContextKeys_1.EditorContextKeys.stickyScrollFocused.isEqualTo(true),
                keybinding: {
                    weight,
                    primary: 9 /* KeyCode.Escape */
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            stickyScrollController_1.StickyScrollController.get(editor)?.selectEditor();
        }
    }
    exports.SelectEditor = SelectEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N0aWNreVNjcm9sbC9icm93c2VyL3N0aWNreVNjcm9sbEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLE1BQWEsa0JBQW1CLFNBQVEsaUJBQU87UUFFOUM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGtDQUFrQztnQkFDdEMsS0FBSyxFQUFFO29CQUNOLEdBQUcsSUFBQSxlQUFTLEVBQUMsMEJBQTBCLEVBQUUsNkJBQTZCLENBQUM7b0JBQ3ZFLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxzQkFBc0IsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsK0JBQStCLENBQUM7aUJBQzdIO2dCQUNELFFBQVEsRUFBRTtvQkFDVCxXQUFXLEVBQUUsSUFBQSxlQUFTLEVBQUMsc0NBQXNDLEVBQUUsaUdBQWlHLENBQUM7aUJBQ2pLO2dCQUNELFFBQVEsRUFBRSxtQ0FBVSxDQUFDLElBQUk7Z0JBQ3pCLE9BQU8sRUFBRTtvQkFDUixTQUFTLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMsb0NBQW9DLEVBQUUsSUFBSSxDQUFDO29CQUM1RSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQztvQkFDaEQsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQztpQkFDekc7Z0JBQ0QsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxFQUFFLGdCQUFNLENBQUMsY0FBYyxF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