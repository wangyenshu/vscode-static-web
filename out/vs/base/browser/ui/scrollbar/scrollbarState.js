/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScrollbarState = void 0;
    /**
     * The minimal size of the slider (such that it can still be clickable) -- it is artificially enlarged.
     */
    const MINIMUM_SLIDER_SIZE = 20;
    class ScrollbarState {
        constructor(arrowSize, scrollbarSize, oppositeScrollbarSize, visibleSize, scrollSize, scrollPosition) {
            this._scrollbarSize = Math.round(scrollbarSize);
            this._oppositeScrollbarSize = Math.round(oppositeScrollbarSize);
            this._arrowSize = Math.round(arrowSize);
            this._visibleSize = visibleSize;
            this._scrollSize = scrollSize;
            this._scrollPosition = scrollPosition;
            this._computedAvailableSize = 0;
            this._computedIsNeeded = false;
            this._computedSliderSize = 0;
            this._computedSliderRatio = 0;
            this._computedSliderPosition = 0;
            this._refreshComputedValues();
        }
        clone() {
            return new ScrollbarState(this._arrowSize, this._scrollbarSize, this._oppositeScrollbarSize, this._visibleSize, this._scrollSize, this._scrollPosition);
        }
        setVisibleSize(visibleSize) {
            const iVisibleSize = Math.round(visibleSize);
            if (this._visibleSize !== iVisibleSize) {
                this._visibleSize = iVisibleSize;
                this._refreshComputedValues();
                return true;
            }
            return false;
        }
        setScrollSize(scrollSize) {
            const iScrollSize = Math.round(scrollSize);
            if (this._scrollSize !== iScrollSize) {
                this._scrollSize = iScrollSize;
                this._refreshComputedValues();
                return true;
            }
            return false;
        }
        setScrollPosition(scrollPosition) {
            const iScrollPosition = Math.round(scrollPosition);
            if (this._scrollPosition !== iScrollPosition) {
                this._scrollPosition = iScrollPosition;
                this._refreshComputedValues();
                return true;
            }
            return false;
        }
        setScrollbarSize(scrollbarSize) {
            this._scrollbarSize = Math.round(scrollbarSize);
        }
        setOppositeScrollbarSize(oppositeScrollbarSize) {
            this._oppositeScrollbarSize = Math.round(oppositeScrollbarSize);
        }
        static _computeValues(oppositeScrollbarSize, arrowSize, visibleSize, scrollSize, scrollPosition) {
            const computedAvailableSize = Math.max(0, visibleSize - oppositeScrollbarSize);
            const computedRepresentableSize = Math.max(0, computedAvailableSize - 2 * arrowSize);
            const computedIsNeeded = (scrollSize > 0 && scrollSize > visibleSize);
            if (!computedIsNeeded) {
                // There is no need for a slider
                return {
                    computedAvailableSize: Math.round(computedAvailableSize),
                    computedIsNeeded: computedIsNeeded,
                    computedSliderSize: Math.round(computedRepresentableSize),
                    computedSliderRatio: 0,
                    computedSliderPosition: 0,
                };
            }
            // We must artificially increase the size of the slider if needed, since the slider would be too small to grab with the mouse otherwise
            const computedSliderSize = Math.round(Math.max(MINIMUM_SLIDER_SIZE, Math.floor(visibleSize * computedRepresentableSize / scrollSize)));
            // The slider can move from 0 to `computedRepresentableSize` - `computedSliderSize`
            // in the same way `scrollPosition` can move from 0 to `scrollSize` - `visibleSize`.
            const computedSliderRatio = (computedRepresentableSize - computedSliderSize) / (scrollSize - visibleSize);
            const computedSliderPosition = (scrollPosition * computedSliderRatio);
            return {
                computedAvailableSize: Math.round(computedAvailableSize),
                computedIsNeeded: computedIsNeeded,
                computedSliderSize: Math.round(computedSliderSize),
                computedSliderRatio: computedSliderRatio,
                computedSliderPosition: Math.round(computedSliderPosition),
            };
        }
        _refreshComputedValues() {
            const r = ScrollbarState._computeValues(this._oppositeScrollbarSize, this._arrowSize, this._visibleSize, this._scrollSize, this._scrollPosition);
            this._computedAvailableSize = r.computedAvailableSize;
            this._computedIsNeeded = r.computedIsNeeded;
            this._computedSliderSize = r.computedSliderSize;
            this._computedSliderRatio = r.computedSliderRatio;
            this._computedSliderPosition = r.computedSliderPosition;
        }
        getArrowSize() {
            return this._arrowSize;
        }
        getScrollPosition() {
            return this._scrollPosition;
        }
        getRectangleLargeSize() {
            return this._computedAvailableSize;
        }
        getRectangleSmallSize() {
            return this._scrollbarSize;
        }
        isNeeded() {
            return this._computedIsNeeded;
        }
        getSliderSize() {
            return this._computedSliderSize;
        }
        getSliderPosition() {
            return this._computedSliderPosition;
        }
        /**
         * Compute a desired `scrollPosition` such that `offset` ends up in the center of the slider.
         * `offset` is based on the same coordinate system as the `sliderPosition`.
         */
        getDesiredScrollPositionFromOffset(offset) {
            if (!this._computedIsNeeded) {
                // no need for a slider
                return 0;
            }
            const desiredSliderPosition = offset - this._arrowSize - this._computedSliderSize / 2;
            return Math.round(desiredSliderPosition / this._computedSliderRatio);
        }
        /**
         * Compute a desired `scrollPosition` from if offset is before or after the slider position.
         * If offset is before slider, treat as a page up (or left).  If after, page down (or right).
         * `offset` and `_computedSliderPosition` are based on the same coordinate system.
         * `_visibleSize` corresponds to a "page" of lines in the returned coordinate system.
         */
        getDesiredScrollPositionFromOffsetPaged(offset) {
            if (!this._computedIsNeeded) {
                // no need for a slider
                return 0;
            }
            const correctedOffset = offset - this._arrowSize; // compensate if has arrows
            let desiredScrollPosition = this._scrollPosition;
            if (correctedOffset < this._computedSliderPosition) {
                desiredScrollPosition -= this._visibleSize; // page up/left
            }
            else {
                desiredScrollPosition += this._visibleSize; // page down/right
            }
            return desiredScrollPosition;
        }
        /**
         * Compute a desired `scrollPosition` such that the slider moves by `delta`.
         */
        getDesiredScrollPositionFromDelta(delta) {
            if (!this._computedIsNeeded) {
                // no need for a slider
                return 0;
            }
            const desiredSliderPosition = this._computedSliderPosition + delta;
            return Math.round(desiredSliderPosition / this._computedSliderRatio);
        }
    }
    exports.ScrollbarState = ScrollbarState;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYmFyU3RhdGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvc2Nyb2xsYmFyL3Njcm9sbGJhclN0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVoRzs7T0FFRztJQUNILE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0lBRS9CLE1BQWEsY0FBYztRQXNEMUIsWUFBWSxTQUFpQixFQUFFLGFBQXFCLEVBQUUscUJBQTZCLEVBQUUsV0FBbUIsRUFBRSxVQUFrQixFQUFFLGNBQXNCO1lBQ25KLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNoRCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUV4QyxJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztZQUNoQyxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5QixJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztZQUV0QyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7WUFDL0IsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxDQUFDLENBQUM7WUFFakMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUVNLEtBQUs7WUFDWCxPQUFP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