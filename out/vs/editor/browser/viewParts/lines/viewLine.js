/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/fastDomNode", "vs/base/common/platform", "vs/editor/browser/viewParts/lines/rangeUtil", "vs/editor/browser/view/renderingContext", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/viewLineRenderer", "vs/platform/theme/common/theme", "vs/editor/common/config/editorOptions"], function (require, exports, browser, fastDomNode_1, platform, rangeUtil_1, renderingContext_1, lineDecorations_1, viewLineRenderer_1, theme_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewLine = exports.ViewLineOptions = void 0;
    exports.getColumnOfNodeOffset = getColumnOfNodeOffset;
    const canUseFastRenderedViewLine = (function () {
        if (platform.isNative) {
            // In VSCode we know very well when the zoom level changes
            return true;
        }
        if (platform.isLinux || browser.isFirefox || browser.isSafari) {
            // On Linux, it appears that zooming affects char widths (in pixels), which is unexpected.
            // --
            // Even though we read character widths correctly, having read them at a specific zoom level
            // does not mean they are the same at the current zoom level.
            // --
            // This could be improved if we ever figure out how to get an event when browsers zoom,
            // but until then we have to stick with reading client rects.
            // --
            // The same has been observed with Firefox on Windows7
            // --
            // The same has been oversved with Safari
            return false;
        }
        return true;
    })();
    let monospaceAssumptionsAreValid = true;
    class ViewLineOptions {
        constructor(config, themeType) {
            this.themeType = themeType;
            const options = config.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const experimentalWhitespaceRendering = options.get(38 /* EditorOption.experimentalWhitespaceRendering */);
            if (experimentalWhitespaceRendering === 'off') {
                this.renderWhitespace = options.get(99 /* EditorOption.renderWhitespace */);
            }
            else {
                // whitespace is rendered in a different layer
                this.renderWhitespace = 'none';
            }
            this.renderControlCharacters = options.get(94 /* EditorOption.renderControlCharacters */);
            this.spaceWidth = fontInfo.spaceWidth;
            this.middotWidth = fontInfo.middotWidth;
            this.wsmiddotWidth = fontInfo.wsmiddotWidth;
            this.useMonospaceOptimizations = (fontInfo.isMonospace
                && !options.get(33 /* EditorOption.disableMonospaceOptimizations */));
            this.canUseHalfwidthRightwardsArrow = fontInfo.canUseHalfwidthRightwardsArrow;
            this.lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this.stopRenderingLineAfter = options.get(117 /* EditorOption.stopRenderingLineAfter */);
            this.fontLigatures = options.get(51 /* EditorOption.fontLigatures */);
        }
        equals(other) {
            return (this.themeType === other.themeType
                && this.renderWhitespace === other.renderWhitespace
                && this.renderControlCharacters === other.renderControlCharacters
                && this.spaceWidth === other.spaceWidth
                && this.middotWidth === other.middotWidth
                && this.wsmiddotWidth === other.wsmiddotWidth
                && this.useMonospaceOptimizations === other.useMonospaceOptimizations
                && this.canUseHalfwidthRightwardsArrow === other.canUseHalfwidthRightwardsArrow
                && this.lineHeight === other.lineHeight
                && this.stopRenderingLineAfter === other.stopRenderingLineAfter
                && this.fontLigatures === other.fontLigatures);
        }
    }
    exports.ViewLineOptions = ViewLineOptions;
    class ViewLine {
        static { this.CLASS_NAME = 'view-line'; }
        constructor(options) {
            this._options = options;
            this._isMaybeInvalid = true;
            this._renderedViewLine = null;
        }
        // --- begin IVisibleLineData
        getDomNode() {
            if (this._renderedViewLine && this._renderedViewLine.domNode) {
                return this._renderedViewLine.domNode.domNode;
            }
            return null;
        }
        setDomNode(domNode) {
            if (this._renderedViewLine) {
                this._renderedViewLine.domNode = (0, fastDomNode_1.createFastDomNode)(domNode);
            }
            else {
                throw new Error('I have no rendered view line to set the dom node to...');
            }
        }
        onContentChanged() {
            this._isMaybeInvalid = true;
        }
        onTokensChanged() {
            this._isMaybeInvalid = true;
        }
        onDecorationsChanged() {
            this._isMaybeInvalid = true;
        }
        onOptionsChanged(newOptions) {
            this._isMaybeInvalid = true;
            this._options = newOptions;
        }
        onSelectionChanged() {
            if ((0, theme_1.isHighContrast)(this._options.themeType) || this._options.renderWhitespace === 'selection') {
                this._isMaybeInvalid = true;
                return true;
            }
            return false;
        }
        renderLine(lineNumber, deltaTop, lineHeight, viewportData, sb) {
            if (this._isMaybeInvalid === false) {
                // it appears that nothing relevant has changed
                return false;
            }
            this._isMaybeInvalid = false;
            const lineData = viewportData.getViewLineRenderingData(lineNumber);
            const options = this._options;
            const actualInlineDecorations = lineDecorations_1.LineDecoration.filter(lineData.inlineDecorations, lineNumber, lineData.minColumn, lineData.maxColumn);
            // Only send selection information when needed for rendering whitespace
            let selectionsOnLine = null;
            if ((0, theme_1.isHighContrast)(options.themeType) || this._options.renderWhitespace === 'selection') {
                const selections = viewportData.selections;
                for (const selection of selections) {
                    if (selection.endLineNumber < lineNumber || selection.startLineNumber > lineNumber) {
                        // Selection does not intersect line
                        continue;
                    }
                    const startColumn = (selection.startLineNumber === lineNumber ? selection.startColumn : lineData.minColumn);
                    const endColumn = (selection.endLineNumber === lineNumber ? selection.endColumn : lineData.maxColumn);
                    if (startColumn < endColumn) {
                        if ((0, theme_1.isHighContrast)(options.themeType)) {
                            actualInlineDecorations.push(new lineDecorations_1.LineDecoration(startColumn, endColumn, 'inline-selected-text', 0 /* InlineDecorationType.Regular */));
                        }
                        if (this._options.renderWhitespace === 'selection') {
                            if (!selectionsOnLine) {
                                selectionsOnLine = [];
                            }
                            selectionsOnLine.push(new viewLineRenderer_1.LineRange(startColumn - 1, endColumn - 1));
                        }
                    }
                }
            }
            const renderLineInput = new viewLineRenderer_1.RenderLineInput(options.useMonospaceOptimizations, options.canUseHalfwidthRightwardsArrow, lineData.content, lineData.continuesWithWrappedLine, lineData.isBasicASCII, lineData.containsRTL, lineData.minColumn - 1, lineData.tokens, actualInlineDecorations, lineData.tabSize, lineData.startVisibleColumn, options.spaceWidth, options.middotWidth, options.wsmiddotWidth, options.stopRenderingLineAfter, options.renderWhitespace, options.renderControlCharacters, options.fontLigatures !== editorOptions_1.EditorFontLigatures.OFF, selectionsOnLine);
            if (this._renderedViewLine && this._renderedViewLine.input.equals(renderLineInput)) {
                // no need to do anything, we have the same render input
                return false;
            }
            sb.appendString('<div style="top:');
            sb.appendString(String(deltaTop));
            sb.appendString('px;height:');
            sb.appendString(String(lineHeight));
            sb.appendString('px;" class="');
            sb.appendString(ViewLine.CLASS_NAME);
            sb.appendString('">');
            const output = (0, viewLineRenderer_1.renderViewLine)(renderLineInput, sb);
            sb.appendString('</div>');
            let renderedViewLine = null;
            if (monospaceAssumptionsAreValid && canUseFastRenderedViewLine && lineData.isBasicASCII && options.useMonospaceOptimizations && output.containsForeignElements === 0 /* ForeignElementType.None */) {
                renderedViewLine = new FastRenderedViewLine(this._renderedViewLine ? this._renderedViewLine.domNode : null, renderLineInput, output.characterMapping);
            }
            if (!renderedViewLine) {
                renderedViewLine = createRenderedLine(this._renderedViewLine ? this._renderedViewLine.domNode : null, renderLineInput, output.characterMapping, output.containsRTL, output.containsForeignElements);
            }
            this._renderedViewLine = renderedViewLine;
            return true;
        }
        layoutLine(lineNumber, deltaTop, lineHeight) {
            if (this._renderedViewLine && this._renderedViewLine.domNode) {
                this._renderedViewLine.domNode.setTop(deltaTop);
                this._renderedViewLine.domNode.setHeight(lineHeight);
            }
        }
        // --- end IVisibleLineData
        getWidth(context) {
            if (!this._renderedViewLine) {
                return 0;
            }
            return this._renderedViewLine.getWidth(context);
        }
        getWidthIsFast() {
            if (!this._renderedViewLine) {
                return true;
            }
            return this._renderedViewLine.getWidthIsFast();
        }
        needsMonospaceFontCheck() {
            if (!this._renderedViewLine) {
                return false;
            }
            return (this._renderedViewLine instanceof FastRenderedViewLine);
        }
        monospaceAssumptionsAreValid() {
            if (!this._renderedViewLine) {
                return monospaceAssumptionsAreValid;
            }
            if (this._renderedViewLine instanceof FastRenderedViewLine) {
                return this._renderedViewLine.monospaceAssumptionsAreValid();
            }
            return monospaceAssumptionsAreValid;
        }
        onMonospaceAssumptionsInvalidated() {
            if (this._renderedViewLine && this._renderedViewLine instanceof FastRenderedViewLine) {
                this._renderedViewLine = this._renderedViewLine.toSlowRenderedLine();
            }
        }
        getVisibleRangesForRange(lineNumber, startColumn, endColumn, context) {
            if (!this._renderedViewLine) {
                return null;
            }
            startColumn = Math.min(this._renderedViewLine.input.lineContent.length + 1, Math.max(1, startColumn));
            endColumn = Math.min(this._renderedViewLine.input.lineContent.length + 1, Math.max(1, endColumn));
            const stopRenderingLineAfter = this._renderedViewLine.input.stopRenderingLineAfter;
            if (stopRenderingLineAfter !== -1 && startColumn > stopRenderingLineAfter + 1 && endColumn > stopRenderingLineAfter + 1) {
                // This range is obviously not visible
                return new renderingContext_1.VisibleRanges(true, [new renderingContext_1.FloatHorizontalRange(this.getWidth(context), 0)]);
            }
            if (stopRenderingLineAfter !== -1 && startColumn > stopRenderingLineAfter + 1) {
                startColumn = stopRenderingLineAfter + 1;
            }
            if (stopRenderingLineAfter !== -1 && endColumn > stopRenderingLineAfter + 1) {
                endColumn = stopRenderingLineAfter + 1;
            }
            const horizontalRanges = this._renderedViewLine.getVisibleRangesForRange(lineNumber, startColumn, endColumn, context);
            if (horizontalRanges && horizontalRanges.length > 0) {
                return new renderingContext_1.VisibleRanges(false, horizontalRanges);
            }
            return null;
        }
        getColumnOfNodeOffset(spanNode, offset) {
            if (!this._renderedViewLine) {
                return 1;
            }
            return this._renderedViewLine.getColumnOfNodeOffset(spanNode, offset);
        }
    }
    exports.ViewLine = ViewLine;
    var Constants;
    (function (Constants) {
        /**
         * It seems that rounding errors occur with long lines, so the purely multiplication based
         * method is only viable for short lines. For longer lines, we look up the real position of
         * every 300th character and use multiplication based on that.
         *
         * See https://github.com/microsoft/vscode/issues/33178
         */
        Constants[Constants["MaxMonospaceDistance"] = 300] = "MaxMonospaceDistance";
    })(Constants || (Constants = {}));
    /**
     * A rendered line which is guaranteed to contain only regular ASCII and is rendered with a monospace font.
     */
    class FastRenderedViewLine {
        constructor(domNode, renderLineInput, characterMapping) {
            this._cachedWidth = -1;
            this.domNode = domNode;
            this.input = renderLineInput;
            const keyColumnCount = Math.floor(renderLineInput.lineContent.length / 300 /* Constants.MaxMonospaceDistance */);
            if (keyColumnCount > 0) {
                this._keyColumnPixelOffsetCache = new Float32Array(keyColumnCount);
                for (let i = 0; i < keyColumnCount; i++) {
                    this._keyColumnPixelOffsetCache[i] = -1;
                }
            }
            else {
                this._keyColumnPixelOffsetCache = null;
            }
            this._characterMapping = characterMapping;
            this._charWidth = renderLineInput.spaceWidth;
        }
        getWidth(context) {
            if (!this.domNode || this.input.lineContent.length < 300 /* Constants.MaxMonospaceDistance */) {
                const horizontalOffset = this._characterMapping.getHorizontalOffset(this._characterMapping.length);
                return Math.round(this._charWidth * horizontalOffset);
            }
            if (this._cachedWidth === -1) {
                this._cachedWidth = this._getReadingTarget(this.domNode).offsetWidth;
                context?.markDidDomLayout();
            }
            return this._cachedWidth;
        }
        getWidthIsFast() {
            return (this.input.lineContent.length < 300 /* Constants.MaxMonospaceDistance */) || this._cachedWidth !== -1;
        }
        monospaceAssumptionsAreValid() {
            if (!this.domNode) {
                return monospaceAssumptionsAreValid;
            }
            if (this.input.lineContent.length < 300 /* Constants.MaxMonospaceDistance */) {
                const expectedWidth = this.getWidth(null);
                const actualWidth = this.domNode.domNode.firstChild.offsetWidth;
                if (Math.abs(expectedWidth - actualWidth) >= 2) {
                    // more than 2px off
                    console.warn(`monospace assumptions have been violated, therefore disabling monospace optimizations!`);
                    monospaceAssumptionsAreValid = false;
                }
            }
            return monospaceAssumptionsAreValid;
        }
        toSlowRenderedLine() {
            return createRenderedLine(this.domNode, this.input, this._characterMapping, false, 0 /* ForeignElementType.None */);
        }
        getVisibleRangesForRange(lineNumber, startColumn, endColumn, context) {
            const startPosition = this._getColumnPixelOffset(lineNumber, startColumn, context);
            const endPosition = this._getColumnPixelOffset(lineNumber, endColumn, context);
            return [new renderingContext_1.FloatHorizontalRange(startPosition, endPosition - startPosition)];
        }
        _getColumnPixelOffset(lineNumber, column, context) {
            if (column <= 300 /* Constants.MaxMonospaceDistance */) {
                const horizontalOffset = this._characterMapping.getHorizontalOffset(column);
                return this._charWidth * horizontalOffset;
            }
            const keyColumnOrdinal = Math.floor((column - 1) / 300 /* Constants.MaxMonospaceDistance */) - 1;
            const keyColumn = (keyColumnOrdinal + 1) * 300 /* Constants.MaxMonospaceDistance */ + 1;
            let keyColumnPixelOffset = -1;
            if (this._keyColumnPixelOffsetCache) {
                keyColumnPixelOffset = this._keyColumnPixelOffsetCache[keyColumnOrdinal];
                if (keyColumnPixelOffset === -1) {
                    keyColumnPixelOffset = this._actualReadPixelOffset(lineNumber, keyColumn, context);
                    this._keyColumnPixelOffsetCache[keyColumnOrdinal] = keyColumnPixelOffset;
                }
            }
            if (keyColumnPixelOffset === -1) {
                // Could not read actual key column pixel offset
                const horizontalOffset = this._characterMapping.getHorizontalOffset(column);
                return this._charWidth * horizontalOffset;
            }
            const keyColumnHorizontalOffset = this._characterMapping.getHorizontalOffset(keyColumn);
            const horizontalOffset = this._characterMapping.getHorizontalOffset(column);
            return keyColumnPixelOffset + this._charWidth * (horizontalOffset - keyColumnHorizontalOffset);
        }
        _getReadingTarget(myDomNode) {
            return myDomNode.domNode.firstChild;
        }
        _actualReadPixelOffset(lineNumber, column, context) {
            if (!this.domNode) {
                return -1;
            }
            const domPosition = this._characterMapping.getDomPosition(column);
            const r = rangeUtil_1.RangeUtil.readHorizontalRanges(this._getReadingTarget(this.domNode), domPosition.partIndex, domPosition.charIndex, domPosition.partIndex, domPosition.charIndex, context);
            if (!r || r.length === 0) {
                return -1;
            }
            return r[0].left;
        }
        getColumnOfNodeOffset(spanNode, offset) {
            return getColumnOfNodeOffset(this._characterMapping, spanNode, offset);
        }
    }
    /**
     * Every time we render a line, we save what we have rendered in an instance of this class.
     */
    class RenderedViewLine {
        constructor(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements) {
            this.domNode = domNode;
            this.input = renderLineInput;
            this._characterMapping = characterMapping;
            this._isWhitespaceOnly = /^\s*$/.test(renderLineInput.lineContent);
            this._containsForeignElements = containsForeignElements;
            this._cachedWidth = -1;
            this._pixelOffsetCache = null;
            if (!containsRTL || this._characterMapping.length === 0 /* the line is empty */) {
                this._pixelOffsetCache = new Float32Array(Math.max(2, this._characterMapping.length + 1));
                for (let column = 0, len = this._characterMapping.length; column <= len; column++) {
                    this._pixelOffsetCache[column] = -1;
                }
            }
        }
        // --- Reading from the DOM methods
        _getReadingTarget(myDomNode) {
            return myDomNode.domNode.firstChild;
        }
        /**
         * Width of the line in pixels
         */
        getWidth(context) {
            if (!this.domNode) {
                return 0;
            }
            if (this._cachedWidth === -1) {
                this._cachedWidth = this._getReadingTarget(this.domNode).offsetWidth;
                context?.markDidDomLayout();
            }
            return this._cachedWidth;
        }
        getWidthIsFast() {
            if (this._cachedWidth === -1) {
                return false;
            }
            return true;
        }
        /**
         * Visible ranges for a model range
         */
        getVisibleRangesForRange(lineNumber, startColumn, endColumn, context) {
            if (!this.domNode) {
                return null;
            }
            if (this._pixelOffsetCache !== null) {
                // the text is LTR
                const startOffset = this._readPixelOffset(this.domNode, lineNumber, startColumn, context);
                if (startOffset === -1) {
                    return null;
                }
                const endOffset = this._readPixelOffset(this.domNode, lineNumber, endColumn, context);
                if (endOffset === -1) {
                    return null;
                }
                return [new renderingContext_1.FloatHorizontalRange(startOffset, endOffset - startOffset)];
            }
            return this._readVisibleRangesForRange(this.domNode, lineNumber, startColumn, endColumn, context);
        }
        _readVisibleRangesForRange(domNode, lineNumber, startColumn, endColumn, context) {
            if (startColumn === endColumn) {
                const pixelOffset = this._readPixelOffset(domNode, lineNumber, startColumn, context);
                if (pixelOffset === -1) {
                    return null;
                }
                else {
                    return [new renderingContext_1.FloatHorizontalRange(pixelOffset, 0)];
                }
            }
            else {
                return this._readRawVisibleRangesForRange(domNode, startColumn, endColumn, context);
            }
        }
        _readPixelOffset(domNode, lineNumber, column, context) {
            if (this._characterMapping.length === 0) {
                // This line has no content
                if (this._containsForeignElements === 0 /* ForeignElementType.None */) {
                    // We can assume the line is really empty
                    return 0;
                }
                if (this._containsForeignElements === 2 /* ForeignElementType.After */) {
                    // We have foreign elements after the (empty) line
                    return 0;
                }
                if (this._containsForeignElements === 1 /* ForeignElementType.Before */) {
                    // We have foreign elements before the (empty) line
                    return this.getWidth(context);
                }
                // We have foreign elements before & after the (empty) line
                const readingTarget = this._getReadingTarget(domNode);
                if (readingTarget.firstChild) {
                    context.markDidDomLayout();
                    return readingTarget.firstChild.offsetWidth;
                }
                else {
                    return 0;
                }
            }
            if (this._pixelOffsetCache !== null) {
                // the text is LTR
                const cachedPixelOffset = this._pixelOffsetCache[column];
                if (cachedPixelOffset !== -1) {
                    return cachedPixelOffset;
                }
                const result = this._actualReadPixelOffset(domNode, lineNumber, column, context);
                this._pixelOffsetCache[column] = result;
                return result;
            }
            return this._actualReadPixelOffset(domNode, lineNumber, column, context);
        }
        _actualReadPixelOffset(domNode, lineNumber, column, context) {
            if (this._characterMapping.length === 0) {
                // This line has no content
                const r = rangeUtil_1.RangeUtil.readHorizontalRanges(this._getReadingTarget(domNode), 0, 0, 0, 0, context);
                if (!r || r.length === 0) {
                    return -1;
                }
                return r[0].left;
            }
            if (column === this._characterMapping.length && this._isWhitespaceOnly && this._containsForeignElements === 0 /* ForeignElementType.None */) {
                // This branch helps in the case of whitespace only lines which have a width set
                return this.getWidth(context);
            }
            const domPosition = this._characterMapping.getDomPosition(column);
            const r = rangeUtil_1.RangeUtil.readHorizontalRanges(this._getReadingTarget(domNode), domPosition.partIndex, domPosition.charIndex, domPosition.partIndex, domPosition.charIndex, context);
            if (!r || r.length === 0) {
                return -1;
            }
            const result = r[0].left;
            if (this.input.isBasicASCII) {
                const horizontalOffset = this._characterMapping.getHorizontalOffset(column);
                const expectedResult = Math.round(this.input.spaceWidth * horizontalOffset);
                if (Math.abs(expectedResult - result) <= 1) {
                    return expectedResult;
                }
            }
            return result;
        }
        _readRawVisibleRangesForRange(domNode, startColumn, endColumn, context) {
            if (startColumn === 1 && endColumn === this._characterMapping.length) {
                // This branch helps IE with bidi text & gives a performance boost to other browsers when reading visible ranges for an entire line
                return [new renderingContext_1.FloatHorizontalRange(0, this.getWidth(context))];
            }
            const startDomPosition = this._characterMapping.getDomPosition(startColumn);
            const endDomPosition = this._characterMapping.getDomPosition(endColumn);
            return rangeUtil_1.RangeUtil.readHorizontalRanges(this._getReadingTarget(domNode), startDomPosition.partIndex, startDomPosition.charIndex, endDomPosition.partIndex, endDomPosition.charIndex, context);
        }
        /**
         * Returns the column for the text found at a specific offset inside a rendered dom node
         */
        getColumnOfNodeOffset(spanNode, offset) {
            return getColumnOfNodeOffset(this._characterMapping, spanNode, offset);
        }
    }
    class WebKitRenderedViewLine extends RenderedViewLine {
        _readVisibleRangesForRange(domNode, lineNumber, startColumn, endColumn, context) {
            const output = super._readVisibleRangesForRange(domNode, lineNumber, startColumn, endColumn, context);
            if (!output || output.length === 0 || startColumn === endColumn || (startColumn === 1 && endColumn === this._characterMapping.length)) {
                return output;
            }
            // WebKit is buggy and returns an expanded range (to contain words in some cases)
            // The last client rect is enlarged (I think)
            if (!this.input.containsRTL) {
                // This is an attempt to patch things up
                // Find position of last column
                const endPixelOffset = this._readPixelOffset(domNode, lineNumber, endColumn, context);
                if (endPixelOffset !== -1) {
                    const lastRange = output[output.length - 1];
                    if (lastRange.left < endPixelOffset) {
                        // Trim down the width of the last visible range to not go after the last column's position
                        lastRange.width = endPixelOffset - lastRange.left;
                    }
                }
            }
            return output;
        }
    }
    const createRenderedLine = (function () {
        if (browser.isWebKit) {
            return createWebKitRenderedLine;
        }
        return createNormalRenderedLine;
    })();
    function createWebKitRenderedLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements) {
        return new WebKitRenderedViewLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements);
    }
    function createNormalRenderedLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements) {
        return new RenderedViewLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements);
    }
    function getColumnOfNodeOffset(characterMapping, spanNode, offset) {
        const spanNodeTextContentLength = spanNode.textContent.length;
        let spanIndex = -1;
        while (spanNode) {
            spanNode = spanNode.previousSibling;
            spanIndex++;
        }
        return characterMapping.getColumn(new viewLineRenderer_1.DomPosition(spanIndex, offset), spanNodeTextContentLength);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xpbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvbGluZXMvdmlld0xpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNnNCaEcsc0RBVUM7SUFyc0JELE1BQU0sMEJBQTBCLEdBQUcsQ0FBQztRQUNuQyxJQUFJLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN2QiwwREFBMEQ7WUFDMUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsSUFBSSxRQUFRLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQy9ELDBGQUEwRjtZQUMxRixLQUFLO1lBQ0wsNEZBQTRGO1lBQzVGLDZEQUE2RDtZQUM3RCxLQUFLO1lBQ0wsdUZBQXVGO1lBQ3ZGLDZEQUE2RDtZQUM3RCxLQUFLO1lBQ0wsc0RBQXNEO1lBQ3RELEtBQUs7WUFDTCx5Q0FBeUM7WUFDekMsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDLENBQUMsRUFBRSxDQUFDO0lBRUwsSUFBSSw0QkFBNEIsR0FBRyxJQUFJLENBQUM7SUFFeEMsTUFBYSxlQUFlO1FBYTNCLFlBQVksTUFBNEIsRUFBRSxTQUFzQjtZQUMvRCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUMzQixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLGdDQUF1QixDQUFDO1lBQ3BELE1BQU0sK0JBQStCLEdBQUcsT0FBTyxDQUFDLEdBQUcsdURBQThDLENBQUM7WUFDbEcsSUFBSSwrQkFBK0IsS0FBSyxLQUFLLEVBQUUs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