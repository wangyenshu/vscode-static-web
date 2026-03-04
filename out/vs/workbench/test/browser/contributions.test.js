/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/common/contributions", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, async_1, lifecycle_1, platform_1, uri_1, utils_1, descriptors_1, serviceCollection_1, contributions_1, editorService_1, editorGroupsService_1, editorService_2, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Contributions', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let aCreated;
        let aCreatedPromise;
        let bCreated;
        let bCreatedPromise;
        const TEST_EDITOR_ID = 'MyTestEditorForContributions';
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForContributions';
        async function createEditorService(instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables)) {
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_1.EditorService, undefined));
            instantiationService.stub(editorService_2.IEditorService, editorService);
            return [part, editorService];
        }
        setup(() => {
            aCreated = false;
            aCreatedPromise = new async_1.DeferredPromise();
            bCreated = false;
            bCreatedPromise = new async_1.DeferredPromise();
            disposables.add((0, workbenchTestServices_1.registerTestEditor)(TEST_EDITOR_ID, [new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestFileEditorInput), new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestSingletonFileEditorInput)], TEST_EDITOR_INPUT_ID));
        });
        teardown(async () => {
            disposables.clear();
        });
        class TestContributionA {
            constructor() {
                aCreated = true;
                aCreatedPromise.complete();
            }
        }
        class TestContributionB {
            constructor() {
                bCreated = true;
                bCreatedPromise.complete();
            }
        }
        class TestContributionError {
            constructor() {
                throw new Error();
            }
        }
        test('getWorkbenchContribution() - with lazy contributions', () => {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            assert.throws(() => registry.getWorkbenchContribution('a'));
            registry.registerWorkbenchContribution2('a', TestContributionA, { lazy: true });
            assert.throws(() => registry.getWorkbenchContribution('a'));
            registry.registerWorkbenchContribution2('b', TestContributionB, { lazy: true });
            registry.registerWorkbenchContribution2('c', TestContributionError, { lazy: true });
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            registry.start(instantiationService);
            const instanceA = registry.getWorkbenchContribution('a');
            assert.ok(instanceA instanceof TestContributionA);
            assert.ok(aCreated);
            assert.strictEqual(instanceA, registry.getWorkbenchContribution('a'));
            const instanceB = registry.getWorkbenchContribution('b');
            assert.ok(instanceB instanceof TestContributionB);
            assert.throws(() => registry.getWorkbenchContribution('c'));
        });
        test('getWorkbenchContribution() - with non-lazy contributions', async () => {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.lifecycleService.usePhases = true;
            registry.start(instantiationService);
            assert.throws(() => registry.getWorkbenchContribution('a'));
            registry.registerWorkbenchContribution2('a', TestContributionA, 2 /* WorkbenchPhase.BlockRestore */);
            const instanceA = registry.getWorkbenchContribution('a');
            assert.ok(instanceA instanceof TestContributionA);
            assert.ok(aCreated);
            accessor.lifecycleService.phase = 2 /* LifecyclePhase.Ready */;
            await aCreatedPromise.p;
            assert.strictEqual(instanceA, registry.getWorkbenchContribution('a'));
        });
        test('lifecycle phase instantiation works when phase changes', async () => {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            registry.start(instantiationService);
            registry.registerWorkbenchContribution2('a', TestContributionA, 2 /* WorkbenchPhase.BlockRestore */);
            assert.ok(!aCreated);
            accessor.lifecycleService.phase = 2 /* LifecyclePhase.Ready */;
            await aCreatedPromise.p;
            assert.ok(aCreated);
        });
        test('lifecycle phase instantiation works when phase was already met', async () => {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.lifecycleService.usePhases = true;
            accessor.lifecycleService.phase = 3 /* LifecyclePhase.Restored */;
            registry.registerWorkbenchContribution2('a', TestContributionA, 2 /* WorkbenchPhase.BlockRestore */);
            registry.start(instantiationService);
            await aCreatedPromise.p;
            assert.ok(aCreated);
        });
        (platform_1.isCI ? test.skip /* runWhenIdle seems flaky in CI on Windows */ : test)('lifecycle phase instantiation works for late phases', async () => {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.lifecycleService.usePhases = true;
            registry.start(instantiationService);
            registry.registerWorkbenchContribution2('a', TestContributionA, 3 /* WorkbenchPhase.AfterRestored */);
            registry.registerWorkbenchContribution2('b', TestContributionB, 4 /* WorkbenchPhase.Eventually */);
            assert.ok(!aCreated);
            assert.ok(!bCreated);
            accessor.lifecycleService.phase = 1 /* LifecyclePhase.Starting */;
            accessor.lifecycleService.phase = 2 /* LifecyclePhase.Ready */;
            accessor.lifecycleService.phase = 3 /* LifecyclePhase.Restored */;
            await aCreatedPromise.p;
            assert.ok(aCreated);
            accessor.lifecycleService.phase = 4 /* LifecyclePhase.Eventually */;
            await bCreatedPromise.p;
            assert.ok(bCreated);
        });
        test('contribution on editor - editor exists before start', async function () {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const [, editorService] = await createEditorService(instantiationService);
            const input = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID));
            await editorService.openEditor(input, { pinned: true });
            registry.registerWorkbenchContribution2('a', TestContributionA, { editorTypeId: TEST_EDITOR_ID });
            registry.start(instantiationService.createChild(new serviceCollection_1.ServiceCollection([editorService_2.IEditorService, editorService])));
            await aCreatedPromise.p;
            assert.ok(aCreated);
            registry.registerWorkbenchContribution2('b', TestContributionB, { editorTypeId: TEST_EDITOR_ID });
            const input2 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics2'), TEST_EDITOR_INPUT_ID));
            await editorService.openEditor(input2, { pinned: true }, editorService_2.SIDE_GROUP);
            await bCreatedPromise.p;
            assert.ok(bCreated);
        });
        test('contribution on editor - editor does not exist before start', async function () {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const [, editorService] = await createEditorService(instantiationService);
            const input = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID));
            registry.registerWorkbenchContribution2('a', TestContributionA, { editorTypeId: TEST_EDITOR_ID });
            registry.start(instantiationService.createChild(new serviceCollection_1.ServiceCollection([editorService_2.IEditorService, editorService])));
            await editorService.openEditor(input, { pinned: true });
            await aCreatedPromise.p;
            assert.ok(aCreated);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0aW9ucy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvYnJvd3Nlci9jb250cmlidXRpb25zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBQzNCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLElBQUksUUFBaUIsQ0FBQztRQUN0QixJQUFJLGVBQXNDLENBQUM7UUFFM0MsSUFBSSxRQUFpQixDQUFDO1FBQ3RCLElBQUksZUFBc0MsQ0FBQztRQUUzQyxNQUFNLGNBQWMsR0FBRyw4QkFBOEIsQ0FBQztRQUN0RCxNQUFNLG9CQUFvQixHQUFHLGlDQUFpQyxDQUFDO1FBRS9ELEtBQUssVUFBVSxtQkFBbUIsQ0FBQyx1QkFBa0QsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDO1lBQ3pJLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSx3Q0FBZ0IsRUFBQyxvQkFBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN2RSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMENBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFdEQsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkJBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3JHLG9CQUFvQixDQUFDLElBQUksQ0FBQyw4QkFBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRXpELE9BQU8sQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixRQUFRLEdBQUcsS0FBSyxD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