/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChat", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChatController"], function (require, exports, lifecycle_1, accessibleView_1, accessibleViewActions_1, terminal_1, terminalChat_1, terminalChatController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalInlineChatAccessibleViewContribution = void 0;
    class TerminalInlineChatAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(105, 'terminalInlineChat', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const terminalService = accessor.get(terminal_1.ITerminalService);
                const controller = terminalService.activeInstance?.getContribution(terminalChatController_1.TerminalChatController.ID) ?? undefined;
                if (!controller?.lastResponseContent) {
                    return false;
                }
                const responseContent = controller.lastResponseContent;
                accessibleViewService.show({
                    id: "terminal-chat" /* AccessibleViewProviderId.TerminalChat */,
                    verbositySettingKey: "accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */,
                    provideContent() { return responseContent; },
                    onClose() {
                        controller.focus();
                    },
                    options: { type: "view" /* AccessibleViewType.View */ }
                });
                return true;
            }, terminalChat_1.TerminalChatContextKeys.focused));
        }
    }
    exports.TerminalInlineChatAccessibleViewContribution = TerminalInlineChatAccessibleViewContribution;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0QWNjZXNzaWJsZVZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvY2hhdC9icm93c2VyL3Rlcm1pbmFsQ2hhdEFjY2Vzc2libGVWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLDRDQUE2QyxTQUFRLHNCQUFVO1FBRTNFO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsU0FBUyxDQUFDLDRDQUFvQixDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxvQkFBb0IsRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDM0YsTUFBTSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUFzQixDQUFDLENBQUM7Z0JBQ25FLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxVQUFVLEdBQXVDLGVBQWUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLCtDQUFzQixDQUFDLEVBQUUsQ0FBQyxJQUFJLFNBQVMsQ0FBQztnQkFDL0ksSUFBSSxDQUFDLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxDQUFDO29CQUN0QyxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUNELE1BQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQztnQkFDdkQscUJBQXFCLENBQUMsSUFBSSxDQUFDO29CQUMxQixFQUFFLDZEQUF1QztvQkFDekMsbUJBQW1CLHVGQUE0QztvQkFDL0QsY0FBYyxLQUFhLE9BQU8sZUFBZSxDQUFDLENBQUMsQ0FBQztvQkFDcEQsT0FBTzt3QkFDTixVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3BCLENBQUM7b0JBQ0QsT0FBTyxFQUFFLEVBQUUsSUFBSSxzQ0FBeUIsRUFBRTtpQkFDMUMsQ0FBQyxDQUFDO2dCQUNILE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxFQUFFLHNDQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQztLQUNEO0lBeEJELG9HQXdCQyJ9