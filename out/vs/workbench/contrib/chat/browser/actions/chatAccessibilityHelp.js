/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/editor/browser/widget/diffEditor/commands", "vs/workbench/contrib/inlineChat/common/inlineChat"], function (require, exports, nls_1, strings_1, keybinding_1, chat_1, accessibleView_1, commands_1, inlineChat_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAccessibilityHelpText = getAccessibilityHelpText;
    exports.runAccessibilityHelpAction = runAccessibilityHelpAction;
    function getAccessibilityHelpText(accessor, type) {
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const content = [];
        const openAccessibleViewKeybinding = keybindingService.lookupKeybinding('editor.action.accessibleView')?.getAriaLabel();
        if (type === 'panelChat') {
            content.push((0, nls_1.localize)('chat.overview', 'The chat view is comprised of an input box and a request/response list. The input box is used to make requests and the list is used to display responses.'));
            content.push((0, nls_1.localize)('chat.requestHistory', 'In the input box, use up and down arrows to navigate your request history. Edit input and use enter or the submit button to run a new request.'));
            content.push(openAccessibleViewKeybinding ? (0, nls_1.localize)('chat.inspectResponse', 'In the input box, inspect the last response in the accessible view {0}', openAccessibleViewKeybinding) : (0, nls_1.localize)('chat.inspectResponseNoKb', 'With the input box focused, inspect the last response in the accessible view via the Open Accessible View command, which is currently not triggerable by a keybinding.'));
            content.push((0, nls_1.localize)('chat.followUp', 'In the input box, navigate to the suggested follow up question (Shift+Tab) and press Enter to run it.'));
            content.push((0, nls_1.localize)('chat.announcement', 'Chat responses will be announced as they come in. A response will indicate the number of code blocks, if any, and then the rest of the response.'));
            content.push(descriptionForCommand('chat.action.focus', (0, nls_1.localize)('workbench.action.chat.focus', 'To focus the chat request/response list, which can be navigated with up and down arrows, invoke the Focus Chat command ({0}).'), (0, nls_1.localize)('workbench.action.chat.focusNoKb', 'To focus the chat request/response list, which can be navigated with up and down arrows, invoke The Focus Chat List command, which is currently not triggerable by a keybinding.'), keybindingService));
            content.push(descriptionForCommand('workbench.action.chat.focusInput', (0, nls_1.localize)('workbench.action.chat.focusInput', 'To focus the input box for chat requests, invoke the Focus Chat Input command ({0}).'), (0, nls_1.localize)('workbench.action.interactiveSession.focusInputNoKb', 'To focus the input box for chat requests, invoke the Focus Chat Input command, which is currently not triggerable by a keybinding.'), keybindingService));
            content.push(descriptionForCommand('workbench.action.chat.nextCodeBlock', (0, nls_1.localize)('workbench.action.chat.nextCodeBlock', 'To focus the next code block within a response, invoke the Chat: Next Code Block command ({0}).'), (0, nls_1.localize)('workbench.action.chat.nextCodeBlockNoKb', 'To focus the next code block within a response, invoke the Chat: Next Code Block command, which is currently not triggerable by a keybinding.'), keybindingService));
            content.push(descriptionForCommand('workbench.action.chat.nextFileTree', (0, nls_1.localize)('workbench.action.chat.nextFileTree', 'To focus the next file tree within a response, invoke the Chat: Next File Tree command ({0}).'), (0, nls_1.localize)('workbench.action.chat.nextFileTreeNoKb', 'To focus the next file tree within a response, invoke the Chat: Next File Tree command, which is currently not triggerable by a keybinding.'), keybindingService));
            content.push(descriptionForCommand('workbench.action.chat.clear', (0, nls_1.localize)('workbench.action.chat.clear', 'To clear the request/response list, invoke the Chat Clear command ({0}).'), (0, nls_1.localize)('workbench.action.chat.clearNoKb', 'To clear the request/response list, invoke the Chat Clear command, which is currently not triggerable by a keybinding.'), keybindingService));
        }
        else {
            const startChatKeybinding = keybindingService.lookupKeybinding('inlineChat.start')?.getAriaLabel();
            content.push((0, nls_1.localize)('inlineChat.overview', "Inline chat occurs within a code editor and takes into account the current selection. It is useful for making changes to the current editor. For example, fixing diagnostics, documenting or refactoring code. Keep in mind that AI generated code may be incorrect."));
            content.push((0, nls_1.localize)('inlineChat.access', "It can be activated via code actions or directly using the command: Inline Chat: Start Inline Chat ({0}).", startChatKeybinding));
            const upHistoryKeybinding = keybindingService.lookupKeybinding('inlineChat.previousFromHistory')?.getAriaLabel();
            const downHistoryKeybinding = keybindingService.lookupKeybinding('inlineChat.nextFromHistory')?.getAriaLabel();
            if (upHistoryKeybinding && downHistoryKeybinding) {
                content.push((0, nls_1.localize)('inlineChat.requestHistory', 'In the input box, use {0} and {1} to navigate your request history. Edit input and use enter or the submit button to run a new request.', upHistoryKeybinding, downHistoryKeybinding));
            }
            content.push(openAccessibleViewKeybinding ? (0, nls_1.localize)('inlineChat.inspectResponse', 'In the input box, inspect the response in the accessible view {0}.', openAccessibleViewKeybinding) : (0, nls_1.localize)('inlineChat.inspectResponseNoKb', 'With the input box focused, inspect the response in the accessible view via the Open Accessible View command, which is currently not triggerable by a keybinding.'));
            content.push((0, nls_1.localize)('inlineChat.contextActions', "Context menu actions may run a request prefixed with a /. Type / to discover such ready-made commands."));
            content.push((0, nls_1.localize)('inlineChat.fix', "If a fix action is invoked, a response will indicate the problem with the current code. A diff editor will be rendered and can be reached by tabbing."));
            const diffReviewKeybinding = keybindingService.lookupKeybinding(commands_1.AccessibleDiffViewerNext.id)?.getAriaLabel();
            content.push(diffReviewKeybinding ? (0, nls_1.localize)('inlineChat.diff', "Once in the diff editor, enter review mode with ({0}). Use up and down arrows to navigate lines with the proposed changes.", diffReviewKeybinding) : (0, nls_1.localize)('inlineChat.diffNoKb', "Tab again to enter the Diff editor with the changes and enter review mode with the Go to Next Difference Command. Use Up/DownArrow to navigate lines with the proposed changes."));
            content.push((0, nls_1.localize)('inlineChat.toolbar', "Use tab to reach conditional parts like commands, status, message responses and more."));
        }
        content.push((0, nls_1.localize)('chat.signals', "Accessibility Signals can be changed via settings with a prefix of signals.chat. By default, if a request takes more than 4 seconds, you will hear a sound indicating that progress is still occurring."));
        return content.join('\n\n');
    }
    function descriptionForCommand(commandId, msg, noKbMsg, keybindingService) {
        const kb = keybindingService.lookupKeybinding(commandId);
        if (kb) {
            return (0, strings_1.format)(msg, kb.getAriaLabel());
        }
        return (0, strings_1.format)(noKbMsg, commandId);
    }
    async function runAccessibilityHelpAction(accessor, editor, type) {
        const widgetService = accessor.get(chat_1.IChatWidgetService);
        const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
        const inputEditor = type === 'panelChat' ? widgetService.lastFocusedWidget?.inputEditor : editor;
        if (!inputEditor) {
            return;
        }
        const domNode = inputEditor.getDomNode() ?? undefined;
        if (!domNode) {
            return;
        }
        const cachedPosition = inputEditor.getPosition();
        inputEditor.getSupportedActions();
        const helpText = getAccessibilityHelpText(accessor, type);
        accessibleViewService.show({
            id: type === 'panelChat' ? "panelChat" /* AccessibleViewProviderId.Chat */ : "inlineChat" /* AccessibleViewProviderId.InlineChat */,
            verbositySettingKey: type === 'panelChat' ? "accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */ : "accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */,
            provideContent: () => helpText,
            onClose: () => {
                if (type === 'panelChat' && cachedPosition) {
                    inputEditor.setPosition(cachedPosition);
                    inputEditor.focus();
                }
                else if (type === 'inlineChat') {
                    // TODO@jrieken find a better way for this
                    const ctrl = editor?.getContribution(inlineChat_1.INLINE_CHAT_ID);
                    ctrl?.focus();
                }
            },
            options: { type: "help" /* AccessibleViewType.Help */ }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFjY2Vzc2liaWxpdHlIZWxwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2FjdGlvbnMvY2hhdEFjY2Vzc2liaWxpdHlIZWxwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLDREQWlDQztJQVVELGdFQWtDQztJQTdFRCxTQUFnQix3QkFBd0IsQ0FBQyxRQUEwQixFQUFFLElBQWdDO1FBQ3BHLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1FBQzNELE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNuQixNQUFNLDRCQUE0QixHQUFHLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLDhCQUE4QixDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUM7UUFDeEgsSUFBSSxJQUFJLEtBQUssV0FBVyxFQUFFLENBQUM7WUFDMUIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsMkpBQTJKLENBQUMsQ0FBQyxDQUFDO1lBQ3JNLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsZ0pBQWdKLENBQUMsQ0FBQyxDQUFDO1lBQ2hNLE9BQU8sQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLHdFQUF3RSxFQUFFLDRCQUE0QixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLHdLQUF3SyxDQUFDLENBQUMsQ0FBQztZQUN2WSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSx1R0FBdUcsQ0FBQyxDQUFDLENBQUM7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