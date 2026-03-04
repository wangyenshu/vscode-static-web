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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/base/common/platform", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/notification/common/notification", "vs/base/common/severity", "vs/platform/storage/common/storage", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/localization/electron-sandbox/minimalTranslations", "vs/platform/telemetry/common/telemetry", "vs/base/common/cancellation", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/localization/common/locale", "vs/platform/product/common/productService", "vs/workbench/contrib/localization/common/localization.contribution"], function (require, exports, nls_1, platform_1, contributions_1, platform, extensionManagement_1, notification_1, severity_1, storage_1, extensions_1, minimalTranslations_1, telemetry_1, cancellation_1, panecomposite_1, locale_1, productService_1, localization_contribution_1) {
    "use strict";
    var NativeLocalizationWorkbenchContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeLocalizationWorkbenchContribution = class NativeLocalizationWorkbenchContribution extends localization_contribution_1.BaseLocalizationWorkbenchContribution {
        static { NativeLocalizationWorkbenchContribution_1 = this; }
        static { this.LANGUAGEPACK_SUGGESTION_IGNORE_STORAGE_KEY = 'extensionsAssistant/languagePackSuggestionIgnore'; }
        constructor(notificationService, localeService, productService, storageService, extensionManagementService, galleryService, paneCompositeService, telemetryService) {
            super();
            this.notificationService = notificationService;
            this.localeService = localeService;
            this.productService = productService;
            this.storageService = storageService;
            this.extensionManagementService = extensionManagementService;
            this.galleryService = galleryService;
            this.paneCompositeService = paneCompositeService;
            this.telemetryService = telemetryService;
            this.checkAndInstall();
            this._register(this.extensionManagementService.onDidInstallExtensions(e => this.onDidInstallExtensions(e)));
            this._register(this.extensionManagementService.onDidUninstallExtension(e => this.onDidUninstallExtension(e)));
        }
        async onDidInstallExtensions(results) {
            for (const result of results) {
                if (result.operation === 2 /* InstallOperation.Install */ && result.local) {
                    await this.onDidInstallExtension(result.local, !!result.context?.extensionsSync);
                }
            }
        }
        async onDidInstallExtension(localExtension, fromSettingsSync) {
            const localization = localExtension.manifest.contributes?.localizations?.[0];
            if (!localization || platform.language === localization.languageId) {
                return;
            }
            const { languageId, languageName } = localization;
            this.notificationService.prompt(severity_1.default.Info, (0, nls_1.localize)('updateLocale', "Would you like to change {0}'s display language to {1} and restart?", this.productService.nameLong, languageName || languageId), [{
                    label: (0, nls_1.localize)('changeAndRestart', "Change Language and Restart"),
                    run: async () => {
                        await this.localeService.setLocale({
                            id: languageId,
                            label: languageName ?? languageId,
                            extensionId: localExtension.identifier.id,
                            // If settings sync installs the language pack, then we would have just shown the notification so no
                            // need to show the dialog.
                        }, true);
                    }
                }], {
                sticky: true,
                neverShowAgain: { id: 'langugage.update.donotask', isSecondary: true, scope: notification_1.NeverShowAgainScope.APPLICATION }
            });
        }
        async onDidUninstallExtension(_event) {
            if (!await this.isLocaleInstalled(platform.language)) {
                this.localeService.setLocale({
                    id: 'en',
                    label: 'English'
                });
            }
        }
        async checkAndInstall() {
            const language = platform.language;
            let locale = platform.locale ?? '';
            const languagePackSuggestionIgnoreList = JSON.parse(this.storageService.get(NativeLocalizationWorkbenchContribution_1.LANGUAGEPACK_SUGGESTION_IGNORE_STORAGE_KEY, -1 /* StorageScope.APPLICATION */, '[]'));
            if (!this.galleryService.isEnabled()) {
                return;
            }
            if (!language || !locale || locale === 'en' || locale.indexOf('en-') === 0) {
                return;
            }
            if (locale.startsWith(language) || languagePackSuggestionIgnoreList.includes(locale)) {
                return;
            }
            const installed = await this.isLocaleInstalled(locale);
            if (installed) {
                return;
            }
            const fullLocale = locale;
            let tagResult = await this.galleryService.query({ text: `tag:lp-${locale}` }, cancellation_1.CancellationToken.None);
            if (tagResult.total === 0) {
                // Trim the locale and try again.
                locale = locale.split('-')[0];
                tagResult = await this.galleryService.query({ text: `tag:lp-${locale}` }, cancellation_1.CancellationToken.None);
                if (tagResult.total === 0) {
                    return;
                }
            }
            const extensionToInstall = tagResult.total === 1 ? tagResult.firstPage[0] : tagResult.firstPage.find(e => e.publisher === 'MS-CEINTL' && e.name.startsWith('vscode-language-pack'));
            const extensionToFetchTranslationsFrom = extensionToInstall ?? tagResult.firstPage[0];
            if (!extensionToFetchTranslationsFrom.assets.manifest) {
                return;
            }
            const [manifest, translation] = await Promise.all([
                this.galleryService.getManifest(extensionToFetchTranslationsFrom, cancellation_1.CancellationToken.None),
                this.galleryService.getCoreTranslation(extensionToFetchTranslationsFrom, locale)
            ]);
            const loc = manifest?.contributes?.localizations?.find(x => locale.startsWith(x.languageId.toLowerCase()));
            const languageName = loc ? (loc.languageName || locale) : locale;
            const languageDisplayName = loc ? (loc.localizedLanguageName || loc.languageName || locale) : locale;
            const translationsFromPack = translation?.contents?.['vs/workbench/contrib/localization/electron-sandbox/minimalTranslations'] ?? {};
            const promptMessageKey = extensionToInstall ? 'installAndRestartMessage' : 'showLanguagePackExtensions';
            const useEnglish = !translationsFromPack[promptMessageKey];
            const translations = {};
            Object.keys(minimalTranslations_1.minimumTranslatedStrings).forEach(key => {
                if (!translationsFromPack[key] || useEnglish) {
                    translations[key] = minimalTranslations_1.minimumTranslatedStrings[key].replace('{0}', () => languageName);
                }
                else {
                    translations[key] = `${translationsFromPack[key].replace('{0}', () => languageDisplayName)} (${minimalTranslations_1.minimumTranslatedStrings[key].replace('{0}', () => languageName)})`;
                }
            });
            const logUserReaction = (userReaction) => {
                /* __GDPR__
                    "languagePackSuggestion:popup" : {
                        "owner": "TylerLeonhardt",
                        "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "language": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                this.telemetryService.publicLog('languagePackSuggestion:popup', { userReaction, language: locale });
            };
            const searchAction = {
                label: translations['searchMarketplace'],
                run: async () => {
                    logUserReaction('search');
                    const viewlet = await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
                    if (!viewlet) {
                        return;
                    }
                    const container = viewlet.getViewPaneContainer();
                    if (!container) {
                        return;
                    }
                    container.search(`tag:lp-${locale}`);
                    container.focus();
                }
            };
            const installAndRestartAction = {
                label: translations['installAndRestart'],
                run: async () => {
                    logUserReaction('installAndRestart');
                    await this.localeService.setLocale({
                        id: locale,
                        label: languageName,
                        extensionId: extensionToInstall?.identifier.id,
                        galleryExtension: extensionToInstall
                        // The user will be prompted if they want to install the language pack before this.
                    }, true);
                }
            };
            const promptMessage = translations[promptMessageKey];
            this.notificationService.prompt(severity_1.default.Info, promptMessage, [extensionToInstall ? installAndRestartAction : searchAction,
                {
                    label: (0, nls_1.localize)('neverAgain', "Don't Show Again"),
                    isSecondary: true,
                    run: () => {
                        languagePackSuggestionIgnoreList.push(fullLocale);
                        this.storageService.store(NativeLocalizationWorkbenchContribution_1.LANGUAGEPACK_SUGGESTION_IGNORE_STORAGE_KEY, JSON.stringify(languagePackSuggestionIgnoreList), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                        logUserReaction('neverShowAgain');
                    }
                }], {
                onCancel: () => {
                    logUserReaction('cancelled');
                }
            });
        }
        async isLocaleInstalled(locale) {
            const installed = await this.extensionManagementService.getInstalled();
            return installed.some(i => !!i.manifest.contributes?.localizations?.length
                && i.manifest.contributes.localizations.some(l => locale.startsWith(l.languageId.toLowerCase())));
        }
    };
    NativeLocalizationWorkbenchContribution = NativeLocalizationWorkbenchContribution_1 = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, locale_1.ILocaleService),
        __param(2, productService_1.IProductService),
        __param(3, storage_1.IStorageService),
        __param(4, extensionManagement_1.IExtensionManagementService),
        __param(5, extensionManagement_1.IExtensionGalleryService),
        __param(6, panecomposite_1.IPaneCompositePartService),
        __param(7, telemetry_1.ITelemetryService)
    ], NativeLocalizationWorkbenchContribution);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(NativeLocalizationWorkbenchContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxpemF0aW9uLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvY2FsaXphdGlvbi9lbGVjdHJvbi1zYW5kYm94L2xvY2FsaXphdGlvbi5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJoRyxJQUFNLHVDQUF1QyxHQUE3QyxNQUFNLHVDQUF3QyxTQUFRLGlFQUFxQzs7aUJBQzNFLCtDQUEwQyxHQUFHLGtEQUFrRCxBQUFyRCxDQUFzRDtRQUUvRyxZQUN3QyxtQkFBeUMsRUFDL0MsYUFBNkIsRUFDNUIsY0FBK0IsRUFDL0IsY0FBK0IsRUFDbkIsMEJBQXVELEVBQzFELGNBQXdDLEVBQ3ZDLG9CQUErQyxFQUN2RCxnQkFBbUM7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFUK0Isd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUMvQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDNUIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQy9CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNuQiwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQzFELG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUN2Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQTJCO1lBQ3ZELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFJdkUsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1RyxJQUFJLENBQUMs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