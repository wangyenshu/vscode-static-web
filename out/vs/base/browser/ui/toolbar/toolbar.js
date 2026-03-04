/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./toolbar"], function (require, exports, actionbar_1, dropdownActionViewItem_1, actions_1, codicons_1, themables_1, event_1, lifecycle_1, nls, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleMenuAction = exports.ToolBar = void 0;
    /**
     * A widget that combines an action bar for primary actions and a dropdown for secondary actions.
     */
    class ToolBar extends lifecycle_1.Disposable {
        constructor(container, contextMenuProvider, options = { orientation: 0 /* ActionsOrientation.HORIZONTAL */ }) {
            super();
            this.submenuActionViewItems = [];
            this.hasSecondaryActions = false;
            this._onDidChangeDropdownVisibility = this._register(new event_1.EventMultiplexer());
            this.onDidChangeDropdownVisibility = this._onDidChangeDropdownVisibility.event;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            options.hoverDelegate = options.hoverDelegate ?? this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            this.options = options;
            this.lookupKeybindings = typeof this.options.getKeyBinding === 'function';
            this.toggleMenuAction = this._register(new ToggleMenuAction(() => this.toggleMenuActionViewItem?.show(), options.toggleMenuTitle));
            this.element = document.createElement('div');
            this.element.className = 'monaco-toolbar';
            container.appendChild(this.element);
            this.actionBar = this._register(new actionbar_1.ActionBar(this.element, {
                orientation: options.orientation,
                ariaLabel: options.ariaLabel,
                actionRunner: options.actionRunner,
                allowContextMenu: options.allowContextMenu,
                highlightToggledItems: options.highlightToggledItems,
                hoverDelegate: options.hoverDelegate,
                actionViewItemProvider: (action, viewItemOptions) => {
                    if (action.id === ToggleMenuAction.ID) {
                        this.toggleMenuActionViewItem = new dropdownActionViewItem_1.DropdownMenuActionViewItem(action, action.menuActions, contextMenuProvider, {
                            actionViewItemProvider: this.options.actionViewItemProvider,
                            actionRunner: this.actionRunner,
                            keybindingProvider: this.options.getKeyBinding,
                            classNames: themables_1.ThemeIcon.asClassNameArray(options.moreIcon ?? codicons_1.Codicon.toolBarMore),
                            anchorAlignmentProvider: this.options.anchorAlignmentProvider,
                            menuAsChild: !!this.options.renderDropdownAsChildElement,
                            skipTelemetry: this.options.skipTelemetry,
                            isMenu: true,
                            hoverDelegate: this.options.hoverDelegate
                        });
                        this.toggleMenuActionViewItem.setActionContext(this.actionBar.context);
                        this.disposables.add(this._onDidChangeDropdownVisibility.add(this.toggleMenuActionViewItem.onDidChangeVisibility));
                        return this.toggleMenuActionViewItem;
                    }
                    if (options.actionViewItemProvider) {
                        const result = options.actionViewItemProvider(action, viewItemOptions);
                        if (result) {
                            return result;
                        }
                    }
                    if (action instanceof actions_1.SubmenuAction) {
                        const result = new dropdownActionViewItem_1.DropdownMenuActionViewItem(action, action.actions, contextMenuProvider, {
                            actionViewItemProvider: this.options.actionViewItemProvider,
                            actionRunner: this.actionRunner,
                            keybindingProvider: this.options.getKeyBinding,
                            classNames: action.class,
                            anchorAlignmentProvider: this.options.anchorAlignmentProvider,
                            menuAsChild: !!this.options.renderDropdownAsChildElement,
                            skipTelemetry: this.options.skipTelemetry,
                            hoverDelegate: this.options.hoverDelegate
                        });
                        result.setActionContext(this.actionBar.context);
                        this.submenuActionViewItems.push(result);
                        this.disposables.add(this._onDidChangeDropdownVisibility.add(result.onDidChangeVisibility));
                        return result;
                    }
                    return undefined;
                }
            }));
        }
        set actionRunner(actionRunner) {
            this.actionBar.actionRunner = actionRunner;
        }
        get actionRunner() {
            return this.actionBar.actionRunner;
        }
        set context(context) {
            this.actionBar.context = context;
            this.toggleMenuActionViewItem?.setActionContext(context);
            for (const actionViewItem of this.submenuActionViewItems) {
                actionViewItem.setActionContext(context);
            }
        }
        getElement() {
            return this.element;
        }
        focus() {
            this.actionBar.focus();
        }
        getItemsWidth() {
            let itemsWidth = 0;
            for (let i = 0; i < this.actionBar.length(); i++) {
                itemsWidth += this.actionBar.getWidth(i);
            }
            return itemsWidth;
        }
        getItemAction(indexOrElement) {
            return this.actionBar.getAction(indexOrElement);
        }
        getItemWidth(index) {
            return this.actionBar.getWidth(index);
        }
        getItemsLength() {
            return this.actionBar.length();
        }
        setAriaLabel(label) {
            this.actionBar.setAriaLabel(label);
        }
        setActions(primaryActions, secondaryActions) {
            this.clear();
            const primaryActionsToSet = primaryActions ? primaryActions.slice(0) : [];
            // Inject additional action to open secondary actions if present
            this.hasSecondaryActions = !!(secondaryActions && secondaryActions.length > 0);
            if (this.hasSecondaryActions && secondaryActions) {
                this.toggleMenuAction.menuActions = secondaryActions.slice(0);
                primaryActionsToSet.push(this.toggleMenuAction);
            }
            primaryActionsToSet.forEach(action => {
                this.actionBar.push(action, { icon: true, label: false, keybinding: this.getKeybindingLabel(action) });
            });
        }
        isEmpty() {
            return this.actionBar.isEmpty();
        }
        getKeybindingLabel(action) {
            const key = this.lookupKeybindings ? this.options.getKeyBinding?.(action) : undefined;
            return key?.getLabel() ?? undefined;
        }
        clear() {
            this.submenuActionViewItems = [];
            this.disposables.clear();
            this.actionBar.clear();
        }
        dispose() {
            this.clear();
            this.disposables.dispose();
            super.dispose();
        }
    }
    exports.ToolBar = ToolBar;
    class ToggleMenuAction extends actions_1.Action {
        static { this.ID = 'toolbar.toggle.more'; }
        constructor(toggleDropdownMenu, title) {
            title = title || nls.localize('moreActions', "More Actions...");
            super(ToggleMenuAction.ID, title, undefined, true);
            this._menuActions = [];
            this.toggleDropdownMenu = toggleDropdownMenu;
        }
        async run() {
            this.toggleDropdownMenu();
        }
        get menuActions() {
            return this._menuActions;
        }
        set menuActions(actions) {
            this._menuActions = actions;
        }
    }
    exports.ToggleMenuAction = ToggleMenuAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbGJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS90b29sYmFyL3Rvb2xiYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUNoRzs7T0FFRztJQUNILE1BQWEsT0FBUSxTQUFRLHNCQUFVO1FBY3RDLFlBQVksU0FBc0IsRUFBRSxtQkFBeUMsRUFBRSxVQUEyQixFQUFFLFdBQVcsdUNBQStCLEVBQUU7WUFDdkosS0FBSyxFQUFFLENBQUM7WUFWRCwyQkFBc0IsR0FBaUMsRUFBRSxDQUFDO1lBQzFELHdCQUFtQixHQUFZLEtBQUssQ0FBQztZQUlyQyxtQ0FBOEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLEVBQVcsQ0FBQyxDQUFDO1lBQ2hGLGtDQUE2QixHQUFHLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxLQUFLLENBQUM7WUFDbEUsZ0JBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFLcEUsT0FBTyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSxpREFBMEIsR0FBRSxDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEtBQUssVUFBVSxDQUFDO1lBRTFFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLElBQUksRUFBRSxFQUFFLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FB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