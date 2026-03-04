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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/panecomposite", "vs/workbench/common/views", "vs/base/common/lifecycle", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/parts/compositePart", "vs/workbench/browser/parts/paneCompositeBar", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/extensions/common/extensions", "vs/nls", "vs/workbench/browser/dnd", "vs/workbench/common/theme", "vs/workbench/browser/actions", "vs/platform/actions/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/touch", "vs/base/browser/mouseEvent", "vs/base/common/actions", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/hover/browser/hover", "vs/platform/actions/browser/toolbar", "vs/css!./media/paneCompositePart"], function (require, exports, event_1, instantiation_1, panecomposite_1, views_1, lifecycle_1, layoutService_1, compositePart_1, paneCompositeBar_1, dom_1, platform_1, notification_1, storage_1, contextView_1, keybinding_1, themeService_1, contextkey_1, extensions_1, nls_1, dnd_1, theme_1, actions_1, actions_2, actionbar_1, touch_1, mouseEvent_1, actions_3, viewPaneContainer_1, menuEntryActionViewItem_1, hover_1, toolbar_1) {
    "use strict";
    var AbstractPaneCompositePart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractPaneCompositePart = exports.CompositeBarPosition = void 0;
    var CompositeBarPosition;
    (function (CompositeBarPosition) {
        CompositeBarPosition[CompositeBarPosition["TOP"] = 0] = "TOP";
        CompositeBarPosition[CompositeBarPosition["TITLE"] = 1] = "TITLE";
        CompositeBarPosition[CompositeBarPosition["BOTTOM"] = 2] = "BOTTOM";
    })(CompositeBarPosition || (exports.CompositeBarPosition = CompositeBarPosition = {}));
    let AbstractPaneCompositePart = class AbstractPaneCompositePart extends compositePart_1.CompositePart {
        static { AbstractPaneCompositePart_1 = this; }
        static { this.MIN_COMPOSITE_BAR_WIDTH = 50; }
        get snap() {
            // Always allow snapping closed
            // Only allow dragging open if the panel contains view containers
            return this.layoutService.isVisible(this.partId) || !!this.paneCompositeBar.value?.getVisiblePaneCompositeIds().length;
        }
        get onDidPaneCompositeOpen() { return event_1.Event.map(this.onDidCompositeOpen.event, compositeEvent => compositeEvent.composite); }
        constructor(partId, partOptions, activePaneCompositeSettingsKey, activePaneContextKey, paneFocusContextKey, nameForTelemetry, compositeCSSClass, titleForegroundColor, notificationService, storageService, contextMenuService, layoutService, keybindingService, hoverService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, menuService) {
            let location = 0 /* ViewContainerLocation.Sidebar */;
            let registryId = panecomposite_1.Extensions.Viewlets;
            let globalActionsMenuId = actions_2.MenuId.SidebarTitle;
            if (partId === "workbench.parts.panel" /* Parts.PANEL_PART */) {
                location = 1 /* ViewContainerLocation.Panel */;
                registryId = panecomposite_1.Extensions.Panels;
                globalActionsMenuId = actions_2.MenuId.PanelTitle;
            }
            else if (partId === "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) {
                location = 2 /* ViewContainerLocation.AuxiliaryBar */;
                registryId = panecomposite_1.Extensions.Auxiliary;
                globalActionsMenuId = actions_2.MenuId.AuxiliaryBarTitle;
            }
            super(notificationService, storageService, contextMenuService, layoutService, keybindingService, hoverService, instantiationService, themeService, platform_1.Registry.as(registryId), activePaneCompositeSettingsKey, viewDescriptorService.getDefaultViewContainer(location)?.id || '', nameForTelemetry, compositeCSSClass, titleForegroundColor, partId, partOptions);
            this.partId = partId;
            this.activePaneContextKey = activePaneContextKey;
            this.paneFocusContextKey = paneFocusContextKey;
            this.viewDescriptorService = viewDescriptorService;
            this.contextKeyService = contextKeyService;
            this.extensionService = extensionService;
            this.menuService = menuService;
            this.onDidPaneCompositeClose = this.onDidCompositeClose.event;
            this.headerFooterCompositeBarDispoables = this._register(new lifecycle_1.DisposableStore());
            this.paneCompositeBar = this._register(new lifecycle_1.MutableDisposable());
            this.compositeBarPosition = undefined;
            this.blockOpening = false;
            this.location = location;
            this.globalActions = this._register(this.instantiationService.createInstance(actions_1.CompositeMenuActions, globalActionsMenuId, undefined, undefined));
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.onDidPaneCompositeOpen(composite => this.onDidOpen(composite)));
            this._register(this.onDidPaneCompositeClose(this.onDidClose, this));
            this._register(this.globalActions.onDidChange(() => this.updateGlobalToolbarActions()));
            this._register(this.registry.onDidDeregister((viewletDescriptor) => {
                const activeContainers = this.viewDescriptorService.getViewContainersByLocation(this.location)
                    .filter(container => this.viewDescriptorService.getViewContainerModel(container).activeViewDescriptors.length > 0);
                if (activeContainers.length) {
                    if (this.getActiveComposite()?.getId() === viewletDescriptor.id) {
                        const defaultViewletId = this.viewDescriptorService.getDefaultViewContainer(this.location)?.id;
                        const containerToOpen = activeContainers.filter(c => c.id === defaultViewletId)[0] || activeContainers[0];
                        this.doOpenPaneComposite(containerToOpen.id);
                    }
                }
                else {
                    this.layoutService.setPartHidden(true, this.partId);
                }
                this.removeComposite(viewletDescriptor.id);
            }));
            this._register(this.extensionService.onDidRegisterExtensions(() => {
                this.layoutCompositeBar();
            }));
        }
        onDidOpen(composite) {
            this.activePaneContextKey.set(composite.getId());
        }
        onDidClose(composite) {
            const id = composite.getId();
            if (this.activePaneContextKey.get() === id) {
                this.activePaneContextKey.reset();
            }
        }
        showComposite(composite) {
            super.showComposite(composite);
            this.layoutCompositeBar();
            this.layoutEmptyMessage();
        }
        hideActiveComposite() {
            const composite = super.hideActiveComposite();
            this.layoutCompositeBar();
            this.layoutEmptyMessage();
            return composite;
        }
        create(parent) {
            this.element = parent;
            this.element.classList.add('pane-composite-part');
            super.create(parent);
            const contentArea = this.getContentArea();
            if (contentArea) {
                this.createEmptyPaneMessage(contentArea);
            }
            this.updateCompositeBar();
            const focusTracker = this._register((0, dom_1.trackFocus)(parent));
            this._register(focusTracker.onDidFocus(() => this.paneFocusContextKey.set(true)));
            this._register(focusTracker.onDidBlur(() => this.paneFocusContextKey.set(false)));
        }
        createEmptyPaneMessage(parent) {
            this.emptyPaneMessageElement = document.createElement('div');
            this.emptyPaneMessageElement.classList.add('empty-pane-message-area');
            const messageElement = document.createElement('div');
            messageElement.classList.add('empty-pane-message');
            messageElement.innerText = (0, nls_1.localize)('pane.emptyMessage', "Drag a view here to display.");
            this.emptyPaneMessageElement.appendChild(messageElement);
            parent.appendChild(this.emptyPaneMessageElement);
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(this.emptyPaneMessageElement, {
                onDragOver: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    if (this.paneCompositeBar.value) {
                        const validDropTarget = this.paneCompositeBar.value.dndHandler.onDragEnter(e.dragAndDropData, undefined, e.eventData);
                        (0, dnd_1.toggleDropEffect)(e.eventData.dataTransfer, 'move', validDropTarget);
                    }
                },
                onDragEnter: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    if (this.paneCompositeBar.value) {
                        const validDropTarget = this.paneCompositeBar.value.dndHandler.onDragEnter(e.dragAndDropData, undefined, e.eventData);
                        this.emptyPaneMessageElement.style.backgroundColor = validDropTarget ? this.theme.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND)?.toString() || '' : '';
                    }
                },
                onDragLeave: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPaneMessageElement.style.backgroundColor = '';
                },
                onDragEnd: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPaneMessageElement.style.backgroundColor = '';
                },
                onDrop: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPaneMessageElement.style.backgroundColor = '';
                    if (this.paneCompositeBar.value) {
                        this.paneCompositeBar.value.dndHandler.drop(e.dragAndDropData, undefined, e.eventData);
                    }
                },
            }));
        }
        createTitleArea(parent) {
            const titleArea = super.createTitleArea(parent);
            this._register((0, dom_1.addDisposableListener)(titleArea, dom_1.EventType.CONTEXT_MENU, e => {
                this.onTitleAreaContextMenu(new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(titleArea), e));
            }));
            this._register(touch_1.Gesture.addTarget(titleArea));
            this._register((0, dom_1.addDisposableListener)(titleArea, touch_1.EventType.Contextmenu, e => {
                this.onTitleAreaContextMenu(new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(titleArea), e));
            }));
            const globalTitleActionsContainer = titleArea.appendChild((0, dom_1.$)('.global-actions'));
            // Global Actions Toolbar
            this.globalToolBar = this._register(this.instantiationService.createInstance(toolbar_1.WorkbenchToolBar, globalTitleActionsContainer, {
                actionViewItemProvider: (action, options) => this.actionViewItemProvider(action, options),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                anchorAlignmentProvider: () => this.getTitleAreaDropDownAnchorAlignment(),
                toggleMenuTitle: (0, nls_1.localize)('moreActions', "More Actions..."),
                hoverDelegate: this.toolbarHoverDelegate,
                hiddenItemStrategy: -1 /* HiddenItemStrategy.NoHide */
            }));
            this.updateGlobalToolbarActions();
            return titleArea;
        }
        createTitleLabel(parent) {
            this.titleContainer = parent;
            const titleLabel = super.createTitleLabel(parent);
            this.titleLabelElement.draggable = true;
            const draggedItemProvider = () => {
                const activeViewlet = this.getActivePaneComposite();
                return { type: 'composite', id: activeViewlet.getId() };
            };
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerDraggable(this.titleLabelElement, draggedItemProvider, {}));
            return titleLabel;
        }
        updateCompositeBar() {
            const wasCompositeBarVisible = this.compositeBarPosition !== undefined;
            const isCompositeBarVisible = this.shouldShowCompositeBar();
            const previousPosition = this.compositeBarPosition;
            const newPosition = isCompositeBarVisible ? this.getCompositeBarPosition() : undefined;
            // Only update if the visibility or position has changed
            if (previousPosition === newPosition) {
                return;
            }
            // Remove old composite bar
            if (wasCompositeBarVisible) {
                const previousCompositeBarContainer = previousPosition === CompositeBarPosition.TITLE ? this.titleContainer : this.headerFooterCompositeBarContainer;
                if (!this.paneCompositeBarContainer || !this.paneCompositeBar.value || !previousCompositeBarContainer) {
                    throw new Error('Composite bar containers should exist when removing the previous composite bar');
                }
                this.paneCompositeBarContainer.remove();
                this.paneCompositeBarContainer = undefined;
                this.paneCompositeBar.value = undefined;
                previousCompositeBarContainer.classList.remove('has-composite-bar');
                if (previousPosition === CompositeBarPosition.TOP) {
                    this.removeFooterHeaderArea(true);
                }
                else if (previousPosition === CompositeBarPosition.BOTTOM) {
                    this.removeFooterHeaderArea(false);
                }
            }
            // Create new composite bar
            let newCompositeBarContainer;
            switch (newPosition) {
                case CompositeBarPosition.TOP:
                    newCompositeBarContainer = this.createHeaderArea();
                    break;
                case CompositeBarPosition.TITLE:
                    newCompositeBarContainer = this.titleContainer;
                    break;
                case CompositeBarPosition.BOTTOM:
                    newCompositeBarContainer = this.createFooterArea();
                    break;
            }
            if (isCompositeBarVisible) {
                if (this.paneCompositeBarContainer || this.paneCompositeBar.value || !newCompositeBarContainer) {
                    throw new Error('Invalid composite bar state when creating the new composite bar');
                }
                newCompositeBarContainer.classList.add('has-composite-bar');
                this.paneCompositeBarContainer = (0, dom_1.prepend)(newCompositeBarContainer, (0, dom_1.$)('.composite-bar-container'));
                this.paneCompositeBar.value = this.createCompositeBar();
                this.paneCompositeBar.value.create(this.paneCompositeBarContainer);
                if (newPosition === CompositeBarPosition.TOP) {
                    this.setHeaderArea(newCompositeBarContainer);
                }
                else if (newPosition === CompositeBarPosition.BOTTOM) {
                    this.setFooterArea(newCompositeBarContainer);
                }
            }
            this.compositeBarPosition = newPosition;
        }
        createHeaderArea() {
            const headerArea = super.createHeaderArea();
            return this.createHeaderFooterCompositeBarArea(headerArea);
        }
        createFooterArea() {
            const footerArea = super.createFooterArea();
            return this.createHeaderFooterCompositeBarArea(footerArea);
        }
        createHeaderFooterCompositeBarArea(area) {
            if (this.headerFooterCompositeBarContainer) {
                // A pane composite part has either a header or a footer, but not both
                throw new Error('Header or Footer composite bar already exists');
            }
            this.headerFooterCompositeBarContainer = area;
            this.headerFooterCompositeBarDispoables.add((0, dom_1.addDisposableListener)(area, dom_1.EventType.CONTEXT_MENU, e => {
                this.onCompositeBarAreaContextMenu(new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(area), e));
            }));
            this.headerFooterCompositeBarDispoables.add(touch_1.Gesture.addTarget(area));
            this.headerFooterCompositeBarDispoables.add((0, dom_1.addDisposableListener)(area, touch_1.EventType.Contextmenu, e => {
                this.onCompositeBarAreaContextMenu(new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(area), e));
            }));
            return area;
        }
        removeFooterHeaderArea(header) {
            this.headerFooterCompositeBarContainer = undefined;
            this.headerFooterCompositeBarDispoables.clear();
            if (header) {
                this.removeHeaderArea();
            }
            else {
                this.removeFooterArea();
            }
        }
        createCompositeBar() {
            return this.instantiationService.createInstance(paneCompositeBar_1.PaneCompositeBar, this.getCompositeBarOptions(), this.partId, this);
        }
        onTitleAreaUpdate(compositeId) {
            super.onTitleAreaUpdate(compositeId);
            // If title actions change, relayout the composite bar
            this.layoutCompositeBar();
        }
        async openPaneComposite(id, focus) {
            if (typeof id === 'string' && this.getPaneComposite(id)) {
                return this.doOpenPaneComposite(id, focus);
            }
            await this.extensionService.whenInstalledExtensionsRegistered();
            if (typeof id === 'string' && this.getPaneComposite(id)) {
                return this.doOpenPaneComposite(id, focus);
            }
            return undefined;
        }
        doOpenPaneComposite(id, focus) {
            if (this.blockOpening) {
                return undefined; // Workaround against a potential race condition
            }
            if (!this.layoutService.isVisible(this.partId)) {
                try {
                    this.blockOpening = true;
                    this.layoutService.setPartHidden(false, this.partId);
                }
                finally {
                    this.blockOpening = false;
                }
            }
            return this.openComposite(id, focus);
        }
        getPaneComposite(id) {
            return this.registry.getPaneComposite(id);
        }
        getPaneComposites() {
            return this.registry.getPaneComposites()
                .sort((v1, v2) => {
                if (typeof v1.order !== 'number') {
                    return 1;
                }
                if (typeof v2.order !== 'number') {
                    return -1;
                }
                return v1.order - v2.order;
            });
        }
        getPinnedPaneCompositeIds() {
            return this.paneCompositeBar.value?.getPinnedPaneCompositeIds() ?? [];
        }
        getVisiblePaneCompositeIds() {
            return this.paneCompositeBar.value?.getVisiblePaneCompositeIds() ?? [];
        }
        getActivePaneComposite() {
            return this.getActiveComposite();
        }
        getLastActivePaneCompositeId() {
            return this.getLastActiveCompositeId();
        }
        hideActivePaneComposite() {
            if (this.layoutService.isVisible(this.partId)) {
                this.layoutService.setPartHidden(true, this.partId);
            }
            this.hideActiveComposite();
        }
        focusComositeBar() {
            this.paneCompositeBar.value?.focus();
        }
        layout(width, height, top, left) {
            if (!this.layoutService.isVisible(this.partId)) {
                return;
            }
            this.contentDimension = new dom_1.Dimension(width, height);
            // Layout contents
            super.layout(this.contentDimension.width, this.contentDimension.height, top, left);
            // Layout composite bar
            this.layoutCompositeBar();
            // Add empty pane message
            this.layoutEmptyMessage();
        }
        layoutCompositeBar() {
            if (this.contentDimension && this.dimension && this.paneCompositeBar.value) {
                const padding = this.compositeBarPosition === CompositeBarPosition.TITLE ? 16 : 8;
                const borderWidth = this.partId === "workbench.parts.panel" /* Parts.PANEL_PART */ ? 0 : 1;
                let availableWidth = this.contentDimension.width - padding - borderWidth;
                availableWidth = Math.max(AbstractPaneCompositePart_1.MIN_COMPOSITE_BAR_WIDTH, availableWidth - this.getToolbarWidth());
                this.paneCompositeBar.value.layout(availableWidth, this.dimension.height);
            }
        }
        layoutEmptyMessage() {
            const visible = !this.getActiveComposite();
            this.emptyPaneMessageElement?.classList.toggle('visible', visible);
            if (visible) {
                this.titleLabel?.updateTitle('', '');
            }
        }
        updateGlobalToolbarActions() {
            const primaryActions = this.globalActions.getPrimaryActions();
            const secondaryActions = this.globalActions.getSecondaryActions();
            this.globalToolBar?.setActions((0, actionbar_1.prepareActions)(primaryActions), (0, actionbar_1.prepareActions)(secondaryActions));
        }
        getToolbarWidth() {
            if (!this.toolBar || this.compositeBarPosition !== CompositeBarPosition.TITLE) {
                return 0;
            }
            const activePane = this.getActivePaneComposite();
            if (!activePane) {
                return 0;
            }
            // Each toolbar item has 4px margin
            const toolBarWidth = this.toolBar.getItemsWidth() + this.toolBar.getItemsLength() * 4;
            const globalToolBarWidth = this.globalToolBar ? this.globalToolBar.getItemsWidth() + this.globalToolBar.getItemsLength() * 4 : 0;
            return toolBarWidth + globalToolBarWidth + 5; // 5px padding left
        }
        onTitleAreaContextMenu(event) {
            if (this.shouldShowCompositeBar() && this.getCompositeBarPosition() === CompositeBarPosition.TITLE) {
                return this.onCompositeBarContextMenu(event);
            }
            else {
                const activePaneComposite = this.getActivePaneComposite();
                const activePaneCompositeActions = activePaneComposite ? activePaneComposite.getContextMenuActions() : [];
                if (activePaneCompositeActions.length) {
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => event,
                        getActions: () => activePaneCompositeActions,
                        getActionViewItem: (action, options) => this.actionViewItemProvider(action, options),
                        actionRunner: activePaneComposite.getActionRunner(),
                        skipTelemetry: true
                    });
                }
            }
        }
        onCompositeBarAreaContextMenu(event) {
            return this.onCompositeBarContextMenu(event);
        }
        onCompositeBarContextMenu(event) {
            if (this.paneCompositeBar.value) {
                const actions = [...this.paneCompositeBar.value.getContextMenuActions()];
                if (actions.length) {
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => event,
                        getActions: () => actions,
                        skipTelemetry: true
                    });
                }
            }
        }
        getViewsSubmenuAction() {
            const viewPaneContainer = this.getActivePaneComposite()?.getViewPaneContainer();
            if (viewPaneContainer) {
                const disposables = new lifecycle_1.DisposableStore();
                const viewsActions = [];
                const scopedContextKeyService = disposables.add(this.contextKeyService.createScoped(this.element));
                scopedContextKeyService.createKey('viewContainer', viewPaneContainer.viewContainer.id);
                const menu = disposables.add(this.menuService.createMenu(viewPaneContainer_1.ViewsSubMenu, scopedContextKeyService));
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true, renderShortTitle: true }, { primary: viewsActions, secondary: [] }, () => true);
                disposables.dispose();
                return viewsActions.length > 1 && viewsActions.some(a => a.enabled) ? new actions_3.SubmenuAction('views', (0, nls_1.localize)('views', "Views"), viewsActions) : undefined;
            }
            return undefined;
        }
    };
    exports.AbstractPaneCompositePart = AbstractPaneCompositePart;
    exports.AbstractPaneCompositePart = AbstractPaneCompositePart = AbstractPaneCompositePart_1 = __decorate([
        __param(8, notification_1.INotificationService),
        __param(9, storage_1.IStorageService),
        __param(10, contextView_1.IContextMenuService),
        __param(11, layoutService_1.IWorkbenchLayoutService),
        __param(12, keybinding_1.IKeybindingService),
        __param(13, hover_1.IHoverService),
        __param(14, instantiation_1.IInstantiationService),
        __param(15, themeService_1.IThemeService),
        __param(16, views_1.IViewDescriptorService),
        __param(17, contextkey_1.IContextKeyService),
        __param(18, extensions_1.IExtensionService),
        __param(19, actions_2.IMenuService)
    ], AbstractPaneCompositePart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZUNvbXBvc2l0ZVBhcnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9wYW5lQ29tcG9zaXRlUGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBd0NoRyxJQUFZLG9CQUlYO0lBSkQsV0FBWSxvQkFBb0I7UUFDL0IsNkRBQUcsQ0FBQTtRQUNILGlFQUFLLENBQUE7UUFDTCxtRUFBTSxDQUFBO0lBQ1AsQ0FBQyxFQUpXLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBSS9CO0lBdURNLElBQWUseUJBQXlCLEdBQXhDLE1BQWUseUJBQTBCLFNBQVEsNkJBQTRCOztpQkFFM0QsNEJBQXVCLEdBQUcsRUFBRSxBQUFMLENBQU07UUFFckQsSUFBSSxJQUFJO1lBQ1AsK0JBQStCO1lBQy9CLGlFQUFpRTtZQUNqRSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSwwQkFBMEIsRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUN4SCxDQUFDO1FBRUQsSUFBSSxzQkFBc0IsS0FBNEIsT0FBTyxhQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLEVBQUUsQ0FBaUIsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQWtCcEssWUFDVSxNQUF1RSxFQUNoRixXQUF5QixFQUN6Qiw4QkFBc0MsRUFDckIsb0JBQXlDLEVBQ2xELG1CQUF5QyxFQUNqRCxnQkFBd0IsRUFDeEIsaUJBQXlCLEVBQ3pCLG9CQUF3QyxFQUNsQixtQkFBeUMsRUFDOUMsY0FBK0IsRUFD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