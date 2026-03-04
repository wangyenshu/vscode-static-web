/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "fs", "vs/base/common/uri", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/extpath", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/network", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/strings", "vs/base/node/pfs", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.net", "vs/code/electron-main/app", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/diagnostics/node/diagnosticsService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/environment/node/argvHelper", "vs/platform/environment/node/wait", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/bufferLog", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/protocol/electron-main/protocol", "vs/platform/protocol/electron-main/protocolMainService", "vs/platform/tunnel/common/tunnel", "vs/platform/tunnel/node/tunnelService", "vs/platform/request/common/request", "vs/platform/request/electron-main/requestMainService", "vs/platform/sign/common/sign", "vs/platform/sign/node/signService", "vs/platform/state/node/state", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/theme/electron-main/themeMainService", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/policy/common/policy", "vs/platform/policy/node/nativePolicyService", "vs/platform/policy/common/filePolicyService", "vs/base/common/lifecycle", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/log/electron-main/loggerService", "vs/platform/log/common/logService", "vs/platform/dialogs/common/dialogs", "vs/platform/state/node/stateService", "vs/platform/userData/common/fileUserDataProvider", "vs/base/node/unc", "vs/platform/update/common/update.config.contribution"], function (require, exports, electron_1, fs_1, uri_1, arrays_1, async_1, errorMessage_1, errors_1, extpath_1, event_1, labels_1, network_1, path_1, performance_1, platform_1, process_1, strings_1, pfs_1, ipc_1, ipc_net_1, app_1, nls_1, configuration_1, configurationService_1, diagnosticsService_1, environmentMainService_1, argvHelper_1, wait_1, files_1, fileService_1, diskFileSystemProvider_1, descriptors_1, instantiationService_1, serviceCollection_1, lifecycleMainService_1, bufferLog_1, log_1, product_1, productService_1, protocol_1, protocolMainService_1, tunnel_1, tunnelService_1, request_1, requestMainService_1, sign_1, signService_1, state_1, telemetryUtils_1, themeMainService_1, userDataProfile_1, policy_1, nativePolicyService_1, filePolicyService_1, lifecycle_1, uriIdentity_1, uriIdentityService_1, loggerService_1, logService_1, dialogs_1, stateService_1, fileUserDataProvider_1, unc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The main VS Code entry point.
     *
     * Note: This class can exist more than once for example when VS Code is already
     * running and a second instance is started from the command line. It will always
     * try to communicate with an existing instance to prevent that 2 VS Code instances
     * are running at the same time.
     */
    class CodeMain {
        main() {
            try {
                this.startup();
            }
            catch (error) {
                console.error(error.message);
                electron_1.app.exit(1);
            }
        }
        async startup() {
            // Set the error handler early enough so that we are not getting the
            // default electron error dialog popping up
            (0, errors_1.setUnexpectedErrorHandler)(err => console.error(err));
            // Create services
            const [instantiationService, instanceEnvironment, environmentMainService, configurationService, stateMainService, bufferLogService, productService, userDataProfilesMainService] = this.createServices();
            try {
                // Init services
                try {
                    await this.initServices(environmentMainService, userDataProfilesMainService, configurationService, stateMainService, productService);
                }
                catch (error) {
                    // Show a dialog for errors that can be resolved by the user
                    this.handleStartupDataDirError(environmentMainService, productService, error);
                    throw error;
                }
                // Startup
                await instantiationService.invokeFunction(async (accessor) => {
                    const logService = accessor.get(log_1.ILogService);
                    const lifecycleMainService = accessor.get(lifecycleMainService_1.ILifecycleMainService);
                    const fileService = accessor.get(files_1.IFileService);
                    const loggerService = accessor.get(log_1.ILoggerService);
                    // Create the main IPC server by trying to be the server
                    // If this throws an error it means we are not the first
                    // instance of VS Code running and so we would quit.
                    const mainProcessNodeIpcServer = await this.claimInstance(logService, environmentMainService, lifecycleMainService, instantiationService, productService, true);
                    // Write a lockfile to indicate an instance is running
                    // (https://github.com/microsoft/vscode/issues/127861#issuecomment-877417451)
                    pfs_1.Promises.writeFile(environmentMainService.mainLockfile, String(process.pid)).catch(err => {
                        logService.warn(`app#startup(): Error writing main lockfile: ${err.stack}`);
                    });
                    // Delay creation of spdlog for perf reasons (https://github.com/microsoft/vscode/issues/72906)
                    bufferLogService.logger = loggerService.createLogger('main', { name: (0, nls_1.localize)('mainLog', "Main") });
                    // Lifecycle
                    event_1.Event.once(lifecycleMainService.onWillShutdown)(evt => {
                        fileService.dispose();
                        configurationService.dispose();
                        evt.join('instanceLockfile', pfs_1.Promises.unlink(environmentMainService.mainLockfile).catch(() => { }));
                    });
                    return instantiationService.createInstance(app_1.CodeApplication, mainProcessNodeIpcServer, instanceEnvironment).startup();
                });
            }
            catch (error) {
                instantiationService.invokeFunction(this.quit, error);
            }
        }
        createServices() {
            const services = new serviceCollection_1.ServiceCollection();
            const disposables = new lifecycle_1.DisposableStore();
            process.once('exit', () => disposables.dispose());
            // Product
            const productService = { _serviceBrand: undefined, ...product_1.default };
            services.set(productService_1.IProductService, productService);
            // Environment
            const environmentMainService = new environmentMainService_1.EnvironmentMainService(this.resolveArgs(), productService);
            const instanceEnvironment = this.patchEnvironment(environmentMainService); // Patch `process.env` with the instance's environment
            services.set(environmentMainService_1.IEnvironmentMainService, environmentMainService);
            // Logger
            const loggerService = new loggerService_1.LoggerMainService((0, log_1.getLogLevel)(environmentMainService), environmentMainService.logsHome);
            services.set(loggerService_1.ILoggerMainService, loggerService);
            // Log: We need to buffer the spdlog logs until we are sure
            // we are the only instance running, otherwise we'll have concurrent
            // log file access on Windows (https://github.com/microsoft/vscode/issues/41218)
            const bufferLogger = new bufferLog_1.BufferLogger(loggerService.getLogLevel());
            const logService = disposables.add(new logService_1.LogService(bufferLogger, [new log_1.ConsoleMainLogger(loggerService.getLogLevel())]));
            services.set(log_1.ILogService, logService);
            // Files
            const fileService = new fileService_1.FileService(logService);
            services.set(files_1.IFileService, fileService);
            const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            // URI Identity
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            services.set(uriIdentity_1.IUriIdentityService, uriIdentityService);
            // State
            const stateService = new stateService_1.StateService(1 /* SaveStrategy.DELAYED */, environmentMainService, logService, fileService);
            services.set(state_1.IStateReadService, stateService);
            services.set(state_1.IStateService, stateService);
            // User Data Profiles
            const userDataProfilesMainService = new userDataProfile_1.UserDataProfilesMainService(stateService, uriIdentityService, environmentMainService, fileService, logService);
            services.set(userDataProfile_1.IUserDataProfilesMainService, userDataProfilesMainService);
            // Use FileUserDataProvider for user data to
            // enable atomic read / write operations.
            fileService.registerProvider(network_1.Schemas.vscodeUserData, new fileUserDataProvider_1.FileUserDataProvider(network_1.Schemas.file, diskFileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesMainService, uriIdentityService, logService));
            // Policy
            const policyService = platform_1.isWindows && productService.win32RegValueName ? disposables.add(new nativePolicyService_1.NativePolicyService(logService, productService.win32RegValueName))
                : environmentMainService.policyFile ? disposables.add(new filePolicyService_1.FilePolicyService(environmentMainService.policyFile, fileService, logService))
                    : new policy_1.NullPolicyService();
            services.set(policy_1.IPolicyService, policyService);
            // Configuration
            const configurationService = new configurationService_1.ConfigurationService(userDataProfilesMainService.defaultProfile.settingsResource, fileService, policyService, logService);
            services.set(configuration_1.IConfigurationService, configurationService);
            // Lifecycle
            services.set(lifecycleMainService_1.ILifecycleMainService, new descriptors_1.SyncDescriptor(lifecycleMainService_1.LifecycleMainService, undefined, false));
            // Request
            services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestMainService_1.RequestMainService, undefined, true));
            // Themes
            services.set(themeMainService_1.IThemeMainService, new descriptors_1.SyncDescriptor(themeMainService_1.ThemeMainService));
            // Signing
            services.set(sign_1.ISignService, new descriptors_1.SyncDescriptor(signService_1.SignService, undefined, false /* proxied to other processes */));
            // Tunnel
            services.set(tunnel_1.ITunnelService, new descriptors_1.SyncDescriptor(tunnelService_1.TunnelService));
            // Protocol (instantiated early and not using sync descriptor for security reasons)
            services.set(protocol_1.IProtocolMainService, new protocolMainService_1.ProtocolMainService(environmentMainService, userDataProfilesMainService, logService));
            return [new instantiationService_1.InstantiationService(services, true), instanceEnvironment, environmentMainService, configurationService, stateService, bufferLogger, productService, userDataProfilesMainService];
        }
        patchEnvironment(environmentMainService) {
            const instanceEnvironment = {
                VSCODE_IPC_HOOK: environmentMainService.mainIPCHandle
            };
            ['VSCODE_NLS_CONFIG', 'VSCODE_PORTABLE'].forEach(key => {
                const value = process.env[key];
                if (typeof value === 'string') {
                    instanceEnvironment[key] = value;
                }
            });
            Object.assign(process.env, instanceEnvironment);
            return instanceEnvironment;
        }
        async initServices(environmentMainService, userDataProfilesMainService, configurationService, stateService, productService) {
            await async_1.Promises.settled([
                // Environment service (paths)
                Promise.all([
                    this.allowWindowsUNCPath(environmentMainService.extensionsPath), // enable extension paths on UNC drives...
                    environmentMainService.codeCachePath, // ...other user-data-derived paths should already be enlisted from `main.js`
                    environmentMainService.logsHome.with({ scheme: network_1.Schemas.file }).fsPath,
                    userDataProfilesMainService.defaultProfile.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath,
                    environmentMainService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath,
                    environmentMainService.localHistoryHome.with({ scheme: network_1.Schemas.file }).fsPath,
                    environmentMainService.backupHome
                ].map(path => path ? pfs_1.Promises.mkdir(path, { recursive: true }) : undefined)),
                // State service
                stateService.init(),
                // Configuration service
                configurationService.initialize()
            ]);
            // Initialize user data profiles after initializing the state
            userDataProfilesMainService.init();
        }
        allowWindowsUNCPath(path) {
            if (platform_1.isWindows) {
                const host = (0, unc_1.getUNCHost)(path);
                if (host) {
                    (0, unc_1.addUNCHostToAllowlist)(host);
                }
            }
            return path;
        }
        async claimInstance(logService, environmentMainService, lifecycleMainService, instantiationService, productService, retry) {
            // Try to setup a server for running. If that succeeds it means
            // we are the first instance to startup. Otherwise it is likely
            // that another instance is already running.
            let mainProcessNodeIpcServer;
            try {
                (0, performance_1.mark)('code/willStartMainServer');
                mainProcessNodeIpcServer = await (0, ipc_net_1.serve)(environmentMainService.mainIPCHandle);
                (0, performance_1.mark)('code/didStartMainServer');
                event_1.Event.once(lifecycleMainService.onWillShutdown)(() => mainProcessNodeIpcServer.dispose());
            }
            catch (error) {
                // Handle unexpected errors (the only expected error is EADDRINUSE that
                // indicates another instance of VS Code is running)
                if (error.code !== 'EADDRINUSE') {
                    // Show a dialog for errors that can be resolved by the user
                    this.handleStartupDataDirError(environmentMainService, productService, error);
                    // Any other runtime error is just printed to the console
                    throw error;
                }
                // there's a running instance, let's connect to it
                let client;
                try {
                    client = await (0, ipc_net_1.connect)(environmentMainService.mainIPCHandle, 'main');
                }
                catch (error) {
                    // Handle unexpected connection errors by showing a dialog to the user
                    if (!retry || platform_1.isWindows || error.code !== 'ECONNREFUSED') {
                        if (error.code === 'EPERM') {
                            this.showStartupWarningDialog((0, nls_1.localize)('secondInstanceAdmin', "Another instance of {0} is already running as administrator.", productService.nameShort), (0, nls_1.localize)('secondInstanceAdminDetail', "Please close the other instance and try again."), productService);
                        }
                        throw error;
                    }
                    // it happens on Linux and OS X that the pipe is left behind
                    // let's delete it, since we can't connect to it and then
                    // retry the whole thing
                    try {
                        (0, fs_1.unlinkSync)(environmentMainService.mainIPCHandle);
                    }
                    catch (error) {
                        logService.warn('Could not delete obsolete instance handle', error);
                        throw error;
                    }
                    return this.claimInstance(logService, environmentMainService, lifecycleMainService, instantiationService, productService, false);
                }
                // Tests from CLI require to be the only instance currently
                if (environmentMainService.extensionTestsLocationURI && !environmentMainService.debugExtensionHost.break) {
                    const msg = `Running extension tests from the command line is currently only supported if no other instance of ${productService.nameShort} is running.`;
                    logService.error(msg);
                    client.dispose();
                    throw new Error(msg);
                }
                // Show a warning dialog after some timeout if it takes long to talk to the other instance
                // Skip this if we are running with --wait where it is expected that we wait for a while.
                // Also skip when gathering diagnostics (--status) which can take a longer time.
                let startupWarningDialogHandle = undefined;
                if (!environmentMainService.args.wait && !environmentMainService.args.status) {
                    startupWarningDialogHandle = setTimeout(() => {
                        this.showStartupWarningDialog((0, nls_1.localize)('secondInstanceNoResponse', "Another instance of {0} is running but not responding", productService.nameShort), (0, nls_1.localize)('secondInstanceNoResponseDetail', "Please close all other instances and try again."), productService);
                    }, 10000);
                }
                const otherInstanceLaunchMainService = ipc_1.ProxyChannel.toService(client.getChannel('launch'), { disableMarshalling: true });
                const otherInstanceDiagnosticsMainService = ipc_1.ProxyChannel.toService(client.getChannel('diagnostics'), { disableMarshalling: true });
                // Process Info
                if (environmentMainService.args.status) {
                    return instantiationService.invokeFunction(async () => {
                        const diagnosticsService = new diagnosticsService_1.DiagnosticsService(telemetryUtils_1.NullTelemetryService, productService);
                        const mainDiagnostics = await otherInstanceDiagnosticsMainService.getMainDiagnostics();
                        const remoteDiagnostics = await otherInstanceDiagnosticsMainService.getRemoteDiagnostics({ includeProcesses: true, includeWorkspaceMetadata: true });
                        const diagnostics = await diagnosticsService.getDiagnostics(mainDiagnostics, remoteDiagnostics);
                        console.log(diagnostics);
                        throw new errors_1.ExpectedError();
                    });
                }
                // Windows: allow to set foreground
                if (platform_1.isWindows) {
                    await this.windowsAllowSetForegroundWindow(otherInstanceLaunchMainService, logService);
                }
                // Send environment over...
                logService.trace('Sending env to running instance...');
                await otherInstanceLaunchMainService.start(environmentMainService.args, process.env);
                // Cleanup
                client.dispose();
                // Now that we started, make sure the warning dialog is prevented
                if (startupWarningDialogHandle) {
                    clearTimeout(startupWarningDialogHandle);
                }
                throw new errors_1.ExpectedError('Sent env to running instance. Terminating...');
            }
            // Print --status usage info
            if (environmentMainService.args.status) {
                console.log((0, nls_1.localize)('statusWarning', "Warning: The --status argument can only be used if {0} is already running. Please run it again after {0} has started.", productService.nameShort));
                throw new errors_1.ExpectedError('Terminating...');
            }
            // Set the VSCODE_PID variable here when we are sure we are the first
            // instance to startup. Otherwise we would wrongly overwrite the PID
            process.env['VSCODE_PID'] = String(process.pid);
            return mainProcessNodeIpcServer;
        }
        handleStartupDataDirError(environmentMainService, productService, error) {
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                const directories = (0, arrays_1.coalesce)([environmentMainService.userDataPath, environmentMainService.extensionsPath, ipc_net_1.XDG_RUNTIME_DIR]).map(folder => (0, labels_1.getPathLabel)(uri_1.URI.file(folder), { os: platform_1.OS, tildify: environmentMainService }));
                this.showStartupWarningDialog((0, nls_1.localize)('startupDataDirError', "Unable to write program user data."), (0, nls_1.localize)('startupUserDataAndExtensionsDirErrorDetail', "{0}\n\nPlease make sure the following directories are writeable:\n\n{1}", (0, errorMessage_1.toErrorMessage)(error), directories.join('\n')), productService);
            }
        }
        showStartupWarningDialog(message, detail, productService) {
            // use sync variant here because we likely exit after this method
            // due to startup issues and otherwise the dialog seems to disappear
            // https://github.com/microsoft/vscode/issues/104493
            electron_1.dialog.showMessageBoxSync((0, dialogs_1.massageMessageBoxOptions)({
                type: 'warning',
                buttons: [(0, nls_1.localize)({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close")],
                message,
                detail
            }, productService).options);
        }
        async windowsAllowSetForegroundWindow(launchMainService, logService) {
            if (platform_1.isWindows) {
                const processId = await launchMainService.getMainProcessId();
                logService.trace('Sending some foreground love to the running instance:', processId);
                try {
                    (await new Promise((resolve_1, reject_1) => { require(['windows-foreground-love'], resolve_1, reject_1); })).allowSetForegroundWindow(processId);
                }
                catch (error) {
                    logService.error(error);
                }
            }
        }
        quit(accessor, reason) {
            const logService = accessor.get(log_1.ILogService);
            const lifecycleMainService = accessor.get(lifecycleMainService_1.ILifecycleMainService);
            let exitCode = 0;
            if (reason) {
                if (reason.isExpected) {
                    if (reason.message) {
                        logService.trace(reason.message);
                    }
                }
                else {
                    exitCode = 1; // signal error to the outside
                    if (reason.stack) {
                        logService.error(reason.stack);
                    }
                    else {
                        logService.error(`Startup error: ${reason.toString()}`);
                    }
                }
            }
            lifecycleMainService.kill(exitCode);
        }
        //#region Command line arguments utilities
        resolveArgs() {
            // Parse arguments
            const args = this.validatePaths((0, argvHelper_1.parseMainProcessArgv)(process.argv));
            // If we are started with --wait create a random temporary file
            // and pass it over to the starting instance. We can use this file
            // to wait for it to be deleted to monitor that the edited file
            // is closed and then exit the waiting process.
            //
            // Note: we are not doing this if the wait marker has been already
            // added as argument. This can happen if VS Code was started from CLI.
            if (args.wait && !args.waitMarkerFilePath) {
                const waitMarkerFilePath = (0, wait_1.createWaitMarkerFileSync)(args.verbose);
                if (waitMarkerFilePath) {
                    (0, argvHelper_1.addArg)(process.argv, '--waitMarkerFilePath', waitMarkerFilePath);
                    args.waitMarkerFilePath = waitMarkerFilePath;
                }
            }
            return args;
        }
        validatePaths(args) {
            // Track URLs if they're going to be used
            if (args['open-url']) {
                args._urls = args._;
                args._ = [];
            }
            // Normalize paths and watch out for goto line mode
            if (!args['remote']) {
                const paths = this.doValidatePaths(args._, args.goto);
                args._ = paths;
            }
            return args;
        }
        doValidatePaths(args, gotoLineMode) {
            const currentWorkingDir = (0, process_1.cwd)();
            const result = args.map(arg => {
                let pathCandidate = String(arg);
                let parsedPath = undefined;
                if (gotoLineMode) {
                    parsedPath = (0, extpath_1.parseLineAndColumnAware)(pathCandidate);
                    pathCandidate = parsedPath.path;
                }
                if (pathCandidate) {
                    pathCandidate = this.preparePath(currentWorkingDir, pathCandidate);
                }
                const sanitizedFilePath = (0, extpath_1.sanitizeFilePath)(pathCandidate, currentWorkingDir);
                const filePathBasename = (0, path_1.basename)(sanitizedFilePath);
                if (filePathBasename /* can be empty if code is opened on root */ && !(0, extpath_1.isValidBasename)(filePathBasename)) {
                    return null; // do not allow invalid file names
                }
                if (gotoLineMode && parsedPath) {
                    parsedPath.path = sanitizedFilePath;
                    return this.toPath(parsedPath);
                }
                return sanitizedFilePath;
            });
            const caseInsensitive = platform_1.isWindows || platform_1.isMacintosh;
            const distinctPaths = (0, arrays_1.distinct)(result, path => path && caseInsensitive ? path.toLowerCase() : (path || ''));
            return (0, arrays_1.coalesce)(distinctPaths);
        }
        preparePath(cwd, path) {
            // Trim trailing quotes
            if (platform_1.isWindows) {
                path = (0, strings_1.rtrim)(path, '"'); // https://github.com/microsoft/vscode/issues/1498
            }
            // Trim whitespaces
            path = (0, strings_1.trim)((0, strings_1.trim)(path, ' '), '\t');
            if (platform_1.isWindows) {
                // Resolve the path against cwd if it is relative
                path = (0, path_1.resolve)(cwd, path);
                // Trim trailing '.' chars on Windows to prevent invalid file names
                path = (0, strings_1.rtrim)(path, '.');
            }
            return path;
        }
        toPath(pathWithLineAndCol) {
            const segments = [pathWithLineAndCol.path];
            if (typeof pathWithLineAndCol.line === 'number') {
                segments.push(String(pathWithLineAndCol.line));
            }
            if (typeof pathWithLineAndCol.column === 'number') {
                segments.push(String(pathWithLineAndCol.column));
            }
            return segments.join(':');
        }
    }
    // Main Startup
    const code = new CodeMain();
    code.main();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2NvZGUvZWxlY3Ryb24tbWFpbi9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBd0VoRzs7Ozs7OztPQU9HO0lBQ0gsTUFBTSxRQUFRO1FBRWIsSUFBSTtZQUNILElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM3QixjQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsT0FBTztZQUVwQixvRUFBb0U7WUFDcEUsMkNBQTJDO1lBQzNDLElBQUEsa0NBQXlCLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFckQsa0JBQWtCO1lBQ2xCLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBRSxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsMkJBQTJCLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFFek0sSUFBSSxDQUFDO2dCQUVKLGdCQUFnQjtnQkFDaEIsSUFBSSxDQUFDO29CQUNKLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsRUFBRSwyQkFBMkIsRUFBRSxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDdEksQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUVoQiw0REFBNEQ7b0JBQzVELElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxzQkFBc0IsRUFBRSxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBRTlFLE1BQU0sS0FBSyxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsVUFBVTtnQkFDVixNQUFNLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUMsUUFBUSxFQUFDLEVBQUU7b0JBQzFELE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsaUJBQVcsQ0FBQyxDQUFDO29CQUM3QyxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNENBQXFCLENBQUMsQ0FBQztvQkFDakUsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUM7b0JBQy9DLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0JBQWMsQ0FBQyxDQUFDO29CQUVuRCx3REFBd0Q7b0JBQ3hELHdEQUF3RDtvQkFDeEQsb0RBQW9EO29CQUNwRCxNQUFNLHdCQUF3QixHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsc0JBQXNCLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUVoSyxzREFBc0Q7b0JBQ3RELDZFQUE2RTtvQkFDN0UsY0FBVSxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDMUYsVUFBVSxDQUFDLElBQUksQ0FBQywrQ0FBK0MsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7b0JBQzdFLENBQUMsQ0FBQyxDQUFDO29CQUVILCtGQUErRjtvQkFDL0YsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBRXBHLFlBQVk7b0JBQ1osYUFBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDckQsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUN0QixvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDL0IsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxjQUFVLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLFlBQVksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckgsQ0FBQyxDQUFDLENBQUM7b0JBRUgsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMscUJBQWUsRUFBRSx3QkFBd0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN0SCxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixvQkFBb0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2RCxDQUFDO1FBQ0YsQ0FBQztRQUVPLGNBQWM7WUFDckIsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBRWxELFVBQVU7WUFDVixNQUFNLGNBQWMsR0FBRyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsR0FBRyxpQkFBTyxFQUFFLENBQUM7WUFDaEUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQ0FBZSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRTlDLGNBQWM7WUFDZCxNQUFNLHNCQUFzQixHQUFHLElBQUksK0NBQXNCLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzlGLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxzREFBc0Q7WUFDakksUUFBUSxDQUFDLEdBQUcsQ0FBQyxnREFBdUIsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1lBRTlELFNBQVM7WUFDVCxNQUFNLGFBQWEsR0FBRyxJQUFJLGlDQUFpQixDQUFDLElBQUEsaUJBQVcsRUFBQyxzQkFBc0IsQ0FBQyxFQUFFLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xILFFBQVEsQ0FBQyxHQUFHLENBQUMsa0NBQWtCLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFaEQsMkRBQTJEO1lBQzNELG9FQUFvRTtZQUNwRSxnRkFBZ0Y7WUFDaEYsTUFBTSxZQUFZLEdBQUcsSUFBSSx3QkFBWSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1QkFBVSxDQUFDLFlBQVksRUFBRSxDQUFDLElBQUksdUJBQWlCLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkgsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRXRDLFFBQVE7WUFDUixNQUFNLFdBQVcsR0FBRyxJQUFJLHlCQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDaEQsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSwrQ0FBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN0RSxXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztZQUVuRSxlQUFlO1lBQ2YsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLHVDQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQy9ELFFBQVEsQ0FBQyxHQUFHLENBQUMsaUNBQW1CLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUV0RCxRQUFRO1lBQ1IsTUFBTSxZQUFZLEdBQUcsSUFBSSwyQkFBWSwrQkFBdUIsc0JBQXNCLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzdHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDOUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQkFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRTFDLHFCQUFxQjtZQUNyQixNQUFNLDJCQUEyQixHQUFHLElBQUksNkNBQTJCLENBQUMsWUFBWSxFQUFFLGtCQUFrQixFQUFFLHNCQUFzQixFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN2SixRQUFRLENBQUMsR0FBRyxDQUFDLDhDQUE0QixFQUFFLDJCQUEyQixDQUFDLENBQUM7WUFFeEUsNENBQTRDO1lBQzVDLHlDQUF5QztZQUN6QyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQU8sQ0FBQyxjQUFjLEVBQUUsSUFBSSwyQ0FBb0IsQ0FBQyxpQkFBTyxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRSxpQkFBTyxDQUFDLGNBQWMsRUFBRSwyQkFBMkIsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBRTFNLFNBQVM7WUFDVCxNQUFNLGFBQWEsR0FBRyxvQkFBUyxJQUFJLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHlDQUFtQixDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDM0osQ0FBQyxDQUFDLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHFDQUFpQixDQUFDLHNCQUFzQixDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ3ZJLENBQUMsQ0FBQyxJQUFJLDBCQUFpQixFQUFFLENBQUM7WUFDNUIsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRTVDLGdCQUFnQjtZQUNoQixNQUFNLG9CQUFvQixHQUFHLElBQUksMkNBQW9CLENBQUMsMkJBQTJCLENBQUMsY0FBYyxDQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDM0osUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBRTFELFlBQVk7WUFDWixRQUFRLENBQUMsR0FBRyxDQUFDLDRDQUFxQixFQUFFLElBQUksNEJBQWMsQ0FBQywyQ0FBb0IsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUVoRyxVQUFVO1lBQ1YsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5QkFBZSxFQUFFLElBQUksNEJBQWMsQ0FBQyx1Q0FBa0IsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUV2RixTQUFTO1lBQ1QsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBaUIsRUFBRSxJQUFJLDRCQUFjLENBQUMsbUNBQWdCLENBQUMsQ0FBQyxDQUFDO1lBRXRFLFVBQVU7WUFDVixRQUFRLENBQUMsR0FBRyxDQUFDLG1CQUFZLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHlCQUFXLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7WUFFL0csU0FBUztZQUNULFFBQVEsQ0FBQyxHQUFHLENBQUMsdUJBQWMsRUFBRSxJQUFJLDRCQUFjLENBQUMsNkJBQWEsQ0FBQyxDQUFDLENBQUM7WUFFaEUsbUZBQW1GO1lBQ25GLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQW9CLEVBQUUsSUFBSSx5Q0FBbUIsQ0FBQyxzQkFBc0IsRUFBRSwyQkFBMkIsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBRTdILE9BQU8sQ0FBQyxJQUFJLDJDQUFvQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBRSxvQkFBb0IsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO1FBQy9MLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxzQkFBK0M7WUFDdkUsTUFBTSxtQkFBbUIsR0FBd0I7Z0JBQ2hELGVBQWUsRUFBRSxzQkFBc0IsQ0FBQyxhQUFhO2FBQ3JELENBQUM7WUFFRixDQUFDLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUN0RCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMvQixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUMvQixtQkFBbUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7Z0JBQ2xDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBRWhELE9BQU8sbUJBQW1CLENBQUM7UUFDNUIsQ0FBQztRQUVPLEtBQUssQ0FBQyxZQUFZLENBQUMsc0JBQStDLEVBQUUsMkJBQXdELEVBQUUsb0JBQTBDLEVBQUUsWUFBMEIsRUFBRSxjQUErQjtZQUM1TyxNQUFNLGdCQUFRLENBQUMsT0FBTyxDQUFVO2dCQUUvQiw4QkFBOEI7Z0JBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQXFCO29CQUMvQixJQUFJLENBQUMsbUJBQW1CLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLEVBQUUsMENBQTBDO29CQUMzRyxzQkFBc0IsQ0FBQyxhQUFhLEVBQVMsNkVBQTZFO29CQUMxSCxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNO29CQUNyRSwyQkFBMkIsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNO29CQUNsRyxzQkFBc0IsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU07b0JBQ2pGLHNCQUFzQixDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTTtvQkFDN0Usc0JBQXNCLENBQUMsVUFBVTtpQkFDakMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUU5RSxnQkFBZ0I7Z0JBQ2hCLFlBQVksQ0FBQyxJQUFJLEVBQUU7Z0JBRW5CLHdCQUF3QjtnQkFDeEIsb0JBQW9CLENBQUMsVUFBVSxFQUFFO2FBQ2pDLENBQUMsQ0FBQztZQUVILDZEQUE2RDtZQUM3RCwyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRU8sbUJBQW1CLENBQUMsSUFBWTtZQUN2QyxJQUFJLG9CQUFTLEVBQUUsQ0FBQztnQkFDZixNQUFNLElBQUksR0FBRyxJQUFBLGdCQUFVLEVBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLElBQUksSUFBSSxFQUFFLENBQUM7b0JBQ1YsSUFBQSwyQkFBcUIsRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTyxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQXVCLEVBQUUsc0JBQStDLEVBQUUsb0JBQTJDLEVBQUUsb0JBQTJDLEVBQUUsY0FBK0IsRUFBRSxLQUFjO1lBRTlPLCtEQUErRDtZQUMvRCwrREFBK0Q7WUFDL0QsNENBQTRDO1lBQzVDLElBQUksd0JBQXVDLENBQUM7WUFDNUMsSUFBSSxDQUFDO2dCQUNKLElBQUEsa0JBQUksRUFBQywwQkFBMEIsQ0FBQyxDQUFDO2dCQUNqQyx3QkFBd0IsR0FBRyxNQUFNLElBQUEsZUFBWSxFQUFDLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUNwRixJQUFBLGtCQUFJLEVBQUMseUJBQXlCLENBQUMsQ0FBQztnQkFDaEMsYUFBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzNGLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUVoQix1RUFBdUU7Z0JBQ3ZFLG9EQUFvRDtnQkFDcEQsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRSxDQUFDO29CQUVqQyw0REFBNEQ7b0JBQzVELElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxzQkFBc0IsRUFBRSxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBRTlFLHlEQUF5RDtvQkFDekQsTUFBTSxLQUFLLENBQUM7Z0JBQ2IsQ0FBQztnQkFFRCxrREFBa0Q7Z0JBQ2xELElBQUksTUFBNkIsQ0FBQztnQkFDbEMsSUFBSSxDQUFDO29CQUNKLE1BQU0sR0FBRyxNQUFNLElBQUEsaUJBQWMsRUFBQyxzQkFBc0IsQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzdFLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFFaEIsc0VBQXNFO29CQUN0RSxJQUFJLENBQUMsS0FBSyxJQUFJLG9CQUFTLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxjQUFjLEVBQUUsQ0FBQzt3QkFDMUQsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDOzRCQUM1QixJQUFJLENBQUMsd0JBQXdCLENBQzVCLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLDhEQUE4RCxFQUFFLGNBQWMsQ0FBQyxTQUFTLENBQUMsRUFDekgsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsZ0RBQWdELENBQUMsRUFDdkYsY0FBYyxDQUNkLENBQUM7d0JBQ0gsQ0FBQzt3QkFFRCxNQUFNLEtBQUssQ0FBQztvQkFDYixDQUFDO29CQUVELDREQUE0RDtvQkFDNUQseURBQXlEO29CQUN6RCx3QkFBd0I7b0JBQ3hCLElBQUksQ0FBQzt3QkFDSixJQUFBLGVBQVUsRUFBQyxzQkFBc0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDbEQsQ0FBQztvQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO3dCQUNoQixVQUFVLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUVwRSxNQUFNLEtBQUssQ0FBQztvQkFDYixDQUFDO29CQUVELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsc0JBQXNCLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNsSSxDQUFDO2dCQUVELDJEQUEyRDtnQkFDM0QsSUFBSSxzQkFBc0IsQ0FBQyx5QkFBeUIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO29CQUMxRyxNQUFNLEdBQUcsR0FBRyxxR0FBcUcsY0FBYyxDQUFDLFNBQVMsY0FBYyxDQUFDO29CQUN4SixVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUN0QixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBRWpCLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLENBQUM7Z0JBRUQsMEZBQTBGO2dCQUMxRix5RkFBeUY7Z0JBQ3pGLGdGQUFnRjtnQkFDaEYsSUFBSSwwQkFBMEIsR0FBK0IsU0FBUyxDQUFDO2dCQUN2RSxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDOUUsMEJBQTBCLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTt3QkFDNUMsSUFBSSxDQUFDLHdCQUF3QixDQUM1QixJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSx1REFBdUQsRUFBRSxjQUFjLENBQUMsU0FBUyxDQUFDLEVBQ3ZILElBQUEsY0FBUSxFQUFDLGdDQUFnQyxFQUFFLGlEQUFpRCxDQUFDLEVBQzdGLGNBQWMsQ0FDZCxDQUFDO29CQUNILENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDWCxDQUFDO2dCQUVELE1BQU0sOEJBQThCLEdBQUcsa0JBQVksQ0FBQyxTQUFTLENBQXFCLE1BQU0sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUM3SSxNQUFNLG1DQUFtQyxHQUFHLGtCQUFZLENBQUMsU0FBUyxDQUEwQixNQUFNLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFFNUosZUFBZTtnQkFDZixJQUFJLHNCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDeEMsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsS0FBSyxJQUFJLEVBQUU7d0JBQ3JELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSx1Q0FBa0IsQ0FBQyxxQ0FBb0IsRUFBRSxjQUFjLENBQUMsQ0FBQzt3QkFDeEYsTUFBTSxlQUFlLEdBQUcsTUFBTSxtQ0FBbUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO3dCQUN2RixNQUFNLGlCQUFpQixHQUFHLE1BQU0sbUNBQW1DLENBQUMsb0JBQW9CLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQzt3QkFDckosTUFBTSxXQUFXLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFLGlCQUFpQixDQUFDLENBQUM7d0JBQ2hHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7d0JBRXpCLE1BQU0sSUFBSSxzQkFBYSxFQUFFLENBQUM7b0JBQzNCLENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBRUQsbUNBQW1DO2dCQUNuQyxJQUFJLG9CQUFTLEVBQUUsQ0FBQztvQkFDZixNQUFNLElBQUksQ0FBQywrQkFBK0IsQ0FBQyw4QkFBOEIsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDeEYsQ0FBQztnQkFFRCwyQkFBMkI7Z0JBQzNCLFVBQVUsQ0FBQyxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQztnQkFDdkQsTUFBTSw4QkFBOEIsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUEwQixDQUFDLENBQUM7Z0JBRTVHLFVBQVU7Z0JBQ1YsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUVqQixpRUFBaUU7Z0JBQ2pFLElBQUksMEJBQTBCLEVBQUUsQ0FBQztvQkFDaEMsWUFBWSxDQUFDLDBCQUEwQixDQUFDLENBQUM7Z0JBQzFDLENBQUM7Z0JBRUQsTUFBTSxJQUFJLHNCQUFhLENBQUMsOENBQThDLENBQUMsQ0FBQztZQUN6RSxDQUFDO1lBRUQsNEJBQTRCO1lBQzVCLElBQUksc0JBQXNCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSx1SEFBdUgsRUFBRSxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFFMUwsTUFBTSxJQUFJLHNCQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUMzQyxDQUFDO1lBRUQscUVBQXFFO1lBQ3JFLG9FQUFvRTtZQUNwRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFaEQsT0FBTyx3QkFBd0IsQ0FBQztRQUNqQyxDQUFDO1FBRU8seUJBQXlCLENBQUMsc0JBQStDLEVBQUUsY0FBK0IsRUFBRSxLQUE0QjtZQUMvSSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQ3ZELE1BQU0sV0FBVyxHQUFHLElBQUEsaUJBQVEsRUFBQyxDQUFDLHNCQUFzQixDQUFDLFlBQVksRUFBRSxzQkFBc0IsQ0FBQyxjQUFjLEVBQUUseUJBQWUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBQSxxQkFBWSxFQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsYUFBRSxFQUFFLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFdk4sSUFBSSxDQUFDLHdCQUF3QixDQUM1QixJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxvQ0FBb0MsQ0FBQyxFQUNyRSxJQUFBLGNBQVEsRUFBQyw0Q0FBNEMsRUFBRSx5RUFBeUUsRUFBRSxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUNoTCxjQUFjLENBQ2QsQ0FBQztZQUNILENBQUM7UUFDRixDQUFDO1FBRU8sd0JBQXdCLENBQUMsT0FBZSxFQUFFLE1BQWMsRUFBRSxjQUErQjtZQUVoRyxpRUFBaUU7WUFDakUsb0VBQW9FO1lBQ3BFLG9EQUFvRDtZQUVwRCxpQkFBTSxDQUFDLGtCQUFrQixDQUFDLElBQUEsa0NBQXdCLEVBQUM7Z0JBQ2xELElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxDQUFDLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3BGLE9BQU87Z0JBQ1AsTUFBTTthQUNOLEVBQUUsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVPLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxpQkFBcUMsRUFBRSxVQUF1QjtZQUMzRyxJQUFJLG9CQUFTLEVBQUUsQ0FBQztnQkFDZixNQUFNLFNBQVMsR0FBRyxNQUFNLGlCQUFpQixDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBRTdELFVBQVUsQ0FBQyxLQUFLLENBQUMsdURBQXVELEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRXJGLElBQUksQ0FBQztvQkFDSixDQUFDLHNEQUFhLHlCQUF5QiwyQkFBQyxDQUFDLENBQUMsd0JBQXdCLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQy9FLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDekIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sSUFBSSxDQUFDLFFBQTBCLEVBQUUsTUFBOEI7WUFDdEUsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBVyxDQUFDLENBQUM7WUFDN0MsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDRDQUFxQixDQUFDLENBQUM7WUFFakUsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBRWpCLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osSUFBSyxNQUF3QixDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUMxQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDcEIsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ2xDLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyw4QkFBOEI7b0JBRTVDLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNsQixVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDaEMsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLFVBQVUsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3pELENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELDBDQUEwQztRQUVsQyxXQUFXO1lBRWxCLGtCQUFrQjtZQUNsQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUEsaUNBQW9CLEVBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFcEUsK0RBQStEO1lBQy9ELGtFQUFrRTtZQUNsRSwrREFBK0Q7WUFDL0QsK0NBQStDO1lBQy9DLEVBQUU7WUFDRixrRUFBa0U7WUFDbEUsc0VBQXNFO1lBRXRFLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUMzQyxNQUFNLGtCQUFrQixHQUFHLElBQUEsK0JBQXdCLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLGtCQUFrQixFQUFFLENBQUM7b0JBQ3hCLElBQUEsbUJBQU0sRUFBQyxPQUFPLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixDQUFDLENBQUM7b0JBQ2pFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQztnQkFDOUMsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTyxhQUFhLENBQUMsSUFBc0I7WUFFM0MseUNBQXlDO1lBQ3pDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDYixDQUFDO1lBRUQsbURBQW1EO1lBQ25ELElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDaEIsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVPLGVBQWUsQ0FBQyxJQUFjLEVBQUUsWUFBc0I7WUFDN0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLGFBQUcsR0FBRSxDQUFDO1lBQ2hDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQzdCLElBQUksYUFBYSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFFaEMsSUFBSSxVQUFVLEdBQXVDLFNBQVMsQ0FBQztnQkFDL0QsSUFBSSxZQUFZLEVBQUUsQ0FBQztvQkFDbEIsVUFBVSxHQUFHLElBQUEsaUNBQXVCLEVBQUMsYUFBYSxDQUFDLENBQUM7b0JBQ3BELGFBQWEsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUNqQyxDQUFDO2dCQUVELElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ25CLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNwRSxDQUFDO2dCQUVELE1BQU0saUJBQWlCLEdBQUcsSUFBQSwwQkFBZ0IsRUFBQyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztnQkFFN0UsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLGVBQVEsRUFBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLGdCQUFnQixDQUFDLDRDQUE0QyxJQUFJLENBQUMsSUFBQSx5QkFBZSxFQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztvQkFDekcsT0FBTyxJQUFJLENBQUMsQ0FBQyxrQ0FBa0M7Z0JBQ2hELENBQUM7Z0JBRUQsSUFBSSxZQUFZLElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hDLFVBQVUsQ0FBQyxJQUFJLEdBQUcsaUJBQWlCLENBQUM7b0JBRXBDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztnQkFFRCxPQUFPLGlCQUFpQixDQUFDO1lBQzFCLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxlQUFlLEdBQUcsb0JBQVMsSUFBSSxzQkFBVyxDQUFDO1lBQ2pELE1BQU0sYUFBYSxHQUFHLElBQUEsaUJBQVEsRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFNUcsT0FBTyxJQUFBLGlCQUFRLEVBQUMsYUFBYSxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUVPLFdBQVcsQ0FBQyxHQUFXLEVBQUUsSUFBWTtZQUU1Qyx1QkFBdUI7WUFDdkIsSUFBSSxvQkFBUyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxHQUFHLElBQUEsZUFBSyxFQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLGtEQUFrRDtZQUM1RSxDQUFDO1lBRUQsbUJBQW1CO1lBQ25CLElBQUksR0FBRyxJQUFBLGNBQUksRUFBQyxJQUFBLGNBQUksRUFBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFbkMsSUFBSSxvQkFBUyxFQUFFLENBQUM7Z0JBRWYsaURBQWlEO2dCQUNqRCxJQUFJLEdBQUcsSUFBQSxjQUFPLEVBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUUxQixtRUFBbUU7Z0JBQ25FLElBQUksR0FBRyxJQUFBLGVBQUssRUFBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDekIsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVPLE1BQU0sQ0FBQyxrQkFBMEM7WUFDeEQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUzQyxJQUFJLE9BQU8sa0JBQWtCLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNqRCxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2hELENBQUM7WUFFRCxJQUFJLE9BQU8sa0JBQWtCLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNuRCxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2xELENBQUM7WUFFRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsQ0FBQztLQUdEO0lBRUQsZUFBZTtJQUNmLE1BQU0sSUFBSSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7SUFDNUIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDIn0=