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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalStrings", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/workspace/common/workspace", "vs/workbench/common/contextkeys", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/browser/terminalProfileQuickpick", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/contrib/terminal/browser/xterm/xtermTerminal", "vs/workbench/contrib/terminal/browser/terminalInstance", "vs/platform/keybinding/common/keybinding", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/services/timer/browser/timerService", "vs/base/common/performance", "vs/workbench/contrib/terminal/browser/detachedTerminal", "vs/workbench/contrib/terminal/browser/terminalEvents", "vs/base/browser/window"], function (require, exports, dom, async_1, decorators_1, event_1, lifecycle_1, network_1, platform_1, uri_1, nls, commands_1, configuration_1, contextkey_1, dialogs_1, instantiation_1, notification_1, terminal_1, terminalStrings_1, colorRegistry_1, iconRegistry_1, theme_1, themeService_1, themables_1, workspace_1, contextkeys_1, viewsService_1, terminal_2, terminalActions_1, terminalEditorInput_1, terminalIcon_1, terminalProfileQuickpick_1, terminalUri_1, terminal_3, terminalContextKey_1, editorGroupColumn_1, editorGroupsService_1, editorService_1, environmentService_1, extensions_1, lifecycle_2, remoteAgentService_1, xtermTerminal_1, terminalInstance_1, keybinding_1, terminalCapabilityStore_1, timerService_1, performance_1, detachedTerminal_1, terminalEvents_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalService = void 0;
    let TerminalService = class TerminalService extends lifecycle_1.Disposable {
        get isProcessSupportRegistered() { return !!this._processSupportContextKey.get(); }
        get connectionState() { return this._connectionState; }
        get whenConnected() { return this._whenConnected.p; }
        get restoredGroupCount() { return this._restoredGroupCount; }
        get instances() {
            return this._terminalGroupService.instances.concat(this._terminalEditorService.instances).concat(this._backgroundedTerminalInstances);
        }
        get detachedInstances() {
            return this._detachedXterms;
        }
        getReconnectedTerminals(reconnectionOwner) {
            return this._reconnectedTerminals.get(reconnectionOwner);
        }
        get defaultLocation() { return this._terminalConfigurationService.config.defaultLocation === "editor" /* TerminalLocationString.Editor */ ? terminal_1.TerminalLocation.Editor : terminal_1.TerminalLocation.Panel; }
        get activeInstance() {
            // Check if either an editor or panel terminal has focus and return that, regardless of the
            // value of _activeInstance. This avoids terminals created in the panel for example stealing
            // the active status even when it's not focused.
            for (const activeHostTerminal of this._hostActiveTerminals.values()) {
                if (activeHostTerminal?.hasFocus) {
                    return activeHostTerminal;
                }
            }
            // Fallback to the last recorded active terminal if neither have focus
            return this._activeInstance;
        }
        get onDidCreateInstance() { return this._onDidCreateInstance.event; }
        get onDidChangeInstanceDimensions() { return this._onDidChangeInstanceDimensions.event; }
        get onDidRegisterProcessSupport() { return this._onDidRegisterProcessSupport.event; }
        get onDidChangeConnectionState() { return this._onDidChangeConnectionState.event; }
        get onDidRequestStartExtensionTerminal() { return this._onDidRequestStartExtensionTerminal.event; }
        get onDidDisposeInstance() { return this._onDidDisposeInstance.event; }
        get onDidFocusInstance() { return this._onDidFocusInstance.event; }
        get onDidChangeActiveInstance() { return this._onDidChangeActiveInstance.event; }
        get onDidChangeInstances() { return this._onDidChangeInstances.event; }
        get onDidChangeInstanceCapability() { return this._onDidChangeInstanceCapability.event; }
        get onDidChangeActiveGroup() { return this._onDidChangeActiveGroup.event; }
        // Lazily initialized events that fire when the specified event fires on _any_ terminal
        // TODO: Batch events
        get onAnyInstanceData() { return this._register(this.createOnInstanceEvent(instance => event_1.Event.map(instance.onData, data => ({ instance, data })))).event; }
        get onAnyInstanceDataInput() { return this._register(this.createOnInstanceEvent(e => e.onDidInputData)).event; }
        get onAnyInstanceIconChange() { return this._register(this.createOnInstanceEvent(e => e.onIconChanged)).event; }
        get onAnyInstanceMaximumDimensionsChange() { return this._register(this.createOnInstanceEvent(e => event_1.Event.map(e.onMaximumDimensionsChanged, () => e, e.store))).event; }
        get onAnyInstancePrimaryStatusChange() { return this._register(this.createOnInstanceEvent(e => event_1.Event.map(e.statusList.onDidChangePrimaryStatus, () => e, e.store))).event; }
        get onAnyInstanceProcessIdReady() { return this._register(this.createOnInstanceEvent(e => e.onProcessIdReady)).event; }
        get onAnyInstanceSelectionChange() { return this._register(this.createOnInstanceEvent(e => e.onDidChangeSelection)).event; }
        get onAnyInstanceTitleChange() { return this._register(this.createOnInstanceEvent(e => e.onTitleChanged)).event; }
        constructor(_contextKeyService, _lifecycleService, _logService, _dialogService, _instantiationService, _remoteAgentService, _viewsService, _configurationService, _terminalConfigService, _environmentService, _terminalConfigurationService, _terminalEditorService, _terminalGroupService, _terminalInstanceService, _editorGroupsService, _terminalProfileService, _extensionService, _notificationService, _workspaceContextService, _commandService, _keybindingService, _timerService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._lifecycleService = _lifecycleService;
            this._logService = _logService;
            this._dialogService = _dialogService;
            this._instantiationService = _instantiationService;
            this._remoteAgentService = _remoteAgentService;
            this._viewsService = _viewsService;
            this._configurationService = _configurationService;
            this._terminalConfigService = _terminalConfigService;
            this._environmentService = _environmentService;
            this._terminalConfigurationService = _terminalConfigurationService;
            this._terminalEditorService = _terminalEditorService;
            this._terminalGroupService = _terminalGroupService;
            this._terminalInstanceService = _terminalInstanceService;
            this._editorGroupsService = _editorGroupsService;
            this._terminalProfileService = _terminalProfileService;
            this._extensionService = _extensionService;
            this._notificationService = _notificationService;
            this._workspaceContextService = _workspaceContextService;
            this._commandService = _commandService;
            this._keybindingService = _keybindingService;
            this._timerService = _timerService;
            this._hostActiveTerminals = new Map();
            this._detachedXterms = new Set();
            this._isShuttingDown = false;
            this._backgroundedTerminalInstances = [];
            this._backgroundedTerminalDisposables = new Map();
            this._connectionState = 0 /* TerminalConnectionState.Connecting */;
            this._whenConnected = new async_1.DeferredPromise();
            this._restoredGroupCount = 0;
            this._reconnectedTerminals = new Map();
            this._onDidCreateInstance = this._register(new event_1.Emitter());
            this._onDidChangeInstanceDimensions = this._register(new event_1.Emitter());
            this._onDidRegisterProcessSupport = this._register(new event_1.Emitter());
            this._onDidChangeConnectionState = this._register(new event_1.Emitter());
            this._onDidRequestStartExtensionTerminal = this._register(new event_1.Emitter());
            // ITerminalInstanceHost events
            this._onDidDisposeInstance = this._register(new event_1.Emitter());
            this._onDidFocusInstance = this._register(new event_1.Emitter());
            this._onDidChangeActiveInstance = this._register(new event_1.Emitter());
            this._onDidChangeInstances = this._register(new event_1.Emitter());
            this._onDidChangeInstanceCapability = this._register(new event_1.Emitter());
            // Terminal view events
            this._onDidChangeActiveGroup = this._register(new event_1.Emitter());
            // the below avoids having to poll routinely.
            // we update detected profiles when an instance is created so that,
            // for example, we detect if you've installed a pwsh
            this._register(this.onDidCreateInstance(() => this._terminalProfileService.refreshAvailableProfiles()));
            this._forwardInstanceHostEvents(this._terminalGroupService);
            this._forwardInstanceHostEvents(this._terminalEditorService);
            this._register(this._terminalGroupService.onDidChangeActiveGroup(this._onDidChangeActiveGroup.fire, this._onDidChangeActiveGroup));
            this._register(this._terminalInstanceService.onDidCreateInstance(instance => {
                this._initInstanceListeners(instance);
                this._onDidCreateInstance.fire(instance);
            }));
            // Hide the panel if there are no more instances, provided that VS Code is not shutting
            // down. When shutting down the panel is locked in place so that it is restored upon next
            // launch.
            this._register(this._terminalGroupService.onDidChangeActiveInstance(instance => {
                if (!instance && !this._isShuttingDown) {
                    this._terminalGroupService.hidePanel();
                }
                if (instance?.shellType) {
                    this._terminalShellTypeContextKey.set(instance.shellType.toString());
                }
                else if (!instance) {
                    this._terminalShellTypeContextKey.reset();
                }
            }));
            this._handleInstanceContextKeys();
            this._terminalShellTypeContextKey = terminalContextKey_1.TerminalContextKeys.shellType.bindTo(this._contextKeyService);
            this._processSupportContextKey = terminalContextKey_1.TerminalContextKeys.processSupported.bindTo(this._contextKeyService);
            this._processSupportContextKey.set(!platform_1.isWeb || this._remoteAgentService.getConnection() !== null);
            this._terminalHasBeenCreated = terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated.bindTo(this._contextKeyService);
            this._terminalCountContextKey = terminalContextKey_1.TerminalContextKeys.count.bindTo(this._contextKeyService);
            this._terminalEditorActive = terminalContextKey_1.TerminalContextKeys.terminalEditorActive.bindTo(this._contextKeyService);
            this._register(this.onDidChangeActiveInstance(instance => {
                this._terminalEditorActive.set(!!instance?.target && instance.target === terminal_1.TerminalLocation.Editor);
            }));
            this._register(_lifecycleService.onBeforeShutdown(async (e) => e.veto(this._onBeforeShutdown(e.reason), 'veto.terminal')));
            this._register(_lifecycleService.onWillShutdown(e => this._onWillShutdown(e)));
            this._initializePrimaryBackend();
            // Create async as the class depends on `this`
            (0, async_1.timeout)(0).then(() => this._register(this._instantiationService.createInstance(TerminalEditorStyle, window_1.mainWindow.document.head)));
        }
        async showProfileQuickPick(type, cwd) {
            const quickPick = this._instantiationService.createInstance(terminalProfileQuickpick_1.TerminalProfileQuickpick);
            const result = await quickPick.showAndGetResult(type);
            if (!result) {
                return;
            }
            if (typeof result === 'string') {
                return;
            }
            const keyMods = result.keyMods;
            if (type === 'createInstance') {
                const activeInstance = this.getDefaultInstanceHost().activeInstance;
                let instance;
                if (result.config && 'id' in result?.config) {
                    await this.createContributedTerminalProfile(result.config.extensionIdentifier, result.config.id, {
                        icon: result.config.options?.icon,
                        color: result.config.options?.color,
                        location: !!(keyMods?.alt && activeInstance) ? { splitActiveTerminal: true } : this.defaultLocation
                    });
                    return;
                }
                else if (result.config && 'profileName' in result.config) {
                    if (keyMods?.alt && activeInstance) {
                        // create split, only valid if there's an active instance
                        instance = await this.createTerminal({ location: { parentTerminal: activeInstance }, config: result.config, cwd });
                    }
                    else {
                        instance = await this.createTerminal({ location: this.defaultLocation, config: result.config, cwd });
                    }
                }
                if (instance && this.defaultLocation !== terminal_1.TerminalLocation.Editor) {
                    this._terminalGroupService.showPanel(true);
                    this.setActiveInstance(instance);
                    return instance;
                }
            }
            return undefined;
        }
        async _initializePrimaryBackend() {
            (0, performance_1.mark)('code/terminal/willGetTerminalBackend');
            this._primaryBackend = await this._terminalInstanceService.getBackend(this._environmentService.remoteAuthority);
            (0, performance_1.mark)('code/terminal/didGetTerminalBackend');
            const enableTerminalReconnection = this._terminalConfigurationService.config.enablePersistentSessions;
            // Connect to the extension host if it's there, set the connection state to connected when
            // it's done. This should happen even when there is no extension host.
            this._connectionState = 0 /* TerminalConnectionState.Connecting */;
            const isPersistentRemote = !!this._environmentService.remoteAuthority && enableTerminalReconnection;
            this._primaryBackend?.onDidRequestDetach(async (e) => {
                const instanceToDetach = this.getInstanceFromResource((0, terminalUri_1.getTerminalUri)(e.workspaceId, e.instanceId));
                if (instanceToDetach) {
                    const persistentProcessId = instanceToDetach?.persistentProcessId;
                    if (persistentProcessId && !instanceToDetach.shellLaunchConfig.isFeatureTerminal && !instanceToDetach.shellLaunchConfig.customPtyImplementation) {
                        if (instanceToDetach.target === terminal_1.TerminalLocation.Editor) {
                            this._terminalEditorService.detachInstance(instanceToDetach);
                        }
                        else {
                            this._terminalGroupService.getGroupForInstance(instanceToDetach)?.removeInstance(instanceToDetach);
                        }
                        await instanceToDetach.detachProcessAndDispose(terminal_1.TerminalExitReason.User);
                        await this._primaryBackend?.acceptDetachInstanceReply(e.requestId, persistentProcessId);
                    }
                    else {
                        // will get rejected without a persistentProcessId to attach to
                        await this._primaryBackend?.acceptDetachInstanceReply(e.requestId, undefined);
                    }
                }
            });
            (0, performance_1.mark)('code/terminal/willReconnect');
            let reconnectedPromise;
            if (isPersistentRemote) {
                reconnectedPromise = this._reconnectToRemoteTerminals();
            }
            else if (enableTerminalReconnection) {
                reconnectedPromise = this._reconnectToLocalTerminals();
            }
            else {
                reconnectedPromise = Promise.resolve();
            }
            reconnectedPromise.then(async () => {
                this._setConnected();
                (0, performance_1.mark)('code/terminal/didReconnect');
                (0, performance_1.mark)('code/terminal/willReplay');
                const instances = await this._reconnectedTerminalGroups?.then(groups => groups.map(e => e.terminalInstances).flat()) ?? [];
                await Promise.all(instances.map(e => new Promise(r => event_1.Event.once(e.onProcessReplayComplete)(r))));
                (0, performance_1.mark)('code/terminal/didReplay');
                (0, performance_1.mark)('code/terminal/willGetPerformanceMarks');
                await Promise.all(Array.from(this._terminalInstanceService.getRegisteredBackends()).map(async (backend) => {
                    this._timerService.setPerformanceMarks(backend.remoteAuthority === undefined ? 'localPtyHost' : 'remotePtyHost', await backend.getPerformanceMarks());
                    backend.setReady();
                }));
                (0, performance_1.mark)('code/terminal/didGetPerformanceMarks');
                this._whenConnected.complete();
            });
        }
        getPrimaryBackend() {
            return this._primaryBackend;
        }
        _forwardInstanceHostEvents(host) {
            host.onDidChangeInstances(this._onDidChangeInstances.fire, this._onDidChangeInstances);
            host.onDidDisposeInstance(this._onDidDisposeInstance.fire, this._onDidDisposeInstance);
            host.onDidChangeActiveInstance(instance => this._evaluateActiveInstance(host, instance));
            host.onDidFocusInstance(instance => {
                this._onDidFocusInstance.fire(instance);
                this._evaluateActiveInstance(host, instance);
            });
            host.onDidChangeInstanceCapability((instance) => {
                this._onDidChangeInstanceCapability.fire(instance);
            });
            this._hostActiveTerminals.set(host, undefined);
        }
        _evaluateActiveInstance(host, instance) {
            // Track the latest active terminal for each host so that when one becomes undefined, the
            // TerminalService's active terminal is set to the last active terminal from the other host.
            // This means if the last terminal editor is closed such that it becomes undefined, the last
            // active group's terminal will be used as the active terminal if available.
            this._hostActiveTerminals.set(host, instance);
            if (instance === undefined) {
                for (const active of this._hostActiveTerminals.values()) {
                    if (active) {
                        instance = active;
                    }
                }
            }
            this._activeInstance = instance;
            this._onDidChangeActiveInstance.fire(instance);
        }
        setActiveInstance(value) {
            // If this was a hideFromUser terminal created by the API this was triggered by show,
            // in which case we need to create the terminal group
            if (value.shellLaunchConfig.hideFromUser) {
                this._showBackgroundTerminal(value);
            }
            if (value.target === terminal_1.TerminalLocation.Editor) {
                this._terminalEditorService.setActiveInstance(value);
            }
            else {
                this._terminalGroupService.setActiveInstance(value);
            }
        }
        async focusActiveInstance() {
            if (!this._activeInstance) {
                return;
            }
            if (this._activeInstance.target === terminal_1.TerminalLocation.Editor) {
                return this._terminalEditorService.focusActiveInstance();
            }
            return this._terminalGroupService.focusActiveInstance();
        }
        async createContributedTerminalProfile(extensionIdentifier, id, options) {
            await this._extensionService.activateByEvent(`onTerminalProfile:${id}`);
            const profileProvider = this._terminalProfileService.getContributedProfileProvider(extensionIdentifier, id);
            if (!profileProvider) {
                this._notificationService.error(`No terminal profile provider registered for id "${id}"`);
                return;
            }
            try {
                await profileProvider.createContributedTerminalProfile(options);
                this._terminalGroupService.setActiveInstanceByIndex(this._terminalGroupService.instances.length - 1);
                await this._terminalGroupService.activeInstance?.focusWhenReady();
            }
            catch (e) {
                this._notificationService.error(e.message);
            }
        }
        async safeDisposeTerminal(instance) {
            // Confirm on kill in the editor is handled by the editor input
            if (instance.target !== terminal_1.TerminalLocation.Editor &&
                instance.hasChildProcesses &&
                (this._terminalConfigurationService.config.confirmOnKill === 'panel' || this._terminalConfigurationService.config.confirmOnKill === 'always')) {
                const veto = await this._showTerminalCloseConfirmation(true);
                if (veto) {
                    return;
                }
            }
            return new Promise(r => {
                event_1.Event.once(instance.onExit)(() => r());
                instance.dispose(terminal_1.TerminalExitReason.User);
            });
        }
        _setConnected() {
            this._connectionState = 1 /* TerminalConnectionState.Connected */;
            this._onDidChangeConnectionState.fire();
            this._logService.trace('Pty host ready');
        }
        async _reconnectToRemoteTerminals() {
            const remoteAuthority = this._environmentService.remoteAuthority;
            if (!remoteAuthority) {
                return;
            }
            const backend = await this._terminalInstanceService.getBackend(remoteAuthority);
            if (!backend) {
                return;
            }
            (0, performance_1.mark)('code/terminal/willGetTerminalLayoutInfo');
            const layoutInfo = await backend.getTerminalLayoutInfo();
            (0, performance_1.mark)('code/terminal/didGetTerminalLayoutInfo');
            backend.reduceConnectionGraceTime();
            (0, performance_1.mark)('code/terminal/willRecreateTerminalGroups');
            await this._recreateTerminalGroups(layoutInfo);
            (0, performance_1.mark)('code/terminal/didRecreateTerminalGroups');
            // now that terminals have been restored,
            // attach listeners to update remote when terminals are changed
            this._attachProcessLayoutListeners();
            this._logService.trace('Reconnected to remote terminals');
        }
        async _reconnectToLocalTerminals() {
            const localBackend = await this._terminalInstanceService.getBackend();
            if (!localBackend) {
                return;
            }
            (0, performance_1.mark)('code/terminal/willGetTerminalLayoutInfo');
            const layoutInfo = await localBackend.getTerminalLayoutInfo();
            (0, performance_1.mark)('code/terminal/didGetTerminalLayoutInfo');
            if (layoutInfo && layoutInfo.tabs.length > 0) {
                (0, performance_1.mark)('code/terminal/willRecreateTerminalGroups');
                this._reconnectedTerminalGroups = this._recreateTerminalGroups(layoutInfo);
                (0, performance_1.mark)('code/terminal/didRecreateTerminalGroups');
            }
            // now that terminals have been restored,
            // attach listeners to update local state when terminals are changed
            this._attachProcessLayoutListeners();
            this._logService.trace('Reconnected to local terminals');
        }
        _recreateTerminalGroups(layoutInfo) {
            const groupPromises = [];
            let activeGroup;
            if (layoutInfo) {
                for (const tabLayout of layoutInfo.tabs) {
                    const terminalLayouts = tabLayout.terminals.filter(t => t.terminal && t.terminal.isOrphan);
                    if (terminalLayouts.length) {
                        this._restoredGroupCount += terminalLayouts.length;
                        const promise = this._recreateTerminalGroup(tabLayout, terminalLayouts);
                        groupPromises.push(promise);
                        if (tabLayout.isActive) {
                            activeGroup = promise;
                        }
                        const activeInstance = this.instances.find(t => t.shellLaunchConfig.attachPersistentProcess?.id === tabLayout.activePersistentProcessId);
                        if (activeInstance) {
                            this.setActiveInstance(activeInstance);
                        }
                    }
                }
                if (layoutInfo.tabs.length) {
                    activeGroup?.then(group => this._terminalGroupService.activeGroup = group);
                }
            }
            return Promise.all(groupPromises).then(result => result.filter(e => !!e));
        }
        async _recreateTerminalGroup(tabLayout, terminalLayouts) {
            let lastInstance;
            for (const terminalLayout of terminalLayouts) {
                const attachPersistentProcess = terminalLayout.terminal;
                if (this._lifecycleService.startupKind !== 3 /* StartupKind.ReloadedWindow */ && attachPersistentProcess.type === 'Task') {
                    continue;
                }
                (0, performance_1.mark)(`code/terminal/willRecreateTerminal/${attachPersistentProcess.id}-${attachPersistentProcess.pid}`);
                lastInstance = this.createTerminal({
                    config: { attachPersistentProcess },
                    location: lastInstance ? { parentTerminal: lastInstance } : terminal_1.TerminalLocation.Panel
                });
                lastInstance.then(() => (0, performance_1.mark)(`code/terminal/didRecreateTerminal/${attachPersistentProcess.id}-${attachPersistentProcess.pid}`));
            }
            const group = lastInstance?.then(instance => {
                const g = this._terminalGroupService.getGroupForInstance(instance);
                g?.resizePanes(tabLayout.terminals.map(terminal => terminal.relativeSize));
                return g;
            });
            return group;
        }
        _attachProcessLayoutListeners() {
            this._register(this.onDidChangeActiveGroup(() => this._saveState()));
            this._register(this.onDidChangeActiveInstance(() => this._saveState()));
            this._register(this.onDidChangeInstances(() => this._saveState()));
            // The state must be updated when the terminal is relaunched, otherwise the persistent
            // terminal ID will be stale and the process will be leaked.
            this._register(this.onAnyInstanceProcessIdReady(() => this._saveState()));
            this._register(this.onAnyInstanceTitleChange(instance => this._updateTitle(instance)));
            this._register(this.onAnyInstanceIconChange(e => this._updateIcon(e.instance, e.userInitiated)));
        }
        _handleInstanceContextKeys() {
            const terminalIsOpenContext = terminalContextKey_1.TerminalContextKeys.isOpen.bindTo(this._contextKeyService);
            const updateTerminalContextKeys = () => {
                terminalIsOpenContext.set(this.instances.length > 0);
                this._terminalCountContextKey.set(this.instances.length);
            };
            this._register(this.onDidChangeInstances(() => updateTerminalContextKeys()));
        }
        async getActiveOrCreateInstance(options) {
            const activeInstance = this.activeInstance;
            // No instance, create
            if (!activeInstance) {
                return this.createTerminal();
            }
            // Active instance, ensure accepts input
            if (!options?.acceptsInput || activeInstance.xterm?.isStdinDisabled !== true) {
                return activeInstance;
            }
            // Active instance doesn't accept input, create and focus
            const instance = await this.createTerminal();
            this.setActiveInstance(instance);
            await this.revealActiveTerminal();
            return instance;
        }
        async revealActiveTerminal(preserveFocus) {
            const instance = this.activeInstance;
            if (!instance) {
                return;
            }
            if (instance.target === terminal_1.TerminalLocation.Editor) {
                await this._terminalEditorService.revealActiveEditor(preserveFocus);
            }
            else {
                await this._terminalGroupService.showPanel();
            }
        }
        setEditable(instance, data) {
            if (!data) {
                this._editable = undefined;
            }
            else {
                this._editable = { instance: instance, data };
            }
            const pane = this._viewsService.getActiveViewWithId(terminal_3.TERMINAL_VIEW_ID);
            const isEditing = this.isEditable(instance);
            pane?.terminalTabbedView?.setEditable(isEditing);
        }
        isEditable(instance) {
            return !!this._editable && (this._editable.instance === instance || !instance);
        }
        getEditableData(instance) {
            return this._editable && this._editable.instance === instance ? this._editable.data : undefined;
        }
        requestStartExtensionTerminal(proxy, cols, rows) {
            // The initial request came from the extension host, no need to wait for it
            return new Promise(callback => {
                this._onDidRequestStartExtensionTerminal.fire({ proxy, cols, rows, callback });
            });
        }
        _onBeforeShutdown(reason) {
            // Never veto on web as this would block all windows from being closed. This disables
            // process revive as we can't handle it on shutdown.
            if (platform_1.isWeb) {
                this._isShuttingDown = true;
                return false;
            }
            return this._onBeforeShutdownAsync(reason);
        }
        async _onBeforeShutdownAsync(reason) {
            if (this.instances.length === 0) {
                // No terminal instances, don't veto
                return false;
            }
            // Persist terminal _buffer state_, note that even if this happens the dirty terminal prompt
            // still shows as that cannot be revived
            try {
                this._shutdownWindowCount = await this._nativeDelegate?.getWindowCount();
                const shouldReviveProcesses = this._shouldReviveProcesses(reason);
                if (shouldReviveProcesses) {
                    // Attempt to persist the terminal state but only allow 2000ms as we can't block
                    // shutdown. This can happen when in a remote workspace but the other side has been
                    // suspended and is in the process of reconnecting, the message will be put in a
                    // queue in this case for when the connection is back up and running. Aborting the
                    // process is preferable in this case.
                    await Promise.race([
                        this._primaryBackend?.persistTerminalState(),
                        (0, async_1.timeout)(2000)
                    ]);
                }
                // Persist terminal _processes_
                const shouldPersistProcesses = this._terminalConfigurationService.config.enablePersistentSessions && reason === 3 /* ShutdownReason.RELOAD */;
                if (!shouldPersistProcesses) {
                    const hasDirtyInstances = ((this._terminalConfigurationService.config.confirmOnExit === 'always' && this.instances.length > 0) ||
                        (this._terminalConfigurationService.config.confirmOnExit === 'hasChildProcesses' && this.instances.some(e => e.hasChildProcesses)));
                    if (hasDirtyInstances) {
                        return this._onBeforeShutdownConfirmation(reason);
                    }
                }
            }
            catch (err) {
                // Swallow as exceptions should not cause a veto to prevent shutdown
                this._logService.warn('Exception occurred during terminal shutdown', err);
            }
            this._isShuttingDown = true;
            return false;
        }
        setNativeDelegate(nativeDelegate) {
            this._nativeDelegate = nativeDelegate;
        }
        _shouldReviveProcesses(reason) {
            if (!this._terminalConfigurationService.config.enablePersistentSessions) {
                return false;
            }
            switch (this._terminalConfigurationService.config.persistentSessionReviveProcess) {
                case 'onExit': {
                    // Allow on close if it's the last window on Windows or Linux
                    if (reason === 1 /* ShutdownReason.CLOSE */ && (this._shutdownWindowCount === 1 && !platform_1.isMacintosh)) {
                        return true;
                    }
                    return reason === 4 /* ShutdownReason.LOAD */ || reason === 2 /* ShutdownReason.QUIT */;
                }
                case 'onExitAndWindowClose': return reason !== 3 /* ShutdownReason.RELOAD */;
                default: return false;
            }
        }
        async _onBeforeShutdownConfirmation(reason) {
            // veto if configured to show confirmation and the user chose not to exit
            const veto = await this._showTerminalCloseConfirmation();
            if (!veto) {
                this._isShuttingDown = true;
            }
            return veto;
        }
        _onWillShutdown(e) {
            // Don't touch processes if the shutdown was a result of reload as they will be reattached
            const shouldPersistTerminals = this._terminalConfigurationService.config.enablePersistentSessions && e.reason === 3 /* ShutdownReason.RELOAD */;
            for (const instance of [...this._terminalGroupService.instances, ...this._backgroundedTerminalInstances]) {
                if (shouldPersistTerminals && instance.shouldPersist) {
                    instance.detachProcessAndDispose(terminal_1.TerminalExitReason.Shutdown);
                }
                else {
                    instance.dispose(terminal_1.TerminalExitReason.Shutdown);
                }
            }
            // Clear terminal layout info only when not persisting
            if (!shouldPersistTerminals && !this._shouldReviveProcesses(e.reason)) {
                this._primaryBackend?.setTerminalLayoutInfo(undefined);
            }
        }
        _saveState() {
            // Avoid saving state when shutting down as that would override process state to be revived
            if (this._isShuttingDown) {
                return;
            }
            if (!this._terminalConfigurationService.config.enablePersistentSessions) {
                return;
            }
            const tabs = this._terminalGroupService.groups.map(g => g.getLayoutInfo(g === this._terminalGroupService.activeGroup));
            const state = { tabs };
            this._primaryBackend?.setTerminalLayoutInfo(state);
        }
        _updateTitle(instance) {
            if (!this._terminalConfigurationService.config.enablePersistentSessions || !instance || !instance.persistentProcessId || !instance.title || instance.isDisposed) {
                return;
            }
            if (instance.staticTitle) {
                this._primaryBackend?.updateTitle(instance.persistentProcessId, instance.staticTitle, terminal_1.TitleEventSource.Api);
            }
            else {
                this._primaryBackend?.updateTitle(instance.persistentProcessId, instance.title, instance.titleSource);
            }
        }
        _updateIcon(instance, userInitiated) {
            if (!this._terminalConfigurationService.config.enablePersistentSessions || !instance || !instance.persistentProcessId || !instance.icon || instance.isDisposed) {
                return;
            }
            this._primaryBackend?.updateIcon(instance.persistentProcessId, userInitiated, instance.icon, instance.color);
        }
        refreshActiveGroup() {
            this._onDidChangeActiveGroup.fire(this._terminalGroupService.activeGroup);
        }
        getInstanceFromId(terminalId) {
            let bgIndex = -1;
            this._backgroundedTerminalInstances.forEach((terminalInstance, i) => {
                if (terminalInstance.instanceId === terminalId) {
                    bgIndex = i;
                }
            });
            if (bgIndex !== -1) {
                return this._backgroundedTerminalInstances[bgIndex];
            }
            try {
                return this.instances[this._getIndexFromId(terminalId)];
            }
            catch {
                return undefined;
            }
        }
        getInstanceFromIndex(terminalIndex) {
            return this.instances[terminalIndex];
        }
        getInstanceFromResource(resource) {
            return (0, terminalUri_1.getInstanceFromResource)(this.instances, resource);
        }
        isAttachedToTerminal(remoteTerm) {
            return this.instances.some(term => term.processId === remoteTerm.pid);
        }
        moveToEditor(source, group) {
            if (source.target === terminal_1.TerminalLocation.Editor) {
                return;
            }
            const sourceGroup = this._terminalGroupService.getGroupForInstance(source);
            if (!sourceGroup) {
                return;
            }
            sourceGroup.removeInstance(source);
            this._terminalEditorService.openEditor(source, group ? { viewColumn: group } : undefined);
        }
        moveIntoNewEditor(source) {
            this.moveToEditor(source, editorService_1.AUX_WINDOW_GROUP);
        }
        async moveToTerminalView(source, target, side) {
            if (uri_1.URI.isUri(source)) {
                source = this.getInstanceFromResource(source);
            }
            if (!source) {
                return;
            }
            this._terminalEditorService.detachInstance(source);
            if (source.target !== terminal_1.TerminalLocation.Editor) {
                await this._terminalGroupService.showPanel(true);
                return;
            }
            source.target = terminal_1.TerminalLocation.Panel;
            let group;
            if (target) {
                group = this._terminalGroupService.getGroupForInstance(target);
            }
            if (!group) {
                group = this._terminalGroupService.createGroup();
            }
            group.addInstance(source);
            this.setActiveInstance(source);
            await this._terminalGroupService.showPanel(true);
            if (target && side) {
                const index = group.terminalInstances.indexOf(target) + (side === 'after' ? 1 : 0);
                group.moveInstance(source, index);
            }
            // Fire events
            this._onDidChangeInstances.fire();
            this._onDidChangeActiveGroup.fire(this._terminalGroupService.activeGroup);
        }
        _initInstanceListeners(instance) {
            const instanceDisposables = [
                instance.onDimensionsChanged(() => {
                    this._onDidChangeInstanceDimensions.fire(instance);
                    if (this._terminalConfigurationService.config.enablePersistentSessions && this.isProcessSupportRegistered) {
                        this._saveState();
                    }
                }),
                instance.onDidFocus(this._onDidChangeActiveInstance.fire, this._onDidChangeActiveInstance),
                instance.onRequestAddInstanceToGroup(async (e) => await this._addInstanceToGroup(instance, e))
            ];
            instance.onDisposed(() => (0, lifecycle_1.dispose)(instanceDisposables));
        }
        async _addInstanceToGroup(instance, e) {
            const terminalIdentifier = (0, terminalUri_1.parseTerminalUri)(e.uri);
            if (terminalIdentifier.instanceId === undefined) {
                return;
            }
            let sourceInstance = this.getInstanceFromResource(e.uri);
            // Terminal from a different window
            if (!sourceInstance) {
                const attachPersistentProcess = await this._primaryBackend?.requestDetachInstance(terminalIdentifier.workspaceId, terminalIdentifier.instanceId);
                if (attachPersistentProcess) {
                    sourceInstance = await this.createTerminal({ config: { attachPersistentProcess }, resource: e.uri });
                    this._terminalGroupService.moveInstance(sourceInstance, instance, e.side);
                    return;
                }
            }
            // View terminals
            sourceInstance = this._terminalGroupService.getInstanceFromResource(e.uri);
            if (sourceInstance) {
                this._terminalGroupService.moveInstance(sourceInstance, instance, e.side);
                return;
            }
            // Terminal editors
            sourceInstance = this._terminalEditorService.getInstanceFromResource(e.uri);
            if (sourceInstance) {
                this.moveToTerminalView(sourceInstance, instance, e.side);
                return;
            }
            return;
        }
        registerProcessSupport(isSupported) {
            if (!isSupported) {
                return;
            }
            this._processSupportContextKey.set(isSupported);
            this._onDidRegisterProcessSupport.fire();
        }
        // TODO: Remove this, it should live in group/editor servioce
        _getIndexFromId(terminalId) {
            let terminalIndex = -1;
            this.instances.forEach((terminalInstance, i) => {
                if (terminalInstance.instanceId === terminalId) {
                    terminalIndex = i;
                }
            });
            if (terminalIndex === -1) {
                throw new Error(`Terminal with ID ${terminalId} does not exist (has it already been disposed?)`);
            }
            return terminalIndex;
        }
        async _showTerminalCloseConfirmation(singleTerminal) {
            let message;
            if (this.instances.length === 1 || singleTerminal) {
                message = nls.localize('terminalService.terminalCloseConfirmationSingular', "Do you want to terminate the active terminal session?");
            }
            else {
                message = nls.localize('terminalService.terminalCloseConfirmationPlural', "Do you want to terminate the {0} active terminal sessions?", this.instances.length);
            }
            const { confirmed } = await this._dialogService.confirm({
                type: 'warning',
                message,
                primaryButton: nls.localize({ key: 'terminate', comment: ['&& denotes a mnemonic'] }, "&&Terminate")
            });
            return !confirmed;
        }
        getDefaultInstanceHost() {
            if (this.defaultLocation === terminal_1.TerminalLocation.Editor) {
                return this._terminalEditorService;
            }
            return this._terminalGroupService;
        }
        async getInstanceHost(location) {
            if (location) {
                if (location === terminal_1.TerminalLocation.Editor) {
                    return this._terminalEditorService;
                }
                else if (typeof location === 'object') {
                    if ('viewColumn' in location) {
                        return this._terminalEditorService;
                    }
                    else if ('parentTerminal' in location) {
                        return (await location.parentTerminal).target === terminal_1.TerminalLocation.Editor ? this._terminalEditorService : this._terminalGroupService;
                    }
                }
                else {
                    return this._terminalGroupService;
                }
            }
            return this;
        }
        async createTerminal(options) {
            // Await the initialization of available profiles as long as this is not a pty terminal or a
            // local terminal in a remote workspace as profile won't be used in those cases and these
            // terminals need to be launched before remote connections are established.
            if (this._terminalProfileService.availableProfiles.length === 0) {
                const isPtyTerminal = options?.config && 'customPtyImplementation' in options.config;
                const isLocalInRemoteTerminal = this._remoteAgentService.getConnection() && uri_1.URI.isUri(options?.cwd) && options?.cwd.scheme === network_1.Schemas.vscodeFileResource;
                if (!isPtyTerminal && !isLocalInRemoteTerminal) {
                    if (this._connectionState === 0 /* TerminalConnectionState.Connecting */) {
                        (0, performance_1.mark)(`code/terminal/willGetProfiles`);
                    }
                    await this._terminalProfileService.profilesReady;
                    if (this._connectionState === 0 /* TerminalConnectionState.Connecting */) {
                        (0, performance_1.mark)(`code/terminal/didGetProfiles`);
                    }
                }
            }
            const config = options?.config || this._terminalProfileService.getDefaultProfile();
            const shellLaunchConfig = config && 'extensionIdentifier' in config ? {} : this._terminalInstanceService.convertProfileToShellLaunchConfig(config || {});
            // Get the contributed profile if it was provided
            const contributedProfile = options?.skipContributedProfileCheck ? undefined : await this._getContributedProfile(shellLaunchConfig, options);
            const splitActiveTerminal = typeof options?.location === 'object' && 'splitActiveTerminal' in options.location ? options.location.splitActiveTerminal : typeof options?.location === 'object' ? 'parentTerminal' in options.location : false;
            await this._resolveCwd(shellLaunchConfig, splitActiveTerminal, options);
            // Launch the contributed profile
            if (contributedProfile) {
                const resolvedLocation = await this.resolveLocation(options?.location);
                let location;
                if (splitActiveTerminal) {
                    location = resolvedLocation === terminal_1.TerminalLocation.Editor ? { viewColumn: editorService_1.SIDE_GROUP } : { splitActiveTerminal: true };
                }
                else {
                    location = typeof options?.location === 'object' && 'viewColumn' in options.location ? options.location : resolvedLocation;
                }
                await this.createContributedTerminalProfile(contributedProfile.extensionIdentifier, contributedProfile.id, {
                    icon: contributedProfile.icon,
                    color: contributedProfile.color,
                    location,
                    cwd: shellLaunchConfig.cwd,
                });
                const instanceHost = resolvedLocation === terminal_1.TerminalLocation.Editor ? this._terminalEditorService : this._terminalGroupService;
                const instance = instanceHost.instances[instanceHost.instances.length - 1];
                await instance?.focusWhenReady();
                this._terminalHasBeenCreated.set(true);
                return instance;
            }
            if (!shellLaunchConfig.customPtyImplementation && !this.isProcessSupportRegistered) {
                throw new Error('Could not create terminal when process support is not registered');
            }
            if (shellLaunchConfig.hideFromUser) {
                const instance = this._terminalInstanceService.createInstance(shellLaunchConfig, terminal_1.TerminalLocation.Panel);
                this._backgroundedTerminalInstances.push(instance);
                this._backgroundedTerminalDisposables.set(instance.instanceId, [
                    instance.onDisposed(this._onDidDisposeInstance.fire, this._onDidDisposeInstance)
                ]);
                this._terminalHasBeenCreated.set(true);
                return instance;
            }
            this._evaluateLocalCwd(shellLaunchConfig);
            const location = await this.resolveLocation(options?.location) || this.defaultLocation;
            const parent = await this._getSplitParent(options?.location);
            this._terminalHasBeenCreated.set(true);
            if (parent) {
                return this._splitTerminal(shellLaunchConfig, location, parent);
            }
            return this._createTerminal(shellLaunchConfig, location, options);
        }
        async _getContributedProfile(shellLaunchConfig, options) {
            if (options?.config && 'extensionIdentifier' in options.config) {
                return options.config;
            }
            return this._terminalProfileService.getContributedDefaultProfile(shellLaunchConfig);
        }
        async createDetachedTerminal(options) {
            const ctor = await terminalInstance_1.TerminalInstance.getXtermConstructor(this._keybindingService, this._contextKeyService);
            const xterm = this._instantiationService.createInstance(xtermTerminal_1.XtermTerminal, ctor, options.cols, options.rows, options.colorProvider, options.capabilities || new terminalCapabilityStore_1.TerminalCapabilityStore(), '', false);
            if (options.readonly) {
                xterm.raw.attachCustomKeyEventHandler(() => false);
            }
            const instance = new detachedTerminal_1.DetachedTerminal(xterm, options, this._instantiationService);
            this._detachedXterms.add(instance);
            const l = xterm.onDidDispose(() => {
                this._detachedXterms.delete(instance);
                l.dispose();
            });
            return instance;
        }
        async _resolveCwd(shellLaunchConfig, splitActiveTerminal, options) {
            const cwd = shellLaunchConfig.cwd;
            if (!cwd) {
                if (options?.cwd) {
                    shellLaunchConfig.cwd = options.cwd;
                }
                else if (splitActiveTerminal && options?.location) {
                    let parent = this.activeInstance;
                    if (typeof options.location === 'object' && 'parentTerminal' in options.location) {
                        parent = await options.location.parentTerminal;
                    }
                    if (!parent) {
                        throw new Error('Cannot split without an active instance');
                    }
                    shellLaunchConfig.cwd = await (0, terminalActions_1.getCwdForSplit)(parent, this._workspaceContextService.getWorkspace().folders, this._commandService, this._terminalConfigService);
                }
            }
        }
        _splitTerminal(shellLaunchConfig, location, parent) {
            let instance;
            // Use the URI from the base instance if it exists, this will correctly split local terminals
            if (typeof shellLaunchConfig.cwd !== 'object' && typeof parent.shellLaunchConfig.cwd === 'object') {
                shellLaunchConfig.cwd = uri_1.URI.from({
                    scheme: parent.shellLaunchConfig.cwd.scheme,
                    authority: parent.shellLaunchConfig.cwd.authority,
                    path: shellLaunchConfig.cwd || parent.shellLaunchConfig.cwd.path
                });
            }
            if (location === terminal_1.TerminalLocation.Editor || parent.target === terminal_1.TerminalLocation.Editor) {
                instance = this._terminalEditorService.splitInstance(parent, shellLaunchConfig);
            }
            else {
                const group = this._terminalGroupService.getGroupForInstance(parent);
                if (!group) {
                    throw new Error(`Cannot split a terminal without a group ${parent}`);
                }
                shellLaunchConfig.parentTerminalId = parent.instanceId;
                instance = group.split(shellLaunchConfig);
            }
            this._addToReconnected(instance);
            return instance;
        }
        _addToReconnected(instance) {
            if (!instance.reconnectionProperties?.ownerId) {
                return;
            }
            const reconnectedTerminals = this._reconnectedTerminals.get(instance.reconnectionProperties.ownerId);
            if (reconnectedTerminals) {
                reconnectedTerminals.push(instance);
            }
            else {
                this._reconnectedTerminals.set(instance.reconnectionProperties.ownerId, [instance]);
            }
        }
        _createTerminal(shellLaunchConfig, location, options) {
            let instance;
            const editorOptions = this._getEditorOptions(options?.location);
            if (location === terminal_1.TerminalLocation.Editor) {
                instance = this._terminalInstanceService.createInstance(shellLaunchConfig, terminal_1.TerminalLocation.Editor);
                this._terminalEditorService.openEditor(instance, editorOptions);
            }
            else {
                // TODO: pass resource?
                const group = this._terminalGroupService.createGroup(shellLaunchConfig);
                instance = group.terminalInstances[0];
            }
            this._addToReconnected(instance);
            return instance;
        }
        async resolveLocation(location) {
            if (location && typeof location === 'object') {
                if ('parentTerminal' in location) {
                    // since we don't set the target unless it's an editor terminal, this is necessary
                    const parentTerminal = await location.parentTerminal;
                    return !parentTerminal.target ? terminal_1.TerminalLocation.Panel : parentTerminal.target;
                }
                else if ('viewColumn' in location) {
                    return terminal_1.TerminalLocation.Editor;
                }
                else if ('splitActiveTerminal' in location) {
                    // since we don't set the target unless it's an editor terminal, this is necessary
                    return !this._activeInstance?.target ? terminal_1.TerminalLocation.Panel : this._activeInstance?.target;
                }
            }
            return location;
        }
        async _getSplitParent(location) {
            if (location && typeof location === 'object' && 'parentTerminal' in location) {
                return location.parentTerminal;
            }
            else if (location && typeof location === 'object' && 'splitActiveTerminal' in location) {
                return this.activeInstance;
            }
            return undefined;
        }
        _getEditorOptions(location) {
            if (location && typeof location === 'object' && 'viewColumn' in location) {
                location.viewColumn = (0, editorGroupColumn_1.columnToEditorGroup)(this._editorGroupsService, this._configurationService, location.viewColumn);
                return location;
            }
            return undefined;
        }
        _evaluateLocalCwd(shellLaunchConfig) {
            // Add welcome message and title annotation for local terminals launched within remote or
            // virtual workspaces
            if (typeof shellLaunchConfig.cwd !== 'string' && shellLaunchConfig.cwd?.scheme === network_1.Schemas.file) {
                if (contextkeys_1.VirtualWorkspaceContext.getValue(this._contextKeyService)) {
                    shellLaunchConfig.initialText = (0, terminalStrings_1.formatMessageForTerminal)(nls.localize('localTerminalVirtualWorkspace', "This shell is open to a {0}local{1} folder, NOT to the virtual folder", '\x1b[3m', '\x1b[23m'), { excludeLeadingNewLine: true, loudFormatting: true });
                    shellLaunchConfig.type = 'Local';
                }
                else if (this._remoteAgentService.getConnection()) {
                    shellLaunchConfig.initialText = (0, terminalStrings_1.formatMessageForTerminal)(nls.localize('localTerminalRemote', "This shell is running on your {0}local{1} machine, NOT on the connected remote machine", '\x1b[3m', '\x1b[23m'), { excludeLeadingNewLine: true, loudFormatting: true });
                    shellLaunchConfig.type = 'Local';
                }
            }
        }
        _showBackgroundTerminal(instance) {
            this._backgroundedTerminalInstances.splice(this._backgroundedTerminalInstances.indexOf(instance), 1);
            const disposables = this._backgroundedTerminalDisposables.get(instance.instanceId);
            if (disposables) {
                (0, lifecycle_1.dispose)(disposables);
            }
            this._backgroundedTerminalDisposables.delete(instance.instanceId);
            instance.shellLaunchConfig.hideFromUser = false;
            this._terminalGroupService.createGroup(instance);
            // Make active automatically if it's the first instance
            if (this.instances.length === 1) {
                this._terminalGroupService.setActiveInstanceByIndex(0);
            }
            this._onDidChangeInstances.fire();
        }
        async setContainers(panelContainer, terminalContainer) {
            this._terminalConfigurationService.setPanelContainer(panelContainer);
            this._terminalGroupService.setContainer(terminalContainer);
        }
        getEditingTerminal() {
            return this._editingTerminal;
        }
        setEditingTerminal(instance) {
            this._editingTerminal = instance;
        }
        createOnInstanceEvent(getEvent) {
            return new event_1.DynamicListEventMultiplexer(this.instances, this.onDidCreateInstance, this.onDidDisposeInstance, getEvent);
        }
        createOnInstanceCapabilityEvent(capabilityId, getEvent) {
            return (0, terminalEvents_1.createInstanceCapabilityEventMultiplexer)(this.instances, this.onDidCreateInstance, this.onDidDisposeInstance, capabilityId, getEvent);
        }
    };
    exports.TerminalService = TerminalService;
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceData", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceDataInput", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceIconChange", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceMaximumDimensionsChange", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstancePrimaryStatusChange", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceProcessIdReady", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceSelectionChange", null);
    __decorate([
        decorators_1.memoize
    ], TerminalService.prototype, "onAnyInstanceTitleChange", null);
    __decorate([
        (0, decorators_1.debounce)(500)
    ], TerminalService.prototype, "_saveState", null);
    __decorate([
        (0, decorators_1.debounce)(500)
    ], TerminalService.prototype, "_updateTitle", null);
    __decorate([
        (0, decorators_1.debounce)(500)
    ], TerminalService.prototype, "_updateIcon", null);
    exports.TerminalService = TerminalService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, terminal_1.ITerminalLogService),
        __param(3, dialogs_1.IDialogService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, remoteAgentService_1.IRemoteAgentService),
        __param(6, viewsService_1.IViewsService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, terminal_2.ITerminalConfigurationService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, terminal_2.ITerminalConfigurationService),
        __param(11, terminal_2.ITerminalEditorService),
        __param(12, terminal_2.ITerminalGroupService),
        __param(13, terminal_2.ITerminalInstanceService),
        __param(14, editorGroupsService_1.IEditorGroupsService),
        __param(15, terminal_3.ITerminalProfileService),
        __param(16, extensions_1.IExtensionService),
        __param(17, notification_1.INotificationService),
        __param(18, workspace_1.IWorkspaceContextService),
        __param(19, commands_1.ICommandService),
        __param(20, keybinding_1.IKeybindingService),
        __param(21, timerService_1.ITimerService)
    ], TerminalService);
    let TerminalEditorStyle = class TerminalEditorStyle extends themeService_1.Themable {
        constructor(container, _terminalService, _themeService, _terminalProfileService, _editorService) {
            super(_themeService);
            this._terminalService = _terminalService;
            this._themeService = _themeService;
            this._terminalProfileService = _terminalProfileService;
            this._editorService = _editorService;
            this._registerListeners();
            this._styleElement = dom.createStyleSheet(container);
            this._register((0, lifecycle_1.toDisposable)(() => container.removeChild(this._styleElement)));
            this.updateStyles();
        }
        _registerListeners() {
            this._register(this._terminalService.onAnyInstanceIconChange(() => this.updateStyles()));
            this._register(this._terminalService.onDidCreateInstance(() => this.updateStyles()));
            this._register(this._editorService.onDidActiveEditorChange(() => {
                if (this._editorService.activeEditor instanceof terminalEditorInput_1.TerminalEditorInput) {
                    this.updateStyles();
                }
            }));
            this._register(this._editorService.onDidCloseEditor(() => {
                if (this._editorService.activeEditor instanceof terminalEditorInput_1.TerminalEditorInput) {
                    this.updateStyles();
                }
            }));
            this._register(this._terminalProfileService.onDidChangeAvailableProfiles(() => this.updateStyles()));
        }
        updateStyles() {
            super.updateStyles();
            const colorTheme = this._themeService.getColorTheme();
            // TODO: add a rule collector to avoid duplication
            let css = '';
            const productIconTheme = this._themeService.getProductIconTheme();
            // Add icons
            for (const instance of this._terminalService.instances) {
                const icon = instance.icon;
                if (!icon) {
                    continue;
                }
                let uri = undefined;
                if (icon instanceof uri_1.URI) {
                    uri = icon;
                }
                else if (icon instanceof Object && 'light' in icon && 'dark' in icon) {
                    uri = colorTheme.type === theme_1.ColorScheme.LIGHT ? icon.light : icon.dark;
                }
                const iconClasses = (0, terminalIcon_1.getUriClasses)(instance, colorTheme.type);
                if (uri instanceof uri_1.URI && iconClasses && iconClasses.length > 1) {
                    css += (`.monaco-workbench .terminal-tab.${iconClasses[0]}::before` +
                        `{content: ''; background-image: ${dom.asCSSUrl(uri)};}`);
                }
                if (themables_1.ThemeIcon.isThemeIcon(icon)) {
                    const iconRegistry = (0, iconRegistry_1.getIconRegistry)();
                    const iconContribution = iconRegistry.getIcon(icon.id);
                    if (iconContribution) {
                        const def = productIconTheme.getIcon(iconContribution);
                        if (def) {
                            css += (`.monaco-workbench .terminal-tab.codicon-${icon.id}::before` +
                                `{content: '${def.fontCharacter}' !important; font-family: ${dom.asCSSPropertyValue(def.font?.id ?? 'codicon')} !important;}`);
                        }
                    }
                }
            }
            // Add colors
            const iconForegroundColor = colorTheme.getColor(colorRegistry_1.iconForeground);
            if (iconForegroundColor) {
                css += `.monaco-workbench .show-file-icons .file-icon.terminal-tab::before { color: ${iconForegroundColor}; }`;
            }
            css += (0, terminalIcon_1.getColorStyleContent)(colorTheme, true);
            this._styleElement.textContent = css;
        }
    };
    TerminalEditorStyle = __decorate([
        __param(1, terminal_2.ITerminalService),
        __param(2, themeService_1.IThemeService),
        __param(3, terminal_3.ITerminalProfileService),
        __param(4, editorService_1.IEditorService)
    ], TerminalEditorStyle);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUR6RixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHNCQUFVO1FBc0I5QyxJQUFJLDBCQUEwQixLQUFjLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFHNUYsSUFBSSxlQUFlLEtBQThCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUdoRixJQUFJLGFBQWEsS0FBb0IsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFHcEUsSUFBSSxrQkFBa0IsS0FBYSxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFFckUsSUFBSSxTQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQ3ZJLENBQUM7UUFDRCxJQUFJLGlCQUFpQjtZQUNwQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUtELHVCQUF1QixDQUFDLGlCQUF5QjtZQUNoRCxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsSUFBSSxlQUFlLEtBQXVCLE9BQU8sSUFBSSxDQUFDLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyxlQUFlLGlEQUFrQyxDQUFDLENBQUMsQ0FBQywyQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLDJCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFHbE0sSUFBSSxjQUFjO1lBQ2pCLDJGQUEyRjtZQUMzRiw0RkFBNEY7WUFDNUYsZ0RBQWdEO1lBQ2hELEtBQUssTUFBTSxrQkFBa0IsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDckUsSUFBSSxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsQ0FBQztvQkFDbEMsT0FBTyxrQkFBa0IsQ0FBQztnQkFDM0IsQ0FBQztZQUNGLENBQUM7WUFDRCxzRUFBc0U7WUFDdEUsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7UUFLRCxJQUFJLG1CQUFtQixLQUErQixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRS9GLElBQUksNkJBQTZCLEtBQStCLE9BQU8sSUFBSSxDQUFDLDhCQUE4QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFbkgsSUFBSSwyQkFBMkIsS0FBa0IsT0FBTyxJQUFJLENBQUMsNEJBQTRCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUVsRyxJQUFJLDBCQUEwQixLQUFrQixPQUFPLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRWhHLElBQUksa0NBQWtDLEtBQTRDLE9BQU8sSUFBSSxDQUFDLG1DQUFtQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFJMUksSUFBSSxvQkFBb0IsS0FBK0IsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUVqRyxJQUFJLGtCQUFrQixLQUErQixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRTdGLElBQUkseUJBQXlCLEtBQTJDLE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFdkgsSUFBSSxvQkFBb0IsS0FBa0IsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUVwRixJQUFJLDZCQUE2QixLQUErQixPQUFPLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBSW5ILElBQUksc0JBQXNCLEtBQXdDLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFOUcsdUZBQXVGO1FBQ3ZGLHFCQUFxQjtRQUNaLElBQUksaUJBQWlCLEtBQUssT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzFKLElBQUksc0JBQXNCLEtBQUssT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDaEgsSUFBSSx1QkFBdUIsS0FBSyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNoSCxJQUFJLG9DQUFvQyxLQUFLLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3ZLLElBQUksZ0NBQWdDLEtBQUssT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzVLLElBQUksMkJBQTJCLEtBQUssT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN2SCxJQUFJLDRCQUE0QixLQUFLLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDNUgsSUFBSSx3QkFBd0IsS0FBSyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUUzSCxZQUNxQixrQkFBOEMsRUFDL0MsaUJBQXFELEVBQ25ELFdBQWlELEVBQ3RELGNBQXNDLEVBQy9CLHFCQUFvRCxFQUN0RCxtQkFBZ0QsRUFDdEQsYUFBb0MsRUFDNUIscUJBQTZELEVBQ3JELHNCQUFzRSxFQUN2RSxtQkFBa0UsRUFDakUsNkJBQTZFLEVBQ3BGLHNCQUErRCxFQUNoRSxxQkFBNkQsRUFDMUQsd0JBQW1FLEVBQ3ZFLG9CQUEyRCxFQUN4RCx1QkFBaUUsRUFDdkUsaUJBQXFELEVBQ2xELG9CQUEyRCxFQUN2RCx3QkFBbUUsRUFDNUUsZUFBaUQsRUFDOUMsa0JBQXVELEVBQzVELGFBQTZDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBdkJvQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQzlCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDbEMsZ0JBQVcsR0FBWCxXQUFXLENBQXFCO1lBQzlDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUN2QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzlDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDOUMsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDWCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3BDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBK0I7WUFDdEQsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUE4QjtZQUNoRCxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQStCO1lBQ25FLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBd0I7WUFDL0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN6Qyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ3RELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDdkMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtZQUN0RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ2pDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDdEMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUMzRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDN0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUMzQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQTFIckQseUJBQW9CLEdBQThELElBQUksR0FBRyxFQUFFLENBQUM7WUFFNUYsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztZQUl2RCxvQkFBZSxHQUFZLEtBQUssQ0FBQztZQUNqQyxtQ0FBOEIsR0FBd0IsRUFBRSxDQUFDO1lBQ3pELHFDQUFnQyxHQUErQixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBYXpFLHFCQUFnQiw4Q0FBK0Q7WUFHdEUsbUJBQWMsR0FBRyxJQUFJLHVCQUFlLEVBQVEsQ0FBQztZQUd0RCx3QkFBbUIsR0FBVyxDQUFDLENBQUM7WUFZaEMsMEJBQXFCLEdBQXFDLElBQUksR0FBRyxFQUFFLENBQUM7WUF1QjNELHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUV4RSxtQ0FBOEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFxQixDQUFDLENBQUM7WUFFbEYsaUNBQTRCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFFbkUsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFFbEUsd0NBQW1DLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBa0MsQ0FBQyxDQUFDO1lBR3JILCtCQUErQjtZQUNkLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUV6RSx3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFxQixDQUFDLENBQUM7WUFFdkUsK0JBQTBCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBaUMsQ0FBQyxDQUFDO1lBRTFGLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBRTVELG1DQUE4QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUduRyx1QkFBdUI7WUFDTiw0QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE4QixDQUFDLENBQUM7WUF3Q3BHLDZDQUE2QztZQUM3QyxtRUFBbUU7WUFDbkUsb0RBQW9EO1lBQ3BELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4RyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDNUQsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztZQUNuSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDM0UsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSix1RkFBdUY7WUFDdkYseUZBQXlGO1lBQ3pGLFVBQVU7WUFDVixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDOUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDeEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4QyxDQUFDO2dCQUNELElBQUksUUFBUSxFQUFFLFNBQVMsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsNEJBQTRCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDdEUsQ0FBQztxQkFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3RCLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDM0MsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsNEJBQTRCLEdBQUcsd0NBQW1CLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUNsRyxJQUFJLENBQUMseUJBQXlCLEdBQUcsd0NBQW1CLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3RHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxnQkFBSyxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxhQUFhLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQztZQUNoRyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsd0NBQW1CLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzFHLElBQUksQ0FBQyx3QkFBd0IsR0FBRyx3Q0FBbUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzFGLElBQUksQ0FBQyxxQkFBcUIsR0FBRyx3Q0FBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFFdEcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3hELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSywyQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pILElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFL0UsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFFakMsOENBQThDO1lBQzlDLElBQUEsZUFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsbUJBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pJLENBQUM7UUFFRCxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBcUMsRUFBRSxHQUFrQjtZQUNuRixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLG1EQUF3QixDQUFDLENBQUM7WUFDdEYsTUFBTSxNQUFNLEdBQUcsTUFBTSxTQUFTLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBeUIsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUNyRCxJQUFJLElBQUksS0FBSyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMvQixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxjQUFjLENBQUM7Z0JBQ3BFLElBQUksUUFBUSxDQUFDO2dCQUViLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDO29CQUM3QyxNQUFNLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFO3dCQUNoRyxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSTt3QkFDakMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEtBQUs7d0JBQ25DLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZTtxQkFDbkcsQ0FBQyxDQUFDO29CQUNILE9BQU87Z0JBQ1IsQ0FBQztxQkFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksYUFBYSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDNUQsSUFBSSxPQUFPLEVBQUUsR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFDO3dCQUNwQyx5REFBeUQ7d0JBQ3pELFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztvQkFDcEgsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO29CQUN0RyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxRQUFRLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSywyQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDbEUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDM0MsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNqQyxPQUFPLFFBQVEsQ0FBQztnQkFDakIsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRU8sS0FBSyxDQUFDLHlCQUF5QjtZQUN0QyxJQUFBLGtCQUFJLEVBQUMsc0NBQXNDLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDaEgsSUFBQSxrQkFBSSxFQUFDLHFDQUFxQyxDQUFDLENBQUM7WUFDNUMsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDO1lBRXRHLDBGQUEwRjtZQUMxRixzRUFBc0U7WUFDdEUsSUFBSSxDQUFDLGdCQUFnQiw2Q0FBcUMsQ0FBQztZQUUzRCxNQUFNLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsZUFBZSxJQUFJLDBCQUEwQixDQUFDO1lBRXBHLElBQUksQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNwRCxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFBLDRCQUFjLEVBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDbkcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO29CQUN0QixNQUFNLG1CQUFtQixHQUFHLGdCQUFnQixFQUFFLG1CQUFtQixDQUFDO29CQUNsRSxJQUFJLG1CQUFtQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO3dCQUNqSixJQUFJLGdCQUFnQixDQUFDLE1BQU0sS0FBSywyQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQzs0QkFDekQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO3dCQUM5RCxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsSUFBSSxDQUFDLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDLGdCQUFnQixDQUFDLEVBQUUsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7d0JBQ3BHLENBQUM7d0JBQ0QsTUFBTSxnQkFBZ0IsQ0FBQyx1QkFBdUIsQ0FBQyw2QkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDeEUsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztvQkFDekYsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLCtEQUErRDt3QkFDL0QsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7b0JBQy9FLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBQSxrQkFBSSxFQUFDLDZCQUE2QixDQUFDLENBQUM7WUFDcEMsSUFBSSxrQkFBZ0MsQ0FBQztZQUNyQyxJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3hCLGtCQUFrQixHQUFHLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1lBQ3pELENBQUM7aUJBQU0sSUFBSSwwQkFBMEIsRUFBRSxDQUFDO2dCQUN2QyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUN4RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1Asa0JBQWtCLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3hDLENBQUM7WUFDRCxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ2xDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDckIsSUFBQSxrQkFBSSxFQUFDLDRCQUE0QixDQUFDLENBQUM7Z0JBQ25DLElBQUEsa0JBQUksRUFBQywwQkFBMEIsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzNILE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxPQUFPLENBQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4RyxJQUFBLGtCQUFJLEVBQUMseUJBQXlCLENBQUMsQ0FBQztnQkFDaEMsSUFBQSxrQkFBSSxFQUFDLHVDQUF1QyxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxPQUFPLEVBQUMsRUFBRTtvQkFDdkcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsZUFBZSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsTUFBTSxPQUFPLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO29CQUN0SixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osSUFBQSxrQkFBSSxFQUFDLHNDQUFzQyxDQUFDLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsaUJBQWlCO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM3QixDQUFDO1FBRU8sMEJBQTBCLENBQUMsSUFBMkI7WUFDN0QsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDdkYsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDdkYsSUFBSSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3pGLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDbEMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM5QyxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO2dCQUMvQyxJQUFJLENBQUMsOEJBQThCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVPLHVCQUF1QixDQUFDLElBQTJCLEVBQUUsUUFBdUM7WUFDbkcseUZBQXlGO1lBQ3pGLDRGQUE0RjtZQUM1Riw0RkFBNEY7WUFDNUYsNEVBQTRFO1lBQzVFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzlDLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUN6RCxJQUFJLE1BQU0sRUFBRSxDQUFDO3dCQUNaLFFBQVEsR0FBRyxNQUFNLENBQUM7b0JBQ25CLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLENBQUMsZUFBZSxHQUFHLFFBQVEsQ0FBQztZQUNoQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxLQUF3QjtZQUN6QyxxRkFBcUY7WUFDckYscURBQXFEO1lBQ3JELElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUMxQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckMsQ0FBQztZQUNELElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSywyQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckQsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsbUJBQW1CO1lBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzNCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sS0FBSywyQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDN0QsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUMxRCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUN6RCxDQUFDO1FBRUQsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLG1CQUEyQixFQUFFLEVBQVUsRUFBRSxPQUFpRDtZQUNoSSxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFeEUsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLDZCQUE2QixDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxtREFBbUQsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDMUYsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxlQUFlLENBQUMsZ0NBQWdDLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2hFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDckcsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxFQUFFLGNBQWMsRUFBRSxDQUFDO1lBQ25FLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzVDLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLG1CQUFtQixDQUFDLFFBQTJCO1lBQ3BELCtEQUErRDtZQUMvRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssMkJBQWdCLENBQUMsTUFBTTtnQkFDOUMsUUFBUSxDQUFDLGlCQUFpQjtnQkFDMUIsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsTUFBTSxDQUFDLGFBQWEsS0FBSyxPQUFPLElBQUksSUFBSSxDQUFDLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyxhQUFhLEtBQUssUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFFaEosTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsOEJBQThCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzdELElBQUksSUFBSSxFQUFFLENBQUM7b0JBQ1YsT0FBTztnQkFDUixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxDQUFDLEVBQUU7Z0JBQzVCLGFBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZDLFFBQVEsQ0FBQyxPQUFPLENBQUMsNkJBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sYUFBYTtZQUNwQixJQUFJLENBQUMsZ0JBQWdCLDRDQUFvQyxDQUFDO1lBQzFELElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFTyxLQUFLLENBQUMsMkJBQTJCO1lBQ3hDLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUM7WUFDakUsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN0QixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNoRixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFBLGtCQUFJLEVBQUMseUNBQXlDLENBQUMsQ0FBQztZQUNoRCxNQUFNLFVBQVUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3pELElBQUEsa0JBQUksRUFBQyx3Q0FBd0MsQ0FBQyxDQUFDO1lBQy9DLE9BQU8sQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQ3BDLElBQUEsa0JBQUksRUFBQywwQ0FBMEMsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQy9DLElBQUEsa0JBQUksRUFBQyx5Q0FBeUMsQ0FBQyxDQUFDO1lBQ2hELHlDQUF5QztZQUN6QywrREFBK0Q7WUFDL0QsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7WUFFckMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRU8sS0FBSyxDQUFDLDBCQUEwQjtZQUN2QyxNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN0RSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ25CLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBQSxrQkFBSSxFQUFDLHlDQUF5QyxDQUFDLENBQUM7WUFDaEQsTUFBTSxVQUFVLEdBQUcsTUFBTSxZQUFZLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUM5RCxJQUFBLGtCQUFJLEVBQUMsd0NBQXdDLENBQUMsQ0FBQztZQUMvQyxJQUFJLFVBQVUsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDOUMsSUFBQSxrQkFBSSxFQUFDLDBDQUEwQyxDQUFDLENBQUM7Z0JBQ2pELElBQUksQ0FBQywwQkFBMEIsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzNFLElBQUEsa0JBQUksRUFBQyx5Q0FBeUMsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFDRCx5Q0FBeUM7WUFDekMsb0VBQW9FO1lBQ3BFLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1lBRXJDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVPLHVCQUF1QixDQUFDLFVBQWlDO1lBQ2hFLE1BQU0sYUFBYSxHQUEwQyxFQUFFLENBQUM7WUFDaEUsSUFBSSxXQUE0RCxDQUFDO1lBQ2pFLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLEtBQUssTUFBTSxTQUFTLElBQUksVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUN6QyxNQUFNLGVBQWUsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDM0YsSUFBSSxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQzVCLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxlQUFlLENBQUMsTUFBTSxDQUFDO3dCQUNuRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxDQUFDO3dCQUN4RSxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUM1QixJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzs0QkFDeEIsV0FBVyxHQUFHLE9BQU8sQ0FBQzt3QkFDdkIsQ0FBQzt3QkFDRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBdUIsRUFBRSxFQUFFLEtBQUssU0FBUyxDQUFDLHlCQUF5QixDQUFDLENBQUM7d0JBQ3pJLElBQUksY0FBYyxFQUFFLENBQUM7NEJBQ3BCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQzt3QkFDeEMsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUM1QixXQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsQ0FBQztnQkFDNUUsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQXFCLENBQUMsQ0FBQztRQUMvRixDQUFDO1FBRU8sS0FBSyxDQUFDLHNCQUFzQixDQUFDLFNBQWlFLEVBQUUsZUFBOEU7WUFDckwsSUFBSSxZQUFvRCxDQUFDO1lBQ3pELEtBQUssTUFBTSxjQUFjLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQzlDLE1BQU0sdUJBQXVCLEdBQUcsY0FBYyxDQUFDLFFBQVMsQ0FBQztnQkFDekQsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyx1Q0FBK0IsSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLENBQUM7b0JBQ2xILFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxJQUFBLGtCQUFJLEVBQUMsc0NBQXNDLHVCQUF1QixDQUFDLEVBQUUsSUFBSSx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RyxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztvQkFDbEMsTUFBTSxFQUFFLEVBQUUsdUJBQXVCLEVBQUU7b0JBQ25DLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQywyQkFBZ0IsQ0FBQyxLQUFLO2lCQUNsRixDQUFDLENBQUM7Z0JBQ0gsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLGtCQUFJLEVBQUMscUNBQXFDLHVCQUF1QixDQUFDLEVBQUUsSUFBSSx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakksQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHLFlBQVksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzNDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkUsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO2dCQUMzRSxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU8sNkJBQTZCO1lBQ3BDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25FLHNGQUFzRjtZQUN0Riw0REFBNEQ7WUFDNUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEcsQ0FBQztRQUVPLDBCQUEwQjtZQUNqQyxNQUFNLHFCQUFxQixHQUFHLHdDQUFtQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDekYsTUFBTSx5QkFBeUIsR0FBRyxHQUFHLEVBQUU7Z0JBQ3RDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDckQsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFELENBQUMsQ0FBQztZQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlFLENBQUM7UUFFRCxLQUFLLENBQUMseUJBQXlCLENBQUMsT0FBb0M7WUFDbkUsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUMzQyxzQkFBc0I7WUFDdEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNyQixPQUFPLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUM5QixDQUFDO1lBQ0Qsd0NBQXdDO1lBQ3hDLElBQUksQ0FBQyxPQUFPLEVBQUUsWUFBWSxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUUsZUFBZSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUM5RSxPQUFPLGNBQWMsQ0FBQztZQUN2QixDQUFDO1lBQ0QseURBQXlEO1lBQ3pELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzdDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqQyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQ2xDLE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxLQUFLLENBQUMsb0JBQW9CLENBQUMsYUFBdUI7WUFDakQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUNyQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssMkJBQWdCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pELE1BQU0sSUFBSSxDQUFDLHNCQUFzQixDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3JFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUM5QyxDQUFDO1FBQ0YsQ0FBQztRQUVELFdBQVcsQ0FBQyxRQUEyQixFQUFFLElBQTJCO1lBQ25FLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUM1QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDL0MsQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQW1CLDJCQUFnQixDQUFDLENBQUM7WUFDeEYsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1QyxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFRCxVQUFVLENBQUMsUUFBdUM7WUFDakQsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxLQUFLLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFRCxlQUFlLENBQUMsUUFBMkI7WUFDMUMsT0FBTyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNqRyxDQUFDO1FBRUQsNkJBQTZCLENBQUMsS0FBbUMsRUFBRSxJQUFZLEVBQUUsSUFBWTtZQUM1RiwyRUFBMkU7WUFDM0UsT0FBTyxJQUFJLE9BQU8sQ0FBbUMsUUFBUSxDQUFDLEVBQUU7Z0JBQy9ELElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2hGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLGlCQUFpQixDQUFDLE1BQXNCO1lBQy9DLHFGQUFxRjtZQUNyRixvREFBb0Q7WUFDcEQsSUFBSSxnQkFBSyxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7Z0JBQzVCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFTyxLQUFLLENBQUMsc0JBQXNCLENBQUMsTUFBc0I7WUFDMUQsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakMsb0NBQW9DO2dCQUNwQyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCw0RkFBNEY7WUFDNUYsd0NBQXdDO1lBQ3hDLElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMsb0JBQW9CLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLGNBQWMsRUFBRSxDQUFDO2dCQUN6RSxNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbEUsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO29CQUMzQixnRkFBZ0Y7b0JBQ2hGLG1GQUFtRjtvQkFDbkYsZ0ZBQWdGO29CQUNoRixrRkFBa0Y7b0JBQ2xGLHNDQUFzQztvQkFDdEMsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDO3dCQUNsQixJQUFJLENBQUMsZUFBZSxFQUFFLG9CQUFvQixFQUFFO3dCQUM1QyxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUM7cUJBQ2IsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBRUQsK0JBQStCO2dCQUMvQixNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLElBQUksTUFBTSxrQ0FBMEIsQ0FBQztnQkFDdEksSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7b0JBQzdCLE1BQU0saUJBQWlCLEdBQUcsQ0FDekIsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsTUFBTSxDQUFDLGFBQWEsS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO3dCQUNuRyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxNQUFNLENBQUMsYUFBYSxLQUFLLG1CQUFtQixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FDbEksQ0FBQztvQkFDRixJQUFJLGlCQUFpQixFQUFFLENBQUM7d0JBQ3ZCLE9BQU8sSUFBSSxDQUFDLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNuRCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxHQUFZLEVBQUUsQ0FBQztnQkFDdkIsb0VBQW9FO2dCQUNwRSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyw2Q0FBNkMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMzRSxDQUFDO1lBRUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFFNUIsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsaUJBQWlCLENBQUMsY0FBOEM7WUFDL0QsSUFBSSxDQUFDLGVBQWUsR0FBRyxjQUFjLENBQUM7UUFDdkMsQ0FBQztRQUVPLHNCQUFzQixDQUFDLE1BQXNCO1lBQ3BELElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ3pFLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELFFBQVEsSUFBSSxDQUFDLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO2dCQUNsRixLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQ2YsNkRBQTZEO29CQUM3RCxJQUFJLE1BQU0saUNBQXlCLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEtBQUssQ0FBQyxJQUFJLENBQUMsc0JBQVcsQ0FBQyxFQUFFLENBQUM7d0JBQzFGLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7b0JBQ0QsT0FBTyxNQUFNLGdDQUF3QixJQUFJLE1BQU0sZ0NBQXdCLENBQUM7Z0JBQ3pFLENBQUM7Z0JBQ0QsS0FBSyxzQkFBc0IsQ0FBQyxDQUFDLE9BQU8sTUFBTSxrQ0FBMEIsQ0FBQztnQkFDckUsT0FBTyxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUM7WUFDdkIsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsNkJBQTZCLENBQUMsTUFBc0I7WUFDakUseUVBQXlFO1lBQ3pFLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUM7WUFDekQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQzdCLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTyxlQUFlLENBQUMsQ0FBb0I7WUFDM0MsMEZBQTBGO1lBQzFGLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsSUFBSSxDQUFDLENBQUMsTUFBTSxrQ0FBMEIsQ0FBQztZQUV4SSxLQUFLLE1BQU0sUUFBUSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsU0FBUyxFQUFFLEdBQUcsSUFBSSxDQUFDLDhCQUE4QixDQUFDLEVBQUUsQ0FBQztnQkFDMUcsSUFBSSxzQkFBc0IsSUFBSSxRQUFRLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3RELFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyw2QkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDL0QsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFFBQVEsQ0FBQyxPQUFPLENBQUMsNkJBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQy9DLENBQUM7WUFDRixDQUFDO1lBRUQsc0RBQXNEO1lBQ3RELElBQUksQ0FBQyxzQkFBc0IsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDdkUsSUFBSSxDQUFDLGVBQWUsRUFBRSxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN4RCxDQUFDO1FBQ0YsQ0FBQztRQUdPLFVBQVU7WUFDakIsMkZBQTJGO1lBQzNGLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMxQixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ3pFLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUN2SCxNQUFNLEtBQUssR0FBNkIsRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUNqRCxJQUFJLENBQUMsZUFBZSxFQUFFLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFHTyxZQUFZLENBQUMsUUFBdUM7WUFDM0QsSUFBSSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsbUJBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDakssT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLGVBQWUsRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsMkJBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0csQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxlQUFlLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN2RyxDQUFDO1FBQ0YsQ0FBQztRQUdPLFdBQVcsQ0FBQyxRQUEyQixFQUFFLGFBQXNCO1lBQ3RFLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsTUFBTSxDQUFDLHdCQUF3QixJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLG1CQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2hLLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLGVBQWUsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5RyxDQUFDO1FBRUQsa0JBQWtCO1lBQ2pCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxVQUFrQjtZQUNuQyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqQixJQUFJLENBQUMsOEJBQThCLENBQUMsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25FLElBQUksZ0JBQWdCLENBQUMsVUFBVSxLQUFLLFVBQVUsRUFBRSxDQUFDO29CQUNoRCxPQUFPLEdBQUcsQ0FBQyxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUNILElBQUksT0FBTyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BCLE9BQU8sSUFBSSxDQUFDLDhCQUE4QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JELENBQUM7WUFDRCxJQUFJLENBQUM7Z0JBQ0osT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNSLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO1FBRUQsb0JBQW9CLENBQUMsYUFBcUI7WUFDekMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCx1QkFBdUIsQ0FBQyxRQUF5QjtZQUNoRCxPQUFPLElBQUEscUNBQXVCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsb0JBQW9CLENBQUMsVUFBdUM7WUFDM0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRCxZQUFZLENBQUMsTUFBeUIsRUFBRSxLQUFxRjtZQUM1SCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssMkJBQWdCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQy9DLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEIsT0FBTztZQUNSLENBQUM7WUFDRCxXQUFXLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRTNGLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxNQUF5QjtZQUMxQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxnQ0FBZ0IsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCxLQUFLLENBQUMsa0JBQWtCLENBQUMsTUFBZ0MsRUFBRSxNQUEwQixFQUFFLElBQXlCO1lBQy9HLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN2QixNQUFNLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRW5ELElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSywyQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDL0MsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNqRCxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sQ0FBQyxNQUFNLEdBQUcsMkJBQWdCLENBQUMsS0FBSyxDQUFDO1lBRXZDLElBQUksS0FBaUMsQ0FBQztZQUN0QyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLEtBQUssR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEUsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixLQUFLLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2xELENBQUM7WUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFakQsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ3BCLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRixLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBRUQsY0FBYztZQUNkLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBRVMsc0JBQXNCLENBQUMsUUFBMkI7WUFDM0QsTUFBTSxtQkFBbUIsR0FBa0I7Z0JBQzFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUU7b0JBQ2pDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ25ELElBQUksSUFBSSxDQUFDLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsSUFBSSxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQzt3QkFDM0csSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNuQixDQUFDO2dCQUNGLENBQUMsQ0FBQztnQkFDRixRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLDBCQUEwQixDQUFDO2dCQUMxRixRQUFRLENBQUMsMkJBQTJCLENBQUMsS0FBSyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQzVGLENBQUM7WUFDRixRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsbUJBQU8sRUFBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVPLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxRQUEyQixFQUFFLENBQWtDO1lBQ2hHLE1BQU0sa0JBQWtCLEdBQUcsSUFBQSw4QkFBZ0IsRUFBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkQsSUFBSSxrQkFBa0IsQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2pELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxjQUFjLEdBQWtDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFeEYsbUNBQW1DO1lBQ25DLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDckIsTUFBTSx1QkFBdUIsR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUscUJBQXFCLENBQUMsa0JBQWtCLENBQUMsV0FBVyxFQUFFLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqSixJQUFJLHVCQUF1QixFQUFFLENBQUM7b0JBQzdCLGNBQWMsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztvQkFDckcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDMUUsT0FBTztnQkFDUixDQUFDO1lBQ0YsQ0FBQztZQUVELGlCQUFpQjtZQUNqQixjQUFjLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzRSxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUNwQixJQUFJLENBQUMscUJBQXFCLENBQUMsWUFBWSxDQUFDLGNBQWMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxRSxPQUFPO1lBQ1IsQ0FBQztZQUVELG1CQUFtQjtZQUNuQixjQUFjLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1RSxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUNwQixJQUFJLENBQUMsa0JBQWtCLENBQUMsY0FBYyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzFELE9BQU87WUFDUixDQUFDO1lBQ0QsT0FBTztRQUNSLENBQUM7UUFFRCxzQkFBc0IsQ0FBQyxXQUFvQjtZQUMxQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNoRCxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUMsQ0FBQztRQUVELDZEQUE2RDtRQUNyRCxlQUFlLENBQUMsVUFBa0I7WUFDekMsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDOUMsSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLEtBQUssVUFBVSxFQUFFLENBQUM7b0JBQ2hELGFBQWEsR0FBRyxDQUFDLENBQUM7Z0JBQ25CLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUNILElBQUksYUFBYSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLFVBQVUsaURBQWlELENBQUMsQ0FBQztZQUNsRyxDQUFDO1lBQ0QsT0FBTyxhQUFhLENBQUM7UUFDdEIsQ0FBQztRQUVTLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxjQUF3QjtZQUN0RSxJQUFJLE9BQWUsQ0FBQztZQUNwQixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFDbkQsT0FBTyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsbURBQW1ELEVBQUUsdURBQXVELENBQUMsQ0FBQztZQUN0SSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsaURBQWlELEVBQUUsNERBQTRELEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoSyxDQUFDO1lBQ0QsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUM7Z0JBQ3ZELElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU87Z0JBQ1AsYUFBYSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxhQUFhLENBQUM7YUFDcEcsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUNuQixDQUFDO1FBRUQsc0JBQXNCO1lBQ3JCLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSywyQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdEQsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUM7WUFDcEMsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDO1FBQ25DLENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQThDO1lBQ25FLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxRQUFRLEtBQUssMkJBQWdCLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQzFDLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDO2dCQUNwQyxDQUFDO3FCQUFNLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ3pDLElBQUksWUFBWSxJQUFJLFFBQVEsRUFBRSxDQUFDO3dCQUM5QixPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQztvQkFDcEMsQ0FBQzt5QkFBTSxJQUFJLGdCQUFnQixJQUFJLFFBQVEsRUFBRSxDQUFDO3dCQUN6QyxPQUFPLENBQUMsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsTUFBTSxLQUFLLDJCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUM7b0JBQ3RJLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDO2dCQUNuQyxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBZ0M7WUFDcEQsNEZBQTRGO1lBQzVGLHlGQUF5RjtZQUN6RiwyRUFBMkU7WUFDM0UsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsaUJBQWlCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNqRSxNQUFNLGFBQWEsR0FBRyxPQUFPLEVBQUUsTUFBTSxJQUFJLHlCQUF5QixJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBQ3JGLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGFBQWEsRUFBRSxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxJQUFJLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsa0JBQWtCLENBQUM7Z0JBQzFKLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUNoRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsK0NBQXVDLEVBQUUsQ0FBQzt3QkFDbEUsSUFBQSxrQkFBSSxFQUFDLCtCQUErQixDQUFDLENBQUM7b0JBQ3ZDLENBQUM7b0JBQ0QsTUFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsYUFBYSxDQUFDO29CQUNqRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsK0NBQXVDLEVBQUUsQ0FBQzt3QkFDbEUsSUFBQSxrQkFBSSxFQUFDLDhCQUE4QixDQUFDLENBQUM7b0JBQ3RDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyxPQUFPLEVBQUUsTUFBTSxJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ25GLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxJQUFJLHFCQUFxQixJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsaUNBQWlDLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRXpKLGlEQUFpRDtZQUNqRCxNQUFNLGtCQUFrQixHQUFHLE9BQU8sRUFBRSwyQkFBMkIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU1SSxNQUFNLG1CQUFtQixHQUFHLE9BQU8sT0FBTyxFQUFFLFFBQVEsS0FBSyxRQUFRLElBQUkscUJBQXFCLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsT0FBTyxPQUFPLEVBQUUsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBRTdPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUV4RSxpQ0FBaUM7WUFDakMsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO2dCQUN4QixNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZFLElBQUksUUFBMkgsQ0FBQztnQkFDaEksSUFBSSxtQkFBbUIsRUFBRSxDQUFDO29CQUN6QixRQUFRLEdBQUcsZ0JBQWdCLEtBQUssMkJBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSwwQkFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLENBQUM7Z0JBQ3RILENBQUM7cUJBQU0sQ0FBQztvQkFDUCxRQUFRLEdBQUcsT0FBTyxPQUFPLEVBQUUsUUFBUSxLQUFLLFFBQVEsSUFBSSxZQUFZLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUM7Z0JBQzVILENBQUM7Z0JBQ0QsTUFBTSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsa0JBQWtCLENBQUMsbUJBQW1CLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxFQUFFO29CQUMxRyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsSUFBSTtvQkFDN0IsS0FBSyxFQUFFLGtCQUFrQixDQUFDLEtBQUs7b0JBQy9CLFFBQVE7b0JBQ1IsR0FBRyxFQUFFLGlCQUFpQixDQUFDLEdBQUc7aUJBQzFCLENBQUMsQ0FBQztnQkFDSCxNQUFNLFlBQVksR0FBRyxnQkFBZ0IsS0FBSywyQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDO2dCQUM3SCxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLFFBQVEsRUFBRSxjQUFjLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkMsT0FBTyxRQUFRLENBQUM7WUFDakIsQ0FBQztZQUVELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBdUIsSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUNwRixNQUFNLElBQUksS0FBSyxDQUFDLGtFQUFrRSxDQUFDLENBQUM7WUFDckYsQ0FBQztZQUNELElBQUksaUJBQWlCLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsMkJBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3pHLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ25ELElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRTtvQkFDOUQsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztpQkFDaEYsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZDLE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUM7WUFFRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUMxQyxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDdkYsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRU8sS0FBSyxDQUFDLHNCQUFzQixDQUFDLGlCQUFxQyxFQUFFLE9BQWdDO1lBQzNHLElBQUksT0FBTyxFQUFFLE1BQU0sSUFBSSxxQkFBcUIsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2hFLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUN2QixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsNEJBQTRCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBRUQsS0FBSyxDQUFDLHNCQUFzQixDQUFDLE9BQThCO1lBQzFELE1BQU0sSUFBSSxHQUFHLE1BQU0sbUNBQWdCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzFHLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQ3RELDZCQUFhLEVBQ2IsSUFBSSxFQUNKLE9BQU8sQ0FBQyxJQUFJLEVBQ1osT0FBTyxDQUFDLElBQUksRUFDWixPQUFPLENBQUMsYUFBYSxFQUNyQixPQUFPLENBQUMsWUFBWSxJQUFJLElBQUksaURBQXVCLEVBQUUsRUFDckQsRUFBRSxFQUNGLEtBQUssQ0FDTCxDQUFDO1lBRUYsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3RCLEtBQUssQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEQsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksbUNBQWdCLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRTtnQkFDakMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3RDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVPLEtBQUssQ0FBQyxXQUFXLENBQUMsaUJBQXFDLEVBQUUsbUJBQTRCLEVBQUUsT0FBZ0M7WUFDOUgsTUFBTSxHQUFHLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDVixJQUFJLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQztvQkFDbEIsaUJBQWlCLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7Z0JBQ3JDLENBQUM7cUJBQU0sSUFBSSxtQkFBbUIsSUFBSSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUM7b0JBQ3JELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7b0JBQ2pDLElBQUksT0FBTyxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsSUFBSSxnQkFBZ0IsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ2xGLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDO29CQUNoRCxDQUFDO29CQUNELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDYixNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7b0JBQzVELENBQUM7b0JBQ0QsaUJBQWlCLENBQUMsR0FBRyxHQUFHLE1BQU0sSUFBQSxnQ0FBYyxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7Z0JBQy9KLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLGNBQWMsQ0FBQyxpQkFBcUMsRUFBRSxRQUEwQixFQUFFLE1BQXlCO1lBQ2xILElBQUksUUFBUSxDQUFDO1lBQ2IsNkZBQTZGO1lBQzdGLElBQUksT0FBTyxpQkFBaUIsQ0FBQyxHQUFHLEtBQUssUUFBUSxJQUFJLE9BQU8sTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDbkcsaUJBQWlCLENBQUMsR0FBRyxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUM7b0JBQ2hDLE1BQU0sRUFBRSxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE1BQU07b0JBQzNDLFNBQVMsRUFBRSxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFNBQVM7b0JBQ2pELElBQUksRUFBRSxpQkFBaUIsQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJO2lCQUNoRSxDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsSUFBSSxRQUFRLEtBQUssMkJBQWdCLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssMkJBQWdCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3ZGLFFBQVEsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2pGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDWixNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUN0RSxDQUFDO2dCQUNELGlCQUFpQixDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7Z0JBQ3ZELFFBQVEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDM0MsQ0FBQztZQUNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqQyxPQUFPLFFBQVEsQ0FBQztRQUNqQixDQUFDO1FBRU8saUJBQWlCLENBQUMsUUFBMkI7WUFDcEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxPQUFPLEVBQUUsQ0FBQztnQkFDL0MsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JHLElBQUksb0JBQW9CLEVBQUUsQ0FBQztnQkFDMUIsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLENBQUM7UUFDRixDQUFDO1FBRU8sZUFBZSxDQUFDLGlCQUFxQyxFQUFFLFFBQTBCLEVBQUUsT0FBZ0M7WUFDMUgsSUFBSSxRQUFRLENBQUM7WUFDYixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2hFLElBQUksUUFBUSxLQUFLLDJCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxQyxRQUFRLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSwyQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDcEcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDakUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLHVCQUF1QjtnQkFDdkIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUN4RSxRQUFRLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7WUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVELEtBQUssQ0FBQyxlQUFlLENBQUMsUUFBbUM7WUFDeEQsSUFBSSxRQUFRLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzlDLElBQUksZ0JBQWdCLElBQUksUUFBUSxFQUFFLENBQUM7b0JBQ2xDLGtGQUFrRjtvQkFDbEYsTUFBTSxjQUFjLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUFDO29CQUNyRCxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsMkJBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO2dCQUNoRixDQUFDO3FCQUFNLElBQUksWUFBWSxJQUFJLFFBQVEsRUFBRSxDQUFDO29CQUNyQyxPQUFPLDJCQUFnQixDQUFDLE1BQU0sQ0FBQztnQkFDaEMsQ0FBQztxQkFBTSxJQUFJLHFCQUFxQixJQUFJLFFBQVEsRUFBRSxDQUFDO29CQUM5QyxrRkFBa0Y7b0JBQ2xGLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsMkJBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQztnQkFDOUYsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLFFBQVEsQ0FBQztRQUNqQixDQUFDO1FBRU8sS0FBSyxDQUFDLGVBQWUsQ0FBQyxRQUFtQztZQUNoRSxJQUFJLFFBQVEsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLElBQUksZ0JBQWdCLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQzlFLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQztZQUNoQyxDQUFDO2lCQUFNLElBQUksUUFBUSxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsSUFBSSxxQkFBcUIsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDMUYsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1lBQzVCLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRU8saUJBQWlCLENBQUMsUUFBbUM7WUFDNUQsSUFBSSxRQUFRLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxJQUFJLFlBQVksSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDMUUsUUFBUSxDQUFDLFVBQVUsR0FBRyxJQUFBLHVDQUFtQixFQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMscUJBQXFCLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN0SCxPQUFPLFFBQVEsQ0FBQztZQUNqQixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLGlCQUFpQixDQUFDLGlCQUFxQztZQUM5RCx5RkFBeUY7WUFDekYscUJBQXFCO1lBQ3JCLElBQUksT0FBTyxpQkFBaUIsQ0FBQyxHQUFHLEtBQUssUUFBUSxJQUFJLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDakcsSUFBSSxxQ0FBdUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQztvQkFDL0QsaUJBQWlCLENBQUMsV0FBVyxHQUFHLElBQUEsMENBQXdCLEVBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQywrQkFBK0IsRUFBRSx1RUFBdUUsRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLEVBQUUsRUFBRSxxQkFBcUIsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7b0JBQy9QLGlCQUFpQixDQUFDLElBQUksR0FBRyxPQUFPLENBQUM7Z0JBQ2xDLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQztvQkFDckQsaUJBQWlCLENBQUMsV0FBVyxHQUFHLElBQUEsMENBQXdCLEVBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSx3RkFBd0YsRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLEVBQUUsRUFBRSxxQkFBcUIsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7b0JBQ3RRLGlCQUFpQixDQUFDLElBQUksR0FBRyxPQUFPLENBQUM7Z0JBQ2xDLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVTLHVCQUF1QixDQUFDLFFBQTJCO1lBQzVELElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRixJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixJQUFBLG1CQUFPLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDdEIsQ0FBQztZQUNELElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2xFLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQ2hELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFakQsdURBQXVEO1lBQ3ZELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBRUQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ25DLENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLGNBQTJCLEVBQUUsaUJBQThCO1lBQzlFLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNyRSxJQUFJLENBQUMscUJBQXFCLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUVELGtCQUFrQjtZQUNqQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixDQUFDO1FBRUQsa0JBQWtCLENBQUMsUUFBdUM7WUFDekQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsQ0FBQztRQUNsQyxDQUFDO1FBRUQscUJBQXFCLENBQUksUUFBbUQ7WUFDM0UsT0FBTyxJQUFJLG1DQUEyQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2SCxDQUFDO1FBRUQsK0JBQStCLENBQWtDLFlBQWUsRUFBRSxRQUFpRTtZQUNsSixPQUFPLElBQUEseURBQXdDLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM5SSxDQUFDO0tBQ0QsQ0FBQTtJQTltQ1ksMENBQWU7SUE4RmxCO1FBQVIsb0JBQU87NERBQTJKO0lBQzFKO1FBQVIsb0JBQU87aUVBQWlIO0lBQ2hIO1FBQVIsb0JBQU87a0VBQWlIO0lBQ2hIO1FBQVIsb0JBQU87K0VBQXdLO0lBQ3ZLO1FBQVIsb0JBQU87MkVBQTZLO0lBQzVLO1FBQVIsb0JBQU87c0VBQXdIO0lBQ3ZIO1FBQVIsb0JBQU87dUVBQTZIO0lBQzVIO1FBQVIsb0JBQU87bUVBQW1IO0lBMmhCbkg7UUFEUCxJQUFBLHFCQUFRLEVBQUMsR0FBRyxDQUFDO3FEQVliO0lBR087UUFEUCxJQUFBLHFCQUFRLEVBQUMsR0FBRyxDQUFDO3VEQVViO0lBR087UUFEUCxJQUFBLHFCQUFRLEVBQUMsR0FBRyxDQUFDO3NEQU1iOzhCQS9wQlcsZUFBZTtRQXdHekIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsOEJBQW1CLENBQUE7UUFDbkIsV0FBQSx3QkFBYyxDQUFBO1FBQ2QsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHdDQUFtQixDQUFBO1FBQ25CLFdBQUEsNEJBQWEsQ0FBQTtRQUNiLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSx3Q0FBNkIsQ0FBQTtRQUM3QixXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFlBQUEsd0NBQTZCLENBQUE7UUFDN0IsWUFBQSxpQ0FBc0IsQ0FBQTtRQUN0QixZQUFBLGdDQUFxQixDQUFBO1FBQ3JCLFlBQUEsbUNBQXdCLENBQUE7UUFDeEIsWUFBQSwwQ0FBb0IsQ0FBQTtRQUNwQixZQUFBLGtDQUF1QixDQUFBO1FBQ3ZCLFlBQUEsOEJBQWlCLENBQUE7UUFDakIsWUFBQSxtQ0FBb0IsQ0FBQTtRQUNwQixZQUFBLG9DQUF3QixDQUFBO1FBQ3hCLFlBQUEsMEJBQWUsQ0FBQTtRQUNmLFlBQUEsK0JBQWtCLENBQUE7UUFDbEIsWUFBQSw0QkFBYSxDQUFBO09BN0hILGVBQWUsQ0E4bUMzQjtJQUVELElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsdUJBQVE7UUFHekMsWUFDQyxTQUFzQixFQUNhLGdCQUFrQyxFQUNyQyxhQUE0QixFQUNsQix1QkFBZ0QsRUFDekQsY0FBOEI7WUFFL0QsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBTGMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNyQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUNsQiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1lBQ3pELG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUcvRCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUMxQixJQUFJLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFFTyxrQkFBa0I7WUFDekIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsdUJBQXVCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQy9ELElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLFlBQVkseUNBQW1CLEVBQUUsQ0FBQztvQkFDckUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNyQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3hELElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLFlBQVkseUNBQW1CLEVBQUUsQ0FBQztvQkFDckUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNyQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLDRCQUE0QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEcsQ0FBQztRQUVRLFlBQVk7WUFDcEIsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3JCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFdEQsa0RBQWtEO1lBQ2xELElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUViLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBRWxFLFlBQVk7WUFDWixLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDeEQsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztnQkFDM0IsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUM7Z0JBQ3BCLElBQUksSUFBSSxZQUFZLFNBQUcsRUFBRSxDQUFDO29CQUN6QixHQUFHLEdBQUcsSUFBSSxDQUFDO2dCQUNaLENBQUM7cUJBQU0sSUFBSSxJQUFJLFlBQVksTUFBTSxJQUFJLE9BQU8sSUFBSSxJQUFJLElBQUksTUFBTSxJQUFJLElBQUksRUFBRSxDQUFDO29CQUN4RSxHQUFHLEdBQUcsVUFBVSxDQUFDLElBQUksS0FBSyxtQkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDdEUsQ0FBQztnQkFDRCxNQUFNLFdBQVcsR0FBRyxJQUFBLDRCQUFhLEVBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxHQUFHLFlBQVksU0FBRyxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNqRSxHQUFHLElBQUksQ0FDTixtQ0FBbUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxVQUFVO3dCQUMzRCxtQ0FBbUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUN4RCxDQUFDO2dCQUNILENBQUM7Z0JBQ0QsSUFBSSxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNqQyxNQUFNLFlBQVksR0FBRyxJQUFBLDhCQUFlLEdBQUUsQ0FBQztvQkFDdkMsTUFBTSxnQkFBZ0IsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDdkQsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO3dCQUN0QixNQUFNLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzt3QkFDdkQsSUFBSSxHQUFHLEVBQUUsQ0FBQzs0QkFDVCxHQUFHLElBQUksQ0FDTiwyQ0FBMkMsSUFBSSxDQUFDLEVBQUUsVUFBVTtnQ0FDNUQsY0FBYyxHQUFHLENBQUMsYUFBYSw4QkFBOEIsR0FBRyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQzdILENBQUM7d0JBQ0gsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsYUFBYTtZQUNiLE1BQU0sbUJBQW1CLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDaEUsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO2dCQUN6QixHQUFHLElBQUksK0VBQStFLG1CQUFtQixLQUFLLENBQUM7WUFDaEgsQ0FBQztZQUVELEdBQUcsSUFBSSxJQUFBLG1DQUFvQixFQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUM7UUFDdEMsQ0FBQztLQUNELENBQUE7SUFyRkssbUJBQW1CO1FBS3RCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSxrQ0FBdUIsQ0FBQTtRQUN2QixXQUFBLDhCQUFjLENBQUE7T0FSWCxtQkFBbUIsQ0FxRnhCIn0=