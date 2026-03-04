/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/platform/log/common/log", "vs/workbench/contrib/notebook/browser/contrib/clipboard/cellOutputClipboard", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, nls_1, actions_1, clipboardService_1, coreActions_1, notebookContextKeys_1, icons, log_1, cellOutputClipboard_1, editorService_1, notebookBrowser_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COPY_OUTPUT_COMMAND_ID = void 0;
    exports.COPY_OUTPUT_COMMAND_ID = 'notebook.cellOutput.copy';
    (0, actions_1.registerAction2)(class CopyCellOutputAction extends actions_1.Action2 {
        constructor() {
            super({
                id: exports.COPY_OUTPUT_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.copyOutput', "Copy Cell Output"),
                menu: {
                    id: actions_1.MenuId.NotebookOutputToolbar,
                    when: notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS
                },
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                icon: icons.copyIcon,
            });
        }
        getNoteboookEditor(editorService, outputContext) {
            if (outputContext && 'notebookEditor' in outputContext) {
                return outputContext.notebookEditor;
            }
            return (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
        }
        async run(accessor, outputContext) {
            const notebookEditor = this.getNoteboookEditor(accessor.get(editorService_1.IEditorService), outputContext);
            if (!notebookEditor) {
                return;
            }
            let outputViewModel;
            if (outputContext && 'outputId' in outputContext && typeof outputContext.outputId === 'string') {
                outputViewModel = getOutputViewModelFromId(outputContext.outputId, notebookEditor);
            }
            else if (outputContext && 'outputViewModel' in outputContext) {
                outputViewModel = outputContext.outputViewModel;
            }
            if (!outputViewModel) {
                // not able to find the output from the provided context, use the active cell
                const activeCell = notebookEditor.getActiveCell();
                if (!activeCell) {
                    return;
                }
                if (activeCell.focusedOutputId !== undefined) {
                    outputViewModel = activeCell.outputsViewModels.find(output => {
                        return output.model.outputId === activeCell.focusedOutputId;
                    });
                }
                else {
                    outputViewModel = activeCell.outputsViewModels.find(output => output.pickedMimeType?.isTrusted);
                }
            }
            if (!outputViewModel) {
                return;
            }
            const mimeType = outputViewModel.pickedMimeType?.mimeType;
            if (mimeType?.startsWith('image/')) {
                const focusOptions = { skipReveal: true, outputId: outputViewModel.model.outputId, altOutputId: outputViewModel.model.alternativeOutputId };
                await notebookEditor.focusNotebookCell(outputViewModel.cellViewModel, 'output', focusOptions);
                notebookEditor.copyOutputImage(outputViewModel);
            }
            else {
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const logService = accessor.get(log_1.ILogService);
                (0, cellOutputClipboard_1.copyCellOutput)(mimeType, outputViewModel, clipboardService, logService);
            }
        }
    });
    function getOutputViewModelFromId(outputId, notebookEditor) {
        const notebookViewModel = notebookEditor.getViewModel();
        if (notebookViewModel) {
            const codeCells = notebookViewModel.viewCells.filter(cell => cell.cellKind === notebookCommon_1.CellKind.Code);
            for (const cell of codeCells) {
                const output = cell.outputsViewModels.find(output => output.model.outputId === outputId);
                if (output) {
                    return output;
                }
            }
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbE91dHB1dEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyb2xsZXIvY2VsbE91dHB1dEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JuRixRQUFBLHNCQUFzQixHQUFHLDBCQUEwQixDQUFDO0lBRWpFLElBQUEseUJBQWUsRUFBQyxNQUFNLG9CQUFxQixTQUFRLGlCQUFPO1FBQ3pEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw4QkFBc0I7Z0JBQzFCLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSxrQkFBa0IsQ0FBQztnQkFDakUsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLHFCQUFxQjtvQkFDaEMsSUFBSSxFQUFFLCtDQUF5QjtpQkFDL0I7Z0JBQ0QsUUFBUSxFQUFFLHVDQUF5QjtnQkFDbkMsSUFBSSxFQUFFLEtBQUssQ0FBQyxRQUFRO2FBQ3BCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxhQUE2QixFQUFFLGFBQW1HO1lBQzVKLElBQUksYUFBYSxJQUFJLGdCQUFnQixJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUN4RCxPQUFPLGFBQWEsQ0FBQyxjQUFjLENBQUM7WUFDckMsQ0FBQztZQUNELE9BQU8sSUFBQSxpREFBK0IsRUFBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLGFBQW1HO1lBQ3hJLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsRUFBRSxh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