/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "@parcel/watcher", "fs", "os", "vs/base/common/uri", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/extpath", "vs/base/common/glob", "vs/platform/files/node/watcher/baseWatcher", "vs/base/common/ternarySearchTree", "vs/base/common/normalization", "vs/base/common/path", "vs/base/common/platform", "vs/base/node/extpath", "vs/platform/files/node/watcher/nodejs/nodejsWatcherLib", "vs/platform/files/common/watcher", "vs/base/common/lifecycle"], function (require, exports, parcelWatcher, fs_1, os_1, uri_1, async_1, cancellation_1, errorMessage_1, event_1, extpath_1, glob_1, baseWatcher_1, ternarySearchTree_1, normalization_1, path_1, platform_1, extpath_2, nodejsWatcherLib_1, watcher_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParcelWatcher = exports.ParcelWatcherInstance = void 0;
    class ParcelWatcherInstance extends lifecycle_1.Disposable {
        get failed() { return this.didFail; }
        get stopped() { return this.didStop; }
        constructor(
        /**
         * Signals when the watcher is ready to watch.
         */
        ready, request, 
        /**
         * How often this watcher has been restarted in case of an unexpected
         * shutdown.
         */
        restarts, 
        /**
         * The cancellation token associated with the lifecycle of the watcher.
         */
        token, 
        /**
         * An event aggregator to coalesce events and reduce duplicates.
         */
        worker, stopFn) {
            super();
            this.ready = ready;
            this.request = request;
            this.restarts = restarts;
            this.token = token;
            this.worker = worker;
            this.stopFn = stopFn;
            this._onDidStop = this._register(new event_1.Emitter());
            this.onDidStop = this._onDidStop.event;
            this._onDidFail = this._register(new event_1.Emitter());
            this.onDidFail = this._onDidFail.event;
            this.didFail = false;
            this.didStop = false;
            this.includes = this.request.includes ? (0, watcher_1.parseWatcherPatterns)(this.request.path, this.request.includes) : undefined;
            this.excludes = this.request.excludes ? (0, watcher_1.parseWatcherPatterns)(this.request.path, this.request.excludes) : undefined;
            this.subscriptions = new Map();
            this._register((0, lifecycle_1.toDisposable)(() => this.subscriptions.clear()));
        }
        subscribe(path, callback) {
            path = uri_1.URI.file(path).fsPath; // make sure to store the path in `fsPath` form to match it with events later
            let subscriptions = this.subscriptions.get(path);
            if (!subscriptions) {
                subscriptions = new Set();
                this.subscriptions.set(path, subscriptions);
            }
            subscriptions.add(callback);
            return (0, lifecycle_1.toDisposable)(() => {
                const subscriptions = this.subscriptions.get(path);
                if (subscriptions) {
                    subscriptions.delete(callback);
                    if (subscriptions.size === 0) {
                        this.subscriptions.delete(path);
                    }
                }
            });
        }
        get subscriptionsCount() {
            return this.subscriptions.size;
        }
        notifyFileChange(path, change) {
            const subscriptions = this.subscriptions.get(path);
            if (subscriptions) {
                for (const subscription of subscriptions) {
                    subscription(change);
                }
            }
        }
        notifyWatchFailed() {
            this.didFail = true;
            this._onDidFail.fire();
        }
        include(path) {
            if (!this.includes || this.includes.length === 0) {
                return true; // no specific includes defined, include all
            }
            return this.includes.some(include => include(path));
        }
        exclude(path) {
            return Boolean(this.excludes?.some(exclude => exclude(path)));
        }
        async stop(joinRestart) {
            this.didStop = true;
            try {
                await this.stopFn();
            }
            finally {
                this._onDidStop.fire({ joinRestart });
                this.dispose();
            }
        }
    }
    exports.ParcelWatcherInstance = ParcelWatcherInstance;
    class ParcelWatcher extends baseWatcher_1.BaseWatcher {
        static { this.MAP_PARCEL_WATCHER_ACTION_TO_FILE_CHANGE = new Map([
            ['create', 1 /* FileChangeType.ADDED */],
            ['update', 0 /* FileChangeType.UPDATED */],
            ['delete', 2 /* FileChangeType.DELETED */]
        ]); }
        static { this.PARCEL_WATCHER_BACKEND = platform_1.isWindows ? 'windows' : platform_1.isLinux ? 'inotify' : 'fs-events'; }
        // A delay for collecting file changes from Parcel
        // before collecting them for coalescing and emitting.
        // Parcel internally uses 50ms as delay, so we use 75ms,
        // to schedule sufficiently after Parcel.
        //
        // Note: since Parcel 2.0.7, the very first event is
        // emitted without delay if no events occured over a
        // duration of 500ms. But we always want to aggregate
        // events to apply our coleasing logic.
        //
        static { this.FILE_CHANGES_HANDLER_DELAY = 75; }
        constructor() {
            super();
            this._onDidError = this._register(new event_1.Emitter());
            this.onDidError = this._onDidError.event;
            this.watchers = new Set();
            // Reduce likelyhood of spam from file events via throttling.
            // (https://github.com/microsoft/vscode/issues/124723)
            this.throttledFileChangesEmitter = this._register(new async_1.ThrottledWorker({
                maxWorkChunkSize: 500, // only process up to 500 changes at once before...
                throttleDelay: 200, // ...resting for 200ms until we process events again...
                maxBufferedWork: 30000 // ...but never buffering more than 30000 events in memory
            }, events => this._onDidChangeFile.fire(events)));
            this.enospcErrorLogged = false;
            this.registerListeners();
        }
        registerListeners() {
            // Error handling on process
            process.on('uncaughtException', error => this.onUnexpectedError(error));
            process.on('unhandledRejection', error => this.onUnexpectedError(error));
        }
        async doWatch(requests) {
            // Figure out duplicates to remove from the requests
            requests = this.removeDuplicateRequests(requests);
            // Figure out which watchers to start and which to stop
            const requestsToStart = [];
            const watchersToStop = new Set(Array.from(this.watchers));
            for (const request of requests) {
                const watcher = this.findWatcher(request);
                if (watcher && (0, glob_1.patternsEquals)(watcher.request.excludes, request.excludes) && (0, glob_1.patternsEquals)(watcher.request.includes, request.includes) && watcher.request.pollingInterval === request.pollingInterval) {
                    watchersToStop.delete(watcher); // keep watcher
                }
                else {
                    requestsToStart.push(request); // start watching
                }
            }
            // Logging
            if (requestsToStart.length) {
                this.trace(`Request to start watching: ${requestsToStart.map(request => this.requestToString(request)).join(',')}`);
            }
            if (watchersToStop.size) {
                this.trace(`Request to stop watching: ${Array.from(watchersToStop).map(watcher => this.requestToString(watcher.request)).join(',')}`);
            }
            // Stop watching as instructed
            for (const watcher of watchersToStop) {
                await this.stopWatching(watcher);
            }
            // Start watching as instructed
            for (const request of requestsToStart) {
                if (request.pollingInterval) {
                    this.startPolling(request, request.pollingInterval);
                }
                else {
                    this.startWatching(request);
                }
            }
        }
        findWatcher(request) {
            for (const watcher of this.watchers) {
                // Requests or watchers with correlation always match on that
                if (this.isCorrelated(request) || this.isCorrelated(watcher.request)) {
                    if (watcher.request.correlationId === request.correlationId) {
                        return watcher;
                    }
                }
                // Non-correlated requests or watchers match on path
                else {
                    if ((0, extpath_1.isEqual)(watcher.request.path, request.path, !platform_1.isLinux /* ignorecase */)) {
                        return watcher;
                    }
                }
            }
            return undefined;
        }
        startPolling(request, pollingInterval, restarts = 0) {
            const cts = new cancellation_1.CancellationTokenSource();
            const instance = new async_1.DeferredPromise();
            const snapshotFile = (0, extpath_1.randomPath)((0, os_1.tmpdir)(), 'vscode-watcher-snapshot');
            // Remember as watcher instance
            const watcher = new ParcelWatcherInstance(instance.p, request, restarts, cts.token, new async_1.RunOnceWorker(events => this.handleParcelEvents(events, watcher), ParcelWatcher.FILE_CHANGES_HANDLER_DELAY), async () => {
                cts.dispose(true);
                watcher.worker.flush();
                watcher.worker.dispose();
                pollingWatcher.dispose();
                (0, fs_1.unlinkSync)(snapshotFile);
            });
            this.watchers.add(watcher);
            // Path checks for symbolic links / wrong casing
            const { realPath, realPathDiffers, realPathLength } = this.normalizePath(request);
            this.trace(`Started watching: '${realPath}' with polling interval '${pollingInterval}'`);
            let counter = 0;
            const pollingWatcher = new async_1.RunOnceScheduler(async () => {
                counter++;
                if (cts.token.isCancellationRequested) {
                    return;
                }
                // We already ran before, check for events since
                if (counter > 1) {
                    const parcelEvents = await parcelWatcher.getEventsSince(realPath, snapshotFile, { ignore: request.excludes, backend: ParcelWatcher.PARCEL_WATCHER_BACKEND });
                    if (cts.token.isCancellationRequested) {
                        return;
                    }
                    // Handle & emit events
                    this.onParcelEvents(parcelEvents, watcher, realPathDiffers, realPathLength);
                }
                // Store a snapshot of files to the snapshot file
                await parcelWatcher.writeSnapshot(realPath, snapshotFile, { ignore: request.excludes, backend: ParcelWatcher.PARCEL_WATCHER_BACKEND });
                // Signal we are ready now when the first snapshot was written
                if (counter === 1) {
                    instance.complete();
                }
                if (cts.token.isCancellationRequested) {
                    return;
                }
                // Schedule again at the next interval
                pollingWatcher.schedule();
            }, pollingInterval);
            pollingWatcher.schedule(0);
        }
        startWatching(request, restarts = 0) {
            const cts = new cancellation_1.CancellationTokenSource();
            const instance = new async_1.DeferredPromise();
            // Remember as watcher instance
            const watcher = new ParcelWatcherInstance(instance.p, request, restarts, cts.token, new async_1.RunOnceWorker(events => this.handleParcelEvents(events, watcher), ParcelWatcher.FILE_CHANGES_HANDLER_DELAY), async () => {
                cts.dispose(true);
                watcher.worker.flush();
                watcher.worker.dispose();
                const watcherInstance = await instance.p;
                await watcherInstance?.unsubscribe();
            });
            this.watchers.add(watcher);
            // Path checks for symbolic links / wrong casing
            const { realPath, realPathDiffers, realPathLength } = this.normalizePath(request);
            parcelWatcher.subscribe(realPath, (error, parcelEvents) => {
                if (watcher.token.isCancellationRequested) {
                    return; // return early when disposed
                }
                // In any case of an error, treat this like a unhandled exception
                // that might require the watcher to restart. We do not really know
                // the state of parcel at this point and as such will try to restart
                // up to our maximum of restarts.
                if (error) {
                    this.onUnexpectedError(error, watcher);
                }
                // Handle & emit events
                this.onParcelEvents(parcelEvents, watcher, realPathDiffers, realPathLength);
            }, {
                backend: ParcelWatcher.PARCEL_WATCHER_BACKEND,
                ignore: watcher.request.excludes
            }).then(parcelWatcher => {
                this.trace(`Started watching: '${realPath}' with backend '${ParcelWatcher.PARCEL_WATCHER_BACKEND}'`);
                instance.complete(parcelWatcher);
            }).catch(error => {
                this.onUnexpectedError(error, watcher);
                instance.complete(undefined);
                watcher.notifyWatchFailed();
                this._onDidWatchFail.fire(request);
            });
        }
        onParcelEvents(parcelEvents, watcher, realPathDiffers, realPathLength) {
            if (parcelEvents.length === 0) {
                return;
            }
            // Normalize events: handle NFC normalization and symlinks
            // It is important to do this before checking for includes
            // to check on the original path.
            this.normalizeEvents(parcelEvents, watcher.request, realPathDiffers, realPathLength);
            // Check for includes
            const includedEvents = this.handleIncludes(watcher, parcelEvents);
            // Add to event aggregator for later processing
            for (const includedEvent of includedEvents) {
                watcher.worker.work(includedEvent);
            }
        }
        handleIncludes(watcher, parcelEvents) {
            const events = [];
            for (const { path, type: parcelEventType } of parcelEvents) {
                const type = ParcelWatcher.MAP_PARCEL_WATCHER_ACTION_TO_FILE_CHANGE.get(parcelEventType);
                if (this.verboseLogging) {
                    this.traceWithCorrelation(`${type === 1 /* FileChangeType.ADDED */ ? '[ADDED]' : type === 2 /* FileChangeType.DELETED */ ? '[DELETED]' : '[CHANGED]'} ${path}`, watcher.request);
                }
                // Apply include filter if any
                if (!watcher.include(path)) {
                    if (this.verboseLogging) {
                        this.traceWithCorrelation(` >> ignored (not included) ${path}`, watcher.request);
                    }
                }
                else {
                    events.push({ type, resource: uri_1.URI.file(path), cId: watcher.request.correlationId });
                }
            }
            return events;
        }
        handleParcelEvents(parcelEvents, watcher) {
            // Coalesce events: merge events of same kind
            const coalescedEvents = (0, watcher_1.coalesceEvents)(parcelEvents);
            // Filter events: check for specific events we want to exclude
            const { events: filteredEvents, rootDeleted } = this.filterEvents(coalescedEvents, watcher);
            // Broadcast to clients
            this.emitEvents(filteredEvents, watcher);
            // Handle root path deletes
            if (rootDeleted) {
                this.onWatchedPathDeleted(watcher);
            }
        }
        emitEvents(events, watcher) {
            if (events.length === 0) {
                return;
            }
            // Broadcast to clients via throttler
            const worked = this.throttledFileChangesEmitter.work(events);
            // Logging
            if (!worked) {
                this.warn(`started ignoring events due to too many file change events at once (incoming: ${events.length}, most recent change: ${events[0].resource.fsPath}). Use 'files.watcherExclude' setting to exclude folders with lots of changing files (e.g. compilation output).`);
            }
            else {
                if (this.throttledFileChangesEmitter.pending > 0) {
                    this.trace(`started throttling events due to large amount of file change events at once (pending: ${this.throttledFileChangesEmitter.pending}, most recent change: ${events[0].resource.fsPath}). Use 'files.watcherExclude' setting to exclude folders with lots of changing files (e.g. compilation output).`, watcher);
                }
            }
        }
        normalizePath(request) {
            let realPath = request.path;
            let realPathDiffers = false;
            let realPathLength = request.path.length;
            try {
                // First check for symbolic link
                realPath = (0, extpath_2.realpathSync)(request.path);
                // Second check for casing difference
                // Note: this will be a no-op on Linux platforms
                if (request.path === realPath) {
                    realPath = (0, extpath_2.realcaseSync)(request.path) ?? request.path;
                }
                // Correct watch path as needed
                if (request.path !== realPath) {
                    realPathLength = realPath.length;
                    realPathDiffers = true;
                    this.trace(`correcting a path to watch that seems to be a symbolic link or wrong casing (original: ${request.path}, real: ${realPath})`);
                }
            }
            catch (error) {
                // ignore
            }
            return { realPath, realPathDiffers, realPathLength };
        }
        normalizeEvents(events, request, realPathDiffers, realPathLength) {
            for (const event of events) {
                // Mac uses NFD unicode form on disk, but we want NFC
                if (platform_1.isMacintosh) {
                    event.path = (0, normalization_1.normalizeNFC)(event.path);
                }
                // Workaround for https://github.com/parcel-bundler/watcher/issues/68
                // where watching root drive letter adds extra backslashes.
                if (platform_1.isWindows) {
                    if (request.path.length <= 3) { // for ex. c:, C:\
                        event.path = (0, path_1.normalize)(event.path);
                    }
                }
                // Convert paths back to original form in case it differs
                if (realPathDiffers) {
                    event.path = request.path + event.path.substr(realPathLength);
                }
            }
        }
        filterEvents(events, watcher) {
            const filteredEvents = [];
            let rootDeleted = false;
            const filter = this.isCorrelated(watcher.request) ? watcher.request.filter : undefined; // TODO@bpasero filtering for now is only enabled when correlating because watchers are otherwise potentially reused
            for (const event of events) {
                // Emit to instance subscriptions if any before filtering
                if (watcher.subscriptionsCount > 0) {
                    watcher.notifyFileChange(event.resource.fsPath, event);
                }
                // Filtering
                rootDeleted = event.type === 2 /* FileChangeType.DELETED */ && (0, extpath_1.isEqual)(event.resource.fsPath, watcher.request.path, !platform_1.isLinux);
                if ((0, watcher_1.isFiltered)(event, filter) ||
                    // Explicitly exclude changes to root if we have any
                    // to avoid VS Code closing all opened editors which
                    // can happen e.g. in case of network connectivity
                    // issues
                    // (https://github.com/microsoft/vscode/issues/136673)
                    //
                    // Update 2024: with the new correlated events, we
                    // really do not want to skip over file events any
                    // more, so we only ignore this event for non-correlated
                    // watch requests.
                    (rootDeleted && !this.isCorrelated(watcher.request))) {
                    if (this.verboseLogging) {
                        this.traceWithCorrelation(` >> ignored (filtered) ${event.resource.fsPath}`, watcher.request);
                    }
                    continue;
                }
                // Logging
                this.traceEvent(event, watcher.request);
                filteredEvents.push(event);
            }
            return { events: filteredEvents, rootDeleted };
        }
        onWatchedPathDeleted(watcher) {
            this.warn('Watcher shutdown because watched path got deleted', watcher);
            let legacyMonitored = false;
            if (!this.isCorrelated(watcher.request)) {
                // Do monitoring of the request path parent unless this request
                // can be handled via suspend/resume in the super class
                legacyMonitored = this.legacyMonitorRequest(watcher);
            }
            if (!legacyMonitored) {
                watcher.notifyWatchFailed();
                this._onDidWatchFail.fire(watcher.request);
            }
        }
        legacyMonitorRequest(watcher) {
            const parentPath = (0, path_1.dirname)(watcher.request.path);
            if ((0, fs_1.existsSync)(parentPath)) {
                this.trace('Trying to watch on the parent path to restart the watcher...', watcher);
                const nodeWatcher = new nodejsWatcherLib_1.NodeJSFileWatcherLibrary({ path: parentPath, excludes: [], recursive: false, correlationId: watcher.request.correlationId }, undefined, changes => {
                    if (watcher.token.isCancellationRequested) {
                        return; // return early when disposed
                    }
                    // Watcher path came back! Restart watching...
                    for (const { resource, type } of changes) {
                        if ((0, extpath_1.isEqual)(resource.fsPath, watcher.request.path, !platform_1.isLinux) && (type === 1 /* FileChangeType.ADDED */ || type === 0 /* FileChangeType.UPDATED */)) {
                            if (this.isPathValid(watcher.request.path)) {
                                this.warn('Watcher restarts because watched path got created again', watcher);
                                // Stop watching that parent folder
                                nodeWatcher.dispose();
                                // Restart the file watching
                                this.restartWatching(watcher);
                                break;
                            }
                        }
                    }
                }, undefined, msg => this._onDidLogMessage.fire(msg), this.verboseLogging);
                // Make sure to stop watching when the watcher is disposed
                watcher.token.onCancellationRequested(() => nodeWatcher.dispose());
                return true;
            }
            return false;
        }
        onUnexpectedError(error, watcher) {
            const msg = (0, errorMessage_1.toErrorMessage)(error);
            // Specially handle ENOSPC errors that can happen when
            // the watcher consumes so many file descriptors that
            // we are running into a limit. We only want to warn
            // once in this case to avoid log spam.
            // See https://github.com/microsoft/vscode/issues/7950
            if (msg.indexOf('No space left on device') !== -1) {
                if (!this.enospcErrorLogged) {
                    this.error('Inotify limit reached (ENOSPC)', watcher);
                    this.enospcErrorLogged = true;
                }
            }
            // Any other error is unexpected and we should try to
            // restart the watcher as a result to get into healthy
            // state again if possible and if not attempted too much
            else {
                this.error(`Unexpected error: ${msg} (EUNKNOWN)`, watcher);
                this._onDidError.fire(msg);
            }
        }
        async stop() {
            await super.stop();
            for (const watcher of this.watchers) {
                await this.stopWatching(watcher);
            }
        }
        restartWatching(watcher, delay = 800) {
            // Restart watcher delayed to accomodate for
            // changes on disk that have triggered the
            // need for a restart in the first place.
            const scheduler = new async_1.RunOnceScheduler(async () => {
                if (watcher.token.isCancellationRequested) {
                    return; // return early when disposed
                }
                const restartPromise = new async_1.DeferredPromise();
                try {
                    // Await the watcher having stopped, as this is
                    // needed to properly re-watch the same path
                    await this.stopWatching(watcher, restartPromise.p);
                    // Start watcher again counting the restarts
                    if (watcher.request.pollingInterval) {
                        this.startPolling(watcher.request, watcher.request.pollingInterval, watcher.restarts + 1);
                    }
                    else {
                        this.startWatching(watcher.request, watcher.restarts + 1);
                    }
                }
                finally {
                    restartPromise.complete();
                }
            }, delay);
            scheduler.schedule();
            watcher.token.onCancellationRequested(() => scheduler.dispose());
        }
        async stopWatching(watcher, joinRestart) {
            this.trace(`stopping file watcher`, watcher);
            this.watchers.delete(watcher);
            try {
                await watcher.stop(joinRestart);
            }
            catch (error) {
                this.error(`Unexpected error stopping watcher: ${(0, errorMessage_1.toErrorMessage)(error)}`, watcher);
            }
        }
        removeDuplicateRequests(requests, validatePaths = true) {
            // Sort requests by path length to have shortest first
            // to have a way to prevent children to be watched if
            // parents exist.
            requests.sort((requestA, requestB) => requestA.path.length - requestB.path.length);
            // Ignore requests for the same paths that have the same correlation
            const mapCorrelationtoRequests = new Map();
            for (const request of requests) {
                if (request.excludes.includes(glob_1.GLOBSTAR)) {
                    continue; // path is ignored entirely (via `**` glob exclude)
                }
                const path = platform_1.isLinux ? request.path : request.path.toLowerCase(); // adjust for case sensitivity
                let requestsForCorrelation = mapCorrelationtoRequests.get(request.correlationId);
                if (!requestsForCorrelation) {
                    requestsForCorrelation = new Map();
                    mapCorrelationtoRequests.set(request.correlationId, requestsForCorrelation);
                }
                if (requestsForCorrelation.has(path)) {
                    this.trace(`ignoring a request for watching who's path is already watched: ${this.requestToString(request)}`);
                }
                requestsForCorrelation.set(path, request);
            }
            const normalizedRequests = [];
            for (const requestsForCorrelation of mapCorrelationtoRequests.values()) {
                // Only consider requests for watching that are not
                // a child of an existing request path to prevent
                // duplication. In addition, drop any request where
                // everything is excluded (via `**` glob).
                //
                // However, allow explicit requests to watch folders
                // that are symbolic links because the Parcel watcher
                // does not allow to recursively watch symbolic links.
                const requestTrie = ternarySearchTree_1.TernarySearchTree.forPaths(!platform_1.isLinux);
                for (const request of requestsForCorrelation.values()) {
                    // Check for overlapping requests
                    if (requestTrie.findSubstr(request.path)) {
                        try {
                            const realpath = (0, extpath_2.realpathSync)(request.path);
                            if (realpath === request.path) {
                                this.trace(`ignoring a request for watching who's parent is already watched: ${this.requestToString(request)}`);
                                continue;
                            }
                        }
                        catch (error) {
                            this.trace(`ignoring a request for watching who's realpath failed to resolve: ${this.requestToString(request)} (error: ${error})`);
                            this._onDidWatchFail.fire(request);
                            continue;
                        }
                    }
                    // Check for invalid paths
                    if (validatePaths && !this.isPathValid(request.path)) {
                        this._onDidWatchFail.fire(request);
                        continue;
                    }
                    requestTrie.set(request.path, request);
                }
                normalizedRequests.push(...Array.from(requestTrie).map(([, request]) => request));
            }
            return normalizedRequests;
        }
        isPathValid(path) {
            try {
                const stat = (0, fs_1.statSync)(path);
                if (!stat.isDirectory()) {
                    this.trace(`ignoring a path for watching that is a file and not a folder: ${path}`);
                    return false;
                }
            }
            catch (error) {
                this.trace(`ignoring a path for watching who's stat info failed to resolve: ${path} (error: ${error})`);
                return false;
            }
            return true;
        }
        subscribe(path, callback) {
            for (const watcher of this.watchers) {
                if (watcher.failed) {
                    continue; // watcher has already failed
                }
                if (!(0, extpath_1.isEqualOrParent)(path, watcher.request.path, !platform_1.isLinux)) {
                    continue; // watcher does not consider this path
                }
                if (watcher.exclude(path) ||
                    !watcher.include(path)) {
                    continue; // parcel instance does not consider this path
                }
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(event_1.Event.once(watcher.onDidStop)(async (e) => {
                    await e.joinRestart; // if we are restarting, await that so that we can possibly reuse this watcher again
                    if (disposables.isDisposed) {
                        return;
                    }
                    callback(true /* error */);
                }));
                disposables.add(event_1.Event.once(watcher.onDidFail)(() => callback(true /* error */)));
                disposables.add(watcher.subscribe(path, change => callback(null, change)));
                return disposables;
            }
            return undefined;
        }
        trace(message, watcher) {
            if (this.verboseLogging) {
                this._onDidLogMessage.fire({ type: 'trace', message: this.toMessage(message, watcher) });
            }
        }
        warn(message, watcher) {
            this._onDidLogMessage.fire({ type: 'warn', message: this.toMessage(message, watcher) });
        }
        error(message, watcher) {
            this._onDidLogMessage.fire({ type: 'error', message: this.toMessage(message, watcher) });
        }
        toMessage(message, watcher) {
            return watcher ? `[File Watcher (parcel)] ${message} (path: ${watcher.request.path})` : `[File Watcher (parcel)] ${message}`;
        }
        get recursiveWatcher() { return this; }
    }
    exports.ParcelWatcher = ParcelWatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyY2VsV2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL25vZGUvd2F0Y2hlci9wYXJjZWwvcGFyY2VsV2F0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLE1BQWEscUJBQXNCLFNBQVEsc0JBQVU7UUFTcEQsSUFBSSxNQUFNLEtBQWMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUc5QyxJQUFJLE9BQU8sS0FBYyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBTy9DO1FBQ0M7O1dBRUc7UUFDTSxLQUF1QixFQUN2QixPQUErQjtRQUN4Qzs7O1dBR0c7UUFDTSxRQUFnQjtRQUN6Qjs7V0FFRztRQUNNLEtBQXdCO1FBQ2pDOztXQUVHO1FBQ00sTUFBa0MsRUFDMUIsTUFBMkI7WUFFNUMsS0FBSyxFQUFFLENBQUM7WUFqQkMsVUFBSyxHQUFMLEtBQUssQ0FBa0I7WUFDdkIsWUFBTyxHQUFQLE9BQU8sQ0FBd0I7WUFLL0IsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUloQixVQUFLLEdBQUwsS0FBSyxDQUFtQjtZQUl4QixXQUFNLEdBQU4sTUFBTSxDQUE0QjtZQUMxQixXQUFNLEdBQU4sTUFBTSxDQUFxQjtZQXBDNUIsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW1DLENBQUMsQ0FBQztZQUNwRixjQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFFMUIsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3pELGNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUVuQyxZQUFPLEdB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