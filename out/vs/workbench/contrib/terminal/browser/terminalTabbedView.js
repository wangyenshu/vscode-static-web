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
define(["require", "exports", "vs/base/browser/ui/splitview/splitview", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalTabsList", "vs/base/common/platform", "vs/base/browser/dom", "vs/base/browser/canIUse", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/storage/common/storage", "vs/nls", "vs/workbench/contrib/terminal/browser/terminalContextMenu", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/browser/terminalTooltip", "vs/platform/hover/browser/hover"], function (require, exports, splitview_1, lifecycle_1, configuration_1, instantiation_1, terminal_1, terminalTabsList_1, platform_1, dom, canIUse_1, notification_1, actions_1, actions_2, contextkey_1, contextView_1, storage_1, nls_1, terminalContextMenu_1, terminalContextKey_1, terminalTooltip_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalTabbedView = void 0;
    const $ = dom.$;
    var CssClass;
    (function (CssClass) {
        CssClass["ViewIsVertical"] = "terminal-side-view";
    })(CssClass || (CssClass = {}));
    var WidthConstants;
    (function (WidthConstants) {
        WidthConstants[WidthConstants["StatusIcon"] = 30] = "StatusIcon";
        WidthConstants[WidthConstants["SplitAnnotation"] = 30] = "SplitAnnotation";
    })(WidthConstants || (WidthConstants = {}));
    let TerminalTabbedView = class TerminalTabbedView extends lifecycle_1.Disposable {
        constructor(parentElement, _terminalService, _terminalConfigurationService, _terminalGroupService, _instantiationService, _notificationService, _contextMenuService, _configurationService, menuService, _storageService, contextKeyService, _hoverService) {
            super();
            this._terminalService = _terminalService;
            this._terminalConfigurationService = _terminalConfigurationService;
            this._terminalGroupService = _terminalGroupService;
            this._instantiationService = _instantiationService;
            this._notificationService = _notificationService;
            this._contextMenuService = _contextMenuService;
            this._configurationService = _configurationService;
            this._storageService = _storageService;
            this._hoverService = _hoverService;
            this._cancelContextMenu = false;
            this._tabContainer = $('.tabs-container');
            const tabListContainer = $('.tabs-list-container');
            this._tabListElement = $('.tabs-list');
            tabListContainer.appendChild(this._tabListElement);
            this._tabContainer.appendChild(tabListContainer);
            this._instanceMenu = this._register(menuService.createMenu(actions_2.MenuId.TerminalInstanceContext, contextKeyService));
            this._tabsListMenu = this._register(menuService.createMenu(actions_2.MenuId.TerminalTabContext, contextKeyService));
            this._tabsListEmptyMenu = this._register(menuService.createMenu(actions_2.MenuId.TerminalTabEmptyAreaContext, contextKeyService));
            this._tabList = this._register(this._instantiationService.createInstance(terminalTabsList_1.TerminalTabList, this._tabListElement));
            const terminalOuterContainer = $('.terminal-outer-container');
            this._terminalContainer = $('.terminal-groups-container');
            terminalOuterContainer.appendChild(this._terminalContainer);
            this._terminalService.setContainers(parentElement, this._terminalContainer);
            this._terminalIsTabsNarrowContextKey = terminalContextKey_1.TerminalContextKeys.tabsNarrow.bindTo(contextKeyService);
            this._terminalTabsFocusContextKey = terminalContextKey_1.TerminalContextKeys.tabsFocus.bindTo(contextKeyService);
            this._terminalTabsMouseContextKey = terminalContextKey_1.TerminalContextKeys.tabsMouse.bindTo(contextKeyService);
            this._tabTreeIndex = this._terminalConfigurationService.config.tabs.location === 'left' ? 0 : 1;
            this._terminalContainerIndex = this._terminalConfigurationService.config.tabs.location === 'left' ? 1 : 0;
            this._register(_configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */) ||
                    e.affectsConfiguration("terminal.integrated.tabs.hideCondition" /* TerminalSettingId.TabsHideCondition */)) {
                    this._refreshShowTabs();
                }
                else if (e.affectsConfiguration("terminal.integrated.tabs.location" /* TerminalSettingId.TabsLocation */)) {
                    this._tabTreeIndex = this._terminalConfigurationService.config.tabs.location === 'left' ? 0 : 1;
                    this._terminalContainerIndex = this._terminalConfigurationService.config.tabs.location === 'left' ? 1 : 0;
                    if (this._shouldShowTabs()) {
                        this._splitView.swapViews(0, 1);
                        this._removeSashListener();
                        this._addSashListener();
                        this._splitView.resizeView(this._tabTreeIndex, this._getLastListWidth());
                    }
                }
            }));
            this._register(this._terminalGroupService.onDidChangeInstances(() => this._refreshShowTabs()));
            this._register(this._terminalGroupService.onDidChangeGroups(() => this._refreshShowTabs()));
            this._attachEventListeners(parentElement, this._terminalContainer);
            this._register(this._terminalGroupService.onDidChangePanelOrientation((orientation) => {
                this._panelOrientation = orientation;
                if (this._panelOrientation === 0 /* Orientation.VERTICAL */) {
                    this._terminalContainer.classList.add("terminal-side-view" /* CssClass.ViewIsVertical */);
                }
                else {
                    this._terminalContainer.classList.remove("terminal-side-view" /* CssClass.ViewIsVertical */);
                }
            }));
            this._splitView = new splitview_1.SplitView(parentElement, { orientation: 1 /* Orientation.HORIZONTAL */, proportionalLayout: false });
            this._setupSplitView(terminalOuterContainer);
        }
        _shouldShowTabs() {
            const enabled = this._terminalConfigurationService.config.tabs.enabled;
            const hide = this._terminalConfigurationService.config.tabs.hideCondition;
            if (!enabled) {
                return false;
            }
            if (hide === 'never') {
                return true;
            }
            if (hide === 'singleTerminal' && this._terminalGroupService.instances.length > 1) {
                return true;
            }
            if (hide === 'singleGroup' && this._terminalGroupService.groups.length > 1) {
                return true;
            }
            return false;
        }
        _refreshShowTabs() {
            if (this._shouldShowTabs()) {
                if (this._splitView.length === 1) {
                    this._addTabTree();
                    this._addSashListener();
                    this._splitView.resizeView(this._tabTreeIndex, this._getLastListWidth());
                    this.rerenderTabs();
                }
            }
            else {
                if (this._splitView.length === 2 && !this._terminalTabsMouseContextKey.get()) {
                    this._splitView.removeView(this._tabTreeIndex);
                    if (this._plusButton) {
                        this._tabContainer.removeChild(this._plusButton);
                    }
                    this._removeSashListener();
                }
            }
        }
        _getLastListWidth() {
            const widthKey = this._panelOrientation === 0 /* Orientation.VERTICAL */ ? "tabs-list-width-vertical" /* TerminalStorageKeys.TabsListWidthVertical */ : "tabs-list-width-horizontal" /* TerminalStorageKeys.TabsListWidthHorizontal */;
            const storedValue = this._storageService.get(widthKey, 0 /* StorageScope.PROFILE */);
            if (!storedValue || !parseInt(storedValue)) {
                // we want to use the min width by default for the vertical orientation bc
                // there is such a limited width for the terminal panel to begin w there.
                return this._panelOrientation === 0 /* Orientation.VERTICAL */ ? 46 /* TerminalTabsListSizes.NarrowViewWidth */ : 120 /* TerminalTabsListSizes.DefaultWidth */;
            }
            return parseInt(storedValue);
        }
        _handleOnDidSashReset() {
            // Calculate ideal size of list to display all text based on its contents
            let idealWidth = 80 /* TerminalTabsListSizes.WideViewMinimumWidth */;
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = 1;
            offscreenCanvas.height = 1;
            const ctx = offscreenCanvas.getContext('2d');
            if (ctx) {
                const style = dom.getWindow(this._tabListElement).getComputedStyle(this._tabListElement);
                ctx.font = `${style.fontStyle} ${style.fontSize} ${style.fontFamily}`;
                const maxInstanceWidth = this._terminalGroupService.instances.reduce((p, c) => {
                    return Math.max(p, ctx.measureText(c.title + (c.description || '')).width + this._getAdditionalWidth(c));
                }, 0);
                idealWidth = Math.ceil(Math.max(maxInstanceWidth, 80 /* TerminalTabsListSizes.WideViewMinimumWidth */));
            }
            // If the size is already ideal, toggle to collapsed
            const currentWidth = Math.ceil(this._splitView.getViewSize(this._tabTreeIndex));
            if (currentWidth === idealWidth) {
                idealWidth = 46 /* TerminalTabsListSizes.NarrowViewWidth */;
            }
            this._splitView.resizeView(this._tabTreeIndex, idealWidth);
            this._updateListWidth(idealWidth);
        }
        _getAdditionalWidth(instance) {
            // Size to include padding, icon, status icon (if any), split annotation (if any), + a little more
            const additionalWidth = 40;
            const statusIconWidth = instance.statusList.statuses.length > 0 ? 30 /* WidthConstants.StatusIcon */ : 0;
            const splitAnnotationWidth = (this._terminalGroupService.getGroupForInstance(instance)?.terminalInstances.length || 0) > 1 ? 30 /* WidthConstants.SplitAnnotation */ : 0;
            return additionalWidth + splitAnnotationWidth + statusIconWidth;
        }
        _handleOnDidSashChange() {
            const listWidth = this._splitView.getViewSize(this._tabTreeIndex);
            if (!this._width || listWidth <= 0) {
                return;
            }
            this._updateListWidth(listWidth);
        }
        _updateListWidth(width) {
            if (width < 63 /* TerminalTabsListSizes.MidpointViewWidth */ && width >= 46 /* TerminalTabsListSizes.NarrowViewWidth */) {
                width = 46 /* TerminalTabsListSizes.NarrowViewWidth */;
                this._splitView.resizeView(this._tabTreeIndex, width);
            }
            else if (width >= 63 /* TerminalTabsListSizes.MidpointViewWidth */ && width < 80 /* TerminalTabsListSizes.WideViewMinimumWidth */) {
                width = 80 /* TerminalTabsListSizes.WideViewMinimumWidth */;
                this._splitView.resizeView(this._tabTreeIndex, width);
            }
            this.rerenderTabs();
            const widthKey = this._panelOrientation === 0 /* Orientation.VERTICAL */ ? "tabs-list-width-vertical" /* TerminalStorageKeys.TabsListWidthVertical */ : "tabs-list-width-horizontal" /* TerminalStorageKeys.TabsListWidthHorizontal */;
            this._storageService.store(widthKey, width, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        _setupSplitView(terminalOuterContainer) {
            this._register(this._splitView.onDidSashReset(() => this._handleOnDidSashReset()));
            this._register(this._splitView.onDidSashChange(() => this._handleOnDidSashChange()));
            if (this._shouldShowTabs()) {
                this._addTabTree();
            }
            this._splitView.addView({
                element: terminalOuterContainer,
                layout: width => this._terminalGroupService.groups.forEach(tab => tab.layout(width, this._height || 0)),
                minimumSize: 120,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: () => lifecycle_1.Disposable.None,
                priority: 2 /* LayoutPriority.High */
            }, splitview_1.Sizing.Distribute, this._terminalContainerIndex);
            if (this._shouldShowTabs()) {
                this._addSashListener();
            }
        }
        _addTabTree() {
            this._splitView.addView({
                element: this._tabContainer,
                layout: width => this._tabList.layout(this._height || 0, width),
                minimumSize: 46 /* TerminalTabsListSizes.NarrowViewWidth */,
                maximumSize: 500 /* TerminalTabsListSizes.MaximumWidth */,
                onDidChange: () => lifecycle_1.Disposable.None,
                priority: 1 /* LayoutPriority.Low */
            }, splitview_1.Sizing.Distribute, this._tabTreeIndex);
            this.rerenderTabs();
        }
        rerenderTabs() {
            this._updateHasText();
            this._tabList.refresh();
        }
        _addSashListener() {
            let interval;
            this._sashDisposables = [
                this._splitView.sashes[0].onDidStart(e => {
                    interval = dom.disposableWindowInterval(dom.getWindow(this._splitView.el), () => {
                        this.rerenderTabs();
                    }, 100);
                }),
                this._splitView.sashes[0].onDidEnd(e => {
                    interval.dispose();
                })
            ];
        }
        _removeSashListener() {
            if (this._sashDisposables) {
                (0, lifecycle_1.dispose)(this._sashDisposables);
                this._sashDisposables = undefined;
            }
        }
        _updateHasText() {
            const hasText = this._tabListElement.clientWidth > 63 /* TerminalTabsListSizes.MidpointViewWidth */;
            this._tabContainer.classList.toggle('has-text', hasText);
            this._terminalIsTabsNarrowContextKey.set(!hasText);
        }
        layout(width, height) {
            this._height = height;
            this._width = width;
            this._splitView.layout(width);
            if (this._shouldShowTabs()) {
                this._splitView.resizeView(this._tabTreeIndex, this._getLastListWidth());
            }
            this._updateHasText();
        }
        _attachEventListeners(parentDomElement, terminalContainer) {
            this._register(dom.addDisposableListener(this._tabContainer, 'mouseleave', async (event) => {
                this._terminalTabsMouseContextKey.set(false);
                this._refreshShowTabs();
                event.stopPropagation();
            }));
            this._register(dom.addDisposableListener(this._tabContainer, 'mouseenter', async (event) => {
                this._terminalTabsMouseContextKey.set(true);
                event.stopPropagation();
            }));
            this._register(dom.addDisposableListener(terminalContainer, 'mousedown', async (event) => {
                const terminal = this._terminalGroupService.activeInstance;
                if (this._terminalGroupService.instances.length === 0 || !terminal) {
                    this._cancelContextMenu = true;
                    return;
                }
                if (event.which === 2) {
                    switch (this._terminalConfigurationService.config.middleClickBehavior) {
                        case 'paste':
                            terminal.paste();
                            break;
                        case 'default':
                        default:
                            // Drop selection and focus terminal on Linux to enable middle button paste
                            // when click occurs on the selection itself.
                            terminal.focus();
                            break;
                    }
                }
                else if (event.which === 3) {
                    const rightClickBehavior = this._terminalConfigurationService.config.rightClickBehavior;
                    if (rightClickBehavior === 'nothing') {
                        if (!event.shiftKey) {
                            this._cancelContextMenu = true;
                        }
                        return;
                    }
                    else if (rightClickBehavior === 'copyPaste' || rightClickBehavior === 'paste') {
                        // copyPaste: Shift+right click should open context menu
                        if (rightClickBehavior === 'copyPaste' && event.shiftKey) {
                            (0, terminalContextMenu_1.openContextMenu)(dom.getWindow(terminalContainer), event, terminal, this._instanceMenu, this._contextMenuService);
                            return;
                        }
                        if (rightClickBehavior === 'copyPaste' && terminal.hasSelection()) {
                            await terminal.copySelection();
                            terminal.clearSelection();
                        }
                        else {
                            if (canIUse_1.BrowserFeatures.clipboard.readText) {
                                terminal.paste();
                            }
                            else {
                                this._notificationService.info(`This browser doesn't support the clipboard.readText API needed to trigger a paste, try ${platform_1.isMacintosh ? '⌘' : 'Ctrl'}+V instead.`);
                            }
                        }
                        // Clear selection after all click event bubbling is finished on Mac to prevent
                        // right-click selecting a word which is seemed cannot be disabled. There is a
                        // flicker when pasting but this appears to give the best experience if the
                        // setting is enabled.
                        if (platform_1.isMacintosh) {
                            setTimeout(() => {
                                terminal.clearSelection();
                            }, 0);
                        }
                        this._cancelContextMenu = true;
                    }
                }
            }));
            this._register(dom.addDisposableListener(terminalContainer, 'contextmenu', (event) => {
                const rightClickBehavior = this._terminalConfigurationService.config.rightClickBehavior;
                if (rightClickBehavior === 'nothing' && !event.shiftKey) {
                    this._cancelContextMenu = true;
                }
                terminalContainer.focus();
                if (!this._cancelContextMenu) {
                    (0, terminalContextMenu_1.openContextMenu)(dom.getWindow(terminalContainer), event, this._terminalGroupService.activeInstance, this._instanceMenu, this._contextMenuService);
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                this._cancelContextMenu = false;
            }));
            this._register(dom.addDisposableListener(this._tabContainer, 'contextmenu', (event) => {
                const rightClickBehavior = this._terminalConfigurationService.config.rightClickBehavior;
                if (rightClickBehavior === 'nothing' && !event.shiftKey) {
                    this._cancelContextMenu = true;
                }
                if (!this._cancelContextMenu) {
                    const emptyList = this._tabList.getFocus().length === 0;
                    if (!emptyList) {
                        this._terminalGroupService.lastAccessedMenu = 'tab-list';
                    }
                    // Put the focused item first as it's used as the first positional argument
                    const selectedInstances = this._tabList.getSelectedElements();
                    const focusedInstance = this._tabList.getFocusedElements()?.[0];
                    if (focusedInstance) {
                        selectedInstances.splice(selectedInstances.findIndex(e => e.instanceId === focusedInstance.instanceId), 1);
                        selectedInstances.unshift(focusedInstance);
                    }
                    (0, terminalContextMenu_1.openContextMenu)(dom.getWindow(this._tabContainer), event, selectedInstances, emptyList ? this._tabsListEmptyMenu : this._tabsListMenu, this._contextMenuService, emptyList ? this._getTabActions() : undefined);
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                this._cancelContextMenu = false;
            }));
            this._register(dom.addDisposableListener(terminalContainer.ownerDocument, 'keydown', (event) => {
                terminalContainer.classList.toggle('alt-active', !!event.altKey);
            }));
            this._register(dom.addDisposableListener(terminalContainer.ownerDocument, 'keyup', (event) => {
                terminalContainer.classList.toggle('alt-active', !!event.altKey);
            }));
            this._register(dom.addDisposableListener(parentDomElement, 'keyup', (event) => {
                if (event.keyCode === 27) {
                    // Keep terminal open on escape
                    event.stopPropagation();
                }
            }));
            this._register(dom.addDisposableListener(this._tabContainer, dom.EventType.FOCUS_IN, () => {
                this._terminalTabsFocusContextKey.set(true);
            }));
            this._register(dom.addDisposableListener(this._tabContainer, dom.EventType.FOCUS_OUT, () => {
                this._terminalTabsFocusContextKey.set(false);
            }));
        }
        _getTabActions() {
            return [
                new actions_1.Separator(),
                this._configurationService.inspect("terminal.integrated.tabs.location" /* TerminalSettingId.TabsLocation */).userValue === 'left' ?
                    new actions_1.Action('moveRight', (0, nls_1.localize)('moveTabsRight', "Move Tabs Right"), undefined, undefined, async () => {
                        this._configurationService.updateValue("terminal.integrated.tabs.location" /* TerminalSettingId.TabsLocation */, 'right');
                    }) :
                    new actions_1.Action('moveLeft', (0, nls_1.localize)('moveTabsLeft', "Move Tabs Left"), undefined, undefined, async () => {
                        this._configurationService.updateValue("terminal.integrated.tabs.location" /* TerminalSettingId.TabsLocation */, 'left');
                    }),
                new actions_1.Action('hideTabs', (0, nls_1.localize)('hideTabs', "Hide Tabs"), undefined, undefined, async () => {
                    this._configurationService.updateValue("terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */, false);
                })
            ];
        }
        setEditable(isEditing) {
            if (!isEditing) {
                this._tabList.domFocus();
            }
            this._tabList.refresh(false);
        }
        focusTabs() {
            if (!this._shouldShowTabs()) {
                return;
            }
            this._terminalTabsFocusContextKey.set(true);
            const selected = this._tabList.getSelection();
            this._tabList.domFocus();
            if (selected) {
                this._tabList.setFocus(selected);
            }
        }
        focus() {
            if (this._terminalService.connectionState === 1 /* TerminalConnectionState.Connected */) {
                this._focus();
                return;
            }
            // If the terminal is waiting to reconnect to remote terminals, then there is no TerminalInstance yet that can
            // be focused. So wait for connection to finish, then focus.
            const previousActiveElement = this._tabListElement.ownerDocument.activeElement;
            if (previousActiveElement) {
                // TODO: Improve lifecycle management this event should be disposed after first fire
                this._register(this._terminalService.onDidChangeConnectionState(() => {
                    // Only focus the terminal if the activeElement has not changed since focus() was called
                    // TODO: Hack
                    if (dom.isActiveElement(previousActiveElement)) {
                        this._focus();
                    }
                }));
            }
        }
        focusHover() {
            if (this._shouldShowTabs()) {
                this._tabList.focusHover();
                return;
            }
            const instance = this._terminalGroupService.activeInstance;
            if (!instance) {
                return;
            }
            this._hoverService.showHover({
                ...(0, terminalTooltip_1.getInstanceHoverInfo)(instance),
                target: this._terminalContainer,
                trapFocus: true
            }, true);
        }
        _focus() {
            this._terminalGroupService.activeInstance?.focusWhenReady();
        }
    };
    exports.TerminalTabbedView = TerminalTabbedView;
    exports.TerminalTabbedView = TerminalTabbedView = __decorate([
        __param(1, terminal_1.ITerminalService),
        __param(2, terminal_1.ITerminalConfigurationService),
        __param(3, terminal_1.ITerminalGroupService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, notification_1.INotificationService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, actions_2.IMenuService),
        __param(9, storage_1.IStorageService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, hover_1.IHoverService)
    ], TerminalTabbedView);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUYWJiZWRWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbFRhYmJlZFZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhCLElBQVcsUUFFVjtJQUZELFdBQVcsUUFBUTtRQUNsQixpREFBcUMsQ0FBQTtJQUN0QyxDQUFDLEVBRlUsUUFBUSxLQUFSLFFBQVEsUUFFbEI7SUFFRCxJQUFXLGNBR1Y7SUFIRCxXQUFXLGNBQWM7UUFDeEIsZ0VBQWUsQ0FBQTtRQUNmLDBFQUFvQixDQUFBO0lBQ3JCLENBQUMsRUFIVSxjQUFjLEtBQWQsY0FBYyxRQUd4QjtJQUVNLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVU7UUE4QmpELFlBQ0MsYUFBMEIsRUFDUixnQkFBbUQsRUFDdEMsNkJBQTZFLEVBQ3JGLHFCQUE2RCxFQUM3RCxxQkFBNkQsRUFDOUQsb0JBQTJELEVBQzVELG1CQUF5RCxFQUN2RCxxQkFBNkQsRUFDdEUsV0FBeUIsRUFDdEIsZUFBaUQsRUFDOUMsaUJBQXFDLEVBQzFDLGFBQTZDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBWjJCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDckIsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUErQjtZQUNwRSwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzVDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDN0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUMzQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQ3RDLDBCQUFx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