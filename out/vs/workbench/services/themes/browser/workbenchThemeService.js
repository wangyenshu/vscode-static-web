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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/registry/common/platform", "vs/base/common/errors", "vs/platform/configuration/common/configuration", "vs/workbench/services/themes/common/colorThemeData", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/workbench/services/themes/common/fileIconThemeSchema", "vs/base/common/lifecycle", "vs/workbench/services/themes/browser/fileIconThemeData", "vs/base/browser/dom", "vs/workbench/services/environment/browser/environmentService", "vs/platform/files/common/files", "vs/base/common/resources", "vs/workbench/services/themes/common/colorThemeSchema", "vs/platform/instantiation/common/extensions", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/layout/browser/layoutService", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/workbench/services/themes/common/themeExtensionPoints", "vs/workbench/services/themes/common/themeConfiguration", "vs/workbench/services/themes/browser/productIconThemeData", "vs/workbench/services/themes/common/productIconThemeSchema", "vs/platform/log/common/log", "vs/base/common/platform", "vs/platform/theme/common/theme", "vs/workbench/services/themes/common/hostColorSchemeService", "vs/base/common/async", "vs/workbench/services/userData/browser/userDataInit", "vs/platform/theme/browser/iconsStyleSheet", "vs/platform/theme/common/colorRegistry", "vs/editor/common/languages/language", "vs/base/browser/window"], function (require, exports, nls, types, extensions_1, workbenchThemeService_1, storage_1, telemetry_1, platform_1, errors, configuration_1, colorThemeData_1, themeService_1, event_1, fileIconThemeSchema_1, lifecycle_1, fileIconThemeData_1, dom_1, environmentService_1, files_1, resources, colorThemeSchema_1, extensions_2, remoteHosts_1, layoutService_1, extensionResourceLoader_1, themeExtensionPoints_1, themeConfiguration_1, productIconThemeData_1, productIconThemeSchema_1, log_1, platform_2, theme_1, hostColorSchemeService_1, async_1, userDataInit_1, iconsStyleSheet_1, colorRegistry_1, language_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchThemeService = void 0;
    // implementation
    const defaultThemeExtensionId = 'vscode-theme-defaults';
    const DEFAULT_FILE_ICON_THEME_ID = 'vscode.vscode-theme-seti-vs-seti';
    const fileIconsEnabledClass = 'file-icons-enabled';
    const colorThemeRulesClassName = 'contributedColorTheme';
    const fileIconThemeRulesClassName = 'contributedFileIconTheme';
    const productIconThemeRulesClassName = 'contributedProductIconTheme';
    const themingRegistry = platform_1.Registry.as(themeService_1.Extensions.ThemingContribution);
    function validateThemeId(theme) {
        // migrations
        switch (theme) {
            case workbenchThemeService_1.VS_LIGHT_THEME: return `vs ${defaultThemeExtensionId}-themes-light_vs-json`;
            case workbenchThemeService_1.VS_DARK_THEME: return `vs-dark ${defaultThemeExtensionId}-themes-dark_vs-json`;
            case workbenchThemeService_1.VS_HC_THEME: return `hc-black ${defaultThemeExtensionId}-themes-hc_black-json`;
            case workbenchThemeService_1.VS_HC_LIGHT_THEME: return `hc-light ${defaultThemeExtensionId}-themes-hc_light-json`;
        }
        return theme;
    }
    const colorThemesExtPoint = (0, themeExtensionPoints_1.registerColorThemeExtensionPoint)();
    const fileIconThemesExtPoint = (0, themeExtensionPoints_1.registerFileIconThemeExtensionPoint)();
    const productIconThemesExtPoint = (0, themeExtensionPoints_1.registerProductIconThemeExtensionPoint)();
    let WorkbenchThemeService = class WorkbenchThemeService extends lifecycle_1.Disposable {
        constructor(extensionService, storageService, configurationService, telemetryService, environmentService, fileService, extensionResourceLoaderService, layoutService, logService, hostColorService, userDataInitializationService, languageService) {
            super();
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.environmentService = environmentService;
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.logService = logService;
            this.hostColorService = hostColorService;
            this.userDataInitializationService = userDataInitializationService;
            this.languageService = languageService;
            this.hasDefaultUpdated = false;
            this.themeExtensionsActivated = new Map();
            this.container = layoutService.mainContainer;
            this.settings = new themeConfiguration_1.ThemeConfiguration(configurationService, hostColorService);
            this.colorThemeRegistry = this._register(new themeExtensionPoints_1.ThemeRegistry(colorThemesExtPoint, colorThemeData_1.ColorThemeData.fromExtensionTheme));
            this.colorThemeWatcher = this._register(new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentColorTheme.bind(this)));
            this.onColorThemeChange = new event_1.Emitter({ leakWarningThreshold: 400 });
            this.currentColorTheme = colorThemeData_1.ColorThemeData.createUnloadedTheme('');
            this.colorThemeSequencer = new async_1.Sequencer();
            this.fileIconThemeWatcher = this._register(new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentFileIconTheme.bind(this)));
            this.fileIconThemeRegistry = this._register(new themeExtensionPoints_1.ThemeRegistry(fileIconThemesExtPoint, fileIconThemeData_1.FileIconThemeData.fromExtensionTheme, true, fileIconThemeData_1.FileIconThemeData.noIconTheme));
            this.fileIconThemeLoader = new fileIconThemeData_1.FileIconThemeLoader(extensionResourceLoaderService, languageService);
            this.onFileIconThemeChange = new event_1.Emitter({ leakWarningThreshold: 400 });
            this.currentFileIconTheme = fileIconThemeData_1.FileIconThemeData.createUnloadedTheme('');
            this.fileIconThemeSequencer = new async_1.Sequencer();
            this.productIconThemeWatcher = this._register(new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentProductIconTheme.bind(this)));
            this.productIconThemeRegistry = this._register(new themeExtensionPoints_1.ThemeRegistry(productIconThemesExtPoint, productIconThemeData_1.ProductIconThemeData.fromExtensionTheme, true, productIconThemeData_1.ProductIconThemeData.defaultTheme));
            this.onProductIconThemeChange = new event_1.Emitter();
            this.currentProductIconTheme = productIconThemeData_1.ProductIconThemeData.createUnloadedTheme('');
            this.productIconThemeSequencer = new async_1.Sequencer();
            // In order to avoid paint flashing for tokens, because
            // themes are loaded asynchronously, we need to initialize
            // a color theme document with good defaults until the theme is loaded
            let themeData = colorThemeData_1.ColorThemeData.fromStorageData(this.storageService);
            const colorThemeSetting = this.settings.colorTheme;
            if (themeData && colorThemeSetting !== themeData.settingsId && this.settings.isDefaultColorTheme()) {
                this.hasDefaultUpdated = themeData.settingsId === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK_OLD || themeData.settingsId === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT_OLD;
                // the web has different defaults than the desktop, therefore do not restore when the setting is the default theme and the storage doesn't match that.
                themeData = undefined;
            }
            const defaultColorMap = colorThemeSetting === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT ? workbenchThemeService_1.COLOR_THEME_LIGHT_INITIAL_COLORS : colorThemeSetting === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK ? workbenchThemeService_1.COLOR_THEME_DARK_INITIAL_COLORS : undefined;
            if (!themeData) {
                const initialColorTheme = environmentService.options?.initialColorTheme;
                if (initialColorTheme) {
                    themeData = colorThemeData_1.ColorThemeData.createUnloadedThemeForThemeType(initialColorTheme.themeType, initialColorTheme.colors ?? defaultColorMap);
                }
            }
            if (!themeData) {
                themeData = colorThemeData_1.ColorThemeData.createUnloadedThemeForThemeType(platform_2.isWeb ? theme_1.ColorScheme.LIGHT : theme_1.ColorScheme.DARK, defaultColorMap);
            }
            themeData.setCustomizations(this.settings);
            this.applyTheme(themeData, undefined, true);
            const fileIconData = fileIconThemeData_1.FileIconThemeData.fromStorageData(this.storageService);
            if (fileIconData) {
                this.applyAndSetFileIconTheme(fileIconData, true);
            }
            const productIconData = productIconThemeData_1.ProductIconThemeData.fromStorageData(this.storageService);
            if (productIconData) {
                this.applyAndSetProductIconTheme(productIconData, true);
            }
            extensionService.whenInstalledExtensionsRegistered().then(_ => {
                this.installConfigurationListener();
                this.installPreferredSchemeListener();
                this.installRegistryListeners();
                this.initialize().catch(errors.onUnexpectedError);
            });
            const codiconStyleSheet = (0, dom_1.createStyleSheet)();
            codiconStyleSheet.id = 'codiconStyles';
            const iconsStyleSheet = this._register((0, iconsStyleSheet_1.getIconsStyleSheet)(this));
            function updateAll() {
                codiconStyleSheet.textContent = iconsStyleSheet.getCSS();
            }
            const delayer = this._register(new async_1.RunOnceScheduler(updateAll, 0));
            this._register(iconsStyleSheet.onDidChange(() => delayer.schedule()));
            delayer.schedule();
        }
        initialize() {
            const extDevLocs = this.environmentService.extensionDevelopmentLocationURI;
            const extDevLoc = extDevLocs && extDevLocs.length === 1 ? extDevLocs[0] : undefined; // in dev mode, switch to a theme provided by the extension under dev.
            const initializeColorTheme = async () => {
                const devThemes = this.colorThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    const matchedColorTheme = devThemes.find(theme => theme.type === this.currentColorTheme.type);
                    return this.setColorTheme(matchedColorTheme ? matchedColorTheme.id : devThemes[0].id, undefined);
                }
                let theme = this.colorThemeRegistry.findThemeBySettingsId(this.settings.colorTheme, undefined);
                if (!theme) {
                    // If the current theme is not available, first make sure setting sync is complete
                    await this.userDataInitializationService.whenInitializationFinished();
                    // try to get the theme again, now with a fallback to the default themes
                    const fallbackTheme = this.currentColorTheme.type === theme_1.ColorScheme.LIGHT ? workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT : workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK;
                    theme = this.colorThemeRegistry.findThemeBySettingsId(this.settings.colorTheme, fallbackTheme);
                }
                return this.setColorTheme(theme && theme.id, undefined);
            };
            const initializeFileIconTheme = async () => {
                const devThemes = this.fileIconThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    return this.setFileIconTheme(devThemes[0].id, 8 /* ConfigurationTarget.MEMORY */);
                }
                let theme = this.fileIconThemeRegistry.findThemeBySettingsId(this.settings.fileIconTheme);
                if (!theme) {
                    // If the current theme is not available, first make sure setting sync is complete
                    await this.userDataInitializationService.whenInitializationFinished();
                    theme = this.fileIconThemeRegistry.findThemeBySettingsId(this.settings.fileIconTheme);
                }
                return this.setFileIconTheme(theme ? theme.id : DEFAULT_FILE_ICON_THEME_ID, undefined);
            };
            const initializeProductIconTheme = async () => {
                const devThemes = this.productIconThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    return this.setProductIconTheme(devThemes[0].id, 8 /* ConfigurationTarget.MEMORY */);
                }
                let theme = this.productIconThemeRegistry.findThemeBySettingsId(this.settings.productIconTheme);
                if (!theme) {
                    // If the current theme is not available, first make sure setting sync is complete
                    await this.userDataInitializationService.whenInitializationFinished();
                    theme = this.productIconThemeRegistry.findThemeBySettingsId(this.settings.productIconTheme);
                }
                return this.setProductIconTheme(theme ? theme.id : productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID, undefined);
            };
            return Promise.all([initializeColorTheme(), initializeFileIconTheme(), initializeProductIconTheme()]);
        }
        installConfigurationListener() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.COLOR_THEME)
                    || e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME)
                    || e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME)
                    || e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME)
                    || e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME)
                    || e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)
                    || e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.DETECT_HC)
                    || e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.SYSTEM_COLOR_THEME)) {
                    this.restoreColorTheme();
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME)) {
                    this.restoreFileIconTheme();
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME)) {
                    this.restoreProductIconTheme();
                }
                if (this.currentColorTheme) {
                    let hasColorChanges = false;
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.COLOR_CUSTOMIZATIONS)) {
                        this.currentColorTheme.setCustomColors(this.settings.colorCustomizations);
                        hasColorChanges = true;
                    }
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.TOKEN_COLOR_CUSTOMIZATIONS)) {
                        this.currentColorTheme.setCustomTokenColors(this.settings.tokenColorCustomizations);
                        hasColorChanges = true;
                    }
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS)) {
                        this.currentColorTheme.setCustomSemanticTokenColors(this.settings.semanticTokenColorCustomizations);
                        hasColorChanges = true;
                    }
                    if (hasColorChanges) {
                        this.updateDynamicCSSRules(this.currentColorTheme);
                        this.onColorThemeChange.fire(this.currentColorTheme);
                    }
                }
            }));
        }
        installRegistryListeners() {
            let prevColorId = undefined;
            // update settings schema setting for theme specific settings
            this._register(this.colorThemeRegistry.onDidChange(async (event) => {
                (0, themeConfiguration_1.updateColorThemeConfigurationSchemas)(event.themes);
                if (await this.restoreColorTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentColorTheme.settingsId === workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK && !types.isUndefined(prevColorId) && await this.colorThemeRegistry.findThemeById(prevColorId)) {
                        await this.setColorTheme(prevColorId, 'auto');
                        prevColorId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentColorTheme.settingsId)) {
                        await this.reloadCurrentColorTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentColorTheme.settingsId)) {
                    // current theme is no longer available
                    prevColorId = this.currentColorTheme.id;
                    const defaultTheme = this.colorThemeRegistry.findThemeBySettingsId(workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK);
                    await this.setColorTheme(defaultTheme, 'auto');
                }
            }));
            let prevFileIconId = undefined;
            this._register(this._register(this.fileIconThemeRegistry.onDidChange(async (event) => {
                (0, themeConfiguration_1.updateFileIconThemeConfigurationSchemas)(event.themes);
                if (await this.restoreFileIconTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentFileIconTheme.id === DEFAULT_FILE_ICON_THEME_ID && !types.isUndefined(prevFileIconId) && this.fileIconThemeRegistry.findThemeById(prevFileIconId)) {
                        await this.setFileIconTheme(prevFileIconId, 'auto');
                        prevFileIconId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentFileIconTheme.settingsId)) {
                        await this.reloadCurrentFileIconTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentFileIconTheme.settingsId)) {
                    // current theme is no longer available
                    prevFileIconId = this.currentFileIconTheme.id;
                    await this.setFileIconTheme(DEFAULT_FILE_ICON_THEME_ID, 'auto');
                }
            })));
            let prevProductIconId = undefined;
            this._register(this.productIconThemeRegistry.onDidChange(async (event) => {
                (0, themeConfiguration_1.updateProductIconThemeConfigurationSchemas)(event.themes);
                if (await this.restoreProductIconTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentProductIconTheme.id === productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID && !types.isUndefined(prevProductIconId) && this.productIconThemeRegistry.findThemeById(prevProductIconId)) {
                        await this.setProductIconTheme(prevProductIconId, 'auto');
                        prevProductIconId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentProductIconTheme.settingsId)) {
                        await this.reloadCurrentProductIconTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentProductIconTheme.settingsId)) {
                    // current theme is no longer available
                    prevProductIconId = this.currentProductIconTheme.id;
                    await this.setProductIconTheme(productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID, 'auto');
                }
            }));
            this._register(this.languageService.onDidChange(() => this.reloadCurrentFileIconTheme()));
            return Promise.all([this.getColorThemes(), this.getFileIconThemes(), this.getProductIconThemes()]).then(([ct, fit, pit]) => {
                (0, themeConfiguration_1.updateColorThemeConfigurationSchemas)(ct);
                (0, themeConfiguration_1.updateFileIconThemeConfigurationSchemas)(fit);
                (0, themeConfiguration_1.updateProductIconThemeConfigurationSchemas)(pit);
            });
        }
        // preferred scheme handling
        installPreferredSchemeListener() {
            this._register(this.hostColorService.onDidChangeColorScheme(() => this.restoreColorTheme()));
        }
        hasUpdatedDefaultThemes() {
            return this.hasDefaultUpdated;
        }
        getColorTheme() {
            return this.currentColorTheme;
        }
        async getColorThemes() {
            return this.colorThemeRegistry.getThemes();
        }
        getPreferredColorScheme() {
            return this.settings.getPreferredColorScheme();
        }
        async getMarketplaceColorThemes(publisher, name, version) {
            const extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({ publisher, name, version }, 'extension');
            if (extensionLocation) {
                try {
                    const manifestContent = await this.extensionResourceLoaderService.readExtensionResource(resources.joinPath(extensionLocation, 'package.json'));
                    return this.colorThemeRegistry.getMarketplaceThemes(JSON.parse(manifestContent), extensionLocation, workbenchThemeService_1.ExtensionData.fromName(publisher, name));
                }
                catch (e) {
                    this.logService.error('Problem loading themes from marketplace', e);
                }
            }
            return [];
        }
        get onDidColorThemeChange() {
            return this.onColorThemeChange.event;
        }
        setColorTheme(themeIdOrTheme, settingsTarget) {
            return this.colorThemeSequencer.queue(async () => {
                return this.internalSetColorTheme(themeIdOrTheme, settingsTarget);
            });
        }
        async internalSetColorTheme(themeIdOrTheme, settingsTarget) {
            if (!themeIdOrTheme) {
                return null;
            }
            const themeId = types.isString(themeIdOrTheme) ? validateThemeId(themeIdOrTheme) : themeIdOrTheme.id;
            if (this.currentColorTheme.isLoaded && themeId === this.currentColorTheme.id) {
                if (settingsTarget !== 'preview') {
                    this.currentColorTheme.toStorage(this.storageService);
                }
                return this.settings.setColorTheme(this.currentColorTheme, settingsTarget);
            }
            let themeData = this.colorThemeRegistry.findThemeById(themeId);
            if (!themeData) {
                if (themeIdOrTheme instanceof colorThemeData_1.ColorThemeData) {
                    themeData = themeIdOrTheme;
                }
                else {
                    return null;
                }
            }
            try {
                await themeData.ensureLoaded(this.extensionResourceLoaderService);
                themeData.setCustomizations(this.settings);
                return this.applyTheme(themeData, settingsTarget);
            }
            catch (error) {
                throw new Error(nls.localize('error.cannotloadtheme', "Unable to load {0}: {1}", themeData.location?.toString(), error.message));
            }
        }
        reloadCurrentColorTheme() {
            return this.colorThemeSequencer.queue(async () => {
                try {
                    const theme = this.colorThemeRegistry.findThemeBySettingsId(this.currentColorTheme.settingsId) || this.currentColorTheme;
                    await theme.reload(this.extensionResourceLoaderService);
                    theme.setCustomizations(this.settings);
                    await this.applyTheme(theme, undefined, false);
                }
                catch (error) {
                    this.logService.info('Unable to reload {0}: {1}', this.currentColorTheme.location?.toString());
                }
            });
        }
        async restoreColorTheme() {
            return this.colorThemeSequencer.queue(async () => {
                const settingId = this.settings.colorTheme;
                const theme = this.colorThemeRegistry.findThemeBySettingsId(settingId);
                if (theme) {
                    if (settingId !== this.currentColorTheme.settingsId) {
                        await this.internalSetColorTheme(theme.id, undefined);
                    }
                    else if (theme !== this.currentColorTheme) {
                        await theme.ensureLoaded(this.extensionResourceLoaderService);
                        theme.setCustomizations(this.settings);
                        await this.applyTheme(theme, undefined, true);
                    }
                    return true;
                }
                return false;
            });
        }
        updateDynamicCSSRules(themeData) {
            const cssRules = new Set();
            const ruleCollector = {
                addRule: (rule) => {
                    if (!cssRules.has(rule)) {
                        cssRules.add(rule);
                    }
                }
            };
            ruleCollector.addRule(`.monaco-workbench { forced-color-adjust: none; }`);
            themingRegistry.getThemingParticipants().forEach(p => p(themeData, ruleCollector, this.environmentService));
            const colorVariables = [];
            for (const item of (0, colorRegistry_1.getColorRegistry)().getColors()) {
                const color = themeData.getColor(item.id, true);
                if (color) {
                    colorVariables.push(`${(0, colorRegistry_1.asCssVariableName)(item.id)}: ${color.toString()};`);
                }
            }
            ruleCollector.addRule(`.monaco-workbench { ${colorVariables.join('\n')} }`);
            _applyRules([...cssRules].join('\n'), colorThemeRulesClassName);
        }
        applyTheme(newTheme, settingsTarget, silent = false) {
            this.updateDynamicCSSRules(newTheme);
            if (this.currentColorTheme.id) {
                this.container.classList.remove(...this.currentColorTheme.classNames);
            }
            else {
                this.container.classList.remove(workbenchThemeService_1.VS_DARK_THEME, workbenchThemeService_1.VS_LIGHT_THEME, workbenchThemeService_1.VS_HC_THEME, workbenchThemeService_1.VS_HC_LIGHT_THEME);
            }
            this.container.classList.add(...newTheme.classNames);
            this.currentColorTheme.clearCaches();
            this.currentColorTheme = newTheme;
            if (!this.colorThemingParticipantChangeListener) {
                this.colorThemingParticipantChangeListener = themingRegistry.onThemingParticipantAdded(_ => this.updateDynamicCSSRules(this.currentColorTheme));
            }
            this.colorThemeWatcher.update(newTheme);
            this.sendTelemetry(newTheme.id, newTheme.extensionData, 'color');
            if (silent) {
                return Promise.resolve(null);
            }
            this.onColorThemeChange.fire(this.currentColorTheme);
            // remember theme data for a quick restore
            if (newTheme.isLoaded && settingsTarget !== 'preview') {
                newTheme.toStorage(this.storageService);
            }
            return this.settings.setColorTheme(this.currentColorTheme, settingsTarget);
        }
        sendTelemetry(themeId, themeData, themeType) {
            if (themeData) {
                const key = themeType + themeData.extensionId;
                if (!this.themeExtensionsActivated.get(key)) {
                    this.telemetryService.publicLog2('activatePlugin', {
                        id: themeData.extensionId,
                        name: themeData.extensionName,
                        isBuiltin: themeData.extensionIsBuiltin,
                        publisherDisplayName: themeData.extensionPublisher,
                        themeId: themeId
                    });
                    this.themeExtensionsActivated.set(key, true);
                }
            }
        }
        async getFileIconThemes() {
            return this.fileIconThemeRegistry.getThemes();
        }
        getFileIconTheme() {
            return this.currentFileIconTheme;
        }
        get onDidFileIconThemeChange() {
            return this.onFileIconThemeChange.event;
        }
        async setFileIconTheme(iconThemeOrId, settingsTarget) {
            return this.fileIconThemeSequencer.queue(async () => {
                return this.internalSetFileIconTheme(iconThemeOrId, settingsTarget);
            });
        }
        async internalSetFileIconTheme(iconThemeOrId, settingsTarget) {
            if (iconThemeOrId === undefined) {
                iconThemeOrId = '';
            }
            const themeId = types.isString(iconThemeOrId) ? iconThemeOrId : iconThemeOrId.id;
            if (themeId !== this.currentFileIconTheme.id || !this.currentFileIconTheme.isLoaded) {
                let newThemeData = this.fileIconThemeRegistry.findThemeById(themeId);
                if (!newThemeData && iconThemeOrId instanceof fileIconThemeData_1.FileIconThemeData) {
                    newThemeData = iconThemeOrId;
                }
                if (!newThemeData) {
                    newThemeData = fileIconThemeData_1.FileIconThemeData.noIconTheme;
                }
                await newThemeData.ensureLoaded(this.fileIconThemeLoader);
                this.applyAndSetFileIconTheme(newThemeData); // updates this.currentFileIconTheme
            }
            const themeData = this.currentFileIconTheme;
            // remember theme data for a quick restore
            if (themeData.isLoaded && settingsTarget !== 'preview' && (!themeData.location || !(0, remoteHosts_1.getRemoteAuthority)(themeData.location))) {
                themeData.toStorage(this.storageService);
            }
            await this.settings.setFileIconTheme(this.currentFileIconTheme, settingsTarget);
            return themeData;
        }
        async getMarketplaceFileIconThemes(publisher, name, version) {
            const extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({ publisher, name, version }, 'extension');
            if (extensionLocation) {
                try {
                    const manifestContent = await this.extensionResourceLoaderService.readExtensionResource(resources.joinPath(extensionLocation, 'package.json'));
                    return this.fileIconThemeRegistry.getMarketplaceThemes(JSON.parse(manifestContent), extensionLocation, workbenchThemeService_1.ExtensionData.fromName(publisher, name));
                }
                catch (e) {
                    this.logService.error('Problem loading themes from marketplace', e);
                }
            }
            return [];
        }
        async reloadCurrentFileIconTheme() {
            return this.fileIconThemeSequencer.queue(async () => {
                await this.currentFileIconTheme.reload(this.fileIconThemeLoader);
                this.applyAndSetFileIconTheme(this.currentFileIconTheme);
            });
        }
        async restoreFileIconTheme() {
            return this.fileIconThemeSequencer.queue(async () => {
                const settingId = this.settings.fileIconTheme;
                const theme = this.fileIconThemeRegistry.findThemeBySettingsId(settingId);
                if (theme) {
                    if (settingId !== this.currentFileIconTheme.settingsId) {
                        await this.internalSetFileIconTheme(theme.id, undefined);
                    }
                    else if (theme !== this.currentFileIconTheme) {
                        await theme.ensureLoaded(this.fileIconThemeLoader);
                        this.applyAndSetFileIconTheme(theme, true);
                    }
                    return true;
                }
                return false;
            });
        }
        applyAndSetFileIconTheme(iconThemeData, silent = false) {
            this.currentFileIconTheme = iconThemeData;
            _applyRules(iconThemeData.styleSheetContent, fileIconThemeRulesClassName);
            if (iconThemeData.id) {
                this.container.classList.add(fileIconsEnabledClass);
            }
            else {
                this.container.classList.remove(fileIconsEnabledClass);
            }
            this.fileIconThemeWatcher.update(iconThemeData);
            if (iconThemeData.id) {
                this.sendTelemetry(iconThemeData.id, iconThemeData.extensionData, 'fileIcon');
            }
            if (!silent) {
                this.onFileIconThemeChange.fire(this.currentFileIconTheme);
            }
        }
        async getProductIconThemes() {
            return this.productIconThemeRegistry.getThemes();
        }
        getProductIconTheme() {
            return this.currentProductIconTheme;
        }
        get onDidProductIconThemeChange() {
            return this.onProductIconThemeChange.event;
        }
        async setProductIconTheme(iconThemeOrId, settingsTarget) {
            return this.productIconThemeSequencer.queue(async () => {
                return this.internalSetProductIconTheme(iconThemeOrId, settingsTarget);
            });
        }
        async internalSetProductIconTheme(iconThemeOrId, settingsTarget) {
            if (iconThemeOrId === undefined) {
                iconThemeOrId = '';
            }
            const themeId = types.isString(iconThemeOrId) ? iconThemeOrId : iconThemeOrId.id;
            if (themeId !== this.currentProductIconTheme.id || !this.currentProductIconTheme.isLoaded) {
                let newThemeData = this.productIconThemeRegistry.findThemeById(themeId);
                if (!newThemeData && iconThemeOrId instanceof productIconThemeData_1.ProductIconThemeData) {
                    newThemeData = iconThemeOrId;
                }
                if (!newThemeData) {
                    newThemeData = productIconThemeData_1.ProductIconThemeData.defaultTheme;
                }
                await newThemeData.ensureLoaded(this.extensionResourceLoaderService, this.logService);
                this.applyAndSetProductIconTheme(newThemeData); // updates this.currentProductIconTheme
            }
            const themeData = this.currentProductIconTheme;
            // remember theme data for a quick restore
            if (themeData.isLoaded && settingsTarget !== 'preview' && (!themeData.location || !(0, remoteHosts_1.getRemoteAuthority)(themeData.location))) {
                themeData.toStorage(this.storageService);
            }
            await this.settings.setProductIconTheme(this.currentProductIconTheme, settingsTarget);
            return themeData;
        }
        async getMarketplaceProductIconThemes(publisher, name, version) {
            const extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({ publisher, name, version }, 'extension');
            if (extensionLocation) {
                try {
                    const manifestContent = await this.extensionResourceLoaderService.readExtensionResource(resources.joinPath(extensionLocation, 'package.json'));
                    return this.productIconThemeRegistry.getMarketplaceThemes(JSON.parse(manifestContent), extensionLocation, workbenchThemeService_1.ExtensionData.fromName(publisher, name));
                }
                catch (e) {
                    this.logService.error('Problem loading themes from marketplace', e);
                }
            }
            return [];
        }
        async reloadCurrentProductIconTheme() {
            return this.productIconThemeSequencer.queue(async () => {
                await this.currentProductIconTheme.reload(this.extensionResourceLoaderService, this.logService);
                this.applyAndSetProductIconTheme(this.currentProductIconTheme);
            });
        }
        async restoreProductIconTheme() {
            return this.productIconThemeSequencer.queue(async () => {
                const settingId = this.settings.productIconTheme;
                const theme = this.productIconThemeRegistry.findThemeBySettingsId(settingId);
                if (theme) {
                    if (settingId !== this.currentProductIconTheme.settingsId) {
                        await this.internalSetProductIconTheme(theme.id, undefined);
                    }
                    else if (theme !== this.currentProductIconTheme) {
                        await theme.ensureLoaded(this.extensionResourceLoaderService, this.logService);
                        this.applyAndSetProductIconTheme(theme, true);
                    }
                    return true;
                }
                return false;
            });
        }
        applyAndSetProductIconTheme(iconThemeData, silent = false) {
            this.currentProductIconTheme = iconThemeData;
            _applyRules(iconThemeData.styleSheetContent, productIconThemeRulesClassName);
            this.productIconThemeWatcher.update(iconThemeData);
            if (iconThemeData.id) {
                this.sendTelemetry(iconThemeData.id, iconThemeData.extensionData, 'productIcon');
            }
            if (!silent) {
                this.onProductIconThemeChange.fire(this.currentProductIconTheme);
            }
        }
    };
    exports.WorkbenchThemeService = WorkbenchThemeService;
    exports.WorkbenchThemeService = WorkbenchThemeService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, storage_1.IStorageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(7, layoutService_1.IWorkbenchLayoutService),
        __param(8, log_1.ILogService),
        __param(9, hostColorSchemeService_1.IHostColorSchemeService),
        __param(10, userDataInit_1.IUserDataInitializationService),
        __param(11, language_1.ILanguageService)
    ], WorkbenchThemeService);
    class ThemeFileWatcher {
        constructor(fileService, environmentService, onUpdate) {
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.onUpdate = onUpdate;
        }
        update(theme) {
            if (!resources.isEqual(theme.location, this.watchedLocation)) {
                this.dispose();
                if (theme.location && (theme.watch || this.environmentService.isExtensionDevelopment)) {
                    this.watchedLocation = theme.location;
                    this.watcherDisposable = this.fileService.watch(theme.location);
                    this.fileService.onDidFilesChange(e => {
                        if (this.watchedLocation && e.contains(this.watchedLocation, 0 /* FileChangeType.UPDATED */)) {
                            this.onUpdate();
                        }
                    });
                }
            }
        }
        dispose() {
            this.watcherDisposable = (0, lifecycle_1.dispose)(this.watcherDisposable);
            this.fileChangeListener = (0, lifecycle_1.dispose)(this.fileChangeListener);
            this.watchedLocation = undefined;
        }
    }
    function _applyRules(styleSheetContent, rulesClassName) {
        const themeStyles = window_1.mainWindow.document.head.getElementsByClassName(rulesClassName);
        if (themeStyles.length === 0) {
            const elStyle = (0, dom_1.createStyleSheet)();
            elStyle.className = rulesClassName;
            elStyle.textContent = styleSheetContent;
        }
        else {
            themeStyles[0].textContent = styleSheetContent;
        }
    }
    (0, colorThemeSchema_1.registerColorThemeSchemas)();
    (0, fileIconThemeSchema_1.registerFileIconThemeSchemas)();
    (0, productIconThemeSchema_1.registerProductIconThemeSchemas)();
    // The WorkbenchThemeService should stay eager as the constructor restores the
    // last used colors / icons from storage. This needs to happen as quickly as possible
    // for a flicker-free startup experience.
    (0, extensions_2.registerSingleton)(workbenchThemeService_1.IWorkbenchThemeService, WorkbenchThemeService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoVGhlbWVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RoZW1lcy9icm93c2VyL3dvcmtiZW5jaFRoZW1lU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQ2hHLGlCQUFpQjtJQUVqQixNQUFNLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDO0lBRXhELE1BQU0sMEJBQTBCLEdBQUcsa0NBQWtDLENBQUM7SUFDdEUsTUFBTSxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQztJQUVuRCxNQUFNLHdCQUF3QixHQUFHLHVCQUF1QixDQUFDO0lBQ3pELE1BQU0sMkJBQTJCLEdBQUcsMEJBQTBCLENBQUM7SUFDL0QsTUFBTSw4QkFBOEIsR0FBRyw2QkFBNkIsQ0FBQztJQUVyRSxNQUFNLGVBQWUsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBbUIseUJBQWlCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUU3RixTQUFTLGVBQWUsQ0FBQyxLQUFhO1FBQ3JDLGFBQWE7UUFDYixRQUFRLEtBQUssRUFBRSxDQUFDO1lBQ2YsS0FBSyxzQ0FBYyxDQUFDLENBQUMsT0FBTyxNQUFNLHVCQUF1Qix1QkFBdUIsQ0FBQztZQUNqRixLQUFLLHFDQUFhLENBQUMsQ0FBQyxPQUFPLFdBQVcsdUJBQXVCLHNCQUFzQixDQUFDO1lBQ3BGLEtBQUssbUNBQVcsQ0FBQyxDQUFDLE9BQU8sWUFBWSx1QkFBdUIsdUJBQXVCLENBQUM7WUFDcEYsS0FBSyx5Q0FBaUIsQ0FBQyxDQUFDLE9BQU8sWUFBWSx1QkFBdUIsdUJBQXVCLENBQUM7UUFDM0YsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU0sbUJBQW1CLEdBQUcsSUFBQSx1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