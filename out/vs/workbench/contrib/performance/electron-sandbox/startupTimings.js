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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/update/common/update", "vs/platform/native/common/native", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/timer/browser/timerService", "vs/platform/files/common/files", "vs/base/common/uri", "vs/base/common/buffer", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/contrib/performance/browser/startupTimings"], function (require, exports, async_1, errors_1, environmentService_1, lifecycle_1, productService_1, telemetry_1, update_1, native_1, editorService_1, timerService_1, files_1, uri_1, buffer_1, workspaceTrust_1, panecomposite_1, startupTimings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeStartupTimings = void 0;
    let NativeStartupTimings = class NativeStartupTimings extends startupTimings_1.StartupTimings {
        constructor(_fileService, _timerService, _nativeHostService, editorService, paneCompositeService, _telemetryService, lifecycleService, updateService, _environmentService, _productService, workspaceTrustService) {
            super(editorService, paneCompositeService, lifecycleService, updateService, workspaceTrustService);
            this._fileService = _fileService;
            this._timerService = _timerService;
            this._nativeHostService = _nativeHostService;
            this._telemetryService = _telemetryService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._report().catch(errors_1.onUnexpectedError);
        }
        async _report() {
            const standardStartupError = await this._isStandardStartup();
            this._appendStartupTimes(standardStartupError).catch(errors_1.onUnexpectedError);
        }
        async _appendStartupTimes(standardStartupError) {
            const appendTo = this._environmentService.args['prof-append-timers'];
            const durationMarkers = this._environmentService.args['prof-duration-markers'];
            const durationMarkersFile = this._environmentService.args['prof-duration-markers-file'];
            if (!appendTo && !durationMarkers) {
                // nothing to do
                return;
            }
            try {
                await Promise.all([
                    this._timerService.whenReady(),
                    (0, async_1.timeout)(15000), // wait: cached data creation, telemetry sending
                ]);
                const perfBaseline = await this._timerService.perfBaseline;
                if (appendTo) {
                    const content = `${this._timerService.startupMetrics.ellapsed}\t${this._productService.nameShort}\t${(this._productService.commit || '').slice(0, 10) || '0000000000'}\t${this._telemetryService.sessionId}\t${standardStartupError === undefined ? 'standard_start' : 'NO_standard_start : ' + standardStartupError}\t${String(perfBaseline).padStart(4, '0')}ms\n`;
                    await this.appendContent(uri_1.URI.file(appendTo), content);
                }
                if (durationMarkers?.length) {
                    const durations = [];
                    for (const durationMarker of durationMarkers) {
                        let duration = 0;
                        if (durationMarker === 'ellapsed') {
                            duration = this._timerService.startupMetrics.ellapsed;
                        }
                        else if (durationMarker.indexOf('-') !== -1) {
                            const markers = durationMarker.split('-');
                            if (markers.length === 2) {
                                duration = this._timerService.getDuration(markers[0], markers[1]);
                            }
                        }
                        if (duration) {
                            durations.push(durationMarker);
                            durations.push(`${duration}`);
                        }
                    }
                    const durationsContent = `${durations.join('\t')}\n`;
                    if (durationMarkersFile) {
                        await this.appendContent(uri_1.URI.file(durationMarkersFile), durationsContent);
                    }
                    else {
                        console.log(durationsContent);
                    }
                }
            }
            catch (err) {
                console.error(err);
            }
            finally {
                this._nativeHostService.exit(0);
            }
        }
        async _isStandardStartup() {
            const windowCount = await this._nativeHostService.getWindowCount();
            if (windowCount !== 1) {
                return `Expected window count : 1, Actual : ${windowCount}`;
            }
            return super._isStandardStartup();
        }
        async appendContent(file, content) {
            const chunks = [];
            if (await this._fileService.exists(file)) {
                chunks.push((await this._fileService.readFile(file)).value);
            }
            chunks.push(buffer_1.VSBuffer.fromString(content));
            await this._fileService.writeFile(file, buffer_1.VSBuffer.concat(chunks));
        }
    };
    exports.NativeStartupTimings = NativeStartupTimings;
    exports.NativeStartupTimings = NativeStartupTimings = __decorate([
        __param(0, files_1.IFileService),
        __param(1, timerService_1.ITimerService),
        __param(2, native_1.INativeHostService),
        __param(3, editorService_1.IEditorService),
        __param(4, panecomposite_1.IPaneCompositePartService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, lifecycle_1.ILifecycleService),
        __param(7, update_1.IUpdateService),
        __param(8, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(9, productService_1.IProductService),
        __param(10, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], NativeStartupTimings);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnR1cFRpbWluZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wZXJmb3JtYW5jZS9lbGVjdHJvbi1zYW5kYm94L3N0YXJ0dXBUaW1pbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9CekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSwrQkFBYztRQUV2RCxZQUNnQyxZQUEwQixFQUN6QixhQUE0QixFQUN2QixrQkFBc0MsRUFDM0QsYUFBNkIsRUFDbEIsb0JBQStDLEVBQ3RDLGlCQUFvQyxFQUNyRCxnQkFBbUMsRUFDdEMsYUFBNkIsRUFDUSxtQkFBdUQsRUFDMUUsZUFBZ0MsRUFDaEMscUJBQXVEO1lBRXpGLEtBQUssQ0FBQyxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFacEUsaUJBQVksR0FBWixZQUFZLENBQWM7WUFDekIsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDdkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUd2QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBR25CLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBb0M7WUFDMUUsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBS2xFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsMEJBQWlCLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRU8sS0FBSyxDQUFDLE9BQU87WUFDcEIsTUFBTSxvQkFBb0IsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzdELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEtBQUssQ0FBQywwQkFBaUIs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