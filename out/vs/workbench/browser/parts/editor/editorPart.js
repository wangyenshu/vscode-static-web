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
define(["require", "exports", "vs/platform/theme/common/themeService", "vs/workbench/browser/part", "vs/base/browser/dom", "vs/base/common/event", "vs/platform/theme/common/colorRegistry", "vs/platform/instantiation/common/instantiation", "vs/base/browser/ui/grid/grid", "vs/workbench/common/theme", "vs/base/common/arrays", "vs/workbench/browser/parts/editor/editor", "vs/workbench/browser/parts/editor/editorGroupView", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/common/editor/editorGroupModel", "vs/workbench/browser/parts/editor/editorDropTarget", "vs/base/common/color", "vs/base/browser/ui/centered/centeredViewLayout", "vs/base/common/errors", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/types", "vs/workbench/browser/dnd", "vs/base/common/async", "vs/workbench/services/editor/common/editorGroupFinder", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/common/contextkeys", "vs/base/browser/window"], function (require, exports, themeService_1, part_1, dom_1, event_1, colorRegistry_1, instantiation_1, grid_1, theme_1, arrays_1, editor_1, editorGroupView_1, configuration_1, lifecycle_1, storage_1, editorGroupModel_1, editorDropTarget_1, color_1, centeredViewLayout_1, errors_1, layoutService_1, types_1, dnd_1, async_1, editorGroupFinder_1, editorService_1, host_1, contextkey_1, serviceCollection_1, contextkeys_1, window_1) {
    "use strict";
    var EditorPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainEditorPart = exports.EditorPart = void 0;
    class GridWidgetView {
        constructor() {
            this.element = (0, dom_1.$)('.grid-view-container');
            this._onDidChange = new event_1.Relay();
            this.onDidChange = this._onDidChange.event;
        }
        get minimumWidth() { return this.gridWidget ? this.gridWidget.minimumWidth : 0; }
        get maximumWidth() { return this.gridWidget ? this.gridWidget.maximumWidth : Number.POSITIVE_INFINITY; }
        get minimumHeight() { return this.gridWidget ? this.gridWidget.minimumHeight : 0; }
        get maximumHeight() { return this.gridWidget ? this.gridWidget.maximumHeight : Number.POSITIVE_INFINITY; }
        get gridWidget() {
            return this._gridWidget;
        }
        set gridWidget(grid) {
            this.element.innerText = '';
            if (grid) {
                this.element.appendChild(grid.element);
                this._onDidChange.input = grid.onDidChange;
            }
            else {
                this._onDidChange.input = event_1.Event.None;
            }
            this._gridWidget = grid;
        }
        layout(width, height, top, left) {
            this.gridWidget?.layout(width, height, top, left);
        }
        dispose() {
            this._onDidChange.dispose();
        }
    }
    let EditorPart = class EditorPart extends part_1.Part {
        static { EditorPart_1 = this; }
        static { this.EDITOR_PART_UI_STATE_STORAGE_KEY = 'editorpart.state'; }
        static { this.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY = 'editorpart.centeredview'; }
        constructor(editorPartsView, id, groupsLabel, windowId, instantiationService, themeService, configurationService, storageService, layoutService, hostService, contextKeyService) {
            super(id, { hasTitle: false }, themeService, storageService, layoutService);
            this.editorPartsView = editorPartsView;
            this.groupsLabel = groupsLabel;
            this.windowId = windowId;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.hostService = hostService;
            this.contextKeyService = contextKeyService;
            //#region Events
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidLayout = this._register(new event_1.Emitter());
            this.onDidLayout = this._onDidLayout.event;
            this._onDidChangeActiveGroup = this._register(new event_1.Emitter());
            this.onDidChangeActiveGroup = this._onDidChangeActiveGroup.event;
            this._onDidChangeGroupIndex = this._register(new event_1.Emitter());
            this.onDidChangeGroupIndex = this._onDidChangeGroupIndex.event;
            this._onDidChangeGroupLabel = this._register(new event_1.Emitter());
            this.onDidChangeGroupLabel = this._onDidChangeGroupLabel.event;
            this._onDidChangeGroupLocked = this._register(new event_1.Emitter());
            this.onDidChangeGroupLocked = this._onDidChangeGroupLocked.event;
            this._onDidChangeGroupMaximized = this._register(new event_1.Emitter());
            this.onDidChangeGroupMaximized = this._onDidChangeGroupMaximized.event;
            this._onDidActivateGroup = this._register(new event_1.Emitter());
            this.onDidActivateGroup = this._onDidActivateGroup.event;
            this._onDidAddGroup = this._register(new event_1.Emitter());
            this.onDidAddGroup = this._onDidAddGroup.event;
            this._onDidRemoveGroup = this._register(new event_1.PauseableEmitter());
            this.onDidRemoveGroup = this._onDidRemoveGroup.event;
            this._onDidMoveGroup = this._register(new event_1.Emitter());
            this.onDidMoveGroup = this._onDidMoveGroup.event;
            this.onDidSetGridWidget = this._register(new event_1.Emitter());
            this._onDidChangeSizeConstraints = this._register(new event_1.Relay());
            this.onDidChangeSizeConstraints = event_1.Event.any(this.onDidSetGridWidget.event, this._onDidChangeSizeConstraints.event);
            this._onDidScroll = this._register(new event_1.Relay());
            this.onDidScroll = event_1.Event.any(this.onDidSetGridWidget.event, this._onDidScroll.event);
            this._onDidChangeEditorPartOptions = this._register(new event_1.Emitter());
            this.onDidChangeEditorPartOptions = this._onDidChangeEditorPartOptions.event;
            //#endregion
            this.workspaceMemento = this.getMemento(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            this.profileMemento = this.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            this.groupViews = new Map();
            this.mostRecentActiveGroups = [];
            this.gridWidgetDisposables = this._register(new lifecycle_1.DisposableStore());
            this.gridWidgetView = this._register(new GridWidgetView());
            this.enforcedPartOptions = [];
            this._partOptions = (0, editor_1.getEditorPartOptions)(this.configurationService, this.themeService);
            this.top = 0;
            this.left = 0;
            this.sideGroup = {
                openEditor: (editor, options) => {
                    const [group] = this.scopedInstantiationService.invokeFunction(accessor => (0, editorGroupFinder_1.findGroup)(accessor, { editor, options }, editorService_1.SIDE_GROUP));
                    return group.openEditor(editor, options);
                }
            };
            this._isReady = false;
            this.whenReadyPromise = new async_1.DeferredPromise();
            this.whenReady = this.whenReadyPromise.p;
            this.whenRestoredPromise = new async_1.DeferredPromise();
            this.whenRestored = this.whenRestoredPromise.p;
            this._willRestoreState = false;
            this.priority = 2 /* LayoutPriority.High */;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
            this._register(this.themeService.onDidFileIconThemeChange(() => this.handleChangedPartOptions()));
            this._register(this.onDidChangeMementoValue(1 /* StorageScope.WORKSPACE */, this._store)(e => this.onDidChangeMementoState(e)));
        }
        onConfigurationUpdated(event) {
            if ((0, editor_1.impactsEditorPartOptions)(event)) {
                this.handleChangedPartOptions();
            }
        }
        handleChangedPartOptions() {
            const oldPartOptions = this._partOptions;
            const newPartOptions = (0, editor_1.getEditorPartOptions)(this.configurationService, this.themeService);
            for (const enforcedPartOptions of this.enforcedPartOptions) {
                Object.assign(newPartOptions, enforcedPartOptions); // check for overrides
            }
            this._partOptions = newPartOptions;
            this._onDidChangeEditorPartOptions.fire({ oldPartOptions, newPartOptions });
        }
        get partOptions() { return this._partOptions; }
        enforcePartOptions(options) {
            this.enforcedPartOptions.push(options);
            this.handleChangedPartOptions();
            return (0, lifecycle_1.toDisposable)(() => {
                this.enforcedPartOptions.splice(this.enforcedPartOptions.indexOf(options), 1);
                this.handleChangedPartOptions();
            });
        }
        get contentDimension() { return this._contentDimension; }
        get activeGroup() {
            return this._activeGroup;
        }
        get groups() {
            return Array.from(this.groupViews.values());
        }
        get count() {
            return this.groupViews.size;
        }
        get orientation() {
            return (this.gridWidget && this.gridWidget.orientation === 0 /* Orientation.VERTICAL */) ? 1 /* GroupOrientation.VERTICAL */ : 0 /* GroupOrientation.HORIZONTAL */;
        }
        get isReady() { return this._isReady; }
        get hasRestorableState() {
            return !!this.workspaceMemento[EditorPart_1.EDITOR_PART_UI_STATE_STORAGE_KEY];
        }
        get willRestoreState() { return this._willRestoreState; }
        getGroups(order = 0 /* GroupsOrder.CREATION_TIME */) {
            switch (order) {
                case 0 /* GroupsOrder.CREATION_TIME */:
                    return this.groups;
                case 1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */: {
                    const mostRecentActive = (0, arrays_1.coalesce)(this.mostRecentActiveGroups.map(groupId => this.getGroup(groupId)));
                    // there can be groups that got never active, even though they exist. in this case
                    // make sure to just append them at the end so that all groups are returned properly
                    return (0, arrays_1.distinct)([...mostRecentActive, ...this.groups]);
                }
                case 2 /* GroupsOrder.GRID_APPEARANCE */: {
                    const views = [];
                    if (this.gridWidget) {
                        this.fillGridNodes(views, this.gridWidget.getViews());
                    }
                    return views;
                }
            }
        }
        fillGridNodes(target, node) {
            if ((0, grid_1.isGridBranchNode)(node)) {
                node.children.forEach(child => this.fillGridNodes(target, child));
            }
            else {
                target.push(node.view);
            }
        }
        hasGroup(identifier) {
            return this.groupViews.has(identifier);
        }
        getGroup(identifier) {
            return this.groupViews.get(identifier);
        }
        findGroup(scope, source = this.activeGroup, wrap) {
            // by direction
            if (typeof scope.direction === 'number') {
                return this.doFindGroupByDirection(scope.direction, source, wrap);
            }
            // by location
            if (typeof scope.location === 'number') {
                return this.doFindGroupByLocation(scope.location, source, wrap);
            }
            throw new Error('invalid arguments');
        }
        doFindGroupByDirection(direction, source, wrap) {
            const sourceGroupView = this.assertGroupView(source);
            // Find neighbours and sort by our MRU list
            const neighbours = this.gridWidget.getNeighborViews(sourceGroupView, this.toGridViewDirection(direction), wrap);
            neighbours.sort(((n1, n2) => this.mostRecentActiveGroups.indexOf(n1.id) - this.mostRecentActiveGroups.indexOf(n2.id)));
            return neighbours[0];
        }
        doFindGroupByLocation(location, source, wrap) {
            const sourceGroupView = this.assertGroupView(source);
            const groups = this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
            const index = groups.indexOf(sourceGroupView);
            switch (location) {
                case 0 /* GroupLocation.FIRST */:
                    return groups[0];
                case 1 /* GroupLocation.LAST */:
                    return groups[groups.length - 1];
                case 2 /* GroupLocation.NEXT */: {
                    let nextGroup = groups[index + 1];
                    if (!nextGroup && wrap) {
                        nextGroup = this.doFindGroupByLocation(0 /* GroupLocation.FIRST */, source);
                    }
                    return nextGroup;
                }
                case 3 /* GroupLocation.PREVIOUS */: {
                    let previousGroup = groups[index - 1];
                    if (!previousGroup && wrap) {
                        previousGroup = this.doFindGroupByLocation(1 /* GroupLocation.LAST */, source);
                    }
                    return previousGroup;
                }
            }
        }
        activateGroup(group, preserveWindowOrder) {
            const groupView = this.assertGroupView(group);
            this.doSetGroupActive(groupView);
            // Ensure window on top unless disabled
            if (!preserveWindowOrder) {
                this.hostService.moveTop((0, dom_1.getWindow)(this.element));
            }
            return groupView;
        }
        restoreGroup(group) {
            const groupView = this.assertGroupView(group);
            this.doRestoreGroup(groupView);
            return groupView;
        }
        getSize(group) {
            const groupView = this.assertGroupView(group);
            return this.gridWidget.getViewSize(groupView);
        }
        setSize(group, size) {
            const groupView = this.assertGroupView(group);
            this.gridWidget.resizeView(groupView, size);
        }
        arrangeGroups(arrangement, target = this.activeGroup) {
            if (this.count < 2) {
                return; // require at least 2 groups to show
            }
            if (!this.gridWidget) {
                return; // we have not been created yet
            }
            const groupView = this.assertGroupView(target);
            switch (arrangement) {
                case 2 /* GroupsArrangement.EVEN */:
                    this.gridWidget.distributeViewSizes();
                    break;
                case 0 /* GroupsArrangement.MAXIMIZE */:
                    if (this.groups.length < 2) {
                        return; // need at least 2 groups to be maximized
                    }
                    this.gridWidget.maximizeView(groupView);
                    groupView.focus();
                    break;
                case 1 /* GroupsArrangement.EXPAND */:
                    this.gridWidget.expandView(groupView);
                    break;
            }
        }
        toggleMaximizeGroup(target = this.activeGroup) {
            if (this.hasMaximizedGroup()) {
                this.unmaximizeGroup();
            }
            else {
                this.arrangeGroups(0 /* GroupsArrangement.MAXIMIZE */, target);
            }
        }
        toggleExpandGroup(target = this.activeGroup) {
            if (this.isGroupExpanded(this.activeGroup)) {
                this.arrangeGroups(2 /* GroupsArrangement.EVEN */);
            }
            else {
                this.arrangeGroups(1 /* GroupsArrangement.EXPAND */, target);
            }
        }
        unmaximizeGroup() {
            this.gridWidget.exitMaximizedView();
            this._activeGroup.focus(); // When making views visible the focus can be affected, so restore it
        }
        hasMaximizedGroup() {
            return this.gridWidget.hasMaximizedView();
        }
        isGroupMaximized(targetGroup) {
            return this.gridWidget.isViewMaximized(targetGroup);
        }
        isGroupExpanded(targetGroup) {
            return this.gridWidget.isViewExpanded(targetGroup);
        }
        setGroupOrientation(orientation) {
            if (!this.gridWidget) {
                return; // we have not been created yet
            }
            const newOrientation = (orientation === 0 /* GroupOrientation.HORIZONTAL */) ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */;
            if (this.gridWidget.orientation !== newOrientation) {
                this.gridWidget.orientation = newOrientation;
            }
        }
        applyLayout(layout) {
            const restoreFocus = this.shouldRestoreFocus(this.container);
            // Determine how many groups we need overall
            let layoutGroupsCount = 0;
            function countGroups(groups) {
                for (const group of groups) {
                    if (Array.isArray(group.groups)) {
                        countGroups(group.groups);
                    }
                    else {
                        layoutGroupsCount++;
                    }
                }
            }
            countGroups(layout.groups);
            // If we currently have too many groups, merge them into the last one
            let currentGroupViews = this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
            if (layoutGroupsCount < currentGroupViews.length) {
                const lastGroupInLayout = currentGroupViews[layoutGroupsCount - 1];
                currentGroupViews.forEach((group, index) => {
                    if (index >= layoutGroupsCount) {
                        this.mergeGroup(group, lastGroupInLayout);
                    }
                });
                currentGroupViews = this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
            }
            const activeGroup = this.activeGroup;
            // Prepare grid descriptor to create new grid from
            const gridDescriptor = (0, grid_1.createSerializedGrid)({
                orientation: this.toGridViewOrientation(layout.orientation, this.isTwoDimensionalGrid() ?
                    this.gridWidget.orientation : // preserve original orientation for 2-dimensional grids
                    (0, grid_1.orthogonal)(this.gridWidget.orientation) // otherwise flip (fix https://github.com/microsoft/vscode/issues/52975)
                ),
                groups: layout.groups
            });
            // Recreate gridwidget with descriptor
            this.doApplyGridState(gridDescriptor, activeGroup.id, currentGroupViews);
            // Restore focus as needed
            if (restoreFocus) {
                this._activeGroup.focus();
            }
        }
        getLayout() {
            // Example return value:
            // { orientation: 0, groups: [ { groups: [ { size: 0.4 }, { size: 0.6 } ], size: 0.5 }, { groups: [ {}, {} ], size: 0.5 } ] }
            const serializedGrid = this.gridWidget.serialize();
            const orientation = serializedGrid.orientation === 1 /* Orientation.HORIZONTAL */ ? 0 /* GroupOrientation.HORIZONTAL */ : 1 /* GroupOrientation.VERTICAL */;
            const root = this.serializedNodeToGroupLayoutArgument(serializedGrid.root);
            return {
                orientation,
                groups: root.groups
            };
        }
        serializedNodeToGroupLayoutArgument(serializedNode) {
            if (serializedNode.type === 'branch') {
                return {
                    size: serializedNode.size,
                    groups: serializedNode.data.map(node => this.serializedNodeToGroupLayoutArgument(node))
                };
            }
            return { size: serializedNode.size };
        }
        shouldRestoreFocus(target) {
            if (!target) {
                return false;
            }
            const activeElement = (0, dom_1.getActiveElement)();
            if (activeElement === target.ownerDocument.body) {
                return true; // always restore focus if nothing is focused currently
            }
            // otherwise check for the active element being an ancestor of the target
            return (0, dom_1.isAncestorOfActiveElement)(target);
        }
        isTwoDimensionalGrid() {
            const views = this.gridWidget.getViews();
            if ((0, grid_1.isGridBranchNode)(views)) {
                // the grid is 2-dimensional if any children
                // of the grid is a branch node
                return views.children.some(child => (0, grid_1.isGridBranchNode)(child));
            }
            return false;
        }
        addGroup(location, direction, groupToCopy) {
            const locationView = this.assertGroupView(location);
            let newGroupView;
            // Same groups view: add to grid widget directly
            if (locationView.groupsView === this) {
                const restoreFocus = this.shouldRestoreFocus(locationView.element);
                const shouldExpand = this.groupViews.size > 1 && this.isGroupExpanded(locationView);
                newGroupView = this.doCreateGroupView(groupToCopy);
                // Add to grid widget
                this.gridWidget.addView(newGroupView, this.getSplitSizingStyle(), locationView, this.toGridViewDirection(direction));
                // Update container
                this.updateContainer();
                // Event
                this._onDidAddGroup.fire(newGroupView);
                // Notify group index change given a new group was added
                this.notifyGroupIndexChange();
                // Expand new group, if the reference view was previously expanded
                if (shouldExpand) {
                    this.arrangeGroups(1 /* GroupsArrangement.EXPAND */, newGroupView);
                }
                // Restore focus if we had it previously after completing the grid
                // operation. That operation might cause reparenting of grid views
                // which moves focus to the <body> element otherwise.
                if (restoreFocus) {
                    locationView.focus();
                }
            }
            // Different group view: add to grid widget of that group
            else {
                newGroupView = locationView.groupsView.addGroup(locationView, direction, groupToCopy);
            }
            return newGroupView;
        }
        getSplitSizingStyle() {
            switch (this._partOptions.splitSizing) {
                case 'distribute':
                    return grid_1.Sizing.Distribute;
                case 'split':
                    return grid_1.Sizing.Split;
                default:
                    return grid_1.Sizing.Auto;
            }
        }
        doCreateGroupView(from) {
            // Create group view
            let groupView;
            if (from instanceof editorGroupView_1.EditorGroupView) {
                groupView = editorGroupView_1.EditorGroupView.createCopy(from, this.editorPartsView, this, this.groupsLabel, this.count, this.scopedInstantiationService);
            }
            else if ((0, editorGroupModel_1.isSerializedEditorGroupModel)(from)) {
                groupView = editorGroupView_1.EditorGroupView.createFromSerialized(from, this.editorPartsView, this, this.groupsLabel, this.count, this.scopedInstantiationService);
            }
            else {
                groupView = editorGroupView_1.EditorGroupView.createNew(this.editorPartsView, this, this.groupsLabel, this.count, this.scopedInstantiationService);
            }
            // Keep in map
            this.groupViews.set(groupView.id, groupView);
            // Track focus
            const groupDisposables = new lifecycle_1.DisposableStore();
            groupDisposables.add(groupView.onDidFocus(() => {
                this.doSetGroupActive(groupView);
                this._onDidFocus.fire();
            }));
            // Track group changes
            groupDisposables.add(groupView.onDidModelChange(e => {
                switch (e.kind) {
                    case 3 /* GroupModelChangeKind.GROUP_LOCKED */:
                        this._onDidChangeGroupLocked.fire(groupView);
                        break;
                    case 1 /* GroupModelChangeKind.GROUP_INDEX */:
                        this._onDidChangeGroupIndex.fire(groupView);
                        break;
                    case 2 /* GroupModelChangeKind.GROUP_LABEL */:
                        this._onDidChangeGroupLabel.fire(groupView);
                        break;
                }
            }));
            // Track active editor change after it occurred
            groupDisposables.add(groupView.onDidActiveEditorChange(() => {
                this.updateContainer();
            }));
            // Track dispose
            event_1.Event.once(groupView.onWillDispose)(() => {
                (0, lifecycle_1.dispose)(groupDisposables);
                this.groupViews.delete(groupView.id);
                this.doUpdateMostRecentActive(groupView);
            });
            return groupView;
        }
        doSetGroupActive(group) {
            if (this._activeGroup !== group) {
                const previousActiveGroup = this._activeGroup;
                this._activeGroup = group;
                // Update list of most recently active groups
                this.doUpdateMostRecentActive(group, true);
                // Mark previous one as inactive
                if (previousActiveGroup && !previousActiveGroup.disposed) {
                    previousActiveGroup.setActive(false);
                }
                // Mark group as new active
                group.setActive(true);
                // Expand the group if it is currently minimized
                this.doRestoreGroup(group);
                // Event
                this._onDidChangeActiveGroup.fire(group);
            }
            // Always fire the event that a group has been activated
            // even if its the same group that is already active to
            // signal the intent even when nothing has changed.
            this._onDidActivateGroup.fire(group);
        }
        doRestoreGroup(group) {
            if (!this.gridWidget) {
                return; // method is called as part of state restore very early
            }
            if (this.hasMaximizedGroup() && !this.isGroupMaximized(group)) {
                this.unmaximizeGroup();
            }
            try {
                const viewSize = this.gridWidget.getViewSize(group);
                if (viewSize.width === group.minimumWidth || viewSize.height === group.minimumHeight) {
                    this.arrangeGroups(1 /* GroupsArrangement.EXPAND */, group);
                }
            }
            catch (error) {
                // ignore: method might be called too early before view is known to grid
            }
        }
        doUpdateMostRecentActive(group, makeMostRecentlyActive) {
            const index = this.mostRecentActiveGroups.indexOf(group.id);
            // Remove from MRU list
            if (index !== -1) {
                this.mostRecentActiveGroups.splice(index, 1);
            }
            // Add to front as needed
            if (makeMostRecentlyActive) {
                this.mostRecentActiveGroups.unshift(group.id);
            }
        }
        toGridViewDirection(direction) {
            switch (direction) {
                case 0 /* GroupDirection.UP */: return 0 /* Direction.Up */;
                case 1 /* GroupDirection.DOWN */: return 1 /* Direction.Down */;
                case 2 /* GroupDirection.LEFT */: return 2 /* Direction.Left */;
                case 3 /* GroupDirection.RIGHT */: return 3 /* Direction.Right */;
            }
        }
        toGridViewOrientation(orientation, fallback) {
            if (typeof orientation === 'number') {
                return orientation === 0 /* GroupOrientation.HORIZONTAL */ ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */;
            }
            return fallback;
        }
        removeGroup(group, preserveFocus) {
            const groupView = this.assertGroupView(group);
            if (this.count === 1) {
                return; // Cannot remove the last root group
            }
            // Remove empty group
            if (groupView.isEmpty) {
                this.doRemoveEmptyGroup(groupView, preserveFocus);
            }
            // Remove group with editors
            else {
                this.doRemoveGroupWithEditors(groupView);
            }
        }
        doRemoveGroupWithEditors(groupView) {
            const mostRecentlyActiveGroups = this.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            let lastActiveGroup;
            if (this._activeGroup === groupView) {
                lastActiveGroup = mostRecentlyActiveGroups[1];
            }
            else {
                lastActiveGroup = mostRecentlyActiveGroups[0];
            }
            // Removing a group with editors should merge these editors into the
            // last active group and then remove this group.
            this.mergeGroup(groupView, lastActiveGroup);
        }
        doRemoveEmptyGroup(groupView, preserveFocus) {
            const restoreFocus = !preserveFocus && this.shouldRestoreFocus(this.container);
            // Activate next group if the removed one was active
            if (this._activeGroup === groupView) {
                const mostRecentlyActiveGroups = this.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
                const nextActiveGroup = mostRecentlyActiveGroups[1]; // [0] will be the current group we are about to dispose
                this.doSetGroupActive(nextActiveGroup);
            }
            // Remove from grid widget & dispose
            this.gridWidget.removeView(groupView, this.getSplitSizingStyle());
            groupView.dispose();
            // Restore focus if we had it previously after completing the grid
            // operation. That operation might cause reparenting of grid views
            // which moves focus to the <body> element otherwise.
            if (restoreFocus) {
                this._activeGroup.focus();
            }
            // Notify group index change given a group was removed
            this.notifyGroupIndexChange();
            // Update container
            this.updateContainer();
            // Event
            this._onDidRemoveGroup.fire(groupView);
        }
        moveGroup(group, location, direction) {
            const sourceView = this.assertGroupView(group);
            const targetView = this.assertGroupView(location);
            if (sourceView.id === targetView.id) {
                throw new Error('Cannot move group into its own');
            }
            const restoreFocus = this.shouldRestoreFocus(sourceView.element);
            let movedView;
            // Same groups view: move via grid widget API
            if (sourceView.groupsView === targetView.groupsView) {
                this.gridWidget.moveView(sourceView, this.getSplitSizingStyle(), targetView, this.toGridViewDirection(direction));
                movedView = sourceView;
            }
            // Different groups view: move via groups view API
            else {
                movedView = targetView.groupsView.addGroup(targetView, direction, sourceView);
                sourceView.closeAllEditors();
                this.removeGroup(sourceView, restoreFocus);
            }
            // Restore focus if we had it previously after completing the grid
            // operation. That operation might cause reparenting of grid views
            // which moves focus to the <body> element otherwise.
            if (restoreFocus) {
                movedView.focus();
            }
            // Event
            this._onDidMoveGroup.fire(movedView);
            // Notify group index change given a group was moved
            this.notifyGroupIndexChange();
            return movedView;
        }
        copyGroup(group, location, direction) {
            const groupView = this.assertGroupView(group);
            const locationView = this.assertGroupView(location);
            const restoreFocus = this.shouldRestoreFocus(groupView.element);
            // Copy the group view
            const copiedGroupView = this.addGroup(locationView, direction, groupView);
            // Restore focus if we had it
            if (restoreFocus) {
                copiedGroupView.focus();
            }
            return copiedGroupView;
        }
        mergeGroup(group, target, options) {
            const sourceView = this.assertGroupView(group);
            const targetView = this.assertGroupView(target);
            // Collect editors to move/copy
            const editors = [];
            let index = (options && typeof options.index === 'number') ? options.index : targetView.count;
            for (const editor of sourceView.editors) {
                const inactive = !sourceView.isActive(editor) || this._activeGroup !== sourceView;
                const sticky = sourceView.isSticky(editor);
                const options = { index: !sticky ? index : undefined /* do not set index to preserve sticky flag */, inactive, preserveFocus: inactive };
                editors.push({ editor, options });
                index++;
            }
            // Move/Copy editors over into target
            let result = true;
            if (options?.mode === 0 /* MergeGroupMode.COPY_EDITORS */) {
                sourceView.copyEditors(editors, targetView);
            }
            else {
                result = sourceView.moveEditors(editors, targetView);
            }
            // Remove source if the view is now empty and not already removed
            if (sourceView.isEmpty && !sourceView.disposed /* could have been disposed already via workbench.editor.closeEmptyGroups setting */) {
                this.removeGroup(sourceView, true);
            }
            return result;
        }
        mergeAllGroups(target) {
            const targetView = this.assertGroupView(target);
            let result = true;
            for (const group of this.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                if (group === targetView) {
                    continue; // keep target
                }
                const merged = this.mergeGroup(group, targetView);
                if (!merged) {
                    result = false;
                }
            }
            return result;
        }
        assertGroupView(group) {
            let groupView;
            if (typeof group === 'number') {
                groupView = this.editorPartsView.getGroup(group);
            }
            else {
                groupView = group;
            }
            if (!groupView) {
                throw new Error('Invalid editor group provided!');
            }
            return groupView;
        }
        createEditorDropTarget(container, delegate) {
            (0, types_1.assertType)(container instanceof HTMLElement);
            return this.scopedInstantiationService.createInstance(editorDropTarget_1.EditorDropTarget, container, delegate);
        }
        //#region Part
        // TODO @sbatten @joao find something better to prevent editor taking over #79897
        get minimumWidth() { return Math.min(this.centeredLayoutWidget.minimumWidth, this.layoutService.getMaximumEditorDimensions(this.layoutService.getContainer((0, dom_1.getWindow)(this.container))).width); }
        get maximumWidth() { return this.centeredLayoutWidget.maximumWidth; }
        get minimumHeight() { return Math.min(this.centeredLayoutWidget.minimumHeight, this.layoutService.getMaximumEditorDimensions(this.layoutService.getContainer((0, dom_1.getWindow)(this.container))).height); }
        get maximumHeight() { return this.centeredLayoutWidget.maximumHeight; }
        get snap() { return this.layoutService.getPanelAlignment() === 'center'; }
        get onDidChange() { return event_1.Event.any(this.centeredLayoutWidget.onDidChange, this.onDidSetGridWidget.event); }
        get gridSeparatorBorder() {
            return this.theme.getColor(theme_1.EDITOR_GROUP_BORDER) || this.theme.getColor(colorRegistry_1.contrastBorder) || color_1.Color.transparent;
        }
        updateStyles() {
            const container = (0, types_1.assertIsDefined)(this.container);
            container.style.backgroundColor = this.getColor(colorRegistry_1.editorBackground) || '';
            const separatorBorderStyle = { separatorBorder: this.gridSeparatorBorder, background: this.theme.getColor(theme_1.EDITOR_PANE_BACKGROUND) || color_1.Color.transparent };
            this.gridWidget.style(separatorBorderStyle);
            this.centeredLayoutWidget.styles(separatorBorderStyle);
        }
        createContentArea(parent, options) {
            // Container
            this.element = parent;
            this.container = document.createElement('div');
            this.container.classList.add('content');
            if (this.windowId !== window_1.mainWindow.vscodeWindowId) {
                this.container.classList.add('auxiliary');
            }
            parent.appendChild(this.container);
            // Scoped instantiation service
            const scopedContextKeyService = this._register(this.contextKeyService.createScoped(this.container));
            this.scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]));
            // Grid control
            this._willRestoreState = !options || options.restorePreviousState;
            this.doCreateGridControl();
            // Centered layout widget
            this.centeredLayoutWidget = this._register(new centeredViewLayout_1.CenteredViewLayout(this.container, this.gridWidgetView, this.profileMemento[EditorPart_1.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY], this._partOptions.centeredLayoutFixedWidth));
            this._register(this.onDidChangeEditorPartOptions(e => this.centeredLayoutWidget.setFixedWidth(e.newPartOptions.centeredLayoutFixedWidth ?? false)));
            // Drag & Drop support
            this.setupDragAndDropSupport(parent, this.container);
            // Context keys
            this.handleContextKeys(scopedContextKeyService);
            // Signal ready
            this.whenReadyPromise.complete();
            this._isReady = true;
            // Signal restored
            async_1.Promises.settled(this.groups.map(group => group.whenRestored)).finally(() => {
                this.whenRestoredPromise.complete();
            });
            return this.container;
        }
        handleContextKeys(contextKeyService) {
            const isAuxiliaryEditorPartContext = contextkeys_1.IsAuxiliaryEditorPartContext.bindTo(contextKeyService);
            isAuxiliaryEditorPartContext.set(this.windowId !== window_1.mainWindow.vscodeWindowId);
            const multipleEditorGroupsContext = contextkeys_1.EditorPartMultipleEditorGroupsContext.bindTo(contextKeyService);
            const maximizedEditorGroupContext = contextkeys_1.EditorPartMaximizedEditorGroupContext.bindTo(contextKeyService);
            const updateContextKeys = () => {
                const groupCount = this.count;
                if (groupCount > 1) {
                    multipleEditorGroupsContext.set(true);
                }
                else {
                    multipleEditorGroupsContext.reset();
                }
                if (this.hasMaximizedGroup()) {
                    maximizedEditorGroupContext.set(true);
                }
                else {
                    maximizedEditorGroupContext.reset();
                }
            };
            updateContextKeys();
            this._register(this.onDidAddGroup(() => updateContextKeys()));
            this._register(this.onDidRemoveGroup(() => updateContextKeys()));
            this._register(this.onDidChangeGroupMaximized(() => updateContextKeys()));
        }
        setupDragAndDropSupport(parent, container) {
            // Editor drop target
            this._register(this.createEditorDropTarget(container, Object.create(null)));
            // No drop in the editor
            const overlay = document.createElement('div');
            overlay.classList.add('drop-block-overlay');
            parent.appendChild(overlay);
            // Hide the block if a mouse down event occurs #99065
            this._register((0, dom_1.addDisposableGenericMouseDownListener)(overlay, () => overlay.classList.remove('visible')));
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(this.element, {
                onDragStart: e => overlay.classList.add('visible'),
                onDragEnd: e => overlay.classList.remove('visible')
            }));
            let horizontalOpenerTimeout;
            let verticalOpenerTimeout;
            let lastOpenHorizontalPosition;
            let lastOpenVerticalPosition;
            const openPartAtPosition = (position) => {
                if (!this.layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) && position === this.layoutService.getPanelPosition()) {
                    this.layoutService.setPartHidden(false, "workbench.parts.panel" /* Parts.PANEL_PART */);
                }
                else if (!this.layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) && position === (this.layoutService.getSideBarPosition() === 1 /* Position.RIGHT */ ? 0 /* Position.LEFT */ : 1 /* Position.RIGHT */)) {
                    this.layoutService.setPartHidden(false, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
                }
            };
            const clearAllTimeouts = () => {
                if (horizontalOpenerTimeout) {
                    clearTimeout(horizontalOpenerTimeout);
                    horizontalOpenerTimeout = undefined;
                }
                if (verticalOpenerTimeout) {
                    clearTimeout(verticalOpenerTimeout);
                    verticalOpenerTimeout = undefined;
                }
            };
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(overlay, {
                onDragOver: e => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    if (e.eventData.dataTransfer) {
                        e.eventData.dataTransfer.dropEffect = 'none';
                    }
                    const boundingRect = overlay.getBoundingClientRect();
                    let openHorizontalPosition = undefined;
                    let openVerticalPosition = undefined;
                    const proximity = 100;
                    if (e.eventData.clientX < boundingRect.left + proximity) {
                        openHorizontalPosition = 0 /* Position.LEFT */;
                    }
                    if (e.eventData.clientX > boundingRect.right - proximity) {
                        openHorizontalPosition = 1 /* Position.RIGHT */;
                    }
                    if (e.eventData.clientY > boundingRect.bottom - proximity) {
                        openVerticalPosition = 2 /* Position.BOTTOM */;
                    }
                    if (horizontalOpenerTimeout && openHorizontalPosition !== lastOpenHorizontalPosition) {
                        clearTimeout(horizontalOpenerTimeout);
                        horizontalOpenerTimeout = undefined;
                    }
                    if (verticalOpenerTimeout && openVerticalPosition !== lastOpenVerticalPosition) {
                        clearTimeout(verticalOpenerTimeout);
                        verticalOpenerTimeout = undefined;
                    }
                    if (!horizontalOpenerTimeout && openHorizontalPosition !== undefined) {
                        lastOpenHorizontalPosition = openHorizontalPosition;
                        horizontalOpenerTimeout = setTimeout(() => openPartAtPosition(openHorizontalPosition), 200);
                    }
                    if (!verticalOpenerTimeout && openVerticalPosition !== undefined) {
                        lastOpenVerticalPosition = openVerticalPosition;
                        verticalOpenerTimeout = setTimeout(() => openPartAtPosition(openVerticalPosition), 200);
                    }
                },
                onDragLeave: () => clearAllTimeouts(),
                onDragEnd: () => clearAllTimeouts(),
                onDrop: () => clearAllTimeouts()
            }));
        }
        centerLayout(active) {
            this.centeredLayoutWidget.activate(active);
            this._activeGroup.focus();
        }
        isLayoutCentered() {
            if (this.centeredLayoutWidget) {
                return this.centeredLayoutWidget.isActive();
            }
            return false;
        }
        doCreateGridControl() {
            // Grid Widget (with previous UI state)
            let restoreError = false;
            if (this._willRestoreState) {
                restoreError = !this.doCreateGridControlWithPreviousState();
            }
            // Grid Widget (no previous UI state or failed to restore)
            if (!this.gridWidget || restoreError) {
                const initialGroup = this.doCreateGroupView();
                this.doSetGridWidget(new grid_1.SerializableGrid(initialGroup));
                // Ensure a group is active
                this.doSetGroupActive(initialGroup);
            }
            // Update container
            this.updateContainer();
            // Notify group index change we created the entire grid
            this.notifyGroupIndexChange();
        }
        doCreateGridControlWithPreviousState() {
            const state = this.loadState();
            if (state?.serializedGrid) {
                try {
                    // MRU
                    this.mostRecentActiveGroups = state.mostRecentActiveGroups;
                    // Grid Widget
                    this.doCreateGridControlWithState(state.serializedGrid, state.activeGroup);
                }
                catch (error) {
                    // Log error
                    (0, errors_1.onUnexpectedError)(new Error(`Error restoring editor grid widget: ${error} (with state: ${JSON.stringify(state)})`));
                    // Clear any state we have from the failing restore
                    this.disposeGroups();
                    return false; // failure
                }
            }
            return true; // success
        }
        doCreateGridControlWithState(serializedGrid, activeGroupId, editorGroupViewsToReuse) {
            // Determine group views to reuse if any
            let reuseGroupViews;
            if (editorGroupViewsToReuse) {
                reuseGroupViews = editorGroupViewsToReuse.slice(0); // do not modify original array
            }
            else {
                reuseGroupViews = [];
            }
            // Create new
            const groupViews = [];
            const gridWidget = grid_1.SerializableGrid.deserialize(serializedGrid, {
                fromJSON: (serializedEditorGroup) => {
                    let groupView;
                    if (reuseGroupViews.length > 0) {
                        groupView = reuseGroupViews.shift();
                    }
                    else {
                        groupView = this.doCreateGroupView(serializedEditorGroup);
                    }
                    groupViews.push(groupView);
                    if (groupView.id === activeGroupId) {
                        this.doSetGroupActive(groupView);
                    }
                    return groupView;
                }
            }, { styles: { separatorBorder: this.gridSeparatorBorder } });
            // If the active group was not found when restoring the grid
            // make sure to make at least one group active. We always need
            // an active group.
            if (!this._activeGroup) {
                this.doSetGroupActive(groupViews[0]);
            }
            // Validate MRU group views matches grid widget state
            if (this.mostRecentActiveGroups.some(groupId => !this.getGroup(groupId))) {
                this.mostRecentActiveGroups = groupViews.map(group => group.id);
            }
            // Set it
            this.doSetGridWidget(gridWidget);
        }
        doSetGridWidget(gridWidget) {
            let boundarySashes = {};
            if (this.gridWidget) {
                boundarySashes = this.gridWidget.boundarySashes;
                this.gridWidget.dispose();
            }
            this.gridWidget = gridWidget;
            this.gridWidget.boundarySashes = boundarySashes;
            this.gridWidgetView.gridWidget = gridWidget;
            this._onDidChangeSizeConstraints.input = gridWidget.onDidChange;
            this._onDidScroll.input = gridWidget.onDidScroll;
            this.gridWidgetDisposables.clear();
            this.gridWidgetDisposables.add(gridWidget.onDidChangeViewMaximized(maximized => this._onDidChangeGroupMaximized.fire(maximized)));
            this._onDidChangeGroupMaximized.fire(this.hasMaximizedGroup());
            this.onDidSetGridWidget.fire(undefined);
        }
        updateContainer() {
            const container = (0, types_1.assertIsDefined)(this.container);
            container.classList.toggle('empty', this.isEmpty);
        }
        notifyGroupIndexChange() {
            this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */).forEach((group, index) => group.notifyIndexChanged(index));
        }
        notifyGroupsLabelChange(newLabel) {
            for (const group of this.groups) {
                group.notifyLabelChanged(newLabel);
            }
        }
        get isEmpty() {
            return this.count === 1 && this._activeGroup.isEmpty;
        }
        setBoundarySashes(sashes) {
            this.gridWidget.boundarySashes = sashes;
            this.centeredLayoutWidget.boundarySashes = sashes;
        }
        layout(width, height, top, left) {
            this.top = top;
            this.left = left;
            // Layout contents
            const contentAreaSize = super.layoutContents(width, height).contentSize;
            // Layout editor container
            this.doLayout(dom_1.Dimension.lift(contentAreaSize), top, left);
        }
        doLayout(dimension, top = this.top, left = this.left) {
            this._contentDimension = dimension;
            // Layout Grid
            this.centeredLayoutWidget.layout(this._contentDimension.width, this._contentDimension.height, top, left);
            // Event
            this._onDidLayout.fire(dimension);
        }
        saveState() {
            // Persist grid UI state
            if (this.gridWidget) {
                if (this.isEmpty) {
                    delete this.workspaceMemento[EditorPart_1.EDITOR_PART_UI_STATE_STORAGE_KEY];
                }
                else {
                    this.workspaceMemento[EditorPart_1.EDITOR_PART_UI_STATE_STORAGE_KEY] = this.createState();
                }
            }
            // Persist centered view state
            if (this.centeredLayoutWidget) {
                const centeredLayoutState = this.centeredLayoutWidget.state;
                if (this.centeredLayoutWidget.isDefault(centeredLayoutState)) {
                    delete this.profileMemento[EditorPart_1.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY];
                }
                else {
                    this.profileMemento[EditorPart_1.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY] = centeredLayoutState;
                }
            }
            super.saveState();
        }
        loadState() {
            return this.workspaceMemento[EditorPart_1.EDITOR_PART_UI_STATE_STORAGE_KEY];
        }
        createState() {
            return {
                serializedGrid: this.gridWidget.serialize(),
                activeGroup: this._activeGroup.id,
                mostRecentActiveGroups: this.mostRecentActiveGroups
            };
        }
        applyState(state) {
            if (state === 'empty') {
                return this.doApplyEmptyState();
            }
            else {
                return this.doApplyState(state);
            }
        }
        async doApplyState(state) {
            const groups = await this.doPrepareApplyState();
            const resumeEvents = this.disposeGroups(true /* suspress events for the duration of applying state */);
            // MRU
            this.mostRecentActiveGroups = state.mostRecentActiveGroups;
            // Grid Widget
            try {
                this.doApplyGridState(state.serializedGrid, state.activeGroup);
            }
            finally {
                resumeEvents();
            }
            // Restore editors that were not closed before and are now opened now
            await this.activeGroup.openEditors(groups
                .flatMap(group => group.editors)
                .filter(editor => this.editorPartsView.groups.every(groupView => !groupView.contains(editor)))
                .map(editor => ({
                editor, options: { pinned: true, preserveFocus: true, inactive: true }
            })));
        }
        async doApplyEmptyState() {
            await this.doPrepareApplyState();
            this.mergeAllGroups(this.activeGroup);
        }
        async doPrepareApplyState() {
            // Before disposing groups, try to close as many editors as
            // possible, but skip over those that would trigger a dialog
            // (for example when being dirty). This is to be able to later
            // restore these editors after state has been applied.
            const groups = this.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            for (const group of groups) {
                await group.closeAllEditors({ excludeConfirming: true });
            }
            return groups;
        }
        doApplyGridState(gridState, activeGroupId, editorGroupViewsToReuse) {
            // Recreate grid widget from state
            this.doCreateGridControlWithState(gridState, activeGroupId, editorGroupViewsToReuse);
            // Layout
            this.doLayout(this._contentDimension);
            // Update container
            this.updateContainer();
            // Events for groups that got added
            for (const groupView of this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)) {
                if (!editorGroupViewsToReuse?.includes(groupView)) {
                    this._onDidAddGroup.fire(groupView);
                }
            }
            // Notify group index change given layout has changed
            this.notifyGroupIndexChange();
        }
        onDidChangeMementoState(e) {
            if (e.external && e.scope === 1 /* StorageScope.WORKSPACE */) {
                this.reloadMemento(e.scope);
                const state = this.loadState();
                if (state) {
                    this.applyState(state);
                }
            }
        }
        toJSON() {
            return {
                type: "workbench.parts.editor" /* Parts.EDITOR_PART */
            };
        }
        disposeGroups(surpressEvents) {
            if (surpressEvents) {
                this._onDidRemoveGroup.pause();
            }
            for (const group of this.groups) {
                group.dispose();
                this._onDidRemoveGroup.fire(group);
            }
            this.groupViews.clear();
            this.mostRecentActiveGroups = [];
            if (surpressEvents) {
                return () => this._onDidRemoveGroup.resume();
            }
        }
        dispose() {
            // Forward to all groups
            this.disposeGroups();
            // Grid widget
            this.gridWidget?.dispose();
            super.dispose();
        }
    };
    exports.EditorPart = EditorPart;
    exports.EditorPart = EditorPart = EditorPart_1 = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, storage_1.IStorageService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, host_1.IHostService),
        __param(10, contextkey_1.IContextKeyService)
    ], EditorPart);
    let MainEditorPart = class MainEditorPart extends EditorPart {
        constructor(editorPartsView, instantiationService, themeService, configurationService, storageService, layoutService, hostService, contextKeyService) {
            super(editorPartsView, "workbench.parts.editor" /* Parts.EDITOR_PART */, '', window_1.mainWindow.vscodeWindowId, instantiationService, themeService, configurationService, storageService, layoutService, hostService, contextKeyService);
        }
    };
    exports.MainEditorPart = MainEditorPart;
    exports.MainEditorPart = MainEditorPart = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, storage_1.IStorageService),
        __param(5, layoutService_1.IWorkbenchLayoutService),
        __param(6, host_1.IHostService),
        __param(7, contextkey_1.IContextKeyService)
    ], MainEditorPart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwQ2hHLE1BQU0sY0FBYztRQUFwQjtZQUVVLFlBQU8sR0FBZ0IsSUFBQSxPQUFDLEVBQUMsc0JBQXNCLENBQUMsQ0FBQztZQU9sRCxpQkFBWSxHQUFHLElBQUksYUFBSyxFQUFpRCxDQUFDO1lBQ3pFLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7UUE0QmhELENBQUM7UUFsQ0EsSUFBSSxZQUFZLEtBQWEsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RixJQUFJLFlBQVksS0FBYSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQ2hILElBQUksYUFBYSxLQUFhLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0YsSUFBSSxhQUFhLEtBQWEsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztRQU9sSCxJQUFJLFVBQVU7WUFD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