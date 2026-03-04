/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/services/textResourceConfiguration", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/browser/parts/editor/textDiffEditor", "vs/workbench/common/contextkeys", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, textResourceConfiguration_1, nls_1, actions_1, contextkey_1, keybindingsRegistry_1, textDiffEditor_1, contextkeys_1, diffEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DIFF_SWAP_SIDES = exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE = exports.DIFF_OPEN_SIDE = exports.DIFF_FOCUS_OTHER_SIDE = exports.DIFF_FOCUS_SECONDARY_SIDE = exports.DIFF_FOCUS_PRIMARY_SIDE = exports.GOTO_PREVIOUS_CHANGE = exports.GOTO_NEXT_CHANGE = exports.TOGGLE_DIFF_SIDE_BY_SIDE = void 0;
    exports.registerDiffEditorCommands = registerDiffEditorCommands;
    exports.TOGGLE_DIFF_SIDE_BY_SIDE = 'toggle.diff.renderSideBySide';
    exports.GOTO_NEXT_CHANGE = 'workbench.action.compareEditor.nextChange';
    exports.GOTO_PREVIOUS_CHANGE = 'workbench.action.compareEditor.previousChange';
    exports.DIFF_FOCUS_PRIMARY_SIDE = 'workbench.action.compareEditor.focusPrimarySide';
    exports.DIFF_FOCUS_SECONDARY_SIDE = 'workbench.action.compareEditor.focusSecondarySide';
    exports.DIFF_FOCUS_OTHER_SIDE = 'workbench.action.compareEditor.focusOtherSide';
    exports.DIFF_OPEN_SIDE = 'workbench.action.compareEditor.openSide';
    exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE = 'toggle.diff.ignoreTrimWhitespace';
    exports.DIFF_SWAP_SIDES = 'workbench.action.compareEditor.swapSides';
    function registerDiffEditorCommands() {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.GOTO_NEXT_CHANGE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.TextCompareEditorVisibleContext,
            primary: 512 /* KeyMod.Alt */ | 63 /* KeyCode.F5 */,
            handler: accessor => navigateInDiffEditor(accessor, true)
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id: exports.GOTO_NEXT_CHANGE,
                title: (0, nls_1.localize2)('compare.nextChange', 'Go to Next Change'),
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.GOTO_PREVIOUS_CHANGE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.TextCompareEditorVisibleContext,
            primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 63 /* KeyCode.F5 */,
            handler: accessor => navigateInDiffEditor(accessor, false)
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id: exports.GOTO_PREVIOUS_CHANGE,
                title: (0, nls_1.localize2)('compare.previousChange', 'Go to Previous Change'),
            }
        });
        function getActiveTextDiffEditor(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            for (const editor of [editorService.activeEditorPane, ...editorService.visibleEditorPanes]) {
                if (editor instanceof textDiffEditor_1.TextDiffEditor) {
                    return editor;
                }
            }
            return undefined;
        }
        function navigateInDiffEditor(accessor, next) {
            const activeTextDiffEditor = getActiveTextDiffEditor(accessor);
            if (activeTextDiffEditor) {
                activeTextDiffEditor.getControl()?.goToDiff(next ? 'next' : 'previous');
            }
        }
        let FocusTextDiffEditorMode;
        (function (FocusTextDiffEditorMode) {
            FocusTextDiffEditorMode[FocusTextDiffEditorMode["Original"] = 0] = "Original";
            FocusTextDiffEditorMode[FocusTextDiffEditorMode["Modified"] = 1] = "Modified";
            FocusTextDiffEditorMode[FocusTextDiffEditorMode["Toggle"] = 2] = "Toggle";
        })(FocusTextDiffEditorMode || (FocusTextDiffEditorMode = {}));
        function focusInDiffEditor(accessor, mode) {
            const activeTextDiffEditor = getActiveTextDiffEditor(accessor);
            if (activeTextDiffEditor) {
                switch (mode) {
                    case FocusTextDiffEditorMode.Original:
                        activeTextDiffEditor.getControl()?.getOriginalEditor().focus();
                        break;
                    case FocusTextDiffEditorMode.Modified:
                        activeTextDiffEditor.getControl()?.getModifiedEditor().focus();
                        break;
                    case FocusTextDiffEditorMode.Toggle:
                        if (activeTextDiffEditor.getControl()?.getModifiedEditor().hasWidgetFocus()) {
                            return focusInDiffEditor(accessor, FocusTextDiffEditorMode.Original);
                        }
                        else {
                            return focusInDiffEditor(accessor, FocusTextDiffEditorMode.Modified);
                        }
                }
            }
        }
        function toggleDiffSideBySide(accessor) {
            const configService = accessor.get(textResourceConfiguration_1.ITextResourceConfigurationService);
            const activeTextDiffEditor = getActiveTextDiffEditor(accessor);
            const m = activeTextDiffEditor?.getControl()?.getModifiedEditor()?.getModel();
            if (!m) {
                return;
            }
            const key = 'diffEditor.renderSideBySide';
            const val = configService.getValue(m.uri, key);
            configService.updateValue(m.uri, key, !val);
        }
        function toggleDiffIgnoreTrimWhitespace(accessor) {
            const configService = accessor.get(textResourceConfiguration_1.ITextResourceConfigurationService);
            const activeTextDiffEditor = getActiveTextDiffEditor(accessor);
            const m = activeTextDiffEditor?.getControl()?.getModifiedEditor()?.getModel();
            if (!m) {
                return;
            }
            const key = 'diffEditor.ignoreTrimWhitespace';
            const val = configService.getValue(m.uri, key);
            configService.updateValue(m.uri, key, !val);
        }
        async function swapDiffSides(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const diffEditor = getActiveTextDiffEditor(accessor);
            const activeGroup = diffEditor?.group;
            const diffInput = diffEditor?.input;
            if (!diffEditor || typeof activeGroup === 'undefined' || !(diffInput instanceof diffEditorInput_1.DiffEditorInput) || !diffInput.modified.resource) {
                return;
            }
            const untypedDiffInput = diffInput.toUntyped({ preserveViewState: activeGroup.id, preserveResource: true });
            if (!untypedDiffInput) {
                return;
            }
            // Since we are about to replace the diff editor, make
            // sure to first open the modified side if it is not
            // yet opened. This ensures that the swapping is not
            // bringing up a confirmation dialog to save.
            if (diffInput.modified.isModified() && editorService.findEditors({ resource: diffInput.modified.resource, typeId: diffInput.modified.typeId, editorId: diffInput.modified.editorId }).length === 0) {
                await editorService.openEditor({
                    ...untypedDiffInput.modified,
                    options: {
                        ...untypedDiffInput.modified.options,
                        pinned: true,
                        inactive: true
                    }
                }, activeGroup);
            }
            // Replace the input with the swapped variant
            await editorService.replaceEditors([
                {
                    editor: diffInput,
                    replacement: {
                        ...untypedDiffInput,
                        original: untypedDiffInput.modified,
                        modified: untypedDiffInput.original,
                        options: {
                            ...untypedDiffInput.options,
                            pinned: true
                        }
                    }
                }
            ], activeGroup);
        }
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.TOGGLE_DIFF_SIDE_BY_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => toggleDiffSideBySide(accessor)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.DIFF_FOCUS_PRIMARY_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => focusInDiffEditor(accessor, FocusTextDiffEditorMode.Modified)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.DIFF_FOCUS_SECONDARY_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => focusInDiffEditor(accessor, FocusTextDiffEditorMode.Original)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.DIFF_FOCUS_OTHER_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => focusInDiffEditor(accessor, FocusTextDiffEditorMode.Toggle)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => toggleDiffIgnoreTrimWhitespace(accessor)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.DIFF_SWAP_SIDES,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => swapDiffSides(accessor)
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id: exports.TOGGLE_DIFF_SIDE_BY_SIDE,
                title: (0, nls_1.localize2)('toggleInlineView', "Toggle Inline View"),
                category: (0, nls_1.localize)('compare', "Compare")
            },
            when: contextkeys_1.TextCompareEditorActiveContext
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id: exports.DIFF_SWAP_SIDES,
                title: (0, nls_1.localize2)('swapDiffSides', "Swap Left and Right Editor Side"),
                category: (0, nls_1.localize)('compare', "Compare")
            },
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.TextCompareEditorActiveContext, contextkeys_1.ActiveCompareEditorCanSwapContext)
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvckNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2RpZmZFZGl0b3JDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3QmhHLGdFQXNOQztJQWhPWSxRQUFBLHdCQUF3QixHQUFHLDhCQUE4QixDQUFDO0lBQzFELFFBQUEsZ0JBQWdCLEdBQUcsMkNBQTJDLENBQUM7SUFDL0QsUUFBQSxvQkFBb0IsR0FBRywrQ0FBK0MsQ0FBQztJQUN2RSxRQUFBLHVCQUF1QixHQUFHLGlEQUFpRCxDQUFDO0lBQzVFLFFBQUEseUJBQXlCLEdBQUcsbURBQW1ELENBQUM7SUFDaEYsUUFBQSxxQkFBcUIsR0FBRywrQ0FBK0MsQ0FBQztJQUN4RSxRQUFBLGNBQWMsR0FBRyx5Q0FBeUMsQ0FBQztJQUMzRCxRQUFBLGtDQUFrQyxHQUFHLGtDQUFrQyxDQUFDO0lBQ3hFLFFBQUEsZUFBZSxHQUFHLDBDQUEwQyxDQUFDO0lBRTFFLFNBQWdCLDBCQUEwQjtRQUN6Qyx5Q0FBbUIsQ0FBQyxnQ0FBZ0MsQ0FBQztZQUNwRCxFQUFFLEVBQUUsd0JBQWdCO1lBQ3BCLE1BQU0sNkNBQW1DO1lBQ3pDLElBQUksRUFBRSw2Q0FBK0I7WUFDckMsT0FBTyxFQUFFLDBDQUF1QjtZQUNoQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDO1NBQ3pELENBQUMsQ0FBQztRQUVILHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsY0FBYyxFQUFFO1lBQ2xELE9BQU8sRUFBRTtnQkFDUixFQUFFLEVBQUUsd0JBQWdCO2dCQUNwQixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsb0JBQW9C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