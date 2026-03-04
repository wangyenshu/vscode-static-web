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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/symbols", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/inlineChat/browser/inlineChatWidget", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChat", "vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminalStickyScrollContribution", "vs/css!./media/terminalChatWidget"], function (require, exports, dom_1, event_1, lifecycle_1, symbols_1, nls_1, contextkey_1, instantiation_1, chatAgents_1, inlineChatWidget_1, terminalChat_1, terminalStickyScrollContribution_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalChatWidget = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["HorizontalMargin"] = 10] = "HorizontalMargin";
    })(Constants || (Constants = {}));
    let TerminalChatWidget = class TerminalChatWidget extends lifecycle_1.Disposable {
        get inlineChatWidget() { return this._inlineChatWidget; }
        constructor(_terminalElement, _instance, _xterm, _instantiationService, _contextKeyService) {
            super();
            this._terminalElement = _terminalElement;
            this._instance = _instance;
            this._xterm = _xterm;
            this._instantiationService = _instantiationService;
            this._contextKeyService = _contextKeyService;
            this._focusedContextKey = terminalChat_1.TerminalChatContextKeys.focused.bindTo(this._contextKeyService);
            this._visibleContextKey = terminalChat_1.TerminalChatContextKeys.visible.bindTo(this._contextKeyService);
            this._container = document.createElement('div');
            this._container.classList.add('terminal-inline-chat');
            _terminalElement.appendChild(this._container);
            this._inlineChatWidget = this._instantiationService.createInstance(inlineChatWidget_1.InlineChatWidget, chatAgents_1.ChatAgentLocation.Terminal, {
                inputMenuId: terminalChat_1.MENU_TERMINAL_CHAT_INPUT,
                widgetMenuId: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET,
                statusMenuId: {
                    menu: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
                    options: {
                        buttonConfigProvider: action => {
                            if (action.id === "workbench.action.terminal.chat.viewInChat" /* TerminalChatCommandId.ViewInChat */ || action.id === "workbench.action.terminal.chat.runCommand" /* TerminalChatCommandId.RunCommand */ || action.id === "workbench.action.terminal.chat.runFirstCommand" /* TerminalChatCommandId.RunFirstCommand */) {
                                return { isSecondary: false };
                            }
                            else {
                                return { isSecondary: true };
                            }
                        }
                    }
                },
                feedbackMenuId: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_FEEDBACK,
                telemetrySource: 'terminal-inline-chat',
                rendererOptions: { editableCodeBlock: true }
            });
            this._register(event_1.Event.any(this._inlineChatWidget.onDidChangeHeight, this._instance.onDimensionsChanged, event_1.Event.debounce(this._xterm.raw.onCursorMove, () => void 0, symbols_1.MicrotaskDelay))(() => this._relayout()));
            const observer = new ResizeObserver(() => this._relayout());
            observer.observe(this._terminalElement);
            this._register((0, lifecycle_1.toDisposable)(() => observer.disconnect()));
            this._reset();
            this._container.appendChild(this._inlineChatWidget.domNode);
            this._focusTracker = this._register((0, dom_1.trackFocus)(this._container));
            this.hide();
        }
        _relayout() {
            if (this._dimension) {
                this._doLayout(this._inlineChatWidget.contentHeight);
            }
        }
        _doLayout(heightInPixel) {
            const xtermElement = this._xterm.raw.element;
            if (!xtermElement) {
                return;
            }
            const style = (0, dom_1.getActiveWindow)().getComputedStyle(xtermElement);
            const xtermPadding = parseInt(style.paddingLeft) + parseInt(style.paddingRight);
            const width = Math.min(640, xtermElement.clientWidth - 12 /* padding */ - 2 /* border */ - 10 /* Constants.HorizontalMargin */ - xtermPadding);
            const height = Math.min(480, heightInPixel, this._getTerminalWrapperHeight() ?? Number.MAX_SAFE_INTEGER);
            if (width === 0 || height === 0) {
                return;
            }
            this._container.style.paddingLeft = style.paddingLeft;
            this._dimension = new dom_1.Dimension(width, height);
            this._inlineChatWidget.layout(this._dimension);
            this._updateVerticalPosition();
        }
        _reset() {
            this._inlineChatWidget.placeholder = (0, nls_1.localize)('default.placeholder', "Ask how to do something in the terminal");
            this._inlineChatWidget.updateInfo((0, nls_1.localize)('welcome.1', "AI-generated commands may be incorrect"));
        }
        reveal() {
            this._doLayout(this._inlineChatWidget.contentHeight);
            this._container.classList.remove('hide');
            this._focusedContextKey.set(true);
            this._visibleContextKey.set(true);
            this._inlineChatWidget.focus();
            this._instance.scrollToBottom();
        }
        _updateVerticalPosition() {
            const font = this._instance.xterm?.getFont();
            if (!font?.charHeight) {
                return;
            }
            const terminalWrapperHeight = this._getTerminalWrapperHeight() ?? 0;
            const cellHeight = font.charHeight * font.lineHeight;
            const topPadding = terminalWrapperHeight - (this._instance.rows * cellHeight);
            const cursorY = (this._instance.xterm?.raw.buffer.active.cursorY ?? 0) + 1;
            const top = topPadding + cursorY * cellHeight;
            this._container.style.top = `${top}px`;
            const widgetHeight = this._inlineChatWidget.contentHeight;
            if (!terminalWrapperHeight) {
                return;
            }
            if (top > terminalWrapperHeight - widgetHeight) {
                this._setTerminalOffset(top - (terminalWrapperHeight - widgetHeight));
            }
            else {
                this._setTerminalOffset(undefined);
            }
        }
        _getTerminalWrapperHeight() {
            return this._terminalElement.clientHeight;
        }
        hide() {
            this._container.classList.add('hide');
            this._reset();
            this._inlineChatWidget.updateChatMessage(undefined);
            this._inlineChatWidget.updateFollowUps(undefined);
            this._inlineChatWidget.updateProgress(false);
            this._inlineChatWidget.updateToolbar(false);
            this._inlineChatWidget.reset();
            this._focusedContextKey.set(false);
            this._visibleContextKey.set(false);
            this._inlineChatWidget.value = '';
            this._instance.focus();
            this._setTerminalOffset(undefined);
        }
        _setTerminalOffset(offset) {
            if (offset === undefined || this._container.classList.contains('hide')) {
                this._terminalElement.style.position = '';
                this._terminalElement.style.bottom = '';
                terminalStickyScrollContribution_1.TerminalStickyScrollContribution.get(this._instance)?.hideUnlock();
            }
            else {
                this._terminalElement.style.position = 'relative';
                this._terminalElement.style.bottom = `${offset}px`;
                terminalStickyScrollContribution_1.TerminalStickyScrollContribution.get(this._instance)?.hideLock();
            }
        }
        focus() {
            this._inlineChatWidget.focus();
        }
        hasFocus() {
            return this._inlineChatWidget.hasFocus();
        }
        input() {
            return this._inlineChatWidget.value;
        }
        addToHistory(input) {
            this._inlineChatWidget.addToHistory(input);
            this._inlineChatWidget.saveState();
            this._inlineChatWidget.value = input;
            this._inlineChatWidget.selectAll(true);
        }
        setValue(value) {
            this._inlineChatWidget.value = value ?? '';
        }
        acceptCommand(code, shouldExecute) {
            this._instance.runCommand(code, shouldExecute);
            this.hide();
        }
        updateProgress(progress) {
            this._inlineChatWidget.updateProgress(progress?.kind === 'markdownContent');
        }
        get focusTracker() {
            return this._focusTracker;
        }
    };
    exports.TerminalChatWidget = TerminalChatWidget;
    exports.TerminalChatWidget = TerminalChatWidget = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextkey_1.IContextKeyService)
    ], TerminalChatWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0V2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2NoYXQvYnJvd3Nlci90ZXJtaW5hbENoYXRXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0JoRyxJQUFXLFNBRVY7SUFGRCxXQUFXLFNBQVM7UUFDbkIsa0VBQXFCLENBQUE7SUFDdEIsQ0FBQyxFQUZVLFNBQVMsS0FBVCxTQUFTLFFBRW5CO0lBRU0sSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQUtqRCxJQUFXLGdCQUFnQixLQUF1QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFPbEYsWUFDa0IsZ0JBQTZCLEVBQzdCLFNBQTRCLEVBQzVCLE1BQWtELEVBQzNCLHFCQUE0QyxFQUMvQyxrQkFBc0M7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFOUyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWE7WUFDN0IsY0FBUyxHQUFULFNBQVMsQ0FBbUI7WUFDNUIsV0FBTSxHQUFOLE1BQU0sQ0FBNEM7WUFDM0IsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBSTNFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxzQ0FBdUIsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzFGLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxzQ0FBdUIsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRTFGLElBQUksQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLGFB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