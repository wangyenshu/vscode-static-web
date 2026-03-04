/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/diff/diff", "vs/base/test/common/utils"], function (require, exports, assert, diff_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createArray(length, value) {
        const r = [];
        for (let i = 0; i < length; i++) {
            r[i] = value;
        }
        return r;
    }
    function maskBasedSubstring(str, mask) {
        let r = '';
        for (let i = 0; i < str.length; i++) {
            if (mask[i]) {
                r += str.charAt(i);
            }
        }
        return r;
    }
    function assertAnswer(originalStr, modifiedStr, changes, answerStr, onlyLength = false) {
        const originalMask = createArray(originalStr.length, true);
        const modifiedMask = createArray(modifiedStr.length, true);
        let i, j, change;
        for (i = 0; i < changes.length; i++) {
            change = changes[i];
            if (change.originalLength) {
                for (j = 0; j < change.originalLength; j++) {
                    originalMask[change.originalStart + j] = false;
                }
            }
            if (change.modifiedLength) {
                for (j = 0; j < change.modifiedLength; j++) {
                    modifiedMask[change.modifiedStart + j] = false;
                }
            }
        }
        const originalAnswer = maskBasedSubstring(originalStr, originalMask);
        const modifiedAnswer = maskBasedSubstring(modifiedStr, modifiedMask);
        if (onlyLength) {
            assert.strictEqual(originalAnswer.length, answerStr.length);
            assert.strictEqual(modifiedAnswer.length, answerStr.length);
        }
        else {
            assert.strictEqual(originalAnswer, answerStr);
            assert.strictEqual(modifiedAnswer, answerStr);
        }
    }
    function lcsInnerTest(originalStr, modifiedStr, answerStr, onlyLength = false) {
        const diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(originalStr), new diff_1.StringDiffSequence(modifiedStr));
        const changes = diff.ComputeDiff(false).changes;
        assertAnswer(originalStr, modifiedStr, changes, answerStr, onlyLength);
    }
    function stringPower(str, power) {
        let r = str;
        for (let i = 0; i < power; i++) {
            r += r;
        }
        return r;
    }
    function lcsTest(originalStr, modifiedStr, answerStr) {
        lcsInnerTest(originalStr, modifiedStr, answerStr);
        for (let i = 2; i <= 5; i++) {
            lcsInnerTest(stringPower(originalStr, i), stringPower(modifiedStr, i), stringPower(answerStr, i), true);
        }
    }
    suite('Diff', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('LcsDiff - different strings tests', function () {
            this.timeout(10000);
            lcsTest('heLLo world', 'hello orlando', 'heo orld');
            lcsTest('abcde', 'acd', 'acd'); // simple
            lcsTest('abcdbce', 'bcede', 'bcde'); // skip
            lcsTest('abcdefgabcdefg', 'bcehafg', 'bceafg'); // long
            lcsTest('abcde', 'fgh', ''); // no match
            lcsTest('abcfabc', 'fabc', 'fabc');
            lcsTest('0azby0', '9axbzby9', 'azby');
            lcsTest('0abc00000', '9a1b2c399999', 'abc');
            lcsTest('fooBar', 'myfooBar', 'fooBar'); // all insertions
            lcsTest('fooBar', 'fooMyBar', 'fooBar'); // all insertions
            lcsTest('fooBar', 'fooBar', 'fooBar'); // identical sequences
        });
    });
    suite('Diff - Ported from VS', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('using continue processing predicate to quit early', function () {
            const left = 'abcdef';
            const right = 'abxxcyyydzzzzezzzzzzzzzzzzzzzzzzzzf';
            // We use a long non-matching portion at the end of the right-side string, so the backwards tracking logic
            // doesn't get there first.
            let predicateCallCount = 0;
            let diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(left), new diff_1.StringDiffSequence(right), function (leftIndex, longestMatchSoFar) {
                assert.strictEqual(predicateCallCount, 0);
                predicateCallCount++;
                assert.strictEqual(leftIndex, 1);
                // cancel processing
                return false;
            });
            let changes = diff.ComputeDiff(true).changes;
            assert.strictEqual(predicateCallCount, 1);
            // Doesn't include 'c', 'd', or 'e', since we quit on the first request
            assertAnswer(left, right, changes, 'abf');
            // Cancel after the first match ('c')
            diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(left), new diff_1.StringDiffSequence(right), function (leftIndex, longestMatchSoFar) {
                assert(longestMatchSoFar <= 1); // We never see a match of length > 1
                // Continue processing as long as there hasn't been a match made.
                return longestMatchSoFar < 1;
            });
            changes = diff.ComputeDiff(true).changes;
            assertAnswer(left, right, changes, 'abcf');
            // Cancel after the second match ('d')
            diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(left), new diff_1.StringDiffSequence(right), function (leftIndex, longestMatchSoFar) {
                assert(longestMatchSoFar <= 2); // We never see a match of length > 2
                // Continue processing as long as there hasn't been a match made.
                return longestMatchSoFar < 2;
            });
            changes = diff.ComputeDiff(true).changes;
            assertAnswer(left, right, changes, 'abcdf');
            // Cancel *one iteration* after the second match ('d')
            let hitSecondMatch = false;
            diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(left), new diff_1.StringDiffSequence(right), function (leftIndex, longestMatchSoFar) {
                assert(longestMatchSoFar <= 2); // We never see a match of length > 2
                const hitYet = hitSecondMatch;
                hitSecondMatch = longestMatchSoFar > 1;
                // Continue processing as long as there hasn't been a match made.
                return !hitYet;
            });
            changes = diff.ComputeDiff(true).changes;
            assertAnswer(left, right, changes, 'abcdf');
            // Cancel after the third and final match ('e')
            diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(left), new diff_1.StringDiffSequence(right), function (leftIndex, longestMatchSoFar) {
                assert(longestMatchSoFar <= 3); // We never see a match of length > 3
                // Continue processing as long as there hasn't been a match made.
                return longestMatchSoFar < 3;
            });
            changes = diff.ComputeDiff(true).changes;
            assertAnswer(left, right, changes, 'abcdef');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9kaWZmL2RpZmYudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxTQUFTLFdBQVcsQ0FBSSxNQUFjLEVBQUUsS0FBUTtRQUMvQyxNQUFNLENBQUMsR0FBUSxFQUFFLENBQUM7UUFDbEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBQyxHQUFXLEVBQUUsSUFBZTtRQUN2RCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDWCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3JDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2IsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLENBQUMsQ0FBQztJQUNWLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBQyxXQUFtQixFQUFFLFdBQW1CLEVBQUUsT0FBc0IsRUFBRSxTQUFpQixFQUFFLGFBQXNCLEtBQUs7UUFDckksTUFBTSxZQUFZLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDM0QsTUFBTSxZQUFZLEdBQUcsV0FBVyxDQUFDLFdBQVcs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