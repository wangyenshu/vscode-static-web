/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/editor/editorGroupModel", "vs/workbench/common/editor", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/configuration/common/configuration", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/workspace/common/workspace", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/storage/common/storage", "vs/base/common/lifecycle", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/common/editor/editorInput", "vs/base/common/resources", "vs/base/test/common/utils", "vs/workbench/common/editor/filteredEditorGroupModel"], function (require, exports, assert, editorGroupModel_1, editor_1, workbenchTestServices_1, testConfigurationService_1, instantiationServiceMock_1, configuration_1, lifecycle_1, workspace_1, platform_1, telemetry_1, telemetryUtils_1, storage_1, lifecycle_2, workbenchTestServices_2, editorInput_1, resources_1, utils_1, filteredEditorGroupModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FilteredEditorGroupModel', () => {
        let testInstService;
        suiteTeardown(() => {
            testInstService?.dispose();
            testInstService = undefined;
        });
        function inst() {
            if (!testInstService) {
                testInstService = new instantiationServiceMock_1.TestInstantiationService();
            }
            const inst = testInstService;
            inst.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_2.TestStorageService()));
            inst.stub(lifecycle_1.ILifecycleService, disposables.add(new workbenchTestServices_1.TestLifecycleService()));
            inst.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            inst.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const config = new testConfigurationService_1.TestConfigurationService();
            config.setUserConfiguration('workbench', { editor: { openPositioning: 'right', focusRecentEditorAfterClose: true } });
            inst.stub(configuration_1.IConfigurationService, config);
            return inst;
        }
        function createEditorGroupModel(serialized) {
            const group = disposables.add(inst().createInstance(editorGroupModel_1.EditorGroupModel, serialized));
            disposables.add((0, lifecycle_2.toDisposable)(() => {
                for (const editor of group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)) {
                    group.closeEditor(editor);
                }
            }));
            return group;
        }
        let index = 0;
        class TestEditorInput extends editorInput_1.EditorInput {
            constructor(id) {
                super();
                this.id = id;
                this.resource = undefined;
            }
            get typeId() { return 'testEditorInputForGroups'; }
            async resolve() { return null; }
            matches(other) {
                return other && this.id === other.id && other instanceof TestEditorInput;
            }
            setDirty() {
                this._onDidChangeDirty.fire();
            }
            setLabel() {
                this._onDidChangeLabel.fire();
            }
        }
        class NonSerializableTestEditorInput extends editorInput_1.EditorInput {
            constructor(id) {
                super();
                this.id = id;
                this.resource = undefined;
            }
            get typeId() { return 'testEditorInputForGroups-nonSerializable'; }
            async resolve() { return null; }
            matches(other) {
                return other && this.id === other.id && other instanceof NonSerializableTestEditorInput;
            }
        }
        class TestFileEditorInput extends editorInput_1.EditorInput {
            constructor(id, resource) {
                super();
                this.id = id;
                this.resource = resource;
                this.preferredResource = this.resource;
            }
            get typeId() { return 'testFileEditorInputForGroups'; }
            get editorId() { return this.id; }
            async resolve() { return null; }
            setPreferredName(name) { }
            setPreferredDescription(description) { }
            setPreferredResource(resource) { }
            async setEncoding(encoding) { }
            getEncoding() { return undefined; }
            setPreferredEncoding(encoding) { }
            setForceOpenAsBinary() { }
            setPreferredContents(contents) { }
            setLanguageId(languageId) { }
            setPreferredLanguageId(languageId) { }
            isResolved() { return false; }
            matches(other) {
                if (super.matches(other)) {
                    return true;
                }
                if (other instanceof TestFileEditorInput) {
                    return (0, resources_1.isEqual)(other.resource, this.resource);
                }
                return false;
            }
        }
        function input(id = String(index++), nonSerializable, resource) {
            if (resource) {
                return disposables.add(new TestFileEditorInput(id, resource));
            }
            return nonSerializable ? disposables.add(new NonSerializableTestEditorInput(id)) : disposables.add(new TestEditorInput(id));
        }
        function closeAllEditors(group) {
            for (const editor of group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)) {
                group.closeEditor(editor, undefined, false);
            }
        }
        class TestEditorInputSerializer {
            static { this.disableSerialize = false; }
            static { this.disableDeserialize = false; }
            canSerialize(editorInput) {
                return true;
            }
            serialize(editorInput) {
                if (TestEditorInputSerializer.disableSerialize) {
                    return undefined;
                }
                const testEditorInput = editorInput;
                const testInput = {
                    id: testEditorInput.id
                };
                return JSON.stringify(testInput);
            }
            deserialize(instantiationService, serializedEditorInput) {
                if (TestEditorInputSerializer.disableDeserialize) {
                    return undefined;
                }
                const testInput = JSON.parse(serializedEditorInput);
                return disposables.add(new TestEditorInput(testInput.id));
            }
        }
        const disposables = new lifecycle_2.DisposableStore();
        setup(() => {
            TestEditorInputSerializer.disableSerialize = false;
            TestEditorInputSerializer.disableDeserialize = false;
            disposables.add(platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer('testEditorInputForGroups', TestEditorInputSerializer));
        });
        teardown(() => {
            disposables.clear();
            index = 1;
        });
        test('Sticky/Unsticky count', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.count, 2);
            assert.strictEqual(unstickyFilteredEditorGroup.count, 0);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.count, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.count, 1);
            model.unstick(input2);
            assert.strictEqual(stickyFilteredEditorGroup.count, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.count, 2);
        });
        test('Sticky/Unsticky stickyCount', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.stickyCount, 2);
            assert.strictEqual(unstickyFilteredEditorGroup.stickyCount, 0);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.stickyCount, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.stickyCount, 0);
            model.unstick(input2);
            assert.strictEqual(stickyFilteredEditorGroup.stickyCount, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.stickyCount, 0);
        });
        test('Sticky/Unsticky isEmpty', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: false });
            model.openEditor(input2, { pinned: true, sticky: false });
            assert.strictEqual(stickyFilteredEditorGroup.count === 0, true);
            assert.strictEqual(unstickyFilteredEditorGroup.count === 0, false);
            model.stick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.count === 0, false);
            assert.strictEqual(unstickyFilteredEditorGroup.count === 0, false);
            model.stick(input2);
            assert.strictEqual(stickyFilteredEditorGroup.count === 0, false);
            assert.strictEqual(unstickyFilteredEditorGroup.count === 0, true);
        });
        test('Sticky/Unsticky editors', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input1);
            model.unstick(input2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 2);
        });
        test('Sticky/Unsticky activeEditor', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true, active: true });
            assert.strictEqual(stickyFilteredEditorGroup.activeEditor, input1);
            assert.strictEqual(unstickyFilteredEditorGroup.activeEditor, null);
            model.openEditor(input2, { pinned: true, sticky: false, active: true });
            assert.strictEqual(stickyFilteredEditorGroup.activeEditor, null);
            assert.strictEqual(unstickyFilteredEditorGroup.activeEditor, input2);
            model.closeEditor(input1);
            assert.strictEqual(stickyFilteredEditorGroup.activeEditor, null);
            assert.strictEqual(unstickyFilteredEditorGroup.activeEditor, input2);
            model.closeEditor(input2);
            assert.strictEqual(stickyFilteredEditorGroup.activeEditor, null);
            assert.strictEqual(unstickyFilteredEditorGroup.activeEditor, null);
        });
        test('Sticky/Unsticky previewEditor', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1);
            assert.strictEqual(stickyFilteredEditorGroup.previewEditor, null);
            assert.strictEqual(unstickyFilteredEditorGroup.previewEditor, input1);
            model.openEditor(input2, { sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.previewEditor, null);
            assert.strictEqual(unstickyFilteredEditorGroup.previewEditor, input1);
        });
        test('Sticky/Unsticky isSticky()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.isSticky(input1), true);
            assert.strictEqual(stickyFilteredEditorGroup.isSticky(input2), true);
            model.unstick(input1);
            model.closeEditor(input1);
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(unstickyFilteredEditorGroup.isSticky(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isSticky(input2), false);
        });
        test('Sticky/Unsticky isPinned()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            const input3 = input();
            const input4 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: false });
            model.openEditor(input3, { pinned: false, sticky: true });
            model.openEditor(input4, { pinned: false, sticky: false });
            assert.strictEqual(stickyFilteredEditorGroup.isPinned(input1), true);
            assert.strictEqual(unstickyFilteredEditorGroup.isPinned(input2), true);
            assert.strictEqual(stickyFilteredEditorGroup.isPinned(input3), true);
            assert.strictEqual(unstickyFilteredEditorGroup.isPinned(input4), false);
        });
        test('Sticky/Unsticky isActive()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true, active: true });
            assert.strictEqual(stickyFilteredEditorGroup.isActive(input1), true);
            model.openEditor(input2, { pinned: true, sticky: false, active: true });
            assert.strictEqual(stickyFilteredEditorGroup.isActive(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isActive(input2), true);
            model.unstick(input1);
            assert.strictEqual(unstickyFilteredEditorGroup.isActive(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isActive(input2), true);
        });
        test('Sticky/Unsticky getEditors()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true, active: true });
            model.openEditor(input2, { pinned: true, sticky: true, active: true });
            // all sticky editors
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 2);
            // no unsticky editors
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 0);
            // options: excludeSticky
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).length, 0);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: false }).length, 2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).length, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: false }).length, 0);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0], input2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1], input1);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0], input2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input1);
            model.unstick(input2);
            // all unsticky editors
            assert.strictEqual(stickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length, 0);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length, 2);
            // order: MOST_RECENTLY_ACTIVE
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0], input2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1], input1);
            // order: SEQUENTIAL
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0], input2);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1], input1);
        });
        test('Sticky/Unsticky getEditorByIndex()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            const input3 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(0), input1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(1), input2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(2), undefined);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(0), undefined);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(1), undefined);
            model.openEditor(input3, { pinned: true, sticky: false });
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(0), input1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(1), input2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(2), undefined);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(0), input3);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(1), undefined);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(0), input2);
            assert.strictEqual(stickyFilteredEditorGroup.getEditorByIndex(1), undefined);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(0), input1);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(1), input3);
            assert.strictEqual(unstickyFilteredEditorGroup.getEditorByIndex(2), undefined);
        });
        test('Sticky/Unsticky indexOf()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            const input3 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input1), 0);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input2), 1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input1), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input2), -1);
            model.openEditor(input3, { pinned: true, sticky: false });
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input1), 0);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input2), 1);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input3), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input1), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input2), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input3), 0);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input1), -1);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input2), 0);
            assert.strictEqual(stickyFilteredEditorGroup.indexOf(input3), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input1), 0);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input2), -1);
            assert.strictEqual(unstickyFilteredEditorGroup.indexOf(input3), 1);
        });
        test('Sticky/Unsticky isFirst()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.isFirst(input1), true);
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.isFirst(input1), true);
            assert.strictEqual(stickyFilteredEditorGroup.isFirst(input2), false);
            model.unstick(input1);
            assert.strictEqual(unstickyFilteredEditorGroup.isFirst(input1), true);
            assert.strictEqual(stickyFilteredEditorGroup.isFirst(input2), true);
            model.unstick(input2);
            assert.strictEqual(unstickyFilteredEditorGroup.isFirst(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isFirst(input2), true);
            model.moveEditor(input2, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.isFirst(input1), true);
            assert.strictEqual(unstickyFilteredEditorGroup.isFirst(input2), false);
        });
        test('Sticky/Unsticky isLast()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.isLast(input1), true);
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.isLast(input1), false);
            assert.strictEqual(stickyFilteredEditorGroup.isLast(input2), true);
            model.unstick(input1);
            assert.strictEqual(unstickyFilteredEditorGroup.isLast(input1), true);
            assert.strictEqual(stickyFilteredEditorGroup.isLast(input2), true);
            model.unstick(input2);
            assert.strictEqual(unstickyFilteredEditorGroup.isLast(input1), true);
            assert.strictEqual(unstickyFilteredEditorGroup.isLast(input2), false);
            model.moveEditor(input2, 1);
            assert.strictEqual(unstickyFilteredEditorGroup.isLast(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isLast(input2), true);
        });
        test('Sticky/Unsticky contains()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            model.openEditor(input1, { pinned: true, sticky: true });
            model.openEditor(input2, { pinned: true, sticky: true });
            assert.strictEqual(stickyFilteredEditorGroup.contains(input1), true);
            assert.strictEqual(stickyFilteredEditorGroup.contains(input2), true);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input2), false);
            model.unstick(input1);
            assert.strictEqual(stickyFilteredEditorGroup.contains(input1), false);
            assert.strictEqual(stickyFilteredEditorGroup.contains(input2), true);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input1), true);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input2), false);
            model.unstick(input2);
            assert.strictEqual(stickyFilteredEditorGroup.contains(input1), false);
            assert.strictEqual(stickyFilteredEditorGroup.contains(input2), false);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input1), true);
            assert.strictEqual(unstickyFilteredEditorGroup.contains(input2), true);
        });
        test('Sticky/Unsticky group information', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            // same id
            assert.strictEqual(stickyFilteredEditorGroup.id, model.id);
            assert.strictEqual(unstickyFilteredEditorGroup.id, model.id);
            // group locking same behaviour
            assert.strictEqual(stickyFilteredEditorGroup.isLocked, model.isLocked);
            assert.strictEqual(unstickyFilteredEditorGroup.isLocked, model.isLocked);
            model.lock(true);
            assert.strictEqual(stickyFilteredEditorGroup.isLocked, model.isLocked);
            assert.strictEqual(unstickyFilteredEditorGroup.isLocked, model.isLocked);
            model.lock(false);
            assert.strictEqual(stickyFilteredEditorGroup.isLocked, model.isLocked);
            assert.strictEqual(unstickyFilteredEditorGroup.isLocked, model.isLocked);
        });
        test('Multiple Editors - Editor Emits Dirty and Label Changed', function () {
            const model1 = createEditorGroupModel();
            const model2 = createEditorGroupModel();
            const stickyFilteredEditorGroup1 = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model1));
            const unstickyFilteredEditorGroup1 = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model1));
            const stickyFilteredEditorGroup2 = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model2));
            const unstickyFilteredEditorGroup2 = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model2));
            const input1 = input();
            const input2 = input();
            model1.openEditor(input1, { pinned: true, active: true });
            model2.openEditor(input2, { pinned: true, active: true, sticky: true });
            // DIRTY
            let dirty1CounterSticky = 0;
            disposables.add(stickyFilteredEditorGroup1.onDidModelChange((e) => {
                if (e.kind === 13 /* GroupModelChangeKind.EDITOR_DIRTY */) {
                    dirty1CounterSticky++;
                }
            }));
            let dirty1CounterUnsticky = 0;
            disposables.add(unstickyFilteredEditorGroup1.onDidModelChange((e) => {
                if (e.kind === 13 /* GroupModelChangeKind.EDITOR_DIRTY */) {
                    dirty1CounterUnsticky++;
                }
            }));
            let dirty2CounterSticky = 0;
            disposables.add(stickyFilteredEditorGroup2.onDidModelChange((e) => {
                if (e.kind === 13 /* GroupModelChangeKind.EDITOR_DIRTY */) {
                    dirty2CounterSticky++;
                }
            }));
            let dirty2CounterUnsticky = 0;
            disposables.add(unstickyFilteredEditorGroup2.onDidModelChange((e) => {
                if (e.kind === 13 /* GroupModelChangeKind.EDITOR_DIRTY */) {
                    dirty2CounterUnsticky++;
                }
            }));
            // LABEL
            let label1ChangeCounterSticky = 0;
            disposables.add(stickyFilteredEditorGroup1.onDidModelChange((e) => {
                if (e.kind === 8 /* GroupModelChangeKind.EDITOR_LABEL */) {
                    label1ChangeCounterSticky++;
                }
            }));
            let label1ChangeCounterUnsticky = 0;
            disposables.add(unstickyFilteredEditorGroup1.onDidModelChange((e) => {
                if (e.kind === 8 /* GroupModelChangeKind.EDITOR_LABEL */) {
                    label1ChangeCounterUnsticky++;
                }
            }));
            let label2ChangeCounterSticky = 0;
            disposables.add(stickyFilteredEditorGroup2.onDidModelChange((e) => {
                if (e.kind === 8 /* GroupModelChangeKind.EDITOR_LABEL */) {
                    label2ChangeCounterSticky++;
                }
            }));
            let label2ChangeCounterUnsticky = 0;
            disposables.add(unstickyFilteredEditorGroup2.onDidModelChange((e) => {
                if (e.kind === 8 /* GroupModelChangeKind.EDITOR_LABEL */) {
                    label2ChangeCounterUnsticky++;
                }
            }));
            input1.setDirty();
            input1.setLabel();
            assert.strictEqual(dirty1CounterSticky, 0);
            assert.strictEqual(dirty1CounterUnsticky, 1);
            assert.strictEqual(label1ChangeCounterSticky, 0);
            assert.strictEqual(label1ChangeCounterUnsticky, 1);
            input2.setDirty();
            input2.setLabel();
            assert.strictEqual(dirty2CounterSticky, 1);
            assert.strictEqual(dirty2CounterUnsticky, 0);
            assert.strictEqual(label2ChangeCounterSticky, 1);
            assert.strictEqual(label2ChangeCounterUnsticky, 0);
            closeAllEditors(model2);
            input2.setDirty();
            input2.setLabel();
            assert.strictEqual(dirty2CounterSticky, 1);
            assert.strictEqual(dirty2CounterUnsticky, 0);
            assert.strictEqual(label2ChangeCounterSticky, 1);
            assert.strictEqual(label2ChangeCounterUnsticky, 0);
            assert.strictEqual(dirty1CounterSticky, 0);
            assert.strictEqual(dirty1CounterUnsticky, 1);
            assert.strictEqual(label1ChangeCounterSticky, 0);
            assert.strictEqual(label1ChangeCounterUnsticky, 1);
        });
        test('Sticky/Unsticky isTransient()', async () => {
            const model = createEditorGroupModel();
            const stickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.StickyEditorGroupModel(model));
            const unstickyFilteredEditorGroup = disposables.add(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(model));
            const input1 = input();
            const input2 = input();
            const input3 = input();
            const input4 = input();
            model.openEditor(input1, { pinned: true, transient: false });
            model.openEditor(input2, { pinned: true });
            model.openEditor(input3, { pinned: true, transient: true });
            model.openEditor(input4, { pinned: false, transient: true });
            assert.strictEqual(stickyFilteredEditorGroup.isTransient(input1), false);
            assert.strictEqual(unstickyFilteredEditorGroup.isTransient(input2), false);
            assert.strictEqual(stickyFilteredEditorGroup.isTransient(input3), true);
            assert.strictEqual(unstickyFilteredEditorGroup.isTransient(input4), true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVyZWRFZGl0b3JHcm91cE1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9icm93c2VyL3BhcnRzL2VkaXRvci9maWx0ZXJlZEVkaXRvckdyb3VwTW9kZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXdCaEcsS0FBSyxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtRQUV0QyxJQUFJLGVBQXFELENBQUM7UUFFMUQsYUFBYSxDQUFDLEdBQUcsRUFBRTtZQUNsQixlQUFlLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDM0IsZUFBZSxHQUFHLFNBQVMsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztRQUVILFNBQVMsSUFBSTtZQUNaLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdEIsZUFBZSxHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUNsRCxDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsZUFBZSxDQUFDO1lBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMseUJBQWUsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksMENBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLElBQUksQ0FBQyw2QkFBaUIsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksNENBQW9CLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUUsSUFBSSxDQUFDLElBQUksQ0FBQyxvQ0FBd0IsRUFBRSxJQUFJLDBDQUFrQixFQUFFLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsSUFBSSxDQUFDLDZCQUFpQixFQUFFLHFDQUFvQixDQUFDLENBQUM7WUFFbkQsTUFBTSxNQUFNLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBQzlDLE1BQU0s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