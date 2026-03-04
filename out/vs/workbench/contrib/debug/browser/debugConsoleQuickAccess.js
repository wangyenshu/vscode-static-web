var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/filters", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/common/debug"], function (require, exports, filters_1, nls_1, commands_1, pickerQuickAccess_1, viewsService_1, debugCommands_1, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugConsoleQuickAccess = void 0;
    let DebugConsoleQuickAccess = class DebugConsoleQuickAccess extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(_debugService, _viewsService, _commandService) {
            super(debugCommands_1.DEBUG_CONSOLE_QUICK_ACCESS_PREFIX, { canAcceptInBackground: true });
            this._debugService = _debugService;
            this._viewsService = _viewsService;
            this._commandService = _commandService;
        }
        _getPicks(filter, disposables, token) {
            const debugConsolePicks = [];
            this._debugService.getModel().getSessions(true).filter(s => s.hasSeparateRepl()).forEach((session, index) => {
                const pick = this._createPick(session, index, filter);
                if (pick) {
                    debugConsolePicks.push(pick);
                }
            });
            if (debugConsolePicks.length > 0) {
                debugConsolePicks.push({ type: 'separator' });
            }
            const createTerminalLabel = (0, nls_1.localize)("workbench.action.debug.startDebug", "Start a New Debug Session");
            debugConsolePicks.push({
                label: `$(plus) ${createTerminalLabel}`,
                ariaLabel: createTerminalLabel,
                accept: () => this._commandService.executeCommand(debugCommands_1.SELECT_AND_START_ID)
            });
            return debugConsolePicks;
        }
        _createPick(session, sessionIndex, filter) {
            const label = session.name;
            const highlights = (0, filters_1.matchesFuzzy)(filter, label, true);
            if (highlights) {
                return {
                    label,
                    highlights: { label: highlights },
                    accept: (keyMod, event) => {
                        this._debugService.focusStackFrame(undefined, undefined, session, { explicit: true });
                        if (!this._viewsService.isViewVisible(debug_1.REPL_VIEW_ID)) {
                            this._viewsService.openView(debug_1.REPL_VIEW_ID, true);
                        }
                    }
                };
            }
            return undefined;
        }
    };
    exports.DebugConsoleQuickAccess = DebugConsoleQuickAccess;
    exports.DebugConsoleQuickAccess = DebugConsoleQuickAccess = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, viewsService_1.IViewsService),
        __param(2, commands_1.ICommandService)
    ], DebugConsoleQuickAccess);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb25zb2xlUXVpY2tBY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2RlYnVnQ29uc29sZVF1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFlTyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLDZDQUFpRDtRQUU3RixZQUNpQyxhQUE0QixFQUM1QixhQUE0QixFQUMxQixlQUFnQztZQUVsRSxLQUFLLENBQUMsaURBQWlDLEVBQUUsRUFBRSxxQkFBcUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBSjFDLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQzVCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQzFCLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUduRSxDQUFDO1FBRVMsU0FBUyxDQUFDLE1BQWMsRUFBRSxXQUE0QixFQUFFLEtBQXdCO1lBQ3pGLE1BQU0saUJBQWlCLEdBQXdELEVBQUUsQ0FBQztZQUVsRixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQzNHLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDVixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUdILElBQUksaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNsQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBRUQsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLGNBQVEsRUFBQyxtQ0FBbUMsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO1lBQ3ZHLGlCQUFpQixDQUFDLElBQUksQ0FBQztnQkFDdEIsS0FBSyxFQUFFLFdBQVcsbUJBQW1CLEVBQUU7Z0JBQ3ZDLFNBQVMsRUFBRSxtQkFBbUI7Z0JBQzlCLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxtQ0FBbUIsQ0FBQzthQUN0RSxDQUFDLENBQUM7WUFDSCxPQUFPLGlCQUFpQixDQUFDO1FBQzFCLENBQUM7UUFFTyxXQUFXLENBQUMsT0FBc0IsRUFBRSxZQUFvQixFQUFFLE1BQWM7WUFDL0UsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUUzQixNQUFNLFVBQVUsR0FBRyxJQUFBLHNCQUFZLEVBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRCxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixPQUFPO29CQUNOLEtBQUs7b0JBQ0wsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRTtvQkFDakMsTUFBTSxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO3dCQUN6QixJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO3dCQUN0RixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsb0JBQVksQ0FBQyxFQUFFLENBQUM7NEJBQ3JELElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLG9CQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQ2pELENBQUM7b0JBQ0YsQ0FBQztpQkFDRCxDQUFDO1lBQ0gsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7S0FDRCxDQUFBO0lBcERZLDBEQUF1QjtzQ0FBdkIsdUJBQXVCO1FBR2pDLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsNEJBQWEsQ0FBQTtRQUNiLFdBQUEsMEJBQWUsQ0FBQTtPQUxMLHVCQUF1QixDQW9EbkMifQ==