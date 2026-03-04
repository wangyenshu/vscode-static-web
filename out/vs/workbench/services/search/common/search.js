/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/glob", "vs/base/common/objects", "vs/base/common/extpath", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/base/common/path", "vs/base/common/errors", "vs/workbench/services/search/common/searchExtTypes", "vs/base/common/async"], function (require, exports, arrays_1, glob, objects, extpath, strings_1, instantiation_1, paths, errors_1, searchExtTypes_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QueryGlobTester = exports.SerializableFileMatch = exports.SearchError = exports.SearchErrorCode = exports.SearchSortOrder = exports.ViewMode = exports.OneLineRange = exports.SearchRange = exports.TextSearchMatch = exports.FileMatch = exports.SearchCompletionExitCode = exports.QueryType = exports.SearchProviderType = exports.ISearchService = exports.SEARCH_EXCLUDE_CONFIG = exports.SEARCH_RESULT_LANGUAGE_ID = exports.VIEW_ID = exports.PANEL_ID = exports.VIEWLET_ID = exports.TextSearchCompleteMessageType = void 0;
    exports.resultIsMatch = resultIsMatch;
    exports.isFileMatch = isFileMatch;
    exports.isProgressMessage = isProgressMessage;
    exports.getExcludes = getExcludes;
    exports.pathIncludedInQuery = pathIncludedInQuery;
    exports.deserializeSearchError = deserializeSearchError;
    exports.serializeSearchError = serializeSearchError;
    exports.isSerializedSearchComplete = isSerializedSearchComplete;
    exports.isSerializedSearchSuccess = isSerializedSearchSuccess;
    exports.isSerializedFileMatch = isSerializedFileMatch;
    exports.isFilePatternMatch = isFilePatternMatch;
    exports.resolvePatternsForProvider = resolvePatternsForProvider;
    exports.hasSiblingPromiseFn = hasSiblingPromiseFn;
    exports.hasSiblingFn = hasSiblingFn;
    Object.defineProperty(exports, "TextSearchCompleteMessageType", { enumerable: true, get: function () { return searchExtTypes_1.TextSearchCompleteMessageType; } });
    exports.VIEWLET_ID = 'workbench.view.search';
    exports.PANEL_ID = 'workbench.panel.search';
    exports.VIEW_ID = 'workbench.view.search';
    exports.SEARCH_RESULT_LANGUAGE_ID = 'search-result';
    exports.SEARCH_EXCLUDE_CONFIG = 'search.exclude';
    // Warning: this pattern is used in the search editor to detect offsets. If you
    // change this, also change the search-result built-in extension
    const SEARCH_ELIDED_PREFIX = '⟪ ';
    const SEARCH_ELIDED_SUFFIX = ' characters skipped ⟫';
    const SEARCH_ELIDED_MIN_LEN = (SEARCH_ELIDED_PREFIX.length + SEARCH_ELIDED_SUFFIX.length + 5) * 2;
    exports.ISearchService = (0, instantiation_1.createDecorator)('searchService');
    /**
     * TODO@roblou - split text from file search entirely, or share code in a more natural way.
     */
    var SearchProviderType;
    (function (SearchProviderType) {
        SearchProviderType[SearchProviderType["file"] = 0] = "file";
        SearchProviderType[SearchProviderType["text"] = 1] = "text";
        SearchProviderType[SearchProviderType["aiText"] = 2] = "aiText";
    })(SearchProviderType || (exports.SearchProviderType = SearchProviderType = {}));
    var QueryType;
    (function (QueryType) {
        QueryType[QueryType["File"] = 1] = "File";
        QueryType[QueryType["Text"] = 2] = "Text";
        QueryType[QueryType["aiText"] = 3] = "aiText";
    })(QueryType || (exports.QueryType = QueryType = {}));
    function resultIsMatch(result) {
        return !!result.preview;
    }
    function isFileMatch(p) {
        return !!p.resource;
    }
    function isProgressMessage(p) {
        return !!p.message;
    }
    var SearchCompletionExitCode;
    (function (SearchCompletionExitCode) {
        SearchCompletionExitCode[SearchCompletionExitCode["Normal"] = 0] = "Normal";
        SearchCompletionExitCode[SearchCompletionExitCode["NewSearchStarted"] = 1] = "NewSearchStarted";
    })(SearchCompletionExitCode || (exports.SearchCompletionExitCode = SearchCompletionExitCode = {}));
    class FileMatch {
        constructor(resource) {
            this.resource = resource;
            this.results = [];
            // empty
        }
    }
    exports.FileMatch = FileMatch;
    class TextSearchMatch {
        constructor(text, range, previewOptions, webviewIndex) {
            this.ranges = range;
            this.webviewIndex = webviewIndex;
            // Trim preview if this is one match and a single-line match with a preview requested.
            // Otherwise send the full text, like for replace or for showing multiple previews.
            // TODO this is fishy.
            const ranges = Array.isArray(range) ? range : [range];
            if (previewOptions && previewOptions.matchLines === 1 && isSingleLineRangeList(ranges)) {
                // 1 line preview requested
                text = (0, strings_1.getNLines)(text, previewOptions.matchLines);
                let result = '';
                let shift = 0;
                let lastEnd = 0;
                const leadingChars = Math.floor(previewOptions.charsPerLine / 5);
                const matches = [];
                for (const range of ranges) {
                    const previewStart = Math.max(range.startColumn - leadingChars, 0);
                    const previewEnd = range.startColumn + previewOptions.charsPerLine;
                    if (previewStart > lastEnd + leadingChars + SEARCH_ELIDED_MIN_LEN) {
                        const elision = SEARCH_ELIDED_PREFIX + (previewStart - lastEnd) + SEARCH_ELIDED_SUFFIX;
                        result += elision + text.slice(previewStart, previewEnd);
                        shift += previewStart - (lastEnd + elision.length);
                    }
                    else {
                        result += text.slice(lastEnd, previewEnd);
                    }
                    matches.push(new OneLineRange(0, range.startColumn - shift, range.endColumn - shift));
                    lastEnd = previewEnd;
                }
                this.preview = { text: result, matches: Array.isArray(this.ranges) ? matches : matches[0] };
            }
            else {
                const firstMatchLine = Array.isArray(range) ? range[0].startLineNumber : range.startLineNumber;
                this.preview = {
                    text,
                    matches: (0, arrays_1.mapArrayOrNot)(range, r => new SearchRange(r.startLineNumber - firstMatchLine, r.startColumn, r.endLineNumber - firstMatchLine, r.endColumn))
                };
            }
        }
    }
    exports.TextSearchMatch = TextSearchMatch;
    function isSingleLineRangeList(ranges) {
        const line = ranges[0].startLineNumber;
        for (const r of ranges) {
            if (r.startLineNumber !== line || r.endLineNumber !== line) {
                return false;
            }
        }
        return true;
    }
    class SearchRange {
        constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
            this.startLineNumber = startLineNumber;
            this.startColumn = startColumn;
            this.endLineNumber = endLineNumber;
            this.endColumn = endColumn;
        }
    }
    exports.SearchRange = SearchRange;
    class OneLineRange extends SearchRange {
        constructor(lineNumber, startColumn, endColumn) {
            super(lineNumber, startColumn, lineNumber, endColumn);
        }
    }
    exports.OneLineRange = OneLineRange;
    var ViewMode;
    (function (ViewMode) {
        ViewMode["List"] = "list";
        ViewMode["Tree"] = "tree";
    })(ViewMode || (exports.ViewMode = ViewMode = {}));
    var SearchSortOrder;
    (function (SearchSortOrder) {
        SearchSortOrder["Default"] = "default";
        SearchSortOrder["FileNames"] = "fileNames";
        SearchSortOrder["Type"] = "type";
        SearchSortOrder["Modified"] = "modified";
        SearchSortOrder["CountDescending"] = "countDescending";
        SearchSortOrder["CountAscending"] = "countAscending";
    })(SearchSortOrder || (exports.SearchSortOrder = SearchSortOrder = {}));
    function getExcludes(configuration, includeSearchExcludes = true) {
        const fileExcludes = configuration && configuration.files && configuration.files.exclude;
        const searchExcludes = includeSearchExcludes && configuration && configuration.search && configuration.search.exclude;
        if (!fileExcludes && !searchExcludes) {
            return undefined;
        }
        if (!fileExcludes || !searchExcludes) {
            return fileExcludes || searchExcludes;
        }
        let allExcludes = Object.create(null);
        // clone the config as it could be frozen
        allExcludes = objects.mixin(allExcludes, objects.deepClone(fileExcludes));
        allExcludes = objects.mixin(allExcludes, objects.deepClone(searchExcludes), true);
        return allExcludes;
    }
    function pathIncludedInQuery(queryProps, fsPath) {
        if (queryProps.excludePattern && glob.match(queryProps.excludePattern, fsPath)) {
            return false;
        }
        if (queryProps.includePattern || queryProps.usingSearchPaths) {
            if (queryProps.includePattern && glob.match(queryProps.includePattern, fsPath)) {
                return true;
            }
            // If searchPaths are being used, the extra file must be in a subfolder and match the pattern, if present
            if (queryProps.usingSearchPaths) {
                return !!queryProps.folderQueries && queryProps.folderQueries.some(fq => {
                    const searchPath = fq.folder.fsPath;
                    if (extpath.isEqualOrParent(fsPath, searchPath)) {
                        const relPath = paths.relative(searchPath, fsPath);
                        return !fq.includePattern || !!glob.match(fq.includePattern, relPath);
                    }
                    else {
                        return false;
                    }
                });
            }
            return false;
        }
        return true;
    }
    var SearchErrorCode;
    (function (SearchErrorCode) {
        SearchErrorCode[SearchErrorCode["unknownEncoding"] = 1] = "unknownEncoding";
        SearchErrorCode[SearchErrorCode["regexParseError"] = 2] = "regexParseError";
        SearchErrorCode[SearchErrorCode["globParseError"] = 3] = "globParseError";
        SearchErrorCode[SearchErrorCode["invalidLiteral"] = 4] = "invalidLiteral";
        SearchErrorCode[SearchErrorCode["rgProcessError"] = 5] = "rgProcessError";
        SearchErrorCode[SearchErrorCode["other"] = 6] = "other";
        SearchErrorCode[SearchErrorCode["canceled"] = 7] = "canceled";
    })(SearchErrorCode || (exports.SearchErrorCode = SearchErrorCode = {}));
    class SearchError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.SearchError = SearchError;
    function deserializeSearchError(error) {
        const errorMsg = error.message;
        if ((0, errors_1.isCancellationError)(error)) {
            return new SearchError(errorMsg, SearchErrorCode.canceled);
        }
        try {
            const details = JSON.parse(errorMsg);
            return new SearchError(details.message, details.code);
        }
        catch (e) {
            return new SearchError(errorMsg, SearchErrorCode.other);
        }
    }
    function serializeSearchError(searchError) {
        const details = { message: searchError.message, code: searchError.code };
        return new Error(JSON.stringify(details));
    }
    function isSerializedSearchComplete(arg) {
        if (arg.type === 'error') {
            return true;
        }
        else if (arg.type === 'success') {
            return true;
        }
        else {
            return false;
        }
    }
    function isSerializedSearchSuccess(arg) {
        return arg.type === 'success';
    }
    function isSerializedFileMatch(arg) {
        return !!arg.path;
    }
    function isFilePatternMatch(candidate, filePatternToUse, fuzzy = true) {
        const pathToMatch = candidate.searchPath ? candidate.searchPath : candidate.relativePath;
        return fuzzy ?
            (0, strings_1.fuzzyContains)(pathToMatch, filePatternToUse) :
            glob.match(filePatternToUse, pathToMatch);
    }
    class SerializableFileMatch {
        constructor(path) {
            this.path = path;
            this.results = [];
        }
        addMatch(match) {
            this.results.push(match);
        }
        serialize() {
            return {
                path: this.path,
                results: this.results,
                numMatches: this.results.length
            };
        }
    }
    exports.SerializableFileMatch = SerializableFileMatch;
    /**
     *  Computes the patterns that the provider handles. Discards sibling clauses and 'false' patterns
     */
    function resolvePatternsForProvider(globalPattern, folderPattern) {
        const merged = {
            ...(globalPattern || {}),
            ...(folderPattern || {})
        };
        return Object.keys(merged)
            .filter(key => {
            const value = merged[key];
            return typeof value === 'boolean' && value;
        });
    }
    class QueryGlobTester {
        constructor(config, folderQuery) {
            this._parsedIncludeExpression = null;
            this._excludeExpression = {
                ...(config.excludePattern || {}),
                ...(folderQuery.excludePattern || {})
            };
            this._parsedExcludeExpression = glob.parse(this._excludeExpression);
            // Empty includeExpression means include nothing, so no {} shortcuts
            let includeExpression = config.includePattern;
            if (folderQuery.includePattern) {
                if (includeExpression) {
                    includeExpression = {
                        ...includeExpression,
                        ...folderQuery.includePattern
                    };
                }
                else {
                    includeExpression = folderQuery.includePattern;
                }
            }
            if (includeExpression) {
                this._parsedIncludeExpression = glob.parse(includeExpression);
            }
        }
        matchesExcludesSync(testPath, basename, hasSibling) {
            if (this._parsedExcludeExpression && this._parsedExcludeExpression(testPath, basename, hasSibling)) {
                return true;
            }
            return false;
        }
        /**
         * Guaranteed sync - siblingsFn should not return a promise.
         */
        includedInQuerySync(testPath, basename, hasSibling) {
            if (this._parsedExcludeExpression && this._parsedExcludeExpression(testPath, basename, hasSibling)) {
                return false;
            }
            if (this._parsedIncludeExpression && !this._parsedIncludeExpression(testPath, basename, hasSibling)) {
                return false;
            }
            return true;
        }
        /**
         * Evaluating the exclude expression is only async if it includes sibling clauses. As an optimization, avoid doing anything with Promises
         * unless the expression is async.
         */
        includedInQuery(testPath, basename, hasSibling) {
            const excluded = this._parsedExcludeExpression(testPath, basename, hasSibling);
            const isIncluded = () => {
                return this._parsedIncludeExpression ?
                    !!(this._parsedIncludeExpression(testPath, basename, hasSibling)) :
                    true;
            };
            if ((0, async_1.isThenable)(excluded)) {
                return excluded.then(excluded => {
                    if (excluded) {
                        return false;
                    }
                    return isIncluded();
                });
            }
            return isIncluded();
        }
        hasSiblingExcludeClauses() {
            return hasSiblingClauses(this._excludeExpression);
        }
    }
    exports.QueryGlobTester = QueryGlobTester;
    function hasSiblingClauses(pattern) {
        for (const key in pattern) {
            if (typeof pattern[key] !== 'boolean') {
                return true;
            }
        }
        return false;
    }
    function hasSiblingPromiseFn(siblingsFn) {
        if (!siblingsFn) {
            return undefined;
        }
        let siblings;
        return (name) => {
            if (!siblings) {
                siblings = (siblingsFn() || Promise.resolve([]))
                    .then(list => list ? listToMap(list) : {});
            }
            return siblings.then(map => !!map[name]);
        };
    }
    function hasSiblingFn(siblingsFn) {
        if (!siblingsFn) {
            return undefined;
        }
        let siblings;
        return (name) => {
            if (!siblings) {
                const list = siblingsFn();
                siblings = list ? listToMap(list) : {};
            }
            return !!siblings[name];
        };
    }
    function listToMap(list) {
        const map = {};
        for (const key of list) {
            map[key] = true;
        }
        return map;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC9jb21tb24vc2VhcmNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdPaEcsc0NBRUM7SUFRRCxrQ0FFQztJQUVELDhDQUVDO0lBbU5ELGtDQWtCQztJQUVELGtEQTJCQztJQWtCRCx3REFhQztJQUVELG9EQUdDO0lBeURELGdFQVFDO0lBRUQsOERBRUM7SUFFRCxzREFFQztJQUVELGdEQUtDO0lBc0NELGdFQVdDO0lBa0dELGtEQWFDO0lBRUQsb0NBYUM7SUFqd0JRLDhHQUpBLDhDQUE2QixPQUlBO0lBRXpCLFFBQUEsVUFBVSxHQUFHLHVCQUF1QixDQUFDO0lBQ3JDLFFBQUEsUUFBUSxHQUFHLHdCQUF3QixDQUFDO0lBQ3BDLFFBQUEsT0FBTyxHQUFHLHVCQUF1QixDQUFDO0lBQ2xDLFFBQUEseUJBQXlCLEdBQUcsZUFBZSxDQUFDO0lBRTVDLFFBQUEscUJBQXFCLEdBQUcsZ0JBQWdCLENBQUM7SUFFdEQsK0VBQStFO0lBQy9FLGdFQUFnRTtJQUNoRSxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQztJQUNsQyxNQUFNLG9CQUFvQixHQUFHLHVCQUF1QixDQUFDO0lBQ3JELE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEdBQUcsb0JBQW9CLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVyRixRQUFBLGNBQWMsR0FBRyxJQUFBLCtCQUFlLEVBQWlCLGVBQWUsQ0FBQyxDQUFDO0lBZS9FOztPQUVHO0lBQ0gsSUFBa0Isa0JBSWpCO0lBSkQsV0FBa0Isa0JBQWtCO1FBQ25DLDJEQUFJLENBQUE7UUFDSiwyREFBSSxDQUFBO1FBQ0osK0RBQU0s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