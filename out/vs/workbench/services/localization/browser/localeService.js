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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/localization/common/locale", "vs/workbench/services/host/browser/host", "vs/platform/product/common/productService", "vs/platform/instantiation/common/extensions", "vs/base/common/cancellation", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/log/common/log"], function (require, exports, nls_1, platform_1, dialogs_1, locale_1, host_1, productService_1, extensions_1, cancellation_1, extensionManagement_1, log_1) {
    "use strict";
    var WebLocaleService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebLocaleService = void 0;
    let WebLocaleService = class WebLocaleService {
        static { WebLocaleService_1 = this; }
        static { this._LOCAL_STORAGE_EXTENSION_ID_KEY = 'vscode.nls.languagePackExtensionId'; }
        static { this._LOCAL_STORAGE_LOCALE_KEY = 'vscode.nls.locale'; }
        constructor(dialogService, hostService, productService) {
            this.dialogService = dialogService;
            this.hostService = hostService;
            this.productService = productService;
        }
        async setLocale(languagePackItem, _skipDialog = false) {
            const locale = languagePackItem.id;
            if (locale === platform_1.Language.value() || (!locale && platform_1.Language.value() === navigator.language.toLowerCase())) {
                return;
            }
            if (locale) {
                localStorage.setItem(WebLocaleService_1._LOCAL_STORAGE_LOCALE_KEY, locale);
                if (languagePackItem.extensionId) {
                    localStorage.setItem(WebLocaleService_1._LOCAL_STORAGE_EXTENSION_ID_KEY, languagePackItem.extensionId);
                }
            }
            else {
                localStorage.removeItem(WebLocaleService_1._LOCAL_STORAGE_LOCALE_KEY);
                localStorage.removeItem(WebLocaleService_1._LOCAL_STORAGE_EXTENSION_ID_KEY);
            }
            const restartDialog = await this.dialogService.confirm({
                type: 'info',
                message: (0, nls_1.localize)('relaunchDisplayLanguageMessage', "To change the display language, {0} needs to reload", this.productService.nameLong),
                detail: (0, nls_1.localize)('relaunchDisplayLanguageDetail', "Press the reload button to refresh the page and set the display language to {0}.", languagePackItem.label),
                primaryButton: (0, nls_1.localize)({ key: 'reload', comment: ['&& denotes a mnemonic character'] }, "&&Reload"),
            });
            if (restartDialog.confirmed) {
                this.hostService.restart();
            }
        }
        async clearLocalePreference() {
            localStorage.removeItem(WebLocaleService_1._LOCAL_STORAGE_LOCALE_KEY);
            localStorage.removeItem(WebLocaleService_1._LOCAL_STORAGE_EXTENSION_ID_KEY);
            if (platform_1.Language.value() === navigator.language.toLowerCase()) {
                return;
            }
            const restartDialog = await this.dialogService.confirm({
                type: 'info',
                message: (0, nls_1.localize)('clearDisplayLanguageMessage', "To change the display language, {0} needs to reload", this.productService.nameLong),
                detail: (0, nls_1.localize)('clearDisplayLanguageDetail', "Press the reload button to refresh the page and use your browser's language."),
                primaryButton: (0, nls_1.localize)({ key: 'reload', comment: ['&& denotes a mnemonic character'] }, "&&Reload"),
            });
            if (restartDialog.confirmed) {
                this.hostService.restart();
            }
        }
    };
    exports.WebLocaleService = WebLocaleService;
    exports.WebLocaleService = WebLocaleService = WebLocaleService_1 = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, host_1.IHostService),
        __param(2, productService_1.IProductService)
    ], WebLocaleService);
    let WebActiveLanguagePackService = class WebActiveLanguagePackService {
        constructor(galleryService, logService) {
            this.galleryService = galleryService;
            this.logService = logService;
        }
        async getExtensionIdProvidingCurrentLocale() {
            const language = platform_1.Language.value();
            if (language === platform_1.LANGUAGE_DEFAULT) {
                return undefined;
            }
            const extensionId = localStorage.getItem(WebLocaleService._LOCAL_STORAGE_EXTENSION_ID_KEY);
            if (extensionId) {
                return extensionId;
            }
            if (!this.galleryService.isEnabled()) {
                return undefined;
            }
            try {
                const tagResult = await this.galleryService.query({ text: `tag:lp-${language}` }, cancellation_1.CancellationToken.None);
                // Only install extensions that are published by Microsoft and start with vscode-language-pack for extra certainty
                const extensionToInstall = tagResult.firstPage.find(e => e.publisher === 'MS-CEINTL' && e.name.startsWith('vscode-language-pack'));
                if (extensionToInstall) {
                    localStorage.setItem(WebLocaleService._LOCAL_STORAGE_EXTENSION_ID_KEY, extensionToInstall.identifier.id);
                    return extensionToInstall.identifier.id;
                }
                // TODO: If a non-Microsoft language pack is installed, we should prompt the user asking if they want to install that.
                // Since no such language packs exist yet, we can wait until that happens to implement this.
            }
            catch (e) {
                // Best effort
                this.logService.error(e);
            }
            return undefined;
        }
    };
    WebActiveLanguagePackService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService),
        __param(1, log_1.ILogService)
    ], WebActiveLanguagePackService);
    (0, extensions_1.registerSingleton)(locale_1.ILocaleService, WebLocaleService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(locale_1.IActiveLanguagePackService, WebActiveLanguagePackService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9sb2NhbGl6YXRpb24vYnJvd3Nlci9sb2NhbGVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFjekYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7O2lCQUVaLG9DQUErQixHQUFHLG9DQUFvQyxBQUF2QyxDQUF3QztpQkFDdkUsOEJBQXlCLEdBQUcsbUJBQW1CLEFBQXRCLENBQXVCO1FBRWhFLFlBQ2tDLGFBQTZCLEVBQy9CLFdBQXlCLEVBQ3RCLGNBQStCO1lBRmhDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMvQixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN0QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7UUFDOUQsQ0FBQztRQUVMLEtBQUssQ0FBQyxTQUFTLENBQUMsZ0JBQW1DLEVBQUUsV0FBVyxHQUFHLEtBQUs7WUFDdkUsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO1lBQ25DLElBQUksTUFBTSxLQUFLLG1CQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxtQkFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLFNBQVMsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUN2RyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osWUFBWSxDQUFDLE9BQU8sQ0FBQyxrQkFBZ0IsQ0FBQyx5QkFBeUIsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDekUsSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDbEMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxr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