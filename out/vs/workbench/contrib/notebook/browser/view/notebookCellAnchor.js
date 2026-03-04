/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, notebookBrowser_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellAnchor = void 0;
    class NotebookCellAnchor {
        constructor(notebookExecutionStateService, configurationService, scrollEvent) {
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.configurationService = configurationService;
            this.scrollEvent = scrollEvent;
            this.stopAnchoring = false;
        }
        shouldAnchor(cellListView, focusedIndex, heightDelta, executingCellUri) {
            if (cellListView.element(focusedIndex).focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                return true;
            }
            if (this.stopAnchoring) {
                return false;
            }
            const newFocusBottom = cellListView.elementTop(focusedIndex) + cellListView.elementHeight(focusedIndex) + heightDelta;
            const viewBottom = cellListView.renderHeight + cellListView.getScrollTop();
            const focusStillVisible = viewBottom > newFocusBottom;
            const allowScrolling = this.configurationService.getValue(notebookCommon_1.NotebookSetting.scrollToRevealCell) !== 'none';
            const growing = heightDelta > 0;
            const autoAnchor = allowScrolling && growing && !focusStillVisible;
            if (autoAnchor) {
                this.watchAchorDuringExecution(executingCellUri);
                return true;
            }
            return false;
        }
        watchAchorDuringExecution(executingCell) {
            // anchor while the cell is executing unless the user scrolls up.
            if (!this.executionWatcher && executingCell.cellKind === notebookCommon_1.CellKind.Code) {
                const executionState = this.notebookExecutionStateService.getCellExecution(executingCell.uri);
                if (executionState && executionState.state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                    this.executionWatcher = executingCell.onDidStopExecution(() => {
                        this.executionWatcher?.dispose();
                        this.executionWatcher = undefined;
                        this.scrollWatcher?.dispose();
                        this.stopAnchoring = false;
                    });
                    this.scrollWatcher = this.scrollEvent((scrollEvent) => {
                        if (scrollEvent.scrollTop < scrollEvent.oldScrollTop) {
                            this.stopAnchoring = true;
                            this.scrollWatcher?.dispose();
                        }
                    });
                }
            }
        }
        dispose() {
            this.executionWatcher?.dispose();
            this.scrollWatcher?.dispose();
        }
    }
    exports.NotebookCellAnchor = NotebookCellAnchor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDZWxsQW5jaG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L25vdGVib29rQ2VsbEFuY2hvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxrQkFBa0I7UUFNOUIsWUFDa0IsNkJBQTZELEVBQzdELG9CQUEyQyxFQUMzQyxXQUErQjtZQUYvQixrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1lBQzdELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MsZ0JBQVcsR0FBWCxXQUFXLENBQW9CO1lBUHpDLGtCQUFhLEdBQUcsS0FBSyxDQUFDO1FBUTlCLENBQUM7UUFFTSxZQUFZLENBQUMsWUFBc0MsRUFBRSxZQUFvQixFQUFFLFdBQW1CLEVBQUUsZ0JBQWdDO1lBQ3RJLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxTQUFTLEtBQUssK0JBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDM0UsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sY0FBYyxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEdBQUcsWUFBWSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsR0FBRyxXQUFXLENBQUM7WUFDdEgsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDM0UsTUFBTSxpQkFBaUIsR0FBRyxVQUFVLEdBQUcsY0FBYyxDQUFDO1lBQ3RELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsZ0NBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLE1BQU0sQ0FBQztZQUN6RyxNQUFNLE9BQU8sR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sVUFBVSxHQUFHLGNBQWMsSUFBSSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUVuRSxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMseUJBQXlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDakQsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU0seUJBQXlCLENBQUMsYUFBNkI7WUFDN0QsaUVBQWlFO1lBQ2pFLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLElBQUksYUFBYSxDQUFDLFFBQVEsS0FBSyx5QkFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN4RSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM5RixJQUFJLGNBQWMsSUFBSSxjQUFjLENBQUMsS0FBSyxLQUFLLDJDQUEwQixDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNyRixJQUFJLENBQUMsZ0JBQWdCLEdBQUksYUFBbUMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUU7d0JBQ3BGLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsQ0FBQzt3QkFDakMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQzt3QkFDbEMsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsQ0FBQzt3QkFDOUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7b0JBQzVCLENBQUMsQ0FBQyxDQUFDO29CQUNILElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFO3dCQUNyRCxJQUFJLFdBQVcsQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLFlBQVksRUFBRSxDQUFDOzRCQUN0RCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQzs0QkFDMUIsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsQ0FBQzt3QkFDL0IsQ0FBQztvQkFDRixDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDL0IsQ0FBQztLQUNEO0lBNURELGdEQTREQyJ9