/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchContext = exports.SearchCommandIds = void 0;
    var SearchCommandIds;
    (function (SearchCommandIds) {
        SearchCommandIds["FindInFilesActionId"] = "workbench.action.findInFiles";
        SearchCommandIds["FocusActiveEditorCommandId"] = "search.action.focusActiveEditor";
        SearchCommandIds["FocusSearchFromResults"] = "search.action.focusSearchFromResults";
        SearchCommandIds["OpenMatch"] = "search.action.openResult";
        SearchCommandIds["OpenMatchToSide"] = "search.action.openResultToSide";
        SearchCommandIds["RemoveActionId"] = "search.action.remove";
        SearchCommandIds["CopyPathCommandId"] = "search.action.copyPath";
        SearchCommandIds["CopyMatchCommandId"] = "search.action.copyMatch";
        SearchCommandIds["CopyAllCommandId"] = "search.action.copyAll";
        SearchCommandIds["OpenInEditorCommandId"] = "search.action.openInEditor";
        SearchCommandIds["ClearSearchHistoryCommandId"] = "search.action.clearHistory";
        SearchCommandIds["FocusSearchListCommandID"] = "search.action.focusSearchList";
        SearchCommandIds["ReplaceActionId"] = "search.action.replace";
        SearchCommandIds["ReplaceAllInFileActionId"] = "search.action.replaceAllInFile";
        SearchCommandIds["ReplaceAllInFolderActionId"] = "search.action.replaceAllInFolder";
        SearchCommandIds["CloseReplaceWidgetActionId"] = "closeReplaceInFilesWidget";
        SearchCommandIds["ToggleCaseSensitiveCommandId"] = "toggleSearchCaseSensitive";
        SearchCommandIds["ToggleWholeWordCommandId"] = "toggleSearchWholeWord";
        SearchCommandIds["ToggleRegexCommandId"] = "toggleSearchRegex";
        SearchCommandIds["TogglePreserveCaseId"] = "toggleSearchPreserveCase";
        SearchCommandIds["AddCursorsAtSearchResults"] = "addCursorsAtSearchResults";
        SearchCommandIds["RevealInSideBarForSearchResults"] = "search.action.revealInSideBar";
        SearchCommandIds["ReplaceInFilesActionId"] = "workbench.action.replaceInFiles";
        SearchCommandIds["ShowAllSymbolsActionId"] = "workbench.action.showAllSymbols";
        SearchCommandIds["QuickTextSearchActionId"] = "workbench.action.quickTextSearch";
        SearchCommandIds["CancelSearchActionId"] = "search.action.cancel";
        SearchCommandIds["RefreshSearchResultsActionId"] = "search.action.refreshSearchResults";
        SearchCommandIds["FocusNextSearchResultActionId"] = "search.action.focusNextSearchResult";
        SearchCommandIds["FocusPreviousSearchResultActionId"] = "search.action.focusPreviousSearchResult";
        SearchCommandIds["ToggleSearchOnTypeActionId"] = "workbench.action.toggleSearchOnType";
        SearchCommandIds["CollapseSearchResultsActionId"] = "search.action.collapseSearchResults";
        SearchCommandIds["ExpandSearchResultsActionId"] = "search.action.expandSearchResults";
        SearchCommandIds["ExpandRecursivelyCommandId"] = "search.action.expandRecursively";
        SearchCommandIds["ClearSearchResultsActionId"] = "search.action.clearSearchResults";
        SearchCommandIds["ViewAsTreeActionId"] = "search.action.viewAsTree";
        SearchCommandIds["ViewAsListActionId"] = "search.action.viewAsList";
        SearchCommandIds["ShowAIResultsActionId"] = "search.action.showAIResults";
        SearchCommandIds["HideAIResultsActionId"] = "search.action.hideAIResults";
        SearchCommandIds["ToggleQueryDetailsActionId"] = "workbench.action.search.toggleQueryDetails";
        SearchCommandIds["ExcludeFolderFromSearchId"] = "search.action.excludeFromSearch";
        SearchCommandIds["FocusNextInputActionId"] = "search.focus.nextInputBox";
        SearchCommandIds["FocusPreviousInputActionId"] = "search.focus.previousInputBox";
        SearchCommandIds["RestrictSearchToFolderId"] = "search.action.restrictSearchToFolder";
        SearchCommandIds["FindInFolderId"] = "filesExplorer.findInFolder";
        SearchCommandIds["FindInWorkspaceId"] = "filesExplorer.findInWorkspace";
    })(SearchCommandIds || (exports.SearchCommandIds = SearchCommandIds = {}));
    exports.SearchContext = {
        SearchViewVisibleKey: new contextkey_1.RawContextKey('searchViewletVisible', true),
        SearchViewFocusedKey: new contextkey_1.RawContextKey('searchViewletFocus', false),
        InputBoxFocusedKey: new contextkey_1.RawContextKey('inputBoxFocus', false),
        SearchInputBoxFocusedKey: new contextkey_1.RawContextKey('searchInputBoxFocus', false),
        ReplaceInputBoxFocusedKey: new contextkey_1.RawContextKey('replaceInputBoxFocus', false),
        PatternIncludesFocusedKey: new contextkey_1.RawContextKey('patternIncludesInputBoxFocus', false),
        PatternExcludesFocusedKey: new contextkey_1.RawContextKey('patternExcludesInputBoxFocus', false),
        ReplaceActiveKey: new contextkey_1.RawContextKey('replaceActive', false),
        HasSearchResults: new contextkey_1.RawContextKey('hasSearchResult', false),
        FirstMatchFocusKey: new contextkey_1.RawContextKey('firstMatchFocus', false),
        FileMatchOrMatchFocusKey: new contextkey_1.RawContextKey('fileMatchOrMatchFocus', false), // This is actually, Match or File or Folder
        FileMatchOrFolderMatchFocusKey: new contextkey_1.RawContextKey('fileMatchOrFolderMatchFocus', false),
        FileMatchOrFolderMatchWithResourceFocusKey: new contextkey_1.RawContextKey('fileMatchOrFolderMatchWithResourceFocus', false), // Excludes "Other files"
        FileFocusKey: new contextkey_1.RawContextKey('fileMatchFocus', false),
        FolderFocusKey: new contextkey_1.RawContextKey('folderMatchFocus', false),
        ResourceFolderFocusKey: new contextkey_1.RawContextKey('folderMatchWithResourceFocus', false),
        IsEditableItemKey: new contextkey_1.RawContextKey('isEditableItem', true),
        MatchFocusKey: new contextkey_1.RawContextKey('matchFocus', false),
        ViewHasSearchPatternKey: new contextkey_1.RawContextKey('viewHasSearchPattern', false),
        ViewHasReplacePatternKey: new contextkey_1.RawContextKey('viewHasReplacePattern', false),
        ViewHasFilePatternKey: new contextkey_1.RawContextKey('viewHasFilePattern', false),
        ViewHasSomeCollapsibleKey: new contextkey_1.RawContextKey('viewHasSomeCollapsibleResult', false),
        InTreeViewKey: new contextkey_1.RawContextKey('inTreeView', false),
        AIResultsVisibleKey: new contextkey_1.RawContextKey('AIResultsVisibleKey', false),
        hasAIResultProvider: new contextkey_1.RawContextKey('hasAIResultProviderKey', false),
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2NvbW1vbi9jb25zdGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSWhHLElBQWtCLGdCQThDakI7SUE5Q0QsV0FBa0IsZ0JBQWdCO1FBQ2pDLHdFQUFvRCxDQUFBO1FBQ3BELGtGQUE4RCxDQUFBO1FBQzlELG1GQUErRCxDQUFBO1FBQy9ELDBEQUFzQyxDQUFBO1FBQ3RDLHNFQUFrRCxDQUFBO1FBQ2xELDJEQUF1QyxDQUFBO1FBQ3ZDLGdFQUE0QyxDQUFBO1FBQzVDLGtFQUE4QyxDQUFBO1FBQzlDLDhEQUEwQyxDQUFBO1FBQzFDLHdFQUFvRCxDQUFBO1FBQ3BELDhFQUEwRCxDQUFBO1FBQzFELDhFQUEwRCxDQUFBO1FBQzFELDZEQUF5QyxDQUFBO1FBQ3pDLCtFQUEyRCxDQUFBO1FBQzNELG1GQUErRCxDQUFBO1FBQy9ELDRFQUF3RCxDQUFBO1FBQ3hELDhFQUEwRCxDQUFBO1FBQzFELHNFQUFrRCxDQUFBO1FBQ2xELDhEQUEwQyxDQUFBO1FBQzFDLHFFQUFpRCxDQUFBO1FBQ2pELDJFQUF1RCxDQUFBO1FBQ3ZELHFGQUFpRSxDQUFBO1FBQ2pFLDhFQUEwRCxDQUFBO1FBQzFELDhFQUEwRCxDQUFBO1FBQzFELGdGQUE0RCxDQUFBO1FBQzVELGlFQUE2QyxDQUFBO1FBQzdDLHVGQUFtRSxDQUFBO1FBQ25FLHlGQUFxRSxDQUFBO1FBQ3JFLGlHQUE2RSxDQUFBO1FBQzdFLHNGQUFrRSxDQUFBO1FBQ2xFLHlGQUFxRSxDQUFBO1FBQ3JFLHFGQUFpRSxDQUFBO1FBQ2pFLGtGQUE4RCxDQUFBO1FBQzlELG1GQUErRCxDQUFBO1FBQy9ELG1FQUErQyxDQUFBO1FBQy9DLG1FQUErQyxDQUFB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