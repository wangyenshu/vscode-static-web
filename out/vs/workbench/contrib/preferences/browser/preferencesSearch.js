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
define(["require", "exports", "vs/workbench/services/preferences/common/preferences", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/filters", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/workbench/contrib/preferences/common/preferences", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/cancellation", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation", "vs/base/common/tfIdf", "vs/workbench/services/preferences/common/preferencesModels"], function (require, exports, preferences_1, arrays_1, strings, filters_1, instantiation_1, lifecycle_1, preferences_2, extensionManagement_1, extensionManagement_2, cancellation_1, configuration_1, extensions_1, aiRelatedInformation_1, tfIdf_1, preferencesModels_1) {
    "use strict";
    var LocalSearchProvider_1, AiRelatedInformationSearchProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingMatches = exports.LocalSearchProvider = exports.PreferencesSearchService = void 0;
    let PreferencesSearchService = class PreferencesSearchService extends lifecycle_1.Disposable {
        constructor(instantiationService, configurationService, extensionManagementService, extensionEnablementService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            // This request goes to the shared process but results won't change during a window's lifetime, so cache the results.
            this._installedExtensions = this.extensionManagementService.getInstalled(1 /* ExtensionType.User */).then(exts => {
                // Filter to enabled extensions that have settings
                return exts
                    .filter(ext => this.extensionEnablementService.isEnabled(ext))
                    .filter(ext => ext.manifest && ext.manifest.contributes && ext.manifest.contributes.configuration)
                    .filter(ext => !!ext.identifier.uuid);
            });
        }
        get remoteSearchAllowed() {
            const workbenchSettings = this.configurationService.getValue().workbench.settings;
            return workbenchSettings.enableNaturalLanguageSearch;
        }
        getRemoteSearchProvider(filter, newExtensionsOnly = false) {
            if (!this.remoteSearchAllowed) {
                return undefined;
            }
            this._remoteSearchProvider ??= this.instantiationService.createInstance(RemoteSearchProvider);
            this._remoteSearchProvider.setFilter(filter);
            return this._remoteSearchProvider;
        }
        getLocalSearchProvider(filter) {
            return this.instantiationService.createInstance(LocalSearchProvider, filter);
        }
    };
    exports.PreferencesSearchService = PreferencesSearchService;
    exports.PreferencesSearchService = PreferencesSearchService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], PreferencesSearchService);
    function cleanFilter(filter) {
        // Remove " and : which are likely to be copypasted as part of a setting name.
        // Leave other special characters which the user might want to search for.
        return filter
            .replace(/[":]/g, ' ')
            .replace(/  /g, ' ')
            .trim();
    }
    let LocalSearchProvider = class LocalSearchProvider {
        static { LocalSearchProvider_1 = this; }
        static { this.EXACT_MATCH_SCORE = 10000; }
        static { this.START_SCORE = 1000; }
        constructor(_filter, configurationService) {
            this._filter = _filter;
            this.configurationService = configurationService;
            this._filter = cleanFilter(this._filter);
        }
        searchModel(preferencesModel, token) {
            if (!this._filter) {
                return Promise.resolve(null);
            }
            let orderedScore = LocalSearchProvider_1.START_SCORE; // Sort is not stable
            const settingMatcher = (setting) => {
                const { matches, matchType } = new SettingMatches(this._filter, setting, true, true, (filter, setting) => preferencesModel.findValueMatches(filter, setting), this.configurationService);
                const score = this._filter === setting.key ?
                    LocalSearchProvider_1.EXACT_MATCH_SCORE :
                    orderedScore--;
                return matches.length ?
                    {
                        matches,
                        matchType,
                        score
                    } :
                    null;
            };
            const filterMatches = preferencesModel.filterSettings(this._filter, this.getGroupFilter(this._filter), settingMatcher);
            const exactMatch = filterMatches.find(m => m.score === LocalSearchProvider_1.EXACT_MATCH_SCORE);
            if (exactMatch) {
                return Promise.resolve({
                    filterMatches: [exactMatch],
                    exactMatch: true
                });
            }
            else {
                return Promise.resolve({
                    filterMatches
                });
            }
        }
        getGroupFilter(filter) {
            const regex = strings.createRegExp(filter, false, { global: true });
            return (group) => {
                return group.id !== 'defaultOverrides' && regex.test(group.title);
            };
        }
    };
    exports.LocalSearchProvider = LocalSearchProvider;
    exports.LocalSearchProvider = LocalSearchProvider = LocalSearchProvider_1 = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], LocalSearchProvider);
    let SettingMatches = class SettingMatches {
        constructor(searchString, setting, requireFullQueryMatch, searchDescription, valuesMatcher, configurationService) {
            this.searchDescription = searchDescription;
            this.configurationService = configurationService;
            this.matchType = preferences_1.SettingMatchType.None;
            this.matches = (0, arrays_1.distinct)(this._findMatchesInSetting(searchString, setting), (match) => `${match.startLineNumber}_${match.startColumn}_${match.endLineNumber}_${match.endColumn}_`);
        }
        _findMatchesInSetting(searchString, setting) {
            const result = this._doFindMatchesInSetting(searchString, setting);
            return result;
        }
        _keyToLabel(settingId) {
            const label = settingId
                .replace(/[-._]/g, ' ')
                .replace(/([a-z]+)([A-Z])/g, '$1 $2')
                .replace(/([A-Za-z]+)(\d+)/g, '$1 $2')
                .replace(/(\d+)([A-Za-z]+)/g, '$1 $2')
                .toLowerCase();
            return label;
        }
        _doFindMatchesInSetting(searchString, setting) {
            const descriptionMatchingWords = new Map();
            const keyMatchingWords = new Map();
            const valueMatchingWords = new Map();
            const words = new Set(searchString.split(' '));
            // Key search
            const settingKeyAsWords = this._keyToLabel(setting.key);
            for (const word of words) {
                // Check if the key contains the word.
                const keyMatches = (0, filters_1.matchesWords)(word, settingKeyAsWords, true);
                if (keyMatches?.length) {
                    keyMatchingWords.set(word, keyMatches.map(match => this.toKeyRange(setting, match)));
                }
            }
            // For now, only allow a match if all words match in the key.
            if (keyMatchingWords.size === words.size) {
                this.matchType |= preferences_1.SettingMatchType.KeyMatch;
            }
            else {
                keyMatchingWords.clear();
            }
            // Also check if the user tried searching by id.
            const keyIdMatches = (0, filters_1.matchesContiguousSubString)(searchString, setting.key);
            if (keyIdMatches?.length) {
                keyMatchingWords.set(setting.key, keyIdMatches.map(match => this.toKeyRange(setting, match)));
                this.matchType |= preferences_1.SettingMatchType.KeyMatch;
            }
            // Check if the match was for a language tag group setting such as [markdown].
            // In such a case, move that setting to be last.
            if (setting.overrides?.length && (this.matchType & preferences_1.SettingMatchType.KeyMatch)) {
                this.matchType = preferences_1.SettingMatchType.LanguageTagSettingMatch;
                const keyRanges = keyMatchingWords.size ?
                    Array.from(keyMatchingWords.values()).flat() : [];
                return [...keyRanges];
            }
            // Description search
            if (this.searchDescription) {
                for (const word of words) {
                    // Search the description lines.
                    for (let lineIndex = 0; lineIndex < setting.description.length; lineIndex++) {
                        const descriptionMatches = (0, filters_1.matchesContiguousSubString)(word, setting.description[lineIndex]);
                        if (descriptionMatches?.length) {
                            descriptionMatchingWords.set(word, descriptionMatches.map(match => this.toDescriptionRange(setting, match, lineIndex)));
                        }
                    }
                }
                if (descriptionMatchingWords.size === words.size) {
                    this.matchType |= preferences_1.SettingMatchType.DescriptionOrValueMatch;
                }
                else {
                    // Clear out the match for now. We want to require all words to match in the description.
                    descriptionMatchingWords.clear();
                }
            }
            // Value search
            // Check if the value contains all the words.
            if (setting.enum?.length) {
                // Search all string values of enums.
                for (const option of setting.enum) {
                    if (typeof option !== 'string') {
                        continue;
                    }
                    valueMatchingWords.clear();
                    for (const word of words) {
                        const valueMatches = (0, filters_1.matchesContiguousSubString)(word, option);
                        if (valueMatches?.length) {
                            valueMatchingWords.set(word, valueMatches.map(match => this.toValueRange(setting, match)));
                        }
                    }
                    if (valueMatchingWords.size === words.size) {
                        this.matchType |= preferences_1.SettingMatchType.DescriptionOrValueMatch;
                        break;
                    }
                    else {
                        // Clear out the match for now. We want to require all words to match in the value.
                        valueMatchingWords.clear();
                    }
                }
            }
            else {
                // Search single string value.
                const settingValue = this.configurationService.getValue(setting.key);
                if (typeof settingValue === 'string') {
                    for (const word of words) {
                        const valueMatches = (0, filters_1.matchesContiguousSubString)(word, settingValue);
                        if (valueMatches?.length) {
                            valueMatchingWords.set(word, valueMatches.map(match => this.toValueRange(setting, match)));
                        }
                    }
                    if (valueMatchingWords.size === words.size) {
                        this.matchType |= preferences_1.SettingMatchType.DescriptionOrValueMatch;
                    }
                    else {
                        // Clear out the match for now. We want to require all words to match in the value.
                        valueMatchingWords.clear();
                    }
                }
            }
            const descriptionRanges = descriptionMatchingWords.size ?
                Array.from(descriptionMatchingWords.values()).flat() : [];
            const keyRanges = keyMatchingWords.size ?
                Array.from(keyMatchingWords.values()).flat() : [];
            const valueRanges = valueMatchingWords.size ?
                Array.from(valueMatchingWords.values()).flat() : [];
            return [...descriptionRanges, ...keyRanges, ...valueRanges];
        }
        toKeyRange(setting, match) {
            return {
                startLineNumber: setting.keyRange.startLineNumber,
                startColumn: setting.keyRange.startColumn + match.start,
                endLineNumber: setting.keyRange.startLineNumber,
                endColumn: setting.keyRange.startColumn + match.end
            };
        }
        toDescriptionRange(setting, match, lineIndex) {
            const descriptionRange = setting.descriptionRanges[lineIndex];
            if (!descriptionRange) {
                // This case occurs with added settings such as the
                // manage extension setting.
                return preferencesModels_1.nullRange;
            }
            return {
                startLineNumber: descriptionRange.startLineNumber,
                startColumn: descriptionRange.startColumn + match.start,
                endLineNumber: descriptionRange.endLineNumber,
                endColumn: descriptionRange.startColumn + match.end
            };
        }
        toValueRange(setting, match) {
            return {
                startLineNumber: setting.valueRange.startLineNumber,
                startColumn: setting.valueRange.startColumn + match.start + 1,
                endLineNumber: setting.valueRange.startLineNumber,
                endColumn: setting.valueRange.startColumn + match.end + 1
            };
        }
    };
    exports.SettingMatches = SettingMatches;
    exports.SettingMatches = SettingMatches = __decorate([
        __param(5, configuration_1.IConfigurationService)
    ], SettingMatches);
    class AiRelatedInformationSearchKeysProvider {
        constructor(aiRelatedInformationService) {
            this.aiRelatedInformationService = aiRelatedInformationService;
            this.settingKeys = [];
            this.settingsRecord = {};
        }
        updateModel(preferencesModel) {
            if (preferencesModel === this.currentPreferencesModel) {
                return;
            }
            this.currentPreferencesModel = preferencesModel;
            this.refresh();
        }
        refresh() {
            this.settingKeys = [];
            this.settingsRecord = {};
            if (!this.currentPreferencesModel ||
                !this.aiRelatedInformationService.isEnabled()) {
                return;
            }
            for (const group of this.currentPreferencesModel.settingsGroups) {
                if (group.id === 'mostCommonlyUsed') {
                    continue;
                }
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        this.settingKeys.push(setting.key);
                        this.settingsRecord[setting.key] = setting;
                    }
                }
            }
        }
        getSettingKeys() {
            return this.settingKeys;
        }
        getSettingsRecord() {
            return this.settingsRecord;
        }
    }
    let AiRelatedInformationSearchProvider = class AiRelatedInformationSearchProvider {
        static { AiRelatedInformationSearchProvider_1 = this; }
        static { this.AI_RELATED_INFORMATION_THRESHOLD = 0.73; }
        static { this.AI_RELATED_INFORMATION_MAX_PICKS = 5; }
        constructor(aiRelatedInformationService) {
            this.aiRelatedInformationService = aiRelatedInformationService;
            this._filter = '';
            this._keysProvider = new AiRelatedInformationSearchKeysProvider(aiRelatedInformationService);
        }
        setFilter(filter) {
            this._filter = cleanFilter(filter);
        }
        async searchModel(preferencesModel, token) {
            if (!this._filter ||
                !this.aiRelatedInformationService.isEnabled()) {
                return null;
            }
            this._keysProvider.updateModel(preferencesModel);
            return {
                filterMatches: await this.getAiRelatedInformationItems(token)
            };
        }
        async getAiRelatedInformationItems(token) {
            const settingsRecord = this._keysProvider.getSettingsRecord();
            const filterMatches = [];
            const relatedInformation = await this.aiRelatedInformationService.getRelatedInformation(this._filter, [aiRelatedInformation_1.RelatedInformationType.SettingInformation], token ?? cancellation_1.CancellationToken.None);
            relatedInformation.sort((a, b) => b.weight - a.weight);
            for (const info of relatedInformation) {
                if (info.weight < AiRelatedInformationSearchProvider_1.AI_RELATED_INFORMATION_THRESHOLD || filterMatches.length === AiRelatedInformationSearchProvider_1.AI_RELATED_INFORMATION_MAX_PICKS) {
                    break;
                }
                const pick = info.setting;
                filterMatches.push({
                    setting: settingsRecord[pick],
                    matches: [settingsRecord[pick].range],
                    matchType: preferences_1.SettingMatchType.RemoteMatch,
                    score: info.weight
                });
            }
            return filterMatches;
        }
    };
    AiRelatedInformationSearchProvider = AiRelatedInformationSearchProvider_1 = __decorate([
        __param(0, aiRelatedInformation_1.IAiRelatedInformationService)
    ], AiRelatedInformationSearchProvider);
    class TfIdfSearchProvider {
        static { this.TF_IDF_PRE_NORMALIZE_THRESHOLD = 50; }
        static { this.TF_IDF_POST_NORMALIZE_THRESHOLD = 0.7; }
        static { this.TF_IDF_MAX_PICKS = 5; }
        constructor() {
            this._filter = '';
            this._documents = [];
            this._settingsRecord = {};
        }
        setFilter(filter) {
            this._filter = cleanFilter(filter);
        }
        keyToLabel(settingId) {
            const label = settingId
                .replace(/[-._]/g, ' ')
                .replace(/([a-z]+)([A-Z])/g, '$1 $2')
                .replace(/([A-Za-z]+)(\d+)/g, '$1 $2')
                .replace(/(\d+)([A-Za-z]+)/g, '$1 $2')
                .toLowerCase();
            return label;
        }
        settingItemToEmbeddingString(item) {
            let result = `Setting Id: ${item.key}\n`;
            result += `Label: ${this.keyToLabel(item.key)}\n`;
            result += `Description: ${item.description}\n`;
            return result;
        }
        async searchModel(preferencesModel, token) {
            if (!this._filter) {
                return null;
            }
            if (this._currentPreferencesModel !== preferencesModel) {
                // Refresh the documents and settings record
                this._currentPreferencesModel = preferencesModel;
                this._documents = [];
                this._settingsRecord = {};
                for (const group of preferencesModel.settingsGroups) {
                    if (group.id === 'mostCommonlyUsed') {
                        continue;
                    }
                    for (const section of group.sections) {
                        for (const setting of section.settings) {
                            this._documents.push({
                                key: setting.key,
                                textChunks: [this.settingItemToEmbeddingString(setting)]
                            });
                            this._settingsRecord[setting.key] = setting;
                        }
                    }
                }
            }
            return {
                filterMatches: await this.getTfIdfItems(token)
            };
        }
        async getTfIdfItems(token) {
            const filterMatches = [];
            const tfIdfCalculator = new tfIdf_1.TfIdfCalculator();
            tfIdfCalculator.updateDocuments(this._documents);
            const tfIdfRankings = tfIdfCalculator.calculateScores(this._filter, token ?? cancellation_1.CancellationToken.None);
            tfIdfRankings.sort((a, b) => b.score - a.score);
            const maxScore = tfIdfRankings[0].score;
            if (maxScore < TfIdfSearchProvider.TF_IDF_PRE_NORMALIZE_THRESHOLD) {
                // Reject all the matches.
                return [];
            }
            for (const info of tfIdfRankings) {
                if (info.score / maxScore < TfIdfSearchProvider.TF_IDF_POST_NORMALIZE_THRESHOLD || filterMatches.length === TfIdfSearchProvider.TF_IDF_MAX_PICKS) {
                    break;
                }
                const pick = info.key;
                filterMatches.push({
                    setting: this._settingsRecord[pick],
                    matches: [this._settingsRecord[pick].range],
                    matchType: preferences_1.SettingMatchType.RemoteMatch,
                    score: info.score
                });
            }
            return filterMatches;
        }
    }
    let RemoteSearchProvider = class RemoteSearchProvider {
        constructor(aiRelatedInformationService) {
            this.aiRelatedInformationService = aiRelatedInformationService;
            this.filter = '';
        }
        initializeSearchProviders() {
            if (this.aiRelatedInformationService.isEnabled()) {
                this.adaSearchProvider ??= new AiRelatedInformationSearchProvider(this.aiRelatedInformationService);
            }
            else {
                this.tfIdfSearchProvider ??= new TfIdfSearchProvider();
            }
        }
        setFilter(filter) {
            this.initializeSearchProviders();
            this.filter = filter;
            if (this.adaSearchProvider) {
                this.adaSearchProvider.setFilter(filter);
            }
            else {
                this.tfIdfSearchProvider.setFilter(filter);
            }
        }
        searchModel(preferencesModel, token) {
            if (!this.filter) {
                return Promise.resolve(null);
            }
            if (this.adaSearchProvider) {
                return this.adaSearchProvider.searchModel(preferencesModel, token);
            }
            else {
                return this.tfIdfSearchProvider.searchModel(preferencesModel, token);
            }
        }
    };
    RemoteSearchProvider = __decorate([
        __param(0, aiRelatedInformation_1.IAiRelatedInformationService)
    ], RemoteSearchProvider);
    (0, extensions_1.registerSingleton)(preferences_2.IPreferencesSearchService, PreferencesSearchService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNTZWFyY2guanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wcmVmZXJlbmNlcy9icm93c2VyL3ByZWZlcmVuY2VzU2VhcmNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwQnpGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7UUFPdkQsWUFDeUMsb0JBQTJDLEVBQzNDLG9CQUEyQyxFQUNyQywwQkFBdUQsRUFDOUMsMEJBQWdFO1lBRXZILEtBQUssRUFBRSxDQUFDO1lBTGdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyQywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQzlDLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBc0M7WUFJdkgscUhBQXFIO1lBQ3JILElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsWUFBWSw0QkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3hHLGtEQUFrRDtnQkFDbEQsT0FBTyxJQUFJO3FCQUNULE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7cUJBQzdELE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDO3FCQUNqRyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxD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