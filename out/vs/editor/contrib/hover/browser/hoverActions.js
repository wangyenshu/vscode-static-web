/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/contrib/hover/browser/hoverActionIds", "vs/base/common/keyCodes", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition", "vs/editor/contrib/hover/browser/hoverController", "vs/editor/common/languages", "vs/nls", "vs/css!./hover"], function (require, exports, hoverActionIds_1, keyCodes_1, editorExtensions_1, range_1, editorContextKeys_1, goToDefinitionAtPosition_1, hoverController_1, languages_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecreaseHoverVerbosityLevel = exports.IncreaseHoverVerbosityLevel = exports.GoToBottomHoverAction = exports.GoToTopHoverAction = exports.PageDownHoverAction = exports.PageUpHoverAction = exports.ScrollRightHoverAction = exports.ScrollLeftHoverAction = exports.ScrollDownHoverAction = exports.ScrollUpHoverAction = exports.ShowDefinitionPreviewHoverAction = exports.ShowOrFocusHoverAction = void 0;
    var HoverFocusBehavior;
    (function (HoverFocusBehavior) {
        HoverFocusBehavior["NoAutoFocus"] = "noAutoFocus";
        HoverFocusBehavior["FocusIfVisible"] = "focusIfVisible";
        HoverFocusBehavior["AutoFocusImmediately"] = "autoFocusImmediately";
    })(HoverFocusBehavior || (HoverFocusBehavior = {}));
    class ShowOrFocusHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.SHOW_OR_FOCUS_HOVER_ACTION_ID,
                label: nls.localize({
                    key: 'showOrFocusHover',
                    comment: [
                        'Label for action that will trigger the showing/focusing of a hover in the editor.',
                        'If the hover is not visible, it will show the hover.',
                        'This allows for users to show the hover without using the mouse.'
                    ]
                }, "Show or Focus Hover"),
                metadata: {
                    description: nls.localize2('showOrFocusHoverDescription', 'Show or focus the editor hover which shows documentation, references, and other content for a symbol at the current cursor position.'),
                    args: [{
                            name: 'args',
                            schema: {
                                type: 'object',
                                properties: {
                                    'focus': {
                                        description: 'Controls if and when the hover should take focus upon being triggered by this action.',
                                        enum: [HoverFocusBehavior.NoAutoFocus, HoverFocusBehavior.FocusIfVisible, HoverFocusBehavior.AutoFocusImmediately],
                                        enumDescriptions: [
                                            nls.localize('showOrFocusHover.focus.noAutoFocus', 'The hover will not automatically take focus.'),
                                            nls.localize('showOrFocusHover.focus.focusIfVisible', 'The hover will take focus only if it is already visible.'),
                                            nls.localize('showOrFocusHover.focus.autoFocusImmediately', 'The hover will automatically take focus when it appears.'),
                                        ],
                                        default: HoverFocusBehavior.FocusIfVisible,
                                    }
                                },
                            }
                        }]
                },
                alias: 'Show or Focus Hover',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const controller = hoverController_1.HoverController.get(editor);
            if (!controller) {
                return;
            }
            const focusArgument = args?.focus;
            let focusOption = HoverFocusBehavior.FocusIfVisible;
            if (Object.values(HoverFocusBehavior).includes(focusArgument)) {
                focusOption = focusArgument;
            }
            else if (typeof focusArgument === 'boolean' && focusArgument) {
                focusOption = HoverFocusBehavior.AutoFocusImmediately;
            }
            const showContentHover = (focus) => {
                const position = editor.getPosition();
                const range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
                controller.showContentHover(range, 1 /* HoverStartMode.Immediate */, 1 /* HoverStartSource.Keyboard */, focus);
            };
            const accessibilitySupportEnabled = editor.getOption(2 /* EditorOption.accessibilitySupport */) === 2 /* AccessibilitySupport.Enabled */;
            if (controller.isHoverVisible) {
                if (focusOption !== HoverFocusBehavior.NoAutoFocus) {
                    controller.focus();
                }
                else {
                    showContentHover(accessibilitySupportEnabled);
                }
            }
            else {
                showContentHover(accessibilitySupportEnabled || focusOption === HoverFocusBehavior.AutoFocusImmediately);
            }
        }
    }
    exports.ShowOrFocusHoverAction = ShowOrFocusHoverAction;
    class ShowDefinitionPreviewHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.SHOW_DEFINITION_PREVIEW_HOVER_ACTION_ID,
                label: nls.localize({
                    key: 'showDefinitionPreviewHover',
                    comment: [
                        'Label for action that will trigger the showing of definition preview hover in the editor.',
                        'This allows for users to show the definition preview hover without using the mouse.'
                    ]
                }, "Show Definition Preview Hover"),
                alias: 'Show Definition Preview Hover',
                precondition: undefined,
                metadata: {
                    description: nls.localize2('showDefinitionPreviewHoverDescription', 'Show the definition preview hover in the editor.'),
                },
            });
        }
        run(accessor, editor) {
            const controller = hoverController_1.HoverController.get(editor);
            if (!controller) {
                return;
            }
            const position = editor.getPosition();
            if (!position) {
                return;
            }
            const range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
            const goto = goToDefinitionAtPosition_1.GotoDefinitionAtPositionEditorContribution.get(editor);
            if (!goto) {
                return;
            }
            const promise = goto.startFindDefinitionFromCursor(position);
            promise.then(() => {
                controller.showContentHover(range, 1 /* HoverStartMode.Immediate */, 1 /* HoverStartSource.Keyboard */, true);
            });
        }
    }
    exports.ShowDefinitionPreviewHoverAction = ShowDefinitionPreviewHoverAction;
    class ScrollUpHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.SCROLL_UP_HOVER_ACTION_ID,
                label: nls.localize({
                    key: 'scrollUpHover',
                    comment: [
                        'Action that allows to scroll up in the hover widget with the up arrow when the hover widget is focused.'
                    ]
                }, "Scroll Up Hover"),
                alias: 'Scroll Up Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 16 /* KeyCode.UpArrow */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: nls.localize2('scrollUpHoverDescription', 'Scroll up the editor hover.')
                },
            });
        }
        run(accessor, editor) {
            const controller = hoverController_1.HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.scrollUp();
        }
    }
    exports.ScrollUpHoverAction = ScrollUpHoverAction;
    class ScrollDownHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.SCROLL_DOWN_HOVER_ACTION_ID,
                label: nls.localize({
                    key: 'scrollDownHover',
                    comment: [
                        'Action that allows to scroll down in the hover widget with the up arrow when the hover widget is focused.'
                    ]
                }, "Scroll Down Hover"),
                alias: 'Scroll Down Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 18 /* KeyCode.DownArrow */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: nls.localize2('scrollDownHoverDescription', 'Scroll down the editor hover.'),
                },
            });
        }
        run(accessor, editor) {
            const controller = hoverController_1.HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.scrollDown();
        }
    }
    exports.ScrollDownHoverAction = ScrollDownHoverAction;
    class ScrollLeftHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.SCROLL_LEFT_HOVER_ACTION_ID,
                label: nls.localize({
                    key: 'scrollLeftHover',
                    comment: [
                        'Action that allows to scroll left in the hover widget with the left arrow when the hover widget is focused.'
                    ]
                }, "Scroll Left Hover"),
                alias: 'Scroll Left Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 15 /* KeyCode.LeftArrow */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: nls.localize2('scrollLeftHoverDescription', 'Scroll left the editor hover.'),
                },
            });
        }
        run(accessor, editor) {
            const controller = hoverController_1.HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.scrollLeft();
        }
    }
    exports.ScrollLeftHoverAction = ScrollLeftHoverAction;
    class ScrollRightHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.SCROLL_RIGHT_HOVER_ACTION_ID,
                label: nls.localize({
                    key: 'scrollRightHover',
                    comment: [
                        'Action that allows to scroll right in the hover widget with the right arrow when the hover widget is focused.'
                    ]
                }, "Scroll Right Hover"),
                alias: 'Scroll Right Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 17 /* KeyCode.RightArrow */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: nls.localize2('scrollRightHoverDescription', 'Scroll right the editor hover.')
                },
            });
        }
        run(accessor, editor) {
            const controller = hoverController_1.HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.scrollRight();
        }
    }
    exports.ScrollRightHoverAction = ScrollRightHoverAction;
    class PageUpHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.PAGE_UP_HOVER_ACTION_ID,
                label: nls.localize({
                    key: 'pageUpHover',
                    comment: [
                        'Action that allows to page up in the hover widget with the page up command when the hover widget is focused.'
                    ]
                }, "Page Up Hover"),
                alias: 'Page Up Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 11 /* KeyCode.PageUp */,
                    secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */],
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: nls.localize2('pageUpHoverDescription', 'Page up the editor hover.'),
                },
            });
        }
        run(accessor, editor) {
            const controller = hoverController_1.HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.pageUp();
        }
    }
    exports.PageUpHoverAction = PageUpHoverAction;
    class PageDownHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.PAGE_DOWN_HOVER_ACTION_ID,
                label: nls.localize({
                    key: 'pageDownHover',
                    comment: [
                        'Action that allows to page down in the hover widget with the page down command when the hover widget is focused.'
                    ]
                }, "Page Down Hover"),
                alias: 'Page Down Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 12 /* KeyCode.PageDown */,
                    secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */],
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: nls.localize2('pageDownHoverDescription', 'Page down the editor hover.'),
                },
            });
        }
        run(accessor, editor) {
            const controller = hoverController_1.HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.pageDown();
        }
    }
    exports.PageDownHoverAction = PageDownHoverAction;
    class GoToTopHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.GO_TO_TOP_HOVER_ACTION_ID,
                label: nls.localize({
                    key: 'goToTopHover',
                    comment: [
                        'Action that allows to go to the top of the hover widget with the home command when the hover widget is focused.'
                    ]
                }, "Go To Top Hover"),
                alias: 'Go To Bottom Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 14 /* KeyCode.Home */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */],
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: nls.localize2('goToTopHoverDescription', 'Go to the top of the editor hover.'),
                },
            });
        }
        run(accessor, editor) {
            const controller = hoverController_1.HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.goToTop();
        }
    }
    exports.GoToTopHoverAction = GoToTopHoverAction;
    class GoToBottomHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.GO_TO_BOTTOM_HOVER_ACTION_ID,
                label: nls.localize({
                    key: 'goToBottomHover',
                    comment: [
                        'Action that allows to go to the bottom in the hover widget with the end command when the hover widget is focused.'
                    ]
                }, "Go To Bottom Hover"),
                alias: 'Go To Bottom Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 13 /* KeyCode.End */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */],
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: nls.localize2('goToBottomHoverDescription', 'Go to the bottom of the editor hover.')
                },
            });
        }
        run(accessor, editor) {
            const controller = hoverController_1.HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.goToBottom();
        }
    }
    exports.GoToBottomHoverAction = GoToBottomHoverAction;
    class IncreaseHoverVerbosityLevel extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.INCREASE_HOVER_VERBOSITY_ACTION_ID,
                label: nls.localize({
                    key: 'increaseHoverVerbosityLevel',
                    comment: ['Label for action that will increase the hover verbosity level.']
                }, "Increase Hover Verbosity Level"),
                alias: 'Increase Hover Verbosity Level',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused
            });
        }
        run(accessor, editor) {
            hoverController_1.HoverController.get(editor)?.updateFocusedMarkdownHoverVerbosityLevel(languages_1.HoverVerbosityAction.Increase);
        }
    }
    exports.IncreaseHoverVerbosityLevel = IncreaseHoverVerbosityLevel;
    class DecreaseHoverVerbosityLevel extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: hoverActionIds_1.DECREASE_HOVER_VERBOSITY_ACTION_ID,
                label: nls.localize({
                    key: 'decreaseHoverVerbosityLevel',
                    comment: ['Label for action that will decrease the hover verbosity level.']
                }, "Decrease Hover Verbosity Level"),
                alias: 'Decrease Hover Verbosity Level',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused
            });
        }
        run(accessor, editor, args) {
            hoverController_1.HoverController.get(editor)?.updateFocusedMarkdownHoverVerbosityLevel(languages_1.HoverVerbosityAction.Decrease);
        }
    }
    exports.DecreaseHoverVerbosityLevel = DecreaseHoverVerbosityLevel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaG92ZXIvYnJvd3Nlci9ob3ZlckFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxJQUFLLGtCQUlKO0lBSkQsV0FBSyxrQkFBa0I7UUFDdEIsaURBQTJCLENBQUE7UUFDM0IsdURBQWlDLENBQUE7UUFDakMsbUVBQTZDLENBQUE7SUFDOUMsQ0FBQyxFQUpJLGtCQUFrQixLQUFsQixrQkFBa0IsUUFJdEI7SUFFRCxNQUFhLHNCQUF1QixTQUFRLCtCQUFZO1FBRXZEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw4Q0FBNkI7Z0JBQ2pDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDO29CQUNuQixHQUFHLEVBQUUsa0JBQWtCO29CQUN2QixPQUFPLEVBQUU7d0JBQ1IsbUZBQW1GO3dCQUNuRixzREFBc0Q7d0JBQ3RELGtFQUFrRTtxQkFDbEU7aUJBQ0QsRUFBRSxxQkFBcUIsQ0FBQztnQkFDekIsUUFBUSxFQUFFO29CQUNULFdBQVcsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLDZCQUE2QixFQUFFLHNJQUFzSSxDQUFDO29CQUNqTSxJQUFJLEVBQUUsQ0FBQzs0QkFDTixJQUFJLEVBQUUsTUFBTTs0QkFDWixNQUFNLEVBQUU7Z0NBQ1AsSUFBSSxFQUFFLFFBQVE7Z0NBQ2QsVUFBVSxFQUFFO29DQUNYLE9BQU8sRUFBRTt3Q0FDUixXQUFXLEVBQUUsdUZBQXVGO3dDQUNwRyxJQUFJLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsa0JBQWtCLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDO3dDQUNsSCxnQkFBZ0IsRUFBRTs0Q0FDakIsR0FB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