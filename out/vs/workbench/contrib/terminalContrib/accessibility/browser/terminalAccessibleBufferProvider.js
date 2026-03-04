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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, event_1, lifecycle_1, model_1, configuration_1, contextkey_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalAccessibleBufferProvider = void 0;
    let TerminalAccessibleBufferProvider = class TerminalAccessibleBufferProvider extends lifecycle_1.DisposableStore {
        constructor(_instance, _bufferTracker, customHelp, _modelService, configurationService, _contextKeyService, _terminalService) {
            super();
            this._instance = _instance;
            this._bufferTracker = _bufferTracker;
            this.id = "terminal" /* AccessibleViewProviderId.Terminal */;
            this.options = { type: "view" /* AccessibleViewType.View */, language: 'terminal', id: "terminal" /* AccessibleViewProviderId.Terminal */ };
            this.verbositySettingKey = "accessibility.verbosity.terminal" /* AccessibilityVerbositySettingId.Terminal */;
            this._onDidRequestClearProvider = new event_1.Emitter();
            this.onDidRequestClearLastProvider = this._onDidRequestClearProvider.event;
            this.options.customHelp = customHelp;
            this.options.position = configurationService.getValue("terminal.integrated.accessibleViewPreserveCursorPosition" /* TerminalSettingId.AccessibleViewPreserveCursorPosition */) ? 'initial-bottom' : 'bottom';
            this.add(this._instance.onDisposed(() => this._onDidRequestClearProvider.fire("terminal" /* AccessibleViewProviderId.Terminal */)));
            this.add(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.accessibleViewPreserveCursorPosition" /* TerminalSettingId.AccessibleViewPreserveCursorPosition */)) {
                    this.options.position = configurationService.getValue("terminal.integrated.accessibleViewPreserveCursorPosition" /* TerminalSettingId.AccessibleViewPreserveCursorPosition */) ? 'initial-bottom' : 'bottom';
                }
            }));
            this._focusedInstance = _terminalService.activeInstance;
            this.add(_terminalService.onDidChangeActiveInstance(() => {
                if (_terminalService.activeInstance && this._focusedInstance?.instanceId !== _terminalService.activeInstance?.instanceId) {
                    this._onDidRequestClearProvider.fire("terminal" /* AccessibleViewProviderId.Terminal */);
                    this._focusedInstance = _terminalService.activeInstance;
                }
            }));
        }
        onClose() {
            this._instance.focus();
        }
        provideContent() {
            this._bufferTracker.update();
            return this._bufferTracker.lines.join('\n');
        }
        getSymbols() {
            const commands = this._getCommandsWithEditorLine() ?? [];
            const symbols = [];
            for (const command of commands) {
                const label = command.command.command;
                if (label) {
                    symbols.push({
                        label,
                        lineNumber: command.lineNumber
                    });
                }
            }
            return symbols;
        }
        _getCommandsWithEditorLine() {
            const capability = this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            const commands = capability?.commands;
            const currentCommand = capability?.currentCommand;
            if (!commands?.length) {
                return;
            }
            const result = [];
            for (const command of commands) {
                const lineNumber = this._getEditorLineForCommand(command);
                if (lineNumber === undefined) {
                    continue;
                }
                result.push({ command, lineNumber, exitCode: command.exitCode });
            }
            if (currentCommand) {
                const lineNumber = this._getEditorLineForCommand(currentCommand);
                if (lineNumber !== undefined) {
                    result.push({ command: currentCommand, lineNumber });
                }
            }
            return result;
        }
        _getEditorLineForCommand(command) {
            let line;
            if ('marker' in command) {
                line = command.marker?.line;
            }
            else if ('commandStartMarker' in command) {
                line = command.commandStartMarker?.line;
            }
            if (line === undefined || line < 0) {
                return;
            }
            line = this._bufferTracker.bufferToEditorLineMapping.get(line);
            if (line === undefined) {
                return;
            }
            return line + 1;
        }
    };
    exports.TerminalAccessibleBufferProvider = TerminalAccessibleBufferProvider;
    exports.TerminalAccessibleBufferProvider = TerminalAccessibleBufferProvider = __decorate([
        __param(3, model_1.IModelService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, terminal_1.ITerminalService)
    ], TerminalAccessibleBufferProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxBY2Nlc3NpYmxlQnVmZmVyUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvYWNjZXNzaWJpbGl0eS9icm93c2VyL3Rlcm1pbmFsQWNjZXNzaWJsZUJ1ZmZlclByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWV6RixJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFpQyxTQUFRLDJCQUFlO1FBT3BFLFlBQ2tCLFNBQWlKLEVBQzFKLGNBQW9DLEVBQzVDLFVBQXdCLEVBQ1QsYUFBNEIsRUFDcEIsb0JBQTJDLEVBQzlDLGtCQUFzQyxFQUN4QyxnQkFBa0M7WUFFcEQsS0FBSyxFQUFFLENBQUM7WUFSUyxjQUFTLEdBQVQsU0FBUyxDQUF3STtZQUMxSixtQkFBYyxHQUFkLGNBQWMsQ0FBc0I7WUFSN0MsT0FBRSxzREFBcUM7WUFDdkMsWUFBTyxHQUEyQixFQUFFLElBQUksc0NBQXlCLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9EQUFtQyxFQUFFLENBQUM7WUFDakksd0JBQW1CLHFGQUE0QztZQUM5QywrQkFBMEIsR0FBRyxJQUFJLGVBQU8sRUFBNEIsQ0FBQztZQUM3RSxrQ0FBNkIsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDO1lBWTlFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUNyQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLHlIQUF3RCxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQzVJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxD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