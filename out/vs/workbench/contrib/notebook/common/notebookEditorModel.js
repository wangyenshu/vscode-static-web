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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor/editorModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService"], function (require, exports, buffer_1, errors_1, event_1, lifecycle_1, network_1, objects_1, types_1, configuration_1, editorModel_1, notebookCommon_1, notebookService_1, filesConfigurationService_1) {
    "use strict";
    var SimpleNotebookEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookFileWorkingCopyModelFactory = exports.NotebookFileWorkingCopyModel = exports.SimpleNotebookEditorModel = void 0;
    //#region --- simple content provider
    let SimpleNotebookEditorModel = SimpleNotebookEditorModel_1 = class SimpleNotebookEditorModel extends editorModel_1.EditorModel {
        constructor(resource, _hasAssociatedFilePath, viewType, _workingCopyManager, scratchpad, _filesConfigurationService) {
            super();
            this.resource = resource;
            this._hasAssociatedFilePath = _hasAssociatedFilePath;
            this.viewType = viewType;
            this._workingCopyManager = _workingCopyManager;
            this._filesConfigurationService = _filesConfigurationService;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this._onDidSave = this._register(new event_1.Emitter());
            this._onDidChangeOrphaned = this._register(new event_1.Emitter());
            this._onDidChangeReadonly = this._register(new event_1.Emitter());
            this._onDidRevertUntitled = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this.onDidSave = this._onDidSave.event;
            this.onDidChangeOrphaned = this._onDidChangeOrphaned.event;
            this.onDidChangeReadonly = this._onDidChangeReadonly.event;
            this.onDidRevertUntitled = this._onDidRevertUntitled.event;
            this._workingCopyListeners = this._register(new lifecycle_1.DisposableStore());
            this.scratchPad = scratchpad;
        }
        dispose() {
            this._workingCopy?.dispose();
            super.dispose();
        }
        get notebook() {
            return this._workingCopy?.model?.notebookModel;
        }
        isResolved() {
            return Boolean(this._workingCopy?.model?.notebookModel);
        }
        async canDispose() {
            if (!this._workingCopy) {
                return true;
            }
            if (SimpleNotebookEditorModel_1._isStoredFileWorkingCopy(this._workingCopy)) {
                return this._workingCopyManager.stored.canDispose(this._workingCopy);
            }
            else {
                return true;
            }
        }
        isDirty() {
            return this._workingCopy?.isDirty() ?? false;
        }
        isModified() {
            return this._workingCopy?.isModified() ?? false;
        }
        isOrphaned() {
            return SimpleNotebookEditorModel_1._isStoredFileWorkingCopy(this._workingCopy) && this._workingCopy.hasState(4 /* StoredFileWorkingCopyState.ORPHAN */);
        }
        hasAssociatedFilePath() {
            return !SimpleNotebookEditorModel_1._isStoredFileWorkingCopy(this._workingCopy) && !!this._workingCopy?.hasAssociatedFilePath;
        }
        isReadonly() {
            if (SimpleNotebookEditorModel_1._isStoredFileWorkingCopy(this._workingCopy)) {
                return this._workingCopy?.isReadonly();
            }
            else {
                return this._filesConfigurationService.isReadonly(this.resource);
            }
        }
        get hasErrorState() {
            if (this._workingCopy && 'hasState' in this._workingCopy) {
                return this._workingCopy.hasState(5 /* StoredFileWorkingCopyState.ERROR */);
            }
            return false;
        }
        revert(options) {
            (0, types_1.assertType)(this.isResolved());
            return this._workingCopy.revert(options);
        }
        save(options) {
            (0, types_1.assertType)(this.isResolved());
            return this._workingCopy.save(options);
        }
        async load(options) {
            if (!this._workingCopy || !this._workingCopy.model) {
                if (this.resource.scheme === network_1.Schemas.untitled) {
                    if (this._hasAssociatedFilePath) {
                        this._workingCopy = await this._workingCopyManager.resolve({ associatedResource: this.resource });
                    }
                    else {
                        this._workingCopy = await this._workingCopyManager.resolve({ untitledResource: this.resource, isScratchpad: this.scratchPad });
                    }
                    this._workingCopy.onDidRevert(() => this._onDidRevertUntitled.fire());
                }
                else {
                    this._workingCopy = await this._workingCopyManager.resolve(this.resource, {
                        limits: options?.limits,
                        reload: options?.forceReadFromFile ? { async: false, force: true } : undefined
                    });
                    this._workingCopyListeners.add(this._workingCopy.onDidSave(e => this._onDidSave.fire(e)));
                    this._workingCopyListeners.add(this._workingCopy.onDidChangeOrphaned(() => this._onDidChangeOrphaned.fire()));
                    this._workingCopyListeners.add(this._workingCopy.onDidChangeReadonly(() => this._onDidChangeReadonly.fire()));
                }
                this._workingCopyListeners.add(this._workingCopy.onDidChangeDirty(() => this._onDidChangeDirty.fire(), undefined));
                this._workingCopyListeners.add(this._workingCopy.onWillDispose(() => {
                    this._workingCopyListeners.clear();
                    this._workingCopy?.model?.dispose();
                }));
            }
            else {
                await this._workingCopyManager.resolve(this.resource, {
                    reload: {
                        async: !options?.forceReadFromFile,
                        force: options?.forceReadFromFile
                    },
                    limits: options?.limits
                });
            }
            (0, types_1.assertType)(this.isResolved());
            return this;
        }
        async saveAs(target) {
            const newWorkingCopy = await this._workingCopyManager.saveAs(this.resource, target);
            if (!newWorkingCopy) {
                return undefined;
            }
            // this is a little hacky because we leave the new working copy alone. BUT
            // the newly created editor input will pick it up and claim ownership of it.
            return { resource: newWorkingCopy.resource };
        }
        static _isStoredFileWorkingCopy(candidate) {
            const isUntitled = candidate && candidate.capabilities & 2 /* WorkingCopyCapabilities.Untitled */;
            return !isUntitled;
        }
    };
    exports.SimpleNotebookEditorModel = SimpleNotebookEditorModel;
    exports.SimpleNotebookEditorModel = SimpleNotebookEditorModel = SimpleNotebookEditorModel_1 = __decorate([
        __param(5, filesConfigurationService_1.IFilesConfigurationService)
    ], SimpleNotebookEditorModel);
    class NotebookFileWorkingCopyModel extends lifecycle_1.Disposable {
        constructor(_notebookModel, _notebookService, _configurationService) {
            super();
            this._notebookModel = _notebookModel;
            this._notebookService = _notebookService;
            this._configurationService = _configurationService;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this.configuration = undefined;
            this.onWillDispose = _notebookModel.onWillDispose.bind(_notebookModel);
            this._register(_notebookModel.onDidChangeContent(e => {
                for (const rawEvent of e.rawEvents) {
                    if (rawEvent.kind === notebookCommon_1.NotebookCellsChangeType.Initialize) {
                        continue;
                    }
                    if (rawEvent.transient) {
                        continue;
                    }
                    this._onDidChangeContent.fire({
                        isRedoing: false, //todo@rebornix forward this information from notebook model
                        isUndoing: false,
                        isInitial: false, //_notebookModel.cells.length === 0 // todo@jrieken non transient metadata?
                    });
                    break;
                }
            }));
            const saveWithReducedCommunication = this._configurationService.getValue(notebookCommon_1.NotebookSetting.remoteSaving);
            if (saveWithReducedCommunication || _notebookModel.uri.scheme === network_1.Schemas.vscodeRemote) {
                this.configuration = {
                    // Intentionally pick a larger delay for triggering backups to allow auto-save
                    // to complete first on the optimized save path
                    backupDelay: 10000
                };
            }
            // Override save behavior to avoid transferring the buffer across the wire 3 times
            if (saveWithReducedCommunication) {
                this.save = async (options, token) => {
                    const serializer = await this.getNotebookSerializer();
                    if (token.isCancellationRequested) {
                        throw new errors_1.CancellationError();
                    }
                    const stat = await serializer.save(this._notebookModel.uri, this._notebookModel.versionId, options, token);
                    return stat;
                };
            }
        }
        dispose() {
            this._notebookModel.dispose();
            super.dispose();
        }
        get notebookModel() {
            return this._notebookModel;
        }
        async snapshot(context, token) {
            const serializer = await this.getNotebookSerializer();
            const data = {
                metadata: (0, objects_1.filter)(this._notebookModel.metadata, key => !serializer.options.transientDocumentMetadata[key]),
                cells: [],
            };
            let outputSize = 0;
            for (const cell of this._notebookModel.cells) {
                const cellData = {
                    cellKind: cell.cellKind,
                    language: cell.language,
                    mime: cell.mime,
                    source: cell.getValue(),
                    outputs: [],
                    internalMetadata: cell.internalMetadata
                };
                const outputSizeLimit = this._configurationService.getValue(notebookCommon_1.NotebookSetting.outputBackupSizeLimit) * 1024;
                if (context === 2 /* SnapshotContext.Backup */ && outputSizeLimit > 0) {
                    cell.outputs.forEach(output => {
                        output.outputs.forEach(item => {
                            outputSize += item.data.byteLength;
                        });
                    });
                    if (outputSize > outputSizeLimit) {
                        throw new Error('Notebook too large to backup');
                    }
                }
                cellData.outputs = !serializer.options.transientOutputs ? cell.outputs : [];
                cellData.metadata = (0, objects_1.filter)(cell.metadata, key => !serializer.options.transientCellMetadata[key]);
                data.cells.push(cellData);
            }
            const bytes = await serializer.notebookToData(data);
            if (token.isCancellationRequested) {
                throw new errors_1.CancellationError();
            }
            return (0, buffer_1.bufferToStream)(bytes);
        }
        async update(stream, token) {
            const serializer = await this.getNotebookSerializer();
            const bytes = await (0, buffer_1.streamToBuffer)(stream);
            const data = await serializer.dataToNotebook(bytes);
            if (token.isCancellationRequested) {
                throw new errors_1.CancellationError();
            }
            this._notebookModel.reset(data.cells, data.metadata, serializer.options);
        }
        async getNotebookSerializer() {
            const info = await this._notebookService.withNotebookDataProvider(this.notebookModel.viewType);
            if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
                throw new Error('CANNOT open file notebook with this provider');
            }
            return info.serializer;
        }
        get versionId() {
            return this._notebookModel.alternativeVersionId;
        }
        pushStackElement() {
            this._notebookModel.pushStackElement();
        }
    }
    exports.NotebookFileWorkingCopyModel = NotebookFileWorkingCopyModel;
    let NotebookFileWorkingCopyModelFactory = class NotebookFileWorkingCopyModelFactory {
        constructor(_viewType, _notebookService, _configurationService) {
            this._viewType = _viewType;
            this._notebookService = _notebookService;
            this._configurationService = _configurationService;
        }
        async createModel(resource, stream, token) {
            const info = await this._notebookService.withNotebookDataProvider(this._viewType);
            if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
                throw new Error('CANNOT open file notebook with this provider');
            }
            const bytes = await (0, buffer_1.streamToBuffer)(stream);
            const data = await info.serializer.dataToNotebook(bytes);
            if (token.isCancellationRequested) {
                throw new errors_1.CancellationError();
            }
            const notebookModel = this._notebookService.createNotebookTextModel(info.viewType, resource, data, info.serializer.options);
            return new NotebookFileWorkingCopyModel(notebookModel, this._notebookService, this._configurationService);
        }
    };
    exports.NotebookFileWorkingCopyModelFactory = NotebookFileWorkingCopyModelFactory;
    exports.NotebookFileWorkingCopyModelFactory = NotebookFileWorkingCopyModelFactory = __decorate([
        __param(1, notebookService_1.INotebookService),
        __param(2, configuration_1.IConfigurationService)
    ], NotebookFileWorkingCopyModelFactory);
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2NvbW1vbi9ub3RlYm9va0VkaXRvck1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwQmhHLHFDQUFxQztJQUU5QixJQUFNLHlCQUF5QixpQ0FBL0IsTUFBTSx5QkFBMEIsU0FBUSx5QkFBVztRQWtCekQsWUFDVSxRQUFhLEVBQ0wsc0JBQStCLEVBQ3ZDLFFBQWdCLEVBQ1IsbUJBQXdHLEVBQ3pILFVBQW1CLEVBQ1MsMEJBQXVFO1lBRW5HLEtBQUssRUFBRSxDQUFDO1lBUEMsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUNMLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBUztZQUN2QyxhQUFRLEdBQVIsUUFBUSxDQUFRO1lBQ1Isd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxRjtZQUU1RSwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTRCO1lBdEJuRixzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN4RCxlQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBbUMsQ0FBQyxDQUFDO1lBQzVFLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzNELHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzNELHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBRW5FLHFCQUFnQixHQUFnQixJQUFJLENBQUMsaUJBQWlC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