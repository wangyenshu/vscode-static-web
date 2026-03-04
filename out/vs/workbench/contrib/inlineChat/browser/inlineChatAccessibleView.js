/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/accessibility/browser/accessibleViewActions"], function (require, exports, inlineChatController_1, inlineChat_1, accessibleView_1, lifecycle_1, codeEditorService_1, contextkey_1, accessibleViewActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatAccessibleViewContribution = void 0;
    class InlineChatAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(100, 'inlineChat', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const editor = (codeEditorService.getActiveCodeEditor() || codeEditorService.getFocusedCodeEditor());
                if (!editor) {
                    return false;
                }
                const controller = inlineChatController_1.InlineChatController.get(editor);
                if (!controller) {
                    return false;
                }
                const responseContent = controller?.getMessage();
                if (!responseContent) {
                    return false;
                }
                accessibleViewService.show({
                    id: "inlineChat" /* AccessibleViewProviderId.InlineChat */,
                    verbositySettingKey: "accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */,
                    provideContent() { return responseContent; },
                    onClose() {
                        controller.focus();
                    },
                    options: { type: "view" /* AccessibleViewType.View */ }
                });
                return true;
            }, contextkey_1.ContextKeyExpr.or(inlineChat_1.CTX_INLINE_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_RESPONSE_FOCUSED)));
        }
    }
    exports.InlineChatAccessibleViewContribution = InlineChatAccessibleViewContribution;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdEFjY2Vzc2libGVWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW5saW5lQ2hhdC9icm93c2VyL2lubGluZUNoYXRBY2Nlc3NpYmxlVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxvQ0FBcUMsU0FBUSxzQkFBVTtRQUVuRTtZQUNDLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLFNBQVMsQ0FBQyw0Q0FBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxFQUFFO2dCQUNuRixNQUFNLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXNCLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHNDQUFrQixDQUFDLENBQUM7Z0JBRTNELE1BQU0sTUFBTSxHQUFHLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxpQkFBaUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUM7Z0JBQ3JHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDYixPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUNELE1BQU0sVUFBVSxHQUFHLDJDQUFvQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNqQixPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUNELE1BQU0sZUFBZSxHQUFHLFVBQVUsRUFBRSxVQUFVLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUN0QixPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUNELHFCQUFxQixDQUFDLElBQUksQ0FBQztvQkFDMUIsRUFBRSx3REFBcUM7b0JBQ3ZDLG1CQUFtQix1RkFBNEM7b0JBQy9ELGNBQWMsS0FBYSxPQUFPLGVBQWUsQ0FBQyxDQUFDLENBQUM7b0JBQ3BELE9BQU87d0JBQ04sVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNwQixDQUFDO29CQUVELE9BQU8sRUFBRSxFQUFFLElBQUksc0NBQXlCLEVBQUU7aUJBQzFDLENBQUMsQ0FBQztnQkFDSCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUMsRUFBRSwyQkFBYyxDQUFDLEVBQUUsQ0FBQyxvQ0FBdUIsRUFBRSw2Q0FBZ0MsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRixDQUFDO0tBQ0Q7SUFqQ0Qsb0ZBaUNDIn0=