/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/view/renderingContext"], function (require, exports, renderingContext_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangeUtil = void 0;
    class RangeUtil {
        static _createRange() {
            if (!this._handyReadyRange) {
                this._handyReadyRange = document.createRange();
            }
            return this._handyReadyRange;
        }
        static _detachRange(range, endNode) {
            // Move range out of the span node, IE doesn't like having many ranges in
            // the same spot and will act badly for lines containing dashes ('-')
            range.selectNodeContents(endNode);
        }
        static _readClientRects(startElement, startOffset, endElement, endOffset, endNode) {
            const range = this._createRange();
            try {
                range.setStart(startElement, startOffset);
                range.setEnd(endElement, endOffset);
                return range.getClientRects();
            }
            catch (e) {
                // This is life ...
                return null;
            }
            finally {
                this._detachRange(range, endNode);
            }
        }
        static _mergeAdjacentRanges(ranges) {
            if (ranges.length === 1) {
                // There is nothing to merge
                return ranges;
            }
            ranges.sort(renderingContext_1.FloatHorizontalRange.compare);
            const result = [];
            let resultLen = 0;
            let prev = ranges[0];
            for (let i = 1, len = ranges.length; i < len; i++) {
                const range = ranges[i];
                if (prev.left + prev.width + 0.9 /* account for browser's rounding errors*/ >= range.left) {
                    prev.width = Math.max(prev.width, range.left + range.width - prev.left);
                }
                else {
                    result[resultLen++] = prev;
                    prev = range;
                }
            }
            result[resultLen++] = prev;
            return result;
        }
        static _createHorizontalRangesFromClientRects(clientRects, clientRectDeltaLeft, clientRectScale) {
            if (!clientRects || clientRects.length === 0) {
                return null;
            }
            // We go through FloatHorizontalRange because it has been observed in bi-di text
            // that the clientRects are not coming in sorted from the browser
            const result = [];
            for (let i = 0, len = clientRects.length; i < len; i++) {
                const clientRect = clientRects[i];
                result[i] = new renderingContext_1.FloatHorizontalRange(Math.max(0, (clientRect.left - clientRectDeltaLeft) / clientRectScale), clientRect.width / clientRectScale);
            }
            return this._mergeAdjacentRanges(result);
        }
        static readHorizontalRanges(domNode, startChildIndex, startOffset, endChildIndex, endOffset, context) {
            // Panic check
            const min = 0;
            const max = domNode.children.length - 1;
            if (min > max) {
                return null;
            }
            startChildIndex = Math.min(max, Math.max(min, startChildIndex));
            endChildIndex = Math.min(max, Math.max(min, endChildIndex));
            if (startChildIndex === endChildIndex && startOffset === endOffset && startOffset === 0 && !domNode.children[startChildIndex].firstChild) {
                // We must find the position at the beginning of a <span>
                // To cover cases of empty <span>s, avoid using a range and use the <span>'s bounding box
                const clientRects = domNode.children[startChildIndex].getClientRects();
                context.markDidDomLayout();
                return this._createHorizontalRangesFromClientRects(clientRects, context.clientRectDeltaLeft, context.clientRectScale);
            }
            // If crossing over to a span only to select offset 0, then use the previous span's maximum offset
            // Chrome is buggy and doesn't handle 0 offsets well sometimes.
            if (startChildIndex !== endChildIndex) {
                if (endChildIndex > 0 && endOffset === 0) {
                    endChildIndex--;
                    endOffset = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
                }
            }
            let startElement = domNode.children[startChildIndex].firstChild;
            let endElement = domNode.children[endChildIndex].firstChild;
            if (!startElement || !endElement) {
                // When having an empty <span> (without any text content), try to move to the previous <span>
                if (!startElement && startOffset === 0 && startChildIndex > 0) {
                    startElement = domNode.children[startChildIndex - 1].firstChild;
                    startOffset = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
                }
                if (!endElement && endOffset === 0 && endChildIndex > 0) {
                    endElement = domNode.children[endChildIndex - 1].firstChild;
                    endOffset = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
                }
            }
            if (!startElement || !endElement) {
                return null;
            }
            startOffset = Math.min(startElement.textContent.length, Math.max(0, startOffset));
            endOffset = Math.min(endElement.textContent.length, Math.max(0, endOffset));
            const clientRects = this._readClientRects(startElement, startOffset, endElement, endOffset, context.endNode);
            context.markDidDomLayout();
            return this._createHorizontalRangesFromClientRects(clientRects, context.clientRectDeltaLeft, context.clientRectScale);
        }
    }
    exports.RangeUtil = RangeUtil;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2VVdGlsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL2xpbmVzL3JhbmdlVXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxTQUFTO1FBU2IsTUFBTSxDQUFDLFlBQVk7WUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2hELENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixDQUFDO1FBRU8sTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFZLEVBQUUsT0FBb0I7WUFDN0QseUVBQXlFO1lBQ3pFLHFFQUFxRTtZQUNyRSxLQUFLLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVPLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFrQixFQUFFLFdBQW1CLEVBQUUsVUFBZ0IsRUFBRSxTQUFpQixFQUFFLE9BQW9CO1lBQ2pJLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUM7Z0JBQ0osS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQzFDLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUVwQyxPQUFPLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUMvQixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixtQkFBbUI7Z0JBQ25CLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLElB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