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
define(["require", "exports", "electron", "vs/base/node/unc", "vs/base/parts/ipc/electron-main/ipcMain", "os", "vs/base/common/buffer", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/extpath", "vs/base/common/event", "vs/base/common/json", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/parts/contextmenu/electron-main/contextmenu", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/electron-main/ipc.electron", "vs/base/parts/ipc/electron-main/ipc.mp", "vs/code/electron-main/auth", "vs/nls", "vs/platform/backup/electron-main/backup", "vs/platform/backup/electron-main/backupMainService", "vs/platform/configuration/common/configuration", "vs/platform/debug/electron-main/extensionHostDebugIpc", "vs/platform/diagnostics/common/diagnostics", "vs/platform/diagnostics/electron-main/diagnosticsMainService", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/encryption/common/encryptionService", "vs/platform/encryption/electron-main/encryptionMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/environment/node/argvHelper", "vs/platform/shell/node/shellEnv", "vs/platform/extensions/common/extensionHostStarter", "vs/platform/extensions/electron-main/extensionHostStarter", "vs/platform/externalTerminal/electron-main/externalTerminal", "vs/platform/externalTerminal/node/externalTerminalService", "vs/platform/files/common/diskFileSystemProviderClient", "vs/platform/files/common/files", "vs/platform/files/electron-main/diskFileSystemProviderServer", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/issue/common/issue", "vs/platform/issue/electron-main/issueMainService", "vs/platform/keyboardLayout/electron-main/keyboardLayoutMainService", "vs/platform/launch/electron-main/launchMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/menubar/electron-main/menubarMainService", "vs/platform/native/electron-main/nativeHostMainService", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteHosts", "vs/platform/sharedProcess/electron-main/sharedProcess", "vs/platform/sign/common/sign", "vs/platform/state/node/state", "vs/platform/storage/electron-main/storageIpc", "vs/platform/storage/electron-main/storageMainService", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryIpc", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/update/common/update", "vs/platform/update/common/updateIpc", "vs/platform/update/electron-main/updateService.darwin", "vs/platform/update/electron-main/updateService.linux", "vs/platform/update/electron-main/updateService.snap", "vs/platform/update/electron-main/updateService.win32", "vs/platform/url/common/url", "vs/platform/url/common/urlIpc", "vs/platform/url/common/urlService", "vs/platform/url/electron-main/electronUrlListener", "vs/platform/webview/common/webviewManagerService", "vs/platform/webview/electron-main/webviewMainService", "vs/platform/window/common/window", "vs/platform/windows/electron-main/windows", "vs/platform/windows/electron-main/windowsMainService", "vs/platform/windows/node/windowTracker", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/platform/workspaces/electron-main/workspacesHistoryMainService", "vs/platform/workspaces/electron-main/workspacesMainService", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/platform/policy/common/policy", "vs/platform/policy/common/policyIpc", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/request/common/requestIpc", "vs/platform/request/common/request", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/extensionManagement/node/extensionsScannerService", "vs/platform/userDataProfile/electron-main/userDataProfilesHandler", "vs/platform/userDataProfile/electron-main/userDataProfileStorageIpc", "vs/base/common/async", "vs/platform/telemetry/electron-main/telemetryUtils", "vs/platform/extensionManagement/node/extensionsProfileScannerService", "vs/platform/log/electron-main/logIpc", "vs/platform/log/electron-main/loggerService", "vs/platform/utilityProcess/electron-main/utilityProcessWorkerMainService", "vs/platform/utilityProcess/common/utilityProcessWorkerService", "vs/base/common/arrays", "vs/platform/terminal/common/terminal", "vs/platform/terminal/electron-main/electronPtyHostStarter", "vs/platform/terminal/node/ptyHostService", "vs/platform/remote/common/electronRemoteResources", "vs/base/common/lazy", "vs/platform/auxiliaryWindow/electron-main/auxiliaryWindows", "vs/platform/auxiliaryWindow/electron-main/auxiliaryWindowsMainService", "vs/base/common/normalization"], function (require, exports, electron_1, unc_1, ipcMain_1, os_1, buffer_1, errorMessage_1, errors_1, extpath_1, event_1, json_1, labels_1, lifecycle_1, network_1, path_1, platform_1, types_1, uri_1, uuid_1, contextmenu_1, ipc_1, ipc_electron_1, ipc_mp_1, auth_1, nls_1, backup_1, backupMainService_1, configuration_1, extensionHostDebugIpc_1, diagnostics_1, diagnosticsMainService_1, dialogMainService_1, encryptionService_1, encryptionMainService_1, environmentMainService_1, argvHelper_1, shellEnv_1, extensionHostStarter_1, extensionHostStarter_2, externalTerminal_1, externalTerminalService_1, diskFileSystemProviderClient_1, files_1, diskFileSystemProviderServer_1, diskFileSystemProvider_1, descriptors_1, instantiation_1, serviceCollection_1, issue_1, issueMainService_1, keyboardLayoutMainService_1, launchMainService_1, lifecycleMainService_1, log_1, menubarMainService_1, nativeHostMainService_1, productService_1, remoteHosts_1, sharedProcess_1, sign_1, state_1, storageIpc_1, storageMainService_1, commonProperties_1, telemetry_1, telemetryIpc_1, telemetryService_1, telemetryUtils_1, update_1, updateIpc_1, updateService_darwin_1, updateService_linux_1, updateService_snap_1, updateService_win32_1, url_1, urlIpc_1, urlService_1, electronUrlListener_1, webviewManagerService_1, webviewMainService_1, window_1, windows_1, windowsMainService_1, windowTracker_1, workspace_1, workspaces_1, workspacesHistoryMainService_1, workspacesMainService_1, workspacesManagementMainService_1, policy_1, policyIpc_1, userDataProfile_1, requestIpc_1, request_1, extensionsProfileScannerService_1, extensionsScannerService_1, extensionsScannerService_2, userDataProfilesHandler_1, userDataProfileStorageIpc_1, async_1, telemetryUtils_2, extensionsProfileScannerService_2, logIpc_1, loggerService_1, utilityProcessWorkerMainService_1, utilityProcessWorkerService_1, arrays_1, terminal_1, electronPtyHostStarter_1, ptyHostService_1, electronRemoteResources_1, lazy_1, auxiliaryWindows_1, auxiliaryWindowsMainService_1, normalization_1) {
    "use strict";
    var CodeApplication_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeApplication = void 0;
    /**
     * The main VS Code application. There will only ever be one instance,
     * even if the user starts many instances (e.g. from the command line).
     */
    let CodeApplication = class CodeApplication extends lifecycle_1.Disposable {
        static { CodeApplication_1 = this; }
        static { this.SECURITY_PROTOCOL_HANDLING_CONFIRMATION_SETTING_KEY = {
            [network_1.Schemas.file]: 'security.promptForLocalFileProtocolHandling',
            [network_1.Schemas.vscodeRemote]: 'security.promptForRemoteFileProtocolHandling'
        }; }
        constructor(mainProcessNodeIpcServer, userEnv, mainInstantiationService, logService, loggerService, environmentMainService, lifecycleMainService, configurationService, stateService, fileService, productService, userDataProfilesMainService) {
            super();
            this.mainProcessNodeIpcServer = mainProcessNodeIpcServer;
            this.userEnv = userEnv;
            this.mainInstantiationService = mainInstantiationService;
            this.logService = logService;
            this.loggerService = loggerService;
            this.environmentMainService = environmentMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.configurationService = configurationService;
            this.stateService = stateService;
            this.fileService = fileService;
            this.productService = productService;
            this.userDataProfilesMainService = userDataProfilesMainService;
            this.configureSession();
            this.registerListeners();
        }
        configureSession() {
            //#region Security related measures (https://electronjs.org/docs/tutorial/security)
            //
            // !!! DO NOT CHANGE without consulting the documentation !!!
            //
            const isUrlFromWebview = (requestingUrl) => requestingUrl?.startsWith(`${network_1.Schemas.vscodeWebview}://`);
            const allowedPermissionsInWebview = new Set([
                'clipboard-read',
                'clipboard-sanitized-write',
            ]);
            electron_1.session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details) => {
                if (isUrlFromWebview(details.requestingUrl)) {
                    return callback(allowedPermissionsInWebview.has(permission));
                }
                return callback(false);
            });
            electron_1.session.defaultSession.setPermissionCheckHandler((_webContents, permission, _origin, details) => {
                if (isUrlFromWebview(details.requestingUrl)) {
                    return allowedPermissionsInWebview.has(permission);
                }
                return false;
            });
            //#endregion
            //#region Request filtering
            // Block all SVG requests from unsupported origins
            const supportedSvgSchemes = new Set([network_1.Schemas.file, network_1.Schemas.vscodeFileResource, network_1.Schemas.vscodeRemoteResource, network_1.Schemas.vscodeManagedRemoteResource, 'devtools']);
            // But allow them if they are made from inside an webview
            const isSafeFrame = (requestFrame) => {
                for (let frame = requestFrame; frame; frame = frame.parent) {
                    if (frame.url.startsWith(`${network_1.Schemas.vscodeWebview}://`)) {
                        return true;
                    }
                }
                return false;
            };
            const isSvgRequestFromSafeContext = (details) => {
                return details.resourceType === 'xhr' || isSafeFrame(details.frame);
            };
            const isAllowedVsCodeFileRequest = (details) => {
                const frame = details.frame;
                if (!frame || !this.windowsMainService) {
                    return false;
                }
                // Check to see if the request comes from one of the main windows (or shared process) and not from embedded content
                const windows = electron_1.BrowserWindow.getAllWindows();
                for (const window of windows) {
                    if (frame.processId === window.webContents.mainFrame.processId) {
                        return true;
                    }
                }
                return false;
            };
            const isAllowedWebviewRequest = (uri, details) => {
                if (uri.path !== '/index.html') {
                    return true; // Only restrict top level page of webviews: index.html
                }
                const frame = details.frame;
                if (!frame || !this.windowsMainService) {
                    return false;
                }
                // Check to see if the request comes from one of the main editor windows.
                for (const window of this.windowsMainService.getWindows()) {
                    if (window.win) {
                        if (frame.processId === window.win.webContents.mainFrame.processId) {
                            return true;
                        }
                    }
                }
                return false;
            };
            electron_1.session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
                const uri = uri_1.URI.parse(details.url);
                if (uri.scheme === network_1.Schemas.vscodeWebview) {
                    if (!isAllowedWebviewRequest(uri, details)) {
                        this.logService.error('Blocked vscode-webview request', details.url);
                        return callback({ cancel: true });
                    }
                }
                if (uri.scheme === network_1.Schemas.vscodeFileResource) {
                    if (!isAllowedVsCodeFileRequest(details)) {
                        this.logService.error('Blocked vscode-file request', details.url);
                        return callback({ cancel: true });
                    }
                }
                // Block most svgs
                if (uri.path.endsWith('.svg')) {
                    const isSafeResourceUrl = supportedSvgSchemes.has(uri.scheme);
                    if (!isSafeResourceUrl) {
                        return callback({ cancel: !isSvgRequestFromSafeContext(details) });
                    }
                }
                return callback({ cancel: false });
            });
            // Configure SVG header content type properly
            // https://github.com/microsoft/vscode/issues/97564
            electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
                const responseHeaders = details.responseHeaders;
                const contentTypes = (responseHeaders['content-type'] || responseHeaders['Content-Type']);
                if (contentTypes && Array.isArray(contentTypes)) {
                    const uri = uri_1.URI.parse(details.url);
                    if (uri.path.endsWith('.svg')) {
                        if (supportedSvgSchemes.has(uri.scheme)) {
                            responseHeaders['Content-Type'] = ['image/svg+xml'];
                            return callback({ cancel: false, responseHeaders });
                        }
                    }
                    // remote extension schemes have the following format
                    // http://127.0.0.1:<port>/vscode-remote-resource?path=
                    if (!uri.path.endsWith(network_1.Schemas.vscodeRemoteResource) && contentTypes.some(contentType => contentType.toLowerCase().includes('image/svg'))) {
                        return callback({ cancel: !isSvgRequestFromSafeContext(details) });
                    }
                }
                return callback({ cancel: false });
            });
            //#endregion
            //#region Allow CORS for the PRSS CDN
            // https://github.com/microsoft/vscode-remote-release/issues/9246
            electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
                if (details.url.startsWith('https://vscode.download.prss.microsoft.com/')) {
                    const responseHeaders = details.responseHeaders ?? Object.create(null);
                    if (responseHeaders['Access-Control-Allow-Origin'] === undefined) {
                        responseHeaders['Access-Control-Allow-Origin'] = ['*'];
                        return callback({ cancel: false, responseHeaders });
                    }
                }
                return callback({ cancel: false });
            });
            const defaultSession = electron_1.session.defaultSession;
            if (typeof defaultSession.setCodeCachePath === 'function' && this.environmentMainService.codeCachePath) {
                // Make sure to partition Chrome's code cache folder
                // in the same way as our code cache path to help
                // invalidate caches that we know are invalid
                // (https://github.com/microsoft/vscode/issues/120655)
                defaultSession.setCodeCachePath((0, path_1.join)(this.environmentMainService.codeCachePath, 'chrome'));
            }
            //#endregion
            //#region UNC Host Allowlist (Windows)
            if (platform_1.isWindows) {
                if (this.configurationService.getValue('security.restrictUNCAccess') === false) {
                    (0, unc_1.disableUNCAccessRestrictions)();
                }
                else {
                    (0, unc_1.addUNCHostToAllowlist)(this.configurationService.getValue('security.allowedUNCHosts'));
                }
            }
            //#endregion
        }
        registerListeners() {
            // We handle uncaught exceptions here to prevent electron from opening a dialog to the user
            (0, errors_1.setUnexpectedErrorHandler)(error => this.onUnexpectedError(error));
            process.on('uncaughtException', error => {
                if (!(0, errors_1.isSigPipeError)(error)) {
                    (0, errors_1.onUnexpectedError)(error);
                }
            });
            process.on('unhandledRejection', (reason) => (0, errors_1.onUnexpectedError)(reason));
            // Dispose on shutdown
            this.lifecycleMainService.onWillShutdown(() => this.dispose());
            // Contextmenu via IPC support
            (0, contextmenu_1.registerContextMenuListener)();
            // Accessibility change event
            electron_1.app.on('accessibility-support-changed', (event, accessibilitySupportEnabled) => {
                this.windowsMainService?.sendToAll('vscode:accessibilitySupportChanged', accessibilitySupportEnabled);
            });
            // macOS dock activate
            electron_1.app.on('activate', async (event, hasVisibleWindows) => {
                this.logService.trace('app#activate');
                // Mac only event: open new window when we get activated
                if (!hasVisibleWindows) {
                    await this.windowsMainService?.openEmptyWindow({ context: 1 /* OpenContext.DOCK */ });
                }
            });
            //#region Security related measures (https://electronjs.org/docs/tutorial/security)
            //
            // !!! DO NOT CHANGE without consulting the documentation !!!
            //
            electron_1.app.on('web-contents-created', (event, contents) => {
                // Auxiliary Window: delegate to `AuxiliaryWindow` class
                if (contents?.opener?.url.startsWith(`${network_1.Schemas.vscodeFileResource}://${network_1.VSCODE_AUTHORITY}/`)) {
                    this.logService.trace('[aux window]  app.on("web-contents-created"): Registering auxiliary window');
                    this.auxiliaryWindowsMainService?.registerWindow(contents);
                }
                // Block any in-page navigation
                contents.on('will-navigate', event => {
                    this.logService.error('webContents#will-navigate: Prevented webcontent navigation');
                    event.preventDefault();
                });
                // All Windows: only allow about:blank auxiliary windows to open
                // For all other URLs, delegate to the OS.
                contents.setWindowOpenHandler(details => {
                    // about:blank windows can open as window witho our default options
                    if (details.url === 'about:blank') {
                        this.logService.trace('[aux window] webContents#setWindowOpenHandler: Allowing auxiliary window to open on about:blank');
                        return {
                            action: 'allow',
                            overrideBrowserWindowOptions: this.auxiliaryWindowsMainService?.createWindow(details)
                        };
                    }
                    // Any other URL: delegate to OS
                    else {
                        this.logService.trace(`webContents#setWindowOpenHandler: Prevented opening window with URL ${details.url}}`);
                        this.nativeHostMainService?.openExternal(undefined, details.url);
                        return { action: 'deny' };
                    }
                });
            });
            //#endregion
            let macOpenFileURIs = [];
            let runningTimeout = undefined;
            electron_1.app.on('open-file', (event, path) => {
                path = (0, normalization_1.normalizeNFC)(path); // macOS only: normalize paths to NFC form
                this.logService.trace('app#open-file: ', path);
                event.preventDefault();
                // Keep in array because more might come!
                macOpenFileURIs.push((0, workspace_1.hasWorkspaceFileExtension)(path) ? { workspaceUri: uri_1.URI.file(path) } : { fileUri: uri_1.URI.file(path) });
                // Clear previous handler if any
                if (runningTimeout !== undefined) {
                    clearTimeout(runningTimeout);
                    runningTimeout = undefined;
                }
                // Handle paths delayed in case more are coming!
                runningTimeout = setTimeout(async () => {
                    await this.windowsMainService?.open({
                        context: 1 /* OpenContext.DOCK */ /* can also be opening from finder while app is running */,
                        cli: this.environmentMainService.args,
                        urisToOpen: macOpenFileURIs,
                        gotoLineMode: false,
                        preferNewWindow: true /* dropping on the dock or opening from finder prefers to open in a new window */
                    });
                    macOpenFileURIs = [];
                    runningTimeout = undefined;
                }, 100);
            });
            electron_1.app.on('new-window-for-tab', async () => {
                await this.windowsMainService?.openEmptyWindow({ context: 4 /* OpenContext.DESKTOP */ }); //macOS native tab "+" button
            });
            //#region Bootstrap IPC Handlers
            ipcMain_1.validatedIpcMain.handle('vscode:fetchShellEnv', event => {
                // Prefer to use the args and env from the target window
                // when resolving the shell env. It is possible that
                // a first window was opened from the UI but a second
                // from the CLI and that has implications for whether to
                // resolve the shell environment or not.
                //
                // Window can be undefined for e.g. the shared process
                // that is not part of our windows registry!
                const window = this.windowsMainService?.getWindowByWebContents(event.sender); // Note: this can be `undefined` for the shared process
                let args;
                let env;
                if (window?.config) {
                    args = window.config;
                    env = { ...process.env, ...window.config.userEnv };
                }
                else {
                    args = this.environmentMainService.args;
                    env = process.env;
                }
                // Resolve shell env
                return this.resolveShellEnvironment(args, env, false);
            });
            ipcMain_1.validatedIpcMain.handle('vscode:writeNlsFile', (event, path, data) => {
                const uri = this.validateNlsPath([path]);
                if (!uri || typeof data !== 'string') {
                    throw new Error('Invalid operation (vscode:writeNlsFile)');
                }
                return this.fileService.writeFile(uri, buffer_1.VSBuffer.fromString(data));
            });
            ipcMain_1.validatedIpcMain.handle('vscode:readNlsFile', async (event, ...paths) => {
                const uri = this.validateNlsPath(paths);
                if (!uri) {
                    throw new Error('Invalid operation (vscode:readNlsFile)');
                }
                return (await this.fileService.readFile(uri)).value.toString();
            });
            ipcMain_1.validatedIpcMain.on('vscode:toggleDevTools', event => event.sender.toggleDevTools());
            ipcMain_1.validatedIpcMain.on('vscode:openDevTools', event => event.sender.openDevTools());
            ipcMain_1.validatedIpcMain.on('vscode:reloadWindow', event => event.sender.reload());
            ipcMain_1.validatedIpcMain.handle('vscode:notifyZoomLevel', async (event, zoomLevel) => {
                const window = this.windowsMainService?.getWindowByWebContents(event.sender);
                if (window) {
                    window.notifyZoomLevel(zoomLevel);
                }
            });
            //#endregion
        }
        validateNlsPath(pathSegments) {
            let path = undefined;
            for (const pathSegment of pathSegments) {
                if (typeof pathSegment === 'string') {
                    if (typeof path !== 'string') {
                        path = pathSegment;
                    }
                    else {
                        path = (0, path_1.join)(path, pathSegment);
                    }
                }
            }
            if (typeof path !== 'string' || !(0, path_1.isAbsolute)(path) || !(0, extpath_1.isEqualOrParent)(path, this.environmentMainService.cachedLanguagesPath, !platform_1.isLinux)) {
                return undefined;
            }
            return uri_1.URI.file(path);
        }
        onUnexpectedError(error) {
            if (error) {
                // take only the message and stack property
                const friendlyError = {
                    message: `[uncaught exception in main]: ${error.message}`,
                    stack: error.stack
                };
                // handle on client side
                this.windowsMainService?.sendToFocused('vscode:reportError', JSON.stringify(friendlyError));
            }
            this.logService.error(`[uncaught exception in main]: ${error}`);
            if (error.stack) {
                this.logService.error(error.stack);
            }
        }
        async startup() {
            this.logService.debug('Starting VS Code');
            this.logService.debug(`from: ${this.environmentMainService.appRoot}`);
            this.logService.debug('args:', this.environmentMainService.args);
            // Make sure we associate the program with the app user model id
            // This will help Windows to associate the running program with
            // any shortcut that is pinned to the taskbar and prevent showing
            // two icons in the taskbar for the same app.
            const win32AppUserModelId = this.productService.win32AppUserModelId;
            if (platform_1.isWindows && win32AppUserModelId) {
                electron_1.app.setAppUserModelId(win32AppUserModelId);
            }
            // Fix native tabs on macOS 10.13
            // macOS enables a compatibility patch for any bundle ID beginning with
            // "com.microsoft.", which breaks native tabs for VS Code when using this
            // identifier (from the official build).
            // Explicitly opt out of the patch here before creating any windows.
            // See: https://github.com/microsoft/vscode/issues/35361#issuecomment-399794085
            try {
                if (platform_1.isMacintosh && this.configurationService.getValue('window.nativeTabs') === true && !electron_1.systemPreferences.getUserDefault('NSUseImprovedLayoutPass', 'boolean')) {
                    electron_1.systemPreferences.setUserDefault('NSUseImprovedLayoutPass', 'boolean', true);
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            // Main process server (electron IPC based)
            const mainProcessElectronServer = new ipc_electron_1.Server();
            this.lifecycleMainService.onWillShutdown(e => {
                if (e.reason === 2 /* ShutdownReason.KILL */) {
                    // When we go down abnormally, make sure to free up
                    // any IPC we accept from other windows to reduce
                    // the chance of doing work after we go down. Kill
                    // is special in that it does not orderly shutdown
                    // windows.
                    mainProcessElectronServer.dispose();
                }
            });
            // Resolve unique machine ID
            this.logService.trace('Resolving machine identifier...');
            const [machineId, sqmId] = await Promise.all([
                (0, telemetryUtils_2.resolveMachineId)(this.stateService, this.logService),
                (0, telemetryUtils_2.resolveSqmId)(this.stateService, this.logService)
            ]);
            this.logService.trace(`Resolved machine identifier: ${machineId}`);
            // Shared process
            const { sharedProcessReady, sharedProcessClient } = this.setupSharedProcess(machineId, sqmId);
            // Services
            const appInstantiationService = await this.initServices(machineId, sqmId, sharedProcessReady);
            // Auth Handler
            this._register(appInstantiationService.createInstance(auth_1.ProxyAuthHandler));
            // Transient profiles handler
            this._register(appInstantiationService.createInstance(userDataProfilesHandler_1.UserDataProfilesHandler));
            // Init Channels
            appInstantiationService.invokeFunction(accessor => this.initChannels(accessor, mainProcessElectronServer, sharedProcessClient));
            // Setup Protocol URL Handlers
            const initialProtocolUrls = await appInstantiationService.invokeFunction(accessor => this.setupProtocolUrlHandlers(accessor, mainProcessElectronServer));
            // Setup vscode-remote-resource protocol handler.
            this.setupManagedRemoteResourceUrlHandler(mainProcessElectronServer);
            // Signal phase: ready - before opening first window
            this.lifecycleMainService.phase = 2 /* LifecycleMainPhase.Ready */;
            // Open Windows
            await appInstantiationService.invokeFunction(accessor => this.openFirstWindow(accessor, initialProtocolUrls));
            // Signal phase: after window open
            this.lifecycleMainService.phase = 3 /* LifecycleMainPhase.AfterWindowOpen */;
            // Post Open Windows Tasks
            this.afterWindowOpen();
            // Set lifecycle phase to `Eventually` after a short delay and when idle (min 2.5sec, max 5sec)
            const eventuallyPhaseScheduler = this._register(new async_1.RunOnceScheduler(() => {
                this._register((0, async_1.runWhenGlobalIdle)(() => this.lifecycleMainService.phase = 4 /* LifecycleMainPhase.Eventually */, 2500));
            }, 2500));
            eventuallyPhaseScheduler.schedule();
        }
        async setupProtocolUrlHandlers(accessor, mainProcessElectronServer) {
            const windowsMainService = this.windowsMainService = accessor.get(windows_1.IWindowsMainService);
            const urlService = accessor.get(url_1.IURLService);
            const nativeHostMainService = this.nativeHostMainService = accessor.get(nativeHostMainService_1.INativeHostMainService);
            const dialogMainService = accessor.get(dialogMainService_1.IDialogMainService);
            // Install URL handlers that deal with protocl URLs either
            // from this process by opening windows and/or by forwarding
            // the URLs into a window process to be handled there.
            const app = this;
            urlService.registerHandler({
                async handleURL(uri, options) {
                    return app.handleProtocolUrl(windowsMainService, dialogMainService, urlService, uri, options);
                }
            });
            const activeWindowManager = this._register(new windowTracker_1.ActiveWindowManager({
                onDidOpenMainWindow: nativeHostMainService.onDidOpenMainWindow,
                onDidFocusMainWindow: nativeHostMainService.onDidFocusMainWindow,
                getActiveWindowId: () => nativeHostMainService.getActiveWindowId(-1)
            }));
            const activeWindowRouter = new ipc_1.StaticRouter(ctx => activeWindowManager.getActiveClientId().then(id => ctx === id));
            const urlHandlerRouter = new urlIpc_1.URLHandlerRouter(activeWindowRouter, this.logService);
            const urlHandlerChannel = mainProcessElectronServer.getChannel('urlHandler', urlHandlerRouter);
            urlService.registerHandler(new urlIpc_1.URLHandlerChannelClient(urlHandlerChannel));
            const initialProtocolUrls = await this.resolveInitialProtocolUrls(windowsMainService, dialogMainService);
            this._register(new electronUrlListener_1.ElectronURLListener(initialProtocolUrls?.urls, urlService, windowsMainService, this.environmentMainService, this.productService, this.logService));
            return initialProtocolUrls;
        }
        setupManagedRemoteResourceUrlHandler(mainProcessElectronServer) {
            const notFound = () => ({ statusCode: 404, data: 'Not found' });
            const remoteResourceChannel = new lazy_1.Lazy(() => mainProcessElectronServer.getChannel(electronRemoteResources_1.NODE_REMOTE_RESOURCE_CHANNEL_NAME, new electronRemoteResources_1.NodeRemoteResourceRouter()));
            electron_1.protocol.registerBufferProtocol(network_1.Schemas.vscodeManagedRemoteResource, (request, callback) => {
                const url = uri_1.URI.parse(request.url);
                if (!url.authority.startsWith('window:')) {
                    return callback(notFound());
                }
                remoteResourceChannel.value.call(electronRemoteResources_1.NODE_REMOTE_RESOURCE_IPC_METHOD_NAME, [url]).then(r => callback({ ...r, data: Buffer.from(r.body, 'base64') }), err => {
                    this.logService.warn('error dispatching remote resource call', err);
                    callback({ statusCode: 500, data: String(err) });
                });
            });
        }
        async resolveInitialProtocolUrls(windowsMainService, dialogMainService) {
            /**
             * Protocol URL handling on startup is complex, refer to
             * {@link IInitialProtocolUrls} for an explainer.
             */
            // Windows/Linux: protocol handler invokes CLI with --open-url
            const protocolUrlsFromCommandLine = this.environmentMainService.args['open-url'] ? this.environmentMainService.args._urls || [] : [];
            if (protocolUrlsFromCommandLine.length > 0) {
                this.logService.trace('app#resolveInitialProtocolUrls() protocol urls from command line:', protocolUrlsFromCommandLine);
            }
            // macOS: open-url events that were received before the app is ready
            const protocolUrlsFromEvent = (global.getOpenUrls() || []);
            if (protocolUrlsFromEvent.length > 0) {
                this.logService.trace(`app#resolveInitialProtocolUrls() protocol urls from macOS 'open-url' event:`, protocolUrlsFromEvent);
            }
            if (protocolUrlsFromCommandLine.length + protocolUrlsFromEvent.length === 0) {
                return undefined;
            }
            const protocolUrls = [
                ...protocolUrlsFromCommandLine,
                ...protocolUrlsFromEvent
            ].map(url => {
                try {
                    return { uri: uri_1.URI.parse(url), originalUrl: url };
                }
                catch {
                    this.logService.trace('app#resolveInitialProtocolUrls() protocol url failed to parse:', url);
                    return undefined;
                }
            });
            const openables = [];
            const urls = [];
            for (const protocolUrl of protocolUrls) {
                if (!protocolUrl) {
                    continue; // invalid
                }
                const windowOpenable = this.getWindowOpenableFromProtocolUrl(protocolUrl.uri);
                if (windowOpenable) {
                    if (await this.shouldBlockOpenable(windowOpenable, windowsMainService, dialogMainService)) {
                        this.logService.trace('app#resolveInitialProtocolUrls() protocol url was blocked:', protocolUrl.uri.toString(true));
                        continue; // blocked
                    }
                    else {
                        this.logService.trace('app#resolveInitialProtocolUrls() protocol url will be handled as window to open:', protocolUrl.uri.toString(true), windowOpenable);
                        openables.push(windowOpenable); // handled as window to open
                    }
                }
                else {
                    this.logService.trace('app#resolveInitialProtocolUrls() protocol url will be passed to active window for handling:', protocolUrl.uri.toString(true));
                    urls.push(protocolUrl); // handled within active window
                }
            }
            return { urls, openables };
        }
        async shouldBlockOpenable(openable, windowsMainService, dialogMainService) {
            let openableUri;
            let message;
            if ((0, window_1.isWorkspaceToOpen)(openable)) {
                openableUri = openable.workspaceUri;
                message = (0, nls_1.localize)('confirmOpenMessageWorkspace', "An external application wants to open '{0}' in {1}. Do you want to open this workspace file?", openableUri.scheme === network_1.Schemas.file ? (0, labels_1.getPathLabel)(openableUri, { os: platform_1.OS, tildify: this.environmentMainService }) : openableUri.toString(true), this.productService.nameShort);
            }
            else if ((0, window_1.isFolderToOpen)(openable)) {
                openableUri = openable.folderUri;
                message = (0, nls_1.localize)('confirmOpenMessageFolder', "An external application wants to open '{0}' in {1}. Do you want to open this folder?", openableUri.scheme === network_1.Schemas.file ? (0, labels_1.getPathLabel)(openableUri, { os: platform_1.OS, tildify: this.environmentMainService }) : openableUri.toString(true), this.productService.nameShort);
            }
            else {
                openableUri = openable.fileUri;
                message = (0, nls_1.localize)('confirmOpenMessageFileOrFolder', "An external application wants to open '{0}' in {1}. Do you want to open this file or folder?", openableUri.scheme === network_1.Schemas.file ? (0, labels_1.getPathLabel)(openableUri, { os: platform_1.OS, tildify: this.environmentMainService }) : openableUri.toString(true), this.productService.nameShort);
            }
            if (openableUri.scheme !== network_1.Schemas.file && openableUri.scheme !== network_1.Schemas.vscodeRemote) {
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                //
                // NOTE: we currently only ask for confirmation for `file` and `vscode-remote`
                // authorities here. There is an additional confirmation for `extension.id`
                // authorities from within the window.
                //
                // IF YOU ARE PLANNING ON ADDING ANOTHER AUTHORITY HERE, MAKE SURE TO ALSO
                // ADD IT TO THE CONFIRMATION CODE BELOW OR INSIDE THE WINDOW!
                //
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                return false;
            }
            const askForConfirmation = this.configurationService.getValue(CodeApplication_1.SECURITY_PROTOCOL_HANDLING_CONFIRMATION_SETTING_KEY[openableUri.scheme]);
            if (askForConfirmation === false) {
                return false; // not blocked via settings
            }
            const { response, checkboxChecked } = await dialogMainService.showMessageBox({
                type: 'warning',
                buttons: [
                    (0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, "&&Yes"),
                    (0, nls_1.localize)({ key: 'cancel', comment: ['&& denotes a mnemonic'] }, "&&No")
                ],
                message,
                detail: (0, nls_1.localize)('confirmOpenDetail', "If you did not initiate this request, it may represent an attempted attack on your system. Unless you took an explicit action to initiate this request, you should press 'No'"),
                checkboxLabel: openableUri.scheme === network_1.Schemas.file ? (0, nls_1.localize)('doNotAskAgainLocal', "Allow opening local paths without asking") : (0, nls_1.localize)('doNotAskAgainRemote', "Allow opening remote paths without asking"),
                cancelId: 1
            });
            if (response !== 0) {
                return true; // blocked by user choice
            }
            if (checkboxChecked) {
                // Due to https://github.com/microsoft/vscode/issues/195436, we can only
                // update settings from within a window. But we do not know if a window
                // is about to open or can already handle the request, so we have to send
                // to any current window and any newly opening window.
                const request = { channel: 'vscode:disablePromptForProtocolHandling', args: openableUri.scheme === network_1.Schemas.file ? 'local' : 'remote' };
                windowsMainService.sendToFocused(request.channel, request.args);
                windowsMainService.sendToOpeningWindow(request.channel, request.args);
            }
            return false; // not blocked by user choice
        }
        getWindowOpenableFromProtocolUrl(uri) {
            if (!uri.path) {
                return undefined;
            }
            // File path
            if (uri.authority === network_1.Schemas.file) {
                const fileUri = uri_1.URI.file(uri.fsPath);
                if ((0, workspace_1.hasWorkspaceFileExtension)(fileUri)) {
                    return { workspaceUri: fileUri };
                }
                return { fileUri };
            }
            // Remote path
            else if (uri.authority === network_1.Schemas.vscodeRemote) {
                // Example conversion:
                // From: vscode://vscode-remote/wsl+ubuntu/mnt/c/GitDevelopment/monaco
                //   To: vscode-remote://wsl+ubuntu/mnt/c/GitDevelopment/monaco
                const secondSlash = uri.path.indexOf(path_1.posix.sep, 1 /* skip over the leading slash */);
                if (secondSlash !== -1) {
                    const authority = uri.path.substring(1, secondSlash);
                    const path = uri.path.substring(secondSlash);
                    let query = uri.query;
                    const params = new URLSearchParams(uri.query);
                    if (params.get('windowId') === '_blank') {
                        // Make sure to unset any `windowId=_blank` here
                        // https://github.com/microsoft/vscode/issues/191902
                        params.delete('windowId');
                        query = params.toString();
                    }
                    const remoteUri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, authority, path, query, fragment: uri.fragment });
                    if ((0, workspace_1.hasWorkspaceFileExtension)(path)) {
                        return { workspaceUri: remoteUri };
                    }
                    if (/:[\d]+$/.test(path)) {
                        // path with :line:column syntax
                        return { fileUri: remoteUri };
                    }
                    return { folderUri: remoteUri };
                }
            }
            return undefined;
        }
        async handleProtocolUrl(windowsMainService, dialogMainService, urlService, uri, options) {
            this.logService.trace('app#handleProtocolUrl():', uri.toString(true), options);
            // Support 'workspace' URLs (https://github.com/microsoft/vscode/issues/124263)
            if (uri.scheme === this.productService.urlProtocol && uri.path === 'workspace') {
                uri = uri.with({
                    authority: 'file',
                    path: uri_1.URI.parse(uri.query).path,
                    query: ''
                });
            }
            let shouldOpenInNewWindow = false;
            // We should handle the URI in a new window if the URL contains `windowId=_blank`
            const params = new URLSearchParams(uri.query);
            if (params.get('windowId') === '_blank') {
                this.logService.trace(`app#handleProtocolUrl() found 'windowId=_blank' as parameter, setting shouldOpenInNewWindow=true:`, uri.toString(true));
                params.delete('windowId');
                uri = uri.with({ query: params.toString() });
                shouldOpenInNewWindow = true;
            }
            // or if no window is open (macOS only)
            else if (platform_1.isMacintosh && windowsMainService.getWindowCount() === 0) {
                this.logService.trace(`app#handleProtocolUrl() running on macOS with no window open, setting shouldOpenInNewWindow=true:`, uri.toString(true));
                shouldOpenInNewWindow = true;
            }
            // Pass along whether the application is being opened via a Continue On flow
            const continueOn = params.get('continueOn');
            if (continueOn !== null) {
                this.logService.trace(`app#handleProtocolUrl() found 'continueOn' as parameter:`, uri.toString(true));
                params.delete('continueOn');
                uri = uri.with({ query: params.toString() });
                this.environmentMainService.continueOn = continueOn ?? undefined;
            }
            // Check if the protocol URL is a window openable to open...
            const windowOpenableFromProtocolUrl = this.getWindowOpenableFromProtocolUrl(uri);
            if (windowOpenableFromProtocolUrl) {
                if (await this.shouldBlockOpenable(windowOpenableFromProtocolUrl, windowsMainService, dialogMainService)) {
                    this.logService.trace('app#handleProtocolUrl() protocol url was blocked:', uri.toString(true));
                    return true; // If openable should be blocked, behave as if it's handled
                }
                else {
                    this.logService.trace('app#handleProtocolUrl() opening protocol url as window:', windowOpenableFromProtocolUrl, uri.toString(true));
                    const window = (0, arrays_1.firstOrDefault)(await windowsMainService.open({
                        context: 5 /* OpenContext.API */,
                        cli: { ...this.environmentMainService.args },
                        urisToOpen: [windowOpenableFromProtocolUrl],
                        forceNewWindow: shouldOpenInNewWindow,
                        gotoLineMode: true
                        // remoteAuthority: will be determined based on windowOpenableFromProtocolUrl
                    }));
                    window?.focus(); // this should help ensuring that the right window gets focus when multiple are opened
                    return true;
                }
            }
            // ...or if we should open in a new window and then handle it within that window
            if (shouldOpenInNewWindow) {
                this.logService.trace('app#handleProtocolUrl() opening empty window and passing in protocol url:', uri.toString(true));
                const window = (0, arrays_1.firstOrDefault)(await windowsMainService.open({
                    context: 5 /* OpenContext.API */,
                    cli: { ...this.environmentMainService.args },
                    forceNewWindow: true,
                    forceEmpty: true,
                    gotoLineMode: true,
                    remoteAuthority: (0, remoteHosts_1.getRemoteAuthority)(uri)
                }));
                await window?.ready();
                return urlService.open(uri, options);
            }
            this.logService.trace('app#handleProtocolUrl(): not handled', uri.toString(true), options);
            return false;
        }
        setupSharedProcess(machineId, sqmId) {
            const sharedProcess = this._register(this.mainInstantiationService.createInstance(sharedProcess_1.SharedProcess, machineId, sqmId));
            const sharedProcessClient = (async () => {
                this.logService.trace('Main->SharedProcess#connect');
                const port = await sharedProcess.connect();
                this.logService.trace('Main->SharedProcess#connect: connection established');
                return new ipc_mp_1.Client(port, 'main');
            })();
            const sharedProcessReady = (async () => {
                await sharedProcess.whenReady();
                return sharedProcessClient;
            })();
            return { sharedProcessReady, sharedProcessClient };
        }
        async initServices(machineId, sqmId, sharedProcessReady) {
            const services = new serviceCollection_1.ServiceCollection();
            // Update
            switch (process.platform) {
                case 'win32':
                    services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_win32_1.Win32UpdateService));
                    break;
                case 'linux':
                    if (platform_1.isLinuxSnap) {
                        services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_snap_1.SnapUpdateService, [process.env['SNAP'], process.env['SNAP_REVISION']]));
                    }
                    else {
                        services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_linux_1.LinuxUpdateService));
                    }
                    break;
                case 'darwin':
                    services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_darwin_1.DarwinUpdateService));
                    break;
            }
            // Windows
            services.set(windows_1.IWindowsMainService, new descriptors_1.SyncDescriptor(windowsMainService_1.WindowsMainService, [machineId, sqmId, this.userEnv], false));
            services.set(auxiliaryWindows_1.IAuxiliaryWindowsMainService, new descriptors_1.SyncDescriptor(auxiliaryWindowsMainService_1.AuxiliaryWindowsMainService, undefined, false));
            // Dialogs
            const dialogMainService = new dialogMainService_1.DialogMainService(this.logService, this.productService);
            services.set(dialogMainService_1.IDialogMainService, dialogMainService);
            // Launch
            services.set(launchMainService_1.ILaunchMainService, new descriptors_1.SyncDescriptor(launchMainService_1.LaunchMainService, undefined, false /* proxied to other processes */));
            // Diagnostics
            services.set(diagnosticsMainService_1.IDiagnosticsMainService, new descriptors_1.SyncDescriptor(diagnosticsMainService_1.DiagnosticsMainService, undefined, false /* proxied to other processes */));
            services.set(diagnostics_1.IDiagnosticsService, ipc_1.ProxyChannel.toService((0, ipc_1.getDelayedChannel)(sharedProcessReady.then(client => client.getChannel('diagnostics')))));
            // Issues
            services.set(issue_1.IIssueMainService, new descriptors_1.SyncDescriptor(issueMainService_1.IssueMainService, [this.userEnv]));
            // Encryption
            services.set(encryptionService_1.IEncryptionMainService, new descriptors_1.SyncDescriptor(encryptionMainService_1.EncryptionMainService));
            // Keyboard Layout
            services.set(keyboardLayoutMainService_1.IKeyboardLayoutMainService, new descriptors_1.SyncDescriptor(keyboardLayoutMainService_1.KeyboardLayoutMainService));
            // Native Host
            services.set(nativeHostMainService_1.INativeHostMainService, new descriptors_1.SyncDescriptor(nativeHostMainService_1.NativeHostMainService, undefined, false /* proxied to other processes */));
            // Webview Manager
            services.set(webviewManagerService_1.IWebviewManagerService, new descriptors_1.SyncDescriptor(webviewMainService_1.WebviewMainService));
            // Menubar
            services.set(menubarMainService_1.IMenubarMainService, new descriptors_1.SyncDescriptor(menubarMainService_1.MenubarMainService));
            // Extension Host Starter
            services.set(extensionHostStarter_1.IExtensionHostStarter, new descriptors_1.SyncDescriptor(extensionHostStarter_2.ExtensionHostStarter));
            // Storage
            services.set(storageMainService_1.IStorageMainService, new descriptors_1.SyncDescriptor(storageMainService_1.StorageMainService));
            services.set(storageMainService_1.IApplicationStorageMainService, new descriptors_1.SyncDescriptor(storageMainService_1.ApplicationStorageMainService));
            // Terminal
            const ptyHostStarter = new electronPtyHostStarter_1.ElectronPtyHostStarter({
                graceTime: 60000 /* LocalReconnectConstants.GraceTime */,
                shortGraceTime: 6000 /* LocalReconnectConstants.ShortGraceTime */,
                scrollback: this.configurationService.getValue("terminal.integrated.persistentSessionScrollback" /* TerminalSettingId.PersistentSessionScrollback */) ?? 100
            }, this.configurationService, this.environmentMainService, this.lifecycleMainService, this.logService);
            const ptyHostService = new ptyHostService_1.PtyHostService(ptyHostStarter, this.configurationService, this.logService, this.loggerService);
            services.set(terminal_1.ILocalPtyService, ptyHostService);
            // External terminal
            if (platform_1.isWindows) {
                services.set(externalTerminal_1.IExternalTerminalMainService, new descriptors_1.SyncDescriptor(externalTerminalService_1.WindowsExternalTerminalService));
            }
            else if (platform_1.isMacintosh) {
                services.set(externalTerminal_1.IExternalTerminalMainService, new descriptors_1.SyncDescriptor(externalTerminalService_1.MacExternalTerminalService));
            }
            else if (platform_1.isLinux) {
                services.set(externalTerminal_1.IExternalTerminalMainService, new descriptors_1.SyncDescriptor(externalTerminalService_1.LinuxExternalTerminalService));
            }
            // Backups
            const backupMainService = new backupMainService_1.BackupMainService(this.environmentMainService, this.configurationService, this.logService, this.stateService);
            services.set(backup_1.IBackupMainService, backupMainService);
            // Workspaces
            const workspacesManagementMainService = new workspacesManagementMainService_1.WorkspacesManagementMainService(this.environmentMainService, this.logService, this.userDataProfilesMainService, backupMainService, dialogMainService);
            services.set(workspacesManagementMainService_1.IWorkspacesManagementMainService, workspacesManagementMainService);
            services.set(workspaces_1.IWorkspacesService, new descriptors_1.SyncDescriptor(workspacesMainService_1.WorkspacesMainService, undefined, false /* proxied to other processes */));
            services.set(workspacesHistoryMainService_1.IWorkspacesHistoryMainService, new descriptors_1.SyncDescriptor(workspacesHistoryMainService_1.WorkspacesHistoryMainService, undefined, false));
            // URL handling
            services.set(url_1.IURLService, new descriptors_1.SyncDescriptor(urlService_1.NativeURLService, undefined, false /* proxied to other processes */));
            // Telemetry
            if ((0, telemetryUtils_1.supportsTelemetry)(this.productService, this.environmentMainService)) {
                const isInternal = (0, telemetryUtils_1.isInternalTelemetry)(this.productService, this.configurationService);
                const channel = (0, ipc_1.getDelayedChannel)(sharedProcessReady.then(client => client.getChannel('telemetryAppender')));
                const appender = new telemetryIpc_1.TelemetryAppenderClient(channel);
                const commonProperties = (0, commonProperties_1.resolveCommonProperties)((0, os_1.release)(), (0, os_1.hostname)(), process.arch, this.productService.commit, this.productService.version, machineId, sqmId, isInternal);
                const piiPaths = (0, telemetryUtils_1.getPiiPathsFromEnvironment)(this.environmentMainService);
                const config = { appenders: [appender], commonProperties, piiPaths, sendErrorTelemetry: true };
                services.set(telemetry_1.ITelemetryService, new descriptors_1.SyncDescriptor(telemetryService_1.TelemetryService, [config], false));
            }
            else {
                services.set(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            }
            // Default Extensions Profile Init
            services.set(extensionsProfileScannerService_1.IExtensionsProfileScannerService, new descriptors_1.SyncDescriptor(extensionsProfileScannerService_2.ExtensionsProfileScannerService, undefined, true));
            services.set(extensionsScannerService_1.IExtensionsScannerService, new descriptors_1.SyncDescriptor(extensionsScannerService_2.ExtensionsScannerService, undefined, true));
            // Utility Process Worker
            services.set(utilityProcessWorkerMainService_1.IUtilityProcessWorkerMainService, new descriptors_1.SyncDescriptor(utilityProcessWorkerMainService_1.UtilityProcessWorkerMainService, undefined, true));
            // Init services that require it
            await async_1.Promises.settled([
                backupMainService.initialize(),
                workspacesManagementMainService.initialize()
            ]);
            return this.mainInstantiationService.createChild(services);
        }
        initChannels(accessor, mainProcessElectronServer, sharedProcessClient) {
            // Channels registered to node.js are exposed to second instances
            // launching because that is the only way the second instance
            // can talk to the first instance. Electron IPC does not work
            // across apps until `requestSingleInstance` APIs are adopted.
            const disposables = this._register(new lifecycle_1.DisposableStore());
            const launchChannel = ipc_1.ProxyChannel.fromService(accessor.get(launchMainService_1.ILaunchMainService), disposables, { disableMarshalling: true });
            this.mainProcessNodeIpcServer.registerChannel('launch', launchChannel);
            const diagnosticsChannel = ipc_1.ProxyChannel.fromService(accessor.get(diagnosticsMainService_1.IDiagnosticsMainService), disposables, { disableMarshalling: true });
            this.mainProcessNodeIpcServer.registerChannel('diagnostics', diagnosticsChannel);
            // Policies (main & shared process)
            const policyChannel = new policyIpc_1.PolicyChannel(accessor.get(policy_1.IPolicyService));
            mainProcessElectronServer.registerChannel('policy', policyChannel);
            sharedProcessClient.then(client => client.registerChannel('policy', policyChannel));
            // Local Files
            const diskFileSystemProvider = this.fileService.getProvider(network_1.Schemas.file);
            (0, types_1.assertType)(diskFileSystemProvider instanceof diskFileSystemProvider_1.DiskFileSystemProvider);
            const fileSystemProviderChannel = new diskFileSystemProviderServer_1.DiskFileSystemProviderChannel(diskFileSystemProvider, this.logService, this.environmentMainService);
            mainProcessElectronServer.registerChannel(diskFileSystemProviderClient_1.LOCAL_FILE_SYSTEM_CHANNEL_NAME, fileSystemProviderChannel);
            sharedProcessClient.then(client => client.registerChannel(diskFileSystemProviderClient_1.LOCAL_FILE_SYSTEM_CHANNEL_NAME, fileSystemProviderChannel));
            // User Data Profiles
            const userDataProfilesService = ipc_1.ProxyChannel.fromService(accessor.get(userDataProfile_1.IUserDataProfilesMainService), disposables);
            mainProcessElectronServer.registerChannel('userDataProfiles', userDataProfilesService);
            sharedProcessClient.then(client => client.registerChannel('userDataProfiles', userDataProfilesService));
            // Request
            const requestService = new requestIpc_1.RequestChannel(accessor.get(request_1.IRequestService));
            sharedProcessClient.then(client => client.registerChannel('request', requestService));
            // Update
            const updateChannel = new updateIpc_1.UpdateChannel(accessor.get(update_1.IUpdateService));
            mainProcessElectronServer.registerChannel('update', updateChannel);
            // Issues
            const issueChannel = ipc_1.ProxyChannel.fromService(accessor.get(issue_1.IIssueMainService), disposables);
            mainProcessElectronServer.registerChannel('issue', issueChannel);
            // Encryption
            const encryptionChannel = ipc_1.ProxyChannel.fromService(accessor.get(encryptionService_1.IEncryptionMainService), disposables);
            mainProcessElectronServer.registerChannel('encryption', encryptionChannel);
            // Signing
            const signChannel = ipc_1.ProxyChannel.fromService(accessor.get(sign_1.ISignService), disposables);
            mainProcessElectronServer.registerChannel('sign', signChannel);
            // Keyboard Layout
            const keyboardLayoutChannel = ipc_1.ProxyChannel.fromService(accessor.get(keyboardLayoutMainService_1.IKeyboardLayoutMainService), disposables);
            mainProcessElectronServer.registerChannel('keyboardLayout', keyboardLayoutChannel);
            // Native host (main & shared process)
            this.nativeHostMainService = accessor.get(nativeHostMainService_1.INativeHostMainService);
            const nativeHostChannel = ipc_1.ProxyChannel.fromService(this.nativeHostMainService, disposables);
            mainProcessElectronServer.registerChannel('nativeHost', nativeHostChannel);
            sharedProcessClient.then(client => client.registerChannel('nativeHost', nativeHostChannel));
            // Workspaces
            const workspacesChannel = ipc_1.ProxyChannel.fromService(accessor.get(workspaces_1.IWorkspacesService), disposables);
            mainProcessElectronServer.registerChannel('workspaces', workspacesChannel);
            // Menubar
            const menubarChannel = ipc_1.ProxyChannel.fromService(accessor.get(menubarMainService_1.IMenubarMainService), disposables);
            mainProcessElectronServer.registerChannel('menubar', menubarChannel);
            // URL handling
            const urlChannel = ipc_1.ProxyChannel.fromService(accessor.get(url_1.IURLService), disposables);
            mainProcessElectronServer.registerChannel('url', urlChannel);
            // Webview Manager
            const webviewChannel = ipc_1.ProxyChannel.fromService(accessor.get(webviewManagerService_1.IWebviewManagerService), disposables);
            mainProcessElectronServer.registerChannel('webview', webviewChannel);
            // Storage (main & shared process)
            const storageChannel = this._register(new storageIpc_1.StorageDatabaseChannel(this.logService, accessor.get(storageMainService_1.IStorageMainService)));
            mainProcessElectronServer.registerChannel('storage', storageChannel);
            sharedProcessClient.then(client => client.registerChannel('storage', storageChannel));
            // Profile Storage Changes Listener (shared process)
            const profileStorageListener = this._register(new userDataProfileStorageIpc_1.ProfileStorageChangesListenerChannel(accessor.get(storageMainService_1.IStorageMainService), accessor.get(userDataProfile_1.IUserDataProfilesMainService), this.logService));
            sharedProcessClient.then(client => client.registerChannel('profileStorageListener', profileStorageListener));
            // Terminal
            const ptyHostChannel = ipc_1.ProxyChannel.fromService(accessor.get(terminal_1.ILocalPtyService), disposables);
            mainProcessElectronServer.registerChannel(terminal_1.TerminalIpcChannels.LocalPty, ptyHostChannel);
            // External Terminal
            const externalTerminalChannel = ipc_1.ProxyChannel.fromService(accessor.get(externalTerminal_1.IExternalTerminalMainService), disposables);
            mainProcessElectronServer.registerChannel('externalTerminal', externalTerminalChannel);
            // Logger
            const loggerChannel = new logIpc_1.LoggerChannel(accessor.get(loggerService_1.ILoggerMainService));
            mainProcessElectronServer.registerChannel('logger', loggerChannel);
            sharedProcessClient.then(client => client.registerChannel('logger', loggerChannel));
            // Extension Host Debug Broadcasting
            const electronExtensionHostDebugBroadcastChannel = new extensionHostDebugIpc_1.ElectronExtensionHostDebugBroadcastChannel(accessor.get(windows_1.IWindowsMainService));
            mainProcessElectronServer.registerChannel('extensionhostdebugservice', electronExtensionHostDebugBroadcastChannel);
            // Extension Host Starter
            const extensionHostStarterChannel = ipc_1.ProxyChannel.fromService(accessor.get(extensionHostStarter_1.IExtensionHostStarter), disposables);
            mainProcessElectronServer.registerChannel(extensionHostStarter_1.ipcExtensionHostStarterChannelName, extensionHostStarterChannel);
            // Utility Process Worker
            const utilityProcessWorkerChannel = ipc_1.ProxyChannel.fromService(accessor.get(utilityProcessWorkerMainService_1.IUtilityProcessWorkerMainService), disposables);
            mainProcessElectronServer.registerChannel(utilityProcessWorkerService_1.ipcUtilityProcessWorkerChannelName, utilityProcessWorkerChannel);
        }
        async openFirstWindow(accessor, initialProtocolUrls) {
            const windowsMainService = this.windowsMainService = accessor.get(windows_1.IWindowsMainService);
            this.auxiliaryWindowsMainService = accessor.get(auxiliaryWindows_1.IAuxiliaryWindowsMainService);
            const context = (0, argvHelper_1.isLaunchedFromCli)(process.env) ? 0 /* OpenContext.CLI */ : 4 /* OpenContext.DESKTOP */;
            const args = this.environmentMainService.args;
            // First check for windows from protocol links to open
            if (initialProtocolUrls) {
                // Openables can open as windows directly
                if (initialProtocolUrls.openables.length > 0) {
                    return windowsMainService.open({
                        context,
                        cli: args,
                        urisToOpen: initialProtocolUrls.openables,
                        gotoLineMode: true,
                        initialStartup: true
                        // remoteAuthority: will be determined based on openables
                    });
                }
                // Protocol links with `windowId=_blank` on startup
                // should be handled in a special way:
                // We take the first one of these and open an empty
                // window for it. This ensures we are not restoring
                // all windows of the previous session.
                // If there are any more URLs like these, they will
                // be handled from the URL listeners installed later.
                if (initialProtocolUrls.urls.length > 0) {
                    for (const protocolUrl of initialProtocolUrls.urls) {
                        const params = new URLSearchParams(protocolUrl.uri.query);
                        if (params.get('windowId') === '_blank') {
                            // It is important here that we remove `windowId=_blank` from
                            // this URL because here we open an empty window for it.
                            params.delete('windowId');
                            protocolUrl.originalUrl = protocolUrl.uri.toString(true);
                            protocolUrl.uri = protocolUrl.uri.with({ query: params.toString() });
                            return windowsMainService.open({
                                context,
                                cli: args,
                                forceNewWindow: true,
                                forceEmpty: true,
                                gotoLineMode: true,
                                initialStartup: true
                                // remoteAuthority: will be determined based on openables
                            });
                        }
                    }
                }
            }
            const macOpenFiles = global.macOpenFiles;
            const hasCliArgs = args._.length;
            const hasFolderURIs = !!args['folder-uri'];
            const hasFileURIs = !!args['file-uri'];
            const noRecentEntry = args['skip-add-to-recently-opened'] === true;
            const waitMarkerFileURI = args.wait && args.waitMarkerFilePath ? uri_1.URI.file(args.waitMarkerFilePath) : undefined;
            const remoteAuthority = args.remote || undefined;
            const forceProfile = args.profile;
            const forceTempProfile = args['profile-temp'];
            // Started without file/folder arguments
            if (!hasCliArgs && !hasFolderURIs && !hasFileURIs) {
                // Force new window
                if (args['new-window'] || forceProfile || forceTempProfile) {
                    return windowsMainService.open({
                        context,
                        cli: args,
                        forceNewWindow: true,
                        forceEmpty: true,
                        noRecentEntry,
                        waitMarkerFileURI,
                        initialStartup: true,
                        remoteAuthority,
                        forceProfile,
                        forceTempProfile
                    });
                }
                // mac: open-file event received on startup
                if (macOpenFiles.length) {
                    return windowsMainService.open({
                        context: 1 /* OpenContext.DOCK */,
                        cli: args,
                        urisToOpen: macOpenFiles.map(path => {
                            path = (0, normalization_1.normalizeNFC)(path); // macOS only: normalize paths to NFC form
                            return ((0, workspace_1.hasWorkspaceFileExtension)(path) ? { workspaceUri: uri_1.URI.file(path) } : { fileUri: uri_1.URI.file(path) });
                        }),
                        noRecentEntry,
                        waitMarkerFileURI,
                        initialStartup: true,
                        // remoteAuthority: will be determined based on macOpenFiles
                    });
                }
            }
            // default: read paths from cli
            return windowsMainService.open({
                context,
                cli: args,
                forceNewWindow: args['new-window'],
                diffMode: args.diff,
                mergeMode: args.merge,
                noRecentEntry,
                waitMarkerFileURI,
                gotoLineMode: args.goto,
                initialStartup: true,
                remoteAuthority,
                forceProfile,
                forceTempProfile
            });
        }
        afterWindowOpen() {
            // Windows: mutex
            this.installMutex();
            // Remote Authorities
            electron_1.protocol.registerHttpProtocol(network_1.Schemas.vscodeRemoteResource, (request, callback) => {
                callback({
                    url: request.url.replace(/^vscode-remote-resource:/, 'http:'),
                    method: request.method
                });
            });
            // Start to fetch shell environment (if needed) after window has opened
            // Since this operation can take a long time, we want to warm it up while
            // the window is opening.
            // We also show an error to the user in case this fails.
            this.resolveShellEnvironment(this.environmentMainService.args, process.env, true);
            // Crash reporter
            this.updateCrashReporterEnablement();
            if (platform_1.isMacintosh && electron_1.app.runningUnderARM64Translation) {
                this.windowsMainService?.sendToFocused('vscode:showTranslatedBuildWarning');
            }
        }
        async installMutex() {
            const win32MutexName = this.productService.win32MutexName;
            if (platform_1.isWindows && win32MutexName) {
                try {
                    const WindowsMutex = await new Promise((resolve_1, reject_1) => { require(['@vscode/windows-mutex'], resolve_1, reject_1); });
                    const mutex = new WindowsMutex.Mutex(win32MutexName);
                    event_1.Event.once(this.lifecycleMainService.onWillShutdown)(() => mutex.release());
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
        }
        async resolveShellEnvironment(args, env, notifyOnError) {
            try {
                return await (0, shellEnv_1.getResolvedShellEnv)(this.configurationService, this.logService, args, env);
            }
            catch (error) {
                const errorMessage = (0, errorMessage_1.toErrorMessage)(error);
                if (notifyOnError) {
                    this.windowsMainService?.sendToFocused('vscode:showResolveShellEnvError', errorMessage);
                }
                else {
                    this.logService.error(errorMessage);
                }
            }
            return {};
        }
        async updateCrashReporterEnablement() {
            // If enable-crash-reporter argv is undefined then this is a fresh start,
            // based on `telemetry.enableCrashreporter` settings, generate a UUID which
            // will be used as crash reporter id and also update the json file.
            try {
                const argvContent = await this.fileService.readFile(this.environmentMainService.argvResource);
                const argvString = argvContent.value.toString();
                const argvJSON = JSON.parse((0, json_1.stripComments)(argvString));
                const telemetryLevel = (0, telemetryUtils_1.getTelemetryLevel)(this.configurationService);
                const enableCrashReporter = telemetryLevel >= 1 /* TelemetryLevel.CRASH */;
                // Initial startup
                if (argvJSON['enable-crash-reporter'] === undefined) {
                    const additionalArgvContent = [
                        '',
                        '	// Allows to disable crash reporting.',
                        '	// Should restart the app if the value is changed.',
                        `	"enable-crash-reporter": ${enableCrashReporter},`,
                        '',
                        '	// Unique id used for correlating crash reports sent from this instance.',
                        '	// Do not edit this value.',
                        `	"crash-reporter-id": "${(0, uuid_1.generateUuid)()}"`,
                        '}'
                    ];
                    const newArgvString = argvString.substring(0, argvString.length - 2).concat(',\n', additionalArgvContent.join('\n'));
                    await this.fileService.writeFile(this.environmentMainService.argvResource, buffer_1.VSBuffer.fromString(newArgvString));
                }
                // Subsequent startup: update crash reporter value if changed
                else {
                    const newArgvString = argvString.replace(/"enable-crash-reporter": .*,/, `"enable-crash-reporter": ${enableCrashReporter},`);
                    if (newArgvString !== argvString) {
                        await this.fileService.writeFile(this.environmentMainService.argvResource, buffer_1.VSBuffer.fromString(newArgvString));
                    }
                }
            }
            catch (error) {
                this.logService.error(error);
            }
        }
    };
    exports.CodeApplication = CodeApplication;
    exports.CodeApplication = CodeApplication = CodeApplication_1 = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, log_1.ILogService),
        __param(4, log_1.ILoggerService),
        __param(5, environmentMainService_1.IEnvironmentMainService),
        __param(6, lifecycleMainService_1.ILifecycleMainService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, state_1.IStateService),
        __param(9, files_1.IFileService),
        __param(10, productService_1.IProductService),
        __param(11, userDataProfile_1.IUserDataProfilesMainService)
    ], CodeApplication);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvY29kZS9lbGVjdHJvbi1tYWluL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeUhoRzs7O09BR0c7SUFDSSxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHNCQUFVOztpQkFFdEIsd0RBQW1ELEdBQUc7WUFDN0UsQ0FBQyxpQkFBTyxDQUFDLElBQUksQ0FBQyxFQUFFLDZDQUFzRDtZQUN0RSxDQUFDLGlCQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsOENBQXVEO1NBQy9FLEFBSDBFLENBR3pFO1FBTUYsWUFDa0Isd0JBQXVDLEVBQ3ZDLE9BQTRCLEVBQ0wsd0JBQStDLEVBQ3pELFVBQXVCLEVBQ3BCLGFBQTZCLEVBQ3BCLHNCQUErQyxFQUNqRCxvQkFBMkMsRUFDM0Msb0JBQTJDLEVBQ25ELFlBQTJCLEVBQzVCLFdBQXlCLEVBQ3RCLGNBQStCLEVBQ2xCLDJCQUF5RDtZQUV4RyxLQUFLLEVBQUUsQ0FBQztZQWJTLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBZTtZQUN2QyxZQUFPLEdBQVAsT0FBTyxDQUFxQjtZQUNMLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBdUI7WUFDekQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNwQixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDcEIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUNqRCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbkQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDNUIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDdEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ2xCLGdDQUEyQixHQUEzQiwyQkFB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