/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/test/common/testRPCProtocol", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/test/common/mock", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostNotebook", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/uri", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostCommands", "vs/workbench/services/extensions/common/extensions", "vs/base/common/resources", "vs/base/common/event", "vs/workbench/api/common/extHostNotebookDocuments", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/base/common/buffer", "vs/workbench/api/common/extHostFileSystemConsumer", "vs/workbench/api/common/extHostFileSystemInfo", "vs/base/test/common/utils", "vs/workbench/api/common/extHostSearch", "vs/workbench/api/common/extHostUriTransformerService"], function (require, exports, assert, extHostDocumentsAndEditors_1, testRPCProtocol_1, lifecycle_1, log_1, mock_1, extHost_protocol_1, extHostNotebook_1, notebookCommon_1, uri_1, extHostDocuments_1, extHostCommands_1, extensions_1, resources_1, event_1, extHostNotebookDocuments_1, proxyIdentifier_1, buffer_1, extHostFileSystemConsumer_1, extHostFileSystemInfo_1, utils_1, extHostSearch_1, extHostUriTransformerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookCell#Document', function () {
        let rpcProtocol;
        let notebook;
        let extHostDocumentsAndEditors;
        let extHostDocuments;
        let extHostNotebooks;
        let extHostNotebookDocuments;
        let extHostConsumerFileSystem;
        let extHostSearch;
        const notebookUri = uri_1.URI.parse('test:///notebook.file');
        const disposables = new lifecycle_1.DisposableStore();
        teardown(function () {
            disposables.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async function () {
            rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadCommands, new class extends (0, mock_1.mock)() {
                $registerCommand() { }
            });
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadNotebook, new class extends (0, mock_1.mock)() {
                async $registerNotebookSerializer() { }
                async $unregisterNotebookSerializer() { }
            });
            extHostDocumentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(rpcProtocol, new log_1.NullLogService());
            extHostDocuments = new extHostDocuments_1.ExtHostDocuments(rpcProtocol, extHostDocumentsAndEditors);
            extHostConsumerFileSystem = new extHostFileSystemConsumer_1.ExtHostConsumerFileSystem(rpcProtocol, new extHostFileSystemInfo_1.ExtHostFileSystemInfo());
            extHostSearch = new extHostSearch_1.ExtHostSearch(rpcProtocol, new extHostUriTransformerService_1.URITransformerService(null), new log_1.NullLogService());
            extHostNotebooks = new extHostNotebook_1.ExtHostNotebookController(rpcProtocol, new extHostCommands_1.ExtHostCommands(rpcProtocol, new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
                onExtensionError() {
                    return true;
                }
            }), extHostDocumentsAndEditors, extHostDocuments, extHostConsumerFileSystem, extHostSearch);
            extHostNotebookDocuments = new extHostNotebookDocuments_1.ExtHostNotebookDocuments(extHostNotebooks);
            const reg = extHostNotebooks.registerNotebookSerializer(extensions_1.nullExtensionDescription, 'test', new class extends (0, mock_1.mock)() {
            });
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({
                addedDocuments: [{
                        uri: notebookUri,
                        viewType: 'test',
                        versionId: 0,
                        cells: [{
                                handle: 0,
                                uri: notebookCommon_1.CellUri.generate(notebookUri, 0),
                                source: ['### Heading'],
                                eol: '\n',
                                language: 'markdown',
                                cellKind: notebookCommon_1.CellKind.Markup,
                                outputs: [],
                            }, {
                                handle: 1,
                                uri: notebookCommon_1.CellUri.generate(notebookUri, 1),
                                source: ['console.log("aaa")', 'console.log("bbb")'],
                                eol: '\n',
                                language: 'javascript',
                                cellKind: notebookCommon_1.CellKind.Code,
                                outputs: [],
                            }],
                    }],
                addedEditors: [{
                        documentUri: notebookUri,
                        id: '_notebook_editor_0',
                        selections: [{ start: 0, end: 1 }],
                        visibleRanges: []
                    }]
            }));
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({ newActiveEditor: '_notebook_editor_0' }));
            notebook = extHostNotebooks.notebookDocuments[0];
            disposables.add(reg);
            disposables.add(notebook);
            disposables.add(extHostDocuments);
        });
        test('cell document is vscode.TextDocument', async function () {
            assert.strictEqual(notebook.apiNotebook.cellCount, 2);
            const [c1, c2] = notebook.apiNotebook.getCells();
            const d1 = extHostDocuments.getDocument(c1.document.uri);
            assert.ok(d1);
            assert.strictEqual(d1.languageId, c1.document.languageId);
            assert.strictEqual(d1.version, 1);
            const d2 = extHostDocuments.getDocument(c2.document.uri);
            assert.ok(d2);
            assert.strictEqual(d2.languageId, c2.document.languageId);
            assert.strictEqual(d2.version, 1);
        });
        test('cell document goes when notebook closes', async function () {
            const cellUris = [];
            for (const cell of notebook.apiNotebook.getCells()) {
                assert.ok(extHostDocuments.getDocument(cell.document.uri));
                cellUris.push(cell.document.uri.toString());
            }
            const removedCellUris = [];
            const reg = extHostDocuments.onDidRemoveDocument(doc => {
                removedCellUris.push(doc.uri.toString());
            });
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({ removedDocuments: [notebook.uri] }));
            reg.dispose();
            assert.strictEqual(removedCellUris.length, 2);
            assert.deepStrictEqual(removedCellUris.sort(), cellUris.sort());
        });
        test('cell document is vscode.TextDocument after changing it', async function () {
            const p = new Promise((resolve, reject) => {
                disposables.add(extHostNotebookDocuments.onDidChangeNotebookDocument(e => {
                    try {
                        assert.strictEqual(e.contentChanges.length, 1);
                        assert.strictEqual(e.contentChanges[0].addedCells.length, 2);
                        const [first, second] = e.contentChanges[0].addedCells;
                        const doc1 = extHostDocuments.getAllDocumentData().find(data => (0, resources_1.isEqual)(data.document.uri, first.document.uri));
                        assert.ok(doc1);
                        assert.strictEqual(doc1?.document === first.document, true);
                        const doc2 = extHostDocuments.getAllDocumentData().find(data => (0, resources_1.isEqual)(data.document.uri, second.document.uri));
                        assert.ok(doc2);
                        assert.strictEqual(doc2?.document === second.document, true);
                        resolve();
                    }
                    catch (err) {
                        reject(err);
                    }
                }));
            });
            extHostNotebookDocuments.$acceptModelChanged(notebookUri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: notebook.apiNotebook.version + 1,
                rawEvents: [
                    {
                        kind: notebookCommon_1.NotebookCellsChangeType.ModelChange,
                        changes: [[0, 0, [{
                                        handle: 2,
                                        uri: notebookCommon_1.CellUri.generate(notebookUri, 2),
                                        source: ['Hello', 'World', 'Hello World!'],
                                        eol: '\n',
                                        language: 'test',
                                        cellKind: notebookCommon_1.CellKind.Code,
                                        outputs: [],
                                    }, {
                                        handle: 3,
                                        uri: notebookCommon_1.CellUri.generate(notebookUri, 3),
                                        source: ['Hallo', 'Welt', 'Hallo Welt!'],
                                        eol: '\n',
                                        language: 'test',
                                        cellKind: notebookCommon_1.CellKind.Code,
                                        outputs: [],
                                    }]]]
                    }
                ]
            }), false);
            await p;
        });
        test('cell document stays open when notebook is still open', async function () {
            const docs = [];
            const addData = [];
            for (const cell of notebook.apiNotebook.getCells()) {
                const doc = extHostDocuments.getDocument(cell.document.uri);
                assert.ok(doc);
                assert.strictEqual(extHostDocuments.getDocument(cell.document.uri).isClosed, false);
                docs.push(doc);
                addData.push({
                    EOL: '\n',
                    isDirty: doc.isDirty,
                    lines: doc.getText().split('\n'),
                    languageId: doc.languageId,
                    uri: doc.uri,
                    versionId: doc.version
                });
            }
            // this call happens when opening a document on the main side
            extHostDocumentsAndEditors.$acceptDocumentsAndEditorsDelta({ addedDocuments: addData });
            // this call happens when closing a document from the main side
            extHostDocumentsAndEditors.$acceptDocumentsAndEditorsDelta({ removedDocuments: docs.map(d => d.uri) });
            // notebook is still open -> cell documents stay open
            for (const cell of notebook.apiNotebook.getCells()) {
                assert.ok(extHostDocuments.getDocument(cell.document.uri));
                assert.strictEqual(extHostDocuments.getDocument(cell.document.uri).isClosed, false);
            }
            // close notebook -> docs are closed
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({ removedDocuments: [notebook.uri] }));
            for (const cell of notebook.apiNotebook.getCells()) {
                assert.throws(() => extHostDocuments.getDocument(cell.document.uri));
            }
            for (const doc of docs) {
                assert.strictEqual(doc.isClosed, true);
            }
        });
        test('cell document goes when cell is removed', async function () {
            assert.strictEqual(notebook.apiNotebook.cellCount, 2);
            const [cell1, cell2] = notebook.apiNotebook.getCells();
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: 2,
                rawEvents: [
                    {
                        kind: notebookCommon_1.NotebookCellsChangeType.ModelChange,
                        changes: [[0, 1, []]]
                    }
                ]
            }), false);
            assert.strictEqual(notebook.apiNotebook.cellCount, 1);
            assert.strictEqual(cell1.document.isClosed, true); // ref still alive!
            assert.strictEqual(cell2.document.isClosed, false);
            assert.throws(() => extHostDocuments.getDocument(cell1.document.uri));
        });
        test('cell#index', function () {
            assert.strictEqual(notebook.apiNotebook.cellCount, 2);
            const [first, second] = notebook.apiNotebook.getCells();
            assert.strictEqual(first.index, 0);
            assert.strictEqual(second.index, 1);
            // remove first cell
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: notebook.apiNotebook.version + 1,
                rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.ModelChange,
                        changes: [[0, 1, []]]
                    }]
            }), false);
            assert.strictEqual(notebook.apiNotebook.cellCount, 1);
            assert.strictEqual(second.index, 0);
            extHostNotebookDocuments.$acceptModelChanged(notebookUri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: notebook.apiNotebook.version + 1,
                rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.ModelChange,
                        changes: [[0, 0, [{
                                        handle: 2,
                                        uri: notebookCommon_1.CellUri.generate(notebookUri, 2),
                                        source: ['Hello', 'World', 'Hello World!'],
                                        eol: '\n',
                                        language: 'test',
                                        cellKind: notebookCommon_1.CellKind.Code,
                                        outputs: [],
                                    }, {
                                        handle: 3,
                                        uri: notebookCommon_1.CellUri.generate(notebookUri, 3),
                                        source: ['Hallo', 'Welt', 'Hallo Welt!'],
                                        eol: '\n',
                                        language: 'test',
                                        cellKind: notebookCommon_1.CellKind.Code,
                                        outputs: [],
                                    }]]]
                    }]
            }), false);
            assert.strictEqual(notebook.apiNotebook.cellCount, 3);
            assert.strictEqual(second.index, 2);
        });
        test('ERR MISSING extHostDocument for notebook cell: #116711', async function () {
            const p = event_1.Event.toPromise(extHostNotebookDocuments.onDidChangeNotebookDocument);
            // DON'T call this, make sure the cell-documents have not been created yet
            // assert.strictEqual(notebook.notebookDocument.cellCount, 2);
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: 100,
                rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.ModelChange,
                        changes: [[0, 2, [{
                                        handle: 3,
                                        uri: notebookCommon_1.CellUri.generate(notebookUri, 3),
                                        source: ['### Heading'],
                                        eol: '\n',
                                        language: 'markdown',
                                        cellKind: notebookCommon_1.CellKind.Markup,
                                        outputs: [],
                                    }, {
                                        handle: 4,
                                        uri: notebookCommon_1.CellUri.generate(notebookUri, 4),
                                        source: ['console.log("aaa")', 'console.log("bbb")'],
                                        eol: '\n',
                                        language: 'javascript',
                                        cellKind: notebookCommon_1.CellKind.Code,
                                        outputs: [],
                                    }]]]
                    }]
            }), false);
            assert.strictEqual(notebook.apiNotebook.cellCount, 2);
            const event = await p;
            assert.strictEqual(event.notebook === notebook.apiNotebook, true);
            assert.strictEqual(event.contentChanges.length, 1);
            assert.strictEqual(event.contentChanges[0].range.end - event.contentChanges[0].range.start, 2);
            assert.strictEqual(event.contentChanges[0].removedCells[0].document.isClosed, true);
            assert.strictEqual(event.contentChanges[0].removedCells[1].document.isClosed, true);
            assert.strictEqual(event.contentChanges[0].addedCells.length, 2);
            assert.strictEqual(event.contentChanges[0].addedCells[0].document.isClosed, false);
            assert.strictEqual(event.contentChanges[0].addedCells[1].document.isClosed, false);
        });
        test('Opening a notebook results in VS Code firing the event onDidChangeActiveNotebookEditor twice #118470', function () {
            let count = 0;
            disposables.add(extHostNotebooks.onDidChangeActiveNotebookEditor(() => count += 1));
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({
                addedEditors: [{
                        documentUri: notebookUri,
                        id: '_notebook_editor_2',
                        selections: [{ start: 0, end: 1 }],
                        visibleRanges: []
                    }]
            }));
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({
                newActiveEditor: '_notebook_editor_2'
            }));
            assert.strictEqual(count, 1);
        });
        test('unset active notebook editor', function () {
            const editor = extHostNotebooks.activeNotebookEditor;
            assert.ok(editor !== undefined);
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({ newActiveEditor: undefined }));
            assert.ok(extHostNotebooks.activeNotebookEditor === editor);
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({}));
            assert.ok(extHostNotebooks.activeNotebookEditor === editor);
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({ newActiveEditor: null }));
            assert.ok(extHostNotebooks.activeNotebookEditor === undefined);
        });
        test('change cell language triggers onDidChange events', async function () {
            const first = notebook.apiNotebook.cellAt(0);
            assert.strictEqual(first.document.languageId, 'markdown');
            const removed = event_1.Event.toPromise(extHostDocuments.onDidRemoveDocument);
            const added = event_1.Event.toPromise(extHostDocuments.onDidAddDocument);
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: 12, rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage,
                        index: 0,
                        language: 'fooLang'
                    }]
            }), false);
            const removedDoc = await removed;
            const addedDoc = await added;
            assert.strictEqual(first.document.languageId, 'fooLang');
            assert.ok(removedDoc === addedDoc);
        });
        test('onDidChangeNotebook-event, cell changes', async function () {
            const p = event_1.Event.toPromise(extHostNotebookDocuments.onDidChangeNotebookDocument);
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: 12, rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellMetadata,
                        index: 0,
                        metadata: { foo: 1 }
                    }, {
                        kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellMetadata,
                        index: 1,
                        metadata: { foo: 2 },
                    }, {
                        kind: notebookCommon_1.NotebookCellsChangeType.Output,
                        index: 1,
                        outputs: [
                            {
                                items: [{
                                        valueBytes: buffer_1.VSBuffer.fromByteArray([0, 2, 3]),
                                        mime: 'text/plain'
                                    }],
                                outputId: '1'
                            }
                        ]
                    }]
            }), false, undefined);
            const event = await p;
            assert.strictEqual(event.notebook === notebook.apiNotebook, true);
            assert.strictEqual(event.contentChanges.length, 0);
            assert.strictEqual(event.cellChanges.length, 2);
            const [first, second] = event.cellChanges;
            assert.deepStrictEqual(first.metadata, first.cell.metadata);
            assert.deepStrictEqual(first.executionSummary, undefined);
            assert.deepStrictEqual(first.outputs, undefined);
            assert.deepStrictEqual(first.document, undefined);
            assert.deepStrictEqual(second.outputs, second.cell.outputs);
            assert.deepStrictEqual(second.metadata, second.cell.metadata);
            assert.deepStrictEqual(second.executionSummary, undefined);
            assert.deepStrictEqual(second.document, undefined);
        });
        test('onDidChangeNotebook-event, notebook metadata', async function () {
            const p = event_1.Event.toPromise(extHostNotebookDocuments.onDidChangeNotebookDocument);
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({ versionId: 12, rawEvents: [] }), false, { foo: 2 });
            const event = await p;
            assert.strictEqual(event.notebook === notebook.apiNotebook, true);
            assert.strictEqual(event.contentChanges.length, 0);
            assert.strictEqual(event.cellChanges.length, 0);
            assert.deepStrictEqual(event.metadata, { foo: 2 });
        });
        test('onDidChangeNotebook-event, froozen data', async function () {
            const p = event_1.Event.toPromise(extHostNotebookDocuments.onDidChangeNotebookDocument);
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({ versionId: 12, rawEvents: [] }), false, { foo: 2 });
            const event = await p;
            assert.ok(Object.isFrozen(event));
            assert.ok(Object.isFrozen(event.cellChanges));
            assert.ok(Object.isFrozen(event.contentChanges));
            assert.ok(Object.isFrozen(event.notebook));
            assert.ok(!Object.isFrozen(event.metadata));
        });
        test('change cell language and onDidChangeNotebookDocument', async function () {
            const p = event_1.Event.toPromise(extHostNotebookDocuments.onDidChangeNotebookDocument);
            const first = notebook.apiNotebook.cellAt(0);
            assert.strictEqual(first.document.languageId, 'markdown');
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: 12,
                rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage,
                        index: 0,
                        language: 'fooLang'
                    }]
            }), false);
            const event = await p;
            assert.strictEqual(event.notebook === notebook.apiNotebook, true);
            assert.strictEqual(event.contentChanges.length, 0);
            assert.strictEqual(event.cellChanges.length, 1);
            const [cellChange] = event.cellChanges;
            assert.strictEqual(cellChange.cell === first, true);
            assert.ok(cellChange.document === first.document);
            assert.ok(cellChange.executionSummary === undefined);
            assert.ok(cellChange.metadata === undefined);
            assert.ok(cellChange.outputs === undefined);
        });
        test('change notebook cell document and onDidChangeNotebookDocument', async function () {
            const p = event_1.Event.toPromise(extHostNotebookDocuments.onDidChangeNotebookDocument);
            const first = notebook.apiNotebook.cellAt(0);
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: 12,
                rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellContent,
                        index: 0
                    }]
            }), false);
            const event = await p;
            assert.strictEqual(event.notebook === notebook.apiNotebook, true);
            assert.strictEqual(event.contentChanges.length, 0);
            assert.strictEqual(event.cellChanges.length, 1);
            const [cellChange] = event.cellChanges;
            assert.strictEqual(cellChange.cell === first, true);
            assert.ok(cellChange.document === first.document);
            assert.ok(cellChange.executionSummary === undefined);
            assert.ok(cellChange.metadata === undefined);
            assert.ok(cellChange.outputs === undefined);
        });
        async function replaceOutputs(cellIndex, outputId, outputItems) {
            const changeEvent = event_1.Event.toPromise(extHostNotebookDocuments.onDidChangeNotebookDocument);
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: notebook.apiNotebook.version + 1,
                rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.Output,
                        index: cellIndex,
                        outputs: [{ outputId, items: outputItems }]
                    }]
            }), false);
            await changeEvent;
        }
        async function appendOutputItem(cellIndex, outputId, outputItems) {
            const changeEvent = event_1.Event.toPromise(extHostNotebookDocuments.onDidChangeNotebookDocument);
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: notebook.apiNotebook.version + 1,
                rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.OutputItem,
                        index: cellIndex,
                        append: true,
                        outputId,
                        outputItems
                    }]
            }), false);
            await changeEvent;
        }
        test('Append multiple text/plain output items', async function () {
            await replaceOutputs(1, '1', [{ mime: 'text/plain', valueBytes: buffer_1.VSBuffer.fromString('foo') }]);
            await appendOutputItem(1, '1', [{ mime: 'text/plain', valueBytes: buffer_1.VSBuffer.fromString('bar') }]);
            await appendOutputItem(1, '1', [{ mime: 'text/plain', valueBytes: buffer_1.VSBuffer.fromString('baz') }]);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs.length, 1);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items.length, 3);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items[0].mime, 'text/plain');
            assert.strictEqual(buffer_1.VSBuffer.wrap(notebook.apiNotebook.cellAt(1).outputs[0].items[0].data).toString(), 'foo');
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items[1].mime, 'text/plain');
            assert.strictEqual(buffer_1.VSBuffer.wrap(notebook.apiNotebook.cellAt(1).outputs[0].items[1].data).toString(), 'bar');
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items[2].mime, 'text/plain');
            assert.strictEqual(buffer_1.VSBuffer.wrap(notebook.apiNotebook.cellAt(1).outputs[0].items[2].data).toString(), 'baz');
        });
        test('Append multiple stdout stream output items to an output with another mime', async function () {
            await replaceOutputs(1, '1', [{ mime: 'text/plain', valueBytes: buffer_1.VSBuffer.fromString('foo') }]);
            await appendOutputItem(1, '1', [{ mime: 'application/vnd.code.notebook.stdout', valueBytes: buffer_1.VSBuffer.fromString('bar') }]);
            await appendOutputItem(1, '1', [{ mime: 'application/vnd.code.notebook.stdout', valueBytes: buffer_1.VSBuffer.fromString('baz') }]);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs.length, 1);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items.length, 3);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items[0].mime, 'text/plain');
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items[1].mime, 'application/vnd.code.notebook.stdout');
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items[2].mime, 'application/vnd.code.notebook.stdout');
        });
        test('Compress multiple stdout stream output items', async function () {
            await replaceOutputs(1, '1', [{ mime: 'application/vnd.code.notebook.stdout', valueBytes: buffer_1.VSBuffer.fromString('foo') }]);
            await appendOutputItem(1, '1', [{ mime: 'application/vnd.code.notebook.stdout', valueBytes: buffer_1.VSBuffer.fromString('bar') }]);
            await appendOutputItem(1, '1', [{ mime: 'application/vnd.code.notebook.stdout', valueBytes: buffer_1.VSBuffer.fromString('baz') }]);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs.length, 1);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items.length, 1);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items[0].mime, 'application/vnd.code.notebook.stdout');
            assert.strictEqual(buffer_1.VSBuffer.wrap(notebook.apiNotebook.cellAt(1).outputs[0].items[0].data).toString(), 'foobarbaz');
        });
        test('Compress multiple stdout stream output items (with support for terminal escape code -> \u001b[A)', async function () {
            await replaceOutputs(1, '1', [{ mime: 'application/vnd.code.notebook.stdout', valueBytes: buffer_1.VSBuffer.fromString('\nfoo') }]);
            await appendOutputItem(1, '1', [{ mime: 'application/vnd.code.notebook.stdout', valueBytes: buffer_1.VSBuffer.fromString(`${String.fromCharCode(27)}[Abar`) }]);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs.length, 1);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items.length, 1);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items[0].mime, 'application/vnd.code.notebook.stdout');
            assert.strictEqual(buffer_1.VSBuffer.wrap(notebook.apiNotebook.cellAt(1).outputs[0].items[0].data).toString(), 'bar');
        });
        test('Compress multiple stdout stream output items (with support for terminal escape code -> \r character)', async function () {
            await replaceOutputs(1, '1', [{ mime: 'application/vnd.code.notebook.stdout', valueBytes: buffer_1.VSBuffer.fromString('foo') }]);
            await appendOutputItem(1, '1', [{ mime: 'application/vnd.code.notebook.stdout', valueBytes: buffer_1.VSBuffer.fromString(`\rbar`) }]);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs.length, 1);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items.length, 1);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items[0].mime, 'application/vnd.code.notebook.stdout');
            assert.strictEqual(buffer_1.VSBuffer.wrap(notebook.apiNotebook.cellAt(1).outputs[0].items[0].data).toString(), 'bar');
        });
        test('Compress multiple stderr stream output items', async function () {
            await replaceOutputs(1, '1', [{ mime: 'application/vnd.code.notebook.stderr', valueBytes: buffer_1.VSBuffer.fromString('foo') }]);
            await appendOutputItem(1, '1', [{ mime: 'application/vnd.code.notebook.stderr', valueBytes: buffer_1.VSBuffer.fromString('bar') }]);
            await appendOutputItem(1, '1', [{ mime: 'application/vnd.code.notebook.stderr', valueBytes: buffer_1.VSBuffer.fromString('baz') }]);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs.length, 1);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items.length, 1);
            assert.strictEqual(notebook.apiNotebook.cellAt(1).outputs[0].items[0].mime, 'application/vnd.code.notebook.stderr');
            assert.strictEqual(buffer_1.VSBuffer.wrap(notebook.apiNotebook.cellAt(1).outputs[0].items[0].data).toString(), 'foobarbaz');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9leHRIb3N0Tm90ZWJvb2sudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTZCaEcsS0FBSyxDQUFDLHVCQUF1QixFQUFFO1FBQzlCLElBQUksV0FBNEIsQ0FBQztRQUNqQyxJQUFJLFFBQWlDLENBQUM7UUFDdEMsSUFBSSwwQkFBc0QsQ0FBQztRQUMzRCxJQUFJLGdCQUFrQyxDQUFDO1FBQ3ZDLElBQUksZ0JBQTJDLENBQUM7UUFDaEQsSUFBSSx3QkFBa0QsQ0FBQztRQUN2RCxJQUFJLHlCQUFvRCxDQUFDO1FBQ3pELElBQUksYUFBNEIsQ0FBQztRQUVqQyxNQUFNLFdBQVcsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDdkQsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsUUFBUSxDQUFDO1lBQ1IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxLQUFLO1lBQ1YsV0FBVyxHQUFHLElBQUksaUNBQWUsRUFBRSxDQUFDO1lBQ3BDLFdBQVcsQ0FBQyxHQUFHLENBQUMsOEJBQVcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBMkI7Z0JBQ3ZGLGdCQUFnQixLQUFLLENBQUM7YUFDL0IsQ0FBQyxDQUFDO1lBQ0gsV0FBVyxDQUFDLEdBQUcsQ0FBQyw4QkFBVyxDQUFDLGtCQUFrQixFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUEyQjtnQkFDdkYsS0FB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LENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDMUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdHLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDMUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdHLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDMUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxD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WUFFM0gsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO1lBQ3BILE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNwSCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=