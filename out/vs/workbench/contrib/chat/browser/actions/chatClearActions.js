/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contextkeys", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/actions/chatClear", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/common/chatContextKeys"], function (require, exports, codicons_1, nls_1, accessibilitySignalService_1, actions_1, contextkey_1, contextkeys_1, chatActions_1, chatClear_1, chat_1, chatEditorInput_1, chatContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ACTION_ID_NEW_CHAT = void 0;
    exports.registerNewChatActions = registerNewChatActions;
    exports.ACTION_ID_NEW_CHAT = `workbench.action.chat.newChat`;
    function registerNewChatActions() {
        (0, actions_1.registerAction2)(class NewChatEditorAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chatEditor.newChat',
                    title: (0, nls_1.localize2)('chat.newChat.label', "New Chat"),
                    icon: codicons_1.Codicon.plus,
                    f1: false,
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    menu: [{
                            id: actions_1.MenuId.EditorTitle,
                            group: 'navigation',
                            order: 0,
                            when: contextkeys_1.ActiveEditorContext.isEqualTo(chatEditorInput_1.ChatEditorInput.EditorID),
                        }]
                });
            }
            async run(accessor, ...args) {
                announceChatCleared(accessor);
                await (0, chatClear_1.clearChatEditor)(accessor);
            }
        });
        (0, actions_1.registerAction2)(class GlobalClearChatAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.ACTION_ID_NEW_CHAT,
                    title: (0, nls_1.localize2)('chat.newChat.label', "New Chat"),
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.plus,
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                    keybinding: {
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */,
                        mac: {
                            primary: 256 /* KeyMod.WinCtrl */ | 42 /* KeyCode.KeyL */
                        },
                        when: chatContextKeys_1.CONTEXT_IN_CHAT_SESSION
                    },
                    menu: [{
                            id: actions_1.MenuId.ChatContext,
                            group: 'z_clear'
                        },
                        {
                            id: actions_1.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.equals('view', chat_1.CHAT_VIEW_ID),
                            group: 'navigation',
                            order: -1
                        }]
                });
            }
            run(accessor, ...args) {
                const context = args[0];
                if ((0, chatActions_1.isChatViewTitleActionContext)(context)) {
                    // Is running in the Chat view title
                    announceChatCleared(accessor);
                    context.chatView.clear();
                    context.chatView.widget.focusInput();
                }
                else {
                    // Is running from f1 or keybinding
                    const widgetService = accessor.get(chat_1.IChatWidgetService);
                    const widget = widgetService.lastFocusedWidget;
                    if (!widget) {
                        return;
                    }
                    announceChatCleared(accessor);
                    widget.clear();
                    widget.focusInput();
                }
            }
        });
    }
    function announceChatCleared(accessor) {
        accessor.get(accessibilitySignalService_1.IAccessibilitySignalService).playSignal(accessibilitySignalService_1.AccessibilitySignal.clear);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdENsZWFyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9hY3Rpb25zL2NoYXRDbGVhckFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUJoRyx3REEwRUM7SUE1RVksUUFBQSxrQkFBa0IsR0FBRywrQkFBK0IsQ0FBQztJQUVsRSxTQUFnQixzQkFBc0I7UUFDckMsSUFBQSx5QkFBZSxFQUFDLE1BQU0sbUJBQW9CLFNBQVEsaUJBQU87WUFDeEQ7Z0JBQ0MsS0FBSyxDQUFDO29CQUNMLEVBQUUsRUFBRSxxQ0FBcUM7b0JBQ3pDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxvQkFBb0IsRUFBRSxVQUFVLENBQUM7b0JBQ2xELElBQUksRUFBRSxrQkFBTyxDQUFDLElBQUk7b0JBQ2xCLEVBQUUsRUFBRSxLQUFLO29CQUNULFlBQVksRUFBRSxzQ0FBb0I7b0JBQ2xDLElBQUksRUFBRSxDQUFDOzRCQUNOLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFdBQVc7NEJBQ3RCLEtBQUssRUFBRSxZQUFZOzRCQUNuQixLQUFLLEVBQUUsQ0FBQzs0QkFDUixJQUFJLEVBQUUsaUNBQW1CLENBQUMsU0FBUyxDQUFDLGlDQUFlLENBQUMsUUFBUSxDQUFDO3lCQUM3RCxDQUFDO2lCQUNGLENBQUMsQ0FBQztZQUNKLENBQUM7WUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO2dCQUNuRCxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDOUIsTUFBTSxJQUFBLDJCQUFlLEVBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsQ0FBQztTQUNELENBQUMsQ0FBQztRQUVILElBQUEseUJBQWUsRUFBQyxNQUFNLHFCQUFzQixTQUFRLGlCQUFPO1lBQzFEO2dCQUNDLEtBQUssQ0FBQztvQkFDTCxFQUFFLEVBQUUsMEJBQWtCO29CQUN0QixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsb0JBQW9CLEVBQUUsVUFBVSxDQUFDO29CQUNsRCxRQUFRLEVBQUUsMkJBQWE7b0JBQ3ZCLElBQUksRUFBRSxrQkFBTyxDQUFDLElBQUk7b0JBQ2xCLFlBQVksRUFBRSxzQ0FBb0I7b0JBQ2xDLEVBQUUsRUFBRSxJQUFJO29CQUNSLFVBQVUsRUFBRTt3QkFDWCxNQUFNLDZDQUFtQzt3QkFDekMsT0FBTyxFQUFFLGlEQUE2Qjt3QkFDdEMsR0FBRyxFQUFFOzRCQUNKLE9BQU8sRUFBRSxnREFBNkI7eUJBQ3RDO3dCQUNELElBQUksRUFBRSx5Q0FBdUI7cUJBQzdCO29CQUNELElBQUksRUFBRSxDQUFDOzRCQUNOLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFdBQVc7NEJBQ3RCLEtBQUssRUFBRSxTQUFTO3lCQUNoQjt3QkFDRDs0QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxTQUFTOzRCQUNwQixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLG1CQUFZLENBQUM7NEJBQ2pELEtBQUssRUFBRSxZQUFZOzRCQUNuQixLQUFLLEVBQUUsQ0FBQyxDQUFDO3lCQUNULENBQUM7aUJBQ0YsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELEdBQUcsQ0FBQyxRQUEwQixFQUFFLEdBQUcsSUFBVztnQkFDN0MsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixJQUFJLElBQUEsMENBQTRCLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDM0Msb0NBQW9DO29CQUNwQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDOUIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDekIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxtQ0FBbUM7b0JBQ25DLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUJBQWtCLENBQUMsQ0FBQztvQkFFdkQsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFDO29CQUMvQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ2IsT0FBTztvQkFDUixDQUFDO29CQUNELG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUM5QixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2YsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixDQUFDO1lBQ0YsQ0FBQztTQUNELENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLG1CQUFtQixDQUFDLFFBQTBCO1FBQ3RELFFBQVEsQ0FBQyxHQUFHLENBQUMsd0RBQTJCLENBQUMsQ0FBQyxVQUFVLENBQUMsZ0RBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakYsQ0FBQyJ9