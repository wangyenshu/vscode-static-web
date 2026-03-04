/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/workbench/browser/editor", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/browser/parts/editor/textDiffEditor", "vs/workbench/browser/parts/editor/binaryDiffEditor", "vs/workbench/browser/parts/editor/editorStatus", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/editor/editorActions", "vs/workbench/browser/parts/editor/editorCommands", "./diffEditorCommands", "vs/workbench/browser/quickaccess", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/workbench/browser/codeeditor", "vs/workbench/common/contributions", "vs/workbench/browser/parts/editor/editorAutoSave", "vs/platform/quickinput/common/quickAccess", "vs/workbench/browser/parts/editor/editorQuickAccess", "vs/base/common/network", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/services/untitled/common/untitledTextEditorHandler", "vs/workbench/browser/parts/editor/editorConfiguration", "vs/workbench/browser/actions/layoutActions", "vs/editor/common/editorContextKeys"], function (require, exports, platform_1, nls_1, editor_1, editor_2, contextkeys_1, sideBySideEditorInput_1, textResourceEditor_1, sideBySideEditor_1, diffEditorInput_1, untitledTextEditorInput_1, textResourceEditorInput_1, textDiffEditor_1, binaryDiffEditor_1, editorStatus_1, actionCommonCategories_1, actions_1, descriptors_1, editorActions_1, editorCommands_1, diffEditorCommands_1, quickaccess_1, keybindingsRegistry_1, contextkey_1, platform_2, editorExtensions_1, codeeditor_1, contributions_1, editorAutoSave_1, quickAccess_1, editorQuickAccess_1, network_1, codicons_1, iconRegistry_1, untitledTextEditorHandler_1, editorConfiguration_1, layoutActions_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Editor Registrations
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(textResourceEditor_1.TextResourceEditor, textResourceEditor_1.TextResourceEditor.ID, (0, nls_1.localize)('textEditor', "Text Editor")), [
        new descriptors_1.SyncDescriptor(untitledTextEditorInput_1.UntitledTextEditorInput),
        new descriptors_1.SyncDescriptor(textResourceEditorInput_1.TextResourceEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(textDiffEditor_1.TextDiffEditor, textDiffEditor_1.TextDiffEditor.ID, (0, nls_1.localize)('textDiffEditor', "Text Diff Editor")), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(binaryDiffEditor_1.BinaryResourceDiffEditor, binaryDiffEditor_1.BinaryResourceDiffEditor.ID, (0, nls_1.localize)('binaryDiffEditor', "Binary Diff Editor")), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(sideBySideEditor_1.SideBySideEditor, sideBySideEditor_1.SideBySideEditor.ID, (0, nls_1.localize)('sideBySideEditor', "Side by Side Editor")), [
        new descriptors_1.SyncDescriptor(sideBySideEditorInput_1.SideBySideEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(untitledTextEditorInput_1.UntitledTextEditorInput.ID, untitledTextEditorHandler_1.UntitledTextEditorInputSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(sideBySideEditorInput_1.SideBySideEditorInput.ID, sideBySideEditorInput_1.SideBySideEditorInputSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(diffEditorInput_1.DiffEditorInput.ID, diffEditorInput_1.DiffEditorInputSerializer);
    //#endregion
    //#region Workbench Contributions
    (0, contributions_1.registerWorkbenchContribution2)(editorAutoSave_1.EditorAutoSave.ID, editorAutoSave_1.EditorAutoSave, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(editorStatus_1.EditorStatusContribution.ID, editorStatus_1.EditorStatusContribution, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(untitledTextEditorHandler_1.UntitledTextEditorWorkingCopyEditorHandler.ID, untitledTextEditorHandler_1.UntitledTextEditorWorkingCopyEditorHandler, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(editorConfiguration_1.DynamicEditorConfigurations.ID, editorConfiguration_1.DynamicEditorConfigurations, 2 /* WorkbenchPhase.BlockRestore */);
    (0, editorExtensions_1.registerEditorContribution)(codeeditor_1.FloatingEditorClickMenu.ID, codeeditor_1.FloatingEditorClickMenu, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    //#endregion
    //#region Quick Access
    const quickAccessRegistry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
    const editorPickerContextKey = 'inEditorsPicker';
    const editorPickerContext = contextkey_1.ContextKeyExpr.and(quickaccess_1.inQuickPickContext, contextkey_1.ContextKeyExpr.has(editorPickerContextKey));
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess,
        prefix: editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: (0, nls_1.localize)('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: (0, nls_1.localize)('activeGroupEditorsByMostRecentlyUsedQuickAccess', "Show Editors in Active Group by Most Recently Used"), commandId: editorActions_1.ShowEditorsInActiveGroupByMostRecentlyUsedAction.ID }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.AllEditorsByAppearanceQuickAccess,
        prefix: editorQuickAccess_1.AllEditorsByAppearanceQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: (0, nls_1.localize)('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: (0, nls_1.localize)('allEditorsByAppearanceQuickAccess', "Show All Opened Editors By Appearance"), commandId: editorActions_1.ShowAllEditorsByAppearanceAction.ID }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess,
        prefix: editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: (0, nls_1.localize)('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: (0, nls_1.localize)('allEditorsByMostRecentlyUsedQuickAccess', "Show All Opened Editors By Most Recently Used"), commandId: editorActions_1.ShowAllEditorsByMostRecentlyUsedAction.ID }]
    });
    //#endregion
    //#region Actions & Commands
    (0, actions_1.registerAction2)(editorStatus_1.ChangeLanguageAction);
    (0, actions_1.registerAction2)(editorStatus_1.ChangeEOLAction);
    (0, actions_1.registerAction2)(editorStatus_1.ChangeEncodingAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateForwardAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateBackwardsAction);
    (0, actions_1.registerAction2)(editorActions_1.OpenNextEditor);
    (0, actions_1.registerAction2)(editorActions_1.OpenPreviousEditor);
    (0, actions_1.registerAction2)(editorActions_1.OpenNextEditorInGroup);
    (0, actions_1.registerAction2)(editorActions_1.OpenPreviousEditorInGroup);
    (0, actions_1.registerAction2)(editorActions_1.OpenFirstEditorInGroup);
    (0, actions_1.registerAction2)(editorActions_1.OpenLastEditorInGroup);
    (0, actions_1.registerAction2)(editorActions_1.OpenNextRecentlyUsedEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.OpenPreviousRecentlyUsedEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.OpenNextRecentlyUsedEditorInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.OpenPreviousRecentlyUsedEditorInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.ReopenClosedEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.ClearRecentFilesAction);
    (0, actions_1.registerAction2)(editorActions_1.ShowAllEditorsByAppearanceAction);
    (0, actions_1.registerAction2)(editorActions_1.ShowAllEditorsByMostRecentlyUsedAction);
    (0, actions_1.registerAction2)(editorActions_1.ShowEditorsInActiveGroupByMostRecentlyUsedAction);
    (0, actions_1.registerAction2)(editorActions_1.CloseAllEditorsAction);
    (0, actions_1.registerAction2)(editorActions_1.CloseAllEditorGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.CloseLeftEditorsInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.CloseEditorsInOtherGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.CloseEditorInAllGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.RevertAndCloseEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorOrthogonalAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorLeftAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorRightAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorUpAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorDownAction);
    (0, actions_1.registerAction2)(editorActions_1.JoinTwoGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.JoinAllGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateBetweenGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.ResetGroupSizesAction);
    (0, actions_1.registerAction2)(editorActions_1.ToggleGroupSizesAction);
    (0, actions_1.registerAction2)(editorActions_1.MaximizeGroupHideSidebarAction);
    (0, actions_1.registerAction2)(editorActions_1.ToggleMaximizeEditorGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MinimizeOtherGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.MinimizeOtherGroupsHideSidebarAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorLeftInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorRightInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveGroupLeftAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveGroupRightAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveGroupUpAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveGroupDownAction);
    (0, actions_1.registerAction2)(editorActions_1.DuplicateGroupLeftAction);
    (0, actions_1.registerAction2)(editorActions_1.DuplicateGroupRightAction);
    (0, actions_1.registerAction2)(editorActions_1.DuplicateGroupUpAction);
    (0, actions_1.registerAction2)(editorActions_1.DuplicateGroupDownAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToPreviousGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToNextGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToFirstGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToLastGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToLeftGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToRightGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToAboveGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToBelowGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToPreviousGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToNextGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToFirstGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToLastGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToLeftGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToRightGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToAboveGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToBelowGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.FocusActiveGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.FocusFirstGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.FocusLastGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.FocusPreviousGroup);
    (0, actions_1.registerAction2)(editorActions_1.FocusNextGroup);
    (0, actions_1.registerAction2)(editorActions_1.FocusLeftGroup);
    (0, actions_1.registerAction2)(editorActions_1.FocusRightGroup);
    (0, actions_1.registerAction2)(editorActions_1.FocusAboveGroup);
    (0, actions_1.registerAction2)(editorActions_1.FocusBelowGroup);
    (0, actions_1.registerAction2)(editorActions_1.NewEditorGroupLeftAction);
    (0, actions_1.registerAction2)(editorActions_1.NewEditorGroupRightAction);
    (0, actions_1.registerAction2)(editorActions_1.NewEditorGroupAboveAction);
    (0, actions_1.registerAction2)(editorActions_1.NewEditorGroupBelowAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigatePreviousAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateForwardInEditsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateBackwardsInEditsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigatePreviousInEditsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateToLastEditLocationAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateForwardInNavigationsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateBackwardsInNavigationsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigatePreviousInNavigationsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateToLastNavigationLocationAction);
    (0, actions_1.registerAction2)(editorActions_1.ClearEditorHistoryAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutSingleAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutTwoColumnsAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutThreeColumnsAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutTwoRowsAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutThreeRowsAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutTwoByTwoGridAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutTwoRowsRightAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutTwoColumnsBottomAction);
    (0, actions_1.registerAction2)(editorActions_1.ToggleEditorTypeAction);
    (0, actions_1.registerAction2)(editorActions_1.ReOpenInTextEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.QuickAccessPreviousRecentlyUsedEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.QuickAccessLeastRecentlyUsedEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.QuickAccessPreviousRecentlyUsedEditorInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.QuickAccessLeastRecentlyUsedEditorInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.QuickAccessPreviousEditorFromHistoryAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToNewWindowAction);
    (0, actions_1.registerAction2)(editorActions_1.CopyEditorToNewindowAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorGroupToNewWindowAction);
    (0, actions_1.registerAction2)(editorActions_1.CopyEditorGroupToNewWindowAction);
    (0, actions_1.registerAction2)(editorActions_1.RestoreEditorsToMainWindowAction);
    (0, actions_1.registerAction2)(editorActions_1.NewEmptyEditorWindowAction);
    const quickAccessNavigateNextInEditorPickerId = 'workbench.action.quickOpenNavigateNextInEditorPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigateNextInEditorPickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigateNextInEditorPickerId, true),
        when: editorPickerContext,
        primary: 2048 /* KeyMod.CtrlCmd */ | 2 /* KeyCode.Tab */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 2 /* KeyCode.Tab */ }
    });
    const quickAccessNavigatePreviousInEditorPickerId = 'workbench.action.quickOpenNavigatePreviousInEditorPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigatePreviousInEditorPickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigatePreviousInEditorPickerId, false),
        when: editorPickerContext,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */ }
    });
    (0, editorCommands_1.setup)();
    //#endregion
    //#region Menus
    // macOS: Touchbar
    if (platform_2.isMacintosh) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.TouchBarContext, {
            command: { id: editorActions_1.NavigateBackwardsAction.ID, title: editorActions_1.NavigateBackwardsAction.LABEL, icon: { dark: network_1.FileAccess.asFileUri('vs/workbench/browser/parts/editor/media/back-tb.png') } },
            group: 'navigation',
            order: 0
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.TouchBarContext, {
            command: { id: editorActions_1.NavigateForwardAction.ID, title: editorActions_1.NavigateForwardAction.LABEL, icon: { dark: network_1.FileAccess.asFileUri('vs/workbench/browser/parts/editor/media/forward-tb.png') } },
            group: 'navigation',
            order: 1
        });
    }
    // Empty Editor Group Toolbar
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroup, { command: { id: editorCommands_1.LOCK_GROUP_COMMAND_ID, title: (0, nls_1.localize)('lockGroupAction', "Lock Group"), icon: codicons_1.Codicon.unlock }, group: 'navigation', order: 10, when: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsAuxiliaryEditorPartContext, contextkeys_1.ActiveEditorGroupLockedContext.toNegated()) });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroup, { command: { id: editorCommands_1.UNLOCK_GROUP_COMMAND_ID, title: (0, nls_1.localize)('unlockGroupAction', "Unlock Group"), icon: codicons_1.Codicon.lock, toggled: contextkey_1.ContextKeyExpr.true() }, group: 'navigation', order: 10, when: contextkeys_1.ActiveEditorGroupLockedContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroup, { command: { id: editorCommands_1.CLOSE_EDITOR_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeGroupAction', "Close Group"), icon: codicons_1.Codicon.close }, group: 'navigation', order: 20, when: contextkey_1.ContextKeyExpr.or(contextkeys_1.IsAuxiliaryEditorPartContext, contextkeys_1.EditorPartMultipleEditorGroupsContext) });
    // Empty Editor Group Context Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_UP, title: (0, nls_1.localize)('splitUp', "Split Up") }, group: '2_split', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_DOWN, title: (0, nls_1.localize)('splitDown', "Split Down") }, group: '2_split', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_LEFT, title: (0, nls_1.localize)('splitLeft', "Split Left") }, group: '2_split', order: 30 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_RIGHT, title: (0, nls_1.localize)('splitRight', "Split Right") }, group: '2_split', order: 40 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.NEW_EMPTY_EDITOR_WINDOW_COMMAND_ID, title: (0, nls_1.localize)('newWindow', "New Window") }, group: '3_window', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.TOGGLE_LOCK_GROUP_COMMAND_ID, title: (0, nls_1.localize)('toggleLockGroup', "Lock Group"), toggled: contextkeys_1.ActiveEditorGroupLockedContext }, group: '4_lock', order: 10, when: contextkeys_1.IsAuxiliaryEditorPartContext.toNegated() /* already a primary action for aux windows */ });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.CLOSE_EDITOR_GROUP_COMMAND_ID, title: (0, nls_1.localize)('close', "Close") }, group: '5_close', order: 10, when: contextkeys_1.MultipleEditorGroupsContext });
    // Editor Tab Container Context Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.SPLIT_EDITOR_UP, title: (0, nls_1.localize)('splitUp', "Split Up") }, group: '2_split', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.SPLIT_EDITOR_DOWN, title: (0, nls_1.localize)('splitDown', "Split Down") }, group: '2_split', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.SPLIT_EDITOR_LEFT, title: (0, nls_1.localize)('splitLeft', "Split Left") }, group: '2_split', order: 30 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.SPLIT_EDITOR_RIGHT, title: (0, nls_1.localize)('splitRight', "Split Right") }, group: '2_split', order: 40 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.MOVE_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID, title: (0, nls_1.localize)('moveEditorGroupToNewWindow', "Move into New Window") }, group: '3_window', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.COPY_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID, title: (0, nls_1.localize)('copyEditorGroupToNewWindow', "Copy into New Window") }, group: '3_window', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { submenu: actions_1.MenuId.EditorTabsBarShowTabsSubmenu, title: (0, nls_1.localize)('tabBar', "Tab Bar"), group: '4_config', order: 10, when: contextkeys_1.InEditorZenModeContext.negate() });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsSubmenu, { command: { id: layoutActions_1.ShowMultipleEditorTabsAction.ID, title: (0, nls_1.localize)('multipleTabs', "Multiple Tabs"), toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.showTabs', 'multiple') }, group: '1_config', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsSubmenu, { command: { id: layoutActions_1.ShowSingleEditorTabAction.ID, title: (0, nls_1.localize)('singleTab', "Single Tab"), toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.showTabs', 'single') }, group: '1_config', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsSubmenu, { command: { id: layoutActions_1.HideEditorTabsAction.ID, title: (0, nls_1.localize)('hideTabs', "Hidden"), toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.showTabs', 'none') }, group: '1_config', order: 30 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { submenu: actions_1.MenuId.EditorTabsBarShowTabsZenModeSubmenu, title: (0, nls_1.localize)('tabBar', "Tab Bar"), group: '4_config', order: 10, when: contextkeys_1.InEditorZenModeContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsZenModeSubmenu, { command: { id: layoutActions_1.ZenShowMultipleEditorTabsAction.ID, title: (0, nls_1.localize)('multipleTabs', "Multiple Tabs"), toggled: contextkey_1.ContextKeyExpr.equals('config.zenMode.showTabs', 'multiple') }, group: '1_config', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsZenModeSubmenu, { command: { id: layoutActions_1.ZenShowSingleEditorTabAction.ID, title: (0, nls_1.localize)('singleTab', "Single Tab"), toggled: contextkey_1.ContextKeyExpr.equals('config.zenMode.showTabs', 'single') }, group: '1_config', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsZenModeSubmenu, { command: { id: layoutActions_1.ZenHideEditorTabsAction.ID, title: (0, nls_1.localize)('hideTabs', "Hidden"), toggled: contextkey_1.ContextKeyExpr.equals('config.zenMode.showTabs', 'none') }, group: '1_config', order: 30 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { submenu: actions_1.MenuId.EditorActionsPositionSubmenu, title: (0, nls_1.localize)('editorActionsPosition', "Editor Actions Position"), group: '4_config', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorActionsPositionSubmenu, { command: { id: layoutActions_1.EditorActionsDefaultAction.ID, title: (0, nls_1.localize)('tabBar', "Tab Bar"), toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.editorActionsLocation', 'default') }, group: '1_config', order: 10, when: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.showTabs', 'none').negate() });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorActionsPositionSubmenu, { command: { id: layoutActions_1.EditorActionsTitleBarAction.ID, title: (0, nls_1.localize)('titleBar', "Title Bar"), toggled: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.editor.editorActionsLocation', 'titleBar'), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.workbench.editor.showTabs', 'none'), contextkey_1.ContextKeyExpr.equals('config.workbench.editor.editorActionsLocation', 'default'))) }, group: '1_config', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorActionsPositionSubmenu, { command: { id: layoutActions_1.HideEditorActionsAction.ID, title: (0, nls_1.localize)('hidden', "Hidden"), toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.editorActionsLocation', 'hidden') }, group: '1_config', order: 30 });
    // Editor Title Context Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('close', "Close") }, group: '1_close', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeOthers', "Close Others"), precondition: contextkeys_1.EditorGroupEditorsCountContext.notEqualsTo('1') }, group: '1_close', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID, title: (0, nls_1.localize)('closeRight', "Close to the Right"), precondition: contextkeys_1.ActiveEditorLastInGroupContext.toNegated() }, group: '1_close', order: 30, when: contextkeys_1.EditorTabsVisibleContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID, title: (0, nls_1.localize)('closeAllSaved', "Close Saved") }, group: '1_close', order: 40 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeAll', "Close All") }, group: '1_close', order: 50 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.REOPEN_WITH_COMMAND_ID, title: (0, nls_1.localize)('reopenWith', "Reopen Editor With...") }, group: '1_open', order: 10, when: contextkeys_1.ActiveEditorAvailableEditorIdsContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.KEEP_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('keepOpen', "Keep Open"), precondition: contextkeys_1.ActiveEditorPinnedContext.toNegated() }, group: '3_preview', order: 10, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.PIN_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('pin', "Pin") }, group: '3_preview', order: 20, when: contextkeys_1.ActiveEditorStickyContext.toNegated() });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('unpin', "Unpin") }, group: '3_preview', order: 20, when: contextkeys_1.ActiveEditorStickyContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_UP, title: (0, nls_1.localize)('splitUp', "Split Up") }, group: '5_split', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_DOWN, title: (0, nls_1.localize)('splitDown', "Split Down") }, group: '5_split', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_LEFT, title: (0, nls_1.localize)('splitLeft', "Split Left") }, group: '5_split', order: 30 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_RIGHT, title: (0, nls_1.localize)('splitRight', "Split Right") }, group: '5_split', order: 40 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_IN_GROUP, title: (0, nls_1.localize)('splitInGroup', "Split in Group") }, group: '6_split_in_group', order: 10, when: contextkeys_1.ActiveEditorCanSplitInGroupContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.JOIN_EDITOR_IN_GROUP, title: (0, nls_1.localize)('joinInGroup', "Join in Group") }, group: '6_split_in_group', order: 10, when: contextkeys_1.SideBySideEditorActiveContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.MOVE_EDITOR_INTO_NEW_WINDOW_COMMAND_ID, title: (0, nls_1.localize)('moveToNewWindow', "Move into New Window") }, group: '7_new_window', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.COPY_EDITOR_INTO_NEW_WINDOW_COMMAND_ID, title: (0, nls_1.localize)('copyToNewWindow', "Copy into New Window") }, group: '7_new_window', order: 20 });
    // Editor Title Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: diffEditorCommands_1.TOGGLE_DIFF_SIDE_BY_SIDE, title: (0, nls_1.localize)('inlineView', "Inline View"), toggled: contextkey_1.ContextKeyExpr.equals('config.diffEditor.renderSideBySide', false) }, group: '1_diff', order: 10, when: contextkey_1.ContextKeyExpr.has('isInDiffEditor') });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.SHOW_EDITORS_IN_GROUP, title: (0, nls_1.localize)('showOpenedEditors', "Show Opened Editors") }, group: '3_open', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeAll', "Close All") }, group: '5_close', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID, title: (0, nls_1.localize)('closeAllSaved', "Close Saved") }, group: '5_close', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.TOGGLE_KEEP_EDITORS_COMMAND_ID, title: (0, nls_1.localize)('togglePreviewMode', "Enable Preview Editors"), toggled: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') }, group: '7_settings', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.TOGGLE_MAXIMIZE_EDITOR_GROUP, title: (0, nls_1.localize)('maximizeGroup', "Maximize Group") }, group: '8_group_operations', order: 5, when: contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorPartMaximizedEditorGroupContext.negate(), contextkeys_1.EditorPartMultipleEditorGroupsContext) });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.TOGGLE_MAXIMIZE_EDITOR_GROUP, title: (0, nls_1.localize)('unmaximizeGroup', "Unmaximize Group") }, group: '8_group_operations', order: 5, when: contextkeys_1.EditorPartMaximizedEditorGroupContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.TOGGLE_LOCK_GROUP_COMMAND_ID, title: (0, nls_1.localize)('lockGroup', "Lock Group"), toggled: contextkeys_1.ActiveEditorGroupLockedContext }, group: '8_group_operations', order: 10, when: contextkeys_1.IsAuxiliaryEditorPartContext.toNegated() /* already a primary action for aux windows */ });
    function appendEditorToolItem(primary, when, order, alternative, precondition) {
        const item = {
            command: {
                id: primary.id,
                title: primary.title,
                icon: primary.icon,
                toggled: primary.toggled,
                precondition
            },
            group: 'navigation',
            when,
            order
        };
        if (alternative) {
            item.alt = {
                id: alternative.id,
                title: alternative.title,
                icon: alternative.icon
            };
        }
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, item);
    }
    const SPLIT_ORDER = 100000; // towards the end
    const CLOSE_ORDER = 1000000; // towards the far end
    // Editor Title Menu: Split Editor
    appendEditorToolItem({
        id: editorCommands_1.SPLIT_EDITOR,
        title: (0, nls_1.localize)('splitEditorRight', "Split Editor Right"),
        icon: codicons_1.Codicon.splitHorizontal
    }, contextkey_1.ContextKeyExpr.not('splitEditorsVertically'), SPLIT_ORDER, {
        id: editorCommands_1.SPLIT_EDITOR_DOWN,
        title: (0, nls_1.localize)('splitEditorDown', "Split Editor Down"),
        icon: codicons_1.Codicon.splitVertical
    });
    appendEditorToolItem({
        id: editorCommands_1.SPLIT_EDITOR,
        title: (0, nls_1.localize)('splitEditorDown', "Split Editor Down"),
        icon: codicons_1.Codicon.splitVertical
    }, contextkey_1.ContextKeyExpr.has('splitEditorsVertically'), SPLIT_ORDER, {
        id: editorCommands_1.SPLIT_EDITOR_RIGHT,
        title: (0, nls_1.localize)('splitEditorRight', "Split Editor Right"),
        icon: codicons_1.Codicon.splitHorizontal
    });
    // Side by side: layout
    appendEditorToolItem({
        id: editorCommands_1.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT,
        title: (0, nls_1.localize)('toggleSplitEditorInGroupLayout', "Toggle Layout"),
        icon: codicons_1.Codicon.editorLayout
    }, contextkeys_1.SideBySideEditorActiveContext, SPLIT_ORDER - 1);
    // Editor Title Menu: Close (tabs disabled, normal editor)
    appendEditorToolItem({
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.close
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext.toNegated(), contextkeys_1.ActiveEditorStickyContext.toNegated()), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
        title: (0, nls_1.localize)('closeAll', "Close All"),
        icon: codicons_1.Codicon.closeAll
    });
    // Editor Title Menu: Close (tabs disabled, dirty editor)
    appendEditorToolItem({
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.closeDirty
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext, contextkeys_1.ActiveEditorStickyContext.toNegated()), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
        title: (0, nls_1.localize)('closeAll', "Close All"),
        icon: codicons_1.Codicon.closeAll
    });
    // Editor Title Menu: Close (tabs disabled, sticky editor)
    appendEditorToolItem({
        id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('unpin', "Unpin"),
        icon: codicons_1.Codicon.pinned
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext.toNegated(), contextkeys_1.ActiveEditorStickyContext), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.close
    });
    // Editor Title Menu: Close (tabs disabled, dirty & sticky editor)
    appendEditorToolItem({
        id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('unpin', "Unpin"),
        icon: codicons_1.Codicon.pinnedDirty
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext, contextkeys_1.ActiveEditorStickyContext), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.close
    });
    // Lock Group: only on auxiliary window and when group is unlocked
    appendEditorToolItem({
        id: editorCommands_1.LOCK_GROUP_COMMAND_ID,
        title: (0, nls_1.localize)('lockEditorGroup', "Lock Group"),
        icon: codicons_1.Codicon.unlock
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.IsAuxiliaryEditorPartContext, contextkeys_1.ActiveEditorGroupLockedContext.toNegated()), CLOSE_ORDER - 1);
    // Unlock Group: only when group is locked
    appendEditorToolItem({
        id: editorCommands_1.UNLOCK_GROUP_COMMAND_ID,
        title: (0, nls_1.localize)('unlockEditorGroup', "Unlock Group"),
        icon: codicons_1.Codicon.lock,
        toggled: contextkey_1.ContextKeyExpr.true()
    }, contextkeys_1.ActiveEditorGroupLockedContext, CLOSE_ORDER - 1);
    // Diff Editor Title Menu: Previous Change
    const previousChangeIcon = (0, iconRegistry_1.registerIcon)('diff-editor-previous-change', codicons_1.Codicon.arrowUp, (0, nls_1.localize)('previousChangeIcon', 'Icon for the previous change action in the diff editor.'));
    appendEditorToolItem({
        id: diffEditorCommands_1.GOTO_PREVIOUS_CHANGE,
        title: (0, nls_1.localize)('navigate.prev.label', "Previous Change"),
        icon: previousChangeIcon
    }, contextkeys_1.TextCompareEditorActiveContext, 10, undefined, editorContextKeys_1.EditorContextKeys.hasChanges);
    // Diff Editor Title Menu: Next Change
    const nextChangeIcon = (0, iconRegistry_1.registerIcon)('diff-editor-next-change', codicons_1.Codicon.arrowDown, (0, nls_1.localize)('nextChangeIcon', 'Icon for the next change action in the diff editor.'));
    appendEditorToolItem({
        id: diffEditorCommands_1.GOTO_NEXT_CHANGE,
        title: (0, nls_1.localize)('navigate.next.label', "Next Change"),
        icon: nextChangeIcon
    }, contextkeys_1.TextCompareEditorActiveContext, 11, undefined, editorContextKeys_1.EditorContextKeys.hasChanges);
    // Diff Editor Title Menu: Swap Sides
    appendEditorToolItem({
        id: diffEditorCommands_1.DIFF_SWAP_SIDES,
        title: (0, nls_1.localize)('swapDiffSides', "Swap Left and Right Side"),
        icon: codicons_1.Codicon.arrowSwap
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.TextCompareEditorActiveContext, contextkeys_1.ActiveCompareEditorCanSwapContext), 15, undefined, undefined);
    const toggleWhitespace = (0, iconRegistry_1.registerIcon)('diff-editor-toggle-whitespace', codicons_1.Codicon.whitespace, (0, nls_1.localize)('toggleWhitespace', 'Icon for the toggle whitespace action in the diff editor.'));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: diffEditorCommands_1.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
            title: (0, nls_1.localize)('ignoreTrimWhitespace.label', "Show Leading/Trailing Whitespace Differences"),
            icon: toggleWhitespace,
            precondition: contextkeys_1.TextCompareEditorActiveContext,
            toggled: contextkey_1.ContextKeyExpr.equals('config.diffEditor.ignoreTrimWhitespace', false),
        },
        group: 'navigation',
        when: contextkeys_1.TextCompareEditorActiveContext,
        order: 20,
    });
    // Editor Commands for Command Palette
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.KEEP_EDITOR_COMMAND_ID, title: (0, nls_1.localize2)('keepEditor', 'Keep Editor'), category: actionCommonCategories_1.Categories.View }, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.PIN_EDITOR_COMMAND_ID, title: (0, nls_1.localize2)('pinEditor', 'Pin Editor'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID, title: (0, nls_1.localize2)('unpinEditor', 'Unpin Editor'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID, title: (0, nls_1.localize2)('closeEditor', 'Close Editor'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_PINNED_EDITOR_COMMAND_ID, title: (0, nls_1.localize2)('closePinnedEditor', 'Close Pinned Editor'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize2)('closeEditorsInGroup', 'Close All Editors in Group'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID, title: (0, nls_1.localize2)('closeSavedEditors', 'Close Saved Editors in Group'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize2)('closeOtherEditors', 'Close Other Editors in Group'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID, title: (0, nls_1.localize2)('closeRightEditors', 'Close Editors to the Right in Group'), category: actionCommonCategories_1.Categories.View }, when: contextkeys_1.ActiveEditorLastInGroupContext.toNegated() });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITORS_AND_GROUP_COMMAND_ID, title: (0, nls_1.localize2)('closeEditorGroup', 'Close Editor Group'), category: actionCommonCategories_1.Categories.View }, when: contextkeys_1.MultipleEditorGroupsContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.REOPEN_WITH_COMMAND_ID, title: (0, nls_1.localize2)('reopenWith', "Reopen Editor With..."), category: actionCommonCategories_1.Categories.View }, when: contextkeys_1.ActiveEditorAvailableEditorIdsContext });
    // File menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarRecentMenu, {
        group: '1_editor',
        command: {
            id: editorActions_1.ReopenClosedEditorAction.ID,
            title: (0, nls_1.localize)({ key: 'miReopenClosedEditor', comment: ['&& denotes a mnemonic'] }, "&&Reopen Closed Editor"),
            precondition: contextkey_1.ContextKeyExpr.has('canReopenClosedEditor')
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarRecentMenu, {
        group: 'z_clear',
        command: {
            id: editorActions_1.ClearRecentFilesAction.ID,
            title: (0, nls_1.localize)({ key: 'miClearRecentOpen', comment: ['&& denotes a mnemonic'] }, "&&Clear Recently Opened...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        title: (0, nls_1.localize)('miShare', "Share"),
        submenu: actions_1.MenuId.MenubarShare,
        group: '45_share',
        order: 1,
    });
    // Layout menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '2_appearance',
        title: (0, nls_1.localize)({ key: 'miEditorLayout', comment: ['&& denotes a mnemonic'] }, "Editor &&Layout"),
        submenu: actions_1.MenuId.MenubarLayoutMenu,
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_UP,
            title: {
                ...(0, nls_1.localize2)('miSplitEditorUpWithoutMnemonic', "Split Up"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorUp', comment: ['&& denotes a mnemonic'] }, "Split &&Up"),
            }
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_DOWN,
            title: {
                ...(0, nls_1.localize2)('miSplitEditorDownWithoutMnemonic', "Split Down"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorDown', comment: ['&& denotes a mnemonic'] }, "Split &&Down"),
            }
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_LEFT,
            title: {
                ...(0, nls_1.localize2)('miSplitEditorLeftWithoutMnemonic', "Split Left"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorLeft', comment: ['&& denotes a mnemonic'] }, "Split &&Left"),
            }
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_RIGHT,
            title: {
                ...(0, nls_1.localize2)('miSplitEditorRightWithoutMnemonic', "Split Right"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorRight', comment: ['&& denotes a mnemonic'] }, "Split &&Right"),
            }
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '2_split_in_group',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_IN_GROUP,
            title: {
                ...(0, nls_1.localize2)('miSplitEditorInGroupWithoutMnemonic', "Split in Group"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorInGroup', comment: ['&& denotes a mnemonic'] }, "Split in &&Group"),
            }
        },
        when: contextkeys_1.ActiveEditorCanSplitInGroupContext,
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '2_split_in_group',
        command: {
            id: editorCommands_1.JOIN_EDITOR_IN_GROUP,
            title: {
                ...(0, nls_1.localize2)('miJoinEditorInGroupWithoutMnemonic', "Join in Group"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miJoinEditorInGroup', comment: ['&& denotes a mnemonic'] }, "Join in &&Group"),
            }
        },
        when: contextkeys_1.SideBySideEditorActiveContext,
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '3_new_window',
        command: {
            id: editorCommands_1.MOVE_EDITOR_INTO_NEW_WINDOW_COMMAND_ID,
            title: {
                ...(0, nls_1.localize2)('moveEditorToNewWindow', "Move Editor into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miMoveEditorToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Move Editor into New Window"),
            }
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '3_new_window',
        command: {
            id: editorCommands_1.COPY_EDITOR_INTO_NEW_WINDOW_COMMAND_ID,
            title: {
                ...(0, nls_1.localize2)('copyEditorToNewWindow', "Copy Editor into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miCopyEditorToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Copy Editor into New Window"),
            }
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutSingleAction.ID,
            title: {
                ...(0, nls_1.localize2)('miSingleColumnEditorLayoutWithoutMnemonic', "Single"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSingleColumnEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Single"),
            }
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoColumnsAction.ID,
            title: {
                ...(0, nls_1.localize2)('miTwoColumnsEditorLayoutWithoutMnemonic', "Two Columns"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoColumnsEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Two Columns"),
            }
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutThreeColumnsAction.ID,
            title: {
                ...(0, nls_1.localize2)('miThreeColumnsEditorLayoutWithoutMnemonic', "Three Columns"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miThreeColumnsEditorLayout', comment: ['&& denotes a mnemonic'] }, "T&&hree Columns"),
            }
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoRowsAction.ID,
            title: {
                ...(0, nls_1.localize2)('miTwoRowsEditorLayoutWithoutMnemonic', "Two Rows"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoRowsEditorLayout', comment: ['&& denotes a mnemonic'] }, "T&&wo Rows"),
            }
        },
        order: 5
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutThreeRowsAction.ID,
            title: {
                ...(0, nls_1.localize2)('miThreeRowsEditorLayoutWithoutMnemonic', "Three Rows"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miThreeRowsEditorLayout', comment: ['&& denotes a mnemonic'] }, "Three &&Rows"),
            }
        },
        order: 6
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoByTwoGridAction.ID,
            title: {
                ...(0, nls_1.localize2)('miTwoByTwoGridEditorLayoutWithoutMnemonic', "Grid (2x2)"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoByTwoGridEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Grid (2x2)"),
            }
        },
        order: 7
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoRowsRightAction.ID,
            title: {
                ...(0, nls_1.localize2)('miTwoRowsRightEditorLayoutWithoutMnemonic', "Two Rows Right"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoRowsRightEditorLayout', comment: ['&& denotes a mnemonic'] }, "Two R&&ows Right"),
            }
        },
        order: 8
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoColumnsBottomAction.ID,
            title: {
                ...(0, nls_1.localize2)('miTwoColumnsBottomEditorLayoutWithoutMnemonic', "Two Columns Bottom"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoColumnsBottomEditorLayout', comment: ['&& denotes a mnemonic'] }, "Two &&Columns Bottom"),
            }
        },
        order: 9
    });
    // Main Menu Bar Contributions:
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '1_history_nav',
        command: {
            id: 'workbench.action.navigateToLastEditLocation',
            title: (0, nls_1.localize)({ key: 'miLastEditLocation', comment: ['&& denotes a mnemonic'] }, "&&Last Edit Location"),
            precondition: contextkey_1.ContextKeyExpr.has('canNavigateToLastEditLocation')
        },
        order: 3
    });
    // Switch Editor
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '1_sideBySide',
        command: {
            id: editorCommands_1.FOCUS_FIRST_SIDE_EDITOR,
            title: (0, nls_1.localize)({ key: 'miFirstSideEditor', comment: ['&& denotes a mnemonic'] }, "&&First Side in Editor")
        },
        when: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '1_sideBySide',
        command: {
            id: editorCommands_1.FOCUS_SECOND_SIDE_EDITOR,
            title: (0, nls_1.localize)({ key: 'miSecondSideEditor', comment: ['&& denotes a mnemonic'] }, "&&Second Side in Editor")
        },
        when: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '2_any',
        command: {
            id: 'workbench.action.nextEditor',
            title: (0, nls_1.localize)({ key: 'miNextEditor', comment: ['&& denotes a mnemonic'] }, "&&Next Editor")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '2_any',
        command: {
            id: 'workbench.action.previousEditor',
            title: (0, nls_1.localize)({ key: 'miPreviousEditor', comment: ['&& denotes a mnemonic'] }, "&&Previous Editor")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '3_any_used',
        command: {
            id: 'workbench.action.openNextRecentlyUsedEditor',
            title: (0, nls_1.localize)({ key: 'miNextRecentlyUsedEditor', comment: ['&& denotes a mnemonic'] }, "&&Next Used Editor")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '3_any_used',
        command: {
            id: 'workbench.action.openPreviousRecentlyUsedEditor',
            title: (0, nls_1.localize)({ key: 'miPreviousRecentlyUsedEditor', comment: ['&& denotes a mnemonic'] }, "&&Previous Used Editor")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '4_group',
        command: {
            id: 'workbench.action.nextEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miNextEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Editor in Group")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '4_group',
        command: {
            id: 'workbench.action.previousEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miPreviousEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Editor in Group")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '5_group_used',
        command: {
            id: 'workbench.action.openNextRecentlyUsedEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miNextUsedEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Used Editor in Group")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '5_group_used',
        command: {
            id: 'workbench.action.openPreviousRecentlyUsedEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miPreviousUsedEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Used Editor in Group")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '2_editor_nav',
        title: (0, nls_1.localize)({ key: 'miSwitchEditor', comment: ['&& denotes a mnemonic'] }, "Switch &&Editor"),
        submenu: actions_1.MenuId.MenubarSwitchEditorMenu,
        order: 1
    });
    // Switch Group
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFirstEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusFirstGroup', comment: ['&& denotes a mnemonic'] }, "Group &&1")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusSecondEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusSecondGroup', comment: ['&& denotes a mnemonic'] }, "Group &&2")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusThirdEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusThirdGroup', comment: ['&& denotes a mnemonic'] }, "Group &&3"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFourthEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusFourthGroup', comment: ['&& denotes a mnemonic'] }, "Group &&4"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFifthEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusFifthGroup', comment: ['&& denotes a mnemonic'] }, "Group &&5"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 5
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '2_next_prev',
        command: {
            id: 'workbench.action.focusNextGroup',
            title: (0, nls_1.localize)({ key: 'miNextGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Group"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '2_next_prev',
        command: {
            id: 'workbench.action.focusPreviousGroup',
            title: (0, nls_1.localize)({ key: 'miPreviousGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Group"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusLeftGroup',
            title: (0, nls_1.localize)({ key: 'miFocusLeftGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Left"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusRightGroup',
            title: (0, nls_1.localize)({ key: 'miFocusRightGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Right"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusAboveGroup',
            title: (0, nls_1.localize)({ key: 'miFocusAboveGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Above"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusBelowGroup',
            title: (0, nls_1.localize)({ key: 'miFocusBelowGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Below"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '2_editor_nav',
        title: (0, nls_1.localize)({ key: 'miSwitchGroup', comment: ['&& denotes a mnemonic'] }, "Switch &&Group"),
        submenu: actions_1.MenuId.MenubarSwitchGroupMenu,
        order: 2
    });
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3IuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBd0VoRyw4QkFBOEI7SUFFOUIsbUJBQVEsQ0FBQyxFQUFFLENBQXNCLHlCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixDQUMvRSw2QkFBb0IsQ0FBQyxNQUFNLENBQzFCLHVDQUFrQixFQUNsQix1Q0FBa0IsQ0FBQyxFQUFFLEVBQ3JCLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FDckMsRUFDRDtRQUNDLElBQUksNEJBQWMsQ0FBQyxpREFBdUIsQ0FBQztRQUMzQyxJQUFJLDRCQUFjLENBQUMsaURBQXVCLENBQUM7S0FDM0MsQ0FDRCxDQUFDO0lBRUYsbUJBQVEsQ0FBQyxFQUFFLENBQXNCLHlCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixDQUMvRSw2QkFBb0IsQ0FBQyxNQUFNLENBQzFCLCtCQUFjLEVBQ2QsK0JBQWMsQ0FBQyxFQUFFLEVBQ2pCLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLENBQzlDLEVBQ0Q7UUFDQyxJQUFJLDRCQUFjLENBQUMsaUNBQWUsQ0FBQztLQUNuQyxDQUNELENBQUM7SUFFRixtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsa0JBQWtCLENBQy9FLDZCQUFvQixDQUFDLE1BQU0sQ0FDMUIsMkNBQXdCLEVBQ3hCLDJDQUF3QixDQUFDLEVBQUUsRUFDM0IsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUMsQ0FDbEQsRUFDRDtR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