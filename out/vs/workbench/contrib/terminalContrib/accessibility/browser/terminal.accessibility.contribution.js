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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminalContrib/accessibility/browser/bufferContentTracker", "vs/workbench/contrib/terminalContrib/accessibility/browser/terminalAccessibilityHelp", "vs/workbench/contrib/terminalContrib/accessibility/browser/textAreaSyncAddon", "vs/editor/common/core/position", "vs/workbench/contrib/terminalContrib/accessibility/browser/terminalAccessibleBufferProvider", "vs/platform/configuration/common/configuration", "vs/base/common/event", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/base/browser/ui/aria/aria"], function (require, exports, lifecycle_1, nls_1, accessibility_1, actions_1, contextkey_1, instantiation_1, accessibilityConfiguration_1, accessibleView_1, accessibleViewActions_1, terminal_1, terminalActions_1, terminalExtensions_1, terminalContextKey_1, bufferContentTracker_1, terminalAccessibilityHelp_1, textAreaSyncAddon_1, position_1, terminalAccessibleBufferProvider_1, configuration_1, event_1, accessibilitySignalService_1, aria_1) {
    "use strict";
    var TextAreaSyncContribution_1, TerminalAccessibleViewContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalAccessibilityHelpContribution = exports.TerminalAccessibleViewContribution = void 0;
    let TextAreaSyncContribution = class TextAreaSyncContribution extends lifecycle_1.DisposableStore {
        static { TextAreaSyncContribution_1 = this; }
        static { this.ID = 'terminal.textAreaSync'; }
        static get(instance) {
            return instance.getContribution(TextAreaSyncContribution_1.ID);
        }
        constructor(_instance, processManager, widgetManager, _instantiationService) {
            super();
            this._instance = _instance;
            this._instantiationService = _instantiationService;
        }
        layout(xterm) {
            if (this._addon) {
                return;
            }
            this._addon = this.add(this._instantiationService.createInstance(textAreaSyncAddon_1.TextAreaSyncAddon, this._instance.capabilities));
            xterm.raw.loadAddon(this._addon);
            this._addon.activate(xterm.raw);
        }
    };
    TextAreaSyncContribution = TextAreaSyncContribution_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], TextAreaSyncContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TextAreaSyncContribution.ID, TextAreaSyncContribution);
    let TerminalAccessibleViewContribution = class TerminalAccessibleViewContribution extends lifecycle_1.Disposable {
        static { TerminalAccessibleViewContribution_1 = this; }
        static { this.ID = 'terminal.accessibleBufferProvider'; }
        static get(instance) {
            return instance.getContribution(TerminalAccessibleViewContribution_1.ID);
        }
        constructor(_instance, processManager, widgetManager, _accessibleViewService, _instantiationService, _terminalService, _configurationService, _contextKeyService, _accessibilitySignalService) {
            super();
            this._instance = _instance;
            this._accessibleViewService = _accessibleViewService;
            this._instantiationService = _instantiationService;
            this._terminalService = _terminalService;
            this._configurationService = _configurationService;
            this._contextKeyService = _contextKeyService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._onDidRunCommand = new lifecycle_1.MutableDisposable();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(90, 'terminal', () => {
                if (this._terminalService.activeInstance !== this._instance) {
                    return false;
                }
                this.show();
                return true;
            }, terminalContextKey_1.TerminalContextKeys.focus));
            this._register(_instance.onDidExecuteText(() => {
                const focusAfterRun = _configurationService.getValue("terminal.integrated.focusAfterRun" /* TerminalSettingId.FocusAfterRun */);
                if (focusAfterRun === 'terminal') {
                    _instance.focus(true);
                }
                else if (focusAfterRun === 'accessible-buffer') {
                    this.show();
                }
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.accessibleViewFocusOnCommandExecution" /* TerminalSettingId.AccessibleViewFocusOnCommandExecution */)) {
                    this._updateCommandExecutedListener();
                }
            }));
            this._register(this._instance.capabilities.onDidAddCapability(e => {
                if (e.capability.type === 2 /* TerminalCapability.CommandDetection */) {
                    this._updateCommandExecutedListener();
                }
            }));
        }
        xtermReady(xterm) {
            const addon = this._instantiationService.createInstance(textAreaSyncAddon_1.TextAreaSyncAddon, this._instance.capabilities);
            xterm.raw.loadAddon(addon);
            addon.activate(xterm.raw);
            this._xterm = xterm;
            this._register(this._xterm.raw.onWriteParsed(async () => {
                if (this._terminalService.activeInstance !== this._instance) {
                    return;
                }
                if (this._isTerminalAccessibleViewOpen() && this._xterm.raw.buffer.active.baseY === 0) {
                    this.show();
                }
            }));
            const onRequestUpdateEditor = event_1.Event.latch(this._xterm.raw.onScroll);
            this._register(onRequestUpdateEditor(() => {
                if (this._terminalService.activeInstance !== this._instance) {
                    return;
                }
                if (this._isTerminalAccessibleViewOpen()) {
                    this.show();
                }
            }));
        }
        _updateCommandExecutedListener() {
            if (!this._instance.capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                return;
            }
            if (!this._configurationService.getValue("terminal.integrated.accessibleViewFocusOnCommandExecution" /* TerminalSettingId.AccessibleViewFocusOnCommandExecution */)) {
                this._onDidRunCommand.clear();
                return;
            }
            else if (this._onDidRunCommand.value) {
                return;
            }
            const capability = this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            this._onDidRunCommand.value = this._register(capability.onCommandExecuted(() => {
                if (this._instance.hasFocus) {
                    this.show();
                }
            }));
        }
        _isTerminalAccessibleViewOpen() {
            return accessibilityConfiguration_1.accessibleViewCurrentProviderId.getValue(this._contextKeyService) === "terminal" /* AccessibleViewProviderId.Terminal */;
        }
        show() {
            if (!this._xterm) {
                return;
            }
            if (!this._bufferTracker) {
                this._bufferTracker = this._register(this._instantiationService.createInstance(bufferContentTracker_1.BufferContentTracker, this._xterm));
            }
            if (!this._bufferProvider) {
                this._bufferProvider = this._register(this._instantiationService.createInstance(terminalAccessibleBufferProvider_1.TerminalAccessibleBufferProvider, this._instance, this._bufferTracker, () => {
                    return this._register(this._instantiationService.createInstance(terminalAccessibilityHelp_1.TerminalAccessibilityHelpProvider, this._instance, this._xterm)).provideContent();
                }));
            }
            const position = this._configurationService.getValue("terminal.integrated.accessibleViewPreserveCursorPosition" /* TerminalSettingId.AccessibleViewPreserveCursorPosition */) ? this._accessibleViewService.getPosition("terminal" /* AccessibleViewProviderId.Terminal */) : undefined;
            this._accessibleViewService.show(this._bufferProvider, position);
        }
        navigateToCommand(type) {
            const currentLine = this._accessibleViewService.getPosition("terminal" /* AccessibleViewProviderId.Terminal */)?.lineNumber;
            const commands = this._getCommandsWithEditorLine();
            if (!commands?.length || !currentLine) {
                return;
            }
            const filteredCommands = type === "previous" /* NavigationType.Previous */ ? commands.filter(c => c.lineNumber < currentLine).sort((a, b) => b.lineNumber - a.lineNumber) : commands.filter(c => c.lineNumber > currentLine).sort((a, b) => a.lineNumber - b.lineNumber);
            if (!filteredCommands.length) {
                return;
            }
            const command = filteredCommands[0];
            this._accessibleViewService.setPosition(new position_1.Position(command.lineNumber, 1), true);
            const commandLine = command.command.command;
            if (commandLine) {
                (0, aria_1.alert)(commandLine);
            }
            if (command.exitCode) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.terminalCommandFailed);
            }
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
                if (!lineNumber) {
                    continue;
                }
                result.push({ command, lineNumber, exitCode: command.exitCode });
            }
            if (currentCommand) {
                const lineNumber = this._getEditorLineForCommand(currentCommand);
                if (!!lineNumber) {
                    result.push({ command: currentCommand, lineNumber });
                }
            }
            return result;
        }
        _getEditorLineForCommand(command) {
            if (!this._bufferTracker) {
                return;
            }
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
    exports.TerminalAccessibleViewContribution = TerminalAccessibleViewContribution;
    exports.TerminalAccessibleViewContribution = TerminalAccessibleViewContribution = TerminalAccessibleViewContribution_1 = __decorate([
        __param(3, accessibleView_1.IAccessibleViewService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, terminal_1.ITerminalService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, accessibilitySignalService_1.IAccessibilitySignalService)
    ], TerminalAccessibleViewContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalAccessibleViewContribution.ID, TerminalAccessibleViewContribution);
    class TerminalAccessibilityHelpContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(105, 'terminal', async (accessor) => {
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const terminalService = accessor.get(terminal_1.ITerminalService);
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const instance = await terminalService.getActiveOrCreateInstance();
                await terminalService.revealActiveTerminal();
                const terminal = instance?.xterm;
                if (!terminal) {
                    return;
                }
                accessibleViewService.show(instantiationService.createInstance(terminalAccessibilityHelp_1.TerminalAccessibilityHelpProvider, instance, terminal));
            }, contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */)))));
        }
    }
    exports.TerminalAccessibilityHelpContribution = TerminalAccessibilityHelpContribution;
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalAccessibilityHelpContribution.ID, TerminalAccessibilityHelpContribution);
    class FocusAccessibleBufferAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "workbench.action.terminal.focusAccessibleBuffer" /* TerminalCommandId.FocusAccessibleBuffer */,
                title: (0, nls_1.localize2)('workbench.action.terminal.focusAccessibleBuffer', "Focus Accessible Terminal View"),
                precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
                keybinding: [
                    {
                        primary: 512 /* KeyMod.Alt */ | 60 /* KeyCode.F2 */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */],
                        linux: {
                            primary: 512 /* KeyMod.Alt */ | 60 /* KeyCode.F2 */ | 1024 /* KeyMod.Shift */,
                            secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */]
                        },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, terminalContextKey_1.TerminalContextKeys.focus)
                    }
                ]
            });
        }
        async run(accessor, ...args) {
            const terminalService = accessor.get(terminal_1.ITerminalService);
            const terminal = await terminalService.getActiveOrCreateInstance();
            if (!terminal?.xterm) {
                return;
            }
            TerminalAccessibleViewContribution.get(terminal)?.show();
        }
    }
    (0, actions_1.registerAction2)(FocusAccessibleBufferAction);
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.accessibleBufferGoToNextCommand" /* TerminalCommandId.AccessibleBufferGoToNextCommand */,
        title: (0, nls_1.localize2)('workbench.action.terminal.accessibleBufferGoToNextCommand', "Accessible Buffer Go to Next Command"),
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated, contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
        keybinding: [
            {
                primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 2
            }
        ],
        run: async (c) => {
            const instance = await c.service.activeInstance;
            if (!instance) {
                return;
            }
            await TerminalAccessibleViewContribution.get(instance)?.navigateToCommand("next" /* NavigationType.Next */);
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.accessibleBufferGoToPreviousCommand" /* TerminalCommandId.AccessibleBufferGoToPreviousCommand */,
        title: (0, nls_1.localize2)('workbench.action.terminal.accessibleBufferGoToPreviousCommand', "Accessible Buffer Go to Previous Command"),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
        keybinding: [
            {
                primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 2
            }
        ],
        run: async (c) => {
            const instance = await c.service.activeInstance;
            if (!instance) {
                return;
            }
            await TerminalAccessibleViewContribution.get(instance)?.navigateToCommand("previous" /* NavigationType.Previous */);
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.scrollToBottomAccessibleView" /* TerminalCommandId.ScrollToBottomAccessibleView */,
        title: (0, nls_1.localize2)('workbench.action.terminal.scrollToBottomAccessibleView', 'Scroll to Accessible View Bottom'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
            linux: { primary: 1024 /* KeyMod.Shift */ | 13 /* KeyCode.End */ },
            when: accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("terminal" /* AccessibleViewProviderId.Terminal */),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        run: (c, accessor) => {
            const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
            const lastPosition = accessibleViewService.getLastPosition();
            if (!lastPosition) {
                return;
            }
            accessibleViewService.setPosition(lastPosition, true);
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.scrollToTopAccessibleView" /* TerminalCommandId.ScrollToTopAccessibleView */,
        title: (0, nls_1.localize2)('workbench.action.terminal.scrollToTopAccessibleView', 'Scroll to Accessible View Top'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
            linux: { primary: 1024 /* KeyMod.Shift */ | 14 /* KeyCode.Home */ },
            when: accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("terminal" /* AccessibleViewProviderId.Terminal */),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        run: (c, accessor) => {
            const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
            accessibleViewService.setPosition({ lineNumber: 1, column: 1 }, true);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuYWNjZXNzaWJpbGl0eS5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvYWNjZXNzaWJpbGl0eS9icm93c2VyL3Rlcm1pbmFsLmFjY2Vzc2liaWxpdHkuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpQ2hHLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsMkJBQWU7O2lCQUNyQyxPQUFFLEdBQUcsdUJBQXVCLEFBQTFCLENBQTJCO1FBQzdDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBMkI7WUFDckMsT0FBTyxRQUFRLENBQUMsZUFBZSxDQUEyQiwwQkFBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBRUQsWUFDa0IsU0FBNEIsRUFDN0MsY0FBdUMsRUFDdkMsYUFBb0MsRUFDSSxxQkFBNEM7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFMUyxjQUFTLEdBQVQsU0FBUyxDQUFtQjtZQUdMLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7UUFHckYsQ0FBQztRQUNELE1BQU0sQ0FBQyxLQUF5QztZQUMvQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxxQ0FBaUIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDbEgsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lB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