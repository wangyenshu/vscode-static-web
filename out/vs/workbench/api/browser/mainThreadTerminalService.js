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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalDataBuffering", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalProcessExtHostProxy", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/platform/terminal/common/environmentVariableShared", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/platform", "vs/base/common/async", "vs/workbench/contrib/terminalContrib/links/browser/links", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix"], function (require, exports, lifecycle_1, extHost_protocol_1, extHostCustomers_1, uri_1, instantiation_1, log_1, terminal_1, terminalDataBuffering_1, terminal_2, terminalProcessExtHostProxy_1, environmentVariable_1, environmentVariableShared_1, terminal_3, remoteAgentService_1, platform_1, async_1, links_1, quickFix_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTerminalService = void 0;
    exports.getOutputMatchForLines = getOutputMatchForLines;
    let MainThreadTerminalService = class MainThreadTerminalService {
        constructor(_extHostContext, _terminalService, _terminalLinkProviderService, _terminalQuickFixService, _instantiationService, _environmentVariableService, _logService, _terminalProfileResolverService, remoteAgentService, _terminalGroupService, _terminalEditorService, _terminalProfileService) {
            this._extHostContext = _extHostContext;
            this._terminalService = _terminalService;
            this._terminalLinkProviderService = _terminalLinkProviderService;
            this._terminalQuickFixService = _terminalQuickFixService;
            this._instantiationService = _instantiationService;
            this._environmentVariableService = _environmentVariableService;
            this._logService = _logService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._terminalGroupService = _terminalGroupService;
            this._terminalEditorService = _terminalEditorService;
            this._terminalProfileService = _terminalProfileService;
            this._store = new lifecycle_1.DisposableStore();
            /**
             * Stores a map from a temporary terminal id (a UUID generated on the extension host side)
             * to a numeric terminal id (an id generated on the renderer side)
             * This comes in play only when dealing with terminals created on the extension host side
             */
            this._extHostTerminals = new Map();
            this._terminalProcessProxies = new Map();
            this._profileProviders = new Map();
            this._quickFixProviders = new Map();
            this._dataEventTracker = new lifecycle_1.MutableDisposable();
            this._sendCommandEventListener = new lifecycle_1.MutableDisposable();
            /**
             * A single shared terminal link provider for the exthost. When an ext registers a link
             * provider, this is registered with the terminal on the renderer side and all links are
             * provided through this, even from multiple ext link providers. Xterm should remove lower
             * priority intersecting links itself.
             */
            this._linkProvider = this._store.add(new lifecycle_1.MutableDisposable());
            this._os = platform_1.OS;
            this._proxy = _extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTerminalService);
            // ITerminalService listeners
            this._store.add(_terminalService.onDidCreateInstance((instance) => {
                this._onTerminalOpened(instance);
                this._onInstanceDimensionsChanged(instance);
            }));
            this._store.add(_terminalService.onDidDisposeInstance(instance => this._onTerminalDisposed(instance)));
            this._store.add(_terminalService.onAnyInstanceProcessIdReady(instance => this._onTerminalProcessIdReady(instance)));
            this._store.add(_terminalService.onDidChangeInstanceDimensions(instance => this._onInstanceDimensionsChanged(instance)));
            this._store.add(_terminalService.onAnyInstanceMaximumDimensionsChange(instance => this._onInstanceMaximumDimensionsChanged(instance)));
            this._store.add(_terminalService.onDidRequestStartExtensionTerminal(e => this._onRequestStartExtensionTerminal(e)));
            this._store.add(_terminalService.onDidChangeActiveInstance(instance => this._onActiveTerminalChanged(instance ? instance.instanceId : null)));
            this._store.add(_terminalService.onAnyInstanceTitleChange(instance => instance && this._onTitleChanged(instance.instanceId, instance.title)));
            this._store.add(_terminalService.onAnyInstanceDataInput(instance => this._proxy.$acceptTerminalInteraction(instance.instanceId)));
            this._store.add(_terminalService.onAnyInstanceSelectionChange(instance => this._proxy.$acceptTerminalSelection(instance.instanceId, instance.selection)));
            // Set initial ext host state
            for (const instance of this._terminalService.instances) {
                this._onTerminalOpened(instance);
                instance.processReady.then(() => this._onTerminalProcessIdReady(instance));
            }
            const activeInstance = this._terminalService.activeInstance;
            if (activeInstance) {
                this._proxy.$acceptActiveTerminalChanged(activeInstance.instanceId);
            }
            if (this._environmentVariableService.collections.size > 0) {
                const collectionAsArray = [...this._environmentVariableService.collections.entries()];
                const serializedCollections = collectionAsArray.map(e => {
                    return [e[0], (0, environmentVariableShared_1.serializeEnvironmentVariableCollection)(e[1].map)];
                });
                this._proxy.$initEnvironmentVariableCollections(serializedCollections);
            }
            remoteAgentService.getEnvironment().then(async (env) => {
                this._os = env?.os || platform_1.OS;
                this._updateDefaultProfile();
            });
            this._store.add(this._terminalProfileService.onDidChangeAvailableProfiles(() => this._updateDefaultProfile()));
        }
        dispose() {
            this._store.dispose();
            for (const provider of this._profileProviders.values()) {
                provider.dispose();
            }
            for (const provider of this._quickFixProviders.values()) {
                provider.dispose();
            }
        }
        async _updateDefaultProfile() {
            const remoteAuthority = this._extHostContext.remoteAuthority ?? undefined;
            const defaultProfile = this._terminalProfileResolverService.getDefaultProfile({ remoteAuthority, os: this._os });
            const defaultAutomationProfile = this._terminalProfileResolverService.getDefaultProfile({ remoteAuthority, os: this._os, allowAutomationShell: true });
            this._proxy.$acceptDefaultProfile(...await Promise.all([defaultProfile, defaultAutomationProfile]));
        }
        async _getTerminalInstance(id) {
            if (typeof id === 'string') {
                return this._extHostTerminals.get(id);
            }
            return this._terminalService.getInstanceFromId(id);
        }
        async $createTerminal(extHostTerminalId, launchConfig) {
            const shellLaunchConfig = {
                name: launchConfig.name,
                executable: launchConfig.shellPath,
                args: launchConfig.shellArgs,
                cwd: typeof launchConfig.cwd === 'string' ? launchConfig.cwd : uri_1.URI.revive(launchConfig.cwd),
                icon: launchConfig.icon,
                color: launchConfig.color,
                initialText: launchConfig.initialText,
                waitOnExit: launchConfig.waitOnExit,
                ignoreConfigurationCwd: true,
                env: launchConfig.env,
                strictEnv: launchConfig.strictEnv,
                hideFromUser: launchConfig.hideFromUser,
                customPtyImplementation: launchConfig.isExtensionCustomPtyTerminal
                    ? (id, cols, rows) => new terminalProcessExtHostProxy_1.TerminalProcessExtHostProxy(id, cols, rows, this._terminalService)
                    : undefined,
                extHostTerminalId,
                forceShellIntegration: launchConfig.forceShellIntegration,
                isFeatureTerminal: launchConfig.isFeatureTerminal,
                isExtensionOwnedTerminal: launchConfig.isExtensionOwnedTerminal,
                useShellEnvironment: launchConfig.useShellEnvironment,
                isTransient: launchConfig.isTransient
            };
            const terminal = async_1.Promises.withAsyncBody(async (r) => {
                const terminal = await this._terminalService.createTerminal({
                    config: shellLaunchConfig,
                    location: await this._deserializeParentTerminal(launchConfig.location)
                });
                r(terminal);
            });
            this._extHostTerminals.set(extHostTerminalId, terminal);
            const terminalInstance = await terminal;
            this._store.add(terminalInstance.onDisposed(() => {
                this._extHostTerminals.delete(extHostTerminalId);
            }));
        }
        async _deserializeParentTerminal(location) {
            if (typeof location === 'object' && 'parentTerminal' in location) {
                const parentTerminal = await this._extHostTerminals.get(location.parentTerminal.toString());
                return parentTerminal ? { parentTerminal } : undefined;
            }
            return location;
        }
        async $show(id, preserveFocus) {
            const terminalInstance = await this._getTerminalInstance(id);
            if (terminalInstance) {
                this._terminalService.setActiveInstance(terminalInstance);
                if (terminalInstance.target === terminal_1.TerminalLocation.Editor) {
                    await this._terminalEditorService.revealActiveEditor(preserveFocus);
                }
                else {
                    await this._terminalGroupService.showPanel(!preserveFocus);
                }
            }
        }
        async $hide(id) {
            const instanceToHide = await this._getTerminalInstance(id);
            const activeInstance = this._terminalService.activeInstance;
            if (activeInstance && activeInstance.instanceId === instanceToHide?.instanceId && activeInstance.target !== terminal_1.TerminalLocation.Editor) {
                this._terminalGroupService.hidePanel();
            }
        }
        async $dispose(id) {
            (await this._getTerminalInstance(id))?.dispose(terminal_1.TerminalExitReason.Extension);
        }
        async $sendText(id, text, shouldExecute) {
            const instance = await this._getTerminalInstance(id);
            await instance?.sendText(text, shouldExecute);
        }
        $sendProcessExit(terminalId, exitCode) {
            this._terminalProcessProxies.get(terminalId)?.emitExit(exitCode);
        }
        $startSendingDataEvents() {
            if (!this._dataEventTracker.value) {
                this._dataEventTracker.value = this._instantiationService.createInstance(TerminalDataEventTracker, (id, data) => {
                    this._onTerminalData(id, data);
                });
                // Send initial events if they exist
                for (const instance of this._terminalService.instances) {
                    for (const data of instance.initialDataEvents || []) {
                        this._onTerminalData(instance.instanceId, data);
                    }
                }
            }
        }
        $stopSendingDataEvents() {
            this._dataEventTracker.clear();
        }
        $startSendingCommandEvents() {
            if (this._sendCommandEventListener.value) {
                return;
            }
            const multiplexer = this._terminalService.createOnInstanceCapabilityEvent(2 /* TerminalCapability.CommandDetection */, capability => capability.onCommandFinished);
            const sub = multiplexer.event(e => {
                this._onDidExecuteCommand(e.instance.instanceId, {
                    commandLine: e.data.command,
                    // TODO: Convert to URI if possible
                    cwd: e.data.cwd,
                    exitCode: e.data.exitCode,
                    output: e.data.getOutput()
                });
            });
            this._sendCommandEventListener.value = (0, lifecycle_1.combinedDisposable)(multiplexer, sub);
        }
        $stopSendingCommandEvents() {
            this._sendCommandEventListener.clear();
        }
        $startLinkProvider() {
            this._linkProvider.value = this._terminalLinkProviderService.registerLinkProvider(new ExtensionTerminalLinkProvider(this._proxy));
        }
        $stopLinkProvider() {
            this._linkProvider.clear();
        }
        $registerProcessSupport(isSupported) {
            this._terminalService.registerProcessSupport(isSupported);
        }
        $registerProfileProvider(id, extensionIdentifier) {
            // Proxy profile provider requests through the extension host
            this._profileProviders.set(id, this._terminalProfileService.registerTerminalProfileProvider(extensionIdentifier, id, {
                createContributedTerminalProfile: async (options) => {
                    return this._proxy.$createContributedProfileTerminal(id, options);
                }
            }));
        }
        $unregisterProfileProvider(id) {
            this._profileProviders.get(id)?.dispose();
            this._profileProviders.delete(id);
        }
        async $registerQuickFixProvider(id, extensionId) {
            this._quickFixProviders.set(id, this._terminalQuickFixService.registerQuickFixProvider(id, {
                provideTerminalQuickFixes: async (terminalCommand, lines, options, token) => {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    if (options.outputMatcher?.length && options.outputMatcher.length > 40) {
                        options.outputMatcher.length = 40;
                        this._logService.warn('Cannot exceed output matcher length of 40');
                    }
                    const commandLineMatch = terminalCommand.command.match(options.commandLineMatcher);
                    if (!commandLineMatch || !lines) {
                        return;
                    }
                    const outputMatcher = options.outputMatcher;
                    let outputMatch;
                    if (outputMatcher) {
                        outputMatch = getOutputMatchForLines(lines, outputMatcher);
                    }
                    if (!outputMatch) {
                        return;
                    }
                    const matchResult = { commandLineMatch, outputMatch, commandLine: terminalCommand.command };
                    if (matchResult) {
                        const result = await this._proxy.$provideTerminalQuickFixes(id, matchResult, token);
                        if (result && Array.isArray(result)) {
                            return result.map(r => parseQuickFix(id, extensionId, r));
                        }
                        else if (result) {
                            return parseQuickFix(id, extensionId, result);
                        }
                    }
                    return;
                }
            }));
        }
        $unregisterQuickFixProvider(id) {
            this._quickFixProviders.get(id)?.dispose();
            this._quickFixProviders.delete(id);
        }
        _onActiveTerminalChanged(terminalId) {
            this._proxy.$acceptActiveTerminalChanged(terminalId);
        }
        _onTerminalData(terminalId, data) {
            this._proxy.$acceptTerminalProcessData(terminalId, data);
        }
        _onDidExecuteCommand(terminalId, command) {
            this._proxy.$acceptDidExecuteCommand(terminalId, command);
        }
        _onTitleChanged(terminalId, name) {
            this._proxy.$acceptTerminalTitleChange(terminalId, name);
        }
        _onTerminalDisposed(terminalInstance) {
            this._proxy.$acceptTerminalClosed(terminalInstance.instanceId, terminalInstance.exitCode, terminalInstance.exitReason ?? terminal_1.TerminalExitReason.Unknown);
        }
        _onTerminalOpened(terminalInstance) {
            const extHostTerminalId = terminalInstance.shellLaunchConfig.extHostTerminalId;
            const shellLaunchConfigDto = {
                name: terminalInstance.shellLaunchConfig.name,
                executable: terminalInstance.shellLaunchConfig.executable,
                args: terminalInstance.shellLaunchConfig.args,
                cwd: terminalInstance.shellLaunchConfig.cwd,
                env: terminalInstance.shellLaunchConfig.env,
                hideFromUser: terminalInstance.shellLaunchConfig.hideFromUser
            };
            this._proxy.$acceptTerminalOpened(terminalInstance.instanceId, extHostTerminalId, terminalInstance.title, shellLaunchConfigDto);
        }
        _onTerminalProcessIdReady(terminalInstance) {
            if (terminalInstance.processId === undefined) {
                return;
            }
            this._proxy.$acceptTerminalProcessId(terminalInstance.instanceId, terminalInstance.processId);
        }
        _onInstanceDimensionsChanged(instance) {
            this._proxy.$acceptTerminalDimensions(instance.instanceId, instance.cols, instance.rows);
        }
        _onInstanceMaximumDimensionsChanged(instance) {
            this._proxy.$acceptTerminalMaximumDimensions(instance.instanceId, instance.maxCols, instance.maxRows);
        }
        _onRequestStartExtensionTerminal(request) {
            const proxy = request.proxy;
            this._terminalProcessProxies.set(proxy.instanceId, proxy);
            // Note that onResize is not being listened to here as it needs to fire when max dimensions
            // change, excluding the dimension override
            const initialDimensions = request.cols && request.rows ? {
                columns: request.cols,
                rows: request.rows
            } : undefined;
            this._proxy.$startExtensionTerminal(proxy.instanceId, initialDimensions).then(request.callback);
            proxy.onInput(data => this._proxy.$acceptProcessInput(proxy.instanceId, data));
            proxy.onShutdown(immediate => this._proxy.$acceptProcessShutdown(proxy.instanceId, immediate));
            proxy.onRequestCwd(() => this._proxy.$acceptProcessRequestCwd(proxy.instanceId));
            proxy.onRequestInitialCwd(() => this._proxy.$acceptProcessRequestInitialCwd(proxy.instanceId));
        }
        $sendProcessData(terminalId, data) {
            this._terminalProcessProxies.get(terminalId)?.emitData(data);
        }
        $sendProcessReady(terminalId, pid, cwd, windowsPty) {
            this._terminalProcessProxies.get(terminalId)?.emitReady(pid, cwd, windowsPty);
        }
        $sendProcessProperty(terminalId, property) {
            if (property.type === "title" /* ProcessPropertyType.Title */) {
                const instance = this._terminalService.getInstanceFromId(terminalId);
                instance?.rename(property.value);
            }
            this._terminalProcessProxies.get(terminalId)?.emitProcessProperty(property);
        }
        $setEnvironmentVariableCollection(extensionIdentifier, persistent, collection, descriptionMap) {
            if (collection) {
                const translatedCollection = {
                    persistent,
                    map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)(collection),
                    descriptionMap: (0, environmentVariableShared_1.deserializeEnvironmentDescriptionMap)(descriptionMap)
                };
                this._environmentVariableService.set(extensionIdentifier, translatedCollection);
            }
            else {
                this._environmentVariableService.delete(extensionIdentifier);
            }
        }
    };
    exports.MainThreadTerminalService = MainThreadTerminalService;
    exports.MainThreadTerminalService = MainThreadTerminalService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTerminalService),
        __param(1, terminal_2.ITerminalService),
        __param(2, links_1.ITerminalLinkProviderService),
        __param(3, quickFix_1.ITerminalQuickFixService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, environmentVariable_1.IEnvironmentVariableService),
        __param(6, log_1.ILogService),
        __param(7, terminal_3.ITerminalProfileResolverService),
        __param(8, remoteAgentService_1.IRemoteAgentService),
        __param(9, terminal_2.ITerminalGroupService),
        __param(10, terminal_2.ITerminalEditorService),
        __param(11, terminal_3.ITerminalProfileService)
    ], MainThreadTerminalService);
    /**
     * Encapsulates temporary tracking of data events from terminal instances, once disposed all
     * listeners are removed.
     */
    let TerminalDataEventTracker = class TerminalDataEventTracker extends lifecycle_1.Disposable {
        constructor(_callback, _terminalService) {
            super();
            this._callback = _callback;
            this._terminalService = _terminalService;
            this._register(this._bufferer = new terminalDataBuffering_1.TerminalDataBufferer(this._callback));
            for (const instance of this._terminalService.instances) {
                this._registerInstance(instance);
            }
            this._register(this._terminalService.onDidCreateInstance(instance => this._registerInstance(instance)));
            this._register(this._terminalService.onDidDisposeInstance(instance => this._bufferer.stopBuffering(instance.instanceId)));
        }
        _registerInstance(instance) {
            // Buffer data events to reduce the amount of messages going to the extension host
            this._register(this._bufferer.startBuffering(instance.instanceId, instance.onData));
        }
    };
    TerminalDataEventTracker = __decorate([
        __param(1, terminal_2.ITerminalService)
    ], TerminalDataEventTracker);
    class ExtensionTerminalLinkProvider {
        constructor(_proxy) {
            this._proxy = _proxy;
        }
        async provideLinks(instance, line) {
            const proxy = this._proxy;
            const extHostLinks = await proxy.$provideLinks(instance.instanceId, line);
            return extHostLinks.map(dto => ({
                id: dto.id,
                startIndex: dto.startIndex,
                length: dto.length,
                label: dto.label,
                activate: () => proxy.$activateLink(instance.instanceId, dto.id)
            }));
        }
    }
    function getOutputMatchForLines(lines, outputMatcher) {
        const match = lines.join('\n').match(outputMatcher.lineMatcher);
        return match ? { regexMatch: match, outputLines: lines } : undefined;
    }
    function parseQuickFix(id, source, fix) {
        let type = quickFix_1.TerminalQuickFixType.TerminalCommand;
        if ('uri' in fix) {
            fix.uri = uri_1.URI.revive(fix.uri);
            type = quickFix_1.TerminalQuickFixType.Opener;
        }
        else if ('id' in fix) {
            type = quickFix_1.TerminalQuickFixType.VscodeCommand;
        }
        return { id, type, source, ...fix };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRlcm1pbmFsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkVGVybWluYWxTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtkaEcsd0RBR0M7SUE1Yk0sSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBeUI7UUEyQnJDLFlBQ2tCLGVBQWdDLEVBQy9CLGdCQUFtRCxFQUN2Qyw0QkFBMkUsRUFDL0Usd0JBQW1FLEVBQ3RFLHFCQUE2RCxFQUN2RCwyQkFBeUUsRUFDekYsV0FBeUMsRUFDckIsK0JBQWlGLEVBQzdGLGtCQUF1QyxFQUNyQyxxQkFBNkQsRUFDNUQsc0JBQStELEVBQzlELHVCQUFpRTtZQVh6RSxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDZCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ3RCLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBOEI7WUFDOUQsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUNyRCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3RDLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFDeEUsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDSixvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWlDO1lBRTFFLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDM0MsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtZQUM3Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1lBckMxRSxXQUFNLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFHaEQ7Ozs7ZUFJRztZQUNjLHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUFzQyxDQUFDO1lBQ2xFLDRCQUF1QixH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