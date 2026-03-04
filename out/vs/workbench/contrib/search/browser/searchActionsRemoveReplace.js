/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/list/browser/listService", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/search/browser/replace", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/services/editor/common/editorService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/base/common/arrays"], function (require, exports, nls, configuration_1, listService_1, viewsService_1, searchIcons_1, Constants, replace_1, searchModel_1, editorService_1, uriIdentity_1, contextkey_1, actions_1, searchActionsBase_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getElementToFocusAfterRemoved = getElementToFocusAfterRemoved;
    exports.getLastNodeFromSameType = getLastNodeFromSameType;
    //#endregion
    //#region Actions
    (0, actions_1.registerAction2)(class RemoveAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.remove" /* Constants.SearchCommandIds.RemoveActionId */,
                title: nls.localize2('RemoveAction.label', "Dismiss"),
                category: searchActionsBase_1.category,
                icon: searchIcons_1.searchRemoveIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.FileMatchOrMatchFocusKey),
                    primary: 20 /* KeyCode.Delete */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
                    },
                },
                menu: [
                    {
                        id: actions_1.MenuId.SearchContext,
                        group: 'search',
                        order: 2,
                    },
                    {
                        id: actions_1.MenuId.SearchActionMenu,
                        group: 'inline',
                        order: 2,
                    },
                ]
            });
        }
        run(accessor, context) {
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
            if (!searchView) {
                return;
            }
            let element = context?.element;
            let viewer = context?.viewer;
            if (!viewer) {
                viewer = searchView.getControl();
            }
            if (!element) {
                element = viewer.getFocus()[0] ?? undefined;
            }
            const elementsToRemove = (0, searchActionsBase_1.getElementsToOperateOn)(viewer, element, configurationService.getValue('search'));
            let focusElement = viewer.getFocus()[0] ?? undefined;
            if (elementsToRemove.length === 0) {
                return;
            }
            if (!focusElement || (focusElement instanceof searchModel_1.SearchResult)) {
                focusElement = element;
            }
            let nextFocusElement;
            const shouldRefocusMatch = (0, searchActionsBase_1.shouldRefocus)(elementsToRemove, focusElement);
            if (focusElement && shouldRefocusMatch) {
                nextFocusElement = getElementToFocusAfterRemoved(viewer, focusElement, elementsToRemove);
            }
            const searchResult = searchView.searchResult;
            if (searchResult) {
                searchResult.batchRemove(elementsToRemove);
            }
            if (focusElement && shouldRefocusMatch) {
                if (!nextFocusElement) {
                    nextFocusElement = getLastNodeFromSameType(viewer, focusElement);
                }
                if (nextFocusElement && !(0, searchModel_1.arrayContainsElementOrParent)(nextFocusElement, elementsToRemove)) {
                    viewer.reveal(nextFocusElement);
                    viewer.setFocus([nextFocusElement], (0, listService_1.getSelectionKeyboardEvent)());
                    viewer.setSelection([nextFocusElement], (0, listService_1.getSelectionKeyboardEvent)());
                }
            }
            else if (!(0, arrays_1.equals)(viewer.getFocus(), viewer.getSelection())) {
                viewer.setSelection(viewer.getFocus());
            }
            viewer.domFocus();
            return;
        }
    });
    (0, actions_1.registerAction2)(class ReplaceAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.replace" /* Constants.SearchCommandIds.ReplaceActionId */,
                title: nls.localize2('match.replace.label', "Replace"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.MatchFocusKey, Constants.SearchContext.IsEditableItemKey),
                    primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 22 /* KeyCode.Digit1 */,
                },
                icon: searchIcons_1.searchReplaceIcon,
                menu: [
                    {
                        id: actions_1.MenuId.SearchContext,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.MatchFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'search',
                        order: 1
                    },
                    {
                        id: actions_1.MenuId.SearchActionMenu,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.MatchFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'inline',
                        order: 1
                    }
                ]
            });
        }
        async run(accessor, context) {
            return performReplace(accessor, context);
        }
    });
    (0, actions_1.registerAction2)(class ReplaceAllAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.replaceAllInFile" /* Constants.SearchCommandIds.ReplaceAllInFileActionId */,
                title: nls.localize2('file.replaceAll.label', "Replace All"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FileFocusKey, Constants.SearchContext.IsEditableItemKey),
                    primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 22 /* KeyCode.Digit1 */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */],
                },
                icon: searchIcons_1.searchReplaceIcon,
                menu: [
                    {
                        id: actions_1.MenuId.SearchContext,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FileFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'search',
                        order: 1
                    },
                    {
                        id: actions_1.MenuId.SearchActionMenu,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FileFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'inline',
                        order: 1
                    }
                ]
            });
        }
        async run(accessor, context) {
            return performReplace(accessor, context);
        }
    });
    (0, actions_1.registerAction2)(class ReplaceAllInFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.replaceAllInFolder" /* Constants.SearchCommandIds.ReplaceAllInFolderActionId */,
                title: nls.localize2('file.replaceAll.label', "Replace All"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.SearchViewVisibleKey, Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FolderFocusKey, Constants.SearchContext.IsEditableItemKey),
                    primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 22 /* KeyCode.Digit1 */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */],
                },
                icon: searchIcons_1.searchReplaceIcon,
                menu: [
                    {
                        id: actions_1.MenuId.SearchContext,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FolderFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'search',
                        order: 1
                    },
                    {
                        id: actions_1.MenuId.SearchActionMenu,
                        when: contextkey_1.ContextKeyExpr.and(Constants.SearchContext.ReplaceActiveKey, Constants.SearchContext.FolderFocusKey, Constants.SearchContext.IsEditableItemKey),
                        group: 'inline',
                        order: 1
                    }
                ]
            });
        }
        async run(accessor, context) {
            return performReplace(accessor, context);
        }
    });
    //#endregion
    //#region Helpers
    function performReplace(accessor, context) {
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const viewlet = (0, searchActionsBase_1.getSearchView)(viewsService);
        const viewer = context?.viewer ?? viewlet?.getControl();
        if (!viewer) {
            return;
        }
        const element = context?.element ?? viewer.getFocus()[0];
        // since multiple elements can be selected, we need to check the type of the FolderMatch/FileMatch/Match before we perform the replace.
        const elementsToReplace = (0, searchActionsBase_1.getElementsToOperateOn)(viewer, element ?? undefined, configurationService.getValue('search'));
        let focusElement = viewer.getFocus()[0];
        if (!focusElement || (focusElement && !(0, searchModel_1.arrayContainsElementOrParent)(focusElement, elementsToReplace)) || (focusElement instanceof searchModel_1.SearchResult)) {
            focusElement = element;
        }
        if (elementsToReplace.length === 0) {
            return;
        }
        let nextFocusElement;
        if (focusElement) {
            nextFocusElement = getElementToFocusAfterRemoved(viewer, focusElement, elementsToReplace);
        }
        const searchResult = viewlet?.searchResult;
        if (searchResult) {
            searchResult.batchReplace(elementsToReplace);
        }
        if (focusElement) {
            if (!nextFocusElement) {
                nextFocusElement = getLastNodeFromSameType(viewer, focusElement);
            }
            if (nextFocusElement) {
                viewer.reveal(nextFocusElement);
                viewer.setFocus([nextFocusElement], (0, listService_1.getSelectionKeyboardEvent)());
                viewer.setSelection([nextFocusElement], (0, listService_1.getSelectionKeyboardEvent)());
                if (nextFocusElement instanceof searchModel_1.Match) {
                    const useReplacePreview = configurationService.getValue().search.useReplacePreview;
                    if (!useReplacePreview || hasToOpenFile(accessor, nextFocusElement) || nextFocusElement instanceof searchModel_1.MatchInNotebook) {
                        viewlet?.open(nextFocusElement, true);
                    }
                    else {
                        accessor.get(replace_1.IReplaceService).openReplacePreview(nextFocusElement, true);
                    }
                }
                else if (nextFocusElement instanceof searchModel_1.FileMatch) {
                    viewlet?.open(nextFocusElement, true);
                }
            }
        }
        viewer.domFocus();
    }
    function hasToOpenFile(accessor, currBottomElem) {
        if (!(currBottomElem instanceof searchModel_1.Match)) {
            return false;
        }
        const activeEditor = accessor.get(editorService_1.IEditorService).activeEditor;
        const file = activeEditor?.resource;
        if (file) {
            return accessor.get(uriIdentity_1.IUriIdentityService).extUri.isEqual(file, currBottomElem.parent().resource);
        }
        return false;
    }
    function compareLevels(elem1, elem2) {
        if (elem1 instanceof searchModel_1.Match) {
            if (elem2 instanceof searchModel_1.Match) {
                return 0;
            }
            else {
                return -1;
            }
        }
        else if (elem1 instanceof searchModel_1.FileMatch) {
            if (elem2 instanceof searchModel_1.Match) {
                return 1;
            }
            else if (elem2 instanceof searchModel_1.FileMatch) {
                return 0;
            }
            else {
                return -1;
            }
        }
        else {
            // FolderMatch
            if (elem2 instanceof searchModel_1.FolderMatch) {
                return 0;
            }
            else {
                return 1;
            }
        }
    }
    /**
     * Returns element to focus after removing the given element
     */
    function getElementToFocusAfterRemoved(viewer, element, elementsToRemove) {
        const navigator = viewer.navigate(element);
        if (element instanceof searchModel_1.FolderMatch) {
            while (!!navigator.next() && (!(navigator.current() instanceof searchModel_1.FolderMatch) || (0, searchModel_1.arrayContainsElementOrParent)(navigator.current(), elementsToRemove))) { }
        }
        else if (element instanceof searchModel_1.FileMatch) {
            while (!!navigator.next() && (!(navigator.current() instanceof searchModel_1.FileMatch) || (0, searchModel_1.arrayContainsElementOrParent)(navigator.current(), elementsToRemove))) {
                viewer.expand(navigator.current());
            }
        }
        else {
            while (navigator.next() && (!(navigator.current() instanceof searchModel_1.Match) || (0, searchModel_1.arrayContainsElementOrParent)(navigator.current(), elementsToRemove))) {
                viewer.expand(navigator.current());
            }
        }
        return navigator.current();
    }
    /***
     * Finds the last element in the tree with the same type as `element`
     */
    function getLastNodeFromSameType(viewer, element) {
        let lastElem = viewer.lastVisibleElement ?? null;
        while (lastElem) {
            const compareVal = compareLevels(element, lastElem);
            if (compareVal === -1) {
                viewer.expand(lastElem);
                lastElem = viewer.lastVisibleElement;
            }
            else if (compareVal === 1) {
                lastElem = viewer.getParentElement(lastElem);
            }
            else {
                return lastElem;
            }
        }
        return undefined;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc1JlbW92ZVJlcGxhY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9zZWFyY2hBY3Rpb25zUmVtb3ZlUmVwbGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW9XaEcsc0VBY0M7SUFLRCwwREFnQkM7SUExVkQsWUFBWTtJQUVaLGlCQUFpQjtJQUNqQixJQUFBLHlCQUFlLEVBQUMsTUFBTSxZQUFhLFNBQVEsaUJBQU87UUFFakQ7WUFFQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSx3RUFBMkM7Z0JBQzdDLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLFNBQVMsQ0FBQztnQkFDckQsUUFBUSxFQUFSLDRCQUFRO2dCQUNSLElBQUksRUFBRSw4QkFBZ0I7Z0JBQ3RCLFVBQVUsRUFBRTtvQkFDWCxNQUFNLDZDQUFtQztvQkFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQztvQkFDeEgsT0FBTyx5QkFBZ0I7b0JBQ3ZCLEdBQUcsRUFBRTt3QkFDSixPQUFPLEVBQUUscURBQWtDO3FCQUMzQztpQkFDRDtnQkFDRCxJQUFJLEVBQUU7b0JBQ0w7d0JBQ0MsRUFBRSxFQUFFLGdCQUFNLENBQUMsYUFBYTt3QkFDeEIsS0FBSyxFQUFFLFFBQVE7d0JBQ2YsS0FBSyxFQUFFLENBQUM7cUJBQ1I7b0JBQ0Q7d0JBQ0MsRUFBRSxFQUFFLGdCQUFNLENBQUMsZ0JBQWdCO3dCQUMzQixLQUFLLEVBQUUsUUFBUTt3QkFDZixLQUFLLEVBQUUsQ0FBQztxQkFDUjtpQkFDRDthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxPQUF5QztZQUN4RSxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDRCQUFhLENBQUMsQ0FBQztZQUNqRCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUNqRSxNQUFNLFVBQVUsR0FBRyxJQUFBLGlDQUFhLEVBQUMsWUFBWSxDQUFDLENBQUM7WUFFL0MsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksT0FBTyxHQUFHLE9BQU8sRUFBRSxPQUFPLENBQUM7WUFDL0IsSUFBSSxNQUFNLEdBQUcsT0FBTyxFQUFFLE1BQU0sQ0FBQztZQUM3QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxHQUFHLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNsQyxDQUFDO1lBQ0QsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLE9BQU8sR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDO1lBQzdDLENBQUM7WUFFRCxNQUFNLGdCQUFnQixHQUFHLElBQUEsMENBQXNCLEVBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxvQkFBb0IsQ0FBQyxRQUFRLENBQWlDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDMUksSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQztZQUVyRCxJQUFJLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsWUFBWSxZQUFZLDBCQUFZLENBQUMsRUFBRSxDQUFDO2dCQUM3RCxZQUFZLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLENBQUM7WUFFRCxJQUFJLGdCQUFnQixDQUFDO1lBQ3JCLE1BQU0sa0JBQWtCLEdBQUcsSUFBQSxpQ0FBYSxFQUFDLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3pFLElBQUksWUFBWSxJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3hDLGdCQUFnQixHQUFHLDZCQUE2QixDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMxRixDQUFDO1lBRUQsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQztZQUU3QyxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNsQixZQUFZLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUVELElBQUksWUFBWSxJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUN2QixnQkFBZ0IsR0FBRyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ2xFLENBQUM7Z0JBRUQsSUFBSSxnQkFBZ0IsSUFBSSxDQUFDLElBQUEsMENBQTRCLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO29CQUMzRixNQUFNLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7b0JBQ2hDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLElBQUEsdUNBQXlCLEdBQUUsQ0FBQyxDQUFDO29CQUNqRSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxJQUFBLHVDQUF5QixHQUFFLENBQUMsQ0FBQztnQkFDdEUsQ0FBQztZQUNGLENBQUM7aUJBQU0sSUFBSSxDQUFDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUM5RCxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7WUFFRCxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEIsT0FBTztRQUNSLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsTUFBTSxhQUFjLFNBQVEsaUJBQU87UUFDbEQ7WUFFQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSwwRUFBNEM7Z0JBQzlDLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLHFCQUFxQixFQUFFLFNBQVMsQ0FBQztnQkFDdEQsUUFBUSxFQUFSLDRCQUFRO2dCQUNSLFVBQVUsRUFBRTtvQkFDWCxNQUFNLDZDQUFtQztvQkFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDO29CQUNsTSxPQUFPLEVBQUUsbURBQTZCLDBCQUFpQjtpQkFDdkQ7Z0JBQ0QsSUFBSSxFQUFFLCtCQUFpQjtnQkFDdkIsSUFBSSxFQUFFO29CQUNMO3dCQUNDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGFBQWE7d0JBQ3hCLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUM7d0JBQ3BKLEtBQUssRUFBRSxRQUFRO3dCQUNmLEtBQUssRUFBRSxDQUFDO3FCQUNSO29CQUNEO3dCQUNDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGdCQUFnQjt3QkFDM0IsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQzt3QkFDcEosS0FBSyxFQUFFLFFBQVE7d0JBQ2YsS0FBSyxFQUFFLENBQUM7cUJBQ1I7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE9BQXlDO1lBQ3ZGLE9BQU8sY0FBYyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxQyxDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sZ0JBQWlCLFNBQVEsaUJBQU87UUFFckQ7WUFFQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSw0RkFBcUQ7Z0JBQ3ZELEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLHVCQUF1QixFQUFFLGFBQWEsQ0FBQztnQkFDNUQsUUFBUSxFQUFSLDRCQUFRO2dCQUNSLFVBQVUsRUFBRTtvQkFDWCxNQUFNLDZDQUFtQztvQkFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDO29CQUNqTSxPQUFPLEVBQUUsbURBQTZCLDBCQUFpQjtvQkFDdkQsU0FBUyxFQUFFLENBQUMsbURBQTZCLHdCQUFnQixDQUFDO2lCQUMxRDtnQkFDRCxJQUFJLEVBQUUsK0JBQWlCO2dCQUN2QixJQUFJLEVBQUU7b0JBQ0w7d0JBQ0MsRUFBRSxFQUFFLGdCQUFNLENBQUMsYUFBYTt3QkFDeEIsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQzt3QkFDbkosS0FBSyxFQUFFLFFBQVE7d0JBQ2YsS0FBSyxFQUFFLENBQUM7cUJBQ1I7b0JBQ0Q7d0JBQ0MsRUFBRSxFQUFFLGdCQUFNLENBQUMsZ0JBQWdCO3dCQUMzQixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDO3dCQUNuSixLQUFLLEVBQUUsUUFBUTt3QkFDZixLQUFLLEVBQUUsQ0FBQztxQkFDUjtpQkFDRDthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsT0FBeUM7WUFDdkYsT0FBTyxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsTUFBTSx3QkFBeUIsU0FBUSxpQkFBTztRQUM3RDtZQUVDLEtBQUssQ0FBQztnQkFDTCxFQUFFLGdHQUF1RDtnQkFDekQsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLEVBQUUsYUFBYSxDQUFDO2dCQUM1RCxRQUFRLEVBQVIsNEJBQVE7Z0JBQ1IsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUM7b0JBQ25NLE9BQU8sRUFBRSxtREFBNkIsMEJBQWlCO29CQUN2RCxTQUFTLEVBQUUsQ0FBQyxtREFBNkIsd0JBQWdCLENBQUM7aUJBQzFEO2dCQUNELElBQUksRUFBRSwrQkFBaUI7Z0JBQ3ZCLElBQUksRUFBRTtvQkFDTDt3QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxhQUFhO3dCQUN4QixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDO3dCQUNySixLQUFLLEVBQUUsUUFBUTt3QkFDZixLQUFLLEVBQUUsQ0FBQztxQkFDUjtvQkFDRDt3QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxnQkFBZ0I7d0JBQzNCLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUM7d0JBQ3JKLEtBQUssRUFBRSxRQUFRO3dCQUNmLEtBQUssRUFBRSxDQUFDO3FCQUNSO2lCQUNEO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxPQUF5QztZQUN2RixPQUFPLGNBQWMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDMUMsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILFlBQVk7SUFFWixpQkFBaUI7SUFFakIsU0FBUyxjQUFjLENBQUMsUUFBMEIsRUFDakQsT0FBeUM7UUFDekMsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7UUFDakUsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBYSxDQUFDLENBQUM7UUFFakQsTUFBTSxPQUFPLEdBQTJCLElBQUEsaUNBQWEsRUFBQyxZQUFZLENBQUMsQ0FBQztRQUNwRSxNQUFNLE1BQU0sR0FBaUUsT0FBTyxFQUFFLE1BQU0sSUFBSSxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUM7UUFFdEgsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2IsT0FBTztRQUNSLENBQUM7UUFDRCxNQUFNLE9BQU8sR0FBMkIsT0FBTyxFQUFFLE9BQU8sSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFakYsdUlBQXVJO1FBQ3ZJLE1BQU0saUJBQWlCLEdBQUcsSUFBQSwwQ0FBc0IsRUFBQyxNQUFNLEVBQUUsT0FBTyxJQUFJLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxRQUFRLENBQWlDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDeEosSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXhDLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFBLDBDQUE0QixFQUFDLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLFlBQVksMEJBQVksQ0FBQyxFQUFFLENBQUM7WUFDakosWUFBWSxHQUFHLE9BQU8sQ0FBQztRQUN4QixDQUFDO1FBRUQsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDcEMsT0FBTztRQUNSLENBQUM7UUFDRCxJQUFJLGdCQUFnQixDQUFDO1FBQ3JCLElBQUksWUFBWSxFQUFFLENBQUM7WUFDbEIsZ0JBQWdCLEdBQUcsNkJBQTZCLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzNGLENBQUM7UUFFRCxNQUFNLFlBQVksR0FBRyxPQUFPLEVBQUUsWUFBWSxDQUFDO1FBRTNDLElBQUksWUFBWSxFQUFFLENBQUM7WUFDbEIsWUFBWSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxJQUFJLFlBQVksRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN2QixnQkFBZ0IsR0FBRyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDbEUsQ0FBQztZQUVELElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxJQUFBLHVDQUF5QixHQUFFLENBQUMsQ0FBQztnQkFDakUsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsSUFBQSx1Q0FBeUIsR0FBRSxDQUFDLENBQUM7Z0JBRXJFLElBQUksZ0JBQWdCLFlBQVksbUJBQUssRUFBRSxDQUFDO29CQUN2QyxNQUFNLGlCQUFpQixHQUFHLG9CQUFvQixDQUFDLFFBQVEsRUFBd0IsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUM7b0JBQ3pHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxhQUFhLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDLElBQUksZ0JBQWdCLFlBQVksNkJBQWUsRUFBRSxDQUFDO3dCQUNwSCxPQUFPLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN2QyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQzFFLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxJQUFJLGdCQUFnQixZQUFZLHVCQUFTLEVBQUUsQ0FBQztvQkFDbEQsT0FBTyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdkMsQ0FBQztZQUNGLENBQUM7UUFFRixDQUFDO1FBRUQsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFFRCxTQUFTLGFBQWEsQ0FBQyxRQUEwQixFQUFFLGNBQStCO1FBQ2pGLElBQUksQ0FBQyxDQUFDLGNBQWMsWUFBWSxtQkFBSyxDQUFDLEVBQUUsQ0FBQztZQUN4QyxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQyxZQUFZLENBQUM7UUFDL0QsTUFBTSxJQUFJLEdBQUcsWUFBWSxFQUFFLFFBQVEsQ0FBQztRQUNwQyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ1YsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLGlDQUFtQixDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pHLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFTLGFBQWEsQ0FBQyxLQUFzQixFQUFFLEtBQXNCO1FBQ3BFLElBQUksS0FBSyxZQUFZLG1CQUFLLEVBQUUsQ0FBQztZQUM1QixJQUFJLEtBQUssWUFBWSxtQkFBSyxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO1FBRUYsQ0FBQzthQUFNLElBQUksS0FBSyxZQUFZLHVCQUFTLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssWUFBWSxtQkFBSyxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztpQkFBTSxJQUFJLEtBQUssWUFBWSx1QkFBUyxFQUFFLENBQUM7Z0JBQ3ZDLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO1FBRUYsQ0FBQzthQUFNLENBQUM7WUFDUCxjQUFjO1lBQ2QsSUFBSSxLQUFLLFlBQVkseUJBQVcsRUFBRSxDQUFDO2dCQUNsQyxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7UUFDRixDQUFDO0lBQ0YsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsNkJBQTZCLENBQUMsTUFBd0QsRUFBRSxPQUF3QixFQUFFLGdCQUFtQztRQUNwSyxNQUFNLFNBQVMsR0FBd0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoRSxJQUFJLE9BQU8sWUFBWSx5QkFBVyxFQUFFLENBQUM7WUFDcEMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsWUFBWSx5QkFBVyxDQUFDLElBQUksSUFBQSwwQ0FBNEIsRUFBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pKLENBQUM7YUFBTSxJQUFJLE9BQU8sWUFBWSx1QkFBUyxFQUFFLENBQUM7WUFDekMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsWUFBWSx1QkFBUyxDQUFDLElBQUksSUFBQSwwQ0FBNEIsRUFBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ25KLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDcEMsQ0FBQztRQUNGLENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FBTyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxZQUFZLG1CQUFLLENBQUMsSUFBSSxJQUFBLDBDQUE0QixFQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDN0ksTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNwQyxDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLHVCQUF1QixDQUFDLE1BQXdELEVBQUUsT0FBd0I7UUFDekgsSUFBSSxRQUFRLEdBQTJCLE1BQU0sQ0FBQyxrQkFBa0IsSUFBSSxJQUFJLENBQUM7UUFFekUsT0FBTyxRQUFRLEVBQUUsQ0FBQztZQUNqQixNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3BELElBQUksVUFBVSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3hCLFFBQVEsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUM7WUFDdEMsQ0FBQztpQkFBTSxJQUFJLFVBQVUsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsUUFBUSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxRQUFRLENBQUM7WUFDakIsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDOztBQUVELFlBQVkifQ==