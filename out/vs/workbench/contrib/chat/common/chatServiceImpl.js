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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/stopwatch", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatRequestParser", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/services/extensions/common/extensions"], function (require, exports, actions_1, cancellation_1, errors_1, event_1, htmlContent_1, iterator_1, lifecycle_1, marshalling_1, stopwatch_1, uri_1, nls_1, commands_1, instantiation_1, log_1, notification_1, progress_1, storage_1, telemetry_1, workspace_1, chatAgents_1, chatModel_1, chatParserTypes_1, chatRequestParser_1, chatService_1, chatSlashCommands_1, chatVariables_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatService = void 0;
    const serializedChatKey = 'interactive.sessions';
    const globalChatKey = 'chat.workspaceTransfer';
    const SESSION_TRANSFER_EXPIRATION_IN_MILLISECONDS = 1000 * 60;
    const maxPersistedSessions = 25;
    let ChatService = class ChatService extends lifecycle_1.Disposable {
        get transferredSessionData() {
            return this._transferredSessionData;
        }
        constructor(storageService, logService, extensionService, instantiationService, telemetryService, workspaceContextService, chatSlashCommandService, chatVariablesService, chatAgentService, notificationService, commandService) {
            super();
            this.storageService = storageService;
            this.logService = logService;
            this.extensionService = extensionService;
            this.instantiationService = instantiationService;
            this.telemetryService = telemetryService;
            this.workspaceContextService = workspaceContextService;
            this.chatSlashCommandService = chatSlashCommandService;
            this.chatVariablesService = chatVariablesService;
            this.chatAgentService = chatAgentService;
            this.notificationService = notificationService;
            this.commandService = commandService;
            this._sessionModels = this._register(new lifecycle_1.DisposableMap());
            this._pendingRequests = this._register(new lifecycle_1.DisposableMap());
            this._onDidPerformUserAction = this._register(new event_1.Emitter());
            this.onDidPerformUserAction = this._onDidPerformUserAction.event;
            this._onDidDisposeSession = this._register(new event_1.Emitter());
            this.onDidDisposeSession = this._onDidDisposeSession.event;
            this._sessionFollowupCancelTokens = this._register(new lifecycle_1.DisposableMap());
            const sessionData = storageService.get(serializedChatKey, 1 /* StorageScope.WORKSPACE */, '');
            if (sessionData) {
                this._persistedSessions = this.deserializeChats(sessionData);
                const countsForLog = Object.keys(this._persistedSessions).length;
                if (countsForLog > 0) {
                    this.trace('constructor', `Restored ${countsForLog} persisted sessions`);
                }
            }
            else {
                this._persistedSessions = {};
            }
            const transferredData = this.getTransferredSessionData();
            const transferredChat = transferredData?.chat;
            if (transferredChat) {
                this.trace('constructor', `Transferred session ${transferredChat.sessionId}`);
                this._persistedSessions[transferredChat.sessionId] = transferredChat;
                this._transferredSessionData = { sessionId: transferredChat.sessionId, inputValue: transferredData.inputValue };
            }
            this._register(storageService.onWillSaveState(() => this.saveState()));
        }
        isEnabled(location) {
            return this.chatAgentService.getContributedDefaultAgent(location) !== undefined;
        }
        saveState() {
            let allSessions = Array.from(this._sessionModels.values())
                .filter(session => session.initialLocation === chatAgents_1.ChatAgentLocation.Panel)
                .filter(session => session.getRequests().length > 0);
            allSessions = allSessions.concat(Object.values(this._persistedSessions)
                .filter(session => !this._sessionModels.has(session.sessionId))
                .filter(session => session.requests.length));
            allSessions.sort((a, b) => (b.creationDate ?? 0) - (a.creationDate ?? 0));
            allSessions = allSessions.slice(0, maxPersistedSessions);
            if (allSessions.length) {
                this.trace('onWillSaveState', `Persisting ${allSessions.length} sessions`);
            }
            const serialized = JSON.stringify(allSessions);
            if (allSessions.length) {
                this.trace('onWillSaveState', `Persisting ${serialized.length} chars`);
            }
            this.storageService.store(serializedChatKey, serialized, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        notifyUserAction(action) {
            if (action.action.kind === 'vote') {
                this.telemetryService.publicLog2('interactiveSessionVote', {
                    direction: action.action.direction === chatService_1.InteractiveSessionVoteDirection.Up ? 'up' : 'down'
                });
            }
            else if (action.action.kind === 'copy') {
                this.telemetryService.publicLog2('interactiveSessionCopy', {
                    copyKind: action.action.copyKind === chatService_1.ChatCopyKind.Action ? 'action' : 'toolbar'
                });
            }
            else if (action.action.kind === 'insert') {
                this.telemetryService.publicLog2('interactiveSessionInsert', {
                    newFile: !!action.action.newFile
                });
            }
            else if (action.action.kind === 'command') {
                // TODO not currently called
                const command = commands_1.CommandsRegistry.getCommand(action.action.commandButton.command.id);
                const commandId = command ? action.action.commandButton.command.id : 'INVALID';
                this.telemetryService.publicLog2('interactiveSessionCommand', {
                    commandId
                });
            }
            else if (action.action.kind === 'runInTerminal') {
                this.telemetryService.publicLog2('interactiveSessionRunInTerminal', {
                    languageId: action.action.languageId ?? ''
                });
            }
            this._onDidPerformUserAction.fire(action);
        }
        trace(method, message) {
            if (message) {
                this.logService.trace(`ChatService#${method}: ${message}`);
            }
            else {
                this.logService.trace(`ChatService#${method}`);
            }
        }
        error(method, message) {
            this.logService.error(`ChatService#${method} ${message}`);
        }
        deserializeChats(sessionData) {
            try {
                const arrayOfSessions = (0, marshalling_1.revive)(JSON.parse(sessionData)); // Revive serialized URIs in session data
                if (!Array.isArray(arrayOfSessions)) {
                    throw new Error('Expected array');
                }
                const sessions = arrayOfSessions.reduce((acc, session) => {
                    // Revive serialized markdown strings in response data
                    for (const request of session.requests) {
                        if (Array.isArray(request.response)) {
                            request.response = request.response.map((response) => {
                                if (typeof response === 'string') {
                                    return new htmlContent_1.MarkdownString(response);
                                }
                                return response;
                            });
                        }
                        else if (typeof request.response === 'string') {
                            request.response = [new htmlContent_1.MarkdownString(request.response)];
                        }
                    }
                    acc[session.sessionId] = session;
                    return acc;
                }, {});
                return sessions;
            }
            catch (err) {
                this.error('deserializeChats', `Malformed session data: ${err}. [${sessionData.substring(0, 20)}${sessionData.length > 20 ? '...' : ''}]`);
                return {};
            }
        }
        getTransferredSessionData() {
            const data = this.storageService.getObject(globalChatKey, 0 /* StorageScope.PROFILE */, []);
            const workspaceUri = this.workspaceContextService.getWorkspace().folders[0]?.uri;
            if (!workspaceUri) {
                return;
            }
            const thisWorkspace = workspaceUri.toString();
            const currentTime = Date.now();
            // Only use transferred data if it was created recently
            const transferred = data.find(item => uri_1.URI.revive(item.toWorkspace).toString() === thisWorkspace && (currentTime - item.timestampInMilliseconds < SESSION_TRANSFER_EXPIRATION_IN_MILLISECONDS));
            // Keep data that isn't for the current workspace and that hasn't expired yet
            const filtered = data.filter(item => uri_1.URI.revive(item.toWorkspace).toString() !== thisWorkspace && (currentTime - item.timestampInMilliseconds < SESSION_TRANSFER_EXPIRATION_IN_MILLISECONDS));
            this.storageService.store(globalChatKey, JSON.stringify(filtered), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            return transferred;
        }
        /**
         * Returns an array of chat details for all persisted chat sessions that have at least one request.
         * The array is sorted by creation date in descending order.
         * Chat sessions that have already been loaded into the chat view are excluded from the result.
         * Imported chat sessions are also excluded from the result.
         */
        getHistory() {
            const sessions = Object.values(this._persistedSessions)
                .filter(session => session.requests.length > 0);
            sessions.sort((a, b) => (b.creationDate ?? 0) - (a.creationDate ?? 0));
            return sessions
                .filter(session => !this._sessionModels.has(session.sessionId))
                .filter(session => !session.isImported)
                .map(item => {
                const title = chatModel_1.ChatModel.getDefaultTitle(item.requests);
                return {
                    sessionId: item.sessionId,
                    title
                };
            });
        }
        removeHistoryEntry(sessionId) {
            delete this._persistedSessions[sessionId];
            this.saveState();
        }
        clearAllHistoryEntries() {
            this._persistedSessions = {};
            this.saveState();
        }
        startSession(location, token) {
            this.trace('startSession');
            return this._startSession(undefined, location, token);
        }
        _startSession(someSessionHistory, location, token) {
            const model = this.instantiationService.createInstance(chatModel_1.ChatModel, someSessionHistory, location);
            this._sessionModels.set(model.sessionId, model);
            this.initializeSession(model, token);
            return model;
        }
        async initializeSession(model, token) {
            try {
                this.trace('initializeSession', `Initialize session ${model.sessionId}`);
                model.startInitialize();
                await this.extensionService.whenInstalledExtensionsRegistered();
                const defaultAgentData = this.chatAgentService.getContributedDefaultAgent(model.initialLocation) ?? this.chatAgentService.getContributedDefaultAgent(chatAgents_1.ChatAgentLocation.Panel);
                if (!defaultAgentData) {
                    throw new errors_1.ErrorNoTelemetry('No default agent contributed');
                }
                await this.extensionService.activateByEvent(`onChatParticipant:${defaultAgentData.id}`);
                const defaultAgent = this.chatAgentService.getActivatedAgents().find(agent => agent.id === defaultAgentData.id);
                if (!defaultAgent) {
                    // Should have been registered during activation above!
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: (0, nls_1.localize)('chatFailErrorMessage', "Chat failed to load. Please ensure that the GitHub Copilot Chat extension is up to date."),
                        actions: {
                            primary: [
                                new actions_1.Action('showExtension', (0, nls_1.localize)('action.showExtension', "Show Extension"), undefined, true, () => {
                                    return this.commandService.executeCommand('workbench.extensions.action.showExtensionsWithIds', ['GitHub.copilot-chat']);
                                })
                            ]
                        }
                    });
                    throw new errors_1.ErrorNoTelemetry('No default agent registered');
                }
                const welcomeMessage = model.welcomeMessage ? undefined : await defaultAgent.provideWelcomeMessage?.(model.initialLocation, token) ?? undefined;
                const welcomeModel = welcomeMessage && this.instantiationService.createInstance(chatModel_1.ChatWelcomeMessageModel, welcomeMessage.map(item => typeof item === 'string' ? new htmlContent_1.MarkdownString(item) : item), await defaultAgent.provideSampleQuestions?.(model.initialLocation, token) ?? []);
                model.initialize(welcomeModel);
            }
            catch (err) {
                this.trace('startSession', `initializeSession failed: ${err}`);
                model.setInitializationError(err);
                this._sessionModels.deleteAndDispose(model.sessionId);
                this._onDidDisposeSession.fire({ sessionId: model.sessionId, reason: 'initializationFailed' });
            }
        }
        getSession(sessionId) {
            return this._sessionModels.get(sessionId);
        }
        getOrRestoreSession(sessionId) {
            this.trace('getOrRestoreSession', `sessionId: ${sessionId}`);
            const model = this._sessionModels.get(sessionId);
            if (model) {
                return model;
            }
            const sessionData = this._persistedSessions[sessionId];
            if (!sessionData) {
                return undefined;
            }
            if (sessionId === this.transferredSessionData?.sessionId) {
                this._transferredSessionData = undefined;
            }
            return this._startSession(sessionData, sessionData.initialLocation ?? chatAgents_1.ChatAgentLocation.Panel, cancellation_1.CancellationToken.None);
        }
        loadSessionFromContent(data) {
            return this._startSession(data, data.initialLocation ?? chatAgents_1.ChatAgentLocation.Panel, cancellation_1.CancellationToken.None);
        }
        async resendRequest(request, options) {
            const model = this._sessionModels.get(request.session.sessionId);
            if (!model && model !== request.session) {
                throw new Error(`Unknown session: ${request.session.sessionId}`);
            }
            await model.waitForInitialization();
            if (this._pendingRequests.has(request.session.sessionId)) {
                this.trace('sendRequest', `Session ${request.session.sessionId} already has a pending request`);
                return;
            }
            const location = options?.location ?? model.initialLocation;
            const attempt = options?.attempt ?? 0;
            const enableCommandDetection = !options?.noCommandDetection;
            const implicitVariablesEnabled = options?.implicitVariablesEnabled ?? false;
            const defaultAgent = this.chatAgentService.getDefaultAgent(location);
            this.removeRequest(model.sessionId, request.id);
            await this._sendRequestAsync(model, model.sessionId, request.message, attempt, enableCommandDetection, implicitVariablesEnabled, defaultAgent, location);
        }
        async sendRequest(sessionId, request, options) {
            this.trace('sendRequest', `sessionId: ${sessionId}, message: ${request.substring(0, 20)}${request.length > 20 ? '[...]' : ''}}`);
            if (!request.trim()) {
                this.trace('sendRequest', 'Rejected empty message');
                return;
            }
            const model = this._sessionModels.get(sessionId);
            if (!model) {
                throw new Error(`Unknown session: ${sessionId}`);
            }
            await model.waitForInitialization();
            if (this._pendingRequests.has(sessionId)) {
                this.trace('sendRequest', `Session ${sessionId} already has a pending request`);
                return;
            }
            const location = options?.location ?? model.initialLocation;
            const attempt = options?.attempt ?? 0;
            const implicitVariablesEnabled = options?.implicitVariablesEnabled ?? false;
            const defaultAgent = this.chatAgentService.getDefaultAgent(location);
            const parsedRequest = this.instantiationService.createInstance(chatRequestParser_1.ChatRequestParser).parseChatRequest(sessionId, request, location, options?.parserContext);
            const agent = parsedRequest.parts.find((r) => r instanceof chatParserTypes_1.ChatRequestAgentPart)?.agent ?? defaultAgent;
            const agentSlashCommandPart = parsedRequest.parts.find((r) => r instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart);
            // This method is only returning whether the request was accepted - don't block on the actual request
            return {
                responseCompletePromise: this._sendRequestAsync(model, sessionId, parsedRequest, attempt, !options?.noCommandDetection, implicitVariablesEnabled, defaultAgent, location),
                agent,
                slashCommand: agentSlashCommandPart?.command,
            };
        }
        refreshFollowupsCancellationToken(sessionId) {
            this._sessionFollowupCancelTokens.get(sessionId)?.cancel();
            const newTokenSource = new cancellation_1.CancellationTokenSource();
            this._sessionFollowupCancelTokens.set(sessionId, newTokenSource);
            return newTokenSource.token;
        }
        async _sendRequestAsync(model, sessionId, parsedRequest, attempt, enableCommandDetection, implicitVariablesEnabled, defaultAgent, location) {
            const followupsCancelToken = this.refreshFollowupsCancellationToken(sessionId);
            let request;
            const agentPart = 'kind' in parsedRequest ? undefined : parsedRequest.parts.find((r) => r instanceof chatParserTypes_1.ChatRequestAgentPart);
            const agentSlashCommandPart = 'kind' in parsedRequest ? undefined : parsedRequest.parts.find((r) => r instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart);
            const commandPart = 'kind' in parsedRequest ? undefined : parsedRequest.parts.find((r) => r instanceof chatParserTypes_1.ChatRequestSlashCommandPart);
            let gotProgress = false;
            const requestType = commandPart ? 'slashCommand' : 'string';
            const source = new cancellation_1.CancellationTokenSource();
            const token = source.token;
            const sendRequestInternal = async () => {
                const progressCallback = (progress) => {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    gotProgress = true;
                    if (progress.kind === 'markdownContent') {
                        this.trace('sendRequest', `Provider returned progress for session ${model.sessionId}, ${progress.content.value.length} chars`);
                    }
                    else {
                        this.trace('sendRequest', `Provider returned progress: ${JSON.stringify(progress)}`);
                    }
                    model.acceptResponseProgress(request, progress);
                };
                const stopWatch = new stopwatch_1.StopWatch(false);
                const listener = token.onCancellationRequested(() => {
                    this.trace('sendRequest', `Request for session ${model.sessionId} was cancelled`);
                    this.telemetryService.publicLog2('interactiveSessionProviderInvoked', {
                        timeToFirstProgress: undefined,
                        // Normally timings happen inside the EH around the actual provider. For cancellation we can measure how long the user waited before cancelling
                        totalTime: stopWatch.elapsed(),
                        result: 'cancelled',
                        requestType,
                        agent: agentPart?.agent.id ?? '',
                        slashCommand: agentSlashCommandPart ? agentSlashCommandPart.command.name : commandPart?.slashCommand.command,
                        chatSessionId: model.sessionId
                    });
                    model.cancelRequest(request);
                });
                try {
                    let rawResult;
                    let agentOrCommandFollowups = undefined;
                    if (agentPart || (defaultAgent && !commandPart)) {
                        const agent = (agentPart?.agent ?? defaultAgent);
                        await this.extensionService.activateByEvent(`onChatParticipant:${agent.id}`);
                        const history = (0, chatModel_1.getHistoryEntriesFromModel)(model, agentPart?.agent.id);
                        const initVariableData = { variables: [] };
                        request = model.addRequest(parsedRequest, initVariableData, attempt, agent, agentSlashCommandPart?.command);
                        const variableData = await this.chatVariablesService.resolveVariables(parsedRequest, model, progressCallback, token);
                        request.variableData = variableData;
                        const promptTextResult = (0, chatParserTypes_1.getPromptText)(request.message);
                        const updatedVariableData = (0, chatModel_1.updateRanges)(variableData, promptTextResult.diff); // TODO bit of a hack
                        if (implicitVariablesEnabled) {
                            const implicitVariables = agent.defaultImplicitVariables;
                            if (implicitVariables) {
                                const resolvedImplicitVariables = await Promise.all(implicitVariables.map(async (v) => ({ name: v, values: await this.chatVariablesService.resolveVariable(v, parsedRequest.text, model, progressCallback, token) })));
                                updatedVariableData.variables.push(...resolvedImplicitVariables);
                            }
                        }
                        const requestProps = {
                            sessionId,
                            requestId: request.id,
                            agentId: agent.id,
                            message: promptTextResult.message,
                            command: agentSlashCommandPart?.command.name,
                            variables: updatedVariableData,
                            enableCommandDetection,
                            attempt,
                            location
                        };
                        const agentResult = await this.chatAgentService.invokeAgent(agent.id, requestProps, progressCallback, history, token);
                        rawResult = agentResult;
                        agentOrCommandFollowups = this.chatAgentService.getFollowups(agent.id, requestProps, agentResult, history, followupsCancelToken);
                    }
                    else if (commandPart && this.chatSlashCommandService.hasCommand(commandPart.slashCommand.command)) {
                        request = model.addRequest(parsedRequest, { variables: [] }, attempt);
                        // contributed slash commands
                        // TODO: spell this out in the UI
                        const history = [];
                        for (const request of model.getRequests()) {
                            if (!request.response) {
                                continue;
                            }
                            history.push({ role: 1 /* ChatMessageRole.User */, content: request.message.text });
                            history.push({ role: 2 /* ChatMessageRole.Assistant */, content: request.response.response.asString() });
                        }
                        const message = parsedRequest.text;
                        const commandResult = await this.chatSlashCommandService.executeCommand(commandPart.slashCommand.command, message.substring(commandPart.slashCommand.command.length + 1).trimStart(), new progress_1.Progress(p => {
                            progressCallback(p);
                        }), history, token);
                        agentOrCommandFollowups = Promise.resolve(commandResult?.followUp);
                        rawResult = {};
                    }
                    else {
                        throw new Error(`Cannot handle request`);
                    }
                    if (token.isCancellationRequested) {
                        return;
                    }
                    else {
                        if (!rawResult) {
                            this.trace('sendRequest', `Provider returned no response for session ${model.sessionId}`);
                            rawResult = { errorDetails: { message: (0, nls_1.localize)('emptyResponse', "Provider returned null response") } };
                        }
                        const result = rawResult.errorDetails?.responseIsFiltered ? 'filtered' :
                            rawResult.errorDetails && gotProgress ? 'errorWithOutput' :
                                rawResult.errorDetails ? 'error' :
                                    'success';
                        this.telemetryService.publicLog2('interactiveSessionProviderInvoked', {
                            timeToFirstProgress: rawResult.timings?.firstProgress,
                            totalTime: rawResult.timings?.totalElapsed,
                            result,
                            requestType,
                            agent: agentPart?.agent.id ?? '',
                            slashCommand: agentSlashCommandPart ? agentSlashCommandPart.command.name : commandPart?.slashCommand.command,
                            chatSessionId: model.sessionId
                        });
                        model.setResponse(request, rawResult);
                        this.trace('sendRequest', `Provider returned response for session ${model.sessionId}`);
                        model.completeResponse(request);
                        if (agentOrCommandFollowups) {
                            agentOrCommandFollowups.then(followups => {
                                model.setFollowups(request, followups);
                            });
                        }
                    }
                }
                finally {
                    listener.dispose();
                }
            };
            const rawResponsePromise = sendRequestInternal();
            this._pendingRequests.set(model.sessionId, source);
            rawResponsePromise.finally(() => {
                this._pendingRequests.deleteAndDispose(model.sessionId);
            });
            return rawResponsePromise;
        }
        async removeRequest(sessionId, requestId) {
            const model = this._sessionModels.get(sessionId);
            if (!model) {
                throw new Error(`Unknown session: ${sessionId}`);
            }
            await model.waitForInitialization();
            model.removeRequest(requestId);
        }
        async addCompleteRequest(sessionId, message, variableData, attempt, response) {
            this.trace('addCompleteRequest', `message: ${message}`);
            const model = this._sessionModels.get(sessionId);
            if (!model) {
                throw new Error(`Unknown session: ${sessionId}`);
            }
            await model.waitForInitialization();
            const parsedRequest = typeof message === 'string' ?
                this.instantiationService.createInstance(chatRequestParser_1.ChatRequestParser).parseChatRequest(sessionId, message) :
                message;
            const request = model.addRequest(parsedRequest, variableData || { variables: [] }, attempt ?? 0);
            if (typeof response.message === 'string') {
                // TODO is this possible?
                model.acceptResponseProgress(request, { content: new htmlContent_1.MarkdownString(response.message), kind: 'markdownContent' });
            }
            else {
                for (const part of response.message) {
                    model.acceptResponseProgress(request, part, true);
                }
            }
            model.setResponse(request, response.result || {});
            if (response.followups !== undefined) {
                model.setFollowups(request, response.followups);
            }
            model.completeResponse(request);
        }
        cancelCurrentRequestForSession(sessionId) {
            this.trace('cancelCurrentRequestForSession', `sessionId: ${sessionId}`);
            this._pendingRequests.get(sessionId)?.cancel();
            this._pendingRequests.deleteAndDispose(sessionId);
        }
        clearSession(sessionId) {
            this.trace('clearSession', `sessionId: ${sessionId}`);
            const model = this._sessionModels.get(sessionId);
            if (!model) {
                throw new Error(`Unknown session: ${sessionId}`);
            }
            if (model.initialLocation === chatAgents_1.ChatAgentLocation.Panel) {
                this._persistedSessions[sessionId] = model.toJSON();
            }
            this._sessionModels.deleteAndDispose(sessionId);
            this._pendingRequests.get(sessionId)?.cancel();
            this._pendingRequests.deleteAndDispose(sessionId);
            this._onDidDisposeSession.fire({ sessionId, reason: 'cleared' });
        }
        hasSessions() {
            return !!Object.values(this._persistedSessions);
        }
        transferChatSession(transferredSessionData, toWorkspace) {
            const model = iterator_1.Iterable.find(this._sessionModels.values(), model => model.sessionId === transferredSessionData.sessionId);
            if (!model) {
                throw new Error(`Failed to transfer session. Unknown session ID: ${transferredSessionData.sessionId}`);
            }
            const existingRaw = this.storageService.getObject(globalChatKey, 0 /* StorageScope.PROFILE */, []);
            existingRaw.push({
                chat: model.toJSON(),
                timestampInMilliseconds: Date.now(),
                toWorkspace: toWorkspace,
                inputValue: transferredSessionData.inputValue,
            });
            this.storageService.store(globalChatKey, JSON.stringify(existingRaw), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            this.trace('transferChatSession', `Transferred session ${model.sessionId} to workspace ${toWorkspace.toString()}`);
        }
    };
    exports.ChatService = ChatService;
    exports.ChatService = ChatService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, log_1.ILogService),
        __param(2, extensions_1.IExtensionService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, chatSlashCommands_1.IChatSlashCommandService),
        __param(7, chatVariables_1.IChatVariablesService),
        __param(8, chatAgents_1.IChatAgentService),
        __param(9, notification_1.INotificationService),
        __param(10, commands_1.ICommandService)
    ], ChatService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFNlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9jb21tb24vY2hhdFNlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQStCaEcsTUFBTSxpQkFBaUIsR0FBRyxzQkFBc0IsQ0FBQztJQUVqRCxNQUFNLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQztJQU8vQyxNQUFNLDJDQUEyQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUEwRTlELE1BQU0sb0JBQW9CLEdBQUcsRUFBRSxDQUFDO0lBRXpCLElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVksU0FBUSxzQkFBVTtRQVMxQyxJQUFXLHNCQUFzQjtZQUNoQyxPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQztRQUNyQyxDQUFDO1FBVUQsWUFDa0IsY0FBZ0QsRUFDcEQsVUFBd0MsRUFDbEMsZ0JBQW9ELEVBQ2hELG9CQUE0RCxFQUNoRSxnQkFBb0QsRUFDN0MsdUJBQWtFLEVBQ2xFLHVCQUFrRSxFQUNyRSxvQkFBNEQsRUFDaEUsZ0JBQW9ELEVBQ2pELG1CQUEwRCxFQUMvRCxjQUFnRDtZQUVqRSxLQUFLLEVBQUUsQ0FBQztZQVowQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbkMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNqQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQy9CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDL0MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUM1Qiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ2pELDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDcEQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMv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