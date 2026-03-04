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
define(["require", "exports", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/ui/tree/compressedObjectTreeModel", "vs/base/browser/ui/tree/objectTreeModel", "vs/base/common/decorators", "vs/base/common/iterator"], function (require, exports, abstractTree_1, compressedObjectTreeModel_1, objectTreeModel_1, decorators_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompressibleObjectTree = exports.ObjectTree = void 0;
    class ObjectTree extends abstractTree_1.AbstractTree {
        get onDidChangeCollapseState() { return this.model.onDidChangeCollapseState; }
        constructor(user, container, delegate, renderers, options = {}) {
            super(user, container, delegate, renderers, options);
            this.user = user;
        }
        setChildren(element, children = iterator_1.Iterable.empty(), options) {
            this.model.setChildren(element, children, options);
        }
        rerender(element) {
            if (element === undefined) {
                this.view.rerender();
                return;
            }
            this.model.rerender(element);
        }
        updateElementHeight(element, height) {
            this.model.updateElementHeight(element, height);
        }
        resort(element, recursive = true) {
            this.model.resort(element, recursive);
        }
        hasElement(element) {
            return this.model.has(element);
        }
        createModel(user, view, options) {
            return new objectTreeModel_1.ObjectTreeModel(user, view, options);
        }
    }
    exports.ObjectTree = ObjectTree;
    class CompressibleRenderer {
        get compressedTreeNodeProvider() {
            return this._compressedTreeNodeProvider();
        }
        constructor(_compressedTreeNodeProvider, stickyScrollDelegate, renderer) {
            this._compressedTreeNodeProvider = _compressedTreeNodeProvider;
            this.stickyScrollDelegate = stickyScrollDelegate;
            this.renderer = renderer;
            this.templateId = renderer.templateId;
            if (renderer.onDidChangeTwistieState) {
                this.onDidChangeTwistieState = renderer.onDidChangeTwistieState;
            }
        }
        renderTemplate(container) {
            const data = this.renderer.renderTemplate(container);
            return { compressedTreeNode: undefined, data };
        }
        renderElement(node, index, templateData, height) {
            let compressedTreeNode = this.stickyScrollDelegate.getCompressedNode(node);
            if (!compressedTreeNode) {
                compressedTreeNode = this.compressedTreeNodeProvider.getCompressedTreeNode(node.element);
            }
            if (compressedTreeNode.element.elements.length === 1) {
                templateData.compressedTreeNode = undefined;
                this.renderer.renderElement(node, index, templateData.data, height);
            }
            else {
                templateData.compressedTreeNode = compressedTreeNode;
                this.renderer.renderCompressedElements(compressedTreeNode, index, templateData.data, height);
            }
        }
        disposeElement(node, index, templateData, height) {
            if (templateData.compressedTreeNode) {
                this.renderer.disposeCompressedElements?.(templateData.compressedTreeNode, index, templateData.data, height);
            }
            else {
                this.renderer.disposeElement?.(node, index, templateData.data, height);
            }
        }
        disposeTemplate(templateData) {
            this.renderer.disposeTemplate(templateData.data);
        }
        renderTwistie(element, twistieElement) {
            if (this.renderer.renderTwistie) {
                return this.renderer.renderTwistie(element, twistieElement);
            }
            return false;
        }
    }
    __decorate([
        decorators_1.memoize
    ], CompressibleRenderer.prototype, "compressedTreeNodeProvider", null);
    class CompressibleStickyScrollDelegate {
        constructor(modelProvider) {
            this.modelProvider = modelProvider;
            this.compressedStickyNodes = new Map();
        }
        getCompressedNode(node) {
            return this.compressedStickyNodes.get(node);
        }
        constrainStickyScrollNodes(stickyNodes, stickyScrollMaxItemCount, maxWidgetHeight) {
            this.compressedStickyNodes.clear();
            if (stickyNodes.length === 0) {
                return [];
            }
            for (let i = 0; i < stickyNodes.length; i++) {
                const stickyNode = stickyNodes[i];
                const stickyNodeBottom = stickyNode.position + stickyNode.height;
                const followingReachesMaxHeight = i + 1 < stickyNodes.length && stickyNodeBottom + stickyNodes[i + 1].height > maxWidgetHeight;
                if (followingReachesMaxHeight || i >= stickyScrollMaxItemCount - 1 && stickyScrollMaxItemCount < stickyNodes.length) {
                    const uncompressedStickyNodes = stickyNodes.slice(0, i);
                    const overflowingStickyNodes = stickyNodes.slice(i);
                    const compressedStickyNode = this.compressStickyNodes(overflowingStickyNodes);
                    return [...uncompressedStickyNodes, compressedStickyNode];
                }
            }
            return stickyNodes;
        }
        compressStickyNodes(stickyNodes) {
            if (stickyNodes.length === 0) {
                throw new Error('Can\'t compress empty sticky nodes');
            }
            const compressionModel = this.modelProvider();
            if (!compressionModel.isCompressionEnabled()) {
                return stickyNodes[0];
            }
            // Collect all elements to be compressed
            const elements = [];
            for (let i = 0; i < stickyNodes.length; i++) {
                const stickyNode = stickyNodes[i];
                const compressedNode = compressionModel.getCompressedTreeNode(stickyNode.node.element);
                if (compressedNode.element) {
                    // if an element is incompressible, it can't be compressed with it's parent element
                    if (i !== 0 && compressedNode.element.incompressible) {
                        break;
                    }
                    elements.push(...compressedNode.element.elements);
                }
            }
            if (elements.length < 2) {
                return stickyNodes[0];
            }
            // Compress the elements
            const lastStickyNode = stickyNodes[stickyNodes.length - 1];
            const compressedElement = { elements, incompressible: false };
            const compressedNode = { ...lastStickyNode.node, children: [], element: compressedElement };
            const stickyTreeNode = new Proxy(stickyNodes[0].node, {});
            const compressedStickyNode = {
                node: stickyTreeNode,
                startIndex: stickyNodes[0].startIndex,
                endIndex: lastStickyNode.endIndex,
                position: stickyNodes[0].position,
                height: stickyNodes[0].height,
            };
            this.compressedStickyNodes.set(stickyTreeNode, compressedNode);
            return compressedStickyNode;
        }
    }
    function asObjectTreeOptions(compressedTreeNodeProvider, options) {
        return options && {
            ...options,
            keyboardNavigationLabelProvider: options.keyboardNavigationLabelProvider && {
                getKeyboardNavigationLabel(e) {
                    let compressedTreeNode;
                    try {
                        compressedTreeNode = compressedTreeNodeProvider().getCompressedTreeNode(e);
                    }
                    catch {
                        return options.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(e);
                    }
                    if (compressedTreeNode.element.elements.length === 1) {
                        return options.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(e);
                    }
                    else {
                        return options.keyboardNavigationLabelProvider.getCompressedNodeKeyboardNavigationLabel(compressedTreeNode.element.elements);
                    }
                }
            }
        };
    }
    class CompressibleObjectTree extends ObjectTree {
        constructor(user, container, delegate, renderers, options = {}) {
            const compressedTreeNodeProvider = () => this;
            const stickyScrollDelegate = new CompressibleStickyScrollDelegate(() => this.model);
            const compressibleRenderers = renderers.map(r => new CompressibleRenderer(compressedTreeNodeProvider, stickyScrollDelegate, r));
            super(user, container, delegate, compressibleRenderers, { ...asObjectTreeOptions(compressedTreeNodeProvider, options), stickyScrollDelegate });
        }
        setChildren(element, children = iterator_1.Iterable.empty(), options) {
            this.model.setChildren(element, children, options);
        }
        createModel(user, view, options) {
            return new compressedObjectTreeModel_1.CompressibleObjectTreeModel(user, view, options);
        }
        updateOptions(optionsUpdate = {}) {
            super.updateOptions(optionsUpdate);
            if (typeof optionsUpdate.compressionEnabled !== 'undefined') {
                this.model.setCompressionEnabled(optionsUpdate.compressionEnabled);
            }
        }
        getCompressedTreeNode(element = null) {
            return this.model.getCompressedTreeNode(element);
        }
    }
    exports.CompressibleObjectTree = CompressibleObjectTree;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0VHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS90cmVlL29iamVjdFRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7O0lBbUNoRyxNQUFhLFVBQTJELFNBQVEsMkJBQTZDO1FBSTVILElBQWEsd0JBQXdCLEtBQThELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7UUFFaEosWUFDb0IsSUFBWSxFQUMvQixTQUFzQixFQUN0QixRQUFpQyxFQUNqQyxTQUErQyxFQUMvQyxVQUE4QyxFQUFFO1lBRWhELEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsT0FBb0QsQ0FBQyxDQUFDO1lBTi9FLFNBQUksR0FBSixJQUFJLENBQVE7UUFPaEMsQ0FBQztRQUVELFdBQVcsQ0FBQyxPQUFpQixFQUFFLFdBQTRDLG1CQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsT0FBMEM7WUFDdEksSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRUQsUUFBUSxDQUFDLE9BQVc7WUFDbkIsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELG1CQUFtQixDQUFDLE9BQVUsRUFBRSxNQUEwQjtZQUN6RCxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxN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