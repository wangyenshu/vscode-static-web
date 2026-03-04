/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "./gridview", "./gridview", "vs/css!./gridview"], function (require, exports, arrays_1, lifecycle_1, gridview_1, gridview_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SerializableGrid = exports.Grid = exports.Sizing = exports.Direction = exports.orthogonal = exports.Orientation = exports.LayoutPriority = void 0;
    exports.isGridBranchNode = isGridBranchNode;
    exports.getRelativeLocation = getRelativeLocation;
    exports.sanitizeGridNodeDescriptor = sanitizeGridNodeDescriptor;
    exports.createSerializedGrid = createSerializedGrid;
    Object.defineProperty(exports, "LayoutPriority", { enumerable: true, get: function () { return gridview_2.LayoutPriority; } });
    Object.defineProperty(exports, "Orientation", { enumerable: true, get: function () { return gridview_2.Orientation; } });
    Object.defineProperty(exports, "orthogonal", { enumerable: true, get: function () { return gridview_2.orthogonal; } });
    var Direction;
    (function (Direction) {
        Direction[Direction["Up"] = 0] = "Up";
        Direction[Direction["Down"] = 1] = "Down";
        Direction[Direction["Left"] = 2] = "Left";
        Direction[Direction["Right"] = 3] = "Right";
    })(Direction || (exports.Direction = Direction = {}));
    function oppositeDirection(direction) {
        switch (direction) {
            case 0 /* Direction.Up */: return 1 /* Direction.Down */;
            case 1 /* Direction.Down */: return 0 /* Direction.Up */;
            case 2 /* Direction.Left */: return 3 /* Direction.Right */;
            case 3 /* Direction.Right */: return 2 /* Direction.Left */;
        }
    }
    function isGridBranchNode(node) {
        return !!node.children;
    }
    function getGridNode(node, location) {
        if (location.length === 0) {
            return node;
        }
        if (!isGridBranchNode(node)) {
            throw new Error('Invalid location');
        }
        const [index, ...rest] = location;
        return getGridNode(node.children[index], rest);
    }
    function intersects(one, other) {
        return !(one.start >= other.end || other.start >= one.end);
    }
    function getBoxBoundary(box, direction) {
        const orientation = getDirectionOrientation(direction);
        const offset = direction === 0 /* Direction.Up */ ? box.top :
            direction === 3 /* Direction.Right */ ? box.left + box.width :
                direction === 1 /* Direction.Down */ ? box.top + box.height :
                    box.left;
        const range = {
            start: orientation === 1 /* Orientation.HORIZONTAL */ ? box.top : box.left,
            end: orientation === 1 /* Orientation.HORIZONTAL */ ? box.top + box.height : box.left + box.width
        };
        return { offset, range };
    }
    function findAdjacentBoxLeafNodes(boxNode, direction, boundary) {
        const result = [];
        function _(boxNode, direction, boundary) {
            if (isGridBranchNode(boxNode)) {
                for (const child of boxNode.children) {
                    _(child, direction, boundary);
                }
            }
            else {
                const { offset, range } = getBoxBoundary(boxNode.box, direction);
                if (offset === boundary.offset && intersects(range, boundary.range)) {
                    result.push(boxNode);
                }
            }
        }
        _(boxNode, direction, boundary);
        return result;
    }
    function getLocationOrientation(rootOrientation, location) {
        return location.length % 2 === 0 ? (0, gridview_1.orthogonal)(rootOrientation) : rootOrientation;
    }
    function getDirectionOrientation(direction) {
        return direction === 0 /* Direction.Up */ || direction === 1 /* Direction.Down */ ? 0 /* Orientation.VERTICAL */ : 1 /* Orientation.HORIZONTAL */;
    }
    function getRelativeLocation(rootOrientation, location, direction) {
        const orientation = getLocationOrientation(rootOrientation, location);
        const directionOrientation = getDirectionOrientation(direction);
        if (orientation === directionOrientation) {
            let [rest, index] = (0, arrays_1.tail2)(location);
            if (direction === 3 /* Direction.Right */ || direction === 1 /* Direction.Down */) {
                index += 1;
            }
            return [...rest, index];
        }
        else {
            const index = (direction === 3 /* Direction.Right */ || direction === 1 /* Direction.Down */) ? 1 : 0;
            return [...location, index];
        }
    }
    function indexInParent(element) {
        const parentElement = element.parentElement;
        if (!parentElement) {
            throw new Error('Invalid grid element');
        }
        let el = parentElement.firstElementChild;
        let index = 0;
        while (el !== element && el !== parentElement.lastElementChild && el) {
            el = el.nextElementSibling;
            index++;
        }
        return index;
    }
    /**
     * Find the grid location of a specific DOM element by traversing the parent
     * chain and finding each child index on the way.
     *
     * This will break as soon as DOM structures of the Splitview or Gridview change.
     */
    function getGridLocation(element) {
        const parentElement = element.parentElement;
        if (!parentElement) {
            throw new Error('Invalid grid element');
        }
        if (/\bmonaco-grid-view\b/.test(parentElement.className)) {
            return [];
        }
        const index = indexInParent(parentElement);
        const ancestor = parentElement.parentElement.parentElement.parentElement.parentElement;
        return [...getGridLocation(ancestor), index];
    }
    var Sizing;
    (function (Sizing) {
        Sizing.Distribute = { type: 'distribute' };
        Sizing.Split = { type: 'split' };
        Sizing.Auto = { type: 'auto' };
        function Invisible(cachedVisibleSize) { return { type: 'invisible', cachedVisibleSize }; }
        Sizing.Invisible = Invisible;
    })(Sizing || (exports.Sizing = Sizing = {}));
    /**
     * The {@link Grid} exposes a Grid widget in a friendlier API than the underlying
     * {@link GridView} widget. Namely, all mutation operations are addressed by the
     * model elements, rather than indexes.
     *
     * It support the same features as the {@link GridView}.
     */
    class Grid extends lifecycle_1.Disposable {
        /**
         * The orientation of the grid. Matches the orientation of the root
         * {@link SplitView} in the grid's {@link GridLocation} model.
         */
        get orientation() { return this.gridview.orientation; }
        set orientation(orientation) { this.gridview.orientation = orientation; }
        /**
         * The width of the grid.
         */
        get width() { return this.gridview.width; }
        /**
         * The height of the grid.
         */
        get height() { return this.gridview.height; }
        /**
         * The minimum width of the grid.
         */
        get minimumWidth() { return this.gridview.minimumWidth; }
        /**
         * The minimum height of the grid.
         */
        get minimumHeight() { return this.gridview.minimumHeight; }
        /**
         * The maximum width of the grid.
         */
        get maximumWidth() { return this.gridview.maximumWidth; }
        /**
         * The maximum height of the grid.
         */
        get maximumHeight() { return this.gridview.maximumHeight; }
        /**
         * A collection of sashes perpendicular to each edge of the grid.
         * Corner sashes will be created for each intersection.
         */
        get boundarySashes() { return this.gridview.boundarySashes; }
        set boundarySashes(boundarySashes) { this.gridview.boundarySashes = boundarySashes; }
        /**
         * Enable/disable edge snapping across all grid views.
         */
        set edgeSnapping(edgeSnapping) { this.gridview.edgeSnapping = edgeSnapping; }
        /**
         * The DOM element for this view.
         */
        get element() { return this.gridview.element; }
        /**
         * Create a new {@link Grid}. A grid must *always* have a view
         * inside.
         *
         * @param view An initial view for this Grid.
         */
        constructor(view, options = {}) {
            super();
            this.views = new Map();
            this.didLayout = false;
            if (view instanceof gridview_1.GridView) {
                this.gridview = view;
                this.gridview.getViewMap(this.views);
            }
            else {
                this.gridview = new gridview_1.GridView(options);
            }
            this._register(this.gridview);
            this._register(this.gridview.onDidSashReset(this.onDidSashReset, this));
            if (!(view instanceof gridview_1.GridView)) {
                this._addView(view, 0, [0]);
            }
            this.onDidChange = this.gridview.onDidChange;
            this.onDidScroll = this.gridview.onDidScroll;
            this.onDidChangeViewMaximized = this.gridview.onDidChangeViewMaximized;
        }
        style(styles) {
            this.gridview.style(styles);
        }
        /**
         * Layout the {@link Grid}.
         *
         * Optionally provide a `top` and `left` positions, those will propagate
         * as an origin for positions passed to {@link IView.layout}.
         *
         * @param width The width of the {@link Grid}.
         * @param height The height of the {@link Grid}.
         * @param top Optional, the top location of the {@link Grid}.
         * @param left Optional, the left location of the {@link Grid}.
         */
        layout(width, height, top = 0, left = 0) {
            this.gridview.layout(width, height, top, left);
            this.didLayout = true;
        }
        /**
         * Add a {@link IView view} to this {@link Grid}, based on another reference view.
         *
         * Take this grid as an example:
         *
         * ```
         *  +-----+---------------+
         *  |  A  |      B        |
         *  +-----+---------+-----+
         *  |        C      |     |
         *  +---------------+  D  |
         *  |        E      |     |
         *  +---------------+-----+
         * ```
         *
         * Calling `addView(X, Sizing.Distribute, C, Direction.Right)` will make the following
         * changes:
         *
         * ```
         *  +-----+---------------+
         *  |  A  |      B        |
         *  +-----+-+-------+-----+
         *  |   C   |   X   |     |
         *  +-------+-------+  D  |
         *  |        E      |     |
         *  +---------------+-----+
         * ```
         *
         * Or `addView(X, Sizing.Distribute, D, Direction.Down)`:
         *
         * ```
         *  +-----+---------------+
         *  |  A  |      B        |
         *  +-----+---------+-----+
         *  |        C      |  D  |
         *  +---------------+-----+
         *  |        E      |  X  |
         *  +---------------+-----+
         * ```
         *
         * @param newView The view to add.
         * @param size Either a fixed size, or a dynamic {@link Sizing} strategy.
         * @param referenceView Another view to place this new view next to.
         * @param direction The direction the new view should be placed next to the reference view.
         */
        addView(newView, size, referenceView, direction) {
            if (this.views.has(newView)) {
                throw new Error('Can\'t add same view twice');
            }
            const orientation = getDirectionOrientation(direction);
            if (this.views.size === 1 && this.orientation !== orientation) {
                this.orientation = orientation;
            }
            const referenceLocation = this.getViewLocation(referenceView);
            const location = getRelativeLocation(this.gridview.orientation, referenceLocation, direction);
            let viewSize;
            if (typeof size === 'number') {
                viewSize = size;
            }
            else if (size.type === 'split') {
                const [, index] = (0, arrays_1.tail2)(referenceLocation);
                viewSize = gridview_1.Sizing.Split(index);
            }
            else if (size.type === 'distribute') {
                viewSize = gridview_1.Sizing.Distribute;
            }
            else if (size.type === 'auto') {
                const [, index] = (0, arrays_1.tail2)(referenceLocation);
                viewSize = gridview_1.Sizing.Auto(index);
            }
            else {
                viewSize = size;
            }
            this._addView(newView, viewSize, location);
        }
        addViewAt(newView, size, location) {
            if (this.views.has(newView)) {
                throw new Error('Can\'t add same view twice');
            }
            let viewSize;
            if (typeof size === 'number') {
                viewSize = size;
            }
            else if (size.type === 'distribute') {
                viewSize = gridview_1.Sizing.Distribute;
            }
            else {
                viewSize = size;
            }
            this._addView(newView, viewSize, location);
        }
        _addView(newView, size, location) {
            this.views.set(newView, newView.element);
            this.gridview.addView(newView, size, location);
        }
        /**
         * Remove a {@link IView view} from this {@link Grid}.
         *
         * @param view The {@link IView view} to remove.
         * @param sizing Whether to distribute other {@link IView view}'s sizes.
         */
        removeView(view, sizing) {
            if (this.views.size === 1) {
                throw new Error('Can\'t remove last view');
            }
            const location = this.getViewLocation(view);
            let gridViewSizing;
            if (sizing?.type === 'distribute') {
                gridViewSizing = gridview_1.Sizing.Distribute;
            }
            else if (sizing?.type === 'auto') {
                const index = location[location.length - 1];
                gridViewSizing = gridview_1.Sizing.Auto(index === 0 ? 1 : index - 1);
            }
            this.gridview.removeView(location, gridViewSizing);
            this.views.delete(view);
        }
        /**
         * Move a {@link IView view} to another location in the grid.
         *
         * @remarks See {@link Grid.addView}.
         *
         * @param view The {@link IView view} to move.
         * @param sizing Either a fixed size, or a dynamic {@link Sizing} strategy.
         * @param referenceView Another view to place the view next to.
         * @param direction The direction the view should be placed next to the reference view.
         */
        moveView(view, sizing, referenceView, direction) {
            const sourceLocation = this.getViewLocation(view);
            const [sourceParentLocation, from] = (0, arrays_1.tail2)(sourceLocation);
            const referenceLocation = this.getViewLocation(referenceView);
            const targetLocation = getRelativeLocation(this.gridview.orientation, referenceLocation, direction);
            const [targetParentLocation, to] = (0, arrays_1.tail2)(targetLocation);
            if ((0, arrays_1.equals)(sourceParentLocation, targetParentLocation)) {
                this.gridview.moveView(sourceParentLocation, from, to);
            }
            else {
                this.removeView(view, typeof sizing === 'number' ? undefined : sizing);
                this.addView(view, sizing, referenceView, direction);
            }
        }
        /**
         * Move a {@link IView view} to another location in the grid.
         *
         * @remarks Internal method, do not use without knowing what you're doing.
         * @remarks See {@link GridView.moveView}.
         *
         * @param view The {@link IView view} to move.
         * @param location The {@link GridLocation location} to insert the view on.
         */
        moveViewTo(view, location) {
            const sourceLocation = this.getViewLocation(view);
            const [sourceParentLocation, from] = (0, arrays_1.tail2)(sourceLocation);
            const [targetParentLocation, to] = (0, arrays_1.tail2)(location);
            if ((0, arrays_1.equals)(sourceParentLocation, targetParentLocation)) {
                this.gridview.moveView(sourceParentLocation, from, to);
            }
            else {
                const size = this.getViewSize(view);
                const orientation = getLocationOrientation(this.gridview.orientation, sourceLocation);
                const cachedViewSize = this.getViewCachedVisibleSize(view);
                const sizing = typeof cachedViewSize === 'undefined'
                    ? (orientation === 1 /* Orientation.HORIZONTAL */ ? size.width : size.height)
                    : Sizing.Invisible(cachedViewSize);
                this.removeView(view);
                this.addViewAt(view, sizing, location);
            }
        }
        /**
         * Swap two {@link IView views} within the {@link Grid}.
         *
         * @param from One {@link IView view}.
         * @param to Another {@link IView view}.
         */
        swapViews(from, to) {
            const fromLocation = this.getViewLocation(from);
            const toLocation = this.getViewLocation(to);
            return this.gridview.swapViews(fromLocation, toLocation);
        }
        /**
         * Resize a {@link IView view}.
         *
         * @param view The {@link IView view} to resize.
         * @param size The size the view should be.
         */
        resizeView(view, size) {
            const location = this.getViewLocation(view);
            return this.gridview.resizeView(location, size);
        }
        /**
         * Returns whether all other {@link IView views} are at their minimum size.
         *
         * @param view The reference {@link IView view}.
         */
        isViewExpanded(view) {
            const location = this.getViewLocation(view);
            return this.gridview.isViewExpanded(location);
        }
        /**
         * Returns whether the {@link IView view} is maximized.
         *
         * @param view The reference {@link IView view}.
         */
        isViewMaximized(view) {
            const location = this.getViewLocation(view);
            return this.gridview.isViewMaximized(location);
        }
        /**
         * Returns whether the {@link IView view} is maximized.
         *
         * @param view The reference {@link IView view}.
         */
        hasMaximizedView() {
            return this.gridview.hasMaximizedView();
        }
        /**
         * Get the size of a {@link IView view}.
         *
         * @param view The {@link IView view}. Provide `undefined` to get the size
         * of the grid itself.
         */
        getViewSize(view) {
            if (!view) {
                return this.gridview.getViewSize();
            }
            const location = this.getViewLocation(view);
            return this.gridview.getViewSize(location);
        }
        /**
         * Get the cached visible size of a {@link IView view}. This was the size
         * of the view at the moment it last became hidden.
         *
         * @param view The {@link IView view}.
         */
        getViewCachedVisibleSize(view) {
            const location = this.getViewLocation(view);
            return this.gridview.getViewCachedVisibleSize(location);
        }
        /**
         * Maximizes the specified view and hides all other views.
         * @param view The view to maximize.
         */
        maximizeView(view) {
            if (this.views.size < 2) {
                throw new Error('At least two views are required to maximize a view');
            }
            const location = this.getViewLocation(view);
            this.gridview.maximizeView(location);
        }
        exitMaximizedView() {
            this.gridview.exitMaximizedView();
        }
        /**
         * Expand the size of a {@link IView view} by collapsing all other views
         * to their minimum sizes.
         *
         * @param view The {@link IView view}.
         */
        expandView(view) {
            const location = this.getViewLocation(view);
            this.gridview.expandView(location);
        }
        /**
         * Distribute the size among all {@link IView views} within the entire
         * grid or within a single {@link SplitView}.
         */
        distributeViewSizes() {
            this.gridview.distributeViewSizes();
        }
        /**
         * Returns whether a {@link IView view} is visible.
         *
         * @param view The {@link IView view}.
         */
        isViewVisible(view) {
            const location = this.getViewLocation(view);
            return this.gridview.isViewVisible(location);
        }
        /**
         * Set the visibility state of a {@link IView view}.
         *
         * @param view The {@link IView view}.
         */
        setViewVisible(view, visible) {
            const location = this.getViewLocation(view);
            this.gridview.setViewVisible(location, visible);
        }
        /**
         * Returns a descriptor for the entire grid.
         */
        getViews() {
            return this.gridview.getView();
        }
        /**
         * Utility method to return the collection all views which intersect
         * a view's edge.
         *
         * @param view The {@link IView view}.
         * @param direction Which direction edge to be considered.
         * @param wrap Whether the grid wraps around (from right to left, from bottom to top).
         */
        getNeighborViews(view, direction, wrap = false) {
            if (!this.didLayout) {
                throw new Error('Can\'t call getNeighborViews before first layout');
            }
            const location = this.getViewLocation(view);
            const root = this.getViews();
            const node = getGridNode(root, location);
            let boundary = getBoxBoundary(node.box, direction);
            if (wrap) {
                if (direction === 0 /* Direction.Up */ && node.box.top === 0) {
                    boundary = { offset: root.box.top + root.box.height, range: boundary.range };
                }
                else if (direction === 3 /* Direction.Right */ && node.box.left + node.box.width === root.box.width) {
                    boundary = { offset: 0, range: boundary.range };
                }
                else if (direction === 1 /* Direction.Down */ && node.box.top + node.box.height === root.box.height) {
                    boundary = { offset: 0, range: boundary.range };
                }
                else if (direction === 2 /* Direction.Left */ && node.box.left === 0) {
                    boundary = { offset: root.box.left + root.box.width, range: boundary.range };
                }
            }
            return findAdjacentBoxLeafNodes(root, oppositeDirection(direction), boundary)
                .map(node => node.view);
        }
        getViewLocation(view) {
            const element = this.views.get(view);
            if (!element) {
                throw new Error('View not found');
            }
            return getGridLocation(element);
        }
        onDidSashReset(location) {
            const resizeToPreferredSize = (location) => {
                const node = this.gridview.getView(location);
                if (isGridBranchNode(node)) {
                    return false;
                }
                const direction = getLocationOrientation(this.orientation, location);
                const size = direction === 1 /* Orientation.HORIZONTAL */ ? node.view.preferredWidth : node.view.preferredHeight;
                if (typeof size !== 'number') {
                    return false;
                }
                const viewSize = direction === 1 /* Orientation.HORIZONTAL */ ? { width: Math.round(size) } : { height: Math.round(size) };
                this.gridview.resizeView(location, viewSize);
                return true;
            };
            if (resizeToPreferredSize(location)) {
                return;
            }
            const [parentLocation, index] = (0, arrays_1.tail2)(location);
            if (resizeToPreferredSize([...parentLocation, index + 1])) {
                return;
            }
            this.gridview.distributeViewSizes(parentLocation);
        }
    }
    exports.Grid = Grid;
    /**
     * A {@link Grid} which can serialize itself.
     */
    class SerializableGrid extends Grid {
        constructor() {
            super(...arguments);
            /**
             * Useful information in order to proportionally restore view sizes
             * upon the very first layout call.
             */
            this.initialLayoutContext = true;
        }
        static serializeNode(node, orientation) {
            const size = orientation === 0 /* Orientation.VERTICAL */ ? node.box.width : node.box.height;
            if (!isGridBranchNode(node)) {
                const serializedLeafNode = { type: 'leaf', data: node.view.toJSON(), size };
                if (typeof node.cachedVisibleSize === 'number') {
                    serializedLeafNode.size = node.cachedVisibleSize;
                    serializedLeafNode.visible = false;
                }
                else if (node.maximized) {
                    serializedLeafNode.maximized = true;
                }
                return serializedLeafNode;
            }
            const data = node.children.map(c => SerializableGrid.serializeNode(c, (0, gridview_1.orthogonal)(orientation)));
            if (data.some(c => c.visible !== false)) {
                return { type: 'branch', data: data, size };
            }
            return { type: 'branch', data: data, size, visible: false };
        }
        /**
         * Construct a new {@link SerializableGrid} from a JSON object.
         *
         * @param json The JSON object.
         * @param deserializer A deserializer which can revive each view.
         * @returns A new {@link SerializableGrid} instance.
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
            const gridview = gridview_1.GridView.deserialize(json, deserializer, options);
            const result = new SerializableGrid(gridview, options);
            return result;
        }
        /**
         * Construct a new {@link SerializableGrid} from a grid descriptor.
         *
         * @param gridDescriptor A grid descriptor in which leaf nodes point to actual views.
         * @returns A new {@link SerializableGrid} instance.
         */
        static from(gridDescriptor, options = {}) {
            return SerializableGrid.deserialize(createSerializedGrid(gridDescriptor), { fromJSON: view => view }, options);
        }
        /**
         * Serialize this grid into a JSON object.
         */
        serialize() {
            return {
                root: SerializableGrid.serializeNode(this.getViews(), this.orientation),
                orientation: this.orientation,
                width: this.width,
                height: this.height
            };
        }
        layout(width, height, top = 0, left = 0) {
            super.layout(width, height, top, left);
            if (this.initialLayoutContext) {
                this.initialLayoutContext = false;
                this.gridview.trySet2x2();
            }
        }
    }
    exports.SerializableGrid = SerializableGrid;
    function isGridBranchNodeDescriptor(nodeDescriptor) {
        return !!nodeDescriptor.groups;
    }
    function sanitizeGridNodeDescriptor(nodeDescriptor, rootNode) {
        if (!rootNode && nodeDescriptor.groups && nodeDescriptor.groups.length <= 1) {
            nodeDescriptor.groups = undefined;
        }
        if (!isGridBranchNodeDescriptor(nodeDescriptor)) {
            return;
        }
        let totalDefinedSize = 0;
        let totalDefinedSizeCount = 0;
        for (const child of nodeDescriptor.groups) {
            sanitizeGridNodeDescriptor(child, false);
            if (child.size) {
                totalDefinedSize += child.size;
                totalDefinedSizeCount++;
            }
        }
        const totalUndefinedSize = totalDefinedSizeCount > 0 ? totalDefinedSize : 1;
        const totalUndefinedSizeCount = nodeDescriptor.groups.length - totalDefinedSizeCount;
        const eachUndefinedSize = totalUndefinedSize / totalUndefinedSizeCount;
        for (const child of nodeDescriptor.groups) {
            if (!child.size) {
                child.size = eachUndefinedSize;
            }
        }
    }
    function createSerializedNode(nodeDescriptor) {
        if (isGridBranchNodeDescriptor(nodeDescriptor)) {
            return { type: 'branch', data: nodeDescriptor.groups.map(c => createSerializedNode(c)), size: nodeDescriptor.size };
        }
        else {
            return { type: 'leaf', data: nodeDescriptor.data, size: nodeDescriptor.size };
        }
    }
    function getDimensions(node, orientation) {
        if (node.type === 'branch') {
            const childrenDimensions = node.data.map(c => getDimensions(c, (0, gridview_1.orthogonal)(orientation)));
            if (orientation === 0 /* Orientation.VERTICAL */) {
                const width = node.size || (childrenDimensions.length === 0 ? undefined : Math.max(...childrenDimensions.map(d => d.width || 0)));
                const height = childrenDimensions.length === 0 ? undefined : childrenDimensions.reduce((r, d) => r + (d.height || 0), 0);
                return { width, height };
            }
            else {
                const width = childrenDimensions.length === 0 ? undefined : childrenDimensions.reduce((r, d) => r + (d.width || 0), 0);
                const height = node.size || (childrenDimensions.length === 0 ? undefined : Math.max(...childrenDimensions.map(d => d.height || 0)));
                return { width, height };
            }
        }
        else {
            const width = orientation === 0 /* Orientation.VERTICAL */ ? node.size : undefined;
            const height = orientation === 0 /* Orientation.VERTICAL */ ? undefined : node.size;
            return { width, height };
        }
    }
    /**
     * Creates a new JSON object from a {@link GridDescriptor}, which can
     * be deserialized by {@link SerializableGrid.deserialize}.
     */
    function createSerializedGrid(gridDescriptor) {
        sanitizeGridNodeDescriptor(gridDescriptor, true);
        const root = createSerializedNode(gridDescriptor);
        const { width, height } = getDimensions(root, gridDescriptor.orientation);
        return {
            root,
            orientation: gridDescriptor.orientation,
            width: width || 1,
            height: height || 1
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9ncmlkL2dyaWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkRoRyw0Q0FFQztJQXlFRCxrREFnQkM7SUEyc0JELGdFQThCQztJQWtDRCxvREFZQztJQXA2QlEsMEdBQUEsY0FBYyxPQUFBO0lBQUUsdUdBQUEsV0FBVyxPQUFBO0lBQUUsc0dBQUEsVUFBVSxPQUFBO0lBRWhELElBQWtCLFNBS2pCO0lBTEQsV0FBa0IsU0FBUztRQUMxQixxQ0FBRSxDQUFBO1FBQ0YseUNBQUksQ0FBQTtRQUNKLHlDQUFJLENBQUE7UUFDSiwyQ0FBSyxDQUFBO0lBQ04sQ0FBQyxFQUxpQixTQUFTLHlCQUFULFNBQVMsUUFLMUI7SUFFRCxTQUFTLGlCQUFpQixDQUFDLFNBQW9CO1FBQzlDLFFBQVEsU0FBUyxFQUFFLENBQUM7WUFDbkIseUJBQWlCLENBQUMsQ0FBQyw4QkFBc0I7WUFDekMsMkJBQW1CLENBQUMsQ0FBQyw0QkFBb0I7WUFDekMsMkJBQW1CLENBQUMsQ0FBQywrQkFBdUI7WUFDNUMsNEJBQW9CLENBQUMsQ0FBQyw4QkFBc0I7UUFDN0MsQ0FBQztJQUNGLENBQUM7SUFrQ0QsU0FBZ0IsZ0JBQWdCLENBQWtCLElBQWlCO1FBQ2xFLE9BQU8sQ0FBQyxDQUFFLElBQVksQ0FBQyxRQUFRLENBQUM7SUFDakMsQ0FBQztJQUVELFNBQVMsV0FBVyxDQUFrQixJQUFpQixFQUFFLFFBQXNCO1FBQzlFLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMzQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUM3QixNQUFNLElB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