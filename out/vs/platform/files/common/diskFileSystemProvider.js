/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/path", "vs/platform/files/common/watcher", "vs/platform/log/common/log"], function (require, exports, arrays_1, async_1, errors_1, event_1, extpath_1, lifecycle_1, path_1, watcher_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractDiskFileSystemProvider = void 0;
    class AbstractDiskFileSystemProvider extends lifecycle_1.Disposable {
        constructor(logService, options) {
            super();
            this.logService = logService;
            this.options = options;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._onDidWatchError = this._register(new event_1.Emitter());
            this.onDidWatchError = this._onDidWatchError.event;
            this.universalWatchRequests = [];
            this.universalWatchRequestDelayer = this._register(new async_1.ThrottledDelayer(0));
            this.nonRecursiveWatchRequests = [];
            this.nonRecursiveWatchRequestDelayer = this._register(new async_1.ThrottledDelayer(0));
        }
        watch(resource, opts) {
            if (opts.recursive || this.options?.watcher?.forceUniversal) {
                return this.watchUniversal(resource, opts);
            }
            return this.watchNonRecursive(resource, opts);
        }
        watchUniversal(resource, opts) {
            // Add to list of paths to watch universally
            const request = {
                path: this.toWatchPath(resource),
                excludes: opts.excludes,
                includes: opts.includes,
                recursive: opts.recursive,
                filter: opts.filter,
                correlationId: opts.correlationId
            };
            const remove = (0, arrays_1.insert)(this.universalWatchRequests, request);
            // Trigger update
            this.refreshUniversalWatchers();
            return (0, lifecycle_1.toDisposable)(() => {
                // Remove from list of paths to watch universally
                remove();
                // Trigger update
                this.refreshUniversalWatchers();
            });
        }
        refreshUniversalWatchers() {
            // Buffer requests for universal watching to decide on right watcher
            // that supports potentially watching more than one path at once
            this.universalWatchRequestDelayer.trigger(() => {
                return this.doRefreshUniversalWatchers();
            }).catch(error => (0, errors_1.onUnexpectedError)(error));
        }
        doRefreshUniversalWatchers() {
            // Create watcher if this is the first time
            if (!this.universalWatcher) {
                this.universalWatcher = this._register(this.createUniversalWatcher(changes => this._onDidChangeFile.fire((0, watcher_1.reviveFileChanges)(changes)), msg => this.onWatcherLogMessage(msg), this.logService.getLevel() === log_1.LogLevel.Trace));
                // Apply log levels dynamically
                this._register(this.logService.onDidChangeLogLevel(() => {
                    this.universalWatcher?.setVerboseLogging(this.logService.getLevel() === log_1.LogLevel.Trace);
                }));
            }
            // Adjust for polling
            const usePolling = this.options?.watcher?.recursive?.usePolling;
            if (usePolling === true) {
                for (const request of this.universalWatchRequests) {
                    if ((0, watcher_1.isRecursiveWatchRequest)(request)) {
                        request.pollingInterval = this.options?.watcher?.recursive?.pollingInterval ?? 5000;
                    }
                }
            }
            else if (Array.isArray(usePolling)) {
                for (const request of this.universalWatchRequests) {
                    if ((0, watcher_1.isRecursiveWatchRequest)(request)) {
                        if (usePolling.includes(request.path)) {
                            request.pollingInterval = this.options?.watcher?.recursive?.pollingInterval ?? 5000;
                        }
                    }
                }
            }
            // Ask to watch the provided paths
            return this.universalWatcher.watch(this.universalWatchRequests);
        }
        watchNonRecursive(resource, opts) {
            // Add to list of paths to watch non-recursively
            const request = {
                path: this.toWatchPath(resource),
                excludes: opts.excludes,
                includes: opts.includes,
                recursive: false,
                filter: opts.filter,
                correlationId: opts.correlationId
            };
            const remove = (0, arrays_1.insert)(this.nonRecursiveWatchRequests, request);
            // Trigger update
            this.refreshNonRecursiveWatchers();
            return (0, lifecycle_1.toDisposable)(() => {
                // Remove from list of paths to watch non-recursively
                remove();
                // Trigger update
                this.refreshNonRecursiveWatchers();
            });
        }
        refreshNonRecursiveWatchers() {
            // Buffer requests for nonrecursive watching to decide on right watcher
            // that supports potentially watching more than one path at once
            this.nonRecursiveWatchRequestDelayer.trigger(() => {
                return this.doRefreshNonRecursiveWatchers();
            }).catch(error => (0, errors_1.onUnexpectedError)(error));
        }
        doRefreshNonRecursiveWatchers() {
            // Create watcher if this is the first time
            if (!this.nonRecursiveWatcher) {
                this.nonRecursiveWatcher = this._register(this.createNonRecursiveWatcher(changes => this._onDidChangeFile.fire((0, watcher_1.reviveFileChanges)(changes)), msg => this.onWatcherLogMessage(msg), this.logService.getLevel() === log_1.LogLevel.Trace));
                // Apply log levels dynamically
                this._register(this.logService.onDidChangeLogLevel(() => {
                    this.nonRecursiveWatcher?.setVerboseLogging(this.logService.getLevel() === log_1.LogLevel.Trace);
                }));
            }
            // Ask to watch the provided paths
            return this.nonRecursiveWatcher.watch(this.nonRecursiveWatchRequests);
        }
        //#endregion
        onWatcherLogMessage(msg) {
            if (msg.type === 'error') {
                this._onDidWatchError.fire(msg.message);
            }
            this.logWatcherMessage(msg);
        }
        logWatcherMessage(msg) {
            this.logService[msg.type](msg.message);
        }
        toFilePath(resource) {
            return (0, path_1.normalize)(resource.fsPath);
        }
        toWatchPath(resource) {
            const filePath = this.toFilePath(resource);
            // Ensure to have any trailing path separators removed, otherwise
            // we may believe the path is not "real" and will convert every
            // event back to this form, which is not warranted.
            // See also https://github.com/microsoft/vscode/issues/210517
            return (0, extpath_1.removeTrailingPathSeparator)(filePath);
        }
    }
    exports.AbstractDiskFileSystemProvider = AbstractDiskFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTeXN0ZW1Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL2NvbW1vbi9kaXNrRmlsZVN5c3RlbVByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9DaEcsTUFBc0IsOEJBQStCLFNBQVEsc0JBQVU7UUFLdEUsWUFDb0IsVUFBdUIsRUFDekIsT0FBd0M7WUFFekQsS0FBSyxFQUFFLENBQUM7WUFIVyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3pCLFlBQU8sR0FBUCxPQUFPLENBQWlDO1lBS3ZDLHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTBCLENBQUMsQ0FBQztZQUNuRixvQkFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7WUFFcEMscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7WUFDbkUsb0JBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBY3RDLDJCQUFzQixHQUE2QixFQUFFLENBQUM7WUFDdEQsaUNBQTRCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUF1RjdFLDhCQUF5QixHQUFnQyxFQUFFLENBQUM7WUFDNUQsb0NBQStCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUE3R2pHLENBQUM7UUFRRCxLQUFLLENBQUMsUUFBYSxFQUFFLElBQW1CO1lBQ3ZDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsQ0FBQztnQkFDN0QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFTTyxjQUFjLENBQUMsUUFBYSxFQUFFLElBQW1CO1lBRXhELDRDQUE0QztZQUM1QyxNQUFNLE9BQU8sR0FBMkI7Z0JBQ3ZDLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQztnQkFDaEMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7Z0JBQ3ZCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDekIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNuQixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7YUFDakMsQ0FBQztZQUNGLE1BQU0sTUFBTSxHQUFHLElBQUEsZUFBTSxFQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU1RCxpQkFBaUI7WUFDakIsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFFaEMsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUV4QixpREFBaUQ7Z0JBQ2pELE1BQU0sRUFBRSxDQUFDO2dCQUVULGlCQUFpQjtnQkFDakIsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sd0JBQXdCO1lBRS9CLG9FQUFvRTtZQUNwRSxnRUFBZ0U7WUFDaEUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7Z0JBQzlDLE9BQU8sSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDMUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBQSwwQkFBaUIsRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFTywwQkFBMEI7WUFFakMsMkNBQTJDO1lBQzNDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUNqRSxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBQSwyQkFBaUIsRUFBQyxPQUFPLENBQUMsQ0FBQyxFQUNqRSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsRUFDcEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxjQUFRLENBQUMsS0FBSyxDQUM3QyxDQUFDLENBQUM7Z0JBRUgsK0JBQStCO2dCQUMvQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFO29CQUN2RCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxjQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3pGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1lBRUQscUJBQXFCO1lBQ3JCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUM7WUFDaEUsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3pCLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7b0JBQ25ELElBQUksSUFBQSxpQ0FBdUIsRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUN0QyxPQUFPLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxlQUFlLElBQUksSUFBSSxDQUFDO29CQUNyRixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxLQUFLLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO29CQUNuRCxJQUFJLElBQUEsaUNBQXVCLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzt3QkFDdEMsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDOzRCQUN2QyxPQUFPLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxlQUFlLElBQUksSUFBSSxDQUFDO3dCQUNyRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxrQ0FBa0M7WUFDbEMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFpQk8saUJBQWlCLENBQUMsUUFBYSxFQUFFLElBQW1CO1lBRTNELGdEQUFnRDtZQUNoRCxNQUFNLE9BQU8sR0FBOEI7Z0JBQzFDLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQztnQkFDaEMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7Z0JBQ3ZCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07Z0JBQ25CLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTthQUNqQyxDQUFDO1lBQ0YsTUFBTSxNQUFNLEdBQUcsSUFBQSxlQUFNLEVBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRS9ELGlCQUFpQjtZQUNqQixJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQUVuQyxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBRXhCLHFEQUFxRDtnQkFDckQsTUFBTSxFQUFFLENBQUM7Z0JBRVQsaUJBQWlCO2dCQUNqQixJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQUNwQyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTywyQkFBMkI7WUFFbEMsdUVBQXVFO1lBQ3ZFLGdFQUFnRTtZQUNoRSxJQUFJLENBQUMsK0JBQStCLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtnQkFDakQsT0FBTyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDBCQUFpQixFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUVPLDZCQUE2QjtZQUVwQywyQ0FBMkM7WUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQ3ZFLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFBLDJCQUFpQixFQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQ2pFLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxFQUNwQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxLQUFLLGNBQVEsQ0FBQyxLQUFLLENBQzdDLENBQUMsQ0FBQztnQkFFSCwrQkFBK0I7Z0JBQy9CLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUU7b0JBQ3ZELElBQUksQ0FBQyxtQkFBbUIsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxLQUFLLGNBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDNUYsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFFRCxrQ0FBa0M7WUFDbEMsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFRRCxZQUFZO1FBRUosbUJBQW1CLENBQUMsR0FBZ0I7WUFDM0MsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6QyxDQUFDO1lBRUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFUyxpQkFBaUIsQ0FBQyxHQUFnQjtZQUMzQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVTLFVBQVUsQ0FBQyxRQUFhO1lBQ2pDLE9BQU8sSUFBQSxnQkFBUyxFQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRU8sV0FBVyxDQUFDLFFBQWE7WUFDaEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUUzQyxpRUFBaUU7WUFDakUsK0RBQStEO1lBQy9ELG1EQUFtRDtZQUNuRCw2REFBNkQ7WUFDN0QsT0FBTyxJQUFBLHFDQUEyQixFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLENBQUM7S0FDRDtJQWpORCx3RUFpTkMifQ==