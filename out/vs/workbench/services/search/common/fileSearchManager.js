/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/glob", "vs/base/common/resources", "vs/base/common/stopwatch", "vs/workbench/services/search/common/search"], function (require, exports, path, cancellation_1, errorMessage_1, glob, resources, stopwatch_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileSearchManager = void 0;
    class FileSearchEngine {
        constructor(config, provider, sessionToken) {
            this.config = config;
            this.provider = provider;
            this.sessionToken = sessionToken;
            this.isLimitHit = false;
            this.resultCount = 0;
            this.isCanceled = false;
            this.filePattern = config.filePattern;
            this.includePattern = config.includePattern && glob.parse(config.includePattern);
            this.maxResults = config.maxResults || undefined;
            this.exists = config.exists;
            this.activeCancellationTokens = new Set();
            this.globalExcludePattern = config.excludePattern && glob.parse(config.excludePattern);
        }
        cancel() {
            this.isCanceled = true;
            this.activeCancellationTokens.forEach(t => t.cancel());
            this.activeCancellationTokens = new Set();
        }
        search(_onResult) {
            const folderQueries = this.config.folderQueries || [];
            return new Promise((resolve, reject) => {
                const onResult = (match) => {
                    this.resultCount++;
                    _onResult(match);
                };
                // Support that the file pattern is a full path to a file that exists
                if (this.isCanceled) {
                    return resolve({ limitHit: this.isLimitHit });
                }
                // For each extra file
                if (this.config.extraFileResources) {
                    this.config.extraFileResources
                        .forEach(extraFile => {
                        const extraFileStr = extraFile.toString(); // ?
                        const basename = path.basename(extraFileStr);
                        if (this.globalExcludePattern && this.globalExcludePattern(extraFileStr, basename)) {
                            return; // excluded
                        }
                        // File: Check for match on file pattern and include pattern
                        this.matchFile(onResult, { base: extraFile, basename });
                    });
                }
                // For each root folder
                Promise.all(folderQueries.map(fq => {
                    return this.searchInFolder(fq, onResult);
                })).then(stats => {
                    resolve({
                        limitHit: this.isLimitHit,
                        stats: stats[0] || undefined // Only looking at single-folder workspace stats...
                    });
                }, (err) => {
                    reject(new Error((0, errorMessage_1.toErrorMessage)(err)));
                });
            });
        }
        async searchInFolder(fq, onResult) {
            const cancellation = new cancellation_1.CancellationTokenSource();
            const options = this.getSearchOptionsForFolder(fq);
            const tree = this.initDirectoryTree();
            const queryTester = new search_1.QueryGlobTester(this.config, fq);
            const noSiblingsClauses = !queryTester.hasSiblingExcludeClauses();
            let providerSW;
            try {
                this.activeCancellationTokens.add(cancellation);
                providerSW = stopwatch_1.StopWatch.create();
                const results = await this.provider.provideFileSearchResults({
                    pattern: this.config.filePattern || ''
                }, options, cancellation.token);
                const providerTime = providerSW.elapsed();
                const postProcessSW = stopwatch_1.StopWatch.create();
                if (this.isCanceled && !this.isLimitHit) {
                    return null;
                }
                if (results) {
                    results.forEach(result => {
                        const relativePath = path.posix.relative(fq.folder.path, result.path);
                        if (noSiblingsClauses) {
                            const basename = path.basename(result.path);
                            this.matchFile(onResult, { base: fq.folder, relativePath, basename });
                            return;
                        }
                        // TODO: Optimize siblings clauses with ripgrep here.
                        this.addDirectoryEntries(tree, fq.folder, relativePath, onResult);
                    });
                }
                if (this.isCanceled && !this.isLimitHit) {
                    return null;
                }
                this.matchDirectoryTree(tree, queryTester, onResult);
                return {
                    providerTime,
                    postProcessTime: postProcessSW.elapsed()
                };
            }
            finally {
                cancellation.dispose();
                this.activeCancellationTokens.delete(cancellation);
            }
        }
        getSearchOptionsForFolder(fq) {
            const includes = (0, search_1.resolvePatternsForProvider)(this.config.includePattern, fq.includePattern);
            const excludes = (0, search_1.resolvePatternsForProvider)(this.config.excludePattern, fq.excludePattern);
            return {
                folder: fq.folder,
                excludes,
                includes,
                useIgnoreFiles: !fq.disregardIgnoreFiles,
                useGlobalIgnoreFiles: !fq.disregardGlobalIgnoreFiles,
                useParentIgnoreFiles: !fq.disregardParentIgnoreFiles,
                followSymlinks: !fq.ignoreSymlinks,
                maxResults: this.config.maxResults,
                session: this.sessionToken
            };
        }
        initDirectoryTree() {
            const tree = {
                rootEntries: [],
                pathToEntries: Object.create(null)
            };
            tree.pathToEntries['.'] = tree.rootEntries;
            return tree;
        }
        addDirectoryEntries({ pathToEntries }, base, relativeFile, onResult) {
            // Support relative paths to files from a root resource (ignores excludes)
            if (relativeFile === this.filePattern) {
                const basename = path.basename(this.filePattern);
                this.matchFile(onResult, { base: base, relativePath: this.filePattern, basename });
            }
            function add(relativePath) {
                const basename = path.basename(relativePath);
                const dirname = path.dirname(relativePath);
                let entries = pathToEntries[dirname];
                if (!entries) {
                    entries = pathToEntries[dirname] = [];
                    add(dirname);
                }
                entries.push({
                    base,
                    relativePath,
                    basename
                });
            }
            add(relativeFile);
        }
        matchDirectoryTree({ rootEntries, pathToEntries }, queryTester, onResult) {
            const self = this;
            const filePattern = this.filePattern;
            function matchDirectory(entries) {
                const hasSibling = (0, search_1.hasSiblingFn)(() => entries.map(entry => entry.basename));
                for (let i = 0, n = entries.length; i < n; i++) {
                    const entry = entries[i];
                    const { relativePath, basename } = entry;
                    // Check exclude pattern
                    // If the user searches for the exact file name, we adjust the glob matching
                    // to ignore filtering by siblings because the user seems to know what they
                    // are searching for and we want to include the result in that case anyway
                    if (queryTester.matchesExcludesSync(relativePath, basename, filePattern !== basename ? hasSibling : undefined)) {
                        continue;
                    }
                    const sub = pathToEntries[relativePath];
                    if (sub) {
                        matchDirectory(sub);
                    }
                    else {
                        if (relativePath === filePattern) {
                            continue; // ignore file if its path matches with the file pattern because that is already matched above
                        }
                        self.matchFile(onResult, entry);
                    }
                    if (self.isLimitHit) {
                        break;
                    }
                }
            }
            matchDirectory(rootEntries);
        }
        matchFile(onResult, candidate) {
            if (!this.includePattern || (candidate.relativePath && this.includePattern(candidate.relativePath, candidate.basename))) {
                if (this.exists || (this.maxResults && this.resultCount >= this.maxResults)) {
                    this.isLimitHit = true;
                    this.cancel();
                }
                if (!this.isLimitHit) {
                    onResult(candidate);
                }
            }
        }
    }
    class FileSearchManager {
        constructor() {
            this.sessions = new Map();
        }
        static { this.BATCH_SIZE = 512; }
        fileSearch(config, provider, onBatch, token) {
            const sessionTokenSource = this.getSessionTokenSource(config.cacheKey);
            const engine = new FileSearchEngine(config, provider, sessionTokenSource && sessionTokenSource.token);
            let resultCount = 0;
            const onInternalResult = (batch) => {
                resultCount += batch.length;
                onBatch(batch.map(m => this.rawMatchToSearchItem(m)));
            };
            return this.doSearch(engine, FileSearchManager.BATCH_SIZE, onInternalResult, token).then(result => {
                return {
                    limitHit: result.limitHit,
                    stats: {
                        fromCache: false,
                        type: 'fileSearchProvider',
                        resultCount,
                        detailStats: result.stats
                    }
                };
            });
        }
        clearCache(cacheKey) {
            const sessionTokenSource = this.getSessionTokenSource(cacheKey);
            sessionTokenSource?.cancel();
        }
        getSessionTokenSource(cacheKey) {
            if (!cacheKey) {
                return undefined;
            }
            if (!this.sessions.has(cacheKey)) {
                this.sessions.set(cacheKey, new cancellation_1.CancellationTokenSource());
            }
            return this.sessions.get(cacheKey);
        }
        rawMatchToSearchItem(match) {
            if (match.relativePath) {
                return {
                    resource: resources.joinPath(match.base, match.relativePath)
                };
            }
            else {
                // extraFileResources
                return {
                    resource: match.base
                };
            }
        }
        doSearch(engine, batchSize, onResultBatch, token) {
            const listener = token.onCancellationRequested(() => {
                engine.cancel();
            });
            const _onResult = (match) => {
                if (match) {
                    batch.push(match);
                    if (batchSize > 0 && batch.length >= batchSize) {
                        onResultBatch(batch);
                        batch = [];
                    }
                }
            };
            let batch = [];
            return engine.search(_onResult).then(result => {
                if (batch.length) {
                    onResultBatch(batch);
                }
                listener.dispose();
                return result;
            }, error => {
                if (batch.length) {
                    onResultBatch(batch);
                }
                listener.dispose();
                return Promise.reject(error);
            });
        }
    }
    exports.FileSearchManager = FileSearchManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVNlYXJjaE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL2NvbW1vbi9maWxlU2VhcmNoTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErQmhHLE1BQU0sZ0JBQWdCO1FBYXJCLFlBQW9CLE1BQWtCLEVBQVUsUUFBNEIsRUFBVSxZQUFnQztZQUFsRyxXQUFNLEdBQU4sTUFBTSxDQUFZO1lBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBb0I7WUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBb0I7WUFSOUcsZUFBVSxHQUFHLEtBQUssQ0FBQztZQUNuQixnQkFBVyxHQUFHLENBQUMsQ0FBQztZQUNoQixlQUFVLEdBQUcsS0FBSyxDQUFDO1lBTzFCLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztZQUN0QyxJQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDakYsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxJQUFJLFNBQVMsQ0FBQztZQUNqRCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDNUIsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1lBRW5FLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxNQUFNLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFFRCxNQUFNO1lBQ0wsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDdkIsSUFBSSxDQUFD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