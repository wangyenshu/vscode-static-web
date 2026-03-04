/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/tasksSync", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, buffer_1, timeTravelScheduler_1, utils_1, files_1, log_1, userDataProfile_1, tasksSync_1, userDataSync_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TasksSync', () => {
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let client;
        let testObject;
        teardown(async () => {
            await client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).clear();
        });
        const disposableStore = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async () => {
            client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client.setUp(true);
            testObject = client.getSynchronizer("tasks" /* SyncResource.Tasks */);
        });
        test('when tasks file does not exist', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                assert.deepStrictEqual(await testObject.getLastSyncUserData(), null);
                let manifest = await client.getResourceManifest();
                server.reset();
                await testObject.sync(manifest);
                assert.deepStrictEqual(server.requests, [
                    { type: 'GET', url: `${server.url}/v1/resource/${testObject.resource}/latest`, headers: {} },
                ]);
                assert.ok(!await fileService.exists(tasksResource));
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
                assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
                assert.strictEqual(lastSyncUserData.syncData, null);
                manifest = await client.getResourceManifest();
                server.reset();
                await testObject.sync(manifest);
                assert.deepStrictEqual(server.requests, []);
                manifest = await client.getResourceManifest();
                server.reset();
                await testObject.sync(manifest);
                assert.deepStrictEqual(server.requests, []);
            });
        });
        test('when tasks file does not exist and remote has changes', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
                await client2.setUp(true);
                const content = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                });
                const tasksResource2 = client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await client2.instantiationService.get(files_1.IFileService).writeFile(tasksResource2, buffer_1.VSBuffer.fromString(content));
                await client2.sync();
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await testObject.sync(await client.getResourceManifest());
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
            });
        });
        test('when tasks file exists locally and remote has no tasks', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                const content = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                });
                fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
                await testObject.sync(await client.getResourceManifest());
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            });
        });
        test('first time sync: when tasks file exists locally with same content as remote', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
                await client2.setUp(true);
                const content = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                });
                const tasksResource2 = client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await client2.instantiationService.get(files_1.IFileService).writeFile(tasksResource2, buffer_1.VSBuffer.fromString(content));
                await client2.sync();
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
                await testObject.sync(await client.getResourceManifest());
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
            });
        });
        test('when tasks file locally has moved forward', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': []
                })));
                await testObject.sync(await client.getResourceManifest());
                const content = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                });
                fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
                await testObject.sync(await client.getResourceManifest());
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            });
        });
        test('when tasks file remotely has moved forward', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
                await client2.setUp(true);
                const tasksResource2 = client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                const fileService2 = client2.instantiationService.get(files_1.IFileService);
                await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': []
                })));
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await client2.sync();
                await testObject.sync(await client.getResourceManifest());
                const content = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                });
                fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(content));
                await client2.sync();
                await testObject.sync(await client.getResourceManifest());
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
            });
        });
        test('when tasks file has moved forward locally and remotely with same changes', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
                await client2.setUp(true);
                const tasksResource2 = client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                const fileService2 = client2.instantiationService.get(files_1.IFileService);
                await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': []
                })));
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await client2.sync();
                await testObject.sync(await client.getResourceManifest());
                const content = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                });
                fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(content));
                await client2.sync();
                fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
                await testObject.sync(await client.getResourceManifest());
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
            });
        });
        test('when tasks file has moved forward locally and remotely - accept preview', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
                await client2.setUp(true);
                const tasksResource2 = client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                const fileService2 = client2.instantiationService.get(files_1.IFileService);
                await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': []
                })));
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await client2.sync();
                await testObject.sync(await client.getResourceManifest());
                fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                        }]
                })));
                await client2.sync();
                const content = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                });
                fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
                await testObject.sync(await client.getResourceManifest());
                const previewContent = (await fileService.readFile(testObject.conflicts.conflicts[0].previewResource)).value.toString();
                assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
                assert.deepStrictEqual(testObject.conflicts.conflicts.length, 1);
                assert.deepStrictEqual(testObject.conflicts.conflicts[0].mergeState, "conflict" /* MergeState.Conflict */);
                assert.deepStrictEqual(testObject.conflicts.conflicts[0].localChange, 2 /* Change.Modified */);
                assert.deepStrictEqual(testObject.conflicts.conflicts[0].remoteChange, 2 /* Change.Modified */);
                await testObject.accept(testObject.conflicts.conflicts[0].previewResource);
                await testObject.apply(false);
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), previewContent);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), previewContent);
                assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), previewContent);
            });
        });
        test('when tasks file has moved forward locally and remotely - accept modified preview', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
                await client2.setUp(true);
                const tasksResource2 = client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                const fileService2 = client2.instantiationService.get(files_1.IFileService);
                await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': []
                })));
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await client2.sync();
                await testObject.sync(await client.getResourceManifest());
                fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                        }]
                })));
                await client2.sync();
                fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                })));
                await testObject.sync(await client.getResourceManifest());
                const content = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch 2'
                        }]
                });
                await testObject.accept(testObject.conflicts.conflicts[0].previewResource, content);
                await testObject.apply(false);
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
            });
        });
        test('when tasks file has moved forward locally and remotely - accept remote', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
                await client2.setUp(true);
                const tasksResource2 = client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                const fileService2 = client2.instantiationService.get(files_1.IFileService);
                await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': []
                })));
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await client2.sync();
                await testObject.sync(await client.getResourceManifest());
                const content = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                        }]
                });
                fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(content));
                await client2.sync();
                fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                })));
                await testObject.sync(await client.getResourceManifest());
                assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
                await testObject.accept(testObject.conflicts.conflicts[0].remoteResource);
                await testObject.apply(false);
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
            });
        });
        test('when tasks file has moved forward locally and remotely - accept local', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
                await client2.setUp(true);
                const tasksResource2 = client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                const fileService2 = client2.instantiationService.get(files_1.IFileService);
                await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': []
                })));
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await client2.sync();
                await testObject.sync(await client.getResourceManifest());
                fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                        }]
                })));
                await client2.sync();
                const content = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                });
                fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
                await testObject.sync(await client.getResourceManifest());
                assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
                await testObject.accept(testObject.conflicts.conflicts[0].localResource);
                await testObject.apply(false);
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
                assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
            });
        });
        test('when tasks file was removed in one client', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(JSON.stringify({
                    'version': '2.0.0',
                    'tasks': []
                })));
                await testObject.sync(await client.getResourceManifest());
                const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
                await client2.setUp(true);
                await client2.sync();
                const tasksResource2 = client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                const fileService2 = client2.instantiationService.get(files_1.IFileService);
                fileService2.del(tasksResource2);
                await client2.sync();
                await testObject.sync(await client.getResourceManifest());
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
                const lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), null);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), null);
                assert.strictEqual(await fileService.exists(tasksResource), false);
            });
        });
        test('when tasks file is created after first sync', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                await testObject.sync(await client.getResourceManifest());
                const content = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                });
                await fileService.createFile(tasksResource, buffer_1.VSBuffer.fromString(content));
                let lastSyncUserData = await testObject.getLastSyncUserData();
                const manifest = await client.getResourceManifest();
                server.reset();
                await testObject.sync(manifest);
                assert.deepStrictEqual(server.requests, [
                    { type: 'POST', url: `${server.url}/v1/resource/${testObject.resource}`, headers: { 'If-Match': lastSyncUserData?.ref } },
                ]);
                lastSyncUserData = await testObject.getLastSyncUserData();
                const remoteUserData = await testObject.getRemoteUserData(null);
                assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
                assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
                assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            });
        });
        test('apply remote when tasks file does not exist', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const fileService = client.instantiationService.get(files_1.IFileService);
                const tasksResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.tasksResource;
                if (await fileService.exists(tasksResource)) {
                    await fileService.del(tasksResource);
                }
                const preview = (await testObject.preview(await client.getResourceManifest(), {}));
                server.reset();
                const content = await testObject.resolveContent(preview.resourcePreviews[0].remoteResource);
                await testObject.accept(preview.resourcePreviews[0].remoteResource, content);
                await testObject.apply(false);
                assert.deepStrictEqual(server.requests, []);
            });
        });
        test('sync profile tasks', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
                await client2.setUp(true);
                const profile = await client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).createNamedProfile('profile1');
                const expected = JSON.stringify({
                    'version': '2.0.0',
                    'tasks': [{
                            'type': 'npm',
                            'script': 'watch',
                            'label': 'Watch'
                        }]
                });
                await client2.instantiationService.get(files_1.IFileService).createFile(profile.tasksResource, buffer_1.VSBuffer.fromString(expected));
                await client2.sync();
                await client.sync();
                const syncedProfile = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).profiles.find(p => p.id === profile.id);
                const actual = (await client.instantiationService.get(files_1.IFileService).readFile(syncedProfile.tasksResource)).value.toString();
                assert.strictEqual(actual, expected);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza3NTeW5jLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvdGVzdC9jb21tb24vdGFza3NTeW5jLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7UUFFdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBc0IsRUFBRSxDQUFDO1FBQzVDLElBQUksTUFBMEIsQ0FBQztRQUUvQixJQUFJLFVBQTZCLENBQUM7UUFFbEMsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ25CLE1BQU0sTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx3Q0FBeUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzFFLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxlQUFlLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRWxFLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNoQixNQUFNLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDN0QsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pCLFVBQVUsR0FBRyxNQUFNLENBQUMsZUFBZSxrQ0FBeUMsQ0FBQztRQUM5RSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqRCxNQUFNLElBQUEsd0NBQWtCLEVBQU8sRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUM3QyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLG9CQUFZLENBQUMsQ0FBQztnQkFD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