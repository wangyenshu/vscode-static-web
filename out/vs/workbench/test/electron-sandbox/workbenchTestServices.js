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
define(["require", "exports", "vs/base/common/event", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/native/common/native", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/extensionManagement/common/extensionTipsService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/editor/common/services/model", "vs/platform/workspace/common/workspace", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/textfile/electron-sandbox/nativeTextFileService", "vs/base/common/arrays", "vs/base/common/network", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/log/common/log", "vs/platform/userData/common/fileUserDataProvider", "vs/workbench/services/workingCopy/electron-sandbox/workingCopyBackupService", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, event_1, workbenchTestServices_1, native_1, buffer_1, lifecycle_1, dialogs_1, environment_1, files_1, editorService_1, textfiles_1, extensionTipsService_1, extensionManagement_1, extensionRecommendations_1, productService_1, storage_1, telemetry_1, model_1, workspace_1, filesConfigurationService_1, lifecycle_2, workingCopyBackup_1, workingCopyService_1, nativeTextFileService_1, arrays_1, network_1, fileService_1, inMemoryFilesystemProvider_1, log_1, fileUserDataProvider_1, workingCopyBackupService_1, uriIdentityService_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestNativeWorkingCopyBackupService = exports.TestNativeTextFileServiceWithEncodingOverrides = exports.TestServiceAccessor = exports.TestExtensionTipsService = exports.TestNativeHostService = exports.TestSharedProcessService = void 0;
    exports.workbenchInstantiationService = workbenchInstantiationService;
    class TestSharedProcessService {
        createRawConnection() { throw new Error('Not Implemented'); }
        getChannel(channelName) { return undefined; }
        registerChannel(channelName, channel) { }
        notifyRestored() { }
    }
    exports.TestSharedProcessService = TestSharedProcessService;
    class TestNativeHostService {
        constructor() {
            this.windowId = -1;
            this.onDidOpenMainWindow = event_1.Event.None;
            this.onDidMaximizeWindow = event_1.Event.None;
            this.onDidUnmaximizeWindow = event_1.Event.None;
            this.onDidFocusMainWindow = event_1.Event.None;
            this.onDidBlurMainWindow = event_1.Event.None;
            this.onDidFocusMainOrAuxiliaryWindow = event_1.Event.None;
            this.onDidBlurMainOrAuxiliaryWindow = event_1.Event.None;
            this.onDidResumeOS = event_1.Event.None;
            this.onDidChangeColorScheme = event_1.Event.None;
            this.onDidChangePassword = event_1.Event.None;
            this.onDidTriggerWindowSystemContextMenu = event_1.Event.None;
            this.onDidChangeWindowFullScreen = event_1.Event.None;
            this.onDidChangeDisplay = event_1.Event.None;
            this.windowCount = Promise.resolve(1);
        }
        getWindowCount() { return this.windowCount; }
        async getWindows() { return []; }
        async getActiveWindowId() { return undefined; }
        openWindow(arg1, arg2) {
            throw new Error('Method not implemented.');
        }
        async toggleFullScreen() { }
        async handleTitleDoubleClick() { }
        async isMaximized() { return true; }
        async maximizeWindow() { }
        async unmaximizeWindow() { }
        async minimizeWindow() { }
        async moveWindowTop(options) { }
        getCursorScreenPoint() { throw new Error('Method not implemented.'); }
        async positionWindow(position, options) { }
        async updateWindowControls(options) { }
        async setMinimumSize(width, height) { }
        async saveWindowSplash(value) { }
        async focusWindow(options) { }
        async showMessageBox(options) { throw new Error('Method not implemented.'); }
        async showSaveDialog(options) { throw new Error('Method not implemented.'); }
        async showOpenDialog(options) { throw new Error('Method not implemented.'); }
        async pickFileFolderAndOpen(options) { }
        async pickFileAndOpen(options) { }
        async pickFolderAndOpen(options) { }
        async pickWorkspaceAndOpen(options) { }
        async showItemInFolder(path) { }
        async setRepresentedFilename(path) { }
        async isAdmin() { return false; }
        async writeElevated(source, target) { }
        async isRunningUnderARM64Translation() { return false; }
        async getOSProperties() { return Object.create(null); }
        async getOSStatistics() { return Object.create(null); }
        async getOSVirtualMachineHint() { return 0; }
        async getOSColorScheme() { return { dark: true, highContrast: false }; }
        async hasWSLFeatureInstalled() { return false; }
        async killProcess() { }
        async setDocumentEdited(edited) { }
        async openExternal(url) { return false; }
        async updateTouchBar() { }
        async moveItemToTrash() { }
        async newWindowTab() { }
        async showPreviousWindowTab() { }
        async showNextWindowTab() { }
        async moveWindowTabToNewWindow() { }
        async mergeAllWindowTabs() { }
        async toggleWindowTabsBar() { }
        async installShellCommand() { }
        async uninstallShellCommand() { }
        async notifyReady() { }
        async relaunch(options) { }
        async reload() { }
        async closeWindow() { }
        async quit() { }
        async exit(code) { }
        async openDevTools(options) { }
        async toggleDevTools() { }
        async resolveProxy(url) { return undefined; }
        async loadCertificates() { return []; }
        async findFreePort(startPort, giveUpAfter, timeout, stride) { return -1; }
        async readClipboardText(type) { return ''; }
        async writeClipboardText(text, type) { }
        async readClipboardFindText() { return ''; }
        async writeClipboardFindText(text) { }
        async writeClipboardBuffer(format, buffer, type) { }
        async readClipboardBuffer(format) { return buffer_1.VSBuffer.wrap(Uint8Array.from([])); }
        async hasClipboard(format, type) { return false; }
        async windowsGetStringRegKey(hive, path, name) { return undefined; }
        async profileRenderer() { throw new Error(); }
    }
    exports.TestNativeHostService = TestNativeHostService;
    let TestExtensionTipsService = class TestExtensionTipsService extends extensionTipsService_1.AbstractNativeExtensionTipsService {
        constructor(environmentService, telemetryService, extensionManagementService, storageService, nativeHostService, extensionRecommendationNotificationService, fileService, productService) {
            super(environmentService.userHome, nativeHostService, telemetryService, extensionManagementService, storageService, extensionRecommendationNotificationService, fileService, productService);
        }
    };
    exports.TestExtensionTipsService = TestExtensionTipsService;
    exports.TestExtensionTipsService = TestExtensionTipsService = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, storage_1.IStorageService),
        __param(4, native_1.INativeHostService),
        __param(5, extensionRecommendations_1.IExtensionRecommendationNotificationService),
        __param(6, files_1.IFileService),
        __param(7, productService_1.IProductService)
    ], TestExtensionTipsService);
    function workbenchInstantiationService(overrides, disposables = new lifecycle_1.DisposableStore()) {
        const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({
            workingCopyBackupService: () => disposables.add(new TestNativeWorkingCopyBackupService()),
            ...overrides
        }, disposables);
        instantiationService.stub(native_1.INativeHostService, new TestNativeHostService());
        return instantiationService;
    }
    let TestServiceAccessor = class TestServiceAccessor {
        constructor(lifecycleService, textFileService, filesConfigurationService, contextService, modelService, fileService, nativeHostService, fileDialogService, workingCopyBackupService, workingCopyService, editorService) {
            this.lifecycleService = lifecycleService;
            this.textFileService = textFileService;
            this.filesConfigurationService = filesConfigurationService;
            this.contextService = contextService;
            this.modelService = modelService;
            this.fileService = fileService;
            this.nativeHostService = nativeHostService;
            this.fileDialogService = fileDialogService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.workingCopyService = workingCopyService;
            this.editorService = editorService;
        }
    };
    exports.TestServiceAccessor = TestServiceAccessor;
    exports.TestServiceAccessor = TestServiceAccessor = __decorate([
        __param(0, lifecycle_2.ILifecycleService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, filesConfigurationService_1.IFilesConfigurationService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, model_1.IModelService),
        __param(5, files_1.IFileService),
        __param(6, native_1.INativeHostService),
        __param(7, dialogs_1.IFileDialogService),
        __param(8, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(9, workingCopyService_1.IWorkingCopyService),
        __param(10, editorService_1.IEditorService)
    ], TestServiceAccessor);
    class TestNativeTextFileServiceWithEncodingOverrides extends nativeTextFileService_1.NativeTextFileService {
        get encoding() {
            if (!this._testEncoding) {
                this._testEncoding = this._register(this.instantiationService.createInstance(workbenchTestServices_1.TestEncodingOracle));
            }
            return this._testEncoding;
        }
    }
    exports.TestNativeTextFileServiceWithEncodingOverrides = TestNativeTextFileServiceWithEncodingOverrides;
    class TestNativeWorkingCopyBackupService extends workingCopyBackupService_1.NativeWorkingCopyBackupService {
        constructor() {
            const environmentService = workbenchTestServices_1.TestEnvironmentService;
            const logService = new log_1.NullLogService();
            const fileService = new fileService_1.FileService(logService);
            const lifecycleService = new workbenchTestServices_1.TestLifecycleService();
            super(environmentService, fileService, logService, lifecycleService);
            const inMemoryFileSystemProvider = this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            this._register(fileService.registerProvider(network_1.Schemas.inMemory, inMemoryFileSystemProvider));
            const uriIdentityService = this._register(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = this._register(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService));
            this._register(fileService.registerProvider(network_1.Schemas.vscodeUserData, this._register(new fileUserDataProvider_1.FileUserDataProvider(network_1.Schemas.file, inMemoryFileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, logService))));
            this.backupResourceJoiners = [];
            this.discardBackupJoiners = [];
            this.discardedBackups = [];
            this.pendingBackupsArr = [];
            this.discardedAllBackups = false;
            this._register(fileService);
            this._register(lifecycleService);
        }
        testGetFileService() {
            return this.fileService;
        }
        async waitForAllBackups() {
            await Promise.all(this.pendingBackupsArr);
        }
        joinBackupResource() {
            return new Promise(resolve => this.backupResourceJoiners.push(resolve));
        }
        async backup(identifier, content, versionId, meta, token) {
            const p = super.backup(identifier, content, versionId, meta, token);
            const removeFromPendingBackups = (0, arrays_1.insert)(this.pendingBackupsArr, p.then(undefined, undefined));
            try {
                await p;
            }
            finally {
                removeFromPendingBackups();
            }
            while (this.backupResourceJoiners.length) {
                this.backupResourceJoiners.pop()();
            }
        }
        joinDiscardBackup() {
            return new Promise(resolve => this.discardBackupJoiners.push(resolve));
        }
        async discardBackup(identifier) {
            await super.discardBackup(identifier);
            this.discardedBackups.push(identifier);
            while (this.discardBackupJoiners.length) {
                this.discardBackupJoiners.pop()();
            }
        }
        async discardBackups(filter) {
            this.discardedAllBackups = true;
            return super.discardBackups(filter);
        }
        async getBackupContents(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const fileContents = await this.fileService.readFile(backupResource);
            return fileContents.value.toString();
        }
    }
    exports.TestNativeWorkingCopyBackupService = TestNativeWorkingCopyBackupService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoVGVzdFNlcnZpY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvZWxlY3Ryb24tc2FuZGJveC93b3JrYmVuY2hUZXN0U2VydmljZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMEtoRyxzRUFrQkM7SUE1SUQsTUFBYSx3QkFBd0I7UUFJcEMsbUJBQW1CLEtBQVksTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRSxVQUFVLENBQUMsV0FBbUIsSUFBUyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsZUFBZSxDQUFDLFdBQW1CLEVBQUUsT0FBWSxJQUFVLENBQUM7UUFDNUQsY0FBYyxLQUFXLENBQUM7S0FDMUI7SUFSRCw0REFRQztJQUVELE1BQWEscUJBQXFCO1FBQWxDO1lBR1UsYUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRXZCLHdCQUFtQixHQUFrQixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2hELHdCQUFtQixHQUFrQixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2hELDBCQUFxQixHQUFrQixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2xELHlCQUFvQixHQUFrQixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2pELHdCQUFtQixHQUFrQixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2hELG9DQUErQixHQUFrQixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzVELG1DQUE4QixHQUFrQixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzNELGtCQUFhLEdBQW1CLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDM0MsMkJBQXNCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNwQyx3QkFBbUIsR0FBRyxhQUFL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