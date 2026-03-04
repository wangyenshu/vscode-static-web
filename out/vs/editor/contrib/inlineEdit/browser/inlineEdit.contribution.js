/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/inlineEdit/browser/commands", "vs/editor/contrib/inlineEdit/browser/hoverParticipant", "vs/editor/contrib/inlineEdit/browser/inlineEditController"], function (require, exports, editorExtensions_1, hoverTypes_1, commands_1, hoverParticipant_1, inlineEditController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorAction)(commands_1.AcceptInlineEdit);
    (0, editorExtensions_1.registerEditorAction)(commands_1.RejectInlineEdit);
    (0, editorExtensions_1.registerEditorAction)(commands_1.JumpToInlineEdit);
    (0, editorExtensions_1.registerEditorAction)(commands_1.JumpBackInlineEdit);
    (0, editorExtensions_1.registerEditorAction)(commands_1.TriggerInlineEdit);
    (0, editorExtensions_1.registerEditorContribution)(inlineEditController_1.InlineEditController.ID, inlineEditController_1.InlineEditController, 3 /* EditorContributionInstantiation.Eventually */);
    hoverTypes_1.HoverParticipantRegistry.register(hoverParticipant_1.InlineEditHoverParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lRWRpdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVFZGl0L2Jyb3dzZXIvaW5saW5lRWRpdC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsSUFBQSx1Q0FBb0IsRUFBQywyQkFBZ0IsQ0FBQyxDQUFDO0lBQ3ZDLElBQUEsdUNBQW9CLEVBQUMsMkJBQWdCLENBQUMsQ0FBQztJQUN2QyxJQUFBLHVDQUFvQixFQUFDLDJCQUFnQixDQUFDLENBQUM7SUFDdkMsSUFBQSx1Q0FBb0IsRUFBQyw2QkFBa0IsQ0FBQyxDQUFDO0lBQ3pDLElBQUEsdUNBQW9CLEVBQUMsNEJBQWlCLENBQUMsQ0FBQztJQUN4QyxJQUFBLDZDQUEwQixFQUFDLDJDQUFvQixDQUFDLEVBQUUsRUFBRSwyQ0FBb0IscURBQTZDLENBQUM7SUFHdEgscUNBQXdCLENBQUMsUUFBUSxDQUFDLDZDQUEwQixDQUFDLENBQUMifQ==