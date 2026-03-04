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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/common/views", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatViewPane", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, arrays_1, codicons_1, lifecycle_1, nls_1, contextkey_1, descriptors_1, log_1, productService_1, platform_1, viewPaneContainer_1, views_1, chat_1, chatViewPane_1, chatAgents_1, extensions_1, extensionsRegistry) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatExtensionPointHandler = void 0;
    const chatParticipantExtensionPoint = extensionsRegistry.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'chatParticipants',
        jsonSchema: {
            description: (0, nls_1.localize)('vscode.extension.contributes.chatParticipant', 'Contributes a chat participant'),
            type: 'array',
            items: {
                additionalProperties: false,
                type: 'object',
                defaultSnippets: [{ body: { name: '', description: '' } }],
                required: ['name', 'id'],
                properties: {
                    id: {
                        description: (0, nls_1.localize)('chatParticipantId', "A unique id for this chat participant."),
                        type: 'string'
                    },
                    name: {
                        description: (0, nls_1.localize)('chatParticipantName', "User-facing display name for this chat participant. The user will use '@' with this name to invoke the participant."),
                        type: 'string'
                    },
                    description: {
                        description: (0, nls_1.localize)('chatParticipantDescription', "A description of this chat participant, shown in the UI."),
                        type: 'string'
                    },
                    isDefault: {
                        markdownDescription: (0, nls_1.localize)('chatParticipantIsDefaultDescription', "**Only** allowed for extensions that have the `defaultChatParticipant` proposal."),
                        type: 'boolean',
                    },
                    isSticky: {
                        description: (0, nls_1.localize)('chatCommandSticky', "Whether invoking the command puts the chat into a persistent mode, where the command is automatically added to the chat input for the next message."),
                        type: 'boolean'
                    },
                    defaultImplicitVariables: {
                        markdownDescription: '**Only** allowed for extensions that have the `chatParticipantAdditions` proposal. The names of the variables that are invoked by default',
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    commands: {
                        markdownDescription: (0, nls_1.localize)('chatCommandsDescription', "Commands available for this chat participant, which the user can invoke with a `/`."),
                        type: 'array',
                        items: {
                            additionalProperties: false,
                            type: 'object',
                            defaultSnippets: [{ body: { name: '', description: '' } }],
                            required: ['name'],
                            properties: {
                                name: {
                                    description: (0, nls_1.localize)('chatCommand', "A short name by which this command is referred to in the UI, e.g. `fix` or * `explain` for commands that fix an issue or explain code. The name should be unique among the commands provided by this participant."),
                                    type: 'string'
                                },
                                description: {
                                    description: (0, nls_1.localize)('chatCommandDescription', "A description of this command."),
                                    type: 'string'
                                },
                                when: {
                                    description: (0, nls_1.localize)('chatCommandWhen', "A condition which must be true to enable this command."),
                                    type: 'string'
                                },
                                sampleRequest: {
                                    description: (0, nls_1.localize)('chatCommandSampleRequest', "When the user clicks this command in `/help`, this text will be submitted to this participant."),
                                    type: 'string'
                                },
                                isSticky: {
                                    description: (0, nls_1.localize)('chatCommandSticky', "Whether invoking the command puts the chat into a persistent mode, where the command is automatically added to the chat input for the next message."),
                                    type: 'boolean'
                                },
                                defaultImplicitVariables: {
                                    markdownDescription: (0, nls_1.localize)('defaultImplicitVariables', "**Only** allowed for extensions that have the `chatParticipantAdditions` proposal. The names of the variables that are invoked by default"),
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    }
                                },
                            }
                        }
                    },
                    locations: {
                        markdownDescription: (0, nls_1.localize)('chatLocationsDescription', "Locations in which this chat participant is available."),
                        type: 'array',
                        default: ['panel'],
                        items: {
                            type: 'string',
                            enum: ['panel', 'terminal', 'notebook']
                        }
                    }
                }
            }
        },
        activationEventsGenerator: (contributions, result) => {
            for (const contrib of contributions) {
                result.push(`onChatParticipant:${contrib.id}`);
            }
        },
    });
    let ChatExtensionPointHandler = class ChatExtensionPointHandler {
        static { this.ID = 'workbench.contrib.chatExtensionPointHandler'; }
        constructor(_chatAgentService, productService, contextService, logService) {
            this._chatAgentService = _chatAgentService;
            this.productService = productService;
            this.contextService = contextService;
            this.logService = logService;
            this.disposables = new lifecycle_1.DisposableStore();
            this._participantRegistrationDisposables = new lifecycle_1.DisposableMap();
            this._viewContainer = this.registerViewContainer();
            this.registerListeners();
            this.handleAndRegisterChatExtensions();
        }
        registerListeners() {
            this.contextService.onDidChangeContext(e => {
                if (!this.productService.chatWelcomeView) {
                    return;
                }
                const showWelcomeViewConfigKey = 'workbench.chat.experimental.showWelcomeView';
                const keys = new Set([showWelcomeViewConfigKey]);
                if (e.affectsSome(keys)) {
                    const contextKeyExpr = contextkey_1.ContextKeyExpr.equals(showWelcomeViewConfigKey, true);
                    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
                    if (this.contextService.contextMatchesRules(contextKeyExpr)) {
                        this._welcomeViewDescriptor = {
                            id: chat_1.CHAT_VIEW_ID,
                            name: { original: this.productService.chatWelcomeView.welcomeViewTitle, value: this.productService.chatWelcomeView.welcomeViewTitle },
                            containerIcon: this._viewContainer.icon,
                            ctorDescriptor: new descriptors_1.SyncDescriptor(chatViewPane_1.ChatViewPane),
                            canToggleVisibility: false,
                            canMoveView: true,
                            order: 100
                        };
                        viewsRegistry.registerViews([this._welcomeViewDescriptor], this._viewContainer);
                        viewsRegistry.registerViewWelcomeContent(chat_1.CHAT_VIEW_ID, {
                            content: this.productService.chatWelcomeView.welcomeViewContent,
                        });
                    }
                    else if (this._welcomeViewDescriptor) {
                        viewsRegistry.deregisterViews([this._welcomeViewDescriptor], this._viewContainer);
                    }
                }
            }, null, this.disposables);
        }
        handleAndRegisterChatExtensions() {
            chatParticipantExtensionPoint.setHandler((extensions, delta) => {
                for (const extension of delta.added) {
                    for (const providerDescriptor of extension.value) {
                        if (providerDescriptor.isDefault && !(0, extensions_1.isProposedApiEnabled)(extension.description, 'defaultChatParticipant')) {
                            this.logService.error(`Extension '${extension.description.identifier.value}' CANNOT use API proposal: defaultChatParticipant.`);
                            continue;
                        }
                        if (providerDescriptor.defaultImplicitVariables && !(0, extensions_1.isProposedApiEnabled)(extension.description, 'chatParticipantAdditions')) {
                            this.logService.error(`Extension '${extension.description.identifier.value}' CANNOT use API proposal: chatParticipantAdditions.`);
                            continue;
                        }
                        if (!providerDescriptor.id || !providerDescriptor.name) {
                            this.logService.error(`Extension '${extension.description.identifier.value}' CANNOT register participant without both id and name.`);
                            continue;
                        }
                        const store = new lifecycle_1.DisposableStore();
                        if (providerDescriptor.isDefault && (!providerDescriptor.locations || providerDescriptor.locations?.includes(chatAgents_1.ChatAgentLocation.Panel))) {
                            store.add(this.registerDefaultParticipantView(providerDescriptor));
                        }
                        store.add(this._chatAgentService.registerAgent(providerDescriptor.id, {
                            extensionId: extension.description.identifier,
                            extensionPublisherDisplayName: extension.description.publisherDisplayName ?? extension.description.publisher, // May not be present in OSS
                            extensionPublisherId: extension.description.publisher,
                            extensionDisplayName: extension.description.displayName ?? extension.description.name,
                            id: providerDescriptor.id,
                            description: providerDescriptor.description,
                            metadata: {
                                isSticky: providerDescriptor.isSticky,
                            },
                            name: providerDescriptor.name,
                            isDefault: providerDescriptor.isDefault,
                            defaultImplicitVariables: providerDescriptor.defaultImplicitVariables,
                            locations: (0, arrays_1.isNonEmptyArray)(providerDescriptor.locations) ?
                                providerDescriptor.locations.map(chatAgents_1.ChatAgentLocation.fromRaw) :
                                [chatAgents_1.ChatAgentLocation.Panel],
                            slashCommands: providerDescriptor.commands ?? []
                        }));
                        this._participantRegistrationDisposables.set(getParticipantKey(extension.description.identifier, providerDescriptor.id), store);
                    }
                }
                for (const extension of delta.removed) {
                    for (const providerDescriptor of extension.value) {
                        this._participantRegistrationDisposables.deleteAndDispose(getParticipantKey(extension.description.identifier, providerDescriptor.name));
                    }
                }
            });
        }
        registerViewContainer() {
            // Register View Container
            const title = (0, nls_1.localize2)('chat.viewContainer.label', "Chat");
            const icon = codicons_1.Codicon.commentDiscussion;
            const viewContainerId = chatViewPane_1.CHAT_SIDEBAR_PANEL_ID;
            const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                id: viewContainerId,
                title,
                icon,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [viewContainerId, { mergeViewWithContainerWhenSingleView: true }]),
                storageId: viewContainerId,
                hideIfEmpty: true,
                order: 100,
            }, 0 /* ViewContainerLocation.Sidebar */);
            return viewContainer;
        }
        registerDefaultParticipantView(defaultParticipantDescriptor) {
            // Register View
            const viewDescriptor = [{
                    id: chat_1.CHAT_VIEW_ID,
                    containerIcon: this._viewContainer.icon,
                    containerTitle: this._viewContainer.title.value,
                    singleViewPaneContainerTitle: this._viewContainer.title.value,
                    name: { value: defaultParticipantDescriptor.name, original: defaultParticipantDescriptor.name },
                    canToggleVisibility: false,
                    canMoveView: true,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(chatViewPane_1.ChatViewPane),
                }];
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews(viewDescriptor, this._viewContainer);
            return (0, lifecycle_1.toDisposable)(() => {
                platform_1.Registry.as(views_1.Extensions.ViewsRegistry).deregisterViews(viewDescriptor, this._viewContainer);
            });
        }
    };
    exports.ChatExtensionPointHandler = ChatExtensionPointHandler;
    exports.ChatExtensionPointHandler = ChatExtensionPointHandler = __decorate([
        __param(0, chatAgents_1.IChatAgentService),
        __param(1, productService_1.IProductService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, log_1.ILogService)
    ], ChatExtensionPointHandler);
    function getParticipantKey(extensionId, participantName) {
        return `${extensionId.value}_${participantName}`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFBhcnRpY2lwYW50Q29udHJpYnV0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0UGFydGljaXBhbnRDb250cmlidXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNCaEcsTUFBTSw2QkFBNkIsR0FBRyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxzQkFBc0IsQ0FBb0M7UUFDckksY0FBYyxFQUFFLGtCQUFrQjtRQUNsQyxVQUFVLEVBQUU7WUFDWCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsOENBQThDLEVBQUUsZ0NBQWdDLENBQUM7WUFDdkcsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUU7Z0JBQ04sb0JBQW9CLEVBQUUsS0FBSztnQkFDM0IsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsZUFBZSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMxRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDO2dCQUN4QixVQUFVLEVBQUU7b0JBQ1gsRUFBRSxFQUFFO3dCQUNILFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSx3Q0FBd0MsQ0FBQzt3QkFDcEYsSUFBSSxFQUFFLFFBQVE7cUJBQ2Q7b0JBQ0QsSUFBSSxFQUFFO3dCQUNMLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxxSEFBcUgsQ0FBQzt3QkFDbkssSUFBSSxFQUFFLFFBQVE7cUJBQ2Q7b0JBQ0QsV0FBVyxFQUFFO3dCQUNaLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFB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