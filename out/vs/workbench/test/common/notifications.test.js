/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/notifications", "vs/base/common/actions", "vs/platform/notification/common/notification", "vs/base/common/errorMessage", "vs/workbench/services/notification/common/notificationService", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/async", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert, notifications_1, actions_1, notification_1, errorMessage_1, notificationService_1, workbenchTestServices_1, async_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notifications', () => {
        const disposables = new lifecycle_1.DisposableStore();
        const noFilter = { global: notification_1.NotificationsFilter.OFF, sources: new Map() };
        teardown(() => {
            disposables.clear();
        });
        test('Items', () => {
            // Invalid
            assert.ok(!notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: '' }, noFilter));
            assert.ok(!notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: null }, noFilter));
            // Duplicates
            const item1 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, noFilter);
            const item2 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, noFilter);
            const item3 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Info, message: 'Info Message' }, noFilter);
            const item4 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message', source: 'Source' }, noFilter);
            const item5 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message', actions: { primary: [disposables.add(new actions_1.Action('id', 'label'))] } }, noFilter);
            const item6 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message', actions: { primary: [disposables.add(new actions_1.Action('id', 'label'))] }, progress: { infinite: true } }, noFilter);
            assert.strictEqual(item1.equals(item1), true);
            assert.strictEqual(item2.equals(item2), true);
            assert.strictEqual(item3.equals(item3), true);
            assert.strictEqual(item4.equals(item4), true);
            assert.strictEqual(item5.equals(item5), true);
            assert.strictEqual(item1.equals(item2), true);
            assert.strictEqual(item1.equals(item3), false);
            assert.strictEqual(item1.equals(item4), false);
            assert.strictEqual(item1.equals(item5), false);
            const itemId1 = notifications_1.NotificationViewItem.create({ id: 'same', message: 'Info Message', severity: notification_1.Severity.Info }, noFilter);
            const itemId2 = notifications_1.NotificationViewItem.create({ id: 'same', message: 'Error Message', severity: notification_1.Severity.Error }, noFilter);
            assert.strictEqual(itemId1.equals(itemId2), true);
            assert.strictEqual(itemId1.equals(item3), false);
            // Progress
            assert.strictEqual(item1.hasProgress, false);
            assert.strictEqual(item6.hasProgress, true);
            // Message Box
            assert.strictEqual(item5.canCollapse, false);
            assert.strictEqual(item5.expanded, true);
            // Events
            let called = 0;
            disposables.add(item1.onDidChangeExpansion(() => {
                called++;
            }));
            item1.expand();
            item1.expand();
            item1.collapse();
            item1.collapse();
            assert.strictEqual(called, 2);
            called = 0;
            disposables.add(item1.onDidChangeContent(e => {
                if (e.kind === 3 /* NotificationViewItemContentChangeKind.PROGRESS */) {
                    called++;
                }
            }));
            item1.progress.infinite();
            item1.progress.done();
            assert.strictEqual(called, 2);
            called = 0;
            disposables.add(item1.onDidChangeContent(e => {
                if (e.kind === 1 /* NotificationViewItemContentChangeKind.MESSAGE */) {
                    called++;
                }
            }));
            item1.updateMessage('message update');
            called = 0;
            disposables.add(item1.onDidChangeContent(e => {
                if (e.kind === 0 /* NotificationViewItemContentChangeKind.SEVERITY */) {
                    called++;
                }
            }));
            item1.updateSeverity(notification_1.Severity.Error);
            called = 0;
            disposables.add(item1.onDidChangeContent(e => {
                if (e.kind === 2 /* NotificationViewItemContentChangeKind.ACTIONS */) {
                    called++;
                }
            }));
            item1.updateActions({ primary: [disposables.add(new actions_1.Action('id2', 'label'))] });
            assert.strictEqual(called, 1);
            called = 0;
            disposables.add(item1.onDidChangeVisibility(e => {
                called++;
            }));
            item1.updateVisibility(true);
            item1.updateVisibility(false);
            item1.updateVisibility(false);
            assert.strictEqual(called, 2);
            called = 0;
            disposables.add(item1.onDidClose(() => {
                called++;
            }));
            item1.close();
            assert.strictEqual(called, 1);
            // Error with Action
            const item7 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: (0, errorMessage_1.createErrorWithActions)('Hello Error', [disposables.add(new actions_1.Action('id', 'label'))]) }, noFilter);
            assert.strictEqual(item7.actions.primary.length, 1);
            // Filter
            const item8 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, { global: notification_1.NotificationsFilter.OFF, sources: new Map() });
            assert.strictEqual(item8.priority, notification_1.NotificationPriority.DEFAULT);
            const item9 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, { global: notification_1.NotificationsFilter.ERROR, sources: new Map() });
            assert.strictEqual(item9.priority, notification_1.NotificationPriority.DEFAULT);
            const item10 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Warning, message: 'Error Message' }, { global: notification_1.NotificationsFilter.ERROR, sources: new Map() });
            assert.strictEqual(item10.priority, notification_1.NotificationPriority.SILENT);
            const sources = new Map();
            sources.set('test.source', notification_1.NotificationsFilter.ERROR);
            const item11 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Warning, message: 'Error Message', source: 'test.source' }, { global: notification_1.NotificationsFilter.OFF, sources });
            assert.strictEqual(item11.priority, notification_1.NotificationPriority.DEFAULT);
            const item12 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Warning, message: 'Error Message', source: { id: 'test.source', label: 'foo' } }, { global: notification_1.NotificationsFilter.OFF, sources });
            assert.strictEqual(item12.priority, notification_1.NotificationPriority.SILENT);
            const item13 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Warning, message: 'Error Message', source: { id: 'test.source2', label: 'foo' } }, { global: notification_1.NotificationsFilter.OFF, sources });
            assert.strictEqual(item13.priority, notification_1.NotificationPriority.DEFAULT);
            for (const item of [item1, item2, item3, item4, item5, item6, itemId1, itemId2, item7, item8, item9, item10, item11, item12, item13]) {
                item.close();
            }
        });
        test('Items - does not fire changed when message did not change (content, severity)', async () => {
            const item1 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, noFilter);
            let fired = false;
            disposables.add(item1.onDidChangeContent(() => {
                fired = true;
            }));
            item1.updateMessage('Error Message');
            await (0, async_1.timeout)(0);
            assert.ok(!fired, 'Expected onDidChangeContent to not be fired');
            item1.updateSeverity(notification_1.Severity.Error);
            await (0, async_1.timeout)(0);
            assert.ok(!fired, 'Expected onDidChangeContent to not be fired');
            for (const item of [item1]) {
                item.close();
            }
        });
        test('Model', () => {
            const model = disposables.add(new notifications_1.NotificationsModel());
            let lastNotificationEvent;
            disposables.add(model.onDidChangeNotification(e => {
                lastNotificationEvent = e;
            }));
            let lastStatusMessageEvent;
            disposables.add(model.onDidChangeStatusMessage(e => {
                lastStatusMessageEvent = e;
            }));
            const item1 = { severity: notification_1.Severity.Error, message: 'Error Message', actions: { primary: [disposables.add(new actions_1.Action('id', 'label'))] } };
            const item2 = { severity: notification_1.Severity.Warning, message: 'Warning Message', source: 'Some Source' };
            const item2Duplicate = { severity: notification_1.Severity.Warning, message: 'Warning Message', source: 'Some Source' };
            const item3 = { severity: notification_1.Severity.Info, message: 'Info Message' };
            const item1Handle = model.addNotification(item1);
            assert.strictEqual(lastNotificationEvent.item.severity, item1.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item1.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            item1Handle.updateMessage('Different Error Message');
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 1 /* NotificationViewItemContentChangeKind.MESSAGE */);
            item1Handle.updateSeverity(notification_1.Severity.Warning);
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 0 /* NotificationViewItemContentChangeKind.SEVERITY */);
            item1Handle.updateActions({ primary: [], secondary: [] });
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 2 /* NotificationViewItemContentChangeKind.ACTIONS */);
            item1Handle.progress.infinite();
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 3 /* NotificationViewItemContentChangeKind.PROGRESS */);
            const item2Handle = model.addNotification(item2);
            assert.strictEqual(lastNotificationEvent.item.severity, item2.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item2.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            const item3Handle = model.addNotification(item3);
            assert.strictEqual(lastNotificationEvent.item.severity, item3.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item3.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            assert.strictEqual(model.notifications.length, 3);
            let called = 0;
            disposables.add(item1Handle.onDidClose(() => {
                called++;
            }));
            item1Handle.close();
            assert.strictEqual(called, 1);
            assert.strictEqual(model.notifications.length, 2);
            assert.strictEqual(lastNotificationEvent.item.severity, notification_1.Severity.Warning);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), 'Different Error Message');
            assert.strictEqual(lastNotificationEvent.index, 2);
            assert.strictEqual(lastNotificationEvent.kind, 3 /* NotificationChangeType.REMOVE */);
            const item2DuplicateHandle = model.addNotification(item2Duplicate);
            assert.strictEqual(model.notifications.length, 2);
            assert.strictEqual(lastNotificationEvent.item.severity, item2Duplicate.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item2Duplicate.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            item2Handle.close();
            assert.strictEqual(model.notifications.length, 1);
            assert.strictEqual(lastNotificationEvent.item.severity, item2Duplicate.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item2Duplicate.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 3 /* NotificationChangeType.REMOVE */);
            model.notifications[0].expand();
            assert.strictEqual(lastNotificationEvent.item.severity, item3.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item3.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 2 /* NotificationChangeType.EXPAND_COLLAPSE */);
            const disposable = model.showStatusMessage('Hello World');
            assert.strictEqual(model.statusMessage.message, 'Hello World');
            assert.strictEqual(lastStatusMessageEvent.item.message, model.statusMessage.message);
            assert.strictEqual(lastStatusMessageEvent.kind, 0 /* StatusMessageChangeType.ADD */);
            disposable.dispose();
            assert.ok(!model.statusMessage);
            assert.strictEqual(lastStatusMessageEvent.kind, 1 /* StatusMessageChangeType.REMOVE */);
            const disposable2 = model.showStatusMessage('Hello World 2');
            const disposable3 = model.showStatusMessage('Hello World 3');
            assert.strictEqual(model.statusMessage.message, 'Hello World 3');
            disposable2.dispose();
            assert.strictEqual(model.statusMessage.message, 'Hello World 3');
            disposable3.dispose();
            assert.ok(!model.statusMessage);
            item2DuplicateHandle.close();
            item3Handle.close();
        });
        test('Service', async () => {
            const service = disposables.add(new notificationService_1.NotificationService(disposables.add(new workbenchTestServices_1.TestStorageService())));
            let addNotificationCount = 0;
            let notification;
            disposables.add(service.onDidAddNotification(n => {
                addNotificationCount++;
                notification = n;
            }));
            service.info('hello there');
            assert.strictEqual(addNotificationCount, 1);
            assert.strictEqual(notification.message, 'hello there');
            assert.strictEqual(notification.priority, notification_1.NotificationPriority.DEFAULT);
            assert.strictEqual(notification.source, undefined);
            service.model.notifications[0].close();
            let notificationHandle = service.notify({ message: 'important message', severity: notification_1.Severity.Warning });
            assert.strictEqual(addNotificationCount, 2);
            assert.strictEqual(notification.message, 'important message');
            assert.strictEqual(notification.severity, notification_1.Severity.Warning);
            let removeNotificationCount = 0;
            disposables.add(service.onDidRemoveNotification(n => {
                removeNotificationCount++;
                notification = n;
            }));
            notificationHandle.close();
            assert.strictEqual(removeNotificationCount, 1);
            assert.strictEqual(notification.message, 'important message');
            notificationHandle = service.notify({ priority: notification_1.NotificationPriority.SILENT, message: 'test', severity: notification_1.Severity.Ignore });
            assert.strictEqual(addNotificationCount, 3);
            assert.strictEqual(notification.message, 'test');
            assert.strictEqual(notification.priority, notification_1.NotificationPriority.SILENT);
            notificationHandle.close();
            assert.strictEqual(removeNotificationCount, 2);
            notificationHandle.close();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9ucy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvY29tbW9uL25vdGlmaWNhdGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUUzQixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxNQUFNLFFBQVEsR0FBeUIsRUFBRSxNQUFNLEVBQUUsa0NBQW1CLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUM7UUFFL0YsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO1lBRWxCLFVBQVU7WUFDVixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsb0NBQW9CLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLHVCQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzdGLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxvQ0FBb0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsdUJBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUssRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFaEcsYUFBYTtZQUNiLE1BQU0sS0FBSyxHQUFHLG9DQUFvQixDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSx1QkFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLEVBQUUsUUFB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