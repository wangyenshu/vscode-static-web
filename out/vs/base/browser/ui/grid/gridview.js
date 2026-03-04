/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/splitview/splitview", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/types", "vs/base/browser/ui/sash/sash", "vs/base/browser/ui/splitview/splitview", "vs/css!./gridview"], function (require, exports, dom_1, splitview_1, arrays_1, color_1, event_1, lifecycle_1, numbers_1, types_1, sash_1, splitview_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GridView = exports.Sizing = exports.LayoutPriority = exports.Orientation = void 0;
    exports.orthogonal = orthogonal;
    exports.isGridBranchNode = isGridBranchNode;
    Object.defineProperty(exports, "Orientation", { enumerable: true, get: function () { return sash_1.Orientation; } });
    Object.defineProperty(exports, "LayoutPriority", { enumerable: true, get: function () { return splitview_2.LayoutPriority; } });
    Object.defineProperty(exports, "Sizing", { enumerable: true, get: function () { return splitview_2.Sizing; } });
    const defaultStyles = {
        separatorBorder: color_1.Color.transparent
    };
    function orthogonal(orientation) {
        return orientation === 0 /* Orientation.VERTICAL */ ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */;
    }
    function isGridBranchNode(node) {
        return !!node.children;
    }
    class LayoutController {
        constructor(isLayoutEnabled) {
            this.isLayoutEnabled = isLayoutEnabled;
        }
    }
    function toAbsoluteBoundarySashes(sashes, orientation) {
        if (orientation === 1 /* Orientation.HORIZONTAL */) {
            return { left: sashes.start, right: sashes.end, top: sashes.orthogonalStart, bottom: sashes.orthogonalEnd };
        }
        else {
            return { top: sashes.start, bottom: sashes.end, left: sashes.orthogonalStart, right: sashes.orthogonalEnd };
        }
    }
    function fromAbsoluteBoundarySashes(sashes, orientation) {
        if (orientation === 1 /* Orientation.HORIZONTAL */) {
            return { start: sashes.left, end: sashes.right, orthogonalStart: sashes.top, orthogonalEnd: sashes.bottom };
        }
        else {
            return { start: sashes.top, end: sashes.bottom, orthogonalStart: sashes.left, orthogonalEnd: sashes.right };
        }
    }
    function validateIndex(index, numChildren) {
        if (Math.abs(index) > numChildren) {
            throw new Error('Invalid index');
        }
        return (0, numbers_1.rot)(index, numChildren + 1);
    }
    class BranchNode {
        get size() { return this._size; }
        get orthogonalSize() { return this._orthogonalSize; }
        get absoluteOffset() { return this._absoluteOffset; }
        get absoluteOrthogonalOffset() { return this._absoluteOrthogonalOffset; }
        get styles() { return this._styles; }
        get width() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.size : this.orthogonalSize;
        }
        get height() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.orthogonalSize : this.size;
        }
        get top() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this._absoluteOffset : this._absoluteOrthogonalOffset;
        }
        get left() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this._absoluteOrthogonalOffset : this._absoluteOffset;
        }
        get minimumSize() {
            return this.children.length === 0 ? 0 : Math.max(...this.children.map((c, index) => this.splitview.isViewVisible(index) ? c.minimumOrthogonalSize : 0));
        }
        get maximumSize() {
            return Math.min(...this.children.map((c, index) => this.splitview.isViewVisible(index) ? c.maximumOrthogonalSize : Number.POSITIVE_INFINITY));
        }
        get priority() {
            if (this.children.length === 0) {
                return 0 /* LayoutPriority.Normal */;
            }
            const priorities = this.children.map(c => typeof c.priority === 'undefined' ? 0 /* LayoutPriority.Normal */ : c.priority);
            if (priorities.some(p => p === 2 /* LayoutPriority.High */)) {
                return 2 /* LayoutPriority.High */;
            }
            else if (priorities.some(p => p === 1 /* LayoutPriority.Low */)) {
                return 1 /* LayoutPriority.Low */;
            }
            return 0 /* LayoutPriority.Normal */;
        }
        get proportionalLayout() {
            if (this.children.length === 0) {
                return true;
            }
            return this.children.every(c => c.proportionalLayout);
        }
        get minimumOrthogonalSize() {
            return this.splitview.minimumSize;
        }
        get maximumOrthogonalSize() {
            return this.splitview.maximumSize;
        }
        get minimumWidth() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.minimumOrthogonalSize : this.minimumSize;
        }
        get minimumHeight() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.minimumSize : this.minimumOrthogonalSize;
        }
        get maximumWidth() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.maximumOrthogonalSize : this.maximumSize;
        }
        get maximumHeight() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.maximumSize : this.maximumOrthogonalSize;
        }
        get boundarySashes() { return this._boundarySashes; }
        set boundarySashes(boundarySashes) {
            if (this._boundarySashes.start === boundarySashes.start
                && this._boundarySashes.end === boundarySashes.end
                && this._boundarySashes.orthogonalStart === boundarySashes.orthogonalStart
                && this._boundarySashes.orthogonalEnd === boundarySashes.orthogonalEnd) {
                return;
            }
            this._boundarySashes = boundarySashes;
            this.splitview.orthogonalStartSash = boundarySashes.orthogonalStart;
            this.splitview.orthogonalEndSash = boundarySashes.orthogonalEnd;
            for (let index = 0; index < this.children.length; index++) {
                const child = this.children[index];
                const first = index === 0;
                const last = index === this.children.length - 1;
                child.boundarySashes = {
                    start: boundarySashes.orthogonalStart,
                    end: boundarySashes.orthogonalEnd,
                    orthogonalStart: first ? boundarySashes.start : child.boundarySashes.orthogonalStart,
                    orthogonalEnd: last ? boundarySashes.end : child.boundarySashes.orthogonalEnd,
                };
            }
        }
        get edgeSnapping() { return this._edgeSnapping; }
        set edgeSnapping(edgeSnapping) {
            if (this._edgeSnapping === edgeSnapping) {
                return;
            }
            this._edgeSnapping = edgeSnapping;
            for (const child of this.children) {
                if (child instanceof BranchNode) {
                    child.edgeSnapping = edgeSnapping;
                }
            }
            this.updateSplitviewEdgeSnappingEnablement();
        }
        constructor(orientation, layoutController, styles, splitviewProportionalLayout, size = 0, orthogonalSize = 0, edgeSnapping = false, childDescriptors) {
            this.orientation = orientation;
            this.layoutController = layoutController;
            this.splitviewProportionalLayout = splitviewProportionalLayout;
            this.children = [];
            this._absoluteOffset = 0;
            this._absoluteOrthogonalOffset = 0;
            this.absoluteOrthogonalSize = 0;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._onDidVisibilityChange = new event_1.Emitter();
            this.onDidVisibilityChange = this._onDidVisibilityChange.event;
            this.childrenVisibilityChangeDisposable = new lifecycle_1.DisposableStore();
            this._onDidScroll = new event_1.Emitter();
            this.onDidScrollDisposable = lifecycle_1.Disposable.None;
            this.onDidScroll = this._onDidScroll.event;
            this.childrenChangeDisposable = lifecycle_1.Disposable.None;
            this._onDidSashReset = new event_1.Emitter();
            this.onDidSashReset = this._onDidSashReset.event;
            this.splitviewSashResetDisposable = lifecycle_1.Disposable.None;
            this.childrenSashResetDisposable = lifecycle_1.Disposable.None;
            this._boundarySashes = {};
            this._edgeSnapping = false;
            this._styles = styles;
            this._size = size;
            this._orthogonalSize = orthogonalSize;
            this.element = (0, dom_1.$)('.monaco-grid-branch-node');
            if (!childDescriptors) {
                // Normal behavior, we have no children yet, just set up the splitview
                this.splitview = new splitview_1.SplitView(this.element, { orientation, styles, proportionalLayout: splitviewProportionalLayout });
                this.splitview.layout(size, { orthogonalSize, absoluteOffset: 0, absoluteOrthogonalOffset: 0, absoluteSize: size, absoluteOrthogonalSize: orthogonalSize });
            }
            else {
                // Reconstruction behavior, we want to reconstruct a splitview
                const descriptor = {
                    views: childDescriptors.map(childDescriptor => {
                        return {
                            view: childDescriptor.node,
                            size: childDescriptor.node.size,
                            visible: childDescriptor.visible !== false
                        };
                    }),
                    size: this.orthogonalSize
                };
                const options = { proportionalLayout: splitviewProportionalLayout, orientation, styles };
                this.children = childDescriptors.map(c => c.node);
                this.splitview = new splitview_1.SplitView(this.element, { ...options, descriptor });
                this.children.forEach((node, index) => {
                    const first = index === 0;
                    const last = index === this.children.length;
                    node.boundarySashes = {
                        start: this.boundarySashes.orthogonalStart,
                        end: this.boundarySashes.orthogonalEnd,
                        orthogonalStart: first ? this.boundarySashes.start : this.splitview.sashes[index - 1],
                        orthogonalEnd: last ? this.boundarySashes.end : this.splitview.sashes[index],
                    };
                });
            }
            const onDidSashReset = event_1.Event.map(this.splitview.onDidSashReset, i => [i]);
            this.splitviewSashResetDisposable = onDidSashReset(this._onDidSashReset.fire, this._onDidSashReset);
            this.updateChildrenEvents();
        }
        style(styles) {
            this._styles = styles;
            this.splitview.style(styles);
            for (const child of this.children) {
                if (child instanceof BranchNode) {
                    child.style(styles);
                }
            }
        }
        layout(size, offset, ctx) {
            if (!this.layoutController.isLayoutEnabled) {
                return;
            }
            if (typeof ctx === 'undefined') {
                throw new Error('Invalid state');
            }
            // branch nodes should flip the normal/orthogonal directions
            this._size = ctx.orthogonalSize;
            this._orthogonalSize = size;
            this._absoluteOffset = ctx.absoluteOffset + offset;
            this._absoluteOrthogonalOffset = ctx.absoluteOrthogonalOffset;
            this.absoluteOrthogonalSize = ctx.absoluteOrthogonalSize;
            this.splitview.layout(ctx.orthogonalSize, {
                orthogonalSize: size,
                absoluteOffset: this._absoluteOrthogonalOffset,
                absoluteOrthogonalOffset: this._absoluteOffset,
                absoluteSize: ctx.absoluteOrthogonalSize,
                absoluteOrthogonalSize: ctx.absoluteSize
            });
            this.updateSplitviewEdgeSnappingEnablement();
        }
        setVisible(visible) {
            for (const child of this.children) {
                child.setVisible(visible);
            }
        }
        addChild(node, size, index, skipLayout) {
            index = validateIndex(index, this.children.length);
            this.splitview.addView(node, size, index, skipLayout);
            this.children.splice(index, 0, node);
            this.updateBoundarySashes();
            this.onDidChildrenChange();
        }
        removeChild(index, sizing) {
            index = validateIndex(index, this.children.length);
            const result = this.splitview.removeView(index, sizing);
            this.children.splice(index, 1);
            this.updateBoundarySashes();
            this.onDidChildrenChange();
            return result;
        }
        removeAllChildren() {
            const result = this.splitview.removeAllViews();
            this.children.splice(0, this.children.length);
            this.updateBoundarySashes();
            this.onDidChildrenChange();
            return result;
        }
        moveChild(from, to) {
            from = validateIndex(from, this.children.length);
            to = validateIndex(to, this.children.length);
            if (from === to) {
                return;
            }
            if (from < to) {
                to -= 1;
            }
            this.splitview.moveView(from, to);
            this.children.splice(to, 0, this.children.splice(from, 1)[0]);
            this.updateBoundarySashes();
            this.onDidChildrenChange();
        }
        swapChildren(from, to) {
            from = validateIndex(from, this.children.length);
            to = validateIndex(to, this.children.length);
            if (from === to) {
                return;
            }
            this.splitview.swapViews(from, to);
            // swap boundary sashes
            [this.children[from].boundarySashes, this.children[to].boundarySashes]
                = [this.children[from].boundarySashes, this.children[to].boundarySashes];
            // swap children
            [this.children[from], this.children[to]] = [this.children[to], this.children[from]];
            this.onDidChildrenChange();
        }
        resizeChild(index, size) {
            index = validateIndex(index, this.children.length);
            this.splitview.resizeView(index, size);
        }
        isChildExpanded(index) {
            return this.splitview.isViewExpanded(index);
        }
        distributeViewSizes(recursive = false) {
            this.splitview.distributeViewSizes();
            if (recursive) {
                for (const child of this.children) {
                    if (child instanceof BranchNode) {
                        child.distributeViewSizes(true);
                    }
                }
            }
        }
        getChildSize(index) {
            index = validateIndex(index, this.children.length);
            return this.splitview.getViewSize(index);
        }
        isChildVisible(index) {
            index = validateIndex(index, this.children.length);
            return this.splitview.isViewVisible(index);
        }
        setChildVisible(index, visible) {
            index = validateIndex(index, this.children.length);
            if (this.splitview.isViewVisible(index) === visible) {
                return;
            }
            const wereAllChildrenHidden = this.splitview.contentSize === 0;
            this.splitview.setViewVisible(index, visible);
            const areAllChildrenHidden = this.splitview.contentSize === 0;
            // If all children are hidden then the parent should hide the entire splitview
            // If the entire splitview is hidden then the parent should show the splitview when a child is shown
            if ((visible && wereAllChildrenHidden) || (!visible && areAllChildrenHidden)) {
                this._onDidVisibilityChange.fire(visible);
            }
        }
        getChildCachedVisibleSize(index) {
            index = validateIndex(index, this.children.length);
            return this.splitview.getViewCachedVisibleSize(index);
        }
        updateBoundarySashes() {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].boundarySashes = {
                    start: this.boundarySashes.orthogonalStart,
                    end: this.boundarySashes.orthogonalEnd,
                    orthogonalStart: i === 0 ? this.boundarySashes.start : this.splitview.sashes[i - 1],
                    orthogonalEnd: i === this.children.length - 1 ? this.boundarySashes.end : this.splitview.sashes[i],
                };
            }
        }
        onDidChildrenChange() {
            this.updateChildrenEvents();
            this._onDidChange.fire(undefined);
        }
        updateChildrenEvents() {
            const onDidChildrenChange = event_1.Event.map(event_1.Event.any(...this.children.map(c => c.onDidChange)), () => undefined);
            this.childrenChangeDisposable.dispose();
            this.childrenChangeDisposable = onDidChildrenChange(this._onDidChange.fire, this._onDidChange);
            const onDidChildrenSashReset = event_1.Event.any(...this.children.map((c, i) => event_1.Event.map(c.onDidSashReset, location => [i, ...location])));
            this.childrenSashResetDisposable.dispose();
            this.childrenSashResetDisposable = onDidChildrenSashReset(this._onDidSashReset.fire, this._onDidSashReset);
            const onDidScroll = event_1.Event.any(event_1.Event.signal(this.splitview.onDidScroll), ...this.children.map(c => c.onDidScroll));
            this.onDidScrollDisposable.dispose();
            this.onDidScrollDisposable = onDidScroll(this._onDidScroll.fire, this._onDidScroll);
            this.childrenVisibilityChangeDisposable.clear();
            this.children.forEach((child, index) => {
                if (child instanceof BranchNode) {
                    this.childrenVisibilityChangeDisposable.add(child.onDidVisibilityChange((visible) => {
                        this.setChildVisible(index, visible);
                    }));
                }
            });
        }
        trySet2x2(other) {
            if (this.children.length !== 2 || other.children.length !== 2) {
                return lifecycle_1.Disposable.None;
            }
            if (this.getChildSize(0) !== other.getChildSize(0)) {
                return lifecycle_1.Disposable.None;
            }
            const [firstChild, secondChild] = this.children;
            const [otherFirstChild, otherSecondChild] = other.children;
            if (!(firstChild instanceof LeafNode) || !(secondChild instanceof LeafNode)) {
                return lifecycle_1.Disposable.None;
            }
            if (!(otherFirstChild instanceof LeafNode) || !(otherSecondChild instanceof LeafNode)) {
                return lifecycle_1.Disposable.None;
            }
            if (this.orientation === 0 /* Orientation.VERTICAL */) {
                secondChild.linkedWidthNode = otherFirstChild.linkedHeightNode = firstChild;
                firstChild.linkedWidthNode = otherSecondChild.linkedHeightNode = secondChild;
                otherSecondChild.linkedWidthNode = firstChild.linkedHeightNode = otherFirstChild;
                otherFirstChild.linkedWidthNode = secondChild.linkedHeightNode = otherSecondChild;
            }
            else {
                otherFirstChild.linkedWidthNode = secondChild.linkedHeightNode = firstChild;
                otherSecondChild.linkedWidthNode = firstChild.linkedHeightNode = secondChild;
                firstChild.linkedWidthNode = otherSecondChild.linkedHeightNode = otherFirstChild;
                secondChild.linkedWidthNode = otherFirstChild.linkedHeightNode = otherSecondChild;
            }
            const mySash = this.splitview.sashes[0];
            const otherSash = other.splitview.sashes[0];
            mySash.linkedSash = otherSash;
            otherSash.linkedSash = mySash;
            this._onDidChange.fire(undefined);
            other._onDidChange.fire(undefined);
            return (0, lifecycle_1.toDisposable)(() => {
                mySash.linkedSash = otherSash.linkedSash = undefined;
                firstChild.linkedHeightNode = firstChild.linkedWidthNode = undefined;
                secondChild.linkedHeightNode = secondChild.linkedWidthNode = undefined;
                otherFirstChild.linkedHeightNode = otherFirstChild.linkedWidthNode = undefined;
                otherSecondChild.linkedHeightNode = otherSecondChild.linkedWidthNode = undefined;
            });
        }
        updateSplitviewEdgeSnappingEnablement() {
            this.splitview.startSnappingEnabled = this._edgeSnapping || this._absoluteOrthogonalOffset > 0;
            this.splitview.endSnappingEnabled = this._edgeSnapping || this._absoluteOrthogonalOffset + this._size < this.absoluteOrthogonalSize;
        }
        dispose() {
            for (const child of this.children) {
                child.dispose();
            }
            this._onDidChange.dispose();
            this._onDidSashReset.dispose();
            this._onDidVisibilityChange.dispose();
            this.childrenVisibilityChangeDisposable.dispose();
            this.splitviewSashResetDisposable.dispose();
            this.childrenSashResetDisposable.dispose();
            this.childrenChangeDisposable.dispose();
            this.onDidScrollDisposable.dispose();
            this.splitview.dispose();
        }
    }
    /**
     * Creates a latched event that avoids being fired when the view
     * constraints do not change at all.
     */
    function createLatchedOnDidChangeViewEvent(view) {
        const [onDidChangeViewConstraints, onDidSetViewSize] = event_1.Event.split(view.onDidChange, types_1.isUndefined);
        return event_1.Event.any(onDidSetViewSize, event_1.Event.map(event_1.Event.latch(event_1.Event.map(onDidChangeViewConstraints, _ => ([view.minimumWidth, view.maximumWidth, view.minimumHeight, view.maximumHeight])), arrays_1.equals), _ => undefined));
    }
    class LeafNode {
        get size() { return this._size; }
        get orthogonalSize() { return this._orthogonalSize; }
        get linkedWidthNode() { return this._linkedWidthNode; }
        set linkedWidthNode(node) {
            this._onDidLinkedWidthNodeChange.input = node ? node._onDidViewChange : event_1.Event.None;
            this._linkedWidthNode = node;
            this._onDidSetLinkedNode.fire(undefined);
        }
        get linkedHeightNode() { return this._linkedHeightNode; }
        set linkedHeightNode(node) {
            this._onDidLinkedHeightNodeChange.input = node ? node._onDidViewChange : event_1.Event.None;
            this._linkedHeightNode = node;
            this._onDidSetLinkedNode.fire(undefined);
        }
        constructor(view, orientation, layoutController, orthogonalSize, size = 0) {
            this.view = view;
            this.orientation = orientation;
            this.layoutController = layoutController;
            this._size = 0;
            this.absoluteOffset = 0;
            this.absoluteOrthogonalOffset = 0;
            this.onDidScroll = event_1.Event.None;
            this.onDidSashReset = event_1.Event.None;
            this._onDidLinkedWidthNodeChange = new event_1.Relay();
            this._linkedWidthNode = undefined;
            this._onDidLinkedHeightNodeChange = new event_1.Relay();
            this._linkedHeightNode = undefined;
            this._onDidSetLinkedNode = new event_1.Emitter();
            this.disposables = new lifecycle_1.DisposableStore();
            this._boundarySashes = {};
            this.cachedWidth = 0;
            this.cachedHeight = 0;
            this.cachedTop = 0;
            this.cachedLeft = 0;
            this._orthogonalSize = orthogonalSize;
            this._size = size;
            const onDidChange = createLatchedOnDidChangeViewEvent(view);
            this._onDidViewChange = event_1.Event.map(onDidChange, e => e && (this.orientation === 0 /* Orientation.VERTICAL */ ? e.width : e.height), this.disposables);
            this.onDidChange = event_1.Event.any(this._onDidViewChange, this._onDidSetLinkedNode.event, this._onDidLinkedWidthNodeChange.event, this._onDidLinkedHeightNodeChange.event);
        }
        get width() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.orthogonalSize : this.size;
        }
        get height() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.size : this.orthogonalSize;
        }
        get top() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.absoluteOffset : this.absoluteOrthogonalOffset;
        }
        get left() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.absoluteOrthogonalOffset : this.absoluteOffset;
        }
        get element() {
            return this.view.element;
        }
        get minimumWidth() {
            return this.linkedWidthNode ? Math.max(this.linkedWidthNode.view.minimumWidth, this.view.minimumWidth) : this.view.minimumWidth;
        }
        get maximumWidth() {
            return this.linkedWidthNode ? Math.min(this.linkedWidthNode.view.maximumWidth, this.view.maximumWidth) : this.view.maximumWidth;
        }
        get minimumHeight() {
            return this.linkedHeightNode ? Math.max(this.linkedHeightNode.view.minimumHeight, this.view.minimumHeight) : this.view.minimumHeight;
        }
        get maximumHeight() {
            return this.linkedHeightNode ? Math.min(this.linkedHeightNode.view.maximumHeight, this.view.maximumHeight) : this.view.maximumHeight;
        }
        get minimumSize() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.minimumHeight : this.minimumWidth;
        }
        get maximumSize() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.maximumHeight : this.maximumWidth;
        }
        get priority() {
            return this.view.priority;
        }
        get proportionalLayout() {
            return this.view.proportionalLayout ?? true;
        }
        get snap() {
            return this.view.snap;
        }
        get minimumOrthogonalSize() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.minimumWidth : this.minimumHeight;
        }
        get maximumOrthogonalSize() {
            return this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.maximumWidth : this.maximumHeight;
        }
        get boundarySashes() { return this._boundarySashes; }
        set boundarySashes(boundarySashes) {
            this._boundarySashes = boundarySashes;
            this.view.setBoundarySashes?.(toAbsoluteBoundarySashes(boundarySashes, this.orientation));
        }
        layout(size, offset, ctx) {
            if (!this.layoutController.isLayoutEnabled) {
                return;
            }
            if (typeof ctx === 'undefined') {
                throw new Error('Invalid state');
            }
            this._size = size;
            this._orthogonalSize = ctx.orthogonalSize;
            this.absoluteOffset = ctx.absoluteOffset + offset;
            this.absoluteOrthogonalOffset = ctx.absoluteOrthogonalOffset;
            this._layout(this.width, this.height, this.top, this.left);
        }
        _layout(width, height, top, left) {
            if (this.cachedWidth === width && this.cachedHeight === height && this.cachedTop === top && this.cachedLeft === left) {
                return;
            }
            this.cachedWidth = width;
            this.cachedHeight = height;
            this.cachedTop = top;
            this.cachedLeft = left;
            this.view.layout(width, height, top, left);
        }
        setVisible(visible) {
            this.view.setVisible?.(visible);
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    function flipNode(node, size, orthogonalSize) {
        if (node instanceof BranchNode) {
            const result = new BranchNode(orthogonal(node.orientation), node.layoutController, node.styles, node.splitviewProportionalLayout, size, orthogonalSize, node.edgeSnapping);
            let totalSize = 0;
            for (let i = node.children.length - 1; i >= 0; i--) {
                const child = node.children[i];
                const childSize = child instanceof BranchNode ? child.orthogonalSize : child.size;
                let newSize = node.size === 0 ? 0 : Math.round((size * childSize) / node.size);
                totalSize += newSize;
                // The last view to add should adjust to rounding errors
                if (i === 0) {
                    newSize += size - totalSize;
                }
                result.addChild(flipNode(child, orthogonalSize, newSize), newSize, 0, true);
            }
            node.dispose();
            return result;
        }
        else {
            const result = new LeafNode(node.view, orthogonal(node.orientation), node.layoutController, orthogonalSize);
            node.dispose();
            return result;
        }
    }
    /**
     * The {@link GridView} is the UI component which implements a two dimensional
     * flex-like layout algorithm for a collection of {@link IView} instances, which
     * are mostly HTMLElement instances with size constraints. A {@link GridView} is a
     * tree composition of multiple {@link SplitView} instances, orthogonal between
     * one another. It will respect view's size contraints, just like the SplitView.
     *
     * It has a low-level index based API, allowing for fine grain performant operations.
     * Look into the {@link Grid} widget for a higher-level API.
     *
     * Features:
     * - flex-like layout algorithm
     * - snap support
     * - corner sash support
     * - Alt key modifier behavior, macOS style
     * - layout (de)serialization
     */
    class GridView {
        get root() { return this._root; }
        set root(root) {
            const oldRoot = this._root;
            if (oldRoot) {
                this.element.removeChild(oldRoot.element);
                oldRoot.dispose();
            }
            this._root = root;
            this.element.appendChild(root.element);
            this.onDidSashResetRelay.input = root.onDidSashReset;
            this._onDidChange.input = event_1.Event.map(root.onDidChange, () => undefined); // TODO
            this._onDidScroll.input = root.onDidScroll;
        }
        /**
         * The width of the grid.
         */
        get width() { return this.root.width; }
        /**
         * The height of the grid.
         */
        get height() { return this.root.height; }
        /**
         * The minimum width of the grid.
         */
        get minimumWidth() { return this.root.minimumWidth; }
        /**
         * The minimum height of the grid.
         */
        get minimumHeight() { return this.root.minimumHeight; }
        /**
         * The maximum width of the grid.
         */
        get maximumWidth() { return this.root.maximumHeight; }
        /**
         * The maximum height of the grid.
         */
        get maximumHeight() { return this.root.maximumHeight; }
        get orientation() { return this._root.orientation; }
        get boundarySashes() { return this._boundarySashes; }
        /**
         * The orientation of the grid. Matches the orientation of the root
         * {@link SplitView} in the grid's tree model.
         */
        set orientation(orientation) {
            if (this._root.orientation === orientation) {
                return;
            }
            const { size, orthogonalSize, absoluteOffset, absoluteOrthogonalOffset } = this._root;
            this.root = flipNode(this._root, orthogonalSize, size);
            this.root.layout(size, 0, { orthogonalSize, absoluteOffset: absoluteOrthogonalOffset, absoluteOrthogonalOffset: absoluteOffset, absoluteSize: size, absoluteOrthogonalSize: orthogonalSize });
            this.boundarySashes = this.boundarySashes;
        }
        /**
         * A collection of sashes perpendicular to each edge of the grid.
         * Corner sashes will be created for each intersection.
         */
        set boundarySashes(boundarySashes) {
            this._boundarySashes = boundarySashes;
            this.root.boundarySashes = fromAbsoluteBoundarySashes(boundarySashes, this.orientation);
        }
        /**
         * Enable/disable edge snapping across all grid views.
         */
        set edgeSnapping(edgeSnapping) {
            this.root.edgeSnapping = edgeSnapping;
        }
        /**
         * Create a new {@link GridView} instance.
         *
         * @remarks It's the caller's responsibility to append the
         * {@link GridView.element} to the page's DOM.
         */
        constructor(options = {}) {
            this.onDidSashResetRelay = new event_1.Relay();
            this._onDidScroll = new event_1.Relay();
            this._onDidChange = new event_1.Relay();
            this._boundarySashes = {};
            this.disposable2x2 = lifecycle_1.Disposable.None;
            /**
             * Fires whenever the user double clicks a {@link Sash sash}.
             */
            this.onDidSashReset = this.onDidSashResetRelay.event;
            /**
             * Fires whenever the user scrolls a {@link SplitView} within
             * the grid.
             */
            this.onDidScroll = this._onDidScroll.event;
            /**
             * Fires whenever a view within the grid changes its size constraints.
             */
            this.onDidChange = this._onDidChange.event;
            this.maximizedNode = undefined;
            this._onDidChangeViewMaximized = new event_1.Emitter();
            this.onDidChangeViewMaximized = this._onDidChangeViewMaximized.event;
            this.element = (0, dom_1.$)('.monaco-grid-view');
            this.styles = options.styles || defaultStyles;
            this.proportionalLayout = typeof options.proportionalLayout !== 'undefined' ? !!options.proportionalLayout : true;
            this.layoutController = new LayoutController(false);
            this.root = new BranchNode(0 /* Orientation.VERTICAL */, this.layoutController, this.styles, this.proportionalLayout);
        }
        style(styles) {
            this.styles = styles;
            this.root.style(styles);
        }
        /**
         * Layout the {@link GridView}.
         *
         * Optionally provide a `top` and `left` positions, those will propagate
         * as an origin for positions passed to {@link IView.layout}.
         *
         * @param width The width of the {@link GridView}.
         * @param height The height of the {@link GridView}.
         * @param top Optional, the top location of the {@link GridView}.
         * @param left Optional, the left location of the {@link GridView}.
         */
        layout(width, height, top = 0, left = 0) {
            this.layoutController.isLayoutEnabled = true;
            const [size, orthogonalSize, offset, orthogonalOffset] = this.root.orientation === 1 /* Orientation.HORIZONTAL */ ? [height, width, top, left] : [width, height, left, top];
            this.root.layout(size, 0, { orthogonalSize, absoluteOffset: offset, absoluteOrthogonalOffset: orthogonalOffset, absoluteSize: size, absoluteOrthogonalSize: orthogonalSize });
        }
        /**
         * Add a {@link IView view} to this {@link GridView}.
         *
         * @param view The view to add.
         * @param size Either a fixed size, or a dynamic {@link Sizing} strategy.
         * @param location The {@link GridLocation location} to insert the view on.
         */
        addView(view, size, location) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            this.disposable2x2.dispose();
            this.disposable2x2 = lifecycle_1.Disposable.None;
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [pathToParent, parent] = this.getNode(rest);
            if (parent instanceof BranchNode) {
                const node = new LeafNode(view, orthogonal(parent.orientation), this.layoutController, parent.orthogonalSize);
                try {
                    parent.addChild(node, size, index);
                }
                catch (err) {
                    node.dispose();
                    throw err;
                }
            }
            else {
                const [, grandParent] = (0, arrays_1.tail2)(pathToParent);
                const [, parentIndex] = (0, arrays_1.tail2)(rest);
                let newSiblingSize = 0;
                const newSiblingCachedVisibleSize = grandParent.getChildCachedVisibleSize(parentIndex);
                if (typeof newSiblingCachedVisibleSize === 'number') {
                    newSiblingSize = splitview_1.Sizing.Invisible(newSiblingCachedVisibleSize);
                }
                const oldChild = grandParent.removeChild(parentIndex);
                oldChild.dispose();
                const newParent = new BranchNode(parent.orientation, parent.layoutController, this.styles, this.proportionalLayout, parent.size, parent.orthogonalSize, grandParent.edgeSnapping);
                grandParent.addChild(newParent, parent.size, parentIndex);
                const newSibling = new LeafNode(parent.view, grandParent.orientation, this.layoutController, parent.size);
                newParent.addChild(newSibling, newSiblingSize, 0);
                if (typeof size !== 'number' && size.type === 'split') {
                    size = splitview_1.Sizing.Split(0);
                }
                const node = new LeafNode(view, grandParent.orientation, this.layoutController, parent.size);
                newParent.addChild(node, size, index);
            }
            this.trySet2x2();
        }
        /**
         * Remove a {@link IView view} from this {@link GridView}.
         *
         * @param location The {@link GridLocation location} of the {@link IView view}.
         * @param sizing Whether to distribute other {@link IView view}'s sizes.
         */
        removeView(location, sizing) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            this.disposable2x2.dispose();
            this.disposable2x2 = lifecycle_1.Disposable.None;
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [pathToParent, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            const node = parent.children[index];
            if (!(node instanceof LeafNode)) {
                throw new Error('Invalid location');
            }
            parent.removeChild(index, sizing);
            node.dispose();
            if (parent.children.length === 0) {
                throw new Error('Invalid grid state');
            }
            if (parent.children.length > 1) {
                this.trySet2x2();
                return node.view;
            }
            if (pathToParent.length === 0) { // parent is root
                const sibling = parent.children[0];
                if (sibling instanceof LeafNode) {
                    return node.view;
                }
                // we must promote sibling to be the new root
                parent.removeChild(0);
                parent.dispose();
                this.root = sibling;
                this.boundarySashes = this.boundarySashes;
                this.trySet2x2();
                return node.view;
            }
            const [, grandParent] = (0, arrays_1.tail2)(pathToParent);
            const [, parentIndex] = (0, arrays_1.tail2)(rest);
            const isSiblingVisible = parent.isChildVisible(0);
            const sibling = parent.removeChild(0);
            const sizes = grandParent.children.map((_, i) => grandParent.getChildSize(i));
            grandParent.removeChild(parentIndex, sizing);
            parent.dispose();
            if (sibling instanceof BranchNode) {
                sizes.splice(parentIndex, 1, ...sibling.children.map(c => c.size));
                const siblingChildren = sibling.removeAllChildren();
                for (let i = 0; i < siblingChildren.length; i++) {
                    grandParent.addChild(siblingChildren[i], siblingChildren[i].size, parentIndex + i);
                }
            }
            else {
                const newSibling = new LeafNode(sibling.view, orthogonal(sibling.orientation), this.layoutController, sibling.size);
                const sizing = isSiblingVisible ? sibling.orthogonalSize : splitview_1.Sizing.Invisible(sibling.orthogonalSize);
                grandParent.addChild(newSibling, sizing, parentIndex);
            }
            sibling.dispose();
            for (let i = 0; i < sizes.length; i++) {
                grandParent.resizeChild(i, sizes[i]);
            }
            this.trySet2x2();
            return node.view;
        }
        /**
         * Move a {@link IView view} within its parent.
         *
         * @param parentLocation The {@link GridLocation location} of the {@link IView view}'s parent.
         * @param from The index of the {@link IView view} to move.
         * @param to The index where the {@link IView view} should move to.
         */
        moveView(parentLocation, from, to) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            const [, parent] = this.getNode(parentLocation);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            parent.moveChild(from, to);
            this.trySet2x2();
        }
        /**
         * Swap two {@link IView views} within the {@link GridView}.
         *
         * @param from The {@link GridLocation location} of one view.
         * @param to The {@link GridLocation location} of another view.
         */
        swapViews(from, to) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            const [fromRest, fromIndex] = (0, arrays_1.tail2)(from);
            const [, fromParent] = this.getNode(fromRest);
            if (!(fromParent instanceof BranchNode)) {
                throw new Error('Invalid from location');
            }
            const fromSize = fromParent.getChildSize(fromIndex);
            const fromNode = fromParent.children[fromIndex];
            if (!(fromNode instanceof LeafNode)) {
                throw new Error('Invalid from location');
            }
            const [toRest, toIndex] = (0, arrays_1.tail2)(to);
            const [, toParent] = this.getNode(toRest);
            if (!(toParent instanceof BranchNode)) {
                throw new Error('Invalid to location');
            }
            const toSize = toParent.getChildSize(toIndex);
            const toNode = toParent.children[toIndex];
            if (!(toNode instanceof LeafNode)) {
                throw new Error('Invalid to location');
            }
            if (fromParent === toParent) {
                fromParent.swapChildren(fromIndex, toIndex);
            }
            else {
                fromParent.removeChild(fromIndex);
                toParent.removeChild(toIndex);
                fromParent.addChild(toNode, fromSize, fromIndex);
                toParent.addChild(fromNode, toSize, toIndex);
            }
            this.trySet2x2();
        }
        /**
         * Resize a {@link IView view}.
         *
         * @param location The {@link GridLocation location} of the view.
         * @param size The size the view should be. Optionally provide a single dimension.
         */
        resizeView(location, size) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [pathToParent, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            if (!size.width && !size.height) {
                return;
            }
            const [parentSize, grandParentSize] = parent.orientation === 1 /* Orientation.HORIZONTAL */ ? [size.width, size.height] : [size.height, size.width];
            if (typeof grandParentSize === 'number' && pathToParent.length > 0) {
                const [, grandParent] = (0, arrays_1.tail2)(pathToParent);
                const [, parentIndex] = (0, arrays_1.tail2)(rest);
                grandParent.resizeChild(parentIndex, grandParentSize);
            }
            if (typeof parentSize === 'number') {
                parent.resizeChild(index, parentSize);
            }
            this.trySet2x2();
        }
        /**
         * Get the size of a {@link IView view}.
         *
         * @param location The {@link GridLocation location} of the view. Provide `undefined` to get
         * the size of the grid itself.
         */
        getViewSize(location) {
            if (!location) {
                return { width: this.root.width, height: this.root.height };
            }
            const [, node] = this.getNode(location);
            return { width: node.width, height: node.height };
        }
        /**
         * Get the cached visible size of a {@link IView view}. This was the size
         * of the view at the moment it last became hidden.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        getViewCachedVisibleSize(location) {
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            return parent.getChildCachedVisibleSize(index);
        }
        /**
         * Maximize the size of a {@link IView view} by collapsing all other views
         * to their minimum sizes.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        expandView(location) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            const [ancestors, node] = this.getNode(location);
            if (!(node instanceof LeafNode)) {
                throw new Error('Invalid location');
            }
            for (let i = 0; i < ancestors.length; i++) {
                ancestors[i].resizeChild(location[i], Number.POSITIVE_INFINITY);
            }
        }
        /**
         * Returns whether all other {@link IView views} are at their minimum size.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        isViewExpanded(location) {
            if (this.hasMaximizedView()) {
                // No view can be expanded when a view is maximized
                return false;
            }
            const [ancestors, node] = this.getNode(location);
            if (!(node instanceof LeafNode)) {
                throw new Error('Invalid location');
            }
            for (let i = 0; i < ancestors.length; i++) {
                if (!ancestors[i].isChildExpanded(location[i])) {
                    return false;
                }
            }
            return true;
        }
        maximizeView(location) {
            const [, nodeToMaximize] = this.getNode(location);
            if (!(nodeToMaximize instanceof LeafNode)) {
                throw new Error('Location is not a LeafNode');
            }
            if (this.maximizedNode === nodeToMaximize) {
                return;
            }
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            function hideAllViewsBut(parent, exclude) {
                for (let i = 0; i < parent.children.length; i++) {
                    const child = parent.children[i];
                    if (child instanceof LeafNode) {
                        if (child !== exclude) {
                            parent.setChildVisible(i, false);
                        }
                    }
                    else {
                        hideAllViewsBut(child, exclude);
                    }
                }
            }
            hideAllViewsBut(this.root, nodeToMaximize);
            this.maximizedNode = nodeToMaximize;
            this._onDidChangeViewMaximized.fire(true);
        }
        exitMaximizedView() {
            if (!this.maximizedNode) {
                return;
            }
            this.maximizedNode = undefined;
            // When hiding a view, it's previous size is cached.
            // To restore the sizes of all views, they need to be made visible in reverse order.
            function showViewsInReverseOrder(parent) {
                for (let index = parent.children.length - 1; index >= 0; index--) {
                    const child = parent.children[index];
                    if (child instanceof LeafNode) {
                        parent.setChildVisible(index, true);
                    }
                    else {
                        showViewsInReverseOrder(child);
                    }
                }
            }
            showViewsInReverseOrder(this.root);
            this._onDidChangeViewMaximized.fire(false);
        }
        hasMaximizedView() {
            return this.maximizedNode !== undefined;
        }
        /**
         * Returns whether the {@link IView view} is maximized.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        isViewMaximized(location) {
            const [, node] = this.getNode(location);
            if (!(node instanceof LeafNode)) {
                throw new Error('Location is not a LeafNode');
            }
            return node === this.maximizedNode;
        }
        /**
         * Distribute the size among all {@link IView views} within the entire
         * grid or within a single {@link SplitView}.
         *
         * @param location The {@link GridLocation location} of a view containing
         * children views, which will have their sizes distributed within the parent
         * view's size. Provide `undefined` to recursively distribute all views' sizes
         * in the entire grid.
         */
        distributeViewSizes(location) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
            }
            if (!location) {
                this.root.distributeViewSizes(true);
                return;
            }
            const [, node] = this.getNode(location);
            if (!(node instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            node.distributeViewSizes();
            this.trySet2x2();
        }
        /**
         * Returns whether a {@link IView view} is visible.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        isViewVisible(location) {
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid from location');
            }
            return parent.isChildVisible(index);
        }
        /**
         * Set the visibility state of a {@link IView view}.
         *
         * @param location The {@link GridLocation location} of the view.
         */
        setViewVisible(location, visible) {
            if (this.hasMaximizedView()) {
                this.exitMaximizedView();
                return;
            }
            const [rest, index] = (0, arrays_1.tail2)(location);
            const [, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid from location');
            }
            parent.setChildVisible(index, visible);
        }
        getView(location) {
            const node = location ? this.getNode(location)[1] : this._root;
            return this._getViews(node, this.orientation);
        }
        /**
         * Construct a new {@link GridView} from a JSON object.
         *
         * @param json The JSON object.
         * @param deserializer A deserializer which can revive each view.
         * @returns A new {@link GridView} instance.
         */
        static deserialize(json, deserializer, options = {}) {
            if (typeof json.orientation !== 'number') {
                throw new Error('Invalid JSON: \'orientation\' property must be a number.');
            }
            else if (typeof json.width !== 'number') {
                throw new Error('Invalid JSON: \'width\' property must be a number.');
            }
            else if (typeof json.height !== 'number') {
                throw new Error('Invalid JSON: \'height\' property must be a number.');
            }
            else if (json.root?.type !== 'branch') {
                throw new Error('Invalid JSON: \'root\' property must have \'type\' value of branch.');
            }
            const orientation = json.orientation;
            const height = json.height;
            const result = new GridView(options);
            result._deserialize(json.root, orientation, deserializer, height);
            return result;
        }
        _deserialize(root, orientation, deserializer, orthogonalSize) {
            this.root = this._deserializeNode(root, orientation, deserializer, orthogonalSize);
        }
        _deserializeNode(node, orientation, deserializer, orthogonalSize) {
            let result;
            if (node.type === 'branch') {
                const serializedChildren = node.data;
                const children = serializedChildren.map(serializedChild => {
                    return {
                        node: this._deserializeNode(serializedChild, orthogonal(orientation), deserializer, node.size),
                        visible: serializedChild.visible
                    };
                });
                result = new BranchNode(orientation, this.layoutController, this.styles, this.proportionalLayout, node.size, orthogonalSize, undefined, children);
            }
            else {
                result = new LeafNode(deserializer.fromJSON(node.data), orientation, this.layoutController, orthogonalSize, node.size);
                if (node.maximized && !this.maximizedNode) {
                    this.maximizedNode = result;
                    this._onDidChangeViewMaximized.fire(true);
                }
            }
            return result;
        }
        _getViews(node, orientation, cachedVisibleSize) {
            const box = { top: node.top, left: node.left, width: node.width, height: node.height };
            if (node instanceof LeafNode) {
                return { view: node.view, box, cachedVisibleSize, maximized: this.maximizedNode === node };
            }
            const children = [];
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                const cachedVisibleSize = node.getChildCachedVisibleSize(i);
                children.push(this._getViews(child, orthogonal(orientation), cachedVisibleSize));
            }
            return { children, box };
        }
        getNode(location, node = this.root, path = []) {
            if (location.length === 0) {
                return [path, node];
            }
            if (!(node instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            const [index, ...rest] = location;
            if (index < 0 || index >= node.children.length) {
                throw new Error('Invalid location');
            }
            const child = node.children[index];
            path.push(node);
            return this.getNode(rest, child, path);
        }
        /**
         * Attempt to lock the {@link Sash sashes} in this {@link GridView} so
         * the grid behaves as a 2x2 matrix, with a corner sash in the middle.
         *
         * In case the grid isn't a 2x2 grid _and_ all sashes are not aligned,
         * this method is a no-op.
         */
        trySet2x2() {
            this.disposable2x2.dispose();
            this.disposable2x2 = lifecycle_1.Disposable.None;
            if (this.root.children.length !== 2) {
                return;
            }
            const [first, second] = this.root.children;
            if (!(first instanceof BranchNode) || !(second instanceof BranchNode)) {
                return;
            }
            this.disposable2x2 = first.trySet2x2(second);
        }
        /**
         * Populate a map with views to DOM nodes.
         * @remarks To be used internally only.
         */
        getViewMap(map, node) {
            if (!node) {
                node = this.root;
            }
            if (node instanceof BranchNode) {
                node.children.forEach(child => this.getViewMap(map, child));
            }
            else {
                map.set(node.view, node.element);
            }
        }
        dispose() {
            this.onDidSashResetRelay.dispose();
            this.root.dispose();
            this.element.parentElement?.removeChild(this.element);
        }
    }
    exports.GridView = GridView;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvZ3JpZC9ncmlkdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzS2hHLGdDQUVDO0lBdUJELDRDQUVDO0lBcExRLG1HQUFBLFdBQVcsT0FBQTtJQUNYLDJHQUFBLGNBQWMsT0FBQTtJQUFFLG1HQUFBLE1BQU0sT0FBQTtJQUkvQixNQUFNLGFBQWEsR0FBb0I7UUFDdEMsZUFBZSxFQUFFLGFBQUssQ0FBQyxXQUFXO0tBQ2xDLENBQUM7SUFrSkYsU0FBZ0IsVUFBVSxDQUFDLFdBQXdCO1FBQ2xELE9BQU8sV0FBVyxpQ0FBeUIsQ0FBQyxDQUFDLGdDQUF3QixDQUFDLDZCQUFxQixDQUFDO0lBQzdGLENBQUM7SUF1QkQsU0FBZ0IsZ0JBQWdCLENBQUMsSUFBYztRQUM5QyxPQUFPLENBQUMsQ0FBRSxJQUFZLENBQUMsUUFBUSxDQUFDO0lBQ2pDLENBQUM7SUFFRCxNQUFNLGdCQUFnQjtRQUNyQixZQUFtQixlQUF3QjtZQUF4QixvQkFBZSxHQUFmLGVBQWUsQ0FBUztRQUFJLENBQUM7S0FDaEQ7SUF5QkQsU0FBUyx3QkFBd0IsQ0FBQyxNQUErQixFQUFFLFdBQXdCO1FBQzFGLElBQUksV0FBVyxtQ0FBMkIsRUFBRSxDQUFDO1lBQzVDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzdHLENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxN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