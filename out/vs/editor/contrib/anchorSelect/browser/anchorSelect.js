/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/htmlContent", "vs/base/common/keyCodes", "vs/editor/browser/editorExtensions", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/css!./anchorSelect"], function (require, exports, aria_1, htmlContent_1, keyCodes_1, editorExtensions_1, selection_1, editorContextKeys_1, nls_1, contextkey_1) {
    "use strict";
    var SelectionAnchorController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionAnchorSet = void 0;
    exports.SelectionAnchorSet = new contextkey_1.RawContextKey('selectionAnchorSet', false);
    let SelectionAnchorController = class SelectionAnchorController {
        static { SelectionAnchorController_1 = this; }
        static { this.ID = 'editor.contrib.selectionAnchorController'; }
        static get(editor) {
            return editor.getContribution(SelectionAnchorController_1.ID);
        }
        constructor(editor, contextKeyService) {
            this.editor = editor;
            this.selectionAnchorSetContextKey = exports.SelectionAnchorSet.bindTo(contextKeyService);
            this.modelChangeListener = editor.onDidChangeModel(() => this.selectionAnchorSetContextKey.reset());
        }
        setSelectionAnchor() {
            if (this.editor.hasModel()) {
                const position = this.editor.getPosition();
                this.editor.changeDecorations((accessor) => {
                    if (this.decorationId) {
                        accessor.removeDecoration(this.decorationId);
                    }
                    this.decorationId = accessor.addDecoration(selection_1.Selection.fromPositions(position, position), {
                        description: 'selection-anchor',
                        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                        hoverMessage: new htmlContent_1.MarkdownString().appendText((0, nls_1.localize)('selectionAnchor', "Selection Anchor")),
                        className: 'selection-anchor'
                    });
                });
                this.selectionAnchorSetContextKey.set(!!this.decorationId);
                (0, aria_1.alert)((0, nls_1.localize)('anchorSet', "Anchor set at {0}:{1}", position.lineNumber, position.column));
            }
        }
        goToSelectionAnchor() {
            if (this.editor.hasModel() && this.decorationId) {
                const anchorPosition = this.editor.getModel().getDecorationRange(this.decorationId);
                if (anchorPosition) {
                    this.editor.setPosition(anchorPosition.getStartPosition());
                }
            }
        }
        selectFromAnchorToCursor() {
            if (this.editor.hasModel() && this.decorationId) {
                const start = this.editor.getModel().getDecorationRange(this.decorationId);
                if (start) {
                    const end = this.editor.getPosition();
                    this.editor.setSelection(selection_1.Selection.fromPositions(start.getStartPosition(), end));
                    this.cancelSelectionAnchor();
                }
            }
        }
        cancelSelectionAnchor() {
            if (this.decorationId) {
                const decorationId = this.decorationId;
                this.editor.changeDecorations((accessor) => {
                    accessor.removeDecoration(decorationId);
                    this.decorationId = undefined;
                });
                this.selectionAnchorSetContextKey.set(false);
            }
        }
        dispose() {
            this.cancelSelectionAnchor();
            this.modelChangeListener.dispose();
        }
    };
    SelectionAnchorController = SelectionAnchorController_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], SelectionAnchorController);
    class SetSelectionAnchor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.setSelectionAnchor',
                label: (0, nls_1.localize)('setSelectionAnchor', "Set Selection Anchor"),
                alias: 'Set Selection Anchor',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(_accessor, editor) {
            SelectionAnchorController.get(editor)?.setSelectionAnchor();
        }
    }
    class GoToSelectionAnchor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.goToSelectionAnchor',
                label: (0, nls_1.localize)('goToSelectionAnchor', "Go to Selection Anchor"),
                alias: 'Go to Selection Anchor',
                precondition: exports.SelectionAnchorSet,
            });
        }
        async run(_accessor, editor) {
            SelectionAnchorController.get(editor)?.goToSelectionAnchor();
        }
    }
    class SelectFromAnchorToCursor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.selectFromAnchorToCursor',
                label: (0, nls_1.localize)('selectFromAnchorToCursor', "Select from Anchor to Cursor"),
                alias: 'Select from Anchor to Cursor',
                precondition: exports.SelectionAnchorSet,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(_accessor, editor) {
            SelectionAnchorController.get(editor)?.selectFromAnchorToCursor();
        }
    }
    class CancelSelectionAnchor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.cancelSelectionAnchor',
                label: (0, nls_1.localize)('cancelSelectionAnchor', "Cancel Selection Anchor"),
                alias: 'Cancel Selection Anchor',
                precondition: exports.SelectionAnchorSet,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 9 /* KeyCode.Escape */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(_accessor, editor) {
            SelectionAnchorController.get(editor)?.cancelSelectionAnchor();
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(SelectionAnchorController.ID, SelectionAnchorController, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorAction)(SetSelectionAnchor);
    (0, editorExtensions_1.registerEditorAction)(GoToSelectionAnchor);
    (0, editorExtensions_1.registerEditorAction)(SelectFromAnchorToCursor);
    (0, editorExtensions_1.registerEditorAction)(CancelSelectionAnchor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5jaG9yU2VsZWN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvYW5jaG9yU2VsZWN0L2Jyb3dzZXIvYW5jaG9yU2VsZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpQm5GLFFBQUEsa0JBQWtCLEdBQUcsSUFBSSwwQkFBYSxDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRWpGLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQXlCOztpQkFFUCxPQUFFLEdBQUcsMENBQTBDLEFBQTdDLENBQThDO1FBRXZFLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDN0IsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUE0QiwyQkFBeUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBTUQsWUFDUyxNQUFtQixFQUNQLGlCQUFxQztZQURqRCxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBRzNCLElBQUksQ0FBQyw0QkFBNEIsR0FBRywwQkFBa0IsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsbUJBQW1CLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3JHLENBQUM7UUFFRCxrQkFBa0I7WUFDakIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtvQkFDMUMs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