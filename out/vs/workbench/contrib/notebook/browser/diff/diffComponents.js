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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/network", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/diff/diffElementViewModel", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/browser/diff/diffElementOutputs", "vs/editor/browser/editorExtensions", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/base/browser/ui/iconLabel/iconLabels", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/platform/actions/browser/toolbar", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/notebook/browser/diff/diffCellEditorOptions", "vs/platform/accessibility/common/accessibility", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/platform/commands/common/commands"], function (require, exports, DOM, lifecycle_1, network_1, instantiation_1, diffElementViewModel_1, notebookDiffEditorBrowser_1, codeEditorWidget_1, model_1, language_1, notebookCommon_1, contextView_1, actions_1, keybinding_1, notification_1, menuEntryActionViewItem_1, contextkey_1, cellActionView_1, notebookIcons_1, diffElementOutputs_1, editorExtensions_1, contextmenu_1, snippetController2_1, suggestController_1, menuPreventer_1, selectionClipboard_1, tabCompletion_1, iconLabels_1, resolverService_1, configuration_1, themeService_1, toolbar_1, telemetry_1, diffCellEditorOptions_1, accessibility_1, diffEditorWidget_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModifiedElement = exports.InsertElement = exports.DeletedElement = void 0;
    exports.getOptimizedNestedCodeEditorWidgetOptions = getOptimizedNestedCodeEditorWidgetOptions;
    function getOptimizedNestedCodeEditorWidgetOptions() {
        return {
            isSimpleWidget: false,
            contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                menuPreventer_1.MenuPreventer.ID,
                selectionClipboard_1.SelectionClipboardContributionID,
                contextmenu_1.ContextMenuController.ID,
                suggestController_1.SuggestController.ID,
                snippetController2_1.SnippetController2.ID,
                tabCompletion_1.TabCompletionController.ID,
            ])
        };
    }
    let PropertyHeader = class PropertyHeader extends lifecycle_1.Disposable {
        constructor(cell, propertyHeaderContainer, notebookEditor, accessor, contextMenuService, keybindingService, commandService, notificationService, menuService, contextKeyService, themeService, telemetryService, accessibilityService) {
            super();
            this.cell = cell;
            this.propertyHeaderContainer = propertyHeaderContainer;
            this.notebookEditor = notebookEditor;
            this.accessor = accessor;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.themeService = themeService;
            this.telemetryService = telemetryService;
            this.accessibilityService = accessibilityService;
        }
        buildHeader() {
            const metadataChanged = this.accessor.checkIfModified(this.cell);
            this._foldingIndicator = DOM.append(this.propertyHeaderContainer, DOM.$('.property-folding-indicator'));
            this._foldingIndicator.classList.add(this.accessor.prefix);
            this._updateFoldingIcon();
            const metadataStatus = DOM.append(this.propertyHeaderContainer, DOM.$('div.property-status'));
            this._statusSpan = DOM.append(metadataStatus, DOM.$('span'));
            this._description = DOM.append(metadataStatus, DOM.$('span.property-description'));
            if (metadataChanged) {
                this._statusSpan.textContent = this.accessor.changedLabel;
                this._statusSpan.style.fontWeight = 'bold';
                if (metadataChanged.reason) {
                    this._description.textContent = metadataChanged.reason;
                }
                this.propertyHeaderContainer.classList.add('modified');
            }
            else {
                this._statusSpan.textContent = this.accessor.unChangedLabel;
                this._description.textContent = '';
                this.propertyHeaderContainer.classList.remove('modified');
            }
            const cellToolbarContainer = DOM.append(this.propertyHeaderContainer, DOM.$('div.property-toolbar'));
            this._toolbar = new toolbar_1.WorkbenchToolBar(cellToolbarContainer, {
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_1.MenuItemAction) {
                        const item = new cellActionView_1.CodiconActionViewItem(action, { hoverDelegate: options.hoverDelegate }, this.keybindingService, this.notificationService, this.contextKeyService, this.themeService, this.contextMenuService, this.accessibilityService);
                        return item;
                    }
                    return undefined;
                }
            }, this.menuService, this.contextKeyService, this.contextMenuService, this.keybindingService, this.commandService, this.telemetryService);
            this._register(this._toolbar);
            this._toolbar.context = {
                cell: this.cell
            };
            const scopedContextKeyService = this.contextKeyService.createScoped(cellToolbarContainer);
            this._register(scopedContextKeyService);
            const propertyChanged = notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY.bindTo(scopedContextKeyService);
            propertyChanged.set(!!metadataChanged);
            this._propertyExpanded = notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY_EXPANDED.bindTo(scopedContextKeyService);
            this._menu = this.menuService.createMenu(this.accessor.menuId, scopedContextKeyService);
            this._register(this._menu);
            const actions = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this._menu, { shouldForwardArgs: true }, actions);
            this._toolbar.setActions(actions);
            this._register(this._menu.onDidChange(() => {
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this._menu, { shouldForwardArgs: true }, actions);
                this._toolbar.setActions(actions);
            }));
            this._register(this.notebookEditor.onMouseUp(e => {
                if (!e.event.target) {
                    return;
                }
                const target = e.event.target;
                if (target.classList.contains('codicon-notebook-collapsed') || target.classList.contains('codicon-notebook-expanded')) {
                    const parent = target.parentElement;
                    if (!parent) {
                        return;
                    }
                    if (!parent.classList.contains(this.accessor.prefix)) {
                        return;
                    }
                    if (!parent.classList.contains('property-folding-indicator')) {
                        return;
                    }
                    // folding icon
                    const cellViewModel = e.target;
                    if (cellViewModel === this.cell) {
                        const oldFoldingState = this.accessor.getFoldingState(this.cell);
                        this.accessor.updateFoldingState(this.cell, oldFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded ? diffElementViewModel_1.PropertyFoldingState.Collapsed : diffElementViewModel_1.PropertyFoldingState.Expanded);
                        this._updateFoldingIcon();
                        this.accessor.updateInfoRendering(this.cell.renderOutput);
                    }
                }
                return;
            }));
            this._updateFoldingIcon();
            this.accessor.updateInfoRendering(this.cell.renderOutput);
        }
        refresh() {
            const metadataChanged = this.accessor.checkIfModified(this.cell);
            if (metadataChanged) {
                this._statusSpan.textContent = this.accessor.changedLabel;
                this._statusSpan.style.fontWeight = 'bold';
                if (metadataChanged.reason) {
                    this._description.textContent = metadataChanged.reason;
                }
                this.propertyHeaderContainer.classList.add('modified');
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this._menu, undefined, actions);
                this._toolbar.setActions(actions);
            }
            else {
                this._statusSpan.textContent = this.accessor.unChangedLabel;
                this._statusSpan.style.fontWeight = 'normal';
                this._description.textContent = '';
                this.propertyHeaderContainer.classList.remove('modified');
                this._toolbar.setActions([]);
            }
        }
        _updateFoldingIcon() {
            if (this.accessor.getFoldingState(this.cell) === diffElementViewModel_1.PropertyFoldingState.Collapsed) {
                DOM.reset(this._foldingIndicator, (0, iconLabels_1.renderIcon)(notebookIcons_1.collapsedIcon));
                this._propertyExpanded?.set(false);
            }
            else {
                DOM.reset(this._foldingIndicator, (0, iconLabels_1.renderIcon)(notebookIcons_1.expandedIcon));
                this._propertyExpanded?.set(true);
            }
        }
    };
    PropertyHeader = __decorate([
        __param(4, contextView_1.IContextMenuService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, commands_1.ICommandService),
        __param(7, notification_1.INotificationService),
        __param(8, actions_1.IMenuService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, themeService_1.IThemeService),
        __param(11, telemetry_1.ITelemetryService),
        __param(12, accessibility_1.IAccessibilityService)
    ], PropertyHeader);
    class AbstractElementRenderer extends lifecycle_1.Disposable {
        constructor(notebookEditor, cell, templateData, style, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.cell = cell;
            this.templateData = templateData;
            this.style = style;
            this.instantiationService = instantiationService;
            this.languageService = languageService;
            this.modelService = modelService;
            this.textModelService = textModelService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this._metadataLocalDisposable = this._register(new lifecycle_1.DisposableStore());
            this._outputLocalDisposable = this._register(new lifecycle_1.DisposableStore());
            this._ignoreMetadata = false;
            this._ignoreOutputs = false;
            // init
            this._isDisposed = false;
            this._metadataEditorDisposeStore = this._register(new lifecycle_1.DisposableStore());
            this._outputEditorDisposeStore = this._register(new lifecycle_1.DisposableStore());
            this._register(cell.onDidLayoutChange(e => this.layout(e)));
            this._register(cell.onDidLayoutChange(e => this.updateBorders()));
            this.init();
            this.buildBody();
            this._register(cell.onDidStateChange(() => {
                this.updateOutputRendering(this.cell.renderOutput);
            }));
        }
        buildBody() {
            const body = this.templateData.body;
            this._diffEditorContainer = this.templateData.diffEditorContainer;
            body.classList.remove('left', 'right', 'full');
            switch (this.style) {
                case 'left':
                    body.classList.add('left');
                    break;
                case 'right':
                    body.classList.add('right');
                    break;
                default:
                    body.classList.add('full');
                    break;
            }
            this.styleContainer(this._diffEditorContainer);
            this.updateSourceEditor();
            this._ignoreMetadata = this.configurationService.getValue('notebook.diff.ignoreMetadata');
            if (this._ignoreMetadata) {
                this._disposeMetadata();
            }
            else {
                this._buildMetadata();
            }
            this._ignoreOutputs = this.configurationService.getValue('notebook.diff.ignoreOutputs') || !!(this.notebookEditor.textModel?.transientOptions.transientOutputs);
            if (this._ignoreOutputs) {
                this._disposeOutput();
            }
            else {
                this._buildOutput();
            }
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                let metadataLayoutChange = false;
                let outputLayoutChange = false;
                if (e.affectsConfiguration('notebook.diff.ignoreMetadata')) {
                    const newValue = this.configurationService.getValue('notebook.diff.ignoreMetadata');
                    if (newValue !== undefined && this._ignoreMetadata !== newValue) {
                        this._ignoreMetadata = newValue;
                        this._metadataLocalDisposable.clear();
                        if (this.configurationService.getValue('notebook.diff.ignoreMetadata')) {
                            this._disposeMetadata();
                        }
                        else {
                            this.cell.metadataStatusHeight = 25;
                            this._buildMetadata();
                            this.updateMetadataRendering();
                            metadataLayoutChange = true;
                        }
                    }
                }
                if (e.affectsConfiguration('notebook.diff.ignoreOutputs')) {
                    const newValue = this.configurationService.getValue('notebook.diff.ignoreOutputs');
                    if (newValue !== undefined && this._ignoreOutputs !== (newValue || this.notebookEditor.textModel?.transientOptions.transientOutputs)) {
                        this._ignoreOutputs = newValue || !!(this.notebookEditor.textModel?.transientOptions.transientOutputs);
                        this._outputLocalDisposable.clear();
                        if (this._ignoreOutputs) {
                            this._disposeOutput();
                        }
                        else {
                            this.cell.outputStatusHeight = 25;
                            this._buildOutput();
                            outputLayoutChange = true;
                        }
                    }
                }
                if (metadataLayoutChange || outputLayoutChange) {
                    this.layout({ metadataHeight: metadataLayoutChange, outputTotalHeight: outputLayoutChange });
                }
            }));
        }
        updateMetadataRendering() {
            if (this.cell.metadataFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                // we should expand the metadata editor
                this._metadataInfoContainer.style.display = 'block';
                if (!this._metadataEditorContainer || !this._metadataEditor) {
                    // create editor
                    this._metadataEditorContainer = DOM.append(this._metadataInfoContainer, DOM.$('.metadata-editor-container'));
                    this._buildMetadataEditor();
                }
                else {
                    this.cell.metadataHeight = this._metadataEditor.getContentHeight();
                }
            }
            else {
                // we should collapse the metadata editor
                this._metadataInfoContainer.style.display = 'none';
                // this._metadataEditorDisposeStore.clear();
                this.cell.metadataHeight = 0;
            }
        }
        updateOutputRendering(renderRichOutput) {
            if (this.cell.outputFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                this._outputInfoContainer.style.display = 'block';
                if (renderRichOutput) {
                    this._hideOutputsRaw();
                    this._buildOutputRendererContainer();
                    this._showOutputsRenderer();
                    this._showOutputsEmptyView();
                }
                else {
                    this._hideOutputsRenderer();
                    this._buildOutputRawContainer();
                    this._showOutputsRaw();
                }
            }
            else {
                this._outputInfoContainer.style.display = 'none';
                this._hideOutputsRaw();
                this._hideOutputsRenderer();
                this._hideOutputsEmptyView();
            }
        }
        _buildOutputRawContainer() {
            if (!this._outputEditorContainer) {
                this._outputEditorContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-editor-container'));
                this._buildOutputEditor();
            }
        }
        _showOutputsRaw() {
            if (this._outputEditorContainer) {
                this._outputEditorContainer.style.display = 'block';
                this.cell.rawOutputHeight = this._outputEditor.getContentHeight();
            }
        }
        _showOutputsEmptyView() {
            this.cell.layoutChange();
        }
        _hideOutputsRaw() {
            if (this._outputEditorContainer) {
                this._outputEditorContainer.style.display = 'none';
                this.cell.rawOutputHeight = 0;
            }
        }
        _hideOutputsEmptyView() {
            this.cell.layoutChange();
        }
        _applySanitizedMetadataChanges(currentMetadata, newMetadata) {
            const result = {};
            try {
                const newMetadataObj = JSON.parse(newMetadata);
                const keys = new Set([...Object.keys(newMetadataObj)]);
                for (const key of keys) {
                    switch (key) {
                        case 'inputCollapsed':
                        case 'outputCollapsed':
                            // boolean
                            if (typeof newMetadataObj[key] === 'boolean') {
                                result[key] = newMetadataObj[key];
                            }
                            else {
                                result[key] = currentMetadata[key];
                            }
                            break;
                        default:
                            result[key] = newMetadataObj[key];
                            break;
                    }
                }
                const index = this.notebookEditor.textModel.cells.indexOf(this.cell.modified.textModel);
                if (index < 0) {
                    return;
                }
                this.notebookEditor.textModel.applyEdits([
                    { editType: 3 /* CellEditType.Metadata */, index, metadata: result }
                ], true, undefined, () => undefined, undefined, true);
            }
            catch {
            }
        }
        async _buildMetadataEditor() {
            this._metadataEditorDisposeStore.clear();
            if (this.cell instanceof diffElementViewModel_1.SideBySideDiffElementViewModel) {
                this._metadataEditor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, this._metadataEditorContainer, {
                    ...diffCellEditorOptions_1.fixedDiffEditorOptions,
                    overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(),
                    readOnly: false,
                    originalEditable: false,
                    ignoreTrimWhitespace: false,
                    automaticLayout: false,
                    dimension: {
                        height: this.cell.layoutInfo.metadataHeight,
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), true, true)
                    }
                }, {
                    originalEditor: getOptimizedNestedCodeEditorWidgetOptions(),
                    modifiedEditor: getOptimizedNestedCodeEditorWidgetOptions()
                });
                this.layout({ metadataHeight: true });
                this._metadataEditorDisposeStore.add(this._metadataEditor);
                this._metadataEditorContainer?.classList.add('diff');
                const originalMetadataModel = await this.textModelService.createModelReference(notebookCommon_1.CellUri.generateCellPropertyUri(this.cell.originalDocument.uri, this.cell.original.handle, network_1.Schemas.vscodeNotebookCellMetadata));
                const modifiedMetadataModel = await this.textModelService.createModelReference(notebookCommon_1.CellUri.generateCellPropertyUri(this.cell.modifiedDocument.uri, this.cell.modified.handle, network_1.Schemas.vscodeNotebookCellMetadata));
                this._metadataEditor.setModel({
                    original: originalMetadataModel.object.textEditorModel,
                    modified: modifiedMetadataModel.object.textEditorModel
                });
                this._metadataEditorDisposeStore.add(originalMetadataModel);
                this._metadataEditorDisposeStore.add(modifiedMetadataModel);
                this.cell.metadataHeight = this._metadataEditor.getContentHeight();
                this._metadataEditorDisposeStore.add(this._metadataEditor.onDidContentSizeChange((e) => {
                    if (e.contentHeightChanged && this.cell.metadataFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                        this.cell.metadataHeight = e.contentHeight;
                    }
                }));
                let respondingToContentChange = false;
                this._metadataEditorDisposeStore.add(modifiedMetadataModel.object.textEditorModel.onDidChangeContent(() => {
                    respondingToContentChange = true;
                    const value = modifiedMetadataModel.object.textEditorModel.getValue();
                    this._applySanitizedMetadataChanges(this.cell.modified.metadata, value);
                    this._metadataHeader.refresh();
                    respondingToContentChange = false;
                }));
                this._metadataEditorDisposeStore.add(this.cell.modified.textModel.onDidChangeMetadata(() => {
                    if (respondingToContentChange) {
                        return;
                    }
                    const modifiedMetadataSource = (0, diffElementViewModel_1.getFormattedMetadataJSON)(this.notebookEditor.textModel, this.cell.modified?.metadata || {}, this.cell.modified?.language);
                    modifiedMetadataModel.object.textEditorModel.setValue(modifiedMetadataSource);
                }));
                return;
            }
            else {
                this._metadataEditor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._metadataEditorContainer, {
                    ...diffCellEditorOptions_1.fixedEditorOptions,
                    dimension: {
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true),
                        height: this.cell.layoutInfo.metadataHeight
                    },
                    overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(),
                    readOnly: false
                }, {});
                this.layout({ metadataHeight: true });
                this._metadataEditorDisposeStore.add(this._metadataEditor);
                const mode = this.languageService.createById('jsonc');
                const originalMetadataSource = (0, diffElementViewModel_1.getFormattedMetadataJSON)(this.notebookEditor.textModel, this.cell.type === 'insert'
                    ? this.cell.modified.metadata || {}
                    : this.cell.original.metadata || {});
                const uri = this.cell.type === 'insert'
                    ? this.cell.modified.uri
                    : this.cell.original.uri;
                const handle = this.cell.type === 'insert'
                    ? this.cell.modified.handle
                    : this.cell.original.handle;
                const modelUri = notebookCommon_1.CellUri.generateCellPropertyUri(uri, handle, network_1.Schemas.vscodeNotebookCellMetadata);
                const metadataModel = this.modelService.createModel(originalMetadataSource, mode, modelUri, false);
                this._metadataEditor.setModel(metadataModel);
                this._metadataEditorDisposeStore.add(metadataModel);
                this.cell.metadataHeight = this._metadataEditor.getContentHeight();
                this._metadataEditorDisposeStore.add(this._metadataEditor.onDidContentSizeChange((e) => {
                    if (e.contentHeightChanged && this.cell.metadataFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                        this.cell.metadataHeight = e.contentHeight;
                    }
                }));
            }
        }
        _buildOutputEditor() {
            this._outputEditorDisposeStore.clear();
            if ((this.cell.type === 'modified' || this.cell.type === 'unchanged') && !this.notebookEditor.textModel.transientOptions.transientOutputs) {
                const originalOutputsSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(this.cell.original?.outputs || []);
                const modifiedOutputsSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(this.cell.modified?.outputs || []);
                if (originalOutputsSource !== modifiedOutputsSource) {
                    const mode = this.languageService.createById('json');
                    const originalModel = this.modelService.createModel(originalOutputsSource, mode, undefined, true);
                    const modifiedModel = this.modelService.createModel(modifiedOutputsSource, mode, undefined, true);
                    this._outputEditorDisposeStore.add(originalModel);
                    this._outputEditorDisposeStore.add(modifiedModel);
                    const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
                    const lineCount = Math.max(originalModel.getLineCount(), modifiedModel.getLineCount());
                    this._outputEditor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, this._outputEditorContainer, {
                        ...diffCellEditorOptions_1.fixedDiffEditorOptions,
                        overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(),
                        readOnly: true,
                        ignoreTrimWhitespace: false,
                        automaticLayout: false,
                        dimension: {
                            height: Math.min(diffElementViewModel_1.OUTPUT_EDITOR_HEIGHT_MAGIC, this.cell.layoutInfo.rawOutputHeight || lineHeight * lineCount),
                            width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true)
                        },
                        accessibilityVerbose: this.configurationService.getValue("accessibility.verbosity.diffEditor" /* AccessibilityVerbositySettingId.DiffEditor */) ?? false
                    }, {
                        originalEditor: getOptimizedNestedCodeEditorWidgetOptions(),
                        modifiedEditor: getOptimizedNestedCodeEditorWidgetOptions()
                    });
                    this._outputEditorDisposeStore.add(this._outputEditor);
                    this._outputEditorContainer?.classList.add('diff');
                    this._outputEditor.setModel({
                        original: originalModel,
                        modified: modifiedModel
                    });
                    this._outputEditor.restoreViewState(this.cell.getOutputEditorViewState());
                    this.cell.rawOutputHeight = this._outputEditor.getContentHeight();
                    this._outputEditorDisposeStore.add(this._outputEditor.onDidContentSizeChange((e) => {
                        if (e.contentHeightChanged && this.cell.outputFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                            this.cell.rawOutputHeight = e.contentHeight;
                        }
                    }));
                    this._outputEditorDisposeStore.add(this.cell.modified.textModel.onDidChangeOutputs(() => {
                        const modifiedOutputsSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(this.cell.modified?.outputs || []);
                        modifiedModel.setValue(modifiedOutputsSource);
                        this._outputHeader.refresh();
                    }));
                    return;
                }
            }
            this._outputEditor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._outputEditorContainer, {
                ...diffCellEditorOptions_1.fixedEditorOptions,
                dimension: {
                    width: Math.min(diffElementViewModel_1.OUTPUT_EDITOR_HEIGHT_MAGIC, this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, this.cell.type === 'unchanged' || this.cell.type === 'modified') - 32),
                    height: this.cell.layoutInfo.rawOutputHeight
                },
                overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode()
            }, {});
            this._outputEditorDisposeStore.add(this._outputEditor);
            const mode = this.languageService.createById('json');
            const originaloutputSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(this.notebookEditor.textModel.transientOptions.transientOutputs
                ? []
                : this.cell.type === 'insert'
                    ? this.cell.modified.outputs || []
                    : this.cell.original.outputs || []);
            const outputModel = this.modelService.createModel(originaloutputSource, mode, undefined, true);
            this._outputEditorDisposeStore.add(outputModel);
            this._outputEditor.setModel(outputModel);
            this._outputEditor.restoreViewState(this.cell.getOutputEditorViewState());
            this.cell.rawOutputHeight = this._outputEditor.getContentHeight();
            this._outputEditorDisposeStore.add(this._outputEditor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.outputFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                    this.cell.rawOutputHeight = e.contentHeight;
                }
            }));
        }
        layoutNotebookCell() {
            this.notebookEditor.layoutNotebookCell(this.cell, this.cell.layoutInfo.totalHeight);
        }
        updateBorders() {
            this.templateData.leftBorder.style.height = `${this.cell.layoutInfo.totalHeight - 32}px`;
            this.templateData.rightBorder.style.height = `${this.cell.layoutInfo.totalHeight - 32}px`;
            this.templateData.bottomBorder.style.top = `${this.cell.layoutInfo.totalHeight - 32}px`;
        }
        dispose() {
            if (this._outputEditor) {
                this.cell.saveOutputEditorViewState(this._outputEditor.saveViewState());
            }
            if (this._metadataEditor) {
                this.cell.saveMetadataEditorViewState(this._metadataEditor.saveViewState());
            }
            this._metadataEditorDisposeStore.dispose();
            this._outputEditorDisposeStore.dispose();
            this._isDisposed = true;
            super.dispose();
        }
    }
    class SingleSideDiffElement extends AbstractElementRenderer {
        constructor(notebookEditor, cell, templateData, style, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, style, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
            this.cell = cell;
            this.templateData = templateData;
            this.updateBorders();
        }
        init() {
            this._diagonalFill = this.templateData.diagonalFill;
        }
        buildBody() {
            const body = this.templateData.body;
            this._diffEditorContainer = this.templateData.diffEditorContainer;
            body.classList.remove('left', 'right', 'full');
            switch (this.style) {
                case 'left':
                    body.classList.add('left');
                    break;
                case 'right':
                    body.classList.add('right');
                    break;
                default:
                    body.classList.add('full');
                    break;
            }
            this.styleContainer(this._diffEditorContainer);
            this.updateSourceEditor();
            if (this.configurationService.getValue('notebook.diff.ignoreMetadata')) {
                this._disposeMetadata();
            }
            else {
                this._buildMetadata();
            }
            if (this.configurationService.getValue('notebook.diff.ignoreOutputs') || this.notebookEditor.textModel?.transientOptions.transientOutputs) {
                this._disposeOutput();
            }
            else {
                this._buildOutput();
            }
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                let metadataLayoutChange = false;
                let outputLayoutChange = false;
                if (e.affectsConfiguration('notebook.diff.ignoreMetadata')) {
                    this._metadataLocalDisposable.clear();
                    if (this.configurationService.getValue('notebook.diff.ignoreMetadata')) {
                        this._disposeMetadata();
                    }
                    else {
                        this.cell.metadataStatusHeight = 25;
                        this._buildMetadata();
                        this.updateMetadataRendering();
                        metadataLayoutChange = true;
                    }
                }
                if (e.affectsConfiguration('notebook.diff.ignoreOutputs')) {
                    this._outputLocalDisposable.clear();
                    if (this.configurationService.getValue('notebook.diff.ignoreOutputs') || this.notebookEditor.textModel?.transientOptions.transientOutputs) {
                        this._disposeOutput();
                    }
                    else {
                        this.cell.outputStatusHeight = 25;
                        this._buildOutput();
                        outputLayoutChange = true;
                    }
                }
                if (metadataLayoutChange || outputLayoutChange) {
                    this.layout({ metadataHeight: metadataLayoutChange, outputTotalHeight: outputLayoutChange });
                }
            }));
        }
        _disposeMetadata() {
            this.cell.metadataStatusHeight = 0;
            this.cell.metadataHeight = 0;
            this.templateData.metadataHeaderContainer.style.display = 'none';
            this.templateData.metadataInfoContainer.style.display = 'none';
            this._metadataEditor = undefined;
        }
        _buildMetadata() {
            this._metadataHeaderContainer = this.templateData.metadataHeaderContainer;
            this._metadataInfoContainer = this.templateData.metadataInfoContainer;
            this._metadataHeaderContainer.style.display = 'flex';
            this._metadataInfoContainer.style.display = 'block';
            this._metadataHeaderContainer.innerText = '';
            this._metadataInfoContainer.innerText = '';
            this._metadataHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._metadataHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateMetadataRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkMetadataIfModified();
                },
                getFoldingState: (cell) => {
                    return cell.metadataFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.metadataFoldingState = state;
                },
                unChangedLabel: 'Metadata',
                changedLabel: 'Metadata changed',
                prefix: 'metadata',
                menuId: actions_1.MenuId.NotebookDiffCellMetadataTitle
            });
            this._metadataLocalDisposable.add(this._metadataHeader);
            this._metadataHeader.buildHeader();
        }
        _buildOutput() {
            this.templateData.outputHeaderContainer.style.display = 'flex';
            this.templateData.outputInfoContainer.style.display = 'block';
            this._outputHeaderContainer = this.templateData.outputHeaderContainer;
            this._outputInfoContainer = this.templateData.outputInfoContainer;
            this._outputHeaderContainer.innerText = '';
            this._outputInfoContainer.innerText = '';
            this._outputHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._outputHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateOutputRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkIfOutputsModified();
                },
                getFoldingState: (cell) => {
                    return cell.outputFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.outputFoldingState = state;
                },
                unChangedLabel: 'Outputs',
                changedLabel: 'Outputs changed',
                prefix: 'output',
                menuId: actions_1.MenuId.NotebookDiffCellOutputsTitle
            });
            this._outputLocalDisposable.add(this._outputHeader);
            this._outputHeader.buildHeader();
        }
        _disposeOutput() {
            this._hideOutputsRaw();
            this._hideOutputsRenderer();
            this._hideOutputsEmptyView();
            this.cell.rawOutputHeight = 0;
            this.cell.outputStatusHeight = 0;
            this.templateData.outputHeaderContainer.style.display = 'none';
            this.templateData.outputInfoContainer.style.display = 'none';
            this._outputViewContainer = undefined;
        }
    }
    let DeletedElement = class DeletedElement extends SingleSideDiffElement {
        constructor(notebookEditor, cell, templateData, languageService, modelService, textModelService, instantiationService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, 'left', instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
        }
        styleContainer(container) {
            container.classList.remove('inserted');
            container.classList.add('removed');
        }
        updateSourceEditor() {
            const originalCell = this.cell.original;
            const lineCount = originalCell.textModel.textBuffer.getLineCount();
            const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
            const editorHeight = lineCount * lineHeight + diffCellEditorOptions_1.fixedEditorPadding.top + diffCellEditorOptions_1.fixedEditorPadding.bottom;
            this._editor = this.templateData.sourceEditor;
            this._editor.layout({
                width: (this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN) / 2 - 18,
                height: editorHeight
            });
            this.cell.editorHeight = editorHeight;
            this._register(this._editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.layoutInfo.editorHeight !== e.contentHeight) {
                    this.cell.editorHeight = e.contentHeight;
                }
            }));
            this.textModelService.createModelReference(originalCell.uri).then(ref => {
                if (this._isDisposed) {
                    return;
                }
                this._register(ref);
                const textModel = ref.object.textEditorModel;
                this._editor.setModel(textModel);
                this.cell.editorHeight = this._editor.getContentHeight();
            });
        }
        layout(state) {
            DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this._diffEditorContainer), () => {
                if (state.editorHeight || state.outerWidth) {
                    this._editor.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.editorHeight
                    });
                }
                if (state.metadataHeight || state.outerWidth) {
                    this._metadataEditor?.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.metadataHeight
                    });
                }
                if (state.outputTotalHeight || state.outerWidth) {
                    this._outputEditor?.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.outputTotalHeight
                    });
                }
                if (this._diagonalFill) {
                    this._diagonalFill.style.height = `${this.cell.layoutInfo.totalHeight - 32}px`;
                }
                this.layoutNotebookCell();
            });
        }
        _buildOutputRendererContainer() {
            if (!this._outputViewContainer) {
                this._outputViewContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-view-container'));
                this._outputEmptyElement = DOM.append(this._outputViewContainer, DOM.$('.output-empty-view'));
                const span = DOM.append(this._outputEmptyElement, DOM.$('span'));
                span.innerText = 'No outputs to render';
                if (this.cell.original.outputs.length === 0) {
                    this._outputEmptyElement.style.display = 'block';
                }
                else {
                    this._outputEmptyElement.style.display = 'none';
                }
                this.cell.layoutChange();
                this._outputLeftView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.original, notebookDiffEditorBrowser_1.DiffSide.Original, this._outputViewContainer);
                this._register(this._outputLeftView);
                this._outputLeftView.render();
                const removedOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                    if (e.cell.uri.toString() === this.cell.original.uri.toString()) {
                        this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
                        removedOutputRenderListener.dispose();
                    }
                });
                this._register(removedOutputRenderListener);
            }
            this._outputViewContainer.style.display = 'block';
        }
        _decorate() {
            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
        }
        _showOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'block';
                this._outputLeftView?.showOutputs();
                this._decorate();
            }
        }
        _hideOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'none';
                this._outputLeftView?.hideOutputs();
            }
        }
        dispose() {
            if (this._editor) {
                this.cell.saveSpirceEditorViewState(this._editor.saveViewState());
            }
            super.dispose();
        }
    };
    exports.DeletedElement = DeletedElement;
    exports.DeletedElement = DeletedElement = __decorate([
        __param(3, language_1.ILanguageService),
        __param(4, model_1.IModelService),
        __param(5, resolverService_1.ITextModelService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, actions_1.IMenuService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, configuration_1.IConfigurationService)
    ], DeletedElement);
    let InsertElement = class InsertElement extends SingleSideDiffElement {
        constructor(notebookEditor, cell, templateData, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, 'right', instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
        }
        styleContainer(container) {
            container.classList.remove('removed');
            container.classList.add('inserted');
        }
        updateSourceEditor() {
            const modifiedCell = this.cell.modified;
            const lineCount = modifiedCell.textModel.textBuffer.getLineCount();
            const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
            const editorHeight = lineCount * lineHeight + diffCellEditorOptions_1.fixedEditorPadding.top + diffCellEditorOptions_1.fixedEditorPadding.bottom;
            this._editor = this.templateData.sourceEditor;
            this._editor.layout({
                width: (this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN) / 2 - 18,
                height: editorHeight
            });
            this._editor.updateOptions({ readOnly: false });
            this.cell.editorHeight = editorHeight;
            this._register(this._editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.layoutInfo.editorHeight !== e.contentHeight) {
                    this.cell.editorHeight = e.contentHeight;
                }
            }));
            this.textModelService.createModelReference(modifiedCell.uri).then(ref => {
                if (this._isDisposed) {
                    return;
                }
                this._register(ref);
                const textModel = ref.object.textEditorModel;
                this._editor.setModel(textModel);
                this._editor.restoreViewState(this.cell.getSourceEditorViewState());
                this.cell.editorHeight = this._editor.getContentHeight();
            });
        }
        _buildOutputRendererContainer() {
            if (!this._outputViewContainer) {
                this._outputViewContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-view-container'));
                this._outputEmptyElement = DOM.append(this._outputViewContainer, DOM.$('.output-empty-view'));
                this._outputEmptyElement.innerText = 'No outputs to render';
                if (this.cell.modified.outputs.length === 0) {
                    this._outputEmptyElement.style.display = 'block';
                }
                else {
                    this._outputEmptyElement.style.display = 'none';
                }
                this.cell.layoutChange();
                this._outputRightView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.modified, notebookDiffEditorBrowser_1.DiffSide.Modified, this._outputViewContainer);
                this._register(this._outputRightView);
                this._outputRightView.render();
                const insertOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                    if (e.cell.uri.toString() === this.cell.modified.uri.toString()) {
                        this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
                        insertOutputRenderListener.dispose();
                    }
                });
                this._register(insertOutputRenderListener);
            }
            this._outputViewContainer.style.display = 'block';
        }
        _decorate() {
            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
        }
        _showOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'block';
                this._outputRightView?.showOutputs();
                this._decorate();
            }
        }
        _hideOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'none';
                this._outputRightView?.hideOutputs();
            }
        }
        layout(state) {
            DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this._diffEditorContainer), () => {
                if (state.editorHeight || state.outerWidth) {
                    this._editor.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.editorHeight
                    });
                }
                if (state.metadataHeight || state.outerWidth) {
                    this._metadataEditor?.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true),
                        height: this.cell.layoutInfo.metadataHeight
                    });
                }
                if (state.outputTotalHeight || state.outerWidth) {
                    this._outputEditor?.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.outputTotalHeight
                    });
                }
                this.layoutNotebookCell();
                if (this._diagonalFill) {
                    this._diagonalFill.style.height = `${this.cell.layoutInfo.editorHeight + this.cell.layoutInfo.editorMargin + this.cell.layoutInfo.metadataStatusHeight + this.cell.layoutInfo.metadataHeight + this.cell.layoutInfo.outputTotalHeight + this.cell.layoutInfo.outputStatusHeight}px`;
                }
            });
        }
        dispose() {
            if (this._editor) {
                this.cell.saveSpirceEditorViewState(this._editor.saveViewState());
            }
            super.dispose();
        }
    };
    exports.InsertElement = InsertElement;
    exports.InsertElement = InsertElement = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, language_1.ILanguageService),
        __param(5, model_1.IModelService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, actions_1.IMenuService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, configuration_1.IConfigurationService)
    ], InsertElement);
    let ModifiedElement = class ModifiedElement extends AbstractElementRenderer {
        constructor(notebookEditor, cell, templateData, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, 'full', instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
            this.cell = cell;
            this.templateData = templateData;
            this._editorViewStateChanged = false;
            this.updateBorders();
        }
        init() { }
        styleContainer(container) {
            container.classList.remove('inserted', 'removed');
        }
        _disposeMetadata() {
            this.cell.metadataStatusHeight = 0;
            this.cell.metadataHeight = 0;
            this.templateData.metadataHeaderContainer.style.display = 'none';
            this.templateData.metadataInfoContainer.style.display = 'none';
            this._metadataEditor = undefined;
        }
        _buildMetadata() {
            this._metadataHeaderContainer = this.templateData.metadataHeaderContainer;
            this._metadataInfoContainer = this.templateData.metadataInfoContainer;
            this._metadataHeaderContainer.style.display = 'flex';
            this._metadataInfoContainer.style.display = 'block';
            this._metadataHeaderContainer.innerText = '';
            this._metadataInfoContainer.innerText = '';
            this._metadataHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._metadataHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateMetadataRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkMetadataIfModified();
                },
                getFoldingState: (cell) => {
                    return cell.metadataFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.metadataFoldingState = state;
                },
                unChangedLabel: 'Metadata',
                changedLabel: 'Metadata changed',
                prefix: 'metadata',
                menuId: actions_1.MenuId.NotebookDiffCellMetadataTitle
            });
            this._metadataLocalDisposable.add(this._metadataHeader);
            this._metadataHeader.buildHeader();
        }
        _disposeOutput() {
            this._hideOutputsRaw();
            this._hideOutputsRenderer();
            this._hideOutputsEmptyView();
            this.cell.rawOutputHeight = 0;
            this.cell.outputStatusHeight = 0;
            this.templateData.outputHeaderContainer.style.display = 'none';
            this.templateData.outputInfoContainer.style.display = 'none';
            this._outputViewContainer = undefined;
        }
        _buildOutput() {
            this.templateData.outputHeaderContainer.style.display = 'flex';
            this.templateData.outputInfoContainer.style.display = 'block';
            this._outputHeaderContainer = this.templateData.outputHeaderContainer;
            this._outputInfoContainer = this.templateData.outputInfoContainer;
            this._outputHeaderContainer.innerText = '';
            this._outputInfoContainer.innerText = '';
            if (this.cell.checkIfOutputsModified()) {
                this._outputInfoContainer.classList.add('modified');
            }
            else {
                this._outputInfoContainer.classList.remove('modified');
            }
            this._outputHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._outputHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateOutputRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkIfOutputsModified();
                },
                getFoldingState: (cell) => {
                    return cell.outputFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.outputFoldingState = state;
                },
                unChangedLabel: 'Outputs',
                changedLabel: 'Outputs changed',
                prefix: 'output',
                menuId: actions_1.MenuId.NotebookDiffCellOutputsTitle
            });
            this._outputLocalDisposable.add(this._outputHeader);
            this._outputHeader.buildHeader();
        }
        _buildOutputRendererContainer() {
            if (!this._outputViewContainer) {
                this._outputViewContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-view-container'));
                this._outputEmptyElement = DOM.append(this._outputViewContainer, DOM.$('.output-empty-view'));
                this._outputEmptyElement.innerText = 'No outputs to render';
                if (!this.cell.checkIfOutputsModified() && this.cell.modified.outputs.length === 0) {
                    this._outputEmptyElement.style.display = 'block';
                }
                else {
                    this._outputEmptyElement.style.display = 'none';
                }
                this.cell.layoutChange();
                this._register(this.cell.modified.textModel.onDidChangeOutputs(() => {
                    // currently we only allow outputs change to the modified cell
                    if (!this.cell.checkIfOutputsModified() && this.cell.modified.outputs.length === 0) {
                        this._outputEmptyElement.style.display = 'block';
                    }
                    else {
                        this._outputEmptyElement.style.display = 'none';
                    }
                    this._decorate();
                }));
                this._outputLeftContainer = DOM.append(this._outputViewContainer, DOM.$('.output-view-container-left'));
                this._outputRightContainer = DOM.append(this._outputViewContainer, DOM.$('.output-view-container-right'));
                this._outputMetadataContainer = DOM.append(this._outputViewContainer, DOM.$('.output-view-container-metadata'));
                const outputModified = this.cell.checkIfOutputsModified();
                const outputMetadataChangeOnly = outputModified
                    && outputModified.kind === 1 /* OutputComparison.Metadata */
                    && this.cell.original.outputs.length === 1
                    && this.cell.modified.outputs.length === 1
                    && (0, diffElementViewModel_1.outputEqual)(this.cell.original.outputs[0], this.cell.modified.outputs[0]) === 1 /* OutputComparison.Metadata */;
                if (outputModified && !outputMetadataChangeOnly) {
                    const originalOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                        if (e.cell.uri.toString() === this.cell.original.uri.toString() && this.cell.checkIfOutputsModified()) {
                            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
                            originalOutputRenderListener.dispose();
                        }
                    });
                    const modifiedOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                        if (e.cell.uri.toString() === this.cell.modified.uri.toString() && this.cell.checkIfOutputsModified()) {
                            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
                            modifiedOutputRenderListener.dispose();
                        }
                    });
                    this._register(originalOutputRenderListener);
                    this._register(modifiedOutputRenderListener);
                }
                // We should use the original text model here
                this._outputLeftView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.original, notebookDiffEditorBrowser_1.DiffSide.Original, this._outputLeftContainer);
                this._outputLeftView.render();
                this._register(this._outputLeftView);
                this._outputRightView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.modified, notebookDiffEditorBrowser_1.DiffSide.Modified, this._outputRightContainer);
                this._outputRightView.render();
                this._register(this._outputRightView);
                if (outputModified && !outputMetadataChangeOnly) {
                    this._decorate();
                }
                if (outputMetadataChangeOnly) {
                    this._outputMetadataContainer.style.top = `${this.cell.layoutInfo.rawOutputHeight}px`;
                    // single output, metadata change, let's render a diff editor for metadata
                    this._outputMetadataEditor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, this._outputMetadataContainer, {
                        ...diffCellEditorOptions_1.fixedDiffEditorOptions,
                        overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(),
                        readOnly: true,
                        ignoreTrimWhitespace: false,
                        automaticLayout: false,
                        dimension: {
                            height: diffElementViewModel_1.OUTPUT_EDITOR_HEIGHT_MAGIC,
                            width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true)
                        }
                    }, {
                        originalEditor: getOptimizedNestedCodeEditorWidgetOptions(),
                        modifiedEditor: getOptimizedNestedCodeEditorWidgetOptions()
                    });
                    this._register(this._outputMetadataEditor);
                    const originalOutputMetadataSource = JSON.stringify(this.cell.original.outputs[0].metadata ?? {}, undefined, '\t');
                    const modifiedOutputMetadataSource = JSON.stringify(this.cell.modified.outputs[0].metadata ?? {}, undefined, '\t');
                    const mode = this.languageService.createById('json');
                    const originalModel = this.modelService.createModel(originalOutputMetadataSource, mode, undefined, true);
                    const modifiedModel = this.modelService.createModel(modifiedOutputMetadataSource, mode, undefined, true);
                    this._outputMetadataEditor.setModel({
                        original: originalModel,
                        modified: modifiedModel
                    });
                    this.cell.outputMetadataHeight = this._outputMetadataEditor.getContentHeight();
                    this._register(this._outputMetadataEditor.onDidContentSizeChange((e) => {
                        this.cell.outputMetadataHeight = e.contentHeight;
                    }));
                }
            }
            this._outputViewContainer.style.display = 'block';
        }
        _decorate() {
            if (this.cell.checkIfOutputsModified()) {
                this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
                this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
            }
            else {
                this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, [], ['nb-cellDeleted']);
                this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, [], ['nb-cellAdded']);
            }
        }
        _showOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'block';
                this._outputLeftView?.showOutputs();
                this._outputRightView?.showOutputs();
                this._outputMetadataEditor?.layout();
                this._decorate();
            }
        }
        _hideOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'none';
                this._outputLeftView?.hideOutputs();
                this._outputRightView?.hideOutputs();
            }
        }
        updateSourceEditor() {
            const modifiedCell = this.cell.modified;
            const lineCount = modifiedCell.textModel.textBuffer.getLineCount();
            const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
            const editorHeight = this.cell.layoutInfo.editorHeight !== 0 ? this.cell.layoutInfo.editorHeight : lineCount * lineHeight + diffCellEditorOptions_1.fixedEditorPadding.top + diffCellEditorOptions_1.fixedEditorPadding.bottom;
            this._editorContainer = this.templateData.editorContainer;
            this._editor = this.templateData.sourceEditor;
            this._editorContainer.classList.add('diff');
            this._editor.layout({
                width: this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN,
                height: editorHeight
            });
            this._editorContainer.style.height = `${editorHeight}px`;
            this._register(this._editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.layoutInfo.editorHeight !== e.contentHeight) {
                    this.cell.editorHeight = e.contentHeight;
                }
            }));
            this._initializeSourceDiffEditor();
            const scopedContextKeyService = this.contextKeyService.createScoped(this.templateData.inputToolbarContainer);
            this._register(scopedContextKeyService);
            const inputChanged = notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_INPUT.bindTo(scopedContextKeyService);
            this._inputToolbarContainer = this.templateData.inputToolbarContainer;
            this._toolbar = this.templateData.toolbar;
            this._toolbar.context = {
                cell: this.cell
            };
            if (this.cell.modified.textModel.getValue() !== this.cell.original.textModel.getValue()) {
                this._inputToolbarContainer.style.display = 'block';
                inputChanged.set(true);
            }
            else {
                this._inputToolbarContainer.style.display = 'none';
                inputChanged.set(false);
            }
            this._register(this.cell.modified.textModel.onDidChangeContent(() => {
                if (this.cell.modified.textModel.getValue() !== this.cell.original.textModel.getValue()) {
                    this._inputToolbarContainer.style.display = 'block';
                    inputChanged.set(true);
                }
                else {
                    this._inputToolbarContainer.style.display = 'none';
                    inputChanged.set(false);
                }
            }));
            const menu = this.menuService.createMenu(actions_1.MenuId.NotebookDiffCellInputTitle, scopedContextKeyService);
            const actions = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, actions);
            this._toolbar.setActions(actions);
            menu.dispose();
        }
        async _initializeSourceDiffEditor() {
            const originalCell = this.cell.original;
            const modifiedCell = this.cell.modified;
            const originalRef = await this.textModelService.createModelReference(originalCell.uri);
            const modifiedRef = await this.textModelService.createModelReference(modifiedCell.uri);
            if (this._isDisposed) {
                return;
            }
            const textModel = originalRef.object.textEditorModel;
            const modifiedTextModel = modifiedRef.object.textEditorModel;
            this._register(originalRef);
            this._register(modifiedRef);
            this._editor.setModel({
                original: textModel,
                modified: modifiedTextModel
            });
            const handleViewStateChange = () => {
                this._editorViewStateChanged = true;
            };
            const handleScrollChange = (e) => {
                if (e.scrollTopChanged || e.scrollLeftChanged) {
                    this._editorViewStateChanged = true;
                }
            };
            this._register(this._editor.getOriginalEditor().onDidChangeCursorSelection(handleViewStateChange));
            this._register(this._editor.getOriginalEditor().onDidScrollChange(handleScrollChange));
            this._register(this._editor.getModifiedEditor().onDidChangeCursorSelection(handleViewStateChange));
            this._register(this._editor.getModifiedEditor().onDidScrollChange(handleScrollChange));
            const editorViewState = this.cell.getSourceEditorViewState();
            if (editorViewState) {
                this._editor.restoreViewState(editorViewState);
            }
            const contentHeight = this._editor.getContentHeight();
            this.cell.editorHeight = contentHeight;
        }
        layout(state) {
            DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this._diffEditorContainer), () => {
                if (state.editorHeight) {
                    this._editorContainer.style.height = `${this.cell.layoutInfo.editorHeight}px`;
                    this._editor.layout({
                        width: this._editor.getViewWidth(),
                        height: this.cell.layoutInfo.editorHeight
                    });
                }
                if (state.outerWidth) {
                    this._editorContainer.style.height = `${this.cell.layoutInfo.editorHeight}px`;
                    this._editor.layout();
                }
                if (state.metadataHeight || state.outerWidth) {
                    if (this._metadataEditorContainer) {
                        this._metadataEditorContainer.style.height = `${this.cell.layoutInfo.metadataHeight}px`;
                        this._metadataEditor?.layout();
                    }
                }
                if (state.outputTotalHeight || state.outerWidth) {
                    if (this._outputEditorContainer) {
                        this._outputEditorContainer.style.height = `${this.cell.layoutInfo.outputTotalHeight}px`;
                        this._outputEditor?.layout();
                    }
                    if (this._outputMetadataContainer) {
                        this._outputMetadataContainer.style.height = `${this.cell.layoutInfo.outputMetadataHeight}px`;
                        this._outputMetadataContainer.style.top = `${this.cell.layoutInfo.outputTotalHeight - this.cell.layoutInfo.outputMetadataHeight}px`;
                        this._outputMetadataEditor?.layout();
                    }
                }
                this.layoutNotebookCell();
            });
        }
        dispose() {
            if (this._editor && this._editorViewStateChanged) {
                this.cell.saveSpirceEditorViewState(this._editor.saveViewState());
            }
            super.dispose();
        }
    };
    exports.ModifiedElement = ModifiedElement;
    exports.ModifiedElement = ModifiedElement = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, language_1.ILanguageService),
        __param(5, model_1.IModelService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, actions_1.IMenuService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, configuration_1.IConfigurationService)
    ], ModifiedElement);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkNvbXBvbmVudHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2RpZmYvZGlmZkNvbXBvbmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkNoRyw4RkFZQztJQVpELFNBQWdCLHlDQUF5QztRQUN4RCxPQUFPO1lBQ04sY0FBYyxFQUFFLEtBQUs7WUFDckIsYUFBYSxFQUFFLDJDQUF3QixDQUFDLDBCQUEwQixDQUFDO2dCQUNsRSw2QkFBYSxDQUFDLEVBQUU7Z0JBQ2hCLHFEQUFnQztnQkFDaEMsbUNBQXFCLENBQUMsRUFBRTtnQkFDeEIscUNBQWlCLENBQUMsRUFBRTtnQkFDcEIsdUNBQWtCLENBQUMsRUFBRTtnQkFDckIsdUNBQXVCLENBQUMsRUFBRTthQUMxQixDQUFDO1NBQ0YsQ0FBQztJQUNILENBQUM7SUFHRCxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsc0JBQVU7UUFRdEMsWUFDVSxJQUE4QixFQUM5Qix1QkFBb0MsRUFDcEMsY0FBdUMsRUFDdkMsUUFTUixFQUNxQyxrQkFBdUMsRUFDeEMsaUJBQXFDLEVBQ3hDLGNBQStCLEVBQzFCLG1CQUF5QyxFQUNqRCxXQUF5QixFQUNuQixpQkFBcUMsRUFDMUMsWUFBMkIsRUFDdkIsZ0JBQW1DLEVBQy9CLG9CQUEyQztZQUVuRixLQUFLLEVBQUUsQ0FBQztZQXZCQyxTQUFJLEdBQUosSUFBSSxDQUEwQjtZQUM5Qiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQWE7WUFDcEMsbUJBQWMsR0FBZCxjQUFjLENBQXlCO1lBQ3ZDLGFBQVEsR0FBUixRQUFRLENBU2hCO1lBQ3FDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDeEMsc0JBQWlCLEdBQWpC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