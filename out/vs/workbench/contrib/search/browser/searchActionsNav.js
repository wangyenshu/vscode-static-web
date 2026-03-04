/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/nls", "vs/platform/configuration/common/configuration", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/services/editor/common/editorService", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/platform/actions/common/actions", "vs/editor/contrib/find/browser/findModel", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/platform/accessibility/common/accessibility", "vs/base/browser/dom"], function (require, exports, platform_1, nls, configuration_1, viewsService_1, Constants, SearchEditorConstants, searchModel_1, searchEditorInput_1, editorService_1, contextkey_1, types_1, actions_1, findModel_1, searchActionsBase_1, accessibility_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Actions: Changing Search Input Options
    (0, actions_1.registerAction2)(class ToggleQueryDetailsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "workbench.action.search.toggleQueryDetails" /* Constants.SearchCommandIds.ToggleQueryDetailsActionId */,
                title: nls.localize2('ToggleQueryDetailsAction.label', "Toggle Query Details"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.or(Constants.SearchContext.SearchViewFocusedKey, SearchEditorConstants.InSearchEditor),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 40 /* KeyCode.KeyJ */,
                },
            });
        }
        run(accessor, ...args) {
            const contextService = accessor.get(contextkey_1.IContextKeyService).getContext((0, dom_1.getActiveElement)());
            if (contextService.getValue(SearchEditorConstants.InSearchEditor.serialize())) {
                accessor.get(editorService_1.IEditorService).activeEditorPane.toggleQueryDetails(args[0]?.show);
            }
            else if (contextService.getValue(Constants.SearchContext.SearchViewFocusedKey.serialize())) {
                const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
                (0, types_1.assertIsDefined)(searchView).toggleQueryDetails(undefined, args[0]?.show);
            }
        }
    });
    (0, actions_1.registerAction2)(class CloseReplaceAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "closeReplaceInFilesWidget" /* Constants.SearchCommandIds.CloseReplaceWidgetActionId */,
                title: nls.localize2('CloseReplaceWidget.label', "Close Replace Widget"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.ReplaceInputBoxFocusedKey),
                    primary: 9 /* KeyCode.Escape */,
                },
            });
        }
        run(accessor) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                searchView.searchAndReplaceWidget.toggleReplace(false);
                searchView.searchAndReplaceWidget.focus();
            }
            return Promise.resolve(null);
        }
    });
    (0, actions_1.registerAction2)(class ToggleCaseSensitiveCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "toggleSearchCaseSensitive" /* Constants.SearchCommandIds.ToggleCaseSensitiveCommandId */,
                title: nls.localize2('ToggleCaseSensitiveCommandId.label', "Toggle Case Sensitive"),
                category: searchActionsBase_1.category,
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: platform_1.isMacintosh ? contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewFocusedKey, Constants.SearchContext.FileMatchOrFolderMatchFocusKey.toNegated()) : Constants.SearchContext.SearchViewFocusedKey,
                }, findModel_1.ToggleCaseSensitiveKeybinding)
            });
        }
        async run(accessor) {
            toggleCaseSensitiveCommand(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ToggleWholeWordCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "toggleSearchWholeWord" /* Constants.SearchCommandIds.ToggleWholeWordCommandId */,
                title: nls.localize2('ToggleWholeWordCommandId.label', "Toggle Whole Word"),
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: Constants.SearchContext.SearchViewFocusedKey,
                }, findModel_1.ToggleWholeWordKeybinding),
                category: searchActionsBase_1.category,
            });
        }
        async run(accessor) {
            return toggleWholeWordCommand(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ToggleRegexCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "toggleSearchRegex" /* Constants.SearchCommandIds.ToggleRegexCommandId */,
                title: nls.localize2('ToggleRegexCommandId.label', "Toggle Regex"),
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: Constants.SearchContext.SearchViewFocusedKey,
                }, findModel_1.ToggleRegexKeybinding),
                category: searchActionsBase_1.category,
            });
        }
        async run(accessor) {
            return toggleRegexCommand(accessor);
        }
    });
    (0, actions_1.registerAction2)(class TogglePreserveCaseAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "toggleSearchPreserveCase" /* Constants.SearchCommandIds.TogglePreserveCaseId */,
                title: nls.localize2('TogglePreserveCaseId.label', "Toggle Preserve Case"),
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: Constants.SearchContext.SearchViewFocusedKey,
                }, findModel_1.TogglePreserveCaseKeybinding),
                category: searchActionsBase_1.category,
            });
        }
        async run(accessor) {
            return togglePreserveCaseCommand(accessor);
        }
    });
    //#endregion
    //#region Actions: Opening Matches
    (0, actions_1.registerAction2)(class OpenMatchAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.openResult" /* Constants.SearchCommandIds.OpenMatch */,
                title: nls.localize2('OpenMatch.label', "Open Match"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.FileMatchOrMatchFocusKey),
                    primary: 3 /* KeyCode.Enter */,
                    mac: {
                        primary: 3 /* KeyCode.Enter */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
                    },
                },
            });
        }
        run(accessor) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                const viewer = searchView.getControl();
                const focus = tree.getFocus()[0];
                if (focus instanceof searchModel_1.FolderMatch) {
                    viewer.toggleCollapsed(focus);
                }
                else {
                    searchView.open(tree.getFocus()[0], false, false, true);
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class OpenMatchToSideAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.openResultToSide" /* Constants.SearchCommandIds.OpenMatchToSide */,
                title: nls.localize2('OpenMatchToSide.label', "Open Match To Side"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.FileMatchOrMatchFocusKey),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */
                    },
                },
            });
        }
        run(accessor) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                searchView.open(tree.getFocus()[0], false, true, true);
            }
        }
    });
    (0, actions_1.registerAction2)(class AddCursorsAtSearchResultsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "addCursorsAtSearchResults" /* Constants.SearchCommandIds.AddCursorsAtSearchResults */,
                title: nls.localize2('AddCursorsAtSearchResults.label', "Add Cursors at Search Results"),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.FileMatchOrMatchFocusKey),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 42 /* KeyCode.KeyL */,
                },
                category: searchActionsBase_1.category,
            });
        }
        async run(accessor) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                searchView.openEditorWithMultiCursor(tree.getFocus()[0]);
            }
        }
    });
    //#endregion
    //#region Actions: Toggling Focus
    (0, actions_1.registerAction2)(class FocusNextInputAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.focus.nextInputBox" /* Constants.SearchCommandIds.FocusNextInputActionId */,
                title: nls.localize2('FocusNextInputAction.label', "Focus Next Input"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, Constants.SearchContext.InputBoxFocusedKey), contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.InputBoxFocusedKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                },
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
                editorService.activeEditorPane.focusNextInput();
            }
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            searchView?.focusNextInputBox();
        }
    });
    (0, actions_1.registerAction2)(class FocusPreviousInputAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.focus.previousInputBox" /* Constants.SearchCommandIds.FocusPreviousInputActionId */,
                title: nls.localize2('FocusPreviousInputAction.label', "Focus Previous Input"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, Constants.SearchContext.InputBoxFocusedKey), contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.InputBoxFocusedKey, Constants.SearchContext.SearchInputBoxFocusedKey.toNegated())),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                },
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
                editorService.activeEditorPane.focusPrevInput();
            }
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            searchView?.focusPreviousInputBox();
        }
    });
    (0, actions_1.registerAction2)(class FocusSearchFromResultsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.focusSearchFromResults" /* Constants.SearchCommandIds.FocusSearchFromResults */,
                title: nls.localize2('FocusSearchFromResults.label', "Focus Search From Results"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, contextkey_1.ContextKeyExpr.or(Constants.SearchContext.FirstMatchFocusKey, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                },
            });
        }
        run(accessor) {
            const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
            searchView?.focusPreviousInputBox();
        }
    });
    (0, actions_1.registerAction2)(class ToggleSearchOnTypeAction extends actions_1.Action2 {
        static { this.searchOnTypeKey = 'search.searchOnType'; }
        constructor() {
            super({
                id: "workbench.action.toggleSearchOnType" /* Constants.SearchCommandIds.ToggleSearchOnTypeActionId */,
                title: nls.localize2('toggleTabs', "Toggle Search on Type"),
                category: searchActionsBase_1.category,
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const searchOnType = configurationService.getValue(ToggleSearchOnTypeAction.searchOnTypeKey);
            return configurationService.updateValue(ToggleSearchOnTypeAction.searchOnTypeKey, !searchOnType);
        }
    });
    (0, actions_1.registerAction2)(class FocusSearchListCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.focusSearchList" /* Constants.SearchCommandIds.FocusSearchListCommandID */,
                title: nls.localize2('focusSearchListCommandLabel', "Focus List"),
                category: searchActionsBase_1.category,
                f1: true
            });
        }
        async run(accessor) {
            focusSearchListCommand(accessor);
        }
    });
    (0, actions_1.registerAction2)(class FocusNextSearchResultAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.focusNextSearchResult" /* Constants.SearchCommandIds.FocusNextSearchResultActionId */,
                title: nls.localize2('FocusNextSearchResult.label', "Focus Next Search Result"),
                keybinding: [{
                        primary: 62 /* KeyCode.F4 */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    }],
                category: searchActionsBase_1.category,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.or(Constants.SearchContext.HasSearchResults, SearchEditorConstants.InSearchEditor),
            });
        }
        async run(accessor) {
            return await focusNextSearchResult(accessor);
        }
    });
    (0, actions_1.registerAction2)(class FocusPreviousSearchResultAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.focusPreviousSearchResult" /* Constants.SearchCommandIds.FocusPreviousSearchResultActionId */,
                title: nls.localize2('FocusPreviousSearchResult.label', "Focus Previous Search Result"),
                keybinding: [{
                        primary: 1024 /* KeyMod.Shift */ | 62 /* KeyCode.F4 */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    }],
                category: searchActionsBase_1.category,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.or(Constants.SearchContext.HasSearchResults, SearchEditorConstants.InSearchEditor),
            });
        }
        async run(accessor) {
            return await focusPreviousSearchResult(accessor);
        }
    });
    (0, actions_1.registerAction2)(class ReplaceInFilesAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "workbench.action.replaceInFiles" /* Constants.SearchCommandIds.ReplaceInFilesActionId */,
                title: nls.localize2('replaceInFiles', "Replace in Files"),
                keybinding: [{
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 38 /* KeyCode.KeyH */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    }],
                category: searchActionsBase_1.category,
                f1: true,
                menu: [{
                        id: actions_1.MenuId.MenubarEditMenu,
                        group: '4_find_global',
                        order: 2
                    }],
            });
        }
        async run(accessor) {
            return await findOrReplaceInFiles(accessor, true);
        }
    });
    //#endregion
    //#region Helpers
    function toggleCaseSensitiveCommand(accessor) {
        const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
        searchView?.toggleCaseSensitive();
    }
    function toggleWholeWordCommand(accessor) {
        const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
        searchView?.toggleWholeWords();
    }
    function toggleRegexCommand(accessor) {
        const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
        searchView?.toggleRegex();
    }
    function togglePreserveCaseCommand(accessor) {
        const searchView = (0, searchActionsBase_1.getSearchView)(accessor.get(viewsService_1.IViewsService));
        searchView?.togglePreserveCase();
    }
    const focusSearchListCommand = accessor => {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        (0, searchActionsBase_1.openSearchView)(viewsService).then(searchView => {
            searchView?.moveFocusToResults();
        });
    };
    async function focusNextSearchResult(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
            return editorService.activeEditorPane.focusNextResult();
        }
        return (0, searchActionsBase_1.openSearchView)(accessor.get(viewsService_1.IViewsService)).then(searchView => {
            searchView?.selectNextMatch();
        });
    }
    async function focusPreviousSearchResult(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
            return editorService.activeEditorPane.focusPreviousResult();
        }
        return (0, searchActionsBase_1.openSearchView)(accessor.get(viewsService_1.IViewsService)).then(searchView => {
            searchView?.selectPreviousMatch();
        });
    }
    async function findOrReplaceInFiles(accessor, expandSearchReplaceWidget) {
        return (0, searchActionsBase_1.openSearchView)(accessor.get(viewsService_1.IViewsService), false).then(openedView => {
            if (openedView) {
                const searchAndReplaceWidget = openedView.searchAndReplaceWidget;
                searchAndReplaceWidget.toggleReplace(expandSearchReplaceWidget);
                const updatedText = openedView.updateTextFromFindWidgetOrSelection({ allowUnselectedWord: !expandSearchReplaceWidget });
                openedView.searchAndReplaceWidget.focus(undefined, updatedText, updatedText);
            }
        });
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc05hdi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9icm93c2VyL3NlYXJjaEFjdGlvbnNOYXYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF5QmhHLGdEQUFnRDtJQUNoRCxJQUFBLHlCQUFlLEVBQUMsTUFBTSx3QkFBeUIsU0FBUSxpQkFBTztRQUM3RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLDBHQUF1RDtnQkFDekQsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsZ0NBQWdDLEVBQUUsc0JBQXNCLENBQUM7Z0JBQzlFLFFBQVEsRUFBUiw0QkFBUTtnQkFDUixVQUFVLEVBQUU7b0JBQ1gsTUFBTSw2Q0FBbUM7b0JBQ3pDLElBQUksRUFBRSwyQkFBYyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLG9CQUFvQixFQUFFLHFCQUFxQixDQUFDLGNBQWMsQ0FBQztvQkFDM0csT0FBTyxFQUFFLG1EQUE2Qix3QkFBZTtpQkFDckQ7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO1lBQzdDLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBQSxzQkFBZ0IsR0FBRSxDQUFDLENBQUM7WUFDdkYsSUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQzlFLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDLGdCQUFpQyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJ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