/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "os", "util", "vs/base/common/async", "vs/base/common/extpath", "vs/base/common/normalization", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri"], function (require, exports, fs, os_1, util_1, async_1, extpath_1, normalization_1, path_1, platform_1, resources_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Promises = exports.SymlinkSupport = exports.RimRafMode = void 0;
    exports.rimrafSync = rimrafSync;
    exports.readdirSync = readdirSync;
    exports.whenDeleted = whenDeleted;
    exports.configureFlushOnWrite = configureFlushOnWrite;
    exports.writeFileSync = writeFileSync;
    //#region rimraf
    var RimRafMode;
    (function (RimRafMode) {
        /**
         * Slow version that unlinks each file and folder.
         */
        RimRafMode[RimRafMode["UNLINK"] = 0] = "UNLINK";
        /**
         * Fast version that first moves the file/folder
         * into a temp directory and then deletes that
         * without waiting for it.
         */
        RimRafMode[RimRafMode["MOVE"] = 1] = "MOVE";
    })(RimRafMode || (exports.RimRafMode = RimRafMode = {}));
    async function rimraf(path, mode = RimRafMode.UNLINK, moveToPath) {
        if ((0, extpath_1.isRootOrDriveLetter)(path)) {
            throw new Error('rimraf - will refuse to recursively delete root');
        }
        // delete: via rm
        if (mode === RimRafMode.UNLINK) {
            return rimrafUnlink(path);
        }
        // delete: via move
        return rimrafMove(path, moveToPath);
    }
    async function rimrafMove(path, moveToPath = (0, extpath_1.randomPath)((0, os_1.tmpdir)())) {
        try {
            try {
                // Intentionally using `fs.promises` here to skip
                // the patched graceful-fs method that can result
                // in very long running `rename` calls when the
                // folder is locked by a file watcher. We do not
                // really want to slow down this operation more
                // than necessary and we have a fallback to delete
                // via unlink.
                // https://github.com/microsoft/vscode/issues/139908
                await fs.promises.rename(path, moveToPath);
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    return; // ignore - path to delete did not exist
                }
                return rimrafUnlink(path); // otherwise fallback to unlink
            }
            // Delete but do not return as promise
            rimrafUnlink(moveToPath).catch(error => { });
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    async function rimrafUnlink(path) {
        return (0, util_1.promisify)(fs.rm)(path, { recursive: true, force: true, maxRetries: 3 });
    }
    function rimrafSync(path) {
        if ((0, extpath_1.isRootOrDriveLetter)(path)) {
            throw new Error('rimraf - will refuse to recursively delete root');
        }
        fs.rmSync(path, { recursive: true, force: true, maxRetries: 3 });
    }
    async function readdir(path, options) {
        return handleDirectoryChildren(await (options ? safeReaddirWithFileTypes(path) : (0, util_1.promisify)(fs.readdir)(path)));
    }
    async function safeReaddirWithFileTypes(path) {
        try {
            return await (0, util_1.promisify)(fs.readdir)(path, { withFileTypes: true });
        }
        catch (error) {
            console.warn('[node.js fs] readdir with filetypes failed with error: ', error);
        }
        // Fallback to manually reading and resolving each
        // children of the folder in case we hit an error
        // previously.
        // This can only really happen on exotic file systems
        // such as explained in #115645 where we get entries
        // from `readdir` that we can later not `lstat`.
        const result = [];
        const children = await readdir(path);
        for (const child of children) {
            let isFile = false;
            let isDirectory = false;
            let isSymbolicLink = false;
            try {
                const lstat = await exports.Promises.lstat((0, path_1.join)(path, child));
                isFile = lstat.isFile();
                isDirectory = lstat.isDirectory();
                isSymbolicLink = lstat.isSymbolicLink();
            }
            catch (error) {
                console.warn('[node.js fs] unexpected error from lstat after readdir: ', error);
            }
            result.push({
                name: child,
                isFile: () => isFile,
                isDirectory: () => isDirectory,
                isSymbolicLink: () => isSymbolicLink
            });
        }
        return result;
    }
    /**
     * Drop-in replacement of `fs.readdirSync` with support
     * for converting from macOS NFD unicon form to NFC
     * (https://github.com/nodejs/node/issues/2165)
     */
    function readdirSync(path) {
        return handleDirectoryChildren(fs.readdirSync(path));
    }
    function handleDirectoryChildren(children) {
        return children.map(child => {
            // Mac: uses NFD unicode form on disk, but we want NFC
            // See also https://github.com/nodejs/node/issues/2165
            if (typeof child === 'string') {
                return platform_1.isMacintosh ? (0, normalization_1.normalizeNFC)(child) : child;
            }
            child.name = platform_1.isMacintosh ? (0, normalization_1.normalizeNFC)(child.name) : child.name;
            return child;
        });
    }
    /**
     * A convenience method to read all children of a path that
     * are directories.
     */
    async function readDirsInDir(dirPath) {
        const children = await readdir(dirPath);
        const directories = [];
        for (const child of children) {
            if (await SymlinkSupport.existsDirectory((0, path_1.join)(dirPath, child))) {
                directories.push(child);
            }
        }
        return directories;
    }
    //#endregion
    //#region whenDeleted()
    /**
     * A `Promise` that resolves when the provided `path`
     * is deleted from disk.
     */
    function whenDeleted(path, intervalMs = 1000) {
        return new Promise(resolve => {
            let running = false;
            const interval = setInterval(() => {
                if (!running) {
                    running = true;
                    fs.access(path, err => {
                        running = false;
                        if (err) {
                            clearInterval(interval);
                            resolve(undefined);
                        }
                    });
                }
            }, intervalMs);
        });
    }
    //#endregion
    //#region Methods with symbolic links support
    var SymlinkSupport;
    (function (SymlinkSupport) {
        /**
         * Resolves the `fs.Stats` of the provided path. If the path is a
         * symbolic link, the `fs.Stats` will be from the target it points
         * to. If the target does not exist, `dangling: true` will be returned
         * as `symbolicLink` value.
         */
        async function stat(path) {
            // First stat the link
            let lstats;
            try {
                lstats = await exports.Promises.lstat(path);
                // Return early if the stat is not a symbolic link at all
                if (!lstats.isSymbolicLink()) {
                    return { stat: lstats };
                }
            }
            catch (error) {
                /* ignore - use stat() instead */
            }
            // If the stat is a symbolic link or failed to stat, use fs.stat()
            // which for symbolic links will stat the target they point to
            try {
                const stats = await exports.Promises.stat(path);
                return { stat: stats, symbolicLink: lstats?.isSymbolicLink() ? { dangling: false } : undefined };
            }
            catch (error) {
                // If the link points to a nonexistent file we still want
                // to return it as result while setting dangling: true flag
                if (error.code === 'ENOENT' && lstats) {
                    return { stat: lstats, symbolicLink: { dangling: true } };
                }
                // Windows: workaround a node.js bug where reparse points
                // are not supported (https://github.com/nodejs/node/issues/36790)
                if (platform_1.isWindows && error.code === 'EACCES') {
                    try {
                        const stats = await exports.Promises.stat(await exports.Promises.readlink(path));
                        return { stat: stats, symbolicLink: { dangling: false } };
                    }
                    catch (error) {
                        // If the link points to a nonexistent file we still want
                        // to return it as result while setting dangling: true flag
                        if (error.code === 'ENOENT' && lstats) {
                            return { stat: lstats, symbolicLink: { dangling: true } };
                        }
                        throw error;
                    }
                }
                throw error;
            }
        }
        SymlinkSupport.stat = stat;
        /**
         * Figures out if the `path` exists and is a file with support
         * for symlinks.
         *
         * Note: this will return `false` for a symlink that exists on
         * disk but is dangling (pointing to a nonexistent path).
         *
         * Use `exists` if you only care about the path existing on disk
         * or not without support for symbolic links.
         */
        async function existsFile(path) {
            try {
                const { stat, symbolicLink } = await SymlinkSupport.stat(path);
                return stat.isFile() && symbolicLink?.dangling !== true;
            }
            catch (error) {
                // Ignore, path might not exist
            }
            return false;
        }
        SymlinkSupport.existsFile = existsFile;
        /**
         * Figures out if the `path` exists and is a directory with support for
         * symlinks.
         *
         * Note: this will return `false` for a symlink that exists on
         * disk but is dangling (pointing to a nonexistent path).
         *
         * Use `exists` if you only care about the path existing on disk
         * or not without support for symbolic links.
         */
        async function existsDirectory(path) {
            try {
                const { stat, symbolicLink } = await SymlinkSupport.stat(path);
                return stat.isDirectory() && symbolicLink?.dangling !== true;
            }
            catch (error) {
                // Ignore, path might not exist
            }
            return false;
        }
        SymlinkSupport.existsDirectory = existsDirectory;
    })(SymlinkSupport || (exports.SymlinkSupport = SymlinkSupport = {}));
    //#endregion
    //#region Write File
    // According to node.js docs (https://nodejs.org/docs/v14.16.0/api/fs.html#fs_fs_writefile_file_data_options_callback)
    // it is not safe to call writeFile() on the same path multiple times without waiting for the callback to return.
    // Therefor we use a Queue on the path that is given to us to sequentialize calls to the same path properly.
    const writeQueues = new async_1.ResourceQueue();
    function writeFile(path, data, options) {
        return writeQueues.queueFor(uri_1.URI.file(path), () => {
            const ensuredOptions = ensureWriteOptions(options);
            return new Promise((resolve, reject) => doWriteFileAndFlush(path, data, ensuredOptions, error => error ? reject(error) : resolve()));
        }, resources_1.extUriBiasedIgnorePathCase);
    }
    let canFlush = true;
    function configureFlushOnWrite(enabled) {
        canFlush = enabled;
    }
    // Calls fs.writeFile() followed by a fs.sync() call to flush the changes to disk
    // We do this in cases where we want to make sure the data is really on disk and
    // not in some cache.
    //
    // See https://github.com/nodejs/node/blob/v5.10.0/lib/fs.js#L1194
    function doWriteFileAndFlush(path, data, options, callback) {
        if (!canFlush) {
            return fs.writeFile(path, data, { mode: options.mode, flag: options.flag }, callback);
        }
        // Open the file with same flags and mode as fs.writeFile()
        fs.open(path, options.flag, options.mode, (openError, fd) => {
            if (openError) {
                return callback(openError);
            }
            // It is valid to pass a fd handle to fs.writeFile() and this will keep the handle open!
            fs.writeFile(fd, data, writeError => {
                if (writeError) {
                    return fs.close(fd, () => callback(writeError)); // still need to close the handle on error!
                }
                // Flush contents (not metadata) of the file to disk
                // https://github.com/microsoft/vscode/issues/9589
                fs.fdatasync(fd, (syncError) => {
                    // In some exotic setups it is well possible that node fails to sync
                    // In that case we disable flushing and warn to the console
                    if (syncError) {
                        console.warn('[node.js fs] fdatasync is now disabled for this session because it failed: ', syncError);
                        configureFlushOnWrite(false);
                    }
                    return fs.close(fd, closeError => callback(closeError));
                });
            });
        });
    }
    /**
     * Same as `fs.writeFileSync` but with an additional call to
     * `fs.fdatasyncSync` after writing to ensure changes are
     * flushed to disk.
     */
    function writeFileSync(path, data, options) {
        const ensuredOptions = ensureWriteOptions(options);
        if (!canFlush) {
            return fs.writeFileSync(path, data, { mode: ensuredOptions.mode, flag: ensuredOptions.flag });
        }
        // Open the file with same flags and mode as fs.writeFile()
        const fd = fs.openSync(path, ensuredOptions.flag, ensuredOptions.mode);
        try {
            // It is valid to pass a fd handle to fs.writeFile() and this will keep the handle open!
            fs.writeFileSync(fd, data);
            // Flush contents (not metadata) of the file to disk
            try {
                fs.fdatasyncSync(fd); // https://github.com/microsoft/vscode/issues/9589
            }
            catch (syncError) {
                console.warn('[node.js fs] fdatasyncSync is now disabled for this session because it failed: ', syncError);
                configureFlushOnWrite(false);
            }
        }
        finally {
            fs.closeSync(fd);
        }
    }
    function ensureWriteOptions(options) {
        if (!options) {
            return { mode: 0o666 /* default node.js mode for files */, flag: 'w' };
        }
        return {
            mode: typeof options.mode === 'number' ? options.mode : 0o666 /* default node.js mode for files */,
            flag: typeof options.flag === 'string' ? options.flag : 'w'
        };
    }
    //#endregion
    //#region Move / Copy
    /**
     * A drop-in replacement for `fs.rename` that:
     * - allows to move across multiple disks
     * - attempts to retry the operation for certain error codes on Windows
     */
    async function rename(source, target, windowsRetryTimeout = 60000 /* matches graceful-fs */) {
        if (source === target) {
            return; // simulate node.js behaviour here and do a no-op if paths match
        }
        try {
            if (platform_1.isWindows && typeof windowsRetryTimeout === 'number') {
                // On Windows, a rename can fail when either source or target
                // is locked by AV software. We do leverage graceful-fs to iron
                // out these issues, however in case the target file exists,
                // graceful-fs will immediately return without retry for fs.rename().
                await renameWithRetry(source, target, Date.now(), windowsRetryTimeout);
            }
            else {
                await (0, util_1.promisify)(fs.rename)(source, target);
            }
        }
        catch (error) {
            // In two cases we fallback to classic copy and delete:
            //
            // 1.) The EXDEV error indicates that source and target are on different devices
            // In this case, fallback to using a copy() operation as there is no way to
            // rename() between different devices.
            //
            // 2.) The user tries to rename a file/folder that ends with a dot. This is not
            // really possible to move then, at least on UNC devices.
            if (source.toLowerCase() !== target.toLowerCase() && error.code === 'EXDEV' || source.endsWith('.')) {
                await copy(source, target, { preserveSymlinks: false /* copying to another device */ });
                await rimraf(source, RimRafMode.MOVE);
            }
            else {
                throw error;
            }
        }
    }
    async function renameWithRetry(source, target, startTime, retryTimeout, attempt = 0) {
        try {
            return await (0, util_1.promisify)(fs.rename)(source, target);
        }
        catch (error) {
            if (error.code !== 'EACCES' && error.code !== 'EPERM' && error.code !== 'EBUSY') {
                throw error; // only for errors we think are temporary
            }
            if (Date.now() - startTime >= retryTimeout) {
                console.error(`[node.js fs] rename failed after ${attempt} retries with error: ${error}`);
                throw error; // give up after configurable timeout
            }
            if (attempt === 0) {
                let abortRetry = false;
                try {
                    const { stat } = await SymlinkSupport.stat(target);
                    if (!stat.isFile()) {
                        abortRetry = true; // if target is not a file, EPERM error may be raised and we should not attempt to retry
                    }
                }
                catch (error) {
                    // Ignore
                }
                if (abortRetry) {
                    throw error;
                }
            }
            // Delay with incremental backoff up to 100ms
            await (0, async_1.timeout)(Math.min(100, attempt * 10));
            // Attempt again
            return renameWithRetry(source, target, startTime, retryTimeout, attempt + 1);
        }
    }
    /**
     * Recursively copies all of `source` to `target`.
     *
     * The options `preserveSymlinks` configures how symbolic
     * links should be handled when encountered. Set to
     * `false` to not preserve them and `true` otherwise.
     */
    async function copy(source, target, options) {
        return doCopy(source, target, { root: { source, target }, options, handledSourcePaths: new Set() });
    }
    // When copying a file or folder, we want to preserve the mode
    // it had and as such provide it when creating. However, modes
    // can go beyond what we expect (see link below), so we mask it.
    // (https://github.com/nodejs/node-v0.x-archive/issues/3045#issuecomment-4862588)
    const COPY_MODE_MASK = 0o777;
    async function doCopy(source, target, payload) {
        // Keep track of paths already copied to prevent
        // cycles from symbolic links to cause issues
        if (payload.handledSourcePaths.has(source)) {
            return;
        }
        else {
            payload.handledSourcePaths.add(source);
        }
        const { stat, symbolicLink } = await SymlinkSupport.stat(source);
        // Symlink
        if (symbolicLink) {
            // Try to re-create the symlink unless `preserveSymlinks: false`
            if (payload.options.preserveSymlinks) {
                try {
                    return await doCopySymlink(source, target, payload);
                }
                catch (error) {
                    // in any case of an error fallback to normal copy via dereferencing
                }
            }
            if (symbolicLink.dangling) {
                return; // skip dangling symbolic links from here on (https://github.com/microsoft/vscode/issues/111621)
            }
        }
        // Folder
        if (stat.isDirectory()) {
            return doCopyDirectory(source, target, stat.mode & COPY_MODE_MASK, payload);
        }
        // File or file-like
        else {
            return doCopyFile(source, target, stat.mode & COPY_MODE_MASK);
        }
    }
    async function doCopyDirectory(source, target, mode, payload) {
        // Create folder
        await exports.Promises.mkdir(target, { recursive: true, mode });
        // Copy each file recursively
        const files = await readdir(source);
        for (const file of files) {
            await doCopy((0, path_1.join)(source, file), (0, path_1.join)(target, file), payload);
        }
    }
    async function doCopyFile(source, target, mode) {
        // Copy file
        await exports.Promises.copyFile(source, target);
        // restore mode (https://github.com/nodejs/node/issues/1104)
        await exports.Promises.chmod(target, mode);
    }
    async function doCopySymlink(source, target, payload) {
        // Figure out link target
        let linkTarget = await exports.Promises.readlink(source);
        // Special case: the symlink points to a target that is
        // actually within the path that is being copied. In that
        // case we want the symlink to point to the target and
        // not the source
        if ((0, extpath_1.isEqualOrParent)(linkTarget, payload.root.source, !platform_1.isLinux)) {
            linkTarget = (0, path_1.join)(payload.root.target, linkTarget.substr(payload.root.source.length + 1));
        }
        // Create symlink
        await exports.Promises.symlink(linkTarget, target);
    }
    //#endregion
    //#region Promise based fs methods
    /**
     * Prefer this helper class over the `fs.promises` API to
     * enable `graceful-fs` to function properly. Given issue
     * https://github.com/isaacs/node-graceful-fs/issues/160 it
     * is evident that the module only takes care of the non-promise
     * based fs methods.
     *
     * Another reason is `realpath` being entirely different in
     * the promise based implementation compared to the other
     * one (https://github.com/microsoft/vscode/issues/118562)
     *
     * Note: using getters for a reason, since `graceful-fs`
     * patching might kick in later after modules have been
     * loaded we need to defer access to fs methods.
     * (https://github.com/microsoft/vscode/issues/124176)
     */
    exports.Promises = new class {
        //#region Implemented by node.js
        get access() { return (0, util_1.promisify)(fs.access); }
        get stat() { return (0, util_1.promisify)(fs.stat); }
        get lstat() { return (0, util_1.promisify)(fs.lstat); }
        get utimes() { return (0, util_1.promisify)(fs.utimes); }
        get read() {
            // Not using `promisify` here for a reason: the return
            // type is not an object as indicated by TypeScript but
            // just the bytes read, so we create our own wrapper.
            return (fd, buffer, offset, length, position) => {
                return new Promise((resolve, reject) => {
                    fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve({ bytesRead, buffer });
                    });
                });
            };
        }
        get readFile() { return (0, util_1.promisify)(fs.readFile); }
        get write() {
            // Not using `promisify` here for a reason: the return
            // type is not an object as indicated by TypeScript but
            // just the bytes written, so we create our own wrapper.
            return (fd, buffer, offset, length, position) => {
                return new Promise((resolve, reject) => {
                    fs.write(fd, buffer, offset, length, position, (err, bytesWritten, buffer) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve({ bytesWritten, buffer });
                    });
                });
            };
        }
        get appendFile() { return (0, util_1.promisify)(fs.appendFile); }
        get fdatasync() { return (0, util_1.promisify)(fs.fdatasync); }
        get truncate() { return (0, util_1.promisify)(fs.truncate); }
        get copyFile() { return (0, util_1.promisify)(fs.copyFile); }
        get open() { return (0, util_1.promisify)(fs.open); }
        get close() { return (0, util_1.promisify)(fs.close); }
        get symlink() { return (0, util_1.promisify)(fs.symlink); }
        get readlink() { return (0, util_1.promisify)(fs.readlink); }
        get chmod() { return (0, util_1.promisify)(fs.chmod); }
        get mkdir() { return (0, util_1.promisify)(fs.mkdir); }
        get unlink() { return (0, util_1.promisify)(fs.unlink); }
        get rmdir() { return (0, util_1.promisify)(fs.rmdir); }
        get realpath() { return (0, util_1.promisify)(fs.realpath); }
        //#endregion
        //#region Implemented by us
        async exists(path) {
            try {
                await exports.Promises.access(path);
                return true;
            }
            catch {
                return false;
            }
        }
        get readdir() { return readdir; }
        get readDirsInDir() { return readDirsInDir; }
        get writeFile() { return writeFile; }
        get rm() { return rimraf; }
        get rename() { return rename; }
        get copy() { return copy; }
    };
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGZzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9ub2RlL3Bmcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5RmhHLGdDQU1DO0lBdUVELGtDQUVDO0lBOENELGtDQWlCQztJQXNLRCxzREFFQztJQThDRCxzQ0F5QkM7SUF6Y0QsZ0JBQWdCO0lBRWhCLElBQVksVUFhWDtJQWJELFdBQVksVUFBVTtRQUVyQjs7V0FFRztRQUNILCtDQUFNLENBQUE7UUFFTjs7OztXQUlHO1FBQ0gsMkNBQUksQ0FBQTtJQUNMLENBQUMsRUFiVyxVQUFVLDBCQUFWLFVBQVUsUUFhckI7SUFjRCxLQUFLLFVBQVUsTUFBTSxDQUFDLElBQVksRUFBRSxJQUFJLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxVQUFtQjtRQUNoRixJQUFJLElBQUEsNkJBQW1CLEVBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMvQixNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUVELGlCQUFpQjtRQUNqQixJQUFJLElBQUksS0FBSyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDaEMsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUVELG1CQUFtQjtRQUNuQixPQUFPLFVBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELEtBQUssVUFBVSxVQUFVLENBQUMsSUFBWSxFQUFFLFVBQVUsR0FBRyxJQUFBLG9CQUFVLEVBQUMsSUFBQSxXQUFNLEdBQUUsQ0FBQztRQUN4RSxJQUFJLENBQUM7WUFDSixJQUFJLENBQUM7Z0JBQ0osaURBQWlEO2dCQUNqRCxpREFBaUQ7Z0JBQ2pELCtDQUErQztnQkFDL0MsZ0RBQWdEO2dCQUNo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