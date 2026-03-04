/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/browser/services/bulkEditService", "vs/editor/common/commands/trimTrailingWhitespaceCommand", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/editorWorker", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/common/types", "vs/editor/contrib/format/browser/format", "vs/editor/contrib/snippet/browser/snippetController2", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorModel", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/workingCopy/common/workingCopyFileService"], function (require, exports, hierarchicalKind_1, lifecycle_1, resources_1, bulkEditService_1, trimTrailingWhitespaceCommand_1, position_1, range_1, editorWorker_1, languageFeatures_1, resolverService_1, codeAction_1, types_1, format_1, snippetController2_1, nls_1, configuration_1, instantiation_1, log_1, platform_1, workspaceTrust_1, contributions_1, notebookBrowser_1, notebookCommon_1, notebookEditorModel_1, editorService_1, workingCopyFileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveParticipantsContribution = void 0;
    let FormatOnSaveParticipant = class FormatOnSaveParticipant {
        constructor(editorWorkerService, languageFeaturesService, textModelService, bulkEditService, configurationService) {
            this.editorWorkerService = editorWorkerService;
            this.languageFeaturesService = languageFeaturesService;
            this.textModelService = textModelService;
            this.bulkEditService = bulkEditService;
            this.configurationService = configurationService;
        }
        async participate(workingCopy, context, progress, token) {
            if (!workingCopy.model || !(workingCopy.model instanceof notebookEditorModel_1.NotebookFileWorkingCopyModel)) {
                return;
            }
            if (context.reason === 2 /* SaveReason.AUTO */) {
                return undefined;
            }
            const enabled = this.configurationService.getValue(notebookCommon_1.NotebookSetting.formatOnSave);
            if (!enabled) {
                return undefined;
            }
            const notebook = workingCopy.model.notebookModel;
            progress.report({ message: (0, nls_1.localize)('notebookFormatSave.formatting', "Formatting") });
            const disposable = new lifecycle_1.DisposableStore();
            try {
                const allCellEdits = await Promise.all(notebook.cells.map(async (cell) => {
                    const ref = await this.textModelService.createModelReference(cell.uri);
                    disposable.add(ref);
                    const model = ref.object.textEditorModel;
                    const formatEdits = await (0, format_1.getDocumentFormattingEditsUntilResult)(this.editorWorkerService, this.languageFeaturesService, model, model.getOptions(), token);
                    const edits = [];
                    if (formatEdits) {
                        edits.push(...formatEdits.map(edit => new bulkEditService_1.ResourceTextEdit(model.uri, edit, model.getVersionId())));
                        return edits;
                    }
                    return [];
                }));
                await this.bulkEditService.apply(/* edit */ allCellEdits.flat(), { label: (0, nls_1.localize)('formatNotebook', "Format Notebook"), code: 'undoredo.formatNotebook', });
            }
            finally {
                progress.report({ increment: 100 });
                disposable.dispose();
            }
        }
    };
    FormatOnSaveParticipant = __decorate([
        __param(0, editorWorker_1.IEditorWorkerService),
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, bulkEditService_1.IBulkEditService),
        __param(4, configuration_1.IConfigurationService)
    ], FormatOnSaveParticipant);
    let TrimWhitespaceParticipant = class TrimWhitespaceParticipant {
        constructor(configurationService, editorService, textModelService, bulkEditService) {
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.textModelService = textModelService;
            this.bulkEditService = bulkEditService;
        }
        async participate(workingCopy, context, progress, _token) {
            const trimTrailingWhitespaceOption = this.configurationService.getValue('files.trimTrailingWhitespace');
            const trimInRegexAndStrings = this.configurationService.getValue('files.trimTrailingWhitespaceInRegexAndStrings');
            if (trimTrailingWhitespaceOption) {
                await this.doTrimTrailingWhitespace(workingCopy, context.reason === 2 /* SaveReason.AUTO */, trimInRegexAndStrings, progress);
            }
        }
        async doTrimTrailingWhitespace(workingCopy, isAutoSaved, trimInRegexesAndStrings, progress) {
            if (!workingCopy.model || !(workingCopy.model instanceof notebookEditorModel_1.NotebookFileWorkingCopyModel)) {
                return;
            }
            const disposable = new lifecycle_1.DisposableStore();
            const notebook = workingCopy.model.notebookModel;
            const activeCellEditor = getActiveCellCodeEditor(this.editorService);
            let cursors = [];
            let prevSelection = [];
            try {
                const allCellEdits = await Promise.all(notebook.cells.map(async (cell) => {
                    if (cell.cellKind !== notebookCommon_1.CellKind.Code) {
                        return [];
                    }
                    const ref = await this.textModelService.createModelReference(cell.uri);
                    disposable.add(ref);
                    const model = ref.object.textEditorModel;
                    const isActiveCell = (activeCellEditor && cell.uri.toString() === activeCellEditor.getModel()?.uri.toString());
                    if (isActiveCell) {
                        prevSelection = activeCellEditor.getSelections() ?? [];
                        if (isAutoSaved) {
                            cursors = prevSelection.map(s => s.getPosition()); // get initial cursor positions
                            const snippetsRange = snippetController2_1.SnippetController2.get(activeCellEditor)?.getSessionEnclosingRange();
                            if (snippetsRange) {
                                for (let lineNumber = snippetsRange.startLineNumber; lineNumber <= snippetsRange.endLineNumber; lineNumber++) {
                                    cursors.push(new position_1.Position(lineNumber, model.getLineMaxColumn(lineNumber)));
                                }
                            }
                        }
                    }
                    const ops = (0, trimTrailingWhitespaceCommand_1.trimTrailingWhitespace)(model, cursors, trimInRegexesAndStrings);
                    if (!ops.length) {
                        return []; // Nothing to do
                    }
                    return ops.map(op => new bulkEditService_1.ResourceTextEdit(model.uri, { ...op, text: op.text || '' }, model.getVersionId()));
                }));
                const filteredEdits = allCellEdits.flat().filter(edit => edit !== undefined);
                await this.bulkEditService.apply(filteredEdits, { label: (0, nls_1.localize)('trimNotebookWhitespace', "Notebook Trim Trailing Whitespace"), code: 'undoredo.notebookTrimTrailingWhitespace' });
            }
            finally {
                progress.report({ increment: 100 });
                disposable.dispose();
            }
        }
    };
    TrimWhitespaceParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, editorService_1.IEditorService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, bulkEditService_1.IBulkEditService)
    ], TrimWhitespaceParticipant);
    let TrimFinalNewLinesParticipant = class TrimFinalNewLinesParticipant {
        constructor(configurationService, editorService, bulkEditService) {
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.bulkEditService = bulkEditService;
        }
        async participate(workingCopy, context, progress, _token) {
            if (this.configurationService.getValue('files.trimFinalNewlines')) {
                await this.doTrimFinalNewLines(workingCopy, context.reason === 2 /* SaveReason.AUTO */, progress);
            }
        }
        /**
         * returns 0 if the entire file is empty
         */
        findLastNonEmptyLine(textBuffer) {
            for (let lineNumber = textBuffer.getLineCount(); lineNumber >= 1; lineNumber--) {
                const lineLength = textBuffer.getLineLength(lineNumber);
                if (lineLength) {
                    // this line has content
                    return lineNumber;
                }
            }
            // no line has content
            return 0;
        }
        async doTrimFinalNewLines(workingCopy, isAutoSaved, progress) {
            if (!workingCopy.model || !(workingCopy.model instanceof notebookEditorModel_1.NotebookFileWorkingCopyModel)) {
                return;
            }
            const disposable = new lifecycle_1.DisposableStore();
            const notebook = workingCopy.model.notebookModel;
            const activeCellEditor = getActiveCellCodeEditor(this.editorService);
            try {
                const allCellEdits = await Promise.all(notebook.cells.map(async (cell) => {
                    if (cell.cellKind !== notebookCommon_1.CellKind.Code) {
                        return;
                    }
                    // autosave -- don't trim every trailing line, just up to the cursor line
                    let cannotTouchLineNumber = 0;
                    const isActiveCell = (activeCellEditor && cell.uri.toString() === activeCellEditor.getModel()?.uri.toString());
                    if (isAutoSaved && isActiveCell) {
                        const selections = activeCellEditor.getSelections() ?? [];
                        for (const sel of selections) {
                            cannotTouchLineNumber = Math.max(cannotTouchLineNumber, sel.selectionStartLineNumber);
                        }
                    }
                    const textBuffer = cell.textBuffer;
                    const lastNonEmptyLine = this.findLastNonEmptyLine(textBuffer);
                    const deleteFromLineNumber = Math.max(lastNonEmptyLine + 1, cannotTouchLineNumber + 1);
                    if (deleteFromLineNumber > textBuffer.getLineCount()) {
                        return;
                    }
                    const deletionRange = new range_1.Range(deleteFromLineNumber, 1, textBuffer.getLineCount(), textBuffer.getLineLastNonWhitespaceColumn(textBuffer.getLineCount()));
                    if (deletionRange.isEmpty()) {
                        return;
                    }
                    // create the edit to delete all lines in deletionRange
                    return new bulkEditService_1.ResourceTextEdit(cell.uri, { range: deletionRange, text: '' }, cell.textModel?.getVersionId());
                }));
                const filteredEdits = allCellEdits.flat().filter(edit => edit !== undefined);
                await this.bulkEditService.apply(filteredEdits, { label: (0, nls_1.localize)('trimNotebookNewlines', "Trim Final New Lines"), code: 'undoredo.trimFinalNewLines' });
            }
            finally {
                progress.report({ increment: 100 });
                disposable.dispose();
            }
        }
    };
    TrimFinalNewLinesParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, editorService_1.IEditorService),
        __param(2, bulkEditService_1.IBulkEditService)
    ], TrimFinalNewLinesParticipant);
    let InsertFinalNewLineParticipant = class InsertFinalNewLineParticipant {
        constructor(configurationService, bulkEditService, editorService) {
            this.configurationService = configurationService;
            this.bulkEditService = bulkEditService;
            this.editorService = editorService;
        }
        async participate(workingCopy, context, progress, _token) {
            // waiting on notebook-specific override before this feature can sync with 'files.insertFinalNewline'
            // if (this.configurationService.getValue('files.insertFinalNewline')) {
            if (this.configurationService.getValue(notebookCommon_1.NotebookSetting.insertFinalNewline)) {
                await this.doInsertFinalNewLine(workingCopy, context.reason === 2 /* SaveReason.AUTO */, progress);
            }
        }
        async doInsertFinalNewLine(workingCopy, isAutoSaved, progress) {
            if (!workingCopy.model || !(workingCopy.model instanceof notebookEditorModel_1.NotebookFileWorkingCopyModel)) {
                return;
            }
            const disposable = new lifecycle_1.DisposableStore();
            const notebook = workingCopy.model.notebookModel;
            // get initial cursor positions
            const activeCellEditor = getActiveCellCodeEditor(this.editorService);
            let selections;
            if (activeCellEditor) {
                selections = activeCellEditor.getSelections() ?? [];
            }
            try {
                const allCellEdits = await Promise.all(notebook.cells.map(async (cell) => {
                    if (cell.cellKind !== notebookCommon_1.CellKind.Code) {
                        return;
                    }
                    const lineCount = cell.textBuffer.getLineCount();
                    const lastLineIsEmptyOrWhitespace = cell.textBuffer.getLineFirstNonWhitespaceColumn(lineCount) === 0;
                    if (!lineCount || lastLineIsEmptyOrWhitespace) {
                        return;
                    }
                    return new bulkEditService_1.ResourceTextEdit(cell.uri, { range: new range_1.Range(lineCount + 1, cell.textBuffer.getLineLength(lineCount), lineCount + 1, cell.textBuffer.getLineLength(lineCount)), text: cell.textBuffer.getEOL() }, cell.textModel?.getVersionId());
                }));
                const filteredEdits = allCellEdits.filter(edit => edit !== undefined);
                await this.bulkEditService.apply(filteredEdits, { label: (0, nls_1.localize)('insertFinalNewLine', "Insert Final New Line"), code: 'undoredo.insertFinalNewLine' });
                // set cursor back to initial position after inserting final new line
                if (activeCellEditor && selections) {
                    activeCellEditor.setSelections(selections);
                }
            }
            finally {
                progress.report({ increment: 100 });
                disposable.dispose();
            }
        }
    };
    InsertFinalNewLineParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, bulkEditService_1.IBulkEditService),
        __param(2, editorService_1.IEditorService)
    ], InsertFinalNewLineParticipant);
    let CodeActionOnSaveParticipant = class CodeActionOnSaveParticipant {
        constructor(configurationService, logService, workspaceTrustManagementService, languageFeaturesService, textModelService, instantiationService) {
            this.configurationService = configurationService;
            this.logService = logService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.languageFeaturesService = languageFeaturesService;
            this.textModelService = textModelService;
            this.instantiationService = instantiationService;
        }
        async participate(workingCopy, context, progress, token) {
            const nbDisposable = new lifecycle_1.DisposableStore();
            const isTrusted = this.workspaceTrustManagementService.isWorkspaceTrusted();
            if (!isTrusted) {
                return;
            }
            if (!workingCopy.model || !(workingCopy.model instanceof notebookEditorModel_1.NotebookFileWorkingCopyModel)) {
                return;
            }
            let saveTrigger = '';
            if (context.reason === 2 /* SaveReason.AUTO */) {
                // currently this won't happen, as vs/editor/contrib/codeAction/browser/codeAction.ts L#104 filters out codeactions on autosave. Just future-proofing
                // ? notebook CodeActions on autosave seems dangerous (perf-wise)
                // saveTrigger = 'always'; // TODO@Yoyokrazy, support during debt
                return undefined;
            }
            else if (context.reason === 1 /* SaveReason.EXPLICIT */) {
                saveTrigger = 'explicit';
            }
            else {
                // 	SaveReason.FOCUS_CHANGE, WINDOW_CHANGE need to be addressed when autosaves are enabled
                return undefined;
            }
            const notebookModel = workingCopy.model.notebookModel;
            const setting = this.configurationService.getValue(notebookCommon_1.NotebookSetting.codeActionsOnSave);
            if (!setting) {
                return undefined;
            }
            const settingItems = Array.isArray(setting)
                ? setting
                : Object.keys(setting).filter(x => setting[x]);
            if (!settingItems.length) {
                return undefined;
            }
            const allCodeActions = this.createCodeActionsOnSave(settingItems);
            const excludedActions = allCodeActions
                .filter(x => setting[x.value] === 'never' || setting[x.value] === false);
            const includedActions = allCodeActions
                .filter(x => setting[x.value] === saveTrigger || setting[x.value] === true);
            const editorCodeActionsOnSave = includedActions.filter(x => !types_1.CodeActionKind.Notebook.contains(x));
            const notebookCodeActionsOnSave = includedActions.filter(x => types_1.CodeActionKind.Notebook.contains(x));
            if (!editorCodeActionsOnSave.length && !notebookCodeActionsOnSave.length) {
                return undefined;
            }
            // prioritize `source.fixAll` code actions
            if (!Array.isArray(setting)) {
                editorCodeActionsOnSave.sort((a, b) => {
                    if (types_1.CodeActionKind.SourceFixAll.contains(a)) {
                        if (types_1.CodeActionKind.SourceFixAll.contains(b)) {
                            return 0;
                        }
                        return -1;
                    }
                    if (types_1.CodeActionKind.SourceFixAll.contains(b)) {
                        return 1;
                    }
                    return 0;
                });
            }
            // run notebook code actions
            progress.report({ message: (0, nls_1.localize)('notebookSaveParticipants.notebookCodeActions', "Running 'Notebook' code actions") });
            try {
                const cell = notebookModel.cells[0];
                const ref = await this.textModelService.createModelReference(cell.uri);
                nbDisposable.add(ref);
                const textEditorModel = ref.object.textEditorModel;
                await this.applyOnSaveActions(textEditorModel, notebookCodeActionsOnSave, excludedActions, progress, token);
            }
            catch {
                this.logService.error('Failed to apply notebook code action on save');
            }
            finally {
                progress.report({ increment: 100 });
                nbDisposable.dispose();
            }
            // run cell level code actions
            const disposable = new lifecycle_1.DisposableStore();
            progress.report({ message: (0, nls_1.localize)('notebookSaveParticipants.cellCodeActions', "Running 'Cell' code actions") });
            try {
                await Promise.all(notebookModel.cells.map(async (cell) => {
                    const ref = await this.textModelService.createModelReference(cell.uri);
                    disposable.add(ref);
                    const textEditorModel = ref.object.textEditorModel;
                    await this.applyOnSaveActions(textEditorModel, editorCodeActionsOnSave, excludedActions, progress, token);
                }));
            }
            catch {
                this.logService.error('Failed to apply code action on save');
            }
            finally {
                progress.report({ increment: 100 });
                disposable.dispose();
            }
        }
        createCodeActionsOnSave(settingItems) {
            const kinds = settingItems.map(x => new hierarchicalKind_1.HierarchicalKind(x));
            // Remove subsets
            return kinds.filter(kind => {
                return kinds.every(otherKind => otherKind.equals(kind) || !otherKind.contains(kind));
            });
        }
        async applyOnSaveActions(model, codeActionsOnSave, excludes, progress, token) {
            const getActionProgress = new class {
                constructor() {
                    this._names = new Set();
                }
                _report() {
                    progress.report({
                        message: (0, nls_1.localize)({ key: 'codeaction.get2', comment: ['[configure]({1}) is a link. Only translate `configure`. Do not change brackets and parentheses or {1}'] }, "Getting code actions from '{0}' ([configure]({1})).", [...this._names].map(name => `'${name}'`).join(', '), 'command:workbench.action.openSettings?%5B%22editor.codeActionsOnSave%22%5D')
                    });
                }
                report(provider) {
                    if (provider.displayName && !this._names.has(provider.displayName)) {
                        this._names.add(provider.displayName);
                        this._report();
                    }
                }
            };
            for (const codeActionKind of codeActionsOnSave) {
                const actionsToRun = await this.getActionsToRun(model, codeActionKind, excludes, getActionProgress, token);
                if (token.isCancellationRequested) {
                    actionsToRun.dispose();
                    return;
                }
                try {
                    for (const action of actionsToRun.validActions) {
                        const codeActionEdits = action.action.edit?.edits;
                        let breakFlag = false;
                        if (!action.action.kind?.startsWith('notebook')) {
                            for (const edit of codeActionEdits ?? []) {
                                const workspaceTextEdit = edit;
                                if (workspaceTextEdit.resource && (0, resources_1.isEqual)(workspaceTextEdit.resource, model.uri)) {
                                    continue;
                                }
                                else {
                                    // error -> applied to multiple resources
                                    breakFlag = true;
                                    break;
                                }
                            }
                        }
                        if (breakFlag) {
                            this.logService.warn('Failed to apply code action on save, applied to multiple resources.');
                            continue;
                        }
                        progress.report({ message: (0, nls_1.localize)('codeAction.apply', "Applying code action '{0}'.", action.action.title) });
                        await this.instantiationService.invokeFunction(codeAction_1.applyCodeAction, action, codeAction_1.ApplyCodeActionReason.OnSave, {}, token);
                        if (token.isCancellationRequested) {
                            return;
                        }
                    }
                }
                catch {
                    // Failure to apply a code action should not block other on save actions
                }
                finally {
                    actionsToRun.dispose();
                }
            }
        }
        getActionsToRun(model, codeActionKind, excludes, progress, token) {
            return (0, codeAction_1.getCodeActions)(this.languageFeaturesService.codeActionProvider, model, model.getFullModelRange(), {
                type: 1 /* CodeActionTriggerType.Invoke */,
                triggerAction: types_1.CodeActionTriggerSource.OnSave,
                filter: { include: codeActionKind, excludes: excludes, includeSourceActions: true },
            }, progress, token);
        }
    };
    CodeActionOnSaveParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, log_1.ILogService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, instantiation_1.IInstantiationService)
    ], CodeActionOnSaveParticipant);
    function getActiveCellCodeEditor(editorService) {
        const activePane = editorService.activeEditorPane;
        const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(activePane);
        const activeCodeEditor = notebookEditor?.activeCodeEditor;
        return activeCodeEditor;
    }
    let SaveParticipantsContribution = class SaveParticipantsContribution extends lifecycle_1.Disposable {
        constructor(instantiationService, workingCopyFileService) {
            super();
            this.instantiationService = instantiationService;
            this.workingCopyFileService = workingCopyFileService;
            this.registerSaveParticipants();
        }
        registerSaveParticipants() {
            this._register(this.workingCopyFileService.addSaveParticipant(this.instantiationService.createInstance(TrimWhitespaceParticipant)));
            this._register(this.workingCopyFileService.addSaveParticipant(this.instantiationService.createInstance(CodeActionOnSaveParticipant)));
            this._register(this.workingCopyFileService.addSaveParticipant(this.instantiationService.createInstance(FormatOnSaveParticipant)));
            this._register(this.workingCopyFileService.addSaveParticipant(this.instantiationService.createInstance(InsertFinalNewLineParticipant)));
            this._register(this.workingCopyFileService.addSaveParticipant(this.instantiationService.createInstance(TrimFinalNewLinesParticipant)));
        }
    };
    exports.SaveParticipantsContribution = SaveParticipantsContribution;
    exports.SaveParticipantsContribution = SaveParticipantsContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyFileService_1.IWorkingCopyFileService)
    ], SaveParticipantsContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(SaveParticipantsContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2F2ZVBhcnRpY2lwYW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9zYXZlUGFydGljaXBhbnRzL3NhdmVQYXJ0aWNpcGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0NoRyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQUM1QixZQUN3QyxtQkFBeUMsRUFDckMsdUJBQWlELEVBQ3hELGdCQUFtQyxFQUNwQyxlQUFpQyxFQUM1QixvQkFBMkM7WUFKNUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUNyQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ3hELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDcEMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQzVCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7UUFDaEYsQ0FBQztRQUVMLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBZ0UsRUFBRSxPQUFxRCxFQUFFLFFBQWtDLEVBQUUsS0FBd0I7WUFDdE0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFlBQVksa0RBQTRCLENBQUMsRUFBRSxDQUFDO2dCQUN4RixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLE1BQU0sNEJBQW9CLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVUsZ0NBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMxRixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JB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