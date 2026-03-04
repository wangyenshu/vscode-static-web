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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/touch", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/css!./sash"], function (require, exports, dom_1, event_1, touch_1, async_1, decorators_1, event_2, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sash = exports.SashState = exports.Orientation = exports.OrthogonalEdge = void 0;
    exports.setGlobalSashSize = setGlobalSashSize;
    exports.setGlobalHoverDelay = setGlobalHoverDelay;
    /**
     * Allow the sashes to be visible at runtime.
     * @remark Use for development purposes only.
     */
    const DEBUG = false;
    var OrthogonalEdge;
    (function (OrthogonalEdge) {
        OrthogonalEdge["North"] = "north";
        OrthogonalEdge["South"] = "south";
        OrthogonalEdge["East"] = "east";
        OrthogonalEdge["West"] = "west";
    })(OrthogonalEdge || (exports.OrthogonalEdge = OrthogonalEdge = {}));
    var Orientation;
    (function (Orientation) {
        Orientation[Orientation["VERTICAL"] = 0] = "VERTICAL";
        Orientation[Orientation["HORIZONTAL"] = 1] = "HORIZONTAL";
    })(Orientation || (exports.Orientation = Orientation = {}));
    var SashState;
    (function (SashState) {
        /**
         * Disable any UI interaction.
         */
        SashState[SashState["Disabled"] = 0] = "Disabled";
        /**
         * Allow dragging down or to the right, depending on the sash orientation.
         *
         * Some OSs allow customizing the mouse cursor differently whenever
         * some resizable component can't be any smaller, but can be larger.
         */
        SashState[SashState["AtMinimum"] = 1] = "AtMinimum";
        /**
         * Allow dragging up or to the left, depending on the sash orientation.
         *
         * Some OSs allow customizing the mouse cursor differently whenever
         * some resizable component can't be any larger, but can be smaller.
         */
        SashState[SashState["AtMaximum"] = 2] = "AtMaximum";
        /**
         * Enable dragging.
         */
        SashState[SashState["Enabled"] = 3] = "Enabled";
    })(SashState || (exports.SashState = SashState = {}));
    let globalSize = 4;
    const onDidChangeGlobalSize = new event_2.Emitter();
    function setGlobalSashSize(size) {
        globalSize = size;
        onDidChangeGlobalSize.fire(size);
    }
    let globalHoverDelay = 300;
    const onDidChangeHoverDelay = new event_2.Emitter();
    function setGlobalHoverDelay(size) {
        globalHoverDelay = size;
        onDidChangeHoverDelay.fire(size);
    }
    class MouseEventFactory {
        constructor(el) {
            this.el = el;
            this.disposables = new lifecycle_1.DisposableStore();
        }
        get onPointerMove() {
            return this.disposables.add(new event_1.DomEmitter((0, dom_1.getWindow)(this.el), 'mousemove')).event;
        }
        get onPointerUp() {
            return this.disposables.add(new event_1.DomEmitter((0, dom_1.getWindow)(this.el), 'mouseup')).event;
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    __decorate([
        decorators_1.memoize
    ], MouseEventFactory.prototype, "onPointerMove", null);
    __decorate([
        decorators_1.memoize
    ], MouseEventFactory.prototype, "onPointerUp", null);
    class GestureEventFactory {
        get onPointerMove() {
            return this.disposables.add(new event_1.DomEmitter(this.el, touch_1.EventType.Change)).event;
        }
        get onPointerUp() {
            return this.disposables.add(new event_1.DomEmitter(this.el, touch_1.EventType.End)).event;
        }
        constructor(el) {
            this.el = el;
            this.disposables = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    __decorate([
        decorators_1.memoize
    ], GestureEventFactory.prototype, "onPointerMove", null);
    __decorate([
        decorators_1.memoize
    ], GestureEventFactory.prototype, "onPointerUp", null);
    class OrthogonalPointerEventFactory {
        get onPointerMove() {
            return this.factory.onPointerMove;
        }
        get onPointerUp() {
            return this.factory.onPointerUp;
        }
        constructor(factory) {
            this.factory = factory;
        }
        dispose() {
            // noop
        }
    }
    __decorate([
        decorators_1.memoize
    ], OrthogonalPointerEventFactory.prototype, "onPointerMove", null);
    __decorate([
        decorators_1.memoize
    ], OrthogonalPointerEventFactory.prototype, "onPointerUp", null);
    const PointerEventsDisabledCssClass = 'pointer-events-disabled';
    /**
     * The {@link Sash} is the UI component which allows the user to resize other
     * components. It's usually an invisible horizontal or vertical line which, when
     * hovered, becomes highlighted and can be dragged along the perpendicular dimension
     * to its direction.
     *
     * Features:
     * - Touch event handling
     * - Corner sash support
     * - Hover with different mouse cursor support
     * - Configurable hover size
     * - Linked sash support, for 2x2 corner sashes
     */
    class Sash extends lifecycle_1.Disposable {
        get state() { return this._state; }
        get orthogonalStartSash() { return this._orthogonalStartSash; }
        get orthogonalEndSash() { return this._orthogonalEndSash; }
        /**
         * The state of a sash defines whether it can be interacted with by the user
         * as well as what mouse cursor to use, when hovered.
         */
        set state(state) {
            if (this._state === state) {
                return;
            }
            this.el.classList.toggle('disabled', state === 0 /* SashState.Disabled */);
            this.el.classList.toggle('minimum', state === 1 /* SashState.AtMinimum */);
            this.el.classList.toggle('maximum', state === 2 /* SashState.AtMaximum */);
            this._state = state;
            this.onDidEnablementChange.fire(state);
        }
        /**
         * A reference to another sash, perpendicular to this one, which
         * aligns at the start of this one. A corner sash will be created
         * automatically at that location.
         *
         * The start of a horizontal sash is its left-most position.
         * The start of a vertical sash is its top-most position.
         */
        set orthogonalStartSash(sash) {
            if (this._orthogonalStartSash === sash) {
                return;
            }
            this.orthogonalStartDragHandleDisposables.clear();
            this.orthogonalStartSashDisposables.clear();
            if (sash) {
                const onChange = (state) => {
                    this.orthogonalStartDragHandleDisposables.clear();
                    if (state !== 0 /* SashState.Disabled */) {
                        this._orthogonalStartDragHandle = (0, dom_1.append)(this.el, (0, dom_1.$)('.orthogonal-drag-handle.start'));
                        this.orthogonalStartDragHandleDisposables.add((0, lifecycle_1.toDisposable)(() => this._orthogonalStartDragHandle.remove()));
                        this.orthogonalStartDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalStartDragHandle, 'mouseenter')).event(() => Sash.onMouseEnter(sash), undefined, this.orthogonalStartDragHandleDisposables);
                        this.orthogonalStartDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalStartDragHandle, 'mouseleave')).event(() => Sash.onMouseLeave(sash), undefined, this.orthogonalStartDragHandleDisposables);
                    }
                };
                this.orthogonalStartSashDisposables.add(sash.onDidEnablementChange.event(onChange, this));
                onChange(sash.state);
            }
            this._orthogonalStartSash = sash;
        }
        /**
         * A reference to another sash, perpendicular to this one, which
         * aligns at the end of this one. A corner sash will be created
         * automatically at that location.
         *
         * The end of a horizontal sash is its right-most position.
         * The end of a vertical sash is its bottom-most position.
         */
        set orthogonalEndSash(sash) {
            if (this._orthogonalEndSash === sash) {
                return;
            }
            this.orthogonalEndDragHandleDisposables.clear();
            this.orthogonalEndSashDisposables.clear();
            if (sash) {
                const onChange = (state) => {
                    this.orthogonalEndDragHandleDisposables.clear();
                    if (state !== 0 /* SashState.Disabled */) {
                        this._orthogonalEndDragHandle = (0, dom_1.append)(this.el, (0, dom_1.$)('.orthogonal-drag-handle.end'));
                        this.orthogonalEndDragHandleDisposables.add((0, lifecycle_1.toDisposable)(() => this._orthogonalEndDragHandle.remove()));
                        this.orthogonalEndDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalEndDragHandle, 'mouseenter')).event(() => Sash.onMouseEnter(sash), undefined, this.orthogonalEndDragHandleDisposables);
                        this.orthogonalEndDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalEndDragHandle, 'mouseleave')).event(() => Sash.onMouseLeave(sash), undefined, this.orthogonalEndDragHandleDisposables);
                    }
                };
                this.orthogonalEndSashDisposables.add(sash.onDidEnablementChange.event(onChange, this));
                onChange(sash.state);
            }
            this._orthogonalEndSash = sash;
        }
        constructor(container, layoutProvider, options) {
            super();
            this.hoverDelay = globalHoverDelay;
            this.hoverDelayer = this._register(new async_1.Delayer(this.hoverDelay));
            this._state = 3 /* SashState.Enabled */;
            this.onDidEnablementChange = this._register(new event_2.Emitter());
            this._onDidStart = this._register(new event_2.Emitter());
            this._onDidChange = this._register(new event_2.Emitter());
            this._onDidReset = this._register(new event_2.Emitter());
            this._onDidEnd = this._register(new event_2.Emitter());
            this.orthogonalStartSashDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orthogonalStartDragHandleDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orthogonalEndSashDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orthogonalEndDragHandleDisposables = this._register(new lifecycle_1.DisposableStore());
            /**
             * An event which fires whenever the user starts dragging this sash.
             */
            this.onDidStart = this._onDidStart.event;
            /**
             * An event which fires whenever the user moves the mouse while
             * dragging this sash.
             */
            this.onDidChange = this._onDidChange.event;
            /**
             * An event which fires whenever the user double clicks this sash.
             */
            this.onDidReset = this._onDidReset.event;
            /**
             * An event which fires whenever the user stops dragging this sash.
             */
            this.onDidEnd = this._onDidEnd.event;
            /**
             * A linked sash will be forwarded the same user interactions and events
             * so it moves exactly the same way as this sash.
             *
             * Useful in 2x2 grids. Not meant for widespread usage.
             */
            this.linkedSash = undefined;
            this.el = (0, dom_1.append)(container, (0, dom_1.$)('.monaco-sash'));
            if (options.orthogonalEdge) {
                this.el.classList.add(`orthogonal-edge-${options.orthogonalEdge}`);
            }
            if (platform_1.isMacintosh) {
                this.el.classList.add('mac');
            }
            const onMouseDown = this._register(new event_1.DomEmitter(this.el, 'mousedown')).event;
            this._register(onMouseDown(e => this.onPointerStart(e, new MouseEventFactory(container)), this));
            const onMouseDoubleClick = this._register(new event_1.DomEmitter(this.el, 'dblclick')).event;
            this._register(onMouseDoubleClick(this.onPointerDoublePress, this));
            const onMouseEnter = this._register(new event_1.DomEmitter(this.el, 'mouseenter')).event;
            this._register(onMouseEnter(() => Sash.onMouseEnter(this)));
            const onMouseLeave = this._register(new event_1.DomEmitter(this.el, 'mouseleave')).event;
            this._register(onMouseLeave(() => Sash.onMouseLeave(this)));
            this._register(touch_1.Gesture.addTarget(this.el));
            const onTouchStart = this._register(new event_1.DomEmitter(this.el, touch_1.EventType.Start)).event;
            this._register(onTouchStart(e => this.onPointerStart(e, new GestureEventFactory(this.el)), this));
            const onTap = this._register(new event_1.DomEmitter(this.el, touch_1.EventType.Tap)).event;
            let doubleTapTimeout = undefined;
            this._register(onTap(event => {
                if (doubleTapTimeout) {
                    clearTimeout(doubleTapTimeout);
                    doubleTapTimeout = undefined;
                    this.onPointerDoublePress(event);
                    return;
                }
                clearTimeout(doubleTapTimeout);
                doubleTapTimeout = setTimeout(() => doubleTapTimeout = undefined, 250);
            }, this));
            if (typeof options.size === 'number') {
                this.size = options.size;
                if (options.orientation === 0 /* Orientation.VERTICAL */) {
                    this.el.style.width = `${this.size}px`;
                }
                else {
                    this.el.style.height = `${this.size}px`;
                }
            }
            else {
                this.size = globalSize;
                this._register(onDidChangeGlobalSize.event(size => {
                    this.size = size;
                    this.layout();
                }));
            }
            this._register(onDidChangeHoverDelay.event(delay => this.hoverDelay = delay));
            this.layoutProvider = layoutProvider;
            this.orthogonalStartSash = options.orthogonalStartSash;
            this.orthogonalEndSash = options.orthogonalEndSash;
            this.orientation = options.orientation || 0 /* Orientation.VERTICAL */;
            if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                this.el.classList.add('horizontal');
                this.el.classList.remove('vertical');
            }
            else {
                this.el.classList.remove('horizontal');
                this.el.classList.add('vertical');
            }
            this.el.classList.toggle('debug', DEBUG);
            this.layout();
        }
        onPointerStart(event, pointerEventFactory) {
            dom_1.EventHelper.stop(event);
            let isMultisashResize = false;
            if (!event.__orthogonalSashEvent) {
                const orthogonalSash = this.getOrthogonalSash(event);
                if (orthogonalSash) {
                    isMultisashResize = true;
                    event.__orthogonalSashEvent = true;
                    orthogonalSash.onPointerStart(event, new OrthogonalPointerEventFactory(pointerEventFactory));
                }
            }
            if (this.linkedSash && !event.__linkedSashEvent) {
                event.__linkedSashEvent = true;
                this.linkedSash.onPointerStart(event, new OrthogonalPointerEventFactory(pointerEventFactory));
            }
            if (!this.state) {
                return;
            }
            const iframes = this.el.ownerDocument.getElementsByTagName('iframe');
            for (const iframe of iframes) {
                iframe.classList.add(PointerEventsDisabledCssClass); // disable mouse events on iframes as long as we drag the sash
            }
            const startX = event.pageX;
            const startY = event.pageY;
            const altKey = event.altKey;
            const startEvent = { startX, currentX: startX, startY, currentY: startY, altKey };
            this.el.classList.add('active');
            this._onDidStart.fire(startEvent);
            // fix https://github.com/microsoft/vscode/issues/21675
            const style = (0, dom_1.createStyleSheet)(this.el);
            const updateStyle = () => {
                let cursor = '';
                if (isMultisashResize) {
                    cursor = 'all-scroll';
                }
                else if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                    if (this.state === 1 /* SashState.AtMinimum */) {
                        cursor = 's-resize';
                    }
                    else if (this.state === 2 /* SashState.AtMaximum */) {
                        cursor = 'n-resize';
                    }
                    else {
                        cursor = platform_1.isMacintosh ? 'row-resize' : 'ns-resize';
                    }
                }
                else {
                    if (this.state === 1 /* SashState.AtMinimum */) {
                        cursor = 'e-resize';
                    }
                    else if (this.state === 2 /* SashState.AtMaximum */) {
                        cursor = 'w-resize';
                    }
                    else {
                        cursor = platform_1.isMacintosh ? 'col-resize' : 'ew-resize';
                    }
                }
                style.textContent = `* { cursor: ${cursor} !important; }`;
            };
            const disposables = new lifecycle_1.DisposableStore();
            updateStyle();
            if (!isMultisashResize) {
                this.onDidEnablementChange.event(updateStyle, null, disposables);
            }
            const onPointerMove = (e) => {
                dom_1.EventHelper.stop(e, false);
                const event = { startX, currentX: e.pageX, startY, currentY: e.pageY, altKey };
                this._onDidChange.fire(event);
            };
            const onPointerUp = (e) => {
                dom_1.EventHelper.stop(e, false);
                this.el.removeChild(style);
                this.el.classList.remove('active');
                this._onDidEnd.fire();
                disposables.dispose();
                for (const iframe of iframes) {
                    iframe.classList.remove(PointerEventsDisabledCssClass);
                }
            };
            pointerEventFactory.onPointerMove(onPointerMove, null, disposables);
            pointerEventFactory.onPointerUp(onPointerUp, null, disposables);
            disposables.add(pointerEventFactory);
        }
        onPointerDoublePress(e) {
            const orthogonalSash = this.getOrthogonalSash(e);
            if (orthogonalSash) {
                orthogonalSash._onDidReset.fire();
            }
            if (this.linkedSash) {
                this.linkedSash._onDidReset.fire();
            }
            this._onDidReset.fire();
        }
        static onMouseEnter(sash, fromLinkedSash = false) {
            if (sash.el.classList.contains('active')) {
                sash.hoverDelayer.cancel();
                sash.el.classList.add('hover');
            }
            else {
                sash.hoverDelayer.trigger(() => sash.el.classList.add('hover'), sash.hoverDelay).then(undefined, () => { });
            }
            if (!fromLinkedSash && sash.linkedSash) {
                Sash.onMouseEnter(sash.linkedSash, true);
            }
        }
        static onMouseLeave(sash, fromLinkedSash = false) {
            sash.hoverDelayer.cancel();
            sash.el.classList.remove('hover');
            if (!fromLinkedSash && sash.linkedSash) {
                Sash.onMouseLeave(sash.linkedSash, true);
            }
        }
        /**
         * Forcefully stop any user interactions with this sash.
         * Useful when hiding a parent component, while the user is still
         * interacting with the sash.
         */
        clearSashHoverState() {
            Sash.onMouseLeave(this);
        }
        /**
         * Layout the sash. The sash will size and position itself
         * based on its provided {@link ISashLayoutProvider layout provider}.
         */
        layout() {
            if (this.orientation === 0 /* Orientation.VERTICAL */) {
                const verticalProvider = this.layoutProvider;
                this.el.style.left = verticalProvider.getVerticalSashLeft(this) - (this.size / 2) + 'px';
                if (verticalProvider.getVerticalSashTop) {
                    this.el.style.top = verticalProvider.getVerticalSashTop(this) + 'px';
                }
                if (verticalProvider.getVerticalSashHeight) {
                    this.el.style.height = verticalProvider.getVerticalSashHeight(this) + 'px';
                }
            }
            else {
                const horizontalProvider = this.layoutProvider;
                this.el.style.top = horizontalProvider.getHorizontalSashTop(this) - (this.size / 2) + 'px';
                if (horizontalProvider.getHorizontalSashLeft) {
                    this.el.style.left = horizontalProvider.getHorizontalSashLeft(this) + 'px';
                }
                if (horizontalProvider.getHorizontalSashWidth) {
                    this.el.style.width = horizontalProvider.getHorizontalSashWidth(this) + 'px';
                }
            }
        }
        getOrthogonalSash(e) {
            const target = e.initialTarget ?? e.target;
            if (!target || !(target instanceof HTMLElement)) {
                return undefined;
            }
            if (target.classList.contains('orthogonal-drag-handle')) {
                return target.classList.contains('start') ? this.orthogonalStartSash : this.orthogonalEndSash;
            }
            return undefined;
        }
        dispose() {
            super.dispose();
            this.el.remove();
        }
    }
    exports.Sash = Sash;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FzaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9zYXNoL3Nhc2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7O0lBZ0poRyw4Q0FHQztJQUlELGtEQUdDO0lBOUlEOzs7T0FHRztJQUNILE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQztJQStCcEIsSUFBWSxjQUtYO0lBTEQsV0FBWSxjQUFjO1FBQ3pCLGlDQUFlLENBQUE7UUFDZixpQ0FBZSxDQUFBO1FBQ2YsK0JBQWEsQ0FBQTtRQUNiLCtCQUFhLENBQUE7SUFDZCxDQUFDLEVBTFcsY0FBYyw4QkFBZCxjQUFjLFFBS3pCO0lBd0RELElBQWtCLFdBR2pCO0lBSEQsV0FBa0IsV0FBVztRQUM1QixxREFBUSxDQUFBO1FBQ1IseURBQVUsQ0FBQTtJQUNYLENBQUMsRUFIaUIsV0FBVywyQkFBWCxXQUFXLFFBRzVCO0lBRUQsSUFBa0IsU0EyQmpCO0lBM0JELFdBQWtCLFNBQVM7UUFFMUI7O1dBRUc7UUFDSCxpREFBUSxDQUFBO1FBRVI7Ozs7O1dBS0c7UUFDSCxtREFBUyxDQUFBO1FBRVQ7Ozs7O1dBS0c7UUFDSCxtREFBUyxDQUFBO1FBRVQ7O1dBRUc7UUFDSCwrQ0FBTyxDQUFBO0lBQ1IsQ0FBQyxFQTNCaUIsU0FBUyx5QkFBVCxTQUFTLFFBMkIxQjtJQUVELElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztJQUNuQixNQUFNLHFCQUFxQixHQUFHLElBQUksZUFBTyxFQUFVLENBQUM7SUFDcEQsU0FBZ0IsaUJBQWlCLENBQUMsSUFBWTtRQUM3QyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRUQsSUFBSSxnQkFBZ0IsR0FBRyxHQUFHLENBQUM7SUFDM0IsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBVSxDQUFDO0lBQ3BELFNBQWdCLG1CQUFtQixDQUFDLElBQVk7UUFDL0MsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBZ0JELE1BQU0saUJBQWlCO1FBSXRCLFlBQW9CLEVBQWU7WUFBZixPQUFFLEdBQUYsRUFBRSxDQUFhO1lBRmxCLGdCQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFZCxDQUFDO1FBR3hDLElBQUksYUFBYTtZQUNoQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksa0JBQVUsQ0FBQyxJQUFBLGVBQVMsRUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDcEYsQ0FBQztRQUdELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxrQkFBVSxDQUFDLElBQUEsZUFBUyxFQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUNsRixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUIsQ0FBQztLQUNEO0lBWkE7UUFEQyxvQkFBTzswREFHUDtJQUdEO1FBREMsb0JBQU87d0RBR1A7SUFPRixNQUFNLG1CQUFtQjtRQUt4QixJQUFJLGFBQWE7WUFDaEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGtCQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxpQkFBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQzlFLENBQUM7UUFHRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksa0JBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLGlCQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDM0UsQ0FBQztRQUVELFlBQW9CLEVBQWU7WUFBZixPQUFFLEdBQUYsRUFBRSxDQUFhO1lBWmxCLGdCQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFZZCxDQUFDO1FBRXhDLE9BQU87WUFDTixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzVCLENBQUM7S0FDRDtJQWRBO1FBREMsb0JBQU87NERBR1A7SUFHRDtRQURDLG9CQUFPOzBEQUdQO0lBU0YsTUFBTSw2QkFBNkI7UUFHbEMsSUFBSSxhQUFhO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7UUFDbkMsQ0FBQztRQUdELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFDakMsQ0FBQztRQUVELFlBQW9CLE9BQTZCO1lBQTdCLFlBQU8sR0FBUCxPQUFPLENBQXNCO1FBQUksQ0FBQztRQUV0RCxPQUFPO1lBQ04sT0FBTztRQUNSLENBQUM7S0FDRDtJQWRBO1FBREMsb0JBQU87c0VBR1A7SUFHRDtRQURDLG9CQUFPO29FQUdQO0lBU0YsTUFBTSw2QkFBNkIsR0FBRyx5QkFBeUIsQ0FBQztJQUVoRTs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxNQUFhLElBQUssU0FBUSxzQkFBVTtRQXdCbkMsSUFBSSxLQUFLLEtBQWdCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDOUMsSUFBSSxtQkFBbUIsS0FBdUIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLElBQUksaUJBQWlCLEtBQXVCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUU3RTs7O1dBR0c7UUFDSCxJQUFJLEtBQUssQ0FBQyxLQUFnQjtZQUN6QixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQzNCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxLQUFLLCtCQUF1QixDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLGdDQUF3QixDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLGdDQUF3QixDQUFDLENBQUM7WUFFbkUsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBK0JEOzs7Ozs7O1dBT0c7UUFDSCxJQUFJLG1CQUFtQixDQUFDLElBQXNCO1lBQzdDLElBQUksSUFBSSxDQUFDLG9CQUFvQixLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN4QyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNsRCxJQUFJLENBQUMsOEJBQThCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFNUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVixNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQWdCLEVBQUUsRUFBRTtvQkFDckMsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUVsRCxJQUFJLEtBQUssK0JBQXVCLEVBQUUsQ0FBQzt3QkFDbEMsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUEsWUFBTSxFQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBQSxPQUFDLEVBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDO3dCQUN0RixJQUFJLENBQUMsb0NBQW9DLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsMEJBQTJCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUM3RyxJQUFJLENBQUMsb0NBQW9DLENBQUMsR0FBRyxDQUFDLElBQUksa0JBQVUsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQ2hILEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO3dCQUN2RixJQUFJLENBQUMsb0NBQW9DLENBQUMsR0FBRyxDQUFDLElBQUksa0JBQVUsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQ2hILEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO29CQUN4RixDQUFDO2dCQUNGLENBQUMsQ0FBQztnQkFFRixJQUFJLENBQUMsOEJBQThCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzFGLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEIsQ0FBQztZQUVELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7UUFDbEMsQ0FBQztRQUVEOzs7Ozs7O1dBT0c7UUFFSCxJQUFJLGlCQUFpQixDQUFDLElBQXNCO1lBQzNDLElBQUksSUFBSSxDQUFDLGtCQUFrQixLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN0QyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoRCxJQUFJLENBQUMsNEJBQTRCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFMUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVixNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQWdCLEVBQUUsRUFBRTtvQkFDckMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUVoRCxJQUFJLEtBQUssK0JBQXVCLEVBQUUsQ0FBQzt3QkFDbEMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUEsWUFBTSxFQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBQSxPQUFDLEVBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO3dCQUNsRixJQUFJLENBQUMsa0NBQWtDLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0JBQXlCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN6RyxJQUFJLENBQUMsa0NBQWtDLENBQUMsR0FBRyxDQUFDLElBQUksa0JBQVUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQzVHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO3dCQUNyRixJQUFJLENBQUMsa0NBQWtDLENBQUMsR0FBRyxDQUFDLElBQUksa0JBQVUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQzVHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO29CQUN0RixDQUFDO2dCQUNGLENBQUMsQ0FBQztnQkFFRixJQUFJLENBQUMsNEJBQTRCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3hGLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEIsQ0FBQztZQUVELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7UUFDaEMsQ0FBQztRQW1CRCxZQUFZLFNBQXNCLEVBQUUsY0FBbUMsRUFBRSxPQUFxQjtZQUM3RixLQUFLLEVBQUUsQ0FBQztZQWpLRCxlQUFVLEdBQUcsZ0JBQWdCLENBQUM7WUFDOUIsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBRTVELFdBQU0sNkJBQWdDO1lBQzdCLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWEsQ0FBQyxDQUFDO1lBQ2pFLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBYyxDQUFDLENBQUM7WUFDeEQsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFjLENBQUMsQ0FBQztZQUN6RCxnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2xELGNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNoRCxtQ0FBOEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFFdkUseUNBQW9DLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBRTdFLGlDQUE0QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUVyRSx1Q0FBa0MsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUF3QjVGOztlQUVHO1lBQ00sZUFBVSxHQUFzQixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUVoRTs7O2VBR0c7WUFDTSxnQkFBVyxHQUFzQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUVsRTs7ZUFFRztZQUNNLGVBQVUsR0FBZ0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFFMUQ7O2VBRUc7WUFDTSxhQUFRLEdBQWdCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1lBRXREOzs7OztlQUtHO1lBQ0gsZUFBVSxHQUFxQixTQUFTLENBQUM7WUFpR3hDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBQSxZQUFNLEVBQUMsU0FBUyxFQUFFLElBQUEsT0FBQyxFQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFFL0MsSUFBSSxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7WUFDcEUsQ0FBQztZQUVELElBQUksc0JBQVcsRUFBRSxDQUFDO2dCQUNqQixJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUVELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQkFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDL0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFJLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqRyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQkFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDckYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksa0JBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQkFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDakYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFNUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTNDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQkFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsaUJBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUNwRixJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNsRyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksa0JBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLGlCQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFFM0UsSUFBSSxnQkFBZ0IsR0FBUSxTQUFTLENBQUM7WUFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzVCLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztvQkFDdEIsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUM7b0JBQy9CLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNqQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQy9CLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsR0FBRyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDeEUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFVixJQUFJLE9BQU8sT0FBTyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUV6QixJQUFJLE9BQU8sQ0FBQyxXQUFXLGlDQUF5QixFQUFFLENBQUM7b0JBQ2xELElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQztnQkFDeEMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQztnQkFDekMsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ2pELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO29CQUNqQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUU5RSxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztZQUVyQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDO1lBQ3ZELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUM7WUFFbkQsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsV0FBVyxnQ0FBd0IsQ0FBQztZQUUvRCxJQUFJLElBQUksQ0FBQyxXQUFXLG1DQUEyQixFQUFFLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBRUQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUV6QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRU8sY0FBYyxDQUFDLEtBQW1CLEVBQUUsbUJBQXlDO1lBQ3BGLGlCQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXhCLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1lBRTlCLElBQUksQ0FBRSxLQUFhLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUVyRCxJQUFJLGNBQWMsRUFBRSxDQUFDO29CQUNwQixpQkFBaUIsR0FBRyxJQUFJLENBQUM7b0JBQ3hCLEtBQWEsQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7b0JBQzVDLGNBQWMsQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLElBQUksNkJBQTZCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO2dCQUM5RixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFFLEtBQWEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN6RCxLQUFhLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSw2QkFBNkIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7WUFDL0YsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2pCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDckUsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLDhEQUE4RDtZQUNwSCxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUMzQixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQzNCLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDNUIsTUFBTSxVQUFVLEdBQWUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUU5RixJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFbEMsdURBQXVEO1lBQ3ZELE1BQU0sS0FBSyxHQUFHLElBQUEsc0JBQWdCLEVBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sV0FBVyxHQUFHLEdBQUcsRUFBRTtnQkFDeEIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO2dCQUVoQixJQUFJLGlCQUFpQixFQUFFLENBQUM7b0JBQ3ZCLE1BQU0sR0FBRyxZQUFZLENBQUM7Z0JBQ3ZCLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsV0FBVyxtQ0FBMkIsRUFBRSxDQUFDO29CQUN4RCxJQUFJLElBQUksQ0FBQyxLQUFLLGdDQUF3QixFQUFFLENBQUM7d0JBQ3hDLE1BQU0sR0FBRyxVQUFVLENBQUM7b0JBQ3JCLENBQUM7eUJBQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxnQ0FBd0IsRUFBRSxDQUFDO3dCQUMvQyxNQUFNLEdBQUcsVUFBVSxDQUFDO29CQUNyQixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxHQUFHLHNCQUFXLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO29CQUNuRCxDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLElBQUksQ0FBQyxLQUFLLGdDQUF3QixFQUFFLENBQUM7d0JBQ3hDLE1BQU0sR0FBRyxVQUFVLENBQUM7b0JBQ3JCLENBQUM7eUJBQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxnQ0FBd0IsRUFBRSxDQUFDO3dCQUMvQyxNQUFNLEdBQUcsVUFBVSxDQUFDO29CQUNyQixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxHQUFHLHNCQUFXLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO29CQUNuRCxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsS0FBSyxDQUFDLFdBQVcsR0FBRyxlQUFlLE1BQU0sZ0JBQWdCLENBQUM7WUFDM0QsQ0FBQyxDQUFDO1lBRUYsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMsV0FBVyxFQUFFLENBQUM7WUFFZCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2xFLENBQUM7WUFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQWUsRUFBRSxFQUFFO2dCQUN6QyxpQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNCLE1BQU0sS0FBSyxHQUFlLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztnQkFFM0YsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0IsQ0FBQyxDQUFDO1lBRUYsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFlLEVBQUUsRUFBRTtnQkFDdkMsaUJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUUzQixJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFFM0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUV0QixXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRXRCLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQzlCLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLDZCQUE2QixDQUFDLENBQUM7Z0JBQ3hELENBQUM7WUFDRixDQUFDLENBQUM7WUFFRixtQkFBbUIsQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNwRSxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNoRSxXQUFXLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVPLG9CQUFvQixDQUFDLENBQWE7WUFDekMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWpELElBQUksY0FBYyxFQUFFLENBQUM7Z0JBQ3BCLGNBQWMsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbkMsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNwQyxDQUFDO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBRU8sTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFVLEVBQUUsaUJBQTBCLEtBQUs7WUFDdEUsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDN0csQ0FBQztZQUVELElBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDMUMsQ0FBQztRQUNGLENBQUM7UUFFTyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQVUsRUFBRSxpQkFBMEIsS0FBSztZQUN0RSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVsQyxJQUFJLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFDLENBQUM7UUFDRixDQUFDO1FBRUQ7Ozs7V0FJRztRQUNILG1CQUFtQjtZQUNsQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFFRDs7O1dBR0c7UUFDSCxNQUFNO1lBQ0wsSUFBSSxJQUFJLENBQUMsV0FBVyxpQ0FBeUIsRUFBRSxDQUFDO2dCQUMvQyxNQUFNLGdCQUFnQixHQUFpQyxJQUFJLENBQUMsY0FBZSxDQUFDO2dCQUM1RSxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFFekYsSUFBSSxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO29CQUN6QyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUN0RSxDQUFDO2dCQUVELElBQUksZ0JBQWdCLENBQUMscUJBQXFCLEVBQUUsQ0FBQztvQkFDNUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDNUUsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLGtCQUFrQixHQUFtQyxJQUFJLENBQUMsY0FBZSxDQUFDO2dCQUNoRixJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsa0JBQWtCLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFFM0YsSUFBSSxrQkFBa0IsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUM5QyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsa0JBQWtCLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUM1RSxDQUFDO2dCQUVELElBQUksa0JBQWtCLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztvQkFDL0MsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLGtCQUFrQixDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDOUUsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8saUJBQWlCLENBQUMsQ0FBZTtZQUN4QyxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFFM0MsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsTUFBTSxZQUFZLFdBQVcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pELE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLHdCQUF3QixDQUFDLEVBQUUsQ0FBQztnQkFDekQsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFDL0YsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbEIsQ0FBQztLQUNEO0lBdGJELG9CQXNiQyJ9