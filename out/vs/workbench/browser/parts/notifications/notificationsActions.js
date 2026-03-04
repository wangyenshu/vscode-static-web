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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/platform/commands/common/commands", "vs/platform/clipboard/common/clipboardService", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/base/common/themables", "vs/css!./media/notificationsActions"], function (require, exports, nls_1, actions_1, notificationsCommands_1, commands_1, clipboardService_1, codicons_1, iconRegistry_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CopyNotificationMessageAction = exports.ConfigureNotificationAction = exports.CollapseNotificationAction = exports.ExpandNotificationAction = exports.HideNotificationsCenterAction = exports.ConfigureDoNotDisturbAction = exports.ToggleDoNotDisturbBySourceAction = exports.ToggleDoNotDisturbAction = exports.ClearAllNotificationsAction = exports.ClearNotificationAction = void 0;
    const clearIcon = (0, iconRegistry_1.registerIcon)('notifications-clear', codicons_1.Codicon.close, (0, nls_1.localize)('clearIcon', 'Icon for the clear action in notifications.'));
    const clearAllIcon = (0, iconRegistry_1.registerIcon)('notifications-clear-all', codicons_1.Codicon.clearAll, (0, nls_1.localize)('clearAllIcon', 'Icon for the clear all action in notifications.'));
    const hideIcon = (0, iconRegistry_1.registerIcon)('notifications-hide', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('hideIcon', 'Icon for the hide action in notifications.'));
    const expandIcon = (0, iconRegistry_1.registerIcon)('notifications-expand', codicons_1.Codicon.chevronUp, (0, nls_1.localize)('expandIcon', 'Icon for the expand action in notifications.'));
    const collapseIcon = (0, iconRegistry_1.registerIcon)('notifications-collapse', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('collapseIcon', 'Icon for the collapse action in notifications.'));
    const configureIcon = (0, iconRegistry_1.registerIcon)('notifications-configure', codicons_1.Codicon.gear, (0, nls_1.localize)('configureIcon', 'Icon for the configure action in notifications.'));
    const doNotDisturbIcon = (0, iconRegistry_1.registerIcon)('notifications-do-not-disturb', codicons_1.Codicon.bellSlash, (0, nls_1.localize)('doNotDisturbIcon', 'Icon for the mute all action in notifications.'));
    let ClearNotificationAction = class ClearNotificationAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.CLEAR_NOTIFICATION; }
        static { this.LABEL = (0, nls_1.localize)('clearNotification', "Clear Notification"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(clearIcon));
            this.commandService = commandService;
        }
        async run(notification) {
            this.commandService.executeCommand(notificationsCommands_1.CLEAR_NOTIFICATION, notification);
        }
    };
    exports.ClearNotificationAction = ClearNotificationAction;
    exports.ClearNotificationAction = ClearNotificationAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ClearNotificationAction);
    let ClearAllNotificationsAction = class ClearAllNotificationsAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.CLEAR_ALL_NOTIFICATIONS; }
        static { this.LABEL = (0, nls_1.localize)('clearNotifications', "Clear All Notifications"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(clearAllIcon));
            this.commandService = commandService;
        }
        async run() {
            this.commandService.executeCommand(notificationsCommands_1.CLEAR_ALL_NOTIFICATIONS);
        }
    };
    exports.ClearAllNotificationsAction = ClearAllNotificationsAction;
    exports.ClearAllNotificationsAction = ClearAllNotificationsAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ClearAllNotificationsAction);
    let ToggleDoNotDisturbAction = class ToggleDoNotDisturbAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.TOGGLE_DO_NOT_DISTURB_MODE; }
        static { this.LABEL = (0, nls_1.localize)('toggleDoNotDisturbMode', "Toggle Do Not Disturb Mode"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(doNotDisturbIcon));
            this.commandService = commandService;
        }
        async run() {
            this.commandService.executeCommand(notificationsCommands_1.TOGGLE_DO_NOT_DISTURB_MODE);
        }
    };
    exports.ToggleDoNotDisturbAction = ToggleDoNotDisturbAction;
    exports.ToggleDoNotDisturbAction = ToggleDoNotDisturbAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ToggleDoNotDisturbAction);
    let ToggleDoNotDisturbBySourceAction = class ToggleDoNotDisturbBySourceAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.TOGGLE_DO_NOT_DISTURB_MODE_BY_SOURCE; }
        static { this.LABEL = (0, nls_1.localize)('toggleDoNotDisturbModeBySource', "Toggle Do Not Disturb Mode By Source..."); }
        constructor(id, label, commandService) {
            super(id, label);
            this.commandService = commandService;
        }
        async run() {
            this.commandService.executeCommand(notificationsCommands_1.TOGGLE_DO_NOT_DISTURB_MODE_BY_SOURCE);
        }
    };
    exports.ToggleDoNotDisturbBySourceAction = ToggleDoNotDisturbBySourceAction;
    exports.ToggleDoNotDisturbBySourceAction = ToggleDoNotDisturbBySourceAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ToggleDoNotDisturbBySourceAction);
    class ConfigureDoNotDisturbAction extends actions_1.Action {
        static { this.ID = 'workbench.action.configureDoNotDisturbMode'; }
        static { this.LABEL = (0, nls_1.localize)('configureDoNotDisturbMode', "Configure Do Not Disturb..."); }
        constructor(id, label) {
            super(id, label, themables_1.ThemeIcon.asClassName(doNotDisturbIcon));
        }
    }
    exports.ConfigureDoNotDisturbAction = ConfigureDoNotDisturbAction;
    let HideNotificationsCenterAction = class HideNotificationsCenterAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.HIDE_NOTIFICATIONS_CENTER; }
        static { this.LABEL = (0, nls_1.localize)('hideNotificationsCenter', "Hide Notifications"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(hideIcon));
            this.commandService = commandService;
        }
        async run() {
            this.commandService.executeCommand(notificationsCommands_1.HIDE_NOTIFICATIONS_CENTER);
        }
    };
    exports.HideNotificationsCenterAction = HideNotificationsCenterAction;
    exports.HideNotificationsCenterAction = HideNotificationsCenterAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], HideNotificationsCenterAction);
    let ExpandNotificationAction = class ExpandNotificationAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.EXPAND_NOTIFICATION; }
        static { this.LABEL = (0, nls_1.localize)('expandNotification', "Expand Notification"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(expandIcon));
            this.commandService = commandService;
        }
        async run(notification) {
            this.commandService.executeCommand(notificationsCommands_1.EXPAND_NOTIFICATION, notification);
        }
    };
    exports.ExpandNotificationAction = ExpandNotificationAction;
    exports.ExpandNotificationAction = ExpandNotificationAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ExpandNotificationAction);
    let CollapseNotificationAction = class CollapseNotificationAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.COLLAPSE_NOTIFICATION; }
        static { this.LABEL = (0, nls_1.localize)('collapseNotification', "Collapse Notification"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(collapseIcon));
            this.commandService = commandService;
        }
        async run(notification) {
            this.commandService.executeCommand(notificationsCommands_1.COLLAPSE_NOTIFICATION, notification);
        }
    };
    exports.CollapseNotificationAction = CollapseNotificationAction;
    exports.CollapseNotificationAction = CollapseNotificationAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CollapseNotificationAction);
    class ConfigureNotificationAction extends actions_1.Action {
        static { this.ID = 'workbench.action.configureNotification'; }
        static { this.LABEL = (0, nls_1.localize)('configureNotification', "More Actions..."); }
        constructor(id, label, notification) {
            super(id, label, themables_1.ThemeIcon.asClassName(configureIcon));
            this.notification = notification;
        }
    }
    exports.ConfigureNotificationAction = ConfigureNotificationAction;
    let CopyNotificationMessageAction = class CopyNotificationMessageAction extends actions_1.Action {
        static { this.ID = 'workbench.action.copyNotificationMessage'; }
        static { this.LABEL = (0, nls_1.localize)('copyNotification', "Copy Text"); }
        constructor(id, label, clipboardService) {
            super(id, label);
            this.clipboardService = clipboardService;
        }
        run(notification) {
            return this.clipboardService.writeText(notification.message.raw);
        }
    };
    exports.CopyNotificationMessageAction = CopyNotificationMessageAction;
    exports.CopyNotificationMessageAction = CopyNotificationMessageAction = __decorate([
        __param(2, clipboardService_1.IClipboardService)
    ], CopyNotificationMessageAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9ub3RpZmljYXRpb25zL25vdGlmaWNhdGlvbnNBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWFoRyxNQUFNLFNBQVMsR0FBRyxJQUFBLDJCQUFZLEVBQUMscUJBQXFCLEVBQUUsa0JBQU8sQ0FBQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLDZDQUE2QyxDQUFDLENBQUMsQ0FBQztJQUMzSSxNQUFNLFlBQVksR0FBRyxJQUFBLDJCQUFZLEVBQUMseUJBQXlCLEVBQUUsa0JBQU8sQ0FBQyxRQUFRLEVBQUUsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLGlEQUFpRCxDQUFDLENBQUMsQ0FBQztJQUM1SixNQUFNLFFBQVEsR0FBRyxJQUFBLDJCQUFZLEVBQUMsb0JBQW9CLEVBQUUsa0JBQU8sQ0FBQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLDRDQUE0QyxDQUFDLENBQUMsQ0FBQztJQUM3SSxNQUFNLFVBQVUsR0FBRyxJQUFBLDJCQUFZLEVBQUMsc0JBQXNCLEVBQUUsa0JBQU8sQ0FBQyxTQUFTLEVBQUUsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLDhDQUE4QyxDQUFDLENBQUMsQ0FBQztJQUNuSixNQUFNLFlBQVksR0FBRyxJQUFBLDJCQUFZLEVBQUMsd0JBQXdCLEVBQUUsa0JBQU8sQ0FBQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLGdEQUFnRCxDQUFDLENBQUMsQ0FBQztJQUM3SixNQUFNLGFBQWEsR0FBRyxJQUFBLDJCQUFZLEVBQUMseUJBQXlCLEVBQUUsa0JBQU8sQ0FBQyxJQUFJ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