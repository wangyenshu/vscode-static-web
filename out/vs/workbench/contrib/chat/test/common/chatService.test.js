/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/uri", "vs/base/test/common/snapshot", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatServiceImpl", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/test/common/mockChatService", "vs/workbench/contrib/chat/test/common/mockChatVariables", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/views/common/viewsService", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, cancellation_1, uri_1, snapshot_1, utils_1, range_1, contextkey_1, serviceCollection_1, instantiationServiceMock_1, mockKeybindingService_1, log_1, storage_1, telemetry_1, telemetryUtils_1, workspace_1, chatAgents_1, chatService_1, chatServiceImpl_1, chatSlashCommands_1, chatVariables_1, mockChatService_1, mockChatVariables_1, extensions_1, viewsService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const chatAgentWithUsedContextId = 'ChatProviderWithUsedContext';
    const chatAgentWithUsedContext = {
        id: chatAgentWithUsedContextId,
        name: chatAgentWithUsedContextId,
        extensionId: extensions_1.nullExtensionDescription.identifier,
        extensionPublisherDisplayName: '',
        extensionPublisherId: '',
        extensionDisplayName: '',
        locations: [chatAgents_1.ChatAgentLocation.Panel],
        metadata: {},
        slashCommands: [],
        async invoke(request, progress, history, token) {
            progress({
                documents: [
                    {
                        uri: uri_1.URI.file('/test/path/to/file'),
                        version: 3,
                        ranges: [
                            new range_1.Range(1, 1, 2, 2)
                        ]
                    }
                ],
                kind: 'usedContext'
            });
            return { metadata: { metadataKey: 'value' } };
        },
        async provideFollowups(sessionId, token) {
            return [{ kind: 'reply', message: 'Something else', agentId: '', tooltip: 'a tooltip' }];
        },
    };
    suite('ChatService', () => {
        const testDisposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let storageService;
        let instantiationService;
        let chatAgentService;
        setup(async () => {
            instantiationService = testDisposables.add(new instantiationServiceMock_1.TestInstantiationService(new serviceCollection_1.ServiceCollection([chatVariables_1.IChatVariablesService, new mockChatVariables_1.MockChatVariablesService()])));
            instantiationService.stub(storage_1.IStorageService, storageService = testDisposables.add(new workbenchTestServices_1.TestStorageService()));
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(extensions_1.IExtensionService, new workbenchTestServices_1.TestExtensionService());
            instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
            instantiationService.stub(viewsService_1.IViewsService, new workbenchTestServices_1.TestExtensionService());
            instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
            instantiationService.stub(chatSlashCommands_1.IChatSlashCommandService, testDisposables.add(instantiationService.createInstance(chatSlashCommands_1.ChatSlashCommandService)));
            instantiationService.stub(chatService_1.IChatService, new mockChatService_1.MockChatService());
            chatAgentService = instantiationService.createInstance(chatAgents_1.ChatAgentService);
            instantiationService.stub(chatAgents_1.IChatAgentService, chatAgentService);
            const agent = {
                async invoke(request, progress, history, token) {
                    return {};
                },
            };
            testDisposables.add(chatAgentService.registerAgent('testAgent', { name: 'testAgent', id: 'testAgent', isDefault: true, extensionId: extensions_1.nullExtensionDescription.identifier, extensionPublisherId: '', extensionPublisherDisplayName: '', extensionDisplayName: '', locations: [chatAgents_1.ChatAgentLocation.Panel], metadata: {}, slashCommands: [] }));
            testDisposables.add(chatAgentService.registerAgent(chatAgentWithUsedContextId, { name: chatAgentWithUsedContextId, id: chatAgentWithUsedContextId, extensionId: extensions_1.nullExtensionDescription.identifier, extensionPublisherId: '', extensionPublisherDisplayName: '', extensionDisplayName: '', locations: [chatAgents_1.ChatAgentLocation.Panel], metadata: {}, slashCommands: [] }));
            testDisposables.add(chatAgentService.registerAgentImplementation('testAgent', agent));
            chatAgentService.updateAgent('testAgent', { requester: { name: 'test' }, fullName: 'test' });
        });
        test('retrieveSession', async () => {
            const testService = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            const session1 = testDisposables.add(testService.startSession(chatAgents_1.ChatAgentLocation.Panel, cancellation_1.CancellationToken.None));
            await session1.waitForInitialization();
            session1.addRequest({ parts: [], text: 'request 1' }, { variables: [] }, 0);
            const session2 = testDisposables.add(testService.startSession(chatAgents_1.ChatAgentLocation.Panel, cancellation_1.CancellationToken.None));
            await session2.waitForInitialization();
            session2.addRequest({ parts: [], text: 'request 2' }, { variables: [] }, 0);
            storageService.flush();
            const testService2 = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            const retrieved1 = testDisposables.add(testService2.getOrRestoreSession(session1.sessionId));
            await retrieved1.waitForInitialization();
            const retrieved2 = testDisposables.add(testService2.getOrRestoreSession(session2.sessionId));
            await retrieved2.waitForInitialization();
            assert.deepStrictEqual(retrieved1.getRequests()[0]?.message.text, 'request 1');
            assert.deepStrictEqual(retrieved2.getRequests()[0]?.message.text, 'request 2');
        });
        test('addCompleteRequest', async () => {
            const testService = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            const model = testDisposables.add(testService.startSession(chatAgents_1.ChatAgentLocation.Panel, cancellation_1.CancellationToken.None));
            assert.strictEqual(model.getRequests().length, 0);
            await testService.addCompleteRequest(model.sessionId, 'test request', undefined, 0, { message: 'test response' });
            assert.strictEqual(model.getRequests().length, 1);
            assert.ok(model.getRequests()[0].response);
            assert.strictEqual(model.getRequests()[0].response?.response.asString(), 'test response');
        });
        test('can serialize', async () => {
            testDisposables.add(chatAgentService.registerAgentImplementation(chatAgentWithUsedContextId, chatAgentWithUsedContext));
            chatAgentService.updateAgent(chatAgentWithUsedContextId, { requester: { name: 'test' }, fullName: 'test' });
            const testService = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            const model = testDisposables.add(testService.startSession(chatAgents_1.ChatAgentLocation.Panel, cancellation_1.CancellationToken.None));
            assert.strictEqual(model.getRequests().length, 0);
            await (0, snapshot_1.assertSnapshot)(model.toExport());
            const response = await testService.sendRequest(model.sessionId, `@${chatAgentWithUsedContextId} test request`);
            assert(response);
            await response.responseCompletePromise;
            assert.strictEqual(model.getRequests().length, 1);
            await (0, snapshot_1.assertSnapshot)(model.toExport());
        });
        test('can deserialize', async () => {
            let serializedChatData;
            testDisposables.add(chatAgentService.registerAgentImplementation(chatAgentWithUsedContextId, chatAgentWithUsedContext));
            // create the first service, send request, get response, and serialize the state
            { // serapate block to not leak variables in outer scope
                const testService = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
                const chatModel1 = testDisposables.add(testService.startSession(chatAgents_1.ChatAgentLocation.Panel, cancellation_1.CancellationToken.None));
                assert.strictEqual(chatModel1.getRequests().length, 0);
                const response = await testService.sendRequest(chatModel1.sessionId, `@${chatAgentWithUsedContextId} test request`);
                assert(response);
                await response.responseCompletePromise;
                serializedChatData = JSON.parse(JSON.stringify(chatModel1));
            }
            // try deserializing the state into a new service
            const testService2 = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            const chatModel2 = testService2.loadSessionFromContent(serializedChatData);
            assert(chatModel2);
            await (0, snapshot_1.assertSnapshot)(chatModel2.toExport());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvdGVzdC9jb21tb24vY2hhdFNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTZCaEcsTUFBTSwwQkFBMEIsR0FBRyw2QkFBNkIsQ0FBQztJQUNqRSxNQUFNLHdCQUF3QixHQUFlO1FBQzVDLEVBQUUsRUFBRSwwQkFBMEI7UUFDOUIsSUFBSSxFQUFFLDBCQUEwQjtRQUNoQyxXQUFXLEVBQUUscUNBQXdCLENBQUMsVUFBVTtRQUNoRCw2QkFBNkIsRUFBRSxFQUFFO1FBQ2pDLG9CQUFvQixFQUFFLEVBQUU7UUFDeEIsb0JBQW9CLEVBQUUsRUFBRTtRQUN4QixTQUFTLEVBQUUsQ0FBQyw4QkFBaUIsQ0FBQyxLQUFLLENBQUM7UUFDcEMsUUFBUSxFQUFFLEVBQUU7UUFDWixhQUFhLEVBQUUsRUFBRTtRQUNqQixLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUs7WUFDN0MsUUFBUSxDQUFDO2dCQUNSLFNBQVMsRUFBRTtvQkFDVjt3QkFDQyxHQUFHLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQzt3QkFDbkMsT0FBTyxFQUFFLENBQUM7d0JBQ1YsTUFBTSxFQUFFOzRCQUNQLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzt5QkFDckI7cUJBQ0Q7aUJBQ0Q7Z0JBQ0QsSUFBSSxFQUFFLGFBQWE7YUFDbkIsQ0FBQyxDQUFDO1lBRUgsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDO1FBQy9DLENBQUM7UUFDRCxL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