/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/notification/common/notification"], function (require, exports, event_1, lifecycle_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestNotificationService = void 0;
    class TestNotificationService {
        constructor() {
            this.onDidAddNotification = event_1.Event.None;
            this.onDidRemoveNotification = event_1.Event.None;
            this.onDidChangeFilter = event_1.Event.None;
        }
        static { this.NO_OP = new notification_1.NoOpNotification(); }
        info(message) {
            return this.notify({ severity: notification_1.Severity.Info, message });
        }
        warn(message) {
            return this.notify({ severity: notification_1.Severity.Warning, message });
        }
        error(error) {
            return this.notify({ severity: notification_1.Severity.Error, message: error });
        }
        notify(notification) {
            return TestNotificationService.NO_OP;
        }
        prompt(severity, message, choices, options) {
            return TestNotificationService.NO_OP;
        }
        status(message, options) {
            return lifecycle_1.Disposable.None;
        }
        setFilter() { }
        getFilter(source) {
            return notification_1.NotificationsFilter.OFF;
        }
        getFilters() {
            return [];
        }
        removeFilter(sourceId) { }
    }
    exports.TestNotificationService = TestNotificationService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdE5vdGlmaWNhdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9ub3RpZmljYXRpb24vdGVzdC9jb21tb24vdGVzdE5vdGlmaWNhdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsdUJBQXVCO1FBQXBDO1lBRVUseUJBQW9CLEdBQXlCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFFeEQsNEJBQXVCLEdBQXlCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFFM0Qsc0JBQWlCLEdBQWdCLGFBQUssQ0FBQyxJQUFJLENBQUM7UUF5Q3RELENBQUM7aUJBckN3QixVQUFLLEdBQXdCLElBQUksK0JBQWdCLEVBQUUsQUFBOUMsQ0FBK0M7UUFFNUUsSUFBSSxDQUFDLE9BQWU7WUFDbkIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLHVCQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVELElBQUksQ0FBQyxPQUFlO1lBQ25CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSx1QkFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxLQUFLLENBQUMsS0FBcUI7WUFDMUIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLHVCQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFRCxNQUFNLENBQUMsWUFBMkI7WUFDakMsT0FBTyx1QkFBdUIsQ0FBQyxLQUFLLENBQUM7UUFDdEMsQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUFrQixFQUFFLE9BQWUsRUFBRSxPQUF3QixFQUFFLE9BQXdCO1lBQzdGLE9BQU8sdUJBQXVCLENBQUMsS0FBSyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxNQUFNLENBQUMsT0FBdUIsRUFBRSxPQUErQjtZQUM5RCxPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxTQUFTLEtBQVcsQ0FBQztRQUVyQixTQUFTLENBQUMsTUFBd0M7WUFDakQsT0FBTyxrQ0FBbUIsQ0FBQyxHQUFHLENBQUM7UUFDaEMsQ0FBQztRQUVELFVBQVU7WUFDVCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxZQUFZLENBQUMsUUFBZ0IsSUFBVSxDQUFDOztJQTlDekMsMERBK0NDIn0=