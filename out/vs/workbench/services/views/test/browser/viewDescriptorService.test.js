/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "assert", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/views/browser/viewDescriptorService", "vs/base/common/types", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/base/common/uuid", "vs/base/common/strings", "vs/base/test/common/utils"], function (require, exports, nls, assert, views_1, platform_1, workbenchTestServices_1, descriptors_1, viewDescriptorService_1, types_1, contextKeyService_1, contextkey_1, storage_1, uuid_1, strings_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ViewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    const ViewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
    const viewContainerIdPrefix = 'testViewContainer';
    const sidebarContainer = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
    const panelContainer = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 1 /* ViewContainerLocation.Panel */);
    suite('ViewDescriptorService', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        setup(() => {
            disposables.add(instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables));
            instantiationService.stub(contextkey_1.IContextKeyService, disposables.add(instantiationService.createInstance(contextKeyService_1.ContextKeyService)));
        });
        teardown(() => {
            for (const viewContainer of ViewContainersRegistry.all) {
                if (viewContainer.id.startsWith(viewContainerIdPrefix)) {
                    ViewsRegistry.deregisterViews(ViewsRegistry.getViews(viewContainer), viewContainer);
                }
            }
        });
        function aViewDescriptorService() {
            return disposables.add(instantiationService.createInstance(viewDescriptorService_1.ViewDescriptorService));
        }
        test('Empty Containers', function () {
            const testObject = aViewDescriptorService();
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            const panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.allViewDescriptors.length, 0, 'The sidebar container should have no views yet.');
            assert.strictEqual(panelViews.allViewDescriptors.length, 0, 'The panel container should have no views yet.');
        });
        test('Register/Deregister', () => {
            const testObject = aViewDescriptorService();
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            let sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            let panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 2, 'Sidebar should have 2 views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 1, 'Panel should have 1 view');
            ViewsRegistry.deregisterViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.deregisterViews(viewDescriptors.slice(2), panelContainer);
            sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 0, 'Sidebar should have no views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 0, 'Panel should have no views');
        });
        test('move views to existing containers', async function () {
            const testObject = aViewDescriptorService();
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            testObject.moveViewsToContainer(viewDescriptors.slice(2), sidebarContainer);
            testObject.moveViewsToContainer(viewDescriptors.slice(0, 2), panelContainer);
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            const panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 1, 'Sidebar should have 2 views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 2, 'Panel should have 1 view');
            assert.notStrictEqual(sidebarViews.activeViewDescriptors.indexOf(viewDescriptors[2]), -1, `Sidebar should have ${viewDescriptors[2].name.value}`);
            assert.notStrictEqual(panelViews.activeViewDescriptors.indexOf(viewDescriptors[0]), -1, `Panel should have ${viewDescriptors[0].name.value}`);
            assert.notStrictEqual(panelViews.activeViewDescriptors.indexOf(viewDescriptors[1]), -1, `Panel should have ${viewDescriptors[1].name.value}`);
        });
        test('move views to generated containers', async function () {
            const testObject = aViewDescriptorService();
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            testObject.moveViewToLocation(viewDescriptors[0], 1 /* ViewContainerLocation.Panel */);
            testObject.moveViewToLocation(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */);
            let sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            let panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 1, 'Sidebar container should have 1 view');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 0, 'Panel container should have no views');
            const generatedPanel = (0, types_1.assertIsDefined)(testObject.getViewContainerByViewId(viewDescriptors[0].id));
            const generatedSidebar = (0, types_1.assertIsDefined)(testObject.getViewContainerByViewId(viewDescriptors[2].id));
            assert.strictEqual(testObject.getViewContainerLocation(generatedPanel), 1 /* ViewContainerLocation.Panel */, 'Generated Panel should be in located in the panel');
            assert.strictEqual(testObject.getViewContainerLocation(generatedSidebar), 0 /* ViewContainerLocation.Sidebar */, 'Generated Sidebar should be in located in the sidebar');
            assert.strictEqual(testObject.getViewContainerLocation(generatedPanel), testObject.getViewLocationById(viewDescriptors[0].id), 'Panel view location and container location should match');
            assert.strictEqual(testObject.getViewContainerLocation(generatedSidebar), testObject.getViewLocationById(viewDescriptors[2].id), 'Sidebar view location and container location should match');
            assert.strictEqual(testObject.getDefaultContainerById(viewDescriptors[2].id), panelContainer, `${viewDescriptors[2].name.value} has wrong default container`);
            assert.strictEqual(testObject.getDefaultContainerById(viewDescriptors[0].id), sidebarContainer, `${viewDescriptors[0].name.value} has wrong default container`);
            testObject.moveViewToLocation(viewDescriptors[0], 0 /* ViewContainerLocation.Sidebar */);
            testObject.moveViewToLocation(viewDescriptors[2], 1 /* ViewContainerLocation.Panel */);
            sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 1, 'Sidebar should have 2 views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 0, 'Panel should have 1 view');
            assert.strictEqual(testObject.getViewLocationById(viewDescriptors[0].id), 0 /* ViewContainerLocation.Sidebar */, 'View should be located in the sidebar');
            assert.strictEqual(testObject.getViewLocationById(viewDescriptors[2].id), 1 /* ViewContainerLocation.Panel */, 'View should be located in the panel');
        });
        test('move view events', async function () {
            const testObject = aViewDescriptorService();
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                }
            ];
            let expectedSequence = '';
            let actualSequence = '';
            const containerMoveString = (view, from, to) => {
                return `Moved ${view.id} from ${from.id} to ${to.id}\n`;
            };
            const locationMoveString = (view, from, to) => {
                return `Moved ${view.id} from ${from === 0 /* ViewContainerLocation.Sidebar */ ? 'Sidebar' : 'Panel'} to ${to === 0 /* ViewContainerLocation.Sidebar */ ? 'Sidebar' : 'Panel'}\n`;
            };
            disposables.add(testObject.onDidChangeContainer(({ views, from, to }) => {
                views.forEach(view => {
                    actualSequence += containerMoveString(view, from, to);
                });
            }));
            disposables.add(testObject.onDidChangeLocation(({ views, from, to }) => {
                views.forEach(view => {
                    actualSequence += locationMoveString(view, from, to);
                });
            }));
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            expectedSequence += locationMoveString(viewDescriptors[0], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            testObject.moveViewToLocation(viewDescriptors[0], 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[0], sidebarContainer, testObject.getViewContainerByViewId(viewDescriptors[0].id));
            expectedSequence += locationMoveString(viewDescriptors[2], 1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */);
            testObject.moveViewToLocation(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */);
            expectedSequence += containerMoveString(viewDescriptors[2], panelContainer, testObject.getViewContainerByViewId(viewDescriptors[2].id));
            expectedSequence += locationMoveString(viewDescriptors[0], 1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */);
            expectedSequence += containerMoveString(viewDescriptors[0], testObject.getViewContainerByViewId(viewDescriptors[0].id), sidebarContainer);
            testObject.moveViewsToContainer([viewDescriptors[0]], sidebarContainer);
            expectedSequence += locationMoveString(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[2], testObject.getViewContainerByViewId(viewDescriptors[2].id), panelContainer);
            testObject.moveViewsToContainer([viewDescriptors[2]], panelContainer);
            expectedSequence += locationMoveString(viewDescriptors[0], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[0], sidebarContainer, panelContainer);
            testObject.moveViewsToContainer([viewDescriptors[0]], panelContainer);
            expectedSequence += locationMoveString(viewDescriptors[2], 1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */);
            expectedSequence += containerMoveString(viewDescriptors[2], panelContainer, sidebarContainer);
            testObject.moveViewsToContainer([viewDescriptors[2]], sidebarContainer);
            expectedSequence += locationMoveString(viewDescriptors[1], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += locationMoveString(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[1], sidebarContainer, panelContainer);
            expectedSequence += containerMoveString(viewDescriptors[2], sidebarContainer, panelContainer);
            testObject.moveViewsToContainer([viewDescriptors[1], viewDescriptors[2]], panelContainer);
            assert.strictEqual(actualSequence, expectedSequence, 'Event sequence not matching expected sequence');
        });
        test('reset', async function () {
            const testObject = aViewDescriptorService();
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true,
                    order: 1
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true,
                    order: 2
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true,
                    order: 3
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            testObject.moveViewToLocation(viewDescriptors[0], 1 /* ViewContainerLocation.Panel */);
            testObject.moveViewsToContainer([viewDescriptors[1]], panelContainer);
            testObject.moveViewToLocation(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */);
            const generatedPanel = (0, types_1.assertIsDefined)(testObject.getViewContainerByViewId(viewDescriptors[0].id));
            const generatedSidebar = (0, types_1.assertIsDefined)(testObject.getViewContainerByViewId(viewDescriptors[2].id));
            testObject.reset();
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view1', 'view2']);
            const panelViews = testObject.getViewContainerModel(panelContainer);
            assert.deepStrictEqual(panelViews.allViewDescriptors.map(v => v.id), ['view3']);
            const actual = JSON.parse(instantiationService.get(storage_1.IStorageService).get('views.customizations', 0 /* StorageScope.PROFILE */));
            assert.deepStrictEqual(actual, { viewContainerLocations: {}, viewLocations: {}, viewContainerBadgeEnablementStates: {} });
            assert.deepStrictEqual(testObject.getViewContainerById(generatedPanel.id), null);
            assert.deepStrictEqual(testObject.getViewContainerById(generatedSidebar.id), null);
        });
        test('initialize with custom locations', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const viewContainer1 = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const generateViewContainer1 = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainer1]: 0 /* ViewContainerLocation.Sidebar */,
                    [viewContainer1.id]: 2 /* ViewContainerLocation.AuxiliaryBar */
                },
                viewLocations: {
                    'view1': generateViewContainer1
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                },
                {
                    id: 'view4',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 4', 'Test View 4'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 3), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(3), viewContainer1);
            const testObject = aViewDescriptorService();
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view2', 'view3']);
            const generatedViewContainerViews = testObject.getViewContainerModel(testObject.getViewContainerById(generateViewContainer1));
            assert.deepStrictEqual(generatedViewContainerViews.allViewDescriptors.map(v => v.id), ['view1']);
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer1);
            assert.deepStrictEqual(testObject.getViewContainerLocation(viewContainer1), 2 /* ViewContainerLocation.AuxiliaryBar */);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view4']);
        });
        test('storage change', async function () {
            const testObject = aViewDescriptorService();
            const viewContainer1 = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const generateViewContainer1 = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                },
                {
                    id: 'view4',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 4', 'Test View 4'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 3), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(3), viewContainer1);
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainer1]: 0 /* ViewContainerLocation.Sidebar */,
                    [viewContainer1.id]: 2 /* ViewContainerLocation.AuxiliaryBar */
                },
                viewLocations: {
                    'view1': generateViewContainer1
                }
            };
            instantiationService.get(storage_1.IStorageService).store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view2', 'view3']);
            const generatedViewContainerViews = testObject.getViewContainerModel(testObject.getViewContainerById(generateViewContainer1));
            assert.deepStrictEqual(generatedViewContainerViews.allViewDescriptors.map(v => v.id), ['view1']);
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer1);
            assert.deepStrictEqual(testObject.getViewContainerLocation(viewContainer1), 2 /* ViewContainerLocation.AuxiliaryBar */);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view4']);
        });
        test('orphan views', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const viewsCustomizations = {
                viewContainerLocations: {},
                viewLocations: {
                    'view1': `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true,
                    order: 1
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true,
                    order: 2
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true,
                    order: 3
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors, sidebarContainer);
            const testObject = aViewDescriptorService();
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view2', 'view3']);
            testObject.whenExtensionsRegistered();
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view1', 'view2', 'view3']);
        });
        test('orphan view containers', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const generatedViewContainerId = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generatedViewContainerId]: 0 /* ViewContainerLocation.Sidebar */
                },
                viewLocations: {}
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true,
                    order: 1
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors, sidebarContainer);
            const testObject = aViewDescriptorService();
            testObject.whenExtensionsRegistered();
            assert.deepStrictEqual(testObject.getViewContainerById(generatedViewContainerId), null);
            assert.deepStrictEqual(testObject.isViewContainerRemovedPermanently(generatedViewContainerId), true);
            const actual = JSON.parse(storageService.get('views.customizations', 0 /* StorageScope.PROFILE */));
            assert.deepStrictEqual(actual, { viewContainerLocations: {}, viewLocations: {}, viewContainerBadgeEnablementStates: {} });
        });
        test('custom locations take precedence when default view container of views change', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const viewContainer1 = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const generateViewContainer1 = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainer1]: 0 /* ViewContainerLocation.Sidebar */,
                    [viewContainer1.id]: 2 /* ViewContainerLocation.AuxiliaryBar */
                },
                viewLocations: {
                    'view1': generateViewContainer1
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                },
                {
                    id: 'view4',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 4', 'Test View 4'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 3), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(3), viewContainer1);
            const testObject = aViewDescriptorService();
            ViewsRegistry.moveViews([viewDescriptors[0], viewDescriptors[1]], panelContainer);
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view3']);
            const panelViews = testObject.getViewContainerModel(panelContainer);
            assert.deepStrictEqual(panelViews.allViewDescriptors.map(v => v.id), ['view2']);
            const generatedViewContainerViews = testObject.getViewContainerModel(testObject.getViewContainerById(generateViewContainer1));
            assert.deepStrictEqual(generatedViewContainerViews.allViewDescriptors.map(v => v.id), ['view1']);
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer1);
            assert.deepStrictEqual(testObject.getViewContainerLocation(viewContainer1), 2 /* ViewContainerLocation.AuxiliaryBar */);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view4']);
        });
        test('view containers with not existing views are not removed from customizations', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const viewContainer1 = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const generateViewContainer1 = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainer1]: 0 /* ViewContainerLocation.Sidebar */,
                    [viewContainer1.id]: 2 /* ViewContainerLocation.AuxiliaryBar */
                },
                viewLocations: {
                    'view5': generateViewContainer1
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors, viewContainer1);
            const testObject = aViewDescriptorService();
            testObject.whenExtensionsRegistered();
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer1);
            assert.deepStrictEqual(testObject.getViewContainerLocation(viewContainer1), 2 /* ViewContainerLocation.AuxiliaryBar */);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view1']);
            const actual = JSON.parse(storageService.get('views.customizations', 0 /* StorageScope.PROFILE */));
            assert.deepStrictEqual(actual, viewsCustomizations);
        });
        test('storage change also updates locations even if views do not exists and views are registered later', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const testObject = aViewDescriptorService();
            const generateViewContainerId = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(2 /* ViewContainerLocation.AuxiliaryBar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainerId]: 2 /* ViewContainerLocation.AuxiliaryBar */,
                },
                viewLocations: {
                    'view1': generateViewContainerId
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewContainer = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors, viewContainer);
            testObject.whenExtensionsRegistered();
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view2']);
            const generateViewContainer = testObject.getViewContainerById(generateViewContainerId);
            assert.deepStrictEqual(testObject.getViewContainerLocation(generateViewContainer), 2 /* ViewContainerLocation.AuxiliaryBar */);
            const generatedViewContainerModel = testObject.getViewContainerModel(generateViewContainer);
            assert.deepStrictEqual(generatedViewContainerModel.allViewDescriptors.map(v => v.id), ['view1']);
        });
        test('storage change move views and retain visibility state', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const testObject = aViewDescriptorService();
            const viewContainer = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true,
                    canToggleVisibility: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors, viewContainer);
            testObject.whenExtensionsRegistered();
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer);
            viewContainer1Views.setVisible('view1', false);
            const generateViewContainerId = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(2 /* ViewContainerLocation.AuxiliaryBar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainerId]: 2 /* ViewContainerLocation.AuxiliaryBar */,
                },
                viewLocations: {
                    'view1': generateViewContainerId
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const generateViewContainer = testObject.getViewContainerById(generateViewContainerId);
            const generatedViewContainerModel = testObject.getViewContainerModel(generateViewContainer);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view2']);
            assert.deepStrictEqual(testObject.getViewContainerLocation(generateViewContainer), 2 /* ViewContainerLocation.AuxiliaryBar */);
            assert.deepStrictEqual(generatedViewContainerModel.allViewDescriptors.map(v => v.id), ['view1']);
            storageService.store('views.customizations', JSON.stringify({}), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id).sort((a, b) => (0, strings_1.compare)(a, b)), ['view1', 'view2']);
            assert.deepStrictEqual(viewContainer1Views.visibleViewDescriptors.map(v => v.id), ['view2']);
            assert.deepStrictEqual(generatedViewContainerModel.allViewDescriptors.map(v => v.id), []);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0Rlc2NyaXB0b3JTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdmlld3MvdGVzdC9icm93c2VyL3ZpZXdEZXNjcmlwdG9yU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRyxNQUFNLGFBQWEsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBaUIsa0JBQXVCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDekYsTUFBTSxzQkFBc0IsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBMEIsa0JBQXVCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUNwSCxNQUFNLHFCQUFxQixHQUFHLG1CQUFtQixDQUFDO0lBQ2xELE1BQU0sZ0JBQWdCLEdBQUcsc0JBQXNCLENBQUMscUJBQXFCLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxxQkFBcUIsSUFBSSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSxjQUFjLEVBQUUsSUFBSSw0QkFBYyxDQUFNLEVBQUUsQ0FBQyxFQUFFLHdDQUFnQyxDQUFDO0lBQzlPLE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcscUJBQXFCLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksNEJBQWMsQ0FBTSxFQUFFLENBQUMsRUFBRSxzQ0FBOEIsQ0FBQztJQUUxTyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBRW5DLE1BQU0sV0FBVyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUM5RCxJQUFJLG9CQUE4QyxDQUFDO1FBRW5ELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixHQUE2QixJQUFBLHFEQUE2QixFQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3hILG9CQUFvQixDQUFDLElBQUksQ0FBQywrQkFBa0IsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxQ0FBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4SCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixLQUFLLE1BQU0sYUFBYSxJQUFJLHNCQUFzQixDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN4RCxJQUFJLGFBQWEsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQztvQkFDeEQsYUFBYSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNyRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsU0FBUyxzQkFBc0I7WUFDOUIsT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw2Q0FBcUIsQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUVELElBQUksQ0FBQyxrQkFBa0IsRUFBRTtZQUN4QixNQUFNLFVBQVUsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBQzVDLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLGlEQUFpRCxDQUFDLENBQUM7WUFDakgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDO1FBQzlHLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtZQUNoQyxNQUFNLFVBQVUsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBQzVDLE1BQU0sZUFBZSxHQUFzQjtnQkFDMUM7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7YUFDRCxDQUFDO1lBRUYsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNFLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUV0RSxJQUFJLFlBQVksR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUN0RSxJQUFJLFVBQVUsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO1lBQ2hHLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztZQUUzRixhQUFhLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDN0UsYUFBYSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXhFLFlBQVksR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNsRSxVQUFVLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTlELE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsOEJBQThCLENBQUMsQ0FBQztZQUNqRyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLDRCQUE0QixDQUFDLENBQUM7UUFDOUYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsS0FBSztZQUM5QyxNQUFNLFVBQVUsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBQzVDLE1BQU0sZUFBZSxHQUFzQjtnQkFDMUM7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7YUFDRCxDQUFDO1lBRUYsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNFLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUV0RSxVQUFVLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzVFLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUU3RSxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUN4RSxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO1lBQ2hHLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztZQUUzRixNQUFNLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsdUJBQXVCLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNsSixNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUscUJBQXFCLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUM5SSxNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUscUJBQXFCLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMvSSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLO1lBQy9DLE1BQU0sVUFBVSxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFDNUMsTUFBTSxlQUFlLEdBQXNCO2dCQUMxQztvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjthQUNELENBQUM7WUFFRixhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDM0UsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXRFLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLHNDQUE4QixDQUFDO1lBQy9FLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLHdDQUFnQyxDQUFDO1lBRWpGLElBQUksWUFBWSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3RFLElBQUksVUFBVSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUVsRSxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLHNDQUFzQyxDQUFDLENBQUM7WUFDekcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO1lBRXZHLE1BQU0sY0FBYyxHQUFHLElBQUEsdUJBQWUsRUFBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkcsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLHVCQUFlLEVBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXJHLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyx1Q0FBK0IsbURBQW1ELENBQUMsQ0FBQztZQUMxSixNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxnQkFBZ0IsQ0FBQyx5Q0FBaUMsdURBQXVELENBQUMsQ0FBQztZQUVsSyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsRUFBRSxVQUFVLENBQUMsbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLHlEQUF5RCxDQUFDLENBQUM7WUFDMUwsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxVQUFVLENBQUMsbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLDJEQUEyRCxDQUFDLENBQUM7WUFFOUwsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLGNBQWMsRUFBRSxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyw4QkFBOEIsQ0FBQyxDQUFDO1lBQzlKLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyw4QkFBOEIsQ0FBQyxDQUFDO1lBRWhLLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLHdDQUFnQyxDQUFDO1lBQ2pGLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLHNDQUE4QixDQUFDO1lBRS9FLFlBQVksR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNsRSxVQUFVLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTlELE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztZQUNoRyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLDBCQUEwQixDQUFDLENBQUM7WUFFM0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyx5Q0FBaUMsdUNBQXVDLENBQUMsQ0FBQztZQUNsSixNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLHVDQUErQixxQ0FBcUMsQ0FBQyxDQUFDO1FBQy9JLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEtBQUs7WUFDN0IsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUM1QyxNQUFNLGVBQWUsR0FBc0I7Z0JBQzFDO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2FBQ0QsQ0FBQztZQUVGLElBQUksZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1lBQzFCLElBQUksY0FBYyxHQUFHLEVBQUUsQ0FBQztZQUV4QixNQUFNLG1CQUFtQixHQUFHLENBQUMsSUFBcUIsRUFBRSxJQUFtQixFQUFFLEVBQWlCLEVBQUUsRUFBRTtnQkFDN0YsT0FBTyxTQUFTLElBQUksQ0FBQyxFQUFFLFNBQVMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7WUFDekQsQ0FBQyxDQUFDO1lBRUYsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLElBQXFCLEVBQUUsSUFBMkIsRUFBRSxFQUF5QixFQUFFLEVBQUU7Z0JBQzVHLE9BQU8sU0FBUyxJQUFJLENBQUMsRUFBRSxTQUFTLElBQUksMENBQWtDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxPQUFPLEVBQUUsMENBQWtDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUM7WUFDbkssQ0FBQyxDQUFDO1lBQ0YsV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDdkUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDcEIsY0FBYyxJQUFJLG1CQUFtQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZELENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3RFLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3BCLGNBQWMsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN0RCxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDM0UsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXRFLGdCQUFnQixJQUFJLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsNkVBQTZELENBQUM7WUFDdkgsVUFBVSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsc0NBQThCLENBQUM7WUFDL0UsZ0JBQWdCLElBQUksbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLENBQUMsQ0FBQztZQUUzSSxnQkFBZ0IsSUFBSSxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLDZFQUE2RCxDQUFDO1lBQ3ZILFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLHdDQUFnQyxDQUFDO1lBQ2pGLGdCQUFnQixJQUFJLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLEVBQUUsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUUsQ0FBQyxDQUFDO1lBRXpJLGdCQUFnQixJQUFJLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsNkVBQTZELENBQUM7WUFDdkgsZ0JBQWdCLElBQUksbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMzSSxVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBRXhFLGdCQUFnQixJQUFJLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsNkVBQTZELENBQUM7WUFDdkgsZ0JBQWdCLElBQUksbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDekksVUFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFdEUsZ0JBQWdCLElBQUksa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyw2RUFBNkQsQ0FBQztZQUN2SCxnQkFBZ0IsSUFBSSxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDOUYsVUFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFdEUsZ0JBQWdCLElBQUksa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyw2RUFBNkQsQ0FBQztZQUN2SCxnQkFBZ0IsSUFBSSxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDOUYsVUFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUV4RSxnQkFBZ0IsSUFBSSxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLDZFQUE2RCxDQUFDO1lBQ3ZILGdCQUFnQixJQUFJLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsNkVBQTZELENBQUM7WUFDdkgsZ0JBQWdCLElBQUksbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzlGLGdCQUFnQixJQUFJLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM5RixVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFMUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUsK0NBQStDLENBQUMsQ0FBQztRQUN2RyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSztZQUNsQixNQUFNLFVBQVUsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBQzVDLE1BQU0sZUFBZSxHQUFzQjtnQkFDMUM7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO29CQUNqQixLQUFLLEVBQUUsQ0FBQztpQkFDUjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7b0JBQ2pCLEtBQUssRUFBRSxDQUFDO2lCQUNSO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtvQkFDakIsS0FBSyxFQUFFLENBQUM7aUJBQ1I7YUFDRCxDQUFDO1lBRUYsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNFLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUV0RSxVQUFVLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxzQ0FBOEIsQ0FBQztZQUMvRSxVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUN0RSxVQUFVLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyx3Q0FBZ0MsQ0FBQztZQUVqRixNQUFNLGNBQWMsR0FBRyxJQUFBLHVCQUFlLEVBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25HLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSx1QkFBZSxFQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVyRyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFbkIsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDeEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDM0YsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFFaEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsK0JBQXdCLENBQUMsQ0FBQztZQUN4SCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxFQUFFLHNCQUFzQixFQUFFLEVBQUUsRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLGtDQUFrQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFMUgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pGLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtDQUFrQyxFQUFFLEtBQUs7WUFDN0MsTUFBTSxjQUFjLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQztZQUNqRSxNQUFNLGNBQWMsR0FBRyxzQkFBc0IsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLHFCQUFxQixJQUFJLElBQUEsbUJBQVksR0FBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLGNBQWMsRUFBRSxJQUFJLDRCQUFjLENBQU0sRUFBRSxDQUFDLEVBQUUsd0NBQWdDLENBQUM7WUFDNU8sTUFBTSxzQkFBc0IsR0FBRywyQkFBMkIsSUFBQSxxQ0FBNkIsd0NBQStCLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsQ0FBQztZQUMzSSxNQUFNLG1CQUFtQixHQUFHO2dCQUMzQixzQkFBc0IsRUFBRTtvQkFDdkIsQ0FBQyxzQkFBc0IsQ0FBQyx1Q0FBK0I7b0JBQ3ZELENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyw0Q0FBb0M7aUJBQ3ZEO2dCQUNELGFBQWEsRUFBRTtvQkFDZCxPQUFPLEVBQUUsc0JBQXNCO2lCQUMvQjthQUNELENBQUM7WUFDRixjQUFjLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsMkRBQTJDLENBQUM7WUFFNUgsTUFBTSxlQUFlLEdBQXNCO2dCQUMxQztvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2FBQ0QsQ0FBQztZQUVGLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMzRSxhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFdEUsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUU1QyxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUN4RSxNQUFNLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUUzRixNQUFNLDJCQUEyQixHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUUsQ0FBQyxDQUFDO1lBQy9ILE1BQU0sQ0FBQyxlQUFlLENBQUMsMkJBQTJCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUVqRyxNQUFNLG1CQUFtQixHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsNkNBQXFDLENBQUM7WUFDaEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzFGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEtBQUs7WUFDM0IsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUU1QyxNQUFNLGNBQWMsR0FBRyxzQkFBc0IsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLHFCQUFxQixJQUFJLElBQUEsbUJBQVksR0FBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLGNBQWMsRUFBRSxJQUFJLDRCQUFjLENBQU0sRUFBRSxDQUFDLEVBQUUsd0NBQWdDLENBQUM7WUFDNU8sTUFBTSxzQkFBc0IsR0FBRywyQkFBMkIsSUFBQSxxQ0FBNkIsd0NBQStCLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsQ0FBQztZQUUzSSxNQUFNLGVBQWUsR0FBc0I7Z0JBQzFDO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7YUFDRCxDQUFDO1lBRUYsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNFLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUV0RSxNQUFNLG1CQUFtQixHQUFHO2dCQUMzQixzQkFBc0IsRUFBRTtvQkFDdkIsQ0FBQyxzQkFBc0IsQ0FBQyx1Q0FBK0I7b0JBQ3ZELENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyw0Q0FBb0M7aUJBQ3ZEO2dCQUNELGFBQWEsRUFBRTtvQkFDZCxPQUFPLEVBQUUsc0JBQXNCO2lCQUMvQjthQUNELENBQUM7WUFDRixvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLDJEQUEyQyxDQUFDO1lBRXZKLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRTNGLE1BQU0sMkJBQTJCLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBRSxDQUFDLENBQUM7WUFDL0gsTUFBTSxDQUFDLGVBQWUsQ0FBQywyQkFBMkIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRWpHLE1BQU0sbUJBQW1CLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyw2Q0FBcUMsQ0FBQztZQUNoSCxNQUFNLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDMUYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFLEtBQUs7WUFDekIsTUFBTSxjQUFjLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQztZQUNqRSxNQUFNLG1CQUFtQixHQUFHO2dCQUMzQixzQkFBc0IsRUFBRSxFQUFFO2dCQUMxQixhQUFhLEVBQUU7b0JBQ2QsT0FBTyxFQUFFLEdBQUcscUJBQXFCLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUU7aUJBQ3JEO2FBQ0QsQ0FBQztZQUNGLGNBQWMsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQywyREFBMkMsQ0FBQztZQUU1SCxNQUFNLGVBQWUsR0FBc0I7Z0JBQzFDO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtvQkFDakIsS0FBSyxFQUFFLENBQUM7aUJBQ1I7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO29CQUNqQixLQUFLLEVBQUUsQ0FBQztpQkFDUjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7b0JBQ2pCLEtBQUssRUFBRSxDQUFDO2lCQUNSO2FBQ0QsQ0FBQztZQUVGLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFL0QsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUU1QyxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUN4RSxNQUFNLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUUzRixVQUFVLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUN0QyxNQUFNLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDckcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0JBQXdCLEVBQUUsS0FBSztZQUNuQyxNQUFNLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sd0JBQXdCLEdBQUcsMkJBQTJCLElBQUEscUNBQTZCLHdDQUErQixJQUFJLElBQUEsbUJBQVksR0FBRSxFQUFFLENBQUM7WUFDN0ksTUFBTSxtQkFBbUIsR0FBRztnQkFDM0Isc0JBQXNCLEVBQUU7b0JBQ3ZCLENBQUMsd0JBQXdCLENBQUMsdUNBQStCO2lCQUN6RDtnQkFDRCxhQUFhLEVBQUUsRUFBRTthQUNqQixDQUFDO1lBQ0YsY0FBYyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLDJEQUEyQyxDQUFDO1lBRTVILE1BQU0sZUFBZSxHQUFzQjtnQkFDMUM7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO29CQUNqQixLQUFLLEVBQUUsQ0FBQztpQkFDUjthQUNELENBQUM7WUFFRixhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBRS9ELE1BQU0sVUFBVSxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFDNUMsVUFBVSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFFdEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4RixNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxpQ0FBaUMsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXJHLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsK0JBQXdCLENBQUMsQ0FBQztZQUM3RixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxFQUFFLHNCQUFzQixFQUFFLEVBQUUsRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLGtDQUFrQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEVBQThFLEVBQUUsS0FBSztZQUN6RixNQUFNLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcscUJBQXFCLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksNEJBQWMsQ0FBTSxFQUFFLENBQUMsRUFBRSx3Q0FBZ0MsQ0FBQztZQUM1TyxNQUFNLHNCQUFzQixHQUFHLDJCQUEyQixJQUFBLHFDQUE2Qix3Q0FBK0IsSUFBSSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxDQUFDO1lBQzNJLE1BQU0sbUJBQW1CLEdBQUc7Z0JBQzNCLHNCQUFzQixFQUFFO29CQUN2QixDQUFDLHNCQUFzQixDQUFDLHVDQUErQjtvQkFDdkQsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLDRDQUFvQztpQkFDdkQ7Z0JBQ0QsYUFBYSxFQUFFO29CQUNkLE9BQU8sRUFBRSxzQkFBc0I7aUJBQy9CO2FBQ0QsQ0FBQztZQUNGLGNBQWMsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQywyREFBMkMsQ0FBQztZQUU1SCxNQUFNLGVBQWUsR0FBc0I7Z0JBQzFDO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7YUFDRCxDQUFDO1lBRUYsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNFLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUV0RSxNQUFNLFVBQVUsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBQzVDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFbEYsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDeEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUVsRixNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUVoRixNQUFNLDJCQUEyQixHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLENBQUUsQ0FBQyxDQUFDO1lBQy9ILE1BQU0sQ0FBQyxlQUFlLENBQUMsMkJBQTJCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUVqRyxNQUFNLG1CQUFtQixHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsNkNBQXFDLENBQUM7WUFDaEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzFGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZFQUE2RSxFQUFFLEtBQUs7WUFDeEYsTUFBTSxjQUFjLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQztZQUNqRSxNQUFNLGNBQWMsR0FBRyxzQkFBc0IsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLHFCQUFxQixJQUFJLElBQUEsbUJBQVksR0FBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLGNBQWMsRUFBRSxJQUFJLDRCQUFjLENBQU0sRUFBRSxDQUFDLEVBQUUsd0NBQWdDLENBQUM7WUFDNU8sTUFBTSxzQkFBc0IsR0FBRywyQkFBMkIsSUFBQSxxQ0FBNkIsd0NBQStCLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsQ0FBQztZQUMzSSxNQUFNLG1CQUFtQixHQUFHO2dCQUMzQixzQkFBc0IsRUFBRTtvQkFDdkIsQ0FBQyxzQkFBc0IsQ0FBQyx1Q0FBK0I7b0JBQ3ZELENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyw0Q0FBb0M7aUJBQ3ZEO2dCQUNELGFBQWEsRUFBRTtvQkFDZCxPQUFPLEVBQUUsc0JBQXNCO2lCQUMvQjthQUNELENBQUM7WUFDRixjQUFjLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsMkRBQTJDLENBQUM7WUFFNUgsTUFBTSxlQUFlLEdBQXNCO2dCQUMxQztvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2FBQ0QsQ0FBQztZQUVGLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRTdELE1BQU0sVUFBVSxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFDNUMsVUFBVSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFFdEMsTUFBTSxtQkFBbUIsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsY0FBYyxDQUFDLDZDQUFxQyxDQUFDO1lBQ2hILE1BQU0sQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUV6RixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsc0JBQXNCLCtCQUF3QixDQUFDLENBQUM7WUFDN0YsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrR0FBa0csRUFBRSxLQUFLO1lBQzdHLE1BQU0sY0FBYyxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUM7WUFDakUsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUU1QyxNQUFNLHVCQUF1QixHQUFHLDJCQUEyQixJQUFBLHFDQUE2Qiw2Q0FBb0MsSUFBSSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxDQUFDO1lBQ2pKLE1BQU0sbUJBQW1CLEdBQUc7Z0JBQzNCLHNCQUFzQixFQUFFO29CQUN2QixDQUFDLHVCQUF1QixDQUFDLDRDQUFvQztpQkFDN0Q7Z0JBQ0QsYUFBYSxFQUFFO29CQUNkLE9BQU8sRUFBRSx1QkFBdUI7aUJBQ2hDO2FBQ0QsQ0FBQztZQUNGLGNBQWMsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQywyREFBMkMsQ0FBQztZQUU1SCxNQUFNLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLHFCQUFxQixJQUFJLElBQUEsbUJBQVksR0FBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLGNBQWMsRUFBRSxJQUFJLDRCQUFjLENBQU0sRUFBRSxDQUFDLEVBQUUsd0NBQWdDLENBQUM7WUFDM08sTUFBTSxlQUFlLEdBQXNCO2dCQUMxQztvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7YUFDRCxDQUFDO1lBQ0YsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFNUQsVUFBVSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFFdEMsTUFBTSxtQkFBbUIsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDNUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRXpGLE1BQU0scUJBQXFCLEdBQUcsVUFBVSxDQUFDLG9CQUFvQixDQUFDLHVCQUF1QixDQUFFLENBQUM7WUFDeEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMscUJBQXFCLENBQUMsNkNBQXFDLENBQUM7WUFDdkgsTUFBTSwyQkFBMkIsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUM1RixNQUFNLENBQUMsZUFBZSxDQUFDLDJCQUEyQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDbEcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdURBQXVELEVBQUUsS0FBSztZQUNsRSxNQUFNLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sVUFBVSxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFFNUMsTUFBTSxhQUFhLEdBQUcsc0JBQXNCLENBQUMscUJBQXFCLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxxQkFBcUIsSUFBSSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSxjQUFjLEVBQUUsSUFBSSw0QkFBYyxDQUFNLEVBQUUsQ0FBQyxFQUFFLHdDQUFnQyxDQUFDO1lBQzNPLE1BQU0sZUFBZSxHQUFzQjtnQkFDMUM7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO29CQUNqQixtQkFBbUIsRUFBRSxJQUFJO2lCQUN6QjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2FBQ0QsQ0FBQztZQUNGLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRTVELFVBQVUsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBRXRDLE1BQU0sbUJBQW1CLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzVFLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFL0MsTUFBTSx1QkFBdUIsR0FBRywyQkFBMkIsSUFBQSxxQ0FBNkIsNkNBQW9DLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsQ0FBQztZQUNqSixNQUFNLG1CQUFtQixHQUFHO2dCQUMzQixzQkFBc0IsRUFBRTtvQkFDdkIsQ0FBQyx1QkFBdUIsQ0FBQyw0Q0FBb0M7aUJBQzdEO2dCQUNELGFBQWEsRUFBRTtvQkFDZCxPQUFPLEVBQUUsdUJBQXVCO2lCQUNoQzthQUNELENBQUM7WUFDRixjQUFjLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsMkRBQTJDLENBQUM7WUFFNUgsTUFBTSxxQkFBcUIsR0FBRyxVQUFVLENBQUMsb0JBQW9CLENBQUMsdUJBQXVCLENBQUUsQ0FBQztZQUN4RixNQUFNLDJCQUEyQixHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBRTVGLE1BQU0sQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN6RixNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxxQkFBcUIsQ0FBQyw2Q0FBcUMsQ0FBQztZQUN2SCxNQUFNLENBQUMsZUFBZSxDQUFDLDJCQUEyQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFFakcsY0FBYyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQywyREFBMkMsQ0FBQztZQUUzRyxNQUFNLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFBLGlCQUFPLEVBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNoSSxNQUFNLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDN0YsTUFBTSxDQUFDLGVBQWUsQ0FBQywyQkFBMkIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0YsQ0FBQyxDQUFDLENBQUM7SUFFSixDQUFDLENBQUMsQ0FBQyJ9