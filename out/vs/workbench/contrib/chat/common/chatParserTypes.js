/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/marshalling", "vs/editor/common/core/offsetRange"], function (require, exports, marshalling_1, offsetRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatRequestDynamicVariablePart = exports.ChatRequestSlashCommandPart = exports.ChatRequestAgentSubcommandPart = exports.ChatRequestAgentPart = exports.ChatRequestVariablePart = exports.chatSubcommandLeader = exports.chatAgentLeader = exports.chatVariableLeader = exports.ChatRequestTextPart = void 0;
    exports.getPromptText = getPromptText;
    exports.reviveParsedChatRequest = reviveParsedChatRequest;
    exports.extractAgentAndCommand = extractAgentAndCommand;
    function getPromptText(request) {
        const message = request.parts.map(r => r.promptText).join('').trimStart();
        const diff = request.text.length - message.length;
        return { message, diff };
    }
    class ChatRequestTextPart {
        static { this.Kind = 'text'; }
        constructor(range, editorRange, text) {
            this.range = range;
            this.editorRange = editorRange;
            this.text = text;
            this.kind = ChatRequestTextPart.Kind;
        }
        get promptText() {
            return this.text;
        }
    }
    exports.ChatRequestTextPart = ChatRequestTextPart;
    // warning, these also show up in a regex in the parser
    exports.chatVariableLeader = '#';
    exports.chatAgentLeader = '@';
    exports.chatSubcommandLeader = '/';
    /**
     * An invocation of a static variable that can be resolved by the variable service
     */
    class ChatRequestVariablePart {
        static { this.Kind = 'var'; }
        constructor(range, editorRange, variableName, variableArg) {
            this.range = range;
            this.editorRange = editorRange;
            this.variableName = variableName;
            this.variableArg = variableArg;
            this.kind = ChatRequestVariablePart.Kind;
        }
        get text() {
            const argPart = this.variableArg ? `:${this.variableArg}` : '';
            return `${exports.chatVariableLeader}${this.variableName}${argPart}`;
        }
        get promptText() {
            return this.text;
        }
    }
    exports.ChatRequestVariablePart = ChatRequestVariablePart;
    /**
     * An invocation of an agent that can be resolved by the agent service
     */
    class ChatRequestAgentPart {
        static { this.Kind = 'agent'; }
        constructor(range, editorRange, agent) {
            this.range = range;
            this.editorRange = editorRange;
            this.agent = agent;
            this.kind = ChatRequestAgentPart.Kind;
        }
        get text() {
            return `${exports.chatAgentLeader}${this.agent.name}`;
        }
        get promptText() {
            return '';
        }
    }
    exports.ChatRequestAgentPart = ChatRequestAgentPart;
    /**
     * An invocation of an agent's subcommand
     */
    class ChatRequestAgentSubcommandPart {
        static { this.Kind = 'subcommand'; }
        constructor(range, editorRange, command) {
            this.range = range;
            this.editorRange = editorRange;
            this.command = command;
            this.kind = ChatRequestAgentSubcommandPart.Kind;
        }
        get text() {
            return `${exports.chatSubcommandLeader}${this.command.name}`;
        }
        get promptText() {
            return '';
        }
    }
    exports.ChatRequestAgentSubcommandPart = ChatRequestAgentSubcommandPart;
    /**
     * An invocation of a standalone slash command
     */
    class ChatRequestSlashCommandPart {
        static { this.Kind = 'slash'; }
        constructor(range, editorRange, slashCommand) {
            this.range = range;
            this.editorRange = editorRange;
            this.slashCommand = slashCommand;
            this.kind = ChatRequestSlashCommandPart.Kind;
        }
        get text() {
            return `${exports.chatSubcommandLeader}${this.slashCommand.command}`;
        }
        get promptText() {
            return `${exports.chatSubcommandLeader}${this.slashCommand.command}`;
        }
    }
    exports.ChatRequestSlashCommandPart = ChatRequestSlashCommandPart;
    /**
     * An invocation of a dynamic reference like '#file:'
     */
    class ChatRequestDynamicVariablePart {
        static { this.Kind = 'dynamic'; }
        constructor(range, editorRange, text, data) {
            this.range = range;
            this.editorRange = editorRange;
            this.text = text;
            this.data = data;
            this.kind = ChatRequestDynamicVariablePart.Kind;
        }
        get referenceText() {
            return this.text.replace(exports.chatVariableLeader, '');
        }
        get promptText() {
            return this.text;
        }
    }
    exports.ChatRequestDynamicVariablePart = ChatRequestDynamicVariablePart;
    function reviveParsedChatRequest(serialized) {
        return {
            text: serialized.text,
            parts: serialized.parts.map(part => {
                if (part.kind === ChatRequestTextPart.Kind) {
                    return new ChatRequestTextPart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, part.text);
                }
                else if (part.kind === ChatRequestVariablePart.Kind) {
                    return new ChatRequestVariablePart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, part.variableName, part.variableArg);
                }
                else if (part.kind === ChatRequestAgentPart.Kind) {
                    let agent = part.agent;
                    if (!('name' in agent)) {
                        // Port old format
                        agent = {
                            ...agent,
                            name: agent.id
                        };
                    }
                    return new ChatRequestAgentPart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, agent);
                }
                else if (part.kind === ChatRequestAgentSubcommandPart.Kind) {
                    return new ChatRequestAgentSubcommandPart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, part.command);
                }
                else if (part.kind === ChatRequestSlashCommandPart.Kind) {
                    return new ChatRequestSlashCommandPart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, part.slashCommand);
                }
                else if (part.kind === ChatRequestDynamicVariablePart.Kind) {
                    return new ChatRequestDynamicVariablePart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, part.text, (0, marshalling_1.revive)(part.data));
                }
                else {
                    throw new Error(`Unknown chat request part: ${part.kind}`);
                }
            })
        };
    }
    function extractAgentAndCommand(parsed) {
        const agentPart = parsed.parts.find((r) => r instanceof ChatRequestAgentPart);
        const commandPart = parsed.parts.find((r) => r instanceof ChatRequestAgentSubcommandPart);
        return { agentPart, commandPart };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFBhcnNlclR5cGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9jb21tb24vY2hhdFBhcnNlclR5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlCaEcsc0NBS0M7SUF1R0QsMERBd0RDO0lBRUQsd0RBSUM7SUExS0QsU0FBZ0IsYUFBYSxDQUFDLE9BQTJCO1FBQ3hELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUMxRSxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBRWxELE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELE1BQWEsbUJBQW1CO2lCQUNmLFNBQUksR0FBRyxNQUFNLEFBQVQsQ0FBVTtRQUU5QixZQUFxQixLQUFrQixFQUFXLFdBQW1CLEVBQVcsSUFBWTtZQUF2RSxVQUFLLEdBQUwsS0FBSyxDQUFhO1lBQVcsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFBVyxTQUFJLEdBQUosSUFBSSxDQUFRO1lBRG5GLFNBQUksR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7UUFDdUQsQ0FBQztRQUVqRyxJQUFJLFVBQVU7WUFDYixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDbEIsQ0FBQzs7SUFQRixrREFRQztJQUVELHVEQUF1RDtJQUMxQyxRQUFBLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztJQUN6QixRQUFBLGVBQWUsR0FBRyxHQUFH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