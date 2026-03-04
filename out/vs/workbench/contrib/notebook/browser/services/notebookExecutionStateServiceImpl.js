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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/resources", "vs/base/common/uuid", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, event_1, lifecycle_1, map_1, resources_1, uuid_1, accessibilitySignalService_1, instantiation_1, log_1, notebookCommon_1, notebookExecutionService_1, notebookExecutionStateService_1, notebookKernelService_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookExecutionStateService = void 0;
    let NotebookExecutionStateService = class NotebookExecutionStateService extends lifecycle_1.Disposable {
        constructor(_instantiationService, _logService, _notebookService, _accessibilitySignalService) {
            super();
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._notebookService = _notebookService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._executions = new map_1.ResourceMap();
            this._notebookExecutions = new map_1.ResourceMap();
            this._notebookListeners = new map_1.ResourceMap();
            this._cellListeners = new map_1.ResourceMap();
            this._lastFailedCells = new map_1.ResourceMap();
            this._onDidChangeExecution = this._register(new event_1.Emitter());
            this.onDidChangeExecution = this._onDidChangeExecution.event;
            this._onDidChangeLastRunFailState = this._register(new event_1.Emitter());
            this.onDidChangeLastRunFailState = this._onDidChangeLastRunFailState.event;
        }
        getLastFailedCellForNotebook(notebook) {
            const failedCell = this._lastFailedCells.get(notebook);
            return failedCell?.visible ? failedCell.cellHandle : undefined;
        }
        forceCancelNotebookExecutions(notebookUri) {
            const notebookCellExecutions = this._executions.get(notebookUri);
            if (notebookCellExecutions) {
                for (const exe of notebookCellExecutions.values()) {
                    this._onCellExecutionDidComplete(notebookUri, exe.cellHandle, exe);
                }
            }
            if (this._notebookExecutions.has(notebookUri)) {
                this._onExecutionDidComplete(notebookUri);
            }
        }
        getCellExecution(cellUri) {
            const parsed = notebookCommon_1.CellUri.parse(cellUri);
            if (!parsed) {
                throw new Error(`Not a cell URI: ${cellUri}`);
            }
            const exeMap = this._executions.get(parsed.notebook);
            if (exeMap) {
                return exeMap.get(parsed.handle);
            }
            return undefined;
        }
        getExecution(notebook) {
            return this._notebookExecutions.get(notebook)?.[0];
        }
        getCellExecutionsForNotebook(notebook) {
            const exeMap = this._executions.get(notebook);
            return exeMap ? Array.from(exeMap.values()) : [];
        }
        getCellExecutionsByHandleForNotebook(notebook) {
            const exeMap = this._executions.get(notebook);
            return exeMap ? new Map(exeMap.entries()) : undefined;
        }
        _onCellExecutionDidChange(notebookUri, cellHandle, exe) {
            this._onDidChangeExecution.fire(new NotebookCellExecutionEvent(notebookUri, cellHandle, exe));
        }
        _onCellExecutionDidComplete(notebookUri, cellHandle, exe, lastRunSuccess) {
            const notebookExecutions = this._executions.get(notebookUri);
            if (!notebookExecutions) {
                this._logService.debug(`NotebookExecutionStateService#_onCellExecutionDidComplete - unknown notebook ${notebookUri.toString()}`);
                return;
            }
            exe.dispose();
            const cellUri = notebookCommon_1.CellUri.generate(notebookUri, cellHandle);
            this._cellListeners.get(cellUri)?.dispose();
            this._cellListeners.delete(cellUri);
            notebookExecutions.delete(cellHandle);
            if (notebookExecutions.size === 0) {
                this._executions.delete(notebookUri);
                this._notebookListeners.get(notebookUri)?.dispose();
                this._notebookListeners.delete(notebookUri);
            }
            if (lastRunSuccess !== undefined) {
                if (lastRunSuccess) {
                    if (this._executions.size === 0) {
                        this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.notebookCellCompleted);
                    }
                    this._clearLastFailedCell(notebookUri);
                }
                else {
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.notebookCellFailed);
                    this._setLastFailedCell(notebookUri, cellHandle);
                }
            }
            this._onDidChangeExecution.fire(new NotebookCellExecutionEvent(notebookUri, cellHandle));
        }
        _onExecutionDidChange(notebookUri, exe) {
            this._onDidChangeExecution.fire(new NotebookExecutionEvent(notebookUri, exe));
        }
        _onExecutionDidComplete(notebookUri) {
            const disposables = this._notebookExecutions.get(notebookUri);
            if (!Array.isArray(disposables)) {
                this._logService.debug(`NotebookExecutionStateService#_onCellExecutionDidComplete - unknown notebook ${notebookUri.toString()}`);
                return;
            }
            this._notebookExecutions.delete(notebookUri);
            this._onDidChangeExecution.fire(new NotebookExecutionEvent(notebookUri));
            disposables.forEach(d => d.dispose());
        }
        createCellExecution(notebookUri, cellHandle) {
            const notebook = this._notebookService.getNotebookTextModel(notebookUri);
            if (!notebook) {
                throw new Error(`Notebook not found: ${notebookUri.toString()}`);
            }
            let notebookExecutionMap = this._executions.get(notebookUri);
            if (!notebookExecutionMap) {
                const listeners = this._instantiationService.createInstance(NotebookExecutionListeners, notebookUri);
                this._notebookListeners.set(notebookUri, listeners);
                notebookExecutionMap = new Map();
                this._executions.set(notebookUri, notebookExecutionMap);
            }
            let exe = notebookExecutionMap.get(cellHandle);
            if (!exe) {
                exe = this._createNotebookCellExecution(notebook, cellHandle);
                notebookExecutionMap.set(cellHandle, exe);
                exe.initialize();
                this._onDidChangeExecution.fire(new NotebookCellExecutionEvent(notebookUri, cellHandle, exe));
            }
            return exe;
        }
        createExecution(notebookUri) {
            const notebook = this._notebookService.getNotebookTextModel(notebookUri);
            if (!notebook) {
                throw new Error(`Notebook not found: ${notebookUri.toString()}`);
            }
            if (!this._notebookListeners.has(notebookUri)) {
                const listeners = this._instantiationService.createInstance(NotebookExecutionListeners, notebookUri);
                this._notebookListeners.set(notebookUri, listeners);
            }
            let info = this._notebookExecutions.get(notebookUri);
            if (!info) {
                info = this._createNotebookExecution(notebook);
                this._notebookExecutions.set(notebookUri, info);
                this._onDidChangeExecution.fire(new NotebookExecutionEvent(notebookUri, info[0]));
            }
            return info[0];
        }
        _createNotebookCellExecution(notebook, cellHandle) {
            const notebookUri = notebook.uri;
            const exe = this._instantiationService.createInstance(CellExecution, cellHandle, notebook);
            const disposable = (0, lifecycle_1.combinedDisposable)(exe.onDidUpdate(() => this._onCellExecutionDidChange(notebookUri, cellHandle, exe)), exe.onDidComplete(lastRunSuccess => this._onCellExecutionDidComplete(notebookUri, cellHandle, exe, lastRunSuccess)));
            this._cellListeners.set(notebookCommon_1.CellUri.generate(notebookUri, cellHandle), disposable);
            return exe;
        }
        _createNotebookExecution(notebook) {
            const notebookUri = notebook.uri;
            const exe = this._instantiationService.createInstance(NotebookExecution, notebook);
            const disposable = (0, lifecycle_1.combinedDisposable)(exe.onDidUpdate(() => this._onExecutionDidChange(notebookUri, exe)), exe.onDidComplete(() => this._onExecutionDidComplete(notebookUri)));
            return [exe, disposable];
        }
        _setLastFailedCell(notebookURI, cellHandle) {
            const prevLastFailedCellInfo = this._lastFailedCells.get(notebookURI);
            const notebook = this._notebookService.getNotebookTextModel(notebookURI);
            if (!notebook) {
                return;
            }
            const newLastFailedCellInfo = {
                cellHandle: cellHandle,
                disposable: prevLastFailedCellInfo ? prevLastFailedCellInfo.disposable : this._getFailedCellListener(notebook),
                visible: true
            };
            this._lastFailedCells.set(notebookURI, newLastFailedCellInfo);
            this._onDidChangeLastRunFailState.fire({ visible: true, notebook: notebookURI });
        }
        _setLastFailedCellVisibility(notebookURI, visible) {
            const lastFailedCellInfo = this._lastFailedCells.get(notebookURI);
            if (lastFailedCellInfo) {
                this._lastFailedCells.set(notebookURI, {
                    cellHandle: lastFailedCellInfo.cellHandle,
                    disposable: lastFailedCellInfo.disposable,
                    visible: visible,
                });
            }
            this._onDidChangeLastRunFailState.fire({ visible: visible, notebook: notebookURI });
        }
        _clearLastFailedCell(notebookURI) {
            const lastFailedCellInfo = this._lastFailedCells.get(notebookURI);
            if (lastFailedCellInfo) {
                lastFailedCellInfo.disposable?.dispose();
                this._lastFailedCells.delete(notebookURI);
            }
            this._onDidChangeLastRunFailState.fire({ visible: false, notebook: notebookURI });
        }
        _getFailedCellListener(notebook) {
            return notebook.onWillAddRemoveCells((e) => {
                const lastFailedCell = this._lastFailedCells.get(notebook.uri)?.cellHandle;
                if (lastFailedCell !== undefined) {
                    const lastFailedCellPos = notebook.cells.findIndex(c => c.handle === lastFailedCell);
                    e.rawEvent.changes.forEach(([start, deleteCount, addedCells]) => {
                        if (deleteCount) {
                            if (lastFailedCellPos >= start && lastFailedCellPos < start + deleteCount) {
                                this._setLastFailedCellVisibility(notebook.uri, false);
                            }
                        }
                        if (addedCells.some(cell => cell.handle === lastFailedCell)) {
                            this._setLastFailedCellVisibility(notebook.uri, true);
                        }
                    });
                }
            });
        }
        dispose() {
            super.dispose();
            this._executions.forEach(executionMap => {
                executionMap.forEach(execution => execution.dispose());
                executionMap.clear();
            });
            this._executions.clear();
            this._notebookExecutions.forEach(disposables => {
                disposables.forEach(d => d.dispose());
            });
            this._notebookExecutions.clear();
            this._cellListeners.forEach(disposable => disposable.dispose());
            this._notebookListeners.forEach(disposable => disposable.dispose());
            this._lastFailedCells.forEach(elem => elem.disposable.dispose());
        }
    };
    exports.NotebookExecutionStateService = NotebookExecutionStateService;
    exports.NotebookExecutionStateService = NotebookExecutionStateService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, log_1.ILogService),
        __param(2, notebookService_1.INotebookService),
        __param(3, accessibilitySignalService_1.IAccessibilitySignalService)
    ], NotebookExecutionStateService);
    class NotebookCellExecutionEvent {
        constructor(notebook, cellHandle, changed) {
            this.notebook = notebook;
            this.cellHandle = cellHandle;
            this.changed = changed;
            this.type = notebookExecutionStateService_1.NotebookExecutionType.cell;
        }
        affectsCell(cell) {
            const parsedUri = notebookCommon_1.CellUri.parse(cell);
            return !!parsedUri && (0, resources_1.isEqual)(this.notebook, parsedUri.notebook) && this.cellHandle === parsedUri.handle;
        }
        affectsNotebook(notebook) {
            return (0, resources_1.isEqual)(this.notebook, notebook);
        }
    }
    class NotebookExecutionEvent {
        constructor(notebook, changed) {
            this.notebook = notebook;
            this.changed = changed;
            this.type = notebookExecutionStateService_1.NotebookExecutionType.notebook;
        }
        affectsNotebook(notebook) {
            return (0, resources_1.isEqual)(this.notebook, notebook);
        }
    }
    let NotebookExecutionListeners = class NotebookExecutionListeners extends lifecycle_1.Disposable {
        constructor(notebook, _notebookService, _notebookKernelService, _notebookExecutionService, _notebookExecutionStateService, _logService) {
            super();
            this._notebookService = _notebookService;
            this._notebookKernelService = _notebookKernelService;
            this._notebookExecutionService = _notebookExecutionService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._logService = _logService;
            this._logService.debug(`NotebookExecution#ctor ${notebook.toString()}`);
            const notebookModel = this._notebookService.getNotebookTextModel(notebook);
            if (!notebookModel) {
                throw new Error('Notebook not found: ' + notebook);
            }
            this._notebookModel = notebookModel;
            this._register(this._notebookModel.onWillAddRemoveCells(e => this.onWillAddRemoveCells(e)));
            this._register(this._notebookModel.onWillDispose(() => this.onWillDisposeDocument()));
        }
        cancelAll() {
            this._logService.debug(`NotebookExecutionListeners#cancelAll`);
            const exes = this._notebookExecutionStateService.getCellExecutionsForNotebook(this._notebookModel.uri);
            this._notebookExecutionService.cancelNotebookCellHandles(this._notebookModel, exes.map(exe => exe.cellHandle));
        }
        onWillDisposeDocument() {
            this._logService.debug(`NotebookExecution#onWillDisposeDocument`);
            this.cancelAll();
        }
        onWillAddRemoveCells(e) {
            const notebookExes = this._notebookExecutionStateService.getCellExecutionsByHandleForNotebook(this._notebookModel.uri);
            const executingDeletedHandles = new Set();
            const pendingDeletedHandles = new Set();
            if (notebookExes) {
                e.rawEvent.changes.forEach(([start, deleteCount]) => {
                    if (deleteCount) {
                        const deletedHandles = this._notebookModel.cells.slice(start, start + deleteCount).map(c => c.handle);
                        deletedHandles.forEach(h => {
                            const exe = notebookExes.get(h);
                            if (exe?.state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                                executingDeletedHandles.add(h);
                            }
                            else if (exe) {
                                pendingDeletedHandles.add(h);
                            }
                        });
                    }
                });
            }
            if (executingDeletedHandles.size || pendingDeletedHandles.size) {
                const kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(this._notebookModel);
                if (kernel) {
                    const implementsInterrupt = kernel.implementsInterrupt;
                    const handlesToCancel = implementsInterrupt ? [...executingDeletedHandles] : [...executingDeletedHandles, ...pendingDeletedHandles];
                    this._logService.debug(`NotebookExecution#onWillAddRemoveCells, ${JSON.stringify([...handlesToCancel])}`);
                    if (handlesToCancel.length) {
                        kernel.cancelNotebookCellExecution(this._notebookModel.uri, handlesToCancel);
                    }
                }
            }
        }
    };
    NotebookExecutionListeners = __decorate([
        __param(1, notebookService_1.INotebookService),
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, notebookExecutionService_1.INotebookExecutionService),
        __param(4, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(5, log_1.ILogService)
    ], NotebookExecutionListeners);
    function updateToEdit(update, cellHandle) {
        if (update.editType === notebookExecutionService_1.CellExecutionUpdateType.Output) {
            return {
                editType: 2 /* CellEditType.Output */,
                handle: update.cellHandle,
                append: update.append,
                outputs: update.outputs,
            };
        }
        else if (update.editType === notebookExecutionService_1.CellExecutionUpdateType.OutputItems) {
            return {
                editType: 7 /* CellEditType.OutputItems */,
                items: update.items,
                append: update.append,
                outputId: update.outputId
            };
        }
        else if (update.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState) {
            const newInternalMetadata = {};
            if (typeof update.executionOrder !== 'undefined') {
                newInternalMetadata.executionOrder = update.executionOrder;
            }
            if (typeof update.runStartTime !== 'undefined') {
                newInternalMetadata.runStartTime = update.runStartTime;
            }
            return {
                editType: 9 /* CellEditType.PartialInternalMetadata */,
                handle: cellHandle,
                internalMetadata: newInternalMetadata
            };
        }
        throw new Error('Unknown cell update type');
    }
    let CellExecution = class CellExecution extends lifecycle_1.Disposable {
        get state() {
            return this._state;
        }
        get notebook() {
            return this._notebookModel.uri;
        }
        get didPause() {
            return this._didPause;
        }
        get isPaused() {
            return this._isPaused;
        }
        constructor(cellHandle, _notebookModel, _logService) {
            super();
            this.cellHandle = cellHandle;
            this._notebookModel = _notebookModel;
            this._logService = _logService;
            this._onDidUpdate = this._register(new event_1.Emitter());
            this.onDidUpdate = this._onDidUpdate.event;
            this._onDidComplete = this._register(new event_1.Emitter());
            this.onDidComplete = this._onDidComplete.event;
            this._state = notebookCommon_1.NotebookCellExecutionState.Unconfirmed;
            this._didPause = false;
            this._isPaused = false;
            this._logService.debug(`CellExecution#ctor ${this.getCellLog()}`);
        }
        initialize() {
            const startExecuteEdit = {
                editType: 9 /* CellEditType.PartialInternalMetadata */,
                handle: this.cellHandle,
                internalMetadata: {
                    executionId: (0, uuid_1.generateUuid)(),
                    runStartTime: null,
                    runEndTime: null,
                    lastRunSuccess: null,
                    executionOrder: null,
                    renderDuration: null,
                }
            };
            this._applyExecutionEdits([startExecuteEdit]);
        }
        getCellLog() {
            return `${this._notebookModel.uri.toString()}, ${this.cellHandle}`;
        }
        logUpdates(updates) {
            const updateTypes = updates.map(u => notebookExecutionService_1.CellExecutionUpdateType[u.editType]).join(', ');
            this._logService.debug(`CellExecution#updateExecution ${this.getCellLog()}, [${updateTypes}]`);
        }
        confirm() {
            this._logService.debug(`CellExecution#confirm ${this.getCellLog()}`);
            this._state = notebookCommon_1.NotebookCellExecutionState.Pending;
            this._onDidUpdate.fire();
        }
        update(updates) {
            this.logUpdates(updates);
            if (updates.some(u => u.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState)) {
                this._state = notebookCommon_1.NotebookCellExecutionState.Executing;
            }
            if (!this._didPause && updates.some(u => u.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState && u.didPause)) {
                this._didPause = true;
            }
            const lastIsPausedUpdate = [...updates].reverse().find(u => u.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState && typeof u.isPaused === 'boolean');
            if (lastIsPausedUpdate) {
                this._isPaused = lastIsPausedUpdate.isPaused;
            }
            const cellModel = this._notebookModel.cells.find(c => c.handle === this.cellHandle);
            if (!cellModel) {
                this._logService.debug(`CellExecution#update, updating cell not in notebook: ${this._notebookModel.uri.toString()}, ${this.cellHandle}`);
            }
            else {
                const edits = updates.map(update => updateToEdit(update, this.cellHandle));
                this._applyExecutionEdits(edits);
            }
            if (updates.some(u => u.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState)) {
                this._onDidUpdate.fire();
            }
        }
        complete(completionData) {
            const cellModel = this._notebookModel.cells.find(c => c.handle === this.cellHandle);
            if (!cellModel) {
                this._logService.debug(`CellExecution#complete, completing cell not in notebook: ${this._notebookModel.uri.toString()}, ${this.cellHandle}`);
            }
            else {
                const edit = {
                    editType: 9 /* CellEditType.PartialInternalMetadata */,
                    handle: this.cellHandle,
                    internalMetadata: {
                        lastRunSuccess: completionData.lastRunSuccess,
                        runStartTime: this._didPause ? null : cellModel.internalMetadata.runStartTime,
                        runEndTime: this._didPause ? null : completionData.runEndTime,
                        error: completionData.error
                    }
                };
                this._applyExecutionEdits([edit]);
            }
            this._onDidComplete.fire(completionData.lastRunSuccess);
        }
        _applyExecutionEdits(edits) {
            this._notebookModel.applyEdits(edits, true, undefined, () => undefined, undefined, false);
        }
    };
    CellExecution = __decorate([
        __param(2, log_1.ILogService)
    ], CellExecution);
    let NotebookExecution = class NotebookExecution extends lifecycle_1.Disposable {
        get state() {
            return this._state;
        }
        get notebook() {
            return this._notebookModel.uri;
        }
        constructor(_notebookModel, _logService) {
            super();
            this._notebookModel = _notebookModel;
            this._logService = _logService;
            this._onDidUpdate = this._register(new event_1.Emitter());
            this.onDidUpdate = this._onDidUpdate.event;
            this._onDidComplete = this._register(new event_1.Emitter());
            this.onDidComplete = this._onDidComplete.event;
            this._state = notebookCommon_1.NotebookExecutionState.Unconfirmed;
            this._logService.debug(`NotebookExecution#ctor`);
        }
        debug(message) {
            this._logService.debug(`${message} ${this._notebookModel.uri.toString()}`);
        }
        confirm() {
            this.debug(`Execution#confirm`);
            this._state = notebookCommon_1.NotebookExecutionState.Pending;
            this._onDidUpdate.fire();
        }
        begin() {
            this.debug(`Execution#begin`);
            this._state = notebookCommon_1.NotebookExecutionState.Executing;
            this._onDidUpdate.fire();
        }
        complete() {
            this.debug(`Execution#begin`);
            this._state = notebookCommon_1.NotebookExecutionState.Unconfirmed;
            this._onDidComplete.fire();
        }
    };
    NotebookExecution = __decorate([
        __param(1, log_1.ILogService)
    ], NotebookExecution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFeGVjdXRpb25TdGF0ZVNlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9zZXJ2aWNlcy9ub3RlYm9va0V4ZWN1dGlvblN0YXRlU2VydmljZUltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE4QixTQUFRLHNCQUFVO1FBZTVELFlBQ3dCLHFCQUE2RCxFQUN2RSxXQUF5QyxFQUNwQyxnQkFBbUQsRUFDeEMsMkJBQXlFO1lBRXRHLEtBQUssRUFBRSxDQUFDO1lBTGdDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDdEQsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDbkIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUN2QixnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQTZCO1lBaEJ0RixnQkFBVyxHQUFHLElBQUksaUJBQVcsRUFBOEIsQ0FBQztZQUM1RCx3QkFBbUIsR0FBRyxJQUFJLGlCQUFXLEVBQW9DLENBQUM7WUFDMUUsdUJBQWtCLEdBQUcsSUFBSSxpQkFBVyxFQUE4QixDQUFDO1lBQ25FLG1CQUFjLEdBQUcsSUFBSSxpQkFBVyxFQUFlLENBQUM7WUFDaEQscUJBQWdCLEdBQUcsSUFBSSxpQkFBVyxFQUFtQixDQUFDO1lBRXRELDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWlFLENBQUMsQ0FBQztZQUN0SSx5QkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBRXZDLGlDQUE0QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWtDLENB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