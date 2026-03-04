/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/viewModel/glyphLanesModel", "vs/editor/common/core/range", "vs/editor/common/model"], function (require, exports, assert, utils_1, glyphLanesModel_1, range_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('GlyphLanesModel', () => {
        let model;
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const lineRange = (startLineNumber, endLineNumber) => new range_1.Range(startLineNumber, 1, endLineNumber, 1);
        const assertLines = (fromLine, n, expected) => {
            const result = [];
            for (let i = 0; i < n; i++) {
                result.push(model.getLanesAtLine(fromLine + i));
            }
            assert.deepStrictEqual(result, expected, `fromLine: ${fromLine}, n: ${n}`);
        };
        setup(() => {
            model = new glyphLanesModel_1.GlyphMarginLanesModel(10);
        });
        test('handles empty', () => {
            assert.equal(model.requiredLanes, 1);
            assertLines(1, 1, [
                [model_1.GlyphMarginLane.Center],
            ]);
        });
        test('works with a single line range', () => {
            model.push(model_1.GlyphMarginLane.Left, lineRange(2, 3));
            assert.equal(model.requiredLanes, 1);
            assertLines(1, 5, [
                [model_1.GlyphMarginLane.Center], // 1
                [model_1.GlyphMarginLane.Left], // 2
                [model_1.GlyphMarginLane.Left], // 3
                [model_1.GlyphMarginLane.Center], // 4
                [model_1.GlyphMarginLane.Center], // 5
            ]);
        });
        test('persists ranges', () => {
            model.push(model_1.GlyphMarginLane.Left, lineRange(2, 3), true);
            assert.equal(model.requiredLanes, 1);
            assertLines(1, 5, [
                [model_1.GlyphMarginLane.Left], // 1
                [model_1.GlyphMarginLane.Left], // 2
                [model_1.GlyphMarginLane.Left], // 3
                [model_1.GlyphMarginLane.Left], // 4
                [model_1.GlyphMarginLane.Left], // 5
            ]);
        });
        test('handles overlaps', () => {
            model.push(model_1.GlyphMarginLane.Left, lineRange(6, 9));
            model.push(model_1.GlyphMarginLane.Right, lineRange(5, 7));
            model.push(model_1.GlyphMarginLane.Center, lineRange(7, 8));
            assert.equal(model.requiredLanes, 3);
            assertLines(5, 6, [
                [model_1.GlyphMarginLane.Right], // 5
                [model_1.GlyphMarginLane.Left, model_1.GlyphMarginLane.Right], // 6
                [model_1.GlyphMarginLane.Left, model_1.GlyphMarginLane.Center, model_1.GlyphMarginLane.Right], // 7
                [model_1.GlyphMarginLane.Left, model_1.GlyphMarginLane.Center], // 8
                [model_1.GlyphMarginLane.Left], // 9
                [model_1.GlyphMarginLane.Center], // 10
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2x5cGhMYW5lc01vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vdmlld01vZGVsL2dseXBoTGFuZXNNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDN0IsSUFBSSxLQUE0QixDQUFDO1FBRWpDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxNQUFNLFNBQVMsR0FBRyxDQUFDLGVBQXVCLEVBQUUsYUFBcUIsRUFBRSxFQUFFLENBQUMsSUFBSSxhQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEgsTUFBTSxXQUFXLEdBQUcsQ0FBQyxRQUFnQixFQUFFLENBQVMsRUFBRSxRQUE2QixFQUFFLEVBQUU7WUFDbEYsTUFBTSxNQUFNLEdBQXdCLEVBQUUsQ0FBQztZQUN2QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRCxDQUFDO1lBQ0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLGFBQWEsUUFBUSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDNUUsQ0FBQyxDQUFDO1FBRUYsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLEtBQUssR0FBRyxJQUFJLHVDQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFD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