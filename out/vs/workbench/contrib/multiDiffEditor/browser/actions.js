/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/files/browser/editors/textFileEditor", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditor", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, codicons_1, editorContextKeys_1, nls_1, actions_1, contextkey_1, textFileEditor_1, multiDiffEditor_1, multiDiffEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExpandAllAction = exports.CollapseAllAction = exports.GoToFileAction = void 0;
    class GoToFileAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'multiDiffEditor.goToFile',
                title: (0, nls_1.localize2)('goToFile', 'Open File'),
                icon: codicons_1.Codicon.goToFile,
                precondition: editorContextKeys_1.EditorContextKeys.inMultiDiffEditor,
                menu: {
                    when: editorContextKeys_1.EditorContextKeys.inMultiDiffEditor,
                    id: actions_1.MenuId.MultiDiffEditorFileToolbar,
                    order: 22,
                    group: 'navigation',
                },
            });
        }
        async run(accessor, ...args) {
            const uri = args[0];
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            let selections = undefined;
            if (activeEditorPane instanceof multiDiffEditor_1.MultiDiffEditor) {
                const editor = activeEditorPane.tryGetCodeEditor(uri);
                if (editor) {
                    selections = editor.editor.getSelections() ?? undefined;
                }
            }
            const editor = await editorService.openEditor({ resource: uri });
            if (selections && (editor instanceof textFileEditor_1.TextFileEditor)) {
                const c = editor.getControl();
                if (c) {
                    c.setSelections(selections);
                    c.revealLineInCenter(selections[0].selectionStartLineNumber);
                }
            }
        }
    }
    exports.GoToFileAction = GoToFileAction;
    class CollapseAllAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'multiDiffEditor.collapseAll',
                title: (0, nls_1.localize2)('collapseAllDiffs', 'Collapse All Diffs'),
                icon: codicons_1.Codicon.collapseAll,
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', multiDiffEditor_1.MultiDiffEditor.ID), contextkey_1.ContextKeyExpr.not('multiDiffEditorAllCollapsed')),
                menu: {
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', multiDiffEditor_1.MultiDiffEditor.ID), contextkey_1.ContextKeyExpr.not('multiDiffEditorAllCollapsed')),
                    id: actions_1.MenuId.EditorTitle,
                    group: 'navigation',
                    order: 100
                },
                f1: true,
            });
        }
        async run(accessor, ...args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditor = editorService.activeEditor;
            if (activeEditor instanceof multiDiffEditorInput_1.MultiDiffEditorInput) {
                const viewModel = await activeEditor.getViewModel();
                viewModel.collapseAll();
            }
        }
    }
    exports.CollapseAllAction = CollapseAllAction;
    class ExpandAllAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'multiDiffEditor.expandAll',
                title: (0, nls_1.localize2)('ExpandAllDiffs', 'Expand All Diffs'),
                icon: codicons_1.Codicon.expandAll,
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', multiDiffEditor_1.MultiDiffEditor.ID), contextkey_1.ContextKeyExpr.has('multiDiffEditorAllCollapsed')),
                menu: {
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', multiDiffEditor_1.MultiDiffEditor.ID), contextkey_1.ContextKeyExpr.has('multiDiffEditorAllCollapsed')),
                    id: actions_1.MenuId.EditorTitle,
                    group: 'navigation',
                    order: 100
                },
                f1: true,
            });
        }
        async run(accessor, ...args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditor = editorService.activeEditor;
            if (activeEditor instanceof multiDiffEditorInput_1.MultiDiffEditorInput) {
                const viewModel = await activeEditor.getViewModel();
                viewModel.expandAll();
            }
        }
    }
    exports.ExpandAllAction = ExpandAllAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL211bHRpRGlmZkVkaXRvci9icm93c2VyL2FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQWEsY0FBZSxTQUFRLGlCQUFPO1FBQzFDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwwQkFBMEI7Z0JBQzlCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxVQUFVLEVBQUUsV0FBVyxDQUFDO2dCQUN6QyxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxRQUFRO2dCQUN0QixZQUFZLEVBQUUscUNBQWlCLENBQUMsaUJBQWlCO2dCQUNqRCxJQUFJLEVBQUU7b0JBQ0wsSUFBSSxFQUFFLHFDQUFpQixDQUFDLGlCQUFpQjtvQkFDekMsRUFBRSxFQUFFLGdCQUFNLENBQUMsMEJBQTBCO29CQUNyQyxLQUFLLEVBQUUsRUFBRTtvQkFDVCxLQUFLLEVBQUUsWUFBWTtpQkFDbkI7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLEdBQUcsSUFBVztZQUNuRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFRLENBQUM7WUFDM0IsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxnQkFBZ0IsR0FBRyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7WUFDeEQsSUFBSSxVQUFVLEdBQTRCLFNBQVMsQ0FBQztZQUNwRCxJQUFJLGdCQUFnQixZQUFZLGlDQUFlLEVBQUUsQ0FBQztnQkFDakQsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7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