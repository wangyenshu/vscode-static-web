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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/themables", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry"], function (require, exports, actions_1, themables_1, event_1, lifecycle_1, linkedList_1, commands_1, contextkey_1, instantiation_1, keybindingsRegistry_1) {
    "use strict";
    var MenuItemAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Action2 = exports.MenuItemAction = exports.SubmenuItemAction = exports.MenuRegistry = exports.IMenuService = exports.MenuId = void 0;
    exports.isIMenuItem = isIMenuItem;
    exports.isISubmenuItem = isISubmenuItem;
    exports.registerAction2 = registerAction2;
    function isIMenuItem(item) {
        return item.command !== undefined;
    }
    function isISubmenuItem(item) {
        return item.submenu !== undefined;
    }
    class MenuId {
        static { this._instances = new Map(); }
        static { this.CommandPalette = new MenuId('CommandPalette'); }
        static { this.DebugBreakpointsContext = new MenuId('DebugBreakpointsContext'); }
        static { this.DebugCallStackContext = new MenuId('DebugCallStackContext'); }
        static { this.DebugConsoleContext = new MenuId('DebugConsoleContext'); }
        static { this.DebugVariablesContext = new MenuId('DebugVariablesContext'); }
        static { this.NotebookVariablesContext = new MenuId('NotebookVariablesContext'); }
        static { this.DebugHoverContext = new MenuId('DebugHoverContext'); }
        static { this.DebugWatchContext = new MenuId('DebugWatchContext'); }
        static { this.DebugToolBar = new MenuId('DebugToolBar'); }
        static { this.DebugToolBarStop = new MenuId('DebugToolBarStop'); }
        static { this.EditorContext = new MenuId('EditorContext'); }
        static { this.SimpleEditorContext = new MenuId('SimpleEditorContext'); }
        static { this.EditorContent = new MenuId('EditorContent'); }
        static { this.EditorLineNumberContext = new MenuId('EditorLineNumberContext'); }
        static { this.EditorContextCopy = new MenuId('EditorContextCopy'); }
        static { this.EditorContextPeek = new MenuId('EditorContextPeek'); }
        static { this.EditorContextShare = new MenuId('EditorContextShare'); }
        static { this.EditorTitle = new MenuId('EditorTitle'); }
        static { this.EditorTitleRun = new MenuId('EditorTitleRun'); }
        static { this.EditorTitleContext = new MenuId('EditorTitleContext'); }
        static { this.EditorTitleContextShare = new MenuId('EditorTitleContextShare'); }
        static { this.EmptyEditorGroup = new MenuId('EmptyEditorGroup'); }
        static { this.EmptyEditorGroupContext = new MenuId('EmptyEditorGroupContext'); }
        static { this.EditorTabsBarContext = new MenuId('EditorTabsBarContext'); }
        static { this.EditorTabsBarShowTabsSubmenu = new MenuId('EditorTabsBarShowTabsSubmenu'); }
        static { this.EditorTabsBarShowTabsZenModeSubmenu = new MenuId('EditorTabsBarShowTabsZenModeSubmenu'); }
        static { this.EditorActionsPositionSubmenu = new MenuId('EditorActionsPositionSubmenu'); }
        static { this.ExplorerContext = new MenuId('ExplorerContext'); }
        static { this.ExplorerContextShare = new MenuId('ExplorerContextShare'); }
        static { this.ExtensionContext = new MenuId('ExtensionContext'); }
        static { this.GlobalActivity = new MenuId('GlobalActivity'); }
        static { this.CommandCenter = new MenuId('CommandCenter'); }
        static { this.CommandCenterCenter = new MenuId('CommandCenterCenter'); }
        static { this.LayoutControlMenuSubmenu = new MenuId('LayoutControlMenuSubmenu'); }
        static { this.LayoutControlMenu = new MenuId('LayoutControlMenu'); }
        static { this.MenubarMainMenu = new MenuId('MenubarMainMenu'); }
        static { this.MenubarAppearanceMenu = new MenuId('MenubarAppearanceMenu'); }
        static { this.MenubarDebugMenu = new MenuId('MenubarDebugMenu'); }
        static { this.MenubarEditMenu = new MenuId('MenubarEditMenu'); }
        static { this.MenubarCopy = new MenuId('MenubarCopy'); }
        static { this.MenubarFileMenu = new MenuId('MenubarFileMenu'); }
        static { this.MenubarGoMenu = new MenuId('MenubarGoMenu'); }
        static { this.MenubarHelpMenu = new MenuId('MenubarHelpMenu'); }
        static { this.MenubarLayoutMenu = new MenuId('MenubarLayoutMenu'); }
        static { this.MenubarNewBreakpointMenu = new MenuId('MenubarNewBreakpointMenu'); }
        static { this.PanelAlignmentMenu = new MenuId('PanelAlignmentMenu'); }
        static { this.PanelPositionMenu = new MenuId('PanelPositionMenu'); }
        static { this.ActivityBarPositionMenu = new MenuId('ActivityBarPositionMenu'); }
        static { this.MenubarPreferencesMenu = new MenuId('MenubarPreferencesMenu'); }
        static { this.MenubarRecentMenu = new MenuId('MenubarRecentMenu'); }
        static { this.MenubarSelectionMenu = new MenuId('MenubarSelectionMenu'); }
        static { this.MenubarShare = new MenuId('MenubarShare'); }
        static { this.MenubarSwitchEditorMenu = new MenuId('MenubarSwitchEditorMenu'); }
        static { this.MenubarSwitchGroupMenu = new MenuId('MenubarSwitchGroupMenu'); }
        static { this.MenubarTerminalMenu = new MenuId('MenubarTerminalMenu'); }
        static { this.MenubarViewMenu = new MenuId('MenubarViewMenu'); }
        static { this.MenubarHomeMenu = new MenuId('MenubarHomeMenu'); }
        static { this.OpenEditorsContext = new MenuId('OpenEditorsContext'); }
        static { this.OpenEditorsContextShare = new MenuId('OpenEditorsContextShare'); }
        static { this.ProblemsPanelContext = new MenuId('ProblemsPanelContext'); }
        static { this.SCMInputBox = new MenuId('SCMInputBox'); }
        static { this.SCMChangesSeparator = new MenuId('SCMChangesSeparator'); }
        static { this.SCMIncomingChanges = new MenuId('SCMIncomingChanges'); }
        static { this.SCMIncomingChangesContext = new MenuId('SCMIncomingChangesContext'); }
        static { this.SCMIncomingChangesSetting = new MenuId('SCMIncomingChangesSetting'); }
        static { this.SCMOutgoingChanges = new MenuId('SCMOutgoingChanges'); }
        static { this.SCMOutgoingChangesContext = new MenuId('SCMOutgoingChangesContext'); }
        static { this.SCMOutgoingChangesSetting = new MenuId('SCMOutgoingChangesSetting'); }
        static { this.SCMIncomingChangesAllChangesContext = new MenuId('SCMIncomingChangesAllChangesContext'); }
        static { this.SCMIncomingChangesHistoryItemContext = new MenuId('SCMIncomingChangesHistoryItemContext'); }
        static { this.SCMOutgoingChangesAllChangesContext = new MenuId('SCMOutgoingChangesAllChangesContext'); }
        static { this.SCMOutgoingChangesHistoryItemContext = new MenuId('SCMOutgoingChangesHistoryItemContext'); }
        static { this.SCMChangeContext = new MenuId('SCMChangeContext'); }
        static { this.SCMResourceContext = new MenuId('SCMResourceContext'); }
        static { this.SCMResourceContextShare = new MenuId('SCMResourceContextShare'); }
        static { this.SCMResourceFolderContext = new MenuId('SCMResourceFolderContext'); }
        static { this.SCMResourceGroupContext = new MenuId('SCMResourceGroupContext'); }
        static { this.SCMSourceControl = new MenuId('SCMSourceControl'); }
        static { this.SCMSourceControlInline = new MenuId('SCMSourceControlInline'); }
        static { this.SCMSourceControlTitle = new MenuId('SCMSourceControlTitle'); }
        static { this.SCMTitle = new MenuId('SCMTitle'); }
        static { this.SearchContext = new MenuId('SearchContext'); }
        static { this.SearchActionMenu = new MenuId('SearchActionContext'); }
        static { this.StatusBarWindowIndicatorMenu = new MenuId('StatusBarWindowIndicatorMenu'); }
        static { this.StatusBarRemoteIndicatorMenu = new MenuId('StatusBarRemoteIndicatorMenu'); }
        static { this.StickyScrollContext = new MenuId('StickyScrollContext'); }
        static { this.TestItem = new MenuId('TestItem'); }
        static { this.TestItemGutter = new MenuId('TestItemGutter'); }
        static { this.TestMessageContext = new MenuId('TestMessageContext'); }
        static { this.TestMessageContent = new MenuId('TestMessageContent'); }
        static { this.TestPeekElement = new MenuId('TestPeekElement'); }
        static { this.TestPeekTitle = new MenuId('TestPeekTitle'); }
        static { this.TouchBarContext = new MenuId('TouchBarContext'); }
        static { this.TitleBarContext = new MenuId('TitleBarContext'); }
        static { this.TitleBarTitleContext = new MenuId('TitleBarTitleContext'); }
        static { this.TunnelContext = new MenuId('TunnelContext'); }
        static { this.TunnelPrivacy = new MenuId('TunnelPrivacy'); }
        static { this.TunnelProtocol = new MenuId('TunnelProtocol'); }
        static { this.TunnelPortInline = new MenuId('TunnelInline'); }
        static { this.TunnelTitle = new MenuId('TunnelTitle'); }
        static { this.TunnelLocalAddressInline = new MenuId('TunnelLocalAddressInline'); }
        static { this.TunnelOriginInline = new MenuId('TunnelOriginInline'); }
        static { this.ViewItemContext = new MenuId('ViewItemContext'); }
        static { this.ViewContainerTitle = new MenuId('ViewContainerTitle'); }
        static { this.ViewContainerTitleContext = new MenuId('ViewContainerTitleContext'); }
        static { this.ViewTitle = new MenuId('ViewTitle'); }
        static { this.ViewTitleContext = new MenuId('ViewTitleContext'); }
        static { this.CommentEditorActions = new MenuId('CommentEditorActions'); }
        static { this.CommentThreadTitle = new MenuId('CommentThreadTitle'); }
        static { this.CommentThreadActions = new MenuId('CommentThreadActions'); }
        static { this.CommentThreadAdditionalActions = new MenuId('CommentThreadAdditionalActions'); }
        static { this.CommentThreadTitleContext = new MenuId('CommentThreadTitleContext'); }
        static { this.CommentThreadCommentContext = new MenuId('CommentThreadCommentContext'); }
        static { this.CommentTitle = new MenuId('CommentTitle'); }
        static { this.CommentActions = new MenuId('CommentActions'); }
        static { this.CommentsViewThreadActions = new MenuId('CommentsViewThreadActions'); }
        static { this.InteractiveToolbar = new MenuId('InteractiveToolbar'); }
        static { this.InteractiveCellTitle = new MenuId('InteractiveCellTitle'); }
        static { this.InteractiveCellDelete = new MenuId('InteractiveCellDelete'); }
        static { this.InteractiveCellExecute = new MenuId('InteractiveCellExecute'); }
        static { this.InteractiveInputExecute = new MenuId('InteractiveInputExecute'); }
        static { this.IssueReporter = new MenuId('IssueReporter'); }
        static { this.NotebookToolbar = new MenuId('NotebookToolbar'); }
        static { this.NotebookStickyScrollContext = new MenuId('NotebookStickyScrollContext'); }
        static { this.NotebookCellTitle = new MenuId('NotebookCellTitle'); }
        static { this.NotebookCellDelete = new MenuId('NotebookCellDelete'); }
        static { this.NotebookCellInsert = new MenuId('NotebookCellInsert'); }
        static { this.NotebookCellBetween = new MenuId('NotebookCellBetween'); }
        static { this.NotebookCellListTop = new MenuId('NotebookCellTop'); }
        static { this.NotebookCellExecute = new MenuId('NotebookCellExecute'); }
        static { this.NotebookCellExecuteGoTo = new MenuId('NotebookCellExecuteGoTo'); }
        static { this.NotebookCellExecutePrimary = new MenuId('NotebookCellExecutePrimary'); }
        static { this.NotebookDiffCellInputTitle = new MenuId('NotebookDiffCellInputTitle'); }
        static { this.NotebookDiffCellMetadataTitle = new MenuId('NotebookDiffCellMetadataTitle'); }
        static { this.NotebookDiffCellOutputsTitle = new MenuId('NotebookDiffCellOutputsTitle'); }
        static { this.NotebookOutputToolbar = new MenuId('NotebookOutputToolbar'); }
        static { this.NotebookOutlineFilter = new MenuId('NotebookOutlineFilter'); }
        static { this.NotebookOutlineActionMenu = new MenuId('NotebookOutlineActionMenu'); }
        static { this.NotebookEditorLayoutConfigure = new MenuId('NotebookEditorLayoutConfigure'); }
        static { this.NotebookKernelSource = new MenuId('NotebookKernelSource'); }
        static { this.BulkEditTitle = new MenuId('BulkEditTitle'); }
        static { this.BulkEditContext = new MenuId('BulkEditContext'); }
        static { this.TimelineItemContext = new MenuId('TimelineItemContext'); }
        static { this.TimelineTitle = new MenuId('TimelineTitle'); }
        static { this.TimelineTitleContext = new MenuId('TimelineTitleContext'); }
        static { this.TimelineFilterSubMenu = new MenuId('TimelineFilterSubMenu'); }
        static { this.AccountsContext = new MenuId('AccountsContext'); }
        static { this.SidebarTitle = new MenuId('SidebarTitle'); }
        static { this.PanelTitle = new MenuId('PanelTitle'); }
        static { this.AuxiliaryBarTitle = new MenuId('AuxiliaryBarTitle'); }
        static { this.AuxiliaryBarHeader = new MenuId('AuxiliaryBarHeader'); }
        static { this.TerminalInstanceContext = new MenuId('TerminalInstanceContext'); }
        static { this.TerminalEditorInstanceContext = new MenuId('TerminalEditorInstanceContext'); }
        static { this.TerminalNewDropdownContext = new MenuId('TerminalNewDropdownContext'); }
        static { this.TerminalTabContext = new MenuId('TerminalTabContext'); }
        static { this.TerminalTabEmptyAreaContext = new MenuId('TerminalTabEmptyAreaContext'); }
        static { this.TerminalStickyScrollContext = new MenuId('TerminalStickyScrollContext'); }
        static { this.WebviewContext = new MenuId('WebviewContext'); }
        static { this.InlineCompletionsActions = new MenuId('InlineCompletionsActions'); }
        static { this.InlineEditActions = new MenuId('InlineEditActions'); }
        static { this.NewFile = new MenuId('NewFile'); }
        static { this.MergeInput1Toolbar = new MenuId('MergeToolbar1Toolbar'); }
        static { this.MergeInput2Toolbar = new MenuId('MergeToolbar2Toolbar'); }
        static { this.MergeBaseToolbar = new MenuId('MergeBaseToolbar'); }
        static { this.MergeInputResultToolbar = new MenuId('MergeToolbarResultToolbar'); }
        static { this.InlineSuggestionToolbar = new MenuId('InlineSuggestionToolbar'); }
        static { this.InlineEditToolbar = new MenuId('InlineEditToolbar'); }
        static { this.ChatContext = new MenuId('ChatContext'); }
        static { this.ChatCodeBlock = new MenuId('ChatCodeblock'); }
        static { this.ChatCompareBlock = new MenuId('ChatCompareBlock'); }
        static { this.ChatMessageTitle = new MenuId('ChatMessageTitle'); }
        static { this.ChatExecute = new MenuId('ChatExecute'); }
        static { this.ChatExecuteSecondary = new MenuId('ChatExecuteSecondary'); }
        static { this.ChatInputSide = new MenuId('ChatInputSide'); }
        static { this.AccessibleView = new MenuId('AccessibleView'); }
        static { this.MultiDiffEditorFileToolbar = new MenuId('MultiDiffEditorFileToolbar'); }
        static { this.DiffEditorHunkToolbar = new MenuId('DiffEditorHunkToolbar'); }
        static { this.DiffEditorSelectionToolbar = new MenuId('DiffEditorSelectionToolbar'); }
        /**
         * Create or reuse a `MenuId` with the given identifier
         */
        static for(identifier) {
            return MenuId._instances.get(identifier) ?? new MenuId(identifier);
        }
        /**
         * Create a new `MenuId` with the unique identifier. Will throw if a menu
         * with the identifier already exists, use `MenuId.for(ident)` or a unique
         * identifier
         */
        constructor(identifier) {
            if (MenuId._instances.has(identifier)) {
                throw new TypeError(`MenuId with identifier '${identifier}' already exists. Use MenuId.for(ident) or a unique identifier`);
            }
            MenuId._instances.set(identifier, this);
            this.id = identifier;
        }
    }
    exports.MenuId = MenuId;
    exports.IMenuService = (0, instantiation_1.createDecorator)('menuService');
    class MenuRegistryChangeEvent {
        static { this._all = new Map(); }
        static for(id) {
            let value = this._all.get(id);
            if (!value) {
                value = new MenuRegistryChangeEvent(id);
                this._all.set(id, value);
            }
            return value;
        }
        static merge(events) {
            const ids = new Set();
            for (const item of events) {
                if (item instanceof MenuRegistryChangeEvent) {
                    ids.add(item.id);
                }
            }
            return ids;
        }
        constructor(id) {
            this.id = id;
            this.has = candidate => candidate === id;
        }
    }
    exports.MenuRegistry = new class {
        constructor() {
            this._commands = new Map();
            this._menuItems = new Map();
            this._onDidChangeMenu = new event_1.MicrotaskEmitter({
                merge: MenuRegistryChangeEvent.merge
            });
            this.onDidChangeMenu = this._onDidChangeMenu.event;
        }
        addCommand(command) {
            this._commands.set(command.id, command);
            this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(MenuId.CommandPalette));
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._commands.delete(command.id)) {
                    this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(MenuId.CommandPalette));
                }
            });
        }
        getCommand(id) {
            return this._commands.get(id);
        }
        getCommands() {
            const map = new Map();
            this._commands.forEach((value, key) => map.set(key, value));
            return map;
        }
        appendMenuItem(id, item) {
            let list = this._menuItems.get(id);
            if (!list) {
                list = new linkedList_1.LinkedList();
                this._menuItems.set(id, list);
            }
            const rm = list.push(item);
            this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(id));
            return (0, lifecycle_1.toDisposable)(() => {
                rm();
                this._onDidChangeMenu.fire(MenuRegistryChangeEvent.for(id));
            });
        }
        appendMenuItems(items) {
            const result = new lifecycle_1.DisposableStore();
            for (const { id, item } of items) {
                result.add(this.appendMenuItem(id, item));
            }
            return result;
        }
        getMenuItems(id) {
            let result;
            if (this._menuItems.has(id)) {
                result = [...this._menuItems.get(id)];
            }
            else {
                result = [];
            }
            if (id === MenuId.CommandPalette) {
                // CommandPalette is special because it shows
                // all commands by default
                this._appendImplicitItems(result);
            }
            return result;
        }
        _appendImplicitItems(result) {
            const set = new Set();
            for (const item of result) {
                if (isIMenuItem(item)) {
                    set.add(item.command.id);
                    if (item.alt) {
                        set.add(item.alt.id);
                    }
                }
            }
            this._commands.forEach((command, id) => {
                if (!set.has(id)) {
                    result.push({ command });
                }
            });
        }
    };
    class SubmenuItemAction extends actions_1.SubmenuAction {
        constructor(item, hideActions, actions) {
            super(`submenuitem.${item.submenu.id}`, typeof item.title === 'string' ? item.title : item.title.value, actions, 'submenu');
            this.item = item;
            this.hideActions = hideActions;
        }
    }
    exports.SubmenuItemAction = SubmenuItemAction;
    // implements IAction, does NOT extend Action, so that no one
    // subscribes to events of Action or modified properties
    let MenuItemAction = MenuItemAction_1 = class MenuItemAction {
        static label(action, options) {
            return options?.renderShortTitle && action.shortTitle
                ? (typeof action.shortTitle === 'string' ? action.shortTitle : action.shortTitle.value)
                : (typeof action.title === 'string' ? action.title : action.title.value);
        }
        constructor(item, alt, options, hideActions, menuKeybinding, contextKeyService, _commandService) {
            this.hideActions = hideActions;
            this.menuKeybinding = menuKeybinding;
            this._commandService = _commandService;
            this.id = item.id;
            this.label = MenuItemAction_1.label(item, options);
            this.tooltip = (typeof item.tooltip === 'string' ? item.tooltip : item.tooltip?.value) ?? '';
            this.enabled = !item.precondition || contextKeyService.contextMatchesRules(item.precondition);
            this.checked = undefined;
            let icon;
            if (item.toggled) {
                const toggled = (item.toggled.condition ? item.toggled : { condition: item.toggled });
                this.checked = contextKeyService.contextMatchesRules(toggled.condition);
                if (this.checked && toggled.tooltip) {
                    this.tooltip = typeof toggled.tooltip === 'string' ? toggled.tooltip : toggled.tooltip.value;
                }
                if (this.checked && themables_1.ThemeIcon.isThemeIcon(toggled.icon)) {
                    icon = toggled.icon;
                }
                if (this.checked && toggled.title) {
                    this.label = typeof toggled.title === 'string' ? toggled.title : toggled.title.value;
                }
            }
            if (!icon) {
                icon = themables_1.ThemeIcon.isThemeIcon(item.icon) ? item.icon : undefined;
            }
            this.item = item;
            this.alt = alt ? new MenuItemAction_1(alt, undefined, options, hideActions, undefined, contextKeyService, _commandService) : undefined;
            this._options = options;
            this.class = icon && themables_1.ThemeIcon.asClassName(icon);
        }
        run(...args) {
            let runArgs = [];
            if (this._options?.arg) {
                runArgs = [...runArgs, this._options.arg];
            }
            if (this._options?.shouldForwardArgs) {
                runArgs = [...runArgs, ...args];
            }
            return this._commandService.executeCommand(this.id, ...runArgs);
        }
    };
    exports.MenuItemAction = MenuItemAction;
    exports.MenuItemAction = MenuItemAction = MenuItemAction_1 = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, commands_1.ICommandService)
    ], MenuItemAction);
    class Action2 {
        constructor(desc) {
            this.desc = desc;
        }
    }
    exports.Action2 = Action2;
    function registerAction2(ctor) {
        const disposables = new lifecycle_1.DisposableStore();
        const action = new ctor();
        const { f1, menu, keybinding, ...command } = action.desc;
        if (commands_1.CommandsRegistry.getCommand(command.id)) {
            throw new Error(`Cannot register two commands with the same id: ${command.id}`);
        }
        // command
        disposables.add(commands_1.CommandsRegistry.registerCommand({
            id: command.id,
            handler: (accessor, ...args) => action.run(accessor, ...args),
            metadata: command.metadata,
        }));
        // menu
        if (Array.isArray(menu)) {
            for (const item of menu) {
                disposables.add(exports.MenuRegistry.appendMenuItem(item.id, { command: { ...command, precondition: item.precondition === null ? undefined : command.precondition }, ...item }));
            }
        }
        else if (menu) {
            disposables.add(exports.MenuRegistry.appendMenuItem(menu.id, { command: { ...command, precondition: menu.precondition === null ? undefined : command.precondition }, ...menu }));
        }
        if (f1) {
            disposables.add(exports.MenuRegistry.appendMenuItem(MenuId.CommandPalette, { command, when: command.precondition }));
            disposables.add(exports.MenuRegistry.addCommand(command));
        }
        // keybinding
        if (Array.isArray(keybinding)) {
            for (const item of keybinding) {
                disposables.add(keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                    ...item,
                    id: command.id,
                    when: command.precondition ? contextkey_1.ContextKeyExpr.and(command.precondition, item.when) : item.when
                }));
            }
        }
        else if (keybinding) {
            disposables.add(keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                ...keybinding,
                id: command.id,
                when: command.precondition ? contextkey_1.ContextKeyExpr.and(command.precondition, keybinding.when) : keybinding.when
            }));
        }
        return disposables;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2FjdGlvbnMvY29tbW9uL2FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtDaEcsa0NBRUM7SUFFRCx3Q0FFQztJQTRpQkQsMENBaURDO0lBbm1CRCxTQUFnQixXQUFXLENBQUMsSUFBUztRQUNwQyxPQUFRLElBQWtCLENBQUMsT0FBTyxLQUFLLFNBQVMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsU0FBZ0IsY0FBYyxDQUFDLElBQVM7UUFDdkMsT0FBUSxJQUFxQixDQUFDLE9BQU8sS0FBSyxTQUFTLENBQUM7SUFDckQsQ0FBQztJQUVELE1BQWEsTUFBTTtpQkFFTSxlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7aUJBRS9DLG1CQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztpQkFDOUMsNEJBQXVCLEdBQUcsSUFBSSxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQztpQkFDaEUsMEJBQXFCLEdBQUcsSUFBSSxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQztpQkFDNUQsd0JBQW1CLEdBQUcsSUFBSSxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQztpQkFDeEQsMEJBQXFCLEdBQUcsSUFBSSxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQztpQkFDNUQsNkJBQXdCLEdBQUcsSUFBSSxNQUFNLENBQUMsMEJBQTBCLENBQUMsQ0FBQztpQkFDbEUsc0JBQWlCLEdBQUcsSUFBSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztpQkFDcEQsc0JBQWlCLEdBQUcsSUFBSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztpQkFDcEQsaUJBQVksR0FBRyxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztpQkFDMUMscUJBQWdCLEdBQUcsSUFBSSxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztpQkFDbEQsa0JBQWEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztpQkFDNUMsd0JBQW1CLEdBQUcsSUFBSSxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQztpQkFDeEQsa0JBQWEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztpQkFDNUMsNEJBQXVCLEdBQUcsSUFBSSxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQztpQkFDaEUsc0JBQWlCLEdBQUcsSUFBSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztpQkFDcEQsc0JBQWlCLEdBQUcsSUFBSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztpQkFDcEQsdUJBQWtCLEdBQUcsSUFBSSxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztpQkFDdEQsZ0JBQVcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztpQkFDeEMsbUJBQWMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2lCQUM5Qyx1QkFBa0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2lCQUN0RCw0QkFBdUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2lCQUNoRSxxQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2lCQUNsRCw0QkFBdUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2lCQUNoRSx5QkFBb0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2lCQUMxRCxpQ0FBNEIsR0FBRyxJQUFJLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO2lCQUMxRSx3Q0FBbUMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO2lCQUN4RixpQ0FBNEIsR0FBRyxJQUFJLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO2lCQUMxRSxvQkFBZSxHQUFHLElBQUksTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7aUJBQ2hELHlCQUFvQixHQUFHLElBQUksTUFBTSxDQUFDLHNCQUFzQixDQUFDLENBQUM7aUJBQzFELHFCQUFnQixHQUFHLElBQUksTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUM7aUJBQ2xELG1CQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztpQkFDOUMsa0JBQWEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztpQkFDNUMsd0JBQW1CLEdBQUcsSUFBSSxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQztpQkFDeEQsNkJBQXdCLEdBQUcsSUFBSSxNQUFNLENBQUMsMEJBQTBCLENBQUMsQ0FBQztpQkFDbEUsc0JBQWlCLEdBQUcsSUFBSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztpQkFDcEQsb0JBQWUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2lCQUNoRCwwQkFBcUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO2lCQUM1RCxxQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2lCQUNsRCxvQkFBZSxHQUFHLElBQUksTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7aUJBQ2hELGdCQUFXLEdBQUcsSUFBSSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7aUJBQ3hDLG9CQUFlLEdBQUcsSUFBSSxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztpQkFDaEQsa0JBQWEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztpQkFDNUMsb0JBQWUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2lCQUNoRCxzQkFBaUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2lCQUNwRCw2QkFBd0IsR0FBRyxJQUFJLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO2lCQUNsRSx1QkFBa0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2lCQUN0RCxzQkFBaUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2lCQUNwRCw0QkFBdUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2lCQUNoRSwyQkFBc0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2lCQUM5RCxzQkFBaUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2lCQUNwRCx5QkFBb0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2lCQUMxRCxpQkFBWSxHQUFHLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2lCQUMxQyw0QkFBdUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2lCQUNoRSwyQkFBc0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2lCQUM5RCx3QkFBbUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2lCQUN4RCxvQkFBZSxHQUFHLElBQUksTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7aUJBQ2hELG9CQUFlLEdBQUcsSUFBSSxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztpQkFDaEQsdUJBQWtCLEdBQUcsSUFBSSxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztpQkFDdEQsNEJBQXVCLEdBQUcsSUFBSSxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQztpQkFDaEUseUJBQW9CLEdBQUcsSUFBSSxNQUFNLENBQUMsc0JBQXNCLENBQUMsQ0FBQztpQkFDMUQsZ0JBQVcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztpQkFDeEMsd0JBQW1CLEdBQUcsSUFBSSxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQztpQkFDeEQsdUJBQWtCLEdBQUcsSUFBSSxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztpQkFDdEQsOEJBQXlCLEdBQUcsSUFBSSxNQUFNLENBQUMsMkJBQTJCLENBQUMsQ0FBQztpQkFDcEUsOEJBQXlCLEdBQUcsSUFBSSxNQUFNLENBQUMsMkJBQTJCLENBQUMsQ0FBQztpQkFDcEUsdUJBQWtCLEdBQUcsSUFBSSxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztpQkFDdEQsOEJBQXlCLEdBQUcsSUFBSSxNQUFNLENBQUMsMkJBQTJCLENBQUMsQ0FBQztpQkFDcEUsOEJBQXlCLEdBQUcsSUFBSSxNQUFNLENBQUMsMkJBQTJCLENBQUMsQ0FBQztpQkFDcEUsd0NBQW1DLEdBQUcsSUFBSSxNQUFNLENBQUMscUNBQXFDLENBQUMsQ0FBQztpQkFDeEYseUNBQW9DLEdBQUcsSUFBSSxNQUFNLENBQUMsc0NBQXNDLENBQUMsQ0FBQztpQkFDMUYsd0NBQW1DLEdBQUcsSUFBSSxNQUFNLENBQUMscUNBQXFDLENBQUMsQ0FBQztpQkFDeEYseUNBQW9DLEdBQUcsSUFBSSxNQUFNLENBQUMsc0NBQXNDLENBQUMsQ0FBQztpQkFDMUYscUJBQWdCLEdBQUcsSUFBSSxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztpQkFDbEQsdUJBQWtCLEdBQUcsSUFBSSxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztpQkFDdEQsNEJBQXVCLEdBQUcsSUFBSSxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQztpQkFDaEUsNkJBQXdCLEdBQUcsSUFBSSxNQUFNLENBQUMsMEJBQTBCLENBQUMsQ0FBQztpQkFDbEUsNEJBQXVCLEdBQUcsSUFBSSxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQztpQkFDaEUscUJBQWdCLEdBQUcsSUFBSSxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztpQkFDbEQsMkJBQXNCLEdBQUcsSUFBSSxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQztpQkFDOUQsMEJBQXFCLEdBQUcsSUFBSSxNQUFNLENBQUMsdUJBQXVCLENBQUMs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