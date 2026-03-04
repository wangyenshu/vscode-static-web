/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/themes/common/colorThemeSchema", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/tokenClassificationRegistry", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/platform", "vs/platform/theme/common/theme"], function (require, exports, nls, types, platform_1, configurationRegistry_1, colorThemeSchema_1, colorRegistry_1, tokenClassificationRegistry_1, workbenchThemeService_1, platform_2, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeConfiguration = exports.COLOR_THEME_CONFIGURATION_SETTINGS_TAG = void 0;
    exports.formatSettingAsLink = formatSettingAsLink;
    exports.updateColorThemeConfigurationSchemas = updateColorThemeConfigurationSchemas;
    exports.updateFileIconThemeConfigurationSchemas = updateFileIconThemeConfigurationSchemas;
    exports.updateProductIconThemeConfigurationSchemas = updateProductIconThemeConfigurationSchemas;
    // Configuration: Themes
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const colorThemeSettingEnum = [];
    const colorThemeSettingEnumItemLabels = [];
    const colorThemeSettingEnumDescriptions = [];
    function formatSettingAsLink(str) {
        return `\`#${str}#\``;
    }
    exports.COLOR_THEME_CONFIGURATION_SETTINGS_TAG = 'colorThemeConfiguration';
    const colorThemeSettingSchema = {
        type: 'string',
        markdownDescription: nls.localize({ key: 'colorTheme', comment: ['{0} will become a link to another setting.'] }, "Specifies the color theme used in the workbench when {0} is not enabled.", formatSettingAsLink(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)),
        default: platform_2.isWeb ? workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT : workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK,
        tags: [exports.COLOR_THEME_CONFIGURATION_SETTINGS_TAG],
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredDarkThemeSettingSchema = {
        type: 'string', //
        markdownDescription: nls.localize({ key: 'preferredDarkColorTheme', comment: ['{0} will become a link to another setting.'] }, 'Specifies the color theme when system color mode is dark and {0} is enabled.', formatSettingAsLink(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)),
        default: workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_DARK,
        tags: [exports.COLOR_THEME_CONFIGURATION_SETTINGS_TAG],
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredLightThemeSettingSchema = {
        type: 'string',
        markdownDescription: nls.localize({ key: 'preferredLightColorTheme', comment: ['{0} will become a link to another setting.'] }, 'Specifies the color theme when system color mode is light and {0} is enabled.', formatSettingAsLink(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)),
        default: workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_LIGHT,
        tags: [exports.COLOR_THEME_CONFIGURATION_SETTINGS_TAG],
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredHCDarkThemeSettingSchema = {
        type: 'string',
        markdownDescription: nls.localize({ key: 'preferredHCDarkColorTheme', comment: ['{0} will become a link to another setting.'] }, 'Specifies the color theme when in high contrast dark mode and {0} is enabled.', formatSettingAsLink(workbenchThemeService_1.ThemeSettings.DETECT_HC)),
        default: workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_HC_DARK,
        tags: [exports.COLOR_THEME_CONFIGURATION_SETTINGS_TAG],
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredHCLightThemeSettingSchema = {
        type: 'string',
        markdownDescription: nls.localize({ key: 'preferredHCLightColorTheme', comment: ['{0} will become a link to another setting.'] }, 'Specifies the color theme when in high contrast light mode and {0} is enabled.', formatSettingAsLink(workbenchThemeService_1.ThemeSettings.DETECT_HC)),
        default: workbenchThemeService_1.ThemeSettingDefaults.COLOR_THEME_HC_LIGHT,
        tags: [exports.COLOR_THEME_CONFIGURATION_SETTINGS_TAG],
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const detectColorSchemeSettingSchema = {
        type: 'boolean',
        markdownDescription: nls.localize({ key: 'detectColorScheme', comment: ['{0} and {1} will become links to other settings.'] }, 'If enabled, will automatically select a color theme based on the system color mode. If the system color mode is dark, {0} is used, else {1}.', formatSettingAsLink(workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME), formatSettingAsLink(workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME)),
        default: false,
        tags: [exports.COLOR_THEME_CONFIGURATION_SETTINGS_TAG],
    };
    const colorCustomizationsSchema = {
        type: 'object',
        description: nls.localize('workbenchColors', "Overrides colors from the currently selected color theme."),
        allOf: [{ $ref: colorRegistry_1.workbenchColorsSchemaId }],
        default: {},
        defaultSnippets: [{
                body: {}
            }]
    };
    const fileIconThemeSettingSchema = {
        type: ['string', 'null'],
        default: workbenchThemeService_1.ThemeSettingDefaults.FILE_ICON_THEME,
        description: nls.localize('iconTheme', "Specifies the file icon theme used in the workbench or 'null' to not show any file icons."),
        enum: [null],
        enumItemLabels: [nls.localize('noIconThemeLabel', 'None')],
        enumDescriptions: [nls.localize('noIconThemeDesc', 'No file icons')],
        errorMessage: nls.localize('iconThemeError', "File icon theme is unknown or not installed.")
    };
    const productIconThemeSettingSchema = {
        type: ['string', 'null'],
        default: workbenchThemeService_1.ThemeSettingDefaults.PRODUCT_ICON_THEME,
        description: nls.localize('productIconTheme', "Specifies the product icon theme used."),
        enum: [workbenchThemeService_1.ThemeSettingDefaults.PRODUCT_ICON_THEME],
        enumItemLabels: [nls.localize('defaultProductIconThemeLabel', 'Default')],
        enumDescriptions: [nls.localize('defaultProductIconThemeDesc', 'Default')],
        errorMessage: nls.localize('productIconThemeError', "Product icon theme is unknown or not installed.")
    };
    const detectHCSchemeSettingSchema = {
        type: 'boolean',
        default: true,
        markdownDescription: nls.localize({ key: 'autoDetectHighContrast', comment: ['{0} and {1} will become links to other settings.'] }, "If enabled, will automatically change to high contrast theme if the OS is using a high contrast theme. The high contrast theme to use is specified by {0} and {1}.", formatSettingAsLink(workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME), formatSettingAsLink(workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME)),
        scope: 1 /* ConfigurationScope.APPLICATION */,
        tags: [exports.COLOR_THEME_CONFIGURATION_SETTINGS_TAG],
    };
    const themeSettingsConfiguration = {
        id: 'workbench',
        order: 7.1,
        type: 'object',
        properties: {
            [workbenchThemeService_1.ThemeSettings.COLOR_THEME]: colorThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME]: preferredDarkThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME]: preferredLightThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME]: preferredHCDarkThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME]: preferredHCLightThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME]: fileIconThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.COLOR_CUSTOMIZATIONS]: colorCustomizationsSchema,
            [workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME]: productIconThemeSettingSchema
        }
    };
    configurationRegistry.registerConfiguration(themeSettingsConfiguration);
    const themeSettingsWindowConfiguration = {
        id: 'window',
        order: 8.1,
        type: 'object',
        properties: {
            [workbenchThemeService_1.ThemeSettings.DETECT_HC]: detectHCSchemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME]: detectColorSchemeSettingSchema,
        }
    };
    configurationRegistry.registerConfiguration(themeSettingsWindowConfiguration);
    function tokenGroupSettings(description) {
        return {
            description,
            $ref: colorThemeSchema_1.textmateColorGroupSchemaId
        };
    }
    const themeSpecificSettingKey = '^\\[[^\\]]*(\\]\\s*\\[[^\\]]*)*\\]$';
    const tokenColorSchema = {
        type: 'object',
        properties: {
            comments: tokenGroupSettings(nls.localize('editorColors.comments', "Sets the colors and styles for comments")),
            strings: tokenGroupSettings(nls.localize('editorColors.strings', "Sets the colors and styles for strings literals.")),
            keywords: tokenGroupSettings(nls.localize('editorColors.keywords', "Sets the colors and styles for keywords.")),
            numbers: tokenGroupSettings(nls.localize('editorColors.numbers', "Sets the colors and styles for number literals.")),
            types: tokenGroupSettings(nls.localize('editorColors.types', "Sets the colors and styles for type declarations and references.")),
            functions: tokenGroupSettings(nls.localize('editorColors.functions', "Sets the colors and styles for functions declarations and references.")),
            variables: tokenGroupSettings(nls.localize('editorColors.variables', "Sets the colors and styles for variables declarations and references.")),
            textMateRules: {
                description: nls.localize('editorColors.textMateRules', 'Sets colors and styles using textmate theming rules (advanced).'),
                $ref: colorThemeSchema_1.textmateColorsSchemaId
            },
            semanticHighlighting: {
                description: nls.localize('editorColors.semanticHighlighting', 'Whether semantic highlighting should be enabled for this theme.'),
                deprecationMessage: nls.localize('editorColors.semanticHighlighting.deprecationMessage', 'Use `enabled` in `editor.semanticTokenColorCustomizations` setting instead.'),
                markdownDeprecationMessage: nls.localize({ key: 'editorColors.semanticHighlighting.deprecationMessageMarkdown', comment: ['{0} will become a link to another setting.'] }, 'Use `enabled` in {0} setting instead.', formatSettingAsLink('editor.semanticTokenColorCustomizations')),
                type: 'boolean'
            }
        },
        additionalProperties: false
    };
    const tokenColorCustomizationSchema = {
        description: nls.localize('editorColors', "Overrides editor syntax colors and font style from the currently selected color theme."),
        default: {},
        allOf: [{ ...tokenColorSchema, patternProperties: { '^\\[': {} } }]
    };
    const semanticTokenColorSchema = {
        type: 'object',
        properties: {
            enabled: {
                type: 'boolean',
                description: nls.localize('editorColors.semanticHighlighting.enabled', 'Whether semantic highlighting is enabled or disabled for this theme'),
                suggestSortText: '0_enabled'
            },
            rules: {
                $ref: tokenClassificationRegistry_1.tokenStylingSchemaId,
                description: nls.localize('editorColors.semanticHighlighting.rules', 'Semantic token styling rules for this theme.'),
                suggestSortText: '0_rules'
            }
        },
        additionalProperties: false
    };
    const semanticTokenColorCustomizationSchema = {
        description: nls.localize('semanticTokenColors', "Overrides editor semantic token color and styles from the currently selected color theme."),
        default: {},
        allOf: [{ ...semanticTokenColorSchema, patternProperties: { '^\\[': {} } }]
    };
    const tokenColorCustomizationConfiguration = {
        id: 'editor',
        order: 7.2,
        type: 'object',
        properties: {
            [workbenchThemeService_1.ThemeSettings.TOKEN_COLOR_CUSTOMIZATIONS]: tokenColorCustomizationSchema,
            [workbenchThemeService_1.ThemeSettings.SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS]: semanticTokenColorCustomizationSchema
        }
    };
    configurationRegistry.registerConfiguration(tokenColorCustomizationConfiguration);
    function updateColorThemeConfigurationSchemas(themes) {
        // updates enum for the 'workbench.colorTheme` setting
        themes.sort((a, b) => a.label.localeCompare(b.label));
        colorThemeSettingEnum.splice(0, colorThemeSettingEnum.length, ...themes.map(t => t.settingsId));
        colorThemeSettingEnumDescriptions.splice(0, colorThemeSettingEnumDescriptions.length, ...themes.map(t => t.description || ''));
        colorThemeSettingEnumItemLabels.splice(0, colorThemeSettingEnumItemLabels.length, ...themes.map(t => t.label || ''));
        const themeSpecificWorkbenchColors = { properties: {} };
        const themeSpecificTokenColors = { properties: {} };
        const themeSpecificSemanticTokenColors = { properties: {} };
        const workbenchColors = { $ref: colorRegistry_1.workbenchColorsSchemaId, additionalProperties: false };
        const tokenColors = { properties: tokenColorSchema.properties, additionalProperties: false };
        for (const t of themes) {
            // add theme specific color customization ("[Abyss]":{ ... })
            const themeId = `[${t.settingsId}]`;
            themeSpecificWorkbenchColors.properties[themeId] = workbenchColors;
            themeSpecificTokenColors.properties[themeId] = tokenColors;
            themeSpecificSemanticTokenColors.properties[themeId] = semanticTokenColorSchema;
        }
        themeSpecificWorkbenchColors.patternProperties = { [themeSpecificSettingKey]: workbenchColors };
        themeSpecificTokenColors.patternProperties = { [themeSpecificSettingKey]: tokenColors };
        themeSpecificSemanticTokenColors.patternProperties = { [themeSpecificSettingKey]: semanticTokenColorSchema };
        colorCustomizationsSchema.allOf[1] = themeSpecificWorkbenchColors;
        tokenColorCustomizationSchema.allOf[1] = themeSpecificTokenColors;
        semanticTokenColorCustomizationSchema.allOf[1] = themeSpecificSemanticTokenColors;
        configurationRegistry.notifyConfigurationSchemaUpdated(themeSettingsConfiguration, tokenColorCustomizationConfiguration);
    }
    function updateFileIconThemeConfigurationSchemas(themes) {
        fileIconThemeSettingSchema.enum.splice(1, Number.MAX_VALUE, ...themes.map(t => t.settingsId));
        fileIconThemeSettingSchema.enumItemLabels.splice(1, Number.MAX_VALUE, ...themes.map(t => t.label));
        fileIconThemeSettingSchema.enumDescriptions.splice(1, Number.MAX_VALUE, ...themes.map(t => t.description || ''));
        configurationRegistry.notifyConfigurationSchemaUpdated(themeSettingsConfiguration);
    }
    function updateProductIconThemeConfigurationSchemas(themes) {
        productIconThemeSettingSchema.enum.splice(1, Number.MAX_VALUE, ...themes.map(t => t.settingsId));
        productIconThemeSettingSchema.enumItemLabels.splice(1, Number.MAX_VALUE, ...themes.map(t => t.label));
        productIconThemeSettingSchema.enumDescriptions.splice(1, Number.MAX_VALUE, ...themes.map(t => t.description || ''));
        configurationRegistry.notifyConfigurationSchemaUpdated(themeSettingsConfiguration);
    }
    const colorSchemeToPreferred = {
        [theme_1.ColorScheme.DARK]: workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME,
        [theme_1.ColorScheme.LIGHT]: workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME,
        [theme_1.ColorScheme.HIGH_CONTRAST_DARK]: workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME,
        [theme_1.ColorScheme.HIGH_CONTRAST_LIGHT]: workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME
    };
    class ThemeConfiguration {
        constructor(configurationService, hostColorService) {
            this.configurationService = configurationService;
            this.hostColorService = hostColorService;
        }
        get colorTheme() {
            return this.configurationService.getValue(this.getColorThemeSettingId());
        }
        get fileIconTheme() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME);
        }
        get productIconTheme() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME);
        }
        get colorCustomizations() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.COLOR_CUSTOMIZATIONS) || {};
        }
        get tokenColorCustomizations() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.TOKEN_COLOR_CUSTOMIZATIONS) || {};
        }
        get semanticTokenColorCustomizations() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS);
        }
        getPreferredColorScheme() {
            if (this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.DETECT_HC) && this.hostColorService.highContrast) {
                return this.hostColorService.dark ? theme_1.ColorScheme.HIGH_CONTRAST_DARK : theme_1.ColorScheme.HIGH_CONTRAST_LIGHT;
            }
            if (this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)) {
                return this.hostColorService.dark ? theme_1.ColorScheme.DARK : theme_1.ColorScheme.LIGHT;
            }
            return undefined;
        }
        getColorThemeSettingId() {
            const preferredScheme = this.getPreferredColorScheme();
            return preferredScheme ? colorSchemeToPreferred[preferredScheme] : workbenchThemeService_1.ThemeSettings.COLOR_THEME;
        }
        async setColorTheme(theme, settingsTarget) {
            await this.writeConfiguration(this.getColorThemeSettingId(), theme.settingsId, settingsTarget);
            return theme;
        }
        async setFileIconTheme(theme, settingsTarget) {
            await this.writeConfiguration(workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME, theme.settingsId, settingsTarget);
            return theme;
        }
        async setProductIconTheme(theme, settingsTarget) {
            await this.writeConfiguration(workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME, theme.settingsId, settingsTarget);
            return theme;
        }
        isDefaultColorTheme() {
            const settings = this.configurationService.inspect(this.getColorThemeSettingId());
            return settings && settings.default?.value === settings.value;
        }
        findAutoConfigurationTarget(key) {
            const settings = this.configurationService.inspect(key);
            if (!types.isUndefined(settings.workspaceFolderValue)) {
                return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
            }
            else if (!types.isUndefined(settings.workspaceValue)) {
                return 5 /* ConfigurationTarget.WORKSPACE */;
            }
            else if (!types.isUndefined(settings.userRemote)) {
                return 4 /* ConfigurationTarget.USER_REMOTE */;
            }
            return 2 /* ConfigurationTarget.USER */;
        }
        async writeConfiguration(key, value, settingsTarget) {
            if (settingsTarget === undefined || settingsTarget === 'preview') {
                return;
            }
            const settings = this.configurationService.inspect(key);
            if (settingsTarget === 'auto') {
                return this.configurationService.updateValue(key, value);
            }
            if (settingsTarget === 2 /* ConfigurationTarget.USER */) {
                if (value === settings.userValue) {
                    return Promise.resolve(undefined); // nothing to do
                }
                else if (value === settings.defaultValue) {
                    if (types.isUndefined(settings.userValue)) {
                        return Promise.resolve(undefined); // nothing to do
                    }
                    value = undefined; // remove configuration from user settings
                }
            }
            else if (settingsTarget === 5 /* ConfigurationTarget.WORKSPACE */ || settingsTarget === 6 /* ConfigurationTarget.WORKSPACE_FOLDER */ || settingsTarget === 4 /* ConfigurationTarget.USER_REMOTE */) {
                if (value === settings.value) {
                    return Promise.resolve(undefined); // nothing to do
                }
            }
            return this.configurationService.updateValue(key, value, settingsTarget);
        }
    }
    exports.ThemeConfiguration = ThemeConfiguration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVDb25maWd1cmF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RoZW1lcy9jb21tb24vdGhlbWVDb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdCaEcsa0RBRUM7SUF3TUQsb0ZBNkJDO0lBRUQsMEZBTUM7SUFFRCxnR0FNQztJQTlQRCx3QkFBd0I7SUFDeEIsTUFBTSxxQkFBcUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFekcsTUFBTSxxQkFBcUIsR0FBYSxFQUFFLENBQUM7SUFDM0MsTUFBTSwrQkFBK0IsR0FBYSxFQUFFLENBQUM7SUFDckQsTUFBTSxpQ0FBaUMsR0FBYSxFQUFFLENBQUM7SUFFdkQsU0FBZ0IsbUJBQW1CLENBQUMsR0FBVztRQUM5QyxPQUFPLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVZLFFBQUEsc0NBQXNDLEdBQUcseUJBQXlCLENBQUM7SUFFaEYsTUFBTSx1QkFBdUIsR0FBaUM7UUFDN0QsSUFBSSxFQUFFLFFBQVE7UUFDZCxtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQyw0Q0FBNEMsQ0FBQyxFQUFFLEVBQUUsMEVBQTBFLEVBQUUsbUJBQW1CLENBQUMscUNBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3JQLE9BQU8sRUFBRSxnQkFBSyxDQUFDLENBQUMsQ0FBQyw0Q0FBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsNENBQW9CLENBQUMsZ0JBQWdCO1FBQy9GLElBQUksRUFBRSxDQUFDLDhDQUFzQyxDQUFDO1FBQzlDLElBQUksRUFBRSxxQkFBcUI7UUFDM0IsZ0JBQWdCLEVBQUUsaUNBQWlDO1FBQ25ELGNBQWMsRUFBRSwrQkFBK0I7UUFDL0MsWUFBWSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsb0NBQW9DLENBQUM7S0FDbkYsQ0FBQztJQUNGLE1BQU0sK0JBQStCLEdBQWlDO1FBQ3JFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUNsQixtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxFQUFFLHlCQUF5QixFQUFFLE9BQU8sRUFBRSxDQUFDLDRDQUE0QyxDQUFDLEVBQUUsRUFBRSw4RUFBOEUsRUFBRSxtQkFBbUIsQ0FBQyxxQ0FBYSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDdFEsT0FBTyxFQUFFLDRDQUFvQixDQUFDLGdCQUFnQjtRQUM5QyxJQUFJLEVBQUUsQ0FBQyw4Q0FBc0MsQ0FBQztRQUM5QyxJQUFJLEVBQUUscUJBQXFCO1FBQzNCLGdCQUFnQixFQUFFLGlDQUFpQztRQUNuRCxjQUFjLEVBQUUsK0JBQStCO1FBQy9DLFlBQVksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLG9DQUFvQyxDQUFDO0tBQ25GLENBQUM7SUFDRixNQUFNLGdDQUFnQyxHQUFpQztRQUN0RSxJQUFJLEVBQUUsUUFBUTtRQUNkLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsMEJBQTBCLEVBQUUsT0FBTyxFQUFFLENBQUMsNENBQTRDLENBQUMsRUFBRSxFQUFFLCtFQUErRSxFQUFFLG1CQUFtQixDQUFDLHFDQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUN4USxPQUFPLEVBQUUsNENBQW9CLENBQUMsaUJBQWlCO1FBQy9DLElBQUksRUFBRSxDQUFDLDhDQUFzQyxDQUFDO1FBQzlDLElBQUksRUFBRSxxQkFBcUI7UUFDM0IsZ0JBQWdCLEVBQUUsaUNBQWlDO1FBQ25ELGNBQWMsRUFBRSwrQkFBK0I7UUFDL0MsWUFBWSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsb0NBQW9DLENBQUM7S0FDbkYsQ0FBQztJQUNGLE1BQU0saUNBQWlDLEdBQWlDO1FBQ3ZFLElBQUksRUFBRSxRQUFRO1FBQ2QsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSwyQkFBMkIsRUFBRSxPQUFPLEVBQUUsQ0FBQyw0Q0FBNEMsQ0FBQyxFQUFFLEVBQUUsK0VBQStFLEVBQUUsbUJBQW1CLENBQUMscUNBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvUCxPQUFPLEVBQUUsNENBQW9CLENBQUMsbUJBQW1CO1FBQ2pELElBQUksRUFBRSxDQUFDLDhDQUFzQyxDQUFDO1FBQzlDLElBQUksRUFBRSxxQkFBcUI7UUFDM0IsZ0JBQWdCLEVBQUUsaUNBQWlDO1FBQ25ELGNBQWMsRUFBRSwrQkFBK0I7UUFDL0MsWUFBWSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsb0NBQW9DLENBQUM7S0FDbkYsQ0FBQztJQUNGLE1BQU0sa0NBQWtDLEdBQWlDO1FBQ3hFLElBQUksRUFBRSxRQUFRO1FBQ2QsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSw0QkFBNEIsRUFBRSxPQUFPLEVBQUUsQ0FBQyw0Q0FBNEMsQ0FBQyxFQUFFLEVBQUUsZ0ZBQWdGLEVBQUUsbUJBQW1CLENBQUMscUNBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNqUSxPQUFPLEVBQUUsNENBQW9CLENBQUMsb0JBQW9CO1FBQ2xELElBQUksRUFBRSxDQUFDLDhDQUFzQyxDQUFDO1FBQzlDLElBQUksRUFBRSxxQkFBcUI7UUFDM0IsZ0JBQWdCLEVBQUUsaUNBQWlDO1FBQ25ELGNBQWMsRUFBRSwrQkFBK0I7UUFDL0MsWUFBWSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsb0NBQW9DLENBQUM7S0FDbkYsQ0FBQztJQUNGLE1BQU0sOEJBQThCLEdBQWlDO1FBQ3BFLElBQUksRUFBRSxTQUFTO1FBQ2YsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSxtQkFBbUIsRUFBRSxPQUFPLEVBQUUsQ0FBQyxrREFBa0QsQ0FBQyxFQUFFLEVBQUUsOElBQThJLEVBQUUsbUJBQW1CLENBQUMscUNBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLHFDQUFhLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNqWSxPQUFPLEVBQUUsS0FBSztRQUNkLElBQUksRUFBRSxDQUFDLDhDQUFzQyxDQUFDO0tBQzlDLENBQUM7SUFFRixNQUFNLHlCQUF5QixHQUFpQztRQUMvRCxJQUFJLEVBQUUsUUFBUTtRQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLDJEQUEyRCxDQUFDO1FBQ3pHLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLHVDQUF1QixFQUFFLENBQUM7UUFDMUMsT0FBTyxFQUFFLEVBQUU7UUFDWCxlQUFlLEVBQUUsQ0FBQztnQkFDakIsSUFBSSxFQUFFLEVBQ0w7YUFDRCxDQUFDO0tBQ0YsQ0FBQztJQUNGLE1BQU0sMEJBQTBCLEdBQWlDO1FBQ2hFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUM7UUFDeEIsT0FBTyxFQUFFLDRDQUFvQixDQUFDLGVBQWU7UUFDN0MsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLDJGQUEyRixDQUFDO1FBQ25JLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQztRQUNaLGNBQWMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUQsZ0JBQWdCLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3BFLFlBQVksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLDhDQUE4QyxDQUFDO0tBQzVGLENBQUM7SUFDRixNQUFNLDZCQUE2QixHQUFpQztRQUNuRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1FBQ3hCLE9BQU8sRUFBRSw0Q0FBb0IsQ0FBQyxrQkFBa0I7UUFDaEQsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsd0NBQXdDLENBQUM7UUFDdkYsSUFBSSxFQUFFLENBQUMsNENBQW9CLENBQUMsa0JBQWtCLENBQUM7UUFDL0MsY0FBYyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyw4QkFBOEIsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN6RSxnQkFBZ0IsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsNkJBQTZCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDMUUsWUFBWSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsaURBQWlELENBQUM7S0FDdEcsQ0FBQztJQUVGLE1BQU0sMkJBQTJCLEdBQWlDO1FBQ2pFLElBQUksRUFBRSxTQUFTO1FBQ2YsT0FBTyxFQUFFLElBQUk7UUFDYixtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxFQUFFLHdCQUF3QixFQUFFLE9BQU8sRUFBRSxDQUFDLGtEQUFrRCxDQUFDLEVBQUUsRUFBRSxvS0FBb0ssRUFBRSxtQkFBbUIsQ0FBQyxxQ0FBYSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsbUJBQW1CLENBQUMscUNBQWEsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ2xhLEtBQUssd0NBQWdDO1FBQ3JDLElBQUksRUFBRSxDQUFDLDhDQUFzQyxDQUFDO0tBQzlDLENBQUM7SUFFRixNQUFNLDBCQUEwQixHQUF1QjtRQUN0RCxFQUFFLEVBQUUsV0FBVztRQUNmLEtBQUssRUFBRSxHQUFHO1FBQ1YsSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDWCxDQUFDLHFDQUFhLENBQUMsV0FBVyxDQUFDLEVBQUUsdUJBQXVCO1lBQ3BELENBQUMscUNBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLCtCQUErQjtZQUNyRSxDQUFDLHFDQUFhLENBQUMscUJBQXFCLENBQUMsRUFBRSxnQ0FBZ0M7WUFDdkUsQ0FBQyxxQ0FBYSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsaUNBQWlDO1lBQzFFLENBQUMscUNBQWEsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLGtDQUFrQztZQUM1RSxDQUFDLHFDQUFhLENBQUMsZUFBZSxDQUFDLEVBQUUsMEJBQTBCO1lBQzNELENBQUMscUNBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLHlCQUF5QjtZQUMvRCxDQUFDLHFDQUFhLENBQUMsa0JBQWtCLENBQUMsRUFBRSw2QkFBNkI7U0FDakU7S0FDRCxDQUFDO0lBQ0YscUJBQXFCLENBQUMscUJBQXFCLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUV4RSxNQUFNLGdDQUFnQyxHQUF1QjtRQUM1RCxFQUFFLEVBQUUsUUFBUTtRQUNaLEtBQUssRUFBRSxHQUFHO1FBQ1YsSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDWCxDQUFDLHFDQUFhLENBQUMsU0FBUyxDQUFDLEVBQUUsMkJBQTJCO1lBQ3RELENBQUMscUNBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLDhCQUE4QjtTQUNuRTtLQUNELENBQUM7SUFDRixxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBRTlFLFNBQVMsa0JBQWtCLENBQUMsV0FBbUI7UUFDOUMsT0FBTztZQUNOLFdBQVc7WUFDWCxJQUFJLEVBQUUsNkNBQTBCO1NBQ2hDLENBQUM7SUFDSCxDQUFDO0lBRUQsTUFBTSx1QkFBdUIsR0FBRyxxQ0FBcUMsQ0FBQztJQUV0RSxNQUFNLGdCQUFnQixHQUFnQjtRQUNyQyxJQUFJLEVBQUUsUUFBUTtRQUNkLFVBQVUsRUFBRTtZQUNYLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUFFLHlDQUF5QyxDQUFDLENBQUM7WUFDOUcsT0FBTyxFQUFFLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsa0RBQWtELENBQUMsQ0FBQztZQUNySCxRQUFRLEVBQUUsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDO1lBQy9HLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLGlEQUFpRCxDQUFDLENBQUM7WUFDcEgsS0FBSyxFQUFFLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsa0VBQWtFLENBQUMsQ0FBQztZQUNqSSxTQUFTLEVBQUUsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSx1RUFBdUUsQ0FBQyxDQUFDO1lBQzlJLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFLHVFQUF1RSxDQUFDLENBQUM7WUFDOUksYUFBYSxFQUFFO2dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLGlFQUFpRSxDQUFDO2dCQUMxSCxJQUFJLEVBQUUseUNBQXNCO2FBQzVCO1lBQ0Qsb0JBQW9CLEVBQUU7Z0JBQ3JCLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1DQUFtQyxFQUFFLGlFQUFpRSxDQUFDO2dCQUNqSSxrQkFBa0IsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHNEQUFzRCxFQUFFLDZFQUE2RSxDQUFDO2dCQUN2SywwQkFBMEIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxFQUFFLDhEQUE4RCxFQUFFLE9BQU8sRUFBRSxDQUFDLDRDQUE0QyxDQUFDLEVBQUUsRUFBRSx1Q0FBdUMsRUFBRSxtQkFBbUIsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO2dCQUNuUixJQUFJLEVBQUUsU0FBUzthQUNmO1NBQ0Q7UUFDRCxvQkFBb0IsRUFBRSxLQUFLO0tBQzNCLENBQUM7SUFFRixNQUFNLDZCQUE2QixHQUFpQztRQUNuRSxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsd0ZBQXdGLENBQUM7UUFDbkksT0FBTyxFQUFFLEVBQUU7UUFDWCxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztLQUNuRSxDQUFDO0lBRUYsTUFBTSx3QkFBd0IsR0FBZ0I7UUFDN0MsSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDWCxPQUFPLEVBQUU7Z0JBQ1IsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsMkNBQTJDLEVBQUUscUVBQXFFLENBQUM7Z0JBQzdJLGVBQWUsRUFBRSxXQUFXO2FBQzVCO1lBQ0QsS0FBSyxFQUFFO2dCQUNOLElBQUksRUFBRSxrREFBb0I7Z0JBQzFCLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHlDQUF5QyxFQUFFLDhDQUE4QyxDQUFDO2dCQUNwSCxlQUFlLEVBQUUsU0FBUzthQUMxQjtTQUNEO1FBQ0Qsb0JBQW9CLEVBQUUsS0FBSztLQUMzQixDQUFDO0lBRUYsTUFBTSxxQ0FBcUMsR0FBaUM7UUFDM0UsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsMkZBQTJGLENBQUM7UUFDN0ksT0FBTyxFQUFFLEVBQUU7UUFDWCxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsd0JBQXdCLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztLQUMzRSxDQUFDO0lBRUYsTUFBTSxvQ0FBb0MsR0FBdUI7UUFDaEUsRUFBRSxFQUFFLFFBQVE7UUFDWixLQUFLLEVBQUUsR0FBRztRQUNWLElBQUksRUFBRSxRQUFRO1FBQ2QsVUFBVSxFQUFFO1lBQ1gsQ0FBQyxxQ0FBYSxDQUFDLDBCQUEwQixDQUFDLEVBQUUsNkJBQTZCO1lBQ3pFLENBQUMscUNBQWEsQ0FBQyxtQ0FBbUMsQ0FBQyxFQUFFLHFDQUFxQztTQUMxRjtLQUNELENBQUM7SUFFRixxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO0lBRWxGLFNBQWdCLG9DQUFvQyxDQUFDLE1BQThCO1FBQ2xGLHNEQUFzRDtRQUN0RCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdEQscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDaEcsaUNBQWlDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxpQ0FBaUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9ILCtCQUErQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsK0JBQStCLENBQUMsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVySCxNQUFNLDRCQUE0QixHQUFnQixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUNyRSxNQUFNLHdCQUF3QixHQUFnQixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUNqRSxNQUFNLGdDQUFnQyxHQUFnQixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUV6RSxNQUFNLGVBQWUsR0FBRyxFQUFFLElBQUksRUFBRSx1Q0FBdUIsRUFBRSxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUN2RixNQUFNLFdBQVcsR0FBRyxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDN0YsS0FBSyxNQUFNLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUN4Qiw2REFBNkQ7WUFDN0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUM7WUFDcEMsNEJBQTRCLENBQUMsVUFBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLGVBQWUsQ0FBQztZQUNwRSx3QkFBd0IsQ0FBQyxVQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsV0FBVyxDQUFDO1lBQzVELGdDQUFnQyxDQUFDLFVBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyx3QkFBd0IsQ0FBQztRQUNsRixDQUFDO1FBQ0QsNEJBQTRCLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsZUFBZSxFQUFFLENBQUM7UUFDaEcsd0JBQXdCLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDeEYsZ0NBQWdDLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQztRQUU3Ryx5QkFBeUIsQ0FBQyxLQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsNEJBQTRCLENBQUM7UUFDbkUsNkJBQTZCLENBQUMsS0FBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLHdCQUF3QixDQUFDO1FBQ25FLHFDQUFxQyxDQUFDLEtBQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxnQ0FBZ0MsQ0FBQztRQUVuRixxQkFBcUIsQ0FBQyxnQ0FBZ0MsQ0FBQywwQkFBMEIsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO0lBQzFILENBQUM7SUFFRCxTQUFnQix1Q0FBdUMsQ0FBQyxNQUFpQztRQUN4RiwwQkFBMEIsQ0FBQyxJQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQy9GLDBCQUEwQixDQUFDLGNBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDcEcsMEJBQTBCLENBQUMsZ0JBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVsSCxxQkFBcUIsQ0FBQyxnQ0FBZ0MsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFFRCxTQUFnQiwwQ0FBMEMsQ0FBQyxNQUFvQztRQUM5Riw2QkFBNkIsQ0FBQyxJQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ2xHLDZCQUE2QixDQUFDLGNBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdkcsNkJBQTZCLENBQUMsZ0JBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVySCxxQkFBcUIsQ0FBQyxnQ0FBZ0MsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFFRCxNQUFNLHNCQUFzQixHQUFHO1FBQzlCLENBQUMsbUJBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxxQ0FBYSxDQUFDLG9CQUFvQjtRQUN0RCxDQUFDLG1CQUFXLENBQUMsS0FBSyxDQUFDLEVBQUUscUNBQWEsQ0FBQyxxQkFBcUI7UUFDeEQsQ0FBQyxtQkFBVyxDQUFDLGtCQUFrQixDQUFDLEVBQUUscUNBQWEsQ0FBQyx1QkFBdUI7UUFDdkUsQ0FBQyxtQkFBVyxDQUFDLG1CQUFtQixDQUFDLEVBQUUscUNBQWEsQ0FBQyx3QkFBd0I7S0FDekUsQ0FBQztJQUVGLE1BQWEsa0JBQWtCO1FBQzlCLFlBQW9CLG9CQUEyQyxFQUFVLGdCQUF5QztZQUE5Rix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQVUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF5QjtRQUNsSCxDQUFDO1FBRUQsSUFBVyxVQUFVO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBUyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDO1FBQ2xGLENBQUM7UUFFRCxJQUFXLGFBQWE7WUFDdkIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFnQixxQ0FBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7UUFFRCxJQUFXLGdCQUFnQjtZQUMxQixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVMscUNBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFFRCxJQUFXLG1CQUFtQjtZQUM3QixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQXVCLHFDQUFhLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDM0csQ0FBQztRQUVELElBQVcsd0JBQXdCO1lBQ2xDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBNEIscUNBQWEsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0SCxDQUFDO1FBRUQsSUFBVyxnQ0FBZ0M7WUFDMUMsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFvQyxxQ0FBYSxDQUFDLG1DQUFtQyxDQUFDLENBQUM7UUFDakksQ0FBQztRQUVNLHVCQUF1QjtZQUM3QixJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMscUNBQWEsQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3ZHLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsbUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsbUJBQVcsQ0FBQyxtQkFBbUIsQ0FBQztZQUN0RyxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLHFDQUFhLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDO2dCQUMzRSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLG1CQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxtQkFBVyxDQUFDLEtBQUssQ0FBQztZQUMxRSxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVNLHNCQUFzQjtZQUM1QixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUN2RCxPQUFPLGVBQWUsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLHFDQUFhLENBQUMsV0FBVyxDQUFDO1FBQzlGLENBQUM7UUFFTSxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQTJCLEVBQUUsY0FBa0M7WUFDekYsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEVBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUMvRixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsS0FBOEIsRUFBRSxjQUFrQztZQUMvRixNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxxQ0FBYSxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQy9GLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVNLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxLQUFpQyxFQUFFLGNBQWtDO1lBQ3JHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLHFDQUFhLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRyxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTSxtQkFBbUI7WUFDekIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDO1lBQ2xGLE9BQU8sUUFBUSxJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxLQUFLLFFBQVEsQ0FBQyxLQUFLLENBQUM7UUFDL0QsQ0FBQztRQUVNLDJCQUEyQixDQUFDLEdBQVc7WUFDN0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4RCxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxvREFBNEM7WUFDN0MsQ0FBQztpQkFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztnQkFDeEQsNkNBQXFDO1lBQ3RDLENBQUM7aUJBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BELCtDQUF1QztZQUN4QyxDQUFDO1lBQ0Qsd0NBQWdDO1FBQ2pDLENBQUM7UUFFTyxLQUFLLENBQUMsa0JBQWtCLENBQUMsR0FBVyxFQUFFLEtBQVUsRUFBRSxjQUFrQztZQUMzRixJQUFJLGNBQWMsS0FBSyxTQUFTLElBQUksY0FBYyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNsRSxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEQsSUFBSSxjQUFjLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUQsQ0FBQztZQUVELElBQUksY0FBYyxxQ0FBNkIsRUFBRSxDQUFDO2dCQUNqRCxJQUFJLEtBQUssS0FBSyxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ2xDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGdCQUFnQjtnQkFDcEQsQ0FBQztxQkFBTSxJQUFJLEtBQUssS0FBSyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQzVDLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzt3QkFDM0MsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCO29CQUNwRCxDQUFDO29CQUNELEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQywwQ0FBMEM7Z0JBQzlELENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksY0FBYywwQ0FBa0MsSUFBSSxjQUFjLGlEQUF5QyxJQUFJLGNBQWMsNENBQW9DLEVBQUUsQ0FBQztnQkFDOUssSUFBSSxLQUFLLEtBQUssUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUM5QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0I7Z0JBQ3BELENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDMUUsQ0FBQztLQUNEO0lBckdELGdEQXFHQyJ9