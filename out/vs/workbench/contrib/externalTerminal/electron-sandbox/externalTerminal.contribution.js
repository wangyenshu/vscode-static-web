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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/platform/externalTerminal/common/externalTerminal", "vs/platform/actions/common/actions", "vs/workbench/services/history/common/history", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/network", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/externalTerminal/electron-sandbox/externalTerminalService", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/remote/common/remoteAuthorityResolver"], function (require, exports, nls, paths, externalTerminal_1, actions_1, history_1, keybindingsRegistry_1, network_1, configurationRegistry_1, platform_1, contributions_1, externalTerminalService_1, configuration_1, terminalContextKey_1, remoteAuthorityResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalTerminalContribution = void 0;
    const OPEN_NATIVE_CONSOLE_COMMAND_ID = 'workbench.action.terminal.openNativeConsole';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */,
        when: terminalContextKey_1.TerminalContextKeys.notFocus,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        handler: async (accessor) => {
            const historyService = accessor.get(history_1.IHistoryService);
            // Open external terminal in local workspaces
            const terminalService = accessor.get(externalTerminalService_1.IExternalTerminalService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const remoteAuthorityResolverService = accessor.get(remoteAuthorityResolver_1.IRemoteAuthorityResolverService);
            const root = historyService.getLastActiveWorkspaceRoot();
            const config = configurationService.getValue('terminal.external');
            // It's a local workspace, open the root
            if (root?.scheme === network_1.Schemas.file) {
                terminalService.openTerminal(config, root.fsPath);
                return;
            }
            // If it's a remote workspace, open the canonical URI if it is a local folder
            try {
                if (root?.scheme === network_1.Schemas.vscodeRemote) {
                    const canonicalUri = await remoteAuthorityResolverService.getCanonicalURI(root);
                    if (canonicalUri.scheme === network_1.Schemas.file) {
                        terminalService.openTerminal(config, canonicalUri.fsPath);
                        return;
                    }
                }
            }
            catch { }
            // Open the current file's folder if it's local or its canonical URI is local
            // Opens current file's folder, if no folder is open in editor
            const activeFile = historyService.getLastActiveFile(network_1.Schemas.file);
            if (activeFile?.scheme === network_1.Schemas.file) {
                terminalService.openTerminal(config, paths.dirname(activeFile.fsPath));
                return;
            }
            try {
                if (activeFile?.scheme === network_1.Schemas.vscodeRemote) {
                    const canonicalUri = await remoteAuthorityResolverService.getCanonicalURI(activeFile);
                    if (canonicalUri.scheme === network_1.Schemas.file) {
                        terminalService.openTerminal(config, canonicalUri.fsPath);
                        return;
                    }
                }
            }
            catch { }
            // Fallback to opening without a cwd which will end up using the local home path
            terminalService.openTerminal(config, undefined);
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
            title: nls.localize2('globalConsoleAction', "Open New External Terminal")
        }
    });
    let ExternalTerminalContribution = class ExternalTerminalContribution {
        constructor(_externalTerminalService) {
            this._externalTerminalService = _externalTerminalService;
            this._updateConfiguration();
        }
        async _updateConfiguration() {
            const terminals = await this._externalTerminalService.getDefaultTerminalForPlatforms();
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                id: 'externalTerminal',
                order: 100,
                title: nls.localize('terminalConfigurationTitle', "External Terminal"),
                type: 'object',
                properties: {
                    'terminal.explorerKind': {
                        type: 'string',
                        enum: [
                            'integrated',
                            'external',
                            'both'
                        ],
                        enumDescriptions: [
                            nls.localize('terminal.explorerKind.integrated', "Use VS Code's integrated terminal."),
                            nls.localize('terminal.explorerKind.external', "Use the configured external terminal."),
                            nls.localize('terminal.explorerKind.both', "Use the other two together.")
                        ],
                        description: nls.localize('explorer.openInTerminalKind', "When opening a file from the Explorer in a terminal, determines what kind of terminal will be launched"),
                        default: 'integrated'
                    },
                    'terminal.sourceControlRepositoriesKind': {
                        type: 'string',
                        enum: [
                            'integrated',
                            'external',
                            'both'
                        ],
                        enumDescriptions: [
                            nls.localize('terminal.sourceControlRepositoriesKind.integrated', "Use VS Code's integrated terminal."),
                            nls.localize('terminal.sourceControlRepositoriesKind.external', "Use the configured external terminal."),
                            nls.localize('terminal.sourceControlRepositoriesKind.both', "Use the other two together.")
                        ],
                        description: nls.localize('sourceControlRepositories.openInTerminalKind', "When opening a repository from the Source Control Repositories view in a terminal, determines what kind of terminal will be launched"),
                        default: 'integrated'
                    },
                    'terminal.external.windowsExec': {
                        type: 'string',
                        description: nls.localize('terminal.external.windowsExec', "Customizes which terminal to run on Windows."),
                        default: terminals.windows,
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'terminal.external.osxExec': {
                        type: 'string',
                        description: nls.localize('terminal.external.osxExec', "Customizes which terminal application to run on macOS."),
                        default: externalTerminal_1.DEFAULT_TERMINAL_OSX,
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'terminal.external.linuxExec': {
                        type: 'string',
                        description: nls.localize('terminal.external.linuxExec', "Customizes which terminal to run on Linux."),
                        default: terminals.linux,
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
        }
    };
    exports.ExternalTerminalContribution = ExternalTerminalContribution;
    exports.ExternalTerminalContribution = ExternalTerminalContribution = __decorate([
        __param(0, externalTerminalService_1.IExternalTerminalService)
    ], ExternalTerminalContribution);
    // Register workbench contributions
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(ExternalTerminalContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxUZXJtaW5hbC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlcm5hbFRlcm1pbmFsL2VsZWN0cm9uLXNhbmRib3gvZXh0ZXJuYWxUZXJtaW5hbC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJoRyxNQUFNLDhCQUE4QixHQUFHLDZDQUE2QyxDQUFDO0lBQ3JGLHlDQUFtQixDQUFDLGdDQUFnQyxDQUFDO1FBQ3BELEVBQUUsRUFBRSw4QkFBOEI7UUFDbEMsT0FBTyxFQUFFLG1EQUE2Qix3QkFBZTtRQUNyRCxJQUFJLEVBQUUsd0NBQW1CLENBQUMsUUFBUTtRQUNsQyxNQUFNLDZDQUFtQztRQUN6QyxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO1lBQzNCLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDO1lBQ3JELDZDQUE2QztZQUM3QyxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGtEQUF3QixDQUFDLENBQUM7WUFDL0QsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFDakUsTUFBTSw4QkFBOEIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHlEQUErQixDQUFDLENBQUM7WUFDckYsTUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDekQsTUFBTSxNQUFNLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUE0QixtQkFBbUIsQ0FBQyxDQUFDO1lBRTdGLHdDQUF3QztZQUN4QyxJQUFJLElBQUksRUFBRSxNQUFNLEtBQUssaUJBQU8s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