/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/executionStatusBarItemController"], function (require, exports, assert, utils_1, executionStatusBarItemController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('notebookBrowser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('formatCellDuration', function () {
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(0, false), '0.0s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(0), '0ms');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(10, false), '0.0s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(10), '10ms');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(100, false), '0.1s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(100), '100ms');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(200, false), '0.2s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(200), '200ms');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(3300), '3.3s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(180000), '3m 0.0s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(189412), '3m 9.4s');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0aW9uU3RhdHVzQmFySXRlbS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL2NvbnRyaWIvZXhlY3V0aW9uU3RhdHVzQmFySXRlbS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDN0IsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRTtZQUMxQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEscURBQWtCLEVBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxxREFBa0IsRUFBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEscURBQWtCLEVBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxxREFBa0IsRUFBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEscURBQWtCLEVBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxxREFBa0IsRUFBQyxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEscURBQWtCLEVBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxxREFBa0IsRUFBQyxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEscURBQWtCLEVBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHFEQUFrQixFQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxxREFBa0IsRUFBQyxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=