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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/common/actions", "vs/base/common/keybindingLabels", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/action/common/action", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/theme/common/theme", "vs/base/common/types", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/browser/defaultStyles", "vs/platform/accessibility/common/accessibility", "vs/css!./menuEntryActionViewItem"], function (require, exports, dom_1, keyboardEvent_1, actionViewItems_1, dropdownActionViewItem_1, actions_1, keybindingLabels_1, lifecycle_1, platform_1, nls_1, actions_2, action_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, storage_1, themeService_1, themables_1, theme_1, types_1, colorRegistry_1, defaultStyles_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DropdownWithDefaultActionViewItem = exports.SubmenuEntryActionViewItem = exports.MenuEntryActionViewItem = void 0;
    exports.createAndFillInContextMenuActions = createAndFillInContextMenuActions;
    exports.createAndFillInActionBarActions = createAndFillInActionBarActions;
    exports.createActionViewItem = createActionViewItem;
    function createAndFillInContextMenuActions(menu, options, target, primaryGroup) {
        const groups = menu.getActions(options);
        const modifierKeyEmitter = dom_1.ModifierKeyEmitter.getInstance();
        const useAlternativeActions = modifierKeyEmitter.keyStatus.altKey || ((platform_1.isWindows || platform_1.isLinux) && modifierKeyEmitter.keyStatus.shiftKey);
        fillInActions(groups, target, useAlternativeActions, primaryGroup ? actionGroup => actionGroup === primaryGroup : actionGroup => actionGroup === 'navigation');
    }
    function createAndFillInActionBarActions(menu, options, target, primaryGroup, shouldInlineSubmenu, useSeparatorsInPrimaryActions) {
        const groups = menu.getActions(options);
        const isPrimaryAction = typeof primaryGroup === 'string' ? (actionGroup) => actionGroup === primaryGroup : primaryGroup;
        // Action bars handle alternative actions on their own so the alternative actions should be ignored
        fillInActions(groups, target, false, isPrimaryAction, shouldInlineSubmenu, useSeparatorsInPrimaryActions);
    }
    function fillInActions(groups, target, useAlternativeActions, isPrimaryAction = actionGroup => actionGroup === 'navigation', shouldInlineSubmenu = () => false, useSeparatorsInPrimaryActions = false) {
        let primaryBucket;
        let secondaryBucket;
        if (Array.isArray(target)) {
            primaryBucket = target;
            secondaryBucket = target;
        }
        else {
            primaryBucket = target.primary;
            secondaryBucket = target.secondary;
        }
        const submenuInfo = new Set();
        for (const [group, actions] of groups) {
            let target;
            if (isPrimaryAction(group)) {
                target = primaryBucket;
                if (target.length > 0 && useSeparatorsInPrimaryActions) {
                    target.push(new actions_1.Separator());
                }
            }
            else {
                target = secondaryBucket;
                if (target.length > 0) {
                    target.push(new actions_1.Separator());
                }
            }
            for (let action of actions) {
                if (useAlternativeActions) {
                    action = action instanceof actions_2.MenuItemAction && action.alt ? action.alt : action;
                }
                const newLen = target.push(action);
                // keep submenu info for later inlining
                if (action instanceof actions_1.SubmenuAction) {
                    submenuInfo.add({ group, action, index: newLen - 1 });
                }
            }
        }
        // ask the outside if submenu should be inlined or not. only ask when
        // there would be enough space
        for (const { group, action, index } of submenuInfo) {
            const target = isPrimaryAction(group) ? primaryBucket : secondaryBucket;
            // inlining submenus with length 0 or 1 is easy,
            // larger submenus need to be checked with the overall limit
            const submenuActions = action.actions;
            if (shouldInlineSubmenu(action, group, target.length)) {
                target.splice(index, 1, ...submenuActions);
            }
        }
    }
    let MenuEntryActionViewItem = class MenuEntryActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(action, options, _keybindingService, _notificationService, _contextKeyService, _themeService, _contextMenuService, _accessibilityService) {
            super(undefined, action, { icon: !!(action.class || action.item.icon), label: !action.class && !action.item.icon, draggable: options?.draggable, keybinding: options?.keybinding, hoverDelegate: options?.hoverDelegate });
            this._keybindingService = _keybindingService;
            this._notificationService = _notificationService;
            this._contextKeyService = _contextKeyService;
            this._themeService = _themeService;
            this._contextMenuService = _contextMenuService;
            this._accessibilityService = _accessibilityService;
            this._wantsAltCommand = false;
            this._itemClassDispose = this._register(new lifecycle_1.MutableDisposable());
            this._altKey = dom_1.ModifierKeyEmitter.getInstance();
        }
        get _menuItemAction() {
            return this._action;
        }
        get _commandAction() {
            return this._wantsAltCommand && this._menuItemAction.alt || this._menuItemAction;
        }
        async onClick(event) {
            event.preventDefault();
            event.stopPropagation();
            try {
                await this.actionRunner.run(this._commandAction, this._context);
            }
            catch (err) {
                this._notificationService.error(err);
            }
        }
        render(container) {
            super.render(container);
            container.classList.add('menu-entry');
            if (this.options.icon) {
                this._updateItemClass(this._menuItemAction.item);
            }
            if (this._menuItemAction.alt) {
                let isMouseOver = false;
                const updateAltState = () => {
                    const wantsAltCommand = !!this._menuItemAction.alt?.enabled &&
                        (!this._accessibilityService.isMotionReduced() || isMouseOver) && (this._altKey.keyStatus.altKey ||
                        (this._altKey.keyStatus.shiftKey && isMouseOver));
                    if (wantsAltCommand !== this._wantsAltCommand) {
                        this._wantsAltCommand = wantsAltCommand;
                        this.updateLabel();
                        this.updateTooltip();
                        this.updateClass();
                    }
                };
                this._register(this._altKey.event(updateAltState));
                this._register((0, dom_1.addDisposableListener)(container, 'mouseleave', _ => {
                    isMouseOver = false;
                    updateAltState();
                }));
                this._register((0, dom_1.addDisposableListener)(container, 'mouseenter', _ => {
                    isMouseOver = true;
                    updateAltState();
                }));
                updateAltState();
            }
        }
        updateLabel() {
            if (this.options.label && this.label) {
                this.label.textContent = this._commandAction.label;
            }
        }
        getTooltip() {
            const keybinding = this._keybindingService.lookupKeybinding(this._commandAction.id, this._contextKeyService);
            const keybindingLabel = keybinding && keybinding.getLabel();
            const tooltip = this._commandAction.tooltip || this._commandAction.label;
            let title = keybindingLabel
                ? (0, nls_1.localize)('titleAndKb', "{0} ({1})", tooltip, keybindingLabel)
                : tooltip;
            if (!this._wantsAltCommand && this._menuItemAction.alt?.enabled) {
                const altTooltip = this._menuItemAction.alt.tooltip || this._menuItemAction.alt.label;
                const altKeybinding = this._keybindingService.lookupKeybinding(this._menuItemAction.alt.id, this._contextKeyService);
                const altKeybindingLabel = altKeybinding && altKeybinding.getLabel();
                const altTitleSection = altKeybindingLabel
                    ? (0, nls_1.localize)('titleAndKb', "{0} ({1})", altTooltip, altKeybindingLabel)
                    : altTooltip;
                title = (0, nls_1.localize)('titleAndKbAndAlt', "{0}\n[{1}] {2}", title, keybindingLabels_1.UILabelProvider.modifierLabels[platform_1.OS].altKey, altTitleSection);
            }
            return title;
        }
        updateClass() {
            if (this.options.icon) {
                if (this._commandAction !== this._menuItemAction) {
                    if (this._menuItemAction.alt) {
                        this._updateItemClass(this._menuItemAction.alt.item);
                    }
                }
                else {
                    this._updateItemClass(this._menuItemAction.item);
                }
            }
        }
        _updateItemClass(item) {
            this._itemClassDispose.value = undefined;
            const { element, label } = this;
            if (!element || !label) {
                return;
            }
            const icon = this._commandAction.checked && (0, action_1.isICommandActionToggleInfo)(item.toggled) && item.toggled.icon ? item.toggled.icon : item.icon;
            if (!icon) {
                return;
            }
            if (themables_1.ThemeIcon.isThemeIcon(icon)) {
                // theme icons
                const iconClasses = themables_1.ThemeIcon.asClassNameArray(icon);
                label.classList.add(...iconClasses);
                this._itemClassDispose.value = (0, lifecycle_1.toDisposable)(() => {
                    label.classList.remove(...iconClasses);
                });
            }
            else {
                // icon path/url
                label.style.backgroundImage = ((0, theme_1.isDark)(this._themeService.getColorTheme().type)
                    ? (0, dom_1.asCSSUrl)(icon.dark)
                    : (0, dom_1.asCSSUrl)(icon.light));
                label.classList.add('icon');
                this._itemClassDispose.value = (0, lifecycle_1.combinedDisposable)((0, lifecycle_1.toDisposable)(() => {
                    label.style.backgroundImage = '';
                    label.classList.remove('icon');
                }), this._themeService.onDidColorThemeChange(() => {
                    // refresh when the theme changes in case we go between dark <-> light
                    this.updateClass();
                }));
            }
        }
    };
    exports.MenuEntryActionViewItem = MenuEntryActionViewItem;
    exports.MenuEntryActionViewItem = MenuEntryActionViewItem = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, notification_1.INotificationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, themeService_1.IThemeService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, accessibility_1.IAccessibilityService)
    ], MenuEntryActionViewItem);
    let SubmenuEntryActionViewItem = class SubmenuEntryActionViewItem extends dropdownActionViewItem_1.DropdownMenuActionViewItem {
        constructor(action, options, _keybindingService, _contextMenuService, _themeService) {
            const dropdownOptions = {
                ...options,
                menuAsChild: options?.menuAsChild ?? false,
                classNames: options?.classNames ?? (themables_1.ThemeIcon.isThemeIcon(action.item.icon) ? themables_1.ThemeIcon.asClassName(action.item.icon) : undefined),
                keybindingProvider: options?.keybindingProvider ?? (action => _keybindingService.lookupKeybinding(action.id))
            };
            super(action, { getActions: () => action.actions }, _contextMenuService, dropdownOptions);
            this._keybindingService = _keybindingService;
            this._contextMenuService = _contextMenuService;
            this._themeService = _themeService;
        }
        render(container) {
            super.render(container);
            (0, types_1.assertType)(this.element);
            container.classList.add('menu-entry');
            const action = this._action;
            const { icon } = action.item;
            if (icon && !themables_1.ThemeIcon.isThemeIcon(icon)) {
                this.element.classList.add('icon');
                const setBackgroundImage = () => {
                    if (this.element) {
                        this.element.style.backgroundImage = ((0, theme_1.isDark)(this._themeService.getColorTheme().type)
                            ? (0, dom_1.asCSSUrl)(icon.dark)
                            : (0, dom_1.asCSSUrl)(icon.light));
                    }
                };
                setBackgroundImage();
                this._register(this._themeService.onDidColorThemeChange(() => {
                    // refresh when the theme changes in case we go between dark <-> light
                    setBackgroundImage();
                }));
            }
        }
    };
    exports.SubmenuEntryActionViewItem = SubmenuEntryActionViewItem;
    exports.SubmenuEntryActionViewItem = SubmenuEntryActionViewItem = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, themeService_1.IThemeService)
    ], SubmenuEntryActionViewItem);
    let DropdownWithDefaultActionViewItem = class DropdownWithDefaultActionViewItem extends actionViewItems_1.BaseActionViewItem {
        get onDidChangeDropdownVisibility() {
            return this._dropdown.onDidChangeVisibility;
        }
        constructor(submenuAction, options, _keybindingService, _notificationService, _contextMenuService, _menuService, _instaService, _storageService) {
            super(null, submenuAction);
            this._keybindingService = _keybindingService;
            this._notificationService = _notificationService;
            this._contextMenuService = _contextMenuService;
            this._menuService = _menuService;
            this._instaService = _instaService;
            this._storageService = _storageService;
            this._container = null;
            this._options = options;
            this._storageKey = `${submenuAction.item.submenu.id}_lastActionId`;
            // determine default action
            let defaultAction;
            const defaultActionId = options?.persistLastActionId ? _storageService.get(this._storageKey, 1 /* StorageScope.WORKSPACE */) : undefined;
            if (defaultActionId) {
                defaultAction = submenuAction.actions.find(a => defaultActionId === a.id);
            }
            if (!defaultAction) {
                defaultAction = submenuAction.actions[0];
            }
            this._defaultAction = this._instaService.createInstance(MenuEntryActionViewItem, defaultAction, { keybinding: this._getDefaultActionKeybindingLabel(defaultAction) });
            const dropdownOptions = {
                keybindingProvider: action => this._keybindingService.lookupKeybinding(action.id),
                ...options,
                menuAsChild: options?.menuAsChild ?? true,
                classNames: options?.classNames ?? ['codicon', 'codicon-chevron-down'],
                actionRunner: options?.actionRunner ?? new actions_1.ActionRunner(),
            };
            this._dropdown = new dropdownActionViewItem_1.DropdownMenuActionViewItem(submenuAction, submenuAction.actions, this._contextMenuService, dropdownOptions);
            this._register(this._dropdown.actionRunner.onDidRun((e) => {
                if (e.action instanceof actions_2.MenuItemAction) {
                    this.update(e.action);
                }
            }));
        }
        update(lastAction) {
            if (this._options?.persistLastActionId) {
                this._storageService.store(this._storageKey, lastAction.id, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            this._defaultAction.dispose();
            this._defaultAction = this._instaService.createInstance(MenuEntryActionViewItem, lastAction, { keybinding: this._getDefaultActionKeybindingLabel(lastAction) });
            this._defaultAction.actionRunner = new class extends actions_1.ActionRunner {
                async runAction(action, context) {
                    await action.run(undefined);
                }
            }();
            if (this._container) {
                this._defaultAction.render((0, dom_1.prepend)(this._container, (0, dom_1.$)('.action-container')));
            }
        }
        _getDefaultActionKeybindingLabel(defaultAction) {
            let defaultActionKeybinding;
            if (this._options?.renderKeybindingWithDefaultActionLabel) {
                const kb = this._keybindingService.lookupKeybinding(defaultAction.id);
                if (kb) {
                    defaultActionKeybinding = `(${kb.getLabel()})`;
                }
            }
            return defaultActionKeybinding;
        }
        setActionContext(newContext) {
            super.setActionContext(newContext);
            this._defaultAction.setActionContext(newContext);
            this._dropdown.setActionContext(newContext);
        }
        render(container) {
            this._container = container;
            super.render(this._container);
            this._container.classList.add('monaco-dropdown-with-default');
            const primaryContainer = (0, dom_1.$)('.action-container');
            this._defaultAction.render((0, dom_1.append)(this._container, primaryContainer));
            this._register((0, dom_1.addDisposableListener)(primaryContainer, dom_1.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(17 /* KeyCode.RightArrow */)) {
                    this._defaultAction.element.tabIndex = -1;
                    this._dropdown.focus();
                    event.stopPropagation();
                }
            }));
            const dropdownContainer = (0, dom_1.$)('.dropdown-action-container');
            this._dropdown.render((0, dom_1.append)(this._container, dropdownContainer));
            this._register((0, dom_1.addDisposableListener)(dropdownContainer, dom_1.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(15 /* KeyCode.LeftArrow */)) {
                    this._defaultAction.element.tabIndex = 0;
                    this._dropdown.setFocusable(false);
                    this._defaultAction.element?.focus();
                    event.stopPropagation();
                }
            }));
        }
        focus(fromRight) {
            if (fromRight) {
                this._dropdown.focus();
            }
            else {
                this._defaultAction.element.tabIndex = 0;
                this._defaultAction.element.focus();
            }
        }
        blur() {
            this._defaultAction.element.tabIndex = -1;
            this._dropdown.blur();
            this._container.blur();
        }
        setFocusable(focusable) {
            if (focusable) {
                this._defaultAction.element.tabIndex = 0;
            }
            else {
                this._defaultAction.element.tabIndex = -1;
                this._dropdown.setFocusable(false);
            }
        }
        dispose() {
            this._defaultAction.dispose();
            this._dropdown.dispose();
            super.dispose();
        }
    };
    exports.DropdownWithDefaultActionViewItem = DropdownWithDefaultActionViewItem;
    exports.DropdownWithDefaultActionViewItem = DropdownWithDefaultActionViewItem = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, notification_1.INotificationService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, actions_2.IMenuService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, storage_1.IStorageService)
    ], DropdownWithDefaultActionViewItem);
    let SubmenuEntrySelectActionViewItem = class SubmenuEntrySelectActionViewItem extends actionViewItems_1.SelectActionViewItem {
        constructor(action, contextViewService) {
            super(null, action, action.actions.map(a => ({
                text: a.id === actions_1.Separator.ID ? '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500' : a.label,
                isDisabled: !a.enabled,
            })), 0, contextViewService, defaultStyles_1.defaultSelectBoxStyles, { ariaLabel: action.tooltip, optionsAsChildren: true });
            this.select(Math.max(0, action.actions.findIndex(a => a.checked)));
        }
        render(container) {
            super.render(container);
            container.style.borderColor = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectBorder);
        }
        runAction(option, index) {
            const action = this.action.actions[index];
            if (action) {
                this.actionRunner.run(action);
            }
        }
    };
    SubmenuEntrySelectActionViewItem = __decorate([
        __param(1, contextView_1.IContextViewService)
    ], SubmenuEntrySelectActionViewItem);
    /**
     * Creates action view items for menu actions or submenu actions.
     */
    function createActionViewItem(instaService, action, options) {
        if (action instanceof actions_2.MenuItemAction) {
            return instaService.createInstance(MenuEntryActionViewItem, action, options);
        }
        else if (action instanceof actions_2.SubmenuItemAction) {
            if (action.item.isSelection) {
                return instaService.createInstance(SubmenuEntrySelectActionViewItem, action);
            }
            else {
                if (action.item.rememberDefaultAction) {
                    return instaService.createInstance(DropdownWithDefaultActionViewItem, action, { ...options, persistLastActionId: true });
                }
                else {
                    return instaService.createInstance(SubmenuEntryActionViewItem, action, options);
                }
            }
        }
        else {
            return undefined;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudUVudHJ5QWN0aW9uVmlld0l0ZW0uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hY3Rpb25zL2Jyb3dzZXIvbWVudUVudHJ5QWN0aW9uVmlld0l0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBK0JoRyw4RUFLQztJQUVELDBFQWFDO0lBK2NELG9EQWdCQztJQW5mRCxTQUFnQixpQ0FBaUMsQ0FBQyxJQUFXLEVBQUUsT0FBdUMsRUFBRSxNQUFnRSxFQUFFLFlBQXFCO1FBQzlMLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsTUFBTSxrQkFBa0IsR0FBRyx3QkFBa0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUM1RCxNQUFNLHFCQUFxQixHQUFHLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLG9CQUFTLElBQUksa0JBQU8sQ0FBQyxJQUFJLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2SSxhQUFhLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxxQkFBcUIsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxLQUFLLFlBQVksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEtBQUssWUFBWSxDQUFDLENBQUM7SUFDaEssQ0FBQztJQUVELFNBQWdCLCtCQUErQixDQUM5QyxJQUFXLEVBQ1gsT0FBdUMsRUFDdkMsTUFBZ0UsRUFDaEUsWUFBMEQsRUFDMUQsbUJBQTBGLEVBQzFGLDZCQUF1QztRQUV2QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FB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