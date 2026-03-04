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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/keyCodes", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/common/contributions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/label/common/label", "vs/platform/commands/common/commands", "vs/base/common/network", "vs/workbench/services/extensions/common/extensions", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/dialogs/browser/simpleFileDialog", "vs/platform/workspace/common/workspace", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/contextkey/common/contextkey", "vs/platform/native/common/native", "vs/platform/storage/common/storage"], function (require, exports, nls, platform_1, remoteAgentService_1, lifecycle_1, platform_2, keyCodes_1, keybindingsRegistry_1, contributions_1, lifecycle_2, label_1, commands_1, network_1, extensions_1, globals_1, environmentService_1, configuration_1, configurationRegistry_1, remoteAuthorityResolver_1, simpleFileDialog_1, workspace_1, telemetry_1, telemetryUtils_1, contextkey_1, native_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let RemoteAgentDiagnosticListener = class RemoteAgentDiagnosticListener {
        constructor(remoteAgentService, labelService) {
            globals_1.ipcRenderer.on('vscode:getDiagnosticInfo', (event, request) => {
                const connection = remoteAgentService.getConnection();
                if (connection) {
                    const hostName = labelService.getHostLabel(network_1.Schemas.vscodeRemote, connection.remoteAuthority);
                    remoteAgentService.getDiagnosticInfo(request.args)
                        .then(info => {
                        if (info) {
                            info.hostName = hostName;
                            if (remoteAgentService_1.remoteConnectionLatencyMeasurer.latency?.high) {
                                info.latency = {
                                    average: remoteAgentService_1.remoteConnectionLatencyMeasurer.latency.average,
                                    current: remoteAgentService_1.remoteConnectionLatencyMeasurer.latency.current
                                };
                            }
                        }
                        globals_1.ipcRenderer.send(request.replyChannel, info);
                    })
                        .catch(e => {
                        const errorMessage = e && e.message ? `Connection to '${hostName}' could not be established  ${e.message}` : `Connection to '${hostName}' could not be established `;
                        globals_1.ipcRenderer.send(request.replyChannel, { hostName, errorMessage });
                    });
                }
                else {
                    globals_1.ipcRenderer.send(request.replyChannel);
                }
            });
        }
    };
    RemoteAgentDiagnosticListener = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, label_1.ILabelService)
    ], RemoteAgentDiagnosticListener);
    let RemoteExtensionHostEnvironmentUpdater = class RemoteExtensionHostEnvironmentUpdater {
        constructor(remoteAgentService, remoteResolverService, extensionService) {
            const connection = remoteAgentService.getConnection();
            if (connection) {
                connection.onDidStateChange(async (e) => {
                    if (e.type === 4 /* PersistentConnectionEventType.ConnectionGain */) {
                        const resolveResult = await remoteResolverService.resolveAuthority(connection.remoteAuthority);
                        if (resolveResult.options && resolveResult.options.extensionHostEnv) {
                            await extensionService.setRemoteEnvironment(resolveResult.options.extensionHostEnv);
                        }
                    }
                });
            }
        }
    };
    RemoteExtensionHostEnvironmentUpdater = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, extensions_1.IExtensionService)
    ], RemoteExtensionHostEnvironmentUpdater);
    let RemoteTelemetryEnablementUpdater = class RemoteTelemetryEnablementUpdater extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.remoteTelemetryEnablementUpdater'; }
        constructor(remoteAgentService, configurationService) {
            super();
            this.remoteAgentService = remoteAgentService;
            this.configurationService = configurationService;
            this.updateRemoteTelemetryEnablement();
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(telemetry_1.TELEMETRY_SETTING_ID)) {
                    this.updateRemoteTelemetryEnablement();
                }
            }));
        }
        updateRemoteTelemetryEnablement() {
            return this.remoteAgentService.updateTelemetryLevel((0, telemetryUtils_1.getTelemetryLevel)(this.configurationService));
        }
    };
    RemoteTelemetryEnablementUpdater = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, configuration_1.IConfigurationService)
    ], RemoteTelemetryEnablementUpdater);
    let RemoteEmptyWorkbenchPresentation = class RemoteEmptyWorkbenchPresentation extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.remoteEmptyWorkbenchPresentation'; }
        constructor(environmentService, remoteAuthorityResolverService, configurationService, commandService, contextService) {
            super();
            function shouldShowExplorer() {
                const startupEditor = configurationService.getValue('workbench.startupEditor');
                return startupEditor !== 'welcomePage' && startupEditor !== 'welcomePageInEmptyWorkbench';
            }
            function shouldShowTerminal() {
                return shouldShowExplorer();
            }
            const { remoteAuthority, filesToDiff, filesToMerge, filesToOpenOrCreate, filesToWait } = environmentService;
            if (remoteAuthority && contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ && !filesToDiff?.length && !filesToMerge?.length && !filesToOpenOrCreate?.length && !filesToWait) {
                remoteAuthorityResolverService.resolveAuthority(remoteAuthority).then(() => {
                    if (shouldShowExplorer()) {
                        commandService.executeCommand('workbench.view.explorer');
                    }
                    if (shouldShowTerminal()) {
                        commandService.executeCommand('workbench.action.terminal.toggleTerminal');
                    }
                });
            }
        }
    };
    RemoteEmptyWorkbenchPresentation = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, commands_1.ICommandService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], RemoteEmptyWorkbenchPresentation);
    /**
     * Sets the 'wslFeatureInstalled' context key if the WSL feature is or was installed on this machine.
     */
    let WSLContextKeyInitializer = class WSLContextKeyInitializer extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.wslContextKeyInitializer'; }
        constructor(contextKeyService, nativeHostService, storageService, lifecycleService) {
            super();
            const contextKeyId = 'wslFeatureInstalled';
            const storageKey = 'remote.wslFeatureInstalled';
            const defaultValue = storageService.getBoolean(storageKey, -1 /* StorageScope.APPLICATION */, undefined);
            const hasWSLFeatureContext = new contextkey_1.RawContextKey(contextKeyId, !!defaultValue, nls.localize('wslFeatureInstalled', "Whether the platform has the WSL feature installed"));
            const contextKey = hasWSLFeatureContext.bindTo(contextKeyService);
            if (defaultValue === undefined) {
                lifecycleService.when(4 /* LifecyclePhase.Eventually */).then(async () => {
                    nativeHostService.hasWSLFeatureInstalled().then(res => {
                        if (res) {
                            contextKey.set(true);
                            // once detected, set to true
                            storageService.store(storageKey, true, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                        }
                    });
                });
            }
        }
    };
    WSLContextKeyInitializer = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, native_1.INativeHostService),
        __param(2, storage_1.IStorageService),
        __param(3, lifecycle_2.ILifecycleService)
    ], WSLContextKeyInitializer);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteAgentDiagnosticListener, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteExtensionHostEnvironmentUpdater, 4 /* LifecyclePhase.Eventually */);
    (0, contributions_1.registerWorkbenchContribution2)(RemoteTelemetryEnablementUpdater.ID, RemoteTelemetryEnablementUpdater, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(RemoteEmptyWorkbenchPresentation.ID, RemoteEmptyWorkbenchPresentation, 2 /* WorkbenchPhase.BlockRestore */);
    if (platform_2.isWindows) {
        (0, contributions_1.registerWorkbenchContribution2)(WSLContextKeyInitializer.ID, WSLContextKeyInitializer, 2 /* WorkbenchPhase.BlockRestore */);
    }
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'remote',
        title: nls.localize('remote', "Remote"),
        type: 'object',
        properties: {
            'remote.downloadExtensionsLocally': {
                type: 'boolean',
                markdownDescription: nls.localize('remote.downloadExtensionsLocally', "When enabled extensions are downloaded locally and installed on remote."),
                default: false
            },
        }
    });
    if (platform_2.isMacintosh) {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: simpleFileDialog_1.OpenLocalFileFolderCommand.ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */,
            when: simpleFileDialog_1.RemoteFileDialogContext,
            metadata: { description: simpleFileDialog_1.OpenLocalFileFolderCommand.LABEL, args: [] },
            handler: simpleFileDialog_1.OpenLocalFileFolderCommand.handler()
        });
    }
    else {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: simpleFileDialog_1.OpenLocalFileCommand.ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */,
            when: simpleFileDialog_1.RemoteFileDialogContext,
            metadata: { description: simpleFileDialog_1.OpenLocalFileCommand.LABEL, args: [] },
            handler: simpleFileDialog_1.OpenLocalFileCommand.handler()
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: simpleFileDialog_1.OpenLocalFolderCommand.ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */),
            when: simpleFileDialog_1.RemoteFileDialogContext,
            metadata: { description: simpleFileDialog_1.OpenLocalFolderCommand.LABEL, args: [] },
            handler: simpleFileDialog_1.OpenLocalFolderCommand.handler()
        });
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: simpleFileDialog_1.SaveLocalFileCommand.ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 49 /* KeyCode.KeyS */,
        when: simpleFileDialog_1.RemoteFileDialogContext,
        metadata: { description: simpleFileDialog_1.SaveLocalFileCommand.LABEL, args: [] },
        handler: simpleFileDialog_1.SaveLocalFileCommand.handler()
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3JlbW90ZS9lbGVjdHJvbi1zYW5kYm94L3JlbW90ZS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUE4QmhHLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQTZCO1FBQ2xDLFlBQ3NCLGtCQUF1QyxFQUM3QyxZQUEyQjtZQUUxQyxxQkFBVyxDQUFDLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSxDQUFDLEtBQWMsRUFBRSxPQUErRCxFQUFRLEVBQUU7Z0JBQ3BJLE1BQU0sVUFBVSxHQUFHLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN0RCxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNoQixNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDLGlCQUFPLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDN0Ysa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQzt5QkFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUNaLElBQUksSUFBSSxFQUFFLENBQUM7NEJBQ1QsSUFBOEIsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDOzRCQUNwRCxJQUFJLG9EQUErQixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztnQ0FDbEQsSUFBOEIsQ0FBQyxPQUFPLEdBQUc7b0NBQ3pDLE9BQU8sRUFBRSxvREFBK0IsQ0FBQyxPQUFPLENBQUMsT0FBTztvQ0FDeEQsT0FBTyxFQUFFLG9EQUErQixDQUFDLE9BQU8sQ0FBQyxPQUFPO2lDQUN4RCxDQUFDOzRCQUNILENBQUM7d0JBQ0YsQ0FBQzt3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