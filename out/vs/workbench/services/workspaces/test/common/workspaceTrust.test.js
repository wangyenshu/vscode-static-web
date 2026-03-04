/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/mock", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/files/common/fileService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/common/memento", "vs/workbench/services/environment/common/environmentService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/workbench/test/common/workbenchTestServices", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, mock_1, configuration_1, testConfigurationService_1, fileService_1, instantiationServiceMock_1, log_1, remoteAuthorityResolver_1, storage_1, workspace_1, workspaceTrust_1, testWorkspace_1, memento_1, environmentService_1, uriIdentity_1, uriIdentityService_1, workspaceTrust_2, workbenchTestServices_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workspace Trust', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let configurationService;
        let environmentService;
        setup(async () => {
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            configurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            environmentService = {};
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, environmentService);
            const fileService = store.add(new fileService_1.FileService(new log_1.NullLogService()));
            const uriIdentityService = store.add(new uriIdentityService_1.UriIdentityService(fileService));
            instantiationService.stub(uriIdentity_1.IUriIdentityService, uriIdentityService);
            instantiationService.stub(remoteAuthorityResolver_1.IRemoteAuthorityResolverService, new class extends (0, mock_1.mock)() {
            });
        });
        suite('Enablement', () => {
            test('workspace trust enabled', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                const testObject = store.add(instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustEnablementService));
                assert.strictEqual(testObject.isWorkspaceTrustEnabled(), true);
            });
            test('workspace trust disabled (user setting)', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(false, true));
                const testObject = store.add(instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustEnablementService));
                assert.strictEqual(testObject.isWorkspaceTrustEnabled(), false);
            });
            test('workspace trust disabled (--disable-workspace-trust)', () => {
                instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { ...environmentService, disableWorkspaceTrust: true });
                const testObject = store.add(instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustEnablementService));
                assert.strictEqual(testObject.isWorkspaceTrustEnabled(), false);
            });
        });
        suite('Management', () => {
            let storageService;
            let workspaceService;
            teardown(() => {
                memento_1.Memento.clear(1 /* StorageScope.WORKSPACE */);
            });
            setup(() => {
                storageService = store.add(new workbenchTestServices_1.TestStorageService());
                instantiationService.stub(storage_1.IStorageService, storageService);
                workspaceService = new workbenchTestServices_1.TestContextService();
                instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new workbenchTestServices_1.TestWorkspaceTrustEnablementService());
            });
            test('empty workspace - trusted', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                const testObject = await initializeTestObject();
                assert.strictEqual(true, testObject.isWorkspaceTrusted());
            });
            test('empty workspace - untrusted', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, false));
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                const testObject = await initializeTestObject();
                assert.strictEqual(false, testObject.isWorkspaceTrusted());
            });
            test('empty workspace - trusted, open trusted file', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                const trustInfo = { uriTrustInfo: [{ uri: uri_1.URI.parse('file:///Folder'), trusted: true }] };
                storageService.store(workspaceTrust_2.WORKSPACE_TRUST_STORAGE_KEY, JSON.stringify(trustInfo), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                environmentService.filesToOpenOrCreate = [{ fileUri: uri_1.URI.parse('file:///Folder/file.txt') }];
                instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { ...environmentService });
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                const testObject = await initializeTestObject();
                assert.strictEqual(true, testObject.isWorkspaceTrusted());
            });
            test('empty workspace - trusted, open untrusted file', async () => {
                await configurationService.setUserConfiguration('security', getUserSettings(true, true));
                environmentService.filesToOpenOrCreate = [{ fileUri: uri_1.URI.parse('file:///Folder/foo.txt') }];
                instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { ...environmentService });
                workspaceService.setWorkspace(new testWorkspace_1.Workspace('empty-workspace'));
                const testObject = await initializeTestObject();
                assert.strictEqual(false, testObject.isWorkspaceTrusted());
            });
            async function initializeTestObject() {
                const workspaceTrustManagementService = store.add(instantiationService.createInstance(workspaceTrust_2.WorkspaceTrustManagementService));
                await workspaceTrustManagementService.workspaceTrustInitialized;
                return workspaceTrustManagementService;
            }
        });
        function getUserSettings(enabled, emptyWindow) {
            return { workspace: { trust: { emptyWindow, enabled } } };
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVHJ1c3QudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3Jrc3BhY2VzL3Rlc3QvY29tbW9uL3dvcmtzcGFjZVRydXN0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF1QmhHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDN0IsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELElBQUksb0JBQThDLENBQUM7UUFDbkQsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLGtCQUFnRCxDQUFDO1FBRXJELEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNoQixvQkFBb0IsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksbURBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBRWpFLG9CQUFvQixHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUN0RCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMscUNBQXFCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUV2RSxrQkFBa0IsR0FBRyxFQUFrQyxDQUFDO1lBQ3hELG9CQUFvQixDQUFDLElBQUksQ0FBQyxpREFBNEIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBRTVFLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSx5QkFBVyxDQUFDLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBRTFFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQ0FBbUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lB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