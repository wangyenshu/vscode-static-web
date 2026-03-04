/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/strings", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/beforeEditPositionMapper", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length"], function (require, exports, assert, strings_1, utils_1, range_1, beforeEditPositionMapper_1, length_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextEdit = void 0;
    suite('Bracket Pair Colorizer - BeforeEditPositionMapper', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Single-Line 1', () => {
            assert.deepStrictEqual(compute([
                '0123456789',
            ], [
                new TextEdit((0, length_1.toLength)(0, 4), (0, length_1.toLength)(0, 7), 'xy')
            ]), [
                '0  1  2  3  x  y  7  8  9  ', // The line
                '0  0  0  0  0  0  0  0  0  0  ', // the old line numbers
                '0  1  2  3  4  5  7  8  9  10 ', // the old columns
                '0  0  0  0  0  0  ∞  ∞  ∞  ∞  ', // line count until next change
                '4  3  2  1  0  0  ∞  ∞  ∞  ∞  ', // column count until next change
            ]);
        });
        test('Single-Line 2', () => {
            assert.deepStrictEqual(compute([
                '0123456789',
            ], [
                new TextEdit((0, length_1.toLength)(0, 2), (0, length_1.toLength)(0, 4), 'xxxx'),
                new TextEdit((0, length_1.toLength)(0, 6), (0, length_1.toLength)(0, 6), 'yy')
            ]), [
                '0  1  x  x  x  x  4  5  y  y  6  7  8  9  ',
                '0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  ',
                '0  1  2  3  4  5  4  5  6  7  6  7  8  9  10 ',
                '0  0  0  0  0  0  0  0  0  0  ∞  ∞  ∞  ∞  ∞  ',
                '2  1  0  0  0  0  2  1  0  0  ∞  ∞  ∞  ∞  ∞  ',
            ]);
        });
        test('Multi-Line Replace 1', () => {
            assert.deepStrictEqual(compute([
                '₀₁₂₃₄₅₆₇₈₉',
                '0123456789',
                '⁰¹²³⁴⁵⁶⁷⁸⁹',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(1, 3), 'xy'),
            ]), [
                '₀  ₁  ₂  x  y  3  4  5  6  7  8  9  ',
                '0  0  0  0  0  1  1  1  1  1  1  1  1  ',
                '0  1  2  3  4  3  4  5  6  7  8  9  10 ',
                "0  0  0  0  0  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ",
                '3  2  1  0  0  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
                // ------------------
                '⁰  ¹  ²  ³  ⁴  ⁵  ⁶  ⁷  ⁸  ⁹  ',
                '2  2  2  2  2  2  2  2  2  2  2  ',
                '0  1  2  3  4  5  6  7  8  9  10 ',
                '∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
                '∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
            ]);
        });
        test('Multi-Line Replace 2', () => {
            assert.deepStrictEqual(compute([
                '₀₁₂₃₄₅₆₇₈₉',
                '012345678',
                '⁰¹²³⁴⁵⁶⁷⁸⁹',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(1, 0), 'ab'),
                new TextEdit((0, length_1.toLength)(1, 5), (0, length_1.toLength)(1, 7), 'c'),
            ]), [
                '₀  ₁  ₂  a  b  0  1  2  3  4  c  7  8  ',
                '0  0  0  0  0  1  1  1  1  1  1  1  1  1  ',
                '0  1  2  3  4  0  1  2  3  4  5  7  8  9  ',
                '0  0  0  0  0  0  0  0  0  0  0  ∞  ∞  ∞  ',
                '3  2  1  0  0  5  4  3  2  1  0  ∞  ∞  ∞  ',
                // ------------------
                '⁰  ¹  ²  ³  ⁴  ⁵  ⁶  ⁷  ⁸  ⁹  ',
                '2  2  2  2  2  2  2  2  2  2  2  ',
                '0  1  2  3  4  5  6  7  8  9  10 ',
                '∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
                '∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
            ]);
        });
        test('Multi-Line Replace 3', () => {
            assert.deepStrictEqual(compute([
                '₀₁₂₃₄₅₆₇₈₉',
                '012345678',
                '⁰¹²³⁴⁵⁶⁷⁸⁹',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(1, 0), 'ab'),
                new TextEdit((0, length_1.toLength)(1, 5), (0, length_1.toLength)(1, 7), 'c'),
                new TextEdit((0, length_1.toLength)(1, 8), (0, length_1.toLength)(2, 4), 'd'),
            ]), [
                '₀  ₁  ₂  a  b  0  1  2  3  4  c  7  d  ⁴  ⁵  ⁶  ⁷  ⁸  ⁹  ',
                '0  0  0  0  0  1  1  1  1  1  1  1  1  2  2  2  2  2  2  2  ',
                '0  1  2  3  4  0  1  2  3  4  5  7  8  4  5  6  7  8  9  10 ',
                '0  0  0  0  0  0  0  0  0  0  0  0  0  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
                '3  2  1  0  0  5  4  3  2  1  0  1  0  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
            ]);
        });
        test('Multi-Line Insert 1', () => {
            assert.deepStrictEqual(compute([
                '012345678',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(0, 5), 'a\nb'),
            ]), [
                '0  1  2  a  ',
                '0  0  0  0  0  ',
                '0  1  2  3  4  ',
                '0  0  0  0  0  ',
                '3  2  1  0  0  ',
                // ------------------
                'b  5  6  7  8  ',
                '1  0  0  0  0  0  ',
                '0  5  6  7  8  9  ',
                '0  ∞  ∞  ∞  ∞  ∞  ',
                '0  ∞  ∞  ∞  ∞  ∞  ',
            ]);
        });
        test('Multi-Line Insert 2', () => {
            assert.deepStrictEqual(compute([
                '012345678',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(0, 5), 'a\nb'),
                new TextEdit((0, length_1.toLength)(0, 7), (0, length_1.toLength)(0, 8), 'x\ny'),
            ]), [
                '0  1  2  a  ',
                '0  0  0  0  0  ',
                '0  1  2  3  4  ',
                '0  0  0  0  0  ',
                '3  2  1  0  0  ',
                // ------------------
                'b  5  6  x  ',
                '1  0  0  0  0  ',
                '0  5  6  7  8  ',
                '0  0  0  0  0  ',
                '0  2  1  0  0  ',
                // ------------------
                'y  8  ',
                '1  0  0  ',
                '0  8  9  ',
                '0  ∞  ∞  ',
                '0  ∞  ∞  ',
            ]);
        });
        test('Multi-Line Replace/Insert 1', () => {
            assert.deepStrictEqual(compute([
                '₀₁₂₃₄₅₆₇₈₉',
                '012345678',
                '⁰¹²³⁴⁵⁶⁷⁸⁹',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(1, 1), 'aaa\nbbb'),
            ]), [
                '₀  ₁  ₂  a  a  a  ',
                '0  0  0  0  0  0  0  ',
                '0  1  2  3  4  5  6  ',
                '0  0  0  0  0  0  0  ',
                '3  2  1  0  0  0  0  ',
                // ------------------
                'b  b  b  1  2  3  4  5  6  7  8  ',
                '1  1  1  1  1  1  1  1  1  1  1  1  ',
                '0  1  2  1  2  3  4  5  6  7  8  9  ',
                '0  0  0  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
                '0  0  0  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
                // ------------------
                '⁰  ¹  ²  ³  ⁴  ⁵  ⁶  ⁷  ⁸  ⁹  ',
                '2  2  2  2  2  2  2  2  2  2  2  ',
                '0  1  2  3  4  5  6  7  8  9  10 ',
                '∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
                '∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
            ]);
        });
        test('Multi-Line Replace/Insert 2', () => {
            assert.deepStrictEqual(compute([
                '₀₁₂₃₄₅₆₇₈₉',
                '012345678',
                '⁰¹²³⁴⁵⁶⁷⁸⁹',
            ], [
                new TextEdit((0, length_1.toLength)(0, 3), (0, length_1.toLength)(1, 1), 'aaa\nbbb'),
                new TextEdit((0, length_1.toLength)(1, 5), (0, length_1.toLength)(1, 5), 'x\ny'),
                new TextEdit((0, length_1.toLength)(1, 7), (0, length_1.toLength)(2, 4), 'k\nl'),
            ]), [
                '₀  ₁  ₂  a  a  a  ',
                '0  0  0  0  0  0  0  ',
                '0  1  2  3  4  5  6  ',
                '0  0  0  0  0  0  0  ',
                '3  2  1  0  0  0  0  ',
                // ------------------
                'b  b  b  1  2  3  4  x  ',
                '1  1  1  1  1  1  1  1  1  ',
                '0  1  2  1  2  3  4  5  6  ',
                '0  0  0  0  0  0  0  0  0  ',
                '0  0  0  4  3  2  1  0  0  ',
                // ------------------
                'y  5  6  k  ',
                '2  1  1  1  1  ',
                '0  5  6  7  8  ',
                '0  0  0  0  0  ',
                '0  2  1  0  0  ',
                // ------------------
                'l  ⁴  ⁵  ⁶  ⁷  ⁸  ⁹  ',
                '2  2  2  2  2  2  2  2  ',
                '0  4  5  6  7  8  9  10 ',
                '0  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
                '0  ∞  ∞  ∞  ∞  ∞  ∞  ∞  ',
            ]);
        });
    });
    /** @pure */
    function compute(inputArr, edits) {
        const newLines = (0, strings_1.splitLines)(applyLineColumnEdits(inputArr.join('\n'), edits.map(e => ({
            text: e.newText,
            range: range_1.Range.fromPositions((0, length_1.lengthToPosition)(e.startOffset), (0, length_1.lengthToPosition)(e.endOffset))
        }))));
        const mapper = new beforeEditPositionMapper_1.BeforeEditPositionMapper(edits);
        const result = new Array();
        let lineIdx = 0;
        for (const line of newLines) {
            let lineLine = '';
            let colLine = '';
            let lineStr = '';
            let colDist = '';
            let lineDist = '';
            for (let colIdx = 0; colIdx <= line.length; colIdx++) {
                const before = mapper.getOffsetBeforeChange((0, length_1.toLength)(lineIdx, colIdx));
                const beforeObj = (0, length_1.lengthToObj)(before);
                if (colIdx < line.length) {
                    lineStr += rightPad(line[colIdx], 3);
                }
                lineLine += rightPad('' + beforeObj.lineCount, 3);
                colLine += rightPad('' + beforeObj.columnCount, 3);
                const distLen = mapper.getDistanceToNextChange((0, length_1.toLength)(lineIdx, colIdx));
                if (distLen === null) {
                    lineDist += '∞  ';
                    colDist += '∞  ';
                }
                else {
                    const dist = (0, length_1.lengthToObj)(distLen);
                    lineDist += rightPad('' + dist.lineCount, 3);
                    colDist += rightPad('' + dist.columnCount, 3);
                }
            }
            result.push(lineStr);
            result.push(lineLine);
            result.push(colLine);
            result.push(lineDist);
            result.push(colDist);
            lineIdx++;
        }
        return result;
    }
    class TextEdit extends beforeEditPositionMapper_1.TextEditInfo {
        constructor(startOffset, endOffset, newText) {
            super(startOffset, endOffset, (0, length_1.lengthOfString)(newText));
            this.newText = newText;
        }
    }
    exports.TextEdit = TextEdit;
    class PositionOffsetTransformer {
        constructor(text) {
            this.lineStartOffsetByLineIdx = [];
            this.lineStartOffsetByLineIdx.push(0);
            for (let i = 0; i < text.length; i++) {
                if (text.charAt(i) === '\n') {
                    this.lineStartOffsetByLineIdx.push(i + 1);
                }
            }
        }
        getOffset(position) {
            return this.lineStartOffsetByLineIdx[position.lineNumber - 1] + position.column - 1;
        }
    }
    function applyLineColumnEdits(text, edits) {
        const transformer = new PositionOffsetTransformer(text);
        const offsetEdits = edits.map(e => {
            const range = range_1.Range.lift(e.range);
            return ({
                startOffset: transformer.getOffset(range.getStartPosition()),
                endOffset: transformer.getOffset(range.getEndPosition()),
                text: e.text
            });
        });
        offsetEdits.sort((a, b) => b.startOffset - a.startOffset);
        for (const edit of offsetEdits) {
            text = text.substring(0, edit.startOffset) + edit.text + text.substring(edit.endOffset);
        }
        return text;
    }
    function rightPad(str, len) {
        while (str.length < len) {
            str += ' ';
        }
        return str;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVmb3JlRWRpdFBvc2l0aW9uTWFwcGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZWwvYnJhY2tldFBhaXJDb2xvcml6ZXIvYmVmb3JlRWRpdFBvc2l0aW9uTWFwcGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLEtBQUssQ0FBQyxtREFBbUQsRUFBRSxHQUFHLEVBQUU7UUFFL0QsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1lBQzFCLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLE9BQU8sQ0FDTjtnQkFDQyxZQUFZO2FBQ1osRUFDRDtnQkFDQyxJQUFJLFFBQVEsQ0FBQyxJQUFBLGlCQUFRLEVBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUEsaUJBQVEsRUFBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDO2FBQ2xELENBQ0QsRUFDRDtnQkFDQyw2QkFBNkIsRUFBRSxXQUFXO2dCQUUxQyxnQ0FBZ0MsRUFBRSx1QkFBdUI7Z0JBQ3pELGdDQUFnQyxFQUFFLGtCQUFrQjtnQkFFcEQsZ0NBQWdDLEVBQUUsK0JBQStCO2dCQUNqRSxnQ0FBZ0MsRUFBRSxpQ0FBaUM7YUFDbkUsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtZQUMxQixNQUFNLENBQUMsZUFBZSxDQUNyQixPQUFPLENBQ047Z0JBQ0MsWUFBWTthQUNaLEVBQ0Q7Z0JBQ0MsSUFBSSxRQUFRLENBQUMsSUFBQSxpQkFBUSxFQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFBLGlCQUFRLEVBQUMsQ0FBQyxFQUFF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