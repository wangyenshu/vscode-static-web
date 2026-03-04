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
define(["require", "exports", "vs/base/common/functional", "vs/base/common/platform", "vs/base/common/severity", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/encryption/common/encryptionService", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/secrets/common/secrets", "vs/platform/storage/common/storage", "vs/workbench/services/configuration/common/jsonEditing"], function (require, exports, functional_1, platform_1, severity_1, nls_1, dialogs_1, encryptionService_1, environment_1, extensions_1, log_1, notification_1, opener_1, secrets_1, storage_1, jsonEditing_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeSecretStorageService = void 0;
    let NativeSecretStorageService = class NativeSecretStorageService extends secrets_1.BaseSecretStorageService {
        constructor(_notificationService, _dialogService, _openerService, _jsonEditingService, _environmentService, storageService, encryptionService, logService) {
            super(!!_environmentService.useInMemorySecretStorage, storageService, encryptionService, logService);
            this._notificationService = _notificationService;
            this._dialogService = _dialogService;
            this._openerService = _openerService;
            this._jsonEditingService = _jsonEditingService;
            this._environmentService = _environmentService;
            this.notifyOfNoEncryptionOnce = (0, functional_1.createSingleCallFunction)(() => this.notifyOfNoEncryption());
        }
        set(key, value) {
            this._sequencer.queue(key, async () => {
                await this.resolvedStorageService;
                if (this.type !== 'persisted' && !this._environmentService.useInMemorySecretStorage) {
                    this._logService.trace('[NativeSecretStorageService] Notifying user that secrets are not being stored on disk.');
                    await this.notifyOfNoEncryptionOnce();
                }
            });
            return super.set(key, value);
        }
        async notifyOfNoEncryption() {
            const buttons = [];
            const troubleshootingButton = {
                label: (0, nls_1.localize)('troubleshootingButton', "Open troubleshooting guide"),
                run: () => this._openerService.open('https://go.microsoft.com/fwlink/?linkid=2239490'),
                // doesn't close dialogs
                keepOpen: true
            };
            buttons.push(troubleshootingButton);
            let errorMessage = (0, nls_1.localize)('encryptionNotAvailableJustTroubleshootingGuide', "An OS keyring couldn't be identified for storing the encryption related data in your current desktop environment.");
            if (!platform_1.isLinux) {
                this._notificationService.prompt(severity_1.default.Error, errorMessage, buttons);
                return;
            }
            const provider = await this._encryptionService.getKeyStorageProvider();
            if (provider === "basic_text" /* KnownStorageProvider.basicText */) {
                const detail = (0, nls_1.localize)('usePlainTextExtraSentence', "Open the troubleshooting guide to address this or you can use weaker encryption that doesn't use the OS keyring.");
                const usePlainTextButton = {
                    label: (0, nls_1.localize)('usePlainText', "Use weaker encryption"),
                    run: async () => {
                        await this._encryptionService.setUsePlainTextEncryption();
                        await this._jsonEditingService.write(this._environmentService.argvResource, [{ path: ['password-store'], value: "basic" /* PasswordStoreCLIOption.basic */ }], true);
                        this.reinitialize();
                    }
                };
                buttons.unshift(usePlainTextButton);
                await this._dialogService.prompt({
                    type: 'error',
                    buttons,
                    message: errorMessage,
                    detail
                });
                return;
            }
            if ((0, encryptionService_1.isGnome)(provider)) {
                errorMessage = (0, nls_1.localize)('isGnome', "You're running in a GNOME environment but the OS keyring is not available for encryption. Ensure you have gnome-keyring or another libsecret compatible implementation installed and running.");
            }
            else if ((0, encryptionService_1.isKwallet)(provider)) {
                errorMessage = (0, nls_1.localize)('isKwallet', "You're running in a KDE environment but the OS keyring is not available for encryption. Ensure you have kwallet running.");
            }
            this._notificationService.prompt(severity_1.default.Error, errorMessage, buttons);
        }
    };
    exports.NativeSecretStorageService = NativeSecretStorageService;
    exports.NativeSecretStorageService = NativeSecretStorageService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, dialogs_1.IDialogService),
        __param(2, opener_1.IOpenerService),
        __param(3, jsonEditing_1.IJSONEditingService),
        __param(4, environment_1.INativeEnvironmentService),
        __param(5, storage_1.IStorageService),
        __param(6, encryptionService_1.IEncryptionService),
        __param(7, log_1.ILogService)
    ], NativeSecretStorageService);
    (0, extensions_1.registerSingleton)(secrets_1.ISecretStorageService, NativeSecretStorageService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0U3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VjcmV0cy9lbGVjdHJvbi1zYW5kYm94L3NlY3JldFN0b3JhZ2VTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCekYsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMkIsU0FBUSxrQ0FBd0I7UUFFdkUsWUFDdUIsb0JBQTJELEVBQ2pFLGNBQStDLEVBQy9DLGNBQStDLEVBQzFDLG1CQUF5RCxFQUNuRCxtQkFBK0QsRUFDekUsY0FBK0IsRUFDNUIsaUJBQXFDLEVBQzVDLFVBQXVCO1lBRXBDLEtBQUssQ0FDSixDQUFDLENBQUMsbUJBQW1CLENBQUMsd0JBQXdCLEVBQzlDLGNBQWMsRUFDZCxpQkFBaUIsRUFDakIsVUFBVSxDQUNWLENBQUM7WUFkcUMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUNoRCxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDOUIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ3pCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDbEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUEyQjtZQTJCbkYsNkJBQXdCLEdBQUcsSUFBQSxxQ0FBd0IsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO1FBaEIvRixDQUFDO1FBRVEsR0FBRyxDQUFDLEdBQVcsRUFBRSxLQUFhO1lBQ3RDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDckMsTUFBTSxJQUFJLENBQUMsc0JBQXNCLENBQUM7Z0JBRWxDLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxXQUFXLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztvQkFDckYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsd0ZBQXdGLENBQUMsQ0FBQztvQkFDakgsTUFBTSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDdkMsQ0FBQztZQUVGLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBR08sS0FBSyxDQUFDLG9CQUFvQjtZQUNqQyxNQUFNLE9BQU8sR0FBb0IsRUFBRSxDQUFDO1lBQ3BDLE1BQU0scUJBQXFCLEdBQWtCO2dCQUM1QyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsNEJBQTRCLENBQUM7Z0JBQ3RFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxpREFBaUQsQ0FBQztnQkFDdEYsd0JBQXdCO2dCQUN4QixRQUFRLEVBQUUsSUFBSTthQUNkLENBQUM7WUFDRixPQUFPLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFFcEMsSUFBSSxZQUFZLEdBQUcsSUFBQSxjQUFRLEVBQUMsZ0RBQWdELEVBQUUsbUhBQW1ILENBQUMsQ0FBQztZQUVuTSxJQUFJLENBQUMsa0JBQU8sRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsa0JBQVEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUN4RSxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDdkUsSUFBSSxRQUFRLHNEQUFtQyxFQUFFLENBQUM7Z0JBQ2pELE1BQU0sTUFBTSxHQUFHLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLGtIQUFrSCxDQUFDLENBQUM7Z0JBQ3pLLE1BQU0sa0JBQWtCLEdBQWtCO29CQUN6QyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLHVCQUF1QixDQUFDO29CQUN4RCxHQUFHLEVBQUUsS0FBSyxJQUFJLEVBQUU7d0JBQ2YsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMseUJBQXlCLEVBQUUsQ0FBQzt3QkFDMUQsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsS0FBSyw0Q0FBOEIsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQ3ZKLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDckIsQ0FBQztpQkFDRCxDQUFDO2dCQUNGLE9BQU8sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFFcEMsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQztvQkFDaEMsSUFBSSxFQUFFLE9BQU87b0JBQ2IsT0FBTztvQkFDUCxPQUFPLEVBQUUsWUFBWTtvQkFDckIsTUFBTTtpQkFDTixDQUFDLENBQUM7Z0JBQ0gsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLElBQUEsMkJBQU8sRUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUN2QixZQUFZLEdBQUcsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLCtMQUErTCxDQUFDLENBQUM7WUFDck8sQ0FBQztpQkFBTSxJQUFJLElBQUEsNkJBQVMsRUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxZQUFZLEdBQUcsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLDBIQUEwSCxDQUFDLENBQUM7WUFDbEssQ0FBQztZQUVELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsa0JBQVEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3pFLENBQUM7S0FDRCxDQUFBO0lBbEZZLGdFQUEwQjt5Q0FBMUIsMEJBQTBCO1FBR3BDLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSx3QkFBYyxDQUFBO1FBQ2QsV0FBQSx1QkFBYyxDQUFBO1FBQ2QsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLHVDQUF5QixDQUFBO1FBQ3pCLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSxpQkFBVyxDQUFBO09BVkQsMEJBQTBCLENBa0Z0QztJQUVELElBQUEsOEJBQWlCLEVBQUMsK0JBQXFCLEVBQUUsMEJBQTBCLG9DQUE0QixDQUFDIn0=