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
define(["require", "exports", "vs/base/common/event", "vs/base/browser/browser", "vs/base/browser/dom", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/host/browser/host", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/titlebar/titlebarPart", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/workbench/services/layout/browser/layoutService", "vs/platform/native/common/native", "vs/platform/window/common/window", "vs/platform/instantiation/common/instantiation", "vs/base/common/codicons", "vs/base/common/themables", "vs/workbench/electron-sandbox/parts/titlebar/menubarControl", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/keybinding/common/keybinding", "vs/base/browser/window"], function (require, exports, event_1, browser_1, dom_1, contextkey_1, configuration_1, storage_1, environmentService_1, host_1, platform_1, actions_1, titlebarPart_1, contextView_1, themeService_1, layoutService_1, native_1, window_1, instantiation_1, codicons_1, themables_1, menubarControl_1, editorGroupsService_1, editorService_1, keybinding_1, window_2) {
    "use strict";
    var AuxiliaryNativeTitlebarPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeTitleService = exports.AuxiliaryNativeTitlebarPart = exports.MainNativeTitlebarPart = exports.NativeTitlebarPart = void 0;
    let NativeTitlebarPart = class NativeTitlebarPart extends titlebarPart_1.BrowserTitlebarPart {
        //#region IView
        get minimumHeight() {
            if (!platform_1.isMacintosh) {
                return super.minimumHeight;
            }
            return (this.isCommandCenterVisible ? 35 : this.macTitlebarSize) / (this.preventZoom ? (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element)) : 1);
        }
        get maximumHeight() { return this.minimumHeight; }
        get macTitlebarSize() {
            if (this.bigSurOrNewer) {
                return 28; // macOS Big Sur increases title bar height
            }
            return 22;
        }
        constructor(id, targetWindow, editorGroupsContainer, contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, nativeHostService, editorGroupService, editorService, menuService, keybindingService) {
            super(id, targetWindow, editorGroupsContainer, contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, editorGroupService, editorService, menuService, keybindingService);
            this.nativeHostService = nativeHostService;
            this.bigSurOrNewer = (0, platform_1.isBigSurOrNewer)(environmentService.os.release);
        }
        onMenubarVisibilityChanged(visible) {
            // Hide title when toggling menu bar
            if ((platform_1.isWindows || platform_1.isLinux) && this.currentMenubarVisibility === 'toggle' && visible) {
                // Hack to fix issue #52522 with layered webkit-app-region elements appearing under cursor
                if (this.dragRegion) {
                    (0, dom_1.hide)(this.dragRegion);
                    setTimeout(() => (0, dom_1.show)(this.dragRegion), 50);
                }
            }
            super.onMenubarVisibilityChanged(visible);
        }
        onConfigurationChanged(event) {
            super.onConfigurationChanged(event);
            if (event.affectsConfiguration('window.doubleClickIconToClose')) {
                if (this.appIcon) {
                    this.onUpdateAppIconDragBehavior();
                }
            }
        }
        onUpdateAppIconDragBehavior() {
            const setting = this.configurationService.getValue('window.doubleClickIconToClose');
            if (setting && this.appIcon) {
                this.appIcon.style['-webkit-app-region'] = 'no-drag';
            }
            else if (this.appIcon) {
                this.appIcon.style['-webkit-app-region'] = 'drag';
            }
        }
        installMenubar() {
            super.installMenubar();
            if (this.menubar) {
                return;
            }
            if (this.customMenubar) {
                this._register(this.customMenubar.onFocusStateChange(e => this.onMenubarFocusChanged(e)));
            }
        }
        onMenubarFocusChanged(focused) {
            if ((platform_1.isWindows || platform_1.isLinux) && this.currentMenubarVisibility !== 'compact' && this.dragRegion) {
                if (focused) {
                    (0, dom_1.hide)(this.dragRegion);
                }
                else {
                    (0, dom_1.show)(this.dragRegion);
                }
            }
        }
        createContentArea(parent) {
            const result = super.createContentArea(parent);
            const targetWindow = (0, dom_1.getWindow)(parent);
            const targetWindowId = (0, dom_1.getWindowId)(targetWindow);
            // Native menu controller
            if (platform_1.isMacintosh || (0, window_1.hasNativeTitlebar)(this.configurationService)) {
                this._register(this.instantiationService.createInstance(menubarControl_1.NativeMenubarControl));
            }
            // App Icon (Native Windows/Linux)
            if (this.appIcon) {
                this.onUpdateAppIconDragBehavior();
                this._register((0, dom_1.addDisposableListener)(this.appIcon, dom_1.EventType.DBLCLICK, (() => {
                    this.nativeHostService.closeWindow({ targetWindowId });
                })));
            }
            // Window Controls (Native Windows/Linux)
            if (!platform_1.isMacintosh && !(0, window_1.hasNativeTitlebar)(this.configurationService) && !(0, browser_1.isWCOEnabled)() && this.primaryWindowControls) {
                // Minimize
                const minimizeIcon = (0, dom_1.append)(this.primaryWindowControls, (0, dom_1.$)('div.window-icon.window-minimize' + themables_1.ThemeIcon.asCSSSelector(codicons_1.Codicon.chromeMinimize)));
                this._register((0, dom_1.addDisposableListener)(minimizeIcon, dom_1.EventType.CLICK, () => {
                    this.nativeHostService.minimizeWindow({ targetWindowId });
                }));
                // Restore
                this.maxRestoreControl = (0, dom_1.append)(this.primaryWindowControls, (0, dom_1.$)('div.window-icon.window-max-restore'));
                this._register((0, dom_1.addDisposableListener)(this.maxRestoreControl, dom_1.EventType.CLICK, async () => {
                    const maximized = await this.nativeHostService.isMaximized({ targetWindowId });
                    if (maximized) {
                        return this.nativeHostService.unmaximizeWindow({ targetWindowId });
                    }
                    return this.nativeHostService.maximizeWindow({ targetWindowId });
                }));
                // Close
                const closeIcon = (0, dom_1.append)(this.primaryWindowControls, (0, dom_1.$)('div.window-icon.window-close' + themables_1.ThemeIcon.asCSSSelector(codicons_1.Codicon.chromeClose)));
                this._register((0, dom_1.addDisposableListener)(closeIcon, dom_1.EventType.CLICK, () => {
                    this.nativeHostService.closeWindow({ targetWindowId });
                }));
                // Resizer
                this.resizer = (0, dom_1.append)(this.rootContainer, (0, dom_1.$)('div.resizer'));
                this._register(event_1.Event.runAndSubscribe(this.layoutService.onDidChangeWindowMaximized, ({ windowId, maximized }) => {
                    if (windowId === targetWindowId) {
                        this.onDidChangeWindowMaximized(maximized);
                    }
                }, { windowId: targetWindowId, maximized: this.layoutService.isWindowMaximized(targetWindow) }));
            }
            // Window System Context Menu
            // See https://github.com/electron/electron/issues/24893
            if (platform_1.isWindows && !(0, window_1.hasNativeTitlebar)(this.configurationService)) {
                this._register(this.nativeHostService.onDidTriggerWindowSystemContextMenu(({ windowId, x, y }) => {
                    if (targetWindowId !== windowId) {
                        return;
                    }
                    const zoomFactor = (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element));
                    this.onContextMenu(new MouseEvent('mouseup', { clientX: x / zoomFactor, clientY: y / zoomFactor }), actions_1.MenuId.TitleBarContext);
                }));
            }
            return result;
        }
        onDidChangeWindowMaximized(maximized) {
            if (this.maxRestoreControl) {
                if (maximized) {
                    this.maxRestoreControl.classList.remove(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.chromeMaximize));
                    this.maxRestoreControl.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.chromeRestore));
                }
                else {
                    this.maxRestoreControl.classList.remove(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.chromeRestore));
                    this.maxRestoreControl.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.chromeMaximize));
                }
            }
            if (this.resizer) {
                if (maximized) {
                    (0, dom_1.hide)(this.resizer);
                }
                else {
                    (0, dom_1.show)(this.resizer);
                }
            }
        }
        updateStyles() {
            super.updateStyles();
            // WCO styles only supported on Windows currently
            if ((0, window_1.useWindowControlsOverlay)(this.configurationService)) {
                if (!this.cachedWindowControlStyles ||
                    this.cachedWindowControlStyles.bgColor !== this.element.style.backgroundColor ||
                    this.cachedWindowControlStyles.fgColor !== this.element.style.color) {
                    this.nativeHostService.updateWindowControls({
                        targetWindowId: (0, dom_1.getWindowId)((0, dom_1.getWindow)(this.element)),
                        backgroundColor: this.element.style.backgroundColor,
                        foregroundColor: this.element.style.color
                    });
                }
            }
        }
        layout(width, height) {
            super.layout(width, height);
            if ((0, window_1.useWindowControlsOverlay)(this.configurationService) ||
                (platform_1.isMacintosh && platform_1.isNative && !(0, window_1.hasNativeTitlebar)(this.configurationService))) {
                // When the user goes into full screen mode, the height of the title bar becomes 0.
                // Instead, set it back to the default titlebar height for Catalina users
                // so that they can have the traffic lights rendered at the proper offset.
                // Ref https://github.com/microsoft/vscode/issues/159862
                const newHeight = (height > 0 || this.bigSurOrNewer) ? Math.round(height * (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element))) : this.macTitlebarSize;
                if (newHeight !== this.cachedWindowControlHeight) {
                    this.cachedWindowControlHeight = newHeight;
                    this.nativeHostService.updateWindowControls({
                        targetWindowId: (0, dom_1.getWindowId)((0, dom_1.getWindow)(this.element)),
                        height: newHeight
                    });
                }
            }
        }
    };
    exports.NativeTitlebarPart = NativeTitlebarPart;
    exports.NativeTitlebarPart = NativeTitlebarPart = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, storage_1.IStorageService),
        __param(9, layoutService_1.IWorkbenchLayoutService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, host_1.IHostService),
        __param(12, native_1.INativeHostService),
        __param(13, editorGroupsService_1.IEditorGroupsService),
        __param(14, editorService_1.IEditorService),
        __param(15, actions_1.IMenuService),
        __param(16, keybinding_1.IKeybindingService)
    ], NativeTitlebarPart);
    let MainNativeTitlebarPart = class MainNativeTitlebarPart extends NativeTitlebarPart {
        constructor(contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, nativeHostService, editorGroupService, editorService, menuService, keybindingService) {
            super("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, window_2.mainWindow, 'main', contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, nativeHostService, editorGroupService, editorService, menuService, keybindingService);
        }
    };
    exports.MainNativeTitlebarPart = MainNativeTitlebarPart;
    exports.MainNativeTitlebarPart = MainNativeTitlebarPart = __decorate([
        __param(0, contextView_1.IContextMenuService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, themeService_1.IThemeService),
        __param(5, storage_1.IStorageService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, host_1.IHostService),
        __param(9, native_1.INativeHostService),
        __param(10, editorGroupsService_1.IEditorGroupsService),
        __param(11, editorService_1.IEditorService),
        __param(12, actions_1.IMenuService),
        __param(13, keybinding_1.IKeybindingService)
    ], MainNativeTitlebarPart);
    let AuxiliaryNativeTitlebarPart = class AuxiliaryNativeTitlebarPart extends NativeTitlebarPart {
        static { AuxiliaryNativeTitlebarPart_1 = this; }
        static { this.COUNTER = 1; }
        get height() { return this.minimumHeight; }
        constructor(container, editorGroupsContainer, mainTitlebar, contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, nativeHostService, editorGroupService, editorService, menuService, keybindingService) {
            const id = AuxiliaryNativeTitlebarPart_1.COUNTER++;
            super(`workbench.parts.auxiliaryTitle.${id}`, (0, dom_1.getWindow)(container), editorGroupsContainer, contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, nativeHostService, editorGroupService, editorService, menuService, keybindingService);
            this.container = container;
            this.mainTitlebar = mainTitlebar;
        }
        get preventZoom() {
            // Prevent zooming behavior if any of the following conditions are met:
            // 1. Shrinking below the window control size (zoom < 1)
            // 2. No custom items are present in the main title bar
            // The auxiliary title bar never contains any zoomable items itself,
            // but we want to match the behavior of the main title bar.
            return (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element)) < 1 || !this.mainTitlebar.hasZoomableElements;
        }
    };
    exports.AuxiliaryNativeTitlebarPart = AuxiliaryNativeTitlebarPart;
    exports.AuxiliaryNativeTitlebarPart = AuxiliaryNativeTitlebarPart = AuxiliaryNativeTitlebarPart_1 = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, storage_1.IStorageService),
        __param(9, layoutService_1.IWorkbenchLayoutService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, host_1.IHostService),
        __param(12, native_1.INativeHostService),
        __param(13, editorGroupsService_1.IEditorGroupsService),
        __param(14, editorService_1.IEditorService),
        __param(15, actions_1.IMenuService),
        __param(16, keybinding_1.IKeybindingService)
    ], AuxiliaryNativeTitlebarPart);
    class NativeTitleService extends titlebarPart_1.BrowserTitleService {
        createMainTitlebarPart() {
            return this.instantiationService.createInstance(MainNativeTitlebarPart);
        }
        doCreateAuxiliaryTitlebarPart(container, editorGroupsContainer) {
            return this.instantiationService.createInstance(AuxiliaryNativeTitlebarPart, container, editorGroupsContainer, this.mainPart);
        }
    }
    exports.NativeTitleService = NativeTitleService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGl0bGViYXJQYXJ0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2VsZWN0cm9uLXNhbmRib3gvcGFydHMvdGl0bGViYXIvdGl0bGViYXJQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEyQnpGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsa0NBQW1CO1FBRTFELGVBQWU7UUFFZixJQUFhLGFBQWE7WUFDekIsSUFBSSxDQUFDLHNCQUFXLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxLQUFLLENBQUMsYUFBYSxDQUFDO1lBQzVCLENBQUM7WUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUEsdUJBQWEsRUFBQyxJQUFBLGVBQVMsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEksQ0FBQztRQUNELElBQWEsYUFBYSxLQUFhLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFHbkUsSUFBWSxlQUFlO1lBQzFCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4QixPQUFPLEVBQUUsQ0FBQyxDQUFDLDJDQUEyQztZQUN2RCxDQUFDO1lBRUQsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBU0QsWUFDQyxFQUFVLEVBQ1YsWUFBd0IsRUFDeEIscUJBQXNELEVBQ2pDLGtCQUF1QyxFQUNyQyxvQkFBMkMsRUFDOUIsa0JBQXNELEVBQ25FLG9CQUEyQyxFQUNuRCxZQUEyQixF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