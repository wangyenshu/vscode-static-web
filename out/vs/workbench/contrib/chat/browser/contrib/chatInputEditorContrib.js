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
define(["require", "exports", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/core/wordHelper", "vs/editor/common/services/languageFeatures", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/contributions", "vs/workbench/contrib/chat/browser/actions/chatExecuteActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatInputPart", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/browser/contrib/chatDynamicVariables", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatColors", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatRequestParser", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables"], function (require, exports, htmlContent_1, lifecycle_1, codeEditorService_1, range_1, wordHelper_1, languageFeatures_1, nls_1, actions_1, instantiation_1, platform_1, colorRegistry_1, themeService_1, contributions_1, chatExecuteActions_1, chat_1, chatInputPart_1, chatWidget_1, chatDynamicVariables_1, chatAgents_1, chatColors_1, chatParserTypes_1, chatRequestParser_1, chatSlashCommands_1, chatVariables_1) {
    "use strict";
    var BuiltinDynamicCompletions_1, VariableCompletions_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const decorationDescription = 'chat';
    const placeholderDecorationType = 'chat-session-detail';
    const slashCommandTextDecorationType = 'chat-session-text';
    const variableTextDecorationType = 'chat-variable-text';
    function agentAndCommandToKey(agent, subcommand) {
        return subcommand ? `${agent.id}__${subcommand}` : agent.id;
    }
    let InputEditorDecorations = class InputEditorDecorations extends lifecycle_1.Disposable {
        constructor(widget, codeEditorService, themeService, chatAgentService) {
            super();
            this.widget = widget;
            this.codeEditorService = codeEditorService;
            this.themeService = themeService;
            this.chatAgentService = chatAgentService;
            this.id = 'inputEditorDecorations';
            this.previouslyUsedAgents = new Set();
            this.viewModelDisposables = this._register(new lifecycle_1.MutableDisposable());
            this.codeEditorService.registerDecorationType(decorationDescription, placeholderDecorationType, {});
            this._register(this.themeService.onDidColorThemeChange(() => this.updateRegisteredDecorationTypes()));
            this.updateRegisteredDecorationTypes();
            this.updateInputEditorDecorations();
            this._register(this.widget.inputEditor.onDidChangeModelContent(() => this.updateInputEditorDecorations()));
            this._register(this.widget.onDidChangeParsedInput(() => this.updateInputEditorDecorations()));
            this._register(this.widget.onDidChangeViewModel(() => {
                this.registerViewModelListeners();
                this.previouslyUsedAgents.clear();
                this.updateInputEditorDecorations();
            }));
            this._register(this.widget.onDidSubmitAgent((e) => {
                this.previouslyUsedAgents.add(agentAndCommandToKey(e.agent, e.slashCommand?.name));
            }));
            this._register(this.chatAgentService.onDidChangeAgents(() => this.updateInputEditorDecorations()));
            this.registerViewModelListeners();
        }
        registerViewModelListeners() {
            this.viewModelDisposables.value = this.widget.viewModel?.onDidChange(e => {
                if (e?.kind === 'changePlaceholder' || e?.kind === 'initialize') {
                    this.updateInputEditorDecorations();
                }
            });
        }
        updateRegisteredDecorationTypes() {
            this.codeEditorService.removeDecorationType(variableTextDecorationType);
            this.codeEditorService.removeDecorationType(chatDynamicVariables_1.dynamicVariableDecorationType);
            this.codeEditorService.removeDecorationType(slashCommandTextDecorationType);
            const theme = this.themeService.getColorTheme();
            this.codeEditorService.registerDecorationType(decorationDescription, slashCommandTextDecorationType, {
                color: theme.getColor(chatColors_1.chatSlashCommandForeground)?.toString(),
                backgroundColor: theme.getColor(chatColors_1.chatSlashCommandBackground)?.toString(),
                borderRadius: '3px'
            });
            this.codeEditorService.registerDecorationType(decorationDescription, variableTextDecorationType, {
                color: theme.getColor(chatColors_1.chatSlashCommandForeground)?.toString(),
                backgroundColor: theme.getColor(chatColors_1.chatSlashCommandBackground)?.toString(),
                borderRadius: '3px'
            });
            this.codeEditorService.registerDecorationType(decorationDescription, chatDynamicVariables_1.dynamicVariableDecorationType, {
                color: theme.getColor(chatColors_1.chatSlashCommandForeground)?.toString(),
                backgroundColor: theme.getColor(chatColors_1.chatSlashCommandBackground)?.toString(),
                borderRadius: '3px'
            });
            this.updateInputEditorDecorations();
        }
        getPlaceholderColor() {
            const theme = this.themeService.getColorTheme();
            const transparentForeground = theme.getColor(colorRegistry_1.inputPlaceholderForeground);
            return transparentForeground?.toString();
        }
        async updateInputEditorDecorations() {
            const inputValue = this.widget.inputEditor.getValue();
            const viewModel = this.widget.viewModel;
            if (!viewModel) {
                return;
            }
            if (!inputValue) {
                const defaultAgent = this.chatAgentService.getDefaultAgent(this.widget.location);
                const decoration = [
                    {
                        range: {
                            startLineNumber: 1,
                            endLineNumber: 1,
                            startColumn: 1,
                            endColumn: 1000
                        },
                        renderOptions: {
                            after: {
                                contentText: viewModel.inputPlaceholder || (defaultAgent?.description ?? ''),
                                color: this.getPlaceholderColor()
                            }
                        }
                    }
                ];
                this.widget.inputEditor.setDecorationsByType(decorationDescription, placeholderDecorationType, decoration);
                return;
            }
            const parsedRequest = this.widget.parsedInput.parts;
            let placeholderDecoration;
            const agentPart = parsedRequest.find((p) => p instanceof chatParserTypes_1.ChatRequestAgentPart);
            const agentSubcommandPart = parsedRequest.find((p) => p instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart);
            const slashCommandPart = parsedRequest.find((p) => p instanceof chatParserTypes_1.ChatRequestSlashCommandPart);
            const exactlyOneSpaceAfterPart = (part) => {
                const partIdx = parsedRequest.indexOf(part);
                if (parsedRequest.length > partIdx + 2) {
                    return false;
                }
                const nextPart = parsedRequest[partIdx + 1];
                return nextPart && nextPart instanceof chatParserTypes_1.ChatRequestTextPart && nextPart.text === ' ';
            };
            const getRangeForPlaceholder = (part) => ({
                startLineNumber: part.editorRange.startLineNumber,
                endLineNumber: part.editorRange.endLineNumber,
                startColumn: part.editorRange.endColumn + 1,
                endColumn: 1000
            });
            const onlyAgentAndWhitespace = agentPart && parsedRequest.every(p => p instanceof chatParserTypes_1.ChatRequestTextPart && !p.text.trim().length || p instanceof chatParserTypes_1.ChatRequestAgentPart);
            if (onlyAgentAndWhitespace) {
                // Agent reference with no other text - show the placeholder
                const isFollowupSlashCommand = this.previouslyUsedAgents.has(agentAndCommandToKey(agentPart.agent, undefined));
                const shouldRenderFollowupPlaceholder = isFollowupSlashCommand && agentPart.agent.metadata.followupPlaceholder;
                if (agentPart.agent.description && exactlyOneSpaceAfterPart(agentPart)) {
                    placeholderDecoration = [{
                            range: getRangeForPlaceholder(agentPart),
                            renderOptions: {
                                after: {
                                    contentText: shouldRenderFollowupPlaceholder ? agentPart.agent.metadata.followupPlaceholder : agentPart.agent.description,
                                    color: this.getPlaceholderColor(),
                                }
                            }
                        }];
                }
            }
            const onlyAgentCommandAndWhitespace = agentPart && agentSubcommandPart && parsedRequest.every(p => p instanceof chatParserTypes_1.ChatRequestTextPart && !p.text.trim().length || p instanceof chatParserTypes_1.ChatRequestAgentPart || p instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart);
            if (onlyAgentCommandAndWhitespace) {
                // Agent reference and subcommand with no other text - show the placeholder
                const isFollowupSlashCommand = this.previouslyUsedAgents.has(agentAndCommandToKey(agentPart.agent, agentSubcommandPart.command.name));
                const shouldRenderFollowupPlaceholder = isFollowupSlashCommand && agentSubcommandPart.command.followupPlaceholder;
                if (agentSubcommandPart?.command.description && exactlyOneSpaceAfterPart(agentSubcommandPart)) {
                    placeholderDecoration = [{
                            range: getRangeForPlaceholder(agentSubcommandPart),
                            renderOptions: {
                                after: {
                                    contentText: shouldRenderFollowupPlaceholder ? agentSubcommandPart.command.followupPlaceholder : agentSubcommandPart.command.description,
                                    color: this.getPlaceholderColor(),
                                }
                            }
                        }];
                }
            }
            this.widget.inputEditor.setDecorationsByType(decorationDescription, placeholderDecorationType, placeholderDecoration ?? []);
            const textDecorations = [];
            if (agentPart) {
                const isDupe = !!this.chatAgentService.getAgents().find(other => other.name === agentPart.agent.name && other.id !== agentPart.agent.id);
                const publisher = isDupe ? `(${agentPart.agent.extensionPublisherDisplayName}) ` : '';
                const agentHover = `${publisher}${agentPart.agent.description}`;
                textDecorations.push({ range: agentPart.editorRange, hoverMessage: new htmlContent_1.MarkdownString(agentHover) });
                if (agentSubcommandPart) {
                    textDecorations.push({ range: agentSubcommandPart.editorRange, hoverMessage: new htmlContent_1.MarkdownString(agentSubcommandPart.command.description) });
                }
            }
            if (slashCommandPart) {
                textDecorations.push({ range: slashCommandPart.editorRange });
            }
            this.widget.inputEditor.setDecorationsByType(decorationDescription, slashCommandTextDecorationType, textDecorations);
            const varDecorations = [];
            const variableParts = parsedRequest.filter((p) => p instanceof chatParserTypes_1.ChatRequestVariablePart);
            for (const variable of variableParts) {
                varDecorations.push({ range: variable.editorRange });
            }
            this.widget.inputEditor.setDecorationsByType(decorationDescription, variableTextDecorationType, varDecorations);
        }
    };
    InputEditorDecorations = __decorate([
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, themeService_1.IThemeService),
        __param(3, chatAgents_1.IChatAgentService)
    ], InputEditorDecorations);
    class InputEditorSlashCommandMode extends lifecycle_1.Disposable {
        constructor(widget) {
            super();
            this.widget = widget;
            this.id = 'InputEditorSlashCommandMode';
            this._register(this.widget.onDidSubmitAgent(e => {
                this.repopulateAgentCommand(e.agent, e.slashCommand);
            }));
        }
        async repopulateAgentCommand(agent, slashCommand) {
            let value;
            if (slashCommand && slashCommand.isSticky) {
                value = `${chatParserTypes_1.chatAgentLeader}${agent.name} ${chatParserTypes_1.chatSubcommandLeader}${slashCommand.name} `;
            }
            else if (agent.metadata.isSticky) {
                value = `${chatParserTypes_1.chatAgentLeader}${agent.name} `;
            }
            if (value) {
                this.widget.inputEditor.setValue(value);
                this.widget.inputEditor.setPosition({ lineNumber: 1, column: value.length + 1 });
            }
        }
    }
    chatWidget_1.ChatWidget.CONTRIBS.push(InputEditorDecorations, InputEditorSlashCommandMode);
    let SlashCommandCompletions = class SlashCommandCompletions extends lifecycle_1.Disposable {
        constructor(languageFeaturesService, chatWidgetService, chatSlashCommandService) {
            super();
            this.languageFeaturesService = languageFeaturesService;
            this.chatWidgetService = chatWidgetService;
            this.chatSlashCommandService = chatSlashCommandService;
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'globalSlashCommands',
                triggerCharacters: ['/'],
                provideCompletionItems: async (model, position, _context, _token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || !widget.viewModel || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return null;
                    }
                    const range = computeCompletionRanges(model, position, /\/\w*/g);
                    if (!range) {
                        return null;
                    }
                    const parsedRequest = widget.parsedInput.parts;
                    const usedAgent = parsedRequest.find(p => p instanceof chatParserTypes_1.ChatRequestAgentPart);
                    if (usedAgent) {
                        // No (classic) global slash commands when an agent is used
                        return;
                    }
                    const slashCommands = this.chatSlashCommandService.getCommands();
                    if (!slashCommands) {
                        return null;
                    }
                    return {
                        suggestions: slashCommands.map((c, i) => {
                            const withSlash = `/${c.command}`;
                            return {
                                label: withSlash,
                                insertText: c.executeImmediately ? '' : `${withSlash} `,
                                detail: c.detail,
                                range: new range_1.Range(1, 1, 1, 1),
                                sortText: c.sortText ?? 'a'.repeat(i + 1),
                                kind: 18 /* CompletionItemKind.Text */, // The icons are disabled here anyway,
                                command: c.executeImmediately ? { id: chatExecuteActions_1.SubmitAction.ID, title: withSlash, arguments: [{ widget, inputValue: `${withSlash} ` }] } : undefined,
                            };
                        })
                    };
                }
            }));
        }
    };
    SlashCommandCompletions = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, chat_1.IChatWidgetService),
        __param(2, chatSlashCommands_1.IChatSlashCommandService)
    ], SlashCommandCompletions);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(SlashCommandCompletions, 4 /* LifecyclePhase.Eventually */);
    let AgentCompletions = class AgentCompletions extends lifecycle_1.Disposable {
        constructor(languageFeaturesService, chatWidgetService, chatAgentService) {
            super();
            this.languageFeaturesService = languageFeaturesService;
            this.chatWidgetService = chatWidgetService;
            this.chatAgentService = chatAgentService;
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatAgent',
                triggerCharacters: ['@'],
                provideCompletionItems: async (model, position, _context, _token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || !widget.viewModel || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return null;
                    }
                    const parsedRequest = widget.parsedInput.parts;
                    const usedAgent = parsedRequest.find(p => p instanceof chatParserTypes_1.ChatRequestAgentPart);
                    if (usedAgent && !range_1.Range.containsPosition(usedAgent.editorRange, position)) {
                        // Only one agent allowed
                        return;
                    }
                    const range = computeCompletionRanges(model, position, /@\w*/g);
                    if (!range) {
                        return null;
                    }
                    const agents = this.chatAgentService.getAgents()
                        .filter(a => !a.isDefault)
                        .filter(a => a.locations.includes(widget.location));
                    return {
                        suggestions: agents.map((a, i) => {
                            const withAt = `@${a.name}`;
                            const isDupe = !!agents.find(other => other.name === a.name && other.id !== a.id);
                            return {
                                // Leading space is important because detail has no space at the start by design
                                label: isDupe ?
                                    { label: withAt, description: a.description, detail: ` (${a.extensionPublisherDisplayName})` } :
                                    withAt,
                                insertText: `${withAt} `,
                                detail: a.description,
                                range: new range_1.Range(1, 1, 1, 1),
                                command: { id: AssignSelectedAgentAction.ID, title: AssignSelectedAgentAction.ID, arguments: [{ agent: a, widget }] },
                                kind: 18 /* CompletionItemKind.Text */, // The icons are disabled here anyway
                            };
                        })
                    };
                }
            }));
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatAgentSubcommand',
                triggerCharacters: ['/'],
                provideCompletionItems: async (model, position, _context, token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || !widget.viewModel || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return;
                    }
                    const range = computeCompletionRanges(model, position, /\/\w*/g);
                    if (!range) {
                        return null;
                    }
                    const parsedRequest = widget.parsedInput.parts;
                    const usedAgentIdx = parsedRequest.findIndex((p) => p instanceof chatParserTypes_1.ChatRequestAgentPart);
                    if (usedAgentIdx < 0) {
                        return;
                    }
                    const usedSubcommand = parsedRequest.find(p => p instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart);
                    if (usedSubcommand) {
                        // Only one allowed
                        return;
                    }
                    for (const partAfterAgent of parsedRequest.slice(usedAgentIdx + 1)) {
                        // Could allow text after 'position'
                        if (!(partAfterAgent instanceof chatParserTypes_1.ChatRequestTextPart) || !partAfterAgent.text.trim().match(/^(\/\w*)?$/)) {
                            // No text allowed between agent and subcommand
                            return;
                        }
                    }
                    const usedAgent = parsedRequest[usedAgentIdx];
                    return {
                        suggestions: usedAgent.agent.slashCommands.map((c, i) => {
                            const withSlash = `/${c.name}`;
                            return {
                                label: withSlash,
                                insertText: `${withSlash} `,
                                detail: c.description,
                                range,
                                kind: 18 /* CompletionItemKind.Text */, // The icons are disabled here anyway
                            };
                        })
                    };
                }
            }));
            // list subcommands when the query is empty, insert agent+subcommand
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatAgentAndSubcommand',
                triggerCharacters: ['/'],
                provideCompletionItems: async (model, position, _context, token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    const viewModel = widget?.viewModel;
                    if (!widget || !viewModel || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return;
                    }
                    const range = computeCompletionRanges(model, position, /\/\w*/g);
                    if (!range) {
                        return null;
                    }
                    const agents = this.chatAgentService.getAgents()
                        .filter(a => a.locations.includes(widget.location));
                    const justAgents = agents
                        .filter(a => !a.isDefault)
                        .map(agent => {
                        const isDupe = !!agents.find(other => other.name === agent.name && other.id !== agent.id);
                        const detail = agent.description;
                        const agentLabel = `${chatParserTypes_1.chatAgentLeader}${agent.name}`;
                        return {
                            label: isDupe ?
                                { label: agentLabel, description: agent.description, detail: ` (${agent.extensionPublisherDisplayName})` } :
                                agentLabel,
                            detail,
                            filterText: `${chatParserTypes_1.chatSubcommandLeader}${agent.name}`,
                            insertText: `${agentLabel} `,
                            range: new range_1.Range(1, 1, 1, 1),
                            kind: 18 /* CompletionItemKind.Text */,
                            sortText: `${chatParserTypes_1.chatSubcommandLeader}${agent.id}`,
                            command: { id: AssignSelectedAgentAction.ID, title: AssignSelectedAgentAction.ID, arguments: [{ agent, widget }] },
                        };
                    });
                    return {
                        suggestions: justAgents.concat(agents.flatMap(agent => agent.slashCommands.map((c, i) => {
                            const agentLabel = `${chatParserTypes_1.chatAgentLeader}${agent.name}`;
                            const withSlash = `${chatParserTypes_1.chatSubcommandLeader}${c.name}`;
                            return {
                                label: { label: withSlash, description: agentLabel },
                                filterText: `${chatParserTypes_1.chatSubcommandLeader}${agent.name}${c.name}`,
                                commitCharacters: [' '],
                                insertText: `${agentLabel} ${withSlash} `,
                                detail: `(${agentLabel}) ${c.description ?? ''}`,
                                range: new range_1.Range(1, 1, 1, 1),
                                kind: 18 /* CompletionItemKind.Text */, // The icons are disabled here anyway
                                sortText: `${chatParserTypes_1.chatSubcommandLeader}${agent.id}${c.name}`,
                                command: { id: AssignSelectedAgentAction.ID, title: AssignSelectedAgentAction.ID, arguments: [{ agent, widget }] },
                            };
                        })))
                    };
                }
            }));
        }
    };
    AgentCompletions = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, chat_1.IChatWidgetService),
        __param(2, chatAgents_1.IChatAgentService)
    ], AgentCompletions);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(AgentCompletions, 4 /* LifecyclePhase.Eventually */);
    class AssignSelectedAgentAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.assignSelectedAgent'; }
        constructor() {
            super({
                id: AssignSelectedAgentAction.ID,
                title: '' // not displayed
            });
        }
        async run(accessor, ...args) {
            const arg = args[0];
            if (!arg || !arg.widget || !arg.agent) {
                return;
            }
            arg.widget.lastSelectedAgent = arg.agent;
        }
    }
    (0, actions_1.registerAction2)(AssignSelectedAgentAction);
    let BuiltinDynamicCompletions = class BuiltinDynamicCompletions extends lifecycle_1.Disposable {
        static { BuiltinDynamicCompletions_1 = this; }
        static { this.VariableNameDef = new RegExp(`${chatParserTypes_1.chatVariableLeader}\\w*`, 'g'); } // MUST be using `g`-flag
        constructor(languageFeaturesService, chatWidgetService) {
            super();
            this.languageFeaturesService = languageFeaturesService;
            this.chatWidgetService = chatWidgetService;
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatDynamicCompletions',
                triggerCharacters: [chatParserTypes_1.chatVariableLeader],
                provideCompletionItems: async (model, position, _context, _token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || !widget.supportsFileReferences || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return null;
                    }
                    const range = computeCompletionRanges(model, position, BuiltinDynamicCompletions_1.VariableNameDef);
                    if (!range) {
                        return null;
                    }
                    const afterRange = new range_1.Range(position.lineNumber, range.replace.startColumn, position.lineNumber, range.replace.startColumn + '#file:'.length);
                    return {
                        suggestions: [
                            {
                                label: `${chatParserTypes_1.chatVariableLeader}file`,
                                insertText: `${chatParserTypes_1.chatVariableLeader}file:`,
                                detail: (0, nls_1.localize)('pickFileLabel', "Pick a file"),
                                range,
                                kind: 18 /* CompletionItemKind.Text */,
                                command: { id: chatDynamicVariables_1.SelectAndInsertFileAction.ID, title: chatDynamicVariables_1.SelectAndInsertFileAction.ID, arguments: [{ widget, range: afterRange }] },
                                sortText: 'z'
                            }
                        ]
                    };
                }
            }));
        }
    };
    BuiltinDynamicCompletions = BuiltinDynamicCompletions_1 = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, chat_1.IChatWidgetService)
    ], BuiltinDynamicCompletions);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(BuiltinDynamicCompletions, 4 /* LifecyclePhase.Eventually */);
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
        return { insert, replace, varWord };
    }
    let VariableCompletions = class VariableCompletions extends lifecycle_1.Disposable {
        static { VariableCompletions_1 = this; }
        static { this.VariableNameDef = new RegExp(`${chatParserTypes_1.chatVariableLeader}\\w*`, 'g'); } // MUST be using `g`-flag
        constructor(languageFeaturesService, chatWidgetService, chatVariablesService) {
            super();
            this.languageFeaturesService = languageFeaturesService;
            this.chatWidgetService = chatWidgetService;
            this.chatVariablesService = chatVariablesService;
            this._register(this.languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatVariables',
                triggerCharacters: [chatParserTypes_1.chatVariableLeader],
                provideCompletionItems: async (model, position, _context, _token) => {
                    const widget = this.chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || widget.location !== chatAgents_1.ChatAgentLocation.Panel /* TODO@jrieken - enable when agents are adopted*/) {
                        return null;
                    }
                    const range = computeCompletionRanges(model, position, VariableCompletions_1.VariableNameDef);
                    if (!range) {
                        return null;
                    }
                    const usedVariables = widget.parsedInput.parts.filter((p) => p instanceof chatParserTypes_1.ChatRequestVariablePart);
                    const variableItems = Array.from(this.chatVariablesService.getVariables())
                        // This doesn't look at dynamic variables like `file`, where multiple makes sense.
                        .filter(v => !usedVariables.some(usedVar => usedVar.variableName === v.name))
                        .map(v => {
                        const withLeader = `${chatParserTypes_1.chatVariableLeader}${v.name}`;
                        return {
                            label: withLeader,
                            range,
                            insertText: withLeader + ' ',
                            detail: v.description,
                            kind: 18 /* CompletionItemKind.Text */, // The icons are disabled here anyway
                            sortText: 'z'
                        };
                    });
                    return {
                        suggestions: variableItems
                    };
                }
            }));
        }
    };
    VariableCompletions = VariableCompletions_1 = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, chat_1.IChatWidgetService),
        __param(2, chatVariables_1.IChatVariablesService)
    ], VariableCompletions);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(VariableCompletions, 4 /* LifecyclePhase.Eventually */);
    let ChatTokenDeleter = class ChatTokenDeleter extends lifecycle_1.Disposable {
        constructor(widget, instantiationService) {
            super();
            this.widget = widget;
            this.instantiationService = instantiationService;
            this.id = 'chatTokenDeleter';
            const parser = this.instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const inputValue = this.widget.inputEditor.getValue();
            let previousInputValue;
            let previousSelectedAgent;
            // A simple heuristic to delete the previous token when the user presses backspace.
            // The sophisticated way to do this would be to have a parse tree that can be updated incrementally.
            this._register(this.widget.inputEditor.onDidChangeModelContent(e => {
                if (!previousInputValue) {
                    previousInputValue = inputValue;
                    previousSelectedAgent = this.widget.lastSelectedAgent;
                }
                // Don't try to handle multicursor edits right now
                const change = e.changes[0];
                // If this was a simple delete, try to find out whether it was inside a token
                if (!change.text && this.widget.viewModel) {
                    const previousParsedValue = parser.parseChatRequest(this.widget.viewModel.sessionId, previousInputValue, chatAgents_1.ChatAgentLocation.Panel, { selectedAgent: previousSelectedAgent });
                    // For dynamic variables, this has to happen in ChatDynamicVariableModel with the other bookkeeping
                    const deletableTokens = previousParsedValue.parts.filter(p => p instanceof chatParserTypes_1.ChatRequestAgentPart || p instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart || p instanceof chatParserTypes_1.ChatRequestSlashCommandPart || p instanceof chatParserTypes_1.ChatRequestVariablePart);
                    deletableTokens.forEach(token => {
                        const deletedRangeOfToken = range_1.Range.intersectRanges(token.editorRange, change.range);
                        // Part of this token was deleted, or the space after it was deleted, and the deletion range doesn't go off the front of the token, for simpler math
                        if (deletedRangeOfToken && range_1.Range.compareRangesUsingStarts(token.editorRange, change.range) < 0) {
                            // Assume single line tokens
                            const length = deletedRangeOfToken.endColumn - deletedRangeOfToken.startColumn;
                            const rangeToDelete = new range_1.Range(token.editorRange.startLineNumber, token.editorRange.startColumn, token.editorRange.endLineNumber, token.editorRange.endColumn - length);
                            this.widget.inputEditor.executeEdits(this.id, [{
                                    range: rangeToDelete,
                                    text: '',
                                }]);
                        }
                    });
                }
                previousInputValue = this.widget.inputEditor.getValue();
                previousSelectedAgent = this.widget.lastSelectedAgent;
            }));
        }
    };
    ChatTokenDeleter = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ChatTokenDeleter);
    chatWidget_1.ChatWidget.CONTRIBS.push(ChatTokenDeleter);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdElucHV0RWRpdG9yQ29udHJpYi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jb250cmliL2NoYXRJbnB1dEVkaXRvckNvbnRyaWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUNoRyxNQUFNLHFCQUFxQixHQUFHLE1BQU0sQ0FBQztJQUNyQyxNQUFNLHlCQUF5QixHQUFHLHFCQUFxQixDQUFDO0lBQ3hELE1BQU0sOEJBQThCLEdBQUcsbUJBQW1CLENBQUM7SUFDM0QsTUFBTSwwQkFBMEIsR0FBRyxvQkFBb0IsQ0FBQztJQUV4RCxTQUFTLG9CQUFvQixDQUFDLEtBQXFCLEVBQUUsVUFBOEI7UUFDbEYsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLEVBQUUsS0FBSyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztJQUM3RCxDQUFDO0lBRUQsSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTtRQVE5QyxZQUNrQixNQUFtQixFQUNoQixpQkFBc0QsRUFDM0QsWUFBNEMsRUFDeEMsZ0JBQW9EO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBTFMsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDMUMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDdkIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQVZ4RCxPQUFFLEdBQUcsd0JBQXdCLENBQUM7WUFFN0IseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQUV6Qyx5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlC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