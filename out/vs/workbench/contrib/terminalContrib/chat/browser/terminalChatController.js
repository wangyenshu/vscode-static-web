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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChatWidget", "vs/base/common/htmlContent", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChat", "vs/workbench/services/views/common/viewsService"], function (require, exports, cancellation_1, event_1, lazy_1, lifecycle_1, contextkey_1, instantiation_1, chat_1, chatAgents_1, chatService_1, terminal_1, terminalChatWidget_1, htmlContent_1, chatModel_1, terminalChat_1, viewsService_1) {
    "use strict";
    var TerminalChatController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalChatController = void 0;
    var Message;
    (function (Message) {
        Message[Message["NONE"] = 0] = "NONE";
        Message[Message["ACCEPT_SESSION"] = 1] = "ACCEPT_SESSION";
        Message[Message["CANCEL_SESSION"] = 2] = "CANCEL_SESSION";
        Message[Message["PAUSE_SESSION"] = 4] = "PAUSE_SESSION";
        Message[Message["CANCEL_REQUEST"] = 8] = "CANCEL_REQUEST";
        Message[Message["CANCEL_INPUT"] = 16] = "CANCEL_INPUT";
        Message[Message["ACCEPT_INPUT"] = 32] = "ACCEPT_INPUT";
        Message[Message["RERUN_INPUT"] = 64] = "RERUN_INPUT";
    })(Message || (Message = {}));
    let TerminalChatController = class TerminalChatController extends lifecycle_1.Disposable {
        static { TerminalChatController_1 = this; }
        static { this.ID = 'terminal.chat'; }
        static get(instance) {
            return instance.getContribution(TerminalChatController_1.ID);
        }
        /**
         * The chat widget for the controller, this will be undefined if xterm is not ready yet (ie. the
         * terminal is still initializing).
         */
        get chatWidget() { return this._chatWidget?.value; }
        get lastResponseContent() {
            return this._lastResponseContent;
        }
        constructor(_instance, processManager, widgetManager, _terminalService, _instantiationService, _chatAgentService, _contextKeyService, _chatAccessibilityService, _chatService, _chatCodeBlockContextProviderService, _viewsService) {
            super();
            this._instance = _instance;
            this._terminalService = _terminalService;
            this._instantiationService = _instantiationService;
            this._chatAgentService = _chatAgentService;
            this._contextKeyService = _contextKeyService;
            this._chatAccessibilityService = _chatAccessibilityService;
            this._chatService = _chatService;
            this._chatCodeBlockContextProviderService = _chatCodeBlockContextProviderService;
            this._viewsService = _viewsService;
            this._messages = this._store.add(new event_1.Emitter());
            this.onDidAcceptInput = event_1.Event.filter(this._messages.event, m => m === 32 /* Message.ACCEPT_INPUT */, this._store);
            this.onDidCancelInput = event_1.Event.filter(this._messages.event, m => m === 16 /* Message.CANCEL_INPUT */ || m === 2 /* Message.CANCEL_SESSION */, this._store);
            this._terminalAgentName = 'terminal';
            this._model = this._register(new lifecycle_1.MutableDisposable());
            this._forcedPlaceholder = undefined;
            this._requestActiveContextKey = terminalChat_1.TerminalChatContextKeys.requestActive.bindTo(this._contextKeyService);
            this._terminalAgentRegisteredContextKey = terminalChat_1.TerminalChatContextKeys.agentRegistered.bindTo(this._contextKeyService);
            this._responseContainsCodeBlockContextKey = terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock.bindTo(this._contextKeyService);
            this._responseContainsMulitpleCodeBlocksContextKey = terminalChat_1.TerminalChatContextKeys.responseContainsMultipleCodeBlocks.bindTo(this._contextKeyService);
            this._responseSupportsIssueReportingContextKey = terminalChat_1.TerminalChatContextKeys.responseSupportsIssueReporting.bindTo(this._contextKeyService);
            this._sessionResponseVoteContextKey = terminalChat_1.TerminalChatContextKeys.sessionResponseVote.bindTo(this._contextKeyService);
            if (!this.initTerminalAgent()) {
                this._register(this._chatAgentService.onDidChangeAgents(() => this.initTerminalAgent()));
            }
            this._register(this._chatCodeBlockContextProviderService.registerProvider({
                getCodeBlockContext: (editor) => {
                    if (!editor || !this._chatWidget?.hasValue || !this.hasFocus()) {
                        return;
                    }
                    return {
                        element: editor,
                        code: editor.getValue(),
                        codeBlockIndex: 0,
                        languageId: editor.getModel().getLanguageId()
                    };
                }
            }, 'terminal'));
            // TODO
            // This is glue/debt that's needed while ChatModel isn't yet adopted. The chat model uses
            // a default chat model (unless configured) and feedback is reported against that one. This
            // code forwards the feedback to an actual registered provider
            this._register(this._chatService.onDidPerformUserAction(e => {
                // only forward feedback from the inline chat widget default model
                if (this._chatWidget?.rawValue?.inlineChatWidget.usesDefaultChatModel
                    && e.sessionId === this._chatWidget?.rawValue?.inlineChatWidget.getChatModel().sessionId) {
                    if (e.action.kind === 'bug') {
                        this.acceptFeedback(undefined);
                    }
                    else if (e.action.kind === 'vote') {
                        this.acceptFeedback(e.action.direction === chatService_1.InteractiveSessionVoteDirection.Up);
                    }
                }
            }));
        }
        initTerminalAgent() {
            const terminalAgent = this._chatAgentService.getAgentsByName(this._terminalAgentName)[0];
            if (terminalAgent) {
                this._terminalAgentId = terminalAgent.id;
                this._terminalAgentRegisteredContextKey.set(true);
                return true;
            }
            return false;
        }
        xtermReady(xterm) {
            this._chatWidget = new lazy_1.Lazy(() => {
                const chatWidget = this._register(this._instantiationService.createInstance(terminalChatWidget_1.TerminalChatWidget, this._instance.domElement, this._instance, xterm));
                this._register(chatWidget.focusTracker.onDidFocus(() => {
                    TerminalChatController_1.activeChatWidget = this;
                    if (!(0, terminal_1.isDetachedTerminalInstance)(this._instance)) {
                        this._terminalService.setActiveInstance(this._instance);
                    }
                }));
                this._register(chatWidget.focusTracker.onDidBlur(() => {
                    TerminalChatController_1.activeChatWidget = undefined;
                    this._instance.resetScrollbarVisibility();
                }));
                if (!this._instance.domElement) {
                    throw new Error('FindWidget expected terminal DOM to be initialized');
                }
                return chatWidget;
            });
        }
        acceptFeedback(helpful) {
            const model = this._model.value;
            if (!this._currentRequest || !model) {
                return;
            }
            let action;
            if (helpful === undefined) {
                action = { kind: 'bug' };
            }
            else {
                this._sessionResponseVoteContextKey.set(helpful ? 'up' : 'down');
                action = { kind: 'vote', direction: helpful ? chatService_1.InteractiveSessionVoteDirection.Up : chatService_1.InteractiveSessionVoteDirection.Down };
            }
            // TODO:extract into helper method
            for (const request of model.getRequests()) {
                if (request.response?.response.value || request.response?.result) {
                    this._chatService.notifyUserAction({
                        sessionId: request.session.sessionId,
                        requestId: request.id,
                        agentId: request.response?.agent?.id,
                        result: request.response?.result,
                        action
                    });
                }
            }
            this._chatWidget?.value.inlineChatWidget.updateStatus('Thank you for your feedback!', { resetAfter: 1250 });
        }
        cancel() {
            if (this._currentRequest) {
                this._model.value?.cancelRequest(this._currentRequest);
            }
            this._requestActiveContextKey.set(false);
            this._chatWidget?.value.inlineChatWidget.updateProgress(false);
            this._chatWidget?.value.inlineChatWidget.updateInfo('');
            this._chatWidget?.value.inlineChatWidget.updateToolbar(true);
        }
        _updatePlaceholder() {
            const inlineChatWidget = this._chatWidget?.value.inlineChatWidget;
            if (inlineChatWidget) {
                inlineChatWidget.placeholder = this._getPlaceholderText();
            }
        }
        _getPlaceholderText() {
            return this._forcedPlaceholder ?? '';
        }
        setPlaceholder(text) {
            this._forcedPlaceholder = text;
            this._updatePlaceholder();
        }
        resetPlaceholder() {
            this._forcedPlaceholder = undefined;
            this._updatePlaceholder();
        }
        clear() {
            if (this._currentRequest) {
                this._model.value?.cancelRequest(this._currentRequest);
            }
            this._model.clear();
            this._chatWidget?.rawValue?.hide();
            this._chatWidget?.rawValue?.setValue(undefined);
            this._responseContainsCodeBlockContextKey.reset();
            this._sessionResponseVoteContextKey.reset();
            this._requestActiveContextKey.reset();
        }
        async acceptInput() {
            if (!this._model.value) {
                this._model.value = this._chatService.startSession(chatAgents_1.ChatAgentLocation.Terminal, cancellation_1.CancellationToken.None);
                if (!this._model.value) {
                    throw new Error('Could not start chat session');
                }
            }
            this._messages.fire(32 /* Message.ACCEPT_INPUT */);
            const model = this._model.value;
            this._lastInput = this._chatWidget?.value?.input();
            if (!this._lastInput) {
                return;
            }
            const accessibilityRequestId = this._chatAccessibilityService.acceptRequest();
            this._requestActiveContextKey.set(true);
            const cancellationToken = new cancellation_1.CancellationTokenSource().token;
            let responseContent = '';
            const progressCallback = (progress) => {
                if (cancellationToken.isCancellationRequested) {
                    return;
                }
                if (progress.kind === 'markdownContent') {
                    responseContent += progress.content.value;
                }
                if (this._currentRequest) {
                    model.acceptResponseProgress(this._currentRequest, progress);
                }
            };
            await model.waitForInitialization();
            this._chatWidget?.value.addToHistory(this._lastInput);
            const request = {
                text: this._lastInput,
                parts: []
            };
            const requestVarData = {
                variables: []
            };
            this._currentRequest = model.addRequest(request, requestVarData, 0);
            const requestProps = {
                sessionId: model.sessionId,
                requestId: this._currentRequest.id,
                agentId: this._terminalAgentId,
                message: this._lastInput,
                variables: { variables: [] },
                location: chatAgents_1.ChatAgentLocation.Terminal
            };
            try {
                const task = this._chatAgentService.invokeAgent(this._terminalAgentId, requestProps, progressCallback, (0, chatModel_1.getHistoryEntriesFromModel)(model, this._terminalAgentId), cancellationToken);
                this._chatWidget?.value.inlineChatWidget.updateChatMessage(undefined);
                this._chatWidget?.value.inlineChatWidget.updateFollowUps(undefined);
                this._chatWidget?.value.inlineChatWidget.updateProgress(true);
                this._chatWidget?.value.inlineChatWidget.updateInfo(chat_1.GeneratingPhrase + '\u2026');
                await task;
            }
            catch (e) {
            }
            finally {
                this._requestActiveContextKey.set(false);
                this._chatWidget?.value.inlineChatWidget.updateProgress(false);
                this._chatWidget?.value.inlineChatWidget.updateInfo('');
                this._chatWidget?.value.inlineChatWidget.updateToolbar(true);
                if (this._currentRequest) {
                    model.completeResponse(this._currentRequest);
                }
                this._lastResponseContent = responseContent;
                if (this._currentRequest) {
                    this._chatAccessibilityService.acceptResponse(responseContent, accessibilityRequestId);
                    const containsCode = responseContent.includes('```');
                    this._chatWidget?.value.inlineChatWidget.updateChatMessage({ message: new htmlContent_1.MarkdownString(responseContent), requestId: this._currentRequest.id }, false, containsCode);
                    const firstCodeBlock = await this.chatWidget?.inlineChatWidget.getCodeBlockInfo(0);
                    const secondCodeBlock = await this.chatWidget?.inlineChatWidget.getCodeBlockInfo(1);
                    this._responseContainsCodeBlockContextKey.set(!!firstCodeBlock);
                    this._responseContainsMulitpleCodeBlocksContextKey.set(!!secondCodeBlock);
                    this._chatWidget?.value.inlineChatWidget.updateToolbar(true);
                }
                const supportIssueReporting = this._currentRequest?.response?.agent?.metadata?.supportIssueReporting;
                if (supportIssueReporting !== undefined) {
                    this._responseSupportsIssueReportingContextKey.set(supportIssueReporting);
                }
            }
        }
        updateInput(text, selectAll = true) {
            const widget = this._chatWidget?.value.inlineChatWidget;
            if (widget) {
                widget.value = text;
                if (selectAll) {
                    widget.selectAll();
                }
            }
        }
        getInput() {
            return this._chatWidget?.value.input() ?? '';
        }
        focus() {
            this._chatWidget?.value.focus();
        }
        hasFocus() {
            return !!this._chatWidget?.rawValue?.hasFocus() ?? false;
        }
        async acceptCommand(shouldExecute) {
            const code = await this.chatWidget?.inlineChatWidget.getCodeBlockInfo(0);
            if (!code) {
                return;
            }
            this._chatWidget?.value.acceptCommand(code.textEditorModel.getValue(), shouldExecute);
        }
        reveal() {
            this._chatWidget?.value.reveal();
        }
        async viewInChat() {
            const widget = await (0, chat_1.showChatView)(this._viewsService);
            const request = this._currentRequest;
            if (!widget || !request?.response) {
                return;
            }
            const message = [];
            for (const item of request.response.response.value) {
                if (item.kind === 'textEditGroup') {
                    for (const group of item.edits) {
                        message.push({
                            kind: 'textEdit',
                            edits: group,
                            uri: item.uri
                        });
                    }
                }
                else {
                    message.push(item);
                }
            }
            this._chatService.addCompleteRequest(widget.viewModel.sessionId, 
            // DEBT: Add hardcoded agent name until its removed
            `@${this._terminalAgentName} ${request.message.text}`, request.variableData, request.attempt, {
                message,
                result: request.response.result,
                followups: request.response.followups
            });
            widget.focusLastMessage();
            this._chatWidget?.rawValue?.hide();
        }
        // TODO: Move to register calls, don't override
        dispose() {
            if (this._currentRequest) {
                this._model.value?.cancelRequest(this._currentRequest);
            }
            super.dispose();
            this.clear();
        }
    };
    exports.TerminalChatController = TerminalChatController;
    exports.TerminalChatController = TerminalChatController = TerminalChatController_1 = __decorate([
        __param(3, terminal_1.ITerminalService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, chatAgents_1.IChatAgentService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, chat_1.IChatAccessibilityService),
        __param(8, chatService_1.IChatService),
        __param(9, chat_1.IChatCodeBlockContextProviderService),
        __param(10, viewsService_1.IViewsService)
    ], TerminalChatController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0Q29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9jaGF0L2Jyb3dzZXIvdGVybWluYWxDaGF0Q29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBdUJoRyxJQUFXLE9BU1Y7SUFURCxXQUFXLE9BQU87UUFDakIscUNBQVEsQ0FBQTtRQUNSLHlEQUF1QixDQUFBO1FBQ3ZCLHlEQUF1QixDQUFBO1FBQ3ZCLHVEQUFzQixDQUFBO1FBQ3RCLHlEQUF1QixDQUFBO1FBQ3ZCLHNEQUFxQixDQUFBO1FBQ3JCLHNEQUFxQixDQUFBO1FBQ3JCLG9EQUFvQixDQUFBO0lBQ3JCLENBQUMsRUFUVSxPQUFPLEtBQVAsT0FBTyxRQVNqQjtJQUVNLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEsc0JBQVU7O2lCQUNyQyxPQUFFLEdBQUcsZUFBZSxBQUFsQixDQUFtQjtRQUVyQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQTJCO1lBQ3JDLE9BQU8sUUFBUSxDQUFDLGVBQWUsQ0FBeUIsd0JBQXNCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQWFEOzs7V0FHRztRQUNILElBQUksVUFBVSxLQUFxQyxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQWVwRixJQUFJLG1CQUFtQjtZQUN0QixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztRQUNsQyxDQUFDO1FBVUQsWUFDa0IsU0FBNEIsRUFDN0MsY0FBdUMsRUFDdkMsYUFBb0MsRUFDbEIsZ0JBQW1ELEVBQzlDLHFCQUE2RCxFQUNqRSxpQkFBcUQsRUFDcEQsa0JBQXVELEVBQ2hELHlC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