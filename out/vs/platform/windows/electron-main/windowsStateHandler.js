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
define(["require", "exports", "electron", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/state/node/state", "vs/platform/windows/electron-main/windows", "vs/platform/window/electron-main/window", "vs/platform/workspace/common/workspace"], function (require, exports, electron_1, lifecycle_1, platform_1, resources_1, uri_1, configuration_1, lifecycleMainService_1, log_1, state_1, windows_1, window_1, workspace_1) {
    "use strict";
    var WindowsStateHandler_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowsStateHandler = void 0;
    exports.restoreWindowsState = restoreWindowsState;
    exports.getWindowsStateStoreData = getWindowsStateStoreData;
    let WindowsStateHandler = class WindowsStateHandler extends lifecycle_1.Disposable {
        static { WindowsStateHandler_1 = this; }
        static { this.windowsStateStorageKey = 'windowsState'; }
        get state() { return this._state; }
        constructor(windowsMainService, stateService, lifecycleMainService, logService, configurationService) {
            super();
            this.windowsMainService = windowsMainService;
            this.stateService = stateService;
            this.lifecycleMainService = lifecycleMainService;
            this.logService = logService;
            this.configurationService = configurationService;
            this._state = restoreWindowsState(this.stateService.getItem(WindowsStateHandler_1.windowsStateStorageKey));
            this.lastClosedState = undefined;
            this.shuttingDown = false;
            this.registerListeners();
        }
        registerListeners() {
            // When a window looses focus, save all windows state. This allows to
            // prevent loss of window-state data when OS is restarted without properly
            // shutting down the application (https://github.com/microsoft/vscode/issues/87171)
            electron_1.app.on('browser-window-blur', () => {
                if (!this.shuttingDown) {
                    this.saveWindowsState();
                }
            });
            // Handle various lifecycle events around windows
            this.lifecycleMainService.onBeforeCloseWindow(window => this.onBeforeCloseWindow(window));
            this.lifecycleMainService.onBeforeShutdown(() => this.onBeforeShutdown());
            this.windowsMainService.onDidChangeWindowsCount(e => {
                if (e.newCount - e.oldCount > 0) {
                    // clear last closed window state when a new window opens. this helps on macOS where
                    // otherwise closing the last window, opening a new window and then quitting would
                    // use the state of the previously closed window when restarting.
                    this.lastClosedState = undefined;
                }
            });
            // try to save state before destroy because close will not fire
            this.windowsMainService.onDidDestroyWindow(window => this.onBeforeCloseWindow(window));
        }
        // Note that onBeforeShutdown() and onBeforeCloseWindow() are fired in different order depending on the OS:
        // - macOS: since the app will not quit when closing the last window, you will always first get
        //          the onBeforeShutdown() event followed by N onBeforeCloseWindow() events for each window
        // - other: on other OS, closing the last window will quit the app so the order depends on the
        //          user interaction: closing the last window will first trigger onBeforeCloseWindow()
        //          and then onBeforeShutdown(). Using the quit action however will first issue onBeforeShutdown()
        //          and then onBeforeCloseWindow().
        //
        // Here is the behavior on different OS depending on action taken (Electron 1.7.x):
        //
        // Legend
        // -  quit(N): quit application with N windows opened
        // - close(1): close one window via the window close button
        // - closeAll: close all windows via the taskbar command
        // - onBeforeShutdown(N): number of windows reported in this event handler
        // - onBeforeCloseWindow(N, M): number of windows reported and quitRequested boolean in this event handler
        //
        // macOS
        // 	-     quit(1): onBeforeShutdown(1), onBeforeCloseWindow(1, true)
        // 	-     quit(2): onBeforeShutdown(2), onBeforeCloseWindow(2, true), onBeforeCloseWindow(2, true)
        // 	-     quit(0): onBeforeShutdown(0)
        // 	-    close(1): onBeforeCloseWindow(1, false)
        //
        // Windows
        // 	-     quit(1): onBeforeShutdown(1), onBeforeCloseWindow(1, true)
        // 	-     quit(2): onBeforeShutdown(2), onBeforeCloseWindow(2, true), onBeforeCloseWindow(2, true)
        // 	-    close(1): onBeforeCloseWindow(2, false)[not last window]
        // 	-    close(1): onBeforeCloseWindow(1, false), onBeforeShutdown(0)[last window]
        // 	- closeAll(2): onBeforeCloseWindow(2, false), onBeforeCloseWindow(2, false), onBeforeShutdown(0)
        //
        // Linux
        // 	-     quit(1): onBeforeShutdown(1), onBeforeCloseWindow(1, true)
        // 	-     quit(2): onBeforeShutdown(2), onBeforeCloseWindow(2, true), onBeforeCloseWindow(2, true)
        // 	-    close(1): onBeforeCloseWindow(2, false)[not last window]
        // 	-    close(1): onBeforeCloseWindow(1, false), onBeforeShutdown(0)[last window]
        // 	- closeAll(2): onBeforeCloseWindow(2, false), onBeforeCloseWindow(2, false), onBeforeShutdown(0)
        //
        onBeforeShutdown() {
            this.shuttingDown = true;
            this.saveWindowsState();
        }
        saveWindowsState() {
            // TODO@electron workaround for Electron not being able to restore
            // multiple (native) fullscreen windows on the same display at once
            // on macOS.
            // https://github.com/electron/electron/issues/34367
            const displaysWithFullScreenWindow = new Set();
            const currentWindowsState = {
                openedWindows: [],
                lastPluginDevelopmentHostWindow: this._state.lastPluginDevelopmentHostWindow,
                lastActiveWindow: this.lastClosedState
            };
            // 1.) Find a last active window (pick any other first window otherwise)
            if (!currentWindowsState.lastActiveWindow) {
                let activeWindow = this.windowsMainService.getLastActiveWindow();
                if (!activeWindow || activeWindow.isExtensionDevelopmentHost) {
                    activeWindow = this.windowsMainService.getWindows().find(window => !window.isExtensionDevelopmentHost);
                }
                if (activeWindow) {
                    currentWindowsState.lastActiveWindow = this.toWindowState(activeWindow);
                    if (currentWindowsState.lastActiveWindow.uiState.mode === 3 /* WindowMode.Fullscreen */) {
                        displaysWithFullScreenWindow.add(currentWindowsState.lastActiveWindow.uiState.display); // always allow fullscreen for active window
                    }
                }
            }
            // 2.) Find extension host window
            const extensionHostWindow = this.windowsMainService.getWindows().find(window => window.isExtensionDevelopmentHost && !window.isExtensionTestHost);
            if (extensionHostWindow) {
                currentWindowsState.lastPluginDevelopmentHostWindow = this.toWindowState(extensionHostWindow);
                if (currentWindowsState.lastPluginDevelopmentHostWindow.uiState.mode === 3 /* WindowMode.Fullscreen */) {
                    if (displaysWithFullScreenWindow.has(currentWindowsState.lastPluginDevelopmentHostWindow.uiState.display)) {
                        if (platform_1.isMacintosh && !extensionHostWindow.win?.isSimpleFullScreen()) {
                            currentWindowsState.lastPluginDevelopmentHostWindow.uiState.mode = 1 /* WindowMode.Normal */;
                        }
                    }
                    else {
                        displaysWithFullScreenWindow.add(currentWindowsState.lastPluginDevelopmentHostWindow.uiState.display);
                    }
                }
            }
            // 3.) All windows (except extension host) for N >= 2 to support `restoreWindows: all` or for auto update
            //
            // Careful here: asking a window for its window state after it has been closed returns bogus values (width: 0, height: 0)
            // so if we ever want to persist the UI state of the last closed window (window count === 1), it has
            // to come from the stored lastClosedWindowState on Win/Linux at least
            if (this.windowsMainService.getWindowCount() > 1) {
                currentWindowsState.openedWindows = this.windowsMainService.getWindows().filter(window => !window.isExtensionDevelopmentHost).map(window => {
                    const windowState = this.toWindowState(window);
                    if (windowState.uiState.mode === 3 /* WindowMode.Fullscreen */) {
                        if (displaysWithFullScreenWindow.has(windowState.uiState.display)) {
                            if (platform_1.isMacintosh && windowState.windowId !== currentWindowsState.lastActiveWindow?.windowId && !window.win?.isSimpleFullScreen()) {
                                windowState.uiState.mode = 1 /* WindowMode.Normal */;
                            }
                        }
                        else {
                            displaysWithFullScreenWindow.add(windowState.uiState.display);
                        }
                    }
                    return windowState;
                });
            }
            // Persist
            const state = getWindowsStateStoreData(currentWindowsState);
            this.stateService.setItem(WindowsStateHandler_1.windowsStateStorageKey, state);
            if (this.shuttingDown) {
                this.logService.trace('[WindowsStateHandler] onBeforeShutdown', state);
            }
        }
        // See note on #onBeforeShutdown() for details how these events are flowing
        onBeforeCloseWindow(window) {
            if (this.lifecycleMainService.quitRequested) {
                return; // during quit, many windows close in parallel so let it be handled in the before-quit handler
            }
            // On Window close, update our stored UI state of this window
            const state = this.toWindowState(window);
            if (window.isExtensionDevelopmentHost && !window.isExtensionTestHost) {
                this._state.lastPluginDevelopmentHostWindow = state; // do not let test run window state overwrite our extension development state
            }
            // Any non extension host window with same workspace or folder
            else if (!window.isExtensionDevelopmentHost && window.openedWorkspace) {
                this._state.openedWindows.forEach(openedWindow => {
                    const sameWorkspace = (0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace) && openedWindow.workspace?.id === window.openedWorkspace.id;
                    const sameFolder = (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.openedWorkspace) && openedWindow.folderUri && resources_1.extUriBiasedIgnorePathCase.isEqual(openedWindow.folderUri, window.openedWorkspace.uri);
                    if (sameWorkspace || sameFolder) {
                        openedWindow.uiState = state.uiState;
                    }
                });
            }
            // On Windows and Linux closing the last window will trigger quit. Since we are storing all UI state
            // before quitting, we need to remember the UI state of this window to be able to persist it.
            // On macOS we keep the last closed window state ready in case the user wants to quit right after or
            // wants to open another window, in which case we use this state over the persisted one.
            if (this.windowsMainService.getWindowCount() === 1) {
                this.lastClosedState = state;
            }
        }
        toWindowState(window) {
            return {
                windowId: window.id,
                workspace: (0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace) ? window.openedWorkspace : undefined,
                folderUri: (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.openedWorkspace) ? window.openedWorkspace.uri : undefined,
                backupPath: window.backupPath,
                remoteAuthority: window.remoteAuthority,
                uiState: window.serializeWindowState()
            };
        }
        getNewWindowState(configuration) {
            const state = this.doGetNewWindowState(configuration);
            const windowConfig = this.configurationService.getValue('window');
            // Fullscreen state gets special treatment
            if (state.mode === 3 /* WindowMode.Fullscreen */) {
                // Window state is not from a previous session: only allow fullscreen if we inherit it or user wants fullscreen
                let allowFullscreen;
                if (state.hasDefaultState) {
                    allowFullscreen = !!(windowConfig?.newWindowDimensions && ['fullscreen', 'inherit', 'offset'].indexOf(windowConfig.newWindowDimensions) >= 0);
                }
                // Window state is from a previous session: only allow fullscreen when we got updated or user wants to restore
                else {
                    allowFullscreen = !!(this.lifecycleMainService.wasRestarted || windowConfig?.restoreFullscreen);
                }
                if (!allowFullscreen) {
                    state.mode = 1 /* WindowMode.Normal */;
                }
            }
            return state;
        }
        doGetNewWindowState(configuration) {
            const lastActive = this.windowsMainService.getLastActiveWindow();
            // Restore state unless we are running extension tests
            if (!configuration.extensionTestsPath) {
                // extension development host Window - load from stored settings if any
                if (!!configuration.extensionDevelopmentPath && this.state.lastPluginDevelopmentHostWindow) {
                    return this.state.lastPluginDevelopmentHostWindow.uiState;
                }
                // Known Workspace - load from stored settings
                const workspace = configuration.workspace;
                if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                    const stateForWorkspace = this.state.openedWindows.filter(openedWindow => openedWindow.workspace && openedWindow.workspace.id === workspace.id).map(openedWindow => openedWindow.uiState);
                    if (stateForWorkspace.length) {
                        return stateForWorkspace[0];
                    }
                }
                // Known Folder - load from stored settings
                if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                    const stateForFolder = this.state.openedWindows.filter(openedWindow => openedWindow.folderUri && resources_1.extUriBiasedIgnorePathCase.isEqual(openedWindow.folderUri, workspace.uri)).map(openedWindow => openedWindow.uiState);
                    if (stateForFolder.length) {
                        return stateForFolder[0];
                    }
                }
                // Empty windows with backups
                else if (configuration.backupPath) {
                    const stateForEmptyWindow = this.state.openedWindows.filter(openedWindow => openedWindow.backupPath === configuration.backupPath).map(openedWindow => openedWindow.uiState);
                    if (stateForEmptyWindow.length) {
                        return stateForEmptyWindow[0];
                    }
                }
                // First Window
                const lastActiveState = this.lastClosedState || this.state.lastActiveWindow;
                if (!lastActive && lastActiveState) {
                    return lastActiveState.uiState;
                }
            }
            //
            // In any other case, we do not have any stored settings for the window state, so we come up with something smart
            //
            // We want the new window to open on the same display that the last active one is in
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
                if (!displayToUse && lastActive) {
                    displayToUse = electron_1.screen.getDisplayMatching(lastActive.getBounds());
                }
                // fallback to primary display or first display
                if (!displayToUse) {
                    displayToUse = electron_1.screen.getPrimaryDisplay() || displays[0];
                }
            }
            // Compute x/y based on display bounds
            // Note: important to use Math.round() because Electron does not seem to be too happy about
            // display coordinates that are not absolute numbers.
            let state = (0, window_1.defaultWindowState)();
            state.x = Math.round(displayToUse.bounds.x + (displayToUse.bounds.width / 2) - (state.width / 2));
            state.y = Math.round(displayToUse.bounds.y + (displayToUse.bounds.height / 2) - (state.height / 2));
            // Check for newWindowDimensions setting and adjust accordingly
            const windowConfig = this.configurationService.getValue('window');
            let ensureNoOverlap = true;
            if (windowConfig?.newWindowDimensions) {
                if (windowConfig.newWindowDimensions === 'maximized') {
                    state.mode = 0 /* WindowMode.Maximized */;
                    ensureNoOverlap = false;
                }
                else if (windowConfig.newWindowDimensions === 'fullscreen') {
                    state.mode = 3 /* WindowMode.Fullscreen */;
                    ensureNoOverlap = false;
                }
                else if ((windowConfig.newWindowDimensions === 'inherit' || windowConfig.newWindowDimensions === 'offset') && lastActive) {
                    const lastActiveState = lastActive.serializeWindowState();
                    if (lastActiveState.mode === 3 /* WindowMode.Fullscreen */) {
                        state.mode = 3 /* WindowMode.Fullscreen */; // only take mode (fixes https://github.com/microsoft/vscode/issues/19331)
                    }
                    else {
                        state = {
                            ...lastActiveState,
                            zoomLevel: undefined // do not inherit zoom level
                        };
                    }
                    ensureNoOverlap = state.mode !== 3 /* WindowMode.Fullscreen */ && windowConfig.newWindowDimensions === 'offset';
                }
            }
            if (ensureNoOverlap) {
                state = this.ensureNoOverlap(state);
            }
            state.hasDefaultState = true; // flag as default state
            return state;
        }
        ensureNoOverlap(state) {
            if (this.windowsMainService.getWindows().length === 0) {
                return state;
            }
            state.x = typeof state.x === 'number' ? state.x : 0;
            state.y = typeof state.y === 'number' ? state.y : 0;
            const existingWindowBounds = this.windowsMainService.getWindows().map(window => window.getBounds());
            while (existingWindowBounds.some(bounds => bounds.x === state.x || bounds.y === state.y)) {
                state.x += 30;
                state.y += 30;
            }
            return state;
        }
    };
    exports.WindowsStateHandler = WindowsStateHandler;
    exports.WindowsStateHandler = WindowsStateHandler = WindowsStateHandler_1 = __decorate([
        __param(0, windows_1.IWindowsMainService),
        __param(1, state_1.IStateService),
        __param(2, lifecycleMainService_1.ILifecycleMainService),
        __param(3, log_1.ILogService),
        __param(4, configuration_1.IConfigurationService)
    ], WindowsStateHandler);
    function restoreWindowsState(data) {
        const result = { openedWindows: [] };
        const windowsState = data || { openedWindows: [] };
        if (windowsState.lastActiveWindow) {
            result.lastActiveWindow = restoreWindowState(windowsState.lastActiveWindow);
        }
        if (windowsState.lastPluginDevelopmentHostWindow) {
            result.lastPluginDevelopmentHostWindow = restoreWindowState(windowsState.lastPluginDevelopmentHostWindow);
        }
        if (Array.isArray(windowsState.openedWindows)) {
            result.openedWindows = windowsState.openedWindows.map(windowState => restoreWindowState(windowState));
        }
        return result;
    }
    function restoreWindowState(windowState) {
        const result = { uiState: windowState.uiState };
        if (windowState.backupPath) {
            result.backupPath = windowState.backupPath;
        }
        if (windowState.remoteAuthority) {
            result.remoteAuthority = windowState.remoteAuthority;
        }
        if (windowState.folder) {
            result.folderUri = uri_1.URI.parse(windowState.folder);
        }
        if (windowState.workspaceIdentifier) {
            result.workspace = { id: windowState.workspaceIdentifier.id, configPath: uri_1.URI.parse(windowState.workspaceIdentifier.configURIPath) };
        }
        return result;
    }
    function getWindowsStateStoreData(windowsState) {
        return {
            lastActiveWindow: windowsState.lastActiveWindow && serializeWindowState(windowsState.lastActiveWindow),
            lastPluginDevelopmentHostWindow: windowsState.lastPluginDevelopmentHostWindow && serializeWindowState(windowsState.lastPluginDevelopmentHostWindow),
            openedWindows: windowsState.openedWindows.map(ws => serializeWindowState(ws))
        };
    }
    function serializeWindowState(windowState) {
        return {
            workspaceIdentifier: windowState.workspace && { id: windowState.workspace.id, configURIPath: windowState.workspace.configPath.toString() },
            folder: windowState.folderUri && windowState.folderUri.toString(),
            backupPath: windowState.backupPath,
            remoteAuthority: windowState.remoteAuthority,
            uiState: windowState.uiState
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93c1N0YXRlSGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3dpbmRvd3MvZWxlY3Ryb24tbWFpbi93aW5kb3dzU3RhdGVIYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5YWhHLGtEQWlCQztJQXVCRCw0REFNQztJQXRhTSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVOztpQkFFMUIsMkJBQXNCLEdBQUcsY0FBYyxBQUFqQixDQUFrQjtRQUVoRSxJQUFJLEtBQUssS0FBSyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBT25DLFlBQ3NCLGtCQUF3RCxFQUM5RCxZQUE0QyxFQUNwQyxvQkFBNEQsRUFDdEUsVUFBd0MsRUFDOUIsb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBTjhCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDN0MsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDbkIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2IseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQVhuRSxXQUFNLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQTBCLHFCQUFtQixDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztZQUV0SSxvQkFBZSxHQUE2QixTQUFTLENBQUM7WUFFdEQsaUJBQVksR0FBRyxLQUFLLENBQUM7WUFXNUIsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUV4QixxRUFBcUU7WUFDckUsMEVBQTBFO1lBQzFFLG1GQUFtRjtZQUNuRixjQUFH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