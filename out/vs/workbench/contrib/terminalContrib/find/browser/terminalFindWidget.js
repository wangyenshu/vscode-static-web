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
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/contrib/codeEditor/browser/find/simpleFindWidget", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/terminalContrib/find/browser/textInputContextMenu", "vs/platform/hover/browser/hover"], function (require, exports, dom, simpleFindWidget_1, contextView_1, contextkey_1, terminalContextKey_1, themeService_1, configuration_1, keybinding_1, event_1, clipboardService_1, textInputContextMenu_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalFindWidget = void 0;
    const TERMINAL_FIND_WIDGET_INITIAL_WIDTH = 419;
    let TerminalFindWidget = class TerminalFindWidget extends simpleFindWidget_1.SimpleFindWidget {
        constructor(_instance, _contextViewService, keybindingService, _contextKeyService, _contextMenuService, _clipboardService, hoverService, _themeService, _configurationService) {
            super({
                showCommonFindToggles: true,
                checkImeCompletionState: true,
                showResultCount: true,
                initialWidth: TERMINAL_FIND_WIDGET_INITIAL_WIDTH,
                enableSash: true,
                appendCaseSensitiveActionId: "workbench.action.terminal.toggleFindCaseSensitive" /* TerminalCommandId.ToggleFindCaseSensitive */,
                appendRegexActionId: "workbench.action.terminal.toggleFindRegex" /* TerminalCommandId.ToggleFindRegex */,
                appendWholeWordsActionId: "workbench.action.terminal.toggleFindWholeWord" /* TerminalCommandId.ToggleFindWholeWord */,
                previousMatchActionId: "workbench.action.terminal.findPrevious" /* TerminalCommandId.FindPrevious */,
                nextMatchActionId: "workbench.action.terminal.findNext" /* TerminalCommandId.FindNext */,
                closeWidgetActionId: "workbench.action.terminal.hideFind" /* TerminalCommandId.FindHide */,
                type: 'Terminal',
                matchesLimit: 1000 /* XtermTerminalConstants.SearchHighlightLimit */
            }, _contextViewService, _contextKeyService, hoverService, keybindingService);
            this._instance = _instance;
            this._contextKeyService = _contextKeyService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._register(this.state.onFindReplaceStateChange(() => {
                this.show();
            }));
            this._findInputFocused = terminalContextKey_1.TerminalContextKeys.findInputFocus.bindTo(this._contextKeyService);
            this._findWidgetFocused = terminalContextKey_1.TerminalContextKeys.findFocus.bindTo(this._contextKeyService);
            this._findWidgetVisible = terminalContextKey_1.TerminalContextKeys.findVisible.bindTo(this._contextKeyService);
            const innerDom = this.getDomNode().firstChild;
            if (innerDom) {
                this._register(dom.addDisposableListener(innerDom, 'mousedown', (event) => {
                    event.stopPropagation();
                }));
                this._register(dom.addDisposableListener(innerDom, 'contextmenu', (event) => {
                    event.stopPropagation();
                }));
            }
            const findInputDomNode = this.getFindInputDomNode();
            this._register(dom.addDisposableListener(findInputDomNode, 'contextmenu', (event) => {
                (0, textInputContextMenu_1.openContextMenu)(dom.getWindow(findInputDomNode), event, _clipboardService, _contextMenuService);
                event.stopPropagation();
            }));
            this._register(this._themeService.onDidColorThemeChange(() => {
                if (this.isVisible()) {
                    this.find(true, true);
                }
            }));
            this._register(this._configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('workbench.colorCustomizations') && this.isVisible()) {
                    this.find(true, true);
                }
            }));
            this.updateResultCount();
        }
        find(previous, update) {
            const xterm = this._instance.xterm;
            if (!xterm) {
                return;
            }
            if (previous) {
                this._findPreviousWithEvent(xterm, this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue(), incremental: update });
            }
            else {
                this._findNextWithEvent(xterm, this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() });
            }
        }
        reveal() {
            const initialInput = this._instance.hasSelection() && !this._instance.selection.includes('\n') ? this._instance.selection : undefined;
            const inputValue = initialInput ?? this.inputValue;
            const xterm = this._instance.xterm;
            if (xterm && inputValue && inputValue !== '') {
                // trigger highlight all matches
                this._findPreviousWithEvent(xterm, inputValue, { incremental: true, regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() }).then(foundMatch => {
                    this.updateButtons(foundMatch);
                    this._register(event_1.Event.once(xterm.onDidChangeSelection)(() => xterm.clearActiveSearchDecoration()));
                });
            }
            this.updateButtons(false);
            super.reveal(inputValue);
            this._findWidgetVisible.set(true);
        }
        show() {
            const initialInput = this._instance.hasSelection() && !this._instance.selection.includes('\n') ? this._instance.selection : undefined;
            super.show(initialInput);
            this._findWidgetVisible.set(true);
        }
        hide() {
            super.hide();
            this._findWidgetVisible.reset();
            this._instance.focus(true);
            this._instance.xterm?.clearSearchDecorations();
        }
        async _getResultCount() {
            return this._instance.xterm?.findResult;
        }
        _onInputChanged() {
            // Ignore input changes for now
            const xterm = this._instance.xterm;
            if (xterm) {
                this._findPreviousWithEvent(xterm, this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue(), incremental: true }).then(foundMatch => {
                    this.updateButtons(foundMatch);
                });
            }
            return false;
        }
        _onFocusTrackerFocus() {
            if ('overrideCopyOnSelection' in this._instance) {
                this._overrideCopyOnSelectionDisposable = this._instance.overrideCopyOnSelection(false);
            }
            this._findWidgetFocused.set(true);
        }
        _onFocusTrackerBlur() {
            this._overrideCopyOnSelectionDisposable?.dispose();
            this._instance.xterm?.clearActiveSearchDecoration();
            this._findWidgetFocused.reset();
        }
        _onFindInputFocusTrackerFocus() {
            this._findInputFocused.set(true);
        }
        _onFindInputFocusTrackerBlur() {
            this._findInputFocused.reset();
        }
        findFirst() {
            const instance = this._instance;
            if (instance.hasSelection()) {
                instance.clearSelection();
            }
            const xterm = instance.xterm;
            if (xterm) {
                this._findPreviousWithEvent(xterm, this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() });
            }
        }
        async _findNextWithEvent(xterm, term, options) {
            return xterm.findNext(term, options).then(foundMatch => {
                this._register(event_1.Event.once(xterm.onDidChangeSelection)(() => xterm.clearActiveSearchDecoration()));
                return foundMatch;
            });
        }
        async _findPreviousWithEvent(xterm, term, options) {
            return xterm.findPrevious(term, options).then(foundMatch => {
                this._register(event_1.Event.once(xterm.onDidChangeSelection)(() => xterm.clearActiveSearchDecoration()));
                return foundMatch;
            });
        }
    };
    exports.TerminalFindWidget = TerminalFindWidget;
    exports.TerminalFindWidget = TerminalFindWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, clipboardService_1.IClipboardService),
        __param(6, hover_1.IHoverService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService)
    ], TerminalFindWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxGaW5kV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2ZpbmQvYnJvd3Nlci90ZXJtaW5hbEZpbmRXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJoRyxNQUFNLGtDQUFrQyxHQUFHLEdBQUcsQ0FBQztJQUV4QyxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLG1DQUFnQjtRQU92RCxZQUNTLFNBQXdELEVBQzNDLG1CQUF3QyxFQUN6QyxpQkFBcUMsRUFDcEIsa0JBQXNDLEVBQ3RELG1CQUF3QyxFQUMxQyxpQkFBb0MsRUFDeEMsWUFBMkIsRUFDVixhQUE0QixFQUNwQixxQkFBNEM7WUFFcEYsS0FBSyxDQUFDO2dCQUNMLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLHVCQUF1QixFQUFFLElBQUk7Z0JBQzdCLGVBQWUsRUFBRSxJQUFJO2dCQUNyQixZQUFZLEVBQUUsa0NBQWtDO2dCQUNoRCxVQUFVLEVBQUUsSUFBSTtnQkFDaEIsMkJBQTJCLHFHQUEyQztnQkFDdEUsbUJBQW1CLHFGQUFtQztnQkFDdEQsd0JBQXdCLDZGQUF1QztnQkFDL0QscUJBQXFCLCtFQUFnQztnQkFDckQsaUJBQWlCLHVFQUE0QjtnQkFDN0MsbUJBQW1CLHVFQUE0QjtnQkFDL0MsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLFlBQVksd0RBQTZDO2FBQ3pELEVBQUUsbUJBQW1CLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUF4QnJFLGNBQVMsR0FBVCxTQUFTLENBQStDO1lBRzNCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFJM0Msa0JBQWEsR0FBYixhQUFhLENB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