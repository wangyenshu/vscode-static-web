/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/platform/actions/common/actions", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/browser/inlineChatActions", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/inlineChat/common/inlineChatServiceImpl", "vs/platform/registry/common/platform", "vs/workbench/contrib/inlineChat/browser/inlineChatNotebook", "vs/workbench/common/contributions", "vs/workbench/contrib/inlineChat/browser/inlineChatSavingServiceImpl", "vs/workbench/contrib/inlineChat/browser/inlineChatAccessibleView", "vs/workbench/contrib/inlineChat/browser/inlineChatSavingService", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionService", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl"], function (require, exports, editorExtensions_1, actions_1, inlineChatController_1, InlineChatActions, inlineChat_1, extensions_1, inlineChatServiceImpl_1, platform_1, inlineChatNotebook_1, contributions_1, inlineChatSavingServiceImpl_1, inlineChatAccessibleView_1, inlineChatSavingService_1, inlineChatSessionService_1, inlineChatSessionServiceImpl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --- browser
    (0, extensions_1.registerSingleton)(inlineChat_1.IInlineChatService, inlineChatServiceImpl_1.InlineChatServiceImpl, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(inlineChatSessionService_1.IInlineChatSessionService, inlineChatSessionServiceImpl_1.InlineChatSessionServiceImpl, 0 /* InstantiationType.Eager */); // EAGER because this registers an agent which we need swiftly
    (0, extensions_1.registerSingleton)(inlineChatSavingService_1.IInlineChatSavingService, inlineChatSavingServiceImpl_1.InlineChatSavingServiceImpl, 1 /* InstantiationType.Delayed */);
    (0, editorExtensions_1.registerEditorContribution)(inlineChat_1.INLINE_CHAT_ID, inlineChatController_1.InlineChatController, 0 /* EditorContributionInstantiation.Eager */); // EAGER because of notebook dispose/create of editors
    (0, editorExtensions_1.registerEditorContribution)(inlineChat_1.INTERACTIVE_EDITOR_ACCESSIBILITY_HELP_ID, InlineChatActions.InlineAccessibilityHelpContribution, 3 /* EditorContributionInstantiation.Eventually */);
    (0, actions_1.registerAction2)(InlineChatActions.StartSessionAction);
    (0, actions_1.registerAction2)(InlineChatActions.CloseAction);
    (0, actions_1.registerAction2)(InlineChatActions.ConfigureInlineChatAction);
    (0, actions_1.registerAction2)(InlineChatActions.UnstashSessionAction);
    (0, actions_1.registerAction2)(InlineChatActions.DiscardHunkAction);
    (0, actions_1.registerAction2)(InlineChatActions.DiscardAction);
    (0, actions_1.registerAction2)(InlineChatActions.DiscardToClipboardAction);
    (0, actions_1.registerAction2)(InlineChatActions.DiscardUndoToNewFileAction);
    (0, actions_1.registerAction2)(InlineChatActions.CancelSessionAction);
    (0, actions_1.registerAction2)(InlineChatActions.MoveToNextHunk);
    (0, actions_1.registerAction2)(InlineChatActions.MoveToPreviousHunk);
    (0, actions_1.registerAction2)(InlineChatActions.ArrowOutUpAction);
    (0, actions_1.registerAction2)(InlineChatActions.ArrowOutDownAction);
    (0, actions_1.registerAction2)(InlineChatActions.FocusInlineChat);
    (0, actions_1.registerAction2)(InlineChatActions.ViewInChatAction);
    (0, actions_1.registerAction2)(InlineChatActions.ToggleDiffForChange);
    (0, actions_1.registerAction2)(InlineChatActions.AcceptChanges);
    (0, actions_1.registerAction2)(InlineChatActions.CopyRecordings);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(inlineChatNotebook_1.InlineChatNotebookContribution, 3 /* LifecyclePhase.Restored */);
    workbenchContributionsRegistry.registerWorkbenchContribution(inlineChatAccessibleView_1.InlineChatAccessibleViewContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2Jyb3dzZXIvaW5saW5lQ2hhdC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvQmhHLGNBQWM7SUFFZCxJQUFBLDhCQUFpQixFQUFDLCtCQUFrQixFQUFFLDZDQUFxQixvQ0FBNEIsQ0FBQztJQUN4RixJQUFBLDhCQUFpQixFQUFDLG9EQUF5QixFQUFFLDJEQUE0QixrQ0FBMEIsQ0FBQyxDQUFDLDhEQUE4RDtJQUNuSyxJQUFBLDhCQUFpQixFQUFDLGtEQUF3QixFQUFFLHlEQUEyQixvQ0FBNEIsQ0FBQztJQUVwRyxJQUFBLDZDQUEwQixFQUFDLDJCQUFjLEVBQUUsMkNBQW9CLGdEQUF3QyxDQUFDLENBQUMsc0RBQXNEO0lBQy9KLElBQUEsNkNBQTBCLEVBQUMscURBQXdDLEVBQUUsaUJBQWlCLENBQUMsbUNBQW1DLHFEQUE2QyxDQUFDO0lBRXhLLElBQUEseUJBQWUsRUFBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ3RELElBQUEseUJBQWUsRUFBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMvQyxJQUFBLHlCQUFlLEVBQUMsaUJBQWlCLENBQUMseUJBQXlCLENBQUMsQ0FBQztJQUM3RCxJQUFBLHlCQUFlLEVBQUMsaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUN4RCxJQUFBLHlCQUFlLEVBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNyRCxJQUFBLHlCQUFlLEVBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDakQsSUFBQSx5QkFBZSxFQUFDLGlCQUFpQixDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDNUQsSUFBQSx5QkFBZSxFQUFDLGlCQUFpQixDQUFDLDBCQUEwQixDQUFDLENBQUM7SUFDOUQsSUFBQSx5QkFBZSxFQUFDLGlCQUFpQixDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDdkQsSUFBQSx5QkFBZSxFQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ2xELElBQUEseUJBQWUsRUFBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBRXRELElBQUEseUJBQWUsRUFBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3BELElBQUEseUJBQWUsRUFBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ3RELElBQUEseUJBQWUsRUFBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNuRCxJQUFBLHlCQUFlLEVBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUVwRCxJQUFBLHlCQUFlLEVBQUMsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUN2RCxJQUFBLHlCQUFlLEVBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFakQsSUFBQSx5QkFBZSxFQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBRWxELE1BQU0sOEJBQThCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ25ILDhCQUE4QixDQUFDLDZCQUE2QixDQUFDLG1EQUE4QixrQ0FBMEIsQ0FBQztJQUN0SCw4QkFBOEIsQ0FBQyw2QkFBNkIsQ0FBQywrREFBb0Msb0NBQTRCLENBQUMifQ==