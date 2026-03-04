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
define(["require", "exports", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/arrays", "vs/base/common/objects", "vs/base/common/async", "vs/platform/files/common/files", "vs/base/common/map", "vs/base/common/stream", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/network", "vs/base/common/hash", "vs/base/common/types", "vs/workbench/services/workingCopy/common/workingCopy"], function (require, exports, resources_1, uri_1, arrays_1, objects_1, async_1, files_1, map_1, stream_1, buffer_1, lifecycle_1, log_1, network_1, hash_1, types_1, workingCopy_1) {
    "use strict";
    var WorkingCopyBackupServiceImpl_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryWorkingCopyBackupService = exports.WorkingCopyBackupService = exports.WorkingCopyBackupsModel = void 0;
    exports.hashIdentifier = hashIdentifier;
    class WorkingCopyBackupsModel {
        static async create(backupRoot, fileService) {
            const model = new WorkingCopyBackupsModel(backupRoot, fileService);
            await model.resolve();
            return model;
        }
        constructor(backupRoot, fileService) {
            this.backupRoot = backupRoot;
            this.fileService = fileService;
            this.cache = new map_1.ResourceMap();
        }
        async resolve() {
            try {
                const backupRootStat = await this.fileService.resolve(this.backupRoot);
                if (backupRootStat.children) {
                    await async_1.Promises.settled(backupRootStat.children
                        .filter(child => child.isDirectory)
                        .map(async (backupSchemaFolder) => {
                        // Read backup directory for backups
                        const backupSchemaFolderStat = await this.fileService.resolve(backupSchemaFolder.resource);
                        // Remember known backups in our caches
                        //
                        // Note: this does NOT account for resolving
                        // associated meta data because that requires
                        // opening the backup and reading the meta
                        // preamble. Instead, when backups are actually
                        // resolved, the meta data will be added via
                        // additional `update` calls.
                        if (backupSchemaFolderStat.children) {
                            for (const backupForSchema of backupSchemaFolderStat.children) {
                                if (!backupForSchema.isDirectory) {
                                    this.add(backupForSchema.resource);
                                }
                            }
                        }
                    }));
                }
            }
            catch (error) {
                // ignore any errors
            }
        }
        add(resource, versionId = 0, meta) {
            this.cache.set(resource, {
                versionId,
                meta: (0, objects_1.deepClone)(meta)
            });
        }
        update(resource, meta) {
            const entry = this.cache.get(resource);
            if (entry) {
                entry.meta = (0, objects_1.deepClone)(meta);
            }
        }
        count() {
            return this.cache.size;
        }
        has(resource, versionId, meta) {
            const entry = this.cache.get(resource);
            if (!entry) {
                return false; // unknown resource
            }
            if (typeof versionId === 'number' && versionId !== entry.versionId) {
                return false; // different versionId
            }
            if (meta && !(0, objects_1.equals)(meta, entry.meta)) {
                return false; // different metadata
            }
            return true;
        }
        get() {
            return Array.from(this.cache.keys());
        }
        remove(resource) {
            this.cache.delete(resource);
        }
        clear() {
            this.cache.clear();
        }
    }
    exports.WorkingCopyBackupsModel = WorkingCopyBackupsModel;
    let WorkingCopyBackupService = class WorkingCopyBackupService extends lifecycle_1.Disposable {
        constructor(backupWorkspaceHome, fileService, logService) {
            super();
            this.fileService = fileService;
            this.logService = logService;
            this.impl = this._register(this.initialize(backupWorkspaceHome));
        }
        initialize(backupWorkspaceHome) {
            if (backupWorkspaceHome) {
                return new WorkingCopyBackupServiceImpl(backupWorkspaceHome, this.fileService, this.logService);
            }
            return new InMemoryWorkingCopyBackupService();
        }
        reinitialize(backupWorkspaceHome) {
            // Re-init implementation (unless we are running in-memory)
            if (this.impl instanceof WorkingCopyBackupServiceImpl) {
                if (backupWorkspaceHome) {
                    this.impl.initialize(backupWorkspaceHome);
                }
                else {
                    this.impl = new InMemoryWorkingCopyBackupService();
                }
            }
        }
        hasBackups() {
            return this.impl.hasBackups();
        }
        hasBackupSync(identifier, versionId, meta) {
            return this.impl.hasBackupSync(identifier, versionId, meta);
        }
        backup(identifier, content, versionId, meta, token) {
            return this.impl.backup(identifier, content, versionId, meta, token);
        }
        discardBackup(identifier, token) {
            return this.impl.discardBackup(identifier, token);
        }
        discardBackups(filter) {
            return this.impl.discardBackups(filter);
        }
        getBackups() {
            return this.impl.getBackups();
        }
        resolve(identifier) {
            return this.impl.resolve(identifier);
        }
        toBackupResource(identifier) {
            return this.impl.toBackupResource(identifier);
        }
        joinBackups() {
            return this.impl.joinBackups();
        }
    };
    exports.WorkingCopyBackupService = WorkingCopyBackupService;
    exports.WorkingCopyBackupService = WorkingCopyBackupService = __decorate([
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService)
    ], WorkingCopyBackupService);
    let WorkingCopyBackupServiceImpl = class WorkingCopyBackupServiceImpl extends lifecycle_1.Disposable {
        static { WorkingCopyBackupServiceImpl_1 = this; }
        static { this.PREAMBLE_END_MARKER = '\n'; }
        static { this.PREAMBLE_END_MARKER_CHARCODE = '\n'.charCodeAt(0); }
        static { this.PREAMBLE_META_SEPARATOR = ' '; } // using a character that is know to be escaped in a URI as separator
        static { this.PREAMBLE_MAX_LENGTH = 10000; }
        constructor(backupWorkspaceHome, fileService, logService) {
            super();
            this.backupWorkspaceHome = backupWorkspaceHome;
            this.fileService = fileService;
            this.logService = logService;
            this.ioOperationQueues = this._register(new async_1.ResourceQueue()); // queue IO operations to ensure write/delete file order
            this.model = undefined;
            this.initialize(backupWorkspaceHome);
        }
        initialize(backupWorkspaceResource) {
            this.backupWorkspaceHome = backupWorkspaceResource;
            this.ready = this.doInitialize();
        }
        async doInitialize() {
            // Create backup model
            this.model = await WorkingCopyBackupsModel.create(this.backupWorkspaceHome, this.fileService);
            return this.model;
        }
        async hasBackups() {
            const model = await this.ready;
            // Ensure to await any pending backup operations
            await this.joinBackups();
            return model.count() > 0;
        }
        hasBackupSync(identifier, versionId, meta) {
            if (!this.model) {
                return false;
            }
            const backupResource = this.toBackupResource(identifier);
            return this.model.has(backupResource, versionId, meta);
        }
        async backup(identifier, content, versionId, meta, token) {
            const model = await this.ready;
            if (token?.isCancellationRequested) {
                return;
            }
            const backupResource = this.toBackupResource(identifier);
            if (model.has(backupResource, versionId, meta)) {
                // return early if backup version id matches requested one
                return;
            }
            return this.ioOperationQueues.queueFor(backupResource, async () => {
                if (token?.isCancellationRequested) {
                    return;
                }
                if (model.has(backupResource, versionId, meta)) {
                    // return early if backup version id matches requested one
                    // this can happen when multiple backup IO operations got
                    // scheduled, racing against each other.
                    return;
                }
                // Encode as: Resource + META-START + Meta + END
                // and respect max length restrictions in case
                // meta is too large.
                let preamble = this.createPreamble(identifier, meta);
                if (preamble.length >= WorkingCopyBackupServiceImpl_1.PREAMBLE_MAX_LENGTH) {
                    preamble = this.createPreamble(identifier);
                }
                // Update backup with value
                const preambleBuffer = buffer_1.VSBuffer.fromString(preamble);
                let backupBuffer;
                if ((0, stream_1.isReadableStream)(content)) {
                    backupBuffer = (0, buffer_1.prefixedBufferStream)(preambleBuffer, content);
                }
                else if (content) {
                    backupBuffer = (0, buffer_1.prefixedBufferReadable)(preambleBuffer, content);
                }
                else {
                    backupBuffer = buffer_1.VSBuffer.concat([preambleBuffer, buffer_1.VSBuffer.fromString('')]);
                }
                // Write backup via file service
                await this.fileService.writeFile(backupResource, backupBuffer);
                //
                // Update model
                //
                // Note: not checking for cancellation here because a successful
                // write into the backup file should be noted in the model to
                // prevent the model being out of sync with the backup file
                model.add(backupResource, versionId, meta);
            });
        }
        createPreamble(identifier, meta) {
            return `${identifier.resource.toString()}${WorkingCopyBackupServiceImpl_1.PREAMBLE_META_SEPARATOR}${JSON.stringify({ ...meta, typeId: identifier.typeId })}${WorkingCopyBackupServiceImpl_1.PREAMBLE_END_MARKER}`;
        }
        async discardBackups(filter) {
            const model = await this.ready;
            // Discard all but some backups
            const except = filter?.except;
            if (Array.isArray(except) && except.length > 0) {
                const exceptMap = new map_1.ResourceMap();
                for (const exceptWorkingCopy of except) {
                    exceptMap.set(this.toBackupResource(exceptWorkingCopy), true);
                }
                await async_1.Promises.settled(model.get().map(async (backupResource) => {
                    if (!exceptMap.has(backupResource)) {
                        await this.doDiscardBackup(backupResource);
                    }
                }));
            }
            // Discard all backups
            else {
                await this.deleteIgnoreFileNotFound(this.backupWorkspaceHome);
                model.clear();
            }
        }
        discardBackup(identifier, token) {
            const backupResource = this.toBackupResource(identifier);
            return this.doDiscardBackup(backupResource, token);
        }
        async doDiscardBackup(backupResource, token) {
            const model = await this.ready;
            if (token?.isCancellationRequested) {
                return;
            }
            return this.ioOperationQueues.queueFor(backupResource, async () => {
                if (token?.isCancellationRequested) {
                    return;
                }
                // Delete backup file ignoring any file not found errors
                await this.deleteIgnoreFileNotFound(backupResource);
                //
                // Update model
                //
                // Note: not checking for cancellation here because a successful
                // delete of the backup file should be noted in the model to
                // prevent the model being out of sync with the backup file
                model.remove(backupResource);
            });
        }
        async deleteIgnoreFileNotFound(backupResource) {
            try {
                await this.fileService.del(backupResource, { recursive: true });
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    throw error; // re-throw any other error than file not found which is OK
                }
            }
        }
        async getBackups() {
            const model = await this.ready;
            // Ensure to await any pending backup operations
            await this.joinBackups();
            const backups = await Promise.all(model.get().map(backupResource => this.resolveIdentifier(backupResource, model)));
            return (0, arrays_1.coalesce)(backups);
        }
        async resolveIdentifier(backupResource, model) {
            let res = undefined;
            await this.ioOperationQueues.queueFor(backupResource, async () => {
                if (!model.has(backupResource)) {
                    return; // require backup to be present
                }
                // Read the entire backup preamble by reading up to
                // `PREAMBLE_MAX_LENGTH` in the backup file until
                // the `PREAMBLE_END_MARKER` is found
                const backupPreamble = await this.readToMatchingString(backupResource, WorkingCopyBackupServiceImpl_1.PREAMBLE_END_MARKER, WorkingCopyBackupServiceImpl_1.PREAMBLE_MAX_LENGTH);
                if (!backupPreamble) {
                    return;
                }
                // Figure out the offset in the preamble where meta
                // information possibly starts. This can be `-1` for
                // older backups without meta.
                const metaStartIndex = backupPreamble.indexOf(WorkingCopyBackupServiceImpl_1.PREAMBLE_META_SEPARATOR);
                // Extract the preamble content for resource and meta
                let resourcePreamble;
                let metaPreamble;
                if (metaStartIndex > 0) {
                    resourcePreamble = backupPreamble.substring(0, metaStartIndex);
                    metaPreamble = backupPreamble.substr(metaStartIndex + 1);
                }
                else {
                    resourcePreamble = backupPreamble;
                    metaPreamble = undefined;
                }
                // Try to parse the meta preamble for figuring out
                // `typeId` and `meta` if defined.
                const { typeId, meta } = this.parsePreambleMeta(metaPreamble);
                // Update model entry with now resolved meta
                model.update(backupResource, meta);
                res = {
                    typeId: typeId ?? workingCopy_1.NO_TYPE_ID,
                    resource: uri_1.URI.parse(resourcePreamble)
                };
            });
            return res;
        }
        async readToMatchingString(backupResource, matchingString, maximumBytesToRead) {
            const contents = (await this.fileService.readFile(backupResource, { length: maximumBytesToRead })).value.toString();
            const matchingStringIndex = contents.indexOf(matchingString);
            if (matchingStringIndex >= 0) {
                return contents.substr(0, matchingStringIndex);
            }
            // Unable to find matching string in file
            return undefined;
        }
        async resolve(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const model = await this.ready;
            let res = undefined;
            await this.ioOperationQueues.queueFor(backupResource, async () => {
                if (!model.has(backupResource)) {
                    return; // require backup to be present
                }
                // Load the backup content and peek into the first chunk
                // to be able to resolve the meta data
                const backupStream = await this.fileService.readFileStream(backupResource);
                const peekedBackupStream = await (0, stream_1.peekStream)(backupStream.value, 1);
                const firstBackupChunk = buffer_1.VSBuffer.concat(peekedBackupStream.buffer);
                // We have seen reports (e.g. https://github.com/microsoft/vscode/issues/78500) where
                // if VSCode goes down while writing the backup file, the file can turn empty because
                // it always first gets truncated and then written to. In this case, we will not find
                // the meta-end marker ('\n') and as such the backup can only be invalid. We bail out
                // here if that is the case.
                const preambleEndIndex = firstBackupChunk.buffer.indexOf(WorkingCopyBackupServiceImpl_1.PREAMBLE_END_MARKER_CHARCODE);
                if (preambleEndIndex === -1) {
                    this.logService.trace(`Backup: Could not find meta end marker in ${backupResource}. The file is probably corrupt (filesize: ${backupStream.size}).`);
                    return undefined;
                }
                const preambelRaw = firstBackupChunk.slice(0, preambleEndIndex).toString();
                // Extract meta data (if any)
                let meta;
                const metaStartIndex = preambelRaw.indexOf(WorkingCopyBackupServiceImpl_1.PREAMBLE_META_SEPARATOR);
                if (metaStartIndex !== -1) {
                    meta = this.parsePreambleMeta(preambelRaw.substr(metaStartIndex + 1)).meta;
                }
                // Update model entry with now resolved meta
                model.update(backupResource, meta);
                // Build a new stream without the preamble
                const firstBackupChunkWithoutPreamble = firstBackupChunk.slice(preambleEndIndex + 1);
                let value;
                if (peekedBackupStream.ended) {
                    value = (0, buffer_1.bufferToStream)(firstBackupChunkWithoutPreamble);
                }
                else {
                    value = (0, buffer_1.prefixedBufferStream)(firstBackupChunkWithoutPreamble, peekedBackupStream.stream);
                }
                res = { value, meta };
            });
            return res;
        }
        parsePreambleMeta(preambleMetaRaw) {
            let typeId = undefined;
            let meta = undefined;
            if (preambleMetaRaw) {
                try {
                    meta = JSON.parse(preambleMetaRaw);
                    typeId = meta?.typeId;
                    // `typeId` is a property that we add so we
                    // remove it when returning to clients.
                    if (typeof meta?.typeId === 'string') {
                        delete meta.typeId;
                        if ((0, types_1.isEmptyObject)(meta)) {
                            meta = undefined;
                        }
                    }
                }
                catch (error) {
                    // ignore JSON parse errors
                }
            }
            return { typeId, meta };
        }
        toBackupResource(identifier) {
            return (0, resources_1.joinPath)(this.backupWorkspaceHome, identifier.resource.scheme, hashIdentifier(identifier));
        }
        joinBackups() {
            return this.ioOperationQueues.whenDrained();
        }
    };
    WorkingCopyBackupServiceImpl = WorkingCopyBackupServiceImpl_1 = __decorate([
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService)
    ], WorkingCopyBackupServiceImpl);
    class InMemoryWorkingCopyBackupService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.backups = new map_1.ResourceMap();
        }
        async hasBackups() {
            return this.backups.size > 0;
        }
        hasBackupSync(identifier, versionId) {
            const backupResource = this.toBackupResource(identifier);
            return this.backups.has(backupResource);
        }
        async backup(identifier, content, versionId, meta, token) {
            const backupResource = this.toBackupResource(identifier);
            this.backups.set(backupResource, {
                typeId: identifier.typeId,
                content: content instanceof buffer_1.VSBuffer ? content : content ? (0, stream_1.isReadableStream)(content) ? await (0, buffer_1.streamToBuffer)(content) : (0, buffer_1.readableToBuffer)(content) : buffer_1.VSBuffer.fromString(''),
                meta
            });
        }
        async resolve(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const backup = this.backups.get(backupResource);
            if (backup) {
                return { value: (0, buffer_1.bufferToStream)(backup.content), meta: backup.meta };
            }
            return undefined;
        }
        async getBackups() {
            return Array.from(this.backups.entries()).map(([resource, backup]) => ({ typeId: backup.typeId, resource }));
        }
        async discardBackup(identifier) {
            this.backups.delete(this.toBackupResource(identifier));
        }
        async discardBackups(filter) {
            const except = filter?.except;
            if (Array.isArray(except) && except.length > 0) {
                const exceptMap = new map_1.ResourceMap();
                for (const exceptWorkingCopy of except) {
                    exceptMap.set(this.toBackupResource(exceptWorkingCopy), true);
                }
                for (const backup of await this.getBackups()) {
                    if (!exceptMap.has(this.toBackupResource(backup))) {
                        await this.discardBackup(backup);
                    }
                }
            }
            else {
                this.backups.clear();
            }
        }
        toBackupResource(identifier) {
            return uri_1.URI.from({ scheme: network_1.Schemas.inMemory, path: hashIdentifier(identifier) });
        }
        async joinBackups() {
            return;
        }
    }
    exports.InMemoryWorkingCopyBackupService = InMemoryWorkingCopyBackupService;
    /*
     * Exported only for testing
     */
    function hashIdentifier(identifier) {
        // IMPORTANT: for backwards compatibility, ensure that
        // we ignore the `typeId` unless a value is provided.
        // To preserve previous backups without type id, we
        // need to just hash the resource. Otherwise we use
        // the type id as a seed to the resource path.
        let resource;
        if (identifier.typeId.length > 0) {
            const typeIdHash = hashString(identifier.typeId);
            if (identifier.resource.path) {
                resource = (0, resources_1.joinPath)(identifier.resource, typeIdHash);
            }
            else {
                resource = identifier.resource.with({ path: typeIdHash });
            }
        }
        else {
            resource = identifier.resource;
        }
        return hashPath(resource);
    }
    function hashPath(resource) {
        const str = resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.untitled ? resource.fsPath : resource.toString();
        return hashString(str);
    }
    function hashString(str) {
        return (0, hash_1.hash)(str).toString(16);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2NvbW1vbi93b3JraW5nQ29weUJhY2t1cFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW1tQmhHLHdDQW9CQztJQW5tQkQsTUFBYSx1QkFBdUI7UUFJbkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBZSxFQUFFLFdBQXlCO1lBQzdELE1BQU0sS0FBSyxHQUFHLElBQUksdUJBQXVCLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRW5FLE1BQU0sS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXRCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELFlBQTRCLFVBQWUsRUFBVSxXQUF5QjtZQUFsRCxlQUFVLEdBQVYsVUFBVSxDQUFLO1lBQVUsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFWN0QsVUFBSyxHQUFHLElBQUksaUJBQVcsRUFBeUQsQ0FBQztRQVVoQixDQUFDO1FBRTNFLEtBQUssQ0FBQyxPQUFPO1lBQ3BCLElBQUksQ0FBQztnQkFDSixNQUFNLGNBQWMsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDdkUsSUFBSSxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQzdCLE1BQU0sZ0JBQVEsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFFBQVE7eUJBQzVDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7eUJBQ2xDLEdBQUcsQ0FBQyxLQUFLLEVBQUMsa0JBQWtCLEVBQUMsRUFBRTt3QkFFL0Isb0NBQW9DO3dCQUNwQyxNQUFNLHNCQUFzQixHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBRTNGLHVDQUF1Qzt3QkFDdkMsRUFBRTt3QkFDRiw0Q0FBNEM7d0JBQzVDLDZDQUE2Qzt3QkFDN0MsMENBQTBDO3dCQUMxQywrQ0FBK0M7d0JBQy9DLDRDQUE0Qzt3QkFDNUMsNkJBQTZCO3dCQUM3QixJQUFJLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDOzRCQUNyQyxLQUFLLE1BQU0sZUFBZSxJQUFJLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDO2dDQUMvRCxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxDQUFDO29DQUNsQyxJQUFJLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQ0FDcEMsQ0FBQzs0QkFDRixDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDTixDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLG9CQUFvQjtZQUNyQixDQUFDO1FBQ0YsQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUFhLEVBQUUsU0FBUyxHQUFHLENBQUMsRUFBRSxJQUE2QjtZQUM5RCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUU7Z0JBQ3hCLFNBQVM7Z0JBQ1QsSUFBSSxFQUFFLElBQUEsbUJBQVMsRUFBQyxJQUFJLENBQUM7YUFDckIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUFhLEVBQUUsSUFBNkI7WUFDbEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdkMsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUEsbUJBQVMsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUs7WUFDSixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBYSxFQUFFLFNBQWtCLEVBQUUsSUFBNkI7WUFDbkUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sS0FBSyxDQUFDLENBQUMsbUJBQW1CO1lBQ2xDLENBQUM7WUFFRCxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsSUFBSSxTQUFTLEtBQUssS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwRSxPQUFPLEtBQUssQ0FBQyxDQUFDLHNCQUFzQjtZQUNyQyxDQUFDO1lBRUQsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFBLGdCQUFNLEVBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN2QyxPQUFPLEtBQUssQ0FBQyxDQUFDLHFCQUFxQjtZQUNwQyxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsR0FBRztZQUNGLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUFhO1lBQ25CLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNwQixDQUFDO0tBQ0Q7SUE3RkQsMERBNkZDO0lBRU0sSUFBZSx3QkFBd0IsR0FBdkMsTUFBZSx3QkFBeUIsU0FBUSxzQkFBVTtRQU1oRSxZQUNDLG1CQUFvQyxFQUNaLFdBQXlCLEVBQ25CLFVBQXVCO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBSGdCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ25CLGVBQVUsR0FBVixVQUFVLENBQWE7WUFJckQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFTyxVQUFVLENBQUMsbUJBQW9DO1lBQ3RELElBQUksbUJBQW1CLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxJQUFJLDRCQUE0QixDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2pHLENBQUM7WUFFRCxPQUFPLElBQUksZ0NBQWdDLEVBQUUsQ0FBQztRQUMvQyxDQUFDO1FBRUQsWUFBWSxDQUFDLG1CQUFvQztZQUVoRCwyREFBMkQ7WUFDM0QsSUFBSSxJQUFJLENBQUMsSUFBSSxZQUFZLDRCQUE0QixFQUFFLENBQUM7Z0JBQ3ZELElBQUksbUJBQW1CLEVBQUUsQ0FBQztvQkFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDM0MsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxnQ0FBZ0MsRUFBRSxDQUFDO2dCQUNwRCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxVQUFVO1lBQ1QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFRCxhQUFhLENBQUMsVUFBa0MsRUFBRSxTQUFrQixFQUFFLElBQTZCO1lBQ2xHLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRUQsTUFBTSxDQUFDLFVBQWtDLEVBQUUsT0FBbUQsRUFBRSxTQUFrQixFQUFFLElBQTZCLEVBQUUsS0FBeUI7WUFDM0ssT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVELGFBQWEsQ0FBQyxVQUFrQyxFQUFFLEtBQXlCO1lBQzFFLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCxjQUFjLENBQUMsTUFBNkM7WUFDM0QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRUQsVUFBVTtZQUNULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBRUQsT0FBTyxDQUFtQyxVQUFrQztZQUMzRSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxVQUFrQztZQUNsRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVELFdBQVc7WUFDVixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDaEMsQ0FBQztLQUNELENBQUE7SUF2RXFCLDREQUF3Qjt1Q0FBeEIsd0JBQXdCO1FBUTNDLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUJBQVcsQ0FBQTtPQVRRLHdCQUF3QixDQXVFN0M7SUFFRCxJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLHNCQUFVOztpQkFFNUIsd0JBQW1CLEdBQUcsSUFBSSxBQUFQLENBQVE7aUJBQzNCLGlDQUE0QixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEFBQXJCLENBQXNCO2lCQUNsRCw0QkFBdUIsR0FBRyxHQUFHLEFBQU4sQ0FBTyxHQUFDLHFFQUFxRTtpQkFDcEcsd0JBQW1CLEdBQUcsS0FBSyxBQUFSLENBQVM7UUFTcEQsWUFDUyxtQkFBd0IsRUFDbEIsV0FBMEMsRUFDM0MsVUFBd0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFKQSx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQUs7WUFDRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUMxQixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBUnJDLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxxQkFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDLHdEQUF3RDtZQUcxSCxVQUFLLEdBQXdDLFNBQVMsQ0FBQztZQVM5RCxJQUFJLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVELFVBQVUsQ0FBQyx1QkFBNEI7WUFDdEMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLHVCQUF1QixDQUFDO1lBRW5ELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFFTyxLQUFLLENBQUMsWUFBWTtZQUV6QixzQkFBc0I7WUFDdEIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRTlGLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVU7WUFDZixNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUM7WUFFL0IsZ0RBQWdEO1lBQ2hELE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRXpCLE9BQU8sS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBRUQsYUFBYSxDQUFDLFVBQWtDLEVBQUUsU0FBa0IsRUFBRSxJQUE2QjtZQUNsRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFekQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQWtDLEVBQUUsT0FBbUQsRUFBRSxTQUFrQixFQUFFLElBQTZCLEVBQUUsS0FBeUI7WUFDakwsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQy9CLElBQUksS0FBSyxFQUFFLHVCQUF1QixFQUFFLENBQUM7Z0JBQ3BDLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3pELElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELDBEQUEwRDtnQkFDMUQsT0FBTztZQUNSLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUNqRSxJQUFJLEtBQUssRUFBRSx1QkFBdUIsRUFBRSxDQUFDO29CQUNwQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDaEQsMERBQTBEO29CQUMxRCx5REFBeUQ7b0JBQ3pELHdDQUF3QztvQkFDeEMsT0FBTztnQkFDUixDQUFDO2dCQUVELGdEQUFnRDtnQkFDaEQsOENBQThDO2dCQUM5QyxxQkFBcUI7Z0JBQ3JCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLElBQUksOEJBQTRCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztvQkFDekUsUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzVDLENBQUM7Z0JBRUQsMkJBQTJCO2dCQUMzQixNQUFNLGNBQWMsR0FBRyxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDckQsSUFBSSxZQUFrRSxDQUFDO2dCQUN2RSxJQUFJLElBQUEseUJBQWdCLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDL0IsWUFBWSxHQUFHLElBQUEsNkJBQW9CLEVBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM5RCxDQUFDO3FCQUFNLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ3BCLFlBQVksR0FBRyxJQUFBLCtCQUFzQixFQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDaEUsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFlBQVksR0FBRyxpQkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGNBQWMsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNFLENBQUM7Z0JBRUQsZ0NBQWdDO2dCQUNoQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFFL0QsRUFBRTtnQkFDRixlQUFlO2dCQUNmLEVBQUU7Z0JBQ0YsZ0VBQWdFO2dCQUNoRSw2REFBNkQ7Z0JBQzdELDJEQUEyRDtnQkFDM0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLGNBQWMsQ0FBQyxVQUFrQyxFQUFFLElBQTZCO1lBQ3ZGLE9BQU8sR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLDhCQUE0QixDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsOEJBQTRCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUMvTSxDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUE2QztZQUNqRSxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUM7WUFFL0IsK0JBQStCO1lBQy9CLE1BQU0sTUFBTSxHQUFHLE1BQU0sRUFBRSxNQUFNLENBQUM7WUFDOUIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sU0FBUyxHQUFHLElBQUksaUJBQVcsRUFBVyxDQUFDO2dCQUM3QyxLQUFLLE1BQU0saUJBQWlCLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ3hDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQy9ELENBQUM7Z0JBRUQsTUFBTSxnQkFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxjQUFjLEVBQUMsRUFBRTtvQkFDN0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQzt3QkFDcEMsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUM1QyxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1lBRUQsc0JBQXNCO2lCQUNqQixDQUFDO2dCQUNMLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUU5RCxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDZixDQUFDO1FBQ0YsQ0FBQztRQUVELGFBQWEsQ0FBQyxVQUFrQyxFQUFFLEtBQXlCO1lBQzFFLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUV6RCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFTyxLQUFLLENBQUMsZUFBZSxDQUFDLGNBQW1CLEVBQUUsS0FBeUI7WUFDM0UsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQy9CLElBQUksS0FBSyxFQUFFLHVCQUF1QixFQUFFLENBQUM7Z0JBQ3BDLE9BQU87WUFDUixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDakUsSUFBSSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQztvQkFDcEMsT0FBTztnQkFDUixDQUFDO2dCQUVELHdEQUF3RDtnQkFDeEQsTUFBTSxJQUFJLENBQUMsd0JBQXdCLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBRXBELEVBQUU7Z0JBQ0YsZUFBZTtnQkFDZixFQUFFO2dCQUNGLGdFQUFnRTtnQkFDaEUsNERBQTREO2dCQUM1RCwyREFBMkQ7Z0JBQzNELEtBQUssQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDOUIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sS0FBSyxDQUFDLHdCQUF3QixDQUFDLGNBQW1CO1lBQ3pELElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUF5QixLQUFNLENBQUMsbUJBQW1CLCtDQUF1QyxFQUFFLENBQUM7b0JBQzVGLE1BQU0sS0FBSyxDQUFDLENBQUMsMkRBQTJEO2dCQUN6RSxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVTtZQUNmLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUUvQixnREFBZ0Q7WUFDaEQsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFekIsTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVwSCxPQUFPLElBQUEsaUJBQVEsRUFBQyxPQUFPLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBRU8sS0FBSyxDQUFDLGlCQUFpQixDQUFDLGNBQW1CLEVBQUUsS0FBOEI7WUFDbEYsSUFBSSxHQUFHLEdBQXVDLFNBQVMsQ0FBQztZQUV4RCxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUNoRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO29CQUNoQyxPQUFPLENBQUMsK0JBQStCO2dCQUN4QyxDQUFDO2dCQUVELG1EQUFtRDtnQkFDbkQsaURBQWlEO2dCQUNqRCxxQ0FBcUM7Z0JBQ3JDLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsRUFBRSw4QkFBNEIsQ0FBQyxtQkFBbUIsRUFBRSw4QkFBNEIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUMzSyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3JCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxtREFBbUQ7Z0JBQ25ELG9EQUFvRDtnQkFDcEQsOEJBQThCO2dCQUM5QixNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLDhCQUE0QixDQUFDLHVCQUF1QixDQUFDLENBQUM7Z0JBRXBHLHFEQUFxRDtnQkFDckQsSUFBSSxnQkFBd0IsQ0FBQztnQkFDN0IsSUFBSSxZQUFnQyxDQUFDO2dCQUNyQyxJQUFJLGNBQWMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDeEIsZ0JBQWdCLEdBQUcsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7b0JBQy9ELFlBQVksR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDMUQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGdCQUFnQixHQUFHLGNBQWMsQ0FBQztvQkFDbEMsWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDMUIsQ0FBQztnQkFFRCxrREFBa0Q7Z0JBQ2xELGtDQUFrQztnQkFDbEMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBRTlELDRDQUE0QztnQkFDNUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRW5DLEdBQUcsR0FBRztvQkFDTCxNQUFNLEVBQUUsTUFBTSxJQUFJLHdCQUFVO29CQUM1QixRQUFRLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztpQkFDckMsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO1FBRU8sS0FBSyxDQUFDLG9CQUFvQixDQUFDLGNBQW1CLEVBQUUsY0FBc0IsRUFBRSxrQkFBMEI7WUFDekcsTUFBTSxRQUFRLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFFcEgsTUFBTSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzdELElBQUksbUJBQW1CLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUNoRCxDQUFDO1lBRUQseUNBQXlDO1lBQ3pDLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFtQyxVQUFrQztZQUNqRixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFekQsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDO1lBRS9CLElBQUksR0FBRyxHQUE4QyxTQUFTLENBQUM7WUFFL0QsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDaEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztvQkFDaEMsT0FBTyxDQUFDLCtCQUErQjtnQkFDeEMsQ0FBQztnQkFFRCx3REFBd0Q7Z0JBQ3hELHNDQUFzQztnQkFDdEMsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDM0UsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLElBQUEsbUJBQVUsRUFBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLGdCQUFnQixHQUFHLGlCQUFRLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUVwRSxxRkFBcUY7Z0JBQ3JGLHFGQUFxRjtnQkFDckYscUZBQXFGO2dCQUNyRixxRkFBcUY7Z0JBQ3JGLDRCQUE0QjtnQkFDNUIsTUFBTSxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLDhCQUE0QixDQUFDLDRCQUE0QixDQUFDLENBQUM7Z0JBQ3BILElBQUksZ0JBQWdCLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsNkNBQTZDLGNBQWMsNkNBQTZDLFlBQVksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO29CQUVySixPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztnQkFFRCxNQUFNLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBRTNFLDZCQUE2QjtnQkFDN0IsSUFBSSxJQUFtQixDQUFDO2dCQUN4QixNQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLDhCQUE0QixDQUFDLHVCQUF1QixDQUFDLENBQUM7Z0JBQ2pHLElBQUksY0FBYyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzNCLElBQUksR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFTLENBQUM7Z0JBQ2pGLENBQUM7Z0JBRUQsNENBQTRDO2dCQUM1QyxLQUFLLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFbkMsMENBQTBDO2dCQUMxQyxNQUFNLCtCQUErQixHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDckYsSUFBSSxLQUE2QixDQUFDO2dCQUNsQyxJQUFJLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO29CQUM5QixLQUFLLEdBQUcsSUFBQSx1QkFBYyxFQUFDLCtCQUErQixDQUFDLENBQUM7Z0JBQ3pELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxLQUFLLEdBQUcsSUFBQSw2QkFBb0IsRUFBQywrQkFBK0IsRUFBRSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUYsQ0FBQztnQkFFRCxHQUFHLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDdkIsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7UUFFTyxpQkFBaUIsQ0FBbUMsZUFBbUM7WUFDOUYsSUFBSSxNQUFNLEdBQXVCLFNBQVMsQ0FBQztZQUMzQyxJQUFJLElBQUksR0FBa0IsU0FBUyxDQUFDO1lBRXBDLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQztvQkFDSixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDbkMsTUFBTSxHQUFHLElBQUksRUFBRSxNQUFNLENBQUM7b0JBRXRCLDJDQUEyQztvQkFDM0MsdUNBQXVDO29CQUN2QyxJQUFJLE9BQU8sSUFBSSxFQUFFLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQzt3QkFDdEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO3dCQUVuQixJQUFJLElBQUEscUJBQWEsRUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDOzRCQUN6QixJQUFJLEdBQUcsU0FBUyxDQUFDO3dCQUNsQixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNoQiwyQkFBMkI7Z0JBQzVCLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBRUQsZ0JBQWdCLENBQUMsVUFBa0M7WUFDbEQsT0FBTyxJQUFBLG9CQUFRLEVBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ25HLENBQUM7UUFFRCxXQUFXO1lBQ1YsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDN0MsQ0FBQzs7SUF2VkksNEJBQTRCO1FBZ0IvQixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLGlCQUFXLENBQUE7T0FqQlIsNEJBQTRCLENBd1ZqQztJQUVELE1BQWEsZ0NBQWlDLFNBQVEsc0JBQVU7UUFNL0Q7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUhELFlBQU8sR0FBRyxJQUFJLGlCQUFXLEVBQXdFLENBQUM7UUFJMUcsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVO1lBQ2YsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELGFBQWEsQ0FBQyxVQUFrQyxFQUFFLFNBQWtCO1lBQ25FLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUV6RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQWtDLEVBQUUsT0FBbUQsRUFBRSxTQUFrQixFQUFFLElBQTZCLEVBQUUsS0FBeUI7WUFDakwsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3pELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRTtnQkFDaEMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO2dCQUN6QixPQUFPLEVBQUUsT0FBTyxZQUFZLGlCQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFBLHlCQUFnQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUEsdUJBQWMsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSx5QkFBZ0IsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUMxSyxJQUFJO2FBQ0osQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQW1DLFVBQWtDO1lBQ2pGLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN6RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNoRCxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBQSx1QkFBYyxFQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQXFCLEVBQUUsQ0FBQztZQUN0RixDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVO1lBQ2YsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5RyxDQUFDO1FBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFrQztZQUNyRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUE2QztZQUNqRSxNQUFNLE1BQU0sR0FBRyxNQUFNLEVBQUUsTUFBTSxDQUFDO1lBQzlCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxNQUFNLFNBQVMsR0FBRyxJQUFJLGlCQUFXLEVBQVcsQ0FBQztnQkFDN0MsS0FBSyxNQUFNLGlCQUFpQixJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUN4QyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvRCxDQUFDO2dCQUVELEtBQUssTUFBTSxNQUFNLElBQUksTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztvQkFDOUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDbkQsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNsQyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN0QixDQUFDO1FBQ0YsQ0FBQztRQUVELGdCQUFnQixDQUFDLFVBQWtDO1lBQ2xELE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqRixDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVc7WUFDaEIsT0FBTztRQUNSLENBQUM7S0FDRDtJQXhFRCw0RUF3RUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLGNBQWMsQ0FBQyxVQUFrQztRQUVoRSxzREFBc0Q7UUFDdEQscURBQXFEO1FBQ3JELG1EQUFtRDtRQUNuRCxtREFBbUQ7UUFDbkQsOENBQThDO1FBQzlDLElBQUksUUFBYSxDQUFDO1FBQ2xCLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDbEMsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqRCxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzlCLFFBQVEsR0FBRyxJQUFBLG9CQUFRLEVBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN0RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDM0QsQ0FBQztRQUNGLENBQUM7YUFBTSxDQUFDO1lBQ1AsUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUM7UUFDaEMsQ0FBQztRQUVELE9BQU8sUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxTQUFTLFFBQVEsQ0FBQyxRQUFhO1FBQzlCLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTdILE9BQU8sVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRCxTQUFTLFVBQVUsQ0FBQyxHQUFXO1FBQzlCLE9BQU8sSUFBQSxXQUFJLEVBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLENBQUMifQ==