/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/services/history/common/history"], function (require, exports, network_1, nls_1, environment_1, remoteAuthorityResolver_1, terminalActions_1, history_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerRemoteContributions = registerRemoteContributions;
    function registerRemoteContributions() {
        (0, terminalActions_1.registerTerminalAction)({
            id: "workbench.action.terminal.newLocal" /* TerminalCommandId.NewLocal */,
            title: (0, nls_1.localize2)('workbench.action.terminal.newLocal', 'Create New Integrated Terminal (Local)'),
            run: async (c, accessor) => {
                const historyService = accessor.get(history_1.IHistoryService);
                const remoteAuthorityResolverService = accessor.get(remoteAuthorityResolver_1.IRemoteAuthorityResolverService);
                const nativeEnvironmentService = accessor.get(environment_1.INativeEnvironmentService);
                let cwd;
                try {
                    const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.vscodeRemote);
                    if (activeWorkspaceRootUri) {
                        const canonicalUri = await remoteAuthorityResolverService.getCanonicalURI(activeWorkspaceRootUri);
                        if (canonicalUri.scheme === network_1.Schemas.file) {
                            cwd = canonicalUri;
                        }
                    }
                }
                catch { }
                if (!cwd) {
                    cwd = nativeEnvironmentService.userHome;
                }
                const instance = await c.service.createTerminal({ cwd });
                if (!instance) {
                    return Promise.resolve(undefined);
                }
                c.service.setActiveInstance(instance);
                return c.groupService.showPanel(true);
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxSZW1vdGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9lbGVjdHJvbi1zYW5kYm94L3Rlcm1pbmFsUmVtb3RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLGtFQThCQztJQTlCRCxTQUFnQiwyQkFBMkI7UUFDMUMsSUFBQSx3Q0FBc0IsRUFBQztZQUN0QixFQUFFLHVFQUE0QjtZQUM5QixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsb0NBQW9DLEVBQUUsd0NBQXdDLENBQUM7WUFDaEcsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUU7Z0JBQzFCLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDO2dCQUNyRCxNQUFNLDhCQUE4QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseURBQStCLENBQUMsQ0FBQztnQkFDckYsTUFBTSx3QkFBd0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUF5QixDQUFDLENBQUM7Z0JBQ3pFLElBQUksR0FBb0IsQ0FBQztnQkFDekIsSUFBSSxDQUFDO29CQUNKLE1BQU0sc0JBQXNCLEdBQUcsY0FBYyxDQUFDLDBCQUEwQixDQUFDLGlCQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQy9GLElBQUksc0JBQXNCLEVBQUUsQ0FBQzt3QkFDNUIsTUFBTSxZQUFZLEdBQUcsTUFBTSw4QkFBOEIsQ0FBQyxlQUFlLENBQUMsc0JBQXNCLENBQUMsQ0FBQzt3QkFDbEcsSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7NEJBQzFDLEdBQUcsR0FBRyxZQUFZLENBQUM7d0JBQ3BCLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNWLEdBQUcsR0FBRyx3QkFBd0IsQ0FBQyxRQUFRLENBQUM7Z0JBQ3pDLENBQUM7Z0JBQ0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDZixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ25DLENBQUM7Z0JBRUQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdEMsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxDQUFDO1NBQ0QsQ0FBQyxDQUFDO0lBQ0osQ0FBQyJ9