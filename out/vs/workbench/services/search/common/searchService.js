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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/stopwatch", "vs/base/common/types", "vs/editor/common/services/model", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchHelpers"], function (require, exports, arrays, async_1, errors_1, lifecycle_1, map_1, network_1, stopwatch_1, types_1, model_1, files_1, log_1, telemetry_1, uriIdentity_1, editor_1, editorService_1, extensions_1, search_1, searchHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchService = void 0;
    let SearchService = class SearchService extends lifecycle_1.Disposable {
        constructor(modelService, editorService, telemetryService, logService, extensionService, fileService, uriIdentityService) {
            super();
            this.modelService = modelService;
            this.editorService = editorService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.extensionService = extensionService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.fileSearchProviders = new Map();
            this.textSearchProviders = new Map();
            this.aiTextSearchProviders = new Map();
            this.deferredFileSearchesByScheme = new Map();
            this.deferredTextSearchesByScheme = new Map();
            this.deferredAITextSearchesByScheme = new Map();
            this.loggedSchemesMissingProviders = new Set();
        }
        registerSearchResultProvider(scheme, type, provider) {
            let list;
            let deferredMap;
            if (type === 0 /* SearchProviderType.file */) {
                list = this.fileSearchProviders;
                deferredMap = this.deferredFileSearchesByScheme;
            }
            else if (type === 1 /* SearchProviderType.text */) {
                list = this.textSearchProviders;
                deferredMap = this.deferredTextSearchesByScheme;
            }
            else if (type === 2 /* SearchProviderType.aiText */) {
                list = this.aiTextSearchProviders;
                deferredMap = this.deferredAITextSearchesByScheme;
            }
            else {
                throw new Error('Unknown SearchProviderType');
            }
            list.set(scheme, provider);
            if (deferredMap.has(scheme)) {
                deferredMap.get(scheme).complete(provider);
                deferredMap.delete(scheme);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                list.delete(scheme);
            });
        }
        async textSearch(query, token, onProgress) {
            const results = this.textSearchSplitSyncAsync(query, token, onProgress);
            const openEditorResults = results.syncResults;
            const otherResults = await results.asyncResults;
            return {
                limitHit: otherResults.limitHit || openEditorResults.limitHit,
                results: [...otherResults.results, ...openEditorResults.results],
                messages: [...otherResults.messages, ...openEditorResults.messages]
            };
        }
        async aiTextSearch(query, token, onProgress) {
            const onProviderProgress = (progress) => {
                // Match
                if (onProgress) { // don't override open editor results
                    if ((0, search_1.isFileMatch)(progress)) {
                        onProgress(progress);
                    }
                    else {
                        onProgress(progress);
                    }
                }
                if ((0, search_1.isProgressMessage)(progress)) {
                    this.logService.debug('SearchService#search', progress.message);
                }
            };
            return this.doSearch(query, token, onProviderProgress);
        }
        textSearchSplitSyncAsync(query, token, onProgress, notebookFilesToIgnore, asyncNotebookFilesToIgnore) {
            // Get open editor results from dirty/untitled
            const openEditorResults = this.getOpenEditorResults(query);
            if (onProgress) {
                arrays.coalesce([...openEditorResults.results.values()]).filter(e => !(notebookFilesToIgnore && notebookFilesToIgnore.has(e.resource))).forEach(onProgress);
            }
            const syncResults = {
                results: arrays.coalesce([...openEditorResults.results.values()]),
                limitHit: openEditorResults.limitHit ?? false,
                messages: []
            };
            const getAsyncResults = async () => {
                const resolvedAsyncNotebookFilesToIgnore = await asyncNotebookFilesToIgnore ?? new map_1.ResourceSet();
                const onProviderProgress = (progress) => {
                    if ((0, search_1.isFileMatch)(progress)) {
                        // Match
                        if (!openEditorResults.results.has(progress.resource) && !resolvedAsyncNotebookFilesToIgnore.has(progress.resource) && onProgress) { // don't override open editor results
                            onProgress(progress);
                        }
                    }
                    else if (onProgress) {
                        // Progress
                        onProgress(progress);
                    }
                    if ((0, search_1.isProgressMessage)(progress)) {
                        this.logService.debug('SearchService#search', progress.message);
                    }
                };
                return await this.doSearch(query, token, onProviderProgress);
            };
            return {
                syncResults,
                asyncResults: getAsyncResults()
            };
        }
        fileSearch(query, token) {
            return this.doSearch(query, token);
        }
        doSearch(query, token, onProgress) {
            this.logService.trace('SearchService#search', JSON.stringify(query));
            const schemesInQuery = this.getSchemesInQuery(query);
            const providerActivations = [Promise.resolve(null)];
            schemesInQuery.forEach(scheme => providerActivations.push(this.extensionService.activateByEvent(`onSearch:${scheme}`)));
            providerActivations.push(this.extensionService.activateByEvent('onSearch:file'));
            const providerPromise = (async () => {
                await Promise.all(providerActivations);
                await this.extensionService.whenInstalledExtensionsRegistered();
                // Cancel faster if search was canceled while waiting for extensions
                if (token && token.isCancellationRequested) {
                    return Promise.reject(new errors_1.CancellationError());
                }
                const progressCallback = (item) => {
                    if (token && token.isCancellationRequested) {
                        return;
                    }
                    onProgress?.(item);
                };
                const exists = await Promise.all(query.folderQueries.map(query => this.fileService.exists(query.folder)));
                query.folderQueries = query.folderQueries.filter((_, i) => exists[i]);
                let completes = await this.searchWithProviders(query, progressCallback, token);
                completes = arrays.coalesce(completes);
                if (!completes.length) {
                    return {
                        limitHit: false,
                        results: [],
                        messages: [],
                    };
                }
                return {
                    limitHit: completes[0] && completes[0].limitHit,
                    stats: completes[0].stats,
                    messages: arrays.coalesce(arrays.flatten(completes.map(i => i.messages))).filter(arrays.uniqueFilter(message => message.type + message.text + message.trusted)),
                    results: arrays.flatten(completes.map((c) => c.results))
                };
            })();
            return token ? (0, async_1.raceCancellationError)(providerPromise, token) : providerPromise;
        }
        getSchemesInQuery(query) {
            const schemes = new Set();
            query.folderQueries?.forEach(fq => schemes.add(fq.folder.scheme));
            query.extraFileResources?.forEach(extraFile => schemes.add(extraFile.scheme));
            return schemes;
        }
        async waitForProvider(queryType, scheme) {
            const deferredMap = this.getDeferredTextSearchesByScheme(queryType);
            if (deferredMap.has(scheme)) {
                return deferredMap.get(scheme).p;
            }
            else {
                const deferred = new async_1.DeferredPromise();
                deferredMap.set(scheme, deferred);
                return deferred.p;
            }
        }
        getSearchProvider(type) {
            switch (type) {
                case 1 /* QueryType.File */:
                    return this.fileSearchProviders;
                case 2 /* QueryType.Text */:
                    return this.textSearchProviders;
                case 3 /* QueryType.aiText */:
                    return this.aiTextSearchProviders;
                default:
                    throw new Error(`Unknown query type: ${type}`);
            }
        }
        getDeferredTextSearchesByScheme(type) {
            switch (type) {
                case 1 /* QueryType.File */:
                    return this.deferredFileSearchesByScheme;
                case 2 /* QueryType.Text */:
                    return this.deferredTextSearchesByScheme;
                case 3 /* QueryType.aiText */:
                    return this.deferredAITextSearchesByScheme;
                default:
                    throw new Error(`Unknown query type: ${type}`);
            }
        }
        async searchWithProviders(query, onProviderProgress, token) {
            const e2eSW = stopwatch_1.StopWatch.create(false);
            const searchPs = [];
            const fqs = this.groupFolderQueriesByScheme(query);
            const someSchemeHasProvider = [...fqs.keys()].some(scheme => {
                return this.getSearchProvider(query.type).has(scheme);
            });
            if (query.type === 3 /* QueryType.aiText */ && !someSchemeHasProvider) {
                return [];
            }
            await Promise.all([...fqs.keys()].map(async (scheme) => {
                const schemeFQs = fqs.get(scheme);
                let provider = this.getSearchProvider(query.type).get(scheme);
                if (!provider) {
                    if (someSchemeHasProvider) {
                        if (!this.loggedSchemesMissingProviders.has(scheme)) {
                            this.logService.warn(`No search provider registered for scheme: ${scheme}. Another scheme has a provider, not waiting for ${scheme}`);
                            this.loggedSchemesMissingProviders.add(scheme);
                        }
                        return;
                    }
                    else {
                        if (!this.loggedSchemesMissingProviders.has(scheme)) {
                            this.logService.warn(`No search provider registered for scheme: ${scheme}, waiting`);
                            this.loggedSchemesMissingProviders.add(scheme);
                        }
                        provider = await this.waitForProvider(query.type, scheme);
                    }
                }
                const oneSchemeQuery = {
                    ...query,
                    ...{
                        folderQueries: schemeFQs
                    }
                };
                const doProviderSearch = () => {
                    switch (query.type) {
                        case 1 /* QueryType.File */:
                            return provider.fileSearch(oneSchemeQuery, token);
                        case 2 /* QueryType.Text */:
                            return provider.textSearch(oneSchemeQuery, onProviderProgress, token);
                        default:
                            return provider.textSearch(oneSchemeQuery, onProviderProgress, token);
                    }
                };
                searchPs.push(doProviderSearch());
            }));
            return Promise.all(searchPs).then(completes => {
                const endToEndTime = e2eSW.elapsed();
                this.logService.trace(`SearchService#search: ${endToEndTime}ms`);
                completes.forEach(complete => {
                    this.sendTelemetry(query, endToEndTime, complete);
                });
                return completes;
            }, err => {
                const endToEndTime = e2eSW.elapsed();
                this.logService.trace(`SearchService#search: ${endToEndTime}ms`);
                const searchError = (0, search_1.deserializeSearchError)(err);
                this.logService.trace(`SearchService#searchError: ${searchError.message}`);
                this.sendTelemetry(query, endToEndTime, undefined, searchError);
                throw searchError;
            });
        }
        groupFolderQueriesByScheme(query) {
            const queries = new Map();
            query.folderQueries.forEach(fq => {
                const schemeFQs = queries.get(fq.folder.scheme) || [];
                schemeFQs.push(fq);
                queries.set(fq.folder.scheme, schemeFQs);
            });
            return queries;
        }
        sendTelemetry(query, endToEndTime, complete, err) {
            const fileSchemeOnly = query.folderQueries.every(fq => fq.folder.scheme === network_1.Schemas.file);
            const otherSchemeOnly = query.folderQueries.every(fq => fq.folder.scheme !== network_1.Schemas.file);
            const scheme = fileSchemeOnly ? network_1.Schemas.file :
                otherSchemeOnly ? 'other' :
                    'mixed';
            if (query.type === 1 /* QueryType.File */ && complete && complete.stats) {
                const fileSearchStats = complete.stats;
                if (fileSearchStats.fromCache) {
                    const cacheStats = fileSearchStats.detailStats;
                    this.telemetryService.publicLog2('cachedSearchComplete', {
                        reason: query._reason,
                        resultCount: fileSearchStats.resultCount,
                        workspaceFolderCount: query.folderQueries.length,
                        endToEndTime: endToEndTime,
                        sortingTime: fileSearchStats.sortingTime,
                        cacheWasResolved: cacheStats.cacheWasResolved,
                        cacheLookupTime: cacheStats.cacheLookupTime,
                        cacheFilterTime: cacheStats.cacheFilterTime,
                        cacheEntryCount: cacheStats.cacheEntryCount,
                        scheme
                    });
                }
                else {
                    const searchEngineStats = fileSearchStats.detailStats;
                    this.telemetryService.publicLog2('searchComplete', {
                        reason: query._reason,
                        resultCount: fileSearchStats.resultCount,
                        workspaceFolderCount: query.folderQueries.length,
                        endToEndTime: endToEndTime,
                        sortingTime: fileSearchStats.sortingTime,
                        fileWalkTime: searchEngineStats.fileWalkTime,
                        directoriesWalked: searchEngineStats.directoriesWalked,
                        filesWalked: searchEngineStats.filesWalked,
                        cmdTime: searchEngineStats.cmdTime,
                        cmdResultCount: searchEngineStats.cmdResultCount,
                        scheme
                    });
                }
            }
            else if (query.type === 2 /* QueryType.Text */) {
                let errorType;
                if (err) {
                    errorType = err.code === search_1.SearchErrorCode.regexParseError ? 'regex' :
                        err.code === search_1.SearchErrorCode.unknownEncoding ? 'encoding' :
                            err.code === search_1.SearchErrorCode.globParseError ? 'glob' :
                                err.code === search_1.SearchErrorCode.invalidLiteral ? 'literal' :
                                    err.code === search_1.SearchErrorCode.other ? 'other' :
                                        err.code === search_1.SearchErrorCode.canceled ? 'canceled' :
                                            'unknown';
                }
                this.telemetryService.publicLog2('textSearchComplete', {
                    reason: query._reason,
                    workspaceFolderCount: query.folderQueries.length,
                    endToEndTime: endToEndTime,
                    scheme,
                    error: errorType,
                });
            }
        }
        getOpenEditorResults(query) {
            const openEditorResults = new map_1.ResourceMap(uri => this.uriIdentityService.extUri.getComparisonKey(uri));
            let limitHit = false;
            if (query.type === 2 /* QueryType.Text */) {
                const canonicalToOriginalResources = new map_1.ResourceMap();
                for (const editorInput of this.editorService.editors) {
                    const canonical = editor_1.EditorResourceAccessor.getCanonicalUri(editorInput, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                    const original = editor_1.EditorResourceAccessor.getOriginalUri(editorInput, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                    if (canonical) {
                        canonicalToOriginalResources.set(canonical, original ?? canonical);
                    }
                }
                const models = this.modelService.getModels();
                models.forEach((model) => {
                    const resource = model.uri;
                    if (!resource) {
                        return;
                    }
                    if (limitHit) {
                        return;
                    }
                    const originalResource = canonicalToOriginalResources.get(resource);
                    if (!originalResource) {
                        return;
                    }
                    // Skip search results
                    if (model.getLanguageId() === search_1.SEARCH_RESULT_LANGUAGE_ID && !(query.includePattern && query.includePattern['**/*.code-search'])) {
                        // TODO: untitled search editors will be excluded from search even when include *.code-search is specified
                        return;
                    }
                    // Block walkthrough, webview, etc.
                    if (originalResource.scheme !== network_1.Schemas.untitled && !this.fileService.hasProvider(originalResource)) {
                        return;
                    }
                    // Exclude files from the git FileSystemProvider, e.g. to prevent open staged files from showing in search results
                    if (originalResource.scheme === 'git') {
                        return;
                    }
                    if (!this.matches(originalResource, query)) {
                        return; // respect user filters
                    }
                    // Use editor API to find matches
                    const askMax = (0, types_1.isNumber)(query.maxResults) ? query.maxResults + 1 : Number.MAX_SAFE_INTEGER;
                    let matches = model.findMatches(query.contentPattern.pattern, false, !!query.contentPattern.isRegExp, !!query.contentPattern.isCaseSensitive, query.contentPattern.isWordMatch ? query.contentPattern.wordSeparators : null, false, askMax);
                    if (matches.length) {
                        if (askMax && matches.length >= askMax) {
                            limitHit = true;
                            matches = matches.slice(0, askMax - 1);
                        }
                        const fileMatch = new search_1.FileMatch(originalResource);
                        openEditorResults.set(originalResource, fileMatch);
                        const textSearchResults = (0, searchHelpers_1.editorMatchesToTextSearchResults)(matches, model, query.previewOptions);
                        fileMatch.results = (0, searchHelpers_1.getTextSearchMatchWithModelContext)(textSearchResults, model, query);
                    }
                    else {
                        openEditorResults.set(originalResource, null);
                    }
                });
            }
            return {
                results: openEditorResults,
                limitHit
            };
        }
        matches(resource, query) {
            return (0, search_1.pathIncludedInQuery)(query, resource.fsPath);
        }
        async clearCache(cacheKey) {
            const clearPs = Array.from(this.fileSearchProviders.values())
                .map(provider => provider && provider.clearCache(cacheKey));
            await Promise.all(clearPs);
        }
    };
    exports.SearchService = SearchService;
    exports.SearchService = SearchService = __decorate([
        __param(0, model_1.IModelService),
        __param(1, editorService_1.IEditorService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, log_1.ILogService),
        __param(4, extensions_1.IExtensionService),
        __param(5, files_1.IFileService),
        __param(6, uriIdentity_1.IUriIdentityService)
    ], SearchService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvY29tbW9uL3NlYXJjaFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJ6RixJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFjLFNBQVEsc0JBQVU7UUFjNUMsWUFDZ0IsWUFBNEMsRUFDM0MsYUFBOEMsRUFDM0MsZ0JBQW9ELEVBQzFELFVBQXdDLEVBQ2xDLGdCQUFvRCxFQUN6RCxXQUEwQyxFQUNuQyxrQkFBd0Q7WUFFN0UsS0FBSyxFQUFFLENBQUM7WUFSd0IsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDMUIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQzFCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDekMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNqQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3hDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2xCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFqQjdELHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUFpQyxDQUFDO1lBQy9ELHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUFpQyxDQUFDO1lBQy9ELDBCQUFxQixHQUFHLElBQUksR0FBRyxFQUFpQyxDQUFDO1lBRTFFLGlDQUE0QixHQUFHLElBQUksR0FBRyxFQUFrRCxDQUFDO1lBQ3pGLGlDQUE0QixHQUFHLElBQUksR0FBRyxFQUFrRCxDQUFDO1lBQ3pGLG1DQUE4QixHQUFHLElBQUksR0FBRyxFQUFrRCxDQUFDO1lBRTNGLGtDQUE2QixHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFZMUQsQ0FBQztRQUVELDRCQUE0QixDQUFDLE1BQWMs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