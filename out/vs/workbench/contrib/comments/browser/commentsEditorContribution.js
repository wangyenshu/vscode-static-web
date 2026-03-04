/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/simpleCommentEditor", "vs/workbench/services/editor/common/editorService", "vs/platform/actions/common/actions", "vs/editor/common/editorContextKeys", "vs/workbench/contrib/comments/browser/commentsController", "vs/editor/common/core/range", "vs/platform/notification/common/notification", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/platform/accessibility/common/accessibility", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/common/contributions", "vs/workbench/contrib/comments/browser/commentsInputContentProvider", "vs/css!./media/review"], function (require, exports, keyCodes_1, editorBrowser_1, editorExtensions_1, codeEditorService_1, nls, commands_1, keybindingsRegistry_1, commentService_1, simpleCommentEditor_1, editorService_1, actions_1, editorContextKeys_1, commentsController_1, range_1, notification_1, commentContextKeys_1, accessibility_1, contextkey_1, accessibilityConfiguration_1, contributions_1, commentsInputContentProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getActiveEditor = getActiveEditor;
    (0, editorExtensions_1.registerEditorContribution)(commentsController_1.ID, commentsController_1.CommentController, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, contributions_1.registerWorkbenchContribution2)(commentsInputContentProvider_1.CommentsInputContentProvider.ID, commentsInputContentProvider_1.CommentsInputContentProvider, 2 /* WorkbenchPhase.BlockRestore */);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "editor.action.nextCommentThreadAction" /* CommentCommandId.NextThread */,
        handler: async (accessor, args) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = commentsController_1.CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            controller.nextCommentThread();
        },
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 512 /* KeyMod.Alt */ | 67 /* KeyCode.F9 */,
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "editor.action.previousCommentThreadAction" /* CommentCommandId.PreviousThread */,
        handler: async (accessor, args) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = commentsController_1.CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            controller.previousCommentThread();
        },
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 67 /* KeyCode.F9 */
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "editor.action.nextCommentingRange" /* CommentCommandId.NextRange */,
        handler: async (accessor, args) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = commentsController_1.CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            controller.nextCommentingRange();
        },
        when: contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, contextkey_1.ContextKeyExpr.or(editorContextKeys_1.EditorContextKeys.focus, commentContextKeys_1.CommentContextKeys.commentFocused, contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibilityHelpIsShown, accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("comments" /* AccessibleViewProviderId.Comments */)))),
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */),
        weight: 100 /* KeybindingWeight.EditorContrib */
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "editor.action.nextCommentingRange" /* CommentCommandId.NextRange */,
            title: nls.localize('comments.nextCommentingRange', "Go to Next Commenting Range"),
            category: 'Comments',
        },
        when: commentContextKeys_1.CommentContextKeys.activeEditorHasCommentingRange
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "editor.action.previousCommentingRange" /* CommentCommandId.PreviousRange */,
        handler: async (accessor, args) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = commentsController_1.CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            controller.previousCommentingRange();
        },
        when: contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, contextkey_1.ContextKeyExpr.or(editorContextKeys_1.EditorContextKeys.focus, commentContextKeys_1.CommentContextKeys.commentFocused, contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibilityHelpIsShown, accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("comments" /* AccessibleViewProviderId.Comments */)))),
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */),
        weight: 100 /* KeybindingWeight.EditorContrib */
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "editor.action.previousCommentingRange" /* CommentCommandId.PreviousRange */,
            title: nls.localize('comments.previousCommentingRange', "Go to Previous Commenting Range"),
            category: 'Comments',
        },
        when: commentContextKeys_1.CommentContextKeys.activeEditorHasCommentingRange
    });
    commands_1.CommandsRegistry.registerCommand({
        id: "workbench.action.toggleCommenting" /* CommentCommandId.ToggleCommenting */,
        handler: (accessor) => {
            const commentService = accessor.get(commentService_1.ICommentService);
            const enable = commentService.isCommentingEnabled;
            commentService.enableCommenting(!enable);
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "workbench.action.toggleCommenting" /* CommentCommandId.ToggleCommenting */,
            title: nls.localize('comments.toggleCommenting', "Toggle Editor Commenting"),
            category: 'Comments',
        },
        when: commentContextKeys_1.CommentContextKeys.WorkspaceHasCommenting
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "workbench.action.addComment" /* CommentCommandId.Add */,
        handler: async (accessor, args) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = commentsController_1.CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            const position = args?.range ? new range_1.Range(args.range.startLineNumber, args.range.startLineNumber, args.range.endLineNumber, args.range.endColumn)
                : (args?.fileComment ? undefined : activeEditor.getSelection());
            const notificationService = accessor.get(notification_1.INotificationService);
            try {
                await controller.addOrToggleCommentAtLine(position, undefined);
            }
            catch (e) {
                notificationService.error(nls.localize('comments.addCommand.error', "The cursor must be within a commenting range to add a comment")); // TODO: Once we have commands to go to next commenting range they should be included as buttons in the error.
            }
        },
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */),
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "workbench.action.addComment" /* CommentCommandId.Add */,
            title: nls.localize('comments.addCommand', "Add Comment on Current Selection"),
            category: 'Comments'
        },
        when: commentContextKeys_1.CommentContextKeys.activeCursorHasCommentingRange
    });
    commands_1.CommandsRegistry.registerCommand({
        id: "workbench.action.collapseAllComments" /* CommentCommandId.CollapseAll */,
        handler: (accessor) => {
            return getActiveController(accessor)?.collapseAll();
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "workbench.action.collapseAllComments" /* CommentCommandId.CollapseAll */,
            title: nls.localize('comments.collapseAll', "Collapse All Comments"),
            category: 'Comments'
        },
        when: commentContextKeys_1.CommentContextKeys.WorkspaceHasCommenting
    });
    commands_1.CommandsRegistry.registerCommand({
        id: "workbench.action.expandAllComments" /* CommentCommandId.ExpandAll */,
        handler: (accessor) => {
            return getActiveController(accessor)?.expandAll();
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "workbench.action.expandAllComments" /* CommentCommandId.ExpandAll */,
            title: nls.localize('comments.expandAll', "Expand All Comments"),
            category: 'Comments'
        },
        when: commentContextKeys_1.CommentContextKeys.WorkspaceHasCommenting
    });
    commands_1.CommandsRegistry.registerCommand({
        id: "workbench.action.expandUnresolvedComments" /* CommentCommandId.ExpandUnresolved */,
        handler: (accessor) => {
            return getActiveController(accessor)?.expandUnresolved();
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "workbench.action.expandUnresolvedComments" /* CommentCommandId.ExpandUnresolved */,
            title: nls.localize('comments.expandUnresolved', "Expand Unresolved Comments"),
            category: 'Comments'
        },
        when: commentContextKeys_1.CommentContextKeys.WorkspaceHasCommenting
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "editor.action.submitComment" /* CommentCommandId.Submit */,
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        when: simpleCommentEditor_1.ctxCommentEditorFocused,
        handler: (accessor, args) => {
            const activeCodeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (activeCodeEditor instanceof simpleCommentEditor_1.SimpleCommentEditor) {
                activeCodeEditor.getParentThread().submitComment();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "workbench.action.hideComment" /* CommentCommandId.Hide */,
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 9 /* KeyCode.Escape */,
        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
        when: simpleCommentEditor_1.ctxCommentEditorFocused,
        handler: (accessor, args) => {
            const activeCodeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (activeCodeEditor instanceof simpleCommentEditor_1.SimpleCommentEditor) {
                activeCodeEditor.getParentThread().collapse();
            }
        }
    });
    function getActiveEditor(accessor) {
        let activeTextEditorControl = accessor.get(editorService_1.IEditorService).activeTextEditorControl;
        if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
            if (activeTextEditorControl.getOriginalEditor().hasTextFocus()) {
                activeTextEditorControl = activeTextEditorControl.getOriginalEditor();
            }
            else {
                activeTextEditorControl = activeTextEditorControl.getModifiedEditor();
            }
        }
        if (!(0, editorBrowser_1.isCodeEditor)(activeTextEditorControl) || !activeTextEditorControl.hasModel()) {
            return null;
        }
        return activeTextEditorControl;
    }
    function getActiveController(accessor) {
        const activeEditor = getActiveEditor(accessor);
        if (!activeEditor) {
            return undefined;
        }
        const controller = commentsController_1.CommentController.get(activeEditor);
        if (!controller) {
            return undefined;
        }
        return controller;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNFZGl0b3JDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRzRWRpdG9yQ29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBMFBoRywwQ0FnQkM7SUEvT0QsSUFBQSw2Q0FBMEIsRUFBQyx1QkFBRSxFQUFFLHNDQUFpQiwyREFBbUQsQ0FBQztJQUNwRyxJQUFBLDhDQUE4QixFQUFDLDJEQUE0QixDQUFDLEVBQUUsRUFBRSwyREFBNEIsc0NBQThCLENBQUM7SUFFM0gseUNBQW1CLENBQUMsZ0NBQWdDLENBQUM7UUFDcEQsRUFBRSwyRUFBNkI7UUFDL0IsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBOEMsRUFBRSxFQUFFO1lBQzNFLE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ25CLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLENBQUM7WUFFRCxNQUFNLFVBQVUsR0FBRyxzQ0FBaUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMxQixDQUFDO1lBQ0QsVUFBVSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUNELE1BQU0sMENBQWdDO1FBQ3RDLE9BQU8sRUFBRSwwQ0FBdUI7S0FDaEMsQ0FBQyxDQUFDO0lBRUgseUNBQW1CLENBQUMsZ0NBQWdDLENBQUM7UUFDcEQsRUFBRSxtRkFBaUM7UUFDbkMsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBOEMsRUFBRSxFQUFFO1lBQzNFLE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ25CLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLENBQUM7WUFFRCxNQUFNLFVBQVUsR0FBRyxzQ0FBaUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMxQixDQUFDO1lBQ0QsVUFBVSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUNELE1BQU0sMENBQWdDO1FBQ3RDLE9BQU8sRUFBRSw4Q0FBeUIsc0JBQWE7S0FDL0MsQ0FBQyxDQUFDO0lBRUgseUNBQW1CLENBQUMsZ0NBQWdDLENBQUM7UUFDcEQsRUFBRSxzRUFBNEI7UUFDOUIsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBOEMsRUFBRSxFQUFFO1lBQzNFLE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ25CLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLENBQUM7WUFFRCxNQUFNLFVBQVUsR0FBRyxzQ0FBaUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMxQixDQUFDO1lBQ0QsVUFBVSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUNELElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxrREFBa0MsRUFBRSwyQkFBYyxDQUFDLEVBQUUsQ0FBQyxxQ0FBaUIsQ0FBQyxLQUFLLEVBQUUsdUNBQWtCLENBQUMsY0FBYyxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLHFEQUF3QixFQUFFLDREQUErQixDQUFDLFNBQVMsb0RBQW1DLENBQUMsQ0FBQyxDQUFDO1FBQ3ZRLE9BQU8sRUFBRSxJQUFBLG1CQUFRLEVBQUMsaURBQTZCLEVBQUUsZ0RBQTJCLDZCQUFvQixDQUFDO1FBQ2pHLE1BQU0sMENBQWdDO0tBQ3RDLENBQUMsQ0FBQztJQUVILHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsY0FBYyxFQUFFO1FBQ2xELE9BQU8sRUFBRTtZQUNSLEVBQUUsc0VBQTRCO1lBQzlCLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDhCQUE4QixFQUFFLDZCQUE2QixDQUFDO1lBQ2xGLFFBQVEsRUFBRSxVQUFVO1NBQ3BCO1FBQ0QsSUFBSSxFQUFFLHVDQUFrQixDQUFDLDhCQUE4QjtLQUN2RCxDQUFDLENBQUM7SUFFSCx5Q0FBbUIsQ0FBQyxnQ0FBZ0MsQ0FBQztRQUNwRCxFQUFFLDhFQUFnQztRQUNsQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUE4QyxFQUFFLEVBQUU7WUFDM0UsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLHNDQUFpQixDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLENBQUM7WUFDRCxVQUFVLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUN0QyxDQUFDO1FBQ0QsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGtEQUFrQyxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLHFDQUFpQixDQUFDLEtBQUssRUFBRSx1Q0FBa0IsQ0FBQyxjQUFjLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMscURBQXdCLEVBQUUsNERBQStCLENBQUMsU0FBUyxvREFBbUMsQ0FBQyxDQUFDLENBQUM7UUFDdlEsT0FBTyxFQUFFLElBQUEsbUJBQVEsRUFBQyxpREFBNkIsRUFBRSxnREFBMkIsMkJBQWtCLENBQUM7UUFDL0YsTUFBTSwwQ0FBZ0M7S0FDdEMsQ0FBQyxDQUFDO0lBRUgsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxjQUFjLEVBQUU7UUFDbEQsT0FBTyxFQUFFO1lBQ1IsRUFBRSw4RUFBZ0M7WUFDbEMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsa0NBQWtDLEVBQUUsaUNBQWlDLENBQUM7WUFDMUYsUUFBUSxFQUFFLFVBQVU7U0FDcEI7UUFDRCxJQUFJLEVBQUUsdUNBQWtCLENBQUMsOEJBQThCO0tBQ3ZELENBQUMsQ0FBQztJQUVILDJCQUFnQixDQUFDLGVBQWUsQ0FBQztRQUNoQyxFQUFFLDZFQUFtQztRQUNyQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUNyQixNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGdDQUFlLENBQUMsQ0FBQztZQUNyRCxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsbUJBQW1CLENBQUM7WUFDbEQsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUMsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsY0FBYyxFQUFFO1FBQ2xELE9BQU8sRUFBRTtZQUNSLEVBQUUsNkVBQW1DO1lBQ3JDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLDBCQUEwQixDQUFDO1lBQzVFLFFBQVEsRUFBRSxVQUFVO1NBQ3BCO1FBQ0QsSUFBSSxFQUFFLHVDQUFrQixDQUFDLHNCQUFzQjtLQUMvQyxDQUFDLENBQUM7SUFFSCx5Q0FBbUIsQ0FBQyxnQ0FBZ0MsQ0FBQztRQUNwRCxFQUFFLDBEQUFzQjtRQUN4QixPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUE4QyxFQUFFLEVBQUU7WUFDM0UsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLHNDQUFpQixDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLGFBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztnQkFDL0ksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUNqRSxNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUNBQW9CLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxVQUFVLENBQUMsd0JBQXdCLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2hFLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLCtEQUErRCxDQUFDLENBQUMsQ0FBQyxDQUFDLDhHQUE4RztZQUN0UCxDQUFDO1FBQ0YsQ0FBQztRQUNELE1BQU0sMENBQWdDO1FBQ3RDLE9BQU8sRUFBRSxJQUFBLG1CQUFRLEVBQUMsaURBQTZCLEVBQUUsZ0RBQTJCLHdCQUFlLENBQUM7S0FDNUYsQ0FBQyxDQUFDO0lBRUgsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxjQUFjLEVBQUU7UUFDbEQsT0FBTyxFQUFFO1lBQ1IsRUFBRSwwREFBc0I7WUFDeEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsa0NBQWtDLENBQUM7WUFDOUUsUUFBUSxFQUFFLFVBQVU7U0FDcEI7UUFDRCxJQUFJLEVBQUUsdUNBQWtCLENBQUMsOEJBQThCO0tBQ3ZELENBQUMsQ0FBQztJQUVILDJCQUFnQixDQUFDLGVBQWUsQ0FBQztRQUNoQyxFQUFFLDJFQUE4QjtRQUNoQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUNyQixPQUFPLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3JELENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLGNBQWMsRUFBRTtRQUNsRCxPQUFPLEVBQUU7WUFDUixFQUFFLDJFQUE4QjtZQUNoQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSx1QkFBdUIsQ0FBQztZQUNwRSxRQUFRLEVBQUUsVUFBVTtTQUNwQjtRQUNELElBQUksRUFBRSx1Q0FBa0IsQ0FBQyxzQkFBc0I7S0FDL0MsQ0FBQyxDQUFDO0lBRUgsMkJBQWdCLENBQUMsZUFBZSxDQUFDO1FBQ2hDLEVBQUUsdUVBQTRCO1FBQzlCLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFO1lBQ3JCLE9BQU8sbUJBQW1CLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUM7UUFDbkQsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsY0FBYyxFQUFFO1FBQ2xELE9BQU8sRUFBRTtZQUNSLEVBQUUsdUVBQTRCO1lBQzlCLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLHFCQUFxQixDQUFDO1lBQ2hFLFFBQVEsRUFBRSxVQUFVO1NBQ3BCO1FBQ0QsSUFBSSxFQUFFLHVDQUFrQixDQUFDLHNCQUFzQjtLQUMvQyxDQUFDLENBQUM7SUFFSCwyQkFBZ0IsQ0FBQyxlQUFlLENBQUM7UUFDaEMsRUFBRSxxRkFBbUM7UUFDckMsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUU7WUFDckIsT0FBTyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDO1FBQzFELENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLGNBQWMsRUFBRTtRQUNsRCxPQUFPLEVBQUU7WUFDUixFQUFFLHFGQUFtQztZQUNyQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSw0QkFBNEIsQ0FBQztZQUM5RSxRQUFRLEVBQUUsVUFBVTtTQUNwQjtRQUNELElBQUksRUFBRSx1Q0FBa0IsQ0FBQyxzQkFBc0I7S0FDL0MsQ0FBQyxDQUFDO0lBRUgseUNBQW1CLENBQUMsZ0NBQWdDLENBQUM7UUFDcEQsRUFBRSw2REFBeUI7UUFDM0IsTUFBTSwwQ0FBZ0M7UUFDdEMsT0FBTyxFQUFFLGlEQUE4QjtRQUN2QyxJQUFJLEVBQUUsNkNBQXVCO1FBQzdCLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUMzQixNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0NBQWtCLENBQUMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQ2pGLElBQUksZ0JBQWdCLFlBQVkseUNBQW1CLEVBQUUsQ0FBQztnQkFDckQsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDcEQsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCx5Q0FBbUIsQ0FBQyxnQ0FBZ0MsQ0FBQztRQUNwRCxFQUFFLDREQUF1QjtRQUN6QixNQUFNLDBDQUFnQztRQUN0QyxPQUFPLHdCQUFnQjtRQUN2QixTQUFTLEVBQUUsQ0FBQyxnREFBNkIsQ0FBQztRQUMxQyxJQUFJLEVBQUUsNkNBQXVCO1FBQzdCLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUMzQixNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0NBQWtCLENBQUMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQ2pGLElBQUksZ0JBQWdCLFlBQVkseUNBQW1CLEVBQUUsQ0FBQztnQkFDckQsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDL0MsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxTQUFnQixlQUFlLENBQUMsUUFBMEI7UUFDekQsSUFBSSx1QkFBdUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQztRQUVuRixJQUFJLElBQUEsNEJBQVksRUFBQyx1QkFBdUIsQ0FBQyxFQUFFLENBQUM7WUFDM0MsSUFBSSx1QkFBdUIsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7Z0JBQ2hFLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDdkUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDdkUsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLENBQUMsSUFBQSw0QkFBWSxFQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO1lBQ25GLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sdUJBQXVCLENBQUM7SUFDaEMsQ0FBQztJQUVELFNBQVMsbUJBQW1CLENBQUMsUUFBMEI7UUFDdEQsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNuQixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsTUFBTSxVQUFVLEdBQUcsc0NBQWlCLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNqQixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsT0FBTyxVQUFVLENBQUM7SUFDbkIsQ0FBQyJ9