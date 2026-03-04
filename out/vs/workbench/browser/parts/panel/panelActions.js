/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkey", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/notification/common/notification", "vs/css!./media/panelpart"], function (require, exports, nls_1, actions_1, actionCommonCategories_1, layoutService_1, contextkeys_1, contextkey_1, codicons_1, iconRegistry_1, views_1, viewsService_1, panecomposite_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MoveSecondarySideBarToPanelAction = exports.MovePanelToSecondarySideBarAction = exports.TogglePanelAction = void 0;
    const maximizeIcon = (0, iconRegistry_1.registerIcon)('panel-maximize', codicons_1.Codicon.chevronUp, (0, nls_1.localize)('maximizeIcon', 'Icon to maximize a panel.'));
    const restoreIcon = (0, iconRegistry_1.registerIcon)('panel-restore', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('restoreIcon', 'Icon to restore a panel.'));
    const closeIcon = (0, iconRegistry_1.registerIcon)('panel-close', codicons_1.Codicon.close, (0, nls_1.localize)('closeIcon', 'Icon to close a panel.'));
    const panelIcon = (0, iconRegistry_1.registerIcon)('panel-layout-icon', codicons_1.Codicon.layoutPanel, (0, nls_1.localize)('togglePanelOffIcon', 'Icon to toggle the panel off when it is on.'));
    const panelOffIcon = (0, iconRegistry_1.registerIcon)('panel-layout-icon-off', codicons_1.Codicon.layoutPanelOff, (0, nls_1.localize)('togglePanelOnIcon', 'Icon to toggle the panel on when it is off.'));
    class TogglePanelAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.togglePanel'; }
        static { this.LABEL = (0, nls_1.localize2)('togglePanelVisibility', "Toggle Panel Visibility"); }
        constructor() {
            super({
                id: TogglePanelAction.ID,
                title: TogglePanelAction.LABEL,
                toggled: {
                    condition: contextkeys_1.PanelVisibleContext,
                    title: (0, nls_1.localize)('toggle panel', "Panel"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'toggle panel mnemonic', comment: ['&& denotes a mnemonic'] }, "&&Panel"),
                },
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                keybinding: { primary: 2048 /* KeyMod.CtrlCmd */ | 40 /* KeyCode.KeyJ */, weight: 200 /* KeybindingWeight.WorkbenchContrib */ },
                menu: [
                    {
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '2_workbench_layout',
                        order: 5
                    }, {
                        id: actions_1.MenuId.LayoutControlMenuSubmenu,
                        group: '0_workbench_layout',
                        order: 4
                    },
                ]
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.setPartHidden(layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */), "workbench.parts.panel" /* Parts.PANEL_PART */);
        }
    }
    exports.TogglePanelAction = TogglePanelAction;
    (0, actions_1.registerAction2)(TogglePanelAction);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        static { this.ID = 'workbench.action.focusPanel'; }
        static { this.LABEL = (0, nls_1.localize)('focusPanel', "Focus into Panel"); }
        constructor() {
            super({
                id: 'workbench.action.focusPanel',
                title: (0, nls_1.localize2)('focusPanel', "Focus into Panel"),
                category: actionCommonCategories_1.Categories.View,
                f1: true,
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            // Show panel
            if (!layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                layoutService.setPartHidden(false, "workbench.parts.panel" /* Parts.PANEL_PART */);
            }
            // Focus into active panel
            const panel = paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            panel?.focus();
        }
    });
    const PositionPanelActionId = {
        LEFT: 'workbench.action.positionPanelLeft',
        RIGHT: 'workbench.action.positionPanelRight',
        BOTTOM: 'workbench.action.positionPanelBottom',
    };
    const AlignPanelActionId = {
        LEFT: 'workbench.action.alignPanelLeft',
        RIGHT: 'workbench.action.alignPanelRight',
        CENTER: 'workbench.action.alignPanelCenter',
        JUSTIFY: 'workbench.action.alignPanelJustify',
    };
    function createPanelActionConfig(id, title, shortLabel, value, when) {
        return {
            id,
            title,
            shortLabel,
            value,
            when,
        };
    }
    function createPositionPanelActionConfig(id, title, shortLabel, position) {
        return createPanelActionConfig(id, title, shortLabel, position, contextkeys_1.PanelPositionContext.notEqualsTo((0, layoutService_1.positionToString)(position)));
    }
    function createAlignmentPanelActionConfig(id, title, shortLabel, alignment) {
        return createPanelActionConfig(id, title, shortLabel, alignment, contextkeys_1.PanelAlignmentContext.notEqualsTo(alignment));
    }
    const PositionPanelActionConfigs = [
        createPositionPanelActionConfig(PositionPanelActionId.LEFT, (0, nls_1.localize2)('positionPanelLeft', "Move Panel Left"), (0, nls_1.localize)('positionPanelLeftShort', "Left"), 0 /* Position.LEFT */),
        createPositionPanelActionConfig(PositionPanelActionId.RIGHT, (0, nls_1.localize2)('positionPanelRight', "Move Panel Right"), (0, nls_1.localize)('positionPanelRightShort', "Right"), 1 /* Position.RIGHT */),
        createPositionPanelActionConfig(PositionPanelActionId.BOTTOM, (0, nls_1.localize2)('positionPanelBottom', "Move Panel To Bottom"), (0, nls_1.localize)('positionPanelBottomShort', "Bottom"), 2 /* Position.BOTTOM */),
    ];
    const AlignPanelActionConfigs = [
        createAlignmentPanelActionConfig(AlignPanelActionId.LEFT, (0, nls_1.localize2)('alignPanelLeft', "Set Panel Alignment to Left"), (0, nls_1.localize)('alignPanelLeftShort', "Left"), 'left'),
        createAlignmentPanelActionConfig(AlignPanelActionId.RIGHT, (0, nls_1.localize2)('alignPanelRight', "Set Panel Alignment to Right"), (0, nls_1.localize)('alignPanelRightShort', "Right"), 'right'),
        createAlignmentPanelActionConfig(AlignPanelActionId.CENTER, (0, nls_1.localize2)('alignPanelCenter', "Set Panel Alignment to Center"), (0, nls_1.localize)('alignPanelCenterShort', "Center"), 'center'),
        createAlignmentPanelActionConfig(AlignPanelActionId.JUSTIFY, (0, nls_1.localize2)('alignPanelJustify', "Set Panel Alignment to Justify"), (0, nls_1.localize)('alignPanelJustifyShort', "Justify"), 'justify'),
    ];
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarAppearanceMenu, {
        submenu: actions_1.MenuId.PanelPositionMenu,
        title: (0, nls_1.localize)('positionPanel', "Panel Position"),
        group: '3_workbench_layout_move',
        order: 4
    });
    PositionPanelActionConfigs.forEach(positionPanelAction => {
        const { id, title, shortLabel, value, when } = positionPanelAction;
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id,
                    title,
                    category: actionCommonCategories_1.Categories.View,
                    f1: true
                });
            }
            run(accessor) {
                const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
                layoutService.setPanelPosition(value === undefined ? 2 /* Position.BOTTOM */ : value);
            }
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.PanelPositionMenu, {
            command: {
                id,
                title: shortLabel,
                toggled: when.negate()
            },
            order: 5
        });
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarAppearanceMenu, {
        submenu: actions_1.MenuId.PanelAlignmentMenu,
        title: (0, nls_1.localize)('alignPanel', "Align Panel"),
        group: '3_workbench_layout_move',
        order: 5
    });
    AlignPanelActionConfigs.forEach(alignPanelAction => {
        const { id, title, shortLabel, value, when } = alignPanelAction;
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id,
                    title,
                    category: actionCommonCategories_1.Categories.View,
                    toggled: when.negate(),
                    f1: true
                });
            }
            run(accessor) {
                const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
                layoutService.setPanelAlignment(value === undefined ? 'center' : value);
            }
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.PanelAlignmentMenu, {
            command: {
                id,
                title: shortLabel,
                toggled: when.negate()
            },
            order: 5
        });
    });
    class SwitchPanelViewAction extends actions_1.Action2 {
        constructor(id, title) {
            super({
                id,
                title,
                category: actionCommonCategories_1.Categories.View,
                f1: true,
            });
        }
        async run(accessor, offset) {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const pinnedPanels = paneCompositeService.getVisiblePaneCompositeIds(1 /* ViewContainerLocation.Panel */);
            const activePanel = paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            if (!activePanel) {
                return;
            }
            let targetPanelId;
            for (let i = 0; i < pinnedPanels.length; i++) {
                if (pinnedPanels[i] === activePanel.getId()) {
                    targetPanelId = pinnedPanels[(i + pinnedPanels.length + offset) % pinnedPanels.length];
                    break;
                }
            }
            if (typeof targetPanelId === 'string') {
                await paneCompositeService.openPaneComposite(targetPanelId, 1 /* ViewContainerLocation.Panel */, true);
            }
        }
    }
    (0, actions_1.registerAction2)(class extends SwitchPanelViewAction {
        constructor() {
            super('workbench.action.previousPanelView', (0, nls_1.localize2)('previousPanelView', "Previous Panel View"));
        }
        run(accessor) {
            return super.run(accessor, -1);
        }
    });
    (0, actions_1.registerAction2)(class extends SwitchPanelViewAction {
        constructor() {
            super('workbench.action.nextPanelView', (0, nls_1.localize2)('nextPanelView', "Next Panel View"));
        }
        run(accessor) {
            return super.run(accessor, 1);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleMaximizedPanel',
                title: (0, nls_1.localize2)('toggleMaximizedPanel', 'Toggle Maximized Panel'),
                tooltip: (0, nls_1.localize)('maximizePanel', "Maximize Panel Size"),
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                icon: maximizeIcon,
                // the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
                precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.PanelAlignmentContext.isEqualTo('center'), contextkeys_1.PanelPositionContext.notEqualsTo('bottom')),
                toggled: { condition: contextkeys_1.PanelMaximizedContext, icon: restoreIcon, tooltip: (0, nls_1.localize)('minimizePanel', "Restore Panel Size") },
                menu: [{
                        id: actions_1.MenuId.PanelTitle,
                        group: 'navigation',
                        order: 1,
                        // the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
                        when: contextkey_1.ContextKeyExpr.or(contextkeys_1.PanelAlignmentContext.isEqualTo('center'), contextkeys_1.PanelPositionContext.notEqualsTo('bottom'))
                    }]
            });
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const notificationService = accessor.get(notification_1.INotificationService);
            if (layoutService.getPanelAlignment() !== 'center' && layoutService.getPanelPosition() === 2 /* Position.BOTTOM */) {
                notificationService.warn((0, nls_1.localize)('panelMaxNotSupported', "Maximizing the panel is only supported when it is center aligned."));
                return;
            }
            if (!layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                layoutService.setPartHidden(false, "workbench.parts.panel" /* Parts.PANEL_PART */);
                // If the panel is not already maximized, maximize it
                if (!layoutService.isPanelMaximized()) {
                    layoutService.toggleMaximizedPanel();
                }
            }
            else {
                layoutService.toggleMaximizedPanel();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closePanel',
                title: (0, nls_1.localize2)('closePanel', 'Hide Panel'),
                category: actionCommonCategories_1.Categories.View,
                icon: closeIcon,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkeys_1.PanelVisibleContext,
                    }, {
                        id: actions_1.MenuId.PanelTitle,
                        group: 'navigation',
                        order: 2
                    }]
            });
        }
        run(accessor) {
            accessor.get(layoutService_1.IWorkbenchLayoutService).setPartHidden(true, "workbench.parts.panel" /* Parts.PANEL_PART */);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closeAuxiliaryBar',
                title: (0, nls_1.localize2)('closeSecondarySideBar', 'Hide Secondary Side Bar'),
                category: actionCommonCategories_1.Categories.View,
                icon: closeIcon,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkeys_1.AuxiliaryBarVisibleContext,
                    }, {
                        id: actions_1.MenuId.AuxiliaryBarTitle,
                        group: 'navigation',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.notEquals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "top" /* ActivityBarPosition.TOP */)
                    }, {
                        id: actions_1.MenuId.AuxiliaryBarHeader,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "top" /* ActivityBarPosition.TOP */)
                    }]
            });
        }
        run(accessor) {
            accessor.get(layoutService_1.IWorkbenchLayoutService).setPartHidden(true, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
        }
    });
    actions_1.MenuRegistry.appendMenuItems([
        {
            id: actions_1.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: TogglePanelAction.ID,
                    title: (0, nls_1.localize)('togglePanel', "Toggle Panel"),
                    icon: panelOffIcon,
                    toggled: { condition: contextkeys_1.PanelVisibleContext, icon: panelIcon }
                },
                when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')),
                order: 1
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: TogglePanelAction.ID,
                    title: (0, nls_1.localize2)('hidePanel', 'Hide Panel'),
                },
                when: contextkey_1.ContextKeyExpr.and(contextkeys_1.PanelVisibleContext, contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(1 /* ViewContainerLocation.Panel */))),
                order: 2
            }
        }
    ]);
    class MoveViewsBetweenPanelsAction extends actions_1.Action2 {
        constructor(source, destination, desc) {
            super(desc);
            this.source = source;
            this.destination = destination;
        }
        run(accessor, ...args) {
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const srcContainers = viewDescriptorService.getViewContainersByLocation(this.source);
            const destContainers = viewDescriptorService.getViewContainersByLocation(this.destination);
            if (srcContainers.length) {
                const activeViewContainer = viewsService.getVisibleViewContainer(this.source);
                srcContainers.forEach(viewContainer => viewDescriptorService.moveViewContainerToLocation(viewContainer, this.destination, undefined, this.desc.id));
                layoutService.setPartHidden(false, this.destination === 1 /* ViewContainerLocation.Panel */ ? "workbench.parts.panel" /* Parts.PANEL_PART */ : "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
                if (activeViewContainer && destContainers.length === 0) {
                    viewsService.openViewContainer(activeViewContainer.id, true);
                }
            }
        }
    }
    // --- Move Panel Views To Secondary Side Bar
    class MovePanelToSidePanelAction extends MoveViewsBetweenPanelsAction {
        static { this.ID = 'workbench.action.movePanelToSidePanel'; }
        constructor() {
            super(1 /* ViewContainerLocation.Panel */, 2 /* ViewContainerLocation.AuxiliaryBar */, {
                id: MovePanelToSidePanelAction.ID,
                title: (0, nls_1.localize2)('movePanelToSecondarySideBar', "Move Panel Views To Secondary Side Bar"),
                category: actionCommonCategories_1.Categories.View,
                f1: false
            });
        }
    }
    class MovePanelToSecondarySideBarAction extends MoveViewsBetweenPanelsAction {
        static { this.ID = 'workbench.action.movePanelToSecondarySideBar'; }
        constructor() {
            super(1 /* ViewContainerLocation.Panel */, 2 /* ViewContainerLocation.AuxiliaryBar */, {
                id: MovePanelToSecondarySideBarAction.ID,
                title: (0, nls_1.localize2)('movePanelToSecondarySideBar', "Move Panel Views To Secondary Side Bar"),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
    }
    exports.MovePanelToSecondarySideBarAction = MovePanelToSecondarySideBarAction;
    (0, actions_1.registerAction2)(MovePanelToSidePanelAction);
    (0, actions_1.registerAction2)(MovePanelToSecondarySideBarAction);
    // --- Move Secondary Side Bar Views To Panel
    class MoveSidePanelToPanelAction extends MoveViewsBetweenPanelsAction {
        static { this.ID = 'workbench.action.moveSidePanelToPanel'; }
        constructor() {
            super(2 /* ViewContainerLocation.AuxiliaryBar */, 1 /* ViewContainerLocation.Panel */, {
                id: MoveSidePanelToPanelAction.ID,
                title: (0, nls_1.localize2)('moveSidePanelToPanel', "Move Secondary Side Bar Views To Panel"),
                category: actionCommonCategories_1.Categories.View,
                f1: false
            });
        }
    }
    class MoveSecondarySideBarToPanelAction extends MoveViewsBetweenPanelsAction {
        static { this.ID = 'workbench.action.moveSecondarySideBarToPanel'; }
        constructor() {
            super(2 /* ViewContainerLocation.AuxiliaryBar */, 1 /* ViewContainerLocation.Panel */, {
                id: MoveSecondarySideBarToPanelAction.ID,
                title: (0, nls_1.localize2)('moveSidePanelToPanel', "Move Secondary Side Bar Views To Panel"),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
    }
    exports.MoveSecondarySideBarToPanelAction = MoveSecondarySideBarToPanelAction;
    (0, actions_1.registerAction2)(MoveSidePanelToPanelAction);
    (0, actions_1.registerAction2)(MoveSecondarySideBarToPanelAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWxBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvcGFuZWwvcGFuZWxBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CaEcsTUFBTSxZQUFZLEdBQUcsSUFBQSwyQkFBWSxFQUFDLGdCQUFnQixFQUFFLGtCQUFPLENBQUMsU0FBUyxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDLENBQUM7SUFDOUgsTUFBTSxXQUFXLEdBQUcsSUFBQSwyQkFBWSxFQUFDLGVBQWUsRUFBRSxrQkFBTyxDQUFDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDO0lBQzVILE1BQU0sU0FBUyxHQUFHLElBQUEsMkJBQVksRUFBQyxhQUFhLEVBQUUsa0JBQU8sQ0FBQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLHdCQUF3QixDQUFDLENBQUMsQ0FBQztJQUM5RyxNQUFNLFNBQVMsR0FBRyxJQUFBLDJCQUFZLEVBQUMsbUJBQW1CLEVBQUUsa0JBQU8sQ0FBQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsNkNBQTZDLENBQUMsQ0FBQyxDQUFDO0lBQ3hKLE1BQU0sWUFBWSxHQUFHLElBQUEsMkJBQVksRUFBQyx1QkFBdUIsRUFBRSxrQkFBTyxDQUFDLGNBQWMsRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSw2Q0FBNkMsQ0FBQyxDQUFDLENBQUM7SUFFakssTUFBYSxpQkFBa0IsU0FBUSxpQkFBTztpQkFFN0IsT0FBRSxHQUFHLDhCQUE4QixDQUFDO2lCQUNwQyxVQUFLLEdBQUcsSUFBQSxlQUFTLEVBQUMsdUJBQXVC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