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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/contrib/terminalContrib/links/browser/links", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkProviderService", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkQuickpick", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkResolver"], function (require, exports, event_1, lifecycle_1, nls_1, contextkey_1, extensions_1, instantiation_1, accessibilityConfiguration_1, terminal_1, terminalActions_1, terminalExtensions_1, terminal_2, terminalContextKey_1, terminalStrings_1, links_1, terminalLinkManager_1, terminalLinkProviderService_1, terminalLinkQuickpick_1, terminalLinkResolver_1) {
    "use strict";
    var TerminalLinkContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(links_1.ITerminalLinkProviderService, terminalLinkProviderService_1.TerminalLinkProviderService, 1 /* InstantiationType.Delayed */);
    let TerminalLinkContribution = class TerminalLinkContribution extends lifecycle_1.DisposableStore {
        static { TerminalLinkContribution_1 = this; }
        static { this.ID = 'terminal.link'; }
        static get(instance) {
            return instance.getContribution(TerminalLinkContribution_1.ID);
        }
        constructor(_instance, _processManager, _widgetManager, _instantiationService, _terminalLinkProviderService) {
            super();
            this._instance = _instance;
            this._processManager = _processManager;
            this._widgetManager = _widgetManager;
            this._instantiationService = _instantiationService;
            this._terminalLinkProviderService = _terminalLinkProviderService;
            this._linkResolver = this._instantiationService.createInstance(terminalLinkResolver_1.TerminalLinkResolver);
        }
        xtermReady(xterm) {
            const linkManager = this._linkManager = this.add(this._instantiationService.createInstance(terminalLinkManager_1.TerminalLinkManager, xterm.raw, this._processManager, this._instance.capabilities, this._linkResolver));
            // Set widget manager
            if ((0, terminal_2.isTerminalProcessManager)(this._processManager)) {
                const disposable = linkManager.add(event_1.Event.once(this._processManager.onProcessReady)(() => {
                    linkManager.setWidgetManager(this._widgetManager);
                    this.delete(disposable);
                }));
            }
            else {
                linkManager.setWidgetManager(this._widgetManager);
            }
            // Attach the external link provider to the instance and listen for changes
            if (!(0, terminal_1.isDetachedTerminalInstance)(this._instance)) {
                for (const linkProvider of this._terminalLinkProviderService.linkProviders) {
                    linkManager.externalProvideLinksCb = linkProvider.provideLinks.bind(linkProvider, this._instance);
                }
                linkManager.add(this._terminalLinkProviderService.onDidAddLinkProvider(e => {
                    linkManager.externalProvideLinksCb = e.provideLinks.bind(e, this._instance);
                }));
            }
            linkManager.add(this._terminalLinkProviderService.onDidRemoveLinkProvider(() => linkManager.externalProvideLinksCb = undefined));
        }
        async showLinkQuickpick(extended) {
            if (!this._terminalLinkQuickpick) {
                this._terminalLinkQuickpick = this.add(this._instantiationService.createInstance(terminalLinkQuickpick_1.TerminalLinkQuickpick));
                this._terminalLinkQuickpick.onDidRequestMoreLinks(() => {
                    this.showLinkQuickpick(true);
                });
            }
            const links = await this._getLinks();
            return await this._terminalLinkQuickpick.show(this._instance, links);
        }
        async _getLinks() {
            if (!this._linkManager) {
                throw new Error('terminal links are not ready, cannot generate link quick pick');
            }
            return this._linkManager.getLinks();
        }
        async openRecentLink(type) {
            if (!this._linkManager) {
                throw new Error('terminal links are not ready, cannot open a link');
            }
            this._linkManager.openRecentLink(type);
        }
    };
    TerminalLinkContribution = TerminalLinkContribution_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, links_1.ITerminalLinkProviderService)
    ], TerminalLinkContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalLinkContribution.ID, TerminalLinkContribution, true);
    const category = terminalStrings_1.terminalStrings.actionCategory;
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.openDetectedLink" /* TerminalCommandId.OpenDetectedLink */,
        title: (0, nls_1.localize2)('workbench.action.terminal.openDetectedLink', 'Open Detected Link...'),
        f1: true,
        category,
        precondition: terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated,
        keybinding: [{
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 45 /* KeyCode.KeyO */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                when: terminalContextKey_1.TerminalContextKeys.focus
            }, {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                when: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))
            },
        ],
        run: (activeInstance) => TerminalLinkContribution.get(activeInstance)?.showLinkQuickpick()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.openUrlLink" /* TerminalCommandId.OpenWebLink */,
        title: (0, nls_1.localize2)('workbench.action.terminal.openLastUrlLink', 'Open Last URL Link'),
        metadata: {
            description: (0, nls_1.localize2)('workbench.action.terminal.openLastUrlLink.description', 'Opens the last detected URL/URI link in the terminal')
        },
        f1: true,
        category,
        precondition: terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated,
        run: (activeInstance) => TerminalLinkContribution.get(activeInstance)?.openRecentLink('url')
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.openFileLink" /* TerminalCommandId.OpenFileLink */,
        title: (0, nls_1.localize2)('workbench.action.terminal.openLastLocalFileLink', 'Open Last Local File Link'),
        f1: true,
        category,
        precondition: terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated,
        run: (activeInstance) => TerminalLinkContribution.get(activeInstance)?.openRecentLink('localFile')
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwubGlua3MuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL2Jyb3dzZXIvdGVybWluYWwubGlua3MuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXlCaEcsSUFBQSw4QkFBaUIsRUFBQyxvQ0FBNEIsRUFBRSx5REFBMkIsb0NBQTRCLENBQUM7SUFFeEcsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSwyQkFBZTs7aUJBQ3JDLE9BQUUsR0FBRyxlQUFlLEFBQWxCLENBQW1CO1FBRXJDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBMkI7WUFDckMsT0FBTyxRQUFRLENBQUMsZUFBZSxDQUEyQiwwQkFBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBTUQsWUFDa0IsU0FBd0QsRUFDeEQsZUFBK0QsRUFDL0QsY0FBcUMsRUFDZCxxQkFBNEMsRUFDckMsNEJBQTBEO1lBRXpHLEtBQUssRUFBRSxDQUFDO1lBTlMsY0FBUyxHQUFULFNBQVMsQ0FBK0M7WUFDeEQsb0JBQWUsR0FBZixlQUFlLENBQWdEO1lBQy9ELG1CQUFjLEdBQWQsY0FBYyxDQUF1QjtZQUNkLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDckMsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUE4QjtZQUd6RyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsMkNBQW9CLENBQUMsQ0FBQztRQUN0RixDQUFDO1FBRUQsVUFBVSxDQUFDLEtBQWlEO1lBQzNELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxD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