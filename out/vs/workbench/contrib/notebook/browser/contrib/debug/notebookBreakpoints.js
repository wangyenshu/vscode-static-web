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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/resources", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorService"], function (require, exports, lifecycle_1, map_1, network_1, resources_1, platform_1, contributions_1, debug_1, notebookBrowser_1, notebookCommon_1, notebookService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotebookBreakpoints = class NotebookBreakpoints extends lifecycle_1.Disposable {
        constructor(_debugService, _notebookService, _editorService) {
            super();
            this._debugService = _debugService;
            this._editorService = _editorService;
            const listeners = new map_1.ResourceMap();
            this._register(_notebookService.onWillAddNotebookDocument(model => {
                listeners.set(model.uri, model.onWillAddRemoveCells(e => {
                    // When deleting a cell, remove its breakpoints
                    const debugModel = this._debugService.getModel();
                    if (!debugModel.getBreakpoints().length) {
                        return;
                    }
                    if (e.rawEvent.kind !== notebookCommon_1.NotebookCellsChangeType.ModelChange) {
                        return;
                    }
                    for (const change of e.rawEvent.changes) {
                        const [start, deleteCount] = change;
                        if (deleteCount > 0) {
                            const deleted = model.cells.slice(start, start + deleteCount);
                            for (const deletedCell of deleted) {
                                const cellBps = debugModel.getBreakpoints({ uri: deletedCell.uri });
                                cellBps.forEach(cellBp => this._debugService.removeBreakpoints(cellBp.getId()));
                            }
                        }
                    }
                }));
            }));
            this._register(_notebookService.onWillRemoveNotebookDocument(model => {
                this.updateBreakpoints(model);
                listeners.get(model.uri)?.dispose();
                listeners.delete(model.uri);
            }));
            this._register(this._debugService.getModel().onDidChangeBreakpoints(e => {
                const newCellBp = e?.added?.find(bp => 'uri' in bp && bp.uri.scheme === network_1.Schemas.vscodeNotebookCell);
                if (newCellBp) {
                    const parsed = notebookCommon_1.CellUri.parse(newCellBp.uri);
                    if (!parsed) {
                        return;
                    }
                    const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
                    if (!editor || !editor.hasModel() || editor.textModel.uri.toString() !== parsed.notebook.toString()) {
                        return;
                    }
                    const cell = editor.getCellByHandle(parsed.handle);
                    if (!cell) {
                        return;
                    }
                    editor.focusElement(cell);
                }
            }));
        }
        updateBreakpoints(model) {
            const bps = this._debugService.getModel().getBreakpoints();
            if (!bps.length || !model.cells.length) {
                return;
            }
            const idxMap = new map_1.ResourceMap();
            model.cells.forEach((cell, i) => {
                idxMap.set(cell.uri, i);
            });
            bps.forEach(bp => {
                const idx = idxMap.get(bp.uri);
                if (typeof idx !== 'number') {
                    return;
                }
                const notebook = notebookCommon_1.CellUri.parse(bp.uri)?.notebook;
                if (!notebook) {
                    return;
                }
                const newUri = notebookCommon_1.CellUri.generate(notebook, idx);
                if ((0, resources_1.isEqual)(newUri, bp.uri)) {
                    return;
                }
                this._debugService.removeBreakpoints(bp.getId());
                this._debugService.addBreakpoints(newUri, [
                    {
                        column: bp.column,
                        condition: bp.condition,
                        enabled: bp.enabled,
                        hitCondition: bp.hitCondition,
                        logMessage: bp.logMessage,
                        lineNumber: bp.lineNumber
                    }
                ]);
            });
        }
    };
    NotebookBreakpoints = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, notebookService_1.INotebookService),
        __param(2, editorService_1.IEditorService)
    ], NotebookBreakpoints);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NotebookBreakpoints, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tCcmVha3BvaW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9kZWJ1Zy9ub3RlYm9va0JyZWFrcG9pbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBZ0JoRyxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBQzNDLFlBQ2lDLGFBQTRCLEVBQzFDLGdCQUFrQyxFQUNuQixjQUE4QjtZQUUvRCxLQUFLLEVBQUUsQ0FBQztZQUp3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUUzQixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFJL0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxpQkFBVyxFQUFlLENBQUM7WUFDakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDakUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDdkQsK0NBQStDO29CQUMvQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNqRCxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUN6QyxPQUFPO29CQUNSLENBQUM7b0JBRUQsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyx3Q0FBdUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDN0QsT0FBTztvQkFDUixDQUFDO29CQUVELEtBQUssTUFBTSxNQUFNLElBQUksQ0FBQyxDQUFDLFFBQVEs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