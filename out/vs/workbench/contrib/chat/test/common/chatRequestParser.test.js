/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/test/common/mock", "vs/base/test/common/snapshot", "vs/base/test/common/utils", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatRequestParser", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/test/common/mockChatService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, mock_1, snapshot_1, utils_1, contextkey_1, instantiationServiceMock_1, mockKeybindingService_1, log_1, storage_1, chatAgents_1, chatRequestParser_1, chatService_1, chatSlashCommands_1, chatVariables_1, mockChatService_1, extensions_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ChatRequestParser', () => {
        const testDisposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let parser;
        let varService;
        setup(async () => {
            instantiationService = testDisposables.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(storage_1.IStorageService, testDisposables.add(new workbenchTestServices_1.TestStorageService()));
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(extensions_1.IExtensionService, new workbenchTestServices_1.TestExtensionService());
            instantiationService.stub(chatService_1.IChatService, new mockChatService_1.MockChatService());
            instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
            instantiationService.stub(chatAgents_1.IChatAgentService, instantiationService.createInstance(chatAgents_1.ChatAgentService));
            varService = (0, mock_1.mockObject)()({});
            varService.getDynamicVariables.returns([]);
            instantiationService.stub(chatVariables_1.IChatVariablesService, varService);
        });
        test('plain text', async () => {
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', 'test');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('plain text with newlines', async () => {
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = 'line 1\nline 2\r\nline 3';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('slash command', async () => {
            const slashCommandService = (0, mock_1.mockObject)()({});
            slashCommandService.getCommands.returns([{ command: 'fix' }]);
            instantiationService.stub(chatSlashCommands_1.IChatSlashCommandService, slashCommandService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = '/fix this';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('invalid slash command', async () => {
            const slashCommandService = (0, mock_1.mockObject)()({});
            slashCommandService.getCommands.returns([{ command: 'fix' }]);
            instantiationService.stub(chatSlashCommands_1.IChatSlashCommandService, slashCommandService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = '/explain this';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('multiple slash commands', async () => {
            const slashCommandService = (0, mock_1.mockObject)()({});
            slashCommandService.getCommands.returns([{ command: 'fix' }]);
            instantiationService.stub(chatSlashCommands_1.IChatSlashCommandService, slashCommandService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = '/fix /fix';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('variables', async () => {
            varService.hasVariable.returns(true);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = 'What does #selection mean?';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('variable with question mark', async () => {
            varService.hasVariable.returns(true);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = 'What is #selection?';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('invalid variables', async () => {
            varService.hasVariable.returns(false);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = 'What does #selection mean?';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        const getAgentWithSlashCommands = (slashCommands) => {
            return { id: 'agent', name: 'agent', extensionId: extensions_1.nullExtensionDescription.identifier, extensionPublisherDisplayName: '', extensionDisplayName: '', extensionPublisherId: '', locations: [chatAgents_1.ChatAgentLocation.Panel], metadata: {}, slashCommands };
        };
        test('agent with subcommand after text', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '@agent Please do /subCommand thanks');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agents, subCommand', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '@agent /subCommand Please do thanks');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agent with question mark', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '@agent? Are you there');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agent and subcommand with leading whitespace', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '    \r\n\t   @agent \r\n\t   /subCommand Thanks');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agent and subcommand after newline', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '    \n@agent\n/subCommand Thanks');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agent not first', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', 'Hello Mr. @agent');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agents and variables and multiline', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            varService.hasVariable.returns(true);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '@agent /subCommand \nPlease do with #selection\nand #debugConsole');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agents and variables and multiline, part2', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            varService.hasVariable.returns(true);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '@agent Please \ndo /subCommand with #selection\nand #debugConsole');
            await (0, snapshot_1.assertSnapshot)(result);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFJlcXVlc3RQYXJzZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvdGVzdC9jb21tb24vY2hhdFJlcXVlc3RQYXJzZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW1CaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUMvQixNQUFNLGVBQWUsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFbEUsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLE1BQXlCLENBQUM7UUFFOUIsSUFBSSxVQUE2QyxDQUFDO1FBQ2xELEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNoQixvQkFBb0IsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksbURBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBQzNFLG9CQUFvQixDQUFDLElBQUksQ0FBQyx5QkFBZSxFQUFFLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSwwQ0FBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUJBQVcsRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxDQUFDO1lBQzdELG9CQUFvQixDQUFDLElBQUksQ0FBQyw4QkFBaUIsRUFBRSxJQUFJLDRDQUFvQixFQUFFLENBQUMsQ0FBQztZQUN6RSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMEJBQVksRUFBRSxJQUFJLGlDQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELG9CQUFvQixDQUFDLElBQUksQ0FBQywrQkFBa0IsRUFBRSxJQUFJLDZDQUFxQixFQUFFLENBQUMsQ0FBQztZQUMzRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsOEJBQWlCLEVBQUUsb0JBQW9CLENBQUMsY0FBYyxD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