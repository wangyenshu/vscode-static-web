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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/browser/part", "vs/base/browser/touch", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/contextview/browser/contextView", "vs/base/common/actions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dom", "vs/platform/storage/common/storage", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/extensions", "vs/base/common/arrays", "vs/base/browser/mouseEvent", "vs/workbench/browser/actions/layoutActions", "vs/base/common/types", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/theme", "vs/base/common/hash", "vs/platform/hover/browser/hover", "vs/workbench/browser/parts/statusbar/statusbarActions", "vs/workbench/browser/parts/statusbar/statusbarModel", "vs/workbench/browser/parts/statusbar/statusbarItem", "vs/workbench/common/contextkeys", "vs/base/common/event", "vs/css!./media/statusbarpart"], function (require, exports, nls_1, lifecycle_1, part_1, touch_1, instantiation_1, statusbar_1, contextView_1, actions_1, themeService_1, theme_1, workspace_1, colorRegistry_1, dom_1, storage_1, layoutService_1, extensions_1, arrays_1, mouseEvent_1, layoutActions_1, types_1, contextkey_1, theme_2, hash_1, hover_1, statusbarActions_1, statusbarModel_1, statusbarItem_1, contextkeys_1, event_1) {
    "use strict";
    var StatusbarPart_1, AuxiliaryStatusbarPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScopedStatusbarService = exports.StatusbarService = exports.AuxiliaryStatusbarPart = exports.MainStatusbarPart = void 0;
    let StatusbarPart = class StatusbarPart extends part_1.Part {
        static { StatusbarPart_1 = this; }
        static { this.HEIGHT = 22; }
        constructor(id, instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService) {
            super(id, { hasTitle: false }, themeService, storageService, layoutService);
            this.instantiationService = instantiationService;
            this.contextService = contextService;
            this.storageService = storageService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            //#region IView
            this.minimumWidth = 0;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = StatusbarPart_1.HEIGHT;
            this.maximumHeight = StatusbarPart_1.HEIGHT;
            this.pendingEntries = [];
            this.viewModel = this._register(new statusbarModel_1.StatusbarViewModel(this.storageService));
            this.onDidChangeEntryVisibility = this.viewModel.onDidChangeEntryVisibility;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this.hoverDelegate = this._register(this.instantiationService.createInstance(hover_1.WorkbenchHoverDelegate, 'element', true, (_, focus) => ({
                persistence: {
                    hideOnKeyDown: true,
                    sticky: focus
                }
            })));
            this.compactEntriesDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.styleOverrides = new Set();
            this.registerListeners();
        }
        registerListeners() {
            // Entry visibility changes
            this._register(this.onDidChangeEntryVisibility(() => this.updateCompactEntries()));
            // Workbench state changes
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateStyles()));
        }
        addEntry(entry, id, alignment, priorityOrLocation = 0) {
            let priority;
            if ((0, statusbar_1.isStatusbarEntryPriority)(priorityOrLocation)) {
                priority = priorityOrLocation;
            }
            else {
                priority = {
                    primary: priorityOrLocation,
                    secondary: (0, hash_1.hash)(id) // derive from identifier to accomplish uniqueness
                };
            }
            // As long as we have not been created into a container yet, record all entries
            // that are pending so that they can get created at a later point
            if (!this.element) {
                return this.doAddPendingEntry(entry, id, alignment, priority);
            }
            // Otherwise add to view
            return this.doAddEntry(entry, id, alignment, priority);
        }
        doAddPendingEntry(entry, id, alignment, priority) {
            const pendingEntry = { entry, id, alignment, priority };
            this.pendingEntries.push(pendingEntry);
            const accessor = {
                update: (entry) => {
                    if (pendingEntry.accessor) {
                        pendingEntry.accessor.update(entry);
                    }
                    else {
                        pendingEntry.entry = entry;
                    }
                },
                dispose: () => {
                    if (pendingEntry.accessor) {
                        pendingEntry.accessor.dispose();
                    }
                    else {
                        this.pendingEntries = this.pendingEntries.filter(entry => entry !== pendingEntry);
                    }
                }
            };
            return accessor;
        }
        doAddEntry(entry, id, alignment, priority) {
            // View model item
            const itemContainer = this.doCreateStatusItem(id, alignment);
            const item = this.instantiationService.createInstance(statusbarItem_1.StatusbarEntryItem, itemContainer, entry, this.hoverDelegate);
            // View model entry
            const viewModelEntry = new class {
                constructor() {
                    this.id = id;
                    this.alignment = alignment;
                    this.priority = priority;
                    this.container = itemContainer;
                    this.labelContainer = item.labelContainer;
                }
                get name() { return item.name; }
                get hasCommand() { return item.hasCommand; }
            };
            // Add to view model
            const { needsFullRefresh } = this.doAddOrRemoveModelEntry(viewModelEntry, true);
            if (needsFullRefresh) {
                this.appendStatusbarEntries();
            }
            else {
                this.appendStatusbarEntry(viewModelEntry);
            }
            return {
                update: entry => {
                    item.update(entry);
                },
                dispose: () => {
                    const { needsFullRefresh } = this.doAddOrRemoveModelEntry(viewModelEntry, false);
                    if (needsFullRefresh) {
                        this.appendStatusbarEntries();
                    }
                    else {
                        itemContainer.remove();
                    }
                    (0, lifecycle_1.dispose)(item);
                }
            };
        }
        doCreateStatusItem(id, alignment, ...extraClasses) {
            const itemContainer = document.createElement('div');
            itemContainer.id = id;
            itemContainer.classList.add('statusbar-item');
            if (extraClasses) {
                itemContainer.classList.add(...extraClasses);
            }
            if (alignment === 1 /* StatusbarAlignment.RIGHT */) {
                itemContainer.classList.add('right');
            }
            else {
                itemContainer.classList.add('left');
            }
            return itemContainer;
        }
        doAddOrRemoveModelEntry(entry, add) {
            // Update model but remember previous entries
            const entriesBefore = this.viewModel.entries;
            if (add) {
                this.viewModel.add(entry);
            }
            else {
                this.viewModel.remove(entry);
            }
            const entriesAfter = this.viewModel.entries;
            // Apply operation onto the entries from before
            if (add) {
                entriesBefore.splice(entriesAfter.indexOf(entry), 0, entry);
            }
            else {
                entriesBefore.splice(entriesBefore.indexOf(entry), 1);
            }
            // Figure out if a full refresh is needed by comparing arrays
            const needsFullRefresh = !(0, arrays_1.equals)(entriesBefore, entriesAfter);
            return { needsFullRefresh };
        }
        isEntryVisible(id) {
            return !this.viewModel.isHidden(id);
        }
        updateEntryVisibility(id, visible) {
            if (visible) {
                this.viewModel.show(id);
            }
            else {
                this.viewModel.hide(id);
            }
        }
        focusNextEntry() {
            this.viewModel.focusNextEntry();
        }
        focusPreviousEntry() {
            this.viewModel.focusPreviousEntry();
        }
        isEntryFocused() {
            return this.viewModel.isEntryFocused();
        }
        focus(preserveEntryFocus = true) {
            this.getContainer()?.focus();
            const lastFocusedEntry = this.viewModel.lastFocusedEntry;
            if (preserveEntryFocus && lastFocusedEntry) {
                setTimeout(() => lastFocusedEntry.labelContainer.focus(), 0); // Need a timeout, for some reason without it the inner label container will not get focused
            }
        }
        createContentArea(parent) {
            this.element = parent;
            // Track focus within container
            const scopedContextKeyService = this._register(this.contextKeyService.createScoped(this.element));
            contextkeys_1.StatusBarFocused.bindTo(scopedContextKeyService).set(true);
            // Left items container
            this.leftItemsContainer = document.createElement('div');
            this.leftItemsContainer.classList.add('left-items', 'items-container');
            this.element.appendChild(this.leftItemsContainer);
            this.element.tabIndex = 0;
            // Right items container
            this.rightItemsContainer = document.createElement('div');
            this.rightItemsContainer.classList.add('right-items', 'items-container');
            this.element.appendChild(this.rightItemsContainer);
            // Context menu support
            this._register((0, dom_1.addDisposableListener)(parent, dom_1.EventType.CONTEXT_MENU, e => this.showContextMenu(e)));
            this._register(touch_1.Gesture.addTarget(parent));
            this._register((0, dom_1.addDisposableListener)(parent, touch_1.EventType.Contextmenu, e => this.showContextMenu(e)));
            // Initial status bar entries
            this.createInitialStatusbarEntries();
            return this.element;
        }
        createInitialStatusbarEntries() {
            // Add items in order according to alignment
            this.appendStatusbarEntries();
            // Fill in pending entries if any
            while (this.pendingEntries.length) {
                const pending = this.pendingEntries.shift();
                if (pending) {
                    pending.accessor = this.addEntry(pending.entry, pending.id, pending.alignment, pending.priority.primary);
                }
            }
        }
        appendStatusbarEntries() {
            const leftItemsContainer = (0, types_1.assertIsDefined)(this.leftItemsContainer);
            const rightItemsContainer = (0, types_1.assertIsDefined)(this.rightItemsContainer);
            // Clear containers
            (0, dom_1.clearNode)(leftItemsContainer);
            (0, dom_1.clearNode)(rightItemsContainer);
            // Append all
            for (const entry of [
                ...this.viewModel.getEntries(0 /* StatusbarAlignment.LEFT */),
                ...this.viewModel.getEntries(1 /* StatusbarAlignment.RIGHT */).reverse() // reversing due to flex: row-reverse
            ]) {
                const target = entry.alignment === 0 /* StatusbarAlignment.LEFT */ ? leftItemsContainer : rightItemsContainer;
                target.appendChild(entry.container);
            }
            // Update compact entries
            this.updateCompactEntries();
        }
        appendStatusbarEntry(entry) {
            const entries = this.viewModel.getEntries(entry.alignment);
            if (entry.alignment === 1 /* StatusbarAlignment.RIGHT */) {
                entries.reverse(); // reversing due to flex: row-reverse
            }
            const target = (0, types_1.assertIsDefined)(entry.alignment === 0 /* StatusbarAlignment.LEFT */ ? this.leftItemsContainer : this.rightItemsContainer);
            const index = entries.indexOf(entry);
            if (index + 1 === entries.length) {
                target.appendChild(entry.container); // append at the end if last
            }
            else {
                target.insertBefore(entry.container, entries[index + 1].container); // insert before next element otherwise
            }
            // Update compact entries
            this.updateCompactEntries();
        }
        updateCompactEntries() {
            const entries = this.viewModel.entries;
            // Find visible entries and clear compact related CSS classes if any
            const mapIdToVisibleEntry = new Map();
            for (const entry of entries) {
                if (!this.viewModel.isHidden(entry.id)) {
                    mapIdToVisibleEntry.set(entry.id, entry);
                }
                entry.container.classList.remove('compact-left', 'compact-right');
            }
            // Figure out groups of entries with `compact` alignment
            const compactEntryGroups = new Map();
            for (const entry of mapIdToVisibleEntry.values()) {
                if ((0, statusbar_1.isStatusbarEntryLocation)(entry.priority.primary) && // entry references another entry as location
                    entry.priority.primary.compact // entry wants to be compact
                ) {
                    const locationId = entry.priority.primary.id;
                    const location = mapIdToVisibleEntry.get(locationId);
                    if (!location) {
                        continue; // skip if location does not exist
                    }
                    // Build a map of entries that are compact among each other
                    let compactEntryGroup = compactEntryGroups.get(locationId);
                    if (!compactEntryGroup) {
                        compactEntryGroup = new Set([entry, location]);
                        compactEntryGroups.set(locationId, compactEntryGroup);
                    }
                    else {
                        compactEntryGroup.add(entry);
                    }
                    // Adjust CSS classes to move compact items closer together
                    if (entry.priority.primary.alignment === 0 /* StatusbarAlignment.LEFT */) {
                        location.container.classList.add('compact-left');
                        entry.container.classList.add('compact-right');
                    }
                    else {
                        location.container.classList.add('compact-right');
                        entry.container.classList.add('compact-left');
                    }
                }
            }
            // Install mouse listeners to update hover feedback for
            // all compact entries that belong to each other
            const statusBarItemHoverBackground = this.getColor(theme_1.STATUS_BAR_ITEM_HOVER_BACKGROUND);
            const statusBarItemCompactHoverBackground = this.getColor(theme_1.STATUS_BAR_ITEM_COMPACT_HOVER_BACKGROUND);
            this.compactEntriesDisposable.value = new lifecycle_1.DisposableStore();
            if (statusBarItemHoverBackground && statusBarItemCompactHoverBackground && !(0, theme_2.isHighContrast)(this.theme.type)) {
                for (const [, compactEntryGroup] of compactEntryGroups) {
                    for (const compactEntry of compactEntryGroup) {
                        if (!compactEntry.hasCommand) {
                            continue; // only show hover feedback when we have a command
                        }
                        this.compactEntriesDisposable.value.add((0, dom_1.addDisposableListener)(compactEntry.labelContainer, dom_1.EventType.MOUSE_OVER, () => {
                            compactEntryGroup.forEach(compactEntry => compactEntry.labelContainer.style.backgroundColor = statusBarItemHoverBackground);
                            compactEntry.labelContainer.style.backgroundColor = statusBarItemCompactHoverBackground;
                        }));
                        this.compactEntriesDisposable.value.add((0, dom_1.addDisposableListener)(compactEntry.labelContainer, dom_1.EventType.MOUSE_OUT, () => {
                            compactEntryGroup.forEach(compactEntry => compactEntry.labelContainer.style.backgroundColor = '');
                        }));
                    }
                }
            }
        }
        showContextMenu(e) {
            dom_1.EventHelper.stop(e, true);
            const event = new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.element), e);
            let actions = undefined;
            this.contextMenuService.showContextMenu({
                getAnchor: () => event,
                getActions: () => {
                    actions = this.getContextMenuActions(event);
                    return actions;
                },
                onHide: () => {
                    if (actions) {
                        (0, lifecycle_1.disposeIfDisposable)(actions);
                    }
                }
            });
        }
        getContextMenuActions(event) {
            const actions = [];
            // Provide an action to hide the status bar at last
            actions.push((0, actions_1.toAction)({ id: layoutActions_1.ToggleStatusbarVisibilityAction.ID, label: (0, nls_1.localize)('hideStatusBar', "Hide Status Bar"), run: () => this.instantiationService.invokeFunction(accessor => new layoutActions_1.ToggleStatusbarVisibilityAction().run(accessor)) }));
            actions.push(new actions_1.Separator());
            // Show an entry per known status entry
            // Note: even though entries have an identifier, there can be multiple entries
            // having the same identifier (e.g. from extensions). So we make sure to only
            // show a single entry per identifier we handled.
            const handledEntries = new Set();
            for (const entry of this.viewModel.entries) {
                if (!handledEntries.has(entry.id)) {
                    actions.push(new statusbarActions_1.ToggleStatusbarEntryVisibilityAction(entry.id, entry.name, this.viewModel));
                    handledEntries.add(entry.id);
                }
            }
            // Figure out if mouse is over an entry
            let statusEntryUnderMouse = undefined;
            for (let element = event.target; element; element = element.parentElement) {
                const entry = this.viewModel.findEntry(element);
                if (entry) {
                    statusEntryUnderMouse = entry;
                    break;
                }
            }
            if (statusEntryUnderMouse) {
                actions.push(new actions_1.Separator());
                actions.push(new statusbarActions_1.HideStatusbarEntryAction(statusEntryUnderMouse.id, statusEntryUnderMouse.name, this.viewModel));
            }
            return actions;
        }
        updateStyles() {
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            const styleOverride = [...this.styleOverrides].sort((a, b) => a.priority - b.priority)[0];
            // Background / foreground colors
            const backgroundColor = this.getColor(styleOverride?.background ?? (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ? theme_1.STATUS_BAR_BACKGROUND : theme_1.STATUS_BAR_NO_FOLDER_BACKGROUND)) || '';
            container.style.backgroundColor = backgroundColor;
            const foregroundColor = this.getColor(styleOverride?.foreground ?? (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ? theme_1.STATUS_BAR_FOREGROUND : theme_1.STATUS_BAR_NO_FOLDER_FOREGROUND)) || '';
            container.style.color = foregroundColor;
            const itemBorderColor = this.getColor(theme_1.STATUS_BAR_ITEM_FOCUS_BORDER);
            // Border color
            const borderColor = this.getColor(styleOverride?.border ?? (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ? theme_1.STATUS_BAR_BORDER : theme_1.STATUS_BAR_NO_FOLDER_BORDER)) || this.getColor(colorRegistry_1.contrastBorder);
            if (borderColor) {
                container.classList.add('status-border-top');
                container.style.setProperty('--status-border-top-color', borderColor);
            }
            else {
                container.classList.remove('status-border-top');
                container.style.removeProperty('--status-border-top-color');
            }
            // Colors and focus outlines via dynamic stylesheet
            const statusBarFocusColor = this.getColor(theme_1.STATUS_BAR_FOCUS_BORDER);
            if (!this.styleElement) {
                this.styleElement = (0, dom_1.createStyleSheet)(container);
            }
            this.styleElement.textContent = `

				/* Status bar focus outline */
				.monaco-workbench .part.statusbar:focus {
					outline-color: ${statusBarFocusColor};
				}

				/* Status bar item focus outline */
				.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:focus-visible {
					outline: 1px solid ${this.getColor(colorRegistry_1.activeContrastBorder) ?? itemBorderColor};
					outline-offset: ${borderColor ? '-2px' : '-1px'};
				}

				/* Notification Beak */
				.monaco-workbench .part.statusbar > .items-container > .statusbar-item.has-beak > .status-bar-item-beak-container:before {
					border-bottom-color: ${backgroundColor};
				}
			`;
        }
        layout(width, height, top, left) {
            super.layout(width, height, top, left);
            super.layoutContents(width, height);
        }
        overrideStyle(style) {
            this.styleOverrides.add(style);
            this.updateStyles();
            return (0, lifecycle_1.toDisposable)(() => {
                this.styleOverrides.delete(style);
                this.updateStyles();
            });
        }
        toJSON() {
            return {
                type: "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */
            };
        }
        dispose() {
            this._onWillDispose.fire();
            super.dispose();
        }
    };
    StatusbarPart = StatusbarPart_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, storage_1.IStorageService),
        __param(5, layoutService_1.IWorkbenchLayoutService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, contextkey_1.IContextKeyService)
    ], StatusbarPart);
    let MainStatusbarPart = class MainStatusbarPart extends StatusbarPart {
        constructor(instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService) {
            super("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService);
        }
    };
    exports.MainStatusbarPart = MainStatusbarPart;
    exports.MainStatusbarPart = MainStatusbarPart = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, themeService_1.IThemeService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, contextkey_1.IContextKeyService)
    ], MainStatusbarPart);
    let AuxiliaryStatusbarPart = class AuxiliaryStatusbarPart extends StatusbarPart {
        static { AuxiliaryStatusbarPart_1 = this; }
        static { this.COUNTER = 1; }
        constructor(container, instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService) {
            const id = AuxiliaryStatusbarPart_1.COUNTER++;
            super(`workbench.parts.auxiliaryStatus.${id}`, instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService);
            this.container = container;
            this.height = StatusbarPart.HEIGHT;
        }
    };
    exports.AuxiliaryStatusbarPart = AuxiliaryStatusbarPart;
    exports.AuxiliaryStatusbarPart = AuxiliaryStatusbarPart = AuxiliaryStatusbarPart_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, storage_1.IStorageService),
        __param(5, layoutService_1.IWorkbenchLayoutService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, contextkey_1.IContextKeyService)
    ], AuxiliaryStatusbarPart);
    let StatusbarService = class StatusbarService extends part_1.MultiWindowParts {
        constructor(instantiationService, storageService, themeService) {
            super('workbench.statusBarService', themeService, storageService);
            this.instantiationService = instantiationService;
            this.mainPart = this._register(this.instantiationService.createInstance(MainStatusbarPart));
            this._onDidCreateAuxiliaryStatusbarPart = this._register(new event_1.Emitter());
            this.onDidCreateAuxiliaryStatusbarPart = this._onDidCreateAuxiliaryStatusbarPart.event;
            //#endregion
            //#region Service Implementation
            this.onDidChangeEntryVisibility = this.mainPart.onDidChangeEntryVisibility;
            this._register(this.registerPart(this.mainPart));
        }
        //#region Auxiliary Statusbar Parts
        createAuxiliaryStatusbarPart(container) {
            // Container
            const statusbarPartContainer = document.createElement('footer');
            statusbarPartContainer.classList.add('part', 'statusbar');
            statusbarPartContainer.setAttribute('role', 'status');
            statusbarPartContainer.style.position = 'relative';
            statusbarPartContainer.setAttribute('aria-live', 'off');
            statusbarPartContainer.setAttribute('tabindex', '0');
            container.appendChild(statusbarPartContainer);
            // Statusbar Part
            const statusbarPart = this.instantiationService.createInstance(AuxiliaryStatusbarPart, statusbarPartContainer);
            const disposable = this.registerPart(statusbarPart);
            statusbarPart.create(statusbarPartContainer);
            event_1.Event.once(statusbarPart.onWillDispose)(() => disposable.dispose());
            // Emit internal event
            this._onDidCreateAuxiliaryStatusbarPart.fire(statusbarPart);
            return statusbarPart;
        }
        createScoped(statusbarEntryContainer, disposables) {
            return disposables.add(this.instantiationService.createInstance(ScopedStatusbarService, statusbarEntryContainer));
        }
        addEntry(entry, id, alignment, priorityOrLocation = 0) {
            if (entry.showInAllWindows) {
                return this.doAddEntryToAllWindows(entry, id, alignment, priorityOrLocation);
            }
            return this.mainPart.addEntry(entry, id, alignment, priorityOrLocation);
        }
        doAddEntryToAllWindows(entry, id, alignment, priorityOrLocation = 0) {
            const entryDisposables = new lifecycle_1.DisposableStore();
            const accessors = new Set();
            function addEntry(part) {
                const partDisposables = new lifecycle_1.DisposableStore();
                partDisposables.add(part.onWillDispose(() => partDisposables.dispose()));
                const accessor = partDisposables.add(part.addEntry(entry, id, alignment, priorityOrLocation));
                accessors.add(accessor);
                partDisposables.add((0, lifecycle_1.toDisposable)(() => accessors.delete(accessor)));
                entryDisposables.add(partDisposables);
                partDisposables.add((0, lifecycle_1.toDisposable)(() => entryDisposables.delete(partDisposables)));
            }
            for (const part of this.parts) {
                addEntry(part);
            }
            entryDisposables.add(this.onDidCreateAuxiliaryStatusbarPart(part => addEntry(part)));
            return {
                update: (entry) => {
                    for (const update of accessors) {
                        update.update(entry);
                    }
                },
                dispose: () => entryDisposables.dispose()
            };
        }
        isEntryVisible(id) {
            return this.mainPart.isEntryVisible(id);
        }
        updateEntryVisibility(id, visible) {
            for (const part of this.parts) {
                part.updateEntryVisibility(id, visible);
            }
        }
        focus(preserveEntryFocus) {
            this.activePart.focus(preserveEntryFocus);
        }
        focusNextEntry() {
            this.activePart.focusNextEntry();
        }
        focusPreviousEntry() {
            this.activePart.focusPreviousEntry();
        }
        isEntryFocused() {
            return this.activePart.isEntryFocused();
        }
        overrideStyle(style) {
            const disposables = new lifecycle_1.DisposableStore();
            for (const part of this.parts) {
                disposables.add(part.overrideStyle(style));
            }
            return disposables;
        }
    };
    exports.StatusbarService = StatusbarService;
    exports.StatusbarService = StatusbarService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, storage_1.IStorageService),
        __param(2, themeService_1.IThemeService)
    ], StatusbarService);
    let ScopedStatusbarService = class ScopedStatusbarService extends lifecycle_1.Disposable {
        constructor(statusbarEntryContainer, statusbarService) {
            super();
            this.statusbarEntryContainer = statusbarEntryContainer;
            this.statusbarService = statusbarService;
            this.onDidChangeEntryVisibility = this.statusbarEntryContainer.onDidChangeEntryVisibility;
        }
        createAuxiliaryStatusbarPart(container) {
            return this.statusbarService.createAuxiliaryStatusbarPart(container);
        }
        createScoped(statusbarEntryContainer, disposables) {
            return this.statusbarService.createScoped(statusbarEntryContainer, disposables);
        }
        getPart() {
            return this.statusbarEntryContainer;
        }
        addEntry(entry, id, alignment, priorityOrLocation = 0) {
            return this.statusbarEntryContainer.addEntry(entry, id, alignment, priorityOrLocation);
        }
        isEntryVisible(id) {
            return this.statusbarEntryContainer.isEntryVisible(id);
        }
        updateEntryVisibility(id, visible) {
            this.statusbarEntryContainer.updateEntryVisibility(id, visible);
        }
        focus(preserveEntryFocus) {
            this.statusbarEntryContainer.focus(preserveEntryFocus);
        }
        focusNextEntry() {
            this.statusbarEntryContainer.focusNextEntry();
        }
        focusPreviousEntry() {
            this.statusbarEntryContainer.focusPreviousEntry();
        }
        isEntryFocused() {
            return this.statusbarEntryContainer.isEntryFocused();
        }
        overrideStyle(style) {
            return this.statusbarEntryContainer.overrideStyle(style);
        }
    };
    exports.ScopedStatusbarService = ScopedStatusbarService;
    exports.ScopedStatusbarService = ScopedStatusbarService = __decorate([
        __param(1, statusbar_1.IStatusbarService)
    ], ScopedStatusbarService);
    (0, extensions_1.registerSingleton)(statusbar_1.IStatusbarService, StatusbarService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzYmFyUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL3N0YXR1c2Jhci9zdGF0dXNiYXJQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE0R2hHLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSxXQUFJOztpQkFFZixXQUFNLEdBQUcsRUFBRSxBQUFMLENBQU07UUFxQzVCLFlBQ0MsRUFBVSxFQUNhLG9CQUE0RCxFQUNwRSxZQUEyQixFQUNoQixjQUF5RCxFQUNsRSxjQUFnRCxFQUN4QyxhQUFzQyxFQUMxQyxrQkFBd0QsRUFDekQsaUJBQXNEO1lBRTFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQVJwQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBRXhDLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUNqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFFM0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN4QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBM0MzRSxlQUFlO1lBRU4saUJBQVksR0FBVyxDQUFDLENBQUM7WUFDekIsaUJBQVksR0FBVyxNQUFNLENBQUMsaUJBQWlCLENBQUM7WUFDaEQsa0JBQWEsR0FBVyxlQUFhLENBQUMsTUFBTSxDQUFDO1lBQzdDLGtCQUFhLEdBQVcsZUFBYSxDQUFDLE1BQU0sQ0FBQztZQU05QyxtQkFBYyxHQUE2QixFQUFFLENBQUM7WUFFckMsY0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxtQ0FBa0IsQ0FBQyxJQUFJLENBQUMsY0FB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