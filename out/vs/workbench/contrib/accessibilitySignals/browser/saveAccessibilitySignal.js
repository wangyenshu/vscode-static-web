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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/services/workingCopy/common/workingCopyService"], function (require, exports, lifecycle_1, accessibilitySignalService_1, workingCopyService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveAccessibilitySignalContribution = void 0;
    let SaveAccessibilitySignalContribution = class SaveAccessibilitySignalContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.saveAccessibilitySignal'; }
        constructor(_accessibilitySignalService, _workingCopyService) {
            super();
            this._accessibilitySignalService = _accessibilitySignalService;
            this._workingCopyService = _workingCopyService;
            this._register(this._workingCopyService.onDidSave(e => this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.save, { userGesture: e.reason === 1 /* SaveReason.EXPLICIT */ })));
        }
    };
    exports.SaveAccessibilitySignalContribution = SaveAccessibilitySignalContribution;
    exports.SaveAccessibilitySignalContribution = SaveAccessibilitySignalContribution = __decorate([
        __param(0, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(1, workingCopyService_1.IWorkingCopyService)
    ], SaveAccessibilitySignalContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2F2ZUFjY2Vzc2liaWxpdHlTaWduYWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9hY2Nlc3NpYmlsaXR5U2lnbmFscy9icm93c2VyL3NhdmVBY2Nlc3NpYmlsaXR5U2lnbmFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVF6RixJQUFNLG1DQUFtQyxHQUF6QyxNQUFNLG1DQUFvQyxTQUFRLHNCQUFVO2lCQUVsRCxPQUFFLEdBQUcsMkNBQTJDLEFBQTlDLENBQStDO1FBRWpFLFlBQytDLDJCQUF3RCxFQUNoRSxtQkFBd0M7WUFFOUUsS0FBSyxFQUFFLENBQUM7WUFIc0MsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE2QjtZQUNoRSx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBRzlFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxVQUFVLENBQUMsZ0RBQW1CLENBQUMsSUFBSSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxNQUFNLGdDQUF3QixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkwsQ0FBQzs7SUFWVyxrRkFBbUM7a0RBQW5DLG1DQUFtQztRQUs3QyxXQUFBLHdEQUEyQixDQUFBO1FBQzNCLFdBQUEsd0NBQW1CLENBQUE7T0FOVCxtQ0FBbUMsQ0FXL0MifQ==