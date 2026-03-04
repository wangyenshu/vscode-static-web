/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/editor/contrib/quickAccess/browser/gotoLineQuickAccess", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/quickinput/common/quickAccess", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/browser/quickaccess", "vs/workbench/common/views", "vs/workbench/contrib/codeEditor/browser/quickaccess/gotoSymbolQuickAccess", "vs/workbench/contrib/search/browser/anythingQuickAccess", "vs/workbench/contrib/search/browser/replaceContributions", "vs/workbench/contrib/search/browser/notebookSearch/notebookSearchContributions", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/browser/searchView", "vs/workbench/contrib/search/browser/searchWidget", "vs/workbench/contrib/search/browser/symbolsQuickAccess", "vs/workbench/contrib/search/common/searchHistoryService", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/services/search/common/search", "vs/platform/commands/common/commands", "vs/base/common/types", "vs/workbench/contrib/search/common/search", "vs/workbench/contrib/search/browser/quickTextSearch/textSearchQuickAccess", "vs/workbench/common/configuration", "vs/workbench/contrib/search/browser/searchActionsCopy", "vs/workbench/contrib/search/browser/searchActionsFind", "vs/workbench/contrib/search/browser/searchActionsNav", "vs/workbench/contrib/search/browser/searchActionsRemoveReplace", "vs/workbench/contrib/search/browser/searchActionsSymbol", "vs/workbench/contrib/search/browser/searchActionsTopBar", "vs/workbench/contrib/search/browser/searchActionsTextQuickAccess"], function (require, exports, platform, gotoLineQuickAccess_1, nls, configurationRegistry_1, contextkey_1, descriptors_1, extensions_1, quickAccess_1, platform_1, viewPaneContainer_1, quickaccess_1, views_1, gotoSymbolQuickAccess_1, anythingQuickAccess_1, replaceContributions_1, notebookSearchContributions_1, searchIcons_1, searchView_1, searchWidget_1, symbolsQuickAccess_1, searchHistoryService_1, searchModel_1, search_1, commands_1, types_1, search_2, textSearchQuickAccess_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(searchModel_1.ISearchViewModelWorkbenchService, searchModel_1.SearchViewModelWorkbenchService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(searchHistoryService_1.ISearchHistoryService, searchHistoryService_1.SearchHistoryService, 1 /* InstantiationType.Delayed */);
    (0, replaceContributions_1.registerContributions)();
    (0, notebookSearchContributions_1.registerContributions)();
    (0, searchWidget_1.registerContributions)();
    const SEARCH_MODE_CONFIG = 'search.mode';
    const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: search_1.VIEWLET_ID,
        title: nls.localize2('search', "Search"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [search_1.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }]),
        hideIfEmpty: true,
        icon: searchIcons_1.searchViewIcon,
        order: 1,
    }, 0 /* ViewContainerLocation.Sidebar */, { doNotRegisterOpenCommand: true });
    const viewDescriptor = {
        id: search_1.VIEW_ID,
        containerIcon: searchIcons_1.searchViewIcon,
        name: nls.localize2('search', "Search"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(searchView_1.SearchView),
        canToggleVisibility: false,
        canMoveView: true,
        openCommandActionDescriptor: {
            id: viewContainer.id,
            mnemonicTitle: nls.localize({ key: 'miViewSearch', comment: ['&& denotes a mnemonic'] }, "&&Search"),
            keybindings: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 36 /* KeyCode.KeyF */,
                // Yes, this is weird. See #116188, #115556, #115511, and now #124146, for examples of what can go wrong here.
                when: contextkey_1.ContextKeyExpr.regex('neverMatch', /doesNotMatch/)
            },
            order: 1
        }
    };
    // Register search default location to sidebar
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([viewDescriptor], viewContainer);
    // Register Quick Access Handler
    const quickAccessRegistry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: anythingQuickAccess_1.AnythingQuickAccessProvider,
        prefix: anythingQuickAccess_1.AnythingQuickAccessProvider.PREFIX,
        placeholder: nls.localize('anythingQuickAccessPlaceholder', "Search files by name (append {0} to go to line or {1} to go to symbol)", gotoLineQuickAccess_1.AbstractGotoLineQuickAccessProvider.PREFIX, gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider.PREFIX),
        contextKey: quickaccess_1.defaultQuickAccessContextKeyValue,
        helpEntries: [{
                description: nls.localize('anythingQuickAccess', "Go to File"),
                commandId: 'workbench.action.quickOpen',
                commandCenterOrder: 10
            }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: symbolsQuickAccess_1.SymbolsQuickAccessProvider,
        prefix: symbolsQuickAccess_1.SymbolsQuickAccessProvider.PREFIX,
        placeholder: nls.localize('symbolsQuickAccessPlaceholder', "Type the name of a symbol to open."),
        contextKey: 'inWorkspaceSymbolsPicker',
        helpEntries: [{ description: nls.localize('symbolsQuickAccess', "Go to Symbol in Workspace"), commandId: "workbench.action.showAllSymbols" /* Constants.SearchCommandIds.ShowAllSymbolsActionId */ }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: textSearchQuickAccess_1.TextSearchQuickAccess,
        prefix: textSearchQuickAccess_1.TEXT_SEARCH_QUICK_ACCESS_PREFIX,
        contextKey: 'inTextSearchPicker',
        placeholder: nls.localize('textSearchPickerPlaceholder', "Search for text in your workspace files."),
        helpEntries: [
            {
                description: nls.localize('textSearchPickerHelp', "Search for Text"),
                commandId: "workbench.action.quickTextSearch" /* Constants.SearchCommandIds.QuickTextSearchActionId */,
                commandCenterOrder: 25,
            }
        ]
    });
    // Configuration
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'search',
        order: 13,
        title: nls.localize('searchConfigurationTitle', "Search"),
        type: 'object',
        properties: {
            [search_1.SEARCH_EXCLUDE_CONFIG]: {
                type: 'object',
                markdownDescription: nls.localize('exclude', "Configure [glob patterns](https://code.visualstudio.com/docs/editor/codebasics#_advanced-search-options) for excluding files and folders in fulltext searches and file search in quick open. To exclude files from the recently opened list in quick open, patterns must be absolute (for example `**/node_modules/**`). Inherits all glob patterns from the `#files.exclude#` setting."),
                default: { '**/node_modules': true, '**/bower_components': true, '**/*.code-search': true },
                additionalProperties: {
                    anyOf: [
                        {
                            type: 'boolean',
                            description: nls.localize('exclude.boolean', "The glob pattern to match file paths against. Set to true or false to enable or disable the pattern."),
                        },
                        {
                            type: 'object',
                            properties: {
                                when: {
                                    type: 'string', // expression ({ "**/*.js": { "when": "$(basename).js" } })
                                    pattern: '\\w*\\$\\(basename\\)\\w*',
                                    default: '$(basename).ext',
                                    markdownDescription: nls.localize({ key: 'exclude.when', comment: ['\\$(basename) should not be translated'] }, 'Additional check on the siblings of a matching file. Use \\$(basename) as variable for the matching file name.')
                                }
                            }
                        }
                    ]
                },
                scope: 4 /* ConfigurationScope.RESOURCE */
            },
            [SEARCH_MODE_CONFIG]: {
                type: 'string',
                enum: ['view', 'reuseEditor', 'newEditor'],
                default: 'view',
                markdownDescription: nls.localize('search.mode', "Controls where new `Search: Find in Files` and `Find in Folder` operations occur: either in the search view, or in a search editor."),
                enumDescriptions: [
                    nls.localize('search.mode.view', "Search in the search view, either in the panel or side bars."),
                    nls.localize('search.mode.reuseEditor', "Search in an existing search editor if present, otherwise in a new search editor."),
                    nls.localize('search.mode.newEditor', "Search in a new search editor."),
                ]
            },
            'search.useRipgrep': {
                type: 'boolean',
                description: nls.localize('useRipgrep', "This setting is deprecated and now falls back on \"search.usePCRE2\"."),
                deprecationMessage: nls.localize('useRipgrepDeprecated', "Deprecated. Consider \"search.usePCRE2\" for advanced regex feature support."),
                default: true
            },
            'search.maintainFileSearchCache': {
                type: 'boolean',
                deprecationMessage: nls.localize('maintainFileSearchCacheDeprecated', "The search cache is kept in the extension host which never shuts down, so this setting is no longer needed."),
                description: nls.localize('search.maintainFileSearchCache', "When enabled, the searchService process will be kept alive instead of being shut down after an hour of inactivity. This will keep the file search cache in memory."),
                default: false
            },
            'search.useIgnoreFiles': {
                type: 'boolean',
                markdownDescription: nls.localize('useIgnoreFiles', "Controls whether to use `.gitignore` and `.ignore` files when searching for files."),
                default: true,
                scope: 4 /* ConfigurationScope.RESOURCE */
            },
            'search.useGlobalIgnoreFiles': {
                type: 'boolean',
                markdownDescription: nls.localize('useGlobalIgnoreFiles', "Controls whether to use your global gitignore file (for example, from `$HOME/.config/git/ignore`) when searching for files. Requires `#search.useIgnoreFiles#` to be enabled."),
                default: false,
                scope: 4 /* ConfigurationScope.RESOURCE */
            },
            'search.useParentIgnoreFiles': {
                type: 'boolean',
                markdownDescription: nls.localize('useParentIgnoreFiles', "Controls whether to use `.gitignore` and `.ignore` files in parent directories when searching for files. Requires `#search.useIgnoreFiles#` to be enabled."),
                default: false,
                scope: 4 /* ConfigurationScope.RESOURCE */
            },
            'search.quickOpen.includeSymbols': {
                type: 'boolean',
                description: nls.localize('search.quickOpen.includeSymbols', "Whether to include results from a global symbol search in the file results for Quick Open."),
                default: false
            },
            'search.quickOpen.includeHistory': {
                type: 'boolean',
                description: nls.localize('search.quickOpen.includeHistory', "Whether to include results from recently opened files in the file results for Quick Open."),
                default: true
            },
            'search.quickOpen.history.filterSortOrder': {
                type: 'string',
                enum: ['default', 'recency'],
                default: 'default',
                enumDescriptions: [
                    nls.localize('filterSortOrder.default', 'History entries are sorted by relevance based on the filter value used. More relevant entries appear first.'),
                    nls.localize('filterSortOrder.recency', 'History entries are sorted by recency. More recently opened entries appear first.')
                ],
                description: nls.localize('filterSortOrder', "Controls sorting order of editor history in quick open when filtering.")
            },
            'search.followSymlinks': {
                type: 'boolean',
                description: nls.localize('search.followSymlinks', "Controls whether to follow symlinks while searching."),
                default: true
            },
            'search.smartCase': {
                type: 'boolean',
                description: nls.localize('search.smartCase', "Search case-insensitively if the pattern is all lowercase, otherwise, search case-sensitively."),
                default: false
            },
            'search.globalFindClipboard': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.globalFindClipboard', "Controls whether the search view should read or modify the shared find clipboard on macOS."),
                included: platform.isMacintosh
            },
            'search.location': {
                type: 'string',
                enum: ['sidebar', 'panel'],
                default: 'sidebar',
                description: nls.localize('search.location', "Controls whether the search will be shown as a view in the sidebar or as a panel in the panel area for more horizontal space."),
                deprecationMessage: nls.localize('search.location.deprecationMessage', "This setting is deprecated. You can drag the search icon to a new location instead.")
            },
            'search.maxResults': {
                type: ['number', 'null'],
                default: 20000,
                markdownDescription: nls.localize('search.maxResults', "Controls the maximum number of search results, this can be set to `null` (empty) to return unlimited results.")
            },
            'search.collapseResults': {
                type: 'string',
                enum: ['auto', 'alwaysCollapse', 'alwaysExpand'],
                enumDescriptions: [
                    nls.localize('search.collapseResults.auto', "Files with less than 10 results are expanded. Others are collapsed."),
                    '',
                    ''
                ],
                default: 'alwaysExpand',
                description: nls.localize('search.collapseAllResults', "Controls whether the search results will be collapsed or expanded."),
            },
            'search.useReplacePreview': {
                type: 'boolean',
                default: true,
                description: nls.localize('search.useReplacePreview', "Controls whether to open Replace Preview when selecting or replacing a match."),
            },
            'search.showLineNumbers': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.showLineNumbers', "Controls whether to show line numbers for search results."),
            },
            'search.usePCRE2': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.usePCRE2', "Whether to use the PCRE2 regex engine in text search. This enables using some advanced regex features like lookahead and backreferences. However, not all PCRE2 features are supported - only features that are also supported by JavaScript."),
                deprecationMessage: nls.localize('usePCRE2Deprecated', "Deprecated. PCRE2 will be used automatically when using regex features that are only supported by PCRE2."),
            },
            'search.actionsPosition': {
                type: 'string',
                enum: ['auto', 'right'],
                enumDescriptions: [
                    nls.localize('search.actionsPositionAuto', "Position the actionbar to the right when the search view is narrow, and immediately after the content when the search view is wide."),
                    nls.localize('search.actionsPositionRight', "Always position the actionbar to the right."),
                ],
                default: 'right',
                description: nls.localize('search.actionsPosition', "Controls the positioning of the actionbar on rows in the search view.")
            },
            'search.searchOnType': {
                type: 'boolean',
                default: true,
                description: nls.localize('search.searchOnType', "Search all files as you type.")
            },
            'search.seedWithNearestWord': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.seedWithNearestWord', "Enable seeding search from the word nearest the cursor when the active editor has no selection.")
            },
            'search.seedOnFocus': {
                type: 'boolean',
                default: false,
                markdownDescription: nls.localize('search.seedOnFocus', "Update the search query to the editor's selected text when focusing the search view. This happens either on click or when triggering the `workbench.views.search.focus` command.")
            },
            'search.searchOnTypeDebouncePeriod': {
                type: 'number',
                default: 300,
                markdownDescription: nls.localize('search.searchOnTypeDebouncePeriod', "When {0} is enabled, controls the timeout in milliseconds between a character being typed and the search starting. Has no effect when {0} is disabled.", '`#search.searchOnType#`')
            },
            'search.searchEditor.doubleClickBehaviour': {
                type: 'string',
                enum: ['selectWord', 'goToLocation', 'openLocationToSide'],
                default: 'goToLocation',
                enumDescriptions: [
                    nls.localize('search.searchEditor.doubleClickBehaviour.selectWord', "Double-clicking selects the word under the cursor."),
                    nls.localize('search.searchEditor.doubleClickBehaviour.goToLocation', "Double-clicking opens the result in the active editor group."),
                    nls.localize('search.searchEditor.doubleClickBehaviour.openLocationToSide', "Double-clicking opens the result in the editor group to the side, creating one if it does not yet exist."),
                ],
                markdownDescription: nls.localize('search.searchEditor.doubleClickBehaviour', "Configure effect of double-clicking a result in a search editor.")
            },
            'search.searchEditor.singleClickBehaviour': {
                type: 'string',
                enum: ['default', 'peekDefinition',],
                default: 'default',
                enumDescriptions: [
                    nls.localize('search.searchEditor.singleClickBehaviour.default', "Single-clicking does nothing."),
                    nls.localize('search.searchEditor.singleClickBehaviour.peekDefinition', "Single-clicking opens a Peek Definition window."),
                ],
                markdownDescription: nls.localize('search.searchEditor.singleClickBehaviour', "Configure effect of single-clicking a result in a search editor.")
            },
            'search.searchEditor.reusePriorSearchConfiguration': {
                type: 'boolean',
                default: false,
                markdownDescription: nls.localize({ key: 'search.searchEditor.reusePriorSearchConfiguration', comment: ['"Search Editor" is a type of editor that can display search results. "includes, excludes, and flags" refers to the "files to include" and "files to exclude" input boxes, and the flags that control whether a query is case-sensitive or a regex.'] }, "When enabled, new Search Editors will reuse the includes, excludes, and flags of the previously opened Search Editor.")
            },
            'search.searchEditor.defaultNumberOfContextLines': {
                type: ['number', 'null'],
                default: 1,
                markdownDescription: nls.localize('search.searchEditor.defaultNumberOfContextLines', "The default number of surrounding context lines to use when creating new Search Editors. If using `#search.searchEditor.reusePriorSearchConfiguration#`, this can be set to `null` (empty) to use the prior Search Editor's configuration.")
            },
            'search.sortOrder': {
                type: 'string',
                enum: ["default" /* SearchSortOrder.Default */, "fileNames" /* SearchSortOrder.FileNames */, "type" /* SearchSortOrder.Type */, "modified" /* SearchSortOrder.Modified */, "countDescending" /* SearchSortOrder.CountDescending */, "countAscending" /* SearchSortOrder.CountAscending */],
                default: "default" /* SearchSortOrder.Default */,
                enumDescriptions: [
                    nls.localize('searchSortOrder.default', "Results are sorted by folder and file names, in alphabetical order."),
                    nls.localize('searchSortOrder.filesOnly', "Results are sorted by file names ignoring folder order, in alphabetical order."),
                    nls.localize('searchSortOrder.type', "Results are sorted by file extensions, in alphabetical order."),
                    nls.localize('searchSortOrder.modified', "Results are sorted by file last modified date, in descending order."),
                    nls.localize('searchSortOrder.countDescending', "Results are sorted by count per file, in descending order."),
                    nls.localize('searchSortOrder.countAscending', "Results are sorted by count per file, in ascending order.")
                ],
                description: nls.localize('search.sortOrder', "Controls sorting order of search results.")
            },
            'search.decorations.colors': {
                type: 'boolean',
                description: nls.localize('search.decorations.colors', "Controls whether search file decorations should use colors."),
                default: true
            },
            'search.decorations.badges': {
                type: 'boolean',
                description: nls.localize('search.decorations.badges', "Controls whether search file decorations should use badges."),
                default: true
            },
            'search.defaultViewMode': {
                type: 'string',
                enum: ["tree" /* ViewMode.Tree */, "list" /* ViewMode.List */],
                default: "list" /* ViewMode.List */,
                enumDescriptions: [
                    nls.localize('scm.defaultViewMode.tree', "Shows search results as a tree."),
                    nls.localize('scm.defaultViewMode.list', "Shows search results as a list.")
                ],
                description: nls.localize('search.defaultViewMode', "Controls the default search result view mode.")
            },
            'search.quickAccess.preserveInput': {
                type: 'boolean',
                description: nls.localize('search.quickAccess.preserveInput', "Controls whether the last typed input to Quick Search should be restored when opening it the next time."),
                default: false
            },
            'search.experimental.closedNotebookRichContentResults': {
                type: 'boolean',
                description: nls.localize('search.experimental.closedNotebookResults', "Show notebook editor rich content results for closed notebooks. Please refresh your search results after changing this setting."),
                default: false
            },
        }
    });
    commands_1.CommandsRegistry.registerCommand('_executeWorkspaceSymbolProvider', async function (accessor, ...args) {
        const [query] = args;
        (0, types_1.assertType)(typeof query === 'string');
        const result = await (0, search_2.getWorkspaceSymbols)(query);
        return result.map(item => item.symbol);
    });
    // todo: @andreamah get rid of this after a few iterations
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'search.experimental.quickAccess.preserveInput',
            migrateFn: (value, _accessor) => ([
                ['search.quickAccess.preserveInput', { value }],
                ['search.experimental.quickAccess.preserveInput', { value: undefined }]
            ])
        }]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9icm93c2VyL3NlYXJjaC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF5Q2hHLElBQUEsOEJBQWlCLEVBQUMsOENBQWdDLEVBQUUsNkNBQStCLG9DQUE0QixDQUFDO0lBQ2hILElBQUEsOEJBQWlCLEVBQUMsNENBQXFCLEVBQUUsMkNBQW9CLG9DQUE0QixDQUFDO0lBRTFGLElBQUEsNENBQW9CLEdBQUUsQ0FBQztJQUN2QixJQUFBLG1EQUEyQixHQUFFLENBQUM7SUFDOUIsSUFBQSxvQ0FBeUIsR0FBRSxDQUFDO0lBRTVCLE1BQU0sa0JBQWtCLEdBQUcsYUFBYSxDQUFDO0lBRXpDLE1BQU0sYUFBYSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUEwQixrQkFBYyxDQUFDLHNCQUFzQixDQUFDLENBQUMscUJBQXFCLENBQUM7UUFDdkgsRUFBRSxFQUFFLG1CQUFVO1FBQ2QsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQztRQUN4QyxjQUFjLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHFDQUFpQixFQUFFLENBQUMsbUJBQVUsRUFBRSxFQUFFLG9DQUFvQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbkgsV0FBVyxFQUFFLElBQUk7UUFDakIsSUFBSSxFQUFFLDRCQUFjO1FBQ3BCLEtBQUssRUFBRSxDQUFDO0tBQ1IseUNBQWlDLEVBQUUsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUV0RSxNQUFNLGNBQWMsR0FBb0I7UUFDdkMsRUFBRSxFQUFFLGdCQUFPO1FBQ1gsYUFBYSxFQUFFLDRCQUFjO1FBQzdC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