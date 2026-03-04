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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/labels", "vs/workbench/common/editor", "vs/workbench/browser/editor", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/workbench/browser/labels", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/editor/editorTabsControl", "vs/platform/quickinput/common/quickInput", "vs/base/common/lifecycle", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/map", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/dnd", "vs/platform/notification/common/notification", "vs/base/browser/dom", "vs/nls", "vs/workbench/browser/parts/editor/editorActions", "vs/base/common/types", "vs/workbench/services/editor/common/editorService", "vs/base/common/resources", "vs/base/common/async", "vs/workbench/services/path/common/pathService", "vs/base/common/path", "vs/base/common/arrays", "vs/platform/theme/common/theme", "vs/base/browser/browser", "vs/base/common/objects", "vs/platform/editor/common/editor", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/browser/mouseEvent", "vs/editor/common/services/treeViewsDndService", "vs/editor/common/services/treeViewsDnd", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/common/editor/filteredEditorGroupModel", "vs/workbench/services/host/browser/host", "vs/css!./media/multieditortabscontrol"], function (require, exports, platform_1, labels_1, editor_1, editor_2, keyboardEvent_1, touch_1, labels_2, actionbar_1, contextView_1, instantiation_1, keybinding_1, contextkey_1, actions_1, editorTabsControl_1, quickInput_1, lifecycle_1, scrollableElement_1, map_1, themeService_1, theme_1, colorRegistry_1, dnd_1, notification_1, dom_1, nls_1, editorActions_1, types_1, editorService_1, resources_1, async_1, pathService_1, path_1, arrays_1, theme_2, browser_1, objects_1, editor_3, editorCommands_1, mouseEvent_1, treeViewsDndService_1, treeViewsDnd_1, editorResolverService_1, filteredEditorGroupModel_1, host_1) {
    "use strict";
    var MultiEditorTabsControl_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiEditorTabsControl = void 0;
    let MultiEditorTabsControl = class MultiEditorTabsControl extends editorTabsControl_1.EditorTabsControl {
        static { MultiEditorTabsControl_1 = this; }
        static { this.SCROLLBAR_SIZES = {
            default: 3,
            large: 10
        }; }
        static { this.TAB_WIDTH = {
            compact: 38,
            shrink: 80,
            fit: 120
        }; }
        static { this.DRAG_OVER_OPEN_TAB_THRESHOLD = 1500; }
        static { this.MOUSE_WHEEL_EVENT_THRESHOLD = 150; }
        static { this.MOUSE_WHEEL_DISTANCE_THRESHOLD = 1.5; }
        constructor(parent, editorPartsView, groupsView, groupView, tabsModel, contextMenuService, instantiationService, contextKeyService, keybindingService, notificationService, quickInputService, themeService, editorService, pathService, treeViewsDragAndDropService, editorResolverService, hostService) {
            super(parent, editorPartsView, groupsView, groupView, tabsModel, contextMenuService, instantiationService, contextKeyService, keybindingService, notificationService, quickInputService, themeService, editorResolverService, hostService);
            this.editorService = editorService;
            this.pathService = pathService;
            this.treeViewsDragAndDropService = treeViewsDragAndDropService;
            this.closeEditorAction = this._register(this.instantiationService.createInstance(editorActions_1.CloseOneEditorAction, editorActions_1.CloseOneEditorAction.ID, editorActions_1.CloseOneEditorAction.LABEL));
            this.unpinEditorAction = this._register(this.instantiationService.createInstance(editorActions_1.UnpinEditorAction, editorActions_1.UnpinEditorAction.ID, editorActions_1.UnpinEditorAction.LABEL));
            this.tabResourceLabels = this._register(this.instantiationService.createInstance(labels_2.ResourceLabels, labels_2.DEFAULT_LABELS_CONTAINER));
            this.tabLabels = [];
            this.tabActionBars = [];
            this.tabDisposables = [];
            this.dimensions = {
                container: dom_1.Dimension.None,
                available: dom_1.Dimension.None
            };
            this.layoutScheduler = this._register(new lifecycle_1.MutableDisposable());
            this.path = platform_1.isWindows ? path_1.win32 : path_1.posix;
            this.lastMouseWheelEventTime = 0;
            this.isMouseOverTabs = false;
            this.updateEditorLabelScheduler = this._register(new async_1.RunOnceScheduler(() => this.doUpdateEditorLabels(), 0));
            // Resolve the correct path library for the OS we are on
            // If we are connected to remote, this accounts for the
            // remote OS.
            (async () => this.path = await this.pathService.path)();
            // React to decorations changing for our resource labels
            this._register(this.tabResourceLabels.onDidChangeDecorations(() => this.doHandleDecorationsChange()));
        }
        create(parent) {
            super.create(parent);
            this.titleContainer = parent;
            // Tabs and Actions Container (are on a single row with flex side-by-side)
            this.tabsAndActionsContainer = document.createElement('div');
            this.tabsAndActionsContainer.classList.add('tabs-and-actions-container');
            this.titleContainer.appendChild(this.tabsAndActionsContainer);
            // Tabs Container
            this.tabsContainer = document.createElement('div');
            this.tabsContainer.setAttribute('role', 'tablist');
            this.tabsContainer.draggable = true;
            this.tabsContainer.classList.add('tabs-container');
            this._register(touch_1.Gesture.addTarget(this.tabsContainer));
            this.tabSizingFixedDisposables = this._register(new lifecycle_1.DisposableStore());
            this.updateTabSizing(false);
            // Tabs Scrollbar
            this.tabsScrollbar = this.createTabsScrollbar(this.tabsContainer);
            this.tabsAndActionsContainer.appendChild(this.tabsScrollbar.getDomNode());
            // Tabs Container listeners
            this.registerTabsContainerListeners(this.tabsContainer, this.tabsScrollbar);
            // Create Editor Toolbar
            this.createEditorActionsToolBar(this.tabsAndActionsContainer, ['editor-actions']);
            // Set tabs control visibility
            this.updateTabsControlVisibility();
        }
        createTabsScrollbar(scrollable) {
            const tabsScrollbar = this._register(new scrollableElement_1.ScrollableElement(scrollable, {
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                horizontalScrollbarSize: this.getTabsScrollbarSizing(),
                vertical: 2 /* ScrollbarVisibility.Hidden */,
                scrollYToX: true,
                useShadows: false
            }));
            this._register(tabsScrollbar.onScroll(e => {
                if (e.scrollLeftChanged) {
                    scrollable.scrollLeft = e.scrollLeft;
                }
            }));
            return tabsScrollbar;
        }
        updateTabsScrollbarSizing() {
            this.tabsScrollbar?.updateOptions({
                horizontalScrollbarSize: this.getTabsScrollbarSizing()
            });
        }
        updateTabSizing(fromEvent) {
            const [tabsContainer, tabSizingFixedDisposables] = (0, types_1.assertAllDefined)(this.tabsContainer, this.tabSizingFixedDisposables);
            tabSizingFixedDisposables.clear();
            const options = this.groupsView.partOptions;
            if (options.tabSizing === 'fixed') {
                tabsContainer.style.setProperty('--tab-sizing-fixed-min-width', `${options.tabSizingFixedMinWidth}px`);
                tabsContainer.style.setProperty('--tab-sizing-fixed-max-width', `${options.tabSizingFixedMaxWidth}px`);
                // For https://github.com/microsoft/vscode/issues/40290 we want to
                // preserve the current tab widths as long as the mouse is over the
                // tabs so that you can quickly close them via mouse click. For that
                // we track mouse movements over the tabs container.
                tabSizingFixedDisposables.add((0, dom_1.addDisposableListener)(tabsContainer, dom_1.EventType.MOUSE_ENTER, () => {
                    this.isMouseOverTabs = true;
                }));
                tabSizingFixedDisposables.add((0, dom_1.addDisposableListener)(tabsContainer, dom_1.EventType.MOUSE_LEAVE, () => {
                    this.isMouseOverTabs = false;
                    this.updateTabsFixedWidth(false);
                }));
            }
            else if (fromEvent) {
                tabsContainer.style.removeProperty('--tab-sizing-fixed-min-width');
                tabsContainer.style.removeProperty('--tab-sizing-fixed-max-width');
                this.updateTabsFixedWidth(false);
            }
        }
        updateTabsFixedWidth(fixed) {
            this.forEachTab((editor, tabIndex, tabContainer) => {
                if (fixed) {
                    const { width } = tabContainer.getBoundingClientRect();
                    tabContainer.style.setProperty('--tab-sizing-current-width', `${width}px`);
                }
                else {
                    tabContainer.style.removeProperty('--tab-sizing-current-width');
                }
            });
        }
        getTabsScrollbarSizing() {
            if (this.groupsView.partOptions.titleScrollbarSizing !== 'large') {
                return MultiEditorTabsControl_1.SCROLLBAR_SIZES.default;
            }
            return MultiEditorTabsControl_1.SCROLLBAR_SIZES.large;
        }
        registerTabsContainerListeners(tabsContainer, tabsScrollbar) {
            // Forward scrolling inside the container to our custom scrollbar
            this._register((0, dom_1.addDisposableListener)(tabsContainer, dom_1.EventType.SCROLL, () => {
                if (tabsContainer.classList.contains('scroll')) {
                    tabsScrollbar.setScrollPosition({
                        scrollLeft: tabsContainer.scrollLeft // during DND the container gets scrolled so we need to update the custom scrollbar
                    });
                }
            }));
            // New file when double-clicking on tabs container (but not tabs)
            for (const eventType of [touch_1.EventType.Tap, dom_1.EventType.DBLCLICK]) {
                this._register((0, dom_1.addDisposableListener)(tabsContainer, eventType, (e) => {
                    if (eventType === dom_1.EventType.DBLCLICK) {
                        if (e.target !== tabsContainer) {
                            return; // ignore if target is not tabs container
                        }
                    }
                    else {
                        if (e.tapCount !== 2) {
                            return; // ignore single taps
                        }
                        if (e.initialTarget !== tabsContainer) {
                            return; // ignore if target is not tabs container
                        }
                    }
                    dom_1.EventHelper.stop(e);
                    this.editorService.openEditor({
                        resource: undefined,
                        options: {
                            pinned: true,
                            index: this.groupView.count, // always at the end
                            override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id
                        }
                    }, this.groupView.id);
                }));
            }
            // Prevent auto-scrolling (https://github.com/microsoft/vscode/issues/16690)
            this._register((0, dom_1.addDisposableListener)(tabsContainer, dom_1.EventType.MOUSE_DOWN, e => {
                if (e.button === 1) {
                    e.preventDefault();
                }
            }));
            // Drag & Drop support
            let lastDragEvent = undefined;
            let isNewWindowOperation = false;
            this._register(new dom_1.DragAndDropObserver(tabsContainer, {
                onDragStart: e => {
                    isNewWindowOperation = this.onGroupDragStart(e, tabsContainer);
                },
                onDrag: e => {
                    lastDragEvent = e;
                },
                onDragEnter: e => {
                    // Always enable support to scroll while dragging
                    tabsContainer.classList.add('scroll');
                    // Return if the target is not on the tabs container
                    if (e.target !== tabsContainer) {
                        return;
                    }
                    // Return if transfer is unsupported
                    if (!this.isSupportedDropTransfer(e)) {
                        if (e.dataTransfer) {
                            e.dataTransfer.dropEffect = 'none';
                        }
                        return;
                    }
                    // Update the dropEffect to "copy" if there is no local data to be dragged because
                    // in that case we can only copy the data into and not move it from its source
                    if (!this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                        if (e.dataTransfer) {
                            e.dataTransfer.dropEffect = 'copy';
                        }
                    }
                    this.updateDropFeedback(tabsContainer, true, e);
                },
                onDragLeave: e => {
                    this.updateDropFeedback(tabsContainer, false, e);
                    tabsContainer.classList.remove('scroll');
                },
                onDragEnd: e => {
                    this.updateDropFeedback(tabsContainer, false, e);
                    tabsContainer.classList.remove('scroll');
                    this.onGroupDragEnd(e, lastDragEvent, tabsContainer, isNewWindowOperation);
                },
                onDrop: e => {
                    this.updateDropFeedback(tabsContainer, false, e);
                    tabsContainer.classList.remove('scroll');
                    if (e.target === tabsContainer) {
                        const isGroupTransfer = this.groupTransfer.hasData(dnd_1.DraggedEditorGroupIdentifier.prototype);
                        this.onDrop(e, isGroupTransfer ? this.groupView.count : this.tabsModel.count, tabsContainer);
                    }
                }
            }));
            // Mouse-wheel support to switch to tabs optionally
            this._register((0, dom_1.addDisposableListener)(tabsContainer, dom_1.EventType.MOUSE_WHEEL, (e) => {
                const activeEditor = this.groupView.activeEditor;
                if (!activeEditor || this.groupView.count < 2) {
                    return; // need at least 2 open editors
                }
                // Shift-key enables or disables this behaviour depending on the setting
                if (this.groupsView.partOptions.scrollToSwitchTabs === true) {
                    if (e.shiftKey) {
                        return; // 'on': only enable this when Shift-key is not pressed
                    }
                }
                else {
                    if (!e.shiftKey) {
                        return; // 'off': only enable this when Shift-key is pressed
                    }
                }
                // Ignore event if the last one happened too recently (https://github.com/microsoft/vscode/issues/96409)
                // The restriction is relaxed according to the absolute value of `deltaX` and `deltaY`
                // to support discrete (mouse wheel) and contiguous scrolling (touchpad) equally well
                const now = Date.now();
                if (now - this.lastMouseWheelEventTime < MultiEditorTabsControl_1.MOUSE_WHEEL_EVENT_THRESHOLD - 2 * (Math.abs(e.deltaX) + Math.abs(e.deltaY))) {
                    return;
                }
                this.lastMouseWheelEventTime = now;
                // Figure out scrolling direction but ignore it if too subtle
                let tabSwitchDirection;
                if (e.deltaX + e.deltaY < -MultiEditorTabsControl_1.MOUSE_WHEEL_DISTANCE_THRESHOLD) {
                    tabSwitchDirection = -1;
                }
                else if (e.deltaX + e.deltaY > MultiEditorTabsControl_1.MOUSE_WHEEL_DISTANCE_THRESHOLD) {
                    tabSwitchDirection = 1;
                }
                else {
                    return;
                }
                const nextEditor = this.groupView.getEditorByIndex(this.groupView.getIndexOfEditor(activeEditor) + tabSwitchDirection);
                if (!nextEditor) {
                    return;
                }
                // Open it
                this.groupView.openEditor(nextEditor);
                // Disable normal scrolling, opening the editor will already reveal it properly
                dom_1.EventHelper.stop(e, true);
            }));
            // Context menu
            const showContextMenu = (e) => {
                dom_1.EventHelper.stop(e);
                // Find target anchor
                let anchor = tabsContainer;
                if ((0, dom_1.isMouseEvent)(e)) {
                    anchor = new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.parent), e);
                }
                // Show it
                this.contextMenuService.showContextMenu({
                    getAnchor: () => anchor,
                    menuId: actions_1.MenuId.EditorTabsBarContext,
                    contextKeyService: this.contextKeyService,
                    menuActionOptions: { shouldForwardArgs: true },
                    getActionsContext: () => ({ groupId: this.groupView.id }),
                    getKeyBinding: action => this.getKeybinding(action),
                    onHide: () => this.groupView.focus()
                });
            };
            this._register((0, dom_1.addDisposableListener)(tabsContainer, touch_1.EventType.Contextmenu, e => showContextMenu(e)));
            this._register((0, dom_1.addDisposableListener)(tabsContainer, dom_1.EventType.CONTEXT_MENU, e => showContextMenu(e)));
        }
        doHandleDecorationsChange() {
            // A change to decorations potentially has an impact on the size of tabs
            // so we need to trigger a layout in that case to adjust things
            this.layout(this.dimensions);
        }
        updateEditorActionsToolbar() {
            super.updateEditorActionsToolbar();
            // Changing the actions in the toolbar can have an impact on the size of the
            // tab container, so we need to layout the tabs to make sure the active is visible
            this.layout(this.dimensions);
        }
        openEditor(editor, options) {
            const changed = this.handleOpenedEditors();
            // Respect option to focus tab control if provided
            if (options?.focusTabControl) {
                this.withTab(editor, (editor, tabIndex, tabContainer) => tabContainer.focus());
            }
            return changed;
        }
        openEditors(editors) {
            return this.handleOpenedEditors();
        }
        handleOpenedEditors() {
            // Set tabs control visibility
            this.updateTabsControlVisibility();
            // Create tabs as needed
            const [tabsContainer, tabsScrollbar] = (0, types_1.assertAllDefined)(this.tabsContainer, this.tabsScrollbar);
            for (let i = tabsContainer.children.length; i < this.tabsModel.count; i++) {
                tabsContainer.appendChild(this.createTab(i, tabsContainer, tabsScrollbar));
            }
            // Make sure to recompute tab labels and detect
            // if a label change occurred that requires a
            // redraw of tabs.
            const activeEditorChanged = this.didActiveEditorChange();
            const oldActiveTabLabel = this.activeTabLabel;
            const oldTabLabelsLength = this.tabLabels.length;
            this.computeTabLabels();
            // Redraw and update in these cases
            let didChange = false;
            if (activeEditorChanged || // active editor changed
                oldTabLabelsLength !== this.tabLabels.length || // number of tabs changed
                !this.equalsEditorInputLabel(oldActiveTabLabel, this.activeTabLabel) // active editor label changed
            ) {
                this.redraw({ forceRevealActiveTab: true });
                didChange = true;
            }
            // Otherwise only layout for revealing
            else {
                this.layout(this.dimensions, { forceRevealActiveTab: true });
            }
            return didChange;
        }
        didActiveEditorChange() {
            if (!this.activeTabLabel?.editor && this.tabsModel.activeEditor || // active editor changed from null => editor
                this.activeTabLabel?.editor && !this.tabsModel.activeEditor || // active editor changed from editor => null
                (!this.activeTabLabel?.editor || !this.tabsModel.isActive(this.activeTabLabel.editor)) // active editor changed from editorA => editorB
            ) {
                return true;
            }
            return false;
        }
        equalsEditorInputLabel(labelA, labelB) {
            if (labelA === labelB) {
                return true;
            }
            if (!labelA || !labelB) {
                return false;
            }
            return labelA.name === labelB.name &&
                labelA.description === labelB.description &&
                labelA.forceDescription === labelB.forceDescription &&
                labelA.title === labelB.title &&
                labelA.ariaLabel === labelB.ariaLabel;
        }
        beforeCloseEditor(editor) {
            // Fix tabs width if the mouse is over tabs and before closing
            // a tab (except the last tab) when tab sizing is 'fixed'.
            // This helps keeping the close button stable under
            // the mouse and allows for rapid closing of tabs.
            if (this.isMouseOverTabs && this.groupsView.partOptions.tabSizing === 'fixed') {
                const closingLastTab = this.tabsModel.isLast(editor);
                this.updateTabsFixedWidth(!closingLastTab);
            }
        }
        closeEditor(editor) {
            this.handleClosedEditors();
        }
        closeEditors(editors) {
            this.handleClosedEditors();
        }
        handleClosedEditors() {
            // There are tabs to show
            if (this.tabsModel.count) {
                // Remove tabs that got closed
                const tabsContainer = (0, types_1.assertIsDefined)(this.tabsContainer);
                while (tabsContainer.children.length > this.tabsModel.count) {
                    // Remove one tab from container (must be the last to keep indexes in order!)
                    tabsContainer.lastChild?.remove();
                    // Remove associated tab label and widget
                    (0, lifecycle_1.dispose)(this.tabDisposables.pop());
                }
                // A removal of a label requires to recompute all labels
                this.computeTabLabels();
                // Redraw all tabs
                this.redraw({ forceRevealActiveTab: true });
            }
            // No tabs to show
            else {
                if (this.tabsContainer) {
                    (0, dom_1.clearNode)(this.tabsContainer);
                }
                this.tabDisposables = (0, lifecycle_1.dispose)(this.tabDisposables);
                this.tabResourceLabels.clear();
                this.tabLabels = [];
                this.activeTabLabel = undefined;
                this.tabActionBars = [];
                this.clearEditorActionsToolbar();
                this.updateTabsControlVisibility();
            }
        }
        moveEditor(editor, fromTabIndex, targeTabIndex) {
            // Move the editor label
            const editorLabel = this.tabLabels[fromTabIndex];
            this.tabLabels.splice(fromTabIndex, 1);
            this.tabLabels.splice(targeTabIndex, 0, editorLabel);
            // Redraw tabs in the range of the move
            this.forEachTab((editor, tabIndex, tabContainer, tabLabelWidget, tabLabel, tabActionBar) => {
                this.redrawTab(editor, tabIndex, tabContainer, tabLabelWidget, tabLabel, tabActionBar);
            }, Math.min(fromTabIndex, targeTabIndex), // from: smallest of fromTabIndex/targeTabIndex
            Math.max(fromTabIndex, targeTabIndex) //   to: largest of fromTabIndex/targeTabIndex
            );
            // Moving an editor requires a layout to keep the active editor visible
            this.layout(this.dimensions, { forceRevealActiveTab: true });
        }
        pinEditor(editor) {
            this.withTab(editor, (editor, tabIndex, tabContainer, tabLabelWidget, tabLabel) => this.redrawTabLabel(editor, tabIndex, tabContainer, tabLabelWidget, tabLabel));
        }
        stickEditor(editor) {
            this.doHandleStickyEditorChange(editor);
        }
        unstickEditor(editor) {
            this.doHandleStickyEditorChange(editor);
        }
        doHandleStickyEditorChange(editor) {
            // Update tab
            this.withTab(editor, (editor, tabIndex, tabContainer, tabLabelWidget, tabLabel, tabActionBar) => this.redrawTab(editor, tabIndex, tabContainer, tabLabelWidget, tabLabel, tabActionBar));
            // Sticky change has an impact on each tab's border because
            // it potentially moves the border to the last pinned tab
            this.forEachTab((editor, tabIndex, tabContainer, tabLabelWidget, tabLabel) => {
                this.redrawTabBorders(tabIndex, tabContainer);
            });
            // A change to the sticky state requires a layout to keep the active editor visible
            this.layout(this.dimensions, { forceRevealActiveTab: true });
        }
        setActive(isGroupActive) {
            // Activity has an impact on each tab's active indication
            this.forEachTab((editor, tabIndex, tabContainer, tabLabelWidget, tabLabel, tabActionBar) => {
                this.redrawTabActiveAndDirty(isGroupActive, editor, tabContainer, tabActionBar);
            });
            // Activity has an impact on the toolbar, so we need to update and layout
            this.updateEditorActionsToolbar();
            this.layout(this.dimensions, { forceRevealActiveTab: true });
        }
        updateEditorLabel(editor) {
            // Update all labels to account for changes to tab labels
            // Since this method may be called a lot of times from
            // individual editors, we collect all those requests and
            // then run the update once because we have to update
            // all opened tabs in the group at once.
            this.updateEditorLabelScheduler.schedule();
        }
        doUpdateEditorLabels() {
            // A change to a label requires to recompute all labels
            this.computeTabLabels();
            // As such we need to redraw each label
            this.forEachTab((editor, tabIndex, tabContainer, tabLabelWidget, tabLabel) => {
                this.redrawTabLabel(editor, tabIndex, tabContainer, tabLabelWidget, tabLabel);
            });
            // A change to a label requires a layout to keep the active editor visible
            this.layout(this.dimensions);
        }
        updateEditorDirty(editor) {
            this.withTab(editor, (editor, tabIndex, tabContainer, tabLabelWidget, tabLabel, tabActionBar) => this.redrawTabActiveAndDirty(this.groupsView.activeGroup === this.groupView, editor, tabContainer, tabActionBar));
        }
        updateOptions(oldOptions, newOptions) {
            super.updateOptions(oldOptions, newOptions);
            // A change to a label format options requires to recompute all labels
            if (oldOptions.labelFormat !== newOptions.labelFormat) {
                this.computeTabLabels();
            }
            // Update tabs scrollbar sizing
            if (oldOptions.titleScrollbarSizing !== newOptions.titleScrollbarSizing) {
                this.updateTabsScrollbarSizing();
            }
            // Update tabs sizing
            if (oldOptions.tabSizingFixedMinWidth !== newOptions.tabSizingFixedMinWidth ||
                oldOptions.tabSizingFixedMaxWidth !== newOptions.tabSizingFixedMaxWidth ||
                oldOptions.tabSizing !== newOptions.tabSizing) {
                this.updateTabSizing(true);
            }
            // Redraw tabs when other options change
            if (oldOptions.labelFormat !== newOptions.labelFormat ||
                oldOptions.tabActionLocation !== newOptions.tabActionLocation ||
                oldOptions.tabActionCloseVisibility !== newOptions.tabActionCloseVisibility ||
                oldOptions.tabActionUnpinVisibility !== newOptions.tabActionUnpinVisibility ||
                oldOptions.tabSizing !== newOptions.tabSizing ||
                oldOptions.pinnedTabSizing !== newOptions.pinnedTabSizing ||
                oldOptions.showIcons !== newOptions.showIcons ||
                oldOptions.hasIcons !== newOptions.hasIcons ||
                oldOptions.highlightModifiedTabs !== newOptions.highlightModifiedTabs ||
                oldOptions.wrapTabs !== newOptions.wrapTabs ||
                !(0, objects_1.equals)(oldOptions.decorations, newOptions.decorations)) {
                this.redraw();
            }
        }
        updateStyles() {
            this.redraw();
        }
        forEachTab(fn, fromTabIndex, toTabIndex) {
            this.tabsModel.getEditors(1 /* EditorsOrder.SEQUENTIAL */).forEach((editor, tabIndex) => {
                if (typeof fromTabIndex === 'number' && fromTabIndex > tabIndex) {
                    return; // do nothing if we are not yet at `fromIndex`
                }
                if (typeof toTabIndex === 'number' && toTabIndex < tabIndex) {
                    return; // do nothing if we are beyond `toIndex`
                }
                this.doWithTab(tabIndex, editor, fn);
            });
        }
        withTab(editor, fn) {
            this.doWithTab(this.tabsModel.indexOf(editor), editor, fn);
        }
        doWithTab(tabIndex, editor, fn) {
            const tabsContainer = (0, types_1.assertIsDefined)(this.tabsContainer);
            const tabContainer = tabsContainer.children[tabIndex];
            const tabResourceLabel = this.tabResourceLabels.get(tabIndex);
            const tabLabel = this.tabLabels[tabIndex];
            const tabActionBar = this.tabActionBars[tabIndex];
            if (tabContainer && tabResourceLabel && tabLabel) {
                fn(editor, tabIndex, tabContainer, tabResourceLabel, tabLabel, tabActionBar);
            }
        }
        createTab(tabIndex, tabsContainer, tabsScrollbar) {
            // Tab Container
            const tabContainer = document.createElement('div');
            tabContainer.draggable = true;
            tabContainer.setAttribute('role', 'tab');
            tabContainer.classList.add('tab');
            // Gesture Support
            this._register(touch_1.Gesture.addTarget(tabContainer));
            // Tab Border Top
            const tabBorderTopContainer = document.createElement('div');
            tabBorderTopContainer.classList.add('tab-border-top-container');
            tabContainer.appendChild(tabBorderTopContainer);
            // Tab Editor Label
            const editorLabel = this.tabResourceLabels.create(tabContainer, { hoverDelegate: this.getHoverDelegate() });
            // Tab Actions
            const tabActionsContainer = document.createElement('div');
            tabActionsContainer.classList.add('tab-actions');
            tabContainer.appendChild(tabActionsContainer);
            const that = this;
            const tabActionRunner = new editorTabsControl_1.EditorCommandsContextActionRunner({
                groupId: this.groupView.id,
                get editorIndex() { return that.toEditorIndex(tabIndex); }
            });
            const tabActionBar = new actionbar_1.ActionBar(tabActionsContainer, { ariaLabel: (0, nls_1.localize)('ariaLabelTabActions', "Tab actions"), actionRunner: tabActionRunner });
            const tabActionListener = tabActionBar.onWillRun(e => {
                if (e.action.id === this.closeEditorAction.id) {
                    this.blockRevealActiveTabOnce();
                }
            });
            const tabActionBarDisposable = (0, lifecycle_1.combinedDisposable)(tabActionBar, tabActionListener, (0, lifecycle_1.toDisposable)((0, arrays_1.insert)(this.tabActionBars, tabActionBar)));
            // Tab Fade Hider
            // Hides the tab fade to the right when tab action left and sizing shrink/fixed, ::after, ::before are already used
            const tabShadowHider = document.createElement('div');
            tabShadowHider.classList.add('tab-fade-hider');
            tabContainer.appendChild(tabShadowHider);
            // Tab Border Bottom
            const tabBorderBottomContainer = document.createElement('div');
            tabBorderBottomContainer.classList.add('tab-border-bottom-container');
            tabContainer.appendChild(tabBorderBottomContainer);
            // Eventing
            const eventsDisposable = this.registerTabListeners(tabContainer, tabIndex, tabsContainer, tabsScrollbar);
            this.tabDisposables.push((0, lifecycle_1.combinedDisposable)(eventsDisposable, tabActionBarDisposable, tabActionRunner, editorLabel));
            return tabContainer;
        }
        toEditorIndex(tabIndex) {
            // Given a `tabIndex` that is relative to the tabs model
            // returns the `editorIndex` relative to the entire group
            const editor = (0, types_1.assertIsDefined)(this.tabsModel.getEditorByIndex(tabIndex));
            return this.groupView.getIndexOfEditor(editor);
        }
        registerTabListeners(tab, tabIndex, tabsContainer, tabsScrollbar) {
            const disposables = new lifecycle_1.DisposableStore();
            const handleClickOrTouch = (e, preserveFocus) => {
                tab.blur(); // prevent flicker of focus outline on tab until editor got focus
                if ((0, dom_1.isMouseEvent)(e) && (e.button !== 0 /* middle/right mouse button */ || (platform_1.isMacintosh && e.ctrlKey /* macOS context menu */))) {
                    if (e.button === 1) {
                        e.preventDefault(); // required to prevent auto-scrolling (https://github.com/microsoft/vscode/issues/16690)
                    }
                    return undefined;
                }
                if (this.originatesFromTabActionBar(e)) {
                    return; // not when clicking on actions
                }
                // Open tabs editor
                const editor = this.tabsModel.getEditorByIndex(tabIndex);
                if (editor) {
                    // Even if focus is preserved make sure to activate the group.
                    this.groupView.openEditor(editor, { preserveFocus, activation: editor_3.EditorActivation.ACTIVATE });
                }
                return undefined;
            };
            const showContextMenu = (e) => {
                dom_1.EventHelper.stop(e);
                const editor = this.tabsModel.getEditorByIndex(tabIndex);
                if (editor) {
                    this.onTabContextMenu(editor, e, tab);
                }
            };
            // Open on Click / Touch
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.MOUSE_DOWN, e => handleClickOrTouch(e, false)));
            disposables.add((0, dom_1.addDisposableListener)(tab, touch_1.EventType.Tap, (e) => handleClickOrTouch(e, true))); // Preserve focus on touch #125470
            // Touch Scroll Support
            disposables.add((0, dom_1.addDisposableListener)(tab, touch_1.EventType.Change, (e) => {
                tabsScrollbar.setScrollPosition({ scrollLeft: tabsScrollbar.getScrollPosition().scrollLeft - e.translationX });
            }));
            // Prevent flicker of focus outline on tab until editor got focus
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.MOUSE_UP, e => {
                dom_1.EventHelper.stop(e);
                tab.blur();
            }));
            // Close on mouse middle click
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.AUXCLICK, e => {
                if (e.button === 1 /* Middle Button*/) {
                    dom_1.EventHelper.stop(e, true /* for https://github.com/microsoft/vscode/issues/56715 */);
                    const editor = this.tabsModel.getEditorByIndex(tabIndex);
                    if (editor) {
                        if ((0, editor_1.preventEditorClose)(this.tabsModel, editor, editor_1.EditorCloseMethod.MOUSE, this.groupsView.partOptions)) {
                            return;
                        }
                        this.blockRevealActiveTabOnce();
                        this.closeEditorAction.run({ groupId: this.groupView.id, editorIndex: this.groupView.getIndexOfEditor(editor) });
                    }
                }
            }));
            // Context menu on Shift+F10
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.shiftKey && event.keyCode === 68 /* KeyCode.F10 */) {
                    showContextMenu(e);
                }
            }));
            // Context menu on touch context menu gesture
            disposables.add((0, dom_1.addDisposableListener)(tab, touch_1.EventType.Contextmenu, (e) => {
                showContextMenu(e);
            }));
            // Keyboard accessibility
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.KEY_UP, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                let handled = false;
                // Run action on Enter/Space
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    handled = true;
                    const editor = this.tabsModel.getEditorByIndex(tabIndex);
                    if (editor) {
                        this.groupView.openEditor(editor);
                    }
                }
                // Navigate in editors
                else if ([15 /* KeyCode.LeftArrow */, 17 /* KeyCode.RightArrow */, 16 /* KeyCode.UpArrow */, 18 /* KeyCode.DownArrow */, 14 /* KeyCode.Home */, 13 /* KeyCode.End */].some(kb => event.equals(kb))) {
                    let editorIndex = this.toEditorIndex(tabIndex);
                    if (event.equals(15 /* KeyCode.LeftArrow */) || event.equals(16 /* KeyCode.UpArrow */)) {
                        editorIndex = editorIndex - 1;
                    }
                    else if (event.equals(17 /* KeyCode.RightArrow */) || event.equals(18 /* KeyCode.DownArrow */)) {
                        editorIndex = editorIndex + 1;
                    }
                    else if (event.equals(14 /* KeyCode.Home */)) {
                        editorIndex = 0;
                    }
                    else {
                        editorIndex = this.groupView.count - 1;
                    }
                    const target = this.groupView.getEditorByIndex(editorIndex);
                    if (target) {
                        handled = true;
                        this.groupView.openEditor(target, { preserveFocus: true }, { focusTabControl: true });
                    }
                }
                if (handled) {
                    dom_1.EventHelper.stop(e, true);
                }
                // moving in the tabs container can have an impact on scrolling position, so we need to update the custom scrollbar
                tabsScrollbar.setScrollPosition({
                    scrollLeft: tabsContainer.scrollLeft
                });
            }));
            // Double click: either pin or toggle maximized
            for (const eventType of [touch_1.EventType.Tap, dom_1.EventType.DBLCLICK]) {
                disposables.add((0, dom_1.addDisposableListener)(tab, eventType, (e) => {
                    if (eventType === dom_1.EventType.DBLCLICK) {
                        dom_1.EventHelper.stop(e);
                    }
                    else if (e.tapCount !== 2) {
                        return; // ignore single taps
                    }
                    const editor = this.tabsModel.getEditorByIndex(tabIndex);
                    if (editor && this.tabsModel.isPinned(editor)) {
                        switch (this.groupsView.partOptions.doubleClickTabToToggleEditorGroupSizes) {
                            case 'maximize':
                                this.groupsView.toggleMaximizeGroup(this.groupView);
                                break;
                            case 'expand':
                                this.groupsView.toggleExpandGroup(this.groupView);
                                break;
                            case 'off':
                                break;
                        }
                    }
                    else {
                        this.groupView.pinEditor(editor);
                    }
                }));
            }
            // Context menu
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.CONTEXT_MENU, e => {
                dom_1.EventHelper.stop(e, true);
                const editor = this.tabsModel.getEditorByIndex(tabIndex);
                if (editor) {
                    this.onTabContextMenu(editor, e, tab);
                }
            }, true /* use capture to fix https://github.com/microsoft/vscode/issues/19145 */));
            // Drag & Drop support
            let lastDragEvent = undefined;
            let isNewWindowOperation = false;
            disposables.add(new dom_1.DragAndDropObserver(tab, {
                onDragStart: e => {
                    const editor = this.tabsModel.getEditorByIndex(tabIndex);
                    if (!editor) {
                        return;
                    }
                    isNewWindowOperation = this.isNewWindowOperation(e);
                    this.editorTransfer.setData([new dnd_1.DraggedEditorIdentifier({ editor, groupId: this.groupView.id })], dnd_1.DraggedEditorIdentifier.prototype);
                    if (e.dataTransfer) {
                        e.dataTransfer.effectAllowed = 'copyMove';
                        e.dataTransfer.setDragImage(tab, 0, 0); // top left corner of dragged tab set to cursor position to make room for drop-border feedback
                    }
                    // Apply some datatransfer types to allow for dragging the element outside of the application
                    this.doFillResourceDataTransfers([editor], e, isNewWindowOperation);
                    (0, dom_1.scheduleAtNextAnimationFrame)((0, dom_1.getWindow)(this.parent), () => this.updateDropFeedback(tab, false, e, tabIndex));
                },
                onDrag: e => {
                    lastDragEvent = e;
                },
                onDragEnter: e => {
                    // Return if transfer is unsupported
                    if (!this.isSupportedDropTransfer(e)) {
                        if (e.dataTransfer) {
                            e.dataTransfer.dropEffect = 'none';
                        }
                        return;
                    }
                    // Update the dropEffect to "copy" if there is no local data to be dragged because
                    // in that case we can only copy the data into and not move it from its source
                    if (!this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                        if (e.dataTransfer) {
                            e.dataTransfer.dropEffect = 'copy';
                        }
                    }
                    this.updateDropFeedback(tab, true, e, tabIndex);
                },
                onDragOver: (e, dragDuration) => {
                    if (dragDuration >= MultiEditorTabsControl_1.DRAG_OVER_OPEN_TAB_THRESHOLD) {
                        const draggedOverTab = this.tabsModel.getEditorByIndex(tabIndex);
                        if (draggedOverTab && this.tabsModel.activeEditor !== draggedOverTab) {
                            this.groupView.openEditor(draggedOverTab, { preserveFocus: true });
                        }
                    }
                    this.updateDropFeedback(tab, true, e, tabIndex);
                },
                onDragEnd: async (e) => {
                    this.updateDropFeedback(tab, false, e, tabIndex);
                    this.editorTransfer.clearData(dnd_1.DraggedEditorIdentifier.prototype);
                    const editor = this.tabsModel.getEditorByIndex(tabIndex);
                    if (!isNewWindowOperation ||
                        (0, dnd_1.isWindowDraggedOver)() ||
                        !editor) {
                        return; // drag to open in new window is disabled
                    }
                    const auxiliaryEditorPart = await this.maybeCreateAuxiliaryEditorPartAt(e, tab);
                    if (!auxiliaryEditorPart) {
                        return;
                    }
                    const targetGroup = auxiliaryEditorPart.activeGroup;
                    if (this.isMoveOperation(lastDragEvent ?? e, targetGroup.id, editor)) {
                        this.groupView.moveEditor(editor, targetGroup);
                    }
                    else {
                        this.groupView.copyEditor(editor, targetGroup);
                    }
                    targetGroup.focus();
                },
                onDrop: e => {
                    this.updateDropFeedback(tab, false, e, tabIndex);
                    // compute the target index
                    let targetIndex = tabIndex;
                    if (this.getTabDragOverLocation(e, tab) === 'right') {
                        targetIndex++;
                    }
                    // If we are moving an editor inside the same group and it is
                    // located before the target index we need to reduce the index
                    // by one to account for the fact that the move will cause all
                    // subsequent tabs to move one to the left.
                    const editorIdentifiers = this.editorTransfer.getData(dnd_1.DraggedEditorIdentifier.prototype);
                    if (editorIdentifiers !== undefined) {
                        const draggedEditorIdentifier = editorIdentifiers[0].identifier;
                        const sourceGroup = this.editorPartsView.getGroup(draggedEditorIdentifier.groupId);
                        if (sourceGroup?.id === this.groupView.id) {
                            const editorIndex = sourceGroup.getIndexOfEditor(draggedEditorIdentifier.editor);
                            if (editorIndex < targetIndex) {
                                targetIndex--;
                            }
                        }
                    }
                    this.onDrop(e, targetIndex, tabsContainer);
                }
            }));
            return disposables;
        }
        isSupportedDropTransfer(e) {
            if (this.groupTransfer.hasData(dnd_1.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_1.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    const group = data[0];
                    if (group.identifier === this.groupView.id) {
                        return false; // groups cannot be dropped on group it originates from
                    }
                }
                return true;
            }
            if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                return true; // (local) editors can always be dropped
            }
            if (e.dataTransfer && e.dataTransfer.types.length > 0) {
                return true; // optimistically allow external data (// see https://github.com/microsoft/vscode/issues/25789)
            }
            return false;
        }
        updateDropFeedback(element, isDND, e, tabIndex) {
            const isTab = (typeof tabIndex === 'number');
            let dropTarget;
            if (isDND) {
                if (isTab) {
                    dropTarget = this.computeDropTarget(e, tabIndex, element);
                }
                else {
                    dropTarget = { leftElement: element.lastElementChild, rightElement: undefined };
                }
            }
            else {
                dropTarget = undefined;
            }
            this.updateDropTarget(dropTarget);
        }
        updateDropTarget(newTarget) {
            const oldTargets = this.dropTarget;
            if (oldTargets === newTarget || oldTargets && newTarget && oldTargets.leftElement === newTarget.leftElement && oldTargets.rightElement === newTarget.rightElement) {
                return;
            }
            const dropClassLeft = 'drop-target-left';
            const dropClassRight = 'drop-target-right';
            if (oldTargets) {
                oldTargets.leftElement?.classList.remove(dropClassLeft);
                oldTargets.rightElement?.classList.remove(dropClassRight);
            }
            if (newTarget) {
                newTarget.leftElement?.classList.add(dropClassLeft);
                newTarget.rightElement?.classList.add(dropClassRight);
            }
            this.dropTarget = newTarget;
        }
        getTabDragOverLocation(e, tab) {
            const rect = tab.getBoundingClientRect();
            const offsetXRelativeToParent = e.clientX - rect.left;
            return offsetXRelativeToParent <= rect.width / 2 ? 'left' : 'right';
        }
        computeDropTarget(e, tabIndex, targetTab) {
            const isLeftSideOfTab = this.getTabDragOverLocation(e, targetTab) === 'left';
            const isLastTab = tabIndex === this.tabsModel.count - 1;
            const isFirstTab = tabIndex === 0;
            // Before first tab
            if (isLeftSideOfTab && isFirstTab) {
                return { leftElement: undefined, rightElement: targetTab };
            }
            // After last tab
            if (!isLeftSideOfTab && isLastTab) {
                return { leftElement: targetTab, rightElement: undefined };
            }
            // Between two tabs
            const tabBefore = isLeftSideOfTab ? targetTab.previousElementSibling : targetTab;
            const tabAfter = isLeftSideOfTab ? targetTab : targetTab.nextElementSibling;
            return { leftElement: tabBefore, rightElement: tabAfter };
        }
        computeTabLabels() {
            const { labelFormat } = this.groupsView.partOptions;
            const { verbosity, shortenDuplicates } = this.getLabelConfigFlags(labelFormat);
            // Build labels and descriptions for each editor
            const labels = [];
            let activeEditorTabIndex = -1;
            this.tabsModel.getEditors(1 /* EditorsOrder.SEQUENTIAL */).forEach((editor, tabIndex) => {
                labels.push({
                    editor,
                    name: editor.getName(),
                    description: editor.getDescription(verbosity),
                    forceDescription: editor.hasCapability(64 /* EditorInputCapabilities.ForceDescription */),
                    title: editor.getTitle(2 /* Verbosity.LONG */),
                    ariaLabel: (0, editor_2.computeEditorAriaLabel)(editor, tabIndex, this.groupView, this.editorPartsView.count)
                });
                if (editor === this.tabsModel.activeEditor) {
                    activeEditorTabIndex = tabIndex;
                }
            });
            // Shorten labels as needed
            if (shortenDuplicates) {
                this.shortenTabLabels(labels);
            }
            // Remember for fast lookup
            this.tabLabels = labels;
            this.activeTabLabel = labels[activeEditorTabIndex];
        }
        shortenTabLabels(labels) {
            // Gather duplicate titles, while filtering out invalid descriptions
            const mapNameToDuplicates = new Map();
            for (const label of labels) {
                if (typeof label.description === 'string') {
                    (0, map_1.getOrSet)(mapNameToDuplicates, label.name, []).push(label);
                }
                else {
                    label.description = '';
                }
            }
            // Identify duplicate names and shorten descriptions
            for (const [, duplicateLabels] of mapNameToDuplicates) {
                // Remove description if the title isn't duplicated
                // and we have no indication to enforce description
                if (duplicateLabels.length === 1 && !duplicateLabels[0].forceDescription) {
                    duplicateLabels[0].description = '';
                    continue;
                }
                // Identify duplicate descriptions
                const mapDescriptionToDuplicates = new Map();
                for (const duplicateLabel of duplicateLabels) {
                    (0, map_1.getOrSet)(mapDescriptionToDuplicates, duplicateLabel.description, []).push(duplicateLabel);
                }
                // For editors with duplicate descriptions, check whether any long descriptions differ
                let useLongDescriptions = false;
                for (const [, duplicateLabels] of mapDescriptionToDuplicates) {
                    if (!useLongDescriptions && duplicateLabels.length > 1) {
                        const [first, ...rest] = duplicateLabels.map(({ editor }) => editor.getDescription(2 /* Verbosity.LONG */));
                        useLongDescriptions = rest.some(description => description !== first);
                    }
                }
                // If so, replace all descriptions with long descriptions
                if (useLongDescriptions) {
                    mapDescriptionToDuplicates.clear();
                    for (const duplicateLabel of duplicateLabels) {
                        duplicateLabel.description = duplicateLabel.editor.getDescription(2 /* Verbosity.LONG */);
                        (0, map_1.getOrSet)(mapDescriptionToDuplicates, duplicateLabel.description, []).push(duplicateLabel);
                    }
                }
                // Obtain final set of descriptions
                const descriptions = [];
                for (const [description] of mapDescriptionToDuplicates) {
                    descriptions.push(description);
                }
                // Remove description if all descriptions are identical unless forced
                if (descriptions.length === 1) {
                    for (const label of mapDescriptionToDuplicates.get(descriptions[0]) || []) {
                        if (!label.forceDescription) {
                            label.description = '';
                        }
                    }
                    continue;
                }
                // Shorten descriptions
                const shortenedDescriptions = (0, labels_1.shorten)(descriptions, this.path.sep);
                descriptions.forEach((description, tabIndex) => {
                    for (const label of mapDescriptionToDuplicates.get(description) || []) {
                        label.description = shortenedDescriptions[tabIndex];
                    }
                });
            }
        }
        getLabelConfigFlags(value) {
            switch (value) {
                case 'short':
                    return { verbosity: 0 /* Verbosity.SHORT */, shortenDuplicates: false };
                case 'medium':
                    return { verbosity: 1 /* Verbosity.MEDIUM */, shortenDuplicates: false };
                case 'long':
                    return { verbosity: 2 /* Verbosity.LONG */, shortenDuplicates: false };
                default:
                    return { verbosity: 1 /* Verbosity.MEDIUM */, shortenDuplicates: true };
            }
        }
        redraw(options) {
            // Border below tabs if any with explicit high contrast support
            if (this.tabsAndActionsContainer) {
                let tabsContainerBorderColor = this.getColor(theme_1.EDITOR_GROUP_HEADER_TABS_BORDER);
                if (!tabsContainerBorderColor && (0, theme_2.isHighContrast)(this.theme.type)) {
                    tabsContainerBorderColor = this.getColor(theme_1.TAB_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
                }
                if (tabsContainerBorderColor) {
                    this.tabsAndActionsContainer.classList.add('tabs-border-bottom');
                    this.tabsAndActionsContainer.style.setProperty('--tabs-border-bottom-color', tabsContainerBorderColor.toString());
                }
                else {
                    this.tabsAndActionsContainer.classList.remove('tabs-border-bottom');
                    this.tabsAndActionsContainer.style.removeProperty('--tabs-border-bottom-color');
                }
            }
            // For each tab
            this.forEachTab((editor, tabIndex, tabContainer, tabLabelWidget, tabLabel, tabActionBar) => {
                this.redrawTab(editor, tabIndex, tabContainer, tabLabelWidget, tabLabel, tabActionBar);
            });
            // Update Editor Actions Toolbar
            this.updateEditorActionsToolbar();
            // Ensure the active tab is always revealed
            this.layout(this.dimensions, options);
        }
        redrawTab(editor, tabIndex, tabContainer, tabLabelWidget, tabLabel, tabActionBar) {
            const isTabSticky = this.tabsModel.isSticky(tabIndex);
            const options = this.groupsView.partOptions;
            // Label
            this.redrawTabLabel(editor, tabIndex, tabContainer, tabLabelWidget, tabLabel);
            // Action
            const hasUnpinAction = isTabSticky && options.tabActionUnpinVisibility;
            const hasCloseAction = !hasUnpinAction && options.tabActionCloseVisibility;
            const hasAction = hasUnpinAction || hasCloseAction;
            let tabAction;
            if (hasAction) {
                tabAction = hasUnpinAction ? this.unpinEditorAction : this.closeEditorAction;
            }
            else {
                // Even if the action is not visible, add it as it contains the dirty indicator
                tabAction = isTabSticky ? this.unpinEditorAction : this.closeEditorAction;
            }
            if (!tabActionBar.hasAction(tabAction)) {
                if (!tabActionBar.isEmpty()) {
                    tabActionBar.clear();
                }
                tabActionBar.push(tabAction, { icon: true, label: false, keybinding: this.getKeybindingLabel(tabAction) });
            }
            tabContainer.classList.toggle(`pinned-action-off`, isTabSticky && !hasUnpinAction);
            tabContainer.classList.toggle(`close-action-off`, !hasUnpinAction && !hasCloseAction);
            for (const option of ['left', 'right']) {
                tabContainer.classList.toggle(`tab-actions-${option}`, hasAction && options.tabActionLocation === option);
            }
            const tabSizing = isTabSticky && options.pinnedTabSizing === 'shrink' ? 'shrink' /* treat sticky shrink tabs as tabSizing: 'shrink' */ : options.tabSizing;
            for (const option of ['fit', 'shrink', 'fixed']) {
                tabContainer.classList.toggle(`sizing-${option}`, tabSizing === option);
            }
            tabContainer.classList.toggle('has-icon', options.showIcons && options.hasIcons);
            tabContainer.classList.toggle('sticky', isTabSticky);
            for (const option of ['normal', 'compact', 'shrink']) {
                tabContainer.classList.toggle(`sticky-${option}`, isTabSticky && options.pinnedTabSizing === option);
            }
            // If not wrapping tabs, sticky compact/shrink tabs need a position to remain at their location
            // when scrolling to stay in view (requirement for position: sticky)
            if (!options.wrapTabs && isTabSticky && options.pinnedTabSizing !== 'normal') {
                let stickyTabWidth = 0;
                switch (options.pinnedTabSizing) {
                    case 'compact':
                        stickyTabWidth = MultiEditorTabsControl_1.TAB_WIDTH.compact;
                        break;
                    case 'shrink':
                        stickyTabWidth = MultiEditorTabsControl_1.TAB_WIDTH.shrink;
                        break;
                }
                tabContainer.style.left = `${tabIndex * stickyTabWidth}px`;
            }
            else {
                tabContainer.style.left = 'auto';
            }
            // Borders / outline
            this.redrawTabBorders(tabIndex, tabContainer);
            // Active / dirty state
            this.redrawTabActiveAndDirty(this.groupsView.activeGroup === this.groupView, editor, tabContainer, tabActionBar);
        }
        redrawTabLabel(editor, tabIndex, tabContainer, tabLabelWidget, tabLabel) {
            const options = this.groupsView.partOptions;
            // Unless tabs are sticky compact, show the full label and description
            // Sticky compact tabs will only show an icon if icons are enabled
            // or their first character of the name otherwise
            let name;
            let forceLabel = false;
            let fileDecorationBadges = Boolean(options.decorations?.badges);
            const fileDecorationColors = Boolean(options.decorations?.colors);
            let description;
            if (options.pinnedTabSizing === 'compact' && this.tabsModel.isSticky(tabIndex)) {
                const isShowingIcons = options.showIcons && options.hasIcons;
                name = isShowingIcons ? '' : tabLabel.name?.charAt(0).toUpperCase();
                description = '';
                forceLabel = true;
                fileDecorationBadges = false; // not enough space when sticky tabs are compact
            }
            else {
                name = tabLabel.name;
                description = tabLabel.description || '';
            }
            if (tabLabel.ariaLabel) {
                tabContainer.setAttribute('aria-label', tabLabel.ariaLabel);
                // Set aria-description to empty string so that screen readers would not read the title as well
                // More details https://github.com/microsoft/vscode/issues/95378
                tabContainer.setAttribute('aria-description', '');
            }
            // Label
            tabLabelWidget.setResource({ name, description, resource: editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH }) }, {
                title: this.getHoverTitle(editor),
                extraClasses: (0, arrays_1.coalesce)(['tab-label', fileDecorationBadges ? 'tab-label-has-badge' : undefined].concat(editor.getLabelExtraClasses())),
                italic: !this.tabsModel.isPinned(editor),
                forceLabel,
                fileDecorations: {
                    colors: fileDecorationColors,
                    badges: fileDecorationBadges
                },
                icon: editor.getIcon(),
                hideIcon: options.showIcons === false,
            });
            // Tests helper
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (resource) {
                tabContainer.setAttribute('data-resource-name', (0, resources_1.basenameOrAuthority)(resource));
            }
            else {
                tabContainer.removeAttribute('data-resource-name');
            }
        }
        redrawTabActiveAndDirty(isGroupActive, editor, tabContainer, tabActionBar) {
            const isTabActive = this.tabsModel.isActive(editor);
            const hasModifiedBorderTop = this.doRedrawTabDirty(isGroupActive, isTabActive, editor, tabContainer);
            this.doRedrawTabActive(isGroupActive, !hasModifiedBorderTop, editor, tabContainer, tabActionBar);
        }
        doRedrawTabActive(isGroupActive, allowBorderTop, editor, tabContainer, tabActionBar) {
            const isActive = this.tabsModel.isActive(editor);
            tabContainer.classList.toggle('active', isActive);
            tabContainer.setAttribute('aria-selected', isActive ? 'true' : 'false');
            tabContainer.tabIndex = isActive ? 0 : -1; // Only active tab can be focused into
            tabActionBar.setFocusable(isActive);
            if (isActive) {
                // Set border BOTTOM if theme defined color
                const activeTabBorderColorBottom = this.getColor(isGroupActive ? theme_1.TAB_ACTIVE_BORDER : theme_1.TAB_UNFOCUSED_ACTIVE_BORDER);
                tabContainer.classList.toggle('tab-border-bottom', !!activeTabBorderColorBottom);
                tabContainer.style.setProperty('--tab-border-bottom-color', activeTabBorderColorBottom?.toString() ?? '');
                // Set border TOP if theme defined color
                const activeTabBorderColorTop = allowBorderTop ? this.getColor(isGroupActive ? theme_1.TAB_ACTIVE_BORDER_TOP : theme_1.TAB_UNFOCUSED_ACTIVE_BORDER_TOP) : undefined;
                tabContainer.classList.toggle('tab-border-top', !!activeTabBorderColorTop);
                tabContainer.style.setProperty('--tab-border-top-color', activeTabBorderColorTop?.toString() ?? '');
            }
        }
        doRedrawTabDirty(isGroupActive, isTabActive, editor, tabContainer) {
            let hasModifiedBorderColor = false;
            // Tab: dirty (unless saving)
            if (editor.isDirty() && !editor.isSaving()) {
                tabContainer.classList.add('dirty');
                // Highlight modified tabs with a border if configured
                if (this.groupsView.partOptions.highlightModifiedTabs) {
                    let modifiedBorderColor;
                    if (isGroupActive && isTabActive) {
                        modifiedBorderColor = this.getColor(theme_1.TAB_ACTIVE_MODIFIED_BORDER);
                    }
                    else if (isGroupActive && !isTabActive) {
                        modifiedBorderColor = this.getColor(theme_1.TAB_INACTIVE_MODIFIED_BORDER);
                    }
                    else if (!isGroupActive && isTabActive) {
                        modifiedBorderColor = this.getColor(theme_1.TAB_UNFOCUSED_ACTIVE_MODIFIED_BORDER);
                    }
                    else {
                        modifiedBorderColor = this.getColor(theme_1.TAB_UNFOCUSED_INACTIVE_MODIFIED_BORDER);
                    }
                    if (modifiedBorderColor) {
                        hasModifiedBorderColor = true;
                        tabContainer.classList.add('dirty-border-top');
                        tabContainer.style.setProperty('--tab-dirty-border-top-color', modifiedBorderColor);
                    }
                }
                else {
                    tabContainer.classList.remove('dirty-border-top');
                    tabContainer.style.removeProperty('--tab-dirty-border-top-color');
                }
            }
            // Tab: not dirty
            else {
                tabContainer.classList.remove('dirty', 'dirty-border-top');
                tabContainer.style.removeProperty('--tab-dirty-border-top-color');
            }
            return hasModifiedBorderColor;
        }
        redrawTabBorders(tabIndex, tabContainer) {
            const isTabSticky = this.tabsModel.isSticky(tabIndex);
            const isTabLastSticky = isTabSticky && this.tabsModel.stickyCount === tabIndex + 1;
            const showLastStickyTabBorderColor = this.tabsModel.stickyCount !== this.tabsModel.count;
            // Borders / Outline
            const borderRightColor = ((isTabLastSticky && showLastStickyTabBorderColor ? this.getColor(theme_1.TAB_LAST_PINNED_BORDER) : undefined) || this.getColor(theme_1.TAB_BORDER) || this.getColor(colorRegistry_1.contrastBorder));
            tabContainer.style.borderRight = borderRightColor ? `1px solid ${borderRightColor}` : '';
            tabContainer.style.outlineColor = this.getColor(colorRegistry_1.activeContrastBorder) || '';
        }
        prepareEditorActions(editorActions) {
            const isGroupActive = this.groupsView.activeGroup === this.groupView;
            // Active: allow all actions
            if (isGroupActive) {
                return editorActions;
            }
            // Inactive: only show "Unlock" and secondary actions
            else {
                return {
                    primary: editorActions.primary.filter(action => action.id === editorCommands_1.UNLOCK_GROUP_COMMAND_ID),
                    secondary: editorActions.secondary
                };
            }
        }
        getHeight() {
            // Return quickly if our used dimensions are known
            if (this.dimensions.used) {
                return this.dimensions.used.height;
            }
            // Otherwise compute via browser APIs
            else {
                return this.computeHeight();
            }
        }
        computeHeight() {
            let height;
            if (!this.visible) {
                height = 0;
            }
            else if (this.groupsView.partOptions.wrapTabs && this.tabsAndActionsContainer?.classList.contains('wrapping')) {
                // Wrap: we need to ask `offsetHeight` to get
                // the real height of the title area with wrapping.
                height = this.tabsAndActionsContainer.offsetHeight;
            }
            else {
                height = this.tabHeight;
            }
            return height;
        }
        layout(dimensions, options) {
            // Remember dimensions that we get
            Object.assign(this.dimensions, dimensions);
            if (this.visible) {
                if (!this.layoutScheduler.value) {
                    // The layout of tabs can be an expensive operation because we access DOM properties
                    // that can result in the browser doing a full page layout to validate them. To buffer
                    // this a little bit we try at least to schedule this work on the next animation frame
                    // when we have restored or when idle otherwise.
                    const disposable = (0, dom_1.scheduleAtNextAnimationFrame)((0, dom_1.getWindow)(this.parent), () => {
                        this.doLayout(this.dimensions, this.layoutScheduler.value?.options /* ensure to pick up latest options */);
                        this.layoutScheduler.clear();
                    });
                    this.layoutScheduler.value = { options, dispose: () => disposable.dispose() };
                }
                // Make sure to keep options updated
                if (options?.forceRevealActiveTab) {
                    this.layoutScheduler.value.options = {
                        ...this.layoutScheduler.value.options,
                        forceRevealActiveTab: true
                    };
                }
            }
            // First time layout: compute the dimensions and store it
            if (!this.dimensions.used) {
                this.dimensions.used = new dom_1.Dimension(dimensions.container.width, this.computeHeight());
            }
            return this.dimensions.used;
        }
        doLayout(dimensions, options) {
            // Layout tabs
            if (dimensions.container !== dom_1.Dimension.None && dimensions.available !== dom_1.Dimension.None) {
                this.doLayoutTabs(dimensions, options);
            }
            // Remember the dimensions used in the control so that we can
            // return it fast from the `layout` call without having to
            // compute it over and over again
            const oldDimension = this.dimensions.used;
            const newDimension = this.dimensions.used = new dom_1.Dimension(dimensions.container.width, this.computeHeight());
            // In case the height of the title control changed from before
            // (currently only possible if wrapping changed on/off), we need
            // to signal this to the outside via a `relayout` call so that
            // e.g. the editor control can be adjusted accordingly.
            if (oldDimension && oldDimension.height !== newDimension.height) {
                this.groupView.relayout();
            }
        }
        doLayoutTabs(dimensions, options) {
            // Always first layout tabs with wrapping support even if wrapping
            // is disabled. The result indicates if tabs wrap and if not, we
            // need to proceed with the layout without wrapping because even
            // if wrapping is enabled in settings, there are cases where
            // wrapping is disabled (e.g. due to space constraints)
            const tabsWrapMultiLine = this.doLayoutTabsWrapping(dimensions);
            if (!tabsWrapMultiLine) {
                this.doLayoutTabsNonWrapping(options);
            }
        }
        doLayoutTabsWrapping(dimensions) {
            const [tabsAndActionsContainer, tabsContainer, editorToolbarContainer, tabsScrollbar] = (0, types_1.assertAllDefined)(this.tabsAndActionsContainer, this.tabsContainer, this.editorActionsToolbarContainer, this.tabsScrollbar);
            // Handle wrapping tabs according to setting:
            // - enabled: only add class if tabs wrap and don't exceed available dimensions
            // - disabled: remove class and margin-right variable
            const didTabsWrapMultiLine = tabsAndActionsContainer.classList.contains('wrapping');
            let tabsWrapMultiLine = didTabsWrapMultiLine;
            function updateTabsWrapping(enabled) {
                tabsWrapMultiLine = enabled;
                // Toggle the `wrapped` class to enable wrapping
                tabsAndActionsContainer.classList.toggle('wrapping', tabsWrapMultiLine);
                // Update `last-tab-margin-right` CSS variable to account for the absolute
                // positioned editor actions container when tabs wrap. The margin needs to
                // be the width of the editor actions container to avoid screen cheese.
                tabsContainer.style.setProperty('--last-tab-margin-right', tabsWrapMultiLine ? `${editorToolbarContainer.offsetWidth}px` : '0');
                // Remove old css classes that are not needed anymore
                for (const tab of tabsContainer.children) {
                    tab.classList.remove('last-in-row');
                }
            }
            // Setting enabled: selectively enable wrapping if possible
            if (this.groupsView.partOptions.wrapTabs) {
                const visibleTabsWidth = tabsContainer.offsetWidth;
                const allTabsWidth = tabsContainer.scrollWidth;
                const lastTabFitsWrapped = () => {
                    const lastTab = this.getLastTab();
                    if (!lastTab) {
                        return true; // no tab always fits
                    }
                    const lastTabOverlapWithToolbarWidth = lastTab.offsetWidth + editorToolbarContainer.offsetWidth - dimensions.available.width;
                    if (lastTabOverlapWithToolbarWidth > 1) {
                        // Allow for slight rounding errors related to zooming here
                        // https://github.com/microsoft/vscode/issues/116385
                        return false;
                    }
                    return true;
                };
                // If tabs wrap or should start to wrap (when width exceeds visible width)
                // we must trigger `updateWrapping` to set the `last-tab-margin-right`
                // accordingly based on the number of actions. The margin is important to
                // properly position the last tab apart from the actions
                //
                // We already check here if the last tab would fit when wrapped given the
                // editor toolbar will also show right next to it. This ensures we are not
                // enabling wrapping only to disable it again in the code below (this fixes
                // flickering issue https://github.com/microsoft/vscode/issues/115050)
                if (tabsWrapMultiLine || (allTabsWidth > visibleTabsWidth && lastTabFitsWrapped())) {
                    updateTabsWrapping(true);
                }
                // Tabs wrap multiline: remove wrapping under certain size constraint conditions
                if (tabsWrapMultiLine) {
                    if ((tabsContainer.offsetHeight > dimensions.available.height) || // if height exceeds available height
                        (allTabsWidth === visibleTabsWidth && tabsContainer.offsetHeight === this.tabHeight) || // if wrapping is not needed anymore
                        (!lastTabFitsWrapped()) // if last tab does not fit anymore
                    ) {
                        updateTabsWrapping(false);
                    }
                }
            }
            // Setting disabled: remove CSS traces only if tabs did wrap
            else if (didTabsWrapMultiLine) {
                updateTabsWrapping(false);
            }
            // If we transitioned from non-wrapping to wrapping, we need
            // to update the scrollbar to have an equal `width` and
            // `scrollWidth`. Otherwise a scrollbar would appear which is
            // never desired when wrapping.
            if (tabsWrapMultiLine && !didTabsWrapMultiLine) {
                const visibleTabsWidth = tabsContainer.offsetWidth;
                tabsScrollbar.setScrollDimensions({
                    width: visibleTabsWidth,
                    scrollWidth: visibleTabsWidth
                });
            }
            // Update the `last-in-row` class on tabs when wrapping
            // is enabled (it doesn't do any harm otherwise). This
            // class controls additional properties of tab when it is
            // the last tab in a row
            if (tabsWrapMultiLine) {
                // Using a map here to change classes after the for loop is
                // crucial for performance because changing the class on a
                // tab can result in layouts of the rendering engine.
                const tabs = new Map();
                let currentTabsPosY = undefined;
                let lastTab = undefined;
                for (const child of tabsContainer.children) {
                    const tab = child;
                    const tabPosY = tab.offsetTop;
                    // Marks a new or the first row of tabs
                    if (tabPosY !== currentTabsPosY) {
                        currentTabsPosY = tabPosY;
                        if (lastTab) {
                            tabs.set(lastTab, true); // previous tab must be last in row then
                        }
                    }
                    // Always remember last tab and ensure the
                    // last-in-row class is not present until
                    // we know the tab is last
                    lastTab = tab;
                    tabs.set(tab, false);
                }
                // Last tab overally is always last-in-row
                if (lastTab) {
                    tabs.set(lastTab, true);
                }
                for (const [tab, lastInRow] of tabs) {
                    tab.classList.toggle('last-in-row', lastInRow);
                }
            }
            return tabsWrapMultiLine;
        }
        doLayoutTabsNonWrapping(options) {
            const [tabsContainer, tabsScrollbar] = (0, types_1.assertAllDefined)(this.tabsContainer, this.tabsScrollbar);
            //
            // Synopsis
            // - allTabsWidth:   			sum of all tab widths
            // - stickyTabsWidth:			sum of all sticky tab widths (unless `pinnedTabSizing: normal`)
            // - visibleContainerWidth: 	size of tab container
            // - availableContainerWidth: 	size of tab container minus size of sticky tabs
            //
            // [------------------------------ All tabs width ---------------------------------------]
            // [------------------- Visible container width -------------------]
            //                         [------ Available container width ------]
            // [ Sticky A ][ Sticky B ][ Tab C ][ Tab D ][ Tab E ][ Tab F ][ Tab G ][ Tab H ][ Tab I ]
            //                 Active Tab Width [-------]
            // [------- Active Tab Pos X -------]
            // [-- Sticky Tabs Width --]
            //
            const visibleTabsWidth = tabsContainer.offsetWidth;
            const allTabsWidth = tabsContainer.scrollWidth;
            // Compute width of sticky tabs depending on pinned tab sizing
            // - compact: sticky-tabs * TAB_SIZES.compact
            // -  shrink: sticky-tabs * TAB_SIZES.shrink
            // -  normal: 0 (sticky tabs inherit look and feel from non-sticky tabs)
            let stickyTabsWidth = 0;
            if (this.tabsModel.stickyCount > 0) {
                let stickyTabWidth = 0;
                switch (this.groupsView.partOptions.pinnedTabSizing) {
                    case 'compact':
                        stickyTabWidth = MultiEditorTabsControl_1.TAB_WIDTH.compact;
                        break;
                    case 'shrink':
                        stickyTabWidth = MultiEditorTabsControl_1.TAB_WIDTH.shrink;
                        break;
                }
                stickyTabsWidth = this.tabsModel.stickyCount * stickyTabWidth;
            }
            const activeTabAndIndex = this.tabsModel.activeEditor ? this.getTabAndIndex(this.tabsModel.activeEditor) : undefined;
            const [activeTab, activeTabIndex] = activeTabAndIndex ?? [undefined, undefined];
            // Figure out if active tab is positioned static which has an
            // impact on whether to reveal the tab or not later
            let activeTabPositionStatic = this.groupsView.partOptions.pinnedTabSizing !== 'normal' && typeof activeTabIndex === 'number' && this.tabsModel.isSticky(activeTabIndex);
            // Special case: we have sticky tabs but the available space for showing tabs
            // is little enough that we need to disable sticky tabs sticky positioning
            // so that tabs can be scrolled at naturally.
            let availableTabsContainerWidth = visibleTabsWidth - stickyTabsWidth;
            if (this.tabsModel.stickyCount > 0 && availableTabsContainerWidth < MultiEditorTabsControl_1.TAB_WIDTH.fit) {
                tabsContainer.classList.add('disable-sticky-tabs');
                availableTabsContainerWidth = visibleTabsWidth;
                stickyTabsWidth = 0;
                activeTabPositionStatic = false;
            }
            else {
                tabsContainer.classList.remove('disable-sticky-tabs');
            }
            let activeTabPosX;
            let activeTabWidth;
            if (!this.blockRevealActiveTab && activeTab) {
                activeTabPosX = activeTab.offsetLeft;
                activeTabWidth = activeTab.offsetWidth;
            }
            // Update scrollbar
            const { width: oldVisibleTabsWidth, scrollWidth: oldAllTabsWidth } = tabsScrollbar.getScrollDimensions();
            tabsScrollbar.setScrollDimensions({
                width: visibleTabsWidth,
                scrollWidth: allTabsWidth
            });
            const dimensionsChanged = oldVisibleTabsWidth !== visibleTabsWidth || oldAllTabsWidth !== allTabsWidth;
            // Revealing the active tab is skipped under some conditions:
            if (this.blockRevealActiveTab || // explicitly disabled
                typeof activeTabPosX !== 'number' || // invalid dimension
                typeof activeTabWidth !== 'number' || // invalid dimension
                activeTabPositionStatic || // static tab (sticky)
                (!dimensionsChanged && !options?.forceRevealActiveTab) // dimensions did not change and we have low layout priority (https://github.com/microsoft/vscode/issues/133631)
            ) {
                this.blockRevealActiveTab = false;
                return;
            }
            // Reveal the active one
            const tabsContainerScrollPosX = tabsScrollbar.getScrollPosition().scrollLeft;
            const activeTabFits = activeTabWidth <= availableTabsContainerWidth;
            const adjustedActiveTabPosX = activeTabPosX - stickyTabsWidth;
            //
            // Synopsis
            // - adjustedActiveTabPosX: the adjusted tabPosX takes the width of sticky tabs into account
            //   conceptually the scrolling only begins after sticky tabs so in order to reveal a tab fully
            //   the actual position needs to be adjusted for sticky tabs.
            //
            // Tab is overflowing to the right: Scroll minimally until the element is fully visible to the right
            // Note: only try to do this if we actually have enough width to give to show the tab fully!
            //
            // Example: Tab G should be made active and needs to be fully revealed as such.
            //
            // [-------------------------------- All tabs width -----------------------------------------]
            // [-------------------- Visible container width --------------------]
            //                           [----- Available container width -------]
            //     [ Sticky A ][ Sticky B ][ Tab C ][ Tab D ][ Tab E ][ Tab F ][ Tab G ][ Tab H ][ Tab I ]
            //                     Active Tab Width [-------]
            //     [------- Active Tab Pos X -------]
            //                             [-------- Adjusted Tab Pos X -------]
            //     [-- Sticky Tabs Width --]
            //
            //
            if (activeTabFits && tabsContainerScrollPosX + availableTabsContainerWidth < adjustedActiveTabPosX + activeTabWidth) {
                tabsScrollbar.setScrollPosition({
                    scrollLeft: tabsContainerScrollPosX + ((adjustedActiveTabPosX + activeTabWidth) /* right corner of tab */ - (tabsContainerScrollPosX + availableTabsContainerWidth) /* right corner of view port */)
                });
            }
            //
            // Tab is overlflowing to the left or does not fit: Scroll it into view to the left
            //
            // Example: Tab C should be made active and needs to be fully revealed as such.
            //
            // [----------------------------- All tabs width ----------------------------------------]
            //     [------------------ Visible container width ------------------]
            //                           [----- Available container width -------]
            // [ Sticky A ][ Sticky B ][ Tab C ][ Tab D ][ Tab E ][ Tab F ][ Tab G ][ Tab H ][ Tab I ]
            //                 Active Tab Width [-------]
            // [------- Active Tab Pos X -------]
            //      Adjusted Tab Pos X []
            // [-- Sticky Tabs Width --]
            //
            //
            else if (tabsContainerScrollPosX > adjustedActiveTabPosX || !activeTabFits) {
                tabsScrollbar.setScrollPosition({
                    scrollLeft: adjustedActiveTabPosX
                });
            }
        }
        updateTabsControlVisibility() {
            const tabsAndActionsContainer = (0, types_1.assertIsDefined)(this.tabsAndActionsContainer);
            tabsAndActionsContainer.classList.toggle('empty', !this.visible);
            // Reset dimensions if hidden
            if (!this.visible && this.dimensions) {
                this.dimensions.used = undefined;
            }
        }
        get visible() {
            return this.tabsModel.count > 0;
        }
        getTabAndIndex(editor) {
            const tabIndex = this.tabsModel.indexOf(editor);
            const tab = this.getTabAtIndex(tabIndex);
            if (tab) {
                return [tab, tabIndex];
            }
            return undefined;
        }
        getTabAtIndex(tabIndex) {
            if (tabIndex >= 0) {
                const tabsContainer = (0, types_1.assertIsDefined)(this.tabsContainer);
                return tabsContainer.children[tabIndex];
            }
            return undefined;
        }
        getLastTab() {
            return this.getTabAtIndex(this.tabsModel.count - 1);
        }
        blockRevealActiveTabOnce() {
            // When closing tabs through the tab close button or gesture, the user
            // might want to rapidly close tabs in sequence and as such revealing
            // the active tab after each close would be annoying. As such we block
            // the automated revealing of the active tab once after the close is
            // triggered.
            this.blockRevealActiveTab = true;
        }
        originatesFromTabActionBar(e) {
            let element;
            if ((0, dom_1.isMouseEvent)(e)) {
                element = (e.target || e.srcElement);
            }
            else {
                element = e.initialTarget;
            }
            return !!(0, dom_1.findParentWithClass)(element, 'action-item', 'tab');
        }
        async onDrop(e, targetTabIndex, tabsContainer) {
            dom_1.EventHelper.stop(e, true);
            this.updateDropFeedback(tabsContainer, false, e, targetTabIndex);
            tabsContainer.classList.remove('scroll');
            const targetEditorIndex = this.tabsModel instanceof filteredEditorGroupModel_1.UnstickyEditorGroupModel ? targetTabIndex + this.groupView.stickyCount : targetTabIndex;
            const options = {
                sticky: this.tabsModel instanceof filteredEditorGroupModel_1.StickyEditorGroupModel && this.tabsModel.stickyCount === targetEditorIndex,
                index: targetEditorIndex
            };
            // Check for group transfer
            if (this.groupTransfer.hasData(dnd_1.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_1.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    const sourceGroup = this.editorPartsView.getGroup(data[0].identifier);
                    if (sourceGroup) {
                        const mergeGroupOptions = { index: targetEditorIndex };
                        if (!this.isMoveOperation(e, sourceGroup.id)) {
                            mergeGroupOptions.mode = 0 /* MergeGroupMode.COPY_EDITORS */;
                        }
                        this.groupsView.mergeGroup(sourceGroup, this.groupView, mergeGroupOptions);
                    }
                    this.groupView.focus();
                    this.groupTransfer.clearData(dnd_1.DraggedEditorGroupIdentifier.prototype);
                }
            }
            // Check for editor transfer
            else if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                const data = this.editorTransfer.getData(dnd_1.DraggedEditorIdentifier.prototype);
                if (Array.isArray(data)) {
                    const draggedEditor = data[0].identifier;
                    const sourceGroup = this.editorPartsView.getGroup(draggedEditor.groupId);
                    if (sourceGroup) {
                        // Move editor to target position and index
                        if (this.isMoveOperation(e, draggedEditor.groupId, draggedEditor.editor)) {
                            sourceGroup.moveEditor(draggedEditor.editor, this.groupView, options);
                        }
                        // Copy editor to target position and index
                        else {
                            sourceGroup.copyEditor(draggedEditor.editor, this.groupView, options);
                        }
                    }
                    this.groupView.focus();
                    this.editorTransfer.clearData(dnd_1.DraggedEditorIdentifier.prototype);
                }
            }
            // Check for tree items
            else if (this.treeItemsTransfer.hasData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype)) {
                const data = this.treeItemsTransfer.getData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype);
                if (Array.isArray(data)) {
                    const editors = [];
                    for (const id of data) {
                        const dataTransferItem = await this.treeViewsDragAndDropService.removeDragOperationTransfer(id.identifier);
                        if (dataTransferItem) {
                            const treeDropData = await (0, dnd_1.extractTreeDropData)(dataTransferItem);
                            editors.push(...treeDropData.map(editor => ({ ...editor, options: { ...editor.options, pinned: true, index: targetEditorIndex } })));
                        }
                    }
                    this.editorService.openEditors(editors, this.groupView, { validateTrust: true });
                }
                this.treeItemsTransfer.clearData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype);
            }
            // Check for URI transfer
            else {
                const dropHandler = this.instantiationService.createInstance(dnd_1.ResourcesDropHandler, { allowWorkspaceOpen: false });
                dropHandler.handleDrop(e, (0, dom_1.getWindow)(this.parent), () => this.groupView, () => this.groupView.focus(), options);
            }
        }
        dispose() {
            super.dispose();
            this.tabDisposables = (0, lifecycle_1.dispose)(this.tabDisposables);
        }
    };
    exports.MultiEditorTabsControl = MultiEditorTabsControl;
    exports.MultiEditorTabsControl = MultiEditorTabsControl = MultiEditorTabsControl_1 = __decorate([
        __param(5, contextView_1.IContextMenuService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, quickInput_1.IQuickInputService),
        __param(11, themeService_1.IThemeService),
        __param(12, editorService_1.IEditorService),
        __param(13, pathService_1.IPathService),
        __param(14, treeViewsDndService_1.ITreeViewsDnDService),
        __param(15, editorResolverService_1.IEditorResolverService),
        __param(16, host_1.IHostService)
    ], MultiEditorTabsControl);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // Add bottom border to tabs when wrapping
        const borderColor = theme.getColor(theme_1.TAB_BORDER);
        if (borderColor) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title > .tabs-and-actions-container.wrapping .tabs-container > .tab {
				border-bottom: 1px solid ${borderColor};
			}
		`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const activeContrastBorderColor = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (activeContrastBorderColor) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab.active,
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab.active:hover  {
				outline: 1px solid;
				outline-offset: -5px;
			}

			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab.active:focus {
				outline-style: dashed;
			}

			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active {
				outline: 1px dotted;
				outline-offset: -5px;
			}

			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover  {
				outline: 1px dashed;
				outline-offset: -5px;
			}

			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active > .tab-actions .action-label,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active:hover > .tab-actions .action-label,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.dirty > .tab-actions .action-label,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.sticky > .tab-actions .action-label,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover > .tab-actions .action-label {
				opacity: 1 !important;
			}
		`);
        }
        // High Contrast Border Color for Editor Actions
        const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
        if (contrastBorderColor) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .editor-actions {
				outline: 1px solid ${contrastBorderColor}
			}
		`);
        }
        // Hover Background
        const tabHoverBackground = theme.getColor(theme_1.TAB_HOVER_BACKGROUND);
        if (tabHoverBackground) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab:hover  {
				background-color: ${tabHoverBackground} !important;
			}
		`);
        }
        const tabUnfocusedHoverBackground = theme.getColor(theme_1.TAB_UNFOCUSED_HOVER_BACKGROUND);
        if (tabUnfocusedHoverBackground) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover  {
				background-color: ${tabUnfocusedHoverBackground} !important;
			}
		`);
        }
        // Hover Foreground
        const tabHoverForeground = theme.getColor(theme_1.TAB_HOVER_FOREGROUND);
        if (tabHoverForeground) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab:hover  {
				color: ${tabHoverForeground} !important;
			}
		`);
        }
        const tabUnfocusedHoverForeground = theme.getColor(theme_1.TAB_UNFOCUSED_HOVER_FOREGROUND);
        if (tabUnfocusedHoverForeground) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover  {
				color: ${tabUnfocusedHoverForeground} !important;
			}
		`);
        }
        // Hover Border
        //
        // Unfortunately we need to copy a lot of CSS over from the
        // multiEditorTabsControl.css because we want to reuse the same
        // styles we already have for the normal bottom-border.
        const tabHoverBorder = theme.getColor(theme_1.TAB_HOVER_BORDER);
        if (tabHoverBorder) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab:hover > .tab-border-bottom-container {
				display: block;
				position: absolute;
				left: 0;
				pointer-events: none;
				width: 100%;
				z-index: 10;
				bottom: 0;
				height: 1px;
				background-color: ${tabHoverBorder};
			}
		`);
        }
        const tabUnfocusedHoverBorder = theme.getColor(theme_1.TAB_UNFOCUSED_HOVER_BORDER);
        if (tabUnfocusedHoverBorder) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover > .tab-border-bottom-container  {
				display: block;
				position: absolute;
				left: 0;
				pointer-events: none;
				width: 100%;
				z-index: 10;
				bottom: 0;
				height: 1px;
				background-color: ${tabUnfocusedHoverBorder};
			}
		`);
        }
        // Fade out styles via linear gradient (when tabs are set to shrink or fixed)
        // But not when:
        // - in high contrast theme
        // - if we have a contrast border (which draws an outline - https://github.com/microsoft/vscode/issues/109117)
        // - on Safari (https://github.com/microsoft/vscode/issues/108996)
        if (!(0, theme_2.isHighContrast)(theme.type) && !browser_1.isSafari && !activeContrastBorderColor) {
            const workbenchBackground = (0, theme_1.WORKBENCH_BACKGROUND)(theme);
            const editorBackgroundColor = theme.getColor(colorRegistry_1.editorBackground);
            const editorGroupHeaderTabsBackground = theme.getColor(theme_1.EDITOR_GROUP_HEADER_TABS_BACKGROUND);
            const editorDragAndDropBackground = theme.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND);
            let adjustedTabBackground;
            if (editorGroupHeaderTabsBackground && editorBackgroundColor) {
                adjustedTabBackground = editorGroupHeaderTabsBackground.flatten(editorBackgroundColor, editorBackgroundColor, workbenchBackground);
            }
            let adjustedTabDragBackground;
            if (editorGroupHeaderTabsBackground && editorBackgroundColor && editorDragAndDropBackground && editorBackgroundColor) {
                adjustedTabDragBackground = editorGroupHeaderTabsBackground.flatten(editorBackgroundColor, editorDragAndDropBackground, editorBackgroundColor, workbenchBackground);
            }
            // Adjust gradient for focused and unfocused hover background
            const makeTabHoverBackgroundRule = (color, colorDrag, hasFocus = false) => `
			.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${hasFocus ? '.active' : ''} > .title .tabs-container > .tab.sizing-shrink:not(.dragged):not(.sticky-compact):hover > .tab-label > .monaco-icon-label-container::after,
			.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${hasFocus ? '.active' : ''} > .title .tabs-container > .tab.sizing-fixed:not(.dragged):not(.sticky-compact):hover > .tab-label > .monaco-icon-label-container::after {
				background: linear-gradient(to left, ${color}, transparent) !important;
			}

			.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${hasFocus ? '.active' : ''} > .title .tabs-container > .tab.sizing-shrink:not(.dragged):not(.sticky-compact):hover > .tab-label > .monaco-icon-label-container::after,
			.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${hasFocus ? '.active' : ''} > .title .tabs-container > .tab.sizing-fixed:not(.dragged):not(.sticky-compact):hover > .tab-label > .monaco-icon-label-container::after {
				background: linear-gradient(to left, ${colorDrag}, transparent) !important;
			}
		`;
            // Adjust gradient for (focused) hover background
            if (tabHoverBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabHoverBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabHoverBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabHoverBackgroundRule(adjustedColor, adjustedColorDrag, true));
            }
            // Adjust gradient for unfocused hover background
            if (tabUnfocusedHoverBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabUnfocusedHoverBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabUnfocusedHoverBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabHoverBackgroundRule(adjustedColor, adjustedColorDrag));
            }
            // Adjust gradient for drag and drop background
            if (editorDragAndDropBackground && adjustedTabDragBackground) {
                const adjustedColorDrag = editorDragAndDropBackground.flatten(adjustedTabDragBackground);
                collector.addRule(`
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container.active > .title .tabs-container > .tab.sizing-shrink.dragged-over:not(.active):not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after,
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container:not(.active) > .title .tabs-container > .tab.sizing-shrink.dragged-over:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after,
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container.active > .title .tabs-container > .tab.sizing-fixed.dragged-over:not(.active):not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after,
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container:not(.active) > .title .tabs-container > .tab.sizing-fixed.dragged-over:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after {
					background: linear-gradient(to left, ${adjustedColorDrag}, transparent) !important;
				}
		`);
            }
            const makeTabBackgroundRule = (color, colorDrag, focused, active) => `
				.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${focused ? '.active' : ':not(.active)'} > .title .tabs-container > .tab.sizing-shrink${active ? '.active' : ''}:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after,
				.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${focused ? '.active' : ':not(.active)'} > .title .tabs-container > .tab.sizing-fixed${active ? '.active' : ''}:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after {
					background: linear-gradient(to left, ${color}, transparent);
				}

				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${focused ? '.active' : ':not(.active)'} > .title .tabs-container > .tab.sizing-shrink${active ? '.active' : ''}:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after,
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${focused ? '.active' : ':not(.active)'} > .title .tabs-container > .tab.sizing-fixed${active ? '.active' : ''}:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after {
					background: linear-gradient(to left, ${colorDrag}, transparent);
				}
		`;
            // Adjust gradient for focused active tab background
            const tabActiveBackground = theme.getColor(theme_1.TAB_ACTIVE_BACKGROUND);
            if (tabActiveBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabActiveBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabActiveBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabBackgroundRule(adjustedColor, adjustedColorDrag, true, true));
            }
            // Adjust gradient for unfocused active tab background
            const tabUnfocusedActiveBackground = theme.getColor(theme_1.TAB_UNFOCUSED_ACTIVE_BACKGROUND);
            if (tabUnfocusedActiveBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabUnfocusedActiveBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabUnfocusedActiveBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabBackgroundRule(adjustedColor, adjustedColorDrag, false, true));
            }
            // Adjust gradient for focused inactive tab background
            const tabInactiveBackground = theme.getColor(theme_1.TAB_INACTIVE_BACKGROUND);
            if (tabInactiveBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabInactiveBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabInactiveBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabBackgroundRule(adjustedColor, adjustedColorDrag, true, false));
            }
            // Adjust gradient for unfocused inactive tab background
            const tabUnfocusedInactiveBackground = theme.getColor(theme_1.TAB_UNFOCUSED_INACTIVE_BACKGROUND);
            if (tabUnfocusedInactiveBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabUnfocusedInactiveBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabUnfocusedInactiveBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabBackgroundRule(adjustedColor, adjustedColorDrag, false, false));
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlFZGl0b3JUYWJzQ29udHJvbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9tdWx0aUVkaXRvclRhYnNDb250cm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFvRnpGLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEscUNBQWlCOztpQkFFcEMsb0JBQWUsR0FBRztZQUN6QyxPQUFPLEVBQUUsQ0FBVTtZQUNuQixLQUFLLEVBQUUsRUFBVztTQUNsQixBQUhzQyxDQUdyQztpQkFFc0IsY0FBUyxHQUFHO1lBQ25DLE9BQU8sRUFBRSxFQUFXO1lBQ3BCLE1BQU0sRUFBRSxFQUFXO1lBQ25CLEdBQUcsRUFBRSxHQUFZO1NBQ2pCLEFBSmdDLENBSS9CO2lCQUVzQixpQ0FBNEIsR0FBRyxJQUFJLEFBQVAsQ0FBUTtpQkFFcEMsZ0NBQTJCLEdBQUcsR0FBRyxBQUFOLENBQU87aUJBQ2xDLG1DQUE4QixHQUFHLEdBQUcsQUFBTixDQUFPO1FBK0I3RCxZQUNDLE1BQW1CLEVBQ25CLGVBQWlDLEVBQ2pDLFVBQTZCLEVBQzdCLFNBQTJCLEVBQzNCLFNBQW9DLEVBQ2Ysa0JBQXVDLEVBQ3JDLG9CQUEyQyxFQUM5QyxpQkFBcUMsRUFDckMsaUJBQXFDLEVBQ25DLG1CQUF5QyxFQUMzQyxpQkFBcUMsRUFDMUMsWUFBMkIsRUFDMUIsYUFBaUQsRUFDbkQsV0FBMEMsRUFDbEMsMkJBQWtFLEVBQ2hFLHFCQUE2QyxFQUN2RCxXQUF5QjtZQUV2QyxLQUFLLENBQUMsTUFBTSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxpQkFB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