/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/parts/storage/common/storage", "vs/platform/storage/common/storage", "vs/platform/storage/common/storageIpc", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, async_1, lifecycle_1, network_1, resources_1, storage_1, storage_2, storageIpc_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteStorageService = void 0;
    class RemoteStorageService extends storage_2.AbstractStorageService {
        constructor(initialWorkspace, initialProfiles, remoteService, environmentService) {
            super();
            this.initialWorkspace = initialWorkspace;
            this.initialProfiles = initialProfiles;
            this.remoteService = remoteService;
            this.environmentService = environmentService;
            this.applicationStorageProfile = this.initialProfiles.defaultProfile;
            this.applicationStorage = this.createApplicationStorage();
            this.profileStorageProfile = this.initialProfiles.currentProfile;
            this.profileStorageDisposables = this._register(new lifecycle_1.DisposableStore());
            this.profileStorage = this.createProfileStorage(this.profileStorageProfile);
            this.workspaceStorageId = this.initialWorkspace?.id;
            this.workspaceStorageDisposables = this._register(new lifecycle_1.DisposableStore());
            this.workspaceStorage = this.createWorkspaceStorage(this.initialWorkspace);
        }
        createApplicationStorage() {
            const storageDataBaseClient = this._register(new storageIpc_1.ApplicationStorageDatabaseClient(this.remoteService.getChannel('storage')));
            const applicationStorage = this._register(new storage_1.Storage(storageDataBaseClient));
            this._register(applicationStorage.onDidChangeStorage(e => this.emitDidChangeValue(-1 /* StorageScope.APPLICATION */, e)));
            return applicationStorage;
        }
        createProfileStorage(profile) {
            // First clear any previously associated disposables
            this.profileStorageDisposables.clear();
            // Remember profile associated to profile storage
            this.profileStorageProfile = profile;
            let profileStorage;
            if ((0, storage_2.isProfileUsingDefaultStorage)(profile)) {
                // If we are using default profile storage, the profile storage is
                // actually the same as application storage. As such we
                // avoid creating the storage library a second time on
                // the same DB.
                profileStorage = this.applicationStorage;
            }
            else {
                const storageDataBaseClient = this.profileStorageDisposables.add(new storageIpc_1.ProfileStorageDatabaseClient(this.remoteService.getChannel('storage'), profile));
                profileStorage = this.profileStorageDisposables.add(new storage_1.Storage(storageDataBaseClient));
            }
            this.profileStorageDisposables.add(profileStorage.onDidChangeStorage(e => this.emitDidChangeValue(0 /* StorageScope.PROFILE */, e)));
            return profileStorage;
        }
        createWorkspaceStorage(workspace) {
            // First clear any previously associated disposables
            this.workspaceStorageDisposables.clear();
            // Remember workspace ID for logging later
            this.workspaceStorageId = workspace?.id;
            let workspaceStorage = undefined;
            if (workspace) {
                const storageDataBaseClient = this.workspaceStorageDisposables.add(new storageIpc_1.WorkspaceStorageDatabaseClient(this.remoteService.getChannel('storage'), workspace));
                workspaceStorage = this.workspaceStorageDisposables.add(new storage_1.Storage(storageDataBaseClient));
                this.workspaceStorageDisposables.add(workspaceStorage.onDidChangeStorage(e => this.emitDidChangeValue(1 /* StorageScope.WORKSPACE */, e)));
            }
            return workspaceStorage;
        }
        async doInitialize() {
            // Init all storage locations
            await async_1.Promises.settled([
                this.applicationStorage.init(),
                this.profileStorage.init(),
                this.workspaceStorage?.init() ?? Promise.resolve()
            ]);
        }
        getStorage(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return this.applicationStorage;
                case 0 /* StorageScope.PROFILE */:
                    return this.profileStorage;
                default:
                    return this.workspaceStorage;
            }
        }
        getLogDetails(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return this.applicationStorageProfile.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath;
                case 0 /* StorageScope.PROFILE */:
                    return this.profileStorageProfile?.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath;
                default:
                    return this.workspaceStorageId ? `${(0, resources_1.joinPath)(this.environmentService.workspaceStorageHome, this.workspaceStorageId, 'state.vscdb').with({ scheme: network_1.Schemas.file }).fsPath}` : undefined;
            }
        }
        async close() {
            // Stop periodic scheduler and idle runner as we now collect state normally
            this.stopFlushWhenIdle();
            // Signal as event so that clients can still store data
            this.emitWillSaveState(storage_2.WillSaveStateReason.SHUTDOWN);
            // Do it
            await async_1.Promises.settled([
                this.applicationStorage.close(),
                this.profileStorage.close(),
                this.workspaceStorage?.close() ?? Promise.resolve()
            ]);
        }
        async switchToProfile(toProfile) {
            if (!this.canSwitchProfile(this.profileStorageProfile, toProfile)) {
                return;
            }
            const oldProfileStorage = this.profileStorage;
            const oldItems = oldProfileStorage.items;
            // Close old profile storage but only if this is
            // different from application storage!
            if (oldProfileStorage !== this.applicationStorage) {
                await oldProfileStorage.close();
            }
            // Create new profile storage & init
            this.profileStorage = this.createProfileStorage(toProfile);
            await this.profileStorage.init();
            // Handle data switch and eventing
            this.switchData(oldItems, this.profileStorage, 0 /* StorageScope.PROFILE */);
        }
        async switchToWorkspace(toWorkspace, preserveData) {
            const oldWorkspaceStorage = this.workspaceStorage;
            const oldItems = oldWorkspaceStorage?.items ?? new Map();
            // Close old workspace storage
            await oldWorkspaceStorage?.close();
            // Create new workspace storage & init
            this.workspaceStorage = this.createWorkspaceStorage(toWorkspace);
            await this.workspaceStorage.init();
            // Handle data switch and eventing
            this.switchData(oldItems, this.workspaceStorage, 1 /* StorageScope.WORKSPACE */);
        }
        hasScope(scope) {
            if ((0, userDataProfile_1.isUserDataProfile)(scope)) {
                return this.profileStorageProfile.id === scope.id;
            }
            return this.workspaceStorageId === scope.id;
        }
    }
    exports.RemoteStorageService = RemoteStorageService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9zdG9yYWdlL2NvbW1vbi9zdG9yYWdlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxvQkFBcUIsU0FBUSxnQ0FBc0I7UUFhL0QsWUFDa0IsZ0JBQXFELEVBQ3JELGVBQXVGLEVBQ3ZGLGFBQTZCLEVBQzdCLGtCQUF1QztZQUV4RCxLQUFLLEVBQUUsQ0FBQztZQUxTLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBcUM7WUFDckQsb0JBQWUsR0FBZixlQUFlLENBQXdFO1lBQ3ZGLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUM3Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBZnhDLDhCQUF5QixHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDO1lBQ2hFLHVCQUFrQixHQUFHLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBRTlELDBCQUFxQixHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDO1lBQ25ELDhCQUF5QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUMzRSxtQkFBYyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUV2RSx1QkFBa0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDO1lBQ3RDLGdDQUEyQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUM3RSxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFTOUUs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