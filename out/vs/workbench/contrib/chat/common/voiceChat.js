/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/speech/common/speechService"], function (require, exports, event_1, lifecycle_1, strings_1, instantiation_1, chatAgents_1, chatParserTypes_1, speechService_1) {
    "use strict";
    var VoiceChatService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VoiceChatService = exports.IVoiceChatService = void 0;
    exports.IVoiceChatService = (0, instantiation_1.createDecorator)('voiceChatService');
    var PhraseTextType;
    (function (PhraseTextType) {
        PhraseTextType[PhraseTextType["AGENT"] = 1] = "AGENT";
        PhraseTextType[PhraseTextType["COMMAND"] = 2] = "COMMAND";
        PhraseTextType[PhraseTextType["AGENT_AND_COMMAND"] = 3] = "AGENT_AND_COMMAND";
    })(PhraseTextType || (PhraseTextType = {}));
    let VoiceChatService = class VoiceChatService extends lifecycle_1.Disposable {
        static { VoiceChatService_1 = this; }
        static { this.AGENT_PREFIX = chatParserTypes_1.chatAgentLeader; }
        static { this.COMMAND_PREFIX = chatParserTypes_1.chatSubcommandLeader; }
        static { this.PHRASES_LOWER = {
            [VoiceChatService_1.AGENT_PREFIX]: 'at',
            [VoiceChatService_1.COMMAND_PREFIX]: 'slash'
        }; }
        static { this.PHRASES_UPPER = {
            [VoiceChatService_1.AGENT_PREFIX]: 'At',
            [VoiceChatService_1.COMMAND_PREFIX]: 'Slash'
        }; }
        static { this.CHAT_AGENT_ALIAS = new Map([['vscode', 'code']]); }
        constructor(speechService, chatAgentService) {
            super();
            this.speechService = speechService;
            this.chatAgentService = chatAgentService;
        }
        createPhrases(model) {
            const phrases = new Map();
            for (const agent of this.chatAgentService.getActivatedAgents()) {
                const agentPhrase = `${VoiceChatService_1.PHRASES_LOWER[VoiceChatService_1.AGENT_PREFIX]} ${VoiceChatService_1.CHAT_AGENT_ALIAS.get(agent.name) ?? agent.name}`.toLowerCase();
                phrases.set(agentPhrase, { agent: agent.name });
                for (const slashCommand of agent.slashCommands) {
                    const slashCommandPhrase = `${VoiceChatService_1.PHRASES_LOWER[VoiceChatService_1.COMMAND_PREFIX]} ${slashCommand.name}`.toLowerCase();
                    phrases.set(slashCommandPhrase, { agent: agent.name, command: slashCommand.name });
                    const agentSlashCommandPhrase = `${agentPhrase} ${slashCommandPhrase}`.toLowerCase();
                    phrases.set(agentSlashCommandPhrase, { agent: agent.name, command: slashCommand.name });
                }
            }
            return phrases;
        }
        toText(value, type) {
            switch (type) {
                case PhraseTextType.AGENT:
                    return `${VoiceChatService_1.AGENT_PREFIX}${value.agent}`;
                case PhraseTextType.COMMAND:
                    return `${VoiceChatService_1.COMMAND_PREFIX}${value.command}`;
                case PhraseTextType.AGENT_AND_COMMAND:
                    return `${VoiceChatService_1.AGENT_PREFIX}${value.agent} ${VoiceChatService_1.COMMAND_PREFIX}${value.command}`;
            }
        }
        async createVoiceChatSession(token, options) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(token.onCancellationRequested(() => disposables.dispose()));
            let detectedAgent = false;
            let detectedSlashCommand = false;
            const emitter = disposables.add(new event_1.Emitter());
            const session = await this.speechService.createSpeechToTextSession(token, 'chat');
            const phrases = this.createPhrases(options.model);
            disposables.add(session.onDidChange(e => {
                switch (e.status) {
                    case speechService_1.SpeechToTextStatus.Recognizing:
                    case speechService_1.SpeechToTextStatus.Recognized:
                        if (e.text) {
                            const startsWithAgent = e.text.startsWith(VoiceChatService_1.PHRASES_UPPER[VoiceChatService_1.AGENT_PREFIX]) || e.text.startsWith(VoiceChatService_1.PHRASES_LOWER[VoiceChatService_1.AGENT_PREFIX]);
                            const startsWithSlashCommand = e.text.startsWith(VoiceChatService_1.PHRASES_UPPER[VoiceChatService_1.COMMAND_PREFIX]) || e.text.startsWith(VoiceChatService_1.PHRASES_LOWER[VoiceChatService_1.COMMAND_PREFIX]);
                            if (startsWithAgent || startsWithSlashCommand) {
                                const originalWords = e.text.split(' ');
                                let transformedWords;
                                let waitingForInput = false;
                                // Check for agent + slash command
                                if (options.usesAgents && startsWithAgent && !detectedAgent && !detectedSlashCommand && originalWords.length >= 4) {
                                    const phrase = phrases.get(originalWords.slice(0, 4).map(word => this.normalizeWord(word)).join(' '));
                                    if (phrase) {
                                        transformedWords = [this.toText(phrase, PhraseTextType.AGENT_AND_COMMAND), ...originalWords.slice(4)];
                                        waitingForInput = originalWords.length === 4;
                                        if (e.status === speechService_1.SpeechToTextStatus.Recognized) {
                                            detectedAgent = true;
                                            detectedSlashCommand = true;
                                        }
                                    }
                                }
                                // Check for agent (if not done already)
                                if (options.usesAgents && startsWithAgent && !detectedAgent && !transformedWords && originalWords.length >= 2) {
                                    const phrase = phrases.get(originalWords.slice(0, 2).map(word => this.normalizeWord(word)).join(' '));
                                    if (phrase) {
                                        transformedWords = [this.toText(phrase, PhraseTextType.AGENT), ...originalWords.slice(2)];
                                        waitingForInput = originalWords.length === 2;
                                        if (e.status === speechService_1.SpeechToTextStatus.Recognized) {
                                            detectedAgent = true;
                                        }
                                    }
                                }
                                // Check for slash command (if not done already)
                                if (startsWithSlashCommand && !detectedSlashCommand && !transformedWords && originalWords.length >= 2) {
                                    const phrase = phrases.get(originalWords.slice(0, 2).map(word => this.normalizeWord(word)).join(' '));
                                    if (phrase) {
                                        transformedWords = [this.toText(phrase, options.usesAgents && !detectedAgent ?
                                                PhraseTextType.AGENT_AND_COMMAND : // rewrite `/fix` to `@workspace /foo` in this case
                                                PhraseTextType.COMMAND // when we have not yet detected an agent before
                                            ), ...originalWords.slice(2)];
                                        waitingForInput = originalWords.length === 2;
                                        if (e.status === speechService_1.SpeechToTextStatus.Recognized) {
                                            detectedSlashCommand = true;
                                        }
                                    }
                                }
                                emitter.fire({
                                    status: e.status,
                                    text: (transformedWords ?? originalWords).join(' '),
                                    waitingForInput
                                });
                                break;
                            }
                        }
                    default:
                        emitter.fire(e);
                        break;
                }
            }));
            return {
                onDidChange: emitter.event
            };
        }
        normalizeWord(word) {
            word = (0, strings_1.rtrim)(word, '.');
            word = (0, strings_1.rtrim)(word, ',');
            word = (0, strings_1.rtrim)(word, '?');
            return word.toLowerCase();
        }
    };
    exports.VoiceChatService = VoiceChatService;
    exports.VoiceChatService = VoiceChatService = VoiceChatService_1 = __decorate([
        __param(0, speechService_1.ISpeechService),
        __param(1, chatAgents_1.IChatAgentService)
    ], VoiceChatService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidm9pY2VDaGF0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9jb21tb24vdm9pY2VDaGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFZbkYsUUFBQSxpQkFBaUIsR0FBRyxJQUFBLCtCQUFlLEVBQW9CLGtCQUFrQixDQUFDLENBQUM7SUF1Q3hGLElBQUssY0FJSjtJQUpELFdBQUssY0FBYztRQUNsQixxREFBUyxDQUFBO1FBQ1QseURBQVcsQ0FBQTtRQUNYLDZFQUFxQixDQUFBO0lBQ3RCLENBQUMsRUFKSSxjQUFjLEtBQWQsY0FBYyxRQUlsQjtJQUVNLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVU7O2lCQUl2QixpQkFBWSxHQUFHLGlDQUFlLEFBQWxCLENBQW1CO2lCQUMvQixtQkFBYyxHQUFHLHNDQUFvQixBQUF2QixDQUF3QjtpQkFFdEMsa0JBQWEsR0FBRztZQUN2QyxDQUFDLGtCQUFnQixDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUk7WUFDckMsQ0FBQyxrQkFBZ0IsQ0FBQyxjQUFjLENBQUMsRUFBRSxPQUFPO1NBQzFDLEFBSG9DLENBR25DO2lCQUVzQixrQkFBYSxHQUFHO1lBQ3ZDLENBQUMsa0JBQWdCLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSTtZQUNyQyxDQUFDLGtCQUFnQixDQUFDLGNBQWMsQ0FBQyxFQUFFLE9BQU87U0FDMUMsQUFIb0MsQ0FHbkM7aUJBRXNCLHFCQUFnQixHQUFHLElBQUksR0FBRyxDQUFpQixDQUFDLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQUFBaEQsQ0FBaUQ7UUFFekYsWUFDa0MsYUFBNkIsRUFDMUIsZ0JBQW1DO1lBRXZFLEtBQUssRUFBRSxDQUFD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