/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/config/editorZoom", "vs/nls"], function (require, exports, editorExtensions_1, editorZoom_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EditorFontZoomIn extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.fontZoomIn',
                label: nls.localize('EditorFontZoomIn.label', "Increase Editor Font Size"),
                alias: 'Increase Editor Font Size',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            editorZoom_1.EditorZoom.setZoomLevel(editorZoom_1.EditorZoom.getZoomLevel() + 1);
        }
    }
    class EditorFontZoomOut extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.fontZoomOut',
                label: nls.localize('EditorFontZoomOut.label', "Decrease Editor Font Size"),
                alias: 'Decrease Editor Font Size',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            editorZoom_1.EditorZoom.setZoomLevel(editorZoom_1.EditorZoom.getZoomLevel() - 1);
        }
    }
    class EditorFontZoomReset extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.fontZoomReset',
                label: nls.localize('EditorFontZoomReset.label', "Reset Editor Font Size"),
                alias: 'Reset Editor Font Size',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            editorZoom_1.EditorZoom.setZoomLevel(0);
        }
    }
    (0, editorExtensions_1.registerEditorAction)(EditorFontZoomIn);
    (0, editorExtensions_1.registerEditorAction)(EditorFontZoomOut);
    (0, editorExtensions_1.registerEditorAction)(EditorFontZoomReset);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9udFpvb20uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9mb250Wm9vbS9icm93c2VyL2ZvbnRab29tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLE1BQU0sZ0JBQWlCLFNBQVEsK0JBQVk7UUFFMUM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDBCQUEwQjtnQkFDOUIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsd0JBQXdCLEVBQUUsMkJBQTJCLENBQUM7Z0JBQzFFLEtBQUssRUFBRSwyQkFBMkI7Z0JBQ2xDLFlBQVksRUFBRSxTQUFTO2FBQ3ZCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxHQUFHLENBQUMsUUFBMEIsRUFBRSxNQUFtQjtZQUN6RCx1QkFBVSxDQUFDLFlBQVksQ0FBQyx1QkFBVSxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hELENBQUM7S0FDRDtJQUVELE1BQU0saUJBQWtCLFNBQVEsK0JBQVk7UUFFM0M7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDJCQUEyQjtnQkFDL0IsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMseUJBQXlCLEVBQUUsMkJBQTJCLENBQUM7Z0JBQzNFLEtBQUssRUFBRSwyQkFBMkI7Z0JBQ2xDLFlBQVksRUFBRSxTQUFTO2FBQ3ZCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxHQUFHLENBQUMsUUFBMEIsRUFBRSxNQUFtQjtZQUN6RCx1QkFBVSxDQUFDLFlBQVksQ0FBQyx1QkFBVSxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hELENBQUM7S0FDRDtJQUVELE1BQU0sbUJBQW9CLFNBQVEsK0JBQVk7UUFFN0M7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDZCQUE2QjtnQkFDakMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLEVBQUUsd0JBQXdCLENBQUM7Z0JBQzFFLEtBQUssRUFBRSx3QkFBd0I7Z0JBQy9CLFlBQVksRUFBRSxTQUFTO2FBQ3ZCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxHQUFHLENBQUMsUUFBMEIsRUFBRSxNQUFtQjtZQUN6RCx1QkFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixDQUFDO0tBQ0Q7SUFFRCxJQUFBLHVDQUFvQixFQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDdkMsSUFBQSx1Q0FBb0IsRUFBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQ3hDLElBQUEsdUNBQW9CLEVBQUMsbUJBQW1CLENBQUMsQ0FBQyJ9