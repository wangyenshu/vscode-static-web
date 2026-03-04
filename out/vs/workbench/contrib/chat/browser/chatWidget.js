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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/types", "vs/editor/browser/services/codeEditorService", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/theme/common/themeService", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatAccessibilityProvider", "vs/workbench/contrib/chat/browser/chatInputPart", "vs/workbench/contrib/chat/browser/chatListRenderer", "vs/workbench/contrib/chat/browser/chatOptions", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatRequestParser", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/chat/common/codeBlockModelCollection", "vs/css!./media/chat", "vs/css!./media/chatAgentHover"], function (require, exports, dom, async_1, errorMessage_1, event_1, lifecycle_1, network_1, resources_1, types_1, codeEditorService_1, actions_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, listService_1, log_1, themeService_1, chat_1, chatAccessibilityProvider_1, chatInputPart_1, chatListRenderer_1, chatOptions_1, chatAgents_1, chatContextKeys_1, chatModel_1, chatParserTypes_1, chatRequestParser_1, chatService_1, chatSlashCommands_1, chatViewModel_1, codeBlockModelCollection_1) {
    "use strict";
    var ChatWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatWidgetService = exports.ChatWidget = void 0;
    const $ = dom.$;
    function revealLastElement(list) {
        list.scrollTop = list.scrollHeight - list.renderHeight;
    }
    let ChatWidget = class ChatWidget extends lifecycle_1.Disposable {
        static { ChatWidget_1 = this; }
        static { this.CONTRIBS = []; }
        get visible() {
            return this._visible;
        }
        set viewModel(viewModel) {
            if (this._viewModel === viewModel) {
                return;
            }
            this.viewModelDisposables.clear();
            this._viewModel = viewModel;
            if (viewModel) {
                this.viewModelDisposables.add(viewModel);
            }
            this._onDidChangeViewModel.fire();
        }
        get viewModel() {
            return this._viewModel;
        }
        get parsedInput() {
            if (this.parsedChatRequest === undefined) {
                this.parsedChatRequest = this.instantiationService.createInstance(chatRequestParser_1.ChatRequestParser).parseChatRequest(this.viewModel.sessionId, this.getInput(), this.location, { selectedAgent: this._lastSelectedAgent });
                this.agentInInput.set((!!this.parsedChatRequest.parts.find(part => part instanceof chatParserTypes_1.ChatRequestAgentPart)));
            }
            return this.parsedChatRequest;
        }
        constructor(location, viewContext, viewOptions, styles, codeEditorService, contextKeyService, instantiationService, chatService, chatAgentService, chatWidgetService, contextMenuService, chatAccessibilityService, logService, themeService, chatSlashCommandService) {
            super();
            this.location = location;
            this.viewContext = viewContext;
            this.viewOptions = viewOptions;
            this.styles = styles;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this.chatService = chatService;
            this.chatAgentService = chatAgentService;
            this.contextMenuService = contextMenuService;
            this.chatAccessibilityService = chatAccessibilityService;
            this.logService = logService;
            this.themeService = themeService;
            this.chatSlashCommandService = chatSlashCommandService;
            this._onDidSubmitAgent = this._register(new event_1.Emitter());
            this.onDidSubmitAgent = this._onDidSubmitAgent.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidChangeViewModel = this._register(new event_1.Emitter());
            this.onDidChangeViewModel = this._onDidChangeViewModel.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidClear = this._register(new event_1.Emitter());
            this.onDidClear = this._onDidClear.event;
            this._onDidAcceptInput = this._register(new event_1.Emitter());
            this.onDidAcceptInput = this._onDidAcceptInput.event;
            this._onDidChangeParsedInput = this._register(new event_1.Emitter());
            this.onDidChangeParsedInput = this._onDidChangeParsedInput.event;
            this._onDidChangeHeight = this._register(new event_1.Emitter());
            this.onDidChangeHeight = this._onDidChangeHeight.event;
            this._onDidChangeContentHeight = new event_1.Emitter();
            this.onDidChangeContentHeight = this._onDidChangeContentHeight.event;
            this.contribs = [];
            this.visibleChangeCount = 0;
            this._visible = false;
            this.previousTreeScrollHeight = 0;
            this.viewModelDisposables = this._register(new lifecycle_1.DisposableStore());
            chatContextKeys_1.CONTEXT_IN_CHAT_SESSION.bindTo(contextKeyService).set(true);
            chatContextKeys_1.CONTEXT_CHAT_LOCATION.bindTo(contextKeyService).set(location);
            this.agentInInput = chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_AGENT.bindTo(contextKeyService);
            this.requestInProgress = chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.bindTo(contextKeyService);
            this._register(chatWidgetService.register(this));
            this._codeBlockModelCollection = this._register(instantiationService.createInstance(codeBlockModelCollection_1.CodeBlockModelCollection));
            this._register(codeEditorService.registerCodeEditorOpenHandler(async (input, _source, _sideBySide) => {
                if (input.resource.scheme !== network_1.Schemas.vscodeChatCodeBlock) {
                    return null;
                }
                const responseId = input.resource.path.split('/').at(1);
                if (!responseId) {
                    return null;
                }
                const item = this.viewModel?.getItems().find(item => item.id === responseId);
                if (!item) {
                    return null;
                }
                this.reveal(item);
                await (0, async_1.timeout)(0); // wait for list to actually render
                for (const editor of this.renderer.editorsInUse() ?? []) {
                    if (editor.uri?.toString() === input.resource.toString()) {
                        const inner = editor.editor;
                        if (input.options?.selection) {
                            inner.setSelection({
                                startLineNumber: input.options.selection.startLineNumber,
                                startColumn: input.options.selection.startColumn,
                                endLineNumber: input.options.selection.startLineNumber ?? input.options.selection.endLineNumber,
                                endColumn: input.options.selection.startColumn ?? input.options.selection.endColumn
                            });
                        }
                        return inner;
                    }
                }
                return null;
            }));
        }
        set lastSelectedAgent(agent) {
            this.parsedChatRequest = undefined;
            this._lastSelectedAgent = agent;
            this._onDidChangeParsedInput.fire();
        }
        get lastSelectedAgent() {
            return this._lastSelectedAgent;
        }
        get supportsFileReferences() {
            return !!this.viewOptions.supportsFileReferences;
        }
        get input() {
            return this.inputPart;
        }
        get inputEditor() {
            return this.inputPart.inputEditor;
        }
        get inputUri() {
            return this.inputPart.inputUri;
        }
        get contentHeight() {
            return this.inputPart.contentHeight + this.tree.contentHeight;
        }
        render(parent) {
            const viewId = 'viewId' in this.viewContext ? this.viewContext.viewId : undefined;
            this.editorOptions = this._register(this.instantiationService.createInstance(chatOptions_1.ChatEditorOptions, viewId, this.styles.listForeground, this.styles.inputEditorBackground, this.styles.resultEditorBackground));
            const renderInputOnTop = this.viewOptions.renderInputOnTop ?? false;
            const renderFollowups = this.viewOptions.renderFollowups ?? !renderInputOnTop;
            const renderStyle = this.viewOptions.renderStyle;
            this.container = dom.append(parent, $('.interactive-session'));
            if (renderInputOnTop) {
                this.createInput(this.container, { renderFollowups, renderStyle });
                this.listContainer = dom.append(this.container, $(`.interactive-list`));
            }
            else {
                this.listContainer = dom.append(this.container, $(`.interactive-list`));
                this.createInput(this.container, { renderFollowups, renderStyle });
            }
            this.createList(this.listContainer, { ...this.viewOptions.rendererOptions, renderStyle });
            this._register(this.editorOptions.onDidChange(() => this.onDidStyleChange()));
            this.onDidStyleChange();
            // Do initial render
            if (this.viewModel) {
                this.onDidChangeItems();
                revealLastElement(this.tree);
            }
            this.contribs = ChatWidget_1.CONTRIBS.map(contrib => {
                try {
                    return this._register(this.instantiationService.createInstance(contrib, this));
                }
                catch (err) {
                    this.logService.error('Failed to instantiate chat widget contrib', (0, errorMessage_1.toErrorMessage)(err));
                    return undefined;
                }
            }).filter(types_1.isDefined);
        }
        getContrib(id) {
            return this.contribs.find(c => c.id === id);
        }
        focusInput() {
            this.inputPart.focus();
        }
        hasInputFocus() {
            return this.inputPart.hasFocus();
        }
        moveFocus(item, type) {
            if (!(0, chatViewModel_1.isResponseVM)(item)) {
                return;
            }
            const items = this.viewModel?.getItems();
            if (!items) {
                return;
            }
            const responseItems = items.filter(i => (0, chatViewModel_1.isResponseVM)(i));
            const targetIndex = responseItems.indexOf(item);
            if (targetIndex === undefined) {
                return;
            }
            const indexToFocus = type === 'next' ? targetIndex + 1 : targetIndex - 1;
            if (indexToFocus < 0 || indexToFocus > responseItems.length - 1) {
                return;
            }
            this.focus(responseItems[indexToFocus]);
        }
        clear() {
            if (this._dynamicMessageLayoutData) {
                this._dynamicMessageLayoutData.enabled = true;
            }
            this._onDidClear.fire();
        }
        onDidChangeItems(skipDynamicLayout) {
            if (this.tree && this._visible) {
                const treeItems = (this.viewModel?.getItems() ?? [])
                    .map(item => {
                    return {
                        element: item,
                        collapsed: false,
                        collapsible: false
                    };
                });
                this.tree.setChildren(null, treeItems, {
                    diffIdentityProvider: {
                        getId: (element) => {
                            return (((0, chatViewModel_1.isResponseVM)(element) || (0, chatViewModel_1.isRequestVM)(element)) ? element.dataId : element.id) +
                                // TODO? We can give the welcome message a proper VM or get rid of the rest of the VMs
                                (((0, chatViewModel_1.isWelcomeVM)(element) && this.viewModel) ? `_${chatModel_1.ChatModelInitState[this.viewModel.initState]}` : '') +
                                // Ensure re-rendering an element once slash commands are loaded, so the colorization can be applied.
                                `${((0, chatViewModel_1.isRequestVM)(element) || (0, chatViewModel_1.isWelcomeVM)(element)) /* && !!this.lastSlashCommands ? '_scLoaded' : '' */}` +
                                // If a response is in the process of progressive rendering, we need to ensure that it will
                                // be re-rendered so progressive rendering is restarted, even if the model wasn't updated.
                                `${(0, chatViewModel_1.isResponseVM)(element) && element.renderData ? `_${this.visibleChangeCount}` : ''}` +
                                // Re-render once content references are loaded
                                ((0, chatViewModel_1.isResponseVM)(element) ? `_${element.contentReferences.length}` : '');
                        },
                    }
                });
                if (!skipDynamicLayout && this._dynamicMessageLayoutData) {
                    this.layoutDynamicChatTreeItemMode();
                }
                const lastItem = treeItems[treeItems.length - 1]?.element;
                if (lastItem && (0, chatViewModel_1.isResponseVM)(lastItem) && lastItem.isComplete) {
                    this.renderFollowups(lastItem.replyFollowups, lastItem);
                }
                else if (lastItem && (0, chatViewModel_1.isWelcomeVM)(lastItem)) {
                    this.renderFollowups(lastItem.sampleQuestions);
                }
                else {
                    this.renderFollowups(undefined);
                }
            }
        }
        async renderFollowups(items, response) {
            this.inputPart.renderFollowups(items, response);
            if (this.bodyDimension) {
                this.layout(this.bodyDimension.height, this.bodyDimension.width);
            }
        }
        setVisible(visible) {
            this._visible = visible;
            this.visibleChangeCount++;
            this.renderer.setVisible(visible);
            if (visible) {
                this._register((0, async_1.disposableTimeout)(() => {
                    // Progressive rendering paused while hidden, so start it up again.
                    // Do it after a timeout because the container is not visible yet (it should be but offsetHeight returns 0 here)
                    if (this._visible) {
                        this.onDidChangeItems(true);
                    }
                }, 0));
            }
        }
        createList(listContainer, options) {
            const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]));
            const delegate = scopedInstantiationService.createInstance(chatListRenderer_1.ChatListDelegate, this.viewOptions.defaultElementHeight ?? 200);
            const rendererDelegate = {
                getListLength: () => this.tree.getNode(null).visibleChildrenCount,
                onDidScroll: this.onDidScroll,
            };
            // Create a dom element to hold UI from editor widgets embedded in chat messages
            const overflowWidgetsContainer = document.createElement('div');
            overflowWidgetsContainer.classList.add('chat-overflow-widget-container', 'monaco-editor');
            listContainer.append(overflowWidgetsContainer);
            this.renderer = this._register(scopedInstantiationService.createInstance(chatListRenderer_1.ChatListItemRenderer, this.editorOptions, this.location, options, rendererDelegate, this._codeBlockModelCollection, overflowWidgetsContainer));
            this._register(this.renderer.onDidClickFollowup(item => {
                // is this used anymore?
                this.acceptInput(item.message);
            }));
            this.tree = scopedInstantiationService.createInstance(listService_1.WorkbenchObjectTree, 'Chat', listContainer, delegate, [this.renderer], {
                identityProvider: { getId: (e) => e.id },
                horizontalScrolling: false,
                supportDynamicHeights: true,
                hideTwistiesOfChildlessElements: true,
                accessibilityProvider: this.instantiationService.createInstance(chatAccessibilityProvider_1.ChatAccessibilityProvider),
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => (0, chatViewModel_1.isRequestVM)(e) ? e.message : (0, chatViewModel_1.isResponseVM)(e) ? e.response.value : '' }, // TODO
                setRowLineHeight: false,
                filter: this.viewOptions.filter ? { filter: this.viewOptions.filter.bind(this.viewOptions), } : undefined,
                overrideStyles: {
                    listFocusBackground: this.styles.listBackground,
                    listInactiveFocusBackground: this.styles.listBackground,
                    listActiveSelectionBackground: this.styles.listBackground,
                    listFocusAndSelectionBackground: this.styles.listBackground,
                    listInactiveSelectionBackground: this.styles.listBackground,
                    listHoverBackground: this.styles.listBackground,
                    listBackground: this.styles.listBackground,
                    listFocusForeground: this.styles.listForeground,
                    listHoverForeground: this.styles.listForeground,
                    listInactiveFocusForeground: this.styles.listForeground,
                    listInactiveSelectionForeground: this.styles.listForeground,
                    listActiveSelectionForeground: this.styles.listForeground,
                    listFocusAndSelectionForeground: this.styles.listForeground,
                }
            });
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this._register(this.tree.onDidChangeContentHeight(() => {
                this.onDidChangeTreeContentHeight();
            }));
            this._register(this.renderer.onDidChangeItemHeight(e => {
                this.tree.updateElementHeight(e.element, e.height);
            }));
            this._register(this.tree.onDidFocus(() => {
                this._onDidFocus.fire();
            }));
            this._register(this.tree.onDidScroll(() => {
                this._onDidScroll.fire();
            }));
        }
        onContextMenu(e) {
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            const selected = e.element;
            const scopedContextKeyService = this.contextKeyService.createOverlay([
                [chatContextKeys_1.CONTEXT_RESPONSE_FILTERED.key, (0, chatViewModel_1.isResponseVM)(selected) && !!selected.errorDetails?.responseIsFiltered]
            ]);
            this.contextMenuService.showContextMenu({
                menuId: actions_1.MenuId.ChatContext,
                menuActionOptions: { shouldForwardArgs: true },
                contextKeyService: scopedContextKeyService,
                getAnchor: () => e.anchor,
                getActionsContext: () => selected,
            });
        }
        onDidChangeTreeContentHeight() {
            if (this.tree.scrollHeight !== this.previousTreeScrollHeight) {
                // Due to rounding, the scrollTop + renderHeight will not exactly match the scrollHeight.
                // Consider the tree to be scrolled all the way down if it is within 2px of the bottom.
                const lastElementWasVisible = this.tree.scrollTop + this.tree.renderHeight >= this.previousTreeScrollHeight - 2;
                if (lastElementWasVisible) {
                    dom.scheduleAtNextAnimationFrame(dom.getWindow(this.listContainer), () => {
                        // Can't set scrollTop during this event listener, the list might overwrite the change
                        revealLastElement(this.tree);
                    }, 0);
                }
            }
            this.previousTreeScrollHeight = this.tree.scrollHeight;
            this._onDidChangeContentHeight.fire();
        }
        createInput(container, options) {
            this.inputPart = this._register(this.instantiationService.createInstance(chatInputPart_1.ChatInputPart, this.location, {
                renderFollowups: options?.renderFollowups ?? true,
                renderStyle: options?.renderStyle,
                menus: { executeToolbar: actions_1.MenuId.ChatExecute, ...this.viewOptions.menus },
                editorOverflowWidgetsDomNode: this.viewOptions.editorOverflowWidgetsDomNode,
            }));
            this.inputPart.render(container, '', this);
            this._register(this.inputPart.onDidLoadInputState(state => {
                this.contribs.forEach(c => {
                    if (c.setInputState && typeof state === 'object' && state?.[c.id]) {
                        c.setInputState(state[c.id]);
                    }
                });
            }));
            this._register(this.inputPart.onDidFocus(() => this._onDidFocus.fire()));
            this._register(this.inputPart.onDidAcceptFollowup(e => {
                if (!this.viewModel) {
                    return;
                }
                let msg = '';
                if (e.followup.agentId && e.followup.agentId !== this.chatAgentService.getDefaultAgent(this.location)?.id) {
                    const agent = this.chatAgentService.getAgent(e.followup.agentId);
                    if (!agent) {
                        return;
                    }
                    this.lastSelectedAgent = agent;
                    msg = `${chatParserTypes_1.chatAgentLeader}${agent.name} `;
                    if (e.followup.subCommand) {
                        msg += `${chatParserTypes_1.chatSubcommandLeader}${e.followup.subCommand} `;
                    }
                }
                else if (!e.followup.agentId && e.followup.subCommand && this.chatSlashCommandService.hasCommand(e.followup.subCommand)) {
                    msg = `${chatParserTypes_1.chatSubcommandLeader}${e.followup.subCommand} `;
                }
                msg += e.followup.message;
                this.acceptInput(msg);
                if (!e.response) {
                    // Followups can be shown by the welcome message, then there is no response associated.
                    // At some point we probably want telemetry for these too.
                    return;
                }
                this.chatService.notifyUserAction({
                    sessionId: this.viewModel.sessionId,
                    requestId: e.response.requestId,
                    agentId: e.response.agent?.id,
                    result: e.response.result,
                    action: {
                        kind: 'followUp',
                        followup: e.followup
                    },
                });
            }));
            this._register(this.inputPart.onDidChangeHeight(() => {
                if (this.bodyDimension) {
                    this.layout(this.bodyDimension.height, this.bodyDimension.width);
                }
                this._onDidChangeContentHeight.fire();
            }));
            this._register(this.inputEditor.onDidChangeModelContent(() => this.updateImplicitContextKinds()));
            this._register(this.chatAgentService.onDidChangeAgents(() => {
                if (this.viewModel) {
                    this.updateImplicitContextKinds();
                }
            }));
        }
        onDidStyleChange() {
            this.container.style.setProperty('--vscode-interactive-result-editor-background-color', this.editorOptions.configuration.resultEditor.backgroundColor?.toString() ?? '');
            this.container.style.setProperty('--vscode-interactive-session-foreground', this.editorOptions.configuration.foreground?.toString() ?? '');
            this.container.style.setProperty('--vscode-chat-list-background', this.themeService.getColorTheme().getColor(this.styles.listBackground)?.toString() ?? '');
        }
        updateImplicitContextKinds() {
            if (!this.viewModel) {
                return;
            }
            this.parsedChatRequest = undefined;
            const agentAndSubcommand = (0, chatParserTypes_1.extractAgentAndCommand)(this.parsedInput);
            const currentAgent = agentAndSubcommand.agentPart?.agent ?? this.chatAgentService.getDefaultAgent(this.location);
            const implicitVariables = agentAndSubcommand.commandPart ?
                agentAndSubcommand.commandPart.command.defaultImplicitVariables :
                currentAgent?.defaultImplicitVariables;
            this.inputPart.setImplicitContextKinds(implicitVariables ?? []);
            if (this.bodyDimension) {
                this.layout(this.bodyDimension.height, this.bodyDimension.width);
            }
        }
        setModel(model, viewState) {
            if (!this.container) {
                throw new Error('Call render() before setModel()');
            }
            this._codeBlockModelCollection.clear();
            this.container.setAttribute('data-session-id', model.sessionId);
            this.viewModel = this.instantiationService.createInstance(chatViewModel_1.ChatViewModel, model, this._codeBlockModelCollection);
            this.viewModelDisposables.add(event_1.Event.accumulate(this.viewModel.onDidChange, 0)(events => {
                if (!this.viewModel) {
                    return;
                }
                this.requestInProgress.set(this.viewModel.requestInProgress);
                this.onDidChangeItems();
                if (events.some(e => e?.kind === 'addRequest') && this.visible) {
                    revealLastElement(this.tree);
                    this.focusInput();
                }
            }));
            this.viewModelDisposables.add(this.viewModel.onDidDisposeModel(() => {
                // Ensure that view state is saved here, because we will load it again when a new model is assigned
                this.inputPart.saveState();
                // Disposes the viewmodel and listeners
                this.viewModel = undefined;
                this.onDidChangeItems();
            }));
            this.inputPart.setState(viewState.inputValue);
            this.contribs.forEach(c => {
                if (c.setInputState && viewState.inputState?.[c.id]) {
                    c.setInputState(viewState.inputState?.[c.id]);
                }
            });
            if (this.tree) {
                this.onDidChangeItems();
                revealLastElement(this.tree);
            }
            this.updateImplicitContextKinds();
        }
        getFocus() {
            return this.tree.getFocus()[0] ?? undefined;
        }
        reveal(item) {
            this.tree.reveal(item);
        }
        focus(item) {
            const items = this.tree.getNode(null).children;
            const node = items.find(i => i.element?.id === item.id);
            if (!node) {
                return;
            }
            this.tree.setFocus([node.element]);
            this.tree.domFocus();
        }
        refilter() {
            this.tree.refilter();
        }
        setInputPlaceholder(placeholder) {
            this.viewModel?.setInputPlaceholder(placeholder);
        }
        resetInputPlaceholder() {
            this.viewModel?.resetInputPlaceholder();
        }
        setInput(value = '') {
            this.inputPart.setValue(value);
        }
        getInput() {
            return this.inputPart.inputEditor.getValue();
        }
        async acceptInput(query) {
            this._acceptInput(query ? { query } : undefined);
        }
        async acceptInputWithPrefix(prefix) {
            this._acceptInput({ prefix });
        }
        collectInputState() {
            const inputState = {};
            this.contribs.forEach(c => {
                if (c.getInputState) {
                    inputState[c.id] = c.getInputState();
                }
            });
            return inputState;
        }
        async _acceptInput(opts) {
            if (this.viewModel) {
                this._onDidAcceptInput.fire();
                const editorValue = this.getInput();
                const requestId = this.chatAccessibilityService.acceptRequest();
                const input = !opts ? editorValue :
                    'query' in opts ? opts.query :
                        `${opts.prefix} ${editorValue}`;
                const isUserQuery = !opts || 'prefix' in opts;
                const result = await this.chatService.sendRequest(this.viewModel.sessionId, input, { implicitVariablesEnabled: this.inputPart.implicitContextEnabled, location: this.location, parserContext: { selectedAgent: this._lastSelectedAgent } });
                if (result) {
                    const inputState = this.collectInputState();
                    this.inputPart.acceptInput(isUserQuery ? input : undefined, isUserQuery ? inputState : undefined);
                    this._onDidSubmitAgent.fire({ agent: result.agent, slashCommand: result.slashCommand });
                    result.responseCompletePromise.then(async () => {
                        const responses = this.viewModel?.getItems().filter(chatViewModel_1.isResponseVM);
                        const lastResponse = responses?.[responses.length - 1];
                        this.chatAccessibilityService.acceptResponse(lastResponse, requestId);
                    });
                }
            }
        }
        getCodeBlockInfosForResponse(response) {
            return this.renderer.getCodeBlockInfosForResponse(response);
        }
        getCodeBlockInfoForEditor(uri) {
            return this.renderer.getCodeBlockInfoForEditor(uri);
        }
        getFileTreeInfosForResponse(response) {
            return this.renderer.getFileTreeInfosForResponse(response);
        }
        getLastFocusedFileTreeForResponse(response) {
            return this.renderer.getLastFocusedFileTreeForResponse(response);
        }
        focusLastMessage() {
            if (!this.viewModel) {
                return;
            }
            const items = this.tree.getNode(null).children;
            const lastItem = items[items.length - 1];
            if (!lastItem) {
                return;
            }
            this.tree.setFocus([lastItem.element]);
            this.tree.domFocus();
        }
        layout(height, width) {
            width = Math.min(width, 850);
            this.bodyDimension = new dom.Dimension(width, height);
            this.inputPart.layout(height, width);
            const inputPartHeight = this.inputPart.inputPartHeight;
            const lastElementVisible = this.tree.scrollTop + this.tree.renderHeight >= this.tree.scrollHeight;
            const listHeight = height - inputPartHeight;
            this.tree.layout(listHeight, width);
            this.tree.getHTMLElement().style.height = `${listHeight}px`;
            this.renderer.layout(width);
            if (lastElementVisible) {
                revealLastElement(this.tree);
            }
            this.listContainer.style.height = `${height - inputPartHeight}px`;
            this._onDidChangeHeight.fire(height);
        }
        // An alternative to layout, this allows you to specify the number of ChatTreeItems
        // you want to show, and the max height of the container. It will then layout the
        // tree to show that many items.
        // TODO@TylerLeonhardt: This could use some refactoring to make it clear which layout strategy is being used
        setDynamicChatTreeItemLayout(numOfChatTreeItems, maxHeight) {
            this._dynamicMessageLayoutData = { numOfMessages: numOfChatTreeItems, maxHeight, enabled: true };
            this._register(this.renderer.onDidChangeItemHeight(() => this.layoutDynamicChatTreeItemMode()));
            const mutableDisposable = this._register(new lifecycle_1.MutableDisposable());
            this._register(this.tree.onDidScroll((e) => {
                // TODO@TylerLeonhardt this should probably just be disposed when this is disabled
                // and then set up again when it is enabled again
                if (!this._dynamicMessageLayoutData?.enabled) {
                    return;
                }
                mutableDisposable.value = dom.scheduleAtNextAnimationFrame(dom.getWindow(this.listContainer), () => {
                    if (!e.scrollTopChanged || e.heightChanged || e.scrollHeightChanged) {
                        return;
                    }
                    const renderHeight = e.height;
                    const diff = e.scrollHeight - renderHeight - e.scrollTop;
                    if (diff === 0) {
                        return;
                    }
                    const possibleMaxHeight = (this._dynamicMessageLayoutData?.maxHeight ?? maxHeight);
                    const width = this.bodyDimension?.width ?? this.container.offsetWidth;
                    this.inputPart.layout(possibleMaxHeight, width);
                    const inputPartHeight = this.inputPart.inputPartHeight;
                    const newHeight = Math.min(renderHeight + diff, possibleMaxHeight - inputPartHeight);
                    this.layout(newHeight + inputPartHeight, width);
                });
            }));
        }
        updateDynamicChatTreeItemLayout(numOfChatTreeItems, maxHeight) {
            this._dynamicMessageLayoutData = { numOfMessages: numOfChatTreeItems, maxHeight, enabled: true };
            let hasChanged = false;
            let height = this.bodyDimension.height;
            let width = this.bodyDimension.width;
            if (maxHeight < this.bodyDimension.height) {
                height = maxHeight;
                hasChanged = true;
            }
            const containerWidth = this.container.offsetWidth;
            if (this.bodyDimension?.width !== containerWidth) {
                width = containerWidth;
                hasChanged = true;
            }
            if (hasChanged) {
                this.layout(height, width);
            }
        }
        get isDynamicChatTreeItemLayoutEnabled() {
            return this._dynamicMessageLayoutData?.enabled ?? false;
        }
        set isDynamicChatTreeItemLayoutEnabled(value) {
            if (!this._dynamicMessageLayoutData) {
                return;
            }
            this._dynamicMessageLayoutData.enabled = value;
        }
        layoutDynamicChatTreeItemMode() {
            if (!this.viewModel || !this._dynamicMessageLayoutData?.enabled) {
                return;
            }
            const width = this.bodyDimension?.width ?? this.container.offsetWidth;
            this.inputPart.layout(this._dynamicMessageLayoutData.maxHeight, width);
            const inputHeight = this.inputPart.inputPartHeight;
            const totalMessages = this.viewModel.getItems();
            // grab the last N messages
            const messages = totalMessages.slice(-this._dynamicMessageLayoutData.numOfMessages);
            const needsRerender = messages.some(m => m.currentRenderedHeight === undefined);
            const listHeight = needsRerender
                ? this._dynamicMessageLayoutData.maxHeight
                : messages.reduce((acc, message) => acc + message.currentRenderedHeight, 0);
            this.layout(Math.min(
            // we add an additional 18px in order to show that there is scrollable content
            inputHeight + listHeight + (totalMessages.length > 2 ? 18 : 0), this._dynamicMessageLayoutData.maxHeight), width);
            if (needsRerender || !listHeight) {
                // TODO: figure out a better place to reveal the last element
                revealLastElement(this.tree);
            }
        }
        saveState() {
            this.inputPart.saveState();
        }
        getViewState() {
            this.inputPart.saveState();
            return { inputValue: this.getInput(), inputState: this.collectInputState() };
        }
    };
    exports.ChatWidget = ChatWidget;
    exports.ChatWidget = ChatWidget = ChatWidget_1 = __decorate([
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, chatService_1.IChatService),
        __param(8, chatAgents_1.IChatAgentService),
        __param(9, chat_1.IChatWidgetService),
        __param(10, contextView_1.IContextMenuService),
        __param(11, chat_1.IChatAccessibilityService),
        __param(12, log_1.ILogService),
        __param(13, themeService_1.IThemeService),
        __param(14, chatSlashCommands_1.IChatSlashCommandService)
    ], ChatWidget);
    class ChatWidgetService {
        get lastFocusedWidget() {
            return this._lastFocusedWidget;
        }
        constructor() {
            this._widgets = [];
            this._lastFocusedWidget = undefined;
        }
        getWidgetByInputUri(uri) {
            return this._widgets.find(w => (0, resources_1.isEqual)(w.inputUri, uri));
        }
        getWidgetBySessionId(sessionId) {
            return this._widgets.find(w => w.viewModel?.sessionId === sessionId);
        }
        setLastFocusedWidget(widget) {
            if (widget === this._lastFocusedWidget) {
                return;
            }
            this._lastFocusedWidget = widget;
        }
        register(newWidget) {
            if (this._widgets.some(widget => widget === newWidget)) {
                throw new Error('Cannot register the same widget multiple times');
            }
            this._widgets.push(newWidget);
            return (0, lifecycle_1.combinedDisposable)(newWidget.onDidFocus(() => this.setLastFocusedWidget(newWidget)), (0, lifecycle_1.toDisposable)(() => this._widgets.splice(this._widgets.indexOf(newWidget), 1)));
        }
    }
    exports.ChatWidgetService = ChatWidgetService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0V2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5Q2hHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsU0FBUyxpQkFBaUIsQ0FBQyxJQUE4QjtRQUN4RCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztJQUN4RCxDQUFDO0lBNkJNLElBQU0sVUFBVSxHQUFoQixNQUFNLFVBQVcsU0FBUSxzQkFBVTs7aUJBQ2xCLGFBQVEsR0FBa0UsRUFBRSxBQUFwRSxDQUFxRTtRQStDcEcsSUFBVyxPQUFPO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBTUQsSUFBWSxTQUFTLENBQUMsU0FBb0M7WUFDekQsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNuQyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVsQyxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRUQsSUFBSSxTQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFHRCxJQUFJLFdBQVc7WUFD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