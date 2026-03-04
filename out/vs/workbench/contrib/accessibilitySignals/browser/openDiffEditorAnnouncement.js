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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/base/common/event"], function (require, exports, lifecycle_1, editorBrowser_1, nls_1, accessibility_1, configuration_1, editorService_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorActiveAnnouncementContribution = void 0;
    let DiffEditorActiveAnnouncementContribution = class DiffEditorActiveAnnouncementContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.diffEditorActiveAnnouncement'; }
        constructor(_editorService, _accessibilityService, _configurationService) {
            super();
            this._editorService = _editorService;
            this._accessibilityService = _accessibilityService;
            this._configurationService = _configurationService;
            this._register(event_1.Event.runAndSubscribe(_accessibilityService.onDidChangeScreenReaderOptimized, () => this._updateListener()));
            this._register(_configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("accessibility.verbosity.diffEditorActive" /* AccessibilityVerbositySettingId.DiffEditorActive */)) {
                    this._updateListener();
                }
            }));
        }
        _updateListener() {
            const announcementEnabled = this._configurationService.getValue("accessibility.verbosity.diffEditorActive" /* AccessibilityVerbositySettingId.DiffEditorActive */);
            const screenReaderOptimized = this._accessibilityService.isScreenReaderOptimized();
            if (!announcementEnabled || !screenReaderOptimized) {
                this._onDidActiveEditorChangeListener?.dispose();
                this._onDidActiveEditorChangeListener = undefined;
                return;
            }
            if (this._onDidActiveEditorChangeListener) {
                return;
            }
            this._onDidActiveEditorChangeListener = this._register(this._editorService.onDidActiveEditorChange(() => {
                if ((0, editorBrowser_1.isDiffEditor)(this._editorService.activeTextEditorControl)) {
                    this._accessibilityService.alert((0, nls_1.localize)('openDiffEditorAnnouncement', "Diff editor"));
                }
            }));
        }
    };
    exports.DiffEditorActiveAnnouncementContribution = DiffEditorActiveAnnouncementContribution;
    exports.DiffEditorActiveAnnouncementContribution = DiffEditorActiveAnnouncementContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, accessibility_1.IAccessibilityService),
        __param(2, configuration_1.IConfigurationService)
    ], DiffEditorActiveAnnouncementContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbkRpZmZFZGl0b3JBbm5vdW5jZW1lbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9hY2Nlc3NpYmlsaXR5U2lnbmFscy9icm93c2VyL29wZW5EaWZmRWRpdG9yQW5ub3VuY2VtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVl6RixJQUFNLHdDQUF3QyxHQUE5QyxNQUFNLHdDQUF5QyxTQUFRLHNCQUFVO2lCQUV2RCxPQUFFLEdBQUcsZ0RBQWdELEFBQW5ELENBQW9EO1FBSXRFLFlBQ2tDLGNBQThCLEVBQ3ZCLHFCQUE0QyxFQUM1QyxxQkFBNEM7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFKeUIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ3ZCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDNUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUdwRixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxlQUFlLENBQUMscUJBQXFCLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1SCxJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNqRSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsbUdBQWtELEVBQUUsQ0FBQztvQkFDOUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN4QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxlQUFlO1lBQ3RCLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsbUdBQWtELENBQUM7WUFDbEgsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUVuRixJQUFJLENBQUMsbUJBQW1CLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUNwRCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsT0FBTyxFQUFFLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxTQUFTLENBQUM7Z0JBQ2xELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztnQkFDM0MsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsZ0NBQWdDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRTtnQkFDdkcsSUFBSSxJQUFBLDRCQUFZLEVBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLENBQUM7b0JBQy9ELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDekYsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDOztJQXZDVyw0RkFBd0M7dURBQXhDLHdDQUF3QztRQU9sRCxXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUNBQXFCLENBQUE7T0FUWCx3Q0FBd0MsQ0F3Q3BEIn0=