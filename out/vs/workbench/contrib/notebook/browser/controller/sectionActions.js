/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/contrib/outline/notebookOutline", "vs/workbench/contrib/notebook/browser/controller/foldingController", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, nls_1, actions_1, contextkey_1, notebookOutline_1, foldingController_1, icons, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookExpandSection = exports.NotebookFoldSection = exports.NotebookRunCellsInSection = exports.NotebookRunSingleCellInSection = void 0;
    class NotebookRunSingleCellInSection extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.section.runSingleCell',
                title: {
                    ...(0, nls_1.localize2)('runCell', "Run Cell"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mirunCell', comment: ['&& denotes a mnemonic'] }, "&&Run Cell"),
                },
                shortTitle: (0, nls_1.localize)('runCell', "Run Cell"),
                icon: icons.executeIcon,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookOutlineActionMenu,
                        group: 'inline',
                        order: 1,
                        when: contextkey_1.ContextKeyExpr.and(notebookOutline_1.NotebookOutlineContext.CellKind.isEqualTo(notebookCommon_1.CellKind.Code), notebookOutline_1.NotebookOutlineContext.OutlineElementTarget.isEqualTo(1 /* OutlineTarget.OutlinePane */), notebookOutline_1.NotebookOutlineContext.CellHasChildren.toNegated(), notebookOutline_1.NotebookOutlineContext.CellHasHeader.toNegated())
                    }
                ]
            });
        }
        async run(_accessor, context) {
            if (!checkSectionContext(context)) {
                return;
            }
            context.notebookEditor.executeNotebookCells([context.outlineEntry.cell]);
        }
    }
    exports.NotebookRunSingleCellInSection = NotebookRunSingleCellInSection;
    class NotebookRunCellsInSection extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.section.runCells',
                title: {
                    ...(0, nls_1.localize2)('runCellsInSection', "Run Cells In Section"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mirunCellsInSection', comment: ['&& denotes a mnemonic'] }, "&&Run Cells In Section"),
                },
                shortTitle: (0, nls_1.localize)('runCellsInSection', "Run Cells In Section"),
                // icon: icons.executeBelowIcon, // TODO @Yoyokrazy replace this with new icon later
                menu: [
                    {
                        id: actions_1.MenuId.NotebookStickyScrollContext,
                        group: 'notebookExecution',
                        order: 1
                    },
                    {
                        id: actions_1.MenuId.NotebookOutlineActionMenu,
                        group: 'inline',
                        order: 1,
                        when: contextkey_1.ContextKeyExpr.and(notebookOutline_1.NotebookOutlineContext.CellKind.isEqualTo(notebookCommon_1.CellKind.Markup), notebookOutline_1.NotebookOutlineContext.OutlineElementTarget.isEqualTo(1 /* OutlineTarget.OutlinePane */), notebookOutline_1.NotebookOutlineContext.CellHasChildren, notebookOutline_1.NotebookOutlineContext.CellHasHeader)
                    }
                ]
            });
        }
        async run(_accessor, context) {
            if (!checkSectionContext(context)) {
                return;
            }
            const cell = context.outlineEntry.cell;
            const idx = context.notebookEditor.getViewModel()?.getCellIndex(cell);
            if (idx === undefined) {
                return;
            }
            const length = context.notebookEditor.getViewModel()?.getFoldedLength(idx);
            if (length === undefined) {
                return;
            }
            const cells = context.notebookEditor.getCellsInRange({ start: idx, end: idx + length + 1 });
            context.notebookEditor.executeNotebookCells(cells);
        }
    }
    exports.NotebookRunCellsInSection = NotebookRunCellsInSection;
    class NotebookFoldSection extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.section.foldSection',
                title: {
                    ...(0, nls_1.localize2)('foldSection', "Fold Section"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mifoldSection', comment: ['&& denotes a mnemonic'] }, "&&Fold Section"),
                },
                shortTitle: (0, nls_1.localize)('foldSection', "Fold Section"),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookOutlineActionMenu,
                        group: 'notebookFolding',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.and(notebookOutline_1.NotebookOutlineContext.CellKind.isEqualTo(notebookCommon_1.CellKind.Markup), notebookOutline_1.NotebookOutlineContext.OutlineElementTarget.isEqualTo(1 /* OutlineTarget.OutlinePane */), notebookOutline_1.NotebookOutlineContext.CellHasChildren, notebookOutline_1.NotebookOutlineContext.CellHasHeader, notebookOutline_1.NotebookOutlineContext.CellFoldingState.isEqualTo(1 /* CellFoldingState.Expanded */))
                    }
                ]
            });
        }
        async run(_accessor, context) {
            if (!checkSectionContext(context)) {
                return;
            }
            this.toggleFoldRange(context.outlineEntry, context.notebookEditor);
        }
        toggleFoldRange(entry, notebookEditor) {
            const foldingController = notebookEditor.getContribution(foldingController_1.FoldingController.id);
            const index = entry.index;
            const headerLevel = entry.level;
            const newFoldingState = 2 /* CellFoldingState.Collapsed */;
            foldingController.setFoldingStateDown(index, newFoldingState, headerLevel);
        }
    }
    exports.NotebookFoldSection = NotebookFoldSection;
    class NotebookExpandSection extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.section.expandSection',
                title: {
                    ...(0, nls_1.localize2)('expandSection', "Expand Section"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miexpandSection', comment: ['&& denotes a mnemonic'] }, "&&Expand Section"),
                },
                shortTitle: (0, nls_1.localize)('expandSection', "Expand Section"),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookOutlineActionMenu,
                        group: 'notebookFolding',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.and(notebookOutline_1.NotebookOutlineContext.CellKind.isEqualTo(notebookCommon_1.CellKind.Markup), notebookOutline_1.NotebookOutlineContext.OutlineElementTarget.isEqualTo(1 /* OutlineTarget.OutlinePane */), notebookOutline_1.NotebookOutlineContext.CellHasChildren, notebookOutline_1.NotebookOutlineContext.CellHasHeader, notebookOutline_1.NotebookOutlineContext.CellFoldingState.isEqualTo(2 /* CellFoldingState.Collapsed */))
                    }
                ]
            });
        }
        async run(_accessor, context) {
            if (!checkSectionContext(context)) {
                return;
            }
            this.toggleFoldRange(context.outlineEntry, context.notebookEditor);
        }
        toggleFoldRange(entry, notebookEditor) {
            const foldingController = notebookEditor.getContribution(foldingController_1.FoldingController.id);
            const index = entry.index;
            const headerLevel = entry.level;
            const newFoldingState = 1 /* CellFoldingState.Expanded */;
            foldingController.setFoldingStateDown(index, newFoldingState, headerLevel);
        }
    }
    exports.NotebookExpandSection = NotebookExpandSection;
    /**
     * Take in context args and check if they exist
     *
     * @param context - Notebook Section Context containing a notebook editor and outline entry
     * @returns true if context is valid, false otherwise
     */
    function checkSectionContext(context) {
        return !!(context && context.notebookEditor && context.outlineEntry);
    }
    (0, actions_1.registerAction2)(NotebookRunSingleCellInSection);
    (0, actions_1.registerAction2)(NotebookRunCellsInSection);
    (0, actions_1.registerAction2)(NotebookFoldSection);
    (0, actions_1.registerAction2)(NotebookExpandSection);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdGlvbkFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyb2xsZXIvc2VjdGlvbkFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0JoRyxNQUFhLDhCQUErQixTQUFRLGlCQUFPO1FBQzFEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxnQ0FBZ0M7Z0JBQ3BDLEtBQUssRUFBRTtvQkFDTixHQUFHLElBQUEsZUFBUyxFQUFDLFNBQVMsRUFBRSxVQUFVLENBQUM7b0JBQ25DLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQztpQkFDL0Y7Z0JBQ0QsVUFBVSxFQUFFLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxVQUFVLENBQUM7Z0JBQzNDLElBQUksRUFBRSxLQUFLLENBQUMsV0FBVztnQkFDdkIsSUFBSSxFQUFFO29CQUNMO3dCQUNDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLHlCQUF5Qjt3QkFDcEMsS0FBSyxFQUFFLFFBQVE7d0JBQ2YsS0FBSyxFQUFFLENBQUM7d0JBQ1IsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUN2Qix3Q0FBc0IsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLHlCQUFRLENBQUMsSUFBSSxDQUFDLEVBQ3hELHdDQUFzQixDQUFDLG9CQUFvQixDQUFDLFNBQVMsbUNBQTJCLEVBQ2hGLHdDQUFzQixDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsRUFDbEQsd0NBQXNCLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxDQUNoRDtxQkFDRDtpQkFDRDthQUNE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