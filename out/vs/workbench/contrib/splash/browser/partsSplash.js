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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editor", "vs/workbench/common/theme", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/base/common/performance", "vs/base/common/types", "vs/workbench/contrib/splash/browser/splash", "vs/base/browser/window", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, browser_1, dom, color_1, event_1, lifecycle_1, colorRegistry_1, themeService_1, editor_1, themes, layoutService_1, environmentService_1, editorGroupsService_1, configuration_1, perf, types_1, splash_1, window_1, lifecycle_2) {
    "use strict";
    var PartsSplash_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PartsSplash = void 0;
    let PartsSplash = class PartsSplash {
        static { PartsSplash_1 = this; }
        static { this.ID = 'workbench.contrib.partsSplash'; }
        static { this._splashElementId = 'monaco-parts-splash'; }
        constructor(_themeService, _layoutService, _environmentService, _configService, _partSplashService, editorGroupsService, lifecycleService) {
            this._themeService = _themeService;
            this._layoutService = _layoutService;
            this._environmentService = _environmentService;
            this._configService = _configService;
            this._partSplashService = _partSplashService;
            this._disposables = new lifecycle_1.DisposableStore();
            event_1.Event.once(_layoutService.onDidLayoutMainContainer)(() => {
                this._removePartsSplash();
                perf.mark('code/didRemovePartsSplash');
            }, undefined, this._disposables);
            const lastIdleSchedule = this._disposables.add(new lifecycle_1.MutableDisposable());
            const savePartsSplashSoon = () => {
                lastIdleSchedule.value = dom.runWhenWindowIdle(window_1.mainWindow, () => this._savePartsSplash(), 2500);
            };
            lifecycleService.when(3 /* LifecyclePhase.Restored */).then(() => {
                event_1.Event.any(event_1.Event.filter(browser_1.onDidChangeFullscreen, windowId => windowId === window_1.mainWindow.vscodeWindowId), editorGroupsService.mainPart.onDidLayout, _themeService.onDidColorThemeChange)(savePartsSplashSoon, undefined, this._disposables);
                savePartsSplashSoon();
            });
            _configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("window.titleBarStyle" /* TitleBarSetting.TITLE_BAR_STYLE */)) {
                    this._didChangeTitleBarStyle = true;
                    this._savePartsSplash();
                }
            }, this, this._disposables);
        }
        dispose() {
            this._disposables.dispose();
        }
        _savePartsSplash() {
            const theme = this._themeService.getColorTheme();
            this._partSplashService.saveWindowSplash({
                zoomLevel: this._configService.getValue('window.zoomLevel'),
                baseTheme: (0, themeService_1.getThemeTypeSelector)(theme.type),
                colorInfo: {
                    foreground: theme.getColor(colorRegistry_1.foreground)?.toString(),
                    background: color_1.Color.Format.CSS.formatHex(theme.getColor(colorRegistry_1.editorBackground) || themes.WORKBENCH_BACKGROUND(theme)),
                    editorBackground: theme.getColor(colorRegistry_1.editorBackground)?.toString(),
                    titleBarBackground: theme.getColor(themes.TITLE_BAR_ACTIVE_BACKGROUND)?.toString(),
                    activityBarBackground: theme.getColor(themes.ACTIVITY_BAR_BACKGROUND)?.toString(),
                    sideBarBackground: theme.getColor(themes.SIDE_BAR_BACKGROUND)?.toString(),
                    statusBarBackground: theme.getColor(themes.STATUS_BAR_BACKGROUND)?.toString(),
                    statusBarNoFolderBackground: theme.getColor(themes.STATUS_BAR_NO_FOLDER_BACKGROUND)?.toString(),
                    windowBorder: theme.getColor(themes.WINDOW_ACTIVE_BORDER)?.toString() ?? theme.getColor(themes.WINDOW_INACTIVE_BORDER)?.toString()
                },
                layoutInfo: !this._shouldSaveLayoutInfo() ? undefined : {
                    sideBarSide: this._layoutService.getSideBarPosition() === 1 /* Position.RIGHT */ ? 'right' : 'left',
                    editorPartMinWidth: editor_1.DEFAULT_EDITOR_MIN_DIMENSIONS.width,
                    titleBarHeight: this._layoutService.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, window_1.mainWindow) ? dom.getTotalHeight((0, types_1.assertIsDefined)(this._layoutService.getContainer(window_1.mainWindow, "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */))) : 0,
                    activityBarWidth: this._layoutService.isVisible("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */) ? dom.getTotalWidth((0, types_1.assertIsDefined)(this._layoutService.getContainer(window_1.mainWindow, "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */))) : 0,
                    sideBarWidth: this._layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) ? dom.getTotalWidth((0, types_1.assertIsDefined)(this._layoutService.getContainer(window_1.mainWindow, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */))) : 0,
                    statusBarHeight: this._layoutService.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, window_1.mainWindow) ? dom.getTotalHeight((0, types_1.assertIsDefined)(this._layoutService.getContainer(window_1.mainWindow, "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */))) : 0,
                    windowBorder: this._layoutService.hasMainWindowBorder(),
                    windowBorderRadius: this._layoutService.getMainWindowBorderRadius()
                }
            });
        }
        _shouldSaveLayoutInfo() {
            return !(0, browser_1.isFullscreen)(window_1.mainWindow) && !this._environmentService.isExtensionDevelopment && !this._didChangeTitleBarStyle;
        }
        _removePartsSplash() {
            const element = window_1.mainWindow.document.getElementById(PartsSplash_1._splashElementId);
            if (element) {
                element.style.display = 'none';
            }
            // remove initial colors
            const defaultStyles = window_1.mainWindow.document.head.getElementsByClassName('initialShellColors');
            if (defaultStyles.length) {
                window_1.mainWindow.document.head.removeChild(defaultStyles[0]);
            }
        }
    };
    exports.PartsSplash = PartsSplash;
    exports.PartsSplash = PartsSplash = PartsSplash_1 = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, splash_1.ISplashStorageService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, lifecycle_2.ILifecycleService)
    ], PartsSplash);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydHNTcGxhc2guanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zcGxhc2gvYnJvd3Nlci9wYXJ0c1NwbGFzaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0J6RixJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFXOztpQkFFUCxPQUFFLEdBQUcsK0JBQStCLEFBQWxDLENBQW1DO2lCQUU3QixxQkFBZ0IsR0FBRyxxQkFBcUIsQUFBeEIsQ0FBeUI7UUFNakUsWUFDZ0IsYUFBNkMsRUFDbkMsY0FBd0QsRUFDbkQsbUJBQWtFLEVBQ3pFLGNBQXNELEVBQ3RELGtCQUEwRCxFQUMzRCxtQkFBeUMsRUFDNUMsZ0JBQW1DO1lBTnRCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ2xCLG1CQUFjLEdBQWQsY0FBYyxDQUF5QjtZQUNsQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQThCO1lBQ3hELG1CQUFjLEdBQWQsY0FBYyxDQUF1QjtZQUNyQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXVCO1lBVGpFLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFhckQsYUFBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3hELElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDeEMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFakMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQUN4RSxNQUFNLG1C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