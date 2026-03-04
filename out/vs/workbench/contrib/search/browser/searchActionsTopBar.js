/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/list/browser/listService", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/search/common/searchHistoryService", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/services/search/common/search", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/contrib/search/common/search", "vs/workbench/contrib/search/browser/searchActionsBase"], function (require, exports, nls, listService_1, viewsService_1, searchIcons_1, Constants, searchHistoryService_1, searchModel_1, search_1, contextkey_1, actions_1, search_2, searchActionsBase_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Actions
    (0, actions_1.registerAction2)(class ClearSearchHistoryCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.clearHistory" /* Constants.SearchCommandIds.ClearSearchHistoryCommandId */,
                title: nls.localize2('clearSearchHistoryLabel', "Clear Search History"),
                category: searchActionsBase_1.category,
                f1: true
            });
        }
        async run(accessor) {
            clearHistoryCommand(accessor);
        }
    });
    (0, actions_1.registerAction2)(class CancelSearchAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.cancel" /* Constants.SearchCommandIds.CancelSearchActionId */,
                title: nls.localize2('CancelSearchAction.label', "Cancel Search"),
                icon: searchIcons_1.searchStopIcon,
                category: searchActionsBase_1.category,
                f1: true,
                precondition: search_2.SearchStateKey.isEqualTo(search_2.SearchUIState.Idle).negate(),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, listService_1.WorkbenchListFocusContextKey),
                    primary: 9 /* KeyCode.Escape */,
                },
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 0,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), search_2.SearchStateKey.isEqualTo(search_2.SearchUIState.SlowSearch)),
                    }]
            });
        }
        run(accessor) {
            return cancelSearch(accessor);
        }
    });
    (0, actions_1.registerAction2)(class RefreshAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.refreshSearchResults" /* Constants.SearchCommandIds.RefreshSearchResultsActionId */,
                title: nls.localize2('RefreshAction.label', "Refresh"),
                icon: searchIcons_1.searchRefreshIcon,
                precondition: Constants.SearchContext.ViewHasSearchPatternKey,
                category: searchActionsBase_1.category,
                f1: true,
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 0,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), search_2.SearchStateKey.isEqualTo(search_2.SearchUIState.SlowSearch).negate()),
                    }]
            });
        }
        run(accessor, ...args) {
            return refreshSearch(accessor);
        }
    });
    (0, actions_1.registerAction2)(class CollapseDeepestExpandedLevelAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.collapseSearchResults" /* Constants.SearchCommandIds.CollapseSearchResultsActionId */,
                title: nls.localize2('CollapseDeepestExpandedLevelAction.label', "Collapse All"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchCollapseAllIcon,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.HasSearchResults, Constants.SearchContext.ViewHasSomeCollapsibleKey),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 4,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), contextkey_1.ContextKeyExpr.or(Constants.SearchContext.HasSearchResults.negate(), Constants.SearchContext.ViewHasSomeCollapsibleKey)),
                    }]
            });
        }
        run(accessor, ...args) {
            return collapseDeepestExpandedLevel(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ExpandAllAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.expandSearchResults" /* Constants.SearchCommandIds.ExpandSearchResultsActionId */,
                title: nls.localize2('ExpandAllAction.label', "Expand All"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchExpandAllIcon,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.HasSearchResults, Constants.SearchContext.ViewHasSomeCollapsibleKey.toNegated()),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 4,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), Constants.SearchContext.HasSearchResults, Constants.SearchContext.ViewHasSomeCollapsibleKey.toNegated()),
                    }]
            });
        }
        run(accessor, ...args) {
            return expandAll(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ClearSearchResultsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.clearSearchResults" /* Constants.SearchCommandIds.ClearSearchResultsActionId */,
                title: nls.localize2('ClearSearchResultsAction.label', "Clear Search Results"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchClearIcon,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.or(Constants.SearchContext.HasSearchResults, Constants.SearchContext.ViewHasSearchPatternKey, Constants.SearchContext.ViewHasReplacePatternKey, Constants.SearchContext.ViewHasFilePatternKey),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 1,
                        when: contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID),
                    }]
            });
        }
        run(accessor, ...args) {
            return clearSearchResults(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ViewAsTreeAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.viewAsTree" /* Constants.SearchCommandIds.ViewAsTreeActionId */,
                title: nls.localize2('ViewAsTreeAction.label', "View as Tree"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchShowAsList,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.HasSearchResults, Constants.SearchContext.InTreeViewKey.toNegated()),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), Constants.SearchContext.InTreeViewKey.toNegated()),
                    }]
            });
        }
        run(accessor, ...args) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                searchView.setTreeView(true);
            }
        }
    });
    (0, actions_1.registerAction2)(class ViewAsListAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.viewAsList" /* Constants.SearchCommandIds.ViewAsListActionId */,
                title: nls.localize2('ViewAsListAction.label', "View as List"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchShowAsTree,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.HasSearchResults, Constants.SearchContext.InTreeViewKey),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID), Constants.SearchContext.InTreeViewKey),
                    }]
            });
        }
        run(accessor, ...args) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                searchView.setTreeView(false);
            }
        }
    });
    //#endregion
    //#region Helpers
    const clearHistoryCommand = accessor => {
        const searchHistoryService = accessor.get(searchHistoryService_1.ISearchHistoryService);
        searchHistoryService.clearHistory();
    };
    function expandAll(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        if (searchView) {
            const viewer = searchView.getControl();
            viewer.expandAll();
        }
    }
    function clearSearchResults(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        searchView?.clearSearchResults();
    }
    function cancelSearch(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        searchView?.cancelSearch();
    }
    function refreshSearch(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        searchView?.triggerQueryChange({ preserveFocus: false });
    }
    function collapseDeepestExpandedLevel(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        if (searchView) {
            const viewer = searchView.getControl();
            /**
             * one level to collapse so collapse everything. If FolderMatch, check if there are visible grandchildren,
             * i.e. if Matches are returned by the navigator, and if so, collapse to them, otherwise collapse all levels.
             */
            const navigator = viewer.navigate();
            let node = navigator.first();
            let canCollapseFileMatchLevel = false;
            let canCollapseFirstLevel = false;
            if (node instanceof searchModel_1.FolderMatchWorkspaceRoot || searchView.isTreeLayoutViewVisible) {
                while (node = navigator.next()) {
                    if (node instanceof searchModel_1.Match) {
                        canCollapseFileMatchLevel = true;
                        break;
                    }
                    if (searchView.isTreeLayoutViewVisible && !canCollapseFirstLevel) {
                        let nodeToTest = node;
                        if (node instanceof searchModel_1.FolderMatch) {
                            const compressionStartNode = viewer.getCompressedTreeNode(node).element?.elements[0];
                            // Match elements should never be compressed, so !(compressionStartNode instanceof Match) should always be true here
                            nodeToTest = (compressionStartNode && !(compressionStartNode instanceof searchModel_1.Match)) ? compressionStartNode : node;
                        }
                        const immediateParent = nodeToTest.parent();
                        if (!(immediateParent instanceof searchModel_1.FolderMatchWorkspaceRoot || immediateParent instanceof searchModel_1.FolderMatchNoRoot || immediateParent instanceof searchModel_1.SearchResult)) {
                            canCollapseFirstLevel = true;
                        }
                    }
                }
            }
            if (canCollapseFileMatchLevel) {
                node = navigator.first();
                do {
                    if (node instanceof searchModel_1.FileMatch) {
                        viewer.collapse(node);
                    }
                } while (node = navigator.next());
            }
            else if (canCollapseFirstLevel) {
                node = navigator.first();
                if (node) {
                    do {
                        let nodeToTest = node;
                        if (node instanceof searchModel_1.FolderMatch) {
                            const compressionStartNode = viewer.getCompressedTreeNode(node).element?.elements[0];
                            // Match elements should never be compressed, so !(compressionStartNode instanceof Match) should always be true here
                            nodeToTest = (compressionStartNode && !(compressionStartNode instanceof searchModel_1.Match)) ? compressionStartNode : node;
                        }
                        const immediateParent = nodeToTest.parent();
                        if (immediateParent instanceof searchModel_1.FolderMatchWorkspaceRoot || immediateParent instanceof searchModel_1.FolderMatchNoRoot) {
                            if (viewer.hasElement(node)) {
                                viewer.collapse(node, true);
                            }
                            else {
                                viewer.collapseAll();
                            }
                        }
                    } while (node = navigator.next());
                }
            }
            else {
                viewer.collapseAll();
            }
            const firstFocusParent = viewer.getFocus()[0]?.parent();
            if (firstFocusParent && (firstFocusParent instanceof searchModel_1.FolderMatch || firstFocusParent instanceof searchModel_1.FileMatch) &&
                viewer.hasElement(firstFocusParent) && viewer.isCollapsed(firstFocusParent)) {
                viewer.domFocus();
                viewer.focusFirst();
                viewer.setSelection(viewer.getFocus());
            }
        }
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc1RvcEJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9icm93c2VyL3NlYXJjaEFjdGlvbnNUb3BCYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLGlCQUFpQjtJQUNqQixJQUFBLHlCQUFlLEVBQUMsTUFBTSwrQkFBZ0MsU0FBUSxpQkFBTztRQUVwRTtZQUVDLEtBQUssQ0FBQztnQkFDTCxFQUFFLDJGQUF3RDtnQkFDMUQsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMseUJBQXlCLEVBQUUsc0JBQXNCLENBQUM7Z0JBQ3ZFLFFBQVEsRUFBUiw0QkFBUTtnQkFDUixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUVKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQzVDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsTUFBTSxrQkFBbUIsU0FBUSxpQkFBTztRQUN2RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLDhFQUFpRDtnQkFDbkQsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsMEJBQTBCLEVBQUUsZUFBZSxDQUFDO2dCQUNqRSxJQUFJLEVBQUUsNEJBQWM7Z0JBQ3BCLFFBQVEsRUFBUiw0QkFBUTtnQkFDUixFQUFFLEVBQUUsSUFBSTtnQkFDUixZQUFZLEVBQUUsdUJBQWMsQ0FBQyxTQUFTLENBQUMsc0JBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUU7Z0JBQ25FLFVBQVUsRUFBRTtvQkFDWCxNQUFNLDZDQUFtQztvQkFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FB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