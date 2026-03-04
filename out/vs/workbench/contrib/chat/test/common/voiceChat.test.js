/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/voiceChat", "vs/workbench/contrib/speech/common/speechService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, assert, cancellation_1, event_1, lifecycle_1, utils_1, chatAgents_1, voiceChat_1, speechService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('VoiceChat', () => {
        class TestChatAgentCommand {
            constructor(name, description) {
                this.name = name;
                this.description = description;
            }
        }
        class TestChatAgent {
            constructor(id, slashCommands) {
                this.id = id;
                this.slashCommands = slashCommands;
                this.extensionId = extensions_1.nullExtensionDescription.identifier;
                this.extensionPublisher = '';
                this.extensionDisplayName = '';
                this.extensionPublisherId = '';
                this.locations = [chatAgents_1.ChatAgentLocation.Panel];
                this.metadata = {};
                this.name = id;
            }
            invoke(request, progress, history, token) { throw new Error('Method not implemented.'); }
            provideWelcomeMessage(location, token) { throw new Error('Method not implemented.'); }
        }
        const agents = [
            new TestChatAgent('workspace', [
                new TestChatAgentCommand('fix', 'fix'),
                new TestChatAgentCommand('explain', 'explain')
            ]),
            new TestChatAgent('vscode', [
                new TestChatAgentCommand('search', 'search')
            ]),
        ];
        class TestChatAgentService {
            constructor() {
                this.onDidChangeAgents = event_1.Event.None;
            }
            registerAgentImplementation(id, agent) { throw new Error(); }
            registerDynamicAgent(data, agentImpl) { throw new Error('Method not implemented.'); }
            invokeAgent(id, request, progress, history, token) { throw new Error(); }
            getFollowups(id, request, result, history, token) { throw new Error(); }
            getActivatedAgents() { return agents; }
            getAgents() { return agents; }
            getDefaultAgent() { throw new Error(); }
            getContributedDefaultAgent() { throw new Error(); }
            getSecondaryAgent() { throw new Error(); }
            registerAgent(id, data) { throw new Error('Method not implemented.'); }
            getAgent(id) { throw new Error('Method not implemented.'); }
            getAgentsByName(name) { throw new Error('Method not implemented.'); }
            updateAgent(id, updateMetadata) { throw new Error('Method not implemented.'); }
        }
        class TestSpeechService {
            constructor() {
                this.onDidChangeHasSpeechProvider = event_1.Event.None;
                this.hasSpeechProvider = true;
                this.hasActiveSpeechToTextSession = false;
                this.hasActiveKeywordRecognition = false;
                this.onDidStartSpeechToTextSession = event_1.Event.None;
                this.onDidEndSpeechToTextSession = event_1.Event.None;
                this.onDidStartKeywordRecognition = event_1.Event.None;
                this.onDidEndKeywordRecognition = event_1.Event.None;
            }
            registerSpeechProvider(identifier, provider) { throw new Error('Method not implemented.'); }
            async createSpeechToTextSession(token) {
                return {
                    onDidChange: emitter.event
                };
            }
            recognizeKeyword(token) { throw new Error('Method not implemented.'); }
        }
        const disposables = new lifecycle_1.DisposableStore();
        let emitter;
        let service;
        let event;
        async function createSession(options) {
            const cts = new cancellation_1.CancellationTokenSource();
            disposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            const session = await service.createVoiceChatSession(cts.token, options);
            disposables.add(session.onDidChange(e => {
                event = e;
            }));
        }
        setup(() => {
            emitter = disposables.add(new event_1.Emitter());
            service = disposables.add(new voiceChat_1.VoiceChatService(new TestSpeechService(), new TestChatAgentService()));
        });
        teardown(() => {
            disposables.clear();
        });
        test('Agent and slash command detection (useAgents: false)', async () => {
            await testAgentsAndSlashCommandsDetection({ usesAgents: false, model: {} });
        });
        test('Agent and slash command detection (useAgents: true)', async () => {
            await testAgentsAndSlashCommandsDetection({ usesAgents: true, model: {} });
        });
        async function testAgentsAndSlashCommandsDetection(options) {
            // Nothing to detect
            await createSession(options);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Started });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Started);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'Hello' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, 'Hello');
            assert.strictEqual(event?.waitingForInput, undefined);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'Hello World' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, 'Hello World');
            assert.strictEqual(event?.waitingForInput, undefined);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'Hello World' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
            assert.strictEqual(event?.text, 'Hello World');
            assert.strictEqual(event?.waitingForInput, undefined);
            // Agent
            await createSession(options);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'At' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, 'At');
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'At workspace' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace' : 'At workspace');
            assert.strictEqual(event?.waitingForInput, options.usesAgents);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'at workspace' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace' : 'at workspace');
            assert.strictEqual(event?.waitingForInput, options.usesAgents);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'At workspace help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace help' : 'At workspace help');
            assert.strictEqual(event?.waitingForInput, false);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'At workspace help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace help' : 'At workspace help');
            assert.strictEqual(event?.waitingForInput, false);
            // Agent with punctuation
            await createSession(options);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'At workspace, help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace help' : 'At workspace, help');
            assert.strictEqual(event?.waitingForInput, false);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'At workspace, help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace help' : 'At workspace, help');
            assert.strictEqual(event?.waitingForInput, false);
            await createSession(options);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'At Workspace. help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace help' : 'At Workspace. help');
            assert.strictEqual(event?.waitingForInput, false);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'At Workspace. help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace help' : 'At Workspace. help');
            assert.strictEqual(event?.waitingForInput, false);
            // Slash Command
            await createSession(options);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'Slash fix' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace /fix' : '/fix');
            assert.strictEqual(event?.waitingForInput, true);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'Slash fix' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace /fix' : '/fix');
            assert.strictEqual(event?.waitingForInput, true);
            // Agent + Slash Command
            await createSession(options);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'At code slash search help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, options.usesAgents ? '@vscode /search help' : 'At code slash search help');
            assert.strictEqual(event?.waitingForInput, false);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'At code slash search help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
            assert.strictEqual(event?.text, options.usesAgents ? '@vscode /search help' : 'At code slash search help');
            assert.strictEqual(event?.waitingForInput, false);
            // Agent + Slash Command with punctuation
            await createSession(options);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'At code, slash search, help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, options.usesAgents ? '@vscode /search help' : 'At code, slash search, help');
            assert.strictEqual(event?.waitingForInput, false);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'At code, slash search, help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
            assert.strictEqual(event?.text, options.usesAgents ? '@vscode /search help' : 'At code, slash search, help');
            assert.strictEqual(event?.waitingForInput, false);
            await createSession(options);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'At code. slash, search help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, options.usesAgents ? '@vscode /search help' : 'At code. slash, search help');
            assert.strictEqual(event?.waitingForInput, false);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'At code. slash search, help' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
            assert.strictEqual(event?.text, options.usesAgents ? '@vscode /search help' : 'At code. slash search, help');
            assert.strictEqual(event?.waitingForInput, false);
            // Agent not detected twice
            await createSession(options);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'At workspace, for at workspace' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace for at workspace' : 'At workspace, for at workspace');
            assert.strictEqual(event?.waitingForInput, false);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'At workspace, for at workspace' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
            assert.strictEqual(event?.text, options.usesAgents ? '@workspace for at workspace' : 'At workspace, for at workspace');
            assert.strictEqual(event?.waitingForInput, false);
            // Slash command detected after agent recognized
            if (options.usesAgents) {
                await createSession(options);
                emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'At workspace' });
                assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
                assert.strictEqual(event?.text, '@workspace');
                assert.strictEqual(event?.waitingForInput, true);
                emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'slash' });
                assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
                assert.strictEqual(event?.text, 'slash');
                assert.strictEqual(event?.waitingForInput, false);
                emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'slash fix' });
                assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
                assert.strictEqual(event?.text, '/fix');
                assert.strictEqual(event?.waitingForInput, true);
                emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'slash fix' });
                assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
                assert.strictEqual(event?.text, '/fix');
                assert.strictEqual(event?.waitingForInput, true);
                await createSession(options);
                emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'At workspace' });
                assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
                assert.strictEqual(event?.text, '@workspace');
                assert.strictEqual(event?.waitingForInput, true);
                emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'slash fix' });
                assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
                assert.strictEqual(event?.text, '/fix');
                assert.strictEqual(event?.waitingForInput, true);
            }
        }
        test('waiting for input', async () => {
            // Agent
            await createSession({ usesAgents: true, model: {} });
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'At workspace' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, '@workspace');
            assert.strictEqual(event.waitingForInput, true);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'At workspace' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
            assert.strictEqual(event?.text, '@workspace');
            assert.strictEqual(event.waitingForInput, true);
            // Slash Command
            await createSession({ usesAgents: true, model: {} });
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognizing, text: 'At workspace slash explain' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognizing);
            assert.strictEqual(event?.text, '@workspace /explain');
            assert.strictEqual(event.waitingForInput, true);
            emitter.fire({ status: speechService_1.SpeechToTextStatus.Recognized, text: 'At workspace slash explain' });
            assert.strictEqual(event?.status, speechService_1.SpeechToTextStatus.Recognized);
            assert.strictEqual(event?.text, '@workspace /explain');
            assert.strictEqual(event.waitingForInput, true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidm9pY2VDaGF0LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L3Rlc3QvY29tbW9uL3ZvaWNlQ2hhdC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaUJoRyxLQUFLLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUV2QixNQUFNLG9CQUFvQjtZQUN6QixZQUFxQixJQUFZLEVBQVcsV0FBbUI7Z0JBQTFDLFNBQUksR0FBSixJQUFJLENBQVE7Z0JBQVcsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFBSSxDQUFDO1NBQ3BFO1FBRUQsTUFBTSxhQUFhO1lBUWxCLFlBQXFCLEVBQVUsRUFBVyxhQUFrQztnQkFBdkQsT0FBRSxHQUFGLEVBQUUsQ0FBUTtnQkFBVyxrQkFBYSxHQUFiLGFBQWEsQ0FBcUI7Z0JBTjVFLGdCQUFXLEdBQXdCLHFDQUF3QixDQUFDLFVBQVUsQ0FBQztnQkFDdkUsdUJBQWtCLEdBQUcsRUFBRSxDQUFDO2dCQUN4Qix5QkFBb0IsR0FBRyxFQUFFLENBQUM7Z0JBQzFCLHlCQUFvQixHQUFHLEVBQUUsQ0FBQztnQkFDMUIsY0FBUyxHQUF3QixDQUFDLDhCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQU8zRCxhQUFRLEdBQUcsRUFBRSxDQUFDO2dCQUpiLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLENBQUM7WUFDRCxNQUFNLENBQUMsT0FBMEIsRUFBRSxRQUF1QyxFQUFFLE9BQWlDLEVBQUUsS0FBd0IsSUFBK0IsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuTixxQkFBcUIsQ0FBRSxRQUEyQixFQUFFLEtBQXdCLElBQThELE1BQU0sSUFBSSxLQUFLLENBQUMseUJB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