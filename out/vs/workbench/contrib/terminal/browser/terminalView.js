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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/platform/notification/common/notification", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/browser/parts/views/viewPane", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/actions/common/actions", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/terminal/common/terminal", "vs/base/browser/ui/actionbar/actionViewItems", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/terminal/browser/terminalTabbedView", "vs/platform/commands/common/commands", "vs/base/browser/ui/iconLabel/iconLabels", "vs/workbench/contrib/terminal/browser/terminalStatusList", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/theme/common/theme", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/browser/terminalMenus", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/browser/terminalTooltip", "vs/platform/theme/browser/defaultStyles", "vs/base/common/event", "vs/platform/hover/browser/hover", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/terminal/browser/terminalContextMenu"], function (require, exports, nls, dom, actions_1, configuration_1, contextView_1, instantiation_1, telemetry_1, themeService_1, themables_1, terminalActions_1, notification_1, terminal_1, viewPane_1, keybinding_1, contextkey_1, views_1, opener_1, actions_2, terminal_2, terminal_3, actionViewItems_1, colorRegistry_1, terminalTabbedView_1, commands_1, iconLabels_1, terminalStatusList_1, menuEntryActionViewItem_1, dropdownWithPrimaryActionViewItem_1, lifecycle_1, uri_1, theme_1, terminalIcon_1, terminalMenus_1, terminalContextKey_1, terminalTooltip_1, defaultStyles_1, event_1, hover_1, accessibility_1, terminalContextMenu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalViewPane = void 0;
    let TerminalViewPane = class TerminalViewPane extends viewPane_1.ViewPane {
        get terminalTabbedView() { return this._terminalTabbedView; }
        constructor(options, keybindingService, _contextKeyService, viewDescriptorService, _configurationService, _contextMenuService, _instantiationService, _terminalService, _terminalConfigurationService, _terminalGroupService, themeService, telemetryService, hoverService, _notificationService, _keybindingService, openerService, _menuService, _terminalProfileService, _terminalProfileResolverService, _themeService, _accessibilityService) {
            super(options, keybindingService, _contextMenuService, _configurationService, _contextKeyService, viewDescriptorService, _instantiationService, openerService, themeService, telemetryService, hoverService);
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._contextMenuService = _contextMenuService;
            this._instantiationService = _instantiationService;
            this._terminalService = _terminalService;
            this._terminalConfigurationService = _terminalConfigurationService;
            this._terminalGroupService = _terminalGroupService;
            this._notificationService = _notificationService;
            this._keybindingService = _keybindingService;
            this._menuService = _menuService;
            this._terminalProfileService = _terminalProfileService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._themeService = _themeService;
            this._accessibilityService = _accessibilityService;
            this._isInitialized = false;
            this._disposableStore = this._register(new lifecycle_1.DisposableStore());
            this._register(this._terminalService.onDidRegisterProcessSupport(() => {
                this._onDidChangeViewWelcomeState.fire();
            }));
            this._register(this._terminalService.onDidChangeInstances(() => {
                // If the first terminal is opened, hide the welcome view
                // and if the last one is closed, show it again
                if (this._hasWelcomeScreen() && this._terminalGroupService.instances.length <= 1) {
                    this._onDidChangeViewWelcomeState.fire();
                }
                if (!this._parentDomElement) {
                    return;
                }
                // If we do not have the tab view yet, create it now.
                if (!this._terminalTabbedView) {
                    this._createTabsView();
                }
                // If we just opened our first terminal, layout
                if (this._terminalGroupService.instances.length === 1) {
                    this.layoutBody(this._parentDomElement.offsetHeight, this._parentDomElement.offsetWidth);
                }
            }));
            this._dropdownMenu = this._register(this._menuService.createMenu(actions_2.MenuId.TerminalNewDropdownContext, this._contextKeyService));
            this._singleTabMenu = this._register(this._menuService.createMenu(actions_2.MenuId.TerminalTabContext, this._contextKeyService));
            this._register(this._terminalProfileService.onDidChangeAvailableProfiles(profiles => this._updateTabActionBar(profiles)));
            this._viewShowing = terminalContextKey_1.TerminalContextKeys.viewShowing.bindTo(this._contextKeyService);
            this._register(this.onDidChangeBodyVisibility(e => {
                if (e) {
                    this._terminalTabbedView?.rerenderTabs();
                }
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (this._parentDomElement && (e.affectsConfiguration("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */) || e.affectsConfiguration("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */))) {
                    this._updateForShellIntegration(this._parentDomElement);
                }
            }));
            this._register(this._terminalService.onDidCreateInstance((i) => {
                i.capabilities.onDidAddCapabilityType(c => {
                    if (c === 2 /* TerminalCapability.CommandDetection */ && this._gutterDecorationsEnabled()) {
                        this._parentDomElement?.classList.add('shell-integration');
                    }
                });
            }));
        }
        _updateForShellIntegration(container) {
            container.classList.toggle('shell-integration', this._gutterDecorationsEnabled());
        }
        _gutterDecorationsEnabled() {
            const decorationsEnabled = this._configurationService.getValue("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */);
            return (decorationsEnabled === 'both' || decorationsEnabled === 'gutter') && this._configurationService.getValue("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */);
        }
        _initializeTerminal(checkRestoredTerminals) {
            if (this.isBodyVisible() && this._terminalService.isProcessSupportRegistered && this._terminalService.connectionState === 1 /* TerminalConnectionState.Connected */) {
                const wasInitialized = this._isInitialized;
                this._isInitialized = true;
                let hideOnStartup = 'never';
                if (!wasInitialized) {
                    hideOnStartup = this._configurationService.getValue("terminal.integrated.hideOnStartup" /* TerminalSettingId.HideOnStartup */);
                    if (hideOnStartup === 'always') {
                        this._terminalGroupService.hidePanel();
                    }
                }
                let shouldCreate = this._terminalGroupService.groups.length === 0;
                // When triggered just after reconnection, also check there are no groups that could be
                // getting restored currently
                if (checkRestoredTerminals) {
                    shouldCreate &&= this._terminalService.restoredGroupCount === 0;
                }
                if (!shouldCreate) {
                    return;
                }
                if (!wasInitialized) {
                    switch (hideOnStartup) {
                        case 'never':
                            this._terminalService.createTerminal({ location: terminal_3.TerminalLocation.Panel });
                            break;
                        case 'whenEmpty':
                            if (this._terminalService.restoredGroupCount === 0) {
                                this._terminalGroupService.hidePanel();
                            }
                            break;
                    }
                    return;
                }
                this._terminalService.createTerminal({ location: terminal_3.TerminalLocation.Panel });
            }
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        renderBody(container) {
            super.renderBody(container);
            if (!this._parentDomElement) {
                this._updateForShellIntegration(container);
            }
            this._parentDomElement = container;
            this._parentDomElement.classList.add('integrated-terminal');
            dom.createStyleSheet(this._parentDomElement);
            this._instantiationService.createInstance(TerminalThemeIconStyle, this._parentDomElement);
            if (!this.shouldShowWelcome()) {
                this._createTabsView();
            }
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.fontFamily" /* TerminalSettingId.FontFamily */) || e.affectsConfiguration('editor.fontFamily')) {
                    if (!this._terminalConfigurationService.configFontIsMonospace()) {
                        const choices = [{
                                label: nls.localize('terminal.useMonospace', "Use 'monospace'"),
                                run: () => this.configurationService.updateValue("terminal.integrated.fontFamily" /* TerminalSettingId.FontFamily */, 'monospace'),
                            }];
                        this._notificationService.prompt(notification_1.Severity.Warning, nls.localize('terminal.monospaceOnly', "The terminal only supports monospace fonts. Be sure to restart VS Code if this is a newly installed font."), choices);
                    }
                }
            }));
            this._register(this.onDidChangeBodyVisibility(async (visible) => {
                this._viewShowing.set(visible);
                if (visible) {
                    if (this._hasWelcomeScreen()) {
                        this._onDidChangeViewWelcomeState.fire();
                    }
                    this._initializeTerminal(false);
                    // we don't know here whether or not it should be focused, so
                    // defer focusing the panel to the focus() call
                    // to prevent overriding preserveFocus for extensions
                    this._terminalGroupService.showPanel(false);
                }
                else {
                    for (const instance of this._terminalGroupService.instances) {
                        instance.resetFocusContextKey();
                    }
                }
                this._terminalGroupService.updateVisibility();
            }));
            this._register(this._terminalService.onDidChangeConnectionState(() => this._initializeTerminal(true)));
            this.layoutBody(this._parentDomElement.offsetHeight, this._parentDomElement.offsetWidth);
        }
        _createTabsView() {
            if (!this._parentDomElement) {
                return;
            }
            this._terminalTabbedView = this.instantiationService.createInstance(terminalTabbedView_1.TerminalTabbedView, this._parentDomElement);
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this._terminalTabbedView?.layout(width, height);
        }
        getActionViewItem(action, options) {
            switch (action.id) {
                case "workbench.action.terminal.split" /* TerminalCommandId.Split */: {
                    // Split needs to be special cased to force splitting within the panel, not the editor
                    const that = this;
                    const panelOnlySplitAction = new class extends actions_1.Action {
                        constructor() {
                            super(action.id, action.label, action.class, action.enabled);
                            this.checked = action.checked;
                            this.tooltip = action.tooltip;
                            this._register(action);
                        }
                        async run() {
                            const instance = that._terminalGroupService.activeInstance;
                            if (instance) {
                                const newInstance = await that._terminalService.createTerminal({ location: { parentTerminal: instance } });
                                return newInstance?.focusWhenReady();
                            }
                            return;
                        }
                    };
                    return new actionViewItems_1.ActionViewItem(action, panelOnlySplitAction, { ...options, icon: true, label: false, keybinding: this._getKeybindingLabel(action) });
                }
                case "workbench.action.terminal.switchTerminal" /* TerminalCommandId.SwitchTerminal */: {
                    return this._instantiationService.createInstance(SwitchTerminalActionViewItem, action);
                }
                case "workbench.action.terminal.focus" /* TerminalCommandId.Focus */: {
                    if (action instanceof actions_2.MenuItemAction) {
                        const actions = [];
                        (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(this._singleTabMenu, { shouldForwardArgs: true }, actions);
                        return this._instantiationService.createInstance(SingleTerminalTabActionViewItem, action, actions);
                    }
                }
                case "workbench.action.terminal.new" /* TerminalCommandId.New */: {
                    if (action instanceof actions_2.MenuItemAction) {
                        const actions = (0, terminalMenus_1.getTerminalActionBarArgs)(terminal_3.TerminalLocation.Panel, this._terminalProfileService.availableProfiles, this._getDefaultProfileName(), this._terminalProfileService.contributedProfiles, this._terminalService, this._dropdownMenu);
                        this._registerDisposableActions(actions.dropdownAction, actions.dropdownMenuActions);
                        this._newDropdown?.dispose();
                        this._newDropdown = new dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem(action, actions.dropdownAction, actions.dropdownMenuActions, actions.className, this._contextMenuService, { hoverDelegate: options.hoverDelegate }, this._keybindingService, this._notificationService, this._contextKeyService, this._themeService, this._accessibilityService);
                        this._updateTabActionBar(this._terminalProfileService.availableProfiles);
                        return this._newDropdown;
                    }
                }
            }
            return super.getActionViewItem(action, options);
        }
        /**
         * Actions might be of type Action (disposable) or Separator or SubmenuAction, which don't extend Disposable
         */
        _registerDisposableActions(dropdownAction, dropdownMenuActions) {
            this._disposableStore.clear();
            if (dropdownAction instanceof actions_1.Action) {
                this._disposableStore.add(dropdownAction);
            }
            dropdownMenuActions.filter(a => a instanceof actions_1.Action).forEach(a => this._disposableStore.add(a));
        }
        _getDefaultProfileName() {
            let defaultProfileName;
            try {
                defaultProfileName = this._terminalProfileService.getDefaultProfileName();
            }
            catch (e) {
                defaultProfileName = this._terminalProfileResolverService.defaultProfileName;
            }
            return defaultProfileName;
        }
        _getKeybindingLabel(action) {
            return this._keybindingService.lookupKeybinding(action.id)?.getLabel() ?? undefined;
        }
        _updateTabActionBar(profiles) {
            const actions = (0, terminalMenus_1.getTerminalActionBarArgs)(terminal_3.TerminalLocation.Panel, profiles, this._getDefaultProfileName(), this._terminalProfileService.contributedProfiles, this._terminalService, this._dropdownMenu);
            this._registerDisposableActions(actions.dropdownAction, actions.dropdownMenuActions);
            this._newDropdown?.update(actions.dropdownAction, actions.dropdownMenuActions);
        }
        focus() {
            super.focus();
            if (this._terminalService.connectionState === 1 /* TerminalConnectionState.Connected */) {
                this._terminalGroupService.showPanel(true);
                return;
            }
            // If the terminal is waiting to reconnect to remote terminals, then there is no TerminalInstance yet that can
            // be focused. So wait for connection to finish, then focus.
            const previousActiveElement = this.element.ownerDocument.activeElement;
            if (previousActiveElement) {
                // TODO: Improve lifecycle management this event should be disposed after first fire
                this._register(this._terminalService.onDidChangeConnectionState(() => {
                    // Only focus the terminal if the activeElement has not changed since focus() was called
                    // TODO: Hack
                    if (previousActiveElement && dom.isActiveElement(previousActiveElement)) {
                        this._terminalGroupService.showPanel(true);
                    }
                }));
            }
        }
        _hasWelcomeScreen() {
            return !this._terminalService.isProcessSupportRegistered;
        }
        shouldShowWelcome() {
            return this._hasWelcomeScreen() && this._terminalService.instances.length === 0;
        }
    };
    exports.TerminalViewPane = TerminalViewPane;
    exports.TerminalViewPane = TerminalViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, views_1.IViewDescriptorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, terminal_1.ITerminalService),
        __param(8, terminal_1.ITerminalConfigurationService),
        __param(9, terminal_1.ITerminalGroupService),
        __param(10, themeService_1.IThemeService),
        __param(11, telemetry_1.ITelemetryService),
        __param(12, hover_1.IHoverService),
        __param(13, notification_1.INotificationService),
        __param(14, keybinding_1.IKeybindingService),
        __param(15, opener_1.IOpenerService),
        __param(16, actions_2.IMenuService),
        __param(17, terminal_2.ITerminalProfileService),
        __param(18, terminal_2.ITerminalProfileResolverService),
        __param(19, themeService_1.IThemeService),
        __param(20, accessibility_1.IAccessibilityService)
    ], TerminalViewPane);
    let SwitchTerminalActionViewItem = class SwitchTerminalActionViewItem extends actionViewItems_1.SelectActionViewItem {
        constructor(action, _terminalService, _terminalGroupService, contextViewService, terminalProfileService) {
            super(null, action, getTerminalSelectOpenItems(_terminalService, _terminalGroupService), _terminalGroupService.activeGroupIndex, contextViewService, defaultStyles_1.defaultSelectBoxStyles, { ariaLabel: nls.localize('terminals', 'Open Terminals.'), optionsAsChildren: true });
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._register(_terminalService.onDidChangeInstances(() => this._updateItems(), this));
            this._register(_terminalService.onDidChangeActiveGroup(() => this._updateItems(), this));
            this._register(_terminalService.onDidChangeActiveInstance(() => this._updateItems(), this));
            this._register(_terminalService.onAnyInstanceTitleChange(() => this._updateItems(), this));
            this._register(_terminalGroupService.onDidChangeGroups(() => this._updateItems(), this));
            this._register(_terminalService.onDidChangeConnectionState(() => this._updateItems(), this));
            this._register(terminalProfileService.onDidChangeAvailableProfiles(() => this._updateItems(), this));
            this._register(_terminalService.onAnyInstancePrimaryStatusChange(() => this._updateItems(), this));
        }
        render(container) {
            super.render(container);
            container.classList.add('switch-terminal');
            container.style.borderColor = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectBorder);
        }
        _updateItems() {
            const options = getTerminalSelectOpenItems(this._terminalService, this._terminalGroupService);
            this.setOptions(options, this._terminalGroupService.activeGroupIndex);
        }
    };
    SwitchTerminalActionViewItem = __decorate([
        __param(1, terminal_1.ITerminalService),
        __param(2, terminal_1.ITerminalGroupService),
        __param(3, contextView_1.IContextViewService),
        __param(4, terminal_2.ITerminalProfileService)
    ], SwitchTerminalActionViewItem);
    function getTerminalSelectOpenItems(terminalService, terminalGroupService) {
        let items;
        if (terminalService.connectionState === 1 /* TerminalConnectionState.Connected */) {
            items = terminalGroupService.getGroupLabels().map(label => {
                return { text: label };
            });
        }
        else {
            items = [{ text: nls.localize('terminalConnectingLabel', "Starting...") }];
        }
        items.push({ text: terminalActions_1.switchTerminalActionViewItemSeparator, isDisabled: true });
        items.push({ text: terminalActions_1.switchTerminalShowTabsTitle });
        return items;
    }
    let SingleTerminalTabActionViewItem = class SingleTerminalTabActionViewItem extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        constructor(action, _actions, keybindingService, notificationService, contextKeyService, themeService, _terminalService, _terminaConfigurationService, _terminalGroupService, contextMenuService, _commandService, _instantiationService, _accessibilityService) {
            super(action, {
                draggable: true,
                hoverDelegate: _instantiationService.createInstance(SingleTabHoverDelegate)
            }, keybindingService, notificationService, contextKeyService, themeService, contextMenuService, _accessibilityService);
            this._actions = _actions;
            this._terminalService = _terminalService;
            this._terminaConfigurationService = _terminaConfigurationService;
            this._terminalGroupService = _terminalGroupService;
            this._commandService = _commandService;
            this._instantiationService = _instantiationService;
            this._elementDisposables = [];
            // Register listeners to update the tab
            this._register(event_1.Event.debounce(event_1.Event.any(this._terminalService.onAnyInstancePrimaryStatusChange, this._terminalGroupService.onDidChangeActiveInstance, event_1.Event.map(this._terminalService.onAnyInstanceIconChange, e => e.instance), this._terminalService.onAnyInstanceTitleChange, this._terminalService.onDidChangeInstanceCapability), (last, e) => {
                if (!last) {
                    last = new Set();
                }
                if (e) {
                    last.add(e);
                }
                return last;
            })(merged => {
                for (const e of merged) {
                    this.updateLabel(e);
                }
            }));
            // Clean up on dispose
            this._register((0, lifecycle_1.toDisposable)(() => (0, lifecycle_1.dispose)(this._elementDisposables)));
        }
        async onClick(event) {
            this._terminalGroupService.lastAccessedMenu = 'inline-tab';
            if (event.altKey && this._menuItemAction.alt) {
                this._commandService.executeCommand(this._menuItemAction.alt.id, { target: terminal_3.TerminalLocation.Panel });
            }
            else {
                this._openContextMenu();
            }
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        updateLabel(e) {
            // Only update if it's the active instance
            if (e && e !== this._terminalGroupService.activeInstance) {
                return;
            }
            if (this._elementDisposables.length === 0 && this.element && this.label) {
                // Right click opens context menu
                this._elementDisposables.push(dom.addDisposableListener(this.element, dom.EventType.CONTEXT_MENU, e => {
                    if (e.button === 2) {
                        this._openContextMenu();
                        e.preventDefault();
                    }
                }));
                // Middle click kills
                this._elementDisposables.push(dom.addDisposableListener(this.element, dom.EventType.AUXCLICK, e => {
                    if (e.button === 1) {
                        const instance = this._terminalGroupService.activeInstance;
                        if (instance) {
                            this._terminalService.safeDisposeTerminal(instance);
                        }
                        e.preventDefault();
                    }
                }));
                // Drag and drop
                this._elementDisposables.push(dom.addDisposableListener(this.element, dom.EventType.DRAG_START, e => {
                    const instance = this._terminalGroupService.activeInstance;
                    if (e.dataTransfer && instance) {
                        e.dataTransfer.setData("Terminals" /* TerminalDataTransfers.Terminals */, JSON.stringify([instance.resource.toString()]));
                    }
                }));
            }
            if (this.label) {
                const label = this.label;
                const instance = this._terminalGroupService.activeInstance;
                if (!instance) {
                    dom.reset(label, '');
                    return;
                }
                label.classList.add('single-terminal-tab');
                let colorStyle = '';
                const primaryStatus = instance.statusList.primary;
                if (primaryStatus) {
                    const colorKey = (0, terminalStatusList_1.getColorForSeverity)(primaryStatus.severity);
                    this._themeService.getColorTheme();
                    const foundColor = this._themeService.getColorTheme().getColor(colorKey);
                    if (foundColor) {
                        colorStyle = foundColor.toString();
                    }
                }
                label.style.color = colorStyle;
                dom.reset(label, ...(0, iconLabels_1.renderLabelWithIcons)(this._instantiationService.invokeFunction(getSingleTabLabel, instance, this._terminaConfigurationService.config.tabs.separator, themables_1.ThemeIcon.isThemeIcon(this._commandAction.item.icon) ? this._commandAction.item.icon : undefined)));
                if (this._altCommand) {
                    label.classList.remove(this._altCommand);
                    this._altCommand = undefined;
                }
                if (this._color) {
                    label.classList.remove(this._color);
                    this._color = undefined;
                }
                if (this._class) {
                    label.classList.remove(this._class);
                    label.classList.remove('terminal-uri-icon');
                    this._class = undefined;
                }
                const colorClass = (0, terminalIcon_1.getColorClass)(instance);
                if (colorClass) {
                    this._color = colorClass;
                    label.classList.add(colorClass);
                }
                const uriClasses = (0, terminalIcon_1.getUriClasses)(instance, this._themeService.getColorTheme().type);
                if (uriClasses) {
                    this._class = uriClasses?.[0];
                    label.classList.add(...uriClasses);
                }
                if (this._commandAction.item.icon) {
                    this._altCommand = `alt-command`;
                    label.classList.add(this._altCommand);
                }
                this.updateTooltip();
            }
        }
        _openContextMenu() {
            this._contextMenuService.showContextMenu({
                actionRunner: new terminalContextMenu_1.TerminalContextActionRunner(),
                getAnchor: () => this.element,
                getActions: () => this._actions,
                // The context is always the active instance in the terminal view
                getActionsContext: () => {
                    const instance = this._terminalGroupService.activeInstance;
                    return instance ? [new terminalContextMenu_1.InstanceContext(instance)] : [];
                }
            });
        }
    };
    SingleTerminalTabActionViewItem = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, notification_1.INotificationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, themeService_1.IThemeService),
        __param(6, terminal_1.ITerminalService),
        __param(7, terminal_1.ITerminalConfigurationService),
        __param(8, terminal_1.ITerminalGroupService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, commands_1.ICommandService),
        __param(11, instantiation_1.IInstantiationService),
        __param(12, accessibility_1.IAccessibilityService)
    ], SingleTerminalTabActionViewItem);
    function getSingleTabLabel(accessor, instance, separator, icon) {
        // Don't even show the icon if there is no title as the icon would shift around when the title
        // is added
        if (!instance || !instance.title) {
            return '';
        }
        const iconId = themables_1.ThemeIcon.isThemeIcon(instance.icon) ? instance.icon.id : accessor.get(terminal_2.ITerminalProfileResolverService).getDefaultIcon().id;
        const label = `$(${icon?.id || iconId}) ${getSingleTabTitle(instance, separator)}`;
        const primaryStatus = instance.statusList.primary;
        if (!primaryStatus?.icon) {
            return label;
        }
        return `${label} $(${primaryStatus.icon.id})`;
    }
    function getSingleTabTitle(instance, separator) {
        if (!instance) {
            return '';
        }
        return !instance.description ? instance.title : `${instance.title} ${separator} ${instance.description}`;
    }
    let TerminalThemeIconStyle = class TerminalThemeIconStyle extends themeService_1.Themable {
        constructor(container, _themeService, _terminalService, _terminalGroupService) {
            super(_themeService);
            this._themeService = _themeService;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._registerListeners();
            this._styleElement = dom.createStyleSheet(container);
            this._register((0, lifecycle_1.toDisposable)(() => container.removeChild(this._styleElement)));
            this.updateStyles();
        }
        _registerListeners() {
            this._register(this._terminalService.onAnyInstanceIconChange(() => this.updateStyles()));
            this._register(this._terminalService.onDidChangeInstances(() => this.updateStyles()));
            this._register(this._terminalGroupService.onDidChangeGroups(() => this.updateStyles()));
        }
        updateStyles() {
            super.updateStyles();
            const colorTheme = this._themeService.getColorTheme();
            // TODO: add a rule collector to avoid duplication
            let css = '';
            // Add icons
            for (const instance of this._terminalService.instances) {
                const icon = instance.icon;
                if (!icon) {
                    continue;
                }
                let uri = undefined;
                if (icon instanceof uri_1.URI) {
                    uri = icon;
                }
                else if (icon instanceof Object && 'light' in icon && 'dark' in icon) {
                    uri = colorTheme.type === theme_1.ColorScheme.LIGHT ? icon.light : icon.dark;
                }
                const iconClasses = (0, terminalIcon_1.getUriClasses)(instance, colorTheme.type);
                if (uri instanceof uri_1.URI && iconClasses && iconClasses.length > 1) {
                    css += (`.monaco-workbench .${iconClasses[0]} .monaco-highlighted-label .codicon, .monaco-action-bar .terminal-uri-icon.single-terminal-tab.action-label:not(.alt-command) .codicon` +
                        `{background-image: ${dom.asCSSUrl(uri)};}`);
                }
            }
            // Add colors
            for (const instance of this._terminalService.instances) {
                const colorClass = (0, terminalIcon_1.getColorClass)(instance);
                if (!colorClass || !instance.color) {
                    continue;
                }
                const color = colorTheme.getColor(instance.color);
                if (color) {
                    // exclude status icons (file-icon) and inline action icons (trashcan and horizontalSplit)
                    css += (`.monaco-workbench .${colorClass} .codicon:first-child:not(.codicon-split-horizontal):not(.codicon-trashcan):not(.file-icon)` +
                        `{ color: ${color} !important; }`);
                }
            }
            this._styleElement.textContent = css;
        }
    };
    TerminalThemeIconStyle = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, terminal_1.ITerminalService),
        __param(3, terminal_1.ITerminalGroupService)
    ], TerminalThemeIconStyle);
    let SingleTabHoverDelegate = class SingleTabHoverDelegate {
        constructor(_configurationService, _hoverService, _terminalGroupService) {
            this._configurationService = _configurationService;
            this._hoverService = _hoverService;
            this._terminalGroupService = _terminalGroupService;
            this._lastHoverHideTime = 0;
            this.placement = 'element';
        }
        get delay() {
            return Date.now() - this._lastHoverHideTime < 200
                ? 0 // show instantly when a hover was recently shown
                : this._configurationService.getValue('workbench.hover.delay');
        }
        showHover(options, focus) {
            const instance = this._terminalGroupService.activeInstance;
            if (!instance) {
                return;
            }
            const hoverInfo = (0, terminalTooltip_1.getInstanceHoverInfo)(instance);
            return this._hoverService.showHover({
                ...options,
                content: hoverInfo.content,
                actions: hoverInfo.actions
            }, focus);
        }
        onDidHideHover() {
            this._lastHoverHideTime = Date.now();
        }
    };
    SingleTabHoverDelegate = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, hover_1.IHoverService),
        __param(2, terminal_1.ITerminalGroupService)
    ], SingleTabHoverDelegate);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbFZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0R6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLG1CQUFRO1FBRzdDLElBQUksa0JBQWtCLEtBQXFDLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztRQVE3RixZQUNDLE9BQXlCLEVBQ0wsaUJBQXFDLEVBQ3JDLGtCQUF1RCxFQUNuRCxxQkFBNkMsRUFDOUMscUJBQTZELEVBQy9ELG1CQUF5RCxFQUN2RCxxQkFBNkQsRUFDbEUsZ0JBQW1ELEVBQ3RDLDZCQUE2RSxFQUNyRixxQkFBNkQsRUFDckUsWUFBMkIsRUFDdkIsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ3BCLG9CQUEyRCxFQUM3RCxrQkFBdUQsRUFDM0QsYUFBNkIsRUFDL0IsWUFBMkMsRUFDaEMsdUJBQWlFLEVBQ3pELCtCQUFpRixFQUNuRyxhQUE2QyxFQUNyQyxxQkFBNkQ7WUFFcEYsS0FBSyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxxQkFBcUIsRUFBRSxrQkFBa0IsRUFBRSxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxDQUFDO1lBcEJ4Syx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBRW5DLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDOUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUN0QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2pELHFCQUFnQixH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