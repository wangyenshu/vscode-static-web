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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/base/common/actions", "vs/platform/storage/common/storage", "vs/base/common/arrays", "vs/nls", "vs/platform/keybinding/common/keybinding"], function (require, exports, async_1, event_1, lifecycle_1, actions_1, commands_1, contextkey_1, actions_2, storage_1, arrays_1, nls_1, keybinding_1) {
    "use strict";
    var PersistedMenuHideState_1, MenuInfo_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuService = void 0;
    exports.createConfigureKeybindingAction = createConfigureKeybindingAction;
    let MenuService = class MenuService {
        constructor(_commandService, _keybindingService, storageService) {
            this._commandService = _commandService;
            this._keybindingService = _keybindingService;
            this._hiddenStates = new PersistedMenuHideState(storageService);
        }
        createMenu(id, contextKeyService, options) {
            return new MenuImpl(id, this._hiddenStates, { emitEventsForSubmenuChanges: false, eventDebounceDelay: 50, ...options }, this._commandService, this._keybindingService, contextKeyService);
        }
        resetHiddenStates(ids) {
            this._hiddenStates.reset(ids);
        }
    };
    exports.MenuService = MenuService;
    exports.MenuService = MenuService = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, keybinding_1.IKeybindingService),
        __param(2, storage_1.IStorageService)
    ], MenuService);
    let PersistedMenuHideState = class PersistedMenuHideState {
        static { PersistedMenuHideState_1 = this; }
        static { this._key = 'menu.hiddenCommands'; }
        constructor(_storageService) {
            this._storageService = _storageService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._ignoreChangeEvent = false;
            this._hiddenByDefaultCache = new Map();
            try {
                const raw = _storageService.get(PersistedMenuHideState_1._key, 0 /* StorageScope.PROFILE */, '{}');
                this._data = JSON.parse(raw);
            }
            catch (err) {
                this._data = Object.create(null);
            }
            this._disposables.add(_storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, PersistedMenuHideState_1._key, this._disposables)(() => {
                if (!this._ignoreChangeEvent) {
                    try {
                        const raw = _storageService.get(PersistedMenuHideState_1._key, 0 /* StorageScope.PROFILE */, '{}');
                        this._data = JSON.parse(raw);
                    }
                    catch (err) {
                        console.log('FAILED to read storage after UPDATE', err);
                    }
                }
                this._onDidChange.fire();
            }));
        }
        dispose() {
            this._onDidChange.dispose();
            this._disposables.dispose();
        }
        _isHiddenByDefault(menu, commandId) {
            return this._hiddenByDefaultCache.get(`${menu.id}/${commandId}`) ?? false;
        }
        setDefaultState(menu, commandId, hidden) {
            this._hiddenByDefaultCache.set(`${menu.id}/${commandId}`, hidden);
        }
        isHidden(menu, commandId) {
            const hiddenByDefault = this._isHiddenByDefault(menu, commandId);
            const state = this._data[menu.id]?.includes(commandId) ?? false;
            return hiddenByDefault ? !state : state;
        }
        updateHidden(menu, commandId, hidden) {
            const hiddenByDefault = this._isHiddenByDefault(menu, commandId);
            if (hiddenByDefault) {
                hidden = !hidden;
            }
            const entries = this._data[menu.id];
            if (!hidden) {
                // remove and cleanup
                if (entries) {
                    const idx = entries.indexOf(commandId);
                    if (idx >= 0) {
                        (0, arrays_1.removeFastWithoutKeepingOrder)(entries, idx);
                    }
                    if (entries.length === 0) {
                        delete this._data[menu.id];
                    }
                }
            }
            else {
                // add unless already added
                if (!entries) {
                    this._data[menu.id] = [commandId];
                }
                else {
                    const idx = entries.indexOf(commandId);
                    if (idx < 0) {
                        entries.push(commandId);
                    }
                }
            }
            this._persist();
        }
        reset(menus) {
            if (menus === undefined) {
                // reset all
                this._data = Object.create(null);
                this._persist();
            }
            else {
                // reset only for a specific menu
                for (const { id } of menus) {
                    if (this._data[id]) {
                        delete this._data[id];
                    }
                }
                this._persist();
            }
        }
        _persist() {
            try {
                this._ignoreChangeEvent = true;
                const raw = JSON.stringify(this._data);
                this._storageService.store(PersistedMenuHideState_1._key, raw, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
            finally {
                this._ignoreChangeEvent = false;
            }
        }
    };
    PersistedMenuHideState = PersistedMenuHideState_1 = __decorate([
        __param(0, storage_1.IStorageService)
    ], PersistedMenuHideState);
    let MenuInfo = MenuInfo_1 = class MenuInfo {
        constructor(_id, _hiddenStates, _collectContextKeysForSubmenus, _commandService, _keybindingService, _contextKeyService) {
            this._id = _id;
            this._hiddenStates = _hiddenStates;
            this._collectContextKeysForSubmenus = _collectContextKeysForSubmenus;
            this._commandService = _commandService;
            this._keybindingService = _keybindingService;
            this._contextKeyService = _contextKeyService;
            this._menuGroups = [];
            this._structureContextKeys = new Set();
            this._preconditionContextKeys = new Set();
            this._toggledContextKeys = new Set();
            this.refresh();
        }
        get structureContextKeys() {
            return this._structureContextKeys;
        }
        get preconditionContextKeys() {
            return this._preconditionContextKeys;
        }
        get toggledContextKeys() {
            return this._toggledContextKeys;
        }
        refresh() {
            // reset
            this._menuGroups.length = 0;
            this._structureContextKeys.clear();
            this._preconditionContextKeys.clear();
            this._toggledContextKeys.clear();
            const menuItems = actions_1.MenuRegistry.getMenuItems(this._id);
            let group;
            menuItems.sort(MenuInfo_1._compareMenuItems);
            for (const item of menuItems) {
                // group by groupId
                const groupName = item.group || '';
                if (!group || group[0] !== groupName) {
                    group = [groupName, []];
                    this._menuGroups.push(group);
                }
                group[1].push(item);
                // keep keys for eventing
                this._collectContextKeys(item);
            }
        }
        _collectContextKeys(item) {
            MenuInfo_1._fillInKbExprKeys(item.when, this._structureContextKeys);
            if ((0, actions_1.isIMenuItem)(item)) {
                // keep precondition keys for event if applicable
                if (item.command.precondition) {
                    MenuInfo_1._fillInKbExprKeys(item.command.precondition, this._preconditionContextKeys);
                }
                // keep toggled keys for event if applicable
                if (item.command.toggled) {
                    const toggledExpression = item.command.toggled.condition || item.command.toggled;
                    MenuInfo_1._fillInKbExprKeys(toggledExpression, this._toggledContextKeys);
                }
            }
            else if (this._collectContextKeysForSubmenus) {
                // recursively collect context keys from submenus so that this
                // menu fires events when context key changes affect submenus
                actions_1.MenuRegistry.getMenuItems(item.submenu).forEach(this._collectContextKeys, this);
            }
        }
        createActionGroups(options) {
            const result = [];
            for (const group of this._menuGroups) {
                const [id, items] = group;
                const activeActions = [];
                for (const item of items) {
                    if (this._contextKeyService.contextMatchesRules(item.when)) {
                        const isMenuItem = (0, actions_1.isIMenuItem)(item);
                        if (isMenuItem) {
                            this._hiddenStates.setDefaultState(this._id, item.command.id, !!item.isHiddenByDefault);
                        }
                        const menuHide = createMenuHide(this._id, isMenuItem ? item.command : item, this._hiddenStates);
                        if (isMenuItem) {
                            // MenuItemAction
                            const menuKeybinding = createConfigureKeybindingAction(item.command.id, item.when, this._commandService, this._keybindingService);
                            activeActions.push(new actions_1.MenuItemAction(item.command, item.alt, options, menuHide, menuKeybinding, this._contextKeyService, this._commandService));
                        }
                        else {
                            // SubmenuItemAction
                            const groups = new MenuInfo_1(item.submenu, this._hiddenStates, this._collectContextKeysForSubmenus, this._commandService, this._keybindingService, this._contextKeyService).createActionGroups(options);
                            const submenuActions = actions_2.Separator.join(...groups.map(g => g[1]));
                            if (submenuActions.length > 0) {
                                activeActions.push(new actions_1.SubmenuItemAction(item, menuHide, submenuActions));
                            }
                        }
                    }
                }
                if (activeActions.length > 0) {
                    result.push([id, activeActions]);
                }
            }
            return result;
        }
        static _fillInKbExprKeys(exp, set) {
            if (exp) {
                for (const key of exp.keys()) {
                    set.add(key);
                }
            }
        }
        static _compareMenuItems(a, b) {
            const aGroup = a.group;
            const bGroup = b.group;
            if (aGroup !== bGroup) {
                // Falsy groups come last
                if (!aGroup) {
                    return 1;
                }
                else if (!bGroup) {
                    return -1;
                }
                // 'navigation' group comes first
                if (aGroup === 'navigation') {
                    return -1;
                }
                else if (bGroup === 'navigation') {
                    return 1;
                }
                // lexical sort for groups
                const value = aGroup.localeCompare(bGroup);
                if (value !== 0) {
                    return value;
                }
            }
            // sort on priority - default is 0
            const aPrio = a.order || 0;
            const bPrio = b.order || 0;
            if (aPrio < bPrio) {
                return -1;
            }
            else if (aPrio > bPrio) {
                return 1;
            }
            // sort on titles
            return MenuInfo_1._compareTitles((0, actions_1.isIMenuItem)(a) ? a.command.title : a.title, (0, actions_1.isIMenuItem)(b) ? b.command.title : b.title);
        }
        static _compareTitles(a, b) {
            const aStr = typeof a === 'string' ? a : a.original;
            const bStr = typeof b === 'string' ? b : b.original;
            return aStr.localeCompare(bStr);
        }
    };
    MenuInfo = MenuInfo_1 = __decorate([
        __param(3, commands_1.ICommandService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, contextkey_1.IContextKeyService)
    ], MenuInfo);
    let MenuImpl = class MenuImpl {
        constructor(id, hiddenStates, options, commandService, keybindingService, contextKeyService) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._menuInfo = new MenuInfo(id, hiddenStates, options.emitEventsForSubmenuChanges, commandService, keybindingService, contextKeyService);
            // Rebuild this menu whenever the menu registry reports an event for this MenuId.
            // This usually happen while code and extensions are loaded and affects the over
            // structure of the menu
            const rebuildMenuSoon = new async_1.RunOnceScheduler(() => {
                this._menuInfo.refresh();
                this._onDidChange.fire({ menu: this, isStructuralChange: true, isEnablementChange: true, isToggleChange: true });
            }, options.eventDebounceDelay);
            this._disposables.add(rebuildMenuSoon);
            this._disposables.add(actions_1.MenuRegistry.onDidChangeMenu(e => {
                if (e.has(id)) {
                    rebuildMenuSoon.schedule();
                }
            }));
            // When context keys or storage state changes we need to check if the menu also has changed. However,
            // we only do that when someone listens on this menu because (1) these events are
            // firing often and (2) menu are often leaked
            const lazyListener = this._disposables.add(new lifecycle_1.DisposableStore());
            const merge = (events) => {
                let isStructuralChange = false;
                let isEnablementChange = false;
                let isToggleChange = false;
                for (const item of events) {
                    isStructuralChange = isStructuralChange || item.isStructuralChange;
                    isEnablementChange = isEnablementChange || item.isEnablementChange;
                    isToggleChange = isToggleChange || item.isToggleChange;
                    if (isStructuralChange && isEnablementChange && isToggleChange) {
                        // everything is TRUE, no need to continue iterating
                        break;
                    }
                }
                return { menu: this, isStructuralChange, isEnablementChange, isToggleChange };
            };
            const startLazyListener = () => {
                lazyListener.add(contextKeyService.onDidChangeContext(e => {
                    const isStructuralChange = e.affectsSome(this._menuInfo.structureContextKeys);
                    const isEnablementChange = e.affectsSome(this._menuInfo.preconditionContextKeys);
                    const isToggleChange = e.affectsSome(this._menuInfo.toggledContextKeys);
                    if (isStructuralChange || isEnablementChange || isToggleChange) {
                        this._onDidChange.fire({ menu: this, isStructuralChange, isEnablementChange, isToggleChange });
                    }
                }));
                lazyListener.add(hiddenStates.onDidChange(e => {
                    this._onDidChange.fire({ menu: this, isStructuralChange: true, isEnablementChange: false, isToggleChange: false });
                }));
            };
            this._onDidChange = new event_1.DebounceEmitter({
                // start/stop context key listener
                onWillAddFirstListener: startLazyListener,
                onDidRemoveLastListener: lazyListener.clear.bind(lazyListener),
                delay: options.eventDebounceDelay,
                merge
            });
            this.onDidChange = this._onDidChange.event;
        }
        getActions(options) {
            return this._menuInfo.createActionGroups(options);
        }
        dispose() {
            this._disposables.dispose();
            this._onDidChange.dispose();
        }
    };
    MenuImpl = __decorate([
        __param(3, commands_1.ICommandService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, contextkey_1.IContextKeyService)
    ], MenuImpl);
    function createMenuHide(menu, command, states) {
        const id = (0, actions_1.isISubmenuItem)(command) ? command.submenu.id : command.id;
        const title = typeof command.title === 'string' ? command.title : command.title.value;
        const hide = (0, actions_2.toAction)({
            id: `hide/${menu.id}/${id}`,
            label: (0, nls_1.localize)('hide.label', 'Hide \'{0}\'', title),
            run() { states.updateHidden(menu, id, true); }
        });
        const toggle = (0, actions_2.toAction)({
            id: `toggle/${menu.id}/${id}`,
            label: title,
            get checked() { return !states.isHidden(menu, id); },
            run() { states.updateHidden(menu, id, !!this.checked); }
        });
        return {
            hide,
            toggle,
            get isHidden() { return !toggle.checked; },
        };
    }
    function createConfigureKeybindingAction(commandId, when = undefined, commandService, keybindingService) {
        return (0, actions_2.toAction)({
            id: `configureKeybinding/${commandId}`,
            label: (0, nls_1.localize)('configure keybinding', "Configure Keybinding"),
            run() {
                // Only set the when clause when there is no keybinding
                // It is possible that the action and the keybinding have different when clauses
                const hasKeybinding = !!keybindingService.lookupKeybinding(commandId); // This may only be called inside the `run()` method as it can be expensive on startup. #210529
                const whenValue = !hasKeybinding && when ? when.serialize() : undefined;
                commandService.executeCommand('workbench.action.openGlobalKeybindings', `@command:${commandId}` + (whenValue ? ` +when:${whenValue}` : ''));
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hY3Rpb25zL2NvbW1vbi9tZW51U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeWJoRywwRUFZQztJQXRiTSxJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFXO1FBTXZCLFlBQ21DLGVBQWdDLEVBQzdCLGtCQUFzQyxFQUMxRCxjQUErQjtZQUZkLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUM3Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBRzNFLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBRUQsVUFBVSxDQUFDLEVBQVUsRUFBRSxpQkFBcUMsRUFBRSxPQUE0QjtZQUN6RixPQUFPLElBQUksUUFBUSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsMkJBQTJCLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLEVBQUUsRUFBRSxHQUFHLE9BQU8sRUFBRSxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDM0wsQ0FBQztRQUVELGlCQUFpQixDQUFDLEdBQWM7WUFDL0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsQ0FBQztLQUNELENBQUE7SUFyQlksa0NBQVc7MEJBQVgsV0FBVztRQU9yQixXQUFBLDBCQUFlLENBQUE7UUFDZixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEseUJBQWUsQ0FBQTtPQVRMLFdBQVcsQ0FxQnZCO0lBRUQsSUFBTSxzQkFBc0IsR0FBNUIsTUFB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