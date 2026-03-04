/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/languagePacks/common/languagePacks", "vs/workbench/services/localization/common/locale", "vs/workbench/contrib/extensions/common/extensions"], function (require, exports, nls_1, quickInput_1, cancellation_1, lifecycle_1, actions_1, languagePacks_1, locale_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClearDisplayLanguageAction = exports.ConfigureDisplayLanguageAction = void 0;
    class ConfigureDisplayLanguageAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.configureLocale'; }
        constructor() {
            super({
                id: ConfigureDisplayLanguageAction.ID,
                title: (0, nls_1.localize2)('configureLocale', "Configure Display Language"),
                menu: {
                    id: actions_1.MenuId.CommandPalette
                },
                metadata: {
                    description: (0, nls_1.localize2)('configureLocaleDescription', "Changes the locale of VS Code based on installed language packs. Common languages include French, Chinese, Spanish, Japanese, German, Korean, and more.")
                }
            });
        }
        async run(accessor) {
            const languagePackService = accessor.get(languagePacks_1.ILanguagePackService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const localeService = accessor.get(locale_1.ILocaleService);
            const extensionWorkbenchService = accessor.get(extensions_1.IExtensionsWorkbenchService);
            const installedLanguages = await languagePackService.getInstalledLanguages();
            const qp = quickInputService.createQuickPick();
            qp.matchOnDescription = true;
            qp.placeholder = (0, nls_1.localize)('chooseLocale', "Select Display Language");
            if (installedLanguages?.length) {
                const items = [{ type: 'separator', label: (0, nls_1.localize)('installed', "Installed") }];
                qp.items = items.concat(this.withMoreInfoButton(installedLanguages));
            }
            const disposables = new lifecycle_1.DisposableStore();
            const source = new cancellation_1.CancellationTokenSource();
            disposables.add(qp.onDispose(() => {
                source.cancel();
                disposables.dispose();
            }));
            const installedSet = new Set(installedLanguages?.map(language => language.id) ?? []);
            languagePackService.getAvailableLanguages().then(availableLanguages => {
                const newLanguages = availableLanguages.filter(l => l.id && !installedSet.has(l.id));
                if (newLanguages.length) {
                    qp.items = [
                        ...qp.items,
                        { type: 'separator', label: (0, nls_1.localize)('available', "Available") },
                        ...this.withMoreInfoButton(newLanguages)
                    ];
                }
                qp.busy = false;
            });
            disposables.add(qp.onDidAccept(async () => {
                const selectedLanguage = qp.activeItems[0];
                if (selectedLanguage) {
                    qp.hide();
                    await localeService.setLocale(selectedLanguage);
                }
            }));
            disposables.add(qp.onDidTriggerItemButton(async (e) => {
                qp.hide();
                if (e.item.extensionId) {
                    await extensionWorkbenchService.open(e.item.extensionId);
                }
            }));
            qp.show();
            qp.busy = true;
        }
        withMoreInfoButton(items) {
            for (const item of items) {
                if (item.extensionId) {
                    item.buttons = [{
                            tooltip: (0, nls_1.localize)('moreInfo', "More Info"),
                            iconClass: 'codicon-info'
                        }];
                }
            }
            return items;
        }
    }
    exports.ConfigureDisplayLanguageAction = ConfigureDisplayLanguageAction;
    class ClearDisplayLanguageAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.clearLocalePreference'; }
        static { this.LABEL = (0, nls_1.localize2)('clearDisplayLanguage', "Clear Display Language Preference"); }
        constructor() {
            super({
                id: ClearDisplayLanguageAction.ID,
                title: ClearDisplayLanguageAction.LABEL,
                menu: {
                    id: actions_1.MenuId.CommandPalette
                }
            });
        }
        async run(accessor) {
            const localeService = accessor.get(locale_1.ILocaleService);
            await localeService.clearLocalePreference();
        }
    }
    exports.ClearDisplayLanguageAction = ClearDisplayLanguageAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxpemF0aW9uc0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9sb2NhbGl6YXRpb24vY29tbW9uL2xvY2FsaXphdGlvbnNBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFhLDhCQUErQixTQUFRLGlCQUFPO2lCQUNuQyxPQUFFLEdBQUcsa0NBQWtDLENBQUM7UUFFL0Q7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDhCQUE4QixDQUFDLEVBQUU7Z0JBQ3JDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxpQkFBaUIsRUFBRSw0QkFBNEIsQ0FBQztnQkFDakUsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGNBQWM7aUJBQ3pCO2dCQUNELFFBQVEsRUFBRTtvQkFDVCxXQUFXLEVBQUUsSUFBQSxlQUFTLEVBQUMsNEJBQTRCLEVBQUUseUpBQXlKLENBQUM7aUJBQy9NO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDMUMsTUFBTSxtQkFBbUIsR0FBeUIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0IsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0saUJBQWlCLEdBQXVCLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztZQUMvRSxNQUFNLGFBQWEsR0FBbUIsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBYyxDQUFDLENBQUM7WUFDbkUsTUFBTSx5QkFBeUIsR0FBZ0MsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3Q0FBMkIsQ0FBQyxDQUFDO1lBRXpHLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxtQkFBbUIsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lB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