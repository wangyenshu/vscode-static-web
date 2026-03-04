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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/platform/markers/common/markers", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineEntryFactory", "vs/base/common/async"], function (require, exports, event_1, lifecycle_1, resources_1, configuration_1, markers_1, themeService_1, notebookCommon_1, notebookExecutionStateService_1, outlineModel_1, notebookOutlineEntryFactory_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellOutlineProvider = void 0;
    let NotebookCellOutlineProvider = class NotebookCellOutlineProvider {
        get entries() {
            if (this.delayedOutlineRecompute.isTriggered()) {
                this.delayedOutlineRecompute.cancel();
                this._recomputeState();
            }
            return this._entries;
        }
        get activeElement() {
            if (this.delayedOutlineRecompute.isTriggered()) {
                this.delayedOutlineRecompute.cancel();
                this._recomputeState();
            }
            return this._activeEntry;
        }
        ;
        constructor(_editor, _target, themeService, notebookExecutionStateService, _outlineModelService, _markerService, _configurationService) {
            this._editor = _editor;
            this._target = _target;
            this._outlineModelService = _outlineModelService;
            this._markerService = _markerService;
            this._configurationService = _configurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._entries = [];
            this._entriesDisposables = new lifecycle_1.DisposableStore();
            this.outlineKind = 'notebookCells';
            this._outlineEntryFactory = new notebookOutlineEntryFactory_1.NotebookOutlineEntryFactory(notebookExecutionStateService);
            const delayerRecomputeActive = this._disposables.add(new async_1.Delayer(200));
            this._disposables.add(_editor.onDidChangeSelection(() => {
                delayerRecomputeActive.trigger(() => this._recomputeActive());
            }, this));
            // .3s of a delay is sufficient, 100-200s is too quick and will unnecessarily block the ui thread.
            // Given we're only updating the outline when the user types, we can afford to wait a bit.
            this.delayedOutlineRecompute = this._disposables.add(new async_1.Delayer(300));
            const delayedRecompute = () => {
                delayerRecomputeActive.cancel(); // Active is always recomputed after a recomputing the outline state.
                this.delayedOutlineRecompute.trigger(() => this._recomputeState());
            };
            this._disposables.add(_configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly) ||
                    e.affectsConfiguration(notebookCommon_1.NotebookSetting.outlineShowCodeCells) ||
                    e.affectsConfiguration(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols) ||
                    e.affectsConfiguration(notebookCommon_1.NotebookSetting.breadcrumbsShowCodeCells)) {
                    delayedRecompute();
                }
            }));
            this._disposables.add(themeService.onDidFileIconThemeChange(() => {
                this._onDidChange.fire({});
            }));
            this._disposables.add(notebookExecutionStateService.onDidChangeExecution(e => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && !!this._editor.textModel && e.affectsNotebook(this._editor.textModel?.uri)) {
                    delayedRecompute();
                }
            }));
            const disposable = this._disposables.add(new lifecycle_1.DisposableStore());
            const monitorModelChanges = () => {
                disposable.clear();
                if (!this._editor.textModel) {
                    return;
                }
                disposable.add(this._editor.textModel.onDidChangeContent(contentChanges => {
                    if (contentChanges.rawEvents.some(c => c.kind === notebookCommon_1.NotebookCellsChangeType.ChangeCellContent ||
                        c.kind === notebookCommon_1.NotebookCellsChangeType.ChangeCellInternalMetadata ||
                        c.kind === notebookCommon_1.NotebookCellsChangeType.Move ||
                        c.kind === notebookCommon_1.NotebookCellsChangeType.ModelChange)) {
                        delayedRecompute();
                    }
                }));
                // Perhaps this is the first time we're building the outline
                if (!this._entries.length) {
                    this._recomputeState();
                }
            };
            this._disposables.add(this._editor.onDidChangeModel(monitorModelChanges));
            monitorModelChanges();
            this._recomputeState();
        }
        dispose() {
            this._entries.length = 0;
            this._activeEntry = undefined;
            this._entriesDisposables.dispose();
            this._disposables.dispose();
        }
        async setFullSymbols(cancelToken) {
            const notebookEditorWidget = this._editor;
            const notebookCells = notebookEditorWidget?.getViewModel()?.viewCells.filter((cell) => cell.cellKind === notebookCommon_1.CellKind.Code);
            if (notebookCells) {
                const promises = [];
                // limit the number of cells so that we don't resolve an excessive amount of text models
                for (const cell of notebookCells.slice(0, 100)) {
                    // gather all symbols asynchronously
                    promises.push(this._outlineEntryFactory.cacheSymbols(cell, this._outlineModelService, cancelToken));
                }
                await Promise.allSettled(promises);
            }
            this._recomputeState();
        }
        _recomputeState() {
            this._entriesDisposables.clear();
            this._activeEntry = undefined;
            this._uri = undefined;
            if (!this._editor.hasModel()) {
                return;
            }
            this._uri = this._editor.textModel.uri;
            const notebookEditorWidget = this._editor;
            if (notebookEditorWidget.getLength() === 0) {
                return;
            }
            let includeCodeCells = true;
            if (this._target === 2 /* OutlineTarget.Breadcrumbs */) {
                includeCodeCells = this._configurationService.getValue('notebook.breadcrumbs.showCodeCells');
            }
            let notebookCells;
            if (this._target === 2 /* OutlineTarget.Breadcrumbs */) {
                notebookCells = notebookEditorWidget.getViewModel().viewCells.filter((cell) => cell.cellKind === notebookCommon_1.CellKind.Markup || includeCodeCells);
            }
            else {
                notebookCells = notebookEditorWidget.getViewModel().viewCells;
            }
            const entries = [];
            for (const cell of notebookCells) {
                entries.push(...this._outlineEntryFactory.getOutlineEntries(cell, this._target, entries.length));
            }
            // build a tree from the list of entries
            if (entries.length > 0) {
                const result = [entries[0]];
                const parentStack = [entries[0]];
                for (let i = 1; i < entries.length; i++) {
                    const entry = entries[i];
                    while (true) {
                        const len = parentStack.length;
                        if (len === 0) {
                            // root node
                            result.push(entry);
                            parentStack.push(entry);
                            break;
                        }
                        else {
                            const parentCandidate = parentStack[len - 1];
                            if (parentCandidate.level < entry.level) {
                                parentCandidate.addChild(entry);
                                parentStack.push(entry);
                                break;
                            }
                            else {
                                parentStack.pop();
                            }
                        }
                    }
                }
                this._entries = result;
            }
            // feature: show markers with each cell
            const markerServiceListener = new lifecycle_1.MutableDisposable();
            this._entriesDisposables.add(markerServiceListener);
            const updateMarkerUpdater = () => {
                if (notebookEditorWidget.isDisposed) {
                    return;
                }
                const doUpdateMarker = (clear) => {
                    for (const entry of this._entries) {
                        if (clear) {
                            entry.clearMarkers();
                        }
                        else {
                            entry.updateMarkers(this._markerService);
                        }
                    }
                };
                const problem = this._configurationService.getValue('problems.visibility');
                if (problem === undefined) {
                    return;
                }
                const config = this._configurationService.getValue("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */);
                if (problem && config) {
                    markerServiceListener.value = this._markerService.onMarkerChanged(e => {
                        if (notebookEditorWidget.isDisposed) {
                            console.error('notebook editor is disposed');
                            return;
                        }
                        if (e.some(uri => notebookEditorWidget.getCellsInRange().some(cell => (0, resources_1.isEqual)(cell.uri, uri)))) {
                            doUpdateMarker(false);
                            this._onDidChange.fire({});
                        }
                    });
                    doUpdateMarker(false);
                }
                else {
                    markerServiceListener.clear();
                    doUpdateMarker(true);
                }
            };
            updateMarkerUpdater();
            this._entriesDisposables.add(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('problems.visibility') || e.affectsConfiguration("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */)) {
                    updateMarkerUpdater();
                    this._onDidChange.fire({});
                }
            }));
            const { changeEventTriggered } = this._recomputeActive();
            if (!changeEventTriggered) {
                this._onDidChange.fire({});
            }
        }
        _recomputeActive() {
            let newActive;
            const notebookEditorWidget = this._editor;
            if (notebookEditorWidget) { //TODO don't check for widget, only here if we do have
                if (notebookEditorWidget.hasModel() && notebookEditorWidget.getLength() > 0) {
                    const cell = notebookEditorWidget.cellAt(notebookEditorWidget.getFocus().start);
                    if (cell) {
                        for (const entry of this._entries) {
                            newActive = entry.find(cell, []);
                            if (newActive) {
                                break;
                            }
                        }
                    }
                }
            }
            // @Yoyokrazy - Make sure the new active entry isn't part of the filtered exclusions
            const showCodeCells = this._configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCells);
            const showCodeCellSymbols = this._configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols);
            const showMarkdownHeadersOnly = this._configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly);
            // check the three outline filtering conditions
            // if any are true, newActive should NOT be set to this._activeEntry and the event should NOT fire
            if ((newActive !== this._activeEntry) && !((showMarkdownHeadersOnly && newActive?.cell.cellKind === notebookCommon_1.CellKind.Markup && newActive?.level === 7 /* NotebookOutlineConstants.NonHeaderOutlineLevel */) || // show headers only + cell is mkdn + is level 7 (no header)
                (!showCodeCells && newActive?.cell.cellKind === notebookCommon_1.CellKind.Code) || // show code cells   + cell is code
                (!showCodeCellSymbols && newActive?.cell.cellKind === notebookCommon_1.CellKind.Code && newActive?.level > 7 /* NotebookOutlineConstants.NonHeaderOutlineLevel */) // show code symbols + cell is code + has level > 7 (nb symbol levels)
            )) {
                this._activeEntry = newActive;
                this._onDidChange.fire({ affectOnlyActiveElement: true });
                return { changeEventTriggered: true };
            }
            return { changeEventTriggered: false };
        }
        get isEmpty() {
            return this._entries.length === 0;
        }
        get uri() {
            return this._uri;
        }
    };
    exports.NotebookCellOutlineProvider = NotebookCellOutlineProvider;
    exports.NotebookCellOutlineProvider = NotebookCellOutlineProvider = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(4, outlineModel_1.IOutlineModelService),
        __param(5, markers_1.IMarkerService),
        __param(6, configuration_1.IConfigurationService)
    ], NotebookCellOutlineProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPdXRsaW5lUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXdNb2RlbC9ub3RlYm9va091dGxpbmVQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTJCO1FBUXZDLElBQUksT0FBTztZQUNWLElBQUksSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQ2hELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3hCLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQU9ELElBQUksYUFBYTtZQUNoQixJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLENBQUMsdUJBQXVCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN4QixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFHdUQsQ0FBQztRQUN6RCxZQUNrQixPQUF3QixFQUN4QixPQUFzQixFQUN4QixZQUEyQixFQUNWLDZCQUE2RCxFQUN2RSxvQkFBMkQsRUFDakUsY0FBK0MsRUFDeEMscUJBQTZEO1lBTm5FLFlBQU8sR0FBUCxPQUFPLENBQWlCO1lBQ3hCLFlBQU8sR0FBUCxPQUFPLENBQWU7WUFHQSx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ2hELG1CQUFjLEdBQWQsY0FB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