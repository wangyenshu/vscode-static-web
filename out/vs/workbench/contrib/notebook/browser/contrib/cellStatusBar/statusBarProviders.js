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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/map", "vs/editor/common/languages/language", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService"], function (require, exports, lifecycle_1, map_1, language_1, nls_1, configuration_1, instantiation_1, keybinding_1, platform_1, contributions_1, notebookBrowser_1, notebookCellStatusBarService_1, notebookCommon_1, notebookKernelService_1, notebookService_1, languageDetectionWorkerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CellStatusBarLanguagePickerProvider = class CellStatusBarLanguagePickerProvider {
        constructor(_notebookService, _languageService) {
            this._notebookService = _notebookService;
            this._languageService = _languageService;
            this.viewType = '*';
        }
        async provideCellStatusBarItems(uri, index, _token) {
            const doc = this._notebookService.getNotebookTextModel(uri);
            const cell = doc?.cells[index];
            if (!cell) {
                return;
            }
            const statusBarItems = [];
            let displayLanguage = cell.language;
            if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                displayLanguage = 'markdown';
            }
            else {
                const registeredId = this._languageService.getLanguageIdByLanguageName(cell.language);
                if (registeredId) {
                    displayLanguage = this._languageService.getLanguageName(displayLanguage) ?? displayLanguage;
                }
                else {
                    // add unregistered lanugage warning item
                    const searchTooltip = (0, nls_1.localize)('notebook.cell.status.searchLanguageExtensions', "Unknown cell language. Click to search for '{0}' extensions", cell.language);
                    statusBarItems.push({
                        text: `$(dialog-warning)`,
                        command: { id: 'workbench.extensions.search', arguments: [`@tag:${cell.language}`], title: 'Search Extensions' },
                        tooltip: searchTooltip,
                        alignment: 2 /* CellStatusbarAlignment.Right */,
                        priority: -Number.MAX_SAFE_INTEGER + 1
                    });
                }
            }
            statusBarItems.push({
                text: displayLanguage,
                command: notebookBrowser_1.CHANGE_CELL_LANGUAGE,
                tooltip: (0, nls_1.localize)('notebook.cell.status.language', "Select Cell Language Mode"),
                alignment: 2 /* CellStatusbarAlignment.Right */,
                priority: -Number.MAX_SAFE_INTEGER
            });
            return {
                items: statusBarItems
            };
        }
    };
    CellStatusBarLanguagePickerProvider = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, language_1.ILanguageService)
    ], CellStatusBarLanguagePickerProvider);
    let CellStatusBarLanguageDetectionProvider = class CellStatusBarLanguageDetectionProvider {
        constructor(_notebookService, _notebookKernelService, _languageService, _configurationService, _languageDetectionService, _keybindingService) {
            this._notebookService = _notebookService;
            this._notebookKernelService = _notebookKernelService;
            this._languageService = _languageService;
            this._configurationService = _configurationService;
            this._languageDetectionService = _languageDetectionService;
            this._keybindingService = _keybindingService;
            this.viewType = '*';
            this.cache = new map_1.ResourceMap();
        }
        async provideCellStatusBarItems(uri, index, token) {
            const doc = this._notebookService.getNotebookTextModel(uri);
            const cell = doc?.cells[index];
            if (!cell) {
                return;
            }
            const enablementConfig = this._configurationService.getValue('workbench.editor.languageDetectionHints');
            const enabled = typeof enablementConfig === 'object' && enablementConfig?.notebookEditors;
            if (!enabled) {
                return;
            }
            const cellUri = cell.uri;
            const contentVersion = cell.textModel?.getVersionId();
            if (!contentVersion) {
                return;
            }
            const currentLanguageId = cell.cellKind === notebookCommon_1.CellKind.Markup ?
                'markdown' :
                (this._languageService.getLanguageIdByLanguageName(cell.language) || cell.language);
            if (!this.cache.has(cellUri)) {
                this.cache.set(cellUri, {
                    cellLanguage: currentLanguageId, // force a re-compute upon a change in configured language
                    updateTimestamp: 0, // facilitates a disposable-free debounce operation
                    contentVersion: 1, // dont run for the initial contents, only on update
                });
            }
            const cached = this.cache.get(cellUri);
            if (cached.cellLanguage !== currentLanguageId || (cached.updateTimestamp < Date.now() - 1000 && cached.contentVersion !== contentVersion)) {
                cached.updateTimestamp = Date.now();
                cached.cellLanguage = currentLanguageId;
                cached.contentVersion = contentVersion;
                const kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(doc);
                if (kernel) {
                    const supportedLangs = [...kernel.supportedLanguages, 'markdown'];
                    cached.guess = await this._languageDetectionService.detectLanguage(cell.uri, supportedLangs);
                }
            }
            const items = [];
            if (cached.guess && currentLanguageId !== cached.guess) {
                const detectedName = this._languageService.getLanguageName(cached.guess) || cached.guess;
                let tooltip = (0, nls_1.localize)('notebook.cell.status.autoDetectLanguage', "Accept Detected Language: {0}", detectedName);
                const keybinding = this._keybindingService.lookupKeybinding(notebookBrowser_1.DETECT_CELL_LANGUAGE);
                const label = keybinding?.getLabel();
                if (label) {
                    tooltip += ` (${label})`;
                }
                items.push({
                    text: '$(lightbulb-autofix)',
                    command: notebookBrowser_1.DETECT_CELL_LANGUAGE,
                    tooltip,
                    alignment: 2 /* CellStatusbarAlignment.Right */,
                    priority: -Number.MAX_SAFE_INTEGER + 1
                });
            }
            return { items };
        }
    };
    CellStatusBarLanguageDetectionProvider = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, notebookKernelService_1.INotebookKernelService),
        __param(2, language_1.ILanguageService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(5, keybinding_1.IKeybindingService)
    ], CellStatusBarLanguageDetectionProvider);
    let BuiltinCellStatusBarProviders = class BuiltinCellStatusBarProviders extends lifecycle_1.Disposable {
        constructor(instantiationService, notebookCellStatusBarService) {
            super();
            const builtinProviders = [
                CellStatusBarLanguagePickerProvider,
                CellStatusBarLanguageDetectionProvider,
            ];
            builtinProviders.forEach(p => {
                this._register(notebookCellStatusBarService.registerCellStatusBarItemProvider(instantiationService.createInstance(p)));
            });
        }
    };
    BuiltinCellStatusBarProviders = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notebookCellStatusBarService_1.INotebookCellStatusBarService)
    ], BuiltinCellStatusBarProviders);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(BuiltinCellStatusBarProviders, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzQmFyUHJvdmlkZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2NlbGxTdGF0dXNCYXIvc3RhdHVzQmFyUHJvdmlkZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBcUJoRyxJQUFNLG1DQUFtQyxHQUF6QyxNQUFNLG1DQUFtQztRQUl4QyxZQUNtQixnQkFBbUQsRUFDbkQsZ0JBQW1EO1lBRGxDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDbEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUo3RCxhQUFRLEdBQUcsR0FBRyxDQUFDO1FBS3BCLENBQUM7UUFFTCxLQUFLLENBQUMseUJBQXlCLENBQUMsR0FBUSxFQUFFLEtBQWEsRUFBRSxNQUF5QjtZQUNqRixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUQsTUFBTSxJQUFJLEdBQUcsR0FBRyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLGNBQWMsR0FBaUMsRUFBRSxDQUFDO1lBQ3hELElBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDcEMsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLHlCQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3ZDLGVBQWUsR0FBRyxVQUFVLENBQUM7WUFDOUIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQywyQkFBMkIsQ0FBQyxJ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