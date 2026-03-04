/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/extensions/common/extensions", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorModel", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, buffer_1, cancellation_1, lifecycle_1, mime_1, uri_1, mock_1, utils_1, testConfigurationService_1, extensions_1, notebookTextModel_1, notebookCommon_1, notebookEditorModel_1, notebookService_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookFileWorkingCopyModel', function () {
        let disposables;
        let instantiationService;
        const configurationService = new testConfigurationService_1.TestConfigurationService();
        teardown(() => disposables.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
        });
        test('no transient output is send to serializer', async function () {
            const notebook = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, 'notebook', uri_1.URI.file('test'), [{ cellKind: notebookCommon_1.CellKind.Code, language: 'foo', mime: 'foo', source: 'foo', outputs: [{ outputId: 'id', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.fromString('Hello Out') }] }] }], {}, { transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {}, transientOutputs: false });
            { // transient output
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: true, transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells.length, 1);
                        assert.strictEqual(notebook.cells[0].outputs.length, 0);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(1 /* SnapshotContext.Save */, cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
            { // NOT transient output
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: false, transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells.length, 1);
                        assert.strictEqual(notebook.cells[0].outputs.length, 1);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(1 /* SnapshotContext.Save */, cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
        });
        test('no transient metadata is send to serializer', async function () {
            const notebook = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, 'notebook', uri_1.URI.file('test'), [{ cellKind: notebookCommon_1.CellKind.Code, language: 'foo', mime: 'foo', source: 'foo', outputs: [] }], { foo: 123, bar: 456 }, { transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {}, transientOutputs: false });
            disposables.add(notebook);
            { // transient
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: true, transientCellMetadata: {}, transientDocumentMetadata: { bar: true }, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.metadata.foo, 123);
                        assert.strictEqual(notebook.metadata.bar, undefined);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(1 /* SnapshotContext.Save */, cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
            { // NOT transient
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: false, transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.metadata.foo, 123);
                        assert.strictEqual(notebook.metadata.bar, 456);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(1 /* SnapshotContext.Save */, cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
        });
        test('no transient cell metadata is send to serializer', async function () {
            const notebook = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, 'notebook', uri_1.URI.file('test'), [{ cellKind: notebookCommon_1.CellKind.Code, language: 'foo', mime: 'foo', source: 'foo', outputs: [], metadata: { foo: 123, bar: 456 } }], {}, { transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {}, transientOutputs: false, });
            disposables.add(notebook);
            { // transient
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: true, transientDocumentMetadata: {}, transientCellMetadata: { bar: true }, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells[0].metadata.foo, 123);
                        assert.strictEqual(notebook.cells[0].metadata.bar, undefined);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(1 /* SnapshotContext.Save */, cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
            { // NOT transient
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: false, transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells[0].metadata.foo, 123);
                        assert.strictEqual(notebook.cells[0].metadata.bar, 456);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(1 /* SnapshotContext.Save */, cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
        });
        test('Notebooks with outputs beyond the size threshold will throw for backup snapshots', async function () {
            const outputLimit = 100;
            await configurationService.setUserConfiguration(notebookCommon_1.NotebookSetting.outputBackupSizeLimit, outputLimit * 1.0 / 1024);
            const largeOutput = { outputId: '123', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.fromString('a'.repeat(outputLimit + 1)) }] };
            const notebook = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, 'notebook', uri_1.URI.file('test'), [{ cellKind: notebookCommon_1.CellKind.Code, language: 'foo', mime: 'foo', source: 'foo', outputs: [largeOutput], metadata: { foo: 123, bar: 456 } }], {}, { transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {}, transientOutputs: false, });
            disposables.add(notebook);
            let callCount = 0;
            const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.options = { transientOutputs: true, transientDocumentMetadata: {}, transientCellMetadata: { bar: true }, cellContentMetadata: {} };
                }
                async notebookToData(notebook) {
                    callCount += 1;
                    assert.strictEqual(notebook.cells[0].metadata.foo, 123);
                    assert.strictEqual(notebook.cells[0].metadata.bar, undefined);
                    return buffer_1.VSBuffer.fromString('');
                }
            }), configurationService));
            try {
                await model.snapshot(2 /* SnapshotContext.Backup */, cancellation_1.CancellationToken.None);
                assert.fail('Expected snapshot to throw an error for large output');
            }
            catch (e) {
                assert.notEqual(e.code, 'ERR_ASSERTION', e.message);
            }
            await model.snapshot(1 /* SnapshotContext.Save */, cancellation_1.CancellationToken.None);
            assert.strictEqual(callCount, 1);
        });
    });
    function mockNotebookService(notebook, notebookSerializer) {
        return new class extends (0, mock_1.mock)() {
            async withNotebookDataProvider(viewType) {
                return new notebookService_1.SimpleNotebookProviderInfo(notebook.viewType, notebookSerializer, {
                    id: new extensions_1.ExtensionIdentifier('test'),
                    location: undefined
                });
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL25vdGVib29rRWRpdG9yTW9kZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW9CaEcsS0FBSyxDQUFDLDhCQUE4QixFQUFFO1FBRXJDLElBQUksV0FBNEIsQ0FBQztRQUNqQyxJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1FBRTVELFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUV0QyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNwQyxvQkFBb0IsR0FBRyxJQUFBLDhDQUF5QixFQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9ELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJDQUEyQyxFQUFFLEtBQUs7WUFFdEQsTUFBTSxRQUFRLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHFDQUFpQixFQUNyRSxVQUFVLEVBQ1YsU0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFDaEIsQ0FBQyxFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFB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