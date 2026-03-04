/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/files/common/files"], function (require, exports, glob_1, lifecycle_1, path_1, platform_1, uri_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractUniversalWatcherClient = exports.AbstractNonRecursiveWatcherClient = exports.AbstractWatcherClient = void 0;
    exports.isWatchRequestWithCorrelation = isWatchRequestWithCorrelation;
    exports.isRecursiveWatchRequest = isRecursiveWatchRequest;
    exports.reviveFileChanges = reviveFileChanges;
    exports.coalesceEvents = coalesceEvents;
    exports.normalizeWatcherPattern = normalizeWatcherPattern;
    exports.parseWatcherPatterns = parseWatcherPatterns;
    exports.isFiltered = isFiltered;
    exports.requestFilterToString = requestFilterToString;
    function isWatchRequestWithCorrelation(request) {
        return typeof request.correlationId === 'number';
    }
    function isRecursiveWatchRequest(request) {
        return request.recursive === true;
    }
    class AbstractWatcherClient extends lifecycle_1.Disposable {
        static { this.MAX_RESTARTS = 5; }
        constructor(onFileChanges, onLogMessage, verboseLogging, options) {
            super();
            this.onFileChanges = onFileChanges;
            this.onLogMessage = onLogMessage;
            this.verboseLogging = verboseLogging;
            this.options = options;
            this.watcherDisposables = this._register(new lifecycle_1.MutableDisposable());
            this.requests = undefined;
            this.restartCounter = 0;
        }
        init() {
            // Associate disposables to the watcher
            const disposables = new lifecycle_1.DisposableStore();
            this.watcherDisposables.value = disposables;
            // Ask implementors to create the watcher
            this.watcher = this.createWatcher(disposables);
            this.watcher.setVerboseLogging(this.verboseLogging);
            // Wire in event handlers
            disposables.add(this.watcher.onDidChangeFile(changes => this.onFileChanges(changes)));
            disposables.add(this.watcher.onDidLogMessage(msg => this.onLogMessage(msg)));
            disposables.add(this.watcher.onDidError(error => this.onError(error)));
        }
        onError(error) {
            // Restart on error (up to N times, if enabled)
            if (this.options.restartOnError) {
                if (this.restartCounter < AbstractWatcherClient.MAX_RESTARTS && this.requests) {
                    this.error(`restarting watcher after error: ${error}`);
                    this.restart(this.requests);
                }
                else {
                    this.error(`gave up attempting to restart watcher after error: ${error}`);
                }
            }
            // Do not attempt to restart if not enabled
            else {
                this.error(error);
            }
        }
        restart(requests) {
            this.restartCounter++;
            this.init();
            this.watch(requests);
        }
        async watch(requests) {
            this.requests = requests;
            await this.watcher?.watch(requests);
        }
        async setVerboseLogging(verboseLogging) {
            this.verboseLogging = verboseLogging;
            await this.watcher?.setVerboseLogging(verboseLogging);
        }
        error(message) {
            this.onLogMessage({ type: 'error', message: `[File Watcher (${this.options.type})] ${message}` });
        }
        trace(message) {
            this.onLogMessage({ type: 'trace', message: `[File Watcher (${this.options.type})] ${message}` });
        }
        dispose() {
            // Render the watcher invalid from here
            this.watcher = undefined;
            return super.dispose();
        }
    }
    exports.AbstractWatcherClient = AbstractWatcherClient;
    class AbstractNonRecursiveWatcherClient extends AbstractWatcherClient {
        constructor(onFileChanges, onLogMessage, verboseLogging) {
            super(onFileChanges, onLogMessage, verboseLogging, { type: 'node.js', restartOnError: false });
        }
    }
    exports.AbstractNonRecursiveWatcherClient = AbstractNonRecursiveWatcherClient;
    class AbstractUniversalWatcherClient extends AbstractWatcherClient {
        constructor(onFileChanges, onLogMessage, verboseLogging) {
            super(onFileChanges, onLogMessage, verboseLogging, { type: 'universal', restartOnError: true });
        }
    }
    exports.AbstractUniversalWatcherClient = AbstractUniversalWatcherClient;
    function reviveFileChanges(changes) {
        return changes.map(change => ({
            type: change.type,
            resource: uri_1.URI.revive(change.resource),
            cId: change.cId
        }));
    }
    function coalesceEvents(changes) {
        // Build deltas
        const coalescer = new EventCoalescer();
        for (const event of changes) {
            coalescer.processEvent(event);
        }
        return coalescer.coalesce();
    }
    function normalizeWatcherPattern(path, pattern) {
        // Patterns are always matched on the full absolute path
        // of the event. As such, if the pattern is not absolute
        // and is a string and does not start with a leading
        // `**`, we have to convert it to a relative pattern with
        // the given `base`
        if (typeof pattern === 'string' && !pattern.startsWith(glob_1.GLOBSTAR) && !(0, path_1.isAbsolute)(pattern)) {
            return { base: path, pattern };
        }
        return pattern;
    }
    function parseWatcherPatterns(path, patterns) {
        const parsedPatterns = [];
        for (const pattern of patterns) {
            parsedPatterns.push((0, glob_1.parse)(normalizeWatcherPattern(path, pattern)));
        }
        return parsedPatterns;
    }
    class EventCoalescer {
        constructor() {
            this.coalesced = new Set();
            this.mapPathToChange = new Map();
        }
        toKey(event) {
            if (platform_1.isLinux) {
                return event.resource.fsPath;
            }
            return event.resource.fsPath.toLowerCase(); // normalise to file system case sensitivity
        }
        processEvent(event) {
            const existingEvent = this.mapPathToChange.get(this.toKey(event));
            let keepEvent = false;
            // Event path already exists
            if (existingEvent) {
                const currentChangeType = existingEvent.type;
                const newChangeType = event.type;
                // macOS/Windows: track renames to different case
                // by keeping both CREATE and DELETE events
                if (existingEvent.resource.fsPath !== event.resource.fsPath && (event.type === 2 /* FileChangeType.DELETED */ || event.type === 1 /* FileChangeType.ADDED */)) {
                    keepEvent = true;
                }
                // Ignore CREATE followed by DELETE in one go
                else if (currentChangeType === 1 /* FileChangeType.ADDED */ && newChangeType === 2 /* FileChangeType.DELETED */) {
                    this.mapPathToChange.delete(this.toKey(event));
                    this.coalesced.delete(existingEvent);
                }
                // Flatten DELETE followed by CREATE into CHANGE
                else if (currentChangeType === 2 /* FileChangeType.DELETED */ && newChangeType === 1 /* FileChangeType.ADDED */) {
                    existingEvent.type = 0 /* FileChangeType.UPDATED */;
                }
                // Do nothing. Keep the created event
                else if (currentChangeType === 1 /* FileChangeType.ADDED */ && newChangeType === 0 /* FileChangeType.UPDATED */) { }
                // Otherwise apply change type
                else {
                    existingEvent.type = newChangeType;
                }
            }
            // Otherwise keep
            else {
                keepEvent = true;
            }
            if (keepEvent) {
                this.coalesced.add(event);
                this.mapPathToChange.set(this.toKey(event), event);
            }
        }
        coalesce() {
            const addOrChangeEvents = [];
            const deletedPaths = [];
            // This algorithm will remove all DELETE events up to the root folder
            // that got deleted if any. This ensures that we are not producing
            // DELETE events for each file inside a folder that gets deleted.
            //
            // 1.) split ADD/CHANGE and DELETED events
            // 2.) sort short deleted paths to the top
            // 3.) for each DELETE, check if there is a deleted parent and ignore the event in that case
            return Array.from(this.coalesced).filter(e => {
                if (e.type !== 2 /* FileChangeType.DELETED */) {
                    addOrChangeEvents.push(e);
                    return false; // remove ADD / CHANGE
                }
                return true; // keep DELETE
            }).sort((e1, e2) => {
                return e1.resource.fsPath.length - e2.resource.fsPath.length; // shortest path first
            }).filter(e => {
                if (deletedPaths.some(deletedPath => (0, files_1.isParent)(e.resource.fsPath, deletedPath, !platform_1.isLinux /* ignorecase */))) {
                    return false; // DELETE is ignored if parent is deleted already
                }
                // otherwise mark as deleted
                deletedPaths.push(e.resource.fsPath);
                return true;
            }).concat(addOrChangeEvents);
        }
    }
    function isFiltered(event, filter) {
        if (typeof filter === 'number') {
            switch (event.type) {
                case 1 /* FileChangeType.ADDED */:
                    return (filter & 4 /* FileChangeFilter.ADDED */) === 0;
                case 2 /* FileChangeType.DELETED */:
                    return (filter & 8 /* FileChangeFilter.DELETED */) === 0;
                case 0 /* FileChangeType.UPDATED */:
                    return (filter & 2 /* FileChangeFilter.UPDATED */) === 0;
            }
        }
        return false;
    }
    function requestFilterToString(filter) {
        if (typeof filter === 'number') {
            const filters = [];
            if (filter & 4 /* FileChangeFilter.ADDED */) {
                filters.push('Added');
            }
            if (filter & 8 /* FileChangeFilter.DELETED */) {
                filters.push('Deleted');
            }
            if (filter & 2 /* FileChangeFilter.UPDATED */) {
                filters.push('Updated');
            }
            if (filters.length === 0) {
                return '<all>';
            }
            return `[${filters.join(', ')}]`;
        }
        return '<none>';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL2NvbW1vbi93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXVEaEcsc0VBRUM7SUF3QkQsMERBRUM7SUF3TkQsOENBTUM7SUFFRCx3Q0FTQztJQUVELDBEQWFDO0lBRUQsb0RBUUM7SUFnR0QsZ0NBYUM7SUFFRCxzREFxQkM7SUFsYUQsU0FBZ0IsNkJBQTZCLENBQUMsT0FBc0I7UUFDbkUsT0FBTyxPQUFPLE9BQU8sQ0FBQyxhQUFhLEtBQUssUUFBUSxDQUFDO0lBQ2xELENBQUM7SUF3QkQsU0FBZ0IsdUJBQXVCLENBQUMsT0FBc0I7UUFDN0QsT0FBTyxPQUFPLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQztJQUNuQyxDQUFDO0lBMEZELE1BQXNCLHFCQUFzQixTQUFRLHNCQUFVO2lCQUVyQyxpQkFBWSxHQUFHLENBQUMsQUFBSixDQUFLO1FBU3pDLFlBQ2tCLGFBQStDLEVBQy9DLFlBQXdDLEVBQ2pELGNBQXVCLEVBQ3ZCLE9BR1A7WUFFRCxLQUFLLEVBQUUsQ0FBQztZQVJTLGtCQUFhLEdBQWIsYUFBYSxDQUFrQztZQUMvQyxpQkFBWSxHQUFaLFlBQVksQ0FBNEI7WUFDakQsbUJBQWMsR0FBZCxjQUFjLENBQVM7WUFDdkIsWUFBTyxHQUFQLE9BQU8sQ0FHZDtZQWJlLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFFdEUsYUFBUSxHQUFnQyxTQUFTLENBQUM7WUFFbEQsbUJBQWMsR0FBRyxDQUFDLENBQUM7UUFZM0IsQ0FBQztRQUlTLElBQUk7WUFFYix1Q0FBdUM7WUFDdkMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7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