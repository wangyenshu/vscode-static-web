/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/range"], function (require, exports, strings_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordSelectionRangeProvider = void 0;
    class WordSelectionRangeProvider {
        constructor(selectSubwords = true) {
            this.selectSubwords = selectSubwords;
        }
        provideSelectionRanges(model, positions) {
            const result = [];
            for (const position of positions) {
                const bucket = [];
                result.push(bucket);
                if (this.selectSubwords) {
                    this._addInWordRanges(bucket, model, position);
                }
                this._addWordRanges(bucket, model, position);
                this._addWhitespaceLine(bucket, model, position);
                bucket.push({ range: model.getFullModelRange() });
            }
            return result;
        }
        _addInWordRanges(bucket, model, pos) {
            const obj = model.getWordAtPosition(pos);
            if (!obj) {
                return;
            }
            const { word, startColumn } = obj;
            const offset = pos.column - startColumn;
            let start = offset;
            let end = offset;
            let lastCh = 0;
            // LEFT anchor (start)
            for (; start >= 0; start--) {
                const ch = word.charCodeAt(start);
                if ((start !== offset) && (ch === 95 /* CharCode.Underline */ || ch === 45 /* CharCode.Dash */)) {
                    // foo-bar OR foo_bar
                    break;
                }
                else if ((0, strings_1.isLowerAsciiLetter)(ch) && (0, strings_1.isUpperAsciiLetter)(lastCh)) {
                    // fooBar
                    break;
                }
                lastCh = ch;
            }
            start += 1;
            // RIGHT anchor (end)
            for (; end < word.length; end++) {
                const ch = word.charCodeAt(end);
                if ((0, strings_1.isUpperAsciiLetter)(ch) && (0, strings_1.isLowerAsciiLetter)(lastCh)) {
                    // fooBar
                    break;
                }
                else if (ch === 95 /* CharCode.Underline */ || ch === 45 /* CharCode.Dash */) {
                    // foo-bar OR foo_bar
                    break;
                }
                lastCh = ch;
            }
            if (start < end) {
                bucket.push({ range: new range_1.Range(pos.lineNumber, startColumn + start, pos.lineNumber, startColumn + end) });
            }
        }
        _addWordRanges(bucket, model, pos) {
            const word = model.getWordAtPosition(pos);
            if (word) {
                bucket.push({ range: new range_1.Range(pos.lineNumber, word.startColumn, pos.lineNumber, word.endColumn) });
            }
        }
        _addWhitespaceLine(bucket, model, pos) {
            if (model.getLineLength(pos.lineNumber) > 0
                && model.getLineFirstNonWhitespaceColumn(pos.lineNumber) === 0
                && model.getLineLastNonWhitespaceColumn(pos.lineNumber) === 0) {
                bucket.push({ range: new range_1.Range(pos.lineNumber, 1, pos.lineNumber, model.getLineMaxColumn(pos.lineNumber)) });
            }
        }
    }
    exports.WordSelectionRangeProvider = WordSelectionRangeProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZFNlbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zbWFydFNlbGVjdC9icm93c2VyL3dvcmRTZWxlY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLDBCQUEwQjtRQUV0QyxZQUE2QixpQkFBaUIsSUFBSTtZQUFyQixtQkFBYyxHQUFkLGNBQWMsQ0FBTztRQUFJLENBQUM7UUFFdkQsc0JBQXNCLENBQUMsS0FBaUIsRUFBRSxTQUFxQjtZQUM5RCxNQUFNLE1BQU0sR0FBdUIsRUFBRSxDQUFDO1lBQ3RDLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sTUFBTSxHQUFxQixFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BCLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDaEQsQ0FBQztnQkFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRU8sZ0JBQWdCLENBQUMsTUFBd0IsRUFBRSxLQUFpQixFQUFFLEdBQWE7WUFDbEYsTUFB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