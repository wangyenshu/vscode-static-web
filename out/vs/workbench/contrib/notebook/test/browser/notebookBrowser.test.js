/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, assert, utils_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Return a set of ranges for the cells matching the given predicate
     */
    function getRanges(cells, included) {
        const ranges = [];
        let currentRange;
        cells.forEach((cell, idx) => {
            if (included(cell)) {
                if (!currentRange) {
                    currentRange = { start: idx, end: idx + 1 };
                    ranges.push(currentRange);
                }
                else {
                    currentRange.end = idx + 1;
                }
            }
            else {
                currentRange = undefined;
            }
        });
        return ranges;
    }
    suite('notebookBrowser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('getRanges', function () {
            const predicate = (cell) => cell.cellKind === notebookCommon_1.CellKind.Code;
            test('all code', function () {
                const cells = [
                    { cellKind: notebookCommon_1.CellKind.Code },
                    { cellKind: notebookCommon_1.CellKind.Code },
                ];
                assert.deepStrictEqual(getRanges(cells, predicate), [{ start: 0, end: 2 }]);
            });
            test('none code', function () {
                const cells = [
                    { cellKind: notebookCommon_1.CellKind.Markup },
                    { cellKind: notebookCommon_1.CellKind.Markup },
                ];
                assert.deepStrictEqual(getRanges(cells, predicate), []);
            });
            test('start code', function () {
                const cells = [
                    { cellKind: notebookCommon_1.CellKind.Code },
                    { cellKind: notebookCommon_1.CellKind.Markup },
                ];
                assert.deepStrictEqual(getRanges(cells, predicate), [{ start: 0, end: 1 }]);
            });
            test('random', function () {
                const cells = [
                    { cellKind: notebookCommon_1.CellKind.Code },
                    { cellKind: notebookCommon_1.CellKind.Code },
                    { cellKind: notebookCommon_1.CellKind.Markup },
                    { cellKind: notebookCommon_1.CellKind.Code },
                    { cellKind: notebookCommon_1.CellKind.Markup },
                    { cellKind: notebookCommon_1.CellKind.Markup },
                    { cellKind: notebookCommon_1.CellKind.Code },
                ];
                assert.deepStrictEqual(getRanges(cells, predicate), [{ start: 0, end: 2 }, { start: 3, end: 4 }, { start: 6, end: 7 }]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tCcm93c2VyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvbm90ZWJvb2tCcm93c2VyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEc7O09BRUc7SUFDSCxTQUFTLFNBQVMsQ0FBQyxLQUF1QixFQUFFLFFBQTJDO1FBQ3RGLE1BQU0sTUFBTSxHQUFpQixFQUFFLENBQUM7UUFDaEMsSUFBSSxZQUFvQyxDQUFDO1FBRXpDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDM0IsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUNuQixZQUFZLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzVDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzNCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxZQUFZLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQzVCLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsWUFBWSxHQUFHLFNBQVMsQ0FBQztZQUMxQixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFHRCxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBQzdCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQ2xCLE1BQU0sU0FBUyxHQUFHLENBQUMs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