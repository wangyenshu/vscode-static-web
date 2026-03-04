/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/ui/tree/objectTreeModel", "vs/base/browser/ui/tree/tree", "vs/base/common/iterator"], function (require, exports, abstractTree_1, objectTreeModel_1, tree_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataTree = void 0;
    class DataTree extends abstractTree_1.AbstractTree {
        constructor(user, container, delegate, renderers, dataSource, options = {}) {
            super(user, container, delegate, renderers, options);
            this.user = user;
            this.dataSource = dataSource;
            this.nodesByIdentity = new Map();
            this.identityProvider = options.identityProvider;
        }
        // Model
        getInput() {
            return this.input;
        }
        setInput(input, viewState) {
            if (viewState && !this.identityProvider) {
                throw new tree_1.TreeError(this.user, 'Can\'t restore tree view state without an identity provider');
            }
            this.input = input;
            if (!input) {
                this.nodesByIdentity.clear();
                this.model.setChildren(null, iterator_1.Iterable.empty());
                return;
            }
            if (!viewState) {
                this._refresh(input);
                return;
            }
            const focus = [];
            const selection = [];
            const isCollapsed = (element) => {
                const id = this.identityProvider.getId(element).toString();
                return !viewState.expanded[id];
            };
            const onDidCreateNode = (node) => {
                const id = this.identityProvider.getId(node.element).toString();
                if (viewState.focus.has(id)) {
                    focus.push(node.element);
                }
                if (viewState.selection.has(id)) {
                    selection.push(node.element);
                }
            };
            this._refresh(input, isCollapsed, onDidCreateNode);
            this.setFocus(focus);
            this.setSelection(selection);
            if (viewState && typeof viewState.scrollTop === 'number') {
                this.scrollTop = viewState.scrollTop;
            }
        }
        updateChildren(element = this.input) {
            if (typeof this.input === 'undefined') {
                throw new tree_1.TreeError(this.user, 'Tree input not set');
            }
            let isCollapsed;
            if (this.identityProvider) {
                isCollapsed = element => {
                    const id = this.identityProvider.getId(element).toString();
                    const node = this.nodesByIdentity.get(id);
                    if (!node) {
                        return undefined;
                    }
                    return node.collapsed;
                };
            }
            this._refresh(element, isCollapsed);
        }
        resort(element = this.input, recursive = true) {
            this.model.resort((element === this.input ? null : element), recursive);
        }
        // View
        refresh(element) {
            if (element === undefined) {
                this.view.rerender();
                return;
            }
            this.model.rerender(element);
        }
        // Implementation
        _refresh(element, isCollapsed, onDidCreateNode) {
            let onDidDeleteNode;
            if (this.identityProvider) {
                const insertedElements = new Set();
                const outerOnDidCreateNode = onDidCreateNode;
                onDidCreateNode = (node) => {
                    const id = this.identityProvider.getId(node.element).toString();
                    insertedElements.add(id);
                    this.nodesByIdentity.set(id, node);
                    outerOnDidCreateNode?.(node);
                };
                onDidDeleteNode = (node) => {
                    const id = this.identityProvider.getId(node.element).toString();
                    if (!insertedElements.has(id)) {
                        this.nodesByIdentity.delete(id);
                    }
                };
            }
            this.model.setChildren((element === this.input ? null : element), this.iterate(element, isCollapsed).elements, { onDidCreateNode, onDidDeleteNode });
        }
        iterate(element, isCollapsed) {
            const children = [...this.dataSource.getChildren(element)];
            const elements = iterator_1.Iterable.map(children, element => {
                const { elements: children, size } = this.iterate(element, isCollapsed);
                const collapsible = this.dataSource.hasChildren ? this.dataSource.hasChildren(element) : undefined;
                const collapsed = size === 0 ? undefined : (isCollapsed && isCollapsed(element));
                return { element, children, collapsible, collapsed };
            });
            return { elements, size: children.length };
        }
        createModel(user, view, options) {
            return new objectTreeModel_1.ObjectTreeModel(user, view, options);
        }
    }
    exports.DataTree = DataTree;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YVRyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvdHJlZS9kYXRhVHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBYSxRQUF3QyxTQUFRLDJCQUE2QztRQVF6RyxZQUNTLElBQVksRUFDcEIsU0FBc0IsRUFDdEIsUUFBaUMsRUFDakMsU0FBK0MsRUFDdkMsVUFBa0MsRUFDMUMsVUFBNEMsRUFBRTtZQUU5QyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE9BQWtELENBQUMsQ0FBQztZQVB4RixTQUFJLEdBQUosSUFBSSxDQUFRO1lBSVosZUFBVSxHQUFWLFVBQVUsQ0FBd0I7WUFQbkMsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBcUMsQ0FBQztZQVd0RSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDO1FBQ2xELENBQUM7UUFFRCxRQUFRO1FBRVIsUUFBUTtZQUNQLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixDQUFDO1FBRUQsUUFBUSxDQUFDLEtBQXlCLEVBQUUsU0FBaUM7WUFDcEUsSUFBSSxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDekMsTUFBTSxJQUFJLGdCQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSw2REFBNkQsQ0FBQyxDQUFDO1lBQy9GLENBQUM7WUFFRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUVuQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMs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