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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/webview/common/webview", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/workbench/contrib/notebook/common/notebookKernelService"], function (require, exports, arrays_1, async_1, cancellation_1, event_1, lifecycle_1, map_1, uri_1, extensions_1, log_1, extHost_protocol_1, extHostCommands_1, extHostTypeConverters, extHostTypes_1, webview_1, notebookExecutionService_1, extensions_2, proxyIdentifier_1, notebookKernelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookKernels = void 0;
    exports.createKernelId = createKernelId;
    let ExtHostNotebookKernels = class ExtHostNotebookKernels {
        constructor(mainContext, _initData, _extHostNotebook, _commands, _logService) {
            this._initData = _initData;
            this._extHostNotebook = _extHostNotebook;
            this._commands = _commands;
            this._logService = _logService;
            this._activeExecutions = new map_1.ResourceMap();
            this._activeNotebookExecutions = new map_1.ResourceMap();
            this._kernelDetectionTask = new Map();
            this._kernelDetectionTaskHandlePool = 0;
            this._kernelSourceActionProviders = new Map();
            this._kernelSourceActionProviderHandlePool = 0;
            this._kernelData = new Map();
            this._handlePool = 0;
            this._onDidChangeCellExecutionState = new event_1.Emitter();
            this.onDidChangeNotebookCellExecutionState = this._onDidChangeCellExecutionState.event;
            this.id = 0;
            this.variableStore = {};
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookKernels);
            // todo@rebornix @joyceerhl: move to APICommands once stabilized.
            const selectKernelApiCommand = new extHostCommands_1.ApiCommand('notebook.selectKernel', '_notebook.selectKernel', 'Trigger kernel picker for specified notebook editor widget', [
                new extHostCommands_1.ApiCommandArgument('options', 'Select kernel options', v => true, (v) => {
                    if (v && 'notebookEditor' in v && 'id' in v) {
                        const notebookEditorId = this._extHostNotebook.getIdByEditor(v.notebookEditor);
                        return {
                            id: v.id, extension: v.extension, notebookEditorId
                        };
                    }
                    else if (v && 'notebookEditor' in v) {
                        const notebookEditorId = this._extHostNotebook.getIdByEditor(v.notebookEditor);
                        if (notebookEditorId === undefined) {
                            throw new Error(`Cannot invoke 'notebook.selectKernel' for unrecognized notebook editor ${v.notebookEditor.notebook.uri.toString()}`);
                        }
                        return { notebookEditorId };
                    }
                    return v;
                })
            ], extHostCommands_1.ApiCommandResult.Void);
            const requestKernelVariablesApiCommand = new extHostCommands_1.ApiCommand('vscode.executeNotebookVariableProvider', '_executeNotebookVariableProvider', 'Execute notebook variable provider', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of variables', (value, apiArgs) => {
                return value.map(variable => {
                    return {
                        variable: {
                            name: variable.name,
                            value: variable.value,
                            expression: variable.expression,
                            type: variable.type,
                            language: variable.language
                        },
                        hasNamedChildren: variable.hasNamedChildren,
                        indexedChildrenCount: variable.indexedChildrenCount
                    };
                });
            }));
            this._commands.registerApiCommand(selectKernelApiCommand);
            this._commands.registerApiCommand(requestKernelVariablesApiCommand);
        }
        createNotebookController(extension, id, viewType, label, handler, preloads) {
            for (const data of this._kernelData.values()) {
                if (data.controller.id === id && extensions_1.ExtensionIdentifier.equals(extension.identifier, data.extensionId)) {
                    throw new Error(`notebook controller with id '${id}' ALREADY exist`);
                }
            }
            const handle = this._handlePool++;
            const that = this;
            this._logService.trace(`NotebookController[${handle}], CREATED by ${extension.identifier.value}, ${id}`);
            const _defaultExecutHandler = () => console.warn(`NO execute handler from notebook controller '${data.id}' of extension: '${extension.identifier}'`);
            let isDisposed = false;
            const onDidChangeSelection = new event_1.Emitter();
            const onDidReceiveMessage = new event_1.Emitter();
            const data = {
                id: createKernelId(extension.identifier, id),
                notebookType: viewType,
                extensionId: extension.identifier,
                extensionLocation: extension.extensionLocation,
                label: label || extension.identifier.value,
                preloads: preloads ? preloads.map(extHostTypeConverters.NotebookRendererScript.from) : []
            };
            //
            let _executeHandler = handler ?? _defaultExecutHandler;
            let _interruptHandler;
            let _variableProvider;
            this._proxy.$addKernel(handle, data).catch(err => {
                // this can happen when a kernel with that ID is already registered
                console.log(err);
                isDisposed = true;
            });
            // update: all setters write directly into the dto object
            // and trigger an update. the actual update will only happen
            // once per event loop execution
            let tokenPool = 0;
            const _update = () => {
                if (isDisposed) {
                    return;
                }
                const myToken = ++tokenPool;
                Promise.resolve().then(() => {
                    if (myToken === tokenPool) {
                        this._proxy.$updateKernel(handle, data);
                    }
                });
            };
            // notebook documents that are associated to this controller
            const associatedNotebooks = new map_1.ResourceMap();
            const controller = {
                get id() { return id; },
                get notebookType() { return data.notebookType; },
                onDidChangeSelectedNotebooks: onDidChangeSelection.event,
                get label() {
                    return data.label;
                },
                set label(value) {
                    data.label = value ?? extension.displayName ?? extension.name;
                    _update();
                },
                get detail() {
                    return data.detail ?? '';
                },
                set detail(value) {
                    data.detail = value;
                    _update();
                },
                get description() {
                    return data.description ?? '';
                },
                set description(value) {
                    data.description = value;
                    _update();
                },
                get supportedLanguages() {
                    return data.supportedLanguages;
                },
                set supportedLanguages(value) {
                    data.supportedLanguages = value;
                    _update();
                },
                get supportsExecutionOrder() {
                    return data.supportsExecutionOrder ?? false;
                },
                set supportsExecutionOrder(value) {
                    data.supportsExecutionOrder = value;
                    _update();
                },
                get rendererScripts() {
                    return data.preloads ? data.preloads.map(extHostTypeConverters.NotebookRendererScript.to) : [];
                },
                get executeHandler() {
                    return _executeHandler;
                },
                set executeHandler(value) {
                    _executeHandler = value ?? _defaultExecutHandler;
                },
                get interruptHandler() {
                    return _interruptHandler;
                },
                set interruptHandler(value) {
                    _interruptHandler = value;
                    data.supportsInterrupt = Boolean(value);
                    _update();
                },
                set variableProvider(value) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookVariableProvider');
                    _variableProvider = value;
                    data.hasVariableProvider = !!value;
                    value?.onDidChangeVariables(e => that._proxy.$variablesUpdated(e.uri));
                    _update();
                },
                get variableProvider() {
                    return _variableProvider;
                },
                createNotebookCellExecution(cell) {
                    if (isDisposed) {
                        throw new Error('notebook controller is DISPOSED');
                    }
                    if (!associatedNotebooks.has(cell.notebook.uri)) {
                        that._logService.trace(`NotebookController[${handle}] NOT associated to notebook, associated to THESE notebooks:`, Array.from(associatedNotebooks.keys()).map(u => u.toString()));
                        throw new Error(`notebook controller is NOT associated to notebook: ${cell.notebook.uri.toString()}`);
                    }
                    return that._createNotebookCellExecution(cell, createKernelId(extension.identifier, this.id));
                },
                createNotebookExecution(notebook) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookExecution');
                    if (isDisposed) {
                        throw new Error('notebook controller is DISPOSED');
                    }
                    if (!associatedNotebooks.has(notebook.uri)) {
                        that._logService.trace(`NotebookController[${handle}] NOT associated to notebook, associated to THESE notebooks:`, Array.from(associatedNotebooks.keys()).map(u => u.toString()));
                        throw new Error(`notebook controller is NOT associated to notebook: ${notebook.uri.toString()}`);
                    }
                    return that._createNotebookExecution(notebook, createKernelId(extension.identifier, this.id));
                },
                dispose: () => {
                    if (!isDisposed) {
                        this._logService.trace(`NotebookController[${handle}], DISPOSED`);
                        isDisposed = true;
                        this._kernelData.delete(handle);
                        onDidChangeSelection.dispose();
                        onDidReceiveMessage.dispose();
                        this._proxy.$removeKernel(handle);
                    }
                },
                // --- priority
                updateNotebookAffinity(notebook, priority) {
                    if (priority === extHostTypes_1.NotebookControllerAffinity2.Hidden) {
                        // This api only adds an extra enum value, the function is the same, so just gate on the new value being passed
                        // for proposedAPI check.
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookControllerAffinityHidden');
                    }
                    that._proxy.$updateNotebookPriority(handle, notebook.uri, priority);
                },
                // --- ipc
                onDidReceiveMessage: onDidReceiveMessage.event,
                postMessage(message, editor) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookMessaging');
                    return that._proxy.$postMessage(handle, editor && that._extHostNotebook.getIdByEditor(editor), message);
                },
                asWebviewUri(uri) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookMessaging');
                    return (0, webview_1.asWebviewUri)(uri, that._initData.remote);
                },
            };
            this._kernelData.set(handle, {
                extensionId: extension.identifier,
                controller,
                onDidReceiveMessage,
                onDidChangeSelection,
                associatedNotebooks
            });
            return controller;
        }
        getIdByController(controller) {
            for (const [_, candidate] of this._kernelData) {
                if (candidate.controller === controller) {
                    return createKernelId(candidate.extensionId, controller.id);
                }
            }
            return null;
        }
        createNotebookControllerDetectionTask(extension, viewType) {
            const handle = this._kernelDetectionTaskHandlePool++;
            const that = this;
            this._logService.trace(`NotebookControllerDetectionTask[${handle}], CREATED by ${extension.identifier.value}`);
            this._proxy.$addKernelDetectionTask(handle, viewType);
            const detectionTask = {
                dispose: () => {
                    this._kernelDetectionTask.delete(handle);
                    that._proxy.$removeKernelDetectionTask(handle);
                }
            };
            this._kernelDetectionTask.set(handle, detectionTask);
            return detectionTask;
        }
        registerKernelSourceActionProvider(extension, viewType, provider) {
            const handle = this._kernelSourceActionProviderHandlePool++;
            const eventHandle = typeof provider.onDidChangeNotebookKernelSourceActions === 'function' ? handle : undefined;
            const that = this;
            this._kernelSourceActionProviders.set(handle, provider);
            this._logService.trace(`NotebookKernelSourceActionProvider[${handle}], CREATED by ${extension.identifier.value}`);
            this._proxy.$addKernelSourceActionProvider(handle, handle, viewType);
            let subscription;
            if (eventHandle !== undefined) {
                subscription = provider.onDidChangeNotebookKernelSourceActions(_ => this._proxy.$emitNotebookKernelSourceActionsChangeEvent(eventHandle));
            }
            return {
                dispose: () => {
                    this._kernelSourceActionProviders.delete(handle);
                    that._proxy.$removeKernelSourceActionProvider(handle, handle);
                    subscription?.dispose();
                }
            };
        }
        async $provideKernelSourceActions(handle, token) {
            const provider = this._kernelSourceActionProviders.get(handle);
            if (provider) {
                const disposables = new lifecycle_1.DisposableStore();
                const ret = await provider.provideNotebookKernelSourceActions(token);
                return (ret ?? []).map(item => extHostTypeConverters.NotebookKernelSourceAction.from(item, this._commands.converter, disposables));
            }
            return [];
        }
        $acceptNotebookAssociation(handle, uri, value) {
            const obj = this._kernelData.get(handle);
            if (obj) {
                // update data structure
                const notebook = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
                if (value) {
                    obj.associatedNotebooks.set(notebook.uri, true);
                }
                else {
                    obj.associatedNotebooks.delete(notebook.uri);
                }
                this._logService.trace(`NotebookController[${handle}] ASSOCIATE notebook`, notebook.uri.toString(), value);
                // send event
                obj.onDidChangeSelection.fire({
                    selected: value,
                    notebook: notebook.apiNotebook
                });
            }
        }
        async $executeCells(handle, uri, handles) {
            const obj = this._kernelData.get(handle);
            if (!obj) {
                // extension can dispose kernels in the meantime
                return;
            }
            const document = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
            const cells = [];
            for (const cellHandle of handles) {
                const cell = document.getCell(cellHandle);
                if (cell) {
                    cells.push(cell.apiCell);
                }
            }
            try {
                this._logService.trace(`NotebookController[${handle}] EXECUTE cells`, document.uri.toString(), cells.length);
                await obj.controller.executeHandler.call(obj.controller, cells, document.apiNotebook, obj.controller);
            }
            catch (err) {
                //
                this._logService.error(`NotebookController[${handle}] execute cells FAILED`, err);
                console.error(err);
            }
        }
        async $cancelCells(handle, uri, handles) {
            const obj = this._kernelData.get(handle);
            if (!obj) {
                // extension can dispose kernels in the meantime
                return;
            }
            // cancel or interrupt depends on the controller. When an interrupt handler is used we
            // don't trigger the cancelation token of executions.
            const document = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
            if (obj.controller.interruptHandler) {
                await obj.controller.interruptHandler.call(obj.controller, document.apiNotebook);
            }
            else {
                for (const cellHandle of handles) {
                    const cell = document.getCell(cellHandle);
                    if (cell) {
                        this._activeExecutions.get(cell.uri)?.cancel();
                    }
                }
            }
            if (obj.controller.interruptHandler) {
                // If we're interrupting all cells, we also need to cancel the notebook level execution.
                const items = this._activeNotebookExecutions.get(document.uri);
                if (handles.length && Array.isArray(items) && items.length) {
                    items.forEach(d => d.dispose());
                }
            }
        }
        async $provideVariables(handle, requestId, notebookUri, parentId, kind, start, token) {
            const obj = this._kernelData.get(handle);
            if (!obj) {
                return;
            }
            const document = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(notebookUri));
            const variableProvider = obj.controller.variableProvider;
            if (!variableProvider) {
                return;
            }
            let parent = undefined;
            if (parentId !== undefined) {
                parent = this.variableStore[parentId];
                if (!parent) {
                    // request for unknown parent
                    return;
                }
            }
            else {
                // root request, clear store
                this.variableStore = {};
            }
            const requestKind = kind === 'named' ? extHostTypes_1.NotebookVariablesRequestKind.Named : extHostTypes_1.NotebookVariablesRequestKind.Indexed;
            const variableResults = variableProvider.provideVariables(document.apiNotebook, parent, requestKind, start, token);
            let resultCount = 0;
            for await (const result of variableResults) {
                if (token.isCancellationRequested) {
                    return;
                }
                const variable = {
                    id: this.id++,
                    name: result.variable.name,
                    value: result.variable.value,
                    type: result.variable.type,
                    interfaces: result.variable.interfaces,
                    language: result.variable.language,
                    expression: result.variable.expression,
                    hasNamedChildren: result.hasNamedChildren,
                    indexedChildrenCount: result.indexedChildrenCount,
                    extensionId: obj.extensionId.value,
                };
                this.variableStore[variable.id] = result.variable;
                this._proxy.$receiveVariable(requestId, variable);
                if (resultCount++ >= notebookKernelService_1.variablePageSize) {
                    return;
                }
            }
        }
        $acceptKernelMessageFromRenderer(handle, editorId, message) {
            const obj = this._kernelData.get(handle);
            if (!obj) {
                // extension can dispose kernels in the meantime
                return;
            }
            const editor = this._extHostNotebook.getEditorById(editorId);
            obj.onDidReceiveMessage.fire(Object.freeze({ editor: editor.apiEditor, message }));
        }
        $cellExecutionChanged(uri, cellHandle, state) {
            const document = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
            const cell = document.getCell(cellHandle);
            if (cell) {
                const newState = state ? extHostTypeConverters.NotebookCellExecutionState.to(state) : extHostTypes_1.NotebookCellExecutionState.Idle;
                if (newState !== undefined) {
                    this._onDidChangeCellExecutionState.fire({
                        cell: cell.apiCell,
                        state: newState
                    });
                }
            }
        }
        // ---
        _createNotebookCellExecution(cell, controllerId) {
            if (cell.index < 0) {
                throw new Error('CANNOT execute cell that has been REMOVED from notebook');
            }
            const notebook = this._extHostNotebook.getNotebookDocument(cell.notebook.uri);
            const cellObj = notebook.getCellFromApiCell(cell);
            if (!cellObj) {
                throw new Error('invalid cell');
            }
            if (this._activeExecutions.has(cellObj.uri)) {
                throw new Error(`duplicate execution for ${cellObj.uri}`);
            }
            const execution = new NotebookCellExecutionTask(controllerId, cellObj, this._proxy);
            this._activeExecutions.set(cellObj.uri, execution);
            const listener = execution.onDidChangeState(() => {
                if (execution.state === NotebookCellExecutionTaskState.Resolved) {
                    execution.dispose();
                    listener.dispose();
                    this._activeExecutions.delete(cellObj.uri);
                }
            });
            return execution.asApiObject();
        }
        // ---
        _createNotebookExecution(nb, controllerId) {
            const notebook = this._extHostNotebook.getNotebookDocument(nb.uri);
            const runningCell = nb.getCells().find(cell => {
                const apiCell = notebook.getCellFromApiCell(cell);
                return apiCell && this._activeExecutions.has(apiCell.uri);
            });
            if (runningCell) {
                throw new Error(`duplicate cell execution for ${runningCell.document.uri}`);
            }
            if (this._activeNotebookExecutions.has(notebook.uri)) {
                throw new Error(`duplicate notebook execution for ${notebook.uri}`);
            }
            const execution = new NotebookExecutionTask(controllerId, notebook, this._proxy);
            const listener = execution.onDidChangeState(() => {
                if (execution.state === NotebookExecutionTaskState.Resolved) {
                    execution.dispose();
                    listener.dispose();
                    this._activeNotebookExecutions.delete(notebook.uri);
                }
            });
            this._activeNotebookExecutions.set(notebook.uri, [execution, listener]);
            return execution.asApiObject();
        }
    };
    exports.ExtHostNotebookKernels = ExtHostNotebookKernels;
    exports.ExtHostNotebookKernels = ExtHostNotebookKernels = __decorate([
        __param(4, log_1.ILogService)
    ], ExtHostNotebookKernels);
    var NotebookCellExecutionTaskState;
    (function (NotebookCellExecutionTaskState) {
        NotebookCellExecutionTaskState[NotebookCellExecutionTaskState["Init"] = 0] = "Init";
        NotebookCellExecutionTaskState[NotebookCellExecutionTaskState["Started"] = 1] = "Started";
        NotebookCellExecutionTaskState[NotebookCellExecutionTaskState["Resolved"] = 2] = "Resolved";
    })(NotebookCellExecutionTaskState || (NotebookCellExecutionTaskState = {}));
    class NotebookCellExecutionTask extends lifecycle_1.Disposable {
        static { this.HANDLE = 0; }
        get state() { return this._state; }
        constructor(controllerId, _cell, _proxy) {
            super();
            this._cell = _cell;
            this._proxy = _proxy;
            this._handle = NotebookCellExecutionTask.HANDLE++;
            this._onDidChangeState = new event_1.Emitter();
            this.onDidChangeState = this._onDidChangeState.event;
            this._state = NotebookCellExecutionTaskState.Init;
            this._tokenSource = this._register(new cancellation_1.CancellationTokenSource());
            this._collector = new TimeoutBasedCollector(10, updates => this.update(updates));
            this._executionOrder = _cell.internalMetadata.executionOrder;
            this._proxy.$createExecution(this._handle, controllerId, this._cell.notebook.uri, this._cell.handle);
        }
        cancel() {
            this._tokenSource.cancel();
        }
        async updateSoon(update) {
            await this._collector.addItem(update);
        }
        async update(update) {
            const updates = Array.isArray(update) ? update : [update];
            return this._proxy.$updateExecution(this._handle, new proxyIdentifier_1.SerializableObjectWithBuffers(updates));
        }
        verifyStateForOutput() {
            if (this._state === NotebookCellExecutionTaskState.Init) {
                throw new Error('Must call start before modifying cell output');
            }
            if (this._state === NotebookCellExecutionTaskState.Resolved) {
                throw new Error('Cannot modify cell output after calling resolve');
            }
        }
        cellIndexToHandle(cellOrCellIndex) {
            let cell = this._cell;
            if (cellOrCellIndex) {
                cell = this._cell.notebook.getCellFromApiCell(cellOrCellIndex);
            }
            if (!cell) {
                throw new Error('INVALID cell');
            }
            return cell.handle;
        }
        validateAndConvertOutputs(items) {
            return items.map(output => {
                const newOutput = extHostTypes_1.NotebookCellOutput.ensureUniqueMimeTypes(output.items, true);
                if (newOutput === output.items) {
                    return extHostTypeConverters.NotebookCellOutput.from(output);
                }
                return extHostTypeConverters.NotebookCellOutput.from({
                    items: newOutput,
                    id: output.id,
                    metadata: output.metadata
                });
            });
        }
        async updateOutputs(outputs, cell, append) {
            const handle = this.cellIndexToHandle(cell);
            const outputDtos = this.validateAndConvertOutputs((0, arrays_1.asArray)(outputs));
            return this.updateSoon({
                editType: notebookExecutionService_1.CellExecutionUpdateType.Output,
                cellHandle: handle,
                append,
                outputs: outputDtos
            });
        }
        async updateOutputItems(items, output, append) {
            items = extHostTypes_1.NotebookCellOutput.ensureUniqueMimeTypes((0, arrays_1.asArray)(items), true);
            return this.updateSoon({
                editType: notebookExecutionService_1.CellExecutionUpdateType.OutputItems,
                items: items.map(extHostTypeConverters.NotebookCellOutputItem.from),
                outputId: output.id,
                append
            });
        }
        asApiObject() {
            const that = this;
            const result = {
                get token() { return that._tokenSource.token; },
                get cell() { return that._cell.apiCell; },
                get executionOrder() { return that._executionOrder; },
                set executionOrder(v) {
                    that._executionOrder = v;
                    that.update([{
                            editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState,
                            executionOrder: that._executionOrder
                        }]);
                },
                start(startTime) {
                    if (that._state === NotebookCellExecutionTaskState.Resolved || that._state === NotebookCellExecutionTaskState.Started) {
                        throw new Error('Cannot call start again');
                    }
                    that._state = NotebookCellExecutionTaskState.Started;
                    that._onDidChangeState.fire();
                    that.update({
                        editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState,
                        runStartTime: startTime
                    });
                },
                end(success, endTime, executionError) {
                    if (that._state === NotebookCellExecutionTaskState.Resolved) {
                        throw new Error('Cannot call resolve twice');
                    }
                    that._state = NotebookCellExecutionTaskState.Resolved;
                    that._onDidChangeState.fire();
                    // The last update needs to be ordered correctly and applied immediately,
                    // so we use updateSoon and immediately flush.
                    that._collector.flush();
                    const error = executionError ? {
                        message: executionError.message,
                        stack: executionError.stack,
                        location: executionError?.location ? {
                            startLineNumber: executionError.location.start.line,
                            startColumn: executionError.location.start.character,
                            endLineNumber: executionError.location.end.line,
                            endColumn: executionError.location.end.character
                        } : undefined,
                        uri: executionError.uri
                    } : undefined;
                    that._proxy.$completeExecution(that._handle, new proxyIdentifier_1.SerializableObjectWithBuffers({
                        runEndTime: endTime,
                        lastRunSuccess: success,
                        error
                    }));
                },
                clearOutput(cell) {
                    that.verifyStateForOutput();
                    return that.updateOutputs([], cell, false);
                },
                appendOutput(outputs, cell) {
                    that.verifyStateForOutput();
                    return that.updateOutputs(outputs, cell, true);
                },
                replaceOutput(outputs, cell) {
                    that.verifyStateForOutput();
                    return that.updateOutputs(outputs, cell, false);
                },
                appendOutputItems(items, output) {
                    that.verifyStateForOutput();
                    return that.updateOutputItems(items, output, true);
                },
                replaceOutputItems(items, output) {
                    that.verifyStateForOutput();
                    return that.updateOutputItems(items, output, false);
                }
            };
            return Object.freeze(result);
        }
    }
    var NotebookExecutionTaskState;
    (function (NotebookExecutionTaskState) {
        NotebookExecutionTaskState[NotebookExecutionTaskState["Init"] = 0] = "Init";
        NotebookExecutionTaskState[NotebookExecutionTaskState["Started"] = 1] = "Started";
        NotebookExecutionTaskState[NotebookExecutionTaskState["Resolved"] = 2] = "Resolved";
    })(NotebookExecutionTaskState || (NotebookExecutionTaskState = {}));
    class NotebookExecutionTask extends lifecycle_1.Disposable {
        static { this.HANDLE = 0; }
        get state() { return this._state; }
        constructor(controllerId, _notebook, _proxy) {
            super();
            this._notebook = _notebook;
            this._proxy = _proxy;
            this._handle = NotebookExecutionTask.HANDLE++;
            this._onDidChangeState = new event_1.Emitter();
            this.onDidChangeState = this._onDidChangeState.event;
            this._state = NotebookExecutionTaskState.Init;
            this._tokenSource = this._register(new cancellation_1.CancellationTokenSource());
            this._proxy.$createNotebookExecution(this._handle, controllerId, this._notebook.uri);
        }
        cancel() {
            this._tokenSource.cancel();
        }
        asApiObject() {
            const result = {
                start: () => {
                    if (this._state === NotebookExecutionTaskState.Resolved || this._state === NotebookExecutionTaskState.Started) {
                        throw new Error('Cannot call start again');
                    }
                    this._state = NotebookExecutionTaskState.Started;
                    this._onDidChangeState.fire();
                    this._proxy.$beginNotebookExecution(this._handle);
                },
                end: () => {
                    if (this._state === NotebookExecutionTaskState.Resolved) {
                        throw new Error('Cannot call resolve twice');
                    }
                    this._state = NotebookExecutionTaskState.Resolved;
                    this._onDidChangeState.fire();
                    this._proxy.$completeNotebookExecution(this._handle);
                },
            };
            return Object.freeze(result);
        }
    }
    class TimeoutBasedCollector {
        constructor(delay, callback) {
            this.delay = delay;
            this.callback = callback;
            this.batch = [];
            this.startedTimer = Date.now();
        }
        addItem(item) {
            this.batch.push(item);
            if (!this.currentDeferred) {
                this.currentDeferred = new async_1.DeferredPromise();
                this.startedTimer = Date.now();
                (0, async_1.timeout)(this.delay).then(() => {
                    return this.flush();
                });
            }
            // This can be called by the extension repeatedly for a long time before the timeout is able to run.
            // Force a flush after the delay.
            if (Date.now() - this.startedTimer > this.delay) {
                return this.flush();
            }
            return this.currentDeferred.p;
        }
        flush() {
            if (this.batch.length === 0 || !this.currentDeferred) {
                return Promise.resolve();
            }
            const deferred = this.currentDeferred;
            this.currentDeferred = undefined;
            const batch = this.batch;
            this.batch = [];
            return this.callback(batch)
                .finally(() => deferred.complete());
        }
    }
    function createKernelId(extensionIdentifier, id) {
        return `${extensionIdentifier.value}/${id}`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rS2VybmVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3ROb3RlYm9va0tlcm5lbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdTJCaEcsd0NBRUM7SUFsMEJNLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXNCO1FBa0JsQyxZQUNDLFdBQXlCLEVBQ1IsU0FBa0MsRUFDbEMsZ0JBQTJDLEVBQ3BELFNBQTBCLEVBQ3JCLFdBQXlDO1lBSHJDLGNBQVMsR0FBVCxTQUFTLENBQXlCO1lBQ2xDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBMkI7WUFDcEQsY0FBUyxHQUFULFNBQVMsQ0FBaUI7WUFDSixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQXBCdEMsc0JBQWlCLEdBQUcsSUFBSSxpQkFBVyxFQUE2QixDQUFDO1lBQ2pFLDhCQUF5QixHQUFHLElBQUksaUJBQVcsRUFBd0MsQ0FBQztZQUU3Rix5QkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBa0QsQ0FBQztZQUNqRixtQ0FBOEIsR0FBVyxDQUFDLENBQUM7WUFFM0MsaUNBQTRCLEdBQUcsSUFBSSxHQUFHLEVBQXFELENBQUM7WUFDNUYsMENBQXFDLEdBQVcsQ0FBQyxDQUFDO1lBRXpDLGdCQUFXLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFDdEQsZ0JBQVcsR0FBVyxDQUFDLENBQUM7WUFFZixtQ0FBOEIsR0FBRyxJQUFJLGVBQU8sRUFBZ0QsQ0FBQztZQUNyRywwQ0FBcUMsR0FBRyxJQUFJLENBQUMsOEJBQThCLENBQUMsS0FBSyxDQUFDO1lBK1huRixPQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ1Asa0JBQWEsR0FBb0MsRUFBRSxDQUFDO1lBdlgzRCxJQUFJ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