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
define(["require", "exports", "electron", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/state/node/state", "vs/platform/window/common/window", "vs/platform/windows/electron-main/windowImpl"], function (require, exports, electron_1, platform_1, configuration_1, environmentMainService_1, lifecycleMainService_1, log_1, state_1, window_1, windowImpl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuxiliaryWindow = void 0;
    let AuxiliaryWindow = class AuxiliaryWindow extends windowImpl_1.BaseWindow {
        get win() {
            if (!super.win) {
                this.tryClaimWindow();
            }
            return super.win;
        }
        constructor(webContents, environmentMainService, logService, configurationService, stateService, lifecycleMainService) {
            super(configurationService, stateService, environmentMainService, logService);
            this.webContents = webContents;
            this.lifecycleMainService = lifecycleMainService;
            this.id = this.webContents.id;
            this.parentId = -1;
            this.stateApplied = false;
            // Try to claim window
            this.tryClaimWindow();
        }
        tryClaimWindow(options) {
            if (this._store.isDisposed || this.webContents.isDestroyed()) {
                return; // already disposed
            }
            this.doTryClaimWindow();
            if (options && !this.stateApplied) {
                this.stateApplied = true;
                this.applyState({
                    x: options.x,
                    y: options.y,
                    width: options.width,
                    height: options.height,
                    // TODO@bpasero We currently do not support restoring fullscreen state for
                    // auxiliary windows because we do not get hold of the original `features`
                    // string that contains that info in `window-fullscreen`. However, we can
                    // probe the `options.show` value for whether the window should be maximized
                    // or not because we never show maximized windows initially to reduce flicker.
                    mode: options.show === false ? 0 /* WindowMode.Maximized */ : 1 /* WindowMode.Normal */
                });
            }
        }
        doTryClaimWindow() {
            if (this._win) {
                return; // already claimed
            }
            const window = electron_1.BrowserWindow.fromWebContents(this.webContents);
            if (window) {
                this.logService.trace('[aux window] Claimed browser window instance');
                // Remember
                this.setWin(window);
                // Disable Menu
                window.setMenu(null);
                if ((platform_1.isWindows || platform_1.isLinux) && (0, window_1.hasNativeTitlebar)(this.configurationService)) {
                    window.setAutoHideMenuBar(true); // Fix for https://github.com/microsoft/vscode/issues/200615
                }
                // Lifecycle
                this.lifecycleMainService.registerAuxWindow(this);
            }
        }
        matches(webContents) {
            return this.webContents.id === webContents.id;
        }
    };
    exports.AuxiliaryWindow = AuxiliaryWindow;
    exports.AuxiliaryWindow = AuxiliaryWindow = __decorate([
        __param(1, environmentMainService_1.IEnvironmentMainService),
        __param(2, log_1.ILogService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, state_1.IStateService),
        __param(5, lifecycleMainService_1.ILifecycleMainService)
    ], AuxiliaryWindow);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5V2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYXV4aWxpYXJ5V2luZG93L2VsZWN0cm9uLW1haW4vYXV4aWxpYXJ5V2luZG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCekYsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSx1QkFBVTtRQUs5QyxJQUFhLEdBQUc7WUFDZixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdkIsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUNsQixDQUFDO1FBSUQsWUFDa0IsV0FBd0IsRUFDaEIsc0JBQStDLEVBQzNELFVBQXVCLEVBQ2Isb0JBQTJDLEVBQ25ELFlBQTJCLEVBQ25CLG9CQUE0RDtZQUVuRixLQUFLLENBQUMsb0JBQW9CLEVBQUUsWUFBWSxFQUFFLHNCQUFzQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBUDdELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBS0QseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQW5CM0UsT0FBRSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO1lBQ2xDLGFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztZQVVOLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1lBWTVCLHNCQUFzQjtZQUN0QixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUVELGNBQWMsQ0FBQyxPQUF5QztZQUN2RCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztnQkFDOUQsT0FBTyxDQUFDLG1CQUFtQjtZQUM1QixDQUFDO1lBRUQsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFFeEIsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO2dCQUV6QixJQUFJLENBQUMsVUFBVSxDQUFDO29CQUNmLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDWixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ1osS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO29CQUNwQixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07b0JBQ3RCLDBFQUEwRTtvQkFDMUUsMEVBQTBFO29CQUMxRSx5RUFBeUU7b0JBQ3pFLDRFQUE0RTtvQkFDNUUsOEVBQThFO29CQUM5RSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyw4QkFBc0IsQ0FBQywwQkFBa0I7aUJBQ3ZFLENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDO1FBRU8sZ0JBQWdCO1lBQ3ZCLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNmLE9BQU8sQ0FBQyxrQkFBa0I7WUFDM0IsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLHdCQUFhLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMvRCxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7Z0JBRXRFLFdBQVc7Z0JBQ1gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFcEIsZUFBZTtnQkFDZixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNyQixJQUFJLENBQUMsb0JBQVMsSUFBSSxrQkFBTyxDQUFDLElBQUksSUFBQSwwQkFBaUIsRUFBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDO29CQUM1RSxNQUFNLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyw0REFBNEQ7Z0JBQzlGLENBQUM7Z0JBRUQsWUFBWTtnQkFDWixJQUFJLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkQsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLENBQUMsV0FBd0I7WUFDL0IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxXQUFXLENBQUMsRUFBRSxDQUFDO1FBQy9DLENBQUM7S0FDRCxDQUFBO0lBaEZZLDBDQUFlOzhCQUFmLGVBQWU7UUFpQnpCLFdBQUEsZ0RBQXVCLENBQUE7UUFDdkIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLDRDQUFxQixDQUFBO09BckJYLGVBQWUsQ0FnRjNCIn0=