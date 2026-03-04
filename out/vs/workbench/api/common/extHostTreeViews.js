/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/common/views", "vs/base/common/async", "vs/workbench/api/common/extHostTypes", "vs/base/common/types", "vs/base/common/arrays", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/htmlContent", "vs/base/common/cancellation", "vs/editor/common/services/treeViewsDnd", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls_1, resources_1, uri_1, event_1, lifecycle_1, views_1, async_1, extHostTypes, types_1, arrays_1, extHostTypeConverters_1, htmlContent_1, cancellation_1, treeViewsDnd_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTreeViews = void 0;
    function toTreeItemLabel(label, extension) {
        if ((0, types_1.isString)(label)) {
            return { label };
        }
        if (label
            && typeof label === 'object'
            && typeof label.label === 'string') {
            let highlights = undefined;
            if (Array.isArray(label.highlights)) {
                highlights = label.highlights.filter((highlight => highlight.length === 2 && typeof highlight[0] === 'number' && typeof highlight[1] === 'number'));
                highlights = highlights.length ? highlights : undefined;
            }
            return { label: label.label, highlights };
        }
        return undefined;
    }
    class ExtHostTreeViews extends lifecycle_1.Disposable {
        constructor(_proxy, commands, logService) {
            super();
            this._proxy = _proxy;
            this.commands = commands;
            this.logService = logService;
            this.treeViews = new Map();
            this.treeDragAndDropService = new treeViewsDnd_1.TreeViewsDnDService();
            function isTreeViewConvertableItem(arg) {
                return arg && arg.$treeViewId && (arg.$treeItemHandle || arg.$selectedTreeItems || arg.$focusedTreeItem);
            }
            commands.registerArgumentProcessor({
                processArgument: arg => {
                    if (isTreeViewConvertableItem(arg)) {
                        return this.convertArgument(arg);
                    }
                    else if (Array.isArray(arg) && (arg.length > 0)) {
                        return arg.map(item => {
                            if (isTreeViewConvertableItem(item)) {
                                return this.convertArgument(item);
                            }
                            return item;
                        });
                    }
                    return arg;
                }
            });
        }
        registerTreeDataProvider(id, treeDataProvider, extension) {
            const treeView = this.createTreeView(id, { treeDataProvider }, extension);
            return { dispose: () => treeView.dispose() };
        }
        createTreeView(viewId, options, extension) {
            if (!options || !options.treeDataProvider) {
                throw new Error('Options with treeDataProvider is mandatory');
            }
            const dropMimeTypes = options.dragAndDropController?.dropMimeTypes ?? [];
            const dragMimeTypes = options.dragAndDropController?.dragMimeTypes ?? [];
            const hasHandleDrag = !!options.dragAndDropController?.handleDrag;
            const hasHandleDrop = !!options.dragAndDropController?.handleDrop;
            const treeView = this.createExtHostTreeView(viewId, options, extension);
            const proxyOptions = { showCollapseAll: !!options.showCollapseAll, canSelectMany: !!options.canSelectMany, dropMimeTypes, dragMimeTypes, hasHandleDrag, hasHandleDrop, manuallyManageCheckboxes: !!options.manageCheckboxStateManually };
            const registerPromise = this._proxy.$registerTreeViewDataProvider(viewId, proxyOptions);
            const view = {
                get onDidCollapseElement() { return treeView.onDidCollapseElement; },
                get onDidExpandElement() { return treeView.onDidExpandElement; },
                get selection() { return treeView.selectedElements; },
                get onDidChangeSelection() { return treeView.onDidChangeSelection; },
                get activeItem() {
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'treeViewActiveItem');
                    return treeView.focusedElement;
                },
                get onDidChangeActiveItem() {
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'treeViewActiveItem');
                    return treeView.onDidChangeActiveItem;
                },
                get visible() { return treeView.visible; },
                get onDidChangeVisibility() { return treeView.onDidChangeVisibility; },
                get onDidChangeCheckboxState() {
                    return treeView.onDidChangeCheckboxState;
                },
                get message() { return treeView.message; },
                set message(message) {
                    if ((0, htmlContent_1.isMarkdownString)(message)) {
                        (0, extensions_1.checkProposedApiEnabled)(extension, 'treeViewMarkdownMessage');
                    }
                    treeView.message = message;
                },
                get title() { return treeView.title; },
                set title(title) {
                    treeView.title = title;
                },
                get description() {
                    return treeView.description;
                },
                set description(description) {
                    treeView.description = description;
                },
                get badge() {
                    return treeView.badge;
                },
                set badge(badge) {
                    if ((badge !== undefined) && extHostTypes.ViewBadge.isViewBadge(badge)) {
                        treeView.badge = {
                            value: Math.floor(Math.abs(badge.value)),
                            tooltip: badge.tooltip
                        };
                    }
                    else if (badge === undefined) {
                        treeView.badge = undefined;
                    }
                },
                reveal: (element, options) => {
                    return treeView.reveal(element, options);
                },
                dispose: async () => {
                    // Wait for the registration promise to finish before doing the dispose.
                    await registerPromise;
                    this.treeViews.delete(viewId);
                    treeView.dispose();
                }
            };
            this._register(view);
            return view;
        }
        $getChildren(treeViewId, treeItemHandle) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                return Promise.reject(new views_1.NoTreeViewError(treeViewId));
            }
            return treeView.getChildren(treeItemHandle);
        }
        async $handleDrop(destinationViewId, requestId, treeDataTransferDTO, targetItemHandle, token, operationUuid, sourceViewId, sourceTreeItemHandles) {
            const treeView = this.treeViews.get(destinationViewId);
            if (!treeView) {
                return Promise.reject(new views_1.NoTreeViewError(destinationViewId));
            }
            const treeDataTransfer = extHostTypeConverters_1.DataTransfer.toDataTransfer(treeDataTransferDTO, async (dataItemIndex) => {
                return (await this._proxy.$resolveDropFileData(destinationViewId, requestId, dataItemIndex)).buffer;
            });
            if ((sourceViewId === destinationViewId) && sourceTreeItemHandles) {
                await this.addAdditionalTransferItems(treeDataTransfer, treeView, sourceTreeItemHandles, token, operationUuid);
            }
            return treeView.onDrop(treeDataTransfer, targetItemHandle, token);
        }
        async addAdditionalTransferItems(treeDataTransfer, treeView, sourceTreeItemHandles, token, operationUuid) {
            const existingTransferOperation = this.treeDragAndDropService.removeDragOperationTransfer(operationUuid);
            if (existingTransferOperation) {
                (await existingTransferOperation)?.forEach((value, key) => {
                    if (value) {
                        treeDataTransfer.set(key, value);
                    }
                });
            }
            else if (operationUuid && treeView.handleDrag) {
                const willDropPromise = treeView.handleDrag(sourceTreeItemHandles, treeDataTransfer, token);
                this.treeDragAndDropService.addDragOperationTransfer(operationUuid, willDropPromise);
                await willDropPromise;
            }
            return treeDataTransfer;
        }
        async $handleDrag(sourceViewId, sourceTreeItemHandles, operationUuid, token) {
            const treeView = this.treeViews.get(sourceViewId);
            if (!treeView) {
                return Promise.reject(new views_1.NoTreeViewError(sourceViewId));
            }
            const treeDataTransfer = await this.addAdditionalTransferItems(new extHostTypes.DataTransfer(), treeView, sourceTreeItemHandles, token, operationUuid);
            if (!treeDataTransfer || token.isCancellationRequested) {
                return;
            }
            return extHostTypeConverters_1.DataTransfer.from(treeDataTransfer);
        }
        async $hasResolve(treeViewId) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new views_1.NoTreeViewError(treeViewId);
            }
            return treeView.hasResolve;
        }
        $resolve(treeViewId, treeItemHandle, token) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new views_1.NoTreeViewError(treeViewId);
            }
            return treeView.resolveTreeItem(treeItemHandle, token);
        }
        $setExpanded(treeViewId, treeItemHandle, expanded) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new views_1.NoTreeViewError(treeViewId);
            }
            treeView.setExpanded(treeItemHandle, expanded);
        }
        $setSelectionAndFocus(treeViewId, selectedHandles, focusedHandle) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new views_1.NoTreeViewError(treeViewId);
            }
            treeView.setSelectionAndFocus(selectedHandles, focusedHandle);
        }
        $setVisible(treeViewId, isVisible) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                if (!isVisible) {
                    return;
                }
                throw new views_1.NoTreeViewError(treeViewId);
            }
            treeView.setVisible(isVisible);
        }
        $changeCheckboxState(treeViewId, checkboxUpdate) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new views_1.NoTreeViewError(treeViewId);
            }
            treeView.setCheckboxState(checkboxUpdate);
        }
        createExtHostTreeView(id, options, extension) {
            const treeView = this._register(new ExtHostTreeView(id, options, this._proxy, this.commands.converter, this.logService, extension));
            this.treeViews.set(id, treeView);
            return treeView;
        }
        convertArgument(arg) {
            const treeView = this.treeViews.get(arg.$treeViewId);
            if (treeView && '$treeItemHandle' in arg) {
                return treeView.getExtensionElement(arg.$treeItemHandle);
            }
            if (treeView && '$focusedTreeItem' in arg && arg.$focusedTreeItem) {
                return treeView.focusedElement;
            }
            return null;
        }
    }
    exports.ExtHostTreeViews = ExtHostTreeViews;
    class ExtHostTreeView extends lifecycle_1.Disposable {
        static { this.LABEL_HANDLE_PREFIX = '0'; }
        static { this.ID_HANDLE_PREFIX = '1'; }
        get visible() { return this._visible; }
        get selectedElements() { return this._selectedHandles.map(handle => this.getExtensionElement(handle)).filter(element => !(0, types_1.isUndefinedOrNull)(element)); }
        get focusedElement() { return (this._focusedHandle ? this.getExtensionElement(this._focusedHandle) : undefined); }
        constructor(viewId, options, proxy, commands, logService, extension) {
            super();
            this.viewId = viewId;
            this.proxy = proxy;
            this.commands = commands;
            this.logService = logService;
            this.extension = extension;
            this.roots = undefined;
            this.elements = new Map();
            this.nodes = new Map();
            this._visible = false;
            this._selectedHandles = [];
            this._focusedHandle = undefined;
            this._onDidExpandElement = this._register(new event_1.Emitter());
            this.onDidExpandElement = this._onDidExpandElement.event;
            this._onDidCollapseElement = this._register(new event_1.Emitter());
            this.onDidCollapseElement = this._onDidCollapseElement.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeActiveItem = this._register(new event_1.Emitter());
            this.onDidChangeActiveItem = this._onDidChangeActiveItem.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidChangeCheckboxState = this._register(new event_1.Emitter());
            this.onDidChangeCheckboxState = this._onDidChangeCheckboxState.event;
            this._onDidChangeData = this._register(new event_1.Emitter());
            this.refreshPromise = Promise.resolve();
            this.refreshQueue = Promise.resolve();
            this._message = '';
            this._title = '';
            this._refreshCancellationSource = new cancellation_1.CancellationTokenSource();
            if (extension.contributes && extension.contributes.views) {
                for (const location in extension.contributes.views) {
                    for (const view of extension.contributes.views[location]) {
                        if (view.id === viewId) {
                            this._title = view.name;
                        }
                    }
                }
            }
            this.dataProvider = options.treeDataProvider;
            this.dndController = options.dragAndDropController;
            if (this.dataProvider.onDidChangeTreeData) {
                this._register(this.dataProvider.onDidChangeTreeData(elementOrElements => {
                    if (Array.isArray(elementOrElements) && elementOrElements.length === 0) {
                        return;
                    }
                    this._onDidChangeData.fire({ message: false, element: elementOrElements });
                }));
            }
            let refreshingPromise;
            let promiseCallback;
            const onDidChangeData = event_1.Event.debounce(this._onDidChangeData.event, (result, current) => {
                if (!result) {
                    result = { message: false, elements: [] };
                }
                if (current.element !== false) {
                    if (!refreshingPromise) {
                        // New refresh has started
                        refreshingPromise = new Promise(c => promiseCallback = c);
                        this.refreshPromise = this.refreshPromise.then(() => refreshingPromise);
                    }
                    if (Array.isArray(current.element)) {
                        result.elements.push(...current.element);
                    }
                    else {
                        result.elements.push(current.element);
                    }
                }
                if (current.message) {
                    result.message = true;
                }
                return result;
            }, 200, true);
            this._register(onDidChangeData(({ message, elements }) => {
                if (elements.length) {
                    this.refreshQueue = this.refreshQueue.then(() => {
                        const _promiseCallback = promiseCallback;
                        refreshingPromise = null;
                        return this.refresh(elements).then(() => _promiseCallback());
                    });
                }
                if (message) {
                    this.proxy.$setMessage(this.viewId, extHostTypeConverters_1.MarkdownString.fromStrict(this._message) ?? '');
                }
            }));
        }
        async getChildren(parentHandle) {
            const parentElement = parentHandle ? this.getExtensionElement(parentHandle) : undefined;
            if (parentHandle && !parentElement) {
                this.logService.error(`No tree item with id \'${parentHandle}\' found.`);
                return Promise.resolve([]);
            }
            let childrenNodes = this.getChildrenNodes(parentHandle); // Get it from cache
            if (!childrenNodes) {
                childrenNodes = await this.fetchChildrenNodes(parentElement);
            }
            return childrenNodes ? childrenNodes.map(n => n.item) : undefined;
        }
        getExtensionElement(treeItemHandle) {
            return this.elements.get(treeItemHandle);
        }
        reveal(element, options) {
            options = options ? options : { select: true, focus: false };
            const select = (0, types_1.isUndefinedOrNull)(options.select) ? true : options.select;
            const focus = (0, types_1.isUndefinedOrNull)(options.focus) ? false : options.focus;
            const expand = (0, types_1.isUndefinedOrNull)(options.expand) ? false : options.expand;
            if (typeof this.dataProvider.getParent !== 'function') {
                return Promise.reject(new Error(`Required registered TreeDataProvider to implement 'getParent' method to access 'reveal' method`));
            }
            if (element) {
                return this.refreshPromise
                    .then(() => this.resolveUnknownParentChain(element))
                    .then(parentChain => this.resolveTreeNode(element, parentChain[parentChain.length - 1])
                    .then(treeNode => this.proxy.$reveal(this.viewId, { item: treeNode.item, parentChain: parentChain.map(p => p.item) }, { select, focus, expand })), error => this.logService.error(error));
            }
            else {
                return this.proxy.$reveal(this.viewId, undefined, { select, focus, expand });
            }
        }
        get message() {
            return this._message;
        }
        set message(message) {
            this._message = message;
            this._onDidChangeData.fire({ message: true, element: false });
        }
        get title() {
            return this._title;
        }
        set title(title) {
            this._title = title;
            this.proxy.$setTitle(this.viewId, title, this._description);
        }
        get description() {
            return this._description;
        }
        set description(description) {
            this._description = description;
            this.proxy.$setTitle(this.viewId, this._title, description);
        }
        get badge() {
            return this._badge;
        }
        set badge(badge) {
            if (this._badge?.value === badge?.value &&
                this._badge?.tooltip === badge?.tooltip) {
                return;
            }
            this._badge = extHostTypeConverters_1.ViewBadge.from(badge);
            this.proxy.$setBadge(this.viewId, badge);
        }
        setExpanded(treeItemHandle, expanded) {
            const element = this.getExtensionElement(treeItemHandle);
            if (element) {
                if (expanded) {
                    this._onDidExpandElement.fire(Object.freeze({ element }));
                }
                else {
                    this._onDidCollapseElement.fire(Object.freeze({ element }));
                }
            }
        }
        setSelectionAndFocus(selectedHandles, focusedHandle) {
            const changedSelection = !(0, arrays_1.equals)(this._selectedHandles, selectedHandles);
            this._selectedHandles = selectedHandles;
            const changedFocus = this._focusedHandle !== focusedHandle;
            this._focusedHandle = focusedHandle;
            if (changedSelection) {
                this._onDidChangeSelection.fire(Object.freeze({ selection: this.selectedElements }));
            }
            if (changedFocus) {
                this._onDidChangeActiveItem.fire(Object.freeze({ activeItem: this.focusedElement }));
            }
        }
        setVisible(visible) {
            if (visible !== this._visible) {
                this._visible = visible;
                this._onDidChangeVisibility.fire(Object.freeze({ visible: this._visible }));
            }
        }
        async setCheckboxState(checkboxUpdates) {
            const items = (await Promise.all(checkboxUpdates.map(async (checkboxUpdate) => {
                const extensionItem = this.getExtensionElement(checkboxUpdate.treeItemHandle);
                if (extensionItem) {
                    return {
                        extensionItem: extensionItem,
                        treeItem: await this.dataProvider.getTreeItem(extensionItem),
                        newState: checkboxUpdate.newState ? extHostTypes.TreeItemCheckboxState.Checked : extHostTypes.TreeItemCheckboxState.Unchecked
                    };
                }
                return Promise.resolve(undefined);
            }))).filter((item) => item !== undefined);
            items.forEach(item => {
                item.treeItem.checkboxState = item.newState ? extHostTypes.TreeItemCheckboxState.Checked : extHostTypes.TreeItemCheckboxState.Unchecked;
            });
            this._onDidChangeCheckboxState.fire({ items: items.map(item => [item.extensionItem, item.newState]) });
        }
        async handleDrag(sourceTreeItemHandles, treeDataTransfer, token) {
            const extensionTreeItems = [];
            for (const sourceHandle of sourceTreeItemHandles) {
                const extensionItem = this.getExtensionElement(sourceHandle);
                if (extensionItem) {
                    extensionTreeItems.push(extensionItem);
                }
            }
            if (!this.dndController?.handleDrag || (extensionTreeItems.length === 0)) {
                return;
            }
            await this.dndController.handleDrag(extensionTreeItems, treeDataTransfer, token);
            return treeDataTransfer;
        }
        get hasHandleDrag() {
            return !!this.dndController?.handleDrag;
        }
        async onDrop(treeDataTransfer, targetHandleOrNode, token) {
            const target = targetHandleOrNode ? this.getExtensionElement(targetHandleOrNode) : undefined;
            if ((!target && targetHandleOrNode) || !this.dndController?.handleDrop) {
                return;
            }
            return (0, async_1.asPromise)(() => this.dndController?.handleDrop
                ? this.dndController.handleDrop(target, treeDataTransfer, token)
                : undefined);
        }
        get hasResolve() {
            return !!this.dataProvider.resolveTreeItem;
        }
        async resolveTreeItem(treeItemHandle, token) {
            if (!this.dataProvider.resolveTreeItem) {
                return;
            }
            const element = this.elements.get(treeItemHandle);
            if (element) {
                const node = this.nodes.get(element);
                if (node) {
                    const resolve = await this.dataProvider.resolveTreeItem(node.extensionItem, element, token) ?? node.extensionItem;
                    this.validateTreeItem(resolve);
                    // Resolvable elements. Currently only tooltip and command.
                    node.item.tooltip = this.getTooltip(resolve.tooltip);
                    node.item.command = this.getCommand(node.disposableStore, resolve.command);
                    return node.item;
                }
            }
            return;
        }
        resolveUnknownParentChain(element) {
            return this.resolveParent(element)
                .then((parent) => {
                if (!parent) {
                    return Promise.resolve([]);
                }
                return this.resolveUnknownParentChain(parent)
                    .then(result => this.resolveTreeNode(parent, result[result.length - 1])
                    .then(parentNode => {
                    result.push(parentNode);
                    return result;
                }));
            });
        }
        resolveParent(element) {
            const node = this.nodes.get(element);
            if (node) {
                return Promise.resolve(node.parent ? this.elements.get(node.parent.item.handle) : undefined);
            }
            return (0, async_1.asPromise)(() => this.dataProvider.getParent(element));
        }
        resolveTreeNode(element, parent) {
            const node = this.nodes.get(element);
            if (node) {
                return Promise.resolve(node);
            }
            return (0, async_1.asPromise)(() => this.dataProvider.getTreeItem(element))
                .then(extTreeItem => this.createHandle(element, extTreeItem, parent, true))
                .then(handle => this.getChildren(parent ? parent.item.handle : undefined)
                .then(() => {
                const cachedElement = this.getExtensionElement(handle);
                if (cachedElement) {
                    const node = this.nodes.get(cachedElement);
                    if (node) {
                        return Promise.resolve(node);
                    }
                }
                throw new Error(`Cannot resolve tree item for element ${handle} from extension ${this.extension.identifier.value}`);
            }));
        }
        getChildrenNodes(parentNodeOrHandle) {
            if (parentNodeOrHandle) {
                let parentNode;
                if (typeof parentNodeOrHandle === 'string') {
                    const parentElement = this.getExtensionElement(parentNodeOrHandle);
                    parentNode = parentElement ? this.nodes.get(parentElement) : undefined;
                }
                else {
                    parentNode = parentNodeOrHandle;
                }
                return parentNode ? parentNode.children || undefined : undefined;
            }
            return this.roots;
        }
        async fetchChildrenNodes(parentElement) {
            // clear children cache
            this.clearChildren(parentElement);
            const cts = new cancellation_1.CancellationTokenSource(this._refreshCancellationSource.token);
            try {
                const parentNode = parentElement ? this.nodes.get(parentElement) : undefined;
                const elements = await this.dataProvider.getChildren(parentElement);
                if (cts.token.isCancellationRequested) {
                    return undefined;
                }
                const coalescedElements = (0, arrays_1.coalesce)(elements || []);
                const treeItems = await Promise.all((0, arrays_1.coalesce)(coalescedElements).map(element => {
                    return this.dataProvider.getTreeItem(element);
                }));
                if (cts.token.isCancellationRequested) {
                    return undefined;
                }
                // createAndRegisterTreeNodes adds the nodes to a cache. This must be done sync so that they get added in the correct order.
                const items = treeItems.map((item, index) => item ? this.createAndRegisterTreeNode(coalescedElements[index], item, parentNode) : null);
                return (0, arrays_1.coalesce)(items);
            }
            finally {
                cts.dispose();
            }
        }
        refresh(elements) {
            const hasRoot = elements.some(element => !element);
            if (hasRoot) {
                // Cancel any pending children fetches
                this._refreshCancellationSource.dispose(true);
                this._refreshCancellationSource = new cancellation_1.CancellationTokenSource();
                this.clearAll(); // clear cache
                return this.proxy.$refresh(this.viewId);
            }
            else {
                const handlesToRefresh = this.getHandlesToRefresh(elements);
                if (handlesToRefresh.length) {
                    return this.refreshHandles(handlesToRefresh);
                }
            }
            return Promise.resolve(undefined);
        }
        getHandlesToRefresh(elements) {
            const elementsToUpdate = new Set();
            const elementNodes = elements.map(element => this.nodes.get(element));
            for (const elementNode of elementNodes) {
                if (elementNode && !elementsToUpdate.has(elementNode.item.handle)) {
                    // check if an ancestor of extElement is already in the elements list
                    let currentNode = elementNode;
                    while (currentNode && currentNode.parent && elementNodes.findIndex(node => currentNode && currentNode.parent && node && node.item.handle === currentNode.parent.item.handle) === -1) {
                        const parentElement = this.elements.get(currentNode.parent.item.handle);
                        currentNode = parentElement ? this.nodes.get(parentElement) : undefined;
                    }
                    if (currentNode && !currentNode.parent) {
                        elementsToUpdate.add(elementNode.item.handle);
                    }
                }
            }
            const handlesToUpdate = [];
            // Take only top level elements
            elementsToUpdate.forEach((handle) => {
                const element = this.elements.get(handle);
                if (element) {
                    const node = this.nodes.get(element);
                    if (node && (!node.parent || !elementsToUpdate.has(node.parent.item.handle))) {
                        handlesToUpdate.push(handle);
                    }
                }
            });
            return handlesToUpdate;
        }
        refreshHandles(itemHandles) {
            const itemsToRefresh = {};
            return Promise.all(itemHandles.map(treeItemHandle => this.refreshNode(treeItemHandle)
                .then(node => {
                if (node) {
                    itemsToRefresh[treeItemHandle] = node.item;
                }
            })))
                .then(() => Object.keys(itemsToRefresh).length ? this.proxy.$refresh(this.viewId, itemsToRefresh) : undefined);
        }
        refreshNode(treeItemHandle) {
            const extElement = this.getExtensionElement(treeItemHandle);
            if (extElement) {
                const existing = this.nodes.get(extElement);
                if (existing) {
                    this.clearChildren(extElement); // clear children cache
                    return (0, async_1.asPromise)(() => this.dataProvider.getTreeItem(extElement))
                        .then(extTreeItem => {
                        if (extTreeItem) {
                            const newNode = this.createTreeNode(extElement, extTreeItem, existing.parent);
                            this.updateNodeCache(extElement, newNode, existing, existing.parent);
                            existing.dispose();
                            return newNode;
                        }
                        return null;
                    });
                }
            }
            return Promise.resolve(null);
        }
        createAndRegisterTreeNode(element, extTreeItem, parentNode) {
            const node = this.createTreeNode(element, extTreeItem, parentNode);
            if (extTreeItem.id && this.elements.has(node.item.handle)) {
                throw new Error((0, nls_1.localize)('treeView.duplicateElement', 'Element with id {0} is already registered', extTreeItem.id));
            }
            this.addNodeToCache(element, node);
            this.addNodeToParentCache(node, parentNode);
            return node;
        }
        getTooltip(tooltip) {
            if (extHostTypes.MarkdownString.isMarkdownString(tooltip)) {
                return extHostTypeConverters_1.MarkdownString.from(tooltip);
            }
            return tooltip;
        }
        getCommand(disposable, command) {
            return command ? { ...this.commands.toInternal(command, disposable), originalId: command.command } : undefined;
        }
        getCheckbox(extensionTreeItem) {
            if (extensionTreeItem.checkboxState === undefined) {
                return undefined;
            }
            let checkboxState;
            let tooltip = undefined;
            let accessibilityInformation = undefined;
            if (typeof extensionTreeItem.checkboxState === 'number') {
                checkboxState = extensionTreeItem.checkboxState;
            }
            else {
                checkboxState = extensionTreeItem.checkboxState.state;
                tooltip = extensionTreeItem.checkboxState.tooltip;
                accessibilityInformation = extensionTreeItem.checkboxState.accessibilityInformation;
            }
            return { isChecked: checkboxState === extHostTypes.TreeItemCheckboxState.Checked, tooltip, accessibilityInformation };
        }
        validateTreeItem(extensionTreeItem) {
            if (!extHostTypes.TreeItem.isTreeItem(extensionTreeItem, this.extension)) {
                throw new Error(`Extension ${this.extension.identifier.value} has provided an invalid tree item.`);
            }
        }
        createTreeNode(element, extensionTreeItem, parent) {
            this.validateTreeItem(extensionTreeItem);
            const disposableStore = this._register(new lifecycle_1.DisposableStore());
            const handle = this.createHandle(element, extensionTreeItem, parent);
            const icon = this.getLightIconPath(extensionTreeItem);
            const item = {
                handle,
                parentHandle: parent ? parent.item.handle : undefined,
                label: toTreeItemLabel(extensionTreeItem.label, this.extension),
                description: extensionTreeItem.description,
                resourceUri: extensionTreeItem.resourceUri,
                tooltip: this.getTooltip(extensionTreeItem.tooltip),
                command: this.getCommand(disposableStore, extensionTreeItem.command),
                contextValue: extensionTreeItem.contextValue,
                icon,
                iconDark: this.getDarkIconPath(extensionTreeItem) || icon,
                themeIcon: this.getThemeIcon(extensionTreeItem),
                collapsibleState: (0, types_1.isUndefinedOrNull)(extensionTreeItem.collapsibleState) ? extHostTypes.TreeItemCollapsibleState.None : extensionTreeItem.collapsibleState,
                accessibilityInformation: extensionTreeItem.accessibilityInformation,
                checkbox: this.getCheckbox(extensionTreeItem),
            };
            return {
                item,
                extensionItem: extensionTreeItem,
                parent,
                children: undefined,
                disposableStore,
                dispose() { disposableStore.dispose(); }
            };
        }
        getThemeIcon(extensionTreeItem) {
            return extensionTreeItem.iconPath instanceof extHostTypes.ThemeIcon ? extensionTreeItem.iconPath : undefined;
        }
        createHandle(element, { id, label, resourceUri }, parent, returnFirst) {
            if (id) {
                return `${ExtHostTreeView.ID_HANDLE_PREFIX}/${id}`;
            }
            const treeItemLabel = toTreeItemLabel(label, this.extension);
            const prefix = parent ? parent.item.handle : ExtHostTreeView.LABEL_HANDLE_PREFIX;
            let elementId = treeItemLabel ? treeItemLabel.label : resourceUri ? (0, resources_1.basename)(resourceUri) : '';
            elementId = elementId.indexOf('/') !== -1 ? elementId.replace('/', '//') : elementId;
            const existingHandle = this.nodes.has(element) ? this.nodes.get(element).item.handle : undefined;
            const childrenNodes = (this.getChildrenNodes(parent) || []);
            let handle;
            let counter = 0;
            do {
                handle = `${prefix}/${counter}:${elementId}`;
                if (returnFirst || !this.elements.has(handle) || existingHandle === handle) {
                    // Return first if asked for or
                    // Return if handle does not exist or
                    // Return if handle is being reused
                    break;
                }
                counter++;
            } while (counter <= childrenNodes.length);
            return handle;
        }
        getLightIconPath(extensionTreeItem) {
            if (extensionTreeItem.iconPath && !(extensionTreeItem.iconPath instanceof extHostTypes.ThemeIcon)) {
                if (typeof extensionTreeItem.iconPath === 'string'
                    || uri_1.URI.isUri(extensionTreeItem.iconPath)) {
                    return this.getIconPath(extensionTreeItem.iconPath);
                }
                return this.getIconPath(extensionTreeItem.iconPath.light);
            }
            return undefined;
        }
        getDarkIconPath(extensionTreeItem) {
            if (extensionTreeItem.iconPath && !(extensionTreeItem.iconPath instanceof extHostTypes.ThemeIcon) && extensionTreeItem.iconPath.dark) {
                return this.getIconPath(extensionTreeItem.iconPath.dark);
            }
            return undefined;
        }
        getIconPath(iconPath) {
            if (uri_1.URI.isUri(iconPath)) {
                return iconPath;
            }
            return uri_1.URI.file(iconPath);
        }
        addNodeToCache(element, node) {
            this.elements.set(node.item.handle, element);
            this.nodes.set(element, node);
        }
        updateNodeCache(element, newNode, existing, parentNode) {
            // Remove from the cache
            this.elements.delete(newNode.item.handle);
            this.nodes.delete(element);
            if (newNode.item.handle !== existing.item.handle) {
                this.elements.delete(existing.item.handle);
            }
            // Add the new node to the cache
            this.addNodeToCache(element, newNode);
            // Replace the node in parent's children nodes
            const childrenNodes = (this.getChildrenNodes(parentNode) || []);
            const childNode = childrenNodes.filter(c => c.item.handle === existing.item.handle)[0];
            if (childNode) {
                childrenNodes.splice(childrenNodes.indexOf(childNode), 1, newNode);
            }
        }
        addNodeToParentCache(node, parentNode) {
            if (parentNode) {
                if (!parentNode.children) {
                    parentNode.children = [];
                }
                parentNode.children.push(node);
            }
            else {
                if (!this.roots) {
                    this.roots = [];
                }
                this.roots.push(node);
            }
        }
        clearChildren(parentElement) {
            if (parentElement) {
                const node = this.nodes.get(parentElement);
                if (node) {
                    if (node.children) {
                        for (const child of node.children) {
                            const childElement = this.elements.get(child.item.handle);
                            if (childElement) {
                                this.clear(childElement);
                            }
                        }
                    }
                    node.children = undefined;
                }
            }
            else {
                this.clearAll();
            }
        }
        clear(element) {
            const node = this.nodes.get(element);
            if (node) {
                if (node.children) {
                    for (const child of node.children) {
                        const childElement = this.elements.get(child.item.handle);
                        if (childElement) {
                            this.clear(childElement);
                        }
                    }
                }
                this.nodes.delete(element);
                this.elements.delete(node.item.handle);
                node.dispose();
            }
        }
        clearAll() {
            this.roots = undefined;
            this.elements.clear();
            this.nodes.forEach(node => node.dispose());
            this.nodes.clear();
        }
        dispose() {
            super.dispose();
            this._refreshCancellationSource.dispose();
            this.clearAll();
            this.proxy.$disposeTree(this.viewId);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRyZWVWaWV3cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RUcmVlVmlld3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMEJoRyxTQUFTLGVBQWUsQ0FBQyxLQUFVLEVBQUUsU0FBZ0M7UUFDcEUsSUFBSSxJQUFBLGdCQUFRLEVBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNyQixPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDbEIsQ0FBQztRQUVELElBQUksS0FBSztlQUNMLE9BQU8sS0FBSyxLQUFLLFFBQVE7ZUFDekIsT0FBTyxLQUFLLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLElBQUksVUFBVSxHQUFtQyxTQUFTLENBQUM7WUFDM0QsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxVQUFVLEdBQXdCLEtBQUssQ0FBQyxVQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLElBQUksT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDMUssVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3pELENBQUM7WUFDRCxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLENBQUM7UUFDM0MsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ2xC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