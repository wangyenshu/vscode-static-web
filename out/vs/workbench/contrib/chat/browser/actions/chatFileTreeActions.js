/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatViewModel"], function (require, exports, nls_1, actions_1, chatActions_1, chat_1, chatContextKeys_1, chatViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerChatFileTreeActions = registerChatFileTreeActions;
    function registerChatFileTreeActions() {
        (0, actions_1.registerAction2)(class NextFileTreeAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.nextFileTree',
                    title: (0, nls_1.localize2)('interactive.nextFileTree.label', "Next File Tree"),
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 67 /* KeyCode.F9 */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: chatContextKeys_1.CONTEXT_IN_CHAT_SESSION,
                    },
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                });
            }
            run(accessor, ...args) {
                navigateTrees(accessor, false);
            }
        });
        (0, actions_1.registerAction2)(class PreviousFileTreeAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.previousFileTree',
                    title: (0, nls_1.localize2)('interactive.previousFileTree.label', "Previous File Tree"),
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 67 /* KeyCode.F9 */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: chatContextKeys_1.CONTEXT_IN_CHAT_SESSION,
                    },
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    f1: true,
                    category: chatActions_1.CHAT_CATEGORY,
                });
            }
            run(accessor, ...args) {
                navigateTrees(accessor, true);
            }
        });
    }
    function navigateTrees(accessor, reverse) {
        const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
        const widget = chatWidgetService.lastFocusedWidget;
        if (!widget) {
            return;
        }
        const focused = !widget.inputEditor.hasWidgetFocus() && widget.getFocus();
        const focusedResponse = (0, chatViewModel_1.isResponseVM)(focused) ? focused : undefined;
        const currentResponse = focusedResponse ?? widget.viewModel?.getItems().reverse().find((item) => (0, chatViewModel_1.isResponseVM)(item));
        if (!currentResponse) {
            return;
        }
        widget.reveal(currentResponse);
        const responseFileTrees = widget.getFileTreeInfosForResponse(currentResponse);
        const lastFocusedFileTree = widget.getLastFocusedFileTreeForResponse(currentResponse);
        const focusIdx = lastFocusedFileTree ?
            (lastFocusedFileTree.treeIndex + (reverse ? -1 : 1) + responseFileTrees.length) % responseFileTrees.length :
            reverse ? responseFileTrees.length - 1 : 0;
        responseFileTrees[focusIdx]?.focus();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEZpbGVUcmVlQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9hY3Rpb25zL2NoYXRGaWxlVHJlZUFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsa0VBMENDO0lBMUNELFNBQWdCLDJCQUEyQjtRQUMxQyxJQUFBLHlCQUFlLEVBQUMsTUFBTSxrQkFBbUIsU0FBUSxpQkFBTztZQUN2RDtnQkFDQyxLQUFLLENBQUM7b0JBQ0wsRUFBRSxFQUFFLG9DQUFvQztvQkFDeEMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLGdDQUFnQyxFQUFFLGdCQUFnQixDQUFDO29CQUNwRSxVQUFVLEVBQUU7d0JBQ1gsT0FBTyxFQUFFLCtDQUEyQjt3QkFDcEMsTUFBTSw2Q0FBbUM7d0JBQ3pDLElBQUksRUFBRSx5Q0FBdUI7cUJBQzdCO29CQUNELFlBQVksRUFBRSxzQ0FBb0I7b0JBQ2xDLEVBQUUsRUFBRSxJQUFJO29CQUNSLFFBQVEsRUFBRSwyQkFBYTtpQkFDdkIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELEdBQUcsQ0FBQyxRQUEwQixFQUFFLEdBQUcsSUFBVztnQkFDN0MsYUFBYSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoQyxDQUFDO1NBQ0QsQ0FBQyxDQUFDO1FBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sc0JBQXVCLFNBQVEsaUJBQU87WUFDM0Q7Z0JBQ0MsS0FBSyxDQUFDO29CQUNMLEVBQUUsRUFBRSx3Q0FBd0M7b0JBQzVDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxvQ0FBb0MsRUFBRSxvQkFBb0IsQ0FBQztvQkFDNUUsVUFBVSxFQUFFO3dCQUNYLE9BQU8sRUFBRSxtREFBNkIsc0JBQWE7d0JBQ25ELE1BQU0sNkNBQW1DO3dCQUN6QyxJQUFJLEVBQUUseUNBQXVCO3FCQUM3QjtvQkFDRCxZQUFZLEVBQUUsc0NBQW9CO29CQUNsQyxFQUFFLEVBQUUsSUFBSTtvQkFDUixRQUFRLEVBQUUsMkJBQWE7aUJBQ3ZCLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7Z0JBQzdDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDL0IsQ0FBQztTQUNELENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLGFBQWEsQ0FBQyxRQUEwQixFQUFFLE9BQWdCO1FBQ2xFLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5QkFBa0IsQ0FBQyxDQUFDO1FBQzNELE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDO1FBQ25ELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNiLE9BQU87UUFDUixDQUFDO1FBRUQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMxRSxNQUFNLGVBQWUsR0FBRyxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBRXBFLE1BQU0sZUFBZSxHQUFHLGVBQWUsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBa0MsRUFBRSxDQUFDLElBQUEsNEJBQVksRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3JKLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN0QixPQUFPO1FBQ1IsQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDL0IsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsMkJBQTJCLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDOUUsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLENBQUMsaUNBQWlDLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDdEYsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUMsQ0FBQztZQUNyQyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVHLE9BQU8sQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTVDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ3RDLENBQUMifQ==