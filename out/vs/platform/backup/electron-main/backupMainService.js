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
define(["require", "exports", "crypto", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/node/pfs", "vs/platform/backup/node/backup", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/state/node/state", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/backup/common/backup", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/node/workspaces"], function (require, exports, crypto_1, extpath_1, network_1, path_1, platform_1, resources_1, pfs_1, backup_1, configuration_1, environmentMainService_1, state_1, files_1, log_1, backup_2, workspace_1, workspaces_1) {
    "use strict";
    var BackupMainService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackupMainService = void 0;
    let BackupMainService = class BackupMainService {
        static { BackupMainService_1 = this; }
        static { this.backupWorkspacesMetadataStorageKey = 'backupWorkspaces'; }
        constructor(environmentMainService, configurationService, logService, stateService) {
            this.environmentMainService = environmentMainService;
            this.configurationService = configurationService;
            this.logService = logService;
            this.stateService = stateService;
            this.backupHome = this.environmentMainService.backupHome;
            this.workspaces = [];
            this.folders = [];
            this.emptyWindows = [];
            // Comparers for paths and resources that will
            // - ignore path casing on Windows/macOS
            // - respect path casing on Linux
            this.backupUriComparer = resources_1.extUriBiasedIgnorePathCase;
            this.backupPathComparer = { isEqual: (pathA, pathB) => (0, extpath_1.isEqual)(pathA, pathB, !platform_1.isLinux) };
        }
        async initialize() {
            // read backup workspaces
            const serializedBackupWorkspaces = this.stateService.getItem(BackupMainService_1.backupWorkspacesMetadataStorageKey) ?? { workspaces: [], folders: [], emptyWindows: [] };
            // validate empty workspaces backups first
            this.emptyWindows = await this.validateEmptyWorkspaces(serializedBackupWorkspaces.emptyWindows);
            // validate workspace backups
            this.workspaces = await this.validateWorkspaces((0, backup_1.deserializeWorkspaceInfos)(serializedBackupWorkspaces));
            // validate folder backups
            this.folders = await this.validateFolders((0, backup_1.deserializeFolderInfos)(serializedBackupWorkspaces));
            // store metadata in case some workspaces or folders have been removed
            this.storeWorkspacesMetadata();
        }
        getWorkspaceBackups() {
            if (this.isHotExitOnExitAndWindowClose()) {
                // Only non-folder windows are restored on main process launch when
                // hot exit is configured as onExitAndWindowClose.
                return [];
            }
            return this.workspaces.slice(0); // return a copy
        }
        getFolderBackups() {
            if (this.isHotExitOnExitAndWindowClose()) {
                // Only non-folder windows are restored on main process launch when
                // hot exit is configured as onExitAndWindowClose.
                return [];
            }
            return this.folders.slice(0); // return a copy
        }
        isHotExitEnabled() {
            return this.getHotExitConfig() !== files_1.HotExitConfiguration.OFF;
        }
        isHotExitOnExitAndWindowClose() {
            return this.getHotExitConfig() === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE;
        }
        getHotExitConfig() {
            const config = this.configurationService.getValue();
            return config?.files?.hotExit || files_1.HotExitConfiguration.ON_EXIT;
        }
        getEmptyWindowBackups() {
            return this.emptyWindows.slice(0); // return a copy
        }
        registerWorkspaceBackup(workspaceInfo, migrateFrom) {
            if (!this.workspaces.some(workspace => workspaceInfo.workspace.id === workspace.workspace.id)) {
                this.workspaces.push(workspaceInfo);
                this.storeWorkspacesMetadata();
            }
            const backupPath = (0, path_1.join)(this.backupHome, workspaceInfo.workspace.id);
            if (migrateFrom) {
                return this.moveBackupFolder(backupPath, migrateFrom).then(() => backupPath);
            }
            return backupPath;
        }
        async moveBackupFolder(backupPath, moveFromPath) {
            // Target exists: make sure to convert existing backups to empty window backups
            if (await pfs_1.Promises.exists(backupPath)) {
                await this.convertToEmptyWindowBackup(backupPath);
            }
            // When we have data to migrate from, move it over to the target location
            if (await pfs_1.Promises.exists(moveFromPath)) {
                try {
                    await pfs_1.Promises.rename(moveFromPath, backupPath, false /* no retry */);
                }
                catch (error) {
                    this.logService.error(`Backup: Could not move backup folder to new location: ${error.toString()}`);
                }
            }
        }
        registerFolderBackup(folderInfo) {
            if (!this.folders.some(folder => this.backupUriComparer.isEqual(folderInfo.folderUri, folder.folderUri))) {
                this.folders.push(folderInfo);
                this.storeWorkspacesMetadata();
            }
            return (0, path_1.join)(this.backupHome, this.getFolderHash(folderInfo));
        }
        registerEmptyWindowBackup(emptyWindowInfo) {
            if (!this.emptyWindows.some(emptyWindow => !!emptyWindow.backupFolder && this.backupPathComparer.isEqual(emptyWindow.backupFolder, emptyWindowInfo.backupFolder))) {
                this.emptyWindows.push(emptyWindowInfo);
                this.storeWorkspacesMetadata();
            }
            return (0, path_1.join)(this.backupHome, emptyWindowInfo.backupFolder);
        }
        async validateWorkspaces(rootWorkspaces) {
            if (!Array.isArray(rootWorkspaces)) {
                return [];
            }
            const seenIds = new Set();
            const result = [];
            // Validate Workspaces
            for (const workspaceInfo of rootWorkspaces) {
                const workspace = workspaceInfo.workspace;
                if (!(0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                    return []; // wrong format, skip all entries
                }
                if (!seenIds.has(workspace.id)) {
                    seenIds.add(workspace.id);
                    const backupPath = (0, path_1.join)(this.backupHome, workspace.id);
                    const hasBackups = await this.doHasBackups(backupPath);
                    // If the workspace has no backups, ignore it
                    if (hasBackups) {
                        if (workspace.configPath.scheme !== network_1.Schemas.file || await pfs_1.Promises.exists(workspace.configPath.fsPath)) {
                            result.push(workspaceInfo);
                        }
                        else {
                            // If the workspace has backups, but the target workspace is missing, convert backups to empty ones
                            await this.convertToEmptyWindowBackup(backupPath);
                        }
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async validateFolders(folderWorkspaces) {
            if (!Array.isArray(folderWorkspaces)) {
                return [];
            }
            const result = [];
            const seenIds = new Set();
            for (const folderInfo of folderWorkspaces) {
                const folderURI = folderInfo.folderUri;
                const key = this.backupUriComparer.getComparisonKey(folderURI);
                if (!seenIds.has(key)) {
                    seenIds.add(key);
                    const backupPath = (0, path_1.join)(this.backupHome, this.getFolderHash(folderInfo));
                    const hasBackups = await this.doHasBackups(backupPath);
                    // If the folder has no backups, ignore it
                    if (hasBackups) {
                        if (folderURI.scheme !== network_1.Schemas.file || await pfs_1.Promises.exists(folderURI.fsPath)) {
                            result.push(folderInfo);
                        }
                        else {
                            // If the folder has backups, but the target workspace is missing, convert backups to empty ones
                            await this.convertToEmptyWindowBackup(backupPath);
                        }
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async validateEmptyWorkspaces(emptyWorkspaces) {
            if (!Array.isArray(emptyWorkspaces)) {
                return [];
            }
            const result = [];
            const seenIds = new Set();
            // Validate Empty Windows
            for (const backupInfo of emptyWorkspaces) {
                const backupFolder = backupInfo.backupFolder;
                if (typeof backupFolder !== 'string') {
                    return [];
                }
                if (!seenIds.has(backupFolder)) {
                    seenIds.add(backupFolder);
                    const backupPath = (0, path_1.join)(this.backupHome, backupFolder);
                    if (await this.doHasBackups(backupPath)) {
                        result.push(backupInfo);
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async deleteStaleBackup(backupPath) {
            try {
                await pfs_1.Promises.rm(backupPath, pfs_1.RimRafMode.MOVE);
            }
            catch (error) {
                this.logService.error(`Backup: Could not delete stale backup: ${error.toString()}`);
            }
        }
        prepareNewEmptyWindowBackup() {
            // We are asked to prepare a new empty window backup folder.
            // Empty windows backup folders are derived from a workspace
            // identifier, so we generate a new empty workspace identifier
            // until we found a unique one.
            let emptyWorkspaceIdentifier = (0, workspaces_1.createEmptyWorkspaceIdentifier)();
            while (this.emptyWindows.some(emptyWindow => !!emptyWindow.backupFolder && this.backupPathComparer.isEqual(emptyWindow.backupFolder, emptyWorkspaceIdentifier.id))) {
                emptyWorkspaceIdentifier = (0, workspaces_1.createEmptyWorkspaceIdentifier)();
            }
            return { backupFolder: emptyWorkspaceIdentifier.id };
        }
        async convertToEmptyWindowBackup(backupPath) {
            const newEmptyWindowBackupInfo = this.prepareNewEmptyWindowBackup();
            // Rename backupPath to new empty window backup path
            const newEmptyWindowBackupPath = (0, path_1.join)(this.backupHome, newEmptyWindowBackupInfo.backupFolder);
            try {
                await pfs_1.Promises.rename(backupPath, newEmptyWindowBackupPath, false /* no retry */);
            }
            catch (error) {
                this.logService.error(`Backup: Could not rename backup folder: ${error.toString()}`);
                return false;
            }
            this.emptyWindows.push(newEmptyWindowBackupInfo);
            return true;
        }
        async getDirtyWorkspaces() {
            const dirtyWorkspaces = [];
            // Workspaces with backups
            for (const workspace of this.workspaces) {
                if ((await this.hasBackups(workspace))) {
                    dirtyWorkspaces.push(workspace);
                }
            }
            // Folders with backups
            for (const folder of this.folders) {
                if ((await this.hasBackups(folder))) {
                    dirtyWorkspaces.push(folder);
                }
            }
            return dirtyWorkspaces;
        }
        hasBackups(backupLocation) {
            let backupPath;
            // Empty
            if ((0, backup_1.isEmptyWindowBackupInfo)(backupLocation)) {
                backupPath = (0, path_1.join)(this.backupHome, backupLocation.backupFolder);
            }
            // Folder
            else if ((0, backup_2.isFolderBackupInfo)(backupLocation)) {
                backupPath = (0, path_1.join)(this.backupHome, this.getFolderHash(backupLocation));
            }
            // Workspace
            else {
                backupPath = (0, path_1.join)(this.backupHome, backupLocation.workspace.id);
            }
            return this.doHasBackups(backupPath);
        }
        async doHasBackups(backupPath) {
            try {
                const backupSchemas = await pfs_1.Promises.readdir(backupPath);
                for (const backupSchema of backupSchemas) {
                    try {
                        const backupSchemaChildren = await pfs_1.Promises.readdir((0, path_1.join)(backupPath, backupSchema));
                        if (backupSchemaChildren.length > 0) {
                            return true;
                        }
                    }
                    catch (error) {
                        // invalid folder
                    }
                }
            }
            catch (error) {
                // backup path does not exist
            }
            return false;
        }
        storeWorkspacesMetadata() {
            const serializedBackupWorkspaces = {
                workspaces: this.workspaces.map(({ workspace, remoteAuthority }) => {
                    const serializedWorkspaceBackupInfo = {
                        id: workspace.id,
                        configURIPath: workspace.configPath.toString()
                    };
                    if (remoteAuthority) {
                        serializedWorkspaceBackupInfo.remoteAuthority = remoteAuthority;
                    }
                    return serializedWorkspaceBackupInfo;
                }),
                folders: this.folders.map(({ folderUri, remoteAuthority }) => {
                    const serializedFolderBackupInfo = {
                        folderUri: folderUri.toString()
                    };
                    if (remoteAuthority) {
                        serializedFolderBackupInfo.remoteAuthority = remoteAuthority;
                    }
                    return serializedFolderBackupInfo;
                }),
                emptyWindows: this.emptyWindows.map(({ backupFolder, remoteAuthority }) => {
                    const serializedEmptyWindowBackupInfo = {
                        backupFolder
                    };
                    if (remoteAuthority) {
                        serializedEmptyWindowBackupInfo.remoteAuthority = remoteAuthority;
                    }
                    return serializedEmptyWindowBackupInfo;
                })
            };
            this.stateService.setItem(BackupMainService_1.backupWorkspacesMetadataStorageKey, serializedBackupWorkspaces);
        }
        getFolderHash(folder) {
            const folderUri = folder.folderUri;
            let key;
            if (folderUri.scheme === network_1.Schemas.file) {
                key = platform_1.isLinux ? folderUri.fsPath : folderUri.fsPath.toLowerCase(); // for backward compatibility, use the fspath as key
            }
            else {
                key = folderUri.toString().toLowerCase();
            }
            return (0, crypto_1.createHash)('md5').update(key).digest('hex'); // CodeQL [SM04514] Using MD5 to convert a file path to a fixed length
        }
    };
    exports.BackupMainService = BackupMainService;
    exports.BackupMainService = BackupMainService = BackupMainService_1 = __decorate([
        __param(0, environmentMainService_1.IEnvironmentMainService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService),
        __param(3, state_1.IStateService)
    ], BackupMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja3VwTWFpblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9iYWNrdXAvZWxlY3Ryb24tbWFpbi9iYWNrdXBNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb0J6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFpQjs7aUJBSUwsdUNBQWtDLEdBQUcsa0JBQWtCLEFBQXJCLENBQXNCO1FBY2hGLFlBQzBCLHNCQUFnRSxFQUNsRSxvQkFBNEQsRUFDdEUsVUFBd0MsRUFDdEMsWUFBNEM7WUFIakIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUNqRCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3JELGVBQVUsR0FBVixVQUFVLENBQWE7WUFDckIsaUJBQVksR0FBWixZQUFZLENBQWU7WUFoQmxELGVBQVUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsVUFBVSxDQUFDO1lBRXRELGVBQVUsR0FBMkIsRUFBRSxDQUFDO1lBQ3hDLFlBQU8sR0FBd0IsRUFBRSxDQUFDO1lBQ2xDLGlCQUFZLEdBQTZCLEVBQUUsQ0FBQztZQUVwRCw4Q0FBOEM7WUFDOUMsd0NBQXdDO1lBQ3hDLGlDQUFpQztZQUNoQixzQkFBaUIsR0FBRyxzQ0FBMEIsQ0FBQztZQUMvQyx1QkFBa0IsR0FBRyxFQUFFLE9BQU8sRUFBRSxDQUFDLEtBQWEsRUFBRSxLQUFhLEVBQUUsRUFBRSxDQUFDLElBQUEsaUJBQU8sRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsa0JBQU8sQ0FBQyxFQUFFLENBQUM7UUFRckgsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVO1lBRWYseUJBQXlCO1lBQ3pCLE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FB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