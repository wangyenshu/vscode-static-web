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
define(["require", "exports", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/fuzzyScorer", "vs/workbench/services/search/common/queryBuilder", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/search/common/search", "vs/workbench/services/search/common/search", "vs/platform/workspace/common/workspace", "vs/base/common/labels", "vs/workbench/services/path/common/pathService", "vs/base/common/uri", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/platform/label/common/label", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/nls", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/editor/common/core/range", "vs/base/common/async", "vs/base/common/arrays", "vs/workbench/contrib/search/common/cacheState", "vs/workbench/services/history/common/history", "vs/base/common/network", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/common/map", "vs/workbench/contrib/search/browser/symbolsQuickAccess", "vs/platform/quickinput/common/quickAccess", "vs/workbench/browser/quickaccess", "vs/workbench/contrib/codeEditor/browser/quickaccess/gotoSymbolQuickAccess", "vs/editor/common/services/resolverService", "vs/base/common/event", "vs/base/common/codicons", "vs/base/common/themables", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/iconLabels", "vs/base/common/lazy", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform", "vs/workbench/contrib/chat/browser/actions/chatQuickInputActions", "vs/workbench/contrib/chat/browser/chat", "vs/platform/log/common/log", "vs/workbench/services/editor/common/customEditorLabelService", "vs/css!./media/anythingQuickAccess"], function (require, exports, quickInput_1, pickerQuickAccess_1, fuzzyScorer_1, queryBuilder_1, instantiation_1, search_1, search_2, workspace_1, labels_1, pathService_1, uri_1, resources_1, environmentService_1, files_1, lifecycle_1, label_1, getIconClasses_1, model_1, language_1, nls_1, workingCopyService_1, configuration_1, editor_1, editorService_1, range_1, async_1, arrays_1, cacheState_1, history_1, network_1, filesConfigurationService_1, map_1, symbolsQuickAccess_1, quickAccess_1, quickaccess_1, gotoSymbolQuickAccess_1, resolverService_1, event_1, codicons_1, themables_1, uriIdentity_1, iconLabels_1, lazy_1, keybinding_1, platform_1, chatQuickInputActions_1, chat_1, log_1, customEditorLabelService_1) {
    "use strict";
    var AnythingQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnythingQuickAccessProvider = void 0;
    function isEditorSymbolQuickPickItem(pick) {
        const candidate = pick;
        return !!candidate?.range && !!candidate.resource;
    }
    let AnythingQuickAccessProvider = class AnythingQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { AnythingQuickAccessProvider_1 = this; }
        static { this.PREFIX = ''; }
        static { this.NO_RESULTS_PICK = {
            label: (0, nls_1.localize)('noAnythingResults', "No matching results")
        }; }
        static { this.MAX_RESULTS = 512; }
        static { this.TYPING_SEARCH_DELAY = 200; } // this delay accommodates for the user typing a word and then stops typing to start searching
        static { this.SYMBOL_PICKS_MERGE_DELAY = 200; } // allow some time to merge fast and slow picks to reduce flickering
        get defaultFilterValue() {
            if (this.configuration.preserveInput) {
                return quickAccess_1.DefaultQuickAccessFilterValue.LAST;
            }
            return undefined;
        }
        constructor(instantiationService, searchService, contextService, pathService, environmentService, fileService, labelService, modelService, languageService, workingCopyService, configurationService, editorService, historyService, filesConfigurationService, textModelService, uriIdentityService, quickInputService, keybindingService, quickChatService, logService, customEditorLabelService) {
            super(AnythingQuickAccessProvider_1.PREFIX, {
                canAcceptInBackground: true,
                noResultsPick: AnythingQuickAccessProvider_1.NO_RESULTS_PICK
            });
            this.instantiationService = instantiationService;
            this.searchService = searchService;
            this.contextService = contextService;
            this.pathService = pathService;
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.labelService = labelService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.workingCopyService = workingCopyService;
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.historyService = historyService;
            this.filesConfigurationService = filesConfigurationService;
            this.textModelService = textModelService;
            this.uriIdentityService = uriIdentityService;
            this.quickInputService = quickInputService;
            this.keybindingService = keybindingService;
            this.quickChatService = quickChatService;
            this.logService = logService;
            this.customEditorLabelService = customEditorLabelService;
            this.pickState = this._register(new class extends lifecycle_1.Disposable {
                constructor(provider, instantiationService) {
                    super();
                    this.provider = provider;
                    this.instantiationService = instantiationService;
                    this.picker = undefined;
                    this.editorViewState = this._register(this.instantiationService.createInstance(quickaccess_1.PickerEditorState));
                    this.scorerCache = Object.create(null);
                    this.fileQueryCache = undefined;
                    this.lastOriginalFilter = undefined;
                    this.lastFilter = undefined;
                    this.lastRange = undefined;
                    this.lastGlobalPicks = undefined;
                    this.isQuickNavigating = undefined;
                }
                set(picker) {
                    // Picker for this run
                    this.picker = picker;
                    event_1.Event.once(picker.onDispose)(() => {
                        if (picker === this.picker) {
                            this.picker = undefined; // clear the picker when disposed to not keep it in memory for too long
                        }
                    });
                    // Caches
                    const isQuickNavigating = !!picker.quickNavigate;
                    if (!isQuickNavigating) {
                        this.fileQueryCache = this.provider.createFileQueryCache();
                        this.scorerCache = Object.create(null);
                    }
                    // Other
                    this.isQuickNavigating = isQuickNavigating;
                    this.lastOriginalFilter = undefined;
                    this.lastFilter = undefined;
                    this.lastRange = undefined;
                    this.lastGlobalPicks = undefined;
                    this.editorViewState.reset();
                }
            }(this, this.instantiationService));
            //#region Editor History
            this.labelOnlyEditorHistoryPickAccessor = new quickInput_1.QuickPickItemScorerAccessor({ skipDescription: true });
            //#endregion
            //#region File Search
            this.fileQueryDelayer = this._register(new async_1.ThrottledDelayer(AnythingQuickAccessProvider_1.TYPING_SEARCH_DELAY));
            this.fileQueryBuilder = this.instantiationService.createInstance(queryBuilder_1.QueryBuilder);
            //#endregion
            //#region Command Center (if enabled)
            this.lazyRegistry = new lazy_1.Lazy(() => platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
            //#endregion
            //#region Workspace Symbols (if enabled)
            this.workspaceSymbolsQuickAccess = this._register(this.instantiationService.createInstance(symbolsQuickAccess_1.SymbolsQuickAccessProvider));
            //#endregion
            //#region Editor Symbols (if narrowing down into a global pick via `@`)
            this.editorSymbolsQuickAccess = this.instantiationService.createInstance(gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider);
        }
        get configuration() {
            const editorConfig = this.configurationService.getValue().workbench?.editor;
            const searchConfig = this.configurationService.getValue().search;
            const quickAccessConfig = this.configurationService.getValue().workbench.quickOpen;
            return {
                openEditorPinned: !editorConfig?.enablePreviewFromQuickOpen || !editorConfig?.enablePreview,
                openSideBySideDirection: editorConfig?.openSideBySideDirection,
                includeSymbols: searchConfig?.quickOpen.includeSymbols,
                includeHistory: searchConfig?.quickOpen.includeHistory,
                historyFilterSortOrder: searchConfig?.quickOpen.history.filterSortOrder,
                preserveInput: quickAccessConfig.preserveInput
            };
        }
        provide(picker, token, runOptions) {
            const disposables = new lifecycle_1.DisposableStore();
            // Update the pick state for this run
            this.pickState.set(picker);
            // Add editor decorations for active editor symbol picks
            const editorDecorationsDisposable = disposables.add(new lifecycle_1.MutableDisposable());
            disposables.add(picker.onDidChangeActive(() => {
                // Clear old decorations
                editorDecorationsDisposable.value = undefined;
                // Add new decoration if editor symbol is active
                const [item] = picker.activeItems;
                if (isEditorSymbolQuickPickItem(item)) {
                    editorDecorationsDisposable.value = this.decorateAndRevealSymbolRange(item);
                }
            }));
            // Restore view state upon cancellation if we changed it
            // but only when the picker was closed via explicit user
            // gesture and not e.g. when focus was lost because that
            // could mean the user clicked into the editor directly.
            disposables.add(event_1.Event.once(picker.onDidHide)(({ reason }) => {
                if (reason === quickInput_1.QuickInputHideReason.Gesture) {
                    this.pickState.editorViewState.restore();
                }
            }));
            // Start picker
            disposables.add(super.provide(picker, token, runOptions));
            return disposables;
        }
        decorateAndRevealSymbolRange(pick) {
            const activeEditor = this.editorService.activeEditor;
            if (!this.uriIdentityService.extUri.isEqual(pick.resource, activeEditor?.resource)) {
                return lifecycle_1.Disposable.None; // active editor needs to be for resource
            }
            const activeEditorControl = this.editorService.activeTextEditorControl;
            if (!activeEditorControl) {
                return lifecycle_1.Disposable.None; // we need a text editor control to decorate and reveal
            }
            // we must remember our curret view state to be able to restore
            this.pickState.editorViewState.set();
            // Reveal
            activeEditorControl.revealRangeInCenter(pick.range.selection, 0 /* ScrollType.Smooth */);
            // Decorate
            this.addDecorations(activeEditorControl, pick.range.decoration);
            return (0, lifecycle_1.toDisposable)(() => this.clearDecorations(activeEditorControl));
        }
        _getPicks(originalFilter, disposables, token, runOptions) {
            // Find a suitable range from the pattern looking for ":", "#" or ","
            // unless we have the `@` editor symbol character inside the filter
            const filterWithRange = (0, search_1.extractRangeFromFilter)(originalFilter, [gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider.PREFIX]);
            // Update filter with normalized values
            let filter;
            if (filterWithRange) {
                filter = filterWithRange.filter;
            }
            else {
                filter = originalFilter;
            }
            // Remember as last range
            this.pickState.lastRange = filterWithRange?.range;
            // If the original filter value has changed but the normalized
            // one has not, we return early with a `null` result indicating
            // that the results should preserve because the range information
            // (:<line>:<column>) does not need to trigger any re-sorting.
            if (originalFilter !== this.pickState.lastOriginalFilter && filter === this.pickState.lastFilter) {
                return null;
            }
            // Remember as last filter
            const lastWasFiltering = !!this.pickState.lastOriginalFilter;
            this.pickState.lastOriginalFilter = originalFilter;
            this.pickState.lastFilter = filter;
            // Remember our pick state before returning new picks
            // unless we are inside an editor symbol filter or result.
            // We can use this state to return back to the global pick
            // when the user is narrowing back out of editor symbols.
            const picks = this.pickState.picker?.items;
            const activePick = this.pickState.picker?.activeItems[0];
            if (picks && activePick) {
                const activePickIsEditorSymbol = isEditorSymbolQuickPickItem(activePick);
                const activePickIsNoResultsInEditorSymbols = activePick === AnythingQuickAccessProvider_1.NO_RESULTS_PICK && filter.indexOf(gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider.PREFIX) >= 0;
                if (!activePickIsEditorSymbol && !activePickIsNoResultsInEditorSymbols) {
                    this.pickState.lastGlobalPicks = {
                        items: picks,
                        active: activePick
                    };
                }
            }
            // `enableEditorSymbolSearch`: this will enable local editor symbol
            // search if the filter value includes `@` character. We only want
            // to enable this support though if the user was filtering in the
            // picker because this feature depends on an active item in the result
            // list to get symbols from. If we would simply trigger editor symbol
            // search without prior filtering, you could not paste a file name
            // including the `@` character to open it (e.g. /some/file@path)
            // refs: https://github.com/microsoft/vscode/issues/93845
            return this.doGetPicks(filter, {
                ...runOptions,
                enableEditorSymbolSearch: lastWasFiltering
            }, disposables, token);
        }
        doGetPicks(filter, options, disposables, token) {
            const query = (0, fuzzyScorer_1.prepareQuery)(filter);
            // Return early if we have editor symbol picks. We support this by:
            // - having a previously active global pick (e.g. a file)
            // - the user typing `@` to start the local symbol query
            if (options.enableEditorSymbolSearch) {
                const editorSymbolPicks = this.getEditorSymbolPicks(query, disposables, token);
                if (editorSymbolPicks) {
                    return editorSymbolPicks;
                }
            }
            // If we have a known last active editor symbol pick, we try to restore
            // the last global pick to support the case of narrowing out from a
            // editor symbol search back into the global search
            const activePick = this.pickState.picker?.activeItems[0];
            if (isEditorSymbolQuickPickItem(activePick) && this.pickState.lastGlobalPicks) {
                return this.pickState.lastGlobalPicks;
            }
            // Otherwise return normally with history and file/symbol results
            const historyEditorPicks = this.getEditorHistoryPicks(query);
            let picks = new Array();
            if (options.additionPicks) {
                picks.push(...options.additionPicks);
            }
            if (this.pickState.isQuickNavigating) {
                if (picks.length > 0) {
                    picks.push({ type: 'separator', label: (0, nls_1.localize)('recentlyOpenedSeparator', "recently opened") });
                }
                picks = historyEditorPicks;
            }
            else {
                if (options.includeHelp) {
                    picks.push(...this.getHelpPicks(query, token, options));
                }
                if (historyEditorPicks.length !== 0) {
                    picks.push({ type: 'separator', label: (0, nls_1.localize)('recentlyOpenedSeparator', "recently opened") });
                    picks.push(...historyEditorPicks);
                }
            }
            return {
                // Fast picks: help (if included) & editor history
                picks,
                // Slow picks: files and symbols
                additionalPicks: (async () => {
                    // Exclude any result that is already present in editor history
                    const additionalPicksExcludes = new map_1.ResourceMap();
                    for (const historyEditorPick of historyEditorPicks) {
                        if (historyEditorPick.resource) {
                            additionalPicksExcludes.set(historyEditorPick.resource, true);
                        }
                    }
                    const additionalPicks = await this.getAdditionalPicks(query, additionalPicksExcludes, token);
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    return additionalPicks.length > 0 ? [
                        { type: 'separator', label: this.configuration.includeSymbols ? (0, nls_1.localize)('fileAndSymbolResultsSeparator', "file and symbol results") : (0, nls_1.localize)('fileResultsSeparator', "file results") },
                        ...additionalPicks
                    ] : [];
                })(),
                // allow some time to merge files and symbols to reduce flickering
                mergeDelay: AnythingQuickAccessProvider_1.SYMBOL_PICKS_MERGE_DELAY
            };
        }
        async getAdditionalPicks(query, excludes, token) {
            // Resolve file and symbol picks (if enabled)
            const [filePicks, symbolPicks] = await Promise.all([
                this.getFilePicks(query, excludes, token),
                this.getWorkspaceSymbolPicks(query, token)
            ]);
            if (token.isCancellationRequested) {
                return [];
            }
            // Perform sorting (top results by score)
            const sortedAnythingPicks = (0, arrays_1.top)([...filePicks, ...symbolPicks], (anyPickA, anyPickB) => (0, fuzzyScorer_1.compareItemsByFuzzyScore)(anyPickA, anyPickB, query, true, quickInput_1.quickPickItemScorerAccessor, this.pickState.scorerCache), AnythingQuickAccessProvider_1.MAX_RESULTS);
            // Perform filtering
            const filteredAnythingPicks = [];
            for (const anythingPick of sortedAnythingPicks) {
                // Always preserve any existing highlights (e.g. from workspace symbols)
                if (anythingPick.highlights) {
                    filteredAnythingPicks.push(anythingPick);
                }
                // Otherwise, do the scoring and matching here
                else {
                    const { score, labelMatch, descriptionMatch } = (0, fuzzyScorer_1.scoreItemFuzzy)(anythingPick, query, true, quickInput_1.quickPickItemScorerAccessor, this.pickState.scorerCache);
                    if (!score) {
                        continue;
                    }
                    anythingPick.highlights = {
                        label: labelMatch,
                        description: descriptionMatch
                    };
                    filteredAnythingPicks.push(anythingPick);
                }
            }
            return filteredAnythingPicks;
        }
        getEditorHistoryPicks(query) {
            const configuration = this.configuration;
            // Just return all history entries if not searching
            if (!query.normalized) {
                return this.historyService.getHistory().map(editor => this.createAnythingPick(editor, configuration));
            }
            if (!this.configuration.includeHistory) {
                return []; // disabled when searching
            }
            // Perform filtering
            const editorHistoryScorerAccessor = query.containsPathSeparator ? quickInput_1.quickPickItemScorerAccessor : this.labelOnlyEditorHistoryPickAccessor; // Only match on label of the editor unless the search includes path separators
            const editorHistoryPicks = [];
            for (const editor of this.historyService.getHistory()) {
                const resource = editor.resource;
                // allow untitled and terminal editors to go through
                if (!resource || (!this.fileService.hasProvider(resource) && resource.scheme !== network_1.Schemas.untitled && resource.scheme !== network_1.Schemas.vscodeTerminal)) {
                    continue; // exclude editors without file resource if we are searching by pattern
                }
                const editorHistoryPick = this.createAnythingPick(editor, configuration);
                const { score, labelMatch, descriptionMatch } = (0, fuzzyScorer_1.scoreItemFuzzy)(editorHistoryPick, query, false, editorHistoryScorerAccessor, this.pickState.scorerCache);
                if (!score) {
                    continue; // exclude editors not matching query
                }
                editorHistoryPick.highlights = {
                    label: labelMatch,
                    description: descriptionMatch
                };
                editorHistoryPicks.push(editorHistoryPick);
            }
            // Return without sorting if settings tell to sort by recency
            if (this.configuration.historyFilterSortOrder === 'recency') {
                return editorHistoryPicks;
            }
            // Perform sorting
            return editorHistoryPicks.sort((editorA, editorB) => (0, fuzzyScorer_1.compareItemsByFuzzyScore)(editorA, editorB, query, false, editorHistoryScorerAccessor, this.pickState.scorerCache));
        }
        createFileQueryCache() {
            return new cacheState_1.FileQueryCacheState(cacheKey => this.fileQueryBuilder.file(this.contextService.getWorkspace().folders, this.getFileQueryOptions({ cacheKey })), query => this.searchService.fileSearch(query), cacheKey => this.searchService.clearCache(cacheKey), this.pickState.fileQueryCache).load();
        }
        async getFilePicks(query, excludes, token) {
            if (!query.normalized) {
                return [];
            }
            // Absolute path result
            const absolutePathResult = await this.getAbsolutePathFileResult(query, token);
            if (token.isCancellationRequested) {
                return [];
            }
            // Use absolute path result as only results if present
            let fileMatches;
            if (absolutePathResult) {
                if (excludes.has(absolutePathResult)) {
                    return []; // excluded
                }
                // Create a single result pick and make sure to apply full
                // highlights to ensure the pick is displayed. Since a
                // ~ might have been used for searching, our fuzzy scorer
                // may otherwise not properly respect the pick as a result
                const absolutePathPick = this.createAnythingPick(absolutePathResult, this.configuration);
                absolutePathPick.highlights = {
                    label: [{ start: 0, end: absolutePathPick.label.length }],
                    description: absolutePathPick.description ? [{ start: 0, end: absolutePathPick.description.length }] : undefined
                };
                return [absolutePathPick];
            }
            // Otherwise run the file search (with a delayer if cache is not ready yet)
            if (this.pickState.fileQueryCache?.isLoaded) {
                fileMatches = await this.doFileSearch(query, token);
            }
            else {
                fileMatches = await this.fileQueryDelayer.trigger(async () => {
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    return this.doFileSearch(query, token);
                });
            }
            if (token.isCancellationRequested) {
                return [];
            }
            // Filter excludes & convert to picks
            const configuration = this.configuration;
            return fileMatches
                .filter(resource => !excludes.has(resource))
                .map(resource => this.createAnythingPick(resource, configuration));
        }
        async doFileSearch(query, token) {
            const [fileSearchResults, relativePathFileResults] = await Promise.all([
                // File search: this is a search over all files of the workspace using the provided pattern
                this.getFileSearchResults(query, token),
                // Relative path search: we also want to consider results that match files inside the workspace
                // by looking for relative paths that the user typed as query. This allows to return even excluded
                // results into the picker if found (e.g. helps for opening compilation results that are otherwise
                // excluded)
                this.getRelativePathFileResults(query, token)
            ]);
            if (token.isCancellationRequested) {
                return [];
            }
            // Return quickly if no relative results are present
            if (!relativePathFileResults) {
                return fileSearchResults;
            }
            // Otherwise, make sure to filter relative path results from
            // the search results to prevent duplicates
            const relativePathFileResultsMap = new map_1.ResourceMap();
            for (const relativePathFileResult of relativePathFileResults) {
                relativePathFileResultsMap.set(relativePathFileResult, true);
            }
            return [
                ...fileSearchResults.filter(result => !relativePathFileResultsMap.has(result)),
                ...relativePathFileResults
            ];
        }
        async getFileSearchResults(query, token) {
            // filePattern for search depends on the number of queries in input:
            // - with multiple: only take the first one and let the filter later drop non-matching results
            // - with single: just take the original in full
            //
            // This enables to e.g. search for "someFile someFolder" by only returning
            // search results for "someFile" and not both that would normally not match.
            //
            let filePattern = '';
            if (query.values && query.values.length > 1) {
                filePattern = query.values[0].original;
            }
            else {
                filePattern = query.original;
            }
            const fileSearchResults = await this.doGetFileSearchResults(filePattern, token);
            if (token.isCancellationRequested) {
                return [];
            }
            // If we detect that the search limit has been hit and we have a query
            // that was composed of multiple inputs where we only took the first part
            // we run another search with the full original query included to make
            // sure we are including all possible results that could match.
            if (fileSearchResults.limitHit && query.values && query.values.length > 1) {
                const additionalFileSearchResults = await this.doGetFileSearchResults(query.original, token);
                if (token.isCancellationRequested) {
                    return [];
                }
                // Remember which result we already covered
                const existingFileSearchResultsMap = new map_1.ResourceMap();
                for (const fileSearchResult of fileSearchResults.results) {
                    existingFileSearchResultsMap.set(fileSearchResult.resource, true);
                }
                // Add all additional results to the original set for inclusion
                for (const additionalFileSearchResult of additionalFileSearchResults.results) {
                    if (!existingFileSearchResultsMap.has(additionalFileSearchResult.resource)) {
                        fileSearchResults.results.push(additionalFileSearchResult);
                    }
                }
            }
            return fileSearchResults.results.map(result => result.resource);
        }
        doGetFileSearchResults(filePattern, token) {
            const start = Date.now();
            return this.searchService.fileSearch(this.fileQueryBuilder.file(this.contextService.getWorkspace().folders, this.getFileQueryOptions({
                filePattern,
                cacheKey: this.pickState.fileQueryCache?.cacheKey,
                maxResults: AnythingQuickAccessProvider_1.MAX_RESULTS
            })), token).finally(() => {
                this.logService.trace(`QuickAccess fileSearch ${Date.now() - start}ms`);
            });
        }
        getFileQueryOptions(input) {
            return {
                _reason: 'openFileHandler', // used for telemetry - do not change
                extraFileResources: this.instantiationService.invokeFunction(search_1.getOutOfWorkspaceEditorResources),
                filePattern: input.filePattern || '',
                cacheKey: input.cacheKey,
                maxResults: input.maxResults || 0,
                sortByScore: true
            };
        }
        async getAbsolutePathFileResult(query, token) {
            if (!query.containsPathSeparator) {
                return;
            }
            const userHome = await this.pathService.userHome();
            const detildifiedQuery = (0, labels_1.untildify)(query.original, userHome.scheme === network_1.Schemas.file ? userHome.fsPath : userHome.path);
            if (token.isCancellationRequested) {
                return;
            }
            const isAbsolutePathQuery = (await this.pathService.path).isAbsolute(detildifiedQuery);
            if (token.isCancellationRequested) {
                return;
            }
            if (isAbsolutePathQuery) {
                const resource = (0, resources_1.toLocalResource)(await this.pathService.fileURI(detildifiedQuery), this.environmentService.remoteAuthority, this.pathService.defaultUriScheme);
                if (token.isCancellationRequested) {
                    return;
                }
                try {
                    if ((await this.fileService.stat(resource)).isFile) {
                        return resource;
                    }
                }
                catch (error) {
                    // ignore if file does not exist
                }
            }
            return;
        }
        async getRelativePathFileResults(query, token) {
            if (!query.containsPathSeparator) {
                return;
            }
            // Convert relative paths to absolute paths over all folders of the workspace
            // and return them as results if the absolute paths exist
            const isAbsolutePathQuery = (await this.pathService.path).isAbsolute(query.original);
            if (!isAbsolutePathQuery) {
                const resources = [];
                for (const folder of this.contextService.getWorkspace().folders) {
                    if (token.isCancellationRequested) {
                        break;
                    }
                    const resource = (0, resources_1.toLocalResource)(folder.toResource(query.original), this.environmentService.remoteAuthority, this.pathService.defaultUriScheme);
                    try {
                        if ((await this.fileService.stat(resource)).isFile) {
                            resources.push(resource);
                        }
                    }
                    catch (error) {
                        // ignore if file does not exist
                    }
                }
                return resources;
            }
            return;
        }
        getHelpPicks(query, token, runOptions) {
            if (query.normalized) {
                return []; // If there's a filter, we don't show the help
            }
            const providers = this.lazyRegistry.value.getQuickAccessProviders()
                .filter(p => p.helpEntries.some(h => h.commandCenterOrder !== undefined))
                .flatMap(provider => provider.helpEntries
                .filter(h => h.commandCenterOrder !== undefined)
                .map(helpEntry => {
                const providerSpecificOptions = {
                    ...runOptions,
                    includeHelp: provider.prefix === AnythingQuickAccessProvider_1.PREFIX ? false : runOptions?.includeHelp
                };
                const label = helpEntry.commandCenterLabel ?? helpEntry.description;
                return {
                    label,
                    description: helpEntry.prefix ?? provider.prefix,
                    commandCenterOrder: helpEntry.commandCenterOrder,
                    keybinding: helpEntry.commandId ? this.keybindingService.lookupKeybinding(helpEntry.commandId) : undefined,
                    ariaLabel: (0, nls_1.localize)('helpPickAriaLabel', "{0}, {1}", label, helpEntry.description),
                    accept: () => {
                        this.quickInputService.quickAccess.show(provider.prefix, {
                            preserveValue: true,
                            providerOptions: providerSpecificOptions
                        });
                    }
                };
            }));
            // TODO: There has to be a better place for this, but it's the first time we are adding a non-quick access provider
            // to the command center, so for now, let's do this.
            if (this.quickChatService.enabled) {
                providers.push({
                    label: (0, nls_1.localize)('chat', "Open Quick Chat"),
                    commandCenterOrder: 30,
                    keybinding: this.keybindingService.lookupKeybinding(chatQuickInputActions_1.ASK_QUICK_QUESTION_ACTION_ID),
                    accept: () => this.quickChatService.toggle()
                });
            }
            return providers.sort((a, b) => a.commandCenterOrder - b.commandCenterOrder);
        }
        async getWorkspaceSymbolPicks(query, token) {
            const configuration = this.configuration;
            if (!query.normalized || // we need a value for search for
                !configuration.includeSymbols || // we need to enable symbols in search
                this.pickState.lastRange // a range is an indicator for just searching for files
            ) {
                return [];
            }
            // Delegate to the existing symbols quick access
            // but skip local results and also do not score
            return this.workspaceSymbolsQuickAccess.getSymbolPicks(query.original, {
                skipLocal: true,
                skipSorting: true,
                delay: AnythingQuickAccessProvider_1.TYPING_SEARCH_DELAY
            }, token);
        }
        getEditorSymbolPicks(query, disposables, token) {
            const filterSegments = query.original.split(gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider.PREFIX);
            const filter = filterSegments.length > 1 ? filterSegments[filterSegments.length - 1].trim() : undefined;
            if (typeof filter !== 'string') {
                return null; // we need to be searched for editor symbols via `@`
            }
            const activeGlobalPick = this.pickState.lastGlobalPicks?.active;
            if (!activeGlobalPick) {
                return null; // we need an active global pick to find symbols for
            }
            const activeGlobalResource = activeGlobalPick.resource;
            if (!activeGlobalResource || (!this.fileService.hasProvider(activeGlobalResource) && activeGlobalResource.scheme !== network_1.Schemas.untitled)) {
                return null; // we need a resource that we can resolve
            }
            if (activeGlobalPick.label.includes(gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider.PREFIX) || activeGlobalPick.description?.includes(gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider.PREFIX)) {
                if (filterSegments.length < 3) {
                    return null; // require at least 2 `@` if our active pick contains `@` in label or description
                }
            }
            return this.doGetEditorSymbolPicks(activeGlobalPick, activeGlobalResource, filter, disposables, token);
        }
        async doGetEditorSymbolPicks(activeGlobalPick, activeGlobalResource, filter, disposables, token) {
            // Bring the editor to front to review symbols to go to
            try {
                // we must remember our curret view state to be able to restore
                this.pickState.editorViewState.set();
                // open it
                await this.pickState.editorViewState.openTransientEditor({
                    resource: activeGlobalResource,
                    options: { preserveFocus: true, revealIfOpened: true, ignoreError: true }
                });
            }
            catch (error) {
                return []; // return if resource cannot be opened
            }
            if (token.isCancellationRequested) {
                return [];
            }
            // Obtain model from resource
            let model = this.modelService.getModel(activeGlobalResource);
            if (!model) {
                try {
                    const modelReference = disposables.add(await this.textModelService.createModelReference(activeGlobalResource));
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    model = modelReference.object.textEditorModel;
                }
                catch (error) {
                    return []; // return if model cannot be resolved
                }
            }
            // Ask provider for editor symbols
            const editorSymbolPicks = (await this.editorSymbolsQuickAccess.getSymbolPicks(model, filter, { extraContainerLabel: (0, iconLabels_1.stripIcons)(activeGlobalPick.label) }, disposables, token));
            if (token.isCancellationRequested) {
                return [];
            }
            return editorSymbolPicks.map(editorSymbolPick => {
                // Preserve separators
                if (editorSymbolPick.type === 'separator') {
                    return editorSymbolPick;
                }
                // Convert editor symbols to anything pick
                return {
                    ...editorSymbolPick,
                    resource: activeGlobalResource,
                    description: editorSymbolPick.description,
                    trigger: (buttonIndex, keyMods) => {
                        this.openAnything(activeGlobalResource, { keyMods, range: editorSymbolPick.range?.selection, forceOpenSideBySide: true });
                        return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                    },
                    accept: (keyMods, event) => this.openAnything(activeGlobalResource, { keyMods, range: editorSymbolPick.range?.selection, preserveFocus: event.inBackground, forcePinned: event.inBackground })
                };
            });
        }
        addDecorations(editor, range) {
            this.editorSymbolsQuickAccess.addDecorations(editor, range);
        }
        clearDecorations(editor) {
            this.editorSymbolsQuickAccess.clearDecorations(editor);
        }
        //#endregion
        //#region Helpers
        createAnythingPick(resourceOrEditor, configuration) {
            const isEditorHistoryEntry = !uri_1.URI.isUri(resourceOrEditor);
            let resource;
            let label;
            let description = undefined;
            let isDirty = undefined;
            let extraClasses;
            let icon = undefined;
            if ((0, editor_1.isEditorInput)(resourceOrEditor)) {
                resource = editor_1.EditorResourceAccessor.getOriginalUri(resourceOrEditor);
                label = resourceOrEditor.getName();
                description = resourceOrEditor.getDescription();
                isDirty = resourceOrEditor.isDirty() && !resourceOrEditor.isSaving();
                extraClasses = resourceOrEditor.getLabelExtraClasses();
                icon = resourceOrEditor.getIcon();
            }
            else {
                resource = uri_1.URI.isUri(resourceOrEditor) ? resourceOrEditor : resourceOrEditor.resource;
                const customLabel = this.customEditorLabelService.getName(resource);
                label = customLabel || (0, resources_1.basenameOrAuthority)(resource);
                description = this.labelService.getUriLabel(!!customLabel ? resource : (0, resources_1.dirname)(resource), { relative: true });
                isDirty = this.workingCopyService.isDirty(resource) && !this.filesConfigurationService.hasShortAutoSaveDelay(resource);
                extraClasses = [];
            }
            const labelAndDescription = description ? `${label} ${description}` : label;
            const iconClassesValue = new lazy_1.Lazy(() => (0, getIconClasses_1.getIconClasses)(this.modelService, this.languageService, resource, undefined, icon).concat(extraClasses));
            const buttonsValue = new lazy_1.Lazy(() => {
                const openSideBySideDirection = configuration.openSideBySideDirection;
                const buttons = [];
                // Open to side / below
                buttons.push({
                    iconClass: openSideBySideDirection === 'right' ? themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitHorizontal) : themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitVertical),
                    tooltip: openSideBySideDirection === 'right' ?
                        (0, nls_1.localize)({ key: 'openToSide', comment: ['Open this file in a split editor on the left/right side'] }, "Open to the Side") :
                        (0, nls_1.localize)({ key: 'openToBottom', comment: ['Open this file in a split editor on the bottom'] }, "Open to the Bottom")
                });
                // Remove from History
                if (isEditorHistoryEntry) {
                    buttons.push({
                        iconClass: isDirty ? ('dirty-anything ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.circleFilled)) : themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close),
                        tooltip: (0, nls_1.localize)('closeEditor', "Remove from Recently Opened"),
                        alwaysVisible: isDirty
                    });
                }
                return buttons;
            });
            return {
                resource,
                label,
                ariaLabel: isDirty ? (0, nls_1.localize)('filePickAriaLabelDirty', "{0} unsaved changes", labelAndDescription) : labelAndDescription,
                description,
                get iconClasses() { return iconClassesValue.value; },
                get buttons() { return buttonsValue.value; },
                trigger: (buttonIndex, keyMods) => {
                    switch (buttonIndex) {
                        // Open to side / below
                        case 0:
                            this.openAnything(resourceOrEditor, { keyMods, range: this.pickState.lastRange, forceOpenSideBySide: true });
                            return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                        // Remove from History
                        case 1:
                            if (!uri_1.URI.isUri(resourceOrEditor)) {
                                this.historyService.removeFromHistory(resourceOrEditor);
                                return pickerQuickAccess_1.TriggerAction.REMOVE_ITEM;
                            }
                    }
                    return pickerQuickAccess_1.TriggerAction.NO_ACTION;
                },
                accept: (keyMods, event) => this.openAnything(resourceOrEditor, { keyMods, range: this.pickState.lastRange, preserveFocus: event.inBackground, forcePinned: event.inBackground })
            };
        }
        async openAnything(resourceOrEditor, options) {
            // Craft some editor options based on quick access usage
            const editorOptions = {
                preserveFocus: options.preserveFocus,
                pinned: options.keyMods?.ctrlCmd || options.forcePinned || this.configuration.openEditorPinned,
                selection: options.range ? range_1.Range.collapseToStart(options.range) : undefined
            };
            const targetGroup = options.keyMods?.alt || (this.configuration.openEditorPinned && options.keyMods?.ctrlCmd) || options.forceOpenSideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP;
            // Restore any view state if the target is the side group
            if (targetGroup === editorService_1.SIDE_GROUP) {
                await this.pickState.editorViewState.restore();
            }
            // Open editor (typed)
            if ((0, editor_1.isEditorInput)(resourceOrEditor)) {
                await this.editorService.openEditor(resourceOrEditor, editorOptions, targetGroup);
            }
            // Open editor (untyped)
            else {
                let resourceEditorInput;
                if (uri_1.URI.isUri(resourceOrEditor)) {
                    resourceEditorInput = {
                        resource: resourceOrEditor,
                        options: editorOptions
                    };
                }
                else {
                    resourceEditorInput = {
                        ...resourceOrEditor,
                        options: {
                            ...resourceOrEditor.options,
                            ...editorOptions
                        }
                    };
                }
                await this.editorService.openEditor(resourceEditorInput, targetGroup);
            }
        }
    };
    exports.AnythingQuickAccessProvider = AnythingQuickAccessProvider;
    exports.AnythingQuickAccessProvider = AnythingQuickAccessProvider = AnythingQuickAccessProvider_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, search_2.ISearchService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, pathService_1.IPathService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, label_1.ILabelService),
        __param(7, model_1.IModelService),
        __param(8, language_1.ILanguageService),
        __param(9, workingCopyService_1.IWorkingCopyService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, editorService_1.IEditorService),
        __param(12, history_1.IHistoryService),
        __param(13, filesConfigurationService_1.IFilesConfigurationService),
        __param(14, resolverService_1.ITextModelService),
        __param(15, uriIdentity_1.IUriIdentityService),
        __param(16, quickInput_1.IQuickInputService),
        __param(17, keybinding_1.IKeybindingService),
        __param(18, chat_1.IQuickChatService),
        __param(19, log_1.ILogService),
        __param(20, customEditorLabelService_1.ICustomEditorLabelService)
    ], AnythingQuickAccessProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW55dGhpbmdRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9icm93c2VyL2FueXRoaW5nUXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdFaEcsU0FBUywyQkFBMkIsQ0FBQyxJQUE2QjtRQUNqRSxNQUFNLFNBQVMsR0FBRyxJQUFzRCxDQUFDO1FBRXpFLE9BQU8sQ0FBQyxDQUFDLFNBQVMsRUFBRSxLQUFLLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7SUFDbkQsQ0FBQztJQUVNLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsNkNBQWlEOztpQkFFMUYsV0FBTSxHQUFHLEVBQUUsQUFBTCxDQUFNO2lCQUVLLG9CQUFlLEdBQTJCO1lBQ2pFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxxQkFBcUIsQ0FBQztTQUMzRCxBQUZzQyxDQUVyQztpQkFFc0IsZ0JBQVcsR0FBRyxHQUFHLEFBQU4sQ0FBTztpQkFFbEIsd0JBQW1CLEdBQUcsR0FBRyxBQUFOLENBQU8sR0FBQyw4RkFBOEY7aUJBRWxJLDZCQUF3QixHQUFHLEdBQUcsQUFBTixDQUFPLEdBQUMsb0VBQW9FO1FBcURuSCxJQUFJLGtCQUFrQjtZQUNyQixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sMkNBQTZCLENBQUMsSUFBSSxDQUFDO1lBQzNDLENBQUM7WUFFRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsWUFDd0Isb0JBQTRELEVBQ25FLGFBQThDLEVBQ3BDLGNBQXlELEVBQ3JFLFdBQTBDLEVBQzFCLGtCQUFpRSxFQUNqRixX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