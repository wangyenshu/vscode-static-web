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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/browser/editorBrowser", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "vs/workbench/common/contextkeys", "vs/workbench/common/theme", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/voiceChat", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/speech/common/speechService", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalContribExports", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/services/views/common/viewsService", "vs/css!./media/voiceChatActions"], function (require, exports, async_1, cancellation_1, codicons_1, event_1, lifecycle_1, types_1, editorBrowser_1, editorContextKeys_1, nls_1, actions_1, commands_1, configuration_1, configurationRegistry_1, contextkey_1, instantiation_1, keybinding_1, platform_1, colorRegistry_1, iconRegistry_1, theme_1, themeService_1, contextkeys_1, theme_2, accessibilityConfiguration_1, chatActions_1, chat_1, chatAgents_1, chatContextKeys_1, chatService_1, voiceChat_1, extensions_1, inlineChatController_1, inlineChat_1, notebookContextKeys_1, speechService_1, terminal_1, terminalContribExports_1, editorService_1, host_1, layoutService_1, statusbar_1, viewsService_1) {
    "use strict";
    var VoiceChatSessions_1, KeywordActivationContribution_1, KeywordActivationStatusEntry_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeywordActivationContribution = exports.StopListeningAndSubmitAction = exports.StopListeningInTerminalChatAction = exports.StopListeningInQuickChatAction = exports.StopListeningInChatEditorAction = exports.StopListeningInChatViewAction = exports.StopListeningAction = exports.InstallVoiceChatAction = exports.StartVoiceChatAction = exports.QuickVoiceChatAction = exports.InlineVoiceChatAction = exports.HoldToVoiceChatInChatViewAction = exports.VoiceChatInChatViewAction = exports.VOICE_KEY_HOLD_THRESHOLD = void 0;
    const CONTEXT_VOICE_CHAT_GETTING_READY = new contextkey_1.RawContextKey('voiceChatGettingReady', false, { type: 'boolean', description: (0, nls_1.localize)('voiceChatGettingReady', "True when getting ready for receiving voice input from the microphone for voice chat.") });
    const CONTEXT_VOICE_CHAT_IN_PROGRESS = new contextkey_1.RawContextKey('voiceChatInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('voiceChatInProgress', "True when voice recording from microphone is in progress for voice chat.") });
    const CONTEXT_QUICK_VOICE_CHAT_IN_PROGRESS = new contextkey_1.RawContextKey('quickVoiceChatInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('quickVoiceChatInProgress', "True when voice recording from microphone is in progress for quick chat.") });
    const CONTEXT_INLINE_VOICE_CHAT_IN_PROGRESS = new contextkey_1.RawContextKey('inlineVoiceChatInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('inlineVoiceChatInProgress', "True when voice recording from microphone is in progress for inline chat.") });
    const CONTEXT_TERMINAL_VOICE_CHAT_IN_PROGRESS = new contextkey_1.RawContextKey('terminalVoiceChatInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('terminalVoiceChatInProgress', "True when voice recording from microphone is in progress for terminal chat.") });
    const CONTEXT_VOICE_CHAT_IN_VIEW_IN_PROGRESS = new contextkey_1.RawContextKey('voiceChatInViewInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('voiceChatInViewInProgress', "True when voice recording from microphone is in progress in the chat view.") });
    const CONTEXT_VOICE_CHAT_IN_EDITOR_IN_PROGRESS = new contextkey_1.RawContextKey('voiceChatInEditorInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('voiceChatInEditorInProgress', "True when voice recording from microphone is in progress in the chat editor.") });
    const CanVoiceChat = contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_CHAT_ENABLED, speechService_1.HasSpeechProvider);
    const FocusInChatInput = (0, types_1.assertIsDefined)(contextkey_1.ContextKeyExpr.or(inlineChat_1.CTX_INLINE_CHAT_FOCUSED, chatContextKeys_1.CONTEXT_IN_CHAT_INPUT));
    class VoiceChatSessionControllerFactory {
        static async create(accessor, context) {
            const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const quickChatService = accessor.get(chat_1.IQuickChatService);
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const terminalService = accessor.get(terminal_1.ITerminalService);
            // Currently Focused Context
            if (context === 'focused') {
                // Try with the terminal chat
                const activeInstance = terminalService.activeInstance;
                if (activeInstance) {
                    const terminalChat = terminalContribExports_1.TerminalChatController.activeChatWidget || terminalContribExports_1.TerminalChatController.get(activeInstance);
                    if (terminalChat?.hasFocus()) {
                        return VoiceChatSessionControllerFactory.doCreateForTerminalChat(terminalChat);
                    }
                }
                // Try with the chat widget service, which currently
                // only supports the chat view and quick chat
                // https://github.com/microsoft/vscode/issues/191191
                const chatInput = chatWidgetService.lastFocusedWidget;
                if (chatInput?.hasInputFocus()) {
                    // Unfortunately there does not seem to be a better way
                    // to figure out if the chat widget is in a part or picker
                    if (layoutService.hasFocus("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) ||
                        layoutService.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */) ||
                        layoutService.hasFocus("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)) {
                        return VoiceChatSessionControllerFactory.doCreateForChatView(chatInput, viewsService);
                    }
                    if (layoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */)) {
                        return VoiceChatSessionControllerFactory.doCreateForChatEditor(chatInput, viewsService);
                    }
                    return VoiceChatSessionControllerFactory.doCreateForQuickChat(chatInput, quickChatService);
                }
                // Try with the inline chat
                const activeCodeEditor = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
                if (activeCodeEditor) {
                    const inlineChat = inlineChatController_1.InlineChatController.get(activeCodeEditor);
                    if (inlineChat?.hasFocus()) {
                        return VoiceChatSessionControllerFactory.doCreateForInlineChat(inlineChat);
                    }
                }
            }
            // View Chat
            if (context === 'view' || context === 'focused' /* fallback in case 'focused' was not successful */) {
                const chatView = await VoiceChatSessionControllerFactory.revealChatView(accessor);
                if (chatView) {
                    return VoiceChatSessionControllerFactory.doCreateForChatView(chatView, viewsService);
                }
            }
            // Inline Chat
            if (context === 'inline') {
                const activeCodeEditor = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
                if (activeCodeEditor) {
                    const inlineChat = inlineChatController_1.InlineChatController.get(activeCodeEditor);
                    if (inlineChat) {
                        return VoiceChatSessionControllerFactory.doCreateForInlineChat(inlineChat);
                    }
                }
            }
            // Terminal Chat
            if (context === 'terminal') {
                const activeInstance = terminalService.activeInstance;
                if (activeInstance) {
                    const terminalChat = terminalContribExports_1.TerminalChatController.activeChatWidget || terminalContribExports_1.TerminalChatController.get(activeInstance);
                    if (terminalChat) {
                        return VoiceChatSessionControllerFactory.doCreateForTerminalChat(terminalChat);
                    }
                }
            }
            // Quick Chat
            if (context === 'quick') {
                quickChatService.open();
                const quickChat = chatWidgetService.lastFocusedWidget;
                if (quickChat) {
                    return VoiceChatSessionControllerFactory.doCreateForQuickChat(quickChat, quickChatService);
                }
            }
            return undefined;
        }
        static async revealChatView(accessor) {
            const chatService = accessor.get(chatService_1.IChatService);
            const viewsService = accessor.get(viewsService_1.IViewsService);
            if (chatService.isEnabled(chatAgents_1.ChatAgentLocation.Panel)) {
                return (0, chat_1.showChatView)(viewsService);
            }
            return undefined;
        }
        static doCreateForChatView(chatView, viewsService) {
            return VoiceChatSessionControllerFactory.doCreateForChatViewOrEditor('view', chatView, viewsService);
        }
        static doCreateForChatEditor(chatView, viewsService) {
            return VoiceChatSessionControllerFactory.doCreateForChatViewOrEditor('editor', chatView, viewsService);
        }
        static doCreateForChatViewOrEditor(context, chatView, viewsService) {
            return {
                context,
                onDidAcceptInput: chatView.onDidAcceptInput,
                // TODO@bpasero cancellation needs to work better for chat editors that are not view bound
                onDidCancelInput: event_1.Event.filter(viewsService.onDidChangeViewVisibility, e => e.id === chat_1.CHAT_VIEW_ID),
                focusInput: () => chatView.focusInput(),
                acceptInput: () => chatView.acceptInput(),
                updateInput: text => chatView.setInput(text),
                getInput: () => chatView.getInput(),
                setInputPlaceholder: text => chatView.setInputPlaceholder(text),
                clearInputPlaceholder: () => chatView.resetInputPlaceholder()
            };
        }
        static doCreateForQuickChat(quickChat, quickChatService) {
            return {
                context: 'quick',
                onDidAcceptInput: quickChat.onDidAcceptInput,
                onDidCancelInput: quickChatService.onDidClose,
                focusInput: () => quickChat.focusInput(),
                acceptInput: () => quickChat.acceptInput(),
                updateInput: text => quickChat.setInput(text),
                getInput: () => quickChat.getInput(),
                setInputPlaceholder: text => quickChat.setInputPlaceholder(text),
                clearInputPlaceholder: () => quickChat.resetInputPlaceholder()
            };
        }
        static doCreateForInlineChat(inlineChat) {
            const inlineChatSession = inlineChat.joinCurrentRun() ?? inlineChat.run();
            return {
                context: 'inline',
                onDidAcceptInput: inlineChat.onDidAcceptInput,
                onDidCancelInput: event_1.Event.any(inlineChat.onDidCancelInput, event_1.Event.fromPromise(inlineChatSession)),
                focusInput: () => inlineChat.focus(),
                acceptInput: () => inlineChat.acceptInput(),
                updateInput: text => inlineChat.updateInput(text, false),
                getInput: () => inlineChat.getInput(),
                setInputPlaceholder: text => inlineChat.setPlaceholder(text),
                clearInputPlaceholder: () => inlineChat.resetPlaceholder()
            };
        }
        static doCreateForTerminalChat(terminalChat) {
            return {
                context: 'terminal',
                onDidAcceptInput: terminalChat.onDidAcceptInput,
                onDidCancelInput: terminalChat.onDidCancelInput,
                focusInput: () => terminalChat.focus(),
                acceptInput: () => terminalChat.acceptInput(),
                updateInput: text => terminalChat.updateInput(text, false),
                getInput: () => terminalChat.getInput(),
                setInputPlaceholder: text => terminalChat.setPlaceholder(text),
                clearInputPlaceholder: () => terminalChat.resetPlaceholder()
            };
        }
    }
    let VoiceChatSessions = class VoiceChatSessions {
        static { VoiceChatSessions_1 = this; }
        static { this.instance = undefined; }
        static getInstance(instantiationService) {
            if (!VoiceChatSessions_1.instance) {
                VoiceChatSessions_1.instance = instantiationService.createInstance(VoiceChatSessions_1);
            }
            return VoiceChatSessions_1.instance;
        }
        constructor(contextKeyService, voiceChatService, configurationService) {
            this.contextKeyService = contextKeyService;
            this.voiceChatService = voiceChatService;
            this.configurationService = configurationService;
            this.voiceChatInProgressKey = CONTEXT_VOICE_CHAT_IN_PROGRESS.bindTo(this.contextKeyService);
            this.voiceChatGettingReadyKey = CONTEXT_VOICE_CHAT_GETTING_READY.bindTo(this.contextKeyService);
            this.quickVoiceChatInProgressKey = CONTEXT_QUICK_VOICE_CHAT_IN_PROGRESS.bindTo(this.contextKeyService);
            this.inlineVoiceChatInProgressKey = CONTEXT_INLINE_VOICE_CHAT_IN_PROGRESS.bindTo(this.contextKeyService);
            this.terminalVoiceChatInProgressKey = CONTEXT_TERMINAL_VOICE_CHAT_IN_PROGRESS.bindTo(this.contextKeyService);
            this.voiceChatInViewInProgressKey = CONTEXT_VOICE_CHAT_IN_VIEW_IN_PROGRESS.bindTo(this.contextKeyService);
            this.voiceChatInEditorInProgressKey = CONTEXT_VOICE_CHAT_IN_EDITOR_IN_PROGRESS.bindTo(this.contextKeyService);
            this.currentVoiceChatSession = undefined;
            this.voiceChatSessionIds = 0;
        }
        async start(controller, context) {
            this.stop();
            let disableTimeout = false;
            const sessionId = ++this.voiceChatSessionIds;
            const session = this.currentVoiceChatSession = {
                id: sessionId,
                controller,
                disposables: new lifecycle_1.DisposableStore(),
                setTimeoutDisabled: (disabled) => { disableTimeout = disabled; },
                accept: () => session.controller.acceptInput(),
                stop: () => this.stop(sessionId, controller.context)
            };
            const cts = new cancellation_1.CancellationTokenSource();
            session.disposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            session.disposables.add(controller.onDidAcceptInput(() => this.stop(sessionId, controller.context)));
            session.disposables.add(controller.onDidCancelInput(() => this.stop(sessionId, controller.context)));
            controller.focusInput();
            this.voiceChatGettingReadyKey.set(true);
            const voiceChatSession = await this.voiceChatService.createVoiceChatSession(cts.token, { usesAgents: controller.context !== 'inline', model: context?.widget?.viewModel?.model });
            let inputValue = controller.getInput();
            let voiceChatTimeout = this.configurationService.getValue("accessibility.voice.speechTimeout" /* AccessibilityVoiceSettingId.SpeechTimeout */);
            if (!(0, types_1.isNumber)(voiceChatTimeout) || voiceChatTimeout < 0) {
                voiceChatTimeout = accessibilityConfiguration_1.SpeechTimeoutDefault;
            }
            const acceptTranscriptionScheduler = session.disposables.add(new async_1.RunOnceScheduler(() => session.controller.acceptInput(), voiceChatTimeout));
            session.disposables.add(voiceChatSession.onDidChange(({ status, text, waitingForInput }) => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                switch (status) {
                    case speechService_1.SpeechToTextStatus.Started:
                        this.onDidSpeechToTextSessionStart(controller, session.disposables);
                        break;
                    case speechService_1.SpeechToTextStatus.Recognizing:
                        if (text) {
                            session.controller.updateInput(inputValue ? [inputValue, text].join(' ') : text);
                            if (voiceChatTimeout > 0 && context?.voice?.disableTimeout !== true && !disableTimeout) {
                                acceptTranscriptionScheduler.cancel();
                            }
                        }
                        break;
                    case speechService_1.SpeechToTextStatus.Recognized:
                        if (text) {
                            inputValue = inputValue ? [inputValue, text].join(' ') : text;
                            session.controller.updateInput(inputValue);
                            if (voiceChatTimeout > 0 && context?.voice?.disableTimeout !== true && !waitingForInput && !disableTimeout) {
                                acceptTranscriptionScheduler.schedule();
                            }
                        }
                        break;
                    case speechService_1.SpeechToTextStatus.Stopped:
                        this.stop(session.id, controller.context);
                        break;
                }
            }));
            return session;
        }
        onDidSpeechToTextSessionStart(controller, disposables) {
            this.voiceChatGettingReadyKey.set(false);
            this.voiceChatInProgressKey.set(true);
            switch (controller.context) {
                case 'inline':
                    this.inlineVoiceChatInProgressKey.set(true);
                    break;
                case 'terminal':
                    this.terminalVoiceChatInProgressKey.set(true);
                    break;
                case 'quick':
                    this.quickVoiceChatInProgressKey.set(true);
                    break;
                case 'view':
                    this.voiceChatInViewInProgressKey.set(true);
                    break;
                case 'editor':
                    this.voiceChatInEditorInProgressKey.set(true);
                    break;
            }
            let dotCount = 0;
            const updatePlaceholder = () => {
                dotCount = (dotCount + 1) % 4;
                controller.setInputPlaceholder(`${(0, nls_1.localize)('listening', "I'm listening")}${'.'.repeat(dotCount)}`);
                placeholderScheduler.schedule();
            };
            const placeholderScheduler = disposables.add(new async_1.RunOnceScheduler(updatePlaceholder, 500));
            updatePlaceholder();
        }
        stop(voiceChatSessionId = this.voiceChatSessionIds, context) {
            if (!this.currentVoiceChatSession ||
                this.voiceChatSessionIds !== voiceChatSessionId ||
                (context && this.currentVoiceChatSession.controller.context !== context)) {
                return;
            }
            this.currentVoiceChatSession.controller.clearInputPlaceholder();
            this.currentVoiceChatSession.disposables.dispose();
            this.currentVoiceChatSession = undefined;
            this.voiceChatGettingReadyKey.set(false);
            this.voiceChatInProgressKey.set(false);
            this.quickVoiceChatInProgressKey.set(false);
            this.inlineVoiceChatInProgressKey.set(false);
            this.terminalVoiceChatInProgressKey.set(false);
            this.voiceChatInViewInProgressKey.set(false);
            this.voiceChatInEditorInProgressKey.set(false);
        }
        accept(voiceChatSessionId = this.voiceChatSessionIds) {
            if (!this.currentVoiceChatSession ||
                this.voiceChatSessionIds !== voiceChatSessionId) {
                return;
            }
            this.currentVoiceChatSession.controller.acceptInput();
        }
    };
    VoiceChatSessions = VoiceChatSessions_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, voiceChat_1.IVoiceChatService),
        __param(2, configuration_1.IConfigurationService)
    ], VoiceChatSessions);
    exports.VOICE_KEY_HOLD_THRESHOLD = 500;
    async function startVoiceChatWithHoldMode(id, accessor, target, context) {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const holdMode = keybindingService.enableKeybindingHoldMode(id);
        const controller = await VoiceChatSessionControllerFactory.create(accessor, target);
        if (!controller) {
            return;
        }
        const session = await VoiceChatSessions.getInstance(instantiationService).start(controller, context);
        let acceptVoice = false;
        const handle = (0, async_1.disposableTimeout)(() => {
            acceptVoice = true;
            session?.setTimeoutDisabled(true); // disable accept on timeout when hold mode runs for VOICE_KEY_HOLD_THRESHOLD
        }, exports.VOICE_KEY_HOLD_THRESHOLD);
        await holdMode;
        handle.dispose();
        if (acceptVoice) {
            session.accept();
        }
    }
    class VoiceChatWithHoldModeAction extends actions_1.Action2 {
        constructor(desc, target) {
            super(desc);
            this.target = target;
        }
        run(accessor, context) {
            return startVoiceChatWithHoldMode(this.desc.id, accessor, this.target, context);
        }
    }
    class VoiceChatInChatViewAction extends VoiceChatWithHoldModeAction {
        static { this.ID = 'workbench.action.chat.voiceChatInChatView'; }
        constructor() {
            super({
                id: VoiceChatInChatViewAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.voiceChatInView.label', "Voice Chat in View"),
                category: chatActions_1.CHAT_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate()),
                f1: true
            }, 'view');
        }
    }
    exports.VoiceChatInChatViewAction = VoiceChatInChatViewAction;
    class HoldToVoiceChatInChatViewAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.holdToVoiceChatInChatView'; }
        constructor() {
            super({
                id: HoldToVoiceChatInChatViewAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.holdToVoiceChatInChatView.label', "Hold to Voice Chat in View"),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(CanVoiceChat, FocusInChatInput.negate(), // when already in chat input, disable this action and prefer to start voice chat directly
                    editorContextKeys_1.EditorContextKeys.focus.negate(), // do not steal the inline-chat keybinding
                    notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED.negate() // do not steal the notebook keybinding
                    ),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */
                }
            });
        }
        async run(accessor, context) {
            // The intent of this action is to provide 2 modes to align with what `Ctrlcmd+I` in inline chat:
            // - if the user press and holds, we start voice chat in the chat view
            // - if the user press and releases quickly enough, we just open the chat view without voice chat
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const holdMode = keybindingService.enableKeybindingHoldMode(HoldToVoiceChatInChatViewAction.ID);
            let session;
            const handle = (0, async_1.disposableTimeout)(async () => {
                const controller = await VoiceChatSessionControllerFactory.create(accessor, 'view');
                if (controller) {
                    session = await VoiceChatSessions.getInstance(instantiationService).start(controller, context);
                    session.setTimeoutDisabled(true);
                }
            }, exports.VOICE_KEY_HOLD_THRESHOLD);
            (await VoiceChatSessionControllerFactory.revealChatView(accessor))?.focusInput();
            await holdMode;
            handle.dispose();
            if (session) {
                session.accept();
            }
        }
    }
    exports.HoldToVoiceChatInChatViewAction = HoldToVoiceChatInChatViewAction;
    class InlineVoiceChatAction extends VoiceChatWithHoldModeAction {
        static { this.ID = 'workbench.action.chat.inlineVoiceChat'; }
        constructor() {
            super({
                id: InlineVoiceChatAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.inlineVoiceChat', "Inline Voice Chat"),
                category: chatActions_1.CHAT_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, contextkeys_1.ActiveEditorContext, chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate()),
                f1: true
            }, 'inline');
        }
    }
    exports.InlineVoiceChatAction = InlineVoiceChatAction;
    class QuickVoiceChatAction extends VoiceChatWithHoldModeAction {
        static { this.ID = 'workbench.action.chat.quickVoiceChat'; }
        constructor() {
            super({
                id: QuickVoiceChatAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.quickVoiceChat.label', "Quick Voice Chat"),
                category: chatActions_1.CHAT_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate()),
                f1: true
            }, 'quick');
        }
    }
    exports.QuickVoiceChatAction = QuickVoiceChatAction;
    class StartVoiceChatAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.startVoiceChat'; }
        constructor() {
            super({
                id: StartVoiceChatAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.startVoiceChat.label', "Start Voice Chat"),
                category: chatActions_1.CHAT_CATEGORY,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(FocusInChatInput, // scope this action to chat input fields only
                    editorContextKeys_1.EditorContextKeys.focus.negate(), // do not steal the inline-chat keybinding
                    notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED.negate(), // do not steal the notebook keybinding
                    CONTEXT_VOICE_CHAT_IN_VIEW_IN_PROGRESS.negate(), CONTEXT_QUICK_VOICE_CHAT_IN_PROGRESS.negate(), CONTEXT_VOICE_CHAT_IN_EDITOR_IN_PROGRESS.negate(), CONTEXT_INLINE_VOICE_CHAT_IN_PROGRESS.negate(), CONTEXT_TERMINAL_VOICE_CHAT_IN_PROGRESS.negate()),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */
                },
                icon: codicons_1.Codicon.mic,
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, CONTEXT_VOICE_CHAT_GETTING_READY.negate(), chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate(), inlineChat_1.CTX_INLINE_CHAT_HAS_ACTIVE_REQUEST.negate(), terminalContribExports_1.TerminalChatContextKeys.requestActive.negate()),
                menu: [{
                        id: actions_1.MenuId.ChatExecute,
                        when: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, CONTEXT_VOICE_CHAT_IN_VIEW_IN_PROGRESS.negate(), CONTEXT_QUICK_VOICE_CHAT_IN_PROGRESS.negate(), CONTEXT_VOICE_CHAT_IN_EDITOR_IN_PROGRESS.negate()),
                        group: 'navigation',
                        order: -1
                    }, {
                        id: actions_1.MenuId.for('terminalChatInput'),
                        when: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, CONTEXT_TERMINAL_VOICE_CHAT_IN_PROGRESS.negate()),
                        group: 'navigation',
                        order: -1
                    }]
            });
        }
        async run(accessor, context) {
            const widget = context?.widget;
            if (widget) {
                // if we already get a context when the action is executed
                // from a toolbar within the chat widget, then make sure
                // to move focus into the input field so that the controller
                // is properly retrieved
                // TODO@bpasero this will actually not work if the button
                // is clicked from the inline editor while focus is in a
                // chat input field in a view or picker
                widget.focusInput();
            }
            return startVoiceChatWithHoldMode(this.desc.id, accessor, 'focused', context);
        }
    }
    exports.StartVoiceChatAction = StartVoiceChatAction;
    const InstallingSpeechProvider = new contextkey_1.RawContextKey('installingSpeechProvider', false, true);
    class InstallVoiceChatAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.installVoiceChat'; }
        static { this.SPEECH_EXTENSION_ID = 'ms-vscode.vscode-speech'; }
        constructor() {
            super({
                id: InstallVoiceChatAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.startVoiceChat.label', "Start Voice Chat"),
                category: chatActions_1.CHAT_CATEGORY,
                icon: codicons_1.Codicon.mic,
                precondition: InstallingSpeechProvider.negate(),
                menu: [{
                        id: actions_1.MenuId.ChatExecute,
                        when: speechService_1.HasSpeechProvider.negate(),
                        group: 'navigation',
                        order: -1
                    }, {
                        id: actions_1.MenuId.for('terminalChatInput'),
                        when: speechService_1.HasSpeechProvider.negate(),
                        group: 'navigation',
                        order: -1
                    }]
            });
        }
        async run(accessor) {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const extensionsWorkbenchService = accessor.get(extensions_1.IExtensionsWorkbenchService);
            try {
                InstallingSpeechProvider.bindTo(contextKeyService).set(true);
                await extensionsWorkbenchService.install(InstallVoiceChatAction.SPEECH_EXTENSION_ID, {
                    justification: (0, nls_1.localize)('confirmInstallDetail', "Microphone support requires this extension."),
                    enable: true
                }, 15 /* ProgressLocation.Notification */);
            }
            finally {
                InstallingSpeechProvider.bindTo(contextKeyService).set(false);
            }
        }
    }
    exports.InstallVoiceChatAction = InstallVoiceChatAction;
    class BaseStopListeningAction extends actions_1.Action2 {
        constructor(desc, target, context, menu) {
            super({
                ...desc,
                title: (0, nls_1.localize2)('workbench.action.chat.stopListening.label', "Stop Listening"),
                category: chatActions_1.CHAT_CATEGORY,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 100,
                    primary: 9 /* KeyCode.Escape */
                },
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, context),
                menu: menu ? [{
                        id: menu,
                        when: contextkey_1.ContextKeyExpr.and(CanVoiceChat, context),
                        group: 'navigation',
                        order: -1
                    }] : undefined
            });
            this.target = target;
        }
        async run(accessor, context) {
            VoiceChatSessions.getInstance(accessor.get(instantiation_1.IInstantiationService)).stop(undefined, this.target);
        }
    }
    class StopListeningAction extends BaseStopListeningAction {
        static { this.ID = 'workbench.action.chat.stopListening'; }
        constructor() {
            super({ id: StopListeningAction.ID, f1: true }, undefined, CONTEXT_VOICE_CHAT_IN_PROGRESS, undefined);
        }
    }
    exports.StopListeningAction = StopListeningAction;
    class StopListeningInChatViewAction extends BaseStopListeningAction {
        static { this.ID = 'workbench.action.chat.stopListeningInChatView'; }
        constructor() {
            super({ id: StopListeningInChatViewAction.ID, icon: iconRegistry_1.spinningLoading }, 'view', CONTEXT_VOICE_CHAT_IN_VIEW_IN_PROGRESS, actions_1.MenuId.ChatExecute);
        }
    }
    exports.StopListeningInChatViewAction = StopListeningInChatViewAction;
    class StopListeningInChatEditorAction extends BaseStopListeningAction {
        static { this.ID = 'workbench.action.chat.stopListeningInChatEditor'; }
        constructor() {
            super({ id: StopListeningInChatEditorAction.ID, icon: iconRegistry_1.spinningLoading }, 'editor', CONTEXT_VOICE_CHAT_IN_EDITOR_IN_PROGRESS, actions_1.MenuId.ChatExecute);
        }
    }
    exports.StopListeningInChatEditorAction = StopListeningInChatEditorAction;
    class StopListeningInQuickChatAction extends BaseStopListeningAction {
        static { this.ID = 'workbench.action.chat.stopListeningInQuickChat'; }
        constructor() {
            super({ id: StopListeningInQuickChatAction.ID, icon: iconRegistry_1.spinningLoading }, 'quick', CONTEXT_QUICK_VOICE_CHAT_IN_PROGRESS, actions_1.MenuId.ChatExecute);
        }
    }
    exports.StopListeningInQuickChatAction = StopListeningInQuickChatAction;
    class StopListeningInTerminalChatAction extends BaseStopListeningAction {
        static { this.ID = 'workbench.action.chat.stopListeningInTerminalChat'; }
        constructor() {
            super({ id: StopListeningInTerminalChatAction.ID, icon: iconRegistry_1.spinningLoading }, 'terminal', CONTEXT_TERMINAL_VOICE_CHAT_IN_PROGRESS, actions_1.MenuId.for('terminalChatInput'));
        }
    }
    exports.StopListeningInTerminalChatAction = StopListeningInTerminalChatAction;
    class StopListeningAndSubmitAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.stopListeningAndSubmit'; }
        constructor() {
            super({
                id: StopListeningAndSubmitAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.stopListeningAndSubmit.label', "Stop Listening and Submit"),
                category: chatActions_1.CHAT_CATEGORY,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: FocusInChatInput,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */
                },
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, CONTEXT_VOICE_CHAT_IN_PROGRESS)
            });
        }
        run(accessor) {
            VoiceChatSessions.getInstance(accessor.get(instantiation_1.IInstantiationService)).accept();
        }
    }
    exports.StopListeningAndSubmitAction = StopListeningAndSubmitAction;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        let activeRecordingColor;
        let activeRecordingDimmedColor;
        if (theme.type === theme_1.ColorScheme.LIGHT || theme.type === theme_1.ColorScheme.DARK) {
            activeRecordingColor = theme.getColor(theme_2.ACTIVITY_BAR_BADGE_BACKGROUND) ?? theme.getColor(colorRegistry_1.focusBorder);
            activeRecordingDimmedColor = activeRecordingColor?.transparent(0.38);
        }
        else {
            activeRecordingColor = theme.getColor(colorRegistry_1.contrastBorder);
            activeRecordingDimmedColor = theme.getColor(colorRegistry_1.contrastBorder);
        }
        // Show a "microphone" icon when recording is in progress that glows via outline.
        collector.addRule(`
		.monaco-workbench:not(.reduce-motion) .interactive-input-part .monaco-action-bar .action-label.codicon-loading.codicon-modifier-spin:not(.disabled) {
			color: ${activeRecordingColor};
			outline: 1px solid ${activeRecordingColor};
			outline-offset: -1px;
			animation: pulseAnimation 1s infinite;
			border-radius: 50%;
		}

		.monaco-workbench:not(.reduce-motion) .interactive-input-part .monaco-action-bar .action-label.codicon-loading.codicon-modifier-spin:not(.disabled)::before {
			position: absolute;
			outline: 1px solid ${activeRecordingColor};
			outline-offset: 2px;
			border-radius: 50%;
			width: 16px;
			height: 16px;
		}

		.monaco-workbench:not(.reduce-motion) .interactive-input-part .monaco-action-bar .action-label.codicon-loading.codicon-modifier-spin:not(.disabled)::after {
			outline: 2px solid ${activeRecordingColor};
			outline-offset: -1px;
			animation: pulseAnimation 1500ms cubic-bezier(0.75, 0, 0.25, 1) infinite;
		}

		.monaco-workbench:not(.reduce-motion) .interactive-input-part .monaco-action-bar .action-label.codicon-loading.codicon-modifier-spin:not(.disabled)::before {
			position: absolute;
			outline: 1px solid ${activeRecordingColor};
			outline-offset: 2px;
			border-radius: 50%;
			width: 16px;
			height: 16px;
		}

		@keyframes pulseAnimation {
			0% {
				outline-width: 2px;
			}
			62% {
				outline-width: 5px;
				outline-color: ${activeRecordingDimmedColor};
			}
			100% {
				outline-width: 2px;
			}
		}
	`);
    });
    function supportsKeywordActivation(configurationService, speechService, chatAgentService) {
        if (!speechService.hasSpeechProvider || !chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel)) {
            return false;
        }
        const value = configurationService.getValue(chatService_1.KEYWORD_ACTIVIATION_SETTING_ID);
        return typeof value === 'string' && value !== KeywordActivationContribution.SETTINGS_VALUE.OFF;
    }
    let KeywordActivationContribution = class KeywordActivationContribution extends lifecycle_1.Disposable {
        static { KeywordActivationContribution_1 = this; }
        static { this.ID = 'workbench.contrib.keywordActivation'; }
        static { this.SETTINGS_VALUE = {
            OFF: 'off',
            INLINE_CHAT: 'inlineChat',
            QUICK_CHAT: 'quickChat',
            VIEW_CHAT: 'chatInView',
            CHAT_IN_CONTEXT: 'chatInContext'
        }; }
        constructor(speechService, configurationService, commandService, instantiationService, editorService, hostService, chatAgentService) {
            super();
            this.speechService = speechService;
            this.configurationService = configurationService;
            this.commandService = commandService;
            this.editorService = editorService;
            this.hostService = hostService;
            this.chatAgentService = chatAgentService;
            this.activeSession = undefined;
            this._register(instantiationService.createInstance(KeywordActivationStatusEntry));
            this.registerListeners();
        }
        registerListeners() {
            this._register(event_1.Event.runAndSubscribe(this.speechService.onDidChangeHasSpeechProvider, () => {
                this.updateConfiguration();
                this.handleKeywordActivation();
            }));
            const onDidAddDefaultAgent = this._register(this.chatAgentService.onDidChangeAgents(() => {
                if (this.chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel)) {
                    this.updateConfiguration();
                    this.handleKeywordActivation();
                    onDidAddDefaultAgent.dispose();
                }
            }));
            this._register(this.speechService.onDidStartSpeechToTextSession(() => this.handleKeywordActivation()));
            this._register(this.speechService.onDidEndSpeechToTextSession(() => this.handleKeywordActivation()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(chatService_1.KEYWORD_ACTIVIATION_SETTING_ID)) {
                    this.handleKeywordActivation();
                }
            }));
        }
        updateConfiguration() {
            if (!this.speechService.hasSpeechProvider || !this.chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel)) {
                return; // these settings require a speech and chat provider
            }
            const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            registry.registerConfiguration({
                ...accessibilityConfiguration_1.accessibilityConfigurationNodeBase,
                properties: {
                    [chatService_1.KEYWORD_ACTIVIATION_SETTING_ID]: {
                        'type': 'string',
                        'enum': [
                            KeywordActivationContribution_1.SETTINGS_VALUE.OFF,
                            KeywordActivationContribution_1.SETTINGS_VALUE.VIEW_CHAT,
                            KeywordActivationContribution_1.SETTINGS_VALUE.QUICK_CHAT,
                            KeywordActivationContribution_1.SETTINGS_VALUE.INLINE_CHAT,
                            KeywordActivationContribution_1.SETTINGS_VALUE.CHAT_IN_CONTEXT
                        ],
                        'enumDescriptions': [
                            (0, nls_1.localize)('voice.keywordActivation.off', "Keyword activation is disabled."),
                            (0, nls_1.localize)('voice.keywordActivation.chatInView', "Keyword activation is enabled and listening for 'Hey Code' to start a voice chat session in the chat view."),
                            (0, nls_1.localize)('voice.keywordActivation.quickChat', "Keyword activation is enabled and listening for 'Hey Code' to start a voice chat session in the quick chat."),
                            (0, nls_1.localize)('voice.keywordActivation.inlineChat', "Keyword activation is enabled and listening for 'Hey Code' to start a voice chat session in the active editor if possible."),
                            (0, nls_1.localize)('voice.keywordActivation.chatInContext', "Keyword activation is enabled and listening for 'Hey Code' to start a voice chat session in the active editor or view depending on keyboard focus.")
                        ],
                        'description': (0, nls_1.localize)('voice.keywordActivation', "Controls whether the keyword phrase 'Hey Code' is recognized to start a voice chat session. Enabling this will start recording from the microphone but the audio is processed locally and never sent to a server."),
                        'default': 'off',
                        'tags': ['accessibility']
                    }
                }
            });
        }
        handleKeywordActivation() {
            const enabled = supportsKeywordActivation(this.configurationService, this.speechService, this.chatAgentService) &&
                !this.speechService.hasActiveSpeechToTextSession;
            if ((enabled && this.activeSession) ||
                (!enabled && !this.activeSession)) {
                return; // already running or stopped
            }
            // Start keyword activation
            if (enabled) {
                this.enableKeywordActivation();
            }
            // Stop keyword activation
            else {
                this.disableKeywordActivation();
            }
        }
        async enableKeywordActivation() {
            const session = this.activeSession = new cancellation_1.CancellationTokenSource();
            const result = await this.speechService.recognizeKeyword(session.token);
            if (session.token.isCancellationRequested || session !== this.activeSession) {
                return; // cancelled
            }
            this.activeSession = undefined;
            if (result === speechService_1.KeywordRecognitionStatus.Recognized) {
                if (this.hostService.hasFocus) {
                    this.commandService.executeCommand(this.getKeywordCommand());
                }
                // Immediately start another keyboard activation session
                // because we cannot assume that the command we execute
                // will trigger a speech recognition session.
                this.handleKeywordActivation();
            }
        }
        getKeywordCommand() {
            const setting = this.configurationService.getValue(chatService_1.KEYWORD_ACTIVIATION_SETTING_ID);
            switch (setting) {
                case KeywordActivationContribution_1.SETTINGS_VALUE.INLINE_CHAT:
                    return InlineVoiceChatAction.ID;
                case KeywordActivationContribution_1.SETTINGS_VALUE.QUICK_CHAT:
                    return QuickVoiceChatAction.ID;
                case KeywordActivationContribution_1.SETTINGS_VALUE.CHAT_IN_CONTEXT: {
                    const activeCodeEditor = (0, editorBrowser_1.getCodeEditor)(this.editorService.activeTextEditorControl);
                    if (activeCodeEditor?.hasWidgetFocus()) {
                        return InlineVoiceChatAction.ID;
                    }
                }
                default:
                    return VoiceChatInChatViewAction.ID;
            }
        }
        disableKeywordActivation() {
            this.activeSession?.dispose(true);
            this.activeSession = undefined;
        }
        dispose() {
            this.activeSession?.dispose();
            super.dispose();
        }
    };
    exports.KeywordActivationContribution = KeywordActivationContribution;
    exports.KeywordActivationContribution = KeywordActivationContribution = KeywordActivationContribution_1 = __decorate([
        __param(0, speechService_1.ISpeechService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, commands_1.ICommandService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, editorService_1.IEditorService),
        __param(5, host_1.IHostService),
        __param(6, chatAgents_1.IChatAgentService)
    ], KeywordActivationContribution);
    let KeywordActivationStatusEntry = class KeywordActivationStatusEntry extends lifecycle_1.Disposable {
        static { KeywordActivationStatusEntry_1 = this; }
        static { this.STATUS_NAME = (0, nls_1.localize)('keywordActivation.status.name', "Voice Keyword Activation"); }
        static { this.STATUS_COMMAND = 'keywordActivation.status.command'; }
        static { this.STATUS_ACTIVE = (0, nls_1.localize)('keywordActivation.status.active', "Listening to 'Hey Code'..."); }
        static { this.STATUS_INACTIVE = (0, nls_1.localize)('keywordActivation.status.inactive', "Waiting for voice chat to end..."); }
        constructor(speechService, statusbarService, commandService, configurationService, chatAgentService) {
            super();
            this.speechService = speechService;
            this.statusbarService = statusbarService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.chatAgentService = chatAgentService;
            this.entry = this._register(new lifecycle_1.MutableDisposable());
            this._register(commands_1.CommandsRegistry.registerCommand(KeywordActivationStatusEntry_1.STATUS_COMMAND, () => this.commandService.executeCommand('workbench.action.openSettings', chatService_1.KEYWORD_ACTIVIATION_SETTING_ID)));
            this.registerListeners();
            this.updateStatusEntry();
        }
        registerListeners() {
            this._register(this.speechService.onDidStartKeywordRecognition(() => this.updateStatusEntry()));
            this._register(this.speechService.onDidEndKeywordRecognition(() => this.updateStatusEntry()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(chatService_1.KEYWORD_ACTIVIATION_SETTING_ID)) {
                    this.updateStatusEntry();
                }
            }));
        }
        updateStatusEntry() {
            const visible = supportsKeywordActivation(this.configurationService, this.speechService, this.chatAgentService);
            if (visible) {
                if (!this.entry.value) {
                    this.createStatusEntry();
                }
                this.updateStatusLabel();
            }
            else {
                this.entry.clear();
            }
        }
        createStatusEntry() {
            this.entry.value = this.statusbarService.addEntry(this.getStatusEntryProperties(), 'status.voiceKeywordActivation', 1 /* StatusbarAlignment.RIGHT */, 103);
        }
        getStatusEntryProperties() {
            return {
                name: KeywordActivationStatusEntry_1.STATUS_NAME,
                text: this.speechService.hasActiveKeywordRecognition ? '$(mic-filled)' : '$(mic)',
                tooltip: this.speechService.hasActiveKeywordRecognition ? KeywordActivationStatusEntry_1.STATUS_ACTIVE : KeywordActivationStatusEntry_1.STATUS_INACTIVE,
                ariaLabel: this.speechService.hasActiveKeywordRecognition ? KeywordActivationStatusEntry_1.STATUS_ACTIVE : KeywordActivationStatusEntry_1.STATUS_INACTIVE,
                command: KeywordActivationStatusEntry_1.STATUS_COMMAND,
                kind: 'prominent',
                showInAllWindows: true
            };
        }
        updateStatusLabel() {
            this.entry.value?.update(this.getStatusEntryProperties());
        }
    };
    KeywordActivationStatusEntry = KeywordActivationStatusEntry_1 = __decorate([
        __param(0, speechService_1.ISpeechService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, commands_1.ICommandService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, chatAgents_1.IChatAgentService)
    ], KeywordActivationStatusEntry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidm9pY2VDaGF0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvZWxlY3Ryb24tc2FuZGJveC9hY3Rpb25zL3ZvaWNlQ2hhdEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFEaEcsTUFBTSxnQ0FBZ0MsR0FBRyxJQUFJLDBCQUFhLENBQVUsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsdUZBQXVGLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbFEsTUFBTSw4QkFBOEIsR0FBRyxJQUFJLDBCQUFhLENBQVUscUJBQXFCLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsMEVBQTBFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFL08sTUFBTSxvQ0FBb0MsR0FBRyxJQUFJLDBCQUFhLENBQVUsMEJBQTBCLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsMEVBQTBFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDL1AsTUFBTSxxQ0FBcUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsMkJBQTJCLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsMkVBQTJFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDblEsTUFBTSx1Q0FBdUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsNkJBQTZC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