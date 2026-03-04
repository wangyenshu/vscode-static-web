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
define(["require", "exports", "vs/nls", "vs/workbench/browser/part", "vs/base/browser/browser", "vs/platform/window/common/window", "vs/platform/contextview/browser/contextView", "vs/base/browser/mouseEvent", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/common/theme", "vs/base/common/platform", "vs/base/common/color", "vs/base/browser/dom", "vs/workbench/browser/parts/titlebar/menubarControl", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/workbench/services/layout/browser/layoutService", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/host/browser/host", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/browser/parts/titlebar/windowTitle", "vs/workbench/browser/parts/titlebar/commandCenterControl", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/browser/toolbar", "vs/workbench/common/activity", "vs/workbench/browser/parts/globalCompositeBar", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/actions", "vs/workbench/services/editor/common/editorService", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/keybinding/common/keybinding", "vs/workbench/browser/parts/editor/editorTabsControl", "vs/base/browser/window", "vs/workbench/browser/parts/titlebar/titlebarActions", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./media/titlebarpart"], function (require, exports, nls_1, part_1, browser_1, window_1, contextView_1, mouseEvent_1, configuration_1, lifecycle_1, environmentService_1, themeService_1, themables_1, theme_1, platform_1, color_1, dom_1, menubarControl_1, instantiation_1, event_1, storage_1, layoutService_1, menuEntryActionViewItem_1, actions_1, contextkey_1, host_1, codicons_1, iconRegistry_1, windowTitle_1, commandCenterControl_1, actionCommonCategories_1, toolbar_1, activity_1, globalCompositeBar_1, editorGroupsService_1, actions_2, editorService_1, actionbar_1, editorCommands_1, editorPane_1, keybinding_1, editorTabsControl_1, window_2, titlebarActions_1, hoverDelegateFactory_1) {
    "use strict";
    var AuxiliaryBrowserTitlebarPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuxiliaryBrowserTitlebarPart = exports.MainBrowserTitlebarPart = exports.BrowserTitlebarPart = exports.BrowserTitleService = void 0;
    let BrowserTitleService = class BrowserTitleService extends part_1.MultiWindowParts {
        constructor(instantiationService, storageService, themeService) {
            super('workbench.titleService', themeService, storageService);
            this.instantiationService = instantiationService;
            this.mainPart = this._register(this.createMainTitlebarPart());
            //#endregion
            //#region Service Implementation
            this.onMenubarVisibilityChange = this.mainPart.onMenubarVisibilityChange;
            this.properties = undefined;
            this.variables = [];
            this._register(this.registerPart(this.mainPart));
            this.registerActions();
        }
        createMainTitlebarPart() {
            return this.instantiationService.createInstance(MainBrowserTitlebarPart);
        }
        registerActions() {
            // Focus action
            const that = this;
            this._register((0, actions_1.registerAction2)(class FocusTitleBar extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.action.focusTitleBar`,
                        title: (0, nls_1.localize2)('focusTitleBar', 'Focus Title Bar'),
                        category: actionCommonCategories_1.Categories.View,
                        f1: true,
                    });
                }
                run() {
                    that.getPartByDocument((0, dom_1.getActiveDocument)()).focus();
                }
            }));
        }
        //#region Auxiliary Titlebar Parts
        createAuxiliaryTitlebarPart(container, editorGroupsContainer) {
            const titlebarPartContainer = document.createElement('div');
            titlebarPartContainer.classList.add('part', 'titlebar');
            titlebarPartContainer.setAttribute('role', 'none');
            titlebarPartContainer.style.position = 'relative';
            container.insertBefore(titlebarPartContainer, container.firstChild); // ensure we are first element
            const disposables = new lifecycle_1.DisposableStore();
            const titlebarPart = this.doCreateAuxiliaryTitlebarPart(titlebarPartContainer, editorGroupsContainer);
            disposables.add(this.registerPart(titlebarPart));
            disposables.add(event_1.Event.runAndSubscribe(titlebarPart.onDidChange, () => titlebarPartContainer.style.height = `${titlebarPart.height}px`));
            titlebarPart.create(titlebarPartContainer);
            if (this.properties) {
                titlebarPart.updateProperties(this.properties);
            }
            if (this.variables.length) {
                titlebarPart.registerVariables(this.variables);
            }
            event_1.Event.once(titlebarPart.onWillDispose)(() => disposables.dispose());
            return titlebarPart;
        }
        doCreateAuxiliaryTitlebarPart(container, editorGroupsContainer) {
            return this.instantiationService.createInstance(AuxiliaryBrowserTitlebarPart, container, editorGroupsContainer, this.mainPart);
        }
        updateProperties(properties) {
            this.properties = properties;
            for (const part of this.parts) {
                part.updateProperties(properties);
            }
        }
        registerVariables(variables) {
            this.variables.push(...variables);
            for (const part of this.parts) {
                part.registerVariables(variables);
            }
        }
    };
    exports.BrowserTitleService = BrowserTitleService;
    exports.BrowserTitleService = BrowserTitleService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, storage_1.IStorageService),
        __param(2, themeService_1.IThemeService)
    ], BrowserTitleService);
    let BrowserTitlebarPart = class BrowserTitlebarPart extends part_1.Part {
        get minimumHeight() {
            const value = this.isCommandCenterVisible || (platform_1.isWeb && (0, browser_1.isWCOEnabled)()) ? 35 : 30;
            return value / (this.preventZoom ? (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element)) : 1);
        }
        get maximumHeight() { return this.minimumHeight; }
        constructor(id, targetWindow, editorGroupsContainer, contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, editorGroupService, editorService, menuService, keybindingService) {
            super(id, { hasTitle: false }, themeService, storageService, layoutService);
            this.contextMenuService = contextMenuService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.contextKeyService = contextKeyService;
            this.hostService = hostService;
            this.editorGroupService = editorGroupService;
            this.menuService = menuService;
            this.keybindingService = keybindingService;
            //#region IView
            this.minimumWidth = 0;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            //#endregion
            //#region Events
            this._onMenubarVisibilityChange = this._register(new event_1.Emitter());
            this.onMenubarVisibilityChange = this._onMenubarVisibilityChange.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this.actionToolBarDisposable = this._register(new lifecycle_1.DisposableStore());
            this.editorActionsChangeDisposable = this._register(new lifecycle_1.DisposableStore());
            this.editorToolbarMenuDisposables = this._register(new lifecycle_1.DisposableStore());
            this.layoutToolbarMenuDisposables = this._register(new lifecycle_1.DisposableStore());
            this.activityToolbarDisposables = this._register(new lifecycle_1.DisposableStore());
            this.titleDisposables = this._register(new lifecycle_1.DisposableStore());
            this.titleBarStyle = (0, window_1.getTitleBarStyle)(this.configurationService);
            this.isInactive = false;
            this.isAuxiliary = editorGroupsContainer !== 'main';
            this.editorService = editorService.createScoped(editorGroupsContainer, this._store);
            this.editorGroupsContainer = editorGroupsContainer === 'main' ? editorGroupService.mainPart : editorGroupsContainer;
            this.windowTitle = this._register(instantiationService.createInstance(windowTitle_1.WindowTitle, targetWindow, editorGroupsContainer));
            this.hoverDelegate = this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            this.registerListeners((0, dom_1.getWindowId)(targetWindow));
        }
        registerListeners(targetWindowId) {
            this._register(this.hostService.onDidChangeFocus(focused => focused ? this.onFocus() : this.onBlur()));
            this._register(this.hostService.onDidChangeActiveWindow(windowId => windowId === targetWindowId ? this.onFocus() : this.onBlur()));
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChanged(e)));
            this._register(this.editorGroupService.onDidChangeEditorPartOptions(e => this.onEditorPartConfigurationChange(e)));
        }
        onBlur() {
            this.isInactive = true;
            this.updateStyles();
        }
        onFocus() {
            this.isInactive = false;
            this.updateStyles();
        }
        onEditorPartConfigurationChange({ oldPartOptions, newPartOptions }) {
            if (oldPartOptions.editorActionsLocation !== newPartOptions.editorActionsLocation ||
                oldPartOptions.showTabs !== newPartOptions.showTabs) {
                if ((0, window_1.hasCustomTitlebar)(this.configurationService, this.titleBarStyle) && this.actionToolBar) {
                    this.createActionToolBar();
                    this.createActionToolBarMenus({ editorActions: true });
                    this._onDidChange.fire(undefined);
                }
            }
        }
        onConfigurationChanged(event) {
            // Custom menu bar (disabled if auxiliary)
            if (!this.isAuxiliary && !(0, window_1.hasNativeTitlebar)(this.configurationService, this.titleBarStyle) && (!platform_1.isMacintosh || platform_1.isWeb)) {
                if (event.affectsConfiguration('window.menuBarVisibility')) {
                    if (this.currentMenubarVisibility === 'compact') {
                        this.uninstallMenubar();
                    }
                    else {
                        this.installMenubar();
                    }
                }
            }
            // Actions
            if ((0, window_1.hasCustomTitlebar)(this.configurationService, this.titleBarStyle) && this.actionToolBar) {
                const affectsLayoutControl = event.affectsConfiguration("workbench.layoutControl.enabled" /* LayoutSettings.LAYOUT_ACTIONS */);
                const affectsActivityControl = event.affectsConfiguration("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */);
                if (affectsLayoutControl || affectsActivityControl) {
                    this.createActionToolBarMenus({ layoutActions: affectsLayoutControl, activityActions: affectsActivityControl });
                    this._onDidChange.fire(undefined);
                }
            }
            // Command Center
            if (event.affectsConfiguration("window.commandCenter" /* LayoutSettings.COMMAND_CENTER */)) {
                this.createTitle();
                this._onDidChange.fire(undefined);
            }
        }
        installMenubar() {
            if (this.menubar) {
                return; // If the menubar is already installed, skip
            }
            this.customMenubar = this._register(this.instantiationService.createInstance(menubarControl_1.CustomMenubarControl));
            this.menubar = (0, dom_1.append)(this.leftContent, (0, dom_1.$)('div.menubar'));
            this.menubar.setAttribute('role', 'menubar');
            this._register(this.customMenubar.onVisibilityChange(e => this.onMenubarVisibilityChanged(e)));
            this.customMenubar.create(this.menubar);
        }
        uninstallMenubar() {
            this.customMenubar?.dispose();
            this.customMenubar = undefined;
            this.menubar?.remove();
            this.menubar = undefined;
            this.onMenubarVisibilityChanged(false);
        }
        onMenubarVisibilityChanged(visible) {
            if (platform_1.isWeb || platform_1.isWindows || platform_1.isLinux) {
                if (this.lastLayoutDimensions) {
                    this.layout(this.lastLayoutDimensions.width, this.lastLayoutDimensions.height);
                }
                this._onMenubarVisibilityChange.fire(visible);
            }
        }
        updateProperties(properties) {
            this.windowTitle.updateProperties(properties);
        }
        registerVariables(variables) {
            this.windowTitle.registerVariables(variables);
        }
        createContentArea(parent) {
            this.element = parent;
            this.rootContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.titlebar-container'));
            this.leftContent = (0, dom_1.append)(this.rootContainer, (0, dom_1.$)('.titlebar-left'));
            this.centerContent = (0, dom_1.append)(this.rootContainer, (0, dom_1.$)('.titlebar-center'));
            this.rightContent = (0, dom_1.append)(this.rootContainer, (0, dom_1.$)('.titlebar-right'));
            // App Icon (Native Windows/Linux and Web)
            if (!platform_1.isMacintosh && !platform_1.isWeb && !(0, window_1.hasNativeTitlebar)(this.configurationService, this.titleBarStyle)) {
                this.appIcon = (0, dom_1.prepend)(this.leftContent, (0, dom_1.$)('a.window-appicon'));
                // Web-only home indicator and menu (not for auxiliary windows)
                if (!this.isAuxiliary && platform_1.isWeb) {
                    const homeIndicator = this.environmentService.options?.homeIndicator;
                    if (homeIndicator) {
                        const icon = (0, iconRegistry_1.getIconRegistry)().getIcon(homeIndicator.icon) ? { id: homeIndicator.icon } : codicons_1.Codicon.code;
                        this.appIcon.setAttribute('href', homeIndicator.href);
                        this.appIcon.classList.add(...themables_1.ThemeIcon.asClassNameArray(icon));
                        this.appIconBadge = document.createElement('div');
                        this.appIconBadge.classList.add('home-bar-icon-badge');
                        this.appIcon.appendChild(this.appIconBadge);
                    }
                }
            }
            // Draggable region that we can manipulate for #52522
            this.dragRegion = (0, dom_1.prepend)(this.rootContainer, (0, dom_1.$)('div.titlebar-drag-region'));
            // Menubar: install a custom menu bar depending on configuration
            if (!this.isAuxiliary &&
                !(0, window_1.hasNativeTitlebar)(this.configurationService, this.titleBarStyle) &&
                (!platform_1.isMacintosh || platform_1.isWeb) &&
                this.currentMenubarVisibility !== 'compact') {
                this.installMenubar();
            }
            // Title
            this.title = (0, dom_1.append)(this.centerContent, (0, dom_1.$)('div.window-title'));
            this.createTitle();
            // Create Toolbar Actions
            if ((0, window_1.hasCustomTitlebar)(this.configurationService, this.titleBarStyle)) {
                this.actionToolBarElement = (0, dom_1.append)(this.rightContent, (0, dom_1.$)('div.action-toolbar-container'));
                this.createActionToolBar();
                this.createActionToolBarMenus();
            }
            let primaryControlLocation = platform_1.isMacintosh ? 'left' : 'right';
            if (platform_1.isMacintosh && platform_1.isNative) {
                // Check if the locale is RTL, macOS will move traffic lights in RTL locales
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/textInfo
                const localeInfo = new Intl.Locale(platform_1.platformLocale);
                if (localeInfo?.textInfo?.direction === 'rtl') {
                    primaryControlLocation = 'right';
                }
            }
            if (!(0, window_1.hasNativeTitlebar)(this.configurationService, this.titleBarStyle)) {
                this.primaryWindowControls = (0, dom_1.append)(primaryControlLocation === 'left' ? this.leftContent : this.rightContent, (0, dom_1.$)('div.window-controls-container.primary'));
                (0, dom_1.append)(primaryControlLocation === 'left' ? this.rightContent : this.leftContent, (0, dom_1.$)('div.window-controls-container.secondary'));
            }
            // Context menu over title bar: depending on the OS and the location of the click this will either be
            // the overall context menu for the entire title bar or a specific title context menu.
            // Windows / Linux: we only support the overall context menu on the title bar
            // macOS: we support both the overall context menu and the title context menu.
            //        in addition, we allow Cmd+click to bring up the title context menu.
            {
                this._register((0, dom_1.addDisposableListener)(this.rootContainer, dom_1.EventType.CONTEXT_MENU, e => {
                    dom_1.EventHelper.stop(e);
                    let targetMenu;
                    if (platform_1.isMacintosh && e.target instanceof HTMLElement && (0, dom_1.isAncestor)(e.target, this.title)) {
                        targetMenu = actions_1.MenuId.TitleBarTitleContext;
                    }
                    else {
                        targetMenu = actions_1.MenuId.TitleBarContext;
                    }
                    this.onContextMenu(e, targetMenu);
                }));
                if (platform_1.isMacintosh) {
                    this._register((0, dom_1.addDisposableListener)(this.title, dom_1.EventType.MOUSE_DOWN, e => {
                        if (e.metaKey) {
                            dom_1.EventHelper.stop(e, true /* stop bubbling to prevent command center from opening */);
                            this.onContextMenu(e, actions_1.MenuId.TitleBarTitleContext);
                        }
                    }, true /* capture phase to prevent command center from opening */));
                }
            }
            this.updateStyles();
            return this.element;
        }
        createTitle() {
            this.titleDisposables.clear();
            // Text Title
            if (!this.isCommandCenterVisible) {
                this.title.innerText = this.windowTitle.value;
                this.titleDisposables.add(this.windowTitle.onDidChange(() => {
                    this.title.innerText = this.windowTitle.value;
                }));
            }
            // Menu Title
            else {
                const commandCenter = this.instantiationService.createInstance(commandCenterControl_1.CommandCenterControl, this.windowTitle, this.hoverDelegate);
                (0, dom_1.reset)(this.title, commandCenter.element);
                this.titleDisposables.add(commandCenter);
            }
        }
        actionViewItemProvider(action, options) {
            // --- Activity Actions
            if (!this.isAuxiliary) {
                if (action.id === activity_1.GLOBAL_ACTIVITY_ID) {
                    return this.instantiationService.createInstance(globalCompositeBar_1.SimpleGlobalActivityActionViewItem, { position: () => 2 /* HoverPosition.BELOW */ }, options);
                }
                if (action.id === activity_1.ACCOUNTS_ACTIVITY_ID) {
                    return this.instantiationService.createInstance(globalCompositeBar_1.SimpleAccountActivityActionViewItem, { position: () => 2 /* HoverPosition.BELOW */ }, options);
                }
            }
            // --- Editor Actions
            const activeEditorPane = this.editorGroupsContainer.activeGroup?.activeEditorPane;
            if (activeEditorPane && activeEditorPane instanceof editorPane_1.EditorPane) {
                const result = activeEditorPane.getActionViewItem(action, options);
                if (result) {
                    return result;
                }
            }
            // Check extensions
            return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, { ...options, menuAsChild: false });
        }
        getKeybinding(action) {
            const editorPaneAwareContextKeyService = this.editorGroupsContainer.activeGroup?.activeEditorPane?.scopedContextKeyService ?? this.contextKeyService;
            return this.keybindingService.lookupKeybinding(action.id, editorPaneAwareContextKeyService);
        }
        createActionToolBar() {
            // Creates the action tool bar. Depends on the configuration of the title bar menus
            // Requires to be recreated whenever editor actions enablement changes
            this.actionToolBarDisposable.clear();
            this.actionToolBar = this.actionToolBarDisposable.add(this.instantiationService.createInstance(toolbar_1.WorkbenchToolBar, this.actionToolBarElement, {
                contextMenu: actions_1.MenuId.TitleBarContext,
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                ariaLabel: (0, nls_1.localize)('ariaLabelTitleActions', "Title actions"),
                getKeyBinding: action => this.getKeybinding(action),
                overflowBehavior: { maxItems: 9, exempted: [activity_1.ACCOUNTS_ACTIVITY_ID, activity_1.GLOBAL_ACTIVITY_ID, ...editorCommands_1.EDITOR_CORE_NAVIGATION_COMMANDS] },
                anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */,
                telemetrySource: 'titlePart',
                highlightToggledItems: this.editorActionsEnabled, // Only show toggled state for editor actions (Layout actions are not shown as toggled)
                actionViewItemProvider: (action, options) => this.actionViewItemProvider(action, options),
                hoverDelegate: this.hoverDelegate
            }));
            if (this.editorActionsEnabled) {
                this.actionToolBarDisposable.add(this.editorGroupsContainer.onDidChangeActiveGroup(() => this.createActionToolBarMenus({ editorActions: true })));
            }
        }
        createActionToolBarMenus(update = true) {
            if (update === true) {
                update = { editorActions: true, layoutActions: true, activityActions: true };
            }
            const updateToolBarActions = () => {
                const actions = { primary: [], secondary: [] };
                // --- Editor Actions
                if (this.editorActionsEnabled) {
                    this.editorActionsChangeDisposable.clear();
                    const activeGroup = this.editorGroupsContainer.activeGroup;
                    if (activeGroup) {
                        const editorActions = activeGroup.createEditorActions(this.editorActionsChangeDisposable);
                        actions.primary.push(...editorActions.actions.primary);
                        actions.secondary.push(...editorActions.actions.secondary);
                        this.editorActionsChangeDisposable.add(editorActions.onDidChange(() => updateToolBarActions()));
                    }
                }
                // --- Layout Actions
                if (this.layoutToolbarMenu) {
                    (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.layoutToolbarMenu, {}, actions, () => !this.editorActionsEnabled // Layout Actions in overflow menu when editor actions enabled in title bar
                    );
                }
                // --- Activity Actions
                if (this.activityActionsEnabled) {
                    if ((0, globalCompositeBar_1.isAccountsActionVisible)(this.storageService)) {
                        actions.primary.push(titlebarActions_1.ACCOUNTS_ACTIVITY_TILE_ACTION);
                    }
                    actions.primary.push(titlebarActions_1.GLOBAL_ACTIVITY_TITLE_ACTION);
                }
                this.actionToolBar.setActions((0, actionbar_1.prepareActions)(actions.primary), (0, actionbar_1.prepareActions)(actions.secondary));
            };
            // Create/Update the menus which should be in the title tool bar
            if (update.editorActions) {
                this.editorToolbarMenuDisposables.clear();
                // The editor toolbar menu is handled by the editor group so we do not need to manage it here.
                // However, depending on the active editor, we need to update the context and action runner of the toolbar menu.
                if (this.editorActionsEnabled && this.editorService.activeEditor !== undefined) {
                    const context = { groupId: this.editorGroupsContainer.activeGroup.id };
                    this.actionToolBar.actionRunner = new editorTabsControl_1.EditorCommandsContextActionRunner(context);
                    this.actionToolBar.context = context;
                    this.editorToolbarMenuDisposables.add(this.actionToolBar.actionRunner);
                }
                else {
                    this.actionToolBar.actionRunner = new actions_2.ActionRunner();
                    this.actionToolBar.context = {};
                    this.editorToolbarMenuDisposables.add(this.actionToolBar.actionRunner);
                }
            }
            if (update.layoutActions) {
                this.layoutToolbarMenuDisposables.clear();
                if (this.layoutControlEnabled) {
                    this.layoutToolbarMenu = this.menuService.createMenu(actions_1.MenuId.LayoutControlMenu, this.contextKeyService);
                    this.layoutToolbarMenuDisposables.add(this.layoutToolbarMenu);
                    this.layoutToolbarMenuDisposables.add(this.layoutToolbarMenu.onDidChange(() => updateToolBarActions()));
                }
                else {
                    this.layoutToolbarMenu = undefined;
                }
            }
            if (update.activityActions) {
                this.activityToolbarDisposables.clear();
                if (this.activityActionsEnabled) {
                    this.activityToolbarDisposables.add(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, globalCompositeBar_1.AccountsActivityActionViewItem.ACCOUNTS_VISIBILITY_PREFERENCE_KEY, this._store)(() => updateToolBarActions()));
                }
            }
            updateToolBarActions();
        }
        updateStyles() {
            super.updateStyles();
            // Part container
            if (this.element) {
                if (this.isInactive) {
                    this.element.classList.add('inactive');
                }
                else {
                    this.element.classList.remove('inactive');
                }
                const titleBackground = this.getColor(this.isInactive ? theme_1.TITLE_BAR_INACTIVE_BACKGROUND : theme_1.TITLE_BAR_ACTIVE_BACKGROUND, (color, theme) => {
                    // LCD Rendering Support: the title bar part is a defining its own GPU layer.
                    // To benefit from LCD font rendering, we must ensure that we always set an
                    // opaque background color. As such, we compute an opaque color given we know
                    // the background color is the workbench background.
                    return color.isOpaque() ? color : color.makeOpaque((0, theme_1.WORKBENCH_BACKGROUND)(theme));
                }) || '';
                this.element.style.backgroundColor = titleBackground;
                if (this.appIconBadge) {
                    this.appIconBadge.style.backgroundColor = titleBackground;
                }
                if (titleBackground && color_1.Color.fromHex(titleBackground).isLighter()) {
                    this.element.classList.add('light');
                }
                else {
                    this.element.classList.remove('light');
                }
                const titleForeground = this.getColor(this.isInactive ? theme_1.TITLE_BAR_INACTIVE_FOREGROUND : theme_1.TITLE_BAR_ACTIVE_FOREGROUND);
                this.element.style.color = titleForeground || '';
                const titleBorder = this.getColor(theme_1.TITLE_BAR_BORDER);
                this.element.style.borderBottom = titleBorder ? `1px solid ${titleBorder}` : '';
            }
        }
        onContextMenu(e, menuId) {
            const event = new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.element), e);
            // Show it
            this.contextMenuService.showContextMenu({
                getAnchor: () => event,
                menuId,
                contextKeyService: this.contextKeyService,
                domForShadowRoot: platform_1.isMacintosh && platform_1.isNative ? event.target : undefined
            });
        }
        get currentMenubarVisibility() {
            if (this.isAuxiliary) {
                return 'hidden';
            }
            return (0, window_1.getMenuBarVisibility)(this.configurationService);
        }
        get layoutControlEnabled() {
            return !this.isAuxiliary && this.configurationService.getValue("workbench.layoutControl.enabled" /* LayoutSettings.LAYOUT_ACTIONS */) !== false;
        }
        get isCommandCenterVisible() {
            return this.configurationService.getValue("window.commandCenter" /* LayoutSettings.COMMAND_CENTER */) !== false;
        }
        get editorActionsEnabled() {
            return this.editorGroupService.partOptions.editorActionsLocation === "titleBar" /* EditorActionsLocation.TITLEBAR */ ||
                (this.editorGroupService.partOptions.editorActionsLocation === "default" /* EditorActionsLocation.DEFAULT */ &&
                    this.editorGroupService.partOptions.showTabs === "none" /* EditorTabsMode.NONE */);
        }
        get activityActionsEnabled() {
            const activityBarPosition = this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */);
            return !this.isAuxiliary && (activityBarPosition === "top" /* ActivityBarPosition.TOP */ || activityBarPosition === "bottom" /* ActivityBarPosition.BOTTOM */);
        }
        get hasZoomableElements() {
            const hasMenubar = !(this.currentMenubarVisibility === 'hidden' || this.currentMenubarVisibility === 'compact' || (!platform_1.isWeb && platform_1.isMacintosh));
            const hasCommandCenter = this.isCommandCenterVisible;
            const hasToolBarActions = this.layoutControlEnabled || this.editorActionsEnabled || this.activityActionsEnabled;
            return hasMenubar || hasCommandCenter || hasToolBarActions;
        }
        get preventZoom() {
            // Prevent zooming behavior if any of the following conditions are met:
            // 1. Shrinking below the window control size (zoom < 1)
            // 2. No custom items are present in the title bar
            return (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element)) < 1 || !this.hasZoomableElements;
        }
        layout(width, height) {
            this.updateLayout(new dom_1.Dimension(width, height));
            super.layoutContents(width, height);
        }
        updateLayout(dimension) {
            this.lastLayoutDimensions = dimension;
            if ((0, window_1.hasCustomTitlebar)(this.configurationService, this.titleBarStyle)) {
                const zoomFactor = (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element));
                this.element.style.setProperty('--zoom-factor', zoomFactor.toString());
                this.rootContainer.classList.toggle('counter-zoom', this.preventZoom);
                if (this.customMenubar) {
                    const menubarDimension = new dom_1.Dimension(0, dimension.height);
                    this.customMenubar.layout(menubarDimension);
                }
            }
        }
        focus() {
            if (this.customMenubar) {
                this.customMenubar.toggleFocus();
            }
            else {
                this.element.querySelector('[tabindex]:not([tabindex="-1"])').focus();
            }
        }
        toJSON() {
            return {
                type: "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */
            };
        }
        dispose() {
            this._onWillDispose.fire();
            super.dispose();
        }
    };
    exports.BrowserTitlebarPart = BrowserTitlebarPart;
    exports.BrowserTitlebarPart = BrowserTitlebarPart = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, storage_1.IStorageService),
        __param(9, layoutService_1.IWorkbenchLayoutService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, host_1.IHostService),
        __param(12, editorGroupsService_1.IEditorGroupsService),
        __param(13, editorService_1.IEditorService),
        __param(14, actions_1.IMenuService),
        __param(15, keybinding_1.IKeybindingService)
    ], BrowserTitlebarPart);
    let MainBrowserTitlebarPart = class MainBrowserTitlebarPart extends BrowserTitlebarPart {
        constructor(contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, editorGroupService, editorService, menuService, keybindingService) {
            super("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, window_2.mainWindow, 'main', contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, editorGroupService, editorService, menuService, keybindingService);
        }
    };
    exports.MainBrowserTitlebarPart = MainBrowserTitlebarPart;
    exports.MainBrowserTitlebarPart = MainBrowserTitlebarPart = __decorate([
        __param(0, contextView_1.IContextMenuService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, themeService_1.IThemeService),
        __param(5, storage_1.IStorageService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, host_1.IHostService),
        __param(9, editorGroupsService_1.IEditorGroupsService),
        __param(10, editorService_1.IEditorService),
        __param(11, actions_1.IMenuService),
        __param(12, keybinding_1.IKeybindingService)
    ], MainBrowserTitlebarPart);
    let AuxiliaryBrowserTitlebarPart = class AuxiliaryBrowserTitlebarPart extends BrowserTitlebarPart {
        static { AuxiliaryBrowserTitlebarPart_1 = this; }
        static { this.COUNTER = 1; }
        get height() { return this.minimumHeight; }
        constructor(container, editorGroupsContainer, mainTitlebar, contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, editorGroupService, editorService, menuService, keybindingService) {
            const id = AuxiliaryBrowserTitlebarPart_1.COUNTER++;
            super(`workbench.parts.auxiliaryTitle.${id}`, (0, dom_1.getWindow)(container), editorGroupsContainer, contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, editorGroupService, editorService, menuService, keybindingService);
            this.container = container;
            this.mainTitlebar = mainTitlebar;
        }
        get preventZoom() {
            // Prevent zooming behavior if any of the following conditions are met:
            // 1. Shrinking below the window control size (zoom < 1)
            // 2. No custom items are present in the main title bar
            // The auxiliary title bar never contains any zoomable items itself,
            // but we want to match the behavior of the main title bar.
            return (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element)) < 1 || !this.mainTitlebar.hasZoomableElements;
        }
    };
    exports.AuxiliaryBrowserTitlebarPart = AuxiliaryBrowserTitlebarPart;
    exports.AuxiliaryBrowserTitlebarPart = AuxiliaryBrowserTitlebarPart = AuxiliaryBrowserTitlebarPart_1 = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, storage_1.IStorageService),
        __param(9, layoutService_1.IWorkbenchLayoutService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, host_1.IHostService),
        __param(12, editorGroupsService_1.IEditorGroupsService),
        __param(13, editorService_1.IEditorService),
        __param(14, actions_1.IMenuService),
        __param(15, keybinding_1.IKeybindingService)
    ], AuxiliaryBrowserTitlebarPart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGl0bGViYXJQYXJ0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvdGl0bGViYXIvdGl0bGViYXJQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFvRnpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsdUJBQXFDO1FBTTdFLFlBQ3dCLG9CQUE4RCxFQUNwRSxjQUErQixFQUNqQyxZQUEyQjtZQUUxQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBSnBCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFIN0UsYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBQztZQXlFbEUsWUFBWTtZQUdaLGdDQUFnQztZQUV2Qiw4QkFBeUIsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLHlCQUF5QixDQUFDO1lBRXJFLGVBQVUsR0FBaUMsU0FBUyxDQUFDO1lBVXJELGNBQVMsR0FBcUIsRUFBRSxDQUFDO1lBakZ4QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFakQsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFFUyxzQkFBc0I7WUFDL0IsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUVPLGVBQWU7WUFFdEIsZUFBZTtZQUNmLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztZQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEseUJBQWUsRUFBQyxN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