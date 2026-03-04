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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage"], function (require, exports, extensions_1, instantiation_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationUsageService = exports.IAuthenticationUsageService = void 0;
    exports.IAuthenticationUsageService = (0, instantiation_1.createDecorator)('IAuthenticationUsageService');
    let AuthenticationUsageService = class AuthenticationUsageService {
        constructor(_storageService) {
            this._storageService = _storageService;
        }
        readAccountUsages(providerId, accountName) {
            const accountKey = `${providerId}-${accountName}-usages`;
            const storedUsages = this._storageService.get(accountKey, -1 /* StorageScope.APPLICATION */);
            let usages = [];
            if (storedUsages) {
                try {
                    usages = JSON.parse(storedUsages);
                }
                catch (e) {
                    // ignore
                }
            }
            return usages;
        }
        removeAccountUsage(providerId, accountName) {
            const accountKey = `${providerId}-${accountName}-usages`;
            this._storageService.remove(accountKey, -1 /* StorageScope.APPLICATION */);
        }
        addAccountUsage(providerId, accountName, extensionId, extensionName) {
            const accountKey = `${providerId}-${accountName}-usages`;
            const usages = this.readAccountUsages(providerId, accountName);
            const existingUsageIndex = usages.findIndex(usage => usage.extensionId === extensionId);
            if (existingUsageIndex > -1) {
                usages.splice(existingUsageIndex, 1, {
                    extensionId,
                    extensionName,
                    lastUsed: Date.now()
                });
            }
            else {
                usages.push({
                    extensionId,
                    extensionName,
                    lastUsed: Date.now()
                });
            }
            this._storageService.store(accountKey, JSON.stringify(usages), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
    };
    exports.AuthenticationUsageService = AuthenticationUsageService;
    exports.AuthenticationUsageService = AuthenticationUsageService = __decorate([
        __param(0, storage_1.IStorageService)
    ], AuthenticationUsageService);
    (0, extensions_1.registerSingleton)(exports.IAuthenticationUsageService, AuthenticationUsageService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb25Vc2FnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYXV0aGVudGljYXRpb24vYnJvd3Nlci9hdXRoZW50aWNhdGlvblVzYWdlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZbkYsUUFBQSwyQkFBMkIsR0FBRyxJQUFBLCtCQUFlLEVBQThCLDZCQUE2QixDQUFDLENBQUM7SUFRaEgsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMEI7UUFHdEMsWUFBOEMsZUFBZ0M7WUFBaEMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1FBQUksQ0FBQztRQUVuRixpQkFBaUIsQ0FBQyxVQUFrQixFQUFFLFdBQW1CO1lBQ3hELE1BQU0sVUFBVSxHQUFHLEdBQUcsVUFBVSxJQUFJLFdBQVcsU0FBUyxDQUFDO1lBQ3pELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsb0NBQTJCLENBQUM7WUFDcEYsSUFBSSxNQUFNLEdBQW9CLEVBQUUsQ0FBQztZQUNqQyxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUM7b0JBQ0osTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ25DLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWixTQUFTO2dCQUNWLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBQ0Qsa0JBQWtCLENBQUMsVUFBa0IsRUFBRSxXQUFtQjtZQUN6RCxNQUFNLFVBQVUsR0FBRyxHQUFHLFVBQVUsSUFBSSxXQUFXLFNBQVMsQ0FBQztZQUN6RCxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxVQUFVLG9DQUEyQixDQUFDO1FBQ25FLENBQUM7UUFDRCxlQUFlLENBQUMsVUFBa0IsRUFBRSxXQUFtQixFQUFFLFdBQW1CLEVBQUUsYUFBcUI7WUFDbEcsTUFBTSxVQUFVLEdBQUcsR0FBRyxVQUFVLElBQUksV0FBVyxTQUFTLENBQUM7WUFDekQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUUvRCxNQUFNLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsV0FBVyxLQUFLLFdBQVcsQ0FBQyxDQUFDO1lBQ3hGLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLEVBQUU7b0JBQ3BDLFdBQVc7b0JBQ1gsYUFBYTtvQkFDYixRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtpQkFDcEIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxJQUFJLENBQUM7b0JBQ1gsV0FBVztvQkFDWCxhQUFhO29CQUNiLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO2lCQUNwQixDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLG1FQUFrRCxDQUFDO1FBQ2pILENBQUM7S0FDRCxDQUFBO0lBNUNZLGdFQUEwQjt5Q0FBMUIsMEJBQTBCO1FBR3pCLFdBQUEseUJBQWUsQ0FBQTtPQUhoQiwwQkFBMEIsQ0E0Q3RDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxtQ0FBMkIsRUFBRSwwQkFBMEIsb0NBQTRCLENBQUMifQ==