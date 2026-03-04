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
define(["require", "exports", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/base/common/uuid", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/views/common/viewContainerModel", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/log/common/log"], function (require, exports, views_1, contextkey_1, storage_1, extensions_1, platform_1, lifecycle_1, viewPaneContainer_1, descriptors_1, extensions_2, event_1, telemetry_1, uuid_1, instantiation_1, viewContainerModel_1, actions_1, nls_1, log_1) {
    "use strict";
    var ViewDescriptorService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewDescriptorService = void 0;
    function getViewContainerStorageId(viewContainerId) { return `${viewContainerId}.state`; }
    let ViewDescriptorService = class ViewDescriptorService extends lifecycle_1.Disposable {
        static { ViewDescriptorService_1 = this; }
        static { this.VIEWS_CUSTOMIZATIONS = 'views.customizations'; }
        static { this.COMMON_CONTAINER_ID_PREFIX = 'workbench.views.service'; }
        get viewContainers() { return this.viewContainersRegistry.all; }
        constructor(instantiationService, contextKeyService, storageService, extensionService, telemetryService, loggerService) {
            super();
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.telemetryService = telemetryService;
            this._onDidChangeContainer = this._register(new event_1.Emitter());
            this.onDidChangeContainer = this._onDidChangeContainer.event;
            this._onDidChangeLocation = this._register(new event_1.Emitter());
            this.onDidChangeLocation = this._onDidChangeLocation.event;
            this._onDidChangeContainerLocation = this._register(new event_1.Emitter());
            this.onDidChangeContainerLocation = this._onDidChangeContainerLocation.event;
            this.viewContainerModels = this._register(new lifecycle_1.DisposableMap());
            this.viewsVisibilityActionDisposables = this._register(new lifecycle_1.DisposableMap());
            this.canRegisterViewsVisibilityActions = false;
            this._onDidChangeViewContainers = this._register(new event_1.Emitter());
            this.onDidChangeViewContainers = this._onDidChangeViewContainers.event;
            this.logger = loggerService.createLogger(views_1.VIEWS_LOG_ID, { name: views_1.VIEWS_LOG_NAME, hidden: true });
            this.activeViewContextKeys = new Map();
            this.movableViewContextKeys = new Map();
            this.defaultViewLocationContextKeys = new Map();
            this.defaultViewContainerLocationContextKeys = new Map();
            this.viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            this.viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            this.migrateToViewsCustomizationsStorage();
            this.viewContainersCustomLocations = new Map(Object.entries(this.viewCustomizations.viewContainerLocations));
            this.viewDescriptorsCustomLocations = new Map(Object.entries(this.viewCustomizations.viewLocations));
            this.viewContainerBadgeEnablementStates = new Map(Object.entries(this.viewCustomizations.viewContainerBadgeEnablementStates));
            // Register all containers that were registered before this ctor
            this.viewContainers.forEach(viewContainer => this.onDidRegisterViewContainer(viewContainer));
            this._register(this.viewsRegistry.onViewsRegistered(views => this.onDidRegisterViews(views)));
            this._register(this.viewsRegistry.onViewsDeregistered(({ views, viewContainer }) => this.onDidDeregisterViews(views, viewContainer)));
            this._register(this.viewsRegistry.onDidChangeContainer(({ views, from, to }) => this.onDidChangeDefaultContainer(views, from, to)));
            this._register(this.viewContainersRegistry.onDidRegister(({ viewContainer }) => {
                this.onDidRegisterViewContainer(viewContainer);
                this._onDidChangeViewContainers.fire({ added: [{ container: viewContainer, location: this.getViewContainerLocation(viewContainer) }], removed: [] });
            }));
            this._register(this.viewContainersRegistry.onDidDeregister(({ viewContainer, viewContainerLocation }) => {
                this.onDidDeregisterViewContainer(viewContainer);
                this._onDidChangeViewContainers.fire({ removed: [{ container: viewContainer, location: viewContainerLocation }], added: [] });
            }));
            this._register(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, ViewDescriptorService_1.VIEWS_CUSTOMIZATIONS, this._register(new lifecycle_1.DisposableStore()))(() => this.onDidStorageChange()));
            this.extensionService.whenInstalledExtensionsRegistered().then(() => this.whenExtensionsRegistered());
        }
        migrateToViewsCustomizationsStorage() {
            if (this.storageService.get(ViewDescriptorService_1.VIEWS_CUSTOMIZATIONS, 0 /* StorageScope.PROFILE */)) {
                return;
            }
            const viewContainerLocationsValue = this.storageService.get('views.cachedViewContainerLocations', 0 /* StorageScope.PROFILE */);
            const viewDescriptorLocationsValue = this.storageService.get('views.cachedViewPositions', 0 /* StorageScope.PROFILE */);
            if (!viewContainerLocationsValue && !viewDescriptorLocationsValue) {
                return;
            }
            const viewContainerLocations = viewContainerLocationsValue ? JSON.parse(viewContainerLocationsValue) : [];
            const viewDescriptorLocations = viewDescriptorLocationsValue ? JSON.parse(viewDescriptorLocationsValue) : [];
            const viewsCustomizations = {
                viewContainerLocations: viewContainerLocations.reduce((result, [id, location]) => { result[id] = location; return result; }, {}),
                viewLocations: viewDescriptorLocations.reduce((result, [id, { containerId }]) => { result[id] = containerId; return result; }, {}),
                viewContainerBadgeEnablementStates: {}
            };
            this.storageService.store(ViewDescriptorService_1.VIEWS_CUSTOMIZATIONS, JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            this.storageService.remove('views.cachedViewContainerLocations', 0 /* StorageScope.PROFILE */);
            this.storageService.remove('views.cachedViewPositions', 0 /* StorageScope.PROFILE */);
        }
        registerGroupedViews(groupedViews) {
            for (const [containerId, views] of groupedViews.entries()) {
                const viewContainer = this.viewContainersRegistry.get(containerId);
                // The container has not been registered yet
                if (!viewContainer || !this.viewContainerModels.has(viewContainer)) {
                    // Register if the container is a genarated container
                    if (this.isGeneratedContainerId(containerId)) {
                        const viewContainerLocation = this.viewContainersCustomLocations.get(containerId);
                        if (viewContainerLocation !== undefined) {
                            this.registerGeneratedViewContainer(viewContainerLocation, containerId);
                        }
                    }
                    // Registration of the container handles registration of its views
                    continue;
                }
                // Filter out views that have already been added to the view container model
                // This is needed when statically-registered views are moved to
                // other statically registered containers as they will both try to add on startup
                const viewsToAdd = views.filter(view => this.getViewContainerModel(viewContainer).allViewDescriptors.filter(vd => vd.id === view.id).length === 0);
                this.addViews(viewContainer, viewsToAdd);
            }
        }
        deregisterGroupedViews(groupedViews) {
            for (const [viewContainerId, views] of groupedViews.entries()) {
                const viewContainer = this.viewContainersRegistry.get(viewContainerId);
                // The container has not been registered yet
                if (!viewContainer || !this.viewContainerModels.has(viewContainer)) {
                    continue;
                }
                this.removeViews(viewContainer, views);
            }
        }
        moveOrphanViewsToDefaultLocation() {
            for (const [viewId, containerId] of this.viewDescriptorsCustomLocations.entries()) {
                // check if the view container exists
                if (this.viewContainersRegistry.get(containerId)) {
                    continue;
                }
                // check if view has been registered to default location
                const viewContainer = this.viewsRegistry.getViewContainer(viewId);
                const viewDescriptor = this.getViewDescriptorById(viewId);
                if (viewContainer && viewDescriptor) {
                    this.addViews(viewContainer, [viewDescriptor]);
                }
            }
        }
        whenExtensionsRegistered() {
            // Handle those views whose custom parent view container does not exist anymore
            // May be the extension contributing this view container is no longer installed
            // Or the parent view container is generated and no longer available.
            this.moveOrphanViewsToDefaultLocation();
            // Clean up empty generated view containers
            for (const viewContainerId of [...this.viewContainersCustomLocations.keys()]) {
                this.cleanUpGeneratedViewContainer(viewContainerId);
            }
            // Save updated view customizations after cleanup
            this.saveViewCustomizations();
            // Register visibility actions for all views
            for (const [key, value] of this.viewContainerModels) {
                this.registerViewsVisibilityActions(key, value);
            }
            this.canRegisterViewsVisibilityActions = true;
        }
        onDidRegisterViews(views) {
            this.contextKeyService.bufferChangeEvents(() => {
                views.forEach(({ views, viewContainer }) => {
                    // When views are registered, we need to regroup them based on the customizations
                    const regroupedViews = this.regroupViews(viewContainer.id, views);
                    // Once they are grouped, try registering them which occurs
                    // if the container has already been registered within this service
                    // or we can generate the container from the source view id
                    this.registerGroupedViews(regroupedViews);
                    views.forEach(viewDescriptor => this.getOrCreateMovableViewContextKey(viewDescriptor).set(!!viewDescriptor.canMoveView));
                });
            });
        }
        isGeneratedContainerId(id) {
            return id.startsWith(ViewDescriptorService_1.COMMON_CONTAINER_ID_PREFIX);
        }
        onDidDeregisterViews(views, viewContainer) {
            // When views are registered, we need to regroup them based on the customizations
            const regroupedViews = this.regroupViews(viewContainer.id, views);
            this.deregisterGroupedViews(regroupedViews);
            this.contextKeyService.bufferChangeEvents(() => {
                views.forEach(viewDescriptor => this.getOrCreateMovableViewContextKey(viewDescriptor).set(false));
            });
        }
        regroupViews(containerId, views) {
            const viewsByContainer = new Map();
            for (const viewDescriptor of views) {
                const correctContainerId = this.viewDescriptorsCustomLocations.get(viewDescriptor.id) ?? containerId;
                let containerViews = viewsByContainer.get(correctContainerId);
                if (!containerViews) {
                    viewsByContainer.set(correctContainerId, containerViews = []);
                }
                containerViews.push(viewDescriptor);
            }
            return viewsByContainer;
        }
        getViewDescriptorById(viewId) {
            return this.viewsRegistry.getView(viewId);
        }
        getViewLocationById(viewId) {
            const container = this.getViewContainerByViewId(viewId);
            if (container === null) {
                return null;
            }
            return this.getViewContainerLocation(container);
        }
        getViewContainerByViewId(viewId) {
            const containerId = this.viewDescriptorsCustomLocations.get(viewId);
            return containerId ?
                this.viewContainersRegistry.get(containerId) ?? null :
                this.getDefaultContainerById(viewId);
        }
        getViewContainerLocation(viewContainer) {
            return this.viewContainersCustomLocations.get(viewContainer.id) ?? this.getDefaultViewContainerLocation(viewContainer);
        }
        getDefaultViewContainerLocation(viewContainer) {
            return this.viewContainersRegistry.getViewContainerLocation(viewContainer);
        }
        getDefaultContainerById(viewId) {
            return this.viewsRegistry.getViewContainer(viewId) ?? null;
        }
        getViewContainerModel(container) {
            return this.getOrRegisterViewContainerModel(container);
        }
        getViewContainerById(id) {
            return this.viewContainersRegistry.get(id) || null;
        }
        getViewContainersByLocation(location) {
            return this.viewContainers.filter(v => this.getViewContainerLocation(v) === location);
        }
        getDefaultViewContainer(location) {
            return this.viewContainersRegistry.getDefaultViewContainer(location);
        }
        moveViewContainerToLocation(viewContainer, location, requestedIndex, reason) {
            this.logger.info(`moveViewContainerToLocation: viewContainer:${viewContainer.id} location:${location} reason:${reason}`);
            this.moveViewContainerToLocationWithoutSaving(viewContainer, location, requestedIndex);
            this.saveViewCustomizations();
        }
        getViewContainerBadgeEnablementState(id) {
            return this.viewContainerBadgeEnablementStates.get(id) ?? true;
        }
        setViewContainerBadgeEnablementState(id, badgesEnabled) {
            this.viewContainerBadgeEnablementStates.set(id, badgesEnabled);
            this.saveViewCustomizations();
        }
        moveViewToLocation(view, location, reason) {
            this.logger.info(`moveViewToLocation: view:${view.id} location:${location} reason:${reason}`);
            const container = this.registerGeneratedViewContainer(location);
            this.moveViewsToContainer([view], container);
        }
        moveViewsToContainer(views, viewContainer, visibilityState, reason) {
            if (!views.length) {
                return;
            }
            this.logger.info(`moveViewsToContainer: views:${views.map(view => view.id).join(',')} viewContainer:${viewContainer.id} reason:${reason}`);
            const from = this.getViewContainerByViewId(views[0].id);
            const to = viewContainer;
            if (from && to && from !== to) {
                // Move views
                this.moveViewsWithoutSaving(views, from, to, visibilityState);
                this.cleanUpGeneratedViewContainer(from.id);
                // Save new locations
                this.saveViewCustomizations();
                // Log to telemetry
                this.reportMovedViews(views, from, to);
            }
        }
        reset() {
            for (const viewContainer of this.viewContainers) {
                const viewContainerModel = this.getViewContainerModel(viewContainer);
                for (const viewDescriptor of viewContainerModel.allViewDescriptors) {
                    const defaultContainer = this.getDefaultContainerById(viewDescriptor.id);
                    const currentContainer = this.getViewContainerByViewId(viewDescriptor.id);
                    if (currentContainer && defaultContainer && currentContainer !== defaultContainer) {
                        this.moveViewsWithoutSaving([viewDescriptor], currentContainer, defaultContainer);
                    }
                }
                const defaultContainerLocation = this.getDefaultViewContainerLocation(viewContainer);
                const currentContainerLocation = this.getViewContainerLocation(viewContainer);
                if (defaultContainerLocation !== null && currentContainerLocation !== defaultContainerLocation) {
                    this.moveViewContainerToLocationWithoutSaving(viewContainer, defaultContainerLocation);
                }
                this.cleanUpGeneratedViewContainer(viewContainer.id);
            }
            this.viewContainersCustomLocations.clear();
            this.viewDescriptorsCustomLocations.clear();
            this.saveViewCustomizations();
        }
        isViewContainerRemovedPermanently(viewContainerId) {
            return this.isGeneratedContainerId(viewContainerId) && !this.viewContainersCustomLocations.has(viewContainerId);
        }
        onDidChangeDefaultContainer(views, from, to) {
            const viewsToMove = views.filter(view => !this.viewDescriptorsCustomLocations.has(view.id) // Move views which are not already moved
                || (!this.viewContainers.includes(from) && this.viewDescriptorsCustomLocations.get(view.id) === from.id) // Move views which are moved from a removed container
            );
            if (viewsToMove.length) {
                this.moveViewsWithoutSaving(viewsToMove, from, to);
            }
        }
        reportMovedViews(views, from, to) {
            const containerToString = (container) => {
                if (container.id.startsWith(ViewDescriptorService_1.COMMON_CONTAINER_ID_PREFIX)) {
                    return 'custom';
                }
                if (!container.extensionId) {
                    return container.id;
                }
                return 'extension';
            };
            const oldLocation = this.getViewContainerLocation(from);
            const newLocation = this.getViewContainerLocation(to);
            const viewCount = views.length;
            const fromContainer = containerToString(from);
            const toContainer = containerToString(to);
            const fromLocation = oldLocation === 1 /* ViewContainerLocation.Panel */ ? 'panel' : 'sidebar';
            const toLocation = newLocation === 1 /* ViewContainerLocation.Panel */ ? 'panel' : 'sidebar';
            this.telemetryService.publicLog2('viewDescriptorService.moveViews', { viewCount, fromContainer, toContainer, fromLocation, toLocation });
        }
        moveViewsWithoutSaving(views, from, to, visibilityState = views_1.ViewVisibilityState.Expand) {
            this.removeViews(from, views);
            this.addViews(to, views, visibilityState);
            const oldLocation = this.getViewContainerLocation(from);
            const newLocation = this.getViewContainerLocation(to);
            if (oldLocation !== newLocation) {
                this._onDidChangeLocation.fire({ views, from: oldLocation, to: newLocation });
            }
            this._onDidChangeContainer.fire({ views, from, to });
        }
        moveViewContainerToLocationWithoutSaving(viewContainer, location, requestedIndex) {
            const from = this.getViewContainerLocation(viewContainer);
            const to = location;
            if (from !== to) {
                const isGeneratedViewContainer = this.isGeneratedContainerId(viewContainer.id);
                const isDefaultViewContainerLocation = to === this.getDefaultViewContainerLocation(viewContainer);
                if (isGeneratedViewContainer || !isDefaultViewContainerLocation) {
                    this.viewContainersCustomLocations.set(viewContainer.id, to);
                }
                else {
                    this.viewContainersCustomLocations.delete(viewContainer.id);
                }
                this.getOrCreateDefaultViewContainerLocationContextKey(viewContainer).set(isGeneratedViewContainer || isDefaultViewContainerLocation);
                viewContainer.requestedIndex = requestedIndex;
                this._onDidChangeContainerLocation.fire({ viewContainer, from, to });
                const views = this.getViewsByContainer(viewContainer);
                this._onDidChangeLocation.fire({ views, from, to });
            }
        }
        cleanUpGeneratedViewContainer(viewContainerId) {
            // Skip if container is not generated
            if (!this.isGeneratedContainerId(viewContainerId)) {
                return;
            }
            // Skip if container has views registered
            const viewContainer = this.getViewContainerById(viewContainerId);
            if (viewContainer && this.getViewContainerModel(viewContainer)?.allViewDescriptors.length) {
                return;
            }
            // Skip if container has moved views
            if ([...this.viewDescriptorsCustomLocations.values()].includes(viewContainerId)) {
                return;
            }
            // Deregister the container
            if (viewContainer) {
                this.viewContainersRegistry.deregisterViewContainer(viewContainer);
            }
            this.viewContainersCustomLocations.delete(viewContainerId);
            this.viewContainerBadgeEnablementStates.delete(viewContainerId);
            // Clean up caches of container
            this.storageService.remove((0, viewContainerModel_1.getViewsStateStorageId)(viewContainer?.storageId || getViewContainerStorageId(viewContainerId)), 0 /* StorageScope.PROFILE */);
        }
        registerGeneratedViewContainer(location, existingId) {
            const id = existingId || this.generateContainerId(location);
            const container = this.viewContainersRegistry.registerViewContainer({
                id,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [id, { mergeViewWithContainerWhenSingleView: true }]),
                title: { value: id, original: id }, // we don't want to see this so using id
                icon: location === 0 /* ViewContainerLocation.Sidebar */ ? views_1.defaultViewIcon : undefined,
                storageId: getViewContainerStorageId(id),
                hideIfEmpty: true
            }, location, { doNotRegisterOpenCommand: true });
            if (this.viewContainersCustomLocations.get(container.id) !== location) {
                this.viewContainersCustomLocations.set(container.id, location);
            }
            this.getOrCreateDefaultViewContainerLocationContextKey(container).set(true);
            return container;
        }
        onDidStorageChange() {
            if (JSON.stringify(this.viewCustomizations) !== this.getStoredViewCustomizationsValue() /* This checks if current window changed the value or not */) {
                this.onDidViewCustomizationsStorageChange();
            }
        }
        onDidViewCustomizationsStorageChange() {
            this._viewCustomizations = undefined;
            const newViewContainerCustomizations = new Map(Object.entries(this.viewCustomizations.viewContainerLocations));
            const newViewDescriptorCustomizations = new Map(Object.entries(this.viewCustomizations.viewLocations));
            const viewContainersToMove = [];
            const viewsToMove = [];
            for (const [containerId, location] of newViewContainerCustomizations.entries()) {
                const container = this.getViewContainerById(containerId);
                if (container) {
                    if (location !== this.getViewContainerLocation(container)) {
                        viewContainersToMove.push([container, location]);
                    }
                }
                // If the container is generated and not registered, we register it now
                else if (this.isGeneratedContainerId(containerId)) {
                    this.registerGeneratedViewContainer(location, containerId);
                }
            }
            for (const viewContainer of this.viewContainers) {
                if (!newViewContainerCustomizations.has(viewContainer.id)) {
                    const currentLocation = this.getViewContainerLocation(viewContainer);
                    const defaultLocation = this.getDefaultViewContainerLocation(viewContainer);
                    if (currentLocation !== defaultLocation) {
                        viewContainersToMove.push([viewContainer, defaultLocation]);
                    }
                }
            }
            for (const [viewId, viewContainerId] of newViewDescriptorCustomizations.entries()) {
                const viewDescriptor = this.getViewDescriptorById(viewId);
                if (viewDescriptor) {
                    const prevViewContainer = this.getViewContainerByViewId(viewId);
                    const newViewContainer = this.viewContainersRegistry.get(viewContainerId);
                    if (prevViewContainer && newViewContainer && newViewContainer !== prevViewContainer) {
                        viewsToMove.push({ views: [viewDescriptor], from: prevViewContainer, to: newViewContainer });
                    }
                }
            }
            // If a value is not present in the cache, it must be reset to default
            for (const viewContainer of this.viewContainers) {
                const viewContainerModel = this.getViewContainerModel(viewContainer);
                for (const viewDescriptor of viewContainerModel.allViewDescriptors) {
                    if (!newViewDescriptorCustomizations.has(viewDescriptor.id)) {
                        const currentContainer = this.getViewContainerByViewId(viewDescriptor.id);
                        const defaultContainer = this.getDefaultContainerById(viewDescriptor.id);
                        if (currentContainer && defaultContainer && currentContainer !== defaultContainer) {
                            viewsToMove.push({ views: [viewDescriptor], from: currentContainer, to: defaultContainer });
                        }
                    }
                }
            }
            // Execute View Container Movements
            for (const [container, location] of viewContainersToMove) {
                this.moveViewContainerToLocationWithoutSaving(container, location);
            }
            // Execute View Movements
            for (const { views, from, to } of viewsToMove) {
                this.moveViewsWithoutSaving(views, from, to, views_1.ViewVisibilityState.Default);
            }
            this.viewContainersCustomLocations = newViewContainerCustomizations;
            this.viewDescriptorsCustomLocations = newViewDescriptorCustomizations;
        }
        // Generated Container Id Format
        // {Common Prefix}.{Location}.{Uniqueness Id}
        // Old Format (deprecated)
        // {Common Prefix}.{Uniqueness Id}.{Source View Id}
        generateContainerId(location) {
            return `${ViewDescriptorService_1.COMMON_CONTAINER_ID_PREFIX}.${(0, views_1.ViewContainerLocationToString)(location)}.${(0, uuid_1.generateUuid)()}`;
        }
        saveViewCustomizations() {
            const viewCustomizations = { viewContainerLocations: {}, viewLocations: {}, viewContainerBadgeEnablementStates: {} };
            for (const [containerId, location] of this.viewContainersCustomLocations) {
                const container = this.getViewContainerById(containerId);
                // Skip if the view container is not a generated container and in default location
                if (container && !this.isGeneratedContainerId(containerId) && location === this.getDefaultViewContainerLocation(container)) {
                    continue;
                }
                viewCustomizations.viewContainerLocations[containerId] = location;
            }
            for (const [viewId, viewContainerId] of this.viewDescriptorsCustomLocations) {
                const viewContainer = this.getViewContainerById(viewContainerId);
                if (viewContainer) {
                    const defaultContainer = this.getDefaultContainerById(viewId);
                    // Skip if the view is at default location
                    // https://github.com/microsoft/vscode/issues/90414
                    if (defaultContainer?.id === viewContainer.id) {
                        continue;
                    }
                }
                viewCustomizations.viewLocations[viewId] = viewContainerId;
            }
            // Loop through viewContainerBadgeEnablementStates and save only the ones that are disabled
            for (const [viewContainerId, badgeEnablementState] of this.viewContainerBadgeEnablementStates) {
                if (badgeEnablementState === false) {
                    viewCustomizations.viewContainerBadgeEnablementStates[viewContainerId] = badgeEnablementState;
                }
            }
            this.viewCustomizations = viewCustomizations;
        }
        get viewCustomizations() {
            if (!this._viewCustomizations) {
                this._viewCustomizations = JSON.parse(this.getStoredViewCustomizationsValue());
                this._viewCustomizations.viewContainerLocations = this._viewCustomizations.viewContainerLocations ?? {};
                this._viewCustomizations.viewLocations = this._viewCustomizations.viewLocations ?? {};
                this._viewCustomizations.viewContainerBadgeEnablementStates = this._viewCustomizations.viewContainerBadgeEnablementStates ?? {};
            }
            return this._viewCustomizations;
        }
        set viewCustomizations(viewCustomizations) {
            const value = JSON.stringify(viewCustomizations);
            if (JSON.stringify(this.viewCustomizations) !== value) {
                this._viewCustomizations = viewCustomizations;
                this.setStoredViewCustomizationsValue(value);
            }
        }
        getStoredViewCustomizationsValue() {
            return this.storageService.get(ViewDescriptorService_1.VIEWS_CUSTOMIZATIONS, 0 /* StorageScope.PROFILE */, '{}');
        }
        setStoredViewCustomizationsValue(value) {
            this.storageService.store(ViewDescriptorService_1.VIEWS_CUSTOMIZATIONS, value, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        getViewsByContainer(viewContainer) {
            const result = this.viewsRegistry.getViews(viewContainer).filter(viewDescriptor => {
                const viewDescriptorViewContainerId = this.viewDescriptorsCustomLocations.get(viewDescriptor.id) ?? viewContainer.id;
                return viewDescriptorViewContainerId === viewContainer.id;
            });
            for (const [viewId, viewContainerId] of this.viewDescriptorsCustomLocations.entries()) {
                if (viewContainerId !== viewContainer.id) {
                    continue;
                }
                if (this.viewsRegistry.getViewContainer(viewId) === viewContainer) {
                    continue;
                }
                const viewDescriptor = this.getViewDescriptorById(viewId);
                if (viewDescriptor) {
                    result.push(viewDescriptor);
                }
            }
            return result;
        }
        onDidRegisterViewContainer(viewContainer) {
            const defaultLocation = this.isGeneratedContainerId(viewContainer.id) ? true : this.getViewContainerLocation(viewContainer) === this.getDefaultViewContainerLocation(viewContainer);
            this.getOrCreateDefaultViewContainerLocationContextKey(viewContainer).set(defaultLocation);
            this.getOrRegisterViewContainerModel(viewContainer);
        }
        getOrRegisterViewContainerModel(viewContainer) {
            let viewContainerModel = this.viewContainerModels.get(viewContainer)?.viewContainerModel;
            if (!viewContainerModel) {
                const disposables = new lifecycle_1.DisposableStore();
                viewContainerModel = disposables.add(this.instantiationService.createInstance(viewContainerModel_1.ViewContainerModel, viewContainer));
                this.onDidChangeActiveViews({ added: viewContainerModel.activeViewDescriptors, removed: [] });
                viewContainerModel.onDidChangeActiveViewDescriptors(changed => this.onDidChangeActiveViews(changed), this, disposables);
                this.onDidChangeVisibleViews({ added: [...viewContainerModel.visibleViewDescriptors], removed: [] });
                viewContainerModel.onDidAddVisibleViewDescriptors(added => this.onDidChangeVisibleViews({ added: added.map(({ viewDescriptor }) => viewDescriptor), removed: [] }), this, disposables);
                viewContainerModel.onDidRemoveVisibleViewDescriptors(removed => this.onDidChangeVisibleViews({ added: [], removed: removed.map(({ viewDescriptor }) => viewDescriptor) }), this, disposables);
                disposables.add((0, lifecycle_1.toDisposable)(() => this.viewsVisibilityActionDisposables.deleteAndDispose(viewContainer)));
                disposables.add(this.registerResetViewContainerAction(viewContainer));
                const value = { viewContainerModel: viewContainerModel, disposables, dispose: () => disposables.dispose() };
                this.viewContainerModels.set(viewContainer, value);
                // Register all views that were statically registered to this container
                // Potentially, this is registering something that was handled by another container
                // addViews() handles this by filtering views that are already registered
                this.onDidRegisterViews([{ views: this.viewsRegistry.getViews(viewContainer), viewContainer }]);
                // Add views that were registered prior to this view container
                const viewsToRegister = this.getViewsByContainer(viewContainer).filter(view => this.getDefaultContainerById(view.id) !== viewContainer);
                if (viewsToRegister.length) {
                    this.addViews(viewContainer, viewsToRegister);
                    this.contextKeyService.bufferChangeEvents(() => {
                        viewsToRegister.forEach(viewDescriptor => this.getOrCreateMovableViewContextKey(viewDescriptor).set(!!viewDescriptor.canMoveView));
                    });
                }
                if (this.canRegisterViewsVisibilityActions) {
                    this.registerViewsVisibilityActions(viewContainer, value);
                }
            }
            return viewContainerModel;
        }
        onDidDeregisterViewContainer(viewContainer) {
            this.viewContainerModels.deleteAndDispose(viewContainer);
            this.viewsVisibilityActionDisposables.deleteAndDispose(viewContainer);
        }
        onDidChangeActiveViews({ added, removed }) {
            this.contextKeyService.bufferChangeEvents(() => {
                added.forEach(viewDescriptor => this.getOrCreateActiveViewContextKey(viewDescriptor).set(true));
                removed.forEach(viewDescriptor => this.getOrCreateActiveViewContextKey(viewDescriptor).set(false));
            });
        }
        onDidChangeVisibleViews({ added, removed }) {
            this.contextKeyService.bufferChangeEvents(() => {
                added.forEach(viewDescriptor => this.getOrCreateVisibleViewContextKey(viewDescriptor).set(true));
                removed.forEach(viewDescriptor => this.getOrCreateVisibleViewContextKey(viewDescriptor).set(false));
            });
        }
        registerViewsVisibilityActions(viewContainer, { viewContainerModel, disposables }) {
            this.viewsVisibilityActionDisposables.deleteAndDispose(viewContainer);
            this.viewsVisibilityActionDisposables.set(viewContainer, this.registerViewsVisibilityActionsForContainer(viewContainerModel));
            disposables.add(event_1.Event.any(viewContainerModel.onDidChangeActiveViewDescriptors, viewContainerModel.onDidAddVisibleViewDescriptors, viewContainerModel.onDidRemoveVisibleViewDescriptors, viewContainerModel.onDidMoveVisibleViewDescriptors)(e => {
                this.viewsVisibilityActionDisposables.deleteAndDispose(viewContainer);
                this.viewsVisibilityActionDisposables.set(viewContainer, this.registerViewsVisibilityActionsForContainer(viewContainerModel));
            }));
        }
        registerViewsVisibilityActionsForContainer(viewContainerModel) {
            const disposables = new lifecycle_1.DisposableStore();
            viewContainerModel.activeViewDescriptors.forEach((viewDescriptor, index) => {
                if (!viewDescriptor.remoteAuthority) {
                    disposables.add((0, actions_1.registerAction2)(class extends viewPaneContainer_1.ViewPaneContainerAction {
                        constructor() {
                            super({
                                id: `${viewDescriptor.id}.toggleVisibility`,
                                viewPaneContainerId: viewContainerModel.viewContainer.id,
                                precondition: viewDescriptor.canToggleVisibility && (!viewContainerModel.isVisible(viewDescriptor.id) || viewContainerModel.visibleViewDescriptors.length > 1) ? contextkey_1.ContextKeyExpr.true() : contextkey_1.ContextKeyExpr.false(),
                                toggled: contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.visible`),
                                title: viewDescriptor.name,
                                menu: [{
                                        id: viewPaneContainer_1.ViewsSubMenu,
                                        when: contextkey_1.ContextKeyExpr.equals('viewContainer', viewContainerModel.viewContainer.id),
                                        order: index,
                                    }, {
                                        id: actions_1.MenuId.ViewContainerTitleContext,
                                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', viewContainerModel.viewContainer.id)),
                                        order: index,
                                        group: '1_toggleVisibility'
                                    }, {
                                        id: actions_1.MenuId.ViewTitleContext,
                                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(...viewContainerModel.visibleViewDescriptors.map(v => contextkey_1.ContextKeyExpr.equals('view', v.id)))),
                                        order: index,
                                        group: '2_toggleVisibility'
                                    }]
                            });
                        }
                        async runInViewPaneContainer(serviceAccessor, viewPaneContainer) {
                            viewPaneContainer.toggleViewVisibility(viewDescriptor.id);
                        }
                    }));
                    disposables.add((0, actions_1.registerAction2)(class extends viewPaneContainer_1.ViewPaneContainerAction {
                        constructor() {
                            super({
                                id: `${viewDescriptor.id}.removeView`,
                                viewPaneContainerId: viewContainerModel.viewContainer.id,
                                title: (0, nls_1.localize)('hideView', "Hide '{0}'", viewDescriptor.name.value),
                                precondition: viewDescriptor.canToggleVisibility && (!viewContainerModel.isVisible(viewDescriptor.id) || viewContainerModel.visibleViewDescriptors.length > 1) ? contextkey_1.ContextKeyExpr.true() : contextkey_1.ContextKeyExpr.false(),
                                menu: [{
                                        id: actions_1.MenuId.ViewTitleContext,
                                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewDescriptor.id), contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.visible`)),
                                        group: '1_hide',
                                        order: 1
                                    }]
                            });
                        }
                        async runInViewPaneContainer(serviceAccessor, viewPaneContainer) {
                            viewPaneContainer.toggleViewVisibility(viewDescriptor.id);
                        }
                    }));
                }
            });
            return disposables;
        }
        registerResetViewContainerAction(viewContainer) {
            const that = this;
            return (0, actions_1.registerAction2)(class ResetViewLocationAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `${viewContainer.id}.resetViewContainerLocation`,
                        title: (0, nls_1.localize2)('resetViewLocation', "Reset Location"),
                        menu: [{
                                id: actions_1.MenuId.ViewContainerTitleContext,
                                when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', viewContainer.id), contextkey_1.ContextKeyExpr.equals(`${viewContainer.id}.defaultViewContainerLocation`, false)))
                            }],
                    });
                }
                run() {
                    that.moveViewContainerToLocation(viewContainer, that.getDefaultViewContainerLocation(viewContainer), undefined, this.desc.id);
                }
            });
        }
        addViews(container, views, visibilityState = views_1.ViewVisibilityState.Default) {
            this.contextKeyService.bufferChangeEvents(() => {
                views.forEach(view => {
                    const isDefaultContainer = this.getDefaultContainerById(view.id) === container;
                    this.getOrCreateDefaultViewLocationContextKey(view).set(isDefaultContainer);
                    if (isDefaultContainer) {
                        this.viewDescriptorsCustomLocations.delete(view.id);
                    }
                    else {
                        this.viewDescriptorsCustomLocations.set(view.id, container.id);
                    }
                });
            });
            this.getViewContainerModel(container).add(views.map(view => {
                return {
                    viewDescriptor: view,
                    collapsed: visibilityState === views_1.ViewVisibilityState.Default ? undefined : false,
                    visible: visibilityState === views_1.ViewVisibilityState.Default ? undefined : true
                };
            }));
        }
        removeViews(container, views) {
            // Set view default location keys to false
            this.contextKeyService.bufferChangeEvents(() => {
                views.forEach(view => {
                    if (this.viewDescriptorsCustomLocations.get(view.id) === container.id) {
                        this.viewDescriptorsCustomLocations.delete(view.id);
                    }
                    this.getOrCreateDefaultViewLocationContextKey(view).set(false);
                });
            });
            // Remove the views
            this.getViewContainerModel(container).remove(views);
        }
        getOrCreateActiveViewContextKey(viewDescriptor) {
            const activeContextKeyId = `${viewDescriptor.id}.active`;
            let contextKey = this.activeViewContextKeys.get(activeContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(activeContextKeyId, false).bindTo(this.contextKeyService);
                this.activeViewContextKeys.set(activeContextKeyId, contextKey);
            }
            return contextKey;
        }
        getOrCreateVisibleViewContextKey(viewDescriptor) {
            const activeContextKeyId = `${viewDescriptor.id}.visible`;
            let contextKey = this.activeViewContextKeys.get(activeContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(activeContextKeyId, false).bindTo(this.contextKeyService);
                this.activeViewContextKeys.set(activeContextKeyId, contextKey);
            }
            return contextKey;
        }
        getOrCreateMovableViewContextKey(viewDescriptor) {
            const movableViewContextKeyId = `${viewDescriptor.id}.canMove`;
            let contextKey = this.movableViewContextKeys.get(movableViewContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(movableViewContextKeyId, false).bindTo(this.contextKeyService);
                this.movableViewContextKeys.set(movableViewContextKeyId, contextKey);
            }
            return contextKey;
        }
        getOrCreateDefaultViewLocationContextKey(viewDescriptor) {
            const defaultViewLocationContextKeyId = `${viewDescriptor.id}.defaultViewLocation`;
            let contextKey = this.defaultViewLocationContextKeys.get(defaultViewLocationContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(defaultViewLocationContextKeyId, false).bindTo(this.contextKeyService);
                this.defaultViewLocationContextKeys.set(defaultViewLocationContextKeyId, contextKey);
            }
            return contextKey;
        }
        getOrCreateDefaultViewContainerLocationContextKey(viewContainer) {
            const defaultViewContainerLocationContextKeyId = `${viewContainer.id}.defaultViewContainerLocation`;
            let contextKey = this.defaultViewContainerLocationContextKeys.get(defaultViewContainerLocationContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(defaultViewContainerLocationContextKeyId, false).bindTo(this.contextKeyService);
                this.defaultViewContainerLocationContextKeys.set(defaultViewContainerLocationContextKeyId, contextKey);
            }
            return contextKey;
        }
    };
    exports.ViewDescriptorService = ViewDescriptorService;
    exports.ViewDescriptorService = ViewDescriptorService = ViewDescriptorService_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, extensions_1.IExtensionService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, log_1.ILoggerService)
    ], ViewDescriptorService);
    (0, extensions_2.registerSingleton)(views_1.IViewDescriptorService, ViewDescriptorService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0Rlc2NyaXB0b3JTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3ZpZXdzL2Jyb3dzZXIvdmlld0Rlc2NyaXB0b3JTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEyQmhHLFNBQVMseUJBQXlCLENBQUMsZUFBdUIsSUFBWSxPQUFPLEdBQUcsZUFBZSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBRW5HLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7O2lCQUk1Qix5QkFBb0IsR0FBRyxzQkFBc0IsQUFBekIsQ0FBMEI7aUJBQzlDLCtCQUEwQixHQUFHLHlCQUF5QixBQUE1QixDQUE2QjtRQTRCL0UsSUFBSSxjQUFjLEtBQW1DLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFJOUYsWUFDd0Isb0JBQTRELEVBQy9ELGlCQUFzRCxFQUN6RCxjQUFnRCxFQUM5QyxnQkFBb0QsRUFDcEQsZ0JBQW9ELEVBQ3ZELGFBQTZCO1lBRTdDLEtBQUssRUFBRSxDQUFDO1lBUGdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDOUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUN4QyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNuQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBbkN2RCwwQkFBcUIsR0FBa0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBd0UsQ0FBQyxDQUFDO1lBQ25OLHlCQUFvQixHQUFnRixJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBRTdILHlCQUFv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