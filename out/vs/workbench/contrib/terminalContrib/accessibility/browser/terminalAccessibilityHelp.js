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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, strings_1, nls_1, accessibility_1, commands_1, contextkey_1, instantiation_1, keybinding_1, accessibilityConfiguration_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalAccessibilityHelpProvider = exports.ClassName = void 0;
    var ClassName;
    (function (ClassName) {
        ClassName["Active"] = "active";
        ClassName["EditorTextArea"] = "textarea";
    })(ClassName || (exports.ClassName = ClassName = {}));
    let TerminalAccessibilityHelpProvider = class TerminalAccessibilityHelpProvider extends lifecycle_1.Disposable {
        onClose() {
            const expr = contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal-help" /* AccessibleViewProviderId.TerminalHelp */));
            if (expr?.evaluate(this._contextKeyService.getContext(null))) {
                this._commandService.executeCommand("workbench.action.terminal.focusAccessibleBuffer" /* TerminalCommandId.FocusAccessibleBuffer */);
            }
            else {
                this._instance.focus();
            }
            this.dispose();
        }
        constructor(_instance, _xterm, _instantiationService, _keybindingService, _contextKeyService, _commandService, _accessibilityService, _configurationService) {
            super();
            this._instance = _instance;
            this._keybindingService = _keybindingService;
            this._contextKeyService = _contextKeyService;
            this._commandService = _commandService;
            this._accessibilityService = _accessibilityService;
            this._configurationService = _configurationService;
            this.id = "terminal-help" /* AccessibleViewProviderId.TerminalHelp */;
            this._hasShellIntegration = false;
            this.options = {
                type: "help" /* AccessibleViewType.Help */,
                readMoreUrl: 'https://code.visualstudio.com/docs/editor/accessibility#_terminal-accessibility'
            };
            this.verbositySettingKey = "accessibility.verbosity.terminal" /* AccessibilityVerbositySettingId.Terminal */;
            this._hasShellIntegration = _xterm.shellIntegration.status === 2 /* ShellIntegrationStatus.VSCode */;
        }
        _descriptionForCommand(commandId, msg, noKbMsg) {
            if (commandId === "workbench.action.terminal.runRecentCommand" /* TerminalCommandId.RunRecentCommand */) {
                const kb = this._keybindingService.lookupKeybindings(commandId);
                // Run recent command has multiple keybindings. lookupKeybinding just returns the first one regardless of the when context.
                // Thus, we have to check if accessibility mode is enabled to determine which keybinding to use.
                const isScreenReaderOptimized = this._accessibilityService.isScreenReaderOptimized();
                if (isScreenReaderOptimized && kb[1]) {
                    (0, strings_1.format)(msg, kb[1].getAriaLabel());
                }
                else if (kb[0]) {
                    (0, strings_1.format)(msg, kb[0].getAriaLabel());
                }
                else {
                    return (0, strings_1.format)(noKbMsg, commandId);
                }
            }
            const kb = this._keybindingService.lookupKeybinding(commandId, this._contextKeyService)?.getAriaLabel();
            return !kb ? (0, strings_1.format)(noKbMsg, commandId) : (0, strings_1.format)(msg, kb);
        }
        provideContent() {
            const content = [];
            content.push(this._descriptionForCommand("workbench.action.terminal.focusAccessibleBuffer" /* TerminalCommandId.FocusAccessibleBuffer */, (0, nls_1.localize)('focusAccessibleTerminalView', 'The Focus Accessible Terminal View ({0}) command enables screen readers to read terminal contents.'), (0, nls_1.localize)('focusAccessibleTerminalViewNoKb', 'The Focus Terminal Accessible View command enables screen readers to read terminal contents and is currently not triggerable by a keybinding.')));
            content.push((0, nls_1.localize)('preserveCursor', 'Customize the behavior of the cursor when toggling between the terminal and accessible view with `terminal.integrated.accessibleViewPreserveCursorPosition.`'));
            if (!this._configurationService.getValue("terminal.integrated.accessibleViewFocusOnCommandExecution" /* TerminalSettingId.AccessibleViewFocusOnCommandExecution */)) {
                content.push((0, nls_1.localize)('focusViewOnExecution', 'Enable `terminal.integrated.accessibleViewFocusOnCommandExecution` to automatically focus the terminal accessible view when a command is executed in the terminal.'));
            }
            if (this._instance.shellType === "cmd" /* WindowsShellType.CommandPrompt */) {
                content.push((0, nls_1.localize)('commandPromptMigration', "Consider using powershell instead of command prompt for an improved experience"));
            }
            if (this._hasShellIntegration) {
                const shellIntegrationCommandList = [];
                shellIntegrationCommandList.push((0, nls_1.localize)('shellIntegration', "The terminal has a feature called shell integration that offers an enhanced experience and provides useful commands for screen readers such as:"));
                shellIntegrationCommandList.push('- ' + this._descriptionForCommand("workbench.action.terminal.accessibleBufferGoToNextCommand" /* TerminalCommandId.AccessibleBufferGoToNextCommand */, (0, nls_1.localize)('goToNextCommand', 'Go to Next Command ({0}) in the accessible view'), (0, nls_1.localize)('goToNextCommandNoKb', 'Go to Next Command in the accessible view is currently not triggerable by a keybinding.')));
                shellIntegrationCommandList.push('- ' + this._descriptionForCommand("workbench.action.terminal.accessibleBufferGoToPreviousCommand" /* TerminalCommandId.AccessibleBufferGoToPreviousCommand */, (0, nls_1.localize)('goToPreviousCommand', 'Go to Previous Command ({0}) in the accessible view'), (0, nls_1.localize)('goToPreviousCommandNoKb', 'Go to Previous Command in the accessible view is currently not triggerable by a keybinding.')));
                shellIntegrationCommandList.push('- ' + this._descriptionForCommand("editor.action.accessibleViewGoToSymbol" /* AccessibilityCommandId.GoToSymbol */, (0, nls_1.localize)('goToSymbol', 'Go to Symbol ({0})'), (0, nls_1.localize)('goToSymbolNoKb', 'Go to symbol is currently not triggerable by a keybinding.')));
                shellIntegrationCommandList.push('- ' + this._descriptionForCommand("workbench.action.terminal.runRecentCommand" /* TerminalCommandId.RunRecentCommand */, (0, nls_1.localize)('runRecentCommand', 'Run Recent Command ({0})'), (0, nls_1.localize)('runRecentCommandNoKb', 'Run Recent Command is currently not triggerable by a keybinding.')));
                shellIntegrationCommandList.push('- ' + this._descriptionForCommand("workbench.action.terminal.goToRecentDirectory" /* TerminalCommandId.GoToRecentDirectory */, (0, nls_1.localize)('goToRecentDirectory', 'Go to Recent Directory ({0})'), (0, nls_1.localize)('goToRecentDirectoryNoKb', 'Go to Recent Directory is currently not triggerable by a keybinding.')));
                content.push(shellIntegrationCommandList.join('\n'));
            }
            else {
                content.push(this._descriptionForCommand("workbench.action.terminal.runRecentCommand" /* TerminalCommandId.RunRecentCommand */, (0, nls_1.localize)('goToRecentDirectoryNoShellIntegration', 'The Go to Recent Directory command ({0}) enables screen readers to easily navigate to a directory that has been used in the terminal.'), (0, nls_1.localize)('goToRecentDirectoryNoKbNoShellIntegration', 'The Go to Recent Directory command enables screen readers to easily navigate to a directory that has been used in the terminal and is currently not triggerable by a keybinding.')));
            }
            content.push(this._descriptionForCommand("workbench.action.terminal.openDetectedLink" /* TerminalCommandId.OpenDetectedLink */, (0, nls_1.localize)('openDetectedLink', 'The Open Detected Link ({0}) command enables screen readers to easily open links found in the terminal.'), (0, nls_1.localize)('openDetectedLinkNoKb', 'The Open Detected Link command enables screen readers to easily open links found in the terminal and is currently not triggerable by a keybinding.')));
            content.push(this._descriptionForCommand("workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */, (0, nls_1.localize)('newWithProfile', 'The Create New Terminal (With Profile) ({0}) command allows for easy terminal creation using a specific profile.'), (0, nls_1.localize)('newWithProfileNoKb', 'The Create New Terminal (With Profile) command allows for easy terminal creation using a specific profile and is currently not triggerable by a keybinding.')));
            content.push((0, nls_1.localize)('focusAfterRun', 'Configure what gets focused after running selected text in the terminal with `{0}`.', "terminal.integrated.focusAfterRun" /* TerminalSettingId.FocusAfterRun */));
            return content.join('\n\n');
        }
    };
    exports.TerminalAccessibilityHelpProvider = TerminalAccessibilityHelpProvider;
    exports.TerminalAccessibilityHelpProvider = TerminalAccessibilityHelpProvider = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, commands_1.ICommandService),
        __param(6, accessibility_1.IAccessibilityService),
        __param(7, configuration_1.IConfigurationService)
    ], TerminalAccessibilityHelpProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxBY2Nlc3NpYmlsaXR5SGVscC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9hY2Nlc3NpYmlsaXR5L2Jyb3dzZXIvdGVybWluYWxBY2Nlc3NpYmlsaXR5SGVscC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLElBQWtCLFNBR2pCO0lBSEQsV0FBa0IsU0FBUztRQUMxQiw4QkFBaUIsQ0FBQTtRQUNqQix3Q0FBMkIsQ0FBQTtJQUM1QixDQUFDLEVBSGlCLFNBQVMseUJBQVQsU0FBUyxRQUcxQjtJQUVNLElBQU0saUNBQWlDLEdBQXZDLE1BQU0saUNBQWtDLFNBQVEsc0JBQVU7UUFHaEUsT0FBTztZQUNOLE1BQU0sSUFBSSxHQUFHLDJCQUFjLENBQUMsR0FBRyxDQUFDLGtEQUFxQixFQUFFLDJCQUFjLENBQUMsTUFBTSxDQUFDLDREQUErQixDQUFDLEdBQUcsOERBQXdDLENBQUMsQ0FBQztZQUMxSixJQUFJLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzlELElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxpR0FBeUMsQ0FBQztZQUM5RSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN4QixDQUFDO1lBQ0QsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFPRCxZQUNrQixTQUE2RyxFQUM5SCxNQUFnRixFQUN6RCxxQkFBNEMsRUFDL0Msa0JBQXVELEVBQ3ZELGtCQUF1RCxFQUMxRCxlQUFpRCxFQUMzQyxxQkFBNkQsRUFDN0Qs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