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
define(["require", "exports", "vs/base/common/performance", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/platform/update/common/update", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/editor/common/editorService", "vs/platform/accessibility/common/accessibility", "vs/platform/telemetry/common/telemetry", "vs/base/common/async", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/telemetry/common/telemetryUtils", "vs/base/common/platform", "vs/base/browser/defaultWorkerFactory", "vs/platform/registry/common/platform", "vs/platform/terminal/common/terminal"], function (require, exports, perf, instantiation_1, workspace_1, extensions_1, update_1, lifecycle_1, editorService_1, accessibility_1, telemetry_1, async_1, layoutService_1, panecomposite_1, telemetryUtils_1, platform_1, defaultWorkerFactory_1, platform_2, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimerService = exports.AbstractTimerService = exports.ITimerService = void 0;
    exports.ITimerService = (0, instantiation_1.createDecorator)('timerService');
    class PerfMarks {
        constructor() {
            this._entries = [];
        }
        setMarks(source, entries) {
            this._entries.push([source, entries]);
        }
        getDuration(from, to) {
            const fromEntry = this._findEntry(from);
            if (!fromEntry) {
                return 0;
            }
            const toEntry = this._findEntry(to);
            if (!toEntry) {
                return 0;
            }
            return toEntry.startTime - fromEntry.startTime;
        }
        _findEntry(name) {
            for (const [, marks] of this._entries) {
                for (let i = marks.length - 1; i >= 0; i--) {
                    if (marks[i].name === name) {
                        return marks[i];
                    }
                }
            }
        }
        getEntries() {
            return this._entries.slice(0);
        }
    }
    let AbstractTimerService = class AbstractTimerService {
        constructor(_lifecycleService, _contextService, _extensionService, _updateService, _paneCompositeService, _editorService, _accessibilityService, _telemetryService, layoutService) {
            this._lifecycleService = _lifecycleService;
            this._contextService = _contextService;
            this._extensionService = _extensionService;
            this._updateService = _updateService;
            this._paneCompositeService = _paneCompositeService;
            this._editorService = _editorService;
            this._accessibilityService = _accessibilityService;
            this._telemetryService = _telemetryService;
            this._barrier = new async_1.Barrier();
            this._marks = new PerfMarks();
            this._rndValueShouldSendTelemetry = Math.random() < .05; // 5% of users
            Promise.all([
                this._extensionService.whenInstalledExtensionsRegistered(), // extensions registered
                _lifecycleService.when(3 /* LifecyclePhase.Restored */), // workbench created and parts restored
                layoutService.whenRestored, // layout restored (including visible editors resolved)
                Promise.all(Array.from(platform_2.Registry.as(terminal_1.TerminalExtensions.Backend).backends.values()).map(e => e.whenReady))
            ]).then(() => {
                // set perf mark from renderer
                this.setPerformanceMarks('renderer', perf.getMarks());
                return this._computeStartupMetrics();
            }).then(metrics => {
                this._startupMetrics = metrics;
                this._reportStartupTimes(metrics);
                this._barrier.open();
            });
            this.perfBaseline = this._barrier.wait()
                .then(() => this._lifecycleService.when(4 /* LifecyclePhase.Eventually */))
                .then(() => (0, async_1.timeout)(this._startupMetrics.timers.ellapsedRequire))
                .then(() => {
                // we use fibonacci numbers to have a performance baseline that indicates
                // how slow/fast THIS machine actually is.
                const jsSrc = (function () {
                    // the following operation took ~16ms (one frame at 64FPS) to complete on my machine. We derive performance observations
                    // from that. We also bail if that took too long (>1s)
                    let tooSlow = false;
                    function fib(n) {
                        if (tooSlow) {
                            return 0;
                        }
                        if (performance.now() - t1 >= 1000) {
                            tooSlow = true;
                        }
                        if (n <= 2) {
                            return n;
                        }
                        return fib(n - 1) + fib(n - 2);
                    }
                    const t1 = performance.now();
                    fib(24);
                    const value = Math.round(performance.now() - t1);
                    // eslint-disable-next-line no-restricted-globals
                    postMessage({ value: tooSlow ? -1 : value });
                }).toString();
                const blob = new Blob([`(${jsSrc})();`], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                const worker = (0, defaultWorkerFactory_1.createBlobWorker)(blobUrl, { name: 'perfBaseline' });
                return new Promise(resolve => {
                    worker.onmessage = e => resolve(e.data.value);
                }).finally(() => {
                    worker.terminate();
                    URL.revokeObjectURL(blobUrl);
                });
            });
        }
        whenReady() {
            return this._barrier.wait();
        }
        get startupMetrics() {
            if (!this._startupMetrics) {
                throw new Error('illegal state, MUST NOT access startupMetrics before whenReady has resolved');
            }
            return this._startupMetrics;
        }
        setPerformanceMarks(source, marks) {
            // Perf marks are a shared resource because anyone can generate them
            // and because of that we only accept marks that start with 'code/'
            const codeMarks = marks.filter(mark => mark.name.startsWith('code/'));
            this._marks.setMarks(source, codeMarks);
            this._reportPerformanceMarks(source, codeMarks);
        }
        getPerformanceMarks() {
            return this._marks.getEntries();
        }
        getDuration(from, to) {
            return this._marks.getDuration(from, to);
        }
        _reportStartupTimes(metrics) {
            // report IStartupMetrics as telemetry
            /* __GDPR__
                "startupTimeVaried" : {
                    "owner": "jrieken",
                    "${include}": [
                        "${IStartupMetrics}"
                    ]
                }
            */
            this._telemetryService.publicLog('startupTimeVaried', metrics);
        }
        _shouldReportPerfMarks() {
            return this._rndValueShouldSendTelemetry;
        }
        _reportPerformanceMarks(source, marks) {
            if (!this._shouldReportPerfMarks()) {
                // the `startup.timer.mark` event is send very often. In order to save resources
                // we let some of our instances/sessions send this event
                return;
            }
            for (const mark of marks) {
                this._telemetryService.publicLog2('startup.timer.mark', {
                    source,
                    name: new telemetryUtils_1.TelemetryTrustedValue(mark.name),
                    startTime: mark.startTime
                });
            }
        }
        async _computeStartupMetrics() {
            const initialStartup = this._isInitialStartup();
            let startMark;
            if (platform_1.isWeb) {
                startMark = 'code/timeOrigin';
            }
            else {
                startMark = initialStartup ? 'code/didStartMain' : 'code/willOpenNewWindow';
            }
            const activeViewlet = this._paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            const activePanel = this._paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            const info = {
                version: 2,
                ellapsed: this._marks.getDuration(startMark, 'code/didStartWorkbench'),
                // reflections
                isLatestVersion: Boolean(await this._updateService.isLatestVersion()),
                didUseCachedData: this._didUseCachedData(),
                windowKind: this._lifecycleService.startupKind,
                windowCount: await this._getWindowCount(),
                viewletId: activeViewlet?.getId(),
                editorIds: this._editorService.visibleEditors.map(input => input.typeId),
                panelId: activePanel ? activePanel.getId() : undefined,
                // timers
                timers: {
                    ellapsedAppReady: initialStartup ? this._marks.getDuration('code/didStartMain', 'code/mainAppReady') : undefined,
                    ellapsedNlsGeneration: initialStartup ? this._marks.getDuration('code/willGenerateNls', 'code/didGenerateNls') : undefined,
                    ellapsedLoadMainBundle: initialStartup ? this._marks.getDuration('code/willLoadMainBundle', 'code/didLoadMainBundle') : undefined,
                    ellapsedCrashReporter: initialStartup ? this._marks.getDuration('code/willStartCrashReporter', 'code/didStartCrashReporter') : undefined,
                    ellapsedMainServer: initialStartup ? this._marks.getDuration('code/willStartMainServer', 'code/didStartMainServer') : undefined,
                    ellapsedWindowCreate: initialStartup ? this._marks.getDuration('code/willCreateCodeWindow', 'code/didCreateCodeWindow') : undefined,
                    ellapsedWindowRestoreState: initialStartup ? this._marks.getDuration('code/willRestoreCodeWindowState', 'code/didRestoreCodeWindowState') : undefined,
                    ellapsedBrowserWindowCreate: initialStartup ? this._marks.getDuration('code/willCreateCodeBrowserWindow', 'code/didCreateCodeBrowserWindow') : undefined,
                    ellapsedWindowMaximize: initialStartup ? this._marks.getDuration('code/willMaximizeCodeWindow', 'code/didMaximizeCodeWindow') : undefined,
                    ellapsedWindowLoad: initialStartup ? this._marks.getDuration('code/mainAppReady', 'code/willOpenNewWindow') : undefined,
                    ellapsedWindowLoadToRequire: this._marks.getDuration('code/willOpenNewWindow', 'code/willLoadWorkbenchMain'),
                    ellapsedRequire: this._marks.getDuration('code/willLoadWorkbenchMain', 'code/didLoadWorkbenchMain'),
                    ellapsedWaitForWindowConfig: this._marks.getDuration('code/willWaitForWindowConfig', 'code/didWaitForWindowConfig'),
                    ellapsedStorageInit: this._marks.getDuration('code/willInitStorage', 'code/didInitStorage'),
                    ellapsedSharedProcesConnected: this._marks.getDuration('code/willConnectSharedProcess', 'code/didConnectSharedProcess'),
                    ellapsedWorkspaceServiceInit: this._marks.getDuration('code/willInitWorkspaceService', 'code/didInitWorkspaceService'),
                    ellapsedRequiredUserDataInit: this._marks.getDuration('code/willInitRequiredUserData', 'code/didInitRequiredUserData'),
                    ellapsedOtherUserDataInit: this._marks.getDuration('code/willInitOtherUserData', 'code/didInitOtherUserData'),
                    ellapsedExtensions: this._marks.getDuration('code/willLoadExtensions', 'code/didLoadExtensions'),
                    ellapsedEditorRestore: this._marks.getDuration('code/willRestoreEditors', 'code/didRestoreEditors'),
                    ellapsedViewletRestore: this._marks.getDuration('code/willRestoreViewlet', 'code/didRestoreViewlet'),
                    ellapsedPanelRestore: this._marks.getDuration('code/willRestorePanel', 'code/didRestorePanel'),
                    ellapsedWorkbenchContributions: this._marks.getDuration('code/willCreateWorkbenchContributions/1', 'code/didCreateWorkbenchContributions/2'),
                    ellapsedWorkbench: this._marks.getDuration('code/willStartWorkbench', 'code/didStartWorkbench'),
                    ellapsedExtensionsReady: this._marks.getDuration(startMark, 'code/didLoadExtensions'),
                    ellapsedRenderer: this._marks.getDuration('code/didStartRenderer', 'code/didStartWorkbench')
                },
                // system info
                platform: undefined,
                release: undefined,
                arch: undefined,
                totalmem: undefined,
                freemem: undefined,
                meminfo: undefined,
                cpus: undefined,
                loadavg: undefined,
                isVMLikelyhood: undefined,
                initialStartup,
                hasAccessibilitySupport: this._accessibilityService.isScreenReaderOptimized(),
                emptyWorkbench: this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */
            };
            await this._extendStartupInfo(info);
            return info;
        }
    };
    exports.AbstractTimerService = AbstractTimerService;
    exports.AbstractTimerService = AbstractTimerService = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, extensions_1.IExtensionService),
        __param(3, update_1.IUpdateService),
        __param(4, panecomposite_1.IPaneCompositePartService),
        __param(5, editorService_1.IEditorService),
        __param(6, accessibility_1.IAccessibilityService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, layoutService_1.IWorkbenchLayoutService)
    ], AbstractTimerService);
    class TimerService extends AbstractTimerService {
        _isInitialStartup() {
            return false;
        }
        _didUseCachedData() {
            return false;
        }
        async _getWindowCount() {
            return 1;
        }
        async _extendStartupInfo(info) {
            info.isVMLikelyhood = 0;
            info.isARM64Emulated = false;
            info.platform = navigator.userAgent;
            info.release = navigator.appVersion;
        }
    }
    exports.TimerService = TimerService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RpbWVyL2Jyb3dzZXIvdGltZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQStibkYsUUFBQSxhQUFhLEdBQUcsSUFBQSwrQkFBZSxFQUFnQixjQUFjLENBQUMsQ0FBQztJQUc1RSxNQUFNLFNBQVM7UUFBZjtZQUVrQixhQUFRLEdBQXVDLEVBQUUsQ0FBQztRQStCcEUsQ0FBQztRQTdCQSxRQUFRLENBQUMsTUFBYyxFQUFFLE9BQStCO1lBQ3ZELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVELFdBQVcsQ0FBQyxJQUFZLEVBQUUsRUFBVTtZQUNuQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUM7UUFDaEQsQ0FBQztRQUVPLFVBQVUsQ0FBQyxJQUFZO1lBQzlCLEtBQUssTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN2QyxLQUFLLElBQUksQ0FBQyxHQUFHLEtB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