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
define(["require", "exports", "vs/base/browser/fonts", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/config/editorOptions", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/theme", "vs/workbench/services/themes/common/workbenchThemeService"], function (require, exports, fonts_1, event_1, lifecycle_1, editorOptions_1, configuration_1, colorRegistry, theme_1, workbenchThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewThemeDataProvider = void 0;
    let WebviewThemeDataProvider = class WebviewThemeDataProvider extends lifecycle_1.Disposable {
        constructor(_themeService, _configurationService) {
            super();
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._cachedWebViewThemeData = undefined;
            this._onThemeDataChanged = this._register(new event_1.Emitter());
            this.onThemeDataChanged = this._onThemeDataChanged.event;
            this._register(this._themeService.onDidColorThemeChange(() => {
                this._reset();
            }));
            const webviewConfigurationKeys = ['editor.fontFamily', 'editor.fontWeight', 'editor.fontSize'];
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (webviewConfigurationKeys.some(key => e.affectsConfiguration(key))) {
                    this._reset();
                }
            }));
        }
        getTheme() {
            return this._themeService.getColorTheme();
        }
        getWebviewThemeData() {
            if (!this._cachedWebViewThemeData) {
                const configuration = this._configurationService.getValue('editor');
                const editorFontFamily = configuration.fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
                const editorFontWeight = configuration.fontWeight || editorOptions_1.EDITOR_FONT_DEFAULTS.fontWeight;
                const editorFontSize = configuration.fontSize || editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize;
                const theme = this._themeService.getColorTheme();
                const exportedColors = colorRegistry.getColorRegistry().getColors().reduce((colors, entry) => {
                    const color = theme.getColor(entry.id);
                    if (color) {
                        colors['vscode-' + entry.id.replace('.', '-')] = color.toString();
                    }
                    return colors;
                }, {});
                const styles = {
                    'vscode-font-family': fonts_1.DEFAULT_FONT_FAMILY,
                    'vscode-font-weight': 'normal',
                    'vscode-font-size': '13px',
                    'vscode-editor-font-family': editorFontFamily,
                    'vscode-editor-font-weight': editorFontWeight,
                    'vscode-editor-font-size': editorFontSize + 'px',
                    ...exportedColors
                };
                const activeTheme = ApiThemeClassName.fromTheme(theme);
                this._cachedWebViewThemeData = { styles, activeTheme, themeLabel: theme.label, themeId: theme.settingsId };
            }
            return this._cachedWebViewThemeData;
        }
        _reset() {
            this._cachedWebViewThemeData = undefined;
            this._onThemeDataChanged.fire();
        }
    };
    exports.WebviewThemeDataProvider = WebviewThemeDataProvider;
    exports.WebviewThemeDataProvider = WebviewThemeDataProvider = __decorate([
        __param(0, workbenchThemeService_1.IWorkbenchThemeService),
        __param(1, configuration_1.IConfigurationService)
    ], WebviewThemeDataProvider);
    var ApiThemeClassName;
    (function (ApiThemeClassName) {
        ApiThemeClassName["light"] = "vscode-light";
        ApiThemeClassName["dark"] = "vscode-dark";
        ApiThemeClassName["highContrast"] = "vscode-high-contrast";
        ApiThemeClassName["highContrastLight"] = "vscode-high-contrast-light";
    })(ApiThemeClassName || (ApiThemeClassName = {}));
    (function (ApiThemeClassName) {
        function fromTheme(theme) {
            switch (theme.type) {
                case theme_1.ColorScheme.LIGHT: return ApiThemeClassName.light;
                case theme_1.ColorScheme.DARK: return ApiThemeClassName.dark;
                case theme_1.ColorScheme.HIGH_CONTRAST_DARK: return ApiThemeClassName.highContrast;
                case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT: return ApiThemeClassName.highContrastLight;
            }
        }
        ApiThemeClassName.fromTheme = fromTheme;
    })(ApiThemeClassName || (ApiThemeClassName = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3L2Jyb3dzZXIvdGhlbWVpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO1FBT3ZELFlBQ3lCLGFBQXNELEVBQ3ZELHFCQUE2RDtZQUVwRixLQUFLLEVBQUUsQ0FBQztZQUhpQyxrQkFBYSxHQUFiLGFBQWEsQ0FBd0I7WUFDdEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQVA3RSw0QkFBdUIsR0FBaUMsU0FBUyxDQUFDO1lBRXpELHdCQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzNELHVCQUFrQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFRbkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRTtnQkFDNUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sd0JBQXdCLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQy9GLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN0RSxJQUFJLHdCQUF3QixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZF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