/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/files/common/files", "vs/base/browser/indexedDB", "vs/base/browser/broadcast"], function (require, exports, async_1, buffer_1, event_1, lifecycle_1, resources_1, types_1, uri_1, nls_1, files_1, indexedDB_1, broadcast_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexedDBFileSystemProvider = void 0;
    // Standard FS Errors (expected to be thrown in production when invalid FS operations are requested)
    const ERR_FILE_NOT_FOUND = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileNotExists', "File does not exist"), files_1.FileSystemProviderErrorCode.FileNotFound);
    const ERR_FILE_IS_DIR = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileIsDirectory', "File is Directory"), files_1.FileSystemProviderErrorCode.FileIsADirectory);
    const ERR_FILE_NOT_DIR = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileNotDirectory', "File is not a directory"), files_1.FileSystemProviderErrorCode.FileNotADirectory);
    const ERR_DIR_NOT_EMPTY = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('dirIsNotEmpty', "Directory is not empty"), files_1.FileSystemProviderErrorCode.Unknown);
    const ERR_FILE_EXCEEDS_STORAGE_QUOTA = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileExceedsStorageQuota', "File exceeds available storage quota"), files_1.FileSystemProviderErrorCode.FileExceedsStorageQuota);
    // Arbitrary Internal Errors
    const ERR_UNKNOWN_INTERNAL = (message) => (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('internal', "Internal error occurred in IndexedDB File System Provider. ({0})", message), files_1.FileSystemProviderErrorCode.Unknown);
    class IndexedDBFileSystemNode {
        constructor(entry) {
            this.entry = entry;
            this.type = entry.type;
        }
        read(path) {
            return this.doRead(path.split('/').filter(p => p.length));
        }
        doRead(pathParts) {
            if (pathParts.length === 0) {
                return this.entry;
            }
            if (this.entry.type !== files_1.FileType.Directory) {
                throw ERR_UNKNOWN_INTERNAL('Internal error reading from IndexedDBFSNode -- expected directory at ' + this.entry.path);
            }
            const next = this.entry.children.get(pathParts[0]);
            if (!next) {
                return undefined;
            }
            return next.doRead(pathParts.slice(1));
        }
        delete(path) {
            const toDelete = path.split('/').filter(p => p.length);
            if (toDelete.length === 0) {
                if (this.entry.type !== files_1.FileType.Directory) {
                    throw ERR_UNKNOWN_INTERNAL(`Internal error deleting from IndexedDBFSNode. Expected root entry to be directory`);
                }
                this.entry.children.clear();
            }
            else {
                return this.doDelete(toDelete, path);
            }
        }
        doDelete(pathParts, originalPath) {
            if (pathParts.length === 0) {
                throw ERR_UNKNOWN_INTERNAL(`Internal error deleting from IndexedDBFSNode -- got no deletion path parts (encountered while deleting ${originalPath})`);
            }
            else if (this.entry.type !== files_1.FileType.Directory) {
                throw ERR_UNKNOWN_INTERNAL('Internal error deleting from IndexedDBFSNode -- expected directory at ' + this.entry.path);
            }
            else if (pathParts.length === 1) {
                this.entry.children.delete(pathParts[0]);
            }
            else {
                const next = this.entry.children.get(pathParts[0]);
                if (!next) {
                    throw ERR_UNKNOWN_INTERNAL('Internal error deleting from IndexedDBFSNode -- expected entry at ' + this.entry.path + '/' + next);
                }
                next.doDelete(pathParts.slice(1), originalPath);
            }
        }
        add(path, entry) {
            this.doAdd(path.split('/').filter(p => p.length), entry, path);
        }
        doAdd(pathParts, entry, originalPath) {
            if (pathParts.length === 0) {
                throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- adding empty path (encountered while adding ${originalPath})`);
            }
            else if (this.entry.type !== files_1.FileType.Directory) {
                throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- parent is not a directory (encountered while adding ${originalPath})`);
            }
            else if (pathParts.length === 1) {
                const next = pathParts[0];
                const existing = this.entry.children.get(next);
                if (entry.type === 'dir') {
                    if (existing?.entry.type === files_1.FileType.File) {
                        throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- overwriting file with directory: ${this.entry.path}/${next} (encountered while adding ${originalPath})`);
                    }
                    this.entry.children.set(next, existing ?? new IndexedDBFileSystemNode({
                        type: files_1.FileType.Directory,
                        path: this.entry.path + '/' + next,
                        children: new Map(),
                    }));
                }
                else {
                    if (existing?.entry.type === files_1.FileType.Directory) {
                        throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- overwriting directory with file: ${this.entry.path}/${next} (encountered while adding ${originalPath})`);
                    }
                    this.entry.children.set(next, new IndexedDBFileSystemNode({
                        type: files_1.FileType.File,
                        path: this.entry.path + '/' + next,
                        size: entry.size,
                    }));
                }
            }
            else if (pathParts.length > 1) {
                const next = pathParts[0];
                let childNode = this.entry.children.get(next);
                if (!childNode) {
                    childNode = new IndexedDBFileSystemNode({
                        children: new Map(),
                        path: this.entry.path + '/' + next,
                        type: files_1.FileType.Directory
                    });
                    this.entry.children.set(next, childNode);
                }
                else if (childNode.type === files_1.FileType.File) {
                    throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- overwriting file entry with directory: ${this.entry.path}/${next} (encountered while adding ${originalPath})`);
                }
                childNode.doAdd(pathParts.slice(1), entry, originalPath);
            }
        }
        print(indentation = '') {
            console.log(indentation + this.entry.path);
            if (this.entry.type === files_1.FileType.Directory) {
                this.entry.children.forEach(child => child.print(indentation + ' '));
            }
        }
    }
    class IndexedDBFileSystemProvider extends lifecycle_1.Disposable {
        constructor(scheme, indexedDB, store, watchCrossWindowChanges) {
            super();
            this.scheme = scheme;
            this.indexedDB = indexedDB;
            this.store = store;
            this.capabilities = 2 /* FileSystemProviderCapabilities.FileReadWrite */
                | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.extUri = new resources_1.ExtUri(() => false) /* Case Sensitive */;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._onReportError = this._register(new event_1.Emitter());
            this.onReportError = this._onReportError.event;
            this.mtimes = new Map();
            this.fileWriteBatch = [];
            this.writeManyThrottler = new async_1.Throttler();
            if (watchCrossWindowChanges) {
                this.changesBroadcastChannel = this._register(new broadcast_1.BroadcastDataChannel(`vscode.indexedDB.${scheme}.changes`));
                this._register(this.changesBroadcastChannel.onDidReceiveData(changes => {
                    this._onDidChangeFile.fire(changes.map(c => ({ type: c.type, resource: uri_1.URI.revive(c.resource) })));
                }));
            }
        }
        watch(resource, opts) {
            return lifecycle_1.Disposable.None;
        }
        async mkdir(resource) {
            try {
                const resourceStat = await this.stat(resource);
                if (resourceStat.type === files_1.FileType.File) {
                    throw ERR_FILE_NOT_DIR;
                }
            }
            catch (error) { /* Ignore */ }
            (await this.getFiletree()).add(resource.path, { type: 'dir' });
        }
        async stat(resource) {
            const entry = (await this.getFiletree()).read(resource.path);
            if (entry?.type === files_1.FileType.File) {
                return {
                    type: files_1.FileType.File,
                    ctime: 0,
                    mtime: this.mtimes.get(resource.toString()) || 0,
                    size: entry.size ?? (await this.readFile(resource)).byteLength
                };
            }
            if (entry?.type === files_1.FileType.Directory) {
                return {
                    type: files_1.FileType.Directory,
                    ctime: 0,
                    mtime: 0,
                    size: 0
                };
            }
            throw ERR_FILE_NOT_FOUND;
        }
        async readdir(resource) {
            try {
                const entry = (await this.getFiletree()).read(resource.path);
                if (!entry) {
                    // Dirs aren't saved to disk, so empty dirs will be lost on reload.
                    // Thus we have two options for what happens when you try to read a dir and nothing is found:
                    // - Throw FileSystemProviderErrorCode.FileNotFound
                    // - Return []
                    // We choose to return [] as creating a dir then reading it (even after reload) should not throw an error.
                    return [];
                }
                if (entry.type !== files_1.FileType.Directory) {
                    throw ERR_FILE_NOT_DIR;
                }
                else {
                    return [...entry.children.entries()].map(([name, node]) => [name, node.type]);
                }
            }
            catch (error) {
                this.reportError('readDir', error);
                throw error;
            }
        }
        async readFile(resource) {
            try {
                const result = await this.indexedDB.runInTransaction(this.store, 'readonly', objectStore => objectStore.get(resource.path));
                if (result === undefined) {
                    throw ERR_FILE_NOT_FOUND;
                }
                const buffer = result instanceof Uint8Array ? result : (0, types_1.isString)(result) ? buffer_1.VSBuffer.fromString(result).buffer : undefined;
                if (buffer === undefined) {
                    throw ERR_UNKNOWN_INTERNAL(`IndexedDB entry at "${resource.path}" in unexpected format`);
                }
                // update cache
                const fileTree = await this.getFiletree();
                fileTree.add(resource.path, { type: 'file', size: buffer.byteLength });
                return buffer;
            }
            catch (error) {
                this.reportError('readFile', error);
                throw error;
            }
        }
        async writeFile(resource, content, opts) {
            try {
                const existing = await this.stat(resource).catch(() => undefined);
                if (existing?.type === files_1.FileType.Directory) {
                    throw ERR_FILE_IS_DIR;
                }
                await this.bulkWrite([[resource, content]]);
            }
            catch (error) {
                this.reportError('writeFile', error);
                throw error;
            }
        }
        async rename(from, to, opts) {
            const fileTree = await this.getFiletree();
            const fromEntry = fileTree.read(from.path);
            if (!fromEntry) {
                throw ERR_FILE_NOT_FOUND;
            }
            const toEntry = fileTree.read(to.path);
            if (toEntry) {
                if (!opts.overwrite) {
                    throw (0, files_1.createFileSystemProviderError)('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
                }
                if (toEntry.type !== fromEntry.type) {
                    throw (0, files_1.createFileSystemProviderError)('Cannot rename files with different types', files_1.FileSystemProviderErrorCode.Unknown);
                }
                // delete the target file if exists
                await this.delete(to, { recursive: true, useTrash: false, atomic: false });
            }
            const toTargetResource = (path) => this.extUri.joinPath(to, this.extUri.relativePath(from, from.with({ path })) || '');
            const sourceEntries = await this.tree(from);
            const sourceFiles = [];
            for (const sourceEntry of sourceEntries) {
                if (sourceEntry[1] === files_1.FileType.File) {
                    sourceFiles.push(sourceEntry);
                }
                else if (sourceEntry[1] === files_1.FileType.Directory) {
                    // add directories to the tree
                    fileTree.add(toTargetResource(sourceEntry[0]).path, { type: 'dir' });
                }
            }
            if (sourceFiles.length) {
                const targetFiles = [];
                const sourceFilesContents = await this.indexedDB.runInTransaction(this.store, 'readonly', objectStore => sourceFiles.map(([path]) => objectStore.get(path)));
                for (let index = 0; index < sourceFiles.length; index++) {
                    const content = sourceFilesContents[index] instanceof Uint8Array ? sourceFilesContents[index] : (0, types_1.isString)(sourceFilesContents[index]) ? buffer_1.VSBuffer.fromString(sourceFilesContents[index]).buffer : undefined;
                    if (content) {
                        targetFiles.push([toTargetResource(sourceFiles[index][0]), content]);
                    }
                }
                await this.bulkWrite(targetFiles);
            }
            await this.delete(from, { recursive: true, useTrash: false, atomic: false });
        }
        async delete(resource, opts) {
            let stat;
            try {
                stat = await this.stat(resource);
            }
            catch (e) {
                if (e.code === files_1.FileSystemProviderErrorCode.FileNotFound) {
                    return;
                }
                throw e;
            }
            let toDelete;
            if (opts.recursive) {
                const tree = await this.tree(resource);
                toDelete = tree.map(([path]) => path);
            }
            else {
                if (stat.type === files_1.FileType.Directory && (await this.readdir(resource)).length) {
                    throw ERR_DIR_NOT_EMPTY;
                }
                toDelete = [resource.path];
            }
            await this.deleteKeys(toDelete);
            (await this.getFiletree()).delete(resource.path);
            toDelete.forEach(key => this.mtimes.delete(key));
            this.triggerChanges(toDelete.map(path => ({ resource: resource.with({ path }), type: 2 /* FileChangeType.DELETED */ })));
        }
        async tree(resource) {
            const stat = await this.stat(resource);
            const allEntries = [[resource.path, stat.type]];
            if (stat.type === files_1.FileType.Directory) {
                const dirEntries = await this.readdir(resource);
                for (const [key, type] of dirEntries) {
                    const childResource = this.extUri.joinPath(resource, key);
                    allEntries.push([childResource.path, type]);
                    if (type === files_1.FileType.Directory) {
                        const childEntries = await this.tree(childResource);
                        allEntries.push(...childEntries);
                    }
                }
            }
            return allEntries;
        }
        triggerChanges(changes) {
            if (changes.length) {
                this._onDidChangeFile.fire(changes);
                this.changesBroadcastChannel?.postData(changes);
            }
        }
        getFiletree() {
            if (!this.cachedFiletree) {
                this.cachedFiletree = (async () => {
                    const rootNode = new IndexedDBFileSystemNode({
                        children: new Map(),
                        path: '',
                        type: files_1.FileType.Directory
                    });
                    const result = await this.indexedDB.runInTransaction(this.store, 'readonly', objectStore => objectStore.getAllKeys());
                    const keys = result.map(key => key.toString());
                    keys.forEach(key => rootNode.add(key, { type: 'file' }));
                    return rootNode;
                })();
            }
            return this.cachedFiletree;
        }
        async bulkWrite(files) {
            files.forEach(([resource, content]) => this.fileWriteBatch.push({ content, resource }));
            await this.writeManyThrottler.queue(() => this.writeMany());
            const fileTree = await this.getFiletree();
            for (const [resource, content] of files) {
                fileTree.add(resource.path, { type: 'file', size: content.byteLength });
                this.mtimes.set(resource.toString(), Date.now());
            }
            this.triggerChanges(files.map(([resource]) => ({ resource, type: 0 /* FileChangeType.UPDATED */ })));
        }
        async writeMany() {
            if (this.fileWriteBatch.length) {
                const fileBatch = this.fileWriteBatch.splice(0, this.fileWriteBatch.length);
                try {
                    await this.indexedDB.runInTransaction(this.store, 'readwrite', objectStore => fileBatch.map(entry => {
                        return objectStore.put(entry.content, entry.resource.path);
                    }));
                }
                catch (ex) {
                    if (ex instanceof DOMException && ex.name === 'QuotaExceededError') {
                        throw ERR_FILE_EXCEEDS_STORAGE_QUOTA;
                    }
                    throw ex;
                }
            }
        }
        async deleteKeys(keys) {
            if (keys.length) {
                await this.indexedDB.runInTransaction(this.store, 'readwrite', objectStore => keys.map(key => objectStore.delete(key)));
            }
        }
        async reset() {
            await this.indexedDB.runInTransaction(this.store, 'readwrite', objectStore => objectStore.clear());
        }
        reportError(operation, error) {
            this._onReportError.fire({ scheme: this.scheme, operation, code: error instanceof files_1.FileSystemProviderError || error instanceof indexedDB_1.DBClosedError ? error.code : 'unknown' });
        }
    }
    exports.IndexedDBFileSystemProvider = IndexedDBFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlZERCRmlsZVN5c3RlbVByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvYnJvd3Nlci9pbmRleGVkREJGaWxlU3lzdGVtUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNEJoRyxvR0FBb0c7SUFDcEcsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLHFDQUE2QixFQUFDLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxxQkFBcUIsQ0FBQyxFQUFFLG1DQUEyQixDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3JKLE1BQU0sZUFBZSxHQUFHLElBQUEscUNBQTZCLEVBQUMsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsbUJBQW1CLENBQUMsRUFBRSxtQ0FBMkIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3RKLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSxxQ0FBNkIsRUFBQyxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSx5QkFBeUIsQ0FBQyxFQUFFLG1DQUEyQixDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDL0osTUFBTSxpQkFBaUIsR0FBRyxJQUFBLHFDQUE2QixFQUFDLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSx3QkFBd0IsQ0FBQyxFQUFFLG1DQUEyQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2xKLE1BQU0sOEJBQThCLEdBQUcsSUFBQSxxQ0FBNkIsRUFBQyxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSxzQ0FBc0MsQ0FBQyxFQUFFLG1DQUEyQixDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFFdk0sNEJBQTRCO0lBQzVCLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxPQUFlLEVBQUUsRUFBRSxDQUFDLElBQUEscUNBQTZCLEVBQUMsSUFBQSxjQUFRLEVB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