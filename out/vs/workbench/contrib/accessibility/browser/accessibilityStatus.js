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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/severity", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/workbench/services/statusbar/browser/statusbar"], function (require, exports, lifecycle_1, event_1, severity_1, nls_1, accessibility_1, commands_1, configuration_1, notification_1, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityStatus = void 0;
    let AccessibilityStatus = class AccessibilityStatus extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.accessibilityStatus'; }
        constructor(configurationService, notificationService, accessibilityService, statusbarService) {
            super();
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.accessibilityService = accessibilityService;
            this.statusbarService = statusbarService;
            this.screenReaderNotification = null;
            this.promptedScreenReader = false;
            this.screenReaderModeElement = this._register(new lifecycle_1.MutableDisposable());
            this._register(commands_1.CommandsRegistry.registerCommand({ id: 'showEditorScreenReaderNotification', handler: () => this.showScreenReaderNotification() }));
            this.updateScreenReaderModeElement(this.accessibilityService.isScreenReaderOptimized());
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.accessibilityService.onDidChangeScreenReaderOptimized(() => this.onScreenReaderModeChange()));
            this._register(this.configurationService.onDidChangeConfiguration(c => {
                if (c.affectsConfiguration('editor.accessibilitySupport')) {
                    this.onScreenReaderModeChange();
                }
            }));
        }
        showScreenReaderNotification() {
            this.screenReaderNotification = this.notificationService.prompt(severity_1.default.Info, (0, nls_1.localize)('screenReaderDetectedExplanation.question', "Are you using a screen reader to operate VS Code?"), [{
                    label: (0, nls_1.localize)('screenReaderDetectedExplanation.answerYes', "Yes"),
                    run: () => {
                        this.configurationService.updateValue('editor.accessibilitySupport', 'on', 2 /* ConfigurationTarget.USER */);
                    }
                }, {
                    label: (0, nls_1.localize)('screenReaderDetectedExplanation.answerNo', "No"),
                    run: () => {
                        this.configurationService.updateValue('editor.accessibilitySupport', 'off', 2 /* ConfigurationTarget.USER */);
                    }
                }], {
                sticky: true,
                priority: notification_1.NotificationPriority.URGENT
            });
            event_1.Event.once(this.screenReaderNotification.onDidClose)(() => this.screenReaderNotification = null);
        }
        updateScreenReaderModeElement(visible) {
            if (visible) {
                if (!this.screenReaderModeElement.value) {
                    const text = (0, nls_1.localize)('screenReaderDetected', "Screen Reader Optimized");
                    this.screenReaderModeElement.value = this.statusbarService.addEntry({
                        name: (0, nls_1.localize)('status.editor.screenReaderMode', "Screen Reader Mode"),
                        text,
                        ariaLabel: text,
                        command: 'showEditorScreenReaderNotification',
                        kind: 'prominent',
                        showInAllWindows: true
                    }, 'status.editor.screenReaderMode', 1 /* StatusbarAlignment.RIGHT */, 100.6);
                }
            }
            else {
                this.screenReaderModeElement.clear();
            }
        }
        onScreenReaderModeChange() {
            // We only support text based editors
            const screenReaderDetected = this.accessibilityService.isScreenReaderOptimized();
            if (screenReaderDetected) {
                const screenReaderConfiguration = this.configurationService.getValue('editor.accessibilitySupport');
                if (screenReaderConfiguration === 'auto') {
                    if (!this.promptedScreenReader) {
                        this.promptedScreenReader = true;
                        setTimeout(() => this.showScreenReaderNotification(), 100);
                    }
                }
            }
            if (this.screenReaderNotification) {
                this.screenReaderNotification.close();
            }
            this.updateScreenReaderModeElement(this.accessibilityService.isScreenReaderOptimized());
        }
    };
    exports.AccessibilityStatus = AccessibilityStatus;
    exports.AccessibilityStatus = AccessibilityStatus = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, notification_1.INotificationService),
        __param(2, accessibility_1.IAccessibilityService),
        __param(3, statusbar_1.IStatusbarService)
    ], AccessibilityStatus);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVN0YXR1cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHkvYnJvd3Nlci9hY2Nlc3NpYmlsaXR5U3RhdHVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWF6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO2lCQUVsQyxPQUFFLEdBQUcsdUNBQXVDLEFBQTFDLENBQTJDO1FBTTdELFlBQ3dCLG9CQUE0RCxFQUM3RCxtQkFBMEQsRUFDekQsb0JBQTRELEVBQ2hFLGdCQUFvRDtZQUV2RSxLQUFLLEVBQUUsQ0FBQztZQUxnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzVDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDeEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMvQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBUmhFLDZCQUF3QixHQUErQixJQUFJLENBQUM7WUFDNUQseUJBQW9CLEdBQVksS0FBSyxDQUFDO1lBQzdCLDRCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBMkIsQ0FBQyxDQUFDO1lBVTNHLElBQUksQ0FBQyxTQUFTLENBQUMsMkJBQWdCLENBQUMsZUFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLG9DQUFvQyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVuSixJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQztZQUV4RixJQUFJLENBQUMsaUJBQWlC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