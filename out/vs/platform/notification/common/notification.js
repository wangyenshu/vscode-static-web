/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/severity", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, severity_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoOpProgress = exports.NoOpNotification = exports.NotificationsFilter = exports.NeverShowAgainScope = exports.NotificationPriority = exports.INotificationService = exports.Severity = void 0;
    exports.isNotificationSource = isNotificationSource;
    exports.Severity = severity_1.default;
    exports.INotificationService = (0, instantiation_1.createDecorator)('notificationService');
    var NotificationPriority;
    (function (NotificationPriority) {
        /**
         * Default priority: notification will be visible unless do not disturb mode is enabled.
         */
        NotificationPriority[NotificationPriority["DEFAULT"] = 0] = "DEFAULT";
        /**
         * Silent priority: notification will only be visible from the notifications center.
         */
        NotificationPriority[NotificationPriority["SILENT"] = 1] = "SILENT";
        /**
         * Urgent priority: notification will be visible even when do not disturb mode is enabled.
         */
        NotificationPriority[NotificationPriority["URGENT"] = 2] = "URGENT";
    })(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
    var NeverShowAgainScope;
    (function (NeverShowAgainScope) {
        /**
         * Will never show this notification on the current workspace again.
         */
        NeverShowAgainScope[NeverShowAgainScope["WORKSPACE"] = 0] = "WORKSPACE";
        /**
         * Will never show this notification on any workspace of the same
         * profile again.
         */
        NeverShowAgainScope[NeverShowAgainScope["PROFILE"] = 1] = "PROFILE";
        /**
         * Will never show this notification on any workspace across all
         * profiles again.
         */
        NeverShowAgainScope[NeverShowAgainScope["APPLICATION"] = 2] = "APPLICATION";
    })(NeverShowAgainScope || (exports.NeverShowAgainScope = NeverShowAgainScope = {}));
    function isNotificationSource(thing) {
        if (thing) {
            const candidate = thing;
            return typeof candidate.id === 'string' && typeof candidate.label === 'string';
        }
        return false;
    }
    var NotificationsFilter;
    (function (NotificationsFilter) {
        /**
         * No filter is enabled.
         */
        NotificationsFilter[NotificationsFilter["OFF"] = 0] = "OFF";
        /**
         * All notifications are silent except error notifications.
        */
        NotificationsFilter[NotificationsFilter["ERROR"] = 1] = "ERROR";
    })(NotificationsFilter || (exports.NotificationsFilter = NotificationsFilter = {}));
    class NoOpNotification {
        constructor() {
            this.progress = new NoOpProgress();
            this.onDidClose = event_1.Event.None;
            this.onDidChangeVisibility = event_1.Event.None;
        }
        updateSeverity(severity) { }
        updateMessage(message) { }
        updateActions(actions) { }
        close() { }
    }
    exports.NoOpNotification = NoOpNotification;
    class NoOpProgress {
        infinite() { }
        done() { }
        total(value) { }
        worked(value) { }
    }
    exports.NoOpProgress = NoOpProgress;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbm90aWZpY2F0aW9uL2NvbW1vbi9ub3RpZmljYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkdoRyxvREFRQztJQTdHYSxRQUFBLFFBQVEsR0FBRyxrQkFBWSxDQUFDO0lBRXpCLFFBQUEsb0JBQW9CLEdBQUcsSUFBQSwrQkFBZSxFQUF1QixxQkFBcUIsQ0FBQyxDQUFDO0lBSWpHLElBQVksb0JBZ0JYO0lBaEJELFdBQVksb0JBQW9CO1FBRS9COztXQUVHO1FBQ0gscUVBQU8sQ0FBQTtRQUVQOztXQUVHO1FBQ0gsbUVBQU0sQ0FBQTtRQUVOOztXQUVHO1FBQ0gsbUVBQU0sQ0FBQTtJQUNQLENBQUMsRUFoQlcsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFnQi9CO0lBeUJELElBQVksbUJBa0JYO0lBbEJELFdBQVksbUJBQW1CO1FBRTlCOztXQUVHO1FBQ0gsdUVBQVMsQ0FBQTtRQUVUOzs7V0FHRztRQUNILG1FQUFPLENBQUE7UUFFUDs7O1dBR0c7UUFDSCwyRUFBVyxDQUFBO0lBQ1osQ0FBQyxFQWxCVyxtQkFBbUIsbUNBQW5CLG1CQUFtQixRQWtCOUI7SUFvQ0QsU0FBZ0Isb0JBQW9CLENBQUMsS0FBYztRQUNsRCxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1gsTUFBTSxTQUFTLEdBQUcsS0FBNEIsQ0FBQztZQUUvQyxPQUFPLE9BQU8sU0FBUyxDQUFDLEVBQUUsS0FBSyxRQUFRLElBQUksT0FBTyxTQUFTLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQztRQUNoRixDQUFDO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBdU5ELElBQVksbUJBV1g7SUFYRCxXQUFZLG1CQUFtQjtRQUU5Qjs7V0FFRztRQUNILDJEQUFHLENBQUE7UUFFSDs7VUFFRTtRQUNGLCtEQUFLLENBQUE7SUFDTixDQUFDLEVBWFcsbUJBQW1CLG1DQUFuQixtQkFBbUIsUUFXOUI7SUEwR0QsTUFBYSxnQkFBZ0I7UUFBN0I7WUFFVSxhQUFRLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUU5QixlQUFVLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUN4QiwwQkFBcUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1FBTzdDLENBQUM7UUFMQSxjQUFjLENBQUMsUUFBa0IsSUFBVSxDQUFDO1FBQzVDLGFBQWEsQ0FBQyxPQUE0QixJQUFVLENBQUM7UUFDckQsYUFBYSxDQUFDLE9BQThCLElBQVUsQ0FBQztRQUV2RCxLQUFLLEtBQVcsQ0FBQztLQUNqQjtJQVpELDRDQVlDO0lBRUQsTUFBYSxZQUFZO1FBQ3hCLFFBQVEsS0FBVyxDQUFDO1FBQ3BCLElBQUksS0FBVyxDQUFDO1FBQ2hCLEtBQUssQ0FBQyxLQUFhLElBQVUsQ0FBQztRQUM5QixNQUFNLENBQUMsS0FBYSxJQUFVLENBQUM7S0FDL0I7SUFMRCxvQ0FLQyJ9