/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls_1, actions_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalChatContextKeys = exports.TerminalChatContextKeyStrings = exports.MENU_TERMINAL_CHAT_WIDGET_TOOLBAR = exports.MENU_TERMINAL_CHAT_WIDGET_FEEDBACK = exports.MENU_TERMINAL_CHAT_WIDGET_STATUS = exports.MENU_TERMINAL_CHAT_WIDGET = exports.MENU_TERMINAL_CHAT_INPUT = exports.TerminalChatCommandId = void 0;
    var TerminalChatCommandId;
    (function (TerminalChatCommandId) {
        TerminalChatCommandId["Start"] = "workbench.action.terminal.chat.start";
        TerminalChatCommandId["Close"] = "workbench.action.terminal.chat.close";
        TerminalChatCommandId["FocusResponse"] = "workbench.action.terminal.chat.focusResponse";
        TerminalChatCommandId["FocusInput"] = "workbench.action.terminal.chat.focusInput";
        TerminalChatCommandId["Discard"] = "workbench.action.terminal.chat.discard";
        TerminalChatCommandId["MakeRequest"] = "workbench.action.terminal.chat.makeRequest";
        TerminalChatCommandId["Cancel"] = "workbench.action.terminal.chat.cancel";
        TerminalChatCommandId["FeedbackHelpful"] = "workbench.action.terminal.chat.feedbackHelpful";
        TerminalChatCommandId["FeedbackUnhelpful"] = "workbench.action.terminal.chat.feedbackUnhelpful";
        TerminalChatCommandId["FeedbackReportIssue"] = "workbench.action.terminal.chat.feedbackReportIssue";
        TerminalChatCommandId["RunCommand"] = "workbench.action.terminal.chat.runCommand";
        TerminalChatCommandId["RunFirstCommand"] = "workbench.action.terminal.chat.runFirstCommand";
        TerminalChatCommandId["InsertCommand"] = "workbench.action.terminal.chat.insertCommand";
        TerminalChatCommandId["InsertFirstCommand"] = "workbench.action.terminal.chat.insertFirstCommand";
        TerminalChatCommandId["ViewInChat"] = "workbench.action.terminal.chat.viewInChat";
        TerminalChatCommandId["PreviousFromHistory"] = "workbench.action.terminal.chat.previousFromHistory";
        TerminalChatCommandId["NextFromHistory"] = "workbench.action.terminal.chat.nextFromHistory";
    })(TerminalChatCommandId || (exports.TerminalChatCommandId = TerminalChatCommandId = {}));
    exports.MENU_TERMINAL_CHAT_INPUT = actions_1.MenuId.for('terminalChatInput');
    exports.MENU_TERMINAL_CHAT_WIDGET = actions_1.MenuId.for('terminalChatWidget');
    exports.MENU_TERMINAL_CHAT_WIDGET_STATUS = actions_1.MenuId.for('terminalChatWidget.status');
    exports.MENU_TERMINAL_CHAT_WIDGET_FEEDBACK = actions_1.MenuId.for('terminalChatWidget.feedback');
    exports.MENU_TERMINAL_CHAT_WIDGET_TOOLBAR = actions_1.MenuId.for('terminalChatWidget.toolbar');
    var TerminalChatContextKeyStrings;
    (function (TerminalChatContextKeyStrings) {
        TerminalChatContextKeyStrings["ChatFocus"] = "terminalChatFocus";
        TerminalChatContextKeyStrings["ChatVisible"] = "terminalChatVisible";
        TerminalChatContextKeyStrings["ChatActiveRequest"] = "terminalChatActiveRequest";
        TerminalChatContextKeyStrings["ChatInputHasText"] = "terminalChatInputHasText";
        TerminalChatContextKeyStrings["ChatAgentRegistered"] = "terminalChatAgentRegistered";
        TerminalChatContextKeyStrings["ChatResponseEditorFocused"] = "terminalChatResponseEditorFocused";
        TerminalChatContextKeyStrings["ChatResponseContainsCodeBlock"] = "terminalChatResponseContainsCodeBlock";
        TerminalChatContextKeyStrings["ChatResponseContainsMultipleCodeBlocks"] = "terminalChatResponseContainsMultipleCodeBlocks";
        TerminalChatContextKeyStrings["ChatResponseSupportsIssueReporting"] = "terminalChatResponseSupportsIssueReporting";
        TerminalChatContextKeyStrings["ChatSessionResponseVote"] = "terminalChatSessionResponseVote";
    })(TerminalChatContextKeyStrings || (exports.TerminalChatContextKeyStrings = TerminalChatContextKeyStrings = {}));
    var TerminalChatContextKeys;
    (function (TerminalChatContextKeys) {
        /** Whether the chat widget is focused */
        TerminalChatContextKeys.focused = new contextkey_1.RawContextKey("terminalChatFocus" /* TerminalChatContextKeyStrings.ChatFocus */, false, (0, nls_1.localize)('chatFocusedContextKey', "Whether the chat view is focused."));
        /** Whether the chat widget is visible */
        TerminalChatContextKeys.visible = new contextkey_1.RawContextKey("terminalChatVisible" /* TerminalChatContextKeyStrings.ChatVisible */, false, (0, nls_1.localize)('chatVisibleContextKey', "Whether the chat view is visible."));
        /** Whether there is an active chat request */
        TerminalChatContextKeys.requestActive = new contextkey_1.RawContextKey("terminalChatActiveRequest" /* TerminalChatContextKeyStrings.ChatActiveRequest */, false, (0, nls_1.localize)('chatRequestActiveContextKey', "Whether there is an active chat request."));
        /** Whether the chat input has text */
        TerminalChatContextKeys.inputHasText = new contextkey_1.RawContextKey("terminalChatInputHasText" /* TerminalChatContextKeyStrings.ChatInputHasText */, false, (0, nls_1.localize)('chatInputHasTextContextKey', "Whether the chat input has text."));
        /** Whether the terminal chat agent has been registered */
        TerminalChatContextKeys.agentRegistered = new contextkey_1.RawContextKey("terminalChatAgentRegistered" /* TerminalChatContextKeyStrings.ChatAgentRegistered */, false, (0, nls_1.localize)('chatAgentRegisteredContextKey', "Whether the terminal chat agent has been registered."));
        /** The chat response contains at least one code block */
        TerminalChatContextKeys.responseContainsCodeBlock = new contextkey_1.RawContextKey("terminalChatResponseContainsCodeBlock" /* TerminalChatContextKeyStrings.ChatResponseContainsCodeBlock */, false, (0, nls_1.localize)('chatResponseContainsCodeBlockContextKey', "Whether the chat response contains a code block."));
        /** The chat response contains multiple code blocks */
        TerminalChatContextKeys.responseContainsMultipleCodeBlocks = new contextkey_1.RawContextKey("terminalChatResponseContainsMultipleCodeBlocks" /* TerminalChatContextKeyStrings.ChatResponseContainsMultipleCodeBlocks */, false, (0, nls_1.localize)('chatResponseContainsMultipleCodeBlocksContextKey', "Whether the chat response contains multiple code blocks."));
        /** Whether the response supports issue reporting */
        TerminalChatContextKeys.responseSupportsIssueReporting = new contextkey_1.RawContextKey("terminalChatResponseSupportsIssueReporting" /* TerminalChatContextKeyStrings.ChatResponseSupportsIssueReporting */, false, (0, nls_1.localize)('chatResponseSupportsIssueReportingContextKey', "Whether the response supports issue reporting"));
        /** The chat vote, if any for the response, if any */
        TerminalChatContextKeys.sessionResponseVote = new contextkey_1.RawContextKey("terminalChatSessionResponseVote" /* TerminalChatContextKeyStrings.ChatSessionResponseVote */, undefined, { type: 'string', description: (0, nls_1.localize)('interactiveSessionResponseVote', "When the response has been voted up, is set to 'up'. When voted down, is set to 'down'. Otherwise an empty string.") });
    })(TerminalChatContextKeys || (exports.TerminalChatContextKeys = TerminalChatContextKeys = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2NoYXQvYnJvd3Nlci90ZXJtaW5hbENoYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLElBQWtCLHFCQWtCakI7SUFsQkQsV0FBa0IscUJBQXFCO1FBQ3RDLHVFQUE4QyxDQUFBO1FBQzlDLHVFQUE4QyxDQUFBO1FBQzlDLHVGQUE4RCxDQUFBO1FBQzlELGlGQUF3RCxDQUFBO1FBQ3hELDJFQUFrRCxDQUFBO1FBQ2xELG1GQUEwRCxDQUFBO1FBQzFELHlFQUFnRCxDQUFBO1FBQ2hELDJGQUFrRSxDQUFBO1FBQ2xFLCtGQUFzRSxDQUFBO1FBQ3RFLG1HQUEwRSxDQUFBO1FBQzFFLGlGQUF3RCxDQUFBO1FBQ3hELDJGQUFrRSxDQUFBO1FBQ2xFLHVGQUE4RCxDQUFBO1FBQzlELGlHQUF3RSxDQUFBO1FBQ3hFLGlGQUF3RCxDQUFBO1FBQ3hELG1HQUEwRSxDQUFBO1FBQzFFLDJGQUFrRSxDQUFBO0lBQ25FLENBQUMsRUFsQmlCLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBa0J0QztJQUVZLFFBQUEsd0JBQXdCLEdBQUcsZ0JBQU0sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUMzRCxRQUFBLHlCQUF5QixHQUFHLGdCQUFNLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDN0QsUUFBQSxnQ0FBZ0MsR0FBRyxnQkFBTSxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0lBQzNFLFFBQUEsa0NBQWtDLEdBQUcsZ0JBQU0sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUMvRSxRQUFBLGlDQUFpQyxHQUFHLGdCQUFNLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFFMUYsSUFBa0IsNkJBV2pCO0lBWEQsV0FBa0IsNkJBQTZCO1FBQzlDLGdFQUErQixDQUFBO1FBQy9CLG9FQUFtQyxDQUFBO1FBQ25DLGdGQUErQyxDQUFBO1FBQy9DLDhFQUE2QyxDQUFBO1FBQzdDLG9GQUFtRCxDQUFBO1FBQ25ELGdHQUErRCxDQUFBO1FBQy9ELHdHQUF1RSxDQUFBO1FBQ3ZFLDBIQUF5RixDQUFBO1FBQ3pGLGtIQUFpRixDQUFBO1FBQ2pGLDRGQUEyRCxDQUFBO0lBQzVELENBQUMsRUFYaUIsNkJBQTZCLDZDQUE3Qiw2QkFBNkIsUUFXOUM7SUFHRCxJQUFpQix1QkFBdUIsQ0E0QnZDO0lBNUJELFdBQWlCLHVCQUF1QjtRQUV2Qyx5Q0FBeUM7UUFDNUIsK0JBQU8sR0FBRyxJQUFJLDBCQUFhLG9FQUFtRCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsbUNBQW1DLENBQUMsQ0FBQyxDQUFDO1FBRTFLLHlDQUF5QztRQUM1QiwrQkFBTyxHQUFHLElBQUksMEJBQWEsd0VBQXFELEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSxtQ0FBbUMsQ0FBQyxDQUFDLENBQUM7UUFFNUssOENBQThDO1FBQ2pDLHFDQUFhLEdBQUcsSUFBSSwwQkFBYSxvRkFBMkQsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLDBDQUEwQyxDQUFDLENBQUMsQ0FBQztRQUVyTSxzQ0FBc0M7UUFDekIsb0NBQVksR0FBRyxJQUFJLDBCQUFhLGtGQUEwRCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsa0NBQWtDLENBQUMsQ0FBQyxDQUFDO1FBRTFMLDBEQUEwRDtRQUM3Qyx1Q0FBZSxHQUFHLElBQUksMEJBQWEsd0ZBQTZELEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSxzREFBc0QsQ0FBQyxDQUFDLENBQUM7UUFFdk4seURBQXlEO1FBQzVDLGlEQUF5QixHQUFHLElBQUksMEJBQWEsNEdBQXVFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyx5Q0FBeUMsRUFBRSxrREFBa0QsQ0FBQyxDQUFDLENBQUM7UUFFalAsc0RBQXNEO1FBQ3pDLDBEQUFrQyxHQUFHLElBQUksMEJBQWEsOEhBQWdGLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxrREFBa0QsRUFBRSwwREFBMEQsQ0FBQyxDQUFDLENBQUM7UUFFcFIsb0RBQW9EO1FBQ3ZDLHNEQUE4QixHQUFHLElBQUksMEJBQWEsc0hBQTRFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyw4Q0FBOEMsRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDLENBQUM7UUFFN1AscURBQXFEO1FBQ3hDLDJDQUFtQixHQUFHLElBQUksMEJBQWEsZ0dBQWdFLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGdDQUFnQyxFQUFFLG9IQUFvSCxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25VLENBQUMsRUE1QmdCLHVCQUF1Qix1Q0FBdkIsdUJBQXVCLFFBNEJ2QyJ9