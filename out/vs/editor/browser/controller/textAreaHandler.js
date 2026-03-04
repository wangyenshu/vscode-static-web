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
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/browser/fastDomNode", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/controller/textAreaState", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/lineNumbers/lineNumbers", "vs/editor/browser/viewParts/margin/margin", "vs/editor/common/config/editorOptions", "vs/editor/common/core/wordCharacterClassifier", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/base/browser/ui/mouseCursor/mouseCursor", "vs/editor/common/languages", "vs/base/common/color", "vs/base/common/ime", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/css!./textAreaHandler"], function (require, exports, nls, browser, fastDomNode_1, platform, strings, domFontInfo_1, textAreaInput_1, textAreaState_1, viewPart_1, lineNumbers_1, margin_1, editorOptions_1, wordCharacterClassifier_1, position_1, range_1, selection_1, mouseCursor_1, languages_1, color_1, ime_1, keybinding_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextAreaHandler = void 0;
    class VisibleTextAreaData {
        constructor(_context, modelLineNumber, distanceToModelLineStart, widthOfHiddenLineTextBefore, distanceToModelLineEnd) {
            this._context = _context;
            this.modelLineNumber = modelLineNumber;
            this.distanceToModelLineStart = distanceToModelLineStart;
            this.widthOfHiddenLineTextBefore = widthOfHiddenLineTextBefore;
            this.distanceToModelLineEnd = distanceToModelLineEnd;
            this._visibleTextAreaBrand = undefined;
            this.startPosition = null;
            this.endPosition = null;
            this.visibleTextareaStart = null;
            this.visibleTextareaEnd = null;
            /**
             * When doing composition, the currently composed text might be split up into
             * multiple tokens, then merged again into a single token, etc. Here we attempt
             * to keep the presentation of the <textarea> stable by using the previous used
             * style if multiple tokens come into play. This avoids flickering.
             */
            this._previousPresentation = null;
        }
        prepareRender(visibleRangeProvider) {
            const startModelPosition = new position_1.Position(this.modelLineNumber, this.distanceToModelLineStart + 1);
            const endModelPosition = new position_1.Position(this.modelLineNumber, this._context.viewModel.model.getLineMaxColumn(this.modelLineNumber) - this.distanceToModelLineEnd);
            this.startPosition = this._context.viewModel.coordinatesConverter.convertModelPositionToViewPosition(startModelPosition);
            this.endPosition = this._context.viewModel.coordinatesConverter.convertModelPositionToViewPosition(endModelPosition);
            if (this.startPosition.lineNumber === this.endPosition.lineNumber) {
                this.visibleTextareaStart = visibleRangeProvider.visibleRangeForPosition(this.startPosition);
                this.visibleTextareaEnd = visibleRangeProvider.visibleRangeForPosition(this.endPosition);
            }
            else {
                // TODO: what if the view positions are not on the same line?
                this.visibleTextareaStart = null;
                this.visibleTextareaEnd = null;
            }
        }
        definePresentation(tokenPresentation) {
            if (!this._previousPresentation) {
                // To avoid flickering, once set, always reuse a presentation throughout the entire IME session
                if (tokenPresentation) {
                    this._previousPresentation = tokenPresentation;
                }
                else {
                    this._previousPresentation = {
                        foreground: 1 /* ColorId.DefaultForeground */,
                        italic: false,
                        bold: false,
                        underline: false,
                        strikethrough: false,
                    };
                }
            }
            return this._previousPresentation;
        }
    }
    const canUseZeroSizeTextarea = (browser.isFirefox);
    let TextAreaHandler = class TextAreaHandler extends viewPart_1.ViewPart {
        constructor(context, viewController, visibleRangeProvider, _keybindingService, _instantiationService) {
            super(context);
            this._keybindingService = _keybindingService;
            this._instantiationService = _instantiationService;
            this._primaryCursorPosition = new position_1.Position(1, 1);
            this._primaryCursorVisibleRange = null;
            this._viewController = viewController;
            this._visibleRangeProvider = visibleRangeProvider;
            this._scrollLeft = 0;
            this._scrollTop = 0;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._setAccessibilityOptions(options);
            this._contentLeft = layoutInfo.contentLeft;
            this._contentWidth = layoutInfo.contentWidth;
            this._contentHeight = layoutInfo.height;
            this._fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._emptySelectionClipboard = options.get(37 /* EditorOption.emptySelectionClipboard */);
            this._copyWithSyntaxHighlighting = options.get(25 /* EditorOption.copyWithSyntaxHighlighting */);
            this._visibleTextArea = null;
            this._selections = [new selection_1.Selection(1, 1, 1, 1)];
            this._modelSelections = [new selection_1.Selection(1, 1, 1, 1)];
            this._lastRenderPosition = null;
            // Text Area (The focus will always be in the textarea when the cursor is blinking)
            this.textArea = (0, fastDomNode_1.createFastDomNode)(document.createElement('textarea'));
            viewPart_1.PartFingerprints.write(this.textArea, 7 /* PartFingerprint.TextArea */);
            this.textArea.setClassName(`inputarea ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`);
            this.textArea.setAttribute('wrap', this._textAreaWrapping && !this._visibleTextArea ? 'on' : 'off');
            const { tabSize } = this._context.viewModel.model.getOptions();
            this.textArea.domNode.style.tabSize = `${tabSize * this._fontInfo.spaceWidth}px`;
            this.textArea.setAttribute('autocorrect', 'off');
            this.textArea.setAttribute('autocapitalize', 'off');
            this.textArea.setAttribute('autocomplete', 'off');
            this.textArea.setAttribute('spellcheck', 'false');
            this.textArea.setAttribute('aria-label', this._getAriaLabel(options));
            this.textArea.setAttribute('aria-required', options.get(5 /* EditorOption.ariaRequired */) ? 'true' : 'false');
            this.textArea.setAttribute('tabindex', String(options.get(124 /* EditorOption.tabIndex */)));
            this.textArea.setAttribute('role', 'textbox');
            this.textArea.setAttribute('aria-roledescription', nls.localize('editor', "editor"));
            this.textArea.setAttribute('aria-multiline', 'true');
            this.textArea.setAttribute('aria-autocomplete', options.get(91 /* EditorOption.readOnly */) ? 'none' : 'both');
            this._ensureReadOnlyAttribute();
            this.textAreaCover = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.textAreaCover.setPosition('absolute');
            const simpleModel = {
                getLineCount: () => {
                    return this._context.viewModel.getLineCount();
                },
                getLineMaxColumn: (lineNumber) => {
                    return this._context.viewModel.getLineMaxColumn(lineNumber);
                },
                getValueInRange: (range, eol) => {
                    return this._context.viewModel.getValueInRange(range, eol);
                },
                getValueLengthInRange: (range, eol) => {
                    return this._context.viewModel.getValueLengthInRange(range, eol);
                },
                modifyPosition: (position, offset) => {
                    return this._context.viewModel.modifyPosition(position, offset);
                }
            };
            const textAreaInputHost = {
                getDataToCopy: () => {
                    const rawTextToCopy = this._context.viewModel.getPlainTextToCopy(this._modelSelections, this._emptySelectionClipboard, platform.isWindows);
                    const newLineCharacter = this._context.viewModel.model.getEOL();
                    const isFromEmptySelection = (this._emptySelectionClipboard && this._modelSelections.length === 1 && this._modelSelections[0].isEmpty());
                    const multicursorText = (Array.isArray(rawTextToCopy) ? rawTextToCopy : null);
                    const text = (Array.isArray(rawTextToCopy) ? rawTextToCopy.join(newLineCharacter) : rawTextToCopy);
                    let html = undefined;
                    let mode = null;
                    if (textAreaInput_1.CopyOptions.forceCopyWithSyntaxHighlighting || (this._copyWithSyntaxHighlighting && text.length < 65536)) {
                        const richText = this._context.viewModel.getRichTextToCopy(this._modelSelections, this._emptySelectionClipboard);
                        if (richText) {
                            html = richText.html;
                            mode = richText.mode;
                        }
                    }
                    return {
                        isFromEmptySelection,
                        multicursorText,
                        text,
                        html,
                        mode
                    };
                },
                getScreenReaderContent: () => {
                    if (this._accessibilitySupport === 1 /* AccessibilitySupport.Disabled */) {
                        // We know for a fact that a screen reader is not attached
                        // On OSX, we write the character before the cursor to allow for "long-press" composition
                        // Also on OSX, we write the word before the cursor to allow for the Accessibility Keyboard to give good hints
                        const selection = this._selections[0];
                        if (platform.isMacintosh && selection.isEmpty()) {
                            const position = selection.getStartPosition();
                            let textBefore = this._getWordBeforePosition(position);
                            if (textBefore.length === 0) {
                                textBefore = this._getCharacterBeforePosition(position);
                            }
                            if (textBefore.length > 0) {
                                return new textAreaState_1.TextAreaState(textBefore, textBefore.length, textBefore.length, range_1.Range.fromPositions(position), 0);
                            }
                        }
                        // on macOS, write current selection into textarea will allow system text services pick selected text,
                        // but we still want to limit the amount of text given Chromium handles very poorly text even of a few
                        // thousand chars
                        // (https://github.com/microsoft/vscode/issues/27799)
                        const LIMIT_CHARS = 500;
                        if (platform.isMacintosh && !selection.isEmpty() && simpleModel.getValueLengthInRange(selection, 0 /* EndOfLinePreference.TextDefined */) < LIMIT_CHARS) {
                            const text = simpleModel.getValueInRange(selection, 0 /* EndOfLinePreference.TextDefined */);
                            return new textAreaState_1.TextAreaState(text, 0, text.length, selection, 0);
                        }
                        // on Safari, document.execCommand('cut') and document.execCommand('copy') will just not work
                        // if the textarea has no content selected. So if there is an editor selection, ensure something
                        // is selected in the textarea.
                        if (browser.isSafari && !selection.isEmpty()) {
                            const placeholderText = 'vscode-placeholder';
                            return new textAreaState_1.TextAreaState(placeholderText, 0, placeholderText.length, null, undefined);
                        }
                        return textAreaState_1.TextAreaState.EMPTY;
                    }
                    if (browser.isAndroid) {
                        // when tapping in the editor on a word, Android enters composition mode.
                        // in the `compositionstart` event we cannot clear the textarea, because
                        // it then forgets to ever send a `compositionend`.
                        // we therefore only write the current word in the textarea
                        const selection = this._selections[0];
                        if (selection.isEmpty()) {
                            const position = selection.getStartPosition();
                            const [wordAtPosition, positionOffsetInWord] = this._getAndroidWordAtPosition(position);
                            if (wordAtPosition.length > 0) {
                                return new textAreaState_1.TextAreaState(wordAtPosition, positionOffsetInWord, positionOffsetInWord, range_1.Range.fromPositions(position), 0);
                            }
                        }
                        return textAreaState_1.TextAreaState.EMPTY;
                    }
                    return textAreaState_1.PagedScreenReaderStrategy.fromEditorSelection(simpleModel, this._selections[0], this._accessibilityPageSize, this._accessibilitySupport === 0 /* AccessibilitySupport.Unknown */);
                },
                deduceModelPosition: (viewAnchorPosition, deltaOffset, lineFeedCnt) => {
                    return this._context.viewModel.deduceModelPositionRelativeToViewPosition(viewAnchorPosition, deltaOffset, lineFeedCnt);
                }
            };
            const textAreaWrapper = this._register(new textAreaInput_1.TextAreaWrapper(this.textArea.domNode));
            this._textAreaInput = this._register(this._instantiationService.createInstance(textAreaInput_1.TextAreaInput, textAreaInputHost, textAreaWrapper, platform.OS, {
                isAndroid: browser.isAndroid,
                isChrome: browser.isChrome,
                isFirefox: browser.isFirefox,
                isSafari: browser.isSafari,
            }));
            this._register(this._textAreaInput.onKeyDown((e) => {
                this._viewController.emitKeyDown(e);
            }));
            this._register(this._textAreaInput.onKeyUp((e) => {
                this._viewController.emitKeyUp(e);
            }));
            this._register(this._textAreaInput.onPaste((e) => {
                let pasteOnNewLine = false;
                let multicursorText = null;
                let mode = null;
                if (e.metadata) {
                    pasteOnNewLine = (this._emptySelectionClipboard && !!e.metadata.isFromEmptySelection);
                    multicursorText = (typeof e.metadata.multicursorText !== 'undefined' ? e.metadata.multicursorText : null);
                    mode = e.metadata.mode;
                }
                this._viewController.paste(e.text, pasteOnNewLine, multicursorText, mode);
            }));
            this._register(this._textAreaInput.onCut(() => {
                this._viewController.cut();
            }));
            this._register(this._textAreaInput.onType((e) => {
                if (e.replacePrevCharCnt || e.replaceNextCharCnt || e.positionDelta) {
                    // must be handled through the new command
                    if (textAreaState_1._debugComposition) {
                        console.log(` => compositionType: <<${e.text}>>, ${e.replacePrevCharCnt}, ${e.replaceNextCharCnt}, ${e.positionDelta}`);
                    }
                    this._viewController.compositionType(e.text, e.replacePrevCharCnt, e.replaceNextCharCnt, e.positionDelta);
                }
                else {
                    if (textAreaState_1._debugComposition) {
                        console.log(` => type: <<${e.text}>>`);
                    }
                    this._viewController.type(e.text);
                }
            }));
            this._register(this._textAreaInput.onSelectionChangeRequest((modelSelection) => {
                this._viewController.setSelection(modelSelection);
            }));
            this._register(this._textAreaInput.onCompositionStart((e) => {
                // The textarea might contain some content when composition starts.
                //
                // When we make the textarea visible, it always has a height of 1 line,
                // so we don't need to worry too much about content on lines above or below
                // the selection.
                //
                // However, the text on the current line needs to be made visible because
                // some IME methods allow to move to other glyphs on the current line
                // (by pressing arrow keys).
                //
                // (1) The textarea might contain only some parts of the current line,
                // like the word before the selection. Also, the content inside the textarea
                // can grow or shrink as composition occurs. We therefore anchor the textarea
                // in terms of distance to a certain line start and line end.
                //
                // (2) Also, we should not make \t characters visible, because their rendering
                // inside the <textarea> will not align nicely with our rendering. We therefore
                // will hide (if necessary) some of the leading text on the current line.
                const ta = this.textArea.domNode;
                const modelSelection = this._modelSelections[0];
                const { distanceToModelLineStart, widthOfHiddenTextBefore } = (() => {
                    // Find the text that is on the current line before the selection
                    const textBeforeSelection = ta.value.substring(0, Math.min(ta.selectionStart, ta.selectionEnd));
                    const lineFeedOffset1 = textBeforeSelection.lastIndexOf('\n');
                    const lineTextBeforeSelection = textBeforeSelection.substring(lineFeedOffset1 + 1);
                    // We now search to see if we should hide some part of it (if it contains \t)
                    const tabOffset1 = lineTextBeforeSelection.lastIndexOf('\t');
                    const desiredVisibleBeforeCharCount = lineTextBeforeSelection.length - tabOffset1 - 1;
                    const startModelPosition = modelSelection.getStartPosition();
                    const visibleBeforeCharCount = Math.min(startModelPosition.column - 1, desiredVisibleBeforeCharCount);
                    const distanceToModelLineStart = startModelPosition.column - 1 - visibleBeforeCharCount;
                    const hiddenLineTextBefore = lineTextBeforeSelection.substring(0, lineTextBeforeSelection.length - visibleBeforeCharCount);
                    const { tabSize } = this._context.viewModel.model.getOptions();
                    const widthOfHiddenTextBefore = measureText(this.textArea.domNode.ownerDocument, hiddenLineTextBefore, this._fontInfo, tabSize);
                    return { distanceToModelLineStart, widthOfHiddenTextBefore };
                })();
                const { distanceToModelLineEnd } = (() => {
                    // Find the text that is on the current line after the selection
                    const textAfterSelection = ta.value.substring(Math.max(ta.selectionStart, ta.selectionEnd));
                    const lineFeedOffset2 = textAfterSelection.indexOf('\n');
                    const lineTextAfterSelection = lineFeedOffset2 === -1 ? textAfterSelection : textAfterSelection.substring(0, lineFeedOffset2);
                    const tabOffset2 = lineTextAfterSelection.indexOf('\t');
                    const desiredVisibleAfterCharCount = (tabOffset2 === -1 ? lineTextAfterSelection.length : lineTextAfterSelection.length - tabOffset2 - 1);
                    const endModelPosition = modelSelection.getEndPosition();
                    const visibleAfterCharCount = Math.min(this._context.viewModel.model.getLineMaxColumn(endModelPosition.lineNumber) - endModelPosition.column, desiredVisibleAfterCharCount);
                    const distanceToModelLineEnd = this._context.viewModel.model.getLineMaxColumn(endModelPosition.lineNumber) - endModelPosition.column - visibleAfterCharCount;
                    return { distanceToModelLineEnd };
                })();
                // Scroll to reveal the location in the editor where composition occurs
                this._context.viewModel.revealRange('keyboard', true, range_1.Range.fromPositions(this._selections[0].getStartPosition()), 0 /* viewEvents.VerticalRevealType.Simple */, 1 /* ScrollType.Immediate */);
                this._visibleTextArea = new VisibleTextAreaData(this._context, modelSelection.startLineNumber, distanceToModelLineStart, widthOfHiddenTextBefore, distanceToModelLineEnd);
                // We turn off wrapping if the <textarea> becomes visible for composition
                this.textArea.setAttribute('wrap', this._textAreaWrapping && !this._visibleTextArea ? 'on' : 'off');
                this._visibleTextArea.prepareRender(this._visibleRangeProvider);
                this._render();
                // Show the textarea
                this.textArea.setClassName(`inputarea ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME} ime-input`);
                this._viewController.compositionStart();
                this._context.viewModel.onCompositionStart();
            }));
            this._register(this._textAreaInput.onCompositionUpdate((e) => {
                if (!this._visibleTextArea) {
                    return;
                }
                this._visibleTextArea.prepareRender(this._visibleRangeProvider);
                this._render();
            }));
            this._register(this._textAreaInput.onCompositionEnd(() => {
                this._visibleTextArea = null;
                // We turn on wrapping as necessary if the <textarea> hides after composition
                this.textArea.setAttribute('wrap', this._textAreaWrapping && !this._visibleTextArea ? 'on' : 'off');
                this._render();
                this.textArea.setClassName(`inputarea ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`);
                this._viewController.compositionEnd();
                this._context.viewModel.onCompositionEnd();
            }));
            this._register(this._textAreaInput.onFocus(() => {
                this._context.viewModel.setHasFocus(true);
            }));
            this._register(this._textAreaInput.onBlur(() => {
                this._context.viewModel.setHasFocus(false);
            }));
            this._register(ime_1.IME.onDidChange(() => {
                this._ensureReadOnlyAttribute();
            }));
        }
        writeScreenReaderContent(reason) {
            this._textAreaInput.writeNativeTextAreaContent(reason);
        }
        dispose() {
            super.dispose();
        }
        _getAndroidWordAtPosition(position) {
            const ANDROID_WORD_SEPARATORS = '`~!@#$%^&*()-=+[{]}\\|;:",.<>/?';
            const lineContent = this._context.viewModel.getLineContent(position.lineNumber);
            const wordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(ANDROID_WORD_SEPARATORS, []);
            let goingLeft = true;
            let startColumn = position.column;
            let goingRight = true;
            let endColumn = position.column;
            let distance = 0;
            while (distance < 50 && (goingLeft || goingRight)) {
                if (goingLeft && startColumn <= 1) {
                    goingLeft = false;
                }
                if (goingLeft) {
                    const charCode = lineContent.charCodeAt(startColumn - 2);
                    const charClass = wordSeparators.get(charCode);
                    if (charClass !== 0 /* WordCharacterClass.Regular */) {
                        goingLeft = false;
                    }
                    else {
                        startColumn--;
                    }
                }
                if (goingRight && endColumn > lineContent.length) {
                    goingRight = false;
                }
                if (goingRight) {
                    const charCode = lineContent.charCodeAt(endColumn - 1);
                    const charClass = wordSeparators.get(charCode);
                    if (charClass !== 0 /* WordCharacterClass.Regular */) {
                        goingRight = false;
                    }
                    else {
                        endColumn++;
                    }
                }
                distance++;
            }
            return [lineContent.substring(startColumn - 1, endColumn - 1), position.column - startColumn];
        }
        _getWordBeforePosition(position) {
            const lineContent = this._context.viewModel.getLineContent(position.lineNumber);
            const wordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(this._context.configuration.options.get(131 /* EditorOption.wordSeparators */), []);
            let column = position.column;
            let distance = 0;
            while (column > 1) {
                const charCode = lineContent.charCodeAt(column - 2);
                const charClass = wordSeparators.get(charCode);
                if (charClass !== 0 /* WordCharacterClass.Regular */ || distance > 50) {
                    return lineContent.substring(column - 1, position.column - 1);
                }
                distance++;
                column--;
            }
            return lineContent.substring(0, position.column - 1);
        }
        _getCharacterBeforePosition(position) {
            if (position.column > 1) {
                const lineContent = this._context.viewModel.getLineContent(position.lineNumber);
                const charBefore = lineContent.charAt(position.column - 2);
                if (!strings.isHighSurrogate(charBefore.charCodeAt(0))) {
                    return charBefore;
                }
            }
            return '';
        }
        _getAriaLabel(options) {
            const accessibilitySupport = options.get(2 /* EditorOption.accessibilitySupport */);
            if (accessibilitySupport === 1 /* AccessibilitySupport.Disabled */) {
                const toggleKeybindingLabel = this._keybindingService.lookupKeybinding('editor.action.toggleScreenReaderAccessibilityMode')?.getAriaLabel();
                const runCommandKeybindingLabel = this._keybindingService.lookupKeybinding('workbench.action.showCommands')?.getAriaLabel();
                const keybindingEditorKeybindingLabel = this._keybindingService.lookupKeybinding('workbench.action.openGlobalKeybindings')?.getAriaLabel();
                const editorNotAccessibleMessage = nls.localize('accessibilityModeOff', "The editor is not accessible at this time.");
                if (toggleKeybindingLabel) {
                    return nls.localize('accessibilityOffAriaLabel', "{0} To enable screen reader optimized mode, use {1}", editorNotAccessibleMessage, toggleKeybindingLabel);
                }
                else if (runCommandKeybindingLabel) {
                    return nls.localize('accessibilityOffAriaLabelNoKb', "{0} To enable screen reader optimized mode, open the quick pick with {1} and run the command Toggle Screen Reader Accessibility Mode, which is currently not triggerable via keyboard.", editorNotAccessibleMessage, runCommandKeybindingLabel);
                }
                else if (keybindingEditorKeybindingLabel) {
                    return nls.localize('accessibilityOffAriaLabelNoKbs', "{0} Please assign a keybinding for the command Toggle Screen Reader Accessibility Mode by accessing the keybindings editor with {1} and run it.", editorNotAccessibleMessage, keybindingEditorKeybindingLabel);
                }
                else {
                    // SOS
                    return editorNotAccessibleMessage;
                }
            }
            return options.get(4 /* EditorOption.ariaLabel */);
        }
        _setAccessibilityOptions(options) {
            this._accessibilitySupport = options.get(2 /* EditorOption.accessibilitySupport */);
            const accessibilityPageSize = options.get(3 /* EditorOption.accessibilityPageSize */);
            if (this._accessibilitySupport === 2 /* AccessibilitySupport.Enabled */ && accessibilityPageSize === editorOptions_1.EditorOptions.accessibilityPageSize.defaultValue) {
                // If a screen reader is attached and the default value is not set we should automatically increase the page size to 500 for a better experience
                this._accessibilityPageSize = 500;
            }
            else {
                this._accessibilityPageSize = accessibilityPageSize;
            }
            // When wrapping is enabled and a screen reader might be attached,
            // we will size the textarea to match the width used for wrapping points computation (see `domLineBreaksComputer.ts`).
            // This is because screen readers will read the text in the textarea and we'd like that the
            // wrapping points in the textarea match the wrapping points in the editor.
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const wrappingColumn = layoutInfo.wrappingColumn;
            if (wrappingColumn !== -1 && this._accessibilitySupport !== 1 /* AccessibilitySupport.Disabled */) {
                const fontInfo = options.get(50 /* EditorOption.fontInfo */);
                this._textAreaWrapping = true;
                this._textAreaWidth = Math.round(wrappingColumn * fontInfo.typicalHalfwidthCharacterWidth);
            }
            else {
                this._textAreaWrapping = false;
                this._textAreaWidth = (canUseZeroSizeTextarea ? 0 : 1);
            }
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._setAccessibilityOptions(options);
            this._contentLeft = layoutInfo.contentLeft;
            this._contentWidth = layoutInfo.contentWidth;
            this._contentHeight = layoutInfo.height;
            this._fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._emptySelectionClipboard = options.get(37 /* EditorOption.emptySelectionClipboard */);
            this._copyWithSyntaxHighlighting = options.get(25 /* EditorOption.copyWithSyntaxHighlighting */);
            this.textArea.setAttribute('wrap', this._textAreaWrapping && !this._visibleTextArea ? 'on' : 'off');
            const { tabSize } = this._context.viewModel.model.getOptions();
            this.textArea.domNode.style.tabSize = `${tabSize * this._fontInfo.spaceWidth}px`;
            this.textArea.setAttribute('aria-label', this._getAriaLabel(options));
            this.textArea.setAttribute('aria-required', options.get(5 /* EditorOption.ariaRequired */) ? 'true' : 'false');
            this.textArea.setAttribute('tabindex', String(options.get(124 /* EditorOption.tabIndex */)));
            if (e.hasChanged(34 /* EditorOption.domReadOnly */) || e.hasChanged(91 /* EditorOption.readOnly */)) {
                this._ensureReadOnlyAttribute();
            }
            if (e.hasChanged(2 /* EditorOption.accessibilitySupport */)) {
                this._textAreaInput.writeNativeTextAreaContent('strategy changed');
            }
            return true;
        }
        onCursorStateChanged(e) {
            this._selections = e.selections.slice(0);
            this._modelSelections = e.modelSelections.slice(0);
            // We must update the <textarea> synchronously, otherwise long press IME on macos breaks.
            // See https://github.com/microsoft/vscode/issues/165821
            this._textAreaInput.writeNativeTextAreaContent('selection changed');
            return true;
        }
        onDecorationsChanged(e) {
            // true for inline decorations that can end up relayouting text
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            this._scrollLeft = e.scrollLeft;
            this._scrollTop = e.scrollTop;
            return true;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        // --- begin view API
        isFocused() {
            return this._textAreaInput.isFocused();
        }
        focusTextArea() {
            this._textAreaInput.focusTextArea();
        }
        refreshFocusState() {
            this._textAreaInput.refreshFocusState();
        }
        getLastRenderData() {
            return this._lastRenderPosition;
        }
        setAriaOptions(options) {
            if (options.activeDescendant) {
                this.textArea.setAttribute('aria-haspopup', 'true');
                this.textArea.setAttribute('aria-autocomplete', 'list');
                this.textArea.setAttribute('aria-activedescendant', options.activeDescendant);
            }
            else {
                this.textArea.setAttribute('aria-haspopup', 'false');
                this.textArea.setAttribute('aria-autocomplete', 'both');
                this.textArea.removeAttribute('aria-activedescendant');
            }
            if (options.role) {
                this.textArea.setAttribute('role', options.role);
            }
        }
        // --- end view API
        _ensureReadOnlyAttribute() {
            const options = this._context.configuration.options;
            // When someone requests to disable IME, we set the "readonly" attribute on the <textarea>.
            // This will prevent composition.
            const useReadOnly = !ime_1.IME.enabled || (options.get(34 /* EditorOption.domReadOnly */) && options.get(91 /* EditorOption.readOnly */));
            if (useReadOnly) {
                this.textArea.setAttribute('readonly', 'true');
            }
            else {
                this.textArea.removeAttribute('readonly');
            }
        }
        prepareRender(ctx) {
            this._primaryCursorPosition = new position_1.Position(this._selections[0].positionLineNumber, this._selections[0].positionColumn);
            this._primaryCursorVisibleRange = ctx.visibleRangeForPosition(this._primaryCursorPosition);
            this._visibleTextArea?.prepareRender(ctx);
        }
        render(ctx) {
            this._textAreaInput.writeNativeTextAreaContent('render');
            this._render();
        }
        _render() {
            if (this._visibleTextArea) {
                // The text area is visible for composition reasons
                const visibleStart = this._visibleTextArea.visibleTextareaStart;
                const visibleEnd = this._visibleTextArea.visibleTextareaEnd;
                const startPosition = this._visibleTextArea.startPosition;
                const endPosition = this._visibleTextArea.endPosition;
                if (startPosition && endPosition && visibleStart && visibleEnd && visibleEnd.left >= this._scrollLeft && visibleStart.left <= this._scrollLeft + this._contentWidth) {
                    const top = (this._context.viewLayout.getVerticalOffsetForLineNumber(this._primaryCursorPosition.lineNumber) - this._scrollTop);
                    const lineCount = this._newlinecount(this.textArea.domNode.value.substr(0, this.textArea.domNode.selectionStart));
                    let scrollLeft = this._visibleTextArea.widthOfHiddenLineTextBefore;
                    let left = (this._contentLeft + visibleStart.left - this._scrollLeft);
                    // See https://github.com/microsoft/vscode/issues/141725#issuecomment-1050670841
                    // Here we are adding +1 to avoid flickering that might be caused by having a width that is too small.
                    // This could be caused by rounding errors that might only show up with certain font families.
                    // In other words, a pixel might be lost when doing something like
                    //      `Math.round(end) - Math.round(start)`
                    // vs
                    //      `Math.round(end - start)`
                    let width = visibleEnd.left - visibleStart.left + 1;
                    if (left < this._contentLeft) {
                        // the textarea would be rendered on top of the margin,
                        // so reduce its width. We use the same technique as
                        // for hiding text before
                        const delta = (this._contentLeft - left);
                        left += delta;
                        scrollLeft += delta;
                        width -= delta;
                    }
                    if (width > this._contentWidth) {
                        // the textarea would be wider than the content width,
                        // so reduce its width.
                        width = this._contentWidth;
                    }
                    // Try to render the textarea with the color/font style to match the text under it
                    const viewLineData = this._context.viewModel.getViewLineData(startPosition.lineNumber);
                    const startTokenIndex = viewLineData.tokens.findTokenIndexAtOffset(startPosition.column - 1);
                    const endTokenIndex = viewLineData.tokens.findTokenIndexAtOffset(endPosition.column - 1);
                    const textareaSpansSingleToken = (startTokenIndex === endTokenIndex);
                    const presentation = this._visibleTextArea.definePresentation((textareaSpansSingleToken ? viewLineData.tokens.getPresentation(startTokenIndex) : null));
                    this.textArea.domNode.scrollTop = lineCount * this._lineHeight;
                    this.textArea.domNode.scrollLeft = scrollLeft;
                    this._doRender({
                        lastRenderPosition: null,
                        top: top,
                        left: left,
                        width: width,
                        height: this._lineHeight,
                        useCover: false,
                        color: (languages_1.TokenizationRegistry.getColorMap() || [])[presentation.foreground],
                        italic: presentation.italic,
                        bold: presentation.bold,
                        underline: presentation.underline,
                        strikethrough: presentation.strikethrough
                    });
                }
                return;
            }
            if (!this._primaryCursorVisibleRange) {
                // The primary cursor is outside the viewport => place textarea to the top left
                this._renderAtTopLeft();
                return;
            }
            const left = this._contentLeft + this._primaryCursorVisibleRange.left - this._scrollLeft;
            if (left < this._contentLeft || left > this._contentLeft + this._contentWidth) {
                // cursor is outside the viewport
                this._renderAtTopLeft();
                return;
            }
            const top = this._context.viewLayout.getVerticalOffsetForLineNumber(this._selections[0].positionLineNumber) - this._scrollTop;
            if (top < 0 || top > this._contentHeight) {
                // cursor is outside the viewport
                this._renderAtTopLeft();
                return;
            }
            // The primary cursor is in the viewport (at least vertically) => place textarea on the cursor
            if (platform.isMacintosh || this._accessibilitySupport === 2 /* AccessibilitySupport.Enabled */) {
                // For the popup emoji input, we will make the text area as high as the line height
                // We will also make the fontSize and lineHeight the correct dimensions to help with the placement of these pickers
                this._doRender({
                    lastRenderPosition: this._primaryCursorPosition,
                    top,
                    left: this._textAreaWrapping ? this._contentLeft : left,
                    width: this._textAreaWidth,
                    height: this._lineHeight,
                    useCover: false
                });
                // In case the textarea contains a word, we're going to try to align the textarea's cursor
                // with our cursor by scrolling the textarea as much as possible
                this.textArea.domNode.scrollLeft = this._primaryCursorVisibleRange.left;
                const lineCount = this._textAreaInput.textAreaState.newlineCountBeforeSelection ?? this._newlinecount(this.textArea.domNode.value.substr(0, this.textArea.domNode.selectionStart));
                this.textArea.domNode.scrollTop = lineCount * this._lineHeight;
                return;
            }
            this._doRender({
                lastRenderPosition: this._primaryCursorPosition,
                top: top,
                left: this._textAreaWrapping ? this._contentLeft : left,
                width: this._textAreaWidth,
                height: (canUseZeroSizeTextarea ? 0 : 1),
                useCover: false
            });
        }
        _newlinecount(text) {
            let result = 0;
            let startIndex = -1;
            do {
                startIndex = text.indexOf('\n', startIndex + 1);
                if (startIndex === -1) {
                    break;
                }
                result++;
            } while (true);
            return result;
        }
        _renderAtTopLeft() {
            // (in WebKit the textarea is 1px by 1px because it cannot handle input to a 0x0 textarea)
            // specifically, when doing Korean IME, setting the textarea to 0x0 breaks IME badly.
            this._doRender({
                lastRenderPosition: null,
                top: 0,
                left: 0,
                width: this._textAreaWidth,
                height: (canUseZeroSizeTextarea ? 0 : 1),
                useCover: true
            });
        }
        _doRender(renderData) {
            this._lastRenderPosition = renderData.lastRenderPosition;
            const ta = this.textArea;
            const tac = this.textAreaCover;
            (0, domFontInfo_1.applyFontInfo)(ta, this._fontInfo);
            ta.setTop(renderData.top);
            ta.setLeft(renderData.left);
            ta.setWidth(renderData.width);
            ta.setHeight(renderData.height);
            ta.setColor(renderData.color ? color_1.Color.Format.CSS.formatHex(renderData.color) : '');
            ta.setFontStyle(renderData.italic ? 'italic' : '');
            if (renderData.bold) {
                // fontWeight is also set by `applyFontInfo`, so only overwrite it if necessary
                ta.setFontWeight('bold');
            }
            ta.setTextDecoration(`${renderData.underline ? ' underline' : ''}${renderData.strikethrough ? ' line-through' : ''}`);
            tac.setTop(renderData.useCover ? renderData.top : 0);
            tac.setLeft(renderData.useCover ? renderData.left : 0);
            tac.setWidth(renderData.useCover ? renderData.width : 0);
            tac.setHeight(renderData.useCover ? renderData.height : 0);
            const options = this._context.configuration.options;
            if (options.get(57 /* EditorOption.glyphMargin */)) {
                tac.setClassName('monaco-editor-background textAreaCover ' + margin_1.Margin.OUTER_CLASS_NAME);
            }
            else {
                if (options.get(68 /* EditorOption.lineNumbers */).renderType !== 0 /* RenderLineNumbersType.Off */) {
                    tac.setClassName('monaco-editor-background textAreaCover ' + lineNumbers_1.LineNumbersOverlay.CLASS_NAME);
                }
                else {
                    tac.setClassName('monaco-editor-background textAreaCover');
                }
            }
        }
    };
    exports.TextAreaHandler = TextAreaHandler;
    exports.TextAreaHandler = TextAreaHandler = __decorate([
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService)
    ], TextAreaHandler);
    function measureText(targetDocument, text, fontInfo, tabSize) {
        if (text.length === 0) {
            return 0;
        }
        const container = targetDocument.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-50000px';
        container.style.width = '50000px';
        const regularDomNode = targetDocument.createElement('span');
        (0, domFontInfo_1.applyFontInfo)(regularDomNode, fontInfo);
        regularDomNode.style.whiteSpace = 'pre'; // just like the textarea
        regularDomNode.style.tabSize = `${tabSize * fontInfo.spaceWidth}px`; // just like the textarea
        regularDomNode.append(text);
        container.appendChild(regularDomNode);
        targetDocument.body.appendChild(container);
        const res = regularDomNode.offsetWidth;
        targetDocument.body.removeChild(container);
        return res;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEFyZWFIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvY29udHJvbGxlci90ZXh0QXJlYUhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUNoRyxNQUFNLG1CQUFtQjtRQWlCeEIsWUFDa0IsUUFBcUIsRUFDdEIsZUFBdUIsRUFDdkIsd0JBQWdDLEVBQ2hDLDJCQUFtQyxFQUNuQyxzQkFBOEI7WUFKN0IsYUFBUSxHQUFSLFFBQVEsQ0FBYTtZQUN0QixvQkFBZSxHQUFmLGVBQWUsQ0FBUTtZQUN2Qiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQVE7WUFDaEMsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUFRO1lBQ25DLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBUTtZQXJCL0MsMEJBQXFCLEdBQVMsU0FBUyxDQUFDO1lBRWpDLGtCQUFhLEdBQW9CLElBQUksQ0FBQztZQUN0QyxnQkFBVyxHQUFvQixJQUFJLENBQUM7WUFFcEMseUJBQW9CLEdBQThCLElBQUksQ0FBQztZQUN2RCx1QkFBa0IsR0FBOEIsSUFBSSxDQUFDO1lBRTVEOzs7OztlQUtHO1lBQ0ssMEJBQXFCLEdBQThCLElBQUksQ0FBQztRQVNoRSxDQUFDO1FBRUQsYUFBYSxDQUFDLG9CQUEyQztZQUN4RCxNQUFNLGtCQUFrQixHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqRyxNQUFNLGdCQUFnQixHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMs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