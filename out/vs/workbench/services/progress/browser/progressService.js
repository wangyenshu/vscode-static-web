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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/progress/common/progress", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/async", "vs/workbench/services/activity/common/activity", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/platform/layout/browser/layoutService", "vs/base/browser/ui/dialog/dialog", "vs/platform/keybinding/common/keybinding", "vs/base/browser/dom", "vs/base/common/linkedText", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/iconLabels", "vs/platform/theme/browser/defaultStyles", "vs/css!./media/progressService"], function (require, exports, nls_1, lifecycle_1, progress_1, statusbar_1, async_1, activity_1, notification_1, actions_1, event_1, extensions_1, layoutService_1, dialog_1, keybinding_1, dom_1, linkedText_1, views_1, viewsService_1, panecomposite_1, iconLabels_1, defaultStyles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgressService = void 0;
    let ProgressService = class ProgressService extends lifecycle_1.Disposable {
        constructor(activityService, paneCompositeService, viewDescriptorService, viewsService, notificationService, statusbarService, layoutService, keybindingService) {
            super();
            this.activityService = activityService;
            this.paneCompositeService = paneCompositeService;
            this.viewDescriptorService = viewDescriptorService;
            this.viewsService = viewsService;
            this.notificationService = notificationService;
            this.statusbarService = statusbarService;
            this.layoutService = layoutService;
            this.keybindingService = keybindingService;
            this.windowProgressStack = [];
            this.windowProgressStatusEntry = undefined;
        }
        async withProgress(options, task, onDidCancel) {
            const { location } = options;
            const handleStringLocation = (location) => {
                const viewContainer = this.viewDescriptorService.getViewContainerById(location);
                if (viewContainer) {
                    const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                    if (viewContainerLocation !== null) {
                        return this.withPaneCompositeProgress(location, viewContainerLocation, task, { ...options, location });
                    }
                }
                if (this.viewDescriptorService.getViewDescriptorById(location) !== null) {
                    return this.withViewProgress(location, task, { ...options, location });
                }
                throw new Error(`Bad progress location: ${location}`);
            };
            if (typeof location === 'string') {
                return handleStringLocation(location);
            }
            switch (location) {
                case 15 /* ProgressLocation.Notification */: {
                    let priority = options.priority;
                    if (priority !== notification_1.NotificationPriority.URGENT) {
                        if (this.notificationService.getFilter() === notification_1.NotificationsFilter.ERROR) {
                            priority = notification_1.NotificationPriority.SILENT;
                        }
                        else if ((0, notification_1.isNotificationSource)(options.source) && this.notificationService.getFilter(options.source) === notification_1.NotificationsFilter.ERROR) {
                            priority = notification_1.NotificationPriority.SILENT;
                        }
                    }
                    return this.withNotificationProgress({ ...options, location, priority }, task, onDidCancel);
                }
                case 10 /* ProgressLocation.Window */: {
                    const type = options.type;
                    if (options.command) {
                        // Window progress with command get's shown in the status bar
                        return this.withWindowProgress({ ...options, location, type }, task);
                    }
                    // Window progress without command can be shown as silent notification
                    // which will first appear in the status bar and can then be brought to
                    // the front when clicking.
                    return this.withNotificationProgress({ delay: 150 /* default for ProgressLocation.Window */, ...options, priority: notification_1.NotificationPriority.SILENT, location: 15 /* ProgressLocation.Notification */, type }, task, onDidCancel);
                }
                case 1 /* ProgressLocation.Explorer */:
                    return this.withPaneCompositeProgress('workbench.view.explorer', 0 /* ViewContainerLocation.Sidebar */, task, { ...options, location });
                case 3 /* ProgressLocation.Scm */:
                    return handleStringLocation('workbench.scm');
                case 5 /* ProgressLocation.Extensions */:
                    return this.withPaneCompositeProgress('workbench.view.extensions', 0 /* ViewContainerLocation.Sidebar */, task, { ...options, location });
                case 20 /* ProgressLocation.Dialog */:
                    return this.withDialogProgress(options, task, onDidCancel);
                default:
                    throw new Error(`Bad progress location: ${location}`);
            }
        }
        withWindowProgress(options, callback) {
            const task = [options, new progress_1.Progress(() => this.updateWindowProgress())];
            const promise = callback(task[1]);
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                this.windowProgressStack.unshift(task);
                this.updateWindowProgress();
                // show progress for at least 150ms
                Promise.all([
                    (0, async_1.timeout)(150),
                    promise
                ]).finally(() => {
                    const idx = this.windowProgressStack.indexOf(task);
                    this.windowProgressStack.splice(idx, 1);
                    this.updateWindowProgress();
                });
            }, 150);
            // cancel delay if promise finishes below 150ms
            return promise.finally(() => clearTimeout(delayHandle));
        }
        updateWindowProgress(idx = 0) {
            // We still have progress to show
            if (idx < this.windowProgressStack.length) {
                const [options, progress] = this.windowProgressStack[idx];
                const progressTitle = options.title;
                const progressMessage = progress.value && progress.value.message;
                const progressCommand = options.command;
                let text;
                let title;
                const source = options.source && typeof options.source !== 'string' ? options.source.label : options.source;
                if (progressTitle && progressMessage) {
                    // <title>: <message>
                    text = (0, nls_1.localize)('progress.text2', "{0}: {1}", progressTitle, progressMessage);
                    title = source ? (0, nls_1.localize)('progress.title3', "[{0}] {1}: {2}", source, progressTitle, progressMessage) : text;
                }
                else if (progressTitle) {
                    // <title>
                    text = progressTitle;
                    title = source ? (0, nls_1.localize)('progress.title2', "[{0}]: {1}", source, progressTitle) : text;
                }
                else if (progressMessage) {
                    // <message>
                    text = progressMessage;
                    title = source ? (0, nls_1.localize)('progress.title2', "[{0}]: {1}", source, progressMessage) : text;
                }
                else {
                    // no title, no message -> no progress. try with next on stack
                    this.updateWindowProgress(idx + 1);
                    return;
                }
                const statusEntryProperties = {
                    name: (0, nls_1.localize)('status.progress', "Progress Message"),
                    text,
                    showProgress: options.type || true,
                    ariaLabel: text,
                    tooltip: title,
                    command: progressCommand
                };
                if (this.windowProgressStatusEntry) {
                    this.windowProgressStatusEntry.update(statusEntryProperties);
                }
                else {
                    this.windowProgressStatusEntry = this.statusbarService.addEntry(statusEntryProperties, 'status.progress', 0 /* StatusbarAlignment.LEFT */);
                }
            }
            // Progress is done so we remove the status entry
            else {
                this.windowProgressStatusEntry?.dispose();
                this.windowProgressStatusEntry = undefined;
            }
        }
        withNotificationProgress(options, callback, onDidCancel) {
            const progressStateModel = new class extends lifecycle_1.Disposable {
                get step() { return this._step; }
                get done() { return this._done; }
                constructor() {
                    super();
                    this._onDidReport = this._register(new event_1.Emitter());
                    this.onDidReport = this._onDidReport.event;
                    this._onWillDispose = this._register(new event_1.Emitter());
                    this.onWillDispose = this._onWillDispose.event;
                    this._step = undefined;
                    this._done = false;
                    this.promise = callback(this);
                    this.promise.finally(() => {
                        this.dispose();
                    });
                }
                report(step) {
                    this._step = step;
                    this._onDidReport.fire(step);
                }
                cancel(choice) {
                    onDidCancel?.(choice);
                    this.dispose();
                }
                dispose() {
                    this._done = true;
                    this._onWillDispose.fire();
                    super.dispose();
                }
            };
            const createWindowProgress = () => {
                // Create a promise that we can resolve as needed
                // when the outside calls dispose on us
                const promise = new async_1.DeferredPromise();
                this.withWindowProgress({
                    location: 10 /* ProgressLocation.Window */,
                    title: options.title ? (0, linkedText_1.parseLinkedText)(options.title).toString() : undefined, // convert markdown links => string
                    command: 'notifications.showList',
                    type: options.type
                }, progress => {
                    function reportProgress(step) {
                        if (step.message) {
                            progress.report({
                                message: (0, linkedText_1.parseLinkedText)(step.message).toString() // convert markdown links => string
                            });
                        }
                    }
                    // Apply any progress that was made already
                    if (progressStateModel.step) {
                        reportProgress(progressStateModel.step);
                    }
                    // Continue to report progress as it happens
                    const onDidReportListener = progressStateModel.onDidReport(step => reportProgress(step));
                    promise.p.finally(() => onDidReportListener.dispose());
                    // When the progress model gets disposed, we are done as well
                    event_1.Event.once(progressStateModel.onWillDispose)(() => promise.complete());
                    return promise.p;
                });
                // Dispose means completing our promise
                return (0, lifecycle_1.toDisposable)(() => promise.complete());
            };
            const createNotification = (message, priority, increment) => {
                const notificationDisposables = new lifecycle_1.DisposableStore();
                const primaryActions = options.primaryActions ? Array.from(options.primaryActions) : [];
                const secondaryActions = options.secondaryActions ? Array.from(options.secondaryActions) : [];
                if (options.buttons) {
                    options.buttons.forEach((button, index) => {
                        const buttonAction = new class extends actions_1.Action {
                            constructor() {
                                super(`progress.button.${button}`, button, undefined, true);
                            }
                            async run() {
                                progressStateModel.cancel(index);
                            }
                        };
                        notificationDisposables.add(buttonAction);
                        primaryActions.push(buttonAction);
                    });
                }
                if (options.cancellable) {
                    const cancelAction = new class extends actions_1.Action {
                        constructor() {
                            super('progress.cancel', (0, nls_1.localize)('cancel', "Cancel"), undefined, true);
                        }
                        async run() {
                            progressStateModel.cancel();
                        }
                    };
                    notificationDisposables.add(cancelAction);
                    primaryActions.push(cancelAction);
                }
                const notification = this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message: (0, iconLabels_1.stripIcons)(message), // status entries support codicons, but notifications do not (https://github.com/microsoft/vscode/issues/145722)
                    source: options.source,
                    actions: { primary: primaryActions, secondary: secondaryActions },
                    progress: typeof increment === 'number' && increment >= 0 ? { total: 100, worked: increment } : { infinite: true },
                    priority
                });
                // Switch to window based progress once the notification
                // changes visibility to hidden and is still ongoing.
                // Remove that window based progress once the notification
                // shows again.
                let windowProgressDisposable = undefined;
                const onVisibilityChange = (visible) => {
                    // Clear any previous running window progress
                    (0, lifecycle_1.dispose)(windowProgressDisposable);
                    // Create new window progress if notification got hidden
                    if (!visible && !progressStateModel.done) {
                        windowProgressDisposable = createWindowProgress();
                    }
                };
                notificationDisposables.add(notification.onDidChangeVisibility(onVisibilityChange));
                if (priority === notification_1.NotificationPriority.SILENT) {
                    onVisibilityChange(false);
                }
                // Clear upon dispose
                event_1.Event.once(notification.onDidClose)(() => notificationDisposables.dispose());
                return notification;
            };
            const updateProgress = (notification, increment) => {
                if (typeof increment === 'number' && increment >= 0) {
                    notification.progress.total(100); // always percentage based
                    notification.progress.worked(increment);
                }
                else {
                    notification.progress.infinite();
                }
            };
            let notificationHandle;
            let notificationTimeout;
            let titleAndMessage; // hoisted to make sure a delayed notification shows the most recent message
            const updateNotification = (step) => {
                // full message (inital or update)
                if (step?.message && options.title) {
                    titleAndMessage = `${options.title}: ${step.message}`; // always prefix with overall title if we have it (https://github.com/microsoft/vscode/issues/50932)
                }
                else {
                    titleAndMessage = options.title || step?.message;
                }
                if (!notificationHandle && titleAndMessage) {
                    // create notification now or after a delay
                    if (typeof options.delay === 'number' && options.delay > 0) {
                        if (typeof notificationTimeout !== 'number') {
                            notificationTimeout = setTimeout(() => notificationHandle = createNotification(titleAndMessage, options.priority, step?.increment), options.delay);
                        }
                    }
                    else {
                        notificationHandle = createNotification(titleAndMessage, options.priority, step?.increment);
                    }
                }
                if (notificationHandle) {
                    if (titleAndMessage) {
                        notificationHandle.updateMessage(titleAndMessage);
                    }
                    if (typeof step?.increment === 'number') {
                        updateProgress(notificationHandle, step.increment);
                    }
                }
            };
            // Show initially
            updateNotification(progressStateModel.step);
            const listener = progressStateModel.onDidReport(step => updateNotification(step));
            event_1.Event.once(progressStateModel.onWillDispose)(() => listener.dispose());
            // Clean up eventually
            (async () => {
                try {
                    // with a delay we only wait for the finish of the promise
                    if (typeof options.delay === 'number' && options.delay > 0) {
                        await progressStateModel.promise;
                    }
                    // without a delay we show the notification for at least 800ms
                    // to reduce the chance of the notification flashing up and hiding
                    else {
                        await Promise.all([(0, async_1.timeout)(800), progressStateModel.promise]);
                    }
                }
                finally {
                    clearTimeout(notificationTimeout);
                    notificationHandle?.close();
                }
            })();
            return progressStateModel.promise;
        }
        withPaneCompositeProgress(paneCompositeId, viewContainerLocation, task, options) {
            // show in viewlet
            const progressIndicator = this.paneCompositeService.getProgressIndicator(paneCompositeId, viewContainerLocation);
            const promise = progressIndicator ? this.withCompositeProgress(progressIndicator, task, options) : task({ report: () => { } });
            // show on activity bar
            if (viewContainerLocation === 0 /* ViewContainerLocation.Sidebar */) {
                this.showOnActivityBar(paneCompositeId, options, promise);
            }
            return promise;
        }
        withViewProgress(viewId, task, options) {
            // show in viewlet
            const progressIndicator = this.viewsService.getViewProgressIndicator(viewId);
            const promise = progressIndicator ? this.withCompositeProgress(progressIndicator, task, options) : task({ report: () => { } });
            const location = this.viewDescriptorService.getViewLocationById(viewId);
            if (location !== 0 /* ViewContainerLocation.Sidebar */) {
                return promise;
            }
            const viewletId = this.viewDescriptorService.getViewContainerByViewId(viewId)?.id;
            if (viewletId === undefined) {
                return promise;
            }
            // show on activity bar
            this.showOnActivityBar(viewletId, options, promise);
            return promise;
        }
        showOnActivityBar(viewletId, options, promise) {
            let activityProgress;
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                const handle = this.activityService.showViewContainerActivity(viewletId, { badge: new activity_1.ProgressBadge(() => ''), priority: 100 });
                const startTimeVisible = Date.now();
                const minTimeVisible = 300;
                activityProgress = {
                    dispose() {
                        const d = Date.now() - startTimeVisible;
                        if (d < minTimeVisible) {
                            // should at least show for Nms
                            setTimeout(() => handle.dispose(), minTimeVisible - d);
                        }
                        else {
                            // shown long enough
                            handle.dispose();
                        }
                    }
                };
            }, options.delay || 300);
            promise.finally(() => {
                clearTimeout(delayHandle);
                (0, lifecycle_1.dispose)(activityProgress);
            });
        }
        withCompositeProgress(progressIndicator, task, options) {
            let discreteProgressRunner = undefined;
            function updateProgress(stepOrTotal) {
                // Figure out whether discrete progress applies
                // by figuring out the "total" progress to show
                // and the increment if any.
                let total = undefined;
                let increment = undefined;
                if (typeof stepOrTotal !== 'undefined') {
                    if (typeof stepOrTotal === 'number') {
                        total = stepOrTotal;
                    }
                    else if (typeof stepOrTotal.increment === 'number') {
                        total = stepOrTotal.total ?? 100; // always percentage based
                        increment = stepOrTotal.increment;
                    }
                }
                // Discrete
                if (typeof total === 'number') {
                    if (!discreteProgressRunner) {
                        discreteProgressRunner = progressIndicator.show(total, options.delay);
                        promise.catch(() => undefined /* ignore */).finally(() => discreteProgressRunner?.done());
                    }
                    if (typeof increment === 'number') {
                        discreteProgressRunner.worked(increment);
                    }
                }
                // Infinite
                else {
                    discreteProgressRunner?.done();
                    progressIndicator.showWhile(promise, options.delay);
                }
                return discreteProgressRunner;
            }
            const promise = task({
                report: progress => {
                    updateProgress(progress);
                }
            });
            updateProgress(options.total);
            return promise;
        }
        withDialogProgress(options, task, onDidCancel) {
            const disposables = new lifecycle_1.DisposableStore();
            const allowableCommands = [
                'workbench.action.quit',
                'workbench.action.reloadWindow',
                'copy',
                'cut',
                'editor.action.clipboardCopyAction',
                'editor.action.clipboardCutAction'
            ];
            let dialog;
            const createDialog = (message) => {
                const buttons = options.buttons || [];
                if (!options.sticky) {
                    buttons.push(options.cancellable ? (0, nls_1.localize)('cancel', "Cancel") : (0, nls_1.localize)('dismiss', "Dismiss"));
                }
                dialog = new dialog_1.Dialog(this.layoutService.activeContainer, message, buttons, {
                    type: 'pending',
                    detail: options.detail,
                    cancelId: buttons.length - 1,
                    disableCloseAction: options.sticky,
                    disableDefaultAction: options.sticky,
                    keyEventProcessor: (event) => {
                        const resolved = this.keybindingService.softDispatch(event, this.layoutService.activeContainer);
                        if (resolved.kind === 2 /* ResultKind.KbFound */ && resolved.commandId) {
                            if (!allowableCommands.includes(resolved.commandId)) {
                                dom_1.EventHelper.stop(event, true);
                            }
                        }
                    },
                    buttonStyles: defaultStyles_1.defaultButtonStyles,
                    checkboxStyles: defaultStyles_1.defaultCheckboxStyles,
                    inputBoxStyles: defaultStyles_1.defaultInputBoxStyles,
                    dialogStyles: defaultStyles_1.defaultDialogStyles
                });
                disposables.add(dialog);
                dialog.show().then(dialogResult => {
                    onDidCancel?.(dialogResult.button);
                    (0, lifecycle_1.dispose)(dialog);
                });
                return dialog;
            };
            // In order to support the `delay` option, we use a scheduler
            // that will guard each access to the dialog behind a delay
            // that is either the original delay for one invocation and
            // otherwise runs without delay.
            let delay = options.delay ?? 0;
            let latestMessage = undefined;
            const scheduler = disposables.add(new async_1.RunOnceScheduler(() => {
                delay = 0; // since we have run once, we reset the delay
                if (latestMessage && !dialog) {
                    dialog = createDialog(latestMessage);
                }
                else if (latestMessage) {
                    dialog.updateMessage(latestMessage);
                }
            }, 0));
            const updateDialog = function (message) {
                latestMessage = message;
                // Make sure to only run one dialog update and not multiple
                if (!scheduler.isScheduled()) {
                    scheduler.schedule(delay);
                }
            };
            const promise = task({
                report: progress => {
                    updateDialog(progress.message);
                }
            });
            promise.finally(() => {
                (0, lifecycle_1.dispose)(disposables);
            });
            if (options.title) {
                updateDialog(options.title);
            }
            return promise;
        }
    };
    exports.ProgressService = ProgressService;
    exports.ProgressService = ProgressService = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, viewsService_1.IViewsService),
        __param(4, notification_1.INotificationService),
        __param(5, statusbar_1.IStatusbarService),
        __param(6, layoutService_1.ILayoutService),
        __param(7, keybinding_1.IKeybindingService)
    ], ProgressService);
    (0, extensions_1.registerSingleton)(progress_1.IProgressService, ProgressService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3Byb2dyZXNzL2Jyb3dzZXIvcHJvZ3Jlc3NTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJCekYsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxzQkFBVTtRQUk5QyxZQUNtQixlQUFrRCxFQUN6QyxvQkFBZ0UsRUFDbkUscUJBQThELEVBQ3ZFLFlBQTRDLEVBQ3JDLG1CQUEwRCxFQUM3RCxnQkFBb0QsRUFDdkQsYUFBOEMsRUFDMUMsaUJBQXNEO1lBRTFFLEtBQUssRUFBRSxDQUFDO1lBVDJCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUN4Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQTJCO1lBQ2xELDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDdEQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDcEIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUM1QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3RDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN6QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBaUUxRCx3QkFBbUIsR0FBd0QsRUFBRSxDQUFDO1lBQ3ZGLDhCQUF5QixHQUF3QyxTQUFTLENBQUM7UUEvRG5GLENBQUM7UUFFRCxLQUFLLENBQUMsWUFBWSxDQUFjLE9BQXlCLEVBQUUsSUFBd0QsRUFBRSxXQUF1QztZQUMzSixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFDO1lBRTdCLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxRQUFnQixFQUFFLEVBQUU7Z0JBQ2pELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDaEYsSUFBSSxhQUFhLEVBQUUsQ0FBQztvQkFDbkIsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQ2pHLElBQUkscUJBQXFCLEtBQUssSUFBSSxFQUFFLENBQUM7d0JBQ3BDLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsRUFBRSxxQkFBcUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxHQUFHLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO29CQUN4RyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ3pFLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRSxHQUFHLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RSxDQUFDO2dCQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDdkQsQ0FBQyxDQUFDO1lBRUYsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBRUQsUUFBUSxRQUFRLEVBQUUsQ0FBQztnQkFDbEIsMkNBQWtDLENBQUMsQ0FBQyxDQUFDO29CQUNwQyxJQUFJLFFBQVEsR0FBSSxPQUF3QyxDQUFDLFFBQVEsQ0FBQztvQkFDbEUsSUFBSSxRQUFRLEtBQUssbUNBQW9CLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQzlDLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxLQUFLLGtDQUFtQixDQUFDLEtBQUssRUFBRSxDQUFDOzRCQUN4RSxRQUFRLEdBQUcsbUNBQW9CLENBQUMsTUFBTSxDQUFDO3dCQUN4QyxDQUFDOzZCQUFNLElBQUksSUFBQSxtQ0FBb0IsRUFBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssa0NBQW1CLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQ3JJLFFBQVEsR0FBRyxtQ0FBb0IsQ0FBQyxNQUFNLENBQUM7d0JBQ3hDLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxPQUFPLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLEdBQUcsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQzdGLENBQUM7Z0JBQ0QscUNBQTRCLENBQUMsQ0FBQyxDQUFDO29CQUM5QixNQUFNLElBQUksR0FBSSxPQUFrQyxDQUFDLElBQUksQ0FBQztvQkFDdEQsSUFBSyxPQUFrQyxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNqRCw2REFBNkQ7d0JBQzdELE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsR0FBRyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN0RSxDQUFDO29CQUNELHNFQUFzRTtvQkFDdEUsdUVBQXVFO29CQUN2RSwyQkFBMkI7b0JBQzNCLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLE9BQU8sRUFBRSxRQUFRLEVBQUUsbUNBQW9CLENBQUMsTUFBTSxFQUFFLFFBQVEsd0NBQStCLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUNyTixDQUFDO2dCQUNEO29CQUNDLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLHlCQUF5Qix5Q0FBaUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDakk7b0JBQ0MsT0FBTyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDOUM7b0JBQ0MsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsMkJBQTJCLHlDQUFpQyxJQUFJLEVBQUUsRUFBRSxHQUFHLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNuSTtvQkFDQyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUM1RDtvQkFDQyxNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELENBQUM7UUFDRixDQUFDO1FBS08sa0JBQWtCLENBQWMsT0FBK0IsRUFBRSxRQUFtRTtZQUMzSSxNQUFNLElBQUksR0FBc0QsQ0FBQyxPQUFPLEVBQUUsSUFBSSxtQkFBUSxDQUFnQixHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFMUksTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWxDLElBQUksV0FBVyxHQUFRLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3RDLFdBQVcsR0FBRyxTQUFTLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUU1QixtQ0FBbUM7Z0JBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUM7b0JBQ1gsSUFBQSxlQUFPLEVBQUMsR0FBRyxDQUFDO29CQUNaLE9BQU87aUJBQ1AsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7b0JBQ2YsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbkQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3hDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUM3QixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUVSLCtDQUErQztZQUMvQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVPLG9CQUFvQixDQUFDLE1BQWMsQ0FBQztZQUUzQyxpQ0FBaUM7WUFDakMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMzQyxNQUFNLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFFMUQsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztnQkFDcEMsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDakUsTUFBTSxlQUFlLEdBQTRCLE9BQVEsQ0FBQyxPQUFPLENBQUM7Z0JBQ2xFLElBQUksSUFBWSxDQUFDO2dCQUNqQixJQUFJLEtBQWEsQ0FBQztnQkFDbEIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxPQUFPLE9BQU8sQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztnQkFFNUcsSUFBSSxhQUFhLElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ3RDLHFCQUFxQjtvQkFDckIsSUFBSSxHQUFHLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQzlFLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFFL0csQ0FBQztxQkFBTSxJQUFJLGFBQWEsRUFBRSxDQUFDO29CQUMxQixVQUFVO29CQUNWLElBQUksR0FBRyxhQUFhLENBQUM7b0JBQ3JCLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFFMUYsQ0FBQztxQkFBTSxJQUFJLGVBQWUsRUFBRSxDQUFDO29CQUM1QixZQUFZO29CQUNaLElBQUksR0FBRyxlQUFlLENBQUM7b0JBQ3ZCLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFFNUYsQ0FBQztxQkFBTSxDQUFDO29CQUNQLDhEQUE4RDtvQkFDOUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDbkMsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0scUJBQXFCLEdBQW9CO29CQUM5QyxJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLENBQUM7b0JBQ3JELElBQUk7b0JBQ0osWUFBWSxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSTtvQkFDbEMsU0FBUyxFQUFFLElBQUk7b0JBQ2YsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsT0FBTyxFQUFFLGVBQWU7aUJBQ3hCLENBQUM7Z0JBRUYsSUFBSSxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztvQkFDcEMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUM5RCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsaUJBQWlCLGtDQUEwQixDQUFDO2dCQUNwSSxDQUFDO1lBQ0YsQ0FBQztZQUVELGlEQUFpRDtpQkFDNUMsQ0FBQztnQkFDTCxJQUFJLENBQUMseUJBQXlCLEVBQUUsT0FBTyxFQUFFLENBQUM7Z0JBQzFDLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxTQUFTLENBQUM7WUFDNUMsQ0FBQztRQUNGLENBQUM7UUFFTyx3QkFBd0IsQ0FBb0MsT0FBcUMsRUFBRSxRQUFtRCxFQUFFLFdBQXVDO1lBRXRNLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxLQUFNLFNBQVEsc0JBQVU7Z0JBU3RELElBQUksSUFBSSxLQUFLLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBR2pDLElBQUksSUFBSSxLQUFLLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBSWpDO29CQUNDLEtBQUssRUFBRSxDQUFDO29CQWZRLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBaUIsQ0FBQyxDQUFDO29CQUNwRSxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO29CQUU5QixtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO29CQUM3RCxrQkFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO29CQUUzQyxVQUFLLEdBQThCLFNBQVMsQ0FBQztvQkFHN0MsVUFBSyxHQUFHLEtBQUssQ0FBQztvQkFRckIsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRTlCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTt3QkFDekIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNoQixDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO2dCQUVELE1BQU0sQ0FBQyxJQUFtQjtvQkFDekIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7b0JBRWxCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixDQUFDO2dCQUVELE1BQU0sQ0FBQyxNQUFlO29CQUNyQixXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFFdEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoQixDQUFDO2dCQUVRLE9BQU87b0JBQ2YsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7b0JBQ2xCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBRTNCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDakIsQ0FBQzthQUNELENBQUM7WUFFRixNQUFNLG9CQUFvQixHQUFHLEdBQUcsRUFBRTtnQkFFakMsaURBQWlEO2dCQUNqRCx1Q0FBdUM7Z0JBQ3ZDLE1BQU0sT0FBTyxHQUFHLElBQUksdUJBQWUsRUFBUSxDQUFDO2dCQUU1QyxJQUFJLENBQUMsa0JBQWtCLENBQUM7b0JBQ3ZCLFFBQVEsa0NBQXlCO29CQUNqQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBQSw0QkFBZSxFQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLG1DQUFtQztvQkFDakgsT0FBTyxFQUFFLHdCQUF3QjtvQkFDakMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO2lCQUNsQixFQUFFLFFBQVEsQ0FBQyxFQUFFO29CQUViLFNBQVMsY0FBYyxDQUFDLElBQW1CO3dCQUMxQyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzs0QkFDbEIsUUFBUSxDQUFDLE1BQU0sQ0FBQztnQ0FDZixPQUFPLEVBQUUsSUFBQSw0QkFBZSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBRSxtQ0FBbUM7NkJBQ3RGLENBQUMsQ0FBQzt3QkFDSixDQUFDO29CQUNGLENBQUM7b0JBRUQsMkNBQTJDO29CQUMzQyxJQUFJLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO3dCQUM3QixjQUFjLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3pDLENBQUM7b0JBRUQsNENBQTRDO29CQUM1QyxNQUFNLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUN6RixPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO29CQUV2RCw2REFBNkQ7b0JBQzdELGFBQUssQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBRXZFLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDbEIsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsdUNBQXVDO2dCQUN2QyxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUMvQyxDQUFDLENBQUM7WUFFRixNQUFNLGtCQUFrQixHQUFHLENBQUMsT0FBZSxFQUFFLFFBQStCLEVBQUUsU0FBa0IsRUFBdUIsRUFBRTtnQkFDeEgsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztnQkFFdEQsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDeEYsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFFOUYsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3JCLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO3dCQUN6QyxNQUFNLFlBQVksR0FBRyxJQUFJLEtBQU0sU0FBUSxnQkFBTTs0QkFDNUM7Z0NBQ0MsS0FBSyxDQUFDLG1CQUFtQixNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDOzRCQUM3RCxDQUFDOzRCQUVRLEtBQUssQ0FBQyxHQUFHO2dDQUNqQixrQkFBa0IsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ2xDLENBQUM7eUJBQ0QsQ0FBQzt3QkFDRix1QkFBdUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7d0JBRTFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ25DLENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBRUQsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ3pCLE1BQU0sWUFBWSxHQUFHLElBQUksS0FBTSxTQUFRLGdCQUFNO3dCQUM1Qzs0QkFDQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsSUFBQSxjQUFRLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDekUsQ0FBQzt3QkFFUSxLQUFLLENBQUMsR0FBRzs0QkFDakIsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQzdCLENBQUM7cUJBQ0QsQ0FBQztvQkFDRix1QkFBdUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBRTFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ25DLENBQUM7Z0JBRUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQztvQkFDcEQsUUFBUSxFQUFFLHVCQUFRLENBQUMsSUFBSTtvQkFDdkIsT0FBTyxFQUFFLElBQUEsdUJBQVUsRUFBQyxPQUFPLENBQUMsRUFBRSxnSEFBZ0g7b0JBQzlJLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtvQkFDdEIsT0FBTyxFQUFFLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUU7b0JBQ2pFLFFBQVEsRUFBRSxPQUFPLFNBQVMsS0FBSyxRQUFRLElBQUksU0FBUyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO29CQUNsSCxRQUFRO2lCQUNSLENBQUMsQ0FBQztnQkFFSCx3REFBd0Q7Z0JBQ3hELHFEQUFxRDtnQkFDckQsMERBQTBEO2dCQUMxRCxlQUFlO2dCQUNmLElBQUksd0JBQXdCLEdBQTRCLFNBQVMsQ0FBQztnQkFDbEUsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLE9BQWdCLEVBQUUsRUFBRTtvQkFDL0MsNkNBQTZDO29CQUM3QyxJQUFBLG1CQUFPLEVBQUMsd0JBQXdCLENBQUMsQ0FBQztvQkFFbEMsd0RBQXdEO29CQUN4RCxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQzFDLHdCQUF3QixHQUFHLG9CQUFvQixFQUFFLENBQUM7b0JBQ25ELENBQUM7Z0JBQ0YsQ0FBQyxDQUFDO2dCQUNGLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO2dCQUNwRixJQUFJLFFBQVEsS0FBSyxtQ0FBb0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDOUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzNCLENBQUM7Z0JBRUQscUJBQXFCO2dCQUNyQixhQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUU3RSxPQUFPLFlBQVksQ0FBQztZQUNyQixDQUFDLENBQUM7WUFFRixNQUFNLGNBQWMsR0FBRyxDQUFDLFlBQWlDLEVBQUUsU0FBa0IsRUFBUSxFQUFFO2dCQUN0RixJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsSUFBSSxTQUFTLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3JELFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsMEJBQTBCO29CQUM1RCxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDekMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFlBQVksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2xDLENBQUM7WUFDRixDQUFDLENBQUM7WUFFRixJQUFJLGtCQUFtRCxDQUFDO1lBQ3hELElBQUksbUJBQW9DLENBQUM7WUFDekMsSUFBSSxlQUFtQyxDQUFDLENBQUMsNEVBQTRFO1lBRXJILE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxJQUFvQixFQUFRLEVBQUU7Z0JBRXpELGtDQUFrQztnQkFDbEMsSUFBSSxJQUFJLEVBQUUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDcEMsZUFBZSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxvR0FBb0c7Z0JBQzVKLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxlQUFlLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLEVBQUUsT0FBTyxDQUFDO2dCQUNsRCxDQUFDO2dCQUVELElBQUksQ0FBQyxrQkFBa0IsSUFBSSxlQUFlLEVBQUUsQ0FBQztvQkFFNUMsMkNBQTJDO29CQUMzQyxJQUFJLE9BQU8sT0FBTyxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDNUQsSUFBSSxPQUFPLG1CQUFtQixLQUFLLFFBQVEsRUFBRSxDQUFDOzRCQUM3QyxtQkFBbUIsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUMsZUFBZ0IsRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ3JKLENBQUM7b0JBQ0YsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDN0YsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksa0JBQWtCLEVBQUUsQ0FBQztvQkFDeEIsSUFBSSxlQUFlLEVBQUUsQ0FBQzt3QkFDckIsa0JBQWtCLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUNuRCxDQUFDO29CQUVELElBQUksT0FBTyxJQUFJLEVBQUUsU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUN6QyxjQUFjLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNwRCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUM7WUFFRixpQkFBaUI7WUFDakIsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUMsTUFBTSxRQUFRLEdBQUcsa0JBQWtCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNsRixhQUFLLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBRXZFLHNCQUFzQjtZQUN0QixDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNYLElBQUksQ0FBQztvQkFFSiwwREFBMEQ7b0JBQzFELElBQUksT0FBTyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUM1RCxNQUFNLGtCQUFrQixDQUFDLE9BQU8sQ0FBQztvQkFDbEMsQ0FBQztvQkFFRCw4REFBOEQ7b0JBQzlELGtFQUFrRTt5QkFDN0QsQ0FBQzt3QkFDTCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFBLGVBQU8sRUFBQyxHQUFHLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUMvRCxDQUFDO2dCQUNGLENBQUM7d0JBQVMsQ0FBQztvQkFDVixZQUFZLENBQUMsbUJBQW1CLENBQUMsQ0FBQztvQkFDbEMsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLENBQUM7Z0JBQzdCLENBQUM7WUFDRixDQUFDLENBQUMsRUFBRSxDQUFDO1lBRUwsT0FBTyxrQkFBa0IsQ0FBQyxPQUFPLENBQUM7UUFDbkMsQ0FBQztRQUVPLHlCQUF5QixDQUFvQyxlQUF1QixFQUFFLHFCQUE0QyxFQUFFLElBQStDLEVBQUUsT0FBa0M7WUFFOU4sa0JBQWtCO1lBQ2xCLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDLGVBQWUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBQ2pILE1BQU0sT0FBTyxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUUvSCx1QkFBdUI7WUFDdkIsSUFBSSxxQkFBcUIsMENBQWtDLEVBQUUsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLGlCQUFpQixDQUFPLGVBQWUsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakUsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFTyxnQkFBZ0IsQ0FBb0MsTUFBYyxFQUFFLElBQStDLEVBQUUsT0FBa0M7WUFFOUosa0JBQWtCO1lBQ2xCLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3RSxNQUFNLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFL0gsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hFLElBQUksUUFBUSwwQ0FBa0MsRUFBRSxDQUFDO2dCQUNoRCxPQUFPLE9BQU8sQ0FBQztZQUNoQixDQUFDO1lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNsRixJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxPQUFPLENBQUM7WUFDaEIsQ0FBQztZQUVELHVCQUF1QjtZQUN2QixJQUFJLENBQUMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVwRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRU8saUJBQWlCLENBQW9DLFNBQWlCLEVBQUUsT0FBa0MsRUFBRSxPQUFVO1lBQzdILElBQUksZ0JBQTZCLENBQUM7WUFDbEMsSUFBSSxXQUFXLEdBQVEsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDdEMsV0FBVyxHQUFHLFNBQVMsQ0FBQztnQkFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyx5QkFBeUIsQ0FBQyxTQUFTLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSx3QkFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNoSSxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDO2dCQUMzQixnQkFBZ0IsR0FBRztvQkFDbEIsT0FBTzt3QkFDTixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsZ0JBQWdCLENBQUM7d0JBQ3hDLElBQUksQ0FBQyxHQUFHLGNBQWMsRUFBRSxDQUFDOzRCQUN4QiwrQkFBK0I7NEJBQy9CLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsY0FBYyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUN4RCxDQUFDOzZCQUFNLENBQUM7NEJBQ1Asb0JBQW9COzRCQUNwQixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2xCLENBQUM7b0JBQ0YsQ0FBQztpQkFDRCxDQUFDO1lBQ0gsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLENBQUM7WUFDekIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7Z0JBQ3BCLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDMUIsSUFBQSxtQkFBTyxFQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDM0IsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8scUJBQXFCLENBQW9DLGlCQUFxQyxFQUFFLElBQStDLEVBQUUsT0FBa0M7WUFDMUwsSUFBSSxzQkFBc0IsR0FBZ0MsU0FBUyxDQUFDO1lBRXBFLFNBQVMsY0FBYyxDQUFDLFdBQStDO2dCQUV0RSwrQ0FBK0M7Z0JBQy9DLCtDQUErQztnQkFDL0MsNEJBQTRCO2dCQUM1QixJQUFJLEtBQUssR0FBdUIsU0FBUyxDQUFDO2dCQUMxQyxJQUFJLFNBQVMsR0FBdUIsU0FBUyxDQUFDO2dCQUM5QyxJQUFJLE9BQU8sV0FBVyxLQUFLLFdBQVcsRUFBRSxDQUFDO29CQUN4QyxJQUFJLE9BQU8sV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUNyQyxLQUFLLEdBQUcsV0FBVyxDQUFDO29CQUNyQixDQUFDO3lCQUFNLElBQUksT0FBTyxXQUFXLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUN0RCxLQUFLLEdBQUcsV0FBVyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsQ0FBQywwQkFBMEI7d0JBQzVELFNBQVMsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDO29CQUNuQyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsV0FBVztnQkFDWCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUMvQixJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQzt3QkFDN0Isc0JBQXNCLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ3RFLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUMzRixDQUFDO29CQUVELElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQ25DLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDMUMsQ0FBQztnQkFDRixDQUFDO2dCQUVELFdBQVc7cUJBQ04sQ0FBQztvQkFDTCxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsQ0FBQztvQkFDL0IsaUJBQWlCLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3JELENBQUM7Z0JBRUQsT0FBTyxzQkFBc0IsQ0FBQztZQUMvQixDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDO2dCQUNwQixNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUU7b0JBQ2xCLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDMUIsQ0FBQzthQUNELENBQUMsQ0FBQztZQUVILGNBQWMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFOUIsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUVPLGtCQUFrQixDQUFvQyxPQUErQixFQUFFLElBQStDLEVBQUUsV0FBdUM7WUFDdEwsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMsTUFBTSxpQkFBaUIsR0FBRztnQkFDekIsdUJBQXVCO2dCQUN2QiwrQkFBK0I7Z0JBQy9CLE1BQU07Z0JBQ04sS0FBSztnQkFDTCxtQ0FBbUM7Z0JBQ25DLGtDQUFrQzthQUNsQyxDQUFDO1lBRUYsSUFBSSxNQUFjLENBQUM7WUFFbkIsTUFBTSxZQUFZLEdBQUcsQ0FBQyxPQUFlLEVBQUUsRUFBRTtnQkFDeEMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDbkcsQ0FBQztnQkFFRCxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQ2xCLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUNsQyxPQUFPLEVBQ1AsT0FBTyxFQUNQO29CQUNDLElBQUksRUFBRSxTQUFTO29CQUNmLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtvQkFDdEIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQztvQkFDNUIsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLE1BQU07b0JBQ2xDLG9CQUFvQixFQUFFLE9BQU8sQ0FBQyxNQUFNO29CQUNwQyxpQkFBaUIsRUFBRSxDQUFDLEtBQTRCLEVBQUUsRUFBRTt3QkFDbkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQzt3QkFDaEcsSUFBSSxRQUFRLENBQUMsSUFBSSwrQkFBdUIsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7NEJBQ2hFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0NBQ3JELGlCQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQzs0QkFDL0IsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7b0JBQ0QsWUFBWSxFQUFFLG1DQUFtQjtvQkFDakMsY0FBYyxFQUFFLHFDQUFxQjtvQkFDckMsY0FBYyxFQUFFLHFDQUFxQjtvQkFDckMsWUFBWSxFQUFFLG1DQUFtQjtpQkFDakMsQ0FDRCxDQUFDO2dCQUVGLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXhCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUU7b0JBQ2pDLFdBQVcsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFFbkMsSUFBQSxtQkFBTyxFQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNqQixDQUFDLENBQUMsQ0FBQztnQkFFSCxPQUFPLE1BQU0sQ0FBQztZQUNmLENBQUMsQ0FBQztZQUVGLDZEQUE2RDtZQUM3RCwyREFBMkQ7WUFDM0QsMkRBQTJEO1lBQzNELGdDQUFnQztZQUNoQyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztZQUMvQixJQUFJLGFBQWEsR0FBdUIsU0FBUyxDQUFDO1lBQ2xELE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQzNELEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyw2Q0FBNkM7Z0JBRXhELElBQUksYUFBYSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQzlCLE1BQU0sR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7cUJBQU0sSUFBSSxhQUFhLEVBQUUsQ0FBQztvQkFDMUIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDckMsQ0FBQztZQUNGLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRVAsTUFBTSxZQUFZLEdBQUcsVUFBVSxPQUFnQjtnQkFDOUMsYUFBYSxHQUFHLE9BQU8sQ0FBQztnQkFFeEIsMkRBQTJEO2dCQUMzRCxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7b0JBQzlCLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzNCLENBQUM7WUFDRixDQUFDLENBQUM7WUFFRixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ3BCLE1BQU0sRUFBRSxRQUFRLENBQUMsRUFBRTtvQkFDbEIsWUFBWSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDaEMsQ0FBQzthQUNELENBQUMsQ0FBQztZQUVILE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO2dCQUNwQixJQUFBLG1CQUFPLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDdEIsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbkIsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QixDQUFDO1lBRUQsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztLQUNELENBQUE7SUE3bEJZLDBDQUFlOzhCQUFmLGVBQWU7UUFLekIsV0FBQSwyQkFBZ0IsQ0FBQTtRQUNoQixXQUFBLHlDQUF5QixDQUFBO1FBQ3pCLFdBQUEsOEJBQXNCLENBQUE7UUFDdEIsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsK0JBQWtCLENBQUE7T0FaUixlQUFlLENBNmxCM0I7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDJCQUFnQixFQUFFLGVBQWUsb0NBQTRCLENBQUMifQ==