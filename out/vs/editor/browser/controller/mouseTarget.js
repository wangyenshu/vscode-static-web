/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorDom", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/lines/viewLine", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/cursorColumns", "vs/base/browser/dom", "vs/editor/common/cursor/cursorAtomicMoveOperations", "vs/base/common/lazy"], function (require, exports, editorDom_1, viewPart_1, viewLine_1, position_1, range_1, cursorColumns_1, dom, cursorAtomicMoveOperations_1, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MouseTargetFactory = exports.HitTestContext = exports.MouseTarget = exports.PointerHandlerLastRenderData = void 0;
    var HitTestResultType;
    (function (HitTestResultType) {
        HitTestResultType[HitTestResultType["Unknown"] = 0] = "Unknown";
        HitTestResultType[HitTestResultType["Content"] = 1] = "Content";
    })(HitTestResultType || (HitTestResultType = {}));
    class UnknownHitTestResult {
        constructor(hitTarget = null) {
            this.hitTarget = hitTarget;
            this.type = 0 /* HitTestResultType.Unknown */;
        }
    }
    class ContentHitTestResult {
        get hitTarget() { return this.spanNode; }
        constructor(position, spanNode, injectedText) {
            this.position = position;
            this.spanNode = spanNode;
            this.injectedText = injectedText;
            this.type = 1 /* HitTestResultType.Content */;
        }
    }
    var HitTestResult;
    (function (HitTestResult) {
        function createFromDOMInfo(ctx, spanNode, offset) {
            const position = ctx.getPositionFromDOMInfo(spanNode, offset);
            if (position) {
                return new ContentHitTestResult(position, spanNode, null);
            }
            return new UnknownHitTestResult(spanNode);
        }
        HitTestResult.createFromDOMInfo = createFromDOMInfo;
    })(HitTestResult || (HitTestResult = {}));
    class PointerHandlerLastRenderData {
        constructor(lastViewCursorsRenderData, lastTextareaPosition) {
            this.lastViewCursorsRenderData = lastViewCursorsRenderData;
            this.lastTextareaPosition = lastTextareaPosition;
        }
    }
    exports.PointerHandlerLastRenderData = PointerHandlerLastRenderData;
    class MouseTarget {
        static _deduceRage(position, range = null) {
            if (!range && position) {
                return new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
            }
            return range ?? null;
        }
        static createUnknown(element, mouseColumn, position) {
            return { type: 0 /* MouseTargetType.UNKNOWN */, element, mouseColumn, position, range: this._deduceRage(position) };
        }
        static createTextarea(element, mouseColumn) {
            return { type: 1 /* MouseTargetType.TEXTAREA */, element, mouseColumn, position: null, range: null };
        }
        static createMargin(type, element, mouseColumn, position, range, detail) {
            return { type, element, mouseColumn, position, range, detail };
        }
        static createViewZone(type, element, mouseColumn, position, detail) {
            return { type, element, mouseColumn, position, range: this._deduceRage(position), detail };
        }
        static createContentText(element, mouseColumn, position, range, detail) {
            return { type: 6 /* MouseTargetType.CONTENT_TEXT */, element, mouseColumn, position, range: this._deduceRage(position, range), detail };
        }
        static createContentEmpty(element, mouseColumn, position, detail) {
            return { type: 7 /* MouseTargetType.CONTENT_EMPTY */, element, mouseColumn, position, range: this._deduceRage(position), detail };
        }
        static createContentWidget(element, mouseColumn, detail) {
            return { type: 9 /* MouseTargetType.CONTENT_WIDGET */, element, mouseColumn, position: null, range: null, detail };
        }
        static createScrollbar(element, mouseColumn, position) {
            return { type: 11 /* MouseTargetType.SCROLLBAR */, element, mouseColumn, position, range: this._deduceRage(position) };
        }
        static createOverlayWidget(element, mouseColumn, detail) {
            return { type: 12 /* MouseTargetType.OVERLAY_WIDGET */, element, mouseColumn, position: null, range: null, detail };
        }
        static createOutsideEditor(mouseColumn, position, outsidePosition, outsideDistance) {
            return { type: 13 /* MouseTargetType.OUTSIDE_EDITOR */, element: null, mouseColumn, position, range: this._deduceRage(position), outsidePosition, outsideDistance };
        }
        static _typeToString(type) {
            if (type === 1 /* MouseTargetType.TEXTAREA */) {
                return 'TEXTAREA';
            }
            if (type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */) {
                return 'GUTTER_GLYPH_MARGIN';
            }
            if (type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */) {
                return 'GUTTER_LINE_NUMBERS';
            }
            if (type === 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
                return 'GUTTER_LINE_DECORATIONS';
            }
            if (type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */) {
                return 'GUTTER_VIEW_ZONE';
            }
            if (type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                return 'CONTENT_TEXT';
            }
            if (type === 7 /* MouseTargetType.CONTENT_EMPTY */) {
                return 'CONTENT_EMPTY';
            }
            if (type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */) {
                return 'CONTENT_VIEW_ZONE';
            }
            if (type === 9 /* MouseTargetType.CONTENT_WIDGET */) {
                return 'CONTENT_WIDGET';
            }
            if (type === 10 /* MouseTargetType.OVERVIEW_RULER */) {
                return 'OVERVIEW_RULER';
            }
            if (type === 11 /* MouseTargetType.SCROLLBAR */) {
                return 'SCROLLBAR';
            }
            if (type === 12 /* MouseTargetType.OVERLAY_WIDGET */) {
                return 'OVERLAY_WIDGET';
            }
            return 'UNKNOWN';
        }
        static toString(target) {
            return this._typeToString(target.type) + ': ' + target.position + ' - ' + target.range + ' - ' + JSON.stringify(target.detail);
        }
    }
    exports.MouseTarget = MouseTarget;
    class ElementPath {
        static isTextArea(path) {
            return (path.length === 2
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[1] === 7 /* PartFingerprint.TextArea */);
        }
        static isChildOfViewLines(path) {
            return (path.length >= 4
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[3] === 8 /* PartFingerprint.ViewLines */);
        }
        static isStrictChildOfViewLines(path) {
            return (path.length > 4
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[3] === 8 /* PartFingerprint.ViewLines */);
        }
        static isChildOfScrollableElement(path) {
            return (path.length >= 2
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[1] === 6 /* PartFingerprint.ScrollableElement */);
        }
        static isChildOfMinimap(path) {
            return (path.length >= 2
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[1] === 9 /* PartFingerprint.Minimap */);
        }
        static isChildOfContentWidgets(path) {
            return (path.length >= 4
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[3] === 1 /* PartFingerprint.ContentWidgets */);
        }
        static isChildOfOverflowGuard(path) {
            return (path.length >= 1
                && path[0] === 3 /* PartFingerprint.OverflowGuard */);
        }
        static isChildOfOverflowingContentWidgets(path) {
            return (path.length >= 1
                && path[0] === 2 /* PartFingerprint.OverflowingContentWidgets */);
        }
        static isChildOfOverlayWidgets(path) {
            return (path.length >= 2
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[1] === 4 /* PartFingerprint.OverlayWidgets */);
        }
        static isChildOfOverflowingOverlayWidgets(path) {
            return (path.length >= 1
                && path[0] === 5 /* PartFingerprint.OverflowingOverlayWidgets */);
        }
    }
    class HitTestContext {
        constructor(context, viewHelper, lastRenderData) {
            this.viewModel = context.viewModel;
            const options = context.configuration.options;
            this.layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this.viewDomNode = viewHelper.viewDomNode;
            this.lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this.stickyTabStops = options.get(116 /* EditorOption.stickyTabStops */);
            this.typicalHalfwidthCharacterWidth = options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth;
            this.lastRenderData = lastRenderData;
            this._context = context;
            this._viewHelper = viewHelper;
        }
        getZoneAtCoord(mouseVerticalOffset) {
            return HitTestContext.getZoneAtCoord(this._context, mouseVerticalOffset);
        }
        static getZoneAtCoord(context, mouseVerticalOffset) {
            // The target is either a view zone or the empty space after the last view-line
            const viewZoneWhitespace = context.viewLayout.getWhitespaceAtVerticalOffset(mouseVerticalOffset);
            if (viewZoneWhitespace) {
                const viewZoneMiddle = viewZoneWhitespace.verticalOffset + viewZoneWhitespace.height / 2;
                const lineCount = context.viewModel.getLineCount();
                let positionBefore = null;
                let position;
                let positionAfter = null;
                if (viewZoneWhitespace.afterLineNumber !== lineCount) {
                    // There are more lines after this view zone
                    positionAfter = new position_1.Position(viewZoneWhitespace.afterLineNumber + 1, 1);
                }
                if (viewZoneWhitespace.afterLineNumber > 0) {
                    // There are more lines above this view zone
                    positionBefore = new position_1.Position(viewZoneWhitespace.afterLineNumber, context.viewModel.getLineMaxColumn(viewZoneWhitespace.afterLineNumber));
                }
                if (positionAfter === null) {
                    position = positionBefore;
                }
                else if (positionBefore === null) {
                    position = positionAfter;
                }
                else if (mouseVerticalOffset < viewZoneMiddle) {
                    position = positionBefore;
                }
                else {
                    position = positionAfter;
                }
                return {
                    viewZoneId: viewZoneWhitespace.id,
                    afterLineNumber: viewZoneWhitespace.afterLineNumber,
                    positionBefore: positionBefore,
                    positionAfter: positionAfter,
                    position: position
                };
            }
            return null;
        }
        getFullLineRangeAtCoord(mouseVerticalOffset) {
            if (this._context.viewLayout.isAfterLines(mouseVerticalOffset)) {
                // Below the last line
                const lineNumber = this._context.viewModel.getLineCount();
                const maxLineColumn = this._context.viewModel.getLineMaxColumn(lineNumber);
                return {
                    range: new range_1.Range(lineNumber, maxLineColumn, lineNumber, maxLineColumn),
                    isAfterLines: true
                };
            }
            const lineNumber = this._context.viewLayout.getLineNumberAtVerticalOffset(mouseVerticalOffset);
            const maxLineColumn = this._context.viewModel.getLineMaxColumn(lineNumber);
            return {
                range: new range_1.Range(lineNumber, 1, lineNumber, maxLineColumn),
                isAfterLines: false
            };
        }
        getLineNumberAtVerticalOffset(mouseVerticalOffset) {
            return this._context.viewLayout.getLineNumberAtVerticalOffset(mouseVerticalOffset);
        }
        isAfterLines(mouseVerticalOffset) {
            return this._context.viewLayout.isAfterLines(mouseVerticalOffset);
        }
        isInTopPadding(mouseVerticalOffset) {
            return this._context.viewLayout.isInTopPadding(mouseVerticalOffset);
        }
        isInBottomPadding(mouseVerticalOffset) {
            return this._context.viewLayout.isInBottomPadding(mouseVerticalOffset);
        }
        getVerticalOffsetForLineNumber(lineNumber) {
            return this._context.viewLayout.getVerticalOffsetForLineNumber(lineNumber);
        }
        findAttribute(element, attr) {
            return HitTestContext._findAttribute(element, attr, this._viewHelper.viewDomNode);
        }
        static _findAttribute(element, attr, stopAt) {
            while (element && element !== element.ownerDocument.body) {
                if (element.hasAttribute && element.hasAttribute(attr)) {
                    return element.getAttribute(attr);
                }
                if (element === stopAt) {
                    return null;
                }
                element = element.parentNode;
            }
            return null;
        }
        getLineWidth(lineNumber) {
            return this._viewHelper.getLineWidth(lineNumber);
        }
        visibleRangeForPosition(lineNumber, column) {
            return this._viewHelper.visibleRangeForPosition(lineNumber, column);
        }
        getPositionFromDOMInfo(spanNode, offset) {
            return this._viewHelper.getPositionFromDOMInfo(spanNode, offset);
        }
        getCurrentScrollTop() {
            return this._context.viewLayout.getCurrentScrollTop();
        }
        getCurrentScrollLeft() {
            return this._context.viewLayout.getCurrentScrollLeft();
        }
    }
    exports.HitTestContext = HitTestContext;
    class BareHitTestRequest {
        constructor(ctx, editorPos, pos, relativePos) {
            this.editorPos = editorPos;
            this.pos = pos;
            this.relativePos = relativePos;
            this.mouseVerticalOffset = Math.max(0, ctx.getCurrentScrollTop() + this.relativePos.y);
            this.mouseContentHorizontalOffset = ctx.getCurrentScrollLeft() + this.relativePos.x - ctx.layoutInfo.contentLeft;
            this.isInMarginArea = (this.relativePos.x < ctx.layoutInfo.contentLeft && this.relativePos.x >= ctx.layoutInfo.glyphMarginLeft);
            this.isInContentArea = !this.isInMarginArea;
            this.mouseColumn = Math.max(0, MouseTargetFactory._getMouseColumn(this.mouseContentHorizontalOffset, ctx.typicalHalfwidthCharacterWidth));
        }
    }
    class HitTestRequest extends BareHitTestRequest {
        get target() {
            if (this._useHitTestTarget) {
                return this.hitTestResult.value.hitTarget;
            }
            return this._eventTarget;
        }
        get targetPath() {
            if (this._targetPathCacheElement !== this.target) {
                this._targetPathCacheElement = this.target;
                this._targetPathCacheValue = viewPart_1.PartFingerprints.collect(this.target, this._ctx.viewDomNode);
            }
            return this._targetPathCacheValue;
        }
        constructor(ctx, editorPos, pos, relativePos, eventTarget) {
            super(ctx, editorPos, pos, relativePos);
            this.hitTestResult = new lazy_1.Lazy(() => MouseTargetFactory.doHitTest(this._ctx, this));
            this._targetPathCacheElement = null;
            this._targetPathCacheValue = new Uint8Array(0);
            this._ctx = ctx;
            this._eventTarget = eventTarget;
            // If no event target is passed in, we will use the hit test target
            const hasEventTarget = Boolean(this._eventTarget);
            this._useHitTestTarget = !hasEventTarget;
        }
        toString() {
            return `pos(${this.pos.x},${this.pos.y}), editorPos(${this.editorPos.x},${this.editorPos.y}), relativePos(${this.relativePos.x},${this.relativePos.y}), mouseVerticalOffset: ${this.mouseVerticalOffset}, mouseContentHorizontalOffset: ${this.mouseContentHorizontalOffset}\n\ttarget: ${this.target ? this.target.outerHTML : null}`;
        }
        get wouldBenefitFromHitTestTargetSwitch() {
            return (!this._useHitTestTarget
                && this.hitTestResult.value.hitTarget !== null
                && this.target !== this.hitTestResult.value.hitTarget);
        }
        switchToHitTestTarget() {
            this._useHitTestTarget = true;
        }
        _getMouseColumn(position = null) {
            if (position && position.column < this._ctx.viewModel.getLineMaxColumn(position.lineNumber)) {
                // Most likely, the line contains foreign decorations...
                return cursorColumns_1.CursorColumns.visibleColumnFromColumn(this._ctx.viewModel.getLineContent(position.lineNumber), position.column, this._ctx.viewModel.model.getOptions().tabSize) + 1;
            }
            return this.mouseColumn;
        }
        fulfillUnknown(position = null) {
            return MouseTarget.createUnknown(this.target, this._getMouseColumn(position), position);
        }
        fulfillTextarea() {
            return MouseTarget.createTextarea(this.target, this._getMouseColumn());
        }
        fulfillMargin(type, position, range, detail) {
            return MouseTarget.createMargin(type, this.target, this._getMouseColumn(position), position, range, detail);
        }
        fulfillViewZone(type, position, detail) {
            return MouseTarget.createViewZone(type, this.target, this._getMouseColumn(position), position, detail);
        }
        fulfillContentText(position, range, detail) {
            return MouseTarget.createContentText(this.target, this._getMouseColumn(position), position, range, detail);
        }
        fulfillContentEmpty(position, detail) {
            return MouseTarget.createContentEmpty(this.target, this._getMouseColumn(position), position, detail);
        }
        fulfillContentWidget(detail) {
            return MouseTarget.createContentWidget(this.target, this._getMouseColumn(), detail);
        }
        fulfillScrollbar(position) {
            return MouseTarget.createScrollbar(this.target, this._getMouseColumn(position), position);
        }
        fulfillOverlayWidget(detail) {
            return MouseTarget.createOverlayWidget(this.target, this._getMouseColumn(), detail);
        }
    }
    const EMPTY_CONTENT_AFTER_LINES = { isAfterLines: true };
    function createEmptyContentDataInLines(horizontalDistanceToText) {
        return {
            isAfterLines: false,
            horizontalDistanceToText: horizontalDistanceToText
        };
    }
    class MouseTargetFactory {
        constructor(context, viewHelper) {
            this._context = context;
            this._viewHelper = viewHelper;
        }
        mouseTargetIsWidget(e) {
            const t = e.target;
            const path = viewPart_1.PartFingerprints.collect(t, this._viewHelper.viewDomNode);
            // Is it a content widget?
            if (ElementPath.isChildOfContentWidgets(path) || ElementPath.isChildOfOverflowingContentWidgets(path)) {
                return true;
            }
            // Is it an overlay widget?
            if (ElementPath.isChildOfOverlayWidgets(path) || ElementPath.isChildOfOverflowingOverlayWidgets(path)) {
                return true;
            }
            return false;
        }
        createMouseTarget(lastRenderData, editorPos, pos, relativePos, target) {
            const ctx = new HitTestContext(this._context, this._viewHelper, lastRenderData);
            const request = new HitTestRequest(ctx, editorPos, pos, relativePos, target);
            try {
                const r = MouseTargetFactory._createMouseTarget(ctx, request);
                if (r.type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                    // Snap to the nearest soft tab boundary if atomic soft tabs are enabled.
                    if (ctx.stickyTabStops && r.position !== null) {
                        const position = MouseTargetFactory._snapToSoftTabBoundary(r.position, ctx.viewModel);
                        const range = range_1.Range.fromPositions(position, position).plusRange(r.range);
                        return request.fulfillContentText(position, range, r.detail);
                    }
                }
                // console.log(MouseTarget.toString(r));
                return r;
            }
            catch (err) {
                // console.log(err);
                return request.fulfillUnknown();
            }
        }
        static _createMouseTarget(ctx, request) {
            // console.log(`${domHitTestExecuted ? '=>' : ''}CAME IN REQUEST: ${request}`);
            if (request.target === null) {
                // No target
                return request.fulfillUnknown();
            }
            // we know for a fact that request.target is not null
            const resolvedRequest = request;
            let result = null;
            if (!ElementPath.isChildOfOverflowGuard(request.targetPath) && !ElementPath.isChildOfOverflowingContentWidgets(request.targetPath) && !ElementPath.isChildOfOverflowingOverlayWidgets(request.targetPath)) {
                // We only render dom nodes inside the overflow guard or in the overflowing content widgets
                result = result || request.fulfillUnknown();
            }
            result = result || MouseTargetFactory._hitTestContentWidget(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestOverlayWidget(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestMinimap(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestScrollbarSlider(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestViewZone(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestMargin(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestViewCursor(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestTextArea(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestViewLines(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestScrollbar(ctx, resolvedRequest);
            return (result || request.fulfillUnknown());
        }
        static _hitTestContentWidget(ctx, request) {
            // Is it a content widget?
            if (ElementPath.isChildOfContentWidgets(request.targetPath) || ElementPath.isChildOfOverflowingContentWidgets(request.targetPath)) {
                const widgetId = ctx.findAttribute(request.target, 'widgetId');
                if (widgetId) {
                    return request.fulfillContentWidget(widgetId);
                }
                else {
                    return request.fulfillUnknown();
                }
            }
            return null;
        }
        static _hitTestOverlayWidget(ctx, request) {
            // Is it an overlay widget?
            if (ElementPath.isChildOfOverlayWidgets(request.targetPath) || ElementPath.isChildOfOverflowingOverlayWidgets(request.targetPath)) {
                const widgetId = ctx.findAttribute(request.target, 'widgetId');
                if (widgetId) {
                    return request.fulfillOverlayWidget(widgetId);
                }
                else {
                    return request.fulfillUnknown();
                }
            }
            return null;
        }
        static _hitTestViewCursor(ctx, request) {
            if (request.target) {
                // Check if we've hit a painted cursor
                const lastViewCursorsRenderData = ctx.lastRenderData.lastViewCursorsRenderData;
                for (const d of lastViewCursorsRenderData) {
                    if (request.target === d.domNode) {
                        return request.fulfillContentText(d.position, null, { mightBeForeignElement: false, injectedText: null });
                    }
                }
            }
            if (request.isInContentArea) {
                // Edge has a bug when hit-testing the exact position of a cursor,
                // instead of returning the correct dom node, it returns the
                // first or last rendered view line dom node, therefore help it out
                // and first check if we are on top of a cursor
                const lastViewCursorsRenderData = ctx.lastRenderData.lastViewCursorsRenderData;
                const mouseContentHorizontalOffset = request.mouseContentHorizontalOffset;
                const mouseVerticalOffset = request.mouseVerticalOffset;
                for (const d of lastViewCursorsRenderData) {
                    if (mouseContentHorizontalOffset < d.contentLeft) {
                        // mouse position is to the left of the cursor
                        continue;
                    }
                    if (mouseContentHorizontalOffset > d.contentLeft + d.width) {
                        // mouse position is to the right of the cursor
                        continue;
                    }
                    const cursorVerticalOffset = ctx.getVerticalOffsetForLineNumber(d.position.lineNumber);
                    if (cursorVerticalOffset <= mouseVerticalOffset
                        && mouseVerticalOffset <= cursorVerticalOffset + d.height) {
                        return request.fulfillContentText(d.position, null, { mightBeForeignElement: false, injectedText: null });
                    }
                }
            }
            return null;
        }
        static _hitTestViewZone(ctx, request) {
            const viewZoneData = ctx.getZoneAtCoord(request.mouseVerticalOffset);
            if (viewZoneData) {
                const mouseTargetType = (request.isInContentArea ? 8 /* MouseTargetType.CONTENT_VIEW_ZONE */ : 5 /* MouseTargetType.GUTTER_VIEW_ZONE */);
                return request.fulfillViewZone(mouseTargetType, viewZoneData.position, viewZoneData);
            }
            return null;
        }
        static _hitTestTextArea(ctx, request) {
            // Is it the textarea?
            if (ElementPath.isTextArea(request.targetPath)) {
                if (ctx.lastRenderData.lastTextareaPosition) {
                    return request.fulfillContentText(ctx.lastRenderData.lastTextareaPosition, null, { mightBeForeignElement: false, injectedText: null });
                }
                return request.fulfillTextarea();
            }
            return null;
        }
        static _hitTestMargin(ctx, request) {
            if (request.isInMarginArea) {
                const res = ctx.getFullLineRangeAtCoord(request.mouseVerticalOffset);
                const pos = res.range.getStartPosition();
                let offset = Math.abs(request.relativePos.x);
                const detail = {
                    isAfterLines: res.isAfterLines,
                    glyphMarginLeft: ctx.layoutInfo.glyphMarginLeft,
                    glyphMarginWidth: ctx.layoutInfo.glyphMarginWidth,
                    lineNumbersWidth: ctx.layoutInfo.lineNumbersWidth,
                    offsetX: offset
                };
                offset -= ctx.layoutInfo.glyphMarginLeft;
                if (offset <= ctx.layoutInfo.glyphMarginWidth) {
                    // On the glyph margin
                    const modelCoordinate = ctx.viewModel.coordinatesConverter.convertViewPositionToModelPosition(res.range.getStartPosition());
                    const lanes = ctx.viewModel.glyphLanes.getLanesAtLine(modelCoordinate.lineNumber);
                    detail.glyphMarginLane = lanes[Math.floor(offset / ctx.lineHeight)];
                    return request.fulfillMargin(2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */, pos, res.range, detail);
                }
                offset -= ctx.layoutInfo.glyphMarginWidth;
                if (offset <= ctx.layoutInfo.lineNumbersWidth) {
                    // On the line numbers
                    return request.fulfillMargin(3 /* MouseTargetType.GUTTER_LINE_NUMBERS */, pos, res.range, detail);
                }
                offset -= ctx.layoutInfo.lineNumbersWidth;
                // On the line decorations
                return request.fulfillMargin(4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */, pos, res.range, detail);
            }
            return null;
        }
        static _hitTestViewLines(ctx, request) {
            if (!ElementPath.isChildOfViewLines(request.targetPath)) {
                return null;
            }
            if (ctx.isInTopPadding(request.mouseVerticalOffset)) {
                return request.fulfillContentEmpty(new position_1.Position(1, 1), EMPTY_CONTENT_AFTER_LINES);
            }
            // Check if it is below any lines and any view zones
            if (ctx.isAfterLines(request.mouseVerticalOffset) || ctx.isInBottomPadding(request.mouseVerticalOffset)) {
                // This most likely indicates it happened after the last view-line
                const lineCount = ctx.viewModel.getLineCount();
                const maxLineColumn = ctx.viewModel.getLineMaxColumn(lineCount);
                return request.fulfillContentEmpty(new position_1.Position(lineCount, maxLineColumn), EMPTY_CONTENT_AFTER_LINES);
            }
            // Check if we are hitting a view-line (can happen in the case of inline decorations on empty lines)
            // See https://github.com/microsoft/vscode/issues/46942
            if (ElementPath.isStrictChildOfViewLines(request.targetPath)) {
                const lineNumber = ctx.getLineNumberAtVerticalOffset(request.mouseVerticalOffset);
                if (ctx.viewModel.getLineLength(lineNumber) === 0) {
                    const lineWidth = ctx.getLineWidth(lineNumber);
                    const detail = createEmptyContentDataInLines(request.mouseContentHorizontalOffset - lineWidth);
                    return request.fulfillContentEmpty(new position_1.Position(lineNumber, 1), detail);
                }
                const lineWidth = ctx.getLineWidth(lineNumber);
                if (request.mouseContentHorizontalOffset >= lineWidth) {
                    // TODO: This is wrong for RTL
                    const detail = createEmptyContentDataInLines(request.mouseContentHorizontalOffset - lineWidth);
                    const pos = new position_1.Position(lineNumber, ctx.viewModel.getLineMaxColumn(lineNumber));
                    return request.fulfillContentEmpty(pos, detail);
                }
            }
            // Do the hit test (if not already done)
            const hitTestResult = request.hitTestResult.value;
            if (hitTestResult.type === 1 /* HitTestResultType.Content */) {
                return MouseTargetFactory.createMouseTargetFromHitTestPosition(ctx, request, hitTestResult.spanNode, hitTestResult.position, hitTestResult.injectedText);
            }
            // We didn't hit content...
            if (request.wouldBenefitFromHitTestTargetSwitch) {
                // We actually hit something different... Give it one last change by trying again with this new target
                request.switchToHitTestTarget();
                return this._createMouseTarget(ctx, request);
            }
            // We have tried everything...
            return request.fulfillUnknown();
        }
        static _hitTestMinimap(ctx, request) {
            if (ElementPath.isChildOfMinimap(request.targetPath)) {
                const possibleLineNumber = ctx.getLineNumberAtVerticalOffset(request.mouseVerticalOffset);
                const maxColumn = ctx.viewModel.getLineMaxColumn(possibleLineNumber);
                return request.fulfillScrollbar(new position_1.Position(possibleLineNumber, maxColumn));
            }
            return null;
        }
        static _hitTestScrollbarSlider(ctx, request) {
            if (ElementPath.isChildOfScrollableElement(request.targetPath)) {
                if (request.target && request.target.nodeType === 1) {
                    const className = request.target.className;
                    if (className && /\b(slider|scrollbar)\b/.test(className)) {
                        const possibleLineNumber = ctx.getLineNumberAtVerticalOffset(request.mouseVerticalOffset);
                        const maxColumn = ctx.viewModel.getLineMaxColumn(possibleLineNumber);
                        return request.fulfillScrollbar(new position_1.Position(possibleLineNumber, maxColumn));
                    }
                }
            }
            return null;
        }
        static _hitTestScrollbar(ctx, request) {
            // Is it the overview ruler?
            // Is it a child of the scrollable element?
            if (ElementPath.isChildOfScrollableElement(request.targetPath)) {
                const possibleLineNumber = ctx.getLineNumberAtVerticalOffset(request.mouseVerticalOffset);
                const maxColumn = ctx.viewModel.getLineMaxColumn(possibleLineNumber);
                return request.fulfillScrollbar(new position_1.Position(possibleLineNumber, maxColumn));
            }
            return null;
        }
        getMouseColumn(relativePos) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const mouseContentHorizontalOffset = this._context.viewLayout.getCurrentScrollLeft() + relativePos.x - layoutInfo.contentLeft;
            return MouseTargetFactory._getMouseColumn(mouseContentHorizontalOffset, options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth);
        }
        static _getMouseColumn(mouseContentHorizontalOffset, typicalHalfwidthCharacterWidth) {
            if (mouseContentHorizontalOffset < 0) {
                return 1;
            }
            const chars = Math.round(mouseContentHorizontalOffset / typicalHalfwidthCharacterWidth);
            return (chars + 1);
        }
        static createMouseTargetFromHitTestPosition(ctx, request, spanNode, pos, injectedText) {
            const lineNumber = pos.lineNumber;
            const column = pos.column;
            const lineWidth = ctx.getLineWidth(lineNumber);
            if (request.mouseContentHorizontalOffset > lineWidth) {
                const detail = createEmptyContentDataInLines(request.mouseContentHorizontalOffset - lineWidth);
                return request.fulfillContentEmpty(pos, detail);
            }
            const visibleRange = ctx.visibleRangeForPosition(lineNumber, column);
            if (!visibleRange) {
                return request.fulfillUnknown(pos);
            }
            const columnHorizontalOffset = visibleRange.left;
            if (Math.abs(request.mouseContentHorizontalOffset - columnHorizontalOffset) < 1) {
                return request.fulfillContentText(pos, null, { mightBeForeignElement: !!injectedText, injectedText });
            }
            const points = [];
            points.push({ offset: visibleRange.left, column: column });
            if (column > 1) {
                const visibleRange = ctx.visibleRangeForPosition(lineNumber, column - 1);
                if (visibleRange) {
                    points.push({ offset: visibleRange.left, column: column - 1 });
                }
            }
            const lineMaxColumn = ctx.viewModel.getLineMaxColumn(lineNumber);
            if (column < lineMaxColumn) {
                const visibleRange = ctx.visibleRangeForPosition(lineNumber, column + 1);
                if (visibleRange) {
                    points.push({ offset: visibleRange.left, column: column + 1 });
                }
            }
            points.sort((a, b) => a.offset - b.offset);
            const mouseCoordinates = request.pos.toClientCoordinates(dom.getWindow(ctx.viewDomNode));
            const spanNodeClientRect = spanNode.getBoundingClientRect();
            const mouseIsOverSpanNode = (spanNodeClientRect.left <= mouseCoordinates.clientX && mouseCoordinates.clientX <= spanNodeClientRect.right);
            let rng = null;
            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                if (prev.offset <= request.mouseContentHorizontalOffset && request.mouseContentHorizontalOffset <= curr.offset) {
                    rng = new range_1.Range(lineNumber, prev.column, lineNumber, curr.column);
                    // See https://github.com/microsoft/vscode/issues/152819
                    // Due to the use of zwj, the browser's hit test result is skewed towards the left
                    // Here we try to correct that if the mouse horizontal offset is closer to the right than the left
                    const prevDelta = Math.abs(prev.offset - request.mouseContentHorizontalOffset);
                    const nextDelta = Math.abs(curr.offset - request.mouseContentHorizontalOffset);
                    pos = (prevDelta < nextDelta
                        ? new position_1.Position(lineNumber, prev.column)
                        : new position_1.Position(lineNumber, curr.column));
                    break;
                }
            }
            return request.fulfillContentText(pos, rng, { mightBeForeignElement: !mouseIsOverSpanNode || !!injectedText, injectedText });
        }
        /**
         * Most probably WebKit browsers and Edge
         */
        static _doHitTestWithCaretRangeFromPoint(ctx, request) {
            // In Chrome, especially on Linux it is possible to click between lines,
            // so try to adjust the `hity` below so that it lands in the center of a line
            const lineNumber = ctx.getLineNumberAtVerticalOffset(request.mouseVerticalOffset);
            const lineStartVerticalOffset = ctx.getVerticalOffsetForLineNumber(lineNumber);
            const lineEndVerticalOffset = lineStartVerticalOffset + ctx.lineHeight;
            const isBelowLastLine = (lineNumber === ctx.viewModel.getLineCount()
                && request.mouseVerticalOffset > lineEndVerticalOffset);
            if (!isBelowLastLine) {
                const lineCenteredVerticalOffset = Math.floor((lineStartVerticalOffset + lineEndVerticalOffset) / 2);
                let adjustedPageY = request.pos.y + (lineCenteredVerticalOffset - request.mouseVerticalOffset);
                if (adjustedPageY <= request.editorPos.y) {
                    adjustedPageY = request.editorPos.y + 1;
                }
                if (adjustedPageY >= request.editorPos.y + request.editorPos.height) {
                    adjustedPageY = request.editorPos.y + request.editorPos.height - 1;
                }
                const adjustedPage = new editorDom_1.PageCoordinates(request.pos.x, adjustedPageY);
                const r = this._actualDoHitTestWithCaretRangeFromPoint(ctx, adjustedPage.toClientCoordinates(dom.getWindow(ctx.viewDomNode)));
                if (r.type === 1 /* HitTestResultType.Content */) {
                    return r;
                }
            }
            // Also try to hit test without the adjustment (for the edge cases that we are near the top or bottom)
            return this._actualDoHitTestWithCaretRangeFromPoint(ctx, request.pos.toClientCoordinates(dom.getWindow(ctx.viewDomNode)));
        }
        static _actualDoHitTestWithCaretRangeFromPoint(ctx, coords) {
            const shadowRoot = dom.getShadowRoot(ctx.viewDomNode);
            let range;
            if (shadowRoot) {
                if (typeof shadowRoot.caretRangeFromPoint === 'undefined') {
                    range = shadowCaretRangeFromPoint(shadowRoot, coords.clientX, coords.clientY);
                }
                else {
                    range = shadowRoot.caretRangeFromPoint(coords.clientX, coords.clientY);
                }
            }
            else {
                range = ctx.viewDomNode.ownerDocument.caretRangeFromPoint(coords.clientX, coords.clientY);
            }
            if (!range || !range.startContainer) {
                return new UnknownHitTestResult();
            }
            // Chrome always hits a TEXT_NODE, while Edge sometimes hits a token span
            const startContainer = range.startContainer;
            if (startContainer.nodeType === startContainer.TEXT_NODE) {
                // startContainer is expected to be the token text
                const parent1 = startContainer.parentNode; // expected to be the token span
                const parent2 = parent1 ? parent1.parentNode : null; // expected to be the view line container span
                const parent3 = parent2 ? parent2.parentNode : null; // expected to be the view line div
                const parent3ClassName = parent3 && parent3.nodeType === parent3.ELEMENT_NODE ? parent3.className : null;
                if (parent3ClassName === viewLine_1.ViewLine.CLASS_NAME) {
                    return HitTestResult.createFromDOMInfo(ctx, parent1, range.startOffset);
                }
                else {
                    return new UnknownHitTestResult(startContainer.parentNode);
                }
            }
            else if (startContainer.nodeType === startContainer.ELEMENT_NODE) {
                // startContainer is expected to be the token span
                const parent1 = startContainer.parentNode; // expected to be the view line container span
                const parent2 = parent1 ? parent1.parentNode : null; // expected to be the view line div
                const parent2ClassName = parent2 && parent2.nodeType === parent2.ELEMENT_NODE ? parent2.className : null;
                if (parent2ClassName === viewLine_1.ViewLine.CLASS_NAME) {
                    return HitTestResult.createFromDOMInfo(ctx, startContainer, startContainer.textContent.length);
                }
                else {
                    return new UnknownHitTestResult(startContainer);
                }
            }
            return new UnknownHitTestResult();
        }
        /**
         * Most probably Gecko
         */
        static _doHitTestWithCaretPositionFromPoint(ctx, coords) {
            const hitResult = ctx.viewDomNode.ownerDocument.caretPositionFromPoint(coords.clientX, coords.clientY);
            if (hitResult.offsetNode.nodeType === hitResult.offsetNode.TEXT_NODE) {
                // offsetNode is expected to be the token text
                const parent1 = hitResult.offsetNode.parentNode; // expected to be the token span
                const parent2 = parent1 ? parent1.parentNode : null; // expected to be the view line container span
                const parent3 = parent2 ? parent2.parentNode : null; // expected to be the view line div
                const parent3ClassName = parent3 && parent3.nodeType === parent3.ELEMENT_NODE ? parent3.className : null;
                if (parent3ClassName === viewLine_1.ViewLine.CLASS_NAME) {
                    return HitTestResult.createFromDOMInfo(ctx, hitResult.offsetNode.parentNode, hitResult.offset);
                }
                else {
                    return new UnknownHitTestResult(hitResult.offsetNode.parentNode);
                }
            }
            // For inline decorations, Gecko sometimes returns the `<span>` of the line and the offset is the `<span>` with the inline decoration
            // Some other times, it returns the `<span>` with the inline decoration
            if (hitResult.offsetNode.nodeType === hitResult.offsetNode.ELEMENT_NODE) {
                const parent1 = hitResult.offsetNode.parentNode;
                const parent1ClassName = parent1 && parent1.nodeType === parent1.ELEMENT_NODE ? parent1.className : null;
                const parent2 = parent1 ? parent1.parentNode : null;
                const parent2ClassName = parent2 && parent2.nodeType === parent2.ELEMENT_NODE ? parent2.className : null;
                if (parent1ClassName === viewLine_1.ViewLine.CLASS_NAME) {
                    // it returned the `<span>` of the line and the offset is the `<span>` with the inline decoration
                    const tokenSpan = hitResult.offsetNode.childNodes[Math.min(hitResult.offset, hitResult.offsetNode.childNodes.length - 1)];
                    if (tokenSpan) {
                        return HitTestResult.createFromDOMInfo(ctx, tokenSpan, 0);
                    }
                }
                else if (parent2ClassName === viewLine_1.ViewLine.CLASS_NAME) {
                    // it returned the `<span>` with the inline decoration
                    return HitTestResult.createFromDOMInfo(ctx, hitResult.offsetNode, 0);
                }
            }
            return new UnknownHitTestResult(hitResult.offsetNode);
        }
        static _snapToSoftTabBoundary(position, viewModel) {
            const lineContent = viewModel.getLineContent(position.lineNumber);
            const { tabSize } = viewModel.model.getOptions();
            const newPosition = cursorAtomicMoveOperations_1.AtomicTabMoveOperations.atomicPosition(lineContent, position.column - 1, tabSize, 2 /* Direction.Nearest */);
            if (newPosition !== -1) {
                return new position_1.Position(position.lineNumber, newPosition + 1);
            }
            return position;
        }
        static doHitTest(ctx, request) {
            let result = new UnknownHitTestResult();
            if (typeof ctx.viewDomNode.ownerDocument.caretRangeFromPoint === 'function') {
                result = this._doHitTestWithCaretRangeFromPoint(ctx, request);
            }
            else if (ctx.viewDomNode.ownerDocument.caretPositionFromPoint) {
                result = this._doHitTestWithCaretPositionFromPoint(ctx, request.pos.toClientCoordinates(dom.getWindow(ctx.viewDomNode)));
            }
            if (result.type === 1 /* HitTestResultType.Content */) {
                const injectedText = ctx.viewModel.getInjectedTextAt(result.position);
                const normalizedPosition = ctx.viewModel.normalizePosition(result.position, 2 /* PositionAffinity.None */);
                if (injectedText || !normalizedPosition.equals(result.position)) {
                    result = new ContentHitTestResult(normalizedPosition, result.spanNode, injectedText);
                }
            }
            return result;
        }
    }
    exports.MouseTargetFactory = MouseTargetFactory;
    function shadowCaretRangeFromPoint(shadowRoot, x, y) {
        const range = document.createRange();
        // Get the element under the point
        let el = shadowRoot.elementFromPoint(x, y);
        if (el !== null) {
            // Get the last child of the element until its firstChild is a text node
            // This assumes that the pointer is on the right of the line, out of the tokens
            // and that we want to get the offset of the last token of the line
            while (el && el.firstChild && el.firstChild.nodeType !== el.firstChild.TEXT_NODE && el.lastChild && el.lastChild.firstChild) {
                el = el.lastChild;
            }
            // Grab its rect
            const rect = el.getBoundingClientRect();
            // And its font (the computed shorthand font property might be empty, see #3217)
            const elWindow = dom.getWindow(el);
            const fontStyle = elWindow.getComputedStyle(el, null).getPropertyValue('font-style');
            const fontVariant = elWindow.getComputedStyle(el, null).getPropertyValue('font-variant');
            const fontWeight = elWindow.getComputedStyle(el, null).getPropertyValue('font-weight');
            const fontSize = elWindow.getComputedStyle(el, null).getPropertyValue('font-size');
            const lineHeight = elWindow.getComputedStyle(el, null).getPropertyValue('line-height');
            const fontFamily = elWindow.getComputedStyle(el, null).getPropertyValue('font-family');
            const font = `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}/${lineHeight} ${fontFamily}`;
            // And also its txt content
            const text = el.innerText;
            // Position the pixel cursor at the left of the element
            let pixelCursor = rect.left;
            let offset = 0;
            let step;
            // If the point is on the right of the box put the cursor after the last character
            if (x > rect.left + rect.width) {
                offset = text.length;
            }
            else {
                const charWidthReader = CharWidthReader.getInstance();
                // Goes through all the characters of the innerText, and checks if the x of the point
                // belongs to the character.
                for (let i = 0; i < text.length + 1; i++) {
                    // The step is half the width of the character
                    step = charWidthReader.getCharWidth(text.charAt(i), font) / 2;
                    // Move to the center of the character
                    pixelCursor += step;
                    // If the x of the point is smaller that the position of the cursor, the point is over that character
                    if (x < pixelCursor) {
                        offset = i;
                        break;
                    }
                    // Move between the current character and the next
                    pixelCursor += step;
                }
            }
            // Creates a range with the text node of the element and set the offset found
            range.setStart(el.firstChild, offset);
            range.setEnd(el.firstChild, offset);
        }
        return range;
    }
    class CharWidthReader {
        static { this._INSTANCE = null; }
        static getInstance() {
            if (!CharWidthReader._INSTANCE) {
                CharWidthReader._INSTANCE = new CharWidthReader();
            }
            return CharWidthReader._INSTANCE;
        }
        constructor() {
            this._cache = {};
            this._canvas = document.createElement('canvas');
        }
        getCharWidth(char, font) {
            const cacheKey = char + font;
            if (this._cache[cacheKey]) {
                return this._cache[cacheKey];
            }
            const context = this._canvas.getContext('2d');
            context.font = font;
            const metrics = context.measureText(char);
            const width = metrics.width;
            this._cache[cacheKey] = width;
            return width;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW91c2VUYXJnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9jb250cm9sbGVyL21vdXNlVGFyZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNCaEcsSUFBVyxpQkFHVjtJQUhELFdBQVcsaUJBQWlCO1FBQzNCLCtEQUFPLENBQUE7UUFDUCwrREFBTyxDQUFBO0lBQ1IsQ0FBQyxFQUhVLGlCQUFpQixLQUFqQixpQkFBaUIsUUFHM0I7SUFFRCxNQUFNLG9CQUFvQjtRQUV6QixZQUNVLFlBQWdDLElBQUk7WUFBcEMsY0FBUyxHQUFULFNBQVMsQ0FBMkI7WUFGckMsU0FBSSxxQ0FBNkI7UUFHdEMsQ0FBQztLQUNMO0lBRUQsTUFBTSxvQkFBb0I7UUFHekIsSUFBSSxTQUFTLEtBQWtCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFFdEQsWUFDVSxRQUFrQixFQUNsQixRQUFxQixFQUNyQixZQUFpQztZQUZqQyxhQUFRLEdBQVIsUUFBUSxDQUFVO1lBQ2xCLGFBQVEsR0FBUixRQUFRLENBQWE7WUFDckIsaUJBQVksR0FBWixZQUFZLENBQXFCO1lBUGxDLFNBQUkscUNBQTZCO1FBUXRDLENBQUM7S0FDTDtJQUlELElBQVUsYUFBYSxDQVF0QjtJQVJELFdBQVUsYUFBYTtRQUN0QixTQUFnQixpQkFBaUIsQ0FBQyxHQUFtQixFQUFFLFFBQXFCLEVBQUUsTUFBYztZQUMzRixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsc0JBQXNCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzlELElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxJQUFJLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0Qs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