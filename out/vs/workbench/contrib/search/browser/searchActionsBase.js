/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/services/search/common/search"], function (require, exports, DOM, nls, searchModel_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.category = void 0;
    exports.isSearchViewFocused = isSearchViewFocused;
    exports.appendKeyBindingLabel = appendKeyBindingLabel;
    exports.getSearchView = getSearchView;
    exports.getElementsToOperateOn = getElementsToOperateOn;
    exports.shouldRefocus = shouldRefocus;
    exports.openSearchView = openSearchView;
    exports.category = nls.localize2('search', "Search");
    function isSearchViewFocused(viewsService) {
        const searchView = getSearchView(viewsService);
        return !!(searchView && DOM.isAncestorOfActiveElement(searchView.getContainer()));
    }
    function appendKeyBindingLabel(label, inputKeyBinding) {
        return doAppendKeyBindingLabel(label, inputKeyBinding);
    }
    function getSearchView(viewsService) {
        return viewsService.getActiveViewWithId(search_1.VIEW_ID);
    }
    function getElementsToOperateOn(viewer, currElement, sortConfig) {
        let elements = viewer.getSelection().filter((x) => x !== null).sort((a, b) => (0, searchModel_1.searchComparer)(a, b, sortConfig.sortOrder));
        // if selection doesn't include multiple elements, just return current focus element.
        if (currElement && !(elements.length > 1 && elements.includes(currElement))) {
            elements = [currElement];
        }
        return elements;
    }
    /**
     * @param elements elements that are going to be removed
     * @param focusElement element that is focused
     * @returns whether we need to re-focus on a remove
     */
    function shouldRefocus(elements, focusElement) {
        if (!focusElement) {
            return false;
        }
        return !focusElement || elements.includes(focusElement) || hasDownstreamMatch(elements, focusElement);
    }
    function hasDownstreamMatch(elements, focusElement) {
        for (const elem of elements) {
            if ((elem instanceof searchModel_1.FileMatch && focusElement instanceof searchModel_1.Match && elem.matches().includes(focusElement)) ||
                (elem instanceof searchModel_1.FolderMatch && ((focusElement instanceof searchModel_1.FileMatch && elem.getDownstreamFileMatch(focusElement.resource)) ||
                    (focusElement instanceof searchModel_1.Match && elem.getDownstreamFileMatch(focusElement.parent().resource))))) {
                return true;
            }
        }
        return false;
    }
    function openSearchView(viewsService, focus) {
        return viewsService.openView(search_1.VIEW_ID, focus).then(view => (view ?? undefined));
    }
    function doAppendKeyBindingLabel(label, keyBinding) {
        return keyBinding ? label + ' (' + keyBinding.getLabel() + ')' : label;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc0Jhc2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9zZWFyY2hBY3Rpb25zQmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsa0RBR0M7SUFFRCxzREFFQztJQUVELHNDQUVDO0lBRUQsd0RBU0M7SUFPRCxzQ0FLQztJQWdCRCx3Q0FFQztJQXREWSxRQUFBLFFBQVEsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUUxRCxTQUFnQixtQkFBbUIsQ0FBQyxZQUEyQjtRQUM5RCxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDL0MsT0FBTyxDQUFDLENBQUMsQ0FBQyxVQUFVLElBQUksR0FBRyxDQUFDLHlCQUF5QixDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbkYsQ0FBQztJQUVELFNBQWdCLHFCQUFxQixDQUFDLEtBQWEsRUFBRSxlQUErQztRQUNuRyxPQUFPLHVCQUF1QixDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsU0FBZ0IsYUFBYSxDQUFDLFlBQTJCO1FBQ3hELE9BQU8sWUFBWSxDQUFDLG1CQUFtQixDQUFDLGdCQUFPLENBQWUsQ0FBQztJQUNoRSxDQUFDO0lBRUQsU0FBZ0Isc0JBQXNCLENBQUMsTUFBOEQsRUFBRSxXQUF3QyxFQUFFLFVBQTBDO1FBQzFMLElBQUksUUFBUSxHQUFzQixNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUF3QixFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUEsNEJBQWMsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBRW5LLHFGQUFxRjtRQUNyRixJQUFJLFdBQVcsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDN0UsUUFBUSxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVELE9BQU8sUUFBUSxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBZ0IsYUFBYSxDQUFDLFFBQTJCLEVBQUUsWUFBeUM7UUFDbkcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ25CLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNELE9BQU8sQ0FBQyxZQUFZLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDdkcsQ0FBQztJQUVELFNBQVMsa0JBQWtCLENBQUMsUUFBMkIsRUFBRSxZQUE2QjtRQUNyRixLQUFLLE1BQU0sSUFBSSxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxJQUFJLFlBQVksdUJBQVMsSUFBSSxZQUFZLFlBQVksbUJBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN4RyxDQUFDLElBQUksWUFBWSx5QkFBVyxJQUFJLENBQy9CLENBQUMsWUFBWSxZQUFZLHVCQUFTLElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDekYsQ0FBQyxZQUFZLFlBQVksbUJBQUssSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQzlGLENBQUMsRUFBRSxDQUFDO2dCQUNMLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUVkLENBQUM7SUFFRCxTQUFnQixjQUFjLENBQUMsWUFBMkIsRUFBRSxLQUFlO1FBQzFFLE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQyxnQkFBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBa0IsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFFRCxTQUFTLHVCQUF1QixDQUFDLEtBQWEsRUFBRSxVQUEwQztRQUN6RixPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDeEUsQ0FBQyJ9