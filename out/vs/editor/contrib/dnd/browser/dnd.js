/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/model/textModel", "vs/editor/contrib/dnd/browser/dragAndDropCommand", "vs/css!./dnd"], function (require, exports, lifecycle_1, platform_1, editorExtensions_1, position_1, range_1, selection_1, textModel_1, dragAndDropCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DragAndDropController = void 0;
    function hasTriggerModifier(e) {
        if (platform_1.isMacintosh) {
            return e.altKey;
        }
        else {
            return e.ctrlKey;
        }
    }
    class DragAndDropController extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.dragAndDrop'; }
        static { this.TRIGGER_KEY_VALUE = platform_1.isMacintosh ? 6 /* KeyCode.Alt */ : 5 /* KeyCode.Ctrl */; }
        static get(editor) {
            return editor.getContribution(DragAndDropController.ID);
        }
        constructor(editor) {
            super();
            this._editor = editor;
            this._dndDecorationIds = this._editor.createDecorationsCollection();
            this._register(this._editor.onMouseDown((e) => this._onEditorMouseDown(e)));
            this._register(this._editor.onMouseUp((e) => this._onEditorMouseUp(e)));
            this._register(this._editor.onMouseDrag((e) => this._onEditorMouseDrag(e)));
            this._register(this._editor.onMouseDrop((e) => this._onEditorMouseDrop(e)));
            this._register(this._editor.onMouseDropCanceled(() => this._onEditorMouseDropCanceled()));
            this._register(this._editor.onKeyDown((e) => this.onEditorKeyDown(e)));
            this._register(this._editor.onKeyUp((e) => this.onEditorKeyUp(e)));
            this._register(this._editor.onDidBlurEditorWidget(() => this.onEditorBlur()));
            this._register(this._editor.onDidBlurEditorText(() => this.onEditorBlur()));
            this._mouseDown = false;
            this._modifierPressed = false;
            this._dragSelection = null;
        }
        onEditorBlur() {
            this._removeDecoration();
            this._dragSelection = null;
            this._mouseDown = false;
            this._modifierPressed = false;
        }
        onEditorKeyDown(e) {
            if (!this._editor.getOption(35 /* EditorOption.dragAndDrop */) || this._editor.getOption(22 /* EditorOption.columnSelection */)) {
                return;
            }
            if (hasTriggerModifier(e)) {
                this._modifierPressed = true;
            }
            if (this._mouseDown && hasTriggerModifier(e)) {
                this._editor.updateOptions({
                    mouseStyle: 'copy'
                });
            }
        }
        onEditorKeyUp(e) {
            if (!this._editor.getOption(35 /* EditorOption.dragAndDrop */) || this._editor.getOption(22 /* EditorOption.columnSelection */)) {
                return;
            }
            if (hasTriggerModifier(e)) {
                this._modifierPressed = false;
            }
            if (this._mouseDown && e.keyCode === DragAndDropController.TRIGGER_KEY_VALUE) {
                this._editor.updateOptions({
                    mouseStyle: 'default'
                });
            }
        }
        _onEditorMouseDown(mouseEvent) {
            this._mouseDown = true;
        }
        _onEditorMouseUp(mouseEvent) {
            this._mouseDown = false;
            // Whenever users release the mouse, the drag and drop operation should finish and the cursor should revert to text.
            this._editor.updateOptions({
                mouseStyle: 'text'
            });
        }
        _onEditorMouseDrag(mouseEvent) {
            const target = mouseEvent.target;
            if (this._dragSelection === null) {
                const selections = this._editor.getSelections() || [];
                const possibleSelections = selections.filter(selection => target.position && selection.containsPosition(target.position));
                if (possibleSelections.length === 1) {
                    this._dragSelection = possibleSelections[0];
                }
                else {
                    return;
                }
            }
            if (hasTriggerModifier(mouseEvent.event)) {
                this._editor.updateOptions({
                    mouseStyle: 'copy'
                });
            }
            else {
                this._editor.updateOptions({
                    mouseStyle: 'default'
                });
            }
            if (target.position) {
                if (this._dragSelection.containsPosition(target.position)) {
                    this._removeDecoration();
                }
                else {
                    this.showAt(target.position);
                }
            }
        }
        _onEditorMouseDropCanceled() {
            this._editor.updateOptions({
                mouseStyle: 'text'
            });
            this._removeDecoration();
            this._dragSelection = null;
            this._mouseDown = false;
        }
        _onEditorMouseDrop(mouseEvent) {
            if (mouseEvent.target && (this._hitContent(mouseEvent.target) || this._hitMargin(mouseEvent.target)) && mouseEvent.target.position) {
                const newCursorPosition = new position_1.Position(mouseEvent.target.position.lineNumber, mouseEvent.target.position.column);
                if (this._dragSelection === null) {
                    let newSelections = null;
                    if (mouseEvent.event.shiftKey) {
                        const primarySelection = this._editor.getSelection();
                        if (primarySelection) {
                            const { selectionStartLineNumber, selectionStartColumn } = primarySelection;
                            newSelections = [new selection_1.Selection(selectionStartLineNumber, selectionStartColumn, newCursorPosition.lineNumber, newCursorPosition.column)];
                        }
                    }
                    else {
                        newSelections = (this._editor.getSelections() || []).map(selection => {
                            if (selection.containsPosition(newCursorPosition)) {
                                return new selection_1.Selection(newCursorPosition.lineNumber, newCursorPosition.column, newCursorPosition.lineNumber, newCursorPosition.column);
                            }
                            else {
                                return selection;
                            }
                        });
                    }
                    // Use `mouse` as the source instead of `api` and setting the reason to explicit (to behave like any other mouse operation).
                    this._editor.setSelections(newSelections || [], 'mouse', 3 /* CursorChangeReason.Explicit */);
                }
                else if (!this._dragSelection.containsPosition(newCursorPosition) ||
                    ((hasTriggerModifier(mouseEvent.event) ||
                        this._modifierPressed) && (this._dragSelection.getEndPosition().equals(newCursorPosition) || this._dragSelection.getStartPosition().equals(newCursorPosition)) // we allow users to paste content beside the selection
                    )) {
                    this._editor.pushUndoStop();
                    this._editor.executeCommand(DragAndDropController.ID, new dragAndDropCommand_1.DragAndDropCommand(this._dragSelection, newCursorPosition, hasTriggerModifier(mouseEvent.event) || this._modifierPressed));
                    this._editor.pushUndoStop();
                }
            }
            this._editor.updateOptions({
                mouseStyle: 'text'
            });
            this._removeDecoration();
            this._dragSelection = null;
            this._mouseDown = false;
        }
        static { this._DECORATION_OPTIONS = textModel_1.ModelDecorationOptions.register({
            description: 'dnd-target',
            className: 'dnd-target'
        }); }
        showAt(position) {
            this._dndDecorationIds.set([{
                    range: new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                    options: DragAndDropController._DECORATION_OPTIONS
                }]);
            this._editor.revealPosition(position, 1 /* ScrollType.Immediate */);
        }
        _removeDecoration() {
            this._dndDecorationIds.clear();
        }
        _hitContent(target) {
            return target.type === 6 /* MouseTargetType.CONTENT_TEXT */ ||
                target.type === 7 /* MouseTargetType.CONTENT_EMPTY */;
        }
        _hitMargin(target) {
            return target.type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */ ||
                target.type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */ ||
                target.type === 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */;
        }
        dispose() {
            this._removeDecoration();
            this._dragSelection = null;
            this._mouseDown = false;
            this._modifierPressed = false;
            super.dispose();
        }
    }
    exports.DragAndDropController = DragAndDropController;
    (0, editorExtensions_1.registerEditorContribution)(DragAndDropController.ID, DragAndDropController, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZG5kL2Jyb3dzZXIvZG5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CaEcsU0FBUyxrQkFBa0IsQ0FBQyxDQUErQjtRQUMxRCxJQUFJLHNCQUFXLEVBQUUsQ0FBQztZQUNqQixPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDakIsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDbEIsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFhLHFCQUFzQixTQUFRLHNCQUFVO2lCQUU3QixPQUFFLEdBQUcsNEJBQTRCLENBQUM7aUJBT3pDLHNCQUFpQixHQUFHLHNCQUFXLENBQUMsQ0FBQyxxQkFBYSxDQUFDLHFCQUFhLENBQUM7UUFFN0UsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUM3QixPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQXdCLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFRCxZQUFZLE1BQW1CO1lBQzlCLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQUNwRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBb0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMs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