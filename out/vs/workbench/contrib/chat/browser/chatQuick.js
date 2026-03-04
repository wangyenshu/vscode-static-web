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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/sash/sash", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/layout/browser/layoutService", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/services/views/common/viewsService"], function (require, exports, dom, sash_1, async_1, cancellation_1, event_1, lifecycle_1, actions_1, contextkey_1, instantiation_1, serviceCollection_1, layoutService_1, quickInput_1, colorRegistry_1, chat_1, chatWidget_1, chatAgents_1, chatService_1, viewsService_1) {
    "use strict";
    var QuickChat_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickChatService = void 0;
    let QuickChatService = class QuickChatService extends lifecycle_1.Disposable {
        constructor(quickInputService, chatService, instantiationService) {
            super();
            this.quickInputService = quickInputService;
            this.chatService = chatService;
            this.instantiationService = instantiationService;
            this._onDidClose = this._register(new event_1.Emitter());
            this.onDidClose = this._onDidClose.event;
        }
        get enabled() {
            return !!this.chatService.isEnabled(chatAgents_1.ChatAgentLocation.Panel);
        }
        get focused() {
            const widget = this._input?.widget;
            if (!widget) {
                return false;
            }
            return dom.isAncestorOfActiveElement(widget);
        }
        toggle(options) {
            // If the input is already shown, hide it. This provides a toggle behavior of the quick
            // pick. This should not happen when there is a query.
            if (this.focused && !options?.query) {
                this.close();
            }
            else {
                this.open(options);
                // If this is a partial query, the value should be cleared when closed as otherwise it
                // would remain for the next time the quick chat is opened in any context.
                if (options?.isPartialQuery) {
                    const disposable = this._store.add(event_1.Event.once(this.onDidClose)(() => {
                        this._currentChat?.clearValue();
                        this._store.delete(disposable);
                    }));
                }
            }
        }
        open(options) {
            if (this._input) {
                if (this._currentChat && options?.query) {
                    this._currentChat.focus();
                    this._currentChat.setValue(options.query, options.selection);
                    if (!options.isPartialQuery) {
                        this._currentChat.acceptInput();
                    }
                    return;
                }
                return this.focus();
            }
            const disposableStore = new lifecycle_1.DisposableStore();
            this._input = this.quickInputService.createQuickWidget();
            this._input.contextKey = 'chatInputVisible';
            this._input.ignoreFocusOut = true;
            disposableStore.add(this._input);
            this._container ??= dom.$('.interactive-session');
            this._input.widget = this._container;
            this._input.show();
            if (!this._currentChat) {
                this._currentChat = this.instantiationService.createInstance(QuickChat);
                // show needs to come after the quickpick is shown
                this._currentChat.render(this._container);
            }
            else {
                this._currentChat.show();
            }
            disposableStore.add(this._input.onDidHide(() => {
                disposableStore.dispose();
                this._currentChat.hide();
                this._input = undefined;
                this._onDidClose.fire();
            }));
            this._currentChat.focus();
            if (options?.query) {
                this._currentChat.setValue(options.query, options.selection);
                if (!options.isPartialQuery) {
                    this._currentChat.acceptInput();
                }
            }
        }
        focus() {
            this._currentChat?.focus();
        }
        close() {
            this._input?.dispose();
            this._input = undefined;
        }
        async openInChatView() {
            await this._currentChat?.openChatView();
            this.close();
        }
    };
    exports.QuickChatService = QuickChatService;
    exports.QuickChatService = QuickChatService = __decorate([
        __param(0, quickInput_1.IQuickInputService),
        __param(1, chatService_1.IChatService),
        __param(2, instantiation_1.IInstantiationService)
    ], QuickChatService);
    let QuickChat = class QuickChat extends lifecycle_1.Disposable {
        static { QuickChat_1 = this; }
        // TODO@TylerLeonhardt: be responsive to window size
        static { this.DEFAULT_MIN_HEIGHT = 200; }
        static { this.DEFAULT_HEIGHT_OFFSET = 100; }
        constructor(instantiationService, contextKeyService, chatService, layoutService, viewsService) {
            super();
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.chatService = chatService;
            this.layoutService = layoutService;
            this.viewsService = viewsService;
            this.maintainScrollTimer = this._register(new lifecycle_1.MutableDisposable());
            this._deferUpdatingDynamicLayout = false;
        }
        clear() {
            this.model?.dispose();
            this.model = undefined;
            this.updateModel();
            this.widget.inputEditor.setValue('');
        }
        focus(selection) {
            if (this.widget) {
                this.widget.focusInput();
                const value = this.widget.inputEditor.getValue();
                if (value) {
                    this.widget.inputEditor.setSelection(selection ?? {
                        startLineNumber: 1,
                        startColumn: 1,
                        endLineNumber: 1,
                        endColumn: value.length + 1
                    });
                }
            }
        }
        hide() {
            this.widget.setVisible(false);
            // Maintain scroll position for a short time so that if the user re-shows the chat
            // the same scroll position will be used.
            this.maintainScrollTimer.value = (0, async_1.disposableTimeout)(() => {
                // At this point, clear this mutable disposable which will be our signal that
                // the timer has expired and we should stop maintaining scroll position
                this.maintainScrollTimer.clear();
            }, 30 * 1000); // 30 seconds
        }
        show() {
            this.widget.setVisible(true);
            // If the mutable disposable is set, then we are keeping the existing scroll position
            // so we should not update the layout.
            if (this._deferUpdatingDynamicLayout) {
                this._deferUpdatingDynamicLayout = false;
                this.widget.updateDynamicChatTreeItemLayout(2, this.maxHeight);
            }
            if (!this.maintainScrollTimer.value) {
                this.widget.layoutDynamicChatTreeItemMode();
            }
        }
        render(parent) {
            if (this.widget) {
                throw new Error('Cannot render quick chat twice');
            }
            const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([
                contextkey_1.IContextKeyService,
                this._register(this.contextKeyService.createScoped(parent))
            ]));
            this.widget = this._register(scopedInstantiationService.createInstance(chatWidget_1.ChatWidget, chatAgents_1.ChatAgentLocation.Panel, { resource: true }, { renderInputOnTop: true, renderStyle: 'compact', menus: { inputSideToolbar: actions_1.MenuId.ChatInputSide } }, {
                listForeground: colorRegistry_1.quickInputForeground,
                listBackground: colorRegistry_1.quickInputBackground,
                inputEditorBackground: colorRegistry_1.inputBackground,
                resultEditorBackground: colorRegistry_1.editorBackground
            }));
            this.widget.render(parent);
            this.widget.setVisible(true);
            this.widget.setDynamicChatTreeItemLayout(2, this.maxHeight);
            this.updateModel();
            this.sash = this._register(new sash_1.Sash(parent, { getHorizontalSashTop: () => parent.offsetHeight }, { orientation: 1 /* Orientation.HORIZONTAL */ }));
            this.registerListeners(parent);
        }
        get maxHeight() {
            return this.layoutService.mainContainerDimension.height - QuickChat_1.DEFAULT_HEIGHT_OFFSET;
        }
        registerListeners(parent) {
            this._register(this.layoutService.onDidLayoutMainContainer(() => {
                if (this.widget.visible) {
                    this.widget.updateDynamicChatTreeItemLayout(2, this.maxHeight);
                }
                else {
                    // If the chat is not visible, then we should defer updating the layout
                    // because it relies on offsetHeight which only works correctly
                    // when the chat is visible.
                    this._deferUpdatingDynamicLayout = true;
                }
            }));
            this._register(this.widget.inputEditor.onDidChangeModelContent((e) => {
                this._currentQuery = this.widget.inputEditor.getValue();
            }));
            this._register(this.widget.onDidClear(() => this.clear()));
            this._register(this.widget.onDidChangeHeight((e) => this.sash.layout()));
            const width = parent.offsetWidth;
            this._register(this.sash.onDidStart(() => {
                this.widget.isDynamicChatTreeItemLayoutEnabled = false;
            }));
            this._register(this.sash.onDidChange((e) => {
                if (e.currentY < QuickChat_1.DEFAULT_MIN_HEIGHT || e.currentY > this.maxHeight) {
                    return;
                }
                this.widget.layout(e.currentY, width);
                this.sash.layout();
            }));
            this._register(this.sash.onDidReset(() => {
                this.widget.isDynamicChatTreeItemLayoutEnabled = true;
                this.widget.layoutDynamicChatTreeItemMode();
            }));
        }
        async acceptInput() {
            return this.widget.acceptInput();
        }
        async openChatView() {
            const widget = await (0, chat_1.showChatView)(this.viewsService);
            if (!widget?.viewModel || !this.model) {
                return;
            }
            for (const request of this.model.getRequests()) {
                if (request.response?.response.value || request.response?.result) {
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
                    this.chatService.addCompleteRequest(widget.viewModel.sessionId, request.message, request.variableData, request.attempt, {
                        message,
                        result: request.response.result,
                        followups: request.response.followups
                    });
                }
                else if (request.message) {
                }
            }
            const value = this.widget.inputEditor.getValue();
            if (value) {
                widget.inputEditor.setValue(value);
            }
            widget.focusInput();
        }
        setValue(value, selection) {
            this.widget.inputEditor.setValue(value);
            this.focus(selection);
        }
        clearValue() {
            this.widget.inputEditor.setValue('');
        }
        updateModel() {
            this.model ??= this.chatService.startSession(chatAgents_1.ChatAgentLocation.Panel, cancellation_1.CancellationToken.None);
            if (!this.model) {
                throw new Error('Could not start chat session');
            }
            this.widget.setModel(this.model, { inputValue: this._currentQuery });
        }
    };
    QuickChat = QuickChat_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, chatService_1.IChatService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, viewsService_1.IViewsService)
    ], QuickChat);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFF1aWNrLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRRdWljay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBd0J6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVO1FBVy9DLFlBQ3FCLGlCQUFzRCxFQUM1RCxXQUEwQyxFQUNqQyxvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFKNkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUMzQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNoQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBWG5FLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDMUQsZUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO1FBYTdDLENBQUM7UUFFRCxJQUFJLE9BQU87WUFDVixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyw4QkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsSUFBSSxPQUFPO1lBQ1YsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFpQyxDQUFDO1lBQzlELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxPQUFPLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsTUFBTSxDQUFDLE9BQStCO1lBQ3JDLHVGQUF1RjtZQUN2RixzREFBc0Q7WUFDdEQsSUFBSSxJQUFJLENB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