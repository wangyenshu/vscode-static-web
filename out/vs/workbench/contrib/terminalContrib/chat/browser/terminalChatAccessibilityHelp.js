/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChat", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChatController"], function (require, exports, lifecycle_1, nls_1, keybinding_1, accessibleView_1, accessibleViewActions_1, terminal_1, terminalChat_1, terminalChatController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalChatAccessibilityHelpContribution = void 0;
    exports.runAccessibilityHelpAction = runAccessibilityHelpAction;
    exports.getAccessibilityHelpText = getAccessibilityHelpText;
    class TerminalChatAccessibilityHelpContribution extends lifecycle_1.Disposable {
        static { this.ID = 'terminalChatAccessiblityHelp'; }
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(110, 'terminalChat', runAccessibilityHelpAction, terminalChat_1.TerminalChatContextKeys.focused));
        }
    }
    exports.TerminalChatAccessibilityHelpContribution = TerminalChatAccessibilityHelpContribution;
    async function runAccessibilityHelpAction(accessor) {
        const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
        const terminalService = accessor.get(terminal_1.ITerminalService);
        const instance = terminalService.activeInstance;
        if (!instance) {
            return;
        }
        const helpText = getAccessibilityHelpText(accessor);
        accessibleViewService.show({
            id: "terminal-chat" /* AccessibleViewProviderId.TerminalChat */,
            verbositySettingKey: "accessibility.verbosity.terminalChat" /* AccessibilityVerbositySettingId.TerminalChat */,
            provideContent: () => helpText,
            onClose: () => terminalChatController_1.TerminalChatController.get(instance)?.focus(),
            options: { type: "help" /* AccessibleViewType.Help */ }
        });
    }
    function getAccessibilityHelpText(accessor) {
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const content = [];
        const openAccessibleViewKeybinding = keybindingService.lookupKeybinding('editor.action.accessibleView')?.getAriaLabel();
        const runCommandKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.runCommand" /* TerminalChatCommandId.RunCommand */)?.getAriaLabel();
        const insertCommandKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.insertCommand" /* TerminalChatCommandId.InsertCommand */)?.getAriaLabel();
        const makeRequestKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.makeRequest" /* TerminalChatCommandId.MakeRequest */)?.getAriaLabel();
        const startChatKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.start" /* TerminalChatCommandId.Start */)?.getAriaLabel();
        const focusResponseKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.focusResponse" /* TerminalChatCommandId.FocusResponse */)?.getAriaLabel();
        const focusInputKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.focusInput" /* TerminalChatCommandId.FocusInput */)?.getAriaLabel();
        content.push((0, nls_1.localize)('inlineChat.overview', "Inline chat occurs within a terminal. It is useful for suggesting terminal commands. Keep in mind that AI generated code may be incorrect."));
        content.push((0, nls_1.localize)('inlineChat.access', "It can be activated using the command: Terminal: Start Chat ({0}), which will focus the input box.", startChatKeybinding));
        content.push(makeRequestKeybinding ? (0, nls_1.localize)('inlineChat.input', "The input box is where the user can type a request and can make the request ({0}). The widget will be closed and all content will be discarded when the Escape key is pressed and the terminal will regain focus.", makeRequestKeybinding) : (0, nls_1.localize)('inlineChat.inputNoKb', "The input box is where the user can type a request and can make the request by tabbing to the Make Request button, which is not currently triggerable via keybindings. The widget will be closed and all content will be discarded when the Escape key is pressed and the terminal will regain focus."));
        content.push(openAccessibleViewKeybinding ? (0, nls_1.localize)('inlineChat.inspectResponseMessage', 'The response can be inspected in the accessible view ({0}).', openAccessibleViewKeybinding) : (0, nls_1.localize)('inlineChat.inspectResponseNoKb', 'With the input box focused, inspect the response in the accessible view via the Open Accessible View command, which is currently not triggerable by a keybinding.'));
        content.push(focusResponseKeybinding ? (0, nls_1.localize)('inlineChat.focusResponse', 'Reach the response from the input box ({0}).', focusResponseKeybinding) : (0, nls_1.localize)('inlineChat.focusResponseNoKb', 'Reach the response from the input box by tabbing or assigning a keybinding for the command: Focus Terminal Response.'));
        content.push(focusInputKeybinding ? (0, nls_1.localize)('inlineChat.focusInput', 'Reach the input box from the response ({0}).', focusInputKeybinding) : (0, nls_1.localize)('inlineChat.focusInputNoKb', 'Reach the response from the input box by shift+tabbing or assigning a keybinding for the command: Focus Terminal Input.'));
        content.push(runCommandKeybinding ? (0, nls_1.localize)('inlineChat.runCommand', 'With focus in the input box or command editor, the Terminal: Run Chat Command ({0}) action.', runCommandKeybinding) : (0, nls_1.localize)('inlineChat.runCommandNoKb', 'Run a command by tabbing to the button as the action is currently not triggerable by a keybinding.'));
        content.push(insertCommandKeybinding ? (0, nls_1.localize)('inlineChat.insertCommand', 'With focus in the input box command editor, the Terminal: Insert Chat Command ({0}) action.', insertCommandKeybinding) : (0, nls_1.localize)('inlineChat.insertCommandNoKb', 'Insert a command by tabbing to the button as the action is currently not triggerable by a keybinding.'));
        content.push((0, nls_1.localize)('inlineChat.toolbar', "Use tab to reach conditional parts like commands, status, message responses and more."));
        content.push((0, nls_1.localize)('chat.signals', "Accessibility Signals can be changed via settings with a prefix of signals.chat. By default, if a request takes more than 4 seconds, you will hear a sound indicating that progress is still occurring."));
        return content.join('\n\n');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0QWNjZXNzaWJpbGl0eUhlbHAuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvY2hhdC9icm93c2VyL3Rlcm1pbmFsQ2hhdEFjY2Vzc2liaWxpdHlIZWxwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFCaEcsZ0VBaUJDO0lBRUQsNERBcUJDO0lBaERELE1BQWEseUNBQTBDLFNBQVEsc0JBQVU7aUJBQ2pFLE9BQUUsR0FBRyw4QkFBOEIsQ0FBQztRQUMzQztZQUNDLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLFNBQVMsQ0FBQywrQ0FBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsY0FBYyxFQUFFLDBCQUEwQixFQUFFLHNDQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDN0ksQ0FBQzs7SUFMRiw4RkFNQztJQUVNLEtBQUssVUFBVSwwQkFBMEIsQ0FBQyxRQUEwQjtRQUMxRSxNQUFNLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXNCLENBQUMsQ0FBQztRQUNuRSxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7UUFFdkQsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLGNBQWMsQ0FBQztRQUNoRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDZixPQUFPO1FBQ1IsQ0FBQztRQUVELE1BQU0sUUFBUSxHQUFHLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELHFCQUFxQixDQUFDLElBQUksQ0FBQztZQUMxQixFQUFFLDZEQUF1QztZQUN6QyxtQkFBbUIsMkZBQThDO1lBQ2pFLGNBQWMsRUFBRSxHQUFHLEVBQUUsQ0FB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