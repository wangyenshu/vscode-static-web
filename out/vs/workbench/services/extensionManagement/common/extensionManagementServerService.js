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
define(["require", "exports", "vs/nls", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/network", "vs/platform/instantiation/common/extensions", "vs/platform/label/common/label", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensionManagement/common/webExtensionManagementService", "vs/workbench/services/extensionManagement/common/remoteExtensionManagementService"], function (require, exports, nls_1, extensionManagement_1, remoteAgentService_1, network_1, extensions_1, label_1, platform_1, instantiation_1, webExtensionManagementService_1, remoteExtensionManagementService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementServerService = void 0;
    let ExtensionManagementServerService = class ExtensionManagementServerService {
        constructor(remoteAgentService, labelService, instantiationService) {
            this.localExtensionManagementServer = null;
            this.remoteExtensionManagementServer = null;
            this.webExtensionManagementServer = null;
            const remoteAgentConnection = remoteAgentService.getConnection();
            if (remoteAgentConnection) {
                const extensionManagementService = instantiationService.createInstance(remoteExtensionManagementService_1.RemoteExtensionManagementService, remoteAgentConnection.getChannel('extensions'));
                this.remoteExtensionManagementServer = {
                    id: 'remote',
                    extensionManagementService,
                    get label() { return labelService.getHostLabel(network_1.Schemas.vscodeRemote, remoteAgentConnection.remoteAuthority) || (0, nls_1.localize)('remote', "Remote"); },
                };
            }
            if (platform_1.isWeb) {
                const extensionManagementService = instantiationService.createInstance(webExtensionManagementService_1.WebExtensionManagementService);
                this.webExtensionManagementServer = {
                    id: 'web',
                    extensionManagementService,
                    label: (0, nls_1.localize)('browser', "Browser"),
                };
            }
        }
        getExtensionManagementServer(extension) {
            if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                return this.remoteExtensionManagementServer;
            }
            if (this.webExtensionManagementServer) {
                return this.webExtensionManagementServer;
            }
            throw new Error(`Invalid Extension ${extension.location}`);
        }
        getExtensionInstallLocation(extension) {
            const server = this.getExtensionManagementServer(extension);
            return server === this.remoteExtensionManagementServer ? 2 /* ExtensionInstallLocation.Remote */ : 3 /* ExtensionInstallLocation.Web */;
        }
    };
    exports.ExtensionManagementServerService = ExtensionManagementServerService;
    exports.ExtensionManagementServerService = ExtensionManagementServerService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, label_1.ILabelService),
        __param(2, instantiation_1.IInstantiationService)
    ], ExtensionManagementServerService);
    (0, extensions_1.registerSingleton)(extensionManagement_1.IExtensionManagementServerService, ExtensionManagementServerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZlclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9uTWFuYWdlbWVudC9jb21tb24vZXh0ZW5zaW9uTWFuYWdlbWVudFNlcnZlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZXpGLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWdDO1FBUTVDLFlBQ3NCLGtCQUF1QyxFQUM3QyxZQUEyQixFQUNuQixvQkFBMkM7WUFQMUQsbUNBQThCLEdBQXNDLElBQUksQ0FBQztZQUN6RSxvQ0FBK0IsR0FBc0MsSUFBSSxDQUFDO1lBQzFFLGlDQUE0QixHQUFzQyxJQUFJLENBQUM7WUFPL0UsTUFBTSxxQkFBcUIsR0FBRyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNqRSxJQUFJLHFCQUFxQixFQUFFLENBQUM7Z0JBQzNCLE1BQU0sMEJBQTBCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1FQUFnQyxFQUFFLHFCQUFxQixDQUFDLFVBQVUsQ0FBVyxZQUFZLENBQUMsQ0FBQyxDQUFDO2dCQUNuSyxJQUFJLENBQUMsK0JBQStCLEdBQUc7b0JBQ3RDLEVBQUUsRUFBRSxRQUFRO29CQUNaLDBCQUEwQjtvQkFDMUIsSUFBSSxLQUFLLEtBQUssT0FBTyxZQUFZLENBQUMsWUFBWSxDQUFDLGlCQUFPLENBQUMsWUFBWSxFQUFFLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQzlJLENBQUM7WUFDSCxDQUFDO1lBQ0QsSUFBSSxnQkFBSyxFQUFFLENBQUM7Z0JBQ1gsTUFBTSwwQkFBMEIsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkRBQTZCLENBQUMsQ0FBQztnQkFDdEcsSUFBSSxDQUFDLDRCQUE0QixHQUFHO29CQUNuQyxFQUFFLEVBQUUsS0FBSztvQkFDVCwwQkFBMEI7b0JBQzFCLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsU0FBUyxDQUFDO2lCQUNyQyxDQUFDO1lBQ0gsQ0FBQztRQUNGLENBQUM7UUFFRCw0QkFBNEIsQ0FBQyxTQUFxQjtZQUNqRCxJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3hELE9BQU8sSUFBSSxDQUFDLCtCQUFnQyxDQUFDO1lBQzlDLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO2dCQUN2QyxPQUFPLElBQUksQ0FBQyw0QkFBNEIsQ0FBQztZQUMxQyxDQUFDO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUVELDJCQUEyQixDQUFDLFNBQXFCO1lBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM1RCxPQUFPLE1BQU0sS0FBSyxJQUFJLENBQUMsK0JBQStCLENBQUMsQ0FBQyx5Q0FBaUMsQ0FBQyxxQ0FBNkIsQ0FBQztRQUN6SCxDQUFDO0tBQ0QsQ0FBQTtJQTlDWSw0RUFBZ0M7K0NBQWhDLGdDQUFnQztRQVMxQyxXQUFBLHdDQUFtQixDQUFBO1FBQ25CLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEscUNBQXFCLENBQUE7T0FYWCxnQ0FBZ0MsQ0E4QzVDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyx1REFBaUMsRUFBRSxnQ0FBZ0Msb0NBQTRCLENBQUMifQ==