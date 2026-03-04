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
define(["require", "exports", "electron", "vs/base/node/pfs", "vs/base/node/unc", "os", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/extpath", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/backup/electron-main/backup", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/protocol/electron-main/protocol", "vs/platform/remote/common/remoteHosts", "vs/platform/state/node/state", "vs/platform/window/common/window", "vs/platform/windows/electron-main/windowImpl", "vs/platform/windows/electron-main/windows", "vs/platform/windows/electron-main/windowsFinder", "vs/platform/windows/electron-main/windowsStateHandler", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/node/workspaces", "vs/platform/workspaces/electron-main/workspacesHistoryMainService", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/platform/theme/electron-main/themeMainService", "vs/platform/policy/common/policy", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/log/electron-main/loggerService", "vs/platform/auxiliaryWindow/electron-main/auxiliaryWindows"], function (require, exports, electron_1, pfs_1, unc_1, os_1, arrays_1, cancellation_1, event_1, extpath_1, labels_1, lifecycle_1, network_1, path_1, performance_1, platform_1, process_1, resources_1, types_1, uri_1, nls_1, backup_1, configuration_1, dialogMainService_1, environmentMainService_1, files_1, instantiation_1, lifecycleMainService_1, log_1, product_1, protocol_1, remoteHosts_1, state_1, window_1, windowImpl_1, windows_1, windowsFinder_1, windowsStateHandler_1, workspace_1, workspaces_1, workspacesHistoryMainService_1, workspacesManagementMainService_1, themeMainService_1, policy_1, userDataProfile_1, loggerService_1, auxiliaryWindows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowsMainService = void 0;
    function isWorkspacePathToOpen(path) {
        return (0, workspace_1.isWorkspaceIdentifier)(path?.workspace);
    }
    function isSingleFolderWorkspacePathToOpen(path) {
        return (0, workspace_1.isSingleFolderWorkspaceIdentifier)(path?.workspace);
    }
    //#endregion
    let WindowsMainService = class WindowsMainService extends lifecycle_1.Disposable {
        constructor(machineId, sqmId, initialUserEnv, logService, loggerService, stateService, policyService, environmentMainService, userDataProfilesMainService, lifecycleMainService, backupMainService, configurationService, workspacesHistoryMainService, workspacesManagementMainService, instantiationService, dialogMainService, fileService, protocolMainService, themeMainService, auxiliaryWindowsMainService) {
            super();
            this.machineId = machineId;
            this.sqmId = sqmId;
            this.initialUserEnv = initialUserEnv;
            this.logService = logService;
            this.loggerService = loggerService;
            this.stateService = stateService;
            this.policyService = policyService;
            this.environmentMainService = environmentMainService;
            this.userDataProfilesMainService = userDataProfilesMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.backupMainService = backupMainService;
            this.configurationService = configurationService;
            this.workspacesHistoryMainService = workspacesHistoryMainService;
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.instantiationService = instantiationService;
            this.dialogMainService = dialogMainService;
            this.fileService = fileService;
            this.protocolMainService = protocolMainService;
            this.themeMainService = themeMainService;
            this.auxiliaryWindowsMainService = auxiliaryWindowsMainService;
            this._onDidOpenWindow = this._register(new event_1.Emitter());
            this.onDidOpenWindow = this._onDidOpenWindow.event;
            this._onDidSignalReadyWindow = this._register(new event_1.Emitter());
            this.onDidSignalReadyWindow = this._onDidSignalReadyWindow.event;
            this._onDidDestroyWindow = this._register(new event_1.Emitter());
            this.onDidDestroyWindow = this._onDidDestroyWindow.event;
            this._onDidChangeWindowsCount = this._register(new event_1.Emitter());
            this.onDidChangeWindowsCount = this._onDidChangeWindowsCount.event;
            this._onDidMaximizeWindow = this._register(new event_1.Emitter());
            this.onDidMaximizeWindow = this._onDidMaximizeWindow.event;
            this._onDidUnmaximizeWindow = this._register(new event_1.Emitter());
            this.onDidUnmaximizeWindow = this._onDidUnmaximizeWindow.event;
            this._onDidChangeFullScreen = this._register(new event_1.Emitter());
            this.onDidChangeFullScreen = this._onDidChangeFullScreen.event;
            this._onDidTriggerSystemContextMenu = this._register(new event_1.Emitter());
            this.onDidTriggerSystemContextMenu = this._onDidTriggerSystemContextMenu.event;
            this.windows = new Map();
            this.windowsStateHandler = this._register(new windowsStateHandler_1.WindowsStateHandler(this, this.stateService, this.lifecycleMainService, this.logService, this.configurationService));
            this.registerListeners();
        }
        registerListeners() {
            // Signal a window is ready after having entered a workspace
            this._register(this.workspacesManagementMainService.onDidEnterWorkspace(event => this._onDidSignalReadyWindow.fire(event.window)));
            // Update valid roots in protocol service for extension dev windows
            this._register(this.onDidSignalReadyWindow(window => {
                if (window.config?.extensionDevelopmentPath || window.config?.extensionTestsPath) {
                    const disposables = new lifecycle_1.DisposableStore();
                    disposables.add(event_1.Event.any(window.onDidClose, window.onDidDestroy)(() => disposables.dispose()));
                    // Allow access to extension development path
                    if (window.config.extensionDevelopmentPath) {
                        for (const extensionDevelopmentPath of window.config.extensionDevelopmentPath) {
                            disposables.add(this.protocolMainService.addValidFileRoot(extensionDevelopmentPath));
                        }
                    }
                    // Allow access to extension tests path
                    if (window.config.extensionTestsPath) {
                        disposables.add(this.protocolMainService.addValidFileRoot(window.config.extensionTestsPath));
                    }
                }
            }));
        }
        openEmptyWindow(openConfig, options) {
            const cli = this.environmentMainService.args;
            const remoteAuthority = options?.remoteAuthority || undefined;
            const forceEmpty = true;
            const forceReuseWindow = options?.forceReuseWindow;
            const forceNewWindow = !forceReuseWindow;
            return this.open({ ...openConfig, cli, forceEmpty, forceNewWindow, forceReuseWindow, remoteAuthority });
        }
        openExistingWindow(window, openConfig) {
            // Bring window to front
            window.focus();
            // Handle --wait
            this.handleWaitMarkerFile(openConfig, [window]);
        }
        async open(openConfig) {
            this.logService.trace('windowsManager#open');
            if (openConfig.addMode && (openConfig.initialStartup || !this.getLastActiveWindow())) {
                openConfig.addMode = false; // Make sure addMode is only enabled if we have an active window
            }
            const foldersToAdd = [];
            const foldersToOpen = [];
            const workspacesToOpen = [];
            const untitledWorkspacesToRestore = [];
            const emptyWindowsWithBackupsToRestore = [];
            let filesToOpen;
            let emptyToOpen = 0;
            // Identify things to open from open config
            const pathsToOpen = await this.getPathsToOpen(openConfig);
            this.logService.trace('windowsManager#open pathsToOpen', pathsToOpen);
            for (const path of pathsToOpen) {
                if (isSingleFolderWorkspacePathToOpen(path)) {
                    if (openConfig.addMode) {
                        // When run with --add, take the folders that are to be opened as
                        // folders that should be added to the currently active window.
                        foldersToAdd.push(path);
                    }
                    else {
                        foldersToOpen.push(path);
                    }
                }
                else if (isWorkspacePathToOpen(path)) {
                    workspacesToOpen.push(path);
                }
                else if (path.fileUri) {
                    if (!filesToOpen) {
                        filesToOpen = { filesToOpenOrCreate: [], filesToDiff: [], filesToMerge: [], remoteAuthority: path.remoteAuthority };
                    }
                    filesToOpen.filesToOpenOrCreate.push(path);
                }
                else if (path.backupPath) {
                    emptyWindowsWithBackupsToRestore.push({ backupFolder: (0, path_1.basename)(path.backupPath), remoteAuthority: path.remoteAuthority });
                }
                else {
                    emptyToOpen++;
                }
            }
            // When run with --diff, take the first 2 files to open as files to diff
            if (openConfig.diffMode && filesToOpen && filesToOpen.filesToOpenOrCreate.length >= 2) {
                filesToOpen.filesToDiff = filesToOpen.filesToOpenOrCreate.slice(0, 2);
                filesToOpen.filesToOpenOrCreate = [];
            }
            // When run with --merge, take the first 4 files to open as files to merge
            if (openConfig.mergeMode && filesToOpen && filesToOpen.filesToOpenOrCreate.length === 4) {
                filesToOpen.filesToMerge = filesToOpen.filesToOpenOrCreate.slice(0, 4);
                filesToOpen.filesToOpenOrCreate = [];
                filesToOpen.filesToDiff = [];
            }
            // When run with --wait, make sure we keep the paths to wait for
            if (filesToOpen && openConfig.waitMarkerFileURI) {
                filesToOpen.filesToWait = { paths: (0, arrays_1.coalesce)([...filesToOpen.filesToDiff, filesToOpen.filesToMerge[3] /* [3] is the resulting merge file */, ...filesToOpen.filesToOpenOrCreate]), waitMarkerFileUri: openConfig.waitMarkerFileURI };
            }
            // These are windows to restore because of hot-exit or from previous session (only performed once on startup!)
            if (openConfig.initialStartup) {
                // Untitled workspaces are always restored
                untitledWorkspacesToRestore.push(...this.workspacesManagementMainService.getUntitledWorkspaces());
                workspacesToOpen.push(...untitledWorkspacesToRestore);
                // Empty windows with backups are always restored
                emptyWindowsWithBackupsToRestore.push(...this.backupMainService.getEmptyWindowBackups());
            }
            else {
                emptyWindowsWithBackupsToRestore.length = 0;
            }
            // Open based on config
            const { windows: usedWindows, filesOpenedInWindow } = await this.doOpen(openConfig, workspacesToOpen, foldersToOpen, emptyWindowsWithBackupsToRestore, emptyToOpen, filesToOpen, foldersToAdd);
            this.logService.trace(`windowsManager#open used window count ${usedWindows.length} (workspacesToOpen: ${workspacesToOpen.length}, foldersToOpen: ${foldersToOpen.length}, emptyToRestore: ${emptyWindowsWithBackupsToRestore.length}, emptyToOpen: ${emptyToOpen})`);
            // Make sure to pass focus to the most relevant of the windows if we open multiple
            if (usedWindows.length > 1) {
                // 1.) focus window we opened files in always with highest priority
                if (filesOpenedInWindow) {
                    filesOpenedInWindow.focus();
                }
                // Otherwise, find a good window based on open params
                else {
                    const focusLastActive = this.windowsStateHandler.state.lastActiveWindow && !openConfig.forceEmpty && !openConfig.cli._.length && !openConfig.cli['file-uri'] && !openConfig.cli['folder-uri'] && !(openConfig.urisToOpen && openConfig.urisToOpen.length);
                    let focusLastOpened = true;
                    let focusLastWindow = true;
                    // 2.) focus last active window if we are not instructed to open any paths
                    if (focusLastActive) {
                        const lastActiveWindow = usedWindows.filter(window => this.windowsStateHandler.state.lastActiveWindow && window.backupPath === this.windowsStateHandler.state.lastActiveWindow.backupPath);
                        if (lastActiveWindow.length) {
                            lastActiveWindow[0].focus();
                            focusLastOpened = false;
                            focusLastWindow = false;
                        }
                    }
                    // 3.) if instructed to open paths, focus last window which is not restored
                    if (focusLastOpened) {
                        for (let i = usedWindows.length - 1; i >= 0; i--) {
                            const usedWindow = usedWindows[i];
                            if ((usedWindow.openedWorkspace && untitledWorkspacesToRestore.some(workspace => usedWindow.openedWorkspace && workspace.workspace.id === usedWindow.openedWorkspace.id)) || // skip over restored workspace
                                (usedWindow.backupPath && emptyWindowsWithBackupsToRestore.some(empty => usedWindow.backupPath && empty.backupFolder === (0, path_1.basename)(usedWindow.backupPath))) // skip over restored empty window
                            ) {
                                continue;
                            }
                            usedWindow.focus();
                            focusLastWindow = false;
                            break;
                        }
                    }
                    // 4.) finally, always ensure to have at least last used window focused
                    if (focusLastWindow) {
                        usedWindows[usedWindows.length - 1].focus();
                    }
                }
            }
            // Remember in recent document list (unless this opens for extension development)
            // Also do not add paths when files are opened for diffing or merging, only if opened individually
            const isDiff = filesToOpen && filesToOpen.filesToDiff.length > 0;
            const isMerge = filesToOpen && filesToOpen.filesToMerge.length > 0;
            if (!usedWindows.some(window => window.isExtensionDevelopmentHost) && !isDiff && !isMerge && !openConfig.noRecentEntry) {
                const recents = [];
                for (const pathToOpen of pathsToOpen) {
                    if (isWorkspacePathToOpen(pathToOpen) && !pathToOpen.transient /* never add transient workspaces to history */) {
                        recents.push({ label: pathToOpen.label, workspace: pathToOpen.workspace, remoteAuthority: pathToOpen.remoteAuthority });
                    }
                    else if (isSingleFolderWorkspacePathToOpen(pathToOpen)) {
                        recents.push({ label: pathToOpen.label, folderUri: pathToOpen.workspace.uri, remoteAuthority: pathToOpen.remoteAuthority });
                    }
                    else if (pathToOpen.fileUri) {
                        recents.push({ label: pathToOpen.label, fileUri: pathToOpen.fileUri, remoteAuthority: pathToOpen.remoteAuthority });
                    }
                }
                this.workspacesHistoryMainService.addRecentlyOpened(recents);
            }
            // Handle --wait
            this.handleWaitMarkerFile(openConfig, usedWindows);
            return usedWindows;
        }
        handleWaitMarkerFile(openConfig, usedWindows) {
            // If we got started with --wait from the CLI, we need to signal to the outside when the window
            // used for the edit operation is closed or loaded to a different folder so that the waiting
            // process can continue. We do this by deleting the waitMarkerFilePath.
            const waitMarkerFileURI = openConfig.waitMarkerFileURI;
            if (openConfig.context === 0 /* OpenContext.CLI */ && waitMarkerFileURI && usedWindows.length === 1 && usedWindows[0]) {
                (async () => {
                    await usedWindows[0].whenClosedOrLoaded;
                    try {
                        await this.fileService.del(waitMarkerFileURI);
                    }
                    catch (error) {
                        // ignore - could have been deleted from the window already
                    }
                })();
            }
        }
        async doOpen(openConfig, workspacesToOpen, foldersToOpen, emptyToRestore, emptyToOpen, filesToOpen, foldersToAdd) {
            // Keep track of used windows and remember
            // if files have been opened in one of them
            const usedWindows = [];
            let filesOpenedInWindow = undefined;
            function addUsedWindow(window, openedFiles) {
                usedWindows.push(window);
                if (openedFiles) {
                    filesOpenedInWindow = window;
                    filesToOpen = undefined; // reset `filesToOpen` since files have been opened
                }
            }
            // Settings can decide if files/folders open in new window or not
            let { openFolderInNewWindow, openFilesInNewWindow } = this.shouldOpenNewWindow(openConfig);
            // Handle folders to add by looking for the last active workspace (not on initial startup)
            if (!openConfig.initialStartup && foldersToAdd.length > 0) {
                const authority = foldersToAdd[0].remoteAuthority;
                const lastActiveWindow = this.getLastActiveWindowForAuthority(authority);
                if (lastActiveWindow) {
                    addUsedWindow(this.doAddFoldersToExistingWindow(lastActiveWindow, foldersToAdd.map(folderToAdd => folderToAdd.workspace.uri)));
                }
            }
            // Handle files to open/diff/merge or to create when we dont open a folder and we do not restore any
            // folder/untitled from hot-exit by trying to open them in the window that fits best
            const potentialNewWindowsCount = foldersToOpen.length + workspacesToOpen.length + emptyToRestore.length;
            if (filesToOpen && potentialNewWindowsCount === 0) {
                // Find suitable window or folder path to open files in
                const fileToCheck = filesToOpen.filesToOpenOrCreate[0] || filesToOpen.filesToDiff[0] || filesToOpen.filesToMerge[3] /* [3] is the resulting merge file */;
                // only look at the windows with correct authority
                const windows = this.getWindows().filter(window => filesToOpen && (0, resources_1.isEqualAuthority)(window.remoteAuthority, filesToOpen.remoteAuthority));
                // figure out a good window to open the files in if any
                // with a fallback to the last active window.
                //
                // in case `openFilesInNewWindow` is enforced, we skip
                // this step.
                let windowToUseForFiles = undefined;
                if (fileToCheck?.fileUri && !openFilesInNewWindow) {
                    if (openConfig.context === 4 /* OpenContext.DESKTOP */ || openConfig.context === 0 /* OpenContext.CLI */ || openConfig.context === 1 /* OpenContext.DOCK */) {
                        windowToUseForFiles = await (0, windowsFinder_1.findWindowOnFile)(windows, fileToCheck.fileUri, async (workspace) => workspace.configPath.scheme === network_1.Schemas.file ? this.workspacesManagementMainService.resolveLocalWorkspace(workspace.configPath) : undefined);
                    }
                    if (!windowToUseForFiles) {
                        windowToUseForFiles = this.doGetLastActiveWindow(windows);
                    }
                }
                // We found a window to open the files in
                if (windowToUseForFiles) {
                    // Window is workspace
                    if ((0, workspace_1.isWorkspaceIdentifier)(windowToUseForFiles.openedWorkspace)) {
                        workspacesToOpen.push({ workspace: windowToUseForFiles.openedWorkspace, remoteAuthority: windowToUseForFiles.remoteAuthority });
                    }
                    // Window is single folder
                    else if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(windowToUseForFiles.openedWorkspace)) {
                        foldersToOpen.push({ workspace: windowToUseForFiles.openedWorkspace, remoteAuthority: windowToUseForFiles.remoteAuthority });
                    }
                    // Window is empty
                    else {
                        addUsedWindow(this.doOpenFilesInExistingWindow(openConfig, windowToUseForFiles, filesToOpen), true);
                    }
                }
                // Finally, if no window or folder is found, just open the files in an empty window
                else {
                    addUsedWindow(await this.openInBrowserWindow({
                        userEnv: openConfig.userEnv,
                        cli: openConfig.cli,
                        initialStartup: openConfig.initialStartup,
                        filesToOpen,
                        forceNewWindow: true,
                        remoteAuthority: filesToOpen.remoteAuthority,
                        forceNewTabbedWindow: openConfig.forceNewTabbedWindow,
                        forceProfile: openConfig.forceProfile,
                        forceTempProfile: openConfig.forceTempProfile
                    }), true);
                }
            }
            // Handle workspaces to open (instructed and to restore)
            const allWorkspacesToOpen = (0, arrays_1.distinct)(workspacesToOpen, workspace => workspace.workspace.id); // prevent duplicates
            if (allWorkspacesToOpen.length > 0) {
                // Check for existing instances
                const windowsOnWorkspace = (0, arrays_1.coalesce)(allWorkspacesToOpen.map(workspaceToOpen => (0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(this.getWindows(), workspaceToOpen.workspace.configPath)));
                if (windowsOnWorkspace.length > 0) {
                    const windowOnWorkspace = windowsOnWorkspace[0];
                    const filesToOpenInWindow = (0, resources_1.isEqualAuthority)(filesToOpen?.remoteAuthority, windowOnWorkspace.remoteAuthority) ? filesToOpen : undefined;
                    // Do open files
                    addUsedWindow(this.doOpenFilesInExistingWindow(openConfig, windowOnWorkspace, filesToOpenInWindow), !!filesToOpenInWindow);
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                }
                // Open remaining ones
                for (const workspaceToOpen of allWorkspacesToOpen) {
                    if (windowsOnWorkspace.some(window => window.openedWorkspace && window.openedWorkspace.id === workspaceToOpen.workspace.id)) {
                        continue; // ignore folders that are already open
                    }
                    const remoteAuthority = workspaceToOpen.remoteAuthority;
                    const filesToOpenInWindow = (0, resources_1.isEqualAuthority)(filesToOpen?.remoteAuthority, remoteAuthority) ? filesToOpen : undefined;
                    // Do open folder
                    addUsedWindow(await this.doOpenFolderOrWorkspace(openConfig, workspaceToOpen, openFolderInNewWindow, filesToOpenInWindow), !!filesToOpenInWindow);
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                }
            }
            // Handle folders to open (instructed and to restore)
            const allFoldersToOpen = (0, arrays_1.distinct)(foldersToOpen, folder => resources_1.extUriBiasedIgnorePathCase.getComparisonKey(folder.workspace.uri)); // prevent duplicates
            if (allFoldersToOpen.length > 0) {
                // Check for existing instances
                const windowsOnFolderPath = (0, arrays_1.coalesce)(allFoldersToOpen.map(folderToOpen => (0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(this.getWindows(), folderToOpen.workspace.uri)));
                if (windowsOnFolderPath.length > 0) {
                    const windowOnFolderPath = windowsOnFolderPath[0];
                    const filesToOpenInWindow = (0, resources_1.isEqualAuthority)(filesToOpen?.remoteAuthority, windowOnFolderPath.remoteAuthority) ? filesToOpen : undefined;
                    // Do open files
                    addUsedWindow(this.doOpenFilesInExistingWindow(openConfig, windowOnFolderPath, filesToOpenInWindow), !!filesToOpenInWindow);
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                }
                // Open remaining ones
                for (const folderToOpen of allFoldersToOpen) {
                    if (windowsOnFolderPath.some(window => (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.openedWorkspace) && resources_1.extUriBiasedIgnorePathCase.isEqual(window.openedWorkspace.uri, folderToOpen.workspace.uri))) {
                        continue; // ignore folders that are already open
                    }
                    const remoteAuthority = folderToOpen.remoteAuthority;
                    const filesToOpenInWindow = (0, resources_1.isEqualAuthority)(filesToOpen?.remoteAuthority, remoteAuthority) ? filesToOpen : undefined;
                    // Do open folder
                    addUsedWindow(await this.doOpenFolderOrWorkspace(openConfig, folderToOpen, openFolderInNewWindow, filesToOpenInWindow), !!filesToOpenInWindow);
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                }
            }
            // Handle empty to restore
            const allEmptyToRestore = (0, arrays_1.distinct)(emptyToRestore, info => info.backupFolder); // prevent duplicates
            if (allEmptyToRestore.length > 0) {
                for (const emptyWindowBackupInfo of allEmptyToRestore) {
                    const remoteAuthority = emptyWindowBackupInfo.remoteAuthority;
                    const filesToOpenInWindow = (0, resources_1.isEqualAuthority)(filesToOpen?.remoteAuthority, remoteAuthority) ? filesToOpen : undefined;
                    addUsedWindow(await this.doOpenEmpty(openConfig, true, remoteAuthority, filesToOpenInWindow, emptyWindowBackupInfo), !!filesToOpenInWindow);
                    openFolderInNewWindow = true; // any other folders to open must open in new window then
                }
            }
            // Handle empty to open (only if no other window opened)
            if (usedWindows.length === 0 || filesToOpen) {
                if (filesToOpen && !emptyToOpen) {
                    emptyToOpen++;
                }
                const remoteAuthority = filesToOpen ? filesToOpen.remoteAuthority : openConfig.remoteAuthority;
                for (let i = 0; i < emptyToOpen; i++) {
                    addUsedWindow(await this.doOpenEmpty(openConfig, openFolderInNewWindow, remoteAuthority, filesToOpen), !!filesToOpen);
                    // any other window to open must open in new window then
                    openFolderInNewWindow = true;
                }
            }
            return { windows: (0, arrays_1.distinct)(usedWindows), filesOpenedInWindow };
        }
        doOpenFilesInExistingWindow(configuration, window, filesToOpen) {
            this.logService.trace('windowsManager#doOpenFilesInExistingWindow', { filesToOpen });
            this.focusMainOrChildWindow(window); // make sure window or any of the children has focus
            const params = {
                filesToOpenOrCreate: filesToOpen?.filesToOpenOrCreate,
                filesToDiff: filesToOpen?.filesToDiff,
                filesToMerge: filesToOpen?.filesToMerge,
                filesToWait: filesToOpen?.filesToWait,
                termProgram: configuration?.userEnv?.['TERM_PROGRAM']
            };
            window.sendWhenReady('vscode:openFiles', cancellation_1.CancellationToken.None, params);
            return window;
        }
        focusMainOrChildWindow(mainWindow) {
            let windowToFocus = mainWindow;
            const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
            if (focusedWindow && focusedWindow.id !== mainWindow.id) {
                const auxiliaryWindowCandidate = this.auxiliaryWindowsMainService.getWindowByWebContents(focusedWindow.webContents);
                if (auxiliaryWindowCandidate && auxiliaryWindowCandidate.parentId === mainWindow.id) {
                    windowToFocus = auxiliaryWindowCandidate;
                }
            }
            windowToFocus.focus();
        }
        doAddFoldersToExistingWindow(window, foldersToAdd) {
            this.logService.trace('windowsManager#doAddFoldersToExistingWindow', { foldersToAdd });
            window.focus(); // make sure window has focus
            const request = { foldersToAdd };
            window.sendWhenReady('vscode:addFolders', cancellation_1.CancellationToken.None, request);
            return window;
        }
        doOpenEmpty(openConfig, forceNewWindow, remoteAuthority, filesToOpen, emptyWindowBackupInfo) {
            this.logService.trace('windowsManager#doOpenEmpty', { restore: !!emptyWindowBackupInfo, remoteAuthority, filesToOpen, forceNewWindow });
            let windowToUse;
            if (!forceNewWindow && typeof openConfig.contextWindowId === 'number') {
                windowToUse = this.getWindowById(openConfig.contextWindowId); // fix for https://github.com/microsoft/vscode/issues/97172
            }
            return this.openInBrowserWindow({
                userEnv: openConfig.userEnv,
                cli: openConfig.cli,
                initialStartup: openConfig.initialStartup,
                remoteAuthority,
                forceNewWindow,
                forceNewTabbedWindow: openConfig.forceNewTabbedWindow,
                filesToOpen,
                windowToUse,
                emptyWindowBackupInfo,
                forceProfile: openConfig.forceProfile,
                forceTempProfile: openConfig.forceTempProfile
            });
        }
        doOpenFolderOrWorkspace(openConfig, folderOrWorkspace, forceNewWindow, filesToOpen, windowToUse) {
            this.logService.trace('windowsManager#doOpenFolderOrWorkspace', { folderOrWorkspace, filesToOpen });
            if (!forceNewWindow && !windowToUse && typeof openConfig.contextWindowId === 'number') {
                windowToUse = this.getWindowById(openConfig.contextWindowId); // fix for https://github.com/microsoft/vscode/issues/49587
            }
            return this.openInBrowserWindow({
                workspace: folderOrWorkspace.workspace,
                userEnv: openConfig.userEnv,
                cli: openConfig.cli,
                initialStartup: openConfig.initialStartup,
                remoteAuthority: folderOrWorkspace.remoteAuthority,
                forceNewWindow,
                forceNewTabbedWindow: openConfig.forceNewTabbedWindow,
                filesToOpen,
                windowToUse,
                forceProfile: openConfig.forceProfile,
                forceTempProfile: openConfig.forceTempProfile
            });
        }
        async getPathsToOpen(openConfig) {
            let pathsToOpen;
            let isCommandLineOrAPICall = false;
            let restoredWindows = false;
            // Extract paths: from API
            if (openConfig.urisToOpen && openConfig.urisToOpen.length > 0) {
                pathsToOpen = await this.doExtractPathsFromAPI(openConfig);
                isCommandLineOrAPICall = true;
            }
            // Check for force empty
            else if (openConfig.forceEmpty) {
                pathsToOpen = [Object.create(null)];
            }
            // Extract paths: from CLI
            else if (openConfig.cli._.length || openConfig.cli['folder-uri'] || openConfig.cli['file-uri']) {
                pathsToOpen = await this.doExtractPathsFromCLI(openConfig.cli);
                if (pathsToOpen.length === 0) {
                    pathsToOpen.push(Object.create(null)); // add an empty window if we did not have windows to open from command line
                }
                isCommandLineOrAPICall = true;
            }
            // Extract paths: from previous session
            else {
                pathsToOpen = await this.doGetPathsFromLastSession();
                if (pathsToOpen.length === 0) {
                    pathsToOpen.push(Object.create(null)); // add an empty window if we did not have windows to restore
                }
                restoredWindows = true;
            }
            // Convert multiple folders into workspace (if opened via API or CLI)
            // This will ensure to open these folders in one window instead of multiple
            // If we are in `addMode`, we should not do this because in that case all
            // folders should be added to the existing window.
            if (!openConfig.addMode && isCommandLineOrAPICall) {
                const foldersToOpen = pathsToOpen.filter(path => isSingleFolderWorkspacePathToOpen(path));
                if (foldersToOpen.length > 1) {
                    const remoteAuthority = foldersToOpen[0].remoteAuthority;
                    if (foldersToOpen.every(folderToOpen => (0, resources_1.isEqualAuthority)(folderToOpen.remoteAuthority, remoteAuthority))) { // only if all folder have the same authority
                        const workspace = await this.workspacesManagementMainService.createUntitledWorkspace(foldersToOpen.map(folder => ({ uri: folder.workspace.uri })));
                        // Add workspace and remove folders thereby
                        pathsToOpen.push({ workspace, remoteAuthority });
                        pathsToOpen = pathsToOpen.filter(path => !isSingleFolderWorkspacePathToOpen(path));
                    }
                }
            }
            // Check for `window.startup` setting to include all windows
            // from the previous session if this is the initial startup and we have
            // not restored windows already otherwise.
            // Use `unshift` to ensure any new window to open comes last
            // for proper focus treatment.
            if (openConfig.initialStartup && !restoredWindows && this.configurationService.getValue('window')?.restoreWindows === 'preserve') {
                const lastSessionPaths = await this.doGetPathsFromLastSession();
                pathsToOpen.unshift(...lastSessionPaths.filter(path => isWorkspacePathToOpen(path) || isSingleFolderWorkspacePathToOpen(path) || path.backupPath));
            }
            return pathsToOpen;
        }
        async doExtractPathsFromAPI(openConfig) {
            const pathResolveOptions = {
                gotoLineMode: openConfig.gotoLineMode,
                remoteAuthority: openConfig.remoteAuthority
            };
            const pathsToOpen = await Promise.all((0, arrays_1.coalesce)(openConfig.urisToOpen || []).map(async (pathToOpen) => {
                const path = await this.resolveOpenable(pathToOpen, pathResolveOptions);
                // Path exists
                if (path) {
                    path.label = pathToOpen.label;
                    return path;
                }
                // Path does not exist: show a warning box
                const uri = this.resourceFromOpenable(pathToOpen);
                this.dialogMainService.showMessageBox({
                    type: 'info',
                    buttons: [(0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK")],
                    message: uri.scheme === network_1.Schemas.file ? (0, nls_1.localize)('pathNotExistTitle', "Path does not exist") : (0, nls_1.localize)('uriInvalidTitle', "URI can not be opened"),
                    detail: uri.scheme === network_1.Schemas.file ?
                        (0, nls_1.localize)('pathNotExistDetail', "The path '{0}' does not exist on this computer.", (0, labels_1.getPathLabel)(uri, { os: platform_1.OS, tildify: this.environmentMainService })) :
                        (0, nls_1.localize)('uriInvalidDetail', "The URI '{0}' is not valid and can not be opened.", uri.toString(true))
                }, electron_1.BrowserWindow.getFocusedWindow() ?? undefined);
                return undefined;
            }));
            return (0, arrays_1.coalesce)(pathsToOpen);
        }
        async doExtractPathsFromCLI(cli) {
            const pathsToOpen = [];
            const pathResolveOptions = {
                ignoreFileNotFound: true,
                gotoLineMode: cli.goto,
                remoteAuthority: cli.remote || undefined,
                forceOpenWorkspaceAsFile: 
                // special case diff / merge mode to force open
                // workspace as file
                // https://github.com/microsoft/vscode/issues/149731
                cli.diff && cli._.length === 2 ||
                    cli.merge && cli._.length === 4
            };
            // folder uris
            const folderUris = cli['folder-uri'];
            if (folderUris) {
                const resolvedFolderUris = await Promise.all(folderUris.map(rawFolderUri => {
                    const folderUri = this.cliArgToUri(rawFolderUri);
                    if (!folderUri) {
                        return undefined;
                    }
                    return this.resolveOpenable({ folderUri }, pathResolveOptions);
                }));
                pathsToOpen.push(...(0, arrays_1.coalesce)(resolvedFolderUris));
            }
            // file uris
            const fileUris = cli['file-uri'];
            if (fileUris) {
                const resolvedFileUris = await Promise.all(fileUris.map(rawFileUri => {
                    const fileUri = this.cliArgToUri(rawFileUri);
                    if (!fileUri) {
                        return undefined;
                    }
                    return this.resolveOpenable((0, workspace_1.hasWorkspaceFileExtension)(rawFileUri) ? { workspaceUri: fileUri } : { fileUri }, pathResolveOptions);
                }));
                pathsToOpen.push(...(0, arrays_1.coalesce)(resolvedFileUris));
            }
            // folder or file paths
            const resolvedCliPaths = await Promise.all(cli._.map(cliPath => {
                return pathResolveOptions.remoteAuthority ? this.doResolveRemotePath(cliPath, pathResolveOptions) : this.doResolveFilePath(cliPath, pathResolveOptions);
            }));
            pathsToOpen.push(...(0, arrays_1.coalesce)(resolvedCliPaths));
            return pathsToOpen;
        }
        cliArgToUri(arg) {
            try {
                const uri = uri_1.URI.parse(arg);
                if (!uri.scheme) {
                    this.logService.error(`Invalid URI input string, scheme missing: ${arg}`);
                    return undefined;
                }
                if (!uri.path) {
                    return uri.with({ path: '/' });
                }
                return uri;
            }
            catch (e) {
                this.logService.error(`Invalid URI input string: ${arg}, ${e.message}`);
            }
            return undefined;
        }
        async doGetPathsFromLastSession() {
            const restoreWindowsSetting = this.getRestoreWindowsSetting();
            switch (restoreWindowsSetting) {
                // none: no window to restore
                case 'none':
                    return [];
                // one: restore last opened workspace/folder or empty window
                // all: restore all windows
                // folders: restore last opened folders only
                case 'one':
                case 'all':
                case 'preserve':
                case 'folders': {
                    // Collect previously opened windows
                    const lastSessionWindows = [];
                    if (restoreWindowsSetting !== 'one') {
                        lastSessionWindows.push(...this.windowsStateHandler.state.openedWindows);
                    }
                    if (this.windowsStateHandler.state.lastActiveWindow) {
                        lastSessionWindows.push(this.windowsStateHandler.state.lastActiveWindow);
                    }
                    const pathsToOpen = await Promise.all(lastSessionWindows.map(async (lastSessionWindow) => {
                        // Workspaces
                        if (lastSessionWindow.workspace) {
                            const pathToOpen = await this.resolveOpenable({ workspaceUri: lastSessionWindow.workspace.configPath }, { remoteAuthority: lastSessionWindow.remoteAuthority, rejectTransientWorkspaces: true /* https://github.com/microsoft/vscode/issues/119695 */ });
                            if (isWorkspacePathToOpen(pathToOpen)) {
                                return pathToOpen;
                            }
                        }
                        // Folders
                        else if (lastSessionWindow.folderUri) {
                            const pathToOpen = await this.resolveOpenable({ folderUri: lastSessionWindow.folderUri }, { remoteAuthority: lastSessionWindow.remoteAuthority });
                            if (isSingleFolderWorkspacePathToOpen(pathToOpen)) {
                                return pathToOpen;
                            }
                        }
                        // Empty window, potentially editors open to be restored
                        else if (restoreWindowsSetting !== 'folders' && lastSessionWindow.backupPath) {
                            return { backupPath: lastSessionWindow.backupPath, remoteAuthority: lastSessionWindow.remoteAuthority };
                        }
                        return undefined;
                    }));
                    return (0, arrays_1.coalesce)(pathsToOpen);
                }
            }
        }
        getRestoreWindowsSetting() {
            let restoreWindows;
            if (this.lifecycleMainService.wasRestarted) {
                restoreWindows = 'all'; // always reopen all windows when an update was applied
            }
            else {
                const windowConfig = this.configurationService.getValue('window');
                restoreWindows = windowConfig?.restoreWindows || 'all'; // by default restore all windows
                if (!['preserve', 'all', 'folders', 'one', 'none'].includes(restoreWindows)) {
                    restoreWindows = 'all'; // by default restore all windows
                }
            }
            return restoreWindows;
        }
        async resolveOpenable(openable, options = Object.create(null)) {
            // handle file:// openables with some extra validation
            const uri = this.resourceFromOpenable(openable);
            if (uri.scheme === network_1.Schemas.file) {
                if ((0, window_1.isFileToOpen)(openable)) {
                    options = { ...options, forceOpenWorkspaceAsFile: true };
                }
                return this.doResolveFilePath(uri.fsPath, options);
            }
            // handle non file:// openables
            return this.doResolveRemoteOpenable(openable, options);
        }
        doResolveRemoteOpenable(openable, options) {
            let uri = this.resourceFromOpenable(openable);
            // use remote authority from vscode
            const remoteAuthority = (0, remoteHosts_1.getRemoteAuthority)(uri) || options.remoteAuthority;
            // normalize URI
            uri = (0, resources_1.removeTrailingPathSeparator)((0, resources_1.normalizePath)(uri));
            // File
            if ((0, window_1.isFileToOpen)(openable)) {
                if (options.gotoLineMode) {
                    const { path, line, column } = (0, extpath_1.parseLineAndColumnAware)(uri.path);
                    return {
                        fileUri: uri.with({ path }),
                        options: {
                            selection: line ? { startLineNumber: line, startColumn: column || 1 } : undefined
                        },
                        remoteAuthority
                    };
                }
                return { fileUri: uri, remoteAuthority };
            }
            // Workspace
            else if ((0, window_1.isWorkspaceToOpen)(openable)) {
                return { workspace: (0, workspaces_1.getWorkspaceIdentifier)(uri), remoteAuthority };
            }
            // Folder
            return { workspace: (0, workspaces_1.getSingleFolderWorkspaceIdentifier)(uri), remoteAuthority };
        }
        resourceFromOpenable(openable) {
            if ((0, window_1.isWorkspaceToOpen)(openable)) {
                return openable.workspaceUri;
            }
            if ((0, window_1.isFolderToOpen)(openable)) {
                return openable.folderUri;
            }
            return openable.fileUri;
        }
        async doResolveFilePath(path, options, skipHandleUNCError) {
            // Extract line/col information from path
            let lineNumber;
            let columnNumber;
            if (options.gotoLineMode) {
                ({ path, line: lineNumber, column: columnNumber } = (0, extpath_1.parseLineAndColumnAware)(path));
            }
            // Ensure the path is normalized and absolute
            path = (0, extpath_1.sanitizeFilePath)((0, path_1.normalize)(path), (0, process_1.cwd)());
            try {
                const pathStat = await pfs_1.Promises.stat(path);
                // File
                if (pathStat.isFile()) {
                    // Workspace (unless disabled via flag)
                    if (!options.forceOpenWorkspaceAsFile) {
                        const workspace = await this.workspacesManagementMainService.resolveLocalWorkspace(uri_1.URI.file(path));
                        if (workspace) {
                            // If the workspace is transient and we are to ignore
                            // transient workspaces, reject it.
                            if (workspace.transient && options.rejectTransientWorkspaces) {
                                return undefined;
                            }
                            return {
                                workspace: { id: workspace.id, configPath: workspace.configPath },
                                type: files_1.FileType.File,
                                exists: true,
                                remoteAuthority: workspace.remoteAuthority,
                                transient: workspace.transient
                            };
                        }
                    }
                    return {
                        fileUri: uri_1.URI.file(path),
                        type: files_1.FileType.File,
                        exists: true,
                        options: {
                            selection: lineNumber ? { startLineNumber: lineNumber, startColumn: columnNumber || 1 } : undefined
                        }
                    };
                }
                // Folder
                else if (pathStat.isDirectory()) {
                    return {
                        workspace: (0, workspaces_1.getSingleFolderWorkspaceIdentifier)(uri_1.URI.file(path), pathStat),
                        type: files_1.FileType.Directory,
                        exists: true
                    };
                }
                // Special device: in POSIX environments, we may get /dev/null passed
                // in (for example git uses it to signal one side of a diff does not
                // exist). In that special case, treat it like a file to support this
                // scenario ()
                else if (!platform_1.isWindows && path === '/dev/null') {
                    return {
                        fileUri: uri_1.URI.file(path),
                        type: files_1.FileType.File,
                        exists: true
                    };
                }
            }
            catch (error) {
                if (error.code === 'ERR_UNC_HOST_NOT_ALLOWED' && !skipHandleUNCError) {
                    return this.onUNCHostNotAllowed(path, options);
                }
                const fileUri = uri_1.URI.file(path);
                // since file does not seem to exist anymore, remove from recent
                this.workspacesHistoryMainService.removeRecentlyOpened([fileUri]);
                // assume this is a file that does not yet exist
                if (options.ignoreFileNotFound) {
                    return {
                        fileUri,
                        type: files_1.FileType.File,
                        exists: false
                    };
                }
            }
            return undefined;
        }
        async onUNCHostNotAllowed(path, options) {
            const uri = uri_1.URI.file(path);
            const { response, checkboxChecked } = await this.dialogMainService.showMessageBox({
                type: 'warning',
                buttons: [
                    (0, nls_1.localize)({ key: 'allow', comment: ['&& denotes a mnemonic'] }, "&&Allow"),
                    (0, nls_1.localize)({ key: 'cancel', comment: ['&& denotes a mnemonic'] }, "&&Cancel"),
                    (0, nls_1.localize)({ key: 'learnMore', comment: ['&& denotes a mnemonic'] }, "&&Learn More"),
                ],
                message: (0, nls_1.localize)('confirmOpenMessage', "The host '{0}' was not found in the list of allowed hosts. Do you want to allow it anyway?", uri.authority),
                detail: (0, nls_1.localize)('confirmOpenDetail', "The path '{0}' uses a host that is not allowed. Unless you trust the host, you should press 'Cancel'", (0, labels_1.getPathLabel)(uri, { os: platform_1.OS, tildify: this.environmentMainService })),
                checkboxLabel: (0, nls_1.localize)('doNotAskAgain', "Permanently allow host '{0}'", uri.authority),
                cancelId: 1
            });
            if (response === 0) {
                (0, unc_1.addUNCHostToAllowlist)(uri.authority);
                if (checkboxChecked) {
                    // Due to https://github.com/microsoft/vscode/issues/195436, we can only
                    // update settings from within a window. But we do not know if a window
                    // is about to open or can already handle the request, so we have to send
                    // to any current window and any newly opening window.
                    const request = { channel: 'vscode:configureAllowedUNCHost', args: uri.authority };
                    this.sendToFocused(request.channel, request.args);
                    this.sendToOpeningWindow(request.channel, request.args);
                }
                return this.doResolveFilePath(path, options, true /* do not handle UNC error again */);
            }
            if (response === 2) {
                electron_1.shell.openExternal('https://aka.ms/vscode-windows-unc');
                return this.onUNCHostNotAllowed(path, options); // keep showing the dialog until decision (https://github.com/microsoft/vscode/issues/181956)
            }
            return undefined;
        }
        doResolveRemotePath(path, options) {
            const first = path.charCodeAt(0);
            const remoteAuthority = options.remoteAuthority;
            // Extract line/col information from path
            let lineNumber;
            let columnNumber;
            if (options.gotoLineMode) {
                ({ path, line: lineNumber, column: columnNumber } = (0, extpath_1.parseLineAndColumnAware)(path));
            }
            // make absolute
            if (first !== 47 /* CharCode.Slash */) {
                if ((0, extpath_1.isWindowsDriveLetter)(first) && path.charCodeAt(path.charCodeAt(1)) === 58 /* CharCode.Colon */) {
                    path = (0, extpath_1.toSlashes)(path);
                }
                path = `/${path}`;
            }
            const uri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, authority: remoteAuthority, path: path });
            // guess the file type:
            // - if it ends with a slash it's a folder
            // - if in goto line mode or if it has a file extension, it's a file or a workspace
            // - by defaults it's a folder
            if (path.charCodeAt(path.length - 1) !== 47 /* CharCode.Slash */) {
                // file name ends with .code-workspace
                if ((0, workspace_1.hasWorkspaceFileExtension)(path)) {
                    if (options.forceOpenWorkspaceAsFile) {
                        return {
                            fileUri: uri,
                            options: {
                                selection: lineNumber ? { startLineNumber: lineNumber, startColumn: columnNumber || 1 } : undefined
                            },
                            remoteAuthority: options.remoteAuthority
                        };
                    }
                    return { workspace: (0, workspaces_1.getWorkspaceIdentifier)(uri), remoteAuthority };
                }
                // file name starts with a dot or has an file extension
                else if (options.gotoLineMode || path_1.posix.basename(path).indexOf('.') !== -1) {
                    return {
                        fileUri: uri,
                        options: {
                            selection: lineNumber ? { startLineNumber: lineNumber, startColumn: columnNumber || 1 } : undefined
                        },
                        remoteAuthority
                    };
                }
            }
            return { workspace: (0, workspaces_1.getSingleFolderWorkspaceIdentifier)(uri), remoteAuthority };
        }
        shouldOpenNewWindow(openConfig) {
            // let the user settings override how folders are open in a new window or same window unless we are forced
            const windowConfig = this.configurationService.getValue('window');
            const openFolderInNewWindowConfig = windowConfig?.openFoldersInNewWindow || 'default' /* default */;
            const openFilesInNewWindowConfig = windowConfig?.openFilesInNewWindow || 'off' /* default */;
            let openFolderInNewWindow = (openConfig.preferNewWindow || openConfig.forceNewWindow) && !openConfig.forceReuseWindow;
            if (!openConfig.forceNewWindow && !openConfig.forceReuseWindow && (openFolderInNewWindowConfig === 'on' || openFolderInNewWindowConfig === 'off')) {
                openFolderInNewWindow = (openFolderInNewWindowConfig === 'on');
            }
            // let the user settings override how files are open in a new window or same window unless we are forced (not for extension development though)
            let openFilesInNewWindow = false;
            if (openConfig.forceNewWindow || openConfig.forceReuseWindow) {
                openFilesInNewWindow = !!openConfig.forceNewWindow && !openConfig.forceReuseWindow;
            }
            else {
                // macOS: by default we open files in a new window if this is triggered via DOCK context
                if (platform_1.isMacintosh) {
                    if (openConfig.context === 1 /* OpenContext.DOCK */) {
                        openFilesInNewWindow = true;
                    }
                }
                // Linux/Windows: by default we open files in the new window unless triggered via DIALOG / MENU context
                // or from the integrated terminal where we assume the user prefers to open in the current window
                else {
                    if (openConfig.context !== 3 /* OpenContext.DIALOG */ && openConfig.context !== 2 /* OpenContext.MENU */ && !(openConfig.userEnv && openConfig.userEnv['TERM_PROGRAM'] === 'vscode')) {
                        openFilesInNewWindow = true;
                    }
                }
                // finally check for overrides of default
                if (!openConfig.cli.extensionDevelopmentPath && (openFilesInNewWindowConfig === 'on' || openFilesInNewWindowConfig === 'off')) {
                    openFilesInNewWindow = (openFilesInNewWindowConfig === 'on');
                }
            }
            return { openFolderInNewWindow: !!openFolderInNewWindow, openFilesInNewWindow };
        }
        async openExtensionDevelopmentHostWindow(extensionDevelopmentPaths, openConfig) {
            // Reload an existing extension development host window on the same path
            // We currently do not allow more than one extension development window
            // on the same extension path.
            const existingWindow = (0, windowsFinder_1.findWindowOnExtensionDevelopmentPath)(this.getWindows(), extensionDevelopmentPaths);
            if (existingWindow) {
                this.lifecycleMainService.reload(existingWindow, openConfig.cli);
                existingWindow.focus(); // make sure it gets focus and is restored
                return [existingWindow];
            }
            let folderUris = openConfig.cli['folder-uri'] || [];
            let fileUris = openConfig.cli['file-uri'] || [];
            let cliArgs = openConfig.cli._;
            // Fill in previously opened workspace unless an explicit path is provided and we are not unit testing
            if (!cliArgs.length && !folderUris.length && !fileUris.length && !openConfig.cli.extensionTestsPath) {
                const extensionDevelopmentWindowState = this.windowsStateHandler.state.lastPluginDevelopmentHostWindow;
                const workspaceToOpen = extensionDevelopmentWindowState?.workspace ?? extensionDevelopmentWindowState?.folderUri;
                if (workspaceToOpen) {
                    if (uri_1.URI.isUri(workspaceToOpen)) {
                        if (workspaceToOpen.scheme === network_1.Schemas.file) {
                            cliArgs = [workspaceToOpen.fsPath];
                        }
                        else {
                            folderUris = [workspaceToOpen.toString()];
                        }
                    }
                    else {
                        if (workspaceToOpen.configPath.scheme === network_1.Schemas.file) {
                            cliArgs = [(0, resources_1.originalFSPath)(workspaceToOpen.configPath)];
                        }
                        else {
                            fileUris = [workspaceToOpen.configPath.toString()];
                        }
                    }
                }
            }
            let remoteAuthority = openConfig.remoteAuthority;
            for (const extensionDevelopmentPath of extensionDevelopmentPaths) {
                if (extensionDevelopmentPath.match(/^[a-zA-Z][a-zA-Z0-9\+\-\.]+:/)) {
                    const url = uri_1.URI.parse(extensionDevelopmentPath);
                    const extensionDevelopmentPathRemoteAuthority = (0, remoteHosts_1.getRemoteAuthority)(url);
                    if (extensionDevelopmentPathRemoteAuthority) {
                        if (remoteAuthority) {
                            if (!(0, resources_1.isEqualAuthority)(extensionDevelopmentPathRemoteAuthority, remoteAuthority)) {
                                this.logService.error('more than one extension development path authority');
                            }
                        }
                        else {
                            remoteAuthority = extensionDevelopmentPathRemoteAuthority;
                        }
                    }
                }
            }
            // Make sure that we do not try to open:
            // - a workspace or folder that is already opened
            // - a workspace or file that has a different authority as the extension development.
            cliArgs = cliArgs.filter(path => {
                const uri = uri_1.URI.file(path);
                if (!!(0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(this.getWindows(), uri)) {
                    return false;
                }
                return (0, resources_1.isEqualAuthority)((0, remoteHosts_1.getRemoteAuthority)(uri), remoteAuthority);
            });
            folderUris = folderUris.filter(folderUriStr => {
                const folderUri = this.cliArgToUri(folderUriStr);
                if (folderUri && !!(0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(this.getWindows(), folderUri)) {
                    return false;
                }
                return folderUri ? (0, resources_1.isEqualAuthority)((0, remoteHosts_1.getRemoteAuthority)(folderUri), remoteAuthority) : false;
            });
            fileUris = fileUris.filter(fileUriStr => {
                const fileUri = this.cliArgToUri(fileUriStr);
                if (fileUri && !!(0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(this.getWindows(), fileUri)) {
                    return false;
                }
                return fileUri ? (0, resources_1.isEqualAuthority)((0, remoteHosts_1.getRemoteAuthority)(fileUri), remoteAuthority) : false;
            });
            openConfig.cli._ = cliArgs;
            openConfig.cli['folder-uri'] = folderUris;
            openConfig.cli['file-uri'] = fileUris;
            // Open it
            const openArgs = {
                context: openConfig.context,
                cli: openConfig.cli,
                forceNewWindow: true,
                forceEmpty: !cliArgs.length && !folderUris.length && !fileUris.length,
                userEnv: openConfig.userEnv,
                noRecentEntry: true,
                waitMarkerFileURI: openConfig.waitMarkerFileURI,
                remoteAuthority,
                forceProfile: openConfig.forceProfile,
                forceTempProfile: openConfig.forceTempProfile
            };
            return this.open(openArgs);
        }
        async openInBrowserWindow(options) {
            const windowConfig = this.configurationService.getValue('window');
            const lastActiveWindow = this.getLastActiveWindow();
            const defaultProfile = lastActiveWindow?.profile ?? this.userDataProfilesMainService.defaultProfile;
            let window;
            if (!options.forceNewWindow && !options.forceNewTabbedWindow) {
                window = options.windowToUse || lastActiveWindow;
                if (window) {
                    window.focus();
                }
            }
            // Build up the window configuration from provided options, config and environment
            const configuration = {
                // Inherit CLI arguments from environment and/or
                // the specific properties from this launch if provided
                ...this.environmentMainService.args,
                ...options.cli,
                machineId: this.machineId,
                sqmId: this.sqmId,
                windowId: -1, // Will be filled in by the window once loaded later
                mainPid: process.pid,
                appRoot: this.environmentMainService.appRoot,
                execPath: process.execPath,
                codeCachePath: this.environmentMainService.codeCachePath,
                // If we know the backup folder upfront (for empty windows to restore), we can set it
                // directly here which helps for restoring UI state associated with that window.
                // For all other cases we first call into registerEmptyWindowBackup() to set it before
                // loading the window.
                backupPath: options.emptyWindowBackupInfo ? (0, path_1.join)(this.environmentMainService.backupHome, options.emptyWindowBackupInfo.backupFolder) : undefined,
                profiles: {
                    home: this.userDataProfilesMainService.profilesHome,
                    all: this.userDataProfilesMainService.profiles,
                    // Set to default profile first and resolve and update the profile
                    // only after the workspace-backup is registered.
                    // Because, workspace identifier of an empty window is known only then.
                    profile: defaultProfile
                },
                homeDir: this.environmentMainService.userHome.with({ scheme: network_1.Schemas.file }).fsPath,
                tmpDir: this.environmentMainService.tmpDir.with({ scheme: network_1.Schemas.file }).fsPath,
                userDataDir: this.environmentMainService.userDataPath,
                remoteAuthority: options.remoteAuthority,
                workspace: options.workspace,
                userEnv: { ...this.initialUserEnv, ...options.userEnv },
                filesToOpenOrCreate: options.filesToOpen?.filesToOpenOrCreate,
                filesToDiff: options.filesToOpen?.filesToDiff,
                filesToMerge: options.filesToOpen?.filesToMerge,
                filesToWait: options.filesToOpen?.filesToWait,
                logLevel: this.loggerService.getLogLevel(),
                loggers: {
                    window: [],
                    global: this.loggerService.getRegisteredLoggers()
                },
                logsPath: this.environmentMainService.logsHome.with({ scheme: network_1.Schemas.file }).fsPath,
                product: product_1.default,
                isInitialStartup: options.initialStartup,
                perfMarks: (0, performance_1.getMarks)(),
                os: { release: (0, os_1.release)(), hostname: (0, os_1.hostname)(), arch: (0, os_1.arch)() },
                autoDetectHighContrast: windowConfig?.autoDetectHighContrast ?? true,
                autoDetectColorScheme: windowConfig?.autoDetectColorScheme ?? false,
                accessibilitySupport: electron_1.app.accessibilitySupportEnabled,
                colorScheme: this.themeMainService.getColorScheme(),
                policiesData: this.policyService.serialize(),
                continueOn: this.environmentMainService.continueOn
            };
            // New window
            if (!window) {
                const state = this.windowsStateHandler.getNewWindowState(configuration);
                // Create the window
                (0, performance_1.mark)('code/willCreateCodeWindow');
                const createdWindow = window = this.instantiationService.createInstance(windowImpl_1.CodeWindow, {
                    state,
                    extensionDevelopmentPath: configuration.extensionDevelopmentPath,
                    isExtensionTestHost: !!configuration.extensionTestsPath
                });
                (0, performance_1.mark)('code/didCreateCodeWindow');
                // Add as window tab if configured (macOS only)
                if (options.forceNewTabbedWindow) {
                    const activeWindow = this.getLastActiveWindow();
                    activeWindow?.addTabbedWindow(createdWindow);
                }
                // Add to our list of windows
                this.windows.set(createdWindow.id, createdWindow);
                // Indicate new window via event
                this._onDidOpenWindow.fire(createdWindow);
                // Indicate number change via event
                this._onDidChangeWindowsCount.fire({ oldCount: this.getWindowCount() - 1, newCount: this.getWindowCount() });
                // Window Events
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(createdWindow.onDidSignalReady(() => this._onDidSignalReadyWindow.fire(createdWindow)));
                disposables.add(event_1.Event.once(createdWindow.onDidClose)(() => this.onWindowClosed(createdWindow, disposables)));
                disposables.add(event_1.Event.once(createdWindow.onDidDestroy)(() => this.onWindowDestroyed(createdWindow)));
                disposables.add(createdWindow.onDidMaximize(() => this._onDidMaximizeWindow.fire(createdWindow)));
                disposables.add(createdWindow.onDidUnmaximize(() => this._onDidUnmaximizeWindow.fire(createdWindow)));
                disposables.add(createdWindow.onDidEnterFullScreen(() => this._onDidChangeFullScreen.fire({ window: createdWindow, fullscreen: true })));
                disposables.add(createdWindow.onDidLeaveFullScreen(() => this._onDidChangeFullScreen.fire({ window: createdWindow, fullscreen: false })));
                disposables.add(createdWindow.onDidTriggerSystemContextMenu(({ x, y }) => this._onDidTriggerSystemContextMenu.fire({ window: createdWindow, x, y })));
                const webContents = (0, types_1.assertIsDefined)(createdWindow.win?.webContents);
                webContents.removeAllListeners('devtools-reload-page'); // remove built in listener so we can handle this on our own
                disposables.add(event_1.Event.fromNodeEventEmitter(webContents, 'devtools-reload-page')(() => this.lifecycleMainService.reload(createdWindow)));
                // Lifecycle
                this.lifecycleMainService.registerWindow(createdWindow);
            }
            // Existing window
            else {
                // Some configuration things get inherited if the window is being reused and we are
                // in extension development host mode. These options are all development related.
                const currentWindowConfig = window.config;
                if (!configuration.extensionDevelopmentPath && currentWindowConfig?.extensionDevelopmentPath) {
                    configuration.extensionDevelopmentPath = currentWindowConfig.extensionDevelopmentPath;
                    configuration.extensionDevelopmentKind = currentWindowConfig.extensionDevelopmentKind;
                    configuration['enable-proposed-api'] = currentWindowConfig['enable-proposed-api'];
                    configuration.verbose = currentWindowConfig.verbose;
                    configuration['inspect-extensions'] = currentWindowConfig['inspect-extensions'];
                    configuration['inspect-brk-extensions'] = currentWindowConfig['inspect-brk-extensions'];
                    configuration.debugId = currentWindowConfig.debugId;
                    configuration.extensionEnvironment = currentWindowConfig.extensionEnvironment;
                    configuration['extensions-dir'] = currentWindowConfig['extensions-dir'];
                    configuration['disable-extensions'] = currentWindowConfig['disable-extensions'];
                }
                configuration.loggers = {
                    global: configuration.loggers.global,
                    window: currentWindowConfig?.loggers.window ?? configuration.loggers.window
                };
            }
            // Update window identifier and session now
            // that we have the window object in hand.
            configuration.windowId = window.id;
            // If the window was already loaded, make sure to unload it
            // first and only load the new configuration if that was
            // not vetoed
            if (window.isReady) {
                this.lifecycleMainService.unload(window, 4 /* UnloadReason.LOAD */).then(async (veto) => {
                    if (!veto) {
                        await this.doOpenInBrowserWindow(window, configuration, options, defaultProfile);
                    }
                });
            }
            else {
                await this.doOpenInBrowserWindow(window, configuration, options, defaultProfile);
            }
            return window;
        }
        async doOpenInBrowserWindow(window, configuration, options, defaultProfile) {
            // Register window for backups unless the window
            // is for extension development, where we do not
            // keep any backups.
            if (!configuration.extensionDevelopmentPath) {
                if ((0, workspace_1.isWorkspaceIdentifier)(configuration.workspace)) {
                    configuration.backupPath = this.backupMainService.registerWorkspaceBackup({
                        workspace: configuration.workspace,
                        remoteAuthority: configuration.remoteAuthority
                    });
                }
                else if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(configuration.workspace)) {
                    configuration.backupPath = this.backupMainService.registerFolderBackup({
                        folderUri: configuration.workspace.uri,
                        remoteAuthority: configuration.remoteAuthority
                    });
                }
                else {
                    // Empty windows are special in that they provide no workspace on
                    // their configuration. To properly register them with the backup
                    // service, we either use the provided associated `backupFolder`
                    // in case we restore a previously opened empty window or we have
                    // to generate a new empty window workspace identifier to be used
                    // as `backupFolder`.
                    configuration.backupPath = this.backupMainService.registerEmptyWindowBackup({
                        backupFolder: options.emptyWindowBackupInfo?.backupFolder ?? (0, workspaces_1.createEmptyWorkspaceIdentifier)().id,
                        remoteAuthority: configuration.remoteAuthority
                    });
                }
            }
            if (this.userDataProfilesMainService.isEnabled()) {
                const workspace = configuration.workspace ?? (0, workspace_1.toWorkspaceIdentifier)(configuration.backupPath, false);
                const profilePromise = this.resolveProfileForBrowserWindow(options, workspace, defaultProfile);
                const profile = profilePromise instanceof Promise ? await profilePromise : profilePromise;
                configuration.profiles.profile = profile;
                if (!configuration.extensionDevelopmentPath) {
                    // Associate the configured profile to the workspace
                    // unless the window is for extension development,
                    // where we do not persist the associations
                    await this.userDataProfilesMainService.setProfileForWorkspace(workspace, profile);
                }
            }
            // Load it
            window.load(configuration);
        }
        resolveProfileForBrowserWindow(options, workspace, defaultProfile) {
            if (options.forceProfile) {
                return this.userDataProfilesMainService.profiles.find(p => p.name === options.forceProfile) ?? this.userDataProfilesMainService.createNamedProfile(options.forceProfile);
            }
            if (options.forceTempProfile) {
                return this.userDataProfilesMainService.createTransientProfile();
            }
            return this.userDataProfilesMainService.getProfileForWorkspace(workspace) ?? defaultProfile;
        }
        onWindowClosed(window, disposables) {
            // Remove from our list so that Electron can clean it up
            this.windows.delete(window.id);
            // Emit
            this._onDidChangeWindowsCount.fire({ oldCount: this.getWindowCount() + 1, newCount: this.getWindowCount() });
            // Clean up
            disposables.dispose();
        }
        onWindowDestroyed(window) {
            // Remove from our list so that Electron can clean it up
            this.windows.delete(window.id);
            // Emit
            this._onDidDestroyWindow.fire(window);
        }
        getFocusedWindow() {
            const window = electron_1.BrowserWindow.getFocusedWindow();
            if (window) {
                return this.getWindowById(window.id);
            }
            return undefined;
        }
        getLastActiveWindow() {
            return this.doGetLastActiveWindow(this.getWindows());
        }
        getLastActiveWindowForAuthority(remoteAuthority) {
            return this.doGetLastActiveWindow(this.getWindows().filter(window => (0, resources_1.isEqualAuthority)(window.remoteAuthority, remoteAuthority)));
        }
        doGetLastActiveWindow(windows) {
            return (0, windows_1.getLastFocused)(windows);
        }
        sendToFocused(channel, ...args) {
            const focusedWindow = this.getFocusedWindow() || this.getLastActiveWindow();
            focusedWindow?.sendWhenReady(channel, cancellation_1.CancellationToken.None, ...args);
        }
        sendToOpeningWindow(channel, ...args) {
            this._register(event_1.Event.once(this.onDidSignalReadyWindow)(window => {
                window.sendWhenReady(channel, cancellation_1.CancellationToken.None, ...args);
            }));
        }
        sendToAll(channel, payload, windowIdsToIgnore) {
            for (const window of this.getWindows()) {
                if (windowIdsToIgnore && windowIdsToIgnore.indexOf(window.id) >= 0) {
                    continue; // do not send if we are instructed to ignore it
                }
                window.sendWhenReady(channel, cancellation_1.CancellationToken.None, payload);
            }
        }
        getWindows() {
            return Array.from(this.windows.values());
        }
        getWindowCount() {
            return this.windows.size;
        }
        getWindowById(windowId) {
            return this.windows.get(windowId);
        }
        getWindowByWebContents(webContents) {
            const browserWindow = electron_1.BrowserWindow.fromWebContents(webContents);
            if (!browserWindow) {
                return undefined;
            }
            const window = this.getWindowById(browserWindow.id);
            return window?.matches(webContents) ? window : undefined;
        }
    };
    exports.WindowsMainService = WindowsMainService;
    exports.WindowsMainService = WindowsMainService = __decorate([
        __param(3, log_1.ILogService),
        __param(4, loggerService_1.ILoggerMainService),
        __param(5, state_1.IStateService),
        __param(6, policy_1.IPolicyService),
        __param(7, environmentMainService_1.IEnvironmentMainService),
        __param(8, userDataProfile_1.IUserDataProfilesMainService),
        __param(9, lifecycleMainService_1.ILifecycleMainService),
        __param(10, backup_1.IBackupMainService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, workspacesHistoryMainService_1.IWorkspacesHistoryMainService),
        __param(13, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(14, instantiation_1.IInstantiationService),
        __param(15, dialogMainService_1.IDialogMainService),
        __param(16, files_1.IFileService),
        __param(17, protocol_1.IProtocolMainService),
        __param(18, themeMainService_1.IThemeMainService),
        __param(19, auxiliaryWindows_1.IAuxiliaryWindowsMainService)
    ], WindowsMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93c01haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd2luZG93cy9lbGVjdHJvbi1tYWluL3dpbmRvd3NNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxS2hHLFNBQVMscUJBQXFCLENBQUMsSUFBNkI7UUFDM0QsT0FBTyxJQUFBLGlDQUFxQixFQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsU0FBUyxpQ0FBaUMsQ0FBQyxJQUE2QjtRQUN2RSxPQUFPLElBQUEsNkNBQWlDLEVBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRCxZQUFZO0lBRUwsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQWdDakQsWUFDa0IsU0FBaUIsRUFDakIsS0FBYSxFQUNiLGNBQW1DLEVBQ3ZDLFVBQXdDLEVBQ2pDLGFBQWtELEVBQ3ZELFlBQTRDLEVBQzNDLGFBQThDLEVBQ3JDLHNCQUFnRSxFQUMzRCwyQkFBMEUsRUFDakYsb0JBQTRELEVBQy9ELGlCQUFzRCxFQUNuRCxvQkFBNEQsRUFDcEQsNEJBQTRFLEVBQ3pFLCtCQUFrRixFQUM3RixvQkFBNEQsRUFDL0QsaUJBQXNELEVBQzVELFdBQTBDLEVBQ2xDLG1CQUEwRCxFQUM3RCxnQkFBb0QsRUFDekMsMkJBQTBFO1lBRXhHLEtBQUssRUFBRSxDQUFDO1lBckJTLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLG1CQUFjLEdBQWQsY0FBYyxDQUFxQjtZQUN0QixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2hCLGtCQUFhLEdBQWIsYUFBYSxDQUFvQjtZQUN0Qyxp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