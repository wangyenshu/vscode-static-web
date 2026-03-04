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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/services/userActivity/common/userActivityService"], function (require, exports, decorators_1, lifecycle_1, notebookEditorExtensions_1, notebookCommon_1, notebookExecutionStateService_1, userActivityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExecutionEditorProgressController = void 0;
    let ExecutionEditorProgressController = class ExecutionEditorProgressController extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.executionEditorProgress'; }
        constructor(_notebookEditor, _notebookExecutionStateService, _userActivity) {
            super();
            this._notebookEditor = _notebookEditor;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._userActivity = _userActivity;
            this._activityMutex = this._register(new lifecycle_1.MutableDisposable());
            this._register(_notebookEditor.onDidScroll(() => this._update()));
            this._register(_notebookExecutionStateService.onDidChangeExecution(e => {
                if (e.notebook.toString() !== this._notebookEditor.textModel?.uri.toString()) {
                    return;
                }
                this._update();
            }));
            this._register(_notebookEditor.onDidChangeModel(() => this._update()));
        }
        _update() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const cellExecutions = this._notebookExecutionStateService.getCellExecutionsForNotebook(this._notebookEditor.textModel?.uri)
                .filter(exe => exe.state === notebookCommon_1.NotebookCellExecutionState.Executing);
            const notebookExecution = this._notebookExecutionStateService.getExecution(this._notebookEditor.textModel?.uri);
            const executionIsVisible = (exe) => {
                for (const range of this._notebookEditor.visibleRanges) {
                    for (const cell of this._notebookEditor.getCellsInRange(range)) {
                        if (cell.handle === exe.cellHandle) {
                            const top = this._notebookEditor.getAbsoluteTopOfElement(cell);
                            if (this._notebookEditor.scrollTop < top + 5) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            };
            const hasAnyExecution = cellExecutions.length || notebookExecution;
            if (hasAnyExecution && !this._activityMutex.value) {
                this._activityMutex.value = this._userActivity.markActive();
            }
            else if (!hasAnyExecution && this._activityMutex.value) {
                this._activityMutex.clear();
            }
            const shouldShowEditorProgressbarForCellExecutions = cellExecutions.length && !cellExecutions.some(executionIsVisible) && !cellExecutions.some(e => e.isPaused);
            const showEditorProgressBar = !!notebookExecution || shouldShowEditorProgressbarForCellExecutions;
            if (showEditorProgressBar) {
                this._notebookEditor.showProgress();
            }
            else {
                this._notebookEditor.hideProgress();
            }
        }
    };
    exports.ExecutionEditorProgressController = ExecutionEditorProgressController;
    __decorate([
        (0, decorators_1.throttle)(100)
    ], ExecutionEditorProgressController.prototype, "_update", null);
    exports.ExecutionEditorProgressController = ExecutionEditorProgressController = __decorate([
        __param(1, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(2, userActivityService_1.IUserActivityService)
    ], ExecutionEditorProgressController);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(ExecutionEditorProgressController.id, ExecutionEditorProgressController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0aW9uRWRpdG9yUHJvZ3Jlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvZXhlY3V0ZS9leGVjdXRpb25FZGl0b3JQcm9ncmVzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSxpQ0FBaUMsR0FBdkMsTUFBTSxpQ0FBa0MsU0FBUSxzQkFBVTtpQkFDekQsT0FBRSxHQUFXLDRDQUE0QyxBQUF2RCxDQUF3RDtRQUlqRSxZQUNrQixlQUFnQyxFQUNqQiw4QkFBK0UsRUFDekYsYUFBb0Q7WUFFMUUsS0FBSyxFQUFFLENBQUM7WUFKUyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDQSxtQ0FBOEIsR0FBOUIsOEJBQThCLENBQWdDO1lBQ3hFLGtCQUFhLEdBQWIsYUFBYSxDQUFzQjtZQUwxRCxtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFTekUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyw4QkFBOEIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDdEUsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUM5RSxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLENBQUMs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