/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/glob", "vs/platform/files/node/watcher/baseWatcher", "vs/base/common/platform", "vs/platform/files/node/watcher/nodejs/nodejsWatcherLib", "vs/base/common/extpath"], function (require, exports, event_1, glob_1, baseWatcher_1, platform_1, nodejsWatcherLib_1, extpath_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeJSWatcher = void 0;
    class NodeJSWatcher extends baseWatcher_1.BaseWatcher {
        constructor(recursiveWatcher) {
            super();
            this.recursiveWatcher = recursiveWatcher;
            this.onDidError = event_1.Event.None;
            this.watchers = new Set();
        }
        async doWatch(requests) {
            // Figure out duplicates to remove from the requests
            requests = this.removeDuplicateRequests(requests);
            // Figure out which watchers to start and which to stop
            const requestsToStart = [];
            const watchersToStop = new Set(Array.from(this.watchers));
            for (const request of requests) {
                const watcher = this.findWatcher(request);
                if (watcher && (0, glob_1.patternsEquals)(watcher.request.excludes, request.excludes) && (0, glob_1.patternsEquals)(watcher.request.includes, request.includes)) {
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
                this.stopWatching(watcher);
            }
            // Start watching as instructed
            for (const request of requestsToStart) {
                this.startWatching(request);
            }
        }
        findWatcher(request) {
            for (const watcher of this.watchers) {
                // Requests or watchers with correlation always match on that
                if (typeof request.correlationId === 'number' || typeof watcher.request.correlationId === 'number') {
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
        startWatching(request) {
            // Start via node.js lib
            const instance = new nodejsWatcherLib_1.NodeJSFileWatcherLibrary(request, this.recursiveWatcher, changes => this._onDidChangeFile.fire(changes), () => this._onDidWatchFail.fire(request), msg => this._onDidLogMessage.fire(msg), this.verboseLogging);
            // Remember as watcher instance
            const watcher = { request, instance };
            this.watchers.add(watcher);
        }
        async stop() {
            await super.stop();
            for (const watcher of this.watchers) {
                this.stopWatching(watcher);
            }
        }
        stopWatching(watcher) {
            this.trace(`stopping file watcher`, watcher);
            this.watchers.delete(watcher);
            watcher.instance.dispose();
        }
        removeDuplicateRequests(requests) {
            const mapCorrelationtoRequests = new Map();
            // Ignore requests for the same paths that have the same correlation
            for (const request of requests) {
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
            return Array.from(mapCorrelationtoRequests.values()).map(requests => Array.from(requests.values())).flat();
        }
        async setVerboseLogging(enabled) {
            super.setVerboseLogging(enabled);
            for (const watcher of this.watchers) {
                watcher.instance.setVerboseLogging(enabled);
            }
        }
        trace(message, watcher) {
            if (this.verboseLogging) {
                this._onDidLogMessage.fire({ type: 'trace', message: this.toMessage(message, watcher) });
            }
        }
        warn(message) {
            this._onDidLogMessage.fire({ type: 'warn', message: this.toMessage(message) });
        }
        toMessage(message, watcher) {
            return watcher ? `[File Watcher (node.js)] ${message} (${this.requestToString(watcher.request)})` : `[File Watcher (node.js)] ${message}`;
        }
    }
    exports.NodeJSWatcher = NodeJSWatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZWpzV2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL25vZGUvd2F0Y2hlci9ub2RlanMvbm9kZWpzV2F0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLE1BQWEsYUFBYyxTQUFRLHlCQUFXO1FBTTdDLFlBQStCLGdCQUE0RDtZQUMxRixLQUFLLEVBQUUsQ0FBQztZQURzQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQTRDO1lBSmxGLGVBQVUsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBRXhCLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztRQUl0RCxDQUFDO1FBRWtCLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBcUM7WUFFckUsb0RBQW9EO1lBQ3BELFFBQVEsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFbEQsdURBQXVEO1lBQ3ZELE1BQU0sZUFBZSxHQUFnQyxFQUFFLENBQUM7WUFDeEQsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMxRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMxQyxJQUFJLE9BQU8sSUFBSSxJQUFBLHFCQUFjLEVBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUEscUJBQWMsRUFBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDekksY0FBYyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7Z0JBQ2hELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsaUJBQWlCO2dCQUNqRCxDQUFDO1lBQ0YsQ0FBQztZQUVELFVBQVU7WUFFVixJQUFJLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsZUFBZSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3JILENBQUM7WUFFRCxJQUFJLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdkksQ0FBQztZQUVELDhCQUE4QjtZQUM5QixLQUFLLE1BQU0sT0FBTyxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFFRCwrQkFBK0I7WUFDL0IsS0FBSyxNQUFNLE9BQU8sSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QixDQUFDO1FBQ0YsQ0FBQztRQUVPLFdBQVcsQ0FBQyxPQUFrQztZQUNyRCxLQUFLLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFFckMsNkRBQTZEO2dCQUM3RCxJQUFJLE9BQU8sT0FBTyxDQUFDLGFBQWEsS0FBSyxRQUFRLElBQUksT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWEsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDcEcsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWEsS0FBSyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUM7d0JBQzdELE9BQU8sT0FBTyxDQUFDO29CQUNoQixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsb0RBQW9EO3FCQUMvQyxDQUFDO29CQUNMLElBQUksSUFBQSxpQkFBTyxFQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxrQkFBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQzt3QkFDNUUsT0FBTyxPQUFPLENBQUM7b0JBQ2hCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRU8sYUFBYSxDQUFDLE9BQWtDO1lBRXZELHdCQUF3QjtZQUN4QixNQUFNLFFBQVEsR0FBRyxJQUFJLDJDQUF3QixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFck8sK0JBQStCO1lBQy9CLE1BQU0sT0FBTyxHQUEyQixFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQztZQUM5RCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRVEsS0FBSyxDQUFDLElBQUk7WUFDbEIsTUFBTSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFbkIsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7UUFFTyxZQUFZLENBQUMsT0FBK0I7WUFDbkQsSUFBSSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU3QyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU5QixPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzVCLENBQUM7UUFFTyx1QkFBdUIsQ0FBQyxRQUFxQztZQUNwRSxNQUFNLHdCQUF3QixHQUFHLElBQUksR0FBRyxFQUFnRixDQUFDO1lBRXpILG9FQUFvRTtZQUNwRSxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLElBQUksR0FBRyxrQkFBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsOEJBQThCO2dCQUVoRyxJQUFJLHNCQUFzQixHQUFHLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ2pGLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO29CQUM3QixzQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBcUMsQ0FBQztvQkFDdEUsd0JBQXdCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztnQkFDN0UsQ0FBQztnQkFFRCxJQUFJLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN0QyxJQUFJLENBQUMsS0FBSyxDQUFDLGtFQUFrRSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDL0csQ0FBQztnQkFFRCxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNDLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDNUcsQ0FBQztRQUVRLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxPQUFnQjtZQUNoRCxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFakMsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0MsQ0FBQztRQUNGLENBQUM7UUFFUyxLQUFLLENBQUMsT0FBZSxFQUFFLE9BQWdDO1lBQ2hFLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUN6QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFGLENBQUM7UUFDRixDQUFDO1FBRVMsSUFBSSxDQUFDLE9BQWU7WUFDN0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFTyxTQUFTLENBQUMsT0FBZSxFQUFFLE9BQWdDO1lBQ2xFLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyw0QkFBNEIsT0FBTyxLQUFLLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLDRCQUE0QixPQUFPLEVBQUUsQ0FBQztRQUMzSSxDQUFDO0tBQ0Q7SUEzSUQsc0NBMklDIn0=