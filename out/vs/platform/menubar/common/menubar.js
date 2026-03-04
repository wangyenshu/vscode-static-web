/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isMenubarMenuItemSubmenu = isMenubarMenuItemSubmenu;
    exports.isMenubarMenuItemSeparator = isMenubarMenuItemSeparator;
    exports.isMenubarMenuItemRecentAction = isMenubarMenuItemRecentAction;
    exports.isMenubarMenuItemAction = isMenubarMenuItemAction;
    function isMenubarMenuItemSubmenu(menuItem) {
        return menuItem.submenu !== undefined;
    }
    function isMenubarMenuItemSeparator(menuItem) {
        return menuItem.id === 'vscode.menubar.separator';
    }
    function isMenubarMenuItemRecentAction(menuItem) {
        return menuItem.uri !== undefined;
    }
    function isMenubarMenuItemAction(menuItem) {
        return !isMenubarMenuItemSubmenu(menuItem) && !isMenubarMenuItemSeparator(menuItem) && !isMenubarMenuItemRecentAction(menuItem);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudWJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL21lbnViYXIvY29tbW9uL21lbnViYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrRGhHLDREQUVDO0lBRUQsZ0VBRUM7SUFFRCxzRUFFQztJQUVELDBEQUVDO0lBZEQsU0FBZ0Isd0JBQXdCLENBQUMsUUFBeUI7UUFDakUsT0FBaUMsUUFBUyxDQUFDLE9BQU8sS0FBSyxTQUFTLENBQUM7SUFDbEUsQ0FBQztJQUVELFNBQWdCLDBCQUEwQixDQUFDLFFBQXlCO1FBQ25FLE9BQW1DLFFBQVMsQ0FBQyxFQUFFLEtBQUssMEJBQTBCLENBQUM7SUFDaEYsQ0FBQztJQUVELFNBQWdCLDZCQUE2QixDQUFDLFFBQXlCO1FBQ3RFLE9BQXNDLFFBQVMsQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDO0lBQ25FLENBQUM7SUFFRCxTQUFnQix1QkFBdUIsQ0FBQyxRQUF5QjtRQUNoRSxPQUFPLENBQUMsd0JBQXdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pJLENBQUMifQ==