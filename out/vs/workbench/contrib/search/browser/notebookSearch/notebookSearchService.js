var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/map", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/search/browser/notebookSearch/searchNotebookHelpers", "vs/workbench/services/search/common/search", "vs/base/common/arrays", "vs/base/common/types", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/services/search/common/queryBuilder", "vs/platform/instantiation/common/instantiation"], function (require, exports, cancellation_1, map_1, configuration_1, log_1, uriIdentity_1, notebookService_1, searchNotebookHelpers_1, search_1, arrays, types_1, editorResolverService_1, notebookEditorService_1, queryBuilder_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookSearchService = void 0;
    let NotebookSearchService = class NotebookSearchService {
        constructor(uriIdentityService, notebookEditorService, logService, notebookService, configurationService, editorResolverService, searchService, instantiationService) {
            this.uriIdentityService = uriIdentityService;
            this.notebookEditorService = notebookEditorService;
            this.logService = logService;
            this.notebookService = notebookService;
            this.configurationService = configurationService;
            this.editorResolverService = editorResolverService;
            this.searchService = searchService;
            this.queryBuilder = instantiationService.createInstance(queryBuilder_1.QueryBuilder);
        }
        notebookSearch(query, token, searchInstanceID, onProgress) {
            if (query.type !== 2 /* QueryType.Text */) {
                return {
                    openFilesToScan: new map_1.ResourceSet(),
                    completeData: Promise.resolve({
                        messages: [],
                        limitHit: false,
                        results: [],
                    }),
                    allScannedFiles: Promise.resolve(new map_1.ResourceSet()),
                };
            }
            const localNotebookWidgets = this.getLocalNotebookWidgets();
            const localNotebookFiles = localNotebookWidgets.map(widget => widget.viewModel.uri);
            const getAllResults = () => {
                const searchStart = Date.now();
                const localResultPromise = this.getLocalNotebookResults(query, token ?? cancellation_1.CancellationToken.None, localNotebookWidgets, searchInstanceID);
                const searchLocalEnd = Date.now();
                const experimentalNotebooksEnabled = this.configurationService.getValue('search').experimental?.closedNotebookRichContentResults ?? false;
                let closedResultsPromise = Promise.resolve(undefined);
                if (experimentalNotebooksEnabled) {
                    closedResultsPromise = this.getClosedNotebookResults(query, new map_1.ResourceSet(localNotebookFiles, uri => this.uriIdentityService.extUri.getComparisonKey(uri)), token ?? cancellation_1.CancellationToken.None);
                }
                const promise = Promise.all([localResultPromise, closedResultsPromise]);
                return {
                    completeData: promise.then((resolvedPromise) => {
                        const openNotebookResult = resolvedPromise[0];
                        const closedNotebookResult = resolvedPromise[1];
                        const resolved = resolvedPromise.filter((e) => !!e);
                        const resultArray = [...openNotebookResult.results.values(), ...closedNotebookResult?.results.values() ?? []];
                        const results = arrays.coalesce(resultArray);
                        if (onProgress) {
                            results.forEach(onProgress);
                        }
                        this.logService.trace(`local notebook search time | ${searchLocalEnd - searchStart}ms`);
                        return {
                            messages: [],
                            limitHit: resolved.reduce((prev, cur) => prev || cur.limitHit, false),
                            results,
                        };
                    }),
                    allScannedFiles: promise.then(resolvedPromise => {
                        const openNotebookResults = resolvedPromise[0];
                        const closedNotebookResults = resolvedPromise[1];
                        const results = arrays.coalesce([...openNotebookResults.results.keys(), ...closedNotebookResults?.results.keys() ?? []]);
                        return new map_1.ResourceSet(results, uri => this.uriIdentityService.extUri.getComparisonKey(uri));
                    })
                };
            };
            const promiseResults = getAllResults();
            return {
                openFilesToScan: new map_1.ResourceSet(localNotebookFiles),
                completeData: promiseResults.completeData,
                allScannedFiles: promiseResults.allScannedFiles
            };
        }
        async doesFileExist(includes, folderQueries, token) {
            const promises = includes.map(async (includePattern) => {
                const query = this.queryBuilder.file(folderQueries.map(e => e.folder), {
                    includePattern: includePattern.startsWith('/') ? includePattern : '**/' + includePattern, // todo: find cleaner way to ensure that globs match all appropriate filetypes
                    exists: true
                });
                return this.searchService.fileSearch(query, token).then((ret) => {
                    if (!ret.limitHit) {
                        throw Error('File not found');
                    }
                });
            });
            return Promise.any(promises).then(() => true).catch(() => false);
        }
        async getClosedNotebookResults(textQuery, scannedFiles, token) {
            const userAssociations = this.editorResolverService.getAllUserAssociations();
            const allPriorityInfo = new Map();
            const contributedNotebookTypes = this.notebookService.getContributedNotebookTypes();
            userAssociations.forEach(association => {
                // we gather the editor associations here, but cannot check them until we actually have the files that the glob matches
                // this is because longer patterns take precedence over shorter ones, and even if there is a user association that
                // specifies the exact same glob as a contributed notebook type, there might be another user association that is longer/more specific
                // that still matches the path and should therefore take more precedence.
                if (!association.filenamePattern) {
                    return;
                }
                const info = {
                    isFromSettings: true,
                    filenamePatterns: [association.filenamePattern]
                };
                const existingEntry = allPriorityInfo.get(association.viewType);
                if (existingEntry) {
                    allPriorityInfo.set(association.viewType, existingEntry.concat(info));
                }
                else {
                    allPriorityInfo.set(association.viewType, [info]);
                }
            });
            const promises = [];
            contributedNotebookTypes.forEach((notebook) => {
                if (notebook.selectors.length > 0) {
                    promises.push((async () => {
                        const includes = notebook.selectors.map((selector) => {
                            const globPattern = selector.include || selector;
                            return globPattern.toString();
                        });
                        const isInWorkspace = await this.doesFileExist(includes, textQuery.folderQueries, token);
                        if (isInWorkspace) {
                            const canResolve = await this.notebookService.canResolve(notebook.id);
                            if (!canResolve) {
                                return undefined;
                            }
                            const serializer = (await this.notebookService.withNotebookDataProvider(notebook.id)).serializer;
                            return await serializer.searchInNotebooks(textQuery, token, allPriorityInfo);
                        }
                        else {
                            return undefined;
                        }
                    })());
                }
            });
            const start = Date.now();
            const searchComplete = arrays.coalesce(await Promise.all(promises));
            const results = searchComplete.flatMap(e => e.results);
            let limitHit = searchComplete.some(e => e.limitHit);
            // results are already sorted with high priority first, filter out duplicates.
            const uniqueResults = new map_1.ResourceMap(uri => this.uriIdentityService.extUri.getComparisonKey(uri));
            let numResults = 0;
            for (const result of results) {
                if (textQuery.maxResults && numResults >= textQuery.maxResults) {
                    limitHit = true;
                    break;
                }
                if (!scannedFiles.has(result.resource) && !uniqueResults.has(result.resource)) {
                    uniqueResults.set(result.resource, result.cellResults.length > 0 ? result : null);
                    numResults++;
                }
            }
            const end = Date.now();
            this.logService.trace(`query: ${textQuery.contentPattern.pattern}`);
            this.logService.trace(`closed notebook search time | ${end - start}ms`);
            return {
                results: uniqueResults,
                limitHit
            };
        }
        async getLocalNotebookResults(query, token, widgets, searchID) {
            const localResults = new map_1.ResourceMap(uri => this.uriIdentityService.extUri.getComparisonKey(uri));
            let limitHit = false;
            for (const widget of widgets) {
                if (!widget.hasModel()) {
                    continue;
                }
                const askMax = (0, types_1.isNumber)(query.maxResults) ? query.maxResults + 1 : Number.MAX_SAFE_INTEGER;
                const uri = widget.viewModel.uri;
                if (!(0, search_1.pathIncludedInQuery)(query, uri.fsPath)) {
                    continue;
                }
                let matches = await widget
                    .find(query.contentPattern.pattern, {
                    regex: query.contentPattern.isRegExp,
                    wholeWord: query.contentPattern.isWordMatch,
                    caseSensitive: query.contentPattern.isCaseSensitive,
                    includeMarkupInput: query.contentPattern.notebookInfo?.isInNotebookMarkdownInput ?? true,
                    includeMarkupPreview: query.contentPattern.notebookInfo?.isInNotebookMarkdownPreview ?? true,
                    includeCodeInput: query.contentPattern.notebookInfo?.isInNotebookCellInput ?? true,
                    includeOutput: query.contentPattern.notebookInfo?.isInNotebookCellOutput ?? true,
                }, token, false, true, searchID);
                if (matches.length) {
                    if (askMax && matches.length >= askMax) {
                        limitHit = true;
                        matches = matches.slice(0, askMax - 1);
                    }
                    const cellResults = matches.map(match => {
                        const contentResults = (0, searchNotebookHelpers_1.contentMatchesToTextSearchMatches)(match.contentMatches, match.cell);
                        const webviewResults = (0, searchNotebookHelpers_1.webviewMatchesToTextSearchMatches)(match.webviewMatches);
                        return {
                            cell: match.cell,
                            index: match.index,
                            contentResults: contentResults,
                            webviewResults: webviewResults,
                        };
                    });
                    const fileMatch = {
                        resource: uri, cellResults: cellResults
                    };
                    localResults.set(uri, fileMatch);
                }
                else {
                    localResults.set(uri, null);
                }
            }
            return {
                results: localResults,
                limitHit
            };
        }
        getLocalNotebookWidgets() {
            const notebookWidgets = this.notebookEditorService.retrieveAllExistingWidgets();
            return notebookWidgets
                .map(widget => widget.value)
                .filter((val) => !!val && val.hasModel());
        }
    };
    exports.NotebookSearchService = NotebookSearchService;
    exports.NotebookSearchService = NotebookSearchService = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, notebookEditorService_1.INotebookEditorService),
        __param(2, log_1.ILogService),
        __param(3, notebookService_1.INotebookService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, editorResolverService_1.IEditorResolverService),
        __param(6, search_1.ISearchService),
        __param(7, instantiation_1.IInstantiationService)
    ], NotebookSearchService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTZWFyY2hTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvbm90ZWJvb2tTZWFyY2gvbm90ZWJvb2tTZWFyY2hTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFrQ08sSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBcUI7UUFHakMsWUFDdUMsa0JBQXVDLEVBQ3BDLHFCQUE2QyxFQUN4RCxVQUF1QixFQUNsQixlQUFpQyxFQUM1QixvQkFBMkMsRUFDMUMscUJBQTZDLEVBQ3JELGFBQTZCLEVBQ3ZDLG9CQUEyQztZQVA1Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3BDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDeEQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNsQixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDNUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMxQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ3JELGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUc5RCxJQUFJLENBQUMsWUFBWSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBWSxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELGNBQWMsQ0FBQyxLQUFpQixFQUFFLEtBQW9DLEVBQUUsZ0JBQXdCLEVBQUUsVUFBa0Q7WUFNbkosSUFBSSxLQUFLLENBQUMsSUFBSSwyQkFBbUIsRUFBRSxDQUFDO2dCQUNuQyxPQUFPO29CQUNOLGVBQWUsRUFBRSxJQUFJLGlCQUFXLEVBQUU7b0JBQ2xDLFlBQVksRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDO3dCQUM3QixRQUFRLEVBQUUsRUFBRTt3QkFDWixRQUFRLEVBQUUsS0FBSzt3QkFDZixPQUFPLEVBQUUsRUFBRTtxQkFDWCxDQUFDO29CQUNGLGVBQWUsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksaUJBQVcsRUFBRSxDQUFDO2lCQUNuRCxDQUFDO1lBQ0gsQ0FBQztZQUVELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDNUQsTUFBTSxrQkFBa0IsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sYUFBYSxHQUFHLEdBQXNGLEVBQUU7Z0JBQzdHLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFFL0IsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLEtBQUssSUFBSSxnQ0FBaUIsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztnQkFDeEksTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUVsQyxNQUFNLDRCQUE0QixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQWlDLFFBQVEsQ0FBQyxDQUFDLFlBQVksRUFBRSxnQ0FBZ0MsSUFBSSxLQUFLLENBQUM7Z0JBRTFLLElBQUksb0JBQW9CLEdBQXNELE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3pHLElBQUksNEJBQTRCLEVBQUUsQ0FBQztvQkFDbEMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxJQUFJLGlCQUFXLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxJQUFJLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoTSxDQUFDO2dCQUVELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hFLE9BQU87b0JBQ04sWUFBWSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxlQUFlLEVBQUUsRUFBRTt3QkFDOUMsTUFBTSxrQkFBa0IsR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzlDLE1BQU0sb0JBQW9CLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUVoRCxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFrRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNwSCxNQUFNLFdBQVcsR0FBRyxDQUFDLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLEdBQUcsb0JBQW9CLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO3dCQUM5RyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO3dCQUM3QyxJQUFJLFVBQVUsRUFBRSxDQUFDOzRCQUNoQixPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUM3QixDQUFDO3dCQUNELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxjQUFjLEdBQUcsV0FBVyxJQUFJLENBQUMsQ0FBQzt3QkFDeEYsT0FBd0I7NEJBQ3ZCLFFBQVEsRUFBRSxFQUFFOzRCQUNaLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDOzRCQUNyRSxPQUFPO3lCQUNQLENBQUM7b0JBQ0gsQ0FBQyxDQUFDO29CQUNGLGVBQWUsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFO3dCQUMvQyxNQUFNLG1CQUFtQixHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDL0MsTUFBTSxxQkFBcUIsR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2pELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxHQUFHLHFCQUFxQixFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN6SCxPQUFPLElBQUksaUJBQVcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQzlGLENBQUMsQ0FBQztpQkFDRixDQUFDO1lBQ0gsQ0FBQyxDQUFDO1lBQ0YsTUFBTSxjQUFjLEdBQUcsYUFBYSxFQUFFLENBQUM7WUFDdkMsT0FBTztnQkFDTixlQUFlLEVBQUUsSUFBSSxpQkFBVyxDQUFDLGtCQUFrQixDQUFDO2dCQUNwRCxZQUFZLEVBQUUsY0FBYyxDQUFDLFlBQVk7Z0JBQ3pDLGVBQWUsRUFBRSxjQUFjLENBQUMsZUFBZTthQUMvQyxDQUFDO1FBQ0gsQ0FBQztRQUVPLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBa0IsRUFBRSxhQUFrQyxFQUFFLEtBQXdCO1lBQzNHLE1BQU0sUUFBUSxHQUFvQixRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxjQUFjLEVBQUMsRUFBRTtnQkFDckUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDdEUsY0FBYyxFQUFFLGNBQWMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLGNBQWMsRUFBRSw4RUFBOEU7b0JBQ3hLLE1BQU0sRUFBRSxJQUFJO2lCQUNaLENBQUMsQ0FBQztnQkFDSCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUNuQyxLQUFLLEVBQ0wsS0FBSyxDQUNMLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7b0JBQ2QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDbkIsTUFBTSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDL0IsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVPLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxTQUFxQixFQUFFLFlBQXlCLEVBQUUsS0FBd0I7WUFFaEgsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUM3RSxNQUFNLGVBQWUsR0FBd0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUN2RSxNQUFNLHdCQUF3QixHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQUdwRixnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBRXRDLHVIQUF1SDtnQkFDdkgsa0hBQWtIO2dCQUNsSCxxSUFBcUk7Z0JBQ3JJLHlFQUF5RTtnQkFDekUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDbEMsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sSUFBSSxHQUF5QjtvQkFDbEMsY0FBYyxFQUFFLElBQUk7b0JBQ3BCLGdCQUFnQixFQUFFLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQztpQkFDL0MsQ0FBQztnQkFFRixNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxhQUFhLEVBQUUsQ0FBQztvQkFDbkIsZUFBZSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDdkUsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGVBQWUsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sUUFBUSxHQUdLLEVBQUUsQ0FBQztZQUV0Qix3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDN0MsSUFBSSxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDbkMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO3dCQUN6QixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFOzRCQUNwRCxNQUFNLFdBQVcsR0FBSSxRQUE2QyxDQUFDLE9BQU8sSUFBSSxRQUEwQyxDQUFDOzRCQUN6SCxPQUFPLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDL0IsQ0FBQyxDQUFDLENBQUM7d0JBRUgsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUN6RixJQUFJLGFBQWEsRUFBRSxDQUFDOzRCQUNuQixNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQzs0QkFDdEUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dDQUNqQixPQUFPLFNBQVMsQ0FBQzs0QkFDbEIsQ0FBQzs0QkFDRCxNQUFNLFVBQVUsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7NEJBQ2pHLE9BQU8sTUFBTSxVQUFVLENBQUMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQzt3QkFDOUUsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLE9BQU8sU0FBUyxDQUFDO3dCQUNsQixDQUFDO29CQUNGLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDUCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDekIsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNwRSxNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZELElBQUksUUFBUSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFcEQsOEVBQThFO1lBQzlFLE1BQU0sYUFBYSxHQUFHLElBQUksaUJBQVcsQ0FBbUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFckksSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQzlCLElBQUksU0FBUyxDQUFDLFVBQVUsSUFBSSxVQUFVLElBQUksU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNoRSxRQUFRLEdBQUcsSUFBSSxDQUFDO29CQUNoQixNQUFNO2dCQUNQLENBQUM7Z0JBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDL0UsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbEYsVUFBVSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsVUFBVSxTQUFTLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEdBQUcsR0FBRyxLQUFLLElBQUksQ0FBQyxDQUFDO1lBRXhFLE9BQU87Z0JBQ04sT0FBTyxFQUFFLGFBQWE7Z0JBQ3RCLFFBQVE7YUFDUixDQUFDO1FBQ0gsQ0FBQztRQUVPLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxLQUFpQixFQUFFLEtBQXdCLEVBQUUsT0FBb0MsRUFBRSxRQUFnQjtZQUN4SSxNQUFNLFlBQVksR0FBRyxJQUFJLGlCQUFXLENBQXFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RJLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQztZQUVyQixLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7b0JBQ3hCLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLGdCQUFRLEVBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO2dCQUMzRixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBVSxDQUFDLEdBQUcsQ0FBQztnQkFFbEMsSUFBSSxDQUFDLElBQUEsNEJBQW1CLEVBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUM3QyxTQUFTO2dCQUNWLENBQUM7Z0JBRUQsSUFBSSxPQUFPLEdBQUcsTUFBTSxNQUFNO3FCQUN4QixJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUU7b0JBQ25DLEtBQUssRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVE7b0JBQ3BDLFNBQVMsRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLFdBQVc7b0JBQzNDLGFBQWEsRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLGVBQWU7b0JBQ25ELGtCQUFrQixFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLHlCQUF5QixJQUFJLElBQUk7b0JBQ3hGLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLDJCQUEyQixJQUFJLElBQUk7b0JBQzVGLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLHFCQUFxQixJQUFJLElBQUk7b0JBQ2xGLGFBQWEsRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxzQkFBc0IsSUFBSSxJQUFJO2lCQUNoRixFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUdsQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDcEIsSUFBSSxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxNQUFNLEVBQUUsQ0FBQzt3QkFDeEMsUUFBUSxHQUFHLElBQUksQ0FBQzt3QkFDaEIsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDeEMsQ0FBQztvQkFDRCxNQUFNLFdBQVcsR0FBa0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTt3QkFDdEUsTUFBTSxjQUFjLEdBQUcsSUFBQSx5REFBaUMsRUFBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDM0YsTUFBTSxjQUFjLEdBQUcsSUFBQSx5REFBaUMsRUFBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7d0JBQy9FLE9BQU87NEJBQ04sSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJOzRCQUNoQixLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUs7NEJBQ2xCLGNBQWMsRUFBRSxjQUFjOzRCQUM5QixjQUFjLEVBQUUsY0FBYzt5QkFDOUIsQ0FBQztvQkFDSCxDQUFDLENBQUMsQ0FBQztvQkFFSCxNQUFNLFNBQVMsR0FBZ0M7d0JBQzlDLFFBQVEsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLFdBQVc7cUJBQ3ZDLENBQUM7b0JBQ0YsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPO2dCQUNOLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixRQUFRO2FBQ1IsQ0FBQztRQUNILENBQUM7UUFHTyx1QkFBdUI7WUFDOUIsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDaEYsT0FBTyxlQUFlO2lCQUNwQixHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO2lCQUMzQixNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQStCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7S0FDRCxDQUFBO0lBalFZLHNEQUFxQjtvQ0FBckIscUJBQXFCO1FBSS9CLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSw4Q0FBc0IsQ0FBQTtRQUN0QixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLGtDQUFnQixDQUFBO1FBQ2hCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw4Q0FBc0IsQ0FBQTtRQUN0QixXQUFBLHVCQUFjLENBQUE7UUFDZCxXQUFBLHFDQUFxQixDQUFBO09BWFgscUJBQXFCLENBaVFqQyJ9