/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/fuzzyScorer", "vs/base/common/path", "vs/base/common/stopwatch", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/fileSearch", "vs/workbench/services/search/node/textSearchAdapter"], function (require, exports, arrays, async_1, errors_1, event_1, fuzzyScorer_1, path_1, stopwatch_1, uri_1, files_1, search_1, fileSearch_1, textSearchAdapter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchService = void 0;
    class SearchService {
        static { this.BATCH_SIZE = 512; }
        constructor(processType = 'searchProcess') {
            this.processType = processType;
            this.caches = Object.create(null);
        }
        fileSearch(config) {
            let promise;
            const query = reviveQuery(config);
            const emitter = new event_1.Emitter({
                onDidAddFirstListener: () => {
                    promise = (0, async_1.createCancelablePromise)(token => {
                        return this.doFileSearchWithEngine(fileSearch_1.Engine, query, p => emitter.fire(p), token);
                    });
                    promise.then(c => emitter.fire(c), err => emitter.fire({ type: 'error', error: { message: err.message, stack: err.stack } }));
                },
                onDidRemoveLastListener: () => {
                    promise.cancel();
                }
            });
            return emitter.event;
        }
        textSearch(rawQuery) {
            let promise;
            const query = reviveQuery(rawQuery);
            const emitter = new event_1.Emitter({
                onDidAddFirstListener: () => {
                    promise = (0, async_1.createCancelablePromise)(token => {
                        return this.ripgrepTextSearch(query, p => emitter.fire(p), token);
                    });
                    promise.then(c => emitter.fire(c), err => emitter.fire({ type: 'error', error: { message: err.message, stack: err.stack } }));
                },
                onDidRemoveLastListener: () => {
                    promise.cancel();
                }
            });
            return emitter.event;
        }
        ripgrepTextSearch(config, progressCallback, token) {
            config.maxFileSize = this.getPlatformFileLimits().maxFileSize;
            const engine = new textSearchAdapter_1.TextSearchEngineAdapter(config);
            return engine.search(token, progressCallback, progressCallback);
        }
        getPlatformFileLimits() {
            return {
                maxFileSize: 16 * files_1.ByteSize.GB
            };
        }
        doFileSearch(config, progressCallback, token) {
            return this.doFileSearchWithEngine(fileSearch_1.Engine, config, progressCallback, token);
        }
        doFileSearchWithEngine(EngineClass, config, progressCallback, token, batchSize = SearchService.BATCH_SIZE) {
            let resultCount = 0;
            const fileProgressCallback = progress => {
                if (Array.isArray(progress)) {
                    resultCount += progress.length;
                    progressCallback(progress.map(m => this.rawMatchToSearchItem(m)));
                }
                else if (progress.relativePath) {
                    resultCount++;
                    progressCallback(this.rawMatchToSearchItem(progress));
                }
                else {
                    progressCallback(progress);
                }
            };
            if (config.sortByScore) {
                let sortedSearch = this.trySortedSearchFromCache(config, fileProgressCallback, token);
                if (!sortedSearch) {
                    const walkerConfig = config.maxResults ? Object.assign({}, config, { maxResults: null }) : config;
                    const engine = new EngineClass(walkerConfig);
                    sortedSearch = this.doSortedSearch(engine, config, progressCallback, fileProgressCallback, token);
                }
                return new Promise((c, e) => {
                    sortedSearch.then(([result, rawMatches]) => {
                        const serializedMatches = rawMatches.map(rawMatch => this.rawMatchToSearchItem(rawMatch));
                        this.sendProgress(serializedMatches, progressCallback, batchSize);
                        c(result);
                    }, e);
                });
            }
            const engine = new EngineClass(config);
            return this.doSearch(engine, fileProgressCallback, batchSize, token).then(complete => {
                return {
                    limitHit: complete.limitHit,
                    type: 'success',
                    stats: {
                        detailStats: complete.stats,
                        type: this.processType,
                        fromCache: false,
                        resultCount,
                        sortingTime: undefined
                    }
                };
            });
        }
        rawMatchToSearchItem(match) {
            return { path: match.base ? (0, path_1.join)(match.base, match.relativePath) : match.relativePath };
        }
        doSortedSearch(engine, config, progressCallback, fileProgressCallback, token) {
            const emitter = new event_1.Emitter();
            let allResultsPromise = (0, async_1.createCancelablePromise)(token => {
                let results = [];
                const innerProgressCallback = progress => {
                    if (Array.isArray(progress)) {
                        results = progress;
                    }
                    else {
                        fileProgressCallback(progress);
                        emitter.fire(progress);
                    }
                };
                return this.doSearch(engine, innerProgressCallback, -1, token)
                    .then(result => {
                    return [result, results];
                });
            });
            let cache;
            if (config.cacheKey) {
                cache = this.getOrCreateCache(config.cacheKey);
                const cacheRow = {
                    promise: allResultsPromise,
                    event: emitter.event,
                    resolved: false
                };
                cache.resultsToSearchCache[config.filePattern || ''] = cacheRow;
                allResultsPromise.then(() => {
                    cacheRow.resolved = true;
                }, err => {
                    delete cache.resultsToSearchCache[config.filePattern || ''];
                });
                allResultsPromise = this.preventCancellation(allResultsPromise);
            }
            return allResultsPromise.then(([result, results]) => {
                const scorerCache = cache ? cache.scorerCache : Object.create(null);
                const sortSW = (typeof config.maxResults !== 'number' || config.maxResults > 0) && stopwatch_1.StopWatch.create(false);
                return this.sortResults(config, results, scorerCache, token)
                    .then(sortedResults => {
                    // sortingTime: -1 indicates a "sorted" search that was not sorted, i.e. populating the cache when quickaccess is opened.
                    // Contrasting with findFiles which is not sorted and will have sortingTime: undefined
                    const sortingTime = sortSW ? sortSW.elapsed() : -1;
                    return [{
                            type: 'success',
                            stats: {
                                detailStats: result.stats,
                                sortingTime,
                                fromCache: false,
                                type: this.processType,
                                workspaceFolderCount: config.folderQueries.length,
                                resultCount: sortedResults.length
                            },
                            messages: result.messages,
                            limitHit: result.limitHit || typeof config.maxResults === 'number' && results.length > config.maxResults
                        }, sortedResults];
                });
            });
        }
        getOrCreateCache(cacheKey) {
            const existing = this.caches[cacheKey];
            if (existing) {
                return existing;
            }
            return this.caches[cacheKey] = new Cache();
        }
        trySortedSearchFromCache(config, progressCallback, token) {
            const cache = config.cacheKey && this.caches[config.cacheKey];
            if (!cache) {
                return undefined;
            }
            const cached = this.getResultsFromCache(cache, config.filePattern || '', progressCallback, token);
            if (cached) {
                return cached.then(([result, results, cacheStats]) => {
                    const sortSW = stopwatch_1.StopWatch.create(false);
                    return this.sortResults(config, results, cache.scorerCache, token)
                        .then(sortedResults => {
                        const sortingTime = sortSW.elapsed();
                        const stats = {
                            fromCache: true,
                            detailStats: cacheStats,
                            type: this.processType,
                            resultCount: results.length,
                            sortingTime
                        };
                        return [
                            {
                                type: 'success',
                                limitHit: result.limitHit || typeof config.maxResults === 'number' && results.length > config.maxResults,
                                stats
                            },
                            sortedResults
                        ];
                    });
                });
            }
            return undefined;
        }
        sortResults(config, results, scorerCache, token) {
            // we use the same compare function that is used later when showing the results using fuzzy scoring
            // this is very important because we are also limiting the number of results by config.maxResults
            // and as such we want the top items to be included in this result set if the number of items
            // exceeds config.maxResults.
            const query = (0, fuzzyScorer_1.prepareQuery)(config.filePattern || '');
            const compare = (matchA, matchB) => (0, fuzzyScorer_1.compareItemsByFuzzyScore)(matchA, matchB, query, true, FileMatchItemAccessor, scorerCache);
            const maxResults = typeof config.maxResults === 'number' ? config.maxResults : Number.MAX_VALUE;
            return arrays.topAsync(results, compare, maxResults, 10000, token);
        }
        sendProgress(results, progressCb, batchSize) {
            if (batchSize && batchSize > 0) {
                for (let i = 0; i < results.length; i += batchSize) {
                    progressCb(results.slice(i, i + batchSize));
                }
            }
            else {
                progressCb(results);
            }
        }
        getResultsFromCache(cache, searchValue, progressCallback, token) {
            const cacheLookupSW = stopwatch_1.StopWatch.create(false);
            // Find cache entries by prefix of search value
            const hasPathSep = searchValue.indexOf(path_1.sep) >= 0;
            let cachedRow;
            for (const previousSearch in cache.resultsToSearchCache) {
                // If we narrow down, we might be able to reuse the cached results
                if (searchValue.startsWith(previousSearch)) {
                    if (hasPathSep && previousSearch.indexOf(path_1.sep) < 0 && previousSearch !== '') {
                        continue; // since a path character widens the search for potential more matches, require it in previous search too
                    }
                    const row = cache.resultsToSearchCache[previousSearch];
                    cachedRow = {
                        promise: this.preventCancellation(row.promise),
                        event: row.event,
                        resolved: row.resolved
                    };
                    break;
                }
            }
            if (!cachedRow) {
                return null;
            }
            const cacheLookupTime = cacheLookupSW.elapsed();
            const cacheFilterSW = stopwatch_1.StopWatch.create(false);
            const listener = cachedRow.event(progressCallback);
            if (token) {
                token.onCancellationRequested(() => {
                    listener.dispose();
                });
            }
            return cachedRow.promise.then(([complete, cachedEntries]) => {
                if (token && token.isCancellationRequested) {
                    throw (0, errors_1.canceled)();
                }
                // Pattern match on results
                const results = [];
                const normalizedSearchValueLowercase = (0, fuzzyScorer_1.prepareQuery)(searchValue).normalizedLowercase;
                for (const entry of cachedEntries) {
                    // Check if this entry is a match for the search value
                    if (!(0, search_1.isFilePatternMatch)(entry, normalizedSearchValueLowercase)) {
                        continue;
                    }
                    results.push(entry);
                }
                return [complete, results, {
                        cacheWasResolved: cachedRow.resolved,
                        cacheLookupTime,
                        cacheFilterTime: cacheFilterSW.elapsed(),
                        cacheEntryCount: cachedEntries.length
                    }];
            });
        }
        doSearch(engine, progressCallback, batchSize, token) {
            return new Promise((c, e) => {
                let batch = [];
                token?.onCancellationRequested(() => engine.cancel());
                engine.search((match) => {
                    if (match) {
                        if (batchSize) {
                            batch.push(match);
                            if (batchSize > 0 && batch.length >= batchSize) {
                                progressCallback(batch);
                                batch = [];
                            }
                        }
                        else {
                            progressCallback(match);
                        }
                    }
                }, (progress) => {
                    progressCallback(progress);
                }, (error, complete) => {
                    if (batch.length) {
                        progressCallback(batch);
                    }
                    if (error) {
                        progressCallback({ message: 'Search finished. Error: ' + error.message });
                        e(error);
                    }
                    else {
                        progressCallback({ message: 'Search finished. Stats: ' + JSON.stringify(complete.stats) });
                        c(complete);
                    }
                });
            });
        }
        clearCache(cacheKey) {
            delete this.caches[cacheKey];
            return Promise.resolve(undefined);
        }
        /**
         * Return a CancelablePromise which is not actually cancelable
         * TODO@rob - Is this really needed?
         */
        preventCancellation(promise) {
            return new class {
                get [Symbol.toStringTag]() { return this.toString(); }
                cancel() {
                    // Do nothing
                }
                then(resolve, reject) {
                    return promise.then(resolve, reject);
                }
                catch(reject) {
                    return this.then(undefined, reject);
                }
                finally(onFinally) {
                    return promise.finally(onFinally);
                }
            };
        }
    }
    exports.SearchService = SearchService;
    class Cache {
        constructor() {
            this.resultsToSearchCache = Object.create(null);
            this.scorerCache = Object.create(null);
        }
    }
    const FileMatchItemAccessor = new class {
        getItemLabel(match) {
            return (0, path_1.basename)(match.relativePath); // e.g. myFile.txt
        }
        getItemDescription(match) {
            return (0, path_1.dirname)(match.relativePath); // e.g. some/path/to/file
        }
        getItemPath(match) {
            return match.relativePath; // e.g. some/path/to/file/myFile.txt
        }
    };
    function reviveQuery(rawQuery) {
        return {
            ...rawQuery, // TODO
            ...{
                folderQueries: rawQuery.folderQueries && rawQuery.folderQueries.map(reviveFolderQuery),
                extraFileResources: rawQuery.extraFileResources && rawQuery.extraFileResources.map(components => uri_1.URI.revive(components))
            }
        };
    }
    function reviveFolderQuery(rawFolderQuery) {
        return {
            ...rawFolderQuery,
            folder: uri_1.URI.revive(rawFolderQuery.folder)
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF3U2VhcmNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvbm9kZS9yYXdTZWFyY2hTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1CaEcsTUFBYSxhQUFhO2lCQUVELGVBQVUsR0FBRyxHQUFHLEFBQU4sQ0FBTztRQUl6QyxZQUE2QixjQUF3QyxlQUFlO1lBQXZELGdCQUFXLEdBQVgsV0FBVyxDQUE0QztZQUY1RSxXQUFNLEdBQWtDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFb0IsQ0FBQztRQUV6RixVQUFVLENBQUMsTUFBcUI7WUFDL0IsSUFBSSxPQUFvRCxDQUFDO1lBRXpELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsQyxNQUFNLE9BQU8sR0FBRyxJQUFJLGVBQU8sQ0FBNEQ7Z0JBQ3RGLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtvQkFDM0IsT0FBTyxHQUFHLElBQUEsK0JBQXVCLEVBQUMsS0FBSyxDQUFDLEVBQUU7d0JBQ3pDLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLG1CQUFnQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQzFGLENBQUMsQ0FBQyxDQUFDO29CQUVILE9BQU8sQ0FBQyxJQUFJLENBQ1gsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNwQixHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxF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