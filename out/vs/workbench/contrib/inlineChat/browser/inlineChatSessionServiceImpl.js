var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/uuid", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/services/editorWorker", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "vs/workbench/common/editor", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/untitled/common/untitledTextEditorInput", "./inlineChatSession", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/services/extensions/common/extensions", "vs/base/common/codicons", "vs/base/common/resources"], function (require, exports, arrays_1, async_1, errors_1, event_1, htmlContent_1, iterator_1, lifecycle_1, map_1, network_1, uuid_1, range_1, textModel_1, editorWorker_1, model_1, resolverService_1, instantiation_1, log_1, progress_1, telemetry_1, editor_1, chatAgents_1, chatService_1, inlineChat_1, editorService_1, untitledTextEditorInput_1, inlineChatSession_1, chatVariables_1, extensions_1, codicons_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AgentInlineChatProvider = exports.InlineChatSessionServiceImpl = exports.InlineChatError = void 0;
    let BridgeAgent = class BridgeAgent {
        constructor(_data, _sessions, _postLastResponse, _instaService) {
            this._data = _data;
            this._sessions = _sessions;
            this._postLastResponse = _postLastResponse;
            this._instaService = _instaService;
        }
        _findSessionDataByRequest(request) {
            let data;
            for (const candidate of this._sessions.values()) {
                if (candidate.session.chatModel.sessionId === request.sessionId) {
                    data = candidate;
                    break;
                }
            }
            return data;
        }
        async invoke(request, progress, _history, token) {
            if (token.isCancellationRequested) {
                return {};
            }
            const data = this._findSessionDataByRequest(request);
            if (!data) {
                throw new Error('FAILED to find session');
            }
            const { session } = data;
            if (!session.lastInput) {
                throw new Error('FAILED to find last input');
            }
            const inlineChatContextValue = request.variables.variables.find(candidate => candidate.name === _inlineChatContext)?.values[0];
            const inlineChatContext = typeof inlineChatContextValue?.value === 'string' && JSON.parse(inlineChatContextValue.value);
            const modelAltVersionIdNow = session.textModelN.getAlternativeVersionId();
            const progressEdits = [];
            const inlineRequest = {
                requestId: request.requestId,
                prompt: request.message,
                attempt: request.attempt ?? 0,
                withIntentDetection: request.enableCommandDetection ?? true,
                live: session.editMode !== "preview" /* EditMode.Preview */,
                previewDocument: session.textModelN.uri,
                selection: inlineChatContext.selection,
                wholeRange: inlineChatContext.wholeRange
            };
            const inlineProgress = new progress_1.Progress(data => {
                // TODO@jrieken
                // if (data.message) {
                // 	progress({ kind: 'progressMessage', content: new MarkdownString(data.message) });
                // }
                // TODO@ulugbekna,jrieken should we only send data.slashCommand when having detected one?
                if (data.slashCommand && !inlineRequest.prompt.startsWith('/')) {
                    const command = this._data.slashCommands.find(c => c.name === data.slashCommand);
                    progress({ kind: 'agentDetection', agentId: this._data.id, command });
                }
                if (data.markdownFragment) {
                    progress({ kind: 'markdownContent', content: new htmlContent_1.MarkdownString(data.markdownFragment) });
                }
                if ((0, arrays_1.isNonEmptyArray)(data.edits)) {
                    progressEdits.push(data.edits);
                    progress({ kind: 'textEdit', uri: session.textModelN.uri, edits: data.edits });
                }
            });
            let result;
            let response;
            try {
                result = await data.session.provider.provideResponse(session.session, inlineRequest, inlineProgress, token);
                if (result) {
                    if (result.message) {
                        inlineProgress.report({ markdownFragment: result.message.value });
                    }
                    if (Array.isArray(result.edits)) {
                        inlineProgress.report({ edits: result.edits });
                    }
                    const markdownContents = result.message ?? new htmlContent_1.MarkdownString('', { supportThemeIcons: true, supportHtml: true, isTrusted: false });
                    const chatModelRequest = session.chatModel.getRequests().find(candidate => candidate.id === request.requestId);
                    response = this._instaService.createInstance(inlineChatSession_1.ReplyResponse, result, markdownContents, session.textModelN.uri, modelAltVersionIdNow, progressEdits, request.requestId, chatModelRequest?.response);
                }
                else {
                    response = new inlineChatSession_1.EmptyResponse();
                }
            }
            catch (e) {
                response = new inlineChatSession_1.ErrorResponse(e);
            }
            this._postLastResponse({ id: request.requestId, response });
            return {
                metadata: {
                    inlineChatResponse: result
                }
            };
        }
        async provideFollowups(request, result, history, token) {
            if (!result.metadata?.inlineChatResponse) {
                return [];
            }
            const data = this._findSessionDataByRequest(request);
            if (!data) {
                return [];
            }
            const inlineFollowups = await data.session.provider.provideFollowups?.(data.session.session, result.metadata?.inlineChatResponse, token);
            if (!inlineFollowups) {
                return [];
            }
            const chatFollowups = inlineFollowups.map(f => {
                if (f.kind === 'reply') {
                    return {
                        kind: 'reply',
                        message: f.message,
                        agentId: request.agentId,
                        title: f.title,
                        tooltip: f.tooltip,
                    };
                }
                else {
                    // TODO@jrieken update API
                    return undefined;
                }
            });
            (0, arrays_1.coalesceInPlace)(chatFollowups);
            return chatFollowups;
        }
        provideWelcomeMessage(location, token) {
            // without this provideSampleQuestions is not called
            return [];
        }
        async provideSampleQuestions(location, token) {
            // TODO@jrieken DEBT
            // (hack) this function is called while creating the session. We need the timeout to make sure this._sessions is populated.
            // (hack) we have no context/session id and therefore use the first session with an active editor
            await new Promise(resolve => setTimeout(resolve, 10));
            for (const [, data] of this._sessions) {
                if (data.session.session.input && data.editor.hasWidgetFocus()) {
                    return [{
                            kind: 'reply',
                            agentId: _bridgeAgentId,
                            message: data.session.session.input,
                        }];
                }
            }
            return [];
        }
    };
    BridgeAgent = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], BridgeAgent);
    class InlineChatError extends Error {
        static { this.code = 'InlineChatError'; }
        constructor(message) {
            super(message);
            this.name = InlineChatError.code;
        }
    }
    exports.InlineChatError = InlineChatError;
    const _bridgeAgentId = 'brigde.editor';
    const _inlineChatContext = '_inlineChatContext';
    const _inlineChatDocument = '_inlineChatDocument';
    class InlineChatContext {
        static { this.variableName = '_inlineChatContext'; }
        constructor(uri, selection, wholeRange) {
            this.uri = uri;
            this.selection = selection;
            this.wholeRange = wholeRange;
        }
    }
    let InlineChatSessionServiceImpl = class InlineChatSessionServiceImpl {
        constructor(_inlineChatService, _telemetryService, _modelService, _textModelService, _editorWorkerService, _logService, _instaService, _editorService, _chatService, _chatAgentService, chatVariableService) {
            this._inlineChatService = _inlineChatService;
            this._telemetryService = _telemetryService;
            this._modelService = _modelService;
            this._textModelService = _textModelService;
            this._editorWorkerService = _editorWorkerService;
            this._logService = _logService;
            this._instaService = _instaService;
            this._editorService = _editorService;
            this._chatService = _chatService;
            this._chatAgentService = _chatAgentService;
            this._store = new lifecycle_1.DisposableStore();
            this._onWillStartSession = this._store.add(new event_1.Emitter());
            this.onWillStartSession = this._onWillStartSession.event;
            this._onDidMoveSession = this._store.add(new event_1.Emitter());
            this.onDidMoveSession = this._onDidMoveSession.event;
            this._onDidEndSession = this._store.add(new event_1.Emitter());
            this.onDidEndSession = this._onDidEndSession.event;
            this._onDidStashSession = this._store.add(new event_1.Emitter());
            this.onDidStashSession = this._onDidStashSession.event;
            this._sessions = new Map();
            this._keyComputers = new Map();
            this._recordings = [];
            this._lastResponsesFromBridgeAgent = new map_1.LRUCache(5);
            const fakeProviders = this._store.add(new lifecycle_1.DisposableMap());
            this._store.add(this._chatAgentService.onDidChangeAgents(() => {
                const providersNow = new Set();
                for (const agent of this._chatAgentService.getActivatedAgents()) {
                    if (agent.id === _bridgeAgentId) {
                        // not interesting
                        continue;
                    }
                    if (!agent.locations.includes(chatAgents_1.ChatAgentLocation.Editor) || !agent.isDefault) {
                        // not interesting
                        continue;
                    }
                    providersNow.add(agent.id);
                    if (!fakeProviders.has(agent.id)) {
                        fakeProviders.set(agent.id, _inlineChatService.addProvider(_instaService.createInstance(AgentInlineChatProvider, agent)));
                        this._logService.debug(`ADDED inline chat provider for agent ${agent.id}`);
                    }
                }
                for (const [id] of fakeProviders) {
                    if (!providersNow.has(id)) {
                        fakeProviders.deleteAndDispose(id);
                        this._logService.debug(`REMOVED inline chat provider for agent ${id}`);
                    }
                }
            }));
            // MARK: register fake chat agent
            const addOrRemoveBridgeAgent = () => {
                const that = this;
                const agentData = {
                    id: _bridgeAgentId,
                    name: 'editor',
                    extensionId: extensions_1.nullExtensionDescription.identifier,
                    extensionPublisherDisplayName: '',
                    extensionDisplayName: '',
                    extensionPublisherId: '',
                    isDefault: true,
                    locations: [chatAgents_1.ChatAgentLocation.Editor],
                    get slashCommands() {
                        // HACK@jrieken
                        // find the active session and return its slash commands
                        let candidate;
                        for (const data of that._sessions.values()) {
                            if (data.editor.hasWidgetFocus()) {
                                candidate = data.session;
                                break;
                            }
                        }
                        if (!candidate || !candidate.session.slashCommands) {
                            return [];
                        }
                        return candidate.session.slashCommands.map(c => {
                            return {
                                name: c.command,
                                description: c.detail ?? '',
                            };
                        });
                    },
                    defaultImplicitVariables: [_inlineChatContext],
                    metadata: {
                        isSticky: false,
                        themeIcon: codicons_1.Codicon.copilot,
                    },
                };
                let otherEditorAgent;
                let myEditorAgent;
                for (const candidate of this._chatAgentService.getActivatedAgents()) {
                    if (!myEditorAgent && candidate.id === agentData.id) {
                        myEditorAgent = candidate;
                    }
                    else if (!otherEditorAgent && candidate.isDefault && candidate.locations.includes(chatAgents_1.ChatAgentLocation.Editor)) {
                        otherEditorAgent = candidate;
                    }
                }
                if (otherEditorAgent) {
                    bridgeStore.clear();
                    _logService.debug(`REMOVED bridge agent "${agentData.id}", found "${otherEditorAgent.id}"`);
                }
                else if (!myEditorAgent) {
                    bridgeStore.value = this._chatAgentService.registerDynamicAgent(agentData, this._instaService.createInstance(BridgeAgent, agentData, this._sessions, data => {
                        this._lastResponsesFromBridgeAgent.set(data.id, data.response);
                    }));
                    _logService.debug(`ADDED bridge agent "${agentData.id}"`);
                }
            };
            this._store.add(this._chatAgentService.onDidChangeAgents(() => addOrRemoveBridgeAgent()));
            const bridgeStore = this._store.add(new lifecycle_1.MutableDisposable());
            addOrRemoveBridgeAgent();
            // MARK: implicit variable for editor selection and (tracked) whole range
            this._store.add(chatVariableService.registerVariable({ name: _inlineChatContext, description: '', hidden: true }, async (_message, _arg, model) => {
                for (const [, data] of this._sessions) {
                    if (data.session.chatModel === model) {
                        return [{
                                level: 'full',
                                value: JSON.stringify(new InlineChatContext(data.session.textModelN.uri, data.editor.getSelection(), data.session.wholeRange.trackedInitialRange))
                            }];
                    }
                }
                return undefined;
            }));
            this._store.add(chatVariableService.registerVariable({ name: _inlineChatDocument, description: '', hidden: true }, async (_message, _arg, model) => {
                for (const [, data] of this._sessions) {
                    if (data.session.chatModel === model) {
                        return [{ level: 'full', value: data.session.textModelN.uri }];
                    }
                }
                return undefined;
            }));
        }
        dispose() {
            this._store.dispose();
            this._sessions.forEach(x => x.store.dispose());
            this._sessions.clear();
        }
        async createSession(editor, options, token) {
            const agent = this._chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Editor);
            let provider;
            if (agent) {
                for (const candidate of this._inlineChatService.getAllProvider()) {
                    if (candidate instanceof AgentInlineChatProvider && candidate.agent === agent) {
                        provider = candidate;
                        break;
                    }
                }
            }
            if (!provider) {
                provider = iterator_1.Iterable.first(this._inlineChatService.getAllProvider());
            }
            if (!provider) {
                this._logService.trace('[IE] NO provider found');
                return undefined;
            }
            this._onWillStartSession.fire(editor);
            const textModel = editor.getModel();
            const selection = editor.getSelection();
            let rawSession;
            try {
                rawSession = await (0, async_1.raceCancellation)(Promise.resolve(provider.prepareInlineChatSession(textModel, selection, token)), token);
            }
            catch (error) {
                this._logService.error('[IE] FAILED to prepare session', provider.extensionId);
                this._logService.error(error);
                throw new InlineChatError(error?.message || 'Failed to prepare session');
            }
            if (!rawSession) {
                this._logService.trace('[IE] NO session', provider.extensionId);
                return undefined;
            }
            const store = new lifecycle_1.DisposableStore();
            this._logService.trace(`[IE] creating NEW session for ${editor.getId()}, ${provider.extensionId}`);
            const chatModel = this._chatService.startSession(chatAgents_1.ChatAgentLocation.Editor, token);
            if (!chatModel) {
                this._logService.trace('[IE] NO chatModel found');
                return undefined;
            }
            store.add((0, lifecycle_1.toDisposable)(() => {
                this._chatService.clearSession(chatModel.sessionId);
                chatModel.dispose();
            }));
            const lastResponseListener = store.add(new lifecycle_1.MutableDisposable());
            store.add(chatModel.onDidChange(e => {
                if (e.kind !== 'addRequest' || !e.request.response) {
                    return;
                }
                const modelAltVersionIdNow = textModel.getAlternativeVersionId();
                const { response } = e.request;
                lastResponseListener.value = response.onDidChange(() => {
                    if (!response.isComplete) {
                        return;
                    }
                    lastResponseListener.clear(); // ONCE
                    let inlineResponse;
                    if (response.agent?.id === _bridgeAgentId) {
                        // use result that was provided by
                        inlineResponse = this._lastResponsesFromBridgeAgent.get(response.requestId) ?? new inlineChatSession_1.ErrorResponse(new Error('Missing Response'));
                        this._lastResponsesFromBridgeAgent.delete(response.requestId);
                    }
                    else {
                        // make an artificial response from the ChatResponseModel
                        if (response.isCanceled) {
                            // error: cancelled
                            inlineResponse = new inlineChatSession_1.ErrorResponse(new errors_1.CancellationError());
                        }
                        else if (response.result?.errorDetails) {
                            // error: "real" error
                            inlineResponse = new inlineChatSession_1.ErrorResponse(new Error(response.result.errorDetails.message));
                        }
                        else if (response.response.value.length === 0) {
                            // epmty response
                            inlineResponse = new inlineChatSession_1.EmptyResponse();
                        }
                        else {
                            // replay response
                            const markdownContent = new htmlContent_1.MarkdownString();
                            const raw = {
                                id: Math.random(),
                                type: "bulkEdit" /* InlineChatResponseType.BulkEdit */,
                                message: markdownContent,
                                edits: { edits: [] },
                            };
                            for (const item of response.response.value) {
                                if (item.kind === 'markdownContent') {
                                    markdownContent.value += item.content.value;
                                }
                                else if (item.kind === 'textEditGroup') {
                                    for (const group of item.edits) {
                                        for (const edit of group) {
                                            raw.edits.edits.push({
                                                resource: item.uri,
                                                textEdit: edit,
                                                versionId: undefined
                                            });
                                        }
                                    }
                                }
                            }
                            inlineResponse = this._instaService.createInstance(inlineChatSession_1.ReplyResponse, raw, markdownContent, session.textModelN.uri, modelAltVersionIdNow, [], e.request.id, e.request.response);
                        }
                    }
                    session.addExchange(new inlineChatSession_1.SessionExchange(session.lastInput, inlineResponse));
                    if (inlineResponse instanceof inlineChatSession_1.ReplyResponse && inlineResponse.untitledTextModel) {
                        this._textModelService.createModelReference(inlineResponse.untitledTextModel.resource).then(ref => {
                            store.add(ref);
                        });
                    }
                });
            }));
            store.add(this._chatService.onDidPerformUserAction(e => {
                if (e.sessionId !== chatModel.sessionId) {
                    return;
                }
                // TODO@jrieken VALIDATE candidate is proper, e.g check with `session.exchanges`
                const request = chatModel.getRequests().find(request => request.id === e.requestId);
                const candidate = request?.response?.result?.metadata?.inlineChatResponse;
                if (!candidate) {
                    return;
                }
                let kind;
                if (e.action.kind === 'vote') {
                    kind = e.action.direction === chatService_1.InteractiveSessionVoteDirection.Down ? 0 /* InlineChatResponseFeedbackKind.Unhelpful */ : 1 /* InlineChatResponseFeedbackKind.Helpful */;
                }
                else if (e.action.kind === 'bug') {
                    kind = 4 /* InlineChatResponseFeedbackKind.Bug */;
                }
                else if (e.action.kind === 'inlineChat') {
                    kind = e.action.action === 'accepted' ? 3 /* InlineChatResponseFeedbackKind.Accepted */ : 2 /* InlineChatResponseFeedbackKind.Undone */;
                }
                if (!kind) {
                    return;
                }
                provider.handleInlineChatResponseFeedback?.(rawSession, candidate, kind);
            }));
            store.add(this._inlineChatService.onDidChangeProviders(e => {
                if (e.removed === provider) {
                    this._logService.trace(`[IE] provider GONE for ${editor.getId()}, ${provider.extensionId}`);
                    this._releaseSession(session, true);
                }
            }));
            const id = (0, uuid_1.generateUuid)();
            const targetUri = textModel.uri;
            // AI edits happen in the actual model, keep a reference but make no copy
            store.add((await this._textModelService.createModelReference(textModel.uri)));
            const textModelN = textModel;
            // create: keep a snapshot of the "actual" model
            const textModel0 = store.add(this._modelService.createModel((0, textModel_1.createTextBufferFactoryFromSnapshot)(textModel.createSnapshot()), { languageId: textModel.getLanguageId(), onDidChange: event_1.Event.None }, targetUri.with({ scheme: network_1.Schemas.vscode, authority: 'inline-chat', path: '', query: new URLSearchParams({ id, 'textModel0': '' }).toString() }), true));
            // untitled documents are special and we are releasing their session when their last editor closes
            if (targetUri.scheme === network_1.Schemas.untitled) {
                store.add(this._editorService.onDidCloseEditor(() => {
                    if (!this._editorService.isOpened({ resource: targetUri, typeId: untitledTextEditorInput_1.UntitledTextEditorInput.ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id })) {
                        this._releaseSession(session, true);
                    }
                }));
            }
            let wholeRange = options.wholeRange;
            if (!wholeRange) {
                wholeRange = rawSession.wholeRange ? range_1.Range.lift(rawSession.wholeRange) : editor.getSelection();
            }
            if (token.isCancellationRequested) {
                store.dispose();
                return undefined;
            }
            const session = new inlineChatSession_1.Session(options.editMode, targetUri, textModel0, textModelN, provider, rawSession, store.add(new inlineChatSession_1.SessionWholeRange(textModelN, wholeRange)), store.add(new inlineChatSession_1.HunkData(this._editorWorkerService, textModel0, textModelN)), chatModel);
            // store: key -> session
            const key = this._key(editor, session.targetUri);
            if (this._sessions.has(key)) {
                store.dispose();
                throw new Error(`Session already stored for ${key}`);
            }
            this._sessions.set(key, { session, editor, store });
            return session;
        }
        moveSession(session, target) {
            const newKey = this._key(target, session.targetUri);
            const existing = this._sessions.get(newKey);
            if (existing) {
                if (existing.session !== session) {
                    throw new Error(`Cannot move session because the target editor already/still has one`);
                }
                else {
                    // noop
                    return;
                }
            }
            let found = false;
            for (const [oldKey, data] of this._sessions) {
                if (data.session === session) {
                    found = true;
                    this._sessions.delete(oldKey);
                    this._sessions.set(newKey, { ...data, editor: target });
                    this._logService.trace(`[IE] did MOVE session for ${data.editor.getId()} to NEW EDITOR ${target.getId()}, ${session.provider.extensionId}`);
                    this._onDidMoveSession.fire({ session, editor: target });
                    break;
                }
            }
            if (!found) {
                throw new Error(`Cannot move session because it is not stored`);
            }
        }
        releaseSession(session) {
            this._releaseSession(session, false);
        }
        _releaseSession(session, byServer) {
            let tuple;
            // cleanup
            for (const candidate of this._sessions) {
                if (candidate[1].session === session) {
                    // if (value.session === session) {
                    tuple = candidate;
                    break;
                }
            }
            if (!tuple) {
                // double remove
                return;
            }
            this._keepRecording(session);
            this._telemetryService.publicLog2('interactiveEditor/session', session.asTelemetryData());
            const [key, value] = tuple;
            this._sessions.delete(key);
            this._logService.trace(`[IE] did RELEASED session for ${value.editor.getId()}, ${session.provider.extensionId}`);
            this._onDidEndSession.fire({ editor: value.editor, session, endedByExternalCause: byServer });
            value.store.dispose();
        }
        stashSession(session, editor, undoCancelEdits) {
            this._keepRecording(session);
            const result = this._instaService.createInstance(inlineChatSession_1.StashedSession, editor, session, undoCancelEdits);
            this._onDidStashSession.fire({ editor, session });
            this._logService.trace(`[IE] did STASH session for ${editor.getId()}, ${session.provider.extensionId}`);
            return result;
        }
        getCodeEditor(session) {
            for (const [, data] of this._sessions) {
                if (data.session === session) {
                    return data.editor;
                }
            }
            throw new Error('session not found');
        }
        getSession(editor, uri) {
            const key = this._key(editor, uri);
            return this._sessions.get(key)?.session;
        }
        _key(editor, uri) {
            const item = this._keyComputers.get(uri.scheme);
            return item
                ? item.getComparisonKey(editor, uri)
                : `${editor.getId()}@${uri.toString()}`;
        }
        registerSessionKeyComputer(scheme, value) {
            this._keyComputers.set(scheme, value);
            return (0, lifecycle_1.toDisposable)(() => this._keyComputers.delete(scheme));
        }
        // --- debug
        _keepRecording(session) {
            const newLen = this._recordings.unshift(session.asRecording());
            if (newLen > 5) {
                this._recordings.pop();
            }
        }
        recordings() {
            return this._recordings;
        }
    };
    exports.InlineChatSessionServiceImpl = InlineChatSessionServiceImpl;
    exports.InlineChatSessionServiceImpl = InlineChatSessionServiceImpl = __decorate([
        __param(0, inlineChat_1.IInlineChatService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, model_1.IModelService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, editorWorker_1.IEditorWorkerService),
        __param(5, log_1.ILogService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, editorService_1.IEditorService),
        __param(8, chatService_1.IChatService),
        __param(9, chatAgents_1.IChatAgentService),
        __param(10, chatVariables_1.IChatVariablesService)
    ], InlineChatSessionServiceImpl);
    let AgentInlineChatProvider = class AgentInlineChatProvider {
        constructor(agent, _chatAgentService) {
            this.agent = agent;
            this._chatAgentService = _chatAgentService;
            this.label = agent.name;
            this.extensionId = agent.extensionId;
            this.supportIssueReporting = agent.metadata.supportIssueReporting;
        }
        async prepareInlineChatSession(model, range, token) {
            // TODO@jrieken have a good welcome message
            // const welcomeMessage = await this.agent.provideWelcomeMessage?.(ChatAgentLocation.Editor, token);
            // const message =  welcomeMessage?.filter(candidate => typeof candidate === 'string').join(''),
            return {
                id: Math.random(),
                wholeRange: new range_1.Range(range.selectionStartLineNumber, range.selectionStartColumn, range.positionLineNumber, range.positionColumn),
                placeholder: this.agent.description,
                slashCommands: this.agent.slashCommands.map(agentCommand => {
                    return {
                        command: agentCommand.name,
                        detail: agentCommand.description,
                        refer: agentCommand.name === 'explain' // TODO@jrieken @joyceerhl this should be cleaned up
                    };
                })
            };
        }
        async provideResponse(item, request, progress, token) {
            const workspaceEdit = { edits: [] };
            await this._chatAgentService.invokeAgent(this.agent.id, {
                sessionId: String(item.id),
                requestId: request.requestId,
                agentId: this.agent.id,
                message: request.prompt,
                location: chatAgents_1.ChatAgentLocation.Editor,
                variables: {
                    variables: [{
                            name: InlineChatContext.variableName,
                            values: [{
                                    level: 'full',
                                    value: JSON.stringify(new InlineChatContext(request.previewDocument, request.selection, request.wholeRange))
                                }]
                        }]
                }
            }, part => {
                if (part.kind === 'markdownContent') {
                    progress.report({ markdownFragment: part.content.value });
                }
                else if (part.kind === 'agentDetection') {
                    progress.report({ slashCommand: part.command?.name });
                }
                else if (part.kind === 'textEdit') {
                    if ((0, resources_1.isEqual)(request.previewDocument, part.uri)) {
                        progress.report({ edits: part.edits });
                    }
                    else {
                        for (const textEdit of part.edits) {
                            workspaceEdit.edits.push({ resource: part.uri, textEdit, versionId: undefined });
                        }
                    }
                }
            }, [], token);
            return {
                type: "bulkEdit" /* InlineChatResponseType.BulkEdit */,
                id: Math.random(),
                edits: workspaceEdit
            };
        }
    };
    exports.AgentInlineChatProvider = AgentInlineChatProvider;
    exports.AgentInlineChatProvider = AgentInlineChatProvider = __decorate([
        __param(1, chatAgents_1.IChatAgentService)
    ], AgentInlineChatProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFNlc3Npb25TZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvYnJvd3Nlci9pbmxpbmVDaGF0U2Vzc2lvblNlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUEyQ0EsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBVztRQUVoQixZQUNrQixLQUFxQixFQUNyQixTQUEyQyxFQUMzQyxpQkFBMEcsRUFDbkYsYUFBb0M7WUFIM0QsVUFBSyxHQUFMLEtBQUssQ0FBZ0I7WUFDckIsY0FBUyxHQUFULFNBQVMsQ0FBa0M7WUFDM0Msc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF5RjtZQUNuRixrQkFBYSxHQUFiLGFBQWEsQ0FBdUI7UUFDekUsQ0FBQztRQUdHLHlCQUF5QixDQUFDLE9BQTBCO1lBQzNELElBQUksSUFBNkIsQ0FBQztZQUNsQyxLQUFLLE1BQU0sU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEtBQUssT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNqRSxJQUFJLEdBQUcsU0FBUyxDQUFDO29CQUNqQixNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUEwQixFQUFFLFFBQXVDLEVBQUUsUUFBa0MsRUFBRSxLQUF3QjtZQUU3SSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxJQUFJ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