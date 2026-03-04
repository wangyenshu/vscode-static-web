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
define(["require", "exports", "electron", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/pfs", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/storage/electron-main/storageMainService", "vs/platform/workspaces/common/workspaces", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/base/common/map", "vs/platform/dialogs/electron-main/dialogMainService"], function (require, exports, electron_1, arrays_1, async_1, event_1, labels_1, lifecycle_1, network_1, platform_1, resources_1, uri_1, pfs_1, nls_1, instantiation_1, lifecycleMainService_1, log_1, storageMainService_1, workspaces_1, workspace_1, workspacesManagementMainService_1, map_1, dialogMainService_1) {
    "use strict";
    var WorkspacesHistoryMainService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacesHistoryMainService = exports.IWorkspacesHistoryMainService = void 0;
    exports.IWorkspacesHistoryMainService = (0, instantiation_1.createDecorator)('workspacesHistoryMainService');
    let WorkspacesHistoryMainService = class WorkspacesHistoryMainService extends lifecycle_1.Disposable {
        static { WorkspacesHistoryMainService_1 = this; }
        static { this.MAX_TOTAL_RECENT_ENTRIES = 500; }
        static { this.RECENTLY_OPENED_STORAGE_KEY = 'history.recentlyOpenedPathsList'; }
        constructor(logService, workspacesManagementMainService, lifecycleMainService, applicationStorageMainService, dialogMainService) {
            super();
            this.logService = logService;
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.applicationStorageMainService = applicationStorageMainService;
            this.dialogMainService = dialogMainService;
            this._onDidChangeRecentlyOpened = this._register(new event_1.Emitter());
            this.onDidChangeRecentlyOpened = this._onDidChangeRecentlyOpened.event;
            this.macOSRecentDocumentsUpdater = this._register(new async_1.ThrottledDelayer(800));
            this.registerListeners();
        }
        registerListeners() {
            // Install window jump list delayed after opening window
            // because perf measurements have shown this to be slow
            this.lifecycleMainService.when(4 /* LifecycleMainPhase.Eventually */).then(() => this.handleWindowsJumpList());
            // Add to history when entering workspace
            this._register(this.workspacesManagementMainService.onDidEnterWorkspace(event => this.addRecentlyOpened([{ workspace: event.workspace, remoteAuthority: event.window.remoteAuthority }])));
        }
        //#region Workspaces History
        async addRecentlyOpened(recentToAdd) {
            let workspaces = [];
            let files = [];
            for (const recent of recentToAdd) {
                // Workspace
                if ((0, workspaces_1.isRecentWorkspace)(recent)) {
                    if (!this.workspacesManagementMainService.isUntitledWorkspace(recent.workspace) && !this.containsWorkspace(workspaces, recent.workspace)) {
                        workspaces.push(recent);
                    }
                }
                // Folder
                else if ((0, workspaces_1.isRecentFolder)(recent)) {
                    if (!this.containsFolder(workspaces, recent.folderUri)) {
                        workspaces.push(recent);
                    }
                }
                // File
                else {
                    const alreadyExistsInHistory = this.containsFile(files, recent.fileUri);
                    const shouldBeFiltered = recent.fileUri.scheme === network_1.Schemas.file && WorkspacesHistoryMainService_1.COMMON_FILES_FILTER.indexOf((0, resources_1.basename)(recent.fileUri)) >= 0;
                    if (!alreadyExistsInHistory && !shouldBeFiltered) {
                        files.push(recent);
                        // Add to recent documents (Windows only, macOS later)
                        if (platform_1.isWindows && recent.fileUri.scheme === network_1.Schemas.file) {
                            electron_1.app.addRecentDocument(recent.fileUri.fsPath);
                        }
                    }
                }
            }
            const mergedEntries = await this.mergeEntriesFromStorage({ workspaces, files });
            workspaces = mergedEntries.workspaces;
            files = mergedEntries.files;
            if (workspaces.length > WorkspacesHistoryMainService_1.MAX_TOTAL_RECENT_ENTRIES) {
                workspaces.length = WorkspacesHistoryMainService_1.MAX_TOTAL_RECENT_ENTRIES;
            }
            if (files.length > WorkspacesHistoryMainService_1.MAX_TOTAL_RECENT_ENTRIES) {
                files.length = WorkspacesHistoryMainService_1.MAX_TOTAL_RECENT_ENTRIES;
            }
            await this.saveRecentlyOpened({ workspaces, files });
            this._onDidChangeRecentlyOpened.fire();
            // Schedule update to recent documents on macOS dock
            if (platform_1.isMacintosh) {
                this.macOSRecentDocumentsUpdater.trigger(() => this.updateMacOSRecentDocuments());
            }
        }
        async removeRecentlyOpened(recentToRemove) {
            const keep = (recent) => {
                const uri = this.location(recent);
                for (const resourceToRemove of recentToRemove) {
                    if (resources_1.extUriBiasedIgnorePathCase.isEqual(resourceToRemove, uri)) {
                        return false;
                    }
                }
                return true;
            };
            const mru = await this.getRecentlyOpened();
            const workspaces = mru.workspaces.filter(keep);
            const files = mru.files.filter(keep);
            if (workspaces.length !== mru.workspaces.length || files.length !== mru.files.length) {
                await this.saveRecentlyOpened({ files, workspaces });
                this._onDidChangeRecentlyOpened.fire();
                // Schedule update to recent documents on macOS dock
                if (platform_1.isMacintosh) {
                    this.macOSRecentDocumentsUpdater.trigger(() => this.updateMacOSRecentDocuments());
                }
            }
        }
        async clearRecentlyOpened(options) {
            if (options?.confirm) {
                const { response } = await this.dialogMainService.showMessageBox({
                    type: 'warning',
                    buttons: [
                        (0, nls_1.localize)({ key: 'clearButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Clear"),
                        (0, nls_1.localize)({ key: 'cancel', comment: ['&& denotes a mnemonic'] }, "&&Cancel")
                    ],
                    message: (0, nls_1.localize)('confirmClearRecentsMessage', "Do you want to clear all recently opened files and workspaces?"),
                    detail: (0, nls_1.localize)('confirmClearDetail', "This action is irreversible!"),
                    cancelId: 1
                });
                if (response !== 0) {
                    return;
                }
            }
            await this.saveRecentlyOpened({ workspaces: [], files: [] });
            electron_1.app.clearRecentDocuments();
            // Event
            this._onDidChangeRecentlyOpened.fire();
        }
        async getRecentlyOpened() {
            return this.mergeEntriesFromStorage();
        }
        async mergeEntriesFromStorage(existingEntries) {
            // Build maps for more efficient lookup of existing entries that
            // are passed in by storing based on workspace/file identifier
            const mapWorkspaceIdToWorkspace = new map_1.ResourceMap(uri => resources_1.extUriBiasedIgnorePathCase.getComparisonKey(uri));
            if (existingEntries?.workspaces) {
                for (const workspace of existingEntries.workspaces) {
                    mapWorkspaceIdToWorkspace.set(this.location(workspace), workspace);
                }
            }
            const mapFileIdToFile = new map_1.ResourceMap(uri => resources_1.extUriBiasedIgnorePathCase.getComparisonKey(uri));
            if (existingEntries?.files) {
                for (const file of existingEntries.files) {
                    mapFileIdToFile.set(this.location(file), file);
                }
            }
            // Merge in entries from storage, preserving existing known entries
            const recentFromStorage = await this.getRecentlyOpenedFromStorage();
            for (const recentWorkspaceFromStorage of recentFromStorage.workspaces) {
                const existingRecentWorkspace = mapWorkspaceIdToWorkspace.get(this.location(recentWorkspaceFromStorage));
                if (existingRecentWorkspace) {
                    existingRecentWorkspace.label = existingRecentWorkspace.label ?? recentWorkspaceFromStorage.label;
                }
                else {
                    mapWorkspaceIdToWorkspace.set(this.location(recentWorkspaceFromStorage), recentWorkspaceFromStorage);
                }
            }
            for (const recentFileFromStorage of recentFromStorage.files) {
                const existingRecentFile = mapFileIdToFile.get(this.location(recentFileFromStorage));
                if (existingRecentFile) {
                    existingRecentFile.label = existingRecentFile.label ?? recentFileFromStorage.label;
                }
                else {
                    mapFileIdToFile.set(this.location(recentFileFromStorage), recentFileFromStorage);
                }
            }
            return {
                workspaces: [...mapWorkspaceIdToWorkspace.values()],
                files: [...mapFileIdToFile.values()]
            };
        }
        async getRecentlyOpenedFromStorage() {
            // Wait for global storage to be ready
            await this.applicationStorageMainService.whenReady;
            let storedRecentlyOpened = undefined;
            // First try with storage service
            const storedRecentlyOpenedRaw = this.applicationStorageMainService.get(WorkspacesHistoryMainService_1.RECENTLY_OPENED_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
            if (typeof storedRecentlyOpenedRaw === 'string') {
                try {
                    storedRecentlyOpened = JSON.parse(storedRecentlyOpenedRaw);
                }
                catch (error) {
                    this.logService.error('Unexpected error parsing opened paths list', error);
                }
            }
            return (0, workspaces_1.restoreRecentlyOpened)(storedRecentlyOpened, this.logService);
        }
        async saveRecentlyOpened(recent) {
            // Wait for global storage to be ready
            await this.applicationStorageMainService.whenReady;
            // Store in global storage (but do not sync since this is mainly local paths)
            this.applicationStorageMainService.store(WorkspacesHistoryMainService_1.RECENTLY_OPENED_STORAGE_KEY, JSON.stringify((0, workspaces_1.toStoreData)(recent)), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        location(recent) {
            if ((0, workspaces_1.isRecentFolder)(recent)) {
                return recent.folderUri;
            }
            if ((0, workspaces_1.isRecentFile)(recent)) {
                return recent.fileUri;
            }
            return recent.workspace.configPath;
        }
        containsWorkspace(recents, candidate) {
            return !!recents.find(recent => (0, workspaces_1.isRecentWorkspace)(recent) && recent.workspace.id === candidate.id);
        }
        containsFolder(recents, candidate) {
            return !!recents.find(recent => (0, workspaces_1.isRecentFolder)(recent) && resources_1.extUriBiasedIgnorePathCase.isEqual(recent.folderUri, candidate));
        }
        containsFile(recents, candidate) {
            return !!recents.find(recent => resources_1.extUriBiasedIgnorePathCase.isEqual(recent.fileUri, candidate));
        }
        //#endregion
        //#region macOS Dock / Windows JumpList
        static { this.MAX_MACOS_DOCK_RECENT_WORKSPACES = 7; } // prefer higher number of workspaces...
        static { this.MAX_MACOS_DOCK_RECENT_ENTRIES_TOTAL = 10; } // ...over number of files
        static { this.MAX_WINDOWS_JUMP_LIST_ENTRIES = 7; }
        // Exclude some very common files from the dock/taskbar
        static { this.COMMON_FILES_FILTER = [
            'COMMIT_EDITMSG',
            'MERGE_MSG'
        ]; }
        async handleWindowsJumpList() {
            if (!platform_1.isWindows) {
                return; // only on windows
            }
            await this.updateWindowsJumpList();
            this._register(this.onDidChangeRecentlyOpened(() => this.updateWindowsJumpList()));
        }
        async updateWindowsJumpList() {
            if (!platform_1.isWindows) {
                return; // only on windows
            }
            const jumpList = [];
            // Tasks
            jumpList.push({
                type: 'tasks',
                items: [
                    {
                        type: 'task',
                        title: (0, nls_1.localize)('newWindow', "New Window"),
                        description: (0, nls_1.localize)('newWindowDesc', "Opens a new window"),
                        program: process.execPath,
                        args: '-n', // force new window
                        iconPath: process.execPath,
                        iconIndex: 0
                    }
                ]
            });
            // Recent Workspaces
            if ((await this.getRecentlyOpened()).workspaces.length > 0) {
                // The user might have meanwhile removed items from the jump list and we have to respect that
                // so we need to update our list of recent paths with the choice of the user to not add them again
                // Also: Windows will not show our custom category at all if there is any entry which was removed
                // by the user! See https://github.com/microsoft/vscode/issues/15052
                const toRemove = [];
                for (const item of electron_1.app.getJumpListSettings().removedItems) {
                    const args = item.args;
                    if (args) {
                        const match = /^--(folder|file)-uri\s+"([^"]+)"$/.exec(args);
                        if (match) {
                            toRemove.push(uri_1.URI.parse(match[2]));
                        }
                    }
                }
                await this.removeRecentlyOpened(toRemove);
                // Add entries
                let hasWorkspaces = false;
                const items = (0, arrays_1.coalesce)((await this.getRecentlyOpened()).workspaces.slice(0, WorkspacesHistoryMainService_1.MAX_WINDOWS_JUMP_LIST_ENTRIES).map(recent => {
                    const workspace = (0, workspaces_1.isRecentWorkspace)(recent) ? recent.workspace : recent.folderUri;
                    const { title, description } = this.getWindowsJumpListLabel(workspace, recent.label);
                    let args;
                    if (uri_1.URI.isUri(workspace)) {
                        args = `--folder-uri "${workspace.toString()}"`;
                    }
                    else {
                        hasWorkspaces = true;
                        args = `--file-uri "${workspace.configPath.toString()}"`;
                    }
                    return {
                        type: 'task',
                        title: title.substr(0, 255), // Windows seems to be picky around the length of entries
                        description: description.substr(0, 255), // (see https://github.com/microsoft/vscode/issues/111177)
                        program: process.execPath,
                        args,
                        iconPath: 'explorer.exe', // simulate folder icon
                        iconIndex: 0
                    };
                }));
                if (items.length > 0) {
                    jumpList.push({
                        type: 'custom',
                        name: hasWorkspaces ? (0, nls_1.localize)('recentFoldersAndWorkspaces', "Recent Folders & Workspaces") : (0, nls_1.localize)('recentFolders', "Recent Folders"),
                        items
                    });
                }
            }
            // Recent
            jumpList.push({
                type: 'recent' // this enables to show files in the "recent" category
            });
            try {
                const res = electron_1.app.setJumpList(jumpList);
                if (res && res !== 'ok') {
                    this.logService.warn(`updateWindowsJumpList#setJumpList unexpected result: ${res}`);
                }
            }
            catch (error) {
                this.logService.warn('updateWindowsJumpList#setJumpList', error); // since setJumpList is relatively new API, make sure to guard for errors
            }
        }
        getWindowsJumpListLabel(workspace, recentLabel) {
            // Prefer recent label
            if (recentLabel) {
                return { title: (0, labels_1.splitRecentLabel)(recentLabel).name, description: recentLabel };
            }
            // Single Folder
            if (uri_1.URI.isUri(workspace)) {
                return { title: (0, resources_1.basename)(workspace), description: this.renderJumpListPathDescription(workspace) };
            }
            // Workspace: Untitled
            if (this.workspacesManagementMainService.isUntitledWorkspace(workspace)) {
                return { title: (0, nls_1.localize)('untitledWorkspace', "Untitled (Workspace)"), description: '' };
            }
            // Workspace: normal
            let filename = (0, resources_1.basename)(workspace.configPath);
            if (filename.endsWith(workspace_1.WORKSPACE_EXTENSION)) {
                filename = filename.substr(0, filename.length - workspace_1.WORKSPACE_EXTENSION.length - 1);
            }
            return { title: (0, nls_1.localize)('workspaceName', "{0} (Workspace)", filename), description: this.renderJumpListPathDescription(workspace.configPath) };
        }
        renderJumpListPathDescription(uri) {
            return uri.scheme === 'file' ? (0, labels_1.normalizeDriveLetter)(uri.fsPath) : uri.toString();
        }
        async updateMacOSRecentDocuments() {
            if (!platform_1.isMacintosh) {
                return;
            }
            // We clear all documents first to ensure an up-to-date view on the set. Since entries
            // can get deleted on disk, this ensures that the list is always valid
            electron_1.app.clearRecentDocuments();
            const mru = await this.getRecentlyOpened();
            // Collect max-N recent workspaces that are known to exist
            const workspaceEntries = [];
            let entries = 0;
            for (let i = 0; i < mru.workspaces.length && entries < WorkspacesHistoryMainService_1.MAX_MACOS_DOCK_RECENT_WORKSPACES; i++) {
                const loc = this.location(mru.workspaces[i]);
                if (loc.scheme === network_1.Schemas.file) {
                    const workspacePath = (0, resources_1.originalFSPath)(loc);
                    if (await pfs_1.Promises.exists(workspacePath)) {
                        workspaceEntries.push(workspacePath);
                        entries++;
                    }
                }
            }
            // Collect max-N recent files that are known to exist
            const fileEntries = [];
            for (let i = 0; i < mru.files.length && entries < WorkspacesHistoryMainService_1.MAX_MACOS_DOCK_RECENT_ENTRIES_TOTAL; i++) {
                const loc = this.location(mru.files[i]);
                if (loc.scheme === network_1.Schemas.file) {
                    const filePath = (0, resources_1.originalFSPath)(loc);
                    if (WorkspacesHistoryMainService_1.COMMON_FILES_FILTER.includes((0, resources_1.basename)(loc)) || // skip some well known file entries
                        workspaceEntries.includes(filePath) // prefer a workspace entry over a file entry (e.g. for .code-workspace)
                    ) {
                        continue;
                    }
                    if (await pfs_1.Promises.exists(filePath)) {
                        fileEntries.push(filePath);
                        entries++;
                    }
                }
            }
            // The apple guidelines (https://developer.apple.com/design/human-interface-guidelines/macos/menus/menu-anatomy/)
            // explain that most recent entries should appear close to the interaction by the user (e.g. close to the
            // mouse click). Most native macOS applications that add recent documents to the dock, show the most recent document
            // to the bottom (because the dock menu is not appearing from top to bottom, but from the bottom to the top). As such
            // we fill in the entries in reverse order so that the most recent shows up at the bottom of the menu.
            //
            // On top of that, the maximum number of documents can be configured by the user (defaults to 10). To ensure that
            // we are not failing to show the most recent entries, we start by adding files first (in reverse order of recency)
            // and then add folders (in reverse order of recency). Given that strategy, we can ensure that the most recent
            // N folders are always appearing, even if the limit is low (https://github.com/microsoft/vscode/issues/74788)
            fileEntries.reverse().forEach(fileEntry => electron_1.app.addRecentDocument(fileEntry));
            workspaceEntries.reverse().forEach(workspaceEntry => electron_1.app.addRecentDocument(workspaceEntry));
        }
    };
    exports.WorkspacesHistoryMainService = WorkspacesHistoryMainService;
    exports.WorkspacesHistoryMainService = WorkspacesHistoryMainService = WorkspacesHistoryMainService_1 = __decorate([
        __param(0, log_1.ILogService),
        __param(1, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(2, lifecycleMainService_1.ILifecycleMainService),
        __param(3, storageMainService_1.IApplicationStorageMainService),
        __param(4, dialogMainService_1.IDialogMainService)
    ], WorkspacesHistoryMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlc0hpc3RvcnlNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3dvcmtzcGFjZXMvZWxlY3Ryb24tbWFpbi93b3Jrc3BhY2VzSGlzdG9yeU1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5Qm5GLFFBQUEsNkJBQTZCLEdBQUcsSUFBQSwrQkFBZSxFQUFnQyw4QkFBOEIsQ0FBQyxDQUFDO0lBY3JILElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTZCLFNBQVEsc0JBQVU7O2lCQUVuQyw2QkFBd0IsR0FBRyxHQUFHLEFBQU4sQ0FBTztpQkFFL0IsZ0NBQTJCLEdBQUcsaUNBQWlDLEFBQXBDLENBQXFDO1FBT3hGLFlBQ2MsVUFBd0MsRUFDbkIsK0JBQWtGLEVBQzdGLG9CQUE0RCxFQUNuRCw2QkFBOEUsRUFDMUYsaUJBQXNEO1lBRTFFLEtBQUssRUFBRSxDQUFDO1lBTnNCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDRixvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWtDO1lBQzVFLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbEMsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFnQztZQUN6RSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBUjFELCtCQUEwQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3pFLDhCQUF5QixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUM7WUE4UDFELGdDQUEyQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBblA5RixJQUFJLENBQUMsaUJBQWlCLEVB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