/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/scrollable", "vs/editor/common/viewLayout/linesLayout", "vs/editor/common/viewModel", "vs/editor/common/viewModelEventDispatcher"], function (require, exports, event_1, lifecycle_1, scrollable_1, linesLayout_1, viewModel_1, viewModelEventDispatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewLayout = void 0;
    const SMOOTH_SCROLLING_TIME = 125;
    class EditorScrollDimensions {
        constructor(width, contentWidth, height, contentHeight) {
            width = width | 0;
            contentWidth = contentWidth | 0;
            height = height | 0;
            contentHeight = contentHeight | 0;
            if (width < 0) {
                width = 0;
            }
            if (contentWidth < 0) {
                contentWidth = 0;
            }
            if (height < 0) {
                height = 0;
            }
            if (contentHeight < 0) {
                contentHeight = 0;
            }
            this.width = width;
            this.contentWidth = contentWidth;
            this.scrollWidth = Math.max(width, contentWidth);
            this.height = height;
            this.contentHeight = contentHeight;
            this.scrollHeight = Math.max(height, contentHeight);
        }
        equals(other) {
            return (this.width === other.width
                && this.contentWidth === other.contentWidth
                && this.height === other.height
                && this.contentHeight === other.contentHeight);
        }
    }
    class EditorScrollable extends lifecycle_1.Disposable {
        constructor(smoothScrollDuration, scheduleAtNextAnimationFrame) {
            super();
            this._onDidContentSizeChange = this._register(new event_1.Emitter());
            this.onDidContentSizeChange = this._onDidContentSizeChange.event;
            this._dimensions = new EditorScrollDimensions(0, 0, 0, 0);
            this._scrollable = this._register(new scrollable_1.Scrollable({
                forceIntegerValues: true,
                smoothScrollDuration,
                scheduleAtNextAnimationFrame
            }));
            this.onDidScroll = this._scrollable.onScroll;
        }
        getScrollable() {
            return this._scrollable;
        }
        setSmoothScrollDuration(smoothScrollDuration) {
            this._scrollable.setSmoothScrollDuration(smoothScrollDuration);
        }
        validateScrollPosition(scrollPosition) {
            return this._scrollable.validateScrollPosition(scrollPosition);
        }
        getScrollDimensions() {
            return this._dimensions;
        }
        setScrollDimensions(dimensions) {
            if (this._dimensions.equals(dimensions)) {
                return;
            }
            const oldDimensions = this._dimensions;
            this._dimensions = dimensions;
            this._scrollable.setScrollDimensions({
                width: dimensions.width,
                scrollWidth: dimensions.scrollWidth,
                height: dimensions.height,
                scrollHeight: dimensions.scrollHeight
            }, true);
            const contentWidthChanged = (oldDimensions.contentWidth !== dimensions.contentWidth);
            const contentHeightChanged = (oldDimensions.contentHeight !== dimensions.contentHeight);
            if (contentWidthChanged || contentHeightChanged) {
                this._onDidContentSizeChange.fire(new viewModelEventDispatcher_1.ContentSizeChangedEvent(oldDimensions.contentWidth, oldDimensions.contentHeight, dimensions.contentWidth, dimensions.contentHeight));
            }
        }
        getFutureScrollPosition() {
            return this._scrollable.getFutureScrollPosition();
        }
        getCurrentScrollPosition() {
            return this._scrollable.getCurrentScrollPosition();
        }
        setScrollPositionNow(update) {
            this._scrollable.setScrollPositionNow(update);
        }
        setScrollPositionSmooth(update) {
            this._scrollable.setScrollPositionSmooth(update);
        }
        hasPendingScrollAnimation() {
            return this._scrollable.hasPendingScrollAnimation();
        }
    }
    class ViewLayout extends lifecycle_1.Disposable {
        constructor(configuration, lineCount, scheduleAtNextAnimationFrame) {
            super();
            this._configuration = configuration;
            const options = this._configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const padding = options.get(84 /* EditorOption.padding */);
            this._linesLayout = new linesLayout_1.LinesLayout(lineCount, options.get(67 /* EditorOption.lineHeight */), padding.top, padding.bottom);
            this._maxLineWidth = 0;
            this._overlayWidgetsMinWidth = 0;
            this._scrollable = this._register(new EditorScrollable(0, scheduleAtNextAnimationFrame));
            this._configureSmoothScrollDuration();
            this._scrollable.setScrollDimensions(new EditorScrollDimensions(layoutInfo.contentWidth, 0, layoutInfo.height, 0));
            this.onDidScroll = this._scrollable.onDidScroll;
            this.onDidContentSizeChange = this._scrollable.onDidContentSizeChange;
            this._updateHeight();
        }
        dispose() {
            super.dispose();
        }
        getScrollable() {
            return this._scrollable.getScrollable();
        }
        onHeightMaybeChanged() {
            this._updateHeight();
        }
        _configureSmoothScrollDuration() {
            this._scrollable.setSmoothScrollDuration(this._configuration.options.get(114 /* EditorOption.smoothScrolling */) ? SMOOTH_SCROLLING_TIME : 0);
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            const options = this._configuration.options;
            if (e.hasChanged(67 /* EditorOption.lineHeight */)) {
                this._linesLayout.setLineHeight(options.get(67 /* EditorOption.lineHeight */));
            }
            if (e.hasChanged(84 /* EditorOption.padding */)) {
                const padding = options.get(84 /* EditorOption.padding */);
                this._linesLayout.setPadding(padding.top, padding.bottom);
            }
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
                const width = layoutInfo.contentWidth;
                const height = layoutInfo.height;
                const scrollDimensions = this._scrollable.getScrollDimensions();
                const contentWidth = scrollDimensions.contentWidth;
                this._scrollable.setScrollDimensions(new EditorScrollDimensions(width, scrollDimensions.contentWidth, height, this._getContentHeight(width, height, contentWidth)));
            }
            else {
                this._updateHeight();
            }
            if (e.hasChanged(114 /* EditorOption.smoothScrolling */)) {
                this._configureSmoothScrollDuration();
            }
        }
        onFlushed(lineCount) {
            this._linesLayout.onFlushed(lineCount);
        }
        onLinesDeleted(fromLineNumber, toLineNumber) {
            this._linesLayout.onLinesDeleted(fromLineNumber, toLineNumber);
        }
        onLinesInserted(fromLineNumber, toLineNumber) {
            this._linesLayout.onLinesInserted(fromLineNumber, toLineNumber);
        }
        // ---- end view event handlers
        _getHorizontalScrollbarHeight(width, scrollWidth) {
            const options = this._configuration.options;
            const scrollbar = options.get(103 /* EditorOption.scrollbar */);
            if (scrollbar.horizontal === 2 /* ScrollbarVisibility.Hidden */) {
                // horizontal scrollbar not visible
                return 0;
            }
            if (width >= scrollWidth) {
                // horizontal scrollbar not visible
                return 0;
            }
            return scrollbar.horizontalScrollbarSize;
        }
        _getContentHeight(width, height, contentWidth) {
            const options = this._configuration.options;
            let result = this._linesLayout.getLinesTotalHeight();
            if (options.get(105 /* EditorOption.scrollBeyondLastLine */)) {
                result += Math.max(0, height - options.get(67 /* EditorOption.lineHeight */) - options.get(84 /* EditorOption.padding */).bottom);
            }
            else if (!options.get(103 /* EditorOption.scrollbar */).ignoreHorizontalScrollbarInContentHeight) {
                result += this._getHorizontalScrollbarHeight(width, contentWidth);
            }
            return result;
        }
        _updateHeight() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            const width = scrollDimensions.width;
            const height = scrollDimensions.height;
            const contentWidth = scrollDimensions.contentWidth;
            this._scrollable.setScrollDimensions(new EditorScrollDimensions(width, scrollDimensions.contentWidth, height, this._getContentHeight(width, height, contentWidth)));
        }
        // ---- Layouting logic
        getCurrentViewport() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            return new viewModel_1.Viewport(currentScrollPosition.scrollTop, currentScrollPosition.scrollLeft, scrollDimensions.width, scrollDimensions.height);
        }
        getFutureViewport() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            const currentScrollPosition = this._scrollable.getFutureScrollPosition();
            return new viewModel_1.Viewport(currentScrollPosition.scrollTop, currentScrollPosition.scrollLeft, scrollDimensions.width, scrollDimensions.height);
        }
        _computeContentWidth() {
            const options = this._configuration.options;
            const maxLineWidth = this._maxLineWidth;
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            if (wrappingInfo.isViewportWrapping) {
                const minimap = options.get(73 /* EditorOption.minimap */);
                if (maxLineWidth > layoutInfo.contentWidth + fontInfo.typicalHalfwidthCharacterWidth) {
                    // This is a case where viewport wrapping is on, but the line extends above the viewport
                    if (minimap.enabled && minimap.side === 'right') {
                        // We need to accomodate the scrollbar width
                        return maxLineWidth + layoutInfo.verticalScrollbarWidth;
                    }
                }
                return maxLineWidth;
            }
            else {
                const extraHorizontalSpace = options.get(104 /* EditorOption.scrollBeyondLastColumn */) * fontInfo.typicalHalfwidthCharacterWidth;
                const whitespaceMinWidth = this._linesLayout.getWhitespaceMinWidth();
                return Math.max(maxLineWidth + extraHorizontalSpace + layoutInfo.verticalScrollbarWidth, whitespaceMinWidth, this._overlayWidgetsMinWidth);
            }
        }
        setMaxLineWidth(maxLineWidth) {
            this._maxLineWidth = maxLineWidth;
            this._updateContentWidth();
        }
        setOverlayWidgetsMinWidth(maxMinWidth) {
            this._overlayWidgetsMinWidth = maxMinWidth;
            this._updateContentWidth();
        }
        _updateContentWidth() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            this._scrollable.setScrollDimensions(new EditorScrollDimensions(scrollDimensions.width, this._computeContentWidth(), scrollDimensions.height, scrollDimensions.contentHeight));
            // The height might depend on the fact that there is a horizontal scrollbar or not
            this._updateHeight();
        }
        // ---- view state
        saveState() {
            const currentScrollPosition = this._scrollable.getFutureScrollPosition();
            const scrollTop = currentScrollPosition.scrollTop;
            const firstLineNumberInViewport = this._linesLayout.getLineNumberAtOrAfterVerticalOffset(scrollTop);
            const whitespaceAboveFirstLine = this._linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(firstLineNumberInViewport);
            return {
                scrollTop: scrollTop,
                scrollTopWithoutViewZones: scrollTop - whitespaceAboveFirstLine,
                scrollLeft: currentScrollPosition.scrollLeft
            };
        }
        // ----
        changeWhitespace(callback) {
            const hadAChange = this._linesLayout.changeWhitespace(callback);
            if (hadAChange) {
                this.onHeightMaybeChanged();
            }
            return hadAChange;
        }
        getVerticalOffsetForLineNumber(lineNumber, includeViewZones = false) {
            return this._linesLayout.getVerticalOffsetForLineNumber(lineNumber, includeViewZones);
        }
        getVerticalOffsetAfterLineNumber(lineNumber, includeViewZones = false) {
            return this._linesLayout.getVerticalOffsetAfterLineNumber(lineNumber, includeViewZones);
        }
        isAfterLines(verticalOffset) {
            return this._linesLayout.isAfterLines(verticalOffset);
        }
        isInTopPadding(verticalOffset) {
            return this._linesLayout.isInTopPadding(verticalOffset);
        }
        isInBottomPadding(verticalOffset) {
            return this._linesLayout.isInBottomPadding(verticalOffset);
        }
        getLineNumberAtVerticalOffset(verticalOffset) {
            return this._linesLayout.getLineNumberAtOrAfterVerticalOffset(verticalOffset);
        }
        getWhitespaceAtVerticalOffset(verticalOffset) {
            return this._linesLayout.getWhitespaceAtVerticalOffset(verticalOffset);
        }
        getLinesViewportData() {
            const visibleBox = this.getCurrentViewport();
            return this._linesLayout.getLinesViewportData(visibleBox.top, visibleBox.top + visibleBox.height);
        }
        getLinesViewportDataAtScrollTop(scrollTop) {
            // do some minimal validations on scrollTop
            const scrollDimensions = this._scrollable.getScrollDimensions();
            if (scrollTop + scrollDimensions.height > scrollDimensions.scrollHeight) {
                scrollTop = scrollDimensions.scrollHeight - scrollDimensions.height;
            }
            if (scrollTop < 0) {
                scrollTop = 0;
            }
            return this._linesLayout.getLinesViewportData(scrollTop, scrollTop + scrollDimensions.height);
        }
        getWhitespaceViewportData() {
            const visibleBox = this.getCurrentViewport();
            return this._linesLayout.getWhitespaceViewportData(visibleBox.top, visibleBox.top + visibleBox.height);
        }
        getWhitespaces() {
            return this._linesLayout.getWhitespaces();
        }
        // ----
        getContentWidth() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.contentWidth;
        }
        getScrollWidth() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.scrollWidth;
        }
        getContentHeight() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.contentHeight;
        }
        getScrollHeight() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.scrollHeight;
        }
        getCurrentScrollLeft() {
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            return currentScrollPosition.scrollLeft;
        }
        getCurrentScrollTop() {
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            return currentScrollPosition.scrollTop;
        }
        validateScrollPosition(scrollPosition) {
            return this._scrollable.validateScrollPosition(scrollPosition);
        }
        setScrollPosition(position, type) {
            if (type === 1 /* ScrollType.Immediate */) {
                this._scrollable.setScrollPositionNow(position);
            }
            else {
                this._scrollable.setScrollPositionSmooth(position);
            }
        }
        hasPendingScrollAnimation() {
            return this._scrollable.hasPendingScrollAnimation();
        }
        deltaScrollNow(deltaScrollLeft, deltaScrollTop) {
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            this._scrollable.setScrollPositionNow({
                scrollLeft: currentScrollPosition.scrollLeft + deltaScrollLeft,
                scrollTop: currentScrollPosition.scrollTop + deltaScrollTop
            });
        }
    }
    exports.ViewLayout = ViewLayout;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xheW91dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdmlld0xheW91dC92aWV3TGF5b3V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFNLHFCQUFxQixHQUFHLEdBQUcsQ0FBQztJQUVsQyxNQUFNLHNCQUFzQjtRQVUzQixZQUNDLEtBQWEsRUFDYixZQUFvQixFQUNwQixNQUFjLEVBQ2QsYUFBcUI7WUFFckIsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDbEIsWUFBWSxHQUFHLFlBQVksR0FBRyxDQUFDLENBQUM7WUFDaEMsTUFBTSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDcEIsYUFBYSxHQUFHLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFFbEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNYLENBQUM7WUFDRCxJQUFJLFlBQVksR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsWUFBWSxHQUFHLENBQUMsQ0FBQztZQUNsQixDQUFDO1lBRUQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDWixDQUFDO1lBQ0QsSUFBSSxhQUFhLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDbkIsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFakQsSUFBSSxDQUFD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