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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/codicons", "vs/base/common/themables", "vs/nls", "vs/workbench/contrib/notebook/browser/controller/foldingController", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/lifecycle"], function (require, exports, DOM, codicons_1, themables_1, nls_1, foldingController_1, notebookBrowser_1, cellPart_1, notebookIcons_1, notebookExecutionStateService_1, notebookCommon_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldedCellHint = void 0;
    let FoldedCellHint = class FoldedCellHint extends cellPart_1.CellContentPart {
        constructor(_notebookEditor, _container, _notebookExecutionStateService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._container = _container;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._runButtonListener = this._register(new lifecycle_1.MutableDisposable());
            this._cellExecutionListener = this._register(new lifecycle_1.MutableDisposable());
        }
        didRenderCell(element) {
            this.update(element);
        }
        update(element) {
            if (!this._notebookEditor.hasModel()) {
                this._cellExecutionListener.clear();
                this._runButtonListener.clear();
                return;
            }
            if (element.isInputCollapsed || element.getEditState() === notebookBrowser_1.CellEditState.Editing) {
                this._cellExecutionListener.clear();
                this._runButtonListener.clear();
                DOM.hide(this._container);
            }
            else if (element.foldingState === 2 /* CellFoldingState.Collapsed */) {
                const idx = this._notebookEditor.getViewModel().getCellIndex(element);
                const length = this._notebookEditor.getViewModel().getFoldedLength(idx);
                DOM.reset(this._container, this.getRunFoldedSectionButton({ start: idx, end: idx + length + 1 }), this.getHiddenCellsLabel(length), this.getHiddenCellHintButton(element));
                DOM.show(this._container);
                const foldHintTop = element.layoutInfo.previewHeight;
                this._container.style.top = `${foldHintTop}px`;
            }
            else {
                this._cellExecutionListener.clear();
                this._runButtonListener.clear();
                DOM.hide(this._container);
            }
        }
        getHiddenCellsLabel(num) {
            const label = num === 1 ?
                (0, nls_1.localize)('hiddenCellsLabel', "1 cell hidden") :
                (0, nls_1.localize)('hiddenCellsLabelPlural', "{0} cells hidden", num);
            return DOM.$('span.notebook-folded-hint-label', undefined, label);
        }
        getHiddenCellHintButton(element) {
            const expandIcon = DOM.$('span.cell-expand-part-button');
            expandIcon.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.more));
            this._register(DOM.addDisposableListener(expandIcon, DOM.EventType.CLICK, () => {
                const controller = this._notebookEditor.getContribution(foldingController_1.FoldingController.id);
                const idx = this._notebookEditor.getCellIndex(element);
                if (typeof idx === 'number') {
                    controller.setFoldingStateDown(idx, 1 /* CellFoldingState.Expanded */, 1);
                }
            }));
            return expandIcon;
        }
        getRunFoldedSectionButton(range) {
            const runAllContainer = DOM.$('span.folded-cell-run-section-button');
            const cells = this._notebookEditor.getCellsInRange(range);
            const isRunning = cells.some(cell => {
                const cellExecution = this._notebookExecutionStateService.getCellExecution(cell.uri);
                return cellExecution && cellExecution.state === notebookCommon_1.NotebookCellExecutionState.Executing;
            });
            const runAllIcon = isRunning ?
                themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin') :
                codicons_1.Codicon.play;
            runAllContainer.classList.add(...themables_1.ThemeIcon.asClassNameArray(runAllIcon));
            this._runButtonListener.value = DOM.addDisposableListener(runAllContainer, DOM.EventType.CLICK, () => {
                this._notebookEditor.executeNotebookCells(cells);
            });
            this._cellExecutionListener.value = this._notebookExecutionStateService.onDidChangeExecution(() => {
                const isRunning = cells.some(cell => {
                    const cellExecution = this._notebookExecutionStateService.getCellExecution(cell.uri);
                    return cellExecution && cellExecution.state === notebookCommon_1.NotebookCellExecutionState.Executing;
                });
                const runAllIcon = isRunning ?
                    themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin') :
                    codicons_1.Codicon.play;
                runAllContainer.className = '';
                runAllContainer.classList.add('folded-cell-run-section-button', ...themables_1.ThemeIcon.asClassNameArray(runAllIcon));
            });
            return runAllContainer;
        }
        updateInternalLayoutNow(element) {
            this.update(element);
        }
    };
    exports.FoldedCellHint = FoldedCellHint;
    exports.FoldedCellHint = FoldedCellHint = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], FoldedCellHint);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGVkQ2VsbEhpbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2ZvbGRlZENlbGxIaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCekYsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLDBCQUFlO1FBS2xELFlBQ2tCLGVBQWdDLEVBQ2hDLFVBQXVCLEVBQ1IsOEJBQStFO1lBRS9HLEtBQUssRUFBRSxDQUFDO1lBSlMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ2hDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDUyxtQ0FBOEIsR0FBOUIsOEJBQThCLENBQWdDO1lBTi9GLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFDN0QsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztRQVFsRixDQUFDO1FBRVEsYUFBYSxDQUFDLE9BQTRCO1lBQ2xELElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEIsQ0FBQztRQUVPLE1BQU0sQ0FBQyxPQUE0QjtZQUMxQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxPQUFPLENBQUMsWUFBWSxFQUFFLEtBQUss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