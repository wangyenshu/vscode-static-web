var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actionWidget/browser/actionList", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/css!./actionWidget"], function (require, exports, dom, actionbar_1, lifecycle_1, nls_1, actionList_1, actions_1, contextkey_1, contextView_1, extensions_1, instantiation_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IActionWidgetService = void 0;
    (0, colorRegistry_1.registerColor)('actionBar.toggledBackground', { dark: colorRegistry_1.inputActiveOptionBackground, light: colorRegistry_1.inputActiveOptionBackground, hcDark: colorRegistry_1.inputActiveOptionBackground, hcLight: colorRegistry_1.inputActiveOptionBackground, }, (0, nls_1.localize)('actionBar.toggledBackground', 'Background color for toggled action items in action bar.'));
    const ActionWidgetContextKeys = {
        Visible: new contextkey_1.RawContextKey('codeActionMenuVisible', false, (0, nls_1.localize)('codeActionMenuVisible', "Whether the action widget list is visible"))
    };
    exports.IActionWidgetService = (0, instantiation_1.createDecorator)('actionWidgetService');
    let ActionWidgetService = class ActionWidgetService extends lifecycle_1.Disposable {
        get isVisible() {
            return ActionWidgetContextKeys.Visible.getValue(this._contextKeyService) || false;
        }
        constructor(_contextViewService, _contextKeyService, _instantiationService) {
            super();
            this._contextViewService = _contextViewService;
            this._contextKeyService = _contextKeyService;
            this._instantiationService = _instantiationService;
            this._list = this._register(new lifecycle_1.MutableDisposable());
        }
        show(user, supportsPreview, items, delegate, anchor, container, actionBarActions) {
            const visibleContext = ActionWidgetContextKeys.Visible.bindTo(this._contextKeyService);
            const list = this._instantiationService.createInstance(actionList_1.ActionList, user, supportsPreview, items, delegate);
            this._contextViewService.showContextView({
                getAnchor: () => anchor,
                render: (container) => {
                    visibleContext.set(true);
                    return this._renderWidget(container, list, actionBarActions ?? []);
                },
                onHide: (didCancel) => {
                    visibleContext.reset();
                    this._onWidgetClosed(didCancel);
                },
            }, container, false);
        }
        acceptSelected(preview) {
            this._list.value?.acceptSelected(preview);
        }
        focusPrevious() {
            this._list?.value?.focusPrevious();
        }
        focusNext() {
            this._list?.value?.focusNext();
        }
        hide(didCancel) {
            this._list.value?.hide(didCancel);
            this._list.clear();
        }
        clear() {
            this._list.clear();
        }
        _renderWidget(element, list, actionBarActions) {
            const widget = document.createElement('div');
            widget.classList.add('action-widget');
            element.appendChild(widget);
            this._list.value = list;
            if (this._list.value) {
                widget.appendChild(this._list.value.domNode);
            }
            else {
                throw new Error('List has no value');
            }
            const renderDisposables = new lifecycle_1.DisposableStore();
            // Invisible div to block mouse interaction in the rest of the UI
            const menuBlock = document.createElement('div');
            const block = element.appendChild(menuBlock);
            block.classList.add('context-view-block');
            renderDisposables.add(dom.addDisposableListener(block, dom.EventType.MOUSE_DOWN, e => e.stopPropagation()));
            // Invisible div to block mouse interaction with the menu
            const pointerBlockDiv = document.createElement('div');
            const pointerBlock = element.appendChild(pointerBlockDiv);
            pointerBlock.classList.add('context-view-pointerBlock');
            // Removes block on click INSIDE widget or ANY mouse movement
            renderDisposables.add(dom.addDisposableListener(pointerBlock, dom.EventType.POINTER_MOVE, () => pointerBlock.remove()));
            renderDisposables.add(dom.addDisposableListener(pointerBlock, dom.EventType.MOUSE_DOWN, () => pointerBlock.remove()));
            // Action bar
            let actionBarWidth = 0;
            if (actionBarActions.length) {
                const actionBar = this._createActionBar('.action-widget-action-bar', actionBarActions);
                if (actionBar) {
                    widget.appendChild(actionBar.getContainer().parentElement);
                    renderDisposables.add(actionBar);
                    actionBarWidth = actionBar.getContainer().offsetWidth;
                }
            }
            const width = this._list.value?.layout(actionBarWidth);
            widget.style.width = `${width}px`;
            const focusTracker = renderDisposables.add(dom.trackFocus(element));
            renderDisposables.add(focusTracker.onDidBlur(() => this.hide(true)));
            return renderDisposables;
        }
        _createActionBar(className, actions) {
            if (!actions.length) {
                return undefined;
            }
            const container = dom.$(className);
            const actionBar = new actionbar_1.ActionBar(container);
            actionBar.push(actions, { icon: false, label: true });
            return actionBar;
        }
        _onWidgetClosed(didCancel) {
            this._list.value?.hide(didCancel);
        }
    };
    ActionWidgetService = __decorate([
        __param(0, contextView_1.IContextViewService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, instantiation_1.IInstantiationService)
    ], ActionWidgetService);
    (0, extensions_1.registerSingleton)(exports.IActionWidgetService, ActionWidgetService, 1 /* InstantiationType.Delayed */);
    const weight = 100 /* KeybindingWeight.EditorContrib */ + 1000;
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'hideCodeActionWidget',
                title: (0, nls_1.localize2)('hideCodeActionWidget.title', "Hide action widget"),
                precondition: ActionWidgetContextKeys.Visible,
                keybinding: {
                    weight,
                    primary: 9 /* KeyCode.Escape */,
                    secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
                },
            });
        }
        run(accessor) {
            accessor.get(exports.IActionWidgetService).hide(true);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'selectPrevCodeAction',
                title: (0, nls_1.localize2)('selectPrevCodeAction.title', "Select previous action"),
                precondition: ActionWidgetContextKeys.Visible,
                keybinding: {
                    weight,
                    primary: 16 /* KeyCode.UpArrow */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */],
                    mac: { primary: 16 /* KeyCode.UpArrow */, secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */, 256 /* KeyMod.WinCtrl */ | 46 /* KeyCode.KeyP */] },
                }
            });
        }
        run(accessor) {
            const widgetService = accessor.get(exports.IActionWidgetService);
            if (widgetService instanceof ActionWidgetService) {
                widgetService.focusPrevious();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'selectNextCodeAction',
                title: (0, nls_1.localize2)('selectNextCodeAction.title', "Select next action"),
                precondition: ActionWidgetContextKeys.Visible,
                keybinding: {
                    weight,
                    primary: 18 /* KeyCode.DownArrow */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */],
                    mac: { primary: 18 /* KeyCode.DownArrow */, secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */, 256 /* KeyMod.WinCtrl */ | 44 /* KeyCode.KeyN */] }
                }
            });
        }
        run(accessor) {
            const widgetService = accessor.get(exports.IActionWidgetService);
            if (widgetService instanceof ActionWidgetService) {
                widgetService.focusNext();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: actionList_1.acceptSelectedActionCommand,
                title: (0, nls_1.localize2)('acceptSelected.title', "Accept selected action"),
                precondition: ActionWidgetContextKeys.Visible,
                keybinding: {
                    weight,
                    primary: 3 /* KeyCode.Enter */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */],
                }
            });
        }
        run(accessor) {
            const widgetService = accessor.get(exports.IActionWidgetService);
            if (widgetService instanceof ActionWidgetService) {
                widgetService.acceptSelected();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: actionList_1.previewSelectedActionCommand,
                title: (0, nls_1.localize2)('previewSelected.title', "Preview selected action"),
                precondition: ActionWidgetContextKeys.Visible,
                keybinding: {
                    weight,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                }
            });
        }
        run(accessor) {
            const widgetService = accessor.get(exports.IActionWidgetService);
            if (widgetService instanceof ActionWidgetService) {
                widgetService.acceptSelected(true);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYWN0aW9uV2lkZ2V0L2Jyb3dzZXIvYWN0aW9uV2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFxQkEsSUFBQSw2QkFBYSxFQUNaLDZCQUE2QixFQUM3QixFQUFFLElBQUksRUFBRSwyQ0FBMkIsRUFBRSxLQUFLLEVBQUUsMkNBQTJCLEVBQUUsTUFBTSxFQUFFLDJDQUEyQixFQUFFLE9BQU8sRUFBRSwyQ0FBMkIsR0FBRyxFQUNySixJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSwwREFBMEQsQ0FBQyxDQUNuRyxDQUFDO0lBRUYsTUFBTSx1QkFBdUIsR0FBRztRQUMvQixPQUFPLEVBQUUsSUFBSSwwQkFBYSxDQUFVLHVCQUF1QixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO0tBQ25KLENBQUM7SUFFVyxRQUFBLG9CQUFvQixHQUFHLElBQUEsK0JBQWUsRUFBdUIscUJBQXFCLENBQUMsQ0FBQztJQVlqRyxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBRzNDLElBQUksU0FBUztZQUNaLE9BQU8sdUJBQXVCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxLQUFLLENBQUM7UUFDbkYsQ0FBQztRQUlELFlBQ3NCLG1CQUF5RCxFQUMxRCxrQkFBdUQsRUFDcEQscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBSjhCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDekMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUNuQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBTHBFLFVBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQXVCLENBQUMsQ0FBQztRQVF0RixDQUFDO1FBRUQsSUFBSSxDQUFJLElBQVksRUFBRSxlQUF3QixFQUFFLEtBQW9DLEVBQUUsUUFBZ0MsRUFBRSxNQUFlLEVBQUUsU0FBa0MsRUFBRSxnQkFBcUM7WUFDak4sTUFBTSxjQUFjLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUV2RixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLHVCQUFVLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0csSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsQ0FBQztnQkFDeEMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU07Z0JBQ3ZCLE1BQU0sRUFBRSxDQUFDLFNBQXNCLEVBQUUsRUFBRTtvQkFDbEMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDekIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3BFLENBQUM7Z0JBQ0QsTUFBTSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUU7b0JBQ3JCLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDdkIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDakMsQ0FBQzthQUNELEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3RCLENBQUM7UUFFRCxjQUFjLENBQUMsT0FBaUI7WUFDL0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCxhQUFhO1lBQ1osSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUVELFNBQVM7WUFDUixJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRUQsSUFBSSxDQUFDLFNBQW1CO1lBQ3ZCLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNwQixDQUFDO1FBRU8sYUFBYSxDQUFDLE9BQW9CLEVBQUUsSUFBeUIsRUFBRSxnQkFBb0M7WUFDMUcsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUN0QyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTVCLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBQ0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUVoRCxpRUFBaUU7WUFDakUsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDMUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTVHLHlEQUF5RDtZQUN6RCxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDMUQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUV4RCw2REFBNkQ7WUFDN0QsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4SCxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRILGFBQWE7WUFDYixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLDJCQUEyQixFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3ZGLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsYUFBYyxDQUFDLENBQUM7b0JBQzVELGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDakMsY0FBYyxHQUFHLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxXQUFXLENBQUM7Z0JBQ3ZELENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsS0FBSyxJQUFJLENBQUM7WUFFbEMsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNwRSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVyRSxPQUFPLGlCQUFpQixDQUFDO1FBQzFCLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxTQUFpQixFQUFFLE9BQTJCO1lBQ3RFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMzQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDdEQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLGVBQWUsQ0FBQyxTQUFtQjtZQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkMsQ0FBQztLQUNELENBQUE7SUFySEssbUJBQW1CO1FBVXRCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHFDQUFxQixDQUFBO09BWmxCLG1CQUFtQixDQXFIeEI7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDRCQUFvQixFQUFFLG1CQUFtQixvQ0FBNEIsQ0FBQztJQUV4RixNQUFNLE1BQU0sR0FBRywyQ0FBaUMsSUFBSSxDQUFDO0lBRXJELElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFDcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHNCQUFzQjtnQkFDMUIsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDRCQUE0QixFQUFFLG9CQUFvQixDQUFDO2dCQUNwRSxZQUFZLEVBQUUsdUJBQXVCLENBQUMsT0FBTztnQkFDN0MsVUFBVSxFQUFFO29CQUNYLE1BQU07b0JBQ04sT0FBTyx3QkFBZ0I7b0JBQ3ZCLFNBQVMsRUFBRSxDQUFDLGdEQUE2QixDQUFDO2lCQUMxQzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBMEI7WUFDN0IsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBb0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsc0JBQXNCO2dCQUMxQixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsNEJBQTRCLEVBQUUsd0JBQXdCLENBQUM7Z0JBQ3hFLFlBQVksRUFBRSx1QkFBdUIsQ0FBQyxPQUFPO2dCQUM3QyxVQUFVLEVBQUU7b0JBQ1gsTUFBTTtvQkFDTixPQUFPLDBCQUFpQjtvQkFDeEIsU0FBUyxFQUFFLENBQUMsb0RBQWdDLENBQUM7b0JBQzdDLEdBQUcsRUFBRSxFQUFFLE9BQU8sMEJBQWlCLEVBQUUsU0FBUyxFQUFFLENBQUMsb0RBQWdDLEVBQUUsZ0RBQTZCLENBQUMsRUFBRTtpQkFDL0c7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCO1lBQzdCLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQW9CLENBQUMsQ0FBQztZQUN6RCxJQUFJLGFBQWEsWUFBWSxtQkFBbUIsRUFBRSxDQUFDO2dCQUNsRCxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDL0IsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxzQkFBc0I7Z0JBQzFCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyw0QkFBNEIsRUFBRSxvQkFBb0IsQ0FBQztnQkFDcEUsWUFBWSxFQUFFLHVCQUF1QixDQUFDLE9BQU87Z0JBQzdDLFVBQVUsRUFBRTtvQkFDWCxNQUFNO29CQUNOLE9BQU8sNEJBQW1CO29CQUMxQixTQUFTLEVBQUUsQ0FBQyxzREFBa0MsQ0FBQztvQkFDL0MsR0FBRyxFQUFFLEVBQUUsT0FBTyw0QkFBbUIsRUFBRSxTQUFTLEVBQUUsQ0FBQyxzREFBa0MsRUFBRSxnREFBNkIsQ0FBQyxFQUFFO2lCQUNuSDthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBMEI7WUFDN0IsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBb0IsQ0FBQyxDQUFDO1lBQ3pELElBQUksYUFBYSxZQUFZLG1CQUFtQixFQUFFLENBQUM7Z0JBQ2xELGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFDcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHdDQUEyQjtnQkFDL0IsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLHNCQUFzQixFQUFFLHdCQUF3QixDQUFDO2dCQUNsRSxZQUFZLEVBQUUsdUJBQXVCLENBQUMsT0FBTztnQkFDN0MsVUFBVSxFQUFFO29CQUNYLE1BQU07b0JBQ04sT0FBTyx1QkFBZTtvQkFDdEIsU0FBUyxFQUFFLENBQUMsbURBQStCLENBQUM7aUJBQzVDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDRCQUFvQixDQUFDLENBQUM7WUFDekQsSUFBSSxhQUFhLFlBQVksbUJBQW1CLEVBQUUsQ0FBQztnQkFDbEQsYUFBYSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ2hDLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUseUNBQTRCO2dCQUNoQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsdUJBQXVCLEVBQUUseUJBQXlCLENBQUM7Z0JBQ3BFLFlBQVksRUFBRSx1QkFBdUIsQ0FBQyxPQUFPO2dCQUM3QyxVQUFVLEVBQUU7b0JBQ1gsTUFBTTtvQkFDTixPQUFPLEVBQUUsaURBQThCO2lCQUN2QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBMEI7WUFDN0IsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBb0IsQ0FBQyxDQUFDO1lBQ3pELElBQUksYUFBYSxZQUFZLG1CQUFtQixFQUFFLENBQUM7Z0JBQ2xELGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUMifQ==