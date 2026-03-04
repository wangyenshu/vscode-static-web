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
define(["require", "exports", "vs/editor/common/core/offsetRange", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables"], function (require, exports, offsetRange_1, position_1, range_1, chatAgents_1, chatParserTypes_1, chatSlashCommands_1, chatVariables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatRequestParser = void 0;
    const agentReg = /^@([\w_\-]+)(?=(\s|$|\b))/i; // An @-agent
    const variableReg = /^#([\w_\-]+)(:\d+)?(?=(\s|$|\b))/i; // A #-variable with an optional numeric : arg (@response:2)
    const slashReg = /\/([\w_\-]+)(?=(\s|$|\b))/i; // A / command
    let ChatRequestParser = class ChatRequestParser {
        constructor(agentService, variableService, slashCommandService) {
            this.agentService = agentService;
            this.variableService = variableService;
            this.slashCommandService = slashCommandService;
        }
        parseChatRequest(sessionId, message, location = chatAgents_1.ChatAgentLocation.Panel, context) {
            const parts = [];
            const references = this.variableService.getDynamicVariables(sessionId); // must access this list before any async calls
            let lineNumber = 1;
            let column = 1;
            for (let i = 0; i < message.length; i++) {
                const previousChar = message.charAt(i - 1);
                const char = message.charAt(i);
                let newPart;
                if (previousChar.match(/\s/) || i === 0) {
                    if (char === chatParserTypes_1.chatVariableLeader) {
                        newPart = this.tryToParseVariable(message.slice(i), i, new position_1.Position(lineNumber, column), parts);
                    }
                    else if (char === chatParserTypes_1.chatAgentLeader) {
                        newPart = this.tryToParseAgent(message.slice(i), message, i, new position_1.Position(lineNumber, column), parts, location, context);
                    }
                    else if (char === chatParserTypes_1.chatSubcommandLeader) {
                        newPart = this.tryToParseSlashCommand(message.slice(i), message, i, new position_1.Position(lineNumber, column), parts);
                    }
                    if (!newPart) {
                        newPart = this.tryToParseDynamicVariable(message.slice(i), i, new position_1.Position(lineNumber, column), references);
                    }
                }
                if (newPart) {
                    if (i !== 0) {
                        // Insert a part for all the text we passed over, then insert the new parsed part
                        const previousPart = parts.at(-1);
                        const previousPartEnd = previousPart?.range.endExclusive ?? 0;
                        const previousPartEditorRangeEndLine = previousPart?.editorRange.endLineNumber ?? 1;
                        const previousPartEditorRangeEndCol = previousPart?.editorRange.endColumn ?? 1;
                        parts.push(new chatParserTypes_1.ChatRequestTextPart(new offsetRange_1.OffsetRange(previousPartEnd, i), new range_1.Range(previousPartEditorRangeEndLine, previousPartEditorRangeEndCol, lineNumber, column), message.slice(previousPartEnd, i)));
                    }
                    parts.push(newPart);
                }
                if (char === '\n') {
                    lineNumber++;
                    column = 1;
                }
                else {
                    column++;
                }
            }
            const lastPart = parts.at(-1);
            const lastPartEnd = lastPart?.range.endExclusive ?? 0;
            if (lastPartEnd < message.length) {
                parts.push(new chatParserTypes_1.ChatRequestTextPart(new offsetRange_1.OffsetRange(lastPartEnd, message.length), new range_1.Range(lastPart?.editorRange.endLineNumber ?? 1, lastPart?.editorRange.endColumn ?? 1, lineNumber, column), message.slice(lastPartEnd, message.length)));
            }
            return {
                parts,
                text: message,
            };
        }
        tryToParseAgent(message, fullMessage, offset, position, parts, location, context) {
            const nextAgentMatch = message.match(agentReg);
            if (!nextAgentMatch) {
                return;
            }
            const [full, name] = nextAgentMatch;
            const agentRange = new offsetRange_1.OffsetRange(offset, offset + full.length);
            const agentEditorRange = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column + full.length);
            const agents = this.agentService.getAgentsByName(name);
            // If there is more than one agent with this name, and the user picked it from the suggest widget, then the selected agent should be in the
            // context and we use that one. Otherwise just pick the first.
            const agent = agents.length > 1 && context?.selectedAgent ?
                context.selectedAgent :
                agents[0];
            if (!agent || !agent.locations.includes(location)) {
                return;
            }
            if (parts.some(p => p instanceof chatParserTypes_1.ChatRequestAgentPart)) {
                // Only one agent allowed
                return;
            }
            // The agent must come first
            if (parts.some(p => (p instanceof chatParserTypes_1.ChatRequestTextPart && p.text.trim() !== '') || !(p instanceof chatParserTypes_1.ChatRequestAgentPart))) {
                return;
            }
            const previousPart = parts.at(-1);
            const previousPartEnd = previousPart?.range.endExclusive ?? 0;
            const textSincePreviousPart = fullMessage.slice(previousPartEnd, offset);
            if (textSincePreviousPart.trim() !== '') {
                return;
            }
            return new chatParserTypes_1.ChatRequestAgentPart(agentRange, agentEditorRange, agent);
        }
        tryToParseVariable(message, offset, position, parts) {
            const nextVariableMatch = message.match(variableReg);
            if (!nextVariableMatch) {
                return;
            }
            const [full, name] = nextVariableMatch;
            const variableArg = nextVariableMatch[2] ?? '';
            const varRange = new offsetRange_1.OffsetRange(offset, offset + full.length);
            const varEditorRange = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column + full.length);
            if (this.variableService.hasVariable(name)) {
                return new chatParserTypes_1.ChatRequestVariablePart(varRange, varEditorRange, name, variableArg);
            }
            return;
        }
        tryToParseSlashCommand(remainingMessage, fullMessage, offset, position, parts) {
            const nextSlashMatch = remainingMessage.match(slashReg);
            if (!nextSlashMatch) {
                return;
            }
            if (parts.some(p => p instanceof chatParserTypes_1.ChatRequestSlashCommandPart)) {
                // Only one slash command allowed
                return;
            }
            const [full, command] = nextSlashMatch;
            const slashRange = new offsetRange_1.OffsetRange(offset, offset + full.length);
            const slashEditorRange = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column + full.length);
            const usedAgent = parts.find((p) => p instanceof chatParserTypes_1.ChatRequestAgentPart);
            if (usedAgent) {
                // The slash command must come immediately after the agent
                if (parts.some(p => (p instanceof chatParserTypes_1.ChatRequestTextPart && p.text.trim() !== '') || !(p instanceof chatParserTypes_1.ChatRequestAgentPart) && !(p instanceof chatParserTypes_1.ChatRequestTextPart))) {
                    return;
                }
                const previousPart = parts.at(-1);
                const previousPartEnd = previousPart?.range.endExclusive ?? 0;
                const textSincePreviousPart = fullMessage.slice(previousPartEnd, offset);
                if (textSincePreviousPart.trim() !== '') {
                    return;
                }
                const subCommand = usedAgent.agent.slashCommands.find(c => c.name === command);
                if (subCommand) {
                    // Valid agent subcommand
                    return new chatParserTypes_1.ChatRequestAgentSubcommandPart(slashRange, slashEditorRange, subCommand);
                }
            }
            else {
                const slashCommands = this.slashCommandService.getCommands();
                const slashCommand = slashCommands.find(c => c.command === command);
                if (slashCommand) {
                    // Valid standalone slash command
                    return new chatParserTypes_1.ChatRequestSlashCommandPart(slashRange, slashEditorRange, slashCommand);
                }
            }
            return;
        }
        tryToParseDynamicVariable(message, offset, position, references) {
            const refAtThisPosition = references.find(r => r.range.startLineNumber === position.lineNumber &&
                r.range.startColumn === position.column);
            if (refAtThisPosition) {
                const length = refAtThisPosition.range.endColumn - refAtThisPosition.range.startColumn;
                const text = message.substring(0, length);
                const range = new offsetRange_1.OffsetRange(offset, offset + length);
                return new chatParserTypes_1.ChatRequestDynamicVariablePart(range, refAtThisPosition.range, text, refAtThisPosition.data);
            }
            return;
        }
    };
    exports.ChatRequestParser = ChatRequestParser;
    exports.ChatRequestParser = ChatRequestParser = __decorate([
        __param(0, chatAgents_1.IChatAgentService),
        __param(1, chatVariables_1.IChatVariablesService),
        __param(2, chatSlashCommands_1.IChatSlashCommandService)
    ], ChatRequestParser);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFJlcXVlc3RQYXJzZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2NvbW1vbi9jaGF0UmVxdWVzdFBhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVaEcsTUFBTSxRQUFRLEdBQUcsNEJBQTRCLENBQUMsQ0FBQyxhQUFhO0lBQzVELE1BQU0sV0FBVyxHQUFHLG1DQUFtQyxDQUFDLENBQUMsNERBQTREO0lBQ3JILE1BQU0sUUFBUSxHQUFHLDRCQUE0QixDQUFDLENBQUMsY0FBYztJQU90RCxJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFpQjtRQUM3QixZQUNxQyxZQUErQixFQUMzQixlQUFzQyxFQUNuQyxtQkFBNkM7WUFGcEQsaUJBQVksR0FBWixZQUFZLENBQW1CO1lBQzNCLG9CQUFlLEdBQWYsZUFBZSxDQUF1QjtZQUNuQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQTBCO1FBQ3JGLENBQUM7UUFFTCxnQkFBZ0IsQ0FBQyxTQUFpQixFQUFFLE9BQWUsRUFBRSxXQUE4Qiw4QkFBaUIsQ0FBQyxLQUFLLEVBQUUsT0FBNEI7WUFDdkksTUFBTSxLQUFLLEdBQTZCLEVBQUUsQ0FBQztZQUMzQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsK0NBQStDO1lBRXZILElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDZixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLFlBQVksR0FBRyxP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