/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/idGenerator", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/errors", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/progressbar/progressbar", "vs/workbench/browser/part", "vs/platform/instantiation/common/serviceCollection", "vs/platform/progress/common/progress", "vs/base/browser/dom", "vs/base/common/types", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/workbench/services/progress/browser/progressIndicator", "vs/platform/actions/browser/toolbar", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./media/compositepart"], function (require, exports, nls_1, idGenerator_1, lifecycle_1, event_1, errors_1, actionbar_1, progressbar_1, part_1, serviceCollection_1, progress_1, dom_1, types_1, menuEntryActionViewItem_1, progressIndicator_1, toolbar_1, defaultStyles_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositePart = void 0;
    class CompositePart extends part_1.Part {
        constructor(notificationService, storageService, contextMenuService, layoutService, keybindingService, hoverService, instantiationService, themeService, registry, activeCompositeSettingsKey, defaultCompositeId, nameForTelemetry, compositeCSSClass, titleForegroundColor, id, options) {
            super(id, options, themeService, storageService, layoutService);
            this.notificationService = notificationService;
            this.storageService = storageService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.hoverService = hoverService;
            this.instantiationService = instantiationService;
            this.registry = registry;
            this.activeCompositeSettingsKey = activeCompositeSettingsKey;
            this.defaultCompositeId = defaultCompositeId;
            this.nameForTelemetry = nameForTelemetry;
            this.compositeCSSClass = compositeCSSClass;
            this.titleForegroundColor = titleForegroundColor;
            this.onDidCompositeOpen = this._register(new event_1.Emitter());
            this.onDidCompositeClose = this._register(new event_1.Emitter());
            this.mapCompositeToCompositeContainer = new Map();
            this.mapActionsBindingToComposite = new Map();
            this.instantiatedCompositeItems = new Map();
            this.actionsListener = this._register(new lifecycle_1.MutableDisposable());
            this.lastActiveCompositeId = storageService.get(activeCompositeSettingsKey, 1 /* StorageScope.WORKSPACE */, this.defaultCompositeId);
            this.toolbarHoverDelegate = this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
        }
        openComposite(id, focus) {
            // Check if composite already visible and just focus in that case
            if (this.activeComposite?.getId() === id) {
                if (focus) {
                    this.activeComposite.focus();
                }
                // Fullfill promise with composite that is being opened
                return this.activeComposite;
            }
            // We cannot open the composite if we have not been created yet
            if (!this.element) {
                return;
            }
            // Open
            return this.doOpenComposite(id, focus);
        }
        doOpenComposite(id, focus = false) {
            // Use a generated token to avoid race conditions from long running promises
            const currentCompositeOpenToken = idGenerator_1.defaultGenerator.nextId();
            this.currentCompositeOpenToken = currentCompositeOpenToken;
            // Hide current
            if (this.activeComposite) {
                this.hideActiveComposite();
            }
            // Update Title
            this.updateTitle(id);
            // Create composite
            const composite = this.createComposite(id, true);
            // Check if another composite opened meanwhile and return in that case
            if ((this.currentCompositeOpenToken !== currentCompositeOpenToken) || (this.activeComposite && this.activeComposite.getId() !== composite.getId())) {
                return undefined;
            }
            // Check if composite already visible and just focus in that case
            if (this.activeComposite?.getId() === composite.getId()) {
                if (focus) {
                    composite.focus();
                }
                this.onDidCompositeOpen.fire({ composite, focus });
                return composite;
            }
            // Show Composite and Focus
            this.showComposite(composite);
            if (focus) {
                composite.focus();
            }
            // Return with the composite that is being opened
            if (composite) {
                this.onDidCompositeOpen.fire({ composite, focus });
            }
            return composite;
        }
        createComposite(id, isActive) {
            // Check if composite is already created
            const compositeItem = this.instantiatedCompositeItems.get(id);
            if (compositeItem) {
                return compositeItem.composite;
            }
            // Instantiate composite from registry otherwise
            const compositeDescriptor = this.registry.getComposite(id);
            if (compositeDescriptor) {
                const that = this;
                const compositeProgressIndicator = new progressIndicator_1.ScopedProgressIndicator((0, types_1.assertIsDefined)(this.progressBar), new class extends progressIndicator_1.AbstractProgressScope {
                    constructor() {
                        super(compositeDescriptor.id, !!isActive);
                        this._register(that.onDidCompositeOpen.event(e => this.onScopeOpened(e.composite.getId())));
                        this._register(that.onDidCompositeClose.event(e => this.onScopeClosed(e.getId())));
                    }
                }());
                const compositeInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([progress_1.IEditorProgressService, compositeProgressIndicator] // provide the editor progress service for any editors instantiated within the composite
                ));
                const composite = compositeDescriptor.instantiate(compositeInstantiationService);
                const disposable = new lifecycle_1.DisposableStore();
                // Remember as Instantiated
                this.instantiatedCompositeItems.set(id, { composite, disposable, progress: compositeProgressIndicator });
                // Register to title area update events from the composite
                disposable.add(composite.onTitleAreaUpdate(() => this.onTitleAreaUpdate(composite.getId()), this));
                return composite;
            }
            throw new Error(`Unable to find composite with id ${id}`);
        }
        showComposite(composite) {
            // Remember Composite
            this.activeComposite = composite;
            // Store in preferences
            const id = this.activeComposite.getId();
            if (id !== this.defaultCompositeId) {
                this.storageService.store(this.activeCompositeSettingsKey, id, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(this.activeCompositeSettingsKey, 1 /* StorageScope.WORKSPACE */);
            }
            // Remember
            this.lastActiveCompositeId = this.activeComposite.getId();
            // Composites created for the first time
            let compositeContainer = this.mapCompositeToCompositeContainer.get(composite.getId());
            if (!compositeContainer) {
                // Build Container off-DOM
                compositeContainer = (0, dom_1.$)('.composite');
                compositeContainer.classList.add(...this.compositeCSSClass.split(' '));
                compositeContainer.id = composite.getId();
                composite.create(compositeContainer);
                composite.updateStyles();
                // Remember composite container
                this.mapCompositeToCompositeContainer.set(composite.getId(), compositeContainer);
            }
            // Fill Content and Actions
            // Make sure that the user meanwhile did not open another composite or closed the part containing the composite
            if (!this.activeComposite || composite.getId() !== this.activeComposite.getId()) {
                return undefined;
            }
            // Take Composite on-DOM and show
            const contentArea = this.getContentArea();
            contentArea?.appendChild(compositeContainer);
            (0, dom_1.show)(compositeContainer);
            // Setup action runner
            const toolBar = (0, types_1.assertIsDefined)(this.toolBar);
            toolBar.actionRunner = composite.getActionRunner();
            // Update title with composite title if it differs from descriptor
            const descriptor = this.registry.getComposite(composite.getId());
            if (descriptor && descriptor.name !== composite.getTitle()) {
                this.updateTitle(composite.getId(), composite.getTitle());
            }
            // Handle Composite Actions
            let actionsBinding = this.mapActionsBindingToComposite.get(composite.getId());
            if (!actionsBinding) {
                actionsBinding = this.collectCompositeActions(composite);
                this.mapActionsBindingToComposite.set(composite.getId(), actionsBinding);
            }
            actionsBinding();
            // Action Run Handling
            this.actionsListener.value = toolBar.actionRunner.onDidRun(e => {
                // Check for Error
                if (e.error && !(0, errors_1.isCancellationError)(e.error)) {
                    this.notificationService.error(e.error);
                }
            });
            // Indicate to composite that it is now visible
            composite.setVisible(true);
            // Make sure that the user meanwhile did not open another composite or closed the part containing the composite
            if (!this.activeComposite || composite.getId() !== this.activeComposite.getId()) {
                return;
            }
            // Make sure the composite is layed out
            if (this.contentAreaSize) {
                composite.layout(this.contentAreaSize);
            }
            // Make sure boundary sashes are propagated
            if (this.boundarySashes) {
                composite.setBoundarySashes(this.boundarySashes);
            }
        }
        onTitleAreaUpdate(compositeId) {
            // Title
            const composite = this.instantiatedCompositeItems.get(compositeId);
            if (composite) {
                this.updateTitle(compositeId, composite.composite.getTitle());
            }
            // Active Composite
            if (this.activeComposite?.getId() === compositeId) {
                // Actions
                const actionsBinding = this.collectCompositeActions(this.activeComposite);
                this.mapActionsBindingToComposite.set(this.activeComposite.getId(), actionsBinding);
                actionsBinding();
            }
            // Otherwise invalidate actions binding for next time when the composite becomes visible
            else {
                this.mapActionsBindingToComposite.delete(compositeId);
            }
        }
        updateTitle(compositeId, compositeTitle) {
            const compositeDescriptor = this.registry.getComposite(compositeId);
            if (!compositeDescriptor || !this.titleLabel) {
                return;
            }
            if (!compositeTitle) {
                compositeTitle = compositeDescriptor.name;
            }
            const keybinding = this.keybindingService.lookupKeybinding(compositeId);
            this.titleLabel.updateTitle(compositeId, compositeTitle, keybinding?.getLabel() ?? undefined);
            const toolBar = (0, types_1.assertIsDefined)(this.toolBar);
            toolBar.setAriaLabel((0, nls_1.localize)('ariaCompositeToolbarLabel', "{0} actions", compositeTitle));
        }
        collectCompositeActions(composite) {
            // From Composite
            const menuIds = composite?.getMenuIds();
            const primaryActions = composite?.getActions().slice(0) || [];
            const secondaryActions = composite?.getSecondaryActions().slice(0) || [];
            // Update context
            const toolBar = (0, types_1.assertIsDefined)(this.toolBar);
            toolBar.context = this.actionsContextProvider();
            // Return fn to set into toolbar
            return () => toolBar.setActions((0, actionbar_1.prepareActions)(primaryActions), (0, actionbar_1.prepareActions)(secondaryActions), menuIds);
        }
        getActiveComposite() {
            return this.activeComposite;
        }
        getLastActiveCompositeId() {
            return this.lastActiveCompositeId;
        }
        hideActiveComposite() {
            if (!this.activeComposite) {
                return undefined; // Nothing to do
            }
            const composite = this.activeComposite;
            this.activeComposite = undefined;
            const compositeContainer = this.mapCompositeToCompositeContainer.get(composite.getId());
            // Indicate to Composite
            composite.setVisible(false);
            // Take Container Off-DOM and hide
            if (compositeContainer) {
                compositeContainer.remove();
                (0, dom_1.hide)(compositeContainer);
            }
            // Clear any running Progress
            this.progressBar?.stop().hide();
            // Empty Actions
            if (this.toolBar) {
                this.collectCompositeActions()();
            }
            this.onDidCompositeClose.fire(composite);
            return composite;
        }
        createTitleArea(parent) {
            // Title Area Container
            const titleArea = (0, dom_1.append)(parent, (0, dom_1.$)('.composite'));
            titleArea.classList.add('title');
            // Left Title Label
            this.titleLabel = this.createTitleLabel(titleArea);
            // Right Actions Container
            const titleActionsContainer = (0, dom_1.append)(titleArea, (0, dom_1.$)('.title-actions'));
            // Toolbar
            this.toolBar = this._register(this.instantiationService.createInstance(toolbar_1.WorkbenchToolBar, titleActionsContainer, {
                actionViewItemProvider: (action, options) => this.actionViewItemProvider(action, options),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                anchorAlignmentProvider: () => this.getTitleAreaDropDownAnchorAlignment(),
                toggleMenuTitle: (0, nls_1.localize)('viewsAndMoreActions', "Views and More Actions..."),
                telemetrySource: this.nameForTelemetry,
                hoverDelegate: this.toolbarHoverDelegate
            }));
            this.collectCompositeActions()();
            return titleArea;
        }
        createTitleLabel(parent) {
            const titleContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.title-label'));
            const titleLabel = (0, dom_1.append)(titleContainer, (0, dom_1.$)('h2'));
            this.titleLabelElement = titleLabel;
            const hover = this._register(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), titleLabel, ''));
            const $this = this;
            return {
                updateTitle: (id, title, keybinding) => {
                    // The title label is shared for all composites in the base CompositePart
                    if (!this.activeComposite || this.activeComposite.getId() === id) {
                        titleLabel.innerText = title;
                        hover.update(keybinding ? (0, nls_1.localize)('titleTooltip', "{0} ({1})", title, keybinding) : title);
                    }
                },
                updateStyles: () => {
                    titleLabel.style.color = $this.titleForegroundColor ? $this.getColor($this.titleForegroundColor) || '' : '';
                }
            };
        }
        createHeaderArea() {
            return (0, dom_1.$)('.composite');
        }
        createFooterArea() {
            return (0, dom_1.$)('.composite');
        }
        updateStyles() {
            super.updateStyles();
            // Forward to title label
            const titleLabel = (0, types_1.assertIsDefined)(this.titleLabel);
            titleLabel.updateStyles();
        }
        actionViewItemProvider(action, options) {
            // Check Active Composite
            if (this.activeComposite) {
                return this.activeComposite.getActionViewItem(action, options);
            }
            return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, options);
        }
        actionsContextProvider() {
            // Check Active Composite
            if (this.activeComposite) {
                return this.activeComposite.getActionsContext();
            }
            return null;
        }
        createContentArea(parent) {
            const contentContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.content'));
            this.progressBar = this._register(new progressbar_1.ProgressBar(contentContainer, defaultStyles_1.defaultProgressBarStyles));
            this.progressBar.hide();
            return contentContainer;
        }
        getProgressIndicator(id) {
            const compositeItem = this.instantiatedCompositeItems.get(id);
            return compositeItem ? compositeItem.progress : undefined;
        }
        getTitleAreaDropDownAnchorAlignment() {
            return 1 /* AnchorAlignment.RIGHT */;
        }
        layout(width, height, top, left) {
            super.layout(width, height, top, left);
            // Layout contents
            this.contentAreaSize = dom_1.Dimension.lift(super.layoutContents(width, height).contentSize);
            // Layout composite
            this.activeComposite?.layout(this.contentAreaSize);
        }
        setBoundarySashes(sashes) {
            this.boundarySashes = sashes;
            this.activeComposite?.setBoundarySashes(sashes);
        }
        removeComposite(compositeId) {
            if (this.activeComposite?.getId() === compositeId) {
                return false; // do not remove active composite
            }
            this.mapCompositeToCompositeContainer.delete(compositeId);
            this.mapActionsBindingToComposite.delete(compositeId);
            const compositeItem = this.instantiatedCompositeItems.get(compositeId);
            if (compositeItem) {
                compositeItem.composite.dispose();
                (0, lifecycle_1.dispose)(compositeItem.disposable);
                this.instantiatedCompositeItems.delete(compositeId);
            }
            return true;
        }
        dispose() {
            this.mapCompositeToCompositeContainer.clear();
            this.mapActionsBindingToComposite.clear();
            this.instantiatedCompositeItems.forEach(compositeItem => {
                compositeItem.composite.dispose();
                (0, lifecycle_1.dispose)(compositeItem.disposable);
            });
            this.instantiatedCompositeItems.clear();
            super.dispose();
        }
    }
    exports.CompositePart = CompositePart;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9zaXRlUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2NvbXBvc2l0ZVBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdURoRyxNQUFzQixhQUFtQyxTQUFRLFdBQUk7UUFxQnBFLFlBQ2tCLG1CQUF5QyxFQUN2QyxjQUErQixFQUMvQixrQkFBdUMsRUFDMUQsYUFBc0MsRUFDbkIsaUJBQXFDLEVBQ3ZDLFlBQTJCLEVBQ3pCLG9CQUEyQyxFQUM5RCxZQUEyQixFQUNSLFFBQThCLEVBQ2hDLDBCQUFrQyxFQUNsQyxrQkFBMEIsRUFDMUIsZ0JBQXdCLEVBQ3hCLGlCQUF5QixFQUN6QixvQkFBd0MsRUFDekQsRUFBVSxFQUNWLE9BQXFCO1lBRXJCLEtBQUssQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFqQi9DLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDdkMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQy9CLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFFdkMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUN2QyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUN6Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBRTNDLGFBQVEsR0FBUixRQUFRLENBQXNCO1lBQ2hDLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBUTtZQUNsQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQVE7WUFDMUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFRO1lBQ3hCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtZQUN6Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQW9CO1lBakN2Qyx1QkFBa0Is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