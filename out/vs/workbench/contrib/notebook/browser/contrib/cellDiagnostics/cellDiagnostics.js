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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/markers/common/markers", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/base/common/iterator", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/event"], function (require, exports, lifecycle_1, markers_1, notebookExecutionStateService_1, inlineChat_1, iterator_1, configuration_1, notebookCommon_1, event_1) {
    "use strict";
    var CellDiagnostics_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellDiagnostics = void 0;
    let CellDiagnostics = class CellDiagnostics extends lifecycle_1.Disposable {
        static { CellDiagnostics_1 = this; }
        static { this.ID = 'workbench.notebook.cellDiagnostics'; }
        get ErrorDetails() {
            return this.errorDetails;
        }
        constructor(cell, notebookExecutionStateService, markerService, inlineChatService, configurationService) {
            super();
            this.cell = cell;
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.markerService = markerService;
            this.inlineChatService = inlineChatService;
            this.configurationService = configurationService;
            this._onDidDiagnosticsChange = new event_1.Emitter();
            this.onDidDiagnosticsChange = this._onDidDiagnosticsChange.event;
            this.enabled = false;
            this.listening = false;
            this.errorDetails = undefined;
            if (cell.viewType !== 'interactive') {
                this.updateEnabled();
                this._register(inlineChatService.onDidChangeProviders(() => this.updateEnabled()));
                this._register(configurationService.onDidChangeConfiguration((e) => {
                    if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.cellFailureDiagnostics)) {
                        this.updateEnabled();
                    }
                }));
            }
        }
        updateEnabled() {
            const settingEnabled = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellFailureDiagnostics);
            if (this.enabled && (!settingEnabled || iterator_1.Iterable.isEmpty(this.inlineChatService.getAllProvider()))) {
                this.enabled = false;
                this.clear();
            }
            else if (!this.enabled && settingEnabled && !iterator_1.Iterable.isEmpty(this.inlineChatService.getAllProvider())) {
                this.enabled = true;
                if (!this.listening) {
                    this.listening = true;
                    this._register(this.notebookExecutionStateService.onDidChangeExecution((e) => this.handleChangeExecutionState(e)));
                }
            }
        }
        handleChangeExecutionState(e) {
            if (this.enabled && e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && e.affectsCell(this.cell.uri)) {
                if (!!e.changed) {
                    // cell is running
                    this.clear();
                }
                else {
                    this.setDiagnostics();
                }
            }
        }
        clear() {
            if (this.ErrorDetails) {
                this.markerService.changeOne(CellDiagnostics_1.ID, this.cell.uri, []);
                this.errorDetails = undefined;
                this._onDidDiagnosticsChange.fire();
            }
        }
        setDiagnostics() {
            const metadata = this.cell.model.internalMetadata;
            if (!metadata.lastRunSuccess && metadata?.error?.location) {
                const marker = this.createMarkerData(metadata.error.message, metadata.error.location);
                this.markerService.changeOne(CellDiagnostics_1.ID, this.cell.uri, [marker]);
                this.errorDetails = metadata.error;
                this._onDidDiagnosticsChange.fire();
            }
        }
        createMarkerData(message, location) {
            return {
                severity: 8,
                message: message,
                startLineNumber: location.startLineNumber + 1,
                startColumn: location.startColumn + 1,
                endLineNumber: location.endLineNumber + 1,
                endColumn: location.endColumn + 1,
                source: 'Cell Execution Error'
            };
        }
        dispose() {
            super.dispose();
            this.clear();
        }
    };
    exports.CellDiagnostics = CellDiagnostics;
    exports.CellDiagnostics = CellDiagnostics = CellDiagnostics_1 = __decorate([
        __param(1, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(2, markers_1.IMarkerService),
        __param(3, inlineChat_1.IInlineChatService),
        __param(4, configuration_1.IConfigurationService)
    ], CellDiagnostics);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbERpYWdub3N0aWNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2NlbGxEaWFnbm9zdGljcy9jZWxsRGlhZ25vc3RpY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHNCQUFVOztpQkFLdkMsT0FBRSxHQUFXLG9DQUFvQyxBQUEvQyxDQUFnRDtRQUt6RCxJQUFXLFlBQVk7WUFDdEIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFFRCxZQUNrQixJQUF1QixFQUNSLDZCQUE4RSxFQUM5RixhQUE4QyxFQUMxQyxpQkFBc0QsRUFDbkQsb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBTlMsU0FBSSxHQUFKLElBQUksQ0FBbUI7WUFDUyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1lBQzdFLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN6QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ2xDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFqQm5FLDRCQUF1QixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDdEQsMkJBQXNCLEdBQWdCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUM7WUFJMUUsWUFBTyxHQUFHLEtBQUssQ0FBQztZQUNoQixjQUFTLEdBQUcsS0FBSyxDQUFDO1lBQ2xCLGlCQUFZLEdBQW9DLFNBQVMsQ0FBQztZQWNqRSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssYUFBYSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFFckIsSUFBSSxD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