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
define(["require", "exports", "vs/base/browser/window", "vs/base/common/network", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/browser/log", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteExtensionsScanner", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/browser/webWorkerExtensionHost", "vs/workbench/services/extensions/browser/webWorkerFileSystemProvider", "vs/workbench/services/extensions/common/abstractExtensionService", "vs/workbench/services/extensions/common/extensionHostKind", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/extensions/common/extensionRunningLocationTracker", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsProposedApi", "vs/workbench/services/extensions/common/extensionsUtil", "vs/workbench/services/extensions/common/remoteExtensionHost", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/remote/common/remoteExplorerService", "vs/workbench/services/userData/browser/userDataInit", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, window_1, network_1, configuration_1, dialogs_1, files_1, extensions_1, instantiation_1, log_1, log_2, notification_1, productService_1, remoteAuthorityResolver_1, remoteExtensionsScanner_1, telemetry_1, workspace_1, workspaceTrust_1, environmentService_1, extensionManagement_1, webWorkerExtensionHost_1, webWorkerFileSystemProvider_1, abstractExtensionService_1, extensionHostKind_1, extensionManifestPropertiesService_1, extensionRunningLocationTracker_1, extensions_2, extensionsProposedApi_1, extensionsUtil_1, remoteExtensionHost_1, lifecycle_1, remoteAgentService_1, remoteExplorerService_1, userDataInit_1, userDataProfile_1) {
    "use strict";
    var BrowserExtensionHostKindPicker_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserExtensionHostKindPicker = exports.ExtensionService = void 0;
    let ExtensionService = class ExtensionService extends abstractExtensionService_1.AbstractExtensionService {
        constructor(instantiationService, notificationService, _browserEnvironmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, _webExtensionsScannerService, logService, remoteAgentService, remoteExtensionsScannerService, lifecycleService, remoteAuthorityResolverService, _userDataInitializationService, _userDataProfileService, _workspaceTrustManagementService, _remoteExplorerService, dialogService) {
            const extensionsProposedApi = instantiationService.createInstance(extensionsProposedApi_1.ExtensionsProposedApi);
            const extensionHostFactory = new BrowserExtensionHostFactory(extensionsProposedApi, () => this._scanWebExtensions(), () => this._getExtensionRegistrySnapshotWhenReady(), instantiationService, remoteAgentService, remoteAuthorityResolverService, extensionEnablementService, logService);
            super(extensionsProposedApi, extensionHostFactory, new BrowserExtensionHostKindPicker(logService), instantiationService, notificationService, _browserEnvironmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, logService, remoteAgentService, remoteExtensionsScannerService, lifecycleService, remoteAuthorityResolverService, dialogService);
            this._browserEnvironmentService = _browserEnvironmentService;
            this._webExtensionsScannerService = _webExtensionsScannerService;
            this._userDataInitializationService = _userDataInitializationService;
            this._userDataProfileService = _userDataProfileService;
            this._workspaceTrustManagementService = _workspaceTrustManagementService;
            this._remoteExplorerService = _remoteExplorerService;
            // Initialize installed extensions first and do it only after workbench is ready
            lifecycleService.when(2 /* LifecyclePhase.Ready */).then(async () => {
                await this._userDataInitializationService.initializeInstalledExtensions(this._instantiationService);
                this._initialize();
            });
            this._initFetchFileSystem();
        }
        async _scanSingleExtension(extension) {
            if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                return this._remoteExtensionsScannerService.scanSingleExtension(extension.location, extension.type === 0 /* ExtensionType.System */);
            }
            const scannedExtension = await this._webExtensionsScannerService.scanExistingExtension(extension.location, extension.type, this._userDataProfileService.currentProfile.extensionsResource);
            if (scannedExtension) {
                return (0, extensions_2.toExtensionDescription)(scannedExtension);
            }
            return null;
        }
        _initFetchFileSystem() {
            const provider = new webWorkerFileSystemProvider_1.FetchFileSystemProvider();
            this._register(this._fileService.registerProvider(network_1.Schemas.http, provider));
            this._register(this._fileService.registerProvider(network_1.Schemas.https, provider));
        }
        async _scanWebExtensions() {
            const system = [], user = [], development = [];
            try {
                await Promise.all([
                    this._webExtensionsScannerService.scanSystemExtensions().then(extensions => system.push(...extensions.map(e => (0, extensions_2.toExtensionDescription)(e)))),
                    this._webExtensionsScannerService.scanUserExtensions(this._userDataProfileService.currentProfile.extensionsResource, { skipInvalidExtensions: true }).then(extensions => user.push(...extensions.map(e => (0, extensions_2.toExtensionDescription)(e)))),
                    this._webExtensionsScannerService.scanExtensionsUnderDevelopment().then(extensions => development.push(...extensions.map(e => (0, extensions_2.toExtensionDescription)(e, true))))
                ]);
            }
            catch (error) {
                this._logService.error(error);
            }
            return (0, extensionsUtil_1.dedupExtensions)(system, user, development, this._logService);
        }
        async _resolveExtensionsDefault() {
            const [localExtensions, remoteExtensions] = await Promise.all([
                this._scanWebExtensions(),
                this._remoteExtensionsScannerService.scanExtensions()
            ]);
            return new abstractExtensionService_1.ResolvedExtensions(localExtensions, remoteExtensions, /*hasLocalProcess*/ false, /*allowRemoteExtensionsInLocalWebWorker*/ true);
        }
        async _resolveExtensions() {
            if (!this._browserEnvironmentService.expectsResolverExtension) {
                return this._resolveExtensionsDefault();
            }
            const remoteAuthority = this._environmentService.remoteAuthority;
            // Now that the canonical URI provider has been registered, we need to wait for the trust state to be
            // calculated. The trust state will be used while resolving the authority, however the resolver can
            // override the trust state through the resolver result.
            await this._workspaceTrustManagementService.workspaceResolved;
            let resolverResult;
            try {
                resolverResult = await this._resolveAuthorityInitial(remoteAuthority);
            }
            catch (err) {
                if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err)) {
                    console.log(`Error handled: Not showing a notification for the error`);
                }
                this._remoteAuthorityResolverService._setResolvedAuthorityError(remoteAuthority, err);
                // Proceed with the local extension host
                return this._resolveExtensionsDefault();
            }
            // set the resolved authority
            this._remoteAuthorityResolverService._setResolvedAuthority(resolverResult.authority, resolverResult.options);
            this._remoteExplorerService.setTunnelInformation(resolverResult.tunnelInformation);
            // monitor for breakage
            const connection = this._remoteAgentService.getConnection();
            if (connection) {
                connection.onDidStateChange(async (e) => {
                    if (e.type === 0 /* PersistentConnectionEventType.ConnectionLost */) {
                        this._remoteAuthorityResolverService._clearResolvedAuthority(remoteAuthority);
                    }
                });
                connection.onReconnecting(() => this._resolveAuthorityAgain());
            }
            return this._resolveExtensionsDefault();
        }
        async _onExtensionHostExit(code) {
            // Dispose everything associated with the extension host
            this._doStopExtensionHosts();
            // If we are running extension tests, forward logs and exit code
            const automatedWindow = window_1.mainWindow;
            if (typeof automatedWindow.codeAutomationExit === 'function') {
                automatedWindow.codeAutomationExit(code, await (0, log_1.getLogs)(this._fileService, this._environmentService));
            }
        }
        async _resolveAuthority(remoteAuthority) {
            return this._resolveAuthorityOnExtensionHosts(2 /* ExtensionHostKind.LocalWebWorker */, remoteAuthority);
        }
    };
    exports.ExtensionService = ExtensionService;
    exports.ExtensionService = ExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notification_1.INotificationService),
        __param(2, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, extensionManagement_1.IWorkbenchExtensionManagementService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(11, extensionManagement_1.IWebExtensionsScannerService),
        __param(12, log_2.ILogService),
        __param(13, remoteAgentService_1.IRemoteAgentService),
        __param(14, remoteExtensionsScanner_1.IRemoteExtensionsScannerService),
        __param(15, lifecycle_1.ILifecycleService),
        __param(16, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(17, userDataInit_1.IUserDataInitializationService),
        __param(18, userDataProfile_1.IUserDataProfileService),
        __param(19, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(20, remoteExplorerService_1.IRemoteExplorerService),
        __param(21, dialogs_1.IDialogService)
    ], ExtensionService);
    let BrowserExtensionHostFactory = class BrowserExtensionHostFactory {
        constructor(_extensionsProposedApi, _scanWebExtensions, _getExtensionRegistrySnapshotWhenReady, _instantiationService, _remoteAgentService, _remoteAuthorityResolverService, _extensionEnablementService, _logService) {
            this._extensionsProposedApi = _extensionsProposedApi;
            this._scanWebExtensions = _scanWebExtensions;
            this._getExtensionRegistrySnapshotWhenReady = _getExtensionRegistrySnapshotWhenReady;
            this._instantiationService = _instantiationService;
            this._remoteAgentService = _remoteAgentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._extensionEnablementService = _extensionEnablementService;
            this._logService = _logService;
        }
        createExtensionHost(runningLocations, runningLocation, isInitialStart) {
            switch (runningLocation.kind) {
                case 1 /* ExtensionHostKind.LocalProcess */: {
                    return null;
                }
                case 2 /* ExtensionHostKind.LocalWebWorker */: {
                    const startup = (isInitialStart
                        ? 2 /* ExtensionHostStartup.EagerManualStart */
                        : 1 /* ExtensionHostStartup.EagerAutoStart */);
                    return this._instantiationService.createInstance(webWorkerExtensionHost_1.WebWorkerExtensionHost, runningLocation, startup, this._createLocalExtensionHostDataProvider(runningLocations, runningLocation, isInitialStart));
                }
                case 3 /* ExtensionHostKind.Remote */: {
                    const remoteAgentConnection = this._remoteAgentService.getConnection();
                    if (remoteAgentConnection) {
                        return this._instantiationService.createInstance(remoteExtensionHost_1.RemoteExtensionHost, runningLocation, this._createRemoteExtensionHostDataProvider(runningLocations, remoteAgentConnection.remoteAuthority));
                    }
                    return null;
                }
            }
        }
        _createLocalExtensionHostDataProvider(runningLocations, desiredRunningLocation, isInitialStart) {
            return {
                getInitData: async () => {
                    if (isInitialStart) {
                        // Here we load even extensions that would be disabled by workspace trust
                        const localExtensions = (0, abstractExtensionService_1.checkEnabledAndProposedAPI)(this._logService, this._extensionEnablementService, this._extensionsProposedApi, await this._scanWebExtensions(), /* ignore workspace trust */ true);
                        const runningLocation = runningLocations.computeRunningLocation(localExtensions, [], false);
                        const myExtensions = (0, extensionRunningLocationTracker_1.filterExtensionDescriptions)(localExtensions, runningLocation, extRunningLocation => desiredRunningLocation.equals(extRunningLocation));
                        const extensions = new extensions_2.ExtensionHostExtensions(0, localExtensions, myExtensions.map(extension => extension.identifier));
                        return { extensions };
                    }
                    else {
                        // restart case
                        const snapshot = await this._getExtensionRegistrySnapshotWhenReady();
                        const myExtensions = runningLocations.filterByRunningLocation(snapshot.extensions, desiredRunningLocation);
                        const extensions = new extensions_2.ExtensionHostExtensions(snapshot.versionId, snapshot.extensions, myExtensions.map(extension => extension.identifier));
                        return { extensions };
                    }
                }
            };
        }
        _createRemoteExtensionHostDataProvider(runningLocations, remoteAuthority) {
            return {
                remoteAuthority: remoteAuthority,
                getInitData: async () => {
                    const snapshot = await this._getExtensionRegistrySnapshotWhenReady();
                    const remoteEnv = await this._remoteAgentService.getEnvironment();
                    if (!remoteEnv) {
                        throw new Error('Cannot provide init data for remote extension host!');
                    }
                    const myExtensions = runningLocations.filterByExtensionHostKind(snapshot.extensions, 3 /* ExtensionHostKind.Remote */);
                    const extensions = new extensions_2.ExtensionHostExtensions(snapshot.versionId, snapshot.extensions, myExtensions.map(extension => extension.identifier));
                    return {
                        connectionData: this._remoteAuthorityResolverService.getConnectionData(remoteAuthority),
                        pid: remoteEnv.pid,
                        appRoot: remoteEnv.appRoot,
                        extensionHostLogsPath: remoteEnv.extensionHostLogsPath,
                        globalStorageHome: remoteEnv.globalStorageHome,
                        workspaceStorageHome: remoteEnv.workspaceStorageHome,
                        extensions,
                    };
                }
            };
        }
    };
    BrowserExtensionHostFactory = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, remoteAgentService_1.IRemoteAgentService),
        __param(5, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(6, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(7, log_2.ILogService)
    ], BrowserExtensionHostFactory);
    let BrowserExtensionHostKindPicker = BrowserExtensionHostKindPicker_1 = class BrowserExtensionHostKindPicker {
        constructor(_logService) {
            this._logService = _logService;
        }
        pickExtensionHostKind(extensionId, extensionKinds, isInstalledLocally, isInstalledRemotely, preference) {
            const result = BrowserExtensionHostKindPicker_1.pickRunningLocation(extensionKinds, isInstalledLocally, isInstalledRemotely, preference);
            this._logService.trace(`pickRunningLocation for ${extensionId.value}, extension kinds: [${extensionKinds.join(', ')}], isInstalledLocally: ${isInstalledLocally}, isInstalledRemotely: ${isInstalledRemotely}, preference: ${(0, extensionHostKind_1.extensionRunningPreferenceToString)(preference)} => ${(0, extensionHostKind_1.extensionHostKindToString)(result)}`);
            return result;
        }
        static pickRunningLocation(extensionKinds, isInstalledLocally, isInstalledRemotely, preference) {
            const result = [];
            let canRunRemotely = false;
            for (const extensionKind of extensionKinds) {
                if (extensionKind === 'ui' && isInstalledRemotely) {
                    // ui extensions run remotely if possible (but only as a last resort)
                    if (preference === 2 /* ExtensionRunningPreference.Remote */) {
                        return 3 /* ExtensionHostKind.Remote */;
                    }
                    else {
                        canRunRemotely = true;
                    }
                }
                if (extensionKind === 'workspace' && isInstalledRemotely) {
                    // workspace extensions run remotely if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 2 /* ExtensionRunningPreference.Remote */) {
                        return 3 /* ExtensionHostKind.Remote */;
                    }
                    else {
                        result.push(3 /* ExtensionHostKind.Remote */);
                    }
                }
                if (extensionKind === 'web' && (isInstalledLocally || isInstalledRemotely)) {
                    // web worker extensions run in the local web worker if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 2 /* ExtensionHostKind.LocalWebWorker */;
                    }
                    else {
                        result.push(2 /* ExtensionHostKind.LocalWebWorker */);
                    }
                }
            }
            if (canRunRemotely) {
                result.push(3 /* ExtensionHostKind.Remote */);
            }
            return (result.length > 0 ? result[0] : null);
        }
    };
    exports.BrowserExtensionHostKindPicker = BrowserExtensionHostKindPicker;
    exports.BrowserExtensionHostKindPicker = BrowserExtensionHostKindPicker = BrowserExtensionHostKindPicker_1 = __decorate([
        __param(0, log_2.ILogService)
    ], BrowserExtensionHostKindPicker);
    (0, extensions_1.registerSingleton)(extensions_2.IExtensionService, ExtensionService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeUN6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLG1EQUF3QjtRQUU3RCxZQUN3QixvQkFBMkMsRUFDNUMsbUJBQXlDLEVBQ1QsMEJBQStELEVBQ2xHLGdCQUFtQyxFQUNoQiwwQkFBZ0UsRUFDeEYsV0FBeUIsRUFDdEIsY0FBK0IsRUFDViwwQkFBZ0UsRUFDNUUsY0FBd0MsRUFDM0Msb0JBQTJDLEVBQzdCLGtDQUF1RSxFQUM3RCw0QkFBMEQsRUFDNUYsVUFBdUIsRUFDZixrQkFBdUMsRUFDM0IsOEJBQStELEVBQzdFLGdCQUFtQyxFQUNyQiw4QkFBK0QsRUFDL0MsOEJBQThELEVBQ3JFLHVCQUFnRCxFQUN2QyxnQ0FBa0UsRUFDNUUsc0JBQThDLEVBQ3ZFLGFBQTZCO1lBRTdDLE1BQU0scUJBQXFCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDZDQUFxQixDQUFDLENBQUM7WUFDekYsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDJCQUEyQixDQUMzRCxxQkFBcUIsRUFDckIsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEVBQy9CLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxzQ0FBc0MsRUFBRSxFQUNuRCxvQkFBb0IsRUFDcEIsa0JBQWtCLEVBQ2xCLDhCQUE4QixFQUM5QiwwQkFBMEIsRUFDMUIsVUFBVSxDQUNWLENBQUM7WUFDRixLQUFLLENBQ0oscUJBQXFCLEVBQ3JCLG9CQUFvQixFQUNwQixJQUFJLDhCQUE4QixD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