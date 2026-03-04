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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/objects", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/core/offsetRange", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatService"], function (require, exports, arrays_1, async_1, event_1, htmlContent_1, lifecycle_1, marshalling_1, objects_1, resources_1, uri_1, uuid_1, offsetRange_1, instantiation_1, log_1, chatAgents_1, chatParserTypes_1, chatService_1) {
    "use strict";
    var ChatModel_1, ChatWelcomeMessageModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatWelcomeMessageModel = exports.ChatModel = exports.ChatModelInitState = exports.ChatResponseModel = exports.Response = exports.ChatRequestModel = void 0;
    exports.isExportableSessionData = isExportableSessionData;
    exports.isSerializableSessionData = isSerializableSessionData;
    exports.getHistoryEntriesFromModel = getHistoryEntriesFromModel;
    exports.updateRanges = updateRanges;
    exports.canMergeMarkdownStrings = canMergeMarkdownStrings;
    class ChatRequestModel {
        static { this.nextId = 0; }
        get id() {
            return this._id;
        }
        get username() {
            return this.session.requesterUsername;
        }
        get avatarIconUri() {
            return this.session.requesterAvatarIconUri;
        }
        get attempt() {
            return this._attempt;
        }
        get variableData() {
            return this._variableData;
        }
        set variableData(v) {
            this._variableData = v;
        }
        constructor(session, message, _variableData, _attempt = 0) {
            this.session = session;
            this.message = message;
            this._variableData = _variableData;
            this._attempt = _attempt;
            this._id = 'request_' + ChatRequestModel.nextId++;
        }
    }
    exports.ChatRequestModel = ChatRequestModel;
    class Response {
        get onDidChangeValue() {
            return this._onDidChangeValue.event;
        }
        get value() {
            return this._responseParts;
        }
        constructor(value) {
            this._onDidChangeValue = new event_1.Emitter();
            this._responseParts = (0, arrays_1.asArray)(value).map((v) => ((0, htmlContent_1.isMarkdownString)(v) ?
                { content: v, kind: 'markdownContent' } :
                'kind' in v ? v : { kind: 'treeData', treeData: v }));
            this._updateRepr(true);
        }
        asString() {
            return this._responseRepr;
        }
        clear() {
            this._responseParts = [];
            this._updateRepr(true);
        }
        updateContent(progress, quiet) {
            if (progress.kind === 'markdownContent') {
                const responsePartLength = this._responseParts.length - 1;
                const lastResponsePart = this._responseParts[responsePartLength];
                if (!lastResponsePart || lastResponsePart.kind !== 'markdownContent' || !canMergeMarkdownStrings(lastResponsePart.content, progress.content)) {
                    // The last part can't be merged with- not markdown, or markdown with different permissions
                    this._responseParts.push(progress);
                }
                else {
                    lastResponsePart.content = {
                        value: lastResponsePart.content.value + progress.content.value,
                        isTrusted: lastResponsePart.content.isTrusted,
                        supportThemeIcons: lastResponsePart.content.supportThemeIcons,
                        supportHtml: lastResponsePart.content.supportHtml,
                        baseUri: lastResponsePart.content.baseUri
                    };
                }
                this._updateRepr(quiet);
            }
            else if (progress.kind === 'textEdit') {
                if (progress.edits.length > 0) {
                    // merge text edits for the same file no matter when they come in
                    let found = false;
                    for (let i = 0; !found && i < this._responseParts.length; i++) {
                        const candidate = this._responseParts[i];
                        if (candidate.kind === 'textEditGroup' && (0, resources_1.isEqual)(candidate.uri, progress.uri)) {
                            candidate.edits.push(progress.edits);
                            found = true;
                        }
                    }
                    if (!found) {
                        this._responseParts.push({
                            kind: 'textEditGroup',
                            uri: progress.uri,
                            edits: [progress.edits]
                        });
                    }
                    this._updateRepr(quiet);
                }
            }
            else {
                this._responseParts.push(progress);
                this._updateRepr(quiet);
            }
        }
        _updateRepr(quiet) {
            this._responseRepr = this._responseParts.map(part => {
                if (part.kind === 'treeData') {
                    return '';
                }
                else if (part.kind === 'inlineReference') {
                    return (0, resources_1.basename)('uri' in part.inlineReference ? part.inlineReference.uri : part.inlineReference);
                }
                else if (part.kind === 'command') {
                    return part.command.title;
                }
                else if (part.kind === 'textEditGroup') {
                    return '';
                }
                else {
                    return part.content.value;
                }
            }).join('\n\n');
            if (!quiet) {
                this._onDidChangeValue.fire();
            }
        }
    }
    exports.Response = Response;
    class ChatResponseModel extends lifecycle_1.Disposable {
        static { this.nextId = 0; }
        get id() {
            return this._id;
        }
        get isComplete() {
            return this._isComplete;
        }
        get isCanceled() {
            return this._isCanceled;
        }
        get vote() {
            return this._vote;
        }
        get followups() {
            return this._followups;
        }
        get response() {
            return this._response;
        }
        get result() {
            return this._result;
        }
        get username() {
            return this.session.responderUsername;
        }
        get avatarIcon() {
            return this.session.responderAvatarIcon;
        }
        get agent() {
            return this._agent;
        }
        get slashCommand() {
            return this._slashCommand;
        }
        get agentOrSlashCommandDetected() {
            return this._agentOrSlashCommandDetected ?? false;
        }
        get usedContext() {
            return this._usedContext;
        }
        get contentReferences() {
            return this._contentReferences;
        }
        get progressMessages() {
            return this._progressMessages;
        }
        get isStale() {
            return this._isStale;
        }
        constructor(_response, session, _agent, _slashCommand, requestId, _isComplete = false, _isCanceled = false, _vote, _result, followups) {
            super();
            this.session = session;
            this._agent = _agent;
            this._slashCommand = _slashCommand;
            this.requestId = requestId;
            this._isComplete = _isComplete;
            this._isCanceled = _isCanceled;
            this._vote = _vote;
            this._result = _result;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._contentReferences = [];
            this._progressMessages = [];
            this._isStale = false;
            // If we are creating a response with some existing content, consider it stale
            this._isStale = Array.isArray(_response) && (_response.length !== 0 || (0, htmlContent_1.isMarkdownString)(_response) && _response.value.length !== 0);
            this._followups = followups ? [...followups] : undefined;
            this._response = new Response(_response);
            this._register(this._response.onDidChangeValue(() => this._onDidChange.fire()));
            this._id = 'response_' + ChatResponseModel.nextId++;
        }
        /**
         * Apply a progress update to the actual response content.
         */
        updateContent(responsePart, quiet) {
            this._response.updateContent(responsePart, quiet);
        }
        /**
         * Apply one of the progress updates that are not part of the actual response content.
         */
        applyReference(progress) {
            if (progress.kind === 'usedContext') {
                this._usedContext = progress;
            }
            else if (progress.kind === 'reference') {
                this._contentReferences.push(progress);
                this._onDidChange.fire();
            }
        }
        setAgent(agent, slashCommand) {
            this._agent = agent;
            this._slashCommand = slashCommand;
            this._agentOrSlashCommandDetected = true;
            this._onDidChange.fire();
        }
        setResult(result) {
            this._result = result;
            this._onDidChange.fire();
        }
        complete() {
            if (this._result?.errorDetails?.responseIsRedacted) {
                this._response.clear();
            }
            this._isComplete = true;
            this._onDidChange.fire();
        }
        cancel() {
            this._isComplete = true;
            this._isCanceled = true;
            this._onDidChange.fire();
        }
        setFollowups(followups) {
            this._followups = followups;
            this._onDidChange.fire(); // Fire so that command followups get rendered on the row
        }
        setVote(vote) {
            this._vote = vote;
            this._onDidChange.fire();
        }
        setEditApplied(edit, editCount) {
            if (!this.response.value.includes(edit)) {
                return false;
            }
            if (!edit.state) {
                return false;
            }
            edit.state.applied = editCount; // must not be edit.edits.length
            this._onDidChange.fire();
            return true;
        }
    }
    exports.ChatResponseModel = ChatResponseModel;
    function isExportableSessionData(obj) {
        const data = obj;
        return typeof data === 'object' &&
            typeof data.requesterUsername === 'string';
    }
    function isSerializableSessionData(obj) {
        const data = obj;
        return isExportableSessionData(obj) &&
            typeof data.creationDate === 'number' &&
            typeof data.sessionId === 'string' &&
            obj.requests.every((request) => !request.usedContext /* for backward compat allow missing usedContext */ || (0, chatService_1.isIUsedContext)(request.usedContext));
    }
    var ChatModelInitState;
    (function (ChatModelInitState) {
        ChatModelInitState[ChatModelInitState["Created"] = 0] = "Created";
        ChatModelInitState[ChatModelInitState["Initializing"] = 1] = "Initializing";
        ChatModelInitState[ChatModelInitState["Initialized"] = 2] = "Initialized";
    })(ChatModelInitState || (exports.ChatModelInitState = ChatModelInitState = {}));
    let ChatModel = ChatModel_1 = class ChatModel extends lifecycle_1.Disposable {
        static getDefaultTitle(requests) {
            const firstRequestMessage = (0, arrays_1.firstOrDefault)(requests)?.message ?? '';
            const message = typeof firstRequestMessage === 'string' ?
                firstRequestMessage :
                firstRequestMessage.text;
            return message.split('\n')[0].substring(0, 50);
        }
        get welcomeMessage() {
            return this._welcomeMessage;
        }
        get sessionId() {
            return this._sessionId;
        }
        get requestInProgress() {
            const lastRequest = this._requests[this._requests.length - 1];
            return !!lastRequest && !!lastRequest.response && !lastRequest.response.isComplete;
        }
        get hasRequests() {
            return this._requests.length > 0;
        }
        get creationDate() {
            return this._creationDate;
        }
        get _defaultAgent() {
            return this.chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel);
        }
        get requesterUsername() {
            return (this._defaultAgent ?
                this._defaultAgent.metadata.requester?.name :
                this.initialData?.requesterUsername) ?? '';
        }
        get responderUsername() {
            return (this._defaultAgent ?
                this._defaultAgent.metadata.fullName :
                this.initialData?.responderUsername) ?? '';
        }
        get requesterAvatarIconUri() {
            return this._defaultAgent ?
                this._defaultAgent.metadata.requester?.icon :
                this._initialRequesterAvatarIconUri;
        }
        get responderAvatarIcon() {
            return this._defaultAgent ?
                this._defaultAgent?.metadata.themeIcon :
                this._initialResponderAvatarIconUri;
        }
        get initState() {
            return this._initState;
        }
        get isImported() {
            return this._isImported;
        }
        get title() {
            return ChatModel_1.getDefaultTitle(this._requests);
        }
        get initialLocation() {
            return this._initialLocation;
        }
        constructor(initialData, _initialLocation, logService, chatAgentService, instantiationService) {
            super();
            this.initialData = initialData;
            this._initialLocation = _initialLocation;
            this.logService = logService;
            this.chatAgentService = chatAgentService;
            this.instantiationService = instantiationService;
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._initState = ChatModelInitState.Created;
            this._isInitializedDeferred = new async_1.DeferredPromise();
            this._isImported = false;
            this._isImported = (!!initialData && !isSerializableSessionData(initialData)) || (initialData?.isImported ?? false);
            this._sessionId = (isSerializableSessionData(initialData) && initialData.sessionId) || (0, uuid_1.generateUuid)();
            this._requests = initialData ? this._deserialize(initialData) : [];
            this._creationDate = (isSerializableSessionData(initialData) && initialData.creationDate) || Date.now();
            this._initialRequesterAvatarIconUri = initialData?.requesterAvatarIconUri && uri_1.URI.revive(initialData.requesterAvatarIconUri);
            this._initialResponderAvatarIconUri = (0, uri_1.isUriComponents)(initialData?.responderAvatarIconUri) ? uri_1.URI.revive(initialData.responderAvatarIconUri) : initialData?.responderAvatarIconUri;
        }
        _deserialize(obj) {
            const requests = obj.requests;
            if (!Array.isArray(requests)) {
                this.logService.error(`Ignoring malformed session data: ${JSON.stringify(obj)}`);
                return [];
            }
            if (obj.welcomeMessage) {
                const content = obj.welcomeMessage.map(item => typeof item === 'string' ? new htmlContent_1.MarkdownString(item) : item);
                this._welcomeMessage = this.instantiationService.createInstance(ChatWelcomeMessageModel, content, []);
            }
            try {
                return requests.map((raw) => {
                    const parsedRequest = typeof raw.message === 'string'
                        ? this.getParsedRequestFromString(raw.message)
                        : (0, chatParserTypes_1.reviveParsedChatRequest)(raw.message);
                    // Old messages don't have variableData, or have it in the wrong (non-array) shape
                    const variableData = raw.variableData && Array.isArray(raw.variableData.variables)
                        ? raw.variableData :
                        { variables: [] };
                    const request = new ChatRequestModel(this, parsedRequest, variableData);
                    if (raw.response || raw.result || raw.responseErrorDetails) {
                        const agent = (raw.agent && 'metadata' in raw.agent) ? // Check for the new format, ignore entries in the old format
                            this.reviveSerializedAgent(raw.agent) : undefined;
                        // Port entries from old format
                        const result = 'responseErrorDetails' in raw ?
                            { errorDetails: raw.responseErrorDetails } : raw.result;
                        request.response = new ChatResponseModel(raw.response ?? [new htmlContent_1.MarkdownString(raw.response)], this, agent, raw.slashCommand, request.id, true, raw.isCanceled, raw.vote, result, raw.followups);
                        if (raw.usedContext) { // @ulugbekna: if this's a new vscode sessions, doc versions are incorrect anyway?
                            request.response.applyReference((0, marshalling_1.revive)(raw.usedContext));
                        }
                        if (raw.contentReferences) {
                            raw.contentReferences.forEach(r => request.response.applyReference((0, marshalling_1.revive)(r)));
                        }
                    }
                    return request;
                });
            }
            catch (error) {
                this.logService.error('Failed to parse chat data', error);
                return [];
            }
        }
        reviveSerializedAgent(raw) {
            const agent = 'name' in raw ?
                raw :
                {
                    ...raw,
                    name: raw.id,
                };
            // Fill in required fields that may be missing from old data
            if (!('extensionPublisherId' in agent)) {
                agent.extensionPublisherId = agent.extensionPublisher ?? '';
            }
            if (!('extensionDisplayName' in agent)) {
                agent.extensionDisplayName = '';
            }
            return (0, marshalling_1.revive)(agent);
        }
        getParsedRequestFromString(message) {
            // TODO These offsets won't be used, but chat replies need to go through the parser as well
            const parts = [new chatParserTypes_1.ChatRequestTextPart(new offsetRange_1.OffsetRange(0, message.length), { startColumn: 1, startLineNumber: 1, endColumn: 1, endLineNumber: 1 }, message)];
            return {
                text: message,
                parts
            };
        }
        startInitialize() {
            if (this.initState !== ChatModelInitState.Created) {
                throw new Error(`ChatModel is in the wrong state for startInitialize: ${ChatModelInitState[this.initState]}`);
            }
            this._initState = ChatModelInitState.Initializing;
        }
        deinitialize() {
            this._initState = ChatModelInitState.Created;
            this._isInitializedDeferred = new async_1.DeferredPromise();
        }
        initialize(welcomeMessage) {
            if (this.initState !== ChatModelInitState.Initializing) {
                // Must call startInitialize before initialize, and only call it once
                throw new Error(`ChatModel is in the wrong state for initialize: ${ChatModelInitState[this.initState]}`);
            }
            this._initState = ChatModelInitState.Initialized;
            if (!this._welcomeMessage) {
                // Could also have loaded the welcome message from persisted data
                this._welcomeMessage = welcomeMessage;
            }
            this._isInitializedDeferred.complete();
            this._onDidChange.fire({ kind: 'initialize' });
        }
        setInitializationError(error) {
            if (this.initState !== ChatModelInitState.Initializing) {
                throw new Error(`ChatModel is in the wrong state for setInitializationError: ${ChatModelInitState[this.initState]}`);
            }
            if (!this._isInitializedDeferred.isSettled) {
                this._isInitializedDeferred.error(error);
            }
        }
        waitForInitialization() {
            return this._isInitializedDeferred.p;
        }
        getRequests() {
            return this._requests;
        }
        addRequest(message, variableData, attempt, chatAgent, slashCommand) {
            const request = new ChatRequestModel(this, message, variableData, attempt);
            request.response = new ChatResponseModel([], this, chatAgent, slashCommand, request.id);
            this._requests.push(request);
            this._onDidChange.fire({ kind: 'addRequest', request });
            return request;
        }
        acceptResponseProgress(request, progress, quiet) {
            if (!request.response) {
                request.response = new ChatResponseModel([], this, undefined, undefined, request.id);
            }
            if (request.response.isComplete) {
                throw new Error('acceptResponseProgress: Adding progress to a completed response');
            }
            if (progress.kind === 'markdownContent' || progress.kind === 'treeData' || progress.kind === 'inlineReference' || progress.kind === 'markdownVuln' || progress.kind === 'progressMessage' || progress.kind === 'command' || progress.kind === 'textEdit') {
                request.response.updateContent(progress, quiet);
            }
            else if (progress.kind === 'usedContext' || progress.kind === 'reference') {
                request.response.applyReference(progress);
            }
            else if (progress.kind === 'agentDetection') {
                const agent = this.chatAgentService.getAgent(progress.agentId);
                if (agent) {
                    request.response.setAgent(agent, progress.command);
                }
            }
            else {
                this.logService.error(`Couldn't handle progress: ${JSON.stringify(progress)}`);
            }
        }
        removeRequest(id) {
            const index = this._requests.findIndex(request => request.id === id);
            const request = this._requests[index];
            if (index !== -1) {
                this._onDidChange.fire({ kind: 'removeRequest', requestId: request.id, responseId: request.response?.id });
                this._requests.splice(index, 1);
                request.response?.dispose();
            }
        }
        cancelRequest(request) {
            if (request.response) {
                request.response.cancel();
            }
        }
        setResponse(request, result) {
            if (!request.response) {
                request.response = new ChatResponseModel([], this, undefined, undefined, request.id);
            }
            request.response.setResult(result);
        }
        completeResponse(request) {
            if (!request.response) {
                throw new Error('Call setResponse before completeResponse');
            }
            request.response.complete();
        }
        setFollowups(request, followups) {
            if (!request.response) {
                // Maybe something went wrong?
                return;
            }
            request.response.setFollowups(followups);
        }
        setResponseModel(request, response) {
            request.response = response;
            this._onDidChange.fire({ kind: 'addResponse', response });
        }
        toExport() {
            return {
                requesterUsername: this.requesterUsername,
                requesterAvatarIconUri: this.requesterAvatarIconUri,
                responderUsername: this.responderUsername,
                responderAvatarIconUri: this.responderAvatarIcon,
                initialLocation: this.initialLocation,
                welcomeMessage: this._welcomeMessage?.content.map(c => {
                    if (Array.isArray(c)) {
                        return c;
                    }
                    else {
                        return c.value;
                    }
                }),
                requests: this._requests.map((r) => {
                    const message = {
                        ...r.message,
                        parts: r.message.parts.map(p => p && 'toJSON' in p ? p.toJSON() : p)
                    };
                    return {
                        message,
                        variableData: r.variableData,
                        response: r.response ?
                            r.response.response.value.map(item => {
                                // Keeping the shape of the persisted data the same for back compat
                                if (item.kind === 'treeData') {
                                    return item.treeData;
                                }
                                else if (item.kind === 'markdownContent') {
                                    return item.content;
                                }
                                else {
                                    return item; // TODO
                                }
                            })
                            : undefined,
                        result: r.response?.result,
                        followups: r.response?.followups,
                        isCanceled: r.response?.isCanceled,
                        vote: r.response?.vote,
                        agent: r.response?.agent ? { ...r.response.agent } : undefined,
                        slashCommand: r.response?.slashCommand,
                        usedContext: r.response?.usedContext,
                        contentReferences: r.response?.contentReferences
                    };
                }),
            };
        }
        toJSON() {
            return {
                ...this.toExport(),
                sessionId: this.sessionId,
                creationDate: this._creationDate,
                isImported: this._isImported
            };
        }
        dispose() {
            this._requests.forEach(r => r.response?.dispose());
            this._onDidDispose.fire();
            super.dispose();
        }
    };
    exports.ChatModel = ChatModel;
    exports.ChatModel = ChatModel = ChatModel_1 = __decorate([
        __param(2, log_1.ILogService),
        __param(3, chatAgents_1.IChatAgentService),
        __param(4, instantiation_1.IInstantiationService)
    ], ChatModel);
    let ChatWelcomeMessageModel = class ChatWelcomeMessageModel {
        static { ChatWelcomeMessageModel_1 = this; }
        static { this.nextId = 0; }
        get id() {
            return this._id;
        }
        constructor(content, sampleQuestions, chatAgentService) {
            this.content = content;
            this.sampleQuestions = sampleQuestions;
            this.chatAgentService = chatAgentService;
            this._id = 'welcome_' + ChatWelcomeMessageModel_1.nextId++;
        }
        get username() {
            return this.chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel)?.metadata.fullName ?? '';
        }
        get avatarIcon() {
            return this.chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel)?.metadata.themeIcon;
        }
    };
    exports.ChatWelcomeMessageModel = ChatWelcomeMessageModel;
    exports.ChatWelcomeMessageModel = ChatWelcomeMessageModel = ChatWelcomeMessageModel_1 = __decorate([
        __param(2, chatAgents_1.IChatAgentService)
    ], ChatWelcomeMessageModel);
    function getHistoryEntriesFromModel(model, forAgentId) {
        const history = [];
        for (const request of model.getRequests()) {
            if (!request.response) {
                continue;
            }
            if (forAgentId && forAgentId !== request.response.agent?.id) {
                // An agent only gets to see requests that were sent to this agent.
                // The default agent (the undefined case) gets to see all of them.
                continue;
            }
            const promptTextResult = (0, chatParserTypes_1.getPromptText)(request.message);
            const historyRequest = {
                sessionId: model.sessionId,
                requestId: request.id,
                agentId: request.response.agent?.id ?? '',
                message: promptTextResult.message,
                command: request.response.slashCommand?.name,
                variables: updateRanges(request.variableData, promptTextResult.diff), // TODO bit of a hack
                location: chatAgents_1.ChatAgentLocation.Panel
            };
            history.push({ request: historyRequest, response: request.response.response.value, result: request.response.result ?? {} });
        }
        return history;
    }
    function updateRanges(variableData, diff) {
        return {
            variables: variableData.variables.map(v => ({
                ...v,
                range: v.range && {
                    start: v.range.start - diff,
                    endExclusive: v.range.endExclusive - diff
                }
            }))
        };
    }
    function canMergeMarkdownStrings(md1, md2) {
        if (md1.baseUri && md2.baseUri) {
            const baseUriEquals = md1.baseUri.scheme === md2.baseUri.scheme
                && md1.baseUri.authority === md2.baseUri.authority
                && md1.baseUri.path === md2.baseUri.path
                && md1.baseUri.query === md2.baseUri.query
                && md1.baseUri.fragment === md2.baseUri.fragment;
            if (!baseUriEquals) {
                return false;
            }
        }
        else if (md1.baseUri || md2.baseUri) {
            return false;
        }
        return (0, objects_1.equals)(md1.isTrusted, md2.isTrusted) &&
            md1.supportHtml === md2.supportHtml &&
            md1.supportThemeIcons === md2.supportThemeIcons;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9jb21tb24vY2hhdE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE4Y2hHLDBEQUlDO0lBRUQsOERBUUM7SUEwYkQsZ0VBMkJDO0lBRUQsb0NBVUM7SUFFRCwwREFpQkM7SUE3MkJELE1BQWEsZ0JBQWdCO2lCQUNiLFdBQU0sR0FBRyxDQUFDLENBQUM7UUFLMUIsSUFBVyxFQUFFO1lBQ1osT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxJQUFXLFFBQVE7WUFDbEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO1FBQ3ZDLENBQUM7UUFFRCxJQUFXLGFBQWE7WUFDdkIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDO1FBQzVDLENBQUM7UUFFRCxJQUFXLE9BQU87WUFDakIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxJQUFXLFlBQVk7WUFDdEIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7UUFFRCxJQUFXLFlBQVksQ0FBQyxDQUEyQjtZQUNsRCxJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBRUQsWUFDaUIsT0FBa0IsRUFDbEIsT0FBMkIsRUFDbkMsYUFBdUMsRUFDdkMsV0FBbUIsQ0FBQztZQUhaLFlBQU8sR0FBUCxPQUFPLENBQVc7WUFDbEIsWUFBTyxHQUFQLE9BQU8sQ0FBb0I7WUFDbkMsa0JBQWEsR0FBYixhQUFhLENBQTBCO1lBQ3ZDLGFBQVEsR0FBUixRQUFRLENBQVk7WUFFNUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbkQsQ0FBQzs7SUFyQ0YsNENBc0NDO0lBRUQsTUFBYSxRQUFRO1FBRXBCLElBQVcsZ0JBQWdCO1lBQzFCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztRQUNyQyxDQUFDO1FBT0QsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQzVCLENBQUM7UUFFRCxZQUFZLEtBQXNLO1lBZDFLLHNCQUFpQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFlL0MsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFBLGdCQUFPLEVBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUEsOEJBQWdCLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBaUMsQ0FBQyxDQUFDO2dCQUN4RSxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXZELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUVELFFBQVE7WUFDUCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFFRCxhQUFhLENBQUMsUUFBc0QsRUFBRSxLQUFlO1lBQ3BGLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBRWpFLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLEtBQUssaUJBQWlCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQzlJLDJGQUEyRjtvQkFDM0YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3BDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxnQkFBZ0IsQ0FBQyxPQUFPLEdBQUc7d0JBQzFCLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSzt3QkFDOUQsU0FBUyxFQUFFLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxTQUFTO3dCQUM3QyxpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsaUJBQWlCO3dCQUM3RCxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFdBQVc7d0JBQ2pELE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsT0FBTztxQkFDZixDQUFDO2dCQUM3QixDQUFDO2dCQUNELElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekIsQ0FBQztpQkFBTSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3pDLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQy9CLGlFQUFpRTtvQkFDakUsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO29CQUNsQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDL0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDekMsSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLGVBQWUsSUFBSSxJQUFBLG1CQUFPLEVBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQzs0QkFDaEYsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUNyQyxLQUFLLEdBQUcsSUFBSSxDQUFDO3dCQUNkLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ1osSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUM7NEJBQ3hCLElBQUksRUFBRSxlQUFlOzRCQUNyQixHQUFHLEVBQUUsUUFBUSxDQUFDLEdBQUc7NEJBQ2pCLEtBQUssRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7eUJBQ3ZCLENBQUMsQ0FBQztvQkFDSixDQUFDO29CQUNELElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3pCLENBQUM7WUFFRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUM7UUFFTyxXQUFXLENBQUMsS0FBZTtZQUNsQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNuRCxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7b0JBQzlCLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLGlCQUFpQixFQUFFLENBQUM7b0JBQzVDLE9BQU8sSUFBQSxvQkFBUSxFQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNsRyxDQUFDO3FCQUFNLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDcEMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztnQkFDM0IsQ0FBQztxQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssZUFBZSxFQUFFLENBQUM7b0JBQzFDLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO2dCQUMzQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRWhCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDL0IsQ0FBQztRQUNGLENBQUM7S0FDRDtJQWhHRCw0QkFnR0M7SUFFRCxNQUFhLGlCQUFrQixTQUFRLHNCQUFVO2lCQUlqQyxXQUFNLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFHMUIsSUFBVyxFQUFFO1lBQ1osT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxJQUFXLFVBQVU7WUFDcEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFXLFVBQVU7WUFDcEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFXLElBQUk7WUFDZCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVELElBQVcsU0FBUztZQUNuQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQUdELElBQVcsUUFBUTtZQUNsQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDdkIsQ0FBQztRQUVELElBQVcsTUFBTTtZQUNoQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVELElBQVcsUUFBUTtZQUNsQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUM7UUFDdkMsQ0FBQztRQUVELElBQVcsVUFBVTtZQUNwQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUM7UUFDekMsQ0FBQztRQUlELElBQVcsS0FBSztZQUNmLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBVyxZQUFZO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBR0QsSUFBVywyQkFBMkI7WUFDckMsT0FBTyxJQUFJLENBQUMsNEJBQTRCLElBQUksS0FBSyxDQUFDO1FBQ25ELENBQUM7UUFHRCxJQUFXLFdBQVc7WUFDckIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFHRCxJQUFXLGlCQUFpQjtZQUMzQixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztRQUNoQyxDQUFDO1FBR0QsSUFBVyxnQkFBZ0I7WUFDMUIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDL0IsQ0FBQztRQUdELElBQVcsT0FBTztZQUNqQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVELFlBQ0MsU0FBMEssRUFDMUosT0FBa0IsRUFDMUIsTUFBa0MsRUFDbEMsYUFBNEMsRUFDcEMsU0FBaUIsRUFDekIsY0FBdUIsS0FBSyxFQUM1QixjQUFjLEtBQUssRUFDbkIsS0FBdUMsRUFDdkMsT0FBMEIsRUFDbEMsU0FBd0M7WUFFeEMsS0FBSyxFQUFFLENBQUM7WUFWUSxZQUFPLEdBQVAsT0FBTyxDQUFXO1lBQzFCLFdBQU0sR0FBTixNQUFNLENBQTRCO1lBQ2xDLGtCQUFhLEdBQWIsYUFBYSxDQUErQjtZQUNwQyxjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ3pCLGdCQUFXLEdBQVgsV0FBVyxDQUFpQjtZQUM1QixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNuQixVQUFLLEdBQUwsS0FBSyxDQUFrQztZQUN2QyxZQUFPLEdBQVAsT0FBTyxDQUFtQjtZQXZGbEIsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMzRCxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBOEQ5Qix1QkFBa0IsR0FBNEIsRUFBRSxDQUFDO1lBS2pELHNCQUFpQixHQUEyQixFQUFFLENBQUM7WUFLeEQsYUFBUSxHQUFZLEtBQUssQ0FBQztZQW1CakMsOEVBQThFO1lBQzlFLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLElBQUEsOEJBQWdCLEVBQUMsU0FBUyxDQUFDLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFcEksSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3pELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLElBQUksQ0FBQyxHQUFHLEdBQUcsV0FBVyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3JELENBQUM7UUFFRDs7V0FFRztRQUNILGFBQWEsQ0FBQyxZQUEwRCxFQUFFLEtBQWU7WUFDeEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRDs7V0FFRztRQUNILGNBQWMsQ0FBQyxRQUFrRDtZQUNoRSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssYUFBYSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDO1lBQzlCLENBQUM7aUJBQU0sSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUMxQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzFCLENBQUM7UUFDRixDQUFDO1FBRUQsUUFBUSxDQUFDLEtBQXFCLEVBQUUsWUFBZ0M7WUFDL0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7WUFDbEMsSUFBSSxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQztZQUN6QyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFRCxTQUFTLENBQUMsTUFBd0I7WUFDakMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRUQsUUFBUTtZQUNQLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN4QixDQUFDO1lBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDeEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVELFlBQVksQ0FBQyxTQUFzQztZQUNsRCxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMseURBQXlEO1FBQ3BGLENBQUM7UUFFRCxPQUFPLENBQUMsSUFBcUM7WUFDNUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRUQsY0FBYyxDQUFDLElBQXdCLEVBQUUsU0FBaUI7WUFDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN6QyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsQ0FBQyxnQ0FBZ0M7WUFDaEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN6QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7O0lBeEtGLDhDQXlLQztJQXdERCxTQUFnQix1QkFBdUIsQ0FBQyxHQUFZO1FBQ25ELE1BQU0sSUFBSSxHQUFHLEdBQTBCLENBQUM7UUFDeEMsT0FBTyxPQUFPLElBQUksS0FBSyxRQUFRO1lBQzlCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixLQUFLLFFBQVEsQ0FBQztJQUM3QyxDQUFDO0lBRUQsU0FBZ0IseUJBQXlCLENBQUMsR0FBWTtRQUNyRCxNQUFNLElBQUksR0FBRyxHQUE0QixDQUFDO1FBQzFDLE9BQU8sdUJBQXVCLENBQUMsR0FBRyxDQUFDO1lBQ2xDLE9BQU8sSUFBSSxDQUFDLFlBQVksS0FBSyxRQUFRO1lBQ3JDLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRO1lBQ2xDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBcUMsRUFBRSxFQUFFLENBQzVELENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxtREFBbUQsSUFBSSxJQUFBLDRCQUFjLEVBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUMvRyxDQUFDO0lBQ0osQ0FBQztJQXdCRCxJQUFZLGtCQUlYO0lBSkQsV0FBWSxrQkFBa0I7UUFDN0IsaUVBQU8sQ0FBQTtRQUNQLDJFQUFZLENBQUE7UUFDWix5RUFBVyxDQUFBO0lBQ1osQ0FBQyxFQUpXLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBSTdCO0lBRU0sSUFBTSxTQUFTLGlCQUFmLE1BQU0sU0FBVSxTQUFRLHNCQUFVO1FBQ3hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBOEQ7WUFDcEYsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLHVCQUFjLEVBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUNwRSxNQUFNLE9BQU8sR0FBRyxPQUFPLG1CQUFtQixLQUFLLFFBQVEsQ0FBQyxDQUFDO2dCQUN4RCxtQkFBbUIsQ0FBQyxDQUFDO2dCQUNyQixtQkFBbUIsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQWFELElBQUksY0FBYztZQUNqQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUtELElBQUksU0FBUztZQUNaLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN4QixDQUFDO1FBRUQsSUFBSSxpQkFBaUI7WUFDcEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM5RCxPQUFPLENBQUMsQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztRQUNwRixDQUFDO1FBRUQsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUdELElBQUksWUFBWTtZQUNmLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBWSxhQUFhO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyw4QkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBRUQsSUFBSSxpQkFBaUI7WUFDcEIsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxJQUFJLENBQUMsV0FBVyxFQUFFLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQzdDLENBQUM7UUFFRCxJQUFJLGlCQUFpQjtZQUNwQixPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUMzQixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM3QyxDQUFDO1FBR0QsSUFBSSxzQkFBc0I7WUFDekIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLDhCQUE4QixDQUFDO1FBQ3RDLENBQUM7UUFHRCxJQUFJLG1CQUFtQjtZQUN0QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQztRQUN0QyxDQUFDO1FBRUQsSUFBSSxTQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFHRCxJQUFJLFVBQVU7WUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLE9BQU8sV0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVELElBQUksZUFBZTtZQUNsQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixDQUFDO1FBRUQsWUFDa0IsV0FBb0UsRUFDcEUsZ0JBQW1DLEVBQ3ZDLFVBQXdDLEVBQ2xDLGdCQUFvRCxFQUNoRCxvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFOUyxnQkFBVyxHQUFYLFdBQVcsQ0FBeUQ7WUFDcEUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN0QixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2pCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDL0IseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQXhGbkUsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUM1RCxpQkFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO1lBRWhDLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBb0IsQ0FBQyxDQUFDO1lBQ3ZFLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFHdkMsZUFBVSxHQUF1QixrQkFBa0IsQ0FBQyxPQUFPLENBQUM7WUFDNUQsMkJBQXNCLEdBQUcsSUFBSSx1QkFBZSxFQUFRLENBQUM7WUE4RHJELGdCQUFXLEdBQUcsS0FBSyxDQUFDO1lBc0IzQixJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsVUFBVSxJQUFJLEtBQUssQ0FBQyxDQUFDO1lBQ3BILElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxXQUFXLENBQUMsSUFBSSxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksSUFBQSxtQkFBWSxHQUFFLENBQUM7WUFDdEcsSUFBSSxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNuRSxJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMseUJBQXlCLENBQUMsV0FBVyxDQUFDLElBQUksV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUV4RyxJQUFJLENBQUMsOEJBQThCLEdBQUcsV0FBVyxFQUFFLHNCQUFzQixJQUFJLFNBQUcsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDNUgsSUFBSSxDQUFDLDhCQUE4QixHQUFHLElBQUEscUJBQWUsRUFBQyxXQUFXLEVBQUUsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLHNCQUFzQixDQUFDO1FBQ25MLENBQUM7UUFFTyxZQUFZLENBQUMsR0FBd0I7WUFDNUMsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQztZQUM5QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxvQ0FBb0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2pGLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELElBQUksR0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUN4QixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSw0QkFBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0csSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVCQUF1QixFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN2RyxDQUFDO1lBRUQsSUFBSSxDQUFDO2dCQUNKLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQWlDLEVBQUUsRUFBRTtvQkFDekQsTUFBTSxhQUFhLEdBQ2xCLE9BQU8sR0FBRyxDQUFDLE9BQU8sS0FBSyxRQUFRO3dCQUM5QixDQUFDLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7d0JBQzlDLENBQUMsQ0FBQyxJQUFBLHlDQUF1QixFQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFFekMsa0ZBQWtGO29CQUNsRixNQUFNLFlBQVksR0FBNkIsR0FBRyxDQUFDLFlBQVksSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDO3dCQUMzRyxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUNwQixFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsQ0FBQztvQkFDbkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO29CQUN4RSxJQUFJLEdBQUcsQ0FBQyxRQUFRLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSyxHQUFXLENBQUMsb0JBQW9CLEVBQUUsQ0FBQzt3QkFDckUsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLFVBQVUsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLDZEQUE2RDs0QkFDbkgsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO3dCQUVuRCwrQkFBK0I7d0JBQy9CLE1BQU0sTUFBTSxHQUFHLHNCQUFzQixJQUFJLEdBQUcsQ0FBQyxDQUFDOzRCQUM3QyxFQUFFLFlBQVksRUFBRSxHQUFHLENBQUMsb0JBQW9CLEVBQXNCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7d0JBQzdFLE9BQU8sQ0FBQyxRQUFRLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSw0QkFBYyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQzt3QkFDL0wsSUFBSSxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxrRkFBa0Y7NEJBQ3hHLE9BQU8sQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUEsb0JBQU0sRUFBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQzt3QkFDMUQsQ0FBQzt3QkFFRCxJQUFJLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDOzRCQUMzQixHQUFHLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVMsQ0FBQyxjQUFjLENBQUMsSUFBQSxvQkFBTSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDakYsQ0FBQztvQkFDRixDQUFDO29CQUNELE9BQU8sT0FBTyxDQUFDO2dCQUNoQixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDMUQsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1FBQ0YsQ0FBQztRQUVPLHFCQUFxQixDQUFDLEdBQStCO1lBQzVELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQztnQkFDNUIsR0FBRyxDQUFDLENBQUM7Z0JBQ0w7b0JBQ0MsR0FBSSxHQUFXO29CQUNmLElBQUksRUFBRyxHQUFXLENBQUMsRUFBRTtpQkFDckIsQ0FBQztZQUVILDREQUE0RDtZQUM1RCxJQUFJLENBQUMsQ0FBQyxzQkFBc0IsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN4QyxLQUFLLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixJQUFJLEVBQUUsQ0FBQztZQUM3RCxDQUFDO1lBRUQsSUFBSSxDQUFDLENBQUMsc0JBQXNCLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsS0FBSyxDQUFDLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztZQUNqQyxDQUFDO1lBRUQsT0FBTyxJQUFBLG9CQUFNLEVBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEIsQ0FBQztRQUVPLDBCQUEwQixDQUFDLE9BQWU7WUFDakQsMkZBQTJGO1lBQzNGLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxxQ0FBbUIsQ0FBQyxJQUFJLHlCQUFXLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsZUFBZSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzdKLE9BQU87Z0JBQ04sSUFBSSxFQUFFLE9BQU87Z0JBQ2IsS0FBSzthQUNMLENBQUM7UUFDSCxDQUFDO1FBRUQsZUFBZTtZQUNkLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0Qsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMvRyxDQUFDO1lBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxZQUFZLENBQUM7UUFDbkQsQ0FBQztRQUVELFlBQVk7WUFDWCxJQUFJLENBQUMsVUFBVSxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQztZQUM3QyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSx1QkFBZSxFQUFRLENBQUM7UUFDM0QsQ0FBQztRQUVELFVBQVUsQ0FBQyxjQUFtRDtZQUM3RCxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssa0JBQWtCLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3hELHFFQUFxRTtnQkFDckUsTUFBTSxJQUFJLEtBQUssQ0FBQyxtREFBbUQsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxRyxDQUFDO1lBRUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxXQUFXLENBQUM7WUFDakQsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDM0IsaUVBQWlFO2dCQUNqRSxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztZQUN2QyxDQUFDO1lBRUQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELHNCQUFzQixDQUFDLEtBQVk7WUFDbEMsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLGtCQUFrQixDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN4RCxNQUFNLElBQUksS0FBSyxDQUFDLCtEQUErRCxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3RILENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFDLENBQUM7UUFDRixDQUFDO1FBRUQscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRUQsV0FBVztZQUNWLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUN2QixDQUFDO1FBRUQsVUFBVSxDQUFDLE9BQTJCLEVBQUUsWUFBc0MsRUFBRSxPQUFlLEVBQUUsU0FBMEIsRUFBRSxZQUFnQztZQUM1SixNQUFNLE9BQU8sR0FBRyxJQUFJLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNFLE9BQU8sQ0FBQyxRQUFRLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXhGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFRCxzQkFBc0IsQ0FBQyxPQUF5QixFQUFFLFFBQXVCLEVBQUUsS0FBZTtZQUN6RixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN2QixPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksaUJBQWlCLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN0RixDQUFDO1lBRUQsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLGlFQUFpRSxDQUFDLENBQUM7WUFDcEYsQ0FBQztZQUVELElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxpQkFBaUIsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLFVBQVUsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLGlCQUFpQixJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssY0FBYyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssaUJBQWlCLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDMVAsT0FBTyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pELENBQUM7aUJBQU0sSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLGFBQWEsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUM3RSxPQUFPLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMzQyxDQUFDO2lCQUFNLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMvQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDL0QsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDWCxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDZCQUE2QixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoRixDQUFDO1FBQ0YsQ0FBQztRQUVELGFBQWEsQ0FBQyxFQUFVO1lBQ3ZCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNyRSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXRDLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDN0IsQ0FBQztRQUNGLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBeUI7WUFDdEMsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3RCLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDM0IsQ0FBQztRQUNGLENBQUM7UUFFRCxXQUFXLENBQUMsT0FBeUIsRUFBRSxNQUF3QjtZQUM5RCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN2QixPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksaUJBQWlCLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN0RixDQUFDO1lBRUQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELGdCQUFnQixDQUFDLE9BQXlCO1lBQ3pDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztZQUM3RCxDQUFDO1lBRUQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixDQUFDO1FBRUQsWUFBWSxDQUFDLE9BQXlCLEVBQUUsU0FBc0M7WUFDN0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDdkIsOEJBQThCO2dCQUM5QixPQUFPO1lBQ1IsQ0FBQztZQUVELE9BQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxPQUF5QixFQUFFLFFBQTJCO1lBQ3RFLE9BQU8sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQzVCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCxRQUFRO1lBQ1AsT0FBTztnQkFDTixpQkFBaUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCO2dCQUN6QyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsc0JBQXNCO2dCQUNuRCxpQkFBaUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCO2dCQUN6QyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsbUJBQW1CO2dCQUNoRCxlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWU7Z0JBQ3JDLGNBQWMsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ3JELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUN0QixPQUFPLENBQUMsQ0FBQztvQkFDVixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDO29CQUNoQixDQUFDO2dCQUNGLENBQUMsQ0FBQztnQkFDRixRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQWdDLEVBQUU7b0JBQ2hFLE1BQU0sT0FBTyxHQUFHO3dCQUNmLEdBQUcsQ0FBQyxDQUFDLE9BQU87d0JBQ1osS0FBSyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsTUFBbUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQ2xGLENBQUM7b0JBQ0YsT0FBTzt3QkFDTixPQUFPO3dCQUNQLFlBQVksRUFBRSxDQUFDLENBQUMsWUFBWTt3QkFDNUIsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQzs0QkFDckIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQ0FDcEMsbUVBQW1FO2dDQUNuRSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7b0NBQzlCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztnQ0FDdEIsQ0FBQztxQ0FBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssaUJBQWlCLEVBQUUsQ0FBQztvQ0FDNUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO2dDQUNyQixDQUFDO3FDQUFNLENBQUM7b0NBQ1AsT0FBTyxJQUFXLENBQUMsQ0FBQyxPQUFPO2dDQUM1QixDQUFDOzRCQUNGLENBQUMsQ0FBQzs0QkFDRixDQUFDLENBQUMsU0FBUzt3QkFDWixNQUFNLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNO3dCQUMxQixTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxTQUFTO3dCQUNoQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxVQUFVO3dCQUNsQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJO3dCQUN0QixLQUFLLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTO3dCQUM5RCxZQUFZLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxZQUFZO3dCQUN0QyxXQUFXLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxXQUFXO3dCQUNwQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLGlCQUFpQjtxQkFDaEQsQ0FBQztnQkFDSCxDQUFDLENBQUM7YUFDRixDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU07WUFDTCxPQUFPO2dCQUNOLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDbEIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO2dCQUN6QixZQUFZLEVBQUUsSUFBSSxDQUFDLGFBQWE7Z0JBQ2hDLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVzthQUM1QixDQUFDO1FBQ0gsQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO1lBRTFCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBQ0QsQ0FBQTtJQXRYWSw4QkFBUzt3QkFBVCxTQUFTO1FBK0ZuQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLDhCQUFpQixDQUFBO1FBQ2pCLFdBQUEscUNBQXFCLENBQUE7T0FqR1gsU0FBUyxDQXNYckI7SUFhTSxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1Qjs7aUJBQ3BCLFdBQU0sR0FBRyxDQUFDLEFBQUosQ0FBSztRQUcxQixJQUFXLEVBQUU7WUFDWixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDakIsQ0FBQztRQUVELFlBQ2lCLE9BQXFDLEVBQ3JDLGVBQWdDLEVBQ1osZ0JBQW1DO1lBRnZELFlBQU8sR0FBUCxPQUFPLENBQThCO1lBQ3JDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNaLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFFdkUsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFVLEdBQUcseUJBQXVCLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDMUQsQ0FBQztRQUVELElBQVcsUUFBUTtZQUNsQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsOEJBQWlCLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7UUFDaEcsQ0FBQztRQUVELElBQVcsVUFBVTtZQUNwQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsOEJBQWlCLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQztRQUMzRixDQUFDOztJQXRCVywwREFBdUI7c0NBQXZCLHVCQUF1QjtRQVdqQyxXQUFBLDhCQUFpQixDQUFBO09BWFAsdUJBQXVCLENBdUJuQztJQUVELFNBQWdCLDBCQUEwQixDQUFDLEtBQWlCLEVBQUUsVUFBOEI7UUFDM0YsTUFBTSxPQUFPLEdBQTZCLEVBQUUsQ0FBQztRQUM3QyxLQUFLLE1BQU0sT0FBTyxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1lBQzNDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3ZCLFNBQVM7WUFDVixDQUFDO1lBRUQsSUFBSSxVQUFVLElBQUksVUFBVSxLQUFLLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUM3RCxtRUFBbUU7Z0JBQ25FLGtFQUFrRTtnQkFDbEUsU0FBUztZQUNWLENBQUM7WUFFRCxNQUFNLGdCQUFnQixHQUFHLElBQUEsK0JBQWEsRUFBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDeEQsTUFBTSxjQUFjLEdBQXNCO2dCQUN6QyxTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7Z0JBQzFCLFNBQVMsRUFBRSxPQUFPLENBQUMsRUFBRTtnQkFDckIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFO2dCQUN6QyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsT0FBTztnQkFDakMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLElBQUk7Z0JBQzVDLFNBQVMsRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxxQkFBcUI7Z0JBQzNGLFFBQVEsRUFBRSw4QkFBaUIsQ0FBQyxLQUFLO2FBQ2pDLENBQUM7WUFDRixPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzdILENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNoQixDQUFDO0lBRUQsU0FBZ0IsWUFBWSxDQUFDLFlBQXNDLEVBQUUsSUFBWTtRQUNoRixPQUFPO1lBQ04sU0FBUyxFQUFFLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDM0MsR0FBRyxDQUFDO2dCQUNKLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJO29CQUNqQixLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSTtvQkFDM0IsWUFBWSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLElBQUk7aUJBQ3pDO2FBQ0QsQ0FBQyxDQUFDO1NBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFnQix1QkFBdUIsQ0FBQyxHQUFvQixFQUFFLEdBQW9CO1FBQ2pGLElBQUksR0FBRyxDQUFDLE9BQU8sSUFBSSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEMsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNO21CQUMzRCxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsS0FBSyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVM7bUJBQy9DLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSTttQkFDckMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLO21CQUN2QyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsS0FBSyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztZQUNsRCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3BCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztRQUNGLENBQUM7YUFBTSxJQUFJLEdBQUcsQ0FBQyxPQUFPLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3ZDLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELE9BQU8sSUFBQSxnQkFBTSxFQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQztZQUMxQyxHQUFHLENBQUMsV0FBVyxLQUFLLEdBQUcsQ0FBQyxXQUFXO1lBQ25DLEdBQUcsQ0FBQyxpQkFBaUIsS0FBSyxHQUFHLENBQUMsaUJBQWlCLENBQUM7SUFDbEQsQ0FBQyJ9