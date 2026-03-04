/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/base/common/types", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, arrays_1, async_1, errorMessage_1, event_1, iterator_1, lifecycle_1, stopwatch_1, types_1, uri_1, extensions_1, extHost_protocol_1, typeConvert, extHostTypes, chatService_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostChatAgents2 = void 0;
    class ChatAgentResponseStream {
        constructor(_extension, _request, _proxy, _commandsConverter, _sessionDisposables) {
            this._extension = _extension;
            this._request = _request;
            this._proxy = _proxy;
            this._commandsConverter = _commandsConverter;
            this._sessionDisposables = _sessionDisposables;
            this._stopWatch = stopwatch_1.StopWatch.create(false);
            this._isClosed = false;
        }
        close() {
            this._isClosed = true;
        }
        get timings() {
            return {
                firstProgress: this._firstProgress,
                totalElapsed: this._stopWatch.elapsed()
            };
        }
        get apiObject() {
            if (!this._apiObject) {
                const that = this;
                this._stopWatch.reset();
                function throwIfDone(source) {
                    if (that._isClosed) {
                        const err = new Error('Response stream has been closed');
                        Error.captureStackTrace(err, source);
                        throw err;
                    }
                }
                const _report = (progress) => {
                    // Measure the time to the first progress update with real markdown content
                    if (typeof this._firstProgress === 'undefined' && 'content' in progress) {
                        this._firstProgress = this._stopWatch.elapsed();
                    }
                    this._proxy.$handleProgressChunk(this._request.requestId, progress);
                };
                this._apiObject = {
                    markdown(value) {
                        throwIfDone(this.markdown);
                        const part = new extHostTypes.ChatResponseMarkdownPart(value);
                        const dto = typeConvert.ChatResponseMarkdownPart.from(part);
                        _report(dto);
                        return this;
                    },
                    markdownWithVulnerabilities(value, vulnerabilities) {
                        throwIfDone(this.markdown);
                        if (vulnerabilities) {
                            (0, extensions_2.checkProposedApiEnabled)(that._extension, 'chatParticipantAdditions');
                        }
                        const part = new extHostTypes.ChatResponseMarkdownWithVulnerabilitiesPart(value, vulnerabilities);
                        const dto = typeConvert.ChatResponseMarkdownWithVulnerabilitiesPart.from(part);
                        _report(dto);
                        return this;
                    },
                    filetree(value, baseUri) {
                        throwIfDone(this.filetree);
                        const part = new extHostTypes.ChatResponseFileTreePart(value, baseUri);
                        const dto = typeConvert.ChatResponseFilesPart.from(part);
                        _report(dto);
                        return this;
                    },
                    anchor(value, title) {
                        throwIfDone(this.anchor);
                        const part = new extHostTypes.ChatResponseAnchorPart(value, title);
                        const dto = typeConvert.ChatResponseAnchorPart.from(part);
                        _report(dto);
                        return this;
                    },
                    button(value) {
                        throwIfDone(this.anchor);
                        const part = new extHostTypes.ChatResponseCommandButtonPart(value);
                        const dto = typeConvert.ChatResponseCommandButtonPart.from(part, that._commandsConverter, that._sessionDisposables);
                        _report(dto);
                        return this;
                    },
                    progress(value) {
                        throwIfDone(this.progress);
                        const part = new extHostTypes.ChatResponseProgressPart(value);
                        const dto = typeConvert.ChatResponseProgressPart.from(part);
                        _report(dto);
                        return this;
                    },
                    reference(value, iconPath) {
                        throwIfDone(this.reference);
                        if ('variableName' in value && !value.value) {
                            // The participant used this variable. Does that variable have any references to pull in?
                            const matchingVarData = that._request.variables.variables.find(v => v.name === value.variableName);
                            if (matchingVarData) {
                                let references;
                                if (matchingVarData.references?.length) {
                                    references = matchingVarData.references.map(r => ({
                                        kind: 'reference',
                                        reference: { variableName: value.variableName, value: r.reference }
                                    }));
                                }
                                else {
                                    // Participant sent a variableName reference but the variable produced no references. Show variable reference with no value
                                    const part = new extHostTypes.ChatResponseReferencePart(value, iconPath);
                                    const dto = typeConvert.ChatResponseReferencePart.from(part);
                                    references = [dto];
                                }
                                references.forEach(r => _report(r));
                                return this;
                            }
                            else {
                                // Something went wrong- that variable doesn't actually exist
                            }
                        }
                        else {
                            const part = new extHostTypes.ChatResponseReferencePart(value, iconPath);
                            const dto = typeConvert.ChatResponseReferencePart.from(part);
                            _report(dto);
                        }
                        return this;
                    },
                    textEdit(target, edits) {
                        throwIfDone(this.textEdit);
                        (0, extensions_2.checkProposedApiEnabled)(that._extension, 'chatParticipantAdditions');
                        const part = new extHostTypes.ChatResponseTextEditPart(target, edits);
                        const dto = typeConvert.ChatResponseTextEditPart.from(part);
                        _report(dto);
                        return this;
                    },
                    detectedParticipant(participant, command) {
                        throwIfDone(this.detectedParticipant);
                        (0, extensions_2.checkProposedApiEnabled)(that._extension, 'chatParticipantAdditions');
                        const part = new extHostTypes.ChatResponseDetectedParticipantPart(participant, command);
                        const dto = typeConvert.ChatResponseDetectedParticipantPart.from(part);
                        _report(dto);
                        return this;
                    },
                    push(part) {
                        throwIfDone(this.push);
                        if (part instanceof extHostTypes.ChatResponseTextEditPart || part instanceof extHostTypes.ChatResponseMarkdownWithVulnerabilitiesPart || part instanceof extHostTypes.ChatResponseDetectedParticipantPart) {
                            (0, extensions_2.checkProposedApiEnabled)(that._extension, 'chatParticipantAdditions');
                        }
                        if (part instanceof extHostTypes.ChatResponseReferencePart) {
                            // Ensure variable reference values get fixed up
                            this.reference(part.value, part.iconPath);
                        }
                        else {
                            const dto = typeConvert.ChatResponsePart.from(part, that._commandsConverter, that._sessionDisposables);
                            _report(dto);
                        }
                        return this;
                    },
                };
            }
            return this._apiObject;
        }
    }
    class ExtHostChatAgents2 extends lifecycle_1.Disposable {
        static { this._idPool = 0; }
        constructor(mainContext, _logService, commands) {
            super();
            this._logService = _logService;
            this.commands = commands;
            this._agents = new Map();
            this._sessionDisposables = this._register(new lifecycle_1.DisposableMap());
            this._completionDisposables = this._register(new lifecycle_1.DisposableStore());
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadChatAgents2);
        }
        transferActiveChat(newWorkspace) {
            this._proxy.$transferActiveChatSession(newWorkspace);
        }
        createChatAgent(extension, id, handler) {
            const handle = ExtHostChatAgents2._idPool++;
            const agent = new ExtHostChatAgent(extension, id, this._proxy, handle, handler);
            this._agents.set(handle, agent);
            this._proxy.$registerAgent(handle, extension.identifier, id, {}, undefined);
            return agent.apiAgent;
        }
        createDynamicChatAgent(extension, id, name, description, handler) {
            const handle = ExtHostChatAgents2._idPool++;
            const agent = new ExtHostChatAgent(extension, id, this._proxy, handle, handler);
            this._agents.set(handle, agent);
            this._proxy.$registerAgent(handle, extension.identifier, id, { isSticky: true }, { name, description });
            return agent.apiAgent;
        }
        async $invokeAgent(handle, request, context, token) {
            const agent = this._agents.get(handle);
            if (!agent) {
                throw new Error(`[CHAT](${handle}) CANNOT invoke agent because the agent is not registered`);
            }
            // Init session disposables
            let sessionDisposables = this._sessionDisposables.get(request.sessionId);
            if (!sessionDisposables) {
                sessionDisposables = new lifecycle_1.DisposableStore();
                this._sessionDisposables.set(request.sessionId, sessionDisposables);
            }
            const stream = new ChatAgentResponseStream(agent.extension, request, this._proxy, this.commands.converter, sessionDisposables);
            try {
                const convertedHistory = await this.prepareHistoryTurns(request.agentId, context);
                const task = agent.invoke(typeConvert.ChatAgentRequest.to(request), { history: convertedHistory }, stream.apiObject, token);
                return await (0, async_1.raceCancellation)(Promise.resolve(task).then((result) => {
                    if (result?.metadata) {
                        try {
                            JSON.stringify(result.metadata);
                        }
                        catch (err) {
                            const msg = `result.metadata MUST be JSON.stringify-able. Got error: ${err.message}`;
                            this._logService.error(`[${agent.extension.identifier.value}] [@${agent.id}] ${msg}`, agent.extension);
                            return { errorDetails: { message: msg }, timings: stream.timings };
                        }
                    }
                    return { errorDetails: result?.errorDetails, timings: stream.timings, metadata: result?.metadata };
                }), token);
            }
            catch (e) {
                this._logService.error(e, agent.extension);
                return { errorDetails: { message: (0, errorMessage_1.toErrorMessage)(e), responseIsIncomplete: true } };
            }
            finally {
                stream.close();
            }
        }
        async prepareHistoryTurns(agentId, context) {
            const res = [];
            for (const h of context.history) {
                const ehResult = typeConvert.ChatAgentResult.to(h.result);
                const result = agentId === h.request.agentId ?
                    ehResult :
                    { ...ehResult, metadata: undefined };
                // REQUEST turn
                res.push(new extHostTypes.ChatRequestTurn(h.request.message, h.request.command, h.request.variables.variables.map(typeConvert.ChatAgentResolvedVariable.to), h.request.agentId));
                // RESPONSE turn
                const parts = (0, arrays_1.coalesce)(h.response.map(r => typeConvert.ChatResponsePart.toContent(r, this.commands.converter)));
                res.push(new extHostTypes.ChatResponseTurn(parts, result, h.request.agentId, h.request.command));
            }
            return res;
        }
        $releaseSession(sessionId) {
            this._sessionDisposables.deleteAndDispose(sessionId);
        }
        async $provideFollowups(request, handle, result, context, token) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return Promise.resolve([]);
            }
            const convertedHistory = await this.prepareHistoryTurns(agent.id, context);
            const ehResult = typeConvert.ChatAgentResult.to(result);
            return (await agent.provideFollowups(ehResult, { history: convertedHistory }, token))
                .filter(f => {
                // The followup must refer to a participant that exists from the same extension
                const isValid = !f.participant || iterator_1.Iterable.some(this._agents.values(), a => a.id === f.participant && extensions_1.ExtensionIdentifier.equals(a.extension.identifier, agent.extension.identifier));
                if (!isValid) {
                    this._logService.warn(`[@${agent.id}] ChatFollowup refers to an unknown participant: ${f.participant}`);
                }
                return isValid;
            })
                .map(f => typeConvert.ChatFollowup.from(f, request));
        }
        $acceptFeedback(handle, result, vote, reportIssue) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return;
            }
            const ehResult = typeConvert.ChatAgentResult.to(result);
            let kind;
            switch (vote) {
                case chatService_1.InteractiveSessionVoteDirection.Down:
                    kind = extHostTypes.ChatResultFeedbackKind.Unhelpful;
                    break;
                case chatService_1.InteractiveSessionVoteDirection.Up:
                    kind = extHostTypes.ChatResultFeedbackKind.Helpful;
                    break;
            }
            agent.acceptFeedback(reportIssue ?
                Object.freeze({ result: ehResult, kind, reportIssue }) :
                Object.freeze({ result: ehResult, kind }));
        }
        $acceptAction(handle, result, event) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return;
            }
            if (event.action.kind === 'vote') {
                // handled by $acceptFeedback
                return;
            }
            const ehAction = typeConvert.ChatAgentUserActionEvent.to(result, event, this.commands.converter);
            if (ehAction) {
                agent.acceptAction(Object.freeze(ehAction));
            }
        }
        async $invokeCompletionProvider(handle, query, token) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return [];
            }
            const items = await agent.invokeCompletionProvider(query, token);
            return items.map((i) => typeConvert.ChatAgentCompletionItem.from(i, this.commands.converter, this._completionDisposables));
        }
        async $provideWelcomeMessage(handle, location, token) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return;
            }
            return await agent.provideWelcomeMessage(typeConvert.ChatLocation.to(location), token);
        }
        async $provideSampleQuestions(handle, location, token) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return;
            }
            return (await agent.provideSampleQuestions(typeConvert.ChatLocation.to(location), token))
                .map(f => typeConvert.ChatFollowup.from(f, undefined));
        }
    }
    exports.ExtHostChatAgents2 = ExtHostChatAgents2;
    class ExtHostChatAgent {
        constructor(extension, id, _proxy, _handle, _requestHandler) {
            this.extension = extension;
            this.id = id;
            this._proxy = _proxy;
            this._handle = _handle;
            this._requestHandler = _requestHandler;
            this._onDidReceiveFeedback = new event_1.Emitter();
            this._onDidPerformAction = new event_1.Emitter();
        }
        acceptFeedback(feedback) {
            this._onDidReceiveFeedback.fire(feedback);
        }
        acceptAction(event) {
            this._onDidPerformAction.fire(event);
        }
        async invokeCompletionProvider(query, token) {
            if (!this._agentVariableProvider) {
                return [];
            }
            return await this._agentVariableProvider.provider.provideCompletionItems(query, token) ?? [];
        }
        async provideFollowups(result, context, token) {
            if (!this._followupProvider) {
                return [];
            }
            const followups = await this._followupProvider.provideFollowups(result, context, token);
            if (!followups) {
                return [];
            }
            return followups
                // Filter out "command followups" from older providers
                .filter(f => !(f && 'commandId' in f))
                // Filter out followups from older providers before 'message' changed to 'prompt'
                .filter(f => !(f && 'message' in f));
        }
        async provideWelcomeMessage(location, token) {
            if (!this._welcomeMessageProvider) {
                return [];
            }
            const content = await this._welcomeMessageProvider.provideWelcomeMessage(location, token);
            if (!content) {
                return [];
            }
            return content.map(item => {
                if (typeof item === 'string') {
                    return item;
                }
                else {
                    return typeConvert.MarkdownString.from(item);
                }
            });
        }
        async provideSampleQuestions(location, token) {
            if (!this._welcomeMessageProvider || !this._welcomeMessageProvider.provideSampleQuestions) {
                return [];
            }
            const content = await this._welcomeMessageProvider.provideSampleQuestions(location, token);
            if (!content) {
                return [];
            }
            return content;
        }
        get apiAgent() {
            let disposed = false;
            let updateScheduled = false;
            const updateMetadataSoon = () => {
                if (disposed) {
                    return;
                }
                if (updateScheduled) {
                    return;
                }
                updateScheduled = true;
                queueMicrotask(() => {
                    this._proxy.$updateAgent(this._handle, {
                        fullName: this._fullName,
                        icon: !this._iconPath ? undefined :
                            this._iconPath instanceof uri_1.URI ? this._iconPath :
                                'light' in this._iconPath ? this._iconPath.light :
                                    undefined,
                        iconDark: !this._iconPath ? undefined :
                            'dark' in this._iconPath ? this._iconPath.dark :
                                undefined,
                        themeIcon: this._iconPath instanceof extHostTypes.ThemeIcon ? this._iconPath : undefined,
                        hasFollowups: this._followupProvider !== undefined,
                        isSecondary: this._isSecondary,
                        helpTextPrefix: (!this._helpTextPrefix || typeof this._helpTextPrefix === 'string') ? this._helpTextPrefix : typeConvert.MarkdownString.from(this._helpTextPrefix),
                        helpTextVariablesPrefix: (!this._helpTextVariablesPrefix || typeof this._helpTextVariablesPrefix === 'string') ? this._helpTextVariablesPrefix : typeConvert.MarkdownString.from(this._helpTextVariablesPrefix),
                        helpTextPostfix: (!this._helpTextPostfix || typeof this._helpTextPostfix === 'string') ? this._helpTextPostfix : typeConvert.MarkdownString.from(this._helpTextPostfix),
                        sampleRequest: this._sampleRequest,
                        supportIssueReporting: this._supportIssueReporting,
                        requester: this._requester
                    });
                    updateScheduled = false;
                });
            };
            const that = this;
            return {
                get id() {
                    return that.id;
                },
                get fullName() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._fullName ?? that.extension.displayName ?? that.extension.name;
                },
                set fullName(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._fullName = v;
                    updateMetadataSoon();
                },
                get iconPath() {
                    return that._iconPath;
                },
                set iconPath(v) {
                    that._iconPath = v;
                    updateMetadataSoon();
                },
                get requestHandler() {
                    return that._requestHandler;
                },
                set requestHandler(v) {
                    (0, types_1.assertType)(typeof v === 'function', 'Invalid request handler');
                    that._requestHandler = v;
                },
                get followupProvider() {
                    return that._followupProvider;
                },
                set followupProvider(v) {
                    that._followupProvider = v;
                    updateMetadataSoon();
                },
                get isDefault() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._isDefault;
                },
                set isDefault(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._isDefault = v;
                    updateMetadataSoon();
                },
                get helpTextPrefix() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._helpTextPrefix;
                },
                set helpTextPrefix(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._helpTextPrefix = v;
                    updateMetadataSoon();
                },
                get helpTextVariablesPrefix() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._helpTextVariablesPrefix;
                },
                set helpTextVariablesPrefix(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._helpTextVariablesPrefix = v;
                    updateMetadataSoon();
                },
                get helpTextPostfix() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._helpTextPostfix;
                },
                set helpTextPostfix(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._helpTextPostfix = v;
                    updateMetadataSoon();
                },
                get isSecondary() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._isSecondary;
                },
                set isSecondary(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._isSecondary = v;
                    updateMetadataSoon();
                },
                get sampleRequest() {
                    return that._sampleRequest;
                },
                set sampleRequest(v) {
                    that._sampleRequest = v;
                    updateMetadataSoon();
                },
                get supportIssueReporting() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'chatParticipantAdditions');
                    return that._supportIssueReporting;
                },
                set supportIssueReporting(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'chatParticipantAdditions');
                    that._supportIssueReporting = v;
                    updateMetadataSoon();
                },
                get onDidReceiveFeedback() {
                    return that._onDidReceiveFeedback.event;
                },
                set participantVariableProvider(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'chatParticipantAdditions');
                    that._agentVariableProvider = v;
                    if (v) {
                        if (!v.triggerCharacters.length) {
                            throw new Error('triggerCharacters are required');
                        }
                        that._proxy.$registerAgentCompletionsProvider(that._handle, v.triggerCharacters);
                    }
                    else {
                        that._proxy.$unregisterAgentCompletionsProvider(that._handle);
                    }
                },
                get participantVariableProvider() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'chatParticipantAdditions');
                    return that._agentVariableProvider;
                },
                set welcomeMessageProvider(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._welcomeMessageProvider = v;
                    updateMetadataSoon();
                },
                get welcomeMessageProvider() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._welcomeMessageProvider;
                },
                onDidPerformAction: !(0, extensions_2.isProposedApiEnabled)(this.extension, 'chatParticipantAdditions')
                    ? undefined
                    : this._onDidPerformAction.event,
                set requester(v) {
                    that._requester = v;
                    updateMetadataSoon();
                },
                get requester() {
                    return that._requester;
                },
                dispose() {
                    disposed = true;
                    that._followupProvider = undefined;
                    that._onDidReceiveFeedback.dispose();
                    that._proxy.$unregisterAgent(that._handle);
                },
            };
        }
        invoke(request, context, response, token) {
            return this._requestHandler(request, context, response, token);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENoYXRBZ2VudHMyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdENoYXRBZ2VudHMyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTBCaEcsTUFBTSx1QkFBdUI7UUFPNUIsWUFDa0IsVUFBaUMsRUFDakMsUUFBMkIsRUFDM0IsTUFBa0MsRUFDbEMsa0JBQXFDLEVBQ3JDLG1CQUFvQztZQUpwQyxlQUFVLEdBQVYsVUFBVSxDQUF1QjtZQUNqQyxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixXQUFNLEdBQU4sTUFBTSxDQUE0QjtZQUNsQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW1CO1lBQ3JDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBaUI7WUFWOUMsZUFBVSxHQUFHLHFCQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLGNBQVMsR0FBWSxLQUFLLENBQUM7UUFVL0IsQ0FBQztRQUVMLEtBQUs7WUFDSixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN2QixDQUFDO1FBRUQsSUFBSSxPQUFPO1lBQ1YsT0FBTztnQkFDTixhQUFhLEVBQUUsSUFBSSxDQUFDLGNBQWM7Z0JBQ2xDLFlBQVksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRTthQUN2QyxDQUFDO1FBQ0gsQ0FBQztRQUVELElBQUksU0FBUztZQUVaLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBRXRCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDbEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFeEIsU0FBUyxXQUFXLENBQUMsTUFBNEI7b0JBQ2hELElBQUksSUFBSSxDQUFD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