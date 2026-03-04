/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/numbers"], function (require, exports, numbers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerCellToolbarStickyScroll = registerCellToolbarStickyScroll;
    function registerCellToolbarStickyScroll(notebookEditor, cell, element, opts) {
        const extraOffset = opts?.extraOffset ?? 0;
        const min = opts?.min ?? 0;
        const updateForScroll = () => {
            if (cell.isInputCollapsed) {
                element.style.top = '';
            }
            else {
                const scrollTop = notebookEditor.scrollTop;
                const elementTop = notebookEditor.getAbsoluteTopOfElement(cell);
                const diff = scrollTop - elementTop + extraOffset;
                const maxTop = cell.layoutInfo.editorHeight + cell.layoutInfo.statusBarHeight - 45; // subtract roughly the height of the execution order label plus padding
                const top = maxTop > 20 ? // Don't move the run button if it can only move a very short distance
                    (0, numbers_1.clamp)(min, diff, maxTop) :
                    min;
                element.style.top = `${top}px`;
            }
        };
        updateForScroll();
        return notebookEditor.onDidScroll(() => updateForScroll());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFRvb2xiYXJTdGlja3lTY3JvbGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NlbGxUb29sYmFyU3RpY2t5U2Nyb2xsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLDBFQXFCQztJQXJCRCxTQUFnQiwrQkFBK0IsQ0FBQyxjQUErQixFQUFFLElBQW9CLEVBQUUsT0FBb0IsRUFBRSxJQUE2QztRQUN6SyxNQUFNLFdBQVcsR0FBRyxJQUFJLEVBQUUsV0FBVyxJQUFJLENBQUMsQ0FBQztRQUMzQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUUzQixNQUFNLGVBQWUsR0FBRyxHQUFHLEVBQUU7WUFDNUIsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDO2dCQUMzQyxNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sSUFBSSxHQUFHLFNBQVMsR0FBRyxVQUFVLEdBQUcsV0FBVyxDQUFDO2dCQUNsRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUMsQ0FBQyx3RUFBd0U7Z0JBQzVKLE1BQU0sR0FBRyxHQUFHLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLHNFQUFzRTtvQkFDL0YsSUFBQSxlQUFLLEVBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUMxQixHQUFHLENBQUM7Z0JBQ0wsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztZQUNoQyxDQUFDO1FBQ0YsQ0FBQyxDQUFDO1FBRUYsZUFBZSxFQUFFLENBQUM7UUFDbEIsT0FBTyxjQUFjLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7SUFDNUQsQ0FBQyJ9