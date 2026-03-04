/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/tree", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/symbols", "vs/base/common/diff/diff", "vs/base/common/event", "vs/base/common/iterator"], function (require, exports, tree_1, arrays_1, async_1, symbols_1, diff_1, event_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexTreeModel = void 0;
    exports.isFilterResult = isFilterResult;
    exports.getVisibleState = getVisibleState;
    function isFilterResult(obj) {
        return typeof obj === 'object' && 'visibility' in obj && 'data' in obj;
    }
    function getVisibleState(visibility) {
        switch (visibility) {
            case true: return 1 /* TreeVisibility.Visible */;
            case false: return 0 /* TreeVisibility.Hidden */;
            default: return visibility;
        }
    }
    function isCollapsibleStateUpdate(update) {
        return typeof update.collapsible === 'boolean';
    }
    class IndexTreeModel {
        constructor(user, list, rootElement, options = {}) {
            this.user = user;
            this.list = list;
            this.rootRef = [];
            this.eventBufferer = new event_1.EventBufferer();
            this._onDidChangeCollapseState = new event_1.Emitter();
            this.onDidChangeCollapseState = this.eventBufferer.wrapEvent(this._onDidChangeCollapseState.event);
            this._onDidChangeRenderNodeCount = new event_1.Emitter();
            this.onDidChangeRenderNodeCount = this.eventBufferer.wrapEvent(this._onDidChangeRenderNodeCount.event);
            this._onDidSplice = new event_1.Emitter();
            this.onDidSplice = this._onDidSplice.event;
            this.refilterDelayer = new async_1.Delayer(symbols_1.MicrotaskDelay);
            this.collapseByDefault = typeof options.collapseByDefault === 'undefined' ? false : options.collapseByDefault;
            this.allowNonCollapsibleParents = options.allowNonCollapsibleParents ?? false;
            this.filter = options.filter;
            this.autoExpandSingleChildren = typeof options.autoExpandSingleChildren === 'undefined' ? false : options.autoExpandSingleChildren;
            this.root = {
                parent: undefined,
                element: rootElement,
                children: [],
                depth: 0,
                visibleChildrenCount: 0,
                visibleChildIndex: -1,
                collapsible: false,
                collapsed: false,
                renderNodeCount: 0,
                visibility: 1 /* TreeVisibility.Visible */,
                visible: true,
                filterData: undefined
            };
        }
        splice(location, deleteCount, toInsert = iterator_1.Iterable.empty(), options = {}) {
            if (location.length === 0) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            if (options.diffIdentityProvider) {
                this.spliceSmart(options.diffIdentityProvider, location, deleteCount, toInsert, options);
            }
            else {
                this.spliceSimple(location, deleteCount, toInsert, options);
            }
        }
        spliceSmart(identity, location, deleteCount, toInsertIterable = iterator_1.Iterable.empty(), options, recurseLevels = options.diffDepth ?? 0) {
            const { parentNode } = this.getParentNodeWithListIndex(location);
            if (!parentNode.lastDiffIds) {
                return this.spliceSimple(location, deleteCount, toInsertIterable, options);
            }
            const toInsert = [...toInsertIterable];
            const index = location[location.length - 1];
            const diff = new diff_1.LcsDiff({ getElements: () => parentNode.lastDiffIds }, {
                getElements: () => [
                    ...parentNode.children.slice(0, index),
                    ...toInsert,
                    ...parentNode.children.slice(index + deleteCount),
                ].map(e => identity.getId(e.element).toString())
            }).ComputeDiff(false);
            // if we were given a 'best effort' diff, use default behavior
            if (diff.quitEarly) {
                parentNode.lastDiffIds = undefined;
                return this.spliceSimple(location, deleteCount, toInsert, options);
            }
            const locationPrefix = location.slice(0, -1);
            const recurseSplice = (fromOriginal, fromModified, count) => {
                if (recurseLevels > 0) {
                    for (let i = 0; i < count; i++) {
                        fromOriginal--;
                        fromModified--;
                        this.spliceSmart(identity, [...locationPrefix, fromOriginal, 0], Number.MAX_SAFE_INTEGER, toInsert[fromModified].children, options, recurseLevels - 1);
                    }
                }
            };
            let lastStartO = Math.min(parentNode.children.length, index + deleteCount);
            let lastStartM = toInsert.length;
            for (const change of diff.changes.sort((a, b) => b.originalStart - a.originalStart)) {
                recurseSplice(lastStartO, lastStartM, lastStartO - (change.originalStart + change.originalLength));
                lastStartO = change.originalStart;
                lastStartM = change.modifiedStart - index;
                this.spliceSimple([...locationPrefix, lastStartO], change.originalLength, iterator_1.Iterable.slice(toInsert, lastStartM, lastStartM + change.modifiedLength), options);
            }
            // at this point, startO === startM === count since any remaining prefix should match
            recurseSplice(lastStartO, lastStartM, lastStartO);
        }
        spliceSimple(location, deleteCount, toInsert = iterator_1.Iterable.empty(), { onDidCreateNode, onDidDeleteNode, diffIdentityProvider }) {
            const { parentNode, listIndex, revealed, visible } = this.getParentNodeWithListIndex(location);
            const treeListElementsToInsert = [];
            const nodesToInsertIterator = iterator_1.Iterable.map(toInsert, el => this.createTreeNode(el, parentNode, parentNode.visible ? 1 /* TreeVisibility.Visible */ : 0 /* TreeVisibility.Hidden */, revealed, treeListElementsToInsert, onDidCreateNode));
            const lastIndex = location[location.length - 1];
            // figure out what's the visible child start index right before the
            // splice point
            let visibleChildStartIndex = 0;
            for (let i = lastIndex; i >= 0 && i < parentNode.children.length; i--) {
                const child = parentNode.children[i];
                if (child.visible) {
                    visibleChildStartIndex = child.visibleChildIndex;
                    break;
                }
            }
            const nodesToInsert = [];
            let insertedVisibleChildrenCount = 0;
            let renderNodeCount = 0;
            for (const child of nodesToInsertIterator) {
                nodesToInsert.push(child);
                renderNodeCount += child.renderNodeCount;
                if (child.visible) {
                    child.visibleChildIndex = visibleChildStartIndex + insertedVisibleChildrenCount++;
                }
            }
            const deletedNodes = (0, arrays_1.splice)(parentNode.children, lastIndex, deleteCount, nodesToInsert);
            if (!diffIdentityProvider) {
                parentNode.lastDiffIds = undefined;
            }
            else if (parentNode.lastDiffIds) {
                (0, arrays_1.splice)(parentNode.lastDiffIds, lastIndex, deleteCount, nodesToInsert.map(n => diffIdentityProvider.getId(n.element).toString()));
            }
            else {
                parentNode.lastDiffIds = parentNode.children.map(n => diffIdentityProvider.getId(n.element).toString());
            }
            // figure out what is the count of deleted visible children
            let deletedVisibleChildrenCount = 0;
            for (const child of deletedNodes) {
                if (child.visible) {
                    deletedVisibleChildrenCount++;
                }
            }
            // and adjust for all visible children after the splice point
            if (deletedVisibleChildrenCount !== 0) {
                for (let i = lastIndex + nodesToInsert.length; i < parentNode.children.length; i++) {
                    const child = parentNode.children[i];
                    if (child.visible) {
                        child.visibleChildIndex -= deletedVisibleChildrenCount;
                    }
                }
            }
            // update parent's visible children count
            parentNode.visibleChildrenCount += insertedVisibleChildrenCount - deletedVisibleChildrenCount;
            if (revealed && visible) {
                const visibleDeleteCount = deletedNodes.reduce((r, node) => r + (node.visible ? node.renderNodeCount : 0), 0);
                this._updateAncestorsRenderNodeCount(parentNode, renderNodeCount - visibleDeleteCount);
                this.list.splice(listIndex, visibleDeleteCount, treeListElementsToInsert);
            }
            if (deletedNodes.length > 0 && onDidDeleteNode) {
                const visit = (node) => {
                    onDidDeleteNode(node);
                    node.children.forEach(visit);
                };
                deletedNodes.forEach(visit);
            }
            this._onDidSplice.fire({ insertedNodes: nodesToInsert, deletedNodes });
            let node = parentNode;
            while (node) {
                if (node.visibility === 2 /* TreeVisibility.Recurse */) {
                    // delayed to avoid excessive refiltering, see #135941
                    this.refilterDelayer.trigger(() => this.refilter());
                    break;
                }
                node = node.parent;
            }
        }
        rerender(location) {
            if (location.length === 0) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            const { node, listIndex, revealed } = this.getTreeNodeWithListIndex(location);
            if (node.visible && revealed) {
                this.list.splice(listIndex, 1, [node]);
            }
        }
        updateElementHeight(location, height) {
            if (location.length === 0) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            const { listIndex } = this.getTreeNodeWithListIndex(location);
            this.list.updateElementHeight(listIndex, height);
        }
        has(location) {
            return this.hasTreeNode(location);
        }
        getListIndex(location) {
            const { listIndex, visible, revealed } = this.getTreeNodeWithListIndex(location);
            return visible && revealed ? listIndex : -1;
        }
        getListRenderCount(location) {
            return this.getTreeNode(location).renderNodeCount;
        }
        isCollapsible(location) {
            return this.getTreeNode(location).collapsible;
        }
        setCollapsible(location, collapsible) {
            const node = this.getTreeNode(location);
            if (typeof collapsible === 'undefined') {
                collapsible = !node.collapsible;
            }
            const update = { collapsible };
            return this.eventBufferer.bufferEvents(() => this._setCollapseState(location, update));
        }
        isCollapsed(location) {
            return this.getTreeNode(location).collapsed;
        }
        setCollapsed(location, collapsed, recursive) {
            const node = this.getTreeNode(location);
            if (typeof collapsed === 'undefined') {
                collapsed = !node.collapsed;
            }
            const update = { collapsed, recursive: recursive || false };
            return this.eventBufferer.bufferEvents(() => this._setCollapseState(location, update));
        }
        _setCollapseState(location, update) {
            const { node, listIndex, revealed } = this.getTreeNodeWithListIndex(location);
            const result = this._setListNodeCollapseState(node, listIndex, revealed, update);
            if (node !== this.root && this.autoExpandSingleChildren && result && !isCollapsibleStateUpdate(update) && node.collapsible && !node.collapsed && !update.recursive) {
                let onlyVisibleChildIndex = -1;
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    if (child.visible) {
                        if (onlyVisibleChildIndex > -1) {
                            onlyVisibleChildIndex = -1;
                            break;
                        }
                        else {
                            onlyVisibleChildIndex = i;
                        }
                    }
                }
                if (onlyVisibleChildIndex > -1) {
                    this._setCollapseState([...location, onlyVisibleChildIndex], update);
                }
            }
            return result;
        }
        _setListNodeCollapseState(node, listIndex, revealed, update) {
            const result = this._setNodeCollapseState(node, update, false);
            if (!revealed || !node.visible || !result) {
                return result;
            }
            const previousRenderNodeCount = node.renderNodeCount;
            const toInsert = this.updateNodeAfterCollapseChange(node);
            const deleteCount = previousRenderNodeCount - (listIndex === -1 ? 0 : 1);
            this.list.splice(listIndex + 1, deleteCount, toInsert.slice(1));
            return result;
        }
        _setNodeCollapseState(node, update, deep) {
            let result;
            if (node === this.root) {
                result = false;
            }
            else {
                if (isCollapsibleStateUpdate(update)) {
                    result = node.collapsible !== update.collapsible;
                    node.collapsible = update.collapsible;
                }
                else if (!node.collapsible) {
                    result = false;
                }
                else {
                    result = node.collapsed !== update.collapsed;
                    node.collapsed = update.collapsed;
                }
                if (result) {
                    this._onDidChangeCollapseState.fire({ node, deep });
                }
            }
            if (!isCollapsibleStateUpdate(update) && update.recursive) {
                for (const child of node.children) {
                    result = this._setNodeCollapseState(child, update, true) || result;
                }
            }
            return result;
        }
        expandTo(location) {
            this.eventBufferer.bufferEvents(() => {
                let node = this.getTreeNode(location);
                while (node.parent) {
                    node = node.parent;
                    location = location.slice(0, location.length - 1);
                    if (node.collapsed) {
                        this._setCollapseState(location, { collapsed: false, recursive: false });
                    }
                }
            });
        }
        refilter() {
            const previousRenderNodeCount = this.root.renderNodeCount;
            const toInsert = this.updateNodeAfterFilterChange(this.root);
            this.list.splice(0, previousRenderNodeCount, toInsert);
            this.refilterDelayer.cancel();
        }
        createTreeNode(treeElement, parent, parentVisibility, revealed, treeListElements, onDidCreateNode) {
            const node = {
                parent,
                element: treeElement.element,
                children: [],
                depth: parent.depth + 1,
                visibleChildrenCount: 0,
                visibleChildIndex: -1,
                collapsible: typeof treeElement.collapsible === 'boolean' ? treeElement.collapsible : (typeof treeElement.collapsed !== 'undefined'),
                collapsed: typeof treeElement.collapsed === 'undefined' ? this.collapseByDefault : treeElement.collapsed,
                renderNodeCount: 1,
                visibility: 1 /* TreeVisibility.Visible */,
                visible: true,
                filterData: undefined
            };
            const visibility = this._filterNode(node, parentVisibility);
            node.visibility = visibility;
            if (revealed) {
                treeListElements.push(node);
            }
            const childElements = treeElement.children || iterator_1.Iterable.empty();
            const childRevealed = revealed && visibility !== 0 /* TreeVisibility.Hidden */ && !node.collapsed;
            let visibleChildrenCount = 0;
            let renderNodeCount = 1;
            for (const el of childElements) {
                const child = this.createTreeNode(el, node, visibility, childRevealed, treeListElements, onDidCreateNode);
                node.children.push(child);
                renderNodeCount += child.renderNodeCount;
                if (child.visible) {
                    child.visibleChildIndex = visibleChildrenCount++;
                }
            }
            if (!this.allowNonCollapsibleParents) {
                node.collapsible = node.collapsible || node.children.length > 0;
            }
            node.visibleChildrenCount = visibleChildrenCount;
            node.visible = visibility === 2 /* TreeVisibility.Recurse */ ? visibleChildrenCount > 0 : (visibility === 1 /* TreeVisibility.Visible */);
            if (!node.visible) {
                node.renderNodeCount = 0;
                if (revealed) {
                    treeListElements.pop();
                }
            }
            else if (!node.collapsed) {
                node.renderNodeCount = renderNodeCount;
            }
            onDidCreateNode?.(node);
            return node;
        }
        updateNodeAfterCollapseChange(node) {
            const previousRenderNodeCount = node.renderNodeCount;
            const result = [];
            this._updateNodeAfterCollapseChange(node, result);
            this._updateAncestorsRenderNodeCount(node.parent, result.length - previousRenderNodeCount);
            return result;
        }
        _updateNodeAfterCollapseChange(node, result) {
            if (node.visible === false) {
                return 0;
            }
            result.push(node);
            node.renderNodeCount = 1;
            if (!node.collapsed) {
                for (const child of node.children) {
                    node.renderNodeCount += this._updateNodeAfterCollapseChange(child, result);
                }
            }
            this._onDidChangeRenderNodeCount.fire(node);
            return node.renderNodeCount;
        }
        updateNodeAfterFilterChange(node) {
            const previousRenderNodeCount = node.renderNodeCount;
            const result = [];
            this._updateNodeAfterFilterChange(node, node.visible ? 1 /* TreeVisibility.Visible */ : 0 /* TreeVisibility.Hidden */, result);
            this._updateAncestorsRenderNodeCount(node.parent, result.length - previousRenderNodeCount);
            return result;
        }
        _updateNodeAfterFilterChange(node, parentVisibility, result, revealed = true) {
            let visibility;
            if (node !== this.root) {
                visibility = this._filterNode(node, parentVisibility);
                if (visibility === 0 /* TreeVisibility.Hidden */) {
                    node.visible = false;
                    node.renderNodeCount = 0;
                    return false;
                }
                if (revealed) {
                    result.push(node);
                }
            }
            const resultStartLength = result.length;
            node.renderNodeCount = node === this.root ? 0 : 1;
            let hasVisibleDescendants = false;
            if (!node.collapsed || visibility !== 0 /* TreeVisibility.Hidden */) {
                let visibleChildIndex = 0;
                for (const child of node.children) {
                    hasVisibleDescendants = this._updateNodeAfterFilterChange(child, visibility, result, revealed && !node.collapsed) || hasVisibleDescendants;
                    if (child.visible) {
                        child.visibleChildIndex = visibleChildIndex++;
                    }
                }
                node.visibleChildrenCount = visibleChildIndex;
            }
            else {
                node.visibleChildrenCount = 0;
            }
            if (node !== this.root) {
                node.visible = visibility === 2 /* TreeVisibility.Recurse */ ? hasVisibleDescendants : (visibility === 1 /* TreeVisibility.Visible */);
                node.visibility = visibility;
            }
            if (!node.visible) {
                node.renderNodeCount = 0;
                if (revealed) {
                    result.pop();
                }
            }
            else if (!node.collapsed) {
                node.renderNodeCount += result.length - resultStartLength;
            }
            this._onDidChangeRenderNodeCount.fire(node);
            return node.visible;
        }
        _updateAncestorsRenderNodeCount(node, diff) {
            if (diff === 0) {
                return;
            }
            while (node) {
                node.renderNodeCount += diff;
                this._onDidChangeRenderNodeCount.fire(node);
                node = node.parent;
            }
        }
        _filterNode(node, parentVisibility) {
            const result = this.filter ? this.filter.filter(node.element, parentVisibility) : 1 /* TreeVisibility.Visible */;
            if (typeof result === 'boolean') {
                node.filterData = undefined;
                return result ? 1 /* TreeVisibility.Visible */ : 0 /* TreeVisibility.Hidden */;
            }
            else if (isFilterResult(result)) {
                node.filterData = result.data;
                return getVisibleState(result.visibility);
            }
            else {
                node.filterData = undefined;
                return getVisibleState(result);
            }
        }
        // cheap
        hasTreeNode(location, node = this.root) {
            if (!location || location.length === 0) {
                return true;
            }
            const [index, ...rest] = location;
            if (index < 0 || index > node.children.length) {
                return false;
            }
            return this.hasTreeNode(rest, node.children[index]);
        }
        // cheap
        getTreeNode(location, node = this.root) {
            if (!location || location.length === 0) {
                return node;
            }
            const [index, ...rest] = location;
            if (index < 0 || index > node.children.length) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            return this.getTreeNode(rest, node.children[index]);
        }
        // expensive
        getTreeNodeWithListIndex(location) {
            if (location.length === 0) {
                return { node: this.root, listIndex: -1, revealed: true, visible: false };
            }
            const { parentNode, listIndex, revealed, visible } = this.getParentNodeWithListIndex(location);
            const index = location[location.length - 1];
            if (index < 0 || index > parentNode.children.length) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            const node = parentNode.children[index];
            return { node, listIndex, revealed, visible: visible && node.visible };
        }
        getParentNodeWithListIndex(location, node = this.root, listIndex = 0, revealed = true, visible = true) {
            const [index, ...rest] = location;
            if (index < 0 || index > node.children.length) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            // TODO@joao perf!
            for (let i = 0; i < index; i++) {
                listIndex += node.children[i].renderNodeCount;
            }
            revealed = revealed && !node.collapsed;
            visible = visible && node.visible;
            if (rest.length === 0) {
                return { parentNode: node, listIndex, revealed, visible };
            }
            return this.getParentNodeWithListIndex(rest, node.children[index], listIndex + 1, revealed, visible);
        }
        getNode(location = []) {
            return this.getTreeNode(location);
        }
        // TODO@joao perf!
        getNodeLocation(node) {
            const location = [];
            let indexTreeNode = node; // typing woes
            while (indexTreeNode.parent) {
                location.push(indexTreeNode.parent.children.indexOf(indexTreeNode));
                indexTreeNode = indexTreeNode.parent;
            }
            return location.reverse();
        }
        getParentNodeLocation(location) {
            if (location.length === 0) {
                return undefined;
            }
            else if (location.length === 1) {
                return [];
            }
            else {
                return (0, arrays_1.tail2)(location)[0];
            }
        }
        getFirstElementChild(location) {
            const node = this.getTreeNode(location);
            if (node.children.length === 0) {
                return undefined;
            }
            return node.children[0].element;
        }
        getLastElementAncestor(location = []) {
            const node = this.getTreeNode(location);
            if (node.children.length === 0) {
                return undefined;
            }
            return this._getLastElementAncestor(node);
        }
        _getLastElementAncestor(node) {
            if (node.children.length === 0) {
                return node.element;
            }
            return this._getLastElementAncestor(node.children[node.children.length - 1]);
        }
    }
    exports.IndexTreeModel = IndexTreeModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhUcmVlTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvdHJlZS9pbmRleFRyZWVNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEyQmhHLHdDQUVDO0lBRUQsMENBTUM7SUFWRCxTQUFnQixjQUFjLENBQUksR0FBUTtRQUN6QyxPQUFPLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxZQUFZLElBQUksR0FBRyxJQUFJLE1BQU0sSUFBSSxHQUFHLENBQUM7SUFDeEUsQ0FBQztJQUVELFNBQWdCLGVBQWUsQ0FBQyxVQUFvQztRQUNuRSxRQUFRLFVBQVUsRUFBRSxDQUFDO1lBQ3BCLEtBQUssSUFBSSxDQUFDLENBQUMsc0NBQThCO1lBQ3pDLEtBQUssS0FBSyxDQUFDLENBQUMscUNBQTZCO1lBQ3pDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sVUFBVSxDQUFDO1FBQzVCLENBQUM7SUFDRixDQUFDO0lBZ0RELFNBQVMsd0JBQXdCLENBQUMsTUFBMkI7UUFDNUQsT0FBTyxPQUFRLE1BQWMsQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDO0lBQ3pELENBQUM7SUFNRCxNQUFhLGNBQWM7UUF1QjFCLFlBQ1MsSUFBWSxFQUNaLElBQXNDLEVBQzlDLFdBQWMsRUFDZCxVQUFrRCxFQUFFO1lBSDVDLFNBQUksR0FBSixJQUFJLENBQVE7WUFDWixTQUFJLEdBQUosSUFBSSxDQUFrQztZQXZCdEMsWUFBTyxHQUFHLEVBQUUsQ0FBQztZQUdkLGtCQUFhLEdBQUcsSUFBSSxxQkFBYSxFQUFFLENBQUM7WUFFM0IsOEJBQXlCLEdBQUcsSUFBSSxlQUFPLEVBQTZDLENBQUM7WUFDN0YsNkJBQXdCLEdBQXFELElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUV4SSxnQ0FBMkIsR0FBRyxJQUFJLGVBQU8sRUFBNkIsQ0FBQztZQUMvRSwrQkFBMEIsR0FBcUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBTzVILGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQXlDLENBQUM7WUFDNUUsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUU5QixvQkFBZSxHQUFHLElBQUksZUFBTyxDQUFDLHdCQUFjLENBQUMsQ0FBQztZQVE5RCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxPQUFPLENBQUMsaUJBQWlCLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztZQUM5RyxJQUFJLENBQUMsMEJBQTBCLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixJQUFJLEtBQUssQ0FBQztZQUM5RSxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDN0IsSUFBSSxDQUFDLHdCQUF3QixHQUFHLE9BQU8sT0FBTyxDQUFDLHdCQUF3QixLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUM7WUFFbkksSUFBSSxDQUFDLElBQUksR0FBRztnQkFDWCxNQUFNLEVBQUUsU0FBUztnQkFDakIsT0FBTyxFQUFFLFdBQVc7Z0JBQ3BCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLEtBQUssRUFBRSxDQUFDO2dCQUNSLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3ZCLGlCQUFpQixFQUFFLENBQUMsQ0FBQztnQkFDckIsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixlQUFlLEVBQUUsQ0FBQztnQkFDbEIsVUFBVSxnQ0FBd0I7Z0JBQ2xDLE9BQU8sRUFBRSxJQUFJO2dCQUNiLFVBQVUsRUFBRSxTQUFTO2FBQ3JCLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxDQUNMLFFBQWtCLEVBQ2xCLFdBQW1CLEVBQ25CLFdBQXNDLG1CQUFRLENBQUMsS0FBSyxFQUFFLEVBQ3RELFVBQXdELEVBQUU7WUFFMUQsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMzQixNQUFNLElBQUksZ0JBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDekQsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLG9CQUFvQixFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzFGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzdELENBQUM7UUFDRixDQUFDO1FBRU8sV0FBVyxDQUNsQixRQUE4QixFQUM5QixRQUFrQixFQUNsQixXQUFtQixFQUNuQixtQkFBOEMsbUJBQVEsQ0FBQyxLQUFLLEVBQUUsRUFDOUQsT0FBcUQsRUFDckQsYUFBYSxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQUksQ0FBQztZQUV0QyxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pFLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzVFLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQztZQUN2QyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLElBQUksR0FBRyxJQUFJLGNBQU8sQ0FDdkIsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVksRUFBRSxFQUM5QztnQkFDQyxXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUM7b0JBQ2xCLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQztvQkFDdEMsR0FBRyxRQUFRO29CQUNYLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQztpQkFDakQsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzthQUNoRCxDQUNELENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXJCLDhEQUE4RDtZQUM5RCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsVUFBVSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7Z0JBQ25DLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNwRSxDQUFDO1lBRUQsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QyxNQUFNLGFBQWEsR0FBRyxDQUFDLFlBQW9CLEVBQUUsWUFBb0IsRUFBRSxLQUFhLEVBQUUsRUFBRTtnQkFDbkYsSUFBSSxhQUFhLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDaEMsWUFBWSxFQUFFLENBQUM7d0JBQ2YsWUFBWSxFQUFFLENBQUM7d0JBQ2YsSUFBSSxDQUFDLFdBQVcsQ0FDZixRQUFRLEVBQ1IsQ0FBQyxHQUFHLGNBQWMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLEVBQ3BDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFDdkIsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLFFBQVEsRUFDL0IsT0FBTyxFQUNQLGFBQWEsR0FBRyxDQUFDLENBQ2pCLENBQUM7b0JBQ0gsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBRUYsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxLQUFLLEdBQUcsV0FBVyxDQUFDLENBQUM7WUFDM0UsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUNqQyxLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztnQkFDckYsYUFBYSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxHQUFHLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztnQkFDbkcsVUFBVSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7Z0JBQ2xDLFVBQVUsR0FBRyxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztnQkFFMUMsSUFBSSxDQUFDLFlBQVksQ0FDaEIsQ0FBQyxHQUFHLGNBQWMsRUFBRSxVQUFVLENBQUMsRUFDL0IsTUFBTSxDQUFDLGNBQWMsRUFDckIsbUJBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxVQUFVLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUN4RSxPQUFPLENBQ1AsQ0FBQztZQUNILENBQUM7WUFFRCxxRkFBcUY7WUFDckYsYUFBYSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVPLFlBQVksQ0FDbkIsUUFBa0IsRUFDbEIsV0FBbUIsRUFDbkIsV0FBc0MsbUJBQVEsQ0FBQyxLQUFLLEVBQUUsRUFDdEQsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLG9CQUFvQixFQUFnRDtZQUV4RyxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9GLE1BQU0sd0JBQXdCLEdBQWdDLEVBQUUsQ0FBQztZQUNqRSxNQUFNLHFCQUFxQixHQUFHLG1CQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsZ0NBQXdCLENBQUMsOEJBQXNCLEVBQUUsUUFBUSxFQUFFLHdCQUF3QixFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFFMU4sTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFaEQsbUVBQW1FO1lBQ25FLGVBQWU7WUFDZixJQUFJLHNCQUFzQixHQUFHLENBQUMsQ0FBQztZQUUvQixLQUFLLElBQUksQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN2RSxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVyQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDbkIsc0JBQXNCLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDO29CQUNqRCxNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQXFDLEVBQUUsQ0FBQztZQUMzRCxJQUFJLDRCQUE0QixHQUFHLENBQUMsQ0FBQztZQUNyQyxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7WUFFeEIsS0FBSyxNQUFNLEtBQUssSUFBSSxxQkFBcUIsRUFBRSxDQUFDO2dCQUMzQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMxQixlQUFlLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQztnQkFFekMsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ25CLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxzQkFBc0IsR0FBRyw0QkFBNEIsRUFBRSxDQUFDO2dCQUNuRixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFHLElBQUEsZUFBTSxFQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUV4RixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDM0IsVUFBVSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7WUFDcEMsQ0FBQztpQkFBTSxJQUFJLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbkMsSUFBQSxlQUFNLEVBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsSSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsVUFBVSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN6RyxDQUFDO1lBRUQsMkRBQTJEO1lBQzNELElBQUksMkJBQTJCLEdBQUcsQ0FBQyxDQUFDO1lBRXBDLEtBQUssTUFBTSxLQUFLLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xDLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNuQiwyQkFBMkIsRUFBRSxDQUFDO2dCQUMvQixDQUFDO1lBQ0YsQ0FBQztZQUVELDZEQUE2RDtZQUM3RCxJQUFJLDJCQUEyQixLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2QyxLQUFLLElBQUksQ0FBQyxHQUFHLFNBQVMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUNwRixNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUVyQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDbkIsS0FBSyxDQUFDLGlCQUFpQixJQUFJLDJCQUEyQixDQUFDO29CQUN4RCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQseUNBQXlDO1lBQ3pDLFVBQVUsQ0FBQyxvQkFBb0IsSUFBSSw0QkFBNEIsR0FBRywyQkFBMkIsQ0FBQztZQUU5RixJQUFJLFFBQVEsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxrQkFBa0IsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRTlHLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxVQUFVLEVBQUUsZUFBZSxHQUFHLGtCQUFrQixDQUFDLENBQUM7Z0JBQ3ZGLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBQzNFLENBQUM7WUFFRCxJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNoRCxNQUFNLEtBQUssR0FBRyxDQUFDLElBQStCLEVBQUUsRUFBRTtvQkFDakQsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUIsQ0FBQyxDQUFDO2dCQUVGLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0IsQ0FBQztZQUVELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBRXZFLElBQUksSUFBSSxHQUErQyxVQUFVLENBQUM7WUFFbEUsT0FBTyxJQUFJLEVBQUUsQ0FBQztnQkFDYixJQUFJLElBQUksQ0FBQyxVQUFVLG1DQUEyQixFQUFFLENBQUM7b0JBQ2hELHNEQUFzRDtvQkFDdEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQ3BELE1BQU07Z0JBQ1AsQ0FBQztnQkFFRCxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNwQixDQUFDO1FBQ0YsQ0FBQztRQUVELFFBQVEsQ0FBQyxRQUFrQjtZQUMxQixJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sSUFBSSxnQkFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTlFLElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDeEMsQ0FBQztRQUNGLENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxRQUFrQixFQUFFLE1BQTBCO1lBQ2pFLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxJQUFJLGdCQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFFRCxNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlELElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFRCxHQUFHLENBQUMsUUFBa0I7WUFDckIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxZQUFZLENBQUMsUUFBa0I7WUFDOUIsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pGLE9BQU8sT0FBTyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsa0JBQWtCLENBQUMsUUFBa0I7WUFDcEMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGVBQWUsQ0FBQztRQUNuRCxDQUFDO1FBRUQsYUFBYSxDQUFDLFFBQWtCO1lBQy9CLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFDL0MsQ0FBQztRQUVELGNBQWMsQ0FBQyxRQUFrQixFQUFFLFdBQXFCO1lBQ3ZELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFeEMsSUFBSSxPQUFPLFdBQVcsS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDeEMsV0FBVyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUNqQyxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQTJCLEVBQUUsV0FBVyxFQUFFLENBQUM7WUFDdkQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDeEYsQ0FBQztRQUVELFdBQVcsQ0FBQyxRQUFrQjtZQUM3QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQzdDLENBQUM7UUFFRCxZQUFZLENBQUMsUUFBa0IsRUFBRSxTQUFtQixFQUFFLFNBQW1CO1lBQ3hFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFeEMsSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDdEMsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUM3QixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQXlCLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLElBQUksS0FBSyxFQUFFLENBQUM7WUFDbEYsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDeEYsQ0FBQztRQUVPLGlCQUFpQixDQUFDLFFBQWtCLEVBQUUsTUFBMkI7WUFDeEUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTlFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUVqRixJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyx3QkFBd0IsSUFBSSxNQUFNLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEssSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFFL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQy9DLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRS9CLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNuQixJQUFJLHFCQUFxQixHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ2hDLHFCQUFxQixHQUFHLENBQUMsQ0FBQyxDQUFDOzRCQUMzQixNQUFNO3dCQUNQLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxxQkFBcUIsR0FBRyxDQUFDLENBQUM7d0JBQzNCLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUkscUJBQXFCLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsR0FBRyxRQUFRLEVBQUUscUJBQXFCLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDdEUsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyx5QkFBeUIsQ0FBQyxJQUFvQyxFQUFFLFNBQWlCLEVBQUUsUUFBaUIsRUFBRSxNQUEyQjtZQUN4SSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUUvRCxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMzQyxPQUFPLE1BQU0sQ0FBQztZQUNmLENBQUM7WUFFRCxNQUFNLHVCQUF1QixHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDckQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFELE1BQU0sV0FBVyxHQUFHLHVCQUF1QixHQUFHLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVoRSxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxJQUFvQyxFQUFFLE1BQTJCLEVBQUUsSUFBYTtZQUM3RyxJQUFJLE1BQWUsQ0FBQztZQUVwQixJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDaEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksd0JBQXdCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDdEMsTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLEtBQUssTUFBTSxDQUFDLFdBQVcsQ0FBQztvQkFDakQsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO2dCQUN2QyxDQUFDO3FCQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQzlCLE1BQU0sR0FBRyxLQUFLLENBQUM7Z0JBQ2hCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsS0FBSyxNQUFNLENBQUMsU0FBUyxDQUFDO29CQUM3QyxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQ25DLENBQUM7Z0JBRUQsSUFBSSxNQUFNLEVBQUUsQ0FBQztvQkFDWixJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3JELENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDM0QsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ25DLE1BQU0sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUM7Z0JBQ3BFLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQsUUFBUSxDQUFDLFFBQWtCO1lBQzFCLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRTtnQkFDcEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFdEMsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3BCLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO29CQUNuQixRQUFRLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFFbEQsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ3BCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO29CQUMxRSxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxRQUFRO1lBQ1AsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUMxRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSx1QkFBdUIsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFTyxjQUFjLENBQ3JCLFdBQTRCLEVBQzVCLE1BQXNDLEVBQ3RDLGdCQUFnQyxFQUNoQyxRQUFpQixFQUNqQixnQkFBNkMsRUFDN0MsZUFBMkQ7WUFFM0QsTUFBTSxJQUFJLEdBQW1DO2dCQUM1QyxNQUFNO2dCQUNOLE9BQU8sRUFBRSxXQUFXLENBQUMsT0FBTztnQkFDNUIsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQztnQkFDdkIsb0JBQW9CLEVBQUUsQ0FBQztnQkFDdkIsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO2dCQUNyQixXQUFXLEVBQUUsT0FBTyxXQUFXLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLFdBQVcsQ0FBQyxTQUFTLEtBQUssV0FBVyxDQUFDO2dCQUNwSSxTQUFTLEVBQUUsT0FBTyxXQUFXLENBQUMsU0FBUyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsU0FBUztnQkFDeEcsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLFVBQVUsZ0NBQXdCO2dCQUNsQyxPQUFPLEVBQUUsSUFBSTtnQkFDYixVQUFVLEVBQUUsU0FBUzthQUNyQixDQUFDO1lBRUYsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM1RCxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUU3QixJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QixDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLFFBQVEsSUFBSSxtQkFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQy9ELE1BQU0sYUFBYSxHQUFHLFFBQVEsSUFBSSxVQUFVLGtDQUEwQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUUxRixJQUFJLG9CQUFvQixHQUFHLENBQUMsQ0FBQztZQUM3QixJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7WUFFeEIsS0FBSyxNQUFNLEVBQUUsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDLENBQUM7Z0JBQzFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMxQixlQUFlLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQztnQkFFekMsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ25CLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxvQkFBb0IsRUFBRSxDQUFDO2dCQUNsRCxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBRUQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG9CQUFvQixDQUFDO1lBQ2pELElBQUksQ0FBQyxPQUFPLEdBQUcsVUFBVSxtQ0FBMkIsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsbUNBQTJCLENBQUMsQ0FBQztZQUUxSCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuQixJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQztnQkFFekIsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDZCxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDeEIsQ0FBQztZQUNGLENBQUM7aUJBQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7WUFDeEMsQ0FBQztZQUVELGVBQWUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXhCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVPLDZCQUE2QixDQUFDLElBQW9DO1lBQ3pFLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNyRCxNQUFNLE1BQU0sR0FBZ0MsRUFBRSxDQUFDO1lBRS9DLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyx1QkFBdUIsQ0FBQyxDQUFDO1lBRTNGLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVPLDhCQUE4QixDQUFDLElBQW9DLEVBQUUsTUFBbUM7WUFDL0csSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUM1QixPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1lBRXpCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3JCLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNuQyxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzVFLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVPLDJCQUEyQixDQUFDLElBQW9DO1lBQ3ZFLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNyRCxNQUFNLE1BQU0sR0FBZ0MsRUFBRSxDQUFDO1lBRS9DLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLGdDQUF3QixDQUFDLDhCQUFzQixFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQy9HLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsdUJBQXVCLENBQUMsQ0FBQztZQUUzRixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyw0QkFBNEIsQ0FBQyxJQUFvQyxFQUFFLGdCQUFnQyxFQUFFLE1BQW1DLEVBQUUsUUFBUSxHQUFHLElBQUk7WUFDaEssSUFBSSxVQUEwQixDQUFDO1lBRS9CLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDeEIsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBRXRELElBQUksVUFBVSxrQ0FBMEIsRUFBRSxDQUFDO29CQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztvQkFDckIsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7b0JBQ3pCLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBRUQsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDZCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNuQixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUN4QyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVsRCxJQUFJLHFCQUFxQixHQUFHLEtBQUssQ0FBQztZQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxVQUFXLGtDQUEwQixFQUFFLENBQUM7Z0JBQzlELElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO2dCQUUxQixLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDbkMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEtBQUssRUFBRSxVQUFXLEVBQUUsTUFBTSxFQUFFLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxxQkFBcUIsQ0FBQztvQkFFNUksSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ25CLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsRUFBRSxDQUFDO29CQUMvQyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLGlCQUFpQixDQUFDO1lBQy9DLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFFRCxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxPQUFPLEdBQUcsVUFBVyxtQ0FBMkIsQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVyxtQ0FBMkIsQ0FBQyxDQUFDO2dCQUN6SCxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVcsQ0FBQztZQUMvQixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7Z0JBRXpCLElBQUksUUFBUSxFQUFFLENBQUM7b0JBQ2QsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNkLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxlQUFlLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQztZQUMzRCxDQUFDO1lBRUQsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVPLCtCQUErQixDQUFDLElBQWdELEVBQUUsSUFBWTtZQUNyRyxJQUFJLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDaEIsT0FBTztZQUNSLENBQUM7WUFFRCxPQUFPLElBQUksRUFBRSxDQUFDO2dCQUNiLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDO2dCQUM3QixJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNwQixDQUFDO1FBQ0YsQ0FBQztRQUVPLFdBQVcsQ0FBQyxJQUFvQyxFQUFFLGdCQUFnQztZQUN6RixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQywrQkFBdUIsQ0FBQztZQUV6RyxJQUFJLE9BQU8sTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztnQkFDNUIsT0FBTyxNQUFNLENBQUMsQ0FBQyxnQ0FBd0IsQ0FBQyw4QkFBc0IsQ0FBQztZQUNoRSxDQUFDO2lCQUFNLElBQUksY0FBYyxDQUFjLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDOUIsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzNDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztnQkFDNUIsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7UUFFRCxRQUFRO1FBQ0EsV0FBVyxDQUFDLFFBQWtCLEVBQUUsT0FBdUMsSUFBSSxDQUFDLElBQUk7WUFDdkYsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN4QyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDO1lBRWxDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDL0MsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVELFFBQVE7UUFDQSxXQUFXLENBQUMsUUFBa0IsRUFBRSxPQUF1QyxJQUFJLENBQUMsSUFBSTtZQUN2RixJQUFJLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUM7WUFFbEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMvQyxNQUFNLElBQUksZ0JBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDekQsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFRCxZQUFZO1FBQ0osd0JBQXdCLENBQUMsUUFBa0I7WUFDbEQsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMzQixPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQzNFLENBQUM7WUFFRCxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9GLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRTVDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDckQsTUFBTSxJQUFJLGdCQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXhDLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4RSxDQUFDO1FBRU8sMEJBQTBCLENBQUMsUUFBa0IsRUFBRSxPQUF1QyxJQUFJLENBQUMsSUFBSSxFQUFFLFlBQW9CLENBQUMsRUFBRSxRQUFRLEdBQUcsSUFBSSxFQUFFLE9BQU8sR0FBRyxJQUFJO1lBQzlKLE1BQU0sQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUM7WUFFbEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMvQyxNQUFNLElBQUksZ0JBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDekQsQ0FBQztZQUVELGtCQUFrQjtZQUNsQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2hDLFNBQVMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztZQUMvQyxDQUFDO1lBRUQsUUFBUSxHQUFHLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDdkMsT0FBTyxHQUFHLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDO1lBRWxDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdkIsT0FBTyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUMzRCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsU0FBUyxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEcsQ0FBQztRQUVELE9BQU8sQ0FBQyxXQUFxQixFQUFFO1lBQzlCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsa0JBQWtCO1FBQ2xCLGVBQWUsQ0FBQyxJQUErQjtZQUM5QyxNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7WUFDOUIsSUFBSSxhQUFhLEdBQUcsSUFBc0MsQ0FBQyxDQUFDLGNBQWM7WUFFMUUsT0FBTyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzdCLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BFLGFBQWEsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDO1lBQ3RDLENBQUM7WUFFRCxPQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQscUJBQXFCLENBQUMsUUFBa0I7WUFDdkMsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMzQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO2lCQUFNLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxJQUFBLGNBQUssRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztRQUVELG9CQUFvQixDQUFDLFFBQWtCO1lBQ3RDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFeEMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDakMsQ0FBQztRQUVELHNCQUFzQixDQUFDLFdBQXFCLEVBQUU7WUFDN0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUV4QyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVPLHVCQUF1QixDQUFDLElBQStCO1lBQzlELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNyQixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlFLENBQUM7S0FDRDtJQXZzQkQsd0NBdXNCQyJ9