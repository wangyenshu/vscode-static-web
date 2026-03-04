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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, dom, lifecycle_1, configuration_1, lifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewIconManager = void 0;
    let WebviewIconManager = class WebviewIconManager {
        constructor(_lifecycleService, _configService) {
            this._lifecycleService = _lifecycleService;
            this._configService = _configService;
            this._icons = new Map();
            this._configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.iconTheme')) {
                    this.updateStyleSheet();
                }
            });
        }
        dispose() {
            this._styleElementDisposable?.dispose();
            this._styleElementDisposable = undefined;
            this._styleElement = undefined;
        }
        get styleElement() {
            if (!this._styleElement) {
                this._styleElementDisposable = new lifecycle_1.DisposableStore();
                this._styleElement = dom.createStyleSheet(undefined, undefined, this._styleElementDisposable);
                this._styleElement.className = 'webview-icons';
            }
            return this._styleElement;
        }
        setIcons(webviewId, iconPath) {
            if (iconPath) {
                this._icons.set(webviewId, iconPath);
            }
            else {
                this._icons.delete(webviewId);
            }
            this.updateStyleSheet();
        }
        async updateStyleSheet() {
            await this._lifecycleService.when(1 /* LifecyclePhase.Starting */);
            const cssRules = [];
            if (this._configService.getValue('workbench.iconTheme') !== null) {
                for (const [key, value] of this._icons) {
                    const webviewSelector = `.show-file-icons .webview-${key}-name-file-icon::before`;
                    try {
                        cssRules.push(`.monaco-workbench.vs ${webviewSelector}, .monaco-workbench.hc-light ${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value.light)}; }`, `.monaco-workbench.vs-dark ${webviewSelector}, .monaco-workbench.hc-black ${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value.dark)}; }`);
                    }
                    catch {
                        // noop
                    }
                }
            }
            this.styleElement.textContent = cssRules.join('\n');
        }
    };
    exports.WebviewIconManager = WebviewIconManager;
    exports.WebviewIconManager = WebviewIconManager = __decorate([
        __param(0, lifecycle_2.ILifecycleService),
        __param(1, configuration_1.IConfigurationService)
    ], WebviewIconManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0ljb25NYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2Vidmlld1BhbmVsL2Jyb3dzZXIvd2Vidmlld0ljb25NYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWF6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjtRQU85QixZQUNvQixpQkFBcUQsRUFDakQsY0FBc0Q7WUFEekMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNoQyxtQkFBYyxHQUFkLGNBQWMsQ0FBdUI7WUFQN0QsV0FBTSxHQUFHLElBQUksR0FBRyxFQUF3QixDQUFDO1lBU3pELElBQUksQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hELElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQztvQkFDbkQsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3pCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLHVCQUF1QixFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxTQUFTLENBQUM7WUFDekMsSUFBSSxDQUFDLGFBQWEsR0FBRyxTQUFTLENBQUM7UUFDaEMsQ0FBQztRQUVELElBQVksWUFBWTtZQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN6QixJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxhQUFhLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7Z0JBQzlGLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQztZQUNoRCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7UUFFTSxRQUFRLENBQ2QsU0FBaUIsRUFDakIsUUFBa0M7WUFFbEMsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFFRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBRU8sS0FBSyxDQUFDLGdCQUFnQjtZQUM3QixNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLGlDQUF5QixDQUFDO1lBRTNELE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztZQUM5QixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ2xFLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3hDLE1BQU0sZUFBZSxHQUFHLDZCQUE2QixHQUFHLHlCQUF5QixDQUFDO29CQUNsRixJQUFJLENBQUM7d0JBQ0osUUFBUSxDQUFDLElBQUksQ0FDWix3QkFBd0IsZUFBZSxnQ0FBZ0MsZUFBZSxxQ0FBcUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssRUFDekosNkJBQTZCLGVBQWUsZ0NBQWdDLGVBQWUscUNBQXFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQzdKLENBQUM7b0JBQ0gsQ0FBQztvQkFBQyxNQUFNLENBQUM7d0JBQ1IsT0FBTztvQkFDUixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyRCxDQUFDO0tBQ0QsQ0FBQTtJQWpFWSxnREFBa0I7aUNBQWxCLGtCQUFrQjtRQVE1QixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEscUNBQXFCLENBQUE7T0FUWCxrQkFBa0IsQ0FpRTlCIn0=