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
define(["require", "exports", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/common/contextkeys", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/extensions/common/extensions", "vs/base/common/types", "vs/workbench/common/views", "vs/workbench/browser/parts/paneCompositePart", "vs/workbench/browser/parts/activitybar/activitybarPart", "vs/platform/configuration/common/configuration", "vs/platform/actions/common/actions", "vs/base/common/actions", "vs/workbench/browser/actions/layoutActions", "vs/nls", "vs/platform/hover/browser/hover", "vs/css!./media/sidebarpart", "vs/workbench/browser/parts/sidebar/sidebarActions"], function (require, exports, layoutService_1, contextkeys_1, storage_1, contextView_1, keybinding_1, instantiation_1, themeService_1, colorRegistry_1, theme_1, notification_1, contextkey_1, extensions_1, types_1, views_1, paneCompositePart_1, activitybarPart_1, configuration_1, actions_1, actions_2, layoutActions_1, nls_1, hover_1) {
    "use strict";
    var SidebarPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SidebarPart = void 0;
    let SidebarPart = class SidebarPart extends paneCompositePart_1.AbstractPaneCompositePart {
        static { SidebarPart_1 = this; }
        static { this.activeViewletSettingsKey = 'workbench.sidebar.activeviewletid'; }
        get snap() { return true; }
        get preferredWidth() {
            const viewlet = this.getActivePaneComposite();
            if (!viewlet) {
                return;
            }
            const width = viewlet.getOptimalWidth();
            if (typeof width !== 'number') {
                return;
            }
            return Math.max(width, 300);
        }
        //#endregion
        constructor(notificationService, storageService, contextMenuService, layoutService, keybindingService, hoverService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, configurationService, menuService) {
            super("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */, { hasTitle: true, borderWidth: () => (this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder)) ? 1 : 0 }, SidebarPart_1.activeViewletSettingsKey, contextkeys_1.ActiveViewletContext.bindTo(contextKeyService), contextkeys_1.SidebarFocusContext.bindTo(contextKeyService), 'sideBar', 'viewlet', theme_1.SIDE_BAR_TITLE_FOREGROUND, notificationService, storageService, contextMenuService, layoutService, keybindingService, hoverService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, menuService);
            this.configurationService = configurationService;
            //#region IView
            this.minimumWidth = 170;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 0;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            this.priority = 1 /* LayoutPriority.Low */;
            this.acitivityBarPart = this._register(instantiationService.createInstance(activitybarPart_1.ActivitybarPart, this));
            this.rememberActivityBarVisiblePosition();
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */)) {
                    this.onDidChangeActivityBarLocation();
                }
            }));
            this.registerActions();
        }
        onDidChangeActivityBarLocation() {
            this.acitivityBarPart.hide();
            this.updateCompositeBar();
            const id = this.getActiveComposite()?.getId();
            if (id) {
                this.onTitleAreaUpdate(id);
            }
            if (this.shouldShowActivityBar()) {
                this.acitivityBarPart.show();
            }
            this.rememberActivityBarVisiblePosition();
        }
        updateStyles() {
            super.updateStyles();
            // Part container
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            container.style.backgroundColor = this.getColor(theme_1.SIDE_BAR_BACKGROUND) || '';
            container.style.color = this.getColor(theme_1.SIDE_BAR_FOREGROUND) || '';
            const borderColor = this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            const isPositionLeft = this.layoutService.getSideBarPosition() === 0 /* SideBarPosition.LEFT */;
            container.style.borderRightWidth = borderColor && isPositionLeft ? '1px' : '';
            container.style.borderRightStyle = borderColor && isPositionLeft ? 'solid' : '';
            container.style.borderRightColor = isPositionLeft ? borderColor || '' : '';
            container.style.borderLeftWidth = borderColor && !isPositionLeft ? '1px' : '';
            container.style.borderLeftStyle = borderColor && !isPositionLeft ? 'solid' : '';
            container.style.borderLeftColor = !isPositionLeft ? borderColor || '' : '';
            container.style.outlineColor = this.getColor(theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND) ?? '';
        }
        layout(width, height, top, left) {
            if (!this.layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                return;
            }
            super.layout(width, height, top, left);
        }
        getTitleAreaDropDownAnchorAlignment() {
            return this.layoutService.getSideBarPosition() === 0 /* SideBarPosition.LEFT */ ? 0 /* AnchorAlignment.LEFT */ : 1 /* AnchorAlignment.RIGHT */;
        }
        createCompositeBar() {
            return this.instantiationService.createInstance(activitybarPart_1.ActivityBarCompositeBar, this.getCompositeBarOptions(), this.partId, this, false);
        }
        getCompositeBarOptions() {
            return {
                partContainerClass: 'sidebar',
                pinnedViewContainersKey: activitybarPart_1.ActivitybarPart.pinnedViewContainersKey,
                placeholderViewContainersKey: activitybarPart_1.ActivitybarPart.placeholderViewContainersKey,
                viewContainersWorkspaceStateKey: activitybarPart_1.ActivitybarPart.viewContainersWorkspaceStateKey,
                icon: true,
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                recomputeSizes: true,
                activityHoverOptions: {
                    position: () => this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.BOTTOM ? 3 /* HoverPosition.ABOVE */ : 2 /* HoverPosition.BELOW */,
                },
                fillExtraContextMenuActions: actions => {
                    const viewsSubmenuAction = this.getViewsSubmenuAction();
                    if (viewsSubmenuAction) {
                        actions.push(new actions_2.Separator());
                        actions.push(viewsSubmenuAction);
                    }
                },
                compositeSize: 0,
                iconSize: 16,
                overflowActionSize: 30,
                colors: theme => ({
                    activeBackgroundColor: theme.getColor(theme_1.SIDE_BAR_BACKGROUND),
                    inactiveBackgroundColor: theme.getColor(theme_1.SIDE_BAR_BACKGROUND),
                    activeBorderBottomColor: theme.getColor(theme_1.ACTIVITY_BAR_TOP_ACTIVE_BORDER),
                    activeForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_TOP_FOREGROUND),
                    inactiveForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_TOP_INACTIVE_FOREGROUND),
                    badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                    badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                    dragAndDropBorder: theme.getColor(theme_1.ACTIVITY_BAR_TOP_DRAG_AND_DROP_BORDER)
                }),
                compact: true
            };
        }
        shouldShowCompositeBar() {
            const activityBarPosition = this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */);
            return activityBarPosition === "top" /* ActivityBarPosition.TOP */ || activityBarPosition === "bottom" /* ActivityBarPosition.BOTTOM */;
        }
        shouldShowActivityBar() {
            if (this.shouldShowCompositeBar()) {
                return false;
            }
            return this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */) !== "hidden" /* ActivityBarPosition.HIDDEN */;
        }
        getCompositeBarPosition() {
            const activityBarPosition = this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */);
            switch (activityBarPosition) {
                case "top" /* ActivityBarPosition.TOP */: return paneCompositePart_1.CompositeBarPosition.TOP;
                case "bottom" /* ActivityBarPosition.BOTTOM */: return paneCompositePart_1.CompositeBarPosition.BOTTOM;
                case "hidden" /* ActivityBarPosition.HIDDEN */:
                case "default" /* ActivityBarPosition.DEFAULT */: // noop
                default: return paneCompositePart_1.CompositeBarPosition.TITLE;
            }
        }
        rememberActivityBarVisiblePosition() {
            const activityBarPosition = this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */);
            if (activityBarPosition !== "hidden" /* ActivityBarPosition.HIDDEN */) {
                this.storageService.store("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, activityBarPosition, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
        }
        getRememberedActivityBarVisiblePosition() {
            const activityBarPosition = this.storageService.get("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, 0 /* StorageScope.PROFILE */);
            switch (activityBarPosition) {
                case "top" /* ActivityBarPosition.TOP */: return "top" /* ActivityBarPosition.TOP */;
                case "bottom" /* ActivityBarPosition.BOTTOM */: return "bottom" /* ActivityBarPosition.BOTTOM */;
                default: return "default" /* ActivityBarPosition.DEFAULT */;
            }
        }
        getPinnedPaneCompositeIds() {
            return this.shouldShowCompositeBar() ? super.getPinnedPaneCompositeIds() : this.acitivityBarPart.getPinnedPaneCompositeIds();
        }
        getVisiblePaneCompositeIds() {
            return this.shouldShowCompositeBar() ? super.getVisiblePaneCompositeIds() : this.acitivityBarPart.getVisiblePaneCompositeIds();
        }
        async focusActivityBar() {
            if (this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */) === "hidden" /* ActivityBarPosition.HIDDEN */) {
                await this.configurationService.updateValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, this.getRememberedActivityBarVisiblePosition());
                this.onDidChangeActivityBarLocation();
            }
            if (this.shouldShowCompositeBar()) {
                this.focusComositeBar();
            }
            else {
                if (!this.layoutService.isVisible("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */)) {
                    this.layoutService.setPartHidden(false, "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */);
                }
                this.acitivityBarPart.show(true);
            }
        }
        registerActions() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: layoutActions_1.ToggleActivityBarVisibilityActionId,
                        title: (0, nls_1.localize2)('toggleActivityBar', "Toggle Activity Bar Visibility"),
                    });
                }
                run() {
                    const value = that.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */) === "hidden" /* ActivityBarPosition.HIDDEN */ ? that.getRememberedActivityBarVisiblePosition() : "hidden" /* ActivityBarPosition.HIDDEN */;
                    return that.configurationService.updateValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, value);
                }
            }));
        }
        toJSON() {
            return {
                type: "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */
            };
        }
    };
    exports.SidebarPart = SidebarPart;
    exports.SidebarPart = SidebarPart = SidebarPart_1 = __decorate([
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
        __param(11, configuration_1.IConfigurationService),
        __param(12, actions_1.IMenuService)
    ], SidebarPart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lkZWJhclBhcnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9zaWRlYmFyL3NpZGViYXJQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFnQ3pGLElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVksU0FBUSw2Q0FBeUI7O2lCQUV6Qyw2QkFBd0IsR0FBRyxtQ0FBbUMsQUFBdEMsQ0FBdUM7UUFRL0UsSUFBYSxJQUFJLEtBQWMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBSTdDLElBQUksY0FBYztZQUNqQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUU5QyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDeEMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDL0IsT0FBTztZQUNSLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFJRCxZQUFZO1FBRVosWUFDdUIsbUJBQXlDLEVBQzlDLGNBQStCLEVBQzNCLGtCQUF1QyxFQUNuQyxhQUFzQyxFQUMzQyxpQkFBcUMsRUFDMUMsWUFBMkIsRUFDbkIsb0JBQTJDLEVBQ25ELFlBQTJCLEVBQ2xCLHFCQUE2QyxFQUNqRCxpQkFBcUMsRUFDdEMsZ0JBQW1DLEVBQy9CLG9CQUE0RCxFQUNyRSxXQUF5QjtZQUV2QyxLQUFLLHFEQUVKLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxJ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