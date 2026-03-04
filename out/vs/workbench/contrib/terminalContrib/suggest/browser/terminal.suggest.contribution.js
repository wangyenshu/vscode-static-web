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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/nls", "vs/platform/configuration/common/configuration"], function (require, exports, dom, lifecycle_1, instantiation_1, terminalExtensions_1, terminalSuggestAddon_1, terminal_1, contextkey_1, terminalContextKey_1, terminalActions_1, nls_1, configuration_1) {
    "use strict";
    var TerminalSuggestContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalSuggestContribution = class TerminalSuggestContribution extends lifecycle_1.DisposableStore {
        static { TerminalSuggestContribution_1 = this; }
        static { this.ID = 'terminal.suggest'; }
        static get(instance) {
            return instance.getContribution(TerminalSuggestContribution_1.ID);
        }
        get addon() { return this._addon.value; }
        constructor(_instance, _processManager, widgetManager, _contextKeyService, _configurationService, _instantiationService) {
            super();
            this._instance = _instance;
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._instantiationService = _instantiationService;
            this._addon = new lifecycle_1.MutableDisposable();
            this._terminalSuggestWidgetContextKeys = new Set(terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible.key);
            this.add((0, lifecycle_1.toDisposable)(() => this._addon?.dispose()));
            this._terminalSuggestWidgetVisibleContextKey = terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible.bindTo(this._contextKeyService);
        }
        xtermOpen(xterm) {
            this._loadSuggestAddon(xterm.raw);
            this.add(this._contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(this._terminalSuggestWidgetContextKeys)) {
                    this._loadSuggestAddon(xterm.raw);
                }
            }));
            this.add(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.sendKeybindingsToShell" /* TerminalSettingId.SendKeybindingsToShell */)) {
                    this._loadSuggestAddon(xterm.raw);
                }
            }));
        }
        _loadSuggestAddon(xterm) {
            const sendingKeybindingsToShell = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).sendKeybindingsToShell;
            if (sendingKeybindingsToShell) {
                this._addon.dispose();
                return;
            }
            if (this._terminalSuggestWidgetVisibleContextKey) {
                this._addon.value = this._instantiationService.createInstance(terminalSuggestAddon_1.SuggestAddon, this._instance.capabilities, this._terminalSuggestWidgetVisibleContextKey);
                xterm.loadAddon(this._addon.value);
                this._addon.value.setPanel(dom.findParentWithClass(xterm.element, 'panel'));
                this._addon.value.setScreen(xterm.element.querySelector('.xterm-screen'));
                this.add(this._instance.onDidBlur(() => this._addon.value?.hideSuggestWidget()));
                this.add(this._addon.value.onAcceptedCompletion(async (text) => {
                    this._instance.focus();
                    this._instance.sendText(text, false);
                }));
                this.add(this._instance.onDidSendText(() => this._addon.value?.hideSuggestWidget()));
            }
        }
    };
    TerminalSuggestContribution = TerminalSuggestContribution_1 = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService)
    ], TerminalSuggestContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalSuggestContribution.ID, TerminalSuggestContribution);
    // Actions
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.selectPrevSuggestion" /* TerminalCommandId.SelectPrevSuggestion */,
        title: (0, nls_1.localize2)('workbench.action.terminal.selectPrevSuggestion', 'Select the Previous Suggestion'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            // Up is bound to other workbench keybindings that this needs to beat
            primary: 16 /* KeyCode.UpArrow */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.selectPreviousSuggestion()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.selectPrevPageSuggestion" /* TerminalCommandId.SelectPrevPageSuggestion */,
        title: (0, nls_1.localize2)('workbench.action.terminal.selectPrevPageSuggestion', 'Select the Previous Page Suggestion'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            // Up is bound to other workbench keybindings that this needs to beat
            primary: 11 /* KeyCode.PageUp */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.selectPreviousPageSuggestion()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.selectNextSuggestion" /* TerminalCommandId.SelectNextSuggestion */,
        title: (0, nls_1.localize2)('workbench.action.terminal.selectNextSuggestion', 'Select the Next Suggestion'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            // Down is bound to other workbench keybindings that this needs to beat
            primary: 18 /* KeyCode.DownArrow */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.selectNextSuggestion()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.selectNextPageSuggestion" /* TerminalCommandId.SelectNextPageSuggestion */,
        title: (0, nls_1.localize2)('workbench.action.terminal.selectNextPageSuggestion', 'Select the Next Page Suggestion'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            // Down is bound to other workbench keybindings that this needs to beat
            primary: 12 /* KeyCode.PageDown */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.selectNextPageSuggestion()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.acceptSelectedSuggestion" /* TerminalCommandId.AcceptSelectedSuggestion */,
        title: (0, nls_1.localize2)('workbench.action.terminal.acceptSelectedSuggestion', 'Accept Selected Suggestion'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            primary: 3 /* KeyCode.Enter */,
            secondary: [2 /* KeyCode.Tab */],
            // Enter is bound to other workbench keybindings that this needs to beat
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.acceptSelectedSuggestion()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.hideSuggestWidget" /* TerminalCommandId.HideSuggestWidget */,
        title: (0, nls_1.localize2)('workbench.action.terminal.hideSuggestWidget', 'Hide Suggest Widget'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            primary: 9 /* KeyCode.Escape */,
            // Escape is bound to other workbench keybindings that this needs to beat
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.hideSuggestWidget()
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuc3VnZ2VzdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvc3VnZ2VzdC9icm93c2VyL3Rlcm1pbmFsLnN1Z2dlc3QuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9CaEcsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSwyQkFBZTs7aUJBQ3hDLE9BQUUsR0FBRyxrQkFBa0IsQUFBckIsQ0FBc0I7UUFFeEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUEyQjtZQUNyQyxPQUFPLFFBQVEsQ0FBQyxlQUFlLENBQThCLDZCQUEyQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlGLENBQUM7UUFNRCxJQUFJLEtBQUssS0FBK0IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFbkUsWUFDa0IsU0FBNEIsRUFDN0MsZUFBd0MsRUFDeEMsYUFBb0MsRUFDaEIsa0JBQXVELEVBQ3BELHFCQUE2RCxFQUM3RCxxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFQUyxjQUFTLEdBQVQsU0FBUyxDQUFtQjtZQUdSLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDbkMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM1QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBWnBFLFdBQU0sR0FBb0MsSUFBSSw2QkFBaUIsRUFBRSxDQUFDO1lBQzNFLHNDQUFpQyxHQUF5QixJQUFJLEdBQUcsQ0FBQyx3Q0FBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQWN2SCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUEs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