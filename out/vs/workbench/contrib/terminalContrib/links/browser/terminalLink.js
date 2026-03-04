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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/async", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/base/common/platform", "vs/base/common/event", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, dom, async_1, terminalLinkHelpers_1, platform_1, event_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLink = void 0;
    let TerminalLink = class TerminalLink extends lifecycle_1.DisposableStore {
        get onInvalidated() { return this._onInvalidated.event; }
        get type() { return this._type; }
        constructor(_xterm, range, text, uri, parsedLink, actions, _viewportY, _activateCallback, _tooltipCallback, _isHighConfidenceLink, label, _type, _configurationService) {
            super();
            this._xterm = _xterm;
            this.range = range;
            this.text = text;
            this.uri = uri;
            this.parsedLink = parsedLink;
            this.actions = actions;
            this._viewportY = _viewportY;
            this._activateCallback = _activateCallback;
            this._tooltipCallback = _tooltipCallback;
            this._isHighConfidenceLink = _isHighConfidenceLink;
            this.label = label;
            this._type = _type;
            this._configurationService = _configurationService;
            this._onInvalidated = new event_1.Emitter();
            this.decorations = {
                pointerCursor: false,
                underline: this._isHighConfidenceLink
            };
        }
        dispose() {
            super.dispose();
            this._hoverListeners?.dispose();
            this._hoverListeners = undefined;
            this._tooltipScheduler?.dispose();
            this._tooltipScheduler = undefined;
        }
        activate(event, text) {
            // Trigger the xterm.js callback synchronously but track the promise resolution so we can
            // use it in tests
            this.asyncActivate = this._activateCallback(event, text);
        }
        hover(event, text) {
            const w = dom.getWindow(event);
            const d = w.document;
            // Listen for modifier before handing it off to the hover to handle so it gets disposed correctly
            this._hoverListeners = new lifecycle_1.DisposableStore();
            this._hoverListeners.add(dom.addDisposableListener(d, 'keydown', e => {
                if (!e.repeat && this._isModifierDown(e)) {
                    this._enableDecorations();
                }
            }));
            this._hoverListeners.add(dom.addDisposableListener(d, 'keyup', e => {
                if (!e.repeat && !this._isModifierDown(e)) {
                    this._disableDecorations();
                }
            }));
            // Listen for when the terminal renders on the same line as the link
            this._hoverListeners.add(this._xterm.onRender(e => {
                const viewportRangeY = this.range.start.y - this._viewportY;
                if (viewportRangeY >= e.start && viewportRangeY <= e.end) {
                    this._onInvalidated.fire();
                }
            }));
            // Only show the tooltip and highlight for high confidence links (not word/search workspace
            // links). Feedback was that this makes using the terminal overly noisy.
            if (this._isHighConfidenceLink) {
                this._tooltipScheduler = new async_1.RunOnceScheduler(() => {
                    this._tooltipCallback(this, (0, terminalLinkHelpers_1.convertBufferRangeToViewport)(this.range, this._viewportY), this._isHighConfidenceLink ? () => this._enableDecorations() : undefined, this._isHighConfidenceLink ? () => this._disableDecorations() : undefined);
                    // Clear out scheduler until next hover event
                    this._tooltipScheduler?.dispose();
                    this._tooltipScheduler = undefined;
                }, this._configurationService.getValue('workbench.hover.delay'));
                this.add(this._tooltipScheduler);
                this._tooltipScheduler.schedule();
            }
            const origin = { x: event.pageX, y: event.pageY };
            this._hoverListeners.add(dom.addDisposableListener(d, dom.EventType.MOUSE_MOVE, e => {
                // Update decorations
                if (this._isModifierDown(e)) {
                    this._enableDecorations();
                }
                else {
                    this._disableDecorations();
                }
                // Reset the scheduler if the mouse moves too much
                if (Math.abs(e.pageX - origin.x) > w.devicePixelRatio * 2 || Math.abs(e.pageY - origin.y) > w.devicePixelRatio * 2) {
                    origin.x = e.pageX;
                    origin.y = e.pageY;
                    this._tooltipScheduler?.schedule();
                }
            }));
        }
        leave() {
            this._hoverListeners?.dispose();
            this._hoverListeners = undefined;
            this._tooltipScheduler?.dispose();
            this._tooltipScheduler = undefined;
        }
        _enableDecorations() {
            if (!this.decorations.pointerCursor) {
                this.decorations.pointerCursor = true;
            }
            if (!this.decorations.underline) {
                this.decorations.underline = true;
            }
        }
        _disableDecorations() {
            if (this.decorations.pointerCursor) {
                this.decorations.pointerCursor = false;
            }
            if (this.decorations.underline !== this._isHighConfidenceLink) {
                this.decorations.underline = this._isHighConfidenceLink;
            }
        }
        _isModifierDown(event) {
            const multiCursorModifier = this._configurationService.getValue('editor.multiCursorModifier');
            if (multiCursorModifier === 'ctrlCmd') {
                return !!event.altKey;
            }
            return platform_1.isMacintosh ? event.metaKey : event.ctrlKey;
        }
    };
    exports.TerminalLink = TerminalLink;
    exports.TerminalLink = TerminalLink = __decorate([
        __param(12, configuration_1.IConfigurationService)
    ], TerminalLink);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL2Jyb3dzZXIvdGVybWluYWxMaW5rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWV6RixJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFhLFNBQVEsMkJBQWU7UUFRaEQsSUFBSSxhQUFhLEtBQWtCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXRFLElBQUksSUFBSSxLQUF1QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRW5ELFlBQ2tCLE1BQWdCLEVBQ3hCLEtBQW1CLEVBQ25CLElBQVksRUFDWixHQUFvQixFQUNwQixVQUFtQyxFQUNuQyxPQUFtQyxFQUMzQixVQUFrQixFQUNsQixpQkFBZ0YsRUFDaEYsZ0JBQWlKLEVBQ2pKLHFCQUE4QixFQUN0QyxLQUF5QixFQUNqQixLQUF1QixFQUNqQixxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFkUyxXQUFNLEdBQU4sTUFBTSxDQUFVO1lBQ3hCLFVBQUssR0FBTCxLQUFLLENBQWM7WUFDbkIsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUNaLFFBQUcsR0FBSCxHQUFHLENBQWlCO1lBQ3BCLGVBQVUsR0FBVixVQUFVLENBQXlCO1lBQ25DLFlBQU8sR0FBUCxPQUFPLENBQTRCO1lBQzNCLGVBQVUsR0FBVixVQUFVLENBQVE7WUFDbEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUErRDtZQUNoRixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWlJO1lBQ2pKLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBUztZQUN0QyxVQUFLLEdBQUwsS0FBSyxDQUFv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