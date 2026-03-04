/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/textEdit"], function (require, exports, arrays_1, strings_1, position_1, range_1, textEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GhostTextReplacement = exports.GhostTextPart = exports.GhostText = void 0;
    exports.ghostTextsOrReplacementsEqual = ghostTextsOrReplacementsEqual;
    exports.ghostTextOrReplacementEquals = ghostTextOrReplacementEquals;
    class GhostText {
        constructor(lineNumber, parts) {
            this.lineNumber = lineNumber;
            this.parts = parts;
        }
        equals(other) {
            return this.lineNumber === other.lineNumber &&
                this.parts.length === other.parts.length &&
                this.parts.every((part, index) => part.equals(other.parts[index]));
        }
        /**
         * Only used for testing/debugging.
        */
        render(documentText, debug = false) {
            return new textEdit_1.TextEdit([
                ...this.parts.map(p => new textEdit_1.SingleTextEdit(range_1.Range.fromPositions(new position_1.Position(this.lineNumber, p.column)), debug ? `[${p.lines.join('\n')}]` : p.lines.join('\n'))),
            ]).applyToString(documentText);
        }
        renderForScreenReader(lineText) {
            if (this.parts.length === 0) {
                return '';
            }
            const lastPart = this.parts[this.parts.length - 1];
            const cappedLineText = lineText.substr(0, lastPart.column - 1);
            const text = new textEdit_1.TextEdit([
                ...this.parts.map(p => new textEdit_1.SingleTextEdit(range_1.Range.fromPositions(new position_1.Position(1, p.column)), p.lines.join('\n'))),
            ]).applyToString(cappedLineText);
            return text.substring(this.parts[0].column - 1);
        }
        isEmpty() {
            return this.parts.every(p => p.lines.length === 0);
        }
        get lineCount() {
            return 1 + this.parts.reduce((r, p) => r + p.lines.length - 1, 0);
        }
    }
    exports.GhostText = GhostText;
    class GhostTextPart {
        constructor(column, text, 
        /**
         * Indicates if this part is a preview of an inline suggestion when a suggestion is previewed.
        */
        preview) {
            this.column = column;
            this.text = text;
            this.preview = preview;
            this.lines = (0, strings_1.splitLines)(this.text);
        }
        ;
        equals(other) {
            return this.column === other.column &&
                this.lines.length === other.lines.length &&
                this.lines.every((line, index) => line === other.lines[index]);
        }
    }
    exports.GhostTextPart = GhostTextPart;
    class GhostTextReplacement {
        constructor(lineNumber, columnRange, text, additionalReservedLineCount = 0) {
            this.lineNumber = lineNumber;
            this.columnRange = columnRange;
            this.text = text;
            this.additionalReservedLineCount = additionalReservedLineCount;
            this.parts = [
                new GhostTextPart(this.columnRange.endColumnExclusive, this.text, false),
            ];
            this.newLines = (0, strings_1.splitLines)(this.text);
        }
        renderForScreenReader(_lineText) {
            return this.newLines.join('\n');
        }
        render(documentText, debug = false) {
            const replaceRange = this.columnRange.toRange(this.lineNumber);
            if (debug) {
                return new textEdit_1.TextEdit([
                    new textEdit_1.SingleTextEdit(range_1.Range.fromPositions(replaceRange.getStartPosition()), '('),
                    new textEdit_1.SingleTextEdit(range_1.Range.fromPositions(replaceRange.getEndPosition()), `)[${this.newLines.join('\n')}]`),
                ]).applyToString(documentText);
            }
            else {
                return new textEdit_1.TextEdit([
                    new textEdit_1.SingleTextEdit(replaceRange, this.newLines.join('\n')),
                ]).applyToString(documentText);
            }
        }
        get lineCount() {
            return this.newLines.length;
        }
        isEmpty() {
            return this.parts.every(p => p.lines.length === 0);
        }
        equals(other) {
            return this.lineNumber === other.lineNumber &&
                this.columnRange.equals(other.columnRange) &&
                this.newLines.length === other.newLines.length &&
                this.newLines.every((line, index) => line === other.newLines[index]) &&
                this.additionalReservedLineCount === other.additionalReservedLineCount;
        }
    }
    exports.GhostTextReplacement = GhostTextReplacement;
    function ghostTextsOrReplacementsEqual(a, b) {
        return (0, arrays_1.equals)(a, b, ghostTextOrReplacementEquals);
    }
    function ghostTextOrReplacementEquals(a, b) {
        if (a === b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        if (a instanceof GhostText && b instanceof GhostText) {
            return a.equals(b);
        }
        if (a instanceof GhostTextReplacement && b instanceof GhostTextReplacement) {
            return a.equals(b);
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2hvc3RUZXh0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5saW5lQ29tcGxldGlvbnMvYnJvd3Nlci9naG9zdFRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0loRyxzRUFFQztJQUVELG9FQWNDO0lBakpELE1BQWEsU0FBUztRQUNyQixZQUNpQixVQUFrQixFQUNsQixLQUFzQjtZQUR0QixlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ2xCLFVBQUssR0FBTCxLQUFLLENBQWlCO1FBRXZDLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBZ0I7WUFDdEIsT0FBTyxJQUFJLENBQUMsVUFBVSxLQUFLLEtBQUssQ0FBQyxVQUFVO2dCQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU07Z0JBQ3hDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBRUQ7O1VBRUU7UUFDRixNQUFNLENBQUMsWUFBb0IsRUFBRSxRQUFpQixLQUFLO1lBQ2xELE9BQU8sSUFBSSxtQkFBUSxDQUFDO2dCQUNuQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSx5QkFBYyxDQUN4QyxhQUFLLENBQUMsYUFBYSxDQUFDLElBQUksbUJBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUM1RCxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUks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