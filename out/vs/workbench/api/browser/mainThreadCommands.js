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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/platform/commands/common/commands", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/proxyIdentifier", "../common/extHost.protocol", "vs/base/common/types"], function (require, exports, lifecycle_1, marshalling_1, commands_1, extHostCustomers_1, extensions_1, proxyIdentifier_1, extHost_protocol_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadCommands = void 0;
    let MainThreadCommands = class MainThreadCommands {
        constructor(extHostContext, _commandService, _extensionService) {
            this._commandService = _commandService;
            this._extensionService = _extensionService;
            this._commandRegistrations = new lifecycle_1.DisposableMap();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostCommands);
            this._generateCommandsDocumentationRegistration = commands_1.CommandsRegistry.registerCommand('_generateCommandsDocumentation', () => this._generateCommandsDocumentation());
        }
        dispose() {
            this._commandRegistrations.dispose();
            this._generateCommandsDocumentationRegistration.dispose();
        }
        async _generateCommandsDocumentation() {
            const result = await this._proxy.$getContributedCommandMetadata();
            // add local commands
            const commands = commands_1.CommandsRegistry.getCommands();
            for (const [id, command] of commands) {
                if (command.metadata) {
                    result[id] = command.metadata;
                }
            }
            // print all as markdown
            const all = [];
            for (const id in result) {
                all.push('`' + id + '` - ' + _generateMarkdown(result[id]));
            }
            console.log(all.join('\n'));
        }
        $registerCommand(id) {
            this._commandRegistrations.set(id, commands_1.CommandsRegistry.registerCommand(id, (accessor, ...args) => {
                return this._proxy.$executeContributedCommand(id, ...args).then(result => {
                    return (0, marshalling_1.revive)(result);
                });
            }));
        }
        $unregisterCommand(id) {
            this._commandRegistrations.deleteAndDispose(id);
        }
        $fireCommandActivationEvent(id) {
            const activationEvent = `onCommand:${id}`;
            if (!this._extensionService.activationEventIsDone(activationEvent)) {
                // this is NOT awaited because we only use it as drive-by-activation
                // for commands that are already known inside the extension host
                this._extensionService.activateByEvent(activationEvent);
            }
        }
        async $executeCommand(id, args, retry) {
            if (args instanceof proxyIdentifier_1.SerializableObjectWithBuffers) {
                args = args.value;
            }
            for (let i = 0; i < args.length; i++) {
                args[i] = (0, marshalling_1.revive)(args[i]);
            }
            if (retry && args.length > 0 && !commands_1.CommandsRegistry.getCommand(id)) {
                await this._extensionService.activateByEvent(`onCommand:${id}`);
                throw new Error('$executeCommand:retry');
            }
            return this._commandService.executeCommand(id, ...args);
        }
        $getCommands() {
            return Promise.resolve([...commands_1.CommandsRegistry.getCommands().keys()]);
        }
    };
    exports.MainThreadCommands = MainThreadCommands;
    exports.MainThreadCommands = MainThreadCommands = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadCommands),
        __param(1, commands_1.ICommandService),
        __param(2, extensions_1.IExtensionService)
    ], MainThreadCommands);
    // --- command doc
    function _generateMarkdown(description) {
        if (typeof description === 'string') {
            return description;
        }
        else {
            const descriptionString = (0, types_1.isString)(description.description)
                ? description.description
                // Our docs website is in English, so keep the original here.
                : description.description.original;
            const parts = [descriptionString];
            parts.push('\n\n');
            if (description.args) {
                for (const arg of description.args) {
                    parts.push(`* _${arg.name}_ - ${arg.description || ''}\n`);
                }
            }
            if (description.returns) {
                parts.push(`* _(returns)_ - ${description.returns}`);
            }
            parts.push('\n\n');
            return parts.join('');
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7UUFNOUIsWUFDQyxjQUErQixFQUNkLGVBQWlELEVBQy9DLGlCQUFxRDtZQUR0QyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDOUIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQVB4RCwwQkFBcUIsR0FBRyxJQUFJLHlCQUFhLEVBQVUsQ0FBQztZQVNwRSxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUV0RSxJQUFJLENBQUMsMENBQTBDLEdBQUcsMkJBQWdCLENBQUMsZUFBZSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDLENBQUM7UUFDbkssQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLDBDQUEwQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNELENBQUM7UUFFTyxLQUFLLENBQUMsOEJBQThCO1lBQzNDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1lBRWxFLHFCQUFxQjtZQUNyQixNQUFNLFFBQVEsR0FBRywyQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNoRCxLQUFLLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLElBQUksUUFB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