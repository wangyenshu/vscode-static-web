/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/layout/browser/layoutService", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/browser/dom", "vs/base/browser/window"], function (require, exports, nls_1, editorGroupsService_1, layoutService_1, actions_1, actionCommonCategories_1, editorService_1, panecomposite_1, dom_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BaseNavigationAction extends actions_1.Action2 {
        constructor(options, direction) {
            super(options);
            this.direction = direction;
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const isEditorFocus = layoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */);
            const isPanelFocus = layoutService.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */);
            const isSidebarFocus = layoutService.hasFocus("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
            const isAuxiliaryBarFocus = layoutService.hasFocus("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            let neighborPart;
            if (isEditorFocus) {
                const didNavigate = this.navigateAcrossEditorGroup(this.toGroupDirection(this.direction), editorGroupService);
                if (didNavigate) {
                    return;
                }
                neighborPart = layoutService.getVisibleNeighborPart("workbench.parts.editor" /* Parts.EDITOR_PART */, this.direction);
            }
            if (isPanelFocus) {
                neighborPart = layoutService.getVisibleNeighborPart("workbench.parts.panel" /* Parts.PANEL_PART */, this.direction);
            }
            if (isSidebarFocus) {
                neighborPart = layoutService.getVisibleNeighborPart("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */, this.direction);
            }
            if (isAuxiliaryBarFocus) {
                neighborPart = neighborPart = layoutService.getVisibleNeighborPart("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */, this.direction);
            }
            if (neighborPart === "workbench.parts.editor" /* Parts.EDITOR_PART */) {
                if (!this.navigateBackToEditorGroup(this.toGroupDirection(this.direction), editorGroupService)) {
                    this.navigateToEditorGroup(this.direction === 3 /* Direction.Right */ ? 0 /* GroupLocation.FIRST */ : 1 /* GroupLocation.LAST */, editorGroupService);
                }
            }
            else if (neighborPart === "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) {
                this.navigateToSidebar(layoutService, paneCompositeService);
            }
            else if (neighborPart === "workbench.parts.panel" /* Parts.PANEL_PART */) {
                this.navigateToPanel(layoutService, paneCompositeService);
            }
            else if (neighborPart === "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) {
                this.navigateToAuxiliaryBar(layoutService, paneCompositeService);
            }
        }
        async navigateToPanel(layoutService, paneCompositeService) {
            if (!layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                return false;
            }
            const activePanel = paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            if (!activePanel) {
                return false;
            }
            const activePanelId = activePanel.getId();
            const res = await paneCompositeService.openPaneComposite(activePanelId, 1 /* ViewContainerLocation.Panel */, true);
            if (!res) {
                return false;
            }
            return res;
        }
        async navigateToSidebar(layoutService, paneCompositeService) {
            if (!layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                return false;
            }
            const activeViewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (!activeViewlet) {
                return false;
            }
            const activeViewletId = activeViewlet.getId();
            const viewlet = await paneCompositeService.openPaneComposite(activeViewletId, 0 /* ViewContainerLocation.Sidebar */, true);
            return !!viewlet;
        }
        async navigateToAuxiliaryBar(layoutService, paneCompositeService) {
            if (!layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)) {
                return false;
            }
            const activePanel = paneCompositeService.getActivePaneComposite(2 /* ViewContainerLocation.AuxiliaryBar */);
            if (!activePanel) {
                return false;
            }
            const activePanelId = activePanel.getId();
            const res = await paneCompositeService.openPaneComposite(activePanelId, 2 /* ViewContainerLocation.AuxiliaryBar */, true);
            if (!res) {
                return false;
            }
            return res;
        }
        navigateAcrossEditorGroup(direction, editorGroupService) {
            return this.doNavigateToEditorGroup({ direction }, editorGroupService);
        }
        navigateToEditorGroup(location, editorGroupService) {
            return this.doNavigateToEditorGroup({ location }, editorGroupService);
        }
        navigateBackToEditorGroup(direction, editorGroupService) {
            if (!editorGroupService.activeGroup) {
                return false;
            }
            const oppositeDirection = this.toOppositeDirection(direction);
            // Check to see if there is a group in between the last
            // active group and the direction of movement
            const groupInBetween = editorGroupService.findGroup({ direction: oppositeDirection }, editorGroupService.activeGroup);
            if (!groupInBetween) {
                // No group in between means we can return
                // focus to the last active editor group
                editorGroupService.activeGroup.focus();
                return true;
            }
            return false;
        }
        toGroupDirection(direction) {
            switch (direction) {
                case 1 /* Direction.Down */: return 1 /* GroupDirection.DOWN */;
                case 2 /* Direction.Left */: return 2 /* GroupDirection.LEFT */;
                case 3 /* Direction.Right */: return 3 /* GroupDirection.RIGHT */;
                case 0 /* Direction.Up */: return 0 /* GroupDirection.UP */;
            }
        }
        toOppositeDirection(direction) {
            switch (direction) {
                case 0 /* GroupDirection.UP */: return 1 /* GroupDirection.DOWN */;
                case 3 /* GroupDirection.RIGHT */: return 2 /* GroupDirection.LEFT */;
                case 2 /* GroupDirection.LEFT */: return 3 /* GroupDirection.RIGHT */;
                case 1 /* GroupDirection.DOWN */: return 0 /* GroupDirection.UP */;
            }
        }
        doNavigateToEditorGroup(scope, editorGroupService) {
            const targetGroup = editorGroupService.findGroup(scope, editorGroupService.activeGroup);
            if (targetGroup) {
                targetGroup.focus();
                return true;
            }
            return false;
        }
    }
    (0, actions_1.registerAction2)(class extends BaseNavigationAction {
        constructor() {
            super({
                id: 'workbench.action.navigateLeft',
                title: (0, nls_1.localize2)('navigateLeft', 'Navigate to the View on the Left'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, 2 /* Direction.Left */);
        }
    });
    (0, actions_1.registerAction2)(class extends BaseNavigationAction {
        constructor() {
            super({
                id: 'workbench.action.navigateRight',
                title: (0, nls_1.localize2)('navigateRight', 'Navigate to the View on the Right'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, 3 /* Direction.Right */);
        }
    });
    (0, actions_1.registerAction2)(class extends BaseNavigationAction {
        constructor() {
            super({
                id: 'workbench.action.navigateUp',
                title: (0, nls_1.localize2)('navigateUp', 'Navigate to the View Above'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, 0 /* Direction.Up */);
        }
    });
    (0, actions_1.registerAction2)(class extends BaseNavigationAction {
        constructor() {
            super({
                id: 'workbench.action.navigateDown',
                title: (0, nls_1.localize2)('navigateDown', 'Navigate to the View Below'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, 1 /* Direction.Down */);
        }
    });
    class BaseFocusAction extends actions_1.Action2 {
        constructor(options, focusNext) {
            super(options);
            this.focusNext = focusNext;
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const editorService = accessor.get(editorService_1.IEditorService);
            this.focusNextOrPreviousPart(layoutService, editorService, this.focusNext);
        }
        findVisibleNeighbour(layoutService, part, next) {
            const activeWindow = (0, dom_1.getActiveWindow)();
            const windowIsAuxiliary = (0, window_1.isAuxiliaryWindow)(activeWindow);
            let neighbour;
            if (windowIsAuxiliary) {
                switch (part) {
                    case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                        neighbour = "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */;
                        break;
                    default:
                        neighbour = "workbench.parts.editor" /* Parts.EDITOR_PART */;
                }
            }
            else {
                switch (part) {
                    case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                        neighbour = next ? "workbench.parts.panel" /* Parts.PANEL_PART */ : "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */;
                        break;
                    case "workbench.parts.panel" /* Parts.PANEL_PART */:
                        neighbour = next ? "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */ : "workbench.parts.editor" /* Parts.EDITOR_PART */;
                        break;
                    case "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */:
                        neighbour = next ? "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */ : "workbench.parts.panel" /* Parts.PANEL_PART */;
                        break;
                    case "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */:
                        neighbour = next ? "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */ : "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */;
                        break;
                    case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */:
                        neighbour = next ? "workbench.parts.editor" /* Parts.EDITOR_PART */ : "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */;
                        break;
                    default:
                        neighbour = "workbench.parts.editor" /* Parts.EDITOR_PART */;
                }
            }
            if (layoutService.isVisible(neighbour, activeWindow) || neighbour === "workbench.parts.editor" /* Parts.EDITOR_PART */) {
                return neighbour;
            }
            return this.findVisibleNeighbour(layoutService, neighbour, next);
        }
        focusNextOrPreviousPart(layoutService, editorService, next) {
            let currentlyFocusedPart;
            if (editorService.activeEditorPane?.hasFocus() || layoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */)) {
                currentlyFocusedPart = "workbench.parts.editor" /* Parts.EDITOR_PART */;
            }
            else if (layoutService.hasFocus("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */)) {
                currentlyFocusedPart = "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */;
            }
            else if (layoutService.hasFocus("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */)) {
                currentlyFocusedPart = "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */;
            }
            else if (layoutService.hasFocus("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                currentlyFocusedPart = "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */;
            }
            else if (layoutService.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                currentlyFocusedPart = "workbench.parts.panel" /* Parts.PANEL_PART */;
            }
            layoutService.focusPart(currentlyFocusedPart ? this.findVisibleNeighbour(layoutService, currentlyFocusedPart, next) : "workbench.parts.editor" /* Parts.EDITOR_PART */, (0, dom_1.getActiveWindow)());
        }
    }
    (0, actions_1.registerAction2)(class extends BaseFocusAction {
        constructor() {
            super({
                id: 'workbench.action.focusNextPart',
                title: (0, nls_1.localize2)('focusNextPart', 'Focus Next Part'),
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    primary: 64 /* KeyCode.F6 */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            }, true);
        }
    });
    (0, actions_1.registerAction2)(class extends BaseFocusAction {
        constructor() {
            super({
                id: 'workbench.action.focusPreviousPart',
                title: (0, nls_1.localize2)('focusPreviousPart', 'Focus Previous Part'),
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    primary: 1024 /* KeyMod.Shift */ | 64 /* KeyCode.F6 */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            }, false);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGlvbkFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9hY3Rpb25zL25hdmlnYXRpb25BY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBbUJoRyxNQUFlLG9CQUFxQixTQUFRLGlCQUFPO1FBRWxELFlBQ0MsT0FBd0IsRUFDZCxTQUFvQjtZQUU5QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFGTCxjQUFTLEdBQVQsU0FBUyxDQUFXO1FBRy9CLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBMEI7WUFDN0IsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUIsQ0FBQyxDQUFDO1lBQzVELE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQ0FBb0IsQ0FBQyxDQUFDO1lBQzlELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5Q0FBeUIsQ0FBQyxDQUFDO1lBRXJFLE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxRQUFRLGtEQUFtQixDQUFDO1lBQ2hFLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxRQUFRLGdEQUFrQixDQUFDO1lBQzlELE1BQU0sY0FBYyxHQUFHLGFBQWEsQ0FBQyxRQUFRLG9EQUFvQixDQUFDO1lBQ2xFLE1BQU0sbUJBQW1CLEdBQUcsYUFBYSxDQUFDLFFBQVEsOERBQXlCLENBQUM7WUFFNUUsSUFBSSxZQUErQixDQUFDO1lBQ3BDLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQ25CLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLENBQUM7Z0JB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