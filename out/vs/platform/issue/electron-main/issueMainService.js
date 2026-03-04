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
define(["require", "exports", "electron", "os", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/node/ps", "vs/base/parts/ipc/electron-main/ipcMain", "vs/nls", "vs/platform/diagnostics/common/diagnostics", "vs/platform/diagnostics/electron-main/diagnosticsMainService", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/log/common/log", "vs/platform/native/electron-main/nativeHostMainService", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/protocol/electron-main/protocol", "vs/platform/state/node/state", "vs/platform/utilityProcess/electron-main/utilityProcess", "vs/platform/window/common/window", "vs/platform/windows/electron-main/windows"], function (require, exports, electron_1, os_1, async_1, cancellation_1, extpath_1, lifecycle_1, network_1, platform_1, ps_1, ipcMain_1, nls_1, diagnostics_1, diagnosticsMainService_1, dialogMainService_1, environmentMainService_1, log_1, nativeHostMainService_1, product_1, productService_1, protocol_1, state_1, utilityProcess_1, window_1, windows_1) {
    "use strict";
    var IssueMainService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IssueMainService = void 0;
    const processExplorerWindowState = 'issue.processExplorerWindowState';
    let IssueMainService = class IssueMainService {
        static { IssueMainService_1 = this; }
        static { this.DEFAULT_BACKGROUND_COLOR = '#1E1E1E'; }
        constructor(userEnv, environmentMainService, logService, diagnosticsService, diagnosticsMainService, dialogMainService, nativeHostMainService, protocolMainService, productService, stateService, windowsMainService) {
            this.userEnv = userEnv;
            this.environmentMainService = environmentMainService;
            this.logService = logService;
            this.diagnosticsService = diagnosticsService;
            this.diagnosticsMainService = diagnosticsMainService;
            this.dialogMainService = dialogMainService;
            this.nativeHostMainService = nativeHostMainService;
            this.protocolMainService = protocolMainService;
            this.productService = productService;
            this.stateService = stateService;
            this.windowsMainService = windowsMainService;
            this.issueReporterWindow = null;
            this.issueReporterParentWindow = null;
            this.processExplorerWindow = null;
            this.processExplorerParentWindow = null;
            this.registerListeners();
        }
        //#region Register Listeners
        registerListeners() {
            ipcMain_1.validatedIpcMain.on('vscode:listProcesses', async (event) => {
                const processes = [];
                try {
                    processes.push({ name: (0, nls_1.localize)('local', "Local"), rootProcess: await (0, ps_1.listProcesses)(process.pid) });
                    const remoteDiagnostics = await this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: true });
                    remoteDiagnostics.forEach(data => {
                        if ((0, diagnostics_1.isRemoteDiagnosticError)(data)) {
                            processes.push({
                                name: data.hostName,
                                rootProcess: data
                            });
                        }
                        else {
                            if (data.processes) {
                                processes.push({
                                    name: data.hostName,
                                    rootProcess: data.processes
                                });
                            }
                        }
                    });
                }
                catch (e) {
                    this.logService.error(`Listing processes failed: ${e}`);
                }
                this.safeSend(event, 'vscode:listProcessesResponse', processes);
            });
            ipcMain_1.validatedIpcMain.on('vscode:workbenchCommand', (_, commandInfo) => {
                const { id, from, args } = commandInfo;
                let parentWindow;
                switch (from) {
                    case 'processExplorer':
                        parentWindow = this.processExplorerParentWindow;
                        break;
                    default:
                        // The issue reporter does not use this anymore.
                        throw new Error(`Unexpected command source: ${from}`);
                }
                parentWindow?.webContents.send('vscode:runAction', { id, from, args });
            });
            ipcMain_1.validatedIpcMain.on('vscode:closeProcessExplorer', event => {
                this.processExplorerWindow?.close();
            });
            ipcMain_1.validatedIpcMain.on('vscode:pidToNameRequest', async (event) => {
                const mainProcessInfo = await this.diagnosticsMainService.getMainDiagnostics();
                const pidToNames = [];
                for (const window of mainProcessInfo.windows) {
                    pidToNames.push([window.pid, `window [${window.id}] (${window.title})`]);
                }
                for (const { pid, name } of utilityProcess_1.UtilityProcess.getAll()) {
                    pidToNames.push([pid, name]);
                }
                this.safeSend(event, 'vscode:pidToNameResponse', pidToNames);
            });
        }
        //#endregion
        //#region Used by renderer
        async openReporter(data) {
            if (!this.issueReporterWindow) {
                this.issueReporterParentWindow = electron_1.BrowserWindow.getFocusedWindow();
                if (this.issueReporterParentWindow) {
                    const issueReporterDisposables = new lifecycle_1.DisposableStore();
                    const issueReporterWindowConfigUrl = issueReporterDisposables.add(this.protocolMainService.createIPCObjectUrl());
                    const position = this.getWindowPosition(this.issueReporterParentWindow, 700, 800);
                    this.issueReporterWindow = this.createBrowserWindow(position, issueReporterWindowConfigUrl, {
                        backgroundColor: data.styles.backgroundColor,
                        title: (0, nls_1.localize)('issueReporter', "Issue Reporter"),
                        zoomLevel: data.zoomLevel,
                        alwaysOnTop: false
                    }, 'issue-reporter');
                    // Store into config object URL
                    issueReporterWindowConfigUrl.update({
                        appRoot: this.environmentMainService.appRoot,
                        windowId: this.issueReporterWindow.id,
                        userEnv: this.userEnv,
                        data,
                        disableExtensions: !!this.environmentMainService.disableExtensions,
                        os: {
                            type: (0, os_1.type)(),
                            arch: (0, os_1.arch)(),
                            release: (0, os_1.release)(),
                        },
                        product: product_1.default
                    });
                    this.issueReporterWindow.loadURL(network_1.FileAccess.asBrowserUri(`vs/code/electron-sandbox/issue/issueReporter${this.environmentMainService.isBuilt ? '' : '-dev'}.html`).toString(true));
                    this.issueReporterWindow.on('close', () => {
                        this.issueReporterWindow = null;
                        issueReporterDisposables.dispose();
                    });
                    this.issueReporterParentWindow.on('closed', () => {
                        if (this.issueReporterWindow) {
                            this.issueReporterWindow.close();
                            this.issueReporterWindow = null;
                            issueReporterDisposables.dispose();
                        }
                    });
                }
            }
            else if (this.issueReporterWindow) {
                this.focusWindow(this.issueReporterWindow);
            }
        }
        async openProcessExplorer(data) {
            if (!this.processExplorerWindow) {
                this.processExplorerParentWindow = electron_1.BrowserWindow.getFocusedWindow();
                if (this.processExplorerParentWindow) {
                    const processExplorerDisposables = new lifecycle_1.DisposableStore();
                    const processExplorerWindowConfigUrl = processExplorerDisposables.add(this.protocolMainService.createIPCObjectUrl());
                    const savedPosition = this.stateService.getItem(processExplorerWindowState, undefined);
                    const position = isStrictWindowState(savedPosition) ? savedPosition : this.getWindowPosition(this.processExplorerParentWindow, 800, 500);
                    this.processExplorerWindow = this.createBrowserWindow(position, processExplorerWindowConfigUrl, {
                        backgroundColor: data.styles.backgroundColor,
                        title: (0, nls_1.localize)('processExplorer', "Process Explorer"),
                        zoomLevel: data.zoomLevel,
                        alwaysOnTop: true
                    }, 'process-explorer');
                    // Store into config object URL
                    processExplorerWindowConfigUrl.update({
                        appRoot: this.environmentMainService.appRoot,
                        windowId: this.processExplorerWindow.id,
                        userEnv: this.userEnv,
                        data,
                        product: product_1.default
                    });
                    this.processExplorerWindow.loadURL(network_1.FileAccess.asBrowserUri(`vs/code/electron-sandbox/processExplorer/processExplorer${this.environmentMainService.isBuilt ? '' : '-dev'}.html`).toString(true));
                    this.processExplorerWindow.on('close', () => {
                        this.processExplorerWindow = null;
                        processExplorerDisposables.dispose();
                    });
                    this.processExplorerParentWindow.on('close', () => {
                        if (this.processExplorerWindow) {
                            this.processExplorerWindow.close();
                            this.processExplorerWindow = null;
                            processExplorerDisposables.dispose();
                        }
                    });
                    const storeState = () => {
                        if (!this.processExplorerWindow) {
                            return;
                        }
                        const size = this.processExplorerWindow.getSize();
                        const position = this.processExplorerWindow.getPosition();
                        if (!size || !position) {
                            return;
                        }
                        const state = {
                            width: size[0],
                            height: size[1],
                            x: position[0],
                            y: position[1]
                        };
                        this.stateService.setItem(processExplorerWindowState, state);
                    };
                    this.processExplorerWindow.on('moved', storeState);
                    this.processExplorerWindow.on('resized', storeState);
                }
            }
            if (this.processExplorerWindow) {
                this.focusWindow(this.processExplorerWindow);
            }
        }
        async stopTracing() {
            if (!this.environmentMainService.args.trace) {
                return; // requires tracing to be on
            }
            const path = await electron_1.contentTracing.stopRecording(`${(0, extpath_1.randomPath)(this.environmentMainService.userHome.fsPath, this.productService.applicationName)}.trace.txt`);
            // Inform user to report an issue
            await this.dialogMainService.showMessageBox({
                type: 'info',
                message: (0, nls_1.localize)('trace.message', "Successfully created the trace file"),
                detail: (0, nls_1.localize)('trace.detail', "Please create an issue and manually attach the following file:\n{0}", path),
                buttons: [(0, nls_1.localize)({ key: 'trace.ok', comment: ['&& denotes a mnemonic'] }, "&&OK")],
            }, electron_1.BrowserWindow.getFocusedWindow() ?? undefined);
            // Show item in explorer
            this.nativeHostMainService.showItemInFolder(undefined, path);
        }
        async getSystemStatus() {
            const [info, remoteData] = await Promise.all([this.diagnosticsMainService.getMainDiagnostics(), this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: false, includeWorkspaceMetadata: false })]);
            return this.diagnosticsService.getDiagnostics(info, remoteData);
        }
        //#endregion
        //#region used by issue reporter window
        async $getSystemInfo() {
            const [info, remoteData] = await Promise.all([this.diagnosticsMainService.getMainDiagnostics(), this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: false, includeWorkspaceMetadata: false })]);
            const msg = await this.diagnosticsService.getSystemInfo(info, remoteData);
            return msg;
        }
        async $getPerformanceInfo() {
            try {
                const [info, remoteData] = await Promise.all([this.diagnosticsMainService.getMainDiagnostics(), this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: true, includeWorkspaceMetadata: true })]);
                return await this.diagnosticsService.getPerformanceInfo(info, remoteData);
            }
            catch (error) {
                this.logService.warn('issueService#getPerformanceInfo ', error.message);
                throw error;
            }
        }
        async $reloadWithExtensionsDisabled() {
            if (this.issueReporterParentWindow) {
                try {
                    await this.nativeHostMainService.reload(this.issueReporterParentWindow.id, { disableExtensions: true });
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
        }
        async $showConfirmCloseDialog() {
            if (this.issueReporterWindow) {
                const { response } = await this.dialogMainService.showMessageBox({
                    type: 'warning',
                    message: (0, nls_1.localize)('confirmCloseIssueReporter', "Your input will not be saved. Are you sure you want to close this window?"),
                    buttons: [
                        (0, nls_1.localize)({ key: 'yes', comment: ['&& denotes a mnemonic'] }, "&&Yes"),
                        (0, nls_1.localize)('cancel', "Cancel")
                    ]
                }, this.issueReporterWindow);
                if (response === 0) {
                    if (this.issueReporterWindow) {
                        this.issueReporterWindow.destroy();
                        this.issueReporterWindow = null;
                    }
                }
            }
        }
        async $showClipboardDialog() {
            if (this.issueReporterWindow) {
                const { response } = await this.dialogMainService.showMessageBox({
                    type: 'warning',
                    message: (0, nls_1.localize)('issueReporterWriteToClipboard', "There is too much data to send to GitHub directly. The data will be copied to the clipboard, please paste it into the GitHub issue page that is opened."),
                    buttons: [
                        (0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"),
                        (0, nls_1.localize)('cancel', "Cancel")
                    ]
                }, this.issueReporterWindow);
                return response === 0;
            }
            return false;
        }
        issueReporterWindowCheck() {
            if (!this.issueReporterParentWindow) {
                throw new Error('Issue reporter window not available');
            }
            const window = this.windowsMainService.getWindowById(this.issueReporterParentWindow.id);
            if (!window) {
                throw new Error('Window not found');
            }
            return window;
        }
        async $sendReporterMenu(extensionId, extensionName) {
            const window = this.issueReporterWindowCheck();
            const replyChannel = `vscode:triggerReporterMenu`;
            const cts = new cancellation_1.CancellationTokenSource();
            window.sendWhenReady(replyChannel, cts.token, { replyChannel, extensionId, extensionName });
            const result = await (0, async_1.raceTimeout)(new Promise(resolve => ipcMain_1.validatedIpcMain.once(`vscode:triggerReporterMenuResponse:${extensionId}`, (_, data) => resolve(data))), 5000, () => {
                this.logService.error(`Error: Extension ${extensionId} timed out waiting for menu response`);
                cts.cancel();
            });
            return result;
        }
        async $closeReporter() {
            this.issueReporterWindow?.close();
        }
        async closeProcessExplorer() {
            this.processExplorerWindow?.close();
        }
        //#endregion
        focusWindow(window) {
            if (window.isMinimized()) {
                window.restore();
            }
            window.focus();
        }
        safeSend(event, channel, ...args) {
            if (!event.sender.isDestroyed()) {
                event.sender.send(channel, ...args);
            }
        }
        createBrowserWindow(position, ipcObjectUrl, options, windowKind) {
            const window = new electron_1.BrowserWindow({
                fullscreen: false,
                skipTaskbar: false,
                resizable: true,
                width: position.width,
                height: position.height,
                minWidth: 300,
                minHeight: 200,
                x: position.x,
                y: position.y,
                title: options.title,
                backgroundColor: options.backgroundColor || IssueMainService_1.DEFAULT_BACKGROUND_COLOR,
                webPreferences: {
                    preload: network_1.FileAccess.asFileUri('vs/base/parts/sandbox/electron-sandbox/preload.js').fsPath,
                    additionalArguments: [`--vscode-window-config=${ipcObjectUrl.resource.toString()}`],
                    v8CacheOptions: this.environmentMainService.useCodeCache ? 'bypassHeatCheck' : 'none',
                    enableWebSQL: false,
                    spellcheck: false,
                    zoomFactor: (0, window_1.zoomLevelToZoomFactor)(options.zoomLevel),
                    sandbox: true
                },
                alwaysOnTop: options.alwaysOnTop,
                experimentalDarkMode: true
            });
            window.setMenuBarVisibility(false);
            return window;
        }
        getWindowPosition(parentWindow, defaultWidth, defaultHeight) {
            // We want the new window to open on the same display that the parent is in
            let displayToUse;
            const displays = electron_1.screen.getAllDisplays();
            // Single Display
            if (displays.length === 1) {
                displayToUse = displays[0];
            }
            // Multi Display
            else {
                // on mac there is 1 menu per window so we need to use the monitor where the cursor currently is
                if (platform_1.isMacintosh) {
                    const cursorPoint = electron_1.screen.getCursorScreenPoint();
                    displayToUse = electron_1.screen.getDisplayNearestPoint(cursorPoint);
                }
                // if we have a last active window, use that display for the new window
                if (!displayToUse && parentWindow) {
                    displayToUse = electron_1.screen.getDisplayMatching(parentWindow.getBounds());
                }
                // fallback to primary display or first display
                if (!displayToUse) {
                    displayToUse = electron_1.screen.getPrimaryDisplay() || displays[0];
                }
            }
            const displayBounds = displayToUse.bounds;
            const state = {
                width: defaultWidth,
                height: defaultHeight,
                x: displayBounds.x + (displayBounds.width / 2) - (defaultWidth / 2),
                y: displayBounds.y + (displayBounds.height / 2) - (defaultHeight / 2)
            };
            if (displayBounds.width > 0 && displayBounds.height > 0 /* Linux X11 sessions sometimes report wrong display bounds */) {
                if (state.x < displayBounds.x) {
                    state.x = displayBounds.x; // prevent window from falling out of the screen to the left
                }
                if (state.y < displayBounds.y) {
                    state.y = displayBounds.y; // prevent window from falling out of the screen to the top
                }
                if (state.x > (displayBounds.x + displayBounds.width)) {
                    state.x = displayBounds.x; // prevent window from falling out of the screen to the right
                }
                if (state.y > (displayBounds.y + displayBounds.height)) {
                    state.y = displayBounds.y; // prevent window from falling out of the screen to the bottom
                }
                if (state.width > displayBounds.width) {
                    state.width = displayBounds.width; // prevent window from exceeding display bounds width
                }
                if (state.height > displayBounds.height) {
                    state.height = displayBounds.height; // prevent window from exceeding display bounds height
                }
            }
            return state;
        }
    };
    exports.IssueMainService = IssueMainService;
    exports.IssueMainService = IssueMainService = IssueMainService_1 = __decorate([
        __param(1, environmentMainService_1.IEnvironmentMainService),
        __param(2, log_1.ILogService),
        __param(3, diagnostics_1.IDiagnosticsService),
        __param(4, diagnosticsMainService_1.IDiagnosticsMainService),
        __param(5, dialogMainService_1.IDialogMainService),
        __param(6, nativeHostMainService_1.INativeHostMainService),
        __param(7, protocol_1.IProtocolMainService),
        __param(8, productService_1.IProductService),
        __param(9, state_1.IStateService),
        __param(10, windows_1.IWindowsMainService)
    ], IssueMainService);
    function isStrictWindowState(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }
        return ('x' in obj &&
            'y' in obj &&
            'width' in obj &&
            'height' in obj);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2lzc3VlL2VsZWN0cm9uLW1haW4vaXNzdWVNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNkJoRyxNQUFNLDBCQUEwQixHQUFHLGtDQUFrQyxDQUFDO0lBVy9ELElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCOztpQkFJSiw2QkFBd0IsR0FBRyxTQUFTLEFBQVosQ0FBYTtRQVE3RCxZQUNTLE9BQTRCLEVBQ1gsc0JBQWdFLEVBQzVFLFVBQXdDLEVBQ2hDLGtCQUF3RCxFQUNwRCxzQkFBZ0UsRUFDckUsaUJBQXNELEVBQ2xELHFCQUE4RCxFQUNoRSxtQkFBMEQsRUFDL0QsY0FBZ0QsRUFDbEQsWUFBNEMsRUFDdEMsa0JBQXdEO1lBVnJFLFlBQU8sR0FBUCxPQUFPLENBQXFCO1lBQ00sMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUMzRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2YsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUNuQywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQ3BELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDakMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUMvQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQzlDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNqQyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNyQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBakJ0RSx3QkFBbUIsR0FBeUIsSUFBSSxDQUFDO1lBQ2pELDhCQUF5QixHQUF5QixJQUFJLENBQUM7WUFFdkQsMEJBQXFCLEdBQXlCLElBQUksQ0FB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