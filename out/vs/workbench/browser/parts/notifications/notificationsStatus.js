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
define(["require", "exports", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/lifecycle", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/nls", "vs/platform/notification/common/notification"], function (require, exports, statusbar_1, lifecycle_1, notificationsCommands_1, nls_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsStatus = void 0;
    let NotificationsStatus = class NotificationsStatus extends lifecycle_1.Disposable {
        constructor(model, statusbarService, notificationService) {
            super();
            this.model = model;
            this.statusbarService = statusbarService;
            this.notificationService = notificationService;
            this.newNotificationsCount = 0;
            this.isNotificationsCenterVisible = false;
            this.isNotificationsToastsVisible = false;
            this.updateNotificationsCenterStatusItem();
            if (model.statusMessage) {
                this.doSetStatusMessage(model.statusMessage);
            }
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.model.onDidChangeNotification(e => this.onDidChangeNotification(e)));
            this._register(this.model.onDidChangeStatusMessage(e => this.onDidChangeStatusMessage(e)));
            this._register(this.notificationService.onDidChangeFilter(() => this.updateNotificationsCenterStatusItem()));
        }
        onDidChangeNotification(e) {
            // Consider a notification as unread as long as it only
            // appeared as toast and not in the notification center
            if (!this.isNotificationsCenterVisible) {
                if (e.kind === 0 /* NotificationChangeType.ADD */) {
                    this.newNotificationsCount++;
                }
                else if (e.kind === 3 /* NotificationChangeType.REMOVE */ && this.newNotificationsCount > 0) {
                    this.newNotificationsCount--;
                }
            }
            // Update in status bar
            this.updateNotificationsCenterStatusItem();
        }
        updateNotificationsCenterStatusItem() {
            // Figure out how many notifications have progress only if neither
            // toasts are visible nor center is visible. In that case we still
            // want to give a hint to the user that something is running.
            let notificationsInProgress = 0;
            if (!this.isNotificationsCenterVisible && !this.isNotificationsToastsVisible) {
                for (const notification of this.model.notifications) {
                    if (notification.hasProgress) {
                        notificationsInProgress++;
                    }
                }
            }
            // Show the status bar entry depending on do not disturb setting
            let statusProperties = {
                name: (0, nls_1.localize)('status.notifications', "Notifications"),
                text: `${notificationsInProgress > 0 || this.newNotificationsCount > 0 ? '$(bell-dot)' : '$(bell)'}`,
                ariaLabel: (0, nls_1.localize)('status.notifications', "Notifications"),
                command: this.isNotificationsCenterVisible ? notificationsCommands_1.HIDE_NOTIFICATIONS_CENTER : notificationsCommands_1.SHOW_NOTIFICATIONS_CENTER,
                tooltip: this.getTooltip(notificationsInProgress),
                showBeak: this.isNotificationsCenterVisible
            };
            if (this.notificationService.getFilter() === notification_1.NotificationsFilter.ERROR) {
                statusProperties = {
                    ...statusProperties,
                    text: `${notificationsInProgress > 0 || this.newNotificationsCount > 0 ? '$(bell-slash-dot)' : '$(bell-slash)'}`,
                    ariaLabel: (0, nls_1.localize)('status.doNotDisturb', "Do Not Disturb"),
                    tooltip: (0, nls_1.localize)('status.doNotDisturbTooltip', "Do Not Disturb Mode is Enabled")
                };
            }
            if (!this.notificationsCenterStatusItem) {
                this.notificationsCenterStatusItem = this.statusbarService.addEntry(statusProperties, 'status.notifications', 1 /* StatusbarAlignment.RIGHT */, -Number.MAX_VALUE /* towards the far end of the right hand side */);
            }
            else {
                this.notificationsCenterStatusItem.update(statusProperties);
            }
        }
        getTooltip(notificationsInProgress) {
            if (this.isNotificationsCenterVisible) {
                return (0, nls_1.localize)('hideNotifications', "Hide Notifications");
            }
            if (this.model.notifications.length === 0) {
                return (0, nls_1.localize)('zeroNotifications', "No Notifications");
            }
            if (notificationsInProgress === 0) {
                if (this.newNotificationsCount === 0) {
                    return (0, nls_1.localize)('noNotifications', "No New Notifications");
                }
                if (this.newNotificationsCount === 1) {
                    return (0, nls_1.localize)('oneNotification', "1 New Notification");
                }
                return (0, nls_1.localize)({ key: 'notifications', comment: ['{0} will be replaced by a number'] }, "{0} New Notifications", this.newNotificationsCount);
            }
            if (this.newNotificationsCount === 0) {
                return (0, nls_1.localize)({ key: 'noNotificationsWithProgress', comment: ['{0} will be replaced by a number'] }, "No New Notifications ({0} in progress)", notificationsInProgress);
            }
            if (this.newNotificationsCount === 1) {
                return (0, nls_1.localize)({ key: 'oneNotificationWithProgress', comment: ['{0} will be replaced by a number'] }, "1 New Notification ({0} in progress)", notificationsInProgress);
            }
            return (0, nls_1.localize)({ key: 'notificationsWithProgress', comment: ['{0} and {1} will be replaced by a number'] }, "{0} New Notifications ({1} in progress)", this.newNotificationsCount, notificationsInProgress);
        }
        update(isCenterVisible, isToastsVisible) {
            let updateNotificationsCenterStatusItem = false;
            if (this.isNotificationsCenterVisible !== isCenterVisible) {
                this.isNotificationsCenterVisible = isCenterVisible;
                this.newNotificationsCount = 0; // Showing the notification center resets the unread counter to 0
                updateNotificationsCenterStatusItem = true;
            }
            if (this.isNotificationsToastsVisible !== isToastsVisible) {
                this.isNotificationsToastsVisible = isToastsVisible;
                updateNotificationsCenterStatusItem = true;
            }
            // Update in status bar as needed
            if (updateNotificationsCenterStatusItem) {
                this.updateNotificationsCenterStatusItem();
            }
        }
        onDidChangeStatusMessage(e) {
            const statusItem = e.item;
            switch (e.kind) {
                // Show status notification
                case 0 /* StatusMessageChangeType.ADD */:
                    this.doSetStatusMessage(statusItem);
                    break;
                // Hide status notification (if its still the current one)
                case 1 /* StatusMessageChangeType.REMOVE */:
                    if (this.currentStatusMessage && this.currentStatusMessage[0] === statusItem) {
                        (0, lifecycle_1.dispose)(this.currentStatusMessage[1]);
                        this.currentStatusMessage = undefined;
                    }
                    break;
            }
        }
        doSetStatusMessage(item) {
            const message = item.message;
            const showAfter = item.options && typeof item.options.showAfter === 'number' ? item.options.showAfter : 0;
            const hideAfter = item.options && typeof item.options.hideAfter === 'number' ? item.options.hideAfter : -1;
            // Dismiss any previous
            if (this.currentStatusMessage) {
                (0, lifecycle_1.dispose)(this.currentStatusMessage[1]);
            }
            // Create new
            let statusMessageEntry;
            let showHandle = setTimeout(() => {
                statusMessageEntry = this.statusbarService.addEntry({
                    name: (0, nls_1.localize)('status.message', "Status Message"),
                    text: message,
                    ariaLabel: message
                }, 'status.message', 0 /* StatusbarAlignment.LEFT */, -Number.MAX_VALUE /* far right on left hand side */);
                showHandle = null;
            }, showAfter);
            // Dispose function takes care of timeouts and actual entry
            let hideHandle;
            const statusMessageDispose = {
                dispose: () => {
                    if (showHandle) {
                        clearTimeout(showHandle);
                    }
                    if (hideHandle) {
                        clearTimeout(hideHandle);
                    }
                    statusMessageEntry?.dispose();
                }
            };
            if (hideAfter > 0) {
                hideHandle = setTimeout(() => statusMessageDispose.dispose(), hideAfter);
            }
            // Remember as current status message
            this.currentStatusMessage = [item, statusMessageDispose];
        }
    };
    exports.NotificationsStatus = NotificationsStatus;
    exports.NotificationsStatus = NotificationsStatus = __decorate([
        __param(1, statusbar_1.IStatusbarService),
        __param(2, notification_1.INotificationService)
    ], NotificationsStatus);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc1N0YXR1cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL25vdGlmaWNhdGlvbnMvbm90aWZpY2F0aW9uc1N0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTtRQVVsRCxZQUNrQixLQUEwQixFQUN4QixnQkFBb0QsRUFDakQsbUJBQTBEO1lBRWhGLEtBQUssRUFBRSxDQUFDO1lBSlMsVUFBSyxHQUFMLEtBQUssQ0FBcUI7WUFDUCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ2hDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFWekUsMEJBQXFCLEdBQUcsQ0FBQyxDQUFDO1lBSTFCLGlDQUE0QixHQUFZLEtBQUssQ0FBQztZQUM5QyxpQ0FBNEIsR0FBWSxLQUFLLENBQUM7WUFTckQsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLENBQUM7WUFFM0MsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDOUMsQ0FBQztZQUVELElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsd0JBQXdC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