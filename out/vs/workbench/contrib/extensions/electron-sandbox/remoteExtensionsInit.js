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
define(["require", "exports", "vs/base/common/cancellation", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/userDataSync/common/ignoredExtensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, cancellation_1, environment_1, extensionManagement_1, extensionManagementUtil_1, files_1, instantiation_1, serviceCollection_1, log_1, remoteAuthorityResolver_1, storage_1, uriIdentity_1, userDataProfile_1, extensionsSync_1, ignoredExtensions_1, userDataSync_1, userDataSyncStoreService_1, authentication_1, extensionManagement_2, extensionManifestPropertiesService_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteExtensionsInitializerContribution = void 0;
    let RemoteExtensionsInitializerContribution = class RemoteExtensionsInitializerContribution {
        constructor(extensionManagementServerService, storageService, remoteAgentService, userDataSyncStoreManagementService, instantiationService, logService, authenticationService, remoteAuthorityResolverService, userDataSyncEnablementService) {
            this.extensionManagementServerService = extensionManagementServerService;
            this.storageService = storageService;
            this.remoteAgentService = remoteAgentService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.authenticationService = authenticationService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.initializeRemoteExtensions();
        }
        async initializeRemoteExtensions() {
            const connection = this.remoteAgentService.getConnection();
            const localExtensionManagementServer = this.extensionManagementServerService.localExtensionManagementServer;
            const remoteExtensionManagementServer = this.extensionManagementServerService.remoteExtensionManagementServer;
            // Skip: Not a remote window
            if (!connection || !remoteExtensionManagementServer) {
                return;
            }
            // Skip: Not a native window
            if (!localExtensionManagementServer) {
                return;
            }
            // Skip: No UserdataSyncStore is configured
            if (!this.userDataSyncStoreManagementService.userDataSyncStore) {
                return;
            }
            const newRemoteConnectionKey = `${storage_1.IS_NEW_KEY}.${connection.remoteAuthority}`;
            // Skip: Not a new remote connection
            if (!this.storageService.getBoolean(newRemoteConnectionKey, -1 /* StorageScope.APPLICATION */, true)) {
                this.logService.trace(`Skipping initializing remote extensions because the window with this remote authority was opened before.`);
                return;
            }
            this.storageService.store(newRemoteConnectionKey, false, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            // Skip: Not a new workspace
            if (!this.storageService.isNew(1 /* StorageScope.WORKSPACE */)) {
                this.logService.trace(`Skipping initializing remote extensions because this workspace was opened before.`);
                return;
            }
            // Skip: Settings Sync is disabled
            if (!this.userDataSyncEnablementService.isEnabled()) {
                return;
            }
            // Skip: No account is provided to initialize
            const resolvedAuthority = await this.remoteAuthorityResolverService.resolveAuthority(connection.remoteAuthority);
            if (!resolvedAuthority.options?.authenticationSession) {
                return;
            }
            const sessions = await this.authenticationService.getSessions(resolvedAuthority.options?.authenticationSession.providerId);
            const session = sessions.find(s => s.id === resolvedAuthority.options?.authenticationSession?.id);
            // Skip: Session is not found
            if (!session) {
                this.logService.info('Skipping initializing remote extensions because the account with given session id is not found', resolvedAuthority.options.authenticationSession.id);
                return;
            }
            const userDataSyncStoreClient = this.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreClient, this.userDataSyncStoreManagementService.userDataSyncStore.url);
            userDataSyncStoreClient.setAuthToken(session.accessToken, resolvedAuthority.options.authenticationSession.providerId);
            const userData = await userDataSyncStoreClient.readResource("extensions" /* SyncResource.Extensions */, null);
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            serviceCollection.set(extensionManagement_1.IExtensionManagementService, remoteExtensionManagementServer.extensionManagementService);
            const instantiationService = this.instantiationService.createChild(serviceCollection);
            const extensionsToInstallInitializer = instantiationService.createInstance(RemoteExtensionsInitializer);
            await extensionsToInstallInitializer.initialize(userData);
        }
    };
    exports.RemoteExtensionsInitializerContribution = RemoteExtensionsInitializerContribution;
    exports.RemoteExtensionsInitializerContribution = RemoteExtensionsInitializerContribution = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, storage_1.IStorageService),
        __param(2, remoteAgentService_1.IRemoteAgentService),
        __param(3, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, log_1.ILogService),
        __param(6, authentication_1.IAuthenticationService),
        __param(7, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(8, userDataSync_1.IUserDataSyncEnablementService)
    ], RemoteExtensionsInitializerContribution);
    let RemoteExtensionsInitializer = class RemoteExtensionsInitializer extends extensionsSync_1.AbstractExtensionsInitializer {
        constructor(extensionManagementService, ignoredExtensionsManagementService, fileService, userDataProfilesService, environmentService, logService, uriIdentityService, extensionGalleryService, storageService, extensionManifestPropertiesService) {
            super(extensionManagementService, ignoredExtensionsManagementService, fileService, userDataProfilesService, environmentService, logService, storageService, uriIdentityService);
            this.extensionGalleryService = extensionGalleryService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
        }
        async doInitialize(remoteUserData) {
            const remoteExtensions = await this.parseExtensions(remoteUserData);
            if (!remoteExtensions) {
                this.logService.info('No synced extensions exist while initializing remote extensions.');
                return;
            }
            const installedExtensions = await this.extensionManagementService.getInstalled();
            const { newExtensions } = this.generatePreview(remoteExtensions, installedExtensions);
            if (!newExtensions.length) {
                this.logService.trace('No new remote extensions to install.');
                return;
            }
            const targetPlatform = await this.extensionManagementService.getTargetPlatform();
            const extensionsToInstall = await this.extensionGalleryService.getExtensions(newExtensions, { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None);
            if (extensionsToInstall.length) {
                await Promise.allSettled(extensionsToInstall.map(async (e) => {
                    const manifest = await this.extensionGalleryService.getManifest(e, cancellation_1.CancellationToken.None);
                    if (manifest && this.extensionManifestPropertiesService.canExecuteOnWorkspace(manifest)) {
                        const syncedExtension = remoteExtensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, e.identifier));
                        await this.extensionManagementService.installFromGallery(e, { installPreReleaseVersion: syncedExtension?.preRelease, donotIncludePackAndDependencies: true });
                    }
                }));
            }
        }
    };
    RemoteExtensionsInitializer = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(2, files_1.IFileService),
        __param(3, userDataProfile_1.IUserDataProfilesService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, log_1.ILogService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, extensionManagement_1.IExtensionGalleryService),
        __param(8, storage_1.IStorageService),
        __param(9, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], RemoteExtensionsInitializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uc0luaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2VsZWN0cm9uLXNhbmRib3gvcmVtb3RlRXh0ZW5zaW9uc0luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0J6RixJQUFNLHVDQUF1QyxHQUE3QyxNQUFNLHVDQUF1QztRQUNuRCxZQUNxRCxnQ0FBbUUsRUFDckYsY0FBK0IsRUFDM0Isa0JBQXVDLEVBQ3ZCLGtDQUF1RSxFQUNyRixvQkFBMkMsRUFDckQsVUFBdUIsRUFDWixxQkFBNkMsRUFDcEMsOEJBQStELEVBQ2hFLDZCQUE2RDtZQVIxRCxxQ0FBZ0MsR0FBaEMsZ0NBQWdDLENBQW1DO1lBQ3JGLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMzQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3ZCLHVDQUFrQyxHQUFsQyxrQ0FBa0MsQ0FBcUM7WUFDckYseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ1osMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUNwQyxtQ0FBOEIsR0FBOUIsOEJBQThCLENBQWlDO1lBQ2hFLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFFOUcsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7UUFDbkMsQ0FBQztRQUVPLEtBQUssQ0FBQywwQkFBMEI7WUFDdkMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzNELE1BQU0sOEJBQThCLEdBQUcsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDhCQUE4QixDQUFDO1lBQzVHLE1BQU0sK0JBQStCLEdBQUcsSUFB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