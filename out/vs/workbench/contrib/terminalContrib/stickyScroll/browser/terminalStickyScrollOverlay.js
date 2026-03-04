var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/amdX", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/browser/terminalContextMenu", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminalStickyScrollColorRegistry", "vs/css!./media/stickyScroll"], function (require, exports, amdX_1, dom_1, async_1, decorators_1, event_1, lifecycle_1, strings_1, nls_1, actions_1, configuration_1, contextkey_1, contextView_1, keybinding_1, themeService_1, terminalContextMenu_1, terminal_1, terminalStrings_1, terminalStickyScrollColorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalStickyScrollOverlay = void 0;
    var OverlayState;
    (function (OverlayState) {
        /** Initial state/disabled by the alt buffer. */
        OverlayState[OverlayState["Off"] = 0] = "Off";
        OverlayState[OverlayState["On"] = 1] = "On";
    })(OverlayState || (OverlayState = {}));
    var CssClasses;
    (function (CssClasses) {
        CssClasses["Visible"] = "visible";
    })(CssClasses || (CssClasses = {}));
    var Constants;
    (function (Constants) {
        Constants[Constants["StickyScrollPercentageCap"] = 0.4] = "StickyScrollPercentageCap";
    })(Constants || (Constants = {}));
    let TerminalStickyScrollOverlay = class TerminalStickyScrollOverlay extends lifecycle_1.Disposable {
        constructor(_instance, _xterm, _xtermColorProvider, _commandDetection, xtermCtor, configurationService, contextKeyService, _contextMenuService, _keybindingService, menuService, _themeService) {
            super();
            this._instance = _instance;
            this._xterm = _xterm;
            this._xtermColorProvider = _xtermColorProvider;
            this._commandDetection = _commandDetection;
            this._contextMenuService = _contextMenuService;
            this._keybindingService = _keybindingService;
            this._themeService = _themeService;
            this._canvasAddon = this._register(new lifecycle_1.MutableDisposable());
            this._refreshListeners = this._register(new lifecycle_1.MutableDisposable());
            this._state = 0 /* OverlayState.Off */;
            this._isRefreshQueued = false;
            this._rawMaxLineCount = 5;
            this._contextMenu = this._register(menuService.createMenu(actions_1.MenuId.TerminalStickyScrollContext, contextKeyService));
            // Only show sticky scroll in the normal buffer
            this._register(event_1.Event.runAndSubscribe(this._xterm.raw.buffer.onBufferChange, buffer => {
                this._setState((buffer ?? this._xterm.raw.buffer.active).type === 'normal' ? 1 /* OverlayState.On */ : 0 /* OverlayState.Off */);
            }));
            // React to configuration changes
            this._register(event_1.Event.runAndSubscribe(configurationService.onDidChangeConfiguration, e => {
                if (!e || e.affectsConfiguration("terminal.integrated.stickyScroll.maxLineCount" /* TerminalSettingId.StickyScrollMaxLineCount */)) {
                    this._rawMaxLineCount = configurationService.getValue("terminal.integrated.stickyScroll.maxLineCount" /* TerminalSettingId.StickyScrollMaxLineCount */);
                }
            }));
            // React to terminal location changes
            this._register(this._instance.onDidChangeTarget(() => this._syncOptions()));
            // Eagerly create the overlay
            xtermCtor.then(ctor => {
                if (this._store.isDisposed) {
                    return;
                }
                this._stickyScrollOverlay = this._register(new ctor({
                    rows: 1,
                    cols: this._xterm.raw.cols,
                    allowProposedApi: true,
                    ...this._getOptions()
                }));
                this._register(configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration(terminal_1.TERMINAL_CONFIG_SECTION)) {
                        this._syncOptions();
                    }
                }));
                this._register(this._themeService.onDidColorThemeChange(() => {
                    this._syncOptions();
                }));
                this._register(this._xterm.raw.onResize(() => {
                    this._syncOptions();
                    this._refresh();
                }));
                this._getSerializeAddonConstructor().then(SerializeAddon => {
                    this._serializeAddon = this._register(new SerializeAddon());
                    this._xterm.raw.loadAddon(this._serializeAddon);
                    // Trigger a render as the serialize addon is required to render
                    this._refresh();
                });
                this._syncGpuAccelerationState();
            });
        }
        lockHide() {
            this._element?.classList.add('lock-hide');
        }
        unlockHide() {
            this._element?.classList.remove('lock-hide');
        }
        _setState(state) {
            if (this._state === state) {
                return;
            }
            switch (state) {
                case 0 /* OverlayState.Off */: {
                    this._setVisible(false);
                    this._uninstallRefreshListeners();
                    break;
                }
                case 1 /* OverlayState.On */: {
                    this._refresh();
                    this._installRefreshListeners();
                    break;
                }
            }
        }
        _installRefreshListeners() {
            if (!this._refreshListeners.value) {
                this._refreshListeners.value = (0, lifecycle_1.combinedDisposable)(event_1.Event.any(this._xterm.raw.onScroll, this._xterm.raw.onLineFeed, 
                // Rarely an update may be required after just a cursor move, like when
                // scrolling horizontally in a pager
                this._xterm.raw.onCursorMove)(() => this._refresh()), (0, dom_1.addStandardDisposableListener)(this._xterm.raw.element.querySelector('.xterm-viewport'), 'scroll', () => this._refresh()));
            }
        }
        _uninstallRefreshListeners() {
            this._refreshListeners.clear();
        }
        _setVisible(isVisible) {
            if (isVisible) {
                this._ensureElement();
                // The GPU acceleration state may be changes at any time and there is no event to listen
                // to currently.
                this._syncGpuAccelerationState();
            }
            this._element?.classList.toggle("visible" /* CssClasses.Visible */, isVisible);
        }
        _refresh() {
            if (this._isRefreshQueued) {
                return;
            }
            this._isRefreshQueued = true;
            queueMicrotask(() => {
                this._refreshNow();
                this._isRefreshQueued = false;
            });
        }
        _refreshNow() {
            const command = this._commandDetection.getCommandForLine(this._xterm.raw.buffer.active.viewportY);
            // The command from viewportY + 1 is used because this one will not be obscured by sticky
            // scroll.
            this._currentStickyCommand = undefined;
            // No command
            if (!command) {
                this._setVisible(false);
                return;
            }
            // Partial command
            if (!('marker' in command)) {
                const partialCommand = this._commandDetection.currentCommand;
                if (partialCommand?.commandStartMarker && partialCommand.commandExecutedMarker) {
                    this._updateContent(partialCommand, partialCommand.commandStartMarker);
                    return;
                }
                this._setVisible(false);
                return;
            }
            // If the marker doesn't exist or it was trimmed from scrollback
            const marker = command.marker;
            if (!marker || marker.line === -1) {
                // TODO: It would be nice if we kept the cached command around even if it was trimmed
                // from scrollback
                this._setVisible(false);
                return;
            }
            this._updateContent(command, marker);
        }
        _updateContent(command, startMarker) {
            const xterm = this._xterm.raw;
            if (!xterm.element?.parentElement || !this._stickyScrollOverlay || !this._serializeAddon) {
                return;
            }
            // Hide sticky scroll if the prompt has been trimmed from the buffer
            if (command.promptStartMarker?.line === -1) {
                this._setVisible(false);
                return;
            }
            // Determine sticky scroll line count
            const buffer = xterm.buffer.active;
            const promptRowCount = command.getPromptRowCount();
            const commandRowCount = command.getCommandRowCount();
            const stickyScrollLineStart = startMarker.line - (promptRowCount - 1);
            // Calculate the row offset, this is the number of rows that will be clipped from the top
            // of the sticky overlay because we do not want to show any content above the bounds of the
            // original terminal. This is done because it seems like scrolling flickers more when a
            // partial line can be drawn on the top.
            const isPartialCommand = !('getOutput' in command);
            const rowOffset = !isPartialCommand && command.endMarker ? Math.max(buffer.viewportY - command.endMarker.line + 1, 0) : 0;
            const maxLineCount = Math.min(this._rawMaxLineCount, Math.floor(xterm.rows * 0.4 /* Constants.StickyScrollPercentageCap */));
            const stickyScrollLineCount = Math.min(promptRowCount + commandRowCount - 1, maxLineCount) - rowOffset;
            // Hide sticky scroll if it's currently on a line that contains it
            if (buffer.viewportY <= stickyScrollLineStart) {
                this._setVisible(false);
                return;
            }
            // Hide sticky scroll for the partial command if it looks like there is a pager like `less`
            // or `git log` active. This is done by checking if the bottom left cell contains the :
            // character and the cursor is immediately to its right. This improves the behavior of a
            // common case where the top of the text being viewport would otherwise be obscured.
            if (isPartialCommand && buffer.viewportY === buffer.baseY && buffer.cursorY === xterm.rows - 1) {
                const line = buffer.getLine(buffer.baseY + xterm.rows - 1);
                if ((buffer.cursorX === 1 && lineStartsWith(line, ':')) ||
                    (buffer.cursorX === 5 && lineStartsWith(line, '(END)'))) {
                    this._setVisible(false);
                    return;
                }
            }
            // Get the line content of the command from the terminal
            const content = this._serializeAddon.serialize({
                range: {
                    start: stickyScrollLineStart + rowOffset,
                    end: stickyScrollLineStart + rowOffset + Math.max(stickyScrollLineCount - 1, 0)
                }
            });
            // If a partial command's sticky scroll would show nothing, just hide it. This is another
            // edge case when using a pager or interactive editor.
            if (isPartialCommand && (0, strings_1.removeAnsiEscapeCodes)(content).length === 0) {
                this._setVisible(false);
                return;
            }
            // Write content if it differs
            if (content && this._currentContent !== content ||
                this._stickyScrollOverlay.cols !== xterm.cols ||
                this._stickyScrollOverlay.rows !== stickyScrollLineCount) {
                this._stickyScrollOverlay.resize(this._stickyScrollOverlay.cols, stickyScrollLineCount);
                // Clear attrs, reset cursor position, clear right
                this._stickyScrollOverlay.write('\x1b[0m\x1b[H\x1b[2J');
                this._stickyScrollOverlay.write(content);
                this._currentContent = content;
                // DEBUG: Log to show the command line we know
                // this._stickyScrollOverlay.write(` [${command?.command}]`);
            }
            if (content) {
                this._currentStickyCommand = command;
                this._setVisible(true);
                // Position the sticky scroll such that it never overlaps the prompt/output of the
                // following command. This must happen after setVisible to ensure the element is
                // initialized.
                if (this._element) {
                    const termBox = xterm.element.getBoundingClientRect();
                    const rowHeight = termBox.height / xterm.rows;
                    const overlayHeight = stickyScrollLineCount * rowHeight;
                    // Adjust sticky scroll content if it would below the end of the command, obscuring the
                    // following command.
                    let endMarkerOffset = 0;
                    if (!isPartialCommand && command.endMarker && command.endMarker.line !== -1) {
                        if (buffer.viewportY + stickyScrollLineCount > command.endMarker.line) {
                            const diff = buffer.viewportY + stickyScrollLineCount - command.endMarker.line;
                            endMarkerOffset = diff * rowHeight;
                        }
                    }
                    this._element.style.bottom = `${termBox.height - overlayHeight + 1 + endMarkerOffset}px`;
                }
            }
            else {
                this._setVisible(false);
            }
        }
        _ensureElement() {
            if (
            // The element is already created
            this._element ||
                // If the overlay is yet to be created, the terminal cannot be opened so defer to next call
                !this._stickyScrollOverlay ||
                // The xterm.js instance isn't opened yet
                !this._xterm?.raw.element?.parentElement) {
                return;
            }
            const overlay = this._stickyScrollOverlay;
            const hoverOverlay = (0, dom_1.$)('.hover-overlay');
            this._element = (0, dom_1.$)('.terminal-sticky-scroll', undefined, hoverOverlay);
            this._xterm.raw.element.parentElement.append(this._element);
            this._register((0, lifecycle_1.toDisposable)(() => this._element?.remove()));
            // Fill tooltip
            let hoverTitle = (0, nls_1.localize)('stickyScrollHoverTitle', 'Navigate to Command');
            const scrollToPreviousCommandKeybinding = this._keybindingService.lookupKeybinding("workbench.action.terminal.scrollToPreviousCommand" /* TerminalCommandId.ScrollToPreviousCommand */);
            if (scrollToPreviousCommandKeybinding) {
                const label = scrollToPreviousCommandKeybinding.getLabel();
                if (label) {
                    hoverTitle += '\n' + (0, nls_1.localize)('labelWithKeybinding', "{0} ({1})", terminalStrings_1.terminalStrings.scrollToPreviousCommand.value, label);
                }
            }
            const scrollToNextCommandKeybinding = this._keybindingService.lookupKeybinding("workbench.action.terminal.scrollToNextCommand" /* TerminalCommandId.ScrollToNextCommand */);
            if (scrollToNextCommandKeybinding) {
                const label = scrollToNextCommandKeybinding.getLabel();
                if (label) {
                    hoverTitle += '\n' + (0, nls_1.localize)('labelWithKeybinding', "{0} ({1})", terminalStrings_1.terminalStrings.scrollToNextCommand.value, label);
                }
            }
            hoverOverlay.title = hoverTitle;
            const scrollBarWidth = this._xterm.raw._core.viewport?.scrollBarWidth;
            if (scrollBarWidth !== undefined) {
                this._element.style.right = `${scrollBarWidth}px`;
            }
            this._stickyScrollOverlay.open(this._element);
            // Scroll to the command on click
            this._register((0, dom_1.addStandardDisposableListener)(hoverOverlay, 'click', () => {
                if (this._xterm && this._currentStickyCommand) {
                    this._xterm.markTracker.revealCommand(this._currentStickyCommand);
                    this._instance.focus();
                }
            }));
            // Forward mouse events to the terminal
            this._register((0, dom_1.addStandardDisposableListener)(hoverOverlay, 'wheel', e => this._xterm?.raw.element?.dispatchEvent(new WheelEvent(e.type, e))));
            // Context menu - stop propagation on mousedown because rightClickBehavior listens on
            // mousedown, not contextmenu
            this._register((0, dom_1.addDisposableListener)(hoverOverlay, 'mousedown', e => {
                e.stopImmediatePropagation();
                e.preventDefault();
            }));
            this._register((0, dom_1.addDisposableListener)(hoverOverlay, 'contextmenu', e => {
                e.stopImmediatePropagation();
                e.preventDefault();
                (0, terminalContextMenu_1.openContextMenu)((0, dom_1.getWindow)(hoverOverlay), e, this._instance, this._contextMenu, this._contextMenuService);
            }));
            // Instead of juggling decorations for hover styles, swap out the theme to indicate the
            // hover state. This comes with the benefit over other methods of working well with special
            // decorative characters like powerline symbols.
            this._register((0, dom_1.addStandardDisposableListener)(hoverOverlay, 'mouseover', () => overlay.options.theme = this._getTheme(true)));
            this._register((0, dom_1.addStandardDisposableListener)(hoverOverlay, 'mouseleave', () => overlay.options.theme = this._getTheme(false)));
        }
        _syncOptions() {
            if (!this._stickyScrollOverlay) {
                return;
            }
            this._stickyScrollOverlay.resize(this._xterm.raw.cols, this._stickyScrollOverlay.rows);
            this._stickyScrollOverlay.options = this._getOptions();
            this._syncGpuAccelerationState();
        }
        _syncGpuAccelerationState() {
            if (!this._stickyScrollOverlay) {
                return;
            }
            const overlay = this._stickyScrollOverlay;
            // The Webgl renderer isn't used here as there are a limited number of webgl contexts
            // available within a given page. This is a single row that isn't rendered too often so the
            // performance isn't as important
            if (this._xterm.isGpuAccelerated) {
                if (!this._canvasAddon.value && !this._pendingCanvasAddon) {
                    this._pendingCanvasAddon = (0, async_1.createCancelablePromise)(async (token) => {
                        const CanvasAddon = await this._getCanvasAddonConstructor();
                        if (!token.isCancellationRequested && !this._store.isDisposed) {
                            this._canvasAddon.value = new CanvasAddon();
                            if (this._canvasAddon.value) { // The MutableDisposable could be disposed
                                overlay.loadAddon(this._canvasAddon.value);
                            }
                        }
                        this._pendingCanvasAddon = undefined;
                    });
                }
            }
            else {
                this._canvasAddon.clear();
                this._pendingCanvasAddon?.cancel();
                this._pendingCanvasAddon = undefined;
            }
        }
        _getOptions() {
            const o = this._xterm.raw.options;
            return {
                allowTransparency: true,
                cursorInactiveStyle: 'none',
                scrollback: 0,
                logLevel: 'off',
                theme: this._getTheme(false),
                documentOverride: o.documentOverride,
                fontFamily: o.fontFamily,
                fontWeight: o.fontWeight,
                fontWeightBold: o.fontWeightBold,
                fontSize: o.fontSize,
                letterSpacing: o.letterSpacing,
                lineHeight: o.lineHeight,
                drawBoldTextInBrightColors: o.drawBoldTextInBrightColors,
                minimumContrastRatio: o.minimumContrastRatio,
                tabStopWidth: o.tabStopWidth,
                overviewRulerWidth: o.overviewRulerWidth,
            };
        }
        _getTheme(isHovering) {
            const theme = this._themeService.getColorTheme();
            return {
                ...this._xterm.getXtermTheme(),
                background: isHovering
                    ? theme.getColor(terminalStickyScrollColorRegistry_1.terminalStickyScrollHoverBackground)?.toString() ?? this._xtermColorProvider.getBackgroundColor(theme)?.toString()
                    : theme.getColor(terminalStickyScrollColorRegistry_1.terminalStickyScrollBackground)?.toString() ?? this._xtermColorProvider.getBackgroundColor(theme)?.toString(),
                selectionBackground: undefined,
                selectionInactiveBackground: undefined
            };
        }
        async _getCanvasAddonConstructor() {
            const m = await (0, amdX_1.importAMDNodeModule)('@xterm/addon-canvas', 'lib/xterm-addon-canvas.js');
            return m.CanvasAddon;
        }
        async _getSerializeAddonConstructor() {
            const m = await (0, amdX_1.importAMDNodeModule)('@xterm/addon-serialize', 'lib/addon-serialize.js');
            return m.SerializeAddon;
        }
    };
    exports.TerminalStickyScrollOverlay = TerminalStickyScrollOverlay;
    __decorate([
        (0, decorators_1.throttle)(0)
    ], TerminalStickyScrollOverlay.prototype, "_syncOptions", null);
    __decorate([
        decorators_1.memoize
    ], TerminalStickyScrollOverlay.prototype, "_getCanvasAddonConstructor", null);
    __decorate([
        decorators_1.memoize
    ], TerminalStickyScrollOverlay.prototype, "_getSerializeAddonConstructor", null);
    exports.TerminalStickyScrollOverlay = TerminalStickyScrollOverlay = __decorate([
        __param(5, configuration_1.IConfigurationService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, actions_1.IMenuService),
        __param(10, themeService_1.IThemeService)
    ], TerminalStickyScrollOverlay);
    function lineStartsWith(line, text) {
        if (!line) {
            return false;
        }
        for (let i = 0; i < text.length; i++) {
            if (line.getCell(i)?.getChars() !== text[i]) {
                return false;
            }
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdGlja3lTY3JvbGxPdmVybGF5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL3N0aWNreVNjcm9sbC9icm93c2VyL3Rlcm1pbmFsU3RpY2t5U2Nyb2xsT3ZlcmxheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBZ0NBLElBQVcsWUFJVjtJQUpELFdBQVcsWUFBWTtRQUN0QixnREFBZ0Q7UUFDaEQsNkNBQU8sQ0FBQTtRQUNQLDJDQUFNLENBQUE7SUFDUCxDQUFDLEVBSlUsWUFBWSxLQUFaLFlBQVksUUFJdEI7SUFFRCxJQUFXLFVBRVY7SUFGRCxXQUFXLFVBQVU7UUFDcEIsaUNBQW1CLENBQUE7SUFDcEIsQ0FBQyxFQUZVLFVBQVUsS0FBVixVQUFVLFFBRXBCO0lBRUQsSUFBVyxTQUVWO0lBRkQsV0FBVyxTQUFTO1FBQ25CLHFGQUErQixDQUFBO0lBQ2hDLENBQUMsRUFGVSxTQUFTLEtBQVQsU0FBUyxRQUVuQjtJQUVNLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFrQjFELFlBQ2tCLFNBQTRCLEVBQzVCLE1BQWtELEVBQ2xELG1CQUF3QyxFQUN4QyxpQkFBOEMsRUFDL0QsU0FBd0MsRUFDakIsb0JBQTJDLEVBQzlDLGlCQUFxQyxFQUNwQyxtQkFBeUQsRUFDMUQsa0JBQXVELEVBQzdELFdBQXlCLEVBQ3hCLGFBQTZDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBWlMsY0FBUyxHQUFULFNBQVMsQ0FBbUI7WUFDNUIsV0FBTSxHQUFOLE1BQU0sQ0FBNEM7WUFDbEQsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUN4QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQTZCO1lBSXpCLHdCQUFtQixHQUFuQixt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