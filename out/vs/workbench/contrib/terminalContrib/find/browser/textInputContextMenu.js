/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/common/actions", "vs/base/common/platform", "vs/nls"], function (require, exports, dom_1, mouseEvent_1, actions_1, platform_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.openContextMenu = openContextMenu;
    function openContextMenu(targetWindow, event, clipboardService, contextMenuService) {
        const standardEvent = new mouseEvent_1.StandardMouseEvent(targetWindow, event);
        // Actions from workbench/browser/actions/textInputActions
        const actions = [];
        actions.push(
        // Undo/Redo
        new actions_1.Action('undo', (0, nls_1.localize)('undo', "Undo"), undefined, true, async () => (0, dom_1.getActiveWindow)().document.execCommand('undo')), new actions_1.Action('redo', (0, nls_1.localize)('redo', "Redo"), undefined, true, async () => (0, dom_1.getActiveWindow)().document.execCommand('redo')), new actions_1.Separator(), 
        // Cut / Copy / Paste
        new actions_1.Action('editor.action.clipboardCutAction', (0, nls_1.localize)('cut', "Cut"), undefined, true, async () => (0, dom_1.getActiveWindow)().document.execCommand('cut')), new actions_1.Action('editor.action.clipboardCopyAction', (0, nls_1.localize)('copy', "Copy"), undefined, true, async () => (0, dom_1.getActiveWindow)().document.execCommand('copy')), new actions_1.Action('editor.action.clipboardPasteAction', (0, nls_1.localize)('paste', "Paste"), undefined, true, async (element) => {
            // Native: paste is supported
            if (platform_1.isNative) {
                (0, dom_1.getActiveWindow)().document.execCommand('paste');
            }
            // Web: paste is not supported due to security reasons
            else {
                const clipboardText = await clipboardService.readText();
                if (element instanceof HTMLTextAreaElement ||
                    element instanceof HTMLInputElement) {
                    const selectionStart = element.selectionStart || 0;
                    const selectionEnd = element.selectionEnd || 0;
                    element.value = `${element.value.substring(0, selectionStart)}${clipboardText}${element.value.substring(selectionEnd, element.value.length)}`;
                    element.selectionStart = selectionStart + clipboardText.length;
                    element.selectionEnd = element.selectionStart;
                }
            }
        }), new actions_1.Separator(), 
        // Select All
        new actions_1.Action('editor.action.selectAll', (0, nls_1.localize)('selectAll', "Select All"), undefined, true, async () => (0, dom_1.getActiveWindow)().document.execCommand('selectAll')));
        contextMenuService.showContextMenu({
            getAnchor: () => standardEvent,
            getActions: () => actions,
            getActionsContext: () => event.target,
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dElucHV0Q29udGV4dE1lbnUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvZmluZC9icm93c2VyL3RleHRJbnB1dENvbnRleHRNZW51LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLDBDQWlEQztJQWpERCxTQUFnQixlQUFlLENBQUMsWUFBb0IsRUFBRSxLQUFpQixFQUFFLGdCQUFtQyxFQUFFLGtCQUF1QztRQUNwSixNQUFNLGFBQWEsR0FBRyxJQUFJLCtCQUFrQixDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVsRSwwREFBMEQ7UUFDMUQsTUFBTSxPQUFPLEdBQWMsRUFBRSxDQUFDO1FBQzlCLE9BQU8sQ0FBQyxJQUFJO1FBRVgsWUFBWTtRQUNaLElBQUksZ0JBQU0sQ0FBQyxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxJQUFBLHFCQUFlLEdBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQ3pILElBQUksZ0JBQU0sQ0FBQyxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxJQUFBLHFCQUFlLEdBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQ3pILElBQUksbUJBQVMsRUFBRTtRQUVmLHFCQUFxQjtRQUNyQixJQUFJLGdCQUFNLENBQUMsa0NBQWtDLEVBQUUsSUFBQSxjQUFRLEVBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxJQUFBLHFCQUFlLEdBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQ2xKLElBQUksZ0JBQU0sQ0FBQyxtQ0FBbUMsRUFBRSxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLElBQUEscUJBQWUsR0FBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsRUFDdEosSUFBSSxnQkFBTSxDQUFDLG9DQUFvQyxFQUFFLElBQUEsY0FBUSxFQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQyxPQUFPLEVBQUMsRUFBRTtZQUU3Ryw2QkFBNkI7WUFDN0IsSUFBSSxtQkFBUSxFQUFFLENBQUM7Z0JBQ2QsSUFBQSxxQkFBZSxHQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNqRCxDQUFDO1lBRUQsc0RBQXNEO2lCQUNqRCxDQUFDO2dCQUNMLE1BQU0sYUFBYSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3hELElBQ0MsT0FBTyxZQUFZLG1CQUFtQjtvQkFDdEMsT0FBTyxZQUFZLGdCQUFnQixFQUNsQyxDQUFDO29CQUNGLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLElBQUksQ0FBQyxDQUFDO29CQUNuRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQztvQkFFL0MsT0FBTyxDQUFDLEtBQUssR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsR0FBRyxhQUFhLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDOUksT0FBTyxDQUFDLGNBQWMsR0FBRyxjQUFjLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQztvQkFDL0QsT0FBTyxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO2dCQUMvQyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUMsQ0FBQyxFQUNGLElBQUksbUJBQVMsRUFBRTtRQUVmLGFBQWE7UUFDYixJQUFJLGdCQUFNLENBQUMseUJBQXlCLEVBQUUsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxJQUFBLHFCQUFlLEdBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQzVKLENBQUM7UUFFRixrQkFBa0IsQ0FBQyxlQUFlLENBQUM7WUFDbEMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLGFBQWE7WUFDOUIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU87WUFDekIsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU07U0FDckMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyJ9