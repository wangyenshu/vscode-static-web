/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/mime", "vs/base/common/uri", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/language", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/controller/notebookIndentationActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/workbench/contrib/notebook/browser/notebookIcons"], function (require, exports, mime_1, uri_1, editorContextKeys_1, language_1, getIconClasses_1, model_1, nls_1, actions_1, configuration_1, contextkey_1, contextkeys_1, dialogs_1, instantiation_1, notification_1, quickInput_1, inlineChatController_1, inlineChat_1, cellOperations_1, coreActions_1, notebookIndentationActions_1, notebookBrowser_1, notebookCommon_1, notebookContextKeys_1, notebookExecutionStateService_1, notebookKernelService_1, editorService_1, languageDetectionWorkerService_1, icons) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SELECT_NOTEBOOK_INDENTATION_ID = exports.CLEAR_CELL_OUTPUTS_COMMAND_ID = void 0;
    const CLEAR_ALL_CELLS_OUTPUTS_COMMAND_ID = 'notebook.clearAllCellsOutputs';
    const EDIT_CELL_COMMAND_ID = 'notebook.cell.edit';
    const DELETE_CELL_COMMAND_ID = 'notebook.cell.delete';
    exports.CLEAR_CELL_OUTPUTS_COMMAND_ID = 'notebook.cell.clearOutputs';
    exports.SELECT_NOTEBOOK_INDENTATION_ID = 'notebook.selectIndentation';
    (0, actions_1.registerAction2)(class EditCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: EDIT_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.editCell', "Edit Cell"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), editorContextKeys_1.EditorContextKeys.hoverFocused.toNegated(), notebookContextKeys_1.NOTEBOOK_OUTPUT_INPUT_FOCUSED.toNegated()),
                    primary: 3 /* KeyCode.Enter */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup'), notebookContextKeys_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE.toNegated(), notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    order: 0 /* CellToolbarOrder.EditCell */,
                    group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                },
                icon: icons.editIcon,
            });
        }
        async runWithContext(accessor, context) {
            if (!context.notebookEditor.hasModel() || context.notebookEditor.isReadOnly) {
                return;
            }
            await context.notebookEditor.focusNotebookCell(context.cell, 'editor');
            const foundEditor = context.cell ? (0, coreActions_1.findTargetCellEditor)(context, context.cell) : undefined;
            if (foundEditor && foundEditor.hasTextFocus() && inlineChatController_1.InlineChatController.get(foundEditor)?.getWidgetPosition()?.lineNumber === foundEditor.getPosition()?.lineNumber) {
                inlineChatController_1.InlineChatController.get(foundEditor)?.focus();
            }
        }
    });
    const quitEditCondition = contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext, inlineChat_1.CTX_INLINE_CHAT_FOCUSED.toNegated());
    (0, actions_1.registerAction2)(class QuitEditCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.QUIT_EDIT_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.quitEdit', "Stop Editing Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup'), notebookContextKeys_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    order: 3 /* CellToolbarOrder.SaveCell */,
                    group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                },
                icon: icons.stopEditIcon,
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(quitEditCondition, editorContextKeys_1.EditorContextKeys.hoverVisible.toNegated(), editorContextKeys_1.EditorContextKeys.hasNonEmptySelection.toNegated(), editorContextKeys_1.EditorContextKeys.hasMultipleSelections.toNegated()),
                        primary: 9 /* KeyCode.Escape */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT - 5
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED),
                        primary: 9 /* KeyCode.Escape */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 5
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(quitEditCondition, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                        primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */,
                        win: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */
                        },
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT - 5
                    },
                ]
            });
        }
        async runWithContext(accessor, context) {
            if (context.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                context.cell.updateEditState(notebookBrowser_1.CellEditState.Preview, notebookBrowser_1.QUIT_EDIT_CELL_COMMAND_ID);
            }
            await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
        }
    });
    (0, actions_1.registerAction2)(class DeleteCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: DELETE_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.deleteCell', "Delete Cell"),
                keybinding: {
                    primary: 20 /* KeyCode.Delete */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */
                    },
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookContextKeys_1.NOTEBOOK_OUTPUT_INPUT_FOCUSED.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellDelete,
                        when: notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE,
                        group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                    },
                    {
                        id: actions_1.MenuId.InteractiveCellDelete,
                        group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                    }
                ],
                icon: icons.deleteCellIcon
            });
        }
        async runWithContext(accessor, context) {
            if (!context.notebookEditor.hasModel()) {
                return;
            }
            let confirmation;
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const runState = notebookExecutionStateService.getCellExecution(context.cell.uri)?.state;
            const configService = accessor.get(configuration_1.IConfigurationService);
            if (runState === notebookCommon_1.NotebookCellExecutionState.Executing && configService.getValue(notebookCommon_1.NotebookSetting.confirmDeleteRunningCell)) {
                const dialogService = accessor.get(dialogs_1.IDialogService);
                const primaryButton = (0, nls_1.localize)('confirmDeleteButton', "Delete");
                confirmation = await dialogService.confirm({
                    type: 'question',
                    message: (0, nls_1.localize)('confirmDeleteButtonMessage', "This cell is running, are you sure you want to delete it?"),
                    primaryButton: primaryButton,
                    checkbox: {
                        label: (0, nls_1.localize)('doNotAskAgain', "Do not ask me again")
                    }
                });
            }
            else {
                confirmation = { confirmed: true };
            }
            if (!confirmation.confirmed) {
                return;
            }
            if (confirmation.checkboxChecked === true) {
                await configService.updateValue(notebookCommon_1.NotebookSetting.confirmDeleteRunningCell, false);
            }
            (0, cellOperations_1.runDeleteAction)(context.notebookEditor, context.cell);
        }
    });
    (0, actions_1.registerAction2)(class ClearCellOutputsAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: exports.CLEAR_CELL_OUTPUTS_COMMAND_ID,
                title: (0, nls_1.localize)('clearCellOutputs', 'Clear Cell Outputs'),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('code'), coreActions_1.executeNotebookCondition, notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE, notebookContextKeys_1.NOTEBOOK_USE_CONSOLIDATED_OUTPUT_BUTTON.toNegated()),
                        order: 5 /* CellToolbarOrder.ClearCellOutput */,
                        group: coreActions_1.CELL_TITLE_OUTPUT_GROUP_ID
                    },
                    {
                        id: actions_1.MenuId.NotebookOutputToolbar,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE)
                    },
                ],
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    primary: 512 /* KeyMod.Alt */ | 20 /* KeyCode.Delete */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                icon: icons.clearIcon
            });
        }
        async runWithContext(accessor, context) {
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const editor = context.notebookEditor;
            if (!editor.hasModel() || !editor.textModel.length) {
                return;
            }
            const cell = context.cell;
            const index = editor.textModel.cells.indexOf(cell.model);
            if (index < 0) {
                return;
            }
            const computeUndoRedo = !editor.isReadOnly;
            editor.textModel.applyEdits([{ editType: 2 /* CellEditType.Output */, index, outputs: [] }], true, undefined, () => undefined, undefined, computeUndoRedo);
            const runState = notebookExecutionStateService.getCellExecution(context.cell.uri)?.state;
            if (runState !== notebookCommon_1.NotebookCellExecutionState.Executing) {
                context.notebookEditor.textModel.applyEdits([{
                        editType: 9 /* CellEditType.PartialInternalMetadata */, index, internalMetadata: {
                            runStartTime: null,
                            runStartTimeAdjustment: null,
                            runEndTime: null,
                            executionOrder: null,
                            lastRunSuccess: null
                        }
                    }], true, undefined, () => undefined, undefined, computeUndoRedo);
            }
        }
    });
    (0, actions_1.registerAction2)(class ClearAllCellOutputsAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: CLEAR_ALL_CELLS_OUTPUTS_COMMAND_ID,
                title: (0, nls_1.localize)('clearAllCellsOutputs', 'Clear All Outputs'),
                precondition: notebookContextKeys_1.NOTEBOOK_HAS_OUTPUTS,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true)),
                        group: 'navigation',
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        when: contextkey_1.ContextKeyExpr.and(coreActions_1.executeNotebookCondition, contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)),
                        group: 'navigation/execute',
                        order: 10
                    }
                ],
                icon: icons.clearIcon
            });
        }
        async runWithContext(accessor, context) {
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const editor = context.notebookEditor;
            if (!editor.hasModel() || !editor.textModel.length) {
                return;
            }
            const computeUndoRedo = !editor.isReadOnly;
            editor.textModel.applyEdits(editor.textModel.cells.map((cell, index) => ({
                editType: 2 /* CellEditType.Output */, index, outputs: []
            })), true, undefined, () => undefined, undefined, computeUndoRedo);
            const clearExecutionMetadataEdits = editor.textModel.cells.map((cell, index) => {
                const runState = notebookExecutionStateService.getCellExecution(cell.uri)?.state;
                if (runState !== notebookCommon_1.NotebookCellExecutionState.Executing) {
                    return {
                        editType: 9 /* CellEditType.PartialInternalMetadata */, index, internalMetadata: {
                            runStartTime: null,
                            runStartTimeAdjustment: null,
                            runEndTime: null,
                            executionOrder: null,
                            lastRunSuccess: null
                        }
                    };
                }
                else {
                    return undefined;
                }
            }).filter(edit => !!edit);
            if (clearExecutionMetadataEdits.length) {
                context.notebookEditor.textModel.applyEdits(clearExecutionMetadataEdits, true, undefined, () => undefined, undefined, computeUndoRedo);
            }
        }
    });
    (0, actions_1.registerAction2)(class ChangeCellLanguageAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.CHANGE_CELL_LANGUAGE,
                title: (0, nls_1.localize)('changeLanguage', 'Change Cell Language'),
                metadata: {
                    description: (0, nls_1.localize)('changeLanguage', 'Change Cell Language'),
                    args: [
                        {
                            name: 'range',
                            description: 'The cell range',
                            schema: {
                                'type': 'object',
                                'required': ['start', 'end'],
                                'properties': {
                                    'start': {
                                        'type': 'number'
                                    },
                                    'end': {
                                        'type': 'number'
                                    }
                                }
                            }
                        },
                        {
                            name: 'language',
                            description: 'The target cell language',
                            schema: {
                                'type': 'string'
                            }
                        }
                    ]
                }
            });
        }
        getCellContextFromArgs(accessor, context, ...additionalArgs) {
            if (!context || typeof context.start !== 'number' || typeof context.end !== 'number' || context.start >= context.end) {
                return;
            }
            const language = additionalArgs.length && typeof additionalArgs[0] === 'string' ? additionalArgs[0] : undefined;
            const activeEditorContext = this.getEditorContextFromArgsOrActive(accessor);
            if (!activeEditorContext || !activeEditorContext.notebookEditor.hasModel() || context.start >= activeEditorContext.notebookEditor.getLength()) {
                return;
            }
            // TODO@rebornix, support multiple cells
            return {
                notebookEditor: activeEditorContext.notebookEditor,
                cell: activeEditorContext.notebookEditor.cellAt(context.start),
                language
            };
        }
        async runWithContext(accessor, context) {
            if (context.language) {
                await this.setLanguage(context, context.language);
            }
            else {
                await this.showLanguagePicker(accessor, context);
            }
        }
        async showLanguagePicker(accessor, context) {
            const topItems = [];
            const mainItems = [];
            const languageService = accessor.get(language_1.ILanguageService);
            const modelService = accessor.get(model_1.IModelService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const languageDetectionService = accessor.get(languageDetectionWorkerService_1.ILanguageDetectionService);
            const kernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            let languages = context.notebookEditor.activeKernel?.supportedLanguages;
            if (!languages) {
                const matchResult = kernelService.getMatchingKernel(context.notebookEditor.textModel);
                const allSupportedLanguages = matchResult.all.flatMap(kernel => kernel.supportedLanguages);
                languages = allSupportedLanguages.length > 0 ? allSupportedLanguages : languageService.getRegisteredLanguageIds();
            }
            const providerLanguages = new Set([
                ...languages,
                'markdown'
            ]);
            providerLanguages.forEach(languageId => {
                let description;
                if (context.cell.cellKind === notebookCommon_1.CellKind.Markup ? (languageId === 'markdown') : (languageId === context.cell.language)) {
                    description = (0, nls_1.localize)('languageDescription', "({0}) - Current Language", languageId);
                }
                else {
                    description = (0, nls_1.localize)('languageDescriptionConfigured', "({0})", languageId);
                }
                const languageName = languageService.getLanguageName(languageId);
                if (!languageName) {
                    // Notebook has unrecognized language
                    return;
                }
                const item = {
                    label: languageName,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, this.getFakeResource(languageName, languageService)),
                    description,
                    languageId
                };
                if (languageId === 'markdown' || languageId === context.cell.language) {
                    topItems.push(item);
                }
                else {
                    mainItems.push(item);
                }
            });
            mainItems.sort((a, b) => {
                return a.description.localeCompare(b.description);
            });
            // Offer to "Auto Detect"
            const autoDetectMode = {
                label: (0, nls_1.localize)('autoDetect', "Auto Detect")
            };
            const picks = [
                autoDetectMode,
                { type: 'separator', label: (0, nls_1.localize)('languagesPicks', "languages (identifier)") },
                ...topItems,
                { type: 'separator' },
                ...mainItems
            ];
            const selection = await quickInputService.pick(picks, { placeHolder: (0, nls_1.localize)('pickLanguageToConfigure', "Select Language Mode") });
            const languageId = selection === autoDetectMode
                ? await languageDetectionService.detectLanguage(context.cell.uri)
                : selection?.languageId;
            if (languageId) {
                await this.setLanguage(context, languageId);
            }
        }
        async setLanguage(context, languageId) {
            await setCellToLanguage(languageId, context);
        }
        /**
         * Copied from editorStatus.ts
         */
        getFakeResource(lang, languageService) {
            let fakeResource;
            const languageId = languageService.getLanguageIdByLanguageName(lang);
            if (languageId) {
                const extensions = languageService.getExtensions(languageId);
                if (extensions.length) {
                    fakeResource = uri_1.URI.file(extensions[0]);
                }
                else {
                    const filenames = languageService.getFilenames(languageId);
                    if (filenames.length) {
                        fakeResource = uri_1.URI.file(filenames[0]);
                    }
                }
            }
            return fakeResource;
        }
    });
    (0, actions_1.registerAction2)(class DetectCellLanguageAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.DETECT_CELL_LANGUAGE,
                title: (0, nls_1.localize2)('detectLanguage', "Accept Detected Language for Cell"),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                keybinding: { primary: 34 /* KeyCode.KeyD */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */, weight: 200 /* KeybindingWeight.WorkbenchContrib */ }
            });
        }
        async runWithContext(accessor, context) {
            const languageDetectionService = accessor.get(languageDetectionWorkerService_1.ILanguageDetectionService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const kernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            const kernel = kernelService.getSelectedOrSuggestedKernel(context.notebookEditor.textModel);
            const providerLanguages = [...kernel?.supportedLanguages ?? []];
            providerLanguages.push('markdown');
            const detection = await languageDetectionService.detectLanguage(context.cell.uri, providerLanguages);
            if (detection) {
                setCellToLanguage(detection, context);
            }
            else {
                notificationService.warn((0, nls_1.localize)('noDetection', "Unable to detect cell language"));
            }
        }
    });
    async function setCellToLanguage(languageId, context) {
        if (languageId === 'markdown' && context.cell?.language !== 'markdown') {
            const idx = context.notebookEditor.getCellIndex(context.cell);
            await (0, cellOperations_1.changeCellToKind)(notebookCommon_1.CellKind.Markup, { cell: context.cell, notebookEditor: context.notebookEditor, ui: true }, 'markdown', mime_1.Mimes.markdown);
            const newCell = context.notebookEditor.cellAt(idx);
            if (newCell) {
                await context.notebookEditor.focusNotebookCell(newCell, 'editor');
            }
        }
        else if (languageId !== 'markdown' && context.cell?.cellKind === notebookCommon_1.CellKind.Markup) {
            await (0, cellOperations_1.changeCellToKind)(notebookCommon_1.CellKind.Code, { cell: context.cell, notebookEditor: context.notebookEditor, ui: true }, languageId);
        }
        else {
            const index = context.notebookEditor.textModel.cells.indexOf(context.cell.model);
            context.notebookEditor.textModel.applyEdits([{ editType: 4 /* CellEditType.CellLanguage */, index, language: languageId }], true, undefined, () => undefined, undefined, !context.notebookEditor.isReadOnly);
        }
    }
    (0, actions_1.registerAction2)(class SelectNotebookIndentation extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: exports.SELECT_NOTEBOOK_INDENTATION_ID,
                title: (0, nls_1.localize2)('selectNotebookIndentation', 'Select Indentation'),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
            });
        }
        async runWithContext(accessor, context) {
            await this.showNotebookIndentationPicker(accessor, context);
        }
        async showNotebookIndentationPicker(accessor, context) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const activeNotebook = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!activeNotebook || activeNotebook.isDisposed) {
                return quickInputService.pick([{ label: (0, nls_1.localize)('noNotebookEditor', "No notebook editor active at this time") }]);
            }
            if (activeNotebook.isReadOnly) {
                return quickInputService.pick([{ label: (0, nls_1.localize)('noWritableCodeEditor', "The active notebook editor is read-only.") }]);
            }
            const picks = [
                new notebookIndentationActions_1.NotebookIndentUsingTabs(), // indent using tabs
                new notebookIndentationActions_1.NotebookIndentUsingSpaces(), // indent using spaces
                new notebookIndentationActions_1.NotebookChangeTabDisplaySize(), // change tab size
                new notebookIndentationActions_1.NotebookIndentationToTabsAction(), // convert indentation to tabs
                new notebookIndentationActions_1.NotebookIndentationToSpacesAction() // convert indentation to spaces
            ].map(item => {
                return {
                    id: item.desc.id,
                    label: item.desc.title.toString(),
                    run: () => {
                        instantiationService.invokeFunction(item.run);
                    }
                };
            });
            picks.splice(3, 0, { type: 'separator', label: (0, nls_1.localize)('indentConvert', "convert file") });
            picks.unshift({ type: 'separator', label: (0, nls_1.localize)('indentView', "change view") });
            const action = await quickInputService.pick(picks, { placeHolder: (0, nls_1.localize)('pickAction', "Select Action"), matchOnDetail: true });
            if (!action) {
                return;
            }
            action.run();
            context.notebookEditor.focus();
            return;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyb2xsZXIvZWRpdEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUNoRyxNQUFNLGtDQUFrQyxHQUFHLCtCQUErQixDQUFDO0lBQzNFLE1BQU0sb0JBQW9CLEdBQUcsb0JBQW9CLENBQUM7SUFDbEQsTUFBTSxzQkFBc0IsR0FBRyxzQkFBc0IsQ0FBQztJQUN6QyxRQUFBLDZCQUE2QixHQUFHLDRCQUE0QixDQUFDO0lBQzdELFFBQUEsOEJBQThCLEdBQUcsNEJBQTRCLENBQUM7SUFFM0UsSUFBQSx5QkFBZSxFQUFDLE1BQU0sY0FBZSxTQUFRLGdDQUFrQjtRQUM5RDtZQUNDLEtBQUssQ0FDSjtnQkFDQyxFQUFFLEVBQUUsb0JBQW9CO2dCQUN4QixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsV0FBVyxDQUFDO2dCQUN4RCxVQUFVLEVBQUU7b0JBQ1gsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUN2QixnREFBMEIsRUFDMUIsMkJBQWMsQ0FBQyxHQUFHLENBQUMsb0NBQXNCLENBQUMsRUFDMUMsOENBQXdCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUN4QyxxQ0FBaUIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLEVBQzFDLG1EQUE2QixDQUFDLFNBQVMsRUFBRSxDQUN6QztvQkFDRCxPQUFPLHVCQUFlO29CQUN0QixNQUFNLDZDQUFtQztpQkFDekM7Z0JBQ0QsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGlCQUFpQjtvQkFDNUIsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUN2Qiw4Q0FBd0Is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