/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/iconRegistry", "vs/platform/action/common/actionCommonCategories", "vs/workbench/common/contextkeys", "vs/workbench/common/views", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, codicons_1, nls_1, actions_1, contextkey_1, iconRegistry_1, actionCommonCategories_1, contextkeys_1, views_1, layoutService_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleAuxiliaryBarAction = void 0;
    const auxiliaryBarRightIcon = (0, iconRegistry_1.registerIcon)('auxiliarybar-right-layout-icon', codicons_1.Codicon.layoutSidebarRight, (0, nls_1.localize)('toggleAuxiliaryIconRight', 'Icon to toggle the auxiliary bar off in its right position.'));
    const auxiliaryBarRightOffIcon = (0, iconRegistry_1.registerIcon)('auxiliarybar-right-off-layout-icon', codicons_1.Codicon.layoutSidebarRightOff, (0, nls_1.localize)('toggleAuxiliaryIconRightOn', 'Icon to toggle the auxiliary bar on in its right position.'));
    const auxiliaryBarLeftIcon = (0, iconRegistry_1.registerIcon)('auxiliarybar-left-layout-icon', codicons_1.Codicon.layoutSidebarLeft, (0, nls_1.localize)('toggleAuxiliaryIconLeft', 'Icon to toggle the auxiliary bar in its left position.'));
    const auxiliaryBarLeftOffIcon = (0, iconRegistry_1.registerIcon)('auxiliarybar-left-off-layout-icon', codicons_1.Codicon.layoutSidebarLeftOff, (0, nls_1.localize)('toggleAuxiliaryIconLeftOn', 'Icon to toggle the auxiliary bar on in its left position.'));
    class ToggleAuxiliaryBarAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.toggleAuxiliaryBar'; }
        static { this.LABEL = (0, nls_1.localize2)('toggleAuxiliaryBar', "Toggle Secondary Side Bar Visibility"); }
        constructor() {
            super({
                id: ToggleAuxiliaryBarAction.ID,
                title: ToggleAuxiliaryBarAction.LABEL,
                toggled: {
                    condition: contextkeys_1.AuxiliaryBarVisibleContext,
                    title: (0, nls_1.localize)('secondary sidebar', "Secondary Side Bar"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'secondary sidebar mnemonic', comment: ['&& denotes a mnemonic'] }, "Secondary Si&&de Bar"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 32 /* KeyCode.KeyB */
                },
                menu: [
                    {
                        id: actions_1.MenuId.LayoutControlMenuSubmenu,
                        group: '0_workbench_layout',
                        order: 1
                    },
                    {
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '2_workbench_layout',
                        order: 2
                    }
                ]
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.setPartHidden(layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */), "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
        }
    }
    exports.ToggleAuxiliaryBarAction = ToggleAuxiliaryBarAction;
    (0, actions_1.registerAction2)(ToggleAuxiliaryBarAction);
    (0, actions_1.registerAction2)(class FocusAuxiliaryBarAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.focusAuxiliaryBar'; }
        static { this.LABEL = (0, nls_1.localize2)('focusAuxiliaryBar', "Focus into Secondary Side Bar"); }
        constructor() {
            super({
                id: FocusAuxiliaryBarAction.ID,
                title: FocusAuxiliaryBarAction.LABEL,
                category: actionCommonCategories_1.Categories.View,
                f1: true,
            });
        }
        async run(accessor) {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            // Show auxiliary bar
            if (!layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)) {
                layoutService.setPartHidden(false, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            }
            // Focus into active composite
            const composite = paneCompositeService.getActivePaneComposite(2 /* ViewContainerLocation.AuxiliaryBar */);
            composite?.focus();
        }
    });
    actions_1.MenuRegistry.appendMenuItems([
        {
            id: actions_1.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: ToggleAuxiliaryBarAction.ID,
                    title: (0, nls_1.localize)('toggleSecondarySideBar', "Toggle Secondary Side Bar"),
                    toggled: { condition: contextkeys_1.AuxiliaryBarVisibleContext, icon: auxiliaryBarLeftIcon },
                    icon: auxiliaryBarLeftOffIcon,
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')), contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right')),
                order: 0
            }
        }, {
            id: actions_1.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: ToggleAuxiliaryBarAction.ID,
                    title: (0, nls_1.localize)('toggleSecondarySideBar', "Toggle Secondary Side Bar"),
                    toggled: { condition: contextkeys_1.AuxiliaryBarVisibleContext, icon: auxiliaryBarRightIcon },
                    icon: auxiliaryBarRightOffIcon,
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')), contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left')),
                order: 2
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleAuxiliaryBarAction.ID,
                    title: (0, nls_1.localize2)('hideAuxiliaryBar', 'Hide Secondary Side Bar'),
                },
                when: contextkey_1.ContextKeyExpr.and(contextkeys_1.AuxiliaryBarVisibleContext, contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(2 /* ViewContainerLocation.AuxiliaryBar */))),
                order: 2
            }
        }
    ]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5QmFyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2F1eGlsaWFyeWJhci9hdXhpbGlhcnlCYXJBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlCaEcsTUFBTSxxQkFBcUIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsZ0NBQWdDLEVBQUUsa0JBQU8sQ0FBQyxrQkFBa0IsRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSw2REFBNkQsQ0FBQyxDQUFDLENBQUM7SUFDOU0sTUFBTSx3QkFBd0IsR0FBRyxJQUFBLDJCQUFZLEVBQUMsb0NBQW9DLEVBQUUsa0JBQU8sQ0FBQyxxQkFBcUIsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSw0REFBNEQsQ0FBQyxDQUFDLENBQUM7SUFDek4sTUFBTSxvQkFBb0IsR0FBRyxJQUFBLDJCQUFZLEVBQUMsK0JBQStCLEVBQUUsa0JBQU8sQ0FBQyxpQkFBaUIsRUFBRSxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSx3REFBd0QsQ0FBQyxDQUFDLENBQUM7SUFDck0sTUFBTSx1QkFBdUIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsbUNBQW1DLEVBQUUsa0JBQU8sQ0FBQyxvQkFBb0IsRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSwyREFBMkQsQ0FBQyxDQUFDLENBQUM7SUFFcE4sTUFBYSx3QkFBeUIsU0FBUSxpQkFBTztpQkFFcEMsT0FBRSxHQUFHLHFDQUFxQyxDQUFDO2lCQUMzQyxVQUFLLEdBQUcsSUFBQSxlQUFTLEVBQUMsb0JBQW9CLEVBQUUsc0NBQXNDLENBQUMsQ0FBQztRQUVoRztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsd0JBQXdCLENBQUMsRUFBRTtnQkFDL0IsS0FBSyxFQUFFLHdCQUF3QixDQUFDLEtBQUs7Z0JBQ3JDLE9BQU8sRUFBRTtvQkFDUixTQUFTLEVBQUUsd0NBQTBCO29CQUNyQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsb0JBQW9CLENBQUM7b0JBQzFELGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSw0QkFBNEIsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsc0JBQXNCLENBQUM7aUJBQzFIO2dCQUVELFFBQVEsRUFBRSxtQ0FBVSxDQUFDLElBQUk7Z0JBQ3pCLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFVBQVUsRUFBRTtvQkFDWCxNQUFNLDZDQUFtQztvQkFDekMsT0FBTyxFQUFFLGdEQUEyQix3QkFBZTtpQkFDbkQ7Z0JBQ0QsSUFBSSxFQUFFO29CQUNMO3dCQUNDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLHdCQUF3Qjt3QkFDbkMsS0FBSyxFQUFFLG9CQUFvQjt3QkFDM0IsS0FBSyxFQUFFLENBQUM7cUJBQ1I7b0JBQ0Q7d0JBQ0MsRUFBRSxFQUFFLGdCQUFNLENBQUMscUJBQXFCO3dCQUNoQyxLQUFLLEVBQUUsb0JBQW9CO3dCQUMzQixLQUFLLEVBQUUsQ0FBQztxQkFDUjtpQkFDRDthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQzVDLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXVCLENBQUMsQ0FBQztZQUM1RCxhQUFhLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxTQUFTLDhEQUF5QiwrREFBMEIsQ0FBQztRQUN4RyxDQUFDOztJQXZDRiw0REF3Q0M7SUFFRCxJQUFBLHlCQUFlLEVBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUUxQyxJQUFBLHlCQUFlLEVBQUMsTUFBTSx1QkFBd0IsU0FBUSxpQkFBTztpQkFFNUMsT0FBRSxHQUFHLG9DQUFvQyxDQUFDO2lCQUMxQyxVQUFLLEdBQUcsSUFBQSxlQUFTLEVBQUMsbUJBQW1CLEVBQUUsK0JBQStCLENBQUMsQ0FBQztRQUV4RjtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtnQkFDOUIsS0FBSyxFQUFFLHVCQUF1QixDQUFDLEtBQUs7Z0JBQ3BDLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLElBQUk7Z0JBQ3pCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDNUMsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHlDQUF5QixDQUFDLENBQUM7WUFDckUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUIsQ0FBQyxDQUFDO1lBRTVELHFCQUFxQjtZQUNyQixJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsOERBQXlCLEVBQUUsQ0FBQztnQkFDdkQsYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLCtEQUEwQixDQUFDO1lBQzdELENBQUM7WUFFRCw4QkFBOEI7WUFDOUIsTUFBTSxTQUFTLEdBQUcsb0JBQW9CLENBQUMsc0JBQXNCLDRDQUFvQyxDQUFDO1lBQ2xHLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNwQixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsc0JBQVksQ0FBQyxlQUFlLENBQUM7UUFDNUI7WUFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxpQkFBaUI7WUFDNUIsSUFBSSxFQUFFO2dCQUNMLEtBQUssRUFBRSxxQkFBcUI7Z0JBQzVCLE9BQU8sRUFBRTtvQkFDUixFQUFFLEVBQUUsd0JBQXdCLENBQUMsRUFBRTtvQkFDL0IsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLDJCQUEyQixDQUFDO29CQUN0RSxPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsd0NBQTBCLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFO29CQUM5RSxJQUFJLEVBQUUsdUJBQXVCO2lCQUM3QjtnQkFDRCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMkJBQWMsQ0FBQyxFQUFFLENBQUMsMkJBQWMsQ0FBQyxNQUFNLENBQUMscUNBQXFDLEVBQUUsU0FBUyxDQUFDLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMscUNBQXFDLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyxtQ0FBbUMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDL1AsS0FBSyxFQUFFLENBQUM7YUFDUjtTQUNELEVBQUU7WUFDRixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxpQkFBaUI7WUFDNUIsSUFBSSxFQUFFO2dCQUNMLEtBQUssRUFBRSxxQkFBcUI7Z0JBQzVCLE9BQU8sRUFBRTtvQkFDUixFQUFFLEVBQUUsd0JBQXdCLENBQUMsRUFBRTtvQkFDL0IsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLDJCQUEyQixDQUFDO29CQUN0RSxPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsd0NBQTBCLEVBQUUsSUFBSSxFQUFFLHFCQUFxQixFQUFFO29CQUMvRSxJQUFJLEVBQUUsd0JBQXdCO2lCQUM5QjtnQkFDRCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMkJBQWMsQ0FBQyxFQUFFLENBQUMsMkJBQWMsQ0FBQyxNQUFNLENBQUMscUNBQXFDLEVBQUUsU0FBUyxDQUFDLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMscUNBQXFDLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyxtQ0FBbUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDOVAsS0FBSyxFQUFFLENBQUM7YUFDUjtTQUNELEVBQUU7WUFDRixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxnQkFBZ0I7WUFDM0IsSUFBSSxFQUFFO2dCQUNMLEtBQUssRUFBRSx5QkFBeUI7Z0JBQ2hDLE9BQU8sRUFBRTtvQkFDUixFQUFFLEVBQUUsd0JBQXdCLENBQUMsRUFBRTtvQkFDL0IsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLGtCQUFrQixFQUFFLHlCQUF5QixDQUFDO2lCQUMvRDtnQkFDRCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsd0NBQTBCLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLElBQUEscUNBQTZCLDZDQUFvQyxDQUFDLENBQUM7Z0JBQzlKLEtBQUssRUFBRSxDQUFDO2FBQ1I7U0FDRDtLQUNELENBQUMsQ0FBQyJ9