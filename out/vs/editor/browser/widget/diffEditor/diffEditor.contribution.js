/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/browser/widget/diffEditor/commands", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "./registrations.contribution"], function (require, exports, codicons_1, commands_1, editorContextKeys_1, nls_1, actions_1, commands_2, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(commands_1.ToggleCollapseUnchangedRegions);
    (0, actions_1.registerAction2)(commands_1.ToggleShowMovedCodeBlocks);
    (0, actions_1.registerAction2)(commands_1.ToggleUseInlineViewWhenSpaceIsLimited);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: new commands_1.ToggleUseInlineViewWhenSpaceIsLimited().desc.id,
            title: (0, nls_1.localize)('useInlineViewWhenSpaceIsLimited', "Use Inline View When Space Is Limited"),
            toggled: contextkey_1.ContextKeyExpr.has('config.diffEditor.useInlineViewWhenSpaceIsLimited'),
            precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
        },
        order: 11,
        group: '1_diff',
        when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.diffEditorRenderSideBySideInlineBreakpointReached, contextkey_1.ContextKeyExpr.has('isInDiffEditor')),
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: new commands_1.ToggleShowMovedCodeBlocks().desc.id,
            title: (0, nls_1.localize)('showMoves', "Show Moved Code Blocks"),
            icon: codicons_1.Codicon.move,
            toggled: contextkey_1.ContextKeyEqualsExpr.create('config.diffEditor.experimental.showMoves', true),
            precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
        },
        order: 10,
        group: '1_diff',
        when: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
    });
    (0, actions_1.registerAction2)(commands_1.RevertHunkOrSelection);
    for (const ctx of [
        { icon: codicons_1.Codicon.arrowRight, key: editorContextKeys_1.EditorContextKeys.diffEditorInlineMode.toNegated() },
        { icon: codicons_1.Codicon.discard, key: editorContextKeys_1.EditorContextKeys.diffEditorInlineMode }
    ]) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.DiffEditorHunkToolbar, {
            command: {
                id: new commands_1.RevertHunkOrSelection().desc.id,
                title: (0, nls_1.localize)('revertHunk', "Revert Block"),
                icon: ctx.icon,
            },
            when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.diffEditorModifiedWritable, ctx.key),
            order: 5,
            group: 'primary',
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.DiffEditorSelectionToolbar, {
            command: {
                id: new commands_1.RevertHunkOrSelection().desc.id,
                title: (0, nls_1.localize)('revertSelection', "Revert Selection"),
                icon: ctx.icon,
            },
            when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.diffEditorModifiedWritable, ctx.key),
            order: 5,
            group: 'primary',
        });
    }
    (0, actions_1.registerAction2)(commands_1.SwitchSide);
    (0, actions_1.registerAction2)(commands_1.ExitCompareMove);
    (0, actions_1.registerAction2)(commands_1.CollapseAllUnchangedRegions);
    (0, actions_1.registerAction2)(commands_1.ShowAllUnchangedRegions);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: commands_1.AccessibleDiffViewerNext.id,
            title: (0, nls_1.localize)('Open Accessible Diff Viewer', "Open Accessible Diff Viewer"),
            precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
        },
        order: 10,
        group: '2_diff',
        when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.accessibleDiffViewerVisible.negate(), contextkey_1.ContextKeyExpr.has('isInDiffEditor')),
    });
    commands_2.CommandsRegistry.registerCommandAlias('editor.action.diffReview.next', commands_1.AccessibleDiffViewerNext.id);
    (0, actions_1.registerAction2)(commands_1.AccessibleDiffViewerNext);
    commands_2.CommandsRegistry.registerCommandAlias('editor.action.diffReview.prev', commands_1.AccessibleDiffViewerPrev.id);
    (0, actions_1.registerAction2)(commands_1.AccessibleDiffViewerPrev);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvci5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9kaWZmRWRpdG9yLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxJQUFBLHlCQUFlLEVBQUMseUNBQThCLENBQUMsQ0FBQztJQUNoRCxJQUFBLHlCQUFlLEVBQUMsb0NBQXlCLENBQUMsQ0FBQztJQUMzQyxJQUFBLHlCQUFlLEVBQUMsZ0RBQXFDLENBQUMsQ0FBQztJQUV2RCxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLFdBQVcsRUFBRTtRQUMvQyxPQUFPLEVBQUU7WUFDUixFQUFFLEVBQUUsSUFBSSxnREFBcUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZELEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxpQ0FBaUMsRUFBRSx1Q0FBdUMsQ0FBQztZQUMzRixPQUFPLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsbURBQW1ELENBQUM7WUFDaEYsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDO1NBQ2xEO1FBQ0QsS0FBSyxFQUFFLEVBQUU7UUFDVCxLQUFLLEVBQUUsUUFBUTtRQUNmLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FDdkIscUNBQWlCLENBQUMsaURBQWlELEVBQ25FLDJCQUFjLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQ3BDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxXQUFXLEVBQUU7UUFDL0MsT0FBTyxFQUFFO1lBQ1IsRUFBRSxFQUFFLElBQUksb0NBQXlCLEVBQUUsQ0FBQyxJQUFJLENBQUMs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