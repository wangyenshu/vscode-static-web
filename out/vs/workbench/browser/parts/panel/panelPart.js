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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/workbench/common/contextkeys", "vs/workbench/services/layout/browser/layoutService", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/panel/panelActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/platform/notification/common/notification", "vs/base/browser/dom", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/workbench/services/extensions/common/extensions", "vs/workbench/common/views", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/paneCompositePart", "vs/platform/commands/common/commands", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/hover/browser/hover", "vs/css!./media/panelpart"], function (require, exports, nls_1, actions_1, contextkeys_1, layoutService_1, storage_1, contextView_1, keybinding_1, instantiation_1, panelActions_1, themeService_1, theme_1, colorRegistry_1, notification_1, dom_1, contextkey_1, types_1, extensions_1, views_1, actions_2, paneCompositePart_1, commands_1, menuEntryActionViewItem_1, hover_1) {
    "use strict";
    var PanelPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PanelPart = void 0;
    let PanelPart = class PanelPart extends paneCompositePart_1.AbstractPaneCompositePart {
        static { PanelPart_1 = this; }
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
        //#endregion
        static { this.activePanelSettingsKey = 'workbench.panelpart.activepanelid'; }
        constructor(notificationService, storageService, contextMenuService, layoutService, keybindingService, hoverService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, commandService, menuService) {
            super("workbench.parts.panel" /* Parts.PANEL_PART */, { hasTitle: true }, PanelPart_1.activePanelSettingsKey, contextkeys_1.ActivePanelContext.bindTo(contextKeyService), contextkeys_1.PanelFocusContext.bindTo(contextKeyService), 'panel', 'panel', undefined, notificationService, storageService, contextMenuService, layoutService, keybindingService, hoverService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, menuService);
            this.commandService = commandService;
            //#region IView
            this.minimumWidth = 300;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 77;
            this.maximumHeight = Number.POSITIVE_INFINITY;
        }
        updateStyles() {
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            container.style.backgroundColor = this.getColor(theme_1.PANEL_BACKGROUND) || '';
            const borderColor = this.getColor(theme_1.PANEL_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
            container.style.borderLeftColor = borderColor;
            container.style.borderRightColor = borderColor;
            const title = this.getTitleArea();
            if (title) {
                title.style.borderTopColor = this.getColor(theme_1.PANEL_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
            }
        }
        getCompositeBarOptions() {
            return {
                partContainerClass: 'panel',
                pinnedViewContainersKey: 'workbench.panel.pinnedPanels',
                placeholderViewContainersKey: 'workbench.panel.placeholderPanels',
                viewContainersWorkspaceStateKey: 'workbench.panel.viewContainersWorkspaceState',
                icon: false,
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                recomputeSizes: true,
                activityHoverOptions: {
                    position: () => this.layoutService.getPanelPosition() === 2 /* Position.BOTTOM */ && !this.layoutService.isPanelMaximized() ? 3 /* HoverPosition.ABOVE */ : 2 /* HoverPosition.BELOW */,
                },
                fillExtraContextMenuActions: actions => this.fillExtraContextMenuActions(actions),
                compositeSize: 0,
                iconSize: 16,
                overflowActionSize: 44,
                colors: theme => ({
                    activeBackgroundColor: theme.getColor(theme_1.PANEL_BACKGROUND), // Background color for overflow action
                    inactiveBackgroundColor: theme.getColor(theme_1.PANEL_BACKGROUND), // Background color for overflow action
                    activeBorderBottomColor: theme.getColor(theme_1.PANEL_ACTIVE_TITLE_BORDER),
                    activeForegroundColor: theme.getColor(theme_1.PANEL_ACTIVE_TITLE_FOREGROUND),
                    inactiveForegroundColor: theme.getColor(theme_1.PANEL_INACTIVE_TITLE_FOREGROUND),
                    badgeBackground: theme.getColor(colorRegistry_1.badgeBackground),
                    badgeForeground: theme.getColor(colorRegistry_1.badgeForeground),
                    dragAndDropBorder: theme.getColor(theme_1.PANEL_DRAG_AND_DROP_BORDER)
                })
            };
        }
        fillExtraContextMenuActions(actions) {
            const panelPositionMenu = this.menuService.createMenu(actions_2.MenuId.PanelPositionMenu, this.contextKeyService);
            const panelAlignMenu = this.menuService.createMenu(actions_2.MenuId.PanelAlignmentMenu, this.contextKeyService);
            const positionActions = [];
            const alignActions = [];
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(panelPositionMenu, { shouldForwardArgs: true }, { primary: [], secondary: positionActions });
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(panelAlignMenu, { shouldForwardArgs: true }, { primary: [], secondary: alignActions });
            panelAlignMenu.dispose();
            panelPositionMenu.dispose();
            actions.push(...[
                new actions_1.Separator(),
                new actions_1.SubmenuAction('workbench.action.panel.position', (0, nls_1.localize)('panel position', "Panel Position"), positionActions),
                new actions_1.SubmenuAction('workbench.action.panel.align', (0, nls_1.localize)('align panel', "Align Panel"), alignActions),
                (0, actions_1.toAction)({ id: panelActions_1.TogglePanelAction.ID, label: (0, nls_1.localize)('hidePanel', "Hide Panel"), run: () => this.commandService.executeCommand(panelActions_1.TogglePanelAction.ID) })
            ]);
        }
        layout(width, height, top, left) {
            let dimensions;
            if (this.layoutService.getPanelPosition() === 1 /* Position.RIGHT */) {
                dimensions = new dom_1.Dimension(width - 1, height); // Take into account the 1px border when layouting
            }
            else {
                dimensions = new dom_1.Dimension(width, height);
            }
            // Layout contents
            super.layout(dimensions.width, dimensions.height, top, left);
        }
        shouldShowCompositeBar() {
            return true;
        }
        getCompositeBarPosition() {
            return paneCompositePart_1.CompositeBarPosition.TITLE;
        }
        toJSON() {
            return {
                type: "workbench.parts.panel" /* Parts.PANEL_PART */
            };
        }
    };
    exports.PanelPart = PanelPart;
    exports.PanelPart = PanelPart = PanelPart_1 = __decorate([
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
        __param(12, actions_2.IMenuService)
    ], PanelPart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWxQYXJ0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvcGFuZWwvcGFuZWxQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE4QnpGLElBQU0sU0FBUyxHQUFmLE1BQU0sU0FBVSxTQUFRLDZDQUF5Qjs7UUFTdkQsSUFBSSxlQUFlO1lBQ2xCLHFEQUFxRDtZQUNyRCwwREFBMEQ7WUFDMUQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDL0QsQ0FBQztRQUVELElBQUksY0FBYztZQUNqQixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUV0RCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3RCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ2hELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQy9CLE9BQU87WUFDUixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBRUQsWUFBWTtpQkFFSSwyQkFBc0IsR0FBRyxtQ0FBbUMsQUFBdEMsQ0FBdUM7UUFFN0UsWUFDdUIsbUJBQXlDLEVBQzlDLGNBQStCLEVBQzNCLGtCQUF1QyxFQUNuQyxhQUFzQyxFQUMzQyxpQkFBcUMsRUFDMUMsWUFBMkIsRUFDbkIsb0JBQTJDLEVBQ25ELFlBQTJCLEVBQ2xCLHFCQUE2QyxFQUNqRCxpQkFBcUMsRUFDdEMsZ0JBQW1DLEVBQ3JDLGNBQXVDLEVBQzFDLFdBQXlCO1lBRXZDLEtBQUss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