/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatService"], function (require, exports, codicons_1, nls_1, actions_1, contextkey_1, chatActions_1, chat_1, chatAgents_1, chatContextKeys_1, chatParserTypes_1, chatService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CancelAction = exports.ChatSubmitSecondaryAgentAction = exports.SubmitAction = void 0;
    exports.registerChatExecuteActions = registerChatExecuteActions;
    class SubmitAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.submit'; }
        constructor() {
            super({
                id: SubmitAction.ID,
                title: (0, nls_1.localize2)('interactive.submit.label', "Send"),
                f1: false,
                category: chatActions_1.CHAT_CATEGORY,
                icon: codicons_1.Codicon.send,
                precondition: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_TEXT, chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate()),
                keybinding: {
                    when: chatContextKeys_1.CONTEXT_IN_CHAT_INPUT,
                    primary: 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menu: [
                    {
                        id: actions_1.MenuId.ChatExecuteSecondary,
                        group: 'group_1',
                    },
                    {
                        id: actions_1.MenuId.ChatExecute,
                        when: chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate(),
                        group: 'navigation',
                    },
                ]
            });
        }
        run(accessor, ...args) {
            const context = args[0];
            const widgetService = accessor.get(chat_1.IChatWidgetService);
            const widget = context?.widget ?? widgetService.lastFocusedWidget;
            widget?.acceptInput(context?.inputValue);
        }
    }
    exports.SubmitAction = SubmitAction;
    class ChatSubmitSecondaryAgentAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.submitSecondaryAgent'; }
        constructor() {
            super({
                id: ChatSubmitSecondaryAgentAction.ID,
                title: (0, nls_1.localize2)({ key: 'actions.chat.submitSecondaryAgent', comment: ['Send input from the chat input box to the secondary agent'] }, "Submit to Secondary Agent"),
                precondition: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_TEXT, chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_AGENT.negate(), chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate()),
                keybinding: {
                    when: chatContextKeys_1.CONTEXT_IN_CHAT_INPUT,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menu: {
                    id: actions_1.MenuId.ChatExecuteSecondary,
                    group: 'group_1'
                }
            });
        }
        run(accessor, ...args) {
            const context = args[0];
            const agentService = accessor.get(chatAgents_1.IChatAgentService);
            const secondaryAgent = agentService.getSecondaryAgent();
            if (!secondaryAgent) {
                return;
            }
            const widgetService = accessor.get(chat_1.IChatWidgetService);
            const widget = context?.widget ?? widgetService.lastFocusedWidget;
            if (!widget) {
                return;
            }
            if ((0, chatParserTypes_1.extractAgentAndCommand)(widget.parsedInput).agentPart) {
                widget.acceptInput();
            }
            else {
                widget.lastSelectedAgent = secondaryAgent;
                widget.acceptInputWithPrefix(`${chatParserTypes_1.chatAgentLeader}${secondaryAgent.name}`);
            }
        }
    }
    exports.ChatSubmitSecondaryAgentAction = ChatSubmitSecondaryAgentAction;
    class SendToNewChatAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.chat.sendToNewChat',
                title: (0, nls_1.localize2)('chat.newChat.label', "Send to New Chat"),
                precondition: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate(), chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_TEXT),
                category: chatActions_1.CHAT_CATEGORY,
                f1: false,
                menu: {
                    id: actions_1.MenuId.ChatExecuteSecondary,
                    group: 'group_2'
                },
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    when: chatContextKeys_1.CONTEXT_IN_CHAT_INPUT,
                }
            });
        }
        async run(accessor, ...args) {
            const context = args[0];
            const widgetService = accessor.get(chat_1.IChatWidgetService);
            const widget = context?.widget ?? widgetService.lastFocusedWidget;
            if (!widget) {
                return;
            }
            widget.clear();
            widget.acceptInput(context?.inputValue);
        }
    }
    class CancelAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.cancel'; }
        constructor() {
            super({
                id: CancelAction.ID,
                title: (0, nls_1.localize2)('interactive.cancel.label', "Cancel"),
                f1: false,
                category: chatActions_1.CHAT_CATEGORY,
                icon: codicons_1.Codicon.debugStop,
                menu: {
                    id: actions_1.MenuId.ChatExecute,
                    when: chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS,
                    group: 'navigation',
                },
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 9 /* KeyCode.Escape */,
                }
            });
        }
        run(accessor, ...args) {
            const context = args[0];
            const widgetService = accessor.get(chat_1.IChatWidgetService);
            const widget = context?.widget ?? widgetService.lastFocusedWidget;
            if (!widget) {
                return;
            }
            const chatService = accessor.get(chatService_1.IChatService);
            if (widget.viewModel) {
                chatService.cancelCurrentRequestForSession(widget.viewModel.sessionId);
            }
        }
    }
    exports.CancelAction = CancelAction;
    function registerChatExecuteActions() {
        (0, actions_1.registerAction2)(SubmitAction);
        (0, actions_1.registerAction2)(CancelAction);
        (0, actions_1.registerAction2)(SendToNewChatAction);
        (0, actions_1.registerAction2)(ChatSubmitSecondaryAgentAction);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEV4ZWN1dGVBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2FjdGlvbnMvY2hhdEV4ZWN1dGVBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9MaEcsZ0VBS0M7SUEvSkQsTUFBYSxZQUFhLFNBQVEsaUJBQU87aUJBQ3hCLE9BQUUsR0FBRyw4QkFBOEIsQ0FBQztRQUVwRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsWUFBWSxDQUFDLEVBQUU7Z0JBQ25CLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQywwQkFBMEIsRUFBRSxNQUFNLENBQUM7Z0JBQ3BELEVBQUUsRUFBRSxLQUFLO2dCQUNULFFBQVEsRUFBRSwyQkFBYTtnQkFDdkIsSUFBSSxFQUFFLGtCQUFPLENBQUMsSUFBSTtnQkFDbEIsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDZDQUEyQixFQUFFLGtEQUFnQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN4RyxVQUFVLEVBQUU7b0JBQ1gsSUFBSSxFQUFFLHVDQUFxQjtvQkFDM0IsT0FBTyx1QkFBZTtvQkFDdEIsTUFBTSwwQ0FBZ0M7aUJBQ3RDO2dCQUNELElBQUksRUFBRTtvQkFDTDt3QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxvQkFBb0I7d0JBQy9CLEtBQUssRUFBRSxTQUFTO3FCQUNoQjtvQkFDRDt3QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxXQUFXO3dCQUN0QixJQUFJLEVBQUUsa0RBQWdDLENBQUMsTUFBTSxFQUFFO3dCQUMvQyxLQUFLLEVBQUUsWUFBWTtxQkFDbkI7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCLEVBQUUs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