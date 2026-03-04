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
define(["require", "exports", "vs/base/browser/ui/button/button", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/common/actions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/hover/browser/hover", "vs/platform/keybinding/common/keybinding", "vs/platform/telemetry/common/telemetry"], function (require, exports, button_1, hoverDelegateFactory_1, actions_1, event_1, lifecycle_1, themables_1, nls_1, actions_2, contextkey_1, contextView_1, hover_1, keybinding_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuWorkbenchButtonBar = exports.WorkbenchButtonBar = void 0;
    let WorkbenchButtonBar = class WorkbenchButtonBar extends button_1.ButtonBar {
        constructor(container, _options, _contextMenuService, _keybindingService, telemetryService, _hoverService) {
            super(container);
            this._options = _options;
            this._contextMenuService = _contextMenuService;
            this._keybindingService = _keybindingService;
            this._hoverService = _hoverService;
            this._store = new lifecycle_1.DisposableStore();
            this._updateStore = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._actionRunner = this._store.add(new actions_1.ActionRunner());
            if (_options?.telemetrySource) {
                this._actionRunner.onDidRun(e => {
                    telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: _options.telemetrySource });
                }, undefined, this._store);
            }
        }
        dispose() {
            this._onDidChange.dispose();
            this._updateStore.dispose();
            this._store.dispose();
            super.dispose();
        }
        update(actions) {
            const conifgProvider = this._options?.buttonConfigProvider ?? (() => ({ showLabel: true }));
            this._updateStore.clear();
            this.clear();
            // Support instamt hover between buttons
            const hoverDelegate = this._updateStore.add((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            for (let i = 0; i < actions.length; i++) {
                const secondary = i > 0;
                const actionOrSubmenu = actions[i];
                let action;
                let btn;
                if (actionOrSubmenu instanceof actions_1.SubmenuAction && actionOrSubmenu.actions.length > 0) {
                    const [first, ...rest] = actionOrSubmenu.actions;
                    action = first;
                    btn = this.addButtonWithDropdown({
                        secondary: conifgProvider(action)?.isSecondary ?? secondary,
                        actionRunner: this._actionRunner,
                        actions: rest,
                        contextMenuProvider: this._contextMenuService,
                        ariaLabel: action.label
                    });
                }
                else {
                    action = actionOrSubmenu;
                    btn = this.addButton({
                        secondary: conifgProvider(action)?.isSecondary ?? secondary,
                        ariaLabel: action.label
                    });
                }
                btn.enabled = action.enabled;
                btn.element.classList.add('default-colors');
                if (conifgProvider(action)?.showLabel ?? true) {
                    btn.label = action.label;
                }
                else {
                    btn.element.classList.add('monaco-text-button');
                }
                if (conifgProvider(action)?.showIcon) {
                    if (action instanceof actions_2.MenuItemAction && themables_1.ThemeIcon.isThemeIcon(action.item.icon)) {
                        btn.icon = action.item.icon;
                    }
                    else if (action.class) {
                        btn.element.classList.add(...action.class.split(' '));
                    }
                }
                const kb = this._keybindingService.lookupKeybinding(action.id);
                let tooltip;
                if (kb) {
                    tooltip = (0, nls_1.localize)('labelWithKeybinding', "{0} ({1})", action.label, kb.getLabel());
                }
                else {
                    tooltip = action.label;
                }
                this._updateStore.add(this._hoverService.setupUpdatableHover(hoverDelegate, btn.element, tooltip));
                this._updateStore.add(btn.onDidClick(async () => {
                    this._actionRunner.run(action);
                }));
            }
            this._onDidChange.fire(this);
        }
    };
    exports.WorkbenchButtonBar = WorkbenchButtonBar;
    exports.WorkbenchButtonBar = WorkbenchButtonBar = __decorate([
        __param(2, contextView_1.IContextMenuService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, hover_1.IHoverService)
    ], WorkbenchButtonBar);
    let MenuWorkbenchButtonBar = class MenuWorkbenchButtonBar extends WorkbenchButtonBar {
        constructor(container, menuId, options, menuService, contextKeyService, contextMenuService, keybindingService, telemetryService, hoverService) {
            super(container, options, contextMenuService, keybindingService, telemetryService, hoverService);
            const menu = menuService.createMenu(menuId, contextKeyService);
            this._store.add(menu);
            const update = () => {
                this.clear();
                const actions = menu
                    .getActions({ renderShortTitle: true })
                    .flatMap(entry => entry[1]);
                super.update(actions);
            };
            this._store.add(menu.onDidChange(update));
            update();
        }
        dispose() {
            super.dispose();
        }
        update(_actions) {
            throw new Error('Use Menu or WorkbenchButtonBar');
        }
    };
    exports.MenuWorkbenchButtonBar = MenuWorkbenchButtonBar;
    exports.MenuWorkbenchButtonBar = MenuWorkbenchButtonBar = __decorate([
        __param(3, actions_2.IMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, hover_1.IHoverService)
    ], MenuWorkbenchButtonBar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnV0dG9uYmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYWN0aW9ucy9icm93c2VyL2J1dHRvbmJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQnpGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsa0JBQVM7UUFVaEQsWUFDQyxTQUFzQixFQUNMLFFBQWdELEVBQzVDLG1CQUF5RCxFQUMxRCxrQkFBdUQsRUFDeEQsZ0JBQW1DLEVBQ3ZDLGFBQTZDO1lBRTVELEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQU5BLGFBQVEsR0FBUixRQUFRLENBQXdDO1lBQzNCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDekMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUUzQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQWQxQyxXQUFNLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDL0IsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUd2QyxpQkFBWSxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDM0MsZ0JBQVcsR0FBZ0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFhM0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHNCQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELElBQUksUUFBUSxFQUFFLGVBQWUsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDL0IsZ0JBQWdCLENBQUMsVUFBVSxDQUMxQix5QkFBeUIsRUFDekIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxlQUFnQixFQUFFLENBQ3BELENBQUM7Z0JBQ0gsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7UUFFUSxPQUFPO1lBQ2YsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxNQUFNLENBQUMsT0FBa0I7WUFFeEIsTUFBTSxjQUFjLEdBQTBCLElBQUksQ0FBQyxRQUFRLEVBQUUsb0JBQW9CLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVuSCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUViLHdDQUF3QztZQUN4QyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFBLGlEQUEwQixHQUFFLENBQUMsQ0FBQztZQUUxRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUV6QyxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QixNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLElBQUksTUFBZSxDQUFDO2dCQUNwQixJQUFJLEdBQVksQ0FBQztnQkFFakIsSUFBSSxlQUFlLFlBQVksdUJBQWEsSUFBSSxlQUFlLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDcEYsTUFBTSxDQUFDLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUM7b0JBQ2pELE1BQU0sR0FBbUIsS0FBSyxDQUFDO29CQUMvQixHQUFHLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDO3dCQUNoQyxTQUFTLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFdBQVcsSUFBSSxTQUFTO3dCQUMzRCxZQUFZLEVBQUUsSUFBSSxDQUFDLGFBQWE7d0JBQ2hDLE9BQU8sRUFBRSxJQUFJO3dCQUNiLG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUI7d0JBQzdDLFNBQVMsRUFBRSxNQUFNLENBQUMsS0FBSztxQkFDdkIsQ0FBQyxDQUFDO2dCQUNKLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLEdBQUcsZUFBZSxDQUFDO29CQUN6QixHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQzt3QkFDcEIsU0FBUyxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsRUFBRSxXQUFXLElBQUksU0FBUzt3QkFDM0QsU0FBUyxFQUFFLE1BQU0sQ0FBQyxLQUFLO3FCQUN2QixDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFFRCxHQUFHLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7Z0JBQzdCLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsRUFBRSxTQUFTLElBQUksSUFBSSxFQUFFLENBQUM7b0JBQy9DLEdBQUcsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDMUIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUNqRCxDQUFDO2dCQUNELElBQUksY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDO29CQUN0QyxJQUFJLE1BQU0sWUFBWSx3QkFBYyxJQUFJLHFCQUFTLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDakYsR0FBRyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztvQkFDN0IsQ0FBQzt5QkFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDekIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDdkQsQ0FBQztnQkFDRixDQUFDO2dCQUNELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQy9ELElBQUksT0FBZSxDQUFDO2dCQUNwQixJQUFJLEVBQUUsRUFBRSxDQUFDO29CQUNSLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDckYsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUN4QixDQUFDO2dCQUNELElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDbkcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtvQkFDL0MsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1lBQ0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsQ0FBQztLQUNELENBQUE7SUFyR1ksZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUFhNUIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxxQkFBYSxDQUFBO09BaEJILGtCQUFrQixDQXFHOUI7SUFFTSxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLGtCQUFrQjtRQUU3RCxZQUNDLFNBQXNCLEVBQ3RCLE1BQWMsRUFDZCxPQUErQyxFQUNqQyxXQUF5QixFQUNuQixpQkFBcUMsRUFDcEMsa0JBQXVDLEVBQ3hDLGlCQUFxQyxFQUN0QyxnQkFBbUMsRUFDdkMsWUFBMkI7WUFFMUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFakcsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV0QixNQUFNLE1BQU0sR0FBRyxHQUFHLEVBQUU7Z0JBRW5CLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFYixNQUFNLE9BQU8sR0FBRyxJQUFJO3FCQUNsQixVQUFVLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsQ0FBQztxQkFDdEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTdCLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFdkIsQ0FBQyxDQUFDO1lBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sRUFBRSxDQUFDO1FBQ1YsQ0FBQztRQUVRLE9BQU87WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVRLE1BQU0sQ0FBQyxRQUFtQjtZQUNsQyxNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7UUFDbkQsQ0FBQztLQUNELENBQUE7SUF4Q1ksd0RBQXNCO3FDQUF0QixzQkFBc0I7UUFNaEMsV0FBQSxzQkFBWSxDQUFBO1FBQ1osV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLHFCQUFhLENBQUE7T0FYSCxzQkFBc0IsQ0F3Q2xDIn0=