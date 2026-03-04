/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/environment/node/argv", "vs/platform/environment/node/environmentService", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/state/node/stateService", "vs/platform/storage/common/storage", "vs/platform/storage/electron-main/storageMainService", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/test/electron-main/workbenchTestServices", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert_1, network_1, resources_1, uri_1, uuid_1, argv_1, environmentService_1, fileService_1, log_1, product_1, stateService_1, storage_1, storageMainService_1, telemetry_1, uriIdentityService_1, userDataProfile_1, workbenchTestServices_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('StorageMainService', function () {
        const disposables = new lifecycle_1.DisposableStore();
        const productService = { _serviceBrand: undefined, ...product_1.default };
        const inMemoryProfileRoot = uri_1.URI.file('/location').with({ scheme: network_1.Schemas.inMemory });
        const inMemoryProfile = {
            id: 'id',
            name: 'inMemory',
            shortName: 'inMemory',
            isDefault: false,
            location: inMemoryProfileRoot,
            globalStorageHome: (0, resources_1.joinPath)(inMemoryProfileRoot, 'globalStorageHome'),
            settingsResource: (0, resources_1.joinPath)(inMemoryProfileRoot, 'settingsResource'),
            keybindingsResource: (0, resources_1.joinPath)(inMemoryProfileRoot, 'keybindingsResource'),
            tasksResource: (0, resources_1.joinPath)(inMemoryProfileRoot, 'tasksResource'),
            snippetsHome: (0, resources_1.joinPath)(inMemoryProfileRoot, 'snippetsHome'),
            extensionsResource: (0, resources_1.joinPath)(inMemoryProfileRoot, 'extensionsResource'),
            cacheHome: (0, resources_1.joinPath)(inMemoryProfileRoot, 'cache'),
        };
        class TestStorageMainService extends storageMainService_1.StorageMainService {
            getStorageOptions() {
                return {
                    useInMemoryStorage: true
                };
            }
        }
        async function testStorage(storage, scope) {
            (0, assert_1.strictEqual)(storage.isInMemory(), true);
            // Telemetry: added after init unless workspace/profile scoped
            if (scope === -1 /* StorageScope.APPLICATION */) {
                (0, assert_1.strictEqual)(storage.items.size, 0);
                await storage.init();
                (0, assert_1.strictEqual)(typeof storage.get(telemetry_1.firstSessionDateStorageKey), 'string');
                (0, assert_1.strictEqual)(typeof storage.get(telemetry_1.currentSessionDateStorageKey), 'string');
            }
            else {
                await storage.init();
            }
            let storageChangeEvent = undefined;
            disposables.add(storage.onDidChangeStorage(e => {
                storageChangeEvent = e;
            }));
            let storageDidClose = false;
            disposables.add(storage.onDidCloseStorage(() => storageDidClose = true));
            // Basic store/get/remove
            const size = storage.items.size;
            storage.set('bar', 'foo');
            (0, assert_1.strictEqual)(storageChangeEvent.key, 'bar');
            storage.set('barNumber', 55);
            storage.set('barBoolean', true);
            (0, assert_1.strictEqual)(storage.get('bar'), 'foo');
            (0, assert_1.strictEqual)(storage.get('barNumber'), '55');
            (0, assert_1.strictEqual)(storage.get('barBoolean'), 'true');
            (0, assert_1.strictEqual)(storage.items.size, size + 3);
            storage.delete('bar');
            (0, assert_1.strictEqual)(storage.get('bar'), undefined);
            (0, assert_1.strictEqual)(storage.items.size, size + 2);
            // IS_NEW
            (0, assert_1.strictEqual)(storage.get(storage_1.IS_NEW_KEY), 'true');
            // Close
            await storage.close();
            (0, assert_1.strictEqual)(storageDidClose, true);
        }
        teardown(() => {
            disposables.clear();
        });
        function createStorageService(lifecycleMainService = new workbenchTestServices_1.TestLifecycleMainService()) {
            const environmentService = new environmentService_1.NativeEnvironmentService((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), productService);
            const fileService = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const testStorageService = disposables.add(new TestStorageMainService(new log_1.NullLogService(), environmentService, disposables.add(new userDataProfile_1.UserDataProfilesMainService(disposables.add(new stateService_1.StateService(1 /* SaveStrategy.DELAYED */, environmentService, new log_1.NullLogService(), fileService)), disposables.add(uriIdentityService), environmentService, fileService, new log_1.NullLogService())), lifecycleMainService, fileService, uriIdentityService));
            disposables.add(testStorageService.applicationStorage);
            return testStorageService;
        }
        test('basics (application)', function () {
            const storageMainService = createStorageService();
            return testStorage(storageMainService.applicationStorage, -1 /* StorageScope.APPLICATION */);
        });
        test('basics (profile)', function () {
            const storageMainService = createStorageService();
            const profile = inMemoryProfile;
            return testStorage(storageMainService.profileStorage(profile), 0 /* StorageScope.PROFILE */);
        });
        test('basics (workspace)', function () {
            const workspace = { id: (0, uuid_1.generateUuid)() };
            const storageMainService = createStorageService();
            return testStorage(storageMainService.workspaceStorage(workspace), 1 /* StorageScope.WORKSPACE */);
        });
        test('storage closed onWillShutdown', async function () {
            const lifecycleMainService = new workbenchTestServices_1.TestLifecycleMainService();
            const storageMainService = createStorageService(lifecycleMainService);
            const profile = inMemoryProfile;
            const workspace = { id: (0, uuid_1.generateUuid)() };
            const workspaceStorage = storageMainService.workspaceStorage(workspace);
            let didCloseWorkspaceStorage = false;
            disposables.add(workspaceStorage.onDidCloseStorage(() => {
                didCloseWorkspaceStorage = true;
            }));
            const profileStorage = storageMainService.profileStorage(profile);
            let didCloseProfileStorage = false;
            disposables.add(profileStorage.onDidCloseStorage(() => {
                didCloseProfileStorage = true;
            }));
            const applicationStorage = storageMainService.applicationStorage;
            let didCloseApplicationStorage = false;
            disposables.add(applicationStorage.onDidCloseStorage(() => {
                didCloseApplicationStorage = true;
            }));
            (0, assert_1.strictEqual)(applicationStorage, storageMainService.applicationStorage); // same instance as long as not closed
            (0, assert_1.strictEqual)(profileStorage, storageMainService.profileStorage(profile)); // same instance as long as not closed
            (0, assert_1.strictEqual)(workspaceStorage, storageMainService.workspaceStorage(workspace)); // same instance as long as not closed
            await applicationStorage.init();
            await profileStorage.init();
            await workspaceStorage.init();
            await lifecycleMainService.fireOnWillShutdown();
            (0, assert_1.strictEqual)(didCloseApplicationStorage, true);
            (0, assert_1.strictEqual)(didCloseProfileStorage, true);
            (0, assert_1.strictEqual)(didCloseWorkspaceStorage, true);
            const profileStorage2 = storageMainService.profileStorage(profile);
            (0, assert_1.notStrictEqual)(profileStorage, profileStorage2);
            const workspaceStorage2 = storageMainService.workspaceStorage(workspace);
            (0, assert_1.notStrictEqual)(workspaceStorage, workspaceStorage2);
            await workspaceStorage2.close();
        });
        test('storage closed before init works', async function () {
            const storageMainService = createStorageService();
            const profile = inMemoryProfile;
            const workspace = { id: (0, uuid_1.generateUuid)() };
            const workspaceStorage = storageMainService.workspaceStorage(workspace);
            let didCloseWorkspaceStorage = false;
            disposables.add(workspaceStorage.onDidCloseStorage(() => {
                didCloseWorkspaceStorage = true;
            }));
            const profileStorage = storageMainService.profileStorage(profile);
            let didCloseProfileStorage = false;
            disposables.add(profileStorage.onDidCloseStorage(() => {
                didCloseProfileStorage = true;
            }));
            const applicationStorage = storageMainService.applicationStorage;
            let didCloseApplicationStorage = false;
            disposables.add(applicationStorage.onDidCloseStorage(() => {
                didCloseApplicationStorage = true;
            }));
            await applicationStorage.close();
            await profileStorage.close();
            await workspaceStorage.close();
            (0, assert_1.strictEqual)(didCloseApplicationStorage, true);
            (0, assert_1.strictEqual)(didCloseProfileStorage, true);
            (0, assert_1.strictEqual)(didCloseWorkspaceStorage, true);
        });
        test('storage closed before init awaits works', async function () {
            const storageMainService = createStorageService();
            const profile = inMemoryProfile;
            const workspace = { id: (0, uuid_1.generateUuid)() };
            const workspaceStorage = storageMainService.workspaceStorage(workspace);
            let didCloseWorkspaceStorage = false;
            disposables.add(workspaceStorage.onDidCloseStorage(() => {
                didCloseWorkspaceStorage = true;
            }));
            const profileStorage = storageMainService.profileStorage(profile);
            let didCloseProfileStorage = false;
            disposables.add(profileStorage.onDidCloseStorage(() => {
                didCloseProfileStorage = true;
            }));
            const applicationtorage = storageMainService.applicationStorage;
            let didCloseApplicationStorage = false;
            disposables.add(applicationtorage.onDidCloseStorage(() => {
                didCloseApplicationStorage = true;
            }));
            applicationtorage.init();
            profileStorage.init();
            workspaceStorage.init();
            await applicationtorage.close();
            await profileStorage.close();
            await workspaceStorage.close();
            (0, assert_1.strictEqual)(didCloseApplicationStorage, true);
            (0, assert_1.strictEqual)(didCloseProfileStorage, true);
            (0, assert_1.strictEqual)(didCloseWorkspaceStorage, true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZU1haW5TZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9zdG9yYWdlL3Rlc3QvZWxlY3Ryb24tbWFpbi9zdG9yYWdlTWFpblNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTBCaEcsS0FBSyxDQUFDLG9CQUFvQixFQUFFO1FBRTNCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLE1BQU0sY0FBYyxHQUFvQixFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsR0FBRyxpQkFBTyxFQUFFLENBQUM7UUFFakYsTUFBTSxtQkFBbUIsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDckYsTUFBTSxlQUFlLEdBQXFCO1lBQ3pDLEVBQUUsRUFBRSxJQUFJO1lBQ1IsSUFBSSxFQUFFLFVBQVU7WUFDaEIsU0FBUyxFQUFFLFVBQVU7WUFDckIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsUUFBUSxFQUFFLG1CQUFtQjtZQUM3QixpQkFBaUIsRUFBRSxJQUFBLG9CQUFRLEVBQUMsbUJBQW1CLEVBQUUsbUJBQW1CLENBQUM7WUFDckUsZ0JBQWdCLEVBQUUsSUFBQSxvQkFBUSxFQUFDLG1CQUFtQixFQUFFLGtCQUFrQixDQUFDO1lBQ25FLG1CQUFtQixFQUFFLElBQUEsb0JBQVEsRUFBQyxtQkFBbUIsRUFBRSxxQkFBcUIsQ0FBQztZQUN6RSxhQUFhLEVBQUUsSUFBQSxvQkFBUSxFQUFDLG1CQUFtQixFQUFFLGVBQWUsQ0FBQztZQUM3RCxZQUFZLEVBQUUsSUFBQSxvQkFBUSxFQUFDLG1CQUFtQixFQUFFLGNB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