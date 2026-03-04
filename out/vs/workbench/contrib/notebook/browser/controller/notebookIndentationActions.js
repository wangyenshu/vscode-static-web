/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls, lifecycle_1, bulkEditService_1, range_1, resolverService_1, actions_1, configuration_1, log_1, quickInput_1, notebookEditorService_1, notebookCommon_1, notebookEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookIndentationToTabsAction = exports.NotebookIndentationToSpacesAction = exports.NotebookChangeTabDisplaySize = exports.NotebookIndentUsingSpaces = exports.NotebookIndentUsingTabs = void 0;
    class NotebookIndentUsingTabs extends actions_1.Action2 {
        static { this.ID = 'notebook.action.indentUsingTabs'; }
        constructor() {
            super({
                id: NotebookIndentUsingTabs.ID,
                title: nls.localize('indentUsingTabs', "Indent Using Tabs"),
                precondition: undefined,
            });
        }
        run(accessor, ...args) {
            changeNotebookIndentation(accessor, false, false);
        }
    }
    exports.NotebookIndentUsingTabs = NotebookIndentUsingTabs;
    class NotebookIndentUsingSpaces extends actions_1.Action2 {
        static { this.ID = 'notebook.action.indentUsingSpaces'; }
        constructor() {
            super({
                id: NotebookIndentUsingSpaces.ID,
                title: nls.localize('indentUsingSpaces', "Indent Using Spaces"),
                precondition: undefined,
            });
        }
        run(accessor, ...args) {
            changeNotebookIndentation(accessor, true, false);
        }
    }
    exports.NotebookIndentUsingSpaces = NotebookIndentUsingSpaces;
    class NotebookChangeTabDisplaySize extends actions_1.Action2 {
        static { this.ID = 'notebook.action.changeTabDisplaySize'; }
        constructor() {
            super({
                id: NotebookChangeTabDisplaySize.ID,
                title: nls.localize('changeTabDisplaySize', "Change Tab Display Size"),
                precondition: undefined,
            });
        }
        run(accessor, ...args) {
            changeNotebookIndentation(accessor, true, true);
        }
    }
    exports.NotebookChangeTabDisplaySize = NotebookChangeTabDisplaySize;
    class NotebookIndentationToSpacesAction extends actions_1.Action2 {
        static { this.ID = 'notebook.action.convertIndentationToSpaces'; }
        constructor() {
            super({
                id: NotebookIndentationToSpacesAction.ID,
                title: nls.localize('convertIndentationToSpaces', "Convert Indentation to Spaces"),
                precondition: undefined,
            });
        }
        run(accessor, ...args) {
            convertNotebookIndentation(accessor, true);
        }
    }
    exports.NotebookIndentationToSpacesAction = NotebookIndentationToSpacesAction;
    class NotebookIndentationToTabsAction extends actions_1.Action2 {
        static { this.ID = 'notebook.action.convertIndentationToTabs'; }
        constructor() {
            super({
                id: NotebookIndentationToTabsAction.ID,
                title: nls.localize('convertIndentationToTabs', "Convert Indentation to Tabs"),
                precondition: undefined,
            });
        }
        run(accessor, ...args) {
            convertNotebookIndentation(accessor, false);
        }
    }
    exports.NotebookIndentationToTabsAction = NotebookIndentationToTabsAction;
    function changeNotebookIndentation(accessor, insertSpaces, displaySizeOnly) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const notebookEditorService = accessor.get(notebookEditorService_1.INotebookEditorService);
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        // keep this check here to pop on non-notebook actions
        const activeInput = editorService.activeEditorPane?.input;
        const isNotebook = (0, notebookEditorInput_1.isNotebookEditorInput)(activeInput);
        if (!isNotebook) {
            return;
        }
        // get notebook editor to access all codeEditors
        const notebookEditor = notebookEditorService.retrieveExistingWidgetFromURI(activeInput.resource)?.value;
        if (!notebookEditor) {
            return;
        }
        const picks = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
            id: n.toString(),
            label: n.toString(),
        }));
        // store the initial values of the configuration
        const initialConfig = configurationService.getValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
        const initialInsertSpaces = initialConfig['editor.insertSpaces'];
        // remove the initial values from the configuration
        delete initialConfig['editor.indentSize'];
        delete initialConfig['editor.tabSize'];
        delete initialConfig['editor.insertSpaces'];
        setTimeout(() => {
            quickInputService.pick(picks, { placeHolder: nls.localize({ key: 'selectTabWidth', comment: ['Tab corresponds to the tab key'] }, "Select Tab Size for Current File") }).then(pick => {
                if (pick) {
                    const pickedVal = parseInt(pick.label, 10);
                    if (displaySizeOnly) {
                        configurationService.updateValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations, {
                            ...initialConfig,
                            'editor.tabSize': pickedVal,
                            'editor.indentSize': pickedVal,
                            'editor.insertSpaces': initialInsertSpaces
                        });
                    }
                    else {
                        configurationService.updateValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations, {
                            ...initialConfig,
                            'editor.tabSize': pickedVal,
                            'editor.indentSize': pickedVal,
                            'editor.insertSpaces': insertSpaces
                        });
                    }
                }
            });
        }, 50 /* quick input is sensitive to being opened so soon after another */);
    }
    function convertNotebookIndentation(accessor, tabsToSpaces) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const logService = accessor.get(log_1.ILogService);
        const textModelService = accessor.get(resolverService_1.ITextModelService);
        const notebookEditorService = accessor.get(notebookEditorService_1.INotebookEditorService);
        const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
        // keep this check here to pop on non-notebook
        const activeInput = editorService.activeEditorPane?.input;
        const isNotebook = (0, notebookEditorInput_1.isNotebookEditorInput)(activeInput);
        if (!isNotebook) {
            return;
        }
        // get notebook editor to access all codeEditors
        const notebookTextModel = notebookEditorService.retrieveExistingWidgetFromURI(activeInput.resource)?.value?.textModel;
        if (!notebookTextModel) {
            return;
        }
        const disposable = new lifecycle_1.DisposableStore();
        try {
            Promise.all(notebookTextModel.cells.map(async (cell) => {
                const ref = await textModelService.createModelReference(cell.uri);
                disposable.add(ref);
                const textEditorModel = ref.object.textEditorModel;
                const modelOpts = cell.textModel?.getOptions();
                if (!modelOpts) {
                    return;
                }
                const edits = getIndentationEditOperations(textEditorModel, modelOpts.tabSize, tabsToSpaces);
                bulkEditService.apply(edits, { label: nls.localize('convertIndentation', "Convert Indentation"), code: 'undoredo.convertIndentation', });
            })).then(() => {
                // store the initial values of the configuration
                const initialConfig = configurationService.getValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
                const initialIndentSize = initialConfig['editor.indentSize'];
                const initialTabSize = initialConfig['editor.tabSize'];
                // remove the initial values from the configuration
                delete initialConfig['editor.indentSize'];
                delete initialConfig['editor.tabSize'];
                delete initialConfig['editor.insertSpaces'];
                configurationService.updateValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations, {
                    ...initialConfig,
                    'editor.tabSize': initialTabSize,
                    'editor.indentSize': initialIndentSize,
                    'editor.insertSpaces': tabsToSpaces
                });
                disposable.dispose();
            });
        }
        catch {
            logService.error('Failed to convert indentation to spaces for notebook cells.');
        }
    }
    function getIndentationEditOperations(model, tabSize, tabsToSpaces) {
        if (model.getLineCount() === 1 && model.getLineMaxColumn(1) === 1) {
            // Model is empty
            return [];
        }
        let spaces = '';
        for (let i = 0; i < tabSize; i++) {
            spaces += ' ';
        }
        const spacesRegExp = new RegExp(spaces, 'gi');
        const edits = [];
        for (let lineNumber = 1, lineCount = model.getLineCount(); lineNumber <= lineCount; lineNumber++) {
            let lastIndentationColumn = model.getLineFirstNonWhitespaceColumn(lineNumber);
            if (lastIndentationColumn === 0) {
                lastIndentationColumn = model.getLineMaxColumn(lineNumber);
            }
            if (lastIndentationColumn === 1) {
                continue;
            }
            const originalIndentationRange = new range_1.Range(lineNumber, 1, lineNumber, lastIndentationColumn);
            const originalIndentation = model.getValueInRange(originalIndentationRange);
            const newIndentation = (tabsToSpaces
                ? originalIndentation.replace(/\t/ig, spaces)
                : originalIndentation.replace(spacesRegExp, '\t'));
            edits.push(new bulkEditService_1.ResourceTextEdit(model.uri, { range: originalIndentationRange, text: newIndentation }));
        }
        return edits;
    }
    (0, actions_1.registerAction2)(NotebookIndentUsingSpaces);
    (0, actions_1.registerAction2)(NotebookIndentUsingTabs);
    (0, actions_1.registerAction2)(NotebookChangeTabDisplaySize);
    (0, actions_1.registerAction2)(NotebookIndentationToSpacesAction);
    (0, actions_1.registerAction2)(NotebookIndentationToTabsAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tJbmRlbnRhdGlvbkFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyb2xsZXIvbm90ZWJvb2tJbmRlbnRhdGlvbkFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxNQUFhLHVCQUF3QixTQUFRLGlCQUFPO2lCQUM1QixPQUFFLEdBQUcsaUNBQWlDLENBQUM7UUFFOUQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHVCQUF1QixDQUFDLEVBQUU7Z0JBQzlCLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLG1CQUFtQixDQUFDO2dCQUMzRCxZQUFZLEVBQUUsU0FBUzthQUN2QixDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO1lBQ3RELHlCQUF5QixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkQsQ0FBQzs7SUFiRiwwREFjQztJQUVELE1BQWEseUJBQTBCLFNBQVEsaUJBQU87aUJBQzlCLE9BQUUsR0FBRyxtQ0FBbUMsQ0FBQztRQUVoRTtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUseUJBQXlCLENBQUMsRUFBRTtnQkFDaEMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUUscUJBQXFCLENBQUM7Z0JBQy9ELFlBQVksRUFBRSxTQUFTO2FBQ3ZCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7WUFDdEQseUJBQXlCLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMs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