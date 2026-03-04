/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/editor/browser/editorResolverService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, lifecycle_1, network_1, uri_1, utils_1, diffEditorInput_1, editorResolverService_1, editorGroupsService_1, editorResolverService_2, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorResolverService', () => {
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForEditorResolverService';
        const disposables = new lifecycle_1.DisposableStore();
        teardown(() => disposables.clear());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        async function createEditorResolverService(instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables)) {
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorResolverService = instantiationService.createInstance(editorResolverService_1.EditorResolverService);
            instantiationService.stub(editorResolverService_2.IEditorResolverService, editorResolverService);
            disposables.add(editorResolverService);
            return [part, editorResolverService, instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor)];
        }
        function constructDisposableFileEditorInput(uri, typeId, store) {
            const editor = new workbenchTestServices_1.TestFileEditorInput(uri, typeId);
            store.add(editor);
            return editor;
        }
        test('Simple Resolve', async () => {
            const [part, service] = await createEditorResolverService();
            const registeredEditor = service.registerEditor('*.test', {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) }),
            });
            const resultingResolution = await service.resolveEditor({ resource: uri_1.URI.file('my://resource-basics.test') }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, TEST_EDITOR_INPUT_ID);
                resultingResolution.editor.dispose();
            }
            registeredEditor.dispose();
        });
        test('Untitled Resolve', async () => {
            const UNTITLED_TEST_EDITOR_INPUT_ID = 'UNTITLED_TEST_INPUT';
            const [part, service] = await createEditorResolverService();
            const registeredEditor = service.registerEditor('*.test', {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) }),
                createUntitledEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput((resource ? resource : uri_1.URI.from({ scheme: network_1.Schemas.untitled })), UNTITLED_TEST_EDITOR_INPUT_ID) }),
            });
            // Untyped untitled - no resource
            let resultingResolution = await service.resolveEditor({ resource: undefined }, part.activeGroup);
            assert.ok(resultingResolution);
            // We don't expect untitled to match the *.test glob
            assert.strictEqual(typeof resultingResolution, 'number');
            // Untyped untitled - with untitled resource
            resultingResolution = await service.resolveEditor({ resource: uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'foo.test' }) }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, UNTITLED_TEST_EDITOR_INPUT_ID);
                resultingResolution.editor.dispose();
            }
            // Untyped untitled - file resource with forceUntitled
            resultingResolution = await service.resolveEditor({ resource: uri_1.URI.file('/fake.test'), forceUntitled: true }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, UNTITLED_TEST_EDITOR_INPUT_ID);
                resultingResolution.editor.dispose();
            }
            registeredEditor.dispose();
        });
        test('Side by side Resolve', async () => {
            const [part, service] = await createEditorResolverService();
            const registeredEditorPrimary = service.registerEditor('*.test-primary', {
                id: 'TEST_EDITOR_PRIMARY',
                label: 'Test Editor Label Primary',
                detail: 'Test Editor Details Primary',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: constructDisposableFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID, disposables) }),
            });
            const registeredEditorSecondary = service.registerEditor('*.test-secondary', {
                id: 'TEST_EDITOR_SECONDARY',
                label: 'Test Editor Label Secondary',
                detail: 'Test Editor Details Secondary',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: constructDisposableFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID, disposables) }),
            });
            const resultingResolution = await service.resolveEditor({
                primary: { resource: uri_1.URI.file('my://resource-basics.test-primary') },
                secondary: { resource: uri_1.URI.file('my://resource-basics.test-secondary') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editorinputs.sidebysideEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            registeredEditorPrimary.dispose();
            registeredEditorSecondary.dispose();
        });
        test('Diff editor Resolve', async () => {
            const [part, service, accessor] = await createEditorResolverService();
            const registeredEditor = service.registerEditor('*.test-diff', {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: constructDisposableFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID, disposables) }),
                createDiffEditorInput: ({ modified, original, options }, group) => ({
                    editor: accessor.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', constructDisposableFileEditorInput(uri_1.URI.parse(original.toString()), TEST_EDITOR_INPUT_ID, disposables), constructDisposableFileEditorInput(uri_1.URI.parse(modified.toString()), TEST_EDITOR_INPUT_ID, disposables), undefined)
                })
            });
            const resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-diff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-diff') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            registeredEditor.dispose();
        });
        test('Diff editor Resolve - Different Types', async () => {
            const [part, service, accessor] = await createEditorResolverService();
            let diffOneCounter = 0;
            let diffTwoCounter = 0;
            let defaultDiffCounter = 0;
            const registeredEditor = service.registerEditor('*.test-diff', {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: constructDisposableFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID, disposables) }),
                createDiffEditorInput: ({ modified, original, options }, group) => {
                    diffOneCounter++;
                    return {
                        editor: accessor.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', constructDisposableFileEditorInput(uri_1.URI.parse(original.toString()), TEST_EDITOR_INPUT_ID, disposables), constructDisposableFileEditorInput(uri_1.URI.parse(modified.toString()), TEST_EDITOR_INPUT_ID, disposables), undefined)
                    };
                }
            });
            const secondRegisteredEditor = service.registerEditor('*.test-secondDiff', {
                id: 'TEST_EDITOR_2',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) }),
                createDiffEditorInput: ({ modified, original, options }, group) => {
                    diffTwoCounter++;
                    return {
                        editor: accessor.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', constructDisposableFileEditorInput(uri_1.URI.parse(original.toString()), TEST_EDITOR_INPUT_ID, disposables), constructDisposableFileEditorInput(uri_1.URI.parse(modified.toString()), TEST_EDITOR_INPUT_ID, disposables), undefined)
                    };
                }
            });
            const defaultRegisteredEditor = service.registerEditor('*', {
                id: 'default',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.option
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) }),
                createDiffEditorInput: ({ modified, original, options }, group) => {
                    defaultDiffCounter++;
                    return {
                        editor: accessor.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', constructDisposableFileEditorInput(uri_1.URI.parse(original.toString()), TEST_EDITOR_INPUT_ID, disposables), constructDisposableFileEditorInput(uri_1.URI.parse(modified.toString()), TEST_EDITOR_INPUT_ID, disposables), undefined)
                    };
                }
            });
            let resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-diff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-diff') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(diffOneCounter, 1);
                assert.strictEqual(diffTwoCounter, 0);
                assert.strictEqual(defaultDiffCounter, 0);
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-secondDiff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-secondDiff') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(diffOneCounter, 1);
                assert.strictEqual(diffTwoCounter, 1);
                assert.strictEqual(defaultDiffCounter, 0);
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-secondDiff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-diff') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(diffOneCounter, 1);
                assert.strictEqual(diffTwoCounter, 1);
                assert.strictEqual(defaultDiffCounter, 1);
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-diff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-secondDiff') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(diffOneCounter, 1);
                assert.strictEqual(diffTwoCounter, 1);
                assert.strictEqual(defaultDiffCounter, 2);
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test-secondDiff') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test-diff') },
                options: { override: 'TEST_EDITOR' }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(diffOneCounter, 2);
                assert.strictEqual(diffTwoCounter, 1);
                assert.strictEqual(defaultDiffCounter, 2);
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            registeredEditor.dispose();
            secondRegisteredEditor.dispose();
            defaultRegisteredEditor.dispose();
        });
        test('Registry & Events', async () => {
            const [, service] = await createEditorResolverService();
            let eventCounter = 0;
            disposables.add(service.onDidChangeEditorRegistrations(() => {
                eventCounter++;
            }));
            const editors = service.getEditors();
            const registeredEditor = service.registerEditor('*.test', {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            }, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) })
            });
            assert.strictEqual(eventCounter, 1);
            assert.strictEqual(service.getEditors().length, editors.length + 1);
            assert.strictEqual(service.getEditors().some(editor => editor.id === 'TEST_EDITOR'), true);
            registeredEditor.dispose();
            assert.strictEqual(eventCounter, 2);
            assert.strictEqual(service.getEditors().length, editors.length);
            assert.strictEqual(service.getEditors().some(editor => editor.id === 'TEST_EDITOR'), false);
        });
        test('Multiple registrations to same glob and id #155859', async () => {
            const [part, service, accessor] = await createEditorResolverService();
            const testEditorInfo = {
                id: 'TEST_EDITOR',
                label: 'Test Editor Label',
                detail: 'Test Editor Details',
                priority: editorResolverService_2.RegisteredEditorPriority.default
            };
            const registeredSingleEditor = service.registerEditor('*.test', testEditorInfo, {}, {
                createEditorInput: ({ resource, options }, group) => ({ editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse(resource.toString()), TEST_EDITOR_INPUT_ID) })
            });
            const registeredDiffEditor = service.registerEditor('*.test', testEditorInfo, {}, {
                createDiffEditorInput: ({ modified, original, options }, group) => ({
                    editor: accessor.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', constructDisposableFileEditorInput(uri_1.URI.parse(original.toString()), TEST_EDITOR_INPUT_ID, disposables), constructDisposableFileEditorInput(uri_1.URI.parse(modified.toString()), TEST_EDITOR_INPUT_ID, disposables), undefined)
                })
            });
            // Resolve a diff
            let resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.notStrictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 1 /* ResolvedStatus.ABORT */ && resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.strictEqual(resultingResolution.editor.typeId, 'workbench.editors.diffEditorInput');
                resultingResolution.editor.dispose();
            }
            else {
                assert.fail();
            }
            // Remove diff registration
            registeredDiffEditor.dispose();
            // Resolve a diff again, expected failure
            resultingResolution = await service.resolveEditor({
                original: { resource: uri_1.URI.file('my://resource-basics.test') },
                modified: { resource: uri_1.URI.file('my://resource-basics.test') }
            }, part.activeGroup);
            assert.ok(resultingResolution);
            assert.strictEqual(typeof resultingResolution, 'number');
            if (resultingResolution !== 2 /* ResolvedStatus.NONE */) {
                assert.fail();
            }
            registeredSingleEditor.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUmVzb2x2ZXJTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZWRpdG9yL3Rlc3QvYnJvd3Nlci9lZGl0b3JSZXNvbHZlclNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBRW5DLE1BQU0sb0JBQW9CLEdBQUcseUNBQXlDLENBQUM7UUFDdkUsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRXBDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLFVBQVUsMkJBQTJCLENBQUMsdUJBQWtELElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQztZQUNqSixNQUFNLElBQUksR0FBRyxNQUFNLElBQUEsd0NBQWdCLEVBQUMsb0JBQW9CLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDdkUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDBDQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXRELE1BQU0scUJBQXFCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDZDQUFxQixDQUFDLENBQUM7WUFDekYsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDhDQUFzQixFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFDekUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBRXZDLE9BQU8sQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUUsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJDQUFtQixDQUFDLENBQUMsQ0FBQztR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