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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/deviceAccess", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/host/browser/host", "vs/workbench/services/driver/browser/driver", "vs/base/browser/window", "vs/base/common/functional", "vs/platform/configuration/common/configuration", "vs/workbench/services/environment/common/environmentService"], function (require, exports, browser_1, dom_1, event_1, deviceAccess_1, async_1, event_2, lifecycle_1, network_1, platform_1, severity_1, uri_1, nls_1, commands_1, dialogs_1, instantiation_1, label_1, opener_1, productService_1, environmentService_1, layoutService_1, lifecycle_2, host_1, driver_1, window_1, functional_1, configuration_1, environmentService_2) {
    "use strict";
    var BaseWindow_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWindow = exports.BaseWindow = void 0;
    let BaseWindow = class BaseWindow extends lifecycle_1.Disposable {
        static { BaseWindow_1 = this; }
        static { this.TIMEOUT_HANDLES = Number.MIN_SAFE_INTEGER; } // try to not compete with the IDs of native `setTimeout`
        static { this.TIMEOUT_DISPOSABLES = new Map(); }
        constructor(targetWindow, dom = { getWindowsCount: dom_1.getWindowsCount, getWindows: dom_1.getWindows }, hostService, environmentService) {
            super();
            this.hostService = hostService;
            this.environmentService = environmentService;
            this.enableWindowFocusOnElementFocus(targetWindow);
            this.enableMultiWindowAwareTimeout(targetWindow, dom);
            this.registerFullScreenListeners(targetWindow.vscodeWindowId);
        }
        //#region focus handling in multi-window applications
        enableWindowFocusOnElementFocus(targetWindow) {
            const originalFocus = targetWindow.HTMLElement.prototype.focus;
            const that = this;
            targetWindow.HTMLElement.prototype.focus = function (options) {
                // Ensure the window the element belongs to is focused
                // in scenarios where auxiliary windows are present
                that.onElementFocus((0, dom_1.getWindow)(this));
                // Pass to original focus() method
                originalFocus.apply(this, [options]);
            };
        }
        onElementFocus(targetWindow) {
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (activeWindow !== targetWindow && activeWindow.document.hasFocus()) {
                // Call original focus()
                targetWindow.focus();
                // In Electron, `window.focus()` fails to bring the window
                // to the front if multiple windows exist in the same process
                // group (floating windows). As such, we ask the host service
                // to focus the window which can take care of bringin the
                // window to the front.
                //
                // To minimise disruption by bringing windows to the front
                // by accident, we only do this if the window is not already
                // focused and the active window is not the target window
                // but has focus. This is an indication that multiple windows
                // are opened in the same process group while the target window
                // is not focused.
                if (!this.environmentService.extensionTestsLocationURI &&
                    !targetWindow.document.hasFocus()) {
                    this.hostService.focus(targetWindow);
                }
            }
        }
        //#endregion
        //#region timeout handling in multi-window applications
        enableMultiWindowAwareTimeout(targetWindow, dom = { getWindowsCount: dom_1.getWindowsCount, getWindows: dom_1.getWindows }) {
            // Override `setTimeout` and `clearTimeout` on the provided window to make
            // sure timeouts are dispatched to all opened windows. Some browsers may decide
            // to throttle timeouts in minimized windows, so with this we can ensure the
            // timeout is scheduled without being throttled (unless all windows are minimized).
            const originalSetTimeout = targetWindow.setTimeout;
            Object.defineProperty(targetWindow, 'vscodeOriginalSetTimeout', { get: () => originalSetTimeout });
            const originalClearTimeout = targetWindow.clearTimeout;
            Object.defineProperty(targetWindow, 'vscodeOriginalClearTimeout', { get: () => originalClearTimeout });
            targetWindow.setTimeout = function (handler, timeout = 0, ...args) {
                if (dom.getWindowsCount() === 1 || typeof handler === 'string' || timeout === 0 /* immediates are never throttled */) {
                    return originalSetTimeout.apply(this, [handler, timeout, ...args]);
                }
                const timeoutDisposables = new Set();
                const timeoutHandle = BaseWindow_1.TIMEOUT_HANDLES++;
                BaseWindow_1.TIMEOUT_DISPOSABLES.set(timeoutHandle, timeoutDisposables);
                const handlerFn = (0, functional_1.createSingleCallFunction)(handler, () => {
                    (0, lifecycle_1.dispose)(timeoutDisposables);
                    BaseWindow_1.TIMEOUT_DISPOSABLES.delete(timeoutHandle);
                });
                for (const { window, disposables } of dom.getWindows()) {
                    if ((0, window_1.isAuxiliaryWindow)(window) && window.document.visibilityState === 'hidden') {
                        continue; // skip over hidden windows (but never over main window)
                    }
                    const handle = window.vscodeOriginalSetTimeout.apply(this, [handlerFn, timeout, ...args]);
                    const timeoutDisposable = (0, lifecycle_1.toDisposable)(() => {
                        window.vscodeOriginalClearTimeout(handle);
                        timeoutDisposables.delete(timeoutDisposable);
                    });
                    disposables.add(timeoutDisposable);
                    timeoutDisposables.add(timeoutDisposable);
                }
                return timeoutHandle;
            };
            targetWindow.clearTimeout = function (timeoutHandle) {
                const timeoutDisposables = typeof timeoutHandle === 'number' ? BaseWindow_1.TIMEOUT_DISPOSABLES.get(timeoutHandle) : undefined;
                if (timeoutDisposables) {
                    (0, lifecycle_1.dispose)(timeoutDisposables);
                    BaseWindow_1.TIMEOUT_DISPOSABLES.delete(timeoutHandle);
                }
                else {
                    originalClearTimeout.apply(this, [timeoutHandle]);
                }
            };
        }
        //#endregion
        registerFullScreenListeners(targetWindowId) {
            this._register(this.hostService.onDidChangeFullScreen(({ windowId, fullscreen }) => {
                if (windowId === targetWindowId) {
                    const targetWindow = (0, dom_1.getWindowById)(targetWindowId);
                    if (targetWindow) {
                        (0, browser_1.setFullscreen)(fullscreen, targetWindow.window);
                    }
                }
            }));
        }
        //#region Confirm on Shutdown
        static async confirmOnShutdown(accessor, reason) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const message = reason === 2 /* ShutdownReason.QUIT */ ?
                (platform_1.isMacintosh ? (0, nls_1.localize)('quitMessageMac', "Are you sure you want to quit?") : (0, nls_1.localize)('quitMessage', "Are you sure you want to exit?")) :
                (0, nls_1.localize)('closeWindowMessage', "Are you sure you want to close the window?");
            const primaryButton = reason === 2 /* ShutdownReason.QUIT */ ?
                (platform_1.isMacintosh ? (0, nls_1.localize)({ key: 'quitButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Quit") : (0, nls_1.localize)({ key: 'exitButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Exit")) :
                (0, nls_1.localize)({ key: 'closeWindowButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Close Window");
            const res = await dialogService.confirm({
                message,
                primaryButton,
                checkbox: {
                    label: (0, nls_1.localize)('doNotAskAgain', "Do not ask me again")
                }
            });
            // Update setting if checkbox checked
            if (res.confirmed && res.checkboxChecked) {
                await configurationService.updateValue('window.confirmBeforeClose', 'never');
            }
            return res.confirmed;
        }
    };
    exports.BaseWindow = BaseWindow;
    exports.BaseWindow = BaseWindow = BaseWindow_1 = __decorate([
        __param(2, host_1.IHostService),
        __param(3, environmentService_2.IWorkbenchEnvironmentService)
    ], BaseWindow);
    let BrowserWindow = class BrowserWindow extends BaseWindow {
        constructor(openerService, lifecycleService, dialogService, labelService, productService, browserEnvironmentService, layoutService, instantiationService, hostService) {
            super(window_1.mainWindow, undefined, hostService, browserEnvironmentService);
            this.openerService = openerService;
            this.lifecycleService = lifecycleService;
            this.dialogService = dialogService;
            this.labelService = labelService;
            this.productService = productService;
            this.browserEnvironmentService = browserEnvironmentService;
            this.layoutService = layoutService;
            this.instantiationService = instantiationService;
            this.registerListeners();
            this.create();
        }
        registerListeners() {
            // Lifecycle
            this._register(this.lifecycleService.onWillShutdown(() => this.onWillShutdown()));
            // Layout
            const viewport = platform_1.isIOS && window_1.mainWindow.visualViewport ? window_1.mainWindow.visualViewport /** Visual viewport */ : window_1.mainWindow /** Layout viewport */;
            this._register((0, dom_1.addDisposableListener)(viewport, dom_1.EventType.RESIZE, () => {
                this.layoutService.layout();
                // Sometimes the keyboard appearing scrolls the whole workbench out of view, as a workaround scroll back into view #121206
                if (platform_1.isIOS) {
                    window_1.mainWindow.scrollTo(0, 0);
                }
            }));
            // Prevent the back/forward gestures in macOS
            this._register((0, dom_1.addDisposableListener)(this.layoutService.mainContainer, dom_1.EventType.WHEEL, e => e.preventDefault(), { passive: false }));
            // Prevent native context menus in web
            this._register((0, dom_1.addDisposableListener)(this.layoutService.mainContainer, dom_1.EventType.CONTEXT_MENU, e => dom_1.EventHelper.stop(e, true)));
            // Prevent default navigation on drop
            this._register((0, dom_1.addDisposableListener)(this.layoutService.mainContainer, dom_1.EventType.DROP, e => dom_1.EventHelper.stop(e, true)));
        }
        onWillShutdown() {
            // Try to detect some user interaction with the workbench
            // when shutdown has happened to not show the dialog e.g.
            // when navigation takes a longer time.
            event_2.Event.toPromise(event_2.Event.any(event_2.Event.once(new event_1.DomEmitter(window_1.mainWindow.document.body, dom_1.EventType.KEY_DOWN, true).event), event_2.Event.once(new event_1.DomEmitter(window_1.mainWindow.document.body, dom_1.EventType.MOUSE_DOWN, true).event))).then(async () => {
                // Delay the dialog in case the user interacted
                // with the page before it transitioned away
                await (0, async_1.timeout)(3000);
                // This should normally not happen, but if for some reason
                // the workbench was shutdown while the page is still there,
                // inform the user that only a reload can bring back a working
                // state.
                await this.dialogService.prompt({
                    type: severity_1.default.Error,
                    message: (0, nls_1.localize)('shutdownError', "An unexpected error occurred that requires a reload of this page."),
                    detail: (0, nls_1.localize)('shutdownErrorDetail', "The workbench was unexpectedly disposed while running."),
                    buttons: [
                        {
                            label: (0, nls_1.localize)({ key: 'reload', comment: ['&& denotes a mnemonic'] }, "&&Reload"),
                            run: () => window_1.mainWindow.location.reload() // do not use any services at this point since they are likely not functional at this point
                        }
                    ]
                });
            });
        }
        create() {
            // Handle open calls
            this.setupOpenHandlers();
            // Label formatting
            this.registerLabelFormatters();
            // Commands
            this.registerCommands();
            // Smoke Test Driver
            this.setupDriver();
        }
        setupDriver() {
            if (this.environmentService.enableSmokeTestDriver) {
                (0, driver_1.registerWindowDriver)(this.instantiationService);
            }
        }
        setupOpenHandlers() {
            // We need to ignore the `beforeunload` event while
            // we handle external links to open specifically for
            // the case of application protocols that e.g. invoke
            // vscode itself. We do not want to open these links
            // in a new window because that would leave a blank
            // window to the user, but using `window.location.href`
            // will trigger the `beforeunload`.
            this.openerService.setDefaultExternalOpener({
                openExternal: async (href) => {
                    let isAllowedOpener = false;
                    if (this.browserEnvironmentService.options?.openerAllowedExternalUrlPrefixes) {
                        for (const trustedPopupPrefix of this.browserEnvironmentService.options.openerAllowedExternalUrlPrefixes) {
                            if (href.startsWith(trustedPopupPrefix)) {
                                isAllowedOpener = true;
                                break;
                            }
                        }
                    }
                    // HTTP(s): open in new window and deal with potential popup blockers
                    if ((0, network_1.matchesScheme)(href, network_1.Schemas.http) || (0, network_1.matchesScheme)(href, network_1.Schemas.https)) {
                        if (browser_1.isSafari) {
                            const opened = (0, dom_1.windowOpenWithSuccess)(href, !isAllowedOpener);
                            if (!opened) {
                                await this.dialogService.prompt({
                                    type: severity_1.default.Warning,
                                    message: (0, nls_1.localize)('unableToOpenExternal', "The browser interrupted the opening of a new tab or window. Press 'Open' to open it anyway."),
                                    detail: href,
                                    buttons: [
                                        {
                                            label: (0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, "&&Open"),
                                            run: () => isAllowedOpener ? (0, dom_1.windowOpenPopup)(href) : (0, dom_1.windowOpenNoOpener)(href)
                                        },
                                        {
                                            label: (0, nls_1.localize)({ key: 'learnMore', comment: ['&& denotes a mnemonic'] }, "&&Learn More"),
                                            run: () => this.openerService.open(uri_1.URI.parse('https://aka.ms/allow-vscode-popup'))
                                        }
                                    ],
                                    cancelButton: true
                                });
                            }
                        }
                        else {
                            isAllowedOpener
                                ? (0, dom_1.windowOpenPopup)(href)
                                : (0, dom_1.windowOpenNoOpener)(href);
                        }
                    }
                    // Anything else: set location to trigger protocol handler in the browser
                    // but make sure to signal this as an expected unload and disable unload
                    // handling explicitly to prevent the workbench from going down.
                    else {
                        const invokeProtocolHandler = () => {
                            this.lifecycleService.withExpectedShutdown({ disableShutdownHandling: true }, () => window_1.mainWindow.location.href = href);
                        };
                        invokeProtocolHandler();
                        const showProtocolUrlOpenedDialog = async () => {
                            const { downloadUrl } = this.productService;
                            let detail;
                            const buttons = [
                                {
                                    label: (0, nls_1.localize)({ key: 'openExternalDialogButtonRetry.v2', comment: ['&& denotes a mnemonic'] }, "&&Try Again"),
                                    run: () => invokeProtocolHandler()
                                }
                            ];
                            if (downloadUrl !== undefined) {
                                detail = (0, nls_1.localize)('openExternalDialogDetail.v2', "We launched {0} on your computer.\n\nIf {1} did not launch, try again or install it below.", this.productService.nameLong, this.productService.nameLong);
                                buttons.push({
                                    label: (0, nls_1.localize)({ key: 'openExternalDialogButtonInstall.v3', comment: ['&& denotes a mnemonic'] }, "&&Install"),
                                    run: async () => {
                                        await this.openerService.open(uri_1.URI.parse(downloadUrl));
                                        // Re-show the dialog so that the user can come back after installing and try again
                                        showProtocolUrlOpenedDialog();
                                    }
                                });
                            }
                            else {
                                detail = (0, nls_1.localize)('openExternalDialogDetailNoInstall', "We launched {0} on your computer.\n\nIf {1} did not launch, try again below.", this.productService.nameLong, this.productService.nameLong);
                            }
                            // While this dialog shows, closing the tab will not display a confirmation dialog
                            // to avoid showing the user two dialogs at once
                            await this.hostService.withExpectedShutdown(() => this.dialogService.prompt({
                                type: severity_1.default.Info,
                                message: (0, nls_1.localize)('openExternalDialogTitle', "All done. You can close this tab now."),
                                detail,
                                buttons,
                                cancelButton: true
                            }));
                        };
                        // We cannot know whether the protocol handler succeeded.
                        // Display guidance in case it did not, e.g. the app is not installed locally.
                        if ((0, network_1.matchesScheme)(href, this.productService.urlProtocol)) {
                            await showProtocolUrlOpenedDialog();
                        }
                    }
                    return true;
                }
            });
        }
        registerLabelFormatters() {
            this._register(this.labelService.registerFormatter({
                scheme: network_1.Schemas.vscodeUserData,
                priority: true,
                formatting: {
                    label: '(Settings) ${path}',
                    separator: '/',
                }
            }));
        }
        registerCommands() {
            // Allow extensions to request USB devices in Web
            commands_1.CommandsRegistry.registerCommand('workbench.experimental.requestUsbDevice', async (_accessor, options) => {
                return (0, deviceAccess_1.requestUsbDevice)(options);
            });
            // Allow extensions to request Serial devices in Web
            commands_1.CommandsRegistry.registerCommand('workbench.experimental.requestSerialPort', async (_accessor, options) => {
                return (0, deviceAccess_1.requestSerialPort)(options);
            });
            // Allow extensions to request HID devices in Web
            commands_1.CommandsRegistry.registerCommand('workbench.experimental.requestHidDevice', async (_accessor, options) => {
                return (0, deviceAccess_1.requestHidDevice)(options);
            });
        }
    };
    exports.BrowserWindow = BrowserWindow;
    exports.BrowserWindow = BrowserWindow = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, dialogs_1.IDialogService),
        __param(3, label_1.ILabelService),
        __param(4, productService_1.IProductService),
        __param(5, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, host_1.IHostService)
    ], BrowserWindow);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvd2luZG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUErQnpGLElBQWUsVUFBVSxHQUF6QixNQUFlLFVBQVcsU0FBUSxzQkFBVTs7aUJBRW5DLG9CQUFlLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixBQUExQixDQUEyQixHQUFDLHlEQUF5RDtpQkFDM0Ysd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQTRCLEFBQXRDLENBQXVDO1FBRWxGLFlBQ0MsWUFBd0IsRUFDeEIsR0FBRyxHQUFHLEVBQUUsZUFBZSxFQUFmLHFCQUFlLEVBQUUsVUFBVSxFQUFWLGdCQUFVLEVBQUUsRUFDSixXQUF5QixFQUNULGtCQUFnRDtZQUVqRyxLQUFLLEVBQUUsQ0FBQztZQUh5QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNULHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFJakcsSUFBSSxDQUFDLCtCQUErQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFdEQsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQscURBQXFEO1FBRTNDLCtCQUErQixDQUFDLFlBQXdCO1lBQ2pFLE1BQU0sYUFBYSxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUUvRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7WUFDbEIsWUFBWSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFVBQTZCLE9BQWtDO2dCQUV6RyxzREFBc0Q7Z0JB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