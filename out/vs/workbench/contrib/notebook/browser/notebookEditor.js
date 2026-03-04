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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uuid", "vs/editor/common/services/textResourceConfiguration", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/browser/viewParts/notebookKernelView", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookPerformance", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/progress/common/progress", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/workbench/contrib/notebook/common/services/notebookWorkerService", "vs/workbench/services/preferences/common/preferences", "vs/base/common/stopwatch"], function (require, exports, DOM, actions_1, async_1, event_1, lifecycle_1, resources_1, uuid_1, textResourceConfiguration_1, nls_1, contextkey_1, files_1, instantiation_1, storage_1, telemetry_1, themeService_1, editorPane_1, editor_1, coreActions_1, notebookEditorService_1, notebookKernelView_1, notebookCommon_1, notebookEditorInput_1, notebookPerformance_1, editorGroupsService_1, editorService_1, progress_1, extensionsActions_1, notebookService_1, extensions_1, workingCopyBackup_1, buffer_1, log_1, notebookWorkerService_1, preferences_1, stopwatch_1) {
    "use strict";
    var NotebookEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditor = void 0;
    const NOTEBOOK_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'NotebookEditorViewState';
    let NotebookEditor = class NotebookEditor extends editorPane_1.EditorPane {
        static { NotebookEditor_1 = this; }
        static { this.ID = notebookCommon_1.NOTEBOOK_EDITOR_ID; }
        get onDidFocus() { return this._onDidFocusWidget.event; }
        get onDidBlur() { return this._onDidBlurWidget.event; }
        constructor(group, telemetryService, themeService, _instantiationService, storageService, _editorService, _editorGroupService, _notebookWidgetService, _contextKeyService, _fileService, configurationService, _editorProgressService, _notebookService, _extensionsWorkbenchService, _workingCopyBackupService, logService, _notebookEditorWorkerService, _preferencesService) {
            super(NotebookEditor_1.ID, group, telemetryService, themeService, storageService);
            this._instantiationService = _instantiationService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._notebookWidgetService = _notebookWidgetService;
            this._contextKeyService = _contextKeyService;
            this._fileService = _fileService;
            this._editorProgressService = _editorProgressService;
            this._notebookService = _notebookService;
            this._extensionsWorkbenchService = _extensionsWorkbenchService;
            this._workingCopyBackupService = _workingCopyBackupService;
            this.logService = logService;
            this._notebookEditorWorkerService = _notebookEditorWorkerService;
            this._preferencesService = _preferencesService;
            this._groupListener = this._register(new lifecycle_1.DisposableStore());
            this._widgetDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._widget = { value: undefined };
            this._inputListener = this._register(new lifecycle_1.MutableDisposable());
            // override onDidFocus and onDidBlur to be based on the NotebookEditorWidget element
            this._onDidFocusWidget = this._register(new event_1.Emitter());
            this._onDidBlurWidget = this._register(new event_1.Emitter());
            this._onDidChangeModel = this._register(new event_1.Emitter());
            this.onDidChangeModel = this._onDidChangeModel.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeScroll = this._register(new event_1.Emitter());
            this.onDidChangeScroll = this._onDidChangeScroll.event;
            this._editorMemento = this.getEditorMemento(_editorGroupService, configurationService, NOTEBOOK_EDITOR_VIEW_STATE_PREFERENCE_KEY);
            this._register(this._fileService.onDidChangeFileSystemProviderCapabilities(e => this._onDidChangeFileSystemProvider(e.scheme)));
            this._register(this._fileService.onDidChangeFileSystemProviderRegistrations(e => this._onDidChangeFileSystemProvider(e.scheme)));
        }
        _onDidChangeFileSystemProvider(scheme) {
            if (this.input instanceof notebookEditorInput_1.NotebookEditorInput && this.input.resource?.scheme === scheme) {
                this._updateReadonly(this.input);
            }
        }
        _onDidChangeInputCapabilities(input) {
            if (this.input === input) {
                this._updateReadonly(input);
            }
        }
        _updateReadonly(input) {
            this._widget.value?.setOptions({ isReadOnly: !!input.isReadonly() });
        }
        get textModel() {
            return this._widget.value?.textModel;
        }
        get minimumWidth() { return 220; }
        get maximumWidth() { return Number.POSITIVE_INFINITY; }
        // these setters need to exist because this extends from EditorPane
        set minimumWidth(value) { }
        set maximumWidth(value) { }
        //#region Editor Core
        get scopedContextKeyService() {
            return this._widget.value?.scopedContextKeyService;
        }
        createEditor(parent) {
            this._rootElement = DOM.append(parent, DOM.$('.notebook-editor'));
            this._rootElement.id = `notebook-editor-element-${(0, uuid_1.generateUuid)()}`;
        }
        getActionViewItem(action, options) {
            if (action.id === coreActions_1.SELECT_KERNEL_ID) {
                // this is being disposed by the consumer
                return this._instantiationService.createInstance(notebookKernelView_1.NotebooKernelActionViewItem, action, this, options);
            }
            return undefined;
        }
        getControl() {
            return this._widget.value;
        }
        setVisible(visible) {
            super.setVisible(visible);
            if (!visible) {
                this._widget.value?.onWillHide();
            }
        }
        setEditorVisible(visible) {
            super.setEditorVisible(visible);
            this._groupListener.clear();
            this._groupListener.add(this.group.onWillCloseEditor(e => this._saveEditorViewState(e.editor)));
            this._groupListener.add(this.group.onDidModelChange(() => {
                if (this._editorGroupService.activeGroup !== this.group) {
                    this._widget?.value?.updateEditorFocus();
                }
            }));
            if (!visible) {
                this._saveEditorViewState(this.input);
                if (this.input && this._widget.value) {
                    // the widget is not transfered to other editor inputs
                    this._widget.value.onWillHide();
                }
            }
        }
        focus() {
            super.focus();
            this._widget.value?.focus();
        }
        hasFocus() {
            const value = this._widget.value;
            if (!value) {
                return false;
            }
            return !!value && (DOM.isAncestorOfActiveElement(value.getDomNode() || DOM.isAncestorOfActiveElement(value.getOverflowContainerDomNode())));
        }
        async setInput(input, options, context, token, noRetry) {
            try {
                let perfMarksCaptured = false;
                const fileOpenMonitor = (0, async_1.timeout)(10000);
                fileOpenMonitor.then(() => {
                    perfMarksCaptured = true;
                    this._handlePerfMark(perf, input);
                });
                const perf = new notebookPerformance_1.NotebookPerfMarks();
                perf.mark('startTime');
                this._inputListener.value = input.onDidChangeCapabilities(() => this._onDidChangeInputCapabilities(input));
                this._widgetDisposableStore.clear();
                // there currently is a widget which we still own so
                // we need to hide it before getting a new widget
                this._widget.value?.onWillHide();
                this._widget = this._instantiationService.invokeFunction(this._notebookWidgetService.retrieveWidget, this.group, input, undefined, this._pagePosition?.dimension, this.window);
                if (this._rootElement && this._widget.value.getDomNode()) {
                    this._rootElement.setAttribute('aria-flowto', this._widget.value.getDomNode().id || '');
                    DOM.setParentFlowTo(this._widget.value.getDomNode(), this._rootElement);
                }
                this._widgetDisposableStore.add(this._widget.value.onDidChangeModel(() => this._onDidChangeModel.fire()));
                this._widgetDisposableStore.add(this._widget.value.onDidChangeActiveCell(() => this._onDidChangeSelection.fire({ reason: 2 /* EditorPaneSelectionChangeReason.USER */ })));
                if (this._pagePosition) {
                    this._widget.value.layout(this._pagePosition.dimension, this._rootElement, this._pagePosition.position);
                }
                // only now `setInput` and yield/await. this is AFTER the actual widget is ready. This is very important
                // so that others synchronously receive a notebook editor with the correct widget being set
                await super.setInput(input, options, context, token);
                const model = await input.resolve(options, perf);
                perf.mark('inputLoaded');
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // The widget has been taken away again. This can happen when the tab has been closed while
                // loading was in progress, in particular when open the same resource as different view type.
                // When this happen, retry once
                if (!this._widget.value) {
                    if (noRetry) {
                        return undefined;
                    }
                    return this.setInput(input, options, context, token, true);
                }
                if (model === null) {
                    const knownProvider = this._notebookService.getViewTypeProvider(input.viewType);
                    if (!knownProvider) {
                        throw new Error((0, nls_1.localize)('fail.noEditor', "Cannot open resource with notebook editor type '{0}', please check if you have the right extension installed and enabled.", input.viewType));
                    }
                    await this._extensionsWorkbenchService.whenInitialized;
                    const extensionInfo = this._extensionsWorkbenchService.local.find(e => e.identifier.id === knownProvider);
                    throw (0, editor_1.createEditorOpenError)(new Error((0, nls_1.localize)('fail.noEditor.extensionMissing', "Cannot open resource with notebook editor type '{0}', please check if you have the right extension installed and enabled.", input.viewType)), [
                        (0, actions_1.toAction)({
                            id: 'workbench.notebook.action.installOrEnableMissing', label: extensionInfo
                                ? (0, nls_1.localize)('notebookOpenEnableMissingViewType', "Enable extension for '{0}'", input.viewType)
                                : (0, nls_1.localize)('notebookOpenInstallMissingViewType', "Install extension for '{0}'", input.viewType),
                            run: async () => {
                                const d = this._notebookService.onAddViewType(viewType => {
                                    if (viewType === input.viewType) {
                                        // serializer is registered, try to open again
                                        this._editorService.openEditor({ resource: input.resource });
                                        d.dispose();
                                    }
                                });
                                const extensionInfo = this._extensionsWorkbenchService.local.find(e => e.identifier.id === knownProvider);
                                try {
                                    if (extensionInfo) {
                                        await this._extensionsWorkbenchService.setEnablement(extensionInfo, extensionInfo.enablementState === 7 /* EnablementState.DisabledWorkspace */ ? 9 /* EnablementState.EnabledWorkspace */ : 8 /* EnablementState.EnabledGlobally */);
                                    }
                                    else {
                                        await this._instantiationService.createInstance(extensionsActions_1.InstallRecommendedExtensionAction, knownProvider).run();
                                    }
                                }
                                catch (ex) {
                                    this.logService.error(`Failed to install or enable extension ${knownProvider}`, ex);
                                    d.dispose();
                                }
                            }
                        }),
                        (0, actions_1.toAction)({
                            id: 'workbench.notebook.action.openAsText', label: (0, nls_1.localize)('notebookOpenAsText', "Open As Text"), run: async () => {
                                const backup = await this._workingCopyBackupService.resolve({ resource: input.resource, typeId: notebookCommon_1.NotebookWorkingCopyTypeIdentifier.create(input.viewType) });
                                if (backup) {
                                    // with a backup present, we must resort to opening the backup contents
                                    // as untitled text file to not show the wrong data to the user
                                    const contents = await (0, buffer_1.streamToBuffer)(backup.value);
                                    this._editorService.openEditor({ resource: undefined, contents: contents.toString() });
                                }
                                else {
                                    // without a backup present, we can open the original resource
                                    this._editorService.openEditor({ resource: input.resource, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id, pinned: true } });
                                }
                            }
                        })
                    ], { allowDialog: true });
                }
                this._widgetDisposableStore.add(model.notebook.onDidChangeContent(() => this._onDidChangeSelection.fire({ reason: 3 /* EditorPaneSelectionChangeReason.EDIT */ })));
                const viewState = options?.viewState ?? this._loadNotebookEditorViewState(input);
                // We might be moving the notebook widget between groups, and these services are tied to the group
                this._widget.value.setParentContextKeyService(this._contextKeyService);
                this._widget.value.setEditorProgressService(this._editorProgressService);
                await this._widget.value.setModel(model.notebook, viewState, perf);
                const isReadOnly = !!input.isReadonly();
                await this._widget.value.setOptions({ ...options, isReadOnly });
                this._widgetDisposableStore.add(this._widget.value.onDidFocusWidget(() => this._onDidFocusWidget.fire()));
                this._widgetDisposableStore.add(this._widget.value.onDidBlurWidget(() => this._onDidBlurWidget.fire()));
                this._widgetDisposableStore.add(this._editorGroupService.createEditorDropTarget(this._widget.value.getDomNode(), {
                    containsGroup: (group) => this.group.id === group.id
                }));
                this._widgetDisposableStore.add(this._widget.value.onDidScroll(() => { this._onDidChangeScroll.fire(); }));
                perf.mark('editorLoaded');
                fileOpenMonitor.cancel();
                if (perfMarksCaptured) {
                    return;
                }
                this._handlePerfMark(perf, input, model.notebook);
                this._handlePromptRecommendations(model.notebook);
            }
            catch (e) {
                this.logService.warn('NotebookEditorWidget#setInput failed', e);
                if ((0, editor_1.isEditorOpenError)(e)) {
                    throw e;
                }
                // Handle case where a file is too large to open without confirmation
                if (e.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                    let message;
                    if (e instanceof files_1.TooLargeFileOperationError) {
                        message = (0, nls_1.localize)('notebookTooLargeForHeapErrorWithSize', "The notebook is not displayed in the notebook editor because it is very large ({0}).", files_1.ByteSize.formatSize(e.size));
                    }
                    else {
                        message = (0, nls_1.localize)('notebookTooLargeForHeapErrorWithoutSize', "The notebook is not displayed in the notebook editor because it is very large.");
                    }
                    throw (0, editor_1.createTooLargeFileError)(this.group, input, options, message, this._preferencesService);
                }
                const error = (0, editor_1.createEditorOpenError)(e instanceof Error ? e : new Error((e ? e.message : '')), [
                    (0, actions_1.toAction)({
                        id: 'workbench.notebook.action.openInTextEditor', label: (0, nls_1.localize)('notebookOpenInTextEditor', "Open in Text Editor"), run: async () => {
                            const activeEditorPane = this._editorService.activeEditorPane;
                            if (!activeEditorPane) {
                                return;
                            }
                            const activeEditorResource = editor_1.EditorResourceAccessor.getCanonicalUri(activeEditorPane.input);
                            if (!activeEditorResource) {
                                return;
                            }
                            if (activeEditorResource.toString() === input.resource?.toString()) {
                                // Replace the current editor with the text editor
                                return this._editorService.openEditor({
                                    resource: activeEditorResource,
                                    options: {
                                        override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id,
                                        pinned: true // new file gets pinned by default
                                    }
                                });
                            }
                            return;
                        }
                    })
                ], { allowDialog: true });
                throw error;
            }
        }
        _handlePerfMark(perf, input, notebook) {
            const perfMarks = perf.value;
            const startTime = perfMarks['startTime'];
            const extensionActivated = perfMarks['extensionActivated'];
            const inputLoaded = perfMarks['inputLoaded'];
            const customMarkdownLoaded = perfMarks['customMarkdownLoaded'];
            const editorLoaded = perfMarks['editorLoaded'];
            let extensionActivationTimespan = -1;
            let inputLoadingTimespan = -1;
            let webviewCommLoadingTimespan = -1;
            let customMarkdownLoadingTimespan = -1;
            let editorLoadingTimespan = -1;
            if (startTime !== undefined && extensionActivated !== undefined) {
                extensionActivationTimespan = extensionActivated - startTime;
                if (inputLoaded !== undefined) {
                    inputLoadingTimespan = inputLoaded - extensionActivated;
                    webviewCommLoadingTimespan = inputLoaded - extensionActivated; // TODO@rebornix, we don't track webview comm anymore
                }
                if (customMarkdownLoaded !== undefined) {
                    customMarkdownLoadingTimespan = customMarkdownLoaded - startTime;
                }
                if (editorLoaded !== undefined) {
                    editorLoadingTimespan = editorLoaded - startTime;
                }
            }
            // Notebook information
            let codeCellCount = undefined;
            let mdCellCount = undefined;
            let outputCount = undefined;
            let outputBytes = undefined;
            let codeLength = undefined;
            let markdownLength = undefined;
            let notebookStatsLoaded = undefined;
            if (notebook) {
                const stopWatch = new stopwatch_1.StopWatch();
                for (const cell of notebook.cells) {
                    if (cell.cellKind === notebookCommon_1.CellKind.Code) {
                        codeCellCount = (codeCellCount || 0) + 1;
                        codeLength = (codeLength || 0) + cell.getTextLength();
                        outputCount = (outputCount || 0) + cell.outputs.length;
                        outputBytes = (outputBytes || 0) + cell.outputs.reduce((prev, cur) => prev + cur.outputs.reduce((size, item) => size + item.data.byteLength, 0), 0);
                    }
                    else {
                        mdCellCount = (mdCellCount || 0) + 1;
                        markdownLength = (codeLength || 0) + cell.getTextLength();
                    }
                }
                notebookStatsLoaded = stopWatch.elapsed();
            }
            this.logService.trace(`[NotebookEditor] open notebook perf ${notebook?.uri.toString() ?? ''} - extensionActivation: ${extensionActivationTimespan}, inputLoad: ${inputLoadingTimespan}, webviewComm: ${webviewCommLoadingTimespan}, customMarkdown: ${customMarkdownLoadingTimespan}, editorLoad: ${editorLoadingTimespan}`);
            this.telemetryService.publicLog2('notebook/editorOpenPerf', {
                scheme: input.resource.scheme,
                ext: (0, resources_1.extname)(input.resource),
                viewType: input.viewType,
                extensionActivated: extensionActivationTimespan,
                inputLoaded: inputLoadingTimespan,
                webviewCommLoaded: webviewCommLoadingTimespan,
                customMarkdownLoaded: customMarkdownLoadingTimespan,
                editorLoaded: editorLoadingTimespan,
                codeCellCount,
                mdCellCount,
                outputCount,
                outputBytes,
                codeLength,
                markdownLength,
                notebookStatsLoaded
            });
        }
        _handlePromptRecommendations(model) {
            this._notebookEditorWorkerService.canPromptRecommendation(model.uri).then(shouldPrompt => {
                this.telemetryService.publicLog2('notebook/shouldPromptRecommendation', {
                    shouldPrompt: shouldPrompt
                });
            });
        }
        clearInput() {
            this._inputListener.clear();
            if (this._widget.value) {
                this._saveEditorViewState(this.input);
                this._widget.value.onWillHide();
            }
            super.clearInput();
        }
        setOptions(options) {
            this._widget.value?.setOptions(options);
            super.setOptions(options);
        }
        saveState() {
            this._saveEditorViewState(this.input);
            super.saveState();
        }
        getViewState() {
            const input = this.input;
            if (!(input instanceof notebookEditorInput_1.NotebookEditorInput)) {
                return undefined;
            }
            this._saveEditorViewState(input);
            return this._loadNotebookEditorViewState(input);
        }
        getSelection() {
            if (this._widget.value) {
                const activeCell = this._widget.value.getActiveCell();
                if (activeCell) {
                    const cellUri = activeCell.uri;
                    return new NotebookEditorSelection(cellUri, activeCell.getSelections());
                }
            }
            return undefined;
        }
        getScrollPosition() {
            const widget = this.getControl();
            if (!widget) {
                throw new Error('Notebook widget has not yet been initialized');
            }
            return {
                scrollTop: widget.scrollTop,
                scrollLeft: 0,
            };
        }
        setScrollPosition(scrollPosition) {
            const editor = this.getControl();
            if (!editor) {
                throw new Error('Control has not yet been initialized');
            }
            editor.setScrollTop(scrollPosition.scrollTop);
        }
        _saveEditorViewState(input) {
            if (this._widget.value && input instanceof notebookEditorInput_1.NotebookEditorInput) {
                if (this._widget.value.isDisposed) {
                    return;
                }
                const state = this._widget.value.getEditorViewState();
                this._editorMemento.saveEditorState(this.group, input.resource, state);
            }
        }
        _loadNotebookEditorViewState(input) {
            const result = this._editorMemento.loadEditorState(this.group, input.resource);
            if (result) {
                return result;
            }
            // when we don't have a view state for the group/input-tuple then we try to use an existing
            // editor for the same resource.
            for (const group of this._editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                if (group.activeEditorPane !== this && group.activeEditorPane instanceof NotebookEditor_1 && group.activeEditor?.matches(input)) {
                    return group.activeEditorPane._widget.value?.getEditorViewState();
                }
            }
            return;
        }
        layout(dimension, position) {
            this._rootElement.classList.toggle('mid-width', dimension.width < 1000 && dimension.width >= 600);
            this._rootElement.classList.toggle('narrow-width', dimension.width < 600);
            this._pagePosition = { dimension, position };
            if (!this._widget.value || !(this.input instanceof notebookEditorInput_1.NotebookEditorInput)) {
                return;
            }
            if (this.input.resource.toString() !== this.textModel?.uri.toString() && this._widget.value?.hasModel()) {
                // input and widget mismatch
                // this happens when
                // 1. open document A, pin the document
                // 2. open document B
                // 3. close document B
                // 4. a layout is triggered
                return;
            }
            if (this.isVisible()) {
                this._widget.value.layout(dimension, this._rootElement, position);
            }
        }
    };
    exports.NotebookEditor = NotebookEditor;
    exports.NotebookEditor = NotebookEditor = NotebookEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, storage_1.IStorageService),
        __param(5, editorService_1.IEditorService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, notebookEditorService_1.INotebookEditorService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, files_1.IFileService),
        __param(10, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(11, progress_1.IEditorProgressService),
        __param(12, notebookService_1.INotebookService),
        __param(13, extensions_1.IExtensionsWorkbenchService),
        __param(14, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(15, log_1.ILogService),
        __param(16, notebookWorkerService_1.INotebookEditorWorkerService),
        __param(17, preferences_1.IPreferencesService)
    ], NotebookEditor);
    class NotebookEditorSelection {
        constructor(cellUri, selections) {
            this.cellUri = cellUri;
            this.selections = selections;
        }
        compare(other) {
            if (!(other instanceof NotebookEditorSelection)) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            if ((0, resources_1.isEqual)(this.cellUri, other.cellUri)) {
                return 1 /* EditorPaneSelectionCompareResult.IDENTICAL */;
            }
            return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
        }
        restore(options) {
            const notebookOptions = {
                cellOptions: {
                    resource: this.cellUri,
                    options: {
                        selection: this.selections[0]
                    }
                }
            };
            Object.assign(notebookOptions, options);
            return notebookOptions;
        }
        log() {
            return this.cellUri.fragment;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL25vdGVib29rRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpRGhHLE1BQU0seUNBQXlDLEdBQUcseUJBQXlCLENBQUM7SUFFckUsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHVCQUFVOztpQkFDN0IsT0FBRSxHQUFXLG1DQUFrQixBQUE3QixDQUE4QjtRQWFoRCxJQUFhLFVBQVUsS0FBa0IsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUUvRSxJQUFhLFNBQVMsS0FBa0IsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQVc3RSxZQUNDLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ25CLHFCQUE2RCxFQUNuRSxjQUErQixFQUNoQyxjQUErQyxFQUN6QyxtQkFBMEQsRUFDeEQsc0JBQStELEVBQ25FLGtCQUF1RCxFQUM3RCxZQUEyQyxFQUN0QixvQkFBdUQsRUFDbEUsc0JBQStELEVBQ3JFLGdCQUFtRCxFQUN4QywyQkFBeUUsRUFDM0UseUJBQXFFLEVBQ25GLFVBQXdDLEVBQ3ZCLDRCQUEyRSxFQUNwRixtQkFBeUQ7WUFFOUUsS0FBSyxDQUFDLGdCQUFjLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFoQnhDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFFbkQsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ3hCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7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