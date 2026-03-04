/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/contributions", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/chat/browser/actions/chatAccessibilityHelp", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatWidgetHistoryService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/views/common/viewsService"], function (require, exports, codicons_1, lifecycle_1, themables_1, editorExtensions_1, codeEditorService_1, nls_1, actions_1, contextkey_1, contextkeys_1, quickInput_1, platform_1, viewPane_1, contributions_1, accessibleViewActions_1, chatAccessibilityHelp_1, chat_1, chatEditorInput_1, chatAgents_1, chatContextKeys_1, chatService_1, chatWidgetHistoryService_1, editorService_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CHAT_OPEN_ACTION_ID = exports.CHAT_CATEGORY = void 0;
    exports.isChatViewTitleActionContext = isChatViewTitleActionContext;
    exports.registerChatActions = registerChatActions;
    function isChatViewTitleActionContext(obj) {
        return obj instanceof Object && 'chatView' in obj;
    }
    exports.CHAT_CATEGORY = (0, nls_1.localize2)('chat.category', 'Chat');
    exports.CHAT_OPEN_ACTION_ID = 'workbench.action.chat.open';
    class OpenChatGlobalAction extends actions_1.Action2 {
        constructor() {
            super({
                id: exports.CHAT_OPEN_ACTION_ID,
                title: (0, nls_1.localize2)('openChat', "Open Chat"),
                icon: codicons_1.Codicon.commentDiscussion,
                f1: false,
                category: exports.CHAT_CATEGORY,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 39 /* KeyCode.KeyI */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 39 /* KeyCode.KeyI */
                    }
                }
            });
        }
        async run(accessor, opts) {
            opts = typeof opts === 'string' ? { query: opts } : opts;
            const chatWidget = await (0, chat_1.showChatView)(accessor.get(viewsService_1.IViewsService));
            if (!chatWidget) {
                return;
            }
            if (opts?.query) {
                if (opts.isPartialQuery) {
                    chatWidget.setInput(opts.query);
                }
                else {
                    chatWidget.acceptInput(opts.query);
                }
            }
            chatWidget.focusInput();
        }
    }
    class ChatHistoryAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: chat_1.CHAT_VIEW_ID,
                id: `workbench.action.chat.history`,
                title: (0, nls_1.localize2)('chat.history.label', "Show Chats..."),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyExpr.equals('view', chat_1.CHAT_VIEW_ID),
                    group: 'navigation',
                    order: -1
                },
                category: exports.CHAT_CATEGORY,
                icon: codicons_1.Codicon.history,
                f1: true,
                precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED
            });
        }
        async runInView(accessor, view) {
            const chatService = accessor.get(chatService_1.IChatService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const items = chatService.getHistory();
            const picks = items.map(i => ({
                label: i.title,
                chat: i,
                buttons: [{
                        iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.x),
                        tooltip: (0, nls_1.localize)('interactiveSession.history.delete', "Delete"),
                    }]
            }));
            const selection = await quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('interactiveSession.history.pick', "Switch to chat"),
                onDidTriggerItemButton: context => {
                    chatService.removeHistoryEntry(context.item.chat.sessionId);
                    context.removeItem();
                }
            });
            if (selection) {
                const sessionId = selection.chat.sessionId;
                const view = await viewsService.openView(chat_1.CHAT_VIEW_ID);
                view.loadSession(sessionId);
            }
        }
    }
    class OpenChatEditorAction extends actions_1.Action2 {
        constructor() {
            super({
                id: `workbench.action.openChat`,
                title: (0, nls_1.localize2)('interactiveSession.open', "Open Editor"),
                f1: true,
                category: exports.CHAT_CATEGORY,
                precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            await editorService.openEditor({ resource: chatEditorInput_1.ChatEditorInput.getNewEditorUri(), options: { pinned: true } });
        }
    }
    function registerChatActions() {
        (0, actions_1.registerAction2)(OpenChatGlobalAction);
        (0, actions_1.registerAction2)(ChatHistoryAction);
        (0, actions_1.registerAction2)(OpenChatEditorAction);
        (0, actions_1.registerAction2)(class ClearChatInputHistoryAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.clearInputHistory',
                    title: (0, nls_1.localize2)('interactiveSession.clearHistory.label', "Clear Input History"),
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    category: exports.CHAT_CATEGORY,
                    f1: true,
                });
            }
            async run(accessor, ...args) {
                const historyService = accessor.get(chatWidgetHistoryService_1.IChatWidgetHistoryService);
                historyService.clearHistory();
            }
        });
        (0, actions_1.registerAction2)(class ClearChatHistoryAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.clearHistory',
                    title: (0, nls_1.localize2)('chat.clear.label', "Clear All Workspace Chats"),
                    precondition: chatContextKeys_1.CONTEXT_CHAT_ENABLED,
                    category: exports.CHAT_CATEGORY,
                    f1: true,
                });
            }
            async run(accessor, ...args) {
                const chatService = accessor.get(chatService_1.IChatService);
                chatService.clearAllHistoryEntries();
            }
        });
        (0, actions_1.registerAction2)(class FocusChatAction extends editorExtensions_1.EditorAction2 {
            constructor() {
                super({
                    id: 'chat.action.focus',
                    title: (0, nls_1.localize2)('actions.interactiveSession.focus', 'Focus Chat List'),
                    precondition: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_IN_CHAT_INPUT, chatContextKeys_1.CONTEXT_CHAT_LOCATION.isEqualTo(chatAgents_1.ChatAgentLocation.Panel)),
                    category: exports.CHAT_CATEGORY,
                    keybinding: [
                        // On mac, require that the cursor is at the top of the input, to avoid stealing cmd+up to move the cursor to the top
                        {
                            when: chatContextKeys_1.CONTEXT_CHAT_INPUT_CURSOR_AT_TOP,
                            primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                        },
                        // On win/linux, ctrl+up can always focus the chat list
                        {
                            when: contextkey_1.ContextKeyExpr.or(contextkeys_1.IsWindowsContext, contextkeys_1.IsLinuxContext),
                            primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                        }
                    ]
                });
            }
            runEditorCommand(accessor, editor) {
                const editorUri = editor.getModel()?.uri;
                if (editorUri) {
                    const widgetService = accessor.get(chat_1.IChatWidgetService);
                    widgetService.getWidgetByInputUri(editorUri)?.focusLastMessage();
                }
            }
        });
        class ChatAccessibilityHelpContribution extends lifecycle_1.Disposable {
            constructor() {
                super();
                this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(105, 'panelChat', async (accessor) => {
                    const codeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getActiveCodeEditor() || accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
                    (0, chatAccessibilityHelp_1.runAccessibilityHelpAction)(accessor, codeEditor ?? undefined, 'panelChat');
                }, contextkey_1.ContextKeyExpr.or(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, chatContextKeys_1.CONTEXT_RESPONSE, chatContextKeys_1.CONTEXT_REQUEST)));
            }
        }
        const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
        workbenchRegistry.registerWorkbenchContribution(ChatAccessibilityHelpContribution, 4 /* LifecyclePhase.Eventually */);
        (0, actions_1.registerAction2)(class FocusChatInputAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.focusInput',
                    title: (0, nls_1.localize2)('interactiveSession.focusInput.label', "Focus Chat Input"),
                    f1: false,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, chatContextKeys_1.CONTEXT_IN_CHAT_INPUT.negate())
                    }
                });
            }
            run(accessor, ...args) {
                const widgetService = accessor.get(chat_1.IChatWidgetService);
                widgetService.lastFocusedWidget?.focusInput();
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvYWN0aW9ucy9jaGF0QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQ2hHLG9FQUVDO0lBc0hELGtEQXNHQztJQTlORCxTQUFnQiw0QkFBNEIsQ0FBQyxHQUFZO1FBQ3hELE9BQU8sR0FBRyxZQUFZLE1BQU0sSUFBSSxVQUFVLElBQUksR0FBRyxDQUFDO0lBQ25ELENBQUM7SUFFWSxRQUFBLGFBQWEsR0FBRyxJQUFBLGVBQVMsRUFBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbkQsUUFBQSxtQkFBbUIsR0FBRyw0QkFBNEIsQ0FBQztJQWFoRSxNQUFNLG9CQUFxQixTQUFRLGlCQUFPO1FBQ3pDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwyQkFBbUI7Z0JBQ3ZCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxVQUFVLEVBQUUsV0FBVyxDQUFDO2dCQUN6QyxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxpQkFBaUI7Z0JBQy9CLEVBQUUsRUFBRSxLQUFLO2dCQUNULFFBQVEsRUFBRSxxQkFBYTtnQkFDdkIsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxPQUFPLEVBQUUsZ0RBQTJCLHdCQUFlO29CQUNuRCxHQUFHLEVBQUU7d0JBQ0osT0FBTyxFQUFFLG9EQUErQix3QkFBZTtxQkFDdkQ7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLElBQW9DO1lBQ2xGLElBQUksR0FBRyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLElB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