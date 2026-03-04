/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/errors", "vs/editor/common/core/position", "vs/editor/common/core/positionToOffset", "vs/editor/common/core/range", "vs/editor/common/core/textLength"], function (require, exports, assert_1, errors_1, position_1, positionToOffset_1, range_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StringText = exports.LineBasedText = exports.AbstractText = exports.SingleTextEdit = exports.TextEdit = void 0;
    class TextEdit {
        static single(originalRange, newText) {
            return new TextEdit([new SingleTextEdit(originalRange, newText)]);
        }
        constructor(edits) {
            this.edits = edits;
            (0, assert_1.assertFn)(() => (0, assert_1.checkAdjacentItems)(edits, (a, b) => a.range.getEndPosition().isBeforeOrEqual(b.range.getStartPosition())));
        }
        /**
         * Joins touching edits and removes empty edits.
         */
        normalize() {
            const edits = [];
            for (const edit of this.edits) {
                if (edits.length > 0 && edits[edits.length - 1].range.getEndPosition().equals(edit.range.getStartPosition())) {
                    const last = edits[edits.length - 1];
                    edits[edits.length - 1] = new SingleTextEdit(last.range.plusRange(edit.range), last.text + edit.text);
                }
                else if (!edit.isEmpty) {
                    edits.push(edit);
                }
            }
            return new TextEdit(edits);
        }
        mapPosition(position) {
            let lineDelta = 0;
            let curLine = 0;
            let columnDeltaInCurLine = 0;
            for (const edit of this.edits) {
                const start = edit.range.getStartPosition();
                const end = edit.range.getEndPosition();
                if (position.isBeforeOrEqual(start)) {
                    break;
                }
                const len = textLength_1.TextLength.ofText(edit.text);
                if (position.isBefore(end)) {
                    const startPos = new position_1.Position(start.lineNumber + lineDelta, start.column + (start.lineNumber + lineDelta === curLine ? columnDeltaInCurLine : 0));
                    const endPos = len.addToPosition(startPos);
                    return rangeFromPositions(startPos, endPos);
                }
                lineDelta += len.lineCount - (edit.range.endLineNumber - edit.range.startLineNumber);
                if (len.lineCount === 0) {
                    if (end.lineNumber !== start.lineNumber) {
                        columnDeltaInCurLine += len.columnCount - (end.column - 1);
                    }
                    else {
                        columnDeltaInCurLine += len.columnCount - (end.column - start.column);
                    }
                }
                else {
                    columnDeltaInCurLine = len.columnCount;
                }
                curLine = end.lineNumber + lineDelta;
            }
            return new position_1.Position(position.lineNumber + lineDelta, position.column + (position.lineNumber + lineDelta === curLine ? columnDeltaInCurLine : 0));
        }
        mapRange(range) {
            function getStart(p) {
                return p instanceof position_1.Position ? p : p.getStartPosition();
            }
            function getEnd(p) {
                return p instanceof position_1.Position ? p : p.getEndPosition();
            }
            const start = getStart(this.mapPosition(range.getStartPosition()));
            const end = getEnd(this.mapPosition(range.getEndPosition()));
            return rangeFromPositions(start, end);
        }
        // TODO: `doc` is not needed for this!
        inverseMapPosition(positionAfterEdit, doc) {
            const reversed = this.inverse(doc);
            return reversed.mapPosition(positionAfterEdit);
        }
        inverseMapRange(range, doc) {
            const reversed = this.inverse(doc);
            return reversed.mapRange(range);
        }
        apply(text) {
            let result = '';
            let lastEditEnd = new position_1.Position(1, 1);
            for (const edit of this.edits) {
                const editRange = edit.range;
                const editStart = editRange.getStartPosition();
                const editEnd = editRange.getEndPosition();
                const r = rangeFromPositions(lastEditEnd, editStart);
                if (!r.isEmpty()) {
                    result += text.getValueOfRange(r);
                }
                result += edit.text;
                lastEditEnd = editEnd;
            }
            const r = rangeFromPositions(lastEditEnd, text.endPositionExclusive);
            if (!r.isEmpty()) {
                result += text.getValueOfRange(r);
            }
            return result;
        }
        applyToString(str) {
            const strText = new StringText(str);
            return this.apply(strText);
        }
        inverse(doc) {
            const ranges = this.getNewRanges();
            return new TextEdit(this.edits.map((e, idx) => new SingleTextEdit(ranges[idx], doc.getValueOfRange(e.range))));
        }
        getNewRanges() {
            const newRanges = [];
            let previousEditEndLineNumber = 0;
            let lineOffset = 0;
            let columnOffset = 0;
            for (const edit of this.edits) {
                const textLength = textLength_1.TextLength.ofText(edit.text);
                const newRangeStart = position_1.Position.lift({
                    lineNumber: edit.range.startLineNumber + lineOffset,
                    column: edit.range.startColumn + (edit.range.startLineNumber === previousEditEndLineNumber ? columnOffset : 0)
                });
                const newRange = textLength.createRange(newRangeStart);
                newRanges.push(newRange);
                lineOffset = newRange.endLineNumber - edit.range.endLineNumber;
                columnOffset = newRange.endColumn - edit.range.endColumn;
                previousEditEndLineNumber = edit.range.endLineNumber;
            }
            return newRanges;
        }
    }
    exports.TextEdit = TextEdit;
    class SingleTextEdit {
        constructor(range, text) {
            this.range = range;
            this.text = text;
        }
        get isEmpty() {
            return this.range.isEmpty() && this.text.length === 0;
        }
        static equals(first, second) {
            return first.range.equalsRange(second.range) && first.text === second.text;
        }
        toSingleEditOperation() {
            return {
                range: this.range,
                text: this.text,
            };
        }
    }
    exports.SingleTextEdit = SingleTextEdit;
    function rangeFromPositions(start, end) {
        if (start.lineNumber === end.lineNumber && start.column === Number.MAX_SAFE_INTEGER) {
            return range_1.Range.fromPositions(end, end);
        }
        else if (!start.isBeforeOrEqual(end)) {
            throw new errors_1.BugIndicatingError('start must be before end');
        }
        return new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column);
    }
    class AbstractText {
        get endPositionExclusive() {
            return this.length.addToPosition(new position_1.Position(1, 1));
        }
        getValue() {
            return this.getValueOfRange(this.length.toRange());
        }
    }
    exports.AbstractText = AbstractText;
    class LineBasedText extends AbstractText {
        constructor(_getLineContent, _lineCount) {
            (0, assert_1.assert)(_lineCount >= 1);
            super();
            this._getLineContent = _getLineContent;
            this._lineCount = _lineCount;
        }
        getValueOfRange(range) {
            if (range.startLineNumber === range.endLineNumber) {
                return this._getLineContent(range.startLineNumber).substring(range.startColumn - 1, range.endColumn - 1);
            }
            let result = this._getLineContent(range.startLineNumber).substring(range.startColumn - 1);
            for (let i = range.startLineNumber + 1; i < range.endLineNumber; i++) {
                result += '\n' + this._getLineContent(i);
            }
            result += '\n' + this._getLineContent(range.endLineNumber).substring(0, range.endColumn - 1);
            return result;
        }
        get length() {
            const lastLine = this._getLineContent(this._lineCount);
            return new textLength_1.TextLength(this._lineCount - 1, lastLine.length);
        }
    }
    exports.LineBasedText = LineBasedText;
    class StringText extends AbstractText {
        constructor(value) {
            super();
            this.value = value;
            this._t = new positionToOffset_1.PositionOffsetTransformer(this.value);
        }
        getValueOfRange(range) {
            return this._t.getOffsetRange(range).substring(this.value);
        }
        get length() {
            return this._t.textLength;
        }
    }
    exports.StringText = StringText;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEVkaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2NvcmUvdGV4dEVkaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsUUFBUTtRQUNiLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBb0IsRUFBRSxPQUFlO1lBQ3pELE9BQU8sSUFBSSxRQUFRLENBQUMsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFFRCxZQUE0QixLQUFnQztZQUFoQyxVQUFLLEdBQUwsS0FBSyxDQUEyQjtZQUMzRCxJQUFBLGlCQUFRLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSwyQkFBa0IsRUFBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0gsQ0FBQztRQUVEOztXQUVHO1FBQ0gsU0FBUztZQUNSLE1BQU0sS0FBSyxHQUFxQixFQUFFLENBQUM7WUFDbkMsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQy9CLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFBRSxDQUFDO29CQUM5RyxNQUFNLElBQUksR0FBRyxLQUFLLENB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