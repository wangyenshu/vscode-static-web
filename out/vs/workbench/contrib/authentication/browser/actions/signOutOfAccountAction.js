/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/severity", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/browser/authenticationUsageService", "vs/workbench/services/authentication/common/authentication"], function (require, exports, severity_1, nls_1, actions_1, dialogs_1, authenticationAccessService_1, authenticationUsageService_1, authentication_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SignOutOfAccountAction = void 0;
    class SignOutOfAccountAction extends actions_1.Action2 {
        constructor() {
            super({
                id: '_signOutOfAccount',
                title: (0, nls_1.localize)('signOutOfAccount', "Sign out of account"),
                f1: false
            });
        }
        async run(accessor, { providerId, accountLabel }) {
            const authenticationService = accessor.get(authentication_1.IAuthenticationService);
            const authenticationUsageService = accessor.get(authenticationUsageService_1.IAuthenticationUsageService);
            const authenticationAccessService = accessor.get(authenticationAccessService_1.IAuthenticationAccessService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            if (!providerId || !accountLabel) {
                throw new Error('Invalid arguments. Expected: { providerId: string; accountLabel: string }');
            }
            const allSessions = await authenticationService.getSessions(providerId);
            const sessions = allSessions.filter(s => s.account.label === accountLabel);
            const accountUsages = authenticationUsageService.readAccountUsages(providerId, accountLabel);
            const { confirmed } = await dialogService.confirm({
                type: severity_1.default.Info,
                message: accountUsages.length
                    ? (0, nls_1.localize)('signOutMessage', "The account '{0}' has been used by: \n\n{1}\n\n Sign out from these extensions?", accountLabel, accountUsages.map(usage => usage.extensionName).join('\n'))
                    : (0, nls_1.localize)('signOutMessageSimple', "Sign out of '{0}'?", accountLabel),
                primaryButton: (0, nls_1.localize)({ key: 'signOut', comment: ['&& denotes a mnemonic'] }, "&&Sign Out")
            });
            if (confirmed) {
                const removeSessionPromises = sessions.map(session => authenticationService.removeSession(providerId, session.id));
                await Promise.all(removeSessionPromises);
                authenticationUsageService.removeAccountUsage(providerId, accountLabel);
                authenticationAccessService.removeAllowedExtensions(providerId, accountLabel);
            }
        }
    }
    exports.SignOutOfAccountAction = SignOutOfAccountAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbk91dE9mQWNjb3VudEFjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2F1dGhlbnRpY2F0aW9uL2Jyb3dzZXIvYWN0aW9ucy9zaWduT3V0T2ZBY2NvdW50QWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFhLHNCQUF1QixTQUFRLGlCQUFPO1FBQ2xEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxtQkFBbUI7Z0JBQ3ZCLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxxQkFBcUIsQ0FBQztnQkFDMUQsRUFBRSxFQUFFLEtBQUs7YUFDVCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBZ0Q7WUFDeEgsTUFBTSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUFzQixDQUFDLENBQUM7WUFDbkUsTUFBTSwwQkFBMEIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdEQUEyQixDQUFDLENBQUM7WUFDN0UsTUFBTSwyQkFBMkIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBEQUE0QixDQUFDLENBQUM7WUFDL0UsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBYyxDQUFDLENBQUM7WUFFbkQsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNsQyxNQUFNLElBQUksS0FBSyxDQUFDLDJFQUEyRSxDQUFDLENBQUM7WUFDOUYsQ0FBQztZQUVELE1BQU0sV0FBVyxHQUFHLE1BQU0scUJBQXFCLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssS0FBSyxZQUFZLENBQUMsQ0FBQztZQUUzRSxNQUFNLGFBQWEsR0FBRywwQkFBMEIsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFN0YsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLE1BQU0sYUFBYSxDQUFDLE9BQU8sQ0FBQztnQkFDakQsSUFBSSxFQUFFLGtCQUFRLENBQUMsSUFBSTtnQkFDbkIsT0FBTyxFQUFFLGFBQWEsQ0FBQyxNQUFNO29CQUM1QixDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsaUZBQWlGLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN6TCxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsb0JBQW9CLEVBQUUsWUFBWSxDQUFDO2dCQUN2RSxhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUM7YUFDN0YsQ0FBQyxDQUFDO1lBRUgsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixNQUFNLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuSCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFDekMsMEJBQTBCLENBQUMsa0JBQWtCLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUN4RSwyQkFBMkIsQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDL0UsQ0FBQztRQUNGLENBQUM7S0FDRDtJQXZDRCx3REF1Q0MifQ==