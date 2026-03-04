/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setProgressAcccessibilitySignalScheduler = setProgressAcccessibilitySignalScheduler;
    exports.getProgressAcccessibilitySignalScheduler = getProgressAcccessibilitySignalScheduler;
    const nullScopedAccessibilityProgressSignalFactory = () => ({
        msLoopTime: -1,
        msDelayTime: -1,
        dispose: () => { },
    });
    let progressAccessibilitySignalSchedulerFactory = nullScopedAccessibilityProgressSignalFactory;
    function setProgressAcccessibilitySignalScheduler(progressAccessibilitySignalScheduler) {
        progressAccessibilitySignalSchedulerFactory = progressAccessibilitySignalScheduler;
    }
    function getProgressAcccessibilitySignalScheduler(msDelayTime, msLoopTime) {
        return progressAccessibilitySignalSchedulerFactory(msDelayTime, msLoopTime);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NBY2Nlc3NpYmlsaXR5U2lnbmFsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL3Byb2dyZXNzYmFyL3Byb2dyZXNzQWNjZXNzaWJpbGl0eVNpZ25hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyw0RkFFQztJQUVELDRGQUVDO0lBYkQsTUFBTSw0Q0FBNEMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzNELFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDZCxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQ2YsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7S0FDbEIsQ0FBQyxDQUFDO0lBQ0gsSUFBSSwyQ0FBMkMsR0FBNkYsNENBQTRDLENBQUM7SUFFekwsU0FBZ0Isd0NBQXdDLENBQUMsb0NBQThIO1FBQ3RMLDJDQUEyQyxHQUFHLG9DQUFvQyxDQUFDO0lBQ3BGLENBQUM7SUFFRCxTQUFnQix3Q0FBd0MsQ0FBQyxXQUFtQixFQUFFLFVBQW1CO1FBQ2hHLE9BQU8sMkNBQTJDLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzdFLENBQUMifQ==