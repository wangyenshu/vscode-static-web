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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/ternarySearchTree", "vs/base/common/uri", "vs/base/common/uuid", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/profiling/electron-sandbox/profileAnalysisWorkerService", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/extensions/common/runtimeExtensionsInput", "vs/workbench/contrib/extensions/electron-sandbox/extensionsSlowActions", "vs/workbench/contrib/extensions/electron-sandbox/runtimeExtensionsEditor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/electron-sandbox/extensionHostProfiler", "vs/workbench/services/timer/browser/timerService"], function (require, exports, async_1, buffer_1, cancellation_1, errors_1, network_1, resources_1, ternarySearchTree_1, uri_1, uuid_1, nls_1, configuration_1, extensions_1, files_1, instantiation_1, log_1, notification_1, profileAnalysisWorkerService_1, telemetry_1, runtimeExtensionsInput_1, extensionsSlowActions_1, runtimeExtensionsEditor_1, editorService_1, environmentService_1, extensions_2, extensionHostProfiler_1, timerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsAutoProfiler = void 0;
    let ExtensionsAutoProfiler = class ExtensionsAutoProfiler {
        constructor(_extensionService, _extensionProfileService, _telemetryService, _logService, _notificationService, _editorService, _instantiationService, _environmentServie, _profileAnalysisService, _configService, _fileService, timerService) {
            this._extensionService = _extensionService;
            this._extensionProfileService = _extensionProfileService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._notificationService = _notificationService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._environmentServie = _environmentServie;
            this._profileAnalysisService = _profileAnalysisService;
            this._configService = _configService;
            this._fileService = _fileService;
            this._blame = new extensions_1.ExtensionIdentifierSet();
            this._perfBaseline = -1;
            timerService.perfBaseline.then(value => {
                if (value < 0) {
                    return; // too slow for profiling
                }
                this._perfBaseline = value;
                this._unresponsiveListener = _extensionService.onDidChangeResponsiveChange(this._onDidChangeResponsiveChange, this);
            });
        }
        dispose() {
            this._unresponsiveListener?.dispose();
            this._session?.dispose(true);
        }
        async _onDidChangeResponsiveChange(event) {
            if (event.extensionHostKind !== 1 /* ExtensionHostKind.LocalProcess */) {
                return;
            }
            const listener = await event.getInspectListener(true);
            if (!listener) {
                return;
            }
            if (event.isResponsive && this._session) {
                // stop profiling when responsive again
                this._session.cancel();
                this._logService.info('UNRESPONSIVE extension host: received responsive event and cancelling profiling session');
            }
            else if (!event.isResponsive && !this._session) {
                // start profiling if not yet profiling
                const cts = new cancellation_1.CancellationTokenSource();
                this._session = cts;
                let session;
                try {
                    session = await this._instantiationService.createInstance(extensionHostProfiler_1.ExtensionHostProfiler, listener.host, listener.port).start();
                }
                catch (err) {
                    this._session = undefined;
                    // fail silent as this is often
                    // caused by another party being
                    // connected already
                    return;
                }
                this._logService.info('UNRESPONSIVE extension host: starting to profile NOW');
                // wait 5 seconds or until responsive again
                try {
                    await (0, async_1.timeout)(5e3, cts.token);
                }
                catch {
                    // can throw cancellation error. that is
                    // OK, we stop profiling and analyse the
                    // profile anyways
                }
                try {
                    // stop profiling and analyse results
                    this._processCpuProfile(await session.stop());
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                finally {
                    this._session = undefined;
                }
            }
        }
        async _processCpuProfile(profile) {
            // get all extensions
            await this._extensionService.whenInstalledExtensionsRegistered();
            // send heavy samples iff enabled
            if (this._configService.getValue('application.experimental.rendererProfiling')) {
                const searchTree = ternarySearchTree_1.TernarySearchTree.forUris();
                searchTree.fill(this._extensionService.extensions.map(e => [e.extensionLocation, e]));
                await this._profileAnalysisService.analyseBottomUp(profile.data, url => searchTree.findSubstr(uri_1.URI.parse(url))?.identifier.value ?? '<<not-found>>', this._perfBaseline, false);
            }
            // analyse profile by extension-category
            const categories = this._extensionService.extensions
                .filter(e => e.extensionLocation.scheme === network_1.Schemas.file)
                .map(e => [e.extensionLocation, extensions_1.ExtensionIdentifier.toKey(e.identifier)]);
            const data = await this._profileAnalysisService.analyseByLocation(profile.data, categories);
            //
            let overall = 0;
            let top = '';
            let topAggregated = -1;
            for (const [category, aggregated] of data) {
                overall += aggregated;
                if (aggregated > topAggregated) {
                    topAggregated = aggregated;
                    top = category;
                }
            }
            const topPercentage = topAggregated / (overall / 100);
            // associate extensions to profile node
            const extension = await this._extensionService.getExtension(top);
            if (!extension) {
                // not an extension => idle, gc, self?
                return;
            }
            const sessionId = (0, uuid_1.generateUuid)();
            // print message to log
            const path = (0, resources_1.joinPath)(this._environmentServie.tmpDir, `exthost-${Math.random().toString(16).slice(2, 8)}.cpuprofile`);
            await this._fileService.writeFile(path, buffer_1.VSBuffer.fromString(JSON.stringify(profile.data)));
            this._logService.warn(`UNRESPONSIVE extension host: '${top}' took ${topPercentage}% of ${topAggregated / 1e3}ms, saved PROFILE here: '${path}'`);
            this._telemetryService.publicLog2('exthostunresponsive', {
                sessionId,
                duration: overall,
                data: data.map(tuple => tuple[0]).flat(),
                id: extensions_1.ExtensionIdentifier.toKey(extension.identifier),
            });
            // add to running extensions view
            this._extensionProfileService.setUnresponsiveProfile(extension.identifier, profile);
            // prompt: when really slow/greedy
            if (!(topPercentage >= 95 && topAggregated >= 5e6)) {
                return;
            }
            const action = await this._instantiationService.invokeFunction(extensionsSlowActions_1.createSlowExtensionAction, extension, profile);
            if (!action) {
                // cannot report issues against this extension...
                return;
            }
            // only blame once per extension, don't blame too often
            if (this._blame.has(extension.identifier) || this._blame.size >= 3) {
                return;
            }
            this._blame.add(extension.identifier);
            // user-facing message when very bad...
            this._notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('unresponsive-exthost', "The extension '{0}' took a very long time to complete its last operation and it has prevented other extensions from running.", extension.displayName || extension.name), [{
                    label: (0, nls_1.localize)('show', 'Show Extensions'),
                    run: () => this._editorService.openEditor(runtimeExtensionsInput_1.RuntimeExtensionsInput.instance, { pinned: true })
                },
                action
            ], { priority: notification_1.NotificationPriority.SILENT });
        }
    };
    exports.ExtensionsAutoProfiler = ExtensionsAutoProfiler;
    exports.ExtensionsAutoProfiler = ExtensionsAutoProfiler = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, runtimeExtensionsEditor_1.IExtensionHostProfileService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, log_1.ILogService),
        __param(4, notification_1.INotificationService),
        __param(5, editorService_1.IEditorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(8, profileAnalysisWorkerService_1.IProfileAnalysisWorkerService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, files_1.IFileService),
        __param(11, timerService_1.ITimerService)
    ], ExtensionsAutoProfiler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc0F1dG9Qcm9maWxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvZWxlY3Ryb24tc2FuZGJveC9leHRlbnNpb25zQXV0b1Byb2ZpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdDekYsSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBc0I7UUFRbEMsWUFDb0IsaUJBQXFELEVBQzFDLHdCQUF1RSxFQUNsRixpQkFBcUQsRUFDM0QsV0FBeUMsRUFDaEMsb0JBQTJELEVBQ2pFLGNBQStDLEVBQ3hDLHFCQUE2RCxFQUNoRCxrQkFBdUUsRUFDNUUsdUJBQXVFLEVBQy9FLGNBQXNELEVBQy9ELFlBQTJDLEVBQzFDLFlBQTJCO1lBWE4sc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUN6Qiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQThCO1lBQ2pFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDMUMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDZix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ2hELG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUN2QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQy9CLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0M7WUFDM0QsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUErQjtZQUM5RCxtQkFBYyxHQUFkLGNBQWMsQ0FBdUI7WUFDOUMsaUJBQVksR0FBWixZQUFZLENBQWM7WUFqQnpDLFdBQU0sR0FBRyxJQUFJLG1DQUFzQixFQUFFLENBQUM7WUFJL0Msa0JBQWEsR0FBVyxDQUFDLENBQUMsQ0FBQztZQWlCbEMsWUFBWSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FB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