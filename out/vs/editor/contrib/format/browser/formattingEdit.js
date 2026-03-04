/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/browser/stableEditorScroll"], function (require, exports, editOperation_1, range_1, stableEditorScroll_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FormattingEdit = void 0;
    class FormattingEdit {
        static _handleEolEdits(editor, edits) {
            let newEol = undefined;
            const singleEdits = [];
            for (const edit of edits) {
                if (typeof edit.eol === 'number') {
                    newEol = edit.eol;
                }
                if (edit.range && typeof edit.text === 'string') {
                    singleEdits.push(edit);
                }
            }
            if (typeof newEol === 'number') {
                if (editor.hasModel()) {
                    editor.getModel().pushEOL(newEol);
                }
            }
            return singleEdits;
        }
        static _isFullModelReplaceEdit(editor, edit) {
            if (!editor.hasModel()) {
                return false;
            }
            const model = editor.getModel();
            const editRange = model.validateRange(edit.range);
            const fullModelRange = model.getFullModelRange();
            return fullModelRange.equalsRange(editRange);
        }
        static execute(editor, _edits, addUndoStops) {
            if (addUndoStops) {
                editor.pushUndoStop();
            }
            const scrollState = stableEditorScroll_1.StableEditorScrollState.capture(editor);
            const edits = FormattingEdit._handleEolEdits(editor, _edits);
            if (edits.length === 1 && FormattingEdit._isFullModelReplaceEdit(editor, edits[0])) {
                // We use replace semantics and hope that markers stay put...
                editor.executeEdits('formatEditsCommand', edits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text)));
            }
            else {
                editor.executeEdits('formatEditsCommand', edits.map(edit => editOperation_1.EditOperation.replaceMove(range_1.Range.lift(edit.range), edit.text)));
            }
            if (addUndoStops) {
                editor.pushUndoStop();
            }
            scrollState.restoreRelativeVerticalPositionOfCursor(editor);
        }
    }
    exports.FormattingEdit = FormattingEdit;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGluZ0VkaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9mb3JtYXQvYnJvd3Nlci9mb3JtYXR0aW5nRWRpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxjQUFjO1FBRWxCLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBbUIsRUFBRSxLQUFpQjtZQUNwRSxJQUFJLE1BQU0sR0FBa0MsU0FBUyxDQUFDO1lBQ3RELE1BQU0sV0FBVyxHQUEyQixFQUFFLENBQUM7WUFFL0MsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxPQUFPLElBQUksQ0FBQyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ2xDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUNuQixDQUFDO2dCQUNELElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ2pELFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3hCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztvQkFDdkIsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLFdBQVcsQ0FBQztRQUNwQixDQUFDO1FBRU8sTUFBTSxDQUFDLHVCQUF1QixDQUFDLE1BQW1CLEVBQUUsSUFBMEI7WUFDckYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEMsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEQsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDakQsT0FBTyxjQUFjLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQW1CLEVBQUUsTUFBa0IsRUFBRSxZQUFxQjtZQUM1RSxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNsQixNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdkIsQ0FBQztZQUNELE1BQU0sV0FBVyxHQUFHLDRDQUF1QixDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1RCxNQUFNLEtBQUssR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM3RCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDcEYsNkRBQTZEO2dCQUM3RCxNQUFNLENBQUMsWUFBWSxDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyw2QkFBYSxDQUFDLE9BQU8sQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hILENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsWUFBWSxDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyw2QkFBYSxDQUFDLFdBQVcsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVILENBQUM7WUFDRCxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNsQixNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdkIsQ0FBQztZQUNELFdBQVcsQ0FBQyx1Q0FBdUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3RCxDQUFDO0tBQ0Q7SUFuREQsd0NBbURDIn0=