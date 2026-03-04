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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/contrib/speech/common/speechService"], function (require, exports, lifecycle_1, accessibilitySignalService_1, speechService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpeechAccessibilitySignalContribution = void 0;
    let SpeechAccessibilitySignalContribution = class SpeechAccessibilitySignalContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.speechAccessibilitySignal'; }
        constructor(_accessibilitySignalService, _speechService) {
            super();
            this._accessibilitySignalService = _accessibilitySignalService;
            this._speechService = _speechService;
            this._register(this._speechService.onDidStartSpeechToTextSession(() => this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.voiceRecordingStarted)));
            this._register(this._speechService.onDidEndSpeechToTextSession(() => this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.voiceRecordingStopped)));
        }
    };
    exports.SpeechAccessibilitySignalContribution = SpeechAccessibilitySignalContribution;
    exports.SpeechAccessibilitySignalContribution = SpeechAccessibilitySignalContribution = __decorate([
        __param(0, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(1, speechService_1.ISpeechService)
    ], SpeechAccessibilitySignalContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlZWNoQWNjZXNzaWJpbGl0eVNpZ25hbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NwZWVjaC9icm93c2VyL3NwZWVjaEFjY2Vzc2liaWxpdHlTaWduYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBT3pGLElBQU0scUNBQXFDLEdBQTNDLE1BQU0scUNBQXNDLFNBQVEsc0JBQVU7aUJBRXBELE9BQUUsR0FBRyw2Q0FBNkMsQUFBaEQsQ0FBaUQ7UUFFbkUsWUFDK0MsMkJBQXdELEVBQ3JFLGNBQThCO1lBRS9ELEtBQUssRUFBRSxDQUFDO1lBSHNDLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFDckUsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBRy9ELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLGdEQUFtQixDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hLLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLGdEQUFtQixDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9KLENBQUM7O0lBWFcsc0ZBQXFDO29EQUFyQyxxQ0FBcUM7UUFLL0MsV0FBQSx3REFBMkIsQ0FBQTtRQUMzQixXQUFBLDhCQUFjLENBQUE7T0FOSixxQ0FBcUMsQ0FZakQifQ==