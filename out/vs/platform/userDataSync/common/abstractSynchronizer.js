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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, arrays_1, async_1, buffer_1, cancellation_1, event_1, json_1, lifecycle_1, strings_1, types_1, nls_1, configuration_1, environment_1, files_1, log_1, serviceMachineId_1, storage_1, telemetry_1, uriIdentity_1, userDataSync_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractInitializer = exports.AbstractJsonFileSynchroniser = exports.AbstractFileSynchroniser = exports.AbstractSynchroniser = void 0;
    exports.isRemoteUserData = isRemoteUserData;
    exports.isSyncData = isSyncData;
    exports.getSyncResourceLogLabel = getSyncResourceLogLabel;
    function isRemoteUserData(thing) {
        if (thing
            && (thing.ref !== undefined && typeof thing.ref === 'string' && thing.ref !== '')
            && (thing.syncData !== undefined && (thing.syncData === null || isSyncData(thing.syncData)))) {
            return true;
        }
        return false;
    }
    function isSyncData(thing) {
        if (thing
            && (thing.version !== undefined && typeof thing.version === 'number')
            && (thing.content !== undefined && typeof thing.content === 'string')) {
            // backward compatibility
            if (Object.keys(thing).length === 2) {
                return true;
            }
            if (Object.keys(thing).length === 3
                && (thing.machineId !== undefined && typeof thing.machineId === 'string')) {
                return true;
            }
        }
        return false;
    }
    function getSyncResourceLogLabel(syncResource, profile) {
        return `${(0, strings_1.uppercaseFirstLetter)(syncResource)}${profile.isDefault ? '' : ` (${profile.name})`}`;
    }
    let AbstractSynchroniser = class AbstractSynchroniser extends lifecycle_1.Disposable {
        get status() { return this._status; }
        get conflicts() { return { ...this.syncResource, conflicts: this._conflicts }; }
        constructor(syncResource, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService) {
            super();
            this.syncResource = syncResource;
            this.collection = collection;
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.storageService = storageService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncLocalStoreService = userDataSyncLocalStoreService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.syncPreviewPromise = null;
            this._status = "idle" /* SyncStatus.Idle */;
            this._onDidChangStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangStatus.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this.localChangeTriggerThrottler = this._register(new async_1.ThrottledDelayer(50));
            this._onDidChangeLocal = this._register(new event_1.Emitter());
            this.onDidChangeLocal = this._onDidChangeLocal.event;
            this.lastSyncUserDataStateKey = `${this.collection ? `${this.collection}.` : ''}${this.syncResource.syncResource}.lastSyncUserData`;
            this.hasSyncResourceStateVersionChanged = false;
            this.syncHeaders = {};
            this.resource = this.syncResource.syncResource;
            this.syncResourceLogLabel = getSyncResourceLogLabel(syncResource.syncResource, syncResource.profile);
            this.extUri = uriIdentityService.extUri;
            this.syncFolder = this.extUri.joinPath(environmentService.userDataSyncHome, ...(0, userDataSync_1.getPathSegments)(syncResource.profile.isDefault ? undefined : syncResource.profile.id, syncResource.syncResource));
            this.syncPreviewFolder = this.extUri.joinPath(this.syncFolder, userDataSync_1.PREVIEW_DIR_NAME);
            this.lastSyncResource = (0, userDataSync_1.getLastSyncResourceUri)(syncResource.profile.isDefault ? undefined : syncResource.profile.id, syncResource.syncResource, environmentService, this.extUri);
            this.currentMachineIdPromise = (0, serviceMachineId_1.getServiceMachineId)(environmentService, fileService, storageService);
        }
        triggerLocalChange() {
            this.localChangeTriggerThrottler.trigger(() => this.doTriggerLocalChange());
        }
        async doTriggerLocalChange() {
            // Sync again if current status is in conflicts
            if (this.status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                this.logService.info(`${this.syncResourceLogLabel}: In conflicts state and local change detected. Syncing again...`);
                const preview = await this.syncPreviewPromise;
                this.syncPreviewPromise = null;
                const status = await this.performSync(preview.remoteUserData, preview.lastSyncUserData, true, this.getUserDataSyncConfiguration());
                this.setStatus(status);
            }
            // Check if local change causes remote change
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Checking for local changes...`);
                const lastSyncUserData = await this.getLastSyncUserData();
                const hasRemoteChanged = lastSyncUserData ? await this.hasRemoteChanged(lastSyncUserData) : true;
                if (hasRemoteChanged) {
                    this._onDidChangeLocal.fire();
                }
            }
        }
        setStatus(status) {
            if (this._status !== status) {
                this._status = status;
                this._onDidChangStatus.fire(status);
            }
        }
        async sync(manifest, headers = {}) {
            await this._sync(manifest, true, this.getUserDataSyncConfiguration(), headers);
        }
        async preview(manifest, userDataSyncConfiguration, headers = {}) {
            return this._sync(manifest, false, userDataSyncConfiguration, headers);
        }
        async apply(force, headers = {}) {
            try {
                this.syncHeaders = { ...headers };
                const status = await this.doApply(force);
                this.setStatus(status);
                return this.syncPreviewPromise;
            }
            finally {
                this.syncHeaders = {};
            }
        }
        async _sync(manifest, apply, userDataSyncConfiguration, headers) {
            try {
                this.syncHeaders = { ...headers };
                if (this.status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as there are conflicts.`);
                    return this.syncPreviewPromise;
                }
                if (this.status === "syncing" /* SyncStatus.Syncing */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as it is running already.`);
                    return this.syncPreviewPromise;
                }
                this.logService.trace(`${this.syncResourceLogLabel}: Started synchronizing ${this.resource.toLowerCase()}...`);
                this.setStatus("syncing" /* SyncStatus.Syncing */);
                let status = "idle" /* SyncStatus.Idle */;
                try {
                    const lastSyncUserData = await this.getLastSyncUserData();
                    const remoteUserData = await this.getLatestRemoteUserData(manifest, lastSyncUserData);
                    status = await this.performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
                    if (status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                        this.logService.info(`${this.syncResourceLogLabel}: Detected conflicts while synchronizing ${this.resource.toLowerCase()}.`);
                    }
                    else if (status === "idle" /* SyncStatus.Idle */) {
                        this.logService.trace(`${this.syncResourceLogLabel}: Finished synchronizing ${this.resource.toLowerCase()}.`);
                    }
                    return this.syncPreviewPromise || null;
                }
                finally {
                    this.setStatus(status);
                }
            }
            finally {
                this.syncHeaders = {};
            }
        }
        async replace(content) {
            const syncData = this.parseSyncData(content);
            if (!syncData) {
                return false;
            }
            await this.stop();
            try {
                this.logService.trace(`${this.syncResourceLogLabel}: Started resetting ${this.resource.toLowerCase()}...`);
                this.setStatus("syncing" /* SyncStatus.Syncing */);
                const lastSyncUserData = await this.getLastSyncUserData();
                const remoteUserData = await this.getLatestRemoteUserData(null, lastSyncUserData);
                const isRemoteDataFromCurrentMachine = await this.isRemoteDataFromCurrentMachine(remoteUserData);
                /* use replace sync data */
                const resourcePreviewResults = await this.generateSyncPreview({ ref: remoteUserData.ref, syncData }, lastSyncUserData, isRemoteDataFromCurrentMachine, this.getUserDataSyncConfiguration(), cancellation_1.CancellationToken.None);
                const resourcePreviews = [];
                for (const resourcePreviewResult of resourcePreviewResults) {
                    /* Accept remote resource */
                    const acceptResult = await this.getAcceptResult(resourcePreviewResult, resourcePreviewResult.remoteResource, undefined, cancellation_1.CancellationToken.None);
                    /* compute remote change */
                    const { remoteChange } = await this.getAcceptResult(resourcePreviewResult, resourcePreviewResult.previewResource, resourcePreviewResult.remoteContent, cancellation_1.CancellationToken.None);
                    resourcePreviews.push([resourcePreviewResult, { ...acceptResult, remoteChange: remoteChange !== 0 /* Change.None */ ? remoteChange : 2 /* Change.Modified */ }]);
                }
                await this.applyResult(remoteUserData, lastSyncUserData, resourcePreviews, false);
                this.logService.info(`${this.syncResourceLogLabel}: Finished resetting ${this.resource.toLowerCase()}.`);
            }
            finally {
                this.setStatus("idle" /* SyncStatus.Idle */);
            }
            return true;
        }
        async isRemoteDataFromCurrentMachine(remoteUserData) {
            const machineId = await this.currentMachineIdPromise;
            return !!remoteUserData.syncData?.machineId && remoteUserData.syncData.machineId === machineId;
        }
        async getLatestRemoteUserData(manifest, lastSyncUserData) {
            if (lastSyncUserData) {
                const latestRef = manifest ? manifest[this.resource] : undefined;
                // Last time synced resource and latest resource on server are same
                if (lastSyncUserData.ref === latestRef) {
                    return lastSyncUserData;
                }
                // There is no resource on server and last time it was synced with no resource
                if (latestRef === undefined && lastSyncUserData.syncData === null) {
                    return lastSyncUserData;
                }
            }
            return this.getRemoteUserData(lastSyncUserData);
        }
        async performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration) {
            if (remoteUserData.syncData && remoteUserData.syncData.version > this.version) {
                // current version is not compatible with cloud version
                this.telemetryService.publicLog2('sync/incompatible', { source: this.resource });
                throw new userDataSync_1.UserDataSyncError((0, nls_1.localize)({ key: 'incompatible', comment: ['This is an error while syncing a resource that its local version is not compatible with its remote version.'] }, "Cannot sync {0} as its local version {1} is not compatible with its remote version {2}", this.resource, this.version, remoteUserData.syncData.version), "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */, this.resource);
            }
            try {
                return await this.doSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
            }
            catch (e) {
                if (e instanceof userDataSync_1.UserDataSyncError) {
                    switch (e.code) {
                        case "LocalPreconditionFailed" /* UserDataSyncErrorCode.LocalPreconditionFailed */:
                            // Rejected as there is a new local version. Syncing again...
                            this.logService.info(`${this.syncResourceLogLabel}: Failed to synchronize ${this.syncResourceLogLabel} as there is a new local version available. Synchronizing again...`);
                            return this.performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
                        case "Conflict" /* UserDataSyncErrorCode.Conflict */:
                        case "PreconditionFailed" /* UserDataSyncErrorCode.PreconditionFailed */:
                            // Rejected as there is a new remote version. Syncing again...
                            this.logService.info(`${this.syncResourceLogLabel}: Failed to synchronize as there is a new remote version available. Synchronizing again...`);
                            // Avoid cache and get latest remote user data - https://github.com/microsoft/vscode/issues/90624
                            remoteUserData = await this.getRemoteUserData(null);
                            // Get the latest last sync user data. Because multiple parallel syncs (in Web) could share same last sync data
                            // and one of them successfully updated remote and last sync state.
                            lastSyncUserData = await this.getLastSyncUserData();
                            return this.performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
                    }
                }
                throw e;
            }
        }
        async doSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration) {
            try {
                const isRemoteDataFromCurrentMachine = await this.isRemoteDataFromCurrentMachine(remoteUserData);
                const acceptRemote = !isRemoteDataFromCurrentMachine && lastSyncUserData === null && this.getStoredLastSyncUserDataStateContent() !== undefined;
                const merge = apply && !acceptRemote;
                // generate or use existing preview
                if (!this.syncPreviewPromise) {
                    this.syncPreviewPromise = (0, async_1.createCancelablePromise)(token => this.doGenerateSyncResourcePreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, merge, userDataSyncConfiguration, token));
                }
                let preview = await this.syncPreviewPromise;
                if (apply && acceptRemote) {
                    this.logService.info(`${this.syncResourceLogLabel}: Accepting remote because it was synced before and the last sync data is not available.`);
                    for (const resourcePreview of preview.resourcePreviews) {
                        preview = (await this.accept(resourcePreview.remoteResource)) || preview;
                    }
                }
                this.updateConflicts(preview.resourcePreviews);
                if (preview.resourcePreviews.some(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */)) {
                    return "hasConflicts" /* SyncStatus.HasConflicts */;
                }
                if (apply) {
                    return await this.doApply(false);
                }
                return "syncing" /* SyncStatus.Syncing */;
            }
            catch (error) {
                // reset preview on error
                this.syncPreviewPromise = null;
                throw error;
            }
        }
        async merge(resource) {
            await this.updateSyncResourcePreview(resource, async (resourcePreview) => {
                const mergeResult = await this.getMergeResult(resourcePreview, cancellation_1.CancellationToken.None);
                await this.fileService.writeFile(resourcePreview.previewResource, buffer_1.VSBuffer.fromString(mergeResult?.content || ''));
                const acceptResult = mergeResult && !mergeResult.hasConflicts
                    ? await this.getAcceptResult(resourcePreview, resourcePreview.previewResource, undefined, cancellation_1.CancellationToken.None)
                    : undefined;
                resourcePreview.acceptResult = acceptResult;
                resourcePreview.mergeState = mergeResult.hasConflicts ? "conflict" /* MergeState.Conflict */ : acceptResult ? "accepted" /* MergeState.Accepted */ : "preview" /* MergeState.Preview */;
                resourcePreview.localChange = acceptResult ? acceptResult.localChange : mergeResult.localChange;
                resourcePreview.remoteChange = acceptResult ? acceptResult.remoteChange : mergeResult.remoteChange;
                return resourcePreview;
            });
            return this.syncPreviewPromise;
        }
        async accept(resource, content) {
            await this.updateSyncResourcePreview(resource, async (resourcePreview) => {
                const acceptResult = await this.getAcceptResult(resourcePreview, resource, content, cancellation_1.CancellationToken.None);
                resourcePreview.acceptResult = acceptResult;
                resourcePreview.mergeState = "accepted" /* MergeState.Accepted */;
                resourcePreview.localChange = acceptResult.localChange;
                resourcePreview.remoteChange = acceptResult.remoteChange;
                return resourcePreview;
            });
            return this.syncPreviewPromise;
        }
        async discard(resource) {
            await this.updateSyncResourcePreview(resource, async (resourcePreview) => {
                const mergeResult = await this.getMergeResult(resourcePreview, cancellation_1.CancellationToken.None);
                await this.fileService.writeFile(resourcePreview.previewResource, buffer_1.VSBuffer.fromString(mergeResult.content || ''));
                resourcePreview.acceptResult = undefined;
                resourcePreview.mergeState = "preview" /* MergeState.Preview */;
                resourcePreview.localChange = mergeResult.localChange;
                resourcePreview.remoteChange = mergeResult.remoteChange;
                return resourcePreview;
            });
            return this.syncPreviewPromise;
        }
        async updateSyncResourcePreview(resource, updateResourcePreview) {
            if (!this.syncPreviewPromise) {
                return;
            }
            let preview = await this.syncPreviewPromise;
            const index = preview.resourcePreviews.findIndex(({ localResource, remoteResource, previewResource }) => this.extUri.isEqual(localResource, resource) || this.extUri.isEqual(remoteResource, resource) || this.extUri.isEqual(previewResource, resource));
            if (index === -1) {
                return;
            }
            this.syncPreviewPromise = (0, async_1.createCancelablePromise)(async (token) => {
                const resourcePreviews = [...preview.resourcePreviews];
                resourcePreviews[index] = await updateResourcePreview(resourcePreviews[index]);
                return {
                    ...preview,
                    resourcePreviews
                };
            });
            preview = await this.syncPreviewPromise;
            this.updateConflicts(preview.resourcePreviews);
            if (preview.resourcePreviews.some(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */)) {
                this.setStatus("hasConflicts" /* SyncStatus.HasConflicts */);
            }
            else {
                this.setStatus("syncing" /* SyncStatus.Syncing */);
            }
        }
        async doApply(force) {
            if (!this.syncPreviewPromise) {
                return "idle" /* SyncStatus.Idle */;
            }
            const preview = await this.syncPreviewPromise;
            // check for conflicts
            if (preview.resourcePreviews.some(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */)) {
                return "hasConflicts" /* SyncStatus.HasConflicts */;
            }
            // check if all are accepted
            if (preview.resourcePreviews.some(({ mergeState }) => mergeState !== "accepted" /* MergeState.Accepted */)) {
                return "syncing" /* SyncStatus.Syncing */;
            }
            // apply preview
            await this.applyResult(preview.remoteUserData, preview.lastSyncUserData, preview.resourcePreviews.map(resourcePreview => ([resourcePreview, resourcePreview.acceptResult])), force);
            // reset preview
            this.syncPreviewPromise = null;
            // reset preview folder
            await this.clearPreviewFolder();
            return "idle" /* SyncStatus.Idle */;
        }
        async clearPreviewFolder() {
            try {
                await this.fileService.del(this.syncPreviewFolder, { recursive: true });
            }
            catch (error) { /* Ignore */ }
        }
        updateConflicts(resourcePreviews) {
            const conflicts = resourcePreviews.filter(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */);
            if (!(0, arrays_1.equals)(this._conflicts, conflicts, (a, b) => this.extUri.isEqual(a.previewResource, b.previewResource))) {
                this._conflicts = conflicts;
                this._onDidChangeConflicts.fire(this.conflicts);
            }
        }
        async hasPreviouslySynced() {
            const lastSyncData = await this.getLastSyncUserData();
            return !!lastSyncData && lastSyncData.syncData !== null /* `null` sync data implies resource is not synced */;
        }
        async resolvePreviewContent(uri) {
            const syncPreview = this.syncPreviewPromise ? await this.syncPreviewPromise : null;
            if (syncPreview) {
                for (const resourcePreview of syncPreview.resourcePreviews) {
                    if (this.extUri.isEqual(resourcePreview.acceptedResource, uri)) {
                        return resourcePreview.acceptResult ? resourcePreview.acceptResult.content : null;
                    }
                    if (this.extUri.isEqual(resourcePreview.remoteResource, uri)) {
                        return resourcePreview.remoteContent;
                    }
                    if (this.extUri.isEqual(resourcePreview.localResource, uri)) {
                        return resourcePreview.localContent;
                    }
                    if (this.extUri.isEqual(resourcePreview.baseResource, uri)) {
                        return resourcePreview.baseContent;
                    }
                }
            }
            return null;
        }
        async resetLocal() {
            this.storageService.remove(this.lastSyncUserDataStateKey, -1 /* StorageScope.APPLICATION */);
            try {
                await this.fileService.del(this.lastSyncResource);
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
            }
        }
        async doGenerateSyncResourcePreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, merge, userDataSyncConfiguration, token) {
            const resourcePreviewResults = await this.generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, userDataSyncConfiguration, token);
            const resourcePreviews = [];
            for (const resourcePreviewResult of resourcePreviewResults) {
                const acceptedResource = resourcePreviewResult.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' });
                /* No change -> Accept */
                if (resourcePreviewResult.localChange === 0 /* Change.None */ && resourcePreviewResult.remoteChange === 0 /* Change.None */) {
                    resourcePreviews.push({
                        ...resourcePreviewResult,
                        acceptedResource,
                        acceptResult: { content: null, localChange: 0 /* Change.None */, remoteChange: 0 /* Change.None */ },
                        mergeState: "accepted" /* MergeState.Accepted */
                    });
                }
                /* Changed -> Apply ? (Merge ? Conflict | Accept) : Preview */
                else {
                    /* Merge */
                    const mergeResult = merge ? await this.getMergeResult(resourcePreviewResult, token) : undefined;
                    if (token.isCancellationRequested) {
                        break;
                    }
                    await this.fileService.writeFile(resourcePreviewResult.previewResource, buffer_1.VSBuffer.fromString(mergeResult?.content || ''));
                    /* Conflict | Accept */
                    const acceptResult = mergeResult && !mergeResult.hasConflicts
                        /* Accept if merged and there are no conflicts */
                        ? await this.getAcceptResult(resourcePreviewResult, resourcePreviewResult.previewResource, undefined, token)
                        : undefined;
                    resourcePreviews.push({
                        ...resourcePreviewResult,
                        acceptResult,
                        mergeState: mergeResult?.hasConflicts ? "conflict" /* MergeState.Conflict */ : acceptResult ? "accepted" /* MergeState.Accepted */ : "preview" /* MergeState.Preview */,
                        localChange: acceptResult ? acceptResult.localChange : mergeResult ? mergeResult.localChange : resourcePreviewResult.localChange,
                        remoteChange: acceptResult ? acceptResult.remoteChange : mergeResult ? mergeResult.remoteChange : resourcePreviewResult.remoteChange
                    });
                }
            }
            return { syncResource: this.resource, profile: this.syncResource.profile, remoteUserData, lastSyncUserData, resourcePreviews, isLastSyncFromCurrentMachine: isRemoteDataFromCurrentMachine };
        }
        async getLastSyncUserData() {
            let storedLastSyncUserDataStateContent = this.getStoredLastSyncUserDataStateContent();
            if (!storedLastSyncUserDataStateContent) {
                storedLastSyncUserDataStateContent = await this.migrateLastSyncUserData();
            }
            // Last Sync Data state does not exist
            if (!storedLastSyncUserDataStateContent) {
                this.logService.info(`${this.syncResourceLogLabel}: Last sync data state does not exist.`);
                return null;
            }
            const lastSyncUserDataState = JSON.parse(storedLastSyncUserDataStateContent);
            const resourceSyncStateVersion = this.userDataSyncEnablementService.getResourceSyncStateVersion(this.resource);
            this.hasSyncResourceStateVersionChanged = !!lastSyncUserDataState.version && !!resourceSyncStateVersion && lastSyncUserDataState.version !== resourceSyncStateVersion;
            if (this.hasSyncResourceStateVersionChanged) {
                this.logService.info(`${this.syncResourceLogLabel}: Reset last sync state because last sync state version ${lastSyncUserDataState.version} is not compatible with current sync state version ${resourceSyncStateVersion}.`);
                await this.resetLocal();
                return null;
            }
            let syncData = undefined;
            // Get Last Sync Data from Local
            let retrial = 1;
            while (syncData === undefined && retrial++ < 6 /* Retry 5 times */) {
                try {
                    const lastSyncStoredRemoteUserData = await this.readLastSyncStoredRemoteUserData();
                    if (lastSyncStoredRemoteUserData) {
                        if (lastSyncStoredRemoteUserData.ref === lastSyncUserDataState.ref) {
                            syncData = lastSyncStoredRemoteUserData.syncData;
                        }
                        else {
                            this.logService.info(`${this.syncResourceLogLabel}: Last sync data stored locally is not same as the last sync state.`);
                        }
                    }
                    break;
                }
                catch (error) {
                    if (error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        this.logService.info(`${this.syncResourceLogLabel}: Last sync resource does not exist locally.`);
                        break;
                    }
                    else if (error instanceof userDataSync_1.UserDataSyncError) {
                        throw error;
                    }
                    else {
                        // log and retry
                        this.logService.error(error, retrial);
                    }
                }
            }
            // Get Last Sync Data from Remote
            if (syncData === undefined) {
                try {
                    const content = await this.userDataSyncStoreService.resolveResourceContent(this.resource, lastSyncUserDataState.ref, this.collection, this.syncHeaders);
                    syncData = content === null ? null : this.parseSyncData(content);
                    await this.writeLastSyncStoredRemoteUserData({ ref: lastSyncUserDataState.ref, syncData });
                }
                catch (error) {
                    if (error instanceof userDataSync_1.UserDataSyncError && error.code === "NotFound" /* UserDataSyncErrorCode.NotFound */) {
                        this.logService.info(`${this.syncResourceLogLabel}: Last sync resource does not exist remotely.`);
                    }
                    else {
                        throw error;
                    }
                }
            }
            // Last Sync Data Not Found
            if (syncData === undefined) {
                return null;
            }
            return {
                ...lastSyncUserDataState,
                syncData,
            };
        }
        async updateLastSyncUserData(lastSyncRemoteUserData, additionalProps = {}) {
            if (additionalProps['ref'] || additionalProps['version']) {
                throw new Error('Cannot have core properties as additional');
            }
            const version = this.userDataSyncEnablementService.getResourceSyncStateVersion(this.resource);
            const lastSyncUserDataState = {
                ref: lastSyncRemoteUserData.ref,
                version,
                ...additionalProps
            };
            this.storageService.store(this.lastSyncUserDataStateKey, JSON.stringify(lastSyncUserDataState), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            await this.writeLastSyncStoredRemoteUserData(lastSyncRemoteUserData);
        }
        getStoredLastSyncUserDataStateContent() {
            return this.storageService.get(this.lastSyncUserDataStateKey, -1 /* StorageScope.APPLICATION */);
        }
        async readLastSyncStoredRemoteUserData() {
            const content = (await this.fileService.readFile(this.lastSyncResource)).value.toString();
            try {
                const lastSyncStoredRemoteUserData = content ? JSON.parse(content) : undefined;
                if (isRemoteUserData(lastSyncStoredRemoteUserData)) {
                    return lastSyncStoredRemoteUserData;
                }
            }
            catch (e) {
                this.logService.error(e);
            }
            return undefined;
        }
        async writeLastSyncStoredRemoteUserData(lastSyncRemoteUserData) {
            await this.fileService.writeFile(this.lastSyncResource, buffer_1.VSBuffer.fromString(JSON.stringify(lastSyncRemoteUserData)));
        }
        async migrateLastSyncUserData() {
            try {
                const content = await this.fileService.readFile(this.lastSyncResource);
                const userData = JSON.parse(content.value.toString());
                await this.fileService.del(this.lastSyncResource);
                if (userData.ref && userData.content !== undefined) {
                    this.storageService.store(this.lastSyncUserDataStateKey, JSON.stringify({
                        ...userData,
                        content: undefined,
                    }), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                    await this.writeLastSyncStoredRemoteUserData({ ref: userData.ref, syncData: userData.content === null ? null : JSON.parse(userData.content) });
                }
                else {
                    this.logService.info(`${this.syncResourceLogLabel}: Migrating last sync user data. Invalid data.`, userData);
                }
            }
            catch (error) {
                if (error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Migrating last sync user data. Resource does not exist.`);
                }
                else {
                    this.logService.error(error);
                }
            }
            return this.storageService.get(this.lastSyncUserDataStateKey, -1 /* StorageScope.APPLICATION */);
        }
        async getRemoteUserData(lastSyncData) {
            const { ref, content } = await this.getUserData(lastSyncData);
            let syncData = null;
            if (content !== null) {
                syncData = this.parseSyncData(content);
            }
            return { ref, syncData };
        }
        parseSyncData(content) {
            try {
                const syncData = JSON.parse(content);
                if (isSyncData(syncData)) {
                    return syncData;
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            throw new userDataSync_1.UserDataSyncError((0, nls_1.localize)('incompatible sync data', "Cannot parse sync data as it is not compatible with the current version."), "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */, this.resource);
        }
        async getUserData(lastSyncData) {
            const lastSyncUserData = lastSyncData ? { ref: lastSyncData.ref, content: lastSyncData.syncData ? JSON.stringify(lastSyncData.syncData) : null } : null;
            return this.userDataSyncStoreService.readResource(this.resource, lastSyncUserData, this.collection, this.syncHeaders);
        }
        async updateRemoteUserData(content, ref) {
            const machineId = await this.currentMachineIdPromise;
            const syncData = { version: this.version, machineId, content };
            try {
                ref = await this.userDataSyncStoreService.writeResource(this.resource, JSON.stringify(syncData), ref, this.collection, this.syncHeaders);
                return { ref, syncData };
            }
            catch (error) {
                if (error instanceof userDataSync_1.UserDataSyncError && error.code === "TooLarge" /* UserDataSyncErrorCode.TooLarge */) {
                    error = new userDataSync_1.UserDataSyncError(error.message, error.code, this.resource);
                }
                throw error;
            }
        }
        async backupLocal(content) {
            const syncData = { version: this.version, content };
            return this.userDataSyncLocalStoreService.writeResource(this.resource, JSON.stringify(syncData), new Date(), this.syncResource.profile.isDefault ? undefined : this.syncResource.profile.id);
        }
        async stop() {
            if (this.status === "idle" /* SyncStatus.Idle */) {
                return;
            }
            this.logService.trace(`${this.syncResourceLogLabel}: Stopping synchronizing ${this.resource.toLowerCase()}.`);
            if (this.syncPreviewPromise) {
                this.syncPreviewPromise.cancel();
                this.syncPreviewPromise = null;
            }
            this.updateConflicts([]);
            await this.clearPreviewFolder();
            this.setStatus("idle" /* SyncStatus.Idle */);
            this.logService.info(`${this.syncResourceLogLabel}: Stopped synchronizing ${this.resource.toLowerCase()}.`);
        }
        getUserDataSyncConfiguration() {
            return this.configurationService.getValue(userDataSync_1.USER_DATA_SYNC_CONFIGURATION_SCOPE);
        }
    };
    exports.AbstractSynchroniser = AbstractSynchroniser;
    exports.AbstractSynchroniser = AbstractSynchroniser = __decorate([
        __param(2, files_1.IFileService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, storage_1.IStorageService),
        __param(5, userDataSync_1.IUserDataSyncStoreService),
        __param(6, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, userDataSync_1.IUserDataSyncLogService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, uriIdentity_1.IUriIdentityService)
    ], AbstractSynchroniser);
    let AbstractFileSynchroniser = class AbstractFileSynchroniser extends AbstractSynchroniser {
        constructor(file, syncResource, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService) {
            super(syncResource, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.file = file;
            this._register(this.fileService.watch(this.extUri.dirname(file)));
            this._register(this.fileService.onDidFilesChange(e => this.onFileChanges(e)));
        }
        async getLocalFileContent() {
            try {
                return await this.fileService.readFile(this.file);
            }
            catch (error) {
                return null;
            }
        }
        async updateLocalFileContent(newContent, oldContent, force) {
            try {
                if (oldContent) {
                    // file exists already
                    await this.fileService.writeFile(this.file, buffer_1.VSBuffer.fromString(newContent), force ? undefined : oldContent);
                }
                else {
                    // file does not exist
                    await this.fileService.createFile(this.file, buffer_1.VSBuffer.fromString(newContent), { overwrite: force });
                }
            }
            catch (e) {
                if ((e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) ||
                    (e instanceof files_1.FileOperationError && e.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */)) {
                    throw new userDataSync_1.UserDataSyncError(e.message, "LocalPreconditionFailed" /* UserDataSyncErrorCode.LocalPreconditionFailed */);
                }
                else {
                    throw e;
                }
            }
        }
        async deleteLocalFile() {
            try {
                await this.fileService.del(this.file);
            }
            catch (e) {
                if (!(e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    throw e;
                }
            }
        }
        onFileChanges(e) {
            if (!e.contains(this.file)) {
                return;
            }
            this.triggerLocalChange();
        }
    };
    exports.AbstractFileSynchroniser = AbstractFileSynchroniser;
    exports.AbstractFileSynchroniser = AbstractFileSynchroniser = __decorate([
        __param(3, files_1.IFileService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, storage_1.IStorageService),
        __param(6, userDataSync_1.IUserDataSyncStoreService),
        __param(7, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(8, userDataSync_1.IUserDataSyncEnablementService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, userDataSync_1.IUserDataSyncLogService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, uriIdentity_1.IUriIdentityService)
    ], AbstractFileSynchroniser);
    let AbstractJsonFileSynchroniser = class AbstractJsonFileSynchroniser extends AbstractFileSynchroniser {
        constructor(file, syncResource, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, userDataSyncUtilService, configurationService, uriIdentityService) {
            super(file, syncResource, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.userDataSyncUtilService = userDataSyncUtilService;
            this._formattingOptions = undefined;
        }
        hasErrors(content, isArray) {
            const parseErrors = [];
            const result = (0, json_1.parse)(content, parseErrors, { allowEmptyContent: true, allowTrailingComma: true });
            return parseErrors.length > 0 || (!(0, types_1.isUndefined)(result) && isArray !== Array.isArray(result));
        }
        getFormattingOptions() {
            if (!this._formattingOptions) {
                this._formattingOptions = this.userDataSyncUtilService.resolveFormattingOptions(this.file);
            }
            return this._formattingOptions;
        }
    };
    exports.AbstractJsonFileSynchroniser = AbstractJsonFileSynchroniser;
    exports.AbstractJsonFileSynchroniser = AbstractJsonFileSynchroniser = __decorate([
        __param(3, files_1.IFileService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, storage_1.IStorageService),
        __param(6, userDataSync_1.IUserDataSyncStoreService),
        __param(7, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(8, userDataSync_1.IUserDataSyncEnablementService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, userDataSync_1.IUserDataSyncLogService),
        __param(11, userDataSync_1.IUserDataSyncUtilService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, uriIdentity_1.IUriIdentityService)
    ], AbstractJsonFileSynchroniser);
    let AbstractInitializer = class AbstractInitializer {
        constructor(resource, userDataProfilesService, environmentService, logService, fileService, storageService, uriIdentityService) {
            this.resource = resource;
            this.userDataProfilesService = userDataProfilesService;
            this.environmentService = environmentService;
            this.logService = logService;
            this.fileService = fileService;
            this.storageService = storageService;
            this.extUri = uriIdentityService.extUri;
            this.lastSyncResource = (0, userDataSync_1.getLastSyncResourceUri)(undefined, this.resource, environmentService, this.extUri);
        }
        async initialize({ ref, content }) {
            if (!content) {
                this.logService.info('Remote content does not exist.', this.resource);
                return;
            }
            const syncData = this.parseSyncData(content);
            if (!syncData) {
                return;
            }
            try {
                await this.doInitialize({ ref, syncData });
            }
            catch (error) {
                this.logService.error(error);
            }
        }
        parseSyncData(content) {
            try {
                const syncData = JSON.parse(content);
                if (isSyncData(syncData)) {
                    return syncData;
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            this.logService.info('Cannot parse sync data as it is not compatible with the current version.', this.resource);
            return undefined;
        }
        async updateLastSyncUserData(lastSyncRemoteUserData, additionalProps = {}) {
            if (additionalProps['ref'] || additionalProps['version']) {
                throw new Error('Cannot have core properties as additional');
            }
            const lastSyncUserDataState = {
                ref: lastSyncRemoteUserData.ref,
                version: undefined,
                ...additionalProps
            };
            this.storageService.store(`${this.resource}.lastSyncUserData`, JSON.stringify(lastSyncUserDataState), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            await this.fileService.writeFile(this.lastSyncResource, buffer_1.VSBuffer.fromString(JSON.stringify(lastSyncRemoteUserData)));
        }
    };
    exports.AbstractInitializer = AbstractInitializer;
    exports.AbstractInitializer = AbstractInitializer = __decorate([
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, log_1.ILogService),
        __param(4, files_1.IFileService),
        __param(5, storage_1.IStorageService),
        __param(6, uriIdentity_1.IUriIdentityService)
    ], AbstractInitializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RTeW5jaHJvbml6ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvY29tbW9uL2Fic3RyYWN0U3luY2hyb25pemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtDaEcsNENBUUM7SUFFRCxnQ0FpQkM7SUFFRCwwREFFQztJQS9CRCxTQUFnQixnQkFBZ0IsQ0FBQyxLQUFVO1FBQzFDLElBQUksS0FBSztlQUNMLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxTQUFTLElBQUksT0FBTyxLQUFLLENBQUMsR0FBRyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQztlQUM5RSxDQUFDLEtBQUssQ0FBQyxRQUFRLEtBQUssU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsS0FBSyxJQUFJLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUMvRixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFnQixVQUFVLENBQUMsS0FBVTtRQUNwQyxJQUFJLEtBQUs7ZUFDTCxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssU0FBUyxJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUM7ZUFDbEUsQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLFNBQVMsSUFBSSxPQUFPLEtBQUssQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUV4RSx5QkFBeUI7WUFDekIsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FB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