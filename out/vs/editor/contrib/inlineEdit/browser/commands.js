/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/inlineEdit/browser/commandIds", "vs/editor/contrib/inlineEdit/browser/inlineEditController", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey"], function (require, exports, editorExtensions_1, editorContextKeys_1, commandIds_1, inlineEditController_1, actions_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RejectInlineEdit = exports.JumpBackInlineEdit = exports.JumpToInlineEdit = exports.TriggerInlineEdit = exports.AcceptInlineEdit = void 0;
    class AcceptInlineEdit extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: commandIds_1.inlineEditAcceptId,
                label: 'Accept Inline Edit',
                alias: 'Accept Inline Edit',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineEditController_1.InlineEditController.inlineEditVisibleContext),
                kbOpts: [
                    {
                        weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                        primary: 2 /* KeyCode.Tab */,
                        kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineEditController_1.InlineEditController.inlineEditVisibleContext, inlineEditController_1.InlineEditController.cursorAtInlineEditContext)
                    }
                ],
                menuOpts: [{
                        menuId: actions_1.MenuId.InlineEditToolbar,
                        title: 'Accept',
                        group: 'primary',
                        order: 1,
                    }],
            });
        }
        async run(accessor, editor) {
            const controller = inlineEditController_1.InlineEditController.get(editor);
            await controller?.accept();
        }
    }
    exports.AcceptInlineEdit = AcceptInlineEdit;
    class TriggerInlineEdit extends editorExtensions_1.EditorAction {
        constructor() {
            const activeExpr = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextkey_1.ContextKeyExpr.not(inlineEditController_1.InlineEditController.inlineEditVisibleKey));
            super({
                id: 'editor.action.inlineEdit.trigger',
                label: 'Trigger Inline Edit',
                alias: 'Trigger Inline Edit',
                precondition: activeExpr,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 86 /* KeyCode.Equal */,
                    kbExpr: activeExpr
                },
            });
        }
        async run(accessor, editor) {
            const controller = inlineEditController_1.InlineEditController.get(editor);
            controller?.trigger();
        }
    }
    exports.TriggerInlineEdit = TriggerInlineEdit;
    class JumpToInlineEdit extends editorExtensions_1.EditorAction {
        constructor() {
            const activeExpr = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineEditController_1.InlineEditController.inlineEditVisibleContext, contextkey_1.ContextKeyExpr.not(inlineEditController_1.InlineEditController.cursorAtInlineEditKey));
            super({
                id: commandIds_1.inlineEditJumpToId,
                label: 'Jump to Inline Edit',
                alias: 'Jump to Inline Edit',
                precondition: activeExpr,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 86 /* KeyCode.Equal */,
                    kbExpr: activeExpr
                },
                menuOpts: [{
                        menuId: actions_1.MenuId.InlineEditToolbar,
                        title: 'Jump To Edit',
                        group: 'primary',
                        order: 3,
                        when: activeExpr
                    }],
            });
        }
        async run(accessor, editor) {
            const controller = inlineEditController_1.InlineEditController.get(editor);
            controller?.jumpToCurrent();
        }
    }
    exports.JumpToInlineEdit = JumpToInlineEdit;
    class JumpBackInlineEdit extends editorExtensions_1.EditorAction {
        constructor() {
            const activeExpr = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineEditController_1.InlineEditController.cursorAtInlineEditContext);
            super({
                id: commandIds_1.inlineEditJumpBackId,
                label: 'Jump Back from Inline Edit',
                alias: 'Jump Back from Inline Edit',
                precondition: activeExpr,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 10,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 86 /* KeyCode.Equal */,
                    kbExpr: activeExpr
                },
                menuOpts: [{
                        menuId: actions_1.MenuId.InlineEditToolbar,
                        title: 'Jump Back',
                        group: 'primary',
                        order: 3,
                        when: activeExpr
                    }],
            });
        }
        async run(accessor, editor) {
            const controller = inlineEditController_1.InlineEditController.get(editor);
            controller?.jumpBack();
        }
    }
    exports.JumpBackInlineEdit = JumpBackInlineEdit;
    class RejectInlineEdit extends editorExtensions_1.EditorAction {
        constructor() {
            const activeExpr = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineEditController_1.InlineEditController.inlineEditVisibleContext);
            super({
                id: commandIds_1.inlineEditRejectId,
                label: 'Reject Inline Edit',
                alias: 'Reject Inline Edit',
                precondition: activeExpr,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */,
                    kbExpr: activeExpr
                },
                menuOpts: [{
                        menuId: actions_1.MenuId.InlineEditToolbar,
                        title: 'Reject',
                        group: 'secondary',
                        order: 2,
                    }],
            });
        }
        async run(accessor, editor) {
            const controller = inlineEditController_1.InlineEditController.get(editor);
            await controller?.clear();
        }
    }
    exports.RejectInlineEdit = RejectInlineEdit;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVFZGl0L2Jyb3dzZXIvY29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQWEsZ0JBQWlCLFNBQVEsK0JBQVk7UUFDakQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLCtCQUFrQjtnQkFDdEIsS0FBSyxFQUFFLG9CQUFvQjtnQkFDM0IsS0FBSyxFQUFFLG9CQUFvQjtnQkFDM0IsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLHFDQUFpQixDQUFDLFFBQVEsRUFBRSwyQ0FBb0IsQ0FBQyx3QkFBd0IsQ0FBQztnQkFDM0csTUFBTSxFQUFFO29CQUNQO3dCQUNDLE1BQU0sRUFBRSwyQ0FBaUMsQ0FBQzt3QkFDMUMsT0FBTyxxQkFBYTt3QkFDcEIsTUFBTSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLHFDQUFpQixDQUFDLFFBQVEsRUFBRSwyQ0FBb0IsQ0FBQyx3QkFBd0IsRUFBRSwyQ0FBb0IsQ0FBQyx5QkFBeUIsQ0FBQztxQkFDcko7aUJBQUM7Z0JBQ0gsUUFBUSxFQUFFLENBQUM7d0JBQ1YsTUFBTSxFQUFFLGdCQUFNLENBQUMsaUJBQWlCO3dCQUNoQyxLQUFLLEVBQUUsUUFBUTt3QkFDZixLQUFLLEVBQUUsU0FBUzt3QkFDaEIsS0FBSyxFQUFFLENBQUM7cUJBQ1IsQ0FBQzthQUNGLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQXNDLEVBQUUsTUFBbUI7WUFDM0UsTUFBTSxVQUFVLEdBQUcsMkNBQW9CLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BELE1BQU0sVUFBVSxFQUFFLE1BQU0sRUFBRSxDQUFD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