/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SmoothScrollingOperation = exports.SmoothScrollingUpdate = exports.Scrollable = exports.ScrollState = exports.ScrollbarVisibility = void 0;
    var ScrollbarVisibility;
    (function (ScrollbarVisibility) {
        ScrollbarVisibility[ScrollbarVisibility["Auto"] = 1] = "Auto";
        ScrollbarVisibility[ScrollbarVisibility["Hidden"] = 2] = "Hidden";
        ScrollbarVisibility[ScrollbarVisibility["Visible"] = 3] = "Visible";
    })(ScrollbarVisibility || (exports.ScrollbarVisibility = ScrollbarVisibility = {}));
    class ScrollState {
        constructor(_forceIntegerValues, width, scrollWidth, scrollLeft, height, scrollHeight, scrollTop) {
            this._forceIntegerValues = _forceIntegerValues;
            this._scrollStateBrand = undefined;
            if (this._forceIntegerValues) {
                width = width | 0;
                scrollWidth = scrollWidth | 0;
                scrollLeft = scrollLeft | 0;
                height = height | 0;
                scrollHeight = scrollHeight | 0;
                scrollTop = scrollTop | 0;
            }
            this.rawScrollLeft = scrollLeft; // before validation
            this.rawScrollTop = scrollTop; // before validation
            if (width < 0) {
                width = 0;
            }
            if (scrollLeft + width > scrollWidth) {
                scrollLeft = scrollWidth - width;
            }
            if (scrollLeft < 0) {
                scrollLeft = 0;
            }
            if (height < 0) {
                height = 0;
            }
            if (scrollTop + height > scrollHeight) {
                scrollTop = scrollHeight - height;
            }
            if (scrollTop < 0) {
                scrollTop = 0;
            }
            this.width = width;
            this.scrollWidth = scrollWidth;
            this.scrollLeft = scrollLeft;
            this.height = height;
            this.scrollHeight = scrollHeight;
            this.scrollTop = scrollTop;
        }
        equals(other) {
            return (this.rawScrollLeft === other.rawScrollLeft
                && this.rawScrollTop === other.rawScrollTop
                && this.width === other.width
                && this.scrollWidth === other.scrollWidth
                && this.scrollLeft === other.scrollLeft
                && this.height === other.height
                && this.scrollHeight === other.scrollHeight
                && this.scrollTop === other.scrollTop);
        }
        withScrollDimensions(update, useRawScrollPositions) {
            return new ScrollState(this._forceIntegerValues, (typeof update.width !== 'undefined' ? update.width : this.width), (typeof update.scrollWidth !== 'undefined' ? update.scrollWidth : this.scrollWidth), useRawScrollPositions ? this.rawScrollLeft : this.scrollLeft, (typeof update.height !== 'undefined' ? update.height : this.height), (typeof update.scrollHeight !== 'undefined' ? update.scrollHeight : this.scrollHeight), useRawScrollPositions ? this.rawScrollTop : this.scrollTop);
        }
        withScrollPosition(update) {
            return new ScrollState(this._forceIntegerValues, this.width, this.scrollWidth, (typeof update.scrollLeft !== 'undefined' ? update.scrollLeft : this.rawScrollLeft), this.height, this.scrollHeight, (typeof update.scrollTop !== 'undefined' ? update.scrollTop : this.rawScrollTop));
        }
        createScrollEvent(previous, inSmoothScrolling) {
            const widthChanged = (this.width !== previous.width);
            const scrollWidthChanged = (this.scrollWidth !== previous.scrollWidth);
            const scrollLeftChanged = (this.scrollLeft !== previous.scrollLeft);
            const heightChanged = (this.height !== previous.height);
            const scrollHeightChanged = (this.scrollHeight !== previous.scrollHeight);
            const scrollTopChanged = (this.scrollTop !== previous.scrollTop);
            return {
                inSmoothScrolling: inSmoothScrolling,
                oldWidth: previous.width,
                oldScrollWidth: previous.scrollWidth,
                oldScrollLeft: previous.scrollLeft,
                width: this.width,
                scrollWidth: this.scrollWidth,
                scrollLeft: this.scrollLeft,
                oldHeight: previous.height,
                oldScrollHeight: previous.scrollHeight,
                oldScrollTop: previous.scrollTop,
                height: this.height,
                scrollHeight: this.scrollHeight,
                scrollTop: this.scrollTop,
                widthChanged: widthChanged,
                scrollWidthChanged: scrollWidthChanged,
                scrollLeftChanged: scrollLeftChanged,
                heightChanged: heightChanged,
                scrollHeightChanged: scrollHeightChanged,
                scrollTopChanged: scrollTopChanged,
            };
        }
    }
    exports.ScrollState = ScrollState;
    class Scrollable extends lifecycle_1.Disposable {
        constructor(options) {
            super();
            this._scrollableBrand = undefined;
            this._onScroll = this._register(new event_1.Emitter());
            this.onScroll = this._onScroll.event;
            this._smoothScrollDuration = options.smoothScrollDuration;
            this._scheduleAtNextAnimationFrame = options.scheduleAtNextAnimationFrame;
            this._state = new ScrollState(options.forceIntegerValues, 0, 0, 0, 0, 0, 0);
            this._smoothScrolling = null;
        }
        dispose() {
            if (this._smoothScrolling) {
                this._smoothScrolling.dispose();
                this._smoothScrolling = null;
            }
            super.dispose();
        }
        setSmoothScrollDuration(smoothScrollDuration) {
            this._smoothScrollDuration = smoothScrollDuration;
        }
        validateScrollPosition(scrollPosition) {
            return this._state.withScrollPosition(scrollPosition);
        }
        getScrollDimensions() {
            return this._state;
        }
        setScrollDimensions(dimensions, useRawScrollPositions) {
            const newState = this._state.withScrollDimensions(dimensions, useRawScrollPositions);
            this._setState(newState, Boolean(this._smoothScrolling));
            // Validate outstanding animated scroll position target
            this._smoothScrolling?.acceptScrollDimensions(this._state);
        }
        /**
         * Returns the final scroll position that the instance will have once the smooth scroll animation concludes.
         * If no scroll animation is occurring, it will return the current scroll position instead.
         */
        getFutureScrollPosition() {
            if (this._smoothScrolling) {
                return this._smoothScrolling.to;
            }
            return this._state;
        }
        /**
         * Returns the current scroll position.
         * Note: This result might be an intermediate scroll position, as there might be an ongoing smooth scroll animation.
         */
        getCurrentScrollPosition() {
            return this._state;
        }
        setScrollPositionNow(update) {
            // no smooth scrolling requested
            const newState = this._state.withScrollPosition(update);
            // Terminate any outstanding smooth scrolling
            if (this._smoothScrolling) {
                this._smoothScrolling.dispose();
                this._smoothScrolling = null;
            }
            this._setState(newState, false);
        }
        setScrollPositionSmooth(update, reuseAnimation) {
            if (this._smoothScrollDuration === 0) {
                // Smooth scrolling not supported.
                return this.setScrollPositionNow(update);
            }
            if (this._smoothScrolling) {
                // Combine our pending scrollLeft/scrollTop with incoming scrollLeft/scrollTop
                update = {
                    scrollLeft: (typeof update.scrollLeft === 'undefined' ? this._smoothScrolling.to.scrollLeft : update.scrollLeft),
                    scrollTop: (typeof update.scrollTop === 'undefined' ? this._smoothScrolling.to.scrollTop : update.scrollTop)
                };
                // Validate `update`
                const validTarget = this._state.withScrollPosition(update);
                if (this._smoothScrolling.to.scrollLeft === validTarget.scrollLeft && this._smoothScrolling.to.scrollTop === validTarget.scrollTop) {
                    // No need to interrupt or extend the current animation since we're going to the same place
                    return;
                }
                let newSmoothScrolling;
                if (reuseAnimation) {
                    newSmoothScrolling = new SmoothScrollingOperation(this._smoothScrolling.from, validTarget, this._smoothScrolling.startTime, this._smoothScrolling.duration);
                }
                else {
                    newSmoothScrolling = this._smoothScrolling.combine(this._state, validTarget, this._smoothScrollDuration);
                }
                this._smoothScrolling.dispose();
                this._smoothScrolling = newSmoothScrolling;
            }
            else {
                // Validate `update`
                const validTarget = this._state.withScrollPosition(update);
                this._smoothScrolling = SmoothScrollingOperation.start(this._state, validTarget, this._smoothScrollDuration);
            }
            // Begin smooth scrolling animation
            this._smoothScrolling.animationFrameDisposable = this._scheduleAtNextAnimationFrame(() => {
                if (!this._smoothScrolling) {
                    return;
                }
                this._smoothScrolling.animationFrameDisposable = null;
                this._performSmoothScrolling();
            });
        }
        hasPendingScrollAnimation() {
            return Boolean(this._smoothScrolling);
        }
        _performSmoothScrolling() {
            if (!this._smoothScrolling) {
                return;
            }
            const update = this._smoothScrolling.tick();
            const newState = this._state.withScrollPosition(update);
            this._setState(newState, true);
            if (!this._smoothScrolling) {
                // Looks like someone canceled the smooth scrolling
                // from the scroll event handler
                return;
            }
            if (update.isDone) {
                this._smoothScrolling.dispose();
                this._smoothScrolling = null;
                return;
            }
            // Continue smooth scrolling animation
            this._smoothScrolling.animationFrameDisposable = this._scheduleAtNextAnimationFrame(() => {
                if (!this._smoothScrolling) {
                    return;
                }
                this._smoothScrolling.animationFrameDisposable = null;
                this._performSmoothScrolling();
            });
        }
        _setState(newState, inSmoothScrolling) {
            const oldState = this._state;
            if (oldState.equals(newState)) {
                // no change
                return;
            }
            this._state = newState;
            this._onScroll.fire(this._state.createScrollEvent(oldState, inSmoothScrolling));
        }
    }
    exports.Scrollable = Scrollable;
    class SmoothScrollingUpdate {
        constructor(scrollLeft, scrollTop, isDone) {
            this.scrollLeft = scrollLeft;
            this.scrollTop = scrollTop;
            this.isDone = isDone;
        }
    }
    exports.SmoothScrollingUpdate = SmoothScrollingUpdate;
    function createEaseOutCubic(from, to) {
        const delta = to - from;
        return function (completion) {
            return from + delta * easeOutCubic(completion);
        };
    }
    function createComposed(a, b, cut) {
        return function (completion) {
            if (completion < cut) {
                return a(completion / cut);
            }
            return b((completion - cut) / (1 - cut));
        };
    }
    class SmoothScrollingOperation {
        constructor(from, to, startTime, duration) {
            this.from = from;
            this.to = to;
            this.duration = duration;
            this.startTime = startTime;
            this.animationFrameDisposable = null;
            this._initAnimations();
        }
        _initAnimations() {
            this.scrollLeft = this._initAnimation(this.from.scrollLeft, this.to.scrollLeft, this.to.width);
            this.scrollTop = this._initAnimation(this.from.scrollTop, this.to.scrollTop, this.to.height);
        }
        _initAnimation(from, to, viewportSize) {
            const delta = Math.abs(from - to);
            if (delta > 2.5 * viewportSize) {
                let stop1, stop2;
                if (from < to) {
                    // scroll to 75% of the viewportSize
                    stop1 = from + 0.75 * viewportSize;
                    stop2 = to - 0.75 * viewportSize;
                }
                else {
                    stop1 = from - 0.75 * viewportSize;
                    stop2 = to + 0.75 * viewportSize;
                }
                return createComposed(createEaseOutCubic(from, stop1), createEaseOutCubic(stop2, to), 0.33);
            }
            return createEaseOutCubic(from, to);
        }
        dispose() {
            if (this.animationFrameDisposable !== null) {
                this.animationFrameDisposable.dispose();
                this.animationFrameDisposable = null;
            }
        }
        acceptScrollDimensions(state) {
            this.to = state.withScrollPosition(this.to);
            this._initAnimations();
        }
        tick() {
            return this._tick(Date.now());
        }
        _tick(now) {
            const completion = (now - this.startTime) / this.duration;
            if (completion < 1) {
                const newScrollLeft = this.scrollLeft(completion);
                const newScrollTop = this.scrollTop(completion);
                return new SmoothScrollingUpdate(newScrollLeft, newScrollTop, false);
            }
            return new SmoothScrollingUpdate(this.to.scrollLeft, this.to.scrollTop, true);
        }
        combine(from, to, duration) {
            return SmoothScrollingOperation.start(from, to, duration);
        }
        static start(from, to, duration) {
            // +10 / -10 : pretend the animation already started for a quicker response to a scroll request
            duration = duration + 10;
            const startTime = Date.now() - 10;
            return new SmoothScrollingOperation(from, to, startTime, duration);
        }
    }
    exports.SmoothScrollingOperation = SmoothScrollingOperation;
    function easeInCubic(t) {
        return Math.pow(t, 3);
    }
    function easeOutCubic(t) {
        return 1 - easeInCubic(1 - t);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYWJsZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3Njcm9sbGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLElBQWtCLG1CQUlqQjtJQUpELFdBQWtCLG1CQUFtQjtRQUNwQyw2REFBUSxDQUFBO1FBQ1IsaUVBQVUsQ0FBQTtRQUNWLG1FQUFXLENBQUE7SUFDWixDQUFDLEVBSmlCLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBSXBDO0lBOEJELE1BQWEsV0FBVztRQWF2QixZQUNrQixtQkFBNEIsRUFDN0MsS0FBYSxFQUNiLFdBQW1CLEVBQ25CLFVBQWtCLEVBQ2xCLE1BQWMsRUFDZCxZQUFvQixFQUNwQixTQUFpQjtZQU5BLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBUztZQWI5QyxzQkFBaUIsR0FBUyxTQUFTLENBQUM7WUFxQm5DLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQzlCLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQixXQUFXLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQztnQkFDOUIsVUFBVSxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUM7Z0JBQzVCLE1BQU0sR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQixZQUFZLEdBQUcsWUFBWSxHQUFHLENBQUMsQ0FBQztnQkFDaEMsU0FBUyxHQUFHLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDM0IsQ0FBQztZQUVELElBQUksQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDLENBQUMsb0JBQW9CO1lBQ3JELElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDLENBQUMsb0JBQW9CO1lBRW5ELElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNmLEtBQUss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