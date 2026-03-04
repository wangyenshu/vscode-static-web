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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/editor/contrib/hover/browser/resizableContentWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/accessibility/common/accessibility", "vs/editor/common/editorContextKeys", "vs/base/browser/ui/hover/hoverWidget"], function (require, exports, dom, keybinding_1, resizableContentWidget_1, contextkey_1, configuration_1, accessibility_1, editorContextKeys_1, hoverWidget_1) {
    "use strict";
    var ContentHoverWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContentHoverWidget = void 0;
    const HORIZONTAL_SCROLLING_BY = 30;
    const CONTAINER_HEIGHT_PADDING = 6;
    let ContentHoverWidget = class ContentHoverWidget extends resizableContentWidget_1.ResizableContentWidget {
        static { ContentHoverWidget_1 = this; }
        static { this.ID = 'editor.contrib.resizableContentHoverWidget'; }
        static { this._lastDimensions = new dom.Dimension(0, 0); }
        get isColorPickerVisible() {
            return Boolean(this._visibleData?.colorPicker);
        }
        get isVisibleFromKeyboard() {
            return (this._visibleData?.source === 1 /* HoverStartSource.Keyboard */);
        }
        get isVisible() {
            return this._hoverVisibleKey.get() ?? false;
        }
        get isFocused() {
            return this._hoverFocusedKey.get() ?? false;
        }
        constructor(editor, contextKeyService, _configurationService, _accessibilityService, _keybindingService) {
            const minimumHeight = editor.getOption(67 /* EditorOption.lineHeight */) + 8;
            const minimumWidth = 150;
            const minimumSize = new dom.Dimension(minimumWidth, minimumHeight);
            super(editor, minimumSize);
            this._configurationService = _configurationService;
            this._accessibilityService = _accessibilityService;
            this._keybindingService = _keybindingService;
            this._hover = this._register(new hoverWidget_1.HoverWidget());
            this._minimumSize = minimumSize;
            this._hoverVisibleKey = editorContextKeys_1.EditorContextKeys.hoverVisible.bindTo(contextKeyService);
            this._hoverFocusedKey = editorContextKeys_1.EditorContextKeys.hoverFocused.bindTo(contextKeyService);
            dom.append(this._resizableNode.domNode, this._hover.containerDomNode);
            this._resizableNode.domNode.style.zIndex = '50';
            this._register(this._editor.onDidLayoutChange(() => {
                if (this.isVisible) {
                    this._updateMaxDimensions();
                }
            }));
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(50 /* EditorOption.fontInfo */)) {
                    this._updateFont();
                }
            }));
            const focusTracker = this._register(dom.trackFocus(this._resizableNode.domNode));
            this._register(focusTracker.onDidFocus(() => {
                this._hoverFocusedKey.set(true);
            }));
            this._register(focusTracker.onDidBlur(() => {
                this._hoverFocusedKey.set(false);
            }));
            this._setHoverData(undefined);
            this._editor.addContentWidget(this);
        }
        dispose() {
            super.dispose();
            this._visibleData?.disposables.dispose();
            this._editor.removeContentWidget(this);
        }
        getId() {
            return ContentHoverWidget_1.ID;
        }
        static _applyDimensions(container, width, height) {
            const transformedWidth = typeof width === 'number' ? `${width}px` : width;
            const transformedHeight = typeof height === 'number' ? `${height}px` : height;
            container.style.width = transformedWidth;
            container.style.height = transformedHeight;
        }
        _setContentsDomNodeDimensions(width, height) {
            const contentsDomNode = this._hover.contentsDomNode;
            return ContentHoverWidget_1._applyDimensions(contentsDomNode, width, height);
        }
        _setContainerDomNodeDimensions(width, height) {
            const containerDomNode = this._hover.containerDomNode;
            return ContentHoverWidget_1._applyDimensions(containerDomNode, width, height);
        }
        _setHoverWidgetDimensions(width, height) {
            this._setContentsDomNodeDimensions(width, height);
            this._setContainerDomNodeDimensions(width, height);
            this._layoutContentWidget();
        }
        static _applyMaxDimensions(container, width, height) {
            const transformedWidth = typeof width === 'number' ? `${width}px` : width;
            const transformedHeight = typeof height === 'number' ? `${height}px` : height;
            container.style.maxWidth = transformedWidth;
            container.style.maxHeight = transformedHeight;
        }
        _setHoverWidgetMaxDimensions(width, height) {
            ContentHoverWidget_1._applyMaxDimensions(this._hover.contentsDomNode, width, height);
            ContentHoverWidget_1._applyMaxDimensions(this._hover.containerDomNode, width, height);
            this._hover.containerDomNode.style.setProperty('--vscode-hover-maxWidth', typeof width === 'number' ? `${width}px` : width);
            this._layoutContentWidget();
        }
        _setAdjustedHoverWidgetDimensions(size) {
            this._setHoverWidgetMaxDimensions('none', 'none');
            const width = size.width;
            const height = size.height;
            this._setHoverWidgetDimensions(width, height);
        }
        _updateResizableNodeMaxDimensions() {
            const maxRenderingWidth = this._findMaximumRenderingWidth() ?? Infinity;
            const maxRenderingHeight = this._findMaximumRenderingHeight() ?? Infinity;
            this._resizableNode.maxSize = new dom.Dimension(maxRenderingWidth, maxRenderingHeight);
            this._setHoverWidgetMaxDimensions(maxRenderingWidth, maxRenderingHeight);
        }
        _resize(size) {
            ContentHoverWidget_1._lastDimensions = new dom.Dimension(size.width, size.height);
            this._setAdjustedHoverWidgetDimensions(size);
            this._resizableNode.layout(size.height, size.width);
            this._updateResizableNodeMaxDimensions();
            this._hover.scrollbar.scanDomNode();
            this._editor.layoutContentWidget(this);
            this._visibleData?.colorPicker?.layout();
        }
        _findAvailableSpaceVertically() {
            const position = this._visibleData?.showAtPosition;
            if (!position) {
                return;
            }
            return this._positionPreference === 1 /* ContentWidgetPositionPreference.ABOVE */ ?
                this._availableVerticalSpaceAbove(position)
                : this._availableVerticalSpaceBelow(position);
        }
        _findMaximumRenderingHeight() {
            const availableSpace = this._findAvailableSpaceVertically();
            if (!availableSpace) {
                return;
            }
            // Padding needed in order to stop the resizing down to a smaller height
            let maximumHeight = CONTAINER_HEIGHT_PADDING;
            Array.from(this._hover.contentsDomNode.children).forEach((hoverPart) => {
                maximumHeight += hoverPart.clientHeight;
            });
            return Math.min(availableSpace, maximumHeight);
        }
        _isHoverTextOverflowing() {
            // To find out if the text is overflowing, we will disable wrapping, check the widths, and then re-enable wrapping
            this._hover.containerDomNode.style.setProperty('--vscode-hover-whiteSpace', 'nowrap');
            this._hover.containerDomNode.style.setProperty('--vscode-hover-sourceWhiteSpace', 'nowrap');
            const overflowing = Array.from(this._hover.contentsDomNode.children).some((hoverElement) => {
                return hoverElement.scrollWidth > hoverElement.clientWidth;
            });
            this._hover.containerDomNode.style.removeProperty('--vscode-hover-whiteSpace');
            this._hover.containerDomNode.style.removeProperty('--vscode-hover-sourceWhiteSpace');
            return overflowing;
        }
        _findMaximumRenderingWidth() {
            if (!this._editor || !this._editor.hasModel()) {
                return;
            }
            const overflowing = this._isHoverTextOverflowing();
            const initialWidth = (typeof this._contentWidth === 'undefined'
                ? 0
                : this._contentWidth - 2 // - 2 for the borders
            );
            if (overflowing || this._hover.containerDomNode.clientWidth < initialWidth) {
                const bodyBoxWidth = dom.getClientArea(this._hover.containerDomNode.ownerDocument.body).width;
                const horizontalPadding = 14;
                return bodyBoxWidth - horizontalPadding;
            }
            else {
                return this._hover.containerDomNode.clientWidth + 2;
            }
        }
        isMouseGettingCloser(posx, posy) {
            if (!this._visibleData) {
                return false;
            }
            if (typeof this._visibleData.initialMousePosX === 'undefined'
                || typeof this._visibleData.initialMousePosY === 'undefined') {
                this._visibleData.initialMousePosX = posx;
                this._visibleData.initialMousePosY = posy;
                return false;
            }
            const widgetRect = dom.getDomNodePagePosition(this.getDomNode());
            if (typeof this._visibleData.closestMouseDistance === 'undefined') {
                this._visibleData.closestMouseDistance = computeDistanceFromPointToRectangle(this._visibleData.initialMousePosX, this._visibleData.initialMousePosY, widgetRect.left, widgetRect.top, widgetRect.width, widgetRect.height);
            }
            const distance = computeDistanceFromPointToRectangle(posx, posy, widgetRect.left, widgetRect.top, widgetRect.width, widgetRect.height);
            if (distance > this._visibleData.closestMouseDistance + 4 /* tolerance of 4 pixels */) {
                // The mouse is getting farther away
                return false;
            }
            this._visibleData.closestMouseDistance = Math.min(this._visibleData.closestMouseDistance, distance);
            return true;
        }
        _setHoverData(hoverData) {
            this._visibleData?.disposables.dispose();
            this._visibleData = hoverData;
            this._hoverVisibleKey.set(!!hoverData);
            this._hover.containerDomNode.classList.toggle('hidden', !hoverData);
        }
        _updateFont() {
            const { fontSize, lineHeight } = this._editor.getOption(50 /* EditorOption.fontInfo */);
            const contentsDomNode = this._hover.contentsDomNode;
            contentsDomNode.style.fontSize = `${fontSize}px`;
            contentsDomNode.style.lineHeight = `${lineHeight / fontSize}`;
            const codeClasses = Array.prototype.slice.call(this._hover.contentsDomNode.getElementsByClassName('code'));
            codeClasses.forEach(node => this._editor.applyFontInfo(node));
        }
        _updateContent(node) {
            const contentsDomNode = this._hover.contentsDomNode;
            contentsDomNode.style.paddingBottom = '';
            contentsDomNode.textContent = '';
            contentsDomNode.appendChild(node);
        }
        _layoutContentWidget() {
            this._editor.layoutContentWidget(this);
            this._hover.onContentsChanged();
        }
        _updateMaxDimensions() {
            const height = Math.max(this._editor.getLayoutInfo().height / 4, 250, ContentHoverWidget_1._lastDimensions.height);
            const width = Math.max(this._editor.getLayoutInfo().width * 0.66, 500, ContentHoverWidget_1._lastDimensions.width);
            this._setHoverWidgetMaxDimensions(width, height);
        }
        _render(node, hoverData) {
            this._setHoverData(hoverData);
            this._updateFont();
            this._updateContent(node);
            this._updateMaxDimensions();
            this.onContentsChanged();
            // Simply force a synchronous render on the editor
            // such that the widget does not really render with left = '0px'
            this._editor.render();
        }
        getPosition() {
            if (!this._visibleData) {
                return null;
            }
            return {
                position: this._visibleData.showAtPosition,
                secondaryPosition: this._visibleData.showAtSecondaryPosition,
                positionAffinity: this._visibleData.isBeforeContent ? 3 /* PositionAffinity.LeftOfInjectedText */ : undefined,
                preference: [this._positionPreference ?? 1 /* ContentWidgetPositionPreference.ABOVE */]
            };
        }
        showAt(node, hoverData) {
            if (!this._editor || !this._editor.hasModel()) {
                return;
            }
            this._render(node, hoverData);
            const widgetHeight = dom.getTotalHeight(this._hover.containerDomNode);
            const widgetPosition = hoverData.showAtPosition;
            this._positionPreference = this._findPositionPreference(widgetHeight, widgetPosition) ?? 1 /* ContentWidgetPositionPreference.ABOVE */;
            // See https://github.com/microsoft/vscode/issues/140339
            // TODO: Doing a second layout of the hover after force rendering the editor
            this.onContentsChanged();
            if (hoverData.stoleFocus) {
                this._hover.containerDomNode.focus();
            }
            hoverData.colorPicker?.layout();
            // The aria label overrides the label, so if we add to it, add the contents of the hover
            const hoverFocused = this._hover.containerDomNode.ownerDocument.activeElement === this._hover.containerDomNode;
            const accessibleViewHint = hoverFocused && (0, hoverWidget_1.getHoverAccessibleViewHint)(this._configurationService.getValue('accessibility.verbosity.hover') === true && this._accessibilityService.isScreenReaderOptimized(), this._keybindingService.lookupKeybinding('editor.action.accessibleView')?.getAriaLabel() ?? '');
            if (accessibleViewHint) {
                this._hover.contentsDomNode.ariaLabel = this._hover.contentsDomNode.textContent + ', ' + accessibleViewHint;
            }
        }
        hide() {
            if (!this._visibleData) {
                return;
            }
            const stoleFocus = this._visibleData.stoleFocus || this._hoverFocusedKey.get();
            this._setHoverData(undefined);
            this._resizableNode.maxSize = new dom.Dimension(Infinity, Infinity);
            this._resizableNode.clearSashHoverState();
            this._hoverFocusedKey.set(false);
            this._editor.layoutContentWidget(this);
            if (stoleFocus) {
                this._editor.focus();
            }
        }
        _removeConstraintsRenderNormally() {
            // Added because otherwise the initial size of the hover content is smaller than should be
            const layoutInfo = this._editor.getLayoutInfo();
            this._resizableNode.layout(layoutInfo.height, layoutInfo.width);
            this._setHoverWidgetDimensions('auto', 'auto');
        }
        setMinimumDimensions(dimensions) {
            // We combine the new minimum dimensions with the previous ones
            this._minimumSize = new dom.Dimension(Math.max(this._minimumSize.width, dimensions.width), Math.max(this._minimumSize.height, dimensions.height));
            this._updateMinimumWidth();
        }
        _updateMinimumWidth() {
            const width = (typeof this._contentWidth === 'undefined'
                ? this._minimumSize.width
                : Math.min(this._contentWidth, this._minimumSize.width));
            // We want to avoid that the hover is artificially large, so we use the content width as minimum width
            this._resizableNode.minSize = new dom.Dimension(width, this._minimumSize.height);
        }
        onContentsChanged() {
            this._removeConstraintsRenderNormally();
            const containerDomNode = this._hover.containerDomNode;
            let height = dom.getTotalHeight(containerDomNode);
            let width = dom.getTotalWidth(containerDomNode);
            this._resizableNode.layout(height, width);
            this._setHoverWidgetDimensions(width, height);
            height = dom.getTotalHeight(containerDomNode);
            width = dom.getTotalWidth(containerDomNode);
            this._contentWidth = width;
            this._updateMinimumWidth();
            this._resizableNode.layout(height, width);
            if (this._visibleData?.showAtPosition) {
                const widgetHeight = dom.getTotalHeight(this._hover.containerDomNode);
                this._positionPreference = this._findPositionPreference(widgetHeight, this._visibleData.showAtPosition);
            }
            this._layoutContentWidget();
        }
        focus() {
            this._hover.containerDomNode.focus();
        }
        scrollUp() {
            const scrollTop = this._hover.scrollbar.getScrollPosition().scrollTop;
            const fontInfo = this._editor.getOption(50 /* EditorOption.fontInfo */);
            this._hover.scrollbar.setScrollPosition({ scrollTop: scrollTop - fontInfo.lineHeight });
        }
        scrollDown() {
            const scrollTop = this._hover.scrollbar.getScrollPosition().scrollTop;
            const fontInfo = this._editor.getOption(50 /* EditorOption.fontInfo */);
            this._hover.scrollbar.setScrollPosition({ scrollTop: scrollTop + fontInfo.lineHeight });
        }
        scrollLeft() {
            const scrollLeft = this._hover.scrollbar.getScrollPosition().scrollLeft;
            this._hover.scrollbar.setScrollPosition({ scrollLeft: scrollLeft - HORIZONTAL_SCROLLING_BY });
        }
        scrollRight() {
            const scrollLeft = this._hover.scrollbar.getScrollPosition().scrollLeft;
            this._hover.scrollbar.setScrollPosition({ scrollLeft: scrollLeft + HORIZONTAL_SCROLLING_BY });
        }
        pageUp() {
            const scrollTop = this._hover.scrollbar.getScrollPosition().scrollTop;
            const scrollHeight = this._hover.scrollbar.getScrollDimensions().height;
            this._hover.scrollbar.setScrollPosition({ scrollTop: scrollTop - scrollHeight });
        }
        pageDown() {
            const scrollTop = this._hover.scrollbar.getScrollPosition().scrollTop;
            const scrollHeight = this._hover.scrollbar.getScrollDimensions().height;
            this._hover.scrollbar.setScrollPosition({ scrollTop: scrollTop + scrollHeight });
        }
        goToTop() {
            this._hover.scrollbar.setScrollPosition({ scrollTop: 0 });
        }
        goToBottom() {
            this._hover.scrollbar.setScrollPosition({ scrollTop: this._hover.scrollbar.getScrollDimensions().scrollHeight });
        }
    };
    exports.ContentHoverWidget = ContentHoverWidget;
    exports.ContentHoverWidget = ContentHoverWidget = ContentHoverWidget_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, accessibility_1.IAccessibilityService),
        __param(4, keybinding_1.IKeybindingService)
    ], ContentHoverWidget);
    function computeDistanceFromPointToRectangle(pointX, pointY, left, top, width, height) {
        const x = (left + width / 2); // x center of rectangle
        const y = (top + height / 2); // y center of rectangle
        const dx = Math.max(Math.abs(pointX - x) - width / 2, 0);
        const dy = Math.max(Math.abs(pointY - y) - height / 2, 0);
        return Math.sqrt(dx * dx + dy * dy);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudEhvdmVyV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaG92ZXIvYnJvd3Nlci9jb250ZW50SG92ZXJXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdCaEcsTUFBTSx1QkFBdUIsR0FBRyxFQUFFLENBQUM7SUFDbkMsTUFBTSx3QkFBd0IsR0FBRyxDQUFDLENBQUM7SUFFNUIsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSwrQ0FBc0I7O2lCQUUvQyxPQUFFLEdBQUcsNENBQTRDLEFBQS9DLENBQWdEO2lCQUNqRCxvQkFBZSxHQUFrQixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxBQUF6QyxDQUEwQztRQVd4RSxJQUFXLG9CQUFvQjtZQUM5QixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFRCxJQUFXLHFCQUFxQjtZQUMvQixPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLHNDQUE4QixDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVELElBQVcsU0FBUztZQUNuQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUM7UUFDN0MsQ0FBQztRQUVELElBQVcsU0FBUztZQUNuQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLENBQUM7UUFDN0MsQ0FBQztRQUVELFlBQ0MsTUFBbUIsRUFDQyxpQkFBcUMsRUFDbEMscUJBQTZELEVBQzdELHFCQUE2RCxFQUNoRSxrQkFBdUQ7WUFFM0UsTUFBTSxhQUFhLEdBQUcsTUFBTSxD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