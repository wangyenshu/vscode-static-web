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
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/base/common/uri", "vs/platform/actions/common/actions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/common/contextkeys", "vs/platform/files/common/files", "vs/platform/list/browser/listService", "vs/workbench/contrib/files/browser/files", "vs/platform/commands/common/commands", "vs/base/common/network", "vs/base/common/arrays", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contributions", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/path", "vs/platform/registry/common/platform", "vs/platform/externalTerminal/common/externalTerminal", "vs/platform/terminal/common/terminal"], function (require, exports, nls, configuration_1, uri_1, actions_1, terminal_1, contextkeys_1, files_1, listService_1, files_2, commands_1, network_1, arrays_1, editorService_1, remoteAgentService_1, contextkey_1, contributions_1, lifecycle_1, platform_1, path_1, platform_2, externalTerminal_1, terminal_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalTerminalContribution = void 0;
    const OPEN_IN_TERMINAL_COMMAND_ID = 'openInTerminal';
    const OPEN_IN_INTEGRATED_TERMINAL_COMMAND_ID = 'openInIntegratedTerminal';
    function registerOpenTerminalCommand(id, explorerKind) {
        commands_1.CommandsRegistry.registerCommand({
            id: id,
            handler: async (accessor, resource) => {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const editorService = accessor.get(editorService_1.IEditorService);
                const fileService = accessor.get(files_1.IFileService);
                const integratedTerminalService = accessor.get(terminal_1.ITerminalService);
                const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
                const terminalGroupService = accessor.get(terminal_1.ITerminalGroupService);
                let externalTerminalService = undefined;
                try {
                    externalTerminalService = accessor.get(externalTerminal_1.IExternalTerminalService);
                }
                catch {
                }
                const resources = (0, files_2.getMultiSelectedResources)(resource, accessor.get(listService_1.IListService), editorService, accessor.get(files_2.IExplorerService));
                return fileService.resolveAll(resources.map(r => ({ resource: r }))).then(async (stats) => {
                    // Always use integrated terminal when using a remote
                    const config = configurationService.getValue();
                    const useIntegratedTerminal = remoteAgentService.getConnection() || explorerKind === 'integrated';
                    const targets = (0, arrays_1.distinct)(stats.filter(data => data.success));
                    if (useIntegratedTerminal) {
                        // TODO: Use uri for cwd in createterminal
                        const opened = {};
                        const cwds = targets.map(({ stat }) => {
                            const resource = stat.resource;
                            if (stat.isDirectory) {
                                return resource;
                            }
                            return uri_1.URI.from({
                                scheme: resource.scheme,
                                authority: resource.authority,
                                fragment: resource.fragment,
                                query: resource.query,
                                path: (0, path_1.dirname)(resource.path)
                            });
                        });
                        for (const cwd of cwds) {
                            if (opened[cwd.path]) {
                                return;
                            }
                            opened[cwd.path] = true;
                            const instance = await integratedTerminalService.createTerminal({ config: { cwd } });
                            if (instance && instance.target !== terminal_2.TerminalLocation.Editor && (resources.length === 1 || !resource || cwd.path === resource.path || cwd.path === (0, path_1.dirname)(resource.path))) {
                                integratedTerminalService.setActiveInstance(instance);
                                terminalGroupService.showPanel(true);
                            }
                        }
                    }
                    else if (externalTerminalService) {
                        (0, arrays_1.distinct)(targets.map(({ stat }) => stat.isDirectory ? stat.resource.fsPath : (0, path_1.dirname)(stat.resource.fsPath))).forEach(cwd => {
                            externalTerminalService.openTerminal(config.terminal.external, cwd);
                        });
                    }
                });
            }
        });
    }
    registerOpenTerminalCommand(OPEN_IN_TERMINAL_COMMAND_ID, 'external');
    registerOpenTerminalCommand(OPEN_IN_INTEGRATED_TERMINAL_COMMAND_ID, 'integrated');
    let ExternalTerminalContribution = class ExternalTerminalContribution extends lifecycle_1.Disposable {
        constructor(_configurationService) {
            super();
            this._configurationService = _configurationService;
            const shouldShowIntegratedOnLocal = contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.terminal.explorerKind', 'integrated'), contextkey_1.ContextKeyExpr.equals('config.terminal.explorerKind', 'both')));
            const shouldShowExternalKindOnLocal = contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.terminal.explorerKind', 'external'), contextkey_1.ContextKeyExpr.equals('config.terminal.explorerKind', 'both')));
            this._openInIntegratedTerminalMenuItem = {
                group: 'navigation',
                order: 30,
                command: {
                    id: OPEN_IN_INTEGRATED_TERMINAL_COMMAND_ID,
                    title: nls.localize('scopedConsoleAction.Integrated', "Open in Integrated Terminal")
                },
                when: contextkey_1.ContextKeyExpr.or(shouldShowIntegratedOnLocal, contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeRemote))
            };
            this._openInTerminalMenuItem = {
                group: 'navigation',
                order: 31,
                command: {
                    id: OPEN_IN_TERMINAL_COMMAND_ID,
                    title: nls.localize('scopedConsoleAction.external', "Open in External Terminal")
                },
                when: shouldShowExternalKindOnLocal
            };
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, this._openInTerminalMenuItem);
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, this._openInIntegratedTerminalMenuItem);
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('terminal.explorerKind') || e.affectsConfiguration('terminal.external')) {
                    this._refreshOpenInTerminalMenuItemTitle();
                }
            });
            this._refreshOpenInTerminalMenuItemTitle();
        }
        isWindows() {
            const config = this._configurationService.getValue().terminal;
            if (platform_1.isWindows && config.external?.windowsExec) {
                const file = (0, path_1.basename)(config.external.windowsExec);
                if (file === 'wt' || file === 'wt.exe') {
                    return true;
                }
            }
            return false;
        }
        _refreshOpenInTerminalMenuItemTitle() {
            if (this.isWindows()) {
                this._openInTerminalMenuItem.command.title = nls.localize('scopedConsoleAction.wt', "Open in Windows Terminal");
            }
        }
    };
    exports.ExternalTerminalContribution = ExternalTerminalContribution;
    exports.ExternalTerminalContribution = ExternalTerminalContribution = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], ExternalTerminalContribution);
    platform_2.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ExternalTerminalContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxUZXJtaW5hbC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlcm5hbFRlcm1pbmFsL2Jyb3dzZXIvZXh0ZXJuYWxUZXJtaW5hbC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMEJoRyxNQUFNLDJCQUEyQixHQUFHLGdCQUFnQixDQUFDO0lBQ3JELE1BQU0sc0NBQXNDLEdBQUcsMEJBQTBCLENBQUM7SUFFMUUsU0FBUywyQkFBMkIsQ0FBQyxFQUFVLEVBQUUsWUFBdUM7UUFDdkYsMkJBQWdCLENBQUMsZUFBZSxDQUFDO1lBQ2hDLEVBQUUsRUFBRSxFQUFFO1lBQ04sT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBYSxFQUFFLEVBQUU7Z0JBRTFDLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO2dCQUNqRSxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUM7Z0JBQy9DLE1BQU0seUJBQXlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBMEIsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0NBQW1CLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGdDQUFxQixDQUFDLENBQUM7Z0JBQ2pFLElBQUksdUJBQXVCLEdBQXlDLFNBQVMsQ0FBQztnQkFDOUUsSUFBSSxDQUFDO29CQUNK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