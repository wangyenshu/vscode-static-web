/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/ternarySearchTree", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/base/common/network"], function (require, exports, nls_1, path_1, ternarySearchTree_1, resources_1, uri_1, instantiation_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.STANDALONE_EDITOR_WORKSPACE_ID = exports.UNTITLED_WORKSPACE_NAME = exports.WORKSPACE_FILTER = exports.WORKSPACE_SUFFIX = exports.WORKSPACE_EXTENSION = exports.WorkspaceFolder = exports.Workspace = exports.WorkbenchState = exports.UNKNOWN_EMPTY_WINDOW_WORKSPACE = exports.EXTENSION_DEVELOPMENT_EMPTY_WINDOW_WORKSPACE = exports.IWorkspaceContextService = void 0;
    exports.isSingleFolderWorkspaceIdentifier = isSingleFolderWorkspaceIdentifier;
    exports.isEmptyWorkspaceIdentifier = isEmptyWorkspaceIdentifier;
    exports.toWorkspaceIdentifier = toWorkspaceIdentifier;
    exports.isWorkspaceIdentifier = isWorkspaceIdentifier;
    exports.reviveIdentifier = reviveIdentifier;
    exports.isWorkspace = isWorkspace;
    exports.isWorkspaceFolder = isWorkspaceFolder;
    exports.toWorkspaceFolder = toWorkspaceFolder;
    exports.isUntitledWorkspace = isUntitledWorkspace;
    exports.isTemporaryWorkspace = isTemporaryWorkspace;
    exports.isStandaloneEditorWorkspace = isStandaloneEditorWorkspace;
    exports.isSavedWorkspace = isSavedWorkspace;
    exports.hasWorkspaceFileExtension = hasWorkspaceFileExtension;
    exports.IWorkspaceContextService = (0, instantiation_1.createDecorator)('contextService');
    function isSingleFolderWorkspaceIdentifier(obj) {
        const singleFolderIdentifier = obj;
        return typeof singleFolderIdentifier?.id === 'string' && uri_1.URI.isUri(singleFolderIdentifier.uri);
    }
    function isEmptyWorkspaceIdentifier(obj) {
        const emptyWorkspaceIdentifier = obj;
        return typeof emptyWorkspaceIdentifier?.id === 'string'
            && !isSingleFolderWorkspaceIdentifier(obj)
            && !isWorkspaceIdentifier(obj);
    }
    exports.EXTENSION_DEVELOPMENT_EMPTY_WINDOW_WORKSPACE = { id: 'ext-dev' };
    exports.UNKNOWN_EMPTY_WINDOW_WORKSPACE = { id: 'empty-window' };
    function toWorkspaceIdentifier(arg0, isExtensionDevelopment) {
        // Empty workspace
        if (typeof arg0 === 'string' || typeof arg0 === 'undefined') {
            // With a backupPath, the basename is the empty workspace identifier
            if (typeof arg0 === 'string') {
                return {
                    id: (0, path_1.basename)(arg0)
                };
            }
            // Extension development empty windows have backups disabled
            // so we return a constant workspace identifier for extension
            // authors to allow to restore their workspace state even then.
            if (isExtensionDevelopment) {
                return exports.EXTENSION_DEVELOPMENT_EMPTY_WINDOW_WORKSPACE;
            }
            return exports.UNKNOWN_EMPTY_WINDOW_WORKSPACE;
        }
        // Multi root
        const workspace = arg0;
        if (workspace.configuration) {
            return {
                id: workspace.id,
                configPath: workspace.configuration
            };
        }
        // Single folder
        if (workspace.folders.length === 1) {
            return {
                id: workspace.id,
                uri: workspace.folders[0].uri
            };
        }
        // Empty window
        return {
            id: workspace.id
        };
    }
    function isWorkspaceIdentifier(obj) {
        const workspaceIdentifier = obj;
        return typeof workspaceIdentifier?.id === 'string' && uri_1.URI.isUri(workspaceIdentifier.configPath);
    }
    function reviveIdentifier(identifier) {
        // Single Folder
        const singleFolderIdentifierCandidate = identifier;
        if (singleFolderIdentifierCandidate?.uri) {
            return { id: singleFolderIdentifierCandidate.id, uri: uri_1.URI.revive(singleFolderIdentifierCandidate.uri) };
        }
        // Multi folder
        const workspaceIdentifierCandidate = identifier;
        if (workspaceIdentifierCandidate?.configPath) {
            return { id: workspaceIdentifierCandidate.id, configPath: uri_1.URI.revive(workspaceIdentifierCandidate.configPath) };
        }
        // Empty
        if (identifier?.id) {
            return { id: identifier.id };
        }
        return undefined;
    }
    var WorkbenchState;
    (function (WorkbenchState) {
        WorkbenchState[WorkbenchState["EMPTY"] = 1] = "EMPTY";
        WorkbenchState[WorkbenchState["FOLDER"] = 2] = "FOLDER";
        WorkbenchState[WorkbenchState["WORKSPACE"] = 3] = "WORKSPACE";
    })(WorkbenchState || (exports.WorkbenchState = WorkbenchState = {}));
    function isWorkspace(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && typeof candidate.id === 'string'
            && Array.isArray(candidate.folders));
    }
    function isWorkspaceFolder(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && uri_1.URI.isUri(candidate.uri)
            && typeof candidate.name === 'string'
            && typeof candidate.toResource === 'function');
    }
    class Workspace {
        constructor(_id, folders, _transient, _configuration, _ignorePathCasing) {
            this._id = _id;
            this._transient = _transient;
            this._configuration = _configuration;
            this._ignorePathCasing = _ignorePathCasing;
            this._foldersMap = ternarySearchTree_1.TernarySearchTree.forUris(this._ignorePathCasing, () => true);
            this.folders = folders;
        }
        update(workspace) {
            this._id = workspace.id;
            this._configuration = workspace.configuration;
            this._transient = workspace.transient;
            this._ignorePathCasing = workspace._ignorePathCasing;
            this.folders = workspace.folders;
        }
        get folders() {
            return this._folders;
        }
        set folders(folders) {
            this._folders = folders;
            this.updateFoldersMap();
        }
        get id() {
            return this._id;
        }
        get transient() {
            return this._transient;
        }
        get configuration() {
            return this._configuration;
        }
        set configuration(configuration) {
            this._configuration = configuration;
        }
        getFolder(resource) {
            if (!resource) {
                return null;
            }
            return this._foldersMap.findSubstr(resource) || null;
        }
        updateFoldersMap() {
            this._foldersMap = ternarySearchTree_1.TernarySearchTree.forUris(this._ignorePathCasing, () => true);
            for (const folder of this.folders) {
                this._foldersMap.set(folder.uri, folder);
            }
        }
        toJSON() {
            return { id: this.id, folders: this.folders, transient: this.transient, configuration: this.configuration };
        }
    }
    exports.Workspace = Workspace;
    class WorkspaceFolder {
        constructor(data, 
        /**
         * Provides access to the original metadata for this workspace
         * folder. This can be different from the metadata provided in
         * this class:
         * - raw paths can be relative
         * - raw paths are not normalized
         */
        raw) {
            this.raw = raw;
            this.uri = data.uri;
            this.index = data.index;
            this.name = data.name;
        }
        toResource(relativePath) {
            return (0, resources_1.joinPath)(this.uri, relativePath);
        }
        toJSON() {
            return { uri: this.uri, name: this.name, index: this.index };
        }
    }
    exports.WorkspaceFolder = WorkspaceFolder;
    function toWorkspaceFolder(resource) {
        return new WorkspaceFolder({ uri: resource, index: 0, name: (0, resources_1.basenameOrAuthority)(resource) }, { uri: resource.toString() });
    }
    exports.WORKSPACE_EXTENSION = 'code-workspace';
    exports.WORKSPACE_SUFFIX = `.${exports.WORKSPACE_EXTENSION}`;
    exports.WORKSPACE_FILTER = [{ name: (0, nls_1.localize)('codeWorkspace', "Code Workspace"), extensions: [exports.WORKSPACE_EXTENSION] }];
    exports.UNTITLED_WORKSPACE_NAME = 'workspace.json';
    function isUntitledWorkspace(path, environmentService) {
        return resources_1.extUriBiasedIgnorePathCase.isEqualOrParent(path, environmentService.untitledWorkspacesHome);
    }
    function isTemporaryWorkspace(arg1) {
        let path;
        if (uri_1.URI.isUri(arg1)) {
            path = arg1;
        }
        else {
            path = arg1.configuration;
        }
        return path?.scheme === network_1.Schemas.tmp;
    }
    exports.STANDALONE_EDITOR_WORKSPACE_ID = '4064f6ec-cb38-4ad0-af64-ee6467e63c82';
    function isStandaloneEditorWorkspace(workspace) {
        return workspace.id === exports.STANDALONE_EDITOR_WORKSPACE_ID;
    }
    function isSavedWorkspace(path, environmentService) {
        return !isUntitledWorkspace(path, environmentService) && !isTemporaryWorkspace(path);
    }
    function hasWorkspaceFileExtension(path) {
        const ext = (typeof path === 'string') ? (0, path_1.extname)(path) : (0, resources_1.extname)(path);
        return ext === exports.WORKSPACE_SUFFIX;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd29ya3NwYWNlL2NvbW1vbi93b3Jrc3BhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUloRyw4RUFJQztJQUVELGdFQUtDO0lBT0Qsc0RBMkNDO0lBRUQsc0RBSUM7SUFlRCw0Q0FvQkM7SUErQ0Qsa0NBTUM7SUE2QkQsOENBT0M7SUErR0QsOENBRUM7SUFPRCxrREFFQztJQUlELG9EQVNDO0lBR0Qsa0VBRUM7SUFFRCw0Q0FFQztJQUVELDhEQUlDO0lBOWNZLFFBQUEsd0JBQXdCLEdBQUcsSUFBQSwrQkFBZSxFQUEyQixnQkFBZ0IsQ0FBQyxDQUFDO0lBeUhwRyxTQUFnQixpQ0FBaUMsQ0FBQyxHQUFZO1FBQzdELE1BQU0sc0JBQXNCLEdBQUcsR0FBbUQsQ0FBQztRQUVuRixPQUFPLE9BQU8sc0JBQXNCLEVBQUUsRUFBRSxLQUFLLFFBQVEsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hHLENBQUM7SUFFRCxTQUFnQiwwQkFBMEIsQ0FBQyxHQUFZO1FBQ3RELE1BQU0sd0JBQXdCLEdBQUcsR0FBNEMsQ0FBQztRQUM5RSxPQUFPLE9BQU8sd0JBQXdCLEVBQUUsRUFBRSxLQUFLLFFBQVE7ZUFDbkQsQ0FBQyxpQ0FBaUMsQ0FBQyxHQUFHLENBQUM7ZUFDdkMsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRVksUUFBQSw0Q0FBNEMsR0FBOEIsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUM7SUFDNUYsUUFBQSw4QkFBOEIsR0FBOEIsRUFBRSxFQUFFLEVBQUUsY0FBYyxFQUFFLENBQUM7SUFJaEcsU0FBZ0IscUJBQXFCLENB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