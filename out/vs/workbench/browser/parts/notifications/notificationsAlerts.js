/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/errorMessage", "vs/platform/notification/common/notification", "vs/base/common/event"], function (require, exports, aria_1, nls_1, lifecycle_1, errorMessage_1, notification_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsAlerts = void 0;
    class NotificationsAlerts extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            // Alert initial notifications if any
            for (const notification of model.notifications) {
                this.triggerAriaAlert(notification);
            }
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.model.onDidChangeNotification(e => this.onDidChangeNotification(e)));
        }
        onDidChangeNotification(e) {
            if (e.kind === 0 /* NotificationChangeType.ADD */) {
                // ARIA alert for screen readers
                this.triggerAriaAlert(e.item);
                // Always log errors to console with full details
                if (e.item.severity === notification_1.Severity.Error) {
                    if (e.item.message.original instanceof Error) {
                        console.error(e.item.message.original);
                    }
                    else {
                        console.error((0, errorMessage_1.toErrorMessage)(e.item.message.linkedText.toString(), true));
                    }
                }
            }
        }
        triggerAriaAlert(notification) {
            if (notification.priority === notification_1.NotificationPriority.SILENT) {
                return;
            }
            // Trigger the alert again whenever the message changes
            const listener = notification.onDidChangeContent(e => {
                if (e.kind === 1 /* NotificationViewItemContentChangeKind.MESSAGE */) {
                    this.doTriggerAriaAlert(notification);
                }
            });
            event_1.Event.once(notification.onDidClose)(() => listener.dispose());
            this.doTriggerAriaAlert(notification);
        }
        doTriggerAriaAlert(notification) {
            let alertText;
            if (notification.severity === notification_1.Severity.Error) {
                alertText = (0, nls_1.localize)('alertErrorMessage', "Error: {0}", notification.message.linkedText.toString());
            }
            else if (notification.severity === notification_1.Severity.Warning) {
                alertText = (0, nls_1.localize)('alertWarningMessage', "Warning: {0}", notification.message.linkedText.toString());
            }
            else {
                alertText = (0, nls_1.localize)('alertInfoMessage', "Info: {0}", notification.message.linkedText.toString());
            }
            (0, aria_1.alert)(alertText);
        }
    }
    exports.NotificationsAlerts = NotificationsAlerts;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc0FsZXJ0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL25vdGlmaWNhdGlvbnMvbm90aWZpY2F0aW9uc0FsZXJ0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxtQkFBb0IsU0FBUSxzQkFBVTtRQUVsRCxZQUE2QixLQUEwQjtZQUN0RCxLQUFLLEVBQUUsQ0FBQztZQURvQixVQUFLLEdBQUwsS0FBSyxDQUFxQjtZQUd0RCxxQ0FBcUM7WUFDckMsS0FBSyxNQUFNLFlBQVksSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNyQyxDQUFDO1lBRUQsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFFTyx1QkFBdUIsQ0FBQyxDQUEyQjtZQUMxRCxJQUFJLENBQUMsQ0FBQyxJQUFJLHVDQUErQixFQUFFLENBQUM7Z0JBRTNDLGdDQUFnQztnQkFDaEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFOUIsaURBQWlEO2dCQUNqRCxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLHVCQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3hDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxZQUFZLEtBQUssRUFBRSxDQUFDO3dCQUM5QyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN4QyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFBLDZCQUFjLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQzNFLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sZ0JBQWdCLENBQUMsWUFBbUM7WUFDM0QsSUFBSSxZQUFZLENBQUMsUUFBUSxLQUFLLG1DQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMzRCxPQUFPO1lBQ1IsQ0FBQztZQUVELHVEQUF1RDtZQUN2RCxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BELElBQUksQ0FBQyxDQUFDLElBQUksMERBQWtELEVBQUUsQ0FBQztvQkFDOUQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxhQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUU5RCxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVPLGtCQUFrQixDQUFDLFlBQW1DO1lBQzdELElBQUksU0FBaUIsQ0FBQztZQUN0QixJQUFJLFlBQVksQ0FBQyxRQUFRLEtBQUssdUJBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDOUMsU0FBUyxHQUFHLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3JHLENBQUM7aUJBQU0sSUFBSSxZQUFZLENBQUMsUUFBUSxLQUFLLHVCQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3ZELFNBQVMsR0FBRyxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxjQUFjLEVBQUUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN6RyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsU0FBUyxHQUFHLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ25HLENBQUM7WUFFRCxJQUFBLFlBQUssRUFBQyxTQUFTLENBQUMsQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUEvREQsa0RBK0RDIn0=