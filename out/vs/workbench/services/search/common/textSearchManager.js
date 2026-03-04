/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/workbench/services/search/common/search"], function (require, exports, arrays_1, async_1, cancellation_1, errorMessage_1, network_1, path, resources, uri_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BatchedCollector = exports.TextSearchResultsCollector = exports.TextSearchManager = void 0;
    exports.extensionResultIsMatch = extensionResultIsMatch;
    class TextSearchManager {
        constructor(queryProviderPair, fileUtils, processType) {
            this.queryProviderPair = queryProviderPair;
            this.fileUtils = fileUtils;
            this.processType = processType;
            this.collector = null;
            this.isLimitHit = false;
            this.resultCount = 0;
        }
        get query() {
            return this.queryProviderPair.query;
        }
        search(onProgress, token) {
            const folderQueries = this.query.folderQueries || [];
            const tokenSource = new cancellation_1.CancellationTokenSource(token);
            return new Promise((resolve, reject) => {
                this.collector = new TextSearchResultsCollector(onProgress);
                let isCanceled = false;
                const onResult = (result, folderIdx) => {
                    if (isCanceled) {
                        return;
                    }
                    if (!this.isLimitHit) {
                        const resultSize = this.resultSize(result);
                        if (extensionResultIsMatch(result) && typeof this.query.maxResults === 'number' && this.resultCount + resultSize > this.query.maxResults) {
                            this.isLimitHit = true;
                            isCanceled = true;
                            tokenSource.cancel();
                            result = this.trimResultToSize(result, this.query.maxResults - this.resultCount);
                        }
                        const newResultSize = this.resultSize(result);
                        this.resultCount += newResultSize;
                        if (newResultSize > 0 || !extensionResultIsMatch(result)) {
                            this.collector.add(result, folderIdx);
                        }
                    }
                };
                // For each root folder
                Promise.all(folderQueries.map((fq, i) => {
                    return this.searchInFolder(fq, r => onResult(r, i), tokenSource.token);
                })).then(results => {
                    tokenSource.dispose();
                    this.collector.flush();
                    const someFolderHitLImit = results.some(result => !!result && !!result.limitHit);
                    resolve({
                        limitHit: this.isLimitHit || someFolderHitLImit,
                        messages: (0, arrays_1.flatten)(results.map(result => {
                            if (!result?.message) {
                                return [];
                            }
                            if (Array.isArray(result.message)) {
                                return result.message;
                            }
                            else {
                                return [result.message];
                            }
                        })),
                        stats: {
                            type: this.processType
                        }
                    });
                }, (err) => {
                    tokenSource.dispose();
                    const errMsg = (0, errorMessage_1.toErrorMessage)(err);
                    reject(new Error(errMsg));
                });
            });
        }
        resultSize(result) {
            if (extensionResultIsMatch(result)) {
                return Array.isArray(result.ranges) ?
                    result.ranges.length :
                    1;
            }
            else {
                // #104400 context lines shoudn't count towards result count
                return 0;
            }
        }
        trimResultToSize(result, size) {
            const rangesArr = Array.isArray(result.ranges) ? result.ranges : [result.ranges];
            const matchesArr = Array.isArray(result.preview.matches) ? result.preview.matches : [result.preview.matches];
            return {
                ranges: rangesArr.slice(0, size),
                preview: {
                    matches: matchesArr.slice(0, size),
                    text: result.preview.text
                },
                uri: result.uri
            };
        }
        async searchInFolder(folderQuery, onResult, token) {
            const queryTester = new search_1.QueryGlobTester(this.query, folderQuery);
            const testingPs = [];
            const progress = {
                report: (result) => {
                    if (!this.validateProviderResult(result)) {
                        return;
                    }
                    const hasSibling = folderQuery.folder.scheme === network_1.Schemas.file ?
                        (0, search_1.hasSiblingPromiseFn)(() => {
                            return this.fileUtils.readdir(resources.dirname(result.uri));
                        }) :
                        undefined;
                    const relativePath = resources.relativePath(folderQuery.folder, result.uri);
                    if (relativePath) {
                        // This method is only async when the exclude contains sibling clauses
                        const included = queryTester.includedInQuery(relativePath, path.basename(relativePath), hasSibling);
                        if ((0, async_1.isThenable)(included)) {
                            testingPs.push(included.then(isIncluded => {
                                if (isIncluded) {
                                    onResult(result);
                                }
                            }));
                        }
                        else if (included) {
                            onResult(result);
                        }
                    }
                }
            };
            const searchOptions = this.getSearchOptionsForFolder(folderQuery);
            let result;
            if (this.queryProviderPair.query.type === 3 /* QueryType.aiText */) {
                result = await this.queryProviderPair.provider.provideAITextSearchResults(this.queryProviderPair.query.contentPattern, searchOptions, progress, token);
            }
            else {
                result = await this.queryProviderPair.provider.provideTextSearchResults(patternInfoToQuery(this.queryProviderPair.query.contentPattern), searchOptions, progress, token);
            }
            if (testingPs.length) {
                await Promise.all(testingPs);
            }
            return result;
        }
        validateProviderResult(result) {
            if (extensionResultIsMatch(result)) {
                if (Array.isArray(result.ranges)) {
                    if (!Array.isArray(result.preview.matches)) {
                        console.warn('INVALID - A text search provider match\'s`ranges` and`matches` properties must have the same type.');
                        return false;
                    }
                    if (result.preview.matches.length !== result.ranges.length) {
                        console.warn('INVALID - A text search provider match\'s`ranges` and`matches` properties must have the same length.');
                        return false;
                    }
                }
                else {
                    if (Array.isArray(result.preview.matches)) {
                        console.warn('INVALID - A text search provider match\'s`ranges` and`matches` properties must have the same length.');
                        return false;
                    }
                }
            }
            return true;
        }
        getSearchOptionsForFolder(fq) {
            const includes = (0, search_1.resolvePatternsForProvider)(this.query.includePattern, fq.includePattern);
            const excludes = (0, search_1.resolvePatternsForProvider)(this.query.excludePattern, fq.excludePattern);
            const options = {
                folder: uri_1.URI.from(fq.folder),
                excludes,
                includes,
                useIgnoreFiles: !fq.disregardIgnoreFiles,
                useGlobalIgnoreFiles: !fq.disregardGlobalIgnoreFiles,
                useParentIgnoreFiles: !fq.disregardParentIgnoreFiles,
                followSymlinks: !fq.ignoreSymlinks,
                encoding: fq.fileEncoding && this.fileUtils.toCanonicalName(fq.fileEncoding),
                maxFileSize: this.query.maxFileSize,
                maxResults: this.query.maxResults,
                previewOptions: this.query.previewOptions,
                afterContext: this.query.afterContext,
                beforeContext: this.query.beforeContext
            };
            if ('usePCRE2' in this.query) {
                options.usePCRE2 = this.query.usePCRE2;
            }
            return options;
        }
    }
    exports.TextSearchManager = TextSearchManager;
    function patternInfoToQuery(patternInfo) {
        return {
            isCaseSensitive: patternInfo.isCaseSensitive || false,
            isRegExp: patternInfo.isRegExp || false,
            isWordMatch: patternInfo.isWordMatch || false,
            isMultiline: patternInfo.isMultiline || false,
            pattern: patternInfo.pattern
        };
    }
    class TextSearchResultsCollector {
        constructor(_onResult) {
            this._onResult = _onResult;
            this._currentFolderIdx = -1;
            this._currentFileMatch = null;
            this._batchedCollector = new BatchedCollector(512, items => this.sendItems(items));
        }
        add(data, folderIdx) {
            // Collects TextSearchResults into IInternalFileMatches and collates using BatchedCollector.
            // This is efficient for ripgrep which sends results back one file at a time. It wouldn't be efficient for other search
            // providers that send results in random order. We could do this step afterwards instead.
            if (this._currentFileMatch && (this._currentFolderIdx !== folderIdx || !resources.isEqual(this._currentUri, data.uri))) {
                this.pushToCollector();
                this._currentFileMatch = null;
            }
            if (!this._currentFileMatch) {
                this._currentFolderIdx = folderIdx;
                this._currentFileMatch = {
                    resource: data.uri,
                    results: []
                };
            }
            this._currentFileMatch.results.push(extensionResultToFrontendResult(data));
        }
        pushToCollector() {
            const size = this._currentFileMatch && this._currentFileMatch.results ?
                this._currentFileMatch.results.length :
                0;
            this._batchedCollector.addItem(this._currentFileMatch, size);
        }
        flush() {
            this.pushToCollector();
            this._batchedCollector.flush();
        }
        sendItems(items) {
            this._onResult(items);
        }
    }
    exports.TextSearchResultsCollector = TextSearchResultsCollector;
    function extensionResultToFrontendResult(data) {
        // Warning: result from RipgrepTextSearchEH has fake Range. Don't depend on any other props beyond these...
        if (extensionResultIsMatch(data)) {
            return {
                preview: {
                    matches: (0, arrays_1.mapArrayOrNot)(data.preview.matches, m => ({
                        startLineNumber: m.start.line,
                        startColumn: m.start.character,
                        endLineNumber: m.end.line,
                        endColumn: m.end.character
                    })),
                    text: data.preview.text
                },
                ranges: (0, arrays_1.mapArrayOrNot)(data.ranges, r => ({
                    startLineNumber: r.start.line,
                    startColumn: r.start.character,
                    endLineNumber: r.end.line,
                    endColumn: r.end.character
                }))
            };
        }
        else {
            return {
                text: data.text,
                lineNumber: data.lineNumber
            };
        }
    }
    function extensionResultIsMatch(data) {
        return !!data.preview;
    }
    /**
     * Collects items that have a size - before the cumulative size of collected items reaches START_BATCH_AFTER_COUNT, the callback is called for every
     * set of items collected.
     * But after that point, the callback is called with batches of maxBatchSize.
     * If the batch isn't filled within some time, the callback is also called.
     */
    class BatchedCollector {
        static { this.TIMEOUT = 4000; }
        // After START_BATCH_AFTER_COUNT items have been collected, stop flushing on timeout
        static { this.START_BATCH_AFTER_COUNT = 50; }
        constructor(maxBatchSize, cb) {
            this.maxBatchSize = maxBatchSize;
            this.cb = cb;
            this.totalNumberCompleted = 0;
            this.batch = [];
            this.batchSize = 0;
        }
        addItem(item, size) {
            if (!item) {
                return;
            }
            this.addItemToBatch(item, size);
        }
        addItems(items, size) {
            if (!items) {
                return;
            }
            this.addItemsToBatch(items, size);
        }
        addItemToBatch(item, size) {
            this.batch.push(item);
            this.batchSize += size;
            this.onUpdate();
        }
        addItemsToBatch(item, size) {
            this.batch = this.batch.concat(item);
            this.batchSize += size;
            this.onUpdate();
        }
        onUpdate() {
            if (this.totalNumberCompleted < BatchedCollector.START_BATCH_AFTER_COUNT) {
                // Flush because we aren't batching yet
                this.flush();
            }
            else if (this.batchSize >= this.maxBatchSize) {
                // Flush because the batch is full
                this.flush();
            }
            else if (!this.timeoutHandle) {
                // No timeout running, start a timeout to flush
                this.timeoutHandle = setTimeout(() => {
                    this.flush();
                }, BatchedCollector.TIMEOUT);
            }
        }
        flush() {
            if (this.batchSize) {
                this.totalNumberCompleted += this.batchSize;
                this.cb(this.batch);
                this.batch = [];
                this.batchSize = 0;
                if (this.timeoutHandle) {
                    clearTimeout(this.timeoutHandle);
                    this.timeoutHandle = 0;
                }
            }
        }
    }
    exports.BatchedCollector = BatchedCollector;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFNlYXJjaE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL2NvbW1vbi90ZXh0U2VhcmNoTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtVGhHLHdEQUVDO0lBN1JELE1BQWEsaUJBQWlCO1FBTzdCLFlBQW9CLGlCQUFvRSxFQUMvRSxTQUFxQixFQUNyQixXQUFxQztZQUYxQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1EO1lBQy9FLGNBQVMsR0FBVCxTQUFTLENBQVk7WUFDckIsZ0JBQVcsR0FBWCxXQUFXLENBQTBCO1lBUHRDLGNBQVMsR0FBc0MsSUFBSSxDQUFDO1lBRXBELGVBQVUsR0FBRyxLQUFLLENBQUM7WUFDbkIsZ0JBQVcsR0FBRyxDQUFDLENBQUM7UUFJMEIsQ0FBQztRQUVuRCxJQUFZLEtBQUs7WUFDaEIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxNQUFNLENBQUMsVUFBMkMsRUFBRSxLQUF3QjtZQUMzRSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUM7WUFDckQsTUFBTSxXQUFXLEdBQUcsSUFBSSxzQ0FBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUV2RCxPQUFPLElBQUksT0FBTyxDQUF1QixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDNUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUU1RCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7Z0JBQ3ZCLE1BQU0sUUFBUSxHQUFHLENBQUMsTUFBd0IsRUFBRSxTQUFpQixFQUFFLEVBQUU7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