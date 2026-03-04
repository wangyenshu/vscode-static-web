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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/resources", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/native/common/native", "vs/platform/profiling/electron-sandbox/profileAnalysisWorkerService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/workbench/services/timer/browser/timerService"], function (require, exports, async_1, buffer_1, resources_1, uuid_1, configuration_1, files_1, log_1, native_1, profileAnalysisWorkerService_1, environmentService_1, extensionDevOptions_1, timerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RendererProfiling = void 0;
    let RendererProfiling = class RendererProfiling {
        constructor(_environmentService, _fileService, _logService, nativeHostService, timerService, configService, profileAnalysisService) {
            this._environmentService = _environmentService;
            this._fileService = _fileService;
            this._logService = _logService;
            const devOpts = (0, extensionDevOptions_1.parseExtensionDevOptions)(_environmentService);
            if (devOpts.isExtensionDevTestFromCli) {
                // disabled when running extension tests
                return;
            }
            timerService.perfBaseline.then(perfBaseline => {
                _logService.info(`[perf] Render performance baseline is ${perfBaseline}ms`);
                if (perfBaseline < 0) {
                    // too slow
                    return;
                }
                // SLOW threshold
                const slowThreshold = perfBaseline * 10; // ~10 frames at 64fps on MY machine
                const obs = new PerformanceObserver(async (list) => {
                    obs.takeRecords();
                    const maxDuration = list.getEntries()
                        .map(e => e.duration)
                        .reduce((p, c) => Math.max(p, c), 0);
                    if (maxDuration < slowThreshold) {
                        return;
                    }
                    if (!configService.getValue('application.experimental.rendererProfiling')) {
                        _logService.debug(`[perf] SLOW task detected (${maxDuration}ms) but renderer profiling is disabled via 'application.experimental.rendererProfiling'`);
                        return;
                    }
                    const sessionId = (0, uuid_1.generateUuid)();
                    _logService.warn(`[perf] Renderer reported VERY LONG TASK (${maxDuration}ms), starting profiling session '${sessionId}'`);
                    // pause observation, we'll take a detailed look
                    obs.disconnect();
                    // profile renderer for 5secs, analyse, and take action depending on the result
                    for (let i = 0; i < 3; i++) {
                        try {
                            const profile = await nativeHostService.profileRenderer(sessionId, 5000);
                            const output = await profileAnalysisService.analyseBottomUp(profile, _url => '<<renderer>>', perfBaseline, true);
                            if (output === 2 /* ProfilingOutput.Interesting */) {
                                this._store(profile, sessionId);
                                break;
                            }
                            (0, async_1.timeout)(15000); // wait 15s
                        }
                        catch (err) {
                            _logService.error(err);
                            break;
                        }
                    }
                    // reconnect the observer
                    obs.observe({ entryTypes: ['longtask'] });
                });
                obs.observe({ entryTypes: ['longtask'] });
                this._observer = obs;
            });
        }
        dispose() {
            this._observer?.disconnect();
        }
        async _store(profile, sessionId) {
            const path = (0, resources_1.joinPath)(this._environmentService.tmpDir, `renderer-${Math.random().toString(16).slice(2, 8)}.cpuprofile.json`);
            await this._fileService.writeFile(path, buffer_1.VSBuffer.fromString(JSON.stringify(profile)));
            this._logService.info(`[perf] stored profile to DISK '${path}'`, sessionId);
        }
    };
    exports.RendererProfiling = RendererProfiling;
    exports.RendererProfiling = RendererProfiling = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService),
        __param(3, native_1.INativeHostService),
        __param(4, timerService_1.ITimerService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, profileAnalysisWorkerService_1.IProfileAnalysisWorkerService)
    ], RendererProfiling);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXJBdXRvUHJvZmlsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wZXJmb3JtYW5jZS9lbGVjdHJvbi1zYW5kYm94L3JlbmRlcmVyQXV0b1Byb2ZpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCekYsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7UUFJN0IsWUFDc0QsbUJBQXVELEVBQzdFLFlBQTBCLEVBQzNCLFdBQXdCLEVBQ2xDLGlCQUFxQyxFQUMxQyxZQUEyQixFQUNuQixhQUFvQyxFQUM1QixzQkFBcUQ7WUFOL0Isd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFvQztZQUM3RSxpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUMzQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQU90RCxNQUFNLE9BQU8sR0FBRyxJQUFBLDhDQUF3QixFQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDOUQsSUFBSSxPQUFPLENBQUMseUJBQXlCLEVBQUUsQ0FBQztnQkFDdkMsd0NBQXdDO2dCQUN4QyxPQUFPO1lBQ1IsQ0FBQztZQUVELFlBQVksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUM3QyxXQUFXLENBQUMsSUFBSSxDQUFDLHlDQUF5QyxZQUFZLElBQUksQ0FBQyxDQUFDO2dCQUU1RSxJQUFJLFlBQVksR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDdEIsV0FBVztvQkFDWCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsaUJBQWlCO2dCQUNqQixNQUFNLGFBQWEsR0FBRyxZQUFZLEdBQUcsRUFBRSxDQUFDLENBQUMsb0NBQW9DO2dCQUU3RSxNQUFNLEdBQUcsR0FBRyxJQUFJLG1CQUFtQixDQUFDLEtBQUssRUFBQyxJQUFJ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