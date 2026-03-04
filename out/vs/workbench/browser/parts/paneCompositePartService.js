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
define(["require", "exports", "vs/base/common/event", "vs/base/common/types", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/auxiliarybar/auxiliaryBarPart", "vs/workbench/browser/parts/panel/panelPart", "vs/workbench/browser/parts/sidebar/sidebarPart", "vs/workbench/common/views", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/lifecycle"], function (require, exports, event_1, types_1, extensions_1, instantiation_1, auxiliaryBarPart_1, panelPart_1, sidebarPart_1, views_1, panecomposite_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaneCompositePartService = void 0;
    let PaneCompositePartService = class PaneCompositePartService extends lifecycle_1.Disposable {
        constructor(instantiationService) {
            super();
            this.paneCompositeParts = new Map();
            const panelPart = instantiationService.createInstance(panelPart_1.PanelPart);
            const sideBarPart = instantiationService.createInstance(sidebarPart_1.SidebarPart);
            const auxiliaryBarPart = instantiationService.createInstance(auxiliaryBarPart_1.AuxiliaryBarPart);
            this.paneCompositeParts.set(1 /* ViewContainerLocation.Panel */, panelPart);
            this.paneCompositeParts.set(0 /* ViewContainerLocation.Sidebar */, sideBarPart);
            this.paneCompositeParts.set(2 /* ViewContainerLocation.AuxiliaryBar */, auxiliaryBarPart);
            const eventDisposables = this._register(new lifecycle_1.DisposableStore());
            this.onDidPaneCompositeOpen = event_1.Event.any(...views_1.ViewContainerLocations.map(loc => event_1.Event.map(this.paneCompositeParts.get(loc).onDidPaneCompositeOpen, composite => { return { composite, viewContainerLocation: loc }; }, eventDisposables)));
            this.onDidPaneCompositeClose = event_1.Event.any(...views_1.ViewContainerLocations.map(loc => event_1.Event.map(this.paneCompositeParts.get(loc).onDidPaneCompositeClose, composite => { return { composite, viewContainerLocation: loc }; }, eventDisposables)));
        }
        openPaneComposite(id, viewContainerLocation, focus) {
            return this.getPartByLocation(viewContainerLocation).openPaneComposite(id, focus);
        }
        getActivePaneComposite(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getActivePaneComposite();
        }
        getPaneComposite(id, viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPaneComposite(id);
        }
        getPaneComposites(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPaneComposites();
        }
        getPinnedPaneCompositeIds(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPinnedPaneCompositeIds();
        }
        getVisiblePaneCompositeIds(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getVisiblePaneCompositeIds();
        }
        getProgressIndicator(id, viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getProgressIndicator(id);
        }
        hideActivePaneComposite(viewContainerLocation) {
            this.getPartByLocation(viewContainerLocation).hideActivePaneComposite();
        }
        getLastActivePaneCompositeId(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getLastActivePaneCompositeId();
        }
        getPartByLocation(viewContainerLocation) {
            return (0, types_1.assertIsDefined)(this.paneCompositeParts.get(viewContainerLocation));
        }
    };
    exports.PaneCompositePartService = PaneCompositePartService;
    exports.PaneCompositePartService = PaneCompositePartService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], PaneCompositePartService);
    (0, extensions_1.registerSingleton)(panecomposite_1.IPaneCompositePartService, PaneCompositePartService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZUNvbXBvc2l0ZVBhcnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvcGFuZUNvbXBvc2l0ZVBhcnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTtRQVN2RCxZQUN3QixvQkFBMkM7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFMUSx1QkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBNkMsQ0FBQztZQU8xRixNQUFNLFNBQVMsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMscUJBQVMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sV0FBVyxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx5QkFBVyxDQUFDLENBQUM7WUFDckUsTUFBTSxnQkFBZ0IsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsbUNBQWdCLENBQUMsQ0FBQztZQUUvRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxzQ0FBOEIsU0FBUyxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsd0NBQWdDLFdBQVcsQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLDZDQUFxQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRWxGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxhQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsOEJBQXNCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FB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