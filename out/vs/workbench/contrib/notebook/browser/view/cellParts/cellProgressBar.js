/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/ui/progressbar/progressbar", "vs/platform/theme/browser/defaultStyles", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, progressbar_1, defaultStyles_1, cellPart_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellProgressBar = void 0;
    let CellProgressBar = class CellProgressBar extends cellPart_1.CellContentPart {
        constructor(editorContainer, collapsedInputContainer, _notebookExecutionStateService) {
            super();
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._progressBar = this._register(new progressbar_1.ProgressBar(editorContainer, defaultStyles_1.defaultProgressBarStyles));
            this._progressBar.hide();
            this._collapsedProgressBar = this._register(new progressbar_1.ProgressBar(collapsedInputContainer, defaultStyles_1.defaultProgressBarStyles));
            this._collapsedProgressBar.hide();
        }
        didRenderCell(element) {
            this._updateForExecutionState(element);
        }
        updateForExecutionState(element, e) {
            this._updateForExecutionState(element, e);
        }
        updateState(element, e) {
            if (e.metadataChanged || e.internalMetadataChanged) {
                this._updateForExecutionState(element);
            }
            if (e.inputCollapsedChanged) {
                const exeState = this._notebookExecutionStateService.getCellExecution(element.uri);
                if (element.isInputCollapsed) {
                    this._progressBar.hide();
                    if (exeState?.state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                        this._updateForExecutionState(element);
                    }
                }
                else {
                    this._collapsedProgressBar.hide();
                    if (exeState?.state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                        this._updateForExecutionState(element);
                    }
                }
            }
        }
        _updateForExecutionState(element, e) {
            const exeState = e?.changed ?? this._notebookExecutionStateService.getCellExecution(element.uri);
            const progressBar = element.isInputCollapsed ? this._collapsedProgressBar : this._progressBar;
            if (exeState?.state === notebookCommon_1.NotebookCellExecutionState.Executing && (!exeState.didPause || element.isInputCollapsed)) {
                showProgressBar(progressBar);
            }
            else {
                progressBar.hide();
            }
        }
    };
    exports.CellProgressBar = CellProgressBar;
    exports.CellProgressBar = CellProgressBar = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CellProgressBar);
    function showProgressBar(progressBar) {
        progressBar.infinite().show(500);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFByb2dyZXNzQmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9jZWxsUHJvZ3Jlc3NCYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsMEJBQWU7UUFJbkQsWUFDQyxlQUE0QixFQUM1Qix1QkFBb0MsRUFDYSw4QkFBOEQ7WUFDL0csS0FBSyxFQUFFLENBQUM7WUFEeUMsbUNBQThCLEdBQTlCLDhCQUE4QixDQUFnQztZQUcvRyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBVyxDQUFDLGVBQWUsRUFBRSx3Q0FBd0IsQ0FBQyxDQUFDLENBQUM7WUFDL0YsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUV6QixJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFXLENBQUMsdUJBQXVCLEVBQUUsd0NBQXdCLENBQUMsQ0FBQyxDQUFDO1lBQ2hILElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRVEsYUFBYSxDQUFDLE9BQXVCO1lBQzdDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRVEsdUJBQXVCLENBQUMsT0FBdUIsRUFBRSxDQUFrQztZQUMzRixJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFUSxXQUFXLENBQUMsT0FBdUIsRUFBRSxDQUFnQztZQUM3RSxJQUFJLENBQUMsQ0FBQyxlQUFlLElBQUksQ0FBQyxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQ3BELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN4QyxDQUFDO1lBRUQsSUFBSSxDQUFDLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLDhCQUE4QixDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbkYsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDOUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDekIsSUFBSSxRQUFRLEVBQUUsS0FBSyxLQUFLLDJDQUEwQixDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUM5RCxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3hDLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDbEMsSUFBSSxRQUFRLEVBQUUsS0FBSyxLQUFLLDJDQUEwQixDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUM5RCxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3hDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sd0JBQXdCLENBQUMsT0FBdUIsRUFBRSxDQUFtQztZQUM1RixNQUFNLFFBQVEsR0FBRyxDQUFDLEVBQUUsT0FBTyxJQUFJLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakcsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDOUYsSUFBSSxRQUFRLEVBQUUsS0FBSyxLQUFLLDJDQUEwQixDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO2dCQUNsSCxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNwQixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUF2RFksMENBQWU7OEJBQWYsZUFBZTtRQU96QixXQUFBLDhEQUE4QixDQUFBO09BUHBCLGVBQWUsQ0F1RDNCO0lBRUQsU0FBUyxlQUFlLENBQUMsV0FBd0I7UUFDaEQsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsQyxDQUFDIn0=