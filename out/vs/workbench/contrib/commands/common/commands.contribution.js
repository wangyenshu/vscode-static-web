/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/log/common/log", "vs/platform/notification/common/notification"], function (require, exports, nls, actions_1, commands_1, log_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Runs several commands passed to it as an argument */
    class RunCommands extends actions_1.Action2 {
        constructor() {
            super({
                id: 'runCommands',
                title: nls.localize2('runCommands', "Run Commands"),
                f1: false,
                metadata: {
                    description: nls.localize('runCommands.description', "Run several commands"),
                    args: [
                        {
                            name: 'args',
                            schema: {
                                type: 'object',
                                required: ['commands'],
                                properties: {
                                    commands: {
                                        type: 'array',
                                        description: nls.localize('runCommands.commands', "Commands to run"),
                                        items: {
                                            anyOf: [
                                                {
                                                    $ref: 'vscode://schemas/keybindings#/definitions/commandNames'
                                                },
                                                {
                                                    type: 'string',
                                                },
                                                {
                                                    type: 'object',
                                                    required: ['command'],
                                                    properties: {
                                                        command: {
                                                            'anyOf': [
                                                                {
                                                                    $ref: 'vscode://schemas/keybindings#/definitions/commandNames'
                                                                },
                                                                {
                                                                    type: 'string'
                                                                },
                                                            ]
                                                        }
                                                    },
                                                    $ref: 'vscode://schemas/keybindings#/definitions/commandsSchemas'
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            });
        }
        // dev decisions:
        // - this command takes a single argument-object because
        //	- keybinding definitions don't allow running commands with several arguments
        //  - and we want to be able to take on different other arguments in future, e.g., `runMode : 'serial' | 'concurrent'`
        async run(accessor, args) {
            const notificationService = accessor.get(notification_1.INotificationService);
            if (!this._isCommandArgs(args)) {
                notificationService.error(nls.localize('runCommands.invalidArgs', "'runCommands' has received an argument with incorrect type. Please, review the argument passed to the command."));
                return;
            }
            if (args.commands.length === 0) {
                notificationService.warn(nls.localize('runCommands.noCommandsToRun', "'runCommands' has not received commands to run. Did you forget to pass commands in the 'runCommands' argument?"));
                return;
            }
            const commandService = accessor.get(commands_1.ICommandService);
            const logService = accessor.get(log_1.ILogService);
            let i = 0;
            try {
                for (; i < args.commands.length; ++i) {
                    const cmd = args.commands[i];
                    logService.debug(`runCommands: executing ${i}-th command: ${JSON.stringify(cmd)}`);
                    const r = await this._runCommand(commandService, cmd);
                    logService.debug(`runCommands: executed ${i}-th command with return value: ${JSON.stringify(r)}`);
                }
            }
            catch (err) {
                logService.debug(`runCommands: executing ${i}-th command resulted in an error: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
                notificationService.error(err);
            }
        }
        _isCommandArgs(args) {
            if (!args || typeof args !== 'object') {
                return false;
            }
            if (!('commands' in args) || !Array.isArray(args.commands)) {
                return false;
            }
            for (const cmd of args.commands) {
                if (typeof cmd === 'string') {
                    continue;
                }
                if (typeof cmd === 'object' && typeof cmd.command === 'string') {
                    continue;
                }
                return false;
            }
            return true;
        }
        _runCommand(commandService, cmd) {
            let commandID, commandArgs;
            if (typeof cmd === 'string') {
                commandID = cmd;
            }
            else {
                commandID = cmd.command;
                commandArgs = cmd.args;
            }
            if (commandArgs === undefined) {
                return commandService.executeCommand(commandID);
            }
            else {
                if (Array.isArray(commandArgs)) {
                    return commandService.executeCommand(commandID, ...commandArgs);
                }
                else {
                    return commandService.executeCommand(commandID, commandArgs);
                }
            }
        }
    }
    (0, actions_1.registerAction2)(RunCommands);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWFuZHMvY29tbW9uL2NvbW1hbmRzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRyx3REFBd0Q7SUFDeEQsTUFBTSxXQUFZLFNBQVEsaUJBQU87UUFFaEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGFBQWE7Z0JBQ2pCLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxjQUFjLENBQUM7Z0JBQ25ELEVBQUUsRUFBRSxLQUFLO2dCQUNULFFBQVEsRUFBRTtvQkFDVCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxzQkFBc0IsQ0FBQztvQkFDNUUsSUFBSSxFQUFFO3dCQUNMOzRCQUNDLElBQUksRUFBRSxNQUFNOzRCQUNaLE1BQU0sRUFBRTtnQ0FDUCxJQUFJLEVBQUUsUUFBUTtnQ0FDZCxRQUFRLEVBQUUsQ0FBQyxVQUFVLENBQUM7Z0NBQ3RCLFVBQVUsRUFBRTtvQ0FDWCxRQUFRLEVBQUU7d0NBQ1QsSUFBSSxFQUFFLE9BQU87d0NBQ2IsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsaUJBQWlCLENBQUM7d0NBQ3BFLEtBQUssRUFBRTs0Q0FDTixLQUFLLEVBQUU7Z0RBQ047b0RBQ0MsSUFBSSxFQUFFLHdEQUF3RDtpREFDOUQ7Z0RBQ0Q7b0RBQ0MsSUFBSSxFQUFFLFFBQVE7aURBQ2Q7Z0RBQ0Q7b0RBQ0MsSUFBSSxFQUFFLFFBQVE7b0RBQ2QsUUFBUSxFQUFFLENBQUMsU0FBUyxDQUFDO29EQUNyQixVQUFVLEVBQUU7d0RBQ1gsT0FBTyxFQUFFOzREQUNS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