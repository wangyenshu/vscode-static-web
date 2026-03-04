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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/workbench/services/editor/common/editorService"], function (require, exports, arrays_1, strings_1, types_1, uri_1, bulkEditService_1, notebookBrowser_1, notebookCommon_1, notebookEditorModelResolverService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkCellEdits = exports.ResourceNotebookCellEdit = void 0;
    class ResourceNotebookCellEdit extends bulkEditService_1.ResourceEdit {
        static is(candidate) {
            if (candidate instanceof ResourceNotebookCellEdit) {
                return true;
            }
            return uri_1.URI.isUri(candidate.resource)
                && (0, types_1.isObject)(candidate.cellEdit);
        }
        static lift(edit) {
            if (edit instanceof ResourceNotebookCellEdit) {
                return edit;
            }
            return new ResourceNotebookCellEdit(edit.resource, edit.cellEdit, edit.notebookVersionId, edit.metadata);
        }
        constructor(resource, cellEdit, notebookVersionId = undefined, metadata) {
            super(metadata);
            this.resource = resource;
            this.cellEdit = cellEdit;
            this.notebookVersionId = notebookVersionId;
        }
    }
    exports.ResourceNotebookCellEdit = ResourceNotebookCellEdit;
    let BulkCellEdits = class BulkCellEdits {
        constructor(_undoRedoGroup, undoRedoSource, _progress, _token, _edits, _editorService, _notebookModelService) {
            this._undoRedoGroup = _undoRedoGroup;
            this._progress = _progress;
            this._token = _token;
            this._edits = _edits;
            this._editorService = _editorService;
            this._notebookModelService = _notebookModelService;
            this._edits = this._edits.map(e => {
                if (e.resource.scheme === notebookCommon_1.CellUri.scheme) {
                    const uri = notebookCommon_1.CellUri.parse(e.resource)?.notebook;
                    if (!uri) {
                        throw new Error(`Invalid notebook URI: ${e.resource}`);
                    }
                    return new ResourceNotebookCellEdit(uri, e.cellEdit, e.notebookVersionId, e.metadata);
                }
                else {
                    return e;
                }
            });
        }
        async apply() {
            const resources = [];
            const editsByNotebook = (0, arrays_1.groupBy)(this._edits, (a, b) => (0, strings_1.compare)(a.resource.toString(), b.resource.toString()));
            for (const group of editsByNotebook) {
                if (this._token.isCancellationRequested) {
                    break;
                }
                const [first] = group;
                const ref = await this._notebookModelService.resolve(first.resource);
                // check state
                if (typeof first.notebookVersionId === 'number' && ref.object.notebook.versionId !== first.notebookVersionId) {
                    ref.dispose();
                    throw new Error(`Notebook '${first.resource}' has changed in the meantime`);
                }
                // apply edits
                const edits = group.map(entry => entry.cellEdit);
                const computeUndo = !ref.object.isReadonly();
                const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
                const initialSelectionState = editor?.textModel?.uri.toString() === ref.object.notebook.uri.toString() ? {
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: editor.getFocus(),
                    selections: editor.getSelections()
                } : undefined;
                ref.object.notebook.applyEdits(edits, true, initialSelectionState, () => undefined, this._undoRedoGroup, computeUndo);
                ref.dispose();
                this._progress.report(undefined);
                resources.push(first.resource);
            }
            return resources;
        }
    };
    exports.BulkCellEdits = BulkCellEdits;
    exports.BulkCellEdits = BulkCellEdits = __decorate([
        __param(5, editorService_1.IEditorService),
        __param(6, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], BulkCellEdits);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0NlbGxFZGl0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2J1bGtFZGl0L2Jyb3dzZXIvYnVsa0NlbGxFZGl0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQmhHLE1BQWEsd0JBQXlCLFNBQVEsOEJBQVk7UUFFekQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFjO1lBQ3ZCLElBQUksU0FBUyxZQUFZLHdCQUF3QixFQUFFLENBQUM7Z0JBQ25ELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sU0FBRyxDQUFDLEtBQUssQ0FBOEIsU0FBVSxDQUFDLFFBQVEsQ0FBQzttQkFDOUQsSUFBQSxnQkFBUSxFQUE4QixTQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBZ0M7WUFDM0MsSUFBSSxJQUFJLFlBQVksd0JBQXdCLEVBQUUsQ0FBQztnQkFDOUMsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxJQUFJLHdCQUF3QixDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFHLENBQUM7UUFFRCxZQUNVLFFBQWEsRUFDYixRQUE2RSxFQUM3RSxvQkFBd0MsU0FBUyxFQUMxRCxRQUFnQztZQUVoQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFMUCxhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQ2IsYUFBUSxHQUFSLFFBQVEsQ0FBcUU7WUFDN0Usc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFnQztRQUkzRCxDQUFDO0tBQ0Q7SUF6QkQsNERBeUJD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