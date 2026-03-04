/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/chat/electron-sandbox/actions/voiceChatActions", "vs/platform/actions/common/actions", "vs/workbench/common/contributions"], function (require, exports, voiceChatActions_1, actions_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(voiceChatActions_1.StartVoiceChatAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.InstallVoiceChatAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.VoiceChatInChatViewAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.HoldToVoiceChatInChatViewAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.QuickVoiceChatAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.InlineVoiceChatAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningAndSubmitAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningInChatViewAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningInChatEditorAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningInQuickChatAction);
    (0, actions_1.registerAction2)(voiceChatActions_1.StopListeningInTerminalChatAction);
    (0, contributions_1.registerWorkbenchContribution2)(voiceChatActions_1.KeywordActivationContribution.ID, voiceChatActions_1.KeywordActivationContribution, 3 /* WorkbenchPhase.AfterRestored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2VsZWN0cm9uLXNhbmRib3gvY2hhdC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsSUFBQSx5QkFBZSxFQUFDLHVDQUFvQixDQUFDLENBQUM7SUFDdEMsSUFBQSx5QkFBZSxFQUFDLHlDQUFzQixDQUFDLENBQUM7SUFFeEMsSUFBQSx5QkFBZSxFQUFDLDRDQUF5QixDQUFDLENBQUM7SUFDM0MsSUFBQSx5QkFBZSxFQUFDLGtEQUErQixDQUFDLENBQUM7SUFDakQsSUFBQSx5QkFBZSxFQUFDLHVDQUFvQixDQUFDLENBQUM7SUFDdEMsSUFBQSx5QkFBZSxFQUFDLHdDQUFxQixDQUFDLENBQUM7SUFFdkMsSUFBQSx5QkFBZSxFQUFDLHNDQUFtQixDQUFDLENBQUM7SUFDckMsSUFBQSx5QkFBZSxFQUFDLCtDQUE0QixDQUFDLENBQUM7SUFFOUMsSUFBQSx5QkFBZSxFQUFDLGdEQUE2QixDQUFDLENBQUM7SUFDL0MsSUFBQSx5QkFBZSxFQUFDLGtEQUErQixDQUFDLENBQUM7SUFDakQsSUFBQSx5QkFBZSxFQUFDLGlEQUE4QixDQUFDLENBQUM7SUFDaEQsSUFBQSx5QkFBZSxFQUFDLG9EQUFpQyxDQUFDLENBQUM7SUFFbkQsSUFBQSw4Q0FBOEIsRUFBQyxnREFBNkIsQ0FBQyxFQUFFLEVBQUUsZ0RBQTZCLHVDQUErQixDQUFDIn0=