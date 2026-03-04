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
define(["require", "exports", "vs/nls", "vs/platform/notification/common/notification", "vs/workbench/common/notifications", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/base/common/actions", "vs/platform/storage/common/storage"], function (require, exports, nls_1, notification_1, notifications_1, lifecycle_1, event_1, extensions_1, actions_1, storage_1) {
    "use strict";
    var NotificationService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationService = void 0;
    let NotificationService = class NotificationService extends lifecycle_1.Disposable {
        static { NotificationService_1 = this; }
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this.model = this._register(new notifications_1.NotificationsModel());
            this._onDidAddNotification = this._register(new event_1.Emitter());
            this.onDidAddNotification = this._onDidAddNotification.event;
            this._onDidRemoveNotification = this._register(new event_1.Emitter());
            this.onDidRemoveNotification = this._onDidRemoveNotification.event;
            this._onDidChangeFilter = this._register(new event_1.Emitter());
            this.onDidChangeFilter = this._onDidChangeFilter.event;
            this.globalFilterEnabled = this.storageService.getBoolean(NotificationService_1.GLOBAL_FILTER_SETTINGS_KEY, -1 /* StorageScope.APPLICATION */, false);
            this.mapSourceToFilter = (() => {
                const map = new Map();
                for (const sourceFilter of this.storageService.getObject(NotificationService_1.PER_SOURCE_FILTER_SETTINGS_KEY, -1 /* StorageScope.APPLICATION */, [])) {
                    map.set(sourceFilter.id, sourceFilter);
                }
                return map;
            })();
            this.updateFilters();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.model.onDidChangeNotification(e => {
                switch (e.kind) {
                    case 0 /* NotificationChangeType.ADD */:
                    case 3 /* NotificationChangeType.REMOVE */: {
                        const source = typeof e.item.sourceId === 'string' && typeof e.item.source === 'string' ? { id: e.item.sourceId, label: e.item.source } : e.item.source;
                        const notification = {
                            message: e.item.message.original,
                            severity: e.item.severity,
                            source,
                            priority: e.item.priority
                        };
                        if (e.kind === 0 /* NotificationChangeType.ADD */) {
                            // Make sure to track sources for notifications by registering
                            // them with our do not disturb system which is backed by storage
                            if ((0, notification_1.isNotificationSource)(source)) {
                                if (!this.mapSourceToFilter.has(source.id)) {
                                    this.setFilter({ ...source, filter: notification_1.NotificationsFilter.OFF });
                                }
                                else {
                                    this.updateSourceFilter(source);
                                }
                            }
                            this._onDidAddNotification.fire(notification);
                        }
                        if (e.kind === 3 /* NotificationChangeType.REMOVE */) {
                            this._onDidRemoveNotification.fire(notification);
                        }
                        break;
                    }
                }
            }));
        }
        //#region Filters
        static { this.GLOBAL_FILTER_SETTINGS_KEY = 'notifications.doNotDisturbMode'; }
        static { this.PER_SOURCE_FILTER_SETTINGS_KEY = 'notifications.perSourceDoNotDisturbMode'; }
        setFilter(filter) {
            if (typeof filter === 'number') {
                if (this.globalFilterEnabled === (filter === notification_1.NotificationsFilter.ERROR)) {
                    return; // no change
                }
                // Store into model and persist
                this.globalFilterEnabled = filter === notification_1.NotificationsFilter.ERROR;
                this.storageService.store(NotificationService_1.GLOBAL_FILTER_SETTINGS_KEY, this.globalFilterEnabled, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                // Update model
                this.updateFilters();
                // Events
                this._onDidChangeFilter.fire();
            }
            else {
                const existing = this.mapSourceToFilter.get(filter.id);
                if (existing?.filter === filter.filter && existing.label === filter.label) {
                    return; // no change
                }
                // Store into model and persist
                this.mapSourceToFilter.set(filter.id, { id: filter.id, label: filter.label, filter: filter.filter });
                this.saveSourceFilters();
                // Update model
                this.updateFilters();
            }
        }
        getFilter(source) {
            if (source) {
                return this.mapSourceToFilter.get(source.id)?.filter ?? notification_1.NotificationsFilter.OFF;
            }
            return this.globalFilterEnabled ? notification_1.NotificationsFilter.ERROR : notification_1.NotificationsFilter.OFF;
        }
        updateSourceFilter(source) {
            const existing = this.mapSourceToFilter.get(source.id);
            if (!existing) {
                return; // nothing to do
            }
            // Store into model and persist
            if (existing.label !== source.label) {
                this.mapSourceToFilter.set(source.id, { id: source.id, label: source.label, filter: existing.filter });
                this.saveSourceFilters();
            }
        }
        saveSourceFilters() {
            this.storageService.store(NotificationService_1.PER_SOURCE_FILTER_SETTINGS_KEY, JSON.stringify([...this.mapSourceToFilter.values()]), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        getFilters() {
            return [...this.mapSourceToFilter.values()];
        }
        updateFilters() {
            this.model.setFilter({
                global: this.globalFilterEnabled ? notification_1.NotificationsFilter.ERROR : notification_1.NotificationsFilter.OFF,
                sources: new Map([...this.mapSourceToFilter.values()].map(source => [source.id, source.filter]))
            });
        }
        removeFilter(sourceId) {
            if (this.mapSourceToFilter.delete(sourceId)) {
                // Persist
                this.saveSourceFilters();
                // Update model
                this.updateFilters();
            }
        }
        //#endregion
        info(message) {
            if (Array.isArray(message)) {
                for (const messageEntry of message) {
                    this.info(messageEntry);
                }
                return;
            }
            this.model.addNotification({ severity: notification_1.Severity.Info, message });
        }
        warn(message) {
            if (Array.isArray(message)) {
                for (const messageEntry of message) {
                    this.warn(messageEntry);
                }
                return;
            }
            this.model.addNotification({ severity: notification_1.Severity.Warning, message });
        }
        error(message) {
            if (Array.isArray(message)) {
                for (const messageEntry of message) {
                    this.error(messageEntry);
                }
                return;
            }
            this.model.addNotification({ severity: notification_1.Severity.Error, message });
        }
        notify(notification) {
            const toDispose = new lifecycle_1.DisposableStore();
            // Handle neverShowAgain option accordingly
            if (notification.neverShowAgain) {
                const scope = this.toStorageScope(notification.neverShowAgain);
                const id = notification.neverShowAgain.id;
                // If the user already picked to not show the notification
                // again, we return with a no-op notification here
                if (this.storageService.getBoolean(id, scope)) {
                    return new notification_1.NoOpNotification();
                }
                const neverShowAgainAction = toDispose.add(new actions_1.Action('workbench.notification.neverShowAgain', (0, nls_1.localize)('neverShowAgain', "Don't Show Again"), undefined, true, async () => {
                    // Close notification
                    handle.close();
                    // Remember choice
                    this.storageService.store(id, true, scope, 0 /* StorageTarget.USER */);
                }));
                // Insert as primary or secondary action
                const actions = {
                    primary: notification.actions?.primary || [],
                    secondary: notification.actions?.secondary || []
                };
                if (!notification.neverShowAgain.isSecondary) {
                    actions.primary = [neverShowAgainAction, ...actions.primary]; // action comes first
                }
                else {
                    actions.secondary = [...actions.secondary, neverShowAgainAction]; // actions comes last
                }
                notification.actions = actions;
            }
            // Show notification
            const handle = this.model.addNotification(notification);
            // Cleanup when notification gets disposed
            event_1.Event.once(handle.onDidClose)(() => toDispose.dispose());
            return handle;
        }
        toStorageScope(options) {
            switch (options.scope) {
                case notification_1.NeverShowAgainScope.APPLICATION:
                    return -1 /* StorageScope.APPLICATION */;
                case notification_1.NeverShowAgainScope.PROFILE:
                    return 0 /* StorageScope.PROFILE */;
                case notification_1.NeverShowAgainScope.WORKSPACE:
                    return 1 /* StorageScope.WORKSPACE */;
                default:
                    return -1 /* StorageScope.APPLICATION */;
            }
        }
        prompt(severity, message, choices, options) {
            const toDispose = new lifecycle_1.DisposableStore();
            // Handle neverShowAgain option accordingly
            if (options?.neverShowAgain) {
                const scope = this.toStorageScope(options.neverShowAgain);
                const id = options.neverShowAgain.id;
                // If the user already picked to not show the notification
                // again, we return with a no-op notification here
                if (this.storageService.getBoolean(id, scope)) {
                    return new notification_1.NoOpNotification();
                }
                const neverShowAgainChoice = {
                    label: (0, nls_1.localize)('neverShowAgain', "Don't Show Again"),
                    run: () => this.storageService.store(id, true, scope, 0 /* StorageTarget.USER */),
                    isSecondary: options.neverShowAgain.isSecondary
                };
                // Insert as primary or secondary action
                if (!options.neverShowAgain.isSecondary) {
                    choices = [neverShowAgainChoice, ...choices]; // action comes first
                }
                else {
                    choices = [...choices, neverShowAgainChoice]; // actions comes last
                }
            }
            let choiceClicked = false;
            // Convert choices into primary/secondary actions
            const primaryActions = [];
            const secondaryActions = [];
            choices.forEach((choice, index) => {
                const action = new notifications_1.ChoiceAction(`workbench.dialog.choice.${index}`, choice);
                if (!choice.isSecondary) {
                    primaryActions.push(action);
                }
                else {
                    secondaryActions.push(action);
                }
                // React to action being clicked
                toDispose.add(action.onDidRun(() => {
                    choiceClicked = true;
                    // Close notification unless we are told to keep open
                    if (!choice.keepOpen) {
                        handle.close();
                    }
                }));
                toDispose.add(action);
            });
            // Show notification with actions
            const actions = { primary: primaryActions, secondary: secondaryActions };
            const handle = this.notify({ severity, message, actions, sticky: options?.sticky, priority: options?.priority });
            event_1.Event.once(handle.onDidClose)(() => {
                // Cleanup when notification gets disposed
                toDispose.dispose();
                // Indicate cancellation to the outside if no action was executed
                if (options && typeof options.onCancel === 'function' && !choiceClicked) {
                    options.onCancel();
                }
            });
            return handle;
        }
        status(message, options) {
            return this.model.showStatusMessage(message, options);
        }
    };
    exports.NotificationService = NotificationService;
    exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
        __param(0, storage_1.IStorageService)
    ], NotificationService);
    (0, extensions_1.registerSingleton)(notification_1.INotificationService, NotificationService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9ub3RpZmljYXRpb24vY29tbW9uL25vdGlmaWNhdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVOztRQVlsRCxZQUNrQixjQUFnRDtZQUVqRSxLQUFLLEVBQUUsQ0FBQztZQUYwQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFUekQsVUFBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQ0FBa0IsRUFBRSxDQUFDLENBQUM7WUFFekMsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBaUIsQ0FBQyxDQUFDO1lBQzdFLHlCQUFvQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7WUFFaEQsNkJBQXdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBaUIsQ0FBQyxDQUFDO1lBQ2hGLDRCQUF1QixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUM7WUF3RHRELHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2pFLHNCQUFpQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFFbkQsd0JBQW1CLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMscUJBQW1CLENBQUMsMEJBQTBCLHFDQUE0QixLQUFLLENBQUMsQ0FBQztZQUU3SCxzQkFBaUIsR0FBNEQsQ0FBQyxHQUFHLEVBQUU7Z0JBQ25HLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxFQUFxQyxDQUFDO2dCQUV6RCxLQUFLLE1BQU0sWUFBWSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUE4QixxQkFBbUIsQ0FBQyw4QkFBOEIscUNBQTRCLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ3pLLEdBQUcsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDeEMsQ0FBQztnQkFFRCxPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUMsQ0FBQyxFQUFFLENBQUM7WUE5REosSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyRCxRQUFRLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDaEIsd0NBQWdDO29CQUNoQywwQ0FBa0MsQ0FBQyxDQUFDLENBQUM7d0JBQ3BDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUFJLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7d0JBRXhKLE1BQU0sWUFBWSxHQUFrQjs0QkFDbkMsT0FBTyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVE7NEJBQ2hDLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVE7NEJBQ3pCLE1BQU07NEJBQ04sUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUTt5QkFDekIsQ0FBQzt3QkFFRixJQUFJLENBQUMsQ0FBQyxJQUFJLHVDQUErQixFQUFFLENBQUM7NEJBRTNDLDhEQUE4RDs0QkFDOUQsaUVBQWlFOzRCQUVqRSxJQUFJLElBQUEsbUNBQW9CLEVBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQ0FDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0NBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLE1BQU0sRUFBRSxNQUFNLEVBQUUsa0NBQW1CLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztnQ0FDaEUsQ0FBQztxQ0FBTSxDQUFDO29DQUNQLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQ0FDakMsQ0FBQzs0QkFDRixDQUFDOzRCQUVELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7d0JBQy9DLENBQUM7d0JBRUQsSUFBSSxDQUFDLENBQUMsSUFBSSwwQ0FBa0MsRUFBRSxDQUFDOzRCQUM5QyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUNsRCxDQUFDO3dCQUVELE1BQU07b0JBQ1AsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxpQkFBaUI7aUJBRU8sK0JBQTBCLEdBQUcsZ0NBQWdDLEFBQW5DLENBQW9DO2lCQUM5RCxtQ0FBOEIsR0FBRyx5Q0FBeUMsQUFBNUMsQ0FBNkM7UUFpQm5HLFNBQVMsQ0FBQyxNQUF1RDtZQUNoRSxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLElBQUksQ0FBQyxtQkFBbUIsS0FBSyxDQUFDLE1BQU0sS0FBSyxrQ0FBbUIsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN6RSxPQUFPLENBQUMsWUFBWTtnQkFDckIsQ0FBQztnQkFFRCwrQkFBK0I7Z0JBQy9CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxNQUFNLEtBQUssa0NBQW1CLENBQUMsS0FBSyxDQUFDO2dCQUNoRSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxxQkFBbUIsQ0FBQywwQkFBMEIsRUFBRSxJQUFJLENBQUMsbUJBQW1CLG1FQUFrRCxDQUFDO2dCQUVySixlQUFlO2dCQUNmLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFFckIsU0FBUztnQkFDVCxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDaEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLFFBQVEsRUFBRSxNQUFNLEtBQUssTUFBTSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsS0FBSyxLQUFLLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDM0UsT0FBTyxDQUFDLFlBQVk7Z0JBQ3JCLENBQUM7Z0JBRUQsK0JBQStCO2dCQUMvQixJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ3JHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUV6QixlQUFlO2dCQUNmLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN0QixDQUFDO1FBQ0YsQ0FBQztRQUVELFNBQVMsQ0FBQyxNQUE0QjtZQUNyQyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxJQUFJLGtDQUFtQixDQUFDLEdBQUcsQ0FBQztZQUNqRixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLGtDQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsa0NBQW1CLENBQUMsR0FBRyxDQUFDO1FBQ3ZGLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxNQUEyQjtZQUNyRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxDQUFDLGdCQUFnQjtZQUN6QixDQUFDO1lBRUQsK0JBQStCO1lBQy9CLElBQUksUUFBUSxDQUFDLEtBQUssS0FBSyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDdkcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDMUIsQ0FBQztRQUNGLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMscUJBQW1CLENBQUMsOEJBQThCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsbUVBQWtELENBQUM7UUFDdEwsQ0FBQztRQUVELFVBQVU7WUFDVCxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRU8sYUFBYTtZQUNwQixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztnQkFDcEIsTUFBTSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsa0NBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxrQ0FBbUIsQ0FBQyxHQUFHO2dCQUN0RixPQUFPLEVBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzthQUNoRyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsWUFBWSxDQUFDLFFBQWdCO1lBQzVCLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUU3QyxVQUFVO2dCQUNWLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUV6QixlQUFlO2dCQUNmLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN0QixDQUFDO1FBQ0YsQ0FBQztRQUVELFlBQVk7UUFFWixJQUFJLENBQUMsT0FBb0Q7WUFDeEQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLEtBQUssTUFBTSxZQUFZLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3pCLENBQUM7Z0JBRUQsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLFFBQVEsRUFBRSx1QkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFRCxJQUFJLENBQUMsT0FBb0Q7WUFDeEQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLEtBQUssTUFBTSxZQUFZLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3pCLENBQUM7Z0JBRUQsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLFFBQVEsRUFBRSx1QkFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBb0Q7WUFDekQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLEtBQUssTUFBTSxZQUFZLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzFCLENBQUM7Z0JBRUQsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLFFBQVEsRUFBRSx1QkFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFFRCxNQUFNLENBQUMsWUFBMkI7WUFDakMsTUFBTSxTQUFTLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFeEMsMkNBQTJDO1lBRTNDLElBQUksWUFBWSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxFQUFFLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7Z0JBRTFDLDBEQUEwRDtnQkFDMUQsa0RBQWtEO2dCQUNsRCxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUMvQyxPQUFPLElBQUksK0JBQWdCLEVBQUUsQ0FBQztnQkFDL0IsQ0FBQztnQkFFRCxNQUFNLG9CQUFvQixHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxnQkFBTSxDQUNwRCx1Q0FBdUMsRUFDdkMsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUMsRUFDOUMsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtvQkFFM0IscUJBQXFCO29CQUNyQixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBRWYsa0JBQWtCO29CQUNsQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssNkJBQXFCLENBQUM7Z0JBQ2hFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUwsd0NBQXdDO2dCQUN4QyxNQUFNLE9BQU8sR0FBRztvQkFDZixPQUFPLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxPQUFPLElBQUksRUFBRTtvQkFDNUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxJQUFJLEVBQUU7aUJBQ2hELENBQUM7Z0JBQ0YsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQzlDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHFCQUFxQjtnQkFDcEYsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLHFCQUFxQjtnQkFDeEYsQ0FBQztnQkFFRCxZQUFZLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUNoQyxDQUFDO1lBRUQsb0JBQW9CO1lBQ3BCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRXhELDBDQUEwQztZQUMxQyxhQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUV6RCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyxjQUFjLENBQUMsT0FBK0I7WUFDckQsUUFBUSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3ZCLEtBQUssa0NBQW1CLENBQUMsV0FBVztvQkFDbkMseUNBQWdDO2dCQUNqQyxLQUFLLGtDQUFtQixDQUFDLE9BQU87b0JBQy9CLG9DQUE0QjtnQkFDN0IsS0FBSyxrQ0FBbUIsQ0FBQyxTQUFTO29CQUNqQyxzQ0FBOEI7Z0JBQy9CO29CQUNDLHlDQUFnQztZQUNsQyxDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUFrQixFQUFFLE9BQWUsRUFBRSxPQUF3QixFQUFFLE9BQXdCO1lBQzdGLE1BQU0sU0FBUyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRXhDLDJDQUEyQztZQUMzQyxJQUFJLE9BQU8sRUFBRSxjQUFjLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQzFELE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO2dCQUVyQywwREFBMEQ7Z0JBQzFELGtEQUFrRDtnQkFDbEQsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDL0MsT0FBTyxJQUFJLCtCQUFnQixFQUFFLENBQUM7Z0JBQy9CLENBQUM7Z0JBRUQsTUFBTSxvQkFBb0IsR0FBRztvQkFDNUIsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDO29CQUNyRCxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLDZCQUFxQjtvQkFDekUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVztpQkFDL0MsQ0FBQztnQkFFRix3Q0FBd0M7Z0JBQ3hDLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUN6QyxPQUFPLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMscUJBQXFCO2dCQUNwRSxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxHQUFHLENBQUMsR0FBRyxPQUFPLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLHFCQUFxQjtnQkFDcEUsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLGFBQWEsR0FBRyxLQUFLLENBQUM7WUFHMUIsaURBQWlEO1lBQ2pELE1BQU0sY0FBYyxHQUFjLEVBQUUsQ0FBQztZQUNyQyxNQUFNLGdCQUFnQixHQUFjLEVBQUUsQ0FBQztZQUN2QyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNqQyxNQUFNLE1BQU0sR0FBRyxJQUFJLDRCQUFZLENBQUMsMkJBQTJCLEtBQUssRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM1RSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUN6QixjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM3QixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMvQixDQUFDO2dCQUVELGdDQUFnQztnQkFDaEMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRTtvQkFDbEMsYUFBYSxHQUFHLElBQUksQ0FBQztvQkFFckIscURBQXFEO29CQUNyRCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUN0QixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2hCLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFSixTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxDQUFDO1lBRUgsaUNBQWlDO1lBQ2pDLE1BQU0sT0FBTyxHQUF5QixFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixFQUFFLENBQUM7WUFDL0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUVqSCxhQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEVBQUU7Z0JBRWxDLDBDQUEwQztnQkFDMUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUVwQixpRUFBaUU7Z0JBQ2pFLElBQUksT0FBTyxJQUFJLE9BQU8sT0FBTyxDQUFDLFFBQVEsS0FBSyxVQUFVLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDekUsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNwQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFRCxNQUFNLENBQUMsT0FBNEIsRUFBRSxPQUErQjtZQUNuRSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZELENBQUM7O0lBOVVXLGtEQUFtQjtrQ0FBbkIsbUJBQW1CO1FBYTdCLFdBQUEseUJBQWUsQ0FBQTtPQWJMLG1CQUFtQixDQStVL0I7SUFFRCxJQUFBLDhCQUFpQixFQUFDLG1DQUFvQixFQUFFLG1CQUFtQixvQ0FBNEIsQ0FBQyJ9