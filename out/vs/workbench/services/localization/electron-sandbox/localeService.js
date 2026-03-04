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
define(["require", "exports", "vs/base/common/platform", "vs/platform/environment/common/environment", "vs/platform/notification/common/notification", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/services/localization/common/locale", "vs/platform/languagePacks/common/languagePacks", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/progress/common/progress", "vs/nls", "vs/base/common/actions", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/stripComments", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host", "vs/platform/dialogs/common/dialogs", "vs/platform/product/common/productService", "vs/platform/instantiation/common/extensions"], function (require, exports, platform_1, environment_1, notification_1, jsonEditing_1, locale_1, languagePacks_1, panecomposite_1, extensionManagement_1, progress_1, nls_1, actions_1, textfiles_1, stripComments_1, editorService_1, host_1, dialogs_1, productService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // duplicate of VIEWLET_ID in contrib/extensions
    const EXTENSIONS_VIEWLET_ID = 'workbench.view.extensions';
    let NativeLocaleService = class NativeLocaleService {
        constructor(jsonEditingService, environmentService, notificationService, languagePackService, paneCompositePartService, extensionManagementService, progressService, textFileService, editorService, dialogService, hostService, productService) {
            this.jsonEditingService = jsonEditingService;
            this.environmentService = environmentService;
            this.notificationService = notificationService;
            this.languagePackService = languagePackService;
            this.paneCompositePartService = paneCompositePartService;
            this.extensionManagementService = extensionManagementService;
            this.progressService = progressService;
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.dialogService = dialogService;
            this.hostService = hostService;
            this.productService = productService;
        }
        async validateLocaleFile() {
            try {
                const content = await this.textFileService.read(this.environmentService.argvResource, { encoding: 'utf8' });
                // This is the same logic that we do where argv.json is parsed so mirror that:
                // https://github.com/microsoft/vscode/blob/32d40cf44e893e87ac33ac4f08de1e5f7fe077fc/src/main.js#L238-L246
                JSON.parse((0, stripComments_1.stripComments)(content.value));
            }
            catch (error) {
                this.notificationService.notify({
                    severity: notification_1.Severity.Error,
                    message: (0, nls_1.localize)('argvInvalid', 'Unable to write display language. Please open the runtime settings, correct errors/warnings in it and try again.'),
                    actions: {
                        primary: [
                            (0, actions_1.toAction)({
                                id: 'openArgv',
                                label: (0, nls_1.localize)('openArgv', "Open Runtime Settings"),
                                run: () => this.editorService.openEditor({ resource: this.environmentService.argvResource })
                            })
                        ]
                    }
                });
                return false;
            }
            return true;
        }
        async writeLocaleValue(locale) {
            if (!(await this.validateLocaleFile())) {
                return false;
            }
            await this.jsonEditingService.write(this.environmentService.argvResource, [{ path: ['locale'], value: locale }], true);
            return true;
        }
        async setLocale(languagePackItem, skipDialog = false) {
            const locale = languagePackItem.id;
            if (locale === platform_1.Language.value() || (!locale && platform_1.Language.isDefaultVariant())) {
                return;
            }
            const installedLanguages = await this.languagePackService.getInstalledLanguages();
            try {
                // Only Desktop has the concept of installing language packs so we only do this for Desktop
                // and only if the language pack is not installed
                if (!installedLanguages.some(installedLanguage => installedLanguage.id === languagePackItem.id)) {
                    // Only actually install a language pack from Microsoft
                    if (languagePackItem.galleryExtension?.publisher.toLowerCase() !== 'ms-ceintl') {
                        // Show the view so the user can see the language pack that they should install
                        // as of now, there are no 3rd party language packs available on the Marketplace.
                        const viewlet = await this.paneCompositePartService.openPaneComposite(EXTENSIONS_VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */);
                        (viewlet?.getViewPaneContainer()).search(`@id:${languagePackItem.extensionId}`);
                        return;
                    }
                    await this.progressService.withProgress({
                        location: 15 /* ProgressLocation.Notification */,
                        title: (0, nls_1.localize)('installing', "Installing {0} language support...", languagePackItem.label),
                    }, progress => this.extensionManagementService.installFromGallery(languagePackItem.galleryExtension, {
                        // Setting this to false is how you get the extension to be synced with Settings Sync (if enabled).
                        isMachineScoped: false,
                    }));
                }
                if (!skipDialog && !await this.showRestartDialog(languagePackItem.label)) {
                    return;
                }
                await this.writeLocaleValue(locale);
                await this.hostService.restart();
            }
            catch (err) {
                this.notificationService.error(err);
            }
        }
        async clearLocalePreference() {
            try {
                await this.writeLocaleValue(undefined);
                if (!platform_1.Language.isDefaultVariant()) {
                    await this.showRestartDialog('English');
                }
            }
            catch (err) {
                this.notificationService.error(err);
            }
        }
        async showRestartDialog(languageName) {
            const { confirmed } = await this.dialogService.confirm({
                message: (0, nls_1.localize)('restartDisplayLanguageMessage1', "Restart {0} to switch to {1}?", this.productService.nameLong, languageName),
                detail: (0, nls_1.localize)('restartDisplayLanguageDetail1', "To change the display language to {0}, {1} needs to restart.", languageName, this.productService.nameLong),
                primaryButton: (0, nls_1.localize)({ key: 'restart', comment: ['&& denotes a mnemonic character'] }, "&&Restart"),
            });
            return confirmed;
        }
    };
    NativeLocaleService = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, notification_1.INotificationService),
        __param(3, languagePacks_1.ILanguagePackService),
        __param(4, panecomposite_1.IPaneCompositePartService),
        __param(5, extensionManagement_1.IExtensionManagementService),
        __param(6, progress_1.IProgressService),
        __param(7, textfiles_1.ITextFileService),
        __param(8, editorService_1.IEditorService),
        __param(9, dialogs_1.IDialogService),
        __param(10, host_1.IHostService),
        __param(11, productService_1.IProductService)
    ], NativeLocaleService);
    // This is its own service because the localeService depends on IJSONEditingService which causes a circular dependency
    // Once that's ironed out, we can fold this into the localeService.
    let NativeActiveLanguagePackService = class NativeActiveLanguagePackService {
        constructor(languagePackService) {
            this.languagePackService = languagePackService;
        }
        async getExtensionIdProvidingCurrentLocale() {
            const language = platform_1.Language.value();
            if (language === platform_1.LANGUAGE_DEFAULT) {
                return undefined;
            }
            const languages = await this.languagePackService.getInstalledLanguages();
            const languagePack = languages.find(l => l.id === language);
            return languagePack?.extensionId;
        }
    };
    NativeActiveLanguagePackService = __decorate([
        __param(0, languagePacks_1.ILanguagePackService)
    ], NativeActiveLanguagePackService);
    (0, extensions_1.registerSingleton)(locale_1.ILocaleService, NativeLocaleService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(locale_1.IActiveLanguagePackService, NativeActiveLanguagePackService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9sb2NhbGl6YXRpb24vZWxlY3Ryb24tc2FuZGJveC9sb2NhbGVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBNkJoRyxnREFBZ0Q7SUFDaEQsTUFBTSxxQkFBcUIsR0FBRywyQkFBMkIsQ0FBQztJQUUxRCxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFtQjtRQUd4QixZQUN1QyxrQkFBdUMsRUFDdkMsa0JBQXVDLEVBQ3RDLG1CQUF5QyxFQUN6QyxtQkFBeUMsRUFDcEMsd0JBQW1ELEVBQ2pELDBCQUF1RCxFQUNsRSxlQUFpQyxFQUNqQyxlQUFpQyxFQUNuQyxhQUE2QixFQUM3QixhQUE2QixFQUMvQixXQUF5QixFQUN0QixjQUErQjtZQVgzQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3ZDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUN6Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ3BDLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMkI7WUFDakQsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUNsRSxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDakMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ25DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUM3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDL0IsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDdEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1FBQzlELENBQUM7UUFFRyxLQUFLLENBQUMsa0JBQWtCO1lBQy9CLElBQUksQ0FBQztnQkFD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