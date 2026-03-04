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
define(["require", "exports", "vs/base/common/event", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/platform/terminal/common/terminal", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/electron-sandbox/localPty", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/environment/electron-sandbox/shellEnvironmentService", "vs/workbench/services/history/common/history", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/platform/product/common/productService", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/browser/baseTerminalBackend", "vs/platform/native/common/native", "vs/base/parts/ipc/common/ipc.mp", "vs/base/parts/ipc/electron-sandbox/ipc.mp", "vs/base/parts/ipc/common/ipc", "vs/base/common/performance", "vs/workbench/services/lifecycle/common/lifecycle", "vs/base/common/async", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/decorators", "vs/base/common/stopwatch", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/terminal/common/terminalEnvironment"], function (require, exports, event_1, platform_1, configuration_1, instantiation_1, label_1, platform_2, storage_1, terminal_1, workspace_1, terminal_2, terminal_3, localPty_1, configurationResolver_1, shellEnvironmentService_1, history_1, terminalEnvironment, productService_1, environmentVariable_1, baseTerminalBackend_1, native_1, ipc_mp_1, ipc_mp_2, ipc_1, performance_1, lifecycle_1, async_1, statusbar_1, decorators_1, stopwatch_1, remoteAgentService_1, terminalEnvironment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalTerminalBackendContribution = void 0;
    let LocalTerminalBackendContribution = class LocalTerminalBackendContribution {
        static { this.ID = 'workbench.contrib.localTerminalBackend'; }
        constructor(instantiationService, terminalInstanceService) {
            const backend = instantiationService.createInstance(LocalTerminalBackend);
            platform_2.Registry.as(terminal_1.TerminalExtensions.Backend).registerTerminalBackend(backend);
            terminalInstanceService.didRegisterBackend(backend.remoteAuthority);
        }
    };
    exports.LocalTerminalBackendContribution = LocalTerminalBackendContribution;
    exports.LocalTerminalBackendContribution = LocalTerminalBackendContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, terminal_2.ITerminalInstanceService)
    ], LocalTerminalBackendContribution);
    let LocalTerminalBackend = class LocalTerminalBackend extends baseTerminalBackend_1.BaseTerminalBackend {
        /**
         * Communicate to the direct proxy (renderer<->ptyhost) if it's available, otherwise use the
         * indirect proxy (renderer<->main<->ptyhost). The latter may not need to actually launch the
         * pty host, for example when detecting profiles.
         */
        get _proxy() { return this._directProxy || this._localPtyService; }
        get whenReady() { return this._whenReady.p; }
        setReady() { this._whenReady.complete(); }
        constructor(workspaceContextService, _lifecycleService, logService, _localPtyService, _labelService, _shellEnvironmentService, _storageService, _configurationResolverService, _configurationService, _productService, _historyService, _terminalProfileResolverService, _environmentVariableService, historyService, _nativeHostService, statusBarService, _remoteAgentService) {
            super(_localPtyService, logService, historyService, _configurationResolverService, statusBarService, workspaceContextService);
            this._lifecycleService = _lifecycleService;
            this._localPtyService = _localPtyService;
            this._labelService = _labelService;
            this._shellEnvironmentService = _shellEnvironmentService;
            this._storageService = _storageService;
            this._configurationResolverService = _configurationResolverService;
            this._configurationService = _configurationService;
            this._productService = _productService;
            this._historyService = _historyService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._environmentVariableService = _environmentVariableService;
            this._nativeHostService = _nativeHostService;
            this._remoteAgentService = _remoteAgentService;
            this.remoteAuthority = undefined;
            this._ptys = new Map();
            this._whenReady = new async_1.DeferredPromise();
            this._onDidRequestDetach = this._register(new event_1.Emitter());
            this.onDidRequestDetach = this._onDidRequestDetach.event;
            this._register(this.onPtyHostRestart(() => {
                this._directProxy = undefined;
                this._directProxyClientEventually = undefined;
                this._connectToDirectProxy();
            }));
        }
        /**
         * Request a direct connection to the pty host, this will launch the pty host process if necessary.
         */
        async _connectToDirectProxy() {
            // Check if connecting is in progress
            if (this._directProxyClientEventually) {
                await this._directProxyClientEventually.p;
                return;
            }
            this._logService.debug('Starting pty host');
            const directProxyClientEventually = new async_1.DeferredPromise();
            this._directProxyClientEventually = directProxyClientEventually;
            const directProxy = ipc_1.ProxyChannel.toService((0, ipc_1.getDelayedChannel)(this._directProxyClientEventually.p.then(client => client.getChannel(terminal_1.TerminalIpcChannels.PtyHostWindow))));
            this._directProxy = directProxy;
            // The pty host should not get launched until at least the window restored phase
            // if remote auth exists, don't await
            if (!this._remoteAgentService.getConnection()?.remoteAuthority) {
                await this._lifecycleService.when(3 /* LifecyclePhase.Restored */);
            }
            (0, performance_1.mark)('code/terminal/willConnectPtyHost');
            this._logService.trace('Renderer->PtyHost#connect: before acquirePort');
            (0, ipc_mp_2.acquirePort)('vscode:createPtyHostMessageChannel', 'vscode:createPtyHostMessageChannelResult').then(port => {
                (0, performance_1.mark)('code/terminal/didConnectPtyHost');
                this._logService.trace('Renderer->PtyHost#connect: connection established');
                // There are two connections to the pty host; one to the regular shared process
                // _localPtyService, and one directly via message port _ptyHostDirectProxy. The former is
                // used for pty host management messages, it would make sense in the future to use a
                // separate interface/service for this one.
                const client = new ipc_mp_1.Client(port, `window:${this._nativeHostService.windowId}`);
                directProxyClientEventually.complete(client);
                this._onPtyHostConnected.fire();
                // Attach process listeners
                directProxy.onProcessData(e => this._ptys.get(e.id)?.handleData(e.event));
                directProxy.onDidChangeProperty(e => this._ptys.get(e.id)?.handleDidChangeProperty(e.property));
                directProxy.onProcessExit(e => {
                    const pty = this._ptys.get(e.id);
                    if (pty) {
                        pty.handleExit(e.event);
                        this._ptys.delete(e.id);
                    }
                });
                directProxy.onProcessReady(e => this._ptys.get(e.id)?.handleReady(e.event));
                directProxy.onProcessReplay(e => this._ptys.get(e.id)?.handleReplay(e.event));
                directProxy.onProcessOrphanQuestion(e => this._ptys.get(e.id)?.handleOrphanQuestion());
                directProxy.onDidRequestDetach(e => this._onDidRequestDetach.fire(e));
                // Listen for config changes
                const initialConfig = this._configurationService.getValue(terminal_3.TERMINAL_CONFIG_SECTION);
                for (const match of Object.keys(initialConfig.autoReplies)) {
                    // Ensure the reply is value
                    const reply = initialConfig.autoReplies[match];
                    if (reply) {
                        directProxy.installAutoReply(match, reply);
                    }
                }
                // TODO: Could simplify update to a single call
                this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                    if (e.affectsConfiguration("terminal.integrated.autoReplies" /* TerminalSettingId.AutoReplies */)) {
                        directProxy.uninstallAllAutoReplies();
                        const config = this._configurationService.getValue(terminal_3.TERMINAL_CONFIG_SECTION);
                        for (const match of Object.keys(config.autoReplies)) {
                            // Ensure the reply is value
                            const reply = config.autoReplies[match];
                            if (reply) {
                                this._proxy.installAutoReply(match, reply);
                            }
                        }
                    }
                }));
                // Eagerly fetch the backend's environment for memoization
                this.getEnvironment();
            });
        }
        async requestDetachInstance(workspaceId, instanceId) {
            return this._proxy.requestDetachInstance(workspaceId, instanceId);
        }
        async acceptDetachInstanceReply(requestId, persistentProcessId) {
            if (!persistentProcessId) {
                this._logService.warn('Cannot attach to feature terminals, custom pty terminals, or those without a persistentProcessId');
                return;
            }
            return this._proxy.acceptDetachInstanceReply(requestId, persistentProcessId);
        }
        async persistTerminalState() {
            const ids = Array.from(this._ptys.keys());
            const serialized = await this._proxy.serializeTerminalState(ids);
            this._storageService.store("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, serialized, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async updateTitle(id, title, titleSource) {
            await this._proxy.updateTitle(id, title, titleSource);
        }
        async updateIcon(id, userInitiated, icon, color) {
            await this._proxy.updateIcon(id, userInitiated, icon, color);
        }
        async updateProperty(id, property, value) {
            return this._proxy.updateProperty(id, property, value);
        }
        async createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, options, shouldPersist) {
            await this._connectToDirectProxy();
            const executableEnv = await this._shellEnvironmentService.getShellEnv();
            const id = await this._proxy.createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, this._getWorkspaceId(), this._getWorkspaceName());
            const pty = new localPty_1.LocalPty(id, shouldPersist, this._proxy);
            this._ptys.set(id, pty);
            return pty;
        }
        async attachToProcess(id) {
            await this._connectToDirectProxy();
            try {
                await this._proxy.attachToProcess(id);
                const pty = new localPty_1.LocalPty(id, true, this._proxy);
                this._ptys.set(id, pty);
                return pty;
            }
            catch (e) {
                this._logService.warn(`Couldn't attach to process ${e.message}`);
            }
            return undefined;
        }
        async attachToRevivedProcess(id) {
            await this._connectToDirectProxy();
            try {
                const newId = await this._proxy.getRevivedPtyNewId(this._getWorkspaceId(), id) ?? id;
                return await this.attachToProcess(newId);
            }
            catch (e) {
                this._logService.warn(`Couldn't attach to process ${e.message}`);
            }
            return undefined;
        }
        async listProcesses() {
            await this._connectToDirectProxy();
            return this._proxy.listProcesses();
        }
        async getLatency() {
            const measurements = [];
            const sw = new stopwatch_1.StopWatch();
            if (this._directProxy) {
                await this._directProxy.getLatency();
                sw.stop();
                measurements.push({
                    label: 'window<->ptyhost (message port)',
                    latency: sw.elapsed()
                });
                sw.reset();
            }
            const results = await this._localPtyService.getLatency();
            sw.stop();
            measurements.push({
                label: 'window<->ptyhostservice<->ptyhost',
                latency: sw.elapsed()
            });
            return [
                ...measurements,
                ...results
            ];
        }
        async getPerformanceMarks() {
            return this._proxy.getPerformanceMarks();
        }
        async reduceConnectionGraceTime() {
            this._proxy.reduceConnectionGraceTime();
        }
        async getDefaultSystemShell(osOverride) {
            return this._proxy.getDefaultSystemShell(osOverride);
        }
        async getProfiles(profiles, defaultProfile, includeDetectedProfiles) {
            return this._localPtyService.getProfiles(this._workspaceContextService.getWorkspace().id, profiles, defaultProfile, includeDetectedProfiles) || [];
        }
        async getEnvironment() {
            return this._proxy.getEnvironment();
        }
        async getShellEnvironment() {
            return this._shellEnvironmentService.getShellEnv();
        }
        async getWslPath(original, direction) {
            return this._proxy.getWslPath(original, direction);
        }
        async setTerminalLayoutInfo(layoutInfo) {
            const args = {
                workspaceId: this._getWorkspaceId(),
                tabs: layoutInfo ? layoutInfo.tabs : []
            };
            await this._proxy.setTerminalLayoutInfo(args);
            // Store in the storage service as well to be used when reviving processes as normally this
            // is stored in memory on the pty host
            this._storageService.store("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, JSON.stringify(args), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async getTerminalLayoutInfo() {
            const workspaceId = this._getWorkspaceId();
            const layoutArgs = { workspaceId };
            // Revive processes if needed
            const serializedState = this._storageService.get("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, 1 /* StorageScope.WORKSPACE */);
            const reviveBufferState = this._deserializeTerminalState(serializedState);
            if (reviveBufferState && reviveBufferState.length > 0) {
                try {
                    // Create variable resolver
                    const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot();
                    const lastActiveWorkspace = activeWorkspaceRootUri ? this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
                    const variableResolver = terminalEnvironment.createVariableResolver(lastActiveWorkspace, await this._terminalProfileResolverService.getEnvironment(this.remoteAuthority), this._configurationResolverService);
                    // Re-resolve the environments and replace it on the state so local terminals use a fresh
                    // environment
                    (0, performance_1.mark)('code/terminal/willGetReviveEnvironments');
                    await Promise.all(reviveBufferState.map(state => new Promise(r => {
                        this._resolveEnvironmentForRevive(variableResolver, state.shellLaunchConfig).then(freshEnv => {
                            state.processLaunchConfig.env = freshEnv;
                            r();
                        });
                    })));
                    (0, performance_1.mark)('code/terminal/didGetReviveEnvironments');
                    (0, performance_1.mark)('code/terminal/willReviveTerminalProcesses');
                    await this._proxy.reviveTerminalProcesses(workspaceId, reviveBufferState, Intl.DateTimeFormat().resolvedOptions().locale);
                    (0, performance_1.mark)('code/terminal/didReviveTerminalProcesses');
                    this._storageService.remove("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, 1 /* StorageScope.WORKSPACE */);
                    // If reviving processes, send the terminal layout info back to the pty host as it
                    // will not have been persisted on application exit
                    const layoutInfo = this._storageService.get("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, 1 /* StorageScope.WORKSPACE */);
                    if (layoutInfo) {
                        (0, performance_1.mark)('code/terminal/willSetTerminalLayoutInfo');
                        await this._proxy.setTerminalLayoutInfo(JSON.parse(layoutInfo));
                        (0, performance_1.mark)('code/terminal/didSetTerminalLayoutInfo');
                        this._storageService.remove("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, 1 /* StorageScope.WORKSPACE */);
                    }
                }
                catch (e) {
                    this._logService.warn('LocalTerminalBackend#getTerminalLayoutInfo Error', e && typeof e === 'object' && 'message' in e ? e.message : e);
                }
            }
            return this._proxy.getTerminalLayoutInfo(layoutArgs);
        }
        async _resolveEnvironmentForRevive(variableResolver, shellLaunchConfig) {
            const platformKey = platform_1.isWindows ? 'windows' : (platform_1.isMacintosh ? 'osx' : 'linux');
            const envFromConfigValue = this._configurationService.getValue(`terminal.integrated.env.${platformKey}`);
            const baseEnv = await (shellLaunchConfig.useShellEnvironment ? this.getShellEnvironment() : this.getEnvironment());
            const env = await terminalEnvironment.createTerminalEnvironment(shellLaunchConfig, envFromConfigValue, variableResolver, this._productService.version, this._configurationService.getValue("terminal.integrated.detectLocale" /* TerminalSettingId.DetectLocale */), baseEnv);
            if ((0, terminalEnvironment_1.shouldUseEnvironmentVariableCollection)(shellLaunchConfig)) {
                const workspaceFolder = terminalEnvironment.getWorkspaceForTerminal(shellLaunchConfig.cwd, this._workspaceContextService, this._historyService);
                await this._environmentVariableService.mergedCollection.applyToProcessEnvironment(env, { workspaceFolder }, variableResolver);
            }
            return env;
        }
        _getWorkspaceName() {
            return this._labelService.getWorkspaceLabel(this._workspaceContextService.getWorkspace());
        }
    };
    __decorate([
        decorators_1.memoize
    ], LocalTerminalBackend.prototype, "getEnvironment", null);
    __decorate([
        decorators_1.memoize
    ], LocalTerminalBackend.prototype, "getShellEnvironment", null);
    LocalTerminalBackend = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, lifecycle_1.ILifecycleService),
        __param(2, terminal_1.ITerminalLogService),
        __param(3, terminal_1.ILocalPtyService),
        __param(4, label_1.ILabelService),
        __param(5, shellEnvironmentService_1.IShellEnvironmentService),
        __param(6, storage_1.IStorageService),
        __param(7, configurationResolver_1.IConfigurationResolverService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, productService_1.IProductService),
        __param(10, history_1.IHistoryService),
        __param(11, terminal_3.ITerminalProfileResolverService),
        __param(12, environmentVariable_1.IEnvironmentVariableService),
        __param(13, history_1.IHistoryService),
        __param(14, native_1.INativeHostService),
        __param(15, statusbar_1.IStatusbarService),
        __param(16, remoteAgentService_1.IRemoteAgentService)
    ], LocalTerminalBackend);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxUZXJtaW5hbEJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9lbGVjdHJvbi1zYW5kYm94L2xvY2FsVGVybWluYWxCYWNrZW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNDekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBZ0M7aUJBRTVCLE9BQUUsR0FBRyx3Q0FBd0MsQUFBM0MsQ0FBNEM7UUFFOUQsWUFDd0Isb0JBQTJDLEVBQ3hDLHVCQUFpRDtZQUUzRSxNQUFNLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUMxRSxtQkFBUSxDQUFDLEVBQUUsQ0FBMkIsNkJBQWtCLENBQUMsT0FBTyxDQUFDLENBQUMsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkcsdUJBQXVCLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7O0lBWFcsNEVBQWdDOytDQUFoQyxnQ0FBZ0M7UUFLMUMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLG1DQUF3QixDQUFBO09BTmQsZ0NBQWdDLENBWTVDO0lBRUQsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSx5Q0FBbUI7UUFPckQ7Ozs7V0FJRztRQUNILElBQVksTUFBTSxLQUFrQixPQUFPLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUd4RixJQUFJLFNBQVMsS0FBb0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUQsUUFBUSxLQUFXLElBQUksQ0FBQyxVQUFVLENB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