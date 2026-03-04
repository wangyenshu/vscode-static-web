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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/network", "vs/editor/common/services/languageFeatures", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/browser/contrib/navigation/arrow", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/controller/editActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/statusbar/browser/statusbar"], function (require, exports, nls, lifecycle_1, network_1, languageFeatures_1, configuration_1, instantiation_1, log_1, platform_1, contributions_1, arrow_1, coreActions_1, editActions_1, notebookBrowser_1, notebookCommon_1, notebookKernelService_1, editorService_1, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookIndentationStatus = exports.ActiveCellStatus = exports.KernelStatus = void 0;
    let ImplictKernelSelector = class ImplictKernelSelector {
        constructor(notebook, suggested, notebookKernelService, languageFeaturesService, logService) {
            const disposables = new lifecycle_1.DisposableStore();
            this.dispose = disposables.dispose.bind(disposables);
            const selectKernel = () => {
                disposables.clear();
                notebookKernelService.selectKernelForNotebook(suggested, notebook);
            };
            // IMPLICITLY select a suggested kernel when the notebook has been changed
            // e.g change cell source, move cells, etc
            disposables.add(notebook.onDidChangeContent(e => {
                for (const event of e.rawEvents) {
                    switch (event.kind) {
                        case notebookCommon_1.NotebookCellsChangeType.ChangeCellContent:
                        case notebookCommon_1.NotebookCellsChangeType.ModelChange:
                        case notebookCommon_1.NotebookCellsChangeType.Move:
                        case notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage:
                            logService.trace('IMPLICIT kernel selection because of change event', event.kind);
                            selectKernel();
                            break;
                    }
                }
            }));
            // IMPLICITLY select a suggested kernel when users start to hover. This should
            // be a strong enough hint that the user wants to interact with the notebook. Maybe
            // add more triggers like goto-providers or completion-providers
            disposables.add(languageFeaturesService.hoverProvider.register({ scheme: network_1.Schemas.vscodeNotebookCell, pattern: notebook.uri.path }, {
                provideHover() {
                    logService.trace('IMPLICIT kernel selection because of hover');
                    selectKernel();
                    return undefined;
                }
            }));
        }
    };
    ImplictKernelSelector = __decorate([
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, log_1.ILogService)
    ], ImplictKernelSelector);
    let KernelStatus = class KernelStatus extends lifecycle_1.Disposable {
        constructor(_editorService, _statusbarService, _notebookKernelService, _instantiationService) {
            super();
            this._editorService = _editorService;
            this._statusbarService = _statusbarService;
            this._notebookKernelService = _notebookKernelService;
            this._instantiationService = _instantiationService;
            this._editorDisposables = this._register(new lifecycle_1.DisposableStore());
            this._kernelInfoElement = this._register(new lifecycle_1.DisposableStore());
            this._register(this._editorService.onDidActiveEditorChange(() => this._updateStatusbar()));
        }
        _updateStatusbar() {
            this._editorDisposables.clear();
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (!activeEditor) {
                // not a notebook -> clean-up, done
                this._kernelInfoElement.clear();
                return;
            }
            const updateStatus = () => {
                if (activeEditor.notebookOptions.getDisplayOptions().globalToolbar) {
                    // kernel info rendered in the notebook toolbar already
                    this._kernelInfoElement.clear();
                    return;
                }
                const notebook = activeEditor.textModel;
                if (notebook) {
                    this._showKernelStatus(notebook);
                }
                else {
                    this._kernelInfoElement.clear();
                }
            };
            this._editorDisposables.add(this._notebookKernelService.onDidAddKernel(updateStatus));
            this._editorDisposables.add(this._notebookKernelService.onDidChangeSelectedNotebooks(updateStatus));
            this._editorDisposables.add(this._notebookKernelService.onDidChangeNotebookAffinity(updateStatus));
            this._editorDisposables.add(activeEditor.onDidChangeModel(updateStatus));
            this._editorDisposables.add(activeEditor.notebookOptions.onDidChangeOptions(updateStatus));
            updateStatus();
        }
        _showKernelStatus(notebook) {
            this._kernelInfoElement.clear();
            const { selected, suggestions, all } = this._notebookKernelService.getMatchingKernel(notebook);
            const suggested = (suggestions.length === 1 ? suggestions[0] : undefined)
                ?? (all.length === 1) ? all[0] : undefined;
            let isSuggested = false;
            if (all.length === 0) {
                // no kernel -> no status
                return;
            }
            else if (selected || suggested) {
                // selected or single kernel
                let kernel = selected;
                if (!kernel) {
                    // proceed with suggested kernel - show UI and install handler that selects the kernel
                    // when non trivial interactions with the notebook happen.
                    kernel = suggested;
                    isSuggested = true;
                    this._kernelInfoElement.add(this._instantiationService.createInstance(ImplictKernelSelector, notebook, kernel));
                }
                const tooltip = kernel.description ?? kernel.detail ?? kernel.label;
                this._kernelInfoElement.add(this._statusbarService.addEntry({
                    name: nls.localize('notebook.info', "Notebook Kernel Info"),
                    text: `$(notebook-kernel-select) ${kernel.label}`,
                    ariaLabel: kernel.label,
                    tooltip: isSuggested ? nls.localize('tooltop', "{0} (suggestion)", tooltip) : tooltip,
                    command: coreActions_1.SELECT_KERNEL_ID,
                }, coreActions_1.SELECT_KERNEL_ID, 1 /* StatusbarAlignment.RIGHT */, 10));
                this._kernelInfoElement.add(kernel.onDidChange(() => this._showKernelStatus(notebook)));
            }
            else {
                // multiple kernels -> show selection hint
                this._kernelInfoElement.add(this._statusbarService.addEntry({
                    name: nls.localize('notebook.select', "Notebook Kernel Selection"),
                    text: nls.localize('kernel.select.label', "Select Kernel"),
                    ariaLabel: nls.localize('kernel.select.label', "Select Kernel"),
                    command: coreActions_1.SELECT_KERNEL_ID,
                    kind: 'prominent'
                }, coreActions_1.SELECT_KERNEL_ID, 1 /* StatusbarAlignment.RIGHT */, 10));
            }
        }
    };
    exports.KernelStatus = KernelStatus;
    exports.KernelStatus = KernelStatus = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, instantiation_1.IInstantiationService)
    ], KernelStatus);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(KernelStatus, 3 /* LifecyclePhase.Restored */);
    let ActiveCellStatus = class ActiveCellStatus extends lifecycle_1.Disposable {
        constructor(_editorService, _statusbarService) {
            super();
            this._editorService = _editorService;
            this._statusbarService = _statusbarService;
            this._itemDisposables = this._register(new lifecycle_1.DisposableStore());
            this._accessor = this._register(new lifecycle_1.MutableDisposable());
            this._register(this._editorService.onDidActiveEditorChange(() => this._update()));
        }
        _update() {
            this._itemDisposables.clear();
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (activeEditor) {
                this._itemDisposables.add(activeEditor.onDidChangeSelection(() => this._show(activeEditor)));
                this._itemDisposables.add(activeEditor.onDidChangeActiveCell(() => this._show(activeEditor)));
                this._show(activeEditor);
            }
            else {
                this._accessor.clear();
            }
        }
        _show(editor) {
            if (!editor.hasModel()) {
                this._accessor.clear();
                return;
            }
            const newText = this._getSelectionsText(editor);
            if (!newText) {
                this._accessor.clear();
                return;
            }
            const entry = {
                name: nls.localize('notebook.activeCellStatusName', "Notebook Editor Selections"),
                text: newText,
                ariaLabel: newText,
                command: arrow_1.CENTER_ACTIVE_CELL
            };
            if (!this._accessor.value) {
                this._accessor.value = this._statusbarService.addEntry(entry, 'notebook.activeCellStatus', 1 /* StatusbarAlignment.RIGHT */, 100);
            }
            else {
                this._accessor.value.update(entry);
            }
        }
        _getSelectionsText(editor) {
            if (!editor.hasModel()) {
                return undefined;
            }
            const activeCell = editor.getActiveCell();
            if (!activeCell) {
                return undefined;
            }
            const idxFocused = editor.getCellIndex(activeCell) + 1;
            const numSelected = editor.getSelections().reduce((prev, range) => prev + (range.end - range.start), 0);
            const totalCells = editor.getLength();
            return numSelected > 1 ?
                nls.localize('notebook.multiActiveCellIndicator', "Cell {0} ({1} selected)", idxFocused, numSelected) :
                nls.localize('notebook.singleActiveCellIndicator', "Cell {0} of {1}", idxFocused, totalCells);
        }
    };
    exports.ActiveCellStatus = ActiveCellStatus;
    exports.ActiveCellStatus = ActiveCellStatus = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, statusbar_1.IStatusbarService)
    ], ActiveCellStatus);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ActiveCellStatus, 3 /* LifecyclePhase.Restored */);
    let NotebookIndentationStatus = class NotebookIndentationStatus extends lifecycle_1.Disposable {
        static { this.ID = 'selectNotebookIndentation'; }
        constructor(_editorService, _statusbarService, _configurationService) {
            super();
            this._editorService = _editorService;
            this._statusbarService = _statusbarService;
            this._configurationService = _configurationService;
            this._itemDisposables = this._register(new lifecycle_1.DisposableStore());
            this._accessor = this._register(new lifecycle_1.MutableDisposable());
            this._register(this._editorService.onDidActiveEditorChange(() => this._update()));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor') || e.affectsConfiguration('notebook')) {
                    this._update();
                }
            }));
        }
        _update() {
            this._itemDisposables.clear();
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (activeEditor) {
                this._show(activeEditor);
                this._itemDisposables.add(activeEditor.onDidChangeSelection(() => {
                    this._accessor.clear();
                    this._show(activeEditor);
                }));
            }
            else {
                this._accessor.clear();
            }
        }
        _show(editor) {
            if (!editor.hasModel()) {
                this._accessor.clear();
                return;
            }
            const cellOptions = editor.getActiveCell()?.textModel?.getOptions();
            if (!cellOptions) {
                this._accessor.clear();
                return;
            }
            const cellEditorOverridesRaw = editor.notebookOptions.getDisplayOptions().editorOptionsCustomizations;
            const indentSize = cellEditorOverridesRaw?.['editor.indentSize'] ?? cellOptions?.indentSize;
            const insertSpaces = cellEditorOverridesRaw?.['editor.insertSpaces'] ?? cellOptions?.insertSpaces;
            const tabSize = cellEditorOverridesRaw?.['editor.tabSize'] ?? cellOptions?.tabSize;
            const width = typeof indentSize === 'number' ? indentSize : tabSize;
            const message = insertSpaces ? `Spaces: ${width}` : `Tab Size: ${width}`;
            const newText = message;
            if (!newText) {
                this._accessor.clear();
                return;
            }
            const entry = {
                name: nls.localize('notebook.indentation', "Notebook Indentation"),
                text: newText,
                ariaLabel: newText,
                tooltip: nls.localize('selectNotebookIndentation', "Select Indentation"),
                command: editActions_1.SELECT_NOTEBOOK_INDENTATION_ID
            };
            if (!this._accessor.value) {
                this._accessor.value = this._statusbarService.addEntry(entry, 'notebook.status.indentation', 1 /* StatusbarAlignment.RIGHT */, 100.4);
            }
            else {
                this._accessor.value.update(entry);
            }
        }
    };
    exports.NotebookIndentationStatus = NotebookIndentationStatus;
    exports.NotebookIndentationStatus = NotebookIndentationStatus = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, configuration_1.IConfigurationService)
    ], NotebookIndentationStatus);
    (0, contributions_1.registerWorkbenchContribution2)(NotebookIndentationStatus.ID, NotebookIndentationStatus, 3 /* WorkbenchPhase.AfterRestored */); // TODO@Yoyokrazy -- unsure on the phase
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU3RhdHVzQmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2VkaXRvclN0YXR1c0Jhci9lZGl0b3JTdGF0dXNCYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0JoRyxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtRQUkxQixZQUNDLFFBQTJCLEVBQzNCLFNBQTBCLEVBQ0YscUJBQTZDLEVBQzNDLHVCQUFpRCxFQUM5RCxVQUF1QjtZQUVwQyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRXJELE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRTtnQkFDekIsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNwQixxQkFBcUIsQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDcEUsQ0FBQyxDQUFDO1lBRUYsMEVBQTBFO1lBQzFFLDBDQUEwQztZQUMxQyxXQUFXLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDL0MsS0FBSyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ2pDLFFBQVEsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNwQixLQUFLLHdDQUF1QixDQUFDLGlCQUFpQixDQUFDO3dCQUMvQyxLQUFLLHdDQUF1QixDQUFDLFdBQVcsQ0FBQzt3QkFDekMsS0FBSyx3Q0FBdUIsQ0FBQyxJQUFJLENBQUM7d0JBQ2xD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