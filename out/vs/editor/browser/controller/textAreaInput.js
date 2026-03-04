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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/browser/performance", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/strings", "vs/editor/browser/controller/textAreaState", "vs/editor/common/core/selection", "vs/platform/accessibility/common/accessibility", "vs/platform/log/common/log"], function (require, exports, browser, dom, event_1, keyboardEvent_1, performance_1, async_1, event_2, lifecycle_1, mime_1, strings, textAreaState_1, selection_1, accessibility_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextAreaWrapper = exports.ClipboardEventUtils = exports.TextAreaInput = exports.InMemoryClipboardMetadataManager = exports.CopyOptions = exports.TextAreaSyntethicEvents = void 0;
    var TextAreaSyntethicEvents;
    (function (TextAreaSyntethicEvents) {
        TextAreaSyntethicEvents.Tap = '-monaco-textarea-synthetic-tap';
    })(TextAreaSyntethicEvents || (exports.TextAreaSyntethicEvents = TextAreaSyntethicEvents = {}));
    exports.CopyOptions = {
        forceCopyWithSyntaxHighlighting: false
    };
    /**
     * Every time we write to the clipboard, we record a bit of extra metadata here.
     * Every time we read from the cipboard, if the text matches our last written text,
     * we can fetch the previous metadata.
     */
    class InMemoryClipboardMetadataManager {
        static { this.INSTANCE = new InMemoryClipboardMetadataManager(); }
        constructor() {
            this._lastState = null;
        }
        set(lastCopiedValue, data) {
            this._lastState = { lastCopiedValue, data };
        }
        get(pastedText) {
            if (this._lastState && this._lastState.lastCopiedValue === pastedText) {
                // match!
                return this._lastState.data;
            }
            this._lastState = null;
            return null;
        }
    }
    exports.InMemoryClipboardMetadataManager = InMemoryClipboardMetadataManager;
    class CompositionContext {
        constructor() {
            this._lastTypeTextLength = 0;
        }
        handleCompositionUpdate(text) {
            text = text || '';
            const typeInput = {
                text: text,
                replacePrevCharCnt: this._lastTypeTextLength,
                replaceNextCharCnt: 0,
                positionDelta: 0
            };
            this._lastTypeTextLength = text.length;
            return typeInput;
        }
    }
    /**
     * Writes screen reader content to the textarea and is able to analyze its input events to generate:
     *  - onCut
     *  - onPaste
     *  - onType
     *
     * Composition events are generated for presentation purposes (composition input is reflected in onType).
     */
    let TextAreaInput = class TextAreaInput extends lifecycle_1.Disposable {
        get textAreaState() {
            return this._textAreaState;
        }
        constructor(_host, _textArea, _OS, _browser, _accessibilityService, _logService) {
            super();
            this._host = _host;
            this._textArea = _textArea;
            this._OS = _OS;
            this._browser = _browser;
            this._accessibilityService = _accessibilityService;
            this._logService = _logService;
            this._onFocus = this._register(new event_2.Emitter());
            this.onFocus = this._onFocus.event;
            this._onBlur = this._register(new event_2.Emitter());
            this.onBlur = this._onBlur.event;
            this._onKeyDown = this._register(new event_2.Emitter());
            this.onKeyDown = this._onKeyDown.event;
            this._onKeyUp = this._register(new event_2.Emitter());
            this.onKeyUp = this._onKeyUp.event;
            this._onCut = this._register(new event_2.Emitter());
            this.onCut = this._onCut.event;
            this._onPaste = this._register(new event_2.Emitter());
            this.onPaste = this._onPaste.event;
            this._onType = this._register(new event_2.Emitter());
            this.onType = this._onType.event;
            this._onCompositionStart = this._register(new event_2.Emitter());
            this.onCompositionStart = this._onCompositionStart.event;
            this._onCompositionUpdate = this._register(new event_2.Emitter());
            this.onCompositionUpdate = this._onCompositionUpdate.event;
            this._onCompositionEnd = this._register(new event_2.Emitter());
            this.onCompositionEnd = this._onCompositionEnd.event;
            this._onSelectionChangeRequest = this._register(new event_2.Emitter());
            this.onSelectionChangeRequest = this._onSelectionChangeRequest.event;
            this._asyncFocusGainWriteScreenReaderContent = this._register(new lifecycle_1.MutableDisposable());
            this._asyncTriggerCut = this._register(new async_1.RunOnceScheduler(() => this._onCut.fire(), 0));
            this._textAreaState = textAreaState_1.TextAreaState.EMPTY;
            this._selectionChangeListener = null;
            if (this._accessibilityService.isScreenReaderOptimized()) {
                this.writeNativeTextAreaContent('ctor');
            }
            this._register(event_2.Event.runAndSubscribe(this._accessibilityService.onDidChangeScreenReaderOptimized, () => {
                if (this._accessibilityService.isScreenReaderOptimized() && !this._asyncFocusGainWriteScreenReaderContent.value) {
                    this._asyncFocusGainWriteScreenReaderContent.value = this._register(new async_1.RunOnceScheduler(() => this.writeNativeTextAreaContent('asyncFocusGain'), 0));
                }
                else {
                    this._asyncFocusGainWriteScreenReaderContent.clear();
                }
            }));
            this._hasFocus = false;
            this._currentComposition = null;
            let lastKeyDown = null;
            this._register(this._textArea.onKeyDown((_e) => {
                const e = new keyboardEvent_1.StandardKeyboardEvent(_e);
                if (e.keyCode === 114 /* KeyCode.KEY_IN_COMPOSITION */
                    || (this._currentComposition && e.keyCode === 1 /* KeyCode.Backspace */)) {
                    // Stop propagation for keyDown events if the IME is processing key input
                    e.stopPropagation();
                }
                if (e.equals(9 /* KeyCode.Escape */)) {
                    // Prevent default always for `Esc`, otherwise it will generate a keypress
                    // See https://msdn.microsoft.com/en-us/library/ie/ms536939(v=vs.85).aspx
                    e.preventDefault();
                }
                lastKeyDown = e;
                this._onKeyDown.fire(e);
            }));
            this._register(this._textArea.onKeyUp((_e) => {
                const e = new keyboardEvent_1.StandardKeyboardEvent(_e);
                this._onKeyUp.fire(e);
            }));
            this._register(this._textArea.onCompositionStart((e) => {
                if (textAreaState_1._debugComposition) {
                    console.log(`[compositionstart]`, e);
                }
                const currentComposition = new CompositionContext();
                if (this._currentComposition) {
                    // simply reset the composition context
                    this._currentComposition = currentComposition;
                    return;
                }
                this._currentComposition = currentComposition;
                if (this._OS === 2 /* OperatingSystem.Macintosh */
                    && lastKeyDown
                    && lastKeyDown.equals(114 /* KeyCode.KEY_IN_COMPOSITION */)
                    && this._textAreaState.selectionStart === this._textAreaState.selectionEnd
                    && this._textAreaState.selectionStart > 0
                    && this._textAreaState.value.substr(this._textAreaState.selectionStart - 1, 1) === e.data
                    && (lastKeyDown.code === 'ArrowRight' || lastKeyDown.code === 'ArrowLeft')) {
                    // Handling long press case on Chromium/Safari macOS + arrow key => pretend the character was selected
                    if (textAreaState_1._debugComposition) {
                        console.log(`[compositionstart] Handling long press case on macOS + arrow key`, e);
                    }
                    // Pretend the previous character was composed (in order to get it removed by subsequent compositionupdate events)
                    currentComposition.handleCompositionUpdate('x');
                    this._onCompositionStart.fire({ data: e.data });
                    return;
                }
                if (this._browser.isAndroid) {
                    // when tapping on the editor, Android enters composition mode to edit the current word
                    // so we cannot clear the textarea on Android and we must pretend the current word was selected
                    this._onCompositionStart.fire({ data: e.data });
                    return;
                }
                this._onCompositionStart.fire({ data: e.data });
            }));
            this._register(this._textArea.onCompositionUpdate((e) => {
                if (textAreaState_1._debugComposition) {
                    console.log(`[compositionupdate]`, e);
                }
                const currentComposition = this._currentComposition;
                if (!currentComposition) {
                    // should not be possible to receive a 'compositionupdate' without a 'compositionstart'
                    return;
                }
                if (this._browser.isAndroid) {
                    // On Android, the data sent with the composition update event is unusable.
                    // For example, if the cursor is in the middle of a word like Mic|osoft
                    // and Microsoft is chosen from the keyboard's suggestions, the e.data will contain "Microsoft".
                    // This is not really usable because it doesn't tell us where the edit began and where it ended.
                    const newState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, this._textAreaState);
                    const typeInput = textAreaState_1.TextAreaState.deduceAndroidCompositionInput(this._textAreaState, newState);
                    this._textAreaState = newState;
                    this._onType.fire(typeInput);
                    this._onCompositionUpdate.fire(e);
                    return;
                }
                const typeInput = currentComposition.handleCompositionUpdate(e.data);
                this._textAreaState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, this._textAreaState);
                this._onType.fire(typeInput);
                this._onCompositionUpdate.fire(e);
            }));
            this._register(this._textArea.onCompositionEnd((e) => {
                if (textAreaState_1._debugComposition) {
                    console.log(`[compositionend]`, e);
                }
                const currentComposition = this._currentComposition;
                if (!currentComposition) {
                    // https://github.com/microsoft/monaco-editor/issues/1663
                    // On iOS 13.2, Chinese system IME randomly trigger an additional compositionend event with empty data
                    return;
                }
                this._currentComposition = null;
                if (this._browser.isAndroid) {
                    // On Android, the data sent with the composition update event is unusable.
                    // For example, if the cursor is in the middle of a word like Mic|osoft
                    // and Microsoft is chosen from the keyboard's suggestions, the e.data will contain "Microsoft".
                    // This is not really usable because it doesn't tell us where the edit began and where it ended.
                    const newState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, this._textAreaState);
                    const typeInput = textAreaState_1.TextAreaState.deduceAndroidCompositionInput(this._textAreaState, newState);
                    this._textAreaState = newState;
                    this._onType.fire(typeInput);
                    this._onCompositionEnd.fire();
                    return;
                }
                const typeInput = currentComposition.handleCompositionUpdate(e.data);
                this._textAreaState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, this._textAreaState);
                this._onType.fire(typeInput);
                this._onCompositionEnd.fire();
            }));
            this._register(this._textArea.onInput((e) => {
                if (textAreaState_1._debugComposition) {
                    console.log(`[input]`, e);
                }
                // Pretend here we touched the text area, as the `input` event will most likely
                // result in a `selectionchange` event which we want to ignore
                this._textArea.setIgnoreSelectionChangeTime('received input event');
                if (this._currentComposition) {
                    return;
                }
                const newState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, this._textAreaState);
                const typeInput = textAreaState_1.TextAreaState.deduceInput(this._textAreaState, newState, /*couldBeEmojiInput*/ this._OS === 2 /* OperatingSystem.Macintosh */);
                if (typeInput.replacePrevCharCnt === 0 && typeInput.text.length === 1) {
                    // one character was typed
                    if (strings.isHighSurrogate(typeInput.text.charCodeAt(0))
                        || typeInput.text.charCodeAt(0) === 0x7f /* Delete */) {
                        // Ignore invalid input but keep it around for next time
                        return;
                    }
                }
                this._textAreaState = newState;
                if (typeInput.text !== ''
                    || typeInput.replacePrevCharCnt !== 0
                    || typeInput.replaceNextCharCnt !== 0
                    || typeInput.positionDelta !== 0) {
                    this._onType.fire(typeInput);
                }
            }));
            // --- Clipboard operations
            this._register(this._textArea.onCut((e) => {
                // Pretend here we touched the text area, as the `cut` event will most likely
                // result in a `selectionchange` event which we want to ignore
                this._textArea.setIgnoreSelectionChangeTime('received cut event');
                this._ensureClipboardGetsEditorSelection(e);
                this._asyncTriggerCut.schedule();
            }));
            this._register(this._textArea.onCopy((e) => {
                this._ensureClipboardGetsEditorSelection(e);
            }));
            this._register(this._textArea.onPaste((e) => {
                // Pretend here we touched the text area, as the `paste` event will most likely
                // result in a `selectionchange` event which we want to ignore
                this._textArea.setIgnoreSelectionChangeTime('received paste event');
                e.preventDefault();
                if (!e.clipboardData) {
                    return;
                }
                let [text, metadata] = exports.ClipboardEventUtils.getTextData(e.clipboardData);
                if (!text) {
                    return;
                }
                // try the in-memory store
                metadata = metadata || InMemoryClipboardMetadataManager.INSTANCE.get(text);
                this._onPaste.fire({
                    text: text,
                    metadata: metadata
                });
            }));
            this._register(this._textArea.onFocus(() => {
                const hadFocus = this._hasFocus;
                this._setHasFocus(true);
                if (this._accessibilityService.isScreenReaderOptimized() && this._browser.isSafari && !hadFocus && this._hasFocus) {
                    // When "tabbing into" the textarea, immediately after dispatching the 'focus' event,
                    // Safari will always move the selection at offset 0 in the textarea
                    if (!this._asyncFocusGainWriteScreenReaderContent.value) {
                        this._asyncFocusGainWriteScreenReaderContent.value = new async_1.RunOnceScheduler(() => this.writeNativeTextAreaContent('asyncFocusGain'), 0);
                    }
                    this._asyncFocusGainWriteScreenReaderContent.value.schedule();
                }
            }));
            this._register(this._textArea.onBlur(() => {
                if (this._currentComposition) {
                    // See https://github.com/microsoft/vscode/issues/112621
                    // where compositionend is not triggered when the editor
                    // is taken off-dom during a composition
                    // Clear the flag to be able to write to the textarea
                    this._currentComposition = null;
                    // Clear the textarea to avoid an unwanted cursor type
                    this.writeNativeTextAreaContent('blurWithoutCompositionEnd');
                    // Fire artificial composition end
                    this._onCompositionEnd.fire();
                }
                this._setHasFocus(false);
            }));
            this._register(this._textArea.onSyntheticTap(() => {
                if (this._browser.isAndroid && this._currentComposition) {
                    // on Android, tapping does not cancel the current composition, so the
                    // textarea is stuck showing the old composition
                    // Clear the flag to be able to write to the textarea
                    this._currentComposition = null;
                    // Clear the textarea to avoid an unwanted cursor type
                    this.writeNativeTextAreaContent('tapWithoutCompositionEnd');
                    // Fire artificial composition end
                    this._onCompositionEnd.fire();
                }
            }));
        }
        _initializeFromTest() {
            this._hasFocus = true;
            this._textAreaState = textAreaState_1.TextAreaState.readFromTextArea(this._textArea, null);
        }
        _installSelectionChangeListener() {
            // See https://github.com/microsoft/vscode/issues/27216 and https://github.com/microsoft/vscode/issues/98256
            // When using a Braille display, it is possible for users to reposition the
            // system caret. This is reflected in Chrome as a `selectionchange` event.
            //
            // The `selectionchange` event appears to be emitted under numerous other circumstances,
            // so it is quite a challenge to distinguish a `selectionchange` coming in from a user
            // using a Braille display from all the other cases.
            //
            // The problems with the `selectionchange` event are:
            //  * the event is emitted when the textarea is focused programmatically -- textarea.focus()
            //  * the event is emitted when the selection is changed in the textarea programmatically -- textarea.setSelectionRange(...)
            //  * the event is emitted when the value of the textarea is changed programmatically -- textarea.value = '...'
            //  * the event is emitted when tabbing into the textarea
            //  * the event is emitted asynchronously (sometimes with a delay as high as a few tens of ms)
            //  * the event sometimes comes in bursts for a single logical textarea operation
            // `selectionchange` events often come multiple times for a single logical change
            // so throttle multiple `selectionchange` events that burst in a short period of time.
            let previousSelectionChangeEventTime = 0;
            return dom.addDisposableListener(this._textArea.ownerDocument, 'selectionchange', (e) => {
                performance_1.inputLatency.onSelectionChange();
                if (!this._hasFocus) {
                    return;
                }
                if (this._currentComposition) {
                    return;
                }
                if (!this._browser.isChrome) {
                    // Support only for Chrome until testing happens on other browsers
                    return;
                }
                const now = Date.now();
                const delta1 = now - previousSelectionChangeEventTime;
                previousSelectionChangeEventTime = now;
                if (delta1 < 5) {
                    // received another `selectionchange` event within 5ms of the previous `selectionchange` event
                    // => ignore it
                    return;
                }
                const delta2 = now - this._textArea.getIgnoreSelectionChangeTime();
                this._textArea.resetSelectionChangeTime();
                if (delta2 < 100) {
                    // received a `selectionchange` event within 100ms since we touched the textarea
                    // => ignore it, since we caused it
                    return;
                }
                if (!this._textAreaState.selection) {
                    // Cannot correlate a position in the textarea with a position in the editor...
                    return;
                }
                const newValue = this._textArea.getValue();
                if (this._textAreaState.value !== newValue) {
                    // Cannot correlate a position in the textarea with a position in the editor...
                    return;
                }
                const newSelectionStart = this._textArea.getSelectionStart();
                const newSelectionEnd = this._textArea.getSelectionEnd();
                if (this._textAreaState.selectionStart === newSelectionStart && this._textAreaState.selectionEnd === newSelectionEnd) {
                    // Nothing to do...
                    return;
                }
                const _newSelectionStartPosition = this._textAreaState.deduceEditorPosition(newSelectionStart);
                const newSelectionStartPosition = this._host.deduceModelPosition(_newSelectionStartPosition[0], _newSelectionStartPosition[1], _newSelectionStartPosition[2]);
                const _newSelectionEndPosition = this._textAreaState.deduceEditorPosition(newSelectionEnd);
                const newSelectionEndPosition = this._host.deduceModelPosition(_newSelectionEndPosition[0], _newSelectionEndPosition[1], _newSelectionEndPosition[2]);
                const newSelection = new selection_1.Selection(newSelectionStartPosition.lineNumber, newSelectionStartPosition.column, newSelectionEndPosition.lineNumber, newSelectionEndPosition.column);
                this._onSelectionChangeRequest.fire(newSelection);
            });
        }
        dispose() {
            super.dispose();
            if (this._selectionChangeListener) {
                this._selectionChangeListener.dispose();
                this._selectionChangeListener = null;
            }
        }
        focusTextArea() {
            // Setting this._hasFocus and writing the screen reader content
            // will result in a focus() and setSelectionRange() in the textarea
            this._setHasFocus(true);
            // If the editor is off DOM, focus cannot be really set, so let's double check that we have managed to set the focus
            this.refreshFocusState();
        }
        isFocused() {
            return this._hasFocus;
        }
        refreshFocusState() {
            this._setHasFocus(this._textArea.hasFocus());
        }
        _setHasFocus(newHasFocus) {
            if (this._hasFocus === newHasFocus) {
                // no change
                return;
            }
            this._hasFocus = newHasFocus;
            if (this._selectionChangeListener) {
                this._selectionChangeListener.dispose();
                this._selectionChangeListener = null;
            }
            if (this._hasFocus) {
                this._selectionChangeListener = this._installSelectionChangeListener();
            }
            if (this._hasFocus) {
                this.writeNativeTextAreaContent('focusgain');
            }
            if (this._hasFocus) {
                this._onFocus.fire();
            }
            else {
                this._onBlur.fire();
            }
        }
        _setAndWriteTextAreaState(reason, textAreaState) {
            if (!this._hasFocus) {
                textAreaState = textAreaState.collapseSelection();
            }
            textAreaState.writeToTextArea(reason, this._textArea, this._hasFocus);
            this._textAreaState = textAreaState;
        }
        writeNativeTextAreaContent(reason) {
            if ((!this._accessibilityService.isScreenReaderOptimized() && reason === 'render') || this._currentComposition) {
                // Do not write to the text on render unless a screen reader is being used #192278
                // Do not write to the text area when doing composition
                return;
            }
            this._logService.trace(`writeTextAreaState(reason: ${reason})`);
            this._setAndWriteTextAreaState(reason, this._host.getScreenReaderContent());
        }
        _ensureClipboardGetsEditorSelection(e) {
            const dataToCopy = this._host.getDataToCopy();
            const storedMetadata = {
                version: 1,
                isFromEmptySelection: dataToCopy.isFromEmptySelection,
                multicursorText: dataToCopy.multicursorText,
                mode: dataToCopy.mode
            };
            InMemoryClipboardMetadataManager.INSTANCE.set(
            // When writing "LINE\r\n" to the clipboard and then pasting,
            // Firefox pastes "LINE\n", so let's work around this quirk
            (this._browser.isFirefox ? dataToCopy.text.replace(/\r\n/g, '\n') : dataToCopy.text), storedMetadata);
            e.preventDefault();
            if (e.clipboardData) {
                exports.ClipboardEventUtils.setTextData(e.clipboardData, dataToCopy.text, dataToCopy.html, storedMetadata);
            }
        }
    };
    exports.TextAreaInput = TextAreaInput;
    exports.TextAreaInput = TextAreaInput = __decorate([
        __param(4, accessibility_1.IAccessibilityService),
        __param(5, log_1.ILogService)
    ], TextAreaInput);
    exports.ClipboardEventUtils = {
        getTextData(clipboardData) {
            const text = clipboardData.getData(mime_1.Mimes.text);
            let metadata = null;
            const rawmetadata = clipboardData.getData('vscode-editor-data');
            if (typeof rawmetadata === 'string') {
                try {
                    metadata = JSON.parse(rawmetadata);
                    if (metadata.version !== 1) {
                        metadata = null;
                    }
                }
                catch (err) {
                    // no problem!
                }
            }
            if (text.length === 0 && metadata === null && clipboardData.files.length > 0) {
                // no textual data pasted, generate text from file names
                const files = Array.prototype.slice.call(clipboardData.files, 0);
                return [files.map(file => file.name).join('\n'), null];
            }
            return [text, metadata];
        },
        setTextData(clipboardData, text, html, metadata) {
            clipboardData.setData(mime_1.Mimes.text, text);
            if (typeof html === 'string') {
                clipboardData.setData('text/html', html);
            }
            clipboardData.setData('vscode-editor-data', JSON.stringify(metadata));
        }
    };
    class TextAreaWrapper extends lifecycle_1.Disposable {
        get ownerDocument() {
            return this._actual.ownerDocument;
        }
        constructor(_actual) {
            super();
            this._actual = _actual;
            this.onKeyDown = this._register(new event_1.DomEmitter(this._actual, 'keydown')).event;
            this.onKeyPress = this._register(new event_1.DomEmitter(this._actual, 'keypress')).event;
            this.onKeyUp = this._register(new event_1.DomEmitter(this._actual, 'keyup')).event;
            this.onCompositionStart = this._register(new event_1.DomEmitter(this._actual, 'compositionstart')).event;
            this.onCompositionUpdate = this._register(new event_1.DomEmitter(this._actual, 'compositionupdate')).event;
            this.onCompositionEnd = this._register(new event_1.DomEmitter(this._actual, 'compositionend')).event;
            this.onBeforeInput = this._register(new event_1.DomEmitter(this._actual, 'beforeinput')).event;
            this.onInput = this._register(new event_1.DomEmitter(this._actual, 'input')).event;
            this.onCut = this._register(new event_1.DomEmitter(this._actual, 'cut')).event;
            this.onCopy = this._register(new event_1.DomEmitter(this._actual, 'copy')).event;
            this.onPaste = this._register(new event_1.DomEmitter(this._actual, 'paste')).event;
            this.onFocus = this._register(new event_1.DomEmitter(this._actual, 'focus')).event;
            this.onBlur = this._register(new event_1.DomEmitter(this._actual, 'blur')).event;
            this._onSyntheticTap = this._register(new event_2.Emitter());
            this.onSyntheticTap = this._onSyntheticTap.event;
            this._ignoreSelectionChangeTime = 0;
            this._register(this.onKeyDown(() => performance_1.inputLatency.onKeyDown()));
            this._register(this.onBeforeInput(() => performance_1.inputLatency.onBeforeInput()));
            this._register(this.onInput(() => performance_1.inputLatency.onInput()));
            this._register(this.onKeyUp(() => performance_1.inputLatency.onKeyUp()));
            this._register(dom.addDisposableListener(this._actual, TextAreaSyntethicEvents.Tap, () => this._onSyntheticTap.fire()));
        }
        hasFocus() {
            const shadowRoot = dom.getShadowRoot(this._actual);
            if (shadowRoot) {
                return shadowRoot.activeElement === this._actual;
            }
            else if (this._actual.isConnected) {
                return dom.getActiveElement() === this._actual;
            }
            else {
                return false;
            }
        }
        setIgnoreSelectionChangeTime(reason) {
            this._ignoreSelectionChangeTime = Date.now();
        }
        getIgnoreSelectionChangeTime() {
            return this._ignoreSelectionChangeTime;
        }
        resetSelectionChangeTime() {
            this._ignoreSelectionChangeTime = 0;
        }
        getValue() {
            // console.log('current value: ' + this._textArea.value);
            return this._actual.value;
        }
        setValue(reason, value) {
            const textArea = this._actual;
            if (textArea.value === value) {
                // No change
                return;
            }
            // console.log('reason: ' + reason + ', current value: ' + textArea.value + ' => new value: ' + value);
            this.setIgnoreSelectionChangeTime('setValue');
            textArea.value = value;
        }
        getSelectionStart() {
            return this._actual.selectionDirection === 'backward' ? this._actual.selectionEnd : this._actual.selectionStart;
        }
        getSelectionEnd() {
            return this._actual.selectionDirection === 'backward' ? this._actual.selectionStart : this._actual.selectionEnd;
        }
        setSelectionRange(reason, selectionStart, selectionEnd) {
            const textArea = this._actual;
            let activeElement = null;
            const shadowRoot = dom.getShadowRoot(textArea);
            if (shadowRoot) {
                activeElement = shadowRoot.activeElement;
            }
            else {
                activeElement = dom.getActiveElement();
            }
            const activeWindow = dom.getWindow(activeElement);
            const currentIsFocused = (activeElement === textArea);
            const currentSelectionStart = textArea.selectionStart;
            const currentSelectionEnd = textArea.selectionEnd;
            if (currentIsFocused && currentSelectionStart === selectionStart && currentSelectionEnd === selectionEnd) {
                // No change
                // Firefox iframe bug https://github.com/microsoft/monaco-editor/issues/643#issuecomment-367871377
                if (browser.isFirefox && activeWindow.parent !== activeWindow) {
                    textArea.focus();
                }
                return;
            }
            // console.log('reason: ' + reason + ', setSelectionRange: ' + selectionStart + ' -> ' + selectionEnd);
            if (currentIsFocused) {
                // No need to focus, only need to change the selection range
                this.setIgnoreSelectionChangeTime('setSelectionRange');
                textArea.setSelectionRange(selectionStart, selectionEnd);
                if (browser.isFirefox && activeWindow.parent !== activeWindow) {
                    textArea.focus();
                }
                return;
            }
            // If the focus is outside the textarea, browsers will try really hard to reveal the textarea.
            // Here, we try to undo the browser's desperate reveal.
            try {
                const scrollState = dom.saveParentsScrollTop(textArea);
                this.setIgnoreSelectionChangeTime('setSelectionRange');
                textArea.focus();
                textArea.setSelectionRange(selectionStart, selectionEnd);
                dom.restoreParentsScrollTop(textArea, scrollState);
            }
            catch (e) {
                // Sometimes IE throws when setting selection (e.g. textarea is off-DOM)
            }
        }
    }
    exports.TextAreaWrapper = TextAreaWrapper;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEFyZWFJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL2NvbnRyb2xsZXIvdGV4dEFyZWFJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQmhHLElBQWlCLHVCQUF1QixDQUV2QztJQUZELFdBQWlCLHVCQUF1QjtRQUMxQiwyQkFBRyxHQUFHLGdDQUFnQyxDQUFDO0lBQ3JELENBQUMsRUFGZ0IsdUJBQXVCLHVDQUF2Qix1QkFBdUIsUUFFdkM7SUFNWSxRQUFBLFdBQVcsR0FBRztRQUMxQiwrQkFBK0IsRUFBRSxLQUFLO0tBQ3RDLENBQUM7SUFpQ0Y7Ozs7T0FJRztJQUNILE1BQWEsZ0NBQWdDO2lCQUNyQixhQUFRLEdBQUcsSUFBSSxnQ0FBZ0MsRUFBRSxDQUFDO1FBSXpFO1lBQ0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDeEIsQ0FBQztRQUVNLEdBQUcsQ0FBQyxlQUF1QixFQUFFLElBQTZCO1lBQ2hFLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDN0MsQ0FBQztRQUVNLEdBQUcsQ0FBQyxVQUFrQjtZQUM1QixJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3ZFLFNBQVM7Z0JBQ1QsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztZQUM3QixDQUFDO1lBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDdkIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDOztJQXBCRiw0RUFxQkM7SUFzQ0QsTUFBTSxrQkFBa0I7UUFJdkI7WUFDQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFTSx1QkFBdUIsQ0FBQyxJQUErQjtZQUM3RCxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNsQixNQUFNLFNBQVMsR0FBYztnQkFDNUIsSUFBSSxFQUFFLElBQUk7Z0JBQ1Ysa0JBQWtCLEVBQUUsSUFBSSxDQUFDLG1CQUFtQjtnQkFDNUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDckIsYUFBYSxFQUFFLENBQUM7YUFDaEIsQ0FBQztZQUNGLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3ZDLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7S0FDRDtJQUVEOzs7Ozs7O09BT0c7SUFDSSxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFjLFNBQVEsc0JBQVU7UUEyQzVDLElBQVcsYUFBYTtZQUN2QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDNUIsQ0FBQztRQU9ELFlBQ2tCLEtBQXlCLEVBQ3pCLFNBQW1DLEVBQ25DLEdBQW9CLEVBQ3BCLFFBQWtCLEVBQ1oscUJBQTZELEVBQ3ZFLFdBQXlDO1lBRXRELEtBQUssRUFBRSxDQUFDO1lBUFMsVUFBSyxHQUFMLEtBQUssQ0FBb0I7WUFDekIsY0FBUyxHQUFULFNBQVMsQ0FBMEI7WUFDbkMsUUFBRyxHQUFILEdBQUcsQ0FBaUI7WUFDcEIsYUFBUSxHQUFSLFFBQVEsQ0FBVTtZQUNLLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDdEQsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUF4RC9DLGFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN2QyxZQUFPLEdBQWdCLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBRW5ELFlBQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN0QyxXQUFNLEdBQWdCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBRWpELGVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFrQixDQUFDLENBQUM7WUFDbkQsY0FBUyxHQUEwQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUVqRSxhQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBa0IsQ0FBQyxDQUFDO1lBQ2pELFlBQU8sR0FBMEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFFN0QsV0FBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3JDLFVBQUssR0FBZ0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFFL0MsYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWMsQ0FBQyxDQUFDO1lBQzdDLFlBQU8sR0FBc0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFFekQsWUFBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWEsQ0FBQyxDQUFDO1lBQzNDLFdBQU0sR0FBcUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFFdEQsd0JBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMEIsQ0FBQyxDQUFDO1lBQ3BFLHVCQUFrQixHQUFrQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO1lBRTNGLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW9CLENBQUMsQ0FBQztZQUMvRCx3QkFBbUIsR0FBNEIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQztZQUV2RixzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNoRCxxQkFBZ0IsR0FBZ0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUVyRSw4QkFBeUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFhLENBQUMsQ0FBQztZQUM3RCw2QkFBd0IsR0FBcUIsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQztZQU1qRiw0Q0FBdUMsR0FBd0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQXNCdkksSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUYsSUFBSSxDQUFDLGNBQWMsR0FBRyw2QkFBYSxDQUFDLEtBQUssQ0FBQztZQUMxQyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDO1lBQ3JDLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQztnQkFDMUQsSUFBSSxDQUFDLDBCQUEwQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtnQkFDdEcsSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyx1Q0FBdUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDakgsSUFBSSxDQUFDLHVDQUF1QyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkosQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyx1Q0FBdUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDdEQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUN2QixJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1lBRWhDLElBQUksV0FBVyxHQUEwQixJQUFJLENBQUM7WUFFOUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUM5QyxNQUFNLENBQUMsR0FBRyxJQUFJLHFDQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLENBQUMsQ0FBQyxPQUFPLHlDQUErQjt1QkFDeEMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLElBQUksQ0FBQyxDQUFDLE9BQU8sOEJBQXNCLENBQUMsRUFBRSxDQUFDO29CQUNuRSx5RUFBeUU7b0JBQ3pFLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDckIsQ0FBQztnQkFFRCxJQUFJLENBQUMsQ0FBQyxNQUFNLHdCQUFnQixFQUFFLENBQUM7b0JBQzlCLDBFQUEwRTtvQkFDMUUseUVBQXlFO29CQUN6RSxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3BCLENBQUM7Z0JBRUQsV0FBVyxHQUFHLENBQUMsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtnQkFDNUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxxQ0FBcUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUN0RCxJQUFJLGlDQUFpQixFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7Z0JBRUQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3BELElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQzlCLHVDQUF1QztvQkFDdkMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDO29CQUM5QyxPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDO2dCQUU5QyxJQUNDLElBQUksQ0FBQyxHQUFHLHNDQUE4Qjt1QkFDbkMsV0FBVzt1QkFDWCxXQUFXLENBQUMsTUFBTSxzQ0FBNEI7dUJBQzlDLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxLQUFLLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWTt1QkFDdkUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEdBQUcsQ0FBQzt1QkFDdEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSTt1QkFDdEYsQ0FBQyxXQUFXLENBQUMsSUFBSSxLQUFLLFlBQVksSUFBSSxXQUFXLENBQUMsSUFBSSxLQUFLLFdBQVcsQ0FBQyxFQUN6RSxDQUFDO29CQUNGLHNHQUFzRztvQkFDdEcsSUFBSSxpQ0FBaUIsRUFBRSxDQUFDO3dCQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLGtFQUFrRSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNwRixDQUFDO29CQUNELGtIQUFrSDtvQkFDbEgsa0JBQWtCLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2hELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7b0JBQ2hELE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQzdCLHVGQUF1RjtvQkFDdkYsK0ZBQStGO29CQUMvRixJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUNoRCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNqRCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3ZELElBQUksaUNBQWlCLEVBQUUsQ0FBQztvQkFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdkMsQ0FBQztnQkFDRCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQ3pCLHVGQUF1RjtvQkFDdkYsT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDN0IsMkVBQTJFO29CQUMzRSx1RUFBdUU7b0JBQ3ZFLGdHQUFnRztvQkFDaEcsZ0dBQWdHO29CQUNoRyxNQUFNLFFBQVEsR0FBRyw2QkFBYSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUNyRixNQUFNLFNBQVMsR0FBRyw2QkFBYSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzdGLElBQUksQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDO29CQUMvQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEMsT0FBTztnQkFDUixDQUFDO2dCQUNELE1BQU0sU0FBUyxHQUFHLGtCQUFrQixDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckUsSUFBSSxDQUFDLGNBQWMsR0FBRyw2QkFBYSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUMxRixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3BELElBQUksaUNBQWlCLEVBQUUsQ0FBQztvQkFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztnQkFDRCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQ3pCLHlEQUF5RDtvQkFDekQsc0dBQXNHO29CQUN0RyxPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztnQkFFaEMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUM3QiwyRUFBMkU7b0JBQzNFLHVFQUF1RTtvQkFDdkUsZ0dBQWdHO29CQUNoRyxnR0FBZ0c7b0JBQ2hHLE1BQU0sUUFBUSxHQUFHLDZCQUFhLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQ3JGLE1BQU0sU0FBUyxHQUFHLDZCQUFhLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDN0YsSUFBSSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUM7b0JBQy9CLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM3QixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQzlCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxNQUFNLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JFLElBQUksQ0FBQyxjQUFjLEdBQUcsNkJBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDMUYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMvQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUMzQyxJQUFJLGlDQUFpQixFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMzQixDQUFDO2dCQUVELCtFQUErRTtnQkFDL0UsOERBQThEO2dCQUM5RCxJQUFJLENBQUMsU0FBUyxDQUFDLDRCQUE0QixDQUFDLHNCQUFzQixDQUFDLENBQUM7Z0JBRXBFLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQzlCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxNQUFNLFFBQVEsR0FBRyw2QkFBYSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNyRixNQUFNLFNBQVMsR0FBRyw2QkFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFFBQVEsRUFBRSxxQkFBcUIsQ0FBQSxJQUFJLENBQUMsR0FBRyxzQ0FBOEIsQ0FBQyxDQUFDO2dCQUV4SSxJQUFJLFNBQVMsQ0FBQyxrQkFBa0IsS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3ZFLDBCQUEwQjtvQkFDMUIsSUFDQyxPQUFPLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDOzJCQUNsRCxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsWUFBWSxFQUNwRCxDQUFDO3dCQUNGLHdEQUF3RDt3QkFDeEQsT0FBTztvQkFDUixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUM7Z0JBQy9CLElBQ0MsU0FBUyxDQUFDLElBQUksS0FBSyxFQUFFO3VCQUNsQixTQUFTLENBQUMsa0JBQWtCLEtBQUssQ0FBQzt1QkFDbEMsU0FBUyxDQUFDLGtCQUFrQixLQUFLLENBQUM7dUJBQ2xDLFNBQVMsQ0FBQyxhQUFhLEtBQUssQ0FBQyxFQUMvQixDQUFDO29CQUNGLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM5QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLDJCQUEyQjtZQUUzQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3pDLDZFQUE2RTtnQkFDN0UsOERBQThEO2dCQUM5RCxJQUFJLENBQUMsU0FBUyxDQUFDLDRCQUE0QixDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBRWxFLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQzFDLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUMzQywrRUFBK0U7Z0JBQy9FLDhEQUE4RDtnQkFDOUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyw0QkFBNEIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2dCQUVwRSxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBRW5CLElBQUksQ0FBQyxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3RCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxHQUFHLDJCQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3hFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsMEJBQTBCO2dCQUMxQixRQUFRLEdBQUcsUUFBUSxJQUFJLGdDQUFnQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRTNFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO29CQUNsQixJQUFJLEVBQUUsSUFBSTtvQkFDVixRQUFRLEVBQUUsUUFBUTtpQkFDbEIsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO2dCQUMxQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUVoQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUV4QixJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDbkgscUZBQXFGO29CQUNyRixvRUFBb0U7b0JBQ3BFLElBQUksQ0FBQyxJQUFJLENBQUMsdUNBQXVDLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ3pELElBQUksQ0FBQyx1Q0FBdUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDdkksQ0FBQztvQkFDRCxJQUFJLENBQUMsdUNBQXVDLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMvRCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFO2dCQUN6QyxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUM5Qix3REFBd0Q7b0JBQ3hELHdEQUF3RDtvQkFDeEQsd0NBQXdDO29CQUV4QyxxREFBcUQ7b0JBQ3JELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7b0JBRWhDLHNEQUFzRDtvQkFDdEQsSUFBSSxDQUFDLDBCQUEwQixDQUFDLDJCQUEyQixDQUFDLENBQUM7b0JBRTdELGtDQUFrQztvQkFDbEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMvQixDQUFDO2dCQUNELElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFO2dCQUNqRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUN6RCxzRUFBc0U7b0JBQ3RFLGdEQUFnRDtvQkFFaEQscURBQXFEO29CQUNyRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO29CQUVoQyxzREFBc0Q7b0JBQ3RELElBQUksQ0FBQywwQkFBMEIsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO29CQUU1RCxrQ0FBa0M7b0JBQ2xDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDL0IsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsbUJBQW1CO1lBQ2xCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxjQUFjLEdBQUcsNkJBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFFTywrQkFBK0I7WUFDdEMsNEdBQTRHO1lBQzVHLDJFQUEyRTtZQUMzRSwwRUFBMEU7WUFDMUUsRUFBRTtZQUNGLHdGQUF3RjtZQUN4RixzRkFBc0Y7WUFDdEYsb0RBQW9EO1lBQ3BELEVBQUU7WUFDRixxREFBcUQ7WUFDckQsNEZBQTRGO1lBQzVGLDRIQUE0SDtZQUM1SCwrR0FBK0c7WUFDL0cseURBQXlEO1lBQ3pELDhGQUE4RjtZQUM5RixpRkFBaUY7WUFFakYsaUZBQWlGO1lBQ2pGLHNGQUFzRjtZQUN0RixJQUFJLGdDQUFnQyxHQUFHLENBQUMsQ0FBQztZQUN6QyxPQUFPLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUN2RiwwQkFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBRWpDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ3JCLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUM5QixPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQzdCLGtFQUFrRTtvQkFDbEUsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFFdkIsTUFBTSxNQUFNLEdBQUcsR0FBRyxHQUFHLGdDQUFnQyxDQUFDO2dCQUN0RCxnQ0FBZ0MsR0FBRyxHQUFHLENBQUM7Z0JBQ3ZDLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNoQiw4RkFBOEY7b0JBQzlGLGVBQWU7b0JBQ2YsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sTUFBTSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLDRCQUE0QixFQUFFLENBQUM7Z0JBQ25FLElBQUksQ0FBQyxTQUFTLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUM7b0JBQ2xCLGdGQUFnRjtvQkFDaEYsbUNBQW1DO29CQUNuQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ3BDLCtFQUErRTtvQkFDL0UsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzNDLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQzVDLCtFQUErRTtvQkFDL0UsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM3RCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN6RCxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxLQUFLLGlCQUFpQixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxLQUFLLGVBQWUsRUFBRSxDQUFDO29CQUN0SCxtQkFBbUI7b0JBQ25CLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxNQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDL0YsTUFBTSx5QkFBeUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBRSxFQUFFLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxFQUFFLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRS9KLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDM0YsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBRSxFQUFFLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXZKLE1BQU0sWUFBWSxHQUFHLElBQUkscUJBQVMsQ0FDakMseUJBQXlCLENBQUMsVUFBVSxFQUFFLHlCQUF5QixDQUFDLE1BQU0sRUFDdEUsdUJBQXVCLENBQUMsVUFBVSxFQUFFLHVCQUF1QixDQUFDLE1BQU0sQ0FDbEUsQ0FBQztnQkFFRixJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ25ELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVlLE9BQU87WUFDdEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLElBQUksSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ25DLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztRQUVNLGFBQWE7WUFDbkIsK0RBQStEO1lBQy9ELG1FQUFtRTtZQUNuRSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXhCLG9IQUFvSDtZQUNwSCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU0sU0FBUztZQUNmLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUN2QixDQUFDO1FBRU0saUJBQWlCO1lBQ3ZCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFTyxZQUFZLENBQUMsV0FBb0I7WUFDeEMsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUNwQyxZQUFZO2dCQUNaLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUM7WUFFN0IsSUFBSSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDO1lBQ3RDLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDO1lBQ3hFLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzlDLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN0QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNyQixDQUFDO1FBQ0YsQ0FBQztRQUVPLHlCQUF5QixDQUFDLE1BQWMsRUFBRSxhQUE0QjtZQUM3RSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixhQUFhLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDbkQsQ0FBQztZQUVELGFBQWEsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDO1FBQ3JDLENBQUM7UUFFTSwwQkFBMEIsQ0FBQyxNQUFjO1lBQy9DLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLE1BQU0sS0FBSyxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDaEgsa0ZBQWtGO2dCQUNsRix1REFBdUQ7Z0JBQ3ZELE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsOEJBQThCLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRU8sbUNBQW1DLENBQUMsQ0FBaUI7WUFDNUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM5QyxNQUFNLGNBQWMsR0FBNEI7Z0JBQy9DLE9BQU8sRUFBRSxDQUFDO2dCQUNWLG9CQUFvQixFQUFFLFVBQVUsQ0FBQyxvQkFBb0I7Z0JBQ3JELGVBQWUsRUFBRSxVQUFVLENBQUMsZUFBZTtnQkFDM0MsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJO2FBQ3JCLENBQUM7WUFDRixnQ0FBZ0MsQ0FBQyxRQUFRLENBQUMsR0FBRztZQUM1Qyw2REFBNkQ7WUFDN0QsMkRBQTJEO1lBQzNELENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUNwRixjQUFjLENBQ2QsQ0FBQztZQUVGLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDckIsMkJBQW1CLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3BHLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQTVmWSxzQ0FBYTs0QkFBYixhQUFhO1FBeUR2QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsaUJBQVcsQ0FBQTtPQTFERCxhQUFhLENBNGZ6QjtJQUVZLFFBQUEsbUJBQW1CLEdBQUc7UUFFbEMsV0FBVyxDQUFDLGFBQTJCO1lBQ3RDLE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsWUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9DLElBQUksUUFBUSxHQUFtQyxJQUFJLENBQUM7WUFDcEQsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2hFLElBQUksT0FBTyxXQUFXLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQztvQkFDSixRQUFRLEdBQTRCLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQzVELElBQUksUUFBUSxDQUFDLE9BQU8sS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDNUIsUUFBUSxHQUFHLElBQUksQ0FBQztvQkFDakIsQ0FBQztnQkFDRixDQUFDO2dCQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7b0JBQ2QsY0FBYztnQkFDZixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksUUFBUSxLQUFLLElBQUksSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDOUUsd0RBQXdEO2dCQUN4RCxNQUFNLEtBQUssR0FBVyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDekUsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFFRCxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxXQUFXLENBQUMsYUFBMkIsRUFBRSxJQUFZLEVBQUUsSUFBK0IsRUFBRSxRQUFpQztZQUN4SCxhQUFhLENBQUMsT0FBTyxDQUFDLFlBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEMsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDOUIsYUFBYSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUNELGFBQWEsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7S0FDRCxDQUFDO0lBRUYsTUFBYSxlQUFnQixTQUFRLHNCQUFVO1FBZ0I5QyxJQUFXLGFBQWE7WUFDdkIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztRQUNuQyxDQUFDO1FBT0QsWUFDa0IsT0FBNEI7WUFFN0MsS0FBSyxFQUFFLENBQUM7WUFGUyxZQUFPLEdBQVAsT0FBTyxDQUFxQjtZQXhCOUIsY0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQkFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDMUUsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQkFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDNUUsWUFBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQkFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDdEUsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGtCQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQzVGLHdCQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQkFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUM5RixxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksa0JBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDeEYsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksa0JBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQ2xGLFlBQU8sR0FBc0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGtCQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUN6RixVQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGtCQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUNsRSxXQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGtCQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUNwRSxZQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGtCQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUN0RSxZQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGtCQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUN0RSxXQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGtCQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQU01RSxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzlDLG1CQUFjLEdBQWdCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1lBUXhFLElBQUksQ0FBQywwQkFBMEIsR0FBRyxDQUFDLENBQUM7WUFFcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLDBCQUFZLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQywwQkFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsMEJBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLDBCQUFZLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTNELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsdUJBQXVCLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pILENBQUM7UUFFTSxRQUFRO1lBQ2QsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkQsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxVQUFVLENBQUMsYUFBYSxLQUFLLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDbEQsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sR0FBRyxDQUFDLGdCQUFnQixFQUFFLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNoRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1FBQ0YsQ0FBQztRQUVNLDRCQUE0QixDQUFDLE1BQWM7WUFDakQsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM5QyxDQUFDO1FBRU0sNEJBQTRCO1lBQ2xDLE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDO1FBQ3hDLENBQUM7UUFFTSx3QkFBd0I7WUFDOUIsSUFBSSxDQUFDLDBCQUEwQixHQUFHLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRU0sUUFBUTtZQUNkLHlEQUF5RDtZQUN6RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQzNCLENBQUM7UUFFTSxRQUFRLENBQUMsTUFBYyxFQUFFLEtBQWE7WUFDNUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUM5QixJQUFJLFFBQVEsQ0FBQyxLQUFLLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQzlCLFlBQVk7Z0JBQ1osT0FBTztZQUNSLENBQUM7WUFDRCx1R0FBdUc7WUFDdkcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzlDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLENBQUM7UUFFTSxpQkFBaUI7WUFDdkIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDO1FBQ2pILENBQUM7UUFFTSxlQUFlO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQztRQUNqSCxDQUFDO1FBRU0saUJBQWlCLENBQUMsTUFBYyxFQUFFLGNBQXNCLEVBQUUsWUFBb0I7WUFDcEYsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUU5QixJQUFJLGFBQWEsR0FBbUIsSUFBSSxDQUFDO1lBQ3pDLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0MsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDaEIsYUFBYSxHQUFHLFVBQVUsQ0FBQyxhQUFhLENBQUM7WUFDMUMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLGFBQWEsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUN4QyxDQUFDO1lBQ0QsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUVsRCxNQUFNLGdCQUFnQixHQUFHLENBQUMsYUFBYSxLQUFLLFFBQVEsQ0FBQyxDQUFDO1lBQ3RELE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQztZQUN0RCxNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7WUFFbEQsSUFBSSxnQkFBZ0IsSUFBSSxxQkFBcUIsS0FBSyxjQUFjLElBQUksbUJBQW1CLEtBQUssWUFBWSxFQUFFLENBQUM7Z0JBQzFHLFlBQVk7Z0JBQ1osa0dBQWtHO2dCQUNsRyxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxZQUFZLEVBQUUsQ0FBQztvQkFDL0QsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNsQixDQUFDO2dCQUNELE9BQU87WUFDUixDQUFDO1lBRUQsdUdBQXVHO1lBRXZHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEIsNERBQTREO2dCQUM1RCxJQUFJLENBQUMsNEJBQTRCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDdkQsUUFBUSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDekQsSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssWUFBWSxFQUFFLENBQUM7b0JBQy9ELFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCxPQUFPO1lBQ1IsQ0FBQztZQUVELDhGQUE4RjtZQUM5Rix1REFBdUQ7WUFDdkQsSUFBSSxDQUFDO2dCQUNKLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxDQUFDLDRCQUE0QixDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQ3ZELFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDakIsUUFBUSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDekQsR0FBRyxDQUFDLHVCQUF1QixDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWix3RUFBd0U7WUFDekUsQ0FBQztRQUNGLENBQUM7S0FDRDtJQXZJRCwwQ0F1SUMifQ==