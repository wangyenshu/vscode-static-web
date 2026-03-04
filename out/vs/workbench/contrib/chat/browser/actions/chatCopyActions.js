/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatViewModel"], function (require, exports, nls_1, actions_1, clipboardService_1, chatActions_1, chat_1, chatContextKeys_1, chatViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerChatCopyActions = registerChatCopyActions;
    function registerChatCopyActions() {
        (0, actions_1.registerAction2)(class CopyAllAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.copyAll',
                    title: (0, nls_1.localize2)('interactive.copyAll.label', "Copy All"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    menu: {
                        id: actions_1.MenuId.ChatContext,
                        when: chatContextKeys_1.CONTEXT_RESPONSE_FILTERED.toNegated(),
                        group: 'copy',
                    }
                });
            }
            run(accessor, ...args) {
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
                const widget = chatWidgetService.lastFocusedWidget;
                if (widget) {
                    const viewModel = widget.viewModel;
                    const sessionAsText = viewModel?.getItems()
                        .filter((item) => (0, chatViewModel_1.isRequestVM)(item) || ((0, chatViewModel_1.isResponseVM)(item) && !item.errorDetails?.responseIsFiltered))
                        .map(item => stringifyItem(item))
                        .join('\n\n');
                    if (sessionAsText) {
                        clipboardService.writeText(sessionAsText);
                    }
                }
            }
        });
        (0, actions_1.registerAction2)(class CopyItemAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.copyItem',
                    title: (0, nls_1.localize2)('interactive.copyItem.label', "Copy"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    menu: {
                        id: actions_1.MenuId.ChatContext,
                        when: chatContextKeys_1.CONTEXT_RESPONSE_FILTERED.toNegated(),
                        group: 'copy',
                    }
                });
            }
            run(accessor, ...args) {
                const item = args[0];
                if (!(0, chatViewModel_1.isRequestVM)(item) && !(0, chatViewModel_1.isResponseVM)(item)) {
                    return;
                }
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const text = stringifyItem(item, false);
                clipboardService.writeText(text);
            }
        });
    }
    function stringifyItem(item, includeName = true) {
        if ((0, chatViewModel_1.isRequestVM)(item)) {
            return (includeName ? `${item.username}: ` : '') + item.messageText;
        }
        else {
            return (includeName ? `${item.username}: ` : '') + item.response.asString();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdENvcHlBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2FjdGlvbnMvY2hhdENvcHlBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLDBEQTJEQztJQTNERCxTQUFnQix1QkFBdUI7UUFDdEMsSUFBQSx5QkFBZSxFQUFDLE1BQU0sYUFBYyxTQUFRLGlCQUFPO1lBQ2xEO2dCQUNDLEtBQUssQ0FBQztvQkFDTCxFQUFFLEVBQUUsK0JBQStCO29CQUNuQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsMkJBQTJCLEVBQUUsVUFBVSxDQUFDO29CQUN6RCxFQUFFLEVBQUUsS0FBSztvQkFDVCxRQUFRLEVBQUUsMkJBQWE7b0JBQ3ZCLElBQUksRUFBRTt3QkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxXQUFXO3dCQUN0QixJQUFJLEVBQUUsMkNBQXlCLENBQUMsU0FBUyxFQUFFO3dCQUMzQyxLQUFLLEVBQUUsTUFBTTtxQkFDYjtpQkFDRCxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO2dCQUM3QyxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0NBQWlCLENBQUMsQ0FBQztnQkFDekQsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHlCQUFrQixDQUFDLENBQUM7Z0JBQzNELE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDO2dCQUNuRCxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNaLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7b0JBQ25DLE1BQU0sYUFBYSxHQUFHLFNBQVMsRUFBRSxRQUFRLEVBQUU7eUJBQ3pDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBNEQsRUFBRSxDQUFDLElBQUEsMkJBQVcsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsNEJBQVksRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLENBQUMsQ0FBQzt5QkFDL0osR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUNoQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ2YsSUFBSSxhQUFhLEVBQUUsQ0FBQzt3QkFDbkIsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO29CQUMzQyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1NBQ0QsQ0FBQyxDQUFDO1FBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sY0FBZSxTQUFRLGlCQUFPO1lBQ25EO2dCQUNDLEtBQUssQ0FBQztvQkFDTCxFQUFFLEVBQUUsZ0NBQWdDO29CQUNwQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsNEJBQTRCLEVBQUUsTUFBTSxDQUFDO29CQUN0RCxFQUFFLEVBQUUsS0FBSztvQkFDVCxRQUFRLEVBQUUsMkJBQWE7b0JBQ3ZCLElBQUksRUFBRTt3QkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxXQUFXO3dCQUN0QixJQUFJLEVBQUUsMkNBQXlCLENBQUMsU0FBUyxFQUFFO3dCQUMzQyxLQUFLLEVBQUUsTUFBTTtxQkFDYjtpQkFDRCxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO2dCQUM3QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxJQUFBLDJCQUFXLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLDRCQUFZLEVBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDL0MsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBaUIsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEMsQ0FBQztTQUNELENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLGFBQWEsQ0FBQyxJQUFvRCxFQUFFLFdBQVcsR0FBRyxJQUFJO1FBQzlGLElBQUksSUFBQSwyQkFBVyxFQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDdkIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDckUsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3RSxDQUFDO0lBQ0YsQ0FBQyJ9