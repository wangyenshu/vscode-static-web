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
define(["require", "exports", "vs/amdX", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/observable", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/types", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/supports/tokenization", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/textMate/browser/tokenizationSupport/textMateTokenizationSupport", "vs/workbench/services/textMate/browser/tokenizationSupport/tokenizationSupportWithLineLimit", "vs/workbench/services/textMate/browser/backgroundTokenization/threadedBackgroundTokenizerFactory", "vs/workbench/services/textMate/common/TMGrammarFactory", "vs/workbench/services/textMate/common/TMGrammars", "vs/workbench/services/themes/common/workbenchThemeService"], function (require, exports, amdX_1, dom, arrays_1, color_1, errors_1, lifecycle_1, network_1, observable_1, platform_1, resources, types, languages_1, language_1, tokenization_1, nls, configuration_1, extensionResourceLoader_1, instantiation_1, log_1, notification_1, progress_1, telemetry_1, environmentService_1, textMateTokenizationSupport_1, tokenizationSupportWithLineLimit_1, threadedBackgroundTokenizerFactory_1, TMGrammarFactory_1, TMGrammars_1, workbenchThemeService_1) {
    "use strict";
    var TextMateTokenizationFeature_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextMateTokenizationFeature = void 0;
    let TextMateTokenizationFeature = class TextMateTokenizationFeature extends lifecycle_1.Disposable {
        static { TextMateTokenizationFeature_1 = this; }
        static { this.reportTokenizationTimeCounter = { sync: 0, async: 0 }; }
        constructor(_languageService, _themeService, _extensionResourceLoaderService, _notificationService, _logService, _configurationService, _progressService, _environmentService, _instantiationService, _telemetryService) {
            super();
            this._languageService = _languageService;
            this._themeService = _themeService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this._notificationService = _notificationService;
            this._logService = _logService;
            this._configurationService = _configurationService;
            this._progressService = _progressService;
            this._environmentService = _environmentService;
            this._instantiationService = _instantiationService;
            this._telemetryService = _telemetryService;
            this._createdModes = [];
            this._encounteredLanguages = [];
            this._debugMode = false;
            this._debugModePrintFunc = () => { };
            this._grammarDefinitions = null;
            this._grammarFactory = null;
            this._tokenizersRegistrations = new lifecycle_1.DisposableStore();
            this._currentTheme = null;
            this._currentTokenColorMap = null;
            this._threadedBackgroundTokenizerFactory = this._instantiationService.createInstance(threadedBackgroundTokenizerFactory_1.ThreadedBackgroundTokenizerFactory, (timeMs, languageId, sourceExtensionId, lineLength, isRandomSample) => this._reportTokenizationTime(timeMs, languageId, sourceExtensionId, lineLength, true, isRandomSample), () => this.getAsyncTokenizationEnabled());
            this._vscodeOniguruma = null;
            this._styleElement = dom.createStyleSheet();
            this._styleElement.className = 'vscode-tokens-styles';
            TMGrammars_1.grammarsExtPoint.setHandler((extensions) => this._handleGrammarsExtPoint(extensions));
            this._updateTheme(this._themeService.getColorTheme(), true);
            this._register(this._themeService.onDidColorThemeChange(() => {
                this._updateTheme(this._themeService.getColorTheme(), false);
            }));
            this._languageService.onDidRequestRichLanguageFeatures((languageId) => {
                this._createdModes.push(languageId);
            });
        }
        getAsyncTokenizationEnabled() {
            return !!this._configurationService.getValue('editor.experimental.asyncTokenization');
        }
        getAsyncTokenizationVerification() {
            return !!this._configurationService.getValue('editor.experimental.asyncTokenizationVerification');
        }
        _handleGrammarsExtPoint(extensions) {
            this._grammarDefinitions = null;
            if (this._grammarFactory) {
                this._grammarFactory.dispose();
                this._grammarFactory = null;
            }
            this._tokenizersRegistrations.clear();
            this._grammarDefinitions = [];
            for (const extension of extensions) {
                const grammars = extension.value;
                for (const grammar of grammars) {
                    const validatedGrammar = this._validateGrammarDefinition(extension, grammar);
                    if (validatedGrammar) {
                        this._grammarDefinitions.push(validatedGrammar);
                        if (validatedGrammar.language) {
                            const lazyTokenizationSupport = new languages_1.LazyTokenizationSupport(() => this._createTokenizationSupport(validatedGrammar.language));
                            this._tokenizersRegistrations.add(lazyTokenizationSupport);
                            this._tokenizersRegistrations.add(languages_1.TokenizationRegistry.registerFactory(validatedGrammar.language, lazyTokenizationSupport));
                        }
                    }
                }
            }
            this._threadedBackgroundTokenizerFactory.setGrammarDefinitions(this._grammarDefinitions);
            for (const createdMode of this._createdModes) {
                languages_1.TokenizationRegistry.getOrCreate(createdMode);
            }
        }
        _validateGrammarDefinition(extension, grammar) {
            if (!validateGrammarExtensionPoint(extension.description.extensionLocation, grammar, extension.collector, this._languageService)) {
                return null;
            }
            const grammarLocation = resources.joinPath(extension.description.extensionLocation, grammar.path);
            const embeddedLanguages = Object.create(null);
            if (grammar.embeddedLanguages) {
                const scopes = Object.keys(grammar.embeddedLanguages);
                for (let i = 0, len = scopes.length; i < len; i++) {
                    const scope = scopes[i];
                    const language = grammar.embeddedLanguages[scope];
                    if (typeof language !== 'string') {
                        // never hurts to be too careful
                        continue;
                    }
                    if (this._languageService.isRegisteredLanguageId(language)) {
                        embeddedLanguages[scope] = this._languageService.languageIdCodec.encodeLanguageId(language);
                    }
                }
            }
            const tokenTypes = Object.create(null);
            if (grammar.tokenTypes) {
                const scopes = Object.keys(grammar.tokenTypes);
                for (const scope of scopes) {
                    const tokenType = grammar.tokenTypes[scope];
                    switch (tokenType) {
                        case 'string':
                            tokenTypes[scope] = 2 /* StandardTokenType.String */;
                            break;
                        case 'other':
                            tokenTypes[scope] = 0 /* StandardTokenType.Other */;
                            break;
                        case 'comment':
                            tokenTypes[scope] = 1 /* StandardTokenType.Comment */;
                            break;
                    }
                }
            }
            const validLanguageId = grammar.language && this._languageService.isRegisteredLanguageId(grammar.language) ? grammar.language : null;
            function asStringArray(array, defaultValue) {
                if (!Array.isArray(array)) {
                    return defaultValue;
                }
                if (!array.every(e => typeof e === 'string')) {
                    return defaultValue;
                }
                return array;
            }
            return {
                location: grammarLocation,
                language: validLanguageId || undefined,
                scopeName: grammar.scopeName,
                embeddedLanguages: embeddedLanguages,
                tokenTypes: tokenTypes,
                injectTo: grammar.injectTo,
                balancedBracketSelectors: asStringArray(grammar.balancedBracketScopes, ['*']),
                unbalancedBracketSelectors: asStringArray(grammar.unbalancedBracketScopes, []),
                sourceExtensionId: extension.description.id,
            };
        }
        startDebugMode(printFn, onStop) {
            if (this._debugMode) {
                this._notificationService.error(nls.localize('alreadyDebugging', "Already Logging."));
                return;
            }
            this._debugModePrintFunc = printFn;
            this._debugMode = true;
            if (this._debugMode) {
                this._progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    buttons: [nls.localize('stop', "Stop")]
                }, (progress) => {
                    progress.report({
                        message: nls.localize('progress1', "Preparing to log TM Grammar parsing. Press Stop when finished.")
                    });
                    return this._getVSCodeOniguruma().then((vscodeOniguruma) => {
                        vscodeOniguruma.setDefaultDebugCall(true);
                        progress.report({
                            message: nls.localize('progress2', "Now logging TM Grammar parsing. Press Stop when finished.")
                        });
                        return new Promise((resolve, reject) => { });
                    });
                }, (choice) => {
                    this._getVSCodeOniguruma().then((vscodeOniguruma) => {
                        this._debugModePrintFunc = () => { };
                        this._debugMode = false;
                        vscodeOniguruma.setDefaultDebugCall(false);
                        onStop();
                    });
                });
            }
        }
        _canCreateGrammarFactory() {
            // Check if extension point is ready
            return !!this._grammarDefinitions;
        }
        async _getOrCreateGrammarFactory() {
            if (this._grammarFactory) {
                return this._grammarFactory;
            }
            const [vscodeTextmate, vscodeOniguruma] = await Promise.all([(0, amdX_1.importAMDNodeModule)('vscode-textmate', 'release/main.js'), this._getVSCodeOniguruma()]);
            const onigLib = Promise.resolve({
                createOnigScanner: (sources) => vscodeOniguruma.createOnigScanner(sources),
                createOnigString: (str) => vscodeOniguruma.createOnigString(str)
            });
            // Avoid duplicate instantiations
            if (this._grammarFactory) {
                return this._grammarFactory;
            }
            this._grammarFactory = new TMGrammarFactory_1.TMGrammarFactory({
                logTrace: (msg) => this._logService.trace(msg),
                logError: (msg, err) => this._logService.error(msg, err),
                readFile: (resource) => this._extensionResourceLoaderService.readExtensionResource(resource)
            }, this._grammarDefinitions || [], vscodeTextmate, onigLib);
            this._updateTheme(this._themeService.getColorTheme(), true);
            return this._grammarFactory;
        }
        async _createTokenizationSupport(languageId) {
            if (!this._languageService.isRegisteredLanguageId(languageId)) {
                return null;
            }
            if (!this._canCreateGrammarFactory()) {
                return null;
            }
            try {
                const grammarFactory = await this._getOrCreateGrammarFactory();
                if (!grammarFactory.has(languageId)) {
                    return null;
                }
                const encodedLanguageId = this._languageService.languageIdCodec.encodeLanguageId(languageId);
                const r = await grammarFactory.createGrammar(languageId, encodedLanguageId);
                if (!r.grammar) {
                    return null;
                }
                const maxTokenizationLineLength = observableConfigValue('editor.maxTokenizationLineLength', languageId, -1, this._configurationService);
                const tokenization = new textMateTokenizationSupport_1.TextMateTokenizationSupport(r.grammar, r.initialState, r.containsEmbeddedLanguages, (textModel, tokenStore) => this._threadedBackgroundTokenizerFactory.createBackgroundTokenizer(textModel, tokenStore, maxTokenizationLineLength), () => this.getAsyncTokenizationVerification(), (timeMs, lineLength, isRandomSample) => {
                    this._reportTokenizationTime(timeMs, languageId, r.sourceExtensionId, lineLength, false, isRandomSample);
                }, true);
                tokenization.onDidEncounterLanguage((encodedLanguageId) => {
                    if (!this._encounteredLanguages[encodedLanguageId]) {
                        const languageId = this._languageService.languageIdCodec.decodeLanguageId(encodedLanguageId);
                        this._encounteredLanguages[encodedLanguageId] = true;
                        this._languageService.requestBasicLanguageFeatures(languageId);
                    }
                });
                return new tokenizationSupportWithLineLimit_1.TokenizationSupportWithLineLimit(encodedLanguageId, tokenization, maxTokenizationLineLength);
            }
            catch (err) {
                if (err.message && err.message === TMGrammarFactory_1.missingTMGrammarErrorMessage) {
                    // Don't log this error message
                    return null;
                }
                (0, errors_1.onUnexpectedError)(err);
                return null;
            }
        }
        _updateTheme(colorTheme, forceUpdate) {
            if (!forceUpdate && this._currentTheme && this._currentTokenColorMap && equalsTokenRules(this._currentTheme.settings, colorTheme.tokenColors)
                && (0, arrays_1.equals)(this._currentTokenColorMap, colorTheme.tokenColorMap)) {
                return;
            }
            this._currentTheme = { name: colorTheme.label, settings: colorTheme.tokenColors };
            this._currentTokenColorMap = colorTheme.tokenColorMap;
            this._grammarFactory?.setTheme(this._currentTheme, this._currentTokenColorMap);
            const colorMap = toColorMap(this._currentTokenColorMap);
            const cssRules = (0, tokenization_1.generateTokensCSSForColorMap)(colorMap);
            this._styleElement.textContent = cssRules;
            languages_1.TokenizationRegistry.setColorMap(colorMap);
            if (this._currentTheme && this._currentTokenColorMap) {
                this._threadedBackgroundTokenizerFactory.acceptTheme(this._currentTheme, this._currentTokenColorMap);
            }
        }
        async createTokenizer(languageId) {
            if (!this._languageService.isRegisteredLanguageId(languageId)) {
                return null;
            }
            const grammarFactory = await this._getOrCreateGrammarFactory();
            if (!grammarFactory.has(languageId)) {
                return null;
            }
            const encodedLanguageId = this._languageService.languageIdCodec.encodeLanguageId(languageId);
            const { grammar } = await grammarFactory.createGrammar(languageId, encodedLanguageId);
            return grammar;
        }
        _getVSCodeOniguruma() {
            if (!this._vscodeOniguruma) {
                this._vscodeOniguruma = (async () => {
                    const [vscodeOniguruma, wasm] = await Promise.all([(0, amdX_1.importAMDNodeModule)('vscode-oniguruma', 'release/main.js'), this._loadVSCodeOnigurumaWASM()]);
                    await vscodeOniguruma.loadWASM({
                        data: wasm,
                        print: (str) => {
                            this._debugModePrintFunc(str);
                        }
                    });
                    return vscodeOniguruma;
                })();
            }
            return this._vscodeOniguruma;
        }
        async _loadVSCodeOnigurumaWASM() {
            if (platform_1.isWeb) {
                const response = await fetch(network_1.FileAccess.asBrowserUri('vscode-oniguruma/../onig.wasm').toString(true));
                // Using the response directly only works if the server sets the MIME type 'application/wasm'.
                // Otherwise, a TypeError is thrown when using the streaming compiler.
                // We therefore use the non-streaming compiler :(.
                return await response.arrayBuffer();
            }
            else {
                const response = await fetch(this._environmentService.isBuilt
                    ? network_1.FileAccess.asBrowserUri(`${network_1.nodeModulesAsarUnpackedPath}/vscode-oniguruma/release/onig.wasm`).toString(true)
                    : network_1.FileAccess.asBrowserUri(`${network_1.nodeModulesPath}/vscode-oniguruma/release/onig.wasm`).toString(true));
                return response;
            }
        }
        _reportTokenizationTime(timeMs, languageId, sourceExtensionId, lineLength, fromWorker, isRandomSample) {
            const key = fromWorker ? 'async' : 'sync';
            // 50 events per hour (one event has a low probability)
            if (TextMateTokenizationFeature_1.reportTokenizationTimeCounter[key] > 50) {
                // Don't flood telemetry with too many events
                return;
            }
            if (TextMateTokenizationFeature_1.reportTokenizationTimeCounter[key] === 0) {
                setTimeout(() => {
                    TextMateTokenizationFeature_1.reportTokenizationTimeCounter[key] = 0;
                }, 1000 * 60 * 60);
            }
            TextMateTokenizationFeature_1.reportTokenizationTimeCounter[key]++;
            this._telemetryService.publicLog2('editor.tokenizedLine', {
                timeMs,
                languageId,
                lineLength,
                fromWorker,
                sourceExtensionId,
                isRandomSample,
                tokenizationSetting: this.getAsyncTokenizationEnabled() ? (this.getAsyncTokenizationVerification() ? 2 : 1) : 0,
            });
        }
    };
    exports.TextMateTokenizationFeature = TextMateTokenizationFeature;
    exports.TextMateTokenizationFeature = TextMateTokenizationFeature = TextMateTokenizationFeature_1 = __decorate([
        __param(0, language_1.ILanguageService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, progress_1.IProgressService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, telemetry_1.ITelemetryService)
    ], TextMateTokenizationFeature);
    function toColorMap(colorMap) {
        const result = [null];
        for (let i = 1, len = colorMap.length; i < len; i++) {
            result[i] = color_1.Color.fromHex(colorMap[i]);
        }
        return result;
    }
    function equalsTokenRules(a, b) {
        if (!b || !a || b.length !== a.length) {
            return false;
        }
        for (let i = b.length - 1; i >= 0; i--) {
            const r1 = b[i];
            const r2 = a[i];
            if (r1.scope !== r2.scope) {
                return false;
            }
            const s1 = r1.settings;
            const s2 = r2.settings;
            if (s1 && s2) {
                if (s1.fontStyle !== s2.fontStyle || s1.foreground !== s2.foreground || s1.background !== s2.background) {
                    return false;
                }
            }
            else if (!s1 || !s2) {
                return false;
            }
        }
        return true;
    }
    function validateGrammarExtensionPoint(extensionLocation, syntax, collector, _languageService) {
        if (syntax.language && ((typeof syntax.language !== 'string') || !_languageService.isRegisteredLanguageId(syntax.language))) {
            collector.error(nls.localize('invalid.language', "Unknown language in `contributes.{0}.language`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.language)));
            return false;
        }
        if (!syntax.scopeName || (typeof syntax.scopeName !== 'string')) {
            collector.error(nls.localize('invalid.scopeName', "Expected string in `contributes.{0}.scopeName`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.scopeName)));
            return false;
        }
        if (!syntax.path || (typeof syntax.path !== 'string')) {
            collector.error(nls.localize('invalid.path.0', "Expected string in `contributes.{0}.path`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.path)));
            return false;
        }
        if (syntax.injectTo && (!Array.isArray(syntax.injectTo) || syntax.injectTo.some(scope => typeof scope !== 'string'))) {
            collector.error(nls.localize('invalid.injectTo', "Invalid value in `contributes.{0}.injectTo`. Must be an array of language scope names. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.injectTo)));
            return false;
        }
        if (syntax.embeddedLanguages && !types.isObject(syntax.embeddedLanguages)) {
            collector.error(nls.localize('invalid.embeddedLanguages', "Invalid value in `contributes.{0}.embeddedLanguages`. Must be an object map from scope name to language. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.embeddedLanguages)));
            return false;
        }
        if (syntax.tokenTypes && !types.isObject(syntax.tokenTypes)) {
            collector.error(nls.localize('invalid.tokenTypes', "Invalid value in `contributes.{0}.tokenTypes`. Must be an object map from scope name to token type. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.tokenTypes)));
            return false;
        }
        const grammarLocation = resources.joinPath(extensionLocation, syntax.path);
        if (!resources.isEqualOrParent(grammarLocation, extensionLocation)) {
            collector.warn(nls.localize('invalid.path.1', "Expected `contributes.{0}.path` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", TMGrammars_1.grammarsExtPoint.name, grammarLocation.path, extensionLocation.path));
        }
        return true;
    }
    function observableConfigValue(key, languageId, defaultValue, configurationService) {
        return (0, observable_1.observableFromEvent)((handleChange) => configurationService.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(key, { overrideIdentifier: languageId })) {
                handleChange(e);
            }
        }), () => configurationService.getValue(key, { overrideIdentifier: languageId }) ?? defaultValue);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1hdGVUb2tlbml6YXRpb25GZWF0dXJlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0TWF0ZS9icm93c2VyL3RleHRNYXRlVG9rZW5pemF0aW9uRmVhdHVyZUltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXNDekYsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTs7aUJBQzNDLGtDQUE2QixHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEFBQXhCLENBQXlCO1FBcUJyRSxZQUNtQixnQkFBbUQsRUFDN0MsYUFBc0QsRUFDN0MsK0JBQWlGLEVBQzVGLG9CQUEyRCxFQUNwRSxXQUF5QyxFQUMvQixxQkFBNkQsRUFDbEUsZ0JBQW1ELEVBQ3ZDLG1CQUFrRSxFQUN6RSxxQkFBNkQsRUFDakUsaUJBQXFEO1lBRXhFLEtBQUssRUFBRSxDQUFDO1lBWDJCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDNUIsa0JBQWEsR0FBYixhQUFhLENBQXdCO1lBQzVCLG9DQUErQixHQUEvQiwrQkFBK0IsQ0FBaUM7WUFDM0UseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUNuRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNkLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDakQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUN0Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQThCO1lBQ3hELDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDaEQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQTNCeEQsa0JBQWEsR0FBYSxFQUFFLENBQUM7WUFDN0IsMEJB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