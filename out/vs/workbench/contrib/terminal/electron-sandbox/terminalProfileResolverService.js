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
define(["require", "exports", "vs/base/common/errors", "vs/platform/configuration/common/configuration", "vs/platform/terminal/common/terminal", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalProfileResolverService", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, errors_1, configuration_1, terminal_1, workspace_1, terminal_2, terminalProfileResolverService_1, terminal_3, configurationResolver_1, history_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronTerminalProfileResolverService = void 0;
    let ElectronTerminalProfileResolverService = class ElectronTerminalProfileResolverService extends terminalProfileResolverService_1.BaseTerminalProfileResolverService {
        constructor(configurationResolverService, configurationService, historyService, logService, workspaceContextService, terminalProfileService, remoteAgentService, terminalInstanceService) {
            super({
                getDefaultSystemShell: async (remoteAuthority, platform) => {
                    const backend = await terminalInstanceService.getBackend(remoteAuthority);
                    if (!backend) {
                        throw new errors_1.ErrorNoTelemetry(`Cannot get default system shell when there is no backend for remote authority '${remoteAuthority}'`);
                    }
                    return backend.getDefaultSystemShell(platform);
                },
                getEnvironment: async (remoteAuthority) => {
                    const backend = await terminalInstanceService.getBackend(remoteAuthority);
                    if (!backend) {
                        throw new errors_1.ErrorNoTelemetry(`Cannot get environment when there is no backend for remote authority '${remoteAuthority}'`);
                    }
                    return backend.getEnvironment();
                }
            }, configurationService, configurationResolverService, historyService, logService, terminalProfileService, workspaceContextService, remoteAgentService);
        }
    };
    exports.ElectronTerminalProfileResolverService = ElectronTerminalProfileResolverService;
    exports.ElectronTerminalProfileResolverService = ElectronTerminalProfileResolverService = __decorate([
        __param(0, configurationResolver_1.IConfigurationResolverService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, history_1.IHistoryService),
        __param(3, terminal_1.ITerminalLogService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, terminal_3.ITerminalProfileService),
        __param(6, remoteAgentService_1.IRemoteAgentService),
        __param(7, terminal_2.ITerminalInstanceService)
    ], ElectronTerminalProfileResolverService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvZWxlY3Ryb24tc2FuZGJveC90ZXJtaW5hbFByb2ZpbGVSZXNvbHZlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sc0NBQXNDLEdBQTVDLE1BQU0sc0NBQXVDLFNBQVEsbUVBQWtDO1FBRTdGLFlBQ2dDLDRCQUEyRCxFQUNuRSxvQkFBMkMsRUFDakQsY0FBK0IsRUFDM0IsVUFBK0IsRUFDMUIsdUJBQWlELEVBQ2xELHNCQUErQyxFQUNuRCxrQkFBdUMsRUFDbEMsdUJBQWlEO1lBRTNFLEtBQUssQ0FDSjtnQkFDQyxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxFQUFFO29CQUMxRCxNQUFNLE9BQU8sR0FBRyxNQUFNLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDMUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNkLE1BQU0sSUFBSSx5QkFBZ0IsQ0FBQyxrRkFBa0YsZUFBZSxHQUFHLENBQUMsQ0FBQztvQkFDbEksQ0FBQztvQkFDRCxPQUFPLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDaEQsQ0FBQztnQkFDRCxjQUFjLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxFQUFFO29CQUN6QyxNQUFNLE9BQU8sR0FBRyxNQUFNLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDMUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNkLE1BQU0sSUFBSSx5QkFBZ0IsQ0FBQyx5RUFBeUUsZUFBZSxHQUFHLENBQUMsQ0FBQztvQkFDekgsQ0FBQztvQkFDRCxPQUFPLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDakMsQ0FBQzthQUNELEVBQ0Qsb0JBQW9CLEVBQ3BCLDRCQUE0QixFQUM1QixjQUFjLEVBQ2QsVUFBVSxFQUNWLHNCQUFzQixFQUN0Qix1QkFBdUIsRUFDdkIsa0JBQWtCLENBQ2xCLENBQUM7UUFDSCxDQUFDO0tBQ0QsQ0FBQTtJQXRDWSx3RkFBc0M7cURBQXRDLHNDQUFzQztRQUdoRCxXQUFBLHFEQUE2QixDQUFBO1FBQzdCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSw4QkFBbUIsQ0FBQTtRQUNuQixXQUFBLG9DQUF3QixDQUFBO1FBQ3hCLFdBQUEsa0NBQXVCLENBQUE7UUFDdkIsV0FBQSx3Q0FBbUIsQ0FBQTtRQUNuQixXQUFBLG1DQUF3QixDQUFBO09BVmQsc0NBQXNDLENBc0NsRCJ9