/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/contrib/folding/browser/foldingRanges", "vs/editor/contrib/folding/browser/indentRangeProvider", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, foldingRanges_1, indentRangeProvider_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const markers = {
        start: /^#region$/,
        end: /^#endregion$/
    };
    suite('FoldingRanges', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const foldRange = (from, to, collapsed = undefined, source = 0 /* FoldSource.provider */, type = undefined) => ({
            startLineNumber: from,
            endLineNumber: to,
            type: type,
            isCollapsed: collapsed || false,
            source
        });
        const assertEqualRanges = (range1, range2, msg) => {
            assert.strictEqual(range1.startLineNumber, range2.startLineNumber, msg + ' start');
            assert.strictEqual(range1.endLineNumber, range2.endLineNumber, msg + ' end');
            assert.strictEqual(range1.type, range2.type, msg + ' type');
            assert.strictEqual(range1.isCollapsed, range2.isCollapsed, msg + ' collapsed');
            assert.strictEqual(range1.source, range2.source, msg + ' source');
        };
        test('test max folding regions', () => {
            const lines = [];
            const nRegions = foldingRanges_1.MAX_FOLDING_REGIONS;
            const collector = new indentRangeProvider_1.RangesCollector({ limit: foldingRanges_1.MAX_FOLDING_REGIONS, update: () => { } });
            for (let i = 0; i < nRegions; i++) {
                const startLineNumber = lines.length;
                lines.push('#region');
                const endLineNumber = lines.length;
                lines.push('#endregion');
                collector.insertFirst(startLineNumber, endLineNumber, 0);
            }
            const model = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            const actual = collector.toIndentRanges(model);
            assert.strictEqual(actual.length, nRegions, 'len');
            model.dispose();
        });
        test('findRange', () => {
            const lines = [
                /* 1*/ '#region',
                /* 2*/ '#endregion',
                /* 3*/ 'class A {',
                /* 4*/ '  void foo() {',
                /* 5*/ '    if (true) {',
                /* 6*/ '        return;',
                /* 7*/ '    }',
                /* 8*/ '',
                /* 9*/ '    if (true) {',
                /* 10*/ '      return;',
                /* 11*/ '    }',
                /* 12*/ '  }',
                /* 13*/ '}'
            ];
            const textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                const actual = (0, indentRangeProvider_1.computeRanges)(textModel, false, markers);
                // let r0 = r(1, 2);
                // let r1 = r(3, 12);
                // let r2 = r(4, 11);
                // let r3 = r(5, 6);
                // let r4 = r(9, 10);
                assert.strictEqual(actual.findRange(1), 0, '1');
                assert.strictEqual(actual.findRange(2), 0, '2');
                assert.strictEqual(actual.findRange(3), 1, '3');
                assert.strictEqual(actual.findRange(4), 2, '4');
                assert.strictEqual(actual.findRange(5), 3, '5');
                assert.strictEqual(actual.findRange(6), 3, '6');
                assert.strictEqual(actual.findRange(7), 2, '7');
                assert.strictEqual(actual.findRange(8), 2, '8');
                assert.strictEqual(actual.findRange(9), 4, '9');
                assert.strictEqual(actual.findRange(10), 4, '10');
                assert.strictEqual(actual.findRange(11), 2, '11');
                assert.strictEqual(actual.findRange(12), 1, '12');
                assert.strictEqual(actual.findRange(13), -1, '13');
            }
            finally {
                textModel.dispose();
            }
        });
        test('setCollapsed', () => {
            const lines = [];
            const nRegions = 500;
            for (let i = 0; i < nRegions; i++) {
                lines.push('#region');
            }
            for (let i = 0; i < nRegions; i++) {
                lines.push('#endregion');
            }
            const model = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            const actual = (0, indentRangeProvider_1.computeRanges)(model, false, markers);
            assert.strictEqual(actual.length, nRegions, 'len');
            for (let i = 0; i < nRegions; i++) {
                actual.setCollapsed(i, i % 3 === 0);
            }
            for (let i = 0; i < nRegions; i++) {
                assert.strictEqual(actual.isCollapsed(i), i % 3 === 0, 'line' + i);
            }
            model.dispose();
        });
        test('sanitizeAndMerge1', () => {
            const regionSet1 = [
                foldRange(0, 100), // invalid, should be removed
                foldRange(1, 100, false, 0 /* FoldSource.provider */, 'A'), // valid
                foldRange(1, 100, false, 0 /* FoldSource.provider */, 'Z'), // invalid, duplicate start
                foldRange(10, 10, false), // invalid, should be removed
                foldRange(20, 80, false, 0 /* FoldSource.provider */, 'C1'), // valid inside 'B'
                foldRange(22, 80, true, 0 /* FoldSource.provider */, 'D1'), // valid inside 'C1'
                foldRange(90, 101), // invalid, should be removed
            ];
            const regionSet2 = [
                foldRange(20, 80, true), // should merge with C1
                foldRange(18, 80, true), // invalid, out of order
                foldRange(21, 81, true, 0 /* FoldSource.provider */, 'Z'), // invalid, overlapping
                foldRange(22, 80, true, 0 /* FoldSource.provider */, 'D2'), // should merge with D1
            ];
            const result = foldingRanges_1.FoldingRegions.sanitizeAndMerge(regionSet1, regionSet2, 100);
            assert.strictEqual(result.length, 3, 'result length1');
            assertEqualRanges(result[0], foldRange(1, 100, false, 0 /* FoldSource.provider */, 'A'), 'A1');
            assertEqualRanges(result[1], foldRange(20, 80, true, 0 /* FoldSource.provider */, 'C1'), 'C1');
            assertEqualRanges(result[2], foldRange(22, 80, true, 0 /* FoldSource.provider */, 'D1'), 'D1');
        });
        test('sanitizeAndMerge2', () => {
            const regionSet1 = [
                foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), // valid
                foldRange(2, 100, false, 0 /* FoldSource.provider */, 'a2'), // valid
                foldRange(3, 19, false, 0 /* FoldSource.provider */, 'a3'), // valid
                foldRange(20, 71, false, 0 /* FoldSource.provider */, 'a4'), // overlaps b3
                foldRange(21, 29, false, 0 /* FoldSource.provider */, 'a5'), // valid
                foldRange(81, 91, false, 0 /* FoldSource.provider */, 'a6'), // overlaps b4
            ];
            const regionSet2 = [
                foldRange(30, 39, true, 0 /* FoldSource.provider */, 'b1'), // valid, will be recovered
                foldRange(40, 49, true, 1 /* FoldSource.userDefined */, 'b2'), // valid
                foldRange(50, 100, true, 1 /* FoldSource.userDefined */, 'b3'), // overlaps a4
                foldRange(80, 90, true, 1 /* FoldSource.userDefined */, 'b4'), // overlaps a6
                foldRange(92, 100, true, 1 /* FoldSource.userDefined */, 'b5'), // valid
            ];
            const result = foldingRanges_1.FoldingRegions.sanitizeAndMerge(regionSet1, regionSet2, 100);
            assert.strictEqual(result.length, 9, 'result length1');
            assertEqualRanges(result[0], foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), 'P1');
            assertEqualRanges(result[1], foldRange(2, 100, false, 0 /* FoldSource.provider */, 'a2'), 'P2');
            assertEqualRanges(result[2], foldRange(3, 19, false, 0 /* FoldSource.provider */, 'a3'), 'P3');
            assertEqualRanges(result[3], foldRange(21, 29, false, 0 /* FoldSource.provider */, 'a5'), 'P4');
            assertEqualRanges(result[4], foldRange(30, 39, true, 2 /* FoldSource.recovered */, 'b1'), 'P5');
            assertEqualRanges(result[5], foldRange(40, 49, true, 1 /* FoldSource.userDefined */, 'b2'), 'P6');
            assertEqualRanges(result[6], foldRange(50, 100, true, 1 /* FoldSource.userDefined */, 'b3'), 'P7');
            assertEqualRanges(result[7], foldRange(80, 90, true, 1 /* FoldSource.userDefined */, 'b4'), 'P8');
            assertEqualRanges(result[8], foldRange(92, 100, true, 1 /* FoldSource.userDefined */, 'b5'), 'P9');
        });
        test('sanitizeAndMerge3', () => {
            const regionSet1 = [
                foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), // valid
                foldRange(10, 29, false, 0 /* FoldSource.provider */, 'a2'), // matches manual hidden
                foldRange(35, 39, true, 2 /* FoldSource.recovered */, 'a3'), // valid
            ];
            const regionSet2 = [
                foldRange(10, 29, true, 2 /* FoldSource.recovered */, 'b1'), // matches a
                foldRange(20, 28, true, 0 /* FoldSource.provider */, 'b2'), // should remain
                foldRange(30, 39, true, 2 /* FoldSource.recovered */, 'b3'), // should remain
            ];
            const result = foldingRanges_1.FoldingRegions.sanitizeAndMerge(regionSet1, regionSet2, 100);
            assert.strictEqual(result.length, 5, 'result length3');
            assertEqualRanges(result[0], foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), 'R1');
            assertEqualRanges(result[1], foldRange(10, 29, true, 0 /* FoldSource.provider */, 'a2'), 'R2');
            assertEqualRanges(result[2], foldRange(20, 28, true, 2 /* FoldSource.recovered */, 'b2'), 'R3');
            assertEqualRanges(result[3], foldRange(30, 39, true, 2 /* FoldSource.recovered */, 'b3'), 'R3');
            assertEqualRanges(result[4], foldRange(35, 39, true, 2 /* FoldSource.recovered */, 'a3'), 'R4');
        });
        test('sanitizeAndMerge4', () => {
            const regionSet1 = [
                foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), // valid
            ];
            const regionSet2 = [
                foldRange(20, 28, true, 0 /* FoldSource.provider */, 'b1'), // hidden
                foldRange(30, 38, true, 0 /* FoldSource.provider */, 'b2'), // hidden
            ];
            const result = foldingRanges_1.FoldingRegions.sanitizeAndMerge(regionSet1, regionSet2, 100);
            assert.strictEqual(result.length, 3, 'result length4');
            assertEqualRanges(result[0], foldRange(1, 100, false, 0 /* FoldSource.provider */, 'a1'), 'R1');
            assertEqualRanges(result[1], foldRange(20, 28, true, 2 /* FoldSource.recovered */, 'b1'), 'R2');
            assertEqualRanges(result[2], foldRange(30, 38, true, 2 /* FoldSource.recovered */, 'b2'), 'R3');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZ1Jhbmdlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZm9sZGluZy90ZXN0L2Jyb3dzZXIvZm9sZGluZ1Jhbmdlcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLE1BQU0sT0FBTyxHQUFtQjtRQUMvQixLQUFLLEVBQUUsV0FBVztRQUNsQixHQUFHLEVBQUUsY0FBYztLQUNuQixDQUFDO0lBRUYsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDM0IsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzFDLE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQVUsRUFBRSxZQUFpQyxTQUFTLEVBQUUsb0NBQXdDLEVBQUUsT0FBMkIsU0FBUyxFQUFFLEVBQUUsQ0FDMUssQ0FBVztZQUNWLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLGFBQWEsRUFBRSxFQUFFO1lBQ2pCLElBQUksRUFBRSxJQUFJO1lBQ1YsV0FBVyxFQUFFLFNBQVMsSUFBSSxLQUFLO1lBQy9CLE1BQU07U0FDTixDQUFBLENBQUM7UUFDSCxNQUFNLGlCQUFpQixHQUFHLENBQUMsTUFBaUIsRUFBRSxNQUFpQixFQUFFLEdBQVcsRUFBRSxFQUFFO1lBQy9FLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxNQUFNLENBQUMsZUFBZSxFQUFFLEdBQUcsR0FBRyxRQUFRLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLGFBQWEsRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJ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QUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxD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