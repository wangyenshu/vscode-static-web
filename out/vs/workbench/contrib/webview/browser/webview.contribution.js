/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/editor/browser/editorExtensions", "vs/editor/contrib/clipboard/browser/clipboard", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, dom_1, editorExtensions_1, clipboard_1, nls, actions_1, contextkey_1, webview_1, webviewEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreventDefaultContextMenuItemsContextKeyName = void 0;
    const PRIORITY = 100;
    function overrideCommandForWebview(command, f) {
        command?.addImplementation(PRIORITY, 'webview', accessor => {
            const webviewService = accessor.get(webview_1.IWebviewService);
            const webview = webviewService.activeWebview;
            if (webview?.isFocused) {
                f(webview);
                return true;
            }
            // When focused in a custom menu try to fallback to the active webview
            // This is needed for context menu actions and the menubar
            if ((0, dom_1.getActiveElement)()?.classList.contains('action-menu-item')) {
                const editorService = accessor.get(editorService_1.IEditorService);
                if (editorService.activeEditor instanceof webviewEditorInput_1.WebviewInput) {
                    f(editorService.activeEditor.webview);
                    return true;
                }
            }
            return false;
        });
    }
    overrideCommandForWebview(editorExtensions_1.UndoCommand, webview => webview.undo());
    overrideCommandForWebview(editorExtensions_1.RedoCommand, webview => webview.redo());
    overrideCommandForWebview(editorExtensions_1.SelectAllCommand, webview => webview.selectAll());
    overrideCommandForWebview(clipboard_1.CopyAction, webview => webview.copy());
    overrideCommandForWebview(clipboard_1.PasteAction, webview => webview.paste());
    overrideCommandForWebview(clipboard_1.CutAction, webview => webview.cut());
    exports.PreventDefaultContextMenuItemsContextKeyName = 'preventDefaultContextMenuItems';
    if (clipboard_1.CutAction) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.WebviewContext, {
            command: {
                id: clipboard_1.CutAction.id,
                title: nls.localize('cut', "Cut"),
            },
            group: '5_cutcopypaste',
            order: 1,
            when: contextkey_1.ContextKeyExpr.not(exports.PreventDefaultContextMenuItemsContextKeyName),
        });
    }
    if (clipboard_1.CopyAction) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.WebviewContext, {
            command: {
                id: clipboard_1.CopyAction.id,
                title: nls.localize('copy', "Copy"),
            },
            group: '5_cutcopypaste',
            order: 2,
            when: contextkey_1.ContextKeyExpr.not(exports.PreventDefaultContextMenuItemsContextKeyName),
        });
    }
    if (clipboard_1.PasteAction) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.WebviewContext, {
            command: {
                id: clipboard_1.PasteAction.id,
                title: nls.localize('paste', "Paste"),
            },
            group: '5_cutcopypaste',
            order: 3,
            when: contextkey_1.ContextKeyExpr.not(exports.PreventDefaultContextMenuItemsContextKeyName),
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlldy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3L2Jyb3dzZXIvd2Vidmlldy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQztJQUVyQixTQUFTLHlCQUF5QixDQUFDLE9BQWlDLEVBQUUsQ0FBOEI7UUFDbkcsT0FBTyxFQUFFLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUU7WUFDMUQsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUM7WUFDckQsTUFBTSxPQUFPLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQztZQUM3QyxJQUFJLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQztnQkFDeEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNYLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELHNFQUFzRTtZQUN0RSwwREFBMEQ7WUFDMUQsSUFBSSxJQUFBLHNCQUFnQixHQUFFLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLGFBQWEsQ0FBQyxZQUFZLFlBQVksaUNBQVksRUFBRSxDQUFDO29CQUN4RCxDQUFDLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDdEMsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELHlCQUF5QixDQUFDLDhCQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNsRSx5QkFBeUIsQ0FBQyw4QkFBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDbEUseUJBQXlCLENBQUMsbUNBQWdCLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUM1RSx5QkFBeUIsQ0FBQyxzQkFBVSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDakUseUJBQXlCLENBQUMsdUJBQVcsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ25FLHlCQUF5QixDQUFDLHFCQUFTLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUVsRCxRQUFBLDRDQUE0QyxHQUFHLGdDQUFnQyxDQUFDO0lBRTdGLElBQUkscUJBQVMsRUFBRSxDQUFDO1FBQ2Ysc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxjQUFjLEVBQUU7WUFDbEQsT0FBTyxFQUFFO2dCQUNSLEVBQUUsRUFBRSxxQkFBUyxDQUFDLEVBQUU7Z0JBQ2hCLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDakM7WUFDRCxLQUFLLEVBQUUsZ0JBQWdCO1lBQ3ZCLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLG9EQUE0QyxDQUFDO1NBQ3RFLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxJQUFJLHNCQUFVLEVBQUUsQ0FBQztRQUNoQixzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLGNBQWMsRUFBRTtZQUNsRCxPQUFPLEVBQUU7Z0JBQ1IsRUFBRSxFQUFFLHNCQUFVLENBQUMsRUFBRTtnQkFDakIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQzthQUNuQztZQUNELEtBQUssRUFBRSxnQkFBZ0I7WUFDdkIsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsb0RBQTRDLENBQUM7U0FDdEUsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELElBQUksdUJBQVcsRUFBRSxDQUFDO1FBQ2pCLHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsY0FBYyxFQUFFO1lBQ2xELE9BQU8sRUFBRTtnQkFDUixFQUFFLEVBQUUsdUJBQVcsQ0FBQyxFQUFFO2dCQUNsQixLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO2FBQ3JDO1lBQ0QsS0FBSyxFQUFFLGdCQUFnQjtZQUN2QixLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvREFBNEMsQ0FBQztTQUN0RSxDQUFDLENBQUM7SUFDSixDQUFDIn0=