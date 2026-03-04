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
define(["require", "exports", "vs/nls", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/common/activity", "vs/workbench/services/activity/common/activity", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/workbench/browser/parts/compositeBarActions", "vs/base/common/codicons", "vs/base/common/themables", "vs/platform/theme/common/iconRegistry", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/base/browser/touch", "vs/base/common/lazy", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/secrets/common/secrets", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/environment/common/environmentService", "vs/platform/hover/browser/hover", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/userDataProfileIcons", "vs/base/common/types", "vs/workbench/common/theme", "vs/platform/commands/common/commands"], function (require, exports, nls_1, actionbar_1, activity_1, activity_2, instantiation_1, lifecycle_1, themeService_1, storage_1, extensions_1, compositeBarActions_1, codicons_1, themables_1, iconRegistry_1, actions_1, actions_2, dom_1, keyboardEvent_1, mouseEvent_1, touch_1, lazy_1, menuEntryActionViewItem_1, configuration_1, contextkey_1, contextView_1, keybinding_1, log_1, productService_1, secrets_1, authenticationService_1, authentication_1, environmentService_1, hover_1, lifecycle_2, userDataProfile_1, userDataProfileIcons_1, types_1, theme_1, commands_1) {
    "use strict";
    var GlobalCompositeBar_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleGlobalActivityActionViewItem = exports.SimpleAccountActivityActionViewItem = exports.GlobalActivityActionViewItem = exports.AccountsActivityActionViewItem = exports.GlobalCompositeBar = void 0;
    exports.isAccountsActionVisible = isAccountsActionVisible;
    let GlobalCompositeBar = class GlobalCompositeBar extends lifecycle_1.Disposable {
        static { GlobalCompositeBar_1 = this; }
        static { this.ACCOUNTS_ACTION_INDEX = 0; }
        static { this.ACCOUNTS_ICON = (0, iconRegistry_1.registerIcon)('accounts-view-bar-icon', codicons_1.Codicon.account, (0, nls_1.localize)('accountsViewBarIcon', "Accounts icon in the view bar.")); }
        constructor(contextMenuActionsProvider, colors, activityHoverOptions, configurationService, instantiationService, storageService, extensionService) {
            super();
            this.contextMenuActionsProvider = contextMenuActionsProvider;
            this.colors = colors;
            this.activityHoverOptions = activityHoverOptions;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.globalActivityAction = this._register(new actions_1.Action(activity_1.GLOBAL_ACTIVITY_ID));
            this.accountAction = this._register(new actions_1.Action(activity_1.ACCOUNTS_ACTIVITY_ID));
            this.element = document.createElement('div');
            const contextMenuAlignmentOptions = () => ({
                anchorAlignment: configurationService.getValue('workbench.sideBar.location') === 'left' ? 1 /* AnchorAlignment.RIGHT */ : 0 /* AnchorAlignment.LEFT */,
                anchorAxisAlignment: 1 /* AnchorAxisAlignment.HORIZONTAL */
            });
            this.globalActivityActionBar = this._register(new actionbar_1.ActionBar(this.element, {
                actionViewItemProvider: (action, options) => {
                    if (action.id === activity_1.GLOBAL_ACTIVITY_ID) {
                        return this.instantiationService.createInstance(GlobalActivityActionViewItem, this.contextMenuActionsProvider, { ...options, colors: this.colors, hoverOptions: this.activityHoverOptions }, contextMenuAlignmentOptions);
                    }
                    if (action.id === activity_1.ACCOUNTS_ACTIVITY_ID) {
                        return this.instantiationService.createInstance(AccountsActivityActionViewItem, this.contextMenuActionsProvider, {
                            ...options,
                            colors: this.colors,
                            hoverOptions: this.activityHoverOptions
                        }, contextMenuAlignmentOptions, (actions) => {
                            actions.unshift(...[
                                (0, actions_1.toAction)({ id: 'hideAccounts', label: (0, nls_1.localize)('hideAccounts', "Hide Accounts"), run: () => setAccountsActionVisible(storageService, false) }),
                                new actions_1.Separator()
                            ]);
                        });
                    }
                    throw new Error(`No view item for action '${action.id}'`);
                },
                orientation: 1 /* ActionsOrientation.VERTICAL */,
                ariaLabel: (0, nls_1.localize)('manage', "Manage"),
                preventLoopNavigation: true
            }));
            if (this.accountsVisibilityPreference) {
                this.globalActivityActionBar.push(this.accountAction, { index: GlobalCompositeBar_1.ACCOUNTS_ACTION_INDEX });
            }
            this.globalActivityActionBar.push(this.globalActivityAction);
            this.registerListeners();
        }
        registerListeners() {
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                if (!this._store.isDisposed) {
                    this._register(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, AccountsActivityActionViewItem.ACCOUNTS_VISIBILITY_PREFERENCE_KEY, this._store)(() => this.toggleAccountsActivity()));
                }
            });
        }
        create(parent) {
            parent.appendChild(this.element);
        }
        focus() {
            this.globalActivityActionBar.focus(true);
        }
        size() {
            return this.globalActivityActionBar.viewItems.length;
        }
        getContextMenuActions() {
            return [(0, actions_1.toAction)({ id: 'toggleAccountsVisibility', label: (0, nls_1.localize)('accounts', "Accounts"), checked: this.accountsVisibilityPreference, run: () => this.accountsVisibilityPreference = !this.accountsVisibilityPreference })];
        }
        toggleAccountsActivity() {
            if (this.globalActivityActionBar.length() === 2 && this.accountsVisibilityPreference) {
                return;
            }
            if (this.globalActivityActionBar.length() === 2) {
                this.globalActivityActionBar.pull(GlobalCompositeBar_1.ACCOUNTS_ACTION_INDEX);
            }
            else {
                this.globalActivityActionBar.push(this.accountAction, { index: GlobalCompositeBar_1.ACCOUNTS_ACTION_INDEX });
            }
        }
        get accountsVisibilityPreference() {
            return isAccountsActionVisible(this.storageService);
        }
        set accountsVisibilityPreference(value) {
            setAccountsActionVisible(this.storageService, value);
        }
    };
    exports.GlobalCompositeBar = GlobalCompositeBar;
    exports.GlobalCompositeBar = GlobalCompositeBar = GlobalCompositeBar_1 = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, storage_1.IStorageService),
        __param(6, extensions_1.IExtensionService)
    ], GlobalCompositeBar);
    let AbstractGlobalActivityActionViewItem = class AbstractGlobalActivityActionViewItem extends compositeBarActions_1.CompositeBarActionViewItem {
        constructor(menuId, action, options, contextMenuActionsProvider, contextMenuAlignmentOptions, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, keybindingService, activityService) {
            super(action, { draggable: false, icon: true, hasPopup: true, ...options }, () => true, themeService, hoverService, configurationService, keybindingService);
            this.menuId = menuId;
            this.contextMenuActionsProvider = contextMenuActionsProvider;
            this.contextMenuAlignmentOptions = contextMenuAlignmentOptions;
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.activityService = activityService;
            this.updateItemActivity();
            this._register(this.activityService.onDidChangeActivity(viewContainerOrAction => {
                if ((0, types_1.isString)(viewContainerOrAction) && viewContainerOrAction === this.compositeBarActionItem.id) {
                    this.updateItemActivity();
                }
            }));
        }
        updateItemActivity() {
            const activities = this.activityService.getActivity(this.compositeBarActionItem.id);
            let activity = activities[0];
            if (activity) {
                const { badge, priority } = activity;
                if (badge instanceof activity_2.NumberBadge && activities.length > 1) {
                    const cumulativeNumberBadge = this.getCumulativeNumberBadge(activities, priority ?? 0);
                    activity = { badge: cumulativeNumberBadge };
                }
            }
            this.action.activity = activity;
        }
        getCumulativeNumberBadge(activityCache, priority) {
            const numberActivities = activityCache.filter(activity => activity.badge instanceof activity_2.NumberBadge && (activity.priority ?? 0) === priority);
            const number = numberActivities.reduce((result, activity) => { return result + activity.badge.number; }, 0);
            const descriptorFn = () => {
                return numberActivities.reduce((result, activity, index) => {
                    result = result + activity.badge.getDescription();
                    if (index < numberActivities.length - 1) {
                        result = `${result}\n`;
                    }
                    return result;
                }, '');
            };
            return new activity_2.NumberBadge(number, descriptorFn);
        }
        render(container) {
            super.render(container);
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_DOWN, async (e) => {
                dom_1.EventHelper.stop(e, true);
                const isLeftClick = e?.button !== 2;
                // Left-click run
                if (isLeftClick) {
                    this.run();
                }
            }));
            // The rest of the activity bar uses context menu event for the context menu, so we match this
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.CONTEXT_MENU, async (e) => {
                // Let the item decide on the context menu instead of the toolbar
                e.stopPropagation();
                const disposables = new lifecycle_1.DisposableStore();
                const actions = await this.resolveContextMenuActions(disposables);
                const event = new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.container), e);
                this.contextMenuService.showContextMenu({
                    getAnchor: () => event,
                    getActions: () => actions,
                    onHide: () => disposables.dispose()
                });
            }));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.KEY_UP, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    dom_1.EventHelper.stop(e, true);
                    this.run();
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this.container, touch_1.EventType.Tap, (e) => {
                dom_1.EventHelper.stop(e, true);
                this.run();
            }));
        }
        async resolveContextMenuActions(disposables) {
            return this.contextMenuActionsProvider();
        }
        async run() {
            const disposables = new lifecycle_1.DisposableStore();
            const menu = disposables.add(this.menuService.createMenu(this.menuId, this.contextKeyService));
            const actions = await this.resolveMainMenuActions(menu, disposables);
            const { anchorAlignment, anchorAxisAlignment } = this.contextMenuAlignmentOptions() ?? { anchorAlignment: undefined, anchorAxisAlignment: undefined };
            this.contextMenuService.showContextMenu({
                getAnchor: () => this.label,
                anchorAlignment,
                anchorAxisAlignment,
                getActions: () => actions,
                onHide: () => disposables.dispose(),
                menuActionOptions: { renderShortTitle: true },
            });
        }
        async resolveMainMenuActions(menu, _disposable) {
            const actions = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { renderShortTitle: true }, { primary: [], secondary: actions });
            return actions;
        }
    };
    AbstractGlobalActivityActionViewItem = __decorate([
        __param(5, themeService_1.IThemeService),
        __param(6, hover_1.IHoverService),
        __param(7, actions_2.IMenuService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, keybinding_1.IKeybindingService),
        __param(12, activity_2.IActivityService)
    ], AbstractGlobalActivityActionViewItem);
    let AccountsActivityActionViewItem = class AccountsActivityActionViewItem extends AbstractGlobalActivityActionViewItem {
        static { this.ACCOUNTS_VISIBILITY_PREFERENCE_KEY = 'workbench.activity.showAccounts'; }
        constructor(contextMenuActionsProvider, options, contextMenuAlignmentOptions, fillContextMenuActions, themeService, lifecycleService, hoverService, contextMenuService, menuService, contextKeyService, authenticationService, environmentService, productService, configurationService, keybindingService, secretStorageService, logService, activityService, instantiationService, commandService) {
            const action = instantiationService.createInstance(compositeBarActions_1.CompositeBarAction, {
                id: activity_1.ACCOUNTS_ACTIVITY_ID,
                name: (0, nls_1.localize)('accounts', "Accounts"),
                classNames: themables_1.ThemeIcon.asClassNameArray(GlobalCompositeBar.ACCOUNTS_ICON)
            });
            super(actions_2.MenuId.AccountsContext, action, options, contextMenuActionsProvider, contextMenuAlignmentOptions, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, keybindingService, activityService);
            this.fillContextMenuActions = fillContextMenuActions;
            this.lifecycleService = lifecycleService;
            this.authenticationService = authenticationService;
            this.productService = productService;
            this.secretStorageService = secretStorageService;
            this.logService = logService;
            this.commandService = commandService;
            this.groupedAccounts = new Map();
            this.problematicProviders = new Set();
            this.initialized = false;
            this.sessionFromEmbedder = new lazy_1.Lazy(() => (0, authenticationService_1.getCurrentAuthenticationSessionInfo)(this.secretStorageService, this.productService));
            this._register(action);
            this.registerListeners();
            this.initialize();
        }
        registerListeners() {
            this._register(this.authenticationService.onDidRegisterAuthenticationProvider(async (e) => {
                await this.addAccountsFromProvider(e.id);
            }));
            this._register(this.authenticationService.onDidUnregisterAuthenticationProvider((e) => {
                this.groupedAccounts.delete(e.id);
                this.problematicProviders.delete(e.id);
            }));
            this._register(this.authenticationService.onDidChangeSessions(async (e) => {
                for (const changed of [...(e.event.changed ?? []), ...(e.event.added ?? [])]) {
                    try {
                        await this.addOrUpdateAccount(e.providerId, changed.account);
                    }
                    catch (e) {
                        this.logService.error(e);
                    }
                }
                if (e.event.removed) {
                    for (const removed of e.event.removed) {
                        this.removeAccount(e.providerId, removed.account);
                    }
                }
            }));
        }
        // This function exists to ensure that the accounts are added for auth providers that had already been registered
        // before the menu was created.
        async initialize() {
            // Resolving the menu doesn't need to happen immediately, so we can wait until after the workbench has been restored
            // and only run this when the system is idle.
            await this.lifecycleService.when(3 /* LifecyclePhase.Restored */);
            if (this._store.isDisposed) {
                return;
            }
            const disposable = this._register((0, dom_1.runWhenWindowIdle)((0, dom_1.getWindow)(this.element), async () => {
                await this.doInitialize();
                disposable.dispose();
            }));
        }
        async doInitialize() {
            const providerIds = this.authenticationService.getProviderIds();
            const results = await Promise.allSettled(providerIds.map(providerId => this.addAccountsFromProvider(providerId)));
            // Log any errors that occurred while initializing. We try to be best effort here to show the most amount of accounts
            for (const result of results) {
                if (result.status === 'rejected') {
                    this.logService.error(result.reason);
                }
            }
            this.initialized = true;
        }
        //#region overrides
        async resolveMainMenuActions(accountsMenu, disposables) {
            await super.resolveMainMenuActions(accountsMenu, disposables);
            const providers = this.authenticationService.getProviderIds();
            const otherCommands = accountsMenu.getActions();
            let menus = [];
            for (const providerId of providers) {
                if (!this.initialized) {
                    const noAccountsAvailableAction = disposables.add(new actions_1.Action('noAccountsAvailable', (0, nls_1.localize)('loading', "Loading..."), undefined, false));
                    menus.push(noAccountsAvailableAction);
                    break;
                }
                const providerLabel = this.authenticationService.getProvider(providerId).label;
                const accounts = this.groupedAccounts.get(providerId);
                if (!accounts) {
                    if (this.problematicProviders.has(providerId)) {
                        const providerUnavailableAction = disposables.add(new actions_1.Action('providerUnavailable', (0, nls_1.localize)('authProviderUnavailable', '{0} is currently unavailable', providerLabel), undefined, false));
                        menus.push(providerUnavailableAction);
                        // try again in the background so that if the failure was intermittent, we can resolve it on the next showing of the menu
                        try {
                            await this.addAccountsFromProvider(providerId);
                        }
                        catch (e) {
                            this.logService.error(e);
                        }
                    }
                    continue;
                }
                for (const account of accounts) {
                    const manageExtensionsAction = (0, actions_1.toAction)({
                        id: `configureSessions${account.label}`,
                        label: (0, nls_1.localize)('manageTrustedExtensions', "Manage Trusted Extensions"),
                        enabled: true,
                        run: () => this.commandService.executeCommand('_manageTrustedExtensionsForAccount', { providerId, accountLabel: account.label })
                    });
                    const providerSubMenuActions = [manageExtensionsAction];
                    if (account.canSignOut) {
                        providerSubMenuActions.push((0, actions_1.toAction)({
                            id: 'signOut',
                            label: (0, nls_1.localize)('signOut', "Sign Out"),
                            enabled: true,
                            run: () => this.commandService.executeCommand('_signOutOfAccount', { providerId, accountLabel: account.label })
                        }));
                    }
                    const providerSubMenu = new actions_1.SubmenuAction('activitybar.submenu', `${account.label} (${providerLabel})`, providerSubMenuActions);
                    menus.push(providerSubMenu);
                }
            }
            if (providers.length && !menus.length) {
                const noAccountsAvailableAction = disposables.add(new actions_1.Action('noAccountsAvailable', (0, nls_1.localize)('noAccounts', "You are not signed in to any accounts"), undefined, false));
                menus.push(noAccountsAvailableAction);
            }
            if (menus.length && otherCommands.length) {
                menus.push(new actions_1.Separator());
            }
            otherCommands.forEach((group, i) => {
                const actions = group[1];
                menus = menus.concat(actions);
                if (i !== otherCommands.length - 1) {
                    menus.push(new actions_1.Separator());
                }
            });
            return menus;
        }
        async resolveContextMenuActions(disposables) {
            const actions = await super.resolveContextMenuActions(disposables);
            this.fillContextMenuActions(actions);
            return actions;
        }
        //#endregion
        //#region groupedAccounts helpers
        async addOrUpdateAccount(providerId, account) {
            let accounts = this.groupedAccounts.get(providerId);
            if (!accounts) {
                accounts = [];
                this.groupedAccounts.set(providerId, accounts);
            }
            const sessionFromEmbedder = await this.sessionFromEmbedder.value;
            let canSignOut = true;
            if (sessionFromEmbedder // if we have a session from the embedder
                && !sessionFromEmbedder.canSignOut // and that session says we can't sign out
                && (await this.authenticationService.getSessions(providerId)) // and that session is associated with the account we are adding/updating
                    .some(s => s.id === sessionFromEmbedder.id
                    && s.account.id === account.id)) {
                canSignOut = false;
            }
            const existingAccount = accounts.find(a => a.label === account.label);
            if (existingAccount) {
                // if we have an existing account and we discover that we
                // can't sign out of it, update the account to mark it as "can't sign out"
                if (!canSignOut) {
                    existingAccount.canSignOut = canSignOut;
                }
            }
            else {
                accounts.push({ ...account, canSignOut });
            }
        }
        removeAccount(providerId, account) {
            const accounts = this.groupedAccounts.get(providerId);
            if (!accounts) {
                return;
            }
            const index = accounts.findIndex(a => a.id === account.id);
            if (index === -1) {
                return;
            }
            accounts.splice(index, 1);
            if (accounts.length === 0) {
                this.groupedAccounts.delete(providerId);
            }
        }
        async addAccountsFromProvider(providerId) {
            try {
                const sessions = await this.authenticationService.getSessions(providerId);
                this.problematicProviders.delete(providerId);
                for (const session of sessions) {
                    try {
                        await this.addOrUpdateAccount(providerId, session.account);
                    }
                    catch (e) {
                        this.logService.error(e);
                    }
                }
            }
            catch (e) {
                this.logService.error(e);
                this.problematicProviders.add(providerId);
            }
        }
    };
    exports.AccountsActivityActionViewItem = AccountsActivityActionViewItem;
    exports.AccountsActivityActionViewItem = AccountsActivityActionViewItem = __decorate([
        __param(4, themeService_1.IThemeService),
        __param(5, lifecycle_2.ILifecycleService),
        __param(6, hover_1.IHoverService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, actions_2.IMenuService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, authentication_1.IAuthenticationService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService),
        __param(12, productService_1.IProductService),
        __param(13, configuration_1.IConfigurationService),
        __param(14, keybinding_1.IKeybindingService),
        __param(15, secrets_1.ISecretStorageService),
        __param(16, log_1.ILogService),
        __param(17, activity_2.IActivityService),
        __param(18, instantiation_1.IInstantiationService),
        __param(19, commands_1.ICommandService)
    ], AccountsActivityActionViewItem);
    let GlobalActivityActionViewItem = class GlobalActivityActionViewItem extends AbstractGlobalActivityActionViewItem {
        constructor(contextMenuActionsProvider, options, contextMenuAlignmentOptions, userDataProfileService, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, environmentService, keybindingService, instantiationService, activityService) {
            const action = instantiationService.createInstance(compositeBarActions_1.CompositeBarAction, {
                id: activity_1.GLOBAL_ACTIVITY_ID,
                name: (0, nls_1.localize)('manage', "Manage"),
                classNames: themables_1.ThemeIcon.asClassNameArray(userDataProfileService.currentProfile.icon ? themables_1.ThemeIcon.fromId(userDataProfileService.currentProfile.icon) : userDataProfileIcons_1.DEFAULT_ICON)
            });
            super(actions_2.MenuId.GlobalActivity, action, options, contextMenuActionsProvider, contextMenuAlignmentOptions, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, keybindingService, activityService);
            this.userDataProfileService = userDataProfileService;
            this._register(action);
            this._register(this.userDataProfileService.onDidChangeCurrentProfile(e => {
                action.compositeBarActionItem = {
                    ...action.compositeBarActionItem,
                    classNames: themables_1.ThemeIcon.asClassNameArray(userDataProfileService.currentProfile.icon ? themables_1.ThemeIcon.fromId(userDataProfileService.currentProfile.icon) : userDataProfileIcons_1.DEFAULT_ICON)
                };
            }));
        }
        render(container) {
            super.render(container);
            this.profileBadge = (0, dom_1.append)(container, (0, dom_1.$)('.profile-badge'));
            this.profileBadgeContent = (0, dom_1.append)(this.profileBadge, (0, dom_1.$)('.profile-badge-content'));
            this.updateProfileBadge();
        }
        updateProfileBadge() {
            if (!this.profileBadge || !this.profileBadgeContent) {
                return;
            }
            (0, dom_1.clearNode)(this.profileBadgeContent);
            (0, dom_1.hide)(this.profileBadge);
            if (this.userDataProfileService.currentProfile.isDefault) {
                return;
            }
            if (this.userDataProfileService.currentProfile.icon && this.userDataProfileService.currentProfile.icon !== userDataProfileIcons_1.DEFAULT_ICON.id) {
                return;
            }
            if (this.action.activity) {
                return;
            }
            (0, dom_1.show)(this.profileBadge);
            this.profileBadgeContent.classList.toggle('profile-text-overlay', true);
            this.profileBadgeContent.classList.toggle('profile-icon-overlay', false);
            this.profileBadgeContent.textContent = this.userDataProfileService.currentProfile.name.substring(0, 2).toUpperCase();
        }
        updateActivity() {
            super.updateActivity();
            this.updateProfileBadge();
        }
        computeTitle() {
            return this.userDataProfileService.currentProfile.isDefault ? super.computeTitle() : (0, nls_1.localize)('manage profile', "Manage {0} (Profile)", this.userDataProfileService.currentProfile.name);
        }
    };
    exports.GlobalActivityActionViewItem = GlobalActivityActionViewItem;
    exports.GlobalActivityActionViewItem = GlobalActivityActionViewItem = __decorate([
        __param(3, userDataProfile_1.IUserDataProfileService),
        __param(4, themeService_1.IThemeService),
        __param(5, hover_1.IHoverService),
        __param(6, actions_2.IMenuService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, keybinding_1.IKeybindingService),
        __param(12, instantiation_1.IInstantiationService),
        __param(13, activity_2.IActivityService)
    ], GlobalActivityActionViewItem);
    let SimpleAccountActivityActionViewItem = class SimpleAccountActivityActionViewItem extends AccountsActivityActionViewItem {
        constructor(hoverOptions, options, themeService, lifecycleService, hoverService, contextMenuService, menuService, contextKeyService, authenticationService, environmentService, productService, configurationService, keybindingService, secretStorageService, storageService, logService, activityService, instantiationService, commandService) {
            super(() => simpleActivityContextMenuActions(storageService, true), {
                ...options,
                colors: theme => ({
                    badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                    badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                }),
                hoverOptions,
                compact: true,
            }, () => undefined, actions => actions, themeService, lifecycleService, hoverService, contextMenuService, menuService, contextKeyService, authenticationService, environmentService, productService, configurationService, keybindingService, secretStorageService, logService, activityService, instantiationService, commandService);
        }
    };
    exports.SimpleAccountActivityActionViewItem = SimpleAccountActivityActionViewItem;
    exports.SimpleAccountActivityActionViewItem = SimpleAccountActivityActionViewItem = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, hover_1.IHoverService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, actions_2.IMenuService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, authentication_1.IAuthenticationService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, productService_1.IProductService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, keybinding_1.IKeybindingService),
        __param(13, secrets_1.ISecretStorageService),
        __param(14, storage_1.IStorageService),
        __param(15, log_1.ILogService),
        __param(16, activity_2.IActivityService),
        __param(17, instantiation_1.IInstantiationService),
        __param(18, commands_1.ICommandService)
    ], SimpleAccountActivityActionViewItem);
    let SimpleGlobalActivityActionViewItem = class SimpleGlobalActivityActionViewItem extends GlobalActivityActionViewItem {
        constructor(hoverOptions, options, userDataProfileService, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, environmentService, keybindingService, instantiationService, activityService, storageService) {
            super(() => simpleActivityContextMenuActions(storageService, false), {
                ...options,
                colors: theme => ({
                    badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                    badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                }),
                hoverOptions,
                compact: true,
            }, () => undefined, userDataProfileService, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, environmentService, keybindingService, instantiationService, activityService);
        }
    };
    exports.SimpleGlobalActivityActionViewItem = SimpleGlobalActivityActionViewItem;
    exports.SimpleGlobalActivityActionViewItem = SimpleGlobalActivityActionViewItem = __decorate([
        __param(2, userDataProfile_1.IUserDataProfileService),
        __param(3, themeService_1.IThemeService),
        __param(4, hover_1.IHoverService),
        __param(5, actions_2.IMenuService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, instantiation_1.IInstantiationService),
        __param(12, activity_2.IActivityService),
        __param(13, storage_1.IStorageService)
    ], SimpleGlobalActivityActionViewItem);
    function simpleActivityContextMenuActions(storageService, isAccount) {
        const currentElementContextMenuActions = [];
        if (isAccount) {
            currentElementContextMenuActions.push((0, actions_1.toAction)({ id: 'hideAccounts', label: (0, nls_1.localize)('hideAccounts', "Hide Accounts"), run: () => setAccountsActionVisible(storageService, false) }), new actions_1.Separator());
        }
        return [
            ...currentElementContextMenuActions,
            (0, actions_1.toAction)({ id: 'toggle.hideAccounts', label: (0, nls_1.localize)('accounts', "Accounts"), checked: isAccountsActionVisible(storageService), run: () => setAccountsActionVisible(storageService, !isAccountsActionVisible(storageService)) }),
            (0, actions_1.toAction)({ id: 'toggle.hideManage', label: (0, nls_1.localize)('manage', "Manage"), checked: true, enabled: false, run: () => { throw new Error('"Manage" can not be hidden'); } })
        ];
    }
    function isAccountsActionVisible(storageService) {
        return storageService.getBoolean(AccountsActivityActionViewItem.ACCOUNTS_VISIBILITY_PREFERENCE_KEY, 0 /* StorageScope.PROFILE */, true);
    }
    function setAccountsActionVisible(storageService, visible) {
        storageService.store(AccountsActivityActionViewItem.ACCOUNTS_VISIBILITY_PREFERENCE_KEY, visible, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsQ29tcG9zaXRlQmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZ2xvYmFsQ29tcG9zaXRlQmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwckJoRywwREFFQztJQWhwQk0sSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTs7aUJBRXpCLDBCQUFxQixHQUFHLENBQUMsQUFBSixDQUFLO2lCQUNsQyxrQkFBYSxHQUFHLElBQUEsMkJBQVksRUFBQyx3QkFBd0IsRUFBRSxrQkFBTyxDQUFDLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDLEFBQTdILENBQThIO1FBUTNKLFlBQ2tCLDBCQUEyQyxFQUMzQyxNQUFtRCxFQUNuRCxvQkFBMkMsRUFDckMsb0JBQTJDLEVBQzNDLG9CQUE0RCxFQUNsRSxjQUFnRCxFQUM5QyxnQkFBb0Q7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFSUywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQWlCO1lBQzNDLFdBQU0sR0FBTixNQUFNLENBQTZDO1lBQ25ELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFFcEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQVh2RCx5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZ0JBQU0sQ0FBQyw2QkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFDdEUsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZ0JBQU0sQ0FBQywrQkFBb0IsQ0FBQyxDQUFDLENB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