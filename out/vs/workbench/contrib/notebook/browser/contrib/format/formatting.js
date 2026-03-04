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
define(["require", "exports", "vs/nls", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/bulkEditService", "vs/editor/common/editorContextKeys", "vs/editor/common/services/editorWorker", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/editor/contrib/format/browser/format", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/configuration/common/configuration", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, nls_1, cancellation_1, lifecycle_1, editorExtensions_1, bulkEditService_1, editorContextKeys_1, editorWorker_1, languageFeatures_1, resolverService_1, format_1, actions_1, contextkey_1, instantiation_1, progress_1, coreActions_1, notebookBrowser_1, notebookContextKeys_1, editorService_1, notebookExecutionService_1, notebookCommon_1, configuration_1, platform_1, contributions_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellExecutionParticipantsContribution = void 0;
    // format notebook
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.format',
                title: (0, nls_1.localize2)('format.title', 'Format Notebook'),
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE),
                keybinding: {
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated(),
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                f1: true,
                menu: {
                    id: actions_1.MenuId.EditorContext,
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.inCompositeEditor, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider),
                    group: '1_modification',
                    order: 1.3
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const editorWorkerService = accessor.get(editorWorker_1.IEditorWorkerService);
            const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor || !editor.hasModel()) {
                return;
            }
            const notebook = editor.textModel;
            const disposable = new lifecycle_1.DisposableStore();
            try {
                const allCellEdits = await Promise.all(notebook.cells.map(async (cell) => {
                    const ref = await textModelService.createModelReference(cell.uri);
                    disposable.add(ref);
                    const model = ref.object.textEditorModel;
                    const formatEdits = await (0, format_1.getDocumentFormattingEditsUntilResult)(editorWorkerService, languageFeaturesService, model, model.getOptions(), cancellation_1.CancellationToken.None);
                    const edits = [];
                    if (formatEdits) {
                        for (const edit of formatEdits) {
                            edits.push(new bulkEditService_1.ResourceTextEdit(model.uri, edit, model.getVersionId()));
                        }
                        return edits;
                    }
                    return [];
                }));
                await bulkEditService.apply(/* edit */ allCellEdits.flat(), { label: (0, nls_1.localize)('label', "Format Notebook"), code: 'undoredo.formatNotebook', });
            }
            finally {
                disposable.dispose();
            }
        }
    });
    // format cell
    (0, editorExtensions_1.registerEditorAction)(class FormatCellAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'notebook.formatCell',
                label: (0, nls_1.localize)('formatCell.label', "Format Cell"),
                alias: 'Format Cell',
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, editorContextKeys_1.EditorContextKeys.inCompositeEditor, editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider),
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus),
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: '1_modification',
                    order: 1.301
                }
            });
        }
        async run(accessor, editor) {
            if (editor.hasModel()) {
                const instaService = accessor.get(instantiation_1.IInstantiationService);
                await instaService.invokeFunction(format_1.formatDocumentWithSelectedProvider, editor, 1 /* FormattingMode.Explicit */, progress_1.Progress.None, cancellation_1.CancellationToken.None, true);
            }
        }
    });
    let FormatOnCellExecutionParticipant = class FormatOnCellExecutionParticipant {
        constructor(bulkEditService, languageFeaturesService, textModelService, editorWorkerService, configurationService, _notebookService) {
            this.bulkEditService = bulkEditService;
            this.languageFeaturesService = languageFeaturesService;
            this.textModelService = textModelService;
            this.editorWorkerService = editorWorkerService;
            this.configurationService = configurationService;
            this._notebookService = _notebookService;
        }
        async onWillExecuteCell(executions) {
            const enabled = this.configurationService.getValue(notebookCommon_1.NotebookSetting.formatOnCellExecution);
            if (!enabled) {
                return;
            }
            const disposable = new lifecycle_1.DisposableStore();
            try {
                const allCellEdits = await Promise.all(executions.map(async (cellExecution) => {
                    const nbModel = this._notebookService.getNotebookTextModel(cellExecution.notebook);
                    if (!nbModel) {
                        return [];
                    }
                    let activeCell;
                    for (const cell of nbModel.cells) {
                        if (cell.handle === cellExecution.cellHandle) {
                            activeCell = cell;
                            break;
                        }
                    }
                    if (!activeCell) {
                        return [];
                    }
                    const ref = await this.textModelService.createModelReference(activeCell.uri);
                    disposable.add(ref);
                    const model = ref.object.textEditorModel;
                    // todo: eventually support cancellation. potential leak if cell deleted mid execution
                    const formatEdits = await (0, format_1.getDocumentFormattingEditsUntilResult)(this.editorWorkerService, this.languageFeaturesService, model, model.getOptions(), cancellation_1.CancellationToken.None);
                    const edits = [];
                    if (formatEdits) {
                        edits.push(...formatEdits.map(edit => new bulkEditService_1.ResourceTextEdit(model.uri, edit, model.getVersionId())));
                        return edits;
                    }
                    return [];
                }));
                await this.bulkEditService.apply(/* edit */ allCellEdits.flat(), { label: (0, nls_1.localize)('formatCells.label', "Format Cells"), code: 'undoredo.notebooks.onWillExecuteFormat', });
            }
            finally {
                disposable.dispose();
            }
        }
    };
    FormatOnCellExecutionParticipant = __decorate([
        __param(0, bulkEditService_1.IBulkEditService),
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, editorWorker_1.IEditorWorkerService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, notebookService_1.INotebookService)
    ], FormatOnCellExecutionParticipant);
    let CellExecutionParticipantsContribution = class CellExecutionParticipantsContribution extends lifecycle_1.Disposable {
        constructor(instantiationService, notebookExecutionService) {
            super();
            this.instantiationService = instantiationService;
            this.notebookExecutionService = notebookExecutionService;
            this.registerKernelExecutionParticipants();
        }
        registerKernelExecutionParticipants() {
            this._register(this.notebookExecutionService.registerExecutionParticipant(this.instantiationService.createInstance(FormatOnCellExecutionParticipant)));
        }
    };
    exports.CellExecutionParticipantsContribution = CellExecutionParticipantsContribution;
    exports.CellExecutionParticipantsContribution = CellExecutionParticipantsContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notebookExecutionService_1.INotebookExecutionService)
    ], CellExecutionParticipantsContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(CellExecutionParticipantsContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9mb3JtYXQvZm9ybWF0dGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQ2hHLGtCQUFrQjtJQUNsQixJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxpQkFBaUI7Z0JBQ3JCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxjQUFjLEVBQUUsaUJBQWlCLENBQUM7Z0JBQ25ELFFBQVEsRUFBRSx1Q0FBeUI7Z0JBQ25DLFlBQVksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQywrQ0FBeUIsRUFBRSw4Q0FBd0IsQ0FBQztnQkFDckYsVUFBVSxFQUFFO29CQUNYLElBQUksRUFBRSxxQ0FBaUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFO29CQUNuRCxPQUFPLEVBQUUsOENBQXlCLHdCQUFlO29CQUNqRCxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsbURBQTZCLHdCQUFlLEVBQUU7b0JBQ2hFLE1BQU0sNkNBQW1DO2lCQUN6QztnQkFDRCxFQUFFLEVBQUUsSUFBSTtnQkFDUixJQUFJLEVBQUU7b0JBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsYUFBYTtvQkFDeEIsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLHFDQUFpQixDQUFDLGlCQUFpQixFQUFFLHFDQUFpQixDQUFDLDZCQUE2QixDQUFDO29CQUM5RyxLQUFLLEVBQUUsZ0JBQWdCO29CQUN2QixLQUFLLEVBQUUsR0FBRztpQkFDVjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FB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