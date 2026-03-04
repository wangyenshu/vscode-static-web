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
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/contextkeys", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/actions", "vs/workbench/browser/parts/auxiliarybar/auxiliaryBarActions", "vs/base/common/types", "vs/workbench/browser/actions/layoutActions", "vs/platform/commands/common/commands", "vs/workbench/browser/parts/paneCompositePart", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/browser/dom", "vs/platform/actions/browser/toolbar", "vs/base/browser/ui/actionbar/actionViewItems", "vs/workbench/browser/actions", "vs/platform/hover/browser/hover", "vs/css!./media/auxiliaryBarPart"], function (require, exports, nls_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, storage_1, colorRegistry_1, themeService_1, contextkeys_1, theme_1, views_1, extensions_1, layoutService_1, actions_1, auxiliaryBarActions_1, types_1, layoutActions_1, commands_1, paneCompositePart_1, actionbar_1, actions_2, configuration_1, menuEntryActionViewItem_1, dom_1, toolbar_1, actionViewItems_1, actions_3, hover_1) {
    "use strict";
    var AuxiliaryBarPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuxiliaryBarPart = void 0;
    let AuxiliaryBarPart = class AuxiliaryBarPart extends paneCompositePart_1.AbstractPaneCompositePart {
        static { AuxiliaryBarPart_1 = this; }
        static { this.activePanelSettingsKey = 'workbench.auxiliarybar.activepanelid'; }
        static { this.pinnedPanelsKey = 'workbench.auxiliarybar.pinnedPanels'; }
        static { this.placeholdeViewContainersKey = 'workbench.auxiliarybar.placeholderPanels'; }
        static { this.viewContainersWorkspaceStateKey = 'workbench.auxiliarybar.viewContainersWorkspaceState'; }
        get preferredHeight() {
            // Don't worry about titlebar or statusbar visibility
            // The difference is minimal and keeps this function clean
            return this.layoutService.mainContainerDimension.height * 0.4;
        }
        get preferredWidth() {
            const activeComposite = this.getActivePaneComposite();
            if (!activeComposite) {
                return;
            }
            const width = activeComposite.getOptimalWidth();
            if (typeof width !== 'number') {
                return;
            }
            return Math.max(width, 300);
        }
        constructor(notificationService, storageService, contextMenuService, layoutService, keybindingService, hoverService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, commandService, menuService, configurationService) {
            super("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */, {
                hasTitle: true,
                borderWidth: () => (this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder)) ? 1 : 0,
            }, AuxiliaryBarPart_1.activePanelSettingsKey, contextkeys_1.ActiveAuxiliaryContext.bindTo(contextKeyService), contextkeys_1.AuxiliaryBarFocusContext.bindTo(contextKeyService), 'auxiliarybar', 'auxiliarybar', undefined, notificationService, storageService, contextMenuService, layoutService, keybindingService, hoverService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, menuService);
            this.commandService = commandService;
            this.configurationService = configurationService;
            // Use the side bar dimensions
            this.minimumWidth = 170;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 0;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            this.priority = 1 /* LayoutPriority.Low */;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */)) {
                    this.onDidChangeActivityBarLocation();
                }
            }));
        }
        onDidChangeActivityBarLocation() {
            this.updateCompositeBar();
            const id = this.getActiveComposite()?.getId();
            if (id) {
                this.onTitleAreaUpdate(id);
            }
        }
        updateStyles() {
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            container.style.backgroundColor = this.getColor(theme_1.SIDE_BAR_BACKGROUND) || '';
            const borderColor = this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            const isPositionLeft = this.layoutService.getSideBarPosition() === 1 /* Position.RIGHT */;
            container.style.color = this.getColor(theme_1.SIDE_BAR_FOREGROUND) || '';
            container.style.borderLeftColor = borderColor ?? '';
            container.style.borderRightColor = borderColor ?? '';
            container.style.borderLeftStyle = borderColor && !isPositionLeft ? 'solid' : 'none';
            container.style.borderRightStyle = borderColor && isPositionLeft ? 'solid' : 'none';
            container.style.borderLeftWidth = borderColor && !isPositionLeft ? '1px' : '0px';
            container.style.borderRightWidth = borderColor && isPositionLeft ? '1px' : '0px';
        }
        getCompositeBarOptions() {
            const $this = this;
            return {
                partContainerClass: 'auxiliarybar',
                pinnedViewContainersKey: AuxiliaryBarPart_1.pinnedPanelsKey,
                placeholderViewContainersKey: AuxiliaryBarPart_1.placeholdeViewContainersKey,
                viewContainersWorkspaceStateKey: AuxiliaryBarPart_1.viewContainersWorkspaceStateKey,
                icon: true,
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                recomputeSizes: true,
                activityHoverOptions: {
                    position: () => this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.BOTTOM ? 3 /* HoverPosition.ABOVE */ : 2 /* HoverPosition.BELOW */,
                },
                fillExtraContextMenuActions: actions => this.fillExtraContextMenuActions(actions),
                compositeSize: 0,
                iconSize: 16,
                // Add 10px spacing if the overflow action is visible to no confuse the user with ... between the toolbars
                get overflowActionSize() { return $this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TITLE ? 40 : 30; },
                colors: theme => ({
                    activeBackgroundColor: theme.getColor(theme_1.SIDE_BAR_BACKGROUND),
                    inactiveBackgroundColor: theme.getColor(theme_1.SIDE_BAR_BACKGROUND),
                    get activeBorderBottomColor() { return $this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TITLE ? theme.getColor(theme_1.PANEL_ACTIVE_TITLE_BORDER) : theme.getColor(theme_1.ACTIVITY_BAR_TOP_ACTIVE_BORDER); },
                    get activeForegroundColor() { return $this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TITLE ? theme.getColor(theme_1.PANEL_ACTIVE_TITLE_FOREGROUND) : theme.getColor(theme_1.ACTIVITY_BAR_TOP_FOREGROUND); },
                    get inactiveForegroundColor() { return $this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TITLE ? theme.getColor(theme_1.PANEL_INACTIVE_TITLE_FOREGROUND) : theme.getColor(theme_1.ACTIVITY_BAR_TOP_INACTIVE_FOREGROUND); },
                    badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                    badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                    get dragAndDropBorder() { return $this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TITLE ? theme.getColor(theme_1.PANEL_DRAG_AND_DROP_BORDER) : theme.getColor(theme_1.ACTIVITY_BAR_TOP_DRAG_AND_DROP_BORDER); }
                }),
                compact: true
            };
        }
        fillExtraContextMenuActions(actions) {
            const currentPositionRight = this.layoutService.getSideBarPosition() === 0 /* Position.LEFT */;
            const viewsSubmenuAction = this.getViewsSubmenuAction();
            if (viewsSubmenuAction) {
                actions.push(new actions_1.Separator());
                actions.push(viewsSubmenuAction);
            }
            const activityBarPositionMenu = this.menuService.createMenu(actions_2.MenuId.ActivityBarPositionMenu, this.contextKeyService);
            const positionActions = [];
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(activityBarPositionMenu, { shouldForwardArgs: true, renderShortTitle: true }, { primary: [], secondary: positionActions });
            activityBarPositionMenu.dispose();
            actions.push(...[
                new actions_1.Separator(),
                new actions_1.SubmenuAction('workbench.action.panel.position', (0, nls_1.localize)('activity bar position', "Activity Bar Position"), positionActions),
                (0, actions_1.toAction)({ id: layoutActions_1.ToggleSidebarPositionAction.ID, label: currentPositionRight ? (0, nls_1.localize)('move second side bar left', "Move Secondary Side Bar Left") : (0, nls_1.localize)('move second side bar right', "Move Secondary Side Bar Right"), run: () => this.commandService.executeCommand(layoutActions_1.ToggleSidebarPositionAction.ID) }),
                (0, actions_1.toAction)({ id: auxiliaryBarActions_1.ToggleAuxiliaryBarAction.ID, label: (0, nls_1.localize)('hide second side bar', "Hide Secondary Side Bar"), run: () => this.commandService.executeCommand(auxiliaryBarActions_1.ToggleAuxiliaryBarAction.ID) })
            ]);
        }
        shouldShowCompositeBar() {
            return this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */) !== "hidden" /* ActivityBarPosition.HIDDEN */;
        }
        // TODO@benibenj chache this
        getCompositeBarPosition() {
            const activityBarPosition = this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */);
            switch (activityBarPosition) {
                case "top" /* ActivityBarPosition.TOP */: return paneCompositePart_1.CompositeBarPosition.TOP;
                case "bottom" /* ActivityBarPosition.BOTTOM */: return paneCompositePart_1.CompositeBarPosition.BOTTOM;
                case "hidden" /* ActivityBarPosition.HIDDEN */: return paneCompositePart_1.CompositeBarPosition.TITLE;
                case "default" /* ActivityBarPosition.DEFAULT */: return paneCompositePart_1.CompositeBarPosition.TITLE;
                default: return paneCompositePart_1.CompositeBarPosition.TITLE;
            }
        }
        createHeaderArea() {
            const headerArea = super.createHeaderArea();
            const globalHeaderContainer = (0, dom_1.$)('.auxiliary-bar-global-header');
            // Add auxillary header action
            const menu = this.headerFooterCompositeBarDispoables.add(this.instantiationService.createInstance(actions_3.CompositeMenuActions, actions_2.MenuId.AuxiliaryBarHeader, undefined, undefined));
            const toolBar = this.headerFooterCompositeBarDispoables.add(this.instantiationService.createInstance(toolbar_1.WorkbenchToolBar, globalHeaderContainer, {
                actionViewItemProvider: (action, options) => this.headerActionViewItemProvider(action, options),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                hiddenItemStrategy: -1 /* HiddenItemStrategy.NoHide */,
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
            }));
            toolBar.setActions((0, actionbar_1.prepareActions)(menu.getPrimaryActions()));
            this.headerFooterCompositeBarDispoables.add(menu.onDidChange(() => toolBar.setActions((0, actionbar_1.prepareActions)(menu.getPrimaryActions()))));
            headerArea.appendChild(globalHeaderContainer);
            return headerArea;
        }
        getToolbarWidth() {
            if (this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TOP) {
                return 22;
            }
            return super.getToolbarWidth();
        }
        headerActionViewItemProvider(action, options) {
            if (action.id === auxiliaryBarActions_1.ToggleAuxiliaryBarAction.ID) {
                return this.instantiationService.createInstance(actionViewItems_1.ActionViewItem, undefined, action, options);
            }
            return undefined;
        }
        toJSON() {
            return {
                type: "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */
            };
        }
    };
    exports.AuxiliaryBarPart = AuxiliaryBarPart;
    exports.AuxiliaryBarPart = AuxiliaryBarPart = AuxiliaryBarPart_1 = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, storage_1.IStorageService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, hover_1.IHoverService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, views_1.IViewDescriptorService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, extensions_1.IExtensionService),
        __param(11, commands_1.ICommandService),
        __param(12, actions_2.IMenuService),
        __param(13, configuration_1.IConfigurationService)
    ], AuxiliaryBarPart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5QmFyUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2F1eGlsaWFyeWJhci9hdXhpbGlhcnlCYXJQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFvQ3pGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsNkNBQXlCOztpQkFFOUMsMkJBQXNCLEdBQUcsc0NBQXNDLEFBQXpDLENBQTBDO2lCQUNoRSxvQkFBZSxHQUFHLHFDQUFxQyxBQUF4QyxDQUF5QztpQkFDeEQsZ0NBQTJCLEdBQUcsMENBQTBDLEFBQTdDLENBQThDO2lCQUN6RSxvQ0FBK0IsR0FBRyxxREFBcUQsQUFBeEQsQ0FBeUQ7UUFReEcsSUFBSSxlQUFlO1lBQ2xCLHFEQUFxRDtZQUNyRCwwREFBMEQ7WUFDMUQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDL0QsQ0FBQztRQUVELElBQUksY0FBYztZQUNqQixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUV0RCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3RCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ2hELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQy9CLE9BQU87WUFDUixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBSUQsWUFDdUIsbUJBQXlDLEVBQzlDLGNBQStCLEVBQzNCLGtCQUF1QyxFQUNuQyxh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