/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/selectBox/selectBoxCustom", "vs/base/browser/ui/selectBox/selectBoxNative", "vs/base/browser/ui/widget", "vs/base/common/platform", "vs/css!./selectBox"], function (require, exports, listWidget_1, selectBoxCustom_1, selectBoxNative_1, widget_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectBox = exports.unthemedSelectBoxStyles = void 0;
    exports.unthemedSelectBoxStyles = {
        ...listWidget_1.unthemedListStyles,
        selectBackground: '#3C3C3C',
        selectForeground: '#F0F0F0',
        selectBorder: '#3C3C3C',
        decoratorRightForeground: undefined,
        selectListBackground: undefined,
        selectListBorder: undefined,
        focusBorder: undefined,
    };
    class SelectBox extends widget_1.Widget {
        constructor(options, selected, contextViewProvider, styles, selectBoxOptions) {
            super();
            // Default to native SelectBox for OSX unless overridden
            if (platform_1.isMacintosh && !selectBoxOptions?.useCustomDrawn) {
                this.selectBoxDelegate = new selectBoxNative_1.SelectBoxNative(options, selected, styles, selectBoxOptions);
            }
            else {
                this.selectBoxDelegate = new selectBoxCustom_1.SelectBoxList(options, selected, contextViewProvider, styles, selectBoxOptions);
            }
            this._register(this.selectBoxDelegate);
        }
        // Public SelectBox Methods - routed through delegate interface
        get onDidSelect() {
            return this.selectBoxDelegate.onDidSelect;
        }
        setOptions(options, selected) {
            this.selectBoxDelegate.setOptions(options, selected);
        }
        select(index) {
            this.selectBoxDelegate.select(index);
        }
        setAriaLabel(label) {
            this.selectBoxDelegate.setAriaLabel(label);
        }
        focus() {
            this.selectBoxDelegate.focus();
        }
        blur() {
            this.selectBoxDelegate.blur();
        }
        setFocusable(focusable) {
            this.selectBoxDelegate.setFocusable(focusable);
        }
        render(container) {
            this.selectBoxDelegate.render(container);
        }
    }
    exports.SelectBox = SelectBox;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0Qm94LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL3NlbGVjdEJveC9zZWxlY3RCb3gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkRuRixRQUFBLHVCQUF1QixHQUFxQjtRQUN4RCxHQUFHLCtCQUFrQjtRQUNyQixnQkFBZ0IsRUFBRSxTQUFTO1FBQzNCLGdCQUFnQixFQUFFLFNBQVM7UUFDM0IsWUFBWSxFQUFFLFNBQVM7UUFDdkIsd0JBQXdCLEVBQUUsU0FBUztRQUNuQyxvQkFBb0IsRUFBRSxTQUFTO1FBQy9CLGdCQUFnQixFQUFFLFNBQVM7UUFDM0IsV0FBVyxFQUFFLFNBQVM7S0FDdEIsQ0FBQztJQU9GLE1BQWEsU0FBVSxTQUFRLGVBQU07UUFHcEMsWUFBWSxPQUE0QixFQUFFLFFBQWdCLEVBQUUsbUJBQXlDLEVBQUUsTUFBd0IsRUFBRSxnQkFBb0M7WUFDcEssS0FBSyxFQUFFLENBQUM7WUFFUix3REFBd0Q7WUFDeEQsSUFBSSxzQkFBVyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLGlDQUFlLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMzRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksK0JBQWEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLG1CQUFtQixFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzlHLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFRCwrREFBK0Q7UUFFL0QsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDO1FBQzNDLENBQUM7UUFFRCxVQUFVLENBQUMsT0FBNEIsRUFBRSxRQUFpQjtZQUN6RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQWE7WUFDbkIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRUQsWUFBWSxDQUFDLEtBQWE7WUFDekIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRUQsSUFBSTtZQUNILElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBRUQsWUFBWSxDQUFDLFNBQWtCO1lBQzlCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELE1BQU0sQ0FBQyxTQUFzQjtZQUM1QixJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFDLENBQUM7S0FDRDtJQWpERCw4QkFpREMifQ==