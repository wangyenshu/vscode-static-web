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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/contrib/debug/common/debug", "vs/platform/configuration/common/configuration", "vs/workbench/services/statusbar/browser/statusbar"], function (require, exports, nls, lifecycle_1, debug_1, configuration_1, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugStatusContribution = void 0;
    let DebugStatusContribution = class DebugStatusContribution {
        constructor(statusBarService, debugService, configurationService) {
            this.statusBarService = statusBarService;
            this.debugService = debugService;
            this.toDispose = [];
            const addStatusBarEntry = () => {
                this.entryAccessor = this.statusBarService.addEntry(this.entry, 'status.debug', 0 /* StatusbarAlignment.LEFT */, 30 /* Low Priority */);
            };
            const setShowInStatusBar = () => {
                this.showInStatusBar = configurationService.getValue('debug').showInStatusBar;
                if (this.showInStatusBar === 'always' && !this.entryAccessor) {
                    addStatusBarEntry();
                }
            };
            setShowInStatusBar();
            this.toDispose.push(this.debugService.onDidChangeState(state => {
                if (state !== 0 /* State.Inactive */ && this.showInStatusBar === 'onFirstSessionStart' && !this.entryAccessor) {
                    addStatusBarEntry();
                }
            }));
            this.toDispose.push(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.showInStatusBar')) {
                    setShowInStatusBar();
                    if (this.entryAccessor && this.showInStatusBar === 'never') {
                        this.entryAccessor.dispose();
                        this.entryAccessor = undefined;
                    }
                }
            }));
            this.toDispose.push(this.debugService.getConfigurationManager().onDidSelectConfiguration(e => {
                this.entryAccessor?.update(this.entry);
            }));
        }
        get entry() {
            let text = '';
            const manager = this.debugService.getConfigurationManager();
            const name = manager.selectedConfiguration.name || '';
            const nameAndLaunchPresent = name && manager.selectedConfiguration.launch;
            if (nameAndLaunchPresent) {
                text = (manager.getLaunches().length > 1 ? `${name} (${manager.selectedConfiguration.launch.name})` : name);
            }
            return {
                name: nls.localize('status.debug', "Debug"),
                text: '$(debug-alt-small) ' + text,
                ariaLabel: nls.localize('debugTarget', "Debug: {0}", text),
                tooltip: nls.localize('selectAndStartDebug', "Select and start debug configuration"),
                command: 'workbench.action.debug.selectandstart'
            };
        }
        dispose() {
            this.entryAccessor?.dispose();
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    exports.DebugStatusContribution = DebugStatusContribution;
    exports.DebugStatusContribution = DebugStatusContribution = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, debug_1.IDebugService),
        __param(2, configuration_1.IConfigurationService)
    ], DebugStatusContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdTdGF0dXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2RlYnVnU3RhdHVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQU1uQyxZQUNvQixnQkFBb0QsRUFDeEQsWUFBNEMsRUFDcEMsb0JBQTJDO1lBRjlCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDdkMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFMcEQsY0FBUyxHQUFrQixFQUFFLENBQUM7WUFTckMsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLEVBQUU7Z0JBQzlCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLGNBQWMsbUNBQTJCLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2pJLENBQUMsQ0FBQztZQUVGLE1BQU0sa0JBQWtCLEdBQUcsR0FBRyxFQUFFO2dCQUMvQixJQUFJLENBQUMsZUFBZSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBc0IsT0FBTyxDQUFDLENBQUMsZUFBZSxDQUFDO2dCQUNuRyxJQUFJLElBQUksQ0FBQyxlQUFlLEtBQUssUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUM5RCxpQkFBaUIsRUFBRSxDQUFDO2dCQUNyQixDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBQ0Ysa0JBQWtCLEVBQUUsQ0FBQztZQUVyQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM5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