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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/workbench/contrib/terminal/browser/xterm/markNavigationAddon", "vs/nls", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/platform/terminal/common/xterm/shellIntegrationAddon", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/xterm/decorationAddon", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/amdX", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/clipboard/common/clipboardService", "vs/base/common/decorators", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/mouseEvent", "vs/platform/layout/browser/layoutService", "vs/platform/accessibilitySignal/browser/accessibilitySignalService"], function (require, exports, dom, configuration_1, lifecycle_1, terminal_1, terminal_2, log_1, notification_1, markNavigationAddon_1, nls_1, themeService_1, theme_1, terminalColorRegistry_1, shellIntegrationAddon_1, instantiation_1, decorationAddon_1, event_1, telemetry_1, amdX_1, contextkey_1, terminalContextKey_1, clipboardService_1, decorators_1, scrollableElement_1, mouseEvent_1, layoutService_1, accessibilitySignalService_1) {
    "use strict";
    var XtermTerminal_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.XtermTerminal = void 0;
    exports.getXtermScaledDimensions = getXtermScaledDimensions;
    var RenderConstants;
    (function (RenderConstants) {
        RenderConstants[RenderConstants["SmoothScrollDuration"] = 125] = "SmoothScrollDuration";
    })(RenderConstants || (RenderConstants = {}));
    let CanvasAddon;
    let ImageAddon;
    let SearchAddon;
    let SerializeAddon;
    let Unicode11Addon;
    let WebglAddon;
    function getFullBufferLineAsString(lineIndex, buffer) {
        let line = buffer.getLine(lineIndex);
        if (!line) {
            return { lineData: undefined, lineIndex };
        }
        let lineData = line.translateToString(true);
        while (lineIndex > 0 && line.isWrapped) {
            line = buffer.getLine(--lineIndex);
            if (!line) {
                break;
            }
            lineData = line.translateToString(false) + lineData;
        }
        return { lineData, lineIndex };
    }
    // DEBUG: This helper can be used to draw image data to the console, it's commented out as we don't
    //        want to ship it, but this is very useful for investigating texture atlas issues.
    // (console as any).image = (source: ImageData | HTMLCanvasElement, scale: number = 1) => {
    // 	function getBox(width: number, height: number) {
    // 		return {
    // 			string: '+',
    // 			style: 'font-size: 1px; padding: ' + Math.floor(height/2) + 'px ' + Math.floor(width/2) + 'px; line-height: ' + height + 'px;'
    // 		};
    // 	}
    // 	if (source instanceof HTMLCanvasElement) {
    // 		source = source.getContext('2d')?.getImageData(0, 0, source.width, source.height)!;
    // 	}
    // 	const canvas = document.createElement('canvas');
    // 	canvas.width = source.width;
    // 	canvas.height = source.height;
    // 	const ctx = canvas.getContext('2d')!;
    // 	ctx.putImageData(source, 0, 0);
    // 	const sw = source.width * scale;
    // 	const sh = source.height * scale;
    // 	const dim = getBox(sw, sh);
    // 	console.log(
    // 		`Image: ${source.width} x ${source.height}\n%c${dim.string}`,
    // 		`${dim.style}background: url(${canvas.toDataURL()}); background-size: ${sw}px ${sh}px; background-repeat: no-repeat; color: transparent;`
    // 	);
    // 	console.groupCollapsed('Zoomed');
    // 	console.log(
    // 		`%c${dim.string}`,
    // 		`${getBox(sw * 10, sh * 10).style}background: url(${canvas.toDataURL()}); background-size: ${sw * 10}px ${sh * 10}px; background-repeat: no-repeat; color: transparent; image-rendering: pixelated;-ms-interpolation-mode: nearest-neighbor;`
    // 	);
    // 	console.groupEnd();
    // };
    /**
     * Wraps the xterm object with additional functionality. Interaction with the backing process is out
     * of the scope of this class.
     */
    let XtermTerminal = class XtermTerminal extends lifecycle_1.Disposable {
        static { XtermTerminal_1 = this; }
        static { this._suggestedRendererType = undefined; }
        static { this._checkedWebglCompatible = false; }
        get findResult() { return this._lastFindResult; }
        get isStdinDisabled() { return !!this.raw.options.disableStdin; }
        get isGpuAccelerated() { return !!(this._canvasAddon || this._webglAddon); }
        get markTracker() { return this._markNavigationAddon; }
        get shellIntegration() { return this._shellIntegrationAddon; }
        get textureAtlas() {
            const canvas = this._webglAddon?.textureAtlas || this._canvasAddon?.textureAtlas;
            if (!canvas) {
                return undefined;
            }
            return createImageBitmap(canvas);
        }
        get isFocused() {
            if (!this.raw.element) {
                return false;
            }
            return dom.isAncestorOfActiveElement(this.raw.element);
        }
        /**
         * @param xtermCtor The xterm.js constructor, this is passed in so it can be fetched lazily
         * outside of this class such that {@link raw} is not nullable.
         */
        constructor(xtermCtor, cols, rows, _xtermColorProvider, _capabilities, shellIntegrationNonce, disableShellIntegrationReporting, _configurationService, _instantiationService, _logService, _notificationService, _themeService, _telemetryService, _terminalConfigurationService, _clipboardService, contextKeyService, _accessibilitySignalService, layoutService) {
            super();
            this._xtermColorProvider = _xtermColorProvider;
            this._capabilities = _capabilities;
            this._configurationService = _configurationService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._notificationService = _notificationService;
            this._themeService = _themeService;
            this._telemetryService = _telemetryService;
            this._terminalConfigurationService = _terminalConfigurationService;
            this._clipboardService = _clipboardService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._isPhysicalMouseWheel = scrollableElement_1.MouseWheelClassifier.INSTANCE.isPhysicalMouseWheel();
            this._attachedDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onDidRequestRunCommand = this._register(new event_1.Emitter());
            this.onDidRequestRunCommand = this._onDidRequestRunCommand.event;
            this._onDidRequestFocus = this._register(new event_1.Emitter());
            this.onDidRequestFocus = this._onDidRequestFocus.event;
            this._onDidRequestSendText = this._register(new event_1.Emitter());
            this.onDidRequestSendText = this._onDidRequestSendText.event;
            this._onDidRequestFreePort = this._register(new event_1.Emitter());
            this.onDidRequestFreePort = this._onDidRequestFreePort.event;
            this._onDidChangeFindResults = this._register(new event_1.Emitter());
            this.onDidChangeFindResults = this._onDidChangeFindResults.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeFocus = this._register(new event_1.Emitter());
            this.onDidChangeFocus = this._onDidChangeFocus.event;
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            const font = this._terminalConfigurationService.getFont(dom.getActiveWindow(), undefined, true);
            const config = this._terminalConfigurationService.config;
            const editorOptions = this._configurationService.getValue('editor');
            this.raw = this._register(new xtermCtor({
                allowProposedApi: true,
                cols,
                rows,
                documentOverride: layoutService.mainContainer.ownerDocument,
                altClickMovesCursor: config.altClickMovesCursor && editorOptions.multiCursorModifier === 'alt',
                scrollback: config.scrollback,
                theme: this.getXtermTheme(),
                drawBoldTextInBrightColors: config.drawBoldTextInBrightColors,
                fontFamily: font.fontFamily,
                fontWeight: config.fontWeight,
                fontWeightBold: config.fontWeightBold,
                fontSize: font.fontSize,
                letterSpacing: font.letterSpacing,
                lineHeight: font.lineHeight,
                logLevel: vscodeToXtermLogLevel(this._logService.getLevel()),
                logger: this._logService,
                minimumContrastRatio: config.minimumContrastRatio,
                tabStopWidth: config.tabStopWidth,
                cursorBlink: config.cursorBlinking,
                cursorStyle: vscodeToXtermCursorStyle(config.cursorStyle),
                cursorInactiveStyle: vscodeToXtermCursorStyle(config.cursorStyleInactive),
                cursorWidth: config.cursorWidth,
                macOptionIsMeta: config.macOptionIsMeta,
                macOptionClickForcesSelection: config.macOptionClickForcesSelection,
                rightClickSelectsWord: config.rightClickBehavior === 'selectWord',
                fastScrollModifier: 'alt',
                fastScrollSensitivity: config.fastScrollSensitivity,
                scrollSensitivity: config.mouseWheelScrollSensitivity,
                wordSeparator: config.wordSeparators,
                overviewRulerWidth: 10,
                ignoreBracketedPasteMode: config.ignoreBracketedPasteMode,
                rescaleOverlappingGlyphs: config.rescaleOverlappingGlyphs,
                windowOptions: {
                    getWinSizePixels: true,
                    getCellSizePixels: true,
                    getWinSizeChars: true,
                },
            }));
            this._updateSmoothScrolling();
            this._core = this.raw._core;
            this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("terminal.integrated.gpuAcceleration" /* TerminalSettingId.GpuAcceleration */)) {
                    XtermTerminal_1._suggestedRendererType = undefined;
                }
                if (e.affectsConfiguration('terminal.integrated') || e.affectsConfiguration('editor.fastScrollSensitivity') || e.affectsConfiguration('editor.mouseWheelScrollSensitivity') || e.affectsConfiguration('editor.multiCursorModifier')) {
                    this.updateConfig();
                }
                if (e.affectsConfiguration("terminal.integrated.unicodeVersion" /* TerminalSettingId.UnicodeVersion */)) {
                    this._updateUnicodeVersion();
                }
            }));
            this._register(this._themeService.onDidColorThemeChange(theme => this._updateTheme(theme)));
            this._register(this._logService.onDidChangeLogLevel(e => this.raw.options.logLevel = vscodeToXtermLogLevel(e)));
            // Refire events
            this._register(this.raw.onSelectionChange(() => {
                this._onDidChangeSelection.fire();
                if (this.isFocused) {
                    this._anyFocusedTerminalHasSelection.set(this.raw.hasSelection());
                }
            }));
            // Load addons
            this._updateUnicodeVersion();
            this._markNavigationAddon = this._instantiationService.createInstance(markNavigationAddon_1.MarkNavigationAddon, _capabilities);
            this.raw.loadAddon(this._markNavigationAddon);
            this._decorationAddon = this._instantiationService.createInstance(decorationAddon_1.DecorationAddon, this._capabilities);
            this._register(this._decorationAddon.onDidRequestRunCommand(e => this._onDidRequestRunCommand.fire(e)));
            this.raw.loadAddon(this._decorationAddon);
            this._shellIntegrationAddon = new shellIntegrationAddon_1.ShellIntegrationAddon(shellIntegrationNonce, disableShellIntegrationReporting, this._telemetryService, this._logService);
            this.raw.loadAddon(this._shellIntegrationAddon);
            this._anyTerminalFocusContextKey = terminalContextKey_1.TerminalContextKeys.focusInAny.bindTo(contextKeyService);
            this._anyFocusedTerminalHasSelection = terminalContextKey_1.TerminalContextKeys.textSelectedInFocused.bindTo(contextKeyService);
        }
        *getBufferReverseIterator() {
            for (let i = this.raw.buffer.active.length; i >= 0; i--) {
                const { lineData, lineIndex } = getFullBufferLineAsString(i, this.raw.buffer.active);
                if (lineData) {
                    i = lineIndex;
                    yield lineData;
                }
            }
        }
        async getContentsAsHtml() {
            if (!this._serializeAddon) {
                const Addon = await this._getSerializeAddonConstructor();
                this._serializeAddon = new Addon();
                this.raw.loadAddon(this._serializeAddon);
            }
            return this._serializeAddon.serializeAsHTML();
        }
        async getSelectionAsHtml(command) {
            if (!this._serializeAddon) {
                const Addon = await this._getSerializeAddonConstructor();
                this._serializeAddon = new Addon();
                this.raw.loadAddon(this._serializeAddon);
            }
            if (command) {
                const length = command.getOutput()?.length;
                const row = command.marker?.line;
                if (!length || !row) {
                    throw new Error(`No row ${row} or output length ${length} for command ${command}`);
                }
                this.raw.select(0, row + 1, length - Math.floor(length / this.raw.cols));
            }
            const result = this._serializeAddon.serializeAsHTML({ onlySelection: true });
            if (command) {
                this.raw.clearSelection();
            }
            return result;
        }
        attachToElement(container, partialOptions) {
            const options = { enableGpu: true, ...partialOptions };
            if (!this._attached) {
                this.raw.open(container);
            }
            // TODO: Move before open to the DOM renderer doesn't initialize
            if (options.enableGpu) {
                if (this._shouldLoadWebgl()) {
                    this._enableWebglRenderer();
                }
                else if (this._shouldLoadCanvas()) {
                    this._enableCanvasRenderer();
                }
            }
            if (!this.raw.element || !this.raw.textarea) {
                throw new Error('xterm elements not set after open');
            }
            const ad = this._attachedDisposables;
            ad.clear();
            ad.add(dom.addDisposableListener(this.raw.textarea, 'focus', () => this._setFocused(true)));
            ad.add(dom.addDisposableListener(this.raw.textarea, 'blur', () => this._setFocused(false)));
            ad.add(dom.addDisposableListener(this.raw.textarea, 'focusout', () => this._setFocused(false)));
            // Track wheel events in mouse wheel classifier and update smoothScrolling when it changes
            // as it must be disabled when a trackpad is used
            ad.add(dom.addDisposableListener(this.raw.element, dom.EventType.MOUSE_WHEEL, (e) => {
                const classifier = scrollableElement_1.MouseWheelClassifier.INSTANCE;
                classifier.acceptStandardWheelEvent(new mouseEvent_1.StandardWheelEvent(e));
                const value = classifier.isPhysicalMouseWheel();
                if (value !== this._isPhysicalMouseWheel) {
                    this._isPhysicalMouseWheel = value;
                    this._updateSmoothScrolling();
                }
            }, { passive: true }));
            this._attached = { container, options };
            // Screen must be created at this point as xterm.open is called
            return this._attached?.container.querySelector('.xterm-screen');
        }
        _setFocused(isFocused) {
            this._onDidChangeFocus.fire(isFocused);
            this._anyTerminalFocusContextKey.set(isFocused);
            this._anyFocusedTerminalHasSelection.set(isFocused && this.raw.hasSelection());
        }
        write(data, callback) {
            this.raw.write(data, callback);
        }
        resize(columns, rows) {
            this.raw.resize(columns, rows);
        }
        updateConfig() {
            const config = this._terminalConfigurationService.config;
            this.raw.options.altClickMovesCursor = config.altClickMovesCursor;
            this._setCursorBlink(config.cursorBlinking);
            this._setCursorStyle(config.cursorStyle);
            this._setCursorStyleInactive(config.cursorStyleInactive);
            this._setCursorWidth(config.cursorWidth);
            this.raw.options.scrollback = config.scrollback;
            this.raw.options.drawBoldTextInBrightColors = config.drawBoldTextInBrightColors;
            this.raw.options.minimumContrastRatio = config.minimumContrastRatio;
            this.raw.options.tabStopWidth = config.tabStopWidth;
            this.raw.options.fastScrollSensitivity = config.fastScrollSensitivity;
            this.raw.options.scrollSensitivity = config.mouseWheelScrollSensitivity;
            this.raw.options.macOptionIsMeta = config.macOptionIsMeta;
            const editorOptions = this._configurationService.getValue('editor');
            this.raw.options.altClickMovesCursor = config.altClickMovesCursor && editorOptions.multiCursorModifier === 'alt';
            this.raw.options.macOptionClickForcesSelection = config.macOptionClickForcesSelection;
            this.raw.options.rightClickSelectsWord = config.rightClickBehavior === 'selectWord';
            this.raw.options.wordSeparator = config.wordSeparators;
            this.raw.options.customGlyphs = config.customGlyphs;
            this.raw.options.ignoreBracketedPasteMode = config.ignoreBracketedPasteMode;
            this.raw.options.rescaleOverlappingGlyphs = config.rescaleOverlappingGlyphs;
            this._updateSmoothScrolling();
            if (this._attached?.options.enableGpu) {
                if (this._shouldLoadWebgl()) {
                    this._enableWebglRenderer();
                }
                else {
                    this._disposeOfWebglRenderer();
                    if (this._shouldLoadCanvas()) {
                        this._enableCanvasRenderer();
                    }
                    else {
                        this._disposeOfCanvasRenderer();
                    }
                }
            }
        }
        _updateSmoothScrolling() {
            this.raw.options.smoothScrollDuration = this._terminalConfigurationService.config.smoothScrolling && this._isPhysicalMouseWheel ? 125 /* RenderConstants.SmoothScrollDuration */ : 0;
        }
        _shouldLoadWebgl() {
            return (this._terminalConfigurationService.config.gpuAcceleration === 'auto' && XtermTerminal_1._suggestedRendererType === undefined) || this._terminalConfigurationService.config.gpuAcceleration === 'on';
        }
        _shouldLoadCanvas() {
            return this._terminalConfigurationService.config.gpuAcceleration === 'canvas';
        }
        forceRedraw() {
            this.raw.clearTextureAtlas();
        }
        clearDecorations() {
            this._decorationAddon?.clearDecorations();
        }
        forceRefresh() {
            this._core.viewport?._innerRefresh();
        }
        async findNext(term, searchOptions) {
            this._updateFindColors(searchOptions);
            return (await this._getSearchAddon()).findNext(term, searchOptions);
        }
        async findPrevious(term, searchOptions) {
            this._updateFindColors(searchOptions);
            return (await this._getSearchAddon()).findPrevious(term, searchOptions);
        }
        _updateFindColors(searchOptions) {
            const theme = this._themeService.getColorTheme();
            // Theme color names align with monaco/vscode whereas xterm.js has some different naming.
            // The mapping is as follows:
            // - findMatch -> activeMatch
            // - findMatchHighlight -> match
            const terminalBackground = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR) || theme.getColor(theme_1.PANEL_BACKGROUND);
            const findMatchBackground = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_BACKGROUND_COLOR);
            const findMatchBorder = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_BORDER_COLOR);
            const findMatchOverviewRuler = theme.getColor(terminalColorRegistry_1.TERMINAL_OVERVIEW_RULER_CURSOR_FOREGROUND_COLOR);
            const findMatchHighlightBackground = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_HIGHLIGHT_BACKGROUND_COLOR);
            const findMatchHighlightBorder = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_HIGHLIGHT_BORDER_COLOR);
            const findMatchHighlightOverviewRuler = theme.getColor(terminalColorRegistry_1.TERMINAL_OVERVIEW_RULER_FIND_MATCH_FOREGROUND_COLOR);
            searchOptions.decorations = {
                activeMatchBackground: findMatchBackground?.toString(),
                activeMatchBorder: findMatchBorder?.toString() || 'transparent',
                activeMatchColorOverviewRuler: findMatchOverviewRuler?.toString() || 'transparent',
                // decoration bgs don't support the alpha channel so blend it with the regular bg
                matchBackground: terminalBackground ? findMatchHighlightBackground?.blend(terminalBackground).toString() : undefined,
                matchBorder: findMatchHighlightBorder?.toString() || 'transparent',
                matchOverviewRuler: findMatchHighlightOverviewRuler?.toString() || 'transparent'
            };
        }
        _getSearchAddon() {
            if (!this._searchAddonPromise) {
                this._searchAddonPromise = this._getSearchAddonConstructor().then((AddonCtor) => {
                    this._searchAddon = new AddonCtor({ highlightLimit: 1000 /* XtermTerminalConstants.SearchHighlightLimit */ });
                    this.raw.loadAddon(this._searchAddon);
                    this._searchAddon.onDidChangeResults((results) => {
                        this._lastFindResult = results;
                        this._onDidChangeFindResults.fire(results);
                    });
                    return this._searchAddon;
                });
            }
            return this._searchAddonPromise;
        }
        clearSearchDecorations() {
            this._searchAddon?.clearDecorations();
        }
        clearActiveSearchDecoration() {
            this._searchAddon?.clearActiveDecoration();
        }
        getFont() {
            return this._terminalConfigurationService.getFont(dom.getWindow(this.raw.element), this._core);
        }
        getLongestViewportWrappedLineLength() {
            let maxLineLength = 0;
            for (let i = this.raw.buffer.active.length - 1; i >= this.raw.buffer.active.viewportY; i--) {
                const lineInfo = this._getWrappedLineCount(i, this.raw.buffer.active);
                maxLineLength = Math.max(maxLineLength, ((lineInfo.lineCount * this.raw.cols) - lineInfo.endSpaces) || 0);
                i = lineInfo.currentIndex;
            }
            return maxLineLength;
        }
        _getWrappedLineCount(index, buffer) {
            let line = buffer.getLine(index);
            if (!line) {
                throw new Error('Could not get line');
            }
            let currentIndex = index;
            let endSpaces = 0;
            // line.length may exceed cols as it doesn't necessarily trim the backing array on resize
            for (let i = Math.min(line.length, this.raw.cols) - 1; i >= 0; i--) {
                if (!line?.getCell(i)?.getChars()) {
                    endSpaces++;
                }
                else {
                    break;
                }
            }
            while (line?.isWrapped && currentIndex > 0) {
                currentIndex--;
                line = buffer.getLine(currentIndex);
            }
            return { lineCount: index - currentIndex + 1, currentIndex, endSpaces };
        }
        scrollDownLine() {
            this.raw.scrollLines(1);
        }
        scrollDownPage() {
            this.raw.scrollPages(1);
        }
        scrollToBottom() {
            this.raw.scrollToBottom();
        }
        scrollUpLine() {
            this.raw.scrollLines(-1);
        }
        scrollUpPage() {
            this.raw.scrollPages(-1);
        }
        scrollToTop() {
            this.raw.scrollToTop();
        }
        scrollToLine(line, position = 0 /* ScrollPosition.Top */) {
            this.markTracker.scrollToLine(line, position);
        }
        clearBuffer() {
            this.raw.clear();
            // xterm.js does not clear the first prompt, so trigger these to simulate
            // the prompt being written
            this._capabilities.get(2 /* TerminalCapability.CommandDetection */)?.handlePromptStart();
            this._capabilities.get(2 /* TerminalCapability.CommandDetection */)?.handleCommandStart();
            this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.clear);
        }
        hasSelection() {
            return this.raw.hasSelection();
        }
        clearSelection() {
            this.raw.clearSelection();
        }
        selectMarkedRange(fromMarkerId, toMarkerId, scrollIntoView = false) {
            const detectionCapability = this.shellIntegration.capabilities.get(4 /* TerminalCapability.BufferMarkDetection */);
            if (!detectionCapability) {
                return;
            }
            const start = detectionCapability.getMark(fromMarkerId);
            const end = detectionCapability.getMark(toMarkerId);
            if (start === undefined || end === undefined) {
                return;
            }
            this.raw.selectLines(start.line, end.line);
            if (scrollIntoView) {
                this.raw.scrollToLine(start.line);
            }
        }
        selectAll() {
            this.raw.focus();
            this.raw.selectAll();
        }
        focus() {
            this.raw.focus();
        }
        async copySelection(asHtml, command) {
            if (this.hasSelection() || (asHtml && command)) {
                if (asHtml) {
                    const textAsHtml = await this.getSelectionAsHtml(command);
                    function listener(e) {
                        if (!e.clipboardData.types.includes('text/plain')) {
                            e.clipboardData.setData('text/plain', command?.getOutput() ?? '');
                        }
                        e.clipboardData.setData('text/html', textAsHtml);
                        e.preventDefault();
                    }
                    const doc = dom.getDocument(this.raw.element);
                    doc.addEventListener('copy', listener);
                    doc.execCommand('copy');
                    doc.removeEventListener('copy', listener);
                }
                else {
                    await this._clipboardService.writeText(this.raw.getSelection());
                }
            }
            else {
                this._notificationService.warn((0, nls_1.localize)('terminal.integrated.copySelection.noSelection', 'The terminal has no selection to copy'));
            }
        }
        _setCursorBlink(blink) {
            if (this.raw.options.cursorBlink !== blink) {
                this.raw.options.cursorBlink = blink;
                this.raw.refresh(0, this.raw.rows - 1);
            }
        }
        _setCursorStyle(style) {
            const mapped = vscodeToXtermCursorStyle(style);
            if (this.raw.options.cursorStyle !== mapped) {
                this.raw.options.cursorStyle = mapped;
            }
        }
        _setCursorStyleInactive(style) {
            const mapped = vscodeToXtermCursorStyle(style);
            if (this.raw.options.cursorInactiveStyle !== mapped) {
                this.raw.options.cursorInactiveStyle = mapped;
            }
        }
        _setCursorWidth(width) {
            if (this.raw.options.cursorWidth !== width) {
                this.raw.options.cursorWidth = width;
            }
        }
        async _enableWebglRenderer() {
            if (!this.raw.element || this._webglAddon) {
                return;
            }
            // Check if the the WebGL renderer is compatible with xterm.js:
            // - https://github.com/microsoft/vscode/issues/190195
            // - https://github.com/xtermjs/xterm.js/issues/4665
            // - https://bugs.chromium.org/p/chromium/issues/detail?id=1476475
            if (!XtermTerminal_1._checkedWebglCompatible) {
                XtermTerminal_1._checkedWebglCompatible = true;
                const checkCanvas = document.createElement('canvas');
                const checkGl = checkCanvas.getContext('webgl2');
                const debugInfo = checkGl?.getExtension('WEBGL_debug_renderer_info');
                if (checkGl && debugInfo) {
                    const renderer = checkGl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    if (renderer.startsWith('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)')) {
                        this._disableWebglForThisSession();
                        return;
                    }
                }
            }
            const Addon = await this._getWebglAddonConstructor();
            this._webglAddon = new Addon();
            this._disposeOfCanvasRenderer();
            try {
                this.raw.loadAddon(this._webglAddon);
                this._logService.trace('Webgl was loaded');
                this._webglAddon.onContextLoss(() => {
                    this._logService.info(`Webgl lost context, disposing of webgl renderer`);
                    this._disposeOfWebglRenderer();
                });
                this._refreshImageAddon();
                // Uncomment to add the texture atlas to the DOM
                // setTimeout(() => {
                // 	if (this._webglAddon?.textureAtlas) {
                // 		document.body.appendChild(this._webglAddon?.textureAtlas);
                // 	}
                // }, 5000);
            }
            catch (e) {
                this._logService.warn(`Webgl could not be loaded. Falling back to the DOM renderer`, e);
                this._disableWebglForThisSession();
            }
        }
        _disableWebglForThisSession() {
            XtermTerminal_1._suggestedRendererType = 'dom';
            this._disposeOfWebglRenderer();
        }
        /**
         * @deprecated This will be removed in the future, see https://github.com/microsoft/vscode/issues/209276
         */
        async _enableCanvasRenderer() {
            if (!this.raw.element || this._canvasAddon) {
                return;
            }
            const Addon = await this._getCanvasAddonConstructor();
            this._canvasAddon = new Addon();
            this._disposeOfWebglRenderer();
            try {
                this.raw.loadAddon(this._canvasAddon);
                this._logService.trace('Canvas renderer was loaded');
            }
            catch (e) {
                this._logService.warn(`Canvas renderer could not be loaded, falling back to dom renderer`, e);
                XtermTerminal_1._suggestedRendererType = 'dom';
                this._disposeOfCanvasRenderer();
            }
            this._refreshImageAddon();
        }
        async _getCanvasAddonConstructor() {
            if (!CanvasAddon) {
                CanvasAddon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-canvas', 'lib/xterm-addon-canvas.js')).CanvasAddon;
            }
            return CanvasAddon;
        }
        async _refreshImageAddon() {
            // Only allow the image addon when a canvas is being used to avoid possible GPU issues
            if (this._terminalConfigurationService.config.enableImages && (this._canvasAddon || this._webglAddon)) {
                if (!this._imageAddon) {
                    const AddonCtor = await this._getImageAddonConstructor();
                    this._imageAddon = new AddonCtor();
                    this.raw.loadAddon(this._imageAddon);
                }
            }
            else {
                try {
                    this._imageAddon?.dispose();
                }
                catch {
                    // ignore
                }
                this._imageAddon = undefined;
            }
        }
        async _getImageAddonConstructor() {
            if (!ImageAddon) {
                ImageAddon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-image', 'lib/addon-image.js')).ImageAddon;
            }
            return ImageAddon;
        }
        async _getSearchAddonConstructor() {
            if (!SearchAddon) {
                SearchAddon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-search', 'lib/addon-search.js')).SearchAddon;
            }
            return SearchAddon;
        }
        async _getUnicode11Constructor() {
            if (!Unicode11Addon) {
                Unicode11Addon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-unicode11', 'lib/addon-unicode11.js')).Unicode11Addon;
            }
            return Unicode11Addon;
        }
        async _getWebglAddonConstructor() {
            if (!WebglAddon) {
                WebglAddon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-webgl', 'lib/addon-webgl.js')).WebglAddon;
            }
            return WebglAddon;
        }
        async _getSerializeAddonConstructor() {
            if (!SerializeAddon) {
                SerializeAddon = (await (0, amdX_1.importAMDNodeModule)('@xterm/addon-serialize', 'lib/addon-serialize.js')).SerializeAddon;
            }
            return SerializeAddon;
        }
        _disposeOfCanvasRenderer() {
            try {
                this._canvasAddon?.dispose();
            }
            catch {
                // ignore
            }
            this._canvasAddon = undefined;
            this._refreshImageAddon();
        }
        _disposeOfWebglRenderer() {
            try {
                this._webglAddon?.dispose();
            }
            catch {
                // ignore
            }
            this._webglAddon = undefined;
            this._refreshImageAddon();
        }
        getXtermTheme(theme) {
            if (!theme) {
                theme = this._themeService.getColorTheme();
            }
            const foregroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_FOREGROUND_COLOR);
            const backgroundColor = this._xtermColorProvider.getBackgroundColor(theme);
            const cursorColor = theme.getColor(terminalColorRegistry_1.TERMINAL_CURSOR_FOREGROUND_COLOR) || foregroundColor;
            const cursorAccentColor = theme.getColor(terminalColorRegistry_1.TERMINAL_CURSOR_BACKGROUND_COLOR) || backgroundColor;
            const selectionBackgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_SELECTION_BACKGROUND_COLOR);
            const selectionInactiveBackgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_INACTIVE_SELECTION_BACKGROUND_COLOR);
            const selectionForegroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_SELECTION_FOREGROUND_COLOR) || undefined;
            return {
                background: backgroundColor?.toString(),
                foreground: foregroundColor?.toString(),
                cursor: cursorColor?.toString(),
                cursorAccent: cursorAccentColor?.toString(),
                selectionBackground: selectionBackgroundColor?.toString(),
                selectionInactiveBackground: selectionInactiveBackgroundColor?.toString(),
                selectionForeground: selectionForegroundColor?.toString(),
                black: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[0])?.toString(),
                red: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[1])?.toString(),
                green: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[2])?.toString(),
                yellow: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[3])?.toString(),
                blue: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[4])?.toString(),
                magenta: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[5])?.toString(),
                cyan: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[6])?.toString(),
                white: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[7])?.toString(),
                brightBlack: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[8])?.toString(),
                brightRed: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[9])?.toString(),
                brightGreen: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[10])?.toString(),
                brightYellow: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[11])?.toString(),
                brightBlue: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[12])?.toString(),
                brightMagenta: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[13])?.toString(),
                brightCyan: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[14])?.toString(),
                brightWhite: theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[15])?.toString()
            };
        }
        _updateTheme(theme) {
            this.raw.options.theme = this.getXtermTheme(theme);
        }
        refresh() {
            this._updateTheme();
            this._decorationAddon.refreshLayouts();
        }
        async _updateUnicodeVersion() {
            if (!this._unicode11Addon && this._terminalConfigurationService.config.unicodeVersion === '11') {
                const Addon = await this._getUnicode11Constructor();
                this._unicode11Addon = new Addon();
                this.raw.loadAddon(this._unicode11Addon);
            }
            if (this.raw.unicode.activeVersion !== this._terminalConfigurationService.config.unicodeVersion) {
                this.raw.unicode.activeVersion = this._terminalConfigurationService.config.unicodeVersion;
            }
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _writeText(data) {
            this.raw.write(data);
        }
        dispose() {
            this._anyTerminalFocusContextKey.reset();
            this._anyFocusedTerminalHasSelection.reset();
            this._onDidDispose.fire();
            super.dispose();
        }
    };
    exports.XtermTerminal = XtermTerminal;
    __decorate([
        (0, decorators_1.debounce)(100)
    ], XtermTerminal.prototype, "_refreshImageAddon", null);
    exports.XtermTerminal = XtermTerminal = XtermTerminal_1 = __decorate([
        __param(7, configuration_1.IConfigurationService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, terminal_1.ITerminalLogService),
        __param(10, notification_1.INotificationService),
        __param(11, themeService_1.IThemeService),
        __param(12, telemetry_1.ITelemetryService),
        __param(13, terminal_2.ITerminalConfigurationService),
        __param(14, clipboardService_1.IClipboardService),
        __param(15, contextkey_1.IContextKeyService),
        __param(16, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(17, layoutService_1.ILayoutService)
    ], XtermTerminal);
    function getXtermScaledDimensions(w, font, width, height) {
        if (!font.charWidth || !font.charHeight) {
            return null;
        }
        // Because xterm.js converts from CSS pixels to actual pixels through
        // the use of canvas, window.devicePixelRatio needs to be used here in
        // order to be precise. font.charWidth/charHeight alone as insufficient
        // when window.devicePixelRatio changes.
        const scaledWidthAvailable = width * w.devicePixelRatio;
        const scaledCharWidth = font.charWidth * w.devicePixelRatio + font.letterSpacing;
        const cols = Math.max(Math.floor(scaledWidthAvailable / scaledCharWidth), 1);
        const scaledHeightAvailable = height * w.devicePixelRatio;
        const scaledCharHeight = Math.ceil(font.charHeight * w.devicePixelRatio);
        const scaledLineHeight = Math.floor(scaledCharHeight * font.lineHeight);
        const rows = Math.max(Math.floor(scaledHeightAvailable / scaledLineHeight), 1);
        return { rows, cols };
    }
    function vscodeToXtermLogLevel(logLevel) {
        switch (logLevel) {
            case log_1.LogLevel.Trace: return 'trace';
            case log_1.LogLevel.Debug: return 'debug';
            case log_1.LogLevel.Info: return 'info';
            case log_1.LogLevel.Warning: return 'warn';
            case log_1.LogLevel.Error: return 'error';
            default: return 'off';
        }
    }
    function vscodeToXtermCursorStyle(style) {
        // 'line' is used instead of bar in VS Code to be consistent with editor.cursorStyle
        if (style === 'line') {
            return 'bar';
        }
        return style;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHRlcm1UZXJtaW5hbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIveHRlcm0veHRlcm1UZXJtaW5hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBZzNCaEcsNERBb0JDO0lBNTFCRCxJQUFXLGVBRVY7SUFGRCxXQUFXLGVBQWU7UUFDekIsdUZBQTBCLENBQUE7SUFDM0IsQ0FBQyxFQUZVLGVBQWUsS0FBZixlQUFlLFFBRXpCO0lBRUQsSUFBSSxXQUFtQyxDQUFDO0lBQ3hDLElBQUksVUFBaUMsQ0FBQztJQUN0QyxJQUFJLFdBQW1DLENBQUM7SUFDeEMsSUFBSSxjQUF5QyxDQUFDO0lBQzlDLElBQUksY0FBeUMsQ0FBQztJQUM5QyxJQUFJLFVBQWlDLENBQUM7SUFFdEMsU0FBUyx5QkFBeUIsQ0FBQyxTQUFpQixFQUFFLE1BQWU7UUFDcEUsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWCxPQUFPLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsQ0FBQztRQUMzQyxDQUFDO1FBQ0QsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLE9BQU8sU0FBUyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDeEMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsTUFBTTtZQUNQLENBQUM7WUFDRCxRQUFRLEdBQUcsSUFB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