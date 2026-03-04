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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/lifecycle", "vs/nls", "vs/base/common/themables", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, DOM, iconLabels_1, lifecycle_1, nls_1, themables_1, notebookIcons_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollapsedCodeCellExecutionIcon = void 0;
    let CollapsedCodeCellExecutionIcon = class CollapsedCodeCellExecutionIcon extends lifecycle_1.Disposable {
        constructor(_notebookEditor, _cell, _element, _executionStateService) {
            super();
            this._cell = _cell;
            this._element = _element;
            this._executionStateService = _executionStateService;
            this._visible = false;
            this._update();
            this._register(this._executionStateService.onDidChangeExecution(e => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && e.affectsCell(this._cell.uri)) {
                    this._update();
                }
            }));
            this._register(this._cell.model.onDidChangeInternalMetadata(() => this._update()));
        }
        setVisibility(visible) {
            this._visible = visible;
            this._update();
        }
        _update() {
            if (!this._visible) {
                return;
            }
            const runState = this._executionStateService.getCellExecution(this._cell.uri);
            const item = this._getItemForState(runState, this._cell.model.internalMetadata);
            if (item) {
                this._element.style.display = '';
                DOM.reset(this._element, ...(0, iconLabels_1.renderLabelWithIcons)(item.text));
                this._element.title = item.tooltip ?? '';
            }
            else {
                this._element.style.display = 'none';
                DOM.reset(this._element);
            }
        }
        _getItemForState(runState, internalMetadata) {
            const state = runState?.state;
            const { lastRunSuccess } = internalMetadata;
            if (!state && lastRunSuccess) {
                return {
                    text: `$(${notebookIcons_1.successStateIcon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.success', "Success"),
                };
            }
            else if (!state && lastRunSuccess === false) {
                return {
                    text: `$(${notebookIcons_1.errorStateIcon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.failure', "Failure"),
                };
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Pending || state === notebookCommon_1.NotebookCellExecutionState.Unconfirmed) {
                return {
                    text: `$(${notebookIcons_1.pendingStateIcon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.pending', "Pending"),
                };
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                const icon = themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin');
                return {
                    text: `$(${icon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.executing', "Executing"),
                };
            }
            return;
        }
    };
    exports.CollapsedCodeCellExecutionIcon = CollapsedCodeCellExecutionIcon;
    exports.CollapsedCodeCellExecutionIcon = CollapsedCodeCellExecutionIcon = __decorate([
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CollapsedCodeCellExecutionIcon);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUNlbGxFeGVjdXRpb25JY29uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9jb2RlQ2VsbEV4ZWN1dGlvbkljb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJ6RixJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLHNCQUFVO1FBRzdELFlBQ0MsZUFBd0MsRUFDdkIsS0FBcUIsRUFDckIsUUFBcUIsRUFDTixzQkFBOEQ7WUFFOUYsS0FBSyxFQUFFLENBQUM7WUFKUyxVQUFLLEdBQUwsS0FBSyxDQUFnQjtZQUNyQixhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQ0UsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFnQztZQU52RixhQUFRLEdBQUcsS0FBSyxDQUFDO1lBVXhCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNuRSxJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUsscURBQXFCLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUM1RSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFD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