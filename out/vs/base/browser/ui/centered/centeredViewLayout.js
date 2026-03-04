/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/splitview/splitview", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, dom_1, splitview_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CenteredViewLayout = void 0;
    const defaultState = {
        targetWidth: 900,
        leftMarginRatio: 0.1909,
        rightMarginRatio: 0.1909,
    };
    const distributeSizing = { type: 'distribute' };
    function createEmptyView(background) {
        const element = (0, dom_1.$)('.centered-layout-margin');
        element.style.height = '100%';
        if (background) {
            element.style.backgroundColor = background.toString();
        }
        return {
            element,
            layout: () => undefined,
            minimumSize: 60,
            maximumSize: Number.POSITIVE_INFINITY,
            onDidChange: event_1.Event.None
        };
    }
    function toSplitViewView(view, getHeight) {
        return {
            element: view.element,
            get maximumSize() { return view.maximumWidth; },
            get minimumSize() { return view.minimumWidth; },
            onDidChange: event_1.Event.map(view.onDidChange, e => e && e.width),
            layout: (size, offset, ctx) => view.layout(size, getHeight(), ctx?.top ?? 0, (ctx?.left ?? 0) + offset)
        };
    }
    class CenteredViewLayout {
        constructor(container, view, state = { ...defaultState }, centeredLayoutFixedWidth = false) {
            this.container = container;
            this.view = view;
            this.state = state;
            this.centeredLayoutFixedWidth = centeredLayoutFixedWidth;
            this.lastLayoutPosition = { width: 0, height: 0, left: 0, top: 0 };
            this.didLayout = false;
            this.splitViewDisposables = new lifecycle_1.DisposableStore();
            this._boundarySashes = {};
            this.container.appendChild(this.view.element);
            // Make sure to hide the split view overflow like sashes #52892
            this.container.style.overflow = 'hidden';
        }
        get minimumWidth() { return this.splitView ? this.splitView.minimumSize : this.view.minimumWidth; }
        get maximumWidth() { return this.splitView ? this.splitView.maximumSize : this.view.maximumWidth; }
        get minimumHeight() { return this.view.minimumHeight; }
        get maximumHeight() { return this.view.maximumHeight; }
        get onDidChange() { return this.view.onDidChange; }
        get boundarySashes() { return this._boundarySashes; }
        set boundarySashes(boundarySashes) {
            this._boundarySashes = boundarySashes;
            if (!this.splitView) {
                return;
            }
            this.splitView.orthogonalStartSash = boundarySashes.top;
            this.splitView.orthogonalEndSash = boundarySashes.bottom;
        }
        layout(width, height, top, left) {
            this.lastLayoutPosition = { width, height, top, left };
            if (this.splitView) {
                this.splitView.layout(width, this.lastLayoutPosition);
                if (!this.didLayout || this.centeredLayoutFixedWidth) {
                    this.resizeSplitViews();
                }
            }
            else {
                this.view.layout(width, height, top, left);
            }
            this.didLayout = true;
        }
        resizeSplitViews() {
            if (!this.splitView) {
                return;
            }
            if (this.centeredLayoutFixedWidth) {
                const centerViewWidth = Math.min(this.lastLayoutPosition.width, this.state.targetWidth);
                const marginWidthFloat = (this.lastLayoutPosition.width - centerViewWidth) / 2;
                this.splitView.resizeView(0, Math.floor(marginWidthFloat));
                this.splitView.resizeView(1, centerViewWidth);
                this.splitView.resizeView(2, Math.ceil(marginWidthFloat));
            }
            else {
                const leftMargin = this.state.leftMarginRatio * this.lastLayoutPosition.width;
                const rightMargin = this.state.rightMarginRatio * this.lastLayoutPosition.width;
                const center = this.lastLayoutPosition.width - leftMargin - rightMargin;
                this.splitView.resizeView(0, leftMargin);
                this.splitView.resizeView(1, center);
                this.splitView.resizeView(2, rightMargin);
            }
        }
        setFixedWidth(option) {
            this.centeredLayoutFixedWidth = option;
            if (!!this.splitView) {
                this.updateState();
                this.resizeSplitViews();
            }
        }
        updateState() {
            if (!!this.splitView) {
                this.state.targetWidth = this.splitView.getViewSize(1);
                this.state.leftMarginRatio = this.splitView.getViewSize(0) / this.lastLayoutPosition.width;
                this.state.rightMarginRatio = this.splitView.getViewSize(2) / this.lastLayoutPosition.width;
            }
        }
        isActive() {
            return !!this.splitView;
        }
        styles(style) {
            this.style = style;
            if (this.splitView && this.emptyViews) {
                this.splitView.style(this.style);
                this.emptyViews[0].element.style.backgroundColor = this.style.background.toString();
                this.emptyViews[1].element.style.backgroundColor = this.style.background.toString();
            }
        }
        activate(active) {
            if (active === this.isActive()) {
                return;
            }
            if (active) {
                this.container.removeChild(this.view.element);
                this.splitView = new splitview_1.SplitView(this.container, {
                    inverseAltBehavior: true,
                    orientation: 1 /* Orientation.HORIZONTAL */,
                    styles: this.style
                });
                this.splitView.orthogonalStartSash = this.boundarySashes.top;
                this.splitView.orthogonalEndSash = this.boundarySashes.bottom;
                this.splitViewDisposables.add(this.splitView.onDidSashChange(() => {
                    if (!!this.splitView) {
                        this.updateState();
                    }
                }));
                this.splitViewDisposables.add(this.splitView.onDidSashReset(() => {
                    this.state = { ...defaultState };
                    this.resizeSplitViews();
                }));
                this.splitView.layout(this.lastLayoutPosition.width, this.lastLayoutPosition);
                const backgroundColor = this.style ? this.style.background : undefined;
                this.emptyViews = [createEmptyView(backgroundColor), createEmptyView(backgroundColor)];
                this.splitView.addView(this.emptyViews[0], distributeSizing, 0);
                this.splitView.addView(toSplitViewView(this.view, () => this.lastLayoutPosition.height), distributeSizing, 1);
                this.splitView.addView(this.emptyViews[1], distributeSizing, 2);
                this.resizeSplitViews();
            }
            else {
                if (this.splitView) {
                    this.container.removeChild(this.splitView.el);
                }
                this.splitViewDisposables.clear();
                this.splitView?.dispose();
                this.splitView = undefined;
                this.emptyViews = undefined;
                this.container.appendChild(this.view.element);
                this.view.layout(this.lastLayoutPosition.width, this.lastLayoutPosition.height, this.lastLayoutPosition.top, this.lastLayoutPosition.left);
            }
        }
        isDefault(state) {
            if (this.centeredLayoutFixedWidth) {
                return state.targetWidth === defaultState.targetWidth;
            }
            else {
                return state.leftMarginRatio === defaultState.leftMarginRatio
                    && state.rightMarginRatio === defaultState.rightMarginRatio;
            }
        }
        dispose() {
            this.splitViewDisposables.dispose();
            if (this.splitView) {
                this.splitView.dispose();
                this.splitView = undefined;
            }
        }
    }
    exports.CenteredViewLayout = CenteredViewLayout;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VudGVyZWRWaWV3TGF5b3V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL2NlbnRlcmVkL2NlbnRlcmVkVmlld0xheW91dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQmhHLE1BQU0sWUFBWSxHQUFzQjtRQUN2QyxXQUFXLEVBQUUsR0FBRztRQUNoQixlQUFlLEVBQUUsTUFBTTtRQUN2QixnQkFBZ0IsRUFBRSxNQUFNO0tBQ3hCLENBQUM7SUFFRixNQUFNLGdCQUFnQixHQUFxQixFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQztJQUVsRSxTQUFTLGVBQWUsQ0FBQyxVQUE2QjtRQUNyRCxNQUFNLE9BQU8sR0FBRyxJQUFBLE9BQUMsRUFBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzdDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUM5QixJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN2RCxDQUFDO1FBRUQsT0FBTztZQUNOLE9BQU87WUFDUCxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztZQUN2QixXQUFXLEVBQUUsRUFBRTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsaUJBQWlCO1lBQ3JDLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSTtTQUN2QixDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFDLElBQVcsRUFBRSxTQUF1QjtRQUM1RCxPQUFPO1lBQ04sT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1lBQ3JCLElBQUksV0FBVyxLQUFLLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDL0Ms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