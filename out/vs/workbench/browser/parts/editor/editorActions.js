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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/arrays", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/history/common/history", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/platform/workspaces/common/workspaces", "vs/platform/dialogs/common/dialogs", "vs/platform/quickinput/common/quickInput", "vs/workbench/browser/parts/editor/editorQuickAccess", "vs/base/common/codicons", "vs/base/common/themables", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/editor/common/editorResolverService", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/keyCodes", "vs/platform/log/common/log", "vs/platform/action/common/actionCommonCategories", "vs/workbench/common/contextkeys", "vs/base/browser/dom"], function (require, exports, nls_1, actions_1, arrays_1, editor_1, sideBySideEditorInput_1, layoutService_1, history_1, keybinding_1, commands_1, editorCommands_1, editorGroupsService_1, editorService_1, configuration_1, workspaces_1, dialogs_1, quickInput_1, editorQuickAccess_1, codicons_1, themables_1, filesConfigurationService_1, editorResolverService_1, platform_1, actions_2, contextkey_1, keyCodes_1, log_1, actionCommonCategories_1, contextkeys_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NewEmptyEditorWindowAction = exports.RestoreEditorsToMainWindowAction = exports.CopyEditorGroupToNewWindowAction = exports.MoveEditorGroupToNewWindowAction = exports.CopyEditorToNewindowAction = exports.MoveEditorToNewWindowAction = exports.ReOpenInTextEditorAction = exports.ToggleEditorTypeAction = exports.NewEditorGroupBelowAction = exports.NewEditorGroupAboveAction = exports.NewEditorGroupRightAction = exports.NewEditorGroupLeftAction = exports.EditorLayoutTwoRowsRightAction = exports.EditorLayoutTwoColumnsBottomAction = exports.EditorLayoutTwoByTwoGridAction = exports.EditorLayoutThreeRowsAction = exports.EditorLayoutTwoRowsAction = exports.EditorLayoutThreeColumnsAction = exports.EditorLayoutTwoColumnsAction = exports.EditorLayoutSingleAction = exports.SplitEditorToLastGroupAction = exports.SplitEditorToFirstGroupAction = exports.SplitEditorToRightGroupAction = exports.SplitEditorToLeftGroupAction = exports.SplitEditorToBelowGroupAction = exports.SplitEditorToAboveGroupAction = exports.SplitEditorToNextGroupAction = exports.SplitEditorToPreviousGroupAction = exports.MoveEditorToLastGroupAction = exports.MoveEditorToFirstGroupAction = exports.MoveEditorToRightGroupAction = exports.MoveEditorToLeftGroupAction = exports.MoveEditorToBelowGroupAction = exports.MoveEditorToAboveGroupAction = exports.MoveEditorToNextGroupAction = exports.MoveEditorToPreviousGroupAction = exports.MoveEditorRightInGroupAction = exports.MoveEditorLeftInGroupAction = exports.ClearEditorHistoryAction = exports.OpenPreviousRecentlyUsedEditorInGroupAction = exports.OpenNextRecentlyUsedEditorInGroupAction = exports.OpenPreviousRecentlyUsedEditorAction = exports.OpenNextRecentlyUsedEditorAction = exports.QuickAccessPreviousEditorFromHistoryAction = exports.QuickAccessLeastRecentlyUsedEditorInGroupAction = exports.QuickAccessPreviousRecentlyUsedEditorInGroupAction = exports.QuickAccessLeastRecentlyUsedEditorAction = exports.QuickAccessPreviousRecentlyUsedEditorAction = exports.ShowAllEditorsByMostRecentlyUsedAction = exports.ShowAllEditorsByAppearanceAction = exports.ShowEditorsInActiveGroupByMostRecentlyUsedAction = exports.ClearRecentFilesAction = exports.ReopenClosedEditorAction = exports.NavigateToLastNavigationLocationAction = exports.NavigatePreviousInNavigationsAction = exports.NavigateBackwardsInNavigationsAction = exports.NavigateForwardInNavigationsAction = exports.NavigateToLastEditLocationAction = exports.NavigatePreviousInEditsAction = exports.NavigateBackwardsInEditsAction = exports.NavigateForwardInEditsAction = exports.NavigatePreviousAction = exports.NavigateBackwardsAction = exports.NavigateForwardAction = exports.OpenLastEditorInGroup = exports.OpenFirstEditorInGroup = exports.OpenPreviousEditorInGroup = exports.OpenNextEditorInGroup = exports.OpenPreviousEditor = exports.OpenNextEditor = exports.ToggleMaximizeEditorGroupAction = exports.MaximizeGroupHideSidebarAction = exports.ToggleGroupSizesAction = exports.ResetGroupSizesAction = exports.MinimizeOtherGroupsHideSidebarAction = exports.MinimizeOtherGroupsAction = exports.DuplicateGroupDownAction = exports.DuplicateGroupUpAction = exports.DuplicateGroupRightAction = exports.DuplicateGroupLeftAction = exports.MoveGroupDownAction = exports.MoveGroupUpAction = exports.MoveGroupRightAction = exports.MoveGroupLeftAction = exports.CloseEditorInAllGroupsAction = exports.CloseEditorsInOtherGroupsAction = exports.CloseAllEditorGroupsAction = exports.CloseAllEditorsAction = exports.CloseLeftEditorsInGroupAction = exports.RevertAndCloseEditorAction = exports.CloseOneEditorAction = exports.UnpinEditorAction = exports.CloseEditorAction = exports.FocusBelowGroup = exports.FocusAboveGroup = exports.FocusRightGroup = exports.FocusLeftGroup = exports.FocusPreviousGroup = exports.FocusNextGroup = exports.FocusLastGroupAction = exports.FocusFirstGroupAction = exports.FocusActiveGroupAction = exports.NavigateBetweenGroupsAction = exports.JoinAllGroupsAction = exports.JoinTwoGroupsAction = exports.SplitEditorDownAction = exports.SplitEditorUpAction = exports.SplitEditorRightAction = exports.SplitEditorLeftAction = exports.SplitEditorOrthogonalAction = exports.SplitEditorAction = void 0;
    class ExecuteCommandAction extends actions_2.Action2 {
        constructor(desc, commandId, commandArgs) {
            super(desc);
            this.commandId = commandId;
            this.commandArgs = commandArgs;
        }
        run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            return commandService.executeCommand(this.commandId, this.commandArgs);
        }
    }
    class AbstractSplitEditorAction extends actions_2.Action2 {
        getDirection(configurationService) {
            return (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService);
        }
        async run(accessor, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            (0, editorCommands_1.splitEditor)(editorGroupService, this.getDirection(configurationService), context);
        }
    }
    class SplitEditorAction extends AbstractSplitEditorAction {
        static { this.ID = editorCommands_1.SPLIT_EDITOR; }
        constructor() {
            super({
                id: SplitEditorAction.ID,
                title: (0, nls_1.localize2)('splitEditor', 'Split Editor'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
    }
    exports.SplitEditorAction = SplitEditorAction;
    class SplitEditorOrthogonalAction extends AbstractSplitEditorAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorOrthogonal',
                title: (0, nls_1.localize2)('splitEditorOrthogonal', 'Split Editor Orthogonal'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */)
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        getDirection(configurationService) {
            const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService);
            return direction === 3 /* GroupDirection.RIGHT */ ? 1 /* GroupDirection.DOWN */ : 3 /* GroupDirection.RIGHT */;
        }
    }
    exports.SplitEditorOrthogonalAction = SplitEditorOrthogonalAction;
    class SplitEditorLeftAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: editorCommands_1.SPLIT_EDITOR_LEFT,
                title: (0, nls_1.localize2)('splitEditorGroupLeft', 'Split Editor Left'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */)
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.SPLIT_EDITOR_LEFT);
        }
    }
    exports.SplitEditorLeftAction = SplitEditorLeftAction;
    class SplitEditorRightAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: editorCommands_1.SPLIT_EDITOR_RIGHT,
                title: (0, nls_1.localize2)('splitEditorGroupRight', 'Split Editor Right'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */)
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.SPLIT_EDITOR_RIGHT);
        }
    }
    exports.SplitEditorRightAction = SplitEditorRightAction;
    class SplitEditorUpAction extends ExecuteCommandAction {
        static { this.LABEL = (0, nls_1.localize)('splitEditorGroupUp', "Split Editor Up"); }
        constructor() {
            super({
                id: editorCommands_1.SPLIT_EDITOR_UP,
                title: (0, nls_1.localize2)('splitEditorGroupUp', "Split Editor Up"),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */)
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.SPLIT_EDITOR_UP);
        }
    }
    exports.SplitEditorUpAction = SplitEditorUpAction;
    class SplitEditorDownAction extends ExecuteCommandAction {
        static { this.LABEL = (0, nls_1.localize)('splitEditorGroupDown', "Split Editor Down"); }
        constructor() {
            super({
                id: editorCommands_1.SPLIT_EDITOR_DOWN,
                title: (0, nls_1.localize2)('splitEditorGroupDown', "Split Editor Down"),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */)
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.SPLIT_EDITOR_DOWN);
        }
    }
    exports.SplitEditorDownAction = SplitEditorDownAction;
    class JoinTwoGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.joinTwoGroups',
                title: (0, nls_1.localize2)('joinTwoGroups', 'Join Editor Group with Next Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            let sourceGroup;
            if (context && typeof context.groupId === 'number') {
                sourceGroup = editorGroupService.getGroup(context.groupId);
            }
            else {
                sourceGroup = editorGroupService.activeGroup;
            }
            if (sourceGroup) {
                const targetGroupDirections = [3 /* GroupDirection.RIGHT */, 1 /* GroupDirection.DOWN */, 2 /* GroupDirection.LEFT */, 0 /* GroupDirection.UP */];
                for (const targetGroupDirection of targetGroupDirections) {
                    const targetGroup = editorGroupService.findGroup({ direction: targetGroupDirection }, sourceGroup);
                    if (targetGroup && sourceGroup !== targetGroup) {
                        editorGroupService.mergeGroup(sourceGroup, targetGroup);
                        break;
                    }
                }
            }
        }
    }
    exports.JoinTwoGroupsAction = JoinTwoGroupsAction;
    class JoinAllGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.joinAllGroups',
                title: (0, nls_1.localize2)('joinAllGroups', 'Join All Editor Groups'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.mergeAllGroups(editorGroupService.activeGroup);
        }
    }
    exports.JoinAllGroupsAction = JoinAllGroupsAction;
    class NavigateBetweenGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateEditorGroups',
                title: (0, nls_1.localize2)('navigateEditorGroups', 'Navigate Between Editor Groups'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const nextGroup = editorGroupService.findGroup({ location: 2 /* GroupLocation.NEXT */ }, editorGroupService.activeGroup, true);
            nextGroup?.focus();
        }
    }
    exports.NavigateBetweenGroupsAction = NavigateBetweenGroupsAction;
    class FocusActiveGroupAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.focusActiveEditorGroup',
                title: (0, nls_1.localize2)('focusActiveEditorGroup', 'Focus Active Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.activeGroup.focus();
        }
    }
    exports.FocusActiveGroupAction = FocusActiveGroupAction;
    class AbstractFocusGroupAction extends actions_2.Action2 {
        constructor(desc, scope) {
            super(desc);
            this.scope = scope;
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const group = editorGroupService.findGroup(this.scope, editorGroupService.activeGroup, true);
            group?.focus();
        }
    }
    class FocusFirstGroupAction extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusFirstEditorGroup',
                title: (0, nls_1.localize2)('focusFirstEditorGroup', 'Focus First Editor Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 22 /* KeyCode.Digit1 */
                },
                category: actionCommonCategories_1.Categories.View
            }, { location: 0 /* GroupLocation.FIRST */ });
        }
    }
    exports.FocusFirstGroupAction = FocusFirstGroupAction;
    class FocusLastGroupAction extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusLastEditorGroup',
                title: (0, nls_1.localize2)('focusLastEditorGroup', 'Focus Last Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, { location: 1 /* GroupLocation.LAST */ });
        }
    }
    exports.FocusLastGroupAction = FocusLastGroupAction;
    class FocusNextGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusNextGroup',
                title: (0, nls_1.localize2)('focusNextGroup', 'Focus Next Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, { location: 2 /* GroupLocation.NEXT */ });
        }
    }
    exports.FocusNextGroup = FocusNextGroup;
    class FocusPreviousGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusPreviousGroup',
                title: (0, nls_1.localize2)('focusPreviousGroup', 'Focus Previous Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, { location: 3 /* GroupLocation.PREVIOUS */ });
        }
    }
    exports.FocusPreviousGroup = FocusPreviousGroup;
    class FocusLeftGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusLeftGroup',
                title: (0, nls_1.localize2)('focusLeftGroup', 'Focus Left Editor Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, { direction: 2 /* GroupDirection.LEFT */ });
        }
    }
    exports.FocusLeftGroup = FocusLeftGroup;
    class FocusRightGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusRightGroup',
                title: (0, nls_1.localize2)('focusRightGroup', 'Focus Right Editor Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, { direction: 3 /* GroupDirection.RIGHT */ });
        }
    }
    exports.FocusRightGroup = FocusRightGroup;
    class FocusAboveGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusAboveGroup',
                title: (0, nls_1.localize2)('focusAboveGroup', 'Focus Editor Group Above'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, { direction: 0 /* GroupDirection.UP */ });
        }
    }
    exports.FocusAboveGroup = FocusAboveGroup;
    class FocusBelowGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusBelowGroup',
                title: (0, nls_1.localize2)('focusBelowGroup', 'Focus Editor Group Below'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, { direction: 1 /* GroupDirection.DOWN */ });
        }
    }
    exports.FocusBelowGroup = FocusBelowGroup;
    let CloseEditorAction = class CloseEditorAction extends actions_1.Action {
        static { this.ID = 'workbench.action.closeActiveEditor'; }
        static { this.LABEL = (0, nls_1.localize)('closeEditor', "Close Editor"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close));
            this.commandService = commandService;
        }
        run(context) {
            return this.commandService.executeCommand(editorCommands_1.CLOSE_EDITOR_COMMAND_ID, undefined, context);
        }
    };
    exports.CloseEditorAction = CloseEditorAction;
    exports.CloseEditorAction = CloseEditorAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CloseEditorAction);
    let UnpinEditorAction = class UnpinEditorAction extends actions_1.Action {
        static { this.ID = 'workbench.action.unpinActiveEditor'; }
        static { this.LABEL = (0, nls_1.localize)('unpinEditor', "Unpin Editor"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(codicons_1.Codicon.pinned));
            this.commandService = commandService;
        }
        run(context) {
            return this.commandService.executeCommand(editorCommands_1.UNPIN_EDITOR_COMMAND_ID, undefined, context);
        }
    };
    exports.UnpinEditorAction = UnpinEditorAction;
    exports.UnpinEditorAction = UnpinEditorAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], UnpinEditorAction);
    let CloseOneEditorAction = class CloseOneEditorAction extends actions_1.Action {
        static { this.ID = 'workbench.action.closeActiveEditor'; }
        static { this.LABEL = (0, nls_1.localize)('closeOneEditor', "Close"); }
        constructor(id, label, editorGroupService) {
            super(id, label, themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close));
            this.editorGroupService = editorGroupService;
        }
        async run(context) {
            let group;
            let editorIndex;
            if (context) {
                group = this.editorGroupService.getGroup(context.groupId);
                if (group) {
                    editorIndex = context.editorIndex; // only allow editor at index if group is valid
                }
            }
            if (!group) {
                group = this.editorGroupService.activeGroup;
            }
            // Close specific editor in group
            if (typeof editorIndex === 'number') {
                const editorAtIndex = group.getEditorByIndex(editorIndex);
                if (editorAtIndex) {
                    await group.closeEditor(editorAtIndex, { preserveFocus: context?.preserveFocus });
                    return;
                }
            }
            // Otherwise close active editor in group
            if (group.activeEditor) {
                await group.closeEditor(group.activeEditor, { preserveFocus: context?.preserveFocus });
                return;
            }
        }
    };
    exports.CloseOneEditorAction = CloseOneEditorAction;
    exports.CloseOneEditorAction = CloseOneEditorAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], CloseOneEditorAction);
    class RevertAndCloseEditorAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.revertAndCloseActiveEditor',
                title: (0, nls_1.localize2)('revertAndCloseActiveEditor', 'Revert and Close Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const logService = accessor.get(log_1.ILogService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane) {
                const editor = activeEditorPane.input;
                const group = activeEditorPane.group;
                // first try a normal revert where the contents of the editor are restored
                try {
                    await editorService.revert({ editor, groupId: group.id });
                }
                catch (error) {
                    logService.error(error);
                    // if that fails, since we are about to close the editor, we accept that
                    // the editor cannot be reverted and instead do a soft revert that just
                    // enables us to close the editor. With this, a user can always close a
                    // dirty editor even when reverting fails.
                    await editorService.revert({ editor, groupId: group.id }, { soft: true });
                }
                await group.closeEditor(editor);
            }
        }
    }
    exports.RevertAndCloseEditorAction = RevertAndCloseEditorAction;
    class CloseLeftEditorsInGroupAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closeEditorsToTheLeft',
                title: (0, nls_1.localize2)('closeEditorsToTheLeft', 'Close Editors to the Left in Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group, editor } = this.getTarget(editorGroupService, context);
            if (group && editor) {
                await group.closeEditors({ direction: 0 /* CloseDirection.LEFT */, except: editor, excludeSticky: true });
            }
        }
        getTarget(editorGroupService, context) {
            if (context) {
                return { editor: context.editor, group: editorGroupService.getGroup(context.groupId) };
            }
            // Fallback to active group
            return { group: editorGroupService.activeGroup, editor: editorGroupService.activeGroup.activeEditor };
        }
    }
    exports.CloseLeftEditorsInGroupAction = CloseLeftEditorsInGroupAction;
    class AbstractCloseAllAction extends actions_2.Action2 {
        groupsToClose(editorGroupService) {
            const groupsToClose = [];
            // Close editors in reverse order of their grid appearance so that the editor
            // group that is the first (top-left) remains. This helps to keep view state
            // for editors around that have been opened in this visually first group.
            const groups = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
            for (let i = groups.length - 1; i >= 0; i--) {
                groupsToClose.push(groups[i]);
            }
            return groupsToClose;
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const filesConfigurationService = accessor.get(filesConfigurationService_1.IFilesConfigurationService);
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            // Depending on the editor and auto save configuration,
            // split editors into buckets for handling confirmation
            const dirtyEditorsWithDefaultConfirm = new Set();
            const dirtyAutoSaveOnFocusChangeEditors = new Set();
            const dirtyAutoSaveOnWindowChangeEditors = new Set();
            const editorsWithCustomConfirm = new Map();
            for (const { editor, groupId } of editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: this.excludeSticky })) {
                let confirmClose = false;
                if (editor.closeHandler) {
                    confirmClose = editor.closeHandler.showConfirm(); // custom handling of confirmation on close
                }
                else {
                    confirmClose = editor.isDirty() && !editor.isSaving(); // default confirm only when dirty and not saving
                }
                if (!confirmClose) {
                    continue;
                }
                // Editor has custom confirm implementation
                if (typeof editor.closeHandler?.confirm === 'function') {
                    let customEditorsToConfirm = editorsWithCustomConfirm.get(editor.typeId);
                    if (!customEditorsToConfirm) {
                        customEditorsToConfirm = new Set();
                        editorsWithCustomConfirm.set(editor.typeId, customEditorsToConfirm);
                    }
                    customEditorsToConfirm.add({ editor, groupId });
                }
                // Editor will be saved on focus change when a
                // dialog appears, so just track that separate
                else if (!editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) && filesConfigurationService.getAutoSaveMode(editor).mode === 3 /* AutoSaveMode.ON_FOCUS_CHANGE */) {
                    dirtyAutoSaveOnFocusChangeEditors.add({ editor, groupId });
                }
                // Windows, Linux: editor will be saved on window change
                // when a native dialog appears, so just track that separate
                // (see https://github.com/microsoft/vscode/issues/134250)
                else if ((platform_1.isNative && (platform_1.isWindows || platform_1.isLinux)) && !editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) && filesConfigurationService.getAutoSaveMode(editor).mode === 4 /* AutoSaveMode.ON_WINDOW_CHANGE */) {
                    dirtyAutoSaveOnWindowChangeEditors.add({ editor, groupId });
                }
                // Editor will show in generic file based dialog
                else {
                    dirtyEditorsWithDefaultConfirm.add({ editor, groupId });
                }
            }
            // 1.) Show default file based dialog
            if (dirtyEditorsWithDefaultConfirm.size > 0) {
                const editors = Array.from(dirtyEditorsWithDefaultConfirm.values());
                await this.revealEditorsToConfirm(editors, editorGroupService); // help user make a decision by revealing editors
                const confirmation = await fileDialogService.showSaveConfirm(editors.map(({ editor }) => {
                    if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                        return editor.primary.getName(); // prefer shorter names by using primary's name in this case
                    }
                    return editor.getName();
                }));
                switch (confirmation) {
                    case 2 /* ConfirmResult.CANCEL */:
                        return;
                    case 1 /* ConfirmResult.DONT_SAVE */:
                        await editorService.revert(editors, { soft: true });
                        break;
                    case 0 /* ConfirmResult.SAVE */:
                        await editorService.save(editors, { reason: 1 /* SaveReason.EXPLICIT */ });
                        break;
                }
            }
            // 2.) Show custom confirm based dialog
            for (const [, editorIdentifiers] of editorsWithCustomConfirm) {
                const editors = Array.from(editorIdentifiers.values());
                await this.revealEditorsToConfirm(editors, editorGroupService); // help user make a decision by revealing editors
                const confirmation = await (0, arrays_1.firstOrDefault)(editors)?.editor.closeHandler?.confirm?.(editors);
                if (typeof confirmation === 'number') {
                    switch (confirmation) {
                        case 2 /* ConfirmResult.CANCEL */:
                            return;
                        case 1 /* ConfirmResult.DONT_SAVE */:
                            await editorService.revert(editors, { soft: true });
                            break;
                        case 0 /* ConfirmResult.SAVE */:
                            await editorService.save(editors, { reason: 1 /* SaveReason.EXPLICIT */ });
                            break;
                    }
                }
            }
            // 3.) Save autosaveable editors (focus change)
            if (dirtyAutoSaveOnFocusChangeEditors.size > 0) {
                const editors = Array.from(dirtyAutoSaveOnFocusChangeEditors.values());
                await editorService.save(editors, { reason: 3 /* SaveReason.FOCUS_CHANGE */ });
            }
            // 4.) Save autosaveable editors (window change)
            if (dirtyAutoSaveOnWindowChangeEditors.size > 0) {
                const editors = Array.from(dirtyAutoSaveOnWindowChangeEditors.values());
                await editorService.save(editors, { reason: 4 /* SaveReason.WINDOW_CHANGE */ });
            }
            // 5.) Finally close all editors: even if an editor failed to
            // save or revert and still reports dirty, the editor part makes
            // sure to bring up another confirm dialog for those editors
            // specifically.
            return this.doCloseAll(editorGroupService);
        }
        async revealEditorsToConfirm(editors, editorGroupService) {
            try {
                const handledGroups = new Set();
                for (const { editor, groupId } of editors) {
                    if (handledGroups.has(groupId)) {
                        continue;
                    }
                    handledGroups.add(groupId);
                    const group = editorGroupService.getGroup(groupId);
                    await group?.openEditor(editor);
                }
            }
            catch (error) {
                // ignore any error as the revealing is just convinience
            }
        }
        async doCloseAll(editorGroupService) {
            await Promise.all(this.groupsToClose(editorGroupService).map(group => group.closeAllEditors({ excludeSticky: this.excludeSticky })));
        }
    }
    class CloseAllEditorsAction extends AbstractCloseAllAction {
        static { this.ID = 'workbench.action.closeAllEditors'; }
        static { this.LABEL = (0, nls_1.localize2)('closeAllEditors', 'Close All Editors'); }
        constructor() {
            super({
                id: CloseAllEditorsAction.ID,
                title: CloseAllEditorsAction.LABEL,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */)
                },
                icon: codicons_1.Codicon.closeAll,
                category: actionCommonCategories_1.Categories.View
            });
        }
        get excludeSticky() {
            return true; // exclude sticky from this mass-closing operation
        }
    }
    exports.CloseAllEditorsAction = CloseAllEditorsAction;
    class CloseAllEditorGroupsAction extends AbstractCloseAllAction {
        constructor() {
            super({
                id: 'workbench.action.closeAllGroups',
                title: (0, nls_1.localize2)('closeAllGroups', 'Close All Editor Groups'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */)
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        get excludeSticky() {
            return false; // the intent to close groups means, even sticky are included
        }
        async doCloseAll(editorGroupService) {
            await super.doCloseAll(editorGroupService);
            for (const groupToClose of this.groupsToClose(editorGroupService)) {
                editorGroupService.removeGroup(groupToClose);
            }
        }
    }
    exports.CloseAllEditorGroupsAction = CloseAllEditorGroupsAction;
    class CloseEditorsInOtherGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closeEditorsInOtherGroups',
                title: (0, nls_1.localize2)('closeEditorsInOtherGroups', 'Close Editors in Other Groups'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const groupToSkip = context ? editorGroupService.getGroup(context.groupId) : editorGroupService.activeGroup;
            await Promise.all(editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */).map(async (group) => {
                if (groupToSkip && group.id === groupToSkip.id) {
                    return;
                }
                return group.closeAllEditors({ excludeSticky: true });
            }));
        }
    }
    exports.CloseEditorsInOtherGroupsAction = CloseEditorsInOtherGroupsAction;
    class CloseEditorInAllGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closeEditorInAllGroups',
                title: (0, nls_1.localize2)('closeEditorInAllGroups', 'Close Editor in All Groups'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const activeEditor = editorService.activeEditor;
            if (activeEditor) {
                await Promise.all(editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */).map(group => group.closeEditor(activeEditor)));
            }
        }
    }
    exports.CloseEditorInAllGroupsAction = CloseEditorInAllGroupsAction;
    class AbstractMoveCopyGroupAction extends actions_2.Action2 {
        constructor(desc, direction, isMove) {
            super(desc);
            this.direction = direction;
            this.isMove = isMove;
        }
        async run(accessor, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            let sourceGroup;
            if (context && typeof context.groupId === 'number') {
                sourceGroup = editorGroupService.getGroup(context.groupId);
            }
            else {
                sourceGroup = editorGroupService.activeGroup;
            }
            if (sourceGroup) {
                let resultGroup = undefined;
                if (this.isMove) {
                    const targetGroup = this.findTargetGroup(editorGroupService, sourceGroup);
                    if (targetGroup) {
                        resultGroup = editorGroupService.moveGroup(sourceGroup, targetGroup, this.direction);
                    }
                }
                else {
                    resultGroup = editorGroupService.copyGroup(sourceGroup, sourceGroup, this.direction);
                }
                if (resultGroup) {
                    editorGroupService.activateGroup(resultGroup);
                }
            }
        }
        findTargetGroup(editorGroupService, sourceGroup) {
            const targetNeighbours = [this.direction];
            // Allow the target group to be in alternative locations to support more
            // scenarios of moving the group to the taret location.
            // Helps for https://github.com/microsoft/vscode/issues/50741
            switch (this.direction) {
                case 2 /* GroupDirection.LEFT */:
                case 3 /* GroupDirection.RIGHT */:
                    targetNeighbours.push(0 /* GroupDirection.UP */, 1 /* GroupDirection.DOWN */);
                    break;
                case 0 /* GroupDirection.UP */:
                case 1 /* GroupDirection.DOWN */:
                    targetNeighbours.push(2 /* GroupDirection.LEFT */, 3 /* GroupDirection.RIGHT */);
                    break;
            }
            for (const targetNeighbour of targetNeighbours) {
                const targetNeighbourGroup = editorGroupService.findGroup({ direction: targetNeighbour }, sourceGroup);
                if (targetNeighbourGroup) {
                    return targetNeighbourGroup;
                }
            }
            return undefined;
        }
    }
    class AbstractMoveGroupAction extends AbstractMoveCopyGroupAction {
        constructor(desc, direction) {
            super(desc, direction, true);
        }
    }
    class MoveGroupLeftAction extends AbstractMoveGroupAction {
        constructor() {
            super({
                id: 'workbench.action.moveActiveEditorGroupLeft',
                title: (0, nls_1.localize2)('moveActiveGroupLeft', 'Move Editor Group Left'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 15 /* KeyCode.LeftArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, 2 /* GroupDirection.LEFT */);
        }
    }
    exports.MoveGroupLeftAction = MoveGroupLeftAction;
    class MoveGroupRightAction extends AbstractMoveGroupAction {
        constructor() {
            super({
                id: 'workbench.action.moveActiveEditorGroupRight',
                title: (0, nls_1.localize2)('moveActiveGroupRight', 'Move Editor Group Right'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 17 /* KeyCode.RightArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, 3 /* GroupDirection.RIGHT */);
        }
    }
    exports.MoveGroupRightAction = MoveGroupRightAction;
    class MoveGroupUpAction extends AbstractMoveGroupAction {
        constructor() {
            super({
                id: 'workbench.action.moveActiveEditorGroupUp',
                title: (0, nls_1.localize2)('moveActiveGroupUp', 'Move Editor Group Up'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 16 /* KeyCode.UpArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, 0 /* GroupDirection.UP */);
        }
    }
    exports.MoveGroupUpAction = MoveGroupUpAction;
    class MoveGroupDownAction extends AbstractMoveGroupAction {
        constructor() {
            super({
                id: 'workbench.action.moveActiveEditorGroupDown',
                title: (0, nls_1.localize2)('moveActiveGroupDown', 'Move Editor Group Down'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 18 /* KeyCode.DownArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, 1 /* GroupDirection.DOWN */);
        }
    }
    exports.MoveGroupDownAction = MoveGroupDownAction;
    class AbstractDuplicateGroupAction extends AbstractMoveCopyGroupAction {
        constructor(desc, direction) {
            super(desc, direction, false);
        }
    }
    class DuplicateGroupLeftAction extends AbstractDuplicateGroupAction {
        constructor() {
            super({
                id: 'workbench.action.duplicateActiveEditorGroupLeft',
                title: (0, nls_1.localize2)('duplicateActiveGroupLeft', 'Duplicate Editor Group Left'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 2 /* GroupDirection.LEFT */);
        }
    }
    exports.DuplicateGroupLeftAction = DuplicateGroupLeftAction;
    class DuplicateGroupRightAction extends AbstractDuplicateGroupAction {
        constructor() {
            super({
                id: 'workbench.action.duplicateActiveEditorGroupRight',
                title: (0, nls_1.localize2)('duplicateActiveGroupRight', 'Duplicate Editor Group Right'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 3 /* GroupDirection.RIGHT */);
        }
    }
    exports.DuplicateGroupRightAction = DuplicateGroupRightAction;
    class DuplicateGroupUpAction extends AbstractDuplicateGroupAction {
        constructor() {
            super({
                id: 'workbench.action.duplicateActiveEditorGroupUp',
                title: (0, nls_1.localize2)('duplicateActiveGroupUp', 'Duplicate Editor Group Up'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 0 /* GroupDirection.UP */);
        }
    }
    exports.DuplicateGroupUpAction = DuplicateGroupUpAction;
    class DuplicateGroupDownAction extends AbstractDuplicateGroupAction {
        constructor() {
            super({
                id: 'workbench.action.duplicateActiveEditorGroupDown',
                title: (0, nls_1.localize2)('duplicateActiveGroupDown', 'Duplicate Editor Group Down'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 1 /* GroupDirection.DOWN */);
        }
    }
    exports.DuplicateGroupDownAction = DuplicateGroupDownAction;
    class MinimizeOtherGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.minimizeOtherEditors',
                title: (0, nls_1.localize2)('minimizeOtherEditorGroups', 'Expand Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkeys_1.MultipleEditorGroupsContext
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.arrangeGroups(1 /* GroupsArrangement.EXPAND */);
        }
    }
    exports.MinimizeOtherGroupsAction = MinimizeOtherGroupsAction;
    class MinimizeOtherGroupsHideSidebarAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.minimizeOtherEditorsHideSidebar',
                title: (0, nls_1.localize2)('minimizeOtherEditorGroupsHideSidebar', 'Expand Editor Group and Hide Side Bars'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.MultipleEditorGroupsContext, contextkeys_1.SideBarVisibleContext, contextkeys_1.AuxiliaryBarVisibleContext)
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
            layoutService.setPartHidden(true, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            editorGroupService.arrangeGroups(1 /* GroupsArrangement.EXPAND */);
        }
    }
    exports.MinimizeOtherGroupsHideSidebarAction = MinimizeOtherGroupsHideSidebarAction;
    class ResetGroupSizesAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.evenEditorWidths',
                title: (0, nls_1.localize2)('evenEditorGroups', 'Reset Editor Group Sizes'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.arrangeGroups(2 /* GroupsArrangement.EVEN */);
        }
    }
    exports.ResetGroupSizesAction = ResetGroupSizesAction;
    class ToggleGroupSizesAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleEditorWidths',
                title: (0, nls_1.localize2)('toggleEditorWidths', 'Toggle Editor Group Sizes'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.toggleExpandGroup();
        }
    }
    exports.ToggleGroupSizesAction = ToggleGroupSizesAction;
    class MaximizeGroupHideSidebarAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.maximizeEditorHideSidebar',
                title: (0, nls_1.localize2)('maximizeEditorHideSidebar', 'Maximize Editor Group and Hide Side Bars'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorPartMaximizedEditorGroupContext.negate(), contextkeys_1.EditorPartMultipleEditorGroupsContext), contextkeys_1.SideBarVisibleContext, contextkeys_1.AuxiliaryBarVisibleContext)
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const editorService = accessor.get(editorService_1.IEditorService);
            if (editorService.activeEditor) {
                layoutService.setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                layoutService.setPartHidden(true, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
                editorGroupService.arrangeGroups(0 /* GroupsArrangement.MAXIMIZE */);
            }
        }
    }
    exports.MaximizeGroupHideSidebarAction = MaximizeGroupHideSidebarAction;
    class ToggleMaximizeEditorGroupAction extends actions_2.Action2 {
        constructor() {
            super({
                id: editorCommands_1.TOGGLE_MAXIMIZE_EDITOR_GROUP,
                title: (0, nls_1.localize2)('toggleMaximizeEditorGroup', 'Toggle Maximize Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.EditorPartMultipleEditorGroupsContext, contextkeys_1.EditorPartMaximizedEditorGroupContext),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 43 /* KeyCode.KeyM */),
                },
                menu: [{
                        id: actions_2.MenuId.EditorTitle,
                        order: -10000, // towards the front
                        group: 'navigation',
                        when: contextkeys_1.EditorPartMaximizedEditorGroupContext
                    },
                    {
                        id: actions_2.MenuId.EmptyEditorGroup,
                        order: -10000, // towards the front
                        group: 'navigation',
                        when: contextkeys_1.EditorPartMaximizedEditorGroupContext
                    }],
                icon: codicons_1.Codicon.screenFull,
                toggled: contextkeys_1.EditorPartMaximizedEditorGroupContext,
            });
        }
        async run(accessor, resourceOrContext, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group } = (0, editorCommands_1.resolveCommandsContext)(editorGroupsService, (0, editorCommands_1.getCommandsContext)(resourceOrContext, context));
            editorGroupsService.toggleMaximizeGroup(group);
        }
    }
    exports.ToggleMaximizeEditorGroupAction = ToggleMaximizeEditorGroupAction;
    class AbstractNavigateEditorAction extends actions_2.Action2 {
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const result = this.navigate(editorGroupService);
            if (!result) {
                return;
            }
            const { groupId, editor } = result;
            if (!editor) {
                return;
            }
            const group = editorGroupService.getGroup(groupId);
            if (group) {
                await group.openEditor(editor);
            }
        }
    }
    class OpenNextEditor extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.nextEditor',
                title: (0, nls_1.localize2)('openNextEditor', 'Open Next Editor'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 94 /* KeyCode.BracketRight */]
                    }
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            // Navigate in active group if possible
            const activeGroup = editorGroupService.activeGroup;
            const activeGroupEditors = activeGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const activeEditorIndex = activeGroup.activeEditor ? activeGroupEditors.indexOf(activeGroup.activeEditor) : -1;
            if (activeEditorIndex + 1 < activeGroupEditors.length) {
                return { editor: activeGroupEditors[activeEditorIndex + 1], groupId: activeGroup.id };
            }
            // Otherwise try in next group that has editors
            const handledGroups = new Set();
            let currentGroup = editorGroupService.activeGroup;
            while (currentGroup && !handledGroups.has(currentGroup.id)) {
                currentGroup = editorGroupService.findGroup({ location: 2 /* GroupLocation.NEXT */ }, currentGroup, true);
                if (currentGroup) {
                    handledGroups.add(currentGroup.id);
                    const groupEditors = currentGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
                    if (groupEditors.length > 0) {
                        return { editor: groupEditors[0], groupId: currentGroup.id };
                    }
                }
            }
            return undefined;
        }
    }
    exports.OpenNextEditor = OpenNextEditor;
    class OpenPreviousEditor extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.previousEditor',
                title: (0, nls_1.localize2)('openPreviousEditor', 'Open Previous Editor'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 92 /* KeyCode.BracketLeft */]
                    }
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            // Navigate in active group if possible
            const activeGroup = editorGroupService.activeGroup;
            const activeGroupEditors = activeGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const activeEditorIndex = activeGroup.activeEditor ? activeGroupEditors.indexOf(activeGroup.activeEditor) : -1;
            if (activeEditorIndex > 0) {
                return { editor: activeGroupEditors[activeEditorIndex - 1], groupId: activeGroup.id };
            }
            // Otherwise try in previous group that has editors
            const handledGroups = new Set();
            let currentGroup = editorGroupService.activeGroup;
            while (currentGroup && !handledGroups.has(currentGroup.id)) {
                currentGroup = editorGroupService.findGroup({ location: 3 /* GroupLocation.PREVIOUS */ }, currentGroup, true);
                if (currentGroup) {
                    handledGroups.add(currentGroup.id);
                    const groupEditors = currentGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
                    if (groupEditors.length > 0) {
                        return { editor: groupEditors[groupEditors.length - 1], groupId: currentGroup.id };
                    }
                }
            }
            return undefined;
        }
    }
    exports.OpenPreviousEditor = OpenPreviousEditor;
    class OpenNextEditorInGroup extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.nextEditorInGroup',
                title: (0, nls_1.localize2)('nextEditorInGroup', 'Open Next Editor in Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */),
                    mac: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */)
                    }
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            const group = editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const index = group.activeEditor ? editors.indexOf(group.activeEditor) : -1;
            return { editor: index + 1 < editors.length ? editors[index + 1] : editors[0], groupId: group.id };
        }
    }
    exports.OpenNextEditorInGroup = OpenNextEditorInGroup;
    class OpenPreviousEditorInGroup extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.previousEditorInGroup',
                title: (0, nls_1.localize2)('openPreviousEditorInGroup', 'Open Previous Editor in Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */),
                    mac: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */)
                    }
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            const group = editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const index = group.activeEditor ? editors.indexOf(group.activeEditor) : -1;
            return { editor: index > 0 ? editors[index - 1] : editors[editors.length - 1], groupId: group.id };
        }
    }
    exports.OpenPreviousEditorInGroup = OpenPreviousEditorInGroup;
    class OpenFirstEditorInGroup extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.firstEditorInGroup',
                title: (0, nls_1.localize2)('firstEditorInGroup', 'Open First Editor in Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            const group = editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            return { editor: editors[0], groupId: group.id };
        }
    }
    exports.OpenFirstEditorInGroup = OpenFirstEditorInGroup;
    class OpenLastEditorInGroup extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.lastEditorInGroup',
                title: (0, nls_1.localize2)('lastEditorInGroup', 'Open Last Editor in Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 512 /* KeyMod.Alt */ | 21 /* KeyCode.Digit0 */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 30 /* KeyCode.Digit9 */],
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 21 /* KeyCode.Digit0 */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 30 /* KeyCode.Digit9 */]
                    }
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            const group = editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            return { editor: editors[editors.length - 1], groupId: group.id };
        }
    }
    exports.OpenLastEditorInGroup = OpenLastEditorInGroup;
    class NavigateForwardAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.navigateForward'; }
        static { this.LABEL = (0, nls_1.localize)('navigateForward', "Go Forward"); }
        constructor() {
            super({
                id: NavigateForwardAction.ID,
                title: {
                    ...(0, nls_1.localize2)('navigateForward', "Go Forward"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miForward', comment: ['&& denotes a mnemonic'] }, "&&Forward")
                },
                f1: true,
                icon: codicons_1.Codicon.arrowRight,
                precondition: contextkey_1.ContextKeyExpr.has('canNavigateForward'),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    win: { primary: 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */ },
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 88 /* KeyCode.Minus */ },
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 88 /* KeyCode.Minus */ }
                },
                menu: [
                    { id: actions_2.MenuId.MenubarGoMenu, group: '1_history_nav', order: 2 },
                    { id: actions_2.MenuId.CommandCenter, order: 2 }
                ]
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goForward(0 /* GoFilter.NONE */);
        }
    }
    exports.NavigateForwardAction = NavigateForwardAction;
    class NavigateBackwardsAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.navigateBack'; }
        static { this.LABEL = (0, nls_1.localize)('navigateBack', "Go Back"); }
        constructor() {
            super({
                id: NavigateBackwardsAction.ID,
                title: {
                    ...(0, nls_1.localize2)('navigateBack', "Go Back"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miBack', comment: ['&& denotes a mnemonic'] }, "&&Back")
                },
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.has('canNavigateBack'),
                icon: codicons_1.Codicon.arrowLeft,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    win: { primary: 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */ },
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 88 /* KeyCode.Minus */ },
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 88 /* KeyCode.Minus */ }
                },
                menu: [
                    { id: actions_2.MenuId.MenubarGoMenu, group: '1_history_nav', order: 1 },
                    { id: actions_2.MenuId.CommandCenter, order: 1 }
                ]
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goBack(0 /* GoFilter.NONE */);
        }
    }
    exports.NavigateBackwardsAction = NavigateBackwardsAction;
    class NavigatePreviousAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateLast',
                title: (0, nls_1.localize2)('navigatePrevious', 'Go Previous'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goPrevious(0 /* GoFilter.NONE */);
        }
    }
    exports.NavigatePreviousAction = NavigatePreviousAction;
    class NavigateForwardInEditsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateForwardInEditLocations',
                title: (0, nls_1.localize2)('navigateForwardInEdits', 'Go Forward in Edit Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goForward(1 /* GoFilter.EDITS */);
        }
    }
    exports.NavigateForwardInEditsAction = NavigateForwardInEditsAction;
    class NavigateBackwardsInEditsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateBackInEditLocations',
                title: (0, nls_1.localize2)('navigateBackInEdits', 'Go Back in Edit Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goBack(1 /* GoFilter.EDITS */);
        }
    }
    exports.NavigateBackwardsInEditsAction = NavigateBackwardsInEditsAction;
    class NavigatePreviousInEditsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigatePreviousInEditLocations',
                title: (0, nls_1.localize2)('navigatePreviousInEdits', 'Go Previous in Edit Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goPrevious(1 /* GoFilter.EDITS */);
        }
    }
    exports.NavigatePreviousInEditsAction = NavigatePreviousInEditsAction;
    class NavigateToLastEditLocationAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateToLastEditLocation',
                title: (0, nls_1.localize2)('navigateToLastEditLocation', 'Go to Last Edit Location'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 47 /* KeyCode.KeyQ */)
                }
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goLast(1 /* GoFilter.EDITS */);
        }
    }
    exports.NavigateToLastEditLocationAction = NavigateToLastEditLocationAction;
    class NavigateForwardInNavigationsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateForwardInNavigationLocations',
                title: (0, nls_1.localize2)('navigateForwardInNavigations', 'Go Forward in Navigation Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goForward(2 /* GoFilter.NAVIGATION */);
        }
    }
    exports.NavigateForwardInNavigationsAction = NavigateForwardInNavigationsAction;
    class NavigateBackwardsInNavigationsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateBackInNavigationLocations',
                title: (0, nls_1.localize2)('navigateBackInNavigations', 'Go Back in Navigation Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goBack(2 /* GoFilter.NAVIGATION */);
        }
    }
    exports.NavigateBackwardsInNavigationsAction = NavigateBackwardsInNavigationsAction;
    class NavigatePreviousInNavigationsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigatePreviousInNavigationLocations',
                title: (0, nls_1.localize2)('navigatePreviousInNavigationLocations', 'Go Previous in Navigation Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goPrevious(2 /* GoFilter.NAVIGATION */);
        }
    }
    exports.NavigatePreviousInNavigationsAction = NavigatePreviousInNavigationsAction;
    class NavigateToLastNavigationLocationAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateToLastNavigationLocation',
                title: (0, nls_1.localize2)('navigateToLastNavigationLocation', 'Go to Last Navigation Location'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goLast(2 /* GoFilter.NAVIGATION */);
        }
    }
    exports.NavigateToLastNavigationLocationAction = NavigateToLastNavigationLocationAction;
    class ReopenClosedEditorAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.reopenClosedEditor'; }
        constructor() {
            super({
                id: ReopenClosedEditorAction.ID,
                title: (0, nls_1.localize2)('reopenClosedEditor', 'Reopen Closed Editor'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 50 /* KeyCode.KeyT */
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.reopenLastClosedEditor();
        }
    }
    exports.ReopenClosedEditorAction = ReopenClosedEditorAction;
    class ClearRecentFilesAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.clearRecentFiles'; }
        constructor() {
            super({
                id: ClearRecentFilesAction.ID,
                title: (0, nls_1.localize2)('clearRecentFiles', 'Clear Recently Opened...'),
                f1: true,
                category: actionCommonCategories_1.Categories.File
            });
        }
        async run(accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
            const historyService = accessor.get(history_1.IHistoryService);
            // Ask for confirmation
            const { confirmed } = await dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmClearRecentsMessage', "Do you want to clear all recently opened files and workspaces?"),
                detail: (0, nls_1.localize)('confirmClearDetail', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'clearButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Clear")
            });
            if (!confirmed) {
                return;
            }
            // Clear global recently opened
            workspacesService.clearRecentlyOpened();
            // Clear workspace specific recently opened
            historyService.clearRecentlyOpened();
        }
    }
    exports.ClearRecentFilesAction = ClearRecentFilesAction;
    class ShowEditorsInActiveGroupByMostRecentlyUsedAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.showEditorsInActiveGroup'; }
        constructor() {
            super({
                id: ShowEditorsInActiveGroupByMostRecentlyUsedAction.ID,
                title: (0, nls_1.localize2)('showEditorsInActiveGroup', 'Show Editors in Active Group By Most Recently Used'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.quickAccess.show(editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX);
        }
    }
    exports.ShowEditorsInActiveGroupByMostRecentlyUsedAction = ShowEditorsInActiveGroupByMostRecentlyUsedAction;
    class ShowAllEditorsByAppearanceAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.showAllEditors'; }
        constructor() {
            super({
                id: ShowAllEditorsByAppearanceAction.ID,
                title: (0, nls_1.localize2)('showAllEditors', 'Show All Editors By Appearance'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 46 /* KeyCode.KeyP */),
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 2 /* KeyCode.Tab */
                    }
                },
                category: actionCommonCategories_1.Categories.File
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.quickAccess.show(editorQuickAccess_1.AllEditorsByAppearanceQuickAccess.PREFIX);
        }
    }
    exports.ShowAllEditorsByAppearanceAction = ShowAllEditorsByAppearanceAction;
    class ShowAllEditorsByMostRecentlyUsedAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.showAllEditorsByMostRecentlyUsed'; }
        constructor() {
            super({
                id: ShowAllEditorsByMostRecentlyUsedAction.ID,
                title: (0, nls_1.localize2)('showAllEditorsByMostRecentlyUsed', 'Show All Editors By Most Recently Used'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.quickAccess.show(editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX);
        }
    }
    exports.ShowAllEditorsByMostRecentlyUsedAction = ShowAllEditorsByMostRecentlyUsedAction;
    class AbstractQuickAccessEditorAction extends actions_2.Action2 {
        constructor(desc, prefix, itemActivation) {
            super(desc);
            this.prefix = prefix;
            this.itemActivation = itemActivation;
        }
        async run(accessor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keybindings = keybindingService.lookupKeybindings(this.desc.id);
            quickInputService.quickAccess.show(this.prefix, {
                quickNavigateConfiguration: { keybindings },
                itemActivation: this.itemActivation
            });
        }
    }
    class QuickAccessPreviousRecentlyUsedEditorAction extends AbstractQuickAccessEditorAction {
        constructor() {
            super({
                id: 'workbench.action.quickOpenPreviousRecentlyUsedEditor',
                title: (0, nls_1.localize2)('quickOpenPreviousRecentlyUsedEditor', 'Quick Open Previous Recently Used Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined);
        }
    }
    exports.QuickAccessPreviousRecentlyUsedEditorAction = QuickAccessPreviousRecentlyUsedEditorAction;
    class QuickAccessLeastRecentlyUsedEditorAction extends AbstractQuickAccessEditorAction {
        constructor() {
            super({
                id: 'workbench.action.quickOpenLeastRecentlyUsedEditor',
                title: (0, nls_1.localize2)('quickOpenLeastRecentlyUsedEditor', 'Quick Open Least Recently Used Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined);
        }
    }
    exports.QuickAccessLeastRecentlyUsedEditorAction = QuickAccessLeastRecentlyUsedEditorAction;
    class QuickAccessPreviousRecentlyUsedEditorInGroupAction extends AbstractQuickAccessEditorAction {
        constructor() {
            super({
                id: 'workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup',
                title: (0, nls_1.localize2)('quickOpenPreviousRecentlyUsedEditorInGroup', 'Quick Open Previous Recently Used Editor in Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 2 /* KeyCode.Tab */,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 2 /* KeyCode.Tab */
                    }
                },
                precondition: contextkeys_1.ActiveEditorGroupEmptyContext.toNegated(),
                category: actionCommonCategories_1.Categories.View
            }, editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined);
        }
    }
    exports.QuickAccessPreviousRecentlyUsedEditorInGroupAction = QuickAccessPreviousRecentlyUsedEditorInGroupAction;
    class QuickAccessLeastRecentlyUsedEditorInGroupAction extends AbstractQuickAccessEditorAction {
        constructor() {
            super({
                id: 'workbench.action.quickOpenLeastRecentlyUsedEditorInGroup',
                title: (0, nls_1.localize2)('quickOpenLeastRecentlyUsedEditorInGroup', 'Quick Open Least Recently Used Editor in Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */
                    }
                },
                precondition: contextkeys_1.ActiveEditorGroupEmptyContext.toNegated(),
                category: actionCommonCategories_1.Categories.View
            }, editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX, quickInput_1.ItemActivation.LAST);
        }
    }
    exports.QuickAccessLeastRecentlyUsedEditorInGroupAction = QuickAccessLeastRecentlyUsedEditorInGroupAction;
    class QuickAccessPreviousEditorFromHistoryAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.openPreviousEditorFromHistory'; }
        constructor() {
            super({
                id: QuickAccessPreviousEditorFromHistoryAction.ID,
                title: (0, nls_1.localize2)('navigateEditorHistoryByInput', 'Quick Open Previous Editor from History'),
                f1: true
            });
        }
        async run(accessor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const keybindings = keybindingService.lookupKeybindings(QuickAccessPreviousEditorFromHistoryAction.ID);
            // Enforce to activate the first item in quick access if
            // the currently active editor group has n editor opened
            let itemActivation = undefined;
            if (editorGroupService.activeGroup.count === 0) {
                itemActivation = quickInput_1.ItemActivation.FIRST;
            }
            quickInputService.quickAccess.show('', { quickNavigateConfiguration: { keybindings }, itemActivation });
        }
    }
    exports.QuickAccessPreviousEditorFromHistoryAction = QuickAccessPreviousEditorFromHistoryAction;
    class OpenNextRecentlyUsedEditorAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openNextRecentlyUsedEditor',
                title: (0, nls_1.localize2)('openNextRecentlyUsedEditor', 'Open Next Recently Used Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            historyService.openNextRecentlyUsedEditor();
        }
    }
    exports.OpenNextRecentlyUsedEditorAction = OpenNextRecentlyUsedEditorAction;
    class OpenPreviousRecentlyUsedEditorAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openPreviousRecentlyUsedEditor',
                title: (0, nls_1.localize2)('openPreviousRecentlyUsedEditor', 'Open Previous Recently Used Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            historyService.openPreviouslyUsedEditor();
        }
    }
    exports.OpenPreviousRecentlyUsedEditorAction = OpenPreviousRecentlyUsedEditorAction;
    class OpenNextRecentlyUsedEditorInGroupAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openNextRecentlyUsedEditorInGroup',
                title: (0, nls_1.localize2)('openNextRecentlyUsedEditorInGroup', 'Open Next Recently Used Editor In Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            historyService.openNextRecentlyUsedEditor(editorGroupsService.activeGroup.id);
        }
    }
    exports.OpenNextRecentlyUsedEditorInGroupAction = OpenNextRecentlyUsedEditorInGroupAction;
    class OpenPreviousRecentlyUsedEditorInGroupAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openPreviousRecentlyUsedEditorInGroup',
                title: (0, nls_1.localize2)('openPreviousRecentlyUsedEditorInGroup', 'Open Previous Recently Used Editor In Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            historyService.openPreviouslyUsedEditor(editorGroupsService.activeGroup.id);
        }
    }
    exports.OpenPreviousRecentlyUsedEditorInGroupAction = OpenPreviousRecentlyUsedEditorInGroupAction;
    class ClearEditorHistoryAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.clearEditorHistory',
                title: (0, nls_1.localize2)('clearEditorHistory', 'Clear Editor History'),
                f1: true
            });
        }
        async run(accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const historyService = accessor.get(history_1.IHistoryService);
            // Ask for confirmation
            const { confirmed } = await dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmClearEditorHistoryMessage', "Do you want to clear the history of recently opened editors?"),
                detail: (0, nls_1.localize)('confirmClearDetail', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'clearButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Clear")
            });
            if (!confirmed) {
                return;
            }
            // Clear editor history
            historyService.clear();
        }
    }
    exports.ClearEditorHistoryAction = ClearEditorHistoryAction;
    class MoveEditorLeftInGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorLeftInGroup',
                title: (0, nls_1.localize2)('moveEditorLeft', 'Move Editor Left'),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */,
                    mac: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */)
                    }
                },
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'left' });
        }
    }
    exports.MoveEditorLeftInGroupAction = MoveEditorLeftInGroupAction;
    class MoveEditorRightInGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorRightInGroup',
                title: (0, nls_1.localize2)('moveEditorRight', 'Move Editor Right'),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */,
                    mac: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */)
                    }
                },
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'right' });
        }
    }
    exports.MoveEditorRightInGroupAction = MoveEditorRightInGroupAction;
    class MoveEditorToPreviousGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToPreviousGroup',
                title: (0, nls_1.localize2)('moveEditorToPreviousGroup', 'Move Editor into Previous Group'),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 15 /* KeyCode.LeftArrow */
                    }
                },
                f1: true,
                category: actionCommonCategories_1.Categories.View,
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'previous', by: 'group' });
        }
    }
    exports.MoveEditorToPreviousGroupAction = MoveEditorToPreviousGroupAction;
    class MoveEditorToNextGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToNextGroup',
                title: (0, nls_1.localize2)('moveEditorToNextGroup', 'Move Editor into Next Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 17 /* KeyCode.RightArrow */
                    }
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'next', by: 'group' });
        }
    }
    exports.MoveEditorToNextGroupAction = MoveEditorToNextGroupAction;
    class MoveEditorToAboveGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToAboveGroup',
                title: (0, nls_1.localize2)('moveEditorToAboveGroup', 'Move Editor into Group Above'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'up', by: 'group' });
        }
    }
    exports.MoveEditorToAboveGroupAction = MoveEditorToAboveGroupAction;
    class MoveEditorToBelowGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToBelowGroup',
                title: (0, nls_1.localize2)('moveEditorToBelowGroup', 'Move Editor into Group Below'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'down', by: 'group' });
        }
    }
    exports.MoveEditorToBelowGroupAction = MoveEditorToBelowGroupAction;
    class MoveEditorToLeftGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToLeftGroup',
                title: (0, nls_1.localize2)('moveEditorToLeftGroup', 'Move Editor into Left Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'left', by: 'group' });
        }
    }
    exports.MoveEditorToLeftGroupAction = MoveEditorToLeftGroupAction;
    class MoveEditorToRightGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToRightGroup',
                title: (0, nls_1.localize2)('moveEditorToRightGroup', 'Move Editor into Right Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'right', by: 'group' });
        }
    }
    exports.MoveEditorToRightGroupAction = MoveEditorToRightGroupAction;
    class MoveEditorToFirstGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToFirstGroup',
                title: (0, nls_1.localize2)('moveEditorToFirstGroup', 'Move Editor into First Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 22 /* KeyCode.Digit1 */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 22 /* KeyCode.Digit1 */
                    }
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'first', by: 'group' });
        }
    }
    exports.MoveEditorToFirstGroupAction = MoveEditorToFirstGroupAction;
    class MoveEditorToLastGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToLastGroup',
                title: (0, nls_1.localize2)('moveEditorToLastGroup', 'Move Editor into Last Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 30 /* KeyCode.Digit9 */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 30 /* KeyCode.Digit9 */
                    }
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'last', by: 'group' });
        }
    }
    exports.MoveEditorToLastGroupAction = MoveEditorToLastGroupAction;
    class SplitEditorToPreviousGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToPreviousGroup',
                title: (0, nls_1.localize2)('splitEditorToPreviousGroup', 'Split Editor into Previous Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'previous', by: 'group' });
        }
    }
    exports.SplitEditorToPreviousGroupAction = SplitEditorToPreviousGroupAction;
    class SplitEditorToNextGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToNextGroup',
                title: (0, nls_1.localize2)('splitEditorToNextGroup', 'Split Editor into Next Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'next', by: 'group' });
        }
    }
    exports.SplitEditorToNextGroupAction = SplitEditorToNextGroupAction;
    class SplitEditorToAboveGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToAboveGroup',
                title: (0, nls_1.localize2)('splitEditorToAboveGroup', 'Split Editor into Group Above'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'up', by: 'group' });
        }
    }
    exports.SplitEditorToAboveGroupAction = SplitEditorToAboveGroupAction;
    class SplitEditorToBelowGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToBelowGroup',
                title: (0, nls_1.localize2)('splitEditorToBelowGroup', 'Split Editor into Group Below'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'down', by: 'group' });
        }
    }
    exports.SplitEditorToBelowGroupAction = SplitEditorToBelowGroupAction;
    class SplitEditorToLeftGroupAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.splitEditorToLeftGroup'; }
        static { this.LABEL = (0, nls_1.localize)('splitEditorToLeftGroup', "Split Editor into Left Group"); }
        constructor() {
            super({
                id: 'workbench.action.splitEditorToLeftGroup',
                title: (0, nls_1.localize2)('splitEditorToLeftGroup', "Split Editor into Left Group"),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'left', by: 'group' });
        }
    }
    exports.SplitEditorToLeftGroupAction = SplitEditorToLeftGroupAction;
    class SplitEditorToRightGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToRightGroup',
                title: (0, nls_1.localize2)('splitEditorToRightGroup', 'Split Editor into Right Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'right', by: 'group' });
        }
    }
    exports.SplitEditorToRightGroupAction = SplitEditorToRightGroupAction;
    class SplitEditorToFirstGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToFirstGroup',
                title: (0, nls_1.localize2)('splitEditorToFirstGroup', 'Split Editor into First Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'first', by: 'group' });
        }
    }
    exports.SplitEditorToFirstGroupAction = SplitEditorToFirstGroupAction;
    class SplitEditorToLastGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToLastGroup',
                title: (0, nls_1.localize2)('splitEditorToLastGroup', 'Split Editor into Last Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'last', by: 'group' });
        }
    }
    exports.SplitEditorToLastGroupAction = SplitEditorToLastGroupAction;
    class EditorLayoutSingleAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutSingle'; }
        constructor() {
            super({
                id: EditorLayoutSingleAction.ID,
                title: (0, nls_1.localize2)('editorLayoutSingle', 'Single Column Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}] });
        }
    }
    exports.EditorLayoutSingleAction = EditorLayoutSingleAction;
    class EditorLayoutTwoColumnsAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutTwoColumns'; }
        constructor() {
            super({
                id: EditorLayoutTwoColumnsAction.ID,
                title: (0, nls_1.localize2)('editorLayoutTwoColumns', 'Two Columns Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, {}], orientation: 0 /* GroupOrientation.HORIZONTAL */ });
        }
    }
    exports.EditorLayoutTwoColumnsAction = EditorLayoutTwoColumnsAction;
    class EditorLayoutThreeColumnsAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutThreeColumns'; }
        constructor() {
            super({
                id: EditorLayoutThreeColumnsAction.ID,
                title: (0, nls_1.localize2)('editorLayoutThreeColumns', 'Three Columns Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, {}, {}], orientation: 0 /* GroupOrientation.HORIZONTAL */ });
        }
    }
    exports.EditorLayoutThreeColumnsAction = EditorLayoutThreeColumnsAction;
    class EditorLayoutTwoRowsAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutTwoRows'; }
        constructor() {
            super({
                id: EditorLayoutTwoRowsAction.ID,
                title: (0, nls_1.localize2)('editorLayoutTwoRows', 'Two Rows Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, {}], orientation: 1 /* GroupOrientation.VERTICAL */ });
        }
    }
    exports.EditorLayoutTwoRowsAction = EditorLayoutTwoRowsAction;
    class EditorLayoutThreeRowsAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutThreeRows'; }
        constructor() {
            super({
                id: EditorLayoutThreeRowsAction.ID,
                title: (0, nls_1.localize2)('editorLayoutThreeRows', 'Three Rows Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, {}, {}], orientation: 1 /* GroupOrientation.VERTICAL */ });
        }
    }
    exports.EditorLayoutThreeRowsAction = EditorLayoutThreeRowsAction;
    class EditorLayoutTwoByTwoGridAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutTwoByTwoGrid'; }
        constructor() {
            super({
                id: EditorLayoutTwoByTwoGridAction.ID,
                title: (0, nls_1.localize2)('editorLayoutTwoByTwoGrid', 'Grid Editor Layout (2x2)'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{ groups: [{}, {}] }, { groups: [{}, {}] }] });
        }
    }
    exports.EditorLayoutTwoByTwoGridAction = EditorLayoutTwoByTwoGridAction;
    class EditorLayoutTwoColumnsBottomAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutTwoColumnsBottom'; }
        constructor() {
            super({
                id: EditorLayoutTwoColumnsBottomAction.ID,
                title: (0, nls_1.localize2)('editorLayoutTwoColumnsBottom', 'Two Columns Bottom Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, { groups: [{}, {}] }], orientation: 1 /* GroupOrientation.VERTICAL */ });
        }
    }
    exports.EditorLayoutTwoColumnsBottomAction = EditorLayoutTwoColumnsBottomAction;
    class EditorLayoutTwoRowsRightAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutTwoRowsRight'; }
        constructor() {
            super({
                id: EditorLayoutTwoRowsRightAction.ID,
                title: (0, nls_1.localize2)('editorLayoutTwoRowsRight', 'Two Rows Right Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, { groups: [{}, {}] }], orientation: 0 /* GroupOrientation.HORIZONTAL */ });
        }
    }
    exports.EditorLayoutTwoRowsRightAction = EditorLayoutTwoRowsRightAction;
    class AbstractCreateEditorGroupAction extends actions_2.Action2 {
        constructor(desc, direction) {
            super(desc);
            this.direction = direction;
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            // We are about to create a new empty editor group. We make an opiniated
            // decision here whether to focus that new editor group or not based
            // on what is currently focused. If focus is outside the editor area not
            // in the <body>, we do not focus, with the rationale that a user might
            // have focus on a tree/list with the intention to pick an element to
            // open in the new group from that tree/list.
            //
            // If focus is inside the editor area, we want to prevent the situation
            // of an editor having keyboard focus in an inactive editor group
            // (see https://github.com/microsoft/vscode/issues/189256)
            const activeDocument = (0, dom_1.getActiveDocument)();
            const focusNewGroup = layoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */) || activeDocument.activeElement === activeDocument.body;
            const group = editorGroupService.addGroup(editorGroupService.activeGroup, this.direction);
            editorGroupService.activateGroup(group);
            if (focusNewGroup) {
                group.focus();
            }
        }
    }
    class NewEditorGroupLeftAction extends AbstractCreateEditorGroupAction {
        constructor() {
            super({
                id: 'workbench.action.newGroupLeft',
                title: (0, nls_1.localize2)('newGroupLeft', 'New Editor Group to the Left'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 2 /* GroupDirection.LEFT */);
        }
    }
    exports.NewEditorGroupLeftAction = NewEditorGroupLeftAction;
    class NewEditorGroupRightAction extends AbstractCreateEditorGroupAction {
        constructor() {
            super({
                id: 'workbench.action.newGroupRight',
                title: (0, nls_1.localize2)('newGroupRight', 'New Editor Group to the Right'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 3 /* GroupDirection.RIGHT */);
        }
    }
    exports.NewEditorGroupRightAction = NewEditorGroupRightAction;
    class NewEditorGroupAboveAction extends AbstractCreateEditorGroupAction {
        constructor() {
            super({
                id: 'workbench.action.newGroupAbove',
                title: (0, nls_1.localize2)('newGroupAbove', 'New Editor Group Above'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 0 /* GroupDirection.UP */);
        }
    }
    exports.NewEditorGroupAboveAction = NewEditorGroupAboveAction;
    class NewEditorGroupBelowAction extends AbstractCreateEditorGroupAction {
        constructor() {
            super({
                id: 'workbench.action.newGroupBelow',
                title: (0, nls_1.localize2)('newGroupBelow', 'New Editor Group Below'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 1 /* GroupDirection.DOWN */);
        }
    }
    exports.NewEditorGroupBelowAction = NewEditorGroupBelowAction;
    class ToggleEditorTypeAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleEditorType',
                title: (0, nls_1.localize2)('toggleEditorType', 'Toggle Editor Type'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkeys_1.ActiveEditorAvailableEditorIdsContext
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorResolverService = accessor.get(editorResolverService_1.IEditorResolverService);
            const activeEditorPane = editorService.activeEditorPane;
            if (!activeEditorPane) {
                return;
            }
            const activeEditorResource = editor_1.EditorResourceAccessor.getCanonicalUri(activeEditorPane.input);
            if (!activeEditorResource) {
                return;
            }
            const editorIds = editorResolverService.getEditors(activeEditorResource).map(editor => editor.id).filter(id => id !== activeEditorPane.input.editorId);
            if (editorIds.length === 0) {
                return;
            }
            // Replace the current editor with the next avaiable editor type
            await editorService.replaceEditors([
                {
                    editor: activeEditorPane.input,
                    replacement: {
                        resource: activeEditorResource,
                        options: {
                            override: editorIds[0]
                        }
                    }
                }
            ], activeEditorPane.group);
        }
    }
    exports.ToggleEditorTypeAction = ToggleEditorTypeAction;
    class ReOpenInTextEditorAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.reopenTextEditor',
                title: (0, nls_1.localize2)('reopenTextEditor', 'Reopen Editor With Text Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkeys_1.ActiveEditorAvailableEditorIdsContext
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (!activeEditorPane) {
                return;
            }
            const activeEditorResource = editor_1.EditorResourceAccessor.getCanonicalUri(activeEditorPane.input);
            if (!activeEditorResource) {
                return;
            }
            // Replace the current editor with the text editor
            await editorService.replaceEditors([
                {
                    editor: activeEditorPane.input,
                    replacement: {
                        resource: activeEditorResource,
                        options: {
                            override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id
                        }
                    }
                }
            ], activeEditorPane.group);
        }
    }
    exports.ReOpenInTextEditorAction = ReOpenInTextEditorAction;
    class BaseMoveCopyEditorToNewWindowAction extends actions_2.Action2 {
        constructor(id, title, keybinding, move) {
            super({
                id,
                title,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkeys_1.ActiveEditorContext,
                keybinding,
                f1: true
            });
            this.move = move;
        }
        async run(accessor, resourceOrContext, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group, editor } = (0, editorCommands_1.resolveCommandsContext)(editorGroupService, (0, editorCommands_1.getCommandsContext)(resourceOrContext, context));
            if (group && editor) {
                const auxiliaryEditorPart = await editorGroupService.createAuxiliaryEditorPart();
                if (this.move) {
                    group.moveEditor(editor, auxiliaryEditorPart.activeGroup);
                }
                else {
                    group.copyEditor(editor, auxiliaryEditorPart.activeGroup);
                }
                auxiliaryEditorPart.activeGroup.focus();
            }
        }
    }
    class MoveEditorToNewWindowAction extends BaseMoveCopyEditorToNewWindowAction {
        constructor() {
            super(editorCommands_1.MOVE_EDITOR_INTO_NEW_WINDOW_COMMAND_ID, {
                ...(0, nls_1.localize2)('moveEditorToNewWindow', "Move Editor into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miMoveEditorToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Move Editor into New Window"),
            }, undefined, true);
        }
    }
    exports.MoveEditorToNewWindowAction = MoveEditorToNewWindowAction;
    class CopyEditorToNewindowAction extends BaseMoveCopyEditorToNewWindowAction {
        constructor() {
            super(editorCommands_1.COPY_EDITOR_INTO_NEW_WINDOW_COMMAND_ID, {
                ...(0, nls_1.localize2)('copyEditorToNewWindow', "Copy Editor into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miCopyEditorToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Copy Editor into New Window"),
            }, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 45 /* KeyCode.KeyO */), weight: 200 /* KeybindingWeight.WorkbenchContrib */ }, false);
        }
    }
    exports.CopyEditorToNewindowAction = CopyEditorToNewindowAction;
    class BaseMoveCopyEditorGroupToNewWindowAction extends actions_2.Action2 {
        constructor(id, title, move) {
            super({
                id,
                title,
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
            this.move = move;
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const activeGroup = editorGroupService.activeGroup;
            const auxiliaryEditorPart = await editorGroupService.createAuxiliaryEditorPart();
            editorGroupService.mergeGroup(activeGroup, auxiliaryEditorPart.activeGroup, {
                mode: this.move ? 1 /* MergeGroupMode.MOVE_EDITORS */ : 0 /* MergeGroupMode.COPY_EDITORS */
            });
            auxiliaryEditorPart.activeGroup.focus();
        }
    }
    class MoveEditorGroupToNewWindowAction extends BaseMoveCopyEditorGroupToNewWindowAction {
        constructor() {
            super(editorCommands_1.MOVE_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID, {
                ...(0, nls_1.localize2)('moveEditorGroupToNewWindow', "Move Editor Group into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miMoveEditorGroupToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Move Editor Group into New Window"),
            }, true);
        }
    }
    exports.MoveEditorGroupToNewWindowAction = MoveEditorGroupToNewWindowAction;
    class CopyEditorGroupToNewWindowAction extends BaseMoveCopyEditorGroupToNewWindowAction {
        constructor() {
            super(editorCommands_1.COPY_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID, {
                ...(0, nls_1.localize2)('copyEditorGroupToNewWindow', "Copy Editor Group into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miCopyEditorGroupToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Copy Editor Group into New Window"),
            }, false);
        }
    }
    exports.CopyEditorGroupToNewWindowAction = CopyEditorGroupToNewWindowAction;
    class RestoreEditorsToMainWindowAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.restoreEditorsToMainWindow',
                title: {
                    ...(0, nls_1.localize2)('restoreEditorsToMainWindow', "Restore Editors into Main Window"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miRestoreEditorsToMainWindow', comment: ['&& denotes a mnemonic'] }, "&&Restore Editors into Main Window"),
                },
                f1: true,
                precondition: contextkeys_1.IsAuxiliaryWindowFocusedContext,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.mergeAllGroups(editorGroupService.mainPart.activeGroup);
        }
    }
    exports.RestoreEditorsToMainWindowAction = RestoreEditorsToMainWindowAction;
    class NewEmptyEditorWindowAction extends actions_2.Action2 {
        constructor() {
            super({
                id: editorCommands_1.NEW_EMPTY_EDITOR_WINDOW_COMMAND_ID,
                title: {
                    ...(0, nls_1.localize2)('newEmptyEditorWindow', "New Empty Editor Window"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miNewEmptyEditorWindow', comment: ['&& denotes a mnemonic'] }, "&&New Empty Editor Window"),
                },
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const auxiliaryEditorPart = await editorGroupService.createAuxiliaryEditorPart();
            auxiliaryEditorPart.activeGroup.focus();
        }
    }
    exports.NewEmptyEditorWindowAction = NewEmptyEditorWindowAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFDaEcsTUFBTSxvQkFBcUIsU0FBUSxpQkFBTztRQUV6QyxZQUNDLElBQStCLEVBQ2QsU0FBaUIsRUFDakIsV0FBcUI7WUFFdEMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBSEssY0FBUyxHQUFULFNBQVMsQ0FBUTtZQUNqQixnQkFBVyxHQUFYLFdBQVcsQ0FBVTtRQUd2QyxDQUFDO1FBRVEsR0FBRyxDQUFDLFFBQTBCO1lBQ3RDLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMEJBQWUsQ0FBQyxDQUFDO1lBRXJELE9BQU8sY0FBYyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN4RSxDQUFDO0tBQ0Q7SUFFRCxNQUFlLHlCQUEwQixTQUFRLGlCQUFPO1FBRTdDLFlBQVksQ0FBQyxvQkFBMkM7WUFDakUsT0FBTyxJQUFBLHVEQUFpQyxFQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxPQUEyQjtZQUN6RSxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMENBQW9CLENBQUMsQ0FBQztZQUM5RCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUVqRSxJQUFBLDRCQUFXLEVBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxF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