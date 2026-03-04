/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/browser", "vs/base/common/color", "vs/base/common/event", "vs/editor/common/languages", "vs/editor/common/encodedTokenAttributes", "vs/editor/common/languages/supports/tokenization", "vs/editor/standalone/common/themes", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/common/lifecycle", "vs/platform/theme/common/theme", "vs/platform/theme/browser/iconsStyleSheet", "vs/base/browser/window"], function (require, exports, dom, browser_1, color_1, event_1, languages_1, encodedTokenAttributes_1, tokenization_1, themes_1, platform_1, colorRegistry_1, themeService_1, lifecycle_1, theme_1, iconsStyleSheet_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneThemeService = exports.HC_LIGHT_THEME_NAME = exports.HC_BLACK_THEME_NAME = exports.VS_DARK_THEME_NAME = exports.VS_LIGHT_THEME_NAME = void 0;
    exports.VS_LIGHT_THEME_NAME = 'vs';
    exports.VS_DARK_THEME_NAME = 'vs-dark';
    exports.HC_BLACK_THEME_NAME = 'hc-black';
    exports.HC_LIGHT_THEME_NAME = 'hc-light';
    const colorRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
    const themingRegistry = platform_1.Registry.as(themeService_1.Extensions.ThemingContribution);
    class StandaloneTheme {
        constructor(name, standaloneThemeData) {
            this.semanticHighlighting = false;
            this.themeData = standaloneThemeData;
            const base = standaloneThemeData.base;
            if (name.length > 0) {
                if (isBuiltinTheme(name)) {
                    this.id = name;
                }
                else {
                    this.id = base + ' ' + name;
                }
                this.themeName = name;
            }
            else {
                this.id = base;
                this.themeName = base;
            }
            this.colors = null;
            this.defaultColors = Object.create(null);
            this._tokenTheme = null;
        }
        get label() {
            return this.themeName;
        }
        get base() {
            return this.themeData.base;
        }
        notifyBaseUpdated() {
            if (this.themeData.inherit) {
                this.colors = null;
                this._tokenTheme = null;
            }
        }
        getColors() {
            if (!this.colors) {
                const colors = new Map();
                for (const id in this.themeData.colors) {
                    colors.set(id, color_1.Color.fromHex(this.themeData.colors[id]));
                }
                if (this.themeData.inherit) {
                    const baseData = getBuiltinRules(this.themeData.base);
                    for (const id in baseData.colors) {
                        if (!colors.has(id)) {
                            colors.set(id, color_1.Color.fromHex(baseData.colors[id]));
                        }
                    }
                }
                this.colors = colors;
            }
            return this.colors;
        }
        getColor(colorId, useDefault) {
            const color = this.getColors().get(colorId);
            if (color) {
                return color;
            }
            if (useDefault !== false) {
                return this.getDefault(colorId);
            }
            return undefined;
        }
        getDefault(colorId) {
            let color = this.defaultColors[colorId];
            if (color) {
                return color;
            }
            color = colorRegistry.resolveDefaultColor(colorId, this);
            this.defaultColors[colorId] = color;
            return color;
        }
        defines(colorId) {
            return this.getColors().has(colorId);
        }
        get type() {
            switch (this.base) {
                case exports.VS_LIGHT_THEME_NAME: return theme_1.ColorScheme.LIGHT;
                case exports.HC_BLACK_THEME_NAME: return theme_1.ColorScheme.HIGH_CONTRAST_DARK;
                case exports.HC_LIGHT_THEME_NAME: return theme_1.ColorScheme.HIGH_CONTRAST_LIGHT;
                default: return theme_1.ColorScheme.DARK;
            }
        }
        get tokenTheme() {
            if (!this._tokenTheme) {
                let rules = [];
                let encodedTokensColors = [];
                if (this.themeData.inherit) {
                    const baseData = getBuiltinRules(this.themeData.base);
                    rules = baseData.rules;
                    if (baseData.encodedTokensColors) {
                        encodedTokensColors = baseData.encodedTokensColors;
                    }
                }
                // Pick up default colors from `editor.foreground` and `editor.background` if available
                const editorForeground = this.themeData.colors['editor.foreground'];
                const editorBackground = this.themeData.colors['editor.background'];
                if (editorForeground || editorBackground) {
                    const rule = { token: '' };
                    if (editorForeground) {
                        rule.foreground = editorForeground;
                    }
                    if (editorBackground) {
                        rule.background = editorBackground;
                    }
                    rules.push(rule);
                }
                rules = rules.concat(this.themeData.rules);
                if (this.themeData.encodedTokensColors) {
                    encodedTokensColors = this.themeData.encodedTokensColors;
                }
                this._tokenTheme = tokenization_1.TokenTheme.createFromRawTokenTheme(rules, encodedTokensColors);
            }
            return this._tokenTheme;
        }
        getTokenStyleMetadata(type, modifiers, modelLanguage) {
            // use theme rules match
            const style = this.tokenTheme._match([type].concat(modifiers).join('.'));
            const metadata = style.metadata;
            const foreground = encodedTokenAttributes_1.TokenMetadata.getForeground(metadata);
            const fontStyle = encodedTokenAttributes_1.TokenMetadata.getFontStyle(metadata);
            return {
                foreground: foreground,
                italic: Boolean(fontStyle & 1 /* FontStyle.Italic */),
                bold: Boolean(fontStyle & 2 /* FontStyle.Bold */),
                underline: Boolean(fontStyle & 4 /* FontStyle.Underline */),
                strikethrough: Boolean(fontStyle & 8 /* FontStyle.Strikethrough */)
            };
        }
        get tokenColorMap() {
            return [];
        }
    }
    function isBuiltinTheme(themeName) {
        return (themeName === exports.VS_LIGHT_THEME_NAME
            || themeName === exports.VS_DARK_THEME_NAME
            || themeName === exports.HC_BLACK_THEME_NAME
            || themeName === exports.HC_LIGHT_THEME_NAME);
    }
    function getBuiltinRules(builtinTheme) {
        switch (builtinTheme) {
            case exports.VS_LIGHT_THEME_NAME:
                return themes_1.vs;
            case exports.VS_DARK_THEME_NAME:
                return themes_1.vs_dark;
            case exports.HC_BLACK_THEME_NAME:
                return themes_1.hc_black;
            case exports.HC_LIGHT_THEME_NAME:
                return themes_1.hc_light;
        }
    }
    function newBuiltInTheme(builtinTheme) {
        const themeData = getBuiltinRules(builtinTheme);
        return new StandaloneTheme(builtinTheme, themeData);
    }
    class StandaloneThemeService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onColorThemeChange = this._register(new event_1.Emitter());
            this.onDidColorThemeChange = this._onColorThemeChange.event;
            this._onFileIconThemeChange = this._register(new event_1.Emitter());
            this.onDidFileIconThemeChange = this._onFileIconThemeChange.event;
            this._onProductIconThemeChange = this._register(new event_1.Emitter());
            this.onDidProductIconThemeChange = this._onProductIconThemeChange.event;
            this._environment = Object.create(null);
            this._builtInProductIconTheme = new iconsStyleSheet_1.UnthemedProductIconTheme();
            this._autoDetectHighContrast = true;
            this._knownThemes = new Map();
            this._knownThemes.set(exports.VS_LIGHT_THEME_NAME, newBuiltInTheme(exports.VS_LIGHT_THEME_NAME));
            this._knownThemes.set(exports.VS_DARK_THEME_NAME, newBuiltInTheme(exports.VS_DARK_THEME_NAME));
            this._knownThemes.set(exports.HC_BLACK_THEME_NAME, newBuiltInTheme(exports.HC_BLACK_THEME_NAME));
            this._knownThemes.set(exports.HC_LIGHT_THEME_NAME, newBuiltInTheme(exports.HC_LIGHT_THEME_NAME));
            const iconsStyleSheet = this._register((0, iconsStyleSheet_1.getIconsStyleSheet)(this));
            this._codiconCSS = iconsStyleSheet.getCSS();
            this._themeCSS = '';
            this._allCSS = `${this._codiconCSS}\n${this._themeCSS}`;
            this._globalStyleElement = null;
            this._styleElements = [];
            this._colorMapOverride = null;
            this.setTheme(exports.VS_LIGHT_THEME_NAME);
            this._onOSSchemeChanged();
            this._register(iconsStyleSheet.onDidChange(() => {
                this._codiconCSS = iconsStyleSheet.getCSS();
                this._updateCSS();
            }));
            (0, browser_1.addMatchMediaChangeListener)(window_1.mainWindow, '(forced-colors: active)', () => {
                this._onOSSchemeChanged();
            });
        }
        registerEditorContainer(domNode) {
            if (dom.isInShadowDOM(domNode)) {
                return this._registerShadowDomContainer(domNode);
            }
            return this._registerRegularEditorContainer();
        }
        _registerRegularEditorContainer() {
            if (!this._globalStyleElement) {
                this._globalStyleElement = dom.createStyleSheet(undefined, style => {
                    style.className = 'monaco-colors';
                    style.textContent = this._allCSS;
                });
                this._styleElements.push(this._globalStyleElement);
            }
            return lifecycle_1.Disposable.None;
        }
        _registerShadowDomContainer(domNode) {
            const styleElement = dom.createStyleSheet(domNode, style => {
                style.className = 'monaco-colors';
                style.textContent = this._allCSS;
            });
            this._styleElements.push(styleElement);
            return {
                dispose: () => {
                    for (let i = 0; i < this._styleElements.length; i++) {
                        if (this._styleElements[i] === styleElement) {
                            this._styleElements.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        defineTheme(themeName, themeData) {
            if (!/^[a-z0-9\-]+$/i.test(themeName)) {
                throw new Error('Illegal theme name!');
            }
            if (!isBuiltinTheme(themeData.base) && !isBuiltinTheme(themeName)) {
                throw new Error('Illegal theme base!');
            }
            // set or replace theme
            this._knownThemes.set(themeName, new StandaloneTheme(themeName, themeData));
            if (isBuiltinTheme(themeName)) {
                this._knownThemes.forEach(theme => {
                    if (theme.base === themeName) {
                        theme.notifyBaseUpdated();
                    }
                });
            }
            if (this._theme.themeName === themeName) {
                this.setTheme(themeName); // refresh theme
            }
        }
        getColorTheme() {
            return this._theme;
        }
        setColorMapOverride(colorMapOverride) {
            this._colorMapOverride = colorMapOverride;
            this._updateThemeOrColorMap();
        }
        setTheme(themeName) {
            let theme;
            if (this._knownThemes.has(themeName)) {
                theme = this._knownThemes.get(themeName);
            }
            else {
                theme = this._knownThemes.get(exports.VS_LIGHT_THEME_NAME);
            }
            this._updateActualTheme(theme);
        }
        _updateActualTheme(desiredTheme) {
            if (!desiredTheme || this._theme === desiredTheme) {
                // Nothing to do
                return;
            }
            this._theme = desiredTheme;
            this._updateThemeOrColorMap();
        }
        _onOSSchemeChanged() {
            if (this._autoDetectHighContrast) {
                const wantsHighContrast = window_1.mainWindow.matchMedia(`(forced-colors: active)`).matches;
                if (wantsHighContrast !== (0, theme_1.isHighContrast)(this._theme.type)) {
                    // switch to high contrast or non-high contrast but stick to dark or light
                    let newThemeName;
                    if ((0, theme_1.isDark)(this._theme.type)) {
                        newThemeName = wantsHighContrast ? exports.HC_BLACK_THEME_NAME : exports.VS_DARK_THEME_NAME;
                    }
                    else {
                        newThemeName = wantsHighContrast ? exports.HC_LIGHT_THEME_NAME : exports.VS_LIGHT_THEME_NAME;
                    }
                    this._updateActualTheme(this._knownThemes.get(newThemeName));
                }
            }
        }
        setAutoDetectHighContrast(autoDetectHighContrast) {
            this._autoDetectHighContrast = autoDetectHighContrast;
            this._onOSSchemeChanged();
        }
        _updateThemeOrColorMap() {
            const cssRules = [];
            const hasRule = {};
            const ruleCollector = {
                addRule: (rule) => {
                    if (!hasRule[rule]) {
                        cssRules.push(rule);
                        hasRule[rule] = true;
                    }
                }
            };
            themingRegistry.getThemingParticipants().forEach(p => p(this._theme, ruleCollector, this._environment));
            const colorVariables = [];
            for (const item of colorRegistry.getColors()) {
                const color = this._theme.getColor(item.id, true);
                if (color) {
                    colorVariables.push(`${(0, colorRegistry_1.asCssVariableName)(item.id)}: ${color.toString()};`);
                }
            }
            ruleCollector.addRule(`.monaco-editor, .monaco-diff-editor, .monaco-component { ${colorVariables.join('\n')} }`);
            const colorMap = this._colorMapOverride || this._theme.tokenTheme.getColorMap();
            ruleCollector.addRule((0, tokenization_1.generateTokensCSSForColorMap)(colorMap));
            this._themeCSS = cssRules.join('\n');
            this._updateCSS();
            languages_1.TokenizationRegistry.setColorMap(colorMap);
            this._onColorThemeChange.fire(this._theme);
        }
        _updateCSS() {
            this._allCSS = `${this._codiconCSS}\n${this._themeCSS}`;
            this._styleElements.forEach(styleElement => styleElement.textContent = this._allCSS);
        }
        getFileIconTheme() {
            return {
                hasFileIcons: false,
                hasFolderIcons: false,
                hidesExplorerArrows: false
            };
        }
        getProductIconTheme() {
            return this._builtInProductIconTheme;
        }
    }
    exports.StandaloneThemeService = StandaloneThemeService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZVRoZW1lU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9zdGFuZGFsb25lL2Jyb3dzZXIvc3RhbmRhbG9uZVRoZW1lU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQm5GLFFBQUEsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO0lBQzNCLFFBQUEsa0JBQWtCLEdBQUcsU0FBUyxDQUFDO0lBQy9CLFFBQUEsbUJBQW1CLEdBQUcsVUFBVSxDQUFDO0lBQ2pDLFFBQUEsbUJBQW1CLEdBQUcsVUFBVSxDQUFDO0lBRTlDLE1BQU0sYUFBYSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFpQiwwQkFBVSxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDaEYsTUFBTSxlQUFlLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQW1CLHlCQUFpQixDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFFN0YsTUFBTSxlQUFlO1FBVXBCLFlBQVksSUFBWSxFQUFFLG1CQUF5QztZQTJJbkQseUJBQW9CLEdBQUcsS0FBSyxDQUFDO1lBMUk1QyxJQUFJLENBQUMsU0FBUyxHQUFHLG1CQUFtQixDQUFDO1lBQ3JDLE1BQU0sSUFBSSxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQztZQUN0QyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JCLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQzFCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO2dCQUNoQixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztnQkFDN0IsQ0FBQztnQkFDRCxJQUFJLENBQUMsU0FB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