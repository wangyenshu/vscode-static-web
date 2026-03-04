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
define(["require", "exports", "vs/nls", "vs/base/common/keyCodes", "vs/platform/actions/common/actions", "vs/base/common/strings", "vs/platform/registry/common/platform", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorService", "vs/base/common/color", "vs/platform/theme/common/theme", "vs/workbench/services/themes/common/colorThemeSchema", "vs/base/common/errors", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/themes/browser/productIconThemeData", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/base/common/themables", "vs/base/common/event", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/workbench/services/themes/browser/fileIconThemeData", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/workbench/common/contributions", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/base/common/platform", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/host/browser/host", "vs/base/browser/window", "vs/workbench/services/preferences/common/preferences", "vs/base/browser/ui/toggle/toggle", "vs/platform/theme/browser/defaultStyles", "vs/base/common/lifecycle"], function (require, exports, nls_1, keyCodes_1, actions_1, strings_1, platform_1, actionCommonCategories_1, workbenchThemeService_1, extensions_1, extensionManagement_1, colorRegistry_1, editorService_1, color_1, theme_1, colorThemeSchema_1, errors_1, quickInput_1, productIconThemeData_1, panecomposite_1, async_1, cancellation_1, log_1, progress_1, codicons_1, iconRegistry_1, themables_1, event_1, extensionResourceLoader_1, instantiation_1, commands_1, fileIconThemeData_1, configuration_1, dialogs_1, contributions_1, notification_1, storage_1, platform_2, telemetry_1, host_1, window_1, preferences_1, toggle_1, defaultStyles_1, lifecycle_1) {
    "use strict";
    var DefaultThemeUpdatedNotificationContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.manageExtensionIcon = void 0;
    exports.manageExtensionIcon = (0, iconRegistry_1.registerIcon)('theme-selection-manage-extension', codicons_1.Codicon.gear, (0, nls_1.localize)('manageExtensionIcon', 'Icon for the \'Manage\' action in the theme selection quick pick.'));
    var ConfigureItem;
    (function (ConfigureItem) {
        ConfigureItem["BROWSE_GALLERY"] = "marketplace";
        ConfigureItem["EXTENSIONS_VIEW"] = "extensions";
        ConfigureItem["CUSTOM_TOP_ENTRY"] = "customTopEntry";
    })(ConfigureItem || (ConfigureItem = {}));
    let MarketplaceThemesPicker = class MarketplaceThemesPicker {
        constructor(getMarketplaceColorThemes, marketplaceQuery, extensionGalleryService, extensionManagementService, quickInputService, logService, progressService, paneCompositeService, dialogService) {
            this.getMarketplaceColorThemes = getMarketplaceColorThemes;
            this.marketplaceQuery = marketplaceQuery;
            this.extensionGalleryService = extensionGalleryService;
            this.extensionManagementService = extensionManagementService;
            this.quickInputService = quickInputService;
            this.logService = logService;
            this.progressService = progressService;
            this.paneCompositeService = paneCompositeService;
            this.dialogService = dialogService;
            this._marketplaceExtensions = new Set();
            this._marketplaceThemes = [];
            this._searchOngoing = false;
            this._searchError = undefined;
            this._onDidChange = new event_1.Emitter();
            this._queryDelayer = new async_1.ThrottledDelayer(200);
            this._installedExtensions = extensionManagementService.getInstalled().then(installed => {
                const result = new Set();
                for (const ext of installed) {
                    result.add(ext.identifier.id);
                }
                return result;
            });
        }
        get themes() {
            return this._marketplaceThemes;
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        trigger(value) {
            if (this._tokenSource) {
                this._tokenSource.cancel();
                this._tokenSource = undefined;
            }
            this._queryDelayer.trigger(() => {
                this._tokenSource = new cancellation_1.CancellationTokenSource();
                return this.doSearch(value, this._tokenSource.token);
            });
        }
        async doSearch(value, token) {
            this._searchOngoing = true;
            this._onDidChange.fire();
            try {
                const installedExtensions = await this._installedExtensions;
                const options = { text: `${this.marketplaceQuery} ${value}`, pageSize: 20 };
                const pager = await this.extensionGalleryService.query(options, token);
                for (let i = 0; i < pager.total && i < 1; i++) { // loading multiple pages is turned of for now to avoid flickering
                    if (token.isCancellationRequested) {
                        break;
                    }
                    const nThemes = this._marketplaceThemes.length;
                    const gallery = i === 0 ? pager.firstPage : await pager.getPage(i, token);
                    const promises = [];
                    const promisesGalleries = [];
                    for (let i = 0; i < gallery.length; i++) {
                        if (token.isCancellationRequested) {
                            break;
                        }
                        const ext = gallery[i];
                        if (!installedExtensions.has(ext.identifier.id) && !this._marketplaceExtensions.has(ext.identifier.id)) {
                            this._marketplaceExtensions.add(ext.identifier.id);
                            promises.push(this.getMarketplaceColorThemes(ext.publisher, ext.name, ext.version));
                            promisesGalleries.push(ext);
                        }
                    }
                    const allThemes = await Promise.all(promises);
                    for (let i = 0; i < allThemes.length; i++) {
                        const ext = promisesGalleries[i];
                        for (const theme of allThemes[i]) {
                            this._marketplaceThemes.push({ id: theme.id, theme: theme, label: theme.label, description: `${ext.displayName} · ${ext.publisherDisplayName}`, galleryExtension: ext, buttons: [configureButton] });
                        }
                    }
                    if (nThemes !== this._marketplaceThemes.length) {
                        this._marketplaceThemes.sort((t1, t2) => t1.label.localeCompare(t2.label));
                        this._onDidChange.fire();
                    }
                }
            }
            catch (e) {
                if (!(0, errors_1.isCancellationError)(e)) {
                    this.logService.error(`Error while searching for themes:`, e);
                    this._searchError = 'message' in e ? e.message : String(e);
                }
            }
            finally {
                this._searchOngoing = false;
                this._onDidChange.fire();
            }
        }
        openQuickPick(value, currentTheme, selectTheme) {
            let result = undefined;
            return new Promise((s, _) => {
                const quickpick = this.quickInputService.createQuickPick();
                quickpick.items = [];
                quickpick.sortByLabel = false;
                quickpick.matchOnDescription = true;
                quickpick.buttons = [this.quickInputService.backButton];
                quickpick.title = 'Marketplace Themes';
                quickpick.placeholder = (0, nls_1.localize)('themes.selectMarketplaceTheme', "Type to Search More. Select to Install. Up/Down Keys to Preview");
                quickpick.canSelectMany = false;
                quickpick.onDidChangeValue(() => this.trigger(quickpick.value));
                quickpick.onDidAccept(async (_) => {
                    const themeItem = quickpick.selectedItems[0];
                    if (themeItem?.galleryExtension) {
                        result = 'selected';
                        quickpick.hide();
                        const success = await this.installExtension(themeItem.galleryExtension);
                        if (success) {
                            selectTheme(themeItem.theme, true);
                        }
                        else {
                            selectTheme(currentTheme, true);
                        }
                    }
                });
                quickpick.onDidTriggerItemButton(e => {
                    if (isItem(e.item)) {
                        const extensionId = e.item.theme?.extensionData?.extensionId;
                        if (extensionId) {
                            openExtensionViewlet(this.paneCompositeService, `@id:${extensionId}`);
                        }
                        else {
                            openExtensionViewlet(this.paneCompositeService, `${this.marketplaceQuery} ${quickpick.value}`);
                        }
                    }
                });
                quickpick.onDidChangeActive(themes => {
                    if (result === undefined) {
                        selectTheme(themes[0]?.theme, false);
                    }
                });
                quickpick.onDidHide(() => {
                    if (result === undefined) {
                        selectTheme(currentTheme, true);
                        result = 'cancelled';
                    }
                    quickpick.dispose();
                    s(result);
                });
                quickpick.onDidTriggerButton(e => {
                    if (e === this.quickInputService.backButton) {
                        result = 'back';
                        quickpick.hide();
                    }
                });
                this.onDidChange(() => {
                    let items = this.themes;
                    if (this._searchOngoing) {
                        items = items.concat({ label: '$(sync~spin) Searching for themes...', id: undefined, alwaysShow: true });
                    }
                    else if (items.length === 0 && this._searchError) {
                        items = [{ label: `$(error) ${(0, nls_1.localize)('search.error', 'Error while searching for themes: {0}', this._searchError)}`, id: undefined, alwaysShow: true }];
                    }
                    const activeItemId = quickpick.activeItems[0]?.id;
                    const newActiveItem = activeItemId ? items.find(i => isItem(i) && i.id === activeItemId) : undefined;
                    quickpick.items = items;
                    if (newActiveItem) {
                        quickpick.activeItems = [newActiveItem];
                    }
                });
                this.trigger(value);
                quickpick.show();
            });
        }
        async installExtension(galleryExtension) {
            openExtensionViewlet(this.paneCompositeService, `@id:${galleryExtension.identifier.id}`);
            const result = await this.dialogService.confirm({
                message: (0, nls_1.localize)('installExtension.confirm', "This will install extension '{0}' published by '{1}'. Do you want to continue?", galleryExtension.displayName, galleryExtension.publisherDisplayName),
                primaryButton: (0, nls_1.localize)('installExtension.button.ok', "OK")
            });
            if (!result.confirmed) {
                return false;
            }
            try {
                await this.progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    title: (0, nls_1.localize)('installing extensions', "Installing Extension {0}...", galleryExtension.displayName)
                }, async () => {
                    await this.extensionManagementService.installFromGallery(galleryExtension, {
                        // Setting this to false is how you get the extension to be synced with Settings Sync (if enabled).
                        isMachineScoped: false,
                    });
                });
                return true;
            }
            catch (e) {
                this.logService.error(`Problem installing extension ${galleryExtension.identifier.id}`, e);
                return false;
            }
        }
        dispose() {
            if (this._tokenSource) {
                this._tokenSource.cancel();
                this._tokenSource = undefined;
            }
            this._queryDelayer.dispose();
            this._marketplaceExtensions.clear();
            this._marketplaceThemes.length = 0;
        }
    };
    MarketplaceThemesPicker = __decorate([
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, extensionManagement_1.IExtensionManagementService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, log_1.ILogService),
        __param(6, progress_1.IProgressService),
        __param(7, panecomposite_1.IPaneCompositePartService),
        __param(8, dialogs_1.IDialogService)
    ], MarketplaceThemesPicker);
    let InstalledThemesPicker = class InstalledThemesPicker {
        constructor(options, setTheme, getMarketplaceColorThemes, quickInputService, extensionGalleryService, paneCompositeService, extensionResourceLoaderService, instantiationService) {
            this.options = options;
            this.setTheme = setTheme;
            this.getMarketplaceColorThemes = getMarketplaceColorThemes;
            this.quickInputService = quickInputService;
            this.extensionGalleryService = extensionGalleryService;
            this.paneCompositeService = paneCompositeService;
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.instantiationService = instantiationService;
        }
        async openQuickPick(picks, currentTheme) {
            let marketplaceThemePicker;
            if (this.extensionGalleryService.isEnabled()) {
                if (this.extensionResourceLoaderService.supportsExtensionGalleryResources && this.options.browseMessage) {
                    marketplaceThemePicker = this.instantiationService.createInstance(MarketplaceThemesPicker, this.getMarketplaceColorThemes.bind(this), this.options.marketplaceTag);
                    picks = [configurationEntry(this.options.browseMessage, ConfigureItem.BROWSE_GALLERY), ...picks];
                }
                else {
                    picks = [...picks, { type: 'separator' }, configurationEntry(this.options.installMessage, ConfigureItem.EXTENSIONS_VIEW)];
                }
            }
            let selectThemeTimeout;
            const selectTheme = (theme, applyTheme) => {
                if (selectThemeTimeout) {
                    clearTimeout(selectThemeTimeout);
                }
                selectThemeTimeout = window_1.mainWindow.setTimeout(() => {
                    selectThemeTimeout = undefined;
                    const newTheme = (theme ?? currentTheme);
                    this.setTheme(newTheme, applyTheme ? 'auto' : 'preview').then(undefined, err => {
                        (0, errors_1.onUnexpectedError)(err);
                        this.setTheme(currentTheme, undefined);
                    });
                }, applyTheme ? 0 : 200);
            };
            const pickInstalledThemes = (activeItemId) => {
                return new Promise((s, _) => {
                    let isCompleted = false;
                    const disposables = new lifecycle_1.DisposableStore();
                    const autoFocusIndex = picks.findIndex(p => isItem(p) && p.id === activeItemId);
                    const quickpick = this.quickInputService.createQuickPick();
                    quickpick.items = picks;
                    quickpick.title = this.options.title;
                    quickpick.description = this.options.description;
                    quickpick.placeholder = this.options.placeholderMessage;
                    quickpick.activeItems = [picks[autoFocusIndex]];
                    quickpick.canSelectMany = false;
                    quickpick.toggles = this.options.toggles;
                    quickpick.toggles?.forEach(toggle => {
                        toggle.onChange(() => this.options.onToggle?.(toggle, quickpick), undefined, disposables);
                    });
                    quickpick.matchOnDescription = true;
                    quickpick.onDidAccept(async (_) => {
                        isCompleted = true;
                        const theme = quickpick.selectedItems[0];
                        if (!theme || theme.configureItem) { // 'pick in marketplace' entry
                            if (!theme || theme.configureItem === ConfigureItem.EXTENSIONS_VIEW) {
                                openExtensionViewlet(this.paneCompositeService, `${this.options.marketplaceTag} ${quickpick.value}`);
                            }
                            else if (theme.configureItem === ConfigureItem.BROWSE_GALLERY) {
                                if (marketplaceThemePicker) {
                                    const res = await marketplaceThemePicker.openQuickPick(quickpick.value, currentTheme, selectTheme);
                                    if (res === 'back') {
                                        await pickInstalledThemes(undefined);
                                    }
                                }
                            }
                        }
                        else {
                            selectTheme(theme.theme, true);
                        }
                        quickpick.hide();
                        s();
                    });
                    quickpick.onDidChangeActive(themes => selectTheme(themes[0]?.theme, false));
                    quickpick.onDidHide(() => {
                        if (!isCompleted) {
                            selectTheme(currentTheme, true);
                            s();
                        }
                        quickpick.dispose();
                        disposables.dispose();
                    });
                    quickpick.onDidTriggerItemButton(e => {
                        if (isItem(e.item)) {
                            const extensionId = e.item.theme?.extensionData?.extensionId;
                            if (extensionId) {
                                openExtensionViewlet(this.paneCompositeService, `@id:${extensionId}`);
                            }
                            else {
                                openExtensionViewlet(this.paneCompositeService, `${this.options.marketplaceTag} ${quickpick.value}`);
                            }
                        }
                    });
                    quickpick.show();
                });
            };
            await pickInstalledThemes(currentTheme.id);
            marketplaceThemePicker?.dispose();
        }
    };
    InstalledThemesPicker = __decorate([
        __param(3, quickInput_1.IQuickInputService),
        __param(4, extensionManagement_1.IExtensionGalleryService),
        __param(5, panecomposite_1.IPaneCompositePartService),
        __param(6, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(7, instantiation_1.IInstantiationService)
    ], InstalledThemesPicker);
    const SelectColorThemeCommandId = 'workbench.action.selectTheme';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SelectColorThemeCommandId,
                title: (0, nls_1.localize2)('selectTheme.label', 'Color Theme'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 50 /* KeyCode.KeyT */)
                }
            });
        }
        getTitle(colorScheme) {
            switch (colorScheme) {
                case theme_1.ColorScheme.DARK: return (0, nls_1.localize)('themes.selectTheme.darkScheme', "Select Color Theme for System Dark Mode");
                case theme_1.ColorScheme.LIGHT: return (0, nls_1.localize)('themes.selectTheme.lightScheme', "Select Color Theme for System Light Mode");
                case theme_1.ColorScheme.HIGH_CONTRAST_DARK: return (0, nls_1.localize)('themes.selectTheme.darkHC', "Select Color Theme for High Contrast Dark Mode");
                case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT: return (0, nls_1.localize)('themes.selectTheme.lightHC', "Select Color Theme for High Contrast Light Mode");
                default:
                    return (0, nls_1.localize)('themes.selectTheme.default', "Select Color Theme (detect system color mode disabled)");
            }
        }
        async run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const preferencesService = accessor.get(preferences_1.IPreferencesService);
            const preferredColorScheme = themeService.getPreferredColorScheme();
            let modeConfigureToggle;
            if (preferredColorScheme) {
                modeConfigureToggle = new toggle_1.Toggle({
                    title: (0, nls_1.localize)('themes.configure.switchingEnabled', 'Detect system color mode enabled. Click to configure.'),
                    icon: codicons_1.Codicon.colorMode,
                    isChecked: false,
                    ...defaultStyles_1.defaultToggleStyles
                });
            }
            else {
                modeConfigureToggle = new toggle_1.Toggle({
                    title: (0, nls_1.localize)('themes.configure.switchingDisabled', 'Detect system color mode disabled. Click to configure.'),
                    icon: codicons_1.Codicon.colorMode,
                    isChecked: false,
                    ...defaultStyles_1.defaultToggleStyles
                });
            }
            const options = {
                installMessage: (0, nls_1.localize)('installColorThemes', "Install Additional Color Themes..."),
                browseMessage: '$(plus) ' + (0, nls_1.localize)('browseColorThemes', "Browse Additional Color Themes..."),
                placeholderMessage: this.getTitle(preferredColorScheme),
                marketplaceTag: 'category:themes',
                toggles: [modeConfigureToggle],
                onToggle: async (toggle, picker) => {
                    picker.hide();
                    await preferencesService.openSettings({ query: workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME });
                }
            };
            const setTheme = (theme, settingsTarget) => themeService.setColorTheme(theme, settingsTarget);
            const getMarketplaceColorThemes = (publisher, name, version) => themeService.getMarketplaceColorThemes(publisher, name, version);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const picker = instantiationService.createInstance(InstalledThemesPicker, options, setTheme, getMarketplaceColorThemes);
            const themes = await themeService.getColorThemes();
            const currentTheme = themeService.getColorTheme();
            const lightEntries = toEntries(themes.filter(t => t.type === theme_1.ColorScheme.LIGHT), (0, nls_1.localize)('themes.category.light', "light themes"));
            const darkEntries = toEntries(themes.filter(t => t.type === theme_1.ColorScheme.DARK), (0, nls_1.localize)('themes.category.dark', "dark themes"));
            const hcEntries = toEntries(themes.filter(t => (0, theme_1.isHighContrast)(t.type)), (0, nls_1.localize)('themes.category.hc', "high contrast themes"));
            let picks;
            switch (preferredColorScheme) {
                case theme_1.ColorScheme.DARK:
                    picks = [...darkEntries, ...lightEntries, ...hcEntries];
                    break;
                case theme_1.ColorScheme.HIGH_CONTRAST_DARK:
                case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT:
                    picks = [...hcEntries, ...lightEntries, ...darkEntries];
                    break;
                case theme_1.ColorScheme.LIGHT:
                default:
                    picks = [...lightEntries, ...darkEntries, ...hcEntries];
                    break;
            }
            await picker.openQuickPick(picks, currentTheme);
        }
    });
    const SelectFileIconThemeCommandId = 'workbench.action.selectIconTheme';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SelectFileIconThemeCommandId,
                title: (0, nls_1.localize2)('selectIconTheme.label', 'File Icon Theme'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true
            });
        }
        async run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const options = {
                installMessage: (0, nls_1.localize)('installIconThemes', "Install Additional File Icon Themes..."),
                placeholderMessage: (0, nls_1.localize)('themes.selectIconTheme', "Select File Icon Theme (Up/Down Keys to Preview)"),
                marketplaceTag: 'tag:icon-theme'
            };
            const setTheme = (theme, settingsTarget) => themeService.setFileIconTheme(theme, settingsTarget);
            const getMarketplaceColorThemes = (publisher, name, version) => themeService.getMarketplaceFileIconThemes(publisher, name, version);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const picker = instantiationService.createInstance(InstalledThemesPicker, options, setTheme, getMarketplaceColorThemes);
            const picks = [
                { type: 'separator', label: (0, nls_1.localize)('fileIconThemeCategory', 'file icon themes') },
                { id: '', theme: fileIconThemeData_1.FileIconThemeData.noIconTheme, label: (0, nls_1.localize)('noIconThemeLabel', 'None'), description: (0, nls_1.localize)('noIconThemeDesc', 'Disable File Icons') },
                ...toEntries(await themeService.getFileIconThemes()),
            ];
            await picker.openQuickPick(picks, themeService.getFileIconTheme());
        }
    });
    const SelectProductIconThemeCommandId = 'workbench.action.selectProductIconTheme';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SelectProductIconThemeCommandId,
                title: (0, nls_1.localize2)('selectProductIconTheme.label', 'Product Icon Theme'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true
            });
        }
        async run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const options = {
                installMessage: (0, nls_1.localize)('installProductIconThemes', "Install Additional Product Icon Themes..."),
                browseMessage: '$(plus) ' + (0, nls_1.localize)('browseProductIconThemes', "Browse Additional Product Icon Themes..."),
                placeholderMessage: (0, nls_1.localize)('themes.selectProductIconTheme', "Select Product Icon Theme (Up/Down Keys to Preview)"),
                marketplaceTag: 'tag:product-icon-theme'
            };
            const setTheme = (theme, settingsTarget) => themeService.setProductIconTheme(theme, settingsTarget);
            const getMarketplaceColorThemes = (publisher, name, version) => themeService.getMarketplaceProductIconThemes(publisher, name, version);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const picker = instantiationService.createInstance(InstalledThemesPicker, options, setTheme, getMarketplaceColorThemes);
            const picks = [
                { type: 'separator', label: (0, nls_1.localize)('productIconThemeCategory', 'product icon themes') },
                { id: productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID, theme: productIconThemeData_1.ProductIconThemeData.defaultTheme, label: (0, nls_1.localize)('defaultProductIconThemeLabel', 'Default') },
                ...toEntries(await themeService.getProductIconThemes()),
            ];
            await picker.openQuickPick(picks, themeService.getProductIconTheme());
        }
    });
    commands_1.CommandsRegistry.registerCommand('workbench.action.previewColorTheme', async function (accessor, extension, themeSettingsId) {
        const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
        let themes = findBuiltInThemes(await themeService.getColorThemes(), extension);
        if (themes.length === 0) {
            themes = await themeService.getMarketplaceColorThemes(extension.publisher, extension.name, extension.version);
        }
        for (const theme of themes) {
            if (!themeSettingsId || theme.settingsId === themeSettingsId) {
                await themeService.setColorTheme(theme, 'preview');
                return theme.settingsId;
            }
        }
        return undefined;
    });
    function findBuiltInThemes(themes, extension) {
        return themes.filter(({ extensionData }) => extensionData && extensionData.extensionIsBuiltin && (0, strings_1.equalsIgnoreCase)(extensionData.extensionPublisher, extension.publisher) && (0, strings_1.equalsIgnoreCase)(extensionData.extensionName, extension.name));
    }
    function configurationEntry(label, configureItem) {
        return {
            id: undefined,
            label: label,
            alwaysShow: true,
            buttons: [configureButton],
            configureItem: configureItem
        };
    }
    function openExtensionViewlet(paneCompositeService, query) {
        return paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true).then(viewlet => {
            if (viewlet) {
                (viewlet?.getViewPaneContainer()).search(query);
                viewlet.focus();
            }
        });
    }
    function isItem(i) {
        return i['type'] !== 'separator';
    }
    function toEntry(theme) {
        const settingId = theme.settingsId ?? undefined;
        const item = {
            id: theme.id,
            theme: theme,
            label: theme.label,
            description: theme.description || (theme.label === settingId ? undefined : settingId),
        };
        if (theme.extensionData) {
            item.buttons = [configureButton];
        }
        return item;
    }
    function toEntries(themes, label) {
        const sorter = (t1, t2) => t1.label.localeCompare(t2.label);
        const entries = themes.map(toEntry).sort(sorter);
        if (entries.length > 0 && label) {
            entries.unshift({ type: 'separator', label });
        }
        return entries;
    }
    const configureButton = {
        iconClass: themables_1.ThemeIcon.asClassName(exports.manageExtensionIcon),
        tooltip: (0, nls_1.localize)('manage extension', "Manage Extension"),
    };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.generateColorTheme',
                title: (0, nls_1.localize2)('generateColorTheme.label', 'Generate Color Theme From Current Settings'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const theme = themeService.getColorTheme();
            const colors = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution).getColors();
            const colorIds = colors.map(c => c.id).sort();
            const resultingColors = {};
            const inherited = [];
            for (const colorId of colorIds) {
                const color = theme.getColor(colorId, false);
                if (color) {
                    resultingColors[colorId] = color_1.Color.Format.CSS.formatHexA(color, true);
                }
                else {
                    inherited.push(colorId);
                }
            }
            const nullDefaults = [];
            for (const id of inherited) {
                const color = theme.getColor(id);
                if (color) {
                    resultingColors['__' + id] = color_1.Color.Format.CSS.formatHexA(color, true);
                }
                else {
                    nullDefaults.push(id);
                }
            }
            for (const id of nullDefaults) {
                resultingColors['__' + id] = null;
            }
            let contents = JSON.stringify({
                '$schema': colorThemeSchema_1.colorThemeSchemaId,
                type: theme.type,
                colors: resultingColors,
                tokenColors: theme.tokenColors.filter(t => !!t.scope)
            }, null, '\t');
            contents = contents.replace(/\"__/g, '//"');
            const editorService = accessor.get(editorService_1.IEditorService);
            return editorService.openEditor({ resource: undefined, contents, languageId: 'jsonc', options: { pinned: true } });
        }
    });
    const toggleLightDarkThemesCommandId = 'workbench.action.toggleLightDarkThemes';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: toggleLightDarkThemesCommandId,
                title: (0, nls_1.localize2)('toggleLightDarkThemes.label', 'Toggle between Light/Dark Themes'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true,
            });
        }
        async run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const preferencesService = accessor.get(preferences_1.IPreferencesService);
            if (configurationService.getValue(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)) {
                const message = (0, nls_1.localize)({ key: 'cannotToggle', comment: ['{0} is a setting name'] }, "Cannot toggle between light and dark themes when `{0}` is enabled in settings.", workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME);
                notificationService.prompt(notification_1.Severity.Info, message, [
                    {
                        label: (0, nls_1.localize)('goToSetting', "Open Settings"),
                        run: () => {
                            return preferencesService.openUserSettings({ query: workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME });
                        }
                    }
                ]);
                return;
            }
            const currentTheme = themeService.getColorTheme();
            let newSettingsId = workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME;
            switch (currentTheme.type) {
                case theme_1.ColorScheme.LIGHT:
                    newSettingsId = workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME;
                    break;
                case theme_1.ColorScheme.DARK:
                    newSettingsId = workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME;
                    break;
                case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT:
                    newSettingsId = workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME;
                    break;
                case theme_1.ColorScheme.HIGH_CONTRAST_DARK:
                    newSettingsId = workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME;
                    break;
            }
            const themeSettingId = configurationService.getValue(newSettingsId);
            if (themeSettingId && typeof themeSettingId === 'string') {
                const theme = (await themeService.getColorThemes()).find(t => t.settingsId === themeSettingId);
                if (theme) {
                    themeService.setColorTheme(theme.id, 'auto');
                }
            }
        }
    });
    const browseColorThemesInMarketplaceCommandId = 'workbench.action.browseColorThemesInMarketplace';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: browseColorThemesInMarketplaceCommandId,
                title: (0, nls_1.localize2)('browseColorThemeInMarketPlace.label', 'Browse Color Themes in Marketplace'),
                category: actionCommonCategories_1.Categories.Preferences,
                f1: true,
            });
        }
        async run(accessor) {
            const marketplaceTag = 'category:themes';
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const extensionGalleryService = accessor.get(extensionManagement_1.IExtensionGalleryService);
            const extensionResourceLoaderService = accessor.get(extensionResourceLoader_1.IExtensionResourceLoaderService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            if (!extensionGalleryService.isEnabled() || !extensionResourceLoaderService.supportsExtensionGalleryResources) {
                return;
            }
            const currentTheme = themeService.getColorTheme();
            const getMarketplaceColorThemes = (publisher, name, version) => themeService.getMarketplaceColorThemes(publisher, name, version);
            let selectThemeTimeout;
            const selectTheme = (theme, applyTheme) => {
                if (selectThemeTimeout) {
                    clearTimeout(selectThemeTimeout);
                }
                selectThemeTimeout = window_1.mainWindow.setTimeout(() => {
                    selectThemeTimeout = undefined;
                    const newTheme = (theme ?? currentTheme);
                    themeService.setColorTheme(newTheme, applyTheme ? 'auto' : 'preview').then(undefined, err => {
                        (0, errors_1.onUnexpectedError)(err);
                        themeService.setColorTheme(currentTheme, undefined);
                    });
                }, applyTheme ? 0 : 200);
            };
            const marketplaceThemePicker = instantiationService.createInstance(MarketplaceThemesPicker, getMarketplaceColorThemes, marketplaceTag);
            await marketplaceThemePicker.openQuickPick('', themeService.getColorTheme(), selectTheme).then(undefined, errors_1.onUnexpectedError);
        }
    });
    const ThemesSubMenu = new actions_1.MenuId('ThemesSubMenu');
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
        title: (0, nls_1.localize)('themes', "Themes"),
        submenu: ThemesSubMenu,
        group: '2_configuration',
        order: 7
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
        title: (0, nls_1.localize)({ key: 'miSelectTheme', comment: ['&& denotes a mnemonic'] }, "&&Theme"),
        submenu: ThemesSubMenu,
        group: '2_configuration',
        order: 7
    });
    actions_1.MenuRegistry.appendMenuItem(ThemesSubMenu, {
        command: {
            id: SelectColorThemeCommandId,
            title: (0, nls_1.localize)('selectTheme.label', 'Color Theme')
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(ThemesSubMenu, {
        command: {
            id: SelectFileIconThemeCommandId,
            title: (0, nls_1.localize)('themes.selectIconTheme.label', "File Icon Theme")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(ThemesSubMenu, {
        command: {
            id: SelectProductIconThemeCommandId,
            title: (0, nls_1.localize)('themes.selectProductIconTheme.label', "Product Icon Theme")
        },
        order: 3
    });
    let DefaultThemeUpdatedNotificationContribution = class DefaultThemeUpdatedNotificationContribution {
        static { DefaultThemeUpdatedNotificationContribution_1 = this; }
        static { this.STORAGE_KEY = 'themeUpdatedNotificationShown'; }
        constructor(_notificationService, _workbenchThemeService, _storageService, _commandService, _telemetryService, _hostService) {
            this._notificationService = _notificationService;
            this._workbenchThemeService = _workbenchThemeService;
            this._storageService = _storageService;
            this._commandService = _commandService;
            this._telemetryService = _telemetryService;
            this._hostService = _hostService;
            if (_storageService.getBoolean(DefaultThemeUpdatedNotificationContribution_1.STORAGE_KEY, -1 /* StorageScope.APPLICATION */)) {
                return;
            }
            setTimeout(async () => {
                if (_storageService.getBoolean(DefaultThemeUpdatedNotificationContribution_1.STORAGE_KEY, -1 /* StorageScope.APPLICATION */)) {
                    return;
                }
                if (await this._hostService.hadLastFocus()) {
                    this._storageService.store(DefaultThemeUpdatedNotificationContribution_1.STORAGE_KEY, true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                    if (this._workbenchThemeService.hasUpdatedDefaultThemes()) {
                        this._showYouGotMigratedNotification();
                    }
                    else {
                        const currentTheme = this._workbenchThemeService.getColorTheme().settingsId;
                        if (currentTheme === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT_OLD || currentTheme === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK_OLD) {
                            this._tryNewThemeNotification();
                        }
                    }
                }
            }, 3000);
        }
        async _showYouGotMigratedNotification() {
            const usingLight = this._workbenchThemeService.getColorTheme().type === theme_1.ColorScheme.LIGHT;
            const newThemeSettingsId = usingLight ? workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT : workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK;
            const newTheme = (await this._workbenchThemeService.getColorThemes()).find(theme => theme.settingsId === newThemeSettingsId);
            if (newTheme) {
                const choices = [
                    {
                        label: (0, nls_1.localize)('button.keep', "Keep New Theme"),
                        run: () => {
                            this._writeTelemetry('keepNew');
                        }
                    },
                    {
                        label: (0, nls_1.localize)('button.browse', "Browse Themes"),
                        run: () => {
                            this._writeTelemetry('browse');
                            this._commandService.executeCommand(SelectColorThemeCommandId);
                        }
                    },
                    {
                        label: (0, nls_1.localize)('button.revert', "Revert"),
                        run: async () => {
                            this._writeTelemetry('keepOld');
                            const oldSettingsId = usingLight ? workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT_OLD : workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK_OLD;
                            const oldTheme = (await this._workbenchThemeService.getColorThemes()).find(theme => theme.settingsId === oldSettingsId);
                            if (oldTheme) {
                                this._workbenchThemeService.setColorTheme(oldTheme, 'auto');
                            }
                        }
                    }
                ];
                await this._notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)({ key: 'themeUpdatedNotification', comment: ['{0} is the name of the new default theme'] }, "Visual Studio Code now ships with a new default theme '{0}'. If you prefer, you can switch back to the old theme or try one of the many other color themes available.", newTheme.label), choices, {
                    onCancel: () => this._writeTelemetry('cancel')
                });
            }
        }
        async _tryNewThemeNotification() {
            const newThemeSettingsId = this._workbenchThemeService.getColorTheme().type === theme_1.ColorScheme.LIGHT ? workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT : workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK;
            const theme = (await this._workbenchThemeService.getColorThemes()).find(theme => theme.settingsId === newThemeSettingsId);
            if (theme) {
                const choices = [{
                        label: (0, nls_1.localize)('button.tryTheme', "Try New Theme"),
                        run: () => {
                            this._writeTelemetry('tryNew');
                            this._workbenchThemeService.setColorTheme(theme, 'auto');
                        }
                    },
                    {
                        label: (0, nls_1.localize)('button.cancel', "Cancel"),
                        run: () => {
                            this._writeTelemetry('cancel');
                        }
                    }];
                await this._notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)({ key: 'newThemeNotification', comment: ['{0} is the name of the new default theme'] }, "Visual Studio Code now ships with a new default theme '{0}'. Do you want to give it a try?", theme.label), choices, { onCancel: () => this._writeTelemetry('cancel') });
            }
        }
        _writeTelemetry(outcome) {
            this._telemetryService.publicLog2('themeUpdatedNotication', {
                web: platform_2.isWeb,
                reaction: outcome
            });
        }
    };
    DefaultThemeUpdatedNotificationContribution = DefaultThemeUpdatedNotificationContribution_1 = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, commands_1.ICommandService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, host_1.IHostService)
    ], DefaultThemeUpdatedNotificationContribution);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(DefaultThemeUpdatedNotificationContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVzLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3RoZW1lcy9icm93c2VyL3RoZW1lcy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWlEbkYsUUFBQSxtQkFBbUIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsa0NBQWtDLEVBQUUsa0JBQU8sQ0FBQyxJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsbUVBQW1FLENBQUMsQ0FBQyxDQUFDO0lBSXhNLElBQUssYUFJSjtJQUpELFdBQUssYUFBYTtRQUNqQiwrQ0FBOEIsQ0FBQTtRQUM5QiwrQ0FBOEIsQ0FBQTtRQUM5QixvREFBbUMsQ0FBQTtJQUNwQyxDQUFDLEVBSkksYUFBYSxLQUFiLGFBQWEsUUFJakI7SUFFRCxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQVk1QixZQUNrQix5QkFBMkcsRUFDM0csZ0JBQXdCLEVBRWYsdUJBQWtFLEVBQy9ELDBCQUF3RSxFQUNqRixpQkFBc0QsRUFDN0QsVUFBd0MsRUFDbkMsZUFBa0QsRUFDekMsb0JBQWdFLEVBQzNFLGFBQThDO1lBVDdDLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBa0Y7WUFDM0cscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFRO1lBRUUsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUM5QywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQ2hFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDNUMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNsQixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDeEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUEyQjtZQUMxRCxrQkFBYSxH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