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
define(["require", "exports", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/accessibility/browser/accessibleViewContributions", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/actions/chatClearActions", "vs/workbench/contrib/chat/browser/actions/chatCodeblockActions", "vs/workbench/contrib/chat/browser/actions/chatCopyActions", "vs/workbench/contrib/chat/browser/actions/chatExecuteActions", "vs/workbench/contrib/chat/browser/actions/chatFileTreeActions", "vs/workbench/contrib/chat/browser/actions/chatImportExport", "vs/workbench/contrib/chat/browser/actions/chatMoveActions", "vs/workbench/contrib/chat/browser/actions/chatQuickInputActions", "vs/workbench/contrib/chat/browser/actions/chatTitleActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatAccessibilityService", "vs/workbench/contrib/chat/browser/chatEditor", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/browser/chatQuick", "vs/workbench/contrib/chat/browser/chatVariables", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/browser/codeBlockContextProviderService", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatServiceImpl", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/chat/common/chatWidgetHistoryService", "vs/workbench/contrib/chat/common/languageModels", "vs/workbench/contrib/chat/common/languageModelStats", "vs/workbench/contrib/chat/common/voiceChat", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/contrib/chat/browser/chatParticipantContributions", "vs/workbench/contrib/chat/browser/contrib/chatHistoryVariables", "vs/workbench/contrib/chat/browser/contrib/chatInputEditorContrib", "../common/chatColors"], function (require, exports, htmlContent_1, lifecycle_1, network_1, platform_1, codeEditorService_1, nls, commands_1, configurationRegistry_1, descriptors_1, extensions_1, instantiation_1, platform_2, editor_1, contributions_1, editor_2, accessibleView_1, accessibleViewActions_1, accessibleViewContributions_1, chatActions_1, chatClearActions_1, chatCodeblockActions_1, chatCopyActions_1, chatExecuteActions_1, chatFileTreeActions_1, chatImportExport_1, chatMoveActions_1, chatQuickInputActions_1, chatTitleActions_1, chat_1, chatAccessibilityService_1, chatEditor_1, chatEditorInput_1, chatQuick_1, chatVariables_1, chatWidget_1, codeBlockContextProviderService_1, chatAgents_1, chatContextKeys_1, chatModel_1, chatParserTypes_1, chatService_1, chatServiceImpl_1, chatSlashCommands_1, chatVariables_2, chatViewModel_1, chatWidgetHistoryService_1, languageModels_1, languageModelStats_1, voiceChat_1, editorResolverService_1, chatParticipantContributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register configuration
    const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'chatSidebar',
        title: nls.localize('interactiveSessionConfigurationTitle', "Chat"),
        type: 'object',
        properties: {
            'chat.editor.fontSize': {
                type: 'number',
                description: nls.localize('interactiveSession.editor.fontSize', "Controls the font size in pixels in chat codeblocks."),
                default: platform_1.isMacintosh ? 12 : 14,
            },
            'chat.editor.fontFamily': {
                type: 'string',
                description: nls.localize('interactiveSession.editor.fontFamily', "Controls the font family in chat codeblocks."),
                default: 'default'
            },
            'chat.editor.fontWeight': {
                type: 'string',
                description: nls.localize('interactiveSession.editor.fontWeight', "Controls the font weight in chat codeblocks."),
                default: 'default'
            },
            'chat.editor.wordWrap': {
                type: 'string',
                description: nls.localize('interactiveSession.editor.wordWrap', "Controls whether lines should wrap in chat codeblocks."),
                default: 'off',
                enum: ['on', 'off']
            },
            'chat.editor.lineHeight': {
                type: 'number',
                description: nls.localize('interactiveSession.editor.lineHeight', "Controls the line height in pixels in chat codeblocks. Use 0 to compute the line height from the font size."),
                default: 0
            },
            'chat.experimental.implicitContext': {
                type: 'boolean',
                description: nls.localize('chat.experimental.implicitContext', "Controls whether a checkbox is shown to allow the user to determine which implicit context is included with a chat participant's prompt."),
                default: false
            },
        }
    });
    platform_2.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(chatEditor_1.ChatEditor, chatEditorInput_1.ChatEditorInput.EditorID, nls.localize('chat', "Chat")), [
        new descriptors_1.SyncDescriptor(chatEditorInput_1.ChatEditorInput)
    ]);
    let ChatResolverContribution = class ChatResolverContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.chatResolver'; }
        constructor(editorResolverService, instantiationService) {
            super();
            this._register(editorResolverService.registerEditor(`${network_1.Schemas.vscodeChatSesssion}:**/**`, {
                id: chatEditorInput_1.ChatEditorInput.EditorID,
                label: nls.localize('chat', "Chat"),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {
                singlePerResource: true,
                canSupportResource: resource => resource.scheme === network_1.Schemas.vscodeChatSesssion
            }, {
                createEditorInput: ({ resource, options }) => {
                    return { editor: instantiationService.createInstance(chatEditorInput_1.ChatEditorInput, resource, options), options };
                }
            }));
        }
    };
    ChatResolverContribution = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, instantiation_1.IInstantiationService)
    ], ChatResolverContribution);
    class ChatAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(100, 'panelChat', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const widgetService = accessor.get(chat_1.IChatWidgetService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                return renderAccessibleView(accessibleViewService, widgetService, codeEditorService, true);
                function renderAccessibleView(accessibleViewService, widgetService, codeEditorService, initialRender) {
                    const widget = widgetService.lastFocusedWidget;
                    if (!widget) {
                        return false;
                    }
                    const chatInputFocused = initialRender && !!codeEditorService.getFocusedCodeEditor();
                    if (initialRender && chatInputFocused) {
                        widget.focusLastMessage();
                    }
                    if (!widget) {
                        return false;
                    }
                    const verifiedWidget = widget;
                    const focusedItem = verifiedWidget.getFocus();
                    if (!focusedItem) {
                        return false;
                    }
                    widget.focus(focusedItem);
                    const isWelcome = focusedItem instanceof chatModel_1.ChatWelcomeMessageModel;
                    let responseContent = (0, chatViewModel_1.isResponseVM)(focusedItem) ? focusedItem.response.asString() : undefined;
                    if (isWelcome) {
                        const welcomeReplyContents = [];
                        for (const content of focusedItem.content) {
                            if (Array.isArray(content)) {
                                welcomeReplyContents.push(...content.map(m => m.message));
                            }
                            else {
                                welcomeReplyContents.push(content.value);
                            }
                        }
                        responseContent = welcomeReplyContents.join('\n');
                    }
                    if (!responseContent && 'errorDetails' in focusedItem && focusedItem.errorDetails) {
                        responseContent = focusedItem.errorDetails.message;
                    }
                    if (!responseContent) {
                        return false;
                    }
                    const responses = verifiedWidget.viewModel?.getItems().filter(i => (0, chatViewModel_1.isResponseVM)(i));
                    const length = responses?.length;
                    const responseIndex = responses?.findIndex(i => i === focusedItem);
                    accessibleViewService.show({
                        id: "panelChat" /* AccessibleViewProviderId.Chat */,
                        verbositySettingKey: "accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */,
                        provideContent() { return responseContent; },
                        onClose() {
                            verifiedWidget.reveal(focusedItem);
                            if (chatInputFocused) {
                                verifiedWidget.focusInput();
                            }
                            else {
                                verifiedWidget.focus(focusedItem);
                            }
                        },
                        next() {
                            verifiedWidget.moveFocus(focusedItem, 'next');
                            (0, accessibleViewContributions_1.alertFocusChange)(responseIndex, length, 'next');
                            renderAccessibleView(accessibleViewService, widgetService, codeEditorService);
                        },
                        previous() {
                            verifiedWidget.moveFocus(focusedItem, 'previous');
                            (0, accessibleViewContributions_1.alertFocusChange)(responseIndex, length, 'previous');
                            renderAccessibleView(accessibleViewService, widgetService, codeEditorService);
                        },
                        options: { type: "view" /* AccessibleViewType.View */ }
                    });
                    return true;
                }
            }, chatContextKeys_1.CONTEXT_IN_CHAT_SESSION));
        }
    }
    let ChatSlashStaticSlashCommandsContribution = class ChatSlashStaticSlashCommandsContribution extends lifecycle_1.Disposable {
        constructor(slashCommandService, commandService, chatAgentService, chatVariablesService) {
            super();
            this._store.add(slashCommandService.registerSlashCommand({
                command: 'clear',
                detail: nls.localize('clear', "Start a new chat"),
                sortText: 'z2_clear',
                executeImmediately: true
            }, async () => {
                commandService.executeCommand(chatClearActions_1.ACTION_ID_NEW_CHAT);
            }));
            this._store.add(slashCommandService.registerSlashCommand({
                command: 'help',
                detail: '',
                sortText: 'z1_help',
                executeImmediately: true
            }, async (prompt, progress) => {
                const defaultAgent = chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel);
                const agents = chatAgentService.getAgents();
                // Report prefix
                if (defaultAgent?.metadata.helpTextPrefix) {
                    if ((0, htmlContent_1.isMarkdownString)(defaultAgent.metadata.helpTextPrefix)) {
                        progress.report({ content: defaultAgent.metadata.helpTextPrefix, kind: 'markdownContent' });
                    }
                    else {
                        progress.report({ content: new htmlContent_1.MarkdownString(defaultAgent.metadata.helpTextPrefix), kind: 'markdownContent' });
                    }
                    progress.report({ content: new htmlContent_1.MarkdownString('\n\n'), kind: 'markdownContent' });
                }
                // Report agent list
                const agentText = (await Promise.all(agents
                    .filter(a => a.id !== defaultAgent?.id)
                    .filter(a => a.locations.includes(chatAgents_1.ChatAgentLocation.Panel))
                    .map(async (a) => {
                    const agentWithLeader = `${chatParserTypes_1.chatAgentLeader}${a.name}`;
                    const actionArg = { inputValue: `${agentWithLeader} ${a.metadata.sampleRequest}` };
                    const urlSafeArg = encodeURIComponent(JSON.stringify(actionArg));
                    const description = a.description ? `- ${a.description}` : '';
                    const agentLine = `* [\`${agentWithLeader}\`](command:${chatExecuteActions_1.SubmitAction.ID}?${urlSafeArg}) ${description}`;
                    const commandText = a.slashCommands.map(c => {
                        const actionArg = { inputValue: `${agentWithLeader} ${chatParserTypes_1.chatSubcommandLeader}${c.name} ${c.sampleRequest ?? ''}` };
                        const urlSafeArg = encodeURIComponent(JSON.stringify(actionArg));
                        const description = c.description ? `- ${c.description}` : '';
                        return `\t* [\`${chatParserTypes_1.chatSubcommandLeader}${c.name}\`](command:${chatExecuteActions_1.SubmitAction.ID}?${urlSafeArg}) ${description}`;
                    }).join('\n');
                    return (agentLine + '\n' + commandText).trim();
                }))).join('\n');
                progress.report({ content: new htmlContent_1.MarkdownString(agentText, { isTrusted: { enabledCommands: [chatExecuteActions_1.SubmitAction.ID] } }), kind: 'markdownContent' });
                // Report variables
                if (defaultAgent?.metadata.helpTextVariablesPrefix) {
                    progress.report({ content: new htmlContent_1.MarkdownString('\n\n'), kind: 'markdownContent' });
                    if ((0, htmlContent_1.isMarkdownString)(defaultAgent.metadata.helpTextVariablesPrefix)) {
                        progress.report({ content: defaultAgent.metadata.helpTextVariablesPrefix, kind: 'markdownContent' });
                    }
                    else {
                        progress.report({ content: new htmlContent_1.MarkdownString(defaultAgent.metadata.helpTextVariablesPrefix), kind: 'markdownContent' });
                    }
                    const variables = [
                        ...chatVariablesService.getVariables(),
                        { name: 'file', description: nls.localize('file', "Choose a file in the workspace") }
                    ];
                    const variableText = variables
                        .map(v => `* \`${chatParserTypes_1.chatVariableLeader}${v.name}\` - ${v.description}`)
                        .join('\n');
                    progress.report({ content: new htmlContent_1.MarkdownString('\n' + variableText), kind: 'markdownContent' });
                }
                // Report help text ending
                if (defaultAgent?.metadata.helpTextPostfix) {
                    progress.report({ content: new htmlContent_1.MarkdownString('\n\n'), kind: 'markdownContent' });
                    if ((0, htmlContent_1.isMarkdownString)(defaultAgent.metadata.helpTextPostfix)) {
                        progress.report({ content: defaultAgent.metadata.helpTextPostfix, kind: 'markdownContent' });
                    }
                    else {
                        progress.report({ content: new htmlContent_1.MarkdownString(defaultAgent.metadata.helpTextPostfix), kind: 'markdownContent' });
                    }
                }
            }));
        }
    };
    ChatSlashStaticSlashCommandsContribution = __decorate([
        __param(0, chatSlashCommands_1.IChatSlashCommandService),
        __param(1, commands_1.ICommandService),
        __param(2, chatAgents_1.IChatAgentService),
        __param(3, chatVariables_2.IChatVariablesService)
    ], ChatSlashStaticSlashCommandsContribution);
    const workbenchContributionsRegistry = platform_2.Registry.as(contributions_1.Extensions.Workbench);
    (0, contributions_1.registerWorkbenchContribution2)(ChatResolverContribution.ID, ChatResolverContribution, 1 /* WorkbenchPhase.BlockStartup */);
    workbenchContributionsRegistry.registerWorkbenchContribution(ChatAccessibleViewContribution, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(ChatSlashStaticSlashCommandsContribution, 4 /* LifecyclePhase.Eventually */);
    platform_2.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(chatEditorInput_1.ChatEditorInput.TypeID, chatEditorInput_1.ChatEditorInputSerializer);
    (0, contributions_1.registerWorkbenchContribution2)(chatParticipantContributions_1.ChatExtensionPointHandler.ID, chatParticipantContributions_1.ChatExtensionPointHandler, 1 /* WorkbenchPhase.BlockStartup */);
    (0, chatActions_1.registerChatActions)();
    (0, chatCopyActions_1.registerChatCopyActions)();
    (0, chatCodeblockActions_1.registerChatCodeBlockActions)();
    (0, chatCodeblockActions_1.registerChatCodeCompareBlockActions)();
    (0, chatFileTreeActions_1.registerChatFileTreeActions)();
    (0, chatTitleActions_1.registerChatTitleActions)();
    (0, chatExecuteActions_1.registerChatExecuteActions)();
    (0, chatQuickInputActions_1.registerQuickChatActions)();
    (0, chatImportExport_1.registerChatExportActions)();
    (0, chatMoveActions_1.registerMoveActions)();
    (0, chatClearActions_1.registerNewChatActions)();
    (0, extensions_1.registerSingleton)(chatService_1.IChatService, chatServiceImpl_1.ChatService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chat_1.IChatWidgetService, chatWidget_1.ChatWidgetService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chat_1.IQuickChatService, chatQuick_1.QuickChatService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chat_1.IChatAccessibilityService, chatAccessibilityService_1.ChatAccessibilityService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chatWidgetHistoryService_1.IChatWidgetHistoryService, chatWidgetHistoryService_1.ChatWidgetHistoryService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(languageModels_1.ILanguageModelsService, languageModels_1.LanguageModelsService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(languageModelStats_1.ILanguageModelStatsService, languageModelStats_1.LanguageModelStatsService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chatSlashCommands_1.IChatSlashCommandService, chatSlashCommands_1.ChatSlashCommandService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chatAgents_1.IChatAgentService, chatAgents_1.ChatAgentService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chatAgents_1.IChatAgentNameService, chatAgents_1.ChatAgentNameService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chatVariables_2.IChatVariablesService, chatVariables_1.ChatVariablesService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(voiceChat_1.IVoiceChatService, voiceChat_1.VoiceChatService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(chat_1.IChatCodeBlockContextProviderService, codeBlockContextProviderService_1.ChatCodeBlockContextProviderService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvY2hhdC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUEyRGhHLHlCQUF5QjtJQUN6QixNQUFNLHFCQUFxQixHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN6RyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQztRQUMzQyxFQUFFLEVBQUUsYUFBYTtRQUNqQixLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRSxNQUFNLENBQUM7UUFDbkUsSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDWCxzQkFBc0IsRUFBRTtnQkFDdkIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0NBQW9DLEVBQUUsc0RBQXNELENBQUM7Z0JBQ3ZILE9BQU8sRUFBRSxzQkFBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7YUFDOUI7WUFDRCx3QkFBd0IsRUFBRTtnQkFDekIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0NBQXNDLEVBQUUsOENBQThDLENBQUM7Z0JBQ2pILE9BQU8sRUFBRSxTQUFTO2FBQ2xCO1lBQ0Qsd0JBQXdCLEVBQUU7Z0JBQ3pCLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHNDQUFzQyxFQUFFLDhDQUE4QyxDQUFDO2dCQUNqSCxPQUFPLEVBQUUsU0FBUzthQUNsQjtZQUNELHNCQUFz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