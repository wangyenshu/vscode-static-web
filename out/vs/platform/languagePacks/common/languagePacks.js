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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/instantiation/common/instantiation"], function (require, exports, cancellation_1, lifecycle_1, platform_1, nls_1, extensionManagement_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguagePackBaseService = exports.ILanguagePackService = void 0;
    exports.getLocale = getLocale;
    function getLocale(extension) {
        return extension.tags.find(t => t.startsWith('lp-'))?.split('lp-')[1];
    }
    exports.ILanguagePackService = (0, instantiation_1.createDecorator)('languagePackService');
    let LanguagePackBaseService = class LanguagePackBaseService extends lifecycle_1.Disposable {
        constructor(extensionGalleryService) {
            super();
            this.extensionGalleryService = extensionGalleryService;
        }
        async getAvailableLanguages() {
            const timeout = new cancellation_1.CancellationTokenSource();
            setTimeout(() => timeout.cancel(), 1000);
            let result;
            try {
                result = await this.extensionGalleryService.query({
                    text: 'category:"language packs"',
                    pageSize: 20
                }, timeout.token);
            }
            catch (_) {
                // This method is best effort. So, we ignore any errors.
                return [];
            }
            const languagePackExtensions = result.firstPage.filter(e => e.properties.localizedLanguages?.length && e.tags.some(t => t.startsWith('lp-')));
            const allFromMarketplace = languagePackExtensions.map(lp => {
                const languageName = lp.properties.localizedLanguages?.[0];
                const locale = getLocale(lp);
                const baseQuickPick = this.createQuickPickItem(locale, languageName, lp);
                return {
                    ...baseQuickPick,
                    extensionId: lp.identifier.id,
                    galleryExtension: lp
                };
            });
            allFromMarketplace.push(this.createQuickPickItem('en', 'English'));
            return allFromMarketplace;
        }
        createQuickPickItem(locale, languageName, languagePack) {
            const label = languageName ?? locale;
            let description;
            if (label !== locale) {
                description = `(${locale})`;
            }
            if (locale.toLowerCase() === platform_1.language.toLowerCase()) {
                description ??= '';
                description += (0, nls_1.localize)('currentDisplayLanguage', " (Current)");
            }
            if (languagePack?.installCount) {
                description ??= '';
                const count = languagePack.installCount;
                let countLabel;
                if (count > 1000000) {
                    countLabel = `${Math.floor(count / 100000) / 10}M`;
                }
                else if (count > 1000) {
                    countLabel = `${Math.floor(count / 1000)}K`;
                }
                else {
                    countLabel = String(count);
                }
                description += ` $(cloud-download) ${countLabel}`;
            }
            return {
                id: locale,
                label,
                description
            };
        }
    };
    exports.LanguagePackBaseService = LanguagePackBaseService;
    exports.LanguagePackBaseService = LanguagePackBaseService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService)
    ], LanguagePackBaseService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VQYWNrcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2xhbmd1YWdlUGFja3MvY29tbW9uL2xhbmd1YWdlUGFja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV2hHLDhCQUVDO0lBRkQsU0FBZ0IsU0FBUyxDQUFDLFNBQTRCO1FBQ3JELE9BQU8sU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFWSxRQUFBLG9CQUFvQixHQUFHLElBQUEsK0JBQWUsRUFBdUIscUJBQXFCLENBQUMsQ0FBQztJQWMxRixJQUFlLHVCQUF1QixHQUF0QyxNQUFlLHVCQUF3QixTQUFRLHNCQUFVO1FBRy9ELFlBQXlELHVCQUFpRDtZQUN6RyxLQUFLLEVBQUUsQ0FBQztZQURnRCw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1FBRTFHLENBQUM7UUFNRCxLQUFLLENBQUMscUJBQXFCO1lBQzFCLE1BQU0sT0FBTyxHQUFHLElBQUksc0NBQXVCLEVBQUUsQ0FBQztZQUM5QyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXpDLElBQUksTUFBTSxDQUFDO1lBQ1gsSUFBSSxDQUFDO2dCQUNKLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUM7b0JBQ2pELElBQUksRUFBRSwyQkFBMkI7b0JBQ2pDLFFBQVEsRUFBRSxFQUFFO2lCQUNaLEVBQUUsT0FBTyxDQUFDLEtB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