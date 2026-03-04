/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/uri", "vs/base/parts/storage/common/storage", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/platform/storage/common/storage", "vs/platform/userDataProfile/common/userDataProfile", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils"], function (require, exports, assert, event_1, uri_1, storage_1, userDataProfileStorageService_1, storage_2, userDataProfile_1, timeTravelScheduler_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestUserDataProfileStorageService = void 0;
    class TestStorageDatabase extends storage_1.InMemoryStorageDatabase {
        constructor() {
            super(...arguments);
            this._onDidChangeItemsExternal = new event_1.Emitter();
            this.onDidChangeItemsExternal = this._onDidChangeItemsExternal.event;
        }
        async updateItems(request) {
            await super.updateItems(request);
            if (request.insert || request.delete) {
                this._onDidChangeItemsExternal.fire({ changed: request.insert, deleted: request.delete });
            }
        }
    }
    class TestUserDataProfileStorageService extends userDataProfileStorageService_1.AbstractUserDataProfileStorageService {
        constructor() {
            super(...arguments);
            this.onDidChange = event_1.Event.None;
            this.databases = new Map();
        }
        async createStorageDatabase(profile) {
            let database = this.databases.get(profile.id);
            if (!database) {
                this.databases.set(profile.id, database = new TestStorageDatabase());
            }
            return database;
        }
        setupStorageDatabase(profile) {
            return this.createStorageDatabase(profile);
        }
        async closeAndDispose() { }
    }
    exports.TestUserDataProfileStorageService = TestUserDataProfileStorageService;
    suite('ProfileStorageService', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const profile = (0, userDataProfile_1.toUserDataProfile)('test', 'test', uri_1.URI.file('foo'), uri_1.URI.file('cache'));
        let testObject;
        let storage;
        setup(async () => {
            testObject = disposables.add(new TestUserDataProfileStorageService(disposables.add(new storage_2.InMemoryStorageService())));
            storage = disposables.add(new storage_1.Storage(await testObject.setupStorageDatabase(profile)));
            await storage.init();
        });
        test('read empty storage', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const actual = await testObject.readStorageData(profile);
            assert.strictEqual(actual.size, 0);
        }));
        test('read storage with data', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            storage.set('foo', 'bar');
            storage.set(storage_2.TARGET_KEY, JSON.stringify({ foo: 0 /* StorageTarget.USER */ }));
            await storage.flush();
            const actual = await testObject.readStorageData(profile);
            assert.strictEqual(actual.size, 1);
            assert.deepStrictEqual(actual.get('foo'), { 'value': 'bar', 'target': 0 /* StorageTarget.USER */ });
        }));
        test('write in empty storage', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const data = new Map();
            data.set('foo', 'bar');
            await testObject.updateStorageData(profile, data, 0 /* StorageTarget.USER */);
            assert.strictEqual(storage.items.size, 2);
            assert.deepStrictEqual((0, storage_2.loadKeyTargets)(storage), { foo: 0 /* StorageTarget.USER */ });
            assert.strictEqual(storage.get('foo'), 'bar');
        }));
        test('write in storage with data', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            storage.set('foo', 'bar');
            storage.set(storage_2.TARGET_KEY, JSON.stringify({ foo: 0 /* StorageTarget.USER */ }));
            await storage.flush();
            const data = new Map();
            data.set('abc', 'xyz');
            await testObject.updateStorageData(profile, data, 1 /* StorageTarget.MACHINE */);
            assert.strictEqual(storage.items.size, 3);
            assert.deepStrictEqual((0, storage_2.loadKeyTargets)(storage), { foo: 0 /* StorageTarget.USER */, abc: 1 /* StorageTarget.MACHINE */ });
            assert.strictEqual(storage.get('foo'), 'bar');
            assert.strictEqual(storage.get('abc'), 'xyz');
        }));
        test('write in storage with data (insert, update, remove)', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            storage.set('foo', 'bar');
            storage.set('abc', 'xyz');
            storage.set(storage_2.TARGET_KEY, JSON.stringify({ foo: 0 /* StorageTarget.USER */, abc: 1 /* StorageTarget.MACHINE */ }));
            await storage.flush();
            const data = new Map();
            data.set('foo', undefined);
            data.set('abc', 'def');
            data.set('var', 'const');
            await testObject.updateStorageData(profile, data, 0 /* StorageTarget.USER */);
            assert.strictEqual(storage.items.size, 3);
            assert.deepStrictEqual((0, storage_2.loadKeyTargets)(storage), { abc: 0 /* StorageTarget.USER */, var: 0 /* StorageTarget.USER */ });
            assert.strictEqual(storage.get('abc'), 'def');
            assert.strictEqual(storage.get('var'), 'const');
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlU3RvcmFnZVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhUHJvZmlsZS90ZXN0L2NvbW1vbi91c2VyRGF0YVByb2ZpbGVTdG9yYWdlU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFNLG1CQUFvQixTQUFRLGlDQUF1QjtRQUF6RDs7WUFFa0IsOEJBQXlCLEdBQUcsSUFBSSxlQUFPLEVBQTRCLENBQUM7WUFDbkUsNkJBQXdCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQztRQVFuRixDQUFDO1FBTlMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUF1QjtZQUNqRCxNQUFNLEtBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDakMsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUMzRixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBRUQsTUFBYSxpQ0FBa0MsU0FBUSxxRUFBcUM7UUFBNUY7O1lBRVUsZ0JBQVcsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzFCLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBbUMsQ0FBQztRQWVoRSxDQUFDO1FBYlUsS0FBSyxDQUFDLHFCQUFxQixDQUFDLE9BQXlCO1lBQzlELElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENB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