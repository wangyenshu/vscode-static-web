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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFixAddon", "vs/workbench/contrib/terminalContrib/quickFix/browser/terminalQuickFixBuiltinActions", "vs/workbench/contrib/terminalContrib/quickFix/browser/terminalQuickFixService", "vs/css!./media/terminalQuickFix"], function (require, exports, lifecycle_1, nls_1, extensions_1, instantiation_1, terminalActions_1, terminalExtensions_1, terminalContextKey_1, quickFix_1, quickFixAddon_1, terminalQuickFixBuiltinActions_1, terminalQuickFixService_1) {
    "use strict";
    var TerminalQuickFixContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    // Services
    (0, extensions_1.registerSingleton)(quickFix_1.ITerminalQuickFixService, terminalQuickFixService_1.TerminalQuickFixService, 1 /* InstantiationType.Delayed */);
    // Contributions
    let TerminalQuickFixContribution = class TerminalQuickFixContribution extends lifecycle_1.DisposableStore {
        static { TerminalQuickFixContribution_1 = this; }
        static { this.ID = 'quickFix'; }
        static get(instance) {
            return instance.getContribution(TerminalQuickFixContribution_1.ID);
        }
        get addon() { return this._addon; }
        constructor(_instance, processManager, widgetManager, _instantiationService) {
            super();
            this._instance = _instance;
            this._instantiationService = _instantiationService;
        }
        xtermReady(xterm) {
            // Create addon
            this._addon = this._instantiationService.createInstance(quickFixAddon_1.TerminalQuickFixAddon, undefined, this._instance.capabilities);
            xterm.raw.loadAddon(this._addon);
            // Hook up listeners
            this.add(this._addon.onDidRequestRerunCommand((e) => this._instance.runCommand(e.command, e.shouldExecute || false)));
            // Register quick fixes
            for (const actionOption of [
                (0, terminalQuickFixBuiltinActions_1.gitTwoDashes)(),
                (0, terminalQuickFixBuiltinActions_1.gitPull)(),
                (0, terminalQuickFixBuiltinActions_1.freePort)((port, command) => this._instance.freePortKillProcess(port, command)),
                (0, terminalQuickFixBuiltinActions_1.gitSimilar)(),
                (0, terminalQuickFixBuiltinActions_1.gitPushSetUpstream)(),
                (0, terminalQuickFixBuiltinActions_1.gitCreatePr)(),
                (0, terminalQuickFixBuiltinActions_1.pwshUnixCommandNotFoundError)(),
                (0, terminalQuickFixBuiltinActions_1.pwshGeneralError)()
            ]) {
                this._addon.registerCommandFinishedListener(actionOption);
            }
        }
    };
    TerminalQuickFixContribution = TerminalQuickFixContribution_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], TerminalQuickFixContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalQuickFixContribution.ID, TerminalQuickFixContribution);
    // Actions
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.showQuickFixes" /* TerminalCommandId.ShowQuickFixes */,
        title: (0, nls_1.localize2)('workbench.action.terminal.showQuickFixes', 'Show Terminal Quick Fixes'),
        precondition: terminalContextKey_1.TerminalContextKeys.focus,
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        run: (activeInstance) => TerminalQuickFixContribution.get(activeInstance)?.addon?.showMenu()
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwucXVpY2tGaXguY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL3F1aWNrRml4L2Jyb3dzZXIvdGVybWluYWwucXVpY2tGaXguY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFCaEcsV0FBVztJQUNYLElBQUEsOEJBQWlCLEVBQUMsbUNBQXdCLEVBQUUsaURBQXVCLG9DQUE0QixDQUFDO0lBRWhHLGdCQUFnQjtJQUNoQixJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLDJCQUFlOztpQkFDekMsT0FBRSxHQUFHLFVBQVUsQUFBYixDQUFjO1FBRWhDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBMkI7WUFDckMsT0FBTyxRQUFRLENBQUMsZUFBZSxDQUErQiw4QkFBNEIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoRyxDQUFDO1FBR0QsSUFBSSxLQUFLLEtBQXdDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFdEUsWUFDa0IsU0FBNEIsRUFDN0MsY0FBdUMsRUFDdkMsYUFBb0MsRUFDSSxxQkFBNEM7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFMUyxjQUFTLEdBQVQsU0FBUyxDQUFtQjtZQUdMLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7UUFHckYsQ0FBQztRQUVELFVBQVUsQ0FBQyxLQUFpRDtZQUMzRCxlQUFlO1lBQ2YsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLHFDQUFxQixFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3ZILEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVqQyxvQkFBb0I7WUFDcEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxhQUFhLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXRILHVCQUF1QjtZQUN2QixLQUFLLE1BQU0sWUFBWSxJQUFJO2dCQUMxQixJQUFBLDZDQUFZLEdBQUU7Z0JBQ2QsSUFBQSx3Q0FBTyxHQUFFO2dCQUNULElBQUEseUNBQVEsRUFBQyxDQUFDLElBQVksRUFBRSxPQUFlLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM5RixJQUFBLDJDQUFVLEdBQUU7Z0JBQ1osSUFBQSxtREFBa0IsR0FBRTtnQkFDcEIsSUFBQSw0Q0FBVyxHQUFFO2dCQUNiLElBQUEsNkRBQTRCLEdBQUU7Z0JBQzlCLElBQUEsaURBQWdCLEdBQUU7YUFDbEIsRUFBRSxDQUFDO2dCQUNILElBQUksQ0FBQyxNQUFNLENBQUMsK0JBQStCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDM0QsQ0FBQztRQUNGLENBQUM7O0lBeENJLDRCQUE0QjtRQWMvQixXQUFBLHFDQUFxQixDQUFBO09BZGxCLDRCQUE0QixDQXlDakM7SUFDRCxJQUFBLGlEQUE0QixFQUFDLDRCQUE0QixDQUFDLEVBQUUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0lBRTVGLFVBQVU7SUFDVixJQUFBLDhDQUE0QixFQUFDO1FBQzVCLEVBQUUsbUZBQWtDO1FBQ3BDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQywwQ0FBMEMsRUFBRSwyQkFBMkIsQ0FBQztRQUN6RixZQUFZLEVBQUUsd0NBQW1CLENBQUMsS0FBSztRQUN2QyxVQUFVLEVBQUU7WUFDWCxPQUFPLEVBQUUsbURBQStCO1lBQ3hDLE1BQU0sNkNBQW1DO1NBQ3pDO1FBQ0QsR0FBRyxFQUFFLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRTtLQUM1RixDQUFDLENBQUMifQ==