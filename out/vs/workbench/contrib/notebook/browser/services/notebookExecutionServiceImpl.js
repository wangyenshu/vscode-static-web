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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/log/common/log", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/notebook/browser/viewParts/notebookKernelQuickPickStrategy", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService"], function (require, exports, lifecycle_1, nls, commands_1, log_1, workspaceTrust_1, notebookKernelQuickPickStrategy_1, notebookCommon_1, notebookExecutionStateService_1, notebookKernelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookExecutionService = void 0;
    let NotebookExecutionService = class NotebookExecutionService {
        constructor(_commandService, _notebookKernelService, _notebookKernelHistoryService, _workspaceTrustRequestService, _logService, _notebookExecutionStateService) {
            this._commandService = _commandService;
            this._notebookKernelService = _notebookKernelService;
            this._notebookKernelHistoryService = _notebookKernelHistoryService;
            this._workspaceTrustRequestService = _workspaceTrustRequestService;
            this._logService = _logService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this.cellExecutionParticipants = new Set;
        }
        async executeNotebookCells(notebook, cells, contextKeyService) {
            const cellsArr = Array.from(cells)
                .filter(c => c.cellKind === notebookCommon_1.CellKind.Code);
            if (!cellsArr.length) {
                return;
            }
            this._logService.debug(`NotebookExecutionService#executeNotebookCells ${JSON.stringify(cellsArr.map(c => c.handle))}`);
            const message = nls.localize('notebookRunTrust', "Executing a notebook cell will run code from this workspace.");
            const trust = await this._workspaceTrustRequestService.requestWorkspaceTrust({ message });
            if (!trust) {
                return;
            }
            // create cell executions
            const cellExecutions = [];
            for (const cell of cellsArr) {
                const cellExe = this._notebookExecutionStateService.getCellExecution(cell.uri);
                if (!!cellExe) {
                    continue;
                }
                cellExecutions.push([cell, this._notebookExecutionStateService.createCellExecution(notebook.uri, cell.handle)]);
            }
            const kernel = await notebookKernelQuickPickStrategy_1.KernelPickerMRUStrategy.resolveKernel(notebook, this._notebookKernelService, this._notebookKernelHistoryService, this._commandService);
            if (!kernel) {
                // clear all pending cell executions
                cellExecutions.forEach(cellExe => cellExe[1].complete({}));
                return;
            }
            this._notebookKernelHistoryService.addMostRecentKernel(kernel);
            // filter cell executions based on selected kernel
            const validCellExecutions = [];
            for (const [cell, cellExecution] of cellExecutions) {
                if (!kernel.supportedLanguages.includes(cell.language)) {
                    cellExecution.complete({});
                }
                else {
                    validCellExecutions.push(cellExecution);
                }
            }
            // request execution
            if (validCellExecutions.length > 0) {
                await this.runExecutionParticipants(validCellExecutions);
                this._notebookKernelService.selectKernelForNotebook(kernel, notebook);
                await kernel.executeNotebookCellsRequest(notebook.uri, validCellExecutions.map(c => c.cellHandle));
                // the connecting state can change before the kernel resolves executeNotebookCellsRequest
                const unconfirmed = validCellExecutions.filter(exe => exe.state === notebookCommon_1.NotebookCellExecutionState.Unconfirmed);
                if (unconfirmed.length) {
                    this._logService.debug(`NotebookExecutionService#executeNotebookCells completing unconfirmed executions ${JSON.stringify(unconfirmed.map(exe => exe.cellHandle))}`);
                    unconfirmed.forEach(exe => exe.complete({}));
                }
            }
        }
        async cancelNotebookCellHandles(notebook, cells) {
            const cellsArr = Array.from(cells);
            this._logService.debug(`NotebookExecutionService#cancelNotebookCellHandles ${JSON.stringify(cellsArr)}`);
            const kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(notebook);
            if (kernel) {
                await kernel.cancelNotebookCellExecution(notebook.uri, cellsArr);
            }
        }
        async cancelNotebookCells(notebook, cells) {
            this.cancelNotebookCellHandles(notebook, Array.from(cells, cell => cell.handle));
        }
        registerExecutionParticipant(participant) {
            this.cellExecutionParticipants.add(participant);
            return (0, lifecycle_1.toDisposable)(() => this.cellExecutionParticipants.delete(participant));
        }
        async runExecutionParticipants(executions) {
            for (const participant of this.cellExecutionParticipants) {
                await participant.onWillExecuteCell(executions);
            }
            return;
        }
        dispose() {
            this._activeProxyKernelExecutionToken?.dispose(true);
        }
    };
    exports.NotebookExecutionService = NotebookExecutionService;
    exports.NotebookExecutionService = NotebookExecutionService = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, notebookKernelService_1.INotebookKernelService),
        __param(2, notebookKernelService_1.INotebookKernelHistoryService),
        __param(3, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(4, log_1.ILogService),
        __param(5, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], NotebookExecutionService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFeGVjdXRpb25TZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvc2VydmljZXMvbm90ZWJvb2tFeGVjdXRpb25TZXJ2aWNlSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQnpGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXdCO1FBSXBDLFlBQ2tCLGVBQWlELEVBQzFDLHNCQUErRCxFQUN4RCw2QkFBNkUsRUFDN0UsNkJBQTZFLEVBQy9GLFdBQXlDLEVBQ3RCLDhCQUErRTtZQUw3RSxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDekIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtZQUN2QyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQStCO1lBQzVELGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBK0I7WUFDOUUsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDTCxtQ0FBOEIsR0FBOUIsOEJBQThCLENBQWdDO1lBNkUvRiw4QkFBeUIsR0FBRyxJQUFJLEdBQThCLENBQUM7UUEzRWhGLENBQUM7UUFFRCxLQUFLLENBQUMsb0JBQW9CLENBQUMsUUFBNEIsRUFBRSxLQUFzQyxFQUFFLGlCQUFxQztZQUNySSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztpQkFDaEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsS0FBSyx5QkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3RCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxL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