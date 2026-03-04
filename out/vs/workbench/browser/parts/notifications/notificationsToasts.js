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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/notifications/notificationsList", "vs/base/common/event", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/contextkey/common/contextkey", "vs/platform/notification/common/notification", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/host/browser/host", "vs/base/common/async", "vs/base/common/types", "vs/workbench/common/contextkeys", "vs/base/browser/window", "vs/css!./media/notificationsToasts"], function (require, exports, nls_1, lifecycle_1, dom_1, instantiation_1, notificationsList_1, event_1, layoutService_1, theme_1, themeService_1, colorRegistry_1, editorGroupsService_1, contextkey_1, notification_1, lifecycle_2, host_1, async_1, types_1, contextkeys_1, window_1) {
    "use strict";
    var NotificationsToasts_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsToasts = void 0;
    var ToastVisibility;
    (function (ToastVisibility) {
        ToastVisibility[ToastVisibility["HIDDEN_OR_VISIBLE"] = 0] = "HIDDEN_OR_VISIBLE";
        ToastVisibility[ToastVisibility["HIDDEN"] = 1] = "HIDDEN";
        ToastVisibility[ToastVisibility["VISIBLE"] = 2] = "VISIBLE";
    })(ToastVisibility || (ToastVisibility = {}));
    let NotificationsToasts = class NotificationsToasts extends themeService_1.Themable {
        static { NotificationsToasts_1 = this; }
        static { this.MAX_WIDTH = 450; }
        static { this.MAX_NOTIFICATIONS = 3; }
        static { this.PURGE_TIMEOUT = {
            [notification_1.Severity.Info]: 15000,
            [notification_1.Severity.Warning]: 18000,
            [notification_1.Severity.Error]: 20000
        }; }
        static { this.SPAM_PROTECTION = {
            // Count for the number of notifications over 800ms...
            interval: 800,
            // ...and ensure we are not showing more than MAX_NOTIFICATIONS
            limit: NotificationsToasts_1.MAX_NOTIFICATIONS
        }; }
        get isVisible() { return !!this._isVisible; }
        constructor(container, model, instantiationService, layoutService, themeService, editorGroupService, contextKeyService, lifecycleService, hostService) {
            super(themeService);
            this.container = container;
            this.model = model;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.editorGroupService = editorGroupService;
            this.contextKeyService = contextKeyService;
            this.lifecycleService = lifecycleService;
            this.hostService = hostService;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._isVisible = false;
            this.mapNotificationToToast = new Map();
            this.mapNotificationToDisposable = new Map();
            this.notificationsToastsVisibleContextKey = contextkeys_1.NotificationsToastsVisibleContext.bindTo(this.contextKeyService);
            this.addedToastsIntervalCounter = new async_1.IntervalCounter(NotificationsToasts_1.SPAM_PROTECTION.interval);
            this.registerListeners();
        }
        registerListeners() {
            // Layout
            this._register(this.layoutService.onDidLayoutMainContainer(dimension => this.layout(dom_1.Dimension.lift(dimension))));
            // Delay some tasks until after we have restored
            // to reduce UI pressure from the startup phase
            this.lifecycleService.when(3 /* LifecyclePhase.Restored */).then(() => {
                // Show toast for initial notifications if any
                this.model.notifications.forEach(notification => this.addToast(notification));
                // Update toasts on notification changes
                this._register(this.model.onDidChangeNotification(e => this.onDidChangeNotification(e)));
            });
            // Filter
            this._register(this.model.onDidChangeFilter(({ global, sources }) => {
                if (global === notification_1.NotificationsFilter.ERROR) {
                    this.hide();
                }
                else if (sources) {
                    for (const [notification] of this.mapNotificationToToast) {
                        if (typeof notification.sourceId === 'string' && sources.get(notification.sourceId) === notification_1.NotificationsFilter.ERROR && notification.severity !== notification_1.Severity.Error && notification.priority !== notification_1.NotificationPriority.URGENT) {
                            this.removeToast(notification);
                        }
                    }
                }
            }));
        }
        onDidChangeNotification(e) {
            switch (e.kind) {
                case 0 /* NotificationChangeType.ADD */:
                    return this.addToast(e.item);
                case 3 /* NotificationChangeType.REMOVE */:
                    return this.removeToast(e.item);
            }
        }
        addToast(item) {
            if (this.isNotificationsCenterVisible) {
                return; // do not show toasts while notification center is visible
            }
            if (item.priority === notification_1.NotificationPriority.SILENT) {
                return; // do not show toasts for silenced notifications
            }
            // Optimization: it is possible that a lot of notifications are being
            // added in a very short time. To prevent this kind of spam, we protect
            // against showing too many notifications at once. Since they can always
            // be accessed from the notification center, a user can always get to
            // them later on.
            // (see also https://github.com/microsoft/vscode/issues/107935)
            if (this.addedToastsIntervalCounter.increment() > NotificationsToasts_1.SPAM_PROTECTION.limit) {
                return;
            }
            // Optimization: showing a notification toast can be expensive
            // because of the associated animation. If the renderer is busy
            // doing actual work, the animation can cause a lot of slowdown
            // As such we use `scheduleAtNextAnimationFrame` to push out
            // the toast until the renderer has time to process it.
            // (see also https://github.com/microsoft/vscode/issues/107935)
            const itemDisposables = new lifecycle_1.DisposableStore();
            this.mapNotificationToDisposable.set(item, itemDisposables);
            itemDisposables.add((0, dom_1.scheduleAtNextAnimationFrame)((0, dom_1.getWindow)(this.container), () => this.doAddToast(item, itemDisposables)));
        }
        doAddToast(item, itemDisposables) {
            // Lazily create toasts containers
            let notificationsToastsContainer = this.notificationsToastsContainer;
            if (!notificationsToastsContainer) {
                notificationsToastsContainer = this.notificationsToastsContainer = document.createElement('div');
                notificationsToastsContainer.classList.add('notifications-toasts');
                this.container.appendChild(notificationsToastsContainer);
            }
            // Make Visible
            notificationsToastsContainer.classList.add('visible');
            // Container
            const notificationToastContainer = document.createElement('div');
            notificationToastContainer.classList.add('notification-toast-container');
            const firstToast = notificationsToastsContainer.firstChild;
            if (firstToast) {
                notificationsToastsContainer.insertBefore(notificationToastContainer, firstToast); // always first
            }
            else {
                notificationsToastsContainer.appendChild(notificationToastContainer);
            }
            // Toast
            const notificationToast = document.createElement('div');
            notificationToast.classList.add('notification-toast');
            notificationToastContainer.appendChild(notificationToast);
            // Create toast with item and show
            const notificationList = this.instantiationService.createInstance(notificationsList_1.NotificationsList, notificationToast, {
                verticalScrollMode: 2 /* ScrollbarVisibility.Hidden */,
                widgetAriaLabel: (() => {
                    if (!item.source) {
                        return (0, nls_1.localize)('notificationAriaLabel', "{0}, notification", item.message.raw);
                    }
                    return (0, nls_1.localize)('notificationWithSourceAriaLabel', "{0}, source: {1}, notification", item.message.raw, item.source);
                })()
            });
            itemDisposables.add(notificationList);
            const toast = { item, list: notificationList, container: notificationToastContainer, toast: notificationToast };
            this.mapNotificationToToast.set(item, toast);
            // When disposed, remove as visible
            itemDisposables.add((0, lifecycle_1.toDisposable)(() => this.updateToastVisibility(toast, false)));
            // Make visible
            notificationList.show();
            // Layout lists
            const maxDimensions = this.computeMaxDimensions();
            this.layoutLists(maxDimensions.width);
            // Show notification
            notificationList.updateNotificationsList(0, 0, [item]);
            // Layout container: only after we show the notification to ensure that
            // the height computation takes the content of it into account!
            this.layoutContainer(maxDimensions.height);
            // Re-draw entire item when expansion changes to reveal or hide details
            itemDisposables.add(item.onDidChangeExpansion(() => {
                notificationList.updateNotificationsList(0, 1, [item]);
            }));
            // Handle content changes
            // - actions: re-draw to properly show them
            // - message: update notification height unless collapsed
            itemDisposables.add(item.onDidChangeContent(e => {
                switch (e.kind) {
                    case 2 /* NotificationViewItemContentChangeKind.ACTIONS */:
                        notificationList.updateNotificationsList(0, 1, [item]);
                        break;
                    case 1 /* NotificationViewItemContentChangeKind.MESSAGE */:
                        if (item.expanded) {
                            notificationList.updateNotificationHeight(item);
                        }
                        break;
                }
            }));
            // Remove when item gets closed
            event_1.Event.once(item.onDidClose)(() => {
                this.removeToast(item);
            });
            // Automatically purge non-sticky notifications
            this.purgeNotification(item, notificationToastContainer, notificationList, itemDisposables);
            // Theming
            this.updateStyles();
            // Context Key
            this.notificationsToastsVisibleContextKey.set(true);
            // Animate in
            notificationToast.classList.add('notification-fade-in');
            itemDisposables.add((0, dom_1.addDisposableListener)(notificationToast, 'transitionend', () => {
                notificationToast.classList.remove('notification-fade-in');
                notificationToast.classList.add('notification-fade-in-done');
            }));
            // Mark as visible
            item.updateVisibility(true);
            // Events
            if (!this._isVisible) {
                this._isVisible = true;
                this._onDidChangeVisibility.fire();
            }
        }
        purgeNotification(item, notificationToastContainer, notificationList, disposables) {
            // Track mouse over item
            let isMouseOverToast = false;
            disposables.add((0, dom_1.addDisposableListener)(notificationToastContainer, dom_1.EventType.MOUSE_OVER, () => isMouseOverToast = true));
            disposables.add((0, dom_1.addDisposableListener)(notificationToastContainer, dom_1.EventType.MOUSE_OUT, () => isMouseOverToast = false));
            // Install Timers to Purge Notification
            let purgeTimeoutHandle;
            let listener;
            const hideAfterTimeout = () => {
                purgeTimeoutHandle = setTimeout(() => {
                    // If the window does not have focus, we wait for the window to gain focus
                    // again before triggering the timeout again. This prevents an issue where
                    // focussing the window could immediately hide the notification because the
                    // timeout was triggered again.
                    if (!this.hostService.hasFocus) {
                        if (!listener) {
                            listener = this.hostService.onDidChangeFocus(focus => {
                                if (focus) {
                                    hideAfterTimeout();
                                }
                            });
                            disposables.add(listener);
                        }
                    }
                    // Otherwise...
                    else if (item.sticky || // never hide sticky notifications
                        notificationList.hasFocus() || // never hide notifications with focus
                        isMouseOverToast // never hide notifications under mouse
                    ) {
                        hideAfterTimeout();
                    }
                    else {
                        this.removeToast(item);
                    }
                }, NotificationsToasts_1.PURGE_TIMEOUT[item.severity]);
            };
            hideAfterTimeout();
            disposables.add((0, lifecycle_1.toDisposable)(() => clearTimeout(purgeTimeoutHandle)));
        }
        removeToast(item) {
            let focusEditor = false;
            // UI
            const notificationToast = this.mapNotificationToToast.get(item);
            if (notificationToast) {
                const toastHasDOMFocus = (0, dom_1.isAncestorOfActiveElement)(notificationToast.container);
                if (toastHasDOMFocus) {
                    focusEditor = !(this.focusNext() || this.focusPrevious()); // focus next if any, otherwise focus editor
                }
                this.mapNotificationToToast.delete(item);
            }
            // Disposables
            const notificationDisposables = this.mapNotificationToDisposable.get(item);
            if (notificationDisposables) {
                (0, lifecycle_1.dispose)(notificationDisposables);
                this.mapNotificationToDisposable.delete(item);
            }
            // Layout if we still have toasts
            if (this.mapNotificationToToast.size > 0) {
                this.layout(this.workbenchDimensions);
            }
            // Otherwise hide if no more toasts to show
            else {
                this.doHide();
                // Move focus back to editor group as needed
                if (focusEditor) {
                    this.editorGroupService.activeGroup.focus();
                }
            }
        }
        removeToasts() {
            // Toast
            this.mapNotificationToToast.clear();
            // Disposables
            this.mapNotificationToDisposable.forEach(disposable => (0, lifecycle_1.dispose)(disposable));
            this.mapNotificationToDisposable.clear();
            this.doHide();
        }
        doHide() {
            this.notificationsToastsContainer?.classList.remove('visible');
            // Context Key
            this.notificationsToastsVisibleContextKey.set(false);
            // Events
            if (this._isVisible) {
                this._isVisible = false;
                this._onDidChangeVisibility.fire();
            }
        }
        hide() {
            const focusEditor = this.notificationsToastsContainer ? (0, dom_1.isAncestorOfActiveElement)(this.notificationsToastsContainer) : false;
            this.removeToasts();
            if (focusEditor) {
                this.editorGroupService.activeGroup.focus();
            }
        }
        focus() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            if (toasts.length > 0) {
                toasts[0].list.focusFirst();
                return true;
            }
            return false;
        }
        focusNext() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            for (let i = 0; i < toasts.length; i++) {
                const toast = toasts[i];
                if (toast.list.hasFocus()) {
                    const nextToast = toasts[i + 1];
                    if (nextToast) {
                        nextToast.list.focusFirst();
                        return true;
                    }
                    break;
                }
            }
            return false;
        }
        focusPrevious() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            for (let i = 0; i < toasts.length; i++) {
                const toast = toasts[i];
                if (toast.list.hasFocus()) {
                    const previousToast = toasts[i - 1];
                    if (previousToast) {
                        previousToast.list.focusFirst();
                        return true;
                    }
                    break;
                }
            }
            return false;
        }
        focusFirst() {
            const toast = this.getToasts(ToastVisibility.VISIBLE)[0];
            if (toast) {
                toast.list.focusFirst();
                return true;
            }
            return false;
        }
        focusLast() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            if (toasts.length > 0) {
                toasts[toasts.length - 1].list.focusFirst();
                return true;
            }
            return false;
        }
        update(isCenterVisible) {
            if (this.isNotificationsCenterVisible !== isCenterVisible) {
                this.isNotificationsCenterVisible = isCenterVisible;
                // Hide all toasts when the notificationcenter gets visible
                if (this.isNotificationsCenterVisible) {
                    this.removeToasts();
                }
            }
        }
        updateStyles() {
            this.mapNotificationToToast.forEach(({ toast }) => {
                const backgroundColor = this.getColor(theme_1.NOTIFICATIONS_BACKGROUND);
                toast.style.background = backgroundColor ? backgroundColor : '';
                const widgetShadowColor = this.getColor(colorRegistry_1.widgetShadow);
                toast.style.boxShadow = widgetShadowColor ? `0 0 8px 2px ${widgetShadowColor}` : '';
                const borderColor = this.getColor(theme_1.NOTIFICATIONS_TOAST_BORDER);
                toast.style.border = borderColor ? `1px solid ${borderColor}` : '';
            });
        }
        getToasts(state) {
            const notificationToasts = [];
            this.mapNotificationToToast.forEach(toast => {
                switch (state) {
                    case ToastVisibility.HIDDEN_OR_VISIBLE:
                        notificationToasts.push(toast);
                        break;
                    case ToastVisibility.HIDDEN:
                        if (!this.isToastInDOM(toast)) {
                            notificationToasts.push(toast);
                        }
                        break;
                    case ToastVisibility.VISIBLE:
                        if (this.isToastInDOM(toast)) {
                            notificationToasts.push(toast);
                        }
                        break;
                }
            });
            return notificationToasts.reverse(); // from newest to oldest
        }
        layout(dimension) {
            this.workbenchDimensions = dimension;
            const maxDimensions = this.computeMaxDimensions();
            // Hide toasts that exceed height
            if (maxDimensions.height) {
                this.layoutContainer(maxDimensions.height);
            }
            // Layout all lists of toasts
            this.layoutLists(maxDimensions.width);
        }
        computeMaxDimensions() {
            const maxWidth = NotificationsToasts_1.MAX_WIDTH;
            let availableWidth = maxWidth;
            let availableHeight;
            if (this.workbenchDimensions) {
                // Make sure notifications are not exceding available width
                availableWidth = this.workbenchDimensions.width;
                availableWidth -= (2 * 8); // adjust for paddings left and right
                // Make sure notifications are not exceeding available height
                availableHeight = this.workbenchDimensions.height;
                if (this.layoutService.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, window_1.mainWindow)) {
                    availableHeight -= 22; // adjust for status bar
                }
                if (this.layoutService.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, window_1.mainWindow)) {
                    availableHeight -= 22; // adjust for title bar
                }
                availableHeight -= (2 * 12); // adjust for paddings top and bottom
            }
            availableHeight = typeof availableHeight === 'number'
                ? Math.round(availableHeight * 0.618) // try to not cover the full height for stacked toasts
                : 0;
            return new dom_1.Dimension(Math.min(maxWidth, availableWidth), availableHeight);
        }
        layoutLists(width) {
            this.mapNotificationToToast.forEach(({ list }) => list.layout(width));
        }
        layoutContainer(heightToGive) {
            let visibleToasts = 0;
            for (const toast of this.getToasts(ToastVisibility.HIDDEN_OR_VISIBLE)) {
                // In order to measure the client height, the element cannot have display: none
                toast.container.style.opacity = '0';
                this.updateToastVisibility(toast, true);
                heightToGive -= toast.container.offsetHeight;
                let makeVisible = false;
                if (visibleToasts === NotificationsToasts_1.MAX_NOTIFICATIONS) {
                    makeVisible = false; // never show more than MAX_NOTIFICATIONS
                }
                else if (heightToGive >= 0) {
                    makeVisible = true; // hide toast if available height is too little
                }
                // Hide or show toast based on context
                this.updateToastVisibility(toast, makeVisible);
                toast.container.style.opacity = '';
                if (makeVisible) {
                    visibleToasts++;
                }
            }
        }
        updateToastVisibility(toast, visible) {
            if (this.isToastInDOM(toast) === visible) {
                return;
            }
            // Update visibility in DOM
            const notificationsToastsContainer = (0, types_1.assertIsDefined)(this.notificationsToastsContainer);
            if (visible) {
                notificationsToastsContainer.appendChild(toast.container);
            }
            else {
                notificationsToastsContainer.removeChild(toast.container);
            }
            // Update visibility in model
            toast.item.updateVisibility(visible);
        }
        isToastInDOM(toast) {
            return !!toast.container.parentElement;
        }
    };
    exports.NotificationsToasts = NotificationsToasts;
    exports.NotificationsToasts = NotificationsToasts = NotificationsToasts_1 = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, themeService_1.IThemeService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, lifecycle_2.ILifecycleService),
        __param(8, host_1.IHostService)
    ], NotificationsToasts);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc1RvYXN0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL25vdGlmaWNhdGlvbnMvbm90aWZpY2F0aW9uc1RvYXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBaUNoRyxJQUFLLGVBSUo7SUFKRCxXQUFLLGVBQWU7UUFDbkIsK0VBQWlCLENBQUE7UUFDakIseURBQU0sQ0FBQTtRQUNOLDJEQUFPLENBQUE7SUFDUixDQUFDLEVBSkksZUFBZSxLQUFmLGVBQWUsUUFJbkI7SUFFTSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHVCQUFROztpQkFFeEIsY0FBUyxHQUFHLEdBQUcsQUFBTixDQUFPO2lCQUNoQixzQkFBaUIsR0FBRyxDQUFDLEFBQUosQ0FBSztpQkFFdEIsa0JBQWEsR0FBbUM7WUFDdkUsQ0FBQyx1QkFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUs7WUFDdEIsQ0FBQyx1QkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUs7WUFDekIsQ0FBQyx1QkFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUs7U0FDdkIsQUFKb0MsQ0FJbkM7aUJBRXNCLG9CQUFlLEdBQUc7WUFDekMsc0RBQXNEO1lBQ3RELFFBQVEsRUFBRSxHQUFHO1lBQ2IsK0RBQStEO1lBQy9ELEtBQUssRUFBRSxxQkFBbUIsQ0FBQyxpQkFBaUI7U0FDNUMsQUFMc0MsQ0FLckM7UUFNRixJQUFJLFNBQVMsS0FBYyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQWF0RCxZQUNrQixTQUFzQixFQUN0QixLQUEwQixFQUNwQixvQkFBNEQsRUFDMUQsYUFBdUQsRUFDakUsWUFBMkIsRUFDcEIs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