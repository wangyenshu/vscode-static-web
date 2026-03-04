/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/indexTreeModel", "vs/base/browser/ui/tree/tree", "vs/base/common/iterator"], function (require, exports, indexTreeModel_1, tree_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectTreeModel = void 0;
    class ObjectTreeModel {
        get size() { return this.nodes.size; }
        constructor(user, list, options = {}) {
            this.user = user;
            this.rootRef = null;
            this.nodes = new Map();
            this.nodesByIdentity = new Map();
            this.model = new indexTreeModel_1.IndexTreeModel(user, list, null, options);
            this.onDidSplice = this.model.onDidSplice;
            this.onDidChangeCollapseState = this.model.onDidChangeCollapseState;
            this.onDidChangeRenderNodeCount = this.model.onDidChangeRenderNodeCount;
            if (options.sorter) {
                this.sorter = {
                    compare(a, b) {
                        return options.sorter.compare(a.element, b.element);
                    }
                };
            }
            this.identityProvider = options.identityProvider;
        }
        setChildren(element, children = iterator_1.Iterable.empty(), options = {}) {
            const location = this.getElementLocation(element);
            this._setChildren(location, this.preserveCollapseState(children), options);
        }
        _setChildren(location, children = iterator_1.Iterable.empty(), options) {
            const insertedElements = new Set();
            const insertedElementIds = new Set();
            const onDidCreateNode = (node) => {
                if (node.element === null) {
                    return;
                }
                const tnode = node;
                insertedElements.add(tnode.element);
                this.nodes.set(tnode.element, tnode);
                if (this.identityProvider) {
                    const id = this.identityProvider.getId(tnode.element).toString();
                    insertedElementIds.add(id);
                    this.nodesByIdentity.set(id, tnode);
                }
                options.onDidCreateNode?.(tnode);
            };
            const onDidDeleteNode = (node) => {
                if (node.element === null) {
                    return;
                }
                const tnode = node;
                if (!insertedElements.has(tnode.element)) {
                    this.nodes.delete(tnode.element);
                }
                if (this.identityProvider) {
                    const id = this.identityProvider.getId(tnode.element).toString();
                    if (!insertedElementIds.has(id)) {
                        this.nodesByIdentity.delete(id);
                    }
                }
                options.onDidDeleteNode?.(tnode);
            };
            this.model.splice([...location, 0], Number.MAX_VALUE, children, { ...options, onDidCreateNode, onDidDeleteNode });
        }
        preserveCollapseState(elements = iterator_1.Iterable.empty()) {
            if (this.sorter) {
                elements = [...elements].sort(this.sorter.compare.bind(this.sorter));
            }
            return iterator_1.Iterable.map(elements, treeElement => {
                let node = this.nodes.get(treeElement.element);
                if (!node && this.identityProvider) {
                    const id = this.identityProvider.getId(treeElement.element).toString();
                    node = this.nodesByIdentity.get(id);
                }
                if (!node) {
                    let collapsed;
                    if (typeof treeElement.collapsed === 'undefined') {
                        collapsed = undefined;
                    }
                    else if (treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.Collapsed || treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.PreserveOrCollapsed) {
                        collapsed = true;
                    }
                    else if (treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.Expanded || treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded) {
                        collapsed = false;
                    }
                    else {
                        collapsed = Boolean(treeElement.collapsed);
                    }
                    return {
                        ...treeElement,
                        children: this.preserveCollapseState(treeElement.children),
                        collapsed
                    };
                }
                const collapsible = typeof treeElement.collapsible === 'boolean' ? treeElement.collapsible : node.collapsible;
                let collapsed;
                if (typeof treeElement.collapsed === 'undefined' || treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.PreserveOrCollapsed || treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded) {
                    collapsed = node.collapsed;
                }
                else if (treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.Collapsed) {
                    collapsed = true;
                }
                else if (treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.Expanded) {
                    collapsed = false;
                }
                else {
                    collapsed = Boolean(treeElement.collapsed);
                }
                return {
                    ...treeElement,
                    collapsible,
                    collapsed,
                    children: this.preserveCollapseState(treeElement.children)
                };
            });
        }
        rerender(element) {
            const location = this.getElementLocation(element);
            this.model.rerender(location);
        }
        updateElementHeight(element, height) {
            const location = this.getElementLocation(element);
            this.model.updateElementHeight(location, height);
        }
        resort(element = null, recursive = true) {
            if (!this.sorter) {
                return;
            }
            const location = this.getElementLocation(element);
            const node = this.model.getNode(location);
            this._setChildren(location, this.resortChildren(node, recursive), {});
        }
        resortChildren(node, recursive, first = true) {
            let childrenNodes = [...node.children];
            if (recursive || first) {
                childrenNodes = childrenNodes.sort(this.sorter.compare.bind(this.sorter));
            }
            return iterator_1.Iterable.map(childrenNodes, node => ({
                element: node.element,
                collapsible: node.collapsible,
                collapsed: node.collapsed,
                children: this.resortChildren(node, recursive, false)
            }));
        }
        getFirstElementChild(ref = null) {
            const location = this.getElementLocation(ref);
            return this.model.getFirstElementChild(location);
        }
        getLastElementAncestor(ref = null) {
            const location = this.getElementLocation(ref);
            return this.model.getLastElementAncestor(location);
        }
        has(element) {
            return this.nodes.has(element);
        }
        getListIndex(element) {
            const location = this.getElementLocation(element);
            return this.model.getListIndex(location);
        }
        getListRenderCount(element) {
            const location = this.getElementLocation(element);
            return this.model.getListRenderCount(location);
        }
        isCollapsible(element) {
            const location = this.getElementLocation(element);
            return this.model.isCollapsible(location);
        }
        setCollapsible(element, collapsible) {
            const location = this.getElementLocation(element);
            return this.model.setCollapsible(location, collapsible);
        }
        isCollapsed(element) {
            const location = this.getElementLocation(element);
            return this.model.isCollapsed(location);
        }
        setCollapsed(element, collapsed, recursive) {
            const location = this.getElementLocation(element);
            return this.model.setCollapsed(location, collapsed, recursive);
        }
        expandTo(element) {
            const location = this.getElementLocation(element);
            this.model.expandTo(location);
        }
        refilter() {
            this.model.refilter();
        }
        getNode(element = null) {
            if (element === null) {
                return this.model.getNode(this.model.rootRef);
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new tree_1.TreeError(this.user, `Tree element not found: ${element}`);
            }
            return node;
        }
        getNodeLocation(node) {
            return node.element;
        }
        getParentNodeLocation(element) {
            if (element === null) {
                throw new tree_1.TreeError(this.user, `Invalid getParentNodeLocation call`);
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new tree_1.TreeError(this.user, `Tree element not found: ${element}`);
            }
            const location = this.model.getNodeLocation(node);
            const parentLocation = this.model.getParentNodeLocation(location);
            const parent = this.model.getNode(parentLocation);
            return parent.element;
        }
        getElementLocation(element) {
            if (element === null) {
                return [];
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new tree_1.TreeError(this.user, `Tree element not found: ${element}`);
            }
            return this.model.getNodeLocation(node);
        }
    }
    exports.ObjectTreeModel = ObjectTreeModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0VHJlZU1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL3RyZWUvb2JqZWN0VHJlZU1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdCaEcsTUFBYSxlQUFlO1FBYzNCLElBQUksSUFBSSxLQUFhLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRTlDLFlBQ1MsSUFBWSxFQUNwQixJQUFzQyxFQUN0QyxVQUFtRCxFQUFFO1lBRjdDLFNBQUksR0FBSixJQUFJLENBQVE7WUFmWixZQUFPLEdBQUcsSUFBSSxDQUFDO1lBR2hCLFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBdUMsQ0FBQztZQUM5QyxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUFxQyxDQUFDO1lBZS9FLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSwrQkFBYyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7WUFDMUMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsd0JBQTRFLENBQUM7WUFDeEgsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsMEJBQThELENBQUM7WUFFNUcsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxNQUFNLEdBQUc7b0JBQ2IsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUNYLE9BQU8sT0FBTyxDQUFDLE1BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FB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