/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/types", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, iterator_1, lifecycle_1, linkedList_1, types_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandsRegistry = exports.ICommandService = void 0;
    exports.ICommandService = (0, instantiation_1.createDecorator)('commandService');
    exports.CommandsRegistry = new class {
        constructor() {
            this._commands = new Map();
            this._onDidRegisterCommand = new event_1.Emitter();
            this.onDidRegisterCommand = this._onDidRegisterCommand.event;
        }
        registerCommand(idOrCommand, handler) {
            if (!idOrCommand) {
                throw new Error(`invalid command`);
            }
            if (typeof idOrCommand === 'string') {
                if (!handler) {
                    throw new Error(`invalid command`);
                }
                return this.registerCommand({ id: idOrCommand, handler });
            }
            // add argument validation if rich command metadata is provided
            if (idOrCommand.metadata && Array.isArray(idOrCommand.metadata.args)) {
                const constraints = [];
                for (const arg of idOrCommand.metadata.args) {
                    constraints.push(arg.constraint);
                }
                const actualHandler = idOrCommand.handler;
                idOrCommand.handler = function (accessor, ...args) {
                    (0, types_1.validateConstraints)(args, constraints);
                    return actualHandler(accessor, ...args);
                };
            }
            // find a place to store the command
            const { id } = idOrCommand;
            let commands = this._commands.get(id);
            if (!commands) {
                commands = new linkedList_1.LinkedList();
                this._commands.set(id, commands);
            }
            const removeFn = commands.unshift(idOrCommand);
            const ret = (0, lifecycle_1.toDisposable)(() => {
                removeFn();
                const command = this._commands.get(id);
                if (command?.isEmpty()) {
                    this._commands.delete(id);
                }
            });
            // tell the world about this command
            this._onDidRegisterCommand.fire(id);
            return ret;
        }
        registerCommandAlias(oldId, newId) {
            return exports.CommandsRegistry.registerCommand(oldId, (accessor, ...args) => accessor.get(exports.ICommandService).executeCommand(newId, ...args));
        }
        getCommand(id) {
            const list = this._commands.get(id);
            if (!list || list.isEmpty()) {
                return undefined;
            }
            return iterator_1.Iterable.first(list);
        }
        getCommands() {
            const result = new Map();
            for (const key of this._commands.keys()) {
                const command = this.getCommand(key);
                if (command) {
                    result.set(key, command);
                }
            }
            return result;
        }
    };
    exports.CommandsRegistry.registerCommand('noop', () => { });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb21tYW5kcy9jb21tb24vY29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV25GLFFBQUEsZUFBZSxHQUFHLElBQUEsK0JBQWUsRUFBa0IsZ0JBQWdCLENBQUMsQ0FBQztJQXNEckUsUUFBQSxnQkFBZ0IsR0FBcUIsSUFBSTtRQUFBO1lBRXBDLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBZ0MsQ0FBQztZQUVwRCwwQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBVSxDQUFDO1lBQ3RELHlCQUFvQixHQUFrQixJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1FBMkVqRixDQUFDO1FBekVBLGVBQWUsQ0FBQyxXQUE4QixFQUFFLE9BQXlCO1lBRXhFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3BDLENBQUM7WUFFRCxJQUFJLE9BQU8sV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUNwQyxDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUMzRCxDQUFDO1lBRUQsK0RBQStEO1lBQy9ELElBQUksV0FBVyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdEUsTUFBTSxXQUFXLEdBQXNDLEVBQUUsQ0FB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