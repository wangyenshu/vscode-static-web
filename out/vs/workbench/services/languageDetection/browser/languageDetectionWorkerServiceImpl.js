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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/base/common/network", "vs/workbench/services/environment/common/environmentService", "vs/platform/configuration/common/configuration", "vs/editor/common/languages/language", "vs/base/common/uri", "vs/base/common/platform", "vs/platform/instantiation/common/extensions", "vs/editor/common/services/model", "vs/base/common/worker/simpleWorker", "vs/platform/telemetry/common/telemetry", "vs/editor/browser/services/editorWorkerService", "vs/editor/common/languages/languageConfigurationRegistry", "vs/platform/diagnostics/common/diagnostics", "vs/platform/workspace/common/workspace", "vs/workbench/services/editor/common/editorService", "vs/platform/storage/common/storage", "vs/base/common/map", "vs/platform/log/common/log"], function (require, exports, lifecycle_1, languageDetectionWorkerService_1, network_1, environmentService_1, configuration_1, language_1, uri_1, platform_1, extensions_1, model_1, simpleWorker_1, telemetry_1, editorWorkerService_1, languageConfigurationRegistry_1, diagnostics_1, workspace_1, editorService_1, storage_1, map_1, log_1) {
    "use strict";
    var LanguageDetectionService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageDetectionWorkerClient = exports.LanguageDetectionWorkerHost = exports.LanguageDetectionService = void 0;
    const TOP_LANG_COUNTS = 12;
    const regexpModuleLocation = `${network_1.nodeModulesPath}/vscode-regexp-languagedetection`;
    const regexpModuleLocationAsar = `${network_1.nodeModulesAsarPath}/vscode-regexp-languagedetection`;
    const moduleLocation = `${network_1.nodeModulesPath}/@vscode/vscode-languagedetection`;
    const moduleLocationAsar = `${network_1.nodeModulesAsarPath}/@vscode/vscode-languagedetection`;
    let LanguageDetectionService = class LanguageDetectionService extends lifecycle_1.Disposable {
        static { LanguageDetectionService_1 = this; }
        static { this.enablementSettingKey = 'workbench.editor.languageDetection'; }
        static { this.historyBasedEnablementConfig = 'workbench.editor.historyBasedLanguageDetection'; }
        static { this.preferHistoryConfig = 'workbench.editor.preferHistoryBasedLanguageDetection'; }
        static { this.workspaceOpenedLanguagesStorageKey = 'workbench.editor.languageDetectionOpenedLanguages.workspace'; }
        static { this.globalOpenedLanguagesStorageKey = 'workbench.editor.languageDetectionOpenedLanguages.global'; }
        constructor(_environmentService, languageService, _configurationService, _diagnosticsService, _workspaceContextService, modelService, _editorService, telemetryService, storageService, _logService, languageConfigurationService) {
            super();
            this._environmentService = _environmentService;
            this._configurationService = _configurationService;
            this._diagnosticsService = _diagnosticsService;
            this._workspaceContextService = _workspaceContextService;
            this._editorService = _editorService;
            this._logService = _logService;
            this.hasResolvedWorkspaceLanguageIds = false;
            this.workspaceLanguageIds = new Set();
            this.sessionOpenedLanguageIds = new Set();
            this.historicalGlobalOpenedLanguageIds = new map_1.LRUCache(TOP_LANG_COUNTS);
            this.historicalWorkspaceOpenedLanguageIds = new map_1.LRUCache(TOP_LANG_COUNTS);
            this.dirtyBiases = true;
            this.langBiases = {};
            this._languageDetectionWorkerClient = this._register(new LanguageDetectionWorkerClient(modelService, languageService, telemetryService, 
            // TODO: See if it's possible to bundle vscode-languagedetection
            this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${moduleLocationAsar}/dist/lib/index.js`).toString(true)
                : network_1.FileAccess.asBrowserUri(`${moduleLocation}/dist/lib/index.js`).toString(true), this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${moduleLocationAsar}/model/model.json`).toString(true)
                : network_1.FileAccess.asBrowserUri(`${moduleLocation}/model/model.json`).toString(true), this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${moduleLocationAsar}/model/group1-shard1of1.bin`).toString(true)
                : network_1.FileAccess.asBrowserUri(`${moduleLocation}/model/group1-shard1of1.bin`).toString(true), this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${regexpModuleLocationAsar}/dist/index.js`).toString(true)
                : network_1.FileAccess.asBrowserUri(`${regexpModuleLocation}/dist/index.js`).toString(true), languageConfigurationService));
            this.initEditorOpenedListeners(storageService);
        }
        async resolveWorkspaceLanguageIds() {
            if (this.hasResolvedWorkspaceLanguageIds) {
                return;
            }
            this.hasResolvedWorkspaceLanguageIds = true;
            const fileExtensions = await this._diagnosticsService.getWorkspaceFileExtensions(this._workspaceContextService.getWorkspace());
            let count = 0;
            for (const ext of fileExtensions.extensions) {
                const langId = this._languageDetectionWorkerClient.getLanguageId(ext);
                if (langId && count < TOP_LANG_COUNTS) {
                    this.workspaceLanguageIds.add(langId);
                    count++;
                    if (count > TOP_LANG_COUNTS) {
                        break;
                    }
                }
            }
            this.dirtyBiases = true;
        }
        isEnabledForLanguage(languageId) {
            return !!languageId && this._configurationService.getValue(LanguageDetectionService_1.enablementSettingKey, { overrideIdentifier: languageId });
        }
        getLanguageBiases() {
            if (!this.dirtyBiases) {
                return this.langBiases;
            }
            const biases = {};
            // Give different weight to the biases depending on relevance of source
            this.sessionOpenedLanguageIds.forEach(lang => biases[lang] = (biases[lang] ?? 0) + 7);
            this.workspaceLanguageIds.forEach(lang => biases[lang] = (biases[lang] ?? 0) + 5);
            [...this.historicalWorkspaceOpenedLanguageIds.keys()].forEach(lang => biases[lang] = (biases[lang] ?? 0) + 3);
            [...this.historicalGlobalOpenedLanguageIds.keys()].forEach(lang => biases[lang] = (biases[lang] ?? 0) + 1);
            this._logService.trace('Session Languages:', JSON.stringify([...this.sessionOpenedLanguageIds]));
            this._logService.trace('Workspace Languages:', JSON.stringify([...this.workspaceLanguageIds]));
            this._logService.trace('Historical Workspace Opened Languages:', JSON.stringify([...this.historicalWorkspaceOpenedLanguageIds.keys()]));
            this._logService.trace('Historical Globally Opened Languages:', JSON.stringify([...this.historicalGlobalOpenedLanguageIds.keys()]));
            this._logService.trace('Computed Language Detection Biases:', JSON.stringify(biases));
            this.dirtyBiases = false;
            this.langBiases = biases;
            return biases;
        }
        async detectLanguage(resource, supportedLangs) {
            const useHistory = this._configurationService.getValue(LanguageDetectionService_1.historyBasedEnablementConfig);
            const preferHistory = this._configurationService.getValue(LanguageDetectionService_1.preferHistoryConfig);
            if (useHistory) {
                await this.resolveWorkspaceLanguageIds();
            }
            const biases = useHistory ? this.getLanguageBiases() : undefined;
            return this._languageDetectionWorkerClient.detectLanguage(resource, biases, preferHistory, supportedLangs);
        }
        // TODO: explore using the history service or something similar to provide this list of opened editors
        // so this service can support delayed instantiation. This may be tricky since it seems the IHistoryService
        // only gives history for a workspace... where this takes advantage of history at a global level as well.
        initEditorOpenedListeners(storageService) {
            try {
                const globalLangHistoryData = JSON.parse(storageService.get(LanguageDetectionService_1.globalOpenedLanguagesStorageKey, 0 /* StorageScope.PROFILE */, '[]'));
                this.historicalGlobalOpenedLanguageIds.fromJSON(globalLangHistoryData);
            }
            catch (e) {
                console.error(e);
            }
            try {
                const workspaceLangHistoryData = JSON.parse(storageService.get(LanguageDetectionService_1.workspaceOpenedLanguagesStorageKey, 1 /* StorageScope.WORKSPACE */, '[]'));
                this.historicalWorkspaceOpenedLanguageIds.fromJSON(workspaceLangHistoryData);
            }
            catch (e) {
                console.error(e);
            }
            this._register(this._editorService.onDidActiveEditorChange(() => {
                const activeLanguage = this._editorService.activeTextEditorLanguageId;
                if (activeLanguage && this._editorService.activeEditor?.resource?.scheme !== network_1.Schemas.untitled) {
                    this.sessionOpenedLanguageIds.add(activeLanguage);
                    this.historicalGlobalOpenedLanguageIds.set(activeLanguage, true);
                    this.historicalWorkspaceOpenedLanguageIds.set(activeLanguage, true);
                    storageService.store(LanguageDetectionService_1.globalOpenedLanguagesStorageKey, JSON.stringify(this.historicalGlobalOpenedLanguageIds.toJSON()), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                    storageService.store(LanguageDetectionService_1.workspaceOpenedLanguagesStorageKey, JSON.stringify(this.historicalWorkspaceOpenedLanguageIds.toJSON()), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                    this.dirtyBiases = true;
                }
            }));
        }
    };
    exports.LanguageDetectionService = LanguageDetectionService;
    exports.LanguageDetectionService = LanguageDetectionService = LanguageDetectionService_1 = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, language_1.ILanguageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, diagnostics_1.IDiagnosticsService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, model_1.IModelService),
        __param(6, editorService_1.IEditorService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, storage_1.IStorageService),
        __param(9, log_1.ILogService),
        __param(10, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], LanguageDetectionService);
    class LanguageDetectionWorkerHost {
        constructor(_indexJsUri, _modelJsonUri, _weightsUri, _telemetryService) {
            this._indexJsUri = _indexJsUri;
            this._modelJsonUri = _modelJsonUri;
            this._weightsUri = _weightsUri;
            this._telemetryService = _telemetryService;
        }
        async getIndexJsUri() {
            return this._indexJsUri;
        }
        async getModelJsonUri() {
            return this._modelJsonUri;
        }
        async getWeightsUri() {
            return this._weightsUri;
        }
        async sendTelemetryEvent(languages, confidences, timeSpent) {
            this._telemetryService.publicLog2('automaticlanguagedetection.stats', {
                languages: languages.join(','),
                confidences: confidences.join(','),
                timeSpent
            });
        }
    }
    exports.LanguageDetectionWorkerHost = LanguageDetectionWorkerHost;
    class LanguageDetectionWorkerClient extends editorWorkerService_1.EditorWorkerClient {
        constructor(modelService, _languageService, _telemetryService, _indexJsUri, _modelJsonUri, _weightsUri, _regexpModelUri, languageConfigurationService) {
            super(modelService, true, 'languageDetectionWorkerService', languageConfigurationService);
            this._languageService = _languageService;
            this._telemetryService = _telemetryService;
            this._indexJsUri = _indexJsUri;
            this._modelJsonUri = _modelJsonUri;
            this._weightsUri = _weightsUri;
            this._regexpModelUri = _regexpModelUri;
        }
        _getOrCreateLanguageDetectionWorker() {
            if (this.workerPromise) {
                return this.workerPromise;
            }
            this.workerPromise = new Promise((resolve, reject) => {
                resolve(this._register(new simpleWorker_1.SimpleWorkerClient(this._workerFactory, 'vs/workbench/services/languageDetection/browser/languageDetectionSimpleWorker', new editorWorkerService_1.EditorWorkerHost(this))));
            });
            return this.workerPromise;
        }
        _guessLanguageIdByUri(uri) {
            const guess = this._languageService.guessLanguageIdByFilepathOrFirstLine(uri);
            if (guess && guess !== 'unknown') {
                return guess;
            }
            return undefined;
        }
        async _getProxy() {
            return (await this._getOrCreateLanguageDetectionWorker()).getProxyObject();
        }
        // foreign host request
        async fhr(method, args) {
            switch (method) {
                case 'getIndexJsUri':
                    return this.getIndexJsUri();
                case 'getModelJsonUri':
                    return this.getModelJsonUri();
                case 'getWeightsUri':
                    return this.getWeightsUri();
                case 'getRegexpModelUri':
                    return this.getRegexpModelUri();
                case 'getLanguageId':
                    return this.getLanguageId(args[0]);
                case 'sendTelemetryEvent':
                    return this.sendTelemetryEvent(args[0], args[1], args[2]);
                default:
                    return super.fhr(method, args);
            }
        }
        async getIndexJsUri() {
            return this._indexJsUri;
        }
        getLanguageId(languageIdOrExt) {
            if (!languageIdOrExt) {
                return undefined;
            }
            if (this._languageService.isRegisteredLanguageId(languageIdOrExt)) {
                return languageIdOrExt;
            }
            const guessed = this._guessLanguageIdByUri(uri_1.URI.file(`file.${languageIdOrExt}`));
            if (!guessed || guessed === 'unknown') {
                return undefined;
            }
            return guessed;
        }
        async getModelJsonUri() {
            return this._modelJsonUri;
        }
        async getWeightsUri() {
            return this._weightsUri;
        }
        async getRegexpModelUri() {
            return this._regexpModelUri;
        }
        async sendTelemetryEvent(languages, confidences, timeSpent) {
            this._telemetryService.publicLog2(languageDetectionWorkerService_1.LanguageDetectionStatsId, {
                languages: languages.join(','),
                confidences: confidences.join(','),
                timeSpent
            });
        }
        async detectLanguage(resource, langBiases, preferHistory, supportedLangs) {
            const startTime = Date.now();
            const quickGuess = this._guessLanguageIdByUri(resource);
            if (quickGuess) {
                return quickGuess;
            }
            await this._withSyncedResources([resource]);
            const modelId = await (await this._getProxy()).detectLanguage(resource.toString(), langBiases, preferHistory, supportedLangs);
            const languageId = this.getLanguageId(modelId);
            const LanguageDetectionStatsId = 'automaticlanguagedetection.perf';
            this._telemetryService.publicLog2(LanguageDetectionStatsId, {
                timeSpent: Date.now() - startTime,
                detection: languageId || 'unknown',
            });
            return languageId;
        }
    }
    exports.LanguageDetectionWorkerClient = LanguageDetectionWorkerClient;
    // For now we use Eager until we handle keeping track of history better.
    (0, extensions_1.registerSingleton)(languageDetectionWorkerService_1.ILanguageDetectionService, LanguageDetectionService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VEZXRlY3Rpb25Xb3JrZXJTZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9sYW5ndWFnZURldGVjdGlvbi9icm93c2VyL2xhbmd1YWdlRGV0ZWN0aW9uV29ya2VyU2VydmljZUltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXdCaEcsTUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFDO0lBRTNCLE1BQU0sb0JBQW9CLEdBQW9CLEdBQUcseUJBQWUsa0NBQWtDLENBQUM7SUFDbkcsTUFBTSx3QkFBd0IsR0FBb0IsR0FBRyw2QkFBbUIsa0NBQWtDLENBQUM7SUFDM0csTUFBTSxjQUFjLEdBQW9CLEdBQUcseUJBQWUsbUNBQW1DLENBQUM7SUFDOUYsTUFBTSxrQkFBa0IsR0FBb0IsR0FBRyw2QkFBbUIsbUNBQW1DLENBQUM7SUFFL0YsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTs7aUJBQ3ZDLHlCQUFvQixHQUFHLG9DQUFvQyxBQUF2QyxDQUF3QztpQkFDNUQsaUNBQTRCLEdBQUcsZ0RBQWdELEFBQW5ELENBQW9EO2lCQUNoRix3QkFBbUIsR0FBRyxzREFBc0QsQUFBekQsQ0FBMEQ7aUJBQzdFLHVDQUFrQyxHQUFHLDZEQUE2RCxBQUFoRSxDQUFpRTtpQkFDbkcsb0NBQStCLEdBQUcsMERBQTBELEFBQTdELENBQThEO1FBYzdHLFlBQytCLG1CQUFrRSxFQUM5RSxlQUFpQyxFQUM1QixxQkFBNkQsRUFDL0QsbUJBQXlELEVBQ3BELHdCQUFtRSxFQUM5RSxZQUEyQixFQUMxQixjQUErQyxFQUM1QyxnQkFBbUMsRUFDckMsY0FBK0IsRUFDbkMsV0FBeUMsRUFDdkIsNEJBQTJEO1lBRTFGLEtBQUss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