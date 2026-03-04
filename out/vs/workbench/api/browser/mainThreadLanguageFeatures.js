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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/dataTransfer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/marshalling", "vs/base/common/objects", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/semanticTokensDto", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/api/browser/mainThreadBulkEdits", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/shared/dataTransferCache", "vs/workbench/contrib/callHierarchy/common/callHierarchy", "vs/workbench/contrib/search/common/search", "vs/workbench/contrib/typeHierarchy/common/typeHierarchy", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol"], function (require, exports, arrays_1, dataTransfer_1, errors_1, event_1, hierarchicalKind_1, lifecycle_1, map_1, marshalling_1, objects_1, uri_1, language_1, languageConfigurationRegistry_1, languageFeatures_1, semanticTokensDto_1, uriIdentity_1, mainThreadBulkEdits_1, typeConvert, dataTransferCache_1, callh, search, typeh, extHostCustomers_1, extHost_protocol_1) {
    "use strict";
    var MainThreadLanguageFeatures_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadMappedEditsProvider = exports.MainThreadDocumentRangeSemanticTokensProvider = exports.MainThreadDocumentSemanticTokensProvider = exports.MainThreadLanguageFeatures = void 0;
    let MainThreadLanguageFeatures = MainThreadLanguageFeatures_1 = class MainThreadLanguageFeatures extends lifecycle_1.Disposable {
        constructor(extHostContext, _languageService, _languageConfigurationService, _languageFeaturesService, _uriIdentService) {
            super();
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            this._languageFeaturesService = _languageFeaturesService;
            this._uriIdentService = _uriIdentService;
            this._registrations = this._register(new lifecycle_1.DisposableMap());
            // --- copy paste action provider
            this._pasteEditProviders = new Map();
            // --- document drop Edits
            this._documentOnDropEditProviders = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostLanguageFeatures);
            if (this._languageService) {
                const updateAllWordDefinitions = () => {
                    const wordDefinitionDtos = [];
                    for (const languageId of _languageService.getRegisteredLanguageIds()) {
                        const wordDefinition = this._languageConfigurationService.getLanguageConfiguration(languageId).getWordDefinition();
                        wordDefinitionDtos.push({
                            languageId: languageId,
                            regexSource: wordDefinition.source,
                            regexFlags: wordDefinition.flags
                        });
                    }
                    this._proxy.$setWordDefinitions(wordDefinitionDtos);
                };
                this._languageConfigurationService.onDidChange((e) => {
                    if (!e.languageId) {
                        updateAllWordDefinitions();
                    }
                    else {
                        const wordDefinition = this._languageConfigurationService.getLanguageConfiguration(e.languageId).getWordDefinition();
                        this._proxy.$setWordDefinitions([{
                                languageId: e.languageId,
                                regexSource: wordDefinition.source,
                                regexFlags: wordDefinition.flags
                            }]);
                    }
                });
                updateAllWordDefinitions();
            }
        }
        $unregister(handle) {
            this._registrations.deleteAndDispose(handle);
        }
        static _reviveLocationDto(data) {
            if (!data) {
                return data;
            }
            else if (Array.isArray(data)) {
                data.forEach(l => MainThreadLanguageFeatures_1._reviveLocationDto(l));
                return data;
            }
            else {
                data.uri = uri_1.URI.revive(data.uri);
                return data;
            }
        }
        static _reviveLocationLinkDto(data) {
            if (!data) {
                return data;
            }
            else if (Array.isArray(data)) {
                data.forEach(l => MainThreadLanguageFeatures_1._reviveLocationLinkDto(l));
                return data;
            }
            else {
                data.uri = uri_1.URI.revive(data.uri);
                return data;
            }
        }
        static _reviveWorkspaceSymbolDto(data) {
            if (!data) {
                return data;
            }
            else if (Array.isArray(data)) {
                data.forEach(MainThreadLanguageFeatures_1._reviveWorkspaceSymbolDto);
                return data;
            }
            else {
                data.location = MainThreadLanguageFeatures_1._reviveLocationDto(data.location);
                return data;
            }
        }
        static _reviveCodeActionDto(data, uriIdentService) {
            data?.forEach(code => (0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)(code.edit, uriIdentService));
            return data;
        }
        static _reviveLinkDTO(data) {
            if (data.url && typeof data.url !== 'string') {
                data.url = uri_1.URI.revive(data.url);
            }
            return data;
        }
        static _reviveCallHierarchyItemDto(data) {
            if (data) {
                data.uri = uri_1.URI.revive(data.uri);
            }
            return data;
        }
        static _reviveTypeHierarchyItemDto(data) {
            if (data) {
                data.uri = uri_1.URI.revive(data.uri);
            }
            return data;
        }
        //#endregion
        // --- outline
        $registerDocumentSymbolProvider(handle, selector, displayName) {
            this._registrations.set(handle, this._languageFeaturesService.documentSymbolProvider.register(selector, {
                displayName,
                provideDocumentSymbols: (model, token) => {
                    return this._proxy.$provideDocumentSymbols(handle, model.uri, token);
                }
            }));
        }
        // --- code lens
        $registerCodeLensSupport(handle, selector, eventHandle) {
            const provider = {
                provideCodeLenses: async (model, token) => {
                    const listDto = await this._proxy.$provideCodeLenses(handle, model.uri, token);
                    if (!listDto) {
                        return undefined;
                    }
                    return {
                        lenses: listDto.lenses,
                        dispose: () => listDto.cacheId && this._proxy.$releaseCodeLenses(handle, listDto.cacheId)
                    };
                },
                resolveCodeLens: async (model, codeLens, token) => {
                    const result = await this._proxy.$resolveCodeLens(handle, codeLens, token);
                    if (!result) {
                        return undefined;
                    }
                    return {
                        ...result,
                        range: model.validateRange(result.range),
                    };
                }
            };
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._registrations.set(eventHandle, emitter);
                provider.onDidChange = emitter.event;
            }
            this._registrations.set(handle, this._languageFeaturesService.codeLensProvider.register(selector, provider));
        }
        $emitCodeLensEvent(eventHandle, event) {
            const obj = this._registrations.get(eventHandle);
            if (obj instanceof event_1.Emitter) {
                obj.fire(event);
            }
        }
        // --- declaration
        $registerDefinitionSupport(handle, selector) {
            this._registrations.set(handle, this._languageFeaturesService.definitionProvider.register(selector, {
                provideDefinition: (model, position, token) => {
                    return this._proxy.$provideDefinition(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            }));
        }
        $registerDeclarationSupport(handle, selector) {
            this._registrations.set(handle, this._languageFeaturesService.declarationProvider.register(selector, {
                provideDeclaration: (model, position, token) => {
                    return this._proxy.$provideDeclaration(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            }));
        }
        $registerImplementationSupport(handle, selector) {
            this._registrations.set(handle, this._languageFeaturesService.implementationProvider.register(selector, {
                provideImplementation: (model, position, token) => {
                    return this._proxy.$provideImplementation(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            }));
        }
        $registerTypeDefinitionSupport(handle, selector) {
            this._registrations.set(handle, this._languageFeaturesService.typeDefinitionProvider.register(selector, {
                provideTypeDefinition: (model, position, token) => {
                    return this._proxy.$provideTypeDefinition(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            }));
        }
        // --- extra info
        $registerHoverProvider(handle, selector) {
            /*
            const hoverFinalizationRegistry = new FinalizationRegistry((hoverId: number) => {
                this._proxy.$releaseHover(handle, hoverId);
            });
            */
            this._registrations.set(handle, this._languageFeaturesService.hoverProvider.register(selector, {
                provideHover: async (model, position, token, context) => {
                    const serializedContext = {
                        verbosityRequest: context?.verbosityRequest ? {
                            action: context.verbosityRequest.action,
                            previousHover: { id: context.verbosityRequest.previousHover.id }
                        } : undefined,
                    };
                    const hover = await this._proxy.$provideHover(handle, model.uri, position, serializedContext, token);
                    // hoverFinalizationRegistry.register(hover, hover.id);
                    return hover;
                }
            }));
        }
        // --- debug hover
        $registerEvaluatableExpressionProvider(handle, selector) {
            this._registrations.set(handle, this._languageFeaturesService.evaluatableExpressionProvider.register(selector, {
                provideEvaluatableExpression: (model, position, token) => {
                    return this._proxy.$provideEvaluatableExpression(handle, model.uri, position, token);
                }
            }));
        }
        // --- inline values
        $registerInlineValuesProvider(handle, selector, eventHandle) {
            const provider = {
                provideInlineValues: (model, viewPort, context, token) => {
                    return this._proxy.$provideInlineValues(handle, model.uri, viewPort, context, token);
                }
            };
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._registrations.set(eventHandle, emitter);
                provider.onDidChangeInlineValues = emitter.event;
            }
            this._registrations.set(handle, this._languageFeaturesService.inlineValuesProvider.register(selector, provider));
        }
        $emitInlineValuesEvent(eventHandle, event) {
            const obj = this._registrations.get(eventHandle);
            if (obj instanceof event_1.Emitter) {
                obj.fire(event);
            }
        }
        // --- occurrences
        $registerDocumentHighlightProvider(handle, selector) {
            this._registrations.set(handle, this._languageFeaturesService.documentHighlightProvider.register(selector, {
                provideDocumentHighlights: (model, position, token) => {
                    return this._proxy.$provideDocumentHighlights(handle, model.uri, position, token);
                }
            }));
        }
        $registerMultiDocumentHighlightProvider(handle, selector) {
            this._registrations.set(handle, this._languageFeaturesService.multiDocumentHighlightProvider.register(selector, {
                selector: selector,
                provideMultiDocumentHighlights: (model, position, otherModels, token) => {
                    return this._proxy.$provideMultiDocumentHighlights(handle, model.uri, position, otherModels.map(model => model.uri), token).then(dto => {
                        if ((0, arrays_1.isFalsyOrEmpty)(dto)) {
                            return undefined;
                        }
                        const result = new map_1.ResourceMap();
                        dto?.forEach(value => {
                            // check if the URI exists already, if so, combine the highlights, otherwise create a new entry
                            const uri = uri_1.URI.revive(value.uri);
                            if (result.has(uri)) {
                                result.get(uri).push(...value.highlights);
                            }
                            else {
                                result.set(uri, value.highlights);
                            }
                        });
                        return result;
                    });
                }
            }));
        }
        // --- linked editing
        $registerLinkedEditingRangeProvider(handle, selector) {
            this._registrations.set(handle, this._languageFeaturesService.linkedEditingRangeProvider.register(selector, {
                provideLinkedEditingRanges: async (model, position, token) => {
                    const res = await this._proxy.$provideLinkedEditingRanges(handle, model.uri, position, token);
                    if (res) {
                        return {
                            ranges: res.ranges,
                            wordPattern: res.wordPattern ? MainThreadLanguageFeatures_1._reviveRegExp(res.wordPattern) : undefined
                        };
                    }
                    return undefined;
                }
            }));
        }
        // --- references
        $registerReferenceSupport(handle, selector) {
            this._registrations.set(handle, this._languageFeaturesService.referenceProvider.register(selector, {
                provideReferences: (model, position, context, token) => {
                    return this._proxy.$provideReferences(handle, model.uri, position, context, token).then(MainThreadLanguageFeatures_1._reviveLocationDto);
                }
            }));
        }
        // --- quick fix
        $registerQuickFixSupport(handle, selector, metadata, displayName, supportsResolve) {
            const provider = {
                provideCodeActions: async (model, rangeOrSelection, context, token) => {
                    const listDto = await this._proxy.$provideCodeActions(handle, model.uri, rangeOrSelection, context, token);
                    if (!listDto) {
                        return undefined;
                    }
                    return {
                        actions: MainThreadLanguageFeatures_1._reviveCodeActionDto(listDto.actions, this._uriIdentService),
                        dispose: () => {
                            if (typeof listDto.cacheId === 'number') {
                                this._proxy.$releaseCodeActions(handle, listDto.cacheId);
                            }
                        }
                    };
                },
                providedCodeActionKinds: metadata.providedKinds,
                documentation: metadata.documentation,
                displayName
            };
            if (supportsResolve) {
                provider.resolveCodeAction = async (codeAction, token) => {
                    const resolved = await this._proxy.$resolveCodeAction(handle, codeAction.cacheId, token);
                    if (resolved.edit) {
                        codeAction.edit = (0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)(resolved.edit, this._uriIdentService);
                    }
                    if (resolved.command) {
                        codeAction.command = resolved.command;
                    }
                    return codeAction;
                };
            }
            this._registrations.set(handle, this._languageFeaturesService.codeActionProvider.register(selector, provider));
        }
        $registerPasteEditProvider(handle, selector, metadata) {
            const provider = new MainThreadPasteEditProvider(handle, this._proxy, metadata, this._uriIdentService);
            this._pasteEditProviders.set(handle, provider);
            this._registrations.set(handle, (0, lifecycle_1.combinedDisposable)(this._languageFeaturesService.documentPasteEditProvider.register(selector, provider), (0, lifecycle_1.toDisposable)(() => this._pasteEditProviders.delete(handle))));
        }
        $resolvePasteFileData(handle, requestId, dataId) {
            const provider = this._pasteEditProviders.get(handle);
            if (!provider) {
                throw new Error('Could not find provider');
            }
            return provider.resolveFileData(requestId, dataId);
        }
        // --- formatting
        $registerDocumentFormattingSupport(handle, selector, extensionId, displayName) {
            this._registrations.set(handle, this._languageFeaturesService.documentFormattingEditProvider.register(selector, {
                extensionId,
                displayName,
                provideDocumentFormattingEdits: (model, options, token) => {
                    return this._proxy.$provideDocumentFormattingEdits(handle, model.uri, options, token);
                }
            }));
        }
        $registerRangeFormattingSupport(handle, selector, extensionId, displayName, supportsRanges) {
            this._registrations.set(handle, this._languageFeaturesService.documentRangeFormattingEditProvider.register(selector, {
                extensionId,
                displayName,
                provideDocumentRangeFormattingEdits: (model, range, options, token) => {
                    return this._proxy.$provideDocumentRangeFormattingEdits(handle, model.uri, range, options, token);
                },
                provideDocumentRangesFormattingEdits: !supportsRanges
                    ? undefined
                    : (model, ranges, options, token) => {
                        return this._proxy.$provideDocumentRangesFormattingEdits(handle, model.uri, ranges, options, token);
                    },
            }));
        }
        $registerOnTypeFormattingSupport(handle, selector, autoFormatTriggerCharacters, extensionId) {
            this._registrations.set(handle, this._languageFeaturesService.onTypeFormattingEditProvider.register(selector, {
                extensionId,
                autoFormatTriggerCharacters,
                provideOnTypeFormattingEdits: (model, position, ch, options, token) => {
                    return this._proxy.$provideOnTypeFormattingEdits(handle, model.uri, position, ch, options, token);
                }
            }));
        }
        // --- navigate type
        $registerNavigateTypeSupport(handle, supportsResolve) {
            let lastResultId;
            const provider = {
                provideWorkspaceSymbols: async (search, token) => {
                    const result = await this._proxy.$provideWorkspaceSymbols(handle, search, token);
                    if (lastResultId !== undefined) {
                        this._proxy.$releaseWorkspaceSymbols(handle, lastResultId);
                    }
                    lastResultId = result.cacheId;
                    return MainThreadLanguageFeatures_1._reviveWorkspaceSymbolDto(result.symbols);
                }
            };
            if (supportsResolve) {
                provider.resolveWorkspaceSymbol = async (item, token) => {
                    const resolvedItem = await this._proxy.$resolveWorkspaceSymbol(handle, item, token);
                    return resolvedItem && MainThreadLanguageFeatures_1._reviveWorkspaceSymbolDto(resolvedItem);
                };
            }
            this._registrations.set(handle, search.WorkspaceSymbolProviderRegistry.register(provider));
        }
        // --- rename
        $registerRenameSupport(handle, selector, supportResolveLocation) {
            this._registrations.set(handle, this._languageFeaturesService.renameProvider.register(selector, {
                provideRenameEdits: (model, position, newName, token) => {
                    return this._proxy.$provideRenameEdits(handle, model.uri, position, newName, token).then(data => (0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)(data, this._uriIdentService));
                },
                resolveRenameLocation: supportResolveLocation
                    ? (model, position, token) => this._proxy.$resolveRenameLocation(handle, model.uri, position, token)
                    : undefined
            }));
        }
        $registerNewSymbolNamesProvider(handle, selector) {
            this._registrations.set(handle, this._languageFeaturesService.newSymbolNamesProvider.register(selector, {
                supportsAutomaticNewSymbolNamesTriggerKind: this._proxy.$supportsAutomaticNewSymbolNamesTriggerKind(handle),
                provideNewSymbolNames: (model, range, triggerKind, token) => {
                    return this._proxy.$provideNewSymbolNames(handle, model.uri, range, triggerKind, token);
                }
            }));
        }
        // --- semantic tokens
        $registerDocumentSemanticTokensProvider(handle, selector, legend, eventHandle) {
            let event = undefined;
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._registrations.set(eventHandle, emitter);
                event = emitter.event;
            }
            this._registrations.set(handle, this._languageFeaturesService.documentSemanticTokensProvider.register(selector, new MainThreadDocumentSemanticTokensProvider(this._proxy, handle, legend, event)));
        }
        $emitDocumentSemanticTokensEvent(eventHandle) {
            const obj = this._registrations.get(eventHandle);
            if (obj instanceof event_1.Emitter) {
                obj.fire(undefined);
            }
        }
        $registerDocumentRangeSemanticTokensProvider(handle, selector, legend) {
            this._registrations.set(handle, this._languageFeaturesService.documentRangeSemanticTokensProvider.register(selector, new MainThreadDocumentRangeSemanticTokensProvider(this._proxy, handle, legend)));
        }
        // --- suggest
        static _inflateSuggestDto(defaultRange, data, extensionId) {
            const label = data["a" /* ISuggestDataDtoField.label */];
            const commandId = data["o" /* ISuggestDataDtoField.commandId */];
            const commandIdent = data["n" /* ISuggestDataDtoField.commandIdent */];
            const commitChars = data["k" /* ISuggestDataDtoField.commitCharacters */];
            return {
                label,
                extensionId,
                kind: data["b" /* ISuggestDataDtoField.kind */] ?? 9 /* languages.CompletionItemKind.Property */,
                tags: data["m" /* ISuggestDataDtoField.kindModifier */],
                detail: data["c" /* ISuggestDataDtoField.detail */],
                documentation: data["d" /* ISuggestDataDtoField.documentation */],
                sortText: data["e" /* ISuggestDataDtoField.sortText */],
                filterText: data["f" /* ISuggestDataDtoField.filterText */],
                preselect: data["g" /* ISuggestDataDtoField.preselect */],
                insertText: data["h" /* ISuggestDataDtoField.insertText */] ?? (typeof label === 'string' ? label : label.label),
                range: data["j" /* ISuggestDataDtoField.range */] ?? defaultRange,
                insertTextRules: data["i" /* ISuggestDataDtoField.insertTextRules */],
                commitCharacters: commitChars ? Array.from(commitChars) : undefined,
                additionalTextEdits: data["l" /* ISuggestDataDtoField.additionalTextEdits */],
                command: commandId ? {
                    $ident: commandIdent,
                    id: commandId,
                    title: '',
                    arguments: commandIdent ? [commandIdent] : data["p" /* ISuggestDataDtoField.commandArguments */], // Automatically fill in ident as first argument
                } : undefined,
                // not-standard
                _id: data.x,
            };
        }
        $registerCompletionsProvider(handle, selector, triggerCharacters, supportsResolveDetails, extensionId) {
            const provider = {
                triggerCharacters,
                _debugDisplayName: `${extensionId.value}(${triggerCharacters.join('')})`,
                provideCompletionItems: async (model, position, context, token) => {
                    const result = await this._proxy.$provideCompletionItems(handle, model.uri, position, context, token);
                    if (!result) {
                        return result;
                    }
                    return {
                        suggestions: result["b" /* ISuggestResultDtoField.completions */].map(d => MainThreadLanguageFeatures_1._inflateSuggestDto(result["a" /* ISuggestResultDtoField.defaultRanges */], d, extensionId)),
                        incomplete: result["c" /* ISuggestResultDtoField.isIncomplete */] || false,
                        duration: result["d" /* ISuggestResultDtoField.duration */],
                        dispose: () => {
                            if (typeof result.x === 'number') {
                                this._proxy.$releaseCompletionItems(handle, result.x);
                            }
                        }
                    };
                }
            };
            if (supportsResolveDetails) {
                provider.resolveCompletionItem = (suggestion, token) => {
                    return this._proxy.$resolveCompletionItem(handle, suggestion._id, token).then(result => {
                        if (!result) {
                            return suggestion;
                        }
                        const newSuggestion = MainThreadLanguageFeatures_1._inflateSuggestDto(suggestion.range, result, extensionId);
                        return (0, objects_1.mixin)(suggestion, newSuggestion, true);
                    });
                };
            }
            this._registrations.set(handle, this._languageFeaturesService.completionProvider.register(selector, provider));
        }
        $registerInlineCompletionsSupport(handle, selector, supportsHandleEvents, extensionId, yieldsToExtensionIds) {
            const provider = {
                provideInlineCompletions: async (model, position, context, token) => {
                    return this._proxy.$provideInlineCompletions(handle, model.uri, position, context, token);
                },
                handleItemDidShow: async (completions, item, updatedInsertText) => {
                    if (supportsHandleEvents) {
                        await this._proxy.$handleInlineCompletionDidShow(handle, completions.pid, item.idx, updatedInsertText);
                    }
                },
                handlePartialAccept: async (completions, item, acceptedCharacters, info) => {
                    if (supportsHandleEvents) {
                        await this._proxy.$handleInlineCompletionPartialAccept(handle, completions.pid, item.idx, acceptedCharacters, info);
                    }
                },
                freeInlineCompletions: (completions) => {
                    this._proxy.$freeInlineCompletionsList(handle, completions.pid);
                },
                groupId: extensionId,
                yieldsToGroupIds: yieldsToExtensionIds,
                toString() {
                    return `InlineCompletionsProvider(${extensionId})`;
                }
            };
            this._registrations.set(handle, this._languageFeaturesService.inlineCompletionsProvider.register(selector, provider));
        }
        $registerInlineEditProvider(handle, selector, extensionId) {
            const provider = {
                provideInlineEdit: async (model, context, token) => {
                    return this._proxy.$provideInlineEdit(handle, model.uri, context, token);
                },
                freeInlineEdit: (edit) => {
                    this._proxy.$freeInlineEdit(handle, edit.pid);
                }
            };
            this._registrations.set(handle, this._languageFeaturesService.inlineEditProvider.register(selector, provider));
        }
        // --- parameter hints
        $registerSignatureHelpProvider(handle, selector, metadata) {
            this._registrations.set(handle, this._languageFeaturesService.signatureHelpProvider.register(selector, {
                signatureHelpTriggerCharacters: metadata.triggerCharacters,
                signatureHelpRetriggerCharacters: metadata.retriggerCharacters,
                provideSignatureHelp: async (model, position, token, context) => {
                    const result = await this._proxy.$provideSignatureHelp(handle, model.uri, position, context, token);
                    if (!result) {
                        return undefined;
                    }
                    return {
                        value: result,
                        dispose: () => {
                            this._proxy.$releaseSignatureHelp(handle, result.id);
                        }
                    };
                }
            }));
        }
        // --- inline hints
        $registerInlayHintsProvider(handle, selector, supportsResolve, eventHandle, displayName) {
            const provider = {
                displayName,
                provideInlayHints: async (model, range, token) => {
                    const result = await this._proxy.$provideInlayHints(handle, model.uri, range, token);
                    if (!result) {
                        return;
                    }
                    return {
                        hints: (0, marshalling_1.revive)(result.hints),
                        dispose: () => {
                            if (result.cacheId) {
                                this._proxy.$releaseInlayHints(handle, result.cacheId);
                            }
                        }
                    };
                }
            };
            if (supportsResolve) {
                provider.resolveInlayHint = async (hint, token) => {
                    const dto = hint;
                    if (!dto.cacheId) {
                        return hint;
                    }
                    const result = await this._proxy.$resolveInlayHint(handle, dto.cacheId, token);
                    if (token.isCancellationRequested) {
                        throw new errors_1.CancellationError();
                    }
                    if (!result) {
                        return hint;
                    }
                    return {
                        ...hint,
                        tooltip: result.tooltip,
                        label: (0, marshalling_1.revive)(result.label),
                        textEdits: result.textEdits
                    };
                };
            }
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._registrations.set(eventHandle, emitter);
                provider.onDidChangeInlayHints = emitter.event;
            }
            this._registrations.set(handle, this._languageFeaturesService.inlayHintsProvider.register(selector, provider));
        }
        $emitInlayHintsEvent(eventHandle) {
            const obj = this._registrations.get(eventHandle);
            if (obj instanceof event_1.Emitter) {
                obj.fire(undefined);
            }
        }
        // --- links
        $registerDocumentLinkProvider(handle, selector, supportsResolve) {
            const provider = {
                provideLinks: (model, token) => {
                    return this._proxy.$provideDocumentLinks(handle, model.uri, token).then(dto => {
                        if (!dto) {
                            return undefined;
                        }
                        return {
                            links: dto.links.map(MainThreadLanguageFeatures_1._reviveLinkDTO),
                            dispose: () => {
                                if (typeof dto.cacheId === 'number') {
                                    this._proxy.$releaseDocumentLinks(handle, dto.cacheId);
                                }
                            }
                        };
                    });
                }
            };
            if (supportsResolve) {
                provider.resolveLink = (link, token) => {
                    const dto = link;
                    if (!dto.cacheId) {
                        return link;
                    }
                    return this._proxy.$resolveDocumentLink(handle, dto.cacheId, token).then(obj => {
                        return obj && MainThreadLanguageFeatures_1._reviveLinkDTO(obj);
                    });
                };
            }
            this._registrations.set(handle, this._languageFeaturesService.linkProvider.register(selector, provider));
        }
        // --- colors
        $registerDocumentColorProvider(handle, selector) {
            const proxy = this._proxy;
            this._registrations.set(handle, this._languageFeaturesService.colorProvider.register(selector, {
                provideDocumentColors: (model, token) => {
                    return proxy.$provideDocumentColors(handle, model.uri, token)
                        .then(documentColors => {
                        return documentColors.map(documentColor => {
                            const [red, green, blue, alpha] = documentColor.color;
                            const color = {
                                red: red,
                                green: green,
                                blue: blue,
                                alpha
                            };
                            return {
                                color,
                                range: documentColor.range
                            };
                        });
                    });
                },
                provideColorPresentations: (model, colorInfo, token) => {
                    return proxy.$provideColorPresentations(handle, model.uri, {
                        color: [colorInfo.color.red, colorInfo.color.green, colorInfo.color.blue, colorInfo.color.alpha],
                        range: colorInfo.range
                    }, token);
                }
            }));
        }
        // --- folding
        $registerFoldingRangeProvider(handle, selector, extensionId, eventHandle) {
            const provider = {
                id: extensionId.value,
                provideFoldingRanges: (model, context, token) => {
                    return this._proxy.$provideFoldingRanges(handle, model.uri, context, token);
                }
            };
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._registrations.set(eventHandle, emitter);
                provider.onDidChange = emitter.event;
            }
            this._registrations.set(handle, this._languageFeaturesService.foldingRangeProvider.register(selector, provider));
        }
        $emitFoldingRangeEvent(eventHandle, event) {
            const obj = this._registrations.get(eventHandle);
            if (obj instanceof event_1.Emitter) {
                obj.fire(event);
            }
        }
        // -- smart select
        $registerSelectionRangeProvider(handle, selector) {
            this._registrations.set(handle, this._languageFeaturesService.selectionRangeProvider.register(selector, {
                provideSelectionRanges: (model, positions, token) => {
                    return this._proxy.$provideSelectionRanges(handle, model.uri, positions, token);
                }
            }));
        }
        // --- call hierarchy
        $registerCallHierarchyProvider(handle, selector) {
            this._registrations.set(handle, callh.CallHierarchyProviderRegistry.register(selector, {
                prepareCallHierarchy: async (document, position, token) => {
                    const items = await this._proxy.$prepareCallHierarchy(handle, document.uri, position, token);
                    if (!items || items.length === 0) {
                        return undefined;
                    }
                    return {
                        dispose: () => {
                            for (const item of items) {
                                this._proxy.$releaseCallHierarchy(handle, item._sessionId);
                            }
                        },
                        roots: items.map(MainThreadLanguageFeatures_1._reviveCallHierarchyItemDto)
                    };
                },
                provideOutgoingCalls: async (item, token) => {
                    const outgoing = await this._proxy.$provideCallHierarchyOutgoingCalls(handle, item._sessionId, item._itemId, token);
                    if (!outgoing) {
                        return outgoing;
                    }
                    outgoing.forEach(value => {
                        value.to = MainThreadLanguageFeatures_1._reviveCallHierarchyItemDto(value.to);
                    });
                    return outgoing;
                },
                provideIncomingCalls: async (item, token) => {
                    const incoming = await this._proxy.$provideCallHierarchyIncomingCalls(handle, item._sessionId, item._itemId, token);
                    if (!incoming) {
                        return incoming;
                    }
                    incoming.forEach(value => {
                        value.from = MainThreadLanguageFeatures_1._reviveCallHierarchyItemDto(value.from);
                    });
                    return incoming;
                }
            }));
        }
        // --- configuration
        static _reviveRegExp(regExp) {
            return new RegExp(regExp.pattern, regExp.flags);
        }
        static _reviveIndentationRule(indentationRule) {
            return {
                decreaseIndentPattern: MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.decreaseIndentPattern),
                increaseIndentPattern: MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.increaseIndentPattern),
                indentNextLinePattern: indentationRule.indentNextLinePattern ? MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.indentNextLinePattern) : undefined,
                unIndentedLinePattern: indentationRule.unIndentedLinePattern ? MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.unIndentedLinePattern) : undefined,
            };
        }
        static _reviveOnEnterRule(onEnterRule) {
            return {
                beforeText: MainThreadLanguageFeatures_1._reviveRegExp(onEnterRule.beforeText),
                afterText: onEnterRule.afterText ? MainThreadLanguageFeatures_1._reviveRegExp(onEnterRule.afterText) : undefined,
                previousLineText: onEnterRule.previousLineText ? MainThreadLanguageFeatures_1._reviveRegExp(onEnterRule.previousLineText) : undefined,
                action: onEnterRule.action
            };
        }
        static _reviveOnEnterRules(onEnterRules) {
            return onEnterRules.map(MainThreadLanguageFeatures_1._reviveOnEnterRule);
        }
        $setLanguageConfiguration(handle, languageId, _configuration) {
            const configuration = {
                comments: _configuration.comments,
                brackets: _configuration.brackets,
                wordPattern: _configuration.wordPattern ? MainThreadLanguageFeatures_1._reviveRegExp(_configuration.wordPattern) : undefined,
                indentationRules: _configuration.indentationRules ? MainThreadLanguageFeatures_1._reviveIndentationRule(_configuration.indentationRules) : undefined,
                onEnterRules: _configuration.onEnterRules ? MainThreadLanguageFeatures_1._reviveOnEnterRules(_configuration.onEnterRules) : undefined,
                autoClosingPairs: undefined,
                surroundingPairs: undefined,
                __electricCharacterSupport: undefined
            };
            if (_configuration.autoClosingPairs) {
                configuration.autoClosingPairs = _configuration.autoClosingPairs;
            }
            else if (_configuration.__characterPairSupport) {
                // backwards compatibility
                configuration.autoClosingPairs = _configuration.__characterPairSupport.autoClosingPairs;
            }
            if (_configuration.__electricCharacterSupport && _configuration.__electricCharacterSupport.docComment) {
                configuration.__electricCharacterSupport = {
                    docComment: {
                        open: _configuration.__electricCharacterSupport.docComment.open,
                        close: _configuration.__electricCharacterSupport.docComment.close
                    }
                };
            }
            if (this._languageService.isRegisteredLanguageId(languageId)) {
                this._registrations.set(handle, this._languageConfigurationService.register(languageId, configuration, 100));
            }
        }
        // --- type hierarchy
        $registerTypeHierarchyProvider(handle, selector) {
            this._registrations.set(handle, typeh.TypeHierarchyProviderRegistry.register(selector, {
                prepareTypeHierarchy: async (document, position, token) => {
                    const items = await this._proxy.$prepareTypeHierarchy(handle, document.uri, position, token);
                    if (!items) {
                        return undefined;
                    }
                    return {
                        dispose: () => {
                            for (const item of items) {
                                this._proxy.$releaseTypeHierarchy(handle, item._sessionId);
                            }
                        },
                        roots: items.map(MainThreadLanguageFeatures_1._reviveTypeHierarchyItemDto)
                    };
                },
                provideSupertypes: async (item, token) => {
                    const supertypes = await this._proxy.$provideTypeHierarchySupertypes(handle, item._sessionId, item._itemId, token);
                    if (!supertypes) {
                        return supertypes;
                    }
                    return supertypes.map(MainThreadLanguageFeatures_1._reviveTypeHierarchyItemDto);
                },
                provideSubtypes: async (item, token) => {
                    const subtypes = await this._proxy.$provideTypeHierarchySubtypes(handle, item._sessionId, item._itemId, token);
                    if (!subtypes) {
                        return subtypes;
                    }
                    return subtypes.map(MainThreadLanguageFeatures_1._reviveTypeHierarchyItemDto);
                }
            }));
        }
        $registerDocumentOnDropEditProvider(handle, selector, metadata) {
            const provider = new MainThreadDocumentOnDropEditProvider(handle, this._proxy, metadata, this._uriIdentService);
            this._documentOnDropEditProviders.set(handle, provider);
            this._registrations.set(handle, (0, lifecycle_1.combinedDisposable)(this._languageFeaturesService.documentDropEditProvider.register(selector, provider), (0, lifecycle_1.toDisposable)(() => this._documentOnDropEditProviders.delete(handle))));
        }
        async $resolveDocumentOnDropFileData(handle, requestId, dataId) {
            const provider = this._documentOnDropEditProviders.get(handle);
            if (!provider) {
                throw new Error('Could not find provider');
            }
            return provider.resolveDocumentOnDropFileData(requestId, dataId);
        }
        // --- mapped edits
        $registerMappedEditsProvider(handle, selector) {
            const provider = new MainThreadMappedEditsProvider(handle, this._proxy, this._uriIdentService);
            this._registrations.set(handle, this._languageFeaturesService.mappedEditsProvider.register(selector, provider));
        }
    };
    exports.MainThreadLanguageFeatures = MainThreadLanguageFeatures;
    exports.MainThreadLanguageFeatures = MainThreadLanguageFeatures = MainThreadLanguageFeatures_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadLanguageFeatures),
        __param(1, language_1.ILanguageService),
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], MainThreadLanguageFeatures);
    let MainThreadPasteEditProvider = class MainThreadPasteEditProvider {
        constructor(_handle, _proxy, metadata, _uriIdentService) {
            this._handle = _handle;
            this._proxy = _proxy;
            this._uriIdentService = _uriIdentService;
            this.dataTransfers = new dataTransferCache_1.DataTransferFileCache();
            this.copyMimeTypes = metadata.copyMimeTypes;
            this.pasteMimeTypes = metadata.pasteMimeTypes;
            this.providedPasteEditKinds = metadata.providedPasteEditKinds?.map(kind => new hierarchicalKind_1.HierarchicalKind(kind));
            if (metadata.supportsCopy) {
                this.prepareDocumentPaste = async (model, selections, dataTransfer, token) => {
                    const dataTransferDto = await typeConvert.DataTransfer.from(dataTransfer);
                    if (token.isCancellationRequested) {
                        return undefined;
                    }
                    const newDataTransfer = await this._proxy.$prepareDocumentPaste(_handle, model.uri, selections, dataTransferDto, token);
                    if (!newDataTransfer) {
                        return undefined;
                    }
                    const dataTransferOut = new dataTransfer_1.VSDataTransfer();
                    for (const [type, item] of newDataTransfer.items) {
                        dataTransferOut.replace(type, (0, dataTransfer_1.createStringDataTransferItem)(item.asString));
                    }
                    return dataTransferOut;
                };
            }
            if (metadata.supportsPaste) {
                this.provideDocumentPasteEdits = async (model, selections, dataTransfer, context, token) => {
                    const request = this.dataTransfers.add(dataTransfer);
                    try {
                        const dataTransferDto = await typeConvert.DataTransfer.from(dataTransfer);
                        if (token.isCancellationRequested) {
                            return;
                        }
                        const edits = await this._proxy.$providePasteEdits(this._handle, request.id, model.uri, selections, dataTransferDto, {
                            only: context.only?.value,
                            triggerKind: context.triggerKind,
                        }, token);
                        if (!edits) {
                            return;
                        }
                        return {
                            edits: edits.map((edit) => {
                                return {
                                    ...edit,
                                    kind: edit.kind ? new hierarchicalKind_1.HierarchicalKind(edit.kind.value) : new hierarchicalKind_1.HierarchicalKind(''),
                                    yieldTo: edit.yieldTo?.map(x => ({ kind: new hierarchicalKind_1.HierarchicalKind(x) })),
                                    additionalEdit: edit.additionalEdit ? (0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)(edit.additionalEdit, this._uriIdentService, dataId => this.resolveFileData(request.id, dataId)) : undefined,
                                };
                            }),
                            dispose: () => {
                                this._proxy.$releasePasteEdits(this._handle, request.id);
                            },
                        };
                    }
                    finally {
                        request.dispose();
                    }
                };
            }
            if (metadata.supportsResolve) {
                this.resolveDocumentPasteEdit = async (edit, token) => {
                    const resolved = await this._proxy.$resolvePasteEdit(this._handle, edit._cacheId, token);
                    if (resolved.additionalEdit) {
                        edit.additionalEdit = (0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)(resolved.additionalEdit, this._uriIdentService);
                    }
                    return edit;
                };
            }
        }
        resolveFileData(requestId, dataId) {
            return this.dataTransfers.resolveFileData(requestId, dataId);
        }
    };
    MainThreadPasteEditProvider = __decorate([
        __param(3, uriIdentity_1.IUriIdentityService)
    ], MainThreadPasteEditProvider);
    let MainThreadDocumentOnDropEditProvider = class MainThreadDocumentOnDropEditProvider {
        constructor(_handle, _proxy, metadata, _uriIdentService) {
            this._handle = _handle;
            this._proxy = _proxy;
            this._uriIdentService = _uriIdentService;
            this.dataTransfers = new dataTransferCache_1.DataTransferFileCache();
            this.dropMimeTypes = metadata?.dropMimeTypes ?? ['*/*'];
            if (metadata?.supportsResolve) {
                this.resolveDocumentDropEdit = async (edit, token) => {
                    const resolved = await this._proxy.$resolvePasteEdit(this._handle, edit._cacheId, token);
                    if (resolved.additionalEdit) {
                        edit.additionalEdit = (0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)(resolved.additionalEdit, this._uriIdentService);
                    }
                    return edit;
                };
            }
        }
        async provideDocumentDropEdits(model, position, dataTransfer, token) {
            const request = this.dataTransfers.add(dataTransfer);
            try {
                const dataTransferDto = await typeConvert.DataTransfer.from(dataTransfer);
                if (token.isCancellationRequested) {
                    return;
                }
                const edits = await this._proxy.$provideDocumentOnDropEdits(this._handle, request.id, model.uri, position, dataTransferDto, token);
                if (!edits) {
                    return;
                }
                return edits.map(edit => {
                    return {
                        ...edit,
                        yieldTo: edit.yieldTo?.map(x => ({ kind: new hierarchicalKind_1.HierarchicalKind(x) })),
                        kind: edit.kind ? new hierarchicalKind_1.HierarchicalKind(edit.kind) : undefined,
                        additionalEdit: (0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)(edit.additionalEdit, this._uriIdentService, dataId => this.resolveDocumentOnDropFileData(request.id, dataId)),
                    };
                });
            }
            finally {
                request.dispose();
            }
        }
        resolveDocumentOnDropFileData(requestId, dataId) {
            return this.dataTransfers.resolveFileData(requestId, dataId);
        }
    };
    MainThreadDocumentOnDropEditProvider = __decorate([
        __param(3, uriIdentity_1.IUriIdentityService)
    ], MainThreadDocumentOnDropEditProvider);
    class MainThreadDocumentSemanticTokensProvider {
        constructor(_proxy, _handle, _legend, onDidChange) {
            this._proxy = _proxy;
            this._handle = _handle;
            this._legend = _legend;
            this.onDidChange = onDidChange;
        }
        releaseDocumentSemanticTokens(resultId) {
            if (resultId) {
                this._proxy.$releaseDocumentSemanticTokens(this._handle, parseInt(resultId, 10));
            }
        }
        getLegend() {
            return this._legend;
        }
        async provideDocumentSemanticTokens(model, lastResultId, token) {
            const nLastResultId = lastResultId ? parseInt(lastResultId, 10) : 0;
            const encodedDto = await this._proxy.$provideDocumentSemanticTokens(this._handle, model.uri, nLastResultId, token);
            if (!encodedDto) {
                return null;
            }
            if (token.isCancellationRequested) {
                return null;
            }
            const dto = (0, semanticTokensDto_1.decodeSemanticTokensDto)(encodedDto);
            if (dto.type === 'full') {
                return {
                    resultId: String(dto.id),
                    data: dto.data
                };
            }
            return {
                resultId: String(dto.id),
                edits: dto.deltas
            };
        }
    }
    exports.MainThreadDocumentSemanticTokensProvider = MainThreadDocumentSemanticTokensProvider;
    class MainThreadDocumentRangeSemanticTokensProvider {
        constructor(_proxy, _handle, _legend) {
            this._proxy = _proxy;
            this._handle = _handle;
            this._legend = _legend;
        }
        getLegend() {
            return this._legend;
        }
        async provideDocumentRangeSemanticTokens(model, range, token) {
            const encodedDto = await this._proxy.$provideDocumentRangeSemanticTokens(this._handle, model.uri, range, token);
            if (!encodedDto) {
                return null;
            }
            if (token.isCancellationRequested) {
                return null;
            }
            const dto = (0, semanticTokensDto_1.decodeSemanticTokensDto)(encodedDto);
            if (dto.type === 'full') {
                return {
                    resultId: String(dto.id),
                    data: dto.data
                };
            }
            throw new Error(`Unexpected`);
        }
    }
    exports.MainThreadDocumentRangeSemanticTokensProvider = MainThreadDocumentRangeSemanticTokensProvider;
    class MainThreadMappedEditsProvider {
        constructor(_handle, _proxy, _uriService) {
            this._handle = _handle;
            this._proxy = _proxy;
            this._uriService = _uriService;
        }
        async provideMappedEdits(document, codeBlocks, context, token) {
            const res = await this._proxy.$provideMappedEdits(this._handle, document.uri, codeBlocks, context, token);
            return res ? (0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)(res, this._uriService) : null;
        }
    }
    exports.MainThreadMappedEditsProvider = MainThreadMappedEditsProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZExhbmd1YWdlRmVhdHVyZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZExhbmd1YWdlRmVhdHVyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFDekYsSUFBTSwwQkFBMEIsa0NBQWhDLE1BQU0sMEJBQTJCLFNBQVEsc0JBQVU7UUFLekQsWUFDQyxjQUErQixFQUNiLGdCQUFtRCxFQUN0Qyw2QkFBNkUsRUFDbEYsd0JBQW1FLEVBQ3hFLGdCQUFzRDtZQUUzRSxLQUFLLEVBQUUsQ0FBQztZQUwyQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ3JCLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBK0I7WUFDakUsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUN2RCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQXFCO1lBUDNELG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFhLEVBQVUsQ0FBQyxDQUFDO1lBK1c5RSxpQ0FBaUM7WUFFaEIsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQXVDLENBQUM7WUFvakJ0RiwwQkFBMEI7WUFFVCxpQ0FBNEIsR0FBRyxJQUFJLEdBQUcsRUFBZ0QsQ0FBQztZQTU1QnZHLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFFOUUsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSx3QkFBd0IsR0FBRyxHQUFHLEVBQUU7b0JBQ3JDLE1BQU0sa0JBQWtCLEdBQWlDLEVBQUUsQ0FBQztvQkFDNUQsS0FBSyxNQUFNLFVBQVUsSUFBSSxnQkFBZ0Is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