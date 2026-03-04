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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/collections", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/actions/common/menuService", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/telemetry/common/telemetry"], function (require, exports, dom_1, mouseEvent_1, toolbar_1, actions_1, arrays_1, collections_1, errors_1, event_1, iterator_1, lifecycle_1, nls_1, menuEntryActionViewItem_1, actions_2, menuService_1, commands_1, contextkey_1, contextView_1, keybinding_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuWorkbenchToolBar = exports.WorkbenchToolBar = exports.HiddenItemStrategy = void 0;
    var HiddenItemStrategy;
    (function (HiddenItemStrategy) {
        /** This toolbar doesn't support hiding*/
        HiddenItemStrategy[HiddenItemStrategy["NoHide"] = -1] = "NoHide";
        /** Hidden items aren't shown anywhere */
        HiddenItemStrategy[HiddenItemStrategy["Ignore"] = 0] = "Ignore";
        /** Hidden items move into the secondary group */
        HiddenItemStrategy[HiddenItemStrategy["RenderInSecondaryGroup"] = 1] = "RenderInSecondaryGroup";
    })(HiddenItemStrategy || (exports.HiddenItemStrategy = HiddenItemStrategy = {}));
    /**
     * The `WorkbenchToolBar` does
     * - support hiding of menu items
     * - lookup keybindings for each actions automatically
     * - send `workbenchActionExecuted`-events for each action
     *
     * See {@link MenuWorkbenchToolBar} for a toolbar that is backed by a menu.
     */
    let WorkbenchToolBar = class WorkbenchToolBar extends toolbar_1.ToolBar {
        constructor(container, _options, _menuService, _contextKeyService, _contextMenuService, _keybindingService, _commandService, telemetryService) {
            super(container, _contextMenuService, {
                // defaults
                getKeyBinding: (action) => _keybindingService.lookupKeybinding(action.id) ?? undefined,
                // options (override defaults)
                ..._options,
                // mandatory (overide options)
                allowContextMenu: true,
                skipTelemetry: typeof _options?.telemetrySource === 'string',
            });
            this._options = _options;
            this._menuService = _menuService;
            this._contextKeyService = _contextKeyService;
            this._contextMenuService = _contextMenuService;
            this._keybindingService = _keybindingService;
            this._commandService = _commandService;
            this._sessionDisposables = this._store.add(new lifecycle_1.DisposableStore());
            // telemetry logic
            const telemetrySource = _options?.telemetrySource;
            if (telemetrySource) {
                this._store.add(this.actionBar.onDidRun(e => telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: telemetrySource })));
            }
        }
        setActions(_primary, _secondary = [], menuIds) {
            this._sessionDisposables.clear();
            const primary = _primary.slice(); // for hiding and overflow we set some items to undefined
            const secondary = _secondary.slice();
            const toggleActions = [];
            let toggleActionsCheckedCount = 0;
            const extraSecondary = [];
            let someAreHidden = false;
            // unless disabled, move all hidden items to secondary group or ignore them
            if (this._options?.hiddenItemStrategy !== -1 /* HiddenItemStrategy.NoHide */) {
                for (let i = 0; i < primary.length; i++) {
                    const action = primary[i];
                    if (!(action instanceof actions_2.MenuItemAction) && !(action instanceof actions_2.SubmenuItemAction)) {
                        // console.warn(`Action ${action.id}/${action.label} is not a MenuItemAction`);
                        continue;
                    }
                    if (!action.hideActions) {
                        continue;
                    }
                    // collect all toggle actions
                    toggleActions.push(action.hideActions.toggle);
                    if (action.hideActions.toggle.checked) {
                        toggleActionsCheckedCount++;
                    }
                    // hidden items move into overflow or ignore
                    if (action.hideActions.isHidden) {
                        someAreHidden = true;
                        primary[i] = undefined;
                        if (this._options?.hiddenItemStrategy !== 0 /* HiddenItemStrategy.Ignore */) {
                            extraSecondary[i] = action;
                        }
                    }
                }
            }
            // count for max
            if (this._options?.overflowBehavior !== undefined) {
                const exemptedIds = (0, collections_1.intersection)(new Set(this._options.overflowBehavior.exempted), iterator_1.Iterable.map(primary, a => a?.id));
                const maxItems = this._options.overflowBehavior.maxItems - exemptedIds.size;
                let count = 0;
                for (let i = 0; i < primary.length; i++) {
                    const action = primary[i];
                    if (!action) {
                        continue;
                    }
                    count++;
                    if (exemptedIds.has(action.id)) {
                        continue;
                    }
                    if (count >= maxItems) {
                        primary[i] = undefined;
                        extraSecondary[i] = action;
                    }
                }
            }
            // coalesce turns Array<IAction|undefined> into IAction[]
            (0, arrays_1.coalesceInPlace)(primary);
            (0, arrays_1.coalesceInPlace)(extraSecondary);
            super.setActions(primary, actions_1.Separator.join(extraSecondary, secondary));
            // add context menu for toggle and configure keybinding actions
            if (toggleActions.length > 0 || primary.length > 0) {
                this._sessionDisposables.add((0, dom_1.addDisposableListener)(this.getElement(), 'contextmenu', e => {
                    const event = new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.getElement()), e);
                    const action = this.getItemAction(event.target);
                    if (!(action)) {
                        return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    const primaryActions = [];
                    // -- Configure Keybinding Action --
                    if (action instanceof actions_2.MenuItemAction && action.menuKeybinding) {
                        primaryActions.push(action.menuKeybinding);
                    }
                    else if (!(action instanceof actions_2.SubmenuItemAction || action instanceof toolbar_1.ToggleMenuAction)) {
                        primaryActions.push((0, menuService_1.createConfigureKeybindingAction)(action.id, undefined, this._commandService, this._keybindingService));
                    }
                    // -- Hide Actions --
                    if (toggleActions.length > 0) {
                        let noHide = false;
                        // last item cannot be hidden when using ignore strategy
                        if (toggleActionsCheckedCount === 1 && this._options?.hiddenItemStrategy === 0 /* HiddenItemStrategy.Ignore */) {
                            noHide = true;
                            for (let i = 0; i < toggleActions.length; i++) {
                                if (toggleActions[i].checked) {
                                    toggleActions[i] = (0, actions_1.toAction)({
                                        id: action.id,
                                        label: action.label,
                                        checked: true,
                                        enabled: false,
                                        run() { }
                                    });
                                    break; // there is only one
                                }
                            }
                        }
                        // add "hide foo" actions
                        if (!noHide && (action instanceof actions_2.MenuItemAction || action instanceof actions_2.SubmenuItemAction)) {
                            if (!action.hideActions) {
                                // no context menu for MenuItemAction instances that support no hiding
                                // those are fake actions and need to be cleaned up
                                return;
                            }
                            primaryActions.push(action.hideActions.hide);
                        }
                        else {
                            primaryActions.push((0, actions_1.toAction)({
                                id: 'label',
                                label: (0, nls_1.localize)('hide', "Hide"),
                                enabled: false,
                                run() { }
                            }));
                        }
                    }
                    const actions = actions_1.Separator.join(primaryActions, toggleActions);
                    // add "Reset Menu" action
                    if (this._options?.resetMenu && !menuIds) {
                        menuIds = [this._options.resetMenu];
                    }
                    if (someAreHidden && menuIds) {
                        actions.push(new actions_1.Separator());
                        actions.push((0, actions_1.toAction)({
                            id: 'resetThisMenu',
                            label: (0, nls_1.localize)('resetThisMenu', "Reset Menu"),
                            run: () => this._menuService.resetHiddenStates(menuIds)
                        }));
                    }
                    if (actions.length === 0) {
                        return;
                    }
                    this._contextMenuService.showContextMenu({
                        getAnchor: () => event,
                        getActions: () => actions,
                        // add context menu actions (iff appicable)
                        menuId: this._options?.contextMenu,
                        menuActionOptions: { renderShortTitle: true, ...this._options?.menuOptions },
                        skipTelemetry: typeof this._options?.telemetrySource === 'string',
                        contextKeyService: this._contextKeyService,
                    });
                }));
            }
        }
    };
    exports.WorkbenchToolBar = WorkbenchToolBar;
    exports.WorkbenchToolBar = WorkbenchToolBar = __decorate([
        __param(2, actions_2.IMenuService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, commands_1.ICommandService),
        __param(7, telemetry_1.ITelemetryService)
    ], WorkbenchToolBar);
    /**
     * A {@link WorkbenchToolBar workbench toolbar} that is purely driven from a {@link MenuId menu}-identifier.
     *
     * *Note* that Manual updates via `setActions` are NOT supported.
     */
    let MenuWorkbenchToolBar = class MenuWorkbenchToolBar extends WorkbenchToolBar {
        constructor(container, menuId, options, menuService, contextKeyService, contextMenuService, keybindingService, commandService, telemetryService) {
            super(container, { resetMenu: menuId, ...options }, menuService, contextKeyService, contextMenuService, keybindingService, commandService, telemetryService);
            this._onDidChangeMenuItems = this._store.add(new event_1.Emitter());
            this.onDidChangeMenuItems = this._onDidChangeMenuItems.event;
            // update logic
            const menu = this._store.add(menuService.createMenu(menuId, contextKeyService, { emitEventsForSubmenuChanges: true }));
            const updateToolbar = () => {
                const primary = [];
                const secondary = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, options?.menuOptions, { primary, secondary }, options?.toolbarOptions?.primaryGroup, options?.toolbarOptions?.shouldInlineSubmenu, options?.toolbarOptions?.useSeparatorsInPrimaryActions);
                container.classList.toggle('has-no-actions', primary.length === 0 && secondary.length === 0);
                super.setActions(primary, secondary);
            };
            this._store.add(menu.onDidChange(() => {
                updateToolbar();
                this._onDidChangeMenuItems.fire(this);
            }));
            updateToolbar();
        }
        /**
         * @deprecated The WorkbenchToolBar does not support this method because it works with menus.
         */
        setActions() {
            throw new errors_1.BugIndicatingError('This toolbar is populated from a menu.');
        }
    };
    exports.MenuWorkbenchToolBar = MenuWorkbenchToolBar;
    exports.MenuWorkbenchToolBar = MenuWorkbenchToolBar = __decorate([
        __param(3, actions_2.IMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, commands_1.ICommandService),
        __param(8, telemetry_1.ITelemetryService)
    ], MenuWorkbenchToolBar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbGJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2FjdGlvbnMvYnJvd3Nlci90b29sYmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNCaEcsSUFBa0Isa0JBT2pCO0lBUEQsV0FBa0Isa0JBQWtCO1FBQ25DLHlDQUF5QztRQUN6QyxnRUFBVyxDQUFBO1FBQ1gseUNBQXlDO1FBQ3pDLCtEQUFVLENBQUE7UUFDVixpREFBaUQ7UUFDakQsK0ZBQTBCLENBQUE7SUFDM0IsQ0FBQyxFQVBpQixrQkFBa0Isa0NBQWxCLGtCQUFrQixRQU9uQztJQTRDRDs7Ozs7OztPQU9HO0lBQ0ksSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSxpQkFBTztRQUk1QyxZQUNDLFNBQXNCLEVBQ2QsUUFBOEMsRUFDeEMsWUFBMkMsRUFDckMsa0JBQXVELEVBQ3RELG1CQUF5RCxFQUMxRCxrQkFBdUQsRUFDMUQsZUFBaUQsRUFDL0MsZ0JBQW1DO1lBRXRELEtBQUssQ0FBQyxTQUFTLEVBQUUsbUJBQW1CLEVBQUU7Z0JBQ3JDLFdBQVc7Z0JBQ1gsYUFBYSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksU0FBUztnQkFDdEYsOEJBQThCO2dCQUM5QixHQUFHLFFBQVE7Z0JBQ1gsOEJBQThCO2dCQUM5QixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixhQUFhLEVBQUUsT0FBTyxRQUFRLEVBQUUsZUFBZSxLQUFLLFFBQVE7YUFDNUQsQ0FBQyxDQUFDO1lBaEJLLGFBQVEsR0FBUixRQUFRLENBQXNDO1lBQ3ZCLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQ3BCLHVCQUFrQixHQUFsQixr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