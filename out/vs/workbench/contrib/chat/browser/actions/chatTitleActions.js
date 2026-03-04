/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/marked/marked", "vs/editor/browser/services/bulkEditService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/services/editor/common/editorService"], function (require, exports, codicons_1, marked_1, bulkEditService_1, nls_1, actions_1, contextkey_1, bulkCellEdits_1, chatActions_1, chat_1, chatAgents_1, chatContextKeys_1, chatService_1, chatViewModel_1, notebookCommon_1, notebookContextKeys_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerChatTitleActions = registerChatTitleActions;
    function registerChatTitleActions() {
        (0, actions_1.registerAction2)(class MarkHelpfulAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.markHelpful',
                    title: (0, nls_1.localize2)('interactive.helpful.label', "Helpful"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.thumbsup,
                    toggled: chatContextKeys_1.CONTEXT_RESPONSE_VOTE.isEqualTo('up'),
                    menu: {
                        id: actions_1.MenuId.ChatMessageTitle,
                        group: 'navigation',
                        order: 1,
                        when: chatContextKeys_1.CONTEXT_RESPONSE
                    }
                });
            }
            run(accessor, ...args) {
                const item = args[0];
                if (!(0, chatViewModel_1.isResponseVM)(item)) {
                    return;
                }
                const chatService = accessor.get(chatService_1.IChatService);
                chatService.notifyUserAction({
                    agentId: item.agent?.id,
                    sessionId: item.sessionId,
                    requestId: item.requestId,
                    result: item.result,
                    action: {
                        kind: 'vote',
                        direction: chatService_1.InteractiveSessionVoteDirection.Up,
                    }
                });
                item.setVote(chatService_1.InteractiveSessionVoteDirection.Up);
            }
        });
        (0, actions_1.registerAction2)(class MarkUnhelpfulAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.markUnhelpful',
                    title: (0, nls_1.localize2)('interactive.unhelpful.label', "Unhelpful"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.thumbsdown,
                    toggled: chatContextKeys_1.CONTEXT_RESPONSE_VOTE.isEqualTo('down'),
                    menu: {
                        id: actions_1.MenuId.ChatMessageTitle,
                        group: 'navigation',
                        order: 2,
                        when: chatContextKeys_1.CONTEXT_RESPONSE
                    }
                });
            }
            run(accessor, ...args) {
                const item = args[0];
                if (!(0, chatViewModel_1.isResponseVM)(item)) {
                    return;
                }
                const chatService = accessor.get(chatService_1.IChatService);
                chatService.notifyUserAction({
                    agentId: item.agent?.id,
                    sessionId: item.sessionId,
                    requestId: item.requestId,
                    result: item.result,
                    action: {
                        kind: 'vote',
                        direction: chatService_1.InteractiveSessionVoteDirection.Down,
                    }
                });
                item.setVote(chatService_1.InteractiveSessionVoteDirection.Down);
            }
        });
        (0, actions_1.registerAction2)(class ReportIssueForBugAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.reportIssueForBug',
                    title: (0, nls_1.localize2)('interactive.reportIssueForBug.label', "Report Issue"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.report,
                    menu: {
                        id: actions_1.MenuId.ChatMessageTitle,
                        group: 'navigation',
                        order: 3,
                        when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_CHAT_RESPONSE_SUPPORT_ISSUE_REPORTING, chatContextKeys_1.CONTEXT_RESPONSE)
                    }
                });
            }
            run(accessor, ...args) {
                const item = args[0];
                if (!(0, chatViewModel_1.isResponseVM)(item)) {
                    return;
                }
                const chatService = accessor.get(chatService_1.IChatService);
                chatService.notifyUserAction({
                    agentId: item.agent?.id,
                    sessionId: item.sessionId,
                    requestId: item.requestId,
                    result: item.result,
                    action: {
                        kind: 'bug'
                    }
                });
            }
        });
        (0, actions_1.registerAction2)(class InsertToNotebookAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.insertIntoNotebook',
                    title: (0, nls_1.localize2)('interactive.insertIntoNotebook.label', "Insert into Notebook"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.insert,
                    menu: {
                        id: actions_1.MenuId.ChatMessageTitle,
                        group: 'navigation',
                        isHiddenByDefault: true,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, chatContextKeys_1.CONTEXT_RESPONSE, chatContextKeys_1.CONTEXT_RESPONSE_FILTERED.negate())
                    }
                });
            }
            async run(accessor, ...args) {
                const item = args[0];
                if (!(0, chatViewModel_1.isResponseVM)(item)) {
                    return;
                }
                const editorService = accessor.get(editorService_1.IEditorService);
                if (editorService.activeEditorPane?.getId() === notebookCommon_1.NOTEBOOK_EDITOR_ID) {
                    const notebookEditor = editorService.activeEditorPane.getControl();
                    if (!notebookEditor.hasModel()) {
                        return;
                    }
                    if (notebookEditor.isReadOnly) {
                        return;
                    }
                    const value = item.response.asString();
                    const splitContents = splitMarkdownAndCodeBlocks(value);
                    const focusRange = notebookEditor.getFocus();
                    const index = Math.max(focusRange.end, 0);
                    const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
                    await bulkEditService.apply([
                        new bulkCellEdits_1.ResourceNotebookCellEdit(notebookEditor.textModel.uri, {
                            editType: 1 /* CellEditType.Replace */,
                            index: index,
                            count: 0,
                            cells: splitContents.map(content => {
                                const kind = content.type === 'markdown' ? notebookCommon_1.CellKind.Markup : notebookCommon_1.CellKind.Code;
                                const language = content.type === 'markdown' ? 'markdown' : content.language;
                                const mime = content.type === 'markdown' ? 'text/markdown' : `text/x-${content.language}`;
                                return {
                                    cellKind: kind,
                                    language,
                                    mime,
                                    source: content.content,
                                    outputs: [],
                                    metadata: {}
                                };
                            })
                        })
                    ], { quotableLabel: 'Insert into Notebook' });
                }
            }
        });
        (0, actions_1.registerAction2)(class RemoveAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.remove',
                    title: (0, nls_1.localize2)('chat.remove.label', "Remove Request and Response"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.x,
                    keybinding: {
                        primary: 20 /* KeyCode.Delete */,
                        mac: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
                        },
                        when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, chatContextKeys_1.CONTEXT_IN_CHAT_INPUT.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    },
                    menu: {
                        id: actions_1.MenuId.ChatMessageTitle,
                        group: 'navigation',
                        order: 2,
                        when: chatContextKeys_1.CONTEXT_REQUEST
                    }
                });
            }
            run(accessor, ...args) {
                let item = args[0];
                if (!(0, chatViewModel_1.isRequestVM)(item)) {
                    const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
                    const widget = chatWidgetService.lastFocusedWidget;
                    item = widget?.getFocus();
                }
                const requestId = (0, chatViewModel_1.isRequestVM)(item) ? item.id :
                    (0, chatViewModel_1.isResponseVM)(item) ? item.requestId : undefined;
                if (requestId) {
                    const chatService = accessor.get(chatService_1.IChatService);
                    chatService.removeRequest(item.sessionId, requestId);
                }
            }
        });
        const rerunMenu = actions_1.MenuId.for('ChatMessageTitle#Rerun');
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ChatMessageTitle, {
            submenu: rerunMenu,
            title: (0, nls_1.localize)('reunmenu', "Rerun..."),
            icon: codicons_1.Codicon.refresh,
            group: 'navigation',
            order: -10,
            when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_RESPONSE, chatContextKeys_1.CONTEXT_CHAT_LOCATION.isEqualTo(chatAgents_1.ChatAgentLocation.Editor)) // TODO@jrieken needs extension adoption
        });
        (0, actions_1.registerAction2)(class RerunAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.rerun',
                    title: (0, nls_1.localize2)('chat.rerun.label', "Rerun Request"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.refresh,
                    precondition: chatContextKeys_1.CONTEXT_CHAT_LOCATION.isEqualTo(chatAgents_1.ChatAgentLocation.Editor), // TODO@jrieken needs extension adoption
                    menu: {
                        id: rerunMenu,
                        group: 'navigation',
                        order: -1,
                    }
                });
            }
            async run(accessor, ...args) {
                const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
                const chatService = accessor.get(chatService_1.IChatService);
                const widget = chatWidgetService.lastFocusedWidget;
                let item = args[0];
                if (!(0, chatViewModel_1.isResponseVM)(item)) {
                    item = widget?.getFocus();
                }
                if (!(0, chatViewModel_1.isResponseVM)(item) || !widget) {
                    return;
                }
                const request = chatService.getSession(item.sessionId)?.getRequests().find(candidate => candidate.id === item.requestId);
                if (request) {
                    await chatService.resendRequest(request, { noCommandDetection: false, attempt: request.attempt + 1, location: widget.location, implicitVariablesEnabled: true });
                }
            }
        });
        (0, actions_1.registerAction2)(class RerunWithoutCommandDetectionAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.rerunWithoutCommandDetection',
                    title: (0, nls_1.localize2)('chat.rerunWithoutCommandDetection.label', "Rerun without Command Detection"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.refresh,
                    precondition: chatContextKeys_1.CONTEXT_CHAT_LOCATION.isEqualTo(chatAgents_1.ChatAgentLocation.Editor), // TODO@jrieken needs extension adoption
                    menu: {
                        when: chatContextKeys_1.CONTEXT_RESPONSE_DETECTED_AGENT_COMMAND,
                        id: rerunMenu,
                        group: 'navigation',
                        order: -1,
                    }
                });
            }
            async run(accessor, ...args) {
                const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
                const chatService = accessor.get(chatService_1.IChatService);
                const widget = chatWidgetService.lastFocusedWidget;
                let item = args[0];
                if (!(0, chatViewModel_1.isResponseVM)(item)) {
                    item = widget?.getFocus();
                }
                if (!(0, chatViewModel_1.isResponseVM)(item) || !widget) {
                    return;
                }
                const request = chatService.getSession(item.sessionId)?.getRequests().find(candidate => candidate.id === item.requestId);
                if (request) {
                    await chatService.resendRequest(request, { noCommandDetection: true, attempt: request.attempt, location: widget.location, implicitVariablesEnabled: true });
                }
            }
        });
    }
    function splitMarkdownAndCodeBlocks(markdown) {
        const lexer = new marked_1.marked.Lexer();
        const tokens = lexer.lex(markdown);
        const splitContent = [];
        let markdownPart = '';
        tokens.forEach((token) => {
            if (token.type === 'code') {
                if (markdownPart.trim()) {
                    splitContent.push({ type: 'markdown', content: markdownPart });
                    markdownPart = '';
                }
                splitContent.push({
                    type: 'code',
                    language: token.lang || '',
                    content: token.text,
                });
            }
            else {
                markdownPart += token.raw;
            }
        });
        if (markdownPart.trim()) {
            splitContent.push({ type: 'markdown', content: markdownPart });
        }
        return splitContent;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFRpdGxlQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9hY3Rpb25zL2NoYXRUaXRsZUFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF1QmhHLDREQXlUQztJQXpURCxTQUFnQix3QkFBd0I7UUFDdkMsSUFBQSx5QkFBZSxFQUFDLE1BQU0saUJBQWtCLFNBQVEsaUJBQU87WUFDdEQ7Z0JBQ0MsS0FBSyxDQUFDO29CQUNMLEVBQUUsRUFBRSxtQ0FBbUM7b0JBQ3ZDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQywyQkFBMkIsRUFBRSxTQUFTLENBQUM7b0JBQ3hELEVBQUUsRUFBRSxLQUFLO29CQUNULFFBQVEsRUFBRSwyQkFBYTtvQkFDdkIsSUFBSSxFQUFFLGtCQUFPLENBQUMsUUFBUTtvQkFDdEIsT0FBTyxFQUFFLHVDQUFxQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7b0JBQzlDLElBQUksRUFBRTt3QkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxnQkFBZ0I7d0JBQzNCLEtBQUssRUFBRSxZQUFZO3dCQUNuQixLQUFLLEVBQUUsQ0FBQzt3QkFDUixJQUFJLEVBQUUsa0NBQWdCO3FCQUN0QjtpQkFDRCxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO2dCQUM3QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxJQUFBLDRCQUFZLEVBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDekIsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMEJBQVksQ0FBQyxD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