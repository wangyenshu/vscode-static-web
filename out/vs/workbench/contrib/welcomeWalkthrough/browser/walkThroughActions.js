/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/welcomeWalkthrough/browser/walkThroughPart", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey"], function (require, exports, editorService_1, walkThroughPart_1, editorContextKeys_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalkThroughPageDown = exports.WalkThroughPageUp = exports.WalkThroughArrowDown = exports.WalkThroughArrowUp = void 0;
    exports.WalkThroughArrowUp = {
        id: 'workbench.action.interactivePlayground.arrowUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 16 /* KeyCode.UpArrow */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.arrowUp();
            }
        }
    };
    exports.WalkThroughArrowDown = {
        id: 'workbench.action.interactivePlayground.arrowDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 18 /* KeyCode.DownArrow */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.arrowDown();
            }
        }
    };
    exports.WalkThroughPageUp = {
        id: 'workbench.action.interactivePlayground.pageUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 11 /* KeyCode.PageUp */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.pageUp();
            }
        }
    };
    exports.WalkThroughPageDown = {
        id: 'workbench.action.interactivePlayground.pageDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(walkThroughPart_1.WALK_THROUGH_FOCUS, editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated()),
        primary: 12 /* KeyCode.PageDown */,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane instanceof walkThroughPart_1.WalkThroughPart) {
                activeEditorPane.pageDown();
            }
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Fsa1Rocm91Z2hBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2VsY29tZVdhbGt0aHJvdWdoL2Jyb3dzZXIvd2Fsa1Rocm91Z2hBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNuRixRQUFBLGtCQUFrQixHQUE4QjtRQUM1RCxFQUFFLEVBQUUsZ0RBQWdEO1FBQ3BELE1BQU0sNkNBQW1DO1FBQ3pDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvQ0FBa0IsRUFBRSxxQ0FBaUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDM0YsT0FBTywwQkFBaUI7UUFDeEIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFO1lBQ25CLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sZ0JBQWdCLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixDQUFDO1lBQ3hELElBQUksZ0JBQWdCLFlBQVksaUNBQWUsRUFBRSxDQUFDO2dCQUNqRCxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUM7SUFFVyxRQUFBLG9CQUFvQixHQUE4QjtRQUM5RCxFQUFFLEVBQUUsa0RBQWtEO1FBQ3RELE1BQU0sNkNBQW1DO1FBQ3pDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvQ0FBa0IsRUFBRSxxQ0FBaUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDM0YsT0FBTyw0QkFBbUI7UUFDMUIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFO1lBQ25CLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sZ0JBQWdCLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixDQUFDO1lBQ3hELElBQUksZ0JBQWdCLFlBQVksaUNBQWUsRUFBRSxDQUFDO2dCQUNqRCxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUM5QixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUM7SUFFVyxRQUFBLGlCQUFpQixHQUE4QjtRQUMzRCxFQUFFLEVBQUUsK0NBQStDO1FBQ25ELE1BQU0sNkNBQW1DO1FBQ3pDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvQ0FBa0IsRUFBRSxxQ0FBaUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDM0YsT0FBTyx5QkFBZ0I7UUFDdkIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFO1lBQ25CLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sZ0JBQWdCLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixDQUFDO1lBQ3hELElBQUksZ0JBQWdCLFlBQVksaUNBQWUsRUFBRSxDQUFDO2dCQUNqRCxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUM7SUFFVyxRQUFBLG1CQUFtQixHQUE4QjtRQUM3RCxFQUFFLEVBQUUsaURBQWlEO1FBQ3JELE1BQU0sNkNBQW1DO1FBQ3pDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvQ0FBa0IsRUFBRSxxQ0FBaUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDM0YsT0FBTywyQkFBa0I7UUFDekIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFO1lBQ25CLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sZ0JBQWdCLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixDQUFDO1lBQ3hELElBQUksZ0JBQWdCLFlBQVksaUNBQWUsRUFBRSxDQUFDO2dCQUNqRCxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM3QixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUMifQ==