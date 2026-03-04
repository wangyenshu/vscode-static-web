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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/cancellation", "vs/base/common/network", "vs/base/common/performance", "vs/base/common/platform", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/native/common/native", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteExtensionsScanner", "vs/platform/remote/common/remoteHosts", "vs/platform/request/common/request", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/browser/webWorkerExtensionHost", "vs/workbench/services/extensions/common/abstractExtensionService", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/workbench/services/extensions/common/extensionHostKind", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/extensions/common/extensionRunningLocationTracker", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsProposedApi", "vs/workbench/services/extensions/common/remoteExtensionHost", "vs/workbench/services/extensions/electron-sandbox/cachedExtensionScanner", "vs/workbench/services/extensions/electron-sandbox/localProcessExtensionHost", "vs/workbench/services/host/browser/host", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/remote/common/remoteExplorerService"], function (require, exports, dom_1, window_1, cancellation_1, network_1, performance, platform_1, nls, actionCommonCategories_1, actions_1, commands_1, configuration_1, dialogs_1, extensionManagement_1, files_1, extensions_1, instantiation_1, log_1, native_1, notification_1, opener_1, productService_1, remoteAuthorityResolver_1, remoteExtensionsScanner_1, remoteHosts_1, request_1, telemetry_1, workspace_1, workspaceTrust_1, environmentService_1, extensionManagement_2, webWorkerExtensionHost_1, abstractExtensionService_1, extensionDevOptions_1, extensionHostKind_1, extensionManifestPropertiesService_1, extensionRunningLocationTracker_1, extensions_2, extensionsProposedApi_1, remoteExtensionHost_1, cachedExtensionScanner_1, localProcessExtensionHost_1, host_1, lifecycle_1, remoteAgentService_1, remoteExplorerService_1) {
    "use strict";
    var NativeExtensionHostKindPicker_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeExtensionHostKindPicker = exports.NativeExtensionService = void 0;
    let NativeExtensionService = class NativeExtensionService extends abstractExtensionService_1.AbstractExtensionService {
        constructor(instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, logService, remoteAgentService, remoteExtensionsScannerService, lifecycleService, remoteAuthorityResolverService, _nativeHostService, _hostService, _remoteExplorerService, _extensionGalleryService, _workspaceTrustManagementService, dialogService) {
            const extensionsProposedApi = instantiationService.createInstance(extensionsProposedApi_1.ExtensionsProposedApi);
            const extensionScanner = instantiationService.createInstance(cachedExtensionScanner_1.CachedExtensionScanner);
            const extensionHostFactory = new NativeExtensionHostFactory(extensionsProposedApi, extensionScanner, () => this._getExtensionRegistrySnapshotWhenReady(), instantiationService, environmentService, extensionEnablementService, configurationService, remoteAgentService, remoteAuthorityResolverService, logService);
            super(extensionsProposedApi, extensionHostFactory, new NativeExtensionHostKindPicker(environmentService, configurationService, logService), instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService, extensionManagementService, contextService, configurationService, extensionManifestPropertiesService, logService, remoteAgentService, remoteExtensionsScannerService, lifecycleService, remoteAuthorityResolverService, dialogService);
            this._nativeHostService = _nativeHostService;
            this._hostService = _hostService;
            this._remoteExplorerService = _remoteExplorerService;
            this._extensionGalleryService = _extensionGalleryService;
            this._workspaceTrustManagementService = _workspaceTrustManagementService;
            this._localCrashTracker = new abstractExtensionService_1.ExtensionHostCrashTracker();
            this._extensionScanner = extensionScanner;
            // delay extension host creation and extension scanning
            // until the workbench is running. we cannot defer the
            // extension host more (LifecyclePhase.Restored) because
            // some editors require the extension host to restore
            // and this would result in a deadlock
            // see https://github.com/microsoft/vscode/issues/41322
            lifecycleService.when(2 /* LifecyclePhase.Ready */).then(() => {
                // reschedule to ensure this runs after restoring viewlets, panels, and editors
                (0, dom_1.runWhenWindowIdle)(window_1.mainWindow, () => {
                    this._initialize();
                }, 50 /*max delay*/);
            });
        }
        _scanSingleExtension(extension) {
            if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                return this._remoteExtensionsScannerService.scanSingleExtension(extension.location, extension.type === 0 /* ExtensionType.System */);
            }
            return this._extensionScanner.scanSingleExtension(extension.location.fsPath, extension.type === 0 /* ExtensionType.System */);
        }
        async _scanAllLocalExtensions() {
            return this._extensionScanner.scannedExtensions;
        }
        _onExtensionHostCrashed(extensionHost, code, signal) {
            const activatedExtensions = [];
            const extensionsStatus = this.getExtensionsStatus();
            for (const key of Object.keys(extensionsStatus)) {
                const extensionStatus = extensionsStatus[key];
                if (extensionStatus.activationStarted && extensionHost.containsExtension(extensionStatus.id)) {
                    activatedExtensions.push(extensionStatus.id);
                }
            }
            super._onExtensionHostCrashed(extensionHost, code, signal);
            if (extensionHost.kind === 1 /* ExtensionHostKind.LocalProcess */) {
                if (code === 55 /* ExtensionHostExitCode.VersionMismatch */) {
                    this._notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionService.versionMismatchCrash', "Extension host cannot start: version mismatch."), [{
                            label: nls.localize('relaunch', "Relaunch VS Code"),
                            run: () => {
                                this._instantiationService.invokeFunction((accessor) => {
                                    const hostService = accessor.get(host_1.IHostService);
                                    hostService.restart();
                                });
                            }
                        }]);
                    return;
                }
                this._logExtensionHostCrash(extensionHost);
                this._sendExtensionHostCrashTelemetry(code, signal, activatedExtensions);
                this._localCrashTracker.registerCrash();
                if (this._localCrashTracker.shouldAutomaticallyRestart()) {
                    this._logService.info(`Automatically restarting the extension host.`);
                    this._notificationService.status(nls.localize('extensionService.autoRestart', "The extension host terminated unexpectedly. Restarting..."), { hideAfter: 5000 });
                    this.startExtensionHosts();
                }
                else {
                    const choices = [];
                    if (this._environmentService.isBuilt) {
                        choices.push({
                            label: nls.localize('startBisect', "Start Extension Bisect"),
                            run: () => {
                                this._instantiationService.invokeFunction(accessor => {
                                    const commandService = accessor.get(commands_1.ICommandService);
                                    commandService.executeCommand('extension.bisect.start');
                                });
                            }
                        });
                    }
                    else {
                        choices.push({
                            label: nls.localize('devTools', "Open Developer Tools"),
                            run: () => this._nativeHostService.openDevTools()
                        });
                    }
                    choices.push({
                        label: nls.localize('restart', "Restart Extension Host"),
                        run: () => this.startExtensionHosts()
                    });
                    if (this._environmentService.isBuilt) {
                        choices.push({
                            label: nls.localize('learnMore', "Learn More"),
                            run: () => {
                                this._instantiationService.invokeFunction(accessor => {
                                    const openerService = accessor.get(opener_1.IOpenerService);
                                    openerService.open('https://aka.ms/vscode-extension-bisect');
                                });
                            }
                        });
                    }
                    this._notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionService.crash', "Extension host terminated unexpectedly 3 times within the last 5 minutes."), choices);
                }
            }
        }
        _sendExtensionHostCrashTelemetry(code, signal, activatedExtensions) {
            this._telemetryService.publicLog2('extensionHostCrash', {
                code,
                signal,
                extensionIds: activatedExtensions.map(e => e.value)
            });
            for (const extensionId of activatedExtensions) {
                this._telemetryService.publicLog2('extensionHostCrashExtension', {
                    code,
                    signal,
                    extensionId: extensionId.value
                });
            }
        }
        // --- impl
        async _resolveAuthority(remoteAuthority) {
            const authorityPlusIndex = remoteAuthority.indexOf('+');
            if (authorityPlusIndex === -1) {
                // This authority does not need to be resolved, simply parse the port number
                const { host, port } = (0, remoteHosts_1.parseAuthorityWithPort)(remoteAuthority);
                return {
                    authority: {
                        authority: remoteAuthority,
                        connectTo: {
                            type: 0 /* RemoteConnectionType.WebSocket */,
                            host,
                            port
                        },
                        connectionToken: undefined
                    }
                };
            }
            return this._resolveAuthorityOnExtensionHosts(1 /* ExtensionHostKind.LocalProcess */, remoteAuthority);
        }
        async _getCanonicalURI(remoteAuthority, uri) {
            const authorityPlusIndex = remoteAuthority.indexOf('+');
            if (authorityPlusIndex === -1) {
                // This authority does not use a resolver
                return uri;
            }
            const localProcessExtensionHosts = this._getExtensionHostManagers(1 /* ExtensionHostKind.LocalProcess */);
            if (localProcessExtensionHosts.length === 0) {
                // no local process extension hosts
                throw new Error(`Cannot resolve canonical URI`);
            }
            const results = await Promise.all(localProcessExtensionHosts.map(extHost => extHost.getCanonicalURI(remoteAuthority, uri)));
            for (const result of results) {
                if (result) {
                    return result;
                }
            }
            // we can only reach this if there was no resolver extension that can return the cannonical uri
            throw new Error(`Cannot get canonical URI because no extension is installed to resolve ${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)}`);
        }
        async _resolveExtensions() {
            this._extensionScanner.startScanningExtensions();
            const remoteAuthority = this._environmentService.remoteAuthority;
            let remoteEnv = null;
            let remoteExtensions = [];
            if (remoteAuthority) {
                this._remoteAuthorityResolverService._setCanonicalURIProvider(async (uri) => {
                    if (uri.scheme !== network_1.Schemas.vscodeRemote || uri.authority !== remoteAuthority) {
                        // The current remote authority resolver cannot give the canonical URI for this URI
                        return uri;
                    }
                    performance.mark(`code/willGetCanonicalURI/${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)}`);
                    if (platform_1.isCI) {
                        this._logService.info(`Invoking getCanonicalURI for authority ${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)}...`);
                    }
                    try {
                        return this._getCanonicalURI(remoteAuthority, uri);
                    }
                    finally {
                        performance.mark(`code/didGetCanonicalURI/${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)}`);
                        if (platform_1.isCI) {
                            this._logService.info(`getCanonicalURI returned for authority ${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)}.`);
                        }
                    }
                });
                if (platform_1.isCI) {
                    this._logService.info(`Starting to wait on IWorkspaceTrustManagementService.workspaceResolved...`);
                }
                // Now that the canonical URI provider has been registered, we need to wait for the trust state to be
                // calculated. The trust state will be used while resolving the authority, however the resolver can
                // override the trust state through the resolver result.
                await this._workspaceTrustManagementService.workspaceResolved;
                if (platform_1.isCI) {
                    this._logService.info(`Finished waiting on IWorkspaceTrustManagementService.workspaceResolved.`);
                }
                let resolverResult;
                try {
                    resolverResult = await this._resolveAuthorityInitial(remoteAuthority);
                }
                catch (err) {
                    if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isNoResolverFound(err)) {
                        err.isHandled = await this._handleNoResolverFound(remoteAuthority);
                    }
                    else {
                        if (remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err)) {
                            console.log(`Error handled: Not showing a notification for the error`);
                        }
                    }
                    this._remoteAuthorityResolverService._setResolvedAuthorityError(remoteAuthority, err);
                    // Proceed with the local extension host
                    return this._startLocalExtensionHost();
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
                // fetch the remote environment
                [remoteEnv, remoteExtensions] = await Promise.all([
                    this._remoteAgentService.getEnvironment(),
                    this._remoteExtensionsScannerService.scanExtensions()
                ]);
                if (!remoteEnv) {
                    this._notificationService.notify({ severity: notification_1.Severity.Error, message: nls.localize('getEnvironmentFailure', "Could not fetch remote environment") });
                    // Proceed with the local extension host
                    return this._startLocalExtensionHost();
                }
                (0, request_1.updateProxyConfigurationsScope)(remoteEnv.useHostProxy ? 1 /* ConfigurationScope.APPLICATION */ : 2 /* ConfigurationScope.MACHINE */);
            }
            else {
                this._remoteAuthorityResolverService._setCanonicalURIProvider(async (uri) => uri);
            }
            return this._startLocalExtensionHost(remoteExtensions);
        }
        async _startLocalExtensionHost(remoteExtensions = []) {
            // Ensure that the workspace trust state has been fully initialized so
            // that the extension host can start with the correct set of extensions.
            await this._workspaceTrustManagementService.workspaceTrustInitialized;
            return new abstractExtensionService_1.ResolvedExtensions(await this._scanAllLocalExtensions(), remoteExtensions, /*hasLocalProcess*/ true, /*allowRemoteExtensionsInLocalWebWorker*/ false);
        }
        _onExtensionHostExit(code) {
            // Dispose everything associated with the extension host
            this._doStopExtensionHosts();
            // Dispose the management connection to avoid reconnecting after the extension host exits
            const connection = this._remoteAgentService.getConnection();
            connection?.dispose();
            if ((0, extensionDevOptions_1.parseExtensionDevOptions)(this._environmentService).isExtensionDevTestFromCli) {
                // When CLI testing make sure to exit with proper exit code
                if (platform_1.isCI) {
                    this._logService.info(`Asking native host service to exit with code ${code}.`);
                }
                this._nativeHostService.exit(code);
            }
            else {
                // Expected development extension termination: When the extension host goes down we also shutdown the window
                this._nativeHostService.closeWindow();
            }
        }
        async _handleNoResolverFound(remoteAuthority) {
            const remoteName = (0, remoteHosts_1.getRemoteName)(remoteAuthority);
            const recommendation = this._productService.remoteExtensionTips?.[remoteName];
            if (!recommendation) {
                return false;
            }
            const sendTelemetry = (userReaction) => {
                /* __GDPR__
                "remoteExtensionRecommendations:popup" : {
                    "owner": "sandy081",
                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "extensionId": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                }
                */
                this._telemetryService.publicLog('remoteExtensionRecommendations:popup', { userReaction, extensionId: resolverExtensionId });
            };
            const resolverExtensionId = recommendation.extensionId;
            const allExtensions = await this._scanAllLocalExtensions();
            const extension = allExtensions.filter(e => e.identifier.value === resolverExtensionId)[0];
            if (extension) {
                if (!(0, abstractExtensionService_1.extensionIsEnabled)(this._logService, this._extensionEnablementService, extension, false)) {
                    const message = nls.localize('enableResolver', "Extension '{0}' is required to open the remote window.\nOK to enable?", recommendation.friendlyName);
                    this._notificationService.prompt(notification_1.Severity.Info, message, [{
                            label: nls.localize('enable', 'Enable and Reload'),
                            run: async () => {
                                sendTelemetry('enable');
                                await this._extensionEnablementService.setEnablement([(0, extensions_2.toExtension)(extension)], 8 /* EnablementState.EnabledGlobally */);
                                await this._hostService.reload();
                            }
                        }], {
                        sticky: true,
                        priority: notification_1.NotificationPriority.URGENT
                    });
                }
            }
            else {
                // Install the Extension and reload the window to handle.
                const message = nls.localize('installResolver', "Extension '{0}' is required to open the remote window.\nDo you want to install the extension?", recommendation.friendlyName);
                this._notificationService.prompt(notification_1.Severity.Info, message, [{
                        label: nls.localize('install', 'Install and Reload'),
                        run: async () => {
                            sendTelemetry('install');
                            const [galleryExtension] = await this._extensionGalleryService.getExtensions([{ id: resolverExtensionId }], cancellation_1.CancellationToken.None);
                            if (galleryExtension) {
                                await this._extensionManagementService.installFromGallery(galleryExtension);
                                await this._hostService.reload();
                            }
                            else {
                                this._notificationService.error(nls.localize('resolverExtensionNotFound', "`{0}` not found on marketplace"));
                            }
                        }
                    }], {
                    sticky: true,
                    priority: notification_1.NotificationPriority.URGENT,
                    onCancel: () => sendTelemetry('cancel')
                });
            }
            return true;
        }
    };
    exports.NativeExtensionService = NativeExtensionService;
    exports.NativeExtensionService = NativeExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notification_1.INotificationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, extensionManagement_2.IWorkbenchExtensionManagementService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(11, log_1.ILogService),
        __param(12, remoteAgentService_1.IRemoteAgentService),
        __param(13, remoteExtensionsScanner_1.IRemoteExtensionsScannerService),
        __param(14, lifecycle_1.ILifecycleService),
        __param(15, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(16, native_1.INativeHostService),
        __param(17, host_1.IHostService),
        __param(18, remoteExplorerService_1.IRemoteExplorerService),
        __param(19, extensionManagement_1.IExtensionGalleryService),
        __param(20, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(21, dialogs_1.IDialogService)
    ], NativeExtensionService);
    let NativeExtensionHostFactory = class NativeExtensionHostFactory {
        constructor(_extensionsProposedApi, _extensionScanner, _getExtensionRegistrySnapshotWhenReady, _instantiationService, environmentService, _extensionEnablementService, configurationService, _remoteAgentService, _remoteAuthorityResolverService, _logService) {
            this._extensionsProposedApi = _extensionsProposedApi;
            this._extensionScanner = _extensionScanner;
            this._getExtensionRegistrySnapshotWhenReady = _getExtensionRegistrySnapshotWhenReady;
            this._instantiationService = _instantiationService;
            this._extensionEnablementService = _extensionEnablementService;
            this._remoteAgentService = _remoteAgentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._logService = _logService;
            this._webWorkerExtHostEnablement = determineLocalWebWorkerExtHostEnablement(environmentService, configurationService);
        }
        createExtensionHost(runningLocations, runningLocation, isInitialStart) {
            switch (runningLocation.kind) {
                case 1 /* ExtensionHostKind.LocalProcess */: {
                    const startup = (isInitialStart
                        ? 2 /* ExtensionHostStartup.EagerManualStart */
                        : 1 /* ExtensionHostStartup.EagerAutoStart */);
                    return this._instantiationService.createInstance(localProcessExtensionHost_1.NativeLocalProcessExtensionHost, runningLocation, startup, this._createLocalProcessExtensionHostDataProvider(runningLocations, isInitialStart, runningLocation));
                }
                case 2 /* ExtensionHostKind.LocalWebWorker */: {
                    if (this._webWorkerExtHostEnablement !== 0 /* LocalWebWorkerExtHostEnablement.Disabled */) {
                        const startup = (isInitialStart
                            ? (this._webWorkerExtHostEnablement === 2 /* LocalWebWorkerExtHostEnablement.Lazy */ ? 3 /* ExtensionHostStartup.Lazy */ : 2 /* ExtensionHostStartup.EagerManualStart */)
                            : 1 /* ExtensionHostStartup.EagerAutoStart */);
                        return this._instantiationService.createInstance(webWorkerExtensionHost_1.WebWorkerExtensionHost, runningLocation, startup, this._createWebWorkerExtensionHostDataProvider(runningLocations, runningLocation));
                    }
                    return null;
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
        _createLocalProcessExtensionHostDataProvider(runningLocations, isInitialStart, desiredRunningLocation) {
            return {
                getInitData: async () => {
                    if (isInitialStart) {
                        // Here we load even extensions that would be disabled by workspace trust
                        const scannedExtensions = await this._extensionScanner.scannedExtensions;
                        if (platform_1.isCI) {
                            this._logService.info(`NativeExtensionHostFactory._createLocalProcessExtensionHostDataProvider.scannedExtensions: ${scannedExtensions.map(ext => ext.identifier.value).join(',')}`);
                        }
                        const localExtensions = (0, abstractExtensionService_1.checkEnabledAndProposedAPI)(this._logService, this._extensionEnablementService, this._extensionsProposedApi, scannedExtensions, /* ignore workspace trust */ true);
                        if (platform_1.isCI) {
                            this._logService.info(`NativeExtensionHostFactory._createLocalProcessExtensionHostDataProvider.localExtensions: ${localExtensions.map(ext => ext.identifier.value).join(',')}`);
                        }
                        const runningLocation = runningLocations.computeRunningLocation(localExtensions, [], false);
                        const myExtensions = (0, extensionRunningLocationTracker_1.filterExtensionDescriptions)(localExtensions, runningLocation, extRunningLocation => desiredRunningLocation.equals(extRunningLocation));
                        const extensions = new extensions_2.ExtensionHostExtensions(0, localExtensions, myExtensions.map(extension => extension.identifier));
                        if (platform_1.isCI) {
                            this._logService.info(`NativeExtensionHostFactory._createLocalProcessExtensionHostDataProvider.myExtensions: ${myExtensions.map(ext => ext.identifier.value).join(',')}`);
                        }
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
        _createWebWorkerExtensionHostDataProvider(runningLocations, desiredRunningLocation) {
            return {
                getInitData: async () => {
                    const snapshot = await this._getExtensionRegistrySnapshotWhenReady();
                    const myExtensions = runningLocations.filterByRunningLocation(snapshot.extensions, desiredRunningLocation);
                    const extensions = new extensions_2.ExtensionHostExtensions(snapshot.versionId, snapshot.extensions, myExtensions.map(extension => extension.identifier));
                    return { extensions };
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
    NativeExtensionHostFactory = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, remoteAgentService_1.IRemoteAgentService),
        __param(8, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(9, log_1.ILogService)
    ], NativeExtensionHostFactory);
    function determineLocalWebWorkerExtHostEnablement(environmentService, configurationService) {
        if (environmentService.isExtensionDevelopment && environmentService.extensionDevelopmentKind?.some(k => k === 'web')) {
            return 1 /* LocalWebWorkerExtHostEnablement.Eager */;
        }
        else {
            const config = configurationService.getValue(extensions_2.webWorkerExtHostConfig);
            if (config === true) {
                return 1 /* LocalWebWorkerExtHostEnablement.Eager */;
            }
            else if (config === 'auto') {
                return 2 /* LocalWebWorkerExtHostEnablement.Lazy */;
            }
            else {
                return 0 /* LocalWebWorkerExtHostEnablement.Disabled */;
            }
        }
    }
    var LocalWebWorkerExtHostEnablement;
    (function (LocalWebWorkerExtHostEnablement) {
        LocalWebWorkerExtHostEnablement[LocalWebWorkerExtHostEnablement["Disabled"] = 0] = "Disabled";
        LocalWebWorkerExtHostEnablement[LocalWebWorkerExtHostEnablement["Eager"] = 1] = "Eager";
        LocalWebWorkerExtHostEnablement[LocalWebWorkerExtHostEnablement["Lazy"] = 2] = "Lazy";
    })(LocalWebWorkerExtHostEnablement || (LocalWebWorkerExtHostEnablement = {}));
    let NativeExtensionHostKindPicker = NativeExtensionHostKindPicker_1 = class NativeExtensionHostKindPicker {
        constructor(environmentService, configurationService, _logService) {
            this._logService = _logService;
            this._hasRemoteExtHost = Boolean(environmentService.remoteAuthority);
            const webWorkerExtHostEnablement = determineLocalWebWorkerExtHostEnablement(environmentService, configurationService);
            this._hasWebWorkerExtHost = (webWorkerExtHostEnablement !== 0 /* LocalWebWorkerExtHostEnablement.Disabled */);
        }
        pickExtensionHostKind(extensionId, extensionKinds, isInstalledLocally, isInstalledRemotely, preference) {
            const result = NativeExtensionHostKindPicker_1.pickExtensionHostKind(extensionKinds, isInstalledLocally, isInstalledRemotely, preference, this._hasRemoteExtHost, this._hasWebWorkerExtHost);
            this._logService.trace(`pickRunningLocation for ${extensionId.value}, extension kinds: [${extensionKinds.join(', ')}], isInstalledLocally: ${isInstalledLocally}, isInstalledRemotely: ${isInstalledRemotely}, preference: ${(0, extensionHostKind_1.extensionRunningPreferenceToString)(preference)} => ${(0, extensionHostKind_1.extensionHostKindToString)(result)}`);
            return result;
        }
        static pickExtensionHostKind(extensionKinds, isInstalledLocally, isInstalledRemotely, preference, hasRemoteExtHost, hasWebWorkerExtHost) {
            const result = [];
            for (const extensionKind of extensionKinds) {
                if (extensionKind === 'ui' && isInstalledLocally) {
                    // ui extensions run locally if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 1 /* ExtensionHostKind.LocalProcess */;
                    }
                    else {
                        result.push(1 /* ExtensionHostKind.LocalProcess */);
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
                if (extensionKind === 'workspace' && !hasRemoteExtHost) {
                    // workspace extensions also run locally if there is no remote
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 1 /* ExtensionHostKind.LocalProcess */;
                    }
                    else {
                        result.push(1 /* ExtensionHostKind.LocalProcess */);
                    }
                }
                if (extensionKind === 'web' && isInstalledLocally && hasWebWorkerExtHost) {
                    // web worker extensions run in the local web worker if possible
                    if (preference === 0 /* ExtensionRunningPreference.None */ || preference === 1 /* ExtensionRunningPreference.Local */) {
                        return 2 /* ExtensionHostKind.LocalWebWorker */;
                    }
                    else {
                        result.push(2 /* ExtensionHostKind.LocalWebWorker */);
                    }
                }
            }
            return (result.length > 0 ? result[0] : null);
        }
    };
    exports.NativeExtensionHostKindPicker = NativeExtensionHostKindPicker;
    exports.NativeExtensionHostKindPicker = NativeExtensionHostKindPicker = NativeExtensionHostKindPicker_1 = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService)
    ], NativeExtensionHostKindPicker);
    class RestartExtensionHostAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.restartExtensionHost',
                title: nls.localize2('restartExtensionHost', "Restart Extension Host"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const extensionService = accessor.get(extensions_2.IExtensionService);
            const stopped = await extensionService.stopExtensionHosts(nls.localize('restartExtensionHost.reason', "Restarting extension host on explicit request."));
            if (stopped) {
                extensionService.startExtensionHosts();
            }
        }
    }
    (0, actions_1.registerAction2)(RestartExtensionHostAction);
    (0, extensions_1.registerSingleton)(extensions_2.IExtensionService, NativeExtensionService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlRXh0ZW5zaW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2VsZWN0cm9uLXNhbmRib3gvbmF0aXZlRXh0ZW5zaW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBMER6RixJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLG1EQUF3QjtRQUtuRSxZQUN3QixvQkFBMkMsRUFDNUMsbUJBQXlDLEVBQ2pDLGtCQUFnRCxFQUMzRCxnQkFBbUMsRUFDaEIsMEJBQWdFLEVBQ3hGLFdBQXlCLEVBQ3RCLGNBQStCLEVBQ1YsMEJBQWdFLEVBQzVFLGNBQXdDLEVBQzNDLG9CQUEyQyxFQUM3QixrQ0FBdUUsRUFDL0YsVUFBdUIsRUFDZixrQkFBdUMsRUFDM0IsOEJBQStELEVBQzdFLGdCQUFtQyxFQUNyQiw4QkFBK0QsRUFDNUUsa0JBQXVELEVBQzdELFlBQTJDLEVBQ2pDLHNCQUErRCxFQUM3RCx3QkFBbUUsRUFDM0QsZ0NBQW1GLEVBQ3JHLGFBQTZCO1lBRTdDLE1BQU0scUJBQXFCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDZDQUFxQixDQUFDLENBQUM7WUFDekYsTUFBTSxnQkFBZ0IsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsK0NBQXNCLENBQUMsQ0FBQztZQUNyRixNQUFNLG9CQUFvQixHQUFHLElBQUksMEJBQTBCLENBQzFELHFCQUFxQixFQUNyQixnQkFBZ0IsRUFDaEIsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLEVBQ25ELG9CQUFvQixFQUNwQixrQkFBa0IsRUFDbEIsMEJBQTBCLEVBQzFCLG9CQUFvQixFQUNwQixrQkFBa0IsRUFDbEIsOEJB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