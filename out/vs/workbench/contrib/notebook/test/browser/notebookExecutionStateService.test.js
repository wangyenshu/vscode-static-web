/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/editor/common/languages/modesRegistry", "vs/platform/actions/common/actions", "vs/platform/extensions/common/extensions", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/services/notebookExecutionServiceImpl", "vs/workbench/contrib/notebook/browser/services/notebookExecutionStateServiceImpl", "vs/workbench/contrib/notebook/browser/services/notebookKernelServiceImpl", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, async_1, event_1, lifecycle_1, uri_1, mock_1, modesRegistry_1, actions_1, extensions_1, cellOperations_1, notebookExecutionServiceImpl_1, notebookExecutionStateServiceImpl_1, notebookKernelServiceImpl_1, notebookCommon_1, notebookExecutionService_1, notebookExecutionStateService_1, notebookKernelService_1, notebookService_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookExecutionStateService', () => {
        let instantiationService;
        let kernelService;
        let disposables;
        let testNotebookModel;
        teardown(() => {
            disposables.dispose();
        });
        setup(function () {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
            instantiationService.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidAddNotebookDocument = event_1.Event.None;
                    this.onWillRemoveNotebookDocument = event_1.Event.None;
                }
                getNotebookTextModels() { return []; }
                getNotebookTextModel(uri) {
                    return testNotebookModel;
                }
            });
            instantiationService.stub(actions_1.IMenuService, new class extends (0, mock_1.mock)() {
                createMenu() {
                    return new class extends (0, mock_1.mock)() {
                        constructor() {
                            super(...arguments);
                            this.onDidChange = event_1.Event.None;
                        }
                        getActions() { return []; }
                        dispose() { }
                    };
                }
            });
            kernelService = disposables.add(instantiationService.createInstance(notebookKernelServiceImpl_1.NotebookKernelService));
            instantiationService.set(notebookKernelService_1.INotebookKernelService, kernelService);
            instantiationService.set(notebookExecutionService_1.INotebookExecutionService, disposables.add(instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService)));
            instantiationService.set(notebookExecutionStateService_1.INotebookExecutionStateService, disposables.add(instantiationService.createInstance(notebookExecutionStateServiceImpl_1.NotebookExecutionStateService)));
        });
        async function withTestNotebook(cells, callback) {
            return (0, testNotebookEditor_1.withTestNotebook)(cells, (editor, viewModel) => callback(viewModel, viewModel.notebookDocument));
        }
        function testCancelOnDelete(expectedCancels, implementsInterrupt) {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                let cancels = 0;
                const kernel = new class extends TestNotebookKernel {
                    constructor() {
                        super({ languages: ['javascript'] });
                        this.implementsInterrupt = implementsInterrupt;
                    }
                    async executeNotebookCellsRequest() { }
                    async cancelNotebookCellExecution(_uri, handles) {
                        cancels += handles.length;
                    }
                };
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                // Should cancel executing and pending cells, when kernel does not implement interrupt
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const cell2 = (0, cellOperations_1.insertCellAtIndex)(viewModel, 1, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const cell3 = (0, cellOperations_1.insertCellAtIndex)(viewModel, 2, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                (0, cellOperations_1.insertCellAtIndex)(viewModel, 3, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true); // Not deleted
                const exe = executionStateService.createCellExecution(viewModel.uri, cell.handle); // Executing
                exe.confirm();
                exe.update([{ editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState, executionOrder: 1 }]);
                const exe2 = executionStateService.createCellExecution(viewModel.uri, cell2.handle); // Pending
                exe2.confirm();
                executionStateService.createCellExecution(viewModel.uri, cell3.handle); // Unconfirmed
                assert.strictEqual(cancels, 0);
                viewModel.notebookDocument.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 0, count: 3, cells: []
                    }], true, undefined, () => undefined, undefined, false);
                assert.strictEqual(cancels, expectedCancels);
            });
        }
        // TODO@roblou Could be a test just for NotebookExecutionListeners, which can be a standalone contribution
        test('cancel execution when cell is deleted', async function () {
            return testCancelOnDelete(3, false);
        });
        test('cancel execution when cell is deleted in interrupt-type kernel', async function () {
            return testCancelOnDelete(1, true);
        });
        test('fires onDidChangeCellExecution when cell is completed while deleted', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const exe = executionStateService.createCellExecution(viewModel.uri, cell.handle);
                let didFire = false;
                disposables.add(executionStateService.onDidChangeExecution(e => {
                    if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell) {
                        didFire = !e.changed;
                    }
                }));
                viewModel.notebookDocument.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 0, count: 1, cells: []
                    }], true, undefined, () => undefined, undefined, false);
                exe.complete({});
                assert.strictEqual(didFire, true);
            });
        });
        test('does not fire onDidChangeCellExecution for output updates', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const exe = executionStateService.createCellExecution(viewModel.uri, cell.handle);
                let didFire = false;
                disposables.add(executionStateService.onDidChangeExecution(e => {
                    if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell) {
                        didFire = true;
                    }
                }));
                exe.update([{ editType: notebookExecutionService_1.CellExecutionUpdateType.OutputItems, items: [], outputId: '1' }]);
                assert.strictEqual(didFire, false);
                exe.update([{ editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState, executionOrder: 123 }]);
                assert.strictEqual(didFire, true);
                exe.complete({});
            });
        });
        // #142466
        test('getCellExecution and onDidChangeCellExecution', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const deferred = new async_1.DeferredPromise();
                disposables.add(executionStateService.onDidChangeExecution(e => {
                    if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell) {
                        const cellUri = notebookCommon_1.CellUri.generate(e.notebook, e.cellHandle);
                        const exe = executionStateService.getCellExecution(cellUri);
                        assert.ok(exe);
                        assert.strictEqual(e.notebook.toString(), exe.notebook.toString());
                        assert.strictEqual(e.cellHandle, exe.cellHandle);
                        assert.strictEqual(exe.notebook.toString(), e.changed?.notebook.toString());
                        assert.strictEqual(exe.cellHandle, e.changed?.cellHandle);
                        deferred.complete();
                    }
                }));
                executionStateService.createCellExecution(viewModel.uri, cell.handle);
                return deferred.p;
            });
        });
        test('getExecution and onDidChangeExecution', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const eventRaisedWithExecution = [];
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                executionStateService.onDidChangeExecution(e => eventRaisedWithExecution.push(e.type === notebookExecutionStateService_1.NotebookExecutionType.notebook && !!e.changed), this, disposables);
                const deferred = new async_1.DeferredPromise();
                disposables.add(executionStateService.onDidChangeExecution(e => {
                    if (e.type === notebookExecutionStateService_1.NotebookExecutionType.notebook) {
                        const exe = executionStateService.getExecution(viewModel.uri);
                        assert.ok(exe);
                        assert.strictEqual(e.notebook.toString(), exe.notebook.toString());
                        assert.ok(e.affectsNotebook(viewModel.uri));
                        assert.deepStrictEqual(eventRaisedWithExecution, [true]);
                        deferred.complete();
                    }
                }));
                executionStateService.createExecution(viewModel.uri);
                return deferred.p;
            });
        });
        test('getExecution and onDidChangeExecution 2', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const deferred = new async_1.DeferredPromise();
                const expectedNotebookEventStates = [notebookCommon_1.NotebookExecutionState.Unconfirmed, notebookCommon_1.NotebookExecutionState.Pending, notebookCommon_1.NotebookExecutionState.Executing, undefined];
                executionStateService.onDidChangeExecution(e => {
                    if (e.type === notebookExecutionStateService_1.NotebookExecutionType.notebook) {
                        const expectedState = expectedNotebookEventStates.shift();
                        if (typeof expectedState === 'number') {
                            const exe = executionStateService.getExecution(viewModel.uri);
                            assert.ok(exe);
                            assert.strictEqual(e.notebook.toString(), exe.notebook.toString());
                            assert.strictEqual(e.changed?.state, expectedState);
                        }
                        else {
                            assert.ok(e.changed === undefined);
                        }
                        assert.ok(e.affectsNotebook(viewModel.uri));
                        if (expectedNotebookEventStates.length === 0) {
                            deferred.complete();
                        }
                    }
                }, this, disposables);
                const execution = executionStateService.createExecution(viewModel.uri);
                execution.confirm();
                execution.begin();
                execution.complete();
                return deferred.p;
            });
        });
        test('force-cancel works for Cell Execution', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                executionStateService.createCellExecution(viewModel.uri, cell.handle);
                const exe = executionStateService.getCellExecution(cell.uri);
                assert.ok(exe);
                executionStateService.forceCancelNotebookExecutions(viewModel.uri);
                const exe2 = executionStateService.getCellExecution(cell.uri);
                assert.strictEqual(exe2, undefined);
            });
        });
        test('force-cancel works for Notebook Execution', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const eventRaisedWithExecution = [];
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                executionStateService.onDidChangeExecution(e => eventRaisedWithExecution.push(e.type === notebookExecutionStateService_1.NotebookExecutionType.notebook && !!e.changed), this, disposables);
                executionStateService.createExecution(viewModel.uri);
                const exe = executionStateService.getExecution(viewModel.uri);
                assert.ok(exe);
                assert.deepStrictEqual(eventRaisedWithExecution, [true]);
                executionStateService.forceCancelNotebookExecutions(viewModel.uri);
                const exe2 = executionStateService.getExecution(viewModel.uri);
                assert.deepStrictEqual(eventRaisedWithExecution, [true, false]);
                assert.strictEqual(exe2, undefined);
            });
        });
        test('force-cancel works for Cell and Notebook Execution', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                executionStateService.createExecution(viewModel.uri);
                executionStateService.createExecution(viewModel.uri);
                const cellExe = executionStateService.getExecution(viewModel.uri);
                const exe = executionStateService.getExecution(viewModel.uri);
                assert.ok(cellExe);
                assert.ok(exe);
                executionStateService.forceCancelNotebookExecutions(viewModel.uri);
                const cellExe2 = executionStateService.getExecution(viewModel.uri);
                const exe2 = executionStateService.getExecution(viewModel.uri);
                assert.strictEqual(cellExe2, undefined);
                assert.strictEqual(exe2, undefined);
            });
        });
    });
    class TestNotebookKernel {
        async executeNotebookCellsRequest() { }
        async cancelNotebookCellExecution(uri, cellHandles) { }
        provideVariables(notebookUri, parentId, kind, start, token) {
            return async_1.AsyncIterableObject.EMPTY;
        }
        constructor(opts) {
            this.id = 'test';
            this.label = '';
            this.viewType = '*';
            this.onDidChange = event_1.Event.None;
            this.extension = new extensions_1.ExtensionIdentifier('test');
            this.localResourceRoot = uri_1.URI.file('/test');
            this.preloadUris = [];
            this.preloadProvides = [];
            this.supportedLanguages = [];
            this.supportedLanguages = opts?.languages ?? [modesRegistry_1.PLAINTEXT_LANGUAGE_ID];
            if (opts?.id) {
                this.id = opts?.id;
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFeGVjdXRpb25TdGF0ZVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9ub3RlYm9va0V4ZWN1dGlvblN0YXRlU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBMEJoRyxLQUFLLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO1FBRTNDLElBQUksb0JBQThDLENBQUM7UUFDbkQsSUFBSSxhQUFxQyxDQUFDO1FBQzFDLElBQUksV0FBNEIsQ0FBQztRQUNqQyxJQUFJLGlCQUFnRCxDQUFDO1FBRXJELFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFFSCxLQUFLLENBQUM7WUFFTCxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFcEMsb0JBQW9CLEdBQUcsSUFBQSw4Q0FBeUIsRUFBQyxXQUFXLENBQUMsQ0FBQztZQUU5RCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsa0NBQWdCLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQW9CO2dCQUF0Qzs7b0JBQ3RDLDZCQUF3QixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ3RDLGlDQUE0QixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7Z0JBS3BELENBQUM7Z0JBSlMscUJBQXFCLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxvQkFBb0IsQ0FBQyxHQUFRO29CQUNyQyxPQUFPLGlCQUFpQixDQUFDO2dCQUMxQixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHNCQUFZLEVB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