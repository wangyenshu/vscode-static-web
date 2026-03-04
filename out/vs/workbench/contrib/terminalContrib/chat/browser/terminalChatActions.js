/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/inlineChat/browser/inlineChatActions", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChat", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChatController"], function (require, exports, codicons_1, nls_1, contextkey_1, inlineChatActions_1, inlineChat_1, terminal_1, terminalActions_1, terminalContextKey_1, terminalChat_1, terminalChatController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.start" /* TerminalChatCommandId.Start */,
        title: (0, nls_1.localize2)('startChat', 'Start in Terminal'),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */,
            when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focusInAny),
            // HACK: Force weight to be higher than the extension contributed keybinding to override it until it gets replaced
            weight: 400 /* KeybindingWeight.ExternalExtension */ + 1, // KeybindingWeight.WorkbenchContrib,
        },
        f1: true,
        category: inlineChatActions_1.AbstractInlineChatAction.category,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), 
        // TODO: This needs to change to check for a terminal location capable agent
        inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER),
        run: (_xterm, _accessor, activeInstance, opts) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            if (opts) {
                opts = typeof opts === 'string' ? { query: opts } : opts;
                if (typeof opts === 'object' && opts !== null && 'query' in opts && typeof opts.query === 'string') {
                    contr?.updateInput(opts.query, false);
                    if (!('isPartialQuery' in opts && opts.isPartialQuery)) {
                        contr?.acceptInput();
                    }
                }
            }
            contr?.reveal();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.close" /* TerminalChatCommandId.Close */,
        title: (0, nls_1.localize2)('closeChat', 'Close Chat'),
        keybinding: {
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.focused, terminalChat_1.TerminalChatContextKeys.visible),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        },
        icon: codicons_1.Codicon.close,
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET,
            group: 'navigation',
            order: 2
        },
        f1: true,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.focused, terminalChat_1.TerminalChatContextKeys.visible)),
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.clear();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.focusResponse" /* TerminalChatCommandId.FocusResponse */,
        title: (0, nls_1.localize2)('focusTerminalResponse', 'Focus Terminal Response'),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
            when: terminalChat_1.TerminalChatContextKeys.focused,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        },
        f1: true,
        category: inlineChatActions_1.AbstractInlineChatAction.category,
        precondition: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.focused),
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.chatWidget?.inlineChatWidget.chatWidget.focusLastMessage();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.focusInput" /* TerminalChatCommandId.FocusInput */,
        title: (0, nls_1.localize2)('focusTerminalInput', 'Focus Terminal Input'),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */],
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.focused, inlineChat_1.CTX_INLINE_CHAT_FOCUSED.toNegated()),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        },
        f1: true,
        category: inlineChatActions_1.AbstractInlineChatAction.category,
        precondition: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.focused),
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.chatWidget?.focus();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.discard" /* TerminalChatCommandId.Discard */,
        title: (0, nls_1.localize2)('discard', 'Discard'),
        metadata: {
            description: (0, nls_1.localize2)('discardDescription', 'Discards the terminal current chat response, hide the chat widget, and clear the chat input.')
        },
        icon: codicons_1.Codicon.discard,
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
            group: '0_main',
            order: 2,
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.focused, terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock)
        },
        f1: true,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.focused, terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock),
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.clear();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.runCommand" /* TerminalChatCommandId.RunCommand */,
        title: (0, nls_1.localize2)('runCommand', 'Run Chat Command'),
        shortTitle: (0, nls_1.localize2)('run', 'Run'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.agentRegistered, terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock, terminalChat_1.TerminalChatContextKeys.responseContainsMultipleCodeBlocks.negate()),
        icon: codicons_1.Codicon.play,
        keybinding: {
            when: terminalChat_1.TerminalChatContextKeys.requestActive.negate(),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        },
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
            group: '0_main',
            order: 0,
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock, terminalChat_1.TerminalChatContextKeys.responseContainsMultipleCodeBlocks.negate(), terminalChat_1.TerminalChatContextKeys.requestActive.negate())
        },
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.acceptCommand(true);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.runFirstCommand" /* TerminalChatCommandId.RunFirstCommand */,
        title: (0, nls_1.localize2)('runFirstCommand', 'Run First Chat Command'),
        shortTitle: (0, nls_1.localize2)('runFirst', 'Run First'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.agentRegistered, terminalChat_1.TerminalChatContextKeys.responseContainsMultipleCodeBlocks),
        icon: codicons_1.Codicon.play,
        keybinding: {
            when: terminalChat_1.TerminalChatContextKeys.requestActive.negate(),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        },
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
            group: '0_main',
            order: 0,
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.responseContainsMultipleCodeBlocks, terminalChat_1.TerminalChatContextKeys.requestActive.negate())
        },
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.acceptCommand(true);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.insertCommand" /* TerminalChatCommandId.InsertCommand */,
        title: (0, nls_1.localize2)('insertCommand', 'Insert Chat Command'),
        shortTitle: (0, nls_1.localize2)('insert', 'Insert'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.agentRegistered, terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock, terminalChat_1.TerminalChatContextKeys.responseContainsMultipleCodeBlocks.negate()),
        keybinding: {
            when: terminalChat_1.TerminalChatContextKeys.requestActive.negate(),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */ | 512 /* KeyMod.Alt */]
        },
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
            group: '0_main',
            order: 1,
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock, terminalChat_1.TerminalChatContextKeys.responseContainsMultipleCodeBlocks.negate(), terminalChat_1.TerminalChatContextKeys.requestActive.negate())
        },
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.acceptCommand(false);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.insertFirstCommand" /* TerminalChatCommandId.InsertFirstCommand */,
        title: (0, nls_1.localize2)('insertFirstCommand', 'Insert First Chat Command'),
        shortTitle: (0, nls_1.localize2)('insertFirst', 'Insert First'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.agentRegistered, terminalChat_1.TerminalChatContextKeys.responseContainsMultipleCodeBlocks),
        keybinding: {
            when: terminalChat_1.TerminalChatContextKeys.requestActive.negate(),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */ | 512 /* KeyMod.Alt */]
        },
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
            group: '0_main',
            order: 1,
            when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.responseContainsMultipleCodeBlocks, terminalChat_1.TerminalChatContextKeys.requestActive.negate())
        },
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.acceptCommand(false);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.viewInChat" /* TerminalChatCommandId.ViewInChat */,
        title: (0, nls_1.localize2)('viewInChat', 'View in Chat'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.agentRegistered),
        icon: codicons_1.Codicon.commentDiscussion,
        menu: [{
                id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
                group: '0_main',
                order: 1,
                when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock.negate(), terminalChat_1.TerminalChatContextKeys.requestActive.negate()),
            },
            {
                id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET,
                group: 'navigation',
                order: 1,
                when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_EMPTY.negate(), terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock, terminalChat_1.TerminalChatContextKeys.requestActive.negate()),
            }],
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.viewInChat();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.makeRequest" /* TerminalChatCommandId.MakeRequest */,
        title: (0, nls_1.localize2)('makeChatRequest', 'Make Chat Request'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.agentRegistered, inlineChat_1.CTX_INLINE_CHAT_EMPTY.negate()),
        icon: codicons_1.Codicon.send,
        keybinding: {
            when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_FOCUSED, terminalChat_1.TerminalChatContextKeys.requestActive.negate()),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 3 /* KeyCode.Enter */
        },
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_INPUT,
            group: 'navigation',
            order: 1,
            when: terminalChat_1.TerminalChatContextKeys.requestActive.negate(),
        },
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.acceptInput();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.cancel" /* TerminalChatCommandId.Cancel */,
        title: (0, nls_1.localize2)('cancelChat', 'Cancel Chat'),
        precondition: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.requestActive, terminalChat_1.TerminalChatContextKeys.agentRegistered),
        icon: codicons_1.Codicon.debugStop,
        menu: {
            id: terminalChat_1.MENU_TERMINAL_CHAT_INPUT,
            group: 'navigation',
            when: terminalChat_1.TerminalChatContextKeys.requestActive,
        },
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.cancel();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.chat.feedbackReportIssue" /* TerminalChatCommandId.FeedbackReportIssue */,
        title: (0, nls_1.localize2)('reportIssue', 'Report Issue'),
        precondition: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.requestActive.negate(), terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock.notEqualsTo(undefined), terminalChat_1.TerminalChatContextKeys.responseSupportsIssueReporting),
        icon: codicons_1.Codicon.report,
        menu: [{
                id: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_FEEDBACK,
                when: contextkey_1.ContextKeyExpr.and(terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock.notEqualsTo(undefined), terminalChat_1.TerminalChatContextKeys.responseSupportsIssueReporting),
                group: 'inline',
                order: 3
            }],
        run: (_xterm, _accessor, activeInstance) => {
            if ((0, terminal_1.isDetachedTerminalInstance)(activeInstance)) {
                return;
            }
            const contr = terminalChatController_1.TerminalChatController.activeChatWidget || terminalChatController_1.TerminalChatController.get(activeInstance);
            contr?.acceptFeedback();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9jaGF0L2Jyb3dzZXIvdGVybWluYWxDaGF0QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRyxJQUFBLDJDQUF5QixFQUFDO1FBQ3pCLEVBQUUsMEVBQTZCO1FBQy9CLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxXQUFXLEVBQUUsbUJBQW1CLENBQUM7UUFDbEQsVUFBVSxFQUFFO1lBQ1gsT0FBTyxFQUFFLGlEQUE2QjtZQUN0QyxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsd0NBQW1CLENBQUMsVUFBVSxDQUFDO1lBQ3hELGtIQUFrSDtZQUNsSCxNQUFNLEVBQUUsK0NBQXFDLENBQUMsRUFBRSxxQ0FBcUM7U0FDckY7UUFDRCxFQUFFLEVBQUUsSUFBSTtRQUNSLFFBQVEsRUFBRSw0Q0FBd0IsQ0FBQyxRQUFRO1FBQzNDLFlBQVksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FDL0IsMkJBQWMsQ0FBQyxFQUFFLENBQUMsd0NBQW1CLENBQUMsZ0JBQWdCLEVBQUUsd0NBQW1CLENBQUMsc0JBQXNCLENBQUM7UUFDbkcsNEVBQTRFO1FBQzVFLHlDQUE0QixDQUM1QjtRQUNELEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLElBQWMsRUFBRSxFQUFFO1lBQzFELElBQUksSUFBQSxxQ0FBMEIsRUFBQyxjQUFjLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLCtDQUFzQixDQUFDLGdCQUFnQixJQUFJLCtDQUFzQixDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMs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