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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/numbers", "vs/base/common/stopwatch", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/services/editorWorker", "vs/editor/common/services/model", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatWordCounter", "vs/workbench/contrib/inlineChat/browser/inlineChatSavingService", "vs/workbench/contrib/inlineChat/browser/inlineChatSession", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionService", "vs/workbench/contrib/inlineChat/browser/inlineChatWidget", "vs/workbench/contrib/inlineChat/browser/utils", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatContext", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, dom_1, async_1, cancellation_1, event_1, htmlContent_1, lifecycle_1, map_1, network_1, numbers_1, stopwatch_1, types_1, uri_1, uuid_1, codeEditorWidget_1, selection_1, languages_1, language_1, editorWorker_1, model_1, nls_1, commands_1, contextkey_1, instantiation_1, progress_1, storage_1, chat_1, chatAgents_1, chatWordCounter_1, inlineChatSavingService_1, inlineChatSession_1, inlineChatSessionService_1, inlineChatWidget_1, utils_1, inlineChat_1, cellOperations_1, notebookChatContext_1, notebookEditorExtensions_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    var NotebookChatController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditStrategy = exports.NotebookChatController = void 0;
    class NotebookChatWidget extends lifecycle_1.Disposable {
        set afterModelPosition(afterModelPosition) {
            this.notebookViewZone.afterModelPosition = afterModelPosition;
        }
        get afterModelPosition() {
            return this.notebookViewZone.afterModelPosition;
        }
        set heightInPx(heightInPx) {
            this.notebookViewZone.heightInPx = heightInPx;
        }
        get heightInPx() {
            return this.notebookViewZone.heightInPx;
        }
        get editingCell() {
            return this._editingCell;
        }
        constructor(_notebookEditor, id, notebookViewZone, domNode, widgetContainer, inlineChatWidget, parentEditor, _languageService) {
            super();
            this._notebookEditor = _notebookEditor;
            this.id = id;
            this.notebookViewZone = notebookViewZone;
            this.domNode = domNode;
            this.widgetContainer = widgetContainer;
            this.inlineChatWidget = inlineChatWidget;
            this.parentEditor = parentEditor;
            this._languageService = _languageService;
            this._editingCell = null;
            this._register(inlineChatWidget.onDidChangeHeight(() => {
                this.heightInPx = inlineChatWidget.contentHeight;
                this._notebookEditor.changeViewZones(accessor => {
                    accessor.layoutZone(id);
                });
                this._layoutWidget(inlineChatWidget, widgetContainer);
            }));
            this._layoutWidget(inlineChatWidget, widgetContainer);
        }
        restoreEditingCell(initEditingCell) {
            this._editingCell = initEditingCell;
            const decorationIds = this._notebookEditor.deltaCellDecorations([], [{
                    handle: this._editingCell.handle,
                    options: { className: 'nb-chatGenerationHighlight', outputClassName: 'nb-chatGenerationHighlight' }
                }]);
            this._register((0, lifecycle_1.toDisposable)(() => {
                this._notebookEditor.deltaCellDecorations(decorationIds, []);
            }));
        }
        hasFocus() {
            return this.inlineChatWidget.hasFocus();
        }
        focus() {
            this.updateNotebookEditorFocusNSelections();
            this.inlineChatWidget.focus();
        }
        updateNotebookEditorFocusNSelections() {
            this._notebookEditor.focusContainer(true);
            this._notebookEditor.setFocus({ start: this.afterModelPosition, end: this.afterModelPosition });
            this._notebookEditor.setSelections([{
                    start: this.afterModelPosition,
                    end: this.afterModelPosition
                }]);
        }
        getEditingCell() {
            return this._editingCell;
        }
        async getOrCreateEditingCell() {
            if (this._editingCell) {
                const codeEditor = this._notebookEditor.codeEditors.find(ce => ce[0] === this._editingCell)?.[1];
                if (codeEditor?.hasModel()) {
                    return {
                        cell: this._editingCell,
                        editor: codeEditor
                    };
                }
                else {
                    return undefined;
                }
            }
            if (!this._notebookEditor.hasModel()) {
                return undefined;
            }
            const widgetHasFocus = this.inlineChatWidget.hasFocus();
            this._editingCell = (0, cellOperations_1.insertCell)(this._languageService, this._notebookEditor, this.afterModelPosition, notebookCommon_1.CellKind.Code, 'above');
            if (!this._editingCell) {
                return undefined;
            }
            await this._notebookEditor.revealFirstLineIfOutsideViewport(this._editingCell);
            // update decoration
            const decorationIds = this._notebookEditor.deltaCellDecorations([], [{
                    handle: this._editingCell.handle,
                    options: { className: 'nb-chatGenerationHighlight', outputClassName: 'nb-chatGenerationHighlight' }
                }]);
            this._register((0, lifecycle_1.toDisposable)(() => {
                this._notebookEditor.deltaCellDecorations(decorationIds, []);
            }));
            if (widgetHasFocus) {
                this.focus();
            }
            const codeEditor = this._notebookEditor.codeEditors.find(ce => ce[0] === this._editingCell)?.[1];
            if (codeEditor?.hasModel()) {
                return {
                    cell: this._editingCell,
                    editor: codeEditor
                };
            }
            return undefined;
        }
        async discardChange() {
            if (this._notebookEditor.hasModel() && this._editingCell) {
                // remove the cell from the notebook
                (0, cellOperations_1.runDeleteAction)(this._notebookEditor, this._editingCell);
            }
        }
        _layoutWidget(inlineChatWidget, widgetContainer) {
            const layoutConfiguration = this._notebookEditor.notebookOptions.getLayoutConfiguration();
            const rightMargin = layoutConfiguration.cellRightMargin;
            const leftMargin = this._notebookEditor.notebookOptions.getCellEditorContainerLeftMargin();
            const maxWidth = 640;
            const width = Math.min(maxWidth, this._notebookEditor.getLayoutInfo().width - leftMargin - rightMargin);
            inlineChatWidget.layout(new dom_1.Dimension(width, this.heightInPx));
            inlineChatWidget.domNode.style.width = `${width}px`;
            widgetContainer.style.left = `${leftMargin}px`;
        }
        dispose() {
            this._notebookEditor.changeViewZones(accessor => {
                accessor.removeZone(this.id);
            });
            this.domNode.remove();
            super.dispose();
        }
    }
    class NotebookCellTextModelLikeId {
        static str(k) {
            return `${k.viewType}/${k.uri.toString()}`;
        }
        static obj(s) {
            const idx = s.indexOf('/');
            return {
                viewType: s.substring(0, idx),
                uri: uri_1.URI.parse(s.substring(idx + 1))
            };
        }
    }
    let NotebookChatController = class NotebookChatController extends lifecycle_1.Disposable {
        static { NotebookChatController_1 = this; }
        static { this.id = 'workbench.notebook.chatController'; }
        static { this.counter = 0; }
        static get(editor) {
            return editor.getContribution(NotebookChatController_1.id);
        }
        // History
        static { this._storageKey = 'inline-chat-history'; }
        static { this._promptHistory = []; }
        constructor(_notebookEditor, _instantiationService, _inlineChatSessionService, _contextKeyService, _commandService, _editorWorkerService, _inlineChatSavingService, _modelService, _languageService, _executionStateService, _storageService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._instantiationService = _instantiationService;
            this._inlineChatSessionService = _inlineChatSessionService;
            this._contextKeyService = _contextKeyService;
            this._commandService = _commandService;
            this._editorWorkerService = _editorWorkerService;
            this._inlineChatSavingService = _inlineChatSavingService;
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._executionStateService = _executionStateService;
            this._storageService = _storageService;
            this._historyOffset = -1;
            this._historyCandidate = '';
            this._promptCache = new map_1.LRUCache(1000, 0.7);
            this._onDidChangePromptCache = this._register(new event_1.Emitter());
            this.onDidChangePromptCache = this._onDidChangePromptCache.event;
            this._userEditingDisposables = this._register(new lifecycle_1.DisposableStore());
            this._widgetDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._ctxHasActiveRequest = notebookChatContext_1.CTX_NOTEBOOK_CHAT_HAS_ACTIVE_REQUEST.bindTo(this._contextKeyService);
            this._ctxCellWidgetFocused = notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED.bindTo(this._contextKeyService);
            this._ctxLastResponseType = inlineChat_1.CTX_INLINE_CHAT_LAST_RESPONSE_TYPE.bindTo(this._contextKeyService);
            this._ctxUserDidEdit = notebookChatContext_1.CTX_NOTEBOOK_CHAT_USER_DID_EDIT.bindTo(this._contextKeyService);
            this._ctxOuterFocusPosition = notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.bindTo(this._contextKeyService);
            this._registerFocusTracker();
            NotebookChatController_1._promptHistory = JSON.parse(this._storageService.get(NotebookChatController_1._storageKey, 0 /* StorageScope.PROFILE */, '[]'));
            this._historyUpdate = (prompt) => {
                const idx = NotebookChatController_1._promptHistory.indexOf(prompt);
                if (idx >= 0) {
                    NotebookChatController_1._promptHistory.splice(idx, 1);
                }
                NotebookChatController_1._promptHistory.unshift(prompt);
                this._historyOffset = -1;
                this._historyCandidate = '';
                this._storageService.store(NotebookChatController_1._storageKey, JSON.stringify(NotebookChatController_1._promptHistory), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            };
        }
        _registerFocusTracker() {
            this._register(this._notebookEditor.onDidChangeFocus(() => {
                if (!this._widget) {
                    this._ctxOuterFocusPosition.set('');
                    return;
                }
                const widgetIndex = this._widget.afterModelPosition;
                const focus = this._notebookEditor.getFocus().start;
                if (focus + 1 === widgetIndex) {
                    this._ctxOuterFocusPosition.set('above');
                }
                else if (focus === widgetIndex) {
                    this._ctxOuterFocusPosition.set('below');
                }
                else {
                    this._ctxOuterFocusPosition.set('');
                }
            }));
        }
        run(index, input, autoSend) {
            if (this._widget) {
                if (this._widget.afterModelPosition !== index) {
                    const window = (0, dom_1.getWindow)(this._widget.domNode);
                    this._disposeWidget();
                    (0, dom_1.scheduleAtNextAnimationFrame)(window, () => {
                        this._createWidget(index, input, autoSend, undefined);
                    });
                }
                return;
            }
            this._createWidget(index, input, autoSend, undefined);
            // TODO: reveal widget to the center if it's out of the viewport
        }
        restore(editingCell, input) {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const index = this._notebookEditor.textModel.cells.indexOf(editingCell.model);
            if (index < 0) {
                return;
            }
            if (this._widget) {
                if (this._widget.afterModelPosition !== index) {
                    this._disposeWidget();
                    const window = (0, dom_1.getWindow)(this._widget.domNode);
                    (0, dom_1.scheduleAtNextAnimationFrame)(window, () => {
                        this._createWidget(index, input, false, editingCell);
                    });
                }
                return;
            }
            this._createWidget(index, input, false, editingCell);
        }
        _disposeWidget() {
            this._widget?.dispose();
            this._widget = undefined;
            this._widgetDisposableStore.clear();
            this._historyOffset = -1;
            this._historyCandidate = '';
        }
        _createWidget(index, input, autoSend, initEditingCell) {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            // Clear the widget if it's already there
            this._widgetDisposableStore.clear();
            const viewZoneContainer = document.createElement('div');
            viewZoneContainer.classList.add('monaco-editor');
            const widgetContainer = document.createElement('div');
            widgetContainer.style.position = 'absolute';
            viewZoneContainer.appendChild(widgetContainer);
            this._focusTracker = this._widgetDisposableStore.add((0, dom_1.trackFocus)(viewZoneContainer));
            this._widgetDisposableStore.add(this._focusTracker.onDidFocus(() => {
                this._updateNotebookEditorFocusNSelections();
            }));
            const fakeParentEditorElement = document.createElement('div');
            const fakeParentEditor = this._widgetDisposableStore.add(this._instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, fakeParentEditorElement, {}, { isSimpleWidget: true }));
            const inputBoxFragment = `notebook-chat-input-${NotebookChatController_1.counter++}`;
            const notebookUri = this._notebookEditor.textModel.uri;
            const inputUri = notebookUri.with({ scheme: network_1.Schemas.untitled, fragment: inputBoxFragment });
            const result = this._modelService.createModel('', null, inputUri, false);
            fakeParentEditor.setModel(result);
            const inlineChatWidget = this._widgetDisposableStore.add(this._instantiationService.createInstance(inlineChatWidget_1.InlineChatWidget, chatAgents_1.ChatAgentLocation.Notebook, {
                telemetrySource: 'notebook-generate-cell',
                inputMenuId: notebookChatContext_1.MENU_CELL_CHAT_INPUT,
                widgetMenuId: notebookChatContext_1.MENU_CELL_CHAT_WIDGET,
                statusMenuId: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_STATUS,
                feedbackMenuId: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_FEEDBACK
            }));
            inlineChatWidget.placeholder = (0, nls_1.localize)('default.placeholder', "Ask a question");
            inlineChatWidget.updateInfo((0, nls_1.localize)('welcome.1', "AI-generated code may be incorrect"));
            widgetContainer.appendChild(inlineChatWidget.domNode);
            this._widgetDisposableStore.add(inlineChatWidget.onDidChangeInput(() => {
                this._warmupRequestCts?.dispose(true);
                this._warmupRequestCts = undefined;
            }));
            this._notebookEditor.changeViewZones(accessor => {
                const notebookViewZone = {
                    afterModelPosition: index,
                    heightInPx: 80,
                    domNode: viewZoneContainer
                };
                const id = accessor.addZone(notebookViewZone);
                this._scrollWidgetIntoView(index);
                this._widget = new NotebookChatWidget(this._notebookEditor, id, notebookViewZone, viewZoneContainer, widgetContainer, inlineChatWidget, fakeParentEditor, this._languageService);
                if (initEditingCell) {
                    this._widget.restoreEditingCell(initEditingCell);
                    this._updateUserEditingState();
                }
                this._ctxCellWidgetFocused.set(true);
                (0, async_1.disposableTimeout)(() => {
                    this._focusWidget();
                }, 0, this._store);
                this._sessionCtor = (0, async_1.createCancelablePromise)(async (token) => {
                    if (fakeParentEditor.hasModel()) {
                        await this._startSession(fakeParentEditor, token);
                        this._warmupRequestCts = new cancellation_1.CancellationTokenSource();
                        this._startInitialFolowups(fakeParentEditor, this._warmupRequestCts.token);
                        if (this._widget) {
                            this._widget.inlineChatWidget.placeholder = this._activeSession?.session.placeholder ?? (0, nls_1.localize)('default.placeholder', "Ask a question");
                            this._widget.inlineChatWidget.updateInfo(this._activeSession?.session.message ?? (0, nls_1.localize)('welcome.1', "AI-generated code may be incorrect"));
                            this._widget.inlineChatWidget.updateSlashCommands(this._activeSession?.session.slashCommands ?? []);
                            this._focusWidget();
                        }
                        if (this._widget && input) {
                            this._widget.inlineChatWidget.value = input;
                            if (autoSend) {
                                this.acceptInput();
                            }
                        }
                    }
                });
            });
        }
        _scrollWidgetIntoView(index) {
            if (index === 0 || this._notebookEditor.getLength() === 0) {
                // the cell is at the beginning of the notebook
                this._notebookEditor.revealOffsetInCenterIfOutsideViewport(0);
            }
            else {
                // the cell is at the end of the notebook
                const previousCell = this._notebookEditor.cellAt(Math.min(index - 1, this._notebookEditor.getLength() - 1));
                if (previousCell) {
                    const cellTop = this._notebookEditor.getAbsoluteTopOfElement(previousCell);
                    const cellHeight = this._notebookEditor.getHeightOfElement(previousCell);
                    this._notebookEditor.revealOffsetInCenterIfOutsideViewport(cellTop + cellHeight + 48 /** center of the dialog */);
                }
            }
        }
        _focusWidget() {
            if (!this._widget) {
                return;
            }
            this._updateNotebookEditorFocusNSelections();
            this._widget.focus();
        }
        _updateNotebookEditorFocusNSelections() {
            if (!this._widget) {
                return;
            }
            this._widget.updateNotebookEditorFocusNSelections();
        }
        async acceptInput() {
            (0, types_1.assertType)(this._widget);
            await this._sessionCtor;
            (0, types_1.assertType)(this._activeSession);
            this._warmupRequestCts?.dispose(true);
            this._warmupRequestCts = undefined;
            this._activeSession.addInput(new inlineChatSession_1.SessionPrompt(this._widget.inlineChatWidget.value));
            (0, types_1.assertType)(this._activeSession.lastInput);
            const value = this._activeSession.lastInput.value;
            this._historyUpdate(value);
            const editor = this._widget.parentEditor;
            const model = editor.getModel();
            if (!editor.hasModel() || !model) {
                return;
            }
            if (this._widget.editingCell && this._widget.editingCell.textBuffer.getLength() > 0) {
                // it already contains some text, clear it
                const ref = await this._widget.editingCell.resolveTextModel();
                ref.setValue('');
            }
            const editingCellIndex = this._widget.editingCell ? this._notebookEditor.getCellIndex(this._widget.editingCell) : undefined;
            if (editingCellIndex !== undefined) {
                this._notebookEditor.setSelections([{
                        start: editingCellIndex,
                        end: editingCellIndex + 1
                    }]);
            }
            else {
                // Update selection to the widget index
                this._notebookEditor.setSelections([{
                        start: this._widget.afterModelPosition,
                        end: this._widget.afterModelPosition
                    }]);
            }
            this._ctxHasActiveRequest.set(true);
            this._widget.inlineChatWidget.updateSlashCommands(this._activeSession.session.slashCommands ?? []);
            this._widget?.inlineChatWidget.updateProgress(true);
            const request = {
                requestId: (0, uuid_1.generateUuid)(),
                prompt: value,
                attempt: 0,
                selection: { selectionStartLineNumber: 1, selectionStartColumn: 1, positionLineNumber: 1, positionColumn: 1 },
                wholeRange: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
                live: true,
                previewDocument: model.uri,
                withIntentDetection: true, // TODO: don't hard code but allow in corresponding UI to run without intent detection?
            };
            //TODO: update progress in a newly inserted cell below the widget instead of the fake editor
            this._activeRequestCts?.cancel();
            this._activeRequestCts = new cancellation_1.CancellationTokenSource();
            const progressEdits = [];
            const progressiveEditsQueue = new async_1.Queue();
            const progressiveEditsClock = stopwatch_1.StopWatch.create();
            const progressiveEditsAvgDuration = new numbers_1.MovingAverage();
            const progressiveEditsCts = new cancellation_1.CancellationTokenSource(this._activeRequestCts.token);
            let progressiveChatResponse;
            const progress = new progress_1.AsyncProgress(async (data) => {
                // console.log('received chunk', data, request);
                if (this._activeRequestCts?.token.isCancellationRequested) {
                    return;
                }
                if (data.message) {
                    this._widget?.inlineChatWidget.updateToolbar(false);
                    this._widget?.inlineChatWidget.updateInfo(data.message);
                }
                if (data.edits?.length) {
                    if (!request.live) {
                        throw new Error('Progress in NOT supported in non-live mode');
                    }
                    progressEdits.push(data.edits);
                    progressiveEditsAvgDuration.update(progressiveEditsClock.elapsed());
                    progressiveEditsClock.reset();
                    progressiveEditsQueue.queue(async () => {
                        // making changes goes into a queue because otherwise the async-progress time will
                        // influence the time it takes to receive the changes and progressive typing will
                        // become infinitely fast
                        await this._makeChanges(data.edits, data.editsShouldBeInstant
                            ? undefined
                            : { duration: progressiveEditsAvgDuration.value, token: progressiveEditsCts.token });
                    });
                }
                if (data.markdownFragment) {
                    if (!progressiveChatResponse) {
                        const message = {
                            message: new htmlContent_1.MarkdownString(data.markdownFragment, { supportThemeIcons: true, supportHtml: true, isTrusted: false }),
                            requestId: request.requestId,
                        };
                        progressiveChatResponse = this._widget?.inlineChatWidget.updateChatMessage(message, true);
                    }
                    else {
                        progressiveChatResponse.appendContent(data.markdownFragment);
                    }
                }
            });
            const task = this._activeSession.provider.provideResponse(this._activeSession.session, request, progress, this._activeRequestCts.token);
            let response;
            try {
                this._widget?.inlineChatWidget.updateChatMessage(undefined);
                this._widget?.inlineChatWidget.updateFollowUps(undefined);
                this._widget?.inlineChatWidget.updateProgress(true);
                this._widget?.inlineChatWidget.updateInfo(!this._activeSession.lastExchange ? chat_1.GeneratingPhrase + '\u2026' : '');
                this._ctxHasActiveRequest.set(true);
                const reply = await (0, async_1.raceCancellationError)(Promise.resolve(task), this._activeRequestCts.token);
                if (progressiveEditsQueue.size > 0) {
                    // we must wait for all edits that came in via progress to complete
                    await event_1.Event.toPromise(progressiveEditsQueue.onDrained);
                }
                await progress.drain();
                if (!reply) {
                    response = new inlineChatSession_1.EmptyResponse();
                }
                else {
                    const markdownContents = new htmlContent_1.MarkdownString('', { supportThemeIcons: true, supportHtml: true, isTrusted: false });
                    const replyResponse = response = this._instantiationService.createInstance(inlineChatSession_1.ReplyResponse, reply, markdownContents, this._activeSession.textModelN.uri, this._activeSession.textModelN.getAlternativeVersionId(), progressEdits, request.requestId, undefined);
                    for (let i = progressEdits.length; i < replyResponse.allLocalEdits.length; i++) {
                        await this._makeChanges(replyResponse.allLocalEdits[i], undefined);
                    }
                    if (this._activeSession?.provider.provideFollowups) {
                        const followupCts = new cancellation_1.CancellationTokenSource();
                        const followups = await this._activeSession.provider.provideFollowups(this._activeSession.session, replyResponse.raw, followupCts.token);
                        if (followups && this._widget) {
                            const widget = this._widget;
                            widget.inlineChatWidget.updateFollowUps(followups, async (followup) => {
                                if (followup.kind === 'reply') {
                                    widget.inlineChatWidget.value = followup.message;
                                    this.acceptInput();
                                }
                                else {
                                    await this.acceptSession();
                                    this._commandService.executeCommand(followup.commandId, ...(followup.args ?? []));
                                }
                            });
                        }
                    }
                    this._userEditingDisposables.clear();
                    // monitor user edits
                    const editingCell = this._widget.getEditingCell();
                    if (editingCell) {
                        this._userEditingDisposables.add(editingCell.model.onDidChangeContent(() => this._updateUserEditingState()));
                        this._userEditingDisposables.add(editingCell.model.onDidChangeLanguage(() => this._updateUserEditingState()));
                        this._userEditingDisposables.add(editingCell.model.onDidChangeMetadata(() => this._updateUserEditingState()));
                        this._userEditingDisposables.add(editingCell.model.onDidChangeInternalMetadata(() => this._updateUserEditingState()));
                        this._userEditingDisposables.add(editingCell.model.onDidChangeOutputs(() => this._updateUserEditingState()));
                        this._userEditingDisposables.add(this._executionStateService.onDidChangeExecution(e => {
                            if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && e.affectsCell(editingCell.uri)) {
                                this._updateUserEditingState();
                            }
                        }));
                    }
                }
            }
            catch (e) {
                response = new inlineChatSession_1.ErrorResponse(e);
            }
            finally {
                this._ctxHasActiveRequest.set(false);
                this._widget?.inlineChatWidget.updateProgress(false);
                this._widget?.inlineChatWidget.updateInfo('');
                this._widget?.inlineChatWidget.updateToolbar(true);
            }
            this._ctxHasActiveRequest.set(false);
            this._widget?.inlineChatWidget.updateProgress(false);
            this._widget?.inlineChatWidget.updateInfo('');
            this._widget?.inlineChatWidget.updateToolbar(true);
            this._activeSession?.addExchange(new inlineChatSession_1.SessionExchange(this._activeSession.lastInput, response));
            this._ctxLastResponseType.set(response instanceof inlineChatSession_1.ReplyResponse ? response.raw.type : undefined);
        }
        async _startSession(editor, token) {
            if (this._activeSession) {
                this._inlineChatSessionService.releaseSession(this._activeSession);
            }
            const session = await this._inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, token);
            if (!session) {
                return;
            }
            this._activeSession = session;
            this._strategy = new EditStrategy(session);
        }
        async _startInitialFolowups(editor, token) {
            if (!this._activeSession || !this._activeSession.provider.provideFollowups) {
                return;
            }
            const request = {
                requestId: (0, uuid_1.generateUuid)(),
                prompt: '',
                attempt: 0,
                selection: { selectionStartLineNumber: 1, selectionStartColumn: 1, positionLineNumber: 1, positionColumn: 1 },
                wholeRange: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
                live: true,
                previewDocument: editor.getModel().uri,
                withIntentDetection: true
            };
            const progress = new progress_1.AsyncProgress(async (data) => { });
            const task = this._activeSession.provider.provideResponse(this._activeSession.session, request, progress, token);
            const reply = await (0, async_1.raceCancellationError)(Promise.resolve(task), token);
            if (token.isCancellationRequested) {
                return;
            }
            if (!reply) {
                return;
            }
            const markdownContents = new htmlContent_1.MarkdownString('', { supportThemeIcons: true, supportHtml: true, isTrusted: false });
            const response = this._instantiationService.createInstance(inlineChatSession_1.ReplyResponse, reply, markdownContents, this._activeSession.textModelN.uri, this._activeSession.textModelN.getAlternativeVersionId(), [], request.requestId, undefined);
            const followups = await this._activeSession.provider.provideFollowups(this._activeSession.session, response.raw, token);
            if (followups && this._widget) {
                const widget = this._widget;
                widget.inlineChatWidget.updateFollowUps(followups, async (followup) => {
                    if (followup.kind === 'reply') {
                        widget.inlineChatWidget.value = followup.message;
                        this.acceptInput();
                    }
                    else {
                        await this.acceptSession();
                        this._commandService.executeCommand(followup.commandId, ...(followup.args ?? []));
                    }
                });
            }
        }
        async _makeChanges(edits, opts) {
            (0, types_1.assertType)(this._activeSession);
            (0, types_1.assertType)(this._strategy);
            (0, types_1.assertType)(this._widget);
            const editingCell = await this._widget.getOrCreateEditingCell();
            if (!editingCell) {
                return;
            }
            const editor = editingCell.editor;
            const moreMinimalEdits = await this._editorWorkerService.computeMoreMinimalEdits(editor.getModel().uri, edits);
            // this._log('edits from PROVIDER and after making them MORE MINIMAL', this._activeSession.provider.debugName, edits, moreMinimalEdits);
            if (moreMinimalEdits?.length === 0) {
                // nothing left to do
                return;
            }
            const actualEdits = !opts && moreMinimalEdits ? moreMinimalEdits : edits;
            const editOperations = actualEdits.map(languages_1.TextEdit.asEditOperation);
            this._inlineChatSavingService.markChanged(this._activeSession);
            try {
                // this._ignoreModelContentChanged = true;
                this._activeSession.wholeRange.trackEdits(editOperations);
                if (opts) {
                    await this._strategy.makeProgressiveChanges(editor, editOperations, opts);
                }
                else {
                    await this._strategy.makeChanges(editor, editOperations);
                }
                // this._ctxDidEdit.set(this._activeSession.hasChangedText);
            }
            finally {
                // this._ignoreModelContentChanged = false;
            }
        }
        _updateUserEditingState() {
            this._ctxUserDidEdit.set(true);
        }
        async acceptSession() {
            (0, types_1.assertType)(this._activeSession);
            (0, types_1.assertType)(this._strategy);
            const editor = this._widget?.parentEditor;
            if (!editor?.hasModel()) {
                return;
            }
            const editingCell = this._widget?.getEditingCell();
            if (editingCell && this._notebookEditor.hasModel() && this._activeSession.lastInput) {
                const cellId = NotebookCellTextModelLikeId.str({ uri: editingCell.uri, viewType: this._notebookEditor.textModel.viewType });
                const prompt = this._activeSession.lastInput.value;
                this._promptCache.set(cellId, prompt);
                this._onDidChangePromptCache.fire({ cell: editingCell.uri });
            }
            try {
                await this._strategy.apply(editor);
                this._inlineChatSessionService.releaseSession(this._activeSession);
            }
            catch (_err) { }
            this.dismiss(false);
        }
        async focusAbove() {
            if (!this._widget) {
                return;
            }
            const index = this._widget.afterModelPosition;
            const prev = index - 1;
            if (prev < 0) {
                return;
            }
            const cell = this._notebookEditor.cellAt(prev);
            if (!cell) {
                return;
            }
            await this._notebookEditor.focusNotebookCell(cell, 'editor');
        }
        async focusNext() {
            if (!this._widget) {
                return;
            }
            const index = this._widget.afterModelPosition;
            const cell = this._notebookEditor.cellAt(index);
            if (!cell) {
                return;
            }
            await this._notebookEditor.focusNotebookCell(cell, 'editor');
        }
        hasFocus() {
            return this._widget?.hasFocus() ?? false;
        }
        focus() {
            this._focusWidget();
        }
        focusNearestWidget(index, direction) {
            switch (direction) {
                case 'above':
                    if (this._widget?.afterModelPosition === index) {
                        this._focusWidget();
                    }
                    break;
                case 'below':
                    if (this._widget?.afterModelPosition === index + 1) {
                        this._focusWidget();
                    }
                    break;
                default:
                    break;
            }
        }
        populateHistory(up) {
            if (!this._widget) {
                return;
            }
            const len = NotebookChatController_1._promptHistory.length;
            if (len === 0) {
                return;
            }
            if (this._historyOffset === -1) {
                // remember the current value
                this._historyCandidate = this._widget.inlineChatWidget.value;
            }
            const newIdx = this._historyOffset + (up ? 1 : -1);
            if (newIdx >= len) {
                // reached the end
                return;
            }
            let entry;
            if (newIdx < 0) {
                entry = this._historyCandidate;
                this._historyOffset = -1;
            }
            else {
                entry = NotebookChatController_1._promptHistory[newIdx];
                this._historyOffset = newIdx;
            }
            this._widget.inlineChatWidget.value = entry;
            this._widget.inlineChatWidget.selectAll();
        }
        async cancelCurrentRequest(discard) {
            if (discard) {
                this._strategy?.cancel();
            }
            this._activeRequestCts?.cancel();
        }
        getEditingCell() {
            return this._widget?.getEditingCell();
        }
        discard() {
            this._strategy?.cancel();
            this._activeRequestCts?.cancel();
            this._widget?.discardChange();
            this.dismiss(true);
        }
        async feedbackLast(kind) {
            if (this._activeSession?.lastExchange && this._activeSession.lastExchange.response instanceof inlineChatSession_1.ReplyResponse) {
                this._activeSession.provider.handleInlineChatResponseFeedback?.(this._activeSession.session, this._activeSession.lastExchange.response.raw, kind);
                this._widget?.inlineChatWidget.updateStatus('Thank you for your feedback!', { resetAfter: 1250 });
            }
        }
        dismiss(discard) {
            const widget = this._widget;
            const widgetIndex = widget?.afterModelPosition;
            const currentFocus = this._notebookEditor.getFocus();
            const isWidgetFocused = currentFocus.start === widgetIndex && currentFocus.end === widgetIndex;
            if (widget && isWidgetFocused) {
                // change focus only when the widget is focused
                const editingCell = widget.getEditingCell();
                const shouldFocusEditingCell = editingCell && !discard;
                const shouldFocusTopCell = widgetIndex === 0 && this._notebookEditor.getLength() > 0;
                const shouldFocusAboveCell = widgetIndex !== 0 && this._notebookEditor.cellAt(widgetIndex - 1);
                if (shouldFocusEditingCell) {
                    this._notebookEditor.focusNotebookCell(editingCell, 'container');
                }
                else if (shouldFocusTopCell) {
                    this._notebookEditor.focusNotebookCell(this._notebookEditor.cellAt(0), 'container');
                }
                else if (shouldFocusAboveCell) {
                    this._notebookEditor.focusNotebookCell(this._notebookEditor.cellAt(widgetIndex - 1), 'container');
                }
            }
            this._ctxCellWidgetFocused.set(false);
            this._ctxUserDidEdit.set(false);
            this._sessionCtor?.cancel();
            this._sessionCtor = undefined;
            this._widget?.dispose();
            this._widget = undefined;
            this._widgetDisposableStore.clear();
        }
        // check if a cell is generated by prompt by checking prompt cache
        isCellGeneratedByChat(cell) {
            if (!this._notebookEditor.hasModel()) {
                // no model attached yet
                return false;
            }
            const cellId = NotebookCellTextModelLikeId.str({ uri: cell.uri, viewType: this._notebookEditor.textModel.viewType });
            return this._promptCache.has(cellId);
        }
        // get prompt from cache
        getPromptFromCache(cell) {
            if (!this._notebookEditor.hasModel()) {
                // no model attached yet
                return undefined;
            }
            const cellId = NotebookCellTextModelLikeId.str({ uri: cell.uri, viewType: this._notebookEditor.textModel.viewType });
            return this._promptCache.get(cellId);
        }
        dispose() {
            this.dismiss(false);
            super.dispose();
        }
    };
    exports.NotebookChatController = NotebookChatController;
    exports.NotebookChatController = NotebookChatController = NotebookChatController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, inlineChatSessionService_1.IInlineChatSessionService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, commands_1.ICommandService),
        __param(5, editorWorker_1.IEditorWorkerService),
        __param(6, inlineChatSavingService_1.IInlineChatSavingService),
        __param(7, model_1.IModelService),
        __param(8, language_1.ILanguageService),
        __param(9, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(10, storage_1.IStorageService)
    ], NotebookChatController);
    class EditStrategy {
        constructor(_session) {
            this._session = _session;
            this._editCount = 0;
        }
        async makeProgressiveChanges(editor, edits, opts) {
            // push undo stop before first edit
            if (++this._editCount === 1) {
                editor.pushUndoStop();
            }
            const durationInSec = opts.duration / 1000;
            for (const edit of edits) {
                const wordCount = (0, chatWordCounter_1.countWords)(edit.text ?? '');
                const speed = wordCount / durationInSec;
                // console.log({ durationInSec, wordCount, speed: wordCount / durationInSec });
                await (0, utils_1.performAsyncTextEdit)(editor.getModel(), (0, utils_1.asProgressiveEdit)(new dom_1.WindowIntervalTimer(), edit, speed, opts.token));
            }
        }
        async makeChanges(editor, edits) {
            const cursorStateComputerAndInlineDiffCollection = (undoEdits) => {
                let last = null;
                for (const edit of undoEdits) {
                    last = !last || last.isBefore(edit.range.getEndPosition()) ? edit.range.getEndPosition() : last;
                    // this._inlineDiffDecorations.collectEditOperation(edit);
                }
                return last && [selection_1.Selection.fromPositions(last)];
            };
            // push undo stop before first edit
            if (++this._editCount === 1) {
                editor.pushUndoStop();
            }
            editor.executeEdits('inline-chat-live', edits, cursorStateComputerAndInlineDiffCollection);
        }
        async apply(editor) {
            if (this._editCount > 0) {
                editor.pushUndoStop();
            }
            if (!(this._session.lastExchange?.response instanceof inlineChatSession_1.ReplyResponse)) {
                return;
            }
            const { untitledTextModel } = this._session.lastExchange.response;
            if (untitledTextModel && !untitledTextModel.isDisposed() && untitledTextModel.isDirty()) {
                await untitledTextModel.save({ reason: 1 /* SaveReason.EXPLICIT */ });
            }
        }
        async cancel() {
            const { textModelN: modelN, textModelNAltVersion, textModelNSnapshotAltVersion } = this._session;
            if (modelN.isDisposed()) {
                return;
            }
            const targetAltVersion = textModelNSnapshotAltVersion ?? textModelNAltVersion;
            while (targetAltVersion < modelN.getAlternativeVersionId() && modelN.canUndo()) {
                modelN.undo();
            }
        }
        createSnapshot() {
            if (this._session && !this._session.textModel0.equalsTextBuffer(this._session.textModelN.getTextBuffer())) {
                this._session.createSnapshot();
            }
        }
    }
    exports.EditStrategy = EditStrategy;
    (0, notebookEditorExtensions_1.registerNotebookContribution)(NotebookChatController.id, NotebookChatController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDaGF0Q29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJvbGxlci9jaGF0L25vdGVib29rQ2hhdENvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWlEaEcsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQUMxQyxJQUFJLGtCQUFrQixDQUFDLGtCQUEwQjtZQUNoRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUM7UUFDL0QsQ0FBQztRQUVELElBQUksa0JBQWtCO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDO1FBQ2pELENBQUM7UUFFRCxJQUFJLFVBQVUsQ0FBQyxVQUFrQjtZQUNoQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUMvQyxDQUFDO1FBRUQsSUFBSSxVQUFVO1lBQ2IsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDO1FBQ3pDLENBQUM7UUFJRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztRQUVELFlBQ2tCLGVBQWdDLEVBQ3hDLEVBQVUsRUFDVixnQkFBbUMsRUFDbkMsT0FBb0IsRUFDcEIsZUFBNEIsRUFDNUIsZ0JBQWtDLEVBQ2xDLFlBQThCLEVBQ3RCLGdCQUFrQztZQUVuRCxLQUFLLEVBQUUsQ0FBQztZQVRTLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUN4QyxPQUFFLEdBQUYsRUFBRSxDQUFRO1lBQ1YscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNuQyxZQUFPLEdBQVAsT0FB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