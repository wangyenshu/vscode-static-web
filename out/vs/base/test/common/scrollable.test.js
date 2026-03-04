/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/scrollable", "vs/base/test/common/utils"], function (require, exports, assert, scrollable_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestSmoothScrollingOperation extends scrollable_1.SmoothScrollingOperation {
        constructor(from, to, viewportSize, startTime, duration) {
            duration = duration + 10;
            startTime = startTime - 10;
            super({ scrollLeft: 0, scrollTop: from, width: 0, height: viewportSize }, { scrollLeft: 0, scrollTop: to, width: 0, height: viewportSize }, startTime, duration);
        }
        testTick(now) {
            return this._tick(now);
        }
    }
    suite('SmoothScrollingOperation', () => {
        const VIEWPORT_HEIGHT = 800;
        const ANIMATION_DURATION = 125;
        const LINE_HEIGHT = 20;
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function extractLines(scrollable, now) {
            const scrollTop = scrollable.testTick(now).scrollTop;
            const scrollBottom = scrollTop + VIEWPORT_HEIGHT;
            const startLineNumber = Math.floor(scrollTop / LINE_HEIGHT);
            const endLineNumber = Math.ceil(scrollBottom / LINE_HEIGHT);
            return [startLineNumber, endLineNumber];
        }
        function simulateSmoothScroll(from, to) {
            const scrollable = new TestSmoothScrollingOperation(from, to, VIEWPORT_HEIGHT, 0, ANIMATION_DURATION);
            const result = [];
            let resultLen = 0;
            result[resultLen++] = extractLines(scrollable, 0);
            result[resultLen++] = extractLines(scrollable, 25);
            result[resultLen++] = extractLines(scrollable, 50);
            result[resultLen++] = extractLines(scrollable, 75);
            result[resultLen++] = extractLines(scrollable, 100);
            result[resultLen++] = extractLines(scrollable, 125);
            return result;
        }
        function assertSmoothScroll(from, to, expected) {
            const actual = simulateSmoothScroll(from, to);
            assert.deepStrictEqual(actual, expected);
        }
        test('scroll 25 lines (40 fit)', () => {
            assertSmoothScroll(0, 500, [
                [5, 46],
                [14, 55],
                [20, 61],
                [23, 64],
                [24, 65],
                [25, 65],
            ]);
        });
        test('scroll 75 lines (40 fit)', () => {
            assertSmoothScroll(0, 1500, [
                [15, 56],
                [44, 85],
                [62, 103],
                [71, 112],
                [74, 115],
                [75, 115],
            ]);
        });
        test('scroll 100 lines (40 fit)', () => {
            assertSmoothScroll(0, 2000, [
                [20, 61],
                [59, 100],
                [82, 123],
                [94, 135],
                [99, 140],
                [100, 140],
            ]);
        });
        test('scroll 125 lines (40 fit)', () => {
            assertSmoothScroll(0, 2500, [
                [16, 57],
                [29, 70],
                [107, 148],
                [119, 160],
                [124, 165],
                [125, 165],
            ]);
        });
        test('scroll 500 lines (40 fit)', () => {
            assertSmoothScroll(0, 10000, [
                [16, 57],
                [29, 70],
                [482, 523],
                [494, 535],
                [499, 540],
                [500, 540],
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYWJsZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9zY3JvbGxhYmxlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsTUFBTSw0QkFBNkIsU0FBUSxxQ0FBd0I7UUFFbEUsWUFBWSxJQUFZLEVBQUUsRUFBVSxFQUFFLFlBQW9CLEVBQUUsU0FBaUIsRUFBRSxRQUFnQjtZQUM5RixRQUFRLEdBQUcsUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUN6QixTQUFTLEdBQUcsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUUzQixLQUFLLENBQ0osRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLEVBQ2xFLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxFQUNoRSxTQUFTLEVBQ1QsUUFBUSxDQUNSLENBQUM7UUFDSCxDQUFDO1FBRU0sUUFBUSxDQUFDLEdBQVc7WUFDMUIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7S0FFRDtJQUVELEtBQUssQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7UUFFdEMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDO1FBQzVCLE1BQU0sa0JBQWtCLEdBQUcsR0FBRyxDQUFDO1FBQy9CLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQztRQUV2QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxZQUFZLENBQUMsVUFBd0MsRUFBRSxHQUFXO1lBQzFFLE1BQU0sU0FBUyxH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