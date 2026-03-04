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
define(["require", "exports", "electron", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/state/node/state"], function (require, exports, electron_1, event_1, lifecycle_1, platform_1, configuration_1, instantiation_1, state_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeMainService = exports.IThemeMainService = void 0;
    const DEFAULT_BG_LIGHT = '#FFFFFF';
    const DEFAULT_BG_DARK = '#1E1E1E';
    const DEFAULT_BG_HC_BLACK = '#000000';
    const DEFAULT_BG_HC_LIGHT = '#FFFFFF';
    const THEME_STORAGE_KEY = 'theme';
    const THEME_BG_STORAGE_KEY = 'themeBackground';
    const THEME_WINDOW_SPLASH = 'windowSplash';
    var ThemeSettings;
    (function (ThemeSettings) {
        ThemeSettings.DETECT_COLOR_SCHEME = 'window.autoDetectColorScheme';
        ThemeSettings.SYSTEM_COLOR_THEME = 'window.systemColorTheme';
    })(ThemeSettings || (ThemeSettings = {}));
    exports.IThemeMainService = (0, instantiation_1.createDecorator)('themeMainService');
    let ThemeMainService = class ThemeMainService extends lifecycle_1.Disposable {
        constructor(stateService, configurationService) {
            super();
            this.stateService = stateService;
            this.configurationService = configurationService;
            this._onDidChangeColorScheme = this._register(new event_1.Emitter());
            this.onDidChangeColorScheme = this._onDidChangeColorScheme.event;
            // System Theme
            if (!platform_1.isLinux) {
                this._register(this.configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration(ThemeSettings.SYSTEM_COLOR_THEME) || e.affectsConfiguration(ThemeSettings.DETECT_COLOR_SCHEME)) {
                        this.updateSystemColorTheme();
                    }
                }));
            }
            this.updateSystemColorTheme();
            // Color Scheme changes
            this._register(event_1.Event.fromNodeEventEmitter(electron_1.nativeTheme, 'updated')(() => this._onDidChangeColorScheme.fire(this.getColorScheme())));
        }
        updateSystemColorTheme() {
            if (platform_1.isLinux || this.configurationService.getValue(ThemeSettings.DETECT_COLOR_SCHEME)) {
                // only with `system` we can detect the system color scheme
                electron_1.nativeTheme.themeSource = 'system';
            }
            else {
                switch (this.configurationService.getValue(ThemeSettings.SYSTEM_COLOR_THEME)) {
                    case 'dark':
                        electron_1.nativeTheme.themeSource = 'dark';
                        break;
                    case 'light':
                        electron_1.nativeTheme.themeSource = 'light';
                        break;
                    case 'auto':
                        switch (this.getBaseTheme()) {
                            case 'vs':
                                electron_1.nativeTheme.themeSource = 'light';
                                break;
                            case 'vs-dark':
                                electron_1.nativeTheme.themeSource = 'dark';
                                break;
                            default: electron_1.nativeTheme.themeSource = 'system';
                        }
                        break;
                    default:
                        electron_1.nativeTheme.themeSource = 'system';
                        break;
                }
            }
        }
        getColorScheme() {
            if (platform_1.isWindows) {
                // high contrast is refelected by the shouldUseInvertedColorScheme property
                if (electron_1.nativeTheme.shouldUseHighContrastColors) {
                    // shouldUseInvertedColorScheme is dark, !shouldUseInvertedColorScheme is light
                    return { dark: electron_1.nativeTheme.shouldUseInvertedColorScheme, highContrast: true };
                }
            }
            else if (platform_1.isMacintosh) {
                // high contrast is set if one of shouldUseInvertedColorScheme or shouldUseHighContrastColors is set, reflecting the 'Invert colours' and `Increase contrast` settings in MacOS
                if (electron_1.nativeTheme.shouldUseInvertedColorScheme || electron_1.nativeTheme.shouldUseHighContrastColors) {
                    return { dark: electron_1.nativeTheme.shouldUseDarkColors, highContrast: true };
                }
            }
            else if (platform_1.isLinux) {
                // ubuntu gnome seems to have 3 states, light dark and high contrast
                if (electron_1.nativeTheme.shouldUseHighContrastColors) {
                    return { dark: true, highContrast: true };
                }
            }
            return {
                dark: electron_1.nativeTheme.shouldUseDarkColors,
                highContrast: false
            };
        }
        getBackgroundColor() {
            const colorScheme = this.getColorScheme();
            if (colorScheme.highContrast && this.configurationService.getValue('window.autoDetectHighContrast')) {
                return colorScheme.dark ? DEFAULT_BG_HC_BLACK : DEFAULT_BG_HC_LIGHT;
            }
            let background = this.stateService.getItem(THEME_BG_STORAGE_KEY, null);
            if (!background) {
                switch (this.getBaseTheme()) {
                    case 'vs':
                        background = DEFAULT_BG_LIGHT;
                        break;
                    case 'hc-black':
                        background = DEFAULT_BG_HC_BLACK;
                        break;
                    case 'hc-light':
                        background = DEFAULT_BG_HC_LIGHT;
                        break;
                    default: background = DEFAULT_BG_DARK;
                }
            }
            if (platform_1.isMacintosh && background.toUpperCase() === DEFAULT_BG_DARK) {
                background = '#171717'; // https://github.com/electron/electron/issues/5150
            }
            return background;
        }
        getBaseTheme() {
            const baseTheme = this.stateService.getItem(THEME_STORAGE_KEY, 'vs-dark').split(' ')[0];
            switch (baseTheme) {
                case 'vs': return 'vs';
                case 'hc-black': return 'hc-black';
                case 'hc-light': return 'hc-light';
                default: return 'vs-dark';
            }
        }
        saveWindowSplash(windowId, splash) {
            // Update in storage
            this.stateService.setItems([
                { key: THEME_STORAGE_KEY, data: splash.baseTheme },
                { key: THEME_BG_STORAGE_KEY, data: splash.colorInfo.background },
                { key: THEME_WINDOW_SPLASH, data: splash }
            ]);
            // Update in opened windows
            if (typeof windowId === 'number') {
                this.updateBackgroundColor(windowId, splash);
            }
            // Update system theme
            this.updateSystemColorTheme();
        }
        updateBackgroundColor(windowId, splash) {
            for (const window of electron_1.BrowserWindow.getAllWindows()) {
                if (window.id === windowId) {
                    window.setBackgroundColor(splash.colorInfo.background);
                    break;
                }
            }
        }
        getWindowSplash() {
            return this.stateService.getItem(THEME_WINDOW_SPLASH);
        }
    };
    exports.ThemeMainService = ThemeMainService;
    exports.ThemeMainService = ThemeMainService = __decorate([
        __param(0, state_1.IStateService),
        __param(1, configuration_1.IConfigurationService)
    ], ThemeMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RoZW1lL2VsZWN0cm9uLW1haW4vdGhlbWVNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZaEcsTUFBTSxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7SUFDbkMsTUFBTSxlQUFlLEdBQUcsU0FBUyxDQUFDO0lBQ2xDLE1BQU0sbUJBQW1CLEdBQUcsU0FBUyxDQUFDO0lBQ3RDLE1BQU0sbUJBQW1CLEdBQUcsU0FBUyxDQUFDO0lBRXRDLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDO0lBQ2xDLE1BQU0sb0JBQW9CLEdBQUcsaUJBQWlCLENBQUM7SUFDL0MsTUFBTSxtQkFBbUIsR0FBRyxjQUFjLENBQUM7SUFFM0MsSUFBVSxhQUFhLENBR3RCO0lBSEQsV0FBVSxhQUFhO1FBQ1QsaUNBQW1CLEdBQUcsOEJBQThCLENBQUM7UUFDckQsZ0NBQWtCLEdBQUcseUJBQXlCLENBQUM7SUFDN0QsQ0FBQyxFQUhTLGFBQWEsS0FBYixhQUFhLFFBR3RCO0lBRVksUUFBQSxpQkFBaUIsR0FBRyxJQUFBLCtCQUFlLEVBQW9CLGtCQUFrQixDQUFDLENBQUM7SUFnQmpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVU7UUFPL0MsWUFBMkIsWUFBbUMsRUFBeUIsb0JBQW1EO1lBQ3pJLEtBQUssRUFBRSxDQUFDO1lBRDBCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQWlDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFIekgsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBZ0IsQ0FBQyxDQUFDO1lBQzlFLDJCQUFzQixHQUFHLElBQUks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