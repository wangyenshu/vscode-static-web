/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/mime", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/timeTravelScheduler", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageService", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/editor/common/services/resolverService", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/clipboard/common/clipboardService", "vs/platform/clipboard/test/common/testClipboardService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/layout/browser/layoutService", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/editor/editorModel", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/services/notebookCellStatusBarServiceImpl", "vs/workbench/contrib/notebook/browser/view/notebookCellList", "vs/workbench/contrib/notebook/browser/viewModel/eventDispatcher", "vs/workbench/contrib/notebook/browser/viewModel/notebookViewModelImpl", "vs/workbench/contrib/notebook/browser/viewModel/viewContext", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/browser/notebookOptions", "vs/workbench/services/textmodelResolver/common/textModelResolverService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/editor/common/config/fontInfo", "vs/editor/common/config/editorOptions", "vs/editor/browser/services/codeEditorService", "vs/base/browser/window", "vs/editor/test/browser/editorTestServices", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/inlineChat/common/inlineChatServiceImpl", "vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineProviderFactory", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService"], function (require, exports, DOM, buffer_1, errors_1, event_1, lifecycle_1, map_1, mime_1, uri_1, mock_1, timeTravelScheduler_1, language_1, languageConfigurationRegistry_1, languageService_1, model_1, modelService_1, resolverService_1, testLanguageConfigurationService_1, clipboardService_1, testClipboardService_1, configuration_1, testConfigurationService_1, contextKeyService_1, contextkey_1, instantiationServiceMock_1, keybinding_1, mockKeybindingService_1, layoutService_1, listService_1, log_1, storage_1, themeService_1, testThemeService_1, undoRedo_1, undoRedoService_1, workspaceTrust_1, editorModel_1, notebookBrowser_1, notebookCellStatusBarServiceImpl_1, notebookCellList_1, eventDispatcher_1, notebookViewModelImpl_1, viewContext_1, notebookCellTextModel_1, notebookTextModel_1, notebookCellStatusBarService_1, notebookCommon_1, notebookExecutionStateService_1, notebookOptions_1, textModelResolverService_1, workbenchTestServices_1, workbenchTestServices_2, fontInfo_1, editorOptions_1, codeEditorService_1, window_1, editorTestServices_1, inlineChat_1, inlineChatServiceImpl_1, notebookOutlineProviderFactory_1, languageDetectionWorkerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorTestModel = exports.TestCell = void 0;
    exports.setupInstantiationService = setupInstantiationService;
    exports.createTestNotebookEditor = createTestNotebookEditor;
    exports.withTestNotebookDiffModel = withTestNotebookDiffModel;
    exports.withTestNotebook = withTestNotebook;
    exports.createNotebookCellList = createNotebookCellList;
    exports.valueBytesFromString = valueBytesFromString;
    class TestCell extends notebookCellTextModel_1.NotebookCellTextModel {
        constructor(viewType, handle, source, language, cellKind, outputs, languageService) {
            super(notebookCommon_1.CellUri.generate(uri_1.URI.parse('test:///fake/notebook'), handle), handle, source, language, mime_1.Mimes.text, cellKind, outputs, undefined, undefined, undefined, { transientCellMetadata: {}, transientDocumentMetadata: {}, transientOutputs: false, cellContentMetadata: {} }, languageService);
            this.viewType = viewType;
            this.source = source;
        }
    }
    exports.TestCell = TestCell;
    class NotebookEditorTestModel extends editorModel_1.EditorModel {
        get viewType() {
            return this._notebook.viewType;
        }
        get resource() {
            return this._notebook.uri;
        }
        get notebook() {
            return this._notebook;
        }
        constructor(_notebook) {
            super();
            this._notebook = _notebook;
            this._dirty = false;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this.onDidChangeOrphaned = event_1.Event.None;
            this.onDidChangeReadonly = event_1.Event.None;
            this.onDidRevertUntitled = event_1.Event.None;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            if (_notebook && _notebook.onDidChangeContent) {
                this._register(_notebook.onDidChangeContent(() => {
                    this._dirty = true;
                    this._onDidChangeDirty.fire();
                    this._onDidChangeContent.fire();
                }));
            }
        }
        isReadonly() {
            return false;
        }
        isOrphaned() {
            return false;
        }
        hasAssociatedFilePath() {
            return false;
        }
        isDirty() {
            return this._dirty;
        }
        get hasErrorState() {
            return false;
        }
        isModified() {
            return this._dirty;
        }
        getNotebook() {
            return this._notebook;
        }
        async load() {
            return this;
        }
        async save() {
            if (this._notebook) {
                this._dirty = false;
                this._onDidChangeDirty.fire();
                this._onDidSave.fire({});
                // todo, flush all states
                return true;
            }
            return false;
        }
        saveAs() {
            throw new errors_1.NotImplementedError();
        }
        revert() {
            throw new errors_1.NotImplementedError();
        }
    }
    exports.NotebookEditorTestModel = NotebookEditorTestModel;
    function setupInstantiationService(disposables) {
        const instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService());
        const testThemeService = new testThemeService_1.TestThemeService();
        instantiationService.stub(language_1.ILanguageService, disposables.add(new languageService_1.LanguageService()));
        instantiationService.stub(undoRedo_1.IUndoRedoService, instantiationService.createInstance(undoRedoService_1.UndoRedoService));
        instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
        instantiationService.stub(themeService_1.IThemeService, testThemeService);
        instantiationService.stub(languageConfigurationRegistry_1.ILanguageConfigurationService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
        instantiationService.stub(model_1.IModelService, disposables.add(instantiationService.createInstance(modelService_1.ModelService)));
        instantiationService.stub(resolverService_1.ITextModelService, disposables.add(instantiationService.createInstance(textModelResolverService_1.TextModelResolverService)));
        instantiationService.stub(contextkey_1.IContextKeyService, disposables.add(instantiationService.createInstance(contextKeyService_1.ContextKeyService)));
        instantiationService.stub(listService_1.IListService, disposables.add(instantiationService.createInstance(listService_1.ListService)));
        instantiationService.stub(layoutService_1.ILayoutService, new workbenchTestServices_1.TestLayoutService());
        instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
        instantiationService.stub(clipboardService_1.IClipboardService, testClipboardService_1.TestClipboardService);
        instantiationService.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_2.TestStorageService()));
        instantiationService.stub(workspaceTrust_1.IWorkspaceTrustRequestService, disposables.add(new workbenchTestServices_2.TestWorkspaceTrustRequestService(true)));
        instantiationService.stub(notebookExecutionStateService_1.INotebookExecutionStateService, new TestNotebookExecutionStateService());
        instantiationService.stub(keybinding_1.IKeybindingService, new mockKeybindingService_1.MockKeybindingService());
        instantiationService.stub(notebookCellStatusBarService_1.INotebookCellStatusBarService, disposables.add(new notebookCellStatusBarServiceImpl_1.NotebookCellStatusBarService()));
        instantiationService.stub(codeEditorService_1.ICodeEditorService, disposables.add(new editorTestServices_1.TestCodeEditorService(testThemeService)));
        instantiationService.stub(inlineChat_1.IInlineChatService, instantiationService.createInstance(inlineChatServiceImpl_1.InlineChatServiceImpl));
        instantiationService.stub(notebookOutlineProviderFactory_1.INotebookCellOutlineProviderFactory, instantiationService.createInstance(notebookOutlineProviderFactory_1.NotebookCellOutlineProviderFactory));
        instantiationService.stub(languageDetectionWorkerService_1.ILanguageDetectionService, new class MockLanguageDetectionService {
            isEnabledForLanguage(languageId) {
                return false;
            }
            async detectLanguage(resource, supportedLangs) {
                return undefined;
            }
        });
        return instantiationService;
    }
    function _createTestNotebookEditor(instantiationService, disposables, cells) {
        const viewType = 'notebook';
        const notebook = disposables.add(instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, viewType, uri_1.URI.parse('test'), cells.map((cell) => {
            return {
                source: cell[0],
                mime: undefined,
                language: cell[1],
                cellKind: cell[2],
                outputs: cell[3] ?? [],
                metadata: cell[4]
            };
        }), {}, { transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {}, transientOutputs: false }));
        const model = disposables.add(new NotebookEditorTestModel(notebook));
        const notebookOptions = disposables.add(new notebookOptions_1.NotebookOptions(window_1.mainWindow, instantiationService.get(configuration_1.IConfigurationService), instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService), instantiationService.get(codeEditorService_1.ICodeEditorService), false));
        const viewContext = new viewContext_1.ViewContext(notebookOptions, disposables.add(new eventDispatcher_1.NotebookEventDispatcher()), () => ({}));
        const viewModel = disposables.add(instantiationService.createInstance(notebookViewModelImpl_1.NotebookViewModel, viewType, model.notebook, viewContext, null, { isReadOnly: false }));
        const cellList = disposables.add(createNotebookCellList(instantiationService, disposables, viewContext));
        cellList.attachViewModel(viewModel);
        const listViewInfoAccessor = disposables.add(new notebookCellList_1.ListViewInfoAccessor(cellList));
        let visibleRanges = [{ start: 0, end: 100 }];
        const id = Date.now().toString();
        const notebookEditor = new class extends (0, mock_1.mock)() {
            constructor() {
                super(...arguments);
                this.notebookOptions = notebookOptions;
                this.onDidChangeModel = new event_1.Emitter().event;
                this.onDidChangeCellState = new event_1.Emitter().event;
                this.textModel = viewModel.notebookDocument;
                this.onDidChangeVisibleRanges = event_1.Event.None;
            }
            // eslint-disable-next-line local/code-must-use-super-dispose
            dispose() {
                viewModel.dispose();
            }
            getViewModel() {
                return viewModel;
            }
            hasModel() {
                return !!viewModel;
            }
            getLength() { return viewModel.length; }
            getFocus() { return viewModel.getFocus(); }
            getSelections() { return viewModel.getSelections(); }
            setFocus(focus) {
                viewModel.updateSelectionsState({
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: focus,
                    selections: viewModel.getSelections()
                });
            }
            setSelections(selections) {
                viewModel.updateSelectionsState({
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: viewModel.getFocus(),
                    selections: selections
                });
            }
            getViewIndexByModelIndex(index) { return listViewInfoAccessor.getViewIndex(viewModel.viewCells[index]); }
            getCellRangeFromViewRange(startIndex, endIndex) { return listViewInfoAccessor.getCellRangeFromViewRange(startIndex, endIndex); }
            revealCellRangeInView() { }
            setHiddenAreas(_ranges) {
                return cellList.setHiddenAreas(_ranges, true);
            }
            getActiveCell() {
                const elements = cellList.getFocusedElements();
                if (elements && elements.length) {
                    return elements[0];
                }
                return undefined;
            }
            hasOutputTextSelection() {
                return false;
            }
            changeModelDecorations() { return null; }
            focusElement() { }
            setCellEditorSelection() { }
            async revealRangeInCenterIfOutsideViewportAsync() { }
            async layoutNotebookCell() { }
            async removeInset() { }
            async focusNotebookCell(cell, focusItem) {
                cell.focusMode = focusItem === 'editor' ? notebookBrowser_1.CellFocusMode.Editor
                    : focusItem === 'output' ? notebookBrowser_1.CellFocusMode.Output
                        : notebookBrowser_1.CellFocusMode.Container;
            }
            cellAt(index) { return viewModel.cellAt(index); }
            getCellIndex(cell) { return viewModel.getCellIndex(cell); }
            getCellsInRange(range) { return viewModel.getCellsInRange(range); }
            getCellByHandle(handle) { return viewModel.getCellByHandle(handle); }
            getNextVisibleCellIndex(index) { return viewModel.getNextVisibleCellIndex(index); }
            getControl() { return this; }
            get onDidChangeSelection() { return viewModel.onDidChangeSelection; }
            get onDidChangeOptions() { return viewModel.onDidChangeOptions; }
            get onDidChangeViewCells() { return viewModel.onDidChangeViewCells; }
            async find(query, options) {
                const findMatches = viewModel.find(query, options).filter(match => match.length > 0);
                return findMatches;
            }
            deltaCellDecorations() { return []; }
            get visibleRanges() {
                return visibleRanges;
            }
            set visibleRanges(_ranges) {
                visibleRanges = _ranges;
            }
            getId() { return id; }
            setScrollTop(scrollTop) {
                cellList.scrollTop = scrollTop;
            }
            get scrollTop() {
                return cellList.scrollTop;
            }
            getLayoutInfo() {
                return {
                    width: 0,
                    height: 0,
                    scrollHeight: cellList.getScrollHeight(),
                    fontInfo: new fontInfo_1.FontInfo({
                        pixelRatio: 1,
                        fontFamily: 'mockFont',
                        fontWeight: 'normal',
                        fontSize: 14,
                        fontFeatureSettings: editorOptions_1.EditorFontLigatures.OFF,
                        fontVariationSettings: editorOptions_1.EditorFontVariations.OFF,
                        lineHeight: 19,
                        letterSpacing: 1.5,
                        isMonospace: true,
                        typicalHalfwidthCharacterWidth: 10,
                        typicalFullwidthCharacterWidth: 20,
                        canUseHalfwidthRightwardsArrow: true,
                        spaceWidth: 10,
                        middotWidth: 10,
                        wsmiddotWidth: 10,
                        maxDigitWidth: 10,
                    }, true),
                    stickyHeight: 0
                };
            }
        };
        return { editor: notebookEditor, viewModel };
    }
    function createTestNotebookEditor(instantiationService, disposables, cells) {
        return _createTestNotebookEditor(instantiationService, disposables, cells);
    }
    async function withTestNotebookDiffModel(originalCells, modifiedCells, callback) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = setupInstantiationService(disposables);
        const originalNotebook = createTestNotebookEditor(instantiationService, disposables, originalCells);
        const modifiedNotebook = createTestNotebookEditor(instantiationService, disposables, modifiedCells);
        const originalResource = new class extends (0, mock_1.mock)() {
            get notebook() {
                return originalNotebook.viewModel.notebookDocument;
            }
        };
        const modifiedResource = new class extends (0, mock_1.mock)() {
            get notebook() {
                return modifiedNotebook.viewModel.notebookDocument;
            }
        };
        const model = new class extends (0, mock_1.mock)() {
            get original() {
                return originalResource;
            }
            get modified() {
                return modifiedResource;
            }
        };
        const res = await callback(model, disposables, instantiationService);
        if (res instanceof Promise) {
            res.finally(() => {
                originalNotebook.editor.dispose();
                originalNotebook.viewModel.dispose();
                modifiedNotebook.editor.dispose();
                modifiedNotebook.viewModel.dispose();
                disposables.dispose();
            });
        }
        else {
            originalNotebook.editor.dispose();
            originalNotebook.viewModel.dispose();
            modifiedNotebook.editor.dispose();
            modifiedNotebook.viewModel.dispose();
            disposables.dispose();
        }
        return res;
    }
    async function withTestNotebook(cells, callback, accessor) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = accessor ?? setupInstantiationService(disposables);
        const notebookEditor = _createTestNotebookEditor(instantiationService, disposables, cells);
        return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const res = await callback(notebookEditor.editor, notebookEditor.viewModel, disposables, instantiationService);
            if (res instanceof Promise) {
                res.finally(() => {
                    notebookEditor.editor.dispose();
                    notebookEditor.viewModel.dispose();
                    notebookEditor.editor.textModel.dispose();
                    disposables.dispose();
                });
            }
            else {
                notebookEditor.editor.dispose();
                notebookEditor.viewModel.dispose();
                notebookEditor.editor.textModel.dispose();
                disposables.dispose();
            }
            return res;
        });
    }
    function createNotebookCellList(instantiationService, disposables, viewContext) {
        const delegate = {
            getHeight(element) { return element.getHeight(17); },
            getTemplateId() { return 'template'; }
        };
        const renderer = {
            templateId: 'template',
            renderTemplate() { return {}; },
            renderElement() { },
            disposeTemplate() { }
        };
        const notebookOptions = !!viewContext ? viewContext.notebookOptions
            : disposables.add(new notebookOptions_1.NotebookOptions(window_1.mainWindow, instantiationService.get(configuration_1.IConfigurationService), instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService), instantiationService.get(codeEditorService_1.ICodeEditorService), false));
        const cellList = disposables.add(instantiationService.createInstance(notebookCellList_1.NotebookCellList, 'NotebookCellList', DOM.$('container'), notebookOptions, delegate, [renderer], instantiationService.get(contextkey_1.IContextKeyService), {
            supportDynamicHeights: true,
            multipleSelectionSupport: true,
        }));
        return cellList;
    }
    function valueBytesFromString(value) {
        return buffer_1.VSBuffer.fromString(value);
    }
    class TestCellExecution {
        constructor(notebook, cellHandle, onComplete) {
            this.notebook = notebook;
            this.cellHandle = cellHandle;
            this.onComplete = onComplete;
            this.state = notebookCommon_1.NotebookCellExecutionState.Unconfirmed;
            this.didPause = false;
            this.isPaused = false;
        }
        confirm() {
        }
        update(updates) {
        }
        complete(complete) {
            this.onComplete();
        }
    }
    class TestNotebookExecutionStateService {
        constructor() {
            this._executions = new map_1.ResourceMap();
            this.onDidChangeExecution = new event_1.Emitter().event;
            this.onDidChangeLastRunFailState = new event_1.Emitter().event;
        }
        forceCancelNotebookExecutions(notebookUri) {
        }
        getCellExecutionsForNotebook(notebook) {
            return [];
        }
        getCellExecution(cellUri) {
            return this._executions.get(cellUri);
        }
        createCellExecution(notebook, cellHandle) {
            const onComplete = () => this._executions.delete(notebookCommon_1.CellUri.generate(notebook, cellHandle));
            const exe = new TestCellExecution(notebook, cellHandle, onComplete);
            this._executions.set(notebookCommon_1.CellUri.generate(notebook, cellHandle), exe);
            return exe;
        }
        getCellExecutionsByHandleForNotebook(notebook) {
            return;
        }
        getLastFailedCellForNotebook(notebook) {
            return;
        }
        getExecution(notebook) {
            return;
        }
        createExecution(notebook) {
            throw new Error('Method not implemented.');
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdE5vdGVib29rRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL3Rlc3ROb3RlYm9va0VkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtTGhHLDhEQW1DQztJQXVKRCw0REFFQztJQUVELDhEQTJDQztJQU1ELDRDQXNCQztJQUVELHdEQThCQztJQUVELG9EQUVDO0lBdlpELE1BQWEsUUFBUyxTQUFRLDZDQUFxQjtRQUNsRCxZQUNRLFFBQWdCLEVBQ3ZCLE1BQWMsRUFDUCxNQUFjLEVBQ3JCLFFBQWdCLEVBQ2hCLFFBQWtCLEVBQ2xCLE9BQXFCLEVBQ3JCLGVBQWlDO1lBRWpDLEtBQUssQ0FBQyx3QkFBTyxDQUFDLFFBQVEsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLEVBQUUsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBSyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLEVBQUUscUJBQXFCLEVBQUUsRUFBRSxFQUFFLHlCQUF5QixFQUFFLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFSeFIsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUVoQixXQUFNLEdBQU4sTUFBTSxDQUFRO1FBT3RCLENBQUM7S0FDRDtJQVpELDRCQVlDO0lBRUQsTUFBYSx1QkFBd0IsU0FBUSx5QkFBVztRQWlCdkQsSUFBSSxRQUFRO1lBQ1gsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUNoQyxD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