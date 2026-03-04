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
define(["require", "exports", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/base/common/map", "vs/base/common/lifecycle", "vs/base/common/event", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/platform/log/common/log"], function (require, exports, files_1, model_1, map_1, lifecycle_1, event_1, bulkEditService_1, bulkCellEdits_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConflictDetector = void 0;
    let ConflictDetector = class ConflictDetector {
        constructor(edits, fileService, modelService, logService) {
            this._conflicts = new map_1.ResourceMap();
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidConflict = new event_1.Emitter();
            this.onDidConflict = this._onDidConflict.event;
            const _workspaceEditResources = new map_1.ResourceMap();
            for (const edit of edits) {
                if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                    _workspaceEditResources.set(edit.resource, true);
                    if (typeof edit.versionId === 'number') {
                        const model = modelService.getModel(edit.resource);
                        if (model && model.getVersionId() !== edit.versionId) {
                            this._conflicts.set(edit.resource, true);
                            this._onDidConflict.fire(this);
                        }
                    }
                }
                else if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                    if (edit.newResource) {
                        _workspaceEditResources.set(edit.newResource, true);
                    }
                    else if (edit.oldResource) {
                        _workspaceEditResources.set(edit.oldResource, true);
                    }
                }
                else if (edit instanceof bulkCellEdits_1.ResourceNotebookCellEdit) {
                    _workspaceEditResources.set(edit.resource, true);
                }
                else {
                    logService.warn('UNKNOWN edit type', edit);
                }
            }
            // listen to file changes
            this._disposables.add(fileService.onDidFilesChange(e => {
                for (const uri of _workspaceEditResources.keys()) {
                    // conflict happens when a file that we are working
                    // on changes on disk. ignore changes for which a model
                    // exists because we have a better check for models
                    if (!modelService.getModel(uri) && e.contains(uri)) {
                        this._conflicts.set(uri, true);
                        this._onDidConflict.fire(this);
                        break;
                    }
                }
            }));
            // listen to model changes...?
            const onDidChangeModel = (model) => {
                // conflict
                if (_workspaceEditResources.has(model.uri)) {
                    this._conflicts.set(model.uri, true);
                    this._onDidConflict.fire(this);
                }
            };
            for (const model of modelService.getModels()) {
                this._disposables.add(model.onDidChangeContent(() => onDidChangeModel(model)));
            }
        }
        dispose() {
            this._disposables.dispose();
            this._onDidConflict.dispose();
        }
        list() {
            return [...this._conflicts.keys()];
        }
        hasConflicts() {
            return this._conflicts.size > 0;
        }
    };
    exports.ConflictDetector = ConflictDetector;
    exports.ConflictDetector = ConflictDetector = __decorate([
        __param(1, files_1.IFileService),
        __param(2, model_1.IModelService),
        __param(3, log_1.ILogService)
    ], ConflictDetector);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmxpY3RzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYnVsa0VkaXQvYnJvd3Nlci9jb25mbGljdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO1FBUTVCLFlBQ0MsS0FBcUIsRUFDUCxXQUF5QixFQUN4QixZQUEyQixFQUM3QixVQUF1QjtZQVZwQixlQUFVLEdBQUcsSUFBSSxpQkFBVyxFQUFXLENBQUM7WUFDeEMsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUVyQyxtQkFBYyxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDN0Msa0JBQWEsR0FBZ0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7WUFTL0QsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLGlCQUFXLEVBQVcsQ0FBQztZQUUzRCxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUMxQixJQUFJLElBQUksWUFBWSxrQ0FBZ0IsRUFBRSxDQUFDO29CQUN0Qyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDakQsSUFBSSxPQUFPLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQ3hDLE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUNuRCxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLEtBQUssSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDOzRCQUN0RCxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMs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