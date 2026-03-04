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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/workbench/contrib/interactive/browser/interactiveEditorInput", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/executionStatusBarItemController", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/language", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/interactive/browser/interactiveCommon", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/browser/notebookOptions", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/contextview/browser/contextView", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/editor/browser/editorExtensions", "vs/editor/contrib/parameterHints/browser/parameterHints", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/snippet/browser/snippetController2", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/editor/contrib/gotoError/browser/gotoError", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/services/extensions/common/extensions", "vs/base/common/resources", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFindWidget", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/objects", "vs/editor/contrib/hover/browser/hoverController", "vs/css!./media/interactive", "vs/css!./interactiveEditor"], function (require, exports, nls, DOM, event_1, lifecycle_1, codeEditorService_1, codeEditorWidget_1, contextkey_1, instantiation_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, editorPane_1, simpleEditorOptions_1, interactiveEditorInput_1, notebookEditorExtensions_1, notebookEditorService_1, editorGroupsService_1, executionStatusBarItemController_1, notebookKernelService_1, modesRegistry_1, language_1, actions_1, keybinding_1, interactiveCommon_1, configuration_1, notebookOptions_1, toolbar_1, contextView_1, menuEntryActionViewItem_1, editorExtensions_1, parameterHints_1, menuPreventer_1, selectionClipboard_1, contextmenu_1, suggestController_1, snippetController2_1, tabCompletion_1, gotoError_1, textResourceConfiguration_1, notebookExecutionStateService_1, notebookContextKeys_1, extensions_1, resources_1, notebookFindWidget_1, notebookCommon_1, objects_1, hoverController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveEditor = void 0;
    const DECORATION_KEY = 'interactiveInputDecoration';
    const INTERACTIVE_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'InteractiveEditorViewState';
    const INPUT_CELL_VERTICAL_PADDING = 8;
    const INPUT_CELL_HORIZONTAL_PADDING_RIGHT = 10;
    const INPUT_EDITOR_PADDING = 8;
    let InteractiveEditor = class InteractiveEditor extends editorPane_1.EditorPane {
        get onDidFocus() { return this._onDidFocusWidget.event; }
        constructor(group, telemetryService, themeService, storageService, instantiationService, notebookWidgetService, contextKeyService, codeEditorService, notebookKernelService, languageService, keybindingService, configurationService, menuService, contextMenuService, editorGroupService, textResourceConfigurationService, notebookExecutionStateService, extensionService) {
            super(notebookCommon_1.INTERACTIVE_WINDOW_EDITOR_ID, group, telemetryService, themeService, storageService);
            this._notebookWidget = { value: undefined };
            this._widgetDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._groupListener = this._register(new lifecycle_1.MutableDisposable());
            this._onDidFocusWidget = this._register(new event_1.Emitter());
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeScroll = this._register(new event_1.Emitter());
            this.onDidChangeScroll = this._onDidChangeScroll.event;
            this._instantiationService = instantiationService;
            this._notebookWidgetService = notebookWidgetService;
            this._contextKeyService = contextKeyService;
            this._configurationService = configurationService;
            this._notebookKernelService = notebookKernelService;
            this._languageService = languageService;
            this._keybindingService = keybindingService;
            this._menuService = menuService;
            this._contextMenuService = contextMenuService;
            this._editorGroupService = editorGroupService;
            this._notebookExecutionStateService = notebookExecutionStateService;
            this._extensionService = extensionService;
            this._editorOptions = this._computeEditorOptions();
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor') || e.affectsConfiguration('notebook')) {
                    this._editorOptions = this._computeEditorOptions();
                }
            }));
            this._notebookOptions = new notebookOptions_1.NotebookOptions(this.window, configurationService, notebookExecutionStateService, codeEditorService, true, { cellToolbarInteraction: 'hover', globalToolbar: true, stickyScrollEnabled: false, dragAndDropEnabled: false });
            this._editorMemento = this.getEditorMemento(editorGroupService, textResourceConfigurationService, INTERACTIVE_EDITOR_VIEW_STATE_PREFERENCE_KEY);
            codeEditorService.registerDecorationType('interactive-decoration', DECORATION_KEY, {});
            this._register(this._keybindingService.onDidUpdateKeybindings(this._updateInputDecoration, this));
            this._register(this._notebookExecutionStateService.onDidChangeExecution((e) => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && (0, resources_1.isEqual)(e.notebook, this._notebookWidget.value?.viewModel?.notebookDocument.uri)) {
                    const cell = this._notebookWidget.value?.getCellByHandle(e.cellHandle);
                    if (cell && e.changed?.state) {
                        this._scrollIfNecessary(cell);
                    }
                }
            }));
        }
        get inputCellContainerHeight() {
            return 19 + 2 + INPUT_CELL_VERTICAL_PADDING * 2 + INPUT_EDITOR_PADDING * 2;
        }
        get inputCellEditorHeight() {
            return 19 + INPUT_EDITOR_PADDING * 2;
        }
        createEditor(parent) {
            this._rootElement = DOM.append(parent, DOM.$('.interactive-editor'));
            this._rootElement.style.position = 'relative';
            this._notebookEditorContainer = DOM.append(this._rootElement, DOM.$('.notebook-editor-container'));
            this._inputCellContainer = DOM.append(this._rootElement, DOM.$('.input-cell-container'));
            this._inputCellContainer.style.position = 'absolute';
            this._inputCellContainer.style.height = `${this.inputCellContainerHeight}px`;
            this._inputFocusIndicator = DOM.append(this._inputCellContainer, DOM.$('.input-focus-indicator'));
            this._inputRunButtonContainer = DOM.append(this._inputCellContainer, DOM.$('.run-button-container'));
            this._setupRunButtonToolbar(this._inputRunButtonContainer);
            this._inputEditorContainer = DOM.append(this._inputCellContainer, DOM.$('.input-editor-container'));
            this._createLayoutStyles();
        }
        _setupRunButtonToolbar(runButtonContainer) {
            const menu = this._register(this._menuService.createMenu(actions_1.MenuId.InteractiveInputExecute, this._contextKeyService));
            this._runbuttonToolbar = this._register(new toolbar_1.ToolBar(runButtonContainer, this._contextMenuService, {
                getKeyBinding: action => this._keybindingService.lookupKeybinding(action.id),
                actionViewItemProvider: (action, options) => {
                    return (0, menuEntryActionViewItem_1.createActionViewItem)(this._instantiationService, action, options);
                },
                renderDropdownAsChildElement: true
            }));
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result);
            this._runbuttonToolbar.setActions([...primary, ...secondary]);
        }
        _createLayoutStyles() {
            this._styleElement = DOM.createStyleSheet(this._rootElement);
            const styleSheets = [];
            const { codeCellLeftMargin, cellRunGutter } = this._notebookOptions.getLayoutConfiguration();
            const { focusIndicator } = this._notebookOptions.getDisplayOptions();
            const leftMargin = this._notebookOptions.getCellEditorContainerLeftMargin();
            styleSheets.push(`
			.interactive-editor .input-cell-container {
				padding: ${INPUT_CELL_VERTICAL_PADDING}px ${INPUT_CELL_HORIZONTAL_PADDING_RIGHT}px ${INPUT_CELL_VERTICAL_PADDING}px ${leftMargin}px;
			}
		`);
            if (focusIndicator === 'gutter') {
                styleSheets.push(`
				.interactive-editor .input-cell-container:focus-within .input-focus-indicator::before {
					border-color: var(--vscode-notebook-focusedCellBorder) !important;
				}
				.interactive-editor .input-focus-indicator::before {
					border-color: var(--vscode-notebook-inactiveFocusedCellBorder) !important;
				}
				.interactive-editor .input-cell-container .input-focus-indicator {
					display: block;
					top: ${INPUT_CELL_VERTICAL_PADDING}px;
				}
				.interactive-editor .input-cell-container {
					border-top: 1px solid var(--vscode-notebook-inactiveFocusedCellBorder);
				}
			`);
            }
            else {
                // border
                styleSheets.push(`
				.interactive-editor .input-cell-container {
					border-top: 1px solid var(--vscode-notebook-inactiveFocusedCellBorder);
				}
				.interactive-editor .input-cell-container .input-focus-indicator {
					display: none;
				}
			`);
            }
            styleSheets.push(`
			.interactive-editor .input-cell-container .run-button-container {
				width: ${cellRunGutter}px;
				left: ${codeCellLeftMargin}px;
				margin-top: ${INPUT_EDITOR_PADDING - 2}px;
			}
		`);
            this._styleElement.textContent = styleSheets.join('\n');
        }
        _computeEditorOptions() {
            let overrideIdentifier = undefined;
            if (this._codeEditorWidget) {
                overrideIdentifier = this._codeEditorWidget.getModel()?.getLanguageId();
            }
            const editorOptions = (0, objects_1.deepClone)(this._configurationService.getValue('editor', { overrideIdentifier }));
            const editorOptionsOverride = (0, simpleEditorOptions_1.getSimpleEditorOptions)(this._configurationService);
            const computed = Object.freeze({
                ...editorOptions,
                ...editorOptionsOverride,
                ...{
                    glyphMargin: true,
                    padding: {
                        top: INPUT_EDITOR_PADDING,
                        bottom: INPUT_EDITOR_PADDING
                    },
                    hover: {
                        enabled: true
                    }
                }
            });
            return computed;
        }
        saveState() {
            this._saveEditorViewState(this.input);
            super.saveState();
        }
        getViewState() {
            const input = this.input;
            if (!(input instanceof interactiveEditorInput_1.InteractiveEditorInput)) {
                return undefined;
            }
            this._saveEditorViewState(input);
            return this._loadNotebookEditorViewState(input);
        }
        _saveEditorViewState(input) {
            if (this._notebookWidget.value && input instanceof interactiveEditorInput_1.InteractiveEditorInput) {
                if (this._notebookWidget.value.isDisposed) {
                    return;
                }
                const state = this._notebookWidget.value.getEditorViewState();
                const editorState = this._codeEditorWidget.saveViewState();
                this._editorMemento.saveEditorState(this.group, input.notebookEditorInput.resource, {
                    notebook: state,
                    input: editorState
                });
            }
        }
        _loadNotebookEditorViewState(input) {
            const result = this._editorMemento.loadEditorState(this.group, input.notebookEditorInput.resource);
            if (result) {
                return result;
            }
            // when we don't have a view state for the group/input-tuple then we try to use an existing
            // editor for the same resource.
            for (const group of this._editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                if (group.activeEditorPane !== this && group.activeEditorPane === this && group.activeEditor?.matches(input)) {
                    const notebook = this._notebookWidget.value?.getEditorViewState();
                    const input = this._codeEditorWidget.saveViewState();
                    return {
                        notebook,
                        input
                    };
                }
            }
            return;
        }
        async setInput(input, options, context, token) {
            const notebookInput = input.notebookEditorInput;
            // there currently is a widget which we still own so
            // we need to hide it before getting a new widget
            this._notebookWidget.value?.onWillHide();
            this._codeEditorWidget?.dispose();
            this._widgetDisposableStore.clear();
            this._notebookWidget = this._instantiationService.invokeFunction(this._notebookWidgetService.retrieveWidget, this.group, notebookInput, {
                isEmbedded: true,
                isReadOnly: true,
                contributions: notebookEditorExtensions_1.NotebookEditorExtensionsRegistry.getSomeEditorContributions([
                    executionStatusBarItemController_1.ExecutionStateCellStatusBarContrib.id,
                    executionStatusBarItemController_1.TimerCellStatusBarContrib.id,
                    notebookFindWidget_1.NotebookFindContrib.id
                ]),
                menuIds: {
                    notebookToolbar: actions_1.MenuId.InteractiveToolbar,
                    cellTitleToolbar: actions_1.MenuId.InteractiveCellTitle,
                    cellDeleteToolbar: actions_1.MenuId.InteractiveCellDelete,
                    cellInsertToolbar: actions_1.MenuId.NotebookCellBetween,
                    cellTopInsertToolbar: actions_1.MenuId.NotebookCellListTop,
                    cellExecuteToolbar: actions_1.MenuId.InteractiveCellExecute,
                    cellExecutePrimary: undefined
                },
                cellEditorContributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    selectionClipboard_1.SelectionClipboardContributionID,
                    contextmenu_1.ContextMenuController.ID,
                    hoverController_1.HoverController.ID,
                    gotoError_1.MarkerController.ID
                ]),
                options: this._notebookOptions,
                codeWindow: this.window
            }, undefined, this.window);
            this._codeEditorWidget = this._instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._inputEditorContainer, this._editorOptions, {
                ...{
                    isSimpleWidget: false,
                    contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                        menuPreventer_1.MenuPreventer.ID,
                        selectionClipboard_1.SelectionClipboardContributionID,
                        contextmenu_1.ContextMenuController.ID,
                        suggestController_1.SuggestController.ID,
                        parameterHints_1.ParameterHintsController.ID,
                        snippetController2_1.SnippetController2.ID,
                        tabCompletion_1.TabCompletionController.ID,
                        hoverController_1.HoverController.ID,
                        gotoError_1.MarkerController.ID
                    ])
                }
            });
            if (this._lastLayoutDimensions) {
                this._notebookEditorContainer.style.height = `${this._lastLayoutDimensions.dimension.height - this.inputCellContainerHeight}px`;
                this._notebookWidget.value.layout(new DOM.Dimension(this._lastLayoutDimensions.dimension.width, this._lastLayoutDimensions.dimension.height - this.inputCellContainerHeight), this._notebookEditorContainer);
                const leftMargin = this._notebookOptions.getCellEditorContainerLeftMargin();
                const maxHeight = Math.min(this._lastLayoutDimensions.dimension.height / 2, this.inputCellEditorHeight);
                this._codeEditorWidget.layout(this._validateDimension(this._lastLayoutDimensions.dimension.width - leftMargin - INPUT_CELL_HORIZONTAL_PADDING_RIGHT, maxHeight));
                this._inputFocusIndicator.style.height = `${this.inputCellEditorHeight}px`;
                this._inputCellContainer.style.top = `${this._lastLayoutDimensions.dimension.height - this.inputCellContainerHeight}px`;
                this._inputCellContainer.style.width = `${this._lastLayoutDimensions.dimension.width}px`;
            }
            await super.setInput(input, options, context, token);
            const model = await input.resolve();
            if (this._runbuttonToolbar) {
                this._runbuttonToolbar.context = input.resource;
            }
            if (model === null) {
                throw new Error('The Interactive Window model could not be resolved');
            }
            this._notebookWidget.value?.setParentContextKeyService(this._contextKeyService);
            const viewState = options?.viewState ?? this._loadNotebookEditorViewState(input);
            await this._extensionService.whenInstalledExtensionsRegistered();
            await this._notebookWidget.value.setModel(model.notebook, viewState?.notebook);
            model.notebook.setCellCollapseDefault(this._notebookOptions.getCellCollapseDefault());
            this._notebookWidget.value.setOptions({
                isReadOnly: true
            });
            this._widgetDisposableStore.add(this._notebookWidget.value.onDidResizeOutput((cvm) => {
                this._scrollIfNecessary(cvm);
            }));
            this._widgetDisposableStore.add(this._notebookWidget.value.onDidFocusWidget(() => this._onDidFocusWidget.fire()));
            this._widgetDisposableStore.add(this._notebookOptions.onDidChangeOptions(e => {
                if (e.compactView || e.focusIndicator) {
                    // update the styling
                    this._styleElement?.remove();
                    this._createLayoutStyles();
                }
                if (this._lastLayoutDimensions && this.isVisible()) {
                    this.layout(this._lastLayoutDimensions.dimension, this._lastLayoutDimensions.position);
                }
                if (e.interactiveWindowCollapseCodeCells) {
                    model.notebook.setCellCollapseDefault(this._notebookOptions.getCellCollapseDefault());
                }
            }));
            const languageId = this._notebookWidget.value?.activeKernel?.supportedLanguages[0] ?? input.language ?? modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
            const editorModel = await input.resolveInput(languageId);
            editorModel.setLanguage(languageId);
            this._codeEditorWidget.setModel(editorModel);
            if (viewState?.input) {
                this._codeEditorWidget.restoreViewState(viewState.input);
            }
            this._editorOptions = this._computeEditorOptions();
            this._codeEditorWidget.updateOptions(this._editorOptions);
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidFocusEditorWidget(() => this._onDidFocusWidget.fire()));
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidContentSizeChange(e => {
                if (!e.contentHeightChanged) {
                    return;
                }
                if (this._lastLayoutDimensions) {
                    this._layoutWidgets(this._lastLayoutDimensions.dimension, this._lastLayoutDimensions.position);
                }
            }));
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidChangeCursorPosition(e => this._onDidChangeSelection.fire({ reason: this._toEditorPaneSelectionChangeReason(e) })));
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidChangeModelContent(() => this._onDidChangeSelection.fire({ reason: 3 /* EditorPaneSelectionChangeReason.EDIT */ })));
            this._widgetDisposableStore.add(this._notebookKernelService.onDidChangeNotebookAffinity(this._syncWithKernel, this));
            this._widgetDisposableStore.add(this._notebookKernelService.onDidChangeSelectedNotebooks(this._syncWithKernel, this));
            this._widgetDisposableStore.add(this.themeService.onDidColorThemeChange(() => {
                if (this.isVisible()) {
                    this._updateInputDecoration();
                }
            }));
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidChangeModelContent(() => {
                if (this.isVisible()) {
                    this._updateInputDecoration();
                }
            }));
            const cursorAtBoundaryContext = interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.bindTo(this._contextKeyService);
            if (input.resource && input.historyService.has(input.resource)) {
                cursorAtBoundaryContext.set('top');
            }
            else {
                cursorAtBoundaryContext.set('none');
            }
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidChangeCursorPosition(({ position }) => {
                const viewModel = this._codeEditorWidget._getViewModel();
                const lastLineNumber = viewModel.getLineCount();
                const lastLineCol = viewModel.getLineLength(lastLineNumber) + 1;
                const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(position);
                const firstLine = viewPosition.lineNumber === 1 && viewPosition.column === 1;
                const lastLine = viewPosition.lineNumber === lastLineNumber && viewPosition.column === lastLineCol;
                if (firstLine) {
                    if (lastLine) {
                        cursorAtBoundaryContext.set('both');
                    }
                    else {
                        cursorAtBoundaryContext.set('top');
                    }
                }
                else {
                    if (lastLine) {
                        cursorAtBoundaryContext.set('bottom');
                    }
                    else {
                        cursorAtBoundaryContext.set('none');
                    }
                }
            }));
            this._widgetDisposableStore.add(editorModel.onDidChangeContent(() => {
                const value = editorModel.getValue();
                if (this.input?.resource && value !== '') {
                    this.input.historyService.replaceLast(this.input.resource, value);
                }
            }));
            this._widgetDisposableStore.add(this._notebookWidget.value.onDidScroll(() => this._onDidChangeScroll.fire()));
            this._syncWithKernel();
        }
        setOptions(options) {
            this._notebookWidget.value?.setOptions(options);
            super.setOptions(options);
        }
        _toEditorPaneSelectionChangeReason(e) {
            switch (e.source) {
                case "api" /* TextEditorSelectionSource.PROGRAMMATIC */: return 1 /* EditorPaneSelectionChangeReason.PROGRAMMATIC */;
                case "code.navigation" /* TextEditorSelectionSource.NAVIGATION */: return 4 /* EditorPaneSelectionChangeReason.NAVIGATION */;
                case "code.jump" /* TextEditorSelectionSource.JUMP */: return 5 /* EditorPaneSelectionChangeReason.JUMP */;
                default: return 2 /* EditorPaneSelectionChangeReason.USER */;
            }
        }
        _cellAtBottom(cell) {
            const visibleRanges = this._notebookWidget.value?.visibleRanges || [];
            const cellIndex = this._notebookWidget.value?.getCellIndex(cell);
            if (cellIndex === Math.max(...visibleRanges.map(range => range.end - 1))) {
                return true;
            }
            return false;
        }
        _scrollIfNecessary(cvm) {
            const index = this._notebookWidget.value.getCellIndex(cvm);
            if (index === this._notebookWidget.value.getLength() - 1) {
                // If we're already at the bottom or auto scroll is enabled, scroll to the bottom
                if (this._configurationService.getValue(interactiveCommon_1.InteractiveWindowSetting.interactiveWindowAlwaysScrollOnNewCell) || this._cellAtBottom(cvm)) {
                    this._notebookWidget.value.scrollToBottom();
                }
            }
        }
        _syncWithKernel() {
            const notebook = this._notebookWidget.value?.textModel;
            const textModel = this._codeEditorWidget.getModel();
            if (notebook && textModel) {
                const info = this._notebookKernelService.getMatchingKernel(notebook);
                const selectedOrSuggested = info.selected
                    ?? (info.suggestions.length === 1 ? info.suggestions[0] : undefined)
                    ?? (info.all.length === 1 ? info.all[0] : undefined);
                if (selectedOrSuggested) {
                    const language = selectedOrSuggested.supportedLanguages[0];
                    // All kernels will initially list plaintext as the supported language before they properly initialized.
                    if (language && language !== 'plaintext') {
                        const newMode = this._languageService.createById(language).languageId;
                        textModel.setLanguage(newMode);
                    }
                    notebookContextKeys_1.NOTEBOOK_KERNEL.bindTo(this._contextKeyService).set(selectedOrSuggested.id);
                }
            }
            this._updateInputDecoration();
        }
        layout(dimension, position) {
            this._rootElement.classList.toggle('mid-width', dimension.width < 1000 && dimension.width >= 600);
            this._rootElement.classList.toggle('narrow-width', dimension.width < 600);
            const editorHeightChanged = dimension.height !== this._lastLayoutDimensions?.dimension.height;
            this._lastLayoutDimensions = { dimension, position };
            if (!this._notebookWidget.value) {
                return;
            }
            if (editorHeightChanged && this._codeEditorWidget) {
                suggestController_1.SuggestController.get(this._codeEditorWidget)?.cancelSuggestWidget();
            }
            this._notebookEditorContainer.style.height = `${this._lastLayoutDimensions.dimension.height - this.inputCellContainerHeight}px`;
            this._layoutWidgets(dimension, position);
        }
        _layoutWidgets(dimension, position) {
            const contentHeight = this._codeEditorWidget.hasModel() ? this._codeEditorWidget.getContentHeight() : this.inputCellEditorHeight;
            const maxHeight = Math.min(dimension.height / 2, contentHeight);
            const leftMargin = this._notebookOptions.getCellEditorContainerLeftMargin();
            const inputCellContainerHeight = maxHeight + INPUT_CELL_VERTICAL_PADDING * 2;
            this._notebookEditorContainer.style.height = `${dimension.height - inputCellContainerHeight}px`;
            this._notebookWidget.value.layout(dimension.with(dimension.width, dimension.height - inputCellContainerHeight), this._notebookEditorContainer, position);
            this._codeEditorWidget.layout(this._validateDimension(dimension.width - leftMargin - INPUT_CELL_HORIZONTAL_PADDING_RIGHT, maxHeight));
            this._inputFocusIndicator.style.height = `${contentHeight}px`;
            this._inputCellContainer.style.top = `${dimension.height - inputCellContainerHeight}px`;
            this._inputCellContainer.style.width = `${dimension.width}px`;
        }
        _validateDimension(width, height) {
            return new DOM.Dimension(Math.max(0, width), Math.max(0, height));
        }
        _updateInputDecoration() {
            if (!this._codeEditorWidget) {
                return;
            }
            if (!this._codeEditorWidget.hasModel()) {
                return;
            }
            const model = this._codeEditorWidget.getModel();
            const decorations = [];
            if (model?.getValueLength() === 0) {
                const transparentForeground = (0, colorRegistry_1.resolveColorValue)(colorRegistry_1.editorForeground, this.themeService.getColorTheme())?.transparent(0.4);
                const languageId = model.getLanguageId();
                const keybinding = this._keybindingService.lookupKeybinding('interactive.execute', this._contextKeyService)?.getLabel();
                const text = nls.localize('interactiveInputPlaceHolder', "Type '{0}' code here and press {1} to run", languageId, keybinding ?? 'ctrl+enter');
                decorations.push({
                    range: {
                        startLineNumber: 0,
                        endLineNumber: 0,
                        startColumn: 0,
                        endColumn: 1
                    },
                    renderOptions: {
                        after: {
                            contentText: text,
                            color: transparentForeground ? transparentForeground.toString() : undefined
                        }
                    }
                });
            }
            this._codeEditorWidget.setDecorationsByType('interactive-decoration', DECORATION_KEY, decorations);
        }
        getScrollPosition() {
            return {
                scrollTop: this._notebookWidget.value?.scrollTop ?? 0,
                scrollLeft: 0
            };
        }
        setScrollPosition(position) {
            this._notebookWidget.value?.setScrollTop(position.scrollTop);
        }
        focus() {
            super.focus();
            this._notebookWidget.value?.onShow();
            this._codeEditorWidget.focus();
        }
        focusHistory() {
            this._notebookWidget.value.focus();
        }
        setEditorVisible(visible) {
            super.setEditorVisible(visible);
            this._groupListener.value = this.group.onWillCloseEditor(e => this._saveEditorViewState(e.editor));
            if (!visible) {
                this._saveEditorViewState(this.input);
                if (this.input && this._notebookWidget.value) {
                    this._notebookWidget.value.onWillHide();
                }
            }
        }
        clearInput() {
            if (this._notebookWidget.value) {
                this._saveEditorViewState(this.input);
                this._notebookWidget.value.onWillHide();
            }
            this._codeEditorWidget?.dispose();
            this._notebookWidget = { value: undefined };
            this._widgetDisposableStore.clear();
            super.clearInput();
        }
        getControl() {
            return {
                notebookEditor: this._notebookWidget.value,
                codeEditor: this._codeEditorWidget
            };
        }
    };
    exports.InteractiveEditor = InteractiveEditor;
    exports.InteractiveEditor = InteractiveEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, notebookEditorService_1.INotebookEditorService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, codeEditorService_1.ICodeEditorService),
        __param(8, notebookKernelService_1.INotebookKernelService),
        __param(9, language_1.ILanguageService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, actions_1.IMenuService),
        __param(13, contextView_1.IContextMenuService),
        __param(14, editorGroupsService_1.IEditorGroupsService),
        __param(15, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(16, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(17, extensions_1.IExtensionService)
    ], InteractiveEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RpdmVFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbnRlcmFjdGl2ZS9icm93c2VyL2ludGVyYWN0aXZlRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQStEaEcsTUFBTSxjQUFjLEdBQUcsNEJBQTRCLENBQUM7SUFDcEQsTUFBTSw0Q0FBNEMsR0FBRyw0QkFBNEIsQ0FBQztJQUVsRixNQUFNLDJCQUEyQixHQUFHLENBQUMsQ0FBQztJQUN0QyxNQUFNLG1DQUFtQyxHQUFHLEVBQUUsQ0FBQztJQUMvQyxNQUFNLG9CQUFvQixHQUFHLENBQUMsQ0FBQztJQVd4QixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHVCQUFVO1FBK0JoRCxJQUFhLFVBQVUsS0FBa0IsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQU0vRSxZQUNDLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ3pCLGNBQStCLEVBQ3pCLG9CQUEyQyxFQUMxQyxxQkFBNkMsRUFDakQsaUJBQXFDLEVBQ3JDLGlCQUFxQyxFQUNqQyxxQkFBNkMsRUFDbkQsZUFBaUMsRUFDL0IsaUJBQXFDLEVBQ2xDLG9CQUEyQyxFQUNwRCxXQUF5QixFQUNsQixrQkFBdUMsRUFDdEMsa0JBQXdDLEVBQzNCLGdDQUFtRSxFQUN0RSw2QkFBNkQsRUFDMUUsZ0JBQW1DO1lBRXRELEtBQUssQ0FDSiw2Q0FBNEIsRUFDNUIsS0FBSyxFQUNMLGdCQUFnQixFQUNoQixZQUFZLEVBQ1osY0FBYyxDQUNkLENBQUM7WUEzREssb0JBQWUsR0FBdUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7WUFrQmxFLDJCQUFz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