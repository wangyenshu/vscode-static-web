/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/lifecycle", "vs/platform/files/common/watcher", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/async"], function (require, exports, fs_1, lifecycle_1, watcher_1, event_1, uri_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseWatcher = void 0;
    class BaseWatcher extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._onDidLogMessage = this._register(new event_1.Emitter());
            this.onDidLogMessage = this._onDidLogMessage.event;
            this._onDidWatchFail = this._register(new event_1.Emitter());
            this.onDidWatchFail = this._onDidWatchFail.event;
            this.allNonCorrelatedWatchRequests = new Set();
            this.allCorrelatedWatchRequests = new Map();
            this.suspendedWatchRequests = this._register(new lifecycle_1.DisposableMap());
            this.suspendedWatchRequestsWithPolling = new Set();
            this.suspendedWatchRequestPollingInterval = 5007; // node.js default
            this.joinWatch = new async_1.DeferredPromise();
            this.verboseLogging = false;
            this._register(this.onDidWatchFail(request => this.handleDidWatchFail(request)));
        }
        handleDidWatchFail(request) {
            if (!this.isCorrelated(request)) {
                // For now, limit failed watch monitoring to requests with a correlationId
                // to experiment with this feature in a controlled way. Monitoring requests
                // requires us to install polling watchers (via `fs.watchFile()`) and thus
                // should be used sparingly.
                //
                // TODO@bpasero revisit this in the future to have a more general approach
                // for suspend/resume and drop the `legacyMonitorRequest` in parcel.
                // One issue is that we need to be able to uniquely identify a request and
                // without correlation that is actually harder...
                return;
            }
            this.suspendWatchRequest(request);
        }
        isCorrelated(request) {
            return (0, watcher_1.isWatchRequestWithCorrelation)(request);
        }
        async watch(requests) {
            if (!this.joinWatch.isSettled) {
                this.joinWatch.complete();
            }
            this.joinWatch = new async_1.DeferredPromise();
            try {
                this.allCorrelatedWatchRequests.clear();
                this.allNonCorrelatedWatchRequests.clear();
                // Figure out correlated vs. non-correlated requests
                for (const request of requests) {
                    if (this.isCorrelated(request)) {
                        this.allCorrelatedWatchRequests.set(request.correlationId, request);
                    }
                    else {
                        this.allNonCorrelatedWatchRequests.add(request);
                    }
                }
                // Remove all suspended correlated watch requests that are no longer watched
                for (const [correlationId] of this.suspendedWatchRequests) {
                    if (!this.allCorrelatedWatchRequests.has(correlationId)) {
                        this.suspendedWatchRequests.deleteAndDispose(correlationId);
                        this.suspendedWatchRequestsWithPolling.delete(correlationId);
                    }
                }
                return await this.updateWatchers();
            }
            finally {
                this.joinWatch.complete();
            }
        }
        updateWatchers() {
            return this.doWatch([
                ...this.allNonCorrelatedWatchRequests,
                ...Array.from(this.allCorrelatedWatchRequests.values()).filter(request => !this.suspendedWatchRequests.has(request.correlationId))
            ]);
        }
        isSuspended(request) {
            if (typeof request.correlationId !== 'number') {
                return false;
            }
            return this.suspendedWatchRequestsWithPolling.has(request.correlationId) ? 'polling' : this.suspendedWatchRequests.has(request.correlationId);
        }
        async suspendWatchRequest(request) {
            if (this.suspendedWatchRequests.has(request.correlationId)) {
                return; // already suspended
            }
            const disposables = new lifecycle_1.DisposableStore();
            this.suspendedWatchRequests.set(request.correlationId, disposables);
            // It is possible that a watch request fails right during watch()
            // phase while other requests succeed. To increase the chance of
            // reusing another watcher for suspend/resume tracking, we await
            // all watch requests having processed.
            await this.joinWatch.p;
            if (disposables.isDisposed) {
                return;
            }
            this.monitorSuspendedWatchRequest(request, disposables);
            this.updateWatchers();
        }
        resumeWatchRequest(request) {
            this.suspendedWatchRequests.deleteAndDispose(request.correlationId);
            this.suspendedWatchRequestsWithPolling.delete(request.correlationId);
            this.updateWatchers();
        }
        monitorSuspendedWatchRequest(request, disposables) {
            if (this.doMonitorWithExistingWatcher(request, disposables)) {
                this.trace(`reusing an existing recursive watcher to monitor ${request.path}`);
                this.suspendedWatchRequestsWithPolling.delete(request.correlationId);
            }
            else {
                this.doMonitorWithNodeJS(request, disposables);
                this.suspendedWatchRequestsWithPolling.add(request.correlationId);
            }
        }
        doMonitorWithExistingWatcher(request, disposables) {
            const subscription = this.recursiveWatcher?.subscribe(request.path, (error, change) => {
                if (disposables.isDisposed) {
                    return; // return early if already disposed
                }
                if (error) {
                    this.monitorSuspendedWatchRequest(request, disposables);
                }
                else if (change?.type === 1 /* FileChangeType.ADDED */) {
                    this.onMonitoredPathAdded(request);
                }
            });
            if (subscription) {
                disposables.add(subscription);
                return true;
            }
            return false;
        }
        doMonitorWithNodeJS(request, disposables) {
            let pathNotFound = false;
            const watchFileCallback = (curr, prev) => {
                if (disposables.isDisposed) {
                    return; // return early if already disposed
                }
                const currentPathNotFound = this.isPathNotFound(curr);
                const previousPathNotFound = this.isPathNotFound(prev);
                const oldPathNotFound = pathNotFound;
                pathNotFound = currentPathNotFound;
                // Watch path created: resume watching request
                if (!currentPathNotFound && (previousPathNotFound || oldPathNotFound)) {
                    this.onMonitoredPathAdded(request);
                }
            };
            this.trace(`starting fs.watchFile() on ${request.path} (correlationId: ${request.correlationId})`);
            try {
                (0, fs_1.watchFile)(request.path, { persistent: false, interval: this.suspendedWatchRequestPollingInterval }, watchFileCallback);
            }
            catch (error) {
                this.warn(`fs.watchFile() failed with error ${error} on path ${request.path} (correlationId: ${request.correlationId})`);
            }
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                this.trace(`stopping fs.watchFile() on ${request.path} (correlationId: ${request.correlationId})`);
                try {
                    (0, fs_1.unwatchFile)(request.path, watchFileCallback);
                }
                catch (error) {
                    this.warn(`fs.unwatchFile() failed with error ${error} on path ${request.path} (correlationId: ${request.correlationId})`);
                }
            }));
        }
        onMonitoredPathAdded(request) {
            this.trace(`detected ${request.path} exists again, resuming watcher (correlationId: ${request.correlationId})`);
            // Emit as event
            const event = { resource: uri_1.URI.file(request.path), type: 1 /* FileChangeType.ADDED */, cId: request.correlationId };
            this._onDidChangeFile.fire([event]);
            this.traceEvent(event, request);
            // Resume watching
            this.resumeWatchRequest(request);
        }
        isPathNotFound(stats) {
            return stats.ctimeMs === 0 && stats.ino === 0;
        }
        async stop() {
            this.suspendedWatchRequests.clearAndDisposeAll();
            this.suspendedWatchRequestsWithPolling.clear();
        }
        traceEvent(event, request) {
            if (this.verboseLogging) {
                const traceMsg = ` >> normalized ${event.type === 1 /* FileChangeType.ADDED */ ? '[ADDED]' : event.type === 2 /* FileChangeType.DELETED */ ? '[DELETED]' : '[CHANGED]'} ${event.resource.fsPath}`;
                this.traceWithCorrelation(traceMsg, request);
            }
        }
        traceWithCorrelation(message, request) {
            if (this.verboseLogging) {
                this.trace(`${message}${typeof request.correlationId === 'number' ? ` <${request.correlationId}> ` : ``}`);
            }
        }
        requestToString(request) {
            return `${request.path} (excludes: ${request.excludes.length > 0 ? request.excludes : '<none>'}, includes: ${request.includes && request.includes.length > 0 ? JSON.stringify(request.includes) : '<all>'}, filter: ${(0, watcher_1.requestFilterToString)(request.filter)}, correlationId: ${typeof request.correlationId === 'number' ? request.correlationId : '<none>'})`;
        }
        async setVerboseLogging(enabled) {
            this.verboseLogging = enabled;
        }
    }
    exports.BaseWatcher = BaseWatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZVdhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9maWxlcy9ub2RlL3dhdGNoZXIvYmFzZVdhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQXNCLFdBQVksU0FBUSxzQkFBVTtRQXFCbkQ7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQXBCVSxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFpQixDQUFDLENBQUM7WUFDMUUsb0JBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBRXBDLHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWUsQ0FBQyxDQUFDO1lBQ3hFLG9CQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQUVwQyxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTBCLENBQUMsQ0FBQztZQUMxRSxtQkFBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1lBRTVDLGtDQUE2QixHQUFHLElBQUksR0FBRyxFQUEwQixDQUFDO1lBQ2xFLCtCQUEwQixHQUFHLElBQUksR0FBRyxFQUE2RCxDQUFDO1lBRWxHLDJCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUErQixDQUFDLENBQUM7WUFDMUYsc0NBQWlDLEdBQUcsSUFBSSxHQUFHLEVBQStCLENBQUM7WUFFekUseUNBQW9DLEdBQVcsSUFBSSxDQUFDLENBQUMsa0JBQWtCO1lBRWxGLGNBQVMsR0FBRyxJQUFJLHVCQUFlLEVBQVEsQ0FBQztZQWtPdEMsbUJBQWMsR0FBRyxLQUFLLENBQUM7WUE3TmhDLElB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