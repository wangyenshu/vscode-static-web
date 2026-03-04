/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/test/common/snapshot", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/workbench/contrib/testing/browser/codeCoverageDecorations"], function (require, exports, snapshot_1, utils_1, position_1, range_1, codeCoverageDecorations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Code Coverage Decorations', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const textModel = { getValueInRange: () => '' };
        const assertRanges = async (model) => await (0, snapshot_1.assertSnapshot)(model.ranges.map(r => ({
            range: r.range.toString(),
            count: r.metadata.detail.type === 2 /* DetailType.Branch */ ? r.metadata.detail.detail.branches[r.metadata.detail.branch].count : r.metadata.detail.count,
        })));
        test('CoverageDetailsModel#1', async () => {
            // Create some sample coverage details
            const details = [
                { location: new range_1.Range(1, 0, 5, 0), type: 1 /* DetailType.Statement */, count: 1 },
                { location: new range_1.Range(2, 0, 3, 0), type: 1 /* DetailType.Statement */, count: 2 },
                { location: new range_1.Range(4, 0, 6, 0), type: 1 /* DetailType.Statement */, branches: [{ location: new range_1.Range(3, 0, 7, 0), count: 3 }], count: 4 },
            ];
            // Create a new CoverageDetailsModel instance
            const model = new codeCoverageDecorations_1.CoverageDetailsModel(details, textModel);
            // Verify that the ranges are generated correctly
            await assertRanges(model);
        });
        test('CoverageDetailsModel#2', async () => {
            // Create some sample coverage details
            const details = [
                { location: new range_1.Range(1, 0, 5, 0), type: 1 /* DetailType.Statement */, count: 1 },
                { location: new range_1.Range(2, 0, 4, 0), type: 1 /* DetailType.Statement */, count: 2 },
                { location: new range_1.Range(3, 0, 3, 5), type: 1 /* DetailType.Statement */, count: 3 },
            ];
            // Create a new CoverageDetailsModel instance
            const model = new codeCoverageDecorations_1.CoverageDetailsModel(details, textModel);
            // Verify that the ranges are generated correctly
            await assertRanges(model);
        });
        test('CoverageDetailsModel#3', async () => {
            // Create some sample coverage details
            const details = [
                { location: new range_1.Range(1, 0, 5, 0), type: 1 /* DetailType.Statement */, count: 1 },
                { location: new range_1.Range(2, 0, 3, 0), type: 1 /* DetailType.Statement */, count: 2 },
                { location: new range_1.Range(4, 0, 5, 0), type: 1 /* DetailType.Statement */, count: 3 },
            ];
            // Create a new CoverageDetailsModel instance
            const model = new codeCoverageDecorations_1.CoverageDetailsModel(details, textModel);
            // Verify that the ranges are generated correctly
            await assertRanges(model);
        });
        test('CoverageDetailsModel#4', async () => {
            // Create some sample coverage details
            const details = [
                { location: new range_1.Range(1, 0, 5, 0), type: 1 /* DetailType.Statement */, count: 1 },
                { location: new position_1.Position(2, 0), type: 1 /* DetailType.Statement */, count: 2 },
                { location: new range_1.Range(4, 0, 5, 0), type: 1 /* DetailType.Statement */, count: 3 },
                { location: new position_1.Position(4, 3), type: 1 /* DetailType.Statement */, count: 4 },
            ];
            // Create a new CoverageDetailsModel instance
            const model = new codeCoverageDecorations_1.CoverageDetailsModel(details, textModel);
            // Verify that the ranges are generated correctly
            await assertRanges(model);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUNvdmVyYWdlRGVjb3JhdGlvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvdGVzdC9icm93c2VyL2NvZGVDb3ZlcmFnZURlY29yYXRpb25zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtRQUN2QyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsTUFBTSxTQUFTLEdBQUcsRUFBRSxlQUFlLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUF1QixDQUFDO1FBQ3JFLE1BQU0sWUFBWSxHQUFHLEtBQUssRUFBRSxLQUEyQixFQUFFLEVBQUUsQ0FBQyxNQUFNLElBQUEseUJBQWMsRUFBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdkcsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFO1lBQ3pCLEtBQUssRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLDhCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSztTQUNsSixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUwsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pDLHNDQUFzQztZQUN0QyxNQUFNLE9BQU8sR0FBc0I7Z0JBQ2xDLEVB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