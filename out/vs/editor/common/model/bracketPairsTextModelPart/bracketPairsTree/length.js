/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/textLength"], function (require, exports, strings_1, position_1, range_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lengthZero = void 0;
    exports.lengthDiff = lengthDiff;
    exports.lengthIsZero = lengthIsZero;
    exports.toLength = toLength;
    exports.lengthToObj = lengthToObj;
    exports.lengthGetLineCount = lengthGetLineCount;
    exports.lengthGetColumnCountIfZeroLineCount = lengthGetColumnCountIfZeroLineCount;
    exports.lengthAdd = lengthAdd;
    exports.sumLengths = sumLengths;
    exports.lengthEquals = lengthEquals;
    exports.lengthDiffNonNegative = lengthDiffNonNegative;
    exports.lengthLessThan = lengthLessThan;
    exports.lengthLessThanEqual = lengthLessThanEqual;
    exports.lengthGreaterThanEqual = lengthGreaterThanEqual;
    exports.lengthToPosition = lengthToPosition;
    exports.positionToLength = positionToLength;
    exports.lengthsToRange = lengthsToRange;
    exports.lengthOfRange = lengthOfRange;
    exports.lengthCompare = lengthCompare;
    exports.lengthOfString = lengthOfString;
    exports.lengthOfStringObj = lengthOfStringObj;
    exports.lengthHash = lengthHash;
    exports.lengthMax = lengthMax;
    /**
     * The end must be greater than or equal to the start.
    */
    function lengthDiff(startLineCount, startColumnCount, endLineCount, endColumnCount) {
        return (startLineCount !== endLineCount)
            ? toLength(endLineCount - startLineCount, endColumnCount)
            : toLength(0, endColumnCount - startColumnCount);
    }
    exports.lengthZero = 0;
    function lengthIsZero(length) {
        return length === 0;
    }
    /*
     * We have 52 bits available in a JS number.
     * We use the upper 26 bits to store the line and the lower 26 bits to store the column.
     */
    ///*
    const factor = 2 ** 26;
    /*/
    const factor = 1000000;
    // */
    function toLength(lineCount, columnCount) {
        // llllllllllllllllllllllllllcccccccccccccccccccccccccc (52 bits)
        //       line count (26 bits)    column count (26 bits)
        // If there is no overflow (all values/sums below 2^26 = 67108864),
        // we have `toLength(lns1, cols1) + toLength(lns2, cols2) = toLength(lns1 + lns2, cols1 + cols2)`.
        return (lineCount * factor + columnCount);
    }
    function lengthToObj(length) {
        const l = length;
        const lineCount = Math.floor(l / factor);
        const columnCount = l - lineCount * factor;
        return new textLength_1.TextLength(lineCount, columnCount);
    }
    function lengthGetLineCount(length) {
        return Math.floor(length / factor);
    }
    /**
     * Returns the amount of columns of the given length, assuming that it does not span any line.
    */
    function lengthGetColumnCountIfZeroLineCount(length) {
        return length;
    }
    function lengthAdd(l1, l2) {
        let r = l1 + l2;
        if (l2 >= factor) {
            r = r - (l1 % factor);
        }
        return r;
    }
    function sumLengths(items, lengthFn) {
        return items.reduce((a, b) => lengthAdd(a, lengthFn(b)), exports.lengthZero);
    }
    function lengthEquals(length1, length2) {
        return length1 === length2;
    }
    /**
     * Returns a non negative length `result` such that `lengthAdd(length1, result) = length2`, or zero if such length does not exist.
     */
    function lengthDiffNonNegative(length1, length2) {
        const l1 = length1;
        const l2 = length2;
        const diff = l2 - l1;
        if (diff <= 0) {
            // line-count of length1 is higher than line-count of length2
            // or they are equal and column-count of length1 is higher than column-count of length2
            return exports.lengthZero;
        }
        const lineCount1 = Math.floor(l1 / factor);
        const lineCount2 = Math.floor(l2 / factor);
        const colCount2 = l2 - lineCount2 * factor;
        if (lineCount1 === lineCount2) {
            const colCount1 = l1 - lineCount1 * factor;
            return toLength(0, colCount2 - colCount1);
        }
        else {
            return toLength(lineCount2 - lineCount1, colCount2);
        }
    }
    function lengthLessThan(length1, length2) {
        // First, compare line counts, then column counts.
        return length1 < length2;
    }
    function lengthLessThanEqual(length1, length2) {
        return length1 <= length2;
    }
    function lengthGreaterThanEqual(length1, length2) {
        return length1 >= length2;
    }
    function lengthToPosition(length) {
        const l = length;
        const lineCount = Math.floor(l / factor);
        const colCount = l - lineCount * factor;
        return new position_1.Position(lineCount + 1, colCount + 1);
    }
    function positionToLength(position) {
        return toLength(position.lineNumber - 1, position.column - 1);
    }
    function lengthsToRange(lengthStart, lengthEnd) {
        const l = lengthStart;
        const lineCount = Math.floor(l / factor);
        const colCount = l - lineCount * factor;
        const l2 = lengthEnd;
        const lineCount2 = Math.floor(l2 / factor);
        const colCount2 = l2 - lineCount2 * factor;
        return new range_1.Range(lineCount + 1, colCount + 1, lineCount2 + 1, colCount2 + 1);
    }
    function lengthOfRange(range) {
        if (range.startLineNumber === range.endLineNumber) {
            return new textLength_1.TextLength(0, range.endColumn - range.startColumn);
        }
        else {
            return new textLength_1.TextLength(range.endLineNumber - range.startLineNumber, range.endColumn - 1);
        }
    }
    function lengthCompare(length1, length2) {
        const l1 = length1;
        const l2 = length2;
        return l1 - l2;
    }
    function lengthOfString(str) {
        const lines = (0, strings_1.splitLines)(str);
        return toLength(lines.length - 1, lines[lines.length - 1].length);
    }
    function lengthOfStringObj(str) {
        const lines = (0, strings_1.splitLines)(str);
        return new textLength_1.TextLength(lines.length - 1, lines[lines.length - 1].length);
    }
    /**
     * Computes a numeric hash of the given length.
    */
    function lengthHash(length) {
        return length;
    }
    function lengthMax(length1, length2) {
        return length1 > length2 ? length1 : length2;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVuZ3RoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9icmFja2V0UGFpcnNUZXh0TW9kZWxQYXJ0L2JyYWNrZXRQYWlyc1RyZWUvbGVuZ3RoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxnQ0FJQztJQVVELG9DQUVDO0lBWUQsNEJBUUM7SUFFRCxrQ0FLQztJQUVELGdEQUVDO0lBS0Qsa0ZBRUM7SUFNRCw4QkFJQztJQUVELGdDQUVDO0lBRUQsb0NBRUM7SUFLRCxzREFzQkM7SUFFRCx3Q0FHQztJQUVELGtEQUVDO0lBRUQsd0RBRUM7SUFFRCw0Q0FLQztJQUVELDRDQUVDO0lBRUQsd0NBVUM7SUFFRCxzQ0FNQztJQUVELHNDQUlDO0lBRUQsd0NBR0M7SUFFRCw4Q0FHQztJQUtELGdDQUVDO0lBRUQsOEJBRUM7SUE3S0Q7O01BRUU7SUFDRixTQUFnQixVQUFVLENBQUMsY0FBc0IsRUFBRSxnQkFBd0IsRUFBRSxZQUFvQixFQUFFLGNBQXNCO1FBQ3hILE9BQU8sQ0FBQyxjQUFjLEtBQUssWUFBWSxDQUFDO1lBQ3ZDLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxHQUFHLGNBQWMsRUFBRSxjQUFjLENBQUM7WUFDekQsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsY0FBYyxHQUFHLGdCQUFnQixDQUFDLENBQUM7SUFDbkQsQ0FBQztJQVFZLFFBQUEsVUFBVSxHQUFHLENBQWtCLENBQUM7SUFFN0MsU0FBZ0IsWUFBWSxDQUFDLE1BQWM7UUFDMUMsT0FBTyxNQUF1QixLQUFLLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSTtJQUNKLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDdkI7O1NBRUs7SUFF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