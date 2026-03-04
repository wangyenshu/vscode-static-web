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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/core/wordHelper", "vs/editor/common/services/languageFeatures", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatInputPart", "vs/workbench/contrib/chat/browser/contrib/chatDynamicVariables", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatRequestParser", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/extensions/common/extensions"], function (require, exports, lifecycle_1, marshalling_1, strings_1, uri_1, range_1, wordHelper_1, languageFeatures_1, extensions_1, instantiation_1, log_1, extHost_protocol_1, chat_1, chatInputPart_1, chatDynamicVariables_1, chatAgents_1, chatParserTypes_1, chatRequestParser_1, chatService_1, extHostCustomers_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadChatAgents2 = void 0;
    let MainThreadChatAgents2 = class MainThreadChatAgents2 extends lifecycle_1.Disposable {
        constructor(extHostContext, _chatAgentService, _chatService, _languageFeaturesService, _chatWidgetService, _instantiationService, _logService, _extensionService) {
            super();
            this._chatAgentService = _chatAgentService;
            this._chatService = _chatService;
            this._languageFeaturesService = _languageFeaturesService;
            this._chatWidgetService = _chatWidgetService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._extensionService = _extensionService;
            this._agents = this._register(new lifecycle_1.DisposableMap());
            this._agentCompletionProviders = this._register(new lifecycle_1.DisposableMap());
            this._pendingProgress = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostChatAgents2);
            this._register(this._chatService.onDidDisposeSession(e => {
                this._proxy.$releaseSession(e.sessionId);
            }));
            this._register(this._chatService.onDidPerformUserAction(e => {
                if (typeof e.agentId === 'string') {
                    for (const [handle, agent] of this._agents) {
                        if (agent.id === e.agentId) {
                            if (e.action.kind === 'vote') {
                                this._proxy.$acceptFeedback(handle, e.result ?? {}, e.action.direction);
                            }
                            else {
                                this._proxy.$acceptAction(handle, e.result || {}, e);
                            }
                            break;
                        }
                    }
                }
            }));
        }
        $unregisterAgent(handle) {
            this._agents.deleteAndDispose(handle);
        }
        $transferActiveChatSession(toWorkspace) {
            const widget = this._chatWidgetService.lastFocusedWidget;
            const sessionId = widget?.viewModel?.model.sessionId;
            if (!sessionId) {
                this._logService.error(`MainThreadChat#$transferActiveChatSession: No active chat session found`);
                return;
            }
            const inputValue = widget?.inputEditor.getValue() ?? '';
            this._chatService.transferChatSession({ sessionId, inputValue }, uri_1.URI.revive(toWorkspace));
        }
        $registerAgent(handle, extension, id, metadata, dynamicProps) {
            const staticAgentRegistration = this._chatAgentService.getAgent(id);
            if (!staticAgentRegistration && !dynamicProps) {
                if (this._chatAgentService.getAgentsByName(id).length) {
                    // Likely some extension authors will not adopt the new ID, so give a hint if they register a
                    // participant by name instead of ID.
                    throw new Error(`chatParticipant must be declared with an ID in package.json. The "id" property may be missing! "${id}"`);
                }
                throw new Error(`chatParticipant must be declared in package.json: ${id}`);
            }
            const impl = {
                invoke: async (request, progress, history, token) => {
                    this._pendingProgress.set(request.requestId, progress);
                    try {
                        return await this._proxy.$invokeAgent(handle, request, { history }, token) ?? {};
                    }
                    finally {
                        this._pendingProgress.delete(request.requestId);
                    }
                },
                provideFollowups: async (request, result, history, token) => {
                    if (!this._agents.get(handle)?.hasFollowups) {
                        return [];
                    }
                    return this._proxy.$provideFollowups(request, handle, result, { history }, token);
                },
                provideWelcomeMessage: (location, token) => {
                    return this._proxy.$provideWelcomeMessage(handle, location, token);
                },
                provideSampleQuestions: (location, token) => {
                    return this._proxy.$provideSampleQuestions(handle, location, token);
                }
            };
            let disposable;
            if (!staticAgentRegistration && dynamicProps) {
                const extensionDescription = this._extensionService.extensions.find(e => extensions_1.ExtensionIdentifier.equals(e.identifier, extension));
                disposable = this._chatAgentService.registerDynamicAgent({
                    id,
                    name: dynamicProps.name,
                    description: dynamicProps.description,
                    extensionId: extension,
                    extensionDisplayName: extensionDescription?.displayName ?? extension.value,
                    extensionPublisherId: extensionDescription?.publisher ?? '', // extensionDescription _should_ be present at this point, since this extension is active and registering agents
                    extensionPublisherDisplayName: extensionDescription?.publisherDisplayName,
                    metadata: (0, marshalling_1.revive)(metadata),
                    slashCommands: [],
                    locations: [chatAgents_1.ChatAgentLocation.Panel] // TODO all dynamic participants are panel only?
                }, impl);
            }
            else {
                disposable = this._chatAgentService.registerAgentImplementation(id, impl);
            }
            this._agents.set(handle, {
                id: id,
                extensionId: extension,
                dispose: disposable.dispose,
                hasFollowups: metadata.hasFollowups
            });
        }
        $updateAgent(handle, metadataUpdate) {
            const data = this._agents.get(handle);
            if (!data) {
                throw new Error(`No agent with handle ${handle} registered`);
            }
            data.hasFollowups = metadataUpdate.hasFollowups;
            this._chatAgentService.updateAgent(data.id, (0, marshalling_1.revive)(metadataUpdate));
        }
        async $handleProgressChunk(requestId, progress) {
            const revivedProgress = (0, marshalling_1.revive)(progress);
            this._pendingProgress.get(requestId)?.(revivedProgress);
        }
        $registerAgentCompletionsProvider(handle, triggerCharacters) {
            this._agentCompletionProviders.set(handle, this._languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatAgentCompletions:' + handle,
                triggerCharacters,
                provideCompletionItems: async (model, position, _context, token) => {
                    const widget = this._chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || !widget.viewModel) {
                        return;
                    }
                    const triggerCharsPart = triggerCharacters.map(c => (0, strings_1.escapeRegExpCharacters)(c)).join('');
                    const wordRegex = new RegExp(`[${triggerCharsPart}]\\S*`, 'g');
                    const query = (0, wordHelper_1.getWordAtText)(position.column, wordRegex, model.getLineContent(position.lineNumber), 0)?.word ?? '';
                    if (query && !triggerCharacters.some(c => query.startsWith(c))) {
                        return;
                    }
                    const parsedRequest = this._instantiationService.createInstance(chatRequestParser_1.ChatRequestParser).parseChatRequest(widget.viewModel.sessionId, model.getValue()).parts;
                    const agentPart = parsedRequest.find((part) => part instanceof chatParserTypes_1.ChatRequestAgentPart);
                    const thisAgentId = this._agents.get(handle)?.id;
                    if (agentPart?.agent.id !== thisAgentId) {
                        return;
                    }
                    const range = computeCompletionRanges(model, position, wordRegex);
                    if (!range) {
                        return null;
                    }
                    const result = await this._proxy.$invokeCompletionProvider(handle, query, token);
                    const variableItems = result.map(v => {
                        const insertText = v.insertText ?? (typeof v.label === 'string' ? v.label : v.label.label);
                        const rangeAfterInsert = new range_1.Range(range.insert.startLineNumber, range.insert.startColumn, range.insert.endLineNumber, range.insert.startColumn + insertText.length);
                        return {
                            label: v.label,
                            range,
                            insertText: insertText + ' ',
                            kind: 18 /* CompletionItemKind.Text */,
                            detail: v.detail,
                            documentation: v.documentation,
                            command: { id: chatDynamicVariables_1.AddDynamicVariableAction.ID, title: '', arguments: [{ widget, range: rangeAfterInsert, variableData: (0, marshalling_1.revive)(v.values), command: v.command }] }
                        };
                    });
                    return {
                        suggestions: variableItems
                    };
                }
            }));
        }
        $unregisterAgentCompletionsProvider(handle) {
            this._agentCompletionProviders.deleteAndDispose(handle);
        }
    };
    exports.MainThreadChatAgents2 = MainThreadChatAgents2;
    exports.MainThreadChatAgents2 = MainThreadChatAgents2 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadChatAgents2),
        __param(1, chatAgents_1.IChatAgentService),
        __param(2, chatService_1.IChatService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, chat_1.IChatWidgetService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, log_1.ILogService),
        __param(7, extensions_2.IExtensionService)
    ], MainThreadChatAgents2);
    function computeCompletionRanges(model, position, reg) {
        const varWord = (0, wordHelper_1.getWordAtText)(position.column, reg, model.getLineContent(position.lineNumber), 0);
        if (!varWord && model.getWordUntilPosition(position).word) {
            // inside a "normal" word
            return;
        }
        let insert;
        let replace;
        if (!varWord) {
            insert = replace = range_1.Range.fromPositions(position);
        }
        else {
            insert = new range_1.Range(position.lineNumber, varWord.startColumn, position.lineNumber, position.column);
            replace = new range_1.Range(position.lineNumber, varWord.startColumn, position.lineNumber, varWord.endColumn);
        }
        return { insert, replace };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENoYXRBZ2VudHMyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRDaGF0QWdlbnRzMi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQ3pGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7UUFRcEQsWUFDQyxjQUErQixFQUNaLGlCQUFxRCxFQUMxRCxZQUEyQyxFQUMvQix3QkFBbUUsRUFDekUsa0JBQXVELEVBQ3BELHFCQUE2RCxFQUN2RSxXQUF5QyxFQUNuQyxpQkFBcUQ7WUFFeEUsS0FBSyxFQUFFLENBQUM7WUFSNEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUN6QyxpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUNkLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDeEQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUNuQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3RELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ2xCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFkeEQsWUFBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUFxQixDQUFDLENBQUM7WUFDakUsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFhLEVBQXVCLENBQUMsQ0FBQztZQUVyRixxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztZQWNwRixJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRXpFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFD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