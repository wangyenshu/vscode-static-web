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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/collections", "vs/base/common/glob", "vs/base/common/labels", "vs/base/common/map", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/model/textModelSearch", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/search/common/search"], function (require, exports, arrays, collections, glob, labels_1, map_1, network_1, path, resources_1, strings, types_1, uri_1, textModelSearch_1, nls, configuration_1, log_1, workspace_1, editorGroupsService_1, pathService_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QueryBuilder = void 0;
    exports.resolveResourcesForSearchIncludes = resolveResourcesForSearchIncludes;
    let QueryBuilder = class QueryBuilder {
        constructor(configurationService, workspaceContextService, editorGroupsService, logService, pathService) {
            this.configurationService = configurationService;
            this.workspaceContextService = workspaceContextService;
            this.editorGroupsService = editorGroupsService;
            this.logService = logService;
            this.pathService = pathService;
        }
        text(contentPattern, folderResources, options = {}) {
            contentPattern = this.getContentPattern(contentPattern, options);
            const searchConfig = this.configurationService.getValue();
            const fallbackToPCRE = folderResources && folderResources.some(folder => {
                const folderConfig = this.configurationService.getValue({ resource: folder });
                return !folderConfig.search.useRipgrep;
            });
            const commonQuery = this.commonQuery(folderResources?.map(workspace_1.toWorkspaceFolder), options);
            return {
                ...commonQuery,
                type: 2 /* QueryType.Text */,
                contentPattern,
                previewOptions: options.previewOptions,
                maxFileSize: options.maxFileSize,
                usePCRE2: searchConfig.search.usePCRE2 || fallbackToPCRE || false,
                beforeContext: options.beforeContext,
                afterContext: options.afterContext,
                userDisabledExcludesAndIgnoreFiles: options.disregardExcludeSettings && options.disregardIgnoreFiles,
            };
        }
        /**
         * Adjusts input pattern for config
         */
        getContentPattern(inputPattern, options) {
            const searchConfig = this.configurationService.getValue();
            if (inputPattern.isRegExp) {
                inputPattern.pattern = inputPattern.pattern.replace(/\r?\n/g, '\\n');
            }
            const newPattern = {
                ...inputPattern,
                wordSeparators: searchConfig.editor.wordSeparators
            };
            if (this.isCaseSensitive(inputPattern, options)) {
                newPattern.isCaseSensitive = true;
            }
            if (this.isMultiline(inputPattern)) {
                newPattern.isMultiline = true;
            }
            if (options.notebookSearchConfig?.includeMarkupInput) {
                if (!newPattern.notebookInfo) {
                    newPattern.notebookInfo = {};
                }
                newPattern.notebookInfo.isInNotebookMarkdownInput = options.notebookSearchConfig.includeMarkupInput;
            }
            if (options.notebookSearchConfig?.includeMarkupPreview) {
                if (!newPattern.notebookInfo) {
                    newPattern.notebookInfo = {};
                }
                newPattern.notebookInfo.isInNotebookMarkdownPreview = options.notebookSearchConfig.includeMarkupPreview;
            }
            if (options.notebookSearchConfig?.includeCodeInput) {
                if (!newPattern.notebookInfo) {
                    newPattern.notebookInfo = {};
                }
                newPattern.notebookInfo.isInNotebookCellInput = options.notebookSearchConfig.includeCodeInput;
            }
            if (options.notebookSearchConfig?.includeOutput) {
                if (!newPattern.notebookInfo) {
                    newPattern.notebookInfo = {};
                }
                newPattern.notebookInfo.isInNotebookCellOutput = options.notebookSearchConfig.includeOutput;
            }
            return newPattern;
        }
        file(folders, options = {}) {
            const commonQuery = this.commonQuery(folders, options);
            return {
                ...commonQuery,
                type: 1 /* QueryType.File */,
                filePattern: options.filePattern
                    ? options.filePattern.trim()
                    : options.filePattern,
                exists: options.exists,
                sortByScore: options.sortByScore,
                cacheKey: options.cacheKey,
                shouldGlobMatchFilePattern: options.shouldGlobSearch
            };
        }
        handleIncludeExclude(pattern, expandPatterns) {
            if (!pattern) {
                return {};
            }
            pattern = Array.isArray(pattern) ? pattern.map(normalizeSlashes) : normalizeSlashes(pattern);
            return expandPatterns
                ? this.parseSearchPaths(pattern)
                : { pattern: patternListToIExpression(...(Array.isArray(pattern) ? pattern : [pattern])) };
        }
        commonQuery(folderResources = [], options = {}) {
            const includeSearchPathsInfo = this.handleIncludeExclude(options.includePattern, options.expandPatterns);
            const excludeSearchPathsInfo = this.handleIncludeExclude(options.excludePattern, options.expandPatterns);
            // Build folderQueries from searchPaths, if given, otherwise folderResources
            const includeFolderName = folderResources.length > 1;
            const folderQueries = (includeSearchPathsInfo.searchPaths && includeSearchPathsInfo.searchPaths.length ?
                includeSearchPathsInfo.searchPaths.map(searchPath => this.getFolderQueryForSearchPath(searchPath, options, excludeSearchPathsInfo)) :
                folderResources.map(folder => this.getFolderQueryForRoot(folder, options, excludeSearchPathsInfo, includeFolderName)))
                .filter(query => !!query);
            const queryProps = {
                _reason: options._reason,
                folderQueries,
                usingSearchPaths: !!(includeSearchPathsInfo.searchPaths && includeSearchPathsInfo.searchPaths.length),
                extraFileResources: options.extraFileResources,
                excludePattern: excludeSearchPathsInfo.pattern,
                includePattern: includeSearchPathsInfo.pattern,
                onlyOpenEditors: options.onlyOpenEditors,
                maxResults: options.maxResults
            };
            if (options.onlyOpenEditors) {
                const openEditors = arrays.coalesce(arrays.flatten(this.editorGroupsService.groups.map(group => group.editors.map(editor => editor.resource))));
                this.logService.trace('QueryBuilder#commonQuery - openEditor URIs', JSON.stringify(openEditors));
                const openEditorsInQuery = openEditors.filter(editor => (0, search_1.pathIncludedInQuery)(queryProps, editor.fsPath));
                const openEditorsQueryProps = this.commonQueryFromFileList(openEditorsInQuery);
                this.logService.trace('QueryBuilder#commonQuery - openEditor Query', JSON.stringify(openEditorsQueryProps));
                return { ...queryProps, ...openEditorsQueryProps };
            }
            // Filter extraFileResources against global include/exclude patterns - they are already expected to not belong to a workspace
            const extraFileResources = options.extraFileResources && options.extraFileResources.filter(extraFile => (0, search_1.pathIncludedInQuery)(queryProps, extraFile.fsPath));
            queryProps.extraFileResources = extraFileResources && extraFileResources.length ? extraFileResources : undefined;
            return queryProps;
        }
        commonQueryFromFileList(files) {
            const folderQueries = [];
            const foldersToSearch = new map_1.ResourceMap();
            const includePattern = {};
            let hasIncludedFile = false;
            files.forEach(file => {
                if (file.scheme === network_1.Schemas.walkThrough) {
                    return;
                }
                const providerExists = (0, resources_1.isAbsolutePath)(file);
                // Special case userdata as we don't have a search provider for it, but it can be searched.
                if (providerExists) {
                    const searchRoot = this.workspaceContextService.getWorkspaceFolder(file)?.uri ?? file.with({ path: path.dirname(file.fsPath) });
                    let folderQuery = foldersToSearch.get(searchRoot);
                    if (!folderQuery) {
                        hasIncludedFile = true;
                        folderQuery = { folder: searchRoot, includePattern: {} };
                        folderQueries.push(folderQuery);
                        foldersToSearch.set(searchRoot, folderQuery);
                    }
                    const relPath = path.relative(searchRoot.fsPath, file.fsPath);
                    (0, types_1.assertIsDefined)(folderQuery.includePattern)[relPath.replace(/\\/g, '/')] = true;
                }
                else {
                    if (file.fsPath) {
                        hasIncludedFile = true;
                        includePattern[file.fsPath] = true;
                    }
                }
            });
            return {
                folderQueries,
                includePattern,
                usingSearchPaths: true,
                excludePattern: hasIncludedFile ? undefined : { '**/*': true }
            };
        }
        /**
         * Resolve isCaseSensitive flag based on the query and the isSmartCase flag, for search providers that don't support smart case natively.
         */
        isCaseSensitive(contentPattern, options) {
            if (options.isSmartCase) {
                if (contentPattern.isRegExp) {
                    // Consider it case sensitive if it contains an unescaped capital letter
                    if (strings.containsUppercaseCharacter(contentPattern.pattern, true)) {
                        return true;
                    }
                }
                else if (strings.containsUppercaseCharacter(contentPattern.pattern)) {
                    return true;
                }
            }
            return !!contentPattern.isCaseSensitive;
        }
        isMultiline(contentPattern) {
            if (contentPattern.isMultiline) {
                return true;
            }
            if (contentPattern.isRegExp && (0, textModelSearch_1.isMultilineRegexSource)(contentPattern.pattern)) {
                return true;
            }
            if (contentPattern.pattern.indexOf('\n') >= 0) {
                return true;
            }
            return !!contentPattern.isMultiline;
        }
        /**
         * Take the includePattern as seen in the search viewlet, and split into components that look like searchPaths, and
         * glob patterns. Glob patterns are expanded from 'foo/bar' to '{foo/bar/**, **\/foo/bar}.
         *
         * Public for test.
         */
        parseSearchPaths(pattern) {
            const isSearchPath = (segment) => {
                // A segment is a search path if it is an absolute path or starts with ./, ../, .\, or ..\
                return path.isAbsolute(segment) || /^\.\.?([\/\\]|$)/.test(segment);
            };
            const patterns = Array.isArray(pattern) ? pattern : splitGlobPattern(pattern);
            const segments = patterns
                .map(segment => {
                const userHome = this.pathService.resolvedUserHome;
                if (userHome) {
                    return (0, labels_1.untildify)(segment, userHome.scheme === network_1.Schemas.file ? userHome.fsPath : userHome.path);
                }
                return segment;
            });
            const groups = collections.groupBy(segments, segment => isSearchPath(segment) ? 'searchPaths' : 'exprSegments');
            const expandedExprSegments = (groups.exprSegments || [])
                .map(s => strings.rtrim(s, '/'))
                .map(s => strings.rtrim(s, '\\'))
                .map(p => {
                if (p[0] === '.') {
                    p = '*' + p; // convert ".js" to "*.js"
                }
                return expandGlobalGlob(p);
            });
            const result = {};
            const searchPaths = this.expandSearchPathPatterns(groups.searchPaths || []);
            if (searchPaths && searchPaths.length) {
                result.searchPaths = searchPaths;
            }
            const exprSegments = arrays.flatten(expandedExprSegments);
            const includePattern = patternListToIExpression(...exprSegments);
            if (includePattern) {
                result.pattern = includePattern;
            }
            return result;
        }
        getExcludesForFolder(folderConfig, options) {
            return options.disregardExcludeSettings ?
                undefined :
                (0, search_1.getExcludes)(folderConfig, !options.disregardSearchExcludeSettings);
        }
        /**
         * Split search paths (./ or ../ or absolute paths in the includePatterns) into absolute paths and globs applied to those paths
         */
        expandSearchPathPatterns(searchPaths) {
            if (!searchPaths || !searchPaths.length) {
                // No workspace => ignore search paths
                return [];
            }
            const expandedSearchPaths = searchPaths.flatMap(searchPath => {
                // 1 open folder => just resolve the search paths to absolute paths
                let { pathPortion, globPortion } = splitGlobFromPath(searchPath);
                if (globPortion) {
                    globPortion = normalizeGlobPattern(globPortion);
                }
                // One pathPortion to multiple expanded search paths (e.g. duplicate matching workspace folders)
                const oneExpanded = this.expandOneSearchPath(pathPortion);
                // Expanded search paths to multiple resolved patterns (with ** and without)
                return oneExpanded.flatMap(oneExpandedResult => this.resolveOneSearchPathPattern(oneExpandedResult, globPortion));
            });
            const searchPathPatternMap = new Map();
            expandedSearchPaths.forEach(oneSearchPathPattern => {
                const key = oneSearchPathPattern.searchPath.toString();
                const existing = searchPathPatternMap.get(key);
                if (existing) {
                    if (oneSearchPathPattern.pattern) {
                        existing.pattern = existing.pattern || {};
                        existing.pattern[oneSearchPathPattern.pattern] = true;
                    }
                }
                else {
                    searchPathPatternMap.set(key, {
                        searchPath: oneSearchPathPattern.searchPath,
                        pattern: oneSearchPathPattern.pattern ? patternListToIExpression(oneSearchPathPattern.pattern) : undefined
                    });
                }
            });
            return Array.from(searchPathPatternMap.values());
        }
        /**
         * Takes a searchPath like `./a/foo` or `../a/foo` and expands it to absolute paths for all the workspaces it matches.
         */
        expandOneSearchPath(searchPath) {
            if (path.isAbsolute(searchPath)) {
                const workspaceFolders = this.workspaceContextService.getWorkspace().folders;
                if (workspaceFolders[0] && workspaceFolders[0].uri.scheme !== network_1.Schemas.file) {
                    return [{
                            searchPath: workspaceFolders[0].uri.with({ path: searchPath })
                        }];
                }
                // Currently only local resources can be searched for with absolute search paths.
                // TODO convert this to a workspace folder + pattern, so excludes will be resolved properly for an absolute path inside a workspace folder
                return [{
                        searchPath: uri_1.URI.file(path.normalize(searchPath))
                    }];
            }
            if (this.workspaceContextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                const workspaceUri = this.workspaceContextService.getWorkspace().folders[0].uri;
                searchPath = normalizeSlashes(searchPath);
                if (searchPath.startsWith('../') || searchPath === '..') {
                    const resolvedPath = path.posix.resolve(workspaceUri.path, searchPath);
                    return [{
                            searchPath: workspaceUri.with({ path: resolvedPath })
                        }];
                }
                const cleanedPattern = normalizeGlobPattern(searchPath);
                return [{
                        searchPath: workspaceUri,
                        pattern: cleanedPattern
                    }];
            }
            else if (searchPath === './' || searchPath === '.\\') {
                return []; // ./ or ./**/foo makes sense for single-folder but not multi-folder workspaces
            }
            else {
                const searchPathWithoutDotSlash = searchPath.replace(/^\.[\/\\]/, '');
                const folders = this.workspaceContextService.getWorkspace().folders;
                const folderMatches = folders.map(folder => {
                    const match = searchPathWithoutDotSlash.match(new RegExp(`^${strings.escapeRegExpCharacters(folder.name)}(?:/(.*)|$)`));
                    return match ? {
                        match,
                        folder
                    } : null;
                }).filter(types_1.isDefined);
                if (folderMatches.length) {
                    return folderMatches.map(match => {
                        const patternMatch = match.match[1];
                        return {
                            searchPath: match.folder.uri,
                            pattern: patternMatch && normalizeGlobPattern(patternMatch)
                        };
                    });
                }
                else {
                    const probableWorkspaceFolderNameMatch = searchPath.match(/\.[\/\\](.+)[\/\\]?/);
                    const probableWorkspaceFolderName = probableWorkspaceFolderNameMatch ? probableWorkspaceFolderNameMatch[1] : searchPath;
                    // No root folder with name
                    const searchPathNotFoundError = nls.localize('search.noWorkspaceWithName', "Workspace folder does not exist: {0}", probableWorkspaceFolderName);
                    throw new Error(searchPathNotFoundError);
                }
            }
        }
        resolveOneSearchPathPattern(oneExpandedResult, globPortion) {
            const pattern = oneExpandedResult.pattern && globPortion ?
                `${oneExpandedResult.pattern}/${globPortion}` :
                oneExpandedResult.pattern || globPortion;
            const results = [
                {
                    searchPath: oneExpandedResult.searchPath,
                    pattern
                }
            ];
            if (pattern && !pattern.endsWith('**')) {
                results.push({
                    searchPath: oneExpandedResult.searchPath,
                    pattern: pattern + '/**'
                });
            }
            return results;
        }
        getFolderQueryForSearchPath(searchPath, options, searchPathExcludes) {
            const rootConfig = this.getFolderQueryForRoot((0, workspace_1.toWorkspaceFolder)(searchPath.searchPath), options, searchPathExcludes, false);
            if (!rootConfig) {
                return null;
            }
            return {
                ...rootConfig,
                ...{
                    includePattern: searchPath.pattern
                }
            };
        }
        getFolderQueryForRoot(folder, options, searchPathExcludes, includeFolderName) {
            let thisFolderExcludeSearchPathPattern;
            const folderUri = uri_1.URI.isUri(folder) ? folder : folder.uri;
            if (searchPathExcludes.searchPaths) {
                const thisFolderExcludeSearchPath = searchPathExcludes.searchPaths.filter(sp => (0, resources_1.isEqual)(sp.searchPath, folderUri))[0];
                if (thisFolderExcludeSearchPath && !thisFolderExcludeSearchPath.pattern) {
                    // entire folder is excluded
                    return null;
                }
                else if (thisFolderExcludeSearchPath) {
                    thisFolderExcludeSearchPathPattern = thisFolderExcludeSearchPath.pattern;
                }
            }
            const folderConfig = this.configurationService.getValue({ resource: folderUri });
            const settingExcludes = this.getExcludesForFolder(folderConfig, options);
            const excludePattern = {
                ...(settingExcludes || {}),
                ...(thisFolderExcludeSearchPathPattern || {})
            };
            const folderName = uri_1.URI.isUri(folder) ? (0, resources_1.basename)(folder) : folder.name;
            return {
                folder: folderUri,
                folderName: includeFolderName ? folderName : undefined,
                excludePattern: Object.keys(excludePattern).length > 0 ? excludePattern : undefined,
                fileEncoding: folderConfig.files && folderConfig.files.encoding,
                disregardIgnoreFiles: typeof options.disregardIgnoreFiles === 'boolean' ? options.disregardIgnoreFiles : !folderConfig.search.useIgnoreFiles,
                disregardGlobalIgnoreFiles: typeof options.disregardGlobalIgnoreFiles === 'boolean' ? options.disregardGlobalIgnoreFiles : !folderConfig.search.useGlobalIgnoreFiles,
                disregardParentIgnoreFiles: typeof options.disregardParentIgnoreFiles === 'boolean' ? options.disregardParentIgnoreFiles : !folderConfig.search.useParentIgnoreFiles,
                ignoreSymlinks: typeof options.ignoreSymlinks === 'boolean' ? options.ignoreSymlinks : !folderConfig.search.followSymlinks,
            };
        }
    };
    exports.QueryBuilder = QueryBuilder;
    exports.QueryBuilder = QueryBuilder = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, log_1.ILogService),
        __param(4, pathService_1.IPathService)
    ], QueryBuilder);
    function splitGlobFromPath(searchPath) {
        const globCharMatch = searchPath.match(/[\*\{\}\(\)\[\]\?]/);
        if (globCharMatch) {
            const globCharIdx = globCharMatch.index;
            const lastSlashMatch = searchPath.substr(0, globCharIdx).match(/[/|\\][^/\\]*$/);
            if (lastSlashMatch) {
                let pathPortion = searchPath.substr(0, lastSlashMatch.index);
                if (!pathPortion.match(/[/\\]/)) {
                    // If the last slash was the only slash, then we now have '' or 'C:' or '.'. Append a slash.
                    pathPortion += '/';
                }
                return {
                    pathPortion,
                    globPortion: searchPath.substr((lastSlashMatch.index || 0) + 1)
                };
            }
        }
        // No glob char, or malformed
        return {
            pathPortion: searchPath
        };
    }
    function patternListToIExpression(...patterns) {
        return patterns.length ?
            patterns.reduce((glob, cur) => { glob[cur] = true; return glob; }, Object.create(null)) :
            undefined;
    }
    function splitGlobPattern(pattern) {
        return glob.splitGlobAware(pattern, ',')
            .map(s => s.trim())
            .filter(s => !!s.length);
    }
    /**
     * Note - we used {} here previously but ripgrep can't handle nested {} patterns. See https://github.com/microsoft/vscode/issues/32761
     */
    function expandGlobalGlob(pattern) {
        const patterns = [
            `**/${pattern}/**`,
            `**/${pattern}`
        ];
        return patterns.map(p => p.replace(/\*\*\/\*\*/g, '**'));
    }
    function normalizeSlashes(pattern) {
        return pattern.replace(/\\/g, '/');
    }
    /**
     * Normalize slashes, remove `./` and trailing slashes
     */
    function normalizeGlobPattern(pattern) {
        return normalizeSlashes(pattern)
            .replace(/^\.\//, '')
            .replace(/\/+$/g, '');
    }
    /**
     * Escapes a path for use as a glob pattern that would match the input precisely.
     * Characters '?', '*', '[', and ']' are escaped into character range glob syntax
     * (for example, '?' becomes '[?]').
     * NOTE: This implementation makes no special cases for UNC paths. For example,
     * given the input "//?/C:/A?.txt", this would produce output '//[?]/C:/A[?].txt',
     * which may not be desirable in some cases. Use with caution if UNC paths could be expected.
     */
    function escapeGlobPattern(path) {
        return path.replace(/([?*[\]])/g, '[$1]');
    }
    /**
     * Construct an include pattern from a list of folders uris to search in.
     */
    function resolveResourcesForSearchIncludes(resources, contextService) {
        resources = arrays.distinct(resources, resource => resource.toString());
        const folderPaths = [];
        const workspace = contextService.getWorkspace();
        if (resources) {
            resources.forEach(resource => {
                let folderPath;
                if (contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                    // Show relative path from the root for single-root mode
                    folderPath = (0, resources_1.relativePath)(workspace.folders[0].uri, resource); // always uses forward slashes
                    if (folderPath && folderPath !== '.') {
                        folderPath = './' + folderPath;
                    }
                }
                else {
                    const owningFolder = contextService.getWorkspaceFolder(resource);
                    if (owningFolder) {
                        const owningRootName = owningFolder.name;
                        // If this root is the only one with its basename, use a relative ./ path. If there is another, use an absolute path
                        const isUniqueFolder = workspace.folders.filter(folder => folder.name === owningRootName).length === 1;
                        if (isUniqueFolder) {
                            const relPath = (0, resources_1.relativePath)(owningFolder.uri, resource); // always uses forward slashes
                            if (relPath === '') {
                                folderPath = `./${owningFolder.name}`;
                            }
                            else {
                                folderPath = `./${owningFolder.name}/${relPath}`;
                            }
                        }
                        else {
                            folderPath = resource.fsPath; // TODO rob: handle non-file URIs
                        }
                    }
                }
                if (folderPath) {
                    folderPaths.push(escapeGlobPattern(folderPath));
                }
            });
        }
        return folderPaths;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlCdWlsZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC9jb21tb24vcXVlcnlCdWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFuQmhHLDhFQXdDQztJQXJrQk0sSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBWTtRQUV4QixZQUN5QyxvQkFBMkMsRUFDeEMsdUJBQWlELEVBQ3JELG1CQUF5QyxFQUNsRCxVQUF1QixFQUN0QixXQUF5QjtZQUpoQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3hDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDckQsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUNsRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3RCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1FBRXpELENBQUM7UUFFRCxJQUFJLENBQUMsY0FBNEIsRUFBRSxlQUF1QixFQUFFLFVBQW9DLEVBQUU7WUFDakcsY0FBYyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBd0IsQ0FBQztZQUVoRixNQUFNLGNBQWMsR0FBRyxlQUFlLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDdkUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBdUIsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDcEcsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO1lBQ3hDLENBQUMsQ0FBQyxDQUFD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