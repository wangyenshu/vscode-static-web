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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/observableInternal/base", "vs/base/common/strings", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/storage/common/storage", "vs/workbench/contrib/chat/common/chatContextKeys"], function (require, exports, async_1, cancellation_1, event_1, iterator_1, lifecycle_1, base_1, strings_1, contextkey_1, instantiation_1, log_1, productService_1, request_1, storage_1, chatContextKeys_1) {
    "use strict";
    var ChatAgentNameService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatAgentNameService = exports.IChatAgentNameService = exports.MergedChatAgent = exports.ChatAgentService = exports.IChatAgentService = exports.ChatAgentLocation = void 0;
    var ChatAgentLocation;
    (function (ChatAgentLocation) {
        ChatAgentLocation["Panel"] = "panel";
        ChatAgentLocation["Terminal"] = "terminal";
        ChatAgentLocation["Notebook"] = "notebook";
        ChatAgentLocation["Editor"] = "editor";
    })(ChatAgentLocation || (exports.ChatAgentLocation = ChatAgentLocation = {}));
    (function (ChatAgentLocation) {
        function fromRaw(value) {
            switch (value) {
                case 'panel': return ChatAgentLocation.Panel;
                case 'terminal': return ChatAgentLocation.Terminal;
                case 'notebook': return ChatAgentLocation.Notebook;
                case 'editor': return ChatAgentLocation.Editor;
            }
            return ChatAgentLocation.Panel;
        }
        ChatAgentLocation.fromRaw = fromRaw;
    })(ChatAgentLocation || (exports.ChatAgentLocation = ChatAgentLocation = {}));
    exports.IChatAgentService = (0, instantiation_1.createDecorator)('chatAgentService');
    let ChatAgentService = class ChatAgentService {
        static { this.AGENT_LEADER = '@'; }
        constructor(contextKeyService) {
            this.contextKeyService = contextKeyService;
            this._agents = [];
            this._onDidChangeAgents = new event_1.Emitter();
            this.onDidChangeAgents = this._onDidChangeAgents.event;
            this._hasDefaultAgent = chatContextKeys_1.CONTEXT_CHAT_ENABLED.bindTo(this.contextKeyService);
        }
        registerAgent(id, data) {
            const existingAgent = this.getAgent(id);
            if (existingAgent) {
                throw new Error(`Agent already registered: ${JSON.stringify(id)}`);
            }
            const that = this;
            const commands = data.slashCommands;
            data = {
                ...data,
                get slashCommands() {
                    return commands.filter(c => !c.when || that.contextKeyService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(c.when)));
                }
            };
            const entry = { data };
            this._agents.push(entry);
            return (0, lifecycle_1.toDisposable)(() => {
                this._agents = this._agents.filter(a => a !== entry);
                this._onDidChangeAgents.fire(undefined);
            });
        }
        registerAgentImplementation(id, agentImpl) {
            const entry = this._getAgentEntry(id);
            if (!entry) {
                throw new Error(`Unknown agent: ${JSON.stringify(id)}`);
            }
            if (entry.impl) {
                throw new Error(`Agent already has implementation: ${JSON.stringify(id)}`);
            }
            if (entry.data.isDefault) {
                this._hasDefaultAgent.set(true);
            }
            entry.impl = agentImpl;
            this._onDidChangeAgents.fire(new MergedChatAgent(entry.data, agentImpl));
            return (0, lifecycle_1.toDisposable)(() => {
                entry.impl = undefined;
                this._onDidChangeAgents.fire(undefined);
                if (entry.data.isDefault) {
                    this._hasDefaultAgent.set(false);
                }
            });
        }
        registerDynamicAgent(data, agentImpl) {
            const agent = { data, impl: agentImpl };
            this._agents.push(agent);
            this._onDidChangeAgents.fire(new MergedChatAgent(data, agentImpl));
            return (0, lifecycle_1.toDisposable)(() => {
                this._agents = this._agents.filter(a => a !== agent);
                this._onDidChangeAgents.fire(undefined);
            });
        }
        updateAgent(id, updateMetadata) {
            const agent = this._getAgentEntry(id);
            if (!agent?.impl) {
                throw new Error(`No activated agent with id ${JSON.stringify(id)} registered`);
            }
            agent.data.metadata = { ...agent.data.metadata, ...updateMetadata };
            this._onDidChangeAgents.fire(new MergedChatAgent(agent.data, agent.impl));
        }
        getDefaultAgent(location) {
            return this.getActivatedAgents().find(a => !!a.isDefault && a.locations.includes(location));
        }
        getContributedDefaultAgent(location) {
            return this.getAgents().find(a => !!a.isDefault && a.locations.includes(location));
        }
        getSecondaryAgent() {
            // TODO also static
            return iterator_1.Iterable.find(this._agents.values(), a => !!a.data.metadata.isSecondary)?.data;
        }
        _getAgentEntry(id) {
            return this._agents.find(a => a.data.id === id);
        }
        getAgent(id) {
            return this._getAgentEntry(id)?.data;
        }
        /**
         * Returns all agent datas that exist- static registered and dynamic ones.
         */
        getAgents() {
            return this._agents.map(entry => entry.data);
        }
        getActivatedAgents() {
            return Array.from(this._agents.values())
                .filter(a => !!a.impl)
                .map(a => new MergedChatAgent(a.data, a.impl));
        }
        getAgentsByName(name) {
            return this.getAgents().filter(a => a.name === name);
        }
        async invokeAgent(id, request, progress, history, token) {
            const data = this._getAgentEntry(id);
            if (!data?.impl) {
                throw new Error(`No activated agent with id ${id}`);
            }
            return await data.impl.invoke(request, progress, history, token);
        }
        async getFollowups(id, request, result, history, token) {
            const data = this._getAgentEntry(id);
            if (!data?.impl) {
                throw new Error(`No activated agent with id ${id}`);
            }
            if (!data.impl?.provideFollowups) {
                return [];
            }
            return data.impl.provideFollowups(request, result, history, token);
        }
    };
    exports.ChatAgentService = ChatAgentService;
    exports.ChatAgentService = ChatAgentService = __decorate([
        __param(0, contextkey_1.IContextKeyService)
    ], ChatAgentService);
    class MergedChatAgent {
        constructor(data, impl) {
            this.data = data;
            this.impl = impl;
        }
        get id() { return this.data.id; }
        get name() { return this.data.name ?? ''; }
        get description() { return this.data.description ?? ''; }
        get extensionId() { return this.data.extensionId; }
        get extensionPublisherId() { return this.data.extensionPublisherId; }
        get extensionPublisherDisplayName() { return this.data.extensionPublisherDisplayName; }
        get extensionDisplayName() { return this.data.extensionDisplayName; }
        get isDefault() { return this.data.isDefault; }
        get metadata() { return this.data.metadata; }
        get slashCommands() { return this.data.slashCommands; }
        get defaultImplicitVariables() { return this.data.defaultImplicitVariables; }
        get locations() { return this.data.locations; }
        async invoke(request, progress, history, token) {
            return this.impl.invoke(request, progress, history, token);
        }
        async provideFollowups(request, result, history, token) {
            if (this.impl.provideFollowups) {
                return this.impl.provideFollowups(request, result, history, token);
            }
            return [];
        }
        provideWelcomeMessage(location, token) {
            if (this.impl.provideWelcomeMessage) {
                return this.impl.provideWelcomeMessage(location, token);
            }
            return undefined;
        }
        provideSampleQuestions(location, token) {
            if (this.impl.provideSampleQuestions) {
                return this.impl.provideSampleQuestions(location, token);
            }
            return undefined;
        }
    }
    exports.MergedChatAgent = MergedChatAgent;
    exports.IChatAgentNameService = (0, instantiation_1.createDecorator)('chatAgentNameService');
    let ChatAgentNameService = class ChatAgentNameService {
        static { ChatAgentNameService_1 = this; }
        static { this.StorageKey = 'chat.participantNameRegistry'; }
        constructor(productService, requestService, logService, storageService) {
            this.requestService = requestService;
            this.logService = logService;
            this.storageService = storageService;
            this.registry = (0, base_1.observableValue)(this, Object.create(null));
            this.disposed = false;
            if (!productService.chatParticipantRegistry) {
                return;
            }
            this.url = productService.chatParticipantRegistry;
            const raw = storageService.get(ChatAgentNameService_1.StorageKey, -1 /* StorageScope.APPLICATION */);
            try {
                this.registry.set(JSON.parse(raw ?? '{}'), undefined);
            }
            catch (err) {
                storageService.remove(ChatAgentNameService_1.StorageKey, -1 /* StorageScope.APPLICATION */);
            }
            this.refresh();
        }
        refresh() {
            if (this.disposed) {
                return;
            }
            this.update()
                .catch(err => this.logService.warn('Failed to fetch chat participant registry', err))
                .then(() => (0, async_1.timeout)(5 * 60 * 1000)) // every 5 minutes
                .then(() => this.refresh());
        }
        async update() {
            const context = await this.requestService.request({ type: 'GET', url: this.url }, cancellation_1.CancellationToken.None);
            if (context.res.statusCode !== 200) {
                throw new Error('Could not get extensions report.');
            }
            const result = await (0, request_1.asJson)(context);
            if (!result || result.version !== 1) {
                throw new Error('Unexpected chat participant registry response.');
            }
            const registry = result.restrictedChatParticipants;
            this.registry.set(registry, undefined);
            this.storageService.store(ChatAgentNameService_1.StorageKey, JSON.stringify(registry), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        getAgentNameRestriction(chatAgentData) {
            const allowList = this.registry.map(registry => registry[chatAgentData.name.toLowerCase()]);
            return allowList.map(allowList => {
                if (!allowList) {
                    return true;
                }
                return allowList.some(id => (0, strings_1.equalsIgnoreCase)(id, id.includes('.') ? chatAgentData.extensionId.value : chatAgentData.extensionPublisherId));
            });
        }
        dispose() {
            this.disposed = true;
        }
    };
    exports.ChatAgentNameService = ChatAgentNameService;
    exports.ChatAgentNameService = ChatAgentNameService = ChatAgentNameService_1 = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, request_1.IRequestService),
        __param(2, log_1.ILogService),
        __param(3, storage_1.IStorageService)
    ], ChatAgentNameService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFnZW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvY29tbW9uL2NoYXRBZ2VudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtDaEcsSUFBWSxpQkFLWDtJQUxELFdBQVksaUJBQWlCO1FBQzVCLG9DQUFlLENBQUE7UUFDZiwwQ0FBcUIsQ0FBQTtRQUNyQiwwQ0FBcUIsQ0FBQTtRQUNyQixzQ0FBaUIsQ0FBQTtJQUNsQixDQUFDLEVBTFcsaUJBQWlCLGlDQUFqQixpQkFBaUIsUUFLNUI7SUFFRCxXQUFpQixpQkFBaUI7UUFDakMsU0FBZ0IsT0FBTyxDQUFDLEtBQTBDO1lBQ2pFLFFBQVEsS0FBSyxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxPQUFPLENBQUMsQ0FBQyxPQUFPLGlCQUFpQixDQUFDLEtBQUssQ0FBQztnQkFDN0MsS0FBSyxVQUFVLENBQUMsQ0FBQyxPQUFPLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztnQkFDbkQsS0FBSyxVQUFVLENBQUMsQ0FBQyxPQUFPLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztnQkFDbkQsS0FBSyxRQUFRLENBQUMsQ0FBQyxPQUFPLGlCQUFpQixDQUFDLE1BQU0sQ0FBQztZQUNoRCxDQUFDO1lBQ0QsT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7UUFDaEMsQ0FBQztRQVJlLHlCQUFPLFVBUXRCLENBQUE7SUFDRixDQUFDLEVBVmdCLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBVWpDO0lBK0VZLFFBQUEsaUJBQWlCLEdBQUcsSUFBQSwrQkFBZSxFQUFvQixrQkFBa0IsQ0FBQyxDQUFDO0lBb0NqRixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjtpQkFFTCxpQkFBWSxHQUFHLEdBQUcsQUFBTixD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