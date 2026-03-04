/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/editor/common/core/offsetRange", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/diff/defaultLinesDiffComputer/utils"], function (require, exports, arraysFind_1, offsetRange_1, position_1, range_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinesSliceCharSequence = void 0;
    class LinesSliceCharSequence {
        constructor(lines, lineRange, considerWhitespaceChanges) {
            // This slice has to have lineRange.length many \n! (otherwise diffing against an empty slice will be problematic)
            // (Unless it covers the entire document, in that case the other slice also has to cover the entire document ands it's okay)
            this.lines = lines;
            this.considerWhitespaceChanges = considerWhitespaceChanges;
            this.elements = [];
            this.firstCharOffsetByLine = [];
            // To account for trimming
            this.additionalOffsetByLine = [];
            // If the slice covers the end, but does not start at the beginning, we include just the \n of the previous line.
            let trimFirstLineFully = false;
            if (lineRange.start > 0 && lineRange.endExclusive >= lines.length) {
                lineRange = new offsetRange_1.OffsetRange(lineRange.start - 1, lineRange.endExclusive);
                trimFirstLineFully = true;
            }
            this.lineRange = lineRange;
            this.firstCharOffsetByLine[0] = 0;
            for (let i = this.lineRange.start; i < this.lineRange.endExclusive; i++) {
                let line = lines[i];
                let offset = 0;
                if (trimFirstLineFully) {
                    offset = line.length;
                    line = '';
                    trimFirstLineFully = false;
                }
                else if (!considerWhitespaceChanges) {
                    const trimmedStartLine = line.trimStart();
                    offset = line.length - trimmedStartLine.length;
                    line = trimmedStartLine.trimEnd();
                }
                this.additionalOffsetByLine.push(offset);
                for (let i = 0; i < line.length; i++) {
                    this.elements.push(line.charCodeAt(i));
                }
                // Don't add an \n that does not exist in the document.
                if (i < lines.length - 1) {
                    this.elements.push('\n'.charCodeAt(0));
                    this.firstCharOffsetByLine[i - this.lineRange.start + 1] = this.elements.length;
                }
            }
            // To account for the last line
            this.additionalOffsetByLine.push(0);
        }
        toString() {
            return `Slice: "${this.text}"`;
        }
        get text() {
            return this.getText(new offsetRange_1.OffsetRange(0, this.length));
        }
        getText(range) {
            return this.elements.slice(range.start, range.endExclusive).map(e => String.fromCharCode(e)).join('');
        }
        getElement(offset) {
            return this.elements[offset];
        }
        get length() {
            return this.elements.length;
        }
        getBoundaryScore(length) {
            //   a   b   c   ,           d   e   f
            // 11  0   0   12  15  6   13  0   0   11
            const prevCategory = getCategory(length > 0 ? this.elements[length - 1] : -1);
            const nextCategory = getCategory(length < this.elements.length ? this.elements[length] : -1);
            if (prevCategory === 7 /* CharBoundaryCategory.LineBreakCR */ && nextCategory === 8 /* CharBoundaryCategory.LineBreakLF */) {
                // don't break between \r and \n
                return 0;
            }
            if (prevCategory === 8 /* CharBoundaryCategory.LineBreakLF */) {
                // prefer the linebreak before the change
                return 150;
            }
            let score = 0;
            if (prevCategory !== nextCategory) {
                score += 10;
                if (prevCategory === 0 /* CharBoundaryCategory.WordLower */ && nextCategory === 1 /* CharBoundaryCategory.WordUpper */) {
                    score += 1;
                }
            }
            score += getCategoryBoundaryScore(prevCategory);
            score += getCategoryBoundaryScore(nextCategory);
            return score;
        }
        translateOffset(offset) {
            // find smallest i, so that lineBreakOffsets[i] <= offset using binary search
            if (this.lineRange.isEmpty) {
                return new position_1.Position(this.lineRange.start + 1, 1);
            }
            const i = (0, arraysFind_1.findLastIdxMonotonous)(this.firstCharOffsetByLine, (value) => value <= offset);
            return new position_1.Position(this.lineRange.start + i + 1, offset - this.firstCharOffsetByLine[i] + this.additionalOffsetByLine[i] + 1);
        }
        translateRange(range) {
            return range_1.Range.fromPositions(this.translateOffset(range.start), this.translateOffset(range.endExclusive));
        }
        /**
         * Finds the word that contains the character at the given offset
         */
        findWordContaining(offset) {
            if (offset < 0 || offset >= this.elements.length) {
                return undefined;
            }
            if (!isWordChar(this.elements[offset])) {
                return undefined;
            }
            // find start
            let start = offset;
            while (start > 0 && isWordChar(this.elements[start - 1])) {
                start--;
            }
            // find end
            let end = offset;
            while (end < this.elements.length && isWordChar(this.elements[end])) {
                end++;
            }
            return new offsetRange_1.OffsetRange(start, end);
        }
        countLinesIn(range) {
            return this.translateOffset(range.endExclusive).lineNumber - this.translateOffset(range.start).lineNumber;
        }
        isStronglyEqual(offset1, offset2) {
            return this.elements[offset1] === this.elements[offset2];
        }
        extendToFullLines(range) {
            const start = (0, arraysFind_1.findLastMonotonous)(this.firstCharOffsetByLine, x => x <= range.start) ?? 0;
            const end = (0, arraysFind_1.findFirstMonotonous)(this.firstCharOffsetByLine, x => range.endExclusive <= x) ?? this.elements.length;
            return new offsetRange_1.OffsetRange(start, end);
        }
    }
    exports.LinesSliceCharSequence = LinesSliceCharSequence;
    function isWordChar(charCode) {
        return charCode >= 97 /* CharCode.a */ && charCode <= 122 /* CharCode.z */
            || charCode >= 65 /* CharCode.A */ && charCode <= 90 /* CharCode.Z */
            || charCode >= 48 /* CharCode.Digit0 */ && charCode <= 57 /* CharCode.Digit9 */;
    }
    var CharBoundaryCategory;
    (function (CharBoundaryCategory) {
        CharBoundaryCategory[CharBoundaryCategory["WordLower"] = 0] = "WordLower";
        CharBoundaryCategory[CharBoundaryCategory["WordUpper"] = 1] = "WordUpper";
        CharBoundaryCategory[CharBoundaryCategory["WordNumber"] = 2] = "WordNumber";
        CharBoundaryCategory[CharBoundaryCategory["End"] = 3] = "End";
        CharBoundaryCategory[CharBoundaryCategory["Other"] = 4] = "Other";
        CharBoundaryCategory[CharBoundaryCategory["Separator"] = 5] = "Separator";
        CharBoundaryCategory[CharBoundaryCategory["Space"] = 6] = "Space";
        CharBoundaryCategory[CharBoundaryCategory["LineBreakCR"] = 7] = "LineBreakCR";
        CharBoundaryCategory[CharBoundaryCategory["LineBreakLF"] = 8] = "LineBreakLF";
    })(CharBoundaryCategory || (CharBoundaryCategory = {}));
    const score = {
        [0 /* CharBoundaryCategory.WordLower */]: 0,
        [1 /* CharBoundaryCategory.WordUpper */]: 0,
        [2 /* CharBoundaryCategory.WordNumber */]: 0,
        [3 /* CharBoundaryCategory.End */]: 10,
        [4 /* CharBoundaryCategory.Other */]: 2,
        [5 /* CharBoundaryCategory.Separator */]: 30,
        [6 /* CharBoundaryCategory.Space */]: 3,
        [7 /* CharBoundaryCategory.LineBreakCR */]: 10,
        [8 /* CharBoundaryCategory.LineBreakLF */]: 10,
    };
    function getCategoryBoundaryScore(category) {
        return score[category];
    }
    function getCategory(charCode) {
        if (charCode === 10 /* CharCode.LineFeed */) {
            return 8 /* CharBoundaryCategory.LineBreakLF */;
        }
        else if (charCode === 13 /* CharCode.CarriageReturn */) {
            return 7 /* CharBoundaryCategory.LineBreakCR */;
        }
        else if ((0, utils_1.isSpace)(charCode)) {
            return 6 /* CharBoundaryCategory.Space */;
        }
        else if (charCode >= 97 /* CharCode.a */ && charCode <= 122 /* CharCode.z */) {
            return 0 /* CharBoundaryCategory.WordLower */;
        }
        else if (charCode >= 65 /* CharCode.A */ && charCode <= 90 /* CharCode.Z */) {
            return 1 /* CharBoundaryCategory.WordUpper */;
        }
        else if (charCode >= 48 /* CharCode.Digit0 */ && charCode <= 57 /* CharCode.Digit9 */) {
            return 2 /* CharBoundaryCategory.WordNumber */;
        }
        else if (charCode === -1) {
            return 3 /* CharBoundaryCategory.End */;
        }
        else if (charCode === 44 /* CharCode.Comma */ || charCode === 59 /* CharCode.Semicolon */) {
            return 5 /* CharBoundaryCategory.Separator */;
        }
        else {
            return 4 /* CharBoundaryCategory.Other */;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZXNTbGljZUNoYXJTZXF1ZW5jZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vZGlmZi9kZWZhdWx0TGluZXNEaWZmQ29tcHV0ZXIvbGluZXNTbGljZUNoYXJTZXF1ZW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxzQkFBc0I7UUFPbEMsWUFBNEIsS0FBZSxFQUFFLFNBQXNCLEVBQWtCLHlCQUFrQztZQUN0SCxrSEFBa0g7WUFDbEgsNEhBQTRIO1lBRmpHLFVBQUssR0FBTCxLQUFLLENBQVU7WUFBMEMsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUFTO1lBTnRHLGFBQVEsR0FBYSxFQUFFLENBQUM7WUFDeEIsMEJBQXFCLEdBQWEsRUFBRSxDQUFDO1lBRXRELDBCQUEwQjtZQUNULDJCQUFzQixHQUFhLEVBQUUsQ0FBQztZQU10RCxpSEFBaUg7WUFDakgsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7WUFDL0IsSUFBSSxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxTQUFTLENBQUMsWUFBWSxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbkUsU0FBUyxHQUFHLElBQUkseUJBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3pFLGtCQUFrQixHQUFHLElBQUksQ0FBQztZQUMzQixDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFFM0IsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsR0FB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