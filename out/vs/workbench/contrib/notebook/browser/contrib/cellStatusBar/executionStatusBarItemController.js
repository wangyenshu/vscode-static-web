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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/notebookVisibleCellObserver", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/browser/contrib/cellCommands/cellCommands", "vs/platform/keybinding/common/keybinding"], function (require, exports, async_1, lifecycle_1, platform_1, nls_1, instantiation_1, themeService_1, themables_1, notebookVisibleCellObserver_1, notebookEditorExtensions_1, notebookEditorWidget_1, notebookIcons_1, notebookCommon_1, notebookExecutionStateService_1, notebookService_1, codeCellViewModel_1, cellCommands_1, keybinding_1) {
    "use strict";
    var ExecutionStateCellStatusBarItem_1, TimerCellStatusBarItem_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagnosticCellStatusBarContrib = exports.TimerCellStatusBarContrib = exports.ExecutionStateCellStatusBarContrib = exports.NotebookStatusBarController = void 0;
    exports.formatCellDuration = formatCellDuration;
    function formatCellDuration(duration, showMilliseconds = true) {
        if (showMilliseconds && duration < 1000) {
            return `${duration}ms`;
        }
        const minutes = Math.floor(duration / 1000 / 60);
        const seconds = Math.floor(duration / 1000) % 60;
        const tenths = Math.floor((duration % 1000) / 100);
        if (minutes > 0) {
            return `${minutes}m ${seconds}.${tenths}s`;
        }
        else {
            return `${seconds}.${tenths}s`;
        }
    }
    class NotebookStatusBarController extends lifecycle_1.Disposable {
        constructor(_notebookEditor, _itemFactory) {
            super();
            this._notebookEditor = _notebookEditor;
            this._itemFactory = _itemFactory;
            this._visibleCells = new Map();
            this._observer = this._register(new notebookVisibleCellObserver_1.NotebookVisibleCellObserver(this._notebookEditor));
            this._register(this._observer.onDidChangeVisibleCells(this._updateVisibleCells, this));
            this._updateEverything();
        }
        _updateEverything() {
            this._visibleCells.forEach(lifecycle_1.dispose);
            this._visibleCells.clear();
            this._updateVisibleCells({ added: this._observer.visibleCells, removed: [] });
        }
        _updateVisibleCells(e) {
            const vm = this._notebookEditor.getViewModel();
            if (!vm) {
                return;
            }
            for (const oldCell of e.removed) {
                this._visibleCells.get(oldCell.handle)?.dispose();
                this._visibleCells.delete(oldCell.handle);
            }
            for (const newCell of e.added) {
                this._visibleCells.set(newCell.handle, this._itemFactory(vm, newCell));
            }
        }
        dispose() {
            super.dispose();
            this._visibleCells.forEach(lifecycle_1.dispose);
            this._visibleCells.clear();
        }
    }
    exports.NotebookStatusBarController = NotebookStatusBarController;
    let ExecutionStateCellStatusBarContrib = class ExecutionStateCellStatusBarContrib extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.statusBar.execState'; }
        constructor(notebookEditor, instantiationService) {
            super();
            this._register(new NotebookStatusBarController(notebookEditor, (vm, cell) => instantiationService.createInstance(ExecutionStateCellStatusBarItem, vm, cell)));
        }
    };
    exports.ExecutionStateCellStatusBarContrib = ExecutionStateCellStatusBarContrib;
    exports.ExecutionStateCellStatusBarContrib = ExecutionStateCellStatusBarContrib = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ExecutionStateCellStatusBarContrib);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(ExecutionStateCellStatusBarContrib.id, ExecutionStateCellStatusBarContrib);
    /**
     * Shows the cell's execution state in the cell status bar. When the "executing" state is shown, it will be shown for a minimum brief time.
     */
    let ExecutionStateCellStatusBarItem = class ExecutionStateCellStatusBarItem extends lifecycle_1.Disposable {
        static { ExecutionStateCellStatusBarItem_1 = this; }
        static { this.MIN_SPINNER_TIME = 500; }
        constructor(_notebookViewModel, _cell, _executionStateService) {
            super();
            this._notebookViewModel = _notebookViewModel;
            this._cell = _cell;
            this._executionStateService = _executionStateService;
            this._currentItemIds = [];
            this._clearExecutingStateTimer = this._register(new lifecycle_1.MutableDisposable());
            this._update();
            this._register(this._executionStateService.onDidChangeExecution(e => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && e.affectsCell(this._cell.uri)) {
                    this._update();
                }
            }));
            this._register(this._cell.model.onDidChangeInternalMetadata(() => this._update()));
        }
        async _update() {
            const items = this._getItemsForCell();
            if (Array.isArray(items)) {
                this._currentItemIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items }]);
            }
        }
        /**
         *	Returns undefined if there should be no change, and an empty array if all items should be removed.
         */
        _getItemsForCell() {
            const runState = this._executionStateService.getCellExecution(this._cell.uri);
            // Show the execution spinner for a minimum time
            if (runState?.state === notebookCommon_1.NotebookCellExecutionState.Executing && typeof this._showedExecutingStateTime !== 'number') {
                this._showedExecutingStateTime = Date.now();
            }
            else if (runState?.state !== notebookCommon_1.NotebookCellExecutionState.Executing && typeof this._showedExecutingStateTime === 'number') {
                const timeUntilMin = ExecutionStateCellStatusBarItem_1.MIN_SPINNER_TIME - (Date.now() - this._showedExecutingStateTime);
                if (timeUntilMin > 0) {
                    if (!this._clearExecutingStateTimer.value) {
                        this._clearExecutingStateTimer.value = (0, async_1.disposableTimeout)(() => {
                            this._showedExecutingStateTime = undefined;
                            this._clearExecutingStateTimer.clear();
                            this._update();
                        }, timeUntilMin);
                    }
                    return undefined;
                }
                else {
                    this._showedExecutingStateTime = undefined;
                }
            }
            const items = this._getItemForState(runState, this._cell.internalMetadata);
            return items;
        }
        _getItemForState(runState, internalMetadata) {
            const state = runState?.state;
            const { lastRunSuccess } = internalMetadata;
            if (!state && lastRunSuccess) {
                return [{
                        text: `$(${notebookIcons_1.successStateIcon.id})`,
                        color: (0, themeService_1.themeColorFromId)(notebookEditorWidget_1.cellStatusIconSuccess),
                        tooltip: (0, nls_1.localize)('notebook.cell.status.success', "Success"),
                        alignment: 1 /* CellStatusbarAlignment.Left */,
                        priority: Number.MAX_SAFE_INTEGER
                    }];
            }
            else if (!state && lastRunSuccess === false) {
                return [{
                        text: `$(${notebookIcons_1.errorStateIcon.id})`,
                        color: (0, themeService_1.themeColorFromId)(notebookEditorWidget_1.cellStatusIconError),
                        tooltip: (0, nls_1.localize)('notebook.cell.status.failed', "Failed"),
                        alignment: 1 /* CellStatusbarAlignment.Left */,
                        priority: Number.MAX_SAFE_INTEGER
                    }];
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Pending || state === notebookCommon_1.NotebookCellExecutionState.Unconfirmed) {
                return [{
                        text: `$(${notebookIcons_1.pendingStateIcon.id})`,
                        tooltip: (0, nls_1.localize)('notebook.cell.status.pending', "Pending"),
                        alignment: 1 /* CellStatusbarAlignment.Left */,
                        priority: Number.MAX_SAFE_INTEGER
                    }];
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                const icon = runState?.didPause ?
                    notebookIcons_1.executingStateIcon :
                    themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin');
                return [{
                        text: `$(${icon.id})`,
                        tooltip: (0, nls_1.localize)('notebook.cell.status.executing', "Executing"),
                        alignment: 1 /* CellStatusbarAlignment.Left */,
                        priority: Number.MAX_SAFE_INTEGER
                    }];
            }
            return [];
        }
        dispose() {
            super.dispose();
            this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items: [] }]);
        }
    };
    ExecutionStateCellStatusBarItem = ExecutionStateCellStatusBarItem_1 = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], ExecutionStateCellStatusBarItem);
    let TimerCellStatusBarContrib = class TimerCellStatusBarContrib extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.statusBar.execTimer'; }
        constructor(notebookEditor, instantiationService) {
            super();
            this._register(new NotebookStatusBarController(notebookEditor, (vm, cell) => instantiationService.createInstance(TimerCellStatusBarItem, vm, cell)));
        }
    };
    exports.TimerCellStatusBarContrib = TimerCellStatusBarContrib;
    exports.TimerCellStatusBarContrib = TimerCellStatusBarContrib = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], TimerCellStatusBarContrib);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(TimerCellStatusBarContrib.id, TimerCellStatusBarContrib);
    const UPDATE_TIMER_GRACE_PERIOD = 200;
    let TimerCellStatusBarItem = class TimerCellStatusBarItem extends lifecycle_1.Disposable {
        static { TimerCellStatusBarItem_1 = this; }
        static { this.UPDATE_INTERVAL = 100; }
        constructor(_notebookViewModel, _cell, _executionStateService, _notebookService) {
            super();
            this._notebookViewModel = _notebookViewModel;
            this._cell = _cell;
            this._executionStateService = _executionStateService;
            this._notebookService = _notebookService;
            this._currentItemIds = [];
            this._scheduler = this._register(new async_1.RunOnceScheduler(() => this._update(), TimerCellStatusBarItem_1.UPDATE_INTERVAL));
            this._update();
            this._register(this._cell.model.onDidChangeInternalMetadata(() => this._update()));
        }
        async _update() {
            let timerItem;
            const runState = this._executionStateService.getCellExecution(this._cell.uri);
            const state = runState?.state;
            const startTime = this._cell.internalMetadata.runStartTime;
            const adjustment = this._cell.internalMetadata.runStartTimeAdjustment ?? 0;
            const endTime = this._cell.internalMetadata.runEndTime;
            if (runState?.didPause) {
                timerItem = undefined;
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                if (typeof startTime === 'number') {
                    timerItem = this._getTimeItem(startTime, Date.now(), adjustment);
                    this._scheduler.schedule();
                }
            }
            else if (!state) {
                if (typeof startTime === 'number' && typeof endTime === 'number') {
                    const timerDuration = Date.now() - startTime + adjustment;
                    const executionDuration = endTime - startTime;
                    const renderDuration = this._cell.internalMetadata.renderDuration ?? {};
                    timerItem = this._getTimeItem(startTime, endTime, undefined, {
                        timerDuration,
                        executionDuration,
                        renderDuration
                    });
                }
            }
            const items = timerItem ? [timerItem] : [];
            if (!items.length && !!runState) {
                if (!this._deferredUpdate) {
                    this._deferredUpdate = (0, async_1.disposableTimeout)(() => {
                        this._deferredUpdate = undefined;
                        this._currentItemIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items }]);
                    }, UPDATE_TIMER_GRACE_PERIOD);
                }
            }
            else {
                this._deferredUpdate?.dispose();
                this._deferredUpdate = undefined;
                this._currentItemIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items }]);
            }
        }
        _getTimeItem(startTime, endTime, adjustment = 0, runtimeInformation) {
            const duration = endTime - startTime + adjustment;
            let tooltip;
            if (runtimeInformation) {
                const lastExecution = new Date(endTime).toLocaleTimeString(platform_1.language);
                const { renderDuration, executionDuration, timerDuration } = runtimeInformation;
                let renderTimes = '';
                for (const key in renderDuration) {
                    const rendererInfo = this._notebookService.getRendererInfo(key);
                    const args = encodeURIComponent(JSON.stringify({
                        extensionId: rendererInfo?.extensionId.value ?? '',
                        issueBody: `Auto-generated text from notebook cell performance. The duration for the renderer, ${rendererInfo?.displayName ?? key}, is slower than expected.\n` +
                            `Execution Time: ${formatCellDuration(executionDuration)}\n` +
                            `Renderer Duration: ${formatCellDuration(renderDuration[key])}\n`
                    }));
                    renderTimes += `- [${rendererInfo?.displayName ?? key}](command:workbench.action.openIssueReporter?${args}) ${formatCellDuration(renderDuration[key])}\n`;
                }
                renderTimes += `\n*${(0, nls_1.localize)('notebook.cell.statusBar.timerTooltip.reportIssueFootnote', "Use the links above to file an issue using the issue reporter.")}*\n`;
                tooltip = {
                    value: (0, nls_1.localize)('notebook.cell.statusBar.timerTooltip', "**Last Execution** {0}\n\n**Execution Time** {1}\n\n**Overhead Time** {2}\n\n**Render Times**\n\n{3}", lastExecution, formatCellDuration(executionDuration), formatCellDuration(timerDuration - executionDuration), renderTimes),
                    isTrusted: true
                };
            }
            return {
                text: formatCellDuration(duration, false),
                alignment: 1 /* CellStatusbarAlignment.Left */,
                priority: Number.MAX_SAFE_INTEGER - 5,
                tooltip
            };
        }
        dispose() {
            super.dispose();
            this._deferredUpdate?.dispose();
            this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items: [] }]);
        }
    };
    TimerCellStatusBarItem = TimerCellStatusBarItem_1 = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(3, notebookService_1.INotebookService)
    ], TimerCellStatusBarItem);
    let DiagnosticCellStatusBarContrib = class DiagnosticCellStatusBarContrib extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.statusBar.diagtnostic'; }
        constructor(notebookEditor, instantiationService) {
            super();
            this._register(new NotebookStatusBarController(notebookEditor, (vm, cell) => cell instanceof codeCellViewModel_1.CodeCellViewModel ?
                instantiationService.createInstance(DiagnosticCellStatusBarItem, vm, cell) :
                lifecycle_1.Disposable.None));
        }
    };
    exports.DiagnosticCellStatusBarContrib = DiagnosticCellStatusBarContrib;
    exports.DiagnosticCellStatusBarContrib = DiagnosticCellStatusBarContrib = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], DiagnosticCellStatusBarContrib);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(DiagnosticCellStatusBarContrib.id, DiagnosticCellStatusBarContrib);
    let DiagnosticCellStatusBarItem = class DiagnosticCellStatusBarItem extends lifecycle_1.Disposable {
        constructor(_notebookViewModel, cell, keybindingService) {
            super();
            this._notebookViewModel = _notebookViewModel;
            this.cell = cell;
            this.keybindingService = keybindingService;
            this._currentItemIds = [];
            this._update();
            this._register(this.cell.cellDiagnostics.onDidDiagnosticsChange(() => this._update()));
        }
        async _update() {
            let item;
            if (!!this.cell.cellDiagnostics.ErrorDetails) {
                const keybinding = this.keybindingService.lookupKeybinding(cellCommands_1.OPEN_CELL_FAILURE_ACTIONS_COMMAND_ID)?.getLabel();
                const tooltip = (0, nls_1.localize)('notebook.cell.status.diagnostic', "Quick Actions {0}", `(${keybinding})`);
                item = {
                    text: `$(sparkle)`,
                    tooltip,
                    alignment: 1 /* CellStatusbarAlignment.Left */,
                    command: cellCommands_1.OPEN_CELL_FAILURE_ACTIONS_COMMAND_ID,
                    priority: Number.MAX_SAFE_INTEGER - 1
                };
            }
            const items = item ? [item] : [];
            this._currentItemIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this.cell.handle, items }]);
        }
        dispose() {
            super.dispose();
            this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this.cell.handle, items: [] }]);
        }
    };
    DiagnosticCellStatusBarItem = __decorate([
        __param(2, keybinding_1.IKeybindingService)
    ], DiagnosticCellStatusBarItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0aW9uU3RhdHVzQmFySXRlbUNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvY2VsbFN0YXR1c0Jhci9leGVjdXRpb25TdGF0dXNCYXJJdGVtQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0JoRyxnREFjQztJQWRELFNBQWdCLGtCQUFrQixDQUFDLFFBQWdCLEVBQUUsbUJBQTRCLElBQUk7UUFDcEYsSUFBSSxnQkFBZ0IsSUFBSSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUM7WUFDekMsT0FBTyxHQUFHLFFBQVEsSUFBSSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDakQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2pELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFFbkQsSUFBSSxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDakIsT0FBTyxHQUFHLE9BQU8sS0FBSyxPQUFPLElBQUksTUFBTSxHQUFHLENBQUM7UUFDNUMsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLEdBQUcsT0FBTyxJQUFJLE1BQU0sR0FBRyxDQUFDO1FBQ2hDLENBQUM7SUFDRixDQUFDO0lBRUQsTUFBYSwyQkFBNEIsU0FBUSxzQkFBVTtRQUkxRCxZQUNrQixlQUFnQyxFQUNo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