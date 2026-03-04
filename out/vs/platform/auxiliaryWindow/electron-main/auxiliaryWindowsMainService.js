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
define(["require", "exports", "electron", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/parts/ipc/electron-main/ipcMain", "vs/platform/auxiliaryWindow/electron-main/auxiliaryWindow", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/window/electron-main/window", "vs/platform/windows/electron-main/windows"], function (require, exports, electron_1, event_1, lifecycle_1, network_1, ipcMain_1, auxiliaryWindow_1, instantiation_1, log_1, window_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuxiliaryWindowsMainService = void 0;
    let AuxiliaryWindowsMainService = class AuxiliaryWindowsMainService extends lifecycle_1.Disposable {
        constructor(instantiationService, logService) {
            super();
            this.instantiationService = instantiationService;
            this.logService = logService;
            this._onDidMaximizeWindow = this._register(new event_1.Emitter());
            this.onDidMaximizeWindow = this._onDidMaximizeWindow.event;
            this._onDidUnmaximizeWindow = this._register(new event_1.Emitter());
            this.onDidUnmaximizeWindow = this._onDidUnmaximizeWindow.event;
            this._onDidChangeFullScreen = this._register(new event_1.Emitter());
            this.onDidChangeFullScreen = this._onDidChangeFullScreen.event;
            this._onDidTriggerSystemContextMenu = this._register(new event_1.Emitter());
            this.onDidTriggerSystemContextMenu = this._onDidTriggerSystemContextMenu.event;
            this.windows = new Map();
            this.registerListeners();
        }
        registerListeners() {
            // We have to ensure that an auxiliary window gets to know its
            // containing `BrowserWindow` so that it can apply listeners to it
            // Unfortunately we cannot rely on static `BrowserWindow` methods
            // because we might call the methods too early before the window
            // is created.
            electron_1.app.on('browser-window-created', (_event, browserWindow) => {
                // This is an auxiliary window, try to claim it
                const auxiliaryWindow = this.getWindowByWebContents(browserWindow.webContents);
                if (auxiliaryWindow) {
                    this.logService.trace('[aux window] app.on("browser-window-created"): Trying to claim auxiliary window');
                    auxiliaryWindow.tryClaimWindow();
                }
                // This is a main window, listen to child windows getting created to claim it
                else {
                    const disposables = new lifecycle_1.DisposableStore();
                    disposables.add(event_1.Event.fromNodeEventEmitter(browserWindow.webContents, 'did-create-window', (browserWindow, details) => ({ browserWindow, details }))(({ browserWindow, details }) => {
                        const auxiliaryWindow = this.getWindowByWebContents(browserWindow.webContents);
                        if (auxiliaryWindow) {
                            this.logService.trace('[aux window] window.on("did-create-window"): Trying to claim auxiliary window');
                            auxiliaryWindow.tryClaimWindow(details.options);
                        }
                    }));
                    disposables.add(event_1.Event.fromNodeEventEmitter(browserWindow, 'closed')(() => disposables.dispose()));
                }
            });
            ipcMain_1.validatedIpcMain.handle('vscode:registerAuxiliaryWindow', async (event, mainWindowId) => {
                const auxiliaryWindow = this.getWindowByWebContents(event.sender);
                if (auxiliaryWindow) {
                    this.logService.trace('[aux window] vscode:registerAuxiliaryWindow: Registering auxiliary window to main window');
                    auxiliaryWindow.parentId = mainWindowId;
                }
                return event.sender.id;
            });
        }
        createWindow(details) {
            return this.instantiationService.invokeFunction(windows_1.defaultBrowserWindowOptions, this.validateWindowState(details), {
                preload: network_1.FileAccess.asFileUri('vs/base/parts/sandbox/electron-sandbox/preload-aux.js').fsPath
            });
        }
        validateWindowState(details) {
            const windowState = {};
            const features = details.features.split(','); // for example: popup=yes,left=270,top=14.5,width=800,height=600
            for (const feature of features) {
                const [key, value] = feature.split('=');
                switch (key) {
                    case 'width':
                        windowState.width = parseInt(value, 10);
                        break;
                    case 'height':
                        windowState.height = parseInt(value, 10);
                        break;
                    case 'left':
                        windowState.x = parseInt(value, 10);
                        break;
                    case 'top':
                        windowState.y = parseInt(value, 10);
                        break;
                    case 'window-maximized':
                        windowState.mode = 0 /* WindowMode.Maximized */;
                        break;
                    case 'window-fullscreen':
                        windowState.mode = 3 /* WindowMode.Fullscreen */;
                        break;
                }
            }
            const state = windows_1.WindowStateValidator.validateWindowState(this.logService, windowState) ?? (0, window_1.defaultAuxWindowState)();
            this.logService.trace('[aux window] using window state', state);
            return state;
        }
        registerWindow(webContents) {
            const disposables = new lifecycle_1.DisposableStore();
            const auxiliaryWindow = this.instantiationService.createInstance(auxiliaryWindow_1.AuxiliaryWindow, webContents);
            this.windows.set(auxiliaryWindow.id, auxiliaryWindow);
            disposables.add((0, lifecycle_1.toDisposable)(() => this.windows.delete(auxiliaryWindow.id)));
            disposables.add(auxiliaryWindow.onDidMaximize(() => this._onDidMaximizeWindow.fire(auxiliaryWindow)));
            disposables.add(auxiliaryWindow.onDidUnmaximize(() => this._onDidUnmaximizeWindow.fire(auxiliaryWindow)));
            disposables.add(auxiliaryWindow.onDidEnterFullScreen(() => this._onDidChangeFullScreen.fire({ window: auxiliaryWindow, fullscreen: true })));
            disposables.add(auxiliaryWindow.onDidLeaveFullScreen(() => this._onDidChangeFullScreen.fire({ window: auxiliaryWindow, fullscreen: false })));
            disposables.add(auxiliaryWindow.onDidTriggerSystemContextMenu(({ x, y }) => this._onDidTriggerSystemContextMenu.fire({ window: auxiliaryWindow, x, y })));
            event_1.Event.once(auxiliaryWindow.onDidClose)(() => disposables.dispose());
        }
        getWindowByWebContents(webContents) {
            const window = this.windows.get(webContents.id);
            return window?.matches(webContents) ? window : undefined;
        }
        getFocusedWindow() {
            const window = electron_1.BrowserWindow.getFocusedWindow();
            if (window) {
                return this.getWindowByWebContents(window.webContents);
            }
            return undefined;
        }
        getLastActiveWindow() {
            return (0, windows_1.getLastFocused)(Array.from(this.windows.values()));
        }
        getWindows() {
            return Array.from(this.windows.values());
        }
    };
    exports.AuxiliaryWindowsMainService = AuxiliaryWindowsMainService;
    exports.AuxiliaryWindowsMainService = AuxiliaryWindowsMainService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, log_1.ILogService)
    ], AuxiliaryWindowsMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5V2luZG93c01haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYXV4aWxpYXJ5V2luZG93L2VsZWN0cm9uLW1haW4vYXV4aWxpYXJ5V2luZG93c01haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFVO1FBa0IxRCxZQUN3QixvQkFBNEQsRUFDdEUsVUFBd0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFIZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBaEJyQyx5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFvQixDQUFDLENBQUM7WUFDL0Usd0JBQW1CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQztZQUU5QywyQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFvQixDQUFDLENBQUM7WUFDakYsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUVsRCwyQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFxRCxDQUFDLENBQUM7WUFDbEgsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUVsRCxtQ0FBOEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFzRCxDQUFDLENBQUM7WUFDM0gsa0NBQTZCLEdBQUcsSUFBSSxDQUFDLDhCQUE4QixDQUFDLEtBQUssQ0FBQztZQUVsRSxZQUFPLEdBQUcsSUFB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