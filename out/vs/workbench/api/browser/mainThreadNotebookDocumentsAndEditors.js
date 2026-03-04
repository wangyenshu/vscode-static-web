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
define(["require", "exports", "vs/base/common/collections", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/api/browser/mainThreadNotebookDocuments", "vs/workbench/api/browser/mainThreadNotebookDto", "vs/workbench/api/browser/mainThreadNotebookEditors", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "../common/extHost.protocol", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, collections_1, lifecycle_1, instantiation_1, log_1, mainThreadNotebookDocuments_1, mainThreadNotebookDto_1, mainThreadNotebookEditors_1, extHostCustomers_1, editorGroupColumn_1, notebookBrowser_1, notebookEditorService_1, notebookService_1, editorGroupsService_1, editorService_1, extHost_protocol_1, proxyIdentifier_1) {
    "use strict";
    var MainThreadNotebooksAndEditors_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebooksAndEditors = void 0;
    class NotebookAndEditorState {
        static delta(before, after) {
            if (!before) {
                return {
                    addedDocuments: [...after.documents],
                    removedDocuments: [],
                    addedEditors: [...after.textEditors.values()],
                    removedEditors: [],
                    visibleEditors: [...after.visibleEditors].map(editor => editor[0])
                };
            }
            const documentDelta = (0, collections_1.diffSets)(before.documents, after.documents);
            const editorDelta = (0, collections_1.diffMaps)(before.textEditors, after.textEditors);
            const newActiveEditor = before.activeEditor !== after.activeEditor ? after.activeEditor : undefined;
            const visibleEditorDelta = (0, collections_1.diffMaps)(before.visibleEditors, after.visibleEditors);
            return {
                addedDocuments: documentDelta.added,
                removedDocuments: documentDelta.removed.map(e => e.uri),
                addedEditors: editorDelta.added,
                removedEditors: editorDelta.removed.map(removed => removed.getId()),
                newActiveEditor: newActiveEditor,
                visibleEditors: visibleEditorDelta.added.length === 0 && visibleEditorDelta.removed.length === 0
                    ? undefined
                    : [...after.visibleEditors].map(editor => editor[0])
            };
        }
        constructor(documents, textEditors, activeEditor, visibleEditors) {
            this.documents = documents;
            this.textEditors = textEditors;
            this.activeEditor = activeEditor;
            this.visibleEditors = visibleEditors;
            //
        }
    }
    let MainThreadNotebooksAndEditors = MainThreadNotebooksAndEditors_1 = class MainThreadNotebooksAndEditors {
        constructor(extHostContext, instantiationService, _notebookService, _notebookEditorService, _editorService, _editorGroupService, _logService) {
            this._notebookService = _notebookService;
            this._notebookEditorService = _notebookEditorService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._logService = _logService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._editorListeners = new lifecycle_1.DisposableMap();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebook);
            this._mainThreadNotebooks = instantiationService.createInstance(mainThreadNotebookDocuments_1.MainThreadNotebookDocuments, extHostContext);
            this._mainThreadEditors = instantiationService.createInstance(mainThreadNotebookEditors_1.MainThreadNotebookEditors, extHostContext);
            extHostContext.set(extHost_protocol_1.MainContext.MainThreadNotebookDocuments, this._mainThreadNotebooks);
            extHostContext.set(extHost_protocol_1.MainContext.MainThreadNotebookEditors, this._mainThreadEditors);
            this._notebookService.onWillAddNotebookDocument(() => this._updateState(), this, this._disposables);
            this._notebookService.onDidRemoveNotebookDocument(() => this._updateState(), this, this._disposables);
            this._editorService.onDidActiveEditorChange(() => this._updateState(), this, this._disposables);
            this._editorService.onDidVisibleEditorsChange(() => this._updateState(), this, this._disposables);
            this._notebookEditorService.onDidAddNotebookEditor(this._handleEditorAdd, this, this._disposables);
            this._notebookEditorService.onDidRemoveNotebookEditor(this._handleEditorRemove, this, this._disposables);
            this._updateState();
        }
        dispose() {
            this._mainThreadNotebooks.dispose();
            this._mainThreadEditors.dispose();
            this._disposables.dispose();
            this._editorListeners.dispose();
        }
        _handleEditorAdd(editor) {
            this._editorListeners.set(editor.getId(), (0, lifecycle_1.combinedDisposable)(editor.onDidChangeModel(() => this._updateState()), editor.onDidFocusWidget(() => this._updateState(editor))));
            this._updateState();
        }
        _handleEditorRemove(editor) {
            this._editorListeners.deleteAndDispose(editor.getId());
            this._updateState();
        }
        _updateState(focusedEditor) {
            const editors = new Map();
            const visibleEditorsMap = new Map();
            for (const editor of this._notebookEditorService.listNotebookEditors()) {
                if (editor.hasModel()) {
                    editors.set(editor.getId(), editor);
                }
            }
            const activeNotebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            let activeEditor = null;
            if (activeNotebookEditor) {
                activeEditor = activeNotebookEditor.getId();
            }
            else if (focusedEditor?.textModel) {
                activeEditor = focusedEditor.getId();
            }
            if (activeEditor && !editors.has(activeEditor)) {
                this._logService.trace('MainThreadNotebooksAndEditors#_updateState: active editor is not in editors list', activeEditor, editors.keys());
                activeEditor = null;
            }
            for (const editorPane of this._editorService.visibleEditorPanes) {
                const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorPane);
                if (notebookEditor?.hasModel() && editors.has(notebookEditor.getId())) {
                    visibleEditorsMap.set(notebookEditor.getId(), notebookEditor);
                }
            }
            const newState = new NotebookAndEditorState(new Set(this._notebookService.listNotebookDocuments()), editors, activeEditor, visibleEditorsMap);
            this._onDelta(NotebookAndEditorState.delta(this._currentState, newState));
            this._currentState = newState;
        }
        _onDelta(delta) {
            if (MainThreadNotebooksAndEditors_1._isDeltaEmpty(delta)) {
                return;
            }
            const dto = {
                removedDocuments: delta.removedDocuments,
                removedEditors: delta.removedEditors,
                newActiveEditor: delta.newActiveEditor,
                visibleEditors: delta.visibleEditors,
                addedDocuments: delta.addedDocuments.map(MainThreadNotebooksAndEditors_1._asModelAddData),
                addedEditors: delta.addedEditors.map(this._asEditorAddData, this),
            };
            // send to extension FIRST
            this._proxy.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers(dto));
            // handle internally
            this._mainThreadEditors.handleEditorsRemoved(delta.removedEditors);
            this._mainThreadNotebooks.handleNotebooksRemoved(delta.removedDocuments);
            this._mainThreadNotebooks.handleNotebooksAdded(delta.addedDocuments);
            this._mainThreadEditors.handleEditorsAdded(delta.addedEditors);
        }
        static _isDeltaEmpty(delta) {
            if (delta.addedDocuments !== undefined && delta.addedDocuments.length > 0) {
                return false;
            }
            if (delta.removedDocuments !== undefined && delta.removedDocuments.length > 0) {
                return false;
            }
            if (delta.addedEditors !== undefined && delta.addedEditors.length > 0) {
                return false;
            }
            if (delta.removedEditors !== undefined && delta.removedEditors.length > 0) {
                return false;
            }
            if (delta.visibleEditors !== undefined && delta.visibleEditors.length > 0) {
                return false;
            }
            if (delta.newActiveEditor !== undefined) {
                return false;
            }
            return true;
        }
        static _asModelAddData(e) {
            return {
                viewType: e.viewType,
                uri: e.uri,
                metadata: e.metadata,
                versionId: e.versionId,
                cells: e.cells.map(mainThreadNotebookDto_1.NotebookDto.toNotebookCellDto)
            };
        }
        _asEditorAddData(add) {
            const pane = this._editorService.visibleEditorPanes.find(pane => (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(pane) === add);
            return {
                id: add.getId(),
                documentUri: add.textModel.uri,
                selections: add.getSelections(),
                visibleRanges: add.visibleRanges,
                viewColumn: pane && (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, pane.group)
            };
        }
    };
    exports.MainThreadNotebooksAndEditors = MainThreadNotebooksAndEditors;
    exports.MainThreadNotebooksAndEditors = MainThreadNotebooksAndEditors = MainThreadNotebooksAndEditors_1 = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notebookService_1.INotebookService),
        __param(3, notebookEditorService_1.INotebookEditorService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, log_1.ILogService)
    ], MainThreadNotebooksAndEditors);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rRG9jdW1lbnRzQW5kRWRpdG9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkTm90ZWJvb2tEb2N1bWVudHNBbmRFZGl0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE4QmhHLE1BQU0sc0JBQXNCO1FBQzNCLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBMEMsRUFBRSxLQUE2QjtZQUNyRixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsT0FBTztvQkFDTixjQUFjLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7b0JBQ3BDLGdCQUFnQixFQUFFLEVBQUU7b0JBQ3BCLFlBQVksRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDN0MsY0FBYyxFQUFFLEVBQUU7b0JBQ2xCLGNBQWMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDbEUsQ0FBQztZQUNILENBQUM7WUFDRCxNQUFNLGFBQWEsR0FBRyxJQUFBLHNCQUFRLEVBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbEUsTUFBTSxXQUFXLEdBQUcsSUFBQSxzQkFBUSxFQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRXBFLE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxZQUFZLEtBQUssS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFD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