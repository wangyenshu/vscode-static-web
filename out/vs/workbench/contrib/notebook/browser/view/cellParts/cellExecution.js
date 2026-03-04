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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, DOM, async_1, lifecycle_1, cellPart_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellExecutionPart = void 0;
    const UPDATE_EXECUTION_ORDER_GRACE_PERIOD = 200;
    let CellExecutionPart = class CellExecutionPart extends cellPart_1.CellContentPart {
        constructor(_notebookEditor, _executionOrderLabel, _notebookExecutionStateService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._executionOrderLabel = _executionOrderLabel;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this.kernelDisposables = this._register(new lifecycle_1.DisposableStore());
            this._register(this._notebookEditor.onDidChangeActiveKernel(() => {
                if (this.currentCell) {
                    this.kernelDisposables.clear();
                    if (this._notebookEditor.activeKernel) {
                        this.kernelDisposables.add(this._notebookEditor.activeKernel.onDidChange(() => {
                            if (this.currentCell) {
                                this.updateExecutionOrder(this.currentCell.internalMetadata);
                            }
                        }));
                    }
                    this.updateExecutionOrder(this.currentCell.internalMetadata);
                }
            }));
        }
        didRenderCell(element) {
            this.updateExecutionOrder(element.internalMetadata, true);
        }
        updateExecutionOrder(internalMetadata, forceClear = false) {
            if (this._notebookEditor.activeKernel?.implementsExecutionOrder || (!this._notebookEditor.activeKernel && typeof internalMetadata.executionOrder === 'number')) {
                // If the executionOrder was just cleared, and the cell is executing, wait just a bit before clearing the view to avoid flashing
                if (typeof internalMetadata.executionOrder !== 'number' && !forceClear && !!this._notebookExecutionStateService.getCellExecution(this.currentCell.uri)) {
                    const renderingCell = this.currentCell;
                    (0, async_1.disposableTimeout)(() => {
                        if (this.currentCell === renderingCell) {
                            this.updateExecutionOrder(this.currentCell.internalMetadata, true);
                        }
                    }, UPDATE_EXECUTION_ORDER_GRACE_PERIOD, this.cellDisposables);
                    return;
                }
                const executionOrderLabel = typeof internalMetadata.executionOrder === 'number' ?
                    `[${internalMetadata.executionOrder}]` :
                    '[ ]';
                this._executionOrderLabel.innerText = executionOrderLabel;
            }
            else {
                this._executionOrderLabel.innerText = '';
            }
        }
        updateState(element, e) {
            if (e.internalMetadataChanged) {
                this.updateExecutionOrder(element.internalMetadata);
            }
        }
        updateInternalLayoutNow(element) {
            if (element.isInputCollapsed) {
                DOM.hide(this._executionOrderLabel);
            }
            else {
                DOM.show(this._executionOrderLabel);
                const top = element.layoutInfo.editorHeight - 22 + element.layoutInfo.statusBarHeight;
                this._executionOrderLabel.style.top = `${top}px`;
            }
        }
    };
    exports.CellExecutionPart = CellExecutionPart;
    exports.CellExecutionPart = CellExecutionPart = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CellExecutionPart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbEV4ZWN1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlldy9jZWxsUGFydHMvY2VsbEV4ZWN1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXaEcsTUFBTSxtQ0FBbUMsR0FBRyxHQUFHLENBQUM7SUFFekMsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSwwQkFBZTtRQUdyRCxZQUNrQixlQUF3QyxFQUN4QyxvQkFBaUMsRUFDbEIsOEJBQStFO1lBRS9HLEtBQUssRUFBRSxDQUFDO1lBSlMsb0JBQWUsR0FBZixlQUFlLENBQXlCO1lBQ3hDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBYTtZQUNELG1DQUE4QixHQUE5Qiw4QkFBOEIsQ0FBZ0M7WUFML0Ysc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBUzFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2hFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUN0QixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBRS9CLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDdkMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFOzRCQUM3RSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQ0FDdEIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElB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