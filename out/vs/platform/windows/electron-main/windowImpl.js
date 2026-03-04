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
define(["require", "exports", "electron", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/uri", "vs/nls", "os", "vs/platform/backup/electron-main/backup", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/environment/node/argvHelper", "vs/platform/files/common/files", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/protocol/electron-main/protocol", "vs/platform/externalServices/common/marketplace", "vs/platform/storage/electron-main/storageMainService", "vs/platform/telemetry/common/telemetry", "vs/base/common/themables", "vs/platform/theme/electron-main/themeMainService", "vs/platform/window/common/window", "vs/platform/windows/electron-main/windows", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/platform/window/electron-main/window", "vs/platform/policy/common/policy", "vs/platform/state/node/state", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/log/electron-main/loggerService", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiation"], function (require, exports, electron_1, async_1, cancellation_1, errorMessage_1, event_1, lifecycle_1, network_1, performance_1, platform_1, uri_1, nls_1, os_1, backup_1, configuration_1, dialogMainService_1, environmentMainService_1, argvHelper_1, files_1, lifecycleMainService_1, log_1, productService_1, protocol_1, marketplace_1, storageMainService_1, telemetry_1, themables_1, themeMainService_1, window_1, windows_1, workspace_1, workspacesManagementMainService_1, window_2, policy_1, state_1, userDataProfile_1, loggerService_1, arrays_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeWindow = exports.BaseWindow = void 0;
    var ReadyState;
    (function (ReadyState) {
        /**
         * This window has not loaded anything yet
         * and this is the initial state of every
         * window.
         */
        ReadyState[ReadyState["NONE"] = 0] = "NONE";
        /**
         * This window is navigating, either for the
         * first time or subsequent times.
         */
        ReadyState[ReadyState["NAVIGATING"] = 1] = "NAVIGATING";
        /**
         * This window has finished loading and is ready
         * to forward IPC requests to the web contents.
         */
        ReadyState[ReadyState["READY"] = 2] = "READY";
    })(ReadyState || (ReadyState = {}));
    class BaseWindow extends lifecycle_1.Disposable {
        get lastFocusTime() { return this._lastFocusTime; }
        get win() { return this._win; }
        setWin(win) {
            this._win = win;
            // Window Events
            this._register(event_1.Event.fromNodeEventEmitter(win, 'maximize')(() => this._onDidMaximize.fire()));
            this._register(event_1.Event.fromNodeEventEmitter(win, 'unmaximize')(() => this._onDidUnmaximize.fire()));
            this._register(event_1.Event.fromNodeEventEmitter(win, 'closed')(() => {
                this._onDidClose.fire();
                this.dispose();
            }));
            this._register(event_1.Event.fromNodeEventEmitter(win, 'focus')(() => {
                this._lastFocusTime = Date.now();
            }));
            this._register(event_1.Event.fromNodeEventEmitter(this._win, 'enter-full-screen')(() => this._onDidEnterFullScreen.fire()));
            this._register(event_1.Event.fromNodeEventEmitter(this._win, 'leave-full-screen')(() => this._onDidLeaveFullScreen.fire()));
            // Sheet Offsets
            const useCustomTitleStyle = !(0, window_1.hasNativeTitlebar)(this.configurationService);
            if (platform_1.isMacintosh && useCustomTitleStyle) {
                win.setSheetOffset((0, platform_1.isBigSurOrNewer)((0, os_1.release)()) ? 28 : 22); // offset dialogs by the height of the custom title bar if we have any
            }
            // Update the window controls immediately based on cached values
            if (useCustomTitleStyle && ((platform_1.isWindows && (0, window_1.useWindowControlsOverlay)(this.configurationService)) || platform_1.isMacintosh)) {
                const cachedWindowControlHeight = this.stateService.getItem((BaseWindow.windowControlHeightStateStorageKey));
                if (cachedWindowControlHeight) {
                    this.updateWindowControls({ height: cachedWindowControlHeight });
                }
            }
            // Windows Custom System Context Menu
            // See https://github.com/electron/electron/issues/24893
            //
            // The purpose of this is to allow for the context menu in the Windows Title Bar
            //
            // Currently, all mouse events in the title bar are captured by the OS
            // thus we need to capture them here with a window hook specific to Windows
            // and then forward them to the correct window.
            if (platform_1.isWindows && useCustomTitleStyle) {
                const WM_INITMENU = 0x0116; // https://docs.microsoft.com/en-us/windows/win32/menurc/wm-initmenu
                // This sets up a listener for the window hook. This is a Windows-only API provided by electron.
                win.hookWindowMessage(WM_INITMENU, () => {
                    const [x, y] = win.getPosition();
                    const cursorPos = electron_1.screen.getCursorScreenPoint();
                    const cx = cursorPos.x - x;
                    const cy = cursorPos.y - y;
                    // In some cases, show the default system context menu
                    // 1) The mouse position is not within the title bar
                    // 2) The mouse position is within the title bar, but over the app icon
                    // We do not know the exact title bar height but we make an estimate based on window height
                    const shouldTriggerDefaultSystemContextMenu = () => {
                        // Use the custom context menu when over the title bar, but not over the app icon
                        // The app icon is estimated to be 30px wide
                        // The title bar is estimated to be the max of 35px and 15% of the window height
                        if (cx > 30 && cy >= 0 && cy <= Math.max(win.getBounds().height * 0.15, 35)) {
                            return false;
                        }
                        return true;
                    };
                    if (!shouldTriggerDefaultSystemContextMenu()) {
                        // This is necessary to make sure the native system context menu does not show up.
                        win.setEnabled(false);
                        win.setEnabled(true);
                        this._onDidTriggerSystemContextMenu.fire({ x: cx, y: cy });
                    }
                    return 0;
                });
            }
            // Open devtools if instructed from command line args
            if (this.environmentMainService.args['open-devtools'] === true) {
                win.webContents.openDevTools();
            }
            // macOS: Window Fullscreen Transitions
            if (platform_1.isMacintosh) {
                this._register(this.onDidEnterFullScreen(() => {
                    this.joinNativeFullScreenTransition?.complete(true);
                }));
                this._register(this.onDidLeaveFullScreen(() => {
                    this.joinNativeFullScreenTransition?.complete(true);
                }));
            }
        }
        constructor(configurationService, stateService, environmentMainService, logService) {
            super();
            this.configurationService = configurationService;
            this.stateService = stateService;
            this.environmentMainService = environmentMainService;
            this.logService = logService;
            //#region Events
            this._onDidClose = this._register(new event_1.Emitter());
            this.onDidClose = this._onDidClose.event;
            this._onDidMaximize = this._register(new event_1.Emitter());
            this.onDidMaximize = this._onDidMaximize.event;
            this._onDidUnmaximize = this._register(new event_1.Emitter());
            this.onDidUnmaximize = this._onDidUnmaximize.event;
            this._onDidTriggerSystemContextMenu = this._register(new event_1.Emitter());
            this.onDidTriggerSystemContextMenu = this._onDidTriggerSystemContextMenu.event;
            this._onDidEnterFullScreen = this._register(new event_1.Emitter());
            this.onDidEnterFullScreen = this._onDidEnterFullScreen.event;
            this._onDidLeaveFullScreen = this._register(new event_1.Emitter());
            this.onDidLeaveFullScreen = this._onDidLeaveFullScreen.event;
            this._lastFocusTime = Date.now(); // window is shown on creation so take current time
            this._win = null;
            this.hasWindowControlOverlay = (0, window_1.useWindowControlsOverlay)(this.configurationService);
            //#endregion
            //#region Fullscreen
            this.transientIsNativeFullScreen = undefined;
            this.joinNativeFullScreenTransition = undefined;
        }
        applyState(state, hasMultipleDisplays = electron_1.screen.getAllDisplays().length > 0) {
            // TODO@electron (Electron 4 regression): when running on multiple displays where the target display
            // to open the window has a larger resolution than the primary display, the window will not size
            // correctly unless we set the bounds again (https://github.com/microsoft/vscode/issues/74872)
            //
            // Extended to cover Windows as well as Mac (https://github.com/microsoft/vscode/issues/146499)
            //
            // However, when running with native tabs with multiple windows we cannot use this workaround
            // because there is a potential that the new window will be added as native tab instead of being
            // a window on its own. In that case calling setBounds() would cause https://github.com/microsoft/vscode/issues/75830
            const windowSettings = this.configurationService.getValue('window');
            const useNativeTabs = platform_1.isMacintosh && windowSettings?.nativeTabs === true;
            if ((platform_1.isMacintosh || platform_1.isWindows) && hasMultipleDisplays && (!useNativeTabs || electron_1.BrowserWindow.getAllWindows().length === 1)) {
                if ([state.width, state.height, state.x, state.y].every(value => typeof value === 'number')) {
                    this._win?.setBounds({
                        width: state.width,
                        height: state.height,
                        x: state.x,
                        y: state.y
                    });
                }
            }
            if (state.mode === 0 /* WindowMode.Maximized */ || state.mode === 3 /* WindowMode.Fullscreen */) {
                // this call may or may not show the window, depends
                // on the platform: currently on Windows and Linux will
                // show the window as active. To be on the safe side,
                // we show the window at the end of this block.
                this._win?.maximize();
                if (state.mode === 3 /* WindowMode.Fullscreen */) {
                    this.setFullScreen(true, true);
                }
                // to reduce flicker from the default window size
                // to maximize or fullscreen, we only show after
                this._win?.show();
            }
        }
        setRepresentedFilename(filename) {
            if (platform_1.isMacintosh) {
                this.win?.setRepresentedFilename(filename);
            }
            else {
                this.representedFilename = filename;
            }
        }
        getRepresentedFilename() {
            if (platform_1.isMacintosh) {
                return this.win?.getRepresentedFilename();
            }
            return this.representedFilename;
        }
        setDocumentEdited(edited) {
            if (platform_1.isMacintosh) {
                this.win?.setDocumentEdited(edited);
            }
            this.documentEdited = edited;
        }
        isDocumentEdited() {
            if (platform_1.isMacintosh) {
                return Boolean(this.win?.isDocumentEdited());
            }
            return !!this.documentEdited;
        }
        focus(options) {
            if (platform_1.isMacintosh && options?.force) {
                electron_1.app.focus({ steal: true });
            }
            const win = this.win;
            if (!win) {
                return;
            }
            if (win.isMinimized()) {
                win.restore();
            }
            win.focus();
        }
        handleTitleDoubleClick() {
            const win = this.win;
            if (!win) {
                return;
            }
            // Respect system settings on mac with regards to title click on windows title
            if (platform_1.isMacintosh) {
                const action = electron_1.systemPreferences.getUserDefault('AppleActionOnDoubleClick', 'string');
                switch (action) {
                    case 'Minimize':
                        win.minimize();
                        break;
                    case 'None':
                        break;
                    case 'Maximize':
                    default:
                        if (win.isMaximized()) {
                            win.unmaximize();
                        }
                        else {
                            win.maximize();
                        }
                }
            }
            // Linux/Windows: just toggle maximize/minimized state
            else {
                if (win.isMaximized()) {
                    win.unmaximize();
                }
                else {
                    win.maximize();
                }
            }
        }
        //#region Window Control Overlays
        static { this.windowControlHeightStateStorageKey = 'windowControlHeight'; }
        updateWindowControls(options) {
            const win = this.win;
            if (!win) {
                return;
            }
            // Cache the height for speeds lookups on startup
            if (options.height) {
                this.stateService.setItem((CodeWindow.windowControlHeightStateStorageKey), options.height);
            }
            // Windows: window control overlay (WCO)
            if (platform_1.isWindows && this.hasWindowControlOverlay) {
                win.setTitleBarOverlay({
                    color: options.backgroundColor?.trim() === '' ? undefined : options.backgroundColor,
                    symbolColor: options.foregroundColor?.trim() === '' ? undefined : options.foregroundColor,
                    height: options.height ? options.height - 1 : undefined // account for window border
                });
            }
            // macOS: traffic lights
            else if (platform_1.isMacintosh && options.height !== undefined) {
                const verticalOffset = (options.height - 15) / 2; // 15px is the height of the traffic lights
                if (!verticalOffset) {
                    win.setWindowButtonPosition(null);
                }
                else {
                    win.setWindowButtonPosition({ x: verticalOffset, y: verticalOffset });
                }
            }
        }
        toggleFullScreen() {
            this.setFullScreen(!this.isFullScreen, false);
        }
        setFullScreen(fullscreen, fromRestore) {
            // Set fullscreen state
            if ((0, window_1.useNativeFullScreen)(this.configurationService)) {
                this.setNativeFullScreen(fullscreen, fromRestore);
            }
            else {
                this.setSimpleFullScreen(fullscreen);
            }
        }
        get isFullScreen() {
            if (platform_1.isMacintosh && typeof this.transientIsNativeFullScreen === 'boolean') {
                return this.transientIsNativeFullScreen;
            }
            const win = this.win;
            const isFullScreen = win?.isFullScreen();
            const isSimpleFullScreen = win?.isSimpleFullScreen();
            return Boolean(isFullScreen || isSimpleFullScreen);
        }
        setNativeFullScreen(fullscreen, fromRestore) {
            const win = this.win;
            if (win?.isSimpleFullScreen()) {
                win?.setSimpleFullScreen(false);
            }
            this.doSetNativeFullScreen(fullscreen, fromRestore);
        }
        doSetNativeFullScreen(fullscreen, fromRestore) {
            if (platform_1.isMacintosh) {
                // macOS: Electron windows report `false` for `isFullScreen()` for as long
                // as the fullscreen transition animation takes place. As such, we need to
                // listen to the transition events and carry around an intermediate state
                // for knowing if we are in fullscreen or not
                // Refs: https://github.com/electron/electron/issues/35360
                this.transientIsNativeFullScreen = fullscreen;
                const joinNativeFullScreenTransition = this.joinNativeFullScreenTransition = new async_1.DeferredPromise();
                (async () => {
                    const transitioned = await Promise.race([
                        joinNativeFullScreenTransition.p,
                        (0, async_1.timeout)(10000).then(() => false)
                    ]);
                    if (this.joinNativeFullScreenTransition !== joinNativeFullScreenTransition) {
                        return; // another transition was requested later
                    }
                    this.transientIsNativeFullScreen = undefined;
                    this.joinNativeFullScreenTransition = undefined;
                    // There is one interesting gotcha on macOS: when you are opening a new
                    // window from a fullscreen window, that new window will immediately
                    // open fullscreen and emit the `enter-full-screen` event even before we
                    // reach this method. In that case, we actually will timeout after 10s
                    // for detecting the transition and as such it is important that we only
                    // signal to leave fullscreen if the window reports as not being in fullscreen.
                    if (!transitioned && fullscreen && fromRestore && this.win && !this.win.isFullScreen()) {
                        // We have seen requests for fullscreen failing eventually after some
                        // time, for example when an OS update was performed and windows restore.
                        // In those cases a user would find a window that is not in fullscreen
                        // but also does not show any custom titlebar (and thus window controls)
                        // because we think the window is in fullscreen.
                        //
                        // As a workaround in that case we emit a warning and leave fullscreen
                        // so that at least the window controls are back.
                        this.logService.warn('window: native macOS fullscreen transition did not happen within 10s from restoring');
                        this._onDidLeaveFullScreen.fire();
                    }
                })();
            }
            const win = this.win;
            win?.setFullScreen(fullscreen);
        }
        setSimpleFullScreen(fullscreen) {
            const win = this.win;
            if (win?.isFullScreen()) {
                this.doSetNativeFullScreen(false, false);
            }
            win?.setSimpleFullScreen(fullscreen);
            win?.webContents.focus(); // workaround issue where focus is not going into window
        }
        dispose() {
            super.dispose();
            this._win = null; // Important to dereference the window object to allow for GC
        }
    }
    exports.BaseWindow = BaseWindow;
    let CodeWindow = class CodeWindow extends BaseWindow {
        get id() { return this._id; }
        get backupPath() { return this._config?.backupPath; }
        get openedWorkspace() { return this._config?.workspace; }
        get profile() {
            if (!this.config) {
                return undefined;
            }
            const profile = this.userDataProfilesService.profiles.find(profile => profile.id === this.config?.profiles.profile.id);
            if (this.isExtensionDevelopmentHost && profile) {
                return profile;
            }
            return this.userDataProfilesService.getProfileForWorkspace(this.config.workspace ?? (0, workspace_1.toWorkspaceIdentifier)(this.backupPath, this.isExtensionDevelopmentHost)) ?? this.userDataProfilesService.defaultProfile;
        }
        get remoteAuthority() { return this._config?.remoteAuthority; }
        get config() { return this._config; }
        get isExtensionDevelopmentHost() { return !!(this._config?.extensionDevelopmentPath); }
        get isExtensionTestHost() { return !!(this._config?.extensionTestsPath); }
        get isExtensionDevelopmentTestFromCli() { return this.isExtensionDevelopmentHost && this.isExtensionTestHost && !this._config?.debugId; }
        constructor(config, logService, loggerMainService, environmentMainService, policyService, userDataProfilesService, fileService, applicationStorageMainService, storageMainService, configurationService, themeMainService, workspacesManagementMainService, backupMainService, telemetryService, dialogMainService, lifecycleMainService, productService, protocolMainService, windowsMainService, stateService, instantiationService) {
            super(configurationService, stateService, environmentMainService, logService);
            this.loggerMainService = loggerMainService;
            this.policyService = policyService;
            this.userDataProfilesService = userDataProfilesService;
            this.fileService = fileService;
            this.applicationStorageMainService = applicationStorageMainService;
            this.storageMainService = storageMainService;
            this.themeMainService = themeMainService;
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.backupMainService = backupMainService;
            this.telemetryService = telemetryService;
            this.dialogMainService = dialogMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.productService = productService;
            this.protocolMainService = protocolMainService;
            this.windowsMainService = windowsMainService;
            //#region Events
            this._onWillLoad = this._register(new event_1.Emitter());
            this.onWillLoad = this._onWillLoad.event;
            this._onDidSignalReady = this._register(new event_1.Emitter());
            this.onDidSignalReady = this._onDidSignalReady.event;
            this._onDidDestroy = this._register(new event_1.Emitter());
            this.onDidDestroy = this._onDidDestroy.event;
            this.whenReadyCallbacks = [];
            this.touchBarGroups = [];
            this.currentHttpProxy = undefined;
            this.currentNoProxy = undefined;
            this.customZoomLevel = undefined;
            this.configObjectUrl = this._register(this.protocolMainService.createIPCObjectUrl());
            this.wasLoaded = false;
            this.readyState = 0 /* ReadyState.NONE */;
            //#region create browser window
            {
                // Load window state
                const [state, hasMultipleDisplays] = this.restoreWindowState(config.state);
                this.windowState = state;
                this.logService.trace('window#ctor: using window state', state);
                const options = instantiationService.invokeFunction(windows_1.defaultBrowserWindowOptions, this.windowState, {
                    preload: network_1.FileAccess.asFileUri('vs/base/parts/sandbox/electron-sandbox/preload.js').fsPath,
                    additionalArguments: [`--vscode-window-config=${this.configObjectUrl.resource.toString()}`],
                    v8CacheOptions: this.environmentMainService.useCodeCache ? 'bypassHeatCheck' : 'none',
                });
                // Create the browser window
                (0, performance_1.mark)('code/willCreateCodeBrowserWindow');
                this._win = new electron_1.BrowserWindow(options);
                (0, performance_1.mark)('code/didCreateCodeBrowserWindow');
                this._id = this._win.id;
                this.setWin(this._win);
                // Apply some state after window creation
                this.applyState(this.windowState, hasMultipleDisplays);
                this._lastFocusTime = Date.now(); // since we show directly, we need to set the last focus time too
            }
            //#endregion
            // respect configured menu bar visibility
            this.onConfigurationUpdated();
            // macOS: touch bar support
            this.createTouchBar();
            // Eventing
            this.registerListeners();
        }
        setReady() {
            this.logService.trace(`window#load: window reported ready (id: ${this._id})`);
            this.readyState = 2 /* ReadyState.READY */;
            // inform all waiting promises that we are ready now
            while (this.whenReadyCallbacks.length) {
                this.whenReadyCallbacks.pop()(this);
            }
            // Events
            this._onDidSignalReady.fire();
        }
        ready() {
            return new Promise(resolve => {
                if (this.isReady) {
                    return resolve(this);
                }
                // otherwise keep and call later when we are ready
                this.whenReadyCallbacks.push(resolve);
            });
        }
        get isReady() {
            return this.readyState === 2 /* ReadyState.READY */;
        }
        get whenClosedOrLoaded() {
            return new Promise(resolve => {
                function handle() {
                    closeListener.dispose();
                    loadListener.dispose();
                    resolve();
                }
                const closeListener = this.onDidClose(() => handle());
                const loadListener = this.onWillLoad(() => handle());
            });
        }
        registerListeners() {
            // Window error conditions to handle
            this._register(event_1.Event.fromNodeEventEmitter(this._win, 'unresponsive')(() => this.onWindowError(1 /* WindowError.UNRESPONSIVE */)));
            this._register(event_1.Event.fromNodeEventEmitter(this._win.webContents, 'render-process-gone', (event, details) => details)(details => this.onWindowError(2 /* WindowError.PROCESS_GONE */, { ...details })));
            this._register(event_1.Event.fromNodeEventEmitter(this._win.webContents, 'did-fail-load', (event, exitCode, reason) => ({ exitCode, reason }))(({ exitCode, reason }) => this.onWindowError(3 /* WindowError.LOAD */, { reason, exitCode })));
            // Prevent windows/iframes from blocking the unload
            // through DOM events. We have our own logic for
            // unloading a window that should not be confused
            // with the DOM way.
            // (https://github.com/microsoft/vscode/issues/122736)
            this._register(event_1.Event.fromNodeEventEmitter(this._win.webContents, 'will-prevent-unload')(event => event.preventDefault()));
            // Remember that we loaded
            this._register(event_1.Event.fromNodeEventEmitter(this._win.webContents, 'did-finish-load')(() => {
                // Associate properties from the load request if provided
                if (this.pendingLoadConfig) {
                    this._config = this.pendingLoadConfig;
                    this.pendingLoadConfig = undefined;
                }
            }));
            // Window (Un)Maximize
            this._register(this.onDidMaximize(() => {
                if (this._config) {
                    this._config.maximized = true;
                }
            }));
            this._register(this.onDidUnmaximize(() => {
                if (this._config) {
                    this._config.maximized = false;
                }
            }));
            // Window Fullscreen
            this._register(this.onDidEnterFullScreen(() => {
                this.sendWhenReady('vscode:enterFullScreen', cancellation_1.CancellationToken.None);
            }));
            this._register(this.onDidLeaveFullScreen(() => {
                this.sendWhenReady('vscode:leaveFullScreen', cancellation_1.CancellationToken.None);
            }));
            // Handle configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
            // Handle Workspace events
            this._register(this.workspacesManagementMainService.onDidDeleteUntitledWorkspace(e => this.onDidDeleteUntitledWorkspace(e)));
            // Inject headers when requests are incoming
            const urls = ['https://marketplace.visualstudio.com/*', 'https://*.vsassets.io/*'];
            this._win.webContents.session.webRequest.onBeforeSendHeaders({ urls }, async (details, cb) => {
                const headers = await this.getMarketplaceHeaders();
                cb({ cancel: false, requestHeaders: Object.assign(details.requestHeaders, headers) });
            });
        }
        getMarketplaceHeaders() {
            if (!this.marketplaceHeadersPromise) {
                this.marketplaceHeadersPromise = (0, marketplace_1.resolveMarketplaceHeaders)(this.productService.version, this.productService, this.environmentMainService, this.configurationService, this.fileService, this.applicationStorageMainService, this.telemetryService);
            }
            return this.marketplaceHeadersPromise;
        }
        async onWindowError(type, details) {
            switch (type) {
                case 2 /* WindowError.PROCESS_GONE */:
                    this.logService.error(`CodeWindow: renderer process gone (reason: ${details?.reason || '<unknown>'}, code: ${details?.exitCode || '<unknown>'})`);
                    break;
                case 1 /* WindowError.UNRESPONSIVE */:
                    this.logService.error('CodeWindow: detected unresponsive');
                    break;
                case 3 /* WindowError.LOAD */:
                    this.logService.error(`CodeWindow: failed to load (reason: ${details?.reason || '<unknown>'}, code: ${details?.exitCode || '<unknown>'})`);
                    break;
            }
            this.telemetryService.publicLog2('windowerror', {
                type,
                reason: details?.reason,
                code: details?.exitCode
            });
            // Inform User if non-recoverable
            switch (type) {
                case 1 /* WindowError.UNRESPONSIVE */:
                case 2 /* WindowError.PROCESS_GONE */:
                    // If we run extension tests from CLI, we want to signal
                    // back this state to the test runner by exiting with a
                    // non-zero exit code.
                    if (this.isExtensionDevelopmentTestFromCli) {
                        this.lifecycleMainService.kill(1);
                        return;
                    }
                    // If we run smoke tests, want to proceed with an orderly
                    // shutdown as much as possible by destroying the window
                    // and then calling the normal `quit` routine.
                    if (this.environmentMainService.args['enable-smoke-test-driver']) {
                        await this.destroyWindow(false, false);
                        this.lifecycleMainService.quit(); // still allow for an orderly shutdown
                        return;
                    }
                    // Unresponsive
                    if (type === 1 /* WindowError.UNRESPONSIVE */) {
                        if (this.isExtensionDevelopmentHost || this.isExtensionTestHost || (this._win && this._win.webContents && this._win.webContents.isDevToolsOpened())) {
                            // TODO@electron Workaround for https://github.com/microsoft/vscode/issues/56994
                            // In certain cases the window can report unresponsiveness because a breakpoint was hit
                            // and the process is stopped executing. The most typical cases are:
                            // - devtools are opened and debugging happens
                            // - window is an extensions development host that is being debugged
                            // - window is an extension test development host that is being debugged
                            return;
                        }
                        // Show Dialog
                        const { response, checkboxChecked } = await this.dialogMainService.showMessageBox({
                            type: 'warning',
                            buttons: [
                                (0, nls_1.localize)({ key: 'reopen', comment: ['&& denotes a mnemonic'] }, "&&Reopen"),
                                (0, nls_1.localize)({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close"),
                                (0, nls_1.localize)({ key: 'wait', comment: ['&& denotes a mnemonic'] }, "&&Keep Waiting")
                            ],
                            message: (0, nls_1.localize)('appStalled', "The window is not responding"),
                            detail: (0, nls_1.localize)('appStalledDetail', "You can reopen or close the window or keep waiting."),
                            checkboxLabel: this._config?.workspace ? (0, nls_1.localize)('doNotRestoreEditors', "Don't restore editors") : undefined
                        }, this._win);
                        // Handle choice
                        if (response !== 2 /* keep waiting */) {
                            const reopen = response === 0;
                            await this.destroyWindow(reopen, checkboxChecked);
                        }
                    }
                    // Process gone
                    else if (type === 2 /* WindowError.PROCESS_GONE */) {
                        let message;
                        if (!details) {
                            message = (0, nls_1.localize)('appGone', "The window terminated unexpectedly");
                        }
                        else {
                            message = (0, nls_1.localize)('appGoneDetails', "The window terminated unexpectedly (reason: '{0}', code: '{1}')", details.reason, details.exitCode ?? '<unknown>');
                        }
                        // Show Dialog
                        const { response, checkboxChecked } = await this.dialogMainService.showMessageBox({
                            type: 'warning',
                            buttons: [
                                this._config?.workspace ? (0, nls_1.localize)({ key: 'reopen', comment: ['&& denotes a mnemonic'] }, "&&Reopen") : (0, nls_1.localize)({ key: 'newWindow', comment: ['&& denotes a mnemonic'] }, "&&New Window"),
                                (0, nls_1.localize)({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close")
                            ],
                            message,
                            detail: this._config?.workspace ?
                                (0, nls_1.localize)('appGoneDetailWorkspace', "We are sorry for the inconvenience. You can reopen the window to continue where you left off.") :
                                (0, nls_1.localize)('appGoneDetailEmptyWindow', "We are sorry for the inconvenience. You can open a new empty window to start again."),
                            checkboxLabel: this._config?.workspace ? (0, nls_1.localize)('doNotRestoreEditors', "Don't restore editors") : undefined
                        }, this._win);
                        // Handle choice
                        const reopen = response === 0;
                        await this.destroyWindow(reopen, checkboxChecked);
                    }
                    break;
            }
        }
        async destroyWindow(reopen, skipRestoreEditors) {
            const workspace = this._config?.workspace;
            // check to discard editor state first
            if (skipRestoreEditors && workspace) {
                try {
                    const workspaceStorage = this.storageMainService.workspaceStorage(workspace);
                    await workspaceStorage.init();
                    workspaceStorage.delete('memento/workbench.parts.editor');
                    await workspaceStorage.close();
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            // 'close' event will not be fired on destroy(), so signal crash via explicit event
            this._onDidDestroy.fire();
            try {
                // ask the windows service to open a new fresh window if specified
                if (reopen && this._config) {
                    // We have to reconstruct a openable from the current workspace
                    let uriToOpen = undefined;
                    let forceEmpty = undefined;
                    if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                        uriToOpen = { folderUri: workspace.uri };
                    }
                    else if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                        uriToOpen = { workspaceUri: workspace.configPath };
                    }
                    else {
                        forceEmpty = true;
                    }
                    // Delegate to windows service
                    const window = (0, arrays_1.firstOrDefault)(await this.windowsMainService.open({
                        context: 5 /* OpenContext.API */,
                        userEnv: this._config.userEnv,
                        cli: {
                            ...this.environmentMainService.args,
                            _: [] // we pass in the workspace to open explicitly via `urisToOpen`
                        },
                        urisToOpen: uriToOpen ? [uriToOpen] : undefined,
                        forceEmpty,
                        forceNewWindow: true,
                        remoteAuthority: this.remoteAuthority
                    }));
                    window?.focus();
                }
            }
            finally {
                // make sure to destroy the window as its renderer process is gone. do this
                // after the code for reopening the window, to prevent the entire application
                // from quitting when the last window closes as a result.
                this._win?.destroy();
            }
        }
        onDidDeleteUntitledWorkspace(workspace) {
            // Make sure to update our workspace config if we detect that it
            // was deleted
            if (this._config?.workspace?.id === workspace.id) {
                this._config.workspace = undefined;
            }
        }
        onConfigurationUpdated(e) {
            // Menubar
            if (!e || e.affectsConfiguration('window.menuBarVisibility')) {
                const newMenuBarVisibility = this.getMenuBarVisibility();
                if (newMenuBarVisibility !== this.currentMenuBarVisibility) {
                    this.currentMenuBarVisibility = newMenuBarVisibility;
                    this.setMenuBarVisibility(newMenuBarVisibility);
                }
            }
            // Proxy
            if (!e || e.affectsConfiguration('http.proxy')) {
                let newHttpProxy = (this.configurationService.getValue('http.proxy') || '').trim()
                    || (process.env['https_proxy'] || process.env['HTTPS_PROXY'] || process.env['http_proxy'] || process.env['HTTP_PROXY'] || '').trim() // Not standardized.
                    || undefined;
                if (newHttpProxy?.endsWith('/')) {
                    newHttpProxy = newHttpProxy.substr(0, newHttpProxy.length - 1);
                }
                const newNoProxy = (process.env['no_proxy'] || process.env['NO_PROXY'] || '').trim() || undefined; // Not standardized.
                if ((newHttpProxy || '').indexOf('@') === -1 && (newHttpProxy !== this.currentHttpProxy || newNoProxy !== this.currentNoProxy)) {
                    this.currentHttpProxy = newHttpProxy;
                    this.currentNoProxy = newNoProxy;
                    const proxyRules = newHttpProxy || '';
                    const proxyBypassRules = newNoProxy ? `${newNoProxy},<local>` : '<local>';
                    this.logService.trace(`Setting proxy to '${proxyRules}', bypassing '${proxyBypassRules}'`);
                    this._win.webContents.session.setProxy({ proxyRules, proxyBypassRules, pacScript: '' });
                    if (typeof electron_1.app.setProxy === 'function') {
                        electron_1.app.setProxy({ proxyRules, proxyBypassRules, pacScript: '' });
                    }
                }
            }
        }
        addTabbedWindow(window) {
            if (platform_1.isMacintosh && window.win) {
                this._win.addTabbedWindow(window.win);
            }
        }
        load(configuration, options = Object.create(null)) {
            this.logService.trace(`window#load: attempt to load window (id: ${this._id})`);
            // Clear Document Edited if needed
            if (this.isDocumentEdited()) {
                if (!options.isReload || !this.backupMainService.isHotExitEnabled()) {
                    this.setDocumentEdited(false);
                }
            }
            // Clear Title and Filename if needed
            if (!options.isReload) {
                if (this.getRepresentedFilename()) {
                    this.setRepresentedFilename('');
                }
                this._win.setTitle(this.productService.nameLong);
            }
            // Update configuration values based on our window context
            // and set it into the config object URL for usage.
            this.updateConfiguration(configuration, options);
            // If this is the first time the window is loaded, we associate the paths
            // directly with the window because we assume the loading will just work
            if (this.readyState === 0 /* ReadyState.NONE */) {
                this._config = configuration;
            }
            // Otherwise, the window is currently showing a folder and if there is an
            // unload handler preventing the load, we cannot just associate the paths
            // because the loading might be vetoed. Instead we associate it later when
            // the window load event has fired.
            else {
                this.pendingLoadConfig = configuration;
            }
            // Indicate we are navigting now
            this.readyState = 1 /* ReadyState.NAVIGATING */;
            // Load URL
            this._win.loadURL(network_1.FileAccess.asBrowserUri(`vs/code/electron-sandbox/workbench/workbench${this.environmentMainService.isBuilt ? '' : '-dev'}.html`).toString(true));
            // Remember that we did load
            const wasLoaded = this.wasLoaded;
            this.wasLoaded = true;
            // Make window visible if it did not open in N seconds because this indicates an error
            // Only do this when running out of sources and not when running tests
            if (!this.environmentMainService.isBuilt && !this.environmentMainService.extensionTestsLocationURI) {
                this._register(new async_1.RunOnceScheduler(() => {
                    if (this._win && !this._win.isVisible() && !this._win.isMinimized()) {
                        this._win.show();
                        this.focus({ force: true });
                        this._win.webContents.openDevTools();
                    }
                }, 10000)).schedule();
            }
            // Event
            this._onWillLoad.fire({ workspace: configuration.workspace, reason: options.isReload ? 3 /* LoadReason.RELOAD */ : wasLoaded ? 2 /* LoadReason.LOAD */ : 1 /* LoadReason.INITIAL */ });
        }
        updateConfiguration(configuration, options) {
            // If this window was loaded before from the command line
            // (as indicated by VSCODE_CLI environment), make sure to
            // preserve that user environment in subsequent loads,
            // unless the new configuration context was also a CLI
            // (for https://github.com/microsoft/vscode/issues/108571)
            // Also, preserve the environment if we're loading from an
            // extension development host that had its environment set
            // (for https://github.com/microsoft/vscode/issues/123508)
            const currentUserEnv = (this._config ?? this.pendingLoadConfig)?.userEnv;
            if (currentUserEnv) {
                const shouldPreserveLaunchCliEnvironment = (0, argvHelper_1.isLaunchedFromCli)(currentUserEnv) && !(0, argvHelper_1.isLaunchedFromCli)(configuration.userEnv);
                const shouldPreserveDebugEnvironmnet = this.isExtensionDevelopmentHost;
                if (shouldPreserveLaunchCliEnvironment || shouldPreserveDebugEnvironmnet) {
                    configuration.userEnv = { ...currentUserEnv, ...configuration.userEnv }; // still allow to override certain environment as passed in
                }
            }
            // If named pipe was instantiated for the crashpad_handler process, reuse the same
            // pipe for new app instances connecting to the original app instance.
            // Ref: https://github.com/microsoft/vscode/issues/115874
            if (process.env['CHROME_CRASHPAD_PIPE_NAME']) {
                Object.assign(configuration.userEnv, {
                    CHROME_CRASHPAD_PIPE_NAME: process.env['CHROME_CRASHPAD_PIPE_NAME']
                });
            }
            // Add disable-extensions to the config, but do not preserve it on currentConfig or
            // pendingLoadConfig so that it is applied only on this load
            if (options.disableExtensions !== undefined) {
                configuration['disable-extensions'] = options.disableExtensions;
            }
            // Update window related properties
            configuration.fullscreen = this.isFullScreen;
            configuration.maximized = this._win.isMaximized();
            configuration.partsSplash = this.themeMainService.getWindowSplash();
            configuration.zoomLevel = this.getZoomLevel();
            configuration.isCustomZoomLevel = typeof this.customZoomLevel === 'number';
            if (configuration.isCustomZoomLevel && configuration.partsSplash) {
                configuration.partsSplash.zoomLevel = configuration.zoomLevel;
            }
            // Update with latest perf marks
            (0, performance_1.mark)('code/willOpenNewWindow');
            configuration.perfMarks = (0, performance_1.getMarks)();
            // Update in config object URL for usage in renderer
            this.configObjectUrl.update(configuration);
        }
        async reload(cli) {
            // Copy our current config for reuse
            const configuration = Object.assign({}, this._config);
            // Validate workspace
            configuration.workspace = await this.validateWorkspaceBeforeReload(configuration);
            // Delete some properties we do not want during reload
            delete configuration.filesToOpenOrCreate;
            delete configuration.filesToDiff;
            delete configuration.filesToMerge;
            delete configuration.filesToWait;
            // Some configuration things get inherited if the window is being reloaded and we are
            // in extension development mode. These options are all development related.
            if (this.isExtensionDevelopmentHost && cli) {
                configuration.verbose = cli.verbose;
                configuration.debugId = cli.debugId;
                configuration.extensionEnvironment = cli.extensionEnvironment;
                configuration['inspect-extensions'] = cli['inspect-extensions'];
                configuration['inspect-brk-extensions'] = cli['inspect-brk-extensions'];
                configuration['extensions-dir'] = cli['extensions-dir'];
            }
            configuration.accessibilitySupport = electron_1.app.isAccessibilitySupportEnabled();
            configuration.isInitialStartup = false; // since this is a reload
            configuration.policiesData = this.policyService.serialize(); // set policies data again
            configuration.continueOn = this.environmentMainService.continueOn;
            configuration.profiles = {
                all: this.userDataProfilesService.profiles,
                profile: this.profile || this.userDataProfilesService.defaultProfile,
                home: this.userDataProfilesService.profilesHome
            };
            configuration.logLevel = this.loggerMainService.getLogLevel();
            configuration.loggers = {
                window: this.loggerMainService.getRegisteredLoggers(this.id),
                global: this.loggerMainService.getRegisteredLoggers()
            };
            // Load config
            this.load(configuration, { isReload: true, disableExtensions: cli?.['disable-extensions'] });
        }
        async validateWorkspaceBeforeReload(configuration) {
            // Multi folder
            if ((0, workspace_1.isWorkspaceIdentifier)(configuration.workspace)) {
                const configPath = configuration.workspace.configPath;
                if (configPath.scheme === network_1.Schemas.file) {
                    const workspaceExists = await this.fileService.exists(configPath);
                    if (!workspaceExists) {
                        return undefined;
                    }
                }
            }
            // Single folder
            else if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(configuration.workspace)) {
                const uri = configuration.workspace.uri;
                if (uri.scheme === network_1.Schemas.file) {
                    const folderExists = await this.fileService.exists(uri);
                    if (!folderExists) {
                        return undefined;
                    }
                }
            }
            // Workspace is valid
            return configuration.workspace;
        }
        serializeWindowState() {
            if (!this._win) {
                return (0, window_2.defaultWindowState)();
            }
            // fullscreen gets special treatment
            if (this.isFullScreen) {
                let display;
                try {
                    display = electron_1.screen.getDisplayMatching(this.getBounds());
                }
                catch (error) {
                    // Electron has weird conditions under which it throws errors
                    // e.g. https://github.com/microsoft/vscode/issues/100334 when
                    // large numbers are passed in
                }
                const defaultState = (0, window_2.defaultWindowState)();
                return {
                    mode: 3 /* WindowMode.Fullscreen */,
                    display: display ? display.id : undefined,
                    // Still carry over window dimensions from previous sessions
                    // if we can compute it in fullscreen state.
                    // does not seem possible in all cases on Linux for example
                    // (https://github.com/microsoft/vscode/issues/58218) so we
                    // fallback to the defaults in that case.
                    width: this.windowState.width || defaultState.width,
                    height: this.windowState.height || defaultState.height,
                    x: this.windowState.x || 0,
                    y: this.windowState.y || 0,
                    zoomLevel: this.customZoomLevel
                };
            }
            const state = Object.create(null);
            let mode;
            // get window mode
            if (!platform_1.isMacintosh && this._win.isMaximized()) {
                mode = 0 /* WindowMode.Maximized */;
            }
            else {
                mode = 1 /* WindowMode.Normal */;
            }
            // we don't want to save minimized state, only maximized or normal
            if (mode === 0 /* WindowMode.Maximized */) {
                state.mode = 0 /* WindowMode.Maximized */;
            }
            else {
                state.mode = 1 /* WindowMode.Normal */;
            }
            // only consider non-minimized window states
            if (mode === 1 /* WindowMode.Normal */ || mode === 0 /* WindowMode.Maximized */) {
                let bounds;
                if (mode === 1 /* WindowMode.Normal */) {
                    bounds = this.getBounds();
                }
                else {
                    bounds = this._win.getNormalBounds(); // make sure to persist the normal bounds when maximized to be able to restore them
                }
                state.x = bounds.x;
                state.y = bounds.y;
                state.width = bounds.width;
                state.height = bounds.height;
            }
            state.zoomLevel = this.customZoomLevel;
            return state;
        }
        restoreWindowState(state) {
            (0, performance_1.mark)('code/willRestoreCodeWindowState');
            let hasMultipleDisplays = false;
            if (state) {
                // Window zoom
                this.customZoomLevel = state.zoomLevel;
                // Window dimensions
                try {
                    const displays = electron_1.screen.getAllDisplays();
                    hasMultipleDisplays = displays.length > 1;
                    state = windows_1.WindowStateValidator.validateWindowState(this.logService, state, displays);
                }
                catch (err) {
                    this.logService.warn(`Unexpected error validating window state: ${err}\n${err.stack}`); // somehow display API can be picky about the state to validate
                }
            }
            (0, performance_1.mark)('code/didRestoreCodeWindowState');
            return [state || (0, window_2.defaultWindowState)(), hasMultipleDisplays];
        }
        getBounds() {
            const [x, y] = this._win.getPosition();
            const [width, height] = this._win.getSize();
            return { x, y, width, height };
        }
        setFullScreen(fullscreen, fromRestore) {
            super.setFullScreen(fullscreen, fromRestore);
            // Events
            this.sendWhenReady(fullscreen ? 'vscode:enterFullScreen' : 'vscode:leaveFullScreen', cancellation_1.CancellationToken.None);
            // Respect configured menu bar visibility or default to toggle if not set
            if (this.currentMenuBarVisibility) {
                this.setMenuBarVisibility(this.currentMenuBarVisibility, false);
            }
        }
        getMenuBarVisibility() {
            let menuBarVisibility = (0, window_1.getMenuBarVisibility)(this.configurationService);
            if (['visible', 'toggle', 'hidden'].indexOf(menuBarVisibility) < 0) {
                menuBarVisibility = 'classic';
            }
            return menuBarVisibility;
        }
        setMenuBarVisibility(visibility, notify = true) {
            if (platform_1.isMacintosh) {
                return; // ignore for macOS platform
            }
            if (visibility === 'toggle') {
                if (notify) {
                    this.send('vscode:showInfoMessage', (0, nls_1.localize)('hiddenMenuBar', "You can still access the menu bar by pressing the Alt-key."));
                }
            }
            if (visibility === 'hidden') {
                // for some weird reason that I have no explanation for, the menu bar is not hiding when calling
                // this without timeout (see https://github.com/microsoft/vscode/issues/19777). there seems to be
                // a timing issue with us opening the first window and the menu bar getting created. somehow the
                // fact that we want to hide the menu without being able to bring it back via Alt key makes Electron
                // still show the menu. Unable to reproduce from a simple Hello World application though...
                setTimeout(() => {
                    this.doSetMenuBarVisibility(visibility);
                });
            }
            else {
                this.doSetMenuBarVisibility(visibility);
            }
        }
        doSetMenuBarVisibility(visibility) {
            const isFullscreen = this.isFullScreen;
            switch (visibility) {
                case ('classic'):
                    this._win.setMenuBarVisibility(!isFullscreen);
                    this._win.autoHideMenuBar = isFullscreen;
                    break;
                case ('visible'):
                    this._win.setMenuBarVisibility(true);
                    this._win.autoHideMenuBar = false;
                    break;
                case ('toggle'):
                    this._win.setMenuBarVisibility(false);
                    this._win.autoHideMenuBar = true;
                    break;
                case ('hidden'):
                    this._win.setMenuBarVisibility(false);
                    this._win.autoHideMenuBar = false;
                    break;
            }
        }
        notifyZoomLevel(zoomLevel) {
            this.customZoomLevel = zoomLevel;
        }
        getZoomLevel() {
            if (typeof this.customZoomLevel === 'number') {
                return this.customZoomLevel;
            }
            const windowSettings = this.configurationService.getValue('window');
            return windowSettings?.zoomLevel;
        }
        close() {
            this._win?.close();
        }
        sendWhenReady(channel, token, ...args) {
            if (this.isReady) {
                this.send(channel, ...args);
            }
            else {
                this.ready().then(() => {
                    if (!token.isCancellationRequested) {
                        this.send(channel, ...args);
                    }
                });
            }
        }
        send(channel, ...args) {
            if (this._win) {
                if (this._win.isDestroyed() || this._win.webContents.isDestroyed()) {
                    this.logService.warn(`Sending IPC message to channel '${channel}' for window that is destroyed`);
                    return;
                }
                try {
                    this._win.webContents.send(channel, ...args);
                }
                catch (error) {
                    this.logService.warn(`Error sending IPC message to channel '${channel}' of window ${this._id}: ${(0, errorMessage_1.toErrorMessage)(error)}`);
                }
            }
        }
        updateTouchBar(groups) {
            if (!platform_1.isMacintosh) {
                return; // only supported on macOS
            }
            // Update segments for all groups. Setting the segments property
            // of the group directly prevents ugly flickering from happening
            this.touchBarGroups.forEach((touchBarGroup, index) => {
                const commands = groups[index];
                touchBarGroup.segments = this.createTouchBarGroupSegments(commands);
            });
        }
        createTouchBar() {
            if (!platform_1.isMacintosh) {
                return; // only supported on macOS
            }
            // To avoid flickering, we try to reuse the touch bar group
            // as much as possible by creating a large number of groups
            // for reusing later.
            for (let i = 0; i < 10; i++) {
                const groupTouchBar = this.createTouchBarGroup();
                this.touchBarGroups.push(groupTouchBar);
            }
            this._win.setTouchBar(new electron_1.TouchBar({ items: this.touchBarGroups }));
        }
        createTouchBarGroup(items = []) {
            // Group Segments
            const segments = this.createTouchBarGroupSegments(items);
            // Group Control
            const control = new electron_1.TouchBar.TouchBarSegmentedControl({
                segments,
                mode: 'buttons',
                segmentStyle: 'automatic',
                change: (selectedIndex) => {
                    this.sendWhenReady('vscode:runAction', cancellation_1.CancellationToken.None, { id: control.segments[selectedIndex].id, from: 'touchbar' });
                }
            });
            return control;
        }
        createTouchBarGroupSegments(items = []) {
            const segments = items.map(item => {
                let icon;
                if (item.icon && !themables_1.ThemeIcon.isThemeIcon(item.icon) && item.icon?.dark?.scheme === network_1.Schemas.file) {
                    icon = electron_1.nativeImage.createFromPath(uri_1.URI.revive(item.icon.dark).fsPath);
                    if (icon.isEmpty()) {
                        icon = undefined;
                    }
                }
                let title;
                if (typeof item.title === 'string') {
                    title = item.title;
                }
                else {
                    title = item.title.value;
                }
                return {
                    id: item.id,
                    label: !icon ? title : undefined,
                    icon
                };
            });
            return segments;
        }
        matches(webContents) {
            return this._win?.webContents.id === webContents.id;
        }
        dispose() {
            super.dispose();
            // Deregister the loggers for this window
            this.loggerMainService.deregisterLoggers(this.id);
        }
    };
    exports.CodeWindow = CodeWindow;
    exports.CodeWindow = CodeWindow = __decorate([
        __param(1, log_1.ILogService),
        __param(2, loggerService_1.ILoggerMainService),
        __param(3, environmentMainService_1.IEnvironmentMainService),
        __param(4, policy_1.IPolicyService),
        __param(5, userDataProfile_1.IUserDataProfilesMainService),
        __param(6, files_1.IFileService),
        __param(7, storageMainService_1.IApplicationStorageMainService),
        __param(8, storageMainService_1.IStorageMainService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, themeMainService_1.IThemeMainService),
        __param(11, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(12, backup_1.IBackupMainService),
        __param(13, telemetry_1.ITelemetryService),
        __param(14, dialogMainService_1.IDialogMainService),
        __param(15, lifecycleMainService_1.ILifecycleMainService),
        __param(16, productService_1.IProductService),
        __param(17, protocol_1.IProtocolMainService),
        __param(18, windows_1.IWindowsMainService),
        __param(19, state_1.IStateService),
        __param(20, instantiation_1.IInstantiationService)
    ], CodeWindow);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93SW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3dpbmRvd3MvZWxlY3Ryb24tbWFpbi93aW5kb3dJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJEaEcsSUFBVyxVQW9CVjtJQXBCRCxXQUFXLFVBQVU7UUFFcEI7Ozs7V0FJRztRQUNILDJDQUFJLENBQUE7UUFFSjs7O1dBR0c7UUFDSCx1REFBVSxDQUFBO1FBRVY7OztXQUdHO1FBQ0gsNkNBQUssQ0FBQTtJQUNOLENBQUMsRUFwQlUsVUFBVSxLQUFWLFVBQVUsUUFvQnBCO0lBRUQsTUFBc0IsVUFBVyxTQUFRLHNCQUFVO1FBMkJsRCxJQUFJLGFBQWEsS0FBYSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBRzNELElBQUksR0FBRyxLQUFLLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDckIsTUFBTSxDQUFDLEdBQWtCO1lBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBRWhCLGdCQUFnQjtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsb0JB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