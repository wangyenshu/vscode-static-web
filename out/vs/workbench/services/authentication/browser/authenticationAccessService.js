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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/product/common/productService", "vs/platform/storage/common/storage"], function (require, exports, event_1, lifecycle_1, extensions_1, instantiation_1, productService_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationAccessService = exports.IAuthenticationAccessService = void 0;
    exports.IAuthenticationAccessService = (0, instantiation_1.createDecorator)('IAuthenticationAccessService');
    // TODO@TylerLeonhardt: Move this class to MainThreadAuthentication
    let AuthenticationAccessService = class AuthenticationAccessService extends lifecycle_1.Disposable {
        constructor(_storageService, _productService) {
            super();
            this._storageService = _storageService;
            this._productService = _productService;
            this._onDidChangeExtensionSessionAccess = this._register(new event_1.Emitter());
            this.onDidChangeExtensionSessionAccess = this._onDidChangeExtensionSessionAccess.event;
        }
        isAccessAllowed(providerId, accountName, extensionId) {
            const trustedExtensionAuthAccess = this._productService.trustedExtensionAuthAccess;
            if (Array.isArray(trustedExtensionAuthAccess)) {
                if (trustedExtensionAuthAccess.includes(extensionId)) {
                    return true;
                }
            }
            else if (trustedExtensionAuthAccess?.[providerId]?.includes(extensionId)) {
                return true;
            }
            const allowList = this.readAllowedExtensions(providerId, accountName);
            const extensionData = allowList.find(extension => extension.id === extensionId);
            if (!extensionData) {
                return undefined;
            }
            // This property didn't exist on this data previously, inclusion in the list at all indicates allowance
            return extensionData.allowed !== undefined
                ? extensionData.allowed
                : true;
        }
        readAllowedExtensions(providerId, accountName) {
            let trustedExtensions = [];
            try {
                const trustedExtensionSrc = this._storageService.get(`${providerId}-${accountName}`, -1 /* StorageScope.APPLICATION */);
                if (trustedExtensionSrc) {
                    trustedExtensions = JSON.parse(trustedExtensionSrc);
                }
            }
            catch (err) { }
            return trustedExtensions;
        }
        updateAllowedExtensions(providerId, accountName, extensions) {
            const allowList = this.readAllowedExtensions(providerId, accountName);
            for (const extension of extensions) {
                const index = allowList.findIndex(e => e.id === extension.id);
                if (index === -1) {
                    allowList.push(extension);
                }
                else {
                    allowList[index].allowed = extension.allowed;
                }
            }
            this._storageService.store(`${providerId}-${accountName}`, JSON.stringify(allowList), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            this._onDidChangeExtensionSessionAccess.fire({ providerId, accountName });
        }
        removeAllowedExtensions(providerId, accountName) {
            this._storageService.remove(`${providerId}-${accountName}`, -1 /* StorageScope.APPLICATION */);
            this._onDidChangeExtensionSessionAccess.fire({ providerId, accountName });
        }
    };
    exports.AuthenticationAccessService = AuthenticationAccessService;
    exports.AuthenticationAccessService = AuthenticationAccessService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, productService_1.IProductService)
    ], AuthenticationAccessService);
    (0, extensions_1.registerSingleton)(exports.IAuthenticationAccessService, AuthenticationAccessService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb25BY2Nlc3NTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2F1dGhlbnRpY2F0aW9uL2Jyb3dzZXIvYXV0aGVudGljYXRpb25BY2Nlc3NTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVuRixRQUFBLDRCQUE0QixHQUFHLElBQUEsK0JBQWUsRUFBK0IsOEJBQThCLENBQUMsQ0FBQztJQW9CMUgsbUVBQW1FO0lBQzVELElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFNMUQsWUFDa0IsZUFBaUQsRUFDakQsZUFBaUQ7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFIMEIsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ2hDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUwzRCx1Q0FBa0MsR0FBeUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBK0MsQ0FBQyxDQUFDO1lBQ3JLLHNDQUFpQyxHQUF1RCxJQUFJLENBQUMsa0NBQWtDLENBQUMsS0FBSyxDQUFDO1FBTy9JLENBQUM7UUFFRCxlQUFlLENBQUMsVUFBa0IsRUFBRSxXQUFtQixFQUFFLFdBQW1CO1lBQzNFLE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQywwQkFBMEIsQ0FBQztZQUNuRixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO29CQUN0RCxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxJQUFJLDBCQUEwQixFQUFFLENBQUMsVUFB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