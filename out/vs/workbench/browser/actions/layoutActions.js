/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/platform/contextkey/common/contextkeys", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/platform/quickinput/common/quickInput", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/browser/parts/auxiliarybar/auxiliaryBarActions", "vs/workbench/browser/parts/panel/panelActions", "vs/platform/commands/common/commands", "vs/workbench/common/contextkeys", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/lifecycle", "vs/platform/theme/common/iconRegistry", "vs/base/browser/window", "vs/platform/keybinding/common/keybinding"], function (require, exports, nls_1, actions_1, actionCommonCategories_1, configuration_1, layoutService_1, instantiation_1, keyCodes_1, platform_1, contextkeys_1, keybindingsRegistry_1, contextkey_1, views_1, viewsService_1, quickInput_1, dialogs_1, panecomposite_1, auxiliaryBarActions_1, panelActions_1, commands_1, contextkeys_2, codicons_1, themables_1, lifecycle_1, iconRegistry_1, window_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowEditorActionsAction = exports.HideEditorActionsAction = exports.EditorActionsDefaultAction = exports.EditorActionsTitleBarAction = exports.ZenShowSingleEditorTabAction = exports.ShowSingleEditorTabAction = exports.ZenShowMultipleEditorTabsAction = exports.ShowMultipleEditorTabsAction = exports.ZenHideEditorTabsAction = exports.HideEditorTabsAction = exports.ToggleStatusbarVisibilityAction = exports.ToggleSidebarPositionAction = exports.ToggleActivityBarVisibilityActionId = void 0;
    // Register Icons
    const menubarIcon = (0, iconRegistry_1.registerIcon)('menuBar', codicons_1.Codicon.layoutMenubar, (0, nls_1.localize)('menuBarIcon', "Represents the menu bar"));
    const activityBarLeftIcon = (0, iconRegistry_1.registerIcon)('activity-bar-left', codicons_1.Codicon.layoutActivitybarLeft, (0, nls_1.localize)('activityBarLeft', "Represents the activity bar in the left position"));
    const activityBarRightIcon = (0, iconRegistry_1.registerIcon)('activity-bar-right', codicons_1.Codicon.layoutActivitybarRight, (0, nls_1.localize)('activityBarRight', "Represents the activity bar in the right position"));
    const panelLeftIcon = (0, iconRegistry_1.registerIcon)('panel-left', codicons_1.Codicon.layoutSidebarLeft, (0, nls_1.localize)('panelLeft', "Represents a side bar in the left position"));
    const panelLeftOffIcon = (0, iconRegistry_1.registerIcon)('panel-left-off', codicons_1.Codicon.layoutSidebarLeftOff, (0, nls_1.localize)('panelLeftOff', "Represents a side bar in the left position toggled off"));
    const panelRightIcon = (0, iconRegistry_1.registerIcon)('panel-right', codicons_1.Codicon.layoutSidebarRight, (0, nls_1.localize)('panelRight', "Represents side bar in the right position"));
    const panelRightOffIcon = (0, iconRegistry_1.registerIcon)('panel-right-off', codicons_1.Codicon.layoutSidebarRightOff, (0, nls_1.localize)('panelRightOff', "Represents side bar in the right position toggled off"));
    const panelIcon = (0, iconRegistry_1.registerIcon)('panel-bottom', codicons_1.Codicon.layoutPanel, (0, nls_1.localize)('panelBottom', "Represents the bottom panel"));
    const statusBarIcon = (0, iconRegistry_1.registerIcon)('statusBar', codicons_1.Codicon.layoutStatusbar, (0, nls_1.localize)('statusBarIcon', "Represents the status bar"));
    const panelAlignmentLeftIcon = (0, iconRegistry_1.registerIcon)('panel-align-left', codicons_1.Codicon.layoutPanelLeft, (0, nls_1.localize)('panelBottomLeft', "Represents the bottom panel alignment set to the left"));
    const panelAlignmentRightIcon = (0, iconRegistry_1.registerIcon)('panel-align-right', codicons_1.Codicon.layoutPanelRight, (0, nls_1.localize)('panelBottomRight', "Represents the bottom panel alignment set to the right"));
    const panelAlignmentCenterIcon = (0, iconRegistry_1.registerIcon)('panel-align-center', codicons_1.Codicon.layoutPanelCenter, (0, nls_1.localize)('panelBottomCenter', "Represents the bottom panel alignment set to the center"));
    const panelAlignmentJustifyIcon = (0, iconRegistry_1.registerIcon)('panel-align-justify', codicons_1.Codicon.layoutPanelJustify, (0, nls_1.localize)('panelBottomJustify', "Represents the bottom panel alignment set to justified"));
    const fullscreenIcon = (0, iconRegistry_1.registerIcon)('fullscreen', codicons_1.Codicon.screenFull, (0, nls_1.localize)('fullScreenIcon', "Represents full screen"));
    const centerLayoutIcon = (0, iconRegistry_1.registerIcon)('centerLayoutIcon', codicons_1.Codicon.layoutCentered, (0, nls_1.localize)('centerLayoutIcon', "Represents centered layout mode"));
    const zenModeIcon = (0, iconRegistry_1.registerIcon)('zenMode', codicons_1.Codicon.target, (0, nls_1.localize)('zenModeIcon', "Represents zen mode"));
    // --- Close Side Bar
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closeSidebar',
                title: (0, nls_1.localize2)('closeSidebar', 'Close Primary Side Bar'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        run(accessor) {
            accessor.get(layoutService_1.IWorkbenchLayoutService).setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
        }
    });
    exports.ToggleActivityBarVisibilityActionId = 'workbench.action.toggleActivityBarVisibility';
    // --- Toggle Centered Layout
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleCenteredLayout',
                title: {
                    ...(0, nls_1.localize2)('toggleCenteredLayout', "Toggle Centered Layout"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miToggleCenteredLayout', comment: ['&& denotes a mnemonic'] }, "&&Centered Layout"),
                },
                precondition: contextkeys_2.IsAuxiliaryWindowFocusedContext.toNegated(),
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                toggled: contextkeys_2.IsMainEditorCenteredLayoutContext,
                menu: [{
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '1_toggle_view',
                        order: 3
                    }]
            });
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.centerMainEditorLayout(!layoutService.isMainEditorLayoutCentered());
        }
    });
    // --- Set Sidebar Position
    const sidebarPositionConfigurationKey = 'workbench.sideBar.location';
    class MoveSidebarPositionAction extends actions_1.Action2 {
        constructor(id, title, position) {
            super({
                id,
                title,
                f1: false
            });
            this.position = position;
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const position = layoutService.getSideBarPosition();
            if (position !== this.position) {
                return configurationService.updateValue(sidebarPositionConfigurationKey, (0, layoutService_1.positionToString)(this.position));
            }
        }
    }
    class MoveSidebarRightAction extends MoveSidebarPositionAction {
        static { this.ID = 'workbench.action.moveSideBarRight'; }
        constructor() {
            super(MoveSidebarRightAction.ID, (0, nls_1.localize2)('moveSidebarRight', "Move Primary Side Bar Right"), 1 /* Position.RIGHT */);
        }
    }
    class MoveSidebarLeftAction extends MoveSidebarPositionAction {
        static { this.ID = 'workbench.action.moveSideBarLeft'; }
        constructor() {
            super(MoveSidebarLeftAction.ID, (0, nls_1.localize2)('moveSidebarLeft', "Move Primary Side Bar Left"), 0 /* Position.LEFT */);
        }
    }
    (0, actions_1.registerAction2)(MoveSidebarRightAction);
    (0, actions_1.registerAction2)(MoveSidebarLeftAction);
    // --- Toggle Sidebar Position
    class ToggleSidebarPositionAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.toggleSidebarPosition'; }
        static { this.LABEL = (0, nls_1.localize)('toggleSidebarPosition', "Toggle Primary Side Bar Position"); }
        static getLabel(layoutService) {
            return layoutService.getSideBarPosition() === 0 /* Position.LEFT */ ? (0, nls_1.localize)('moveSidebarRight', "Move Primary Side Bar Right") : (0, nls_1.localize)('moveSidebarLeft', "Move Primary Side Bar Left");
        }
        constructor() {
            super({
                id: ToggleSidebarPositionAction.ID,
                title: (0, nls_1.localize2)('toggleSidebarPosition', "Toggle Primary Side Bar Position"),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const position = layoutService.getSideBarPosition();
            const newPositionValue = (position === 0 /* Position.LEFT */) ? 'right' : 'left';
            return configurationService.updateValue(sidebarPositionConfigurationKey, newPositionValue);
        }
    }
    exports.ToggleSidebarPositionAction = ToggleSidebarPositionAction;
    (0, actions_1.registerAction2)(ToggleSidebarPositionAction);
    const configureLayoutIcon = (0, iconRegistry_1.registerIcon)('configure-layout-icon', codicons_1.Codicon.layout, (0, nls_1.localize)('cofigureLayoutIcon', 'Icon represents workbench layout configuration.'));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.LayoutControlMenu, {
        submenu: actions_1.MenuId.LayoutControlMenuSubmenu,
        title: (0, nls_1.localize)('configureLayout', "Configure Layout"),
        icon: configureLayoutIcon,
        group: '1_workbench_layout',
        when: contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'menu')
    });
    actions_1.MenuRegistry.appendMenuItems([{
            id: actions_1.MenuId.ViewContainerTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move side bar right', "Move Primary Side Bar Right")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.notEquals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewContainerLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 1
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move sidebar right', "Move Primary Side Bar Right")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.notEquals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 1
            }
        }, {
            id: actions_1.MenuId.ViewContainerTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move sidebar left', "Move Primary Side Bar Left")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewContainerLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 1
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move sidebar left', "Move Primary Side Bar Left")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 1
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move second sidebar left', "Move Secondary Side Bar Left")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.notEquals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(2 /* ViewContainerLocation.AuxiliaryBar */))),
                order: 1
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move second sidebar right', "Move Secondary Side Bar Right")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(2 /* ViewContainerLocation.AuxiliaryBar */))),
                order: 1
            }
        }]);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarAppearanceMenu, {
        group: '3_workbench_layout_move',
        command: {
            id: ToggleSidebarPositionAction.ID,
            title: (0, nls_1.localize)({ key: 'miMoveSidebarRight', comment: ['&& denotes a mnemonic'] }, "&&Move Primary Side Bar Right")
        },
        when: contextkey_1.ContextKeyExpr.notEquals('config.workbench.sideBar.location', 'right'),
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarAppearanceMenu, {
        group: '3_workbench_layout_move',
        command: {
            id: ToggleSidebarPositionAction.ID,
            title: (0, nls_1.localize)({ key: 'miMoveSidebarLeft', comment: ['&& denotes a mnemonic'] }, "&&Move Primary Side Bar Left")
        },
        when: contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'),
        order: 2
    });
    // --- Toggle Editor Visibility
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleEditorVisibility',
                title: {
                    ...(0, nls_1.localize2)('toggleEditor', "Toggle Editor Area Visibility"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miShowEditorArea', comment: ['&& denotes a mnemonic'] }, "Show &&Editor Area"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                toggled: contextkeys_2.MainEditorAreaVisibleContext,
                // the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_2.IsAuxiliaryWindowFocusedContext.toNegated(), contextkey_1.ContextKeyExpr.or(contextkeys_2.PanelAlignmentContext.isEqualTo('center'), contextkeys_2.PanelPositionContext.notEqualsTo('bottom')))
            });
        }
        run(accessor) {
            accessor.get(layoutService_1.IWorkbenchLayoutService).toggleMaximizedPanel();
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '2_appearance',
        title: (0, nls_1.localize)({ key: 'miAppearance', comment: ['&& denotes a mnemonic'] }, "&&Appearance"),
        submenu: actions_1.MenuId.MenubarAppearanceMenu,
        order: 1
    });
    // Toggle Sidebar Visibility
    class ToggleSidebarVisibilityAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.toggleSidebarVisibility'; }
        constructor() {
            super({
                id: ToggleSidebarVisibilityAction.ID,
                title: (0, nls_1.localize2)('toggleSidebar', 'Toggle Primary Side Bar Visibility'),
                toggled: {
                    condition: contextkeys_2.SideBarVisibleContext,
                    title: (0, nls_1.localize)('primary sidebar', "Primary Side Bar"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'primary sidebar mnemonic', comment: ['&& denotes a mnemonic'] }, "&&Primary Side Bar"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */
                },
                menu: [
                    {
                        id: actions_1.MenuId.LayoutControlMenuSubmenu,
                        group: '0_workbench_layout',
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '2_workbench_layout',
                        order: 1
                    }
                ]
            });
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.setPartHidden(layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */), "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
        }
    }
    (0, actions_1.registerAction2)(ToggleSidebarVisibilityAction);
    actions_1.MenuRegistry.appendMenuItems([
        {
            id: actions_1.MenuId.ViewContainerTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarVisibilityAction.ID,
                    title: (0, nls_1.localize)('compositePart.hideSideBarLabel', "Hide Primary Side Bar"),
                },
                when: contextkey_1.ContextKeyExpr.and(contextkeys_2.SideBarVisibleContext, contextkey_1.ContextKeyExpr.equals('viewContainerLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 2
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarVisibilityAction.ID,
                    title: (0, nls_1.localize)('compositePart.hideSideBarLabel', "Hide Primary Side Bar"),
                },
                when: contextkey_1.ContextKeyExpr.and(contextkeys_2.SideBarVisibleContext, contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 2
            }
        }, {
            id: actions_1.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: ToggleSidebarVisibilityAction.ID,
                    title: (0, nls_1.localize)('toggleSideBar', "Toggle Primary Side Bar"),
                    icon: panelLeftOffIcon,
                    toggled: { condition: contextkeys_2.SideBarVisibleContext, icon: panelLeftIcon }
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')), contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left')),
                order: 0
            }
        }, {
            id: actions_1.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: ToggleSidebarVisibilityAction.ID,
                    title: (0, nls_1.localize)('toggleSideBar', "Toggle Primary Side Bar"),
                    icon: panelRightOffIcon,
                    toggled: { condition: contextkeys_2.SideBarVisibleContext, icon: panelRightIcon }
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')), contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right')),
                order: 2
            }
        }
    ]);
    // --- Toggle Statusbar Visibility
    class ToggleStatusbarVisibilityAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.toggleStatusbarVisibility'; }
        static { this.statusbarVisibleKey = 'workbench.statusBar.visible'; }
        constructor() {
            super({
                id: ToggleStatusbarVisibilityAction.ID,
                title: {
                    ...(0, nls_1.localize2)('toggleStatusbar', "Toggle Status Bar Visibility"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miStatusbar', comment: ['&& denotes a mnemonic'] }, "S&&tatus Bar"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.statusBar.visible', true),
                menu: [{
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '2_workbench_layout',
                        order: 3
                    }]
            });
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const visibility = layoutService.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, window_1.mainWindow);
            const newVisibilityValue = !visibility;
            return configurationService.updateValue(ToggleStatusbarVisibilityAction.statusbarVisibleKey, newVisibilityValue);
        }
    }
    exports.ToggleStatusbarVisibilityAction = ToggleStatusbarVisibilityAction;
    (0, actions_1.registerAction2)(ToggleStatusbarVisibilityAction);
    // ------------------- Editor Tabs Layout --------------------------------
    class AbstractSetShowTabsAction extends actions_1.Action2 {
        constructor(settingName, value, title, id, precondition, description) {
            super({
                id,
                title,
                category: actionCommonCategories_1.Categories.View,
                precondition,
                metadata: description ? { description } : undefined,
                f1: true
            });
            this.settingName = settingName;
            this.value = value;
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            return configurationService.updateValue(this.settingName, this.value);
        }
    }
    // --- Hide Editor Tabs
    class HideEditorTabsAction extends AbstractSetShowTabsAction {
        static { this.ID = 'workbench.action.hideEditorTabs'; }
        constructor() {
            const precondition = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */}`, "none" /* EditorTabsMode.NONE */).negate(), contextkeys_2.InEditorZenModeContext.negate());
            const title = (0, nls_1.localize2)('hideEditorTabs', 'Hide Editor Tabs');
            super("workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */, "none" /* EditorTabsMode.NONE */, title, HideEditorTabsAction.ID, precondition, (0, nls_1.localize2)('hideEditorTabsDescription', "Hide Tab Bar"));
        }
    }
    exports.HideEditorTabsAction = HideEditorTabsAction;
    class ZenHideEditorTabsAction extends AbstractSetShowTabsAction {
        static { this.ID = 'workbench.action.zenHideEditorTabs'; }
        constructor() {
            const precondition = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"zenMode.showTabs" /* ZenModeSettings.SHOW_TABS */}`, "none" /* EditorTabsMode.NONE */).negate(), contextkeys_2.InEditorZenModeContext);
            const title = (0, nls_1.localize2)('hideEditorTabsZenMode', 'Hide Editor Tabs in Zen Mode');
            super("zenMode.showTabs" /* ZenModeSettings.SHOW_TABS */, "none" /* EditorTabsMode.NONE */, title, ZenHideEditorTabsAction.ID, precondition, (0, nls_1.localize2)('hideEditorTabsZenModeDescription', "Hide Tab Bar in Zen Mode"));
        }
    }
    exports.ZenHideEditorTabsAction = ZenHideEditorTabsAction;
    // --- Show Multiple Editor Tabs
    class ShowMultipleEditorTabsAction extends AbstractSetShowTabsAction {
        static { this.ID = 'workbench.action.showMultipleEditorTabs'; }
        constructor() {
            const precondition = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */}`, "multiple" /* EditorTabsMode.MULTIPLE */).negate(), contextkeys_2.InEditorZenModeContext.negate());
            const title = (0, nls_1.localize2)('showMultipleEditorTabs', 'Show Multiple Editor Tabs');
            super("workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */, "multiple" /* EditorTabsMode.MULTIPLE */, title, ShowMultipleEditorTabsAction.ID, precondition, (0, nls_1.localize2)('showMultipleEditorTabsDescription', "Show Tab Bar with multiple tabs"));
        }
    }
    exports.ShowMultipleEditorTabsAction = ShowMultipleEditorTabsAction;
    class ZenShowMultipleEditorTabsAction extends AbstractSetShowTabsAction {
        static { this.ID = 'workbench.action.zenShowMultipleEditorTabs'; }
        constructor() {
            const precondition = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"zenMode.showTabs" /* ZenModeSettings.SHOW_TABS */}`, "multiple" /* EditorTabsMode.MULTIPLE */).negate(), contextkeys_2.InEditorZenModeContext);
            const title = (0, nls_1.localize2)('showMultipleEditorTabsZenMode', 'Show Multiple Editor Tabs in Zen Mode');
            super("zenMode.showTabs" /* ZenModeSettings.SHOW_TABS */, "multiple" /* EditorTabsMode.MULTIPLE */, title, ZenShowMultipleEditorTabsAction.ID, precondition, (0, nls_1.localize2)('showMultipleEditorTabsZenModeDescription', "Show Tab Bar in Zen Mode"));
        }
    }
    exports.ZenShowMultipleEditorTabsAction = ZenShowMultipleEditorTabsAction;
    // --- Show Single Editor Tab
    class ShowSingleEditorTabAction extends AbstractSetShowTabsAction {
        static { this.ID = 'workbench.action.showEditorTab'; }
        constructor() {
            const precondition = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */}`, "single" /* EditorTabsMode.SINGLE */).negate(), contextkeys_2.InEditorZenModeContext.negate());
            const title = (0, nls_1.localize2)('showSingleEditorTab', 'Show Single Editor Tab');
            super("workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */, "single" /* EditorTabsMode.SINGLE */, title, ShowSingleEditorTabAction.ID, precondition, (0, nls_1.localize2)('showSingleEditorTabDescription', "Show Tab Bar with one Tab"));
        }
    }
    exports.ShowSingleEditorTabAction = ShowSingleEditorTabAction;
    class ZenShowSingleEditorTabAction extends AbstractSetShowTabsAction {
        static { this.ID = 'workbench.action.zenShowEditorTab'; }
        constructor() {
            const precondition = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"zenMode.showTabs" /* ZenModeSettings.SHOW_TABS */}`, "single" /* EditorTabsMode.SINGLE */).negate(), contextkeys_2.InEditorZenModeContext);
            const title = (0, nls_1.localize2)('showSingleEditorTabZenMode', 'Show Single Editor Tab in Zen Mode');
            super("zenMode.showTabs" /* ZenModeSettings.SHOW_TABS */, "single" /* EditorTabsMode.SINGLE */, title, ZenShowSingleEditorTabAction.ID, precondition, (0, nls_1.localize2)('showSingleEditorTabZenModeDescription', "Show Tab Bar in Zen Mode with one Tab"));
        }
    }
    exports.ZenShowSingleEditorTabAction = ZenShowSingleEditorTabAction;
    (0, actions_1.registerAction2)(HideEditorTabsAction);
    (0, actions_1.registerAction2)(ZenHideEditorTabsAction);
    (0, actions_1.registerAction2)(ShowMultipleEditorTabsAction);
    (0, actions_1.registerAction2)(ZenShowMultipleEditorTabsAction);
    (0, actions_1.registerAction2)(ShowSingleEditorTabAction);
    (0, actions_1.registerAction2)(ZenShowSingleEditorTabAction);
    // --- Tab Bar Submenu in View Appearance Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarAppearanceMenu, {
        submenu: actions_1.MenuId.EditorTabsBarShowTabsSubmenu,
        title: (0, nls_1.localize)('tabBar', "Tab Bar"),
        group: '3_workbench_layout_move',
        order: 10,
        when: contextkeys_2.InEditorZenModeContext.negate()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarAppearanceMenu, {
        submenu: actions_1.MenuId.EditorTabsBarShowTabsZenModeSubmenu,
        title: (0, nls_1.localize)('tabBar', "Tab Bar"),
        group: '3_workbench_layout_move',
        order: 10,
        when: contextkeys_2.InEditorZenModeContext
    });
    // --- Show Editor Actions in Title Bar
    class EditorActionsTitleBarAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.editorActionsTitleBar'; }
        constructor() {
            super({
                id: EditorActionsTitleBarAction.ID,
                title: (0, nls_1.localize2)('moveEditorActionsToTitleBar', "Move Editor Actions to Title Bar"),
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */}`, "titleBar" /* EditorActionsLocation.TITLEBAR */).negate(),
                metadata: { description: (0, nls_1.localize2)('moveEditorActionsToTitleBarDescription', "Move Editor Actions from the tab bar to the title bar") },
                f1: true
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            return configurationService.updateValue("workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */, "titleBar" /* EditorActionsLocation.TITLEBAR */);
        }
    }
    exports.EditorActionsTitleBarAction = EditorActionsTitleBarAction;
    (0, actions_1.registerAction2)(EditorActionsTitleBarAction);
    // --- Editor Actions Default Position
    class EditorActionsDefaultAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.editorActionsDefault'; }
        constructor() {
            super({
                id: EditorActionsDefaultAction.ID,
                title: (0, nls_1.localize2)('moveEditorActionsToTabBar', "Move Editor Actions to Tab Bar"),
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */}`, "default" /* EditorActionsLocation.DEFAULT */).negate(), contextkey_1.ContextKeyExpr.equals(`config.${"workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */}`, "none" /* EditorTabsMode.NONE */).negate()),
                metadata: { description: (0, nls_1.localize2)('moveEditorActionsToTabBarDescription', "Move Editor Actions from the title bar to the tab bar") },
                f1: true
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            return configurationService.updateValue("workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */, "default" /* EditorActionsLocation.DEFAULT */);
        }
    }
    exports.EditorActionsDefaultAction = EditorActionsDefaultAction;
    (0, actions_1.registerAction2)(EditorActionsDefaultAction);
    // --- Hide Editor Actions
    class HideEditorActionsAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.hideEditorActions'; }
        constructor() {
            super({
                id: HideEditorActionsAction.ID,
                title: (0, nls_1.localize2)('hideEditorActons', "Hide Editor Actions"),
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */}`, "hidden" /* EditorActionsLocation.HIDDEN */).negate(),
                metadata: { description: (0, nls_1.localize2)('hideEditorActonsDescription', "Hide Editor Actions in the tab and title bar") },
                f1: true
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            return configurationService.updateValue("workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */, "hidden" /* EditorActionsLocation.HIDDEN */);
        }
    }
    exports.HideEditorActionsAction = HideEditorActionsAction;
    (0, actions_1.registerAction2)(HideEditorActionsAction);
    // --- Hide Editor Actions
    class ShowEditorActionsAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.showEditorActions'; }
        constructor() {
            super({
                id: ShowEditorActionsAction.ID,
                title: (0, nls_1.localize2)('showEditorActons', "Show Editor Actions"),
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */}`, "hidden" /* EditorActionsLocation.HIDDEN */),
                metadata: { description: (0, nls_1.localize2)('showEditorActonsDescription', "Make Editor Actions visible.") },
                f1: true
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            return configurationService.updateValue("workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */, "default" /* EditorActionsLocation.DEFAULT */);
        }
    }
    exports.ShowEditorActionsAction = ShowEditorActionsAction;
    (0, actions_1.registerAction2)(ShowEditorActionsAction);
    // --- Editor Actions Position Submenu in View Appearance Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarAppearanceMenu, {
        submenu: actions_1.MenuId.EditorActionsPositionSubmenu,
        title: (0, nls_1.localize)('editorActionsPosition', "Editor Actions Position"),
        group: '3_workbench_layout_move',
        order: 11
    });
    // --- Toggle Pinned Tabs On Separate Row
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleSeparatePinnedEditorTabs',
                title: (0, nls_1.localize2)('toggleSeparatePinnedEditorTabs', "Separate Pinned Editor Tabs"),
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */}`, "multiple" /* EditorTabsMode.MULTIPLE */),
                metadata: { description: (0, nls_1.localize2)('toggleSeparatePinnedEditorTabsDescription', "Toggle whether pinned editor tabs are shown on a separate row above unpinned tabs.") },
                f1: true
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const oldettingValue = configurationService.getValue('workbench.editor.pinnedTabsOnSeparateRow');
            const newSettingValue = !oldettingValue;
            return configurationService.updateValue('workbench.editor.pinnedTabsOnSeparateRow', newSettingValue);
        }
    });
    // --- Toggle Zen Mode
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleZenMode',
                title: {
                    ...(0, nls_1.localize2)('toggleZenMode', "Toggle Zen Mode"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miToggleZenMode', comment: ['&& denotes a mnemonic'] }, "Zen Mode"),
                },
                precondition: contextkeys_2.IsAuxiliaryWindowFocusedContext.toNegated(),
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 56 /* KeyCode.KeyZ */)
                },
                toggled: contextkeys_2.InEditorZenModeContext,
                menu: [{
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '1_toggle_view',
                        order: 2
                    }]
            });
        }
        run(accessor) {
            return accessor.get(layoutService_1.IWorkbenchLayoutService).toggleZenMode();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.exitZenMode',
        weight: 100 /* KeybindingWeight.EditorContrib */ - 1000,
        handler(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            if (contextkeys_2.InEditorZenModeContext.getValue(contextKeyService)) {
                layoutService.toggleZenMode();
            }
        },
        when: contextkeys_2.InEditorZenModeContext,
        primary: (0, keyCodes_1.KeyChord)(9 /* KeyCode.Escape */, 9 /* KeyCode.Escape */)
    });
    // --- Toggle Menu Bar
    if (platform_1.isWindows || platform_1.isLinux || platform_1.isWeb) {
        (0, actions_1.registerAction2)(class ToggleMenubarAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.toggleMenuBar',
                    title: {
                        ...(0, nls_1.localize2)('toggleMenuBar', "Toggle Menu Bar"),
                        mnemonicTitle: (0, nls_1.localize)({ key: 'miMenuBar', comment: ['&& denotes a mnemonic'] }, "Menu &&Bar"),
                    },
                    category: actionCommonCategories_1.Categories.View,
                    f1: true,
                    toggled: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsMacNativeContext.toNegated(), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'hidden'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'toggle'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'compact')),
                    menu: [{
                            id: actions_1.MenuId.MenubarAppearanceMenu,
                            group: '2_workbench_layout',
                            order: 0
                        }]
                });
            }
            run(accessor) {
                return accessor.get(layoutService_1.IWorkbenchLayoutService).toggleMenuBar();
            }
        });
        // Add separately to title bar context menu so we can use a different title
        for (const menuId of [actions_1.MenuId.TitleBarContext, actions_1.MenuId.TitleBarTitleContext]) {
            actions_1.MenuRegistry.appendMenuItem(menuId, {
                command: {
                    id: 'workbench.action.toggleMenuBar',
                    title: (0, nls_1.localize)('miMenuBarNoMnemonic', "Menu Bar"),
                    toggled: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsMacNativeContext.toNegated(), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'hidden'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'toggle'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'compact'))
                },
                when: contextkey_1.ContextKeyExpr.and(contextkeys_2.IsAuxiliaryWindowFocusedContext.toNegated(), contextkey_1.ContextKeyExpr.notEquals(contextkeys_2.TitleBarStyleContext.key, "native" /* TitlebarStyle.NATIVE */), contextkeys_2.IsMainWindowFullscreenContext.negate()),
                group: '2_config',
                order: 0
            });
        }
    }
    // --- Reset View Locations
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.resetViewLocations',
                title: (0, nls_1.localize2)('resetViewLocations', "Reset View Locations"),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        run(accessor) {
            return accessor.get(views_1.IViewDescriptorService).reset();
        }
    });
    // --- Move View
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.moveView',
                title: (0, nls_1.localize2)('moveView', "Move View"),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        async run(accessor) {
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const paneCompositePartService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const focusedViewId = contextkeys_2.FocusedViewContext.getValue(contextKeyService);
            let viewId;
            if (focusedViewId && viewDescriptorService.getViewDescriptorById(focusedViewId)?.canMoveView) {
                viewId = focusedViewId;
            }
            try {
                viewId = await this.getView(quickInputService, viewDescriptorService, paneCompositePartService, viewId);
                if (!viewId) {
                    return;
                }
                const moveFocusedViewAction = new MoveFocusedViewAction();
                instantiationService.invokeFunction(accessor => moveFocusedViewAction.run(accessor, viewId));
            }
            catch { }
        }
        getViewItems(viewDescriptorService, paneCompositePartService) {
            const results = [];
            const viewlets = paneCompositePartService.getVisiblePaneCompositeIds(0 /* ViewContainerLocation.Sidebar */);
            viewlets.forEach(viewletId => {
                const container = viewDescriptorService.getViewContainerById(viewletId);
                const containerModel = viewDescriptorService.getViewContainerModel(container);
                let hasAddedView = false;
                containerModel.visibleViewDescriptors.forEach(viewDescriptor => {
                    if (viewDescriptor.canMoveView) {
                        if (!hasAddedView) {
                            results.push({
                                type: 'separator',
                                label: (0, nls_1.localize)('sidebarContainer', "Side Bar / {0}", containerModel.title)
                            });
                            hasAddedView = true;
                        }
                        results.push({
                            id: viewDescriptor.id,
                            label: viewDescriptor.name.value
                        });
                    }
                });
            });
            const panels = paneCompositePartService.getPinnedPaneCompositeIds(1 /* ViewContainerLocation.Panel */);
            panels.forEach(panel => {
                const container = viewDescriptorService.getViewContainerById(panel);
                const containerModel = viewDescriptorService.getViewContainerModel(container);
                let hasAddedView = false;
                containerModel.visibleViewDescriptors.forEach(viewDescriptor => {
                    if (viewDescriptor.canMoveView) {
                        if (!hasAddedView) {
                            results.push({
                                type: 'separator',
                                label: (0, nls_1.localize)('panelContainer', "Panel / {0}", containerModel.title)
                            });
                            hasAddedView = true;
                        }
                        results.push({
                            id: viewDescriptor.id,
                            label: viewDescriptor.name.value
                        });
                    }
                });
            });
            const sidePanels = paneCompositePartService.getPinnedPaneCompositeIds(2 /* ViewContainerLocation.AuxiliaryBar */);
            sidePanels.forEach(panel => {
                const container = viewDescriptorService.getViewContainerById(panel);
                const containerModel = viewDescriptorService.getViewContainerModel(container);
                let hasAddedView = false;
                containerModel.visibleViewDescriptors.forEach(viewDescriptor => {
                    if (viewDescriptor.canMoveView) {
                        if (!hasAddedView) {
                            results.push({
                                type: 'separator',
                                label: (0, nls_1.localize)('secondarySideBarContainer', "Secondary Side Bar / {0}", containerModel.title)
                            });
                            hasAddedView = true;
                        }
                        results.push({
                            id: viewDescriptor.id,
                            label: viewDescriptor.name.value
                        });
                    }
                });
            });
            return results;
        }
        async getView(quickInputService, viewDescriptorService, paneCompositePartService, viewId) {
            const quickPick = quickInputService.createQuickPick();
            quickPick.placeholder = (0, nls_1.localize)('moveFocusedView.selectView', "Select a View to Move");
            quickPick.items = this.getViewItems(viewDescriptorService, paneCompositePartService);
            quickPick.selectedItems = quickPick.items.filter(item => item.id === viewId);
            return new Promise((resolve, reject) => {
                quickPick.onDidAccept(() => {
                    const viewId = quickPick.selectedItems[0];
                    if (viewId.id) {
                        resolve(viewId.id);
                    }
                    else {
                        reject();
                    }
                    quickPick.hide();
                });
                quickPick.onDidHide(() => reject());
                quickPick.show();
            });
        }
    });
    // --- Move Focused View
    class MoveFocusedViewAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.moveFocusedView',
                title: (0, nls_1.localize2)('moveFocusedView', "Move Focused View"),
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkeys_2.FocusedViewContext.notEqualsTo(''),
                f1: true
            });
        }
        run(accessor, viewId) {
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const paneCompositePartService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const focusedViewId = viewId || contextkeys_2.FocusedViewContext.getValue(contextKeyService);
            if (focusedViewId === undefined || focusedViewId.trim() === '') {
                dialogService.error((0, nls_1.localize)('moveFocusedView.error.noFocusedView', "There is no view currently focused."));
                return;
            }
            const viewDescriptor = viewDescriptorService.getViewDescriptorById(focusedViewId);
            if (!viewDescriptor || !viewDescriptor.canMoveView) {
                dialogService.error((0, nls_1.localize)('moveFocusedView.error.nonMovableView', "The currently focused view is not movable."));
                return;
            }
            const quickPick = quickInputService.createQuickPick();
            quickPick.placeholder = (0, nls_1.localize)('moveFocusedView.selectDestination', "Select a Destination for the View");
            quickPick.title = (0, nls_1.localize)({ key: 'moveFocusedView.title', comment: ['{0} indicates the title of the view the user has selected to move.'] }, "View: Move {0}", viewDescriptor.name.value);
            const items = [];
            const currentContainer = viewDescriptorService.getViewContainerByViewId(focusedViewId);
            const currentLocation = viewDescriptorService.getViewLocationById(focusedViewId);
            const isViewSolo = viewDescriptorService.getViewContainerModel(currentContainer).allViewDescriptors.length === 1;
            if (!(isViewSolo && currentLocation === 1 /* ViewContainerLocation.Panel */)) {
                items.push({
                    id: '_.panel.newcontainer',
                    label: (0, nls_1.localize)({ key: 'moveFocusedView.newContainerInPanel', comment: ['Creates a new top-level tab in the panel.'] }, "New Panel Entry"),
                });
            }
            if (!(isViewSolo && currentLocation === 0 /* ViewContainerLocation.Sidebar */)) {
                items.push({
                    id: '_.sidebar.newcontainer',
                    label: (0, nls_1.localize)('moveFocusedView.newContainerInSidebar', "New Side Bar Entry")
                });
            }
            if (!(isViewSolo && currentLocation === 2 /* ViewContainerLocation.AuxiliaryBar */)) {
                items.push({
                    id: '_.auxiliarybar.newcontainer',
                    label: (0, nls_1.localize)('moveFocusedView.newContainerInSidePanel', "New Secondary Side Bar Entry")
                });
            }
            items.push({
                type: 'separator',
                label: (0, nls_1.localize)('sidebar', "Side Bar")
            });
            const pinnedViewlets = paneCompositePartService.getVisiblePaneCompositeIds(0 /* ViewContainerLocation.Sidebar */);
            items.push(...pinnedViewlets
                .filter(viewletId => {
                if (viewletId === viewDescriptorService.getViewContainerByViewId(focusedViewId).id) {
                    return false;
                }
                return !viewDescriptorService.getViewContainerById(viewletId).rejectAddedViews;
            })
                .map(viewletId => {
                return {
                    id: viewletId,
                    label: viewDescriptorService.getViewContainerModel(viewDescriptorService.getViewContainerById(viewletId)).title
                };
            }));
            items.push({
                type: 'separator',
                label: (0, nls_1.localize)('panel', "Panel")
            });
            const pinnedPanels = paneCompositePartService.getPinnedPaneCompositeIds(1 /* ViewContainerLocation.Panel */);
            items.push(...pinnedPanels
                .filter(panel => {
                if (panel === viewDescriptorService.getViewContainerByViewId(focusedViewId).id) {
                    return false;
                }
                return !viewDescriptorService.getViewContainerById(panel).rejectAddedViews;
            })
                .map(panel => {
                return {
                    id: panel,
                    label: viewDescriptorService.getViewContainerModel(viewDescriptorService.getViewContainerById(panel)).title
                };
            }));
            items.push({
                type: 'separator',
                label: (0, nls_1.localize)('secondarySideBar', "Secondary Side Bar")
            });
            const pinnedAuxPanels = paneCompositePartService.getPinnedPaneCompositeIds(2 /* ViewContainerLocation.AuxiliaryBar */);
            items.push(...pinnedAuxPanels
                .filter(panel => {
                if (panel === viewDescriptorService.getViewContainerByViewId(focusedViewId).id) {
                    return false;
                }
                return !viewDescriptorService.getViewContainerById(panel).rejectAddedViews;
            })
                .map(panel => {
                return {
                    id: panel,
                    label: viewDescriptorService.getViewContainerModel(viewDescriptorService.getViewContainerById(panel)).title
                };
            }));
            quickPick.items = items;
            quickPick.onDidAccept(() => {
                const destination = quickPick.selectedItems[0];
                if (destination.id === '_.panel.newcontainer') {
                    viewDescriptorService.moveViewToLocation(viewDescriptor, 1 /* ViewContainerLocation.Panel */, this.desc.id);
                    viewsService.openView(focusedViewId, true);
                }
                else if (destination.id === '_.sidebar.newcontainer') {
                    viewDescriptorService.moveViewToLocation(viewDescriptor, 0 /* ViewContainerLocation.Sidebar */, this.desc.id);
                    viewsService.openView(focusedViewId, true);
                }
                else if (destination.id === '_.auxiliarybar.newcontainer') {
                    viewDescriptorService.moveViewToLocation(viewDescriptor, 2 /* ViewContainerLocation.AuxiliaryBar */, this.desc.id);
                    viewsService.openView(focusedViewId, true);
                }
                else if (destination.id) {
                    viewDescriptorService.moveViewsToContainer([viewDescriptor], viewDescriptorService.getViewContainerById(destination.id), undefined, this.desc.id);
                    viewsService.openView(focusedViewId, true);
                }
                quickPick.hide();
            });
            quickPick.show();
        }
    }
    (0, actions_1.registerAction2)(MoveFocusedViewAction);
    // --- Reset Focused View Location
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.resetFocusedViewLocation',
                title: (0, nls_1.localize2)('resetFocusedViewLocation', "Reset Focused View Location"),
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                precondition: contextkeys_2.FocusedViewContext.notEqualsTo('')
            });
        }
        run(accessor) {
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const focusedViewId = contextkeys_2.FocusedViewContext.getValue(contextKeyService);
            let viewDescriptor = null;
            if (focusedViewId !== undefined && focusedViewId.trim() !== '') {
                viewDescriptor = viewDescriptorService.getViewDescriptorById(focusedViewId);
            }
            if (!viewDescriptor) {
                dialogService.error((0, nls_1.localize)('resetFocusedView.error.noFocusedView', "There is no view currently focused."));
                return;
            }
            const defaultContainer = viewDescriptorService.getDefaultContainerById(viewDescriptor.id);
            if (!defaultContainer || defaultContainer === viewDescriptorService.getViewContainerByViewId(viewDescriptor.id)) {
                return;
            }
            viewDescriptorService.moveViewsToContainer([viewDescriptor], defaultContainer, undefined, this.desc.id);
            viewsService.openView(viewDescriptor.id, true);
        }
    });
    // --- Resize View
    class BaseResizeViewAction extends actions_1.Action2 {
        static { this.RESIZE_INCREMENT = 60; } // This is a css pixel size
        resizePart(widthChange, heightChange, layoutService, partToResize) {
            let part;
            if (partToResize === undefined) {
                const isEditorFocus = layoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */);
                const isSidebarFocus = layoutService.hasFocus("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                const isPanelFocus = layoutService.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */);
                const isAuxiliaryBarFocus = layoutService.hasFocus("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
                if (isSidebarFocus) {
                    part = "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */;
                }
                else if (isPanelFocus) {
                    part = "workbench.parts.panel" /* Parts.PANEL_PART */;
                }
                else if (isEditorFocus) {
                    part = "workbench.parts.editor" /* Parts.EDITOR_PART */;
                }
                else if (isAuxiliaryBarFocus) {
                    part = "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */;
                }
            }
            else {
                part = partToResize;
            }
            if (part) {
                layoutService.resizePart(part, widthChange, heightChange);
            }
        }
    }
    class IncreaseViewSizeAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.increaseViewSize',
                title: (0, nls_1.localize2)('increaseViewSize', 'Increase Current View Size'),
                f1: true,
                precondition: contextkeys_2.IsAuxiliaryWindowFocusedContext.toNegated()
            });
        }
        run(accessor) {
            this.resizePart(BaseResizeViewAction.RESIZE_INCREMENT, BaseResizeViewAction.RESIZE_INCREMENT, accessor.get(layoutService_1.IWorkbenchLayoutService));
        }
    }
    class IncreaseViewWidthAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.increaseViewWidth',
                title: (0, nls_1.localize2)('increaseEditorWidth', 'Increase Editor Width'),
                f1: true,
                precondition: contextkeys_2.IsAuxiliaryWindowFocusedContext.toNegated()
            });
        }
        run(accessor) {
            this.resizePart(BaseResizeViewAction.RESIZE_INCREMENT, 0, accessor.get(layoutService_1.IWorkbenchLayoutService), "workbench.parts.editor" /* Parts.EDITOR_PART */);
        }
    }
    class IncreaseViewHeightAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.increaseViewHeight',
                title: (0, nls_1.localize2)('increaseEditorHeight', 'Increase Editor Height'),
                f1: true,
                precondition: contextkeys_2.IsAuxiliaryWindowFocusedContext.toNegated()
            });
        }
        run(accessor) {
            this.resizePart(0, BaseResizeViewAction.RESIZE_INCREMENT, accessor.get(layoutService_1.IWorkbenchLayoutService), "workbench.parts.editor" /* Parts.EDITOR_PART */);
        }
    }
    class DecreaseViewSizeAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.decreaseViewSize',
                title: (0, nls_1.localize2)('decreaseViewSize', 'Decrease Current View Size'),
                f1: true,
                precondition: contextkeys_2.IsAuxiliaryWindowFocusedContext.toNegated()
            });
        }
        run(accessor) {
            this.resizePart(-BaseResizeViewAction.RESIZE_INCREMENT, -BaseResizeViewAction.RESIZE_INCREMENT, accessor.get(layoutService_1.IWorkbenchLayoutService));
        }
    }
    class DecreaseViewWidthAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.decreaseViewWidth',
                title: (0, nls_1.localize2)('decreaseEditorWidth', 'Decrease Editor Width'),
                f1: true,
                precondition: contextkeys_2.IsAuxiliaryWindowFocusedContext.toNegated()
            });
        }
        run(accessor) {
            this.resizePart(-BaseResizeViewAction.RESIZE_INCREMENT, 0, accessor.get(layoutService_1.IWorkbenchLayoutService), "workbench.parts.editor" /* Parts.EDITOR_PART */);
        }
    }
    class DecreaseViewHeightAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.decreaseViewHeight',
                title: (0, nls_1.localize2)('decreaseEditorHeight', 'Decrease Editor Height'),
                f1: true,
                precondition: contextkeys_2.IsAuxiliaryWindowFocusedContext.toNegated()
            });
        }
        run(accessor) {
            this.resizePart(0, -BaseResizeViewAction.RESIZE_INCREMENT, accessor.get(layoutService_1.IWorkbenchLayoutService), "workbench.parts.editor" /* Parts.EDITOR_PART */);
        }
    }
    (0, actions_1.registerAction2)(IncreaseViewSizeAction);
    (0, actions_1.registerAction2)(IncreaseViewWidthAction);
    (0, actions_1.registerAction2)(IncreaseViewHeightAction);
    (0, actions_1.registerAction2)(DecreaseViewSizeAction);
    (0, actions_1.registerAction2)(DecreaseViewWidthAction);
    (0, actions_1.registerAction2)(DecreaseViewHeightAction);
    function isContextualLayoutVisualIcon(icon) {
        return icon.iconA !== undefined;
    }
    const CreateToggleLayoutItem = (id, active, label, visualIcon) => {
        return {
            id,
            active,
            label,
            visualIcon,
            activeIcon: codicons_1.Codicon.eye,
            inactiveIcon: codicons_1.Codicon.eyeClosed,
            activeAriaLabel: (0, nls_1.localize)('selectToHide', "Select to Hide"),
            inactiveAriaLabel: (0, nls_1.localize)('selectToShow', "Select to Show"),
            useButtons: true,
        };
    };
    const CreateOptionLayoutItem = (id, active, label, visualIcon) => {
        return {
            id,
            active,
            label,
            visualIcon,
            activeIcon: codicons_1.Codicon.check,
            activeAriaLabel: (0, nls_1.localize)('active', "Active"),
            useButtons: false
        };
    };
    const MenuBarToggledContext = contextkey_1.ContextKeyExpr.and(contextkeys_1.IsMacNativeContext.toNegated(), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'hidden'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'toggle'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'compact'));
    const ToggleVisibilityActions = [];
    if (!platform_1.isMacintosh || !platform_1.isNative) {
        ToggleVisibilityActions.push(CreateToggleLayoutItem('workbench.action.toggleMenuBar', MenuBarToggledContext, (0, nls_1.localize)('menuBar', "Menu Bar"), menubarIcon));
    }
    ToggleVisibilityActions.push(...[
        CreateToggleLayoutItem(exports.ToggleActivityBarVisibilityActionId, contextkey_1.ContextKeyExpr.notEquals('config.workbench.activityBar.location', 'hidden'), (0, nls_1.localize)('activityBar', "Activity Bar"), { whenA: contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left'), iconA: activityBarLeftIcon, iconB: activityBarRightIcon }),
        CreateToggleLayoutItem(ToggleSidebarVisibilityAction.ID, contextkeys_2.SideBarVisibleContext, (0, nls_1.localize)('sideBar', "Primary Side Bar"), { whenA: contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left'), iconA: panelLeftIcon, iconB: panelRightIcon }),
        CreateToggleLayoutItem(auxiliaryBarActions_1.ToggleAuxiliaryBarAction.ID, contextkeys_2.AuxiliaryBarVisibleContext, (0, nls_1.localize)('secondarySideBar', "Secondary Side Bar"), { whenA: contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left'), iconA: panelRightIcon, iconB: panelLeftIcon }),
        CreateToggleLayoutItem(panelActions_1.TogglePanelAction.ID, contextkeys_2.PanelVisibleContext, (0, nls_1.localize)('panel', "Panel"), panelIcon),
        CreateToggleLayoutItem(ToggleStatusbarVisibilityAction.ID, contextkey_1.ContextKeyExpr.equals('config.workbench.statusBar.visible', true), (0, nls_1.localize)('statusBar', "Status Bar"), statusBarIcon),
    ]);
    const MoveSideBarActions = [
        CreateOptionLayoutItem(MoveSidebarLeftAction.ID, contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left'), (0, nls_1.localize)('leftSideBar', "Left"), panelLeftIcon),
        CreateOptionLayoutItem(MoveSidebarRightAction.ID, contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'), (0, nls_1.localize)('rightSideBar', "Right"), panelRightIcon),
    ];
    const AlignPanelActions = [
        CreateOptionLayoutItem('workbench.action.alignPanelLeft', contextkeys_2.PanelAlignmentContext.isEqualTo('left'), (0, nls_1.localize)('leftPanel', "Left"), panelAlignmentLeftIcon),
        CreateOptionLayoutItem('workbench.action.alignPanelRight', contextkeys_2.PanelAlignmentContext.isEqualTo('right'), (0, nls_1.localize)('rightPanel', "Right"), panelAlignmentRightIcon),
        CreateOptionLayoutItem('workbench.action.alignPanelCenter', contextkeys_2.PanelAlignmentContext.isEqualTo('center'), (0, nls_1.localize)('centerPanel', "Center"), panelAlignmentCenterIcon),
        CreateOptionLayoutItem('workbench.action.alignPanelJustify', contextkeys_2.PanelAlignmentContext.isEqualTo('justify'), (0, nls_1.localize)('justifyPanel', "Justify"), panelAlignmentJustifyIcon),
    ];
    const MiscLayoutOptions = [
        CreateOptionLayoutItem('workbench.action.toggleFullScreen', contextkeys_2.IsMainWindowFullscreenContext, (0, nls_1.localize)('fullscreen', "Full Screen"), fullscreenIcon),
        CreateOptionLayoutItem('workbench.action.toggleZenMode', contextkeys_2.InEditorZenModeContext, (0, nls_1.localize)('zenMode', "Zen Mode"), zenModeIcon),
        CreateOptionLayoutItem('workbench.action.toggleCenteredLayout', contextkeys_2.IsMainEditorCenteredLayoutContext, (0, nls_1.localize)('centeredLayout', "Centered Layout"), centerLayoutIcon),
    ];
    const LayoutContextKeySet = new Set();
    for (const { active } of [...ToggleVisibilityActions, ...MoveSideBarActions, ...AlignPanelActions, ...MiscLayoutOptions]) {
        for (const key of active.keys()) {
            LayoutContextKeySet.add(key);
        }
    }
    (0, actions_1.registerAction2)(class CustomizeLayoutAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.customizeLayout',
                title: (0, nls_1.localize2)('customizeLayout', "Customize Layout..."),
                f1: true,
                icon: configureLayoutIcon,
                menu: [
                    {
                        id: actions_1.MenuId.LayoutControlMenuSubmenu,
                        group: 'z_end',
                    },
                    {
                        id: actions_1.MenuId.LayoutControlMenu,
                        when: contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both'),
                        group: 'z_end'
                    }
                ]
            });
        }
        getItems(contextKeyService, keybindingService) {
            const toQuickPickItem = (item) => {
                const toggled = item.active.evaluate(contextKeyService.getContext(null));
                let label = item.useButtons ?
                    item.label :
                    item.label + (toggled && item.activeIcon ? ` $(${item.activeIcon.id})` : (!toggled && item.inactiveIcon ? ` $(${item.inactiveIcon.id})` : ''));
                const ariaLabel = item.label + (toggled && item.activeAriaLabel ? ` (${item.activeAriaLabel})` : (!toggled && item.inactiveAriaLabel ? ` (${item.inactiveAriaLabel})` : ''));
                if (item.visualIcon) {
                    let icon = item.visualIcon;
                    if (isContextualLayoutVisualIcon(icon)) {
                        const useIconA = icon.whenA.evaluate(contextKeyService.getContext(null));
                        icon = useIconA ? icon.iconA : icon.iconB;
                    }
                    label = `$(${icon.id}) ${label}`;
                }
                const icon = toggled ? item.activeIcon : item.inactiveIcon;
                return {
                    type: 'item',
                    id: item.id,
                    label,
                    ariaLabel,
                    keybinding: keybindingService.lookupKeybinding(item.id, contextKeyService),
                    buttons: !item.useButtons ? undefined : [
                        {
                            alwaysVisible: false,
                            tooltip: ariaLabel,
                            iconClass: icon ? themables_1.ThemeIcon.asClassName(icon) : undefined
                        }
                    ]
                };
            };
            return [
                {
                    type: 'separator',
                    label: (0, nls_1.localize)('toggleVisibility', "Visibility")
                },
                ...ToggleVisibilityActions.map(toQuickPickItem),
                {
                    type: 'separator',
                    label: (0, nls_1.localize)('sideBarPosition', "Primary Side Bar Position")
                },
                ...MoveSideBarActions.map(toQuickPickItem),
                {
                    type: 'separator',
                    label: (0, nls_1.localize)('panelAlignment', "Panel Alignment")
                },
                ...AlignPanelActions.map(toQuickPickItem),
                {
                    type: 'separator',
                    label: (0, nls_1.localize)('layoutModes', "Modes"),
                },
                ...MiscLayoutOptions.map(toQuickPickItem),
            ];
        }
        run(accessor) {
            if (this._currentQuickPick) {
                this._currentQuickPick.hide();
                return;
            }
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const commandService = accessor.get(commands_1.ICommandService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickPick = quickInputService.createQuickPick();
            this._currentQuickPick = quickPick;
            quickPick.items = this.getItems(contextKeyService, keybindingService);
            quickPick.ignoreFocusOut = true;
            quickPick.hideInput = true;
            quickPick.title = (0, nls_1.localize)('customizeLayoutQuickPickTitle', "Customize Layout");
            const closeButton = {
                alwaysVisible: true,
                iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close),
                tooltip: (0, nls_1.localize)('close', "Close")
            };
            const resetButton = {
                alwaysVisible: true,
                iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.discard),
                tooltip: (0, nls_1.localize)('restore defaults', "Restore Defaults")
            };
            quickPick.buttons = [
                resetButton,
                closeButton
            ];
            const disposables = new lifecycle_1.DisposableStore();
            let selectedItem = undefined;
            disposables.add(contextKeyService.onDidChangeContext(changeEvent => {
                if (changeEvent.affectsSome(LayoutContextKeySet)) {
                    quickPick.items = this.getItems(contextKeyService, keybindingService);
                    if (selectedItem) {
                        quickPick.activeItems = quickPick.items.filter(item => item.id === selectedItem?.id);
                    }
                    setTimeout(() => quickInputService.focus(), 0);
                }
            }));
            quickPick.onDidAccept(event => {
                if (quickPick.selectedItems.length) {
                    selectedItem = quickPick.selectedItems[0];
                    commandService.executeCommand(selectedItem.id);
                }
            });
            quickPick.onDidTriggerItemButton(event => {
                if (event.item) {
                    selectedItem = event.item;
                    commandService.executeCommand(selectedItem.id);
                }
            });
            quickPick.onDidTriggerButton((button) => {
                if (button === closeButton) {
                    quickPick.hide();
                }
                else if (button === resetButton) {
                    const resetSetting = (id) => {
                        const config = configurationService.inspect(id);
                        configurationService.updateValue(id, config.defaultValue);
                    };
                    // Reset all layout options
                    resetSetting('workbench.activityBar.location');
                    resetSetting('workbench.sideBar.location');
                    resetSetting('workbench.statusBar.visible');
                    resetSetting('workbench.panel.defaultLocation');
                    if (!platform_1.isMacintosh || !platform_1.isNative) {
                        resetSetting('window.menuBarVisibility');
                    }
                    commandService.executeCommand('workbench.action.alignPanelCenter');
                }
            });
            quickPick.onDidHide(() => {
                quickPick.dispose();
            });
            quickPick.onDispose(() => {
                this._currentQuickPick = undefined;
                disposables.dispose();
            });
            quickPick.show();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL2FjdGlvbnMvbGF5b3V0QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErQmhHLGlCQUFpQjtJQUNqQixNQUFNLFdBQVcsR0FBRyxJQUFBLDJCQUFZLEVBQUMsU0FBUyxFQUFFLGtCQUFPLENBQUMsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7SUFDdkgsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsbUJBQW1CLEVBQUUsa0JBQU8sQ0FBQyxxQkFBcUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxrREFBa0QsQ0FBQyxDQUFDLENBQUM7SUFDOUssTUFBTSxvQkFBb0IsR0FBRyxJQUFBLDJCQUFZLEVBQUMsb0JBQW9CLEVBQUUsa0JBQU8sQ0FBQyxzQkFBc0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxtREFBbUQsQ0FBQyxDQUFDLENBQUM7SUFDbkwsTUFBTSxhQUFhLEdBQUcsSUFBQSwyQkFBWSxFQUFDLFlBQVksRUFBRSxrQkFBTyxDQUFDLGlCQUFpQixFQUFFLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDLENBQUM7SUFDakosTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLDJCQUFZLEVBQUMsZ0JBQWdCLEVBQUUsa0JBQU8sQ0FBQyxvQkFBb0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsd0RBQXdELENBQUMsQ0FBQyxDQUFDO0lBQzFLLE1BQU0sY0FBYyxHQUFHLElBQUEsMkJBQVksRUFBQyxhQUFhLEVBQUUsa0JBQU8sQ0FBQyxrQkFBa0IsRUFBRSxJ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