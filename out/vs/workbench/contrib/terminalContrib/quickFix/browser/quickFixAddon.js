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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/arrays", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/workbench/contrib/terminal/browser/xterm/decorationStyles", "vs/platform/telemetry/common/telemetry", "vs/base/common/cancellation", "vs/workbench/services/extensions/common/extensions", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/actionWidget/browser/actionWidget", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/platform/label/common/label", "vs/base/common/network", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix", "vs/editor/contrib/codeAction/common/types", "vs/base/common/codicons", "vs/base/common/themables", "vs/platform/commands/common/commands"], function (require, exports, event_1, lifecycle_1, dom, arrays_1, nls_1, configuration_1, opener_1, decorationStyles_1, telemetry_1, cancellation_1, extensions_1, accessibilitySignalService_1, actionWidget_1, commandDetectionCapability_1, label_1, network_1, quickFix_1, types_1, codicons_1, themables_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalQuickFixAddon = void 0;
    exports.getQuickFixesForCommand = getQuickFixesForCommand;
    const quickFixClasses = [
        "quick-fix" /* DecorationSelector.QuickFix */,
        "codicon" /* DecorationSelector.Codicon */,
        "terminal-command-decoration" /* DecorationSelector.CommandDecoration */,
        "xterm-decoration" /* DecorationSelector.XtermDecoration */
    ];
    let TerminalQuickFixAddon = class TerminalQuickFixAddon extends lifecycle_1.Disposable {
        constructor(_aliases, _capabilities, _quickFixService, _commandService, _configurationService, _accessibilitySignalService, _openerService, _telemetryService, _extensionService, _actionWidgetService, _labelService) {
            super();
            this._aliases = _aliases;
            this._capabilities = _capabilities;
            this._quickFixService = _quickFixService;
            this._commandService = _commandService;
            this._configurationService = _configurationService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._openerService = _openerService;
            this._telemetryService = _telemetryService;
            this._extensionService = _extensionService;
            this._actionWidgetService = _actionWidgetService;
            this._labelService = _labelService;
            this._onDidRequestRerunCommand = new event_1.Emitter();
            this.onDidRequestRerunCommand = this._onDidRequestRerunCommand.event;
            this._commandListeners = new Map();
            this._registeredSelectors = new Set();
            const commandDetectionCapability = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (commandDetectionCapability) {
                this._registerCommandHandlers();
            }
            else {
                this._register(this._capabilities.onDidAddCapabilityType(c => {
                    if (c === 2 /* TerminalCapability.CommandDetection */) {
                        this._registerCommandHandlers();
                    }
                }));
            }
            this._register(this._quickFixService.onDidRegisterProvider(result => this.registerCommandFinishedListener(convertToQuickFixOptions(result))));
            this._quickFixService.extensionQuickFixes.then(quickFixSelectors => {
                for (const selector of quickFixSelectors) {
                    this.registerCommandSelector(selector);
                }
            });
            this._register(this._quickFixService.onDidRegisterCommandSelector(selector => this.registerCommandSelector(selector)));
            this._register(this._quickFixService.onDidUnregisterProvider(id => this._commandListeners.delete(id)));
        }
        activate(terminal) {
            this._terminal = terminal;
        }
        showMenu() {
            if (!this._currentRenderContext) {
                return;
            }
            // TODO: What's documentation do? Need a vscode command?
            const actions = this._currentRenderContext.quickFixes.map(f => new TerminalQuickFixItem(f, f.type, f.source, f.label, f.kind));
            const documentation = this._currentRenderContext.quickFixes.map(f => { return { id: f.source, title: f.label, tooltip: f.source }; });
            const actionSet = {
                // TODO: Documentation and actions are separate?
                documentation,
                allActions: actions,
                hasAutoFix: false,
                hasAIFix: false,
                allAIFixes: false,
                validActions: actions,
                dispose: () => { }
            };
            const delegate = {
                onSelect: async (fix) => {
                    fix.action?.run();
                    this._actionWidgetService.hide();
                    this._disposeQuickFix(fix.action.id, true);
                },
                onHide: () => {
                    this._terminal?.focus();
                },
            };
            this._actionWidgetService.show('quickFixWidget', false, toActionWidgetItems(actionSet.validActions, true), delegate, this._currentRenderContext.anchor, this._currentRenderContext.parentElement);
        }
        registerCommandSelector(selector) {
            if (this._registeredSelectors.has(selector.id)) {
                return;
            }
            const matcherKey = selector.commandLineMatcher.toString();
            const currentOptions = this._commandListeners.get(matcherKey) || [];
            currentOptions.push({
                id: selector.id,
                type: 'unresolved',
                commandLineMatcher: selector.commandLineMatcher,
                outputMatcher: selector.outputMatcher,
                commandExitResult: selector.commandExitResult,
                kind: selector.kind
            });
            this._registeredSelectors.add(selector.id);
            this._commandListeners.set(matcherKey, currentOptions);
        }
        registerCommandFinishedListener(options) {
            const matcherKey = options.commandLineMatcher.toString();
            let currentOptions = this._commandListeners.get(matcherKey) || [];
            // removes the unresolved options
            currentOptions = currentOptions.filter(o => o.id !== options.id);
            currentOptions.push(options);
            this._commandListeners.set(matcherKey, currentOptions);
        }
        _registerCommandHandlers() {
            const terminal = this._terminal;
            const commandDetection = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (!terminal || !commandDetection) {
                return;
            }
            this._register(commandDetection.onCommandFinished(async (command) => await this._resolveQuickFixes(command, this._aliases)));
        }
        /**
         * Resolves quick fixes, if any, based on the
         * @param command & its output
         */
        async _resolveQuickFixes(command, aliases) {
            const terminal = this._terminal;
            if (!terminal || command.wasReplayed) {
                return;
            }
            if (command.command !== '' && this._lastQuickFixId) {
                this._disposeQuickFix(this._lastQuickFixId, false);
            }
            const resolver = async (selector, lines) => {
                if (lines === undefined) {
                    return undefined;
                }
                const id = selector.id;
                await this._extensionService.activateByEvent(`onTerminalQuickFixRequest:${id}`);
                return this._quickFixService.providers.get(id)?.provideTerminalQuickFixes(command, lines, {
                    type: 'resolved',
                    commandLineMatcher: selector.commandLineMatcher,
                    outputMatcher: selector.outputMatcher,
                    commandExitResult: selector.commandExitResult,
                    kind: selector.kind,
                    id: selector.id
                }, new cancellation_1.CancellationTokenSource().token);
            };
            const result = await getQuickFixesForCommand(aliases, terminal, command, this._commandListeners, this._commandService, this._openerService, this._labelService, this._onDidRequestRerunCommand, resolver);
            if (!result) {
                return;
            }
            this._quickFixes = result;
            this._lastQuickFixId = this._quickFixes[0].id;
            this._registerQuickFixDecoration();
        }
        _disposeQuickFix(id, ranQuickFix) {
            this._telemetryService?.publicLog2('terminal/quick-fix', {
                quickFixId: id,
                ranQuickFix
            });
            this._decoration?.dispose();
            this._decoration = undefined;
            this._quickFixes = undefined;
            this._lastQuickFixId = undefined;
        }
        /**
         * Registers a decoration with the quick fixes
         */
        _registerQuickFixDecoration() {
            if (!this._terminal) {
                return;
            }
            if (!this._quickFixes) {
                return;
            }
            const marker = this._terminal.registerMarker();
            if (!marker) {
                return;
            }
            const decoration = this._terminal.registerDecoration({ marker, layer: 'top' });
            if (!decoration) {
                return;
            }
            this._decoration = decoration;
            const fixes = this._quickFixes;
            if (!fixes) {
                decoration.dispose();
                return;
            }
            decoration?.onRender((e) => {
                const rect = e.getBoundingClientRect();
                const anchor = {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height
                };
                if (e.classList.contains("quick-fix" /* DecorationSelector.QuickFix */)) {
                    if (this._currentRenderContext) {
                        this._currentRenderContext.anchor = anchor;
                    }
                    return;
                }
                e.classList.add(...quickFixClasses);
                const isExplainOnly = fixes.every(e => e.kind === 'explain');
                if (isExplainOnly) {
                    e.classList.add('explainOnly');
                }
                e.classList.add(...themables_1.ThemeIcon.asClassNameArray(isExplainOnly ? codicons_1.Codicon.sparkle : codicons_1.Codicon.lightBulb));
                (0, decorationStyles_1.updateLayout)(this._configurationService, e);
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.terminalQuickFix);
                const parentElement = e.closest('.xterm').parentElement;
                if (!parentElement) {
                    return;
                }
                this._currentRenderContext = { quickFixes: fixes, anchor, parentElement };
                this._register(dom.addDisposableListener(e, dom.EventType.CLICK, () => this.showMenu()));
            });
            decoration.onDispose(() => this._currentRenderContext = undefined);
            this._quickFixes = undefined;
        }
    };
    exports.TerminalQuickFixAddon = TerminalQuickFixAddon;
    exports.TerminalQuickFixAddon = TerminalQuickFixAddon = __decorate([
        __param(2, quickFix_1.ITerminalQuickFixService),
        __param(3, commands_1.ICommandService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(6, opener_1.IOpenerService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, extensions_1.IExtensionService),
        __param(9, actionWidget_1.IActionWidgetService),
        __param(10, label_1.ILabelService)
    ], TerminalQuickFixAddon);
    async function getQuickFixesForCommand(aliases, terminal, terminalCommand, quickFixOptions, commandService, openerService, labelService, onDidRequestRerunCommand, getResolvedFixes) {
        // Prevent duplicates by tracking added entries
        const commandQuickFixSet = new Set();
        const openQuickFixSet = new Set();
        const fixes = [];
        const newCommand = terminalCommand.command;
        for (const options of quickFixOptions.values()) {
            for (const option of options) {
                if ((option.commandExitResult === 'success' && terminalCommand.exitCode !== 0) || (option.commandExitResult === 'error' && terminalCommand.exitCode === 0)) {
                    continue;
                }
                let quickFixes;
                if (option.type === 'resolved') {
                    quickFixes = await option.getQuickFixes(terminalCommand, (0, commandDetectionCapability_1.getLinesForCommand)(terminal.buffer.active, terminalCommand, terminal.cols, option.outputMatcher), option, new cancellation_1.CancellationTokenSource().token);
                }
                else if (option.type === 'unresolved') {
                    if (!getResolvedFixes) {
                        throw new Error('No resolved fix provider');
                    }
                    quickFixes = await getResolvedFixes(option, option.outputMatcher ? (0, commandDetectionCapability_1.getLinesForCommand)(terminal.buffer.active, terminalCommand, terminal.cols, option.outputMatcher) : undefined);
                }
                else if (option.type === 'internal') {
                    const commandLineMatch = newCommand.match(option.commandLineMatcher);
                    if (!commandLineMatch) {
                        continue;
                    }
                    const outputMatcher = option.outputMatcher;
                    let outputMatch;
                    if (outputMatcher) {
                        outputMatch = terminalCommand.getOutputMatch(outputMatcher);
                    }
                    if (!outputMatch) {
                        continue;
                    }
                    const matchResult = { commandLineMatch, outputMatch, commandLine: terminalCommand.command };
                    quickFixes = option.getQuickFixes(matchResult);
                }
                if (quickFixes) {
                    for (const quickFix of (0, arrays_1.asArray)(quickFixes)) {
                        let action;
                        if ('type' in quickFix) {
                            switch (quickFix.type) {
                                case quickFix_1.TerminalQuickFixType.TerminalCommand: {
                                    const fix = quickFix;
                                    if (commandQuickFixSet.has(fix.terminalCommand)) {
                                        continue;
                                    }
                                    commandQuickFixSet.add(fix.terminalCommand);
                                    const label = (0, nls_1.localize)('quickFix.command', 'Run: {0}', fix.terminalCommand);
                                    action = {
                                        type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                                        kind: option.kind,
                                        class: undefined,
                                        source: quickFix.source,
                                        id: quickFix.id,
                                        label,
                                        enabled: true,
                                        run: () => {
                                            onDidRequestRerunCommand?.fire({
                                                command: fix.terminalCommand,
                                                shouldExecute: fix.shouldExecute ?? true
                                            });
                                        },
                                        tooltip: label,
                                        command: fix.terminalCommand,
                                        shouldExecute: fix.shouldExecute
                                    };
                                    break;
                                }
                                case quickFix_1.TerminalQuickFixType.Opener: {
                                    const fix = quickFix;
                                    if (!fix.uri) {
                                        return;
                                    }
                                    if (openQuickFixSet.has(fix.uri.toString())) {
                                        continue;
                                    }
                                    openQuickFixSet.add(fix.uri.toString());
                                    const isUrl = (fix.uri.scheme === network_1.Schemas.http || fix.uri.scheme === network_1.Schemas.https);
                                    const uriLabel = isUrl ? encodeURI(fix.uri.toString(true)) : labelService.getUriLabel(fix.uri);
                                    const label = (0, nls_1.localize)('quickFix.opener', 'Open: {0}', uriLabel);
                                    action = {
                                        source: quickFix.source,
                                        id: quickFix.id,
                                        label,
                                        type: quickFix_1.TerminalQuickFixType.Opener,
                                        kind: option.kind,
                                        class: undefined,
                                        enabled: true,
                                        run: () => openerService.open(fix.uri),
                                        tooltip: label,
                                        uri: fix.uri
                                    };
                                    break;
                                }
                                case quickFix_1.TerminalQuickFixType.Port: {
                                    const fix = quickFix;
                                    action = {
                                        source: 'builtin',
                                        type: fix.type,
                                        kind: option.kind,
                                        id: fix.id,
                                        label: fix.label,
                                        class: fix.class,
                                        enabled: fix.enabled,
                                        run: () => {
                                            fix.run();
                                        },
                                        tooltip: fix.tooltip
                                    };
                                    break;
                                }
                                case quickFix_1.TerminalQuickFixType.VscodeCommand: {
                                    const fix = quickFix;
                                    action = {
                                        source: quickFix.source,
                                        type: fix.type,
                                        kind: option.kind,
                                        id: fix.id,
                                        label: fix.title,
                                        class: undefined,
                                        enabled: true,
                                        run: () => commandService.executeCommand(fix.id),
                                        tooltip: fix.title
                                    };
                                    break;
                                }
                            }
                            if (action) {
                                fixes.push(action);
                            }
                        }
                    }
                }
            }
        }
        return fixes.length > 0 ? fixes : undefined;
    }
    function convertToQuickFixOptions(selectorProvider) {
        return {
            id: selectorProvider.selector.id,
            type: 'resolved',
            commandLineMatcher: selectorProvider.selector.commandLineMatcher,
            outputMatcher: selectorProvider.selector.outputMatcher,
            commandExitResult: selectorProvider.selector.commandExitResult,
            kind: selectorProvider.selector.kind,
            getQuickFixes: selectorProvider.provider.provideTerminalQuickFixes
        };
    }
    class TerminalQuickFixItem {
        constructor(action, type, source, title, kind = 'fix') {
            this.action = action;
            this.type = type;
            this.source = source;
            this.title = title;
            this.kind = kind;
            this.disabled = false;
        }
    }
    function toActionWidgetItems(inputQuickFixes, showHeaders) {
        const menuItems = [];
        menuItems.push({
            kind: "header" /* ActionListItemKind.Header */,
            group: {
                kind: types_1.CodeActionKind.QuickFix,
                title: (0, nls_1.localize)('codeAction.widget.id.quickfix', 'Quick Fix')
            }
        });
        for (const quickFix of showHeaders ? inputQuickFixes : inputQuickFixes.filter(i => !!i.action)) {
            if (!quickFix.disabled && quickFix.action) {
                menuItems.push({
                    kind: "action" /* ActionListItemKind.Action */,
                    item: quickFix,
                    group: {
                        kind: types_1.CodeActionKind.QuickFix,
                        icon: getQuickFixIcon(quickFix),
                        title: quickFix.action.label
                    },
                    disabled: false,
                    label: quickFix.title
                });
            }
        }
        return menuItems;
    }
    function getQuickFixIcon(quickFix) {
        if (quickFix.kind === 'explain') {
            return codicons_1.Codicon.sparkle;
        }
        switch (quickFix.type) {
            case quickFix_1.TerminalQuickFixType.Opener:
                if ('uri' in quickFix.action && quickFix.action.uri) {
                    const isUrl = (quickFix.action.uri.scheme === network_1.Schemas.http || quickFix.action.uri.scheme === network_1.Schemas.https);
                    return isUrl ? codicons_1.Codicon.linkExternal : codicons_1.Codicon.goToFile;
                }
            case quickFix_1.TerminalQuickFixType.TerminalCommand:
                return codicons_1.Codicon.run;
            case quickFix_1.TerminalQuickFixType.Port:
                return codicons_1.Codicon.debugDisconnect;
            case quickFix_1.TerminalQuickFixType.VscodeCommand:
                return codicons_1.Codicon.lightbulb;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tGaXhBZGRvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9xdWlja0ZpeC9icm93c2VyL3F1aWNrRml4QWRkb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbVRoRywwREFtSkM7SUFuYUQsTUFBTSxlQUFlLEdBQUc7Ozs7O0tBS3ZCLENBQUM7SUFZSyxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBa0JwRCxZQUNrQixRQUFnQyxFQUNoQyxhQUF1QyxFQUM5QixnQkFBMkQsRUFDcEUsZUFBaUQsRUFDM0MscUJBQTZELEVBQ3ZELDJCQUF5RSxFQUN0RixjQUErQyxFQUM1QyxpQkFBcUQsRUFDckQsaUJBQXFELEVBQ2xELG9CQUEyRCxFQUNsRSxhQUE2QztZQUU1RCxLQUFLLEVBQUUsQ0FBQztZQVpTLGFBQVEsR0FBUixRQUFRLENBQXdCO1lBQ2hDLGtCQUFhLEdBQWIsYUFBYSxDQUEwQjtZQUNiLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBMEI7WUFDbkQsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQzFCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDdEMsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE2QjtZQUNyRSxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNwQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ2pDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDakQsa0JBQWEsR0FBYixhQUFhLENBQWU7WUE1QjVDLDhCQUF5QixHQUFHLElBQUksZUFBTyxFQUFnRCxDQUFDO1lBQ2hHLDZCQUF3QixHQUFHLElB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