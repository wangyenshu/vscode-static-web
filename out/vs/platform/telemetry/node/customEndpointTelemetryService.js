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
define(["require", "exports", "vs/base/common/network", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryIpc", "vs/platform/telemetry/common/telemetryLogAppender", "vs/platform/telemetry/common/telemetryService"], function (require, exports, network_1, ipc_cp_1, configuration_1, environment_1, log_1, productService_1, telemetry_1, telemetryIpc_1, telemetryLogAppender_1, telemetryService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEndpointTelemetryService = void 0;
    let CustomEndpointTelemetryService = class CustomEndpointTelemetryService {
        constructor(configurationService, telemetryService, logService, loggerService, environmentService, productService) {
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.loggerService = loggerService;
            this.environmentService = environmentService;
            this.productService = productService;
            this.customTelemetryServices = new Map();
        }
        getCustomTelemetryService(endpoint) {
            if (!this.customTelemetryServices.has(endpoint.id)) {
                const telemetryInfo = Object.create(null);
                telemetryInfo['common.vscodemachineid'] = this.telemetryService.machineId;
                telemetryInfo['common.vscodesessionid'] = this.telemetryService.sessionId;
                const args = [endpoint.id, JSON.stringify(telemetryInfo), endpoint.aiKey];
                const client = new ipc_cp_1.Client(network_1.FileAccess.asFileUri('bootstrap-fork').fsPath, {
                    serverName: 'Debug Telemetry',
                    timeout: 1000 * 60 * 5,
                    args,
                    env: {
                        ELECTRON_RUN_AS_NODE: 1,
                        VSCODE_PIPE_LOGGING: 'true',
                        VSCODE_AMD_ENTRYPOINT: 'vs/workbench/contrib/debug/node/telemetryApp'
                    }
                });
                const channel = client.getChannel('telemetryAppender');
                const appenders = [
                    new telemetryIpc_1.TelemetryAppenderClient(channel),
                    new telemetryLogAppender_1.TelemetryLogAppender(this.logService, this.loggerService, this.environmentService, this.productService, `[${endpoint.id}] `),
                ];
                this.customTelemetryServices.set(endpoint.id, new telemetryService_1.TelemetryService({
                    appenders,
                    sendErrorTelemetry: endpoint.sendErrorTelemetry
                }, this.configurationService, this.productService));
            }
            return this.customTelemetryServices.get(endpoint.id);
        }
        publicLog(telemetryEndpoint, eventName, data) {
            const customTelemetryService = this.getCustomTelemetryService(telemetryEndpoint);
            customTelemetryService.publicLog(eventName, data);
        }
        publicLogError(telemetryEndpoint, errorEventName, data) {
            const customTelemetryService = this.getCustomTelemetryService(telemetryEndpoint);
            customTelemetryService.publicLogError(errorEventName, data);
        }
    };
    exports.CustomEndpointTelemetryService = CustomEndpointTelemetryService;
    exports.CustomEndpointTelemetryService = CustomEndpointTelemetryService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, log_1.ILogService),
        __param(3, log_1.ILoggerService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, productService_1.IProductService)
    ], CustomEndpointTelemetryService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRW5kcG9pbnRUZWxlbWV0cnlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVsZW1ldHJ5L25vZGUvY3VzdG9tRW5kcG9pbnRUZWxlbWV0cnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWF6RixJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUE4QjtRQUsxQyxZQUN3QixvQkFBNEQsRUFDaEUsZ0JBQW9ELEVBQzFELFVBQXdDLEVBQ3JDLGFBQThDLEVBQ3pDLGtCQUF3RCxFQUM1RCxjQUFnRDtZQUx6Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQy9DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDekMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNwQixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDeEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMzQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFSMUQsNEJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQTZCLENBQUM7UUFTbkUsQ0FBQztRQUVHLHlCQUF5QixDQUFDLFFBQTRCO1lBQzdELElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNwRCxNQUFNLGFBQWEsR0FBOEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckUsYUFBYSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQztnQkFDMUUsYUFBYSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQztnQkFDMUUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQWUsQ0FDakMsb0JBQVUsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLEVBQzdDO29CQUNDLFVBQVUsRUFBRSxpQkFBaUI7b0JBQzdCLE9BQU8sRUFBRSxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ3RCLElBQUk7b0JBQ0osR0FBRyxFQUFFO3dCQUNKLG9CQUFvQixFQUFFLENBQUM7d0JBQ3ZCLG1CQUFtQixFQUFFLE1BQU07d0JBQzNCLHFCQUFxQixFQUFFLDhDQUE4QztxQkFDckU7aUJBQ0QsQ0FDRCxDQUFDO2dCQUVGLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxTQUFTLEdBQUc7b0JBQ2pCLElBQUksc0NBQXVCLENBQUMsT0FBTyxDQUFDO29CQUNwQyxJQUFJLDJDQUFvQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLFFBQVEsQ0FBQyxFQUFFLElBQUksQ0FBQztpQkFDaEksQ0FBQztnQkFFRixJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxtQ0FBZ0IsQ0FBQztvQkFDbEUsU0FBUztvQkFDVCxrQkFBa0IsRUFBRSxRQUFRLENBQUMsa0JBQWtCO2lCQUMvQyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUNyRCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUN2RCxDQUFDO1FBRUQsU0FBUyxDQUFDLGlCQUFxQyxFQUFFLFNBQWlCLEVBQUUsSUFBcUI7WUFDeEYsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNqRixzQkFBc0IsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCxjQUFjLENBQUMsaUJBQXFDLEVBQUUsY0FBc0IsRUFBRSxJQUFxQjtZQUNsRyxNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2pGLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDN0QsQ0FBQztLQUNELENBQUE7SUExRFksd0VBQThCOzZDQUE5Qiw4QkFBOEI7UUFNeEMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsb0JBQWMsQ0FBQTtRQUNkLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxnQ0FBZSxDQUFBO09BWEwsOEJBQThCLENBMEQxQyJ9