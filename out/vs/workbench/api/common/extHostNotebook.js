/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/api/common/cache", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/services/extensions/common/proxyIdentifier", "./extHostNotebookDocument", "./extHostNotebookEditor", "vs/base/common/objects", "vs/base/common/network", "vs/workbench/contrib/search/common/cellSearchModel", "vs/workbench/contrib/search/common/searchNotebookHelpers", "vs/workbench/services/editor/common/editorResolverService"], function (require, exports, nls_1, buffer_1, event_1, lifecycle_1, map_1, strings_1, types_1, uri_1, files, cache_1, extHost_protocol_1, extHostCommands_1, typeConverters, extHostTypes, proxyIdentifier_1, extHostNotebookDocument_1, extHostNotebookEditor_1, objects_1, network_1, cellSearchModel_1, searchNotebookHelpers_1, editorResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookController = void 0;
    class ExtHostNotebookController {
        static { this._notebookStatusBarItemProviderHandlePool = 0; }
        get activeNotebookEditor() {
            return this._activeNotebookEditor?.apiEditor;
        }
        get visibleNotebookEditors() {
            return this._visibleNotebookEditors.map(editor => editor.apiEditor);
        }
        constructor(mainContext, commands, _textDocumentsAndEditors, _textDocuments, _extHostFileSystem, _extHostSearch) {
            this._textDocumentsAndEditors = _textDocumentsAndEditors;
            this._textDocuments = _textDocuments;
            this._extHostFileSystem = _extHostFileSystem;
            this._extHostSearch = _extHostSearch;
            this._notebookStatusBarItemProviders = new Map();
            this._documents = new map_1.ResourceMap();
            this._editors = new Map();
            this._onDidChangeActiveNotebookEditor = new event_1.Emitter();
            this.onDidChangeActiveNotebookEditor = this._onDidChangeActiveNotebookEditor.event;
            this._visibleNotebookEditors = [];
            this._onDidOpenNotebookDocument = new event_1.Emitter();
            this.onDidOpenNotebookDocument = this._onDidOpenNotebookDocument.event;
            this._onDidCloseNotebookDocument = new event_1.Emitter();
            this.onDidCloseNotebookDocument = this._onDidCloseNotebookDocument.event;
            this._onDidChangeVisibleNotebookEditors = new event_1.Emitter();
            this.onDidChangeVisibleNotebookEditors = this._onDidChangeVisibleNotebookEditors.event;
            this._statusBarCache = new cache_1.Cache('NotebookCellStatusBarCache');
            // --- serialize/deserialize
            this._handlePool = 0;
            this._notebookSerializer = new Map();
            this._notebookProxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebook);
            this._notebookDocumentsProxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookDocuments);
            this._notebookEditorsProxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookEditors);
            this._commandsConverter = commands.converter;
            commands.registerArgumentProcessor({
                // Serialized INotebookCellActionContext
                processArgument: (arg) => {
                    if (arg && arg.$mid === 13 /* MarshalledId.NotebookCellActionContext */) {
                        const notebookUri = arg.notebookEditor?.notebookUri;
                        const cellHandle = arg.cell.handle;
                        const data = this._documents.get(notebookUri);
                        const cell = data?.getCell(cellHandle);
                        if (cell) {
                            return cell.apiCell;
                        }
                    }
                    if (arg && arg.$mid === 14 /* MarshalledId.NotebookActionContext */) {
                        const notebookUri = arg.uri;
                        const data = this._documents.get(notebookUri);
                        if (data) {
                            return data.apiNotebook;
                        }
                    }
                    return arg;
                }
            });
            ExtHostNotebookController._registerApiCommands(commands);
        }
        getEditorById(editorId) {
            const editor = this._editors.get(editorId);
            if (!editor) {
                throw new Error(`unknown text editor: ${editorId}. known editors: ${[...this._editors.keys()]} `);
            }
            return editor;
        }
        getIdByEditor(editor) {
            for (const [id, candidate] of this._editors) {
                if (candidate.apiEditor === editor) {
                    return id;
                }
            }
            return undefined;
        }
        get notebookDocuments() {
            return [...this._documents.values()];
        }
        getNotebookDocument(uri, relaxed) {
            const result = this._documents.get(uri);
            if (!result && !relaxed) {
                throw new Error(`NO notebook document for '${uri}'`);
            }
            return result;
        }
        static _convertNotebookRegistrationData(extension, registration) {
            if (!registration) {
                return;
            }
            const viewOptionsFilenamePattern = registration.filenamePattern
                .map(pattern => typeConverters.NotebookExclusiveDocumentPattern.from(pattern))
                .filter(pattern => pattern !== undefined);
            if (registration.filenamePattern && !viewOptionsFilenamePattern) {
                console.warn(`Notebook content provider view options file name pattern is invalid ${registration.filenamePattern}`);
                return undefined;
            }
            return {
                extension: extension.identifier,
                providerDisplayName: extension.displayName || extension.name,
                displayName: registration.displayName,
                filenamePattern: viewOptionsFilenamePattern,
                exclusive: registration.exclusive || false
            };
        }
        registerNotebookCellStatusBarItemProvider(extension, notebookType, provider) {
            const handle = ExtHostNotebookController._notebookStatusBarItemProviderHandlePool++;
            const eventHandle = typeof provider.onDidChangeCellStatusBarItems === 'function' ? ExtHostNotebookController._notebookStatusBarItemProviderHandlePool++ : undefined;
            this._notebookStatusBarItemProviders.set(handle, provider);
            this._notebookProxy.$registerNotebookCellStatusBarItemProvider(handle, eventHandle, notebookType);
            let subscription;
            if (eventHandle !== undefined) {
                subscription = provider.onDidChangeCellStatusBarItems(_ => this._notebookProxy.$emitCellStatusBarEvent(eventHandle));
            }
            return new extHostTypes.Disposable(() => {
                this._notebookStatusBarItemProviders.delete(handle);
                this._notebookProxy.$unregisterNotebookCellStatusBarItemProvider(handle, eventHandle);
                subscription?.dispose();
            });
        }
        async createNotebookDocument(options) {
            const canonicalUri = await this._notebookDocumentsProxy.$tryCreateNotebook({
                viewType: options.viewType,
                content: options.content && typeConverters.NotebookData.from(options.content)
            });
            return uri_1.URI.revive(canonicalUri);
        }
        async openNotebookDocument(uri) {
            const cached = this._documents.get(uri);
            if (cached) {
                return cached.apiNotebook;
            }
            const canonicalUri = await this._notebookDocumentsProxy.$tryOpenNotebook(uri);
            const document = this._documents.get(uri_1.URI.revive(canonicalUri));
            return (0, types_1.assertIsDefined)(document?.apiNotebook);
        }
        async showNotebookDocument(notebookOrUri, options) {
            if (uri_1.URI.isUri(notebookOrUri)) {
                notebookOrUri = await this.openNotebookDocument(notebookOrUri);
            }
            let resolvedOptions;
            if (typeof options === 'object') {
                resolvedOptions = {
                    position: typeConverters.ViewColumn.from(options.viewColumn),
                    preserveFocus: options.preserveFocus,
                    selections: options.selections && options.selections.map(typeConverters.NotebookRange.from),
                    pinned: typeof options.preview === 'boolean' ? !options.preview : undefined
                };
            }
            else {
                resolvedOptions = {
                    preserveFocus: false
                };
            }
            const editorId = await this._notebookEditorsProxy.$tryShowNotebookDocument(notebookOrUri.uri, notebookOrUri.notebookType, resolvedOptions);
            const editor = editorId && this._editors.get(editorId)?.apiEditor;
            if (editor) {
                return editor;
            }
            if (editorId) {
                throw new Error(`Could NOT open editor for "${notebookOrUri.uri.toString()}" because another editor opened in the meantime.`);
            }
            else {
                throw new Error(`Could NOT open editor for "${notebookOrUri.uri.toString()}".`);
            }
        }
        async $provideNotebookCellStatusBarItems(handle, uri, index, token) {
            const provider = this._notebookStatusBarItemProviders.get(handle);
            const revivedUri = uri_1.URI.revive(uri);
            const document = this._documents.get(revivedUri);
            if (!document || !provider) {
                return;
            }
            const cell = document.getCellFromIndex(index);
            if (!cell) {
                return;
            }
            const result = await provider.provideCellStatusBarItems(cell.apiCell, token);
            if (!result) {
                return undefined;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const cacheId = this._statusBarCache.add([disposables]);
            const resultArr = Array.isArray(result) ? result : [result];
            const items = resultArr.map(item => typeConverters.NotebookStatusBarItem.from(item, this._commandsConverter, disposables));
            return {
                cacheId,
                items
            };
        }
        $releaseNotebookCellStatusBarItems(cacheId) {
            this._statusBarCache.delete(cacheId);
        }
        registerNotebookSerializer(extension, viewType, serializer, options, registration) {
            if ((0, strings_1.isFalsyOrWhitespace)(viewType)) {
                throw new Error(`viewType cannot be empty or just whitespace`);
            }
            const handle = this._handlePool++;
            this._notebookSerializer.set(handle, { viewType, serializer, options });
            this._notebookProxy.$registerNotebookSerializer(handle, { id: extension.identifier, location: extension.extensionLocation }, viewType, typeConverters.NotebookDocumentContentOptions.from(options), ExtHostNotebookController._convertNotebookRegistrationData(extension, registration));
            return (0, lifecycle_1.toDisposable)(() => {
                this._notebookProxy.$unregisterNotebookSerializer(handle);
            });
        }
        async $dataToNotebook(handle, bytes, token) {
            const serializer = this._notebookSerializer.get(handle);
            if (!serializer) {
                throw new Error('NO serializer found');
            }
            const data = await serializer.serializer.deserializeNotebook(bytes.buffer, token);
            return new proxyIdentifier_1.SerializableObjectWithBuffers(typeConverters.NotebookData.from(data));
        }
        async $notebookToData(handle, data, token) {
            const serializer = this._notebookSerializer.get(handle);
            if (!serializer) {
                throw new Error('NO serializer found');
            }
            const bytes = await serializer.serializer.serializeNotebook(typeConverters.NotebookData.to(data.value), token);
            return buffer_1.VSBuffer.wrap(bytes);
        }
        async $saveNotebook(handle, uriComponents, versionId, options, token) {
            const uri = uri_1.URI.revive(uriComponents);
            const serializer = this._notebookSerializer.get(handle);
            if (!serializer) {
                throw new Error('NO serializer found');
            }
            const document = this._documents.get(uri);
            if (!document) {
                throw new Error('Document NOT found');
            }
            if (document.versionId !== versionId) {
                throw new Error('Document version mismatch');
            }
            if (!this._extHostFileSystem.value.isWritableFileSystem(uri.scheme)) {
                throw new files.FileOperationError((0, nls_1.localize)('err.readonly', "Unable to modify read-only file '{0}'", this._resourceForError(uri)), 6 /* files.FileOperationResult.FILE_PERMISSION_DENIED */);
            }
            // validate write
            await this._validateWriteFile(uri, options);
            const data = {
                metadata: (0, objects_1.filter)(document.apiNotebook.metadata, key => !(serializer.options?.transientDocumentMetadata ?? {})[key]),
                cells: [],
            };
            for (const cell of document.apiNotebook.getCells()) {
                const cellData = new extHostTypes.NotebookCellData(cell.kind, cell.document.getText(), cell.document.languageId, cell.mime, !(serializer.options?.transientOutputs) ? [...cell.outputs] : [], cell.metadata, cell.executionSummary);
                cellData.metadata = (0, objects_1.filter)(cell.metadata, key => !(serializer.options?.transientCellMetadata ?? {})[key]);
                data.cells.push(cellData);
            }
            const bytes = await serializer.serializer.serializeNotebook(data, token);
            await this._extHostFileSystem.value.writeFile(uri, bytes);
            const providerExtUri = this._extHostFileSystem.getFileSystemProviderExtUri(uri.scheme);
            const stat = await this._extHostFileSystem.value.stat(uri);
            const fileStats = {
                name: providerExtUri.basename(uri),
                isFile: (stat.type & files.FileType.File) !== 0,
                isDirectory: (stat.type & files.FileType.Directory) !== 0,
                isSymbolicLink: (stat.type & files.FileType.SymbolicLink) !== 0,
                mtime: stat.mtime,
                ctime: stat.ctime,
                size: stat.size,
                readonly: Boolean((stat.permissions ?? 0) & files.FilePermission.Readonly) || !this._extHostFileSystem.value.isWritableFileSystem(uri.scheme),
                locked: Boolean((stat.permissions ?? 0) & files.FilePermission.Locked),
                etag: files.etag({ mtime: stat.mtime, size: stat.size }),
                children: undefined
            };
            return fileStats;
        }
        /**
         * Search for query in all notebooks that can be deserialized by the serializer fetched by `handle`.
         *
         * @param handle used to get notebook serializer
         * @param textQuery the text query to search using
         * @param viewTypeFileTargets the globs (and associated ranks) that are targetting for opening this type of notebook
         * @param otherViewTypeFileTargets ranked globs for other editors that we should consider when deciding whether it will open as this notebook
         * @param token cancellation token
         * @returns `IRawClosedNotebookFileMatch` for every file. Files without matches will just have a `IRawClosedNotebookFileMatch`
         * 	with no `cellResults`. This allows the caller to know what was searched in already, even if it did not yield results.
         */
        async $searchInNotebooks(handle, textQuery, viewTypeFileTargets, otherViewTypeFileTargets, token) {
            const serializer = this._notebookSerializer.get(handle)?.serializer;
            if (!serializer) {
                return {
                    limitHit: false,
                    results: []
                };
            }
            const finalMatchedTargets = new map_1.ResourceSet();
            const runFileQueries = async (includes, token, textQuery) => {
                await Promise.all(includes.map(async (include) => await Promise.all(include.filenamePatterns.map(filePattern => {
                    const query = {
                        _reason: textQuery._reason,
                        folderQueries: textQuery.folderQueries,
                        includePattern: textQuery.includePattern,
                        excludePattern: textQuery.excludePattern,
                        maxResults: textQuery.maxResults,
                        type: 1 /* QueryType.File */,
                        filePattern
                    };
                    // use priority info to exclude info from other globs
                    return this._extHostSearch.doInternalFileSearchWithCustomCallback(query, token, (data) => {
                        data.forEach(uri => {
                            if (finalMatchedTargets.has(uri)) {
                                return;
                            }
                            const hasOtherMatches = otherViewTypeFileTargets.some(target => {
                                // use the same strategy that the editor service uses to open editors
                                // https://github.com/microsoft/vscode/blob/ac1631528e67637da65ec994c6dc35d73f6e33cc/src/vs/workbench/services/editor/browser/editorResolverService.ts#L359-L366
                                if (include.isFromSettings && !target.isFromSettings) {
                                    // if the include is from the settings and target isn't, even if it matches, it's still overridden.
                                    return false;
                                }
                                else {
                                    // longer filePatterns are considered more specifc, so they always have precedence the shorter patterns
                                    return target.filenamePatterns.some(targetFilePattern => (0, editorResolverService_1.globMatchesResource)(targetFilePattern, uri));
                                }
                            });
                            if (hasOtherMatches) {
                                return;
                            }
                            finalMatchedTargets.add(uri);
                        });
                    }).catch(err => {
                        // temporary fix for https://github.com/microsoft/vscode/issues/205044: don't show notebook results for remotehub repos.
                        if (err.code === 'ENOENT') {
                            console.warn(`Could not find notebook search results, ignoring notebook results.`);
                            return {
                                limitHit: false,
                                messages: [],
                            };
                        }
                        else {
                            throw err;
                        }
                    });
                }))));
                return;
            };
            await runFileQueries(viewTypeFileTargets, token, textQuery);
            const results = new map_1.ResourceMap();
            let limitHit = false;
            const promises = Array.from(finalMatchedTargets).map(async (uri) => {
                const cellMatches = [];
                try {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    if (textQuery.maxResults && [...results.values()].reduce((acc, value) => acc + value.cellResults.length, 0) > textQuery.maxResults) {
                        limitHit = true;
                        return;
                    }
                    const simpleCells = [];
                    const notebook = this._documents.get(uri);
                    if (notebook) {
                        const cells = notebook.apiNotebook.getCells();
                        cells.forEach(e => simpleCells.push({
                            input: e.document.getText(),
                            outputs: e.outputs.flatMap(value => value.items.map(output => output.data.toString()))
                        }));
                    }
                    else {
                        const fileContent = await this._extHostFileSystem.value.readFile(uri);
                        const bytes = buffer_1.VSBuffer.fromString(fileContent.toString());
                        const notebook = await serializer.deserializeNotebook(bytes.buffer, token);
                        if (token.isCancellationRequested) {
                            return;
                        }
                        const data = typeConverters.NotebookData.from(notebook);
                        data.cells.forEach(cell => simpleCells.push({
                            input: cell.source,
                            outputs: cell.outputs.flatMap(value => value.items.map(output => output.valueBytes.toString()))
                        }));
                    }
                    if (token.isCancellationRequested) {
                        return;
                    }
                    simpleCells.forEach((cell, index) => {
                        const target = textQuery.contentPattern.pattern;
                        const cellModel = new cellSearchModel_1.CellSearchModel(cell.input, undefined, cell.outputs);
                        const inputMatches = cellModel.findInInputs(target);
                        const outputMatches = cellModel.findInOutputs(target);
                        const webviewResults = outputMatches
                            .flatMap(outputMatch => (0, searchNotebookHelpers_1.genericCellMatchesToTextSearchMatches)(outputMatch.matches, outputMatch.textBuffer))
                            .map((textMatch, index) => {
                            textMatch.webviewIndex = index;
                            return textMatch;
                        });
                        if (inputMatches.length > 0 || outputMatches.length > 0) {
                            const cellMatch = {
                                index: index,
                                contentResults: (0, searchNotebookHelpers_1.genericCellMatchesToTextSearchMatches)(inputMatches, cellModel.inputTextBuffer),
                                webviewResults
                            };
                            cellMatches.push(cellMatch);
                        }
                    });
                    const fileMatch = {
                        resource: uri, cellResults: cellMatches
                    };
                    results.set(uri, fileMatch);
                    return;
                }
                catch (e) {
                    return;
                }
            });
            await Promise.all(promises);
            return {
                limitHit,
                results: [...results.values()]
            };
        }
        async _validateWriteFile(uri, options) {
            const stat = await this._extHostFileSystem.value.stat(uri);
            // Dirty write prevention
            if (typeof options?.mtime === 'number' && typeof options.etag === 'string' && options.etag !== files.ETAG_DISABLED &&
                typeof stat.mtime === 'number' && typeof stat.size === 'number' &&
                options.mtime < stat.mtime && options.etag !== files.etag({ mtime: options.mtime /* not using stat.mtime for a reason, see above */, size: stat.size })) {
                throw new files.FileOperationError((0, nls_1.localize)('fileModifiedError', "File Modified Since"), 3 /* files.FileOperationResult.FILE_MODIFIED_SINCE */, options);
            }
            return;
        }
        _resourceForError(uri) {
            return uri.scheme === network_1.Schemas.file ? uri.fsPath : uri.toString();
        }
        // --- open, save, saveAs, backup
        _createExtHostEditor(document, editorId, data) {
            if (this._editors.has(editorId)) {
                throw new Error(`editor with id ALREADY EXSIST: ${editorId}`);
            }
            const editor = new extHostNotebookEditor_1.ExtHostNotebookEditor(editorId, this._notebookEditorsProxy, document, data.visibleRanges.map(typeConverters.NotebookRange.to), data.selections.map(typeConverters.NotebookRange.to), typeof data.viewColumn === 'number' ? typeConverters.ViewColumn.to(data.viewColumn) : undefined);
            this._editors.set(editorId, editor);
        }
        $acceptDocumentAndEditorsDelta(delta) {
            if (delta.value.removedDocuments) {
                for (const uri of delta.value.removedDocuments) {
                    const revivedUri = uri_1.URI.revive(uri);
                    const document = this._documents.get(revivedUri);
                    if (document) {
                        document.dispose();
                        this._documents.delete(revivedUri);
                        this._textDocumentsAndEditors.$acceptDocumentsAndEditorsDelta({ removedDocuments: document.apiNotebook.getCells().map(cell => cell.document.uri) });
                        this._onDidCloseNotebookDocument.fire(document.apiNotebook);
                    }
                    for (const editor of this._editors.values()) {
                        if (editor.notebookData.uri.toString() === revivedUri.toString()) {
                            this._editors.delete(editor.id);
                        }
                    }
                }
            }
            if (delta.value.addedDocuments) {
                const addedCellDocuments = [];
                for (const modelData of delta.value.addedDocuments) {
                    const uri = uri_1.URI.revive(modelData.uri);
                    if (this._documents.has(uri)) {
                        throw new Error(`adding EXISTING notebook ${uri} `);
                    }
                    const document = new extHostNotebookDocument_1.ExtHostNotebookDocument(this._notebookDocumentsProxy, this._textDocumentsAndEditors, this._textDocuments, uri, modelData);
                    // add cell document as vscode.TextDocument
                    addedCellDocuments.push(...modelData.cells.map(cell => extHostNotebookDocument_1.ExtHostCell.asModelAddData(cell)));
                    this._documents.get(uri)?.dispose();
                    this._documents.set(uri, document);
                    this._textDocumentsAndEditors.$acceptDocumentsAndEditorsDelta({ addedDocuments: addedCellDocuments });
                    this._onDidOpenNotebookDocument.fire(document.apiNotebook);
                }
            }
            if (delta.value.addedEditors) {
                for (const editorModelData of delta.value.addedEditors) {
                    if (this._editors.has(editorModelData.id)) {
                        return;
                    }
                    const revivedUri = uri_1.URI.revive(editorModelData.documentUri);
                    const document = this._documents.get(revivedUri);
                    if (document) {
                        this._createExtHostEditor(document, editorModelData.id, editorModelData);
                    }
                }
            }
            const removedEditors = [];
            if (delta.value.removedEditors) {
                for (const editorid of delta.value.removedEditors) {
                    const editor = this._editors.get(editorid);
                    if (editor) {
                        this._editors.delete(editorid);
                        if (this._activeNotebookEditor?.id === editor.id) {
                            this._activeNotebookEditor = undefined;
                        }
                        removedEditors.push(editor);
                    }
                }
            }
            if (delta.value.visibleEditors) {
                this._visibleNotebookEditors = delta.value.visibleEditors.map(id => this._editors.get(id)).filter(editor => !!editor);
                const visibleEditorsSet = new Set();
                this._visibleNotebookEditors.forEach(editor => visibleEditorsSet.add(editor.id));
                for (const editor of this._editors.values()) {
                    const newValue = visibleEditorsSet.has(editor.id);
                    editor._acceptVisibility(newValue);
                }
                this._visibleNotebookEditors = [...this._editors.values()].map(e => e).filter(e => e.visible);
                this._onDidChangeVisibleNotebookEditors.fire(this.visibleNotebookEditors);
            }
            if (delta.value.newActiveEditor === null) {
                // clear active notebook as current active editor is non-notebook editor
                this._activeNotebookEditor = undefined;
            }
            else if (delta.value.newActiveEditor) {
                const activeEditor = this._editors.get(delta.value.newActiveEditor);
                if (!activeEditor) {
                    console.error(`FAILED to find active notebook editor ${delta.value.newActiveEditor}`);
                }
                this._activeNotebookEditor = this._editors.get(delta.value.newActiveEditor);
            }
            if (delta.value.newActiveEditor !== undefined) {
                this._onDidChangeActiveNotebookEditor.fire(this._activeNotebookEditor?.apiEditor);
            }
        }
        static _registerApiCommands(extHostCommands) {
            const notebookTypeArg = extHostCommands_1.ApiCommandArgument.String.with('notebookType', 'A notebook type');
            const commandDataToNotebook = new extHostCommands_1.ApiCommand('vscode.executeDataToNotebook', '_executeDataToNotebook', 'Invoke notebook serializer', [notebookTypeArg, new extHostCommands_1.ApiCommandArgument('data', 'Bytes to convert to data', v => v instanceof Uint8Array, v => buffer_1.VSBuffer.wrap(v))], new extHostCommands_1.ApiCommandResult('Notebook Data', data => typeConverters.NotebookData.to(data.value)));
            const commandNotebookToData = new extHostCommands_1.ApiCommand('vscode.executeNotebookToData', '_executeNotebookToData', 'Invoke notebook serializer', [notebookTypeArg, new extHostCommands_1.ApiCommandArgument('NotebookData', 'Notebook data to convert to bytes', v => true, v => new proxyIdentifier_1.SerializableObjectWithBuffers(typeConverters.NotebookData.from(v)))], new extHostCommands_1.ApiCommandResult('Bytes', dto => dto.buffer));
            extHostCommands.registerApiCommand(commandDataToNotebook);
            extHostCommands.registerApiCommand(commandNotebookToData);
        }
    }
    exports.ExtHostNotebookController = ExtHostNotebookController;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdE5vdGVib29rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFDaEcsTUFBYSx5QkFBeUI7aUJBQ3RCLDZDQUF3QyxHQUFXLENBQUMsQUFBWixDQUFhO1FBZXBFLElBQUksb0JBQW9CO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixFQUFFLFNBQVMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsSUFBSSxzQkFBc0I7WUFDekIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFZRCxZQUNDLFdBQXlCLEVBQ3pCLFFBQXlCLEVBQ2pCLHdCQUFvRCxFQUNwRCxjQUFnQyxFQUNoQyxrQkFBOEMsRUFDOUMsY0FBOEI7WUFIOUIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUE0QjtZQUNwRCxtQkFBYyxHQUFkLGNBQWMsQ0FBa0I7WUFDaEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE0QjtZQUM5QyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFqQ3RCLG9DQUErQixHQUFHLElBQUksR0FBRyxFQUFvRCxDQUFDO1lBQzlGLGVBQVUsR0FBRyxJQUFJLGlCQUFXLEVBQTJCLENBQUM7WUFDeEQsYUFBUSxHQUFHLElBQUksR0FBRyxFQUFpQyxDQUFDO1lBR3BELHFDQUFnQyxHQUFHLElBQUksZUFBTyxFQUFxQyxDQUFDO1lBQzVGLG9DQUErQixHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUM7WUFNL0UsNEJBQXVCLEdBQTRCLEVBQUUsQ0FBQztZQUt0RCwrQkFBMEIs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