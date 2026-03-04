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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/accessibilitySignal/browser/accessibilitySignalService"], function (require, exports, async_1, lifecycle_1, accessibilitySignalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityProgressSignalScheduler = void 0;
    const PROGRESS_SIGNAL_LOOP_DELAY = 5000;
    /**
     * Schedules a signal to play while progress is happening.
     */
    let AccessibilityProgressSignalScheduler = class AccessibilityProgressSignalScheduler extends lifecycle_1.Disposable {
        constructor(msDelayTime, msLoopTime, _accessibilitySignalService) {
            super();
            this._accessibilitySignalService = _accessibilitySignalService;
            this._scheduler = new async_1.RunOnceScheduler(() => {
                this._signalLoop = this._accessibilitySignalService.playSignalLoop(accessibilitySignalService_1.AccessibilitySignal.progress, msLoopTime ?? PROGRESS_SIGNAL_LOOP_DELAY);
            }, msDelayTime);
            this._scheduler.schedule();
        }
        dispose() {
            super.dispose();
            this._signalLoop?.dispose();
            this._scheduler.dispose();
        }
    };
    exports.AccessibilityProgressSignalScheduler = AccessibilityProgressSignalScheduler;
    exports.AccessibilityProgressSignalScheduler = AccessibilityProgressSignalScheduler = __decorate([
        __param(2, accessibilitySignalService_1.IAccessibilitySignalService)
    ], AccessibilityProgressSignalScheduler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NBY2Nlc3NpYmlsaXR5U2lnbmFsU2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYWNjZXNzaWJpbGl0eVNpZ25hbC9icm93c2VyL3Byb2dyZXNzQWNjZXNzaWJpbGl0eVNpZ25hbFNjaGVkdWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFNaEcsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUM7SUFFeEM7O09BRUc7SUFDSSxJQUFNLG9DQUFvQyxHQUExQyxNQUFNLG9DQUFxQyxTQUFRLHNCQUFVO1FBR25FLFlBQVksV0FBbUIsRUFBRSxVQUE4QixFQUFnRCwyQkFBd0Q7WUFDdEssS0FBSyxFQUFFLENBQUM7WUFEc0csZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE2QjtZQUV0SyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFO2dCQUMzQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxjQUFjLENBQUMsZ0RBQW1CLENBQUMsUUFBUSxFQUFFLFVBQVUsSUFBSSwwQkFBMEIsQ0FBQyxDQUFDO1lBQzVJLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzVCLENBQUM7UUFDUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDO0tBQ0QsQ0FBQTtJQWZZLG9GQUFvQzttREFBcEMsb0NBQW9DO1FBR2tCLFdBQUEsd0RBQTJCLENBQUE7T0FIakYsb0NBQW9DLENBZWhEIn0=