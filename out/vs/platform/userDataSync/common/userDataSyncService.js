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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/userDataSync/common/globalStateSync", "vs/platform/userDataSync/common/keybindingsSync", "vs/platform/userDataSync/common/settingsSync", "vs/platform/userDataSync/common/snippetsSync", "vs/platform/userDataSync/common/tasksSync", "vs/platform/userDataSync/common/userDataProfilesManifestSync", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, arrays_1, async_1, cancellation_1, errorMessage_1, event_1, lifecycle_1, resources_1, types_1, uuid_1, configuration_1, extensionManagement_1, files_1, instantiation_1, storage_1, telemetry_1, userDataProfile_1, extensionsSync_1, globalStateSync_1, keybindingsSync_1, settingsSync_1, snippetsSync_1, tasksSync_1, userDataProfilesManifestSync_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncService = void 0;
    const LAST_SYNC_TIME_KEY = 'sync.lastSyncTime';
    let UserDataSyncService = class UserDataSyncService extends lifecycle_1.Disposable {
        get status() { return this._status; }
        get conflicts() { return this._conflicts; }
        get lastSyncTime() { return this._lastSyncTime; }
        constructor(fileService, userDataSyncStoreService, userDataSyncStoreManagementService, instantiationService, logService, telemetryService, storageService, userDataSyncEnablementService, userDataProfilesService, userDataSyncResourceProviderService, userDataSyncLocalStoreService) {
            super();
            this.fileService = fileService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataProfilesService = userDataProfilesService;
            this.userDataSyncResourceProviderService = userDataSyncResourceProviderService;
            this.userDataSyncLocalStoreService = userDataSyncLocalStoreService;
            this._status = "uninitialized" /* SyncStatus.Uninitialized */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._onDidChangeLocal = this._register(new event_1.Emitter());
            this.onDidChangeLocal = this._onDidChangeLocal.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this._syncErrors = [];
            this._onSyncErrors = this._register(new event_1.Emitter());
            this.onSyncErrors = this._onSyncErrors.event;
            this._lastSyncTime = undefined;
            this._onDidChangeLastSyncTime = this._register(new event_1.Emitter());
            this.onDidChangeLastSyncTime = this._onDidChangeLastSyncTime.event;
            this._onDidResetLocal = this._register(new event_1.Emitter());
            this.onDidResetLocal = this._onDidResetLocal.event;
            this._onDidResetRemote = this._register(new event_1.Emitter());
            this.onDidResetRemote = this._onDidResetRemote.event;
            this.activeProfileSynchronizers = new Map();
            this._status = userDataSyncStoreManagementService.userDataSyncStore ? "idle" /* SyncStatus.Idle */ : "uninitialized" /* SyncStatus.Uninitialized */;
            this._lastSyncTime = this.storageService.getNumber(LAST_SYNC_TIME_KEY, -1 /* StorageScope.APPLICATION */, undefined);
            this._register((0, lifecycle_1.toDisposable)(() => this.clearActiveProfileSynchronizers()));
        }
        async createSyncTask(manifest, disableCache) {
            this.checkEnablement();
            this.logService.info('Sync started.');
            const startTime = new Date().getTime();
            const executionId = (0, uuid_1.generateUuid)();
            try {
                const syncHeaders = (0, userDataSync_1.createSyncHeaders)(executionId);
                if (disableCache) {
                    syncHeaders['Cache-Control'] = 'no-cache';
                }
                manifest = await this.userDataSyncStoreService.manifest(manifest, syncHeaders);
            }
            catch (error) {
                const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
                reportUserDataSyncError(userDataSyncError, executionId, this.userDataSyncStoreManagementService, this.telemetryService);
                throw userDataSyncError;
            }
            const executed = false;
            const that = this;
            let cancellablePromise;
            return {
                manifest,
                async run() {
                    if (executed) {
                        throw new Error('Can run a task only once');
                    }
                    cancellablePromise = (0, async_1.createCancelablePromise)(token => that.sync(manifest, false, executionId, token));
                    await cancellablePromise.finally(() => cancellablePromise = undefined);
                    that.logService.info(`Sync done. Took ${new Date().getTime() - startTime}ms`);
                    that.updateLastSyncTime();
                },
                stop() {
                    cancellablePromise?.cancel();
                    return that.stop();
                }
            };
        }
        async createManualSyncTask() {
            this.checkEnablement();
            if (this.userDataSyncEnablementService.isEnabled()) {
                throw new userDataSync_1.UserDataSyncError('Cannot start manual sync when sync is enabled', "LocalError" /* UserDataSyncErrorCode.LocalError */);
            }
            this.logService.info('Sync started.');
            const startTime = new Date().getTime();
            const executionId = (0, uuid_1.generateUuid)();
            const syncHeaders = (0, userDataSync_1.createSyncHeaders)(executionId);
            let manifest;
            try {
                manifest = await this.userDataSyncStoreService.manifest(null, syncHeaders);
            }
            catch (error) {
                const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
                reportUserDataSyncError(userDataSyncError, executionId, this.userDataSyncStoreManagementService, this.telemetryService);
                throw userDataSyncError;
            }
            /* Manual sync shall start on clean local state */
            await this.resetLocal();
            const that = this;
            const cancellableToken = new cancellation_1.CancellationTokenSource();
            return {
                id: executionId,
                async merge() {
                    return that.sync(manifest, true, executionId, cancellableToken.token);
                },
                async apply() {
                    try {
                        try {
                            await that.applyManualSync(manifest, executionId, cancellableToken.token);
                        }
                        catch (error) {
                            if (userDataSync_1.UserDataSyncError.toUserDataSyncError(error).code === "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */) {
                                that.logService.info('Client is making invalid requests. Cleaning up data...');
                                await that.cleanUpRemoteData();
                                that.logService.info('Applying manual sync again...');
                                await that.applyManualSync(manifest, executionId, cancellableToken.token);
                            }
                            else {
                                throw error;
                            }
                        }
                    }
                    catch (error) {
                        that.logService.error(error);
                        throw error;
                    }
                    that.logService.info(`Sync done. Took ${new Date().getTime() - startTime}ms`);
                    that.updateLastSyncTime();
                },
                async stop() {
                    cancellableToken.cancel();
                    await that.stop();
                    await that.resetLocal();
                }
            };
        }
        async sync(manifest, merge, executionId, token) {
            this._syncErrors = [];
            try {
                if (this.status !== "hasConflicts" /* SyncStatus.HasConflicts */) {
                    this.setStatus("syncing" /* SyncStatus.Syncing */);
                }
                // Sync Default Profile First
                const defaultProfileSynchronizer = this.getOrCreateActiveProfileSynchronizer(this.userDataProfilesService.defaultProfile, undefined);
                this._syncErrors.push(...await this.syncProfile(defaultProfileSynchronizer, manifest, merge, executionId, token));
                // Sync other profiles
                const userDataProfileManifestSynchronizer = defaultProfileSynchronizer.enabled.find(s => s.resource === "profiles" /* SyncResource.Profiles */);
                if (userDataProfileManifestSynchronizer) {
                    const syncProfiles = (await userDataProfileManifestSynchronizer.getLastSyncedProfiles()) || [];
                    if (token.isCancellationRequested) {
                        return;
                    }
                    await this.syncRemoteProfiles(syncProfiles, manifest, merge, executionId, token);
                }
            }
            finally {
                if (this.status !== "hasConflicts" /* SyncStatus.HasConflicts */) {
                    this.setStatus("idle" /* SyncStatus.Idle */);
                }
                this._onSyncErrors.fire(this._syncErrors);
            }
        }
        async syncRemoteProfiles(remoteProfiles, manifest, merge, executionId, token) {
            for (const syncProfile of remoteProfiles) {
                if (token.isCancellationRequested) {
                    return;
                }
                const profile = this.userDataProfilesService.profiles.find(p => p.id === syncProfile.id);
                if (!profile) {
                    this.logService.error(`Profile with id:${syncProfile.id} and name: ${syncProfile.name} does not exist locally to sync.`);
                    continue;
                }
                this.logService.info('Syncing profile.', syncProfile.name);
                const profileSynchronizer = this.getOrCreateActiveProfileSynchronizer(profile, syncProfile);
                this._syncErrors.push(...await this.syncProfile(profileSynchronizer, manifest, merge, executionId, token));
            }
            // Dispose & Delete profile synchronizers which do not exist anymore
            for (const [key, profileSynchronizerItem] of this.activeProfileSynchronizers.entries()) {
                if (this.userDataProfilesService.profiles.some(p => p.id === profileSynchronizerItem[0].profile.id)) {
                    continue;
                }
                profileSynchronizerItem[1].dispose();
                this.activeProfileSynchronizers.delete(key);
            }
        }
        async applyManualSync(manifest, executionId, token) {
            const profileSynchronizers = this.getActiveProfileSynchronizers();
            for (const profileSynchronizer of profileSynchronizers) {
                if (token.isCancellationRequested) {
                    return;
                }
                await profileSynchronizer.apply(executionId, token);
            }
            const defaultProfileSynchronizer = profileSynchronizers.find(s => s.profile.isDefault);
            if (!defaultProfileSynchronizer) {
                return;
            }
            const userDataProfileManifestSynchronizer = defaultProfileSynchronizer.enabled.find(s => s.resource === "profiles" /* SyncResource.Profiles */);
            if (!userDataProfileManifestSynchronizer) {
                return;
            }
            // Sync remote profiles which are not synced locally
            const remoteProfiles = (await userDataProfileManifestSynchronizer.getRemoteSyncedProfiles(manifest?.latest ?? null)) || [];
            const remoteProfilesToSync = remoteProfiles.filter(remoteProfile => profileSynchronizers.every(s => s.profile.id !== remoteProfile.id));
            if (remoteProfilesToSync.length) {
                await this.syncRemoteProfiles(remoteProfilesToSync, manifest, false, executionId, token);
            }
        }
        async syncProfile(profileSynchronizer, manifest, merge, executionId, token) {
            const errors = await profileSynchronizer.sync(manifest, merge, executionId, token);
            return errors.map(([syncResource, error]) => ({ profile: profileSynchronizer.profile, syncResource, error }));
        }
        async stop() {
            if (this.status !== "idle" /* SyncStatus.Idle */) {
                await Promise.allSettled(this.getActiveProfileSynchronizers().map(profileSynchronizer => profileSynchronizer.stop()));
            }
        }
        async resolveContent(resource) {
            const content = await this.userDataSyncResourceProviderService.resolveContent(resource);
            if (content) {
                return content;
            }
            for (const profileSynchronizer of this.getActiveProfileSynchronizers()) {
                for (const synchronizer of profileSynchronizer.enabled) {
                    const content = await synchronizer.resolveContent(resource);
                    if (content) {
                        return content;
                    }
                }
            }
            return null;
        }
        async replace(syncResourceHandle) {
            this.checkEnablement();
            const profileSyncResource = this.userDataSyncResourceProviderService.resolveUserDataSyncResource(syncResourceHandle);
            if (!profileSyncResource) {
                return;
            }
            const content = await this.resolveContent(syncResourceHandle.uri);
            if (!content) {
                return;
            }
            await this.performAction(profileSyncResource.profile, async (synchronizer) => {
                if (profileSyncResource.syncResource === synchronizer.resource) {
                    await synchronizer.replace(content);
                    return true;
                }
                return undefined;
            });
            return;
        }
        async accept(syncResource, resource, content, apply) {
            this.checkEnablement();
            await this.performAction(syncResource.profile, async (synchronizer) => {
                if (syncResource.syncResource === synchronizer.resource) {
                    await synchronizer.accept(resource, content);
                    if (apply) {
                        await synchronizer.apply((0, types_1.isBoolean)(apply) ? false : apply.force, (0, userDataSync_1.createSyncHeaders)((0, uuid_1.generateUuid)()));
                    }
                    return true;
                }
                return undefined;
            });
        }
        async hasLocalData() {
            const result = await this.performAction(this.userDataProfilesService.defaultProfile, async (synchronizer) => {
                // skip global state synchronizer
                if (synchronizer.resource !== "globalState" /* SyncResource.GlobalState */ && await synchronizer.hasLocalData()) {
                    return true;
                }
                return undefined;
            });
            return !!result;
        }
        async hasPreviouslySynced() {
            const result = await this.performAction(this.userDataProfilesService.defaultProfile, async (synchronizer) => {
                if (await synchronizer.hasPreviouslySynced()) {
                    return true;
                }
                return undefined;
            });
            return !!result;
        }
        async reset() {
            this.checkEnablement();
            await this.resetRemote();
            await this.resetLocal();
        }
        async resetRemote() {
            this.checkEnablement();
            try {
                await this.userDataSyncStoreService.clear();
                this.logService.info('Cleared data on server');
            }
            catch (e) {
                this.logService.error(e);
            }
            this._onDidResetRemote.fire();
        }
        async resetLocal() {
            this.checkEnablement();
            this._lastSyncTime = undefined;
            this.storageService.remove(LAST_SYNC_TIME_KEY, -1 /* StorageScope.APPLICATION */);
            for (const [synchronizer] of this.activeProfileSynchronizers.values()) {
                try {
                    await synchronizer.resetLocal();
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
            this.clearActiveProfileSynchronizers();
            this._onDidResetLocal.fire();
            this.logService.info('Did reset the local sync state.');
        }
        async cleanUpRemoteData() {
            const remoteProfiles = await this.userDataSyncResourceProviderService.getRemoteSyncedProfiles();
            const remoteProfileCollections = remoteProfiles.map(profile => profile.collection);
            const allCollections = await this.userDataSyncStoreService.getAllCollections();
            const redundantCollections = allCollections.filter(c => !remoteProfileCollections.includes(c));
            if (redundantCollections.length) {
                this.logService.info(`Deleting ${redundantCollections.length} redundant collections on server`);
                await Promise.allSettled(redundantCollections.map(collectionId => this.userDataSyncStoreService.deleteCollection(collectionId)));
                this.logService.info(`Deleted redundant collections on server`);
            }
            const updatedRemoteProfiles = remoteProfiles.filter(profile => allCollections.includes(profile.collection));
            if (updatedRemoteProfiles.length !== remoteProfiles.length) {
                const profileManifestSynchronizer = this.instantiationService.createInstance(userDataProfilesManifestSync_1.UserDataProfilesManifestSynchroniser, this.userDataProfilesService.defaultProfile, undefined);
                try {
                    this.logService.info('Resetting the last synced state of profiles');
                    await profileManifestSynchronizer.resetLocal();
                    this.logService.info('Did reset the last synced state of profiles');
                    this.logService.info(`Updating remote profiles with invalid collections on server`);
                    await profileManifestSynchronizer.updateRemoteProfiles(updatedRemoteProfiles, null);
                    this.logService.info(`Updated remote profiles on server`);
                }
                finally {
                    profileManifestSynchronizer.dispose();
                }
            }
        }
        async saveRemoteActivityData(location) {
            this.checkEnablement();
            const data = await this.userDataSyncStoreService.getActivityData();
            await this.fileService.writeFile(location, data);
        }
        async extractActivityData(activityDataResource, location) {
            const content = (await this.fileService.readFile(activityDataResource)).value.toString();
            const activityData = JSON.parse(content);
            if (activityData.resources) {
                for (const resource in activityData.resources) {
                    for (const version of activityData.resources[resource]) {
                        await this.userDataSyncLocalStoreService.writeResource(resource, version.content, new Date(version.created * 1000), undefined, location);
                    }
                }
            }
            if (activityData.collections) {
                for (const collection in activityData.collections) {
                    for (const resource in activityData.collections[collection].resources) {
                        for (const version of activityData.collections[collection].resources?.[resource] ?? []) {
                            await this.userDataSyncLocalStoreService.writeResource(resource, version.content, new Date(version.created * 1000), collection, location);
                        }
                    }
                }
            }
        }
        async performAction(profile, action) {
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const activeProfileSyncronizer = this.activeProfileSynchronizers.get(profile.id);
                if (activeProfileSyncronizer) {
                    const result = await this.performActionWithProfileSynchronizer(activeProfileSyncronizer[0], action, disposables);
                    return (0, types_1.isUndefined)(result) ? null : result;
                }
                if (profile.isDefault) {
                    const defaultProfileSynchronizer = disposables.add(this.instantiationService.createInstance(ProfileSynchronizer, profile, undefined));
                    const result = await this.performActionWithProfileSynchronizer(defaultProfileSynchronizer, action, disposables);
                    return (0, types_1.isUndefined)(result) ? null : result;
                }
                if (this.userDataProfilesService.isEnabled()) {
                    return null;
                }
                const userDataProfileManifestSynchronizer = disposables.add(this.instantiationService.createInstance(userDataProfilesManifestSync_1.UserDataProfilesManifestSynchroniser, profile, undefined));
                const manifest = await this.userDataSyncStoreService.manifest(null);
                const syncProfiles = (await userDataProfileManifestSynchronizer.getRemoteSyncedProfiles(manifest?.latest ?? null)) || [];
                const syncProfile = syncProfiles.find(syncProfile => syncProfile.id === profile.id);
                if (syncProfile) {
                    const profileSynchronizer = disposables.add(this.instantiationService.createInstance(ProfileSynchronizer, profile, syncProfile.collection));
                    const result = await this.performActionWithProfileSynchronizer(profileSynchronizer, action, disposables);
                    return (0, types_1.isUndefined)(result) ? null : result;
                }
                return null;
            }
            finally {
                disposables.dispose();
            }
        }
        async performActionWithProfileSynchronizer(profileSynchronizer, action, disposables) {
            const allSynchronizers = [...profileSynchronizer.enabled, ...profileSynchronizer.disabled.reduce((synchronizers, syncResource) => {
                    if (syncResource !== "workspaceState" /* SyncResource.WorkspaceState */) {
                        synchronizers.push(disposables.add(profileSynchronizer.createSynchronizer(syncResource)));
                    }
                    return synchronizers;
                }, [])];
            for (const synchronizer of allSynchronizers) {
                const result = await action(synchronizer);
                if (!(0, types_1.isUndefined)(result)) {
                    return result;
                }
            }
            return undefined;
        }
        setStatus(status) {
            const oldStatus = this._status;
            if (this._status !== status) {
                this._status = status;
                this._onDidChangeStatus.fire(status);
                if (oldStatus === "hasConflicts" /* SyncStatus.HasConflicts */) {
                    this.updateLastSyncTime();
                }
            }
        }
        updateConflicts() {
            const conflicts = this.getActiveProfileSynchronizers().map(synchronizer => synchronizer.conflicts).flat();
            if (!(0, arrays_1.equals)(this._conflicts, conflicts, (a, b) => a.profile.id === b.profile.id && a.syncResource === b.syncResource && (0, arrays_1.equals)(a.conflicts, b.conflicts, (a, b) => (0, resources_1.isEqual)(a.previewResource, b.previewResource)))) {
                this._conflicts = conflicts;
                this._onDidChangeConflicts.fire(conflicts);
            }
        }
        updateLastSyncTime() {
            if (this.status === "idle" /* SyncStatus.Idle */) {
                this._lastSyncTime = new Date().getTime();
                this.storageService.store(LAST_SYNC_TIME_KEY, this._lastSyncTime, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                this._onDidChangeLastSyncTime.fire(this._lastSyncTime);
            }
        }
        getOrCreateActiveProfileSynchronizer(profile, syncProfile) {
            let activeProfileSynchronizer = this.activeProfileSynchronizers.get(profile.id);
            if (activeProfileSynchronizer && activeProfileSynchronizer[0].collection !== syncProfile?.collection) {
                this.logService.error('Profile synchronizer collection does not match with the remote sync profile collection');
                activeProfileSynchronizer[1].dispose();
                activeProfileSynchronizer = undefined;
                this.activeProfileSynchronizers.delete(profile.id);
            }
            if (!activeProfileSynchronizer) {
                const disposables = new lifecycle_1.DisposableStore();
                const profileSynchronizer = disposables.add(this.instantiationService.createInstance(ProfileSynchronizer, profile, syncProfile?.collection));
                disposables.add(profileSynchronizer.onDidChangeStatus(e => this.setStatus(e)));
                disposables.add(profileSynchronizer.onDidChangeConflicts(conflicts => this.updateConflicts()));
                disposables.add(profileSynchronizer.onDidChangeLocal(e => this._onDidChangeLocal.fire(e)));
                this.activeProfileSynchronizers.set(profile.id, activeProfileSynchronizer = [profileSynchronizer, disposables]);
            }
            return activeProfileSynchronizer[0];
        }
        getActiveProfileSynchronizers() {
            const profileSynchronizers = [];
            for (const [profileSynchronizer] of this.activeProfileSynchronizers.values()) {
                profileSynchronizers.push(profileSynchronizer);
            }
            return profileSynchronizers;
        }
        clearActiveProfileSynchronizers() {
            this.activeProfileSynchronizers.forEach(([, disposable]) => disposable.dispose());
            this.activeProfileSynchronizers.clear();
        }
        checkEnablement() {
            if (!this.userDataSyncStoreManagementService.userDataSyncStore) {
                throw new Error('Not enabled');
            }
        }
    };
    exports.UserDataSyncService = UserDataSyncService;
    exports.UserDataSyncService = UserDataSyncService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, userDataSync_1.IUserDataSyncStoreService),
        __param(2, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, userDataSync_1.IUserDataSyncLogService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, storage_1.IStorageService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService),
        __param(8, userDataProfile_1.IUserDataProfilesService),
        __param(9, userDataSync_1.IUserDataSyncResourceProviderService),
        __param(10, userDataSync_1.IUserDataSyncLocalStoreService)
    ], UserDataSyncService);
    let ProfileSynchronizer = class ProfileSynchronizer extends lifecycle_1.Disposable {
        get enabled() { return this._enabled.sort((a, b) => a[1] - b[1]).map(([synchronizer]) => synchronizer); }
        get disabled() { return userDataSync_1.ALL_SYNC_RESOURCES.filter(syncResource => !this.userDataSyncEnablementService.isResourceEnabled(syncResource)); }
        get status() { return this._status; }
        get conflicts() { return this._conflicts; }
        constructor(profile, collection, userDataSyncEnablementService, instantiationService, extensionGalleryService, userDataSyncStoreManagementService, telemetryService, logService, userDataProfilesService, configurationService) {
            super();
            this.profile = profile;
            this.collection = collection;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.instantiationService = instantiationService;
            this.extensionGalleryService = extensionGalleryService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.userDataProfilesService = userDataProfilesService;
            this.configurationService = configurationService;
            this._enabled = [];
            this._status = "idle" /* SyncStatus.Idle */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._onDidChangeLocal = this._register(new event_1.Emitter());
            this.onDidChangeLocal = this._onDidChangeLocal.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this._register(userDataSyncEnablementService.onDidChangeResourceEnablement(([syncResource, enablement]) => this.onDidChangeResourceEnablement(syncResource, enablement)));
            this._register((0, lifecycle_1.toDisposable)(() => this._enabled.splice(0, this._enabled.length).forEach(([, , disposable]) => disposable.dispose())));
            for (const syncResource of userDataSync_1.ALL_SYNC_RESOURCES) {
                if (userDataSyncEnablementService.isResourceEnabled(syncResource)) {
                    this.registerSynchronizer(syncResource);
                }
            }
        }
        onDidChangeResourceEnablement(syncResource, enabled) {
            if (enabled) {
                this.registerSynchronizer(syncResource);
            }
            else {
                this.deRegisterSynchronizer(syncResource);
            }
        }
        registerSynchronizer(syncResource) {
            if (this._enabled.some(([synchronizer]) => synchronizer.resource === syncResource)) {
                return;
            }
            if (syncResource === "extensions" /* SyncResource.Extensions */ && !this.extensionGalleryService.isEnabled()) {
                this.logService.info('Skipping extensions sync because gallery is not configured');
                return;
            }
            if (syncResource === "profiles" /* SyncResource.Profiles */) {
                if (!this.profile.isDefault) {
                    return;
                }
                if (!this.userDataProfilesService.isEnabled()) {
                    return;
                }
            }
            if (syncResource === "workspaceState" /* SyncResource.WorkspaceState */) {
                return;
            }
            if (syncResource !== "profiles" /* SyncResource.Profiles */ && this.profile.useDefaultFlags?.[syncResource]) {
                this.logService.debug(`Skipping syncing ${syncResource} in ${this.profile.name} because it is already synced by default profile`);
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const synchronizer = disposables.add(this.createSynchronizer(syncResource));
            disposables.add(synchronizer.onDidChangeStatus(() => this.updateStatus()));
            disposables.add(synchronizer.onDidChangeConflicts(() => this.updateConflicts()));
            disposables.add(synchronizer.onDidChangeLocal(() => this._onDidChangeLocal.fire(syncResource)));
            const order = this.getOrder(syncResource);
            this._enabled.push([synchronizer, order, disposables]);
        }
        deRegisterSynchronizer(syncResource) {
            const index = this._enabled.findIndex(([synchronizer]) => synchronizer.resource === syncResource);
            if (index !== -1) {
                const [[synchronizer, , disposable]] = this._enabled.splice(index, 1);
                disposable.dispose();
                this.updateStatus();
                Promise.allSettled([synchronizer.stop(), synchronizer.resetLocal()])
                    .then(null, error => this.logService.error(error));
            }
        }
        createSynchronizer(syncResource) {
            switch (syncResource) {
                case "settings" /* SyncResource.Settings */: return this.instantiationService.createInstance(settingsSync_1.SettingsSynchroniser, this.profile, this.collection);
                case "keybindings" /* SyncResource.Keybindings */: return this.instantiationService.createInstance(keybindingsSync_1.KeybindingsSynchroniser, this.profile, this.collection);
                case "snippets" /* SyncResource.Snippets */: return this.instantiationService.createInstance(snippetsSync_1.SnippetsSynchroniser, this.profile, this.collection);
                case "tasks" /* SyncResource.Tasks */: return this.instantiationService.createInstance(tasksSync_1.TasksSynchroniser, this.profile, this.collection);
                case "globalState" /* SyncResource.GlobalState */: return this.instantiationService.createInstance(globalStateSync_1.GlobalStateSynchroniser, this.profile, this.collection);
                case "extensions" /* SyncResource.Extensions */: return this.instantiationService.createInstance(extensionsSync_1.ExtensionsSynchroniser, this.profile, this.collection);
                case "profiles" /* SyncResource.Profiles */: return this.instantiationService.createInstance(userDataProfilesManifestSync_1.UserDataProfilesManifestSynchroniser, this.profile, this.collection);
            }
        }
        async sync(manifest, merge, executionId, token) {
            // Return if cancellation is requested
            if (token.isCancellationRequested) {
                return [];
            }
            const synchronizers = this.enabled;
            if (!synchronizers.length) {
                return [];
            }
            try {
                const syncErrors = [];
                const syncHeaders = (0, userDataSync_1.createSyncHeaders)(executionId);
                const resourceManifest = (this.collection ? manifest?.collections?.[this.collection]?.latest : manifest?.latest) ?? null;
                const userDataSyncConfiguration = merge ? await this.getUserDataSyncConfiguration(resourceManifest) : {};
                for (const synchroniser of synchronizers) {
                    // Return if cancellation is requested
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    // Return if resource is not enabled
                    if (!this.userDataSyncEnablementService.isResourceEnabled(synchroniser.resource)) {
                        return [];
                    }
                    try {
                        if (merge) {
                            const preview = await synchroniser.preview(resourceManifest, userDataSyncConfiguration, syncHeaders);
                            if (preview) {
                                for (const resourcePreview of preview.resourcePreviews) {
                                    if ((resourcePreview.localChange !== 0 /* Change.None */ || resourcePreview.remoteChange !== 0 /* Change.None */) && resourcePreview.mergeState === "preview" /* MergeState.Preview */) {
                                        await synchroniser.merge(resourcePreview.previewResource);
                                    }
                                }
                            }
                        }
                        else {
                            await synchroniser.sync(resourceManifest, syncHeaders);
                        }
                    }
                    catch (e) {
                        const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(e);
                        reportUserDataSyncError(userDataSyncError, executionId, this.userDataSyncStoreManagementService, this.telemetryService);
                        if (canBailout(e)) {
                            throw userDataSyncError;
                        }
                        // Log and and continue
                        this.logService.error(e);
                        this.logService.error(`${synchroniser.resource}: ${(0, errorMessage_1.toErrorMessage)(e)}`);
                        syncErrors.push([synchroniser.resource, userDataSyncError]);
                    }
                }
                return syncErrors;
            }
            finally {
                this.updateStatus();
            }
        }
        async apply(executionId, token) {
            const syncHeaders = (0, userDataSync_1.createSyncHeaders)(executionId);
            for (const synchroniser of this.enabled) {
                if (token.isCancellationRequested) {
                    return;
                }
                try {
                    await synchroniser.apply(false, syncHeaders);
                }
                catch (e) {
                    const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(e);
                    reportUserDataSyncError(userDataSyncError, executionId, this.userDataSyncStoreManagementService, this.telemetryService);
                    if (canBailout(e)) {
                        throw userDataSyncError;
                    }
                    // Log and and continue
                    this.logService.error(e);
                    this.logService.error(`${synchroniser.resource}: ${(0, errorMessage_1.toErrorMessage)(e)}`);
                }
            }
        }
        async stop() {
            for (const synchroniser of this.enabled) {
                try {
                    if (synchroniser.status !== "idle" /* SyncStatus.Idle */) {
                        await synchroniser.stop();
                    }
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
        }
        async resetLocal() {
            for (const synchroniser of this.enabled) {
                try {
                    await synchroniser.resetLocal();
                }
                catch (e) {
                    this.logService.error(`${synchroniser.resource}: ${(0, errorMessage_1.toErrorMessage)(e)}`);
                    this.logService.error(e);
                }
            }
        }
        async getUserDataSyncConfiguration(manifest) {
            if (!this.profile.isDefault) {
                return {};
            }
            const local = this.configurationService.getValue(userDataSync_1.USER_DATA_SYNC_CONFIGURATION_SCOPE);
            const settingsSynchronizer = this.enabled.find(synchronizer => synchronizer instanceof settingsSync_1.SettingsSynchroniser);
            if (settingsSynchronizer) {
                const remote = await settingsSynchronizer.getRemoteUserDataSyncConfiguration(manifest);
                return { ...local, ...remote };
            }
            return local;
        }
        setStatus(status) {
            if (this._status !== status) {
                this._status = status;
                this._onDidChangeStatus.fire(status);
            }
        }
        updateStatus() {
            this.updateConflicts();
            if (this.enabled.some(s => s.status === "hasConflicts" /* SyncStatus.HasConflicts */)) {
                return this.setStatus("hasConflicts" /* SyncStatus.HasConflicts */);
            }
            if (this.enabled.some(s => s.status === "syncing" /* SyncStatus.Syncing */)) {
                return this.setStatus("syncing" /* SyncStatus.Syncing */);
            }
            return this.setStatus("idle" /* SyncStatus.Idle */);
        }
        updateConflicts() {
            const conflicts = this.enabled.filter(s => s.status === "hasConflicts" /* SyncStatus.HasConflicts */)
                .filter(s => s.conflicts.conflicts.length > 0)
                .map(s => s.conflicts);
            if (!(0, arrays_1.equals)(this._conflicts, conflicts, (a, b) => a.syncResource === b.syncResource && (0, arrays_1.equals)(a.conflicts, b.conflicts, (a, b) => (0, resources_1.isEqual)(a.previewResource, b.previewResource)))) {
                this._conflicts = conflicts;
                this._onDidChangeConflicts.fire(conflicts);
            }
        }
        getOrder(syncResource) {
            switch (syncResource) {
                case "settings" /* SyncResource.Settings */: return 0;
                case "keybindings" /* SyncResource.Keybindings */: return 1;
                case "snippets" /* SyncResource.Snippets */: return 2;
                case "tasks" /* SyncResource.Tasks */: return 3;
                case "globalState" /* SyncResource.GlobalState */: return 4;
                case "extensions" /* SyncResource.Extensions */: return 5;
                case "profiles" /* SyncResource.Profiles */: return 6;
                case "workspaceState" /* SyncResource.WorkspaceState */: return 7;
            }
        }
    };
    ProfileSynchronizer = __decorate([
        __param(2, userDataSync_1.IUserDataSyncEnablementService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, extensionManagement_1.IExtensionGalleryService),
        __param(5, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, userDataSync_1.IUserDataSyncLogService),
        __param(8, userDataProfile_1.IUserDataProfilesService),
        __param(9, configuration_1.IConfigurationService)
    ], ProfileSynchronizer);
    function canBailout(e) {
        if (e instanceof userDataSync_1.UserDataSyncError) {
            switch (e.code) {
                case "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */:
                case "TooLarge" /* UserDataSyncErrorCode.TooLarge */:
                case "RemoteTooManyRequests" /* UserDataSyncErrorCode.TooManyRequests */:
                case "TooManyRequestsAndRetryAfter" /* UserDataSyncErrorCode.TooManyRequestsAndRetryAfter */:
                case "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */:
                case "LocalTooManyProfiles" /* UserDataSyncErrorCode.LocalTooManyProfiles */:
                case "Gone" /* UserDataSyncErrorCode.Gone */:
                case "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */:
                case "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */:
                case "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */:
                    return true;
            }
        }
        return false;
    }
    function reportUserDataSyncError(userDataSyncError, executionId, userDataSyncStoreManagementService, telemetryService) {
        telemetryService.publicLog2('sync/error', {
            code: userDataSyncError.code,
            serverCode: userDataSyncError instanceof userDataSync_1.UserDataSyncStoreError ? String(userDataSyncError.serverCode) : undefined,
            url: userDataSyncError instanceof userDataSync_1.UserDataSyncStoreError ? userDataSyncError.url : undefined,
            resource: userDataSyncError.resource,
            executionId,
            service: userDataSyncStoreManagementService.userDataSyncStore.url.toString()
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9jb21tb24vdXNlckRhdGFTeW5jU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE0Q2hHLE1BQU0sa0JBQWtCLEdBQUcsbUJBQW1CLENBQUM7SUFFeEMsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTtRQUtsRCxJQUFJLE1BQU0sS0FBaUIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQVFqRCxJQUFJLFNBQVMsS0FBdUMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQVM3RSxJQUFJLFlBQVksS0FBeUIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQVlyRSxZQUNlLFdBQTBDLEVBQzdCLHdCQUFvRSxFQUMxRCxrQ0FBd0YsRUFDdEcsb0JBQTRELEVBQzFELFVBQW9ELEVBQzFELGdCQUFvRCxFQUN0RCxjQUFnRCxFQUNqQyw2QkFBOEUsRUFDcEYsdUJBQWtFLEVBQ3RELG1DQUEwRixFQUNoRyw2QkFBOEU7WUFFOUcsS0FBSyxFQUFFLENBQUM7WUFadUIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDWiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBQ3pDLHVDQUFrQyxHQUFsQyxrQ0FBa0MsQ0FBcUM7WUFDckYseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUN6QyxlQUFVLEdBQVYsVUFBVSxDQUF5QjtZQUN6QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3JDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNoQixrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdD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