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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/editor/common/services/editorWorker", "vs/platform/undoRedo/common/undoRedo", "vs/editor/common/model/editStack", "vs/base/common/map", "vs/editor/common/services/model", "vs/editor/browser/services/bulkEditService", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/snippet/browser/snippetParser"], function (require, exports, lifecycle_1, editOperation_1, range_1, resolverService_1, editorWorker_1, undoRedo_1, editStack_1, map_1, model_1, bulkEditService_1, snippetController2_1, snippetParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkTextEdits = void 0;
    class ModelEditTask {
        constructor(_modelReference) {
            this._modelReference = _modelReference;
            this.model = this._modelReference.object.textEditorModel;
            this._edits = [];
        }
        dispose() {
            this._modelReference.dispose();
        }
        isNoOp() {
            if (this._edits.length > 0) {
                // contains textual edits
                return false;
            }
            if (this._newEol !== undefined && this._newEol !== this.model.getEndOfLineSequence()) {
                // contains an eol change that is a real change
                return false;
            }
            return true;
        }
        addEdit(resourceEdit) {
            this._expectedModelVersionId = resourceEdit.versionId;
            const { textEdit } = resourceEdit;
            if (typeof textEdit.eol === 'number') {
                // honor eol-change
                this._newEol = textEdit.eol;
            }
            if (!textEdit.range && !textEdit.text) {
                // lacks both a range and the text
                return;
            }
            if (range_1.Range.isEmpty(textEdit.range) && !textEdit.text) {
                // no-op edit (replace empty range with empty text)
                return;
            }
            // create edit operation
            let range;
            if (!textEdit.range) {
                range = this.model.getFullModelRange();
            }
            else {
                range = range_1.Range.lift(textEdit.range);
            }
            this._edits.push({ ...editOperation_1.EditOperation.replaceMove(range, textEdit.text), insertAsSnippet: textEdit.insertAsSnippet });
        }
        validate() {
            if (typeof this._expectedModelVersionId === 'undefined' || this.model.getVersionId() === this._expectedModelVersionId) {
                return { canApply: true };
            }
            return { canApply: false, reason: this.model.uri };
        }
        getBeforeCursorState() {
            return null;
        }
        apply() {
            if (this._edits.length > 0) {
                this._edits = this._edits
                    .map(this._transformSnippetStringToInsertText, this) // no editor -> no snippet mode
                    .sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                this.model.pushEditOperations(null, this._edits, () => null);
            }
            if (this._newEol !== undefined) {
                this.model.pushEOL(this._newEol);
            }
        }
        _transformSnippetStringToInsertText(edit) {
            // transform a snippet edit (and only those) into a normal text edit
            // for that we need to parse the snippet and get its actual text, e.g without placeholder
            // or variable syntaxes
            if (!edit.insertAsSnippet) {
                return edit;
            }
            if (!edit.text) {
                return edit;
            }
            const text = snippetParser_1.SnippetParser.asInsertText(edit.text);
            return { ...edit, insertAsSnippet: false, text };
        }
    }
    class EditorEditTask extends ModelEditTask {
        constructor(modelReference, editor) {
            super(modelReference);
            this._editor = editor;
        }
        getBeforeCursorState() {
            return this._canUseEditor() ? this._editor.getSelections() : null;
        }
        apply() {
            // Check that the editor is still for the wanted model. It might have changed in the
            // meantime and that means we cannot use the editor anymore (instead we perform the edit through the model)
            if (!this._canUseEditor()) {
                super.apply();
                return;
            }
            if (this._edits.length > 0) {
                const snippetCtrl = snippetController2_1.SnippetController2.get(this._editor);
                if (snippetCtrl && this._edits.some(edit => edit.insertAsSnippet)) {
                    // some edit is a snippet edit -> use snippet controller and ISnippetEdits
                    const snippetEdits = [];
                    for (const edit of this._edits) {
                        if (edit.range && edit.text !== null) {
                            snippetEdits.push({
                                range: range_1.Range.lift(edit.range),
                                template: edit.insertAsSnippet ? edit.text : snippetParser_1.SnippetParser.escape(edit.text)
                            });
                        }
                    }
                    snippetCtrl.apply(snippetEdits, { undoStopBefore: false, undoStopAfter: false });
                }
                else {
                    // normal edit
                    this._edits = this._edits
                        .map(this._transformSnippetStringToInsertText, this) // mixed edits (snippet and normal) -> no snippet mode
                        .sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                    this._editor.executeEdits('', this._edits);
                }
            }
            if (this._newEol !== undefined) {
                if (this._editor.hasModel()) {
                    this._editor.getModel().pushEOL(this._newEol);
                }
            }
        }
        _canUseEditor() {
            return this._editor?.getModel()?.uri.toString() === this.model.uri.toString();
        }
    }
    let BulkTextEdits = class BulkTextEdits {
        constructor(_label, _code, _editor, _undoRedoGroup, _undoRedoSource, _progress, _token, edits, _editorWorker, _modelService, _textModelResolverService, _undoRedoService) {
            this._label = _label;
            this._code = _code;
            this._editor = _editor;
            this._undoRedoGroup = _undoRedoGroup;
            this._undoRedoSource = _undoRedoSource;
            this._progress = _progress;
            this._token = _token;
            this._editorWorker = _editorWorker;
            this._modelService = _modelService;
            this._textModelResolverService = _textModelResolverService;
            this._undoRedoService = _undoRedoService;
            this._edits = new map_1.ResourceMap();
            for (const edit of edits) {
                let array = this._edits.get(edit.resource);
                if (!array) {
                    array = [];
                    this._edits.set(edit.resource, array);
                }
                array.push(edit);
            }
        }
        _validateBeforePrepare() {
            // First check if loaded models were not changed in the meantime
            for (const array of this._edits.values()) {
                for (const edit of array) {
                    if (typeof edit.versionId === 'number') {
                        const model = this._modelService.getModel(edit.resource);
                        if (model && model.getVersionId() !== edit.versionId) {
                            // model changed in the meantime
                            throw new Error(`${model.uri.toString()} has changed in the meantime`);
                        }
                    }
                }
            }
        }
        async _createEditsTasks() {
            const tasks = [];
            const promises = [];
            for (const [key, edits] of this._edits) {
                const promise = this._textModelResolverService.createModelReference(key).then(async (ref) => {
                    let task;
                    let makeMinimal = false;
                    if (this._editor?.getModel()?.uri.toString() === ref.object.textEditorModel.uri.toString()) {
                        task = new EditorEditTask(ref, this._editor);
                        makeMinimal = true;
                    }
                    else {
                        task = new ModelEditTask(ref);
                    }
                    tasks.push(task);
                    if (!makeMinimal) {
                        edits.forEach(task.addEdit, task);
                        return;
                    }
                    // group edits by type (snippet, metadata, or simple) and make simple groups more minimal
                    const makeGroupMoreMinimal = async (start, end) => {
                        const oldEdits = edits.slice(start, end);
                        const newEdits = await this._editorWorker.computeMoreMinimalEdits(ref.object.textEditorModel.uri, oldEdits.map(e => e.textEdit), false);
                        if (!newEdits) {
                            oldEdits.forEach(task.addEdit, task);
                        }
                        else {
                            newEdits.forEach(edit => task.addEdit(new bulkEditService_1.ResourceTextEdit(ref.object.textEditorModel.uri, edit, undefined, undefined)));
                        }
                    };
                    let start = 0;
                    let i = 0;
                    for (; i < edits.length; i++) {
                        if (edits[i].textEdit.insertAsSnippet || edits[i].metadata) {
                            await makeGroupMoreMinimal(start, i); // grouped edits until now
                            task.addEdit(edits[i]); // this edit
                            start = i + 1;
                        }
                    }
                    await makeGroupMoreMinimal(start, i);
                });
                promises.push(promise);
            }
            await Promise.all(promises);
            return tasks;
        }
        _validateTasks(tasks) {
            for (const task of tasks) {
                const result = task.validate();
                if (!result.canApply) {
                    return result;
                }
            }
            return { canApply: true };
        }
        async apply() {
            this._validateBeforePrepare();
            const tasks = await this._createEditsTasks();
            try {
                if (this._token.isCancellationRequested) {
                    return [];
                }
                const resources = [];
                const validation = this._validateTasks(tasks);
                if (!validation.canApply) {
                    throw new Error(`${validation.reason.toString()} has changed in the meantime`);
                }
                if (tasks.length === 1) {
                    // This edit touches a single model => keep things simple
                    const task = tasks[0];
                    if (!task.isNoOp()) {
                        const singleModelEditStackElement = new editStack_1.SingleModelEditStackElement(this._label, this._code, task.model, task.getBeforeCursorState());
                        this._undoRedoService.pushElement(singleModelEditStackElement, this._undoRedoGroup, this._undoRedoSource);
                        task.apply();
                        singleModelEditStackElement.close();
                        resources.push(task.model.uri);
                    }
                    this._progress.report(undefined);
                }
                else {
                    // prepare multi model undo element
                    const multiModelEditStackElement = new editStack_1.MultiModelEditStackElement(this._label, this._code, tasks.map(t => new editStack_1.SingleModelEditStackElement(this._label, this._code, t.model, t.getBeforeCursorState())));
                    this._undoRedoService.pushElement(multiModelEditStackElement, this._undoRedoGroup, this._undoRedoSource);
                    for (const task of tasks) {
                        task.apply();
                        this._progress.report(undefined);
                        resources.push(task.model.uri);
                    }
                    multiModelEditStackElement.close();
                }
                return resources;
            }
            finally {
                (0, lifecycle_1.dispose)(tasks);
            }
        }
    };
    exports.BulkTextEdits = BulkTextEdits;
    exports.BulkTextEdits = BulkTextEdits = __decorate([
        __param(8, editorWorker_1.IEditorWorkerService),
        __param(9, model_1.IModelService),
        __param(10, resolverService_1.ITextModelService),
        __param(11, undoRedo_1.IUndoRedoService)
    ], BulkTextEdits);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa1RleHRFZGl0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2J1bGtFZGl0L2Jyb3dzZXIvYnVsa1RleHRFZGl0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQmhHLE1BQU0sYUFBYTtRQVFsQixZQUE2QixlQUFxRDtZQUFyRCxvQkFBZSxHQUFmLGVBQWUsQ0FBc0M7WUFDakYsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUM7WUFDekQsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDbEIsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFFRCxNQUFNO1lBQ0wsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDNUIseUJBQXlCO2dCQUN6QixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUM7Z0JBQ3RGLCtDQUErQztnQkFDL0MsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsT0FBTyxDQUFDLFlBQThCO1lBQ3JDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFDO1lBQ3RELE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxZQUFZLENBQUM7WUFFbEMsSUFBSSxPQUFPLFFBQVEsQ0FBQyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3RDLG1CQUFtQjtnQkFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDO1lBQzdCLENBQUM7WUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdkMsa0NBQWtDO2dCQUNsQyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksYUFBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3JELG1EQUFtRDtnQkFDbkQsT0FBTztZQUNSLENBQUM7WUFFRCx3QkFBd0I7WUFDeEIsSUFBSSxLQUFZLENBQUM7WUFDakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDckIsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN4QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsS0FBSyxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BDLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsNkJBQWEsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxlQUFlLEVBQUUsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFDckgsQ0FBQztRQUVELFFBQVE7WUFDUCxJQUFJLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixLQUFLLFdBQVcsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxLQUFLLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUN2SCxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO1lBQzNCLENBQUM7WUFDRCxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNwRCxDQUFDO1FBRUQsb0JBQW9CO1lBQ25CLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNO3FCQUN2QixHQUFHLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLElBQUksQ0FBQyxDQUFDLCtCQUErQjtxQkFDbkYsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsYUFBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLElBQUksQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xDLENBQUM7UUFDRixDQUFDO1FBRVMsbUNBQW1DLENBQUMsSUFBaUM7WUFDOUUsb0VBQW9FO1lBQ3BFLHlGQUF5RjtZQUN6Rix1QkFBdUI7WUFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsNkJBQWEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25ELE9BQU8sRUFBRSxHQUFHLElBQUksRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDO1FBQ2xELENBQUM7S0FDRDtJQUVELE1BQU0sY0FBZSxTQUFRLGFBQWE7UUFJekMsWUFBWSxjQUFvRCxFQUFFLE1BQW1CO1lBQ3BGLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN0QixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN2QixDQUFDO1FBRVEsb0JBQW9CO1lBQzVCLE9BQU8sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDbkUsQ0FBQztRQUVRLEtBQUs7WUFFYixvRkFBb0Y7WUFDcEYsMkdBQTJHO1lBQzNHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQztnQkFDM0IsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNkLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxXQUFXLEdBQUcsdUNBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekQsSUFBSSxXQUFXLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztvQkFDbkUsMEVBQTBFO29CQUMxRSxNQUFNLFlBQVksR0FBbUIsRUFBRSxDQUFDO29CQUN4QyxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDaEMsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7NEJBQ3RDLFlBQVksQ0FBQyxJQUFJLENBQUM7Z0NBQ2pCLEtBQUssRUFBRSxhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7Z0NBQzdCLFFBQVEsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDOzZCQUM1RSxDQUFDLENBQUM7d0JBQ0osQ0FBQztvQkFDRixDQUFDO29CQUNELFdBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFFbEYsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGNBQWM7b0JBQ2QsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTTt5QkFDdkIsR0FBRyxDQUFDLElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxzREFBc0Q7eUJBQzFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLGFBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUNuRSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7b0JBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDL0MsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sYUFBYTtZQUNwQixPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQy9FLENBQUM7S0FDRDtJQUVNLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWE7UUFJekIsWUFDa0IsTUFBYyxFQUNkLEtBQWEsRUFDYixPQUFnQyxFQUNoQyxjQUE2QixFQUM3QixlQUEyQyxFQUMzQyxTQUEwQixFQUMxQixNQUF5QixFQUMxQyxLQUF5QixFQUNILGFBQW9ELEVBQzNELGFBQTZDLEVBQ3pDLHlCQUE2RCxFQUM5RCxnQkFBbUQ7WUFYcEQsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUNkLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYixZQUFPLEdBQVAsT0FBTyxDQUF5QjtZQUNoQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZTtZQUM3QixvQkFBZSxHQUFmLGVBQWUsQ0FBNEI7WUFDM0MsY0FBUyxHQUFULFNBQVMsQ0FBaUI7WUFDMUIsV0FBTSxHQUFOLE1BQU0sQ0FBbUI7WUFFSCxrQkFBYSxHQUFiLGFBQWEsQ0FBc0I7WUFDMUMsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDeEIsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUFtQjtZQUM3QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBZHJELFdBQU0sR0FBRyxJQUFJLGlCQUFXLEVBQXNCLENBQUM7WUFpQi9ELEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQzFCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNaLEtBQUssR0FBRyxFQUFFLENBQUM7b0JBQ1gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsQ0FBQztnQkFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO1FBRU8sc0JBQXNCO1lBQzdCLGdFQUFnRTtZQUNoRSxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDMUMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDMUIsSUFBSSxPQUFPLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQ3hDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDekQsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLFlBQVksRUFBRSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQzs0QkFDdEQsZ0NBQWdDOzRCQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsOEJBQThCLENBQUMsQ0FBQzt3QkFDeEUsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxpQkFBaUI7WUFFOUIsTUFBTSxLQUFLLEdBQW9CLEVBQUUsQ0FBQztZQUNsQyxNQUFNLFFBQVEsR0FBbUIsRUFBRSxDQUFDO1lBRXBDLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3hDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFDLEdBQUcsRUFBQyxFQUFFO29CQUN6RixJQUFJLElBQW1CLENBQUM7b0JBQ3hCLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztvQkFDeEIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQzt3QkFDNUYsSUFBSSxHQUFHLElBQUksY0FBYyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzdDLFdBQVcsR0FBRyxJQUFJLENBQUM7b0JBQ3BCLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLEdBQUcsSUFBSSxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQy9CLENBQUM7b0JBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFHakIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUNsQixLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQ2xDLE9BQU87b0JBQ1IsQ0FBQztvQkFFRCx5RkFBeUY7b0JBRXpGLE1BQU0sb0JBQW9CLEdBQUcsS0FBSyxFQUFFLEtBQWEsRUFBRSxHQUFXLEVBQUUsRUFBRTt3QkFDakUsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7d0JBQ3pDLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDeEksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOzRCQUNmLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDdEMsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksa0NBQWdCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUMxSCxDQUFDO29CQUNGLENBQUMsQ0FBQztvQkFFRixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ2QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNWLE9BQU8sQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDOUIsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7NEJBQzVELE1BQU0sb0JBQW9CLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsMEJBQTBCOzRCQUNoRSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWTs0QkFDcEMsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2YsQ0FBQztvQkFDRixDQUFDO29CQUNELE1BQU0sb0JBQW9CLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUV0QyxDQUFDLENBQUMsQ0FBQztnQkFDSCxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hCLENBQUM7WUFFRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUIsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU8sY0FBYyxDQUFDLEtBQXNCO1lBQzVDLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQzFCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDdEIsT0FBTyxNQUFNLENBQUM7Z0JBQ2YsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxLQUFLLENBQUMsS0FBSztZQUVWLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBQzlCLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFFN0MsSUFBSSxDQUFDO2dCQUNKLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUN6QyxPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDO2dCQUVELE1BQU0sU0FBUyxHQUFVLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLDhCQUE4QixDQUFDLENBQUM7Z0JBQ2hGLENBQUM7Z0JBQ0QsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN4Qix5REFBeUQ7b0JBQ3pELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO3dCQUNwQixNQUFNLDJCQUEyQixHQUFHLElBQUksdUNBQTJCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQzt3QkFDdEksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQzt3QkFDMUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNiLDJCQUEyQixDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNwQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2hDLENBQUM7b0JBQ0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxtQ0FBbUM7b0JBQ25DLE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxzQ0FBMEIsQ0FDaEUsSUFBSSxDQUFDLE1BQU0sRUFDWCxJQUFJLENBQUMsS0FBSyxFQUNWLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLHVDQUEyQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FDM0csQ0FBQztvQkFDRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLDBCQUEwQixFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUN6RyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO3dCQUMxQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ2IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7d0JBQ2pDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDaEMsQ0FBQztvQkFDRCwwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDcEMsQ0FBQztnQkFFRCxPQUFPLFNBQVMsQ0FBQztZQUVsQixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBQSxtQkFBTyxFQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQTVKWSxzQ0FBYTs0QkFBYixhQUFhO1FBYXZCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsWUFBQSxtQ0FBaUIsQ0FBQTtRQUNqQixZQUFBLDJCQUFnQixDQUFBO09BaEJOLGFBQWEsQ0E0SnpCIn0=