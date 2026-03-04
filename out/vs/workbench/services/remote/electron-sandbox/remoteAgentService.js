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
define(["require", "exports", "vs/nls", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/product/common/productService", "vs/workbench/services/remote/common/abstractRemoteAgentService", "vs/platform/sign/common/sign", "vs/platform/log/common/log", "vs/workbench/services/environment/common/environmentService", "vs/platform/notification/common/notification", "vs/workbench/common/contributions", "vs/platform/telemetry/common/telemetry", "vs/platform/native/common/native", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/remote/common/remoteSocketFactoryService"], function (require, exports, nls, remoteAgentService_1, remoteAuthorityResolver_1, productService_1, abstractRemoteAgentService_1, sign_1, log_1, environmentService_1, notification_1, contributions_1, telemetry_1, native_1, uri_1, opener_1, userDataProfile_1, remoteSocketFactoryService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentService = void 0;
    let RemoteAgentService = class RemoteAgentService extends abstractRemoteAgentService_1.AbstractRemoteAgentService {
        constructor(remoteSocketFactoryService, userDataProfileService, environmentService, productService, remoteAuthorityResolverService, signService, logService) {
            super(remoteSocketFactoryService, userDataProfileService, environmentService, productService, remoteAuthorityResolverService, signService, logService);
        }
    };
    exports.RemoteAgentService = RemoteAgentService;
    exports.RemoteAgentService = RemoteAgentService = __decorate([
        __param(0, remoteSocketFactoryService_1.IRemoteSocketFactoryService),
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, productService_1.IProductService),
        __param(4, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(5, sign_1.ISignService),
        __param(6, log_1.ILogService)
    ], RemoteAgentService);
    let RemoteConnectionFailureNotificationContribution = class RemoteConnectionFailureNotificationContribution {
        static { this.ID = 'workbench.contrib.nativeRemoteConnectionFailureNotification'; }
        constructor(_remoteAgentService, notificationService, environmentService, telemetryService, nativeHostService, _remoteAuthorityResolverService, openerService) {
            this._remoteAgentService = _remoteAgentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            // Let's cover the case where connecting to fetch the remote extension info fails
            this._remoteAgentService.getRawEnvironment()
                .then(undefined, err => {
                if (!remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err)) {
                    const choices = [
                        {
                            label: nls.localize('devTools', "Open Developer Tools"),
                            run: () => nativeHostService.openDevTools()
                        }
                    ];
                    const troubleshootingURL = this._getTroubleshootingURL();
                    if (troubleshootingURL) {
                        choices.push({
                            label: nls.localize('directUrl', "Open in browser"),
                            run: () => openerService.open(troubleshootingURL, { openExternal: true })
                        });
                    }
                    notificationService.prompt(notification_1.Severity.Error, nls.localize('connectionError', "Failed to connect to the remote extension host server (Error: {0})", err ? err.message : ''), choices);
                }
            });
        }
        _getTroubleshootingURL() {
            const remoteAgentConnection = this._remoteAgentService.getConnection();
            if (!remoteAgentConnection) {
                return null;
            }
            const connectionData = this._remoteAuthorityResolverService.getConnectionData(remoteAgentConnection.remoteAuthority);
            if (!connectionData || connectionData.connectTo.type !== 0 /* RemoteConnectionType.WebSocket */) {
                return null;
            }
            return uri_1.URI.from({
                scheme: 'http',
                authority: `${connectionData.connectTo.host}:${connectionData.connectTo.port}`,
                path: `/version`
            });
        }
    };
    RemoteConnectionFailureNotificationContribution = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, notification_1.INotificationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, native_1.INativeHostService),
        __param(5, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(6, opener_1.IOpenerService)
    ], RemoteConnectionFailureNotificationContribution);
    (0, contributions_1.registerWorkbenchContribution2)(RemoteConnectionFailureNotificationContribution.ID, RemoteConnectionFailureNotificationContribution, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQWdlbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3JlbW90ZS9lbGVjdHJvbi1zYW5kYm94L3JlbW90ZUFnZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsdURBQTBCO1FBQ2pFLFlBQzhCLDBCQUF1RCxFQUMzRCxzQkFBK0MsRUFDMUMsa0JBQWdELEVBQzdELGNBQStCLEVBQ2YsOEJBQStELEVBQ2xGLFdBQXlCLEVBQzFCLFVBQXVCO1lBRXBDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxzQkFBc0IsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsOEJBQThCLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3hKLENBQUM7S0FDRCxDQUFBO0lBWlksZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUFFNUIsV0FBQSx3REFBMkIsQ0FBQTtRQUMzQixXQUFBLHlDQUF1QixDQUFBO1FBQ3ZCLFdBQUEsaURBQTRCLENBQUE7UUFDNUIsV0FBQSxnQ0FBZSxDQUFBO1FBQ2YsV0FBQSx5REFBK0IsQ0FBQTtRQUMvQixXQUFBLG1CQUFZLENBQUE7UUFDWixXQUFBLGlCQUFXLENBQUE7T0FSRCxrQkFBa0IsQ0FZOUI7SUFFRCxJQUFNLCtDQUErQyxHQUFyRCxNQUFNLCtDQUErQztpQkFFcEMsT0FBRSxHQUFHLDZEQUE2RCxBQUFoRSxDQUFpRTtRQUVuRixZQUN1QyxtQkFBd0MsRUFDeEQsbUJBQXlDLEVBQ2pDLGtCQUFnRCxFQUMzRCxnQkFBbUMsRUFDbEMsaUJBQXFDLEVBQ1AsK0JBQWdFLEVBQ2xHLGFBQTZCO1lBTlAsd0JBQW1CLEdBQW5CLG1C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