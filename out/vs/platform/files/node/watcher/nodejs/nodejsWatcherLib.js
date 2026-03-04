/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/normalization", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/extpath", "vs/base/node/pfs", "vs/platform/files/common/watcher"], function (require, exports, fs_1, async_1, cancellation_1, extpath_1, lifecycle_1, normalization_1, path_1, platform_1, resources_1, uri_1, extpath_2, pfs_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeJSFileWatcherLibrary = void 0;
    exports.watchFileContents = watchFileContents;
    class NodeJSFileWatcherLibrary extends lifecycle_1.Disposable {
        // A delay in reacting to file deletes to support
        // atomic save operations where a tool may chose
        // to delete a file before creating it again for
        // an update.
        static { this.FILE_DELETE_HANDLER_DELAY = 100; }
        // A delay for collecting file changes from node.js
        // before collecting them for coalescing and emitting
        // Same delay as used for the recursive watcher.
        static { this.FILE_CHANGES_HANDLER_DELAY = 75; }
        get isReusingRecursiveWatcher() { return this._isReusingRecursiveWatcher; }
        get failed() { return this.didFail; }
        constructor(request, recursiveWatcher, onDidFilesChange, onDidWatchFail, onLogMessage, verboseLogging) {
            super();
            this.request = request;
            this.recursiveWatcher = recursiveWatcher;
            this.onDidFilesChange = onDidFilesChange;
            this.onDidWatchFail = onDidWatchFail;
            this.onLogMessage = onLogMessage;
            this.verboseLogging = verboseLogging;
            // Reduce likelyhood of spam from file events via throttling.
            // These numbers are a bit more aggressive compared to the
            // recursive watcher because we can have many individual
            // node.js watchers per request.
            // (https://github.com/microsoft/vscode/issues/124723)
            this.throttledFileChangesEmitter = this._register(new async_1.ThrottledWorker({
                maxWorkChunkSize: 100, // only process up to 100 changes at once before...
                throttleDelay: 200, // ...resting for 200ms until we process events again...
                maxBufferedWork: 10000 // ...but never buffering more than 10000 events in memory
            }, events => this.onDidFilesChange(events)));
            // Aggregate file changes over FILE_CHANGES_HANDLER_DELAY
            // to coalesce events and reduce spam.
            this.fileChangesAggregator = this._register(new async_1.RunOnceWorker(events => this.handleFileChanges(events), NodeJSFileWatcherLibrary.FILE_CHANGES_HANDLER_DELAY));
            this.excludes = (0, watcher_1.parseWatcherPatterns)(this.request.path, this.request.excludes);
            this.includes = this.request.includes ? (0, watcher_1.parseWatcherPatterns)(this.request.path, this.request.includes) : undefined;
            this.filter = (0, watcher_1.isWatchRequestWithCorrelation)(this.request) ? this.request.filter : undefined; // TODO@bpasero filtering for now is only enabled when correlating because watchers are otherwise potentially reused
            this.cts = new cancellation_1.CancellationTokenSource();
            this.ready = this.watch();
            this._isReusingRecursiveWatcher = false;
            this.didFail = false;
        }
        async watch() {
            try {
                const realPath = await this.normalizePath(this.request);
                if (this.cts.token.isCancellationRequested) {
                    return;
                }
                const stat = await pfs_1.Promises.stat(realPath);
                if (this.cts.token.isCancellationRequested) {
                    return;
                }
                this._register(await this.doWatch(realPath, stat.isDirectory()));
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    this.error(error);
                }
                else {
                    this.trace(`ignoring a path for watching who's stat info failed to resolve: ${this.request.path} (error: ${error})`);
                }
                this.notifyWatchFailed();
            }
        }
        notifyWatchFailed() {
            this.didFail = true;
            this.onDidWatchFail?.();
        }
        async normalizePath(request) {
            let realPath = request.path;
            try {
                // First check for symbolic link
                realPath = await pfs_1.Promises.realpath(request.path);
                // Second check for casing difference
                // Note: this will be a no-op on Linux platforms
                if (request.path === realPath) {
                    realPath = await (0, extpath_2.realcase)(request.path, this.cts.token) ?? request.path;
                }
                // Correct watch path as needed
                if (request.path !== realPath) {
                    this.trace(`correcting a path to watch that seems to be a symbolic link or wrong casing (original: ${request.path}, real: ${realPath})`);
                }
            }
            catch (error) {
                // ignore
            }
            return realPath;
        }
        async doWatch(realPath, isDirectory) {
            const disposables = new lifecycle_1.DisposableStore();
            if (this.doWatchWithExistingWatcher(realPath, isDirectory, disposables)) {
                this.trace(`reusing an existing recursive watcher for ${this.request.path}`);
                this._isReusingRecursiveWatcher = true;
            }
            else {
                this._isReusingRecursiveWatcher = false;
                await this.doWatchWithNodeJS(realPath, isDirectory, disposables);
            }
            return disposables;
        }
        doWatchWithExistingWatcher(realPath, isDirectory, disposables) {
            if (isDirectory) {
                // TODO@bpasero recursive watcher re-use is currently not enabled
                // for when folders are watched. this is because the dispatching
                // in the recursive watcher for non-recurive requests is optimized
                // for file changes  where we really only match on the exact path
                // and not child paths.
                return false;
            }
            const resource = uri_1.URI.file(this.request.path);
            const subscription = this.recursiveWatcher?.subscribe(this.request.path, async (error, change) => {
                if (disposables.isDisposed) {
                    return; // return early if already disposed
                }
                if (error) {
                    const watchDisposable = await this.doWatch(realPath, isDirectory);
                    if (!disposables.isDisposed) {
                        disposables.add(watchDisposable);
                    }
                    else {
                        watchDisposable.dispose();
                    }
                }
                else if (change) {
                    if (typeof change.cId === 'number' || typeof this.request.correlationId === 'number') {
                        // Re-emit this change with the correlation id of the request
                        // so that the client can correlate the event with the request
                        // properly. Without correlation, we do not have to do that
                        // because the event will appear on the global listener already.
                        this.onFileChange({ resource, type: change.type, cId: this.request.correlationId }, true /* skip excludes/includes (file is explicitly watched) */);
                    }
                }
            });
            if (subscription) {
                disposables.add(subscription);
                return true;
            }
            return false;
        }
        async doWatchWithNodeJS(realPath, isDirectory, disposables) {
            // macOS: watching samba shares can crash VSCode so we do
            // a simple check for the file path pointing to /Volumes
            // (https://github.com/microsoft/vscode/issues/106879)
            // TODO@electron this needs a revisit when the crash is
            // fixed or mitigated upstream.
            if (platform_1.isMacintosh && (0, extpath_1.isEqualOrParent)(realPath, '/Volumes/', true)) {
                this.error(`Refusing to watch ${realPath} for changes using fs.watch() for possibly being a network share where watching is unreliable and unstable.`);
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource(this.cts.token);
            disposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            const watcherDisposables = new lifecycle_1.DisposableStore(); // we need a separate disposable store because we re-create the watcher from within in some cases
            disposables.add(watcherDisposables);
            try {
                const requestResource = uri_1.URI.file(this.request.path);
                const pathBasename = (0, path_1.basename)(realPath);
                // Creating watcher can fail with an exception
                const watcher = (0, fs_1.watch)(realPath);
                watcherDisposables.add((0, lifecycle_1.toDisposable)(() => {
                    watcher.removeAllListeners();
                    watcher.close();
                }));
                this.trace(`Started watching: '${realPath}'`);
                // Folder: resolve children to emit proper events
                const folderChildren = new Set();
                if (isDirectory) {
                    try {
                        for (const child of await pfs_1.Promises.readdir(realPath)) {
                            folderChildren.add(child);
                        }
                    }
                    catch (error) {
                        this.error(error);
                    }
                }
                if (cts.token.isCancellationRequested) {
                    return;
                }
                const mapPathToStatDisposable = new Map();
                watcherDisposables.add((0, lifecycle_1.toDisposable)(() => {
                    for (const [, disposable] of mapPathToStatDisposable) {
                        disposable.dispose();
                    }
                    mapPathToStatDisposable.clear();
                }));
                watcher.on('error', (code, signal) => {
                    if (cts.token.isCancellationRequested) {
                        return;
                    }
                    this.error(`Failed to watch ${realPath} for changes using fs.watch() (${code}, ${signal})`);
                    this.notifyWatchFailed();
                });
                watcher.on('change', (type, raw) => {
                    if (cts.token.isCancellationRequested) {
                        return; // ignore if already disposed
                    }
                    if (this.verboseLogging) {
                        this.traceWithCorrelation(`[raw] ["${type}"] ${raw}`);
                    }
                    // Normalize file name
                    let changedFileName = '';
                    if (raw) { // https://github.com/microsoft/vscode/issues/38191
                        changedFileName = raw.toString();
                        if (platform_1.isMacintosh) {
                            // Mac: uses NFD unicode form on disk, but we want NFC
                            // See also https://github.com/nodejs/node/issues/2165
                            changedFileName = (0, normalization_1.normalizeNFC)(changedFileName);
                        }
                    }
                    if (!changedFileName || (type !== 'change' && type !== 'rename')) {
                        return; // ignore unexpected events
                    }
                    // Folder
                    if (isDirectory) {
                        // Folder child added/deleted
                        if (type === 'rename') {
                            // Cancel any previous stats for this file if existing
                            mapPathToStatDisposable.get(changedFileName)?.dispose();
                            // Wait a bit and try see if the file still exists on disk
                            // to decide on the resulting event
                            const timeoutHandle = setTimeout(async () => {
                                mapPathToStatDisposable.delete(changedFileName);
                                // Depending on the OS the watcher runs on, there
                                // is different behaviour for when the watched
                                // folder path is being deleted:
                                //
                                // -   macOS: not reported but events continue to
                                //            work even when the folder is brought
                                //            back, though it seems every change
                                //            to a file is reported as "rename"
                                // -   Linux: "rename" event is reported with the
                                //            name of the folder and events stop
                                //            working
                                // - Windows: an EPERM error is thrown that we
                                //            handle from the `on('error')` event
                                //
                                // We do not re-attach the watcher after timeout
                                // though as we do for file watches because for
                                // file watching specifically we want to handle
                                // the atomic-write cases where the file is being
                                // deleted and recreated with different contents.
                                if (changedFileName === pathBasename && !await pfs_1.Promises.exists(realPath)) {
                                    this.onWatchedPathDeleted(requestResource);
                                    return;
                                }
                                if (cts.token.isCancellationRequested) {
                                    return;
                                }
                                // In order to properly detect renames on a case-insensitive
                                // file system, we need to use `existsChildStrictCase` helper
                                // because otherwise we would wrongly assume a file exists
                                // when it was renamed to same name but different case.
                                const fileExists = await this.existsChildStrictCase((0, path_1.join)(realPath, changedFileName));
                                if (cts.token.isCancellationRequested) {
                                    return; // ignore if disposed by now
                                }
                                // Figure out the correct event type:
                                // File Exists: either 'added' or 'updated' if known before
                                // File Does not Exist: always 'deleted'
                                let type;
                                if (fileExists) {
                                    if (folderChildren.has(changedFileName)) {
                                        type = 0 /* FileChangeType.UPDATED */;
                                    }
                                    else {
                                        type = 1 /* FileChangeType.ADDED */;
                                        folderChildren.add(changedFileName);
                                    }
                                }
                                else {
                                    folderChildren.delete(changedFileName);
                                    type = 2 /* FileChangeType.DELETED */;
                                }
                                this.onFileChange({ resource: (0, resources_1.joinPath)(requestResource, changedFileName), type, cId: this.request.correlationId });
                            }, NodeJSFileWatcherLibrary.FILE_DELETE_HANDLER_DELAY);
                            mapPathToStatDisposable.set(changedFileName, (0, lifecycle_1.toDisposable)(() => clearTimeout(timeoutHandle)));
                        }
                        // Folder child changed
                        else {
                            // Figure out the correct event type: if this is the
                            // first time we see this child, it can only be added
                            let type;
                            if (folderChildren.has(changedFileName)) {
                                type = 0 /* FileChangeType.UPDATED */;
                            }
                            else {
                                type = 1 /* FileChangeType.ADDED */;
                                folderChildren.add(changedFileName);
                            }
                            this.onFileChange({ resource: (0, resources_1.joinPath)(requestResource, changedFileName), type, cId: this.request.correlationId });
                        }
                    }
                    // File
                    else {
                        // File added/deleted
                        if (type === 'rename' || changedFileName !== pathBasename) {
                            // Depending on the OS the watcher runs on, there
                            // is different behaviour for when the watched
                            // file path is being deleted:
                            //
                            // -   macOS: "rename" event is reported and events
                            //            stop working
                            // -   Linux: "rename" event is reported and events
                            //            stop working
                            // - Windows: "rename" event is reported and events
                            //            continue to work when file is restored
                            //
                            // As opposed to folder watching, we re-attach the
                            // watcher after brief timeout to support "atomic save"
                            // operations where a tool may decide to delete a file
                            // and then create it with the updated contents.
                            //
                            // Different to folder watching, we emit a delete event
                            // though we never detect when the file is brought back
                            // because the watcher is disposed then.
                            const timeoutHandle = setTimeout(async () => {
                                const fileExists = await pfs_1.Promises.exists(realPath);
                                if (cts.token.isCancellationRequested) {
                                    return; // ignore if disposed by now
                                }
                                // File still exists, so emit as change event and reapply the watcher
                                if (fileExists) {
                                    this.onFileChange({ resource: requestResource, type: 0 /* FileChangeType.UPDATED */, cId: this.request.correlationId }, true /* skip excludes/includes (file is explicitly watched) */);
                                    watcherDisposables.add(await this.doWatch(realPath, false));
                                }
                                // File seems to be really gone, so emit a deleted and failed event
                                else {
                                    this.onWatchedPathDeleted(requestResource);
                                }
                            }, NodeJSFileWatcherLibrary.FILE_DELETE_HANDLER_DELAY);
                            // Very important to dispose the watcher which now points to a stale inode
                            // and wire in a new disposable that tracks our timeout that is installed
                            watcherDisposables.clear();
                            watcherDisposables.add((0, lifecycle_1.toDisposable)(() => clearTimeout(timeoutHandle)));
                        }
                        // File changed
                        else {
                            this.onFileChange({ resource: requestResource, type: 0 /* FileChangeType.UPDATED */, cId: this.request.correlationId }, true /* skip excludes/includes (file is explicitly watched) */);
                        }
                    }
                });
            }
            catch (error) {
                if (!cts.token.isCancellationRequested) {
                    this.error(`Failed to watch ${realPath} for changes using fs.watch() (${error.toString()})`);
                }
                this.notifyWatchFailed();
            }
        }
        onWatchedPathDeleted(resource) {
            this.warn('Watcher shutdown because watched path got deleted');
            // Emit events and flush in case the watcher gets disposed
            this.onFileChange({ resource, type: 2 /* FileChangeType.DELETED */, cId: this.request.correlationId }, true /* skip excludes/includes (file is explicitly watched) */);
            this.fileChangesAggregator.flush();
            this.notifyWatchFailed();
        }
        onFileChange(event, skipIncludeExcludeChecks = false) {
            if (this.cts.token.isCancellationRequested) {
                return;
            }
            // Logging
            if (this.verboseLogging) {
                this.traceWithCorrelation(`${event.type === 1 /* FileChangeType.ADDED */ ? '[ADDED]' : event.type === 2 /* FileChangeType.DELETED */ ? '[DELETED]' : '[CHANGED]'} ${event.resource.fsPath}`);
            }
            // Add to aggregator unless excluded or not included (not if explicitly disabled)
            if (!skipIncludeExcludeChecks && this.excludes.some(exclude => exclude(event.resource.fsPath))) {
                if (this.verboseLogging) {
                    this.traceWithCorrelation(` >> ignored (excluded) ${event.resource.fsPath}`);
                }
            }
            else if (!skipIncludeExcludeChecks && this.includes && this.includes.length > 0 && !this.includes.some(include => include(event.resource.fsPath))) {
                if (this.verboseLogging) {
                    this.traceWithCorrelation(` >> ignored (not included) ${event.resource.fsPath}`);
                }
            }
            else {
                this.fileChangesAggregator.work(event);
            }
        }
        handleFileChanges(fileChanges) {
            // Coalesce events: merge events of same kind
            const coalescedFileChanges = (0, watcher_1.coalesceEvents)(fileChanges);
            // Filter events: based on request filter property
            const filteredEvents = [];
            for (const event of coalescedFileChanges) {
                if ((0, watcher_1.isFiltered)(event, this.filter)) {
                    if (this.verboseLogging) {
                        this.traceWithCorrelation(` >> ignored (filtered) ${event.resource.fsPath}`);
                    }
                    continue;
                }
                filteredEvents.push(event);
            }
            if (filteredEvents.length === 0) {
                return;
            }
            // Logging
            if (this.verboseLogging) {
                for (const event of filteredEvents) {
                    this.traceWithCorrelation(` >> normalized ${event.type === 1 /* FileChangeType.ADDED */ ? '[ADDED]' : event.type === 2 /* FileChangeType.DELETED */ ? '[DELETED]' : '[CHANGED]'} ${event.resource.fsPath}`);
                }
            }
            // Broadcast to clients via throttled emitter
            const worked = this.throttledFileChangesEmitter.work(filteredEvents);
            // Logging
            if (!worked) {
                this.warn(`started ignoring events due to too many file change events at once (incoming: ${filteredEvents.length}, most recent change: ${filteredEvents[0].resource.fsPath}). Use 'files.watcherExclude' setting to exclude folders with lots of changing files (e.g. compilation output).`);
            }
            else {
                if (this.throttledFileChangesEmitter.pending > 0) {
                    this.trace(`started throttling events due to large amount of file change events at once (pending: ${this.throttledFileChangesEmitter.pending}, most recent change: ${filteredEvents[0].resource.fsPath}). Use 'files.watcherExclude' setting to exclude folders with lots of changing files (e.g. compilation output).`);
                }
            }
        }
        async existsChildStrictCase(path) {
            if (platform_1.isLinux) {
                return pfs_1.Promises.exists(path);
            }
            try {
                const pathBasename = (0, path_1.basename)(path);
                const children = await pfs_1.Promises.readdir((0, path_1.dirname)(path));
                return children.some(child => child === pathBasename);
            }
            catch (error) {
                this.trace(error);
                return false;
            }
        }
        setVerboseLogging(verboseLogging) {
            this.verboseLogging = verboseLogging;
        }
        error(error) {
            if (!this.cts.token.isCancellationRequested) {
                this.onLogMessage?.({ type: 'error', message: `[File Watcher (node.js)] ${error}` });
            }
        }
        warn(message) {
            if (!this.cts.token.isCancellationRequested) {
                this.onLogMessage?.({ type: 'warn', message: `[File Watcher (node.js)] ${message}` });
            }
        }
        trace(message) {
            if (!this.cts.token.isCancellationRequested && this.verboseLogging) {
                this.onLogMessage?.({ type: 'trace', message: `[File Watcher (node.js)] ${message}` });
            }
        }
        traceWithCorrelation(message) {
            if (!this.cts.token.isCancellationRequested && this.verboseLogging) {
                this.trace(`${message}${typeof this.request.correlationId === 'number' ? ` <${this.request.correlationId}> ` : ``}`);
            }
        }
        dispose() {
            this.cts.dispose(true);
            super.dispose();
        }
    }
    exports.NodeJSFileWatcherLibrary = NodeJSFileWatcherLibrary;
    /**
     * Watch the provided `path` for changes and return
     * the data in chunks of `Uint8Array` for further use.
     */
    async function watchFileContents(path, onData, onReady, token, bufferSize = 512) {
        const handle = await pfs_1.Promises.open(path, 'r');
        const buffer = Buffer.allocUnsafe(bufferSize);
        const cts = new cancellation_1.CancellationTokenSource(token);
        let error = undefined;
        let isReading = false;
        const request = { path, excludes: [], recursive: false };
        const watcher = new NodeJSFileWatcherLibrary(request, undefined, changes => {
            (async () => {
                for (const { type } of changes) {
                    if (type === 0 /* FileChangeType.UPDATED */) {
                        if (isReading) {
                            return; // return early if we are already reading the output
                        }
                        isReading = true;
                        try {
                            // Consume the new contents of the file until finished
                            // everytime there is a change event signalling a change
                            while (!cts.token.isCancellationRequested) {
                                const { bytesRead } = await pfs_1.Promises.read(handle, buffer, 0, bufferSize, null);
                                if (!bytesRead || cts.token.isCancellationRequested) {
                                    break;
                                }
                                onData(buffer.slice(0, bytesRead));
                            }
                        }
                        catch (err) {
                            error = new Error(err);
                            cts.dispose(true);
                        }
                        finally {
                            isReading = false;
                        }
                    }
                }
            })();
        });
        await watcher.ready;
        onReady();
        return new Promise((resolve, reject) => {
            cts.token.onCancellationRequested(async () => {
                watcher.dispose();
                try {
                    await pfs_1.Promises.close(handle);
                }
                catch (err) {
                    error = new Error(err);
                }
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZWpzV2F0Y2hlckxpYi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL25vZGUvd2F0Y2hlci9ub2RlanMvbm9kZWpzV2F0Y2hlckxpYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5akJoRyw4Q0ErREM7SUF2bUJELE1BQWEsd0JBQXlCLFNBQVEsc0JBQVU7UUFFdkQsaURBQWlEO1FBQ2pELGdEQUFnRDtRQUNoRCxnREFBZ0Q7UUFDaEQsYUFBYTtpQkFDVyw4QkFBeUIsR0FBRyxHQUFHLEFBQU4sQ0FBTztRQUV4RCxtREFBbUQ7UUFDbkQscURBQXFEO1FBQ3JELGdEQUFnRDtpQkFDeEIsK0JBQTBCLEdBQUcsRUFBRSxBQUFMLENBQU07UUE2QnhELElBQUkseUJBQXlCLEtBQWMsT0FBTyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDO1FBR3BGLElBQUksTUFBTSxLQUFjLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFOUMsWUFDa0IsT0FBa0MsRUFDbEMsZ0JBQTRELEVBQzVELGdCQUFrRCxFQUNsRCxjQUEyQixFQUMzQixZQUF5QyxFQUNsRCxjQUF3QjtZQUVoQyxLQUFLLEVBQUUsQ0FBQztZQVBTLFlBQU8sR0FBUCxPQUFPLENBQTJCO1lBQ2xDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBNEM7WUFDNUQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQztZQUNsRCxtQkFBYyxHQUFkLGNBQWMsQ0FBYTtZQUMzQixpQkFBWSxHQUFaLFlBQVksQ0FBNkI7WUFDbEQsbUJBQWMsR0FBZCxjQUFjLENBQVU7WUF0Q2pDLDZEQUE2RDtZQUM3RCwwREFBMEQ7WUFDMUQsd0RBQXdEO1lBQ3hELGdDQUFnQztZQUNoQyxzREFBc0Q7WUFDckMsZ0NBQTJC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