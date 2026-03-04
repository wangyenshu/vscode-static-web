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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/worker/simpleWorker", "vs/base/browser/defaultWorkerFactory", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, lifecycle_1, simpleWorker_1, defaultWorkerFactory_1, notebookCommon_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorWorkerServiceImpl = void 0;
    let NotebookEditorWorkerServiceImpl = class NotebookEditorWorkerServiceImpl extends lifecycle_1.Disposable {
        constructor(notebookService) {
            super();
            this._workerManager = this._register(new WorkerManager(notebookService));
        }
        canComputeDiff(original, modified) {
            throw new Error('Method not implemented.');
        }
        computeDiff(original, modified) {
            return this._workerManager.withWorker().then(client => {
                return client.computeDiff(original, modified);
            });
        }
        canPromptRecommendation(model) {
            return this._workerManager.withWorker().then(client => {
                return client.canPromptRecommendation(model);
            });
        }
    };
    exports.NotebookEditorWorkerServiceImpl = NotebookEditorWorkerServiceImpl;
    exports.NotebookEditorWorkerServiceImpl = NotebookEditorWorkerServiceImpl = __decorate([
        __param(0, notebookService_1.INotebookService)
    ], NotebookEditorWorkerServiceImpl);
    class WorkerManager extends lifecycle_1.Disposable {
        // private _lastWorkerUsedTime: number;
        constructor(_notebookService) {
            super();
            this._notebookService = _notebookService;
            this._editorWorkerClient = null;
            // this._lastWorkerUsedTime = (new Date()).getTime();
        }
        withWorker() {
            // this._lastWorkerUsedTime = (new Date()).getTime();
            if (!this._editorWorkerClient) {
                this._editorWorkerClient = new NotebookWorkerClient(this._notebookService, 'notebookEditorWorkerService');
            }
            return Promise.resolve(this._editorWorkerClient);
        }
    }
    class NotebookEditorModelManager extends lifecycle_1.Disposable {
        constructor(_proxy, _notebookService) {
            super();
            this._proxy = _proxy;
            this._notebookService = _notebookService;
            this._syncedModels = Object.create(null);
            this._syncedModelsLastUsedTime = Object.create(null);
        }
        ensureSyncedResources(resources) {
            for (const resource of resources) {
                const resourceStr = resource.toString();
                if (!this._syncedModels[resourceStr]) {
                    this._beginModelSync(resource);
                }
                if (this._syncedModels[resourceStr]) {
                    this._syncedModelsLastUsedTime[resourceStr] = (new Date()).getTime();
                }
            }
        }
        _beginModelSync(resource) {
            const model = this._notebookService.listNotebookDocuments().find(document => document.uri.toString() === resource.toString());
            if (!model) {
                return;
            }
            const modelUrl = resource.toString();
            this._proxy.acceptNewModel(model.uri.toString(), {
                cells: model.cells.map(cell => ({
                    handle: cell.handle,
                    uri: cell.uri,
                    source: cell.getValue(),
                    eol: cell.textBuffer.getEOL(),
                    language: cell.language,
                    mime: cell.mime,
                    cellKind: cell.cellKind,
                    outputs: cell.outputs.map(op => ({ outputId: op.outputId, outputs: op.outputs })),
                    metadata: cell.metadata,
                    internalMetadata: cell.internalMetadata,
                })),
                metadata: model.metadata
            });
            const toDispose = new lifecycle_1.DisposableStore();
            const cellToDto = (cell) => {
                return {
                    handle: cell.handle,
                    uri: cell.uri,
                    source: cell.textBuffer.getLinesContent(),
                    eol: cell.textBuffer.getEOL(),
                    language: cell.language,
                    cellKind: cell.cellKind,
                    outputs: cell.outputs.map(op => ({ outputId: op.outputId, outputs: op.outputs })),
                    metadata: cell.metadata,
                    internalMetadata: cell.internalMetadata,
                };
            };
            toDispose.add(model.onDidChangeContent((event) => {
                const dto = event.rawEvents.map(e => {
                    const data = e.kind === notebookCommon_1.NotebookCellsChangeType.ModelChange || e.kind === notebookCommon_1.NotebookCellsChangeType.Initialize
                        ? {
                            kind: e.kind,
                            versionId: event.versionId,
                            changes: e.changes.map(diff => [diff[0], diff[1], diff[2].map(cell => cellToDto(cell))])
                        }
                        : (e.kind === notebookCommon_1.NotebookCellsChangeType.Move
                            ? {
                                kind: e.kind,
                                index: e.index,
                                length: e.length,
                                newIdx: e.newIdx,
                                versionId: event.versionId,
                                cells: e.cells.map(cell => cellToDto(cell))
                            }
                            : e);
                    return data;
                });
                this._proxy.acceptModelChanged(modelUrl.toString(), {
                    rawEvents: dto,
                    versionId: event.versionId
                });
            }));
            toDispose.add(model.onWillDispose(() => {
                this._stopModelSync(modelUrl);
            }));
            toDispose.add((0, lifecycle_1.toDisposable)(() => {
                this._proxy.acceptRemovedModel(modelUrl);
            }));
            this._syncedModels[modelUrl] = toDispose;
        }
        _stopModelSync(modelUrl) {
            const toDispose = this._syncedModels[modelUrl];
            delete this._syncedModels[modelUrl];
            delete this._syncedModelsLastUsedTime[modelUrl];
            (0, lifecycle_1.dispose)(toDispose);
        }
    }
    class NotebookWorkerHost {
        constructor(workerClient) {
            this._workerClient = workerClient;
        }
        // foreign host request
        fhr(method, args) {
            return this._workerClient.fhr(method, args);
        }
    }
    class NotebookWorkerClient extends lifecycle_1.Disposable {
        constructor(_notebookService, label) {
            super();
            this._notebookService = _notebookService;
            this._workerFactory = new defaultWorkerFactory_1.DefaultWorkerFactory(label);
            this._worker = null;
            this._modelManager = null;
        }
        // foreign host request
        fhr(method, args) {
            throw new Error(`Not implemented!`);
        }
        computeDiff(original, modified) {
            return this._withSyncedResources([original, modified]).then(proxy => {
                return proxy.computeDiff(original.toString(), modified.toString());
            });
        }
        canPromptRecommendation(modelUri) {
            return this._withSyncedResources([modelUri]).then(proxy => {
                return proxy.canPromptRecommendation(modelUri.toString());
            });
        }
        _getOrCreateModelManager(proxy) {
            if (!this._modelManager) {
                this._modelManager = this._register(new NotebookEditorModelManager(proxy, this._notebookService));
            }
            return this._modelManager;
        }
        _withSyncedResources(resources) {
            return this._getProxy().then((proxy) => {
                this._getOrCreateModelManager(proxy).ensureSyncedResources(resources);
                return proxy;
            });
        }
        _getOrCreateWorker() {
            if (!this._worker) {
                try {
                    this._worker = this._register(new simpleWorker_1.SimpleWorkerClient(this._workerFactory, 'vs/workbench/contrib/notebook/common/services/notebookSimpleWorker', new NotebookWorkerHost(this)));
                }
                catch (err) {
                    // logOnceWebWorkerWarning(err);
                    // this._worker = new SynchronousWorkerClient(new EditorSimpleWorker(new EditorWorkerHost(this), null));
                    throw (err);
                }
            }
            return this._worker;
        }
        _getProxy() {
            return this._getOrCreateWorker().getProxyObject().then(undefined, (err) => {
                // logOnceWebWorkerWarning(err);
                // this._worker = new SynchronousWorkerClient(new EditorSimpleWorker(new EditorWorkerHost(this), null));
                // return this._getOrCreateWorker().getProxyObject();
                throw (err);
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tXb3JrZXJTZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvc2VydmljZXMvbm90ZWJvb2tXb3JrZXJTZXJ2aWNlSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBZ0MsU0FBUSxzQkFBVTtRQUs5RCxZQUNtQixlQUFpQztZQUVuRCxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFDRCxjQUFjLENBQUMsUUFBYSxFQUFFLFFBQWE7WUFDMUMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxXQUFXLENBQUMsUUFBYSxFQUFFLFFBQWE7WUFDdkMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDckQsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMvQyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCx1QkFBdUIsQ0FBQyxLQUFVO1lBQ2pDLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ3JELE9BQU8sTUFBTSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7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