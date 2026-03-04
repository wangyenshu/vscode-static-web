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
define(["require", "exports", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/userDataSync/common/globalStateSync", "vs/platform/userDataSync/common/keybindingsSync", "vs/platform/userDataSync/common/settingsSync", "vs/platform/userDataSync/common/snippetsSync", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/platform", "vs/base/common/async", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/environment/common/environment", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/userDataSync/common/ignoredExtensions", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/cancellation", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/userDataSync/common/tasksSync", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/environment/browser/environmentService", "vs/platform/secrets/common/secrets"], function (require, exports, storage_1, extensionsSync_1, globalStateSync_1, keybindingsSync_1, settingsSync_1, snippetsSync_1, files_1, log_1, userDataSyncStoreService_1, productService_1, request_1, userDataSync_1, authenticationService_1, userDataSync_2, platform_1, async_1, extensionManagement_1, environment_1, extensions_1, extensionManagementUtil_1, ignoredExtensions_1, lifecycle_1, resources_1, cancellation_1, uriIdentity_1, extensionStorage_1, tasksSync_1, userDataProfile_1, environmentService_1, secrets_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncInitializer = void 0;
    let UserDataSyncInitializer = class UserDataSyncInitializer {
        constructor(environmentService, secretStorageService, userDataSyncStoreManagementService, fileService, userDataProfilesService, storageService, productService, requestService, logService, uriIdentityService) {
            this.environmentService = environmentService;
            this.secretStorageService = secretStorageService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.fileService = fileService;
            this.userDataProfilesService = userDataProfilesService;
            this.storageService = storageService;
            this.productService = productService;
            this.requestService = requestService;
            this.logService = logService;
            this.uriIdentityService = uriIdentityService;
            this.initialized = [];
            this.initializationFinished = new async_1.Barrier();
            this.globalStateUserData = null;
            this.createUserDataSyncStoreClient().then(userDataSyncStoreClient => {
                if (!userDataSyncStoreClient) {
                    this.initializationFinished.open();
                }
            });
        }
        createUserDataSyncStoreClient() {
            if (!this._userDataSyncStoreClientPromise) {
                this._userDataSyncStoreClientPromise = (async () => {
                    try {
                        if (!platform_1.isWeb) {
                            this.logService.trace(`Skipping initializing user data in desktop`);
                            return;
                        }
                        if (!this.storageService.isNew(-1 /* StorageScope.APPLICATION */)) {
                            this.logService.trace(`Skipping initializing user data as application was opened before`);
                            return;
                        }
                        if (!this.storageService.isNew(1 /* StorageScope.WORKSPACE */)) {
                            this.logService.trace(`Skipping initializing user data as workspace was opened before`);
                            return;
                        }
                        if (this.environmentService.options?.settingsSyncOptions?.authenticationProvider && !this.environmentService.options.settingsSyncOptions.enabled) {
                            this.logService.trace(`Skipping initializing user data as settings sync is disabled`);
                            return;
                        }
                        let authenticationSession;
                        try {
                            authenticationSession = await (0, authenticationService_1.getCurrentAuthenticationSessionInfo)(this.secretStorageService, this.productService);
                        }
                        catch (error) {
                            this.logService.error(error);
                        }
                        if (!authenticationSession) {
                            this.logService.trace(`Skipping initializing user data as authentication session is not set`);
                            return;
                        }
                        await this.initializeUserDataSyncStore(authenticationSession);
                        const userDataSyncStore = this.userDataSyncStoreManagementService.userDataSyncStore;
                        if (!userDataSyncStore) {
                            this.logService.trace(`Skipping initializing user data as sync service is not provided`);
                            return;
                        }
                        const userDataSyncStoreClient = new userDataSyncStoreService_1.UserDataSyncStoreClient(userDataSyncStore.url, this.productService, this.requestService, this.logService, this.environmentService, this.fileService, this.storageService);
                        userDataSyncStoreClient.setAuthToken(authenticationSession.accessToken, authenticationSession.providerId);
                        const manifest = await userDataSyncStoreClient.manifest(null);
                        if (manifest === null) {
                            userDataSyncStoreClient.dispose();
                            this.logService.trace(`Skipping initializing user data as there is no data`);
                            return;
                        }
                        this.logService.info(`Using settings sync service ${userDataSyncStore.url.toString()} for initialization`);
                        return userDataSyncStoreClient;
                    }
                    catch (error) {
                        this.logService.error(error);
                        return;
                    }
                })();
            }
            return this._userDataSyncStoreClientPromise;
        }
        async initializeUserDataSyncStore(authenticationSession) {
            const userDataSyncStore = this.userDataSyncStoreManagementService.userDataSyncStore;
            if (!userDataSyncStore?.canSwitch) {
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const userDataSyncStoreClient = disposables.add(new userDataSyncStoreService_1.UserDataSyncStoreClient(userDataSyncStore.url, this.productService, this.requestService, this.logService, this.environmentService, this.fileService, this.storageService));
                userDataSyncStoreClient.setAuthToken(authenticationSession.accessToken, authenticationSession.providerId);
                // Cache global state data for global state initialization
                this.globalStateUserData = await userDataSyncStoreClient.readResource("globalState" /* SyncResource.GlobalState */, null);
                if (this.globalStateUserData) {
                    const userDataSyncStoreType = new globalStateSync_1.UserDataSyncStoreTypeSynchronizer(userDataSyncStoreClient, this.storageService, this.environmentService, this.fileService, this.logService).getSyncStoreType(this.globalStateUserData);
                    if (userDataSyncStoreType) {
                        await this.userDataSyncStoreManagementService.switch(userDataSyncStoreType);
                        // Unset cached global state data if urls are changed
                        if (!(0, resources_1.isEqual)(userDataSyncStore.url, this.userDataSyncStoreManagementService.userDataSyncStore?.url)) {
                            this.logService.info('Switched settings sync store');
                            this.globalStateUserData = null;
                        }
                    }
                }
            }
            finally {
                disposables.dispose();
            }
        }
        async whenInitializationFinished() {
            await this.initializationFinished.wait();
        }
        async requiresInitialization() {
            this.logService.trace(`UserDataInitializationService#requiresInitialization`);
            const userDataSyncStoreClient = await this.createUserDataSyncStoreClient();
            return !!userDataSyncStoreClient;
        }
        async initializeRequiredResources() {
            this.logService.trace(`UserDataInitializationService#initializeRequiredResources`);
            return this.initialize(["settings" /* SyncResource.Settings */, "globalState" /* SyncResource.GlobalState */]);
        }
        async initializeOtherResources(instantiationService) {
            try {
                this.logService.trace(`UserDataInitializationService#initializeOtherResources`);
                await Promise.allSettled([this.initialize(["keybindings" /* SyncResource.Keybindings */, "snippets" /* SyncResource.Snippets */, "tasks" /* SyncResource.Tasks */]), this.initializeExtensions(instantiationService)]);
            }
            finally {
                this.initializationFinished.open();
            }
        }
        async initializeExtensions(instantiationService) {
            try {
                await Promise.all([this.initializeInstalledExtensions(instantiationService), this.initializeNewExtensions(instantiationService)]);
            }
            finally {
                this.initialized.push("extensions" /* SyncResource.Extensions */);
            }
        }
        async initializeInstalledExtensions(instantiationService) {
            if (!this.initializeInstalledExtensionsPromise) {
                this.initializeInstalledExtensionsPromise = (async () => {
                    this.logService.trace(`UserDataInitializationService#initializeInstalledExtensions`);
                    const extensionsPreviewInitializer = await this.getExtensionsPreviewInitializer(instantiationService);
                    if (extensionsPreviewInitializer) {
                        await instantiationService.createInstance(InstalledExtensionsInitializer, extensionsPreviewInitializer).initialize();
                    }
                })();
            }
            return this.initializeInstalledExtensionsPromise;
        }
        async initializeNewExtensions(instantiationService) {
            if (!this.initializeNewExtensionsPromise) {
                this.initializeNewExtensionsPromise = (async () => {
                    this.logService.trace(`UserDataInitializationService#initializeNewExtensions`);
                    const extensionsPreviewInitializer = await this.getExtensionsPreviewInitializer(instantiationService);
                    if (extensionsPreviewInitializer) {
                        await instantiationService.createInstance(NewExtensionsInitializer, extensionsPreviewInitializer).initialize();
                    }
                })();
            }
            return this.initializeNewExtensionsPromise;
        }
        getExtensionsPreviewInitializer(instantiationService) {
            if (!this.extensionsPreviewInitializerPromise) {
                this.extensionsPreviewInitializerPromise = (async () => {
                    const userDataSyncStoreClient = await this.createUserDataSyncStoreClient();
                    if (!userDataSyncStoreClient) {
                        return null;
                    }
                    const userData = await userDataSyncStoreClient.readResource("extensions" /* SyncResource.Extensions */, null);
                    return instantiationService.createInstance(ExtensionsPreviewInitializer, userData);
                })();
            }
            return this.extensionsPreviewInitializerPromise;
        }
        async initialize(syncResources) {
            const userDataSyncStoreClient = await this.createUserDataSyncStoreClient();
            if (!userDataSyncStoreClient) {
                return;
            }
            await async_1.Promises.settled(syncResources.map(async (syncResource) => {
                try {
                    if (this.initialized.includes(syncResource)) {
                        this.logService.info(`${(0, userDataSync_2.getSyncAreaLabel)(syncResource)} initialized already.`);
                        return;
                    }
                    this.initialized.push(syncResource);
                    this.logService.trace(`Initializing ${(0, userDataSync_2.getSyncAreaLabel)(syncResource)}`);
                    const initializer = this.createSyncResourceInitializer(syncResource);
                    const userData = await userDataSyncStoreClient.readResource(syncResource, syncResource === "globalState" /* SyncResource.GlobalState */ ? this.globalStateUserData : null);
                    await initializer.initialize(userData);
                    this.logService.info(`Initialized ${(0, userDataSync_2.getSyncAreaLabel)(syncResource)}`);
                }
                catch (error) {
                    this.logService.info(`Error while initializing ${(0, userDataSync_2.getSyncAreaLabel)(syncResource)}`);
                    this.logService.error(error);
                }
            }));
        }
        createSyncResourceInitializer(syncResource) {
            switch (syncResource) {
                case "settings" /* SyncResource.Settings */: return new settingsSync_1.SettingsInitializer(this.fileService, this.userDataProfilesService, this.environmentService, this.logService, this.storageService, this.uriIdentityService);
                case "keybindings" /* SyncResource.Keybindings */: return new keybindingsSync_1.KeybindingsInitializer(this.fileService, this.userDataProfilesService, this.environmentService, this.logService, this.storageService, this.uriIdentityService);
                case "tasks" /* SyncResource.Tasks */: return new tasksSync_1.TasksInitializer(this.fileService, this.userDataProfilesService, this.environmentService, this.logService, this.storageService, this.uriIdentityService);
                case "snippets" /* SyncResource.Snippets */: return new snippetsSync_1.SnippetsInitializer(this.fileService, this.userDataProfilesService, this.environmentService, this.logService, this.storageService, this.uriIdentityService);
                case "globalState" /* SyncResource.GlobalState */: return new globalStateSync_1.GlobalStateInitializer(this.storageService, this.fileService, this.userDataProfilesService, this.environmentService, this.logService, this.uriIdentityService);
            }
            throw new Error(`Cannot create initializer for ${syncResource}`);
        }
    };
    exports.UserDataSyncInitializer = UserDataSyncInitializer;
    exports.UserDataSyncInitializer = UserDataSyncInitializer = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, secrets_1.ISecretStorageService),
        __param(2, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(3, files_1.IFileService),
        __param(4, userDataProfile_1.IUserDataProfilesService),
        __param(5, storage_1.IStorageService),
        __param(6, productService_1.IProductService),
        __param(7, request_1.IRequestService),
        __param(8, log_1.ILogService),
        __param(9, uriIdentity_1.IUriIdentityService)
    ], UserDataSyncInitializer);
    let ExtensionsPreviewInitializer = class ExtensionsPreviewInitializer extends extensionsSync_1.AbstractExtensionsInitializer {
        constructor(extensionsData, extensionManagementService, ignoredExtensionsManagementService, fileService, userDataProfilesService, environmentService, logService, storageService, uriIdentityService) {
            super(extensionManagementService, ignoredExtensionsManagementService, fileService, userDataProfilesService, environmentService, logService, storageService, uriIdentityService);
            this.extensionsData = extensionsData;
            this.preview = null;
        }
        getPreview() {
            if (!this.previewPromise) {
                this.previewPromise = super.initialize(this.extensionsData).then(() => this.preview);
            }
            return this.previewPromise;
        }
        initialize() {
            throw new Error('should not be called directly');
        }
        async doInitialize(remoteUserData) {
            const remoteExtensions = await this.parseExtensions(remoteUserData);
            if (!remoteExtensions) {
                this.logService.info('Skipping initializing extensions because remote extensions does not exist.');
                return;
            }
            const installedExtensions = await this.extensionManagementService.getInstalled();
            this.preview = this.generatePreview(remoteExtensions, installedExtensions);
        }
    };
    ExtensionsPreviewInitializer = __decorate([
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(3, files_1.IFileService),
        __param(4, userDataProfile_1.IUserDataProfilesService),
        __param(5, environment_1.IEnvironmentService),
        __param(6, userDataSync_1.IUserDataSyncLogService),
        __param(7, storage_1.IStorageService),
        __param(8, uriIdentity_1.IUriIdentityService)
    ], ExtensionsPreviewInitializer);
    let InstalledExtensionsInitializer = class InstalledExtensionsInitializer {
        constructor(extensionsPreviewInitializer, extensionEnablementService, extensionStorageService, logService) {
            this.extensionsPreviewInitializer = extensionsPreviewInitializer;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionStorageService = extensionStorageService;
            this.logService = logService;
        }
        async initialize() {
            const preview = await this.extensionsPreviewInitializer.getPreview();
            if (!preview) {
                return;
            }
            // 1. Initialise already installed extensions state
            for (const installedExtension of preview.installedExtensions) {
                const syncExtension = preview.remoteExtensions.find(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, installedExtension.identifier));
                if (syncExtension?.state) {
                    const extensionState = this.extensionStorageService.getExtensionState(installedExtension, true) || {};
                    Object.keys(syncExtension.state).forEach(key => extensionState[key] = syncExtension.state[key]);
                    this.extensionStorageService.setExtensionState(installedExtension, extensionState, true);
                }
            }
            // 2. Initialise extensions enablement
            if (preview.disabledExtensions.length) {
                for (const identifier of preview.disabledExtensions) {
                    this.logService.trace(`Disabling extension...`, identifier.id);
                    await this.extensionEnablementService.disableExtension(identifier);
                    this.logService.info(`Disabling extension`, identifier.id);
                }
            }
        }
    };
    InstalledExtensionsInitializer = __decorate([
        __param(1, extensionManagement_1.IGlobalExtensionEnablementService),
        __param(2, extensionStorage_1.IExtensionStorageService),
        __param(3, userDataSync_1.IUserDataSyncLogService)
    ], InstalledExtensionsInitializer);
    let NewExtensionsInitializer = class NewExtensionsInitializer {
        constructor(extensionsPreviewInitializer, extensionService, extensionStorageService, galleryService, extensionManagementService, logService) {
            this.extensionsPreviewInitializer = extensionsPreviewInitializer;
            this.extensionService = extensionService;
            this.extensionStorageService = extensionStorageService;
            this.galleryService = galleryService;
            this.extensionManagementService = extensionManagementService;
            this.logService = logService;
        }
        async initialize() {
            const preview = await this.extensionsPreviewInitializer.getPreview();
            if (!preview) {
                return;
            }
            const newlyEnabledExtensions = [];
            const targetPlatform = await this.extensionManagementService.getTargetPlatform();
            const galleryExtensions = await this.galleryService.getExtensions(preview.newExtensions, { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None);
            for (const galleryExtension of galleryExtensions) {
                try {
                    const extensionToSync = preview.remoteExtensions.find(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, galleryExtension.identifier));
                    if (!extensionToSync) {
                        continue;
                    }
                    if (extensionToSync.state) {
                        this.extensionStorageService.setExtensionState(galleryExtension, extensionToSync.state, true);
                    }
                    this.logService.trace(`Installing extension...`, galleryExtension.identifier.id);
                    const local = await this.extensionManagementService.installFromGallery(galleryExtension, {
                        isMachineScoped: false, /* set isMachineScoped to prevent install and sync dialog in web */
                        donotIncludePackAndDependencies: true,
                        installGivenVersion: !!extensionToSync.version,
                        installPreReleaseVersion: extensionToSync.preRelease
                    });
                    if (!preview.disabledExtensions.some(identifier => (0, extensionManagementUtil_1.areSameExtensions)(identifier, galleryExtension.identifier))) {
                        newlyEnabledExtensions.push(local);
                    }
                    this.logService.info(`Installed extension.`, galleryExtension.identifier.id);
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            const canEnabledExtensions = newlyEnabledExtensions.filter(e => this.extensionService.canAddExtension((0, extensions_1.toExtensionDescription)(e)));
            if (!(await this.areExtensionsRunning(canEnabledExtensions))) {
                await new Promise((c, e) => {
                    const disposable = this.extensionService.onDidChangeExtensions(async () => {
                        try {
                            if (await this.areExtensionsRunning(canEnabledExtensions)) {
                                disposable.dispose();
                                c();
                            }
                        }
                        catch (error) {
                            e(error);
                        }
                    });
                });
            }
        }
        async areExtensionsRunning(extensions) {
            await this.extensionService.whenInstalledExtensionsRegistered();
            const runningExtensions = this.extensionService.extensions;
            return extensions.every(e => runningExtensions.some(r => (0, extensionManagementUtil_1.areSameExtensions)({ id: r.identifier.value }, e.identifier)));
        }
    };
    NewExtensionsInitializer = __decorate([
        __param(1, extensions_1.IExtensionService),
        __param(2, extensionStorage_1.IExtensionStorageService),
        __param(3, extensionManagement_1.IExtensionGalleryService),
        __param(4, extensionManagement_1.IExtensionManagementService),
        __param(5, userDataSync_1.IUserDataSyncLogService)
    ], NewExtensionsInitializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jSW5pdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVN5bmMvYnJvd3Nlci91c2VyRGF0YVN5bmNJbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1DekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7UUFRbkMsWUFDc0Msa0JBQXdFLEVBQ3RGLG9CQUE0RCxFQUM5QyxrQ0FBd0YsRUFDL0csV0FBMEMsRUFDOUIsdUJBQWtFLEVBQzNFLGNBQWdELEVBQ2hELGNBQWdELEVBQ2hELGNBQWdELEVBQ3BELFVBQXdDLEVBQ2hDLGtCQUF3RDtZQVR2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFDO1lBQ3JFLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDN0IsdUNBQWtDLEdBQWxDLGtDQUFrQyxDQUFxQztZQUM5RixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNiLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDMUQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQy9CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbkMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNmLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFkN0QsZ0JBQVcsR0FBbUIsRUFBRSxDQUFDO1lBQ2pDLDJCQUFzQixHQUFHLElBQUksZUFBTyxFQUFFLENBQUM7WUFDaEQsd0JBQW1CLEdBQXFCLElBQUksQ0FBQztZQWNwRCxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsRUFBRTtnQkFDbkUsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7b0JB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