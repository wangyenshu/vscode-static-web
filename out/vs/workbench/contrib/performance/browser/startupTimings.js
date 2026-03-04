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
define(["require", "exports", "vs/editor/browser/editorBrowser", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/update/common/update", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/timer/browser/timerService", "vs/base/common/path", "vs/base/common/hash"], function (require, exports, editorBrowser_1, lifecycle_1, update_1, files, editorService_1, workspaceTrust_1, panecomposite_1, log_1, productService_1, telemetry_1, environmentService_1, timerService_1, path_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserResourcePerformanceMarks = exports.BrowserStartupTimings = exports.StartupTimings = void 0;
    let StartupTimings = class StartupTimings {
        constructor(_editorService, _paneCompositeService, _lifecycleService, _updateService, _workspaceTrustService) {
            this._editorService = _editorService;
            this._paneCompositeService = _paneCompositeService;
            this._lifecycleService = _lifecycleService;
            this._updateService = _updateService;
            this._workspaceTrustService = _workspaceTrustService;
        }
        async _isStandardStartup() {
            // check for standard startup:
            // * new window (no reload)
            // * workspace is trusted
            // * just one window
            // * explorer viewlet visible
            // * one text editor (not multiple, not webview, welcome etc...)
            // * cached data present (not rejected, not created)
            if (this._lifecycleService.startupKind !== 1 /* StartupKind.NewWindow */) {
                return (0, lifecycle_1.StartupKindToString)(this._lifecycleService.startupKind);
            }
            if (!this._workspaceTrustService.isWorkspaceTrusted()) {
                return 'Workspace not trusted';
            }
            const activeViewlet = this._paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (!activeViewlet || activeViewlet.getId() !== files.VIEWLET_ID) {
                return 'Explorer viewlet not visible';
            }
            const visibleEditorPanes = this._editorService.visibleEditorPanes;
            if (visibleEditorPanes.length !== 1) {
                return `Expected text editor count : 1, Actual : ${visibleEditorPanes.length}`;
            }
            if (!(0, editorBrowser_1.isCodeEditor)(visibleEditorPanes[0].getControl())) {
                return 'Active editor is not a text editor';
            }
            const activePanel = this._paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            if (activePanel) {
                return `Current active panel : ${this._paneCompositeService.getPaneComposite(activePanel.getId(), 1 /* ViewContainerLocation.Panel */)?.name}`;
            }
            const isLatestVersion = await this._updateService.isLatestVersion();
            if (isLatestVersion === false) {
                return 'Not on latest version, updates available';
            }
            return undefined;
        }
    };
    exports.StartupTimings = StartupTimings;
    exports.StartupTimings = StartupTimings = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, update_1.IUpdateService),
        __param(4, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], StartupTimings);
    let BrowserStartupTimings = class BrowserStartupTimings extends StartupTimings {
        constructor(editorService, paneCompositeService, lifecycleService, updateService, workspaceTrustService, timerService, logService, environmentService, telemetryService, productService) {
            super(editorService, paneCompositeService, lifecycleService, updateService, workspaceTrustService);
            this.timerService = timerService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.logPerfMarks();
        }
        async logPerfMarks() {
            if (!this.environmentService.profDurationMarkers) {
                return;
            }
            await this.timerService.whenReady();
            const standardStartupError = await this._isStandardStartup();
            const perfBaseline = await this.timerService.perfBaseline;
            const [from, to] = this.environmentService.profDurationMarkers;
            const content = `${this.timerService.getDuration(from, to)}\t${this.productService.nameShort}\t${(this.productService.commit || '').slice(0, 10) || '0000000000'}\t${this.telemetryService.sessionId}\t${standardStartupError === undefined ? 'standard_start' : 'NO_standard_start : ' + standardStartupError}\t${String(perfBaseline).padStart(4, '0')}ms\n`;
            this.logService.info(`[prof-timers] ${content}`);
        }
    };
    exports.BrowserStartupTimings = BrowserStartupTimings;
    exports.BrowserStartupTimings = BrowserStartupTimings = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, update_1.IUpdateService),
        __param(4, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(5, timerService_1.ITimerService),
        __param(6, log_1.ILogService),
        __param(7, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, productService_1.IProductService)
    ], BrowserStartupTimings);
    let BrowserResourcePerformanceMarks = class BrowserResourcePerformanceMarks {
        constructor(telemetryService) {
            for (const item of performance.getEntriesByType('resource')) {
                try {
                    const url = new URL(item.name);
                    const name = path_1.posix.basename(url.pathname);
                    telemetryService.publicLog2('startup.resource.perf', {
                        hosthash: `H${(0, hash_1.hash)(url.host).toString(16)}`,
                        name,
                        duration: item.duration
                    });
                }
                catch {
                    // ignore
                }
            }
        }
    };
    exports.BrowserResourcePerformanceMarks = BrowserResourcePerformanceMarks;
    exports.BrowserResourcePerformanceMarks = BrowserResourcePerformanceMarks = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], BrowserResourcePerformanceMarks);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnR1cFRpbWluZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wZXJmb3JtYW5jZS9icm93c2VyL3N0YXJ0dXBUaW1pbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBZSxjQUFjLEdBQTdCLE1BQWUsY0FBYztRQUVuQyxZQUNrQyxjQUE4QixFQUNuQixxQkFBZ0QsRUFDeEQsaUJBQW9DLEVBQ3ZDLGNBQThCLEVBQ1osc0JBQXdEO1lBSjFFLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUNuQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQTJCO1lBQ3hELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDdkMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ1osMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFrQztRQUU1RyxDQUFDO1FBRVMsS0FBSyxDQUFDLGtCQUFrQjtZQUNqQyw4QkFBOEI7WUFDOUIsMkJBQTJCO1lBQzNCLHlCQUF5QjtZQUN6QixvQkFBb0I7WUFDcEIsNkJBQTZCO1lBQzdCLGdFQUFnRTtZQUNoRSxvREFBb0Q7WUFDcEQsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxrQ0FBMEIsRUFBRSxDQUFDO2dCQUNsRSxPQUFPLElBQUEsK0JBQW1CLEVBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hFLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQztnQkFDdkQsT0FBTyx1QkFBdUIsQ0FBQztZQUNoQyxDQUFDO1lBQ0QsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHNCQUFzQix1Q0FBK0IsQ0FB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