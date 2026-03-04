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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/hover/browser/hover"], function (require, exports, dom_1, actionViewItems_1, hoverDelegateFactory_1, iconLabels_1, actions_1, codicons_1, event_1, lifecycle_1, nls_1, menuEntryActionViewItem_1, toolbar_1, actions_2, instantiation_1, keybinding_1, quickInput_1, editorGroupsService_1, hover_1) {
    "use strict";
    var CommandCenterCenterViewItem_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandCenterControl = void 0;
    let CommandCenterControl = class CommandCenterControl {
        constructor(windowTitle, hoverDelegate, instantiationService, quickInputService) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChangeVisibility = new event_1.Emitter();
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this.element = document.createElement('div');
            this.element.classList.add('command-center');
            const titleToolbar = instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, this.element, actions_2.MenuId.CommandCenter, {
                contextMenu: actions_2.MenuId.TitleBarContext,
                hiddenItemStrategy: -1 /* HiddenItemStrategy.NoHide */,
                toolbarOptions: {
                    primaryGroup: () => true,
                },
                telemetrySource: 'commandCenter',
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_2.SubmenuItemAction && action.item.submenu === actions_2.MenuId.CommandCenterCenter) {
                        return instantiationService.createInstance(CommandCenterCenterViewItem, action, windowTitle, { ...options, hoverDelegate });
                    }
                    else {
                        return (0, menuEntryActionViewItem_1.createActionViewItem)(instantiationService, action, { ...options, hoverDelegate });
                    }
                }
            });
            this._disposables.add(event_1.Event.filter(quickInputService.onShow, () => (0, dom_1.isActiveDocument)(this.element), this._disposables)(this._setVisibility.bind(this, false)));
            this._disposables.add(event_1.Event.filter(quickInputService.onHide, () => (0, dom_1.isActiveDocument)(this.element), this._disposables)(this._setVisibility.bind(this, true)));
            this._disposables.add(titleToolbar);
        }
        _setVisibility(show) {
            this.element.classList.toggle('hide', !show);
            this._onDidChangeVisibility.fire();
        }
        dispose() {
            this._disposables.dispose();
        }
    };
    exports.CommandCenterControl = CommandCenterControl;
    exports.CommandCenterControl = CommandCenterControl = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, quickInput_1.IQuickInputService)
    ], CommandCenterControl);
    let CommandCenterCenterViewItem = class CommandCenterCenterViewItem extends actionViewItems_1.BaseActionViewItem {
        static { CommandCenterCenterViewItem_1 = this; }
        static { this._quickOpenCommandId = 'workbench.action.quickOpenWithModes'; }
        constructor(_submenu, _windowTitle, options, _hoverService, _keybindingService, _instaService, _editorGroupService) {
            super(undefined, _submenu.actions.find(action => action.id === 'workbench.action.quickOpenWithModes') ?? _submenu.actions[0], options);
            this._submenu = _submenu;
            this._windowTitle = _windowTitle;
            this._hoverService = _hoverService;
            this._keybindingService = _keybindingService;
            this._instaService = _instaService;
            this._editorGroupService = _editorGroupService;
            this._hoverDelegate = options.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse');
        }
        render(container) {
            super.render(container);
            container.classList.add('command-center-center');
            container.classList.toggle('multiple', (this._submenu.actions.length > 1));
            const hover = this._store.add(this._hoverService.setupUpdatableHover(this._hoverDelegate, container, this.getTooltip()));
            // update label & tooltip when window title changes
            this._store.add(this._windowTitle.onDidChange(() => {
                hover.update(this.getTooltip());
            }));
            const groups = [];
            for (const action of this._submenu.actions) {
                if (action instanceof actions_1.SubmenuAction) {
                    groups.push(action.actions);
                }
                else {
                    groups.push([action]);
                }
            }
            for (let i = 0; i < groups.length; i++) {
                const group = groups[i];
                // nested toolbar
                const toolbar = this._instaService.createInstance(toolbar_1.WorkbenchToolBar, container, {
                    hiddenItemStrategy: -1 /* HiddenItemStrategy.NoHide */,
                    telemetrySource: 'commandCenterCenter',
                    actionViewItemProvider: (action, options) => {
                        options = {
                            ...options,
                            hoverDelegate: this._hoverDelegate,
                        };
                        if (action.id !== CommandCenterCenterViewItem_1._quickOpenCommandId) {
                            return (0, menuEntryActionViewItem_1.createActionViewItem)(this._instaService, action, options);
                        }
                        const that = this;
                        return this._instaService.createInstance(class CommandCenterQuickPickItem extends actionViewItems_1.BaseActionViewItem {
                            constructor() {
                                super(undefined, action, options);
                            }
                            render(container) {
                                super.render(container);
                                container.classList.toggle('command-center-quick-pick');
                                const action = this.action;
                                // icon (search)
                                const searchIcon = document.createElement('span');
                                searchIcon.ariaHidden = 'true';
                                searchIcon.className = action.class ?? '';
                                searchIcon.classList.add('search-icon');
                                // label: just workspace name and optional decorations
                                const label = this._getLabel();
                                const labelElement = document.createElement('span');
                                labelElement.classList.add('search-label');
                                labelElement.innerText = label;
                                (0, dom_1.reset)(container, searchIcon, labelElement);
                                const hover = this._store.add(that._hoverService.setupUpdatableHover(that._hoverDelegate, container, this.getTooltip()));
                                // update label & tooltip when window title changes
                                this._store.add(that._windowTitle.onDidChange(() => {
                                    hover.update(this.getTooltip());
                                    labelElement.innerText = this._getLabel();
                                }));
                                // update label & tooltip when tabs visibility changes
                                this._store.add(that._editorGroupService.onDidChangeEditorPartOptions(({ newPartOptions, oldPartOptions }) => {
                                    if (newPartOptions.showTabs !== oldPartOptions.showTabs) {
                                        hover.update(this.getTooltip());
                                        labelElement.innerText = this._getLabel();
                                    }
                                }));
                            }
                            getTooltip() {
                                return that.getTooltip();
                            }
                            _getLabel() {
                                const { prefix, suffix } = that._windowTitle.getTitleDecorations();
                                let label = that._windowTitle.workspaceName;
                                if (that._windowTitle.isCustomTitleFormat()) {
                                    label = that._windowTitle.getWindowTitle();
                                }
                                else if (that._editorGroupService.partOptions.showTabs === 'none') {
                                    label = that._windowTitle.fileName ?? label;
                                }
                                if (!label) {
                                    label = (0, nls_1.localize)('label.dfl', "Search");
                                }
                                if (prefix) {
                                    label = (0, nls_1.localize)('label1', "{0} {1}", prefix, label);
                                }
                                if (suffix) {
                                    label = (0, nls_1.localize)('label2', "{0} {1}", label, suffix);
                                }
                                return label.replaceAll(/\r\n|\r|\n/g, '\u23CE');
                            }
                        });
                    }
                });
                toolbar.setActions(group);
                this._store.add(toolbar);
                // spacer
                if (i < groups.length - 1) {
                    const icon = (0, iconLabels_1.renderIcon)(codicons_1.Codicon.circleSmallFilled);
                    icon.style.padding = '0 12px';
                    icon.style.height = '100%';
                    icon.style.opacity = '0.5';
                    container.appendChild(icon);
                }
            }
        }
        getTooltip() {
            // tooltip: full windowTitle
            const kb = this._keybindingService.lookupKeybinding(this.action.id)?.getLabel();
            const title = kb
                ? (0, nls_1.localize)('title', "Search {0} ({1}) \u2014 {2}", this._windowTitle.workspaceName, kb, this._windowTitle.value)
                : (0, nls_1.localize)('title2', "Search {0} \u2014 {1}", this._windowTitle.workspaceName, this._windowTitle.value);
            return title;
        }
    };
    CommandCenterCenterViewItem = CommandCenterCenterViewItem_1 = __decorate([
        __param(3, hover_1.IHoverService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, editorGroupsService_1.IEditorGroupsService)
    ], CommandCenterCenterViewItem);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandCenter, {
        submenu: actions_2.MenuId.CommandCenterCenter,
        title: (0, nls_1.localize)('title3', "Command Center"),
        icon: codicons_1.Codicon.shield,
        order: 101,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZENlbnRlckNvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy90aXRsZWJhci9jb21tYW5kQ2VudGVyQ29udHJvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0J6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFvQjtRQVNoQyxZQUNDLFdBQXdCLEVBQ3hCLGFBQTZCLEVBQ04sb0JBQTJDLEVBQzlDLGlCQUFxQztZQVh6QyxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRXJDLDJCQUFzQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDckQsMEJBQXFCLEdBQWdCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7WUFFdkUsWUFBTyxHQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBUTdELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRTdDLE1BQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw4QkFBb0IsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLGdCQUFNLENBQUMsYUFBYSxFQUFFO2dCQUNsSCxXQUFXLEVBQUUsZ0JBQU0sQ0FBQyxlQUFlO2dCQUNuQyxrQkFBa0Isb0NBQTJCO2dCQUM3QyxjQUFjLEVBQUU7b0JBQ2YsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUk7aUJBQ3hCO2dCQUNELGVBQWUsRUFBRSxlQUFlO2dCQUNoQyxzQkFBc0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRTtvQkFDM0MsSUFBSSxNQUFNLFlBQVksMkJBQWlCLElBQUksTUFBTSxD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