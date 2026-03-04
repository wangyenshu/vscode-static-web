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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/ternarySearchTree", "vs/base/common/network", "vs/base/common/performance", "vs/base/common/resources", "vs/base/common/stream", "vs/nls", "vs/platform/files/common/files", "vs/platform/files/common/io", "vs/platform/log/common/log", "vs/base/common/errors"], function (require, exports, arrays_1, async_1, buffer_1, cancellation_1, event_1, hash_1, iterator_1, lifecycle_1, ternarySearchTree_1, network_1, performance_1, resources_1, stream_1, nls_1, files_1, io_1, log_1, errors_1) {
    "use strict";
    var FileService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileService = void 0;
    let FileService = class FileService extends lifecycle_1.Disposable {
        static { FileService_1 = this; }
        constructor(logService) {
            super();
            this.logService = logService;
            // Choose a buffer size that is a balance between memory needs and
            // manageable IPC overhead. The larger the buffer size, the less
            // roundtrips we have to do for reading/writing data.
            this.BUFFER_SIZE = 256 * 1024;
            //#region File System Provider
            this._onDidChangeFileSystemProviderRegistrations = this._register(new event_1.Emitter());
            this.onDidChangeFileSystemProviderRegistrations = this._onDidChangeFileSystemProviderRegistrations.event;
            this._onWillActivateFileSystemProvider = this._register(new event_1.Emitter());
            this.onWillActivateFileSystemProvider = this._onWillActivateFileSystemProvider.event;
            this._onDidChangeFileSystemProviderCapabilities = this._register(new event_1.Emitter());
            this.onDidChangeFileSystemProviderCapabilities = this._onDidChangeFileSystemProviderCapabilities.event;
            this.provider = new Map();
            //#endregion
            //#region Operation events
            this._onDidRunOperation = this._register(new event_1.Emitter());
            this.onDidRunOperation = this._onDidRunOperation.event;
            //#endregion
            //#region File Watching
            this.internalOnDidFilesChange = this._register(new event_1.Emitter());
            this._onDidUncorrelatedFilesChange = this._register(new event_1.Emitter());
            this.onDidFilesChange = this._onDidUncorrelatedFilesChange.event; // global `onDidFilesChange` skips correlated events
            this._onDidWatchError = this._register(new event_1.Emitter());
            this.onDidWatchError = this._onDidWatchError.event;
            this.activeWatchers = new Map();
            //#endregion
            //#region Helpers
            this.writeQueue = this._register(new async_1.ResourceQueue());
        }
        registerProvider(scheme, provider) {
            if (this.provider.has(scheme)) {
                throw new Error(`A filesystem provider for the scheme '${scheme}' is already registered.`);
            }
            (0, performance_1.mark)(`code/registerFilesystem/${scheme}`);
            const providerDisposables = new lifecycle_1.DisposableStore();
            // Add provider with event
            this.provider.set(scheme, provider);
            this._onDidChangeFileSystemProviderRegistrations.fire({ added: true, scheme, provider });
            // Forward events from provider
            providerDisposables.add(provider.onDidChangeFile(changes => {
                const event = new files_1.FileChangesEvent(changes, !this.isPathCaseSensitive(provider));
                // Always emit any event internally
                this.internalOnDidFilesChange.fire(event);
                // Only emit uncorrelated events in the global `onDidFilesChange` event
                if (!event.hasCorrelation()) {
                    this._onDidUncorrelatedFilesChange.fire(event);
                }
            }));
            if (typeof provider.onDidWatchError === 'function') {
                providerDisposables.add(provider.onDidWatchError(error => this._onDidWatchError.fire(new Error(error))));
            }
            providerDisposables.add(provider.onDidChangeCapabilities(() => this._onDidChangeFileSystemProviderCapabilities.fire({ provider, scheme })));
            return (0, lifecycle_1.toDisposable)(() => {
                this._onDidChangeFileSystemProviderRegistrations.fire({ added: false, scheme, provider });
                this.provider.delete(scheme);
                (0, lifecycle_1.dispose)(providerDisposables);
            });
        }
        getProvider(scheme) {
            return this.provider.get(scheme);
        }
        async activateProvider(scheme) {
            // Emit an event that we are about to activate a provider with the given scheme.
            // Listeners can participate in the activation by registering a provider for it.
            const joiners = [];
            this._onWillActivateFileSystemProvider.fire({
                scheme,
                join(promise) {
                    joiners.push(promise);
                },
            });
            if (this.provider.has(scheme)) {
                return; // provider is already here so we can return directly
            }
            // If the provider is not yet there, make sure to join on the listeners assuming
            // that it takes a bit longer to register the file system provider.
            await async_1.Promises.settled(joiners);
        }
        async canHandleResource(resource) {
            // Await activation of potentially extension contributed providers
            await this.activateProvider(resource.scheme);
            return this.hasProvider(resource);
        }
        hasProvider(resource) {
            return this.provider.has(resource.scheme);
        }
        hasCapability(resource, capability) {
            const provider = this.provider.get(resource.scheme);
            return !!(provider && (provider.capabilities & capability));
        }
        listCapabilities() {
            return iterator_1.Iterable.map(this.provider, ([scheme, provider]) => ({ scheme, capabilities: provider.capabilities }));
        }
        async withProvider(resource) {
            // Assert path is absolute
            if (!(0, resources_1.isAbsolutePath)(resource)) {
                throw new files_1.FileOperationError((0, nls_1.localize)('invalidPath', "Unable to resolve filesystem provider with relative file path '{0}'", this.resourceForError(resource)), 8 /* FileOperationResult.FILE_INVALID_PATH */);
            }
            // Activate provider
            await this.activateProvider(resource.scheme);
            // Assert provider
            const provider = this.provider.get(resource.scheme);
            if (!provider) {
                const error = new errors_1.ErrorNoTelemetry();
                error.message = (0, nls_1.localize)('noProviderFound', "ENOPRO: No file system provider found for resource '{0}'", resource.toString());
                throw error;
            }
            return provider;
        }
        async withReadProvider(resource) {
            const provider = await this.withProvider(resource);
            if ((0, files_1.hasOpenReadWriteCloseCapability)(provider) || (0, files_1.hasReadWriteCapability)(provider) || (0, files_1.hasFileReadStreamCapability)(provider)) {
                return provider;
            }
            throw new Error(`Filesystem provider for scheme '${resource.scheme}' neither has FileReadWrite, FileReadStream nor FileOpenReadWriteClose capability which is needed for the read operation.`);
        }
        async withWriteProvider(resource) {
            const provider = await this.withProvider(resource);
            if ((0, files_1.hasOpenReadWriteCloseCapability)(provider) || (0, files_1.hasReadWriteCapability)(provider)) {
                return provider;
            }
            throw new Error(`Filesystem provider for scheme '${resource.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the write operation.`);
        }
        async resolve(resource, options) {
            try {
                return await this.doResolveFile(resource, options);
            }
            catch (error) {
                // Specially handle file not found case as file operation result
                if ((0, files_1.toFileSystemProviderErrorCode)(error) === files_1.FileSystemProviderErrorCode.FileNotFound) {
                    throw new files_1.FileOperationError((0, nls_1.localize)('fileNotFoundError', "Unable to resolve nonexistent file '{0}'", this.resourceForError(resource)), 1 /* FileOperationResult.FILE_NOT_FOUND */);
                }
                // Bubble up any other error as is
                throw (0, files_1.ensureFileSystemProviderError)(error);
            }
        }
        async doResolveFile(resource, options) {
            const provider = await this.withProvider(resource);
            const isPathCaseSensitive = this.isPathCaseSensitive(provider);
            const resolveTo = options?.resolveTo;
            const resolveSingleChildDescendants = options?.resolveSingleChildDescendants;
            const resolveMetadata = options?.resolveMetadata;
            const stat = await provider.stat(resource);
            let trie;
            return this.toFileStat(provider, resource, stat, undefined, !!resolveMetadata, (stat, siblings) => {
                // lazy trie to check for recursive resolving
                if (!trie) {
                    trie = ternarySearchTree_1.TernarySearchTree.forUris(() => !isPathCaseSensitive);
                    trie.set(resource, true);
                    if (resolveTo) {
                        trie.fill(true, resolveTo);
                    }
                }
                // check for recursive resolving
                if (trie.get(stat.resource) || trie.findSuperstr(stat.resource.with({ query: null, fragment: null } /* required for https://github.com/microsoft/vscode/issues/128151 */))) {
                    return true;
                }
                // check for resolving single child folders
                if (stat.isDirectory && resolveSingleChildDescendants) {
                    return siblings === 1;
                }
                return false;
            });
        }
        async toFileStat(provider, resource, stat, siblings, resolveMetadata, recurse) {
            const { providerExtUri } = this.getExtUri(provider);
            // convert to file stat
            const fileStat = {
                resource,
                name: providerExtUri.basename(resource),
                isFile: (stat.type & files_1.FileType.File) !== 0,
                isDirectory: (stat.type & files_1.FileType.Directory) !== 0,
                isSymbolicLink: (stat.type & files_1.FileType.SymbolicLink) !== 0,
                mtime: stat.mtime,
                ctime: stat.ctime,
                size: stat.size,
                readonly: Boolean((stat.permissions ?? 0) & files_1.FilePermission.Readonly) || Boolean(provider.capabilities & 2048 /* FileSystemProviderCapabilities.Readonly */),
                locked: Boolean((stat.permissions ?? 0) & files_1.FilePermission.Locked),
                etag: (0, files_1.etag)({ mtime: stat.mtime, size: stat.size }),
                children: undefined
            };
            // check to recurse for directories
            if (fileStat.isDirectory && recurse(fileStat, siblings)) {
                try {
                    const entries = await provider.readdir(resource);
                    const resolvedEntries = await async_1.Promises.settled(entries.map(async ([name, type]) => {
                        try {
                            const childResource = providerExtUri.joinPath(resource, name);
                            const childStat = resolveMetadata ? await provider.stat(childResource) : { type };
                            return await this.toFileStat(provider, childResource, childStat, entries.length, resolveMetadata, recurse);
                        }
                        catch (error) {
                            this.logService.trace(error);
                            return null; // can happen e.g. due to permission errors
                        }
                    }));
                    // make sure to get rid of null values that signal a failure to resolve a particular entry
                    fileStat.children = (0, arrays_1.coalesce)(resolvedEntries);
                }
                catch (error) {
                    this.logService.trace(error);
                    fileStat.children = []; // gracefully handle errors, we may not have permissions to read
                }
                return fileStat;
            }
            return fileStat;
        }
        async resolveAll(toResolve) {
            return async_1.Promises.settled(toResolve.map(async (entry) => {
                try {
                    return { stat: await this.doResolveFile(entry.resource, entry.options), success: true };
                }
                catch (error) {
                    this.logService.trace(error);
                    return { stat: undefined, success: false };
                }
            }));
        }
        async stat(resource) {
            const provider = await this.withProvider(resource);
            const stat = await provider.stat(resource);
            return this.toFileStat(provider, resource, stat, undefined, true, () => false /* Do not resolve any children */);
        }
        async exists(resource) {
            const provider = await this.withProvider(resource);
            try {
                const stat = await provider.stat(resource);
                return !!stat;
            }
            catch (error) {
                return false;
            }
        }
        //#endregion
        //#region File Reading/Writing
        async canCreateFile(resource, options) {
            try {
                await this.doValidateCreateFile(resource, options);
            }
            catch (error) {
                return error;
            }
            return true;
        }
        async doValidateCreateFile(resource, options) {
            // validate overwrite
            if (!options?.overwrite && await this.exists(resource)) {
                throw new files_1.FileOperationError((0, nls_1.localize)('fileExists', "Unable to create file '{0}' that already exists when overwrite flag is not set", this.resourceForError(resource)), 3 /* FileOperationResult.FILE_MODIFIED_SINCE */, options);
            }
        }
        async createFile(resource, bufferOrReadableOrStream = buffer_1.VSBuffer.fromString(''), options) {
            // validate
            await this.doValidateCreateFile(resource, options);
            // do write into file (this will create it too)
            const fileStat = await this.writeFile(resource, bufferOrReadableOrStream);
            // events
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(resource, 0 /* FileOperation.CREATE */, fileStat));
            return fileStat;
        }
        async writeFile(resource, bufferOrReadableOrStream, options) {
            const provider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(resource), resource);
            const { providerExtUri } = this.getExtUri(provider);
            let writeFileOptions = options;
            if ((0, files_1.hasFileAtomicWriteCapability)(provider) && !writeFileOptions?.atomic) {
                const enforcedAtomicWrite = provider.enforceAtomicWriteFile?.(resource);
                if (enforcedAtomicWrite) {
                    writeFileOptions = { ...options, atomic: enforcedAtomicWrite };
                }
            }
            try {
                // validate write
                const stat = await this.validateWriteFile(provider, resource, writeFileOptions);
                // mkdir recursively as needed
                if (!stat) {
                    await this.mkdirp(provider, providerExtUri.dirname(resource));
                }
                // optimization: if the provider has unbuffered write capability and the data
                // to write is not a buffer, we consume up to 3 chunks and try to write the data
                // unbuffered to reduce the overhead. If the stream or readable has more data
                // to provide we continue to write buffered.
                let bufferOrReadableOrStreamOrBufferedStream;
                if ((0, files_1.hasReadWriteCapability)(provider) && !(bufferOrReadableOrStream instanceof buffer_1.VSBuffer)) {
                    if ((0, stream_1.isReadableStream)(bufferOrReadableOrStream)) {
                        const bufferedStream = await (0, stream_1.peekStream)(bufferOrReadableOrStream, 3);
                        if (bufferedStream.ended) {
                            bufferOrReadableOrStreamOrBufferedStream = buffer_1.VSBuffer.concat(bufferedStream.buffer);
                        }
                        else {
                            bufferOrReadableOrStreamOrBufferedStream = bufferedStream;
                        }
                    }
                    else {
                        bufferOrReadableOrStreamOrBufferedStream = (0, stream_1.peekReadable)(bufferOrReadableOrStream, data => buffer_1.VSBuffer.concat(data), 3);
                    }
                }
                else {
                    bufferOrReadableOrStreamOrBufferedStream = bufferOrReadableOrStream;
                }
                // write file: unbuffered
                if (!(0, files_1.hasOpenReadWriteCloseCapability)(provider) || // buffered writing is unsupported
                    ((0, files_1.hasReadWriteCapability)(provider) && bufferOrReadableOrStreamOrBufferedStream instanceof buffer_1.VSBuffer) || // data is a full buffer already
                    ((0, files_1.hasReadWriteCapability)(provider) && (0, files_1.hasFileAtomicWriteCapability)(provider) && writeFileOptions?.atomic) // atomic write forces unbuffered write if the provider supports it
                ) {
                    await this.doWriteUnbuffered(provider, resource, writeFileOptions, bufferOrReadableOrStreamOrBufferedStream);
                }
                // write file: buffered
                else {
                    await this.doWriteBuffered(provider, resource, writeFileOptions, bufferOrReadableOrStreamOrBufferedStream instanceof buffer_1.VSBuffer ? (0, buffer_1.bufferToReadable)(bufferOrReadableOrStreamOrBufferedStream) : bufferOrReadableOrStreamOrBufferedStream);
                }
                // events
                this._onDidRunOperation.fire(new files_1.FileOperationEvent(resource, 4 /* FileOperation.WRITE */));
            }
            catch (error) {
                throw new files_1.FileOperationError((0, nls_1.localize)('err.write', "Unable to write file '{0}' ({1})", this.resourceForError(resource), (0, files_1.ensureFileSystemProviderError)(error).toString()), (0, files_1.toFileOperationResult)(error), writeFileOptions);
            }
            return this.resolve(resource, { resolveMetadata: true });
        }
        async validateWriteFile(provider, resource, options) {
            // Validate unlock support
            const unlock = !!options?.unlock;
            if (unlock && !(provider.capabilities & 8192 /* FileSystemProviderCapabilities.FileWriteUnlock */)) {
                throw new Error((0, nls_1.localize)('writeFailedUnlockUnsupported', "Unable to unlock file '{0}' because provider does not support it.", this.resourceForError(resource)));
            }
            // Validate atomic support
            const atomic = !!options?.atomic;
            if (atomic) {
                if (!(provider.capabilities & 32768 /* FileSystemProviderCapabilities.FileAtomicWrite */)) {
                    throw new Error((0, nls_1.localize)('writeFailedAtomicUnsupported1', "Unable to atomically write file '{0}' because provider does not support it.", this.resourceForError(resource)));
                }
                if (!(provider.capabilities & 2 /* FileSystemProviderCapabilities.FileReadWrite */)) {
                    throw new Error((0, nls_1.localize)('writeFailedAtomicUnsupported2', "Unable to atomically write file '{0}' because provider does not support unbuffered writes.", this.resourceForError(resource)));
                }
                if (unlock) {
                    throw new Error((0, nls_1.localize)('writeFailedAtomicUnlock', "Unable to unlock file '{0}' because atomic write is enabled.", this.resourceForError(resource)));
                }
            }
            // Validate via file stat meta data
            let stat = undefined;
            try {
                stat = await provider.stat(resource);
            }
            catch (error) {
                return undefined; // file might not exist
            }
            // File cannot be directory
            if ((stat.type & files_1.FileType.Directory) !== 0) {
                throw new files_1.FileOperationError((0, nls_1.localize)('fileIsDirectoryWriteError', "Unable to write file '{0}' that is actually a directory", this.resourceForError(resource)), 0 /* FileOperationResult.FILE_IS_DIRECTORY */, options);
            }
            // File cannot be readonly
            this.throwIfFileIsReadonly(resource, stat);
            // Dirty write prevention: if the file on disk has been changed and does not match our expected
            // mtime and etag, we bail out to prevent dirty writing.
            //
            // First, we check for a mtime that is in the future before we do more checks. The assumption is
            // that only the mtime is an indicator for a file that has changed on disk.
            //
            // Second, if the mtime has advanced, we compare the size of the file on disk with our previous
            // one using the etag() function. Relying only on the mtime check has prooven to produce false
            // positives due to file system weirdness (especially around remote file systems). As such, the
            // check for size is a weaker check because it can return a false negative if the file has changed
            // but to the same length. This is a compromise we take to avoid having to produce checksums of
            // the file content for comparison which would be much slower to compute.
            if (typeof options?.mtime === 'number' && typeof options.etag === 'string' && options.etag !== files_1.ETAG_DISABLED &&
                typeof stat.mtime === 'number' && typeof stat.size === 'number' &&
                options.mtime < stat.mtime && options.etag !== (0, files_1.etag)({ mtime: options.mtime /* not using stat.mtime for a reason, see above */, size: stat.size })) {
                throw new files_1.FileOperationError((0, nls_1.localize)('fileModifiedError', "File Modified Since"), 3 /* FileOperationResult.FILE_MODIFIED_SINCE */, options);
            }
            return stat;
        }
        async readFile(resource, options, token) {
            const provider = await this.withReadProvider(resource);
            if (options?.atomic) {
                return this.doReadFileAtomic(provider, resource, options, token);
            }
            return this.doReadFile(provider, resource, options, token);
        }
        async doReadFileAtomic(provider, resource, options, token) {
            return new Promise((resolve, reject) => {
                this.writeQueue.queueFor(resource, async () => {
                    try {
                        const content = await this.doReadFile(provider, resource, options, token);
                        resolve(content);
                    }
                    catch (error) {
                        reject(error);
                    }
                }, this.getExtUri(provider).providerExtUri);
            });
        }
        async doReadFile(provider, resource, options, token) {
            const stream = await this.doReadFileStream(provider, resource, {
                ...options,
                // optimization: since we know that the caller does not
                // care about buffering, we indicate this to the reader.
                // this reduces all the overhead the buffered reading
                // has (open, read, close) if the provider supports
                // unbuffered reading.
                preferUnbuffered: true
            }, token);
            return {
                ...stream,
                value: await (0, buffer_1.streamToBuffer)(stream.value)
            };
        }
        async readFileStream(resource, options, token) {
            const provider = await this.withReadProvider(resource);
            return this.doReadFileStream(provider, resource, options, token);
        }
        async doReadFileStream(provider, resource, options, token) {
            // install a cancellation token that gets cancelled
            // when any error occurs. this allows us to resolve
            // the content of the file while resolving metadata
            // but still cancel the operation in certain cases.
            //
            // in addition, we pass the optional token in that
            // we got from the outside to even allow for external
            // cancellation of the read operation.
            const cancellableSource = new cancellation_1.CancellationTokenSource(token);
            let readFileOptions = options;
            if ((0, files_1.hasFileAtomicReadCapability)(provider) && provider.enforceAtomicReadFile?.(resource)) {
                readFileOptions = { ...options, atomic: true };
            }
            // validate read operation
            const statPromise = this.validateReadFile(resource, readFileOptions).then(stat => stat, error => {
                cancellableSource.dispose(true);
                throw error;
            });
            let fileStream = undefined;
            try {
                // if the etag is provided, we await the result of the validation
                // due to the likelihood of hitting a NOT_MODIFIED_SINCE result.
                // otherwise, we let it run in parallel to the file reading for
                // optimal startup performance.
                if (typeof readFileOptions?.etag === 'string' && readFileOptions.etag !== files_1.ETAG_DISABLED) {
                    await statPromise;
                }
                // read unbuffered
                if ((readFileOptions?.atomic && (0, files_1.hasFileAtomicReadCapability)(provider)) || // atomic reads are always unbuffered
                    !((0, files_1.hasOpenReadWriteCloseCapability)(provider) || (0, files_1.hasFileReadStreamCapability)(provider)) || // provider has no buffered capability
                    ((0, files_1.hasReadWriteCapability)(provider) && readFileOptions?.preferUnbuffered) // unbuffered read is preferred
                ) {
                    fileStream = this.readFileUnbuffered(provider, resource, readFileOptions);
                }
                // read streamed (always prefer over primitive buffered read)
                else if ((0, files_1.hasFileReadStreamCapability)(provider)) {
                    fileStream = this.readFileStreamed(provider, resource, cancellableSource.token, readFileOptions);
                }
                // read buffered
                else {
                    fileStream = this.readFileBuffered(provider, resource, cancellableSource.token, readFileOptions);
                }
                fileStream.on('end', () => cancellableSource.dispose());
                fileStream.on('error', () => cancellableSource.dispose());
                const fileStat = await statPromise;
                return {
                    ...fileStat,
                    value: fileStream
                };
            }
            catch (error) {
                // Await the stream to finish so that we exit this method
                // in a consistent state with file handles closed
                // (https://github.com/microsoft/vscode/issues/114024)
                if (fileStream) {
                    await (0, stream_1.consumeStream)(fileStream);
                }
                // Re-throw errors as file operation errors but preserve
                // specific errors (such as not modified since)
                throw this.restoreReadError(error, resource, readFileOptions);
            }
        }
        restoreReadError(error, resource, options) {
            const message = (0, nls_1.localize)('err.read', "Unable to read file '{0}' ({1})", this.resourceForError(resource), (0, files_1.ensureFileSystemProviderError)(error).toString());
            if (error instanceof files_1.NotModifiedSinceFileOperationError) {
                return new files_1.NotModifiedSinceFileOperationError(message, error.stat, options);
            }
            if (error instanceof files_1.TooLargeFileOperationError) {
                return new files_1.TooLargeFileOperationError(message, error.fileOperationResult, error.size, error.options);
            }
            return new files_1.FileOperationError(message, (0, files_1.toFileOperationResult)(error), options);
        }
        readFileStreamed(provider, resource, token, options = Object.create(null)) {
            const fileStream = provider.readFileStream(resource, options, token);
            return (0, stream_1.transform)(fileStream, {
                data: data => data instanceof buffer_1.VSBuffer ? data : buffer_1.VSBuffer.wrap(data),
                error: error => this.restoreReadError(error, resource, options)
            }, data => buffer_1.VSBuffer.concat(data));
        }
        readFileBuffered(provider, resource, token, options = Object.create(null)) {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            (0, io_1.readFileIntoStream)(provider, resource, stream, data => data, {
                ...options,
                bufferSize: this.BUFFER_SIZE,
                errorTransformer: error => this.restoreReadError(error, resource, options)
            }, token);
            return stream;
        }
        readFileUnbuffered(provider, resource, options) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data));
            // Read the file into the stream async but do not wait for
            // this to complete because streams work via events
            (async () => {
                try {
                    let buffer;
                    if (options?.atomic && (0, files_1.hasFileAtomicReadCapability)(provider)) {
                        buffer = await provider.readFile(resource, { atomic: true });
                    }
                    else {
                        buffer = await provider.readFile(resource);
                    }
                    // respect position option
                    if (typeof options?.position === 'number') {
                        buffer = buffer.slice(options.position);
                    }
                    // respect length option
                    if (typeof options?.length === 'number') {
                        buffer = buffer.slice(0, options.length);
                    }
                    // Throw if file is too large to load
                    this.validateReadFileLimits(resource, buffer.byteLength, options);
                    // End stream with data
                    stream.end(buffer_1.VSBuffer.wrap(buffer));
                }
                catch (err) {
                    stream.error(err);
                    stream.end();
                }
            })();
            return stream;
        }
        async validateReadFile(resource, options) {
            const stat = await this.resolve(resource, { resolveMetadata: true });
            // Throw if resource is a directory
            if (stat.isDirectory) {
                throw new files_1.FileOperationError((0, nls_1.localize)('fileIsDirectoryReadError', "Unable to read file '{0}' that is actually a directory", this.resourceForError(resource)), 0 /* FileOperationResult.FILE_IS_DIRECTORY */, options);
            }
            // Throw if file not modified since (unless disabled)
            if (typeof options?.etag === 'string' && options.etag !== files_1.ETAG_DISABLED && options.etag === stat.etag) {
                throw new files_1.NotModifiedSinceFileOperationError((0, nls_1.localize)('fileNotModifiedError', "File not modified since"), stat, options);
            }
            // Throw if file is too large to load
            this.validateReadFileLimits(resource, stat.size, options);
            return stat;
        }
        validateReadFileLimits(resource, size, options) {
            if (typeof options?.limits?.size === 'number' && size > options.limits.size) {
                throw new files_1.TooLargeFileOperationError((0, nls_1.localize)('fileTooLargeError', "Unable to read file '{0}' that is too large to open", this.resourceForError(resource)), 7 /* FileOperationResult.FILE_TOO_LARGE */, size, options);
            }
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        async canMove(source, target, overwrite) {
            return this.doCanMoveCopy(source, target, 'move', overwrite);
        }
        async canCopy(source, target, overwrite) {
            return this.doCanMoveCopy(source, target, 'copy', overwrite);
        }
        async doCanMoveCopy(source, target, mode, overwrite) {
            if (source.toString() !== target.toString()) {
                try {
                    const sourceProvider = mode === 'move' ? this.throwIfFileSystemIsReadonly(await this.withWriteProvider(source), source) : await this.withReadProvider(source);
                    const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
                    await this.doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite);
                }
                catch (error) {
                    return error;
                }
            }
            return true;
        }
        async move(source, target, overwrite) {
            const sourceProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(source), source);
            const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
            // move
            const mode = await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'move', !!overwrite);
            // resolve and send events
            const fileStat = await this.resolve(target, { resolveMetadata: true });
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(source, mode === 'move' ? 2 /* FileOperation.MOVE */ : 3 /* FileOperation.COPY */, fileStat));
            return fileStat;
        }
        async copy(source, target, overwrite) {
            const sourceProvider = await this.withReadProvider(source);
            const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
            // copy
            const mode = await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'copy', !!overwrite);
            // resolve and send events
            const fileStat = await this.resolve(target, { resolveMetadata: true });
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(source, mode === 'copy' ? 3 /* FileOperation.COPY */ : 2 /* FileOperation.MOVE */, fileStat));
            return fileStat;
        }
        async doMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite) {
            if (source.toString() === target.toString()) {
                return mode; // simulate node.js behaviour here and do a no-op if paths match
            }
            // validation
            const { exists, isSameResourceWithDifferentPathCase } = await this.doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite);
            // delete as needed (unless target is same resurce with different path case)
            if (exists && !isSameResourceWithDifferentPathCase && overwrite) {
                await this.del(target, { recursive: true });
            }
            // create parent folders
            await this.mkdirp(targetProvider, this.getExtUri(targetProvider).providerExtUri.dirname(target));
            // copy source => target
            if (mode === 'copy') {
                // same provider with fast copy: leverage copy() functionality
                if (sourceProvider === targetProvider && (0, files_1.hasFileFolderCopyCapability)(sourceProvider)) {
                    await sourceProvider.copy(source, target, { overwrite });
                }
                // when copying via buffer/unbuffered, we have to manually
                // traverse the source if it is a folder and not a file
                else {
                    const sourceFile = await this.resolve(source);
                    if (sourceFile.isDirectory) {
                        await this.doCopyFolder(sourceProvider, sourceFile, targetProvider, target);
                    }
                    else {
                        await this.doCopyFile(sourceProvider, source, targetProvider, target);
                    }
                }
                return mode;
            }
            // move source => target
            else {
                // same provider: leverage rename() functionality
                if (sourceProvider === targetProvider) {
                    await sourceProvider.rename(source, target, { overwrite });
                    return mode;
                }
                // across providers: copy to target & delete at source
                else {
                    await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'copy', overwrite);
                    await this.del(source, { recursive: true });
                    return 'copy';
                }
            }
        }
        async doCopyFile(sourceProvider, source, targetProvider, target) {
            // copy: source (buffered) => target (buffered)
            if ((0, files_1.hasOpenReadWriteCloseCapability)(sourceProvider) && (0, files_1.hasOpenReadWriteCloseCapability)(targetProvider)) {
                return this.doPipeBuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (buffered) => target (unbuffered)
            if ((0, files_1.hasOpenReadWriteCloseCapability)(sourceProvider) && (0, files_1.hasReadWriteCapability)(targetProvider)) {
                return this.doPipeBufferedToUnbuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (unbuffered) => target (buffered)
            if ((0, files_1.hasReadWriteCapability)(sourceProvider) && (0, files_1.hasOpenReadWriteCloseCapability)(targetProvider)) {
                return this.doPipeUnbufferedToBuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (unbuffered) => target (unbuffered)
            if ((0, files_1.hasReadWriteCapability)(sourceProvider) && (0, files_1.hasReadWriteCapability)(targetProvider)) {
                return this.doPipeUnbuffered(sourceProvider, source, targetProvider, target);
            }
        }
        async doCopyFolder(sourceProvider, sourceFolder, targetProvider, targetFolder) {
            // create folder in target
            await targetProvider.mkdir(targetFolder);
            // create children in target
            if (Array.isArray(sourceFolder.children)) {
                await async_1.Promises.settled(sourceFolder.children.map(async (sourceChild) => {
                    const targetChild = this.getExtUri(targetProvider).providerExtUri.joinPath(targetFolder, sourceChild.name);
                    if (sourceChild.isDirectory) {
                        return this.doCopyFolder(sourceProvider, await this.resolve(sourceChild.resource), targetProvider, targetChild);
                    }
                    else {
                        return this.doCopyFile(sourceProvider, sourceChild.resource, targetProvider, targetChild);
                    }
                }));
            }
        }
        async doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite) {
            let isSameResourceWithDifferentPathCase = false;
            // Check if source is equal or parent to target (requires providers to be the same)
            if (sourceProvider === targetProvider) {
                const { providerExtUri, isPathCaseSensitive } = this.getExtUri(sourceProvider);
                if (!isPathCaseSensitive) {
                    isSameResourceWithDifferentPathCase = providerExtUri.isEqual(source, target);
                }
                if (isSameResourceWithDifferentPathCase && mode === 'copy') {
                    throw new Error((0, nls_1.localize)('unableToMoveCopyError1', "Unable to copy when source '{0}' is same as target '{1}' with different path case on a case insensitive file system", this.resourceForError(source), this.resourceForError(target)));
                }
                if (!isSameResourceWithDifferentPathCase && providerExtUri.isEqualOrParent(target, source)) {
                    throw new Error((0, nls_1.localize)('unableToMoveCopyError2', "Unable to move/copy when source '{0}' is parent of target '{1}'.", this.resourceForError(source), this.resourceForError(target)));
                }
            }
            // Extra checks if target exists and this is not a rename
            const exists = await this.exists(target);
            if (exists && !isSameResourceWithDifferentPathCase) {
                // Bail out if target exists and we are not about to overwrite
                if (!overwrite) {
                    throw new files_1.FileOperationError((0, nls_1.localize)('unableToMoveCopyError3', "Unable to move/copy '{0}' because target '{1}' already exists at destination.", this.resourceForError(source), this.resourceForError(target)), 4 /* FileOperationResult.FILE_MOVE_CONFLICT */);
                }
                // Special case: if the target is a parent of the source, we cannot delete
                // it as it would delete the source as well. In this case we have to throw
                if (sourceProvider === targetProvider) {
                    const { providerExtUri } = this.getExtUri(sourceProvider);
                    if (providerExtUri.isEqualOrParent(source, target)) {
                        throw new Error((0, nls_1.localize)('unableToMoveCopyError4', "Unable to move/copy '{0}' into '{1}' since a file would replace the folder it is contained in.", this.resourceForError(source), this.resourceForError(target)));
                    }
                }
            }
            return { exists, isSameResourceWithDifferentPathCase };
        }
        getExtUri(provider) {
            const isPathCaseSensitive = this.isPathCaseSensitive(provider);
            return {
                providerExtUri: isPathCaseSensitive ? resources_1.extUri : resources_1.extUriIgnorePathCase,
                isPathCaseSensitive
            };
        }
        isPathCaseSensitive(provider) {
            return !!(provider.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
        }
        async createFolder(resource) {
            const provider = this.throwIfFileSystemIsReadonly(await this.withProvider(resource), resource);
            // mkdir recursively
            await this.mkdirp(provider, resource);
            // events
            const fileStat = await this.resolve(resource, { resolveMetadata: true });
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(resource, 0 /* FileOperation.CREATE */, fileStat));
            return fileStat;
        }
        async mkdirp(provider, directory) {
            const directoriesToCreate = [];
            // mkdir until we reach root
            const { providerExtUri } = this.getExtUri(provider);
            while (!providerExtUri.isEqual(directory, providerExtUri.dirname(directory))) {
                try {
                    const stat = await provider.stat(directory);
                    if ((stat.type & files_1.FileType.Directory) === 0) {
                        throw new Error((0, nls_1.localize)('mkdirExistsError', "Unable to create folder '{0}' that already exists but is not a directory", this.resourceForError(directory)));
                    }
                    break; // we have hit a directory that exists -> good
                }
                catch (error) {
                    // Bubble up any other error that is not file not found
                    if ((0, files_1.toFileSystemProviderErrorCode)(error) !== files_1.FileSystemProviderErrorCode.FileNotFound) {
                        throw error;
                    }
                    // Upon error, remember directories that need to be created
                    directoriesToCreate.push(providerExtUri.basename(directory));
                    // Continue up
                    directory = providerExtUri.dirname(directory);
                }
            }
            // Create directories as needed
            for (let i = directoriesToCreate.length - 1; i >= 0; i--) {
                directory = providerExtUri.joinPath(directory, directoriesToCreate[i]);
                try {
                    await provider.mkdir(directory);
                }
                catch (error) {
                    if ((0, files_1.toFileSystemProviderErrorCode)(error) !== files_1.FileSystemProviderErrorCode.FileExists) {
                        // For mkdirp() we tolerate that the mkdir() call fails
                        // in case the folder already exists. This follows node.js
                        // own implementation of fs.mkdir({ recursive: true }) and
                        // reduces the chances of race conditions leading to errors
                        // if multiple calls try to create the same folders
                        // As such, we only throw an error here if it is other than
                        // the fact that the file already exists.
                        // (see also https://github.com/microsoft/vscode/issues/89834)
                        throw error;
                    }
                }
            }
        }
        async canDelete(resource, options) {
            try {
                await this.doValidateDelete(resource, options);
            }
            catch (error) {
                return error;
            }
            return true;
        }
        async doValidateDelete(resource, options) {
            const provider = this.throwIfFileSystemIsReadonly(await this.withProvider(resource), resource);
            // Validate trash support
            const useTrash = !!options?.useTrash;
            if (useTrash && !(provider.capabilities & 4096 /* FileSystemProviderCapabilities.Trash */)) {
                throw new Error((0, nls_1.localize)('deleteFailedTrashUnsupported', "Unable to delete file '{0}' via trash because provider does not support it.", this.resourceForError(resource)));
            }
            // Validate atomic support
            const atomic = options?.atomic;
            if (atomic && !(provider.capabilities & 65536 /* FileSystemProviderCapabilities.FileAtomicDelete */)) {
                throw new Error((0, nls_1.localize)('deleteFailedAtomicUnsupported', "Unable to delete file '{0}' atomically because provider does not support it.", this.resourceForError(resource)));
            }
            if (useTrash && atomic) {
                throw new Error((0, nls_1.localize)('deleteFailedTrashAndAtomicUnsupported', "Unable to atomically delete file '{0}' because using trash is enabled.", this.resourceForError(resource)));
            }
            // Validate delete
            let stat = undefined;
            try {
                stat = await provider.stat(resource);
            }
            catch (error) {
                // Handled later
            }
            if (stat) {
                this.throwIfFileIsReadonly(resource, stat);
            }
            else {
                throw new files_1.FileOperationError((0, nls_1.localize)('deleteFailedNotFound', "Unable to delete nonexistent file '{0}'", this.resourceForError(resource)), 1 /* FileOperationResult.FILE_NOT_FOUND */);
            }
            // Validate recursive
            const recursive = !!options?.recursive;
            if (!recursive) {
                const stat = await this.resolve(resource);
                if (stat.isDirectory && Array.isArray(stat.children) && stat.children.length > 0) {
                    throw new Error((0, nls_1.localize)('deleteFailedNonEmptyFolder', "Unable to delete non-empty folder '{0}'.", this.resourceForError(resource)));
                }
            }
            return provider;
        }
        async del(resource, options) {
            const provider = await this.doValidateDelete(resource, options);
            let deleteFileOptions = options;
            if ((0, files_1.hasFileAtomicDeleteCapability)(provider) && !deleteFileOptions?.atomic) {
                const enforcedAtomicDelete = provider.enforceAtomicDelete?.(resource);
                if (enforcedAtomicDelete) {
                    deleteFileOptions = { ...options, atomic: enforcedAtomicDelete };
                }
            }
            const useTrash = !!deleteFileOptions?.useTrash;
            const recursive = !!deleteFileOptions?.recursive;
            const atomic = deleteFileOptions?.atomic ?? false;
            // Delete through provider
            await provider.delete(resource, { recursive, useTrash, atomic });
            // Events
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(resource, 1 /* FileOperation.DELETE */));
        }
        //#endregion
        //#region Clone File
        async cloneFile(source, target) {
            const sourceProvider = await this.withProvider(source);
            const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
            if (sourceProvider === targetProvider && this.getExtUri(sourceProvider).providerExtUri.isEqual(source, target)) {
                return; // return early if paths are equal
            }
            // same provider, use `cloneFile` when native support is provided
            if (sourceProvider === targetProvider && (0, files_1.hasFileCloneCapability)(sourceProvider)) {
                return sourceProvider.cloneFile(source, target);
            }
            // otherwise, either providers are different or there is no native
            // `cloneFile` support, then we fallback to emulate a clone as best
            // as we can with the other primitives
            // create parent folders
            await this.mkdirp(targetProvider, this.getExtUri(targetProvider).providerExtUri.dirname(target));
            // leverage `copy` method if provided and providers are identical
            // queue on the source to ensure atomic read
            if (sourceProvider === targetProvider && (0, files_1.hasFileFolderCopyCapability)(sourceProvider)) {
                return this.writeQueue.queueFor(source, () => sourceProvider.copy(source, target, { overwrite: true }), this.getExtUri(sourceProvider).providerExtUri);
            }
            // otherwise copy via buffer/unbuffered and use a write queue
            // on the source to ensure atomic operation as much as possible
            return this.writeQueue.queueFor(source, () => this.doCopyFile(sourceProvider, source, targetProvider, target), this.getExtUri(sourceProvider).providerExtUri);
        }
        static { this.WATCHER_CORRELATION_IDS = 0; }
        createWatcher(resource, options) {
            return this.watch(resource, {
                ...options,
                // Explicitly set a correlation id so that file events that originate
                // from requests from extensions are exclusively routed back to the
                // extension host and not into the workbench.
                correlationId: FileService_1.WATCHER_CORRELATION_IDS++
            });
        }
        watch(resource, options = { recursive: false, excludes: [] }) {
            const disposables = new lifecycle_1.DisposableStore();
            // Forward watch request to provider and wire in disposables
            let watchDisposed = false;
            let disposeWatch = () => { watchDisposed = true; };
            disposables.add((0, lifecycle_1.toDisposable)(() => disposeWatch()));
            // Watch and wire in disposable which is async but
            // check if we got disposed meanwhile and forward
            (async () => {
                try {
                    const disposable = await this.doWatch(resource, options);
                    if (watchDisposed) {
                        (0, lifecycle_1.dispose)(disposable);
                    }
                    else {
                        disposeWatch = () => (0, lifecycle_1.dispose)(disposable);
                    }
                }
                catch (error) {
                    this.logService.error(error);
                }
            })();
            // When a correlation identifier is set, return a specific
            // watcher that only emits events matching that correalation.
            const correlationId = options.correlationId;
            if (typeof correlationId === 'number') {
                const fileChangeEmitter = disposables.add(new event_1.Emitter());
                disposables.add(this.internalOnDidFilesChange.event(e => {
                    if (e.correlates(correlationId)) {
                        fileChangeEmitter.fire(e);
                    }
                }));
                const watcher = {
                    onDidChange: fileChangeEmitter.event,
                    dispose: () => disposables.dispose()
                };
                return watcher;
            }
            return disposables;
        }
        async doWatch(resource, options) {
            const provider = await this.withProvider(resource);
            // Deduplicate identical watch requests
            const watchHash = (0, hash_1.hash)([this.getExtUri(provider).providerExtUri.getComparisonKey(resource), options]);
            let watcher = this.activeWatchers.get(watchHash);
            if (!watcher) {
                watcher = {
                    count: 0,
                    disposable: provider.watch(resource, options)
                };
                this.activeWatchers.set(watchHash, watcher);
            }
            // Increment usage counter
            watcher.count += 1;
            return (0, lifecycle_1.toDisposable)(() => {
                if (watcher) {
                    // Unref
                    watcher.count--;
                    // Dispose only when last user is reached
                    if (watcher.count === 0) {
                        (0, lifecycle_1.dispose)(watcher.disposable);
                        this.activeWatchers.delete(watchHash);
                    }
                }
            });
        }
        dispose() {
            super.dispose();
            for (const [, watcher] of this.activeWatchers) {
                (0, lifecycle_1.dispose)(watcher.disposable);
            }
            this.activeWatchers.clear();
        }
        async doWriteBuffered(provider, resource, options, readableOrStreamOrBufferedStream) {
            return this.writeQueue.queueFor(resource, async () => {
                // open handle
                const handle = await provider.open(resource, { create: true, unlock: options?.unlock ?? false });
                // write into handle until all bytes from buffer have been written
                try {
                    if ((0, stream_1.isReadableStream)(readableOrStreamOrBufferedStream) || (0, stream_1.isReadableBufferedStream)(readableOrStreamOrBufferedStream)) {
                        await this.doWriteStreamBufferedQueued(provider, handle, readableOrStreamOrBufferedStream);
                    }
                    else {
                        await this.doWriteReadableBufferedQueued(provider, handle, readableOrStreamOrBufferedStream);
                    }
                }
                catch (error) {
                    throw (0, files_1.ensureFileSystemProviderError)(error);
                }
                finally {
                    // close handle always
                    await provider.close(handle);
                }
            }, this.getExtUri(provider).providerExtUri);
        }
        async doWriteStreamBufferedQueued(provider, handle, streamOrBufferedStream) {
            let posInFile = 0;
            let stream;
            // Buffered stream: consume the buffer first by writing
            // it to the target before reading from the stream.
            if ((0, stream_1.isReadableBufferedStream)(streamOrBufferedStream)) {
                if (streamOrBufferedStream.buffer.length > 0) {
                    const chunk = buffer_1.VSBuffer.concat(streamOrBufferedStream.buffer);
                    await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                    posInFile += chunk.byteLength;
                }
                // If the stream has been consumed, return early
                if (streamOrBufferedStream.ended) {
                    return;
                }
                stream = streamOrBufferedStream.stream;
            }
            // Unbuffered stream - just take as is
            else {
                stream = streamOrBufferedStream;
            }
            return new Promise((resolve, reject) => {
                (0, stream_1.listenStream)(stream, {
                    onData: async (chunk) => {
                        // pause stream to perform async write operation
                        stream.pause();
                        try {
                            await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                        }
                        catch (error) {
                            return reject(error);
                        }
                        posInFile += chunk.byteLength;
                        // resume stream now that we have successfully written
                        // run this on the next tick to prevent increasing the
                        // execution stack because resume() may call the event
                        // handler again before finishing.
                        setTimeout(() => stream.resume());
                    },
                    onError: error => reject(error),
                    onEnd: () => resolve()
                });
            });
        }
        async doWriteReadableBufferedQueued(provider, handle, readable) {
            let posInFile = 0;
            let chunk;
            while ((chunk = readable.read()) !== null) {
                await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                posInFile += chunk.byteLength;
            }
        }
        async doWriteBuffer(provider, handle, buffer, length, posInFile, posInBuffer) {
            let totalBytesWritten = 0;
            while (totalBytesWritten < length) {
                // Write through the provider
                const bytesWritten = await provider.write(handle, posInFile + totalBytesWritten, buffer.buffer, posInBuffer + totalBytesWritten, length - totalBytesWritten);
                totalBytesWritten += bytesWritten;
            }
        }
        async doWriteUnbuffered(provider, resource, options, bufferOrReadableOrStreamOrBufferedStream) {
            return this.writeQueue.queueFor(resource, () => this.doWriteUnbufferedQueued(provider, resource, options, bufferOrReadableOrStreamOrBufferedStream), this.getExtUri(provider).providerExtUri);
        }
        async doWriteUnbufferedQueued(provider, resource, options, bufferOrReadableOrStreamOrBufferedStream) {
            let buffer;
            if (bufferOrReadableOrStreamOrBufferedStream instanceof buffer_1.VSBuffer) {
                buffer = bufferOrReadableOrStreamOrBufferedStream;
            }
            else if ((0, stream_1.isReadableStream)(bufferOrReadableOrStreamOrBufferedStream)) {
                buffer = await (0, buffer_1.streamToBuffer)(bufferOrReadableOrStreamOrBufferedStream);
            }
            else if ((0, stream_1.isReadableBufferedStream)(bufferOrReadableOrStreamOrBufferedStream)) {
                buffer = await (0, buffer_1.bufferedStreamToBuffer)(bufferOrReadableOrStreamOrBufferedStream);
            }
            else {
                buffer = (0, buffer_1.readableToBuffer)(bufferOrReadableOrStreamOrBufferedStream);
            }
            // Write through the provider
            await provider.writeFile(resource, buffer.buffer, { create: true, overwrite: true, unlock: options?.unlock ?? false, atomic: options?.atomic ?? false });
        }
        async doPipeBuffered(sourceProvider, source, targetProvider, target) {
            return this.writeQueue.queueFor(target, () => this.doPipeBufferedQueued(sourceProvider, source, targetProvider, target), this.getExtUri(targetProvider).providerExtUri);
        }
        async doPipeBufferedQueued(sourceProvider, source, targetProvider, target) {
            let sourceHandle = undefined;
            let targetHandle = undefined;
            try {
                // Open handles
                sourceHandle = await sourceProvider.open(source, { create: false });
                targetHandle = await targetProvider.open(target, { create: true, unlock: false });
                const buffer = buffer_1.VSBuffer.alloc(this.BUFFER_SIZE);
                let posInFile = 0;
                let posInBuffer = 0;
                let bytesRead = 0;
                do {
                    // read from source (sourceHandle) at current position (posInFile) into buffer (buffer) at
                    // buffer position (posInBuffer) up to the size of the buffer (buffer.byteLength).
                    bytesRead = await sourceProvider.read(sourceHandle, posInFile, buffer.buffer, posInBuffer, buffer.byteLength - posInBuffer);
                    // write into target (targetHandle) at current position (posInFile) from buffer (buffer) at
                    // buffer position (posInBuffer) all bytes we read (bytesRead).
                    await this.doWriteBuffer(targetProvider, targetHandle, buffer, bytesRead, posInFile, posInBuffer);
                    posInFile += bytesRead;
                    posInBuffer += bytesRead;
                    // when buffer full, fill it again from the beginning
                    if (posInBuffer === buffer.byteLength) {
                        posInBuffer = 0;
                    }
                } while (bytesRead > 0);
            }
            catch (error) {
                throw (0, files_1.ensureFileSystemProviderError)(error);
            }
            finally {
                await async_1.Promises.settled([
                    typeof sourceHandle === 'number' ? sourceProvider.close(sourceHandle) : Promise.resolve(),
                    typeof targetHandle === 'number' ? targetProvider.close(targetHandle) : Promise.resolve(),
                ]);
            }
        }
        async doPipeUnbuffered(sourceProvider, source, targetProvider, target) {
            return this.writeQueue.queueFor(target, () => this.doPipeUnbufferedQueued(sourceProvider, source, targetProvider, target), this.getExtUri(targetProvider).providerExtUri);
        }
        async doPipeUnbufferedQueued(sourceProvider, source, targetProvider, target) {
            return targetProvider.writeFile(target, await sourceProvider.readFile(source), { create: true, overwrite: true, unlock: false, atomic: false });
        }
        async doPipeUnbufferedToBuffered(sourceProvider, source, targetProvider, target) {
            return this.writeQueue.queueFor(target, () => this.doPipeUnbufferedToBufferedQueued(sourceProvider, source, targetProvider, target), this.getExtUri(targetProvider).providerExtUri);
        }
        async doPipeUnbufferedToBufferedQueued(sourceProvider, source, targetProvider, target) {
            // Open handle
            const targetHandle = await targetProvider.open(target, { create: true, unlock: false });
            // Read entire buffer from source and write buffered
            try {
                const buffer = await sourceProvider.readFile(source);
                await this.doWriteBuffer(targetProvider, targetHandle, buffer_1.VSBuffer.wrap(buffer), buffer.byteLength, 0, 0);
            }
            catch (error) {
                throw (0, files_1.ensureFileSystemProviderError)(error);
            }
            finally {
                await targetProvider.close(targetHandle);
            }
        }
        async doPipeBufferedToUnbuffered(sourceProvider, source, targetProvider, target) {
            // Read buffer via stream buffered
            const buffer = await (0, buffer_1.streamToBuffer)(this.readFileBuffered(sourceProvider, source, cancellation_1.CancellationToken.None));
            // Write buffer into target at once
            await this.doWriteUnbuffered(targetProvider, target, undefined, buffer);
        }
        throwIfFileSystemIsReadonly(provider, resource) {
            if (provider.capabilities & 2048 /* FileSystemProviderCapabilities.Readonly */) {
                throw new files_1.FileOperationError((0, nls_1.localize)('err.readonly', "Unable to modify read-only file '{0}'", this.resourceForError(resource)), 6 /* FileOperationResult.FILE_PERMISSION_DENIED */);
            }
            return provider;
        }
        throwIfFileIsReadonly(resource, stat) {
            if ((stat.permissions ?? 0) & files_1.FilePermission.Readonly) {
                throw new files_1.FileOperationError((0, nls_1.localize)('err.readonly', "Unable to modify read-only file '{0}'", this.resourceForError(resource)), 6 /* FileOperationResult.FILE_PERMISSION_DENIED */);
            }
        }
        resourceForError(resource) {
            if (resource.scheme === network_1.Schemas.file) {
                return resource.fsPath;
            }
            return resource.toString(true);
        }
    };
    exports.FileService = FileService;
    exports.FileService = FileService = FileService_1 = __decorate([
        __param(0, log_1.ILogService)
    ], FileService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9maWxlcy9jb21tb24vZmlsZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXNCekYsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLHNCQUFVOztRQVMxQyxZQUF5QixVQUF3QztZQUNoRSxLQUFLLEVBQUUsQ0FBQztZQURpQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBTGpFLGtFQUFrRTtZQUNsRSxnRUFBZ0U7WUFDaEUscURBQXFEO1lBQ3BDLGdCQUFXLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztZQU0xQyw4QkFBOEI7WUFFYixnREFBMkMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF3QyxDQUFDLENBQUM7WUFDMUgsK0NBQTBDLEdBQUcsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLEtBQUssQ0FBQztZQUU1RixzQ0FBaUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFzQyxDQUFDLENBQUM7WUFDOUcscUNBQWdDLEdBQUcsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLEtBQUssQ0FBQztZQUV4RSwrQ0FBMEMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE4QyxDQUFDLENBQUM7WUFDL0gsOENBQXlDLEdBQUcsSUFBSSxDQUFDLDBDQUEwQyxDQUFDLEtBQUssQ0FBQztZQUUxRixhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQStCLENBQUM7WUFpSW5FLFlBQVk7WUFFWiwwQkFBMEI7WUFFVCx1QkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFzQixDQUFDLENBQUM7WUFDL0Usc0JBQWlCLEdBQUcs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