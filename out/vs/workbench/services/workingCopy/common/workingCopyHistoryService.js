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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/types", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyHistoryTracker", "vs/base/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/platform/files/common/files", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/uri", "vs/base/common/async", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService", "vs/base/common/hash", "vs/base/common/extpath", "vs/base/common/cancellation", "vs/base/common/map", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/label/common/label", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/workbench/common/editor", "vs/platform/configuration/common/configuration", "vs/base/common/arrays", "vs/base/common/strings"], function (require, exports, nls_1, event_1, types_1, platform_1, contributions_1, lifecycle_1, workingCopyHistoryTracker_1, lifecycle_2, workingCopyHistory_1, files_1, remoteAgentService_1, uri_1, async_1, resources_1, environmentService_1, hash_1, extpath_1, cancellation_1, map_1, uriIdentity_1, label_1, buffer_1, log_1, editor_1, configuration_1, arrays_1, strings_1) {
    "use strict";
    var WorkingCopyHistoryService_1, NativeWorkingCopyHistoryService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkingCopyHistoryService = exports.WorkingCopyHistoryService = exports.WorkingCopyHistoryModel = void 0;
    class WorkingCopyHistoryModel {
        static { this.ENTRIES_FILE = 'entries.json'; }
        static { this.FILE_SAVED_SOURCE = editor_1.SaveSourceRegistry.registerSource('default.source', (0, nls_1.localize)('default.source', "File Saved")); }
        static { this.SETTINGS = {
            MAX_ENTRIES: 'workbench.localHistory.maxFileEntries',
            MERGE_PERIOD: 'workbench.localHistory.mergeWindow'
        }; }
        constructor(workingCopyResource, historyHome, entryAddedEmitter, entryChangedEmitter, entryReplacedEmitter, entryRemovedEmitter, options, fileService, labelService, logService, configurationService) {
            this.historyHome = historyHome;
            this.entryAddedEmitter = entryAddedEmitter;
            this.entryChangedEmitter = entryChangedEmitter;
            this.entryReplacedEmitter = entryReplacedEmitter;
            this.entryRemovedEmitter = entryRemovedEmitter;
            this.options = options;
            this.fileService = fileService;
            this.labelService = labelService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.entries = [];
            this.whenResolved = undefined;
            this.workingCopyResource = undefined;
            this.workingCopyName = undefined;
            this.historyEntriesFolder = undefined;
            this.historyEntriesListingFile = undefined;
            this.historyEntriesNameMatcher = undefined;
            this.versionId = 0;
            this.storedVersionId = this.versionId;
            this.storeLimiter = new async_1.Limiter(1);
            this.setWorkingCopy(workingCopyResource);
        }
        setWorkingCopy(workingCopyResource) {
            // Update working copy
            this.workingCopyResource = workingCopyResource;
            this.workingCopyName = this.labelService.getUriBasenameLabel(workingCopyResource);
            this.historyEntriesNameMatcher = new RegExp(`[A-Za-z0-9]{4}${(0, strings_1.escapeRegExpCharacters)((0, resources_1.extname)(workingCopyResource))}`);
            // Update locations
            this.historyEntriesFolder = this.toHistoryEntriesFolder(this.historyHome, workingCopyResource);
            this.historyEntriesListingFile = (0, resources_1.joinPath)(this.historyEntriesFolder, WorkingCopyHistoryModel.ENTRIES_FILE);
            // Reset entries and resolved cache
            this.entries = [];
            this.whenResolved = undefined;
        }
        toHistoryEntriesFolder(historyHome, workingCopyResource) {
            return (0, resources_1.joinPath)(historyHome, (0, hash_1.hash)(workingCopyResource.toString()).toString(16));
        }
        async addEntry(source = WorkingCopyHistoryModel.FILE_SAVED_SOURCE, timestamp = Date.now(), token) {
            let entryToReplace = undefined;
            // Figure out if the last entry should be replaced based
            // on settings that can define a interval for when an
            // entry is not added as new entry but should replace.
            // However, when save source is different, never replace.
            const lastEntry = (0, arrays_1.lastOrDefault)(this.entries);
            if (lastEntry && lastEntry.source === source) {
                const configuredReplaceInterval = this.configurationService.getValue(WorkingCopyHistoryModel.SETTINGS.MERGE_PERIOD, { resource: this.workingCopyResource });
                if (timestamp - lastEntry.timestamp <= (configuredReplaceInterval * 1000 /* convert to millies */)) {
                    entryToReplace = lastEntry;
                }
            }
            let entry;
            // Replace lastest entry in history
            if (entryToReplace) {
                entry = await this.doReplaceEntry(entryToReplace, timestamp, token);
            }
            // Add entry to history
            else {
                entry = await this.doAddEntry(source, timestamp, token);
            }
            // Flush now if configured
            if (this.options.flushOnChange && !token.isCancellationRequested) {
                await this.store(token);
            }
            return entry;
        }
        async doAddEntry(source, timestamp, token) {
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            const workingCopyName = (0, types_1.assertIsDefined)(this.workingCopyName);
            const historyEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            // Perform a fast clone operation with minimal overhead to a new random location
            const id = `${(0, extpath_1.randomPath)(undefined, undefined, 4)}${(0, resources_1.extname)(workingCopyResource)}`;
            const location = (0, resources_1.joinPath)(historyEntriesFolder, id);
            await this.fileService.cloneFile(workingCopyResource, location);
            // Add to list of entries
            const entry = {
                id,
                workingCopy: { resource: workingCopyResource, name: workingCopyName },
                location,
                timestamp,
                source
            };
            this.entries.push(entry);
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryAddedEmitter.fire({ entry });
            return entry;
        }
        async doReplaceEntry(entry, timestamp, token) {
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            // Perform a fast clone operation with minimal overhead to the existing location
            await this.fileService.cloneFile(workingCopyResource, entry.location);
            // Update entry
            entry.timestamp = timestamp;
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryReplacedEmitter.fire({ entry });
            return entry;
        }
        async removeEntry(entry, token) {
            // Make sure to await resolving when removing entries
            await this.resolveEntriesOnce();
            if (token.isCancellationRequested) {
                return false;
            }
            const index = this.entries.indexOf(entry);
            if (index === -1) {
                return false;
            }
            // Delete from disk
            await this.deleteEntry(entry);
            // Remove from model
            this.entries.splice(index, 1);
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryRemovedEmitter.fire({ entry });
            // Flush now if configured
            if (this.options.flushOnChange && !token.isCancellationRequested) {
                await this.store(token);
            }
            return true;
        }
        async updateEntry(entry, properties, token) {
            // Make sure to await resolving when updating entries
            await this.resolveEntriesOnce();
            if (token.isCancellationRequested) {
                return;
            }
            const index = this.entries.indexOf(entry);
            if (index === -1) {
                return;
            }
            // Update entry
            entry.source = properties.source;
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryChangedEmitter.fire({ entry });
            // Flush now if configured
            if (this.options.flushOnChange && !token.isCancellationRequested) {
                await this.store(token);
            }
        }
        async getEntries() {
            // Make sure to await resolving when all entries are asked for
            await this.resolveEntriesOnce();
            // Return as many entries as configured by user settings
            const configuredMaxEntries = this.configurationService.getValue(WorkingCopyHistoryModel.SETTINGS.MAX_ENTRIES, { resource: this.workingCopyResource });
            if (this.entries.length > configuredMaxEntries) {
                return this.entries.slice(this.entries.length - configuredMaxEntries);
            }
            return this.entries;
        }
        async hasEntries(skipResolve) {
            // Make sure to await resolving unless explicitly skipped
            if (!skipResolve) {
                await this.resolveEntriesOnce();
            }
            return this.entries.length > 0;
        }
        resolveEntriesOnce() {
            if (!this.whenResolved) {
                this.whenResolved = this.doResolveEntries();
            }
            return this.whenResolved;
        }
        async doResolveEntries() {
            // Resolve from disk
            const entries = await this.resolveEntriesFromDisk();
            // We now need to merge our in-memory entries with the
            // entries we have found on disk because it is possible
            // that new entries have been added before the entries
            // listing file was updated
            for (const entry of this.entries) {
                entries.set(entry.id, entry);
            }
            // Set as entries, sorted by timestamp
            this.entries = Array.from(entries.values()).sort((entryA, entryB) => entryA.timestamp - entryB.timestamp);
        }
        async resolveEntriesFromDisk() {
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            const workingCopyName = (0, types_1.assertIsDefined)(this.workingCopyName);
            const [entryListing, entryStats] = await Promise.all([
                // Resolve entries listing file
                this.readEntriesFile(),
                // Resolve children of history folder
                this.readEntriesFolder()
            ]);
            // Add from raw folder children
            const entries = new Map();
            if (entryStats) {
                for (const entryStat of entryStats) {
                    entries.set(entryStat.name, {
                        id: entryStat.name,
                        workingCopy: { resource: workingCopyResource, name: workingCopyName },
                        location: entryStat.resource,
                        timestamp: entryStat.mtime,
                        source: WorkingCopyHistoryModel.FILE_SAVED_SOURCE
                    });
                }
            }
            // Update from listing (to have more specific metadata)
            if (entryListing) {
                for (const entry of entryListing.entries) {
                    const existingEntry = entries.get(entry.id);
                    if (existingEntry) {
                        entries.set(entry.id, {
                            ...existingEntry,
                            timestamp: entry.timestamp,
                            source: entry.source ?? existingEntry.source
                        });
                    }
                }
            }
            return entries;
        }
        async moveEntries(targetWorkingCopyResource, source, token) {
            // Ensure model stored so that any pending data is flushed
            await this.store(token);
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Rename existing entries folder
            const sourceHistoryEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            const targetHistoryFolder = this.toHistoryEntriesFolder(this.historyHome, targetWorkingCopyResource);
            try {
                await this.fileService.move(sourceHistoryEntriesFolder, targetHistoryFolder, true);
            }
            catch (error) {
                if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    this.traceError(error);
                }
            }
            // Update our associated working copy
            this.setWorkingCopy(targetWorkingCopyResource);
            // Add entry for the move
            await this.addEntry(source, undefined, token);
            // Store model again to updated location
            await this.store(token);
        }
        async store(token) {
            if (!this.shouldStore()) {
                return;
            }
            // Use a `Limiter` to prevent multiple `store` operations
            // potentially running at the same time
            await this.storeLimiter.queue(async () => {
                if (token.isCancellationRequested || !this.shouldStore()) {
                    return;
                }
                return this.doStore(token);
            });
        }
        shouldStore() {
            return this.storedVersionId !== this.versionId;
        }
        async doStore(token) {
            const historyEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            // Make sure to await resolving when persisting
            await this.resolveEntriesOnce();
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Cleanup based on max-entries setting
            await this.cleanUpEntries();
            // Without entries, remove the history folder
            const storedVersion = this.versionId;
            if (this.entries.length === 0) {
                try {
                    await this.fileService.del(historyEntriesFolder, { recursive: true });
                }
                catch (error) {
                    this.traceError(error);
                }
            }
            // If we still have entries, update the entries meta file
            else {
                await this.writeEntriesFile();
            }
            // Mark as stored version
            this.storedVersionId = storedVersion;
        }
        async cleanUpEntries() {
            const configuredMaxEntries = this.configurationService.getValue(WorkingCopyHistoryModel.SETTINGS.MAX_ENTRIES, { resource: this.workingCopyResource });
            if (this.entries.length <= configuredMaxEntries) {
                return; // nothing to cleanup
            }
            const entriesToDelete = this.entries.slice(0, this.entries.length - configuredMaxEntries);
            const entriesToKeep = this.entries.slice(this.entries.length - configuredMaxEntries);
            // Delete entries from disk as instructed
            for (const entryToDelete of entriesToDelete) {
                await this.deleteEntry(entryToDelete);
            }
            // Make sure to update our in-memory model as well
            // because it will be persisted right after
            this.entries = entriesToKeep;
            // Events
            for (const entry of entriesToDelete) {
                this.entryRemovedEmitter.fire({ entry });
            }
        }
        async deleteEntry(entry) {
            try {
                await this.fileService.del(entry.location);
            }
            catch (error) {
                this.traceError(error);
            }
        }
        async writeEntriesFile() {
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            const historyEntriesListingFile = (0, types_1.assertIsDefined)(this.historyEntriesListingFile);
            const serializedModel = {
                version: 1,
                resource: workingCopyResource.toString(),
                entries: this.entries.map(entry => {
                    return {
                        id: entry.id,
                        source: entry.source !== WorkingCopyHistoryModel.FILE_SAVED_SOURCE ? entry.source : undefined,
                        timestamp: entry.timestamp
                    };
                })
            };
            await this.fileService.writeFile(historyEntriesListingFile, buffer_1.VSBuffer.fromString(JSON.stringify(serializedModel)));
        }
        async readEntriesFile() {
            const historyEntriesListingFile = (0, types_1.assertIsDefined)(this.historyEntriesListingFile);
            let serializedModel = undefined;
            try {
                serializedModel = JSON.parse((await this.fileService.readFile(historyEntriesListingFile)).value.toString());
            }
            catch (error) {
                if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    this.traceError(error);
                }
            }
            return serializedModel;
        }
        async readEntriesFolder() {
            const historyEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            const historyEntriesNameMatcher = (0, types_1.assertIsDefined)(this.historyEntriesNameMatcher);
            let rawEntries = undefined;
            // Resolve children of folder on disk
            try {
                rawEntries = (await this.fileService.resolve(historyEntriesFolder, { resolveMetadata: true })).children;
            }
            catch (error) {
                if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    this.traceError(error);
                }
            }
            if (!rawEntries) {
                return undefined;
            }
            // Skip entries that do not seem to have valid file name
            return rawEntries.filter(entry => !(0, resources_1.isEqual)(entry.resource, this.historyEntriesListingFile) && // not the listings file
                historyEntriesNameMatcher.test(entry.name) // matching our expected file pattern for entries
            );
        }
        traceError(error) {
            this.logService.trace('[Working Copy History Service]', error);
        }
    }
    exports.WorkingCopyHistoryModel = WorkingCopyHistoryModel;
    let WorkingCopyHistoryService = class WorkingCopyHistoryService extends lifecycle_2.Disposable {
        static { WorkingCopyHistoryService_1 = this; }
        static { this.FILE_MOVED_SOURCE = editor_1.SaveSourceRegistry.registerSource('moved.source', (0, nls_1.localize)('moved.source', "File Moved")); }
        static { this.FILE_RENAMED_SOURCE = editor_1.SaveSourceRegistry.registerSource('renamed.source', (0, nls_1.localize)('renamed.source', "File Renamed")); }
        constructor(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, logService, configurationService) {
            super();
            this.fileService = fileService;
            this.remoteAgentService = remoteAgentService;
            this.environmentService = environmentService;
            this.uriIdentityService = uriIdentityService;
            this.labelService = labelService;
            this.logService = logService;
            this.configurationService = configurationService;
            this._onDidAddEntry = this._register(new event_1.Emitter());
            this.onDidAddEntry = this._onDidAddEntry.event;
            this._onDidChangeEntry = this._register(new event_1.Emitter());
            this.onDidChangeEntry = this._onDidChangeEntry.event;
            this._onDidReplaceEntry = this._register(new event_1.Emitter());
            this.onDidReplaceEntry = this._onDidReplaceEntry.event;
            this._onDidMoveEntries = this._register(new event_1.Emitter());
            this.onDidMoveEntries = this._onDidMoveEntries.event;
            this._onDidRemoveEntry = this._register(new event_1.Emitter());
            this.onDidRemoveEntry = this._onDidRemoveEntry.event;
            this._onDidRemoveEntries = this._register(new event_1.Emitter());
            this.onDidRemoveEntries = this._onDidRemoveEntries.event;
            this.localHistoryHome = new async_1.DeferredPromise();
            this.models = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.resolveLocalHistoryHome();
        }
        async resolveLocalHistoryHome() {
            let historyHome = undefined;
            // Prefer history to be stored in the remote if we are connected to a remote
            try {
                const remoteEnv = await this.remoteAgentService.getEnvironment();
                if (remoteEnv) {
                    historyHome = remoteEnv.localHistoryHome;
                }
            }
            catch (error) {
                this.logService.trace(error); // ignore and fallback to local
            }
            // But fallback to local if there is no remote
            if (!historyHome) {
                historyHome = this.environmentService.localHistoryHome;
            }
            this.localHistoryHome.complete(historyHome);
        }
        async moveEntries(source, target) {
            const limiter = new async_1.Limiter(workingCopyHistory_1.MAX_PARALLEL_HISTORY_IO_OPS);
            const promises = [];
            for (const [resource, model] of this.models) {
                if (!this.uriIdentityService.extUri.isEqualOrParent(resource, source)) {
                    continue; // model does not match moved resource
                }
                // Determine new resulting target resource
                let targetResource;
                if (this.uriIdentityService.extUri.isEqual(source, resource)) {
                    targetResource = target; // file got moved
                }
                else {
                    const index = (0, extpath_1.indexOfPath)(resource.path, source.path);
                    targetResource = (0, resources_1.joinPath)(target, resource.path.substr(index + source.path.length + 1)); // parent folder got moved
                }
                // Figure out save source
                let saveSource;
                if (this.uriIdentityService.extUri.isEqual((0, resources_1.dirname)(resource), (0, resources_1.dirname)(targetResource))) {
                    saveSource = WorkingCopyHistoryService_1.FILE_RENAMED_SOURCE;
                }
                else {
                    saveSource = WorkingCopyHistoryService_1.FILE_MOVED_SOURCE;
                }
                // Move entries to target queued
                promises.push(limiter.queue(() => this.doMoveEntries(model, saveSource, resource, targetResource)));
            }
            if (!promises.length) {
                return [];
            }
            // Await move operations
            const resources = await Promise.all(promises);
            // Events
            this._onDidMoveEntries.fire();
            return resources;
        }
        async doMoveEntries(model, source, sourceWorkingCopyResource, targetWorkingCopyResource) {
            // Move to target via model
            await model.moveEntries(targetWorkingCopyResource, source, cancellation_1.CancellationToken.None);
            // Update model in our map
            this.models.delete(sourceWorkingCopyResource);
            this.models.set(targetWorkingCopyResource, model);
            return targetWorkingCopyResource;
        }
        async addEntry({ resource, source, timestamp }, token) {
            if (!this.fileService.hasProvider(resource)) {
                return undefined; // we require the working copy resource to be file service accessible
            }
            // Resolve history model for working copy
            const model = await this.getModel(resource);
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Add to model
            return model.addEntry(source, timestamp, token);
        }
        async updateEntry(entry, properties, token) {
            // Resolve history model for working copy
            const model = await this.getModel(entry.workingCopy.resource);
            if (token.isCancellationRequested) {
                return;
            }
            // Rename in model
            return model.updateEntry(entry, properties, token);
        }
        async removeEntry(entry, token) {
            // Resolve history model for working copy
            const model = await this.getModel(entry.workingCopy.resource);
            if (token.isCancellationRequested) {
                return false;
            }
            // Remove from model
            return model.removeEntry(entry, token);
        }
        async removeAll(token) {
            const historyHome = await this.localHistoryHome.p;
            if (token.isCancellationRequested) {
                return;
            }
            // Clear models
            this.models.clear();
            // Remove from disk
            await this.fileService.del(historyHome, { recursive: true });
            // Events
            this._onDidRemoveEntries.fire();
        }
        async getEntries(resource, token) {
            const model = await this.getModel(resource);
            if (token.isCancellationRequested) {
                return [];
            }
            const entries = await model.getEntries();
            return entries ?? [];
        }
        async getAll(token) {
            const historyHome = await this.localHistoryHome.p;
            if (token.isCancellationRequested) {
                return [];
            }
            const all = new map_1.ResourceMap();
            // Fill in all known model resources (they might not have yet persisted to disk)
            for (const [resource, model] of this.models) {
                const hasInMemoryEntries = await model.hasEntries(true /* skip resolving because we resolve below from disk */);
                if (hasInMemoryEntries) {
                    all.set(resource, true);
                }
            }
            // Resolve all other resources by iterating the history home folder
            try {
                const resolvedHistoryHome = await this.fileService.resolve(historyHome);
                if (resolvedHistoryHome.children) {
                    const limiter = new async_1.Limiter(workingCopyHistory_1.MAX_PARALLEL_HISTORY_IO_OPS);
                    const promises = [];
                    for (const child of resolvedHistoryHome.children) {
                        promises.push(limiter.queue(async () => {
                            if (token.isCancellationRequested) {
                                return;
                            }
                            try {
                                const serializedModel = JSON.parse((await this.fileService.readFile((0, resources_1.joinPath)(child.resource, WorkingCopyHistoryModel.ENTRIES_FILE))).value.toString());
                                if (serializedModel.entries.length > 0) {
                                    all.set(uri_1.URI.parse(serializedModel.resource), true);
                                }
                            }
                            catch (error) {
                                // ignore - model might be missing or corrupt, but we need it
                            }
                        }));
                    }
                    await Promise.all(promises);
                }
            }
            catch (error) {
                // ignore - history might be entirely empty
            }
            return Array.from(all.keys());
        }
        async getModel(resource) {
            const historyHome = await this.localHistoryHome.p;
            let model = this.models.get(resource);
            if (!model) {
                model = new WorkingCopyHistoryModel(resource, historyHome, this._onDidAddEntry, this._onDidChangeEntry, this._onDidReplaceEntry, this._onDidRemoveEntry, this.getModelOptions(), this.fileService, this.labelService, this.logService, this.configurationService);
                this.models.set(resource, model);
            }
            return model;
        }
    };
    exports.WorkingCopyHistoryService = WorkingCopyHistoryService;
    exports.WorkingCopyHistoryService = WorkingCopyHistoryService = WorkingCopyHistoryService_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, label_1.ILabelService),
        __param(5, log_1.ILogService),
        __param(6, configuration_1.IConfigurationService)
    ], WorkingCopyHistoryService);
    let NativeWorkingCopyHistoryService = class NativeWorkingCopyHistoryService extends WorkingCopyHistoryService {
        static { NativeWorkingCopyHistoryService_1 = this; }
        static { this.STORE_ALL_INTERVAL = 5 * 60 * 1000; } // 5min
        constructor(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, lifecycleService, logService, configurationService) {
            super(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, logService, configurationService);
            this.lifecycleService = lifecycleService;
            this.isRemotelyStored = typeof this.environmentService.remoteAuthority === 'string';
            this.storeAllCts = this._register(new cancellation_1.CancellationTokenSource());
            this.storeAllScheduler = this._register(new async_1.RunOnceScheduler(() => this.storeAll(this.storeAllCts.token), NativeWorkingCopyHistoryService_1.STORE_ALL_INTERVAL));
            this.registerListeners();
        }
        registerListeners() {
            if (!this.isRemotelyStored) {
                // Local: persist all on shutdown
                this._register(this.lifecycleService.onWillShutdown(e => this.onWillShutdown(e)));
                // Local: schedule persist on change
                this._register(event_1.Event.any(this.onDidAddEntry, this.onDidChangeEntry, this.onDidReplaceEntry, this.onDidRemoveEntry)(() => this.onDidChangeModels()));
            }
        }
        getModelOptions() {
            return { flushOnChange: this.isRemotelyStored /* because the connection might drop anytime */ };
        }
        onWillShutdown(e) {
            // Dispose the scheduler...
            this.storeAllScheduler.dispose();
            this.storeAllCts.dispose(true);
            // ...because we now explicitly store all models
            e.join(this.storeAll(e.token), { id: 'join.workingCopyHistory', label: (0, nls_1.localize)('join.workingCopyHistory', "Saving local history") });
        }
        onDidChangeModels() {
            if (!this.storeAllScheduler.isScheduled()) {
                this.storeAllScheduler.schedule();
            }
        }
        async storeAll(token) {
            const limiter = new async_1.Limiter(workingCopyHistory_1.MAX_PARALLEL_HISTORY_IO_OPS);
            const promises = [];
            const models = Array.from(this.models.values());
            for (const model of models) {
                promises.push(limiter.queue(async () => {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    try {
                        await model.store(token);
                    }
                    catch (error) {
                        this.logService.trace(error);
                    }
                }));
            }
            await Promise.all(promises);
        }
    };
    exports.NativeWorkingCopyHistoryService = NativeWorkingCopyHistoryService;
    exports.NativeWorkingCopyHistoryService = NativeWorkingCopyHistoryService = NativeWorkingCopyHistoryService_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, label_1.ILabelService),
        __param(5, lifecycle_1.ILifecycleService),
        __param(6, log_1.ILogService),
        __param(7, configuration_1.IConfigurationService)
    ], NativeWorkingCopyHistoryService);
    // Register History Tracker
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(workingCopyHistoryTracker_1.WorkingCopyHistoryTracker, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlIaXN0b3J5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3JraW5nQ29weS9jb21tb24vd29ya2luZ0NvcHlIaXN0b3J5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBcURoRyxNQUFhLHVCQUF1QjtpQkFFbkIsaUJBQVksR0FBRyxjQUFjLEFBQWpCLENBQWtCO2lCQUV0QixzQkFBaUIsR0FBRywyQkFBa0IsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLENBQUMsQUFBaEcsQ0FBaUc7aUJBRWxILGFBQVEsR0FBRztZQUNsQyxXQUFXLEVBQUUsdUNBQXVDO1lBQ3BELFlBQVksRUFBRSxvQ0FBb0M7U0FDbEQsQUFIK0IsQ0FHOUI7UUFtQkYsWUFDQyxtQkFBd0IsRUFDUCxXQUFnQixFQUNoQixpQkFBb0QsRUFDcEQsbUJBQXNELEVBQ3RELG9CQUF1RCxFQUN2RCxtQkFBc0QsRUFDdEQsT0FBd0MsRUFDeEMsV0FBeUIsRUFDekIsWUFBMkIsRUFDM0IsVUFBdUIsRUFDdkIsb0JBQTJDO1lBVDNDLGdCQUFXLEdBQVgsV0FBVyxDQUFLO1lBQ2hCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUM7WUFDcEQsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFtQztZQUN0RCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQW1DO1lBQ3ZELHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBbUM7WUFDdEQsWUFBTyxHQUFQLE9BQU8sQ0FBaUM7WUFDeEMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDekIsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDM0IsZUFBVSxHQUFWLFVB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