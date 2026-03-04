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
define(["require", "exports", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/contrib/extensions/common/extensions", "vs/nls", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/glob", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/async", "vs/platform/workspace/common/workspace", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/types", "vs/editor/common/languages/modesRegistry"], function (require, exports, extensionRecommendations_1, extensionRecommendations_2, extensions_1, nls_1, storage_1, productService_1, network_1, resources_1, glob_1, model_1, language_1, extensionRecommendations_3, arrays_1, lifecycle_1, notebookCommon_1, async_1, workspace_1, extensionManagementUtil_1, types_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileBasedRecommendations = void 0;
    const promptedRecommendationsStorageKey = 'fileBasedRecommendations/promptedRecommendations';
    const recommendationsStorageKey = 'extensionsAssistant/recommendations';
    const milliSecondsInADay = 1000 * 60 * 60 * 24;
    let FileBasedRecommendations = class FileBasedRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        get recommendations() {
            const recommendations = [];
            [...this.fileBasedRecommendations.keys()]
                .sort((a, b) => {
                if (this.fileBasedRecommendations.get(a).recommendedTime === this.fileBasedRecommendations.get(b).recommendedTime) {
                    if (this.fileBasedImportantRecommendations.has(a)) {
                        return -1;
                    }
                    if (this.fileBasedImportantRecommendations.has(b)) {
                        return 1;
                    }
                }
                return this.fileBasedRecommendations.get(a).recommendedTime > this.fileBasedRecommendations.get(b).recommendedTime ? -1 : 1;
            })
                .forEach(extensionId => {
                recommendations.push({
                    extension: extensionId,
                    reason: {
                        reasonId: 1 /* ExtensionRecommendationReason.File */,
                        reasonText: (0, nls_1.localize)('fileBasedRecommendation', "This extension is recommended based on the files you recently opened.")
                    }
                });
            });
            return recommendations;
        }
        get importantRecommendations() {
            return this.recommendations.filter(e => this.fileBasedImportantRecommendations.has(e.extension));
        }
        get otherRecommendations() {
            return this.recommendations.filter(e => !this.fileBasedImportantRecommendations.has(e.extension));
        }
        constructor(extensionsWorkbenchService, modelService, languageService, productService, storageService, extensionRecommendationNotificationService, extensionIgnoredRecommendationsService, workspaceContextService) {
            super();
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.storageService = storageService;
            this.extensionRecommendationNotificationService = extensionRecommendationNotificationService;
            this.extensionIgnoredRecommendationsService = extensionIgnoredRecommendationsService;
            this.workspaceContextService = workspaceContextService;
            this.recommendationsByPattern = new Map();
            this.fileBasedRecommendations = new Map();
            this.fileBasedImportantRecommendations = new Set();
            this.fileOpenRecommendations = {};
            if (productService.extensionRecommendations) {
                for (const [extensionId, recommendation] of Object.entries(productService.extensionRecommendations)) {
                    if (recommendation.onFileOpen) {
                        this.fileOpenRecommendations[extensionId.toLowerCase()] = recommendation.onFileOpen;
                    }
                }
            }
        }
        async doActivate() {
            if ((0, types_1.isEmptyObject)(this.fileOpenRecommendations)) {
                return;
            }
            await this.extensionsWorkbenchService.whenInitialized;
            const cachedRecommendations = this.getCachedRecommendations();
            const now = Date.now();
            // Retire existing recommendations if they are older than a week or are not part of this.productService.extensionTips anymore
            Object.entries(cachedRecommendations).forEach(([key, value]) => {
                const diff = (now - value) / milliSecondsInADay;
                if (diff <= 7 && this.fileOpenRecommendations[key]) {
                    this.fileBasedRecommendations.set(key.toLowerCase(), { recommendedTime: value });
                }
            });
            this._register(this.modelService.onModelAdded(model => this.onModelAdded(model)));
            this.modelService.getModels().forEach(model => this.onModelAdded(model));
        }
        onModelAdded(model) {
            const uri = model.uri.scheme === network_1.Schemas.vscodeNotebookCell ? notebookCommon_1.CellUri.parse(model.uri)?.notebook : model.uri;
            if (!uri) {
                return;
            }
            const supportedSchemes = (0, arrays_1.distinct)([network_1.Schemas.untitled, network_1.Schemas.file, network_1.Schemas.vscodeRemote, ...this.workspaceContextService.getWorkspace().folders.map(folder => folder.uri.scheme)]);
            if (!uri || !supportedSchemes.includes(uri.scheme)) {
                return;
            }
            // re-schedule this bit of the operation to be off the critical path - in case glob-match is slow
            (0, async_1.disposableTimeout)(() => this.promptImportantRecommendations(uri, model), 0, this._store);
        }
        /**
         * Prompt the user to either install the recommended extension for the file type in the current editor model
         * or prompt to search the marketplace if it has extensions that can support the file type
         */
        promptImportantRecommendations(uri, model, extensionRecommendations) {
            if (model.isDisposed()) {
                return;
            }
            const pattern = (0, resources_1.extname)(uri).toLowerCase();
            extensionRecommendations = extensionRecommendations ?? this.recommendationsByPattern.get(pattern) ?? this.fileOpenRecommendations;
            const extensionRecommendationEntries = Object.entries(extensionRecommendations);
            if (extensionRecommendationEntries.length === 0) {
                return;
            }
            const processedPathGlobs = new Map();
            const installed = this.extensionsWorkbenchService.local;
            const recommendationsByPattern = {};
            const matchedRecommendations = {};
            const unmatchedRecommendations = {};
            let listenOnLanguageChange = false;
            const languageId = model.getLanguageId();
            for (const [extensionId, conditions] of extensionRecommendationEntries) {
                const conditionsByPattern = [];
                const matchedConditions = [];
                const unmatchedConditions = [];
                for (const condition of conditions) {
                    let languageMatched = false;
                    let pathGlobMatched = false;
                    const isLanguageCondition = !!condition.languages;
                    const isFileContentCondition = !!condition.contentPattern;
                    if (isLanguageCondition || isFileContentCondition) {
                        conditionsByPattern.push(condition);
                    }
                    if (isLanguageCondition) {
                        if (condition.languages.includes(languageId)) {
                            languageMatched = true;
                        }
                    }
                    if (condition.pathGlob) {
                        const pathGlob = condition.pathGlob;
                        if (processedPathGlobs.get(pathGlob) ?? (0, glob_1.match)(condition.pathGlob, uri.with({ fragment: '' }).toString())) {
                            pathGlobMatched = true;
                        }
                        processedPathGlobs.set(pathGlob, pathGlobMatched);
                    }
                    let matched = languageMatched || pathGlobMatched;
                    // If the resource has pattern (extension) and not matched, then we don't need to check the other conditions
                    if (pattern && !matched) {
                        continue;
                    }
                    if (matched && condition.whenInstalled) {
                        if (!condition.whenInstalled.every(id => installed.some(local => (0, extensionManagementUtil_1.areSameExtensions)({ id }, local.identifier)))) {
                            matched = false;
                        }
                    }
                    if (matched && condition.whenNotInstalled) {
                        if (installed.some(local => condition.whenNotInstalled?.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, local.identifier)))) {
                            matched = false;
                        }
                    }
                    if (matched && isFileContentCondition) {
                        if (!model.findMatches(condition.contentPattern, false, true, false, null, false).length) {
                            matched = false;
                        }
                    }
                    if (matched) {
                        matchedConditions.push(condition);
                        conditionsByPattern.pop();
                    }
                    else {
                        if (isLanguageCondition || isFileContentCondition) {
                            unmatchedConditions.push(condition);
                            if (isLanguageCondition) {
                                listenOnLanguageChange = true;
                            }
                        }
                    }
                }
                if (matchedConditions.length) {
                    matchedRecommendations[extensionId] = matchedConditions;
                }
                if (unmatchedConditions.length) {
                    unmatchedRecommendations[extensionId] = unmatchedConditions;
                }
                if (conditionsByPattern.length) {
                    recommendationsByPattern[extensionId] = conditionsByPattern;
                }
            }
            if (pattern) {
                this.recommendationsByPattern.set(pattern, recommendationsByPattern);
            }
            if (Object.keys(unmatchedRecommendations).length) {
                if (listenOnLanguageChange) {
                    const disposables = new lifecycle_1.DisposableStore();
                    disposables.add(model.onDidChangeLanguage(() => {
                        // re-schedule this bit of the operation to be off the critical path - in case glob-match is slow
                        (0, async_1.disposableTimeout)(() => {
                            if (!disposables.isDisposed) {
                                this.promptImportantRecommendations(uri, model, unmatchedRecommendations);
                                disposables.dispose();
                            }
                        }, 0, disposables);
                    }));
                    disposables.add(model.onWillDispose(() => disposables.dispose()));
                }
            }
            if (Object.keys(matchedRecommendations).length) {
                this.promptFromRecommendations(uri, model, matchedRecommendations);
            }
        }
        promptFromRecommendations(uri, model, extensionRecommendations) {
            let isImportantRecommendationForLanguage = false;
            const importantRecommendations = new Set();
            const fileBasedRecommendations = new Set();
            for (const [extensionId, conditions] of Object.entries(extensionRecommendations)) {
                for (const condition of conditions) {
                    fileBasedRecommendations.add(extensionId);
                    if (condition.important) {
                        importantRecommendations.add(extensionId);
                        this.fileBasedImportantRecommendations.add(extensionId);
                    }
                    if (condition.languages) {
                        isImportantRecommendationForLanguage = true;
                    }
                }
            }
            // Update file based recommendations
            for (const recommendation of fileBasedRecommendations) {
                const filedBasedRecommendation = this.fileBasedRecommendations.get(recommendation) || { recommendedTime: Date.now(), sources: [] };
                filedBasedRecommendation.recommendedTime = Date.now();
                this.fileBasedRecommendations.set(recommendation, filedBasedRecommendation);
            }
            this.storeCachedRecommendations();
            if (this.extensionRecommendationNotificationService.hasToIgnoreRecommendationNotifications()) {
                return;
            }
            const language = model.getLanguageId();
            const languageName = this.languageService.getLanguageName(language);
            if (importantRecommendations.size &&
                this.promptRecommendedExtensionForFileType(languageName && isImportantRecommendationForLanguage && language !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID ? (0, nls_1.localize)('languageName', "the {0} language", languageName) : (0, resources_1.basename)(uri), language, [...importantRecommendations])) {
                return;
            }
        }
        promptRecommendedExtensionForFileType(name, language, recommendations) {
            recommendations = this.filterIgnoredOrNotAllowed(recommendations);
            if (recommendations.length === 0) {
                return false;
            }
            recommendations = this.filterInstalled(recommendations, this.extensionsWorkbenchService.local)
                .filter(extensionId => this.fileBasedImportantRecommendations.has(extensionId));
            const promptedRecommendations = language !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID ? this.getPromptedRecommendations()[language] : undefined;
            if (promptedRecommendations) {
                recommendations = recommendations.filter(extensionId => promptedRecommendations.includes(extensionId));
            }
            if (recommendations.length === 0) {
                return false;
            }
            this.promptImportantExtensionsInstallNotification(recommendations, name, language);
            return true;
        }
        async promptImportantExtensionsInstallNotification(extensions, name, language) {
            try {
                const result = await this.extensionRecommendationNotificationService.promptImportantExtensionsInstallNotification({ extensions, name, source: 1 /* RecommendationSource.FILE */ });
                if (result === "reacted" /* RecommendationsNotificationResult.Accepted */) {
                    this.addToPromptedRecommendations(language, extensions);
                }
            }
            catch (error) { /* Ignore */ }
        }
        getPromptedRecommendations() {
            return JSON.parse(this.storageService.get(promptedRecommendationsStorageKey, 0 /* StorageScope.PROFILE */, '{}'));
        }
        addToPromptedRecommendations(language, extensions) {
            const promptedRecommendations = this.getPromptedRecommendations();
            promptedRecommendations[language] = (0, arrays_1.distinct)([...(promptedRecommendations[language] ?? []), ...extensions]);
            this.storageService.store(promptedRecommendationsStorageKey, JSON.stringify(promptedRecommendations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        filterIgnoredOrNotAllowed(recommendationsToSuggest) {
            const ignoredRecommendations = [...this.extensionIgnoredRecommendationsService.ignoredRecommendations, ...this.extensionRecommendationNotificationService.ignoredRecommendations];
            return recommendationsToSuggest.filter(id => !ignoredRecommendations.includes(id));
        }
        filterInstalled(recommendationsToSuggest, installed) {
            const installedExtensionsIds = installed.reduce((result, i) => {
                if (i.enablementState !== 1 /* EnablementState.DisabledByExtensionKind */) {
                    result.add(i.identifier.id.toLowerCase());
                }
                return result;
            }, new Set());
            return recommendationsToSuggest.filter(id => !installedExtensionsIds.has(id.toLowerCase()));
        }
        getCachedRecommendations() {
            let storedRecommendations = JSON.parse(this.storageService.get(recommendationsStorageKey, 0 /* StorageScope.PROFILE */, '[]'));
            if (Array.isArray(storedRecommendations)) {
                storedRecommendations = storedRecommendations.reduce((result, id) => { result[id] = Date.now(); return result; }, {});
            }
            const result = {};
            Object.entries(storedRecommendations).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    result[key.toLowerCase()] = value;
                }
            });
            return result;
        }
        storeCachedRecommendations() {
            const storedRecommendations = {};
            this.fileBasedRecommendations.forEach((value, key) => storedRecommendations[key] = value.recommendedTime);
            this.storageService.store(recommendationsStorageKey, JSON.stringify(storedRecommendations), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
    };
    exports.FileBasedRecommendations = FileBasedRecommendations;
    exports.FileBasedRecommendations = FileBasedRecommendations = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService),
        __param(3, productService_1.IProductService),
        __param(4, storage_1.IStorageService),
        __param(5, extensionRecommendations_3.IExtensionRecommendationNotificationService),
        __param(6, extensionRecommendations_2.IExtensionIgnoredRecommendationsService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], FileBasedRecommendations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUJhc2VkUmVjb21tZW5kYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9icm93c2VyL2ZpbGVCYXNlZFJlY29tbWVuZGF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE0QmhHLE1BQU0saUNBQWlDLEdBQUcsa0RBQWtELENBQUM7SUFDN0YsTUFBTSx5QkFBeUIsR0FBRyxxQ0FBcUMsQ0FBQztJQUN4RSxNQUFNLGtCQUFrQixHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUV4QyxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLG1EQUF3QjtRQU9yRSxJQUFJLGVBQWU7WUFDbEIsTUFBTSxlQUFlLEdBQXFDLEVBQUUsQ0FBQztZQUM3RCxDQUFDLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksRUFBRSxDQUFDO2lCQUN2QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2QsSUFBSSxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBRSxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBRSxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUNySCxJQUFJLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDbkQsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDWCxDQUFDO29CQUNELElBQUksSUFBSSxDQUFDLGlDQUFpQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUNuRCxPQUFPLENBQUMs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