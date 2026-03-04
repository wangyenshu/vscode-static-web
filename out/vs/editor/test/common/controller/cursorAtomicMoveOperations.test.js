/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/cursor/cursorAtomicMoveOperations"], function (require, exports, assert, utils_1, cursorAtomicMoveOperations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Cursor move command test', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Test whitespaceVisibleColumn', () => {
            const testCases = [
                {
                    lineContent: '        ',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, 0, 0, 0, 4, 4, 4, 4, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, 0, 0, 0, 4, 4, 4, 4, -1],
                    expectedVisibleColumn: [0, 1, 2, 3, 4, 5, 6, 7, 8, -1],
                },
                {
                    lineContent: '  ',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, 0, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, 0, -1],
                    expectedVisibleColumn: [0, 1, 2, -1],
                },
                {
                    lineContent: '\t',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, -1],
                    expectedVisibleColumn: [0, 4, -1],
                },
                {
                    lineContent: '\t ',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, 1, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, 4, -1],
                    expectedVisibleColumn: [0, 4, 5, -1],
                },
                {
                    lineContent: ' \t\t ',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, 0, 2, 3, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, 0, 4, 8, -1],
                    expectedVisibleColumn: [0, 1, 4, 8, 9, -1],
                },
                {
                    lineContent: ' \tA',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, 0, -1, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, 0, -1, -1],
                    expectedVisibleColumn: [0, 1, 4, -1, -1],
                },
                {
                    lineContent: 'A',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, -1, -1],
                    expectedPrevTabStopVisibleColumn: [-1, -1, -1],
                    expectedVisibleColumn: [0, -1, -1],
                },
                {
                    lineContent: '',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, -1],
                    expectedPrevTabStopVisibleColumn: [-1, -1],
                    expectedVisibleColumn: [0, -1],
                },
            ];
            for (const testCase of testCases) {
                const maxPosition = testCase.expectedVisibleColumn.length;
                for (let position = 0; position < maxPosition; position++) {
                    const actual = cursorAtomicMoveOperations_1.AtomicTabMoveOperations.whitespaceVisibleColumn(testCase.lineContent, position, testCase.tabSize);
                    const expected = [
                        testCase.expectedPrevTabStopPosition[position],
                        testCase.expectedPrevTabStopVisibleColumn[position],
                        testCase.expectedVisibleColumn[position]
                    ];
                    assert.deepStrictEqual(actual, expected);
                }
            }
        });
        test('Test atomicPosition', () => {
            const testCases = [
                {
                    lineContent: '        ',
                    tabSize: 4,
                    expectedLeft: [-1, 0, 0, 0, 0, 4, 4, 4, 4, -1],
                    expectedRight: [4, 4, 4, 4, 8, 8, 8, 8, -1, -1],
                    expectedNearest: [0, 0, 0, 4, 4, 4, 4, 8, 8, -1],
                },
                {
                    lineContent: ' \t',
                    tabSize: 4,
                    expectedLeft: [-1, 0, 0, -1],
                    expectedRight: [2, 2, -1, -1],
                    expectedNearest: [0, 0, 2, -1],
                },
                {
                    lineContent: '\t ',
                    tabSize: 4,
                    expectedLeft: [-1, 0, -1, -1],
                    expectedRight: [1, -1, -1, -1],
                    expectedNearest: [0, 1, -1, -1],
                },
                {
                    lineContent: ' \t ',
                    tabSize: 4,
                    expectedLeft: [-1, 0, 0, -1, -1],
                    expectedRight: [2, 2, -1, -1, -1],
                    expectedNearest: [0, 0, 2, -1, -1],
                },
                {
                    lineContent: '        A',
                    tabSize: 4,
                    expectedLeft: [-1, 0, 0, 0, 0, 4, 4, 4, 4, -1, -1],
                    expectedRight: [4, 4, 4, 4, 8, 8, 8, 8, -1, -1, -1],
                    expectedNearest: [0, 0, 0, 4, 4, 4, 4, 8, 8, -1, -1],
                },
                {
                    lineContent: '      foo',
                    tabSize: 4,
                    expectedLeft: [-1, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1],
                    expectedRight: [4, 4, 4, 4, -1, -1, -1, -1, -1, -1, -1],
                    expectedNearest: [0, 0, 0, 4, 4, -1, -1, -1, -1, -1, -1],
                },
            ];
            for (const testCase of testCases) {
                for (const { direction, expected } of [
                    {
                        direction: 0 /* Direction.Left */,
                        expected: testCase.expectedLeft,
                    },
                    {
                        direction: 1 /* Direction.Right */,
                        expected: testCase.expectedRight,
                    },
                    {
                        direction: 2 /* Direction.Nearest */,
                        expected: testCase.expectedNearest,
                    },
                ]) {
                    const actual = expected.map((_, i) => cursorAtomicMoveOperations_1.AtomicTabMoveOperations.atomicPosition(testCase.lineContent, i, testCase.tabSize, direction));
                    assert.deepStrictEqual(actual, expected);
                }
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQXRvbWljTW92ZU9wZXJhdGlvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9jb250cm9sbGVyL2N1cnNvckF0b21pY01vdmVPcGVyYXRpb25zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtRQUV0QyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtZQUN6QyxNQUFNLFNBQVMsR0FBRztnQkFDakI7b0JBQ0MsV0FBVyxFQUFFLFVBQVU7b0JBQ3ZCLE9BQU8sRUFBRSxDQUFDO29CQUNWLDJCQUEyQixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDN0QsZ0NBQWdDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNsRSxxQkFBcUIsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUN0RDtnQkFDRDtvQkFDQyxXQUFXLEVBQUUsSUFBSTtvQkFDakIsT0FBTyxFQUFFLENBQUM7b0JBQ1YsMkJBQTJCLEVBQUUs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