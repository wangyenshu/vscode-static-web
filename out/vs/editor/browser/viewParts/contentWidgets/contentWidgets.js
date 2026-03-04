/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart"], function (require, exports, dom, fastDomNode_1, viewPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewContentWidgets = void 0;
    class ViewContentWidgets extends viewPart_1.ViewPart {
        constructor(context, viewDomNode) {
            super(context);
            this._viewDomNode = viewDomNode;
            this._widgets = {};
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this.domNode, 1 /* PartFingerprint.ContentWidgets */);
            this.domNode.setClassName('contentWidgets');
            this.domNode.setPosition('absolute');
            this.domNode.setTop(0);
            this.overflowingContentWidgetsDomNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this.overflowingContentWidgetsDomNode, 2 /* PartFingerprint.OverflowingContentWidgets */);
            this.overflowingContentWidgetsDomNode.setClassName('overflowingContentWidgets');
        }
        dispose() {
            super.dispose();
            this._widgets = {};
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const keys = Object.keys(this._widgets);
            for (const widgetId of keys) {
                this._widgets[widgetId].onConfigurationChanged(e);
            }
            return true;
        }
        onDecorationsChanged(e) {
            // true for inline decorations that can end up relayouting text
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onLineMappingChanged(e) {
            this._updateAnchorsViewPositions();
            return true;
        }
        onLinesChanged(e) {
            this._updateAnchorsViewPositions();
            return true;
        }
        onLinesDeleted(e) {
            this._updateAnchorsViewPositions();
            return true;
        }
        onLinesInserted(e) {
            this._updateAnchorsViewPositions();
            return true;
        }
        onScrollChanged(e) {
            return true;
        }
        onZonesChanged(e) {
            return true;
        }
        // ---- end view event handlers
        _updateAnchorsViewPositions() {
            const keys = Object.keys(this._widgets);
            for (const widgetId of keys) {
                this._widgets[widgetId].updateAnchorViewPosition();
            }
        }
        addWidget(_widget) {
            const myWidget = new Widget(this._context, this._viewDomNode, _widget);
            this._widgets[myWidget.id] = myWidget;
            if (myWidget.allowEditorOverflow) {
                this.overflowingContentWidgetsDomNode.appendChild(myWidget.domNode);
            }
            else {
                this.domNode.appendChild(myWidget.domNode);
            }
            this.setShouldRender();
        }
        setWidgetPosition(widget, primaryAnchor, secondaryAnchor, preference, affinity) {
            const myWidget = this._widgets[widget.getId()];
            myWidget.setPosition(primaryAnchor, secondaryAnchor, preference, affinity);
            this.setShouldRender();
        }
        removeWidget(widget) {
            const widgetId = widget.getId();
            if (this._widgets.hasOwnProperty(widgetId)) {
                const myWidget = this._widgets[widgetId];
                delete this._widgets[widgetId];
                const domNode = myWidget.domNode.domNode;
                domNode.parentNode.removeChild(domNode);
                domNode.removeAttribute('monaco-visible-content-widget');
                this.setShouldRender();
            }
        }
        shouldSuppressMouseDownOnWidget(widgetId) {
            if (this._widgets.hasOwnProperty(widgetId)) {
                return this._widgets[widgetId].suppressMouseDown;
            }
            return false;
        }
        onBeforeRender(viewportData) {
            const keys = Object.keys(this._widgets);
            for (const widgetId of keys) {
                this._widgets[widgetId].onBeforeRender(viewportData);
            }
        }
        prepareRender(ctx) {
            const keys = Object.keys(this._widgets);
            for (const widgetId of keys) {
                this._widgets[widgetId].prepareRender(ctx);
            }
        }
        render(ctx) {
            const keys = Object.keys(this._widgets);
            for (const widgetId of keys) {
                this._widgets[widgetId].render(ctx);
            }
        }
    }
    exports.ViewContentWidgets = ViewContentWidgets;
    class Widget {
        constructor(context, viewDomNode, actual) {
            this._primaryAnchor = new PositionPair(null, null);
            this._secondaryAnchor = new PositionPair(null, null);
            this._context = context;
            this._viewDomNode = viewDomNode;
            this._actual = actual;
            this.domNode = (0, fastDomNode_1.createFastDomNode)(this._actual.getDomNode());
            this.id = this._actual.getId();
            this.allowEditorOverflow = this._actual.allowEditorOverflow || false;
            this.suppressMouseDown = this._actual.suppressMouseDown || false;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._fixedOverflowWidgets = options.get(42 /* EditorOption.fixedOverflowWidgets */);
            this._contentWidth = layoutInfo.contentWidth;
            this._contentLeft = layoutInfo.contentLeft;
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._affinity = null;
            this._preference = [];
            this._cachedDomNodeOffsetWidth = -1;
            this._cachedDomNodeOffsetHeight = -1;
            this._maxWidth = this._getMaxWidth();
            this._isVisible = false;
            this._renderData = null;
            this.domNode.setPosition((this._fixedOverflowWidgets && this.allowEditorOverflow) ? 'fixed' : 'absolute');
            this.domNode.setDisplay('none');
            this.domNode.setVisibility('hidden');
            this.domNode.setAttribute('widgetId', this.id);
            this.domNode.setMaxWidth(this._maxWidth);
        }
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
                this._contentLeft = layoutInfo.contentLeft;
                this._contentWidth = layoutInfo.contentWidth;
                this._maxWidth = this._getMaxWidth();
            }
        }
        updateAnchorViewPosition() {
            this._setPosition(this._affinity, this._primaryAnchor.modelPosition, this._secondaryAnchor.modelPosition);
        }
        _setPosition(affinity, primaryAnchor, secondaryAnchor) {
            this._affinity = affinity;
            this._primaryAnchor = getValidPositionPair(primaryAnchor, this._context.viewModel, this._affinity);
            this._secondaryAnchor = getValidPositionPair(secondaryAnchor, this._context.viewModel, this._affinity);
            function getValidPositionPair(position, viewModel, affinity) {
                if (!position) {
                    return new PositionPair(null, null);
                }
                // Do not trust that widgets give a valid position
                const validModelPosition = viewModel.model.validatePosition(position);
                if (viewModel.coordinatesConverter.modelPositionIsVisible(validModelPosition)) {
                    const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(validModelPosition, affinity ?? undefined);
                    return new PositionPair(position, viewPosition);
                }
                return new PositionPair(position, null);
            }
        }
        _getMaxWidth() {
            const elDocument = this.domNode.domNode.ownerDocument;
            const elWindow = elDocument.defaultView;
            return (this.allowEditorOverflow
                ? elWindow?.innerWidth || elDocument.documentElement.offsetWidth || elDocument.body.offsetWidth
                : this._contentWidth);
        }
        setPosition(primaryAnchor, secondaryAnchor, preference, affinity) {
            this._setPosition(affinity, primaryAnchor, secondaryAnchor);
            this._preference = preference;
            if (this._primaryAnchor.viewPosition && this._preference && this._preference.length > 0) {
                // this content widget would like to be visible if possible
                // we change it from `display:none` to `display:block` even if it
                // might be outside the viewport such that we can measure its size
                // in `prepareRender`
                this.domNode.setDisplay('block');
            }
            else {
                this.domNode.setDisplay('none');
            }
            this._cachedDomNodeOffsetWidth = -1;
            this._cachedDomNodeOffsetHeight = -1;
        }
        _layoutBoxInViewport(anchor, width, height, ctx) {
            // Our visible box is split horizontally by the current line => 2 boxes
            // a) the box above the line
            const aboveLineTop = anchor.top;
            const heightAvailableAboveLine = aboveLineTop;
            // b) the box under the line
            const underLineTop = anchor.top + anchor.height;
            const heightAvailableUnderLine = ctx.viewportHeight - underLineTop;
            const aboveTop = aboveLineTop - height;
            const fitsAbove = (heightAvailableAboveLine >= height);
            const belowTop = underLineTop;
            const fitsBelow = (heightAvailableUnderLine >= height);
            // And its left
            let left = anchor.left;
            if (left + width > ctx.scrollLeft + ctx.viewportWidth) {
                left = ctx.scrollLeft + ctx.viewportWidth - width;
            }
            if (left < ctx.scrollLeft) {
                left = ctx.scrollLeft;
            }
            return { fitsAbove, aboveTop, fitsBelow, belowTop, left };
        }
        _layoutHorizontalSegmentInPage(windowSize, domNodePosition, left, width) {
            // Leave some clearance to the left/right
            const LEFT_PADDING = 15;
            const RIGHT_PADDING = 15;
            // Initially, the limits are defined as the dom node limits
            const MIN_LIMIT = Math.max(LEFT_PADDING, domNodePosition.left - width);
            const MAX_LIMIT = Math.min(domNodePosition.left + domNodePosition.width + width, windowSize.width - RIGHT_PADDING);
            const elDocument = this._viewDomNode.domNode.ownerDocument;
            const elWindow = elDocument.defaultView;
            let absoluteLeft = domNodePosition.left + left - (elWindow?.scrollX ?? 0);
            if (absoluteLeft + width > MAX_LIMIT) {
                const delta = absoluteLeft - (MAX_LIMIT - width);
                absoluteLeft -= delta;
                left -= delta;
            }
            if (absoluteLeft < MIN_LIMIT) {
                const delta = absoluteLeft - MIN_LIMIT;
                absoluteLeft -= delta;
                left -= delta;
            }
            return [left, absoluteLeft];
        }
        _layoutBoxInPage(anchor, width, height, ctx) {
            const aboveTop = anchor.top - height;
            const belowTop = anchor.top + anchor.height;
            const domNodePosition = dom.getDomNodePagePosition(this._viewDomNode.domNode);
            const elDocument = this._viewDomNode.domNode.ownerDocument;
            const elWindow = elDocument.defaultView;
            const absoluteAboveTop = domNodePosition.top + aboveTop - (elWindow?.scrollY ?? 0);
            const absoluteBelowTop = domNodePosition.top + belowTop - (elWindow?.scrollY ?? 0);
            const windowSize = dom.getClientArea(elDocument.body);
            const [left, absoluteAboveLeft] = this._layoutHorizontalSegmentInPage(windowSize, domNodePosition, anchor.left - ctx.scrollLeft + this._contentLeft, width);
            // Leave some clearance to the top/bottom
            const TOP_PADDING = 22;
            const BOTTOM_PADDING = 22;
            const fitsAbove = (absoluteAboveTop >= TOP_PADDING);
            const fitsBelow = (absoluteBelowTop + height <= windowSize.height - BOTTOM_PADDING);
            if (this._fixedOverflowWidgets) {
                return {
                    fitsAbove,
                    aboveTop: Math.max(absoluteAboveTop, TOP_PADDING),
                    fitsBelow,
                    belowTop: absoluteBelowTop,
                    left: absoluteAboveLeft
                };
            }
            return { fitsAbove, aboveTop, fitsBelow, belowTop, left };
        }
        _prepareRenderWidgetAtExactPositionOverflowing(topLeft) {
            return new Coordinate(topLeft.top, topLeft.left + this._contentLeft);
        }
        /**
         * Compute the coordinates above and below the primary and secondary anchors.
         * The content widget *must* touch the primary anchor.
         * The content widget should touch if possible the secondary anchor.
         */
        _getAnchorsCoordinates(ctx) {
            const primary = getCoordinates(this._primaryAnchor.viewPosition, this._affinity, this._lineHeight);
            const secondaryViewPosition = (this._secondaryAnchor.viewPosition?.lineNumber === this._primaryAnchor.viewPosition?.lineNumber ? this._secondaryAnchor.viewPosition : null);
            const secondary = getCoordinates(secondaryViewPosition, this._affinity, this._lineHeight);
            return { primary, secondary };
            function getCoordinates(position, affinity, lineHeight) {
                if (!position) {
                    return null;
                }
                const horizontalPosition = ctx.visibleRangeForPosition(position);
                if (!horizontalPosition) {
                    return null;
                }
                // Left-align widgets that should appear :before content
                const left = (position.column === 1 && affinity === 3 /* PositionAffinity.LeftOfInjectedText */ ? 0 : horizontalPosition.left);
                const top = ctx.getVerticalOffsetForLineNumber(position.lineNumber) - ctx.scrollTop;
                return new AnchorCoordinate(top, left, lineHeight);
            }
        }
        _reduceAnchorCoordinates(primary, secondary, width) {
            if (!secondary) {
                return primary;
            }
            const fontInfo = this._context.configuration.options.get(50 /* EditorOption.fontInfo */);
            let left = secondary.left;
            if (left < primary.left) {
                left = Math.max(left, primary.left - width + fontInfo.typicalFullwidthCharacterWidth);
            }
            else {
                left = Math.min(left, primary.left + width - fontInfo.typicalFullwidthCharacterWidth);
            }
            return new AnchorCoordinate(primary.top, left, primary.height);
        }
        _prepareRenderWidget(ctx) {
            if (!this._preference || this._preference.length === 0) {
                return null;
            }
            const { primary, secondary } = this._getAnchorsCoordinates(ctx);
            if (!primary) {
                return null;
            }
            if (this._cachedDomNodeOffsetWidth === -1 || this._cachedDomNodeOffsetHeight === -1) {
                let preferredDimensions = null;
                if (typeof this._actual.beforeRender === 'function') {
                    preferredDimensions = safeInvoke(this._actual.beforeRender, this._actual);
                }
                if (preferredDimensions) {
                    this._cachedDomNodeOffsetWidth = preferredDimensions.width;
                    this._cachedDomNodeOffsetHeight = preferredDimensions.height;
                }
                else {
                    const domNode = this.domNode.domNode;
                    const clientRect = domNode.getBoundingClientRect();
                    this._cachedDomNodeOffsetWidth = Math.round(clientRect.width);
                    this._cachedDomNodeOffsetHeight = Math.round(clientRect.height);
                }
            }
            const anchor = this._reduceAnchorCoordinates(primary, secondary, this._cachedDomNodeOffsetWidth);
            let placement;
            if (this.allowEditorOverflow) {
                placement = this._layoutBoxInPage(anchor, this._cachedDomNodeOffsetWidth, this._cachedDomNodeOffsetHeight, ctx);
            }
            else {
                placement = this._layoutBoxInViewport(anchor, this._cachedDomNodeOffsetWidth, this._cachedDomNodeOffsetHeight, ctx);
            }
            // Do two passes, first for perfect fit, second picks first option
            for (let pass = 1; pass <= 2; pass++) {
                for (const pref of this._preference) {
                    // placement
                    if (pref === 1 /* ContentWidgetPositionPreference.ABOVE */) {
                        if (!placement) {
                            // Widget outside of viewport
                            return null;
                        }
                        if (pass === 2 || placement.fitsAbove) {
                            return { coordinate: new Coordinate(placement.aboveTop, placement.left), position: 1 /* ContentWidgetPositionPreference.ABOVE */ };
                        }
                    }
                    else if (pref === 2 /* ContentWidgetPositionPreference.BELOW */) {
                        if (!placement) {
                            // Widget outside of viewport
                            return null;
                        }
                        if (pass === 2 || placement.fitsBelow) {
                            return { coordinate: new Coordinate(placement.belowTop, placement.left), position: 2 /* ContentWidgetPositionPreference.BELOW */ };
                        }
                    }
                    else {
                        if (this.allowEditorOverflow) {
                            return { coordinate: this._prepareRenderWidgetAtExactPositionOverflowing(new Coordinate(anchor.top, anchor.left)), position: 0 /* ContentWidgetPositionPreference.EXACT */ };
                        }
                        else {
                            return { coordinate: new Coordinate(anchor.top, anchor.left), position: 0 /* ContentWidgetPositionPreference.EXACT */ };
                        }
                    }
                }
            }
            return null;
        }
        /**
         * On this first pass, we ensure that the content widget (if it is in the viewport) has the max width set correctly.
         */
        onBeforeRender(viewportData) {
            if (!this._primaryAnchor.viewPosition || !this._preference) {
                return;
            }
            if (this._primaryAnchor.viewPosition.lineNumber < viewportData.startLineNumber || this._primaryAnchor.viewPosition.lineNumber > viewportData.endLineNumber) {
                // Outside of viewport
                return;
            }
            this.domNode.setMaxWidth(this._maxWidth);
        }
        prepareRender(ctx) {
            this._renderData = this._prepareRenderWidget(ctx);
        }
        render(ctx) {
            if (!this._renderData) {
                // This widget should be invisible
                if (this._isVisible) {
                    this.domNode.removeAttribute('monaco-visible-content-widget');
                    this._isVisible = false;
                    this.domNode.setVisibility('hidden');
                }
                if (typeof this._actual.afterRender === 'function') {
                    safeInvoke(this._actual.afterRender, this._actual, null);
                }
                return;
            }
            // This widget should be visible
            if (this.allowEditorOverflow) {
                this.domNode.setTop(this._renderData.coordinate.top);
                this.domNode.setLeft(this._renderData.coordinate.left);
            }
            else {
                this.domNode.setTop(this._renderData.coordinate.top + ctx.scrollTop - ctx.bigNumbersDelta);
                this.domNode.setLeft(this._renderData.coordinate.left);
            }
            if (!this._isVisible) {
                this.domNode.setVisibility('inherit');
                this.domNode.setAttribute('monaco-visible-content-widget', 'true');
                this._isVisible = true;
            }
            if (typeof this._actual.afterRender === 'function') {
                safeInvoke(this._actual.afterRender, this._actual, this._renderData.position);
            }
        }
    }
    class PositionPair {
        constructor(modelPosition, viewPosition) {
            this.modelPosition = modelPosition;
            this.viewPosition = viewPosition;
        }
    }
    class Coordinate {
        constructor(top, left) {
            this.top = top;
            this.left = left;
            this._coordinateBrand = undefined;
        }
    }
    class AnchorCoordinate {
        constructor(top, left, height) {
            this.top = top;
            this.left = left;
            this.height = height;
            this._anchorCoordinateBrand = undefined;
        }
    }
    function safeInvoke(fn, thisArg, ...args) {
        try {
            return fn.call(thisArg, ...args);
        }
        catch {
            // ignore
            return null;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudFdpZGdldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvY29udGVudFdpZGdldHMvY29udGVudFdpZGdldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JoRyxNQUFhLGtCQUFtQixTQUFRLG1CQUFRO1FBUS9DLFlBQVksT0FBb0IsRUFBRSxXQUFxQztZQUN0RSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDZixJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztZQUNoQyxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUVuQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsK0JBQWlCLEVBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLDJCQUFnQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyx5Q0FBaUMsQ0FBQztZQUNyRSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXZCLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxJQUFBLCtCQUFpQixFQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN6RiwyQkFBZ0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxvREFBNEMsQ0FBQztZQUN6RyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsWUFBWSxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDakYsQ0FBQztRQUVlLE9B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