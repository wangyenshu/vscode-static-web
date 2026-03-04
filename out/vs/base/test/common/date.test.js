/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/date", "vs/base/test/common/utils"], function (require, exports, assert_1, date_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Date', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('fromNow', () => {
            test('appendAgoLabel', () => {
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000), '35 secs');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000, false), '35 secs');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000, true), '35 secs ago');
            });
            test('useFullTimeWords', () => {
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000), '35 secs');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000, undefined, false), '35 secs');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 35000, undefined, true), '35 seconds');
            });
            test('disallowNow', () => {
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 5000), 'now');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 5000, undefined, undefined, false), 'now');
                (0, assert_1.strictEqual)((0, date_1.fromNow)(Date.now() - 5000, undefined, undefined, true), '5 secs');
            });
        });
        suite('getDurationString', () => {
            test('basic', () => {
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1), '1ms');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(999), '999ms');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000), '1s');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 - 1), '59.999s');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60), '1 mins');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 - 1), '60 mins');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60), '1 hrs');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 * 24 - 1), '24 hrs');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 * 24), '1 days');
            });
            test('useFullTimeWords', () => {
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1, true), '1 milliseconds');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(999, true), '999 milliseconds');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000, true), '1 seconds');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 - 1, true), '59.999 seconds');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60, true), '1 minutes');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 - 1, true), '60 minutes');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60, true), '1 hours');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 * 24 - 1, true), '24 hours');
                (0, assert_1.strictEqual)((0, date_1.getDurationString)(1000 * 60 * 60 * 24, true), '1 days');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9kYXRlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7UUFDbEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7Z0JBQzNCLElBQUEsb0JBQVcsRUFBQyxJQUFBLGNBQU8sRUFBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3BELElBQUEsb0JBQVcsRUFBQyxJQUFBLGNBQU8sRUFBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMzRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSxjQUFPLEVBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUMvRCxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7Z0JBQzdCLElBQUEsb0JBQVcsRUFBQyxJQUFBLGNBQU8sRUFBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3BELElBQUEsb0JBQVcsRUFBQyxJQUFBLGNBQU8sRUFBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztn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