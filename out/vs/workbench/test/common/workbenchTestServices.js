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
define(["require", "exports", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/platform/workspace/test/common/testWorkspace", "vs/base/common/platform", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/platform/product/common/product", "vs/platform/log/common/log"], function (require, exports, path_1, resources_1, uri_1, event_1, configuration_1, testWorkspace_1, platform_1, storage_1, extensions_1, lifecycle_1, product_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestMarkerService = exports.TestWorkspaceTrustRequestService = exports.TestWorkspaceTrustManagementService = exports.TestWorkspaceTrustEnablementService = exports.NullFilesConfigurationService = exports.TestActivityService = exports.TestProductService = exports.TestExtensionService = exports.TestWorkingCopyFileService = exports.TestWorkingCopy = exports.TestHistoryService = exports.TestStorageService = exports.TestContextService = exports.TestTextResourcePropertiesService = exports.TestLoggerService = void 0;
    exports.createFileStat = createFileStat;
    exports.mock = mock;
    class TestLoggerService extends log_1.AbstractLoggerService {
        constructor(logsHome) {
            super(log_1.LogLevel.Info, logsHome ?? uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }));
        }
        doCreateLogger() { return new log_1.NullLogger(); }
    }
    exports.TestLoggerService = TestLoggerService;
    let TestTextResourcePropertiesService = class TestTextResourcePropertiesService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getEOL(resource, language) {
            const eol = this.configurationService.getValue('files.eol', { overrideIdentifier: language, resource });
            if (eol && typeof eol === 'string' && eol !== 'auto') {
                return eol;
            }
            return (platform_1.isLinux || platform_1.isMacintosh) ? '\n' : '\r\n';
        }
    };
    exports.TestTextResourcePropertiesService = TestTextResourcePropertiesService;
    exports.TestTextResourcePropertiesService = TestTextResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], TestTextResourcePropertiesService);
    class TestContextService {
        get onDidChangeWorkspaceName() { return this._onDidChangeWorkspaceName.event; }
        get onWillChangeWorkspaceFolders() { return this._onWillChangeWorkspaceFolders.event; }
        get onDidChangeWorkspaceFolders() { return this._onDidChangeWorkspaceFolders.event; }
        get onDidChangeWorkbenchState() { return this._onDidChangeWorkbenchState.event; }
        constructor(workspace = testWorkspace_1.TestWorkspace, options = null) {
            this.workspace = workspace;
            this.options = options || Object.create(null);
            this._onDidChangeWorkspaceName = new event_1.Emitter();
            this._onWillChangeWorkspaceFolders = new event_1.Emitter();
            this._onDidChangeWorkspaceFolders = new event_1.Emitter();
            this._onDidChangeWorkbenchState = new event_1.Emitter();
        }
        getFolders() {
            return this.workspace ? this.workspace.folders : [];
        }
        getWorkbenchState() {
            if (this.workspace.configuration) {
                return 3 /* WorkbenchState.WORKSPACE */;
            }
            if (this.workspace.folders.length) {
                return 2 /* WorkbenchState.FOLDER */;
            }
            return 1 /* WorkbenchState.EMPTY */;
        }
        getCompleteWorkspace() {
            return Promise.resolve(this.getWorkspace());
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkspaceFolder(resource) {
            return this.workspace.getFolder(resource);
        }
        setWorkspace(workspace) {
            this.workspace = workspace;
        }
        getOptions() {
            return this.options;
        }
        updateOptions() { }
        isInsideWorkspace(resource) {
            if (resource && this.workspace) {
                return (0, resources_1.isEqualOrParent)(resource, this.workspace.folders[0].uri);
            }
            return false;
        }
        toResource(workspaceRelativePath) {
            return uri_1.URI.file((0, path_1.join)('C:\\', workspaceRelativePath));
        }
        isCurrentWorkspace(workspaceIdOrFolder) {
            return uri_1.URI.isUri(workspaceIdOrFolder) && (0, resources_1.isEqual)(this.workspace.folders[0].uri, workspaceIdOrFolder);
        }
    }
    exports.TestContextService = TestContextService;
    class TestStorageService extends storage_1.InMemoryStorageService {
        testEmitWillSaveState(reason) {
            super.emitWillSaveState(reason);
        }
    }
    exports.TestStorageService = TestStorageService;
    class TestHistoryService {
        constructor(root) {
            this.root = root;
        }
        async reopenLastClosedEditor() { }
        async goForward() { }
        async goBack() { }
        async goPrevious() { }
        async goLast() { }
        removeFromHistory(_input) { }
        clear() { }
        clearRecentlyOpened() { }
        getHistory() { return []; }
        async openNextRecentlyUsedEditor(group) { }
        async openPreviouslyUsedEditor(group) { }
        getLastActiveWorkspaceRoot(_schemeFilter) { return this.root; }
        getLastActiveFile(_schemeFilter) { return undefined; }
    }
    exports.TestHistoryService = TestHistoryService;
    class TestWorkingCopy extends lifecycle_1.Disposable {
        constructor(resource, isDirty = false, typeId = 'testWorkingCopyType') {
            super();
            this.resource = resource;
            this.typeId = typeId;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this.capabilities = 0 /* WorkingCopyCapabilities.None */;
            this.name = (0, resources_1.basename)(this.resource);
            this.dirty = false;
            this.dirty = isDirty;
        }
        setDirty(dirty) {
            if (this.dirty !== dirty) {
                this.dirty = dirty;
                this._onDidChangeDirty.fire();
            }
        }
        setContent(content) {
            this._onDidChangeContent.fire();
        }
        isDirty() {
            return this.dirty;
        }
        isModified() {
            return this.isDirty();
        }
        async save(options, stat) {
            this._onDidSave.fire({ reason: options?.reason ?? 1 /* SaveReason.EXPLICIT */, stat: stat ?? createFileStat(this.resource), source: options?.source });
            return true;
        }
        async revert(options) {
            this.setDirty(false);
        }
        async backup(token) {
            return {};
        }
    }
    exports.TestWorkingCopy = TestWorkingCopy;
    function createFileStat(resource, readonly = false) {
        return {
            resource,
            etag: Date.now().toString(),
            mtime: Date.now(),
            ctime: Date.now(),
            size: 42,
            isFile: true,
            isDirectory: false,
            isSymbolicLink: false,
            readonly,
            locked: false,
            name: (0, resources_1.basename)(resource),
            children: undefined
        };
    }
    class TestWorkingCopyFileService {
        constructor() {
            this.onWillRunWorkingCopyFileOperation = event_1.Event.None;
            this.onDidFailWorkingCopyFileOperation = event_1.Event.None;
            this.onDidRunWorkingCopyFileOperation = event_1.Event.None;
            this.hasSaveParticipants = false;
        }
        addFileOperationParticipant(participant) { return lifecycle_1.Disposable.None; }
        addSaveParticipant(participant) { return lifecycle_1.Disposable.None; }
        async runSaveParticipants(workingCopy, context, token) { }
        async delete(operations, token, undoInfo) { }
        registerWorkingCopyProvider(provider) { return lifecycle_1.Disposable.None; }
        getDirty(resource) { return []; }
        create(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
        createFolder(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
        move(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
        copy(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
    }
    exports.TestWorkingCopyFileService = TestWorkingCopyFileService;
    function mock() {
        return function () { };
    }
    class TestExtensionService extends extensions_1.NullExtensionService {
    }
    exports.TestExtensionService = TestExtensionService;
    exports.TestProductService = { _serviceBrand: undefined, ...product_1.default };
    class TestActivityService {
        constructor() {
            this.onDidChangeActivity = event_1.Event.None;
        }
        getViewContainerActivities(viewContainerId) {
            return [];
        }
        getActivity(id) {
            return [];
        }
        showViewContainerActivity(viewContainerId, badge) {
            return this;
        }
        showViewActivity(viewId, badge) {
            return this;
        }
        showAccountsActivity(activity) {
            return this;
        }
        showGlobalActivity(activity) {
            return this;
        }
        dispose() { }
    }
    exports.TestActivityService = TestActivityService;
    exports.NullFilesConfigurationService = new class {
        constructor() {
            this.onDidChangeAutoSaveConfiguration = event_1.Event.None;
            this.onDidChangeAutoSaveDisabled = event_1.Event.None;
            this.onDidChangeReadonly = event_1.Event.None;
            this.onDidChangeFilesAssociation = event_1.Event.None;
            this.isHotExitEnabled = false;
            this.hotExitConfiguration = undefined;
        }
        getAutoSaveConfiguration() { throw new Error('Method not implemented.'); }
        getAutoSaveMode() { throw new Error('Method not implemented.'); }
        hasShortAutoSaveDelay() { throw new Error('Method not implemented.'); }
        toggleAutoSave() { throw new Error('Method not implemented.'); }
        disableAutoSave(resourceOrEditor) { throw new Error('Method not implemented.'); }
        isReadonly(resource, stat) { return false; }
        async updateReadonly(resource, readonly) { }
        preventSaveConflicts(resource, language) { throw new Error('Method not implemented.'); }
    };
    class TestWorkspaceTrustEnablementService {
        constructor(isEnabled = true) {
            this.isEnabled = isEnabled;
        }
        isWorkspaceTrustEnabled() {
            return this.isEnabled;
        }
    }
    exports.TestWorkspaceTrustEnablementService = TestWorkspaceTrustEnablementService;
    class TestWorkspaceTrustManagementService extends lifecycle_1.Disposable {
        constructor(trusted = true) {
            super();
            this.trusted = trusted;
            this._onDidChangeTrust = this._register(new event_1.Emitter());
            this.onDidChangeTrust = this._onDidChangeTrust.event;
            this._onDidChangeTrustedFolders = this._register(new event_1.Emitter());
            this.onDidChangeTrustedFolders = this._onDidChangeTrustedFolders.event;
            this._onDidInitiateWorkspaceTrustRequestOnStartup = this._register(new event_1.Emitter());
            this.onDidInitiateWorkspaceTrustRequestOnStartup = this._onDidInitiateWorkspaceTrustRequestOnStartup.event;
        }
        get acceptsOutOfWorkspaceFiles() {
            throw new Error('Method not implemented.');
        }
        set acceptsOutOfWorkspaceFiles(value) {
            throw new Error('Method not implemented.');
        }
        addWorkspaceTrustTransitionParticipant(participant) {
            throw new Error('Method not implemented.');
        }
        getTrustedUris() {
            throw new Error('Method not implemented.');
        }
        setParentFolderTrust(trusted) {
            throw new Error('Method not implemented.');
        }
        getUriTrustInfo(uri) {
            throw new Error('Method not implemented.');
        }
        async setTrustedUris(folders) {
            throw new Error('Method not implemented.');
        }
        async setUrisTrust(uris, trusted) {
            throw new Error('Method not implemented.');
        }
        canSetParentFolderTrust() {
            throw new Error('Method not implemented.');
        }
        canSetWorkspaceTrust() {
            throw new Error('Method not implemented.');
        }
        isWorkspaceTrusted() {
            return this.trusted;
        }
        isWorkspaceTrustForced() {
            return false;
        }
        get workspaceTrustInitialized() {
            return Promise.resolve();
        }
        get workspaceResolved() {
            return Promise.resolve();
        }
        async setWorkspaceTrust(trusted) {
            if (this.trusted !== trusted) {
                this.trusted = trusted;
                this._onDidChangeTrust.fire(this.trusted);
            }
        }
    }
    exports.TestWorkspaceTrustManagementService = TestWorkspaceTrustManagementService;
    class TestWorkspaceTrustRequestService extends lifecycle_1.Disposable {
        constructor(_trusted) {
            super();
            this._trusted = _trusted;
            this._onDidInitiateOpenFilesTrustRequest = this._register(new event_1.Emitter());
            this.onDidInitiateOpenFilesTrustRequest = this._onDidInitiateOpenFilesTrustRequest.event;
            this._onDidInitiateWorkspaceTrustRequest = this._register(new event_1.Emitter());
            this.onDidInitiateWorkspaceTrustRequest = this._onDidInitiateWorkspaceTrustRequest.event;
            this._onDidInitiateWorkspaceTrustRequestOnStartup = this._register(new event_1.Emitter());
            this.onDidInitiateWorkspaceTrustRequestOnStartup = this._onDidInitiateWorkspaceTrustRequestOnStartup.event;
            this.requestOpenUrisHandler = async (uris) => {
                return 1 /* WorkspaceTrustUriResponse.Open */;
            };
        }
        requestOpenFilesTrust(uris) {
            return this.requestOpenUrisHandler(uris);
        }
        async completeOpenFilesTrustRequest(result, saveResponse) {
            throw new Error('Method not implemented.');
        }
        cancelWorkspaceTrustRequest() {
            throw new Error('Method not implemented.');
        }
        async completeWorkspaceTrustRequest(trusted) {
            throw new Error('Method not implemented.');
        }
        async requestWorkspaceTrust(options) {
            return this._trusted;
        }
        requestWorkspaceTrustOnStartup() {
            throw new Error('Method not implemented.');
        }
    }
    exports.TestWorkspaceTrustRequestService = TestWorkspaceTrustRequestService;
    class TestMarkerService {
        constructor() {
            this.onMarkerChanged = event_1.Event.None;
        }
        getStatistics() { throw new Error('Method not implemented.'); }
        changeOne(owner, resource, markers) { }
        changeAll(owner, data) { }
        remove(owner, resources) { }
        read(filter) { return []; }
    }
    exports.TestMarkerService = TestMarkerService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoVGVzdFNlcnZpY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvY29tbW9uL3dvcmtiZW5jaFRlc3RTZXJ2aWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUErTmhHLHdDQWVDO0lBOEJELG9CQUVDO0lBaFBELE1BQWEsaUJBQWtCLFNBQVEsMkJBQXFCO1FBQzNELFlBQVksUUFBYztZQUN6QixLQUFLLENBQUMsY0FBUSxDQUFDLElBQUksRUFBRSxRQUFRLElBQUksU0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFDUyxjQUFjLEtBQWMsT0FBTyxJQUFJLGdCQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDaEU7SUFMRCw4Q0FLQztJQUVNLElBQU0saUNBQWlDLEdBQXZDLE1BQU0saUNBQWlDO1FBSTdDLFlBQ3lDLG9CQUEyQztZQUEzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1FBRXBGLENBQUM7UUFFRCxNQUFNLENBQUMsUUFBYSxFQUFFLFFBQWlCO1lBQ3RDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDeEcsSUFBSSxHQUFHLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDdEQsT0FBTyxHQUFHLENBQUM7WUFDWixDQUFDO1lBQ0QsT0FBTyxDQUFDLGtCQUFPLElBQUksc0JBQVcsQ0FBQyxDQUFD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