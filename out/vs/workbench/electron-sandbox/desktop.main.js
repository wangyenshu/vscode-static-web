/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/product/common/product", "vs/workbench/browser/workbench", "vs/workbench/electron-sandbox/window", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/errors", "vs/base/common/uri", "vs/workbench/services/configuration/browser/configurationService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/workbench/services/storage/electron-sandbox/storageService", "vs/platform/workspace/common/workspace", "vs/workbench/services/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/base/common/lifecycle", "vs/platform/ipc/electron-sandbox/services", "vs/platform/ipc/common/mainProcessService", "vs/workbench/services/sharedProcess/electron-sandbox/sharedProcessService", "vs/platform/remote/electron-sandbox/remoteAuthorityResolverService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/electron-sandbox/remoteAgentService", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/files/common/fileService", "vs/platform/files/common/files", "vs/workbench/services/remote/common/remoteFileSystemProviderClient", "vs/workbench/services/configuration/common/configurationCache", "vs/platform/sign/common/sign", "vs/platform/product/common/productService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/services/keybinding/electron-sandbox/nativeKeyboardLayoutService", "vs/platform/ipc/electron-sandbox/mainProcessService", "vs/platform/log/common/logIpc", "vs/base/parts/ipc/common/ipc", "vs/workbench/services/log/electron-sandbox/logService", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/platform/workspace/common/workspaceTrust", "vs/base/common/objects", "vs/workbench/services/utilityProcess/electron-sandbox/utilityProcessWorkerWorkbenchService", "vs/base/common/platform", "vs/base/common/network", "vs/workbench/services/files/electron-sandbox/diskFileSystemProvider", "vs/platform/userData/common/fileUserDataProvider", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/common/userDataProfileIpc", "vs/platform/policy/common/policyIpc", "vs/platform/policy/common/policy", "vs/workbench/services/userDataProfile/common/userDataProfileService", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/remote/browser/browserSocketFactory", "vs/platform/remote/common/remoteSocketFactoryService", "vs/platform/remote/electron-sandbox/electronRemoteResourceLoader", "vs/platform/window/electron-sandbox/window", "vs/base/browser/window"], function (require, exports, nls_1, product_1, workbench_1, window_1, browser_1, dom_1, errors_1, uri_1, configurationService_1, environmentService_1, serviceCollection_1, log_1, storageService_1, workspace_1, configuration_1, storage_1, lifecycle_1, services_1, mainProcessService_1, sharedProcessService_1, remoteAuthorityResolverService_1, remoteAuthorityResolver_1, remoteAgentService_1, remoteAgentService_2, fileService_1, files_1, remoteFileSystemProviderClient_1, configurationCache_1, sign_1, productService_1, uriIdentity_1, uriIdentityService_1, nativeKeyboardLayoutService_1, mainProcessService_2, logIpc_1, ipc_1, logService_1, workspaceTrust_1, workspaceTrust_2, objects_1, utilityProcessWorkerWorkbenchService_1, platform_1, network_1, diskFileSystemProvider_1, fileUserDataProvider_1, userDataProfile_1, userDataProfileIpc_1, policyIpc_1, policy_1, userDataProfileService_1, userDataProfile_2, browserSocketFactory_1, remoteSocketFactoryService_1, electronRemoteResourceLoader_1, window_2, window_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DesktopMain = void 0;
    exports.main = main;
    class DesktopMain extends lifecycle_1.Disposable {
        constructor(configuration) {
            super();
            this.configuration = configuration;
            this.init();
        }
        init() {
            // Massage configuration file URIs
            this.reviveUris();
            // Apply fullscreen early if configured
            (0, browser_1.setFullscreen)(!!this.configuration.fullscreen, window_3.mainWindow);
        }
        reviveUris() {
            // Workspace
            const workspace = (0, workspace_1.reviveIdentifier)(this.configuration.workspace);
            if ((0, workspace_1.isWorkspaceIdentifier)(workspace) || (0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                this.configuration.workspace = workspace;
            }
            // Files
            const filesToWait = this.configuration.filesToWait;
            const filesToWaitPaths = filesToWait?.paths;
            for (const paths of [filesToWaitPaths, this.configuration.filesToOpenOrCreate, this.configuration.filesToDiff, this.configuration.filesToMerge]) {
                if (Array.isArray(paths)) {
                    for (const path of paths) {
                        if (path.fileUri) {
                            path.fileUri = uri_1.URI.revive(path.fileUri);
                        }
                    }
                }
            }
            if (filesToWait) {
                filesToWait.waitMarkerFileUri = uri_1.URI.revive(filesToWait.waitMarkerFileUri);
            }
        }
        async open() {
            // Init services and wait for DOM to be ready in parallel
            const [services] = await Promise.all([this.initServices(), (0, dom_1.domContentLoaded)(window_3.mainWindow)]);
            // Apply zoom level early once we have a configuration service
            // and before the workbench is created to prevent flickering.
            // We also need to respect that zoom level can be configured per
            // workspace, so we need the resolved configuration service.
            // Finally, it is possible for the window to have a custom
            // zoom level that is not derived from settings.
            // (fixes https://github.com/microsoft/vscode/issues/187982)
            this.applyWindowZoomLevel(services.configurationService);
            // Create Workbench
            const workbench = new workbench_1.Workbench(window_3.mainWindow.document.body, { extraClasses: this.getExtraClasses() }, services.serviceCollection, services.logService);
            // Listeners
            this.registerListeners(workbench, services.storageService);
            // Startup
            const instantiationService = workbench.startup();
            // Window
            this._register(instantiationService.createInstance(window_1.NativeWindow));
        }
        applyWindowZoomLevel(configurationService) {
            let zoomLevel = undefined;
            if (this.configuration.isCustomZoomLevel && typeof this.configuration.zoomLevel === 'number') {
                zoomLevel = this.configuration.zoomLevel;
            }
            else {
                const windowConfig = configurationService.getValue();
                zoomLevel = typeof windowConfig.window?.zoomLevel === 'number' ? windowConfig.window.zoomLevel : 0;
            }
            (0, window_2.applyZoom)(zoomLevel, window_3.mainWindow);
        }
        getExtraClasses() {
            if (platform_1.isMacintosh && (0, platform_1.isBigSurOrNewer)(this.configuration.os.release)) {
                return ['macos-bigsur-or-newer'];
            }
            return [];
        }
        registerListeners(workbench, storageService) {
            // Workbench Lifecycle
            this._register(workbench.onWillShutdown(event => event.join(storageService.close(), { id: 'join.closeStorage', label: (0, nls_1.localize)('join.closeStorage', "Saving UI state") })));
            this._register(workbench.onDidShutdown(() => this.dispose()));
        }
        async initServices() {
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.desktop.main.ts` if the service
            //       is desktop only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // Main Process
            const mainProcessService = this._register(new mainProcessService_2.ElectronIPCMainProcessService(this.configuration.windowId));
            serviceCollection.set(mainProcessService_1.IMainProcessService, mainProcessService);
            // Policies
            const policyService = this.configuration.policiesData ? new policyIpc_1.PolicyChannelClient(this.configuration.policiesData, mainProcessService.getChannel('policy')) : new policy_1.NullPolicyService();
            serviceCollection.set(policy_1.IPolicyService, policyService);
            // Product
            const productService = { _serviceBrand: undefined, ...product_1.default };
            serviceCollection.set(productService_1.IProductService, productService);
            // Environment
            const environmentService = new environmentService_1.NativeWorkbenchEnvironmentService(this.configuration, productService);
            serviceCollection.set(environmentService_1.INativeWorkbenchEnvironmentService, environmentService);
            // Logger
            const loggers = [
                ...this.configuration.loggers.global.map(loggerResource => ({ ...loggerResource, resource: uri_1.URI.revive(loggerResource.resource) })),
                ...this.configuration.loggers.window.map(loggerResource => ({ ...loggerResource, resource: uri_1.URI.revive(loggerResource.resource), hidden: true })),
            ];
            const loggerService = new logIpc_1.LoggerChannelClient(this.configuration.windowId, this.configuration.logLevel, environmentService.windowLogsPath, loggers, mainProcessService.getChannel('logger'));
            serviceCollection.set(log_1.ILoggerService, loggerService);
            // Log
            const logService = this._register(new logService_1.NativeLogService(loggerService, environmentService));
            serviceCollection.set(log_1.ILogService, logService);
            if (platform_1.isCI) {
                logService.info('workbench#open()'); // marking workbench open helps to diagnose flaky integration/smoke tests
            }
            if (logService.getLevel() === log_1.LogLevel.Trace) {
                logService.trace('workbench#open(): with configuration', (0, objects_1.safeStringify)(this.configuration));
            }
            // Shared Process
            const sharedProcessService = new sharedProcessService_1.SharedProcessService(this.configuration.windowId, logService);
            serviceCollection.set(services_1.ISharedProcessService, sharedProcessService);
            // Utility Process Worker
            const utilityProcessWorkerWorkbenchService = new utilityProcessWorkerWorkbenchService_1.UtilityProcessWorkerWorkbenchService(this.configuration.windowId, logService, mainProcessService);
            serviceCollection.set(utilityProcessWorkerWorkbenchService_1.IUtilityProcessWorkerWorkbenchService, utilityProcessWorkerWorkbenchService);
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.desktop.main.ts` if the service
            //       is desktop only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // Sign
            const signService = ipc_1.ProxyChannel.toService(mainProcessService.getChannel('sign'));
            serviceCollection.set(sign_1.ISignService, signService);
            // Files
            const fileService = this._register(new fileService_1.FileService(logService));
            serviceCollection.set(files_1.IFileService, fileService);
            // Remote
            const remoteAuthorityResolverService = new remoteAuthorityResolverService_1.RemoteAuthorityResolverService(productService, new electronRemoteResourceLoader_1.ElectronRemoteResourceLoader(environmentService.window.id, mainProcessService, fileService));
            serviceCollection.set(remoteAuthorityResolver_1.IRemoteAuthorityResolverService, remoteAuthorityResolverService);
            // Local Files
            const diskFileSystemProvider = this._register(new diskFileSystemProvider_1.DiskFileSystemProvider(mainProcessService, utilityProcessWorkerWorkbenchService, logService, loggerService));
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            // URI Identity
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            serviceCollection.set(uriIdentity_1.IUriIdentityService, uriIdentityService);
            // User Data Profiles
            const userDataProfilesService = new userDataProfileIpc_1.UserDataProfilesService(this.configuration.profiles.all, uri_1.URI.revive(this.configuration.profiles.home).with({ scheme: environmentService.userRoamingDataHome.scheme }), mainProcessService.getChannel('userDataProfiles'));
            serviceCollection.set(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
            const userDataProfileService = new userDataProfileService_1.UserDataProfileService((0, userDataProfile_1.reviveProfile)(this.configuration.profiles.profile, userDataProfilesService.profilesHome.scheme));
            serviceCollection.set(userDataProfile_2.IUserDataProfileService, userDataProfileService);
            // Use FileUserDataProvider for user data to
            // enable atomic read / write operations.
            fileService.registerProvider(network_1.Schemas.vscodeUserData, this._register(new fileUserDataProvider_1.FileUserDataProvider(network_1.Schemas.file, diskFileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, logService)));
            // Remote Agent
            const remoteSocketFactoryService = new remoteSocketFactoryService_1.RemoteSocketFactoryService();
            remoteSocketFactoryService.register(0 /* RemoteConnectionType.WebSocket */, new browserSocketFactory_1.BrowserSocketFactory(null));
            serviceCollection.set(remoteSocketFactoryService_1.IRemoteSocketFactoryService, remoteSocketFactoryService);
            const remoteAgentService = this._register(new remoteAgentService_1.RemoteAgentService(remoteSocketFactoryService, userDataProfileService, environmentService, productService, remoteAuthorityResolverService, signService, logService));
            serviceCollection.set(remoteAgentService_2.IRemoteAgentService, remoteAgentService);
            // Remote Files
            this._register(remoteFileSystemProviderClient_1.RemoteFileSystemProviderClient.register(remoteAgentService, fileService, logService));
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.desktop.main.ts` if the service
            //       is desktop only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // Create services that require resolving in parallel
            const workspace = this.resolveWorkspaceIdentifier(environmentService);
            const [configurationService, storageService] = await Promise.all([
                this.createWorkspaceService(workspace, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, logService, policyService).then(service => {
                    // Workspace
                    serviceCollection.set(workspace_1.IWorkspaceContextService, service);
                    // Configuration
                    serviceCollection.set(configuration_1.IWorkbenchConfigurationService, service);
                    return service;
                }),
                this.createStorageService(workspace, environmentService, userDataProfileService, userDataProfilesService, mainProcessService).then(service => {
                    // Storage
                    serviceCollection.set(storage_1.IStorageService, service);
                    return service;
                }),
                this.createKeyboardLayoutService(mainProcessService).then(service => {
                    // KeyboardLayout
                    serviceCollection.set(nativeKeyboardLayoutService_1.INativeKeyboardLayoutService, service);
                    return service;
                })
            ]);
            // Workspace Trust Service
            const workspaceTrustEnablementService = new workspaceTrust_1.WorkspaceTrustEnablementService(configurationService, environmentService);
            serviceCollection.set(workspaceTrust_2.IWorkspaceTrustEnablementService, workspaceTrustEnablementService);
            const workspaceTrustManagementService = new workspaceTrust_1.WorkspaceTrustManagementService(configurationService, remoteAuthorityResolverService, storageService, uriIdentityService, environmentService, configurationService, workspaceTrustEnablementService, fileService);
            serviceCollection.set(workspaceTrust_2.IWorkspaceTrustManagementService, workspaceTrustManagementService);
            // Update workspace trust so that configuration is updated accordingly
            configurationService.updateWorkspaceTrust(workspaceTrustManagementService.isWorkspaceTrusted());
            this._register(workspaceTrustManagementService.onDidChangeTrust(() => configurationService.updateWorkspaceTrust(workspaceTrustManagementService.isWorkspaceTrusted())));
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.desktop.main.ts` if the service
            //       is desktop only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            return { serviceCollection, logService, storageService, configurationService };
        }
        resolveWorkspaceIdentifier(environmentService) {
            // Return early for when a folder or multi-root is opened
            if (this.configuration.workspace) {
                return this.configuration.workspace;
            }
            // Otherwise, workspace is empty, so we derive an identifier
            return (0, workspace_1.toWorkspaceIdentifier)(this.configuration.backupPath, environmentService.isExtensionDevelopment);
        }
        async createWorkspaceService(workspace, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, logService, policyService) {
            const configurationCache = new configurationCache_1.ConfigurationCache([network_1.Schemas.file, network_1.Schemas.vscodeUserData] /* Cache all non native resources */, environmentService, fileService);
            const workspaceService = new configurationService_1.WorkspaceService({ remoteAuthority: environmentService.remoteAuthority, configurationCache }, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, logService, policyService);
            try {
                await workspaceService.initialize(workspace);
                return workspaceService;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
                return workspaceService;
            }
        }
        async createStorageService(workspace, environmentService, userDataProfileService, userDataProfilesService, mainProcessService) {
            const storageService = new storageService_1.NativeWorkbenchStorageService(workspace, userDataProfileService, userDataProfilesService, mainProcessService, environmentService);
            try {
                await storageService.initialize();
                return storageService;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
                return storageService;
            }
        }
        async createKeyboardLayoutService(mainProcessService) {
            const keyboardLayoutService = new nativeKeyboardLayoutService_1.NativeKeyboardLayoutService(mainProcessService);
            try {
                await keyboardLayoutService.initialize();
                return keyboardLayoutService;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
                return keyboardLayoutService;
            }
        }
    }
    exports.DesktopMain = DesktopMain;
    function main(configuration) {
        const workbench = new DesktopMain(configuration);
        return workbench.open();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVza3RvcC5tYWluLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2VsZWN0cm9uLXNhbmRib3gvZGVza3RvcC5tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRZaEcsb0JBSUM7SUFuVkQsTUFBYSxXQUFZLFNBQVEsc0JBQVU7UUFFMUMsWUFDa0IsYUFBeUM7WUFFMUQsS0FBSyxFQUFFLENBQUM7WUFGUyxrQkFBYSxHQUFiLGFBQWEsQ0FBNEI7WUFJMUQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2IsQ0FBQztRQUVPLElBQUk7WUFFWCxrQ0FBa0M7WUFDbEMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRWxCLHVDQUF1QztZQUN2QyxJQUFBLHVCQUFhLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLG1CQUFVLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRU8sVUFBVTtZQUVqQixZQUFZO1lBQ1osTUFBTSxTQUFTLEdBQUcsSUFBQSw0QkFBZ0IsRUFBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pFLElBQUksSUFBQSxpQ0FBcUIsRUFBQyxTQUFTLENBQUMsSUFBSSxJQUFBLDZDQUFpQyxFQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RGLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUMxQyxDQUFDO1lBRUQsUUFBUTtZQUNSLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDO1lBQ25ELE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxFQUFFLEtBQUssQ0FBQztZQUM1QyxLQUFLLE1BQU0sS0FBSyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7Z0JBQ2pKLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUMxQixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO3dCQUMxQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzs0QkFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDekMsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDakIsV0FBVyxDQUFDLGlCQUFpQixHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDM0UsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSTtZQUVULHlEQUF5RDtZQUN6RCxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLElBQUEsc0JBQWdCLEVBQUMsbUJBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUxRiw4REFBOEQ7WUFDOUQsNkRBQTZEO1lBQzdELGdFQUFnRTtZQUNoRSw0REFBNEQ7WUFDNUQsMERBQTBEO1lBQzFELGdEQUFnRDtZQUNoRCw0REFBNEQ7WUFDNUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBRXpELG1CQUFtQjtZQUNuQixNQUFNLFNBQVMsR0FBRyxJQUFJLHFCQUFTLENBQUMsbUJBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFckosWUFBWTtZQUNaLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTNELFVBQVU7WUFDVixNQUFNLG9CQUFvQixHQUFHLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVqRCxTQUFTO1lBQ1QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMscUJBQVksQ0FBQyxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVPLG9CQUFvQixDQUFDLG9CQUEyQztZQUN2RSxJQUFJLFNBQVMsR0FBdUIsU0FBUyxDQUFDO1lBQzlDLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM5RixTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUM7WUFDMUMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsRUFBeUIsQ0FBQztnQkFDNUUsU0FBUyxHQUFHLE9BQU8sWUFBWSxDQUFDLE1BQU0sRUFBRSxTQUFTLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BHLENBQUM7WUFFRCxJQUFBLGtCQUFTLEVBQUMsU0FBUyxFQUFFLG1CQUFVLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRU8sZUFBZTtZQUN0QixJQUFJLHNCQUFXLElBQUksSUFBQSwwQkFBZSxFQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ25FLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7WUFFRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxTQUFvQixFQUFFLGNBQTZDO1lBRTVGLHNCQUFzQjtZQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVLLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFTyxLQUFLLENBQUMsWUFBWTtZQUN6QixNQUFNLGlCQUFpQixHQUFHLElBQUkscUNBQWlCLEVBQUUsQ0FBQztZQUdsRCx5RUFBeUU7WUFDekUsRUFBRTtZQUNGLHdFQUF3RTtZQUN4RSx5RUFBeUU7WUFDekUsc0VBQXNFO1lBQ3RFLHlCQUF5QjtZQUN6QixFQUFFO1lBQ0YseUVBQXlFO1lBR3pFLGVBQWU7WUFDZixNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrREFBNkIsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDMUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLHdDQUFtQixFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFFL0QsV0FBVztZQUNYLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLCtCQUFtQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLDBCQUFpQixFQUFFLENBQUM7WUFDcEwsaUJBQWlCLENBQUMsR0FBRyxDQUFDLHVCQUFjLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFckQsVUFBVTtZQUNWLE1BQU0sY0FBYyxHQUFvQixFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsR0FBRyxpQkFBTyxFQUFFLENBQUM7WUFDakYsaUJBQWlCLENBQUMsR0FBRyxDQUFDLGdDQUFlLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFdkQsY0FBYztZQUNkLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxzREFBaUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3JHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyx1REFBa0MsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBRTlFLFNBQVM7WUFDVCxNQUFNLE9BQU8sR0FBRztnQkFDZixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxjQUFjLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDbEksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsY0FBYyxFQUFFLFFBQVEsRUFBRSxTQUFHLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQzthQUNoSixDQUFDO1lBQ0YsTUFBTSxhQUFhLEdBQUcsSUFBSSw0QkFBbUIsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzdMLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxvQkFBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRXJELE1BQU07WUFDTixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWdCLENBQUMsYUFBYSxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUMzRixpQkFBaUIsQ0FBQyxHQUFHLENBQUMsaUJBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUMvQyxJQUFJLGVBQUksRUFBRSxDQUFDO2dCQUNWLFVBQVUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLHlFQUF5RTtZQUMvRyxDQUFDO1lBQ0QsSUFBSSxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssY0FBUSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUM5QyxVQUFVLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxFQUFFLElBQUEsdUJBQWEsRUFBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUM3RixDQUFDO1lBRUQsaUJBQWlCO1lBQ2pCLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSwyQ0FBb0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUMvRixpQkFBaUIsQ0FBQyxHQUFHLENBQUMsZ0NBQXFCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUVuRSx5QkFBeUI7WUFDekIsTUFBTSxvQ0FBb0MsR0FBRyxJQUFJLDJFQUFvQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ25KLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyw0RUFBcUMsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO1lBRW5HLHlFQUF5RTtZQUN6RSxFQUFFO1lBQ0Ysd0VBQXdFO1lBQ3hFLHlFQUF5RTtZQUN6RSxzRUFBc0U7WUFDdEUseUJBQXlCO1lBQ3pCLEVBQUU7WUFDRix5RUFBeUU7WUFHekUsT0FBTztZQUNQLE1BQU0sV0FBVyxHQUFHLGtCQUFZLENBQUMsU0FBUyxDQUFlLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxtQkFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWpELFFBQVE7WUFDUixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxvQkFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWpELFNBQVM7WUFDVCxNQUFNLDhCQUE4QixHQUFHLElBQUksK0RBQThCLENBQUMsY0FBYyxFQUFFLElBQUksMkRBQTRCLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQzNMLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyx5REFBK0IsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO1lBRXZGLGNBQWM7WUFDZCxNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwrQ0FBc0IsQ0FBQyxrQkFBa0IsRUFBRSxvQ0FBb0MsRUFBRSxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUMvSixXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztZQUVuRSxlQUFlO1lBQ2YsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLHVDQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQy9ELGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxpQ0FBbUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBRS9ELHFCQUFxQjtZQUNyQixNQUFNLHVCQUF1QixHQUFHLElBQUksNENBQXVCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsa0JBQWtCLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUM5UCxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsMENBQXdCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUN6RSxNQUFNLHNCQUFzQixHQUFHLElBQUksK0NBQXNCLENBQUMsSUFBQSwrQkFBYSxFQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUMzSixpQkFBaUIsQ0FBQyxHQUFHLENBQUMseUNBQXVCLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztZQUV2RSw0Q0FBNEM7WUFDNUMseUNBQXlDO1lBQ3pDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBTyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkNBQW9CLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsaUJBQU8sQ0FBQyxjQUFjLEVBQUUsdUJBQXVCLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXROLGVBQWU7WUFDZixNQUFNLDBCQUEwQixHQUFHLElBQUksdURBQTBCLEVBQUUsQ0FBQztZQUNwRSwwQkFBMEIsQ0FBQyxRQUFRLHlDQUFpQyxJQUFJLDJDQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDcEcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLHdEQUEyQixFQUFFLDBCQUEwQixDQUFDLENBQUM7WUFDL0UsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksdUNBQWtCLENBQUMsMEJBQTBCLEVBQUUsc0JBQXNCLEVBQUUsa0JBQWtCLEVBQUUsY0FBYyxFQUFFLDhCQUE4QixFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ25OLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyx3Q0FBbUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBRS9ELGVBQWU7WUFDZixJQUFJLENBQUMsU0FBUyxDQUFDLCtEQUE4QixDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUVyRyx5RUFBeUU7WUFDekUsRUFBRTtZQUNGLHdFQUF3RTtZQUN4RSx5RUFBeUU7WUFDekUsc0VBQXNFO1lBQ3RFLHlCQUF5QjtZQUN6QixFQUFFO1lBQ0YseUVBQXlFO1lBRXpFLHFEQUFxRDtZQUNyRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsb0JBQW9CLEVBQUUsY0FBYyxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO2dCQUNoRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxFQUFFLGtCQUFrQixFQUFFLHNCQUFzQixFQUFFLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUUxTSxZQUFZO29CQUNaLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxvQ0FBd0IsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFFekQsZ0JBQWdCO29CQUNoQixpQkFBaUIsQ0FBQyxHQUFHLENBQUMsOENBQThCLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBRS9ELE9BQU8sT0FBTyxDQUFDO2dCQUNoQixDQUFDLENBQUM7Z0JBRUYsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSxzQkFBc0IsRUFBRSx1QkFBdUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFFNUksVUFBVTtvQkFDVixpQkFBaUIsQ0FBQyxHQUFHLENBQUMseUJBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFFaEQsT0FBTyxPQUFPLENBQUM7Z0JBQ2hCLENBQUMsQ0FBQztnQkFFRixJQUFJLENBQUMsMkJBQTJCLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBRW5FLGlCQUFpQjtvQkFDakIsaUJBQWlCLENBQUMsR0FBRyxDQUFDLDBEQUE0QixFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUU3RCxPQUFPLE9BQU8sQ0FBQztnQkFDaEIsQ0FBQyxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsMEJBQTBCO1lBQzFCLE1BQU0sK0JBQStCLEdBQUcsSUFBSSxnREFBK0IsQ0FBQyxvQkFBb0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3RILGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxpREFBZ0MsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO1lBRXpGLE1BQU0sK0JBQStCLEdBQUcsSUFBSSxnREFBK0IsQ0FBQyxvQkFBb0IsRUFBRSw4QkFBOEIsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUUsK0JBQStCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDOVAsaUJBQWlCLENBQUMsR0FBRyxDQUFDLGlEQUFnQyxFQUFFLCtCQUErQixDQUFDLENBQUM7WUFFekYsc0VBQXNFO1lBQ3RFLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDLCtCQUErQixDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQztZQUNoRyxJQUFJLENBQUMsU0FBUyxDQUFDLCtCQUErQixDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDLCtCQUErQixDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFHeEsseUVBQXlFO1lBQ3pFLEVBQUU7WUFDRix3RUFBd0U7WUFDeEUseUVBQXlFO1lBQ3pFLHNFQUFzRTtZQUN0RSx5QkFBeUI7WUFDekIsRUFBRTtZQUNGLHlFQUF5RTtZQUd6RSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSxDQUFDO1FBQ2hGLENBQUM7UUFFTywwQkFBMEIsQ0FBQyxrQkFBc0Q7WUFFeEYseURBQXlEO1lBQ3pELElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQztZQUNyQyxDQUFDO1lBRUQsNERBQTREO1lBQzVELE9BQU8sSUFBQSxpQ0FBcUIsRUFBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3hHLENBQUM7UUFFTyxLQUFLLENBQUMsc0JBQXNCLENBQ25DLFNBQWtDLEVBQ2xDLGtCQUFzRCxFQUN0RCxzQkFBK0MsRUFDL0MsdUJBQWlELEVBQ2pELFdBQXdCLEVBQ3hCLGtCQUF1QyxFQUN2QyxrQkFBdUMsRUFDdkMsVUFBdUIsRUFDdkIsYUFBNkI7WUFFN0IsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLHVDQUFrQixDQUFDLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsaUJBQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxvQ0FBb0MsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNoSyxNQUFNLGdCQUFnQixHQUFHLElBQUksdUNBQWdCLENBQUMsRUFBRSxlQUFlLEVBQUUsa0JBQWtCLENBQUMsZUFBZSxFQUFFLGtCQUFrQixFQUFFLEVBQUUsa0JBQWtCLEVBQUUsc0JBQXNCLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUVoUixJQUFJLENBQUM7Z0JBQ0osTUFBTSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBRTdDLE9BQU8sZ0JBQWdCLENBQUM7WUFDekIsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUEsMEJBQWlCLEVBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRXpCLE9BQU8sZ0JBQWdCLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsb0JBQW9CLENBQUMsU0FBa0MsRUFBRSxrQkFBc0QsRUFBRSxzQkFBK0MsRUFBRSx1QkFBaUQsRUFBRSxrQkFBdUM7WUFDelEsTUFBTSxjQUFjLEdBQUcsSUFBSSw4Q0FBNkIsQ0FBQyxTQUFTLEVBQUUsc0JBQXNCLEVBQUUsdUJBQXVCLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUU3SixJQUFJLENBQUM7Z0JBQ0osTUFBTSxjQUFjLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBRWxDLE9BQU8sY0FBYyxDQUFDO1lBQ3ZCLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFBLDBCQUFpQixFQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUV6QixPQUFPLGNBQWMsQ0FBQztZQUN2QixDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxrQkFBdUM7WUFDaEYsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLHlEQUEyQixDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFFbEYsSUFBSSxDQUFDO2dCQUNKLE1BQU0scUJBQXFCLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBRXpDLE9BQU8scUJBQXFCLENBQUM7WUFDOUIsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUEsMEJBQWlCLEVBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRXpCLE9BQU8scUJBQXFCLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7S0FDRDtJQTdVRCxrQ0E2VUM7SUFFRCxTQUFnQixJQUFJLENBQUMsYUFBeUM7UUFDN0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFakQsT0FBTyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDekIsQ0FBQyJ9