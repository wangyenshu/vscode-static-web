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
define(["require", "exports", "vs/nls", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/common/abstractRemoteAgentService", "vs/platform/product/common/productService", "vs/platform/sign/common/sign", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/workbench/common/contributions", "vs/workbench/services/host/browser/host", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/remote/common/remoteSocketFactoryService"], function (require, exports, nls, environmentService_1, remoteAgentService_1, remoteAuthorityResolver_1, abstractRemoteAgentService_1, productService_1, sign_1, log_1, notification_1, dialogs_1, contributions_1, host_1, userDataProfile_1, remoteSocketFactoryService_1) {
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
        static { this.ID = 'workbench.contrib.browserRemoteConnectionFailureNotification'; }
        constructor(remoteAgentService, _dialogService, _hostService) {
            this._dialogService = _dialogService;
            this._hostService = _hostService;
            // Let's cover the case where connecting to fetch the remote extension info fails
            remoteAgentService.getRawEnvironment()
                .then(undefined, (err) => {
                if (!remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err)) {
                    this._presentConnectionError(err);
                }
            });
        }
        async _presentConnectionError(err) {
            await this._dialogService.prompt({
                type: notification_1.Severity.Error,
                message: nls.localize('connectionError', "An unexpected error occurred that requires a reload of this page."),
                detail: nls.localize('connectionErrorDetail', "The workbench failed to connect to the server (Error: {0})", err ? err.message : ''),
                buttons: [
                    {
                        label: nls.localize({ key: 'reload', comment: ['&& denotes a mnemonic'] }, "&&Reload"),
                        run: () => this._hostService.reload()
                    }
                ]
            });
        }
    };
    RemoteConnectionFailureNotificationContribution = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, dialogs_1.IDialogService),
        __param(2, host_1.IHostService)
    ], RemoteConnectionFailureNotificationContribution);
    (0, contributions_1.registerWorkbenchContribution2)(RemoteConnectionFailureNotificationContribution.ID, RemoteConnectionFailureNotificationContribution, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQWdlbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3JlbW90ZS9icm93c2VyL3JlbW90ZUFnZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQnpGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsdURBQTBCO1FBRWpFLFlBQzhCLDBCQUF1RCxFQUMzRCxzQkFBK0MsRUFDMUMsa0JBQWdELEVBQzdELGNBQStCLEVBQ2YsOEJBQStELEVBQ2xGLFdBQXlCLEVBQzFCLFVBQXVCO1lBRXBDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxzQkFBc0IsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsOEJBQThCLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3hKLENBQUM7S0FDRCxDQUFBO0lBYlksZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUFHNUIsV0FBQSx3REFBMkIsQ0FBQTtRQUMzQixXQUFBLHlDQUF1QixDQUFBO1FBQ3ZCLFdBQUEsaURBQTRCLENBQUE7UUFDNUIsV0FBQSxnQ0FBZSxDQUFBO1FBQ2YsV0FBQSx5REFBK0IsQ0FBQTtRQUMvQixXQUFBLG1CQUFZLENBQUE7UUFDWixXQUFBLGlCQUFXLENBQUE7T0FURCxrQkFBa0IsQ0FhOUI7SUFFRCxJQUFNLCtDQUErQyxHQUFyRCxNQUFNLCtDQUErQztpQkFFcEMsT0FBRSxHQUFHLDhEQUE4RCxBQUFqRSxDQUFrRTtRQUVwRixZQUNzQixrQkFBdUMsRUFDM0IsY0FBOEIsRUFDaEMsWUFBMEI7WUFEeEIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ2hDLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBRXpELGlGQUFpRjtZQUNqRixrQkFBa0IsQ0FBQyxpQkFBaUIsRUFBRTtpQkFDcEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUN4QixJQUFJLENBQUMsc0RBQTRCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ2xELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxHQUFRO1lBQzdDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7Z0JBQ2hDLElBQUksRUFBRSx1QkFBUSxDQUFDLEtBQUs7Z0JBQ3BCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLG1FQUFtRSxDQUFDO2dCQUM3RyxNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSw0REFBNEQsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbkksT0FBTyxFQUFFO29CQUNSO3dCQUNDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDO3dCQUN0RixHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUU7cUJBQ3JDO2lCQUNEO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQzs7SUE5QkksK0NBQStDO1FBS2xELFdBQUEsd0NBQW1CLENBQUE7UUFDbkIsV0FBQSx3QkFBYyxDQUFBO1FBQ2QsV0FBQSxtQkFBWSxDQUFBO09BUFQsK0NBQStDLENBZ0NwRDtJQUVELElBQUEsOENBQThCLEVBQUMsK0NBQStDLENBQUMsRUFBRSxFQUFFLCtDQUErQyxzQ0FBOEIsQ0FBQyJ9