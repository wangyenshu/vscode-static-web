/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/editor/common/editor", "vs/base/common/uri", "vs/base/common/event", "vs/workbench/common/editor", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/base/common/async", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/browser/parts/editor/editorPlaceholder", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/editor/common/languages/modesRegistry", "vs/base/test/common/utils"], function (require, exports, assert, editor_1, uri_1, event_1, editor_2, workbenchTestServices_1, editorService_1, editorGroupsService_1, editorService_2, descriptors_1, fileEditorInput_1, async_1, files_1, lifecycle_1, mockKeybindingService_1, editorResolverService_1, sideBySideEditorInput_1, editorPlaceholder_1, testConfigurationService_1, configuration_1, modesRegistry_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorService', () => {
        const TEST_EDITOR_ID = 'MyTestEditorForEditorService';
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForEditorService';
        const disposables = new lifecycle_1.DisposableStore();
        let testLocalInstantiationService = undefined;
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestEditor)(TEST_EDITOR_ID, [new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestFileEditorInput), new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestSingletonFileEditorInput)], TEST_EDITOR_INPUT_ID));
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            disposables.add((0, workbenchTestServices_1.registerTestSideBySideEditor)());
        });
        teardown(async () => {
            if (testLocalInstantiationService) {
                await (0, workbenchTestServices_1.workbenchTeardown)(testLocalInstantiationService);
                testLocalInstantiationService = undefined;
            }
            disposables.clear();
        });
        async function createEditorService(instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables)) {
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_1.EditorService, undefined));
            instantiationService.stub(editorService_2.IEditorService, editorService);
            testLocalInstantiationService = instantiationService;
            return [part, editorService, instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor)];
        }
        function createTestFileEditorInput(resource, typeId) {
            return disposables.add(new workbenchTestServices_1.TestFileEditorInput(resource, typeId));
        }
        test('openEditor() - basics', async () => {
            const [, service, accessor] = await createEditorService();
            await testOpenBasics(service, accessor.editorPaneService);
        });
        test('openEditor() - basics (scoped)', async () => {
            const [part, service, accessor] = await createEditorService();
            const scoped = service.createScoped('main', disposables);
            await part.whenReady;
            await testOpenBasics(scoped, accessor.editorPaneService);
        });
        async function testOpenBasics(editorService, editorPaneService) {
            let input = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            let otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-basics'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEventCounter = 0;
            disposables.add(editorService.onDidActiveEditorChange(() => {
                activeEditorChangeEventCounter++;
            }));
            let visibleEditorChangeEventCounter = 0;
            disposables.add(editorService.onDidVisibleEditorsChange(() => {
                visibleEditorChangeEventCounter++;
            }));
            let willOpenEditorListenerCounter = 0;
            disposables.add(editorService.onWillOpenEditor(() => {
                willOpenEditorListenerCounter++;
            }));
            let didCloseEditorListenerCounter = 0;
            disposables.add(editorService.onDidCloseEditor(() => {
                didCloseEditorListenerCounter++;
            }));
            let willInstantiateEditorPaneListenerCounter = 0;
            disposables.add(editorPaneService.onWillInstantiateEditorPane(e => {
                if (e.typeId === TEST_EDITOR_ID) {
                    willInstantiateEditorPaneListenerCounter++;
                }
            }));
            // Open input
            let editor = await editorService.openEditor(input, { pinned: true });
            assert.strictEqual(editor?.getId(), TEST_EDITOR_ID);
            assert.strictEqual(editor, editorService.activeEditorPane);
            assert.strictEqual(1, editorService.count);
            assert.strictEqual(input, editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].editor);
            assert.strictEqual(input, editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0].editor);
            assert.strictEqual(input, editorService.activeEditor);
            assert.strictEqual(editorService.visibleEditorPanes.length, 1);
            assert.strictEqual(editorService.visibleEditorPanes[0], editor);
            assert.ok(!editorService.activeTextEditorControl);
            assert.ok(!editorService.activeTextEditorLanguageId);
            assert.strictEqual(editorService.visibleTextEditorControls.length, 0);
            assert.strictEqual(editorService.isOpened(input), true);
            assert.strictEqual(editorService.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), true);
            assert.strictEqual(editorService.isOpened({ resource: input.resource, typeId: input.typeId, editorId: 'unknownTypeId' }), false);
            assert.strictEqual(editorService.isOpened({ resource: input.resource, typeId: 'unknownTypeId', editorId: input.editorId }), false);
            assert.strictEqual(editorService.isOpened({ resource: input.resource, typeId: 'unknownTypeId', editorId: 'unknownTypeId' }), false);
            assert.strictEqual(editorService.isVisible(input), true);
            assert.strictEqual(editorService.isVisible(otherInput), false);
            assert.strictEqual(willOpenEditorListenerCounter, 1);
            assert.strictEqual(activeEditorChangeEventCounter, 1);
            assert.strictEqual(visibleEditorChangeEventCounter, 1);
            assert.ok(editorPaneService.didInstantiateEditorPane(TEST_EDITOR_ID));
            assert.strictEqual(willInstantiateEditorPaneListenerCounter, 1);
            // Close input
            await editor?.group.closeEditor(input);
            assert.strictEqual(0, editorService.count);
            assert.strictEqual(0, editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length);
            assert.strictEqual(0, editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length);
            assert.strictEqual(didCloseEditorListenerCounter, 1);
            assert.strictEqual(activeEditorChangeEventCounter, 2);
            assert.strictEqual(visibleEditorChangeEventCounter, 2);
            assert.ok(input.gotDisposed);
            // Open again 2 inputs (disposed editors are ignored!)
            await editorService.openEditor(input, { pinned: true });
            assert.strictEqual(0, editorService.count);
            // Open again 2 inputs (recreate because disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-basics'), TEST_EDITOR_INPUT_ID);
            await editorService.openEditor(input, { pinned: true });
            editor = await editorService.openEditor(otherInput, { pinned: true });
            assert.strictEqual(2, editorService.count);
            assert.strictEqual(otherInput, editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].editor);
            assert.strictEqual(input, editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1].editor);
            assert.strictEqual(input, editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0].editor);
            assert.strictEqual(otherInput, editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1].editor);
            assert.strictEqual(editorService.visibleEditorPanes.length, 1);
            assert.strictEqual(editorService.isOpened(input), true);
            assert.strictEqual(editorService.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), true);
            assert.strictEqual(editorService.isOpened(otherInput), true);
            assert.strictEqual(editorService.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            assert.strictEqual(activeEditorChangeEventCounter, 4);
            assert.strictEqual(willOpenEditorListenerCounter, 3);
            assert.strictEqual(visibleEditorChangeEventCounter, 4);
            const stickyInput = createTestFileEditorInput(uri_1.URI.parse('my://resource3-basics'), TEST_EDITOR_INPUT_ID);
            await editorService.openEditor(stickyInput, { sticky: true });
            assert.strictEqual(3, editorService.count);
            const allSequentialEditors = editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            assert.strictEqual(allSequentialEditors.length, 3);
            assert.strictEqual(stickyInput, allSequentialEditors[0].editor);
            assert.strictEqual(input, allSequentialEditors[1].editor);
            assert.strictEqual(otherInput, allSequentialEditors[2].editor);
            const sequentialEditorsExcludingSticky = editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true });
            assert.strictEqual(sequentialEditorsExcludingSticky.length, 2);
            assert.strictEqual(input, sequentialEditorsExcludingSticky[0].editor);
            assert.strictEqual(otherInput, sequentialEditorsExcludingSticky[1].editor);
            const mruEditorsExcludingSticky = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true });
            assert.strictEqual(mruEditorsExcludingSticky.length, 2);
            assert.strictEqual(input, sequentialEditorsExcludingSticky[0].editor);
            assert.strictEqual(otherInput, sequentialEditorsExcludingSticky[1].editor);
        }
        test('openEditor() - multiple calls are cancelled and indicated as such', async () => {
            const [, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-basics'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEventCounter = 0;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEventCounter++;
            });
            let visibleEditorChangeEventCounter = 0;
            const visibleEditorChangeListener = service.onDidVisibleEditorsChange(() => {
                visibleEditorChangeEventCounter++;
            });
            const editorP1 = service.openEditor(input, { pinned: true });
            const editorP2 = service.openEditor(otherInput, { pinned: true });
            const editor1 = await editorP1;
            assert.strictEqual(editor1, undefined);
            const editor2 = await editorP2;
            assert.strictEqual(editor2?.input, otherInput);
            assert.strictEqual(activeEditorChangeEventCounter, 1);
            assert.strictEqual(visibleEditorChangeEventCounter, 1);
            activeEditorChangeListener.dispose();
            visibleEditorChangeListener.dispose();
        });
        test('openEditor() - same input does not cancel previous one - https://github.com/microsoft/vscode/issues/136684', async () => {
            const [, service] = await createEditorService();
            let input = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            let editorP1 = service.openEditor(input, { pinned: true });
            let editorP2 = service.openEditor(input, { pinned: true });
            let editor1 = await editorP1;
            assert.strictEqual(editor1?.input, input);
            let editor2 = await editorP2;
            assert.strictEqual(editor2?.input, input);
            assert.ok(editor2.group);
            await editor2.group.closeAllEditors();
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            const inputSame = createTestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            editorP1 = service.openEditor(input, { pinned: true });
            editorP2 = service.openEditor(inputSame, { pinned: true });
            editor1 = await editorP1;
            assert.strictEqual(editor1?.input, input);
            editor2 = await editorP2;
            assert.strictEqual(editor2?.input, input);
        });
        test('openEditor() - singleton typed editors reveal instead of split', async () => {
            const [part, service] = await createEditorService();
            const input1 = disposables.add(new workbenchTestServices_1.TestSingletonFileEditorInput(uri_1.URI.parse('my://resource-basics1'), TEST_EDITOR_INPUT_ID));
            const input2 = disposables.add(new workbenchTestServices_1.TestSingletonFileEditorInput(uri_1.URI.parse('my://resource-basics2'), TEST_EDITOR_INPUT_ID));
            const input1Group = (await service.openEditor(input1, { pinned: true }))?.group;
            const input2Group = (await service.openEditor(input2, { pinned: true }, editorService_2.SIDE_GROUP))?.group;
            assert.strictEqual(part.activeGroup, input2Group);
            await service.openEditor(input1, { pinned: true });
            assert.strictEqual(part.activeGroup, input1Group);
        });
        test('openEditor() - locked groups', async () => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => ({ editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })
            }));
            const input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input5 = { resource: uri_1.URI.parse('file://resource5-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input6 = { resource: uri_1.URI.parse('file://resource6-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input7 = { resource: uri_1.URI.parse('file://resource7-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const editor1 = await service.openEditor(input1, { pinned: true });
            const editor2 = await service.openEditor(input2, { pinned: true }, editorService_2.SIDE_GROUP);
            const group1 = editor1?.group;
            assert.strictEqual(group1?.count, 1);
            const group2 = editor2?.group;
            assert.strictEqual(group2?.count, 1);
            group2.lock(true);
            part.activateGroup(group2.id);
            // Will open in group 1 because group 2 is locked
            await service.openEditor(input3, { pinned: true });
            assert.strictEqual(group1.count, 2);
            assert.strictEqual(group1.activeEditor?.resource?.toString(), input3.resource.toString());
            assert.strictEqual(group2.count, 1);
            // Will open in group 2 because group was provided
            await service.openEditor(input3, { pinned: true }, group2.id);
            assert.strictEqual(group1.count, 2);
            assert.strictEqual(group2.count, 2);
            assert.strictEqual(group2.activeEditor?.resource?.toString(), input3.resource.toString());
            // Will reveal editor in group 2 because it is contained
            await service.openEditor(input2, { pinned: true }, group2);
            await service.openEditor(input2, { pinned: true }, editorService_2.ACTIVE_GROUP);
            assert.strictEqual(group1.count, 2);
            assert.strictEqual(group2.count, 2);
            assert.strictEqual(group2.activeEditor?.resource?.toString(), input2.resource.toString());
            // Will open a new group because side group is locked
            part.activateGroup(group1.id);
            const editor3 = await service.openEditor(input4, { pinned: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.count, 3);
            const group3 = editor3?.group;
            assert.strictEqual(group3?.count, 1);
            // Will reveal editor in group 2 because it is contained
            await service.openEditor(input3, { pinned: true }, group2);
            part.activateGroup(group1.id);
            await service.openEditor(input3, { pinned: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.count, 3);
            // Will open a new group if all groups are locked
            group1.lock(true);
            group2.lock(true);
            group3.lock(true);
            part.activateGroup(group1.id);
            const editor5 = await service.openEditor(input5, { pinned: true });
            const group4 = editor5?.group;
            assert.strictEqual(group4?.count, 1);
            assert.strictEqual(group4.activeEditor?.resource?.toString(), input5.resource.toString());
            assert.strictEqual(part.count, 4);
            // Will open editor in most recently non-locked group
            group1.lock(false);
            group2.lock(false);
            group3.lock(false);
            group4.lock(false);
            part.activateGroup(group3.id);
            part.activateGroup(group2.id);
            part.activateGroup(group4.id);
            group4.lock(true);
            group2.lock(true);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual(group3.activeEditor?.resource?.toString(), input6.resource.toString());
            // Will find the right group where editor is already opened in when all groups are locked
            group1.lock(true);
            group2.lock(true);
            group3.lock(true);
            group4.lock(true);
            part.activateGroup(group1.id);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual(group3.activeEditor?.resource?.toString(), input6.resource.toString());
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual(group3.activeEditor?.resource?.toString(), input6.resource.toString());
            part.activateGroup(group1.id);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual(group3.activeEditor?.resource?.toString(), input6.resource.toString());
            // Will reveal an opened editor in the active locked group
            await service.openEditor(input7, { pinned: true }, group3);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual(group3.activeEditor?.resource?.toString(), input6.resource.toString());
        });
        test('locked groups - workbench.editor.revealIfOpen', async () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            await configurationService.setUserConfiguration('workbench', { 'editor': { 'revealIfOpen': true } });
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService(instantiationService);
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => ({ editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })
            }));
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            part.activateGroup(rootGroup);
            const input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            await service.openEditor(input1, rootGroup.id);
            await service.openEditor(input2, rootGroup.id);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            await service.openEditor(input3, rightGroup.id);
            await service.openEditor(input4, rightGroup.id);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            rootGroup.lock(true);
            rightGroup.lock(true);
            await service.openEditor(input1);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input1.resource.toString());
            await service.openEditor(input3);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input3.resource.toString());
            assert.strictEqual(part.groups.length, 2);
        });
        test('locked groups - revealIfVisible', async () => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => ({ editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })
            }));
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            part.activateGroup(rootGroup);
            const input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            await service.openEditor(input1, rootGroup.id);
            await service.openEditor(input2, rootGroup.id);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            await service.openEditor(input3, rightGroup.id);
            await service.openEditor(input4, rightGroup.id);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            rootGroup.lock(true);
            rightGroup.lock(true);
            await service.openEditor({ ...input2, options: { ...input2.options, revealIfVisible: true } });
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input2.resource.toString());
            await service.openEditor({ ...input4, options: { ...input4.options, revealIfVisible: true } });
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input4.resource.toString());
            assert.strictEqual(part.groups.length, 2);
        });
        test('locked groups - revealIfOpened', async () => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => ({ editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })
            }));
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            part.activateGroup(rootGroup);
            const input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            const input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            await service.openEditor(input1, rootGroup.id);
            await service.openEditor(input2, rootGroup.id);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            await service.openEditor(input3, rightGroup.id);
            await service.openEditor(input4, rightGroup.id);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            rootGroup.lock(true);
            rightGroup.lock(true);
            await service.openEditor({ ...input1, options: { ...input1.options, revealIfOpened: true } });
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input1.resource.toString());
            await service.openEditor({ ...input3, options: { ...input3.options, revealIfOpened: true } });
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            assert.strictEqual(part.activeGroup.activeEditor?.resource?.toString(), input3.resource.toString());
            assert.strictEqual(part.groups.length, 2);
        });
        test('openEditor() - untyped, typed', () => {
            return testOpenEditors(false);
        });
        test('openEditors() - untyped, typed', () => {
            return testOpenEditors(true);
        });
        async function testOpenEditors(useOpenEditors) {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            let rootGroup = part.activeGroup;
            let editorFactoryCalled = 0;
            let untitledEditorFactoryCalled = 0;
            let diffEditorFactoryCalled = 0;
            let lastEditorFactoryEditor = undefined;
            let lastUntitledEditorFactoryEditor = undefined;
            let lastDiffEditorFactoryEditor = undefined;
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-override-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => {
                    editorFactoryCalled++;
                    lastEditorFactoryEditor = editor;
                    return { editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) };
                },
                createUntitledEditorInput: untitledEditor => {
                    untitledEditorFactoryCalled++;
                    lastUntitledEditorFactoryEditor = untitledEditor;
                    return { editor: createTestFileEditorInput(untitledEditor.resource ?? uri_1.URI.parse(`untitled://my-untitled-editor-${untitledEditorFactoryCalled}`), TEST_EDITOR_INPUT_ID) };
                },
                createDiffEditorInput: diffEditor => {
                    diffEditorFactoryCalled++;
                    lastDiffEditorFactoryEditor = diffEditor;
                    return { editor: createTestFileEditorInput(uri_1.URI.file(`diff-editor-${diffEditorFactoryCalled}`), TEST_EDITOR_INPUT_ID) };
                }
            }));
            async function resetTestState() {
                editorFactoryCalled = 0;
                untitledEditorFactoryCalled = 0;
                diffEditorFactoryCalled = 0;
                lastEditorFactoryEditor = undefined;
                lastUntitledEditorFactoryEditor = undefined;
                lastDiffEditorFactoryEditor = undefined;
                await (0, workbenchTestServices_1.workbenchTeardown)(accessor.instantiationService);
                rootGroup = part.activeGroup;
            }
            async function openEditor(editor, group) {
                if (useOpenEditors) {
                    // The type safety isn't super good here, so we assist with runtime checks
                    // Open editors expects untyped or editor input with options, you cannot pass a typed editor input
                    // without options
                    if (!(0, editor_2.isEditorInputWithOptions)(editor) && (0, editor_2.isEditorInput)(editor)) {
                        editor = { editor: editor, options: {} };
                    }
                    const panes = await service.openEditors([editor], group);
                    return panes[0];
                }
                if ((0, editor_2.isEditorInputWithOptions)(editor)) {
                    return service.openEditor(editor.editor, editor.options, group);
                }
                return service.openEditor(editor, group);
            }
            // untyped
            {
                // untyped resource editor, no options, no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests') };
                    const pane = await openEditor(untypedEditor);
                    let typedEditor = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group.activeEditor, typedEditor);
                    // replaceEditors should work too
                    const untypedEditorReplacement = { resource: uri_1.URI.file('file-replaced.editor-service-override-tests') };
                    await service.replaceEditors([{
                            editor: typedEditor,
                            replacement: untypedEditorReplacement
                        }], rootGroup);
                    typedEditor = rootGroup.activeEditor;
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedEditor?.resource?.toString(), untypedEditorReplacement.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 3);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditorReplacement);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override text), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } };
                    const pane = await openEditor(untypedEditor);
                    const typedEditor = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedEditor instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(typedEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group.activeEditor, typedEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override text, sticky: true, preserveFocus: true), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true, override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // untyped resource editor, options (override default), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override: TEST_EDITOR_INPUT_ID), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: TEST_EDITOR_INPUT_ID } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (sticky: true, preserveFocus: true), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(lastEditorFactoryEditor.options?.preserveFocus, true);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // untyped resource editor, options (override: TEST_EDITOR_INPUT_ID, sticky: true, preserveFocus: true), no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true, override: TEST_EDITOR_INPUT_ID } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(lastEditorFactoryEditor.options?.preserveFocus, true);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // untyped resource editor, no options, SIDE_GROUP
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests') };
                    const pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane?.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override text), SIDE_GROUP
                {
                    const untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } };
                    const pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // Typed
            {
                // typed editor, no options, no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor });
                    let typedInput = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedInput instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedInput.resource.toString(), typedEditor.resource.toString());
                    // It's a typed editor input so the resolver should not have been called
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(typedEditor);
                    assert.strictEqual(pane?.group.activeEditor, typedInput);
                    // replaceEditors should work too
                    const typedEditorReplacement = createTestFileEditorInput(uri_1.URI.file('file-replaced.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    await service.replaceEditors([{
                            editor: typedEditor,
                            replacement: typedEditorReplacement
                        }], rootGroup);
                    typedInput = rootGroup.activeEditor;
                    assert.ok(typedInput instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedInput.resource.toString(), typedEditorReplacement.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, no options, no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor });
                    const typedInput = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedInput instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedInput.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(typedEditor);
                    assert.strictEqual(pane?.group.activeEditor, typedEditor);
                    await resetTestState();
                }
                // typed editor, options (no override, sticky: true, preserveFocus: true), no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor, options: { sticky: true, preserveFocus: true } });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // typed editor, options (override default), no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor, options: { override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } });
                    assert.strictEqual(pane?.group, rootGroup);
                    // We shouldn't have resolved because it is a typed editor, even though we have an override specified
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, options (override: TEST_EDITOR_INPUT_ID), no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor, options: { override: TEST_EDITOR_INPUT_ID } });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, options (sticky: true, preserveFocus: true), no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor, options: { sticky: true, preserveFocus: true } });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // typed editor, options (override: TEST_EDITOR_INPUT_ID, sticky: true, preserveFocus: true), no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor, options: { sticky: true, preserveFocus: true, override: TEST_EDITOR_INPUT_ID } });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // typed editor, no options, SIDE_GROUP
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane?.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, options (no override), SIDE_GROUP
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // Untyped untitled
            {
                // untyped untitled editor, no options, no group
                {
                    const untypedEditor = { resource: undefined, options: { override: TEST_EDITOR_INPUT_ID } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.scheme, 'untitled');
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped untitled editor, no options, SIDE_GROUP
                {
                    const untypedEditor = { resource: undefined, options: { override: TEST_EDITOR_INPUT_ID } };
                    const pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane?.input.resource.scheme, 'untitled');
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped untitled editor with associated resource, no options, no group
                {
                    const untypedEditor = { resource: uri_1.URI.file('file-original.editor-service-override-tests').with({ scheme: 'untitled' }) };
                    const pane = await openEditor(untypedEditor);
                    const typedEditor = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedEditor.resource.scheme, 'untitled');
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group.activeEditor, typedEditor);
                    await resetTestState();
                }
                // untyped untitled editor, options (sticky: true, preserveFocus: true), no group
                {
                    const untypedEditor = { resource: undefined, options: { sticky: true, preserveFocus: true, override: TEST_EDITOR_INPUT_ID } };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.scheme, 'untitled');
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor.options?.preserveFocus, true);
                    assert.strictEqual(lastUntitledEditorFactoryEditor.options?.sticky, true);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // Untyped diff
            {
                // untyped diff editor, no options, no group
                {
                    const untypedEditor = {
                        original: { resource: uri_1.URI.file('file-original.editor-service-override-tests') },
                        modified: { resource: uri_1.URI.file('file-modified.editor-service-override-tests') },
                        options: { override: TEST_EDITOR_INPUT_ID }
                    };
                    const pane = await openEditor(untypedEditor);
                    const typedEditor = pane?.input;
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 1);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.strictEqual(lastDiffEditorFactoryEditor, untypedEditor);
                    await resetTestState();
                }
                // untyped diff editor, no options, SIDE_GROUP
                {
                    const untypedEditor = {
                        original: { resource: uri_1.URI.file('file-original.editor-service-override-tests') },
                        modified: { resource: uri_1.URI.file('file-modified.editor-service-override-tests') },
                        options: { override: TEST_EDITOR_INPUT_ID }
                    };
                    const pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 1);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.strictEqual(lastDiffEditorFactoryEditor, untypedEditor);
                    await resetTestState();
                }
                // untyped diff editor, options (sticky: true, preserveFocus: true), no group
                {
                    const untypedEditor = {
                        original: { resource: uri_1.URI.file('file-original.editor-service-override-tests') },
                        modified: { resource: uri_1.URI.file('file-modified.editor-service-override-tests') },
                        options: {
                            override: TEST_EDITOR_INPUT_ID, sticky: true, preserveFocus: true
                        }
                    };
                    const pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 1);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.strictEqual(lastDiffEditorFactoryEditor, untypedEditor);
                    assert.strictEqual(lastDiffEditorFactoryEditor.options?.preserveFocus, true);
                    assert.strictEqual(lastDiffEditorFactoryEditor.options?.sticky, true);
                    await resetTestState();
                }
            }
            // typed editor, not registered
            {
                // no options, no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // no options, SIDE_GROUP
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    const pane = await openEditor({ editor: typedEditor }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane?.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // typed editor, not supporting `toUntyped`
            {
                // no options, no group
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    typedEditor.disableToUntyped = true;
                    const pane = await openEditor({ editor: typedEditor });
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // no options, SIDE_GROUP
                {
                    const typedEditor = createTestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    typedEditor.disableToUntyped = true;
                    const pane = await openEditor({ editor: typedEditor }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane?.group, rootGroup);
                    assert.ok(pane?.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane?.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // openEditors with >1 editor
            if (useOpenEditors) {
                // mix of untyped and typed editors
                {
                    const untypedEditor1 = { resource: uri_1.URI.file('file1.editor-service-override-tests') };
                    const untypedEditor2 = { resource: uri_1.URI.file('file2.editor-service-override-tests') };
                    const untypedEditor3 = { editor: createTestFileEditorInput(uri_1.URI.file('file3.editor-service-override-tests'), TEST_EDITOR_INPUT_ID) };
                    const untypedEditor4 = { editor: createTestFileEditorInput(uri_1.URI.file('file4.editor-service-override-tests'), TEST_EDITOR_INPUT_ID) };
                    const untypedEditor5 = { resource: uri_1.URI.file('file5.editor-service-override-tests') };
                    const pane = (await service.openEditors([untypedEditor1, untypedEditor2, untypedEditor3, untypedEditor4, untypedEditor5]))[0];
                    assert.strictEqual(pane?.group, rootGroup);
                    assert.strictEqual(pane?.group.count, 5);
                    // Only the untyped editors should have had factories called (3 untyped editors)
                    assert.strictEqual(editorFactoryCalled, 3);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // untyped default editor
            {
                // untyped default editor, options: revealIfVisible
                {
                    const untypedEditor1 = { resource: uri_1.URI.file('file-1'), options: { revealIfVisible: true, pinned: true } };
                    const untypedEditor2 = { resource: uri_1.URI.file('file-2'), options: { pinned: true } };
                    const rootPane = await openEditor(untypedEditor1);
                    const sidePane = await openEditor(untypedEditor2, editorService_2.SIDE_GROUP);
                    assert.strictEqual(rootPane?.group.count, 1);
                    assert.strictEqual(sidePane?.group.count, 1);
                    accessor.editorGroupService.activateGroup(sidePane.group);
                    await openEditor(untypedEditor1);
                    assert.strictEqual(rootPane?.group.count, 1);
                    assert.strictEqual(sidePane?.group.count, 1);
                    await resetTestState();
                }
                // untyped default editor, options: revealIfOpened
                {
                    const untypedEditor1 = { resource: uri_1.URI.file('file-1'), options: { revealIfOpened: true, pinned: true } };
                    const untypedEditor2 = { resource: uri_1.URI.file('file-2'), options: { pinned: true } };
                    const rootPane = await openEditor(untypedEditor1);
                    await openEditor(untypedEditor2);
                    assert.strictEqual(rootPane?.group.activeEditor?.resource?.toString(), untypedEditor2.resource.toString());
                    const sidePane = await openEditor(untypedEditor2, editorService_2.SIDE_GROUP);
                    assert.strictEqual(rootPane?.group.count, 2);
                    assert.strictEqual(sidePane?.group.count, 1);
                    accessor.editorGroupService.activateGroup(sidePane.group);
                    await openEditor(untypedEditor1);
                    assert.strictEqual(rootPane?.group.count, 2);
                    assert.strictEqual(sidePane?.group.count, 1);
                    await resetTestState();
                }
            }
        }
        test('openEditor() applies options if editor already opened', async () => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-override-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, {
                createEditorInput: editor => ({ editor: createTestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })
            }));
            // Typed editor
            let pane = await service.openEditor(createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID));
            pane = await service.openEditor(createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID), { sticky: true, preserveFocus: true });
            assert.strictEqual(pane?.options?.sticky, true);
            assert.strictEqual(pane?.options?.preserveFocus, true);
            await pane.group.closeAllEditors();
            // Untyped editor (without registered editor)
            pane = await service.openEditor({ resource: uri_1.URI.file('resource-openEditors') });
            pane = await service.openEditor({ resource: uri_1.URI.file('resource-openEditors'), options: { sticky: true, preserveFocus: true } });
            assert.ok(pane instanceof workbenchTestServices_1.TestTextFileEditor);
            assert.strictEqual(pane?.options?.sticky, true);
            assert.strictEqual(pane?.options?.preserveFocus, true);
            // Untyped editor (with registered editor)
            pane = await service.openEditor({ resource: uri_1.URI.file('file.editor-service-override-tests') });
            pane = await service.openEditor({ resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true } });
            assert.strictEqual(pane?.options?.sticky, true);
            assert.strictEqual(pane?.options?.preserveFocus, true);
        });
        test('isOpen() with side by side editor', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput('sideBySide', '', input, otherInput, service);
            const editor1 = await service.openEditor(sideBySideInput, { pinned: true });
            assert.strictEqual(part.activeGroup.count, 1);
            assert.strictEqual(service.isOpened(input), false);
            assert.strictEqual(service.isOpened(otherInput), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), false);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            const editor2 = await service.openEditor(input, { pinned: true });
            assert.strictEqual(part.activeGroup.count, 2);
            assert.strictEqual(service.isOpened(input), true);
            assert.strictEqual(service.isOpened(otherInput), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), true);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            await editor2?.group.closeEditor(input);
            assert.strictEqual(part.activeGroup.count, 1);
            assert.strictEqual(service.isOpened(input), false);
            assert.strictEqual(service.isOpened(otherInput), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), false);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            await editor1?.group.closeEditor(sideBySideInput);
            assert.strictEqual(service.isOpened(input), false);
            assert.strictEqual(service.isOpened(otherInput), false);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), false);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), false);
        });
        test('openEditors() / replaceEditors()', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const replaceInput = createTestFileEditorInput(uri_1.URI.parse('my://resource3-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input }, { editor: otherInput }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Replace editors
            await service.replaceEditors([{ editor: input, replacement: replaceInput }], part.activeGroup);
            assert.strictEqual(part.activeGroup.count, 2);
            assert.strictEqual(part.activeGroup.getIndexOfEditor(replaceInput), 0);
        });
        test('openEditors() handles workspace trust (typed editors)', async () => {
            const [part, service, accessor] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1-openEditors'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.parse('my://resource3-openEditors'), TEST_EDITOR_INPUT_ID);
            const input4 = createTestFileEditorInput(uri_1.URI.parse('my://resource4-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput('side by side', undefined, input3, input4, service);
            const oldHandler = accessor.workspaceTrustRequestService.requestOpenUrisHandler;
            try {
                // Trust: cancel
                let trustEditorUris = [];
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => {
                    trustEditorUris = uris;
                    return 3 /* WorkspaceTrustUriResponse.Cancel */;
                };
                await service.openEditors([{ editor: input1 }, { editor: input2 }, { editor: sideBySideInput }], undefined, { validateTrust: true });
                assert.strictEqual(part.activeGroup.count, 0);
                assert.strictEqual(trustEditorUris.length, 4);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input1.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input2.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input3.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input4.resource.toString()), true);
                // Trust: open in new window
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => 2 /* WorkspaceTrustUriResponse.OpenInNewWindow */;
                await service.openEditors([{ editor: input1 }, { editor: input2 }, { editor: sideBySideInput }], undefined, { validateTrust: true });
                assert.strictEqual(part.activeGroup.count, 0);
                // Trust: allow
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => 1 /* WorkspaceTrustUriResponse.Open */;
                await service.openEditors([{ editor: input1 }, { editor: input2 }, { editor: sideBySideInput }], undefined, { validateTrust: true });
                assert.strictEqual(part.activeGroup.count, 3);
            }
            finally {
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = oldHandler;
            }
        });
        test('openEditors() ignores trust when `validateTrust: false', async () => {
            const [part, service, accessor] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1-openEditors'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const input3 = createTestFileEditorInput(uri_1.URI.parse('my://resource3-openEditors'), TEST_EDITOR_INPUT_ID);
            const input4 = createTestFileEditorInput(uri_1.URI.parse('my://resource4-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput('side by side', undefined, input3, input4, service);
            const oldHandler = accessor.workspaceTrustRequestService.requestOpenUrisHandler;
            try {
                // Trust: cancel
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => 3 /* WorkspaceTrustUriResponse.Cancel */;
                await service.openEditors([{ editor: input1 }, { editor: input2 }, { editor: sideBySideInput }]);
                assert.strictEqual(part.activeGroup.count, 3);
            }
            finally {
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = oldHandler;
            }
        });
        test('openEditors() extracts proper resources from untyped editors for workspace trust', async () => {
            const [, service, accessor] = await createEditorService();
            const input = { resource: uri_1.URI.file('resource-openEditors') };
            const otherInput = {
                original: { resource: uri_1.URI.parse('my://resource2-openEditors') },
                modified: { resource: uri_1.URI.parse('my://resource3-openEditors') }
            };
            const oldHandler = accessor.workspaceTrustRequestService.requestOpenUrisHandler;
            try {
                let trustEditorUris = [];
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => {
                    trustEditorUris = uris;
                    return oldHandler(uris);
                };
                await service.openEditors([input, otherInput], undefined, { validateTrust: true });
                assert.strictEqual(trustEditorUris.length, 3);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === otherInput.original.resource?.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === otherInput.modified.resource?.toString()), true);
            }
            finally {
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = oldHandler;
            }
        });
        test('close editor does not dispose when editor opened in other group', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-close1'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            // Open input
            await service.openEditor(input, { pinned: true });
            await service.openEditor(input, { pinned: true }, rightGroup);
            const editors = service.editors;
            assert.strictEqual(editors.length, 2);
            assert.strictEqual(editors[0], input);
            assert.strictEqual(editors[1], input);
            // Close input
            await rootGroup.closeEditor(input);
            assert.strictEqual(input.isDisposed(), false);
            await rightGroup.closeEditor(input);
            assert.strictEqual(input.isDisposed(), true);
        });
        test('open to the side', async () => {
            const [part, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1-openside'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openside'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true }, rootGroup);
            let editor = await service.openEditor(input1, { pinned: true, preserveFocus: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.activeGroup, rootGroup);
            assert.strictEqual(part.count, 2);
            assert.strictEqual(editor?.group, part.groups[1]);
            assert.strictEqual(service.isVisible(input1), true);
            assert.strictEqual(service.isOpened(input1), true);
            // Open to the side uses existing neighbour group if any
            editor = await service.openEditor(input2, { pinned: true, preserveFocus: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.activeGroup, rootGroup);
            assert.strictEqual(part.count, 2);
            assert.strictEqual(editor?.group, part.groups[1]);
            assert.strictEqual(service.isVisible(input2), true);
            assert.strictEqual(service.isOpened(input2), true);
        });
        test('editor group activation', async () => {
            const [part, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1-openside'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openside'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true }, rootGroup);
            let editor = await service.openEditor(input2, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.ACTIVATE }, editorService_2.SIDE_GROUP);
            const sideGroup = editor?.group;
            assert.strictEqual(part.activeGroup, sideGroup);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.PRESERVE }, rootGroup);
            assert.strictEqual(part.activeGroup, sideGroup);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.ACTIVATE }, rootGroup);
            assert.strictEqual(part.activeGroup, rootGroup);
            editor = await service.openEditor(input2, { pinned: true, activation: editor_1.EditorActivation.PRESERVE }, sideGroup);
            assert.strictEqual(part.activeGroup, rootGroup);
            editor = await service.openEditor(input2, { pinned: true, activation: editor_1.EditorActivation.ACTIVATE }, sideGroup);
            assert.strictEqual(part.activeGroup, sideGroup);
            part.arrangeGroups(1 /* GroupsArrangement.EXPAND */);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.RESTORE }, rootGroup);
            assert.strictEqual(part.activeGroup, sideGroup);
        });
        test('inactive editor group does not activate when closing editor (#117686)', async () => {
            const [part, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1-openside'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openside'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true }, rootGroup);
            await service.openEditor(input2, { pinned: true }, rootGroup);
            const sideGroup = (await service.openEditor(input2, { pinned: true }, editorService_2.SIDE_GROUP))?.group;
            assert.strictEqual(part.activeGroup, sideGroup);
            assert.notStrictEqual(rootGroup, sideGroup);
            part.arrangeGroups(1 /* GroupsArrangement.EXPAND */, part.activeGroup);
            await rootGroup.closeEditor(input2);
            assert.strictEqual(part.activeGroup, sideGroup);
            assert(!part.isGroupExpanded(rootGroup));
            assert(part.isGroupExpanded(part.activeGroup));
        });
        test('active editor change / visible editor change events', async function () {
            const [part, service] = await createEditorService();
            let input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            let otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEventFired = false;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEventFired = true;
            });
            let visibleEditorChangeEventFired = false;
            const visibleEditorChangeListener = service.onDidVisibleEditorsChange(() => {
                visibleEditorChangeEventFired = true;
            });
            function assertActiveEditorChangedEvent(expected) {
                assert.strictEqual(activeEditorChangeEventFired, expected, `Unexpected active editor change state (got ${activeEditorChangeEventFired}, expected ${expected})`);
                activeEditorChangeEventFired = false;
            }
            function assertVisibleEditorsChangedEvent(expected) {
                assert.strictEqual(visibleEditorChangeEventFired, expected, `Unexpected visible editors change state (got ${visibleEditorChangeEventFired}, expected ${expected})`);
                visibleEditorChangeEventFired = false;
            }
            async function closeEditorAndWaitForNextToOpen(group, input) {
                await group.closeEditor(input);
                await (0, async_1.timeout)(0); // closing an editor will not immediately open the next one, so we need to wait
            }
            // 1.) open, open same, open other, close
            let editor = await service.openEditor(input, { pinned: true });
            const group = editor?.group;
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(input);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            editor = await service.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, input);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 2.) open, open same (forced open) (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(input, { forceReload: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(group, input);
            // 3.) open, open inactive, close (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { inactive: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 4.) open, open inactive, close inactive (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { inactive: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(group, otherInput);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 5.) add group, remove group (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            let rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            rightGroup.focus();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            part.removeGroup(rightGroup);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 6.) open editor in inactive group (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(rightGroup, otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 7.) activate group (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            group.focus();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(rightGroup, otherInput);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(true);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 8.) move editor (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            group.moveEditor(otherInput, group, { index: 0 });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 9.) close editor in inactive group (recreate inputs that got disposed)
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, input);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(true);
            // cleanup
            activeEditorChangeListener.dispose();
            visibleEditorChangeListener.dispose();
        });
        test('editors change event', async function () {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            let input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            let otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            let editorsChangeEventCounter = 0;
            async function assertEditorsChangeEvent(fn, expected) {
                const p = event_1.Event.toPromise(service.onDidEditorsChange);
                await fn();
                await p;
                editorsChangeEventCounter++;
                assert.strictEqual(editorsChangeEventCounter, expected);
            }
            // open
            await assertEditorsChangeEvent(() => service.openEditor(input, { pinned: true }), 1);
            // open (other)
            await assertEditorsChangeEvent(() => service.openEditor(otherInput, { pinned: true }), 2);
            // close (inactive)
            await assertEditorsChangeEvent(() => rootGroup.closeEditor(input), 3);
            // close (active)
            await assertEditorsChangeEvent(() => rootGroup.closeEditor(otherInput), 4);
            input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            // open editors
            await assertEditorsChangeEvent(() => service.openEditors([{ editor: input, options: { pinned: true } }, { editor: otherInput, options: { pinned: true } }]), 5);
            // active editor change
            await assertEditorsChangeEvent(() => service.openEditor(otherInput), 6);
            // move editor (in group)
            await assertEditorsChangeEvent(() => service.openEditor(input, { pinned: true, index: 1 }), 7);
            const rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            await assertEditorsChangeEvent(async () => rootGroup.moveEditor(input, rightGroup), 8);
            // move group
            await assertEditorsChangeEvent(async () => part.moveGroup(rightGroup, rootGroup, 2 /* GroupDirection.LEFT */), 9);
        });
        test('two active editor change events when opening editor to the side', async function () {
            const [, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEvents = 0;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEvents++;
            });
            function assertActiveEditorChangedEvent(expected) {
                assert.strictEqual(activeEditorChangeEvents, expected, `Unexpected active editor change state (got ${activeEditorChangeEvents}, expected ${expected})`);
                activeEditorChangeEvents = 0;
            }
            await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(1);
            await service.openEditor(input, { pinned: true }, editorService_2.SIDE_GROUP);
            // we expect 2 active editor change events: one for the fact that the
            // active editor is now in the side group but also one for when the
            // editor has finished loading. we used to ignore that second change
            // event, however many listeners are interested on the active editor
            // when it has fully loaded (e.g. a model is set). as such, we cannot
            // simply ignore that second event from the editor service, even though
            // the actual editor input is the same
            assertActiveEditorChangedEvent(2);
            // cleanup
            activeEditorChangeListener.dispose();
        });
        test('activeTextEditorControl / activeTextEditorMode', async () => {
            const [, service] = await createEditorService();
            // Open untitled input
            const editor = await service.openEditor({ resource: undefined });
            assert.strictEqual(service.activeEditorPane, editor);
            assert.strictEqual(service.activeTextEditorControl, editor?.getControl());
            assert.strictEqual(service.activeTextEditorLanguageId, modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
        });
        test('openEditor returns undefined when inactive', async function () {
            const [, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-inactive'), TEST_EDITOR_INPUT_ID);
            const editor = await service.openEditor(input, { pinned: true });
            assert.ok(editor);
            const otherEditor = await service.openEditor(otherInput, { inactive: true });
            assert.ok(!otherEditor);
        });
        test('openEditor shows placeholder when opening fails', async function () {
            const [, service] = await createEditorService();
            const failingInput = createTestFileEditorInput(uri_1.URI.parse('my://resource-failing'), TEST_EDITOR_INPUT_ID);
            failingInput.setFailToOpen();
            const failingEditor = await service.openEditor(failingInput);
            assert.ok(failingEditor instanceof editorPlaceholder_1.ErrorPlaceholderEditor);
        });
        test('openEditor shows placeholder when restoring fails', async function () {
            const [, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            const failingInput = createTestFileEditorInput(uri_1.URI.parse('my://resource-failing'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input, { pinned: true });
            await service.openEditor(failingInput, { inactive: true });
            failingInput.setFailToOpen();
            const failingEditor = await service.openEditor(failingInput);
            assert.ok(failingEditor instanceof editorPlaceholder_1.ErrorPlaceholderEditor);
        });
        test('save, saveAll, revertAll', async function () {
            const [part, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input2.dirty = true;
            const sameInput1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            sameInput1.dirty = true;
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true });
            await service.openEditor(input2, { pinned: true });
            await service.openEditor(sameInput1, { pinned: true }, editorService_2.SIDE_GROUP);
            const res1 = await service.save({ groupId: rootGroup.id, editor: input1 });
            assert.strictEqual(res1.success, true);
            assert.strictEqual(res1.editors[0], input1);
            assert.strictEqual(input1.gotSaved, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            const res2 = await service.save({ groupId: rootGroup.id, editor: input1 }, { saveAs: true });
            assert.strictEqual(res2.success, true);
            assert.strictEqual(res2.editors[0], input1);
            assert.strictEqual(input1.gotSavedAs, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            const revertRes = await service.revertAll();
            assert.strictEqual(revertRes, true);
            assert.strictEqual(input1.gotReverted, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            const res3 = await service.saveAll();
            assert.strictEqual(res3.success, true);
            assert.strictEqual(res3.editors.length, 2);
            assert.strictEqual(input1.gotSaved, true);
            assert.strictEqual(input2.gotSaved, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input2.gotSaved = false;
            input2.gotSavedAs = false;
            input2.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            await service.saveAll({ saveAs: true });
            assert.strictEqual(input1.gotSavedAs, true);
            assert.strictEqual(input2.gotSavedAs, true);
            // services dedupes inputs automatically
            assert.strictEqual(sameInput1.gotSaved, false);
            assert.strictEqual(sameInput1.gotSavedAs, false);
            assert.strictEqual(sameInput1.gotReverted, false);
        });
        test('saveAll, revertAll (sticky editor)', async function () {
            const [, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input2.dirty = true;
            const sameInput1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            sameInput1.dirty = true;
            await service.openEditor(input1, { pinned: true, sticky: true });
            await service.openEditor(input2, { pinned: true });
            await service.openEditor(sameInput1, { pinned: true }, editorService_2.SIDE_GROUP);
            const revertRes = await service.revertAll({ excludeSticky: true });
            assert.strictEqual(revertRes, true);
            assert.strictEqual(input1.gotReverted, false);
            assert.strictEqual(sameInput1.gotReverted, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            sameInput1.gotSaved = false;
            sameInput1.gotSavedAs = false;
            sameInput1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            const saveRes = await service.saveAll({ excludeSticky: true });
            assert.strictEqual(saveRes.success, true);
            assert.strictEqual(saveRes.editors.length, 2);
            assert.strictEqual(input1.gotSaved, false);
            assert.strictEqual(input2.gotSaved, true);
            assert.strictEqual(sameInput1.gotSaved, true);
        });
        test('saveAll, revertAll untitled (exclude untitled)', async function () {
            await testSaveRevertUntitled({}, false, false);
            await testSaveRevertUntitled({ includeUntitled: false }, false, false);
        });
        test('saveAll, revertAll untitled (include untitled)', async function () {
            await testSaveRevertUntitled({ includeUntitled: true }, true, false);
            await testSaveRevertUntitled({ includeUntitled: { includeScratchpad: false } }, true, false);
        });
        test('saveAll, revertAll untitled (include scratchpad)', async function () {
            await testSaveRevertUntitled({ includeUntitled: { includeScratchpad: true } }, true, true);
        });
        async function testSaveRevertUntitled(options, expectUntitled, expectScratchpad) {
            const [, service] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const untitledInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            untitledInput.dirty = true;
            untitledInput.capabilities = 4 /* EditorInputCapabilities.Untitled */;
            const scratchpadInput = createTestFileEditorInput(uri_1.URI.parse('my://resource3'), TEST_EDITOR_INPUT_ID);
            scratchpadInput.modified = true;
            scratchpadInput.capabilities = 512 /* EditorInputCapabilities.Scratchpad */ | 4 /* EditorInputCapabilities.Untitled */;
            await service.openEditor(input1, { pinned: true, sticky: true });
            await service.openEditor(untitledInput, { pinned: true });
            await service.openEditor(scratchpadInput, { pinned: true });
            const revertRes = await service.revertAll(options);
            assert.strictEqual(revertRes, true);
            assert.strictEqual(input1.gotReverted, true);
            assert.strictEqual(untitledInput.gotReverted, expectUntitled);
            assert.strictEqual(scratchpadInput.gotReverted, expectScratchpad);
            input1.gotSaved = false;
            untitledInput.gotSavedAs = false;
            scratchpadInput.gotReverted = false;
            input1.gotSaved = false;
            untitledInput.gotSavedAs = false;
            scratchpadInput.gotReverted = false;
            input1.dirty = true;
            untitledInput.dirty = true;
            scratchpadInput.modified = true;
            const saveRes = await service.saveAll(options);
            assert.strictEqual(saveRes.success, true);
            assert.strictEqual(saveRes.editors.length, expectScratchpad ? 3 : expectUntitled ? 2 : 1);
            assert.strictEqual(input1.gotSaved, true);
            assert.strictEqual(untitledInput.gotSaved, expectUntitled);
            assert.strictEqual(scratchpadInput.gotSaved, expectScratchpad);
        }
        test('file delete closes editor', async function () {
            return testFileDeleteEditorClose(false);
        });
        test('file delete leaves dirty editors open', function () {
            return testFileDeleteEditorClose(true);
        });
        async function testFileDeleteEditorClose(dirty) {
            const [part, service, accessor] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = dirty;
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input2.dirty = dirty;
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true });
            await service.openEditor(input2, { pinned: true });
            assert.strictEqual(rootGroup.activeEditor, input2);
            const activeEditorChangePromise = awaitActiveEditorChange(service);
            accessor.fileService.fireAfterOperation(new files_1.FileOperationEvent(input2.resource, 1 /* FileOperation.DELETE */));
            if (!dirty) {
                await activeEditorChangePromise;
            }
            if (dirty) {
                assert.strictEqual(rootGroup.activeEditor, input2);
            }
            else {
                assert.strictEqual(rootGroup.activeEditor, input1);
            }
        }
        test('file move asks input to move', async function () {
            const [part, service, accessor] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            const movedInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input1.movedEditor = { editor: movedInput };
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true });
            const activeEditorChangePromise = awaitActiveEditorChange(service);
            accessor.fileService.fireAfterOperation(new files_1.FileOperationEvent(input1.resource, 2 /* FileOperation.MOVE */, {
                resource: movedInput.resource,
                ctime: 0,
                etag: '',
                isDirectory: false,
                isFile: true,
                mtime: 0,
                name: 'resource2',
                size: 0,
                isSymbolicLink: false,
                readonly: false,
                locked: false,
                children: undefined
            }));
            await activeEditorChangePromise;
            assert.strictEqual(rootGroup.activeEditor, movedInput);
        });
        function awaitActiveEditorChange(editorService) {
            return event_1.Event.toPromise(event_1.Event.once(editorService.onDidActiveEditorChange));
        }
        test('file watcher gets installed for out of workspace files', async function () {
            const [, service, accessor] = await createEditorService();
            const input1 = createTestFileEditorInput(uri_1.URI.parse('file://resource1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('file://resource2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            assert.strictEqual(accessor.fileService.watches.length, 1);
            assert.strictEqual(accessor.fileService.watches[0].toString(), input1.resource.toString());
            const editor = await service.openEditor(input2, { pinned: true });
            assert.strictEqual(accessor.fileService.watches.length, 1);
            assert.strictEqual(accessor.fileService.watches[0].toString(), input2.resource.toString());
            await editor?.group.closeAllEditors();
            assert.strictEqual(accessor.fileService.watches.length, 0);
        });
        test('activeEditorPane scopedContextKeyService', async function () {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({ contextKeyService: instantiationService => instantiationService.createInstance(mockKeybindingService_1.MockScopableContextKeyService) }, disposables);
            const [part, service] = await createEditorService(instantiationService);
            const input1 = createTestFileEditorInput(uri_1.URI.parse('file://resource1'), TEST_EDITOR_INPUT_ID);
            createTestFileEditorInput(uri_1.URI.parse('file://resource2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            const editorContextKeyService = service.activeEditorPane?.scopedContextKeyService;
            assert.ok(!!editorContextKeyService);
            assert.strictEqual(editorContextKeyService, part.activeGroup.activeEditorPane?.scopedContextKeyService);
        });
        test('editorResolverService - openEditor', async function () {
            const [, service, accessor] = await createEditorService();
            const editorResolverService = accessor.editorResolverService;
            const textEditorService = accessor.textEditorService;
            let editorCount = 0;
            const registrationDisposable = editorResolverService.registerEditor('*.md', {
                id: 'TestEditor',
                label: 'Test Editor',
                detail: 'Test Editor Provider',
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createEditorInput: (editorInput) => {
                    editorCount++;
                    return ({ editor: textEditorService.createTextEditor(editorInput) });
                },
                createDiffEditorInput: diffEditor => ({ editor: textEditorService.createTextEditor(diffEditor) })
            });
            assert.strictEqual(editorCount, 0);
            const input1 = { resource: uri_1.URI.parse('file://test/path/resource1.txt') };
            const input2 = { resource: uri_1.URI.parse('file://test/path/resource1.md') };
            // Open editor input 1 and it shouln't trigger override as the glob doesn't match
            await service.openEditor(input1);
            assert.strictEqual(editorCount, 0);
            // Open editor input 2 and it should trigger override as the glob doesn match
            await service.openEditor(input2);
            assert.strictEqual(editorCount, 1);
            // Because we specify an override we shouldn't see it triggered even if it matches
            await service.openEditor({ ...input2, options: { override: 'default' } });
            assert.strictEqual(editorCount, 1);
            registrationDisposable.dispose();
        });
        test('editorResolverService - openEditors', async function () {
            const [, service, accessor] = await createEditorService();
            const editorResolverService = accessor.editorResolverService;
            const textEditorService = accessor.textEditorService;
            let editorCount = 0;
            const registrationDisposable = editorResolverService.registerEditor('*.md', {
                id: 'TestEditor',
                label: 'Test Editor',
                detail: 'Test Editor Provider',
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createEditorInput: (editorInput) => {
                    editorCount++;
                    return ({ editor: textEditorService.createTextEditor(editorInput) });
                },
                createDiffEditorInput: diffEditor => ({ editor: textEditorService.createTextEditor(diffEditor) })
            });
            assert.strictEqual(editorCount, 0);
            const input1 = createTestFileEditorInput(uri_1.URI.parse('file://test/path/resource1.txt'), TEST_EDITOR_INPUT_ID).toUntyped();
            const input2 = createTestFileEditorInput(uri_1.URI.parse('file://test/path/resource2.txt'), TEST_EDITOR_INPUT_ID).toUntyped();
            const input3 = createTestFileEditorInput(uri_1.URI.parse('file://test/path/resource3.md'), TEST_EDITOR_INPUT_ID).toUntyped();
            const input4 = createTestFileEditorInput(uri_1.URI.parse('file://test/path/resource4.md'), TEST_EDITOR_INPUT_ID).toUntyped();
            assert.ok(input1);
            assert.ok(input2);
            assert.ok(input3);
            assert.ok(input4);
            // Open editor inputs
            await service.openEditors([input1, input2, input3, input4]);
            // Only two matched the factory glob
            assert.strictEqual(editorCount, 2);
            registrationDisposable.dispose();
        });
        test('editorResolverService - replaceEditors', async function () {
            const [part, service, accessor] = await createEditorService();
            const editorResolverService = accessor.editorResolverService;
            const textEditorService = accessor.textEditorService;
            let editorCount = 0;
            const registrationDisposable = editorResolverService.registerEditor('*.md', {
                id: 'TestEditor',
                label: 'Test Editor',
                detail: 'Test Editor Provider',
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createEditorInput: (editorInput) => {
                    editorCount++;
                    return ({ editor: textEditorService.createTextEditor(editorInput) });
                },
                createDiffEditorInput: diffEditor => ({ editor: textEditorService.createTextEditor(diffEditor) })
            });
            assert.strictEqual(editorCount, 0);
            const input1 = createTestFileEditorInput(uri_1.URI.parse('file://test/path/resource2.md'), TEST_EDITOR_INPUT_ID);
            const untypedInput1 = input1.toUntyped();
            assert.ok(untypedInput1);
            // Open editor input 1 and it shouldn't trigger because typed inputs aren't overriden
            await service.openEditor(input1);
            assert.strictEqual(editorCount, 0);
            await service.replaceEditors([{
                    editor: input1,
                    replacement: untypedInput1,
                }], part.activeGroup);
            assert.strictEqual(editorCount, 1);
            registrationDisposable.dispose();
        });
        test('closeEditor', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input }, { editor: otherInput }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Close editor
            await service.closeEditor({ editor: input, groupId: part.activeGroup.id });
            assert.strictEqual(part.activeGroup.count, 1);
            await service.closeEditor({ editor: input, groupId: part.activeGroup.id });
            assert.strictEqual(part.activeGroup.count, 1);
            await service.closeEditor({ editor: otherInput, groupId: part.activeGroup.id });
            assert.strictEqual(part.activeGroup.count, 0);
            await service.closeEditor({ editor: otherInput, groupId: 999 });
            assert.strictEqual(part.activeGroup.count, 0);
        });
        test('closeEditors', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input }, { editor: otherInput }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Close editors
            await service.closeEditors([{ editor: input, groupId: part.activeGroup.id }, { editor: otherInput, groupId: part.activeGroup.id }]);
            assert.strictEqual(part.activeGroup.count, 0);
        });
        test('findEditors (in group)', async () => {
            const [part, service] = await createEditorService();
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input }, { editor: otherInput }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Try using find editors for opened editors
            {
                const found1 = service.findEditors(input.resource, undefined, part.activeGroup);
                assert.strictEqual(found1.length, 1);
                assert.strictEqual(found1[0], input);
                const found2 = service.findEditors(input, undefined, part.activeGroup);
                assert.strictEqual(found2, input);
            }
            {
                const found1 = service.findEditors(otherInput.resource, undefined, part.activeGroup);
                assert.strictEqual(found1.length, 1);
                assert.strictEqual(found1[0], otherInput);
                const found2 = service.findEditors(otherInput, undefined, part.activeGroup);
                assert.strictEqual(found2, otherInput);
            }
            // Make sure we don't find non-opened editors
            {
                const found1 = service.findEditors(uri_1.URI.parse('my://no-such-resource'), undefined, part.activeGroup);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors({ resource: uri_1.URI.parse('my://no-such-resource'), typeId: '', editorId: TEST_EDITOR_INPUT_ID }, undefined, part.activeGroup);
                assert.strictEqual(found2, undefined);
            }
            // Make sure we don't find editors across groups
            {
                const newEditor = await service.openEditor(createTestFileEditorInput(uri_1.URI.parse('my://other-group-resource'), TEST_EDITOR_INPUT_ID), { pinned: true, preserveFocus: true }, editorService_2.SIDE_GROUP);
                const found1 = service.findEditors(input.resource, undefined, newEditor.group.id);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors(input, undefined, newEditor.group.id);
                assert.strictEqual(found2, undefined);
            }
            // Check we don't find editors after closing them
            await part.activeGroup.closeAllEditors();
            {
                const found1 = service.findEditors(input.resource, undefined, part.activeGroup);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors(input, undefined, part.activeGroup);
                assert.strictEqual(found2, undefined);
            }
        });
        test('findEditors (across groups)', async () => {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input }, { editor: otherInput }]);
            const sideEditor = await service.openEditor(input, { pinned: true }, editorService_2.SIDE_GROUP);
            // Try using find editors for opened editors
            {
                const found1 = service.findEditors(input.resource);
                assert.strictEqual(found1.length, 2);
                assert.strictEqual(found1[0].editor, input);
                assert.strictEqual(found1[0].groupId, sideEditor?.group.id);
                assert.strictEqual(found1[1].editor, input);
                assert.strictEqual(found1[1].groupId, rootGroup.id);
                const found2 = service.findEditors(input);
                assert.strictEqual(found2.length, 2);
                assert.strictEqual(found2[0].editor, input);
                assert.strictEqual(found2[0].groupId, sideEditor?.group.id);
                assert.strictEqual(found2[1].editor, input);
                assert.strictEqual(found2[1].groupId, rootGroup.id);
            }
            {
                const found1 = service.findEditors(otherInput.resource);
                assert.strictEqual(found1.length, 1);
                assert.strictEqual(found1[0].editor, otherInput);
                assert.strictEqual(found1[0].groupId, rootGroup.id);
                const found2 = service.findEditors(otherInput);
                assert.strictEqual(found2.length, 1);
                assert.strictEqual(found2[0].editor, otherInput);
                assert.strictEqual(found2[0].groupId, rootGroup.id);
            }
            // Make sure we don't find non-opened editors
            {
                const found1 = service.findEditors(uri_1.URI.parse('my://no-such-resource'));
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors({ resource: uri_1.URI.parse('my://no-such-resource'), typeId: '', editorId: TEST_EDITOR_INPUT_ID });
                assert.strictEqual(found2.length, 0);
            }
            // Check we don't find editors after closing them
            await rootGroup.closeAllEditors();
            await sideEditor?.group.closeAllEditors();
            {
                const found1 = service.findEditors(input.resource);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors(input);
                assert.strictEqual(found2.length, 0);
            }
        });
        test('findEditors (support side by side via options)', async () => {
            const [, service] = await createEditorService();
            const secondaryInput = createTestFileEditorInput(uri_1.URI.parse('my://resource-findEditors-secondary'), TEST_EDITOR_INPUT_ID);
            const primaryInput = createTestFileEditorInput(uri_1.URI.parse('my://resource-findEditors-primary'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput(undefined, undefined, secondaryInput, primaryInput, service);
            await service.openEditor(sideBySideInput, { pinned: true });
            let foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'));
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'), { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-secondary'), { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'), { supportSideBySide: editor_2.SideBySideEditor.SECONDARY });
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-secondary'), { supportSideBySide: editor_2.SideBySideEditor.SECONDARY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'), { supportSideBySide: editor_2.SideBySideEditor.ANY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-secondary'), { supportSideBySide: editor_2.SideBySideEditor.ANY });
            assert.strictEqual(foundEditors.length, 1);
        });
        test('side by side editor is not matching all other editors (https://github.com/microsoft/vscode/issues/132859)', async () => {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input = createTestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = createTestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput(undefined, undefined, input, input, service);
            const otherSideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput(undefined, undefined, otherInput, otherInput, service);
            await service.openEditor(sideBySideInput, undefined, editorService_2.SIDE_GROUP);
            part.activateGroup(rootGroup);
            await service.openEditor(otherSideBySideInput, { revealIfOpened: true, revealIfVisible: true });
            assert.strictEqual(rootGroup.count, 1);
        });
        test('onDidCloseEditor indicates proper context when moving editor across groups', async () => {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            await service.openEditor(input2, { pinned: true });
            const sidegroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            const events = [];
            disposables.add(service.onDidCloseEditor(e => {
                events.push(e);
            }));
            rootGroup.moveEditor(input1, sidegroup);
            assert.strictEqual(events[0].context, editor_2.EditorCloseContext.MOVE);
            await sidegroup.closeEditor(input1);
            assert.strictEqual(events[1].context, editor_2.EditorCloseContext.UNKNOWN);
        });
        test('onDidCloseEditor indicates proper context when replacing an editor', async () => {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input1 = createTestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor1'), TEST_EDITOR_INPUT_ID);
            const input2 = createTestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            const events = [];
            disposables.add(service.onDidCloseEditor(e => {
                events.push(e);
            }));
            await rootGroup.replaceEditors([{ editor: input1, replacement: input2 }]);
            assert.strictEqual(events[0].context, editor_2.EditorCloseContext.REPLACE);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2VkaXRvci90ZXN0L2Jyb3dzZXIvZWRpdG9yU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBNkJoRyxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUUzQixNQUFNLGNBQWMsR0FBRyw4QkFBOEIsQ0FBQztRQUN0RCxNQUFNLG9CQUFvQixHQUFHLGlDQUFpQyxDQUFDO1FBRS9ELE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLElBQUksNkJBQTZCLEdBQTBDLFNBQVMsQ0FBQztRQUVyRixLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLDBDQUFrQixFQUFDLGNBQWMsRUFBRSxDQUFDLElBQUksNEJBQWMsQ0FBQywyQ0FBbUIsQ0FBQyxFQUFFLElBQUksNEJBQWMsQ0FBQyxvREFBNEIsQ0FBQyxDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ3ZLLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSxrREFBMEIsR0FBRSxDQUFDLENBQUM7WUFDOUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLG9EQUE0QixHQUFFLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNuQixJQUFJLDZCQUE2QixFQUFFLENBQUM7Z0JBQ25DLE1BQU0sSUFBQSx5Q0FBaUIsRUFBQyw2QkFBNkIsQ0FBQyxDQUFDO2dCQUN2RCw2QkFBNkIsR0FBRyxTQUFTLENBQUM7WUFDM0MsQ0FBQztZQUVELFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNy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WUFFMUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDeEIsTUFBTSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFFM0IsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDcEIsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDcEIsVUFBVSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFFeEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDN0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFNUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDeEIsTUFBTSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFFM0IsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDcEIsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDcEIsVUFBVSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFFeEIsTUFBTSxTQUFTLEdBQUcsTUFBTSxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxN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LENBQUMsQ0FBQztZQUNwSSxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0MsWUFBWSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUseUJBQWdCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN0SSxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0MsWUFBWSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUseUJBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUN0SSxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0MsWUFBWSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUseUJBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUN4SSxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0MsWUFBWSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUseUJBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNoSSxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0MsWUFBWSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUseUJBQWdC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