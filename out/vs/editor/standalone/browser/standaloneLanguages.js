/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/common/standalone/standaloneEnums", "vs/editor/standalone/browser/standaloneServices", "vs/editor/standalone/common/monarch/monarchCompile", "vs/editor/standalone/common/monarch/monarchLexer", "vs/editor/standalone/common/standaloneTheme", "vs/platform/configuration/common/configuration", "vs/platform/markers/common/markers"], function (require, exports, color_1, range_1, languages, language_1, languageConfigurationRegistry_1, modesRegistry_1, languageFeatures_1, standaloneEnums, standaloneServices_1, monarchCompile_1, monarchLexer_1, standaloneTheme_1, configuration_1, markers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenizationSupportAdapter = exports.EncodedTokenizationSupportAdapter = void 0;
    exports.register = register;
    exports.getLanguages = getLanguages;
    exports.getEncodedLanguageId = getEncodedLanguageId;
    exports.onLanguage = onLanguage;
    exports.onLanguageEncountered = onLanguageEncountered;
    exports.setLanguageConfiguration = setLanguageConfiguration;
    exports.setColorMap = setColorMap;
    exports.registerTokensProviderFactory = registerTokensProviderFactory;
    exports.setTokensProvider = setTokensProvider;
    exports.setMonarchTokensProvider = setMonarchTokensProvider;
    exports.registerReferenceProvider = registerReferenceProvider;
    exports.registerRenameProvider = registerRenameProvider;
    exports.registerNewSymbolNameProvider = registerNewSymbolNameProvider;
    exports.registerSignatureHelpProvider = registerSignatureHelpProvider;
    exports.registerHoverProvider = registerHoverProvider;
    exports.registerDocumentSymbolProvider = registerDocumentSymbolProvider;
    exports.registerDocumentHighlightProvider = registerDocumentHighlightProvider;
    exports.registerLinkedEditingRangeProvider = registerLinkedEditingRangeProvider;
    exports.registerDefinitionProvider = registerDefinitionProvider;
    exports.registerImplementationProvider = registerImplementationProvider;
    exports.registerTypeDefinitionProvider = registerTypeDefinitionProvider;
    exports.registerCodeLensProvider = registerCodeLensProvider;
    exports.registerCodeActionProvider = registerCodeActionProvider;
    exports.registerDocumentFormattingEditProvider = registerDocumentFormattingEditProvider;
    exports.registerDocumentRangeFormattingEditProvider = registerDocumentRangeFormattingEditProvider;
    exports.registerOnTypeFormattingEditProvider = registerOnTypeFormattingEditProvider;
    exports.registerLinkProvider = registerLinkProvider;
    exports.registerCompletionItemProvider = registerCompletionItemProvider;
    exports.registerColorProvider = registerColorProvider;
    exports.registerFoldingRangeProvider = registerFoldingRangeProvider;
    exports.registerDeclarationProvider = registerDeclarationProvider;
    exports.registerSelectionRangeProvider = registerSelectionRangeProvider;
    exports.registerDocumentSemanticTokensProvider = registerDocumentSemanticTokensProvider;
    exports.registerDocumentRangeSemanticTokensProvider = registerDocumentRangeSemanticTokensProvider;
    exports.registerInlineCompletionsProvider = registerInlineCompletionsProvider;
    exports.registerInlineEditProvider = registerInlineEditProvider;
    exports.registerInlayHintsProvider = registerInlayHintsProvider;
    exports.createMonacoLanguagesAPI = createMonacoLanguagesAPI;
    /**
     * Register information about a new language.
     */
    function register(language) {
        // Intentionally using the `ModesRegistry` here to avoid
        // instantiating services too quickly in the standalone editor.
        modesRegistry_1.ModesRegistry.registerLanguage(language);
    }
    /**
     * Get the information of all the registered languages.
     */
    function getLanguages() {
        let result = [];
        result = result.concat(modesRegistry_1.ModesRegistry.getLanguages());
        return result;
    }
    function getEncodedLanguageId(languageId) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        return languageService.languageIdCodec.encodeLanguageId(languageId);
    }
    /**
     * An event emitted when a language is associated for the first time with a text model.
     * @event
     */
    function onLanguage(languageId, callback) {
        return standaloneServices_1.StandaloneServices.withServices(() => {
            const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
            const disposable = languageService.onDidRequestRichLanguageFeatures((encounteredLanguageId) => {
                if (encounteredLanguageId === languageId) {
                    // stop listening
                    disposable.dispose();
                    // invoke actual listener
                    callback();
                }
            });
            return disposable;
        });
    }
    /**
     * An event emitted when a language is associated for the first time with a text model or
     * when a language is encountered during the tokenization of another language.
     * @event
     */
    function onLanguageEncountered(languageId, callback) {
        return standaloneServices_1.StandaloneServices.withServices(() => {
            const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
            const disposable = languageService.onDidRequestBasicLanguageFeatures((encounteredLanguageId) => {
                if (encounteredLanguageId === languageId) {
                    // stop listening
                    disposable.dispose();
                    // invoke actual listener
                    callback();
                }
            });
            return disposable;
        });
    }
    /**
     * Set the editing configuration for a language.
     */
    function setLanguageConfiguration(languageId, configuration) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        if (!languageService.isRegisteredLanguageId(languageId)) {
            throw new Error(`Cannot set configuration for unknown language ${languageId}`);
        }
        const languageConfigurationService = standaloneServices_1.StandaloneServices.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
        return languageConfigurationService.register(languageId, configuration, 100);
    }
    /**
     * @internal
     */
    class EncodedTokenizationSupportAdapter {
        constructor(languageId, actual) {
            this._languageId = languageId;
            this._actual = actual;
        }
        dispose() {
            // NOOP
        }
        getInitialState() {
            return this._actual.getInitialState();
        }
        tokenize(line, hasEOL, state) {
            if (typeof this._actual.tokenize === 'function') {
                return TokenizationSupportAdapter.adaptTokenize(this._languageId, this._actual, line, state);
            }
            throw new Error('Not supported!');
        }
        tokenizeEncoded(line, hasEOL, state) {
            const result = this._actual.tokenizeEncoded(line, state);
            return new languages.EncodedTokenizationResult(result.tokens, result.endState);
        }
    }
    exports.EncodedTokenizationSupportAdapter = EncodedTokenizationSupportAdapter;
    /**
     * @internal
     */
    class TokenizationSupportAdapter {
        constructor(_languageId, _actual, _languageService, _standaloneThemeService) {
            this._languageId = _languageId;
            this._actual = _actual;
            this._languageService = _languageService;
            this._standaloneThemeService = _standaloneThemeService;
        }
        dispose() {
            // NOOP
        }
        getInitialState() {
            return this._actual.getInitialState();
        }
        static _toClassicTokens(tokens, language) {
            const result = [];
            let previousStartIndex = 0;
            for (let i = 0, len = tokens.length; i < len; i++) {
                const t = tokens[i];
                let startIndex = t.startIndex;
                // Prevent issues stemming from a buggy external tokenizer.
                if (i === 0) {
                    // Force first token to start at first index!
                    startIndex = 0;
                }
                else if (startIndex < previousStartIndex) {
                    // Force tokens to be after one another!
                    startIndex = previousStartIndex;
                }
                result[i] = new languages.Token(startIndex, t.scopes, language);
                previousStartIndex = startIndex;
            }
            return result;
        }
        static adaptTokenize(language, actual, line, state) {
            const actualResult = actual.tokenize(line, state);
            const tokens = TokenizationSupportAdapter._toClassicTokens(actualResult.tokens, language);
            let endState;
            // try to save an object if possible
            if (actualResult.endState.equals(state)) {
                endState = state;
            }
            else {
                endState = actualResult.endState;
            }
            return new languages.TokenizationResult(tokens, endState);
        }
        tokenize(line, hasEOL, state) {
            return TokenizationSupportAdapter.adaptTokenize(this._languageId, this._actual, line, state);
        }
        _toBinaryTokens(languageIdCodec, tokens) {
            const languageId = languageIdCodec.encodeLanguageId(this._languageId);
            const tokenTheme = this._standaloneThemeService.getColorTheme().tokenTheme;
            const result = [];
            let resultLen = 0;
            let previousStartIndex = 0;
            for (let i = 0, len = tokens.length; i < len; i++) {
                const t = tokens[i];
                const metadata = tokenTheme.match(languageId, t.scopes) | 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */;
                if (resultLen > 0 && result[resultLen - 1] === metadata) {
                    // same metadata
                    continue;
                }
                let startIndex = t.startIndex;
                // Prevent issues stemming from a buggy external tokenizer.
                if (i === 0) {
                    // Force first token to start at first index!
                    startIndex = 0;
                }
                else if (startIndex < previousStartIndex) {
                    // Force tokens to be after one another!
                    startIndex = previousStartIndex;
                }
                result[resultLen++] = startIndex;
                result[resultLen++] = metadata;
                previousStartIndex = startIndex;
            }
            const actualResult = new Uint32Array(resultLen);
            for (let i = 0; i < resultLen; i++) {
                actualResult[i] = result[i];
            }
            return actualResult;
        }
        tokenizeEncoded(line, hasEOL, state) {
            const actualResult = this._actual.tokenize(line, state);
            const tokens = this._toBinaryTokens(this._languageService.languageIdCodec, actualResult.tokens);
            let endState;
            // try to save an object if possible
            if (actualResult.endState.equals(state)) {
                endState = state;
            }
            else {
                endState = actualResult.endState;
            }
            return new languages.EncodedTokenizationResult(tokens, endState);
        }
    }
    exports.TokenizationSupportAdapter = TokenizationSupportAdapter;
    function isATokensProvider(provider) {
        return (typeof provider.getInitialState === 'function');
    }
    function isEncodedTokensProvider(provider) {
        return 'tokenizeEncoded' in provider;
    }
    function isThenable(obj) {
        return obj && typeof obj.then === 'function';
    }
    /**
     * Change the color map that is used for token colors.
     * Supported formats (hex): #RRGGBB, $RRGGBBAA, #RGB, #RGBA
     */
    function setColorMap(colorMap) {
        const standaloneThemeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        if (colorMap) {
            const result = [null];
            for (let i = 1, len = colorMap.length; i < len; i++) {
                result[i] = color_1.Color.fromHex(colorMap[i]);
            }
            standaloneThemeService.setColorMapOverride(result);
        }
        else {
            standaloneThemeService.setColorMapOverride(null);
        }
    }
    /**
     * @internal
     */
    function createTokenizationSupportAdapter(languageId, provider) {
        if (isEncodedTokensProvider(provider)) {
            return new EncodedTokenizationSupportAdapter(languageId, provider);
        }
        else {
            return new TokenizationSupportAdapter(languageId, provider, standaloneServices_1.StandaloneServices.get(language_1.ILanguageService), standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService));
        }
    }
    /**
     * Register a tokens provider factory for a language. This tokenizer will be exclusive with a tokenizer
     * set using `setTokensProvider` or one created using `setMonarchTokensProvider`, but will work together
     * with a tokens provider set using `registerDocumentSemanticTokensProvider` or `registerDocumentRangeSemanticTokensProvider`.
     */
    function registerTokensProviderFactory(languageId, factory) {
        const adaptedFactory = new languages.LazyTokenizationSupport(async () => {
            const result = await Promise.resolve(factory.create());
            if (!result) {
                return null;
            }
            if (isATokensProvider(result)) {
                return createTokenizationSupportAdapter(languageId, result);
            }
            return new monarchLexer_1.MonarchTokenizer(standaloneServices_1.StandaloneServices.get(language_1.ILanguageService), standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService), languageId, (0, monarchCompile_1.compile)(languageId, result), standaloneServices_1.StandaloneServices.get(configuration_1.IConfigurationService));
        });
        return languages.TokenizationRegistry.registerFactory(languageId, adaptedFactory);
    }
    /**
     * Set the tokens provider for a language (manual implementation). This tokenizer will be exclusive
     * with a tokenizer created using `setMonarchTokensProvider`, or with `registerTokensProviderFactory`,
     * but will work together with a tokens provider set using `registerDocumentSemanticTokensProvider`
     * or `registerDocumentRangeSemanticTokensProvider`.
     */
    function setTokensProvider(languageId, provider) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        if (!languageService.isRegisteredLanguageId(languageId)) {
            throw new Error(`Cannot set tokens provider for unknown language ${languageId}`);
        }
        if (isThenable(provider)) {
            return registerTokensProviderFactory(languageId, { create: () => provider });
        }
        return languages.TokenizationRegistry.register(languageId, createTokenizationSupportAdapter(languageId, provider));
    }
    /**
     * Set the tokens provider for a language (monarch implementation). This tokenizer will be exclusive
     * with a tokenizer set using `setTokensProvider`, or with `registerTokensProviderFactory`, but will
     * work together with a tokens provider set using `registerDocumentSemanticTokensProvider` or
     * `registerDocumentRangeSemanticTokensProvider`.
     */
    function setMonarchTokensProvider(languageId, languageDef) {
        const create = (languageDef) => {
            return new monarchLexer_1.MonarchTokenizer(standaloneServices_1.StandaloneServices.get(language_1.ILanguageService), standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService), languageId, (0, monarchCompile_1.compile)(languageId, languageDef), standaloneServices_1.StandaloneServices.get(configuration_1.IConfigurationService));
        };
        if (isThenable(languageDef)) {
            return registerTokensProviderFactory(languageId, { create: () => languageDef });
        }
        return languages.TokenizationRegistry.register(languageId, create(languageDef));
    }
    /**
     * Register a reference provider (used by e.g. reference search).
     */
    function registerReferenceProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.referenceProvider.register(languageSelector, provider);
    }
    /**
     * Register a rename provider (used by e.g. rename symbol).
     */
    function registerRenameProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.renameProvider.register(languageSelector, provider);
    }
    /**
     * Register a new symbol-name provider (e.g., when a symbol is being renamed, show new possible symbol-names)
     */
    function registerNewSymbolNameProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.newSymbolNamesProvider.register(languageSelector, provider);
    }
    /**
     * Register a signature help provider (used by e.g. parameter hints).
     */
    function registerSignatureHelpProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.signatureHelpProvider.register(languageSelector, provider);
    }
    /**
     * Register a hover provider (used by e.g. editor hover).
     */
    function registerHoverProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.hoverProvider.register(languageSelector, {
            provideHover: async (model, position, token, context) => {
                const word = model.getWordAtPosition(position);
                return Promise.resolve(provider.provideHover(model, position, token, context)).then((value) => {
                    if (!value) {
                        return undefined;
                    }
                    if (!value.range && word) {
                        value.range = new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
                    }
                    if (!value.range) {
                        value.range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
                    }
                    return value;
                });
            }
        });
    }
    /**
     * Register a document symbol provider (used by e.g. outline).
     */
    function registerDocumentSymbolProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentSymbolProvider.register(languageSelector, provider);
    }
    /**
     * Register a document highlight provider (used by e.g. highlight occurrences).
     */
    function registerDocumentHighlightProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentHighlightProvider.register(languageSelector, provider);
    }
    /**
     * Register an linked editing range provider.
     */
    function registerLinkedEditingRangeProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.linkedEditingRangeProvider.register(languageSelector, provider);
    }
    /**
     * Register a definition provider (used by e.g. go to definition).
     */
    function registerDefinitionProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.definitionProvider.register(languageSelector, provider);
    }
    /**
     * Register a implementation provider (used by e.g. go to implementation).
     */
    function registerImplementationProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.implementationProvider.register(languageSelector, provider);
    }
    /**
     * Register a type definition provider (used by e.g. go to type definition).
     */
    function registerTypeDefinitionProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.typeDefinitionProvider.register(languageSelector, provider);
    }
    /**
     * Register a code lens provider (used by e.g. inline code lenses).
     */
    function registerCodeLensProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.codeLensProvider.register(languageSelector, provider);
    }
    /**
     * Register a code action provider (used by e.g. quick fix).
     */
    function registerCodeActionProvider(languageSelector, provider, metadata) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.codeActionProvider.register(languageSelector, {
            providedCodeActionKinds: metadata?.providedCodeActionKinds,
            documentation: metadata?.documentation,
            provideCodeActions: (model, range, context, token) => {
                const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
                const markers = markerService.read({ resource: model.uri }).filter(m => {
                    return range_1.Range.areIntersectingOrTouching(m, range);
                });
                return provider.provideCodeActions(model, range, { markers, only: context.only, trigger: context.trigger }, token);
            },
            resolveCodeAction: provider.resolveCodeAction
        });
    }
    /**
     * Register a formatter that can handle only entire models.
     */
    function registerDocumentFormattingEditProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentFormattingEditProvider.register(languageSelector, provider);
    }
    /**
     * Register a formatter that can handle a range inside a model.
     */
    function registerDocumentRangeFormattingEditProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentRangeFormattingEditProvider.register(languageSelector, provider);
    }
    /**
     * Register a formatter than can do formatting as the user types.
     */
    function registerOnTypeFormattingEditProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.onTypeFormattingEditProvider.register(languageSelector, provider);
    }
    /**
     * Register a link provider that can find links in text.
     */
    function registerLinkProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.linkProvider.register(languageSelector, provider);
    }
    /**
     * Register a completion item provider (use by e.g. suggestions).
     */
    function registerCompletionItemProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.completionProvider.register(languageSelector, provider);
    }
    /**
     * Register a document color provider (used by Color Picker, Color Decorator).
     */
    function registerColorProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.colorProvider.register(languageSelector, provider);
    }
    /**
     * Register a folding range provider
     */
    function registerFoldingRangeProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.foldingRangeProvider.register(languageSelector, provider);
    }
    /**
     * Register a declaration provider
     */
    function registerDeclarationProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.declarationProvider.register(languageSelector, provider);
    }
    /**
     * Register a selection range provider
     */
    function registerSelectionRangeProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.selectionRangeProvider.register(languageSelector, provider);
    }
    /**
     * Register a document semantic tokens provider. A semantic tokens provider will complement and enhance a
     * simple top-down tokenizer. Simple top-down tokenizers can be set either via `setMonarchTokensProvider`
     * or `setTokensProvider`.
     *
     * For the best user experience, register both a semantic tokens provider and a top-down tokenizer.
     */
    function registerDocumentSemanticTokensProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentSemanticTokensProvider.register(languageSelector, provider);
    }
    /**
     * Register a document range semantic tokens provider. A semantic tokens provider will complement and enhance a
     * simple top-down tokenizer. Simple top-down tokenizers can be set either via `setMonarchTokensProvider`
     * or `setTokensProvider`.
     *
     * For the best user experience, register both a semantic tokens provider and a top-down tokenizer.
     */
    function registerDocumentRangeSemanticTokensProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.documentRangeSemanticTokensProvider.register(languageSelector, provider);
    }
    /**
     * Register an inline completions provider.
     */
    function registerInlineCompletionsProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.inlineCompletionsProvider.register(languageSelector, provider);
    }
    function registerInlineEditProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.inlineEditProvider.register(languageSelector, provider);
    }
    /**
     * Register an inlay hints provider.
     */
    function registerInlayHintsProvider(languageSelector, provider) {
        const languageFeaturesService = standaloneServices_1.StandaloneServices.get(languageFeatures_1.ILanguageFeaturesService);
        return languageFeaturesService.inlayHintsProvider.register(languageSelector, provider);
    }
    /**
     * @internal
     */
    function createMonacoLanguagesAPI() {
        return {
            register: register,
            getLanguages: getLanguages,
            onLanguage: onLanguage,
            onLanguageEncountered: onLanguageEncountered,
            getEncodedLanguageId: getEncodedLanguageId,
            // provider methods
            setLanguageConfiguration: setLanguageConfiguration,
            setColorMap: setColorMap,
            registerTokensProviderFactory: registerTokensProviderFactory,
            setTokensProvider: setTokensProvider,
            setMonarchTokensProvider: setMonarchTokensProvider,
            registerReferenceProvider: registerReferenceProvider,
            registerRenameProvider: registerRenameProvider,
            registerNewSymbolNameProvider: registerNewSymbolNameProvider,
            registerCompletionItemProvider: registerCompletionItemProvider,
            registerSignatureHelpProvider: registerSignatureHelpProvider,
            registerHoverProvider: registerHoverProvider,
            registerDocumentSymbolProvider: registerDocumentSymbolProvider,
            registerDocumentHighlightProvider: registerDocumentHighlightProvider,
            registerLinkedEditingRangeProvider: registerLinkedEditingRangeProvider,
            registerDefinitionProvider: registerDefinitionProvider,
            registerImplementationProvider: registerImplementationProvider,
            registerTypeDefinitionProvider: registerTypeDefinitionProvider,
            registerCodeLensProvider: registerCodeLensProvider,
            registerCodeActionProvider: registerCodeActionProvider,
            registerDocumentFormattingEditProvider: registerDocumentFormattingEditProvider,
            registerDocumentRangeFormattingEditProvider: registerDocumentRangeFormattingEditProvider,
            registerOnTypeFormattingEditProvider: registerOnTypeFormattingEditProvider,
            registerLinkProvider: registerLinkProvider,
            registerColorProvider: registerColorProvider,
            registerFoldingRangeProvider: registerFoldingRangeProvider,
            registerDeclarationProvider: registerDeclarationProvider,
            registerSelectionRangeProvider: registerSelectionRangeProvider,
            registerDocumentSemanticTokensProvider: registerDocumentSemanticTokensProvider,
            registerDocumentRangeSemanticTokensProvider: registerDocumentRangeSemanticTokensProvider,
            registerInlineCompletionsProvider: registerInlineCompletionsProvider,
            registerInlineEditProvider: registerInlineEditProvider,
            registerInlayHintsProvider: registerInlayHintsProvider,
            // enums
            DocumentHighlightKind: standaloneEnums.DocumentHighlightKind,
            CompletionItemKind: standaloneEnums.CompletionItemKind,
            CompletionItemTag: standaloneEnums.CompletionItemTag,
            CompletionItemInsertTextRule: standaloneEnums.CompletionItemInsertTextRule,
            SymbolKind: standaloneEnums.SymbolKind,
            SymbolTag: standaloneEnums.SymbolTag,
            IndentAction: standaloneEnums.IndentAction,
            CompletionTriggerKind: standaloneEnums.CompletionTriggerKind,
            SignatureHelpTriggerKind: standaloneEnums.SignatureHelpTriggerKind,
            InlayHintKind: standaloneEnums.InlayHintKind,
            InlineCompletionTriggerKind: standaloneEnums.InlineCompletionTriggerKind,
            InlineEditTriggerKind: standaloneEnums.InlineEditTriggerKind,
            CodeActionTriggerType: standaloneEnums.CodeActionTriggerType,
            NewSymbolNameTag: standaloneEnums.NewSymbolNameTag,
            NewSymbolNameTriggerKind: standaloneEnums.NewSymbolNameTriggerKind,
            PartialAcceptTriggerKind: standaloneEnums.PartialAcceptTriggerKind,
            HoverVerbosityAction: standaloneEnums.HoverVerbosityAction,
            // classes
            FoldingRangeKind: languages.FoldingRangeKind,
            SelectedSuggestionInfo: languages.SelectedSuggestionInfo,
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUxhbmd1YWdlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9zdGFuZGFsb25lL2Jyb3dzZXIvc3RhbmRhbG9uZUxhbmd1YWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0QmhHLDRCQUlDO0lBS0Qsb0NBSUM7SUFFRCxvREFHQztJQU1ELGdDQWFDO0lBT0Qsc0RBYUM7SUFLRCw0REFPQztJQXdRRCxrQ0FXQztJQXVCRCxzRUFZQztJQVFELDhDQVNDO0lBUUQsNERBUUM7SUFLRCw4REFHQztJQUtELHdEQUdDO0lBS0Qsc0VBR0M7SUFLRCxzRUFHQztJQUtELHNEQW9CQztJQUtELHdFQUdDO0lBS0QsOEVBR0M7SUFLRCxnRkFHQztJQUtELGdFQUdDO0lBS0Qsd0VBR0M7SUFLRCx3RUFHQztJQUtELDREQUdDO0lBS0QsZ0VBY0M7SUFLRCx3RkFHQztJQUtELGtHQUdDO0lBS0Qsb0ZBR0M7SUFLRCxvREFHQztJQUtELHdFQUdDO0lBS0Qsc0RBR0M7SUFLRCxvRUFHQztJQUtELGtFQUdDO0lBS0Qsd0VBR0M7SUFTRCx3RkFHQztJQVNELGtHQUdDO0lBS0QsOEVBR0M7SUFFRCxnRUFHQztJQUtELGdFQUdDO0lBOERELDREQWlFQztJQXZ4QkQ7O09BRUc7SUFDSCxTQUFnQixRQUFRLENBQUMsUUFBaUM7UUFDekQsd0RBQXdEO1FBQ3hELCtEQUErRDtRQUMvRCw2QkFBYSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLFlBQVk7UUFDM0IsSUFBSSxNQUFNLEdBQThCLEVBQUUsQ0FBQztRQUMzQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyw2QkFBYSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7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