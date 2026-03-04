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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/browser/composite", "vs/platform/instantiation/common/instantiation", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/services/extensions/common/extensions", "vs/workbench/browser/parts/views/viewPane"], function (require, exports, platform_1, composite_1, instantiation_1, actions_1, actions_2, contextView_1, storage_1, telemetry_1, themeService_1, workspace_1, viewPaneContainer_1, extensions_1, viewPane_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaneCompositeRegistry = exports.Extensions = exports.PaneCompositeDescriptor = exports.PaneComposite = void 0;
    let PaneComposite = class PaneComposite extends composite_1.Composite {
        constructor(id, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService) {
            super(id, telemetryService, themeService, storageService);
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.extensionService = extensionService;
            this.contextService = contextService;
        }
        create(parent) {
            super.create(parent);
            this.viewPaneContainer = this._register(this.createViewPaneContainer(parent));
            this._register(this.viewPaneContainer.onTitleAreaUpdate(() => this.updateTitleArea()));
            this.viewPaneContainer.create(parent);
        }
        setVisible(visible) {
            super.setVisible(visible);
            this.viewPaneContainer?.setVisible(visible);
        }
        layout(dimension) {
            this.viewPaneContainer?.layout(dimension);
        }
        setBoundarySashes(sashes) {
            this.viewPaneContainer?.setBoundarySashes(sashes);
        }
        getOptimalWidth() {
            return this.viewPaneContainer?.getOptimalWidth() ?? 0;
        }
        openView(id, focus) {
            return this.viewPaneContainer?.openView(id, focus);
        }
        getViewPaneContainer() {
            return this.viewPaneContainer;
        }
        getActionsContext() {
            return this.getViewPaneContainer()?.getActionsContext();
        }
        getContextMenuActions() {
            return this.viewPaneContainer?.menuActions?.getContextMenuActions() ?? [];
        }
        getMenuIds() {
            const result = [];
            if (this.viewPaneContainer?.menuActions) {
                result.push(this.viewPaneContainer.menuActions.menuId);
                if (this.viewPaneContainer.isViewMergedWithContainer()) {
                    result.push(this.viewPaneContainer.panes[0].menuActions.menuId);
                }
            }
            return result;
        }
        getActions() {
            const result = [];
            if (this.viewPaneContainer?.menuActions) {
                result.push(...this.viewPaneContainer.menuActions.getPrimaryActions());
                if (this.viewPaneContainer.isViewMergedWithContainer()) {
                    const viewPane = this.viewPaneContainer.panes[0];
                    if (viewPane.shouldShowFilterInHeader()) {
                        result.push(viewPane_1.VIEWPANE_FILTER_ACTION);
                    }
                    result.push(...viewPane.menuActions.getPrimaryActions());
                }
            }
            return result;
        }
        getSecondaryActions() {
            if (!this.viewPaneContainer?.menuActions) {
                return [];
            }
            const viewPaneActions = this.viewPaneContainer.isViewMergedWithContainer() ? this.viewPaneContainer.panes[0].menuActions.getSecondaryActions() : [];
            let menuActions = this.viewPaneContainer.menuActions.getSecondaryActions();
            const viewsSubmenuActionIndex = menuActions.findIndex(action => action instanceof actions_2.SubmenuItemAction && action.item.submenu === viewPaneContainer_1.ViewsSubMenu);
            if (viewsSubmenuActionIndex !== -1) {
                const viewsSubmenuAction = menuActions[viewsSubmenuActionIndex];
                if (viewsSubmenuAction.actions.some(({ enabled }) => enabled)) {
                    if (menuActions.length === 1 && viewPaneActions.length === 0) {
                        menuActions = viewsSubmenuAction.actions.slice();
                    }
                    else if (viewsSubmenuActionIndex !== 0) {
                        menuActions = [viewsSubmenuAction, ...menuActions.slice(0, viewsSubmenuActionIndex), ...menuActions.slice(viewsSubmenuActionIndex + 1)];
                    }
                }
                else {
                    // Remove views submenu if none of the actions are enabled
                    menuActions.splice(viewsSubmenuActionIndex, 1);
                }
            }
            if (menuActions.length && viewPaneActions.length) {
                return [
                    ...menuActions,
                    new actions_1.Separator(),
                    ...viewPaneActions
                ];
            }
            return menuActions.length ? menuActions : viewPaneActions;
        }
        getActionViewItem(action, options) {
            return this.viewPaneContainer?.getActionViewItem(action, options);
        }
        getTitle() {
            return this.viewPaneContainer?.getTitle() ?? '';
        }
        focus() {
            super.focus();
            this.viewPaneContainer?.focus();
        }
    };
    exports.PaneComposite = PaneComposite;
    exports.PaneComposite = PaneComposite = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, storage_1.IStorageService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, themeService_1.IThemeService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, extensions_1.IExtensionService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], PaneComposite);
    /**
     * A Pane Composite descriptor is a lightweight descriptor of a Pane Composite in the workbench.
     */
    class PaneCompositeDescriptor extends composite_1.CompositeDescriptor {
        static create(ctor, id, name, cssClass, order, requestedIndex, iconUrl) {
            return new PaneCompositeDescriptor(ctor, id, name, cssClass, order, requestedIndex, iconUrl);
        }
        constructor(ctor, id, name, cssClass, order, requestedIndex, iconUrl) {
            super(ctor, id, name, cssClass, order, requestedIndex);
            this.iconUrl = iconUrl;
        }
    }
    exports.PaneCompositeDescriptor = PaneCompositeDescriptor;
    exports.Extensions = {
        Viewlets: 'workbench.contributions.viewlets',
        Panels: 'workbench.contributions.panels',
        Auxiliary: 'workbench.contributions.auxiliary',
    };
    class PaneCompositeRegistry extends composite_1.CompositeRegistry {
        /**
         * Registers a viewlet to the platform.
         */
        registerPaneComposite(descriptor) {
            super.registerComposite(descriptor);
        }
        /**
         * Deregisters a viewlet to the platform.
         */
        deregisterPaneComposite(id) {
            super.deregisterComposite(id);
        }
        /**
         * Returns the viewlet descriptor for the given id or null if none.
         */
        getPaneComposite(id) {
            return this.getComposite(id);
        }
        /**
         * Returns an array of registered viewlets known to the platform.
         */
        getPaneComposites() {
            return this.getComposites();
        }
    }
    exports.PaneCompositeRegistry = PaneCompositeRegistry;
    platform_1.Registry.add(exports.Extensions.Viewlets, new PaneCompositeRegistry());
    platform_1.Registry.add(exports.Extensions.Panels, new PaneCompositeRegistry());
    platform_1.Registry.add(exports.Extensions.Auxiliary, new PaneCompositeRegistry());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWNvbXBvc2l0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhbmVjb21wb3NpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJ6RixJQUFlLGFBQWEsR0FBNUIsTUFBZSxhQUFjLFNBQVEscUJBQVM7UUFJcEQsWUFDQyxFQUFVLEVBQ1MsZ0JBQW1DLEVBQzNCLGNBQStCLEVBQ3pCLG9CQUEyQyxFQUM3RCxZQUEyQixFQUNYLGtCQUF1QyxFQUN6QyxnQkFBbUMsRUFDNUIsY0FBd0M7WUFFNUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFQL0IsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ3pCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFFN0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN6QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQzVCLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtRQUc3RSxDQUFDO1FBRVEsTUFBTSxDQUFDLE1BQW1CO1lBQ2xDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDOUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RixJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxD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