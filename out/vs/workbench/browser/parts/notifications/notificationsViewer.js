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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/nls", "vs/base/browser/ui/button/button", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/workbench/common/notifications", "vs/workbench/browser/parts/notifications/notificationsActions", "vs/platform/keybinding/common/keybinding", "vs/base/browser/ui/progressbar/progressbar", "vs/platform/notification/common/notification", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/browser/event", "vs/base/browser/touch", "vs/base/common/event", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/platform/hover/browser/hover"], function (require, exports, dom_1, opener_1, uri_1, nls_1, button_1, actionbar_1, actions_1, instantiation_1, lifecycle_1, contextView_1, notifications_1, notificationsActions_1, keybinding_1, progressbar_1, notification_1, arrays_1, codicons_1, themables_1, dropdownActionViewItem_1, event_1, touch_1, event_2, defaultStyles_1, keyboardEvent_1, hoverDelegateFactory_1, hover_1) {
    "use strict";
    var NotificationRenderer_1, NotificationTemplateRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationTemplateRenderer = exports.NotificationRenderer = exports.NotificationsListDelegate = void 0;
    class NotificationsListDelegate {
        static { this.ROW_HEIGHT = 42; }
        static { this.LINE_HEIGHT = 22; }
        constructor(container) {
            this.offsetHelper = this.createOffsetHelper(container);
        }
        createOffsetHelper(container) {
            const offsetHelper = document.createElement('div');
            offsetHelper.classList.add('notification-offset-helper');
            container.appendChild(offsetHelper);
            return offsetHelper;
        }
        getHeight(notification) {
            if (!notification.expanded) {
                return NotificationsListDelegate.ROW_HEIGHT; // return early if there are no more rows to show
            }
            // First row: message and actions
            let expandedHeight = NotificationsListDelegate.ROW_HEIGHT;
            // Dynamic height: if message overflows
            const preferredMessageHeight = this.computePreferredHeight(notification);
            const messageOverflows = NotificationsListDelegate.LINE_HEIGHT < preferredMessageHeight;
            if (messageOverflows) {
                const overflow = preferredMessageHeight - NotificationsListDelegate.LINE_HEIGHT;
                expandedHeight += overflow;
            }
            // Last row: source and buttons if we have any
            if (notification.source || (0, arrays_1.isNonEmptyArray)(notification.actions && notification.actions.primary)) {
                expandedHeight += NotificationsListDelegate.ROW_HEIGHT;
            }
            // If the expanded height is same as collapsed, unset the expanded state
            // but skip events because there is no change that has visual impact
            if (expandedHeight === NotificationsListDelegate.ROW_HEIGHT) {
                notification.collapse(true /* skip events, no change in height */);
            }
            return expandedHeight;
        }
        computePreferredHeight(notification) {
            // Prepare offset helper depending on toolbar actions count
            let actions = 0;
            if (!notification.hasProgress) {
                actions++; // close
            }
            if (notification.canCollapse) {
                actions++; // expand/collapse
            }
            if ((0, arrays_1.isNonEmptyArray)(notification.actions && notification.actions.secondary)) {
                actions++; // secondary actions
            }
            this.offsetHelper.style.width = `${450 /* notifications container width */ - (10 /* padding */ + 30 /* severity icon */ + (actions * 30) /* actions */ - (Math.max(actions - 1, 0) * 4) /* less padding for actions > 1 */)}px`;
            // Render message into offset helper
            const renderedMessage = NotificationMessageRenderer.render(notification.message);
            this.offsetHelper.appendChild(renderedMessage);
            // Compute height
            const preferredHeight = Math.max(this.offsetHelper.offsetHeight, this.offsetHelper.scrollHeight);
            // Always clear offset helper after use
            (0, dom_1.clearNode)(this.offsetHelper);
            return preferredHeight;
        }
        getTemplateId(element) {
            if (element instanceof notifications_1.NotificationViewItem) {
                return NotificationRenderer.TEMPLATE_ID;
            }
            throw new Error('unknown element type: ' + element);
        }
    }
    exports.NotificationsListDelegate = NotificationsListDelegate;
    class NotificationMessageRenderer {
        static render(message, actionHandler) {
            const messageContainer = document.createElement('span');
            for (const node of message.linkedText.nodes) {
                if (typeof node === 'string') {
                    messageContainer.appendChild(document.createTextNode(node));
                }
                else {
                    let title = node.title;
                    if (!title && node.href.startsWith('command:')) {
                        title = (0, nls_1.localize)('executeCommand', "Click to execute command '{0}'", node.href.substr('command:'.length));
                    }
                    else if (!title) {
                        title = node.href;
                    }
                    const anchor = (0, dom_1.$)('a', { href: node.href, title, tabIndex: 0 }, node.label);
                    if (actionHandler) {
                        const handleOpen = (e) => {
                            if ((0, dom_1.isEventLike)(e)) {
                                dom_1.EventHelper.stop(e, true);
                            }
                            actionHandler.callback(node.href);
                        };
                        const onClick = actionHandler.toDispose.add(new event_1.DomEmitter(anchor, dom_1.EventType.CLICK)).event;
                        const onKeydown = actionHandler.toDispose.add(new event_1.DomEmitter(anchor, dom_1.EventType.KEY_DOWN)).event;
                        const onSpaceOrEnter = event_2.Event.chain(onKeydown, $ => $.filter(e => {
                            const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                            return event.equals(10 /* KeyCode.Space */) || event.equals(3 /* KeyCode.Enter */);
                        }));
                        actionHandler.toDispose.add(touch_1.Gesture.addTarget(anchor));
                        const onTap = actionHandler.toDispose.add(new event_1.DomEmitter(anchor, touch_1.EventType.Tap)).event;
                        event_2.Event.any(onClick, onTap, onSpaceOrEnter)(handleOpen, null, actionHandler.toDispose);
                    }
                    messageContainer.appendChild(anchor);
                }
            }
            return messageContainer;
        }
    }
    let NotificationRenderer = class NotificationRenderer {
        static { NotificationRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'notification'; }
        constructor(actionRunner, contextMenuService, instantiationService, notificationService) {
            this.actionRunner = actionRunner;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
        }
        get templateId() {
            return NotificationRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.toDispose = new lifecycle_1.DisposableStore();
            // Container
            data.container = document.createElement('div');
            data.container.classList.add('notification-list-item');
            // Main Row
            data.mainRow = document.createElement('div');
            data.mainRow.classList.add('notification-list-item-main-row');
            // Icon
            data.icon = document.createElement('div');
            data.icon.classList.add('notification-list-item-icon', 'codicon');
            // Message
            data.message = document.createElement('div');
            data.message.classList.add('notification-list-item-message');
            // Toolbar
            const that = this;
            const toolbarContainer = document.createElement('div');
            toolbarContainer.classList.add('notification-list-item-toolbar-container');
            data.toolbar = new actionbar_1.ActionBar(toolbarContainer, {
                ariaLabel: (0, nls_1.localize)('notificationActions', "Notification Actions"),
                actionViewItemProvider: (action, options) => {
                    if (action instanceof notificationsActions_1.ConfigureNotificationAction) {
                        return data.toDispose.add(new dropdownActionViewItem_1.DropdownMenuActionViewItem(action, {
                            getActions() {
                                const actions = [];
                                const source = { id: action.notification.sourceId, label: action.notification.source };
                                if ((0, notification_1.isNotificationSource)(source)) {
                                    const isSourceFiltered = that.notificationService.getFilter(source) === notification_1.NotificationsFilter.ERROR;
                                    actions.push((0, actions_1.toAction)({
                                        id: source.id,
                                        label: isSourceFiltered ? (0, nls_1.localize)('turnOnNotifications', "Turn On Notifications from '{0}'", source.label) : (0, nls_1.localize)('turnOffNotifications', "Turn Off Notifications from '{0}'", source.label),
                                        run: () => that.notificationService.setFilter({ ...source, filter: isSourceFiltered ? notification_1.NotificationsFilter.OFF : notification_1.NotificationsFilter.ERROR })
                                    }));
                                    if (action.notification.actions?.secondary?.length) {
                                        actions.push(new actions_1.Separator());
                                    }
                                }
                                if (Array.isArray(action.notification.actions?.secondary)) {
                                    actions.push(...action.notification.actions.secondary);
                                }
                                return actions;
                            },
                        }, this.contextMenuService, {
                            ...options,
                            actionRunner: this.actionRunner,
                            classNames: action.class
                        }));
                    }
                    return undefined;
                },
                actionRunner: this.actionRunner
            });
            data.toDispose.add(data.toolbar);
            // Details Row
            data.detailsRow = document.createElement('div');
            data.detailsRow.classList.add('notification-list-item-details-row');
            // Source
            data.source = document.createElement('div');
            data.source.classList.add('notification-list-item-source');
            // Buttons Container
            data.buttonsContainer = document.createElement('div');
            data.buttonsContainer.classList.add('notification-list-item-buttons-container');
            container.appendChild(data.container);
            // the details row appears first in order for better keyboard access to notification buttons
            data.container.appendChild(data.detailsRow);
            data.detailsRow.appendChild(data.source);
            data.detailsRow.appendChild(data.buttonsContainer);
            // main row
            data.container.appendChild(data.mainRow);
            data.mainRow.appendChild(data.icon);
            data.mainRow.appendChild(data.message);
            data.mainRow.appendChild(toolbarContainer);
            // Progress: below the rows to span the entire width of the item
            data.progress = new progressbar_1.ProgressBar(container, defaultStyles_1.defaultProgressBarStyles);
            data.toDispose.add(data.progress);
            // Renderer
            data.renderer = this.instantiationService.createInstance(NotificationTemplateRenderer, data, this.actionRunner);
            data.toDispose.add(data.renderer);
            return data;
        }
        renderElement(notification, index, data) {
            data.renderer.setInput(notification);
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
    };
    exports.NotificationRenderer = NotificationRenderer;
    exports.NotificationRenderer = NotificationRenderer = NotificationRenderer_1 = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, notification_1.INotificationService)
    ], NotificationRenderer);
    let NotificationTemplateRenderer = class NotificationTemplateRenderer extends lifecycle_1.Disposable {
        static { NotificationTemplateRenderer_1 = this; }
        static { this.SEVERITIES = [notification_1.Severity.Info, notification_1.Severity.Warning, notification_1.Severity.Error]; }
        constructor(template, actionRunner, openerService, instantiationService, keybindingService, contextMenuService, hoverService) {
            super();
            this.template = template;
            this.actionRunner = actionRunner;
            this.openerService = openerService;
            this.instantiationService = instantiationService;
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.hoverService = hoverService;
            this.inputDisposables = this._register(new lifecycle_1.DisposableStore());
            if (!NotificationTemplateRenderer_1.closeNotificationAction) {
                NotificationTemplateRenderer_1.closeNotificationAction = instantiationService.createInstance(notificationsActions_1.ClearNotificationAction, notificationsActions_1.ClearNotificationAction.ID, notificationsActions_1.ClearNotificationAction.LABEL);
                NotificationTemplateRenderer_1.expandNotificationAction = instantiationService.createInstance(notificationsActions_1.ExpandNotificationAction, notificationsActions_1.ExpandNotificationAction.ID, notificationsActions_1.ExpandNotificationAction.LABEL);
                NotificationTemplateRenderer_1.collapseNotificationAction = instantiationService.createInstance(notificationsActions_1.CollapseNotificationAction, notificationsActions_1.CollapseNotificationAction.ID, notificationsActions_1.CollapseNotificationAction.LABEL);
            }
        }
        setInput(notification) {
            this.inputDisposables.clear();
            this.render(notification);
        }
        render(notification) {
            // Container
            this.template.container.classList.toggle('expanded', notification.expanded);
            this.inputDisposables.add((0, dom_1.addDisposableListener)(this.template.container, dom_1.EventType.MOUSE_UP, e => {
                if (e.button === 1 /* Middle Button */) {
                    // Prevent firing the 'paste' event in the editor textarea - #109322
                    dom_1.EventHelper.stop(e, true);
                }
            }));
            this.inputDisposables.add((0, dom_1.addDisposableListener)(this.template.container, dom_1.EventType.AUXCLICK, e => {
                if (!notification.hasProgress && e.button === 1 /* Middle Button */) {
                    dom_1.EventHelper.stop(e, true);
                    notification.close();
                }
            }));
            // Severity Icon
            this.renderSeverity(notification);
            // Message
            const messageCustomHover = this.inputDisposables.add(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.template.message, ''));
            const messageOverflows = this.renderMessage(notification, messageCustomHover);
            // Secondary Actions
            this.renderSecondaryActions(notification, messageOverflows);
            // Source
            const sourceCustomHover = this.inputDisposables.add(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.template.source, ''));
            this.renderSource(notification, sourceCustomHover);
            // Buttons
            this.renderButtons(notification);
            // Progress
            this.renderProgress(notification);
            // Label Change Events that we can handle directly
            // (changes to actions require an entire redraw of
            // the notification because it has an impact on
            // epxansion state)
            this.inputDisposables.add(notification.onDidChangeContent(event => {
                switch (event.kind) {
                    case 0 /* NotificationViewItemContentChangeKind.SEVERITY */:
                        this.renderSeverity(notification);
                        break;
                    case 3 /* NotificationViewItemContentChangeKind.PROGRESS */:
                        this.renderProgress(notification);
                        break;
                    case 1 /* NotificationViewItemContentChangeKind.MESSAGE */:
                        this.renderMessage(notification, messageCustomHover);
                        break;
                }
            }));
        }
        renderSeverity(notification) {
            // first remove, then set as the codicon class names overlap
            NotificationTemplateRenderer_1.SEVERITIES.forEach(severity => {
                if (notification.severity !== severity) {
                    this.template.icon.classList.remove(...themables_1.ThemeIcon.asClassNameArray(this.toSeverityIcon(severity)));
                }
            });
            this.template.icon.classList.add(...themables_1.ThemeIcon.asClassNameArray(this.toSeverityIcon(notification.severity)));
        }
        renderMessage(notification, customHover) {
            (0, dom_1.clearNode)(this.template.message);
            this.template.message.appendChild(NotificationMessageRenderer.render(notification.message, {
                callback: link => this.openerService.open(uri_1.URI.parse(link), { allowCommands: true }),
                toDispose: this.inputDisposables
            }));
            const messageOverflows = notification.canCollapse && !notification.expanded && this.template.message.scrollWidth > this.template.message.clientWidth;
            customHover.update(messageOverflows ? this.template.message.textContent + '' : '');
            return messageOverflows;
        }
        renderSecondaryActions(notification, messageOverflows) {
            const actions = [];
            // Secondary Actions
            if ((0, arrays_1.isNonEmptyArray)(notification.actions?.secondary)) {
                const configureNotificationAction = this.instantiationService.createInstance(notificationsActions_1.ConfigureNotificationAction, notificationsActions_1.ConfigureNotificationAction.ID, notificationsActions_1.ConfigureNotificationAction.LABEL, notification);
                actions.push(configureNotificationAction);
                this.inputDisposables.add(configureNotificationAction);
            }
            // Expand / Collapse
            let showExpandCollapseAction = false;
            if (notification.canCollapse) {
                if (notification.expanded) {
                    showExpandCollapseAction = true; // allow to collapse an expanded message
                }
                else if (notification.source) {
                    showExpandCollapseAction = true; // allow to expand to details row
                }
                else if (messageOverflows) {
                    showExpandCollapseAction = true; // allow to expand if message overflows
                }
            }
            if (showExpandCollapseAction) {
                actions.push(notification.expanded ? NotificationTemplateRenderer_1.collapseNotificationAction : NotificationTemplateRenderer_1.expandNotificationAction);
            }
            // Close (unless progress is showing)
            if (!notification.hasProgress) {
                actions.push(NotificationTemplateRenderer_1.closeNotificationAction);
            }
            this.template.toolbar.clear();
            this.template.toolbar.context = notification;
            actions.forEach(action => this.template.toolbar.push(action, { icon: true, label: false, keybinding: this.getKeybindingLabel(action) }));
        }
        renderSource(notification, sourceCustomHover) {
            if (notification.expanded && notification.source) {
                this.template.source.textContent = (0, nls_1.localize)('notificationSource', "Source: {0}", notification.source);
                sourceCustomHover.update(notification.source);
            }
            else {
                this.template.source.textContent = '';
                sourceCustomHover.update('');
            }
        }
        renderButtons(notification) {
            (0, dom_1.clearNode)(this.template.buttonsContainer);
            const primaryActions = notification.actions ? notification.actions.primary : undefined;
            if (notification.expanded && (0, arrays_1.isNonEmptyArray)(primaryActions)) {
                const that = this;
                const actionRunner = new class extends actions_1.ActionRunner {
                    async runAction(action) {
                        // Run action
                        that.actionRunner.run(action, notification);
                        // Hide notification (unless explicitly prevented)
                        if (!(action instanceof notifications_1.ChoiceAction) || !action.keepOpen) {
                            notification.close();
                        }
                    }
                }();
                const buttonToolbar = this.inputDisposables.add(new button_1.ButtonBar(this.template.buttonsContainer));
                for (let i = 0; i < primaryActions.length; i++) {
                    const action = primaryActions[i];
                    const options = {
                        title: true, // assign titles to buttons in case they overflow
                        secondary: i > 0,
                        ...defaultStyles_1.defaultButtonStyles
                    };
                    const dropdownActions = action instanceof notifications_1.ChoiceAction ? action.menu : undefined;
                    const button = this.inputDisposables.add(dropdownActions ?
                        buttonToolbar.addButtonWithDropdown({
                            ...options,
                            contextMenuProvider: this.contextMenuService,
                            actions: dropdownActions,
                            actionRunner
                        }) :
                        buttonToolbar.addButton(options));
                    button.label = action.label;
                    this.inputDisposables.add(button.onDidClick(e => {
                        if (e) {
                            dom_1.EventHelper.stop(e, true);
                        }
                        actionRunner.run(action);
                    }));
                }
            }
        }
        renderProgress(notification) {
            // Return early if the item has no progress
            if (!notification.hasProgress) {
                this.template.progress.stop().hide();
                return;
            }
            // Infinite
            const state = notification.progress.state;
            if (state.infinite) {
                this.template.progress.infinite().show();
            }
            // Total / Worked
            else if (typeof state.total === 'number' || typeof state.worked === 'number') {
                if (typeof state.total === 'number' && !this.template.progress.hasTotal()) {
                    this.template.progress.total(state.total);
                }
                if (typeof state.worked === 'number') {
                    this.template.progress.setWorked(state.worked).show();
                }
            }
            // Done
            else {
                this.template.progress.done().hide();
            }
        }
        toSeverityIcon(severity) {
            switch (severity) {
                case notification_1.Severity.Warning:
                    return codicons_1.Codicon.warning;
                case notification_1.Severity.Error:
                    return codicons_1.Codicon.error;
            }
            return codicons_1.Codicon.info;
        }
        getKeybindingLabel(action) {
            const keybinding = this.keybindingService.lookupKeybinding(action.id);
            return keybinding ? keybinding.getLabel() : null;
        }
    };
    exports.NotificationTemplateRenderer = NotificationTemplateRenderer;
    exports.NotificationTemplateRenderer = NotificationTemplateRenderer = NotificationTemplateRenderer_1 = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, hover_1.IHoverService)
    ], NotificationTemplateRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc1ZpZXdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL25vdGlmaWNhdGlvbnMvbm90aWZpY2F0aW9uc1ZpZXdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBZ0NoRyxNQUFhLHlCQUF5QjtpQkFFYixlQUFVLEdBQUcsRUFBRSxDQUFDO2lCQUNoQixnQkFBVyxHQUFHLEVBQUUsQ0FBQztRQUl6QyxZQUFZLFNBQXNCO1lBQ2pDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxTQUFzQjtZQUNoRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25ELFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFFekQsU0FBUyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVwQyxPQUFPLFlBQVksQ0FBQztRQUNyQixDQUFDO1FBRUQsU0FBUyxDQUFDLFlBQW1DO1lBQzVDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzVCLE9BQU8seUJBQXlCLENBQUMsVUFBVSxDQUFDLENBQUMsaURBQWlEO1lBQy9GLENBQUM7WUFFRCxpQ0FBaUM7WUFDakMsSUFBSSxjQUFjLEdBQUcseUJBQXlCLENBQUMsVUFBVSxDQUFDO1lBRTFELHVDQUF1QztZQUN2QyxNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN6RSxNQUFNLGdCQUFnQixHQUFHLHlCQUF5QixDQUFD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