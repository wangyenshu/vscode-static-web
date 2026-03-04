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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/button/button", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/numbers", "vs/base/common/observable", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/themables", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/model/textModel", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/hover/browser/hover", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/opener/common/opener", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "vs/workbench/browser/labels", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatAgentHover", "vs/workbench/contrib/chat/browser/chatFollowups", "vs/workbench/contrib/chat/browser/chatMarkdownDecorationsRenderer", "vs/workbench/contrib/chat/browser/codeBlockPart", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/chat/common/chatWordCounter", "vs/workbench/contrib/files/browser/views/explorerView", "../common/annotations", "vs/editor/common/services/modelService", "vs/base/common/uuid"], function (require, exports, dom, aria_1, button_1, hoverDelegateFactory_1, iconLabels_1, arrays_1, async_1, cancellation_1, codicons_1, event_1, htmlContent_1, lifecycle_1, map_1, network_1, numbers_1, observable_1, path_1, resources_1, strings_1, themables_1, types_1, uri_1, markdownRenderer_1, range_1, languages_1, textModel_1, model_1, resolverService_1, nls_1, menuEntryActionViewItem_1, toolbar_1, actions_1, commands_1, configuration_1, contextkey_1, files_1, hover_1, instantiation_1, serviceCollection_1, listService_1, log_1, opener_1, defaultStyles_1, theme_1, themeService_1, labels_1, chat_1, chatAgentHover_1, chatFollowups_1, chatMarkdownDecorationsRenderer_1, codeBlockPart_1, chatAgents_1, chatContextKeys_1, chatParserTypes_1, chatService_1, chatVariables_1, chatViewModel_1, chatWordCounter_1, explorerView_1, annotations_1, modelService_1, uuid_1) {
    "use strict";
    var ChatListItemRenderer_1, ContentReferencesListRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatListDelegate = exports.ChatListItemRenderer = void 0;
    const $ = dom.$;
    const forceVerboseLayoutTracing = false;
    let ChatListItemRenderer = class ChatListItemRenderer extends lifecycle_1.Disposable {
        static { ChatListItemRenderer_1 = this; }
        static { this.ID = 'item'; }
        constructor(editorOptions, location, rendererOptions, delegate, codeBlockModelCollection, overflowWidgetsDomNode, instantiationService, configService, logService, openerService, contextKeyService, themeService, commandService, textModelService, modelService, hoverService, chatAgentNameService) {
            super();
            this.location = location;
            this.rendererOptions = rendererOptions;
            this.delegate = delegate;
            this.codeBlockModelCollection = codeBlockModelCollection;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.openerService = openerService;
            this.contextKeyService = contextKeyService;
            this.themeService = themeService;
            this.commandService = commandService;
            this.textModelService = textModelService;
            this.modelService = modelService;
            this.hoverService = hoverService;
            this.chatAgentNameService = chatAgentNameService;
            this.codeBlocksByResponseId = new Map();
            this.codeBlocksByEditorUri = new map_1.ResourceMap();
            this.fileTreesByResponseId = new Map();
            this.focusedFileTreesByResponseId = new Map();
            this._onDidClickFollowup = this._register(new event_1.Emitter());
            this.onDidClickFollowup = this._onDidClickFollowup.event;
            this._onDidChangeItemHeight = this._register(new event_1.Emitter());
            this.onDidChangeItemHeight = this._onDidChangeItemHeight.event;
            this._currentLayoutWidth = 0;
            this._isVisible = true;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this._usedReferencesEnabled = false;
            this.renderer = this._register(this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {}));
            this.markdownDecorationsRenderer = this.instantiationService.createInstance(chatMarkdownDecorationsRenderer_1.ChatMarkdownDecorationsRenderer);
            this._editorPool = this._register(this.instantiationService.createInstance(EditorPool, editorOptions, delegate, overflowWidgetsDomNode));
            this._diffEditorPool = this._register(this.instantiationService.createInstance(DiffEditorPool, editorOptions, delegate, overflowWidgetsDomNode));
            this._treePool = this._register(this.instantiationService.createInstance(TreePool, this._onDidChangeVisibility.event));
            this._contentReferencesListPool = this._register(this.instantiationService.createInstance(ContentReferencesListPool, this._onDidChangeVisibility.event));
            this._register(this.instantiationService.createInstance(codeBlockPart_1.ChatCodeBlockContentProvider));
            this._usedReferencesEnabled = configService.getValue('chat.experimental.usedReferences') ?? true;
            this._register(configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('chat.experimental.usedReferences')) {
                    this._usedReferencesEnabled = configService.getValue('chat.experimental.usedReferences') ?? true;
                }
            }));
        }
        get templateId() {
            return ChatListItemRenderer_1.ID;
        }
        editorsInUse() {
            return this._editorPool.inUse();
        }
        traceLayout(method, message) {
            if (forceVerboseLayoutTracing) {
                this.logService.info(`ChatListItemRenderer#${method}: ${message}`);
            }
            else {
                this.logService.trace(`ChatListItemRenderer#${method}: ${message}`);
            }
        }
        getProgressiveRenderRate(element) {
            if (element.isComplete) {
                return 80;
            }
            if (element.contentUpdateTimings && element.contentUpdateTimings.impliedWordLoadRate) {
                // words/s
                const minRate = 12;
                const maxRate = 80;
                // This doesn't account for dead time after the last update. When the previous update is the final one and the model is only waiting for followupQuestions, that's good.
                // When there was one quick update and then you are waiting longer for the next one, that's not good since the rate should be decreasing.
                // If it's an issue, we can change this to be based on the total time from now to the beginning.
                const rateBoost = 1.5;
                const rate = element.contentUpdateTimings.impliedWordLoadRate * rateBoost;
                return (0, numbers_1.clamp)(rate, minRate, maxRate);
            }
            return 8;
        }
        getCodeBlockInfosForResponse(response) {
            const codeBlocks = this.codeBlocksByResponseId.get(response.id);
            return codeBlocks ?? [];
        }
        getCodeBlockInfoForEditor(uri) {
            return this.codeBlocksByEditorUri.get(uri);
        }
        getFileTreeInfosForResponse(response) {
            const fileTrees = this.fileTreesByResponseId.get(response.id);
            return fileTrees ?? [];
        }
        getLastFocusedFileTreeForResponse(response) {
            const fileTrees = this.fileTreesByResponseId.get(response.id);
            const lastFocusedFileTreeIndex = this.focusedFileTreesByResponseId.get(response.id);
            if (fileTrees?.length && lastFocusedFileTreeIndex !== undefined && lastFocusedFileTreeIndex < fileTrees.length) {
                return fileTrees[lastFocusedFileTreeIndex];
            }
            return undefined;
        }
        setVisible(visible) {
            this._isVisible = visible;
            this._onDidChangeVisibility.fire(visible);
        }
        layout(width) {
            this._currentLayoutWidth = width - (this.rendererOptions.noPadding ? 0 : 40); // padding
            for (const editor of this._editorPool.inUse()) {
                editor.layout(this._currentLayoutWidth);
            }
            for (const diffEditor of this._diffEditorPool.inUse()) {
                diffEditor.layout(this._currentLayoutWidth);
            }
        }
        renderTemplate(container) {
            const templateDisposables = new lifecycle_1.DisposableStore();
            const rowContainer = dom.append(container, $('.interactive-item-container'));
            if (this.rendererOptions.renderStyle === 'compact') {
                rowContainer.classList.add('interactive-item-compact');
            }
            if (this.rendererOptions.noPadding) {
                rowContainer.classList.add('no-padding');
            }
            const header = dom.append(rowContainer, $('.header'));
            const user = dom.append(header, $('.user'));
            const avatarContainer = dom.append(user, $('.avatar-container'));
            const agentAvatarContainer = dom.append(user, $('.agent-avatar-container'));
            const username = dom.append(user, $('h3.username'));
            const detailContainer = dom.append(user, $('span.detail-container'));
            const detail = dom.append(detailContainer, $('span.detail'));
            dom.append(detailContainer, $('span.chat-animated-ellipsis'));
            const referencesListContainer = dom.append(rowContainer, $('.referencesListContainer'));
            const value = dom.append(rowContainer, $('.value'));
            const elementDisposables = new lifecycle_1.DisposableStore();
            const contextKeyService = templateDisposables.add(this.contextKeyService.createScoped(rowContainer));
            const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, contextKeyService]));
            let titleToolbar;
            if (this.rendererOptions.noHeader) {
                header.classList.add('hidden');
            }
            else {
                titleToolbar = templateDisposables.add(scopedInstantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, header, actions_1.MenuId.ChatMessageTitle, {
                    menuOptions: {
                        shouldForwardArgs: true
                    },
                    toolbarOptions: {
                        shouldInlineSubmenu: submenu => submenu.actions.length <= 1
                    },
                    actionViewItemProvider: (action, options) => {
                        if (action instanceof actions_1.MenuItemAction && (action.item.id === 'workbench.action.chat.voteDown' || action.item.id === 'workbench.action.chat.voteUp')) {
                            return scopedInstantiationService.createInstance(ChatVoteButton, action, options);
                        }
                        return (0, menuEntryActionViewItem_1.createActionViewItem)(scopedInstantiationService, action, options);
                    }
                }));
            }
            const agentHover = templateDisposables.add(this.instantiationService.createInstance(chatAgentHover_1.ChatAgentHover));
            templateDisposables.add(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), header, () => {
                if ((0, chatViewModel_1.isResponseVM)(template.currentElement) && template.currentElement.agent) {
                    agentHover.setAgent(template.currentElement.agent.id);
                    return agentHover.domNode;
                }
                return undefined;
            }));
            const template = { avatarContainer, agentAvatarContainer, username, detail, referencesListContainer, value, rowContainer, elementDisposables, titleToolbar, templateDisposables, contextKeyService, agentHover };
            return template;
        }
        renderElement(node, index, templateData) {
            this.renderChatTreeItem(node.element, index, templateData);
        }
        renderChatTreeItem(element, index, templateData) {
            templateData.currentElement = element;
            const kind = (0, chatViewModel_1.isRequestVM)(element) ? 'request' :
                (0, chatViewModel_1.isResponseVM)(element) ? 'response' :
                    'welcome';
            this.traceLayout('renderElement', `${kind}, index=${index}`);
            chatContextKeys_1.CONTEXT_RESPONSE.bindTo(templateData.contextKeyService).set((0, chatViewModel_1.isResponseVM)(element));
            chatContextKeys_1.CONTEXT_REQUEST.bindTo(templateData.contextKeyService).set((0, chatViewModel_1.isRequestVM)(element));
            chatContextKeys_1.CONTEXT_RESPONSE_DETECTED_AGENT_COMMAND.bindTo(templateData.contextKeyService).set((0, chatViewModel_1.isResponseVM)(element) && element.agentOrSlashCommandDetected);
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                chatContextKeys_1.CONTEXT_CHAT_RESPONSE_SUPPORT_ISSUE_REPORTING.bindTo(templateData.contextKeyService).set(!!element.agent?.metadata.supportIssueReporting);
                chatContextKeys_1.CONTEXT_RESPONSE_VOTE.bindTo(templateData.contextKeyService).set(element.vote === chatService_1.InteractiveSessionVoteDirection.Up ? 'up' : element.vote === chatService_1.InteractiveSessionVoteDirection.Down ? 'down' : '');
            }
            else {
                chatContextKeys_1.CONTEXT_RESPONSE_VOTE.bindTo(templateData.contextKeyService).set('');
            }
            if (templateData.titleToolbar) {
                templateData.titleToolbar.context = element;
            }
            const isFiltered = !!((0, chatViewModel_1.isResponseVM)(element) && element.errorDetails?.responseIsFiltered);
            chatContextKeys_1.CONTEXT_RESPONSE_FILTERED.bindTo(templateData.contextKeyService).set(isFiltered);
            templateData.rowContainer.classList.toggle('interactive-request', (0, chatViewModel_1.isRequestVM)(element));
            templateData.rowContainer.classList.toggle('interactive-response', (0, chatViewModel_1.isResponseVM)(element));
            templateData.rowContainer.classList.toggle('interactive-welcome', (0, chatViewModel_1.isWelcomeVM)(element));
            templateData.rowContainer.classList.toggle('filtered-response', isFiltered);
            templateData.rowContainer.classList.toggle('show-detail-progress', (0, chatViewModel_1.isResponseVM)(element) && !element.isComplete && !element.progressMessages.length);
            templateData.username.textContent = element.username;
            if (!this.rendererOptions.noHeader) {
                this.renderAvatar(element, templateData);
            }
            dom.clearNode(templateData.detail);
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                this.renderDetail(element, templateData);
            }
            // Do a progressive render if
            // - This the last response in the list
            // - And it has some content
            // - And the response is not complete
            //   - Or, we previously started a progressive rendering of this element (if the element is complete, we will finish progressive rendering with a very fast rate)
            // - And, the feature is not disabled in configuration
            if ((0, chatViewModel_1.isResponseVM)(element) && index === this.delegate.getListLength() - 1 && (!element.isComplete || element.renderData) && element.response.value.length) {
                this.traceLayout('renderElement', `start progressive render ${kind}, index=${index}`);
                const progressiveRenderingDisposables = templateData.elementDisposables.add(new lifecycle_1.DisposableStore());
                const timer = templateData.elementDisposables.add(new dom.WindowIntervalTimer());
                const runProgressiveRender = (initial) => {
                    try {
                        if (this.doNextProgressiveRender(element, index, templateData, !!initial, progressiveRenderingDisposables)) {
                            timer.cancel();
                        }
                    }
                    catch (err) {
                        // Kill the timer if anything went wrong, avoid getting stuck in a nasty rendering loop.
                        timer.cancel();
                        throw err;
                    }
                };
                timer.cancelAndSet(runProgressiveRender, 50, dom.getWindow(templateData.rowContainer));
                runProgressiveRender(true);
            }
            else if ((0, chatViewModel_1.isResponseVM)(element)) {
                const renderableResponse = (0, annotations_1.annotateSpecialMarkdownContent)(element.response.value);
                this.basicRenderElement(renderableResponse, element, index, templateData);
            }
            else if ((0, chatViewModel_1.isRequestVM)(element)) {
                const markdown = 'message' in element.message ?
                    element.message.message :
                    this.markdownDecorationsRenderer.convertParsedRequestToMarkdown(element.message);
                this.basicRenderElement([{ content: new htmlContent_1.MarkdownString(markdown), kind: 'markdownContent' }], element, index, templateData);
            }
            else {
                this.renderWelcomeMessage(element, templateData);
            }
        }
        renderDetail(element, templateData) {
            let agentName = (0, observable_1.constObservable)(undefined);
            if (element.agent && !element.agent.isDefault) {
                const name = element.agent.name;
                agentName = this.chatAgentNameService.getAgentNameRestriction(element.agent)
                    .map(allowed => allowed ? name : name); // TODO
            }
            templateData.elementDisposables.add((0, observable_1.autorun)(reader => {
                this._renderDetail(element, agentName.read(reader), templateData);
            }));
        }
        _renderDetail(element, agentName, templateData) {
            let progressMsg = '';
            if (!(0, types_1.isUndefined)(agentName)) {
                let usingMsg = chatParserTypes_1.chatAgentLeader + agentName;
                if (element.slashCommand) {
                    usingMsg += ` ${chatParserTypes_1.chatSubcommandLeader}${element.slashCommand.name}`;
                }
                if (element.isComplete) {
                    progressMsg = (0, nls_1.localize)('usedAgent', "used {0}", usingMsg);
                }
                else {
                    progressMsg = (0, nls_1.localize)('usingAgent', "using {0}", usingMsg);
                }
            }
            else if (element.agentOrSlashCommandDetected) {
                const usingMsg = [];
                if (!(0, types_1.isUndefined)(agentName)) {
                    usingMsg.push(chatParserTypes_1.chatAgentLeader + agentName);
                }
                if (element.slashCommand) {
                    usingMsg.push(chatParserTypes_1.chatSubcommandLeader + element.slashCommand.name);
                }
                if (usingMsg.length) {
                    if (element.isComplete) {
                        progressMsg = (0, nls_1.localize)('usedAgent', "used {0}", usingMsg.join(' '));
                    }
                    else {
                        progressMsg = (0, nls_1.localize)('usingAgent', "using {0}", usingMsg.join(' '));
                    }
                }
            }
            else if (!element.isComplete) {
                progressMsg = chat_1.GeneratingPhrase;
            }
            templateData.detail.textContent = progressMsg;
        }
        renderAvatar(element, templateData) {
            if (uri_1.URI.isUri(element.avatarIcon)) {
                const avatarImgIcon = dom.$('img.icon');
                avatarImgIcon.src = network_1.FileAccess.uriToBrowserUri(element.avatarIcon).toString(true);
                templateData.avatarContainer.replaceChildren(dom.$('.avatar', undefined, avatarImgIcon));
            }
            else {
                const defaultIcon = (0, chatViewModel_1.isRequestVM)(element) ? codicons_1.Codicon.account : codicons_1.Codicon.copilot;
                const icon = element.avatarIcon ?? defaultIcon;
                const avatarIcon = dom.$(themables_1.ThemeIcon.asCSSSelector(icon));
                templateData.avatarContainer.replaceChildren(dom.$('.avatar.codicon-avatar', undefined, avatarIcon));
            }
            if ((0, chatViewModel_1.isResponseVM)(element) && element.agent && !element.agent.isDefault) {
                dom.show(templateData.agentAvatarContainer);
                const icon = this.getAgentIcon(element.agent.metadata);
                if (icon instanceof uri_1.URI) {
                    const avatarIcon = dom.$('img.icon');
                    avatarIcon.src = network_1.FileAccess.uriToBrowserUri(icon).toString(true);
                    templateData.agentAvatarContainer.replaceChildren(dom.$('.avatar', undefined, avatarIcon));
                }
                else if (icon) {
                    const avatarIcon = dom.$(themables_1.ThemeIcon.asCSSSelector(icon));
                    templateData.agentAvatarContainer.replaceChildren(dom.$('.avatar.codicon-avatar', undefined, avatarIcon));
                }
                else {
                    dom.hide(templateData.agentAvatarContainer);
                    return;
                }
                templateData.agentAvatarContainer.classList.toggle('complete', element.isComplete);
                if (!element.agentAvatarHasBeenRendered && !element.isComplete) {
                    element.agentAvatarHasBeenRendered = true;
                    templateData.agentAvatarContainer.classList.remove('loading');
                    templateData.elementDisposables.add((0, async_1.disposableTimeout)(() => {
                        templateData.agentAvatarContainer.classList.toggle('loading', !element.isComplete);
                    }, 100));
                }
                else {
                    templateData.agentAvatarContainer.classList.toggle('loading', !element.isComplete);
                }
            }
            else {
                dom.hide(templateData.agentAvatarContainer);
            }
        }
        getAgentIcon(agent) {
            if (agent.themeIcon) {
                return agent.themeIcon;
            }
            else {
                return this.themeService.getColorTheme().type === theme_1.ColorScheme.DARK && agent.iconDark ? agent.iconDark :
                    agent.icon;
            }
        }
        basicRenderElement(value, element, index, templateData) {
            const fillInIncompleteTokens = (0, chatViewModel_1.isResponseVM)(element) && (!element.isComplete || element.isCanceled || element.errorDetails?.responseIsFiltered || element.errorDetails?.responseIsIncomplete);
            dom.clearNode(templateData.value);
            dom.clearNode(templateData.referencesListContainer);
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                this.renderDetail(element, templateData);
            }
            this.renderContentReferencesIfNeeded(element, templateData, templateData.elementDisposables);
            let fileTreeIndex = 0;
            value.forEach((data, index) => {
                const result = data.kind === 'treeData'
                    ? this.renderTreeData(data.treeData, element, templateData, fileTreeIndex++)
                    : data.kind === 'markdownContent'
                        ? this.renderMarkdown(data.content, element, templateData, fillInIncompleteTokens)
                        : data.kind === 'progressMessage' && onlyProgressMessagesAfterI(value, index) ? this.renderProgressMessage(data, false) // TODO render command
                            : data.kind === 'command' ? this.renderCommandButton(element, data)
                                : data.kind === 'textEditGroup' ? this.renderTextEdit(element, data, templateData)
                                    : undefined;
                if (result) {
                    templateData.value.appendChild(result.element);
                    templateData.elementDisposables.add(result);
                }
            });
            if ((0, chatViewModel_1.isResponseVM)(element) && element.errorDetails?.message) {
                const icon = element.errorDetails.responseIsFiltered ? codicons_1.Codicon.info : codicons_1.Codicon.error;
                const errorDetails = dom.append(templateData.value, $('.interactive-response-error-details', undefined, (0, iconLabels_1.renderIcon)(icon)));
                const renderedError = templateData.elementDisposables.add(this.renderer.render(new htmlContent_1.MarkdownString(element.errorDetails.message)));
                errorDetails.appendChild($('span', undefined, renderedError.element));
            }
            const newHeight = templateData.rowContainer.offsetHeight;
            const fireEvent = !element.currentRenderedHeight || element.currentRenderedHeight !== newHeight;
            element.currentRenderedHeight = newHeight;
            if (fireEvent) {
                const disposable = templateData.elementDisposables.add(dom.scheduleAtNextAnimationFrame(dom.getWindow(templateData.value), () => {
                    disposable.dispose();
                    this._onDidChangeItemHeight.fire({ element, height: newHeight });
                }));
            }
        }
        renderWelcomeMessage(element, templateData) {
            dom.clearNode(templateData.value);
            dom.clearNode(templateData.referencesListContainer);
            dom.hide(templateData.referencesListContainer);
            for (const item of element.content) {
                if (Array.isArray(item)) {
                    const scopedInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, templateData.contextKeyService]));
                    templateData.elementDisposables.add(scopedInstaService.createInstance(chatFollowups_1.ChatFollowups, templateData.value, item, this.location, undefined, followup => this._onDidClickFollowup.fire(followup)));
                }
                else {
                    const result = this.renderMarkdown(item, element, templateData);
                    templateData.value.appendChild(result.element);
                    templateData.elementDisposables.add(result);
                }
            }
            const newHeight = templateData.rowContainer.offsetHeight;
            const fireEvent = !element.currentRenderedHeight || element.currentRenderedHeight !== newHeight;
            element.currentRenderedHeight = newHeight;
            if (fireEvent) {
                const disposable = templateData.elementDisposables.add(dom.scheduleAtNextAnimationFrame(dom.getWindow(templateData.value), () => {
                    disposable.dispose();
                    this._onDidChangeItemHeight.fire({ element, height: newHeight });
                }));
            }
        }
        /**
         *	@returns true if progressive rendering should be considered complete- the element's data is fully rendered or the view is not visible
         */
        doNextProgressiveRender(element, index, templateData, isInRenderElement, disposables) {
            if (!this._isVisible) {
                return true;
            }
            const renderableResponse = (0, annotations_1.annotateSpecialMarkdownContent)(element.response.value);
            let isFullyRendered = false;
            if (element.isCanceled) {
                this.traceLayout('runProgressiveRender', `canceled, index=${index}`);
                element.renderData = undefined;
                this.basicRenderElement(renderableResponse, element, index, templateData);
                isFullyRendered = true;
            }
            else {
                // Figure out what we need to render in addition to what has already been rendered
                element.renderData ??= { renderedParts: [] };
                const renderedParts = element.renderData.renderedParts;
                const wordCountResults = [];
                const partsToRender = [];
                let somePartIsNotFullyRendered = false;
                renderableResponse.forEach((part, index) => {
                    const renderedPart = renderedParts[index];
                    // Is this part completely new?
                    if (!renderedPart) {
                        if (part.kind === 'treeData') {
                            partsToRender[index] = part.treeData;
                        }
                        else if (part.kind === 'progressMessage') {
                            partsToRender[index] = {
                                progressMessage: part,
                                isAtEndOfResponse: onlyProgressMessagesAfterI(renderableResponse, index),
                                isLast: index === renderableResponse.length - 1,
                            };
                        }
                        else if (part.kind === 'command') {
                            partsToRender[index] = part;
                        }
                        else if (part.kind === 'textEditGroup') {
                            partsToRender[index] = part;
                        }
                        else {
                            const wordCountResult = this.getDataForProgressiveRender(element, contentToMarkdown(part.content), { renderedWordCount: 0, lastRenderTime: 0 });
                            if (wordCountResult !== undefined) {
                                this.traceLayout('doNextProgressiveRender', `Rendering new part ${index}, wordCountResult=${wordCountResult.actualWordCount}, rate=${wordCountResult.rate}`);
                                partsToRender[index] = {
                                    renderedWordCount: wordCountResult.actualWordCount,
                                    lastRenderTime: Date.now(),
                                    isFullyRendered: wordCountResult.isFullString,
                                    originalMarkdown: part.content,
                                };
                                wordCountResults[index] = wordCountResult;
                            }
                        }
                    }
                    // Did this part's content change?
                    else if ((part.kind === 'markdownContent' || part.kind === 'progressMessage') && isMarkdownRenderData(renderedPart)) { // TODO
                        const wordCountResult = this.getDataForProgressiveRender(element, contentToMarkdown(part.content), renderedPart);
                        // Check if there are any new words to render
                        if (wordCountResult !== undefined && renderedPart.renderedWordCount !== wordCountResult?.actualWordCount) {
                            this.traceLayout('doNextProgressiveRender', `Rendering changed part ${index}, wordCountResult=${wordCountResult.actualWordCount}, rate=${wordCountResult.rate}`);
                            partsToRender[index] = {
                                renderedWordCount: wordCountResult.actualWordCount,
                                lastRenderTime: Date.now(),
                                isFullyRendered: wordCountResult.isFullString,
                                originalMarkdown: part.content,
                            };
                            wordCountResults[index] = wordCountResult;
                        }
                        else if (!renderedPart.isFullyRendered && !wordCountResult) {
                            // This part is not fully rendered, but not enough time has passed to render more content
                            somePartIsNotFullyRendered = true;
                        }
                    }
                    // Is it a progress message that needs to be rerendered?
                    else if (part.kind === 'progressMessage' && isProgressMessageRenderData(renderedPart) && ((renderedPart.isAtEndOfResponse !== onlyProgressMessagesAfterI(renderableResponse, index)) ||
                        renderedPart.isLast !== (index === renderableResponse.length - 1))) {
                        partsToRender[index] = {
                            progressMessage: part,
                            isAtEndOfResponse: onlyProgressMessagesAfterI(renderableResponse, index),
                            isLast: index === renderableResponse.length - 1,
                        };
                    }
                });
                isFullyRendered = partsToRender.length === 0 && !somePartIsNotFullyRendered;
                if (isFullyRendered && element.isComplete) {
                    // Response is done and content is rendered, so do a normal render
                    this.traceLayout('runProgressiveRender', `end progressive render, index=${index} and clearing renderData, response is complete, index=${index}`);
                    element.renderData = undefined;
                    disposables.clear();
                    this.basicRenderElement(renderableResponse, element, index, templateData);
                }
                else if (!isFullyRendered) {
                    disposables.clear();
                    this.renderContentReferencesIfNeeded(element, templateData, disposables);
                    let hasRenderedOneMarkdownBlock = false;
                    partsToRender.forEach((partToRender, index) => {
                        if (!partToRender) {
                            return;
                        }
                        // Undefined => don't do anything. null => remove the rendered element
                        let result;
                        if (isInteractiveProgressTreeData(partToRender)) {
                            result = this.renderTreeData(partToRender, element, templateData, index);
                        }
                        else if (isProgressMessageRenderData(partToRender)) {
                            if (onlyProgressMessageRenderDatasAfterI(partsToRender, index)) {
                                result = this.renderProgressMessage(partToRender.progressMessage, index === partsToRender.length - 1);
                            }
                            else {
                                result = null;
                            }
                        }
                        else if (isCommandButtonRenderData(partToRender)) {
                            result = this.renderCommandButton(element, partToRender);
                        }
                        else if (isTextEditRenderData(partToRender)) {
                            result = this.renderTextEdit(element, partToRender, templateData);
                        }
                        // Avoid doing progressive rendering for multiple markdown parts simultaneously
                        else if (!hasRenderedOneMarkdownBlock && wordCountResults[index]) {
                            const { value } = wordCountResults[index];
                            const part = partsToRender[index];
                            const originalMarkdown = 'originalMarkdown' in part ? part.originalMarkdown : undefined;
                            const markdownToRender = new htmlContent_1.MarkdownString(value, originalMarkdown);
                            result = this.renderMarkdown(markdownToRender, element, templateData, true);
                            hasRenderedOneMarkdownBlock = true;
                        }
                        if (result === undefined) {
                            return;
                        }
                        // Doing the progressive render
                        renderedParts[index] = partToRender;
                        const existingElement = templateData.value.children[index];
                        if (existingElement) {
                            if (result === null) {
                                templateData.value.replaceChild($('span.placeholder-for-deleted-thing'), existingElement);
                            }
                            else {
                                templateData.value.replaceChild(result.element, existingElement);
                            }
                        }
                        else if (result) {
                            templateData.value.appendChild(result.element);
                        }
                        if (result) {
                            disposables.add(result);
                        }
                    });
                }
                else {
                    // Nothing new to render, not done, keep waiting
                    return false;
                }
            }
            // Some render happened - update the height
            const height = templateData.rowContainer.offsetHeight;
            element.currentRenderedHeight = height;
            if (!isInRenderElement) {
                this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight });
            }
            return isFullyRendered;
        }
        renderTreeData(data, element, templateData, treeDataIndex) {
            const treeDisposables = new lifecycle_1.DisposableStore();
            const ref = treeDisposables.add(this._treePool.get());
            const tree = ref.object;
            treeDisposables.add(tree.onDidOpen((e) => {
                if (e.element && !('children' in e.element)) {
                    this.openerService.open(e.element.uri);
                }
            }));
            treeDisposables.add(tree.onDidChangeCollapseState(() => {
                this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight });
            }));
            treeDisposables.add(tree.onContextMenu((e) => {
                e.browserEvent.preventDefault();
                e.browserEvent.stopPropagation();
            }));
            tree.setInput(data).then(() => {
                if (!ref.isStale()) {
                    tree.layout();
                    this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight });
                }
            });
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                const fileTreeFocusInfo = {
                    treeDataId: data.uri.toString(),
                    treeIndex: treeDataIndex,
                    focus() {
                        tree.domFocus();
                    }
                };
                treeDisposables.add(tree.onDidFocus(() => {
                    this.focusedFileTreesByResponseId.set(element.id, fileTreeFocusInfo.treeIndex);
                }));
                const fileTrees = this.fileTreesByResponseId.get(element.id) ?? [];
                fileTrees.push(fileTreeFocusInfo);
                this.fileTreesByResponseId.set(element.id, (0, arrays_1.distinct)(fileTrees, (v) => v.treeDataId));
                treeDisposables.add((0, lifecycle_1.toDisposable)(() => this.fileTreesByResponseId.set(element.id, fileTrees.filter(v => v.treeDataId !== data.uri.toString()))));
            }
            return {
                element: tree.getHTMLElement().parentElement,
                dispose: () => {
                    treeDisposables.dispose();
                }
            };
        }
        renderContentReferencesIfNeeded(element, templateData, disposables) {
            dom.clearNode(templateData.referencesListContainer);
            if ((0, chatViewModel_1.isResponseVM)(element) && this._usedReferencesEnabled && element.contentReferences.length) {
                dom.show(templateData.referencesListContainer);
                const contentReferencesListResult = this.renderContentReferencesListData(element.contentReferences, element, templateData);
                templateData.referencesListContainer.appendChild(contentReferencesListResult.element);
                disposables.add(contentReferencesListResult);
            }
            else {
                dom.hide(templateData.referencesListContainer);
            }
        }
        renderContentReferencesListData(data, element, templateData) {
            const listDisposables = new lifecycle_1.DisposableStore();
            const referencesLabel = data.length > 1 ?
                (0, nls_1.localize)('usedReferencesPlural', "Used {0} references", data.length) :
                (0, nls_1.localize)('usedReferencesSingular', "Used {0} reference", 1);
            const iconElement = $('.chat-used-context-icon');
            const icon = (element) => element.usedReferencesExpanded ? codicons_1.Codicon.chevronDown : codicons_1.Codicon.chevronRight;
            iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(icon(element)));
            const buttonElement = $('.chat-used-context-label', undefined);
            const collapseButton = listDisposables.add(new button_1.Button(buttonElement, {
                buttonBackground: undefined,
                buttonBorder: undefined,
                buttonForeground: undefined,
                buttonHoverBackground: undefined,
                buttonSecondaryBackground: undefined,
                buttonSecondaryForeground: undefined,
                buttonSecondaryHoverBackground: undefined,
                buttonSeparator: undefined
            }));
            const container = $('.chat-used-context', undefined, buttonElement);
            collapseButton.label = referencesLabel;
            collapseButton.element.append(iconElement);
            this.updateAriaLabel(collapseButton.element, referencesLabel, element.usedReferencesExpanded);
            container.classList.toggle('chat-used-context-collapsed', !element.usedReferencesExpanded);
            listDisposables.add(collapseButton.onDidClick(() => {
                iconElement.classList.remove(...themables_1.ThemeIcon.asClassNameArray(icon(element)));
                element.usedReferencesExpanded = !element.usedReferencesExpanded;
                iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(icon(element)));
                container.classList.toggle('chat-used-context-collapsed', !element.usedReferencesExpanded);
                this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight });
                this.updateAriaLabel(collapseButton.element, referencesLabel, element.usedReferencesExpanded);
            }));
            const ref = listDisposables.add(this._contentReferencesListPool.get());
            const list = ref.object;
            container.appendChild(list.getHTMLElement().parentElement);
            listDisposables.add(list.onDidOpen((e) => {
                if (e.element) {
                    const uriOrLocation = 'variableName' in e.element.reference ? e.element.reference.value : e.element.reference;
                    const uri = uri_1.URI.isUri(uriOrLocation) ? uriOrLocation :
                        uriOrLocation?.uri;
                    if (uri) {
                        this.openerService.open(uri, {
                            fromUserGesture: true,
                            editorOptions: {
                                ...e.editorOptions,
                                ...{
                                    selection: uriOrLocation && 'range' in uriOrLocation ? uriOrLocation.range : undefined
                                }
                            }
                        });
                    }
                }
            }));
            listDisposables.add(list.onContextMenu((e) => {
                e.browserEvent.preventDefault();
                e.browserEvent.stopPropagation();
            }));
            const maxItemsShown = 6;
            const itemsShown = Math.min(data.length, maxItemsShown);
            const height = itemsShown * 22;
            list.layout(height);
            list.getHTMLElement().style.height = `${height}px`;
            list.splice(0, list.length, data);
            return {
                element: container,
                dispose: () => {
                    listDisposables.dispose();
                }
            };
        }
        updateAriaLabel(element, label, expanded) {
            element.ariaLabel = expanded ? (0, nls_1.localize)('usedReferencesExpanded', "{0}, expanded", label) : (0, nls_1.localize)('usedReferencesCollapsed', "{0}, collapsed", label);
        }
        renderProgressMessage(progress, showSpinner) {
            if (showSpinner) {
                // this step is in progress, communicate it to SR users
                (0, aria_1.alert)(progress.content.value);
            }
            const codicon = showSpinner ? themables_1.ThemeIcon.modify(codicons_1.Codicon.sync, 'spin').id : codicons_1.Codicon.check.id;
            const markdown = new htmlContent_1.MarkdownString(`$(${codicon}) ${progress.content.value}`, {
                supportThemeIcons: true
            });
            const result = this.renderer.render(markdown);
            result.element.classList.add('progress-step');
            return result;
        }
        renderCommandButton(element, commandButton) {
            const container = $('.chat-command-button');
            const disposables = new lifecycle_1.DisposableStore();
            const enabled = !(0, chatViewModel_1.isResponseVM)(element) || !element.isStale;
            const tooltip = enabled ?
                commandButton.command.tooltip :
                (0, nls_1.localize)('commandButtonDisabled', "Button not available in restored chat");
            const button = disposables.add(new button_1.Button(container, { ...defaultStyles_1.defaultButtonStyles, supportIcons: true, title: tooltip }));
            button.label = commandButton.command.title;
            button.enabled = enabled;
            // TODO still need telemetry for command buttons
            disposables.add(button.onDidClick(() => this.commandService.executeCommand(commandButton.command.id, ...(commandButton.command.arguments ?? []))));
            return {
                dispose() {
                    disposables.dispose();
                },
                element: container
            };
        }
        renderTextEdit(element, chatTextEdit, templateData) {
            // TODO@jrieken move this into the CompareCodeBlock and properly say what kind of changes happen
            if (this.rendererOptions.renderTextEditsAsSummary?.(chatTextEdit.uri)) {
                if ((0, chatViewModel_1.isResponseVM)(element) && element.response.value.every(item => item.kind === 'textEditGroup')) {
                    return {
                        element: $('.interactive-edits-summary', undefined, !element.isComplete ? (0, nls_1.localize)('editsSummary1', "Making changes...") : (0, nls_1.localize)('editsSummary', "Made changes.")),
                        dispose() { }
                    };
                }
                return undefined;
            }
            const store = new lifecycle_1.DisposableStore();
            const cts = new cancellation_1.CancellationTokenSource();
            let isDisposed = false;
            store.add((0, lifecycle_1.toDisposable)(() => {
                isDisposed = true;
                cts.dispose(true);
            }));
            const ref = this._diffEditorPool.get();
            // Attach this after updating text/layout of the editor, so it should only be fired when the size updates later (horizontal scrollbar, wrapping)
            // not during a renderElement OR a progressive render (when we will be firing this event anyway at the end of the render)
            store.add(ref.object.onDidChangeContentHeight(() => {
                ref.object.layout(this._currentLayoutWidth);
                this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight });
            }));
            const data = {
                element,
                edit: chatTextEdit,
                diffData: (async () => {
                    const ref = await this.textModelService.createModelReference(chatTextEdit.uri);
                    if (isDisposed) {
                        ref.dispose();
                        return;
                    }
                    store.add(ref);
                    const original = ref.object.textEditorModel;
                    let originalSha1 = '';
                    if (chatTextEdit.state) {
                        originalSha1 = chatTextEdit.state.sha1;
                    }
                    else {
                        const sha1 = new modelService_1.DefaultModelSHA1Computer();
                        if (sha1.canComputeSHA1(original)) {
                            originalSha1 = sha1.computeSHA1(original);
                            chatTextEdit.state = { sha1: originalSha1, applied: 0 };
                        }
                    }
                    const modified = this.modelService.createModel((0, textModel_1.createTextBufferFactoryFromSnapshot)(original.createSnapshot()), { languageId: original.getLanguageId(), onDidChange: event_1.Event.None }, uri_1.URI.from({ scheme: network_1.Schemas.vscodeChatCodeBlock, path: original.uri.path, query: (0, uuid_1.generateUuid)() }), false);
                    store.add(modified);
                    if (!chatTextEdit.state?.applied) {
                        for (const group of chatTextEdit.edits) {
                            const edits = group.map(languages_1.TextEdit.asEditOperation);
                            modified.pushEditOperations(null, edits, () => null);
                        }
                    }
                    return {
                        modified,
                        original,
                        originalSha1
                    };
                })()
            };
            ref.object.render(data, this._currentLayoutWidth, cts.token);
            return {
                element: ref.object.element,
                dispose() {
                    store.dispose();
                },
            };
        }
        renderMarkdown(markdown, element, templateData, fillInIncompleteTokens = false) {
            const disposables = new lifecycle_1.DisposableStore();
            // We release editors in order so that it's more likely that the same editor will be assigned if this element is re-rendered right away, like it often is during progressive rendering
            const orderedDisposablesList = [];
            const codeblocks = [];
            let codeBlockIndex = 0;
            const result = this.renderer.render(markdown, {
                disallowRemoteImages: true,
                fillInIncompleteTokens,
                codeBlockRendererSync: (languageId, text) => {
                    const index = codeBlockIndex++;
                    let textModel;
                    let range;
                    let vulns;
                    if ((0, strings_1.equalsIgnoreCase)(languageId, codeBlockPart_1.localFileLanguageId)) {
                        try {
                            const parsedBody = (0, codeBlockPart_1.parseLocalFileData)(text);
                            range = parsedBody.range && range_1.Range.lift(parsedBody.range);
                            textModel = this.textModelService.createModelReference(parsedBody.uri).then(ref => ref.object);
                        }
                        catch (e) {
                            return $('div');
                        }
                    }
                    else {
                        if (!(0, chatViewModel_1.isRequestVM)(element) && !(0, chatViewModel_1.isResponseVM)(element)) {
                            console.error('Trying to render code block in welcome', element.id, index);
                            return $('div');
                        }
                        const sessionId = (0, chatViewModel_1.isResponseVM)(element) || (0, chatViewModel_1.isRequestVM)(element) ? element.sessionId : '';
                        const modelEntry = this.codeBlockModelCollection.getOrCreate(sessionId, element, index);
                        vulns = modelEntry.vulns;
                        textModel = modelEntry.model;
                    }
                    const hideToolbar = (0, chatViewModel_1.isResponseVM)(element) && element.errorDetails?.responseIsFiltered;
                    const ref = this.renderCodeBlock({ languageId, textModel, codeBlockIndex: index, element, range, hideToolbar, parentContextKeyService: templateData.contextKeyService, vulns }, text);
                    // Attach this after updating text/layout of the editor, so it should only be fired when the size updates later (horizontal scrollbar, wrapping)
                    // not during a renderElement OR a progressive render (when we will be firing this event anyway at the end of the render)
                    disposables.add(ref.object.onDidChangeContentHeight(() => {
                        ref.object.layout(this._currentLayoutWidth);
                        this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight });
                    }));
                    if ((0, chatViewModel_1.isResponseVM)(element)) {
                        const info = {
                            codeBlockIndex: index,
                            element,
                            focus() {
                                ref.object.focus();
                            }
                        };
                        codeblocks.push(info);
                        if (ref.object.uri) {
                            const uri = ref.object.uri;
                            this.codeBlocksByEditorUri.set(uri, info);
                            disposables.add((0, lifecycle_1.toDisposable)(() => this.codeBlocksByEditorUri.delete(uri)));
                        }
                    }
                    orderedDisposablesList.push(ref);
                    return ref.object.element;
                },
                asyncRenderCallback: () => this._onDidChangeItemHeight.fire({ element, height: templateData.rowContainer.offsetHeight }),
            });
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                this.codeBlocksByResponseId.set(element.id, codeblocks);
                disposables.add((0, lifecycle_1.toDisposable)(() => this.codeBlocksByResponseId.delete(element.id)));
            }
            disposables.add(this.markdownDecorationsRenderer.walkTreeAndAnnotateReferenceLinks(result.element));
            orderedDisposablesList.reverse().forEach(d => disposables.add(d));
            return {
                element: result.element,
                dispose() {
                    result.dispose();
                    disposables.dispose();
                }
            };
        }
        renderCodeBlock(data, text) {
            const ref = this._editorPool.get();
            const editorInfo = ref.object;
            if ((0, chatViewModel_1.isResponseVM)(data.element)) {
                this.codeBlockModelCollection.update(data.element.sessionId, data.element, data.codeBlockIndex, { text, languageId: data.languageId });
            }
            editorInfo.render(data, this._currentLayoutWidth, this.rendererOptions.editableCodeBlock);
            return ref;
        }
        getDataForProgressiveRender(element, data, renderData) {
            const rate = this.getProgressiveRenderRate(element);
            const numWordsToRender = renderData.lastRenderTime === 0 ?
                1 :
                renderData.renderedWordCount +
                    // Additional words to render beyond what's already rendered
                    Math.floor((Date.now() - renderData.lastRenderTime) / 1000 * rate);
            if (numWordsToRender === renderData.renderedWordCount) {
                return undefined;
            }
            return {
                ...(0, chatWordCounter_1.getNWords)(data.value, numWordsToRender),
                rate
            };
        }
        disposeElement(node, index, templateData) {
            templateData.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.dispose();
        }
    };
    exports.ChatListItemRenderer = ChatListItemRenderer;
    exports.ChatListItemRenderer = ChatListItemRenderer = ChatListItemRenderer_1 = __decorate([
        __param(6, instantiation_1.IInstantiationService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, log_1.ILogService),
        __param(9, opener_1.IOpenerService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, themeService_1.IThemeService),
        __param(12, commands_1.ICommandService),
        __param(13, resolverService_1.ITextModelService),
        __param(14, model_1.IModelService),
        __param(15, hover_1.IHoverService),
        __param(16, chatAgents_1.IChatAgentNameService)
    ], ChatListItemRenderer);
    let ChatListDelegate = class ChatListDelegate {
        constructor(defaultElementHeight, logService) {
            this.defaultElementHeight = defaultElementHeight;
            this.logService = logService;
        }
        _traceLayout(method, message) {
            if (forceVerboseLayoutTracing) {
                this.logService.info(`ChatListDelegate#${method}: ${message}`);
            }
            else {
                this.logService.trace(`ChatListDelegate#${method}: ${message}`);
            }
        }
        getHeight(element) {
            const kind = (0, chatViewModel_1.isRequestVM)(element) ? 'request' : 'response';
            const height = ('currentRenderedHeight' in element ? element.currentRenderedHeight : undefined) ?? this.defaultElementHeight;
            this._traceLayout('getHeight', `${kind}, height=${height}`);
            return height;
        }
        getTemplateId(element) {
            return ChatListItemRenderer.ID;
        }
        hasDynamicHeight(element) {
            return true;
        }
    };
    exports.ChatListDelegate = ChatListDelegate;
    exports.ChatListDelegate = ChatListDelegate = __decorate([
        __param(1, log_1.ILogService)
    ], ChatListDelegate);
    let EditorPool = class EditorPool extends lifecycle_1.Disposable {
        inUse() {
            return this._pool.inUse;
        }
        constructor(options, delegate, overflowWidgetsDomNode, instantiationService) {
            super();
            this._pool = this._register(new ResourcePool(() => {
                return instantiationService.createInstance(codeBlockPart_1.CodeBlockPart, options, actions_1.MenuId.ChatCodeBlock, delegate, overflowWidgetsDomNode);
            }));
        }
        get() {
            const codeBlock = this._pool.get();
            let stale = false;
            return {
                object: codeBlock,
                isStale: () => stale,
                dispose: () => {
                    codeBlock.reset();
                    stale = true;
                    this._pool.release(codeBlock);
                }
            };
        }
    };
    EditorPool = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], EditorPool);
    let DiffEditorPool = class DiffEditorPool extends lifecycle_1.Disposable {
        inUse() {
            return this._pool.inUse;
        }
        constructor(options, delegate, overflowWidgetsDomNode, instantiationService) {
            super();
            this._pool = this._register(new ResourcePool(() => {
                return instantiationService.createInstance(codeBlockPart_1.CodeCompareBlockPart, options, actions_1.MenuId.ChatCompareBlock, delegate, overflowWidgetsDomNode);
            }));
        }
        get() {
            const codeBlock = this._pool.get();
            let stale = false;
            return {
                object: codeBlock,
                isStale: () => stale,
                dispose: () => {
                    codeBlock.reset();
                    stale = true;
                    this._pool.release(codeBlock);
                }
            };
        }
    };
    DiffEditorPool = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], DiffEditorPool);
    let TreePool = class TreePool extends lifecycle_1.Disposable {
        get inUse() {
            return this._pool.inUse;
        }
        constructor(_onDidChangeVisibility, instantiationService, configService, themeService) {
            super();
            this._onDidChangeVisibility = _onDidChangeVisibility;
            this.instantiationService = instantiationService;
            this.configService = configService;
            this.themeService = themeService;
            this._pool = this._register(new ResourcePool(() => this.treeFactory()));
        }
        treeFactory() {
            const resourceLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this._onDidChangeVisibility }));
            const container = $('.interactive-response-progress-tree');
            this._register((0, explorerView_1.createFileIconThemableTreeContainerScope)(container, this.themeService));
            const tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleAsyncDataTree, 'ChatListRenderer', container, new ChatListTreeDelegate(), new ChatListTreeCompressionDelegate(), [new ChatListTreeRenderer(resourceLabels, this.configService.getValue('explorer.decorations'))], new ChatListTreeDataSource(), {
                collapseByDefault: () => false,
                expandOnlyOnTwistieClick: () => false,
                identityProvider: {
                    getId: (e) => e.uri.toString()
                },
                accessibilityProvider: {
                    getAriaLabel: (element) => element.label,
                    getWidgetAriaLabel: () => (0, nls_1.localize)('treeAriaLabel', "File Tree")
                },
                alwaysConsumeMouseWheel: false
            });
            return tree;
        }
        get() {
            const object = this._pool.get();
            let stale = false;
            return {
                object,
                isStale: () => stale,
                dispose: () => {
                    stale = true;
                    this._pool.release(object);
                }
            };
        }
    };
    TreePool = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, themeService_1.IThemeService)
    ], TreePool);
    let ContentReferencesListPool = class ContentReferencesListPool extends lifecycle_1.Disposable {
        get inUse() {
            return this._pool.inUse;
        }
        constructor(_onDidChangeVisibility, instantiationService, themeService) {
            super();
            this._onDidChangeVisibility = _onDidChangeVisibility;
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            this._pool = this._register(new ResourcePool(() => this.listFactory()));
        }
        listFactory() {
            const resourceLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this._onDidChangeVisibility }));
            const container = $('.chat-used-context-list');
            this._register((0, explorerView_1.createFileIconThemableTreeContainerScope)(container, this.themeService));
            const list = this.instantiationService.createInstance(listService_1.WorkbenchList, 'ChatListRenderer', container, new ContentReferencesListDelegate(), [this.instantiationService.createInstance(ContentReferencesListRenderer, resourceLabels)], {
                alwaysConsumeMouseWheel: false,
                accessibilityProvider: {
                    getAriaLabel: (element) => {
                        const reference = element.reference;
                        if ('variableName' in reference) {
                            return reference.variableName;
                        }
                        else if (uri_1.URI.isUri(reference)) {
                            return (0, path_1.basename)(reference.path);
                        }
                        else {
                            return (0, path_1.basename)(reference.uri.path);
                        }
                    },
                    getWidgetAriaLabel: () => (0, nls_1.localize)('usedReferences', "Used References")
                },
                dnd: {
                    getDragURI: ({ reference }) => {
                        if ('variableName' in reference) {
                            return null;
                        }
                        else if (uri_1.URI.isUri(reference)) {
                            return reference.toString();
                        }
                        else {
                            return reference.uri.toString();
                        }
                    },
                    dispose: () => { },
                    onDragOver: () => false,
                    drop: () => { },
                },
            });
            return list;
        }
        get() {
            const object = this._pool.get();
            let stale = false;
            return {
                object,
                isStale: () => stale,
                dispose: () => {
                    stale = true;
                    this._pool.release(object);
                }
            };
        }
    };
    ContentReferencesListPool = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService)
    ], ContentReferencesListPool);
    class ContentReferencesListDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return ContentReferencesListRenderer.TEMPLATE_ID;
        }
    }
    let ContentReferencesListRenderer = class ContentReferencesListRenderer {
        static { ContentReferencesListRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'contentReferencesListRenderer'; }
        constructor(labels, chatVariablesService) {
            this.labels = labels;
            this.chatVariablesService = chatVariablesService;
            this.templateId = ContentReferencesListRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const templateDisposables = new lifecycle_1.DisposableStore();
            const label = templateDisposables.add(this.labels.create(container, { supportHighlights: true }));
            return { templateDisposables, label };
        }
        renderElement(data, index, templateData, height) {
            const reference = data.reference;
            const icon = data.iconPath;
            templateData.label.element.style.display = 'flex';
            if ('variableName' in reference) {
                if (reference.value) {
                    const uri = uri_1.URI.isUri(reference.value) ? reference.value : reference.value.uri;
                    templateData.label.setResource({
                        resource: uri,
                        name: (0, resources_1.basenameOrAuthority)(uri),
                        description: `#${reference.variableName}`,
                        range: 'range' in reference.value ? reference.value.range : undefined,
                    }, { icon });
                }
                else {
                    const variable = this.chatVariablesService.getVariable(reference.variableName);
                    templateData.label.setLabel(`#${reference.variableName}`, undefined, { title: variable?.description });
                }
            }
            else {
                const uri = 'uri' in reference ? reference.uri : reference;
                if ((0, network_1.matchesSomeScheme)(uri, network_1.Schemas.mailto, network_1.Schemas.http, network_1.Schemas.https)) {
                    templateData.label.setResource({ resource: uri, name: uri.toString() }, { icon: icon ?? codicons_1.Codicon.globe });
                }
                else {
                    templateData.label.setFile(uri, {
                        fileKind: files_1.FileKind.FILE,
                        // Should not have this live-updating data on a historical reference
                        fileDecorations: { badges: false, colors: false },
                        range: 'range' in reference ? reference.range : undefined
                    });
                }
            }
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.dispose();
        }
    };
    ContentReferencesListRenderer = ContentReferencesListRenderer_1 = __decorate([
        __param(1, chatVariables_1.IChatVariablesService)
    ], ContentReferencesListRenderer);
    class ResourcePool extends lifecycle_1.Disposable {
        get inUse() {
            return this._inUse;
        }
        constructor(_itemFactory) {
            super();
            this._itemFactory = _itemFactory;
            this.pool = [];
            this._inUse = new Set;
        }
        get() {
            if (this.pool.length > 0) {
                const item = this.pool.pop();
                this._inUse.add(item);
                return item;
            }
            const item = this._register(this._itemFactory());
            this._inUse.add(item);
            return item;
        }
        release(item) {
            this._inUse.delete(item);
            this.pool.push(item);
        }
    }
    class ChatVoteButton extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        render(container) {
            super.render(container);
            container.classList.toggle('checked', this.action.checked);
        }
    }
    class ChatListTreeDelegate {
        static { this.ITEM_HEIGHT = 22; }
        getHeight(element) {
            return ChatListTreeDelegate.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            return 'chatListTreeTemplate';
        }
    }
    class ChatListTreeCompressionDelegate {
        isIncompressible(element) {
            return !element.children;
        }
    }
    class ChatListTreeRenderer {
        constructor(labels, decorations) {
            this.labels = labels;
            this.decorations = decorations;
            this.templateId = 'chatListTreeTemplate';
        }
        renderCompressedElements(element, index, templateData, height) {
            templateData.label.element.style.display = 'flex';
            const label = element.element.elements.map((e) => e.label);
            templateData.label.setResource({ resource: element.element.elements[0].uri, name: label }, {
                title: element.element.elements[0].label,
                fileKind: element.children ? files_1.FileKind.FOLDER : files_1.FileKind.FILE,
                extraClasses: ['explorer-item'],
                fileDecorations: this.decorations
            });
        }
        renderTemplate(container) {
            const templateDisposables = new lifecycle_1.DisposableStore();
            const label = templateDisposables.add(this.labels.create(container, { supportHighlights: true }));
            return { templateDisposables, label };
        }
        renderElement(element, index, templateData, height) {
            templateData.label.element.style.display = 'flex';
            if (!element.children.length && element.element.type !== files_1.FileType.Directory) {
                templateData.label.setFile(element.element.uri, {
                    fileKind: files_1.FileKind.FILE,
                    hidePath: true,
                    fileDecorations: this.decorations,
                });
            }
            else {
                templateData.label.setResource({ resource: element.element.uri, name: element.element.label }, {
                    title: element.element.label,
                    fileKind: files_1.FileKind.FOLDER,
                    fileDecorations: this.decorations
                });
            }
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.dispose();
        }
    }
    class ChatListTreeDataSource {
        hasChildren(element) {
            return !!element.children;
        }
        async getChildren(element) {
            return element.children ?? [];
        }
    }
    function isInteractiveProgressTreeData(item) {
        return 'label' in item;
    }
    function contentToMarkdown(str) {
        return typeof str === 'string' ? { value: str } : str;
    }
    function isProgressMessage(item) {
        return item && 'kind' in item && item.kind === 'progressMessage';
    }
    function isProgressMessageRenderData(item) {
        return item && 'isAtEndOfResponse' in item;
    }
    function isCommandButtonRenderData(item) {
        return item && 'kind' in item && item.kind === 'command';
    }
    function isTextEditRenderData(item) {
        return item && 'kind' in item && item.kind === 'textEditGroup';
    }
    function isMarkdownRenderData(item) {
        return item && 'renderedWordCount' in item;
    }
    function onlyProgressMessagesAfterI(items, i) {
        return items.slice(i).every(isProgressMessage);
    }
    function onlyProgressMessageRenderDatasAfterI(items, i) {
        return items.slice(i).every(isProgressMessageRenderData);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdExpc3RSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0TGlzdFJlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE4RWhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUF1QmhCLE1BQU0seUJBQXlCLEdBQUcsS0FBSyxDQUFDO0lBUWpDLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7O2lCQUNuQyxPQUFFLEdBQUcsTUFBTSxBQUFULENBQVU7UUE0QjVCLFlBQ0MsYUFBZ0MsRUFDZixRQUEyQixFQUMzQixlQUE2QyxFQUM3QyxRQUErQixFQUMvQix3QkFBa0QsRUFDbkUsc0JBQStDLEVBQ3hCLG9CQUE0RCxFQUM1RCxhQUFvQyxFQUM5QyxVQUF3QyxFQUNyQyxhQUE4QyxFQUMxQyxpQkFBc0QsRUFDM0QsWUFBNEMsRUFDMUMsY0FBZ0QsRUFDOUMsZ0JBQW9ELEVBQ3hELFlBQTRDLEVBQzVDLFlBQTRDLEVBQ3BDLG9CQUE0RDtZQUVuRixLQUFLLEVBQUUsQ0FBQztZQWpCUyxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixvQkFBZSxHQUFmLGVBQWUsQ0FBOEI7WUFDN0MsYUFBUSxHQUFSLFFBQVEsQ0FBdUI7WUFDL0IsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUUzQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBRXJELGVBQVUsR0FBVixVQUFVLENBQWE7WUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3pCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDMUMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDekIsbUJBQWMs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