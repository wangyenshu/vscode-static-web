/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/canIUse", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/range", "vs/css!./contextview"], function (require, exports, canIUse_1, DOM, lifecycle_1, platform, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextView = exports.LayoutAnchorMode = exports.LayoutAnchorPosition = exports.AnchorAxisAlignment = exports.AnchorPosition = exports.AnchorAlignment = exports.ContextViewDOMPosition = void 0;
    exports.isAnchor = isAnchor;
    exports.layout = layout;
    var ContextViewDOMPosition;
    (function (ContextViewDOMPosition) {
        ContextViewDOMPosition[ContextViewDOMPosition["ABSOLUTE"] = 1] = "ABSOLUTE";
        ContextViewDOMPosition[ContextViewDOMPosition["FIXED"] = 2] = "FIXED";
        ContextViewDOMPosition[ContextViewDOMPosition["FIXED_SHADOW"] = 3] = "FIXED_SHADOW";
    })(ContextViewDOMPosition || (exports.ContextViewDOMPosition = ContextViewDOMPosition = {}));
    function isAnchor(obj) {
        const anchor = obj;
        return !!anchor && typeof anchor.x === 'number' && typeof anchor.y === 'number';
    }
    var AnchorAlignment;
    (function (AnchorAlignment) {
        AnchorAlignment[AnchorAlignment["LEFT"] = 0] = "LEFT";
        AnchorAlignment[AnchorAlignment["RIGHT"] = 1] = "RIGHT";
    })(AnchorAlignment || (exports.AnchorAlignment = AnchorAlignment = {}));
    var AnchorPosition;
    (function (AnchorPosition) {
        AnchorPosition[AnchorPosition["BELOW"] = 0] = "BELOW";
        AnchorPosition[AnchorPosition["ABOVE"] = 1] = "ABOVE";
    })(AnchorPosition || (exports.AnchorPosition = AnchorPosition = {}));
    var AnchorAxisAlignment;
    (function (AnchorAxisAlignment) {
        AnchorAxisAlignment[AnchorAxisAlignment["VERTICAL"] = 0] = "VERTICAL";
        AnchorAxisAlignment[AnchorAxisAlignment["HORIZONTAL"] = 1] = "HORIZONTAL";
    })(AnchorAxisAlignment || (exports.AnchorAxisAlignment = AnchorAxisAlignment = {}));
    var LayoutAnchorPosition;
    (function (LayoutAnchorPosition) {
        LayoutAnchorPosition[LayoutAnchorPosition["Before"] = 0] = "Before";
        LayoutAnchorPosition[LayoutAnchorPosition["After"] = 1] = "After";
    })(LayoutAnchorPosition || (exports.LayoutAnchorPosition = LayoutAnchorPosition = {}));
    var LayoutAnchorMode;
    (function (LayoutAnchorMode) {
        LayoutAnchorMode[LayoutAnchorMode["AVOID"] = 0] = "AVOID";
        LayoutAnchorMode[LayoutAnchorMode["ALIGN"] = 1] = "ALIGN";
    })(LayoutAnchorMode || (exports.LayoutAnchorMode = LayoutAnchorMode = {}));
    /**
     * Lays out a one dimensional view next to an anchor in a viewport.
     *
     * @returns The view offset within the viewport.
     */
    function layout(viewportSize, viewSize, anchor) {
        const layoutAfterAnchorBoundary = anchor.mode === LayoutAnchorMode.ALIGN ? anchor.offset : anchor.offset + anchor.size;
        const layoutBeforeAnchorBoundary = anchor.mode === LayoutAnchorMode.ALIGN ? anchor.offset + anchor.size : anchor.offset;
        if (anchor.position === 0 /* LayoutAnchorPosition.Before */) {
            if (viewSize <= viewportSize - layoutAfterAnchorBoundary) {
                return layoutAfterAnchorBoundary; // happy case, lay it out after the anchor
            }
            if (viewSize <= layoutBeforeAnchorBoundary) {
                return layoutBeforeAnchorBoundary - viewSize; // ok case, lay it out before the anchor
            }
            return Math.max(viewportSize - viewSize, 0); // sad case, lay it over the anchor
        }
        else {
            if (viewSize <= layoutBeforeAnchorBoundary) {
                return layoutBeforeAnchorBoundary - viewSize; // happy case, lay it out before the anchor
            }
            if (viewSize <= viewportSize - layoutAfterAnchorBoundary) {
                return layoutAfterAnchorBoundary; // ok case, lay it out after the anchor
            }
            return 0; // sad case, lay it over the anchor
        }
    }
    class ContextView extends lifecycle_1.Disposable {
        static { this.BUBBLE_UP_EVENTS = ['click', 'keydown', 'focus', 'blur']; }
        static { this.BUBBLE_DOWN_EVENTS = ['click']; }
        constructor(container, domPosition) {
            super();
            this.container = null;
            this.useFixedPosition = false;
            this.useShadowDOM = false;
            this.delegate = null;
            this.toDisposeOnClean = lifecycle_1.Disposable.None;
            this.toDisposeOnSetContainer = lifecycle_1.Disposable.None;
            this.shadowRoot = null;
            this.shadowRootHostElement = null;
            this.view = DOM.$('.context-view');
            DOM.hide(this.view);
            this.setContainer(container, domPosition);
            this._register((0, lifecycle_1.toDisposable)(() => this.setContainer(null, 1 /* ContextViewDOMPosition.ABSOLUTE */)));
        }
        setContainer(container, domPosition) {
            this.useFixedPosition = domPosition !== 1 /* ContextViewDOMPosition.ABSOLUTE */;
            const usedShadowDOM = this.useShadowDOM;
            this.useShadowDOM = domPosition === 3 /* ContextViewDOMPosition.FIXED_SHADOW */;
            if (container === this.container && usedShadowDOM === this.useShadowDOM) {
                return; // container is the same and no shadow DOM usage has changed
            }
            if (this.container) {
                this.toDisposeOnSetContainer.dispose();
                if (this.shadowRoot) {
                    this.shadowRoot.removeChild(this.view);
                    this.shadowRoot = null;
                    this.shadowRootHostElement?.remove();
                    this.shadowRootHostElement = null;
                }
                else {
                    this.container.removeChild(this.view);
                }
                this.container = null;
            }
            if (container) {
                this.container = container;
                if (this.useShadowDOM) {
                    this.shadowRootHostElement = DOM.$('.shadow-root-host');
                    this.container.appendChild(this.shadowRootHostElement);
                    this.shadowRoot = this.shadowRootHostElement.attachShadow({ mode: 'open' });
                    const style = document.createElement('style');
                    style.textContent = SHADOW_ROOT_CSS;
                    this.shadowRoot.appendChild(style);
                    this.shadowRoot.appendChild(this.view);
                    this.shadowRoot.appendChild(DOM.$('slot'));
                }
                else {
                    this.container.appendChild(this.view);
                }
                const toDisposeOnSetContainer = new lifecycle_1.DisposableStore();
                ContextView.BUBBLE_UP_EVENTS.forEach(event => {
                    toDisposeOnSetContainer.add(DOM.addStandardDisposableListener(this.container, event, e => {
                        this.onDOMEvent(e, false);
                    }));
                });
                ContextView.BUBBLE_DOWN_EVENTS.forEach(event => {
                    toDisposeOnSetContainer.add(DOM.addStandardDisposableListener(this.container, event, e => {
                        this.onDOMEvent(e, true);
                    }, true));
                });
                this.toDisposeOnSetContainer = toDisposeOnSetContainer;
            }
        }
        show(delegate) {
            if (this.isVisible()) {
                this.hide();
            }
            // Show static box
            DOM.clearNode(this.view);
            this.view.className = 'context-view monaco-component';
            this.view.style.top = '0px';
            this.view.style.left = '0px';
            this.view.style.zIndex = `${2575 + (delegate.layer ?? 0)}`;
            this.view.style.position = this.useFixedPosition ? 'fixed' : 'absolute';
            DOM.show(this.view);
            // Render content
            this.toDisposeOnClean = delegate.render(this.view) || lifecycle_1.Disposable.None;
            // Set active delegate
            this.delegate = delegate;
            // Layout
            this.doLayout();
            // Focus
            this.delegate.focus?.();
        }
        getViewElement() {
            return this.view;
        }
        layout() {
            if (!this.isVisible()) {
                return;
            }
            if (this.delegate.canRelayout === false && !(platform.isIOS && canIUse_1.BrowserFeatures.pointerEvents)) {
                this.hide();
                return;
            }
            this.delegate?.layout?.();
            this.doLayout();
        }
        doLayout() {
            // Check that we still have a delegate - this.delegate.layout may have hidden
            if (!this.isVisible()) {
                return;
            }
            // Get anchor
            const anchor = this.delegate.getAnchor();
            // Compute around
            let around;
            // Get the element's position and size (to anchor the view)
            if (anchor instanceof HTMLElement) {
                const elementPosition = DOM.getDomNodePagePosition(anchor);
                // In areas where zoom is applied to the element or its ancestors, we need to adjust the size of the element
                // e.g. The title bar has counter zoom behavior meaning it applies the inverse of zoom level.
                // Window Zoom Level: 1.5, Title Bar Zoom: 1/1.5, Size Multiplier: 1.5
                const zoom = DOM.getDomNodeZoomLevel(anchor);
                around = {
                    top: elementPosition.top * zoom,
                    left: elementPosition.left * zoom,
                    width: elementPosition.width * zoom,
                    height: elementPosition.height * zoom
                };
            }
            else if (isAnchor(anchor)) {
                around = {
                    top: anchor.y,
                    left: anchor.x,
                    width: anchor.width || 1,
                    height: anchor.height || 2
                };
            }
            else {
                around = {
                    top: anchor.posy,
                    left: anchor.posx,
                    // We are about to position the context view where the mouse
                    // cursor is. To prevent the view being exactly under the mouse
                    // when showing and thus potentially triggering an action within,
                    // we treat the mouse location like a small sized block element.
                    width: 2,
                    height: 2
                };
            }
            const viewSizeWidth = DOM.getTotalWidth(this.view);
            const viewSizeHeight = DOM.getTotalHeight(this.view);
            const anchorPosition = this.delegate.anchorPosition || 0 /* AnchorPosition.BELOW */;
            const anchorAlignment = this.delegate.anchorAlignment || 0 /* AnchorAlignment.LEFT */;
            const anchorAxisAlignment = this.delegate.anchorAxisAlignment || 0 /* AnchorAxisAlignment.VERTICAL */;
            let top;
            let left;
            const activeWindow = DOM.getActiveWindow();
            if (anchorAxisAlignment === 0 /* AnchorAxisAlignment.VERTICAL */) {
                const verticalAnchor = { offset: around.top - activeWindow.pageYOffset, size: around.height, position: anchorPosition === 0 /* AnchorPosition.BELOW */ ? 0 /* LayoutAnchorPosition.Before */ : 1 /* LayoutAnchorPosition.After */ };
                const horizontalAnchor = { offset: around.left, size: around.width, position: anchorAlignment === 0 /* AnchorAlignment.LEFT */ ? 0 /* LayoutAnchorPosition.Before */ : 1 /* LayoutAnchorPosition.After */, mode: LayoutAnchorMode.ALIGN };
                top = layout(activeWindow.innerHeight, viewSizeHeight, verticalAnchor) + activeWindow.pageYOffset;
                // if view intersects vertically with anchor,  we must avoid the anchor
                if (range_1.Range.intersects({ start: top, end: top + viewSizeHeight }, { start: verticalAnchor.offset, end: verticalAnchor.offset + verticalAnchor.size })) {
                    horizontalAnchor.mode = LayoutAnchorMode.AVOID;
                }
                left = layout(activeWindow.innerWidth, viewSizeWidth, horizontalAnchor);
            }
            else {
                const horizontalAnchor = { offset: around.left, size: around.width, position: anchorAlignment === 0 /* AnchorAlignment.LEFT */ ? 0 /* LayoutAnchorPosition.Before */ : 1 /* LayoutAnchorPosition.After */ };
                const verticalAnchor = { offset: around.top, size: around.height, position: anchorPosition === 0 /* AnchorPosition.BELOW */ ? 0 /* LayoutAnchorPosition.Before */ : 1 /* LayoutAnchorPosition.After */, mode: LayoutAnchorMode.ALIGN };
                left = layout(activeWindow.innerWidth, viewSizeWidth, horizontalAnchor);
                // if view intersects horizontally with anchor, we must avoid the anchor
                if (range_1.Range.intersects({ start: left, end: left + viewSizeWidth }, { start: horizontalAnchor.offset, end: horizontalAnchor.offset + horizontalAnchor.size })) {
                    verticalAnchor.mode = LayoutAnchorMode.AVOID;
                }
                top = layout(activeWindow.innerHeight, viewSizeHeight, verticalAnchor) + activeWindow.pageYOffset;
            }
            this.view.classList.remove('top', 'bottom', 'left', 'right');
            this.view.classList.add(anchorPosition === 0 /* AnchorPosition.BELOW */ ? 'bottom' : 'top');
            this.view.classList.add(anchorAlignment === 0 /* AnchorAlignment.LEFT */ ? 'left' : 'right');
            this.view.classList.toggle('fixed', this.useFixedPosition);
            const containerPosition = DOM.getDomNodePagePosition(this.container);
            this.view.style.top = `${top - (this.useFixedPosition ? DOM.getDomNodePagePosition(this.view).top : containerPosition.top)}px`;
            this.view.style.left = `${left - (this.useFixedPosition ? DOM.getDomNodePagePosition(this.view).left : containerPosition.left)}px`;
            this.view.style.width = 'initial';
        }
        hide(data) {
            const delegate = this.delegate;
            this.delegate = null;
            if (delegate?.onHide) {
                delegate.onHide(data);
            }
            this.toDisposeOnClean.dispose();
            DOM.hide(this.view);
        }
        isVisible() {
            return !!this.delegate;
        }
        onDOMEvent(e, onCapture) {
            if (this.delegate) {
                if (this.delegate.onDOMEvent) {
                    this.delegate.onDOMEvent(e, DOM.getWindow(e).document.activeElement);
                }
                else if (onCapture && !DOM.isAncestor(e.target, this.container)) {
                    this.hide();
                }
            }
        }
        dispose() {
            this.hide();
            super.dispose();
        }
    }
    exports.ContextView = ContextView;
    const SHADOW_ROOT_CSS = /* css */ `
	:host {
		all: initial; /* 1st rule so subsequent properties are reset. */
	}

	.codicon[class*='codicon-'] {
		font: normal normal normal 16px/1 codicon;
		display: inline-block;
		text-decoration: none;
		text-rendering: auto;
		text-align: center;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
	}

	:host {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", "HelveticaNeue-Light", system-ui, "Ubuntu", "Droid Sans", sans-serif;
	}

	:host-context(.mac) { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
	:host-context(.mac:lang(zh-Hans)) { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", sans-serif; }
	:host-context(.mac:lang(zh-Hant)) { font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif; }
	:host-context(.mac:lang(ja)) { font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic Pro", sans-serif; }
	:host-context(.mac:lang(ko)) { font-family: -apple-system, BlinkMacSystemFont, "Nanum Gothic", "Apple SD Gothic Neo", "AppleGothic", sans-serif; }

	:host-context(.windows) { font-family: "Segoe WPC", "Segoe UI", sans-serif; }
	:host-context(.windows:lang(zh-Hans)) { font-family: "Segoe WPC", "Segoe UI", "Microsoft YaHei", sans-serif; }
	:host-context(.windows:lang(zh-Hant)) { font-family: "Segoe WPC", "Segoe UI", "Microsoft Jhenghei", sans-serif; }
	:host-context(.windows:lang(ja)) { font-family: "Segoe WPC", "Segoe UI", "Yu Gothic UI", "Meiryo UI", sans-serif; }
	:host-context(.windows:lang(ko)) { font-family: "Segoe WPC", "Segoe UI", "Malgun Gothic", "Dotom", sans-serif; }

	:host-context(.linux) { font-family: system-ui, "Ubuntu", "Droid Sans", sans-serif; }
	:host-context(.linux:lang(zh-Hans)) { font-family: system-ui, "Ubuntu", "Droid Sans", "Source Han Sans SC", "Source Han Sans CN", "Source Han Sans", sans-serif; }
	:host-context(.linux:lang(zh-Hant)) { font-family: system-ui, "Ubuntu", "Droid Sans", "Source Han Sans TC", "Source Han Sans TW", "Source Han Sans", sans-serif; }
	:host-context(.linux:lang(ja)) { font-family: system-ui, "Ubuntu", "Droid Sans", "Source Han Sans J", "Source Han Sans JP", "Source Han Sans", sans-serif; }
	:host-context(.linux:lang(ko)) { font-family: system-ui, "Ubuntu", "Droid Sans", "Source Han Sans K", "Source Han Sans JR", "Source Han Sans", "UnDotum", "FBaekmuk Gulim", sans-serif; }
`;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dHZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvY29udGV4dHZpZXcvY29udGV4dHZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0JoRyw0QkFJQztJQTRFRCx3QkF5QkM7SUF0SEQsSUFBa0Isc0JBSWpCO0lBSkQsV0FBa0Isc0JBQXNCO1FBQ3ZDLDJFQUFZLENBQUE7UUFDWixxRUFBSyxDQUFBO1FBQ0wsbUZBQVksQ0FBQTtJQUNiLENBQUMsRUFKaUIsc0JBQXNCLHNDQUF0QixzQkFBc0IsUUFJdkM7SUFTRCxTQUFnQixRQUFRLENBQUMsR0FBWTtRQUNwQyxNQUFNLE1BQU0sR0FBRyxHQUFrRCxDQUFDO1FBRWxFLE9BQU8sQ0FBQyxDQUFDLE1BQU0sSUFBSSxPQUFPLE1BQU0sQ0FBQyxDQUFDLEtBQUssUUFBUSxJQUFJLE9BQU8sTUFBTSxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUM7SUFDakYsQ0FBQztJQUVELElBQWtCLGVBRWpCO0lBRkQsV0FBa0IsZUFBZTtRQUNoQyxxREFBSSxDQUFBO1FBQUUsdURBQUssQ0FBQTtJQUNaLENBQUMsRUFGaUIsZUFBZSwrQkFBZixlQUFlLFFBRWhDO0lBRUQsSUFBa0IsY0FFakI7SUFGRCxXQUFrQixjQUFjO1FBQy9CLHFEQUFLLENBQUE7UUFBRSxxREFBSyxDQUFBO0lBQ2IsQ0FBQyxFQUZpQixjQUFjLDhCQUFkLGNBQWMsUUFFL0I7SUFFRCxJQUFrQixtQkFFakI7SUFGRCxXQUFrQixtQkFBbUI7UUFDcEMscUVBQVEsQ0FBQTtRQUFFLHlFQUFVLENBQUE7SUFDckIsQ0FBQyxFQUZpQixtQkFBbUIsbUNBQW5CLG1CQUFtQixRQUVwQztJQTBDRCxJQUFrQixvQkFHakI7SUFIRCxXQUFrQixvQkFBb0I7UUFD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