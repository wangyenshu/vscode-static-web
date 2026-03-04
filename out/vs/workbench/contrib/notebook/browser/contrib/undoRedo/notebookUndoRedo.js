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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/editor/browser/editorExtensions"], function (require, exports, lifecycle_1, contributions_1, notebookCommon_1, editorService_1, notebookBrowser_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotebookUndoRedoContribution = class NotebookUndoRedoContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.notebookUndoRedo'; }
        constructor(_editorService) {
            super();
            this._editorService = _editorService;
            const PRIORITY = 105;
            this._register(editorExtensions_1.UndoCommand.addImplementation(PRIORITY, 'notebook-undo-redo', () => {
                const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
                const viewModel = editor?.getViewModel();
                if (editor && editor.hasModel() && viewModel) {
                    return viewModel.undo().then(cellResources => {
                        if (cellResources?.length) {
                            for (let i = 0; i < editor.getLength(); i++) {
                                const cell = editor.cellAt(i);
                                if (cell.cellKind === notebookCommon_1.CellKind.Markup && cellResources.find(resource => resource.fragment === cell.model.uri.fragment)) {
                                    cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'undo');
                                }
                            }
                            editor?.setOptions({ cellOptions: { resource: cellResources[0] }, preserveFocus: true });
                        }
                    });
                }
                return false;
            }));
            this._register(editorExtensions_1.RedoCommand.addImplementation(PRIORITY, 'notebook-undo-redo', () => {
                const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
                const viewModel = editor?.getViewModel();
                if (editor && editor.hasModel() && viewModel) {
                    return viewModel.redo().then(cellResources => {
                        if (cellResources?.length) {
                            for (let i = 0; i < editor.getLength(); i++) {
                                const cell = editor.cellAt(i);
                                if (cell.cellKind === notebookCommon_1.CellKind.Markup && cellResources.find(resource => resource.fragment === cell.model.uri.fragment)) {
                                    cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'redo');
                                }
                            }
                            editor?.setOptions({ cellOptions: { resource: cellResources[0] }, preserveFocus: true });
                        }
                    });
                }
                return false;
            }));
        }
    };
    NotebookUndoRedoContribution = __decorate([
        __param(0, editorService_1.IEditorService)
    ], NotebookUndoRedoContribution);
    (0, contributions_1.registerWorkbenchContribution2)(NotebookUndoRedoContribution.ID, NotebookUndoRedoContribution, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tVbmRvUmVkby5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi91bmRvUmVkby9ub3RlYm9va1VuZG9SZWRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBVWhHLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTZCLFNBQVEsc0JBQVU7aUJBRXBDLE9BQUUsR0FBRyxvQ0FBb0MsQUFBdkMsQ0FBd0M7UUFFMUQsWUFBNkMsY0FBOEI7WUFDMUUsS0FBSyxFQUFFLENBQUM7WUFEb0MsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBRzFFLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQztZQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLDhCQUFXLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtnQkFDakYsTUFBTSxNQUFNLEdBQUcsSUFBQSxpREFBK0IsRUFBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3JGLE1BQU0sU0FBUyxHQUFHLE1BQU0sRUFBRSxZQUFZLEVBQW1DLENBQUM7Z0JBQzFFLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDOUMsT0FBTyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFO3dCQUM1QyxJQUFJLGFBQWEsRUFBRSxNQUFNLEVBQUUsQ0FBQzs0QkFDM0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dDQUM3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