/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/arrays", "vs/base/common/event", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.mp", "vs/code/node/sharedProcess/contrib/codeCacheCleaner", "vs/code/node/sharedProcess/contrib/languagePackCachedDataCleaner", "vs/code/node/sharedProcess/contrib/localizationsUpdater", "vs/code/node/sharedProcess/contrib/logsDataCleaner", "vs/code/node/sharedProcess/contrib/storageDataCleaner", "vs/platform/checksum/common/checksumService", "vs/platform/checksum/node/checksumService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/diagnostics/common/diagnostics", "vs/platform/diagnostics/node/diagnosticsService", "vs/platform/download/common/download", "vs/platform/download/common/downloadService", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/node/extensionSignatureVerificationService", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/languagePacks/common/languagePacks", "vs/platform/languagePacks/node/languagePacks", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryIpc", "vs/platform/telemetry/common/telemetryLogAppender", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/node/customEndpointTelemetryService", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/userDataSync/common/ignoredExtensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSyncLocalStoreService", "vs/platform/userDataSync/common/userDataSyncIpc", "vs/platform/userDataSync/common/userDataSyncLog", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/platform/userDataSync/common/userDataSyncEnablementService", "vs/platform/userDataSync/common/userDataSyncService", "vs/platform/userDataSync/common/userDataSyncServiceIpc", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/platform/userDataProfile/node/userDataProfileStorageService", "vs/platform/windows/node/windowTracker", "vs/platform/sign/common/sign", "vs/platform/sign/node/signService", "vs/platform/tunnel/common/tunnel", "vs/platform/tunnel/node/tunnelService", "vs/platform/remote/common/sharedProcessTunnelService", "vs/platform/tunnel/node/sharedProcessTunnelService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/base/common/platform", "vs/platform/userData/common/fileUserDataProvider", "vs/platform/files/common/diskFileSystemProviderClient", "vs/platform/profiling/node/profilingService", "vs/platform/profiling/common/profiling", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/extensionManagement/node/extensionsScannerService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/policy/common/policyIpc", "vs/platform/policy/common/policy", "vs/platform/userDataProfile/common/userDataProfileIpc", "vs/platform/telemetry/node/1dsAppender", "vs/code/node/sharedProcess/contrib/userDataProfilesCleaner", "vs/platform/remoteTunnel/common/remoteTunnel", "vs/platform/userDataSync/common/userDataSyncResourceProvider", "vs/code/node/sharedProcess/contrib/extensions", "vs/nls", "vs/platform/log/common/logService", "vs/platform/lifecycle/node/sharedProcessLifecycleService", "vs/platform/remoteTunnel/node/remoteTunnelService", "vs/platform/extensionManagement/node/extensionsProfileScannerService", "vs/platform/request/common/requestIpc", "vs/platform/extensionRecommendations/common/extensionRecommendationsIpc", "vs/platform/native/common/native", "vs/platform/native/common/nativeHostService", "vs/platform/userDataSync/node/userDataAutoSyncService", "vs/platform/extensionManagement/node/extensionTipsService", "vs/platform/ipc/common/mainProcessService", "vs/platform/storage/common/storageService", "vs/platform/remote/common/remoteSocketFactoryService", "vs/platform/remote/node/nodeSocketFactory", "vs/platform/environment/node/environmentService", "vs/platform/sharedProcess/common/sharedProcess", "vs/base/node/osReleaseInfo", "vs/base/common/desktopEnvironmentInfo", "vs/base/node/osDisplayProtocolInfo"], function (require, exports, os_1, errorMessage_1, errors_1, lifecycle_1, network_1, uri_1, arrays_1, event_1, ipc_1, ipc_mp_1, codeCacheCleaner_1, languagePackCachedDataCleaner_1, localizationsUpdater_1, logsDataCleaner_1, storageDataCleaner_1, checksumService_1, checksumService_2, configuration_1, configurationService_1, diagnostics_1, diagnosticsService_1, download_1, downloadService_1, environment_1, extensionEnablementService_1, extensionGalleryService_1, extensionManagement_1, extensionSignatureVerificationService_1, extensionManagementIpc_1, extensionManagementService_1, extensionRecommendations_1, files_1, fileService_1, diskFileSystemProvider_1, descriptors_1, instantiation_1, instantiationService_1, serviceCollection_1, languagePacks_1, languagePacks_2, log_1, logIpc_1, product_1, productService_1, request_1, storage_1, commonProperties_1, telemetry_1, telemetryIpc_1, telemetryLogAppender_1, telemetryService_1, telemetryUtils_1, customEndpointTelemetryService_1, extensionStorage_1, ignoredExtensions_1, userDataSync_1, userDataSyncAccount_1, userDataSyncLocalStoreService_1, userDataSyncIpc_1, userDataSyncLog_1, userDataSyncMachines_1, userDataSyncEnablementService_1, userDataSyncService_1, userDataSyncServiceIpc_1, userDataSyncStoreService_1, userDataProfileStorageService_1, userDataProfileStorageService_2, windowTracker_1, sign_1, signService_1, tunnel_1, tunnelService_1, sharedProcessTunnelService_1, sharedProcessTunnelService_2, uriIdentity_1, uriIdentityService_1, platform_1, fileUserDataProvider_1, diskFileSystemProviderClient_1, profilingService_1, profiling_1, extensionsScannerService_1, extensionsScannerService_2, userDataProfile_1, extensionsProfileScannerService_1, policyIpc_1, policy_1, userDataProfileIpc_1, _1dsAppender_1, userDataProfilesCleaner_1, remoteTunnel_1, userDataSyncResourceProvider_1, extensions_1, nls_1, logService_1, sharedProcessLifecycleService_1, remoteTunnelService_1, extensionsProfileScannerService_2, requestIpc_1, extensionRecommendationsIpc_1, native_1, nativeHostService_1, userDataAutoSyncService_1, extensionTipsService_1, mainProcessService_1, storageService_1, remoteSocketFactoryService_1, nodeSocketFactory_1, environmentService_1, sharedProcess_1, osReleaseInfo_1, desktopEnvironmentInfo_1, osDisplayProtocolInfo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = main;
    class SharedProcessMain extends lifecycle_1.Disposable {
        constructor(configuration) {
            super();
            this.configuration = configuration;
            this.server = this._register(new ipc_mp_1.Server(this));
            this.lifecycleService = undefined;
            this.onDidWindowConnectRaw = this._register(new event_1.Emitter());
            this.registerListeners();
        }
        registerListeners() {
            // Shared process lifecycle
            let didExit = false;
            const onExit = () => {
                if (!didExit) {
                    didExit = true;
                    this.lifecycleService?.fireOnWillShutdown();
                    this.dispose();
                }
            };
            process.once('exit', onExit);
            (0, ipc_mp_1.once)(process.parentPort, sharedProcess_1.SharedProcessLifecycle.exit, onExit);
        }
        async init() {
            // Services
            const instantiationService = await this.initServices();
            // Config
            (0, userDataSync_1.registerConfiguration)();
            instantiationService.invokeFunction(accessor => {
                const logService = accessor.get(log_1.ILogService);
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                const userDataProfilesService = accessor.get(userDataProfile_1.IUserDataProfilesService);
                // Log info
                logService.trace('sharedProcess configuration', JSON.stringify(this.configuration));
                // Channels
                this.initChannels(accessor);
                // Error handler
                this.registerErrorHandler(logService);
                // Report Profiles Info
                this.reportProfilesInfo(telemetryService, userDataProfilesService);
                this._register(userDataProfilesService.onDidChangeProfiles(() => this.reportProfilesInfo(telemetryService, userDataProfilesService)));
                // Report Client OS/DE Info
                this.reportClientOSInfo(telemetryService, logService);
            });
            // Instantiate Contributions
            this._register((0, lifecycle_1.combinedDisposable)(instantiationService.createInstance(codeCacheCleaner_1.CodeCacheCleaner, this.configuration.codeCachePath), instantiationService.createInstance(languagePackCachedDataCleaner_1.LanguagePackCachedDataCleaner), instantiationService.createInstance(storageDataCleaner_1.UnusedWorkspaceStorageDataCleaner), instantiationService.createInstance(logsDataCleaner_1.LogsDataCleaner), instantiationService.createInstance(localizationsUpdater_1.LocalizationsUpdater), instantiationService.createInstance(extensions_1.ExtensionsContributions), instantiationService.createInstance(userDataProfilesCleaner_1.UserDataProfilesCleaner)));
        }
        async initServices() {
            const services = new serviceCollection_1.ServiceCollection();
            // Product
            const productService = { _serviceBrand: undefined, ...product_1.default };
            services.set(productService_1.IProductService, productService);
            // Main Process
            const mainRouter = new ipc_1.StaticRouter(ctx => ctx === 'main');
            const mainProcessService = new mainProcessService_1.MainProcessService(this.server, mainRouter);
            services.set(mainProcessService_1.IMainProcessService, mainProcessService);
            // Policies
            const policyService = this.configuration.policiesData ? new policyIpc_1.PolicyChannelClient(this.configuration.policiesData, mainProcessService.getChannel('policy')) : new policy_1.NullPolicyService();
            services.set(policy_1.IPolicyService, policyService);
            // Environment
            const environmentService = new environmentService_1.NativeEnvironmentService(this.configuration.args, productService);
            services.set(environment_1.INativeEnvironmentService, environmentService);
            // Logger
            const loggerService = new logIpc_1.LoggerChannelClient(undefined, this.configuration.logLevel, environmentService.logsHome, this.configuration.loggers.map(loggerResource => ({ ...loggerResource, resource: uri_1.URI.revive(loggerResource.resource) })), mainProcessService.getChannel('logger'));
            services.set(log_1.ILoggerService, loggerService);
            // Log
            const logger = this._register(loggerService.createLogger('sharedprocess', { name: (0, nls_1.localize)('sharedLog', "Shared") }));
            const consoleLogger = this._register(new log_1.ConsoleLogger(logger.getLevel()));
            const logService = this._register(new logService_1.LogService(logger, [consoleLogger]));
            services.set(log_1.ILogService, logService);
            // Lifecycle
            this.lifecycleService = this._register(new sharedProcessLifecycleService_1.SharedProcessLifecycleService(logService));
            services.set(sharedProcessLifecycleService_1.ISharedProcessLifecycleService, this.lifecycleService);
            // Files
            const fileService = this._register(new fileService_1.FileService(logService));
            services.set(files_1.IFileService, fileService);
            const diskFileSystemProvider = this._register(new diskFileSystemProvider_1.DiskFileSystemProvider(logService));
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            // URI Identity
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            services.set(uriIdentity_1.IUriIdentityService, uriIdentityService);
            // User Data Profiles
            const userDataProfilesService = this._register(new userDataProfileIpc_1.UserDataProfilesService(this.configuration.profiles.all, uri_1.URI.revive(this.configuration.profiles.home).with({ scheme: environmentService.userRoamingDataHome.scheme }), mainProcessService.getChannel('userDataProfiles')));
            services.set(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
            const userDataFileSystemProvider = this._register(new fileUserDataProvider_1.FileUserDataProvider(network_1.Schemas.file, 
            // Specifically for user data, use the disk file system provider
            // from the main process to enable atomic read/write operations.
            // Since user data can change very frequently across multiple
            // processes, we want a single process handling these operations.
            this._register(new diskFileSystemProviderClient_1.DiskFileSystemProviderClient(mainProcessService.getChannel(diskFileSystemProviderClient_1.LOCAL_FILE_SYSTEM_CHANNEL_NAME), { pathCaseSensitive: platform_1.isLinux })), network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, logService));
            fileService.registerProvider(network_1.Schemas.vscodeUserData, userDataFileSystemProvider);
            // Configuration
            const configurationService = this._register(new configurationService_1.ConfigurationService(userDataProfilesService.defaultProfile.settingsResource, fileService, policyService, logService));
            services.set(configuration_1.IConfigurationService, configurationService);
            // Storage (global access only)
            const storageService = new storageService_1.RemoteStorageService(undefined, { defaultProfile: userDataProfilesService.defaultProfile, currentProfile: userDataProfilesService.defaultProfile }, mainProcessService, environmentService);
            services.set(storage_1.IStorageService, storageService);
            this._register((0, lifecycle_1.toDisposable)(() => storageService.flush()));
            // Initialize config & storage in parallel
            await Promise.all([
                configurationService.initialize(),
                storageService.initialize()
            ]);
            // Request
            const requestService = new requestIpc_1.RequestChannelClient(mainProcessService.getChannel('request'));
            services.set(request_1.IRequestService, requestService);
            // Checksum
            services.set(checksumService_1.IChecksumService, new descriptors_1.SyncDescriptor(checksumService_2.ChecksumService, undefined, false /* proxied to other processes */));
            // V8 Inspect profiler
            services.set(profiling_1.IV8InspectProfilingService, new descriptors_1.SyncDescriptor(profilingService_1.InspectProfilingService, undefined, false /* proxied to other processes */));
            // Native Host
            const nativeHostService = new nativeHostService_1.NativeHostService(-1 /* we are not running in a browser window context */, mainProcessService);
            services.set(native_1.INativeHostService, nativeHostService);
            // Download
            services.set(download_1.IDownloadService, new descriptors_1.SyncDescriptor(downloadService_1.DownloadService, undefined, true));
            // Extension recommendations
            const activeWindowManager = this._register(new windowTracker_1.ActiveWindowManager(nativeHostService));
            const activeWindowRouter = new ipc_1.StaticRouter(ctx => activeWindowManager.getActiveClientId().then(id => ctx === id));
            services.set(extensionRecommendations_1.IExtensionRecommendationNotificationService, new extensionRecommendationsIpc_1.ExtensionRecommendationNotificationServiceChannelClient(this.server.getChannel('extensionRecommendationNotification', activeWindowRouter)));
            // Telemetry
            let telemetryService;
            const appenders = [];
            const internalTelemetry = (0, telemetryUtils_1.isInternalTelemetry)(productService, configurationService);
            if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService)) {
                const logAppender = new telemetryLogAppender_1.TelemetryLogAppender(logService, loggerService, environmentService, productService);
                appenders.push(logAppender);
                if (!(0, telemetryUtils_1.isLoggingOnly)(productService, environmentService) && productService.aiConfig?.ariaKey) {
                    const collectorAppender = new _1dsAppender_1.OneDataSystemAppender(requestService, internalTelemetry, 'monacoworkbench', null, productService.aiConfig.ariaKey);
                    this._register((0, lifecycle_1.toDisposable)(() => collectorAppender.flush())); // Ensure the 1DS appender is disposed so that it flushes remaining data
                    appenders.push(collectorAppender);
                }
                telemetryService = new telemetryService_1.TelemetryService({
                    appenders,
                    commonProperties: (0, commonProperties_1.resolveCommonProperties)((0, os_1.release)(), (0, os_1.hostname)(), process.arch, productService.commit, productService.version, this.configuration.machineId, this.configuration.sqmId, internalTelemetry),
                    sendErrorTelemetry: true,
                    piiPaths: (0, telemetryUtils_1.getPiiPathsFromEnvironment)(environmentService),
                }, configurationService, productService);
            }
            else {
                telemetryService = telemetryUtils_1.NullTelemetryService;
                const nullAppender = telemetryUtils_1.NullAppender;
                appenders.push(nullAppender);
            }
            this.server.registerChannel('telemetryAppender', new telemetryIpc_1.TelemetryAppenderChannel(appenders));
            services.set(telemetry_1.ITelemetryService, telemetryService);
            // Custom Endpoint Telemetry
            const customEndpointTelemetryService = new customEndpointTelemetryService_1.CustomEndpointTelemetryService(configurationService, telemetryService, logService, loggerService, environmentService, productService);
            services.set(telemetry_1.ICustomEndpointTelemetryService, customEndpointTelemetryService);
            // Extension Management
            services.set(extensionsProfileScannerService_1.IExtensionsProfileScannerService, new descriptors_1.SyncDescriptor(extensionsProfileScannerService_2.ExtensionsProfileScannerService, undefined, true));
            services.set(extensionsScannerService_1.IExtensionsScannerService, new descriptors_1.SyncDescriptor(extensionsScannerService_2.ExtensionsScannerService, undefined, true));
            services.set(extensionSignatureVerificationService_1.IExtensionSignatureVerificationService, new descriptors_1.SyncDescriptor(extensionSignatureVerificationService_1.ExtensionSignatureVerificationService, undefined, true));
            services.set(extensionManagementService_1.INativeServerExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService, undefined, true));
            // Extension Gallery
            services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryService, undefined, true));
            // Extension Tips
            services.set(extensionManagement_1.IExtensionTipsService, new descriptors_1.SyncDescriptor(extensionTipsService_1.ExtensionTipsService, undefined, false /* Eagerly scans and computes exe based recommendations */));
            // Localizations
            services.set(languagePacks_1.ILanguagePackService, new descriptors_1.SyncDescriptor(languagePacks_2.NativeLanguagePackService, undefined, false /* proxied to other processes */));
            // Diagnostics
            services.set(diagnostics_1.IDiagnosticsService, new descriptors_1.SyncDescriptor(diagnosticsService_1.DiagnosticsService, undefined, false /* proxied to other processes */));
            // Settings Sync
            services.set(userDataSyncAccount_1.IUserDataSyncAccountService, new descriptors_1.SyncDescriptor(userDataSyncAccount_1.UserDataSyncAccountService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncLogService, new descriptors_1.SyncDescriptor(userDataSyncLog_1.UserDataSyncLogService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncUtilService, ipc_1.ProxyChannel.toService(this.server.getChannel('userDataSyncUtil', client => client.ctx !== 'main')));
            services.set(extensionManagement_1.IGlobalExtensionEnablementService, new descriptors_1.SyncDescriptor(extensionEnablementService_1.GlobalExtensionEnablementService, undefined, false /* Eagerly resets installed extensions */));
            services.set(ignoredExtensions_1.IIgnoredExtensionsManagementService, new descriptors_1.SyncDescriptor(ignoredExtensions_1.IgnoredExtensionsManagementService, undefined, true));
            services.set(extensionStorage_1.IExtensionStorageService, new descriptors_1.SyncDescriptor(extensionStorage_1.ExtensionStorageService));
            services.set(userDataSync_1.IUserDataSyncStoreManagementService, new descriptors_1.SyncDescriptor(userDataSyncStoreService_1.UserDataSyncStoreManagementService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncStoreService, new descriptors_1.SyncDescriptor(userDataSyncStoreService_1.UserDataSyncStoreService, undefined, true));
            services.set(userDataSyncMachines_1.IUserDataSyncMachinesService, new descriptors_1.SyncDescriptor(userDataSyncMachines_1.UserDataSyncMachinesService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncLocalStoreService, new descriptors_1.SyncDescriptor(userDataSyncLocalStoreService_1.UserDataSyncLocalStoreService, undefined, false /* Eagerly cleans up old backups */));
            services.set(userDataSync_1.IUserDataSyncEnablementService, new descriptors_1.SyncDescriptor(userDataSyncEnablementService_1.UserDataSyncEnablementService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncService, new descriptors_1.SyncDescriptor(userDataSyncService_1.UserDataSyncService, undefined, false /* Initializes the Sync State */));
            services.set(userDataProfileStorageService_1.IUserDataProfileStorageService, new descriptors_1.SyncDescriptor(userDataProfileStorageService_2.NativeUserDataProfileStorageService, undefined, true));
            services.set(userDataSync_1.IUserDataSyncResourceProviderService, new descriptors_1.SyncDescriptor(userDataSyncResourceProvider_1.UserDataSyncResourceProviderService, undefined, true));
            // Signing
            services.set(sign_1.ISignService, new descriptors_1.SyncDescriptor(signService_1.SignService, undefined, false /* proxied to other processes */));
            // Tunnel
            const remoteSocketFactoryService = new remoteSocketFactoryService_1.RemoteSocketFactoryService();
            services.set(remoteSocketFactoryService_1.IRemoteSocketFactoryService, remoteSocketFactoryService);
            remoteSocketFactoryService.register(0 /* RemoteConnectionType.WebSocket */, nodeSocketFactory_1.nodeSocketFactory);
            services.set(tunnel_1.ISharedTunnelsService, new descriptors_1.SyncDescriptor(tunnelService_1.SharedTunnelsService));
            services.set(sharedProcessTunnelService_1.ISharedProcessTunnelService, new descriptors_1.SyncDescriptor(sharedProcessTunnelService_2.SharedProcessTunnelService));
            // Remote Tunnel
            services.set(remoteTunnel_1.IRemoteTunnelService, new descriptors_1.SyncDescriptor(remoteTunnelService_1.RemoteTunnelService));
            return new instantiationService_1.InstantiationService(services);
        }
        initChannels(accessor) {
            // const disposables = this._register(new DisposableStore());
            // Extensions Management
            const channel = new extensionManagementIpc_1.ExtensionManagementChannel(accessor.get(extensionManagement_1.IExtensionManagementService), () => null);
            this.server.registerChannel('extensions', channel);
            // Language Packs
            const languagePacksChannel = ipc_1.ProxyChannel.fromService(accessor.get(languagePacks_1.ILanguagePackService), this._store);
            this.server.registerChannel('languagePacks', languagePacksChannel);
            // Diagnostics
            const diagnosticsChannel = ipc_1.ProxyChannel.fromService(accessor.get(diagnostics_1.IDiagnosticsService), this._store);
            this.server.registerChannel('diagnostics', diagnosticsChannel);
            // Extension Tips
            const extensionTipsChannel = new extensionManagementIpc_1.ExtensionTipsChannel(accessor.get(extensionManagement_1.IExtensionTipsService));
            this.server.registerChannel('extensionTipsService', extensionTipsChannel);
            // Checksum
            const checksumChannel = ipc_1.ProxyChannel.fromService(accessor.get(checksumService_1.IChecksumService), this._store);
            this.server.registerChannel('checksum', checksumChannel);
            // Profiling
            const profilingChannel = ipc_1.ProxyChannel.fromService(accessor.get(profiling_1.IV8InspectProfilingService), this._store);
            this.server.registerChannel('v8InspectProfiling', profilingChannel);
            // Settings Sync
            const userDataSyncMachineChannel = ipc_1.ProxyChannel.fromService(accessor.get(userDataSyncMachines_1.IUserDataSyncMachinesService), this._store);
            this.server.registerChannel('userDataSyncMachines', userDataSyncMachineChannel);
            // Custom Endpoint Telemetry
            const customEndpointTelemetryChannel = ipc_1.ProxyChannel.fromService(accessor.get(telemetry_1.ICustomEndpointTelemetryService), this._store);
            this.server.registerChannel('customEndpointTelemetry', customEndpointTelemetryChannel);
            const userDataSyncAccountChannel = new userDataSyncIpc_1.UserDataSyncAccountServiceChannel(accessor.get(userDataSyncAccount_1.IUserDataSyncAccountService));
            this.server.registerChannel('userDataSyncAccount', userDataSyncAccountChannel);
            const userDataSyncStoreManagementChannel = new userDataSyncIpc_1.UserDataSyncStoreManagementServiceChannel(accessor.get(userDataSync_1.IUserDataSyncStoreManagementService));
            this.server.registerChannel('userDataSyncStoreManagement', userDataSyncStoreManagementChannel);
            const userDataSyncChannel = new userDataSyncServiceIpc_1.UserDataSyncServiceChannel(accessor.get(userDataSync_1.IUserDataSyncService), accessor.get(userDataProfile_1.IUserDataProfilesService), accessor.get(log_1.ILogService));
            this.server.registerChannel('userDataSync', userDataSyncChannel);
            const userDataAutoSync = this._register(accessor.get(instantiation_1.IInstantiationService).createInstance(userDataAutoSyncService_1.UserDataAutoSyncService));
            this.server.registerChannel('userDataAutoSync', ipc_1.ProxyChannel.fromService(userDataAutoSync, this._store));
            this.server.registerChannel('IUserDataSyncResourceProviderService', ipc_1.ProxyChannel.fromService(accessor.get(userDataSync_1.IUserDataSyncResourceProviderService), this._store));
            // Tunnel
            const sharedProcessTunnelChannel = ipc_1.ProxyChannel.fromService(accessor.get(sharedProcessTunnelService_1.ISharedProcessTunnelService), this._store);
            this.server.registerChannel(sharedProcessTunnelService_1.ipcSharedProcessTunnelChannelName, sharedProcessTunnelChannel);
            // Remote Tunnel
            const remoteTunnelChannel = ipc_1.ProxyChannel.fromService(accessor.get(remoteTunnel_1.IRemoteTunnelService), this._store);
            this.server.registerChannel('remoteTunnel', remoteTunnelChannel);
        }
        registerErrorHandler(logService) {
            // Listen on global error events
            process.on('uncaughtException', error => (0, errors_1.onUnexpectedError)(error));
            process.on('unhandledRejection', (reason) => (0, errors_1.onUnexpectedError)(reason));
            // Install handler for unexpected errors
            (0, errors_1.setUnexpectedErrorHandler)(error => {
                const message = (0, errorMessage_1.toErrorMessage)(error, true);
                if (!message) {
                    return;
                }
                logService.error(`[uncaught exception in sharedProcess]: ${message}`);
            });
        }
        reportProfilesInfo(telemetryService, userDataProfilesService) {
            telemetryService.publicLog2('profilesInfo', {
                count: userDataProfilesService.profiles.length
            });
        }
        async reportClientOSInfo(telemetryService, logService) {
            if (platform_1.isLinux) {
                const [releaseInfo, displayProtocol] = await Promise.all([
                    (0, osReleaseInfo_1.getOSReleaseInfo)(logService.error.bind(logService)),
                    (0, osDisplayProtocolInfo_1.getDisplayProtocol)(logService.error.bind(logService))
                ]);
                const desktopEnvironment = (0, desktopEnvironmentInfo_1.getDesktopEnvironment)();
                const codeSessionType = (0, osDisplayProtocolInfo_1.getCodeDisplayProtocol)(displayProtocol, this.configuration.args['ozone-platform']);
                if (releaseInfo) {
                    telemetryService.publicLog2('clientPlatformInfo', {
                        platformId: releaseInfo.id,
                        platformVersionId: releaseInfo.version_id,
                        platformIdLike: releaseInfo.id_like,
                        desktopEnvironment: desktopEnvironment,
                        displayProtocol: displayProtocol,
                        codeDisplayProtocol: codeSessionType
                    });
                }
            }
        }
        handledClientConnection(e) {
            // This filter on message port messages will look for
            // attempts of a window to connect raw to the shared
            // process to handle these connections separate from
            // our IPC based protocol.
            if (e.data !== sharedProcess_1.SharedProcessRawConnection.response) {
                return false;
            }
            const port = (0, arrays_1.firstOrDefault)(e.ports);
            if (port) {
                this.onDidWindowConnectRaw.fire(port);
                return true;
            }
            return false;
        }
    }
    async function main(configuration) {
        // create shared process and signal back to main that we are
        // ready to accept message ports as client connections
        try {
            const sharedProcess = new SharedProcessMain(configuration);
            process.parentPort.postMessage(sharedProcess_1.SharedProcessLifecycle.ipcReady);
            // await initialization and signal this back to electron-main
            await sharedProcess.init();
            process.parentPort.postMessage(sharedProcess_1.SharedProcessLifecycle.initDone);
        }
        catch (error) {
            process.parentPort.postMessage({ error: error.toString() });
        }
    }
    const handle = setTimeout(() => {
        process.parentPort.postMessage({ warning: '[SharedProcess] did not receive configuration within 30s...' });
    }, 30000);
    process.parentPort.once('message', (e) => {
        clearTimeout(handle);
        main(e.data);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkUHJvY2Vzc01haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9jb2RlL25vZGUvc2hhcmVkUHJvY2Vzcy9zaGFyZWRQcm9jZXNzTWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTRnQmhHLG9CQWdCQztJQXJhRCxNQUFNLGlCQUFrQixTQUFRLHNCQUFVO1FBUXpDLFlBQW9CLGFBQTBDO1lBQzdELEtBQUssRUFBRSxDQUFDO1lBRFcsa0JBQWEsR0FBYixhQUFhLENBQTZCO1lBTjdDLFdBQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBK0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRTVFLHFCQUFnQixHQUE4QyxTQUFTLENBQUM7WUFFL0QsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBbUIsQ0FBQyxDQUFDO1lBS3ZGLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFFeEIsMkJBQTJCO1lBQzNCLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNwQixNQUFNLE1BQU0sR0FBRyxHQUFHLEVBQUU7Z0JBQ25CLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZCxPQUFPLEdBQUcsSUFBSSxDQUFDO29CQUVmLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxDQUFDO29CQUM1QyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hCLENBQUM7WUFDRixDQUFDLENBQUM7WUFDRixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM3QixJQUFBLGFBQUksRUFBQyxPQUFPLENBQUMsVUFBVSxFQUFFLHNDQUFzQixDQUFDLElBQUksRUFB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