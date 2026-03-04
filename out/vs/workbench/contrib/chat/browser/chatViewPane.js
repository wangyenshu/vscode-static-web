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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/hover/browser/hover", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/memento", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParticipantContribTypes", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatService"], function (require, exports, cancellation_1, lifecycle_1, configuration_1, contextkey_1, contextView_1, hover_1, instantiation_1, serviceCollection_1, keybinding_1, log_1, opener_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, viewPane_1, memento_1, theme_1, views_1, chatWidget_1, chatAgents_1, chatParticipantContribTypes_1, chatModel_1, chatService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatViewPane = exports.CHAT_SIDEBAR_PANEL_ID = void 0;
    exports.CHAT_SIDEBAR_PANEL_ID = 'workbench.panel.chatSidebar';
    let ChatViewPane = class ChatViewPane extends viewPane_1.ViewPane {
        get widget() { return this._widget; }
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, hoverService, storageService, chatService, chatAgentService, logService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, hoverService);
            this.storageService = storageService;
            this.chatService = chatService;
            this.chatAgentService = chatAgentService;
            this.logService = logService;
            this.modelDisposables = this._register(new lifecycle_1.DisposableStore());
            this.didProviderRegistrationFail = false;
            this.didUnregisterProvider = false;
            // View state for the ViewPane is currently global per-provider basically, but some other strictly per-model state will require a separate memento.
            this.memento = new memento_1.Memento('interactive-session-view-' + chatParticipantContribTypes_1.CHAT_PROVIDER_ID, this.storageService);
            this.viewState = this.memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            this._register(this.chatAgentService.onDidChangeAgents(() => {
                if (this.chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel)) {
                    if (!this._widget?.viewModel) {
                        const sessionId = this.getSessionId();
                        const model = sessionId ? this.chatService.getOrRestoreSession(sessionId) : undefined;
                        // The widget may be hidden at this point, because welcome views were allowed. Use setVisible to
                        // avoid doing a render while the widget is hidden. This is changing the condition in `shouldShowWelcome`
                        // so it should fire onDidChangeViewWelcomeState.
                        try {
                            this._widget.setVisible(false);
                            this.updateModel(model);
                            this.didProviderRegistrationFail = false;
                            this.didUnregisterProvider = false;
                            this._onDidChangeViewWelcomeState.fire();
                        }
                        finally {
                            this.widget.setVisible(true);
                        }
                    }
                }
                else if (this._widget?.viewModel?.initState === chatModel_1.ChatModelInitState.Initialized) {
                    // Model is initialized, and the default agent disappeared, so show welcome view
                    this.didUnregisterProvider = true;
                    this._onDidChangeViewWelcomeState.fire();
                }
            }));
        }
        getActionsContext() {
            return {
                chatView: this
            };
        }
        updateModel(model, viewState) {
            this.modelDisposables.clear();
            model = model ?? (this.chatService.transferredSessionData?.sessionId
                ? this.chatService.getOrRestoreSession(this.chatService.transferredSessionData.sessionId)
                : this.chatService.startSession(chatAgents_1.ChatAgentLocation.Panel, cancellation_1.CancellationToken.None));
            if (!model) {
                throw new Error('Could not start chat session');
            }
            this._widget.setModel(model, { ...(viewState ?? this.viewState) });
            this.viewState.sessionId = model.sessionId;
        }
        shouldShowWelcome() {
            const noPersistedSessions = !this.chatService.hasSessions();
            return this.didUnregisterProvider || !this._widget?.viewModel && (noPersistedSessions || this.didProviderRegistrationFail);
        }
        getSessionId() {
            let sessionId;
            if (this.chatService.transferredSessionData) {
                sessionId = this.chatService.transferredSessionData.sessionId;
                this.viewState.inputValue = this.chatService.transferredSessionData.inputValue;
            }
            else {
                sessionId = this.viewState.sessionId;
            }
            return sessionId;
        }
        renderBody(parent) {
            try {
                super.renderBody(parent);
                const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.scopedContextKeyService]));
                const locationBasedColors = this.getLocationBasedColors();
                this._widget = this._register(scopedInstantiationService.createInstance(chatWidget_1.ChatWidget, chatAgents_1.ChatAgentLocation.Panel, { viewId: this.id }, { supportsFileReferences: true }, {
                    listForeground: theme_1.SIDE_BAR_FOREGROUND,
                    listBackground: locationBasedColors.background,
                    inputEditorBackground: locationBasedColors.background,
                    resultEditorBackground: colorRegistry_1.editorBackground
                }));
                this._register(this.onDidChangeBodyVisibility(visible => {
                    this._widget.setVisible(visible);
                }));
                this._register(this._widget.onDidClear(() => this.clear()));
                this._widget.render(parent);
                const sessionId = this.getSessionId();
                // Render the welcome view if this session gets disposed at any point,
                // including if the provider registration fails
                const disposeListener = sessionId ? this._register(this.chatService.onDidDisposeSession((e) => {
                    if (e.reason === 'initializationFailed') {
                        this.didProviderRegistrationFail = true;
                        disposeListener?.dispose();
                        this._onDidChangeViewWelcomeState.fire();
                    }
                })) : undefined;
                const model = sessionId ? this.chatService.getOrRestoreSession(sessionId) : undefined;
                this.updateModel(model);
            }
            catch (e) {
                this.logService.error(e);
                throw e;
            }
        }
        acceptInput(query) {
            this._widget.acceptInput(query);
        }
        clear() {
            if (this.widget.viewModel) {
                this.chatService.clearSession(this.widget.viewModel.sessionId);
            }
            this.updateModel(undefined, { ...this.viewState, inputValue: undefined });
        }
        loadSession(sessionId) {
            if (this.widget.viewModel) {
                this.chatService.clearSession(this.widget.viewModel.sessionId);
            }
            const newModel = this.chatService.getOrRestoreSession(sessionId);
            this.updateModel(newModel);
        }
        focusInput() {
            this._widget.focusInput();
        }
        focus() {
            super.focus();
            this._widget.focusInput();
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this._widget.layout(height, width);
        }
        saveState() {
            if (this._widget) {
                // Since input history is per-provider, this is handled by a separate service and not the memento here.
                // TODO multiple chat views will overwrite each other
                this._widget.saveState();
                const widgetViewState = this._widget.getViewState();
                this.viewState.inputValue = widgetViewState.inputValue;
                this.viewState.inputState = widgetViewState.inputState;
                this.memento.saveMemento();
            }
            super.saveState();
        }
    };
    exports.ChatViewPane = ChatViewPane;
    exports.ChatViewPane = ChatViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, hover_1.IHoverService),
        __param(11, storage_1.IStorageService),
        __param(12, chatService_1.IChatService),
        __param(13, chatAgents_1.IChatAgentService),
        __param(14, log_1.ILogService)
    ], ChatViewPane);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFZpZXdQYW5lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRWaWV3UGFuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQ25GLFFBQUEscUJBQXFCLEdBQUcsNkJBQTZCLENBQUM7SUFDNUQsSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBYSxTQUFRLG1CQUFRO1FBRXpDLElBQUksTUFBTSxLQUFpQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBUWpELFlBQ0MsT0FBeUIsRUFDTCxpQkFBcUMsRUFDcEMsa0JBQXVDLEVBQ3JDLG9CQUEyQyxFQUM5QyxpQkFBcUMsRUFDakMscUJBQTZDLEVBQzlDLG9CQUEyQyxFQUNsRCxhQUE2QixFQUM5QixZQUEyQixFQUN2QixnQkFBbUMsRUFDdkMsWUFBMkIsRUFDekIsY0FBZ0QsRUFDbkQsV0FBMEMsRUFDckMsZ0JBQW9ELEVBQzFELFVBQXdDO1lBRXJELEtBQUssQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUx2SyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbEMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDcEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN6QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBckJyQyxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFHbEUsZ0NBQTJCLEdBQUcsS0FB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