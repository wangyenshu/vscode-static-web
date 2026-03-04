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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService", "vs/platform/configuration/common/configuration", "vs/platform/native/common/native", "vs/platform/dialogs/common/dialogs", "vs/base/common/performance", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/host/browser/host", "vs/platform/window/electron-sandbox/window", "vs/base/browser/browser", "vs/base/browser/dom", "vs/workbench/services/environment/common/environmentService", "vs/base/common/platform"], function (require, exports, nls_1, extensions_1, layoutService_1, auxiliaryWindowService_1, configuration_1, native_1, dialogs_1, performance_1, instantiation_1, telemetry_1, host_1, window_1, browser_1, dom_1, environmentService_1, platform_1) {
    "use strict";
    var NativeAuxiliaryWindow_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeAuxiliaryWindowService = exports.NativeAuxiliaryWindow = void 0;
    let NativeAuxiliaryWindow = NativeAuxiliaryWindow_1 = class NativeAuxiliaryWindow extends auxiliaryWindowService_1.AuxiliaryWindow {
        constructor(window, container, stylesHaveLoaded, configurationService, nativeHostService, instantiationService, hostService, environmentService, dialogService) {
            super(window, container, stylesHaveLoaded, configurationService, hostService, environmentService);
            this.nativeHostService = nativeHostService;
            this.instantiationService = instantiationService;
            this.dialogService = dialogService;
            this.skipUnloadConfirmation = false;
            this.maximized = false;
            if (!platform_1.isMacintosh) {
                // For now, limit this to platforms that have clear maximised
                // transitions (Windows, Linux) via window buttons.
                this.handleMaximizedState();
            }
        }
        handleMaximizedState() {
            (async () => {
                this.maximized = await this.nativeHostService.isMaximized({ targetWindowId: this.window.vscodeWindowId });
            })();
            this._register(this.nativeHostService.onDidMaximizeWindow(windowId => {
                if (windowId === this.window.vscodeWindowId) {
                    this.maximized = true;
                }
            }));
            this._register(this.nativeHostService.onDidUnmaximizeWindow(windowId => {
                if (windowId === this.window.vscodeWindowId) {
                    this.maximized = false;
                }
            }));
        }
        async handleVetoBeforeClose(e, veto) {
            this.preventUnload(e);
            await this.dialogService.error(veto, (0, nls_1.localize)('backupErrorDetails', "Try saving or reverting the editors with unsaved changes first and then try again."));
        }
        async confirmBeforeClose(e) {
            if (this.skipUnloadConfirmation) {
                return;
            }
            this.preventUnload(e);
            const confirmed = await this.instantiationService.invokeFunction(accessor => NativeAuxiliaryWindow_1.confirmOnShutdown(accessor, 1 /* ShutdownReason.CLOSE */));
            if (confirmed) {
                this.skipUnloadConfirmation = true;
                this.nativeHostService.closeWindow({ targetWindowId: this.window.vscodeWindowId });
            }
        }
        preventUnload(e) {
            e.preventDefault();
            e.returnValue = true;
        }
        createState() {
            const state = super.createState();
            const fullscreen = (0, browser_1.isFullscreen)(this.window);
            return {
                ...state,
                bounds: state.bounds,
                mode: this.maximized ? auxiliaryWindowService_1.AuxiliaryWindowMode.Maximized : fullscreen ? auxiliaryWindowService_1.AuxiliaryWindowMode.Fullscreen : auxiliaryWindowService_1.AuxiliaryWindowMode.Normal
            };
        }
    };
    exports.NativeAuxiliaryWindow = NativeAuxiliaryWindow;
    exports.NativeAuxiliaryWindow = NativeAuxiliaryWindow = NativeAuxiliaryWindow_1 = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, native_1.INativeHostService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, host_1.IHostService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService),
        __param(8, dialogs_1.IDialogService)
    ], NativeAuxiliaryWindow);
    let NativeAuxiliaryWindowService = class NativeAuxiliaryWindowService extends auxiliaryWindowService_1.BrowserAuxiliaryWindowService {
        constructor(layoutService, configurationService, nativeHostService, dialogService, instantiationService, telemetryService, hostService, environmentService) {
            super(layoutService, dialogService, configurationService, telemetryService, hostService, environmentService);
            this.nativeHostService = nativeHostService;
            this.instantiationService = instantiationService;
        }
        async resolveWindowId(auxiliaryWindow) {
            (0, performance_1.mark)('code/auxiliaryWindow/willResolveWindowId');
            const windowId = await auxiliaryWindow.vscode.ipcRenderer.invoke('vscode:registerAuxiliaryWindow', this.nativeHostService.windowId);
            (0, performance_1.mark)('code/auxiliaryWindow/didResolveWindowId');
            return windowId;
        }
        createContainer(auxiliaryWindow, disposables, options) {
            // Zoom level (either explicitly provided or inherited from main window)
            let windowZoomLevel;
            if (typeof options?.zoomLevel === 'number') {
                windowZoomLevel = options.zoomLevel;
            }
            else {
                windowZoomLevel = (0, browser_1.getZoomLevel)((0, dom_1.getActiveWindow)());
            }
            (0, window_1.applyZoom)(windowZoomLevel, auxiliaryWindow);
            return super.createContainer(auxiliaryWindow, disposables);
        }
        createAuxiliaryWindow(targetWindow, container, stylesHaveLoaded) {
            return new NativeAuxiliaryWindow(targetWindow, container, stylesHaveLoaded, this.configurationService, this.nativeHostService, this.instantiationService, this.hostService, this.environmentService, this.dialogService);
        }
    };
    exports.NativeAuxiliaryWindowService = NativeAuxiliaryWindowService;
    exports.NativeAuxiliaryWindowService = NativeAuxiliaryWindowService = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, native_1.INativeHostService),
        __param(3, dialogs_1.IDialogService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, host_1.IHostService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService)
    ], NativeAuxiliaryWindowService);
    (0, extensions_1.registerSingleton)(auxiliaryWindowService_1.IAuxiliaryWindowService, NativeAuxiliaryWindowService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5V2luZG93U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9hdXhpbGlhcnlXaW5kb3cvZWxlY3Ryb24tc2FuZGJveC9hdXhpbGlhcnlXaW5kb3dTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE0QnpGLElBQU0scUJBQXFCLDZCQUEzQixNQUFNLHFCQUFzQixTQUFRLHdDQUFlO1FBTXpELFlBQ0MsTUFBa0IsRUFDbEIsU0FBc0IsRUFDdEIsZ0JBQXlCLEVBQ0Ysb0JBQTJDLEVBQzlDLGlCQUFzRCxFQUNuRCxvQkFBNEQsRUFDckUsV0FBeUIsRUFDVCxrQkFBZ0QsRUFDOUQsYUFBOEM7WUFFOUQsS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFON0Qsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNsQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBR2xELGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQWJ2RCwyQkFBc0IsR0FBRyxLQUFLLENBQUM7WUFFL0IsY0FBUyxHQUFHLEtBQUssQ0FBQztZQWV6QixJQUFJLENBQUMsc0JBQVcsRUFBRSxDQUFDO2dCQUNsQiw2REFBNkQ7Z0JBQzdELG1EQUFtRDtnQkFDbkQsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDN0IsQ0FBQztRQUNGLENBQUM7UUFFTyxvQkFBb0I7WUFDM0IsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDWCxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxFQUFFLGNBQWMsRUFBRSxJ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