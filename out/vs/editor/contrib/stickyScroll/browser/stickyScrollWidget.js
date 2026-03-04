/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/trustedTypes", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/editor/browser/viewParts/lines/viewLine", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/common/core/position", "vs/editor/common/core/stringBuilder", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/contrib/folding/browser/foldingDecorations", "vs/css!./stickyScroll"], function (require, exports, dom, trustedTypes_1, arrays_1, lifecycle_1, themables_1, viewLine_1, embeddedCodeEditorWidget_1, position_1, stringBuilder_1, lineDecorations_1, viewLineRenderer_1, foldingDecorations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StickyScrollWidget = exports.StickyScrollWidgetState = void 0;
    class StickyScrollWidgetState {
        constructor(startLineNumbers, endLineNumbers, lastLineRelativePosition, showEndForLine = null) {
            this.startLineNumbers = startLineNumbers;
            this.endLineNumbers = endLineNumbers;
            this.lastLineRelativePosition = lastLineRelativePosition;
            this.showEndForLine = showEndForLine;
        }
        equals(other) {
            return !!other
                && this.lastLineRelativePosition === other.lastLineRelativePosition
                && this.showEndForLine === other.showEndForLine
                && (0, arrays_1.equals)(this.startLineNumbers, other.startLineNumbers)
                && (0, arrays_1.equals)(this.endLineNumbers, other.endLineNumbers);
        }
    }
    exports.StickyScrollWidgetState = StickyScrollWidgetState;
    const _ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('stickyScrollViewLayer', { createHTML: value => value });
    const STICKY_INDEX_ATTR = 'data-sticky-line-index';
    const STICKY_IS_LINE_ATTR = 'data-sticky-is-line';
    const STICKY_IS_LINE_NUMBER_ATTR = 'data-sticky-is-line-number';
    const STICKY_IS_FOLDING_ICON_ATTR = 'data-sticky-is-folding-icon';
    class StickyScrollWidget extends lifecycle_1.Disposable {
        constructor(_editor) {
            super();
            this._editor = _editor;
            this._foldingIconStore = new lifecycle_1.DisposableStore();
            this._rootDomNode = document.createElement('div');
            this._lineNumbersDomNode = document.createElement('div');
            this._linesDomNodeScrollable = document.createElement('div');
            this._linesDomNode = document.createElement('div');
            this._lineHeight = this._editor.getOption(67 /* EditorOption.lineHeight */);
            this._renderedStickyLines = [];
            this._lineNumbers = [];
            this._lastLineRelativePosition = 0;
            this._minContentWidthInPx = 0;
            this._isOnGlyphMargin = false;
            this._lineNumbersDomNode.className = 'sticky-widget-line-numbers';
            this._lineNumbersDomNode.setAttribute('role', 'none');
            this._linesDomNode.className = 'sticky-widget-lines';
            this._linesDomNode.setAttribute('role', 'list');
            this._linesDomNodeScrollable.className = 'sticky-widget-lines-scrollable';
            this._linesDomNodeScrollable.appendChild(this._linesDomNode);
            this._rootDomNode.className = 'sticky-widget';
            this._rootDomNode.classList.toggle('peek', _editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget);
            this._rootDomNode.appendChild(this._lineNumbersDomNode);
            this._rootDomNode.appendChild(this._linesDomNodeScrollable);
            const updateScrollLeftPosition = () => {
                this._linesDomNode.style.left = this._editor.getOption(115 /* EditorOption.stickyScroll */).scrollWithEditor ? `-${this._editor.getScrollLeft()}px` : '0px';
            };
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(115 /* EditorOption.stickyScroll */)) {
                    updateScrollLeftPosition();
                }
                if (e.hasChanged(67 /* EditorOption.lineHeight */)) {
                    this._lineHeight = this._editor.getOption(67 /* EditorOption.lineHeight */);
                }
            }));
            this._register(this._editor.onDidScrollChange((e) => {
                if (e.scrollLeftChanged) {
                    updateScrollLeftPosition();
                }
                if (e.scrollWidthChanged) {
                    this._updateWidgetWidth();
                }
            }));
            this._register(this._editor.onDidChangeModel(() => {
                updateScrollLeftPosition();
                this._updateWidgetWidth();
            }));
            this._register(this._foldingIconStore);
            updateScrollLeftPosition();
            this._register(this._editor.onDidLayoutChange((e) => {
                this._updateWidgetWidth();
            }));
            this._updateWidgetWidth();
        }
        get lineNumbers() {
            return this._lineNumbers;
        }
        get lineNumberCount() {
            return this._lineNumbers.length;
        }
        getRenderedStickyLine(lineNumber) {
            return this._renderedStickyLines.find(stickyLine => stickyLine.lineNumber === lineNumber);
        }
        getCurrentLines() {
            return this._lineNumbers;
        }
        setState(_state, foldingModel, _rebuildFromLine) {
            if (_rebuildFromLine === undefined &&
                ((!this._previousState && !_state) || (this._previousState && this._previousState.equals(_state)))) {
                return;
            }
            const isWidgetHeightZero = this._isWidgetHeightZero(_state);
            const state = isWidgetHeightZero ? undefined : _state;
            const rebuildFromLine = isWidgetHeightZero ? 0 : this._findLineToRebuildWidgetFrom(_state, _rebuildFromLine);
            this._renderRootNode(state, foldingModel, rebuildFromLine);
            this._previousState = _state;
        }
        _isWidgetHeightZero(state) {
            if (!state) {
                return true;
            }
            const futureWidgetHeight = state.startLineNumbers.length * this._lineHeight + state.lastLineRelativePosition;
            if (futureWidgetHeight > 0) {
                this._lastLineRelativePosition = state.lastLineRelativePosition;
                const lineNumbers = [...state.startLineNumbers];
                if (state.showEndForLine !== null) {
                    lineNumbers[state.showEndForLine] = state.endLineNumbers[state.showEndForLine];
                }
                this._lineNumbers = lineNumbers;
            }
            else {
                this._lastLineRelativePosition = 0;
                this._lineNumbers = [];
            }
            return futureWidgetHeight === 0;
        }
        _findLineToRebuildWidgetFrom(state, _rebuildFromLine) {
            if (!state || !this._previousState) {
                return 0;
            }
            if (_rebuildFromLine !== undefined) {
                return _rebuildFromLine;
            }
            const previousState = this._previousState;
            const indexOfLinesAlreadyRendered = state.startLineNumbers.findIndex(startLineNumber => !previousState.startLineNumbers.includes(startLineNumber));
            return (indexOfLinesAlreadyRendered === -1) ? 0 : indexOfLinesAlreadyRendered;
        }
        _updateWidgetWidth() {
            const layoutInfo = this._editor.getLayoutInfo();
            const lineNumbersWidth = layoutInfo.contentLeft;
            this._lineNumbersDomNode.style.width = `${lineNumbersWidth}px`;
            this._linesDomNodeScrollable.style.setProperty('--vscode-editorStickyScroll-scrollableWidth', `${this._editor.getScrollWidth() - layoutInfo.verticalScrollbarWidth}px`);
            this._rootDomNode.style.width = `${layoutInfo.width - layoutInfo.verticalScrollbarWidth}px`;
        }
        _clearStickyLinesFromLine(clearFromLine) {
            this._foldingIconStore.clear();
            // Removing only the lines that need to be rerendered
            for (let i = clearFromLine; i < this._renderedStickyLines.length; i++) {
                const stickyLine = this._renderedStickyLines[i];
                stickyLine.lineNumberDomNode.remove();
                stickyLine.lineDomNode.remove();
            }
            // Keep the lines that need to be updated
            this._renderedStickyLines = this._renderedStickyLines.slice(0, clearFromLine);
            this._rootDomNode.style.display = 'none';
        }
        _useFoldingOpacityTransition(requireTransitions) {
            this._lineNumbersDomNode.style.setProperty('--vscode-editorStickyScroll-foldingOpacityTransition', `opacity ${requireTransitions ? 0.5 : 0}s`);
        }
        _setFoldingIconsVisibility(allVisible) {
            for (const line of this._renderedStickyLines) {
                const foldingIcon = line.foldingIcon;
                if (!foldingIcon) {
                    continue;
                }
                foldingIcon.setVisible(allVisible ? true : foldingIcon.isCollapsed);
            }
        }
        async _renderRootNode(state, foldingModel, rebuildFromLine) {
            this._clearStickyLinesFromLine(rebuildFromLine);
            if (!state) {
                return;
            }
            // For existing sticky lines update the top and z-index
            for (const stickyLine of this._renderedStickyLines) {
                this._updateTopAndZIndexOfStickyLine(stickyLine);
            }
            // For new sticky lines
            const layoutInfo = this._editor.getLayoutInfo();
            const linesToRender = this._lineNumbers.slice(rebuildFromLine);
            for (const [index, line] of linesToRender.entries()) {
                const stickyLine = this._renderChildNode(index + rebuildFromLine, line, foldingModel, layoutInfo);
                if (!stickyLine) {
                    continue;
                }
                this._linesDomNode.appendChild(stickyLine.lineDomNode);
                this._lineNumbersDomNode.appendChild(stickyLine.lineNumberDomNode);
                this._renderedStickyLines.push(stickyLine);
            }
            if (foldingModel) {
                this._setFoldingHoverListeners();
                this._useFoldingOpacityTransition(!this._isOnGlyphMargin);
            }
            const widgetHeight = this._lineNumbers.length * this._lineHeight + this._lastLineRelativePosition;
            this._rootDomNode.style.display = 'block';
            this._lineNumbersDomNode.style.height = `${widgetHeight}px`;
            this._linesDomNodeScrollable.style.height = `${widgetHeight}px`;
            this._rootDomNode.style.height = `${widgetHeight}px`;
            this._rootDomNode.style.marginLeft = '0px';
            this._minContentWidthInPx = Math.max(...this._renderedStickyLines.map(l => l.scrollWidth)) + layoutInfo.verticalScrollbarWidth;
            this._editor.layoutOverlayWidget(this);
        }
        _setFoldingHoverListeners() {
            const showFoldingControls = this._editor.getOption(110 /* EditorOption.showFoldingControls */);
            if (showFoldingControls !== 'mouseover') {
                return;
            }
            this._foldingIconStore.add(dom.addDisposableListener(this._lineNumbersDomNode, dom.EventType.MOUSE_ENTER, () => {
                this._isOnGlyphMargin = true;
                this._setFoldingIconsVisibility(true);
            }));
            this._foldingIconStore.add(dom.addDisposableListener(this._lineNumbersDomNode, dom.EventType.MOUSE_LEAVE, () => {
                this._isOnGlyphMargin = false;
                this._useFoldingOpacityTransition(true);
                this._setFoldingIconsVisibility(false);
            }));
        }
        _renderChildNode(index, line, foldingModel, layoutInfo) {
            const viewModel = this._editor._getViewModel();
            if (!viewModel) {
                return;
            }
            const viewLineNumber = viewModel.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(line, 1)).lineNumber;
            const lineRenderingData = viewModel.getViewLineRenderingData(viewLineNumber);
            const lineNumberOption = this._editor.getOption(68 /* EditorOption.lineNumbers */);
            let actualInlineDecorations;
            try {
                actualInlineDecorations = lineDecorations_1.LineDecoration.filter(lineRenderingData.inlineDecorations, viewLineNumber, lineRenderingData.minColumn, lineRenderingData.maxColumn);
            }
            catch (err) {
                actualInlineDecorations = [];
            }
            const renderLineInput = new viewLineRenderer_1.RenderLineInput(true, true, lineRenderingData.content, lineRenderingData.continuesWithWrappedLine, lineRenderingData.isBasicASCII, lineRenderingData.containsRTL, 0, lineRenderingData.tokens, actualInlineDecorations, lineRenderingData.tabSize, lineRenderingData.startVisibleColumn, 1, 1, 1, 500, 'none', true, true, null);
            const sb = new stringBuilder_1.StringBuilder(2000);
            const renderOutput = (0, viewLineRenderer_1.renderViewLine)(renderLineInput, sb);
            let newLine;
            if (_ttPolicy) {
                newLine = _ttPolicy.createHTML(sb.build());
            }
            else {
                newLine = sb.build();
            }
            const lineHTMLNode = document.createElement('span');
            lineHTMLNode.setAttribute(STICKY_INDEX_ATTR, String(index));
            lineHTMLNode.setAttribute(STICKY_IS_LINE_ATTR, '');
            lineHTMLNode.setAttribute('role', 'listitem');
            lineHTMLNode.tabIndex = 0;
            lineHTMLNode.className = 'sticky-line-content';
            lineHTMLNode.classList.add(`stickyLine${line}`);
            lineHTMLNode.style.lineHeight = `${this._lineHeight}px`;
            lineHTMLNode.innerHTML = newLine;
            const lineNumberHTMLNode = document.createElement('span');
            lineNumberHTMLNode.setAttribute(STICKY_INDEX_ATTR, String(index));
            lineNumberHTMLNode.setAttribute(STICKY_IS_LINE_NUMBER_ATTR, '');
            lineNumberHTMLNode.className = 'sticky-line-number';
            lineNumberHTMLNode.style.lineHeight = `${this._lineHeight}px`;
            const lineNumbersWidth = layoutInfo.contentLeft;
            lineNumberHTMLNode.style.width = `${lineNumbersWidth}px`;
            const innerLineNumberHTML = document.createElement('span');
            if (lineNumberOption.renderType === 1 /* RenderLineNumbersType.On */ || lineNumberOption.renderType === 3 /* RenderLineNumbersType.Interval */ && line % 10 === 0) {
                innerLineNumberHTML.innerText = line.toString();
            }
            else if (lineNumberOption.renderType === 2 /* RenderLineNumbersType.Relative */) {
                innerLineNumberHTML.innerText = Math.abs(line - this._editor.getPosition().lineNumber).toString();
            }
            innerLineNumberHTML.className = 'sticky-line-number-inner';
            innerLineNumberHTML.style.lineHeight = `${this._lineHeight}px`;
            innerLineNumberHTML.style.width = `${layoutInfo.lineNumbersWidth}px`;
            innerLineNumberHTML.style.paddingLeft = `${layoutInfo.lineNumbersLeft}px`;
            lineNumberHTMLNode.appendChild(innerLineNumberHTML);
            const foldingIcon = this._renderFoldingIconForLine(foldingModel, line);
            if (foldingIcon) {
                lineNumberHTMLNode.appendChild(foldingIcon.domNode);
            }
            this._editor.applyFontInfo(lineHTMLNode);
            this._editor.applyFontInfo(innerLineNumberHTML);
            lineNumberHTMLNode.style.lineHeight = `${this._lineHeight}px`;
            lineHTMLNode.style.lineHeight = `${this._lineHeight}px`;
            lineNumberHTMLNode.style.height = `${this._lineHeight}px`;
            lineHTMLNode.style.height = `${this._lineHeight}px`;
            const renderedLine = new RenderedStickyLine(index, line, lineHTMLNode, lineNumberHTMLNode, foldingIcon, renderOutput.characterMapping, lineHTMLNode.scrollWidth);
            return this._updateTopAndZIndexOfStickyLine(renderedLine);
        }
        _updateTopAndZIndexOfStickyLine(stickyLine) {
            const index = stickyLine.index;
            const lineHTMLNode = stickyLine.lineDomNode;
            const lineNumberHTMLNode = stickyLine.lineNumberDomNode;
            const isLastLine = index === this._lineNumbers.length - 1;
            const lastLineZIndex = '0';
            const intermediateLineZIndex = '1';
            lineHTMLNode.style.zIndex = isLastLine ? lastLineZIndex : intermediateLineZIndex;
            lineNumberHTMLNode.style.zIndex = isLastLine ? lastLineZIndex : intermediateLineZIndex;
            const lastLineTop = `${index * this._lineHeight + this._lastLineRelativePosition + (stickyLine.foldingIcon?.isCollapsed ? 1 : 0)}px`;
            const intermediateLineTop = `${index * this._lineHeight}px`;
            lineHTMLNode.style.top = isLastLine ? lastLineTop : intermediateLineTop;
            lineNumberHTMLNode.style.top = isLastLine ? lastLineTop : intermediateLineTop;
            return stickyLine;
        }
        _renderFoldingIconForLine(foldingModel, line) {
            const showFoldingControls = this._editor.getOption(110 /* EditorOption.showFoldingControls */);
            if (!foldingModel || showFoldingControls === 'never') {
                return;
            }
            const foldingRegions = foldingModel.regions;
            const indexOfFoldingRegion = foldingRegions.findRange(line);
            const startLineNumber = foldingRegions.getStartLineNumber(indexOfFoldingRegion);
            const isFoldingScope = line === startLineNumber;
            if (!isFoldingScope) {
                return;
            }
            const isCollapsed = foldingRegions.isCollapsed(indexOfFoldingRegion);
            const foldingIcon = new StickyFoldingIcon(isCollapsed, startLineNumber, foldingRegions.getEndLineNumber(indexOfFoldingRegion), this._lineHeight);
            foldingIcon.setVisible(this._isOnGlyphMargin ? true : (isCollapsed || showFoldingControls === 'always'));
            foldingIcon.domNode.setAttribute(STICKY_IS_FOLDING_ICON_ATTR, '');
            return foldingIcon;
        }
        getId() {
            return 'editor.contrib.stickyScrollWidget';
        }
        getDomNode() {
            return this._rootDomNode;
        }
        getPosition() {
            return {
                preference: null
            };
        }
        getMinContentWidthInPx() {
            return this._minContentWidthInPx;
        }
        focusLineWithIndex(index) {
            if (0 <= index && index < this._renderedStickyLines.length) {
                this._renderedStickyLines[index].lineDomNode.focus();
            }
        }
        /**
         * Given a leaf dom node, tries to find the editor position.
         */
        getEditorPositionFromNode(spanDomNode) {
            if (!spanDomNode || spanDomNode.children.length > 0) {
                // This is not a leaf node
                return null;
            }
            const renderedStickyLine = this._getRenderedStickyLineFromChildDomNode(spanDomNode);
            if (!renderedStickyLine) {
                return null;
            }
            const column = (0, viewLine_1.getColumnOfNodeOffset)(renderedStickyLine.characterMapping, spanDomNode, 0);
            return new position_1.Position(renderedStickyLine.lineNumber, column);
        }
        getLineNumberFromChildDomNode(domNode) {
            return this._getRenderedStickyLineFromChildDomNode(domNode)?.lineNumber ?? null;
        }
        _getRenderedStickyLineFromChildDomNode(domNode) {
            const index = this.getLineIndexFromChildDomNode(domNode);
            if (index === null || index < 0 || index >= this._renderedStickyLines.length) {
                return null;
            }
            return this._renderedStickyLines[index];
        }
        /**
         * Given a child dom node, tries to find the line number attribute that was stored in the node.
         * @returns the attribute value or null if none is found.
         */
        getLineIndexFromChildDomNode(domNode) {
            const lineIndex = this._getAttributeValue(domNode, STICKY_INDEX_ATTR);
            return lineIndex ? parseInt(lineIndex, 10) : null;
        }
        /**
         * Given a child dom node, tries to find if it is (contained in) a sticky line.
         * @returns a boolean.
         */
        isInStickyLine(domNode) {
            const isInLine = this._getAttributeValue(domNode, STICKY_IS_LINE_ATTR);
            return isInLine !== undefined;
        }
        /**
         * Given a child dom node, tries to find if this dom node is (contained in) a sticky folding icon.
         * @returns a boolean.
         */
        isInFoldingIconDomNode(domNode) {
            const isInFoldingIcon = this._getAttributeValue(domNode, STICKY_IS_FOLDING_ICON_ATTR);
            return isInFoldingIcon !== undefined;
        }
        /**
         * Given the dom node, finds if it or its parent sequence contains the given attribute.
         * @returns the attribute value or undefined.
         */
        _getAttributeValue(domNode, attribute) {
            while (domNode && domNode !== this._rootDomNode) {
                const line = domNode.getAttribute(attribute);
                if (line !== null) {
                    return line;
                }
                domNode = domNode.parentElement;
            }
            return;
        }
    }
    exports.StickyScrollWidget = StickyScrollWidget;
    class RenderedStickyLine {
        constructor(index, lineNumber, lineDomNode, lineNumberDomNode, foldingIcon, characterMapping, scrollWidth) {
            this.index = index;
            this.lineNumber = lineNumber;
            this.lineDomNode = lineDomNode;
            this.lineNumberDomNode = lineNumberDomNode;
            this.foldingIcon = foldingIcon;
            this.characterMapping = characterMapping;
            this.scrollWidth = scrollWidth;
        }
    }
    class StickyFoldingIcon {
        constructor(isCollapsed, foldingStartLine, foldingEndLine, dimension) {
            this.isCollapsed = isCollapsed;
            this.foldingStartLine = foldingStartLine;
            this.foldingEndLine = foldingEndLine;
            this.dimension = dimension;
            this.domNode = document.createElement('div');
            this.domNode.style.width = `${dimension}px`;
            this.domNode.style.height = `${dimension}px`;
            this.domNode.className = themables_1.ThemeIcon.asClassName(isCollapsed ? foldingDecorations_1.foldingCollapsedIcon : foldingDecorations_1.foldingExpandedIcon);
        }
        setVisible(visible) {
            this.domNode.style.cursor = visible ? 'pointer' : 'default';
            this.domNode.style.opacity = visible ? '1' : '0';
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3RpY2t5U2Nyb2xsL2Jyb3dzZXIvc3RpY2t5U2Nyb2xsV2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1CaEcsTUFBYSx1QkFBdUI7UUFDbkMsWUFDVSxnQkFBMEIsRUFDMUIsY0FBd0IsRUFDeEIsd0JBQWdDLEVBQ2hDLGlCQUFnQyxJQUFJO1lBSHBDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBVTtZQUMxQixtQkFBYyxHQUFkLGNBQWMsQ0FBVTtZQUN4Qiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQVE7WUFDaEMsbUJBQWMsR0FBZCxjQUFjLENBQXNCO1FBQzFDLENBQUM7UUFFTCxNQUFNLENBQUMsS0FBMEM7WUFDaEQsT0FBTyxDQUFDLENBQUMsS0FBSzttQkFDVixJQUFJLENBQUMsd0JBQXdCLEtBQUssS0FBSyxDQUFDLHdCQUF3QjttQkFDaEUsSUFBSSxDQUFDLGNBQWMsS0FBSyxLQUFLLENBQUMsY0FBYzttQkFDNUMsSUFBQSxlQUFNLEVBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQzttQkFDckQsSUFBQSxlQUFNLEVBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDdkQsQ0FBQztLQUNEO0lBZkQsMERBZUM7SUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFBLHVDQUF3QixFQUFDLHVCQUF1QixFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUNwRyxNQUFNLGlCQUFpQixHQUFHLHdCQUF3QixDQUFDO0lBQ25ELE1BQU0sbUJBQW1CLEdBQUcs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