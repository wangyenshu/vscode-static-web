/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/mouseCursor/mouseCursor", "vs/base/common/async", "vs/base/common/platform", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/view/renderingContext", "vs/editor/browser/view/viewLayer", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/lines/domReadingContext", "vs/editor/browser/viewParts/lines/viewLine", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/css!./viewLines"], function (require, exports, mouseCursor_1, async_1, platform, domFontInfo_1, renderingContext_1, viewLayer_1, viewPart_1, domReadingContext_1, viewLine_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewLines = void 0;
    class LastRenderedData {
        constructor() {
            this._currentVisibleRange = new range_1.Range(1, 1, 1, 1);
        }
        getCurrentVisibleRange() {
            return this._currentVisibleRange;
        }
        setCurrentVisibleRange(currentVisibleRange) {
            this._currentVisibleRange = currentVisibleRange;
        }
    }
    class HorizontalRevealRangeRequest {
        constructor(minimalReveal, lineNumber, startColumn, endColumn, startScrollTop, stopScrollTop, scrollType) {
            this.minimalReveal = minimalReveal;
            this.lineNumber = lineNumber;
            this.startColumn = startColumn;
            this.endColumn = endColumn;
            this.startScrollTop = startScrollTop;
            this.stopScrollTop = stopScrollTop;
            this.scrollType = scrollType;
            this.type = 'range';
            this.minLineNumber = lineNumber;
            this.maxLineNumber = lineNumber;
        }
    }
    class HorizontalRevealSelectionsRequest {
        constructor(minimalReveal, selections, startScrollTop, stopScrollTop, scrollType) {
            this.minimalReveal = minimalReveal;
            this.selections = selections;
            this.startScrollTop = startScrollTop;
            this.stopScrollTop = stopScrollTop;
            this.scrollType = scrollType;
            this.type = 'selections';
            let minLineNumber = selections[0].startLineNumber;
            let maxLineNumber = selections[0].endLineNumber;
            for (let i = 1, len = selections.length; i < len; i++) {
                const selection = selections[i];
                minLineNumber = Math.min(minLineNumber, selection.startLineNumber);
                maxLineNumber = Math.max(maxLineNumber, selection.endLineNumber);
            }
            this.minLineNumber = minLineNumber;
            this.maxLineNumber = maxLineNumber;
        }
    }
    class ViewLines extends viewPart_1.ViewPart {
        /**
         * Adds this amount of pixels to the right of lines (no-one wants to type near the edge of the viewport)
         */
        static { this.HORIZONTAL_EXTRA_PX = 30; }
        constructor(context, linesContent) {
            super(context);
            this._linesContent = linesContent;
            this._textRangeRestingSpot = document.createElement('div');
            this._visibleLines = new viewLayer_1.VisibleLinesCollection(this);
            this.domNode = this._visibleLines.domNode;
            const conf = this._context.configuration;
            const options = this._context.configuration.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this._isViewportWrapping = wrappingInfo.isViewportWrapping;
            this._revealHorizontalRightPadding = options.get(100 /* EditorOption.revealHorizontalRightPadding */);
            this._cursorSurroundingLines = options.get(29 /* EditorOption.cursorSurroundingLines */);
            this._cursorSurroundingLinesStyle = options.get(30 /* EditorOption.cursorSurroundingLinesStyle */);
            this._canUseLayerHinting = !options.get(32 /* EditorOption.disableLayerHinting */);
            this._viewLineOptions = new viewLine_1.ViewLineOptions(conf, this._context.theme.type);
            viewPart_1.PartFingerprints.write(this.domNode, 8 /* PartFingerprint.ViewLines */);
            this.domNode.setClassName(`view-lines ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`);
            (0, domFontInfo_1.applyFontInfo)(this.domNode, fontInfo);
            // --- width & height
            this._maxLineWidth = 0;
            this._asyncUpdateLineWidths = new async_1.RunOnceScheduler(() => {
                this._updateLineWidthsSlow();
            }, 200);
            this._asyncCheckMonospaceFontAssumptions = new async_1.RunOnceScheduler(() => {
                this._checkMonospaceFontAssumptions();
            }, 2000);
            this._lastRenderedData = new LastRenderedData();
            this._horizontalRevealRequest = null;
            // sticky scroll widget
            this._stickyScrollEnabled = options.get(115 /* EditorOption.stickyScroll */).enabled;
            this._maxNumberStickyLines = options.get(115 /* EditorOption.stickyScroll */).maxLineCount;
        }
        dispose() {
            this._asyncUpdateLineWidths.dispose();
            this._asyncCheckMonospaceFontAssumptions.dispose();
            super.dispose();
        }
        getDomNode() {
            return this.domNode;
        }
        // ---- begin IVisibleLinesHost
        createVisibleLine() {
            return new viewLine_1.ViewLine(this._viewLineOptions);
        }
        // ---- end IVisibleLinesHost
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            this._visibleLines.onConfigurationChanged(e);
            if (e.hasChanged(146 /* EditorOption.wrappingInfo */)) {
                this._maxLineWidth = 0;
            }
            const options = this._context.configuration.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this._isViewportWrapping = wrappingInfo.isViewportWrapping;
            this._revealHorizontalRightPadding = options.get(100 /* EditorOption.revealHorizontalRightPadding */);
            this._cursorSurroundingLines = options.get(29 /* EditorOption.cursorSurroundingLines */);
            this._cursorSurroundingLinesStyle = options.get(30 /* EditorOption.cursorSurroundingLinesStyle */);
            this._canUseLayerHinting = !options.get(32 /* EditorOption.disableLayerHinting */);
            // sticky scroll
            this._stickyScrollEnabled = options.get(115 /* EditorOption.stickyScroll */).enabled;
            this._maxNumberStickyLines = options.get(115 /* EditorOption.stickyScroll */).maxLineCount;
            (0, domFontInfo_1.applyFontInfo)(this.domNode, fontInfo);
            this._onOptionsMaybeChanged();
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                this._maxLineWidth = 0;
            }
            return true;
        }
        _onOptionsMaybeChanged() {
            const conf = this._context.configuration;
            const newViewLineOptions = new viewLine_1.ViewLineOptions(conf, this._context.theme.type);
            if (!this._viewLineOptions.equals(newViewLineOptions)) {
                this._viewLineOptions = newViewLineOptions;
                const startLineNumber = this._visibleLines.getStartLineNumber();
                const endLineNumber = this._visibleLines.getEndLineNumber();
                for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                    const line = this._visibleLines.getVisibleLine(lineNumber);
                    line.onOptionsChanged(this._viewLineOptions);
                }
                return true;
            }
            return false;
        }
        onCursorStateChanged(e) {
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            let r = false;
            for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                r = this._visibleLines.getVisibleLine(lineNumber).onSelectionChanged() || r;
            }
            return r;
        }
        onDecorationsChanged(e) {
            if (true /*e.inlineDecorationsChanged*/) {
                const rendStartLineNumber = this._visibleLines.getStartLineNumber();
                const rendEndLineNumber = this._visibleLines.getEndLineNumber();
                for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                    this._visibleLines.getVisibleLine(lineNumber).onDecorationsChanged();
                }
            }
            return true;
        }
        onFlushed(e) {
            const shouldRender = this._visibleLines.onFlushed(e);
            this._maxLineWidth = 0;
            return shouldRender;
        }
        onLinesChanged(e) {
            return this._visibleLines.onLinesChanged(e);
        }
        onLinesDeleted(e) {
            return this._visibleLines.onLinesDeleted(e);
        }
        onLinesInserted(e) {
            return this._visibleLines.onLinesInserted(e);
        }
        onRevealRangeRequest(e) {
            // Using the future viewport here in order to handle multiple
            // incoming reveal range requests that might all desire to be animated
            const desiredScrollTop = this._computeScrollTopToRevealRange(this._context.viewLayout.getFutureViewport(), e.source, e.minimalReveal, e.range, e.selections, e.verticalType);
            if (desiredScrollTop === -1) {
                // marker to abort the reveal range request
                return false;
            }
            // validate the new desired scroll top
            let newScrollPosition = this._context.viewLayout.validateScrollPosition({ scrollTop: desiredScrollTop });
            if (e.revealHorizontal) {
                if (e.range && e.range.startLineNumber !== e.range.endLineNumber) {
                    // Two or more lines? => scroll to base (That's how you see most of the two lines)
                    newScrollPosition = {
                        scrollTop: newScrollPosition.scrollTop,
                        scrollLeft: 0
                    };
                }
                else if (e.range) {
                    // We don't necessarily know the horizontal offset of this range since the line might not be in the view...
                    this._horizontalRevealRequest = new HorizontalRevealRangeRequest(e.minimalReveal, e.range.startLineNumber, e.range.startColumn, e.range.endColumn, this._context.viewLayout.getCurrentScrollTop(), newScrollPosition.scrollTop, e.scrollType);
                }
                else if (e.selections && e.selections.length > 0) {
                    this._horizontalRevealRequest = new HorizontalRevealSelectionsRequest(e.minimalReveal, e.selections, this._context.viewLayout.getCurrentScrollTop(), newScrollPosition.scrollTop, e.scrollType);
                }
            }
            else {
                this._horizontalRevealRequest = null;
            }
            const scrollTopDelta = Math.abs(this._context.viewLayout.getCurrentScrollTop() - newScrollPosition.scrollTop);
            const scrollType = (scrollTopDelta <= this._lineHeight ? 1 /* ScrollType.Immediate */ : e.scrollType);
            this._context.viewModel.viewLayout.setScrollPosition(newScrollPosition, scrollType);
            return true;
        }
        onScrollChanged(e) {
            if (this._horizontalRevealRequest && e.scrollLeftChanged) {
                // cancel any outstanding horizontal reveal request if someone else scrolls horizontally.
                this._horizontalRevealRequest = null;
            }
            if (this._horizontalRevealRequest && e.scrollTopChanged) {
                const min = Math.min(this._horizontalRevealRequest.startScrollTop, this._horizontalRevealRequest.stopScrollTop);
                const max = Math.max(this._horizontalRevealRequest.startScrollTop, this._horizontalRevealRequest.stopScrollTop);
                if (e.scrollTop < min || e.scrollTop > max) {
                    // cancel any outstanding horizontal reveal request if someone else scrolls vertically.
                    this._horizontalRevealRequest = null;
                }
            }
            this.domNode.setWidth(e.scrollWidth);
            return this._visibleLines.onScrollChanged(e) || true;
        }
        onTokensChanged(e) {
            return this._visibleLines.onTokensChanged(e);
        }
        onZonesChanged(e) {
            this._context.viewModel.viewLayout.setMaxLineWidth(this._maxLineWidth);
            return this._visibleLines.onZonesChanged(e);
        }
        onThemeChanged(e) {
            return this._onOptionsMaybeChanged();
        }
        // ---- end view event handlers
        // ----------- HELPERS FOR OTHERS
        getPositionFromDOMInfo(spanNode, offset) {
            const viewLineDomNode = this._getViewLineDomNode(spanNode);
            if (viewLineDomNode === null) {
                // Couldn't find view line node
                return null;
            }
            const lineNumber = this._getLineNumberFor(viewLineDomNode);
            if (lineNumber === -1) {
                // Couldn't find view line node
                return null;
            }
            if (lineNumber < 1 || lineNumber > this._context.viewModel.getLineCount()) {
                // lineNumber is outside range
                return null;
            }
            if (this._context.viewModel.getLineMaxColumn(lineNumber) === 1) {
                // Line is empty
                return new position_1.Position(lineNumber, 1);
            }
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            if (lineNumber < rendStartLineNumber || lineNumber > rendEndLineNumber) {
                // Couldn't find line
                return null;
            }
            let column = this._visibleLines.getVisibleLine(lineNumber).getColumnOfNodeOffset(spanNode, offset);
            const minColumn = this._context.viewModel.getLineMinColumn(lineNumber);
            if (column < minColumn) {
                column = minColumn;
            }
            return new position_1.Position(lineNumber, column);
        }
        _getViewLineDomNode(node) {
            while (node && node.nodeType === 1) {
                if (node.className === viewLine_1.ViewLine.CLASS_NAME) {
                    return node;
                }
                node = node.parentElement;
            }
            return null;
        }
        /**
         * @returns the line number of this view line dom node.
         */
        _getLineNumberFor(domNode) {
            const startLineNumber = this._visibleLines.getStartLineNumber();
            const endLineNumber = this._visibleLines.getEndLineNumber();
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const line = this._visibleLines.getVisibleLine(lineNumber);
                if (domNode === line.getDomNode()) {
                    return lineNumber;
                }
            }
            return -1;
        }
        getLineWidth(lineNumber) {
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            if (lineNumber < rendStartLineNumber || lineNumber > rendEndLineNumber) {
                // Couldn't find line
                return -1;
            }
            const context = new domReadingContext_1.DomReadingContext(this.domNode.domNode, this._textRangeRestingSpot);
            const result = this._visibleLines.getVisibleLine(lineNumber).getWidth(context);
            this._updateLineWidthsSlowIfDomDidLayout(context);
            return result;
        }
        linesVisibleRangesForRange(_range, includeNewLines) {
            if (this.shouldRender()) {
                // Cannot read from the DOM because it is dirty
                // i.e. the model & the dom are out of sync, so I'd be reading something stale
                return null;
            }
            const originalEndLineNumber = _range.endLineNumber;
            const range = range_1.Range.intersectRanges(_range, this._lastRenderedData.getCurrentVisibleRange());
            if (!range) {
                return null;
            }
            const visibleRanges = [];
            let visibleRangesLen = 0;
            const domReadingContext = new domReadingContext_1.DomReadingContext(this.domNode.domNode, this._textRangeRestingSpot);
            let nextLineModelLineNumber = 0;
            if (includeNewLines) {
                nextLineModelLineNumber = this._context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(range.startLineNumber, 1)).lineNumber;
            }
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            for (let lineNumber = range.startLineNumber; lineNumber <= range.endLineNumber; lineNumber++) {
                if (lineNumber < rendStartLineNumber || lineNumber > rendEndLineNumber) {
                    continue;
                }
                const startColumn = lineNumber === range.startLineNumber ? range.startColumn : 1;
                const continuesInNextLine = lineNumber !== range.endLineNumber;
                const endColumn = continuesInNextLine ? this._context.viewModel.getLineMaxColumn(lineNumber) : range.endColumn;
                const visibleRangesForLine = this._visibleLines.getVisibleLine(lineNumber).getVisibleRangesForRange(lineNumber, startColumn, endColumn, domReadingContext);
                if (!visibleRangesForLine) {
                    continue;
                }
                if (includeNewLines && lineNumber < originalEndLineNumber) {
                    const currentLineModelLineNumber = nextLineModelLineNumber;
                    nextLineModelLineNumber = this._context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(lineNumber + 1, 1)).lineNumber;
                    if (currentLineModelLineNumber !== nextLineModelLineNumber) {
                        visibleRangesForLine.ranges[visibleRangesForLine.ranges.length - 1].width += this._typicalHalfwidthCharacterWidth;
                    }
                }
                visibleRanges[visibleRangesLen++] = new renderingContext_1.LineVisibleRanges(visibleRangesForLine.outsideRenderedLine, lineNumber, renderingContext_1.HorizontalRange.from(visibleRangesForLine.ranges), continuesInNextLine);
            }
            this._updateLineWidthsSlowIfDomDidLayout(domReadingContext);
            if (visibleRangesLen === 0) {
                return null;
            }
            return visibleRanges;
        }
        _visibleRangesForLineRange(lineNumber, startColumn, endColumn) {
            if (this.shouldRender()) {
                // Cannot read from the DOM because it is dirty
                // i.e. the model & the dom are out of sync, so I'd be reading something stale
                return null;
            }
            if (lineNumber < this._visibleLines.getStartLineNumber() || lineNumber > this._visibleLines.getEndLineNumber()) {
                return null;
            }
            const domReadingContext = new domReadingContext_1.DomReadingContext(this.domNode.domNode, this._textRangeRestingSpot);
            const result = this._visibleLines.getVisibleLine(lineNumber).getVisibleRangesForRange(lineNumber, startColumn, endColumn, domReadingContext);
            this._updateLineWidthsSlowIfDomDidLayout(domReadingContext);
            return result;
        }
        visibleRangeForPosition(position) {
            const visibleRanges = this._visibleRangesForLineRange(position.lineNumber, position.column, position.column);
            if (!visibleRanges) {
                return null;
            }
            return new renderingContext_1.HorizontalPosition(visibleRanges.outsideRenderedLine, visibleRanges.ranges[0].left);
        }
        // --- implementation
        updateLineWidths() {
            this._updateLineWidths(false);
        }
        /**
         * Updates the max line width if it is fast to compute.
         * Returns true if all lines were taken into account.
         * Returns false if some lines need to be reevaluated (in a slow fashion).
         */
        _updateLineWidthsFast() {
            return this._updateLineWidths(true);
        }
        _updateLineWidthsSlow() {
            this._updateLineWidths(false);
        }
        /**
         * Update the line widths using DOM layout information after someone else
         * has caused a synchronous layout.
         */
        _updateLineWidthsSlowIfDomDidLayout(domReadingContext) {
            if (!domReadingContext.didDomLayout) {
                // only proceed if we just did a layout
                return;
            }
            if (this._asyncUpdateLineWidths.isScheduled()) {
                // reading widths is not scheduled => widths are up-to-date
                return;
            }
            this._asyncUpdateLineWidths.cancel();
            this._updateLineWidthsSlow();
        }
        _updateLineWidths(fast) {
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            let localMaxLineWidth = 1;
            let allWidthsComputed = true;
            for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                const visibleLine = this._visibleLines.getVisibleLine(lineNumber);
                if (fast && !visibleLine.getWidthIsFast()) {
                    // Cannot compute width in a fast way for this line
                    allWidthsComputed = false;
                    continue;
                }
                localMaxLineWidth = Math.max(localMaxLineWidth, visibleLine.getWidth(null));
            }
            if (allWidthsComputed && rendStartLineNumber === 1 && rendEndLineNumber === this._context.viewModel.getLineCount()) {
                // we know the max line width for all the lines
                this._maxLineWidth = 0;
            }
            this._ensureMaxLineWidth(localMaxLineWidth);
            return allWidthsComputed;
        }
        _checkMonospaceFontAssumptions() {
            // Problems with monospace assumptions are more apparent for longer lines,
            // as small rounding errors start to sum up, so we will select the longest
            // line for a closer inspection
            let longestLineNumber = -1;
            let longestWidth = -1;
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                const visibleLine = this._visibleLines.getVisibleLine(lineNumber);
                if (visibleLine.needsMonospaceFontCheck()) {
                    const lineWidth = visibleLine.getWidth(null);
                    if (lineWidth > longestWidth) {
                        longestWidth = lineWidth;
                        longestLineNumber = lineNumber;
                    }
                }
            }
            if (longestLineNumber === -1) {
                return;
            }
            if (!this._visibleLines.getVisibleLine(longestLineNumber).monospaceAssumptionsAreValid()) {
                for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                    const visibleLine = this._visibleLines.getVisibleLine(lineNumber);
                    visibleLine.onMonospaceAssumptionsInvalidated();
                }
            }
        }
        prepareRender() {
            throw new Error('Not supported');
        }
        render() {
            throw new Error('Not supported');
        }
        renderText(viewportData) {
            // (1) render lines - ensures lines are in the DOM
            this._visibleLines.renderLines(viewportData);
            this._lastRenderedData.setCurrentVisibleRange(viewportData.visibleRange);
            this.domNode.setWidth(this._context.viewLayout.getScrollWidth());
            this.domNode.setHeight(Math.min(this._context.viewLayout.getScrollHeight(), 1000000));
            // (2) compute horizontal scroll position:
            //  - this must happen after the lines are in the DOM since it might need a line that rendered just now
            //  - it might change `scrollWidth` and `scrollLeft`
            if (this._horizontalRevealRequest) {
                const horizontalRevealRequest = this._horizontalRevealRequest;
                // Check that we have the line that contains the horizontal range in the viewport
                if (viewportData.startLineNumber <= horizontalRevealRequest.minLineNumber && horizontalRevealRequest.maxLineNumber <= viewportData.endLineNumber) {
                    this._horizontalRevealRequest = null;
                    // allow `visibleRangesForRange2` to work
                    this.onDidRender();
                    // compute new scroll position
                    const newScrollLeft = this._computeScrollLeftToReveal(horizontalRevealRequest);
                    if (newScrollLeft) {
                        if (!this._isViewportWrapping) {
                            // ensure `scrollWidth` is large enough
                            this._ensureMaxLineWidth(newScrollLeft.maxHorizontalOffset);
                        }
                        // set `scrollLeft`
                        this._context.viewModel.viewLayout.setScrollPosition({
                            scrollLeft: newScrollLeft.scrollLeft
                        }, horizontalRevealRequest.scrollType);
                    }
                }
            }
            // Update max line width (not so important, it is just so the horizontal scrollbar doesn't get too small)
            if (!this._updateLineWidthsFast()) {
                // Computing the width of some lines would be slow => delay it
                this._asyncUpdateLineWidths.schedule();
            }
            else {
                this._asyncUpdateLineWidths.cancel();
            }
            if (platform.isLinux && !this._asyncCheckMonospaceFontAssumptions.isScheduled()) {
                const rendStartLineNumber = this._visibleLines.getStartLineNumber();
                const rendEndLineNumber = this._visibleLines.getEndLineNumber();
                for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                    const visibleLine = this._visibleLines.getVisibleLine(lineNumber);
                    if (visibleLine.needsMonospaceFontCheck()) {
                        this._asyncCheckMonospaceFontAssumptions.schedule();
                        break;
                    }
                }
            }
            // (3) handle scrolling
            this._linesContent.setLayerHinting(this._canUseLayerHinting);
            this._linesContent.setContain('strict');
            const adjustedScrollTop = this._context.viewLayout.getCurrentScrollTop() - viewportData.bigNumbersDelta;
            this._linesContent.setTop(-adjustedScrollTop);
            this._linesContent.setLeft(-this._context.viewLayout.getCurrentScrollLeft());
        }
        // --- width
        _ensureMaxLineWidth(lineWidth) {
            const iLineWidth = Math.ceil(lineWidth);
            if (this._maxLineWidth < iLineWidth) {
                this._maxLineWidth = iLineWidth;
                this._context.viewModel.viewLayout.setMaxLineWidth(this._maxLineWidth);
            }
        }
        _computeScrollTopToRevealRange(viewport, source, minimalReveal, range, selections, verticalType) {
            const viewportStartY = viewport.top;
            const viewportHeight = viewport.height;
            const viewportEndY = viewportStartY + viewportHeight;
            let boxIsSingleRange;
            let boxStartY;
            let boxEndY;
            if (selections && selections.length > 0) {
                let minLineNumber = selections[0].startLineNumber;
                let maxLineNumber = selections[0].endLineNumber;
                for (let i = 1, len = selections.length; i < len; i++) {
                    const selection = selections[i];
                    minLineNumber = Math.min(minLineNumber, selection.startLineNumber);
                    maxLineNumber = Math.max(maxLineNumber, selection.endLineNumber);
                }
                boxIsSingleRange = false;
                boxStartY = this._context.viewLayout.getVerticalOffsetForLineNumber(minLineNumber);
                boxEndY = this._context.viewLayout.getVerticalOffsetForLineNumber(maxLineNumber) + this._lineHeight;
            }
            else if (range) {
                boxIsSingleRange = true;
                boxStartY = this._context.viewLayout.getVerticalOffsetForLineNumber(range.startLineNumber);
                boxEndY = this._context.viewLayout.getVerticalOffsetForLineNumber(range.endLineNumber) + this._lineHeight;
            }
            else {
                return -1;
            }
            const shouldIgnoreScrollOff = (source === 'mouse' || minimalReveal) && this._cursorSurroundingLinesStyle === 'default';
            let paddingTop = 0;
            let paddingBottom = 0;
            if (!shouldIgnoreScrollOff) {
                const context = Math.min((viewportHeight / this._lineHeight) / 2, this._cursorSurroundingLines);
                if (this._stickyScrollEnabled) {
                    paddingTop = Math.max(context, this._maxNumberStickyLines) * this._lineHeight;
                }
                else {
                    paddingTop = context * this._lineHeight;
                }
                paddingBottom = Math.max(0, (context - 1)) * this._lineHeight;
            }
            else {
                if (!minimalReveal) {
                    // Reveal one more line above (this case is hit when dragging)
                    paddingTop = this._lineHeight;
                }
            }
            if (!minimalReveal) {
                if (verticalType === 0 /* viewEvents.VerticalRevealType.Simple */ || verticalType === 4 /* viewEvents.VerticalRevealType.Bottom */) {
                    // Reveal one line more when the last line would be covered by the scrollbar - arrow down case or revealing a line explicitly at bottom
                    paddingBottom += this._lineHeight;
                }
            }
            boxStartY -= paddingTop;
            boxEndY += paddingBottom;
            let newScrollTop;
            if (boxEndY - boxStartY > viewportHeight) {
                // the box is larger than the viewport ... scroll to its top
                if (!boxIsSingleRange) {
                    // do not reveal multiple cursors if there are more than fit the viewport
                    return -1;
                }
                newScrollTop = boxStartY;
            }
            else if (verticalType === 5 /* viewEvents.VerticalRevealType.NearTop */ || verticalType === 6 /* viewEvents.VerticalRevealType.NearTopIfOutsideViewport */) {
                if (verticalType === 6 /* viewEvents.VerticalRevealType.NearTopIfOutsideViewport */ && viewportStartY <= boxStartY && boxEndY <= viewportEndY) {
                    // Box is already in the viewport... do nothing
                    newScrollTop = viewportStartY;
                }
                else {
                    // We want a gap that is 20% of the viewport, but with a minimum of 5 lines
                    const desiredGapAbove = Math.max(5 * this._lineHeight, viewportHeight * 0.2);
                    // Try to scroll just above the box with the desired gap
                    const desiredScrollTop = boxStartY - desiredGapAbove;
                    // But ensure that the box is not pushed out of viewport
                    const minScrollTop = boxEndY - viewportHeight;
                    newScrollTop = Math.max(minScrollTop, desiredScrollTop);
                }
            }
            else if (verticalType === 1 /* viewEvents.VerticalRevealType.Center */ || verticalType === 2 /* viewEvents.VerticalRevealType.CenterIfOutsideViewport */) {
                if (verticalType === 2 /* viewEvents.VerticalRevealType.CenterIfOutsideViewport */ && viewportStartY <= boxStartY && boxEndY <= viewportEndY) {
                    // Box is already in the viewport... do nothing
                    newScrollTop = viewportStartY;
                }
                else {
                    // Box is outside the viewport... center it
                    const boxMiddleY = (boxStartY + boxEndY) / 2;
                    newScrollTop = Math.max(0, boxMiddleY - viewportHeight / 2);
                }
            }
            else {
                newScrollTop = this._computeMinimumScrolling(viewportStartY, viewportEndY, boxStartY, boxEndY, verticalType === 3 /* viewEvents.VerticalRevealType.Top */, verticalType === 4 /* viewEvents.VerticalRevealType.Bottom */);
            }
            return newScrollTop;
        }
        _computeScrollLeftToReveal(horizontalRevealRequest) {
            const viewport = this._context.viewLayout.getCurrentViewport();
            const layoutInfo = this._context.configuration.options.get(145 /* EditorOption.layoutInfo */);
            const viewportStartX = viewport.left;
            const viewportEndX = viewportStartX + viewport.width - layoutInfo.verticalScrollbarWidth;
            let boxStartX = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
            let boxEndX = 0;
            if (horizontalRevealRequest.type === 'range') {
                const visibleRanges = this._visibleRangesForLineRange(horizontalRevealRequest.lineNumber, horizontalRevealRequest.startColumn, horizontalRevealRequest.endColumn);
                if (!visibleRanges) {
                    return null;
                }
                for (const visibleRange of visibleRanges.ranges) {
                    boxStartX = Math.min(boxStartX, Math.round(visibleRange.left));
                    boxEndX = Math.max(boxEndX, Math.round(visibleRange.left + visibleRange.width));
                }
            }
            else {
                for (const selection of horizontalRevealRequest.selections) {
                    if (selection.startLineNumber !== selection.endLineNumber) {
                        return null;
                    }
                    const visibleRanges = this._visibleRangesForLineRange(selection.startLineNumber, selection.startColumn, selection.endColumn);
                    if (!visibleRanges) {
                        return null;
                    }
                    for (const visibleRange of visibleRanges.ranges) {
                        boxStartX = Math.min(boxStartX, Math.round(visibleRange.left));
                        boxEndX = Math.max(boxEndX, Math.round(visibleRange.left + visibleRange.width));
                    }
                }
            }
            if (!horizontalRevealRequest.minimalReveal) {
                boxStartX = Math.max(0, boxStartX - ViewLines.HORIZONTAL_EXTRA_PX);
                boxEndX += this._revealHorizontalRightPadding;
            }
            if (horizontalRevealRequest.type === 'selections' && boxEndX - boxStartX > viewport.width) {
                return null;
            }
            const newScrollLeft = this._computeMinimumScrolling(viewportStartX, viewportEndX, boxStartX, boxEndX);
            return {
                scrollLeft: newScrollLeft,
                maxHorizontalOffset: boxEndX
            };
        }
        _computeMinimumScrolling(viewportStart, viewportEnd, boxStart, boxEnd, revealAtStart, revealAtEnd) {
            viewportStart = viewportStart | 0;
            viewportEnd = viewportEnd | 0;
            boxStart = boxStart | 0;
            boxEnd = boxEnd | 0;
            revealAtStart = !!revealAtStart;
            revealAtEnd = !!revealAtEnd;
            const viewportLength = viewportEnd - viewportStart;
            const boxLength = boxEnd - boxStart;
            if (boxLength < viewportLength) {
                // The box would fit in the viewport
                if (revealAtStart) {
                    return boxStart;
                }
                if (revealAtEnd) {
                    return Math.max(0, boxEnd - viewportLength);
                }
                if (boxStart < viewportStart) {
                    // The box is above the viewport
                    return boxStart;
                }
                else if (boxEnd > viewportEnd) {
                    // The box is below the viewport
                    return Math.max(0, boxEnd - viewportLength);
                }
            }
            else {
                // The box would not fit in the viewport
                // Reveal the beginning of the box
                return boxStart;
            }
            return viewportStart;
        }
    }
    exports.ViewLines = ViewLines;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xpbmVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL2xpbmVzL3ZpZXdMaW5lcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3QmhHLE1BQU0sZ0JBQWdCO1FBSXJCO1lBQ0MsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFTSxzQkFBc0I7WUFDNUIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDbEMsQ0FBQztRQUVNLHNCQUFzQixDQUFDLG1CQUEwQjtZQUN2RCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsbUJBQW1CLENBQUM7UUFDakQsQ0FBQztLQUNEO0lBRUQsTUFBTSw0QkFBNEI7UUFLakMsWUFDaUIsYUFBc0IsRUFDdEIsVUFBa0IsRUFDbEIsV0FBbUIsRUFDbkIsU0FBaUIsRUFDakIsY0FBc0IsRUFDdEIsYUFBcUIsRUFDckIsVUFBc0I7WUFOdEIsa0JBQWEsR0FBYixhQUFhLENBQVM7WUFDdEIsZUFBVSxHQUFWLFVBQVUsQ0FBUTtZQUNsQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNuQixjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ2pCLG1CQUFjLEdBQWQsY0FBYyxDQUFRO1lBQ3RCLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1lBQ3JCLGVBQVUsR0FBVixVQUFVLENBQVk7WUFYdkIsU0FBSSxHQUFHLE9BQU8sQ0FBQztZQWE5QixJQUFJLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQztZQUNoQyxJQUFJLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQztRQUNqQyxDQUFDO0tBQ0Q7SUFFRCxNQUFNLGlDQUFpQztRQUt0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