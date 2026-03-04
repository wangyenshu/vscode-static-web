/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "graceful-fs", "vs/base/common/async", "vs/base/common/map", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/stream", "vs/base/node/pfs", "vs/nls", "vs/platform/files/common/files", "vs/platform/files/common/io", "vs/platform/files/common/diskFileSystemProvider", "vs/base/common/errorMessage", "vs/platform/files/node/watcher/watcherClient", "vs/platform/files/node/watcher/nodejs/nodejsClient"], function (require, exports, fs, graceful_fs_1, async_1, map_1, buffer_1, event_1, extpath_1, lifecycle_1, path_1, platform_1, resources_1, stream_1, pfs_1, nls_1, files_1, io_1, diskFileSystemProvider_1, errorMessage_1, watcherClient_1, nodejsClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskFileSystemProvider = void 0;
    /**
     * Enable graceful-fs very early from here to have it enabled
     * in all contexts that leverage the disk file system provider.
     */
    (() => {
        try {
            (0, graceful_fs_1.gracefulify)(fs);
        }
        catch (error) {
            console.error(`Error enabling graceful-fs: ${(0, errorMessage_1.toErrorMessage)(error)}`);
        }
    })();
    class DiskFileSystemProvider extends diskFileSystemProvider_1.AbstractDiskFileSystemProvider {
        static { this.TRACE_LOG_RESOURCE_LOCKS = false; } // not enabled by default because very spammy
        constructor(logService, options) {
            super(logService, options);
            //#region File Capabilities
            this.onDidChangeCapabilities = event_1.Event.None;
            //#endregion
            //#region File Reading/Writing
            this.resourceLocks = new map_1.ResourceMap(resource => resources_1.extUriBiasedIgnorePathCase.getComparisonKey(resource));
            this.mapHandleToPos = new Map();
            this.mapHandleToLock = new Map();
            this.writeHandles = new Map();
        }
        get capabilities() {
            if (!this._capabilities) {
                this._capabilities =
                    2 /* FileSystemProviderCapabilities.FileReadWrite */ |
                        4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ |
                        16 /* FileSystemProviderCapabilities.FileReadStream */ |
                        8 /* FileSystemProviderCapabilities.FileFolderCopy */ |
                        8192 /* FileSystemProviderCapabilities.FileWriteUnlock */ |
                        16384 /* FileSystemProviderCapabilities.FileAtomicRead */ |
                        32768 /* FileSystemProviderCapabilities.FileAtomicWrite */ |
                        65536 /* FileSystemProviderCapabilities.FileAtomicDelete */ |
                        131072 /* FileSystemProviderCapabilities.FileClone */;
                if (platform_1.isLinux) {
                    this._capabilities |= 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                }
            }
            return this._capabilities;
        }
        //#endregion
        //#region File Metadata Resolving
        async stat(resource) {
            try {
                const { stat, symbolicLink } = await pfs_1.SymlinkSupport.stat(this.toFilePath(resource)); // cannot use fs.stat() here to support links properly
                return {
                    type: this.toType(stat, symbolicLink),
                    ctime: stat.birthtime.getTime(), // intentionally not using ctime here, we want the creation time
                    mtime: stat.mtime.getTime(),
                    size: stat.size,
                    permissions: (stat.mode & 0o200) === 0 ? files_1.FilePermission.Locked : undefined
                };
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async statIgnoreError(resource) {
            try {
                return await this.stat(resource);
            }
            catch (error) {
                return undefined;
            }
        }
        async readdir(resource) {
            try {
                const children = await pfs_1.Promises.readdir(this.toFilePath(resource), { withFileTypes: true });
                const result = [];
                await Promise.all(children.map(async (child) => {
                    try {
                        let type;
                        if (child.isSymbolicLink()) {
                            type = (await this.stat((0, resources_1.joinPath)(resource, child.name))).type; // always resolve target the link points to if any
                        }
                        else {
                            type = this.toType(child);
                        }
                        result.push([child.name, type]);
                    }
                    catch (error) {
                        this.logService.trace(error); // ignore errors for individual entries that can arise from permission denied
                    }
                }));
                return result;
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        toType(entry, symbolicLink) {
            // Signal file type by checking for file / directory, except:
            // - symbolic links pointing to nonexistent files are FileType.Unknown
            // - files that are neither file nor directory are FileType.Unknown
            let type;
            if (symbolicLink?.dangling) {
                type = files_1.FileType.Unknown;
            }
            else if (entry.isFile()) {
                type = files_1.FileType.File;
            }
            else if (entry.isDirectory()) {
                type = files_1.FileType.Directory;
            }
            else {
                type = files_1.FileType.Unknown;
            }
            // Always signal symbolic link as file type additionally
            if (symbolicLink) {
                type |= files_1.FileType.SymbolicLink;
            }
            return type;
        }
        async createResourceLock(resource) {
            const filePath = this.toFilePath(resource);
            this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - request to acquire resource lock (${filePath})`);
            // Await pending locks for resource. It is possible for a new lock being
            // added right after opening, so we have to loop over locks until no lock
            // remains.
            let existingLock = undefined;
            while (existingLock = this.resourceLocks.get(resource)) {
                this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - waiting for resource lock to be released (${filePath})`);
                await existingLock.wait();
            }
            // Store new
            const newLock = new async_1.Barrier();
            this.resourceLocks.set(resource, newLock);
            this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - new resource lock created (${filePath})`);
            return (0, lifecycle_1.toDisposable)(() => {
                this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - resource lock dispose() (${filePath})`);
                // Delete lock if it is still ours
                if (this.resourceLocks.get(resource) === newLock) {
                    this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - resource lock removed from resource-lock map (${filePath})`);
                    this.resourceLocks.delete(resource);
                }
                // Open lock
                this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - resource lock barrier open() (${filePath})`);
                newLock.open();
            });
        }
        async readFile(resource, options) {
            let lock = undefined;
            try {
                if (options?.atomic) {
                    this.traceLock(`[Disk FileSystemProvider]: atomic read operation started (${this.toFilePath(resource)})`);
                    // When the read should be atomic, make sure
                    // to await any pending locks for the resource
                    // and lock for the duration of the read.
                    lock = await this.createResourceLock(resource);
                }
                const filePath = this.toFilePath(resource);
                return await pfs_1.Promises.readFile(filePath);
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
            finally {
                lock?.dispose();
            }
        }
        traceLock(msg) {
            if (DiskFileSystemProvider.TRACE_LOG_RESOURCE_LOCKS) {
                this.logService.trace(msg);
            }
        }
        readFileStream(resource, opts, token) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer);
            (0, io_1.readFileIntoStream)(this, resource, stream, data => data.buffer, {
                ...opts,
                bufferSize: 256 * 1024 // read into chunks of 256kb each to reduce IPC overhead
            }, token);
            return stream;
        }
        async writeFile(resource, content, opts) {
            if (opts?.atomic !== false && opts?.atomic?.postfix && await this.canWriteFileAtomic(resource)) {
                return this.doWriteFileAtomic(resource, (0, resources_1.joinPath)((0, resources_1.dirname)(resource), `${(0, resources_1.basename)(resource)}${opts.atomic.postfix}`), content, opts);
            }
            else {
                return this.doWriteFile(resource, content, opts);
            }
        }
        async canWriteFileAtomic(resource) {
            try {
                const filePath = this.toFilePath(resource);
                const { symbolicLink } = await pfs_1.SymlinkSupport.stat(filePath);
                if (symbolicLink) {
                    // atomic writes are unsupported for symbolic links because
                    // we need to ensure that the `rename` operation is atomic
                    // and that only works if the link is on the same disk.
                    // Since we do not know where the symbolic link points to
                    // we refuse to write atomically.
                    return false;
                }
            }
            catch (error) {
                // ignore stat errors here and just proceed trying to write
            }
            return true; // atomic writing supported
        }
        async doWriteFileAtomic(resource, tempResource, content, opts) {
            // Ensure to create locks for all resources involved
            // since atomic write involves mutiple disk operations
            // and resources.
            const locks = new lifecycle_1.DisposableStore();
            try {
                locks.add(await this.createResourceLock(resource));
                locks.add(await this.createResourceLock(tempResource));
                // Write to temp resource first
                await this.doWriteFile(tempResource, content, opts, true /* disable write lock */);
                try {
                    // Rename over existing to ensure atomic replace
                    await this.rename(tempResource, resource, { overwrite: true });
                }
                catch (error) {
                    // Cleanup in case of rename error
                    try {
                        await this.delete(tempResource, { recursive: false, useTrash: false, atomic: false });
                    }
                    catch (error) {
                        // ignore - we want the outer error to bubble up
                    }
                    throw error;
                }
            }
            finally {
                locks.dispose();
            }
        }
        async doWriteFile(resource, content, opts, disableWriteLock) {
            let handle = undefined;
            try {
                const filePath = this.toFilePath(resource);
                // Validate target unless { create: true, overwrite: true }
                if (!opts.create || !opts.overwrite) {
                    const fileExists = await pfs_1.Promises.exists(filePath);
                    if (fileExists) {
                        if (!opts.overwrite) {
                            throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileExists', "File already exists"), files_1.FileSystemProviderErrorCode.FileExists);
                        }
                    }
                    else {
                        if (!opts.create) {
                            throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileNotExists', "File does not exist"), files_1.FileSystemProviderErrorCode.FileNotFound);
                        }
                    }
                }
                // Open
                handle = await this.open(resource, { create: true, unlock: opts.unlock }, disableWriteLock);
                // Write content at once
                await this.write(handle, 0, content, 0, content.byteLength);
            }
            catch (error) {
                throw await this.toFileSystemProviderWriteError(resource, error);
            }
            finally {
                if (typeof handle === 'number') {
                    await this.close(handle);
                }
            }
        }
        static { this.canFlush = true; }
        static configureFlushOnWrite(enabled) {
            DiskFileSystemProvider.canFlush = enabled;
        }
        async open(resource, opts, disableWriteLock) {
            const filePath = this.toFilePath(resource);
            // Writes: guard multiple writes to the same resource
            // behind a single lock to prevent races when writing
            // from multiple places at the same time to the same file
            let lock = undefined;
            if ((0, files_1.isFileOpenForWriteOptions)(opts) && !disableWriteLock) {
                lock = await this.createResourceLock(resource);
            }
            let fd = undefined;
            try {
                // Determine whether to unlock the file (write only)
                if ((0, files_1.isFileOpenForWriteOptions)(opts) && opts.unlock) {
                    try {
                        const { stat } = await pfs_1.SymlinkSupport.stat(filePath);
                        if (!(stat.mode & 0o200 /* File mode indicating writable by owner */)) {
                            await pfs_1.Promises.chmod(filePath, stat.mode | 0o200);
                        }
                    }
                    catch (error) {
                        if (error.code !== 'ENOENT') {
                            this.logService.trace(error); // ignore any errors here and try to just write
                        }
                    }
                }
                // Determine file flags for opening (read vs write)
                let flags = undefined;
                if ((0, files_1.isFileOpenForWriteOptions)(opts)) {
                    if (platform_1.isWindows) {
                        try {
                            // On Windows and if the file exists, we use a different strategy of saving the file
                            // by first truncating the file and then writing with r+ flag. This helps to save hidden files on Windows
                            // (see https://github.com/microsoft/vscode/issues/931) and prevent removing alternate data streams
                            // (see https://github.com/microsoft/vscode/issues/6363)
                            await pfs_1.Promises.truncate(filePath, 0);
                            // After a successful truncate() the flag can be set to 'r+' which will not truncate.
                            flags = 'r+';
                        }
                        catch (error) {
                            if (error.code !== 'ENOENT') {
                                this.logService.trace(error);
                            }
                        }
                    }
                    // We take opts.create as a hint that the file is opened for writing
                    // as such we use 'w' to truncate an existing or create the
                    // file otherwise. we do not allow reading.
                    if (!flags) {
                        flags = 'w';
                    }
                }
                else {
                    // Otherwise we assume the file is opened for reading
                    // as such we use 'r' to neither truncate, nor create
                    // the file.
                    flags = 'r';
                }
                // Finally open handle to file path
                fd = await pfs_1.Promises.open(filePath, flags);
            }
            catch (error) {
                // Release lock because we have no valid handle
                // if we did open a lock during this operation
                lock?.dispose();
                // Rethrow as file system provider error
                if ((0, files_1.isFileOpenForWriteOptions)(opts)) {
                    throw await this.toFileSystemProviderWriteError(resource, error);
                }
                else {
                    throw this.toFileSystemProviderError(error);
                }
            }
            // Remember this handle to track file position of the handle
            // we init the position to 0 since the file descriptor was
            // just created and the position was not moved so far (see
            // also http://man7.org/linux/man-pages/man2/open.2.html -
            // "The file offset is set to the beginning of the file.")
            this.mapHandleToPos.set(fd, 0);
            // remember that this handle was used for writing
            if ((0, files_1.isFileOpenForWriteOptions)(opts)) {
                this.writeHandles.set(fd, resource);
            }
            if (lock) {
                const previousLock = this.mapHandleToLock.get(fd);
                // Remember that this handle has an associated lock
                this.traceLock(`[Disk FileSystemProvider]: open() - storing lock for handle ${fd} (${filePath})`);
                this.mapHandleToLock.set(fd, lock);
                // There is a slight chance that a resource lock for a
                // handle was not yet disposed when we acquire a new
                // lock, so we must ensure to dispose the previous lock
                // before storing a new one for the same handle, other
                // wise we end up in a deadlock situation
                // https://github.com/microsoft/vscode/issues/142462
                if (previousLock) {
                    this.traceLock(`[Disk FileSystemProvider]: open() - disposing a previous lock that was still stored on same handle ${fd} (${filePath})`);
                    previousLock.dispose();
                }
            }
            return fd;
        }
        async close(fd) {
            // It is very important that we keep any associated lock
            // for the file handle before attempting to call `fs.close(fd)`
            // because of a possible race condition: as soon as a file
            // handle is released, the OS may assign the same handle to
            // the next `fs.open` call and as such it is possible that our
            // lock is getting overwritten
            const lockForHandle = this.mapHandleToLock.get(fd);
            try {
                // Remove this handle from map of positions
                this.mapHandleToPos.delete(fd);
                // If a handle is closed that was used for writing, ensure
                // to flush the contents to disk if possible.
                if (this.writeHandles.delete(fd) && DiskFileSystemProvider.canFlush) {
                    try {
                        await pfs_1.Promises.fdatasync(fd); // https://github.com/microsoft/vscode/issues/9589
                    }
                    catch (error) {
                        // In some exotic setups it is well possible that node fails to sync
                        // In that case we disable flushing and log the error to our logger
                        DiskFileSystemProvider.configureFlushOnWrite(false);
                        this.logService.error(error);
                    }
                }
                return await pfs_1.Promises.close(fd);
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
            finally {
                if (lockForHandle) {
                    if (this.mapHandleToLock.get(fd) === lockForHandle) {
                        this.traceLock(`[Disk FileSystemProvider]: close() - resource lock removed from handle-lock map ${fd}`);
                        this.mapHandleToLock.delete(fd); // only delete from map if this is still our lock!
                    }
                    this.traceLock(`[Disk FileSystemProvider]: close() - disposing lock for handle ${fd}`);
                    lockForHandle.dispose();
                }
            }
        }
        async read(fd, pos, data, offset, length) {
            const normalizedPos = this.normalizePos(fd, pos);
            let bytesRead = null;
            try {
                bytesRead = (await pfs_1.Promises.read(fd, data, offset, length, normalizedPos)).bytesRead;
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
            finally {
                this.updatePos(fd, normalizedPos, bytesRead);
            }
            return bytesRead;
        }
        normalizePos(fd, pos) {
            // When calling fs.read/write we try to avoid passing in the "pos" argument and
            // rather prefer to pass in "null" because this avoids an extra seek(pos)
            // call that in some cases can even fail (e.g. when opening a file over FTP -
            // see https://github.com/microsoft/vscode/issues/73884).
            //
            // as such, we compare the passed in position argument with our last known
            // position for the file descriptor and use "null" if they match.
            if (pos === this.mapHandleToPos.get(fd)) {
                return null;
            }
            return pos;
        }
        updatePos(fd, pos, bytesLength) {
            const lastKnownPos = this.mapHandleToPos.get(fd);
            if (typeof lastKnownPos === 'number') {
                // pos !== null signals that previously a position was used that is
                // not null. node.js documentation explains, that in this case
                // the internal file pointer is not moving and as such we do not move
                // our position pointer.
                //
                // Docs: "If position is null, data will be read from the current file position,
                // and the file position will be updated. If position is an integer, the file position
                // will remain unchanged."
                if (typeof pos === 'number') {
                    // do not modify the position
                }
                // bytesLength = number is a signal that the read/write operation was
                // successful and as such we need to advance the position in the Map
                //
                // Docs (http://man7.org/linux/man-pages/man2/read.2.html):
                // "On files that support seeking, the read operation commences at the
                // file offset, and the file offset is incremented by the number of
                // bytes read."
                //
                // Docs (http://man7.org/linux/man-pages/man2/write.2.html):
                // "For a seekable file (i.e., one to which lseek(2) may be applied, for
                // example, a regular file) writing takes place at the file offset, and
                // the file offset is incremented by the number of bytes actually
                // written."
                else if (typeof bytesLength === 'number') {
                    this.mapHandleToPos.set(fd, lastKnownPos + bytesLength);
                }
                // bytesLength = null signals an error in the read/write operation
                // and as such we drop the handle from the Map because the position
                // is unspecificed at this point.
                else {
                    this.mapHandleToPos.delete(fd);
                }
            }
        }
        async write(fd, pos, data, offset, length) {
            // We know at this point that the file to write to is truncated and thus empty
            // if the write now fails, the file remains empty. as such we really try hard
            // to ensure the write succeeds by retrying up to three times.
            return (0, async_1.retry)(() => this.doWrite(fd, pos, data, offset, length), 100 /* ms delay */, 3 /* retries */);
        }
        async doWrite(fd, pos, data, offset, length) {
            const normalizedPos = this.normalizePos(fd, pos);
            let bytesWritten = null;
            try {
                bytesWritten = (await pfs_1.Promises.write(fd, data, offset, length, normalizedPos)).bytesWritten;
            }
            catch (error) {
                throw await this.toFileSystemProviderWriteError(this.writeHandles.get(fd), error);
            }
            finally {
                this.updatePos(fd, normalizedPos, bytesWritten);
            }
            return bytesWritten;
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        async mkdir(resource) {
            try {
                await pfs_1.Promises.mkdir(this.toFilePath(resource));
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async delete(resource, opts) {
            try {
                const filePath = this.toFilePath(resource);
                if (opts.recursive) {
                    let rmMoveToPath = undefined;
                    if (opts?.atomic !== false && opts.atomic.postfix) {
                        rmMoveToPath = (0, path_1.join)((0, path_1.dirname)(filePath), `${(0, path_1.basename)(filePath)}${opts.atomic.postfix}`);
                    }
                    await pfs_1.Promises.rm(filePath, pfs_1.RimRafMode.MOVE, rmMoveToPath);
                }
                else {
                    try {
                        await pfs_1.Promises.unlink(filePath);
                    }
                    catch (unlinkError) {
                        // `fs.unlink` will throw when used on directories
                        // we try to detect this error and then see if the
                        // provided resource is actually a directory. in that
                        // case we use `fs.rmdir` to delete the directory.
                        if (unlinkError.code === 'EPERM' || unlinkError.code === 'EISDIR') {
                            let isDirectory = false;
                            try {
                                const { stat, symbolicLink } = await pfs_1.SymlinkSupport.stat(filePath);
                                isDirectory = stat.isDirectory() && !symbolicLink;
                            }
                            catch (statError) {
                                // ignore
                            }
                            if (isDirectory) {
                                await pfs_1.Promises.rmdir(filePath);
                            }
                            else {
                                throw unlinkError;
                            }
                        }
                        else {
                            throw unlinkError;
                        }
                    }
                }
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async rename(from, to, opts) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            if (fromFilePath === toFilePath) {
                return; // simulate node.js behaviour here and do a no-op if paths match
            }
            try {
                // Validate the move operation can perform
                await this.validateMoveCopy(from, to, 'move', opts.overwrite);
                // Rename
                await pfs_1.Promises.rename(fromFilePath, toFilePath);
            }
            catch (error) {
                // Rewrite some typical errors that can happen especially around symlinks
                // to something the user can better understand
                if (error.code === 'EINVAL' || error.code === 'EBUSY' || error.code === 'ENAMETOOLONG') {
                    error = new Error((0, nls_1.localize)('moveError', "Unable to move '{0}' into '{1}' ({2}).", (0, path_1.basename)(fromFilePath), (0, path_1.basename)((0, path_1.dirname)(toFilePath)), error.toString()));
                }
                throw this.toFileSystemProviderError(error);
            }
        }
        async copy(from, to, opts) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            if (fromFilePath === toFilePath) {
                return; // simulate node.js behaviour here and do a no-op if paths match
            }
            try {
                // Validate the copy operation can perform
                await this.validateMoveCopy(from, to, 'copy', opts.overwrite);
                // Copy
                await pfs_1.Promises.copy(fromFilePath, toFilePath, { preserveSymlinks: true });
            }
            catch (error) {
                // Rewrite some typical errors that can happen especially around symlinks
                // to something the user can better understand
                if (error.code === 'EINVAL' || error.code === 'EBUSY' || error.code === 'ENAMETOOLONG') {
                    error = new Error((0, nls_1.localize)('copyError', "Unable to copy '{0}' into '{1}' ({2}).", (0, path_1.basename)(fromFilePath), (0, path_1.basename)((0, path_1.dirname)(toFilePath)), error.toString()));
                }
                throw this.toFileSystemProviderError(error);
            }
        }
        async validateMoveCopy(from, to, mode, overwrite) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            let isSameResourceWithDifferentPathCase = false;
            const isPathCaseSensitive = !!(this.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
            if (!isPathCaseSensitive) {
                isSameResourceWithDifferentPathCase = (0, extpath_1.isEqual)(fromFilePath, toFilePath, true /* ignore case */);
            }
            if (isSameResourceWithDifferentPathCase) {
                // You cannot copy the same file to the same location with different
                // path case unless you are on a case sensitive file system
                if (mode === 'copy') {
                    throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileCopyErrorPathCase', "File cannot be copied to same path with different path case"), files_1.FileSystemProviderErrorCode.FileExists);
                }
                // You can move the same file to the same location with different
                // path case on case insensitive file systems
                else if (mode === 'move') {
                    return;
                }
            }
            // Here we have to see if the target to move/copy to exists or not.
            // We need to respect the `overwrite` option to throw in case the
            // target exists.
            const fromStat = await this.statIgnoreError(from);
            if (!fromStat) {
                throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileMoveCopyErrorNotFound', "File to move/copy does not exist"), files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const toStat = await this.statIgnoreError(to);
            if (!toStat) {
                return; // target does not exist so we are good
            }
            if (!overwrite) {
                throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileMoveCopyErrorExists', "File at target already exists and thus will not be moved/copied to unless overwrite is specified"), files_1.FileSystemProviderErrorCode.FileExists);
            }
            // Handle existing target for move/copy
            if ((fromStat.type & files_1.FileType.File) !== 0 && (toStat.type & files_1.FileType.File) !== 0) {
                return; // node.js can move/copy a file over an existing file without having to delete it first
            }
            else {
                await this.delete(to, { recursive: true, useTrash: false, atomic: false });
            }
        }
        //#endregion
        //#region Clone File
        async cloneFile(from, to) {
            return this.doCloneFile(from, to, false /* optimistically assume parent folders exist */);
        }
        async doCloneFile(from, to, mkdir) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            const isPathCaseSensitive = !!(this.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
            if ((0, extpath_1.isEqual)(fromFilePath, toFilePath, !isPathCaseSensitive)) {
                return; // cloning is only supported `from` and `to` are different files
            }
            // Implement clone by using `fs.copyFile`, however setup locks
            // for both `from` and `to` because node.js does not ensure
            // this to be an atomic operation
            const locks = new lifecycle_1.DisposableStore();
            try {
                locks.add(await this.createResourceLock(from));
                locks.add(await this.createResourceLock(to));
                if (mkdir) {
                    await pfs_1.Promises.mkdir((0, path_1.dirname)(toFilePath), { recursive: true });
                }
                await pfs_1.Promises.copyFile(fromFilePath, toFilePath);
            }
            catch (error) {
                if (error.code === 'ENOENT' && !mkdir) {
                    return this.doCloneFile(from, to, true);
                }
                throw this.toFileSystemProviderError(error);
            }
            finally {
                locks.dispose();
            }
        }
        //#endregion
        //#region File Watching
        createUniversalWatcher(onChange, onLogMessage, verboseLogging) {
            return new watcherClient_1.UniversalWatcherClient(changes => onChange(changes), msg => onLogMessage(msg), verboseLogging);
        }
        createNonRecursiveWatcher(onChange, onLogMessage, verboseLogging) {
            return new nodejsClient_1.NodeJSWatcherClient(changes => onChange(changes), msg => onLogMessage(msg), verboseLogging);
        }
        //#endregion
        //#region Helpers
        toFileSystemProviderError(error) {
            if (error instanceof files_1.FileSystemProviderError) {
                return error; // avoid double conversion
            }
            let resultError = error;
            let code;
            switch (error.code) {
                case 'ENOENT':
                    code = files_1.FileSystemProviderErrorCode.FileNotFound;
                    break;
                case 'EISDIR':
                    code = files_1.FileSystemProviderErrorCode.FileIsADirectory;
                    break;
                case 'ENOTDIR':
                    code = files_1.FileSystemProviderErrorCode.FileNotADirectory;
                    break;
                case 'EEXIST':
                    code = files_1.FileSystemProviderErrorCode.FileExists;
                    break;
                case 'EPERM':
                case 'EACCES':
                    code = files_1.FileSystemProviderErrorCode.NoPermissions;
                    break;
                case 'ERR_UNC_HOST_NOT_ALLOWED':
                    resultError = `${error.message}. Please update the 'security.allowedUNCHosts' setting if you want to allow this host.`;
                    code = files_1.FileSystemProviderErrorCode.Unknown;
                    break;
                default:
                    code = files_1.FileSystemProviderErrorCode.Unknown;
            }
            return (0, files_1.createFileSystemProviderError)(resultError, code);
        }
        async toFileSystemProviderWriteError(resource, error) {
            let fileSystemProviderWriteError = this.toFileSystemProviderError(error);
            // If the write error signals permission issues, we try
            // to read the file's mode to see if the file is write
            // locked.
            if (resource && fileSystemProviderWriteError.code === files_1.FileSystemProviderErrorCode.NoPermissions) {
                try {
                    const { stat } = await pfs_1.SymlinkSupport.stat(this.toFilePath(resource));
                    if (!(stat.mode & 0o200 /* File mode indicating writable by owner */)) {
                        fileSystemProviderWriteError = (0, files_1.createFileSystemProviderError)(error, files_1.FileSystemProviderErrorCode.FileWriteLocked);
                    }
                }
                catch (error) {
                    this.logService.trace(error); // ignore - return original error
                }
            }
            return fileSystemProviderWriteError;
        }
    }
    exports.DiskFileSystemProvider = DiskFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTeXN0ZW1Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL25vZGUvZGlza0ZpbGVTeXN0ZW1Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEyQmhHOzs7T0FHRztJQUNILENBQUMsR0FBRyxFQUFFO1FBQ0wsSUFBSSxDQUFDO1lBQ0osSUFBQSx5QkFBVyxFQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2pCLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQStCLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkUsQ0FBQztJQUNGLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFFTCxNQUFhLHNCQUF1QixTQUFRLHVEQUE4QjtpQkFVMUQsNkJBQXdCLEdBQUcsS0FBSyxBQUFSLENBQVMsR0FBQyw2Q0FBNkM7UUFFOUYsWUFDQyxVQUF1QixFQUN2QixPQUF3QztZQUV4QyxLQUFLLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRzVCLDJCQUEyQjtZQUVsQiw0QkFBdUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBc0c5QyxZQUFZO1lBRVosOEJBQThCO1lBRWIsa0JBQWEsR0FBRyxJQUFJLGlCQUFXLENBQVUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxzQ0FBMEIsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBMks1RyxtQkFBYyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBQzNDLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFFakQsaUJBQVksR0FBRyxJQUFJLEdBQUcsRUFBZSxDQUFDO1FBNVJ2RCxDQUFD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