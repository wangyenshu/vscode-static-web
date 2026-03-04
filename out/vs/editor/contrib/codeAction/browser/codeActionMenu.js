/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/contrib/codeAction/common/types", "vs/nls", "vs/base/common/hierarchicalKind", "vs/base/browser/ui/codicons/codiconStyles", "vs/editor/contrib/symbolIcons/browser/symbolIcons"], function (require, exports, codicons_1, types_1, nls_1, hierarchicalKind_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toMenuItems = toMenuItems;
    const uncategorizedCodeActionGroup = Object.freeze({ kind: hierarchicalKind_1.HierarchicalKind.Empty, title: (0, nls_1.localize)('codeAction.widget.id.more', 'More Actions...') });
    const codeActionGroups = Object.freeze([
        { kind: types_1.CodeActionKind.QuickFix, title: (0, nls_1.localize)('codeAction.widget.id.quickfix', 'Quick Fix') },
        { kind: types_1.CodeActionKind.RefactorExtract, title: (0, nls_1.localize)('codeAction.widget.id.extract', 'Extract'), icon: codicons_1.Codicon.wrench },
        { kind: types_1.CodeActionKind.RefactorInline, title: (0, nls_1.localize)('codeAction.widget.id.inline', 'Inline'), icon: codicons_1.Codicon.wrench },
        { kind: types_1.CodeActionKind.RefactorRewrite, title: (0, nls_1.localize)('codeAction.widget.id.convert', 'Rewrite'), icon: codicons_1.Codicon.wrench },
        { kind: types_1.CodeActionKind.RefactorMove, title: (0, nls_1.localize)('codeAction.widget.id.move', 'Move'), icon: codicons_1.Codicon.wrench },
        { kind: types_1.CodeActionKind.SurroundWith, title: (0, nls_1.localize)('codeAction.widget.id.surround', 'Surround With'), icon: codicons_1.Codicon.surroundWith },
        { kind: types_1.CodeActionKind.Source, title: (0, nls_1.localize)('codeAction.widget.id.source', 'Source Action'), icon: codicons_1.Codicon.symbolFile },
        uncategorizedCodeActionGroup,
    ]);
    function toMenuItems(inputCodeActions, showHeaders, keybindingResolver) {
        if (!showHeaders) {
            return inputCodeActions.map((action) => {
                return {
                    kind: "action" /* ActionListItemKind.Action */,
                    item: action,
                    group: uncategorizedCodeActionGroup,
                    disabled: !!action.action.disabled,
                    label: action.action.disabled || action.action.title,
                    canPreview: !!action.action.edit?.edits.length,
                };
            });
        }
        // Group code actions
        const menuEntries = codeActionGroups.map(group => ({ group, actions: [] }));
        for (const action of inputCodeActions) {
            const kind = action.action.kind ? new hierarchicalKind_1.HierarchicalKind(action.action.kind) : hierarchicalKind_1.HierarchicalKind.None;
            for (const menuEntry of menuEntries) {
                if (menuEntry.group.kind.contains(kind)) {
                    menuEntry.actions.push(action);
                    break;
                }
            }
        }
        const allMenuItems = [];
        for (const menuEntry of menuEntries) {
            if (menuEntry.actions.length) {
                allMenuItems.push({ kind: "header" /* ActionListItemKind.Header */, group: menuEntry.group });
                for (const action of menuEntry.actions) {
                    const group = menuEntry.group;
                    allMenuItems.push({
                        kind: "action" /* ActionListItemKind.Action */,
                        item: action,
                        group: action.action.isAI ? { title: group.title, kind: group.kind, icon: codicons_1.Codicon.sparkle } : group,
                        label: action.action.title,
                        disabled: !!action.action.disabled,
                        keybinding: keybindingResolver(action.action),
                    });
                }
            }
        }
        return allMenuItems;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbk1lbnUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb2RlQWN0aW9uL2Jyb3dzZXIvY29kZUFjdGlvbk1lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQ2hHLGtDQWlEQztJQTlERCxNQUFNLDRCQUE0QixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQWMsRUFBRSxJQUFJLEVBQUUsbUNBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUVuSyxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQWdCO1FBQ3JELEVBQUUsSUFBSSxFQUFFLHNCQUFjLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSxXQUFXLENBQUMsRUFBRTtRQUNoRyxFQUFFLElBQUksRUFBRSxzQkFBYyxDQUFDLGVBQWUsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsOEJBQThCLEVBQUUsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFPLENBQUMsTUFBTSxFQUFFO1FBQzFILEVBQUUsSUFBSSxFQUFFLHNCQUFjLENBQUMsY0FBYyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSxRQUFRLENBQUMsRUFBRSxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxNQUFNLEVBQUU7UUFDdkgsRUFBRSxJQUFJLEVBQUUsc0JBQWMsQ0FBQyxlQUFlLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDhCQUE4QixFQUFFLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxrQkFBTyxDQUFDLE1BQU0sRUFBRTtRQUMx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