/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/parts/storage/common/storage", "vs/base/test/common/testUtils", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/log/common/log", "vs/platform/storage/test/common/storageService.test", "vs/workbench/services/storage/browser/storageService", "vs/workbench/services/userDataProfile/common/userDataProfileService"], function (require, exports, assert_1, lifecycle_1, network_1, resources_1, uri_1, storage_1, testUtils_1, timeTravelScheduler_1, utils_1, fileService_1, inMemoryFilesystemProvider_1, log_1, storageService_test_1, storageService_1, userDataProfileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function createStorageService() {
        const disposables = new lifecycle_1.DisposableStore();
        const logService = new log_1.NullLogService();
        const fileService = disposables.add(new fileService_1.FileService(logService));
        const userDataProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
        disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, userDataProvider));
        const profilesRoot = uri_1.URI.file('/profiles').with({ scheme: network_1.Schemas.inMemory });
        const inMemoryExtraProfileRoot = (0, resources_1.joinPath)(profilesRoot, 'extra');
        const inMemoryExtraProfile = {
            id: 'id',
            name: 'inMemory',
            shortName: 'inMemory',
            isDefault: false,
            location: inMemoryExtraProfileRoot,
            globalStorageHome: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'globalStorageHome'),
            settingsResource: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'settingsResource'),
            keybindingsResource: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'keybindingsResource'),
            tasksResource: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'tasksResource'),
            snippetsHome: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'snippetsHome'),
            extensionsResource: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'extensionsResource'),
            cacheHome: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'cache')
        };
        const storageService = disposables.add(new storageService_1.BrowserStorageService({ id: 'workspace-storage-test' }, disposables.add(new userDataProfileService_1.UserDataProfileService(inMemoryExtraProfile)), logService));
        await storageService.initialize();
        return [disposables, storageService];
    }
    (0, testUtils_1.flakySuite)('StorageService (browser)', function () {
        const disposables = new lifecycle_1.DisposableStore();
        let storageService;
        (0, storageService_test_1.createSuite)({
            setup: async () => {
                const res = await createStorageService();
                disposables.add(res[0]);
                storageService = res[1];
                return storageService;
            },
            teardown: async () => {
                await storageService.clear();
                disposables.clear();
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    (0, testUtils_1.flakySuite)('StorageService (browser specific)', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let storageService;
        setup(async () => {
            const res = await createStorageService();
            disposables.add(res[0]);
            storageService = res[1];
        });
        teardown(async () => {
            await storageService.clear();
            disposables.clear();
        });
        test.skip('clear', () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                storageService.store('bar', 'foo', -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                storageService.store('bar', 3, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                storageService.store('bar', 'foo', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                storageService.store('bar', 3, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                storageService.store('bar', 'foo', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                storageService.store('bar', 3, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
                await storageService.clear();
                for (const scope of [-1 /* StorageScope.APPLICATION */, 0 /* StorageScope.PROFILE */, 1 /* StorageScope.WORKSPACE */]) {
                    for (const target of [0 /* StorageTarget.USER */, 1 /* StorageTarget.MACHINE */]) {
                        (0, assert_1.strictEqual)(storageService.get('bar', scope), undefined);
                        (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 0);
                    }
                }
            });
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    (0, testUtils_1.flakySuite)('IndexDBStorageDatabase (browser)', () => {
        const id = 'workspace-storage-db-test';
        const logService = new log_1.NullLogService();
        const disposables = new lifecycle_1.DisposableStore();
        teardown(async () => {
            const storage = disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService));
            await storage.clear();
            disposables.clear();
        });
        test('Basics', async () => {
            let storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            // Insert initial data
            storage.set('bar', 'foo');
            storage.set('barNumber', 55);
            storage.set('barBoolean', true);
            storage.set('barUndefined', undefined);
            storage.set('barNull', null);
            (0, assert_1.strictEqual)(storage.get('bar'), 'foo');
            (0, assert_1.strictEqual)(storage.get('barNumber'), '55');
            (0, assert_1.strictEqual)(storage.get('barBoolean'), 'true');
            (0, assert_1.strictEqual)(storage.get('barUndefined'), undefined);
            (0, assert_1.strictEqual)(storage.get('barNull'), undefined);
            (0, assert_1.strictEqual)(storage.size, 3);
            (0, assert_1.strictEqual)(storage.items.size, 3);
            await storage.close();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            // Check initial data still there
            (0, assert_1.strictEqual)(storage.get('bar'), 'foo');
            (0, assert_1.strictEqual)(storage.get('barNumber'), '55');
            (0, assert_1.strictEqual)(storage.get('barBoolean'), 'true');
            (0, assert_1.strictEqual)(storage.get('barUndefined'), undefined);
            (0, assert_1.strictEqual)(storage.get('barNull'), undefined);
            (0, assert_1.strictEqual)(storage.size, 3);
            (0, assert_1.strictEqual)(storage.items.size, 3);
            // Update data
            storage.set('bar', 'foo2');
            storage.set('barNumber', 552);
            (0, assert_1.strictEqual)(storage.get('bar'), 'foo2');
            (0, assert_1.strictEqual)(storage.get('barNumber'), '552');
            await storage.close();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            // Check initial data still there
            (0, assert_1.strictEqual)(storage.get('bar'), 'foo2');
            (0, assert_1.strictEqual)(storage.get('barNumber'), '552');
            (0, assert_1.strictEqual)(storage.get('barBoolean'), 'true');
            (0, assert_1.strictEqual)(storage.get('barUndefined'), undefined);
            (0, assert_1.strictEqual)(storage.get('barNull'), undefined);
            (0, assert_1.strictEqual)(storage.size, 3);
            (0, assert_1.strictEqual)(storage.items.size, 3);
            // Delete data
            storage.delete('bar');
            storage.delete('barNumber');
            storage.delete('barBoolean');
            (0, assert_1.strictEqual)(storage.get('bar', 'undefined'), 'undefined');
            (0, assert_1.strictEqual)(storage.get('barNumber', 'undefinedNumber'), 'undefinedNumber');
            (0, assert_1.strictEqual)(storage.get('barBoolean', 'undefinedBoolean'), 'undefinedBoolean');
            (0, assert_1.strictEqual)(storage.size, 0);
            (0, assert_1.strictEqual)(storage.items.size, 0);
            await storage.close();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            (0, assert_1.strictEqual)(storage.get('bar', 'undefined'), 'undefined');
            (0, assert_1.strictEqual)(storage.get('barNumber', 'undefinedNumber'), 'undefinedNumber');
            (0, assert_1.strictEqual)(storage.get('barBoolean', 'undefinedBoolean'), 'undefinedBoolean');
            (0, assert_1.strictEqual)(storage.size, 0);
            (0, assert_1.strictEqual)(storage.items.size, 0);
        });
        test('Clear', async () => {
            let storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            storage.set('bar', 'foo');
            storage.set('barNumber', 55);
            storage.set('barBoolean', true);
            await storage.close();
            const db = disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService));
            storage = disposables.add(new storage_1.Storage(db));
            await storage.init();
            await db.clear();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            (0, assert_1.strictEqual)(storage.get('bar'), undefined);
            (0, assert_1.strictEqual)(storage.get('barNumber'), undefined);
            (0, assert_1.strictEqual)(storage.get('barBoolean'), undefined);
            (0, assert_1.strictEqual)(storage.size, 0);
            (0, assert_1.strictEqual)(storage.items.size, 0);
        });
        test('Inserts and Deletes at the same time', async () => {
            let storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            storage.set('bar', 'foo');
            storage.set('barNumber', 55);
            storage.set('barBoolean', true);
            await storage.close();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            storage.set('bar', 'foobar');
            const largeItem = JSON.stringify({ largeItem: 'Hello World'.repeat(1000) });
            storage.set('largeItem', largeItem);
            storage.delete('barNumber');
            storage.delete('barBoolean');
            await storage.close();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            (0, assert_1.strictEqual)(storage.get('bar'), 'foobar');
            (0, assert_1.strictEqual)(storage.get('largeItem'), largeItem);
            (0, assert_1.strictEqual)(storage.get('barNumber'), undefined);
            (0, assert_1.strictEqual)(storage.get('barBoolean'), undefined);
        });
        test('Storage change event', async () => {
            const storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            let storageChangeEvents = [];
            disposables.add(storage.onDidChangeStorage(e => storageChangeEvents.push(e)));
            await storage.init();
            storage.set('notExternal', 42);
            let storageValueChangeEvent = storageChangeEvents.find(e => e.key === 'notExternal');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.external, false);
            storageChangeEvents = [];
            storage.set('isExternal', 42, true);
            storageValueChangeEvent = storageChangeEvents.find(e => e.key === 'isExternal');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.external, true);
            storage.delete('notExternal');
            storageValueChangeEvent = storageChangeEvents.find(e => e.key === 'notExternal');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.external, false);
            storage.delete('isExternal', true);
            storageValueChangeEvent = storageChangeEvents.find(e => e.key === 'isExternal');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.external, true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zdG9yYWdlL3Rlc3QvYnJvd3Nlci9zdG9yYWdlU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBb0JoRyxLQUFLLFVBQVUsb0JBQW9CO1FBQ2xDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBQzFDLE1BQU0sVUFBVSxHQUFHLElBQUksb0JBQWMsRUFBRSxDQUFDO1FBRXhDLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFakUsTUFBTSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdURBQTBCLEVBQUUsQ0FBQyxDQUFDO1FBQzNFLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGlCQUFPLENBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUV4RixNQUFNLFlBQVksR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFFOUUsTUFBTSx3QkFBd0IsR0FBRyxJQUFBLG9CQUFRLEVBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sb0JBQW9CLEdBQXFCO1lBQzlDLEVBQUUsRUFBRSxJQUFJO1lBQ1IsSUFBSSxFQUFFLFVBQVU7WUFDaEIsU0FBUyxFQUFFLFVBQVU7WUFDckIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsUUFBUSxFQUFFLHdCQUF3QjtZQUNsQyxp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