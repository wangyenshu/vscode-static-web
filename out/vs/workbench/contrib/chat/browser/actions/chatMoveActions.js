/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contextkeys", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/views/common/viewsService"], function (require, exports, nls_1, actions_1, contextkey_1, contextkeys_1, chatActions_1, chat_1, chatEditorInput_1, chatContextKeys_1, editorGroupsService_1, editorService_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerMoveActions = registerMoveActions;
    var MoveToNewLocation;
    (function (MoveToNewLocation) {
        MoveToNewLocation["Editor"] = "Editor";
        MoveToNewLocation["Window"] = "Window";
    })(MoveToNewLocation || (MoveToNewLocation = {}));
    function registerMoveActions() {
        (0, actions_1.registerAction2)(class GlobalMoveToEditorAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: `workbench.action.chat.openInEditor`,
                    title: (0, nls_1.localize2)('chat.openInEditor.label', "Open Chat in Editor"),
                    category: chatActions_1.CHAT_CATEGORY,
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                    menu: {
                        id: actions_1.MenuId.ViewTitle,
                        when: contextkey_1.ContextKeyExpr.equals('view', chat_1.CHAT_VIEW_ID),
                        order: 0
                    },
                });
            }
            async run(accessor, ...args) {
                const context = args[0];
                executeMoveToAction(accessor, MoveToNewLocation.Editor, (0, chatActions_1.isChatViewTitleActionContext)(context) ? context.chatView : undefined);
            }
        });
        (0, actions_1.registerAction2)(class GlobalMoveToNewWindowAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: `workbench.action.chat.openInNewWindow`,
                    title: (0, nls_1.localize2)('chat.openInNewWindow.label', "Open Chat in New Window"),
                    category: chatActions_1.CHAT_CATEGORY,
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                    menu: {
                        id: actions_1.MenuId.ViewTitle,
                        when: contextkey_1.ContextKeyExpr.equals('view', chat_1.CHAT_VIEW_ID),
                        order: 0
                    },
                });
            }
            async run(accessor, ...args) {
                const context = args[0];
                executeMoveToAction(accessor, MoveToNewLocation.Window, (0, chatActions_1.isChatViewTitleActionContext)(context) ? context.chatView : undefined);
            }
        });
        (0, actions_1.registerAction2)(class GlobalMoveToSidebarAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: `workbench.action.chat.openInSidebar`,
                    title: (0, nls_1.localize2)('interactiveSession.openInSidebar.label', "Open Chat in Side Bar"),
                    category: chatActions_1.CHAT_CATEGORY,
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                    menu: [{
                            id: actions_1.MenuId.EditorTitle,
                            order: 0,
                            when: contextkeys_1.ActiveEditorContext.isEqualTo(chatEditorInput_1.ChatEditorInput.EditorID),
                        }]
                });
            }
            async run(accessor, ...args) {
                return moveToSidebar(accessor);
            }
        });
    }
    async function executeMoveToAction(accessor, moveTo, chatView) {
        const widgetService = accessor.get(chat_1.IChatWidgetService);
        const viewService = accessor.get(viewsService_1.IViewsService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const widget = chatView?.widget ?? widgetService.lastFocusedWidget;
        if (!widget || !('viewId' in widget.viewContext)) {
            await editorService.openEditor({ resource: chatEditorInput_1.ChatEditorInput.getNewEditorUri(), options: { pinned: true } }, moveTo === MoveToNewLocation.Window ? editorService_1.AUX_WINDOW_GROUP : editorService_1.ACTIVE_GROUP);
            return;
        }
        const viewModel = widget.viewModel;
        if (!viewModel) {
            return;
        }
        const sessionId = viewModel.sessionId;
        const view = await viewService.openView(widget.viewContext.viewId);
        const viewState = view.widget.getViewState();
        view.clear();
        await editorService.openEditor({ resource: chatEditorInput_1.ChatEditorInput.getNewEditorUri(), options: { target: { sessionId }, pinned: true, viewState: viewState } }, moveTo === MoveToNewLocation.Window ? editorService_1.AUX_WINDOW_GROUP : editorService_1.ACTIVE_GROUP);
    }
    async function moveToSidebar(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const chatEditorInput = editorService.activeEditor;
        if (chatEditorInput instanceof chatEditorInput_1.ChatEditorInput && chatEditorInput.sessionId) {
            await editorService.closeEditor({ editor: chatEditorInput, groupId: editorGroupService.activeGroup.id });
            const view = await viewsService.openView(chat_1.CHAT_VIEW_ID);
            view.loadSession(chatEditorInput.sessionId);
        }
        else {
            await viewsService.openView(chat_1.CHAT_VIEW_ID);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdE1vdmVBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2FjdGlvbnMvY2hhdE1vdmVBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxrREFpRUM7SUF0RUQsSUFBSyxpQkFHSjtJQUhELFdBQUssaUJBQWlCO1FBQ3JCLHNDQUFpQixDQUFBO1FBQ2pCLHNDQUFpQixDQUFBO0lBQ2xCLENBQUMsRUFISSxpQkFBaUIsS0FBakIsaUJBQWlCLFFBR3JCO0lBRUQsU0FBZ0IsbUJBQW1CO1FBQ2xDLElBQUEseUJBQWUsRUFBQyxNQUFNLHdCQUF5QixTQUFRLGlCQUFPO1lBQzdEO2dCQUNDLEtBQUssQ0FBQztvQkFDTCxFQUFFLEVBQUUsb0NBQW9DO29CQUN4QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMseUJBQXlCLEVBQUUscUJBQXFCLENBQUM7b0JBQ2xFLFFBQVEsRUFBRSwyQkFBYTtvQkFDdkIsWUFBWSxFQUFFLHNDQUFvQjtvQkFDbEMsRUFBRSxFQUFFLElBQUk7b0JBQ1IsSUFBSSxFQUFFO3dCQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFNBQVM7d0JBQ3BCLElBQUksRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsbUJBQVksQ0FBQzt3QkFDakQsS0FBSyxFQUFFLENBQUM7cUJBQ1I7aUJBQ0QsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7Z0JBQ25ELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsbUJBQW1CLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxJQUFB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