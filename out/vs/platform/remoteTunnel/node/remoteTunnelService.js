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
define(["require", "exports", "vs/platform/remoteTunnel/common/remoteTunnel", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/environment/common/environment", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/path", "child_process", "vs/platform/product/common/productService", "vs/base/common/platform", "vs/base/common/async", "vs/platform/lifecycle/node/sharedProcessLifecycleService", "vs/platform/configuration/common/configuration", "vs/nls", "os", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/base/node/nodeStreams", "vs/base/common/resources"], function (require, exports, remoteTunnel_1, event_1, telemetry_1, environment_1, lifecycle_1, log_1, path_1, child_process_1, productService_1, platform_1, async_1, sharedProcessLifecycleService_1, configuration_1, nls_1, os_1, storage_1, types_1, nodeStreams_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteTunnelService = void 0;
    const restartTunnelOnConfigurationChanges = [
        remoteTunnel_1.CONFIGURATION_KEY_HOST_NAME,
        remoteTunnel_1.CONFIGURATION_KEY_PREVENT_SLEEP,
    ];
    // This is the session used run the tunnel access.
    // if set, the remote tunnel access is currently enabled.
    // if not set, the remote tunnel access is currently disabled.
    const TUNNEL_ACCESS_SESSION = 'remoteTunnelSession';
    // Boolean indicating whether the tunnel should be installed as a service.
    const TUNNEL_ACCESS_IS_SERVICE = 'remoteTunnelIsService';
    /**
     * This service runs on the shared service. It is running the `code-tunnel` command
     * to make the current machine available for remote access.
     */
    let RemoteTunnelService = class RemoteTunnelService extends lifecycle_1.Disposable {
        constructor(telemetryService, productService, environmentService, loggerService, sharedProcessLifecycleService, configurationService, storageService) {
            super();
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.storageService = storageService;
            this._onDidTokenFailedEmitter = new event_1.Emitter();
            this.onDidTokenFailed = this._onDidTokenFailedEmitter.event;
            this._onDidChangeTunnelStatusEmitter = new event_1.Emitter();
            this.onDidChangeTunnelStatus = this._onDidChangeTunnelStatusEmitter.event;
            this._onDidChangeModeEmitter = new event_1.Emitter();
            this.onDidChangeMode = this._onDidChangeModeEmitter.event;
            /**
             * "Mode" in the terminal state we want to get to -- started, stopped, and
             * the attributes associated with each.
             *
             * At any given time, work may be ongoing to get `_tunnelStatus` into a
             * state that reflects the desired `mode`.
             */
            this._mode = remoteTunnel_1.INACTIVE_TUNNEL_MODE;
            this._initialized = false;
            this.defaultOnOutput = (a, isErr) => {
                if (isErr) {
                    this._logger.error(a);
                }
                else {
                    this._logger.info(a);
                }
            };
            this._logger = this._register(loggerService.createLogger((0, resources_1.joinPath)(environmentService.logsHome, `${remoteTunnel_1.LOG_ID}.log`), { id: remoteTunnel_1.LOG_ID, name: remoteTunnel_1.LOGGER_NAME }));
            this._startTunnelProcessDelayer = new async_1.Delayer(100);
            this._register(this._logger.onDidChangeLogLevel(l => this._logger.info('Log level changed to ' + (0, log_1.LogLevelToString)(l))));
            this._register(sharedProcessLifecycleService.onWillShutdown(() => {
                this._tunnelProcess?.cancel();
                this._tunnelProcess = undefined;
                this.dispose();
            }));
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (restartTunnelOnConfigurationChanges.some(c => e.affectsConfiguration(c))) {
                    this._startTunnelProcessDelayer.trigger(() => this.updateTunnelProcess());
                }
            }));
            this._mode = this._restoreMode();
            this._tunnelStatus = remoteTunnel_1.TunnelStates.uninitialized;
        }
        async getTunnelStatus() {
            return this._tunnelStatus;
        }
        setTunnelStatus(tunnelStatus) {
            this._tunnelStatus = tunnelStatus;
            this._onDidChangeTunnelStatusEmitter.fire(tunnelStatus);
        }
        setMode(mode) {
            if (isSameMode(this._mode, mode)) {
                return;
            }
            this._mode = mode;
            this._storeMode(mode);
            this._onDidChangeModeEmitter.fire(this._mode);
            if (mode.active) {
                this._logger.info(`Session updated: ${mode.session.accountLabel} (${mode.session.providerId}) (service=${mode.asService})`);
                if (mode.session.token) {
                    this._logger.info(`Session token updated: ${mode.session.accountLabel} (${mode.session.providerId})`);
                }
            }
            else {
                this._logger.info(`Session reset`);
            }
        }
        getMode() {
            return Promise.resolve(this._mode);
        }
        async initialize(mode) {
            if (this._initialized) {
                return this._tunnelStatus;
            }
            this._initialized = true;
            this.setMode(mode);
            try {
                await this._startTunnelProcessDelayer.trigger(() => this.updateTunnelProcess());
            }
            catch (e) {
                this._logger.error(e);
            }
            return this._tunnelStatus;
        }
        getTunnelCommandLocation() {
            if (!this._tunnelCommand) {
                let binParentLocation;
                if (platform_1.isMacintosh) {
                    // appRoot = /Applications/Visual Studio Code - Insiders.app/Contents/Resources/app
                    // bin = /Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin
                    binParentLocation = this.environmentService.appRoot;
                }
                else {
                    // appRoot = C:\Users\<name>\AppData\Local\Programs\Microsoft VS Code Insiders\resources\app
                    // bin = C:\Users\<name>\AppData\Local\Programs\Microsoft VS Code Insiders\bin
                    // appRoot = /usr/share/code-insiders/resources/app
                    // bin = /usr/share/code-insiders/bin
                    binParentLocation = (0, path_1.dirname)((0, path_1.dirname)(this.environmentService.appRoot));
                }
                this._tunnelCommand = (0, path_1.join)(binParentLocation, 'bin', `${this.productService.tunnelApplicationName}${platform_1.isWindows ? '.exe' : ''}`);
            }
            return this._tunnelCommand;
        }
        async startTunnel(mode) {
            if (isSameMode(this._mode, mode) && this._tunnelStatus.type !== 'disconnected') {
                return this._tunnelStatus;
            }
            this.setMode(mode);
            try {
                await this._startTunnelProcessDelayer.trigger(() => this.updateTunnelProcess());
            }
            catch (e) {
                this._logger.error(e);
            }
            return this._tunnelStatus;
        }
        async stopTunnel() {
            if (this._tunnelProcess) {
                this._tunnelProcess.cancel();
                this._tunnelProcess = undefined;
            }
            if (this._mode.active) {
                // Be careful to only uninstall the service if we're the ones who installed it:
                const needsServiceUninstall = this._mode.asService;
                this.setMode(remoteTunnel_1.INACTIVE_TUNNEL_MODE);
                try {
                    if (needsServiceUninstall) {
                        this.runCodeTunnelCommand('uninstallService', ['service', 'uninstall']);
                    }
                }
                catch (e) {
                    this._logger.error(e);
                }
            }
            try {
                await this.runCodeTunnelCommand('stop', ['kill']);
            }
            catch (e) {
                this._logger.error(e);
            }
            this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected());
        }
        async updateTunnelProcess() {
            this.telemetryService.publicLog2('remoteTunnel.enablement', {
                enabled: this._mode.active,
                service: this._mode.active && this._mode.asService,
            });
            if (this._tunnelProcess) {
                this._tunnelProcess.cancel();
                this._tunnelProcess = undefined;
            }
            let output = '';
            let isServiceInstalled = false;
            const onOutput = (a, isErr) => {
                if (isErr) {
                    this._logger.error(a);
                }
                else {
                    output += a;
                }
                if (!this.environmentService.isBuilt && a.startsWith('   Compiling')) {
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.connecting((0, nls_1.localize)('remoteTunnelService.building', 'Building CLI from sources')));
                }
            };
            const statusProcess = this.runCodeTunnelCommand('status', ['status'], onOutput);
            this._tunnelProcess = statusProcess;
            try {
                await statusProcess;
                if (this._tunnelProcess !== statusProcess) {
                    return;
                }
                // split and find the line, since in dev builds additional noise is
                // added by cargo to the output.
                let status;
                try {
                    status = JSON.parse(output.trim().split('\n').find(l => l.startsWith('{')));
                }
                catch (e) {
                    this._logger.error(`Could not parse status output: ${JSON.stringify(output.trim())}`);
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected());
                    return;
                }
                isServiceInstalled = status.service_installed;
                this._logger.info(status.tunnel ? 'Other tunnel running, attaching...' : 'No other tunnel running');
                // If a tunnel is running but the mode isn't "active", we'll still attach
                // to the tunnel to show its state in the UI. If neither are true, disconnect
                if (!status.tunnel && !this._mode.active) {
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected());
                    return;
                }
            }
            catch (e) {
                this._logger.error(e);
                this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected());
                return;
            }
            finally {
                if (this._tunnelProcess === statusProcess) {
                    this._tunnelProcess = undefined;
                }
            }
            const session = this._mode.active ? this._mode.session : undefined;
            if (session && session.token) {
                const token = session.token;
                this.setTunnelStatus(remoteTunnel_1.TunnelStates.connecting((0, nls_1.localize)({ key: 'remoteTunnelService.authorizing', comment: ['{0} is a user account name, {1} a provider name (e.g. Github)'] }, 'Connecting as {0} ({1})', session.accountLabel, session.providerId)));
                const onLoginOutput = (a, isErr) => {
                    a = a.replaceAll(token, '*'.repeat(4));
                    onOutput(a, isErr);
                };
                const loginProcess = this.runCodeTunnelCommand('login', ['user', 'login', '--provider', session.providerId, '--access-token', token, '--log', (0, log_1.LogLevelToString)(this._logger.getLevel())], onLoginOutput);
                this._tunnelProcess = loginProcess;
                try {
                    await loginProcess;
                    if (this._tunnelProcess !== loginProcess) {
                        return;
                    }
                }
                catch (e) {
                    this._logger.error(e);
                    this._tunnelProcess = undefined;
                    this._onDidTokenFailedEmitter.fire(session);
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected(session));
                    return;
                }
            }
            const hostName = this._getTunnelName();
            if (hostName) {
                this.setTunnelStatus(remoteTunnel_1.TunnelStates.connecting((0, nls_1.localize)({ key: 'remoteTunnelService.openTunnelWithName', comment: ['{0} is a tunnel name'] }, 'Opening tunnel {0}', hostName)));
            }
            else {
                this.setTunnelStatus(remoteTunnel_1.TunnelStates.connecting((0, nls_1.localize)('remoteTunnelService.openTunnel', 'Opening tunnel')));
            }
            const args = ['--accept-server-license-terms', '--log', (0, log_1.LogLevelToString)(this._logger.getLevel())];
            if (hostName) {
                args.push('--name', hostName);
            }
            else {
                args.push('--random-name');
            }
            let serviceInstallFailed = false;
            if (this._mode.active && this._mode.asService && !isServiceInstalled) {
                // I thought about calling `code tunnel kill` here, but having multiple
                // tunnel processes running is pretty much idempotent. If there's
                // another tunnel process running, the service process will
                // take over when it exits, no hard feelings.
                serviceInstallFailed = await this.installTunnelService(args) === false;
            }
            return this.serverOrAttachTunnel(session, args, serviceInstallFailed);
        }
        async installTunnelService(args) {
            let status;
            try {
                status = await this.runCodeTunnelCommand('serviceInstall', ['service', 'install', ...args]);
            }
            catch (e) {
                this._logger.error(e);
                status = 1;
            }
            if (status !== 0) {
                const msg = (0, nls_1.localize)('remoteTunnelService.serviceInstallFailed', 'Failed to install tunnel as a service, starting in session...');
                this._logger.warn(msg);
                this.setTunnelStatus(remoteTunnel_1.TunnelStates.connecting(msg));
                return false;
            }
            return true;
        }
        async serverOrAttachTunnel(session, args, serviceInstallFailed) {
            args.push('--parent-process-id', String(process.pid));
            if (this._preventSleep()) {
                args.push('--no-sleep');
            }
            let isAttached = false;
            const serveCommand = this.runCodeTunnelCommand('tunnel', args, (message, isErr) => {
                if (isErr) {
                    this._logger.error(message);
                }
                else {
                    this._logger.info(message);
                }
                if (message.includes('Connected to an existing tunnel process')) {
                    isAttached = true;
                }
                const m = message.match(/Open this link in your browser (https:\/\/([^\/\s]+)\/([^\/\s]+)\/([^\/\s]+))/);
                if (m) {
                    const info = { link: m[1], domain: m[2], tunnelName: m[4], isAttached };
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.connected(info, serviceInstallFailed));
                }
                else if (message.match(/error refreshing token/)) {
                    serveCommand.cancel();
                    this._onDidTokenFailedEmitter.fire(session);
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected(session));
                }
            });
            this._tunnelProcess = serveCommand;
            serveCommand.finally(() => {
                if (serveCommand === this._tunnelProcess) {
                    // process exited unexpectedly
                    this._logger.info(`tunnel process terminated`);
                    this._tunnelProcess = undefined;
                    this._mode = remoteTunnel_1.INACTIVE_TUNNEL_MODE;
                    this.setTunnelStatus(remoteTunnel_1.TunnelStates.disconnected());
                }
            });
        }
        runCodeTunnelCommand(logLabel, commandArgs, onOutput = this.defaultOnOutput) {
            return (0, async_1.createCancelablePromise)(token => {
                return new Promise((resolve, reject) => {
                    if (token.isCancellationRequested) {
                        resolve(-1);
                    }
                    let tunnelProcess;
                    const stdio = ['ignore', 'pipe', 'pipe'];
                    token.onCancellationRequested(() => {
                        if (tunnelProcess) {
                            this._logger.info(`${logLabel} terminating(${tunnelProcess.pid})`);
                            tunnelProcess.kill();
                        }
                    });
                    if (!this.environmentService.isBuilt) {
                        onOutput('Building tunnel CLI from sources and run\n', false);
                        onOutput(`${logLabel} Spawning: cargo run -- tunnel ${commandArgs.join(' ')}\n`, false);
                        tunnelProcess = (0, child_process_1.spawn)('cargo', ['run', '--', 'tunnel', ...commandArgs], { cwd: (0, path_1.join)(this.environmentService.appRoot, 'cli'), stdio });
                    }
                    else {
                        onOutput('Running tunnel CLI\n', false);
                        const tunnelCommand = this.getTunnelCommandLocation();
                        onOutput(`${logLabel} Spawning: ${tunnelCommand} tunnel ${commandArgs.join(' ')}\n`, false);
                        tunnelProcess = (0, child_process_1.spawn)(tunnelCommand, ['tunnel', ...commandArgs], { cwd: (0, os_1.homedir)(), stdio });
                    }
                    tunnelProcess.stdout.pipe(new nodeStreams_1.StreamSplitter('\n')).on('data', data => {
                        if (tunnelProcess) {
                            const message = data.toString();
                            onOutput(message, false);
                        }
                    });
                    tunnelProcess.stderr.pipe(new nodeStreams_1.StreamSplitter('\n')).on('data', data => {
                        if (tunnelProcess) {
                            const message = data.toString();
                            onOutput(message, true);
                        }
                    });
                    tunnelProcess.on('exit', e => {
                        if (tunnelProcess) {
                            onOutput(`${logLabel} exit(${tunnelProcess.pid}): + ${e} `, false);
                            tunnelProcess = undefined;
                            resolve(e || 0);
                        }
                    });
                    tunnelProcess.on('error', e => {
                        if (tunnelProcess) {
                            onOutput(`${logLabel} error(${tunnelProcess.pid}): + ${e} `, true);
                            tunnelProcess = undefined;
                            reject();
                        }
                    });
                });
            });
        }
        async getTunnelName() {
            return this._getTunnelName();
        }
        _preventSleep() {
            return !!this.configurationService.getValue(remoteTunnel_1.CONFIGURATION_KEY_PREVENT_SLEEP);
        }
        _getTunnelName() {
            let name = this.configurationService.getValue(remoteTunnel_1.CONFIGURATION_KEY_HOST_NAME) || (0, os_1.hostname)();
            name = name.replace(/^-+/g, '').replace(/[^\w-]/g, '').substring(0, 20);
            return name || undefined;
        }
        _restoreMode() {
            try {
                const tunnelAccessSession = this.storageService.get(TUNNEL_ACCESS_SESSION, -1 /* StorageScope.APPLICATION */);
                const asService = this.storageService.getBoolean(TUNNEL_ACCESS_IS_SERVICE, -1 /* StorageScope.APPLICATION */, false);
                if (tunnelAccessSession) {
                    const session = JSON.parse(tunnelAccessSession);
                    if (session && (0, types_1.isString)(session.accountLabel) && (0, types_1.isString)(session.sessionId) && (0, types_1.isString)(session.providerId)) {
                        return { active: true, session, asService };
                    }
                    this._logger.error('Problems restoring session from storage, invalid format', session);
                }
            }
            catch (e) {
                this._logger.error('Problems restoring session from storage', e);
            }
            return remoteTunnel_1.INACTIVE_TUNNEL_MODE;
        }
        _storeMode(mode) {
            if (mode.active) {
                const sessionWithoutToken = {
                    providerId: mode.session.providerId, sessionId: mode.session.sessionId, accountLabel: mode.session.accountLabel
                };
                this.storageService.store(TUNNEL_ACCESS_SESSION, JSON.stringify(sessionWithoutToken), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                this.storageService.store(TUNNEL_ACCESS_IS_SERVICE, mode.asService, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(TUNNEL_ACCESS_SESSION, -1 /* StorageScope.APPLICATION */);
                this.storageService.remove(TUNNEL_ACCESS_IS_SERVICE, -1 /* StorageScope.APPLICATION */);
            }
        }
    };
    exports.RemoteTunnelService = RemoteTunnelService;
    exports.RemoteTunnelService = RemoteTunnelService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, productService_1.IProductService),
        __param(2, environment_1.INativeEnvironmentService),
        __param(3, log_1.ILoggerService),
        __param(4, sharedProcessLifecycleService_1.ISharedProcessLifecycleService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, storage_1.IStorageService)
    ], RemoteTunnelService);
    function isSameSession(a1, a2) {
        if (a1 && a2) {
            return a1.sessionId === a2.sessionId && a1.providerId === a2.providerId && a1.token === a2.token;
        }
        return a1 === a2;
    }
    const isSameMode = (a, b) => {
        if (a.active !== b.active) {
            return false;
        }
        else if (a.active && b.active) {
            return a.asService === b.asService && isSameSession(a.session, b.session);
        }
        else {
            return true;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVHVubmVsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlbW90ZVR1bm5lbC9ub2RlL3JlbW90ZVR1bm5lbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0NoRyxNQUFNLG1DQUFtQyxHQUFzQjtRQUM5RCwwQ0FBMkI7UUFDM0IsOENBQStCO0tBQy9CLENBQUM7SUFFRixrREFBa0Q7SUFDbEQseURBQXlEO0lBQ3pELDhEQUE4RDtJQUM5RCxNQUFNLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDO0lBQ3BELDBFQUEwRTtJQUMxRSxNQUFNLHdCQUF3QixHQUFHLHVCQUF1QixDQUFDO0lBRXpEOzs7T0FHRztJQUNJLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFpQ2xELFlBQ29CLGdCQUFvRCxFQUN0RCxjQUFnRCxFQUN0QyxrQkFBOEQsRUFDekUsYUFBNkIsRUFDYiw2QkFBNkQsRUFDdEUsb0JBQTRELEVBQ2xFLGNBQWdEO1lBRWpFLEtBQUssRUFBRSxDQUFDO1lBUjRCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDckMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ3JCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBMkI7WUFHakQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFwQ2pELDZCQUF3QixHQUFHLElBQUksZUFBTyxFQUFvQyxDQUFDO1lBQzVFLHFCQUFnQixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUM7WUFFdEQsb0NBQStCLEdBQUcsSUFBSSxlQUFPLEVBQWdCLENBQUM7WUFDL0QsNEJBQXVCLEdBQUcsSUFBSSxD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