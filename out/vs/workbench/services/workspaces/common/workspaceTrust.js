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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/network", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteHosts", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/memento", "vs/workbench/services/environment/common/environmentService", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/resources", "vs/base/common/platform", "vs/platform/files/common/files", "vs/base/common/async"], function (require, exports, event_1, lifecycle_1, linkedList_1, network_1, uri_1, configuration_1, extensions_1, remoteAuthorityResolver_1, remoteHosts_1, virtualWorkspace_1, storage_1, workspace_1, workspaceTrust_1, memento_1, environmentService_1, uriIdentity_1, resources_1, platform_1, files_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTrustRequestService = exports.WorkspaceTrustManagementService = exports.WorkspaceTrustEnablementService = exports.CanonicalWorkspace = exports.WORKSPACE_TRUST_STORAGE_KEY = exports.WORKSPACE_TRUST_EXTENSION_SUPPORT = exports.WORKSPACE_TRUST_EMPTY_WINDOW = exports.WORKSPACE_TRUST_UNTRUSTED_FILES = exports.WORKSPACE_TRUST_BANNER = exports.WORKSPACE_TRUST_STARTUP_PROMPT = exports.WORKSPACE_TRUST_ENABLED = void 0;
    exports.WORKSPACE_TRUST_ENABLED = 'security.workspace.trust.enabled';
    exports.WORKSPACE_TRUST_STARTUP_PROMPT = 'security.workspace.trust.startupPrompt';
    exports.WORKSPACE_TRUST_BANNER = 'security.workspace.trust.banner';
    exports.WORKSPACE_TRUST_UNTRUSTED_FILES = 'security.workspace.trust.untrustedFiles';
    exports.WORKSPACE_TRUST_EMPTY_WINDOW = 'security.workspace.trust.emptyWindow';
    exports.WORKSPACE_TRUST_EXTENSION_SUPPORT = 'extensions.supportUntrustedWorkspaces';
    exports.WORKSPACE_TRUST_STORAGE_KEY = 'content.trust.model.key';
    class CanonicalWorkspace {
        constructor(originalWorkspace, canonicalFolderUris, canonicalConfiguration) {
            this.originalWorkspace = originalWorkspace;
            this.canonicalFolderUris = canonicalFolderUris;
            this.canonicalConfiguration = canonicalConfiguration;
        }
        get folders() {
            return this.originalWorkspace.folders.map((folder, index) => {
                return {
                    index: folder.index,
                    name: folder.name,
                    toResource: folder.toResource,
                    uri: this.canonicalFolderUris[index]
                };
            });
        }
        get transient() {
            return this.originalWorkspace.transient;
        }
        get configuration() {
            return this.canonicalConfiguration ?? this.originalWorkspace.configuration;
        }
        get id() {
            return this.originalWorkspace.id;
        }
    }
    exports.CanonicalWorkspace = CanonicalWorkspace;
    let WorkspaceTrustEnablementService = class WorkspaceTrustEnablementService extends lifecycle_1.Disposable {
        constructor(configurationService, environmentService) {
            super();
            this.configurationService = configurationService;
            this.environmentService = environmentService;
        }
        isWorkspaceTrustEnabled() {
            if (this.environmentService.disableWorkspaceTrust) {
                return false;
            }
            return !!this.configurationService.getValue(exports.WORKSPACE_TRUST_ENABLED);
        }
    };
    exports.WorkspaceTrustEnablementService = WorkspaceTrustEnablementService;
    exports.WorkspaceTrustEnablementService = WorkspaceTrustEnablementService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService)
    ], WorkspaceTrustEnablementService);
    let WorkspaceTrustManagementService = class WorkspaceTrustManagementService extends lifecycle_1.Disposable {
        constructor(configurationService, remoteAuthorityResolverService, storageService, uriIdentityService, environmentService, workspaceService, workspaceTrustEnablementService, fileService) {
            super();
            this.configurationService = configurationService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.storageService = storageService;
            this.uriIdentityService = uriIdentityService;
            this.environmentService = environmentService;
            this.workspaceService = workspaceService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.fileService = fileService;
            this.storageKey = exports.WORKSPACE_TRUST_STORAGE_KEY;
            this._onDidChangeTrust = this._register(new event_1.Emitter());
            this.onDidChangeTrust = this._onDidChangeTrust.event;
            this._onDidChangeTrustedFolders = this._register(new event_1.Emitter());
            this.onDidChangeTrustedFolders = this._onDidChangeTrustedFolders.event;
            this._canonicalStartupFiles = [];
            this._canonicalUrisResolved = false;
            this._canonicalWorkspace = this.workspaceService.getWorkspace();
            ({ promise: this._workspaceResolvedPromise, resolve: this._workspaceResolvedPromiseResolve } = (0, async_1.promiseWithResolvers)());
            ({ promise: this._workspaceTrustInitializedPromise, resolve: this._workspaceTrustInitializedPromiseResolve } = (0, async_1.promiseWithResolvers)());
            this._storedTrustState = new WorkspaceTrustMemento(platform_1.isWeb && this.isEmptyWorkspace() ? undefined : this.storageService);
            this._trustTransitionManager = this._register(new WorkspaceTrustTransitionManager());
            this._trustStateInfo = this.loadTrustInfo();
            this._isTrusted = this.calculateWorkspaceTrust();
            this.initializeWorkspaceTrust();
            this.registerListeners();
        }
        //#region initialize
        initializeWorkspaceTrust() {
            // Resolve canonical Uris
            this.resolveCanonicalUris()
                .then(async () => {
                this._canonicalUrisResolved = true;
                await this.updateWorkspaceTrust();
            })
                .finally(() => {
                this._workspaceResolvedPromiseResolve();
                if (!this.environmentService.remoteAuthority) {
                    this._workspaceTrustInitializedPromiseResolve();
                }
            });
            // Remote - resolve remote authority
            if (this.environmentService.remoteAuthority) {
                this.remoteAuthorityResolverService.resolveAuthority(this.environmentService.remoteAuthority)
                    .then(async (result) => {
                    this._remoteAuthority = result;
                    await this.fileService.activateProvider(network_1.Schemas.vscodeRemote);
                    await this.updateWorkspaceTrust();
                })
                    .finally(() => {
                    this._workspaceTrustInitializedPromiseResolve();
                });
            }
            // Empty workspace - save initial state to memento
            if (this.isEmptyWorkspace()) {
                this._workspaceTrustInitializedPromise.then(() => {
                    if (this._storedTrustState.isEmptyWorkspaceTrusted === undefined) {
                        this._storedTrustState.isEmptyWorkspaceTrusted = this.isWorkspaceTrusted();
                    }
                });
            }
        }
        //#endregion
        //#region private interface
        registerListeners() {
            this._register(this.workspaceService.onDidChangeWorkspaceFolders(async () => await this.updateWorkspaceTrust()));
            this._register(this.storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, this.storageKey, this._register(new lifecycle_1.DisposableStore()))(async () => {
                /* This will only execute if storage was changed by a user action in a separate window */
                if (JSON.stringify(this._trustStateInfo) !== JSON.stringify(this.loadTrustInfo())) {
                    this._trustStateInfo = this.loadTrustInfo();
                    this._onDidChangeTrustedFolders.fire();
                    await this.updateWorkspaceTrust();
                }
            }));
        }
        async getCanonicalUri(uri) {
            let canonicalUri = uri;
            if (this.environmentService.remoteAuthority && uri.scheme === network_1.Schemas.vscodeRemote) {
                canonicalUri = await this.remoteAuthorityResolverService.getCanonicalURI(uri);
            }
            else if (uri.scheme === 'vscode-vfs') {
                const index = uri.authority.indexOf('+');
                if (index !== -1) {
                    canonicalUri = uri.with({ authority: uri.authority.substr(0, index) });
                }
            }
            // ignore query and fragent section of uris always
            return canonicalUri.with({ query: null, fragment: null });
        }
        async resolveCanonicalUris() {
            // Open editors
            const filesToOpen = [];
            if (this.environmentService.filesToOpenOrCreate) {
                filesToOpen.push(...this.environmentService.filesToOpenOrCreate);
            }
            if (this.environmentService.filesToDiff) {
                filesToOpen.push(...this.environmentService.filesToDiff);
            }
            if (this.environmentService.filesToMerge) {
                filesToOpen.push(...this.environmentService.filesToMerge);
            }
            if (filesToOpen.length) {
                const filesToOpenOrCreateUris = filesToOpen.filter(f => !!f.fileUri).map(f => f.fileUri);
                const canonicalFilesToOpen = await Promise.all(filesToOpenOrCreateUris.map(uri => this.getCanonicalUri(uri)));
                this._canonicalStartupFiles.push(...canonicalFilesToOpen.filter(uri => this._canonicalStartupFiles.every(u => !this.uriIdentityService.extUri.isEqual(uri, u))));
            }
            // Workspace
            const workspaceUris = this.workspaceService.getWorkspace().folders.map(f => f.uri);
            const canonicalWorkspaceFolders = await Promise.all(workspaceUris.map(uri => this.getCanonicalUri(uri)));
            let canonicalWorkspaceConfiguration = this.workspaceService.getWorkspace().configuration;
            if (canonicalWorkspaceConfiguration && (0, workspace_1.isSavedWorkspace)(canonicalWorkspaceConfiguration, this.environmentService)) {
                canonicalWorkspaceConfiguration = await this.getCanonicalUri(canonicalWorkspaceConfiguration);
            }
            this._canonicalWorkspace = new CanonicalWorkspace(this.workspaceService.getWorkspace(), canonicalWorkspaceFolders, canonicalWorkspaceConfiguration);
        }
        loadTrustInfo() {
            const infoAsString = this.storageService.get(this.storageKey, -1 /* StorageScope.APPLICATION */);
            let result;
            try {
                if (infoAsString) {
                    result = JSON.parse(infoAsString);
                }
            }
            catch { }
            if (!result) {
                result = {
                    uriTrustInfo: []
                };
            }
            if (!result.uriTrustInfo) {
                result.uriTrustInfo = [];
            }
            result.uriTrustInfo = result.uriTrustInfo.map(info => { return { uri: uri_1.URI.revive(info.uri), trusted: info.trusted }; });
            result.uriTrustInfo = result.uriTrustInfo.filter(info => info.trusted);
            return result;
        }
        async saveTrustInfo() {
            this.storageService.store(this.storageKey, JSON.stringify(this._trustStateInfo), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            this._onDidChangeTrustedFolders.fire();
            await this.updateWorkspaceTrust();
        }
        getWorkspaceUris() {
            const workspaceUris = this._canonicalWorkspace.folders.map(f => f.uri);
            const workspaceConfiguration = this._canonicalWorkspace.configuration;
            if (workspaceConfiguration && (0, workspace_1.isSavedWorkspace)(workspaceConfiguration, this.environmentService)) {
                workspaceUris.push(workspaceConfiguration);
            }
            return workspaceUris;
        }
        calculateWorkspaceTrust() {
            // Feature is disabled
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                return true;
            }
            // Canonical Uris not yet resolved
            if (!this._canonicalUrisResolved) {
                return false;
            }
            // Remote - resolver explicitly sets workspace trust to TRUE
            if (this.environmentService.remoteAuthority && this._remoteAuthority?.options?.isTrusted) {
                return this._remoteAuthority.options.isTrusted;
            }
            // Empty workspace - use memento, open ediors, or user setting
            if (this.isEmptyWorkspace()) {
                // Use memento if present
                if (this._storedTrustState.isEmptyWorkspaceTrusted !== undefined) {
                    return this._storedTrustState.isEmptyWorkspaceTrusted;
                }
                // Startup files
                if (this._canonicalStartupFiles.length) {
                    return this.getUrisTrust(this._canonicalStartupFiles);
                }
                // User setting
                return !!this.configurationService.getValue(exports.WORKSPACE_TRUST_EMPTY_WINDOW);
            }
            return this.getUrisTrust(this.getWorkspaceUris());
        }
        async updateWorkspaceTrust(trusted) {
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                return;
            }
            if (trusted === undefined) {
                await this.resolveCanonicalUris();
                trusted = this.calculateWorkspaceTrust();
            }
            if (this.isWorkspaceTrusted() === trusted) {
                return;
            }
            // Update workspace trust
            this.isTrusted = trusted;
            // Run workspace trust transition participants
            await this._trustTransitionManager.participate(trusted);
            // Fire workspace trust change event
            this._onDidChangeTrust.fire(trusted);
        }
        getUrisTrust(uris) {
            let state = true;
            for (const uri of uris) {
                const { trusted } = this.doGetUriTrustInfo(uri);
                if (!trusted) {
                    state = trusted;
                    return state;
                }
            }
            return state;
        }
        doGetUriTrustInfo(uri) {
            // Return trusted when workspace trust is disabled
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                return { trusted: true, uri };
            }
            if (this.isTrustedVirtualResource(uri)) {
                return { trusted: true, uri };
            }
            if (this.isTrustedByRemote(uri)) {
                return { trusted: true, uri };
            }
            let resultState = false;
            let maxLength = -1;
            let resultUri = uri;
            for (const trustInfo of this._trustStateInfo.uriTrustInfo) {
                if (this.uriIdentityService.extUri.isEqualOrParent(uri, trustInfo.uri)) {
                    const fsPath = trustInfo.uri.fsPath;
                    if (fsPath.length > maxLength) {
                        maxLength = fsPath.length;
                        resultState = trustInfo.trusted;
                        resultUri = trustInfo.uri;
                    }
                }
            }
            return { trusted: resultState, uri: resultUri };
        }
        async doSetUrisTrust(uris, trusted) {
            let changed = false;
            for (const uri of uris) {
                if (trusted) {
                    if (this.isTrustedVirtualResource(uri)) {
                        continue;
                    }
                    if (this.isTrustedByRemote(uri)) {
                        continue;
                    }
                    const foundItem = this._trustStateInfo.uriTrustInfo.find(trustInfo => this.uriIdentityService.extUri.isEqual(trustInfo.uri, uri));
                    if (!foundItem) {
                        this._trustStateInfo.uriTrustInfo.push({ uri, trusted: true });
                        changed = true;
                    }
                }
                else {
                    const previousLength = this._trustStateInfo.uriTrustInfo.length;
                    this._trustStateInfo.uriTrustInfo = this._trustStateInfo.uriTrustInfo.filter(trustInfo => !this.uriIdentityService.extUri.isEqual(trustInfo.uri, uri));
                    if (previousLength !== this._trustStateInfo.uriTrustInfo.length) {
                        changed = true;
                    }
                }
            }
            if (changed) {
                await this.saveTrustInfo();
            }
        }
        isEmptyWorkspace() {
            if (this.workspaceService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                return true;
            }
            const workspace = this.workspaceService.getWorkspace();
            if (workspace) {
                return (0, workspace_1.isTemporaryWorkspace)(this.workspaceService.getWorkspace()) && workspace.folders.length === 0;
            }
            return false;
        }
        isTrustedVirtualResource(uri) {
            return (0, virtualWorkspace_1.isVirtualResource)(uri) && uri.scheme !== 'vscode-vfs';
        }
        isTrustedByRemote(uri) {
            if (!this.environmentService.remoteAuthority) {
                return false;
            }
            if (!this._remoteAuthority) {
                return false;
            }
            return ((0, resources_1.isEqualAuthority)((0, remoteHosts_1.getRemoteAuthority)(uri), this._remoteAuthority.authority.authority)) && !!this._remoteAuthority.options?.isTrusted;
        }
        set isTrusted(value) {
            this._isTrusted = value;
            // Reset acceptsOutOfWorkspaceFiles
            if (!value) {
                this._storedTrustState.acceptsOutOfWorkspaceFiles = false;
            }
            // Empty workspace - save memento
            if (this.isEmptyWorkspace()) {
                this._storedTrustState.isEmptyWorkspaceTrusted = value;
            }
        }
        //#endregion
        //#region public interface
        get workspaceResolved() {
            return this._workspaceResolvedPromise;
        }
        get workspaceTrustInitialized() {
            return this._workspaceTrustInitializedPromise;
        }
        get acceptsOutOfWorkspaceFiles() {
            return this._storedTrustState.acceptsOutOfWorkspaceFiles;
        }
        set acceptsOutOfWorkspaceFiles(value) {
            this._storedTrustState.acceptsOutOfWorkspaceFiles = value;
        }
        isWorkspaceTrusted() {
            return this._isTrusted;
        }
        isWorkspaceTrustForced() {
            // Remote - remote authority explicitly sets workspace trust
            if (this.environmentService.remoteAuthority && this._remoteAuthority && this._remoteAuthority.options?.isTrusted !== undefined) {
                return true;
            }
            // All workspace uris are trusted automatically
            const workspaceUris = this.getWorkspaceUris().filter(uri => !this.isTrustedVirtualResource(uri));
            if (workspaceUris.length === 0) {
                return true;
            }
            return false;
        }
        canSetParentFolderTrust() {
            const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this._canonicalWorkspace);
            if (!(0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdentifier)) {
                return false;
            }
            if (workspaceIdentifier.uri.scheme !== network_1.Schemas.file && workspaceIdentifier.uri.scheme !== network_1.Schemas.vscodeRemote) {
                return false;
            }
            const parentFolder = this.uriIdentityService.extUri.dirname(workspaceIdentifier.uri);
            if (this.uriIdentityService.extUri.isEqual(workspaceIdentifier.uri, parentFolder)) {
                return false;
            }
            return true;
        }
        async setParentFolderTrust(trusted) {
            if (this.canSetParentFolderTrust()) {
                const workspaceUri = (0, workspace_1.toWorkspaceIdentifier)(this._canonicalWorkspace).uri;
                const parentFolder = this.uriIdentityService.extUri.dirname(workspaceUri);
                await this.setUrisTrust([parentFolder], trusted);
            }
        }
        canSetWorkspaceTrust() {
            // Remote - remote authority not yet resolved, or remote authority explicitly sets workspace trust
            if (this.environmentService.remoteAuthority && (!this._remoteAuthority || this._remoteAuthority.options?.isTrusted !== undefined)) {
                return false;
            }
            // Empty workspace
            if (this.isEmptyWorkspace()) {
                return true;
            }
            // All workspace uris are trusted automatically
            const workspaceUris = this.getWorkspaceUris().filter(uri => !this.isTrustedVirtualResource(uri));
            if (workspaceUris.length === 0) {
                return false;
            }
            // Untrusted workspace
            if (!this.isWorkspaceTrusted()) {
                return true;
            }
            // Trusted workspaces
            // Can only untrusted in the single folder scenario
            const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this._canonicalWorkspace);
            if (!(0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdentifier)) {
                return false;
            }
            // Can only be untrusted in certain schemes
            if (workspaceIdentifier.uri.scheme !== network_1.Schemas.file && workspaceIdentifier.uri.scheme !== 'vscode-vfs') {
                return false;
            }
            // If the current folder isn't trusted directly, return false
            const trustInfo = this.doGetUriTrustInfo(workspaceIdentifier.uri);
            if (!trustInfo.trusted || !this.uriIdentityService.extUri.isEqual(workspaceIdentifier.uri, trustInfo.uri)) {
                return false;
            }
            // Check if the parent is also trusted
            if (this.canSetParentFolderTrust()) {
                const parentFolder = this.uriIdentityService.extUri.dirname(workspaceIdentifier.uri);
                const parentPathTrustInfo = this.doGetUriTrustInfo(parentFolder);
                if (parentPathTrustInfo.trusted) {
                    return false;
                }
            }
            return true;
        }
        async setWorkspaceTrust(trusted) {
            // Empty workspace
            if (this.isEmptyWorkspace()) {
                await this.updateWorkspaceTrust(trusted);
                return;
            }
            const workspaceFolders = this.getWorkspaceUris();
            await this.setUrisTrust(workspaceFolders, trusted);
        }
        async getUriTrustInfo(uri) {
            // Return trusted when workspace trust is disabled
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                return { trusted: true, uri };
            }
            // Uri is trusted automatically by the remote
            if (this.isTrustedByRemote(uri)) {
                return { trusted: true, uri };
            }
            return this.doGetUriTrustInfo(await this.getCanonicalUri(uri));
        }
        async setUrisTrust(uris, trusted) {
            this.doSetUrisTrust(await Promise.all(uris.map(uri => this.getCanonicalUri(uri))), trusted);
        }
        getTrustedUris() {
            return this._trustStateInfo.uriTrustInfo.map(info => info.uri);
        }
        async setTrustedUris(uris) {
            this._trustStateInfo.uriTrustInfo = [];
            for (const uri of uris) {
                const canonicalUri = await this.getCanonicalUri(uri);
                const cleanUri = this.uriIdentityService.extUri.removeTrailingPathSeparator(canonicalUri);
                let added = false;
                for (const addedUri of this._trustStateInfo.uriTrustInfo) {
                    if (this.uriIdentityService.extUri.isEqual(addedUri.uri, cleanUri)) {
                        added = true;
                        break;
                    }
                }
                if (added) {
                    continue;
                }
                this._trustStateInfo.uriTrustInfo.push({
                    trusted: true,
                    uri: cleanUri
                });
            }
            await this.saveTrustInfo();
        }
        addWorkspaceTrustTransitionParticipant(participant) {
            return this._trustTransitionManager.addWorkspaceTrustTransitionParticipant(participant);
        }
    };
    exports.WorkspaceTrustManagementService = WorkspaceTrustManagementService;
    exports.WorkspaceTrustManagementService = WorkspaceTrustManagementService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, storage_1.IStorageService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(7, files_1.IFileService)
    ], WorkspaceTrustManagementService);
    let WorkspaceTrustRequestService = class WorkspaceTrustRequestService extends lifecycle_1.Disposable {
        constructor(configurationService, workspaceTrustManagementService) {
            super();
            this.configurationService = configurationService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this._onDidInitiateOpenFilesTrustRequest = this._register(new event_1.Emitter());
            this.onDidInitiateOpenFilesTrustRequest = this._onDidInitiateOpenFilesTrustRequest.event;
            this._onDidInitiateWorkspaceTrustRequest = this._register(new event_1.Emitter());
            this.onDidInitiateWorkspaceTrustRequest = this._onDidInitiateWorkspaceTrustRequest.event;
            this._onDidInitiateWorkspaceTrustRequestOnStartup = this._register(new event_1.Emitter());
            this.onDidInitiateWorkspaceTrustRequestOnStartup = this._onDidInitiateWorkspaceTrustRequestOnStartup.event;
        }
        //#region Open file(s) trust request
        get untrustedFilesSetting() {
            return this.configurationService.getValue(exports.WORKSPACE_TRUST_UNTRUSTED_FILES);
        }
        set untrustedFilesSetting(value) {
            this.configurationService.updateValue(exports.WORKSPACE_TRUST_UNTRUSTED_FILES, value);
        }
        async completeOpenFilesTrustRequest(result, saveResponse) {
            if (!this._openFilesTrustRequestResolver) {
                return;
            }
            // Set acceptsOutOfWorkspaceFiles
            if (result === 1 /* WorkspaceTrustUriResponse.Open */) {
                this.workspaceTrustManagementService.acceptsOutOfWorkspaceFiles = true;
            }
            // Save response
            if (saveResponse) {
                if (result === 1 /* WorkspaceTrustUriResponse.Open */) {
                    this.untrustedFilesSetting = 'open';
                }
                if (result === 2 /* WorkspaceTrustUriResponse.OpenInNewWindow */) {
                    this.untrustedFilesSetting = 'newWindow';
                }
            }
            // Resolve promise
            this._openFilesTrustRequestResolver(result);
            this._openFilesTrustRequestResolver = undefined;
            this._openFilesTrustRequestPromise = undefined;
        }
        async requestOpenFilesTrust(uris) {
            // If workspace is untrusted, there is no conflict
            if (!this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                return 1 /* WorkspaceTrustUriResponse.Open */;
            }
            const openFilesTrustInfo = await Promise.all(uris.map(uri => this.workspaceTrustManagementService.getUriTrustInfo(uri)));
            // If all uris are trusted, there is no conflict
            if (openFilesTrustInfo.map(info => info.trusted).every(trusted => trusted)) {
                return 1 /* WorkspaceTrustUriResponse.Open */;
            }
            // If user has setting, don't need to ask
            if (this.untrustedFilesSetting !== 'prompt') {
                if (this.untrustedFilesSetting === 'newWindow') {
                    return 2 /* WorkspaceTrustUriResponse.OpenInNewWindow */;
                }
                if (this.untrustedFilesSetting === 'open') {
                    return 1 /* WorkspaceTrustUriResponse.Open */;
                }
            }
            // If we already asked the user, don't need to ask again
            if (this.workspaceTrustManagementService.acceptsOutOfWorkspaceFiles) {
                return 1 /* WorkspaceTrustUriResponse.Open */;
            }
            // Create/return a promise
            if (!this._openFilesTrustRequestPromise) {
                this._openFilesTrustRequestPromise = new Promise(resolve => {
                    this._openFilesTrustRequestResolver = resolve;
                });
            }
            else {
                return this._openFilesTrustRequestPromise;
            }
            this._onDidInitiateOpenFilesTrustRequest.fire();
            return this._openFilesTrustRequestPromise;
        }
        //#endregion
        //#region Workspace trust request
        resolveWorkspaceTrustRequest(trusted) {
            if (this._workspaceTrustRequestResolver) {
                this._workspaceTrustRequestResolver(trusted ?? this.workspaceTrustManagementService.isWorkspaceTrusted());
                this._workspaceTrustRequestResolver = undefined;
                this._workspaceTrustRequestPromise = undefined;
            }
        }
        cancelWorkspaceTrustRequest() {
            if (this._workspaceTrustRequestResolver) {
                this._workspaceTrustRequestResolver(undefined);
                this._workspaceTrustRequestResolver = undefined;
                this._workspaceTrustRequestPromise = undefined;
            }
        }
        async completeWorkspaceTrustRequest(trusted) {
            if (trusted === undefined || trusted === this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                this.resolveWorkspaceTrustRequest(trusted);
                return;
            }
            // Register one-time event handler to resolve the promise when workspace trust changed
            event_1.Event.once(this.workspaceTrustManagementService.onDidChangeTrust)(trusted => this.resolveWorkspaceTrustRequest(trusted));
            // Update storage, transition workspace state
            await this.workspaceTrustManagementService.setWorkspaceTrust(trusted);
        }
        async requestWorkspaceTrust(options) {
            // Trusted workspace
            if (this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                return this.workspaceTrustManagementService.isWorkspaceTrusted();
            }
            // Modal request
            if (!this._workspaceTrustRequestPromise) {
                // Create promise
                this._workspaceTrustRequestPromise = new Promise(resolve => {
                    this._workspaceTrustRequestResolver = resolve;
                });
            }
            else {
                // Return existing promise
                return this._workspaceTrustRequestPromise;
            }
            this._onDidInitiateWorkspaceTrustRequest.fire(options);
            return this._workspaceTrustRequestPromise;
        }
        requestWorkspaceTrustOnStartup() {
            if (!this._workspaceTrustRequestPromise) {
                // Create promise
                this._workspaceTrustRequestPromise = new Promise(resolve => {
                    this._workspaceTrustRequestResolver = resolve;
                });
            }
            this._onDidInitiateWorkspaceTrustRequestOnStartup.fire();
        }
    };
    exports.WorkspaceTrustRequestService = WorkspaceTrustRequestService;
    exports.WorkspaceTrustRequestService = WorkspaceTrustRequestService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], WorkspaceTrustRequestService);
    class WorkspaceTrustTransitionManager extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.participants = new linkedList_1.LinkedList();
        }
        addWorkspaceTrustTransitionParticipant(participant) {
            const remove = this.participants.push(participant);
            return (0, lifecycle_1.toDisposable)(() => remove());
        }
        async participate(trusted) {
            for (const participant of this.participants) {
                await participant.participate(trusted);
            }
        }
        dispose() {
            this.participants.clear();
            super.dispose();
        }
    }
    class WorkspaceTrustMemento {
        constructor(storageService) {
            this._acceptsOutOfWorkspaceFilesKey = 'acceptsOutOfWorkspaceFiles';
            this._isEmptyWorkspaceTrustedKey = 'isEmptyWorkspaceTrusted';
            if (storageService) {
                this._memento = new memento_1.Memento('workspaceTrust', storageService);
                this._mementoObject = this._memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this._mementoObject = {};
            }
        }
        get acceptsOutOfWorkspaceFiles() {
            return this._mementoObject[this._acceptsOutOfWorkspaceFilesKey] ?? false;
        }
        set acceptsOutOfWorkspaceFiles(value) {
            this._mementoObject[this._acceptsOutOfWorkspaceFilesKey] = value;
            this._memento?.saveMemento();
        }
        get isEmptyWorkspaceTrusted() {
            return this._mementoObject[this._isEmptyWorkspaceTrustedKey];
        }
        set isEmptyWorkspaceTrusted(value) {
            this._mementoObject[this._isEmptyWorkspaceTrustedKey] = value;
            this._memento?.saveMemento();
        }
    }
    (0, extensions_1.registerSingleton)(workspaceTrust_1.IWorkspaceTrustRequestService, WorkspaceTrustRequestService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVHJ1c3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya3NwYWNlcy9jb21tb24vd29ya3NwYWNlVHJ1c3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0JuRixRQUFBLHVCQUF1QixHQUFHLGtDQUFrQyxDQUFDO0lBQzdELFFBQUEsOEJBQThCLEdBQUcsd0NBQXdDLENBQUM7SUFDMUUsUUFBQSxzQkFBc0IsR0FBRyxpQ0FBaUMsQ0FBQztJQUMzRCxRQUFBLCtCQUErQixHQUFHLHlDQUF5QyxDQUFDO0lBQzVFLFFBQUEsNEJBQTRCLEdBQUcsc0NBQXNDLENBQUM7SUFDdEUsUUFBQSxpQ0FBaUMsR0FBRyx1Q0FBdUMsQ0FBQztJQUM1RSxRQUFBLDJCQUEyQixHQUFHLHlCQUF5QixDQUFDO0lBRXJFLE1BQWEsa0JBQWtCO1FBQzlCLFlBQ2tCLGlCQUE2QixFQUM3QixtQkFBMEIsRUFDMUIsc0JBQThDO1lBRjlDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBWTtZQUM3Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQU87WUFDMUIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtRQUM1RCxDQUFDO1FBR0wsSUFBSSxPQUFPO1lBQ1YsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDM0QsT0FBTztvQkFDTixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7b0JBQ25CLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtvQkFDakIsVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVO29CQUM3QixHQUFHLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUss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