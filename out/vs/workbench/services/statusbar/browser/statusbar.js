/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusbarEntryKinds = exports.ShowTooltipCommand = exports.StatusbarAlignment = exports.IStatusbarService = void 0;
    exports.isStatusbarEntryLocation = isStatusbarEntryLocation;
    exports.isStatusbarEntryPriority = isStatusbarEntryPriority;
    exports.IStatusbarService = (0, instantiation_1.createDecorator)('statusbarService');
    var StatusbarAlignment;
    (function (StatusbarAlignment) {
        StatusbarAlignment[StatusbarAlignment["LEFT"] = 0] = "LEFT";
        StatusbarAlignment[StatusbarAlignment["RIGHT"] = 1] = "RIGHT";
    })(StatusbarAlignment || (exports.StatusbarAlignment = StatusbarAlignment = {}));
    function isStatusbarEntryLocation(thing) {
        const candidate = thing;
        return typeof candidate?.id === 'string' && typeof candidate.alignment === 'number';
    }
    function isStatusbarEntryPriority(thing) {
        const candidate = thing;
        return (typeof candidate?.primary === 'number' || isStatusbarEntryLocation(candidate?.primary)) && typeof candidate?.secondary === 'number';
    }
    exports.ShowTooltipCommand = {
        id: 'statusBar.entry.showTooltip',
        title: ''
    };
    exports.StatusbarEntryKinds = ['standard', 'warning', 'error', 'prominent', 'remote', 'offline'];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzYmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3N0YXR1c2Jhci9icm93c2VyL3N0YXR1c2Jhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0RGhHLDREQUlDO0lBeUJELDREQUlDO0lBbkZZLFFBQUEsaUJBQWlCLEdBQUcsSUFBQSwrQkFBZSxFQUFvQixrQkFBa0IsQ0FBQyxDQUFDO0lBdUJ4RixJQUFrQixrQkFHakI7SUFIRCxXQUFrQixrQkFBa0I7UUFDbkMsMkRBQUksQ0FBQTtRQUNKLDZEQUFLLENBQUE7SUFDTixDQUFDLEVBSGlCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBR25DO0lBd0JELFNBQWdCLHdCQUF3QixDQUFDLEtBQWM7UUFDdEQsTUFBTSxTQUFTLEdBQUcsS0FBNEMsQ0FBQztRQUUvRCxPQUFPLE9BQU8sU0FBUyxFQUFFLEVBQUUsS0FBSyxRQUFRLElBQUksT0FBTyxTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsQ0FBQztJQUNyRixDQUFDO0lBeUJELFNBQWdCLHdCQUF3QixDQUFDLEtBQWM7UUFDdEQsTUFBTSxTQUFTLEdBQUcsS0FBNEMsQ0FBQztRQUUvRCxPQUFPLENBQUMsT0FBTyxTQUFTLEVBQUUsT0FBTyxLQUFLLFFBQVEsSUFBSSx3QkFBd0IsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxPQUFPLFNBQVMsRUFBRSxTQUFTLEtBQUssUUFBUSxDQUFDO0lBQzdJLENBQUM7SUFFWSxRQUFBLGtCQUFrQixHQUFZO1FBQzFDLEVBQUUsRUFBRSw2QkFBNkI7UUFDakMsS0FBSyxFQUFFLEVBQUU7S0FDVCxDQUFDO0lBVVcsUUFBQSxtQkFBbUIsR0FBeUIsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDIn0=