/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/common/arrays", "vs/editor/browser/view/dynamicViewOverlay", "vs/editor/browser/view/viewPart", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model", "vs/css!./glyphMargin"], function (require, exports, fastDomNode_1, arrays_1, dynamicViewOverlay_1, viewPart_1, position_1, range_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlyphMarginWidgets = exports.DedupOverlay = exports.VisibleLineDecorationsToRender = exports.LineDecorationToRender = exports.DecorationToRender = void 0;
    /**
     * Represents a decoration that should be shown along the lines from `startLineNumber` to `endLineNumber`.
     * This can end up producing multiple `LineDecorationToRender`.
     */
    class DecorationToRender {
        constructor(startLineNumber, endLineNumber, className, tooltip, zIndex) {
            this.startLineNumber = startLineNumber;
            this.endLineNumber = endLineNumber;
            this.className = className;
            this.tooltip = tooltip;
            this._decorationToRenderBrand = undefined;
            this.zIndex = zIndex ?? 0;
        }
    }
    exports.DecorationToRender = DecorationToRender;
    /**
     * A decoration that should be shown along a line.
     */
    class LineDecorationToRender {
        constructor(className, zIndex, tooltip) {
            this.className = className;
            this.zIndex = zIndex;
            this.tooltip = tooltip;
        }
    }
    exports.LineDecorationToRender = LineDecorationToRender;
    /**
     * Decorations to render on a visible line.
     */
    class VisibleLineDecorationsToRender {
        constructor() {
            this.decorations = [];
        }
        add(decoration) {
            this.decorations.push(decoration);
        }
        getDecorations() {
            return this.decorations;
        }
    }
    exports.VisibleLineDecorationsToRender = VisibleLineDecorationsToRender;
    class DedupOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        /**
         * Returns an array with an element for each visible line number.
         */
        _render(visibleStartLineNumber, visibleEndLineNumber, decorations) {
            const output = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                output[lineIndex] = new VisibleLineDecorationsToRender();
            }
            if (decorations.length === 0) {
                return output;
            }
            // Sort decorations by className, then by startLineNumber and then by endLineNumber
            decorations.sort((a, b) => {
                if (a.className === b.className) {
                    if (a.startLineNumber === b.startLineNumber) {
                        return a.endLineNumber - b.endLineNumber;
                    }
                    return a.startLineNumber - b.startLineNumber;
                }
                return (a.className < b.className ? -1 : 1);
            });
            let prevClassName = null;
            let prevEndLineIndex = 0;
            for (let i = 0, len = decorations.length; i < len; i++) {
                const d = decorations[i];
                const className = d.className;
                const zIndex = d.zIndex;
                let startLineIndex = Math.max(d.startLineNumber, visibleStartLineNumber) - visibleStartLineNumber;
                const endLineIndex = Math.min(d.endLineNumber, visibleEndLineNumber) - visibleStartLineNumber;
                if (prevClassName === className) {
                    // Here we avoid rendering the same className multiple times on the same line
                    startLineIndex = Math.max(prevEndLineIndex + 1, startLineIndex);
                    prevEndLineIndex = Math.max(prevEndLineIndex, endLineIndex);
                }
                else {
                    prevClassName = className;
                    prevEndLineIndex = endLineIndex;
                }
                for (let i = startLineIndex; i <= prevEndLineIndex; i++) {
                    output[i].add(new LineDecorationToRender(className, zIndex, d.tooltip));
                }
            }
            return output;
        }
    }
    exports.DedupOverlay = DedupOverlay;
    class GlyphMarginWidgets extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._widgets = {};
            this._context = context;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.domNode.setClassName('glyph-margin-widgets');
            this.domNode.setPosition('absolute');
            this.domNode.setTop(0);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._glyphMargin = options.get(57 /* EditorOption.glyphMargin */);
            this._glyphMarginLeft = layoutInfo.glyphMarginLeft;
            this._glyphMarginWidth = layoutInfo.glyphMarginWidth;
            this._glyphMarginDecorationLaneCount = layoutInfo.glyphMarginDecorationLaneCount;
            this._managedDomNodes = [];
            this._decorationGlyphsToRender = [];
        }
        dispose() {
            this._managedDomNodes = [];
            this._decorationGlyphsToRender = [];
            this._widgets = {};
            super.dispose();
        }
        getWidgets() {
            return Object.values(this._widgets);
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._glyphMargin = options.get(57 /* EditorOption.glyphMargin */);
            this._glyphMarginLeft = layoutInfo.glyphMarginLeft;
            this._glyphMarginWidth = layoutInfo.glyphMarginWidth;
            this._glyphMarginDecorationLaneCount = layoutInfo.glyphMarginDecorationLaneCount;
            return true;
        }
        onDecorationsChanged(e) {
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
            return e.scrollTopChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        // --- begin widget management
        addWidget(widget) {
            const domNode = (0, fastDomNode_1.createFastDomNode)(widget.getDomNode());
            this._widgets[widget.getId()] = {
                widget: widget,
                preference: widget.getPosition(),
                domNode: domNode,
                renderInfo: null
            };
            domNode.setPosition('absolute');
            domNode.setDisplay('none');
            domNode.setAttribute('widgetId', widget.getId());
            this.domNode.appendChild(domNode);
            this.setShouldRender();
        }
        setWidgetPosition(widget, preference) {
            const myWidget = this._widgets[widget.getId()];
            if (myWidget.preference.lane === preference.lane
                && myWidget.preference.zIndex === preference.zIndex
                && range_1.Range.equalsRange(myWidget.preference.range, preference.range)) {
                return false;
            }
            myWidget.preference = preference;
            this.setShouldRender();
            return true;
        }
        removeWidget(widget) {
            const widgetId = widget.getId();
            if (this._widgets[widgetId]) {
                const widgetData = this._widgets[widgetId];
                const domNode = widgetData.domNode.domNode;
                delete this._widgets[widgetId];
                domNode.parentNode?.removeChild(domNode);
                this.setShouldRender();
            }
        }
        // --- end widget management
        _collectDecorationBasedGlyphRenderRequest(ctx, requests) {
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            const decorations = ctx.getDecorationsInViewport();
            for (const d of decorations) {
                const glyphMarginClassName = d.options.glyphMarginClassName;
                if (!glyphMarginClassName) {
                    continue;
                }
                const startLineNumber = Math.max(d.range.startLineNumber, visibleStartLineNumber);
                const endLineNumber = Math.min(d.range.endLineNumber, visibleEndLineNumber);
                const lane = d.options.glyphMargin?.position ?? model_1.GlyphMarginLane.Center;
                const zIndex = d.options.zIndex ?? 0;
                for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                    const modelPosition = this._context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(lineNumber, 0));
                    const laneIndex = this._context.viewModel.glyphLanes.getLanesAtLine(modelPosition.lineNumber).indexOf(lane);
                    requests.push(new DecorationBasedGlyphRenderRequest(lineNumber, laneIndex, zIndex, glyphMarginClassName));
                }
            }
        }
        _collectWidgetBasedGlyphRenderRequest(ctx, requests) {
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            for (const widget of Object.values(this._widgets)) {
                const range = widget.preference.range;
                const { startLineNumber, endLineNumber } = this._context.viewModel.coordinatesConverter.convertModelRangeToViewRange(range_1.Range.lift(range));
                if (!startLineNumber || !endLineNumber || endLineNumber < visibleStartLineNumber || startLineNumber > visibleEndLineNumber) {
                    // The widget is not in the viewport
                    continue;
                }
                // The widget is in the viewport, find a good line for it
                const widgetLineNumber = Math.max(startLineNumber, visibleStartLineNumber);
                const modelPosition = this._context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(widgetLineNumber, 0));
                const laneIndex = this._context.viewModel.glyphLanes.getLanesAtLine(modelPosition.lineNumber).indexOf(widget.preference.lane);
                requests.push(new WidgetBasedGlyphRenderRequest(widgetLineNumber, laneIndex, widget.preference.zIndex, widget));
            }
        }
        _collectSortedGlyphRenderRequests(ctx) {
            const requests = [];
            this._collectDecorationBasedGlyphRenderRequest(ctx, requests);
            this._collectWidgetBasedGlyphRenderRequest(ctx, requests);
            // sort requests by lineNumber ASC, lane  ASC, zIndex DESC, type DESC (widgets first), className ASC
            // don't change this sort unless you understand `prepareRender` below.
            requests.sort((a, b) => {
                if (a.lineNumber === b.lineNumber) {
                    if (a.laneIndex === b.laneIndex) {
                        if (a.zIndex === b.zIndex) {
                            if (b.type === a.type) {
                                if (a.type === 0 /* GlyphRenderRequestType.Decoration */ && b.type === 0 /* GlyphRenderRequestType.Decoration */) {
                                    return (a.className < b.className ? -1 : 1);
                                }
                                return 0;
                            }
                            return b.type - a.type;
                        }
                        return b.zIndex - a.zIndex;
                    }
                    return a.laneIndex - b.laneIndex;
                }
                return a.lineNumber - b.lineNumber;
            });
            return requests;
        }
        /**
         * Will store render information in each widget's renderInfo and in `_decorationGlyphsToRender`.
         */
        prepareRender(ctx) {
            if (!this._glyphMargin) {
                this._decorationGlyphsToRender = [];
                return;
            }
            for (const widget of Object.values(this._widgets)) {
                widget.renderInfo = null;
            }
            const requests = new arrays_1.ArrayQueue(this._collectSortedGlyphRenderRequests(ctx));
            const decorationGlyphsToRender = [];
            while (requests.length > 0) {
                const first = requests.peek();
                if (!first) {
                    // not possible
                    break;
                }
                // Requests are sorted by lineNumber and lane, so we read all requests for this particular location
                const requestsAtLocation = requests.takeWhile((el) => el.lineNumber === first.lineNumber && el.laneIndex === first.laneIndex);
                if (!requestsAtLocation || requestsAtLocation.length === 0) {
                    // not possible
                    break;
                }
                const winner = requestsAtLocation[0];
                if (winner.type === 0 /* GlyphRenderRequestType.Decoration */) {
                    // combine all decorations with the same z-index
                    const classNames = [];
                    // requests are sorted by zIndex, type, and className so we can dedup className by looking at the previous one
                    for (const request of requestsAtLocation) {
                        if (request.zIndex !== winner.zIndex || request.type !== winner.type) {
                            break;
                        }
                        if (classNames.length === 0 || classNames[classNames.length - 1] !== request.className) {
                            classNames.push(request.className);
                        }
                    }
                    decorationGlyphsToRender.push(winner.accept(classNames.join(' '))); // TODO@joyceerhl Implement overflow for remaining decorations
                }
                else {
                    // widgets cannot be combined
                    winner.widget.renderInfo = {
                        lineNumber: winner.lineNumber,
                        laneIndex: winner.laneIndex,
                    };
                }
            }
            this._decorationGlyphsToRender = decorationGlyphsToRender;
        }
        render(ctx) {
            if (!this._glyphMargin) {
                for (const widget of Object.values(this._widgets)) {
                    widget.domNode.setDisplay('none');
                }
                while (this._managedDomNodes.length > 0) {
                    const domNode = this._managedDomNodes.pop();
                    domNode?.domNode.remove();
                }
                return;
            }
            const width = (Math.round(this._glyphMarginWidth / this._glyphMarginDecorationLaneCount));
            // Render widgets
            for (const widget of Object.values(this._widgets)) {
                if (!widget.renderInfo) {
                    // this widget is not visible
                    widget.domNode.setDisplay('none');
                }
                else {
                    const top = ctx.viewportData.relativeVerticalOffset[widget.renderInfo.lineNumber - ctx.viewportData.startLineNumber];
                    const left = this._glyphMarginLeft + widget.renderInfo.laneIndex * this._lineHeight;
                    widget.domNode.setDisplay('block');
                    widget.domNode.setTop(top);
                    widget.domNode.setLeft(left);
                    widget.domNode.setWidth(width);
                    widget.domNode.setHeight(this._lineHeight);
                }
            }
            // Render decorations, reusing previous dom nodes as possible
            for (let i = 0; i < this._decorationGlyphsToRender.length; i++) {
                const dec = this._decorationGlyphsToRender[i];
                const top = ctx.viewportData.relativeVerticalOffset[dec.lineNumber - ctx.viewportData.startLineNumber];
                const left = this._glyphMarginLeft + dec.laneIndex * this._lineHeight;
                let domNode;
                if (i < this._managedDomNodes.length) {
                    domNode = this._managedDomNodes[i];
                }
                else {
                    domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
                    this._managedDomNodes.push(domNode);
                    this.domNode.appendChild(domNode);
                }
                domNode.setClassName(`cgmr codicon ` + dec.combinedClassName);
                domNode.setPosition(`absolute`);
                domNode.setTop(top);
                domNode.setLeft(left);
                domNode.setWidth(width);
                domNode.setHeight(this._lineHeight);
            }
            // remove extra dom nodes
            while (this._managedDomNodes.length > this._decorationGlyphsToRender.length) {
                const domNode = this._managedDomNodes.pop();
                domNode?.domNode.remove();
            }
        }
    }
    exports.GlyphMarginWidgets = GlyphMarginWidgets;
    var GlyphRenderRequestType;
    (function (GlyphRenderRequestType) {
        GlyphRenderRequestType[GlyphRenderRequestType["Decoration"] = 0] = "Decoration";
        GlyphRenderRequestType[GlyphRenderRequestType["Widget"] = 1] = "Widget";
    })(GlyphRenderRequestType || (GlyphRenderRequestType = {}));
    /**
     * A request to render a decoration in the glyph margin at a certain location.
     */
    class DecorationBasedGlyphRenderRequest {
        constructor(lineNumber, laneIndex, zIndex, className) {
            this.lineNumber = lineNumber;
            this.laneIndex = laneIndex;
            this.zIndex = zIndex;
            this.className = className;
            this.type = 0 /* GlyphRenderRequestType.Decoration */;
        }
        accept(combinedClassName) {
            return new DecorationBasedGlyph(this.lineNumber, this.laneIndex, combinedClassName);
        }
    }
    /**
     * A request to render a widget in the glyph margin at a certain location.
     */
    class WidgetBasedGlyphRenderRequest {
        constructor(lineNumber, laneIndex, zIndex, widget) {
            this.lineNumber = lineNumber;
            this.laneIndex = laneIndex;
            this.zIndex = zIndex;
            this.widget = widget;
            this.type = 1 /* GlyphRenderRequestType.Widget */;
        }
    }
    class DecorationBasedGlyph {
        constructor(lineNumber, laneIndex, combinedClassName) {
            this.lineNumber = lineNumber;
            this.laneIndex = laneIndex;
            this.combinedClassName = combinedClassName;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2x5cGhNYXJnaW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvZ2x5cGhNYXJnaW4vZ2x5cGhNYXJnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JoRzs7O09BR0c7SUFDSCxNQUFhLGtCQUFrQjtRQUs5QixZQUNpQixlQUF1QixFQUN2QixhQUFxQixFQUNyQixTQUFpQixFQUNqQixPQUFzQixFQUN0QyxNQUEwQjtZQUpWLG9CQUFlLEdBQWYsZUFBZSxDQUFRO1lBQ3ZCLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1lBQ3JCLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIsWUFBTyxHQUFQLE9BQU8sQ0FBZTtZQVJ2Qiw2QkFBd0IsR0FBUyxTQUFTLENBQUM7WUFXMUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDO1FBQzNCLENBQUM7S0FDRDtJQWRELGdEQWNDO0lBRUQ7O09BRUc7SUFDSCxNQUFhLHNCQUFzQjtRQUNsQyxZQUNpQixTQUFpQixFQUNqQixNQUFjLEVBQ2QsT0FBc0I7WUFGdEIsY0FBUyxHQUFULFNBQVMsQ0FBUTtZQUNqQixXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQ2QsWUFBTyxHQUFQLE9BQU8sQ0FBZTtRQUNuQyxDQUFDO0tBQ0w7SUFORCx3REFNQztJQUVEOztPQUVHO0lBQ0gsTUFBYSw4QkFBOEI7UUFBM0M7WUFFa0IsZ0JBQVcsR0FBNkIsRUFBRSxDQUFDO1FBUzdELENBQUM7UUFQTyxHQUFHLENBQUMsVUFBa0M7WUFDNUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVNLGNBQWM7WUFDcEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pC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