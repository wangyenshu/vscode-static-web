/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/stream", "vs/platform/files/common/files", "vs/platform/files/browser/webFileSystemAccess"], function (require, exports, nls_1, uri_1, buffer_1, event_1, lifecycle_1, network_1, path_1, platform_1, resources_1, stream_1, files_1, webFileSystemAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HTMLFileSystemProvider = void 0;
    class HTMLFileSystemProvider {
        get capabilities() {
            if (!this._capabilities) {
                this._capabilities =
                    2 /* FileSystemProviderCapabilities.FileReadWrite */ |
                        16 /* FileSystemProviderCapabilities.FileReadStream */;
                if (platform_1.isLinux) {
                    this._capabilities |= 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                }
            }
            return this._capabilities;
        }
        //#endregion
        constructor(indexedDB, store, logService) {
            this.indexedDB = indexedDB;
            this.store = store;
            this.logService = logService;
            //#region Events (unsupported)
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
            //#endregion
            //#region File Capabilities
            this.extUri = platform_1.isLinux ? resources_1.extUri : resources_1.extUriIgnorePathCase;
            //#endregion
            //#region File/Directoy Handle Registry
            this._files = new Map();
            this._directories = new Map();
        }
        //#region File Metadata Resolving
        async stat(resource) {
            try {
                const handle = await this.getHandle(resource);
                if (!handle) {
                    throw this.createFileSystemProviderError(resource, 'No such file or directory, stat', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(handle)) {
                    const file = await handle.getFile();
                    return {
                        type: files_1.FileType.File,
                        mtime: file.lastModified,
                        ctime: 0,
                        size: file.size
                    };
                }
                return {
                    type: files_1.FileType.Directory,
                    mtime: 0,
                    ctime: 0,
                    size: 0
                };
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async readdir(resource) {
            try {
                const handle = await this.getDirectoryHandle(resource);
                if (!handle) {
                    throw this.createFileSystemProviderError(resource, 'No such file or directory, readdir', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                const result = [];
                for await (const [name, child] of handle) {
                    result.push([name, webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(child) ? files_1.FileType.File : files_1.FileType.Directory]);
                }
                return result;
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        //#endregion
        //#region File Reading/Writing
        readFileStream(resource, opts, token) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer, {
                // Set a highWaterMark to prevent the stream
                // for file upload to produce large buffers
                // in-memory
                highWaterMark: 10
            });
            (async () => {
                try {
                    const handle = await this.getFileHandle(resource);
                    if (!handle) {
                        throw this.createFileSystemProviderError(resource, 'No such file or directory, readFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                    }
                    const file = await handle.getFile();
                    // Partial file: implemented simply via `readFile`
                    if (typeof opts.length === 'number' || typeof opts.position === 'number') {
                        let buffer = new Uint8Array(await file.arrayBuffer());
                        if (typeof opts?.position === 'number') {
                            buffer = buffer.slice(opts.position);
                        }
                        if (typeof opts?.length === 'number') {
                            buffer = buffer.slice(0, opts.length);
                        }
                        stream.end(buffer);
                    }
                    // Entire file
                    else {
                        const reader = file.stream().getReader();
                        let res = await reader.read();
                        while (!res.done) {
                            if (token.isCancellationRequested) {
                                break;
                            }
                            // Write buffer into stream but make sure to wait
                            // in case the `highWaterMark` is reached
                            await stream.write(res.value);
                            if (token.isCancellationRequested) {
                                break;
                            }
                            res = await reader.read();
                        }
                        stream.end(undefined);
                    }
                }
                catch (error) {
                    stream.error(this.toFileSystemProviderError(error));
                    stream.end();
                }
            })();
            return stream;
        }
        async readFile(resource) {
            try {
                const handle = await this.getFileHandle(resource);
                if (!handle) {
                    throw this.createFileSystemProviderError(resource, 'No such file or directory, readFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                const file = await handle.getFile();
                return new Uint8Array(await file.arrayBuffer());
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async writeFile(resource, content, opts) {
            try {
                let handle = await this.getFileHandle(resource);
                // Validate target unless { create: true, overwrite: true }
                if (!opts.create || !opts.overwrite) {
                    if (handle) {
                        if (!opts.overwrite) {
                            throw this.createFileSystemProviderError(resource, 'File already exists, writeFile', files_1.FileSystemProviderErrorCode.FileExists);
                        }
                    }
                    else {
                        if (!opts.create) {
                            throw this.createFileSystemProviderError(resource, 'No such file, writeFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                        }
                    }
                }
                // Create target as needed
                if (!handle) {
                    const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                    if (!parent) {
                        throw this.createFileSystemProviderError(resource, 'No such parent directory, writeFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                    }
                    handle = await parent.getFileHandle(this.extUri.basename(resource), { create: true });
                    if (!handle) {
                        throw this.createFileSystemProviderError(resource, 'Unable to create file , writeFile', files_1.FileSystemProviderErrorCode.Unknown);
                    }
                }
                // Write to target overwriting any existing contents
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        async mkdir(resource) {
            try {
                const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                if (!parent) {
                    throw this.createFileSystemProviderError(resource, 'No such parent directory, mkdir', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                await parent.getDirectoryHandle(this.extUri.basename(resource), { create: true });
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async delete(resource, opts) {
            try {
                const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                if (!parent) {
                    throw this.createFileSystemProviderError(resource, 'No such parent directory, delete', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                return parent.removeEntry(this.extUri.basename(resource), { recursive: opts.recursive });
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async rename(from, to, opts) {
            try {
                if (this.extUri.isEqual(from, to)) {
                    return; // no-op if the paths are the same
                }
                // Implement file rename by write + delete
                const fileHandle = await this.getFileHandle(from);
                if (fileHandle) {
                    const file = await fileHandle.getFile();
                    const contents = new Uint8Array(await file.arrayBuffer());
                    await this.writeFile(to, contents, { create: true, overwrite: opts.overwrite, unlock: false, atomic: false });
                    await this.delete(from, { recursive: false, useTrash: false, atomic: false });
                }
                // File API does not support any real rename otherwise
                else {
                    throw this.createFileSystemProviderError(from, (0, nls_1.localize)('fileSystemRenameError', "Rename is only supported for files."), files_1.FileSystemProviderErrorCode.Unavailable);
                }
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        //#endregion
        //#region File Watching (unsupported)
        watch(resource, opts) {
            return lifecycle_1.Disposable.None;
        }
        registerFileHandle(handle) {
            return this.registerHandle(handle, this._files);
        }
        registerDirectoryHandle(handle) {
            return this.registerHandle(handle, this._directories);
        }
        get directories() {
            return this._directories.values();
        }
        async registerHandle(handle, map) {
            let handleId = `/${handle.name}`;
            // Compute a valid handle ID in case this exists already
            if (map.has(handleId) && !await map.get(handleId)?.isSameEntry(handle)) {
                const fileExt = (0, path_1.extname)(handle.name);
                const fileName = (0, path_1.basename)(handle.name, fileExt);
                let handleIdCounter = 1;
                do {
                    handleId = `/${fileName}-${handleIdCounter++}${fileExt}`;
                } while (map.has(handleId) && !await map.get(handleId)?.isSameEntry(handle));
            }
            map.set(handleId, handle);
            // Remember in IndexDB for future lookup
            try {
                await this.indexedDB?.runInTransaction(this.store, 'readwrite', objectStore => objectStore.put(handle, handleId));
            }
            catch (error) {
                this.logService.error(error);
            }
            return uri_1.URI.from({ scheme: network_1.Schemas.file, path: handleId });
        }
        async getHandle(resource) {
            // First: try to find a well known handle first
            let handle = await this.doGetHandle(resource);
            // Second: walk up parent directories and resolve handle if possible
            if (!handle) {
                const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                if (parent) {
                    const name = resources_1.extUri.basename(resource);
                    try {
                        handle = await parent.getFileHandle(name);
                    }
                    catch (error) {
                        try {
                            handle = await parent.getDirectoryHandle(name);
                        }
                        catch (error) {
                            // Ignore
                        }
                    }
                }
            }
            return handle;
        }
        async getFileHandle(resource) {
            const handle = await this.doGetHandle(resource);
            if (handle instanceof FileSystemFileHandle) {
                return handle;
            }
            const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
            try {
                return await parent?.getFileHandle(resources_1.extUri.basename(resource));
            }
            catch (error) {
                return undefined; // guard against possible DOMException
            }
        }
        async getDirectoryHandle(resource) {
            const handle = await this.doGetHandle(resource);
            if (handle instanceof FileSystemDirectoryHandle) {
                return handle;
            }
            const parentUri = this.extUri.dirname(resource);
            if (this.extUri.isEqual(parentUri, resource)) {
                return undefined; // return when root is reached to prevent infinite recursion
            }
            const parent = await this.getDirectoryHandle(parentUri);
            try {
                return await parent?.getDirectoryHandle(resources_1.extUri.basename(resource));
            }
            catch (error) {
                return undefined; // guard against possible DOMException
            }
        }
        async doGetHandle(resource) {
            // We store file system handles with the `handle.name`
            // and as such require the resource to be on the root
            if (this.extUri.dirname(resource).path !== '/') {
                return undefined;
            }
            const handleId = resource.path.replace(/\/$/, ''); // remove potential slash from the end of the path
            // First: check if we have a known handle stored in memory
            const inMemoryHandle = this._files.get(handleId) ?? this._directories.get(handleId);
            if (inMemoryHandle) {
                return inMemoryHandle;
            }
            // Second: check if we have a persisted handle in IndexedDB
            const persistedHandle = await this.indexedDB?.runInTransaction(this.store, 'readonly', store => store.get(handleId));
            if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemHandle(persistedHandle)) {
                let hasPermissions = await persistedHandle.queryPermission() === 'granted';
                try {
                    if (!hasPermissions) {
                        hasPermissions = await persistedHandle.requestPermission() === 'granted';
                    }
                }
                catch (error) {
                    this.logService.error(error); // this can fail with a DOMException
                }
                if (hasPermissions) {
                    if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(persistedHandle)) {
                        this._files.set(handleId, persistedHandle);
                    }
                    else if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(persistedHandle)) {
                        this._directories.set(handleId, persistedHandle);
                    }
                    return persistedHandle;
                }
            }
            // Third: fail with an error
            throw this.createFileSystemProviderError(resource, 'No file system handle registered', files_1.FileSystemProviderErrorCode.Unavailable);
        }
        //#endregion
        toFileSystemProviderError(error) {
            if (error instanceof files_1.FileSystemProviderError) {
                return error; // avoid double conversion
            }
            let code = files_1.FileSystemProviderErrorCode.Unknown;
            if (error.name === 'NotAllowedError') {
                error = new Error((0, nls_1.localize)('fileSystemNotAllowedError', "Insufficient permissions. Please retry and allow the operation."));
                code = files_1.FileSystemProviderErrorCode.Unavailable;
            }
            return (0, files_1.createFileSystemProviderError)(error, code);
        }
        createFileSystemProviderError(resource, msg, code) {
            return (0, files_1.createFileSystemProviderError)(new Error(`${msg} (${(0, path_1.normalize)(resource.path)})`), code);
        }
    }
    exports.HTMLFileSystemProvider = HTMLFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbEZpbGVTeXN0ZW1Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL2Jyb3dzZXIvaHRtbEZpbGVTeXN0ZW1Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLE1BQWEsc0JBQXNCO1FBY2xDLElBQUksWUFBWTtZQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxhQUFhO29CQUNqQjs4RUFDNkMsQ0FBQztnQkFFL0MsSUFBSSxrQkFBTyxFQUFFLENBQUM7b0JBQ2IsSUFBSSxDQUFDLGFBQWEsK0RBQW9ELENBQUM7Z0JBQ3hFLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7UUFFRCxZQUFZO1FBR1osWUFDUyxTQUFnQyxFQUN2QixLQUFhLEVBQ3RCLFVBQXVCO1lBRnZCLGNBQVMsR0FBVCxTQUFTLENBQXVCO1lBQ3ZCLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDdEIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQWhDaEMsOEJBQThCO1lBRXJCLDRCQUF1QixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDckMsb0JBQWUsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBRXRDLFlBQVk7WUFFWiwyQkFBMkI7WUFFbkIsV0FBTSxHQUFHLGtCQUFPLENBQUMsQ0FBQyxDQUFDLGtCQUFNLENBQUMsQ0FBQyxDQUFDLGdDQUFvQixDQUFDO1lBb1F6RCxZQUFZO1lBRVosdUNBQXVDO1lBRXRCLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBZ0MsQ0FBQztZQUNqRCxpQkFBWSxHQUFHLElBQUksR0FBRyxFQUFxQyxDQUFDO1FBalB6RSxDQUFDO1FBRUwsaUNB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