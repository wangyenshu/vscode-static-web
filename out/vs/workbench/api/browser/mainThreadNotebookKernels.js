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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/workbench/api/browser/mainThreadNotebookDto", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "../common/extHost.protocol", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/common/async"], function (require, exports, arrays_1, cancellation_1, errors_1, event_1, lifecycle_1, uri_1, language_1, mainThreadNotebookDto_1, extHostCustomers_1, notebookEditorService_1, notebookExecutionStateService_1, notebookKernelService_1, extHost_protocol_1, notebookService_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebookKernels = void 0;
    class MainThreadKernel {
        get preloadUris() {
            return this.preloads.map(p => p.uri);
        }
        get preloadProvides() {
            return this.preloads.flatMap(p => p.provides);
        }
        constructor(data, _languageService) {
            this._languageService = _languageService;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.id = data.id;
            this.viewType = data.notebookType;
            this.extension = data.extensionId;
            this.implementsInterrupt = data.supportsInterrupt ?? false;
            this.label = data.label;
            this.description = data.description;
            this.detail = data.detail;
            this.supportedLanguages = (0, arrays_1.isNonEmptyArray)(data.supportedLanguages) ? data.supportedLanguages : _languageService.getRegisteredLanguageIds();
            this.implementsExecutionOrder = data.supportsExecutionOrder ?? false;
            this.hasVariableProvider = data.hasVariableProvider ?? false;
            this.localResourceRoot = uri_1.URI.revive(data.extensionLocation);
            this.preloads = data.preloads?.map(u => ({ uri: uri_1.URI.revive(u.uri), provides: u.provides })) ?? [];
        }
        update(data) {
            const event = Object.create(null);
            if (data.label !== undefined) {
                this.label = data.label;
                event.label = true;
            }
            if (data.description !== undefined) {
                this.description = data.description;
                event.description = true;
            }
            if (data.detail !== undefined) {
                this.detail = data.detail;
                event.detail = true;
            }
            if (data.supportedLanguages !== undefined) {
                this.supportedLanguages = (0, arrays_1.isNonEmptyArray)(data.supportedLanguages) ? data.supportedLanguages : this._languageService.getRegisteredLanguageIds();
                event.supportedLanguages = true;
            }
            if (data.supportsExecutionOrder !== undefined) {
                this.implementsExecutionOrder = data.supportsExecutionOrder;
                event.hasExecutionOrder = true;
            }
            if (data.supportsInterrupt !== undefined) {
                this.implementsInterrupt = data.supportsInterrupt;
                event.hasInterruptHandler = true;
            }
            if (data.hasVariableProvider !== undefined) {
                this.hasVariableProvider = data.hasVariableProvider;
                event.hasVariableProvider = true;
            }
            this._onDidChange.fire(event);
        }
    }
    class MainThreadKernelDetectionTask {
        constructor(notebookType) {
            this.notebookType = notebookType;
        }
    }
    let MainThreadNotebookKernels = class MainThreadNotebookKernels {
        constructor(extHostContext, _languageService, _notebookKernelService, _notebookExecutionStateService, _notebookService, notebookEditorService) {
            this._languageService = _languageService;
            this._notebookKernelService = _notebookKernelService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._notebookService = _notebookService;
            this._editors = new lifecycle_1.DisposableMap();
            this._disposables = new lifecycle_1.DisposableStore();
            this._kernels = new Map();
            this._kernelDetectionTasks = new Map();
            this._kernelSourceActionProviders = new Map();
            this._kernelSourceActionProvidersEventRegistrations = new Map();
            this._executions = new Map();
            this._notebookExecutions = new Map();
            this.variableRequestIndex = 0;
            this.variableRequestMap = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebookKernels);
            notebookEditorService.listNotebookEditors().forEach(this._onEditorAdd, this);
            notebookEditorService.onDidAddNotebookEditor(this._onEditorAdd, this, this._disposables);
            notebookEditorService.onDidRemoveNotebookEditor(this._onEditorRemove, this, this._disposables);
            this._disposables.add((0, lifecycle_1.toDisposable)(() => {
                // EH shut down, complete all executions started by this EH
                this._executions.forEach(e => {
                    e.complete({});
                });
                this._notebookExecutions.forEach(e => e.complete());
            }));
            this._disposables.add(this._notebookExecutionStateService.onDidChangeExecution(e => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell) {
                    this._proxy.$cellExecutionChanged(e.notebook, e.cellHandle, e.changed?.state);
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
            for (const [, registration] of this._kernels.values()) {
                registration.dispose();
            }
            for (const [, registration] of this._kernelDetectionTasks.values()) {
                registration.dispose();
            }
            for (const [, registration] of this._kernelSourceActionProviders.values()) {
                registration.dispose();
            }
            this._editors.dispose();
        }
        // --- kernel ipc
        _onEditorAdd(editor) {
            const ipcListener = editor.onDidReceiveMessage(e => {
                if (!editor.hasModel()) {
                    return;
                }
                const { selected } = this._notebookKernelService.getMatchingKernel(editor.textModel);
                if (!selected) {
                    return;
                }
                for (const [handle, candidate] of this._kernels) {
                    if (candidate[0] === selected) {
                        this._proxy.$acceptKernelMessageFromRenderer(handle, editor.getId(), e.message);
                        break;
                    }
                }
            });
            this._editors.set(editor, ipcListener);
        }
        _onEditorRemove(editor) {
            this._editors.deleteAndDispose(editor);
        }
        async $postMessage(handle, editorId, message) {
            const tuple = this._kernels.get(handle);
            if (!tuple) {
                throw new Error('kernel already disposed');
            }
            const [kernel] = tuple;
            let didSend = false;
            for (const [editor] of this._editors) {
                if (!editor.hasModel()) {
                    continue;
                }
                if (this._notebookKernelService.getMatchingKernel(editor.textModel).selected !== kernel) {
                    // different kernel
                    continue;
                }
                if (editorId === undefined) {
                    // all editors
                    editor.postMessage(message);
                    didSend = true;
                }
                else if (editor.getId() === editorId) {
                    // selected editors
                    editor.postMessage(message);
                    didSend = true;
                    break;
                }
            }
            return didSend;
        }
        $receiveVariable(requestId, variable) {
            const source = this.variableRequestMap.get(requestId);
            if (source) {
                source.emitOne(variable);
            }
        }
        // --- kernel adding/updating/removal
        async $addKernel(handle, data) {
            const that = this;
            const kernel = new class extends MainThreadKernel {
                async executeNotebookCellsRequest(uri, handles) {
                    await that._proxy.$executeCells(handle, uri, handles);
                }
                async cancelNotebookCellExecution(uri, handles) {
                    await that._proxy.$cancelCells(handle, uri, handles);
                }
                provideVariables(notebookUri, parentId, kind, start, token) {
                    const requestId = `${handle}variables${that.variableRequestIndex++}`;
                    if (that.variableRequestMap.has(requestId)) {
                        return that.variableRequestMap.get(requestId).asyncIterable;
                    }
                    const source = new async_1.AsyncIterableSource();
                    that.variableRequestMap.set(requestId, source);
                    that._proxy.$provideVariables(handle, requestId, notebookUri, parentId, kind, start, token).then(() => {
                        source.resolve();
                        that.variableRequestMap.delete(requestId);
                    }).catch((err) => {
                        source.reject(err);
                        that.variableRequestMap.delete(requestId);
                    });
                    return source.asyncIterable;
                }
            }(data, this._languageService);
            const listener = this._notebookKernelService.onDidChangeSelectedNotebooks(e => {
                if (e.oldKernel === kernel.id) {
                    this._proxy.$acceptNotebookAssociation(handle, e.notebook, false);
                }
                else if (e.newKernel === kernel.id) {
                    this._proxy.$acceptNotebookAssociation(handle, e.notebook, true);
                }
            });
            const registration = this._notebookKernelService.registerKernel(kernel);
            this._kernels.set(handle, [kernel, (0, lifecycle_1.combinedDisposable)(listener, registration)]);
        }
        $updateKernel(handle, data) {
            const tuple = this._kernels.get(handle);
            if (tuple) {
                tuple[0].update(data);
            }
        }
        $removeKernel(handle) {
            const tuple = this._kernels.get(handle);
            if (tuple) {
                tuple[1].dispose();
                this._kernels.delete(handle);
            }
        }
        $updateNotebookPriority(handle, notebook, value) {
            const tuple = this._kernels.get(handle);
            if (tuple) {
                this._notebookKernelService.updateKernelNotebookAffinity(tuple[0], uri_1.URI.revive(notebook), value);
            }
        }
        // --- Cell execution
        $createExecution(handle, controllerId, rawUri, cellHandle) {
            const uri = uri_1.URI.revive(rawUri);
            const notebook = this._notebookService.getNotebookTextModel(uri);
            if (!notebook) {
                throw new Error(`Notebook not found: ${uri.toString()}`);
            }
            const kernel = this._notebookKernelService.getMatchingKernel(notebook);
            if (!kernel.selected || kernel.selected.id !== controllerId) {
                throw new Error(`Kernel is not selected: ${kernel.selected?.id} !== ${controllerId}`);
            }
            const execution = this._notebookExecutionStateService.createCellExecution(uri, cellHandle);
            execution.confirm();
            this._executions.set(handle, execution);
        }
        $updateExecution(handle, data) {
            const updates = data.value;
            try {
                const execution = this._executions.get(handle);
                execution?.update(updates.map(mainThreadNotebookDto_1.NotebookDto.fromCellExecuteUpdateDto));
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
        }
        $completeExecution(handle, data) {
            try {
                const execution = this._executions.get(handle);
                execution?.complete(mainThreadNotebookDto_1.NotebookDto.fromCellExecuteCompleteDto(data.value));
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
            finally {
                this._executions.delete(handle);
            }
        }
        // --- Notebook execution
        $createNotebookExecution(handle, controllerId, rawUri) {
            const uri = uri_1.URI.revive(rawUri);
            const notebook = this._notebookService.getNotebookTextModel(uri);
            if (!notebook) {
                throw new Error(`Notebook not found: ${uri.toString()}`);
            }
            const kernel = this._notebookKernelService.getMatchingKernel(notebook);
            if (!kernel.selected || kernel.selected.id !== controllerId) {
                throw new Error(`Kernel is not selected: ${kernel.selected?.id} !== ${controllerId}`);
            }
            const execution = this._notebookExecutionStateService.createExecution(uri);
            execution.confirm();
            this._notebookExecutions.set(handle, execution);
        }
        $beginNotebookExecution(handle) {
            try {
                const execution = this._notebookExecutions.get(handle);
                execution?.begin();
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
        }
        $completeNotebookExecution(handle) {
            try {
                const execution = this._notebookExecutions.get(handle);
                execution?.complete();
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
            finally {
                this._notebookExecutions.delete(handle);
            }
        }
        // --- notebook kernel detection task
        async $addKernelDetectionTask(handle, notebookType) {
            const kernelDetectionTask = new MainThreadKernelDetectionTask(notebookType);
            const registration = this._notebookKernelService.registerNotebookKernelDetectionTask(kernelDetectionTask);
            this._kernelDetectionTasks.set(handle, [kernelDetectionTask, registration]);
        }
        $removeKernelDetectionTask(handle) {
            const tuple = this._kernelDetectionTasks.get(handle);
            if (tuple) {
                tuple[1].dispose();
                this._kernelDetectionTasks.delete(handle);
            }
        }
        // --- notebook kernel source action provider
        async $addKernelSourceActionProvider(handle, eventHandle, notebookType) {
            const kernelSourceActionProvider = {
                viewType: notebookType,
                provideKernelSourceActions: async () => {
                    const actions = await this._proxy.$provideKernelSourceActions(handle, cancellation_1.CancellationToken.None);
                    return actions.map(action => {
                        let documentation = action.documentation;
                        if (action.documentation && typeof action.documentation !== 'string') {
                            documentation = uri_1.URI.revive(action.documentation);
                        }
                        return {
                            label: action.label,
                            command: action.command,
                            description: action.description,
                            detail: action.detail,
                            documentation,
                        };
                    });
                }
            };
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._kernelSourceActionProvidersEventRegistrations.set(eventHandle, emitter);
                kernelSourceActionProvider.onDidChangeSourceActions = emitter.event;
            }
            const registration = this._notebookKernelService.registerKernelSourceActionProvider(notebookType, kernelSourceActionProvider);
            this._kernelSourceActionProviders.set(handle, [kernelSourceActionProvider, registration]);
        }
        $removeKernelSourceActionProvider(handle, eventHandle) {
            const tuple = this._kernelSourceActionProviders.get(handle);
            if (tuple) {
                tuple[1].dispose();
                this._kernelSourceActionProviders.delete(handle);
            }
            if (typeof eventHandle === 'number') {
                this._kernelSourceActionProvidersEventRegistrations.delete(eventHandle);
            }
        }
        $emitNotebookKernelSourceActionsChangeEvent(eventHandle) {
            const emitter = this._kernelSourceActionProvidersEventRegistrations.get(eventHandle);
            if (emitter instanceof event_1.Emitter) {
                emitter.fire(undefined);
            }
        }
        $variablesUpdated(notebookUri) {
            this._notebookKernelService.notifyVariablesChange(uri_1.URI.revive(notebookUri));
        }
    };
    exports.MainThreadNotebookKernels = MainThreadNotebookKernels;
    exports.MainThreadNotebookKernels = MainThreadNotebookKernels = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadNotebookKernels),
        __param(1, language_1.ILanguageService),
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(4, notebookService_1.INotebookService),
        __param(5, notebookEditorService_1.INotebookEditorService)
    ], MainThreadNotebookKernels);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rS2VybmVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkTm90ZWJvb2tLZXJuZWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFCaEcsTUFBZSxnQkFBZ0I7UUFrQjlCLElBQVcsV0FBVztZQUNyQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxJQUFXLGVBQWU7WUFDekIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQsWUFBWSxJQUF5QixFQUFVLGdCQUFrQztZQUFsQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBekJoRSxpQkFBWSxHQUFHLElBQUksZUFBTyxFQUE4QixDQUFDO1lBRWpFLGdCQUFXLEdBQXNDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBd0JqRixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUVsQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQztZQUMzRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDeEIsSUFBSSxDQUFDLFdB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