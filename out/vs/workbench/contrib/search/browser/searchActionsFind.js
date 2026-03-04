define(["require", "exports", "vs/base/common/resources", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/list/browser/listService", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/services/editor/common/editorService", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/contrib/files/browser/files", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/files/common/files", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/errors", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/base/common/network"], function (require, exports, resources_1, nls, commands_1, configuration_1, listService_1, viewsService_1, Constants, SearchEditorConstants, searchModel_1, editorService_1, contextkey_1, actions_1, queryBuilder_1, files_1, files_2, workspace_1, files_3, panecomposite_1, errors_1, searchActionsBase_1, configurationResolver_1, history_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findInFilesCommand = findInFilesCommand;
    //#endregion
    (0, actions_1.registerAction2)(class RestrictSearchToFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.restrictSearchToFolder" /* Constants.SearchCommandIds.RestrictSearchToFolderId */,
                title: nls.localize2('restrictResultsToFolder', "Restrict Search to Folder"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.ResourceFolderFocusKey),
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
                },
                menu: [
                    {
                        id: actions_1.MenuId.SearchContext,
                        group: 'search',
                        order: 3,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ResourceFolderFocusKey)
                    }
                ]
            });
        }
        async run(accessor, folderMatch) {
            await searchWithFolderCommand(accessor, false, true, undefined, folderMatch);
        }
    });
    (0, actions_1.registerAction2)(class ExpandSelectedTreeCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.expandRecursively" /* Constants.SearchCommandIds.ExpandRecursivelyCommandId */,
                title: nls.localize('search.expandRecursively', "Expand Recursively"),
                category: searchActionsBase_1.category,
                menu: [{
                        id: actions_1.MenuId.SearchContext,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(Constants.SearchContext.FileFocusKey, Constants.SearchContext.FolderFocusKey), Constants.SearchContext.HasSearchResults),
                        group: 'search',
                        order: 4
                    }]
            });
        }
        async run(accessor) {
            await expandSelectSubtree(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ExcludeFolderFromSearchAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.excludeFromSearch" /* Constants.SearchCommandIds.ExcludeFolderFromSearchId */,
                title: nls.localize2('excludeFolderFromSearch', "Exclude Folder from Search"),
                category: searchActionsBase_1.category,
                menu: [
                    {
                        id: actions_1.MenuId.SearchContext,
                        group: 'search',
                        order: 4,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ResourceFolderFocusKey)
                    }
                ]
            });
        }
        async run(accessor, folderMatch) {
            await searchWithFolderCommand(accessor, false, false, undefined, folderMatch);
        }
    });
    (0, actions_1.registerAction2)(class RevealInSideBarForSearchResultsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.revealInSideBar" /* Constants.SearchCommandIds.RevealInSideBarForSearchResults */,
                title: nls.localize2('revealInSideBar', "Reveal in Explorer View"),
                category: searchActionsBase_1.category,
                menu: [{
                        id: actions_1.MenuId.SearchContext,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.FileFocusKey, Constants.SearchContext.HasSearchResults),
                        group: 'search_3',
                        order: 1
                    }]
            });
        }
        async run(accessor, args) {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const explorerService = accessor.get(files_1.IExplorerService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (!searchView) {
                return;
            }
            let fileMatch;
            if (!(args instanceof searchModel_1.FileMatch)) {
                args = searchView.getControl().getFocus()[0];
            }
            if (args instanceof searchModel_1.FileMatch) {
                fileMatch = args;
            }
            else {
                return;
            }
            paneCompositeService.openPaneComposite(files_3.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, false).then((viewlet) => {
                if (!viewlet) {
                    return;
                }
                const explorerViewContainer = viewlet.getViewPaneContainer();
                const uri = fileMatch.resource;
                if (uri && contextService.isInsideWorkspace(uri)) {
                    const explorerView = explorerViewContainer.getExplorerView();
                    explorerView.setExpanded(true);
                    explorerService.select(uri, true).then(() => explorerView.focus(), errors_1.onUnexpectedError);
                }
            });
        }
    });
    // Find in Files by default is the same as View: Show Search, but can be configured to open a search editor instead with the `search.mode` binding
    (0, actions_1.registerAction2)(class FindInFilesAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "workbench.action.findInFiles" /* Constants.SearchCommandIds.FindInFilesActionId */,
                title: {
                    ...nls.localize2('findInFiles', "Find in Files"),
                    mnemonicTitle: nls.localize({ key: 'miFindInFiles', comment: ['&& denotes a mnemonic'] }, "Find &&in Files"),
                },
                metadata: {
                    description: nls.localize('findInFiles.description', "Open a workspace search"),
                    args: [
                        {
                            name: nls.localize('findInFiles.args', "A set of options for the search"),
                            schema: {
                                type: 'object',
                                properties: {
                                    query: { 'type': 'string' },
                                    replace: { 'type': 'string' },
                                    preserveCase: { 'type': 'boolean' },
                                    triggerSearch: { 'type': 'boolean' },
                                    filesToInclude: { 'type': 'string' },
                                    filesToExclude: { 'type': 'string' },
                                    isRegex: { 'type': 'boolean' },
                                    isCaseSensitive: { 'type': 'boolean' },
                                    matchWholeWord: { 'type': 'boolean' },
                                    useExcludeSettingsAndIgnoreFiles: { 'type': 'boolean' },
                                    onlyOpenEditors: { 'type': 'boolean' },
                                }
                            }
                        },
                    ]
                },
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 36 /* KeyCode.KeyF */,
                },
                menu: [{
                        id: actions_1.MenuId.MenubarEditMenu,
                        group: '4_find_global',
                        order: 1,
                    }],
                f1: true
            });
        }
        async run(accessor, args = {}) {
            findInFilesCommand(accessor, args);
        }
    });
    (0, actions_1.registerAction2)(class FindInFolderAction extends actions_1.Action2 {
        // from explorer
        constructor() {
            super({
                id: "filesExplorer.findInFolder" /* Constants.SearchCommandIds.FindInFolderId */,
                title: nls.localize2('findInFolder', "Find in Folder..."),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(files_3.FilesExplorerFocusCondition, files_3.ExplorerFolderContext),
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
                },
                menu: [
                    {
                        id: actions_1.MenuId.ExplorerContext,
                        group: '4_search',
                        order: 10,
                        when: contextkey_1.ContextKeyExpr.and(files_3.ExplorerFolderContext)
                    }
                ]
            });
        }
        async run(accessor, resource) {
            await searchWithFolderCommand(accessor, true, true, resource);
        }
    });
    (0, actions_1.registerAction2)(class FindInWorkspaceAction extends actions_1.Action2 {
        // from explorer
        constructor() {
            super({
                id: "filesExplorer.findInWorkspace" /* Constants.SearchCommandIds.FindInWorkspaceId */,
                title: nls.localize2('findInWorkspace', "Find in Workspace..."),
                category: searchActionsBase_1.category,
                menu: [
                    {
                        id: actions_1.MenuId.ExplorerContext,
                        group: '4_search',
                        order: 10,
                        when: contextkey_1.ContextKeyExpr.and(files_3.ExplorerRootContext, files_3.ExplorerFolderContext.toNegated())
                    }
                ]
            });
        }
        async run(accessor) {
            const searchConfig = accessor.get(configuration_1.IConfigurationService).getValue().search;
            const mode = searchConfig.mode;
            if (mode === 'view') {
                const searchView = await (0, searchActionsBase_1.openSearchView)(accessor.get(viewsService_1.IViewsService), true);
                searchView?.searchInFolders();
            }
            else {
                return accessor.get(commands_1.ICommandService).executeCommand(SearchEditorConstants.OpenEditorCommandId, {
                    location: mode === 'newEditor' ? 'new' : 'reuse',
                    filesToInclude: '',
                });
            }
        }
    });
    //#region Helpers
    function expandSelectSubtree(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        if (searchView) {
            const viewer = searchView.getControl();
            const selected = viewer.getFocus()[0];
            viewer.expand(selected, true);
        }
    }
    async function searchWithFolderCommand(accessor, isFromExplorer, isIncludes, resource, folderMatch) {
        const listService = accessor.get(listService_1.IListService);
        const fileService = accessor.get(files_2.IFileService);
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const contextService = accessor.get(workspace_1.IWorkspaceContextService);
        const commandService = accessor.get(commands_1.ICommandService);
        const searchConfig = accessor.get(configuration_1.IConfigurationService).getValue().search;
        const mode = searchConfig.mode;
        let resources;
        if (isFromExplorer) {
            resources = (0, files_1.getMultiSelectedResources)(resource, listService, accessor.get(editorService_1.IEditorService), accessor.get(files_1.IExplorerService));
        }
        else {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (!searchView) {
                return;
            }
            resources = getMultiSelectedSearchResources(searchView.getControl(), folderMatch, searchConfig);
        }
        const resolvedResources = fileService.resolveAll(resources.map(resource => ({ resource }))).then(results => {
            const folders = [];
            results.forEach(result => {
                if (result.success && result.stat) {
                    folders.push(result.stat.isDirectory ? result.stat.resource : (0, resources_1.dirname)(result.stat.resource));
                }
            });
            return (0, queryBuilder_1.resolveResourcesForSearchIncludes)(folders, contextService);
        });
        if (mode === 'view') {
            const searchView = await (0, searchActionsBase_1.openSearchView)(viewsService, true);
            if (resources && resources.length && searchView) {
                if (isIncludes) {
                    searchView.searchInFolders(await resolvedResources);
                }
                else {
                    searchView.searchOutsideOfFolders(await resolvedResources);
                }
            }
            return undefined;
        }
        else {
            if (isIncludes) {
                return commandService.executeCommand(SearchEditorConstants.OpenEditorCommandId, {
                    filesToInclude: (await resolvedResources).join(', '),
                    showIncludesExcludes: true,
                    location: mode === 'newEditor' ? 'new' : 'reuse',
                });
            }
            else {
                return commandService.executeCommand(SearchEditorConstants.OpenEditorCommandId, {
                    filesToExclude: (await resolvedResources).join(', '),
                    showIncludesExcludes: true,
                    location: mode === 'newEditor' ? 'new' : 'reuse',
                });
            }
        }
    }
    function getMultiSelectedSearchResources(viewer, currElement, sortConfig) {
        return (0, searchActionsBase_1.getElementsToOperateOn)(viewer, currElement, sortConfig)
            .map((renderableMatch) => ((renderableMatch instanceof searchModel_1.Match) ? null : renderableMatch.resource))
            .filter((renderableMatch) => (renderableMatch !== null));
    }
    async function findInFilesCommand(accessor, _args = {}) {
        const searchConfig = accessor.get(configuration_1.IConfigurationService).getValue().search;
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const commandService = accessor.get(commands_1.ICommandService);
        const args = {};
        if (Object.keys(_args).length !== 0) {
            // resolve variables in the same way as in
            // https://github.com/microsoft/vscode/blob/8b76efe9d317d50cb5b57a7658e09ce6ebffaf36/src/vs/workbench/contrib/searchEditor/browser/searchEditorActions.ts#L152-L158
            const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
            const historyService = accessor.get(history_1.IHistoryService);
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot();
            const filteredActiveWorkspaceRootUri = activeWorkspaceRootUri?.scheme === network_1.Schemas.file || activeWorkspaceRootUri?.scheme === network_1.Schemas.vscodeRemote ? activeWorkspaceRootUri : undefined;
            const lastActiveWorkspaceRoot = filteredActiveWorkspaceRootUri ? workspaceContextService.getWorkspaceFolder(filteredActiveWorkspaceRootUri) ?? undefined : undefined;
            for (const entry of Object.entries(_args)) {
                const name = entry[0];
                const value = entry[1];
                if (value !== undefined) {
                    args[name] = (typeof value === 'string') ? await configurationResolverService.resolveAsync(lastActiveWorkspaceRoot, value) : value;
                }
            }
        }
        const mode = searchConfig.mode;
        if (mode === 'view') {
            (0, searchActionsBase_1.openSearchView)(viewsService, false).then(openedView => {
                if (openedView) {
                    const searchAndReplaceWidget = openedView.searchAndReplaceWidget;
                    searchAndReplaceWidget.toggleReplace(typeof args.replace === 'string');
                    let updatedText = false;
                    if (typeof args.query !== 'string') {
                        updatedText = openedView.updateTextFromFindWidgetOrSelection({ allowUnselectedWord: typeof args.replace !== 'string' });
                    }
                    openedView.setSearchParameters(args);
                    openedView.searchAndReplaceWidget.focus(undefined, updatedText, updatedText);
                }
            });
        }
        else {
            const convertArgs = (args) => ({
                location: mode === 'newEditor' ? 'new' : 'reuse',
                query: args.query,
                filesToInclude: args.filesToInclude,
                filesToExclude: args.filesToExclude,
                matchWholeWord: args.matchWholeWord,
                isCaseSensitive: args.isCaseSensitive,
                isRegexp: args.isRegex,
                useExcludeSettingsAndIgnoreFiles: args.useExcludeSettingsAndIgnoreFiles,
                onlyOpenEditors: args.onlyOpenEditors,
                showIncludesExcludes: !!(args.filesToExclude || args.filesToExclude || !args.useExcludeSettingsAndIgnoreFiles),
            });
            commandService.executeCommand(SearchEditorConstants.OpenEditorCommandId, convertArgs(args));
        }
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc0ZpbmQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9zZWFyY2hBY3Rpb25zRmluZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFvWEEsZ0RBdURDO0lBeFhELFlBQVk7SUFFWixJQUFBLHlCQUFlLEVBQUMsTUFBTSw0QkFBNkIsU0FBUSxpQkFBTztRQUNqRTtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLGtHQUFxRDtnQkFDdkQsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMseUJBQXlCLEVBQUUsMkJBQTJCLENBQUM7Z0JBQzVFLFFBQVEsRUFBUiw0QkFBUTtnQkFDUixVQUFVLEVBQUU7b0JBQ1gsTUFBTSw2Q0FBbUM7b0JBQ3pDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLG9CQUFvQixFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsc0JBQXNCLENBQUM7b0JBQ3RILE9BQU8sRUFBRSw4Q0FBeUIsd0JBQWU7aUJBQ2pEO2dCQUNELElBQUksRUFBRTtvQkFDTDt3QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxhQUFhO3dCQUN4QixLQUFLLEVBQUUsUUFBUTt3QkFDZixLQUFLLEVBQUUsQ0FBQzt3QkFDUixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBQztxQkFDeEU7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLFdBQXFDO1lBQzFFLE1BQU0sdUJBQXVCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxD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