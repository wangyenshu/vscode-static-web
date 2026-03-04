/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/platform/files/common/watcher"], function (require, exports, lifecycle_1, ipc_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UniversalWatcherClient = void 0;
    class UniversalWatcherClient extends watcher_1.AbstractUniversalWatcherClient {
        constructor(onFileChanges, onLogMessage, verboseLogging, utilityProcessWorkerWorkbenchService) {
            super(onFileChanges, onLogMessage, verboseLogging);
            this.utilityProcessWorkerWorkbenchService = utilityProcessWorkerWorkbenchService;
            this.init();
        }
        createWatcher(disposables) {
            const watcher = ipc_1.ProxyChannel.toService((0, ipc_1.getDelayedChannel)((async () => {
                // Acquire universal watcher via utility process worker
                //
                // We explicitly do not add the worker as a disposable
                // because we need to call `stop` on disposal to prevent
                // a crash on shutdown (see below).
                //
                // The utility process worker services ensures to terminate
                // the process automatically when the window closes or reloads.
                const { client, onDidTerminate } = await this.utilityProcessWorkerWorkbenchService.createWorker({
                    moduleId: 'vs/platform/files/node/watcher/watcherMain',
                    type: 'fileWatcher'
                });
                // React on unexpected termination of the watcher process
                // by listening to the `onDidTerminate` event. We do not
                // consider an exit code of `0` as abnormal termination.
                onDidTerminate.then(({ reason }) => {
                    if (reason?.code === 0) {
                        this.trace(`terminated by itself with code ${reason.code}, signal: ${reason.signal}`);
                    }
                    else {
                        this.onError(`terminated by itself unexpectedly with code ${reason?.code}, signal: ${reason?.signal} (ETERM)`);
                    }
                });
                return client.getChannel('watcher');
            })()));
            // Looks like universal watcher needs an explicit stop
            // to prevent access on data structures after process
            // exit. This only seem to be happening when used from
            // Electron, not pure node.js.
            // https://github.com/microsoft/vscode/issues/136264
            disposables.add((0, lifecycle_1.toDisposable)(() => watcher.stop()));
            return watcher;
        }
    }
    exports.UniversalWatcherClient = UniversalWatcherClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlckNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9maWxlcy9lbGVjdHJvbi1zYW5kYm94L3dhdGNoZXJDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsc0JBQXVCLFNBQVEsd0NBQThCO1FBRXpFLFlBQ0MsYUFBK0MsRUFDL0MsWUFBd0MsRUFDeEMsY0FBdUIsRUFDTixvQ0FBMkU7WUFFNUYsS0FBSyxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFGbEMseUNBQW9DLEdBQXBDLG9DQUFvQyxDQUF1QztZQUk1RixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDYixDQUFDO1FBRWtCLGFBQWEsQ0FBQyxXQUE0QjtZQUM1RCxNQUFNLE9BQU8sR0FBRyxrQkFBWSxDQUFDLFNBQVMsQ0FBb0IsSUFBQSx1QkFBaUIsRUFBQyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUV2Rix1REFBdUQ7Z0JBQ3ZELEVBQUU7Z0JBQ0Ysc0RBQXNEO2dCQUN0RCx3REFBd0Q7Z0JBQ3hELG1DQUFtQztnQkFDbkMsRUFBRTtnQkFDRiwyREFBMkQ7Z0JBQzNELCtEQUErRDtnQkFDL0QsTUFBTSxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxZQUFZLENBQUM7b0JBQy9GLFFBQVEsRUFBRSw0Q0FBNEM7b0JBQ3RELElBQUksRUFBRSxhQUFhO2lCQUNuQixDQUFDLENBQUM7Z0JBRUgseURBQXlEO2dCQUN6RCx3REFBd0Q7Z0JBQ3hELHdEQUF3RDtnQkFFeEQsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtvQkFDbEMsSUFBSSxNQUFNLEVBQUUsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUN4QixJQUFJLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxNQUFNLENBQUMsSUFBSSxhQUFhLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO29CQUN2RixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQywrQ0FBK0MsTUFBTSxFQUFFLElBQUksYUFBYSxNQUFNLEVBQUUsTUFBTSxVQUFVLENBQUMsQ0FBQztvQkFDaEgsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztnQkFFSCxPQUFPLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFUCxzREFBc0Q7WUFDdEQscURBQXFEO1lBQ3JELHNEQUFzRDtZQUN0RCw4QkFBOEI7WUFDOUIsb0RBQW9EO1lBQ3BELFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFcEQsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztLQUNEO0lBckRELHdEQXFEQyJ9