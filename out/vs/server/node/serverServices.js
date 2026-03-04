/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/node/id", "vs/base/node/pfs", "vs/base/parts/ipc/common/ipc", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/debug/common/extensionHostDebugIpc", "vs/platform/download/common/download", "vs/platform/download/common/downloadIpc", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/node/extensionSignatureVerificationService", "vs/platform/extensionManagement/common/extensionManagementCLI", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/languagePacks/common/languagePacks", "vs/platform/languagePacks/node/languagePacks", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/request/common/requestIpc", "vs/platform/request/node/requestService", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/node/errorTelemetry", "vs/platform/terminal/common/terminal", "vs/platform/terminal/node/ptyHostService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/server/node/remoteAgentEnvironmentImpl", "vs/server/node/remoteFileSystemProviderServer", "vs/platform/telemetry/common/remoteTelemetryChannel", "vs/platform/telemetry/common/serverTelemetryService", "vs/server/node/remoteTerminalChannel", "vs/workbench/api/node/uriTransformer", "vs/server/node/serverEnvironmentService", "vs/workbench/contrib/terminal/common/remote/remoteTerminalChannel", "vs/workbench/services/remote/common/remoteFileSystemProviderClient", "vs/server/node/extensionHostStatusService", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/server/node/extensionsScannerService", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/policy/common/policy", "vs/platform/telemetry/node/1dsAppender", "vs/platform/log/node/loggerService", "vs/platform/userDataProfile/node/userDataProfile", "vs/platform/extensionManagement/node/extensionsProfileScannerService", "vs/platform/log/common/logService", "vs/platform/log/common/logIpc", "vs/nls", "vs/server/node/remoteExtensionsScanner", "vs/platform/remote/common/remoteExtensionsScanner", "vs/platform/userDataProfile/common/userDataProfileIpc", "vs/platform/terminal/node/nodePtyHostStarter"], function (require, exports, os_1, event_1, lifecycle_1, network_1, path, id_1, pfs_1, ipc_1, configuration_1, configurationService_1, extensionHostDebugIpc_1, download_1, downloadIpc_1, environment_1, extensionGalleryService_1, extensionManagement_1, extensionSignatureVerificationService_1, extensionManagementCLI_1, extensionManagementIpc_1, extensionManagementService_1, files_1, fileService_1, diskFileSystemProvider_1, descriptors_1, instantiationService_1, serviceCollection_1, languagePacks_1, languagePacks_2, log_1, product_1, productService_1, request_1, requestIpc_1, requestService_1, commonProperties_1, telemetry_1, telemetryUtils_1, errorTelemetry_1, terminal_1, ptyHostService_1, uriIdentity_1, uriIdentityService_1, remoteAgentEnvironmentImpl_1, remoteFileSystemProviderServer_1, remoteTelemetryChannel_1, serverTelemetryService_1, remoteTerminalChannel_1, uriTransformer_1, serverEnvironmentService_1, remoteTerminalChannel_2, remoteFileSystemProviderClient_1, extensionHostStatusService_1, extensionsScannerService_1, extensionsScannerService_2, extensionsProfileScannerService_1, userDataProfile_1, policy_1, _1dsAppender_1, loggerService_1, userDataProfile_2, extensionsProfileScannerService_2, logService_1, logIpc_1, nls_1, remoteExtensionsScanner_1, remoteExtensionsScanner_2, userDataProfileIpc_1, nodePtyHostStarter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SocketServer = void 0;
    exports.setupServerServices = setupServerServices;
    const eventPrefix = 'monacoworkbench';
    async function setupServerServices(connectionToken, args, REMOTE_DATA_FOLDER, disposables) {
        const services = new serviceCollection_1.ServiceCollection();
        const socketServer = new SocketServer();
        const productService = { _serviceBrand: undefined, ...product_1.default };
        services.set(productService_1.IProductService, productService);
        const environmentService = new serverEnvironmentService_1.ServerEnvironmentService(args, productService);
        services.set(environment_1.IEnvironmentService, environmentService);
        services.set(environment_1.INativeEnvironmentService, environmentService);
        const loggerService = new loggerService_1.LoggerService((0, log_1.getLogLevel)(environmentService), environmentService.logsHome);
        services.set(log_1.ILoggerService, loggerService);
        socketServer.registerChannel('logger', new logIpc_1.LoggerChannel(loggerService, (ctx) => getUriTransformer(ctx.remoteAuthority)));
        const logger = loggerService.createLogger('remoteagent', { name: (0, nls_1.localize)('remoteExtensionLog', "Server") });
        const logService = new logService_1.LogService(logger, [new ServerLogger((0, log_1.getLogLevel)(environmentService))]);
        services.set(log_1.ILogService, logService);
        setTimeout(() => cleanupOlderLogs(environmentService.logsHome.with({ scheme: network_1.Schemas.file }).fsPath).then(null, err => logService.error(err)), 10000);
        logService.onDidChangeLogLevel(logLevel => (0, log_1.log)(logService, logLevel, `Log level changed to ${(0, log_1.LogLevelToString)(logService.getLevel())}`));
        logService.trace(`Remote configuration data at ${REMOTE_DATA_FOLDER}`);
        logService.trace('process arguments:', environmentService.args);
        if (Array.isArray(productService.serverGreeting)) {
            logService.info(`\n\n${productService.serverGreeting.join('\n')}\n\n`);
        }
        // ExtensionHost Debug broadcast service
        socketServer.registerChannel(extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName, new extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel());
        // TODO: @Sandy @Joao need dynamic context based router
        const router = new ipc_1.StaticRouter(ctx => ctx.clientId === 'renderer');
        // Files
        const fileService = disposables.add(new fileService_1.FileService(logService));
        services.set(files_1.IFileService, fileService);
        fileService.registerProvider(network_1.Schemas.file, disposables.add(new diskFileSystemProvider_1.DiskFileSystemProvider(logService)));
        // URI Identity
        const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
        services.set(uriIdentity_1.IUriIdentityService, uriIdentityService);
        // Configuration
        const configurationService = new configurationService_1.ConfigurationService(environmentService.machineSettingsResource, fileService, new policy_1.NullPolicyService(), logService);
        services.set(configuration_1.IConfigurationService, configurationService);
        // User Data Profiles
        const userDataProfilesService = new userDataProfile_2.ServerUserDataProfilesService(uriIdentityService, environmentService, fileService, logService);
        services.set(userDataProfile_1.IUserDataProfilesService, userDataProfilesService);
        socketServer.registerChannel('userDataProfiles', new userDataProfileIpc_1.RemoteUserDataProfilesServiceChannel(userDataProfilesService, (ctx) => getUriTransformer(ctx.remoteAuthority)));
        // Initialize
        const [, , machineId, sqmId] = await Promise.all([
            configurationService.initialize(),
            userDataProfilesService.init(),
            (0, id_1.getMachineId)(logService.error.bind(logService)),
            (0, id_1.getSqmMachineId)(logService.error.bind(logService))
        ]);
        const extensionHostStatusService = new extensionHostStatusService_1.ExtensionHostStatusService();
        services.set(extensionHostStatusService_1.IExtensionHostStatusService, extensionHostStatusService);
        // Request
        const requestService = new requestService_1.RequestService(configurationService, environmentService, logService, loggerService);
        services.set(request_1.IRequestService, requestService);
        let oneDsAppender = telemetryUtils_1.NullAppender;
        const isInternal = (0, telemetryUtils_1.isInternalTelemetry)(productService, configurationService);
        if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService)) {
            if (!(0, telemetryUtils_1.isLoggingOnly)(productService, environmentService) && productService.aiConfig?.ariaKey) {
                oneDsAppender = new _1dsAppender_1.OneDataSystemAppender(requestService, isInternal, eventPrefix, null, productService.aiConfig.ariaKey);
                disposables.add((0, lifecycle_1.toDisposable)(() => oneDsAppender?.flush())); // Ensure the AI appender is disposed so that it flushes remaining data
            }
            const config = {
                appenders: [oneDsAppender],
                commonProperties: (0, commonProperties_1.resolveCommonProperties)((0, os_1.release)(), (0, os_1.hostname)(), process.arch, productService.commit, productService.version + '-remote', machineId, sqmId, isInternal, 'remoteAgent'),
                piiPaths: (0, telemetryUtils_1.getPiiPathsFromEnvironment)(environmentService)
            };
            const initialTelemetryLevelArg = environmentService.args['telemetry-level'];
            let injectedTelemetryLevel = 3 /* TelemetryLevel.USAGE */;
            // Convert the passed in CLI argument into a telemetry level for the telemetry service
            if (initialTelemetryLevelArg === 'all') {
                injectedTelemetryLevel = 3 /* TelemetryLevel.USAGE */;
            }
            else if (initialTelemetryLevelArg === 'error') {
                injectedTelemetryLevel = 2 /* TelemetryLevel.ERROR */;
            }
            else if (initialTelemetryLevelArg === 'crash') {
                injectedTelemetryLevel = 1 /* TelemetryLevel.CRASH */;
            }
            else if (initialTelemetryLevelArg !== undefined) {
                injectedTelemetryLevel = 0 /* TelemetryLevel.NONE */;
            }
            services.set(serverTelemetryService_1.IServerTelemetryService, new descriptors_1.SyncDescriptor(serverTelemetryService_1.ServerTelemetryService, [config, injectedTelemetryLevel]));
        }
        else {
            services.set(serverTelemetryService_1.IServerTelemetryService, serverTelemetryService_1.ServerNullTelemetryService);
        }
        services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryServiceWithNoStorageService));
        const downloadChannel = socketServer.getChannel('download', router);
        services.set(download_1.IDownloadService, new downloadIpc_1.DownloadServiceChannelClient(downloadChannel, () => getUriTransformer('renderer') /* TODO: @Sandy @Joao need dynamic context based router */));
        services.set(extensionsProfileScannerService_1.IExtensionsProfileScannerService, new descriptors_1.SyncDescriptor(extensionsProfileScannerService_2.ExtensionsProfileScannerService));
        services.set(extensionsScannerService_1.IExtensionsScannerService, new descriptors_1.SyncDescriptor(extensionsScannerService_2.ExtensionsScannerService));
        services.set(extensionSignatureVerificationService_1.IExtensionSignatureVerificationService, new descriptors_1.SyncDescriptor(extensionSignatureVerificationService_1.ExtensionSignatureVerificationService));
        services.set(extensionManagementService_1.INativeServerExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService));
        const instantiationService = new instantiationService_1.InstantiationService(services);
        services.set(languagePacks_1.ILanguagePackService, instantiationService.createInstance(languagePacks_2.NativeLanguagePackService));
        const ptyHostStarter = instantiationService.createInstance(nodePtyHostStarter_1.NodePtyHostStarter, {
            graceTime: 10800000 /* ProtocolConstants.ReconnectionGraceTime */,
            shortGraceTime: 300000 /* ProtocolConstants.ReconnectionShortGraceTime */,
            scrollback: configurationService.getValue("terminal.integrated.persistentSessionScrollback" /* TerminalSettingId.PersistentSessionScrollback */) ?? 100
        });
        const ptyHostService = instantiationService.createInstance(ptyHostService_1.PtyHostService, ptyHostStarter);
        services.set(terminal_1.IPtyService, ptyHostService);
        instantiationService.invokeFunction(accessor => {
            const extensionManagementService = accessor.get(extensionManagementService_1.INativeServerExtensionManagementService);
            const extensionsScannerService = accessor.get(extensionsScannerService_1.IExtensionsScannerService);
            const extensionGalleryService = accessor.get(extensionManagement_1.IExtensionGalleryService);
            const languagePackService = accessor.get(languagePacks_1.ILanguagePackService);
            const remoteExtensionEnvironmentChannel = new remoteAgentEnvironmentImpl_1.RemoteAgentEnvironmentChannel(connectionToken, environmentService, userDataProfilesService, extensionHostStatusService);
            socketServer.registerChannel('remoteextensionsenvironment', remoteExtensionEnvironmentChannel);
            const telemetryChannel = new remoteTelemetryChannel_1.ServerTelemetryChannel(accessor.get(serverTelemetryService_1.IServerTelemetryService), oneDsAppender);
            socketServer.registerChannel('telemetry', telemetryChannel);
            socketServer.registerChannel(remoteTerminalChannel_2.REMOTE_TERMINAL_CHANNEL_NAME, new remoteTerminalChannel_1.RemoteTerminalChannel(environmentService, logService, ptyHostService, productService, extensionManagementService, configurationService));
            const remoteExtensionsScanner = new remoteExtensionsScanner_1.RemoteExtensionsScannerService(instantiationService.createInstance(extensionManagementCLI_1.ExtensionManagementCLI, logService), environmentService, userDataProfilesService, extensionsScannerService, logService, extensionGalleryService, languagePackService);
            socketServer.registerChannel(remoteExtensionsScanner_2.RemoteExtensionsScannerChannelName, new remoteExtensionsScanner_1.RemoteExtensionsScannerChannel(remoteExtensionsScanner, (ctx) => getUriTransformer(ctx.remoteAuthority)));
            const remoteFileSystemChannel = new remoteFileSystemProviderServer_1.RemoteAgentFileSystemProviderChannel(logService, environmentService);
            socketServer.registerChannel(remoteFileSystemProviderClient_1.REMOTE_FILE_SYSTEM_CHANNEL_NAME, remoteFileSystemChannel);
            socketServer.registerChannel('request', new requestIpc_1.RequestChannel(accessor.get(request_1.IRequestService)));
            const channel = new extensionManagementIpc_1.ExtensionManagementChannel(extensionManagementService, (ctx) => getUriTransformer(ctx.remoteAuthority));
            socketServer.registerChannel('extensions', channel);
            // clean up extensions folder
            remoteExtensionsScanner.whenExtensionsReady().then(() => extensionManagementService.cleanUp());
            disposables.add(new errorTelemetry_1.default(accessor.get(telemetry_1.ITelemetryService)));
            return {
                telemetryService: accessor.get(telemetry_1.ITelemetryService)
            };
        });
        return { socketServer, instantiationService };
    }
    const _uriTransformerCache = Object.create(null);
    function getUriTransformer(remoteAuthority) {
        if (!_uriTransformerCache[remoteAuthority]) {
            _uriTransformerCache[remoteAuthority] = (0, uriTransformer_1.createURITransformer)(remoteAuthority);
        }
        return _uriTransformerCache[remoteAuthority];
    }
    class SocketServer extends ipc_1.IPCServer {
        constructor() {
            const emitter = new event_1.Emitter();
            super(emitter.event);
            this._onDidConnectEmitter = emitter;
        }
        acceptConnection(protocol, onDidClientDisconnect) {
            this._onDidConnectEmitter.fire({ protocol, onDidClientDisconnect });
        }
    }
    exports.SocketServer = SocketServer;
    class ServerLogger extends log_1.AbstractLogger {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super();
            this.setLevel(logLevel);
            this.useColors = Boolean(process.stdout.isTTY);
        }
        trace(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Trace)) {
                if (this.useColors) {
                    console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[${now()}]`, message, ...args);
                }
            }
        }
        debug(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Debug)) {
                if (this.useColors) {
                    console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[${now()}]`, message, ...args);
                }
            }
        }
        info(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Info)) {
                if (this.useColors) {
                    console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[${now()}]`, message, ...args);
                }
            }
        }
        warn(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Warning)) {
                if (this.useColors) {
                    console.warn(`\x1b[93m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.warn(`[${now()}]`, message, ...args);
                }
            }
        }
        error(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Error)) {
                if (this.useColors) {
                    console.error(`\x1b[91m[${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.error(`[${now()}]`, message, ...args);
                }
            }
        }
        flush() {
            // noop
        }
    }
    function now() {
        const date = new Date();
        return `${twodigits(date.getHours())}:${twodigits(date.getMinutes())}:${twodigits(date.getSeconds())}`;
    }
    function twodigits(n) {
        if (n < 10) {
            return `0${n}`;
        }
        return String(n);
    }
    /**
     * Cleans up older logs, while keeping the 10 most recent ones.
     */
    async function cleanupOlderLogs(logsPath) {
        const currentLog = path.basename(logsPath);
        const logsRoot = path.dirname(logsPath);
        const children = await pfs_1.Promises.readdir(logsRoot);
        const allSessions = children.filter(name => /^\d{8}T\d{6}$/.test(name));
        const oldSessions = allSessions.sort().filter((d) => d !== currentLog);
        const toDelete = oldSessions.slice(0, Math.max(0, oldSessions.length - 9));
        await Promise.all(toDelete.map(name => pfs_1.Promises.rm(path.join(logsRoot, name))));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyU2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS9zZXJ2ZXJTZXJ2aWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErRWhHLGtEQTJKQztJQTdKRCxNQUFNLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQztJQUUvQixLQUFLLFVBQVUsbUJBQW1CLENBQUMsZUFBc0MsRUFBRSxJQUFzQixFQUFFLGtCQUEwQixFQUFFLFdBQTRCO1FBQ2pLLE1BQU0sUUFBUSxHQUFHLElBQUkscUNBQWlCLEVBQUUsQ0FBQztRQUN6QyxNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksRUFBZ0MsQ0FBQztRQUV0RSxNQUFNLGNBQWMsR0FBb0IsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLEdBQUcsaUJBQU8sRUFBRSxDQUFDO1FBQ2pGLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0NBQWUsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUU5QyxNQUFNLGtCQUFrQixHQUFHLElBQUksbURBQXdCLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQzlFLFFBQVEsQ0FBQyxHQUFHLENBQUMsaUNBQW1CLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUN0RCxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUF5QixFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFFNUQsTUFBTSxhQUFhLEdBQUcsSUFBSSw2QkFBYSxDQUFDLElBQUEsaUJBQVcsRUFBQyxrQkFBa0IsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0JBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUM1QyxZQUFZLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxJQUFJLHNCQUFhLENBQUMs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