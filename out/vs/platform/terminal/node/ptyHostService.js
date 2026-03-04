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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/parts/ipc/common/ipc", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/platform/shell/node/shellEnv", "vs/platform/terminal/common/requestStore", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalPlatformConfiguration", "vs/platform/terminal/node/terminalProfiles", "vs/base/node/shell", "vs/base/common/stopwatch"], function (require, exports, event_1, lifecycle_1, platform_1, ipc_1, configuration_1, log_1, logIpc_1, shellEnv_1, requestStore_1, terminal_1, terminalPlatformConfiguration_1, terminalProfiles_1, shell_1, stopwatch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PtyHostService = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["MaxRestarts"] = 5] = "MaxRestarts";
    })(Constants || (Constants = {}));
    /**
     * This service implements IPtyService by launching a pty host process, forwarding messages to and
     * from the pty host process and manages the connection.
     */
    let PtyHostService = class PtyHostService extends lifecycle_1.Disposable {
        get _connection() {
            this._ensurePtyHost();
            return this.__connection;
        }
        get _proxy() {
            this._ensurePtyHost();
            return this.__proxy;
        }
        /**
         * Get the proxy if it exists, otherwise undefined. This is used when calls are not needed to be
         * passed through to the pty host if it has not yet been spawned.
         */
        get _optionalProxy() {
            return this.__proxy;
        }
        _ensurePtyHost() {
            if (!this.__connection) {
                this._startPtyHost();
            }
        }
        constructor(_ptyHostStarter, _configurationService, _logService, _loggerService) {
            super();
            this._ptyHostStarter = _ptyHostStarter;
            this._configurationService = _configurationService;
            this._logService = _logService;
            this._loggerService = _loggerService;
            this._wasQuitRequested = false;
            this._restartCount = 0;
            this._isResponsive = true;
            this._onPtyHostExit = this._register(new event_1.Emitter());
            this.onPtyHostExit = this._onPtyHostExit.event;
            this._onPtyHostStart = this._register(new event_1.Emitter());
            this.onPtyHostStart = this._onPtyHostStart.event;
            this._onPtyHostUnresponsive = this._register(new event_1.Emitter());
            this.onPtyHostUnresponsive = this._onPtyHostUnresponsive.event;
            this._onPtyHostResponsive = this._register(new event_1.Emitter());
            this.onPtyHostResponsive = this._onPtyHostResponsive.event;
            this._onPtyHostRequestResolveVariables = this._register(new event_1.Emitter());
            this.onPtyHostRequestResolveVariables = this._onPtyHostRequestResolveVariables.event;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onProcessReplay = this._register(new event_1.Emitter());
            this.onProcessReplay = this._onProcessReplay.event;
            this._onProcessOrphanQuestion = this._register(new event_1.Emitter());
            this.onProcessOrphanQuestion = this._onProcessOrphanQuestion.event;
            this._onDidRequestDetach = this._register(new event_1.Emitter());
            this.onDidRequestDetach = this._onDidRequestDetach.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            // Platform configuration is required on the process running the pty host (shared process or
            // remote server).
            (0, terminalPlatformConfiguration_1.registerTerminalPlatformConfiguration)();
            this._register(this._ptyHostStarter);
            this._register((0, lifecycle_1.toDisposable)(() => this._disposePtyHost()));
            this._resolveVariablesRequestStore = this._register(new requestStore_1.RequestStore(undefined, this._logService));
            this._resolveVariablesRequestStore.onCreateRequest(this._onPtyHostRequestResolveVariables.fire, this._onPtyHostRequestResolveVariables);
            // Start the pty host when a window requests a connection, if the starter has that capability.
            if (this._ptyHostStarter.onRequestConnection) {
                event_1.Event.once(this._ptyHostStarter.onRequestConnection)(() => this._ensurePtyHost());
            }
            this._ptyHostStarter.onWillShutdown?.(() => this._wasQuitRequested = true);
        }
        get _ignoreProcessNames() {
            return this._configurationService.getValue("terminal.integrated.ignoreProcessNames" /* TerminalSettingId.IgnoreProcessNames */);
        }
        async _refreshIgnoreProcessNames() {
            return this._optionalProxy?.refreshIgnoreProcessNames?.(this._ignoreProcessNames);
        }
        async _resolveShellEnv() {
            if (platform_1.isWindows) {
                return process.env;
            }
            try {
                return await (0, shellEnv_1.getResolvedShellEnv)(this._configurationService, this._logService, { _: [] }, process.env);
            }
            catch (error) {
                this._logService.error('ptyHost was unable to resolve shell environment', error);
                return {};
            }
        }
        _startPtyHost() {
            const connection = this._ptyHostStarter.start();
            const client = connection.client;
            // Log a full stack trace which will tell the exact reason the pty host is starting up
            if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                this._logService.trace('PtyHostService#_startPtyHost', new Error().stack?.replace(/^Error/, ''));
            }
            // Setup heartbeat service and trigger a heartbeat immediately to reset the timeouts
            const heartbeatService = ipc_1.ProxyChannel.toService(client.getChannel(terminal_1.TerminalIpcChannels.Heartbeat));
            heartbeatService.onBeat(() => this._handleHeartbeat());
            this._handleHeartbeat(true);
            // Handle exit
            this._register(connection.onDidProcessExit(e => {
                this._onPtyHostExit.fire(e.code);
                if (!this._wasQuitRequested && !this._store.isDisposed) {
                    if (this._restartCount <= Constants.MaxRestarts) {
                        this._logService.error(`ptyHost terminated unexpectedly with code ${e.code}`);
                        this._restartCount++;
                        this.restartPtyHost();
                    }
                    else {
                        this._logService.error(`ptyHost terminated unexpectedly with code ${e.code}, giving up`);
                    }
                }
            }));
            // Create proxy and forward events
            const proxy = ipc_1.ProxyChannel.toService(client.getChannel(terminal_1.TerminalIpcChannels.PtyHost));
            this._register(proxy.onProcessData(e => this._onProcessData.fire(e)));
            this._register(proxy.onProcessReady(e => this._onProcessReady.fire(e)));
            this._register(proxy.onProcessExit(e => this._onProcessExit.fire(e)));
            this._register(proxy.onDidChangeProperty(e => this._onDidChangeProperty.fire(e)));
            this._register(proxy.onProcessReplay(e => this._onProcessReplay.fire(e)));
            this._register(proxy.onProcessOrphanQuestion(e => this._onProcessOrphanQuestion.fire(e)));
            this._register(proxy.onDidRequestDetach(e => this._onDidRequestDetach.fire(e)));
            this._register(new logIpc_1.RemoteLoggerChannelClient(this._loggerService, client.getChannel(terminal_1.TerminalIpcChannels.Logger)));
            this.__connection = connection;
            this.__proxy = proxy;
            this._onPtyHostStart.fire();
            this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("terminal.integrated.ignoreProcessNames" /* TerminalSettingId.IgnoreProcessNames */)) {
                    await this._refreshIgnoreProcessNames();
                }
            }));
            this._refreshIgnoreProcessNames();
            return [connection, proxy];
        }
        async createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, workspaceId, workspaceName) {
            const timeout = setTimeout(() => this._handleUnresponsiveCreateProcess(), terminal_1.HeartbeatConstants.CreateProcessTimeout);
            const id = await this._proxy.createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, workspaceId, workspaceName);
            clearTimeout(timeout);
            return id;
        }
        updateTitle(id, title, titleSource) {
            return this._proxy.updateTitle(id, title, titleSource);
        }
        updateIcon(id, userInitiated, icon, color) {
            return this._proxy.updateIcon(id, userInitiated, icon, color);
        }
        attachToProcess(id) {
            return this._proxy.attachToProcess(id);
        }
        detachFromProcess(id, forcePersist) {
            return this._proxy.detachFromProcess(id, forcePersist);
        }
        shutdownAll() {
            return this._proxy.shutdownAll();
        }
        listProcesses() {
            return this._proxy.listProcesses();
        }
        async getPerformanceMarks() {
            return this._optionalProxy?.getPerformanceMarks() ?? [];
        }
        async reduceConnectionGraceTime() {
            return this._optionalProxy?.reduceConnectionGraceTime();
        }
        start(id) {
            return this._proxy.start(id);
        }
        shutdown(id, immediate) {
            return this._proxy.shutdown(id, immediate);
        }
        input(id, data) {
            return this._proxy.input(id, data);
        }
        processBinary(id, data) {
            return this._proxy.processBinary(id, data);
        }
        resize(id, cols, rows) {
            return this._proxy.resize(id, cols, rows);
        }
        clearBuffer(id) {
            return this._proxy.clearBuffer(id);
        }
        acknowledgeDataEvent(id, charCount) {
            return this._proxy.acknowledgeDataEvent(id, charCount);
        }
        setUnicodeVersion(id, version) {
            return this._proxy.setUnicodeVersion(id, version);
        }
        getInitialCwd(id) {
            return this._proxy.getInitialCwd(id);
        }
        getCwd(id) {
            return this._proxy.getCwd(id);
        }
        async getLatency() {
            const sw = new stopwatch_1.StopWatch();
            const results = await this._proxy.getLatency();
            sw.stop();
            return [
                {
                    label: 'ptyhostservice<->ptyhost',
                    latency: sw.elapsed()
                },
                ...results
            ];
        }
        orphanQuestionReply(id) {
            return this._proxy.orphanQuestionReply(id);
        }
        installAutoReply(match, reply) {
            return this._proxy.installAutoReply(match, reply);
        }
        uninstallAllAutoReplies() {
            return this._proxy.uninstallAllAutoReplies();
        }
        uninstallAutoReply(match) {
            return this._proxy.uninstallAutoReply(match);
        }
        getDefaultSystemShell(osOverride) {
            return this._optionalProxy?.getDefaultSystemShell(osOverride) ?? (0, shell_1.getSystemShell)(osOverride ?? platform_1.OS, process.env);
        }
        async getProfiles(workspaceId, profiles, defaultProfile, includeDetectedProfiles = false) {
            const shellEnv = await this._resolveShellEnv();
            return (0, terminalProfiles_1.detectAvailableProfiles)(profiles, defaultProfile, includeDetectedProfiles, this._configurationService, shellEnv, undefined, this._logService, this._resolveVariables.bind(this, workspaceId));
        }
        async getEnvironment() {
            // If the pty host is yet to be launched, just return the environment of this process as it
            // is essentially the same when used to evaluate terminal profiles.
            if (!this.__proxy) {
                return { ...process.env };
            }
            return this._proxy.getEnvironment();
        }
        getWslPath(original, direction) {
            return this._proxy.getWslPath(original, direction);
        }
        getRevivedPtyNewId(workspaceId, id) {
            return this._proxy.getRevivedPtyNewId(workspaceId, id);
        }
        setTerminalLayoutInfo(args) {
            return this._proxy.setTerminalLayoutInfo(args);
        }
        async getTerminalLayoutInfo(args) {
            // This is optional as we want reconnect requests to go through only if the pty host exists.
            // Revive is handled specially as reviveTerminalProcesses is guaranteed to be called before
            // the request for layout info.
            return this._optionalProxy?.getTerminalLayoutInfo(args);
        }
        async requestDetachInstance(workspaceId, instanceId) {
            return this._proxy.requestDetachInstance(workspaceId, instanceId);
        }
        async acceptDetachInstanceReply(requestId, persistentProcessId) {
            return this._proxy.acceptDetachInstanceReply(requestId, persistentProcessId);
        }
        async freePortKillProcess(port) {
            if (!this._proxy.freePortKillProcess) {
                throw new Error('freePortKillProcess does not exist on the pty proxy');
            }
            return this._proxy.freePortKillProcess(port);
        }
        async serializeTerminalState(ids) {
            return this._proxy.serializeTerminalState(ids);
        }
        async reviveTerminalProcesses(workspaceId, state, dateTimeFormatLocate) {
            return this._proxy.reviveTerminalProcesses(workspaceId, state, dateTimeFormatLocate);
        }
        async refreshProperty(id, property) {
            return this._proxy.refreshProperty(id, property);
        }
        async updateProperty(id, property, value) {
            return this._proxy.updateProperty(id, property, value);
        }
        async restartPtyHost() {
            this._disposePtyHost();
            this._isResponsive = true;
            this._startPtyHost();
        }
        _disposePtyHost() {
            this._proxy.shutdownAll();
            this._connection.store.dispose();
        }
        _handleHeartbeat(isConnecting) {
            this._clearHeartbeatTimeouts();
            this._heartbeatFirstTimeout = setTimeout(() => this._handleHeartbeatFirstTimeout(), isConnecting ? terminal_1.HeartbeatConstants.ConnectingBeatInterval : (terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier));
            if (!this._isResponsive) {
                this._isResponsive = true;
                this._onPtyHostResponsive.fire();
            }
        }
        _handleHeartbeatFirstTimeout() {
            this._logService.warn(`No ptyHost heartbeat after ${terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier / 1000} seconds`);
            this._heartbeatFirstTimeout = undefined;
            this._heartbeatSecondTimeout = setTimeout(() => this._handleHeartbeatSecondTimeout(), terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.SecondWaitMultiplier);
        }
        _handleHeartbeatSecondTimeout() {
            this._logService.error(`No ptyHost heartbeat after ${(terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier + terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier) / 1000} seconds`);
            this._heartbeatSecondTimeout = undefined;
            if (this._isResponsive) {
                this._isResponsive = false;
                this._onPtyHostUnresponsive.fire();
            }
        }
        _handleUnresponsiveCreateProcess() {
            this._clearHeartbeatTimeouts();
            this._logService.error(`No ptyHost response to createProcess after ${terminal_1.HeartbeatConstants.CreateProcessTimeout / 1000} seconds`);
            if (this._isResponsive) {
                this._isResponsive = false;
                this._onPtyHostUnresponsive.fire();
            }
        }
        _clearHeartbeatTimeouts() {
            if (this._heartbeatFirstTimeout) {
                clearTimeout(this._heartbeatFirstTimeout);
                this._heartbeatFirstTimeout = undefined;
            }
            if (this._heartbeatSecondTimeout) {
                clearTimeout(this._heartbeatSecondTimeout);
                this._heartbeatSecondTimeout = undefined;
            }
        }
        _resolveVariables(workspaceId, text) {
            return this._resolveVariablesRequestStore.createRequest({ workspaceId, originalText: text });
        }
        async acceptPtyHostResolvedVariables(requestId, resolved) {
            this._resolveVariablesRequestStore.acceptReply(requestId, resolved);
        }
    };
    exports.PtyHostService = PtyHostService;
    exports.PtyHostService = PtyHostService = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService),
        __param(3, log_1.ILoggerService)
    ], PtyHostService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHR5SG9zdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9ub2RlL3B0eUhvc3RTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFCaEcsSUFBSyxTQUVKO0lBRkQsV0FBSyxTQUFTO1FBQ2IsdURBQWUsQ0FBQTtJQUNoQixDQUFDLEVBRkksU0FBUyxLQUFULFNBQVMsUUFFYjtJQUVEOzs7T0FHRztJQUNJLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxzQkFBVTtRQU83QyxJQUFZLFdBQVc7WUFDdEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLFlBQWEsQ0FBQztRQUMzQixDQUFDO1FBQ0QsSUFBWSxNQUFNO1lBQ2pCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixPQUFPLElBQUksQ0FBQyxPQUFRLENBQUM7UUFDdEIsQ0FBQztRQUNEOzs7V0FHRztRQUNILElBQVksY0FBYztZQUN6QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVPLGNBQWM7WUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3RCLENBQUM7UUFDRixDQUFDO1FBbUNELFlBQ2tCLGVBQWdDLEVBQzFCLHFCQUE2RCxFQUN2RSxXQUF5QyxFQUN0QyxjQUErQztZQUUvRCxLQUFLLEVBQUUsQ0FBQztZQUxTLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNULDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDdEQsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDckIsbUJBQWMsR0FBZCxjQUFjLENBQWdC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