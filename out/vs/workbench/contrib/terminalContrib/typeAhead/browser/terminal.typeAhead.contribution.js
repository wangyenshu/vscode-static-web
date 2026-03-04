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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminalContrib/typeAhead/browser/terminalTypeAheadAddon", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, lifecycle_1, configuration_1, instantiation_1, terminalExtensions_1, terminalTypeAheadAddon_1, terminal_1) {
    "use strict";
    var TerminalTypeAheadContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalTypeAheadContribution = class TerminalTypeAheadContribution extends lifecycle_1.DisposableStore {
        static { TerminalTypeAheadContribution_1 = this; }
        static { this.ID = 'terminal.typeAhead'; }
        static get(instance) {
            return instance.getContribution(TerminalTypeAheadContribution_1.ID);
        }
        constructor(instance, _processManager, widgetManager, _configurationService, _instantiationService) {
            super();
            this._processManager = _processManager;
            this._configurationService = _configurationService;
            this._instantiationService = _instantiationService;
            this.add((0, lifecycle_1.toDisposable)(() => this._addon?.dispose()));
        }
        xtermReady(xterm) {
            this._loadTypeAheadAddon(xterm.raw);
            this.add(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.localEchoEnabled" /* TerminalSettingId.LocalEchoEnabled */)) {
                    this._loadTypeAheadAddon(xterm.raw);
                }
            }));
            // Reset the addon when the terminal launches or relaunches
            this.add(this._processManager.onProcessReady(() => {
                this._addon?.reset();
            }));
        }
        _loadTypeAheadAddon(xterm) {
            const enabled = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoEnabled;
            const isRemote = !!this._processManager.remoteAuthority;
            if (enabled === 'off' || enabled === 'auto' && !isRemote) {
                this._addon?.dispose();
                this._addon = undefined;
                return;
            }
            if (this._addon) {
                return;
            }
            if (enabled === 'on' || (enabled === 'auto' && isRemote)) {
                this._addon = this._instantiationService.createInstance(terminalTypeAheadAddon_1.TypeAheadAddon, this._processManager);
                xterm.loadAddon(this._addon);
            }
        }
    };
    TerminalTypeAheadContribution = TerminalTypeAheadContribution_1 = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService)
    ], TerminalTypeAheadContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalTypeAheadContribution.ID, TerminalTypeAheadContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwudHlwZUFoZWFkLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi90eXBlQWhlYWQvYnJvd3Nlci90ZXJtaW5hbC50eXBlQWhlYWQuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWFoRyxJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE4QixTQUFRLDJCQUFlOztpQkFDMUMsT0FBRSxHQUFHLG9CQUFvQixBQUF2QixDQUF3QjtRQUUxQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQTJCO1lBQ3JDLE9BQU8sUUFBUSxDQUFDLGVBQWUsQ0FBZ0MsK0JBQTZCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEcsQ0FBQztRQUlELFlBQ0MsUUFBMkIsRUFDVixlQUF3QyxFQUN6RCxhQUFvQyxFQUNJLHFCQUE0QyxFQUM1QyxxQkFBNEM7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFMUyxvQkFBZSxHQUFmLGVBQWUsQ0FBeUI7WUFFakIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM1QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBR3BGLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCxVQUFVLENBQUMsS0FBaUQ7WUFDM0QsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDaEUsSUFBSSxDQUFDLENBQUMsb0JBQW9CLGlGQUFvQyxFQUFFLENBQUM7b0JBQ2hFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3JDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosMkRBQTJEO1lBQzNELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFO2dCQUNqRCxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQ3RCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sbUJBQW1CLENBQUMsS0FBdUI7WUFDbEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBeUIsa0NBQXVCLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQztZQUN0SCxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUM7WUFDeEQsSUFBSSxPQUFPLEtBQUssS0FBSyxJQUFJLE9BQU8sS0FBSyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDMUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxPQUFPLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLE1BQU0sSUFBSSxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMxRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsdUNBQWMsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQzlGLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDOztJQWpESSw2QkFBNkI7UUFhaEMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFDQUFxQixDQUFBO09BZGxCLDZCQUE2QixDQWtEbEM7SUFFRCxJQUFBLGlEQUE0QixFQUFDLDZCQUE2QixDQUFDLEVBQUUsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDIn0=