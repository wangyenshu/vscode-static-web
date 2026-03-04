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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/nls", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/clipboard/common/clipboardService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/browser/terminalIcons", "vs/workbench/contrib/terminal/browser/xterm/decorationStyles", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, dom, actions_1, event_1, lifecycle_1, themables_1, nls_1, accessibilitySignalService_1, clipboardService_1, commands_1, configuration_1, contextView_1, instantiation_1, notification_1, opener_1, quickInput_1, themeService_1, terminalIcons_1, decorationStyles_1, terminalColorRegistry_1, lifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecorationAddon = void 0;
    let DecorationAddon = class DecorationAddon extends lifecycle_1.Disposable {
        constructor(_capabilities, _clipboardService, _contextMenuService, _configurationService, _themeService, _openerService, _quickInputService, lifecycleService, _commandService, instantiationService, _accessibilitySignalService, _notificationService) {
            super();
            this._capabilities = _capabilities;
            this._clipboardService = _clipboardService;
            this._contextMenuService = _contextMenuService;
            this._configurationService = _configurationService;
            this._themeService = _themeService;
            this._openerService = _openerService;
            this._quickInputService = _quickInputService;
            this._commandService = _commandService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._notificationService = _notificationService;
            this._capabilityDisposables = new Map();
            this._decorations = new Map();
            this._onDidRequestRunCommand = this._register(new event_1.Emitter());
            this.onDidRequestRunCommand = this._onDidRequestRunCommand.event;
            this._register((0, lifecycle_1.toDisposable)(() => this._dispose()));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */) || e.affectsConfiguration("terminal.integrated.lineHeight" /* TerminalSettingId.LineHeight */)) {
                    this.refreshLayouts();
                }
                else if (e.affectsConfiguration('workbench.colorCustomizations')) {
                    this._refreshStyles(true);
                }
                else if (e.affectsConfiguration("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */)) {
                    this._removeCapabilityDisposables(2 /* TerminalCapability.CommandDetection */);
                    this._updateDecorationVisibility();
                }
            }));
            this._register(this._themeService.onDidColorThemeChange(() => this._refreshStyles(true)));
            this._updateDecorationVisibility();
            this._register(this._capabilities.onDidAddCapabilityType(c => this._createCapabilityDisposables(c)));
            this._register(this._capabilities.onDidRemoveCapabilityType(c => this._removeCapabilityDisposables(c)));
            this._register(lifecycleService.onWillShutdown(() => this._disposeAllDecorations()));
            this._terminalDecorationHoverManager = this._register(instantiationService.createInstance(decorationStyles_1.TerminalDecorationHoverManager));
        }
        _removeCapabilityDisposables(c) {
            const disposables = this._capabilityDisposables.get(c);
            if (disposables) {
                (0, lifecycle_1.dispose)(disposables);
            }
            this._capabilityDisposables.delete(c);
        }
        _createCapabilityDisposables(c) {
            const store = new lifecycle_1.DisposableStore();
            const capability = this._capabilities.get(c);
            if (!capability || this._capabilityDisposables.has(c)) {
                return;
            }
            switch (capability.type) {
                case 4 /* TerminalCapability.BufferMarkDetection */:
                    store.add(capability.onMarkAdded(mark => this.registerMarkDecoration(mark)));
                    break;
                case 2 /* TerminalCapability.CommandDetection */: {
                    const disposables = this._getCommandDetectionListeners(capability);
                    for (const d of disposables) {
                        store.add(d);
                    }
                    break;
                }
            }
            this._capabilityDisposables.set(c, store);
        }
        registerMarkDecoration(mark) {
            if (!this._terminal || (!this._showGutterDecorations && !this._showOverviewRulerDecorations)) {
                return undefined;
            }
            if (mark.hidden) {
                return undefined;
            }
            return this.registerCommandDecoration(undefined, undefined, mark);
        }
        _updateDecorationVisibility() {
            const showDecorations = this._configurationService.getValue("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */);
            this._showGutterDecorations = (showDecorations === 'both' || showDecorations === 'gutter');
            this._showOverviewRulerDecorations = (showDecorations === 'both' || showDecorations === 'overviewRuler');
            this._disposeAllDecorations();
            if (this._showGutterDecorations || this._showOverviewRulerDecorations) {
                this._attachToCommandCapability();
                this._updateGutterDecorationVisibility();
            }
            const currentCommand = this._capabilities.get(2 /* TerminalCapability.CommandDetection */)?.executingCommandObject;
            if (currentCommand) {
                this.registerCommandDecoration(currentCommand, true);
            }
        }
        _disposeAllDecorations() {
            this._placeholderDecoration?.dispose();
            for (const value of this._decorations.values()) {
                value.decoration.dispose();
                (0, lifecycle_1.dispose)(value.disposables);
            }
        }
        _updateGutterDecorationVisibility() {
            const commandDecorationElements = this._terminal?.element?.querySelectorAll("terminal-command-decoration" /* DecorationSelector.CommandDecoration */);
            if (commandDecorationElements) {
                for (const commandDecorationElement of commandDecorationElements) {
                    this._updateCommandDecorationVisibility(commandDecorationElement);
                }
            }
        }
        _updateCommandDecorationVisibility(commandDecorationElement) {
            if (this._showGutterDecorations) {
                commandDecorationElement.classList.remove("hide" /* DecorationSelector.Hide */);
            }
            else {
                commandDecorationElement.classList.add("hide" /* DecorationSelector.Hide */);
            }
        }
        refreshLayouts() {
            (0, decorationStyles_1.updateLayout)(this._configurationService, this._placeholderDecoration?.element);
            for (const decoration of this._decorations) {
                (0, decorationStyles_1.updateLayout)(this._configurationService, decoration[1].decoration.element);
            }
        }
        _refreshStyles(refreshOverviewRulerColors) {
            if (refreshOverviewRulerColors) {
                for (const decoration of this._decorations.values()) {
                    const color = this._getDecorationCssColor(decoration)?.toString() ?? '';
                    if (decoration.decoration.options?.overviewRulerOptions) {
                        decoration.decoration.options.overviewRulerOptions.color = color;
                    }
                    else if (decoration.decoration.options) {
                        decoration.decoration.options.overviewRulerOptions = { color };
                    }
                }
            }
            this._updateClasses(this._placeholderDecoration?.element);
            for (const decoration of this._decorations.values()) {
                this._updateClasses(decoration.decoration.element, decoration.exitCode, decoration.markProperties);
            }
        }
        _dispose() {
            this._terminalDecorationHoverManager.dispose();
            for (const disposable of this._capabilityDisposables.values()) {
                (0, lifecycle_1.dispose)(disposable);
            }
            this.clearDecorations();
        }
        _clearPlaceholder() {
            this._placeholderDecoration?.dispose();
            this._placeholderDecoration = undefined;
        }
        clearDecorations() {
            this._placeholderDecoration?.marker.dispose();
            this._clearPlaceholder();
            this._disposeAllDecorations();
            this._decorations.clear();
        }
        _attachToCommandCapability() {
            if (this._capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                const capability = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
                const disposables = this._getCommandDetectionListeners(capability);
                const store = new lifecycle_1.DisposableStore();
                for (const d of disposables) {
                    store.add(d);
                }
                this._capabilityDisposables.set(2 /* TerminalCapability.CommandDetection */, store);
            }
        }
        _getCommandDetectionListeners(capability) {
            if (this._capabilityDisposables.has(2 /* TerminalCapability.CommandDetection */)) {
                const disposables = this._capabilityDisposables.get(2 /* TerminalCapability.CommandDetection */);
                (0, lifecycle_1.dispose)(disposables);
                this._capabilityDisposables.delete(capability.type);
            }
            const commandDetectionListeners = [];
            // Command started
            if (capability.executingCommandObject?.marker) {
                this.registerCommandDecoration(capability.executingCommandObject, true);
            }
            commandDetectionListeners.push(capability.onCommandStarted(command => this.registerCommandDecoration(command, true)));
            // Command finished
            for (const command of capability.commands) {
                this.registerCommandDecoration(command);
            }
            commandDetectionListeners.push(capability.onCommandFinished(command => {
                this.registerCommandDecoration(command);
                if (command.exitCode) {
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.terminalCommandFailed);
                }
            }));
            // Command invalidated
            commandDetectionListeners.push(capability.onCommandInvalidated(commands => {
                for (const command of commands) {
                    const id = command.marker?.id;
                    if (id) {
                        const match = this._decorations.get(id);
                        if (match) {
                            match.decoration.dispose();
                            (0, lifecycle_1.dispose)(match.disposables);
                        }
                    }
                }
            }));
            // Current command invalidated
            commandDetectionListeners.push(capability.onCurrentCommandInvalidated((request) => {
                if (request.reason === "noProblemsReported" /* CommandInvalidationReason.NoProblemsReported */) {
                    const lastDecoration = Array.from(this._decorations.entries())[this._decorations.size - 1];
                    lastDecoration?.[1].decoration.dispose();
                }
                else if (request.reason === "windows" /* CommandInvalidationReason.Windows */) {
                    this._clearPlaceholder();
                }
            }));
            return commandDetectionListeners;
        }
        activate(terminal) {
            this._terminal = terminal;
            this._attachToCommandCapability();
        }
        registerCommandDecoration(command, beforeCommandExecution, markProperties) {
            if (!this._terminal || (beforeCommandExecution && !command) || (!this._showGutterDecorations && !this._showOverviewRulerDecorations)) {
                return undefined;
            }
            const marker = command?.marker || markProperties?.marker;
            if (!marker) {
                throw new Error(`cannot add a decoration for a command ${JSON.stringify(command)} with no marker`);
            }
            this._clearPlaceholder();
            const color = this._getDecorationCssColor(command)?.toString() ?? '';
            const decoration = this._terminal.registerDecoration({
                marker,
                overviewRulerOptions: this._showOverviewRulerDecorations ? (beforeCommandExecution
                    ? { color, position: 'left' }
                    : { color, position: command?.exitCode ? 'right' : 'left' }) : undefined
            });
            if (!decoration) {
                return undefined;
            }
            if (beforeCommandExecution) {
                this._placeholderDecoration = decoration;
            }
            decoration.onRender(element => {
                if (element.classList.contains(".xterm-decoration-overview-ruler" /* DecorationSelector.OverviewRuler */)) {
                    return;
                }
                if (!this._decorations.get(decoration.marker.id)) {
                    decoration.onDispose(() => this._decorations.delete(decoration.marker.id));
                    this._decorations.set(decoration.marker.id, {
                        decoration,
                        disposables: this._createDisposables(element, command, markProperties),
                        exitCode: command?.exitCode,
                        markProperties: command?.markProperties
                    });
                }
                if (!element.classList.contains("codicon" /* DecorationSelector.Codicon */) || command?.marker?.line === 0) {
                    // first render or buffer was cleared
                    (0, decorationStyles_1.updateLayout)(this._configurationService, element);
                    this._updateClasses(element, command?.exitCode, command?.markProperties || markProperties);
                }
            });
            return decoration;
        }
        _createDisposables(element, command, markProperties) {
            if (command?.exitCode === undefined && !command?.markProperties) {
                return [];
            }
            else if (command?.markProperties || markProperties) {
                return [this._terminalDecorationHoverManager.createHover(element, command || markProperties, markProperties?.hoverMessage)];
            }
            return [...this._createContextMenu(element, command), this._terminalDecorationHoverManager.createHover(element, command)];
        }
        _updateClasses(element, exitCode, markProperties) {
            if (!element) {
                return;
            }
            for (const classes of element.classList) {
                element.classList.remove(classes);
            }
            element.classList.add("terminal-command-decoration" /* DecorationSelector.CommandDecoration */, "codicon" /* DecorationSelector.Codicon */, "xterm-decoration" /* DecorationSelector.XtermDecoration */);
            if (markProperties) {
                element.classList.add("default-color" /* DecorationSelector.DefaultColor */, ...themables_1.ThemeIcon.asClassNameArray(terminalIcons_1.terminalDecorationMark));
                if (!markProperties.hoverMessage) {
                    //disable the mouse pointer
                    element.classList.add("default" /* DecorationSelector.Default */);
                }
            }
            else {
                // command decoration
                this._updateCommandDecorationVisibility(element);
                if (exitCode === undefined) {
                    element.classList.add("default-color" /* DecorationSelector.DefaultColor */, "default" /* DecorationSelector.Default */);
                    element.classList.add(...themables_1.ThemeIcon.asClassNameArray(terminalIcons_1.terminalDecorationIncomplete));
                }
                else if (exitCode) {
                    element.classList.add("error" /* DecorationSelector.ErrorColor */);
                    element.classList.add(...themables_1.ThemeIcon.asClassNameArray(terminalIcons_1.terminalDecorationError));
                }
                else {
                    element.classList.add(...themables_1.ThemeIcon.asClassNameArray(terminalIcons_1.terminalDecorationSuccess));
                }
            }
        }
        _createContextMenu(element, command) {
            // When the xterm Decoration gets disposed of, its element gets removed from the dom
            // along with its listeners
            return [
                dom.addDisposableListener(element, dom.EventType.MOUSE_DOWN, async (e) => {
                    e.stopImmediatePropagation();
                }),
                dom.addDisposableListener(element, dom.EventType.CLICK, async (e) => {
                    e.stopImmediatePropagation();
                    this._terminalDecorationHoverManager.hideHover();
                    const actions = await this._getCommandActions(command);
                    this._contextMenuService.showContextMenu({ getAnchor: () => element, getActions: () => actions });
                }),
                dom.addDisposableListener(element, dom.EventType.CONTEXT_MENU, async (e) => {
                    e.stopImmediatePropagation();
                    this._terminalDecorationHoverManager.hideHover();
                    const actions = this._getContextMenuActions();
                    this._contextMenuService.showContextMenu({ getAnchor: () => element, getActions: () => actions });
                }),
            ];
        }
        _getContextMenuActions() {
            const label = (0, nls_1.localize)('workbench.action.terminal.toggleVisibility', "Toggle Visibility");
            return [
                {
                    class: undefined, tooltip: label, id: 'terminal.toggleVisibility', label, enabled: true,
                    run: async () => {
                        this._showToggleVisibilityQuickPick();
                    }
                }
            ];
        }
        async _getCommandActions(command) {
            const actions = [];
            if (command.command !== '') {
                const labelRun = (0, nls_1.localize)("terminal.rerunCommand", 'Rerun Command');
                actions.push({
                    class: undefined, tooltip: labelRun, id: 'terminal.rerunCommand', label: labelRun, enabled: true,
                    run: async () => {
                        if (command.command === '') {
                            return;
                        }
                        if (!command.isTrusted) {
                            const shouldRun = await new Promise(r => {
                                this._notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('rerun', 'Do you want to run the command: {0}', command.command), [{
                                        label: (0, nls_1.localize)('yes', 'Yes'),
                                        run: () => r(true)
                                    }, {
                                        label: (0, nls_1.localize)('no', 'No'),
                                        run: () => r(false)
                                    }]);
                            });
                            if (!shouldRun) {
                                return;
                            }
                        }
                        this._onDidRequestRunCommand.fire({ command });
                    }
                });
                // The second section is the clipboard section
                actions.push(new actions_1.Separator());
                const labelCopy = (0, nls_1.localize)("terminal.copyCommand", 'Copy Command');
                actions.push({
                    class: undefined, tooltip: labelCopy, id: 'terminal.copyCommand', label: labelCopy, enabled: true,
                    run: () => this._clipboardService.writeText(command.command)
                });
            }
            if (command.hasOutput()) {
                const labelCopyCommandAndOutput = (0, nls_1.localize)("terminal.copyCommandAndOutput", 'Copy Command and Output');
                actions.push({
                    class: undefined, tooltip: labelCopyCommandAndOutput, id: 'terminal.copyCommandAndOutput', label: labelCopyCommandAndOutput, enabled: true,
                    run: () => {
                        const output = command.getOutput();
                        if (typeof output === 'string') {
                            this._clipboardService.writeText(`${command.command !== '' ? command.command + '\n' : ''}${output}`);
                        }
                    }
                });
                const labelText = (0, nls_1.localize)("terminal.copyOutput", 'Copy Output');
                actions.push({
                    class: undefined, tooltip: labelText, id: 'terminal.copyOutput', label: labelText, enabled: true,
                    run: () => {
                        const text = command.getOutput();
                        if (typeof text === 'string') {
                            this._clipboardService.writeText(text);
                        }
                    }
                });
                const labelHtml = (0, nls_1.localize)("terminal.copyOutputAsHtml", 'Copy Output as HTML');
                actions.push({
                    class: undefined, tooltip: labelHtml, id: 'terminal.copyOutputAsHtml', label: labelHtml, enabled: true,
                    run: () => this._onDidRequestRunCommand.fire({ command, copyAsHtml: true })
                });
            }
            if (actions.length > 0) {
                actions.push(new actions_1.Separator());
            }
            const labelRunRecent = (0, nls_1.localize)('workbench.action.terminal.runRecentCommand', "Run Recent Command");
            actions.push({
                class: undefined, tooltip: labelRunRecent, id: 'workbench.action.terminal.runRecentCommand', label: labelRunRecent, enabled: true,
                run: () => this._commandService.executeCommand('workbench.action.terminal.runRecentCommand')
            });
            const labelGoToRecent = (0, nls_1.localize)('workbench.action.terminal.goToRecentDirectory', "Go To Recent Directory");
            actions.push({
                class: undefined, tooltip: labelRunRecent, id: 'workbench.action.terminal.goToRecentDirectory', label: labelGoToRecent, enabled: true,
                run: () => this._commandService.executeCommand('workbench.action.terminal.goToRecentDirectory')
            });
            actions.push(new actions_1.Separator());
            const labelAbout = (0, nls_1.localize)("terminal.learnShellIntegration", 'Learn About Shell Integration');
            actions.push({
                class: undefined, tooltip: labelAbout, id: 'terminal.learnShellIntegration', label: labelAbout, enabled: true,
                run: () => this._openerService.open('https://code.visualstudio.com/docs/terminal/shell-integration')
            });
            return actions;
        }
        _showToggleVisibilityQuickPick() {
            const quickPick = this._quickInputService.createQuickPick();
            quickPick.hideInput = true;
            quickPick.hideCheckAll = true;
            quickPick.canSelectMany = true;
            quickPick.title = (0, nls_1.localize)('toggleVisibility', 'Toggle visibility');
            const configValue = this._configurationService.getValue("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */);
            const gutterIcon = {
                label: (0, nls_1.localize)('gutter', 'Gutter command decorations'),
                picked: configValue !== 'never' && configValue !== 'overviewRuler'
            };
            const overviewRulerIcon = {
                label: (0, nls_1.localize)('overviewRuler', 'Overview ruler command decorations'),
                picked: configValue !== 'never' && configValue !== 'gutter'
            };
            quickPick.items = [gutterIcon, overviewRulerIcon];
            const selectedItems = [];
            if (configValue !== 'never') {
                if (configValue !== 'gutter') {
                    selectedItems.push(gutterIcon);
                }
                if (configValue !== 'overviewRuler') {
                    selectedItems.push(overviewRulerIcon);
                }
            }
            quickPick.selectedItems = selectedItems;
            quickPick.onDidChangeSelection(async (e) => {
                let newValue = 'never';
                if (e.includes(gutterIcon)) {
                    if (e.includes(overviewRulerIcon)) {
                        newValue = 'both';
                    }
                    else {
                        newValue = 'gutter';
                    }
                }
                else if (e.includes(overviewRulerIcon)) {
                    newValue = 'overviewRuler';
                }
                await this._configurationService.updateValue("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */, newValue);
            });
            quickPick.ok = false;
            quickPick.show();
        }
        _getDecorationCssColor(decorationOrCommand) {
            let colorId;
            if (decorationOrCommand?.exitCode === undefined) {
                colorId = terminalColorRegistry_1.TERMINAL_COMMAND_DECORATION_DEFAULT_BACKGROUND_COLOR;
            }
            else {
                colorId = decorationOrCommand.exitCode ? terminalColorRegistry_1.TERMINAL_COMMAND_DECORATION_ERROR_BACKGROUND_COLOR : terminalColorRegistry_1.TERMINAL_COMMAND_DECORATION_SUCCESS_BACKGROUND_COLOR;
            }
            return this._themeService.getColorTheme().getColor(colorId)?.toString();
        }
    };
    exports.DecorationAddon = DecorationAddon;
    exports.DecorationAddon = DecorationAddon = __decorate([
        __param(1, clipboardService_1.IClipboardService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, themeService_1.IThemeService),
        __param(5, opener_1.IOpenerService),
        __param(6, quickInput_1.IQuickInputService),
        __param(7, lifecycle_2.ILifecycleService),
        __param(8, commands_1.ICommandService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(11, notification_1.INotificationService)
    ], DecorationAddon);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvbkFkZG9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci94dGVybS9kZWNvcmF0aW9uQWRkb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNEJ6RixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHNCQUFVO1FBWTlDLFlBQ2tCLGFBQXVDLEVBQ3JDLGlCQUFxRCxFQUNuRCxtQkFBeUQsRUFDdkQscUJBQTZELEVBQ3JFLGFBQTZDLEVBQzVDLGNBQStDLEVBQzNDLGtCQUF1RCxFQUN4RCxnQkFBbUMsRUFDckMsZUFBaUQsRUFDM0Msb0JBQTJDLEVBQ3JDLDJCQUF5RSxFQUNoRixvQkFBMkQ7WUFFakYsS0FBSyxFQUFFLENBQUM7WUFiUyxrQkFBYSxHQUFiLGFBQWEsQ0FBMEI7WUFDcEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNsQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQ3RDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDcEQsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDM0IsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQzFCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFFekMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBRXBCLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFDL0QseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQXRCMUUsMkJBQXNCLEdBQTZDLElBQUksR0FBRyxFQUFFLENBQUM7WUFDN0UsaUJBQVksR0FBdUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQU1wRCw0QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF1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