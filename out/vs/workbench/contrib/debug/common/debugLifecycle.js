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
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, nls, configuration_1, dialogs_1, debug_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugLifecycle = void 0;
    let DebugLifecycle = class DebugLifecycle {
        constructor(lifecycleService, debugService, configurationService, dialogService) {
            this.debugService = debugService;
            this.configurationService = configurationService;
            this.dialogService = dialogService;
            lifecycleService.onBeforeShutdown(async (e) => e.veto(this.shouldVetoShutdown(e.reason), 'veto.debug'));
        }
        shouldVetoShutdown(_reason) {
            const rootSessions = this.debugService.getModel().getSessions().filter(s => s.parentSession === undefined);
            if (rootSessions.length === 0) {
                return false;
            }
            const shouldConfirmOnExit = this.configurationService.getValue('debug').confirmOnExit;
            if (shouldConfirmOnExit === 'never') {
                return false;
            }
            return this.showWindowCloseConfirmation(rootSessions.length);
        }
        async showWindowCloseConfirmation(numSessions) {
            let message;
            if (numSessions === 1) {
                message = nls.localize('debug.debugSessionCloseConfirmationSingular', "There is an active debug session, are you sure you want to stop it?");
            }
            else {
                message = nls.localize('debug.debugSessionCloseConfirmationPlural', "There are active debug sessions, are you sure you want to stop them?");
            }
            const res = await this.dialogService.confirm({
                message,
                type: 'warning',
                primaryButton: nls.localize({ key: 'debug.stop', comment: ['&& denotes a mnemonic'] }, "&&Stop Debugging")
            });
            return !res.confirmed;
        }
    };
    exports.DebugLifecycle = DebugLifecycle;
    exports.DebugLifecycle = DebugLifecycle = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, debug_1.IDebugService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, dialogs_1.IDialogService)
    ], DebugLifecycle);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdMaWZlY3ljbGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9jb21tb24vZGVidWdMaWZlY3ljbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWM7UUFDMUIsWUFDb0IsZ0JBQW1DLEVBQ3RCLFlBQTJCLEVBQ25CLG9CQUEyQyxFQUNsRCxhQUE2QjtZQUY5QixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNuQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2xELGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUU5RCxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUN2RyxDQUFDO1FBRU8sa0JBQWtCLENBQUMsT0FBdUI7WUFDakQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxLQUFLLFNBQVMsQ0FBQyxDQUFDO1lBQzNHLElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFzQixPQUFPLENBQUMsQ0FBQyxhQUFhLENBQUM7WUFDM0csSUFBSSxtQkFBbUIsS0FBSyxPQUFPLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsMkJBQTJCLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFTyxLQUFLLENBQUMsMkJBQTJCLENBQUMsV0FBbUI7WUFDNUQsSUFBSSxPQUFlLENBQUM7WUFDcEIsSUFBSSxXQUFXLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDZDQUE2QyxFQUFFLHFFQUFxRSxDQUFDLENBQUM7WUFDOUksQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDJDQUEyQyxFQUFFLHNFQUFzRSxDQUFDLENBQUM7WUFDN0ksQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7Z0JBQzVDLE9BQU87Z0JBQ1AsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsYUFBYSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxrQkFBa0IsQ0FBQzthQUMxRyxDQUFDLENBQUM7WUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUN2QixDQUFDO0tBQ0QsQ0FBQTtJQXRDWSx3Q0FBYzs2QkFBZCxjQUFjO1FBRXhCLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHdCQUFjLENBQUE7T0FMSixjQUFjLENBc0MxQiJ9