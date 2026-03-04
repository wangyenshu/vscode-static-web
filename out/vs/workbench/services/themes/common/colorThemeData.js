/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/json", "vs/base/common/color", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/themes/common/themeCompatibility", "vs/nls", "vs/base/common/types", "vs/base/common/resources", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/registry/common/platform", "vs/base/common/jsonErrorMessages", "vs/workbench/services/themes/common/plistParser", "vs/platform/theme/common/tokenClassificationRegistry", "vs/workbench/services/themes/common/textMateScopeMatcher", "vs/platform/theme/common/theme"], function (require, exports, path_1, Json, color_1, workbenchThemeService_1, themeCompatibility_1, nls, types, resources, colorRegistry_1, themeService_1, platform_1, jsonErrorMessages_1, plistParser_1, tokenClassificationRegistry_1, textMateScopeMatcher_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorThemeData = void 0;
    const colorRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
    const tokenClassificationRegistry = (0, tokenClassificationRegistry_1.getTokenClassificationRegistry)();
    const tokenGroupToScopesMap = {
        comments: ['comment', 'punctuation.definition.comment'],
        strings: ['string', 'meta.embedded.assembly'],
        keywords: ['keyword - keyword.operator', 'keyword.control', 'storage', 'storage.type'],
        numbers: ['constant.numeric'],
        types: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'],
        functions: ['entity.name.function', 'support.function'],
        variables: ['variable', 'entity.name.variable']
    };
    class ColorThemeData {
        static { this.STORAGE_KEY = 'colorThemeData'; }
        constructor(id, label, settingsId) {
            this.themeTokenColors = [];
            this.customTokenColors = [];
            this.colorMap = {};
            this.customColorMap = {};
            this.semanticTokenRules = [];
            this.customSemanticTokenRules = [];
            this.textMateThemingRules = undefined; // created on demand
            this.tokenColorIndex = undefined; // created on demand
            this.id = id;
            this.label = label;
            this.settingsId = settingsId;
            this.isLoaded = false;
        }
        get semanticHighlighting() {
            if (this.customSemanticHighlighting !== undefined) {
                return this.customSemanticHighlighting;
            }
            if (this.customSemanticHighlightingDeprecated !== undefined) {
                return this.customSemanticHighlightingDeprecated;
            }
            return !!this.themeSemanticHighlighting;
        }
        get tokenColors() {
            if (!this.textMateThemingRules) {
                const result = [];
                // the default rule (scope empty) is always the first rule. Ignore all other default rules.
                const foreground = this.getColor(colorRegistry_1.editorForeground) || this.getDefault(colorRegistry_1.editorForeground);
                const background = this.getColor(colorRegistry_1.editorBackground) || this.getDefault(colorRegistry_1.editorBackground);
                result.push({
                    settings: {
                        foreground: normalizeColor(foreground),
                        background: normalizeColor(background)
                    }
                });
                let hasDefaultTokens = false;
                function addRule(rule) {
                    if (rule.scope && rule.settings) {
                        if (rule.scope === 'token.info-token') {
                            hasDefaultTokens = true;
                        }
                        result.push({ scope: rule.scope, settings: { foreground: normalizeColor(rule.settings.foreground), background: normalizeColor(rule.settings.background), fontStyle: rule.settings.fontStyle } });
                    }
                }
                this.themeTokenColors.forEach(addRule);
                // Add the custom colors after the theme colors
                // so that they will override them
                this.customTokenColors.forEach(addRule);
                if (!hasDefaultTokens) {
                    defaultThemeColors[this.type].forEach(addRule);
                }
                this.textMateThemingRules = result;
            }
            return this.textMateThemingRules;
        }
        getColor(colorId, useDefault) {
            let color = this.customColorMap[colorId];
            if (color) {
                return color;
            }
            color = this.colorMap[colorId];
            if (useDefault !== false && types.isUndefined(color)) {
                color = this.getDefault(colorId);
            }
            return color;
        }
        getTokenStyle(type, modifiers, language, useDefault = true, definitions = {}) {
            const result = {
                foreground: undefined,
                bold: undefined,
                underline: undefined,
                strikethrough: undefined,
                italic: undefined
            };
            const score = {
                foreground: -1,
                bold: -1,
                underline: -1,
                strikethrough: -1,
                italic: -1
            };
            function _processStyle(matchScore, style, definition) {
                if (style.foreground && score.foreground <= matchScore) {
                    score.foreground = matchScore;
                    result.foreground = style.foreground;
                    definitions.foreground = definition;
                }
                for (const p of ['bold', 'underline', 'strikethrough', 'italic']) {
                    const property = p;
                    const info = style[property];
                    if (info !== undefined) {
                        if (score[property] <= matchScore) {
                            score[property] = matchScore;
                            result[property] = info;
                            definitions[property] = definition;
                        }
                    }
                }
            }
            function _processSemanticTokenRule(rule) {
                const matchScore = rule.selector.match(type, modifiers, language);
                if (matchScore >= 0) {
                    _processStyle(matchScore, rule.style, rule);
                }
            }
            this.semanticTokenRules.forEach(_processSemanticTokenRule);
            this.customSemanticTokenRules.forEach(_processSemanticTokenRule);
            let hasUndefinedStyleProperty = false;
            for (const k in score) {
                const key = k;
                if (score[key] === -1) {
                    hasUndefinedStyleProperty = true;
                }
                else {
                    score[key] = Number.MAX_VALUE; // set it to the max, so it won't be replaced by a default
                }
            }
            if (hasUndefinedStyleProperty) {
                for (const rule of tokenClassificationRegistry.getTokenStylingDefaultRules()) {
                    const matchScore = rule.selector.match(type, modifiers, language);
                    if (matchScore >= 0) {
                        let style;
                        if (rule.defaults.scopesToProbe) {
                            style = this.resolveScopes(rule.defaults.scopesToProbe);
                            if (style) {
                                _processStyle(matchScore, style, rule.defaults.scopesToProbe);
                            }
                        }
                        if (!style && useDefault !== false) {
                            const tokenStyleValue = rule.defaults[this.type];
                            style = this.resolveTokenStyleValue(tokenStyleValue);
                            if (style) {
                                _processStyle(matchScore, style, tokenStyleValue);
                            }
                        }
                    }
                }
            }
            return tokenClassificationRegistry_1.TokenStyle.fromData(result);
        }
        /**
         * @param tokenStyleValue Resolve a tokenStyleValue in the context of a theme
         */
        resolveTokenStyleValue(tokenStyleValue) {
            if (tokenStyleValue === undefined) {
                return undefined;
            }
            else if (typeof tokenStyleValue === 'string') {
                const { type, modifiers, language } = (0, tokenClassificationRegistry_1.parseClassifierString)(tokenStyleValue, '');
                return this.getTokenStyle(type, modifiers, language);
            }
            else if (typeof tokenStyleValue === 'object') {
                return tokenStyleValue;
            }
            return undefined;
        }
        getTokenColorIndex() {
            // collect all colors that tokens can have
            if (!this.tokenColorIndex) {
                const index = new TokenColorIndex();
                this.tokenColors.forEach(rule => {
                    index.add(rule.settings.foreground);
                    index.add(rule.settings.background);
                });
                this.semanticTokenRules.forEach(r => index.add(r.style.foreground));
                tokenClassificationRegistry.getTokenStylingDefaultRules().forEach(r => {
                    const defaultColor = r.defaults[this.type];
                    if (defaultColor && typeof defaultColor === 'object') {
                        index.add(defaultColor.foreground);
                    }
                });
                this.customSemanticTokenRules.forEach(r => index.add(r.style.foreground));
                this.tokenColorIndex = index;
            }
            return this.tokenColorIndex;
        }
        get tokenColorMap() {
            return this.getTokenColorIndex().asArray();
        }
        getTokenStyleMetadata(typeWithLanguage, modifiers, defaultLanguage, useDefault = true, definitions = {}) {
            const { type, language } = (0, tokenClassificationRegistry_1.parseClassifierString)(typeWithLanguage, defaultLanguage);
            const style = this.getTokenStyle(type, modifiers, language, useDefault, definitions);
            if (!style) {
                return undefined;
            }
            return {
                foreground: this.getTokenColorIndex().get(style.foreground),
                bold: style.bold,
                underline: style.underline,
                strikethrough: style.strikethrough,
                italic: style.italic,
            };
        }
        getTokenStylingRuleScope(rule) {
            if (this.customSemanticTokenRules.indexOf(rule) !== -1) {
                return 'setting';
            }
            if (this.semanticTokenRules.indexOf(rule) !== -1) {
                return 'theme';
            }
            return undefined;
        }
        getDefault(colorId) {
            return colorRegistry.resolveDefaultColor(colorId, this);
        }
        resolveScopes(scopes, definitions) {
            if (!this.themeTokenScopeMatchers) {
                this.themeTokenScopeMatchers = this.themeTokenColors.map(getScopeMatcher);
            }
            if (!this.customTokenScopeMatchers) {
                this.customTokenScopeMatchers = this.customTokenColors.map(getScopeMatcher);
            }
            for (const scope of scopes) {
                let foreground = undefined;
                let fontStyle = undefined;
                let foregroundScore = -1;
                let fontStyleScore = -1;
                let fontStyleThemingRule = undefined;
                let foregroundThemingRule = undefined;
                function findTokenStyleForScopeInScopes(scopeMatchers, themingRules) {
                    for (let i = 0; i < scopeMatchers.length; i++) {
                        const score = scopeMatchers[i](scope);
                        if (score >= 0) {
                            const themingRule = themingRules[i];
                            const settings = themingRules[i].settings;
                            if (score >= foregroundScore && settings.foreground) {
                                foreground = settings.foreground;
                                foregroundScore = score;
                                foregroundThemingRule = themingRule;
                            }
                            if (score >= fontStyleScore && types.isString(settings.fontStyle)) {
                                fontStyle = settings.fontStyle;
                                fontStyleScore = score;
                                fontStyleThemingRule = themingRule;
                            }
                        }
                    }
                }
                findTokenStyleForScopeInScopes(this.themeTokenScopeMatchers, this.themeTokenColors);
                findTokenStyleForScopeInScopes(this.customTokenScopeMatchers, this.customTokenColors);
                if (foreground !== undefined || fontStyle !== undefined) {
                    if (definitions) {
                        definitions.foreground = foregroundThemingRule;
                        definitions.bold = definitions.italic = definitions.underline = definitions.strikethrough = fontStyleThemingRule;
                        definitions.scope = scope;
                    }
                    return tokenClassificationRegistry_1.TokenStyle.fromSettings(foreground, fontStyle);
                }
            }
            return undefined;
        }
        defines(colorId) {
            return this.customColorMap.hasOwnProperty(colorId) || this.colorMap.hasOwnProperty(colorId);
        }
        setCustomizations(settings) {
            this.setCustomColors(settings.colorCustomizations);
            this.setCustomTokenColors(settings.tokenColorCustomizations);
            this.setCustomSemanticTokenColors(settings.semanticTokenColorCustomizations);
        }
        setCustomColors(colors) {
            this.customColorMap = {};
            this.overwriteCustomColors(colors);
            const themeSpecificColors = this.getThemeSpecificColors(colors);
            if (types.isObject(themeSpecificColors)) {
                this.overwriteCustomColors(themeSpecificColors);
            }
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
            this.customTokenScopeMatchers = undefined;
        }
        overwriteCustomColors(colors) {
            for (const id in colors) {
                const colorVal = colors[id];
                if (typeof colorVal === 'string') {
                    this.customColorMap[id] = color_1.Color.fromHex(colorVal);
                }
            }
        }
        setCustomTokenColors(customTokenColors) {
            this.customTokenColors = [];
            this.customSemanticHighlightingDeprecated = undefined;
            // first add the non-theme specific settings
            this.addCustomTokenColors(customTokenColors);
            // append theme specific settings. Last rules will win.
            const themeSpecificTokenColors = this.getThemeSpecificColors(customTokenColors);
            if (types.isObject(themeSpecificTokenColors)) {
                this.addCustomTokenColors(themeSpecificTokenColors);
            }
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
            this.customTokenScopeMatchers = undefined;
        }
        setCustomSemanticTokenColors(semanticTokenColors) {
            this.customSemanticTokenRules = [];
            this.customSemanticHighlighting = undefined;
            if (semanticTokenColors) {
                this.customSemanticHighlighting = semanticTokenColors.enabled;
                if (semanticTokenColors.rules) {
                    this.readSemanticTokenRules(semanticTokenColors.rules);
                }
                const themeSpecificColors = this.getThemeSpecificColors(semanticTokenColors);
                if (types.isObject(themeSpecificColors)) {
                    if (themeSpecificColors.enabled !== undefined) {
                        this.customSemanticHighlighting = themeSpecificColors.enabled;
                    }
                    if (themeSpecificColors.rules) {
                        this.readSemanticTokenRules(themeSpecificColors.rules);
                    }
                }
            }
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
        }
        isThemeScope(key) {
            return key.charAt(0) === workbenchThemeService_1.THEME_SCOPE_OPEN_PAREN && key.charAt(key.length - 1) === workbenchThemeService_1.THEME_SCOPE_CLOSE_PAREN;
        }
        isThemeScopeMatch(themeId) {
            const themeIdFirstChar = themeId.charAt(0);
            const themeIdLastChar = themeId.charAt(themeId.length - 1);
            const themeIdPrefix = themeId.slice(0, -1);
            const themeIdInfix = themeId.slice(1, -1);
            const themeIdSuffix = themeId.slice(1);
            return themeId === this.settingsId
                || (this.settingsId.includes(themeIdInfix) && themeIdFirstChar === workbenchThemeService_1.THEME_SCOPE_WILDCARD && themeIdLastChar === workbenchThemeService_1.THEME_SCOPE_WILDCARD)
                || (this.settingsId.startsWith(themeIdPrefix) && themeIdLastChar === workbenchThemeService_1.THEME_SCOPE_WILDCARD)
                || (this.settingsId.endsWith(themeIdSuffix) && themeIdFirstChar === workbenchThemeService_1.THEME_SCOPE_WILDCARD);
        }
        getThemeSpecificColors(colors) {
            let themeSpecificColors;
            for (const key in colors) {
                const scopedColors = colors[key];
                if (this.isThemeScope(key) && scopedColors instanceof Object && !Array.isArray(scopedColors)) {
                    const themeScopeList = key.match(workbenchThemeService_1.themeScopeRegex) || [];
                    for (const themeScope of themeScopeList) {
                        const themeId = themeScope.substring(1, themeScope.length - 1);
                        if (this.isThemeScopeMatch(themeId)) {
                            if (!themeSpecificColors) {
                                themeSpecificColors = {};
                            }
                            const scopedThemeSpecificColors = scopedColors;
                            for (const subkey in scopedThemeSpecificColors) {
                                const originalColors = themeSpecificColors[subkey];
                                const overrideColors = scopedThemeSpecificColors[subkey];
                                if (Array.isArray(originalColors) && Array.isArray(overrideColors)) {
                                    themeSpecificColors[subkey] = originalColors.concat(overrideColors);
                                }
                                else if (overrideColors) {
                                    themeSpecificColors[subkey] = overrideColors;
                                }
                            }
                        }
                    }
                }
            }
            return themeSpecificColors;
        }
        readSemanticTokenRules(tokenStylingRuleSection) {
            for (const key in tokenStylingRuleSection) {
                if (!this.isThemeScope(key)) { // still do this test until experimental settings are gone
                    try {
                        const rule = readSemanticTokenRule(key, tokenStylingRuleSection[key]);
                        if (rule) {
                            this.customSemanticTokenRules.push(rule);
                        }
                    }
                    catch (e) {
                        // invalid selector, ignore
                    }
                }
            }
        }
        addCustomTokenColors(customTokenColors) {
            // Put the general customizations such as comments, strings, etc. first so that
            // they can be overridden by specific customizations like "string.interpolated"
            for (const tokenGroup in tokenGroupToScopesMap) {
                const group = tokenGroup; // TS doesn't type 'tokenGroup' properly
                const value = customTokenColors[group];
                if (value) {
                    const settings = typeof value === 'string' ? { foreground: value } : value;
                    const scopes = tokenGroupToScopesMap[group];
                    for (const scope of scopes) {
                        this.customTokenColors.push({ scope, settings });
                    }
                }
            }
            // specific customizations
            if (Array.isArray(customTokenColors.textMateRules)) {
                for (const rule of customTokenColors.textMateRules) {
                    if (rule.scope && rule.settings) {
                        this.customTokenColors.push(rule);
                    }
                }
            }
            if (customTokenColors.semanticHighlighting !== undefined) {
                this.customSemanticHighlightingDeprecated = customTokenColors.semanticHighlighting;
            }
        }
        ensureLoaded(extensionResourceLoaderService) {
            return !this.isLoaded ? this.load(extensionResourceLoaderService) : Promise.resolve(undefined);
        }
        reload(extensionResourceLoaderService) {
            return this.load(extensionResourceLoaderService);
        }
        load(extensionResourceLoaderService) {
            if (!this.location) {
                return Promise.resolve(undefined);
            }
            this.themeTokenColors = [];
            this.clearCaches();
            const result = {
                colors: {},
                textMateRules: [],
                semanticTokenRules: [],
                semanticHighlighting: false
            };
            return _loadColorTheme(extensionResourceLoaderService, this.location, result).then(_ => {
                this.isLoaded = true;
                this.semanticTokenRules = result.semanticTokenRules;
                this.colorMap = result.colors;
                this.themeTokenColors = result.textMateRules;
                this.themeSemanticHighlighting = result.semanticHighlighting;
            });
        }
        clearCaches() {
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
            this.themeTokenScopeMatchers = undefined;
            this.customTokenScopeMatchers = undefined;
        }
        toStorage(storageService) {
            const colorMapData = {};
            for (const key in this.colorMap) {
                colorMapData[key] = color_1.Color.Format.CSS.formatHexA(this.colorMap[key], true);
            }
            // no need to persist custom colors, they will be taken from the settings
            const value = JSON.stringify({
                id: this.id,
                label: this.label,
                settingsId: this.settingsId,
                themeTokenColors: this.themeTokenColors.map(tc => ({ settings: tc.settings, scope: tc.scope })), // don't persist names
                semanticTokenRules: this.semanticTokenRules.map(tokenClassificationRegistry_1.SemanticTokenRule.toJSONObject),
                extensionData: workbenchThemeService_1.ExtensionData.toJSONObject(this.extensionData),
                themeSemanticHighlighting: this.themeSemanticHighlighting,
                colorMap: colorMapData,
                watch: this.watch
            });
            // roam persisted color theme colors. Don't enable for icons as they contain references to fonts and images.
            storageService.store(ColorThemeData.STORAGE_KEY, value, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        get baseTheme() {
            return this.classNames[0];
        }
        get classNames() {
            return this.id.split(' ');
        }
        get type() {
            switch (this.baseTheme) {
                case workbenchThemeService_1.VS_LIGHT_THEME: return theme_1.ColorScheme.LIGHT;
                case workbenchThemeService_1.VS_HC_THEME: return theme_1.ColorScheme.HIGH_CONTRAST_DARK;
                case workbenchThemeService_1.VS_HC_LIGHT_THEME: return theme_1.ColorScheme.HIGH_CONTRAST_LIGHT;
                default: return theme_1.ColorScheme.DARK;
            }
        }
        // constructors
        static createUnloadedThemeForThemeType(themeType, colorMap) {
            return ColorThemeData.createUnloadedTheme((0, themeService_1.getThemeTypeSelector)(themeType), colorMap);
        }
        static createUnloadedTheme(id, colorMap) {
            const themeData = new ColorThemeData(id, '', '__' + id);
            themeData.isLoaded = false;
            themeData.themeTokenColors = [];
            themeData.watch = false;
            if (colorMap) {
                for (const id in colorMap) {
                    themeData.colorMap[id] = color_1.Color.fromHex(colorMap[id]);
                }
            }
            return themeData;
        }
        static createLoadedEmptyTheme(id, settingsId) {
            const themeData = new ColorThemeData(id, '', settingsId);
            themeData.isLoaded = true;
            themeData.themeTokenColors = [];
            themeData.watch = false;
            return themeData;
        }
        static fromStorageData(storageService) {
            const input = storageService.get(ColorThemeData.STORAGE_KEY, 0 /* StorageScope.PROFILE */);
            if (!input) {
                return undefined;
            }
            try {
                const data = JSON.parse(input);
                const theme = new ColorThemeData('', '', '');
                for (const key in data) {
                    switch (key) {
                        case 'colorMap': {
                            const colorMapData = data[key];
                            for (const id in colorMapData) {
                                theme.colorMap[id] = color_1.Color.fromHex(colorMapData[id]);
                            }
                            break;
                        }
                        case 'themeTokenColors':
                        case 'id':
                        case 'label':
                        case 'settingsId':
                        case 'watch':
                        case 'themeSemanticHighlighting':
                            theme[key] = data[key];
                            break;
                        case 'semanticTokenRules': {
                            const rulesData = data[key];
                            if (Array.isArray(rulesData)) {
                                for (const d of rulesData) {
                                    const rule = tokenClassificationRegistry_1.SemanticTokenRule.fromJSONObject(tokenClassificationRegistry, d);
                                    if (rule) {
                                        theme.semanticTokenRules.push(rule);
                                    }
                                }
                            }
                            break;
                        }
                        case 'location':
                            // ignore, no longer restore
                            break;
                        case 'extensionData':
                            theme.extensionData = workbenchThemeService_1.ExtensionData.fromJSONObject(data.extensionData);
                            break;
                    }
                }
                if (!theme.id || !theme.settingsId) {
                    return undefined;
                }
                return theme;
            }
            catch (e) {
                return undefined;
            }
        }
        static fromExtensionTheme(theme, colorThemeLocation, extensionData) {
            const baseTheme = theme['uiTheme'] || 'vs-dark';
            const themeSelector = toCSSSelector(extensionData.extensionId, theme.path);
            const id = `${baseTheme} ${themeSelector}`;
            const label = theme.label || (0, path_1.basename)(theme.path);
            const settingsId = theme.id || label;
            const themeData = new ColorThemeData(id, label, settingsId);
            themeData.description = theme.description;
            themeData.watch = theme._watch === true;
            themeData.location = colorThemeLocation;
            themeData.extensionData = extensionData;
            themeData.isLoaded = false;
            return themeData;
        }
    }
    exports.ColorThemeData = ColorThemeData;
    function toCSSSelector(extensionId, path) {
        if (path.startsWith('./')) {
            path = path.substr(2);
        }
        let str = `${extensionId}-${path}`;
        //remove all characters that are not allowed in css
        str = str.replace(/[^_a-zA-Z0-9-]/g, '-');
        if (str.charAt(0).match(/[0-9-]/)) {
            str = '_' + str;
        }
        return str;
    }
    async function _loadColorTheme(extensionResourceLoaderService, themeLocation, result) {
        if (resources.extname(themeLocation) === '.json') {
            const content = await extensionResourceLoaderService.readExtensionResource(themeLocation);
            const errors = [];
            const contentValue = Json.parse(content, errors);
            if (errors.length > 0) {
                return Promise.reject(new Error(nls.localize('error.cannotparsejson', "Problems parsing JSON theme file: {0}", errors.map(e => (0, jsonErrorMessages_1.getParseErrorMessage)(e.error)).join(', '))));
            }
            else if (Json.getNodeType(contentValue) !== 'object') {
                return Promise.reject(new Error(nls.localize('error.invalidformat', "Invalid format for JSON theme file: Object expected.")));
            }
            if (contentValue.include) {
                await _loadColorTheme(extensionResourceLoaderService, resources.joinPath(resources.dirname(themeLocation), contentValue.include), result);
            }
            if (Array.isArray(contentValue.settings)) {
                (0, themeCompatibility_1.convertSettings)(contentValue.settings, result);
                return null;
            }
            result.semanticHighlighting = result.semanticHighlighting || contentValue.semanticHighlighting;
            const colors = contentValue.colors;
            if (colors) {
                if (typeof colors !== 'object') {
                    return Promise.reject(new Error(nls.localize({ key: 'error.invalidformat.colors', comment: ['{0} will be replaced by a path. Values in quotes should not be translated.'] }, "Problem parsing color theme file: {0}. Property 'colors' is not of type 'object'.", themeLocation.toString())));
                }
                // new JSON color themes format
                for (const colorId in colors) {
                    const colorHex = colors[colorId];
                    if (typeof colorHex === 'string') { // ignore colors tht are null
                        result.colors[colorId] = color_1.Color.fromHex(colors[colorId]);
                    }
                }
            }
            const tokenColors = contentValue.tokenColors;
            if (tokenColors) {
                if (Array.isArray(tokenColors)) {
                    result.textMateRules.push(...tokenColors);
                }
                else if (typeof tokenColors === 'string') {
                    await _loadSyntaxTokens(extensionResourceLoaderService, resources.joinPath(resources.dirname(themeLocation), tokenColors), result);
                }
                else {
                    return Promise.reject(new Error(nls.localize({ key: 'error.invalidformat.tokenColors', comment: ['{0} will be replaced by a path. Values in quotes should not be translated.'] }, "Problem parsing color theme file: {0}. Property 'tokenColors' should be either an array specifying colors or a path to a TextMate theme file", themeLocation.toString())));
                }
            }
            const semanticTokenColors = contentValue.semanticTokenColors;
            if (semanticTokenColors && typeof semanticTokenColors === 'object') {
                for (const key in semanticTokenColors) {
                    try {
                        const rule = readSemanticTokenRule(key, semanticTokenColors[key]);
                        if (rule) {
                            result.semanticTokenRules.push(rule);
                        }
                    }
                    catch (e) {
                        return Promise.reject(new Error(nls.localize({ key: 'error.invalidformat.semanticTokenColors', comment: ['{0} will be replaced by a path. Values in quotes should not be translated.'] }, "Problem parsing color theme file: {0}. Property 'semanticTokenColors' contains a invalid selector", themeLocation.toString())));
                    }
                }
            }
        }
        else {
            return _loadSyntaxTokens(extensionResourceLoaderService, themeLocation, result);
        }
    }
    function _loadSyntaxTokens(extensionResourceLoaderService, themeLocation, result) {
        return extensionResourceLoaderService.readExtensionResource(themeLocation).then(content => {
            try {
                const contentValue = (0, plistParser_1.parse)(content);
                const settings = contentValue.settings;
                if (!Array.isArray(settings)) {
                    return Promise.reject(new Error(nls.localize('error.plist.invalidformat', "Problem parsing tmTheme file: {0}. 'settings' is not array.")));
                }
                (0, themeCompatibility_1.convertSettings)(settings, result);
                return Promise.resolve(null);
            }
            catch (e) {
                return Promise.reject(new Error(nls.localize('error.cannotparse', "Problems parsing tmTheme file: {0}", e.message)));
            }
        }, error => {
            return Promise.reject(new Error(nls.localize('error.cannotload', "Problems loading tmTheme file {0}: {1}", themeLocation.toString(), error.message)));
        });
    }
    const defaultThemeColors = {
        'light': [
            { scope: 'token.info-token', settings: { foreground: '#316bcd' } },
            { scope: 'token.warn-token', settings: { foreground: '#cd9731' } },
            { scope: 'token.error-token', settings: { foreground: '#cd3131' } },
            { scope: 'token.debug-token', settings: { foreground: '#800080' } }
        ],
        'dark': [
            { scope: 'token.info-token', settings: { foreground: '#6796e6' } },
            { scope: 'token.warn-token', settings: { foreground: '#cd9731' } },
            { scope: 'token.error-token', settings: { foreground: '#f44747' } },
            { scope: 'token.debug-token', settings: { foreground: '#b267e6' } }
        ],
        'hcLight': [
            { scope: 'token.info-token', settings: { foreground: '#316bcd' } },
            { scope: 'token.warn-token', settings: { foreground: '#cd9731' } },
            { scope: 'token.error-token', settings: { foreground: '#cd3131' } },
            { scope: 'token.debug-token', settings: { foreground: '#800080' } }
        ],
        'hcDark': [
            { scope: 'token.info-token', settings: { foreground: '#6796e6' } },
            { scope: 'token.warn-token', settings: { foreground: '#008000' } },
            { scope: 'token.error-token', settings: { foreground: '#FF0000' } },
            { scope: 'token.debug-token', settings: { foreground: '#b267e6' } }
        ]
    };
    const noMatch = (_scope) => -1;
    function nameMatcher(identifers, scope) {
        function findInIdents(s, lastIndent) {
            for (let i = lastIndent - 1; i >= 0; i--) {
                if (scopesAreMatching(s, identifers[i])) {
                    return i;
                }
            }
            return -1;
        }
        if (scope.length < identifers.length) {
            return -1;
        }
        let lastScopeIndex = scope.length - 1;
        let lastIdentifierIndex = findInIdents(scope[lastScopeIndex--], identifers.length);
        if (lastIdentifierIndex >= 0) {
            const score = (lastIdentifierIndex + 1) * 0x10000 + identifers[lastIdentifierIndex].length;
            while (lastScopeIndex >= 0) {
                lastIdentifierIndex = findInIdents(scope[lastScopeIndex--], lastIdentifierIndex);
                if (lastIdentifierIndex === -1) {
                    return -1;
                }
            }
            return score;
        }
        return -1;
    }
    function scopesAreMatching(thisScopeName, scopeName) {
        if (!thisScopeName) {
            return false;
        }
        if (thisScopeName === scopeName) {
            return true;
        }
        const len = scopeName.length;
        return thisScopeName.length > len && thisScopeName.substr(0, len) === scopeName && thisScopeName[len] === '.';
    }
    function getScopeMatcher(rule) {
        const ruleScope = rule.scope;
        if (!ruleScope || !rule.settings) {
            return noMatch;
        }
        const matchers = [];
        if (Array.isArray(ruleScope)) {
            for (const rs of ruleScope) {
                (0, textMateScopeMatcher_1.createMatchers)(rs, nameMatcher, matchers);
            }
        }
        else {
            (0, textMateScopeMatcher_1.createMatchers)(ruleScope, nameMatcher, matchers);
        }
        if (matchers.length === 0) {
            return noMatch;
        }
        return (scope) => {
            let max = matchers[0].matcher(scope);
            for (let i = 1; i < matchers.length; i++) {
                max = Math.max(max, matchers[i].matcher(scope));
            }
            return max;
        };
    }
    function readSemanticTokenRule(selectorString, settings) {
        const selector = tokenClassificationRegistry.parseTokenSelector(selectorString);
        let style;
        if (typeof settings === 'string') {
            style = tokenClassificationRegistry_1.TokenStyle.fromSettings(settings, undefined);
        }
        else if (isSemanticTokenColorizationSetting(settings)) {
            style = tokenClassificationRegistry_1.TokenStyle.fromSettings(settings.foreground, settings.fontStyle, settings.bold, settings.underline, settings.strikethrough, settings.italic);
        }
        if (style) {
            return { selector, style };
        }
        return undefined;
    }
    function isSemanticTokenColorizationSetting(style) {
        return style && (types.isString(style.foreground) || types.isString(style.fontStyle) || types.isBoolean(style.italic)
            || types.isBoolean(style.underline) || types.isBoolean(style.strikethrough) || types.isBoolean(style.bold));
    }
    class TokenColorIndex {
        constructor() {
            this._lastColorId = 0;
            this._id2color = [];
            this._color2id = Object.create(null);
        }
        add(color) {
            color = normalizeColor(color);
            if (color === undefined) {
                return 0;
            }
            let value = this._color2id[color];
            if (value) {
                return value;
            }
            value = ++this._lastColorId;
            this._color2id[color] = value;
            this._id2color[value] = color;
            return value;
        }
        get(color) {
            color = normalizeColor(color);
            if (color === undefined) {
                return 0;
            }
            const value = this._color2id[color];
            if (value) {
                return value;
            }
            console.log(`Color ${color} not in index.`);
            return 0;
        }
        asArray() {
            return this._id2color.slice(0);
        }
    }
    function normalizeColor(color) {
        if (!color) {
            return undefined;
        }
        if (typeof color !== 'string') {
            color = color_1.Color.Format.CSS.formatHexA(color, true);
        }
        const len = color.length;
        if (color.charCodeAt(0) !== 35 /* CharCode.Hash */ || (len !== 4 && len !== 5 && len !== 7 && len !== 9)) {
            return undefined;
        }
        const result = [35 /* CharCode.Hash */];
        for (let i = 1; i < len; i++) {
            const upper = hexUpper(color.charCodeAt(i));
            if (!upper) {
                return undefined;
            }
            result.push(upper);
            if (len === 4 || len === 5) {
                result.push(upper);
            }
        }
        if (result.length === 9 && result[7] === 70 /* CharCode.F */ && result[8] === 70 /* CharCode.F */) {
            result.length = 7;
        }
        return String.fromCharCode(...result);
    }
    function hexUpper(charCode) {
        if (charCode >= 48 /* CharCode.Digit0 */ && charCode <= 57 /* CharCode.Digit9 */ || charCode >= 65 /* CharCode.A */ && charCode <= 70 /* CharCode.F */) {
            return charCode;
        }
        else if (charCode >= 97 /* CharCode.a */ && charCode <= 102 /* CharCode.f */) {
            return charCode - 97 /* CharCode.a */ + 65 /* CharCode.A */;
        }
        return 0;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JUaGVtZURhdGEuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGhlbWVzL2NvbW1vbi9jb2xvclRoZW1lRGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3QmhHLE1BQU0sYUFBYSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFpQiwwQkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBRTdGLE1BQU0sMkJBQTJCLEdBQUcsSUFBQSw0REFBOEIsR0FBRSxDQUFDO0lBRXJFLE1BQU0scUJBQXFCLEdBQUc7UUFDN0IsUUFBUSxFQUFFLENBQUMsU0FBUyxFQUFFLGdDQUFnQyxDQUFDO1FBQ3ZELE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSx3QkFBd0IsQ0FBQztRQUM3QyxRQUFRLEVBQUUsQ0FBQyw0QkFBNEIsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsY0FBYyxDQUFDO1FBQ3RGLE9BQU8sRUFBRSxDQUFDLGtCQUFrQixDQUFDO1FBQzdCLEtBQUssRUFBRSxDQUFDLGtCQUFrQixFQUFFLG1CQUFtQixFQUFFLGNBQWMsRUFBRSxlQUFlLENBQUM7UUFDakYsU0FBUyxFQUFFLENBQUMsc0JBQXNCLEVBQUUsa0JBQWtCLENBQUM7UUFDdkQsU0FBUyxFQUFFLENBQUMsVUFBVSxFQUFFLHNCQUFzQixDQUFDO0tBQy9DLENBQUM7SUFRRixNQUFhLGNBQWM7aUJBRVYsZ0JBQVcsR0FBRyxnQkFBZ0IsQUFBbkIsQ0FBb0I7UUE2Qi9DLFlBQW9CLEVBQVUsRUFBRSxLQUFhLEVBQUUsVUFBa0I7WUFkekQscUJBQWdCLEdBQTJCLEVBQUUsQ0FBQztZQUM5QyxzQkFBaUIsR0FBMkIsRUFBRSxDQUFDO1lBQy9DLGFBQVEsR0FBYyxFQUFFLENBQUM7WUFDekIsbUJBQWMs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RSxTQUFTLEVBQUUsRUFBRTtTQUNuRTtRQUNELE1BQU0sRUFBRTtZQUNQLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsRUFBRTtZQUNsRSxFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEVBQUU7WUFDbEUsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQ25FLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLFFBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsRUFBRTtTQUNuRTtRQUNELFNBQVMsRUFBRTtZQUNWLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsRUFBRTtZQUNsRSxFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEVBQUU7WUFDbEUsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQ25FLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLFFBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsRUFBRTtTQUNuRTtRQUNELFFBQVEsRUFBRTtZQUNULEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsRUFBRTtZQUNsRSxFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEVBQUU7WUFDbEUsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxFQUFFO1lBQ25FLEVBQUUsS0FBSyxFQUFF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