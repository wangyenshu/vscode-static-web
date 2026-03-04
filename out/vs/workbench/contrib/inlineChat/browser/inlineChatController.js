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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/stopwatch", "vs/base/common/types", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/services/editorWorker", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatService", "./inlineChatSavingService", "vs/workbench/contrib/inlineChat/browser/inlineChatSession", "./inlineChatSessionService", "vs/workbench/contrib/inlineChat/browser/inlineChatStrategies", "./inlineChatZoneWidget", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/platform/commands/common/commands", "vs/workbench/contrib/inlineChat/browser/inlineChatContentWidget", "vs/editor/contrib/message/browser/messageController", "vs/base/common/arrays", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl", "vs/editor/common/services/languageFeatures", "vs/workbench/contrib/chat/browser/chatInputPart", "vs/editor/common/core/offsetRange", "vs/base/common/resources", "vs/workbench/services/views/common/viewsService"], function (require, exports, aria, async_1, cancellation_1, errorMessage_1, errors_1, event_1, lazy_1, lifecycle_1, numbers_1, stopwatch_1, types_1, position_1, range_1, selection_1, languages_1, editorWorker_1, inlineCompletionsController_1, nls_1, configuration_1, contextkey_1, dialogs_1, instantiation_1, log_1, chat_1, chatAgents_1, chatParserTypes_1, chatService_1, inlineChatSavingService_1, inlineChatSession_1, inlineChatSessionService_1, inlineChatStrategies_1, inlineChatZoneWidget_1, inlineChat_1, commands_1, inlineChatContentWidget_1, messageController_1, arrays_1, inlineChatSessionServiceImpl_1, languageFeatures_1, chatInputPart_1, offsetRange_1, resources_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatController = exports.InlineChatRunOptions = exports.State = void 0;
    var State;
    (function (State) {
        State["CREATE_SESSION"] = "CREATE_SESSION";
        State["INIT_UI"] = "INIT_UI";
        State["WAIT_FOR_INPUT"] = "WAIT_FOR_INPUT";
        State["SHOW_REQUEST"] = "SHOW_REQUEST";
        State["SHOW_RESPONSE"] = "SHOW_RESPONSE";
        State["PAUSE"] = "PAUSE";
        State["CANCEL"] = "CANCEL";
        State["ACCEPT"] = "DONE";
    })(State || (exports.State = State = {}));
    var Message;
    (function (Message) {
        Message[Message["NONE"] = 0] = "NONE";
        Message[Message["ACCEPT_SESSION"] = 1] = "ACCEPT_SESSION";
        Message[Message["CANCEL_SESSION"] = 2] = "CANCEL_SESSION";
        Message[Message["PAUSE_SESSION"] = 4] = "PAUSE_SESSION";
        Message[Message["CANCEL_REQUEST"] = 8] = "CANCEL_REQUEST";
        Message[Message["CANCEL_INPUT"] = 16] = "CANCEL_INPUT";
        Message[Message["ACCEPT_INPUT"] = 32] = "ACCEPT_INPUT";
    })(Message || (Message = {}));
    class InlineChatRunOptions {
        static isInteractiveEditorOptions(options) {
            const { initialSelection, initialRange, message, autoSend, position, existingSession } = options;
            if (typeof message !== 'undefined' && typeof message !== 'string'
                || typeof autoSend !== 'undefined' && typeof autoSend !== 'boolean'
                || typeof initialRange !== 'undefined' && !range_1.Range.isIRange(initialRange)
                || typeof initialSelection !== 'undefined' && !selection_1.Selection.isISelection(initialSelection)
                || typeof position !== 'undefined' && !position_1.Position.isIPosition(position)
                || typeof existingSession !== 'undefined' && !(existingSession instanceof inlineChatSession_1.Session)) {
                return false;
            }
            return true;
        }
    }
    exports.InlineChatRunOptions = InlineChatRunOptions;
    let InlineChatController = class InlineChatController {
        static get(editor) {
            return editor.getContribution(inlineChat_1.INLINE_CHAT_ID);
        }
        constructor(_editor, _instaService, _inlineChatSessionService, _inlineChatSavingService, _editorWorkerService, _logService, _configurationService, _dialogService, contextKeyService, _chatAgentService, _chatService, _commandService, _languageFeatureService, _chatWidgetService) {
            this._editor = _editor;
            this._instaService = _instaService;
            this._inlineChatSessionService = _inlineChatSessionService;
            this._inlineChatSavingService = _inlineChatSavingService;
            this._editorWorkerService = _editorWorkerService;
            this._logService = _logService;
            this._configurationService = _configurationService;
            this._dialogService = _dialogService;
            this._chatAgentService = _chatAgentService;
            this._chatService = _chatService;
            this._commandService = _commandService;
            this._languageFeatureService = _languageFeatureService;
            this._chatWidgetService = _chatWidgetService;
            this._isDisposed = false;
            this._store = new lifecycle_1.DisposableStore();
            this._messages = this._store.add(new event_1.Emitter());
            this._onWillStartSession = this._store.add(new event_1.Emitter());
            this.onWillStartSession = this._onWillStartSession.event;
            this.onDidAcceptInput = event_1.Event.filter(this._messages.event, m => m === 32 /* Message.ACCEPT_INPUT */, this._store);
            this.onDidCancelInput = event_1.Event.filter(this._messages.event, m => m === 16 /* Message.CANCEL_INPUT */ || m === 2 /* Message.CANCEL_SESSION */, this._store);
            this._sessionStore = this._store.add(new lifecycle_1.DisposableStore());
            this._stashedSession = this._store.add(new lifecycle_1.MutableDisposable());
            this._forcedPlaceholder = undefined;
            this._ctxVisible = inlineChat_1.CTX_INLINE_CHAT_VISIBLE.bindTo(contextKeyService);
            this._ctxDidEdit = inlineChat_1.CTX_INLINE_CHAT_DID_EDIT.bindTo(contextKeyService);
            this._ctxUserDidEdit = inlineChat_1.CTX_INLINE_CHAT_USER_DID_EDIT.bindTo(contextKeyService);
            this._ctxResponseTypes = inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.bindTo(contextKeyService);
            this._ctxLastFeedbackKind = inlineChat_1.CTX_INLINE_CHAT_LAST_FEEDBACK.bindTo(contextKeyService);
            this._ctxSupportIssueReporting = inlineChat_1.CTX_INLINE_CHAT_SUPPORT_ISSUE_REPORTING.bindTo(contextKeyService);
            this._input = new lazy_1.Lazy(() => this._store.add(_instaService.createInstance(inlineChatContentWidget_1.InlineChatContentWidget, this._editor)));
            this._zone = new lazy_1.Lazy(() => this._store.add(_instaService.createInstance(inlineChatZoneWidget_1.InlineChatZoneWidget, this._editor)));
            this._store.add(this._editor.onDidChangeModel(async (e) => {
                if (this._session || !e.newModelUrl) {
                    return;
                }
                const existingSession = this._inlineChatSessionService.getSession(this._editor, e.newModelUrl);
                if (!existingSession) {
                    return;
                }
                this._log('session RESUMING after model change', e);
                await this.run({ existingSession });
            }));
            this._store.add(this._inlineChatSessionService.onDidEndSession(e => {
                if (e.session === this._session && e.endedByExternalCause) {
                    this._log('session ENDED by external cause');
                    this._session = undefined;
                    this._strategy?.cancel();
                    this._resetWidget();
                    this.cancelSession();
                }
            }));
            this._store.add(this._inlineChatSessionService.onDidMoveSession(async (e) => {
                if (e.editor === this._editor) {
                    this._log('session RESUMING after move', e);
                    await this.run({ existingSession: e.session });
                }
            }));
            this._log('NEW controller');
        }
        dispose() {
            if (this._currentRun) {
                this._messages.fire(this._session?.chatModel.hasRequests
                    ? 4 /* Message.PAUSE_SESSION */
                    : 2 /* Message.CANCEL_SESSION */);
            }
            this._store.dispose();
            this._isDisposed = true;
            this._log('DISPOSED controller');
        }
        _log(message, ...more) {
            if (message instanceof Error) {
                this._logService.error(message, ...more);
            }
            else {
                this._logService.trace(`[IE] (editor:${this._editor.getId()})${message}`, ...more);
            }
        }
        getMessage() {
            return this._zone.value.widget.responseContent;
        }
        getId() {
            return inlineChat_1.INLINE_CHAT_ID;
        }
        _getMode() {
            return this._configurationService.getValue("inlineChat.mode" /* InlineChatConfigKeys.Mode */);
        }
        getWidgetPosition() {
            return this._zone.value.position;
        }
        async run(options = {}) {
            try {
                this.finishExistingSession();
                if (this._currentRun) {
                    await this._currentRun;
                }
                if (options.initialSelection) {
                    this._editor.setSelection(options.initialSelection);
                }
                this._stashedSession.clear();
                this._onWillStartSession.fire();
                this._currentRun = this._nextState("CREATE_SESSION" /* State.CREATE_SESSION */, options);
                await this._currentRun;
            }
            catch (error) {
                // this should not happen but when it does make sure to tear down the UI and everything
                (0, errors_1.onUnexpectedError)(error);
                if (this._session) {
                    this._inlineChatSessionService.releaseSession(this._session);
                }
                this["PAUSE" /* State.PAUSE */]();
            }
            finally {
                this._currentRun = undefined;
            }
        }
        // ---- state machine
        async _nextState(state, options) {
            let nextState = state;
            while (nextState && !this._isDisposed) {
                this._log('setState to ', nextState);
                nextState = await this[nextState](options);
            }
        }
        async ["CREATE_SESSION" /* State.CREATE_SESSION */](options) {
            (0, types_1.assertType)(this._session === undefined);
            (0, types_1.assertType)(this._editor.hasModel());
            let session = options.existingSession;
            let initPosition;
            if (options.position) {
                initPosition = position_1.Position.lift(options.position).delta(-1);
                delete options.position;
            }
            const widgetPosition = this._showWidget(true, initPosition);
            // this._updatePlaceholder();
            let errorMessage = (0, nls_1.localize)('create.fail', "Failed to start editor chat");
            if (!session) {
                const createSessionCts = new cancellation_1.CancellationTokenSource();
                const msgListener = event_1.Event.once(this._messages.event)(m => {
                    this._log('state=_createSession) message received', m);
                    if (m === 32 /* Message.ACCEPT_INPUT */) {
                        // user accepted the input before having a session
                        options.autoSend = true;
                        this._zone.value.widget.updateProgress(true);
                        this._zone.value.widget.updateInfo((0, nls_1.localize)('welcome.2', "Getting ready..."));
                    }
                    else {
                        createSessionCts.cancel();
                    }
                });
                try {
                    session = await this._inlineChatSessionService.createSession(this._editor, { editMode: this._getMode(), wholeRange: options.initialRange }, createSessionCts.token);
                }
                catch (error) {
                    // Inline chat errors are from the provider and have their error messages shown to the user
                    if (error instanceof inlineChatSessionServiceImpl_1.InlineChatError || error?.name === inlineChatSessionServiceImpl_1.InlineChatError.code) {
                        errorMessage = error.message;
                    }
                }
                createSessionCts.dispose();
                msgListener.dispose();
                if (createSessionCts.token.isCancellationRequested) {
                    if (session) {
                        this._inlineChatSessionService.releaseSession(session);
                    }
                    return "CANCEL" /* State.CANCEL */;
                }
            }
            delete options.initialRange;
            delete options.existingSession;
            if (!session) {
                messageController_1.MessageController.get(this._editor)?.showMessage(errorMessage, widgetPosition);
                this._log('Failed to start editor chat');
                return "CANCEL" /* State.CANCEL */;
            }
            await session.chatModel.waitForInitialization();
            // create a new strategy
            switch (session.editMode) {
                case "preview" /* EditMode.Preview */:
                    this._strategy = this._instaService.createInstance(inlineChatStrategies_1.PreviewStrategy, session, this._editor, this._zone.value);
                    break;
                case "live" /* EditMode.Live */:
                default:
                    this._strategy = this._instaService.createInstance(inlineChatStrategies_1.LiveStrategy, session, this._editor, this._zone.value);
                    break;
            }
            this._session = session;
            return "INIT_UI" /* State.INIT_UI */;
        }
        async ["INIT_UI" /* State.INIT_UI */](options) {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._strategy);
            // hide/cancel inline completions when invoking IE
            inlineCompletionsController_1.InlineCompletionsController.get(this._editor)?.hide();
            this._sessionStore.clear();
            const wholeRangeDecoration = this._editor.createDecorationsCollection();
            const updateWholeRangeDecoration = () => {
                const newDecorations = this._strategy?.getWholeRangeDecoration() ?? [];
                wholeRangeDecoration.set(newDecorations);
            };
            this._sessionStore.add((0, lifecycle_1.toDisposable)(() => wholeRangeDecoration.clear()));
            this._sessionStore.add(this._session.wholeRange.onDidChange(updateWholeRangeDecoration));
            updateWholeRangeDecoration();
            this._sessionStore.add(this._input.value.onDidBlur(() => this.cancelSession()));
            this._input.value.setSession(this._session);
            // this._zone.value.widget.updateSlashCommands(this._session.session.slashCommands ?? []);
            this._updatePlaceholder();
            const message = this._session.session.message ?? (0, nls_1.localize)('welcome.1', "AI-generated code may be incorrect");
            this._zone.value.widget.updateInfo(message);
            this._showWidget(!this._session.chatModel.hasRequests);
            this._sessionStore.add(this._editor.onDidChangeModel((e) => {
                const msg = this._session?.chatModel.hasRequests
                    ? 4 /* Message.PAUSE_SESSION */
                    : 2 /* Message.CANCEL_SESSION */;
                this._log('model changed, pause or cancel session', msg, e);
                this._messages.fire(msg);
            }));
            const altVersionNow = this._editor.getModel()?.getAlternativeVersionId();
            this._sessionStore.add(this._editor.onDidChangeModelContent(e => {
                if (!this._session?.hunkData.ignoreTextModelNChanges) {
                    this._ctxUserDidEdit.set(altVersionNow !== this._editor.getModel()?.getAlternativeVersionId());
                }
                if (this._session?.hunkData.ignoreTextModelNChanges || this._strategy?.hasFocus()) {
                    return;
                }
                const wholeRange = this._session.wholeRange;
                let shouldFinishSession = false;
                if (this._configurationService.getValue("inlineChat.finishOnType" /* InlineChatConfigKeys.FinishOnType */)) {
                    for (const { range } of e.changes) {
                        shouldFinishSession = !range_1.Range.areIntersectingOrTouching(range, wholeRange.value);
                    }
                }
                this._session.recordExternalEditOccurred(shouldFinishSession);
                if (shouldFinishSession) {
                    this._log('text changed outside of whole range, FINISH session');
                    this.finishExistingSession();
                }
            }));
            this._sessionStore.add(this._session.chatModel.onDidChange(async (e) => {
                if (e.kind === 'addRequest' && e.request.response) {
                    this._zone.value.widget.updateProgress(true);
                    const listener = e.request.response.onDidChange(() => {
                        if (e.request.response?.isCanceled || e.request.response?.isComplete) {
                            this._zone.value.widget.updateProgress(false);
                            listener.dispose();
                        }
                    });
                }
                else if (e.kind === 'removeRequest') {
                    // TODO@jrieken this currently is buggy when removing not the very last request/response
                    if (this._session.lastExchange?.response instanceof inlineChatSession_1.ReplyResponse) {
                        try {
                            this._session.hunkData.ignoreTextModelNChanges = true;
                            await this._strategy.undoChanges(this._session.lastExchange.response.modelAltVersionId);
                        }
                        finally {
                            this._session.hunkData.ignoreTextModelNChanges = false;
                        }
                    }
                }
            }));
            // Update context key
            this._ctxSupportIssueReporting.set(this._session.provider.supportIssueReporting ?? false);
            // #region DEBT
            // DEBT@jrieken
            // REMOVE when agents are adopted
            this._sessionStore.add(this._languageFeatureService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'inline chat commands',
                triggerCharacters: ['/'],
                provideCompletionItems: (model, position, context, token) => {
                    if (position.lineNumber !== 1) {
                        return undefined;
                    }
                    if (!this._session || !this._session.session.slashCommands) {
                        return undefined;
                    }
                    const widget = this._chatWidgetService.getWidgetByInputUri(model.uri);
                    if (widget !== this._zone.value.widget.chatWidget && widget !== this._input.value.chatWidget) {
                        return undefined;
                    }
                    const result = { suggestions: [], incomplete: false };
                    for (const command of this._session.session.slashCommands) {
                        const withSlash = `/${command.command}`;
                        result.suggestions.push({
                            label: { label: withSlash, description: command.detail ?? '' },
                            kind: 18 /* CompletionItemKind.Text */,
                            insertText: withSlash,
                            range: range_1.Range.fromPositions(new position_1.Position(1, 1), position),
                            command: command.executeImmediately ? { id: 'workbench.action.chat.acceptInput', title: withSlash } : undefined
                        });
                    }
                    return result;
                }
            }));
            const updateSlashDecorations = (collection, model) => {
                const newDecorations = [];
                for (const command of (this._session?.session.slashCommands ?? []).sort((a, b) => b.command.length - a.command.length)) {
                    const withSlash = `/${command.command}`;
                    const firstLine = model.getLineContent(1);
                    if (firstLine.startsWith(withSlash)) {
                        newDecorations.push({
                            range: new range_1.Range(1, 1, 1, withSlash.length + 1),
                            options: {
                                description: 'inline-chat-slash-command',
                                inlineClassName: 'inline-chat-slash-command',
                                after: {
                                    // Force some space between slash command and placeholder
                                    content: ' '
                                }
                            }
                        });
                        // inject detail when otherwise empty
                        if (firstLine.trim() === `/${command.command}`) {
                            newDecorations.push({
                                range: new range_1.Range(1, withSlash.length, 1, withSlash.length),
                                options: {
                                    description: 'inline-chat-slash-command-detail',
                                    after: {
                                        content: `${command.detail}`,
                                        inlineClassName: 'inline-chat-slash-command-detail'
                                    }
                                }
                            });
                        }
                        break;
                    }
                }
                collection.set(newDecorations);
            };
            const inputInputEditor = this._input.value.chatWidget.inputEditor;
            const zoneInputEditor = this._zone.value.widget.chatWidget.inputEditor;
            const inputDecorations = inputInputEditor.createDecorationsCollection();
            const zoneDecorations = zoneInputEditor.createDecorationsCollection();
            this._sessionStore.add(inputInputEditor.onDidChangeModelContent(() => updateSlashDecorations(inputDecorations, inputInputEditor.getModel())));
            this._sessionStore.add(zoneInputEditor.onDidChangeModelContent(() => updateSlashDecorations(zoneDecorations, zoneInputEditor.getModel())));
            this._sessionStore.add((0, lifecycle_1.toDisposable)(() => {
                inputDecorations.clear();
                zoneDecorations.clear();
            }));
            //#endregion ------- DEBT
            if (!this._session.chatModel.hasRequests) {
                return "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */;
            }
            else if (options.isUnstashed) {
                delete options.isUnstashed;
                return "SHOW_RESPONSE" /* State.SHOW_RESPONSE */;
            }
            else {
                return "SHOW_RESPONSE" /* State.SHOW_RESPONSE */;
            }
        }
        async ["WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */](options) {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._strategy);
            this._updatePlaceholder();
            if (options.message) {
                this.updateInput(options.message);
                aria.alert(options.message);
                delete options.message;
                this._showWidget(false);
            }
            let message = 0 /* Message.NONE */;
            let request;
            const barrier = new async_1.Barrier();
            const store = new lifecycle_1.DisposableStore();
            store.add(this._session.chatModel.onDidChange(e => {
                if (e.kind === 'addRequest') {
                    request = e.request;
                    message = 32 /* Message.ACCEPT_INPUT */;
                    barrier.open();
                }
            }));
            store.add(this._strategy.onDidAccept(() => this.acceptSession()));
            store.add(this._strategy.onDidDiscard(() => this.cancelSession()));
            store.add(event_1.Event.once(this._messages.event)(m => {
                this._log('state=_waitForInput) message received', m);
                message = m;
                barrier.open();
            }));
            if (options.autoSend) {
                delete options.autoSend;
                this._showWidget(false);
                this._zone.value.widget.chatWidget.acceptInput();
            }
            await barrier.wait();
            store.dispose();
            if (message & (16 /* Message.CANCEL_INPUT */ | 2 /* Message.CANCEL_SESSION */)) {
                return "CANCEL" /* State.CANCEL */;
            }
            if (message & 4 /* Message.PAUSE_SESSION */) {
                return "PAUSE" /* State.PAUSE */;
            }
            if (message & 1 /* Message.ACCEPT_SESSION */) {
                this._zone.value.widget.selectAll(false);
                return "DONE" /* State.ACCEPT */;
            }
            if (!request?.message.text) {
                return "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */;
            }
            const input = request.message.text;
            this._zone.value.widget.value = input;
            // slash command referring
            let slashCommandLike = request.message.parts.find(part => part instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart || part instanceof chatParserTypes_1.ChatRequestSlashCommandPart);
            const refer = this._session.session.slashCommands?.some(value => {
                if (value.refer) {
                    if (slashCommandLike?.text === `/${value.command}`) {
                        return true;
                    }
                    if (request?.message.text.startsWith(`/${value.command}`)) {
                        slashCommandLike = new chatParserTypes_1.ChatRequestSlashCommandPart(new offsetRange_1.OffsetRange(0, 1), new range_1.Range(1, 1, 1, 1), { command: value.command, detail: value.detail ?? '' });
                        return true;
                    }
                }
                return false;
            });
            if (refer && slashCommandLike && !this._session.lastExchange) {
                this._log('[IE] seeing refer command, continuing outside editor', this._session.provider.extensionId);
                // cancel this request
                this._chatService.cancelCurrentRequestForSession(request.session.sessionId);
                this._editor.setSelection(this._session.wholeRange.value);
                let massagedInput = input;
                const withoutSubCommandLeader = slashCommandLike.text.slice(1);
                for (const agent of this._chatAgentService.getActivatedAgents()) {
                    if (agent.locations.includes(chatAgents_1.ChatAgentLocation.Panel)) {
                        const commands = agent.slashCommands;
                        if (commands.find((command) => withoutSubCommandLeader.startsWith(command.name))) {
                            massagedInput = `${chatParserTypes_1.chatAgentLeader}${agent.name} ${slashCommandLike.text}`;
                            break;
                        }
                    }
                }
                // if agent has a refer command, massage the input to include the agent name
                await this._instaService.invokeFunction(sendRequest, massagedInput);
                return "DONE" /* State.ACCEPT */;
            }
            this._session.addInput(new inlineChatSession_1.SessionPrompt(input));
            return "SHOW_REQUEST" /* State.SHOW_REQUEST */;
        }
        async ["SHOW_REQUEST" /* State.SHOW_REQUEST */]() {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._session.chatModel.requestInProgress);
            const request = (0, arrays_1.tail)(this._session.chatModel.getRequests());
            (0, types_1.assertType)(request);
            (0, types_1.assertType)(request.response);
            this._showWidget(false);
            this._zone.value.widget.value = request.message.text;
            this._zone.value.widget.selectAll(false);
            this._zone.value.widget.updateInfo('');
            const { response } = request;
            const responsePromise = new async_1.DeferredPromise();
            const store = new lifecycle_1.DisposableStore();
            const progressiveEditsCts = store.add(new cancellation_1.CancellationTokenSource());
            const progressiveEditsAvgDuration = new numbers_1.MovingAverage();
            const progressiveEditsClock = stopwatch_1.StopWatch.create();
            const progressiveEditsQueue = new async_1.Queue();
            let lastLength = 0;
            let message = 0 /* Message.NONE */;
            store.add(event_1.Event.once(this._messages.event)(m => {
                this._log('state=_makeRequest) message received', m);
                this._chatService.cancelCurrentRequestForSession(request.session.sessionId);
                message = m;
            }));
            // cancel the request when the user types
            store.add(this._zone.value.widget.chatWidget.inputEditor.onDidChangeModelContent(() => {
                this._chatService.cancelCurrentRequestForSession(request.session.sessionId);
            }));
            // apply edits
            store.add(response.onDidChange(() => {
                if (response.isCanceled) {
                    progressiveEditsCts.cancel();
                    responsePromise.complete();
                    return;
                }
                if (response.isComplete) {
                    responsePromise.complete();
                    return;
                }
                // if ("1") {
                // 	return;
                // }
                // TODO@jrieken
                const editsShouldBeInstant = false;
                const edits = response.response.value.map(part => {
                    if (part.kind === 'textEditGroup' && (0, resources_1.isEqual)(part.uri, this._session?.textModelN.uri)) {
                        return part.edits;
                    }
                    else {
                        return [];
                    }
                }).flat();
                // const edits = response.edits.get(this._session!.textModelN.uri) ?? [];
                const newEdits = edits.slice(lastLength);
                // console.log('NEW edits', newEdits, edits);
                if (newEdits.length === 0) {
                    return; // NO change
                }
                lastLength = edits.length;
                progressiveEditsAvgDuration.update(progressiveEditsClock.elapsed());
                progressiveEditsClock.reset();
                progressiveEditsQueue.queue(async () => {
                    const startThen = this._session.wholeRange.value.getStartPosition();
                    // making changes goes into a queue because otherwise the async-progress time will
                    // influence the time it takes to receive the changes and progressive typing will
                    // become infinitely fast
                    for (const edits of newEdits) {
                        await this._makeChanges(edits, editsShouldBeInstant
                            ? undefined
                            : { duration: progressiveEditsAvgDuration.value, token: progressiveEditsCts.token });
                    }
                    // reshow the widget if the start position changed or shows at the wrong position
                    const startNow = this._session.wholeRange.value.getStartPosition();
                    if (!startNow.equals(startThen) || !this._zone.value.position?.equals(startNow)) {
                        this._showWidget(false, startNow.delta(-1));
                    }
                });
            }));
            // (1) we must wait for the request to finish
            // (2) we must wait for all edits that came in via progress to complete
            await responsePromise.p;
            await progressiveEditsQueue.whenIdle();
            store.dispose();
            // todo@jrieken we can likely remove 'trackEdit'
            const diff = await this._editorWorkerService.computeDiff(this._session.textModel0.uri, this._session.textModelN.uri, { computeMoves: false, maxComputationTimeMs: Number.MAX_SAFE_INTEGER, ignoreTrimWhitespace: false }, 'advanced');
            this._session.wholeRange.fixup(diff?.changes ?? []);
            await this._session.hunkData.recompute();
            this._zone.value.widget.updateToolbar(true);
            if (message & 2 /* Message.CANCEL_SESSION */) {
                return "CANCEL" /* State.CANCEL */;
            }
            else if (message & 4 /* Message.PAUSE_SESSION */) {
                return "PAUSE" /* State.PAUSE */;
            }
            else if (message & 1 /* Message.ACCEPT_SESSION */) {
                return "DONE" /* State.ACCEPT */;
            }
            else {
                return "SHOW_RESPONSE" /* State.SHOW_RESPONSE */;
            }
        }
        async ["SHOW_RESPONSE" /* State.SHOW_RESPONSE */]() {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._strategy);
            const { response } = this._session.lastExchange;
            let responseTypes;
            for (const request of this._session.chatModel.getRequests()) {
                if (!request.response) {
                    continue;
                }
                const thisType = asInlineChatResponseType(request.response.response);
                if (responseTypes === undefined) {
                    responseTypes = thisType;
                }
                else if (responseTypes !== thisType) {
                    responseTypes = "mixed" /* InlineChatResponseTypes.Mixed */;
                    break;
                }
            }
            this._ctxResponseTypes.set(responseTypes);
            this._ctxDidEdit.set(this._session.hasChangedText);
            let newPosition;
            if (response instanceof inlineChatSession_1.EmptyResponse) {
                // show status message
                const status = (0, nls_1.localize)('empty', "No results, please refine your input and try again");
                this._zone.value.widget.updateStatus(status, { classes: ['warn'] });
                return "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */;
            }
            else if (response instanceof inlineChatSession_1.ErrorResponse) {
                // show error
                if (!response.isCancellation) {
                    this._zone.value.widget.updateStatus(response.message, { classes: ['error'] });
                    this._strategy?.cancel();
                }
            }
            else if (response instanceof inlineChatSession_1.ReplyResponse) {
                // real response -> complex...
                this._zone.value.widget.updateStatus('');
                this._zone.value.widget.updateToolbar(true);
                newPosition = await this._strategy.renderChanges(response);
                if (this._session.provider.provideFollowups) {
                    const followupCts = new cancellation_1.CancellationTokenSource();
                    const msgListener = event_1.Event.once(this._messages.event)(() => {
                        followupCts.cancel();
                    });
                    const followupTask = this._session.provider.provideFollowups(this._session.session, response.raw, followupCts.token);
                    this._log('followup request started', this._session.provider.extensionId, this._session.session, response.raw);
                    (0, async_1.raceCancellation)(Promise.resolve(followupTask), followupCts.token).then(followupReply => {
                        if (followupReply && this._session) {
                            this._log('followup request received', this._session.provider.extensionId, this._session.session, followupReply);
                            this._zone.value.widget.updateFollowUps(followupReply, followup => {
                                if (followup.kind === 'reply') {
                                    this.updateInput(followup.message);
                                    this.acceptInput();
                                }
                                else {
                                    this._commandService.executeCommand(followup.commandId, ...(followup.args ?? []));
                                }
                            });
                        }
                    }).finally(() => {
                        msgListener.dispose();
                        followupCts.dispose();
                    });
                }
            }
            this._showWidget(false, newPosition);
            return "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */;
        }
        async ["PAUSE" /* State.PAUSE */]() {
            this._resetWidget();
            this._strategy?.dispose?.();
            this._session = undefined;
        }
        async ["DONE" /* State.ACCEPT */]() {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._strategy);
            this._sessionStore.clear();
            try {
                await this._strategy.apply();
            }
            catch (err) {
                this._dialogService.error((0, nls_1.localize)('err.apply', "Failed to apply changes.", (0, errorMessage_1.toErrorMessage)(err)));
                this._log('FAILED to apply changes');
                this._log(err);
            }
            this._inlineChatSessionService.releaseSession(this._session);
            this._resetWidget();
            this._strategy?.dispose();
            this._strategy = undefined;
            this._session = undefined;
        }
        async ["CANCEL" /* State.CANCEL */]() {
            if (this._session) {
                // assertType(this._session);
                (0, types_1.assertType)(this._strategy);
                this._sessionStore.clear();
                // only stash sessions that were not unstashed, not "empty", and not interacted with
                const shouldStash = !this._session.isUnstashed && !!this._session.lastExchange && this._session.hunkData.size === this._session.hunkData.pending;
                let undoCancelEdits = [];
                try {
                    undoCancelEdits = this._strategy.cancel();
                }
                catch (err) {
                    this._dialogService.error((0, nls_1.localize)('err.discard', "Failed to discard changes.", (0, errorMessage_1.toErrorMessage)(err)));
                    this._log('FAILED to discard changes');
                    this._log(err);
                }
                this._stashedSession.clear();
                if (shouldStash) {
                    this._stashedSession.value = this._inlineChatSessionService.stashSession(this._session, this._editor, undoCancelEdits);
                }
                else {
                    this._inlineChatSessionService.releaseSession(this._session);
                }
            }
            this._resetWidget();
            this._strategy?.dispose();
            this._strategy = undefined;
            this._session = undefined;
        }
        // ----
        _showWidget(initialRender = false, position) {
            (0, types_1.assertType)(this._editor.hasModel());
            let widgetPosition;
            if (position) {
                // explicit position wins
                widgetPosition = position;
            }
            else if (this._zone.rawValue?.position) {
                // already showing - special case of line 1
                if (this._zone.rawValue.position.lineNumber === 1) {
                    widgetPosition = this._zone.rawValue.position.delta(-1);
                }
                else {
                    widgetPosition = this._zone.rawValue.position;
                }
            }
            else {
                // default to ABOVE the selection
                widgetPosition = this._editor.getSelection().getStartPosition().delta(-1);
            }
            if (this._session && !position && (this._session.hasChangedText || this._session.lastExchange)) {
                widgetPosition = this._session.wholeRange.value.getStartPosition().delta(-1);
            }
            if (this._zone.rawValue?.position) {
                this._zone.value.updatePositionAndHeight(widgetPosition);
            }
            else if (initialRender) {
                const selection = this._editor.getSelection();
                widgetPosition = selection.getStartPosition();
                // TODO@jrieken we are not ready for this
                // widgetPosition = selection.getEndPosition();
                // if (Range.spansMultipleLines(selection) && widgetPosition.column === 1) {
                // 	// selection ends on "nothing" -> move up to match the
                // 	// rendered/visible part of the selection
                // 	widgetPosition = this._editor.getModel().validatePosition(widgetPosition.delta(-1, Number.MAX_SAFE_INTEGER));
                // }
                this._input.value.show(widgetPosition);
            }
            else {
                this._input.value.hide();
                this._zone.value.show(widgetPosition);
                if (this._session) {
                    this._zone.value.widget.setChatModel(this._session.chatModel);
                }
            }
            if (this._session && this._zone.rawValue) {
                this._zone.rawValue.updateBackgroundColor(widgetPosition, this._session.wholeRange.value);
            }
            this._ctxVisible.set(true);
            return widgetPosition;
        }
        _resetWidget() {
            this._sessionStore.clear();
            this._ctxVisible.reset();
            this._ctxDidEdit.reset();
            this._ctxUserDidEdit.reset();
            this._ctxLastFeedbackKind.reset();
            this._ctxSupportIssueReporting.reset();
            this._input.rawValue?.hide();
            this._zone.rawValue?.hide();
            // Return focus to the editor only if the current focus is within the editor widget
            if (this._editor.hasWidgetFocus()) {
                this._editor.focus();
            }
        }
        async _makeChanges(edits, opts) {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._strategy);
            const moreMinimalEdits = await this._editorWorkerService.computeMoreMinimalEdits(this._session.textModelN.uri, edits);
            this._log('edits from PROVIDER and after making them MORE MINIMAL', this._session.provider.extensionId, edits, moreMinimalEdits);
            if (moreMinimalEdits?.length === 0) {
                // nothing left to do
                return;
            }
            const actualEdits = !opts && moreMinimalEdits ? moreMinimalEdits : edits;
            const editOperations = actualEdits.map(languages_1.TextEdit.asEditOperation);
            const editsObserver = {
                start: () => this._session.hunkData.ignoreTextModelNChanges = true,
                stop: () => this._session.hunkData.ignoreTextModelNChanges = false,
            };
            this._inlineChatSavingService.markChanged(this._session);
            this._session.wholeRange.trackEdits(editOperations);
            if (opts) {
                await this._strategy.makeProgressiveChanges(editOperations, editsObserver, opts);
            }
            else {
                await this._strategy.makeChanges(editOperations, editsObserver);
            }
            this._ctxDidEdit.set(this._session.hasChangedText);
        }
        _updatePlaceholder() {
            this._zone.value.widget.placeholder = this._getPlaceholderText();
        }
        _getPlaceholderText() {
            return this._forcedPlaceholder ?? this._session?.session.placeholder ?? '';
        }
        // ---- controller API
        showSaveHint() {
            const status = (0, nls_1.localize)('savehint', "Accept or discard changes to continue saving");
            this._zone.value.widget.updateStatus(status, { classes: ['warn'] });
        }
        setPlaceholder(text) {
            this._forcedPlaceholder = text;
            this._updatePlaceholder();
        }
        resetPlaceholder() {
            this._forcedPlaceholder = undefined;
            this._updatePlaceholder();
        }
        acceptInput() {
            if (this._input.value.isVisible) {
                this._input.value.chatWidget.acceptInput();
            }
            else {
                this._zone.value.widget.chatWidget.acceptInput();
            }
        }
        updateInput(text, selectAll = true) {
            this._input.value.chatWidget.setInput(text);
            this._zone.value.widget.chatWidget.setInput(text);
            if (selectAll) {
                const newSelection = new selection_1.Selection(1, 1, Number.MAX_SAFE_INTEGER, 1);
                this._input.value.chatWidget.inputEditor.setSelection(newSelection);
                this._zone.value.widget.chatWidget.inputEditor.setSelection(newSelection);
            }
        }
        getInput() {
            return this._input.value.isVisible
                ? this._input.value.value
                : this._zone.value.widget.value;
        }
        cancelCurrentRequest() {
            this._messages.fire(16 /* Message.CANCEL_INPUT */ | 8 /* Message.CANCEL_REQUEST */);
        }
        arrowOut(up) {
            if (this._zone.value.position && this._editor.hasModel()) {
                const { column } = this._editor.getPosition();
                const { lineNumber } = this._zone.value.position;
                const newLine = up ? lineNumber : lineNumber + 1;
                this._editor.setPosition({ lineNumber: newLine, column });
                this._editor.focus();
            }
        }
        focus() {
            this._zone.value.widget.focus();
        }
        hasFocus() {
            return this._zone.value.widget.hasFocus();
        }
        moveHunk(next) {
            this.focus();
            this._strategy?.move?.(next);
        }
        viewInChat() {
            if (this._session?.lastExchange?.response instanceof inlineChatSession_1.ReplyResponse) {
                this._instaService.invokeFunction(showMessageResponse, this._session.lastExchange.prompt.value, this._session.lastExchange.response.mdContent.value);
            }
        }
        toggleDiff() {
            this._strategy?.toggleDiff?.();
        }
        createSnapshot() {
            if (this._session && !this._session.textModel0.equalsTextBuffer(this._session.textModelN.getTextBuffer())) {
                this._session.createSnapshot();
            }
        }
        acceptSession() {
            if (this._session?.lastExchange?.response instanceof inlineChatSession_1.ReplyResponse && this._session?.lastExchange?.response.chatResponse) {
                const response = this._session?.lastExchange?.response.chatResponse;
                this._chatService.notifyUserAction({
                    sessionId: response.session.sessionId,
                    requestId: response.requestId,
                    agentId: response.agent?.id,
                    result: response.result,
                    action: {
                        kind: 'inlineChat',
                        action: 'accepted'
                    }
                });
            }
            this._messages.fire(1 /* Message.ACCEPT_SESSION */);
        }
        acceptHunk() {
            return this._strategy?.acceptHunk();
        }
        discardHunk() {
            return this._strategy?.discardHunk();
        }
        async cancelSession() {
            let result;
            if (this._session) {
                const diff = await this._editorWorkerService.computeDiff(this._session.textModel0.uri, this._session.textModelN.uri, { ignoreTrimWhitespace: false, maxComputationTimeMs: 5000, computeMoves: false }, 'advanced');
                result = this._session.asChangedText(diff?.changes ?? []);
                if (this._session.lastExchange?.response instanceof inlineChatSession_1.ReplyResponse && this._session?.lastExchange?.response.chatResponse) {
                    const response = this._session?.lastExchange?.response.chatResponse;
                    this._chatService.notifyUserAction({
                        sessionId: response.session.sessionId,
                        requestId: response.requestId,
                        agentId: response.agent?.id,
                        result: response.result,
                        action: {
                            kind: 'inlineChat',
                            action: 'discarded'
                        }
                    });
                }
            }
            this._messages.fire(2 /* Message.CANCEL_SESSION */);
            return result;
        }
        finishExistingSession() {
            if (this._session) {
                if (this._session.editMode === "preview" /* EditMode.Preview */) {
                    this._log('finishing existing session, using CANCEL', this._session.editMode);
                    this.cancelSession();
                }
                else {
                    this._log('finishing existing session, using APPLY', this._session.editMode);
                    this.acceptSession();
                }
            }
        }
        unstashLastSession() {
            const result = this._stashedSession.value?.unstash();
            if (result) {
                this._inlineChatSavingService.markChanged(result);
            }
            return result;
        }
        joinCurrentRun() {
            return this._currentRun;
        }
    };
    exports.InlineChatController = InlineChatController;
    exports.InlineChatController = InlineChatController = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, inlineChatSessionService_1.IInlineChatSessionService),
        __param(3, inlineChatSavingService_1.IInlineChatSavingService),
        __param(4, editorWorker_1.IEditorWorkerService),
        __param(5, log_1.ILogService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, dialogs_1.IDialogService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, chatAgents_1.IChatAgentService),
        __param(10, chatService_1.IChatService),
        __param(11, commands_1.ICommandService),
        __param(12, languageFeatures_1.ILanguageFeaturesService),
        __param(13, chat_1.IChatWidgetService)
    ], InlineChatController);
    async function showMessageResponse(accessor, query, response) {
        const chatService = accessor.get(chatService_1.IChatService);
        const chatAgentService = accessor.get(chatAgents_1.IChatAgentService);
        const agent = chatAgentService.getActivatedAgents().find(agent => agent.locations.includes(chatAgents_1.ChatAgentLocation.Panel) && agent.isDefault);
        if (!agent) {
            return;
        }
        const widget = await (0, chat_1.showChatView)(accessor.get(viewsService_1.IViewsService));
        if (widget && widget.viewModel) {
            chatService.addCompleteRequest(widget.viewModel.sessionId, query, undefined, 0, { message: response });
            widget.focusLastMessage();
        }
    }
    async function sendRequest(accessor, query) {
        const chatAgentService = accessor.get(chatAgents_1.IChatAgentService);
        const agent = chatAgentService.getActivatedAgents().find(agent => agent.locations.includes(chatAgents_1.ChatAgentLocation.Panel) && agent.isDefault);
        if (!agent) {
            return;
        }
        const widget = await (0, chat_1.showChatView)(accessor.get(viewsService_1.IViewsService));
        if (!widget) {
            return;
        }
        widget.focusInput();
        widget.acceptInput(query);
    }
    function asInlineChatResponseType(response) {
        let result;
        for (const item of response.value) {
            let thisType;
            switch (item.kind) {
                case 'textEditGroup':
                    thisType = "onlyEdits" /* InlineChatResponseTypes.OnlyEdits */;
                    break;
                case 'markdownContent':
                default:
                    thisType = "onlyMessages" /* InlineChatResponseTypes.OnlyMessages */;
                    break;
            }
            if (result === undefined) {
                result = thisType;
            }
            else if (result !== thisType) {
                return "mixed" /* InlineChatResponseTypes.Mixed */;
            }
        }
        return result ?? "empty" /* InlineChatResponseTypes.Empty */;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdENvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2Jyb3dzZXIvaW5saW5lQ2hhdENvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbURoRyxJQUFrQixLQVNqQjtJQVRELFdBQWtCLEtBQUs7UUFDdEIsMENBQWlDLENBQUE7UUFDakMsNEJBQW1CLENBQUE7UUFDbkIsMENBQWlDLENBQUE7UUFDakMsc0NBQTZCLENBQUE7UUFDN0Isd0NBQStCLENBQUE7UUFDL0Isd0JBQWUsQ0FBQTtRQUNmLDBCQUFpQixDQUFBO1FBQ2pCLHdCQUFlLENBQUE7SUFDaEIsQ0FBQyxFQVRpQixLQUFLLHFCQUFMLEtBQUssUUFTdEI7SUFFRCxJQUFXLE9BUVY7SUFSRCxXQUFXLE9BQU87UUFDakIscUNBQVEsQ0FBQTtRQUNSLHlEQUF1QixDQUFBO1FBQ3ZCLHlEQUF1QixDQUFBO1FBQ3ZCLHVEQUFzQixDQUFBO1FBQ3RCLHlEQUF1QixDQUFBO1FBQ3ZCLHNEQUFxQixDQUFBO1FBQ3JCLHNEQUFxQixDQUFBO0lBQ3RCLENBQUMsRUFSVSxPQUFPLEtBQVAsT0FBTyxRQVFqQjtJQUVELE1BQXNCLG9CQUFvQjtRQVV6QyxNQUFNLENBQUMsMEJBQTBCLENBQUMsT0FBWTtZQUM3QyxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxHQUF5QixPQUFPLENBQUM7WUFDdkgsSUFDQyxPQUFPLE9BQU8sS0FBSyxXQUFXLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUTttQkFDMUQsT0FBTyxRQUFRLEtBQUssV0FBVyxJQUFJLE9BQU8sUUFBUSxL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