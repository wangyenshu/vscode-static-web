/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/performance", "vs/base/browser/dom", "vs/base/common/types", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/log/browser/log", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/browser/workbench", "vs/workbench/services/remote/common/remoteFileSystemProviderClient", "vs/platform/product/common/productService", "vs/platform/product/common/product", "vs/workbench/services/remote/browser/remoteAgentService", "vs/platform/remote/browser/remoteAuthorityResolverService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/platform/workspace/common/workspace", "vs/workbench/services/configuration/common/configuration", "vs/base/common/errors", "vs/base/browser/browser", "vs/base/common/uri", "vs/workbench/services/configuration/browser/configurationService", "vs/workbench/services/configuration/common/configurationCache", "vs/platform/sign/common/sign", "vs/platform/sign/browser/signService", "vs/workbench/services/storage/browser/storageService", "vs/platform/storage/common/storage", "vs/base/common/date", "vs/platform/window/common/window", "vs/workbench/services/workspaces/browser/workspaces", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/commands/common/commands", "vs/platform/files/browser/indexedDBFileSystemProvider", "vs/workbench/services/request/browser/requestService", "vs/platform/request/common/request", "vs/workbench/services/userData/browser/userDataInit", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/host/browser/host", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/browser/window", "vs/workbench/services/timer/browser/timerService", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/platform/workspace/common/workspaceTrust", "vs/platform/files/browser/htmlFileSystemProvider", "vs/platform/opener/common/opener", "vs/base/common/objects", "vs/base/browser/indexedDB", "vs/platform/files/browser/webFileSystemAccess", "vs/platform/telemetry/common/telemetry", "vs/platform/progress/common/progress", "vs/workbench/services/output/common/delayedLogChannel", "vs/base/common/resources", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/policy/common/policy", "vs/workbench/services/remote/common/remoteExplorerService", "vs/platform/tunnel/common/tunnel", "vs/platform/label/common/label", "vs/workbench/services/userDataProfile/common/userDataProfileService", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/browser/userDataProfile", "vs/base/common/async", "vs/workbench/services/log/common/logConstants", "vs/platform/log/common/logService", "vs/platform/remote/common/remoteSocketFactoryService", "vs/platform/remote/browser/browserSocketFactory", "vs/base/common/buffer", "vs/workbench/services/userDataProfile/browser/userDataProfileInit", "vs/workbench/services/userDataSync/browser/userDataSyncInit", "vs/workbench/services/remote/browser/browserRemoteResourceHandler", "vs/platform/log/common/bufferLog", "vs/platform/log/common/fileLog", "vs/workbench/services/terminal/common/embedderTerminalService", "vs/workbench/services/secrets/browser/secretStorageService", "vs/workbench/services/encryption/browser/encryptionService", "vs/platform/encryption/common/encryptionService", "vs/platform/secrets/common/secrets", "vs/workbench/services/remote/common/tunnelModel", "vs/base/browser/window", "vs/platform/notification/common/notification"], function (require, exports, performance_1, dom_1, types_1, serviceCollection_1, log_1, log_2, lifecycle_1, environmentService_1, workbench_1, remoteFileSystemProviderClient_1, productService_1, product_1, remoteAgentService_1, remoteAuthorityResolverService_1, remoteAuthorityResolver_1, remoteAgentService_2, files_1, fileService_1, network_1, workspace_1, configuration_1, errors_1, browser_1, uri_1, configurationService_1, configurationCache_1, sign_1, signService_1, storageService_1, storage_1, date_1, window_1, workspaces_1, inMemoryFilesystemProvider_1, commands_1, indexedDBFileSystemProvider_1, requestService_1, request_1, userDataInit_1, userDataSyncStoreService_1, userDataSync_1, lifecycle_2, actions_1, instantiation_1, nls_1, actionCommonCategories_1, dialogs_1, host_1, uriIdentity_1, uriIdentityService_1, window_2, timerService_1, workspaceTrust_1, workspaceTrust_2, htmlFileSystemProvider_1, opener_1, objects_1, indexedDB_1, webFileSystemAccess_1, telemetry_1, progress_1, delayedLogChannel_1, resources_1, userDataProfile_1, policy_1, remoteExplorerService_1, tunnel_1, label_1, userDataProfileService_1, userDataProfile_2, userDataProfile_3, async_1, logConstants_1, logService_1, remoteSocketFactoryService_1, browserSocketFactory_1, buffer_1, userDataProfileInit_1, userDataSyncInit_1, browserRemoteResourceHandler_1, bufferLog_1, fileLog_1, embedderTerminalService_1, secretStorageService_1, encryptionService_1, encryptionService_2, secrets_1, tunnelModel_1, window_3, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserMain = void 0;
    class BrowserMain extends lifecycle_1.Disposable {
        constructor(domElement, configuration) {
            super();
            this.domElement = domElement;
            this.configuration = configuration;
            this.onWillShutdownDisposables = this._register(new lifecycle_1.DisposableStore());
            this.indexedDBFileSystemProviders = [];
            this.init();
        }
        init() {
            // Browser config
            (0, browser_1.setFullscreen)(!!(0, dom_1.detectFullscreen)(window_3.mainWindow), window_3.mainWindow);
        }
        async open() {
            // Init services and wait for DOM to be ready in parallel
            const [services] = await Promise.all([this.initServices(), (0, dom_1.domContentLoaded)((0, dom_1.getWindow)(this.domElement))]);
            // Create Workbench
            const workbench = new workbench_1.Workbench(this.domElement, undefined, services.serviceCollection, services.logService);
            // Listeners
            this.registerListeners(workbench);
            // Startup
            const instantiationService = workbench.startup();
            // Window
            this._register(instantiationService.createInstance(window_2.BrowserWindow));
            // Logging
            services.logService.trace('workbench#open with configuration', (0, objects_1.safeStringify)(this.configuration));
            instantiationService.invokeFunction(accessor => {
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                for (const indexedDbFileSystemProvider of this.indexedDBFileSystemProviders) {
                    this._register(indexedDbFileSystemProvider.onReportError(e => telemetryService.publicLog2('indexedDBFileSystemProviderError', e)));
                }
            });
            // Return API Facade
            return instantiationService.invokeFunction(accessor => {
                const commandService = accessor.get(commands_1.ICommandService);
                const lifecycleService = accessor.get(lifecycle_2.ILifecycleService);
                const timerService = accessor.get(timerService_1.ITimerService);
                const openerService = accessor.get(opener_1.IOpenerService);
                const productService = accessor.get(productService_1.IProductService);
                const progressService = accessor.get(progress_1.IProgressService);
                const environmentService = accessor.get(environmentService_1.IBrowserWorkbenchEnvironmentService);
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const labelService = accessor.get(label_1.ILabelService);
                const embedderTerminalService = accessor.get(embedderTerminalService_1.IEmbedderTerminalService);
                const remoteAuthorityResolverService = accessor.get(remoteAuthorityResolver_1.IRemoteAuthorityResolverService);
                const notificationService = accessor.get(notification_1.INotificationService);
                async function showMessage(severity, message, ...items) {
                    const choice = new async_1.DeferredPromise();
                    const handle = notificationService.prompt(severity, message, items.map(item => ({
                        label: item,
                        run: () => choice.complete(item)
                    })));
                    const disposable = handle.onDidClose(() => {
                        choice.complete(undefined);
                        disposable.dispose();
                    });
                    const result = await choice.p;
                    handle.close();
                    return result;
                }
                let logger = undefined;
                return {
                    commands: {
                        executeCommand: (command, ...args) => commandService.executeCommand(command, ...args)
                    },
                    env: {
                        async getUriScheme() {
                            return productService.urlProtocol;
                        },
                        async retrievePerformanceMarks() {
                            await timerService.whenReady();
                            return timerService.getPerformanceMarks();
                        },
                        async openUri(uri) {
                            return openerService.open(uri, {});
                        }
                    },
                    logger: {
                        log: (level, message) => {
                            if (!logger) {
                                logger = instantiationService.createInstance(delayedLogChannel_1.DelayedLogChannel, 'webEmbedder', productService.embedderIdentifier || productService.nameShort, (0, resources_1.joinPath)((0, resources_1.dirname)(environmentService.logFile), 'webEmbedder.log'));
                            }
                            logger.log(level, message);
                        }
                    },
                    window: {
                        withProgress: (options, task) => progressService.withProgress(options, task),
                        createTerminal: async (options) => embedderTerminalService.createTerminal(options),
                        showInformationMessage: (message, ...items) => showMessage(notification_1.Severity.Info, message, ...items),
                    },
                    workspace: {
                        didResolveRemoteAuthority: async () => {
                            if (!this.configuration.remoteAuthority) {
                                return;
                            }
                            await remoteAuthorityResolverService.resolveAuthority(this.configuration.remoteAuthority);
                        },
                        openTunnel: async (tunnelOptions) => {
                            const tunnel = (0, types_1.assertIsDefined)(await remoteExplorerService.forward({
                                remote: tunnelOptions.remoteAddress,
                                local: tunnelOptions.localAddressPort,
                                name: tunnelOptions.label,
                                source: {
                                    source: tunnelModel_1.TunnelSource.Extension,
                                    description: labelService.getHostLabel(network_1.Schemas.vscodeRemote, this.configuration.remoteAuthority)
                                },
                                elevateIfNeeded: false,
                                privacy: tunnelOptions.privacy
                            }, {
                                label: tunnelOptions.label,
                                elevateIfNeeded: undefined,
                                onAutoForward: undefined,
                                requireLocalPort: undefined,
                                protocol: tunnelOptions.protocol === tunnel_1.TunnelProtocol.Https ? tunnelOptions.protocol : tunnel_1.TunnelProtocol.Http
                            }));
                            if (typeof tunnel === 'string') {
                                throw new Error(tunnel);
                            }
                            return new class extends tunnel_1.DisposableTunnel {
                            }({
                                port: tunnel.tunnelRemotePort,
                                host: tunnel.tunnelRemoteHost
                            }, tunnel.localAddress, () => tunnel.dispose());
                        }
                    },
                    shutdown: () => lifecycleService.shutdown()
                };
            });
        }
        registerListeners(workbench) {
            // Workbench Lifecycle
            this._register(workbench.onWillShutdown(() => this.onWillShutdownDisposables.clear()));
            this._register(workbench.onDidShutdown(() => this.dispose()));
        }
        async initServices() {
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.web.main.ts` if the service
            //       is web only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            const workspace = this.resolveWorkspace();
            // Product
            const productService = (0, objects_1.mixin)({ _serviceBrand: undefined, ...product_1.default }, this.configuration.productConfiguration);
            serviceCollection.set(productService_1.IProductService, productService);
            // Environment
            const logsPath = uri_1.URI.file((0, date_1.toLocalISOString)(new Date()).replace(/-|:|\.\d+Z$/g, '')).with({ scheme: 'vscode-log' });
            const environmentService = new environmentService_1.BrowserWorkbenchEnvironmentService(workspace.id, logsPath, this.configuration, productService);
            serviceCollection.set(environmentService_1.IBrowserWorkbenchEnvironmentService, environmentService);
            // Files
            const fileLogger = new bufferLog_1.BufferLogger();
            const fileService = this._register(new fileService_1.FileService(fileLogger));
            serviceCollection.set(files_1.IFileService, fileService);
            // Logger
            const loggerService = new fileLog_1.FileLoggerService((0, log_1.getLogLevel)(environmentService), logsPath, fileService);
            serviceCollection.set(log_1.ILoggerService, loggerService);
            // Log Service
            const otherLoggers = [new log_1.ConsoleLogger(loggerService.getLogLevel())];
            if (environmentService.isExtensionDevelopment && !!environmentService.extensionTestsLocationURI) {
                otherLoggers.push(new log_2.ConsoleLogInAutomationLogger(loggerService.getLogLevel()));
            }
            const logger = loggerService.createLogger(environmentService.logFile, { id: logConstants_1.windowLogId, name: (0, nls_1.localize)('rendererLog', "Window") });
            const logService = new logService_1.LogService(logger, otherLoggers);
            serviceCollection.set(log_1.ILogService, logService);
            // Set the logger of the fileLogger after the log service is ready.
            // This is to avoid cyclic dependency
            fileLogger.logger = logService;
            // Register File System Providers depending on IndexedDB support
            // Register them early because they are needed for the profiles initialization
            await this.registerIndexedDBFileSystemProviders(environmentService, fileService, logService, loggerService, logsPath);
            const connectionToken = environmentService.options.connectionToken || (0, dom_1.getCookieValue)(network_1.connectionTokenCookieName);
            const remoteResourceLoader = this.configuration.remoteResourceProvider ? new browserRemoteResourceHandler_1.BrowserRemoteResourceLoader(fileService, this.configuration.remoteResourceProvider) : undefined;
            const resourceUriProvider = this.configuration.resourceUriProvider ?? remoteResourceLoader?.getResourceUriProvider();
            const remoteAuthorityResolverService = new remoteAuthorityResolverService_1.RemoteAuthorityResolverService(!environmentService.expectsResolverExtension, connectionToken, resourceUriProvider, this.configuration.serverBasePath, productService, logService);
            serviceCollection.set(remoteAuthorityResolver_1.IRemoteAuthorityResolverService, remoteAuthorityResolverService);
            // Signing
            const signService = new signService_1.SignService(productService);
            serviceCollection.set(sign_1.ISignService, signService);
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.web.main.ts` if the service
            //       is web only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // URI Identity
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            serviceCollection.set(uriIdentity_1.IUriIdentityService, uriIdentityService);
            // User Data Profiles
            const userDataProfilesService = new userDataProfile_3.BrowserUserDataProfilesService(environmentService, fileService, uriIdentityService, logService);
            serviceCollection.set(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
            const currentProfile = await this.getCurrentProfile(workspace, userDataProfilesService, environmentService);
            const userDataProfileService = new userDataProfileService_1.UserDataProfileService(currentProfile);
            serviceCollection.set(userDataProfile_2.IUserDataProfileService, userDataProfileService);
            // Remote Agent
            const remoteSocketFactoryService = new remoteSocketFactoryService_1.RemoteSocketFactoryService();
            remoteSocketFactoryService.register(0 /* RemoteConnectionType.WebSocket */, new browserSocketFactory_1.BrowserSocketFactory(this.configuration.webSocketFactory));
            serviceCollection.set(remoteSocketFactoryService_1.IRemoteSocketFactoryService, remoteSocketFactoryService);
            const remoteAgentService = this._register(new remoteAgentService_1.RemoteAgentService(remoteSocketFactoryService, userDataProfileService, environmentService, productService, remoteAuthorityResolverService, signService, logService));
            serviceCollection.set(remoteAgentService_2.IRemoteAgentService, remoteAgentService);
            this._register(remoteFileSystemProviderClient_1.RemoteFileSystemProviderClient.register(remoteAgentService, fileService, logService));
            // Long running services (workspace, config, storage)
            const [configurationService, storageService] = await Promise.all([
                this.createWorkspaceService(workspace, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, logService).then(service => {
                    // Workspace
                    serviceCollection.set(workspace_1.IWorkspaceContextService, service);
                    // Configuration
                    serviceCollection.set(configuration_1.IWorkbenchConfigurationService, service);
                    return service;
                }),
                this.createStorageService(workspace, logService, userDataProfileService).then(service => {
                    // Storage
                    serviceCollection.set(storage_1.IStorageService, service);
                    return service;
                })
            ]);
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.web.main.ts` if the service
            //       is web only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // Workspace Trust Service
            const workspaceTrustEnablementService = new workspaceTrust_1.WorkspaceTrustEnablementService(configurationService, environmentService);
            serviceCollection.set(workspaceTrust_2.IWorkspaceTrustEnablementService, workspaceTrustEnablementService);
            const workspaceTrustManagementService = new workspaceTrust_1.WorkspaceTrustManagementService(configurationService, remoteAuthorityResolverService, storageService, uriIdentityService, environmentService, configurationService, workspaceTrustEnablementService, fileService);
            serviceCollection.set(workspaceTrust_2.IWorkspaceTrustManagementService, workspaceTrustManagementService);
            // Update workspace trust so that configuration is updated accordingly
            configurationService.updateWorkspaceTrust(workspaceTrustManagementService.isWorkspaceTrusted());
            this._register(workspaceTrustManagementService.onDidChangeTrust(() => configurationService.updateWorkspaceTrust(workspaceTrustManagementService.isWorkspaceTrusted())));
            // Request Service
            const requestService = new requestService_1.BrowserRequestService(remoteAgentService, configurationService, loggerService);
            serviceCollection.set(request_1.IRequestService, requestService);
            // Userdata Sync Store Management Service
            const userDataSyncStoreManagementService = new userDataSyncStoreService_1.UserDataSyncStoreManagementService(productService, configurationService, storageService);
            serviceCollection.set(userDataSync_1.IUserDataSyncStoreManagementService, userDataSyncStoreManagementService);
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.web.main.ts` if the service
            //       is web only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            const encryptionService = new encryptionService_1.EncryptionService();
            serviceCollection.set(encryptionService_2.IEncryptionService, encryptionService);
            const secretStorageService = new secretStorageService_1.BrowserSecretStorageService(storageService, encryptionService, environmentService, logService);
            serviceCollection.set(secrets_1.ISecretStorageService, secretStorageService);
            // Userdata Initialize Service
            const userDataInitializers = [];
            userDataInitializers.push(new userDataSyncInit_1.UserDataSyncInitializer(environmentService, secretStorageService, userDataSyncStoreManagementService, fileService, userDataProfilesService, storageService, productService, requestService, logService, uriIdentityService));
            if (environmentService.options.profile) {
                userDataInitializers.push(new userDataProfileInit_1.UserDataProfileInitializer(environmentService, fileService, userDataProfileService, storageService, logService, uriIdentityService, requestService));
            }
            const userDataInitializationService = new userDataInit_1.UserDataInitializationService(userDataInitializers);
            serviceCollection.set(userDataInit_1.IUserDataInitializationService, userDataInitializationService);
            try {
                await Promise.race([
                    // Do not block more than 5s
                    (0, async_1.timeout)(5000),
                    this.initializeUserData(userDataInitializationService, configurationService)
                ]);
            }
            catch (error) {
                logService.error(error);
            }
            return { serviceCollection, configurationService, logService };
        }
        async initializeUserData(userDataInitializationService, configurationService) {
            if (await userDataInitializationService.requiresInitialization()) {
                (0, performance_1.mark)('code/willInitRequiredUserData');
                // Initialize required resources - settings & global state
                await userDataInitializationService.initializeRequiredResources();
                // Important: Reload only local user configuration after initializing
                // Reloading complete configuration blocks workbench until remote configuration is loaded.
                await configurationService.reloadLocalUserConfiguration();
                (0, performance_1.mark)('code/didInitRequiredUserData');
            }
        }
        async registerIndexedDBFileSystemProviders(environmentService, fileService, logService, loggerService, logsPath) {
            // IndexedDB is used for logging and user data
            let indexedDB;
            const userDataStore = 'vscode-userdata-store';
            const logsStore = 'vscode-logs-store';
            const handlesStore = 'vscode-filehandles-store';
            try {
                indexedDB = await indexedDB_1.IndexedDB.create('vscode-web-db', 3, [userDataStore, logsStore, handlesStore]);
                // Close onWillShutdown
                this.onWillShutdownDisposables.add((0, lifecycle_1.toDisposable)(() => indexedDB?.close()));
            }
            catch (error) {
                logService.error('Error while creating IndexedDB', error);
            }
            // Logger
            if (indexedDB) {
                const logFileSystemProvider = new indexedDBFileSystemProvider_1.IndexedDBFileSystemProvider(logsPath.scheme, indexedDB, logsStore, false);
                this.indexedDBFileSystemProviders.push(logFileSystemProvider);
                fileService.registerProvider(logsPath.scheme, logFileSystemProvider);
            }
            else {
                fileService.registerProvider(logsPath.scheme, new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            }
            // User data
            let userDataProvider;
            if (indexedDB) {
                userDataProvider = new indexedDBFileSystemProvider_1.IndexedDBFileSystemProvider(network_1.Schemas.vscodeUserData, indexedDB, userDataStore, true);
                this.indexedDBFileSystemProviders.push(userDataProvider);
                this.registerDeveloperActions(userDataProvider);
            }
            else {
                logService.info('Using in-memory user data provider');
                userDataProvider = new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider();
            }
            fileService.registerProvider(network_1.Schemas.vscodeUserData, userDataProvider);
            // Local file access (if supported by browser)
            if (webFileSystemAccess_1.WebFileSystemAccess.supported(window_3.mainWindow)) {
                fileService.registerProvider(network_1.Schemas.file, new htmlFileSystemProvider_1.HTMLFileSystemProvider(indexedDB, handlesStore, logService));
            }
            // In-memory
            fileService.registerProvider(network_1.Schemas.tmp, new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
        }
        registerDeveloperActions(provider) {
            this._register((0, actions_1.registerAction2)(class ResetUserDataAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.resetUserData',
                        title: (0, nls_1.localize2)('reset', "Reset User Data"),
                        category: actionCommonCategories_1.Categories.Developer,
                        menu: {
                            id: actions_1.MenuId.CommandPalette
                        }
                    });
                }
                async run(accessor) {
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const hostService = accessor.get(host_1.IHostService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const logService = accessor.get(log_1.ILogService);
                    const result = await dialogService.confirm({
                        message: (0, nls_1.localize)('reset user data message', "Would you like to reset your data (settings, keybindings, extensions, snippets and UI State) and reload?")
                    });
                    if (result.confirmed) {
                        try {
                            await provider?.reset();
                            if (storageService instanceof storageService_1.BrowserStorageService) {
                                await storageService.clear();
                            }
                        }
                        catch (error) {
                            logService.error(error);
                            throw error;
                        }
                    }
                    hostService.reload();
                }
            }));
        }
        async createStorageService(workspace, logService, userDataProfileService) {
            const storageService = new storageService_1.BrowserStorageService(workspace, userDataProfileService, logService);
            try {
                await storageService.initialize();
                // Register to close on shutdown
                this.onWillShutdownDisposables.add((0, lifecycle_1.toDisposable)(() => storageService.close()));
                return storageService;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
                logService.error(error);
                return storageService;
            }
        }
        async createWorkspaceService(workspace, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, logService) {
            // Temporary workspaces do not exist on startup because they are
            // just in memory. As such, detect this case and eagerly create
            // the workspace file empty so that it is a valid workspace.
            if ((0, workspace_1.isWorkspaceIdentifier)(workspace) && (0, workspace_1.isTemporaryWorkspace)(workspace.configPath)) {
                try {
                    const emptyWorkspace = { folders: [] };
                    await fileService.createFile(workspace.configPath, buffer_1.VSBuffer.fromString(JSON.stringify(emptyWorkspace, null, '\t')), { overwrite: false });
                }
                catch (error) {
                    // ignore if workspace file already exists
                }
            }
            const configurationCache = new configurationCache_1.ConfigurationCache([network_1.Schemas.file, network_1.Schemas.vscodeUserData, network_1.Schemas.tmp] /* Cache all non native resources */, environmentService, fileService);
            const workspaceService = new configurationService_1.WorkspaceService({ remoteAuthority: this.configuration.remoteAuthority, configurationCache }, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, logService, new policy_1.NullPolicyService());
            try {
                await workspaceService.initialize(workspace);
                return workspaceService;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
                logService.error(error);
                return workspaceService;
            }
        }
        async getCurrentProfile(workspace, userDataProfilesService, environmentService) {
            if (environmentService.options?.profile) {
                const profile = userDataProfilesService.profiles.find(p => p.name === environmentService.options?.profile?.name);
                if (profile) {
                    return profile;
                }
                return userDataProfilesService.createNamedProfile(environmentService.options?.profile?.name, undefined, workspace);
            }
            return userDataProfilesService.getProfileForWorkspace(workspace) ?? userDataProfilesService.defaultProfile;
        }
        resolveWorkspace() {
            let workspace = undefined;
            if (this.configuration.workspaceProvider) {
                workspace = this.configuration.workspaceProvider.workspace;
            }
            // Multi-root workspace
            if (workspace && (0, window_1.isWorkspaceToOpen)(workspace)) {
                return (0, workspaces_1.getWorkspaceIdentifier)(workspace.workspaceUri);
            }
            // Single-folder workspace
            if (workspace && (0, window_1.isFolderToOpen)(workspace)) {
                return (0, workspaces_1.getSingleFolderWorkspaceIdentifier)(workspace.folderUri);
            }
            // Empty window workspace
            return workspace_1.UNKNOWN_EMPTY_WINDOW_WORKSPACE;
        }
    }
    exports.BrowserMain = BrowserMain;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViLm1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci93ZWIubWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnR2hHLE1BQWEsV0FBWSxTQUFRLHNCQUFVO1FBSzFDLFlBQ2tCLFVBQXVCLEVBQ3ZCLGFBQTRDO1lBRTdELEtBQUssRUFBRSxDQUFDO1lBSFMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUN2QixrQkFBYSxHQUFiLGFBQWEsQ0FBK0I7WUFMN0MsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQ2xFLGlDQUE0QixHQUFrQyxFQUFFLENBQUM7WUFRakYsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2IsQ0FBQztRQUVPLElBQUk7WUFFWCxpQkFBaUI7WUFDakIsSUFBQSx1QkFBYSxFQUFDLENBQUMsQ0FBQyxJQUFBLHNCQUFnQixFQUFDLG1CQUFVLENBQUMsRUFBRSxtQkFBVSxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFJO1lBRVQseURBQXlEO1lBQ3pELE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBQSxzQkFBZ0IsRUFBQyxJQUFBLGVBQVMsRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFMUcsbUJBQW1CO1lBQ25CLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTdH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