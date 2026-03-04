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
define(["require", "exports", "vs/nls", "vs/workbench/browser/part", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/workbench/browser/actions/layoutActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dom", "vs/base/common/types", "vs/workbench/browser/parts/titlebar/menubarControl", "vs/platform/configuration/common/configuration", "vs/platform/window/common/window", "vs/base/common/actions", "vs/base/browser/keyboardEvent", "vs/workbench/browser/parts/paneCompositeBar", "vs/workbench/browser/parts/globalCompositeBar", "vs/platform/storage/common/storage", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/workbench/common/views", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/css!./media/activitybarpart", "vs/css!./media/activityaction"], function (require, exports, nls_1, part_1, layoutService_1, instantiation_1, lifecycle_1, layoutActions_1, themeService_1, theme_1, colorRegistry_1, dom_1, types_1, menubarControl_1, configuration_1, window_1, actions_1, keyboardEvent_1, paneCompositeBar_1, globalCompositeBar_1, storage_1, actions_2, contextkey_1, actionCommonCategories_1, menuEntryActionViewItem_1, views_1, panecomposite_1, extensions_1, environmentService_1) {
    "use strict";
    var ActivitybarPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivityBarCompositeBar = exports.ActivitybarPart = void 0;
    let ActivitybarPart = class ActivitybarPart extends part_1.Part {
        static { ActivitybarPart_1 = this; }
        static { this.ACTION_HEIGHT = 48; }
        static { this.pinnedViewContainersKey = 'workbench.activity.pinnedViewlets2'; }
        static { this.placeholderViewContainersKey = 'workbench.activity.placeholderViewlets'; }
        static { this.viewContainersWorkspaceStateKey = 'workbench.activity.viewletsWorkspaceState'; }
        constructor(paneCompositePart, instantiationService, layoutService, themeService, storageService) {
            super("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.paneCompositePart = paneCompositePart;
            this.instantiationService = instantiationService;
            //#region IView
            this.minimumWidth = 48;
            this.maximumWidth = 48;
            this.minimumHeight = 0;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            //#endregion
            this.compositeBar = this._register(new lifecycle_1.MutableDisposable());
        }
        createCompositeBar() {
            return this.instantiationService.createInstance(ActivityBarCompositeBar, {
                partContainerClass: 'activitybar',
                pinnedViewContainersKey: ActivitybarPart_1.pinnedViewContainersKey,
                placeholderViewContainersKey: ActivitybarPart_1.placeholderViewContainersKey,
                viewContainersWorkspaceStateKey: ActivitybarPart_1.viewContainersWorkspaceStateKey,
                orientation: 1 /* ActionsOrientation.VERTICAL */,
                icon: true,
                iconSize: 24,
                activityHoverOptions: {
                    position: () => this.layoutService.getSideBarPosition() === 0 /* Position.LEFT */ ? 1 /* HoverPosition.RIGHT */ : 0 /* HoverPosition.LEFT */,
                },
                preventLoopNavigation: true,
                recomputeSizes: false,
                fillExtraContextMenuActions: (actions, e) => { },
                compositeSize: 52,
                colors: (theme) => ({
                    activeForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_FOREGROUND),
                    inactiveForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_INACTIVE_FOREGROUND),
                    activeBorderColor: theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BORDER),
                    activeBackground: theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BACKGROUND),
                    badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                    badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                    dragAndDropBorder: theme.getColor(theme_1.ACTIVITY_BAR_DRAG_AND_DROP_BORDER),
                    activeBackgroundColor: undefined, inactiveBackgroundColor: undefined, activeBorderBottomColor: undefined,
                }),
                overflowActionSize: ActivitybarPart_1.ACTION_HEIGHT,
            }, "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */, this.paneCompositePart, true);
        }
        createContentArea(parent) {
            this.element = parent;
            this.content = (0, dom_1.append)(this.element, (0, dom_1.$)('.content'));
            if (this.layoutService.isVisible("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */)) {
                this.show();
            }
            return this.content;
        }
        getPinnedPaneCompositeIds() {
            return this.compositeBar.value?.getPinnedPaneCompositeIds() ?? [];
        }
        getVisiblePaneCompositeIds() {
            return this.compositeBar.value?.getVisiblePaneCompositeIds() ?? [];
        }
        focus() {
            this.compositeBar.value?.focus();
        }
        updateStyles() {
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            const background = this.getColor(theme_1.ACTIVITY_BAR_BACKGROUND) || '';
            container.style.backgroundColor = background;
            const borderColor = this.getColor(theme_1.ACTIVITY_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
            container.classList.toggle('bordered', !!borderColor);
            container.style.borderColor = borderColor ? borderColor : '';
        }
        show(focus) {
            if (!this.content) {
                return;
            }
            if (!this.compositeBar.value) {
                this.compositeBar.value = this.createCompositeBar();
                this.compositeBar.value.create(this.content);
                if (this.dimension) {
                    this.layout(this.dimension.width, this.dimension.height);
                }
            }
            if (focus) {
                this.focus();
            }
        }
        hide() {
            if (!this.compositeBar.value) {
                return;
            }
            this.compositeBar.clear();
            if (this.content) {
                (0, dom_1.clearNode)(this.content);
            }
        }
        layout(width, height) {
            super.layout(width, height, 0, 0);
            if (!this.compositeBar.value) {
                return;
            }
            // Layout contents
            const contentAreaSize = super.layoutContents(width, height).contentSize;
            // Layout composite bar
            this.compositeBar.value.layout(width, contentAreaSize.height);
        }
        toJSON() {
            return {
                type: "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */
            };
        }
    };
    exports.ActivitybarPart = ActivitybarPart;
    exports.ActivitybarPart = ActivitybarPart = ActivitybarPart_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, themeService_1.IThemeService),
        __param(4, storage_1.IStorageService)
    ], ActivitybarPart);
    let ActivityBarCompositeBar = class ActivityBarCompositeBar extends paneCompositeBar_1.PaneCompositeBar {
        constructor(options, part, paneCompositePart, showGlobalActivities, instantiationService, storageService, extensionService, viewDescriptorService, contextKeyService, environmentService, configurationService, menuService, layoutService) {
            super({
                ...options,
                fillExtraContextMenuActions: (actions, e) => {
                    options.fillExtraContextMenuActions(actions, e);
                    this.fillContextMenuActions(actions, e);
                }
            }, part, paneCompositePart, instantiationService, storageService, extensionService, viewDescriptorService, contextKeyService, environmentService, layoutService);
            this.configurationService = configurationService;
            this.menuService = menuService;
            this.keyboardNavigationDisposables = this._register(new lifecycle_1.DisposableStore());
            if (showGlobalActivities) {
                this.globalCompositeBar = this._register(instantiationService.createInstance(globalCompositeBar_1.GlobalCompositeBar, () => this.getContextMenuActions(), (theme) => this.options.colors(theme), this.options.activityHoverOptions));
            }
            // Register for configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.menuBarVisibility')) {
                    if ((0, window_1.getMenuBarVisibility)(this.configurationService) === 'compact') {
                        this.installMenubar();
                    }
                    else {
                        this.uninstallMenubar();
                    }
                }
            }));
        }
        fillContextMenuActions(actions, e) {
            // Menu
            const menuBarVisibility = (0, window_1.getMenuBarVisibility)(this.configurationService);
            if (menuBarVisibility === 'compact' || menuBarVisibility === 'hidden' || menuBarVisibility === 'toggle') {
                actions.unshift(...[(0, actions_1.toAction)({ id: 'toggleMenuVisibility', label: (0, nls_1.localize)('menu', "Menu"), checked: menuBarVisibility === 'compact', run: () => this.configurationService.updateValue('window.menuBarVisibility', menuBarVisibility === 'compact' ? 'toggle' : 'compact') }), new actions_1.Separator()]);
            }
            if (menuBarVisibility === 'compact' && this.menuBarContainer && e?.target) {
                if ((0, dom_1.isAncestor)(e.target, this.menuBarContainer)) {
                    actions.unshift(...[(0, actions_1.toAction)({ id: 'hideCompactMenu', label: (0, nls_1.localize)('hideMenu', "Hide Menu"), run: () => this.configurationService.updateValue('window.menuBarVisibility', 'toggle') }), new actions_1.Separator()]);
                }
            }
            // Global Composite Bar
            if (this.globalCompositeBar) {
                actions.push(new actions_1.Separator());
                actions.push(...this.globalCompositeBar.getContextMenuActions());
            }
            actions.push(new actions_1.Separator());
            actions.push(...this.getActivityBarContextMenuActions());
        }
        uninstallMenubar() {
            if (this.menuBar) {
                this.menuBar.dispose();
                this.menuBar = undefined;
            }
            if (this.menuBarContainer) {
                this.menuBarContainer.remove();
                this.menuBarContainer = undefined;
            }
        }
        installMenubar() {
            if (this.menuBar) {
                return; // prevent menu bar from installing twice #110720
            }
            this.menuBarContainer = document.createElement('div');
            this.menuBarContainer.classList.add('menubar');
            const content = (0, types_1.assertIsDefined)(this.element);
            content.prepend(this.menuBarContainer);
            // Menubar: install a custom menu bar depending on configuration
            this.menuBar = this._register(this.instantiationService.createInstance(menubarControl_1.CustomMenubarControl));
            this.menuBar.create(this.menuBarContainer);
        }
        registerKeyboardNavigationListeners() {
            this.keyboardNavigationDisposables.clear();
            // Up/Down or Left/Right arrow on compact menu
            if (this.menuBarContainer) {
                this.keyboardNavigationDisposables.add((0, dom_1.addDisposableListener)(this.menuBarContainer, dom_1.EventType.KEY_DOWN, e => {
                    const kbEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (kbEvent.equals(18 /* KeyCode.DownArrow */) || kbEvent.equals(17 /* KeyCode.RightArrow */)) {
                        this.focus();
                    }
                }));
            }
            // Up/Down on Activity Icons
            if (this.compositeBarContainer) {
                this.keyboardNavigationDisposables.add((0, dom_1.addDisposableListener)(this.compositeBarContainer, dom_1.EventType.KEY_DOWN, e => {
                    const kbEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (kbEvent.equals(18 /* KeyCode.DownArrow */) || kbEvent.equals(17 /* KeyCode.RightArrow */)) {
                        this.globalCompositeBar?.focus();
                    }
                    else if (kbEvent.equals(16 /* KeyCode.UpArrow */) || kbEvent.equals(15 /* KeyCode.LeftArrow */)) {
                        this.menuBar?.toggleFocus();
                    }
                }));
            }
            // Up arrow on global icons
            if (this.globalCompositeBar) {
                this.keyboardNavigationDisposables.add((0, dom_1.addDisposableListener)(this.globalCompositeBar.element, dom_1.EventType.KEY_DOWN, e => {
                    const kbEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (kbEvent.equals(16 /* KeyCode.UpArrow */) || kbEvent.equals(15 /* KeyCode.LeftArrow */)) {
                        this.focus(this.getVisiblePaneCompositeIds().length - 1);
                    }
                }));
            }
        }
        create(parent) {
            this.element = parent;
            // Install menubar if compact
            if ((0, window_1.getMenuBarVisibility)(this.configurationService) === 'compact') {
                this.installMenubar();
            }
            // View Containers action bar
            this.compositeBarContainer = super.create(this.element);
            // Global action bar
            if (this.globalCompositeBar) {
                this.globalCompositeBar.create(this.element);
            }
            // Keyboard Navigation
            this.registerKeyboardNavigationListeners();
            return this.compositeBarContainer;
        }
        layout(width, height) {
            if (this.menuBarContainer) {
                if (this.options.orientation === 1 /* ActionsOrientation.VERTICAL */) {
                    height -= this.menuBarContainer.clientHeight;
                }
                else {
                    width -= this.menuBarContainer.clientWidth;
                }
            }
            if (this.globalCompositeBar) {
                if (this.options.orientation === 1 /* ActionsOrientation.VERTICAL */) {
                    height -= (this.globalCompositeBar.size() * ActivitybarPart.ACTION_HEIGHT);
                }
                else {
                    width -= this.globalCompositeBar.element.clientWidth;
                }
            }
            super.layout(width, height);
        }
        getActivityBarContextMenuActions() {
            const activityBarPositionMenu = this.menuService.createMenu(actions_2.MenuId.ActivityBarPositionMenu, this.contextKeyService);
            const positionActions = [];
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(activityBarPositionMenu, { shouldForwardArgs: true, renderShortTitle: true }, { primary: [], secondary: positionActions });
            activityBarPositionMenu.dispose();
            return [
                new actions_1.SubmenuAction('workbench.action.panel.position', (0, nls_1.localize)('activity bar position', "Activity Bar Position"), positionActions),
                (0, actions_1.toAction)({ id: layoutActions_1.ToggleSidebarPositionAction.ID, label: layoutActions_1.ToggleSidebarPositionAction.getLabel(this.layoutService), run: () => this.instantiationService.invokeFunction(accessor => new layoutActions_1.ToggleSidebarPositionAction().run(accessor)) })
            ];
        }
    };
    exports.ActivityBarCompositeBar = ActivityBarCompositeBar;
    exports.ActivityBarCompositeBar = ActivityBarCompositeBar = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, storage_1.IStorageService),
        __param(6, extensions_1.IExtensionService),
        __param(7, views_1.IViewDescriptorService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, actions_2.IMenuService),
        __param(12, layoutService_1.IWorkbenchLayoutService)
    ], ActivityBarCompositeBar);
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.activityBarLocation.default',
                title: {
                    ...(0, nls_1.localize2)('positionActivityBarDefault', 'Move Activity Bar to Side'),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miDefaultActivityBar', comment: ['&& denotes a mnemonic'] }, "&&Default"),
                },
                shortTitle: (0, nls_1.localize)('default', "Default"),
                category: actionCommonCategories_1.Categories.View,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "default" /* ActivityBarPosition.DEFAULT */),
                menu: [{
                        id: actions_2.MenuId.ActivityBarPositionMenu,
                        order: 1
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.notEquals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "default" /* ActivityBarPosition.DEFAULT */),
                    }]
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            configurationService.updateValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, "default" /* ActivityBarPosition.DEFAULT */);
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.activityBarLocation.top',
                title: {
                    ...(0, nls_1.localize2)('positionActivityBarTop', 'Move Activity Bar to Top'),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miTopActivityBar', comment: ['&& denotes a mnemonic'] }, "&&Top"),
                },
                shortTitle: (0, nls_1.localize)('top', "Top"),
                category: actionCommonCategories_1.Categories.View,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "top" /* ActivityBarPosition.TOP */),
                menu: [{
                        id: actions_2.MenuId.ActivityBarPositionMenu,
                        order: 2
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.notEquals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "top" /* ActivityBarPosition.TOP */),
                    }]
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            configurationService.updateValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, "top" /* ActivityBarPosition.TOP */);
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.activityBarLocation.bottom',
                title: {
                    ...(0, nls_1.localize2)('positionActivityBarBottom', 'Move Activity Bar to Bottom'),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miBottomActivityBar', comment: ['&& denotes a mnemonic'] }, "&&Bottom"),
                },
                shortTitle: (0, nls_1.localize)('bottom', "Bottom"),
                category: actionCommonCategories_1.Categories.View,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "bottom" /* ActivityBarPosition.BOTTOM */),
                menu: [{
                        id: actions_2.MenuId.ActivityBarPositionMenu,
                        order: 3
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.notEquals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "bottom" /* ActivityBarPosition.BOTTOM */),
                    }]
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            configurationService.updateValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, "bottom" /* ActivityBarPosition.BOTTOM */);
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.activityBarLocation.hide',
                title: {
                    ...(0, nls_1.localize2)('hideActivityBar', 'Hide Activity Bar'),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miHideActivityBar', comment: ['&& denotes a mnemonic'] }, "&&Hidden"),
                },
                shortTitle: (0, nls_1.localize)('hide', "Hidden"),
                category: actionCommonCategories_1.Categories.View,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "hidden" /* ActivityBarPosition.HIDDEN */),
                menu: [{
                        id: actions_2.MenuId.ActivityBarPositionMenu,
                        order: 4
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.notEquals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "hidden" /* ActivityBarPosition.HIDDEN */),
                    }]
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            configurationService.updateValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, "hidden" /* ActivityBarPosition.HIDDEN */);
        }
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        submenu: actions_2.MenuId.ActivityBarPositionMenu,
        title: (0, nls_1.localize)('positionActivituBar', "Activity Bar Position"),
        group: '3_workbench_layout_move',
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ViewContainerTitleContext, {
        submenu: actions_2.MenuId.ActivityBarPositionMenu,
        title: (0, nls_1.localize)('positionActivituBar', "Activity Bar Position"),
        when: contextkey_1.ContextKeyExpr.equals('viewContainerLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)),
        group: '3_workbench_layout_move',
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ViewTitleContext, {
        submenu: actions_2.MenuId.ActivityBarPositionMenu,
        title: (0, nls_1.localize)('positionActivituBar', "Activity Bar Position"),
        when: contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)),
        group: '3_workbench_layout_move',
        order: 1
    });
    class SwitchSideBarViewAction extends actions_2.Action2 {
        constructor(desc, offset) {
            super(desc);
            this.offset = offset;
        }
        async run(accessor) {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const visibleViewletIds = paneCompositeService.getVisiblePaneCompositeIds(0 /* ViewContainerLocation.Sidebar */);
            const activeViewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (!activeViewlet) {
                return;
            }
            let targetViewletId;
            for (let i = 0; i < visibleViewletIds.length; i++) {
                if (visibleViewletIds[i] === activeViewlet.getId()) {
                    targetViewletId = visibleViewletIds[(i + visibleViewletIds.length + this.offset) % visibleViewletIds.length];
                    break;
                }
            }
            await paneCompositeService.openPaneComposite(targetViewletId, 0 /* ViewContainerLocation.Sidebar */, true);
        }
    }
    (0, actions_2.registerAction2)(class PreviousSideBarViewAction extends SwitchSideBarViewAction {
        constructor() {
            super({
                id: 'workbench.action.previousSideBarView',
                title: (0, nls_1.localize2)('previousSideBarView', 'Previous Primary Side Bar View'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, -1);
        }
    });
    (0, actions_2.registerAction2)(class NextSideBarViewAction extends SwitchSideBarViewAction {
        constructor() {
            super({
                id: 'workbench.action.nextSideBarView',
                title: (0, nls_1.localize2)('nextSideBarView', 'Next Primary Side Bar View'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, 1);
        }
    });
    (0, actions_2.registerAction2)(class FocusActivityBarAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.focusActivityBar',
                title: (0, nls_1.localize2)('focusActivityBar', 'Focus Activity Bar'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.focusPart("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */);
        }
    });
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const activityBarActiveBorderColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BORDER);
        if (activityBarActiveBorderColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked .active-item-indicator:before {
				border-left-color: ${activityBarActiveBorderColor};
			}
		`);
        }
        const activityBarActiveFocusBorderColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_FOCUS_BORDER);
        if (activityBarActiveFocusBorderColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:focus::before {
				visibility: hidden;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:focus .active-item-indicator:before {
				visibility: visible;
				border-left-color: ${activityBarActiveFocusBorderColor};
			}
		`);
        }
        const activityBarActiveBackgroundColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BACKGROUND);
        if (activityBarActiveBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked .active-item-indicator {
				z-index: 0;
				background-color: ${activityBarActiveBackgroundColor};
			}
		`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const outline = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (outline) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:before {
				content: "";
				position: absolute;
				top: 8px;
				left: 8px;
				height: 32px;
				width: 32px;
				z-index: 1;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.profile-activity-item:before {
				top: -6px;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:hover:before {
				outline: 1px solid;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover:before {
				outline: 1px dashed;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus .active-item-indicator:before {
				border-left-color: ${outline};
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover:before {
				outline-color: ${outline};
			}
		`);
        }
        // Styling without outline color
        else {
            const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusBorderColor) {
                collector.addRule(`
				.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus .active-item-indicator:before {
						border-left-color: ${focusBorderColor};
					}
				`);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aXZpdHliYXJQYXJ0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvYWN0aXZpdHliYXIvYWN0aXZpdHliYXJQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxQ3pGLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsV0FBSTs7aUJBRXhCLGtCQUFhLEdBQUcsRUFBRSxBQUFMLENBQU07aUJBRW5CLDRCQUF1QixHQUFHLG9DQUFvQyxBQUF2QyxDQUF3QztpQkFDL0QsaUNBQTRCLEdBQUcsd0NBQXdDLEFBQTNDLENBQTRDO2lCQUN4RSxvQ0FBK0IsR0FBRywyQ0FBMkMsQUFBOUMsQ0FBK0M7UUFjOUYsWUFDa0IsaUJBQXFDLEVBQy9CLG9CQUE0RCxFQUMxRCxhQUFzQyxFQUNoRCxZQUEyQixFQUN6QixjQUErQjtZQUVoRCxLQUFLLDZEQUF5QixFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBTi9FLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDZCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBZHBGLGVBQWU7WUFFTixpQkFBWSxHQUFXLEVBQUUsQ0FBQztZQUMxQixpQkFBWSxHQUFXLEVBQUUsQ0FBQztZQUMxQixrQkFBYSxHQUFXLENBQUMsQ0FBQztZQUMxQixrQkFBYSxHQUFXLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztZQUUxRCxZQUFZO1lBRUssaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQW9CLENBQUMsQ0FBQztRQVcxRixDQUFDO1FBRU8sa0JBQWtCO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLG9CQUFv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