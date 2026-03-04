/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/editor/common/languages/modesRegistry", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/extensions/common/extensions", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/services/notebookExecutionServiceImpl", "vs/workbench/contrib/notebook/browser/services/notebookKernelServiceImpl", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, sinon, async_1, event_1, lifecycle_1, uri_1, mock_1, utils_1, modesRegistry_1, actions_1, commands_1, contextkey_1, extensions_1, cellOperations_1, notebookExecutionServiceImpl_1, notebookKernelServiceImpl_1, notebookCommon_1, notebookExecutionStateService_1, notebookKernelService_1, notebookService_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookExecutionService', () => {
        let instantiationService;
        let contextKeyService;
        let kernelService;
        let disposables;
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
            instantiationService.stub(notebookKernelService_1.INotebookKernelHistoryService, new class extends (0, mock_1.mock)() {
                getKernels(notebook) {
                    return kernelService.getMatchingKernel(notebook);
                }
                addMostRecentKernel(kernel) { }
            });
            instantiationService.stub(commands_1.ICommandService, new class extends (0, mock_1.mock)() {
                executeCommand(_commandId, ..._args) {
                    return Promise.resolve(undefined);
                }
            });
            kernelService = disposables.add(instantiationService.createInstance(notebookKernelServiceImpl_1.NotebookKernelService));
            instantiationService.set(notebookKernelService_1.INotebookKernelService, kernelService);
            contextKeyService = instantiationService.get(contextkey_1.IContextKeyService);
        });
        async function withTestNotebook(cells, callback) {
            return (0, testNotebookEditor_1.withTestNotebook)(cells, (editor, viewModel) => callback(viewModel, viewModel.notebookDocument));
        }
        // test('ctor', () => {
        // 	instantiationService.createInstance(NotebookEditorKernelManager, { activeKernel: undefined, viewModel: undefined });
        // 	const contextKeyService = instantiationService.get(IContextKeyService);
        // 	assert.strictEqual(contextKeyService.getContextKeyValue(NOTEBOOK_KERNEL_COUNT.key), 0);
        // });
        test('cell is not runnable when no kernel is selected', async () => {
            await withTestNotebook([], async (viewModel, textModel) => {
                const executionService = instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 1, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                await (0, utils_1.assertThrowsAsync)(async () => await executionService.executeNotebookCells(textModel, [cell.model], contextKeyService));
            });
        });
        test('cell is not runnable when kernel does not support the language', async () => {
            await withTestNotebook([], async (viewModel, textModel) => {
                kernelService.registerKernel(new TestNotebookKernel({ languages: ['testlang'] }));
                const executionService = instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 1, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                await (0, utils_1.assertThrowsAsync)(async () => await executionService.executeNotebookCells(textModel, [cell.model], contextKeyService));
            });
        });
        test('cell is runnable when kernel does support the language', async () => {
            await withTestNotebook([], async (viewModel, textModel) => {
                const kernel = new TestNotebookKernel({ languages: ['javascript'] });
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, textModel);
                const executionService = instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService);
                const executeSpy = sinon.spy();
                kernel.executeNotebookCellsRequest = executeSpy;
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                await executionService.executeNotebookCells(viewModel.notebookDocument, [cell.model], contextKeyService);
                assert.strictEqual(executeSpy.calledOnce, true);
            });
        });
        test('Completes unconfirmed executions', async function () {
            return withTestNotebook([], async (viewModel, textModel) => {
                let didExecute = false;
                const kernel = new class extends TestNotebookKernel {
                    constructor() {
                        super({ languages: ['javascript'] });
                        this.id = 'mySpecialId';
                    }
                    async executeNotebookCellsRequest() {
                        didExecute = true;
                        return;
                    }
                };
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, textModel);
                const executionService = instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService);
                const exeStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                await executionService.executeNotebookCells(textModel, [cell.model], contextKeyService);
                assert.strictEqual(didExecute, true);
                assert.strictEqual(exeStateService.getCellExecution(cell.uri), undefined);
            });
        });
    });
    class TestNotebookKernel {
        provideVariables(notebookUri, parentId, kind, start, token) {
            return async_1.AsyncIterableObject.EMPTY;
        }
        executeNotebookCellsRequest() {
            throw new Error('Method not implemented.');
        }
        cancelNotebookCellExecution() {
            throw new Error('Method not implemented.');
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
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFeGVjdXRpb25TZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvbm90ZWJvb2tFeGVjdXRpb25TZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE0QmhHLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7UUFFdEMsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLGlCQUFxQyxDQUFDO1FBQzFDLElBQUksYUFBcUMsQ0FBQztRQUMxQyxJQUFJLFdBQTRCLENBQUM7UUFFakMsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQztZQUVMLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUVwQyxvQkFBb0IsR0FBRyxJQUFBLDhDQUF5QixFQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRTlELG9CQUFvQixDQUFDLElBQUksQ0FBQyxrQ0FBZ0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBb0I7Z0JBQXRDOztvQkFDdEMsNkJBQXdCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztvQkFDdEMsaUNBQTRCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztnQkFFcEQsQ0FBQztnQkFEUyxxQkFBcUIsS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDL0MsQ0FBQyxDQUFDO1lBRUgsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHNCQUFZLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQWdCO2dCQUNwRSxVQUFVO29CQUNsQixPQUFPLElBQUksS0FBTSxT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