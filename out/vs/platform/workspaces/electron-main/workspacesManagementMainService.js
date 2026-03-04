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
define(["require", "exports", "electron", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/node/pfs", "vs/nls", "vs/platform/backup/electron-main/backup", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/windows/electron-main/windowsFinder", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/platform/workspaces/node/workspaces"], function (require, exports, electron_1, event_1, json_1, lifecycle_1, network_1, path_1, resources_1, pfs_1, nls_1, backup_1, dialogMainService_1, environmentMainService_1, instantiation_1, log_1, userDataProfile_1, windowsFinder_1, workspace_1, workspaces_1, workspaces_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacesManagementMainService = exports.IWorkspacesManagementMainService = void 0;
    exports.IWorkspacesManagementMainService = (0, instantiation_1.createDecorator)('workspacesManagementMainService');
    let WorkspacesManagementMainService = class WorkspacesManagementMainService extends lifecycle_1.Disposable {
        constructor(environmentMainService, logService, userDataProfilesMainService, backupMainService, dialogMainService) {
            super();
            this.environmentMainService = environmentMainService;
            this.logService = logService;
            this.userDataProfilesMainService = userDataProfilesMainService;
            this.backupMainService = backupMainService;
            this.dialogMainService = dialogMainService;
            this._onDidDeleteUntitledWorkspace = this._register(new event_1.Emitter());
            this.onDidDeleteUntitledWorkspace = this._onDidDeleteUntitledWorkspace.event;
            this._onDidEnterWorkspace = this._register(new event_1.Emitter());
            this.onDidEnterWorkspace = this._onDidEnterWorkspace.event;
            this.untitledWorkspacesHome = this.environmentMainService.untitledWorkspacesHome; // local URI that contains all untitled workspaces
            this.untitledWorkspaces = [];
        }
        async initialize() {
            // Reset
            this.untitledWorkspaces = [];
            // Resolve untitled workspaces
            try {
                const untitledWorkspacePaths = (await pfs_1.Promises.readdir(this.untitledWorkspacesHome.with({ scheme: network_1.Schemas.file }).fsPath)).map(folder => (0, resources_1.joinPath)(this.untitledWorkspacesHome, folder, workspace_1.UNTITLED_WORKSPACE_NAME));
                for (const untitledWorkspacePath of untitledWorkspacePaths) {
                    const workspace = (0, workspaces_2.getWorkspaceIdentifier)(untitledWorkspacePath);
                    const resolvedWorkspace = await this.resolveLocalWorkspace(untitledWorkspacePath);
                    if (!resolvedWorkspace) {
                        await this.deleteUntitledWorkspace(workspace);
                    }
                    else {
                        this.untitledWorkspaces.push({ workspace, remoteAuthority: resolvedWorkspace.remoteAuthority });
                    }
                }
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    this.logService.warn(`Unable to read folders in ${this.untitledWorkspacesHome} (${error}).`);
                }
            }
        }
        resolveLocalWorkspace(uri) {
            return this.doResolveLocalWorkspace(uri, path => pfs_1.Promises.readFile(path, 'utf8'));
        }
        doResolveLocalWorkspace(uri, contentsFn) {
            if (!this.isWorkspacePath(uri)) {
                return undefined; // does not look like a valid workspace config file
            }
            if (uri.scheme !== network_1.Schemas.file) {
                return undefined;
            }
            try {
                const contents = contentsFn(uri.fsPath);
                if (contents instanceof Promise) {
                    return contents.then(value => this.doResolveWorkspace(uri, value), error => undefined /* invalid workspace */);
                }
                else {
                    return this.doResolveWorkspace(uri, contents);
                }
            }
            catch {
                return undefined; // invalid workspace
            }
        }
        isWorkspacePath(uri) {
            return (0, workspace_1.isUntitledWorkspace)(uri, this.environmentMainService) || (0, workspace_1.hasWorkspaceFileExtension)(uri);
        }
        doResolveWorkspace(path, contents) {
            try {
                const workspace = this.doParseStoredWorkspace(path, contents);
                const workspaceIdentifier = (0, workspaces_2.getWorkspaceIdentifier)(path);
                return {
                    id: workspaceIdentifier.id,
                    configPath: workspaceIdentifier.configPath,
                    folders: (0, workspaces_1.toWorkspaceFolders)(workspace.folders, workspaceIdentifier.configPath, resources_1.extUriBiasedIgnorePathCase),
                    remoteAuthority: workspace.remoteAuthority,
                    transient: workspace.transient
                };
            }
            catch (error) {
                this.logService.warn(error.toString());
            }
            return undefined;
        }
        doParseStoredWorkspace(path, contents) {
            // Parse workspace file
            const storedWorkspace = (0, json_1.parse)(contents); // use fault tolerant parser
            // Filter out folders which do not have a path or uri set
            if (storedWorkspace && Array.isArray(storedWorkspace.folders)) {
                storedWorkspace.folders = storedWorkspace.folders.filter(folder => (0, workspaces_1.isStoredWorkspaceFolder)(folder));
            }
            else {
                throw new Error(`${path.toString(true)} looks like an invalid workspace file.`);
            }
            return storedWorkspace;
        }
        async createUntitledWorkspace(folders, remoteAuthority) {
            const { workspace, storedWorkspace } = this.newUntitledWorkspace(folders, remoteAuthority);
            const configPath = workspace.configPath.fsPath;
            await pfs_1.Promises.mkdir((0, path_1.dirname)(configPath), { recursive: true });
            await pfs_1.Promises.writeFile(configPath, JSON.stringify(storedWorkspace, null, '\t'));
            this.untitledWorkspaces.push({ workspace, remoteAuthority });
            return workspace;
        }
        newUntitledWorkspace(folders = [], remoteAuthority) {
            const randomId = (Date.now() + Math.round(Math.random() * 1000)).toString();
            const untitledWorkspaceConfigFolder = (0, resources_1.joinPath)(this.untitledWorkspacesHome, randomId);
            const untitledWorkspaceConfigPath = (0, resources_1.joinPath)(untitledWorkspaceConfigFolder, workspace_1.UNTITLED_WORKSPACE_NAME);
            const storedWorkspaceFolder = [];
            for (const folder of folders) {
                storedWorkspaceFolder.push((0, workspaces_1.getStoredWorkspaceFolder)(folder.uri, true, folder.name, untitledWorkspaceConfigFolder, resources_1.extUriBiasedIgnorePathCase));
            }
            return {
                workspace: (0, workspaces_2.getWorkspaceIdentifier)(untitledWorkspaceConfigPath),
                storedWorkspace: { folders: storedWorkspaceFolder, remoteAuthority }
            };
        }
        async getWorkspaceIdentifier(configPath) {
            return (0, workspaces_2.getWorkspaceIdentifier)(configPath);
        }
        isUntitledWorkspace(workspace) {
            return (0, workspace_1.isUntitledWorkspace)(workspace.configPath, this.environmentMainService);
        }
        async deleteUntitledWorkspace(workspace) {
            if (!this.isUntitledWorkspace(workspace)) {
                return; // only supported for untitled workspaces
            }
            // Delete from disk
            await this.doDeleteUntitledWorkspace(workspace);
            // unset workspace from profiles
            if (this.userDataProfilesMainService.isEnabled()) {
                this.userDataProfilesMainService.unsetWorkspace(workspace);
            }
            // Event
            this._onDidDeleteUntitledWorkspace.fire(workspace);
        }
        async doDeleteUntitledWorkspace(workspace) {
            const configPath = (0, resources_1.originalFSPath)(workspace.configPath);
            try {
                // Delete Workspace
                await pfs_1.Promises.rm((0, path_1.dirname)(configPath));
                // Mark Workspace Storage to be deleted
                const workspaceStoragePath = (0, path_1.join)(this.environmentMainService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath, workspace.id);
                if (await pfs_1.Promises.exists(workspaceStoragePath)) {
                    await pfs_1.Promises.writeFile((0, path_1.join)(workspaceStoragePath, 'obsolete'), '');
                }
                // Remove from list
                this.untitledWorkspaces = this.untitledWorkspaces.filter(untitledWorkspace => untitledWorkspace.workspace.id !== workspace.id);
            }
            catch (error) {
                this.logService.warn(`Unable to delete untitled workspace ${configPath} (${error}).`);
            }
        }
        getUntitledWorkspaces() {
            return this.untitledWorkspaces;
        }
        async enterWorkspace(window, windows, path) {
            if (!window || !window.win || !window.isReady) {
                return undefined; // return early if the window is not ready or disposed
            }
            const isValid = await this.isValidTargetWorkspacePath(window, windows, path);
            if (!isValid) {
                return undefined; // return early if the workspace is not valid
            }
            const result = await this.doEnterWorkspace(window, (0, workspaces_2.getWorkspaceIdentifier)(path));
            if (!result) {
                return undefined;
            }
            // Emit as event
            this._onDidEnterWorkspace.fire({ window, workspace: result.workspace });
            return result;
        }
        async isValidTargetWorkspacePath(window, windows, workspacePath) {
            if (!workspacePath) {
                return true;
            }
            if ((0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace) && resources_1.extUriBiasedIgnorePathCase.isEqual(window.openedWorkspace.configPath, workspacePath)) {
                return false; // window is already opened on a workspace with that path
            }
            // Prevent overwriting a workspace that is currently opened in another window
            if ((0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(windows, workspacePath)) {
                await this.dialogMainService.showMessageBox({
                    type: 'info',
                    buttons: [(0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK")],
                    message: (0, nls_1.localize)('workspaceOpenedMessage', "Unable to save workspace '{0}'", (0, resources_1.basename)(workspacePath)),
                    detail: (0, nls_1.localize)('workspaceOpenedDetail', "The workspace is already opened in another window. Please close that window first and then try again.")
                }, electron_1.BrowserWindow.getFocusedWindow() ?? undefined);
                return false;
            }
            return true; // OK
        }
        async doEnterWorkspace(window, workspace) {
            if (!window.config) {
                return undefined;
            }
            window.focus();
            // Register window for backups and migrate current backups over
            let backupPath;
            if (!window.config.extensionDevelopmentPath) {
                if (window.config.backupPath) {
                    backupPath = await this.backupMainService.registerWorkspaceBackup({ workspace, remoteAuthority: window.remoteAuthority }, window.config.backupPath);
                }
                else {
                    backupPath = this.backupMainService.registerWorkspaceBackup({ workspace, remoteAuthority: window.remoteAuthority });
                }
            }
            // if the window was opened on an untitled workspace, delete it.
            if ((0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace) && this.isUntitledWorkspace(window.openedWorkspace)) {
                await this.deleteUntitledWorkspace(window.openedWorkspace);
            }
            // Update window configuration properly based on transition to workspace
            window.config.workspace = workspace;
            window.config.backupPath = backupPath;
            return { workspace, backupPath };
        }
    };
    exports.WorkspacesManagementMainService = WorkspacesManagementMainService;
    exports.WorkspacesManagementMainService = WorkspacesManagementMainService = __decorate([
        __param(0, environmentMainService_1.IEnvironmentMainService),
        __param(1, log_1.ILogService),
        __param(2, userDataProfile_1.IUserDataProfilesMainService),
        __param(3, backup_1.IBackupMainService),
        __param(4, dialogMainService_1.IDialogMainService)
    ], WorkspacesManagementMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlc01hbmFnZW1lbnRNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3dvcmtzcGFjZXMvZWxlY3Ryb24tbWFpbi93b3Jrc3BhY2VzTWFuYWdlbWVudE1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXdCbkYsUUFBQSxnQ0FBZ0MsR0FBRyxJQUFBLCtCQUFlLEVBQW1DLGlDQUFpQyxDQUFDLENBQUM7SUE0QjlILElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQWdDLFNBQVEsc0JBQVU7UUFjOUQsWUFDMEIsc0JBQWdFLEVBQzVFLFVBQXdDLEVBQ3ZCLDJCQUEwRSxFQUNwRixpQkFBc0QsRUFDdEQsaUJBQXNEO1lBRTFFLEtBQUssRUFBRSxDQUFDO1lBTmtDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDM0QsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNOLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBOEI7WUFDbkUsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNyQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBZjFELGtDQUE2QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXdCLENBQUMsQ0FBQztZQUM1RixpQ0FBNEIsR0FBZ0MsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FBQztZQUU3Rix5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUEwQixDQUFDLENBQUM7WUFDckYsd0JBQW1CLEdBQWtDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFFN0UsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLHNCQUFzQixDQUFD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