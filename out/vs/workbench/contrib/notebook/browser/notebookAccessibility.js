/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/notebook/browser/notebookBrowser"], function (require, exports, nls_1, strings_1, keybinding_1, accessibleView_1, notebookBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAccessibilityHelpText = getAccessibilityHelpText;
    exports.runAccessibilityHelpAction = runAccessibilityHelpAction;
    exports.showAccessibleOutput = showAccessibleOutput;
    function getAccessibilityHelpText(accessor) {
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const content = [];
        content.push((0, nls_1.localize)('notebook.overview', 'The notebook view is a collection of code and markdown cells. Code cells can be executed and will produce output directly below the cell.'));
        content.push(descriptionForCommand('notebook.cell.edit', (0, nls_1.localize)('notebook.cell.edit', 'The Edit Cell command ({0}) will focus on the cell input.'), (0, nls_1.localize)('notebook.cell.editNoKb', 'The Edit Cell command will focus on the cell input and is currently not triggerable by a keybinding.'), keybindingService));
        content.push(descriptionForCommand('notebook.cell.quitEdit', (0, nls_1.localize)('notebook.cell.quitEdit', 'The Quit Edit command ({0}) will set focus on the cell container. The default (Escape) key may need to be pressed twice first exit the virtual cursor if active.'), (0, nls_1.localize)('notebook.cell.quitEditNoKb', 'The Quit Edit command will set focus on the cell container and is currently not triggerable by a keybinding.'), keybindingService));
        content.push(descriptionForCommand('notebook.cell.focusInOutput', (0, nls_1.localize)('notebook.cell.focusInOutput', 'The Focus Output command ({0}) will set focus in the cell\'s output.'), (0, nls_1.localize)('notebook.cell.focusInOutputNoKb', 'The Quit Edit command will set focus in the cell\'s output and is currently not triggerable by a keybinding.'), keybindingService));
        content.push(descriptionForCommand('notebook.focusNextEditor', (0, nls_1.localize)('notebook.focusNextEditor', 'The Focus Next Cell Editor command ({0}) will set focus in the next cell\'s editor.'), (0, nls_1.localize)('notebook.focusNextEditorNoKb', 'The Focus Next Cell Editor command will set focus in the next cell\'s editor and is currently not triggerable by a keybinding.'), keybindingService));
        content.push(descriptionForCommand('notebook.focusPreviousEditor', (0, nls_1.localize)('notebook.focusPreviousEditor', 'The Focus Previous Cell Editor command ({0}) will set focus in the previous cell\'s editor.'), (0, nls_1.localize)('notebook.focusPreviousEditorNoKb', 'The Focus Previous Cell Editor command will set focus in the previous cell\'s editor and is currently not triggerable by a keybinding.'), keybindingService));
        content.push((0, nls_1.localize)('notebook.cellNavigation', 'The up and down arrows will also move focus between cells while focused on the outer cell container.'));
        content.push(descriptionForCommand('notebook.cell.executeAndFocusContainer', (0, nls_1.localize)('notebook.cell.executeAndFocusContainer', 'The Execute Cell command ({0}) executes the cell that currently has focus.'), (0, nls_1.localize)('notebook.cell.executeAndFocusContainerNoKb', 'The Execute Cell command executes the cell that currently has focus and is currently not triggerable by a keybinding.'), keybindingService));
        content.push((0, nls_1.localize)('notebook.cell.insertCodeCellBelowAndFocusContainer', 'The Insert Cell Above/Below commands will create new empty code cells'));
        content.push((0, nls_1.localize)('notebook.changeCellType', 'The Change Cell to Code/Markdown commands are used to switch between cell types.'));
        return content.join('\n\n');
    }
    function descriptionForCommand(commandId, msg, noKbMsg, keybindingService) {
        const kb = keybindingService.lookupKeybinding(commandId);
        if (kb) {
            return (0, strings_1.format)(msg, kb.getAriaLabel());
        }
        return (0, strings_1.format)(noKbMsg, commandId);
    }
    async function runAccessibilityHelpAction(accessor, editor) {
        const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
        const helpText = getAccessibilityHelpText(accessor);
        accessibleViewService.show({
            id: "notebook" /* AccessibleViewProviderId.Notebook */,
            verbositySettingKey: "accessibility.verbosity.notebook" /* AccessibilityVerbositySettingId.Notebook */,
            provideContent: () => helpText,
            onClose: () => {
                editor.focus();
            },
            options: { type: "help" /* AccessibleViewType.Help */ }
        });
    }
    function showAccessibleOutput(accessibleViewService, editorService) {
        const activePane = editorService.activeEditorPane;
        const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(activePane);
        const notebookViewModel = notebookEditor?.getViewModel();
        const selections = notebookViewModel?.getSelections();
        const notebookDocument = notebookViewModel?.notebookDocument;
        if (!selections || !notebookDocument || !notebookEditor?.textModel) {
            return false;
        }
        const viewCell = notebookViewModel.viewCells[selections[0].start];
        let outputContent = '';
        const decoder = new TextDecoder();
        for (let i = 0; i < viewCell.outputsViewModels.length; i++) {
            const outputViewModel = viewCell.outputsViewModels[i];
            const outputTextModel = viewCell.model.outputs[i];
            const [mimeTypes, pick] = outputViewModel.resolveMimeTypes(notebookEditor.textModel, undefined);
            const mimeType = mimeTypes[pick].mimeType;
            let buffer = outputTextModel.outputs.find(output => output.mime === mimeType);
            if (!buffer || mimeType.startsWith('image')) {
                buffer = outputTextModel.outputs.find(output => !output.mime.startsWith('image'));
            }
            let text = `${mimeType}`; // default in case we can't get the text value for some reason.
            if (buffer) {
                const charLimit = 100_000;
                text = decoder.decode(buffer.data.slice(0, charLimit).buffer);
                if (buffer.data.byteLength > charLimit) {
                    text = text + '...(truncated)';
                }
                if (mimeType.endsWith('error')) {
                    text = text.replace(/\\u001b\[[0-9;]*m/gi, '').replaceAll('\\n', '\n');
                }
            }
            const index = viewCell.outputsViewModels.length > 1
                ? `Cell output ${i + 1} of ${viewCell.outputsViewModels.length}\n`
                : '';
            outputContent = outputContent.concat(`${index}${text}\n`);
        }
        if (!outputContent) {
            return false;
        }
        accessibleViewService.show({
            id: "notebook" /* AccessibleViewProviderId.Notebook */,
            verbositySettingKey: "accessibility.verbosity.notebook" /* AccessibilityVerbositySettingId.Notebook */,
            provideContent() { return outputContent; },
            onClose() {
                notebookEditor?.setFocus(selections[0]);
                activePane?.focus();
            },
            options: { type: "view" /* AccessibleViewType.View */ }
        });
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tBY2Nlc3NpYmlsaXR5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9ub3RlYm9va0FjY2Vzc2liaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsNERBNEJDO0lBVUQsZ0VBWUM7SUFFRCxvREE0REM7SUFoSEQsU0FBZ0Isd0JBQXdCLENBQUMsUUFBMEI7UUFDbEUsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7UUFDM0QsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ25CLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsMklBQTJJLENBQUMsQ0FBQyxDQUFDO1FBQ3pMLE9BQU8sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsb0JBQW9CLEVBQ3RELElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLDJEQUEyRCxDQUFDLEVBQzNGLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLHNHQUFzRyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQ2pLLE9BQU8sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLEVBQzFELElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLGtLQUFrSyxDQUFDLEVBQ3RNLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLDhHQUE4RyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQzdLLE9BQU8sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsNkJBQTZCLEVBQy9ELElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLHNFQUFzRSxDQUFDLEVBQy9HLElBQUEsY0FB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