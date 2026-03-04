/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/view/dynamicViewOverlay", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./selections"], function (require, exports, dynamicViewOverlay_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionsOverlay = void 0;
    var CornerStyle;
    (function (CornerStyle) {
        CornerStyle[CornerStyle["EXTERN"] = 0] = "EXTERN";
        CornerStyle[CornerStyle["INTERN"] = 1] = "INTERN";
        CornerStyle[CornerStyle["FLAT"] = 2] = "FLAT";
    })(CornerStyle || (CornerStyle = {}));
    class HorizontalRangeWithStyle {
        constructor(other) {
            this.left = other.left;
            this.width = other.width;
            this.startStyle = null;
            this.endStyle = null;
        }
    }
    class LineVisibleRangesWithStyle {
        constructor(lineNumber, ranges) {
            this.lineNumber = lineNumber;
            this.ranges = ranges;
        }
    }
    function toStyledRange(item) {
        return new HorizontalRangeWithStyle(item);
    }
    function toStyled(item) {
        return new LineVisibleRangesWithStyle(item.lineNumber, item.ranges.map(toStyledRange));
    }
    class SelectionsOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        static { this.SELECTION_CLASS_NAME = 'selected-text'; }
        static { this.SELECTION_TOP_LEFT = 'top-left-radius'; }
        static { this.SELECTION_BOTTOM_LEFT = 'bottom-left-radius'; }
        static { this.SELECTION_TOP_RIGHT = 'top-right-radius'; }
        static { this.SELECTION_BOTTOM_RIGHT = 'bottom-right-radius'; }
        static { this.EDITOR_BACKGROUND_CLASS_NAME = 'monaco-editor-background'; }
        static { this.ROUNDED_PIECE_WIDTH = 10; }
        constructor(context) {
            super();
            this._previousFrameVisibleRangesWithStyle = [];
            this._context = context;
            const options = this._context.configuration.options;
            this._roundedSelection = options.get(101 /* EditorOption.roundedSelection */);
            this._typicalHalfwidthCharacterWidth = options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth;
            this._selections = [];
            this._renderResult = null;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            this._renderResult = null;
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            this._roundedSelection = options.get(101 /* EditorOption.roundedSelection */);
            this._typicalHalfwidthCharacterWidth = options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth;
            return true;
        }
        onCursorStateChanged(e) {
            this._selections = e.selections.slice(0);
            return true;
        }
        onDecorationsChanged(e) {
            // true for inline decorations that can end up relayouting text
            return true; //e.inlineDecorationsChanged;
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
        _visibleRangesHaveGaps(linesVisibleRanges) {
            for (let i = 0, len = linesVisibleRanges.length; i < len; i++) {
                const lineVisibleRanges = linesVisibleRanges[i];
                if (lineVisibleRanges.ranges.length > 1) {
                    // There are two ranges on the same line
                    return true;
                }
            }
            return false;
        }
        _enrichVisibleRangesWithStyle(viewport, linesVisibleRanges, previousFrame) {
            const epsilon = this._typicalHalfwidthCharacterWidth / 4;
            let previousFrameTop = null;
            let previousFrameBottom = null;
            if (previousFrame && previousFrame.length > 0 && linesVisibleRanges.length > 0) {
                const topLineNumber = linesVisibleRanges[0].lineNumber;
                if (topLineNumber === viewport.startLineNumber) {
                    for (let i = 0; !previousFrameTop && i < previousFrame.length; i++) {
                        if (previousFrame[i].lineNumber === topLineNumber) {
                            previousFrameTop = previousFrame[i].ranges[0];
                        }
                    }
                }
                const bottomLineNumber = linesVisibleRanges[linesVisibleRanges.length - 1].lineNumber;
                if (bottomLineNumber === viewport.endLineNumber) {
                    for (let i = previousFrame.length - 1; !previousFrameBottom && i >= 0; i--) {
                        if (previousFrame[i].lineNumber === bottomLineNumber) {
                            previousFrameBottom = previousFrame[i].ranges[0];
                        }
                    }
                }
                if (previousFrameTop && !previousFrameTop.startStyle) {
                    previousFrameTop = null;
                }
                if (previousFrameBottom && !previousFrameBottom.startStyle) {
                    previousFrameBottom = null;
                }
            }
            for (let i = 0, len = linesVisibleRanges.length; i < len; i++) {
                // We know for a fact that there is precisely one range on each line
                const curLineRange = linesVisibleRanges[i].ranges[0];
                const curLeft = curLineRange.left;
                const curRight = curLineRange.left + curLineRange.width;
                const startStyle = {
                    top: 0 /* CornerStyle.EXTERN */,
                    bottom: 0 /* CornerStyle.EXTERN */
                };
                const endStyle = {
                    top: 0 /* CornerStyle.EXTERN */,
                    bottom: 0 /* CornerStyle.EXTERN */
                };
                if (i > 0) {
                    // Look above
                    const prevLeft = linesVisibleRanges[i - 1].ranges[0].left;
                    const prevRight = linesVisibleRanges[i - 1].ranges[0].left + linesVisibleRanges[i - 1].ranges[0].width;
                    if (abs(curLeft - prevLeft) < epsilon) {
                        startStyle.top = 2 /* CornerStyle.FLAT */;
                    }
                    else if (curLeft > prevLeft) {
                        startStyle.top = 1 /* CornerStyle.INTERN */;
                    }
                    if (abs(curRight - prevRight) < epsilon) {
                        endStyle.top = 2 /* CornerStyle.FLAT */;
                    }
                    else if (prevLeft < curRight && curRight < prevRight) {
                        endStyle.top = 1 /* CornerStyle.INTERN */;
                    }
                }
                else if (previousFrameTop) {
                    // Accept some hiccups near the viewport edges to save on repaints
                    startStyle.top = previousFrameTop.startStyle.top;
                    endStyle.top = previousFrameTop.endStyle.top;
                }
                if (i + 1 < len) {
                    // Look below
                    const nextLeft = linesVisibleRanges[i + 1].ranges[0].left;
                    const nextRight = linesVisibleRanges[i + 1].ranges[0].left + linesVisibleRanges[i + 1].ranges[0].width;
                    if (abs(curLeft - nextLeft) < epsilon) {
                        startStyle.bottom = 2 /* CornerStyle.FLAT */;
                    }
                    else if (nextLeft < curLeft && curLeft < nextRight) {
                        startStyle.bottom = 1 /* CornerStyle.INTERN */;
                    }
                    if (abs(curRight - nextRight) < epsilon) {
                        endStyle.bottom = 2 /* CornerStyle.FLAT */;
                    }
                    else if (curRight < nextRight) {
                        endStyle.bottom = 1 /* CornerStyle.INTERN */;
                    }
                }
                else if (previousFrameBottom) {
                    // Accept some hiccups near the viewport edges to save on repaints
                    startStyle.bottom = previousFrameBottom.startStyle.bottom;
                    endStyle.bottom = previousFrameBottom.endStyle.bottom;
                }
                curLineRange.startStyle = startStyle;
                curLineRange.endStyle = endStyle;
            }
        }
        _getVisibleRangesWithStyle(selection, ctx, previousFrame) {
            const _linesVisibleRanges = ctx.linesVisibleRangesForRange(selection, true) || [];
            const linesVisibleRanges = _linesVisibleRanges.map(toStyled);
            const visibleRangesHaveGaps = this._visibleRangesHaveGaps(linesVisibleRanges);
            if (!visibleRangesHaveGaps && this._roundedSelection) {
                this._enrichVisibleRangesWithStyle(ctx.visibleRange, linesVisibleRanges, previousFrame);
            }
            // The visible ranges are sorted TOP-BOTTOM and LEFT-RIGHT
            return linesVisibleRanges;
        }
        _createSelectionPiece(top, bottom, className, left, width) {
            return ('<div class="cslr '
                + className
                + '" style="'
                + 'top:' + top.toString() + 'px;'
                + 'bottom:' + bottom.toString() + 'px;'
                + 'left:' + left.toString() + 'px;'
                + 'width:' + width.toString() + 'px;'
                + '"></div>');
        }
        _actualRenderOneSelection(output2, visibleStartLineNumber, hasMultipleSelections, visibleRanges) {
            if (visibleRanges.length === 0) {
                return;
            }
            const visibleRangesHaveStyle = !!visibleRanges[0].ranges[0].startStyle;
            const firstLineNumber = visibleRanges[0].lineNumber;
            const lastLineNumber = visibleRanges[visibleRanges.length - 1].lineNumber;
            for (let i = 0, len = visibleRanges.length; i < len; i++) {
                const lineVisibleRanges = visibleRanges[i];
                const lineNumber = lineVisibleRanges.lineNumber;
                const lineIndex = lineNumber - visibleStartLineNumber;
                const top = hasMultipleSelections ? (lineNumber === firstLineNumber ? 1 : 0) : 0;
                const bottom = hasMultipleSelections ? (lineNumber !== firstLineNumber && lineNumber === lastLineNumber ? 1 : 0) : 0;
                let innerCornerOutput = '';
                let restOfSelectionOutput = '';
                for (let j = 0, lenJ = lineVisibleRanges.ranges.length; j < lenJ; j++) {
                    const visibleRange = lineVisibleRanges.ranges[j];
                    if (visibleRangesHaveStyle) {
                        const startStyle = visibleRange.startStyle;
                        const endStyle = visibleRange.endStyle;
                        if (startStyle.top === 1 /* CornerStyle.INTERN */ || startStyle.bottom === 1 /* CornerStyle.INTERN */) {
                            // Reverse rounded corner to the left
                            // First comes the selection (blue layer)
                            innerCornerOutput += this._createSelectionPiece(top, bottom, SelectionsOverlay.SELECTION_CLASS_NAME, visibleRange.left - SelectionsOverlay.ROUNDED_PIECE_WIDTH, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                            // Second comes the background (white layer) with inverse border radius
                            let className = SelectionsOverlay.EDITOR_BACKGROUND_CLASS_NAME;
                            if (startStyle.top === 1 /* CornerStyle.INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_TOP_RIGHT;
                            }
                            if (startStyle.bottom === 1 /* CornerStyle.INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_RIGHT;
                            }
                            innerCornerOutput += this._createSelectionPiece(top, bottom, className, visibleRange.left - SelectionsOverlay.ROUNDED_PIECE_WIDTH, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                        }
                        if (endStyle.top === 1 /* CornerStyle.INTERN */ || endStyle.bottom === 1 /* CornerStyle.INTERN */) {
                            // Reverse rounded corner to the right
                            // First comes the selection (blue layer)
                            innerCornerOutput += this._createSelectionPiece(top, bottom, SelectionsOverlay.SELECTION_CLASS_NAME, visibleRange.left + visibleRange.width, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                            // Second comes the background (white layer) with inverse border radius
                            let className = SelectionsOverlay.EDITOR_BACKGROUND_CLASS_NAME;
                            if (endStyle.top === 1 /* CornerStyle.INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_TOP_LEFT;
                            }
                            if (endStyle.bottom === 1 /* CornerStyle.INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_LEFT;
                            }
                            innerCornerOutput += this._createSelectionPiece(top, bottom, className, visibleRange.left + visibleRange.width, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                        }
                    }
                    let className = SelectionsOverlay.SELECTION_CLASS_NAME;
                    if (visibleRangesHaveStyle) {
                        const startStyle = visibleRange.startStyle;
                        const endStyle = visibleRange.endStyle;
                        if (startStyle.top === 0 /* CornerStyle.EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_TOP_LEFT;
                        }
                        if (startStyle.bottom === 0 /* CornerStyle.EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_LEFT;
                        }
                        if (endStyle.top === 0 /* CornerStyle.EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_TOP_RIGHT;
                        }
                        if (endStyle.bottom === 0 /* CornerStyle.EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_RIGHT;
                        }
                    }
                    restOfSelectionOutput += this._createSelectionPiece(top, bottom, className, visibleRange.left, visibleRange.width);
                }
                output2[lineIndex][0] += innerCornerOutput;
                output2[lineIndex][1] += restOfSelectionOutput;
            }
        }
        prepareRender(ctx) {
            // Build HTML for inner corners separate from HTML for the rest of selections,
            // as the inner corner HTML can interfere with that of other selections.
            // In final render, make sure to place the inner corner HTML before the rest of selection HTML. See issue #77777.
            const output = [];
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                output[lineIndex] = ['', ''];
            }
            const thisFrameVisibleRangesWithStyle = [];
            for (let i = 0, len = this._selections.length; i < len; i++) {
                const selection = this._selections[i];
                if (selection.isEmpty()) {
                    thisFrameVisibleRangesWithStyle[i] = null;
                    continue;
                }
                const visibleRangesWithStyle = this._getVisibleRangesWithStyle(selection, ctx, this._previousFrameVisibleRangesWithStyle[i]);
                thisFrameVisibleRangesWithStyle[i] = visibleRangesWithStyle;
                this._actualRenderOneSelection(output, visibleStartLineNumber, this._selections.length > 1, visibleRangesWithStyle);
            }
            this._previousFrameVisibleRangesWithStyle = thisFrameVisibleRangesWithStyle;
            this._renderResult = output.map(([internalCorners, restOfSelection]) => internalCorners + restOfSelection);
        }
        render(startLineNumber, lineNumber) {
            if (!this._renderResult) {
                return '';
            }
            const lineIndex = lineNumber - startLineNumber;
            if (lineIndex < 0 || lineIndex >= this._renderResult.length) {
                return '';
            }
            return this._renderResult[lineIndex];
        }
    }
    exports.SelectionsOverlay = SelectionsOverlay;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const editorSelectionForegroundColor = theme.getColor(colorRegistry_1.editorSelectionForeground);
        if (editorSelectionForegroundColor && !editorSelectionForegroundColor.isTransparent()) {
            collector.addRule(`.monaco-editor .view-line span.inline-selected-text { color: ${editorSelectionForegroundColor}; }`);
        }
    });
    function abs(n) {
        return n < 0 ? -n : n;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9zZWxlY3Rpb25zL3NlbGVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLElBQVcsV0FJVjtJQUpELFdBQVcsV0FBVztRQUNyQixpREFBTSxDQUFBO1FBQ04saURBQU0sQ0FBQTtRQUNOLDZDQUFJLENBQUE7SUFDTCxDQUFDLEVBSlUsV0FBVyxLQUFYLFdBQVcsUUFJckI7SUFPRCxNQUFNLHdCQUF3QjtRQU03QixZQUFZLEtBQXNCO1lBQ2pDLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztZQUN2QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFDekIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDdEIsQ0FBQztLQUNEO0lBRUQsTUFBTSwwQkFBMEI7UUFJL0IsWUFBWSxVQUFrQixFQUFFLE1BQWtDO1lBQ2pFLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3RCLENBQUM7S0FDRDtJQUVELFNBQVMsYUFBYSxDQUFDLElBQXFCO1FBQzNDLE9BQU8sSUFBSSx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsU0FBUyxRQUFRLENBQUMsSUFBdUI7UUFDeEMsT0FBTyxJQUFJLDBCQUEwQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUN4RixDQUFDO0lB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