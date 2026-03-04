/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/notebookCellAnchor", "vs/base/common/event", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/test/common/utils"], function (require, exports, assert, testConfigurationService_1, notebookBrowser_1, notebookCellAnchor_1, event_1, notebookCommon_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookCellAnchor', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let focusedCell;
        let config;
        let scrollEvent;
        let onDidStopExecution;
        let resizingCell;
        let cellAnchor;
        setup(() => {
            config = new testConfigurationService_1.TestConfigurationService();
            scrollEvent = new event_1.Emitter();
            onDidStopExecution = new event_1.Emitter();
            const executionService = {
                getCellExecution: () => { return { state: notebookCommon_1.NotebookCellExecutionState.Executing }; },
            };
            resizingCell = {
                cellKind: notebookCommon_1.CellKind.Code,
                onDidStopExecution: onDidStopExecution.event
            };
            focusedCell = {
                focusMode: notebookBrowser_1.CellFocusMode.Container
            };
            cellAnchor = store.add(new notebookCellAnchor_1.NotebookCellAnchor(executionService, config, scrollEvent.event));
        });
        // for the current implementation the code under test only cares about the focused cell
        // initial setup with focused cell at the bottom of the view
        class MockListView {
            constructor() {
                this.focusedCellTop = 100;
                this.focusedCellHeight = 50;
                this.renderTop = 0;
                this.renderHeight = 150;
            }
            element(_index) { return focusedCell; }
            elementTop(_index) { return this.focusedCellTop; }
            elementHeight(_index) { return this.focusedCellHeight; }
            getScrollTop() { return this.renderTop; }
        }
        test('Basic anchoring', async function () {
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            const listView = new MockListView();
            assert(cellAnchor.shouldAnchor(listView, 1, -10, resizingCell), 'should anchor if cell editor is focused');
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should anchor if cell editor is focused');
            config.setUserConfiguration(notebookCommon_1.NotebookSetting.scrollToRevealCell, 'none');
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should anchor if cell editor is focused');
            config.setUserConfiguration(notebookCommon_1.NotebookSetting.scrollToRevealCell, 'fullCell');
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Container;
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should anchor if cell is growing');
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Output;
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should anchor if cell is growing');
            assert(!cellAnchor.shouldAnchor(listView, 1, -10, resizingCell), 'should not anchor if not growing and editor not focused');
            config.setUserConfiguration(notebookCommon_1.NotebookSetting.scrollToRevealCell, 'none');
            assert(!cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should not anchor if scroll on execute is disabled');
        });
        test('Anchor during execution until user scrolls up', async function () {
            const listView = new MockListView();
            const scrollDown = { oldScrollTop: 100, scrollTop: 150 };
            const scrollUp = { oldScrollTop: 200, scrollTop: 150 };
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell));
            scrollEvent.fire(scrollDown);
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should still be anchored after scrolling down');
            scrollEvent.fire(scrollUp);
            assert(!cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should not be anchored after scrolling up');
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should anchor again if the editor is focused');
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Container;
            onDidStopExecution.fire();
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should anchor for new execution');
        });
        test('Only anchor during when the focused cell will be pushed out of view', async function () {
            const mockListView = new MockListView();
            mockListView.focusedCellTop = 50;
            const listView = mockListView;
            assert(!cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should not anchor if focused cell will still be fully visible after resize');
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should always anchor if the editor is focused');
            // fully visible focused cell would be pushed partially out of view
            assert(cellAnchor.shouldAnchor(listView, 1, 150, resizingCell), 'cell should be anchored if focused cell will be pushed out of view');
            mockListView.focusedCellTop = 110;
            // partially visible focused cell would be pushed further out of view
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should be anchored if focused cell will be pushed out of view');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDZWxsQW5jaG9yLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvbm90ZWJvb2tDZWxsQW5jaG9yLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFlaEcsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtRQUVoQyxNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFDeEQsSUFBSSxXQUE4QixDQUFDO1FBQ25DLElBQUksTUFBZ0MsQ0FBQztRQUNyQyxJQUFJLFdBQWlDLENBQUM7UUFDdEMsSUFBSSxrQkFBaUMsQ0FBQztRQUN0QyxJQUFJLFlBQStCLENBQUM7UUFFcEMsSUFBSSxVQUE4QixDQUFDO1FBRW5DLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBQ3hDLFdBQVcsR0FBRyxJQUFJLGVBQU8sRUFBZSxDQUFDO1lBQ3pDLGtCQUFrQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFFekMsTUFBTSxnQkFBZ0IsR0FBRztnQkFDeEIsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFLEdBQUcsT0FBTyxFQUFFLEtBQUssRUFBRSwyQ0FBMEIsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDdEMsQ0FBQztZQUUvQyxZQUFZLEdBQUc7Z0JBQ2QsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSTtnQkFDdkIsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUMsS0FBSzthQUNaLENBQUM7WUFFbEMsV0FBVyxHQUFHO2dCQUNiLFNBQVMsRUFBRSwrQkFBYSxDQUFDLFNBQVM7YUFDYixDQUFDO1lBRXZCLFVBQVUsR0FBRyxLQUFLLENB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