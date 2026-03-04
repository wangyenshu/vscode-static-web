/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async"], function (require, exports, arrays_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContentHoverComputer = void 0;
    class ContentHoverComputer {
        get anchor() { return this._anchor; }
        set anchor(value) { this._anchor = value; }
        get shouldFocus() { return this._shouldFocus; }
        set shouldFocus(value) { this._shouldFocus = value; }
        get source() { return this._source; }
        set source(value) { this._source = value; }
        get insistOnKeepingHoverVisible() { return this._insistOnKeepingHoverVisible; }
        set insistOnKeepingHoverVisible(value) { this._insistOnKeepingHoverVisible = value; }
        constructor(_editor, _participants) {
            this._editor = _editor;
            this._participants = _participants;
            this._anchor = null;
            this._shouldFocus = false;
            this._source = 0 /* HoverStartSource.Mouse */;
            this._insistOnKeepingHoverVisible = false;
        }
        static _getLineDecorations(editor, anchor) {
            if (anchor.type !== 1 /* HoverAnchorType.Range */ && !anchor.supportsMarkerHover) {
                return [];
            }
            const model = editor.getModel();
            const lineNumber = anchor.range.startLineNumber;
            if (lineNumber > model.getLineCount()) {
                // invalid line
                return [];
            }
            const maxColumn = model.getLineMaxColumn(lineNumber);
            return editor.getLineDecorations(lineNumber).filter((d) => {
                if (d.options.isWholeLine) {
                    return true;
                }
                const startColumn = (d.range.startLineNumber === lineNumber) ? d.range.startColumn : 1;
                const endColumn = (d.range.endLineNumber === lineNumber) ? d.range.endColumn : maxColumn;
                if (d.options.showIfCollapsed) {
                    // Relax check around `showIfCollapsed` decorations to also include +/- 1 character
                    if (startColumn > anchor.range.startColumn + 1 || anchor.range.endColumn - 1 > endColumn) {
                        return false;
                    }
                }
                else {
                    if (startColumn > anchor.range.startColumn || anchor.range.endColumn > endColumn) {
                        return false;
                    }
                }
                return true;
            });
        }
        computeAsync(token) {
            const anchor = this._anchor;
            if (!this._editor.hasModel() || !anchor) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            const lineDecorations = ContentHoverComputer._getLineDecorations(this._editor, anchor);
            return async_1.AsyncIterableObject.merge(this._participants.map((participant) => {
                if (!participant.computeAsync) {
                    return async_1.AsyncIterableObject.EMPTY;
                }
                return participant.computeAsync(anchor, lineDecorations, token);
            }));
        }
        computeSync() {
            if (!this._editor.hasModel() || !this._anchor) {
                return [];
            }
            const lineDecorations = ContentHoverComputer._getLineDecorations(this._editor, this._anchor);
            let result = [];
            for (const participant of this._participants) {
                result = result.concat(participant.computeSync(this._anchor, lineDecorations));
            }
            return (0, arrays_1.coalesce)(result);
        }
    }
    exports.ContentHoverComputer = ContentHoverComputer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudEhvdmVyQ29tcHV0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9ob3Zlci9icm93c2VyL2NvbnRlbnRIb3ZlckNvbXB1dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLG9CQUFvQjtRQUdoQyxJQUFXLE1BQU0sS0FBeUIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNoRSxJQUFXLE1BQU0sQ0FBQyxLQUF5QixJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUd0RSxJQUFXLFdBQVcsS0FBYyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQy9ELElBQVcsV0FBVyxDQUFDLEtBQWMsSUFBSSxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFHckUsSUFBVyxNQUFNLEtBQXVCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDOUQsSUFBVyxNQUFNLENBQUMsS0FBdUIsSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFHcEUsSUFBVywyQkFBMkIsS0FBYyxPQUFPLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7UUFDL0YsSUFBVywyQkFBMkIsQ0FBQyxLQUFjLElBQUksSUFBSSxDQUFDLDRCQUE0QixHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFckcsWUFDa0IsT0FBb0IsRUFDcEIsYUFBaUQ7WUFEakQsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNwQixrQkFBYSxHQUFiLGFBQWEsQ0FBb0M7WUFsQjNELFlBQU8sR0FBdUIsSUFBSSxDQUFDO1lBSW5DLGlCQUFZLEdBQVks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