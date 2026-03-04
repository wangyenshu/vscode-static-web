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
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/base/common/resources", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/base/common/arrays", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/base/common/process", "vs/base/common/htmlContent", "vs/platform/keybinding/common/keybinding"], function (require, exports, nls_1, strings_1, resources, extensionsRegistry_1, contextkey_1, actions_1, lifecycle_1, themables_1, arrays_1, extensions_1, extensionFeatures_1, platform_1, descriptors_1, process_1, htmlContent_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.commandsExtensionPoint = void 0;
    const apiMenus = [
        {
            key: 'commandPalette',
            id: actions_1.MenuId.CommandPalette,
            description: (0, nls_1.localize)('menus.commandPalette', "The Command Palette"),
            supportsSubmenus: false
        },
        {
            key: 'touchBar',
            id: actions_1.MenuId.TouchBarContext,
            description: (0, nls_1.localize)('menus.touchBar', "The touch bar (macOS only)"),
            supportsSubmenus: false
        },
        {
            key: 'editor/title',
            id: actions_1.MenuId.EditorTitle,
            description: (0, nls_1.localize)('menus.editorTitle', "The editor title menu")
        },
        {
            key: 'editor/title/run',
            id: actions_1.MenuId.EditorTitleRun,
            description: (0, nls_1.localize)('menus.editorTitleRun', "Run submenu inside the editor title menu")
        },
        {
            key: 'editor/context',
            id: actions_1.MenuId.EditorContext,
            description: (0, nls_1.localize)('menus.editorContext', "The editor context menu")
        },
        {
            key: 'editor/context/copy',
            id: actions_1.MenuId.EditorContextCopy,
            description: (0, nls_1.localize)('menus.editorContextCopyAs', "'Copy as' submenu in the editor context menu")
        },
        {
            key: 'editor/context/share',
            id: actions_1.MenuId.EditorContextShare,
            description: (0, nls_1.localize)('menus.editorContextShare', "'Share' submenu in the editor context menu"),
            proposed: 'contribShareMenu'
        },
        {
            key: 'explorer/context',
            id: actions_1.MenuId.ExplorerContext,
            description: (0, nls_1.localize)('menus.explorerContext', "The file explorer context menu")
        },
        {
            key: 'explorer/context/share',
            id: actions_1.MenuId.ExplorerContextShare,
            description: (0, nls_1.localize)('menus.explorerContextShare', "'Share' submenu in the file explorer context menu"),
            proposed: 'contribShareMenu'
        },
        {
            key: 'editor/title/context',
            id: actions_1.MenuId.EditorTitleContext,
            description: (0, nls_1.localize)('menus.editorTabContext', "The editor tabs context menu")
        },
        {
            key: 'editor/title/context/share',
            id: actions_1.MenuId.EditorTitleContextShare,
            description: (0, nls_1.localize)('menus.editorTitleContextShare', "'Share' submenu inside the editor title context menu"),
            proposed: 'contribShareMenu'
        },
        {
            key: 'debug/callstack/context',
            id: actions_1.MenuId.DebugCallStackContext,
            description: (0, nls_1.localize)('menus.debugCallstackContext', "The debug callstack view context menu")
        },
        {
            key: 'debug/variables/context',
            id: actions_1.MenuId.DebugVariablesContext,
            description: (0, nls_1.localize)('menus.debugVariablesContext', "The debug variables view context menu")
        },
        {
            key: 'debug/toolBar',
            id: actions_1.MenuId.DebugToolBar,
            description: (0, nls_1.localize)('menus.debugToolBar', "The debug toolbar menu")
        },
        {
            key: 'notebook/variables/context',
            id: actions_1.MenuId.NotebookVariablesContext,
            description: (0, nls_1.localize)('menus.notebookVariablesContext', "The notebook variables view context menu")
        },
        {
            key: 'menuBar/home',
            id: actions_1.MenuId.MenubarHomeMenu,
            description: (0, nls_1.localize)('menus.home', "The home indicator context menu (web only)"),
            proposed: 'contribMenuBarHome',
            supportsSubmenus: false
        },
        {
            key: 'menuBar/edit/copy',
            id: actions_1.MenuId.MenubarCopy,
            description: (0, nls_1.localize)('menus.opy', "'Copy as' submenu in the top level Edit menu")
        },
        {
            key: 'scm/title',
            id: actions_1.MenuId.SCMTitle,
            description: (0, nls_1.localize)('menus.scmTitle', "The Source Control title menu")
        },
        {
            key: 'scm/sourceControl',
            id: actions_1.MenuId.SCMSourceControl,
            description: (0, nls_1.localize)('menus.scmSourceControl', "The Source Control menu")
        },
        {
            key: 'scm/sourceControl/title',
            id: actions_1.MenuId.SCMSourceControlTitle,
            description: (0, nls_1.localize)('menus.scmSourceControlTitle', "The Source Control title menu"),
            proposed: 'contribSourceControlTitleMenu'
        },
        {
            key: 'scm/resourceState/context',
            id: actions_1.MenuId.SCMResourceContext,
            description: (0, nls_1.localize)('menus.resourceStateContext', "The Source Control resource state context menu")
        },
        {
            key: 'scm/resourceFolder/context',
            id: actions_1.MenuId.SCMResourceFolderContext,
            description: (0, nls_1.localize)('menus.resourceFolderContext', "The Source Control resource folder context menu")
        },
        {
            key: 'scm/resourceGroup/context',
            id: actions_1.MenuId.SCMResourceGroupContext,
            description: (0, nls_1.localize)('menus.resourceGroupContext', "The Source Control resource group context menu")
        },
        {
            key: 'scm/change/title',
            id: actions_1.MenuId.SCMChangeContext,
            description: (0, nls_1.localize)('menus.changeTitle', "The Source Control inline change menu")
        },
        {
            key: 'scm/inputBox',
            id: actions_1.MenuId.SCMInputBox,
            description: (0, nls_1.localize)('menus.input', "The Source Control input box menu"),
            proposed: 'contribSourceControlInputBoxMenu'
        },
        {
            key: 'scm/incomingChanges',
            id: actions_1.MenuId.SCMIncomingChanges,
            description: (0, nls_1.localize)('menus.incomingChanges', "The Source Control incoming changes menu"),
            proposed: 'contribSourceControlHistoryItemGroupMenu'
        },
        {
            key: 'scm/incomingChanges/context',
            id: actions_1.MenuId.SCMIncomingChangesContext,
            description: (0, nls_1.localize)('menus.incomingChangesContext', "The Source Control incoming changes context menu"),
            proposed: 'contribSourceControlHistoryItemGroupMenu'
        },
        {
            key: 'scm/outgoingChanges',
            id: actions_1.MenuId.SCMOutgoingChanges,
            description: (0, nls_1.localize)('menus.outgoingChanges', "The Source Control outgoing changes menu"),
            proposed: 'contribSourceControlHistoryItemGroupMenu'
        },
        {
            key: 'scm/outgoingChanges/context',
            id: actions_1.MenuId.SCMOutgoingChangesContext,
            description: (0, nls_1.localize)('menus.outgoingChangesContext', "The Source Control outgoing changes context menu"),
            proposed: 'contribSourceControlHistoryItemGroupMenu'
        },
        {
            key: 'scm/incomingChanges/allChanges/context',
            id: actions_1.MenuId.SCMIncomingChangesAllChangesContext,
            description: (0, nls_1.localize)('menus.incomingChangesAllChangesContext', "The Source Control all incoming changes context menu"),
            proposed: 'contribSourceControlHistoryItemMenu'
        },
        {
            key: 'scm/incomingChanges/historyItem/context',
            id: actions_1.MenuId.SCMIncomingChangesHistoryItemContext,
            description: (0, nls_1.localize)('menus.incomingChangesHistoryItemContext', "The Source Control incoming changes history item context menu"),
            proposed: 'contribSourceControlHistoryItemMenu'
        },
        {
            key: 'scm/outgoingChanges/allChanges/context',
            id: actions_1.MenuId.SCMOutgoingChangesAllChangesContext,
            description: (0, nls_1.localize)('menus.outgoingChangesAllChangesContext', "The Source Control all outgoing changes context menu"),
            proposed: 'contribSourceControlHistoryItemMenu'
        },
        {
            key: 'scm/outgoingChanges/historyItem/context',
            id: actions_1.MenuId.SCMOutgoingChangesHistoryItemContext,
            description: (0, nls_1.localize)('menus.outgoingChangesHistoryItemContext', "The Source Control outgoing changes history item context menu"),
            proposed: 'contribSourceControlHistoryItemMenu'
        },
        {
            key: 'statusBar/remoteIndicator',
            id: actions_1.MenuId.StatusBarRemoteIndicatorMenu,
            description: (0, nls_1.localize)('menus.statusBarRemoteIndicator', "The remote indicator menu in the status bar"),
            supportsSubmenus: false
        },
        {
            key: 'terminal/context',
            id: actions_1.MenuId.TerminalInstanceContext,
            description: (0, nls_1.localize)('menus.terminalContext', "The terminal context menu")
        },
        {
            key: 'terminal/title/context',
            id: actions_1.MenuId.TerminalTabContext,
            description: (0, nls_1.localize)('menus.terminalTabContext', "The terminal tabs context menu")
        },
        {
            key: 'view/title',
            id: actions_1.MenuId.ViewTitle,
            description: (0, nls_1.localize)('view.viewTitle', "The contributed view title menu")
        },
        {
            key: 'view/item/context',
            id: actions_1.MenuId.ViewItemContext,
            description: (0, nls_1.localize)('view.itemContext', "The contributed view item context menu")
        },
        {
            key: 'comments/comment/editorActions',
            id: actions_1.MenuId.CommentEditorActions,
            description: (0, nls_1.localize)('commentThread.editorActions', "The contributed comment editor actions"),
            proposed: 'contribCommentEditorActionsMenu'
        },
        {
            key: 'comments/commentThread/title',
            id: actions_1.MenuId.CommentThreadTitle,
            description: (0, nls_1.localize)('commentThread.title', "The contributed comment thread title menu")
        },
        {
            key: 'comments/commentThread/context',
            id: actions_1.MenuId.CommentThreadActions,
            description: (0, nls_1.localize)('commentThread.actions', "The contributed comment thread context menu, rendered as buttons below the comment editor"),
            supportsSubmenus: false
        },
        {
            key: 'comments/commentThread/additionalActions',
            id: actions_1.MenuId.CommentThreadAdditionalActions,
            description: (0, nls_1.localize)('commentThread.actions', "The contributed comment thread context menu, rendered as buttons below the comment editor"),
            supportsSubmenus: false,
            proposed: 'contribCommentThreadAdditionalMenu'
        },
        {
            key: 'comments/commentThread/title/context',
            id: actions_1.MenuId.CommentThreadTitleContext,
            description: (0, nls_1.localize)('commentThread.titleContext', "The contributed comment thread title's peek context menu, rendered as a right click menu on the comment thread's peek title."),
            proposed: 'contribCommentPeekContext'
        },
        {
            key: 'comments/comment/title',
            id: actions_1.MenuId.CommentTitle,
            description: (0, nls_1.localize)('comment.title', "The contributed comment title menu")
        },
        {
            key: 'comments/comment/context',
            id: actions_1.MenuId.CommentActions,
            description: (0, nls_1.localize)('comment.actions', "The contributed comment context menu, rendered as buttons below the comment editor"),
            supportsSubmenus: false
        },
        {
            key: 'comments/commentThread/comment/context',
            id: actions_1.MenuId.CommentThreadCommentContext,
            description: (0, nls_1.localize)('comment.commentContext', "The contributed comment context menu, rendered as a right click menu on the an individual comment in the comment thread's peek view."),
            proposed: 'contribCommentPeekContext'
        },
        {
            key: 'commentsView/commentThread/context',
            id: actions_1.MenuId.CommentsViewThreadActions,
            description: (0, nls_1.localize)('commentsView.threadActions', "The contributed comment thread context menu in the comments view"),
            proposed: 'contribCommentsViewThreadMenus'
        },
        {
            key: 'notebook/toolbar',
            id: actions_1.MenuId.NotebookToolbar,
            description: (0, nls_1.localize)('notebook.toolbar', "The contributed notebook toolbar menu")
        },
        {
            key: 'notebook/kernelSource',
            id: actions_1.MenuId.NotebookKernelSource,
            description: (0, nls_1.localize)('notebook.kernelSource', "The contributed notebook kernel sources menu"),
            proposed: 'notebookKernelSource'
        },
        {
            key: 'notebook/cell/title',
            id: actions_1.MenuId.NotebookCellTitle,
            description: (0, nls_1.localize)('notebook.cell.title', "The contributed notebook cell title menu")
        },
        {
            key: 'notebook/cell/execute',
            id: actions_1.MenuId.NotebookCellExecute,
            description: (0, nls_1.localize)('notebook.cell.execute', "The contributed notebook cell execution menu")
        },
        {
            key: 'interactive/toolbar',
            id: actions_1.MenuId.InteractiveToolbar,
            description: (0, nls_1.localize)('interactive.toolbar', "The contributed interactive toolbar menu"),
        },
        {
            key: 'interactive/cell/title',
            id: actions_1.MenuId.InteractiveCellTitle,
            description: (0, nls_1.localize)('interactive.cell.title', "The contributed interactive cell title menu"),
        },
        {
            key: 'issue/reporter',
            id: actions_1.MenuId.IssueReporter,
            description: (0, nls_1.localize)('issue.reporter', "The contributed issue reporter menu"),
            proposed: 'contribIssueReporter'
        },
        {
            key: 'testing/item/context',
            id: actions_1.MenuId.TestItem,
            description: (0, nls_1.localize)('testing.item.context', "The contributed test item menu"),
        },
        {
            key: 'testing/item/gutter',
            id: actions_1.MenuId.TestItemGutter,
            description: (0, nls_1.localize)('testing.item.gutter.title', "The menu for a gutter decoration for a test item"),
        },
        {
            key: 'testing/item/result',
            id: actions_1.MenuId.TestPeekElement,
            description: (0, nls_1.localize)('testing.item.result.title', "The menu for an item in the Test Results view or peek."),
        },
        {
            key: 'testing/message/context',
            id: actions_1.MenuId.TestMessageContext,
            description: (0, nls_1.localize)('testing.message.context.title', "A prominent button overlaying editor content where the message is displayed"),
        },
        {
            key: 'testing/message/content',
            id: actions_1.MenuId.TestMessageContent,
            description: (0, nls_1.localize)('testing.message.content.title', "Context menu for the message in the results tree"),
        },
        {
            key: 'extension/context',
            id: actions_1.MenuId.ExtensionContext,
            description: (0, nls_1.localize)('menus.extensionContext', "The extension context menu")
        },
        {
            key: 'timeline/title',
            id: actions_1.MenuId.TimelineTitle,
            description: (0, nls_1.localize)('view.timelineTitle', "The Timeline view title menu")
        },
        {
            key: 'timeline/item/context',
            id: actions_1.MenuId.TimelineItemContext,
            description: (0, nls_1.localize)('view.timelineContext', "The Timeline view item context menu")
        },
        {
            key: 'ports/item/context',
            id: actions_1.MenuId.TunnelContext,
            description: (0, nls_1.localize)('view.tunnelContext', "The Ports view item context menu")
        },
        {
            key: 'ports/item/origin/inline',
            id: actions_1.MenuId.TunnelOriginInline,
            description: (0, nls_1.localize)('view.tunnelOriginInline', "The Ports view item origin inline menu")
        },
        {
            key: 'ports/item/port/inline',
            id: actions_1.MenuId.TunnelPortInline,
            description: (0, nls_1.localize)('view.tunnelPortInline', "The Ports view item port inline menu")
        },
        {
            key: 'file/newFile',
            id: actions_1.MenuId.NewFile,
            description: (0, nls_1.localize)('file.newFile', "The 'New File...' quick pick, shown on welcome page and File menu."),
            supportsSubmenus: false,
        },
        {
            key: 'webview/context',
            id: actions_1.MenuId.WebviewContext,
            description: (0, nls_1.localize)('webview.context', "The webview context menu")
        },
        {
            key: 'file/share',
            id: actions_1.MenuId.MenubarShare,
            description: (0, nls_1.localize)('menus.share', "Share submenu shown in the top level File menu."),
            proposed: 'contribShareMenu'
        },
        {
            key: 'editor/inlineCompletions/actions',
            id: actions_1.MenuId.InlineCompletionsActions,
            description: (0, nls_1.localize)('inlineCompletions.actions', "The actions shown when hovering on an inline completion"),
            supportsSubmenus: false,
            proposed: 'inlineCompletionsAdditions'
        },
        {
            key: 'editor/inlineEdit/actions',
            id: actions_1.MenuId.InlineEditActions,
            description: (0, nls_1.localize)('inlineEdit.actions', "The actions shown when hovering on an inline edit"),
            supportsSubmenus: false,
            proposed: 'inlineEdit'
        },
        {
            key: 'editor/content',
            id: actions_1.MenuId.EditorContent,
            description: (0, nls_1.localize)('merge.toolbar', "The prominent button in an editor, overlays its content"),
            proposed: 'contribEditorContentMenu'
        },
        {
            key: 'editor/lineNumber/context',
            id: actions_1.MenuId.EditorLineNumberContext,
            description: (0, nls_1.localize)('editorLineNumberContext', "The contributed editor line number context menu")
        },
        {
            key: 'mergeEditor/result/title',
            id: actions_1.MenuId.MergeInputResultToolbar,
            description: (0, nls_1.localize)('menus.mergeEditorResult', "The result toolbar of the merge editor"),
            proposed: 'contribMergeEditorMenus'
        },
        {
            key: 'multiDiffEditor/resource/title',
            id: actions_1.MenuId.MultiDiffEditorFileToolbar,
            description: (0, nls_1.localize)('menus.multiDiffEditorResource', "The resource toolbar in the multi diff editor"),
            proposed: 'contribMultiDiffEditorMenus'
        },
        {
            key: 'diffEditor/gutter/hunk',
            id: actions_1.MenuId.DiffEditorHunkToolbar,
            description: (0, nls_1.localize)('menus.diffEditorGutterToolBarMenus', "The gutter toolbar in the diff editor"),
            proposed: 'contribDiffEditorGutterToolBarMenus'
        },
        {
            key: 'diffEditor/gutter/selection',
            id: actions_1.MenuId.DiffEditorSelectionToolbar,
            description: (0, nls_1.localize)('menus.diffEditorGutterToolBarMenus', "The gutter toolbar in the diff editor"),
            proposed: 'contribDiffEditorGutterToolBarMenus'
        }
    ];
    var schema;
    (function (schema) {
        // --- menus, submenus contribution point
        function isMenuItem(item) {
            return typeof item.command === 'string';
        }
        schema.isMenuItem = isMenuItem;
        function isValidMenuItem(item, collector) {
            if (typeof item.command !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'command'));
                return false;
            }
            if (item.alt && typeof item.alt !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'alt'));
                return false;
            }
            if (item.when && typeof item.when !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
                return false;
            }
            if (item.group && typeof item.group !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'group'));
                return false;
            }
            return true;
        }
        schema.isValidMenuItem = isValidMenuItem;
        function isValidSubmenuItem(item, collector) {
            if (typeof item.submenu !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'submenu'));
                return false;
            }
            if (item.when && typeof item.when !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
                return false;
            }
            if (item.group && typeof item.group !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'group'));
                return false;
            }
            return true;
        }
        schema.isValidSubmenuItem = isValidSubmenuItem;
        function isValidItems(items, collector) {
            if (!Array.isArray(items)) {
                collector.error((0, nls_1.localize)('requirearray', "submenu items must be an array"));
                return false;
            }
            for (const item of items) {
                if (isMenuItem(item)) {
                    if (!isValidMenuItem(item, collector)) {
                        return false;
                    }
                }
                else {
                    if (!isValidSubmenuItem(item, collector)) {
                        return false;
                    }
                }
            }
            return true;
        }
        schema.isValidItems = isValidItems;
        function isValidSubmenu(submenu, collector) {
            if (typeof submenu !== 'object') {
                collector.error((0, nls_1.localize)('require', "submenu items must be an object"));
                return false;
            }
            if (typeof submenu.id !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'id'));
                return false;
            }
            if (typeof submenu.label !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'label'));
                return false;
            }
            return true;
        }
        schema.isValidSubmenu = isValidSubmenu;
        const menuItem = {
            type: 'object',
            required: ['command'],
            properties: {
                command: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.command', 'Identifier of the command to execute. The command must be declared in the \'commands\'-section'),
                    type: 'string'
                },
                alt: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.alt', 'Identifier of an alternative command to execute. The command must be declared in the \'commands\'-section'),
                    type: 'string'
                },
                when: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.when', 'Condition which must be true to show this item'),
                    type: 'string'
                },
                group: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.group', 'Group into which this item belongs'),
                    type: 'string'
                }
            }
        };
        const submenuItem = {
            type: 'object',
            required: ['submenu'],
            properties: {
                submenu: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.submenu', 'Identifier of the submenu to display in this item.'),
                    type: 'string'
                },
                when: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.when', 'Condition which must be true to show this item'),
                    type: 'string'
                },
                group: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.group', 'Group into which this item belongs'),
                    type: 'string'
                }
            }
        };
        const submenu = {
            type: 'object',
            required: ['id', 'label'],
            properties: {
                id: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.id', 'Identifier of the menu to display as a submenu.'),
                    type: 'string'
                },
                label: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.label', 'The label of the menu item which leads to this submenu.'),
                    type: 'string'
                },
                icon: {
                    description: (0, nls_1.localize)({ key: 'vscode.extension.contributes.submenu.icon', comment: ['do not translate or change `\\$(zap)`, \\ in front of $ is important.'] }, '(Optional) Icon which is used to represent the submenu in the UI. Either a file path, an object with file paths for dark and light themes, or a theme icon references, like `\\$(zap)`'),
                    anyOf: [{
                            type: 'string'
                        },
                        {
                            type: 'object',
                            properties: {
                                light: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.icon.light', 'Icon path when a light theme is used'),
                                    type: 'string'
                                },
                                dark: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.icon.dark', 'Icon path when a dark theme is used'),
                                    type: 'string'
                                }
                            }
                        }]
                }
            }
        };
        schema.menusContribution = {
            description: (0, nls_1.localize)('vscode.extension.contributes.menus', "Contributes menu items to the editor"),
            type: 'object',
            properties: (0, arrays_1.index)(apiMenus, menu => menu.key, menu => ({
                markdownDescription: menu.proposed ? (0, nls_1.localize)('proposed', "Proposed API, requires `enabledApiProposal: [\"{0}\"]` - {1}", menu.proposed, menu.description) : menu.description,
                type: 'array',
                items: menu.supportsSubmenus === false ? menuItem : { oneOf: [menuItem, submenuItem] }
            })),
            additionalProperties: {
                description: 'Submenu',
                type: 'array',
                items: { oneOf: [menuItem, submenuItem] }
            }
        };
        schema.submenusContribution = {
            description: (0, nls_1.localize)('vscode.extension.contributes.submenus', "Contributes submenu items to the editor"),
            type: 'array',
            items: submenu
        };
        function isValidCommand(command, collector) {
            if (!command) {
                collector.error((0, nls_1.localize)('nonempty', "expected non-empty value."));
                return false;
            }
            if ((0, strings_1.isFalsyOrWhitespace)(command.command)) {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'command'));
                return false;
            }
            if (!isValidLocalizedString(command.title, collector, 'title')) {
                return false;
            }
            if (command.shortTitle && !isValidLocalizedString(command.shortTitle, collector, 'shortTitle')) {
                return false;
            }
            if (command.enablement && typeof command.enablement !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'precondition'));
                return false;
            }
            if (command.category && !isValidLocalizedString(command.category, collector, 'category')) {
                return false;
            }
            if (!isValidIcon(command.icon, collector)) {
                return false;
            }
            return true;
        }
        schema.isValidCommand = isValidCommand;
        function isValidIcon(icon, collector) {
            if (typeof icon === 'undefined') {
                return true;
            }
            if (typeof icon === 'string') {
                return true;
            }
            else if (typeof icon.dark === 'string' && typeof icon.light === 'string') {
                return true;
            }
            collector.error((0, nls_1.localize)('opticon', "property `icon` can be omitted or must be either a string or a literal like `{dark, light}`"));
            return false;
        }
        function isValidLocalizedString(localized, collector, propertyName) {
            if (typeof localized === 'undefined') {
                collector.error((0, nls_1.localize)('requireStringOrObject', "property `{0}` is mandatory and must be of type `string` or `object`", propertyName));
                return false;
            }
            else if (typeof localized === 'string' && (0, strings_1.isFalsyOrWhitespace)(localized)) {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", propertyName));
                return false;
            }
            else if (typeof localized !== 'string' && ((0, strings_1.isFalsyOrWhitespace)(localized.original) || (0, strings_1.isFalsyOrWhitespace)(localized.value))) {
                collector.error((0, nls_1.localize)('requirestrings', "properties `{0}` and `{1}` are mandatory and must be of type `string`", `${propertyName}.value`, `${propertyName}.original`));
                return false;
            }
            return true;
        }
        const commandType = {
            type: 'object',
            required: ['command', 'title'],
            properties: {
                command: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.command', 'Identifier of the command to execute'),
                    type: 'string'
                },
                title: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.title', 'Title by which the command is represented in the UI'),
                    type: 'string'
                },
                shortTitle: {
                    markdownDescription: (0, nls_1.localize)('vscode.extension.contributes.commandType.shortTitle', '(Optional) Short title by which the command is represented in the UI. Menus pick either `title` or `shortTitle` depending on the context in which they show commands.'),
                    type: 'string'
                },
                category: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.category', '(Optional) Category string by which the command is grouped in the UI'),
                    type: 'string'
                },
                enablement: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.precondition', '(Optional) Condition which must be true to enable the command in the UI (menu and keybindings). Does not prevent executing the command by other means, like the `executeCommand`-api.'),
                    type: 'string'
                },
                icon: {
                    description: (0, nls_1.localize)({ key: 'vscode.extension.contributes.commandType.icon', comment: ['do not translate or change `\\$(zap)`, \\ in front of $ is important.'] }, '(Optional) Icon which is used to represent the command in the UI. Either a file path, an object with file paths for dark and light themes, or a theme icon references, like `\\$(zap)`'),
                    anyOf: [{
                            type: 'string'
                        },
                        {
                            type: 'object',
                            properties: {
                                light: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.icon.light', 'Icon path when a light theme is used'),
                                    type: 'string'
                                },
                                dark: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.icon.dark', 'Icon path when a dark theme is used'),
                                    type: 'string'
                                }
                            }
                        }]
                }
            }
        };
        schema.commandsContribution = {
            description: (0, nls_1.localize)('vscode.extension.contributes.commands', "Contributes commands to the command palette."),
            oneOf: [
                commandType,
                {
                    type: 'array',
                    items: commandType
                }
            ]
        };
    })(schema || (schema = {}));
    const _commandRegistrations = new lifecycle_1.DisposableStore();
    exports.commandsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'commands',
        jsonSchema: schema.commandsContribution,
        activationEventsGenerator: (contribs, result) => {
            for (const contrib of contribs) {
                if (contrib.command) {
                    result.push(`onCommand:${contrib.command}`);
                }
            }
        }
    });
    exports.commandsExtensionPoint.setHandler(extensions => {
        function handleCommand(userFriendlyCommand, extension) {
            if (!schema.isValidCommand(userFriendlyCommand, extension.collector)) {
                return;
            }
            const { icon, enablement, category, title, shortTitle, command } = userFriendlyCommand;
            let absoluteIcon;
            if (icon) {
                if (typeof icon === 'string') {
                    absoluteIcon = themables_1.ThemeIcon.fromString(icon) ?? { dark: resources.joinPath(extension.description.extensionLocation, icon), light: resources.joinPath(extension.description.extensionLocation, icon) };
                }
                else {
                    absoluteIcon = {
                        dark: resources.joinPath(extension.description.extensionLocation, icon.dark),
                        light: resources.joinPath(extension.description.extensionLocation, icon.light)
                    };
                }
            }
            const existingCmd = actions_1.MenuRegistry.getCommand(command);
            if (existingCmd) {
                if (existingCmd.source) {
                    extension.collector.info((0, nls_1.localize)('dup1', "Command `{0}` already registered by {1} ({2})", userFriendlyCommand.command, existingCmd.source.title, existingCmd.source.id));
                }
                else {
                    extension.collector.info((0, nls_1.localize)('dup0', "Command `{0}` already registered", userFriendlyCommand.command));
                }
            }
            _commandRegistrations.add(actions_1.MenuRegistry.addCommand({
                id: command,
                title,
                source: { id: extension.description.identifier.value, title: extension.description.displayName ?? extension.description.name },
                shortTitle,
                tooltip: title,
                category,
                precondition: contextkey_1.ContextKeyExpr.deserialize(enablement),
                icon: absoluteIcon
            }));
        }
        // remove all previous command registrations
        _commandRegistrations.clear();
        for (const extension of extensions) {
            const { value } = extension;
            if (Array.isArray(value)) {
                for (const command of value) {
                    handleCommand(command, extension);
                }
            }
            else {
                handleCommand(value, extension);
            }
        }
    });
    const _submenus = new Map();
    const submenusExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'submenus',
        jsonSchema: schema.submenusContribution
    });
    submenusExtensionPoint.setHandler(extensions => {
        _submenus.clear();
        for (const extension of extensions) {
            const { value, collector } = extension;
            for (const [, submenuInfo] of Object.entries(value)) {
                if (!schema.isValidSubmenu(submenuInfo, collector)) {
                    continue;
                }
                if (!submenuInfo.id) {
                    collector.warn((0, nls_1.localize)('submenuId.invalid.id', "`{0}` is not a valid submenu identifier", submenuInfo.id));
                    continue;
                }
                if (_submenus.has(submenuInfo.id)) {
                    collector.info((0, nls_1.localize)('submenuId.duplicate.id', "The `{0}` submenu was already previously registered.", submenuInfo.id));
                    continue;
                }
                if (!submenuInfo.label) {
                    collector.warn((0, nls_1.localize)('submenuId.invalid.label', "`{0}` is not a valid submenu label", submenuInfo.label));
                    continue;
                }
                let absoluteIcon;
                if (submenuInfo.icon) {
                    if (typeof submenuInfo.icon === 'string') {
                        absoluteIcon = themables_1.ThemeIcon.fromString(submenuInfo.icon) || { dark: resources.joinPath(extension.description.extensionLocation, submenuInfo.icon) };
                    }
                    else {
                        absoluteIcon = {
                            dark: resources.joinPath(extension.description.extensionLocation, submenuInfo.icon.dark),
                            light: resources.joinPath(extension.description.extensionLocation, submenuInfo.icon.light)
                        };
                    }
                }
                const item = {
                    id: actions_1.MenuId.for(`api:${submenuInfo.id}`),
                    label: submenuInfo.label,
                    icon: absoluteIcon
                };
                _submenus.set(submenuInfo.id, item);
            }
        }
    });
    const _apiMenusByKey = new Map(apiMenus.map(menu => ([menu.key, menu])));
    const _menuRegistrations = new lifecycle_1.DisposableStore();
    const _submenuMenuItems = new Map();
    const menusExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'menus',
        jsonSchema: schema.menusContribution,
        deps: [submenusExtensionPoint]
    });
    menusExtensionPoint.setHandler(extensions => {
        // remove all previous menu registrations
        _menuRegistrations.clear();
        _submenuMenuItems.clear();
        for (const extension of extensions) {
            const { value, collector } = extension;
            for (const entry of Object.entries(value)) {
                if (!schema.isValidItems(entry[1], collector)) {
                    continue;
                }
                let menu = _apiMenusByKey.get(entry[0]);
                if (!menu) {
                    const submenu = _submenus.get(entry[0]);
                    if (submenu) {
                        menu = {
                            key: entry[0],
                            id: submenu.id,
                            description: ''
                        };
                    }
                }
                if (!menu) {
                    continue;
                }
                if (menu.proposed && !(0, extensions_1.isProposedApiEnabled)(extension.description, menu.proposed)) {
                    collector.error((0, nls_1.localize)('proposedAPI.invalid', "{0} is a proposed menu identifier. It requires 'package.json#enabledApiProposals: [\"{1}\"]' and is only available when running out of dev or with the following command line switch: --enable-proposed-api {2}", entry[0], menu.proposed, extension.description.identifier.value));
                    continue;
                }
                for (const menuItem of entry[1]) {
                    let item;
                    if (schema.isMenuItem(menuItem)) {
                        const command = actions_1.MenuRegistry.getCommand(menuItem.command);
                        const alt = menuItem.alt && actions_1.MenuRegistry.getCommand(menuItem.alt) || undefined;
                        if (!command) {
                            collector.error((0, nls_1.localize)('missing.command', "Menu item references a command `{0}` which is not defined in the 'commands' section.", menuItem.command));
                            continue;
                        }
                        if (menuItem.alt && !alt) {
                            collector.warn((0, nls_1.localize)('missing.altCommand', "Menu item references an alt-command `{0}` which is not defined in the 'commands' section.", menuItem.alt));
                        }
                        if (menuItem.command === menuItem.alt) {
                            collector.info((0, nls_1.localize)('dupe.command', "Menu item references the same command as default and alt-command"));
                        }
                        item = { command, alt, group: undefined, order: undefined, when: undefined };
                    }
                    else {
                        if (menu.supportsSubmenus === false) {
                            collector.error((0, nls_1.localize)('unsupported.submenureference', "Menu item references a submenu for a menu which doesn't have submenu support."));
                            continue;
                        }
                        const submenu = _submenus.get(menuItem.submenu);
                        if (!submenu) {
                            collector.error((0, nls_1.localize)('missing.submenu', "Menu item references a submenu `{0}` which is not defined in the 'submenus' section.", menuItem.submenu));
                            continue;
                        }
                        let submenuRegistrations = _submenuMenuItems.get(menu.id.id);
                        if (!submenuRegistrations) {
                            submenuRegistrations = new Set();
                            _submenuMenuItems.set(menu.id.id, submenuRegistrations);
                        }
                        if (submenuRegistrations.has(submenu.id.id)) {
                            collector.warn((0, nls_1.localize)('submenuItem.duplicate', "The `{0}` submenu was already contributed to the `{1}` menu.", menuItem.submenu, entry[0]));
                            continue;
                        }
                        submenuRegistrations.add(submenu.id.id);
                        item = { submenu: submenu.id, icon: submenu.icon, title: submenu.label, group: undefined, order: undefined, when: undefined };
                    }
                    if (menuItem.group) {
                        const idx = menuItem.group.lastIndexOf('@');
                        if (idx > 0) {
                            item.group = menuItem.group.substr(0, idx);
                            item.order = Number(menuItem.group.substr(idx + 1)) || undefined;
                        }
                        else {
                            item.group = menuItem.group;
                        }
                    }
                    item.when = contextkey_1.ContextKeyExpr.deserialize(menuItem.when);
                    _menuRegistrations.add(actions_1.MenuRegistry.appendMenuItem(menu.id, item));
                }
            }
        }
    });
    let CommandsTableRenderer = class CommandsTableRenderer extends lifecycle_1.Disposable {
        constructor(_keybindingService) {
            super();
            this._keybindingService = _keybindingService;
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.commands;
        }
        render(manifest) {
            const rawCommands = manifest.contributes?.commands || [];
            const commands = rawCommands.map(c => ({
                id: c.command,
                title: c.title,
                keybindings: [],
                menus: []
            }));
            const byId = (0, arrays_1.index)(commands, c => c.id);
            const menus = manifest.contributes?.menus || {};
            for (const context in menus) {
                for (const menu of menus[context]) {
                    if (menu.command) {
                        let command = byId[menu.command];
                        if (command) {
                            command.menus.push(context);
                        }
                        else {
                            command = { id: menu.command, title: '', keybindings: [], menus: [context] };
                            byId[command.id] = command;
                            commands.push(command);
                        }
                    }
                }
            }
            const rawKeybindings = manifest.contributes?.keybindings ? (Array.isArray(manifest.contributes.keybindings) ? manifest.contributes.keybindings : [manifest.contributes.keybindings]) : [];
            rawKeybindings.forEach(rawKeybinding => {
                const keybinding = this.resolveKeybinding(rawKeybinding);
                if (!keybinding) {
                    return;
                }
                let command = byId[rawKeybinding.command];
                if (command) {
                    command.keybindings.push(keybinding);
                }
                else {
                    command = { id: rawKeybinding.command, title: '', keybindings: [keybinding], menus: [] };
                    byId[command.id] = command;
                    commands.push(command);
                }
            });
            if (!commands.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                (0, nls_1.localize)('command name', "ID"),
                (0, nls_1.localize)('command title', "Title"),
                (0, nls_1.localize)('keyboard shortcuts', "Keyboard Shortcuts"),
                (0, nls_1.localize)('menuContexts', "Menu Contexts")
            ];
            const rows = commands.sort((a, b) => a.id.localeCompare(b.id))
                .map(command => {
                return [
                    new htmlContent_1.MarkdownString().appendMarkdown(`\`${command.id}\``),
                    typeof command.title === 'string' ? command.title : command.title.value,
                    command.keybindings,
                    new htmlContent_1.MarkdownString().appendMarkdown(`${command.menus.map(menu => `\`${menu}\``).join('&nbsp;')}`),
                ];
            });
            return {
                data: {
                    headers,
                    rows
                },
                dispose: () => { }
            };
        }
        resolveKeybinding(rawKeyBinding) {
            let key;
            switch (process_1.platform) {
                case 'win32':
                    key = rawKeyBinding.win;
                    break;
                case 'linux':
                    key = rawKeyBinding.linux;
                    break;
                case 'darwin':
                    key = rawKeyBinding.mac;
                    break;
            }
            return this._keybindingService.resolveUserBinding(key ?? rawKeyBinding.key)[0];
        }
    };
    CommandsTableRenderer = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], CommandsTableRenderer);
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'commands',
        label: (0, nls_1.localize)('commands', "Commands"),
        access: {
            canToggle: false,
        },
        renderer: new descriptors_1.SyncDescriptor(CommandsTableRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudXNFeHRlbnNpb25Qb2ludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9hY3Rpb25zL2NvbW1vbi9tZW51c0V4dGVuc2lvblBvaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlDaEcsTUFBTSxRQUFRLEdBQWU7UUFDNUI7WUFDQyxHQUFHLEVBQUUsZ0JBQWdCO1lBQ3JCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGNBQWM7WUFDekIsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLHFCQUFxQixDQUFDO1lBQ3BFLGdCQUFnQixFQUFFLEtBQUs7U0FDdkI7UUFDRDtZQUNDLEdBQUcsRUFBRSxVQUFVO1lBQ2YsRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTtZQUMxQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsNEJBQTRCLENBQUM7WUFDckUsZ0JBQWdCLEVBQUUsS0FBSztTQUN2QjtRQUNEO1lBQ0MsR0FBRyxFQUFFLGNBQWM7WUFDbkIsRUFBRSxFQUFFLGdCQUFNLENBQUMsV0FBVztZQUN0QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsdUJBQXVCLENBQUM7U0FDbkU7UUFDRDtZQUNDLEdBQUcsRUFBRSxrQkFBa0I7WUFDdkIsRUFBRSxFQUFFLGdCQUFNLENBQUMsY0FBYztZQUN6QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsMENBQTBDLENBQUM7U0FDekY7UUFDRDtZQUNDLEdBQUcsRUFBRSxnQkFBZ0I7WUFDckIsRUFBRSxFQUFFLGdCQUFNLENBQUMsYUFBYTtZQUN4QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUseUJBQXlCLENBQUM7U0FDdkU7UUFDRDtZQUNDLEdBQUcsRUFBRSxxQkFBcUI7WUFDMUIsRUFBRSxFQUFFLGdCQUFNLENBQUMsaUJBQWlCO1lBQzVCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSw4Q0FBOEMsQ0FBQztTQUNsRztRQUNEO1lBQ0MsR0FBRyxFQUFFLHNCQUFzQjtZQUMzQixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxrQkFBa0I7WUFDN0IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLDRDQUE0QyxDQUFDO1lBQy9GLFFBQVEsRUFBRSxrQkFBa0I7U0FDNUI7UUFDRDtZQUNDLEdBQUcsRUFBRSxrQkFBa0I7WUFDdkIsRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTtZQUMxQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsZ0NBQWdDLENBQUM7U0FDaEY7UUFDRDtZQUNDLEdBQUcsRUFBRSx3QkFBd0I7WUFDN0IsRUFBRSxFQUFFLGdCQUFNLENBQUMsb0JBQW9CO1lBQy9CLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSxtREFBbUQsQ0FBQztZQUN4RyxRQUFRLEVBQUUsa0JBQWtCO1NBQzVCO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsc0JBQXNCO1lBQzNCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGtCQUFrQjtZQUM3QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsOEJBQThCLENBQUM7U0FDL0U7UUFDRDtZQUNDLEdBQUcsRUFBRSw0QkFBNEI7WUFDakMsRUFBRSxFQUFFLGdCQUFNLENBQUMsdUJBQXVCO1lBQ2xDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSxzREFBc0QsQ0FBQztZQUM5RyxRQUFRLEVBQUUsa0JBQWtCO1NBQzVCO1FBQ0Q7WUFDQyxHQUFHLEVBQUUseUJBQXlCO1lBQzlCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLHFCQUFxQjtZQUNoQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUsdUNBQXVDLENBQUM7U0FDN0Y7UUFDRDtZQUNDLEdBQUcsRUFBRSx5QkFBeUI7WUFDOUIsRUFBRSxFQUFFLGdCQUFNLENBQUMscUJBQXFCO1lBQ2hDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSx1Q0FBdUMsQ0FBQztTQUM3RjtRQUNEO1lBQ0MsR0FBRyxFQUFFLGVBQWU7WUFDcEIsRUFBRSxFQUFFLGdCQUFNLENBQUMsWUFBWTtZQUN2QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsd0JBQXdCLENBQUM7U0FDckU7UUFDRDtZQUNDLEdBQUcsRUFBRSw0QkFBNEI7WUFDakMsRUFBRSxFQUFFLGdCQUFNLENBQUMsd0JBQXdCO1lBQ25DLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxnQ0FBZ0MsRUFBRSwwQ0FBMEMsQ0FBQztTQUNuRztRQUNEO1lBQ0MsR0FBRyxFQUFFLGNBQWM7WUFDbkIsRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTtZQUMxQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLDRDQUE0QyxDQUFDO1lBQ2pGLFFBQVEsRUFBRSxvQkFBb0I7WUFDOUIsZ0JBQWdCLEVBQUUsS0FBSztTQUN2QjtRQUNEO1lBQ0MsR0FBRyxFQUFFLG1CQUFtQjtZQUN4QixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxXQUFXO1lBQ3RCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsOENBQThDLENBQUM7U0FDbEY7UUFDRDtZQUNDLEdBQUcsRUFBRSxXQUFXO1lBQ2hCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFFBQVE7WUFDbkIsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLCtCQUErQixDQUFDO1NBQ3hFO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsbUJBQW1CO1lBQ3hCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGdCQUFnQjtZQUMzQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUseUJBQXlCLENBQUM7U0FDMUU7UUFDRDtZQUNDLEdBQUcsRUFBRSx5QkFBeUI7WUFDOUIsRUFBRSxFQUFFLGdCQUFNLENBQUMscUJBQXFCO1lBQ2hDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSwrQkFBK0IsQ0FBQztZQUNyRixRQUFRLEVBQUUsK0JBQStCO1NBQ3pDO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsMkJBQTJCO1lBQ2hDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGtCQUFrQjtZQUM3QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsZ0RBQWdELENBQUM7U0FDckc7UUFDRDtZQUNDLEdBQUcsRUFBRSw0QkFBNEI7WUFDakMsRUFBRSxFQUFFLGdCQUFNLENBQUMsd0JBQXdCO1lBQ25DLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSxpREFBaUQsQ0FBQztTQUN2RztRQUNEO1lBQ0MsR0FBRyxFQUFFLDJCQUEyQjtZQUNoQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyx1QkFBdUI7WUFDbEMsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLGdEQUFnRCxDQUFDO1NBQ3JHO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsa0JBQWtCO1lBQ3ZCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGdCQUFnQjtZQUMzQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsdUNBQXVDLENBQUM7U0FDbkY7UUFDRDtZQUNDLEdBQUcsRUFBRSxjQUFjO1lBQ25CLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFdBQVc7WUFDdEIsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSxtQ0FBbUMsQ0FBQztZQUN6RSxRQUFRLEVBQUUsa0NBQWtDO1NBQzVDO1FBQ0Q7WUFDQyxHQUFHLEVBQUUscUJBQXFCO1lBQzFCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGtCQUFrQjtZQUM3QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsMENBQTBDLENBQUM7WUFDMUYsUUFBUSxFQUFFLDBDQUEwQztTQUNwRDtRQUNEO1lBQ0MsR0FBRyxFQUFFLDZCQUE2QjtZQUNsQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyx5QkFBeUI7WUFDcEMsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDhCQUE4QixFQUFFLGtEQUFrRCxDQUFDO1lBQ3pHLFFBQVEsRUFBRSwwQ0FBMEM7U0FDcEQ7UUFDRDtZQUNDLEdBQUcsRUFBRSxxQkFBcUI7WUFDMUIsRUFBRSxFQUFFLGdCQUFNLENBQUMsa0JBQWtCO1lBQzdCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSwwQ0FBMEMsQ0FBQztZQUMxRixRQUFRLEVBQUUsMENBQTBDO1NBQ3BEO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsNkJBQTZCO1lBQ2xDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLHlCQUF5QjtZQUNwQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsOEJBQThCLEVBQUUsa0RBQWtELENBQUM7WUFDekcsUUFBUSxFQUFFLDBDQUEwQztTQUNwRDtRQUNEO1lBQ0MsR0FBRyxFQUFFLHdDQUF3QztZQUM3QyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxtQ0FBbUM7WUFDOUMsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHdDQUF3QyxFQUFFLHNEQUFzRCxDQUFDO1lBQ3ZILFFBQVEsRUFBRSxxQ0FBcUM7U0FDL0M7UUFDRDtZQUNDLEdBQUcsRUFBRSx5Q0FBeUM7WUFDOUMsRUFBRSxFQUFFLGdCQUFNLENBQUMsb0NBQW9DO1lBQy9DLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx5Q0FBeUMsRUFBRSwrREFBK0QsQ0FBQztZQUNqSSxRQUFRLEVBQUUscUNBQXFDO1NBQy9DO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsd0NBQXdDO1lBQzdDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLG1DQUFtQztZQUM5QyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0NBQXdDLEVBQUUsc0RBQXNELENBQUM7WUFDdkgsUUFBUSxFQUFFLHFDQUFxQztTQUMvQztRQUNEO1lBQ0MsR0FBRyxFQUFFLHlDQUF5QztZQUM5QyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxvQ0FBb0M7WUFDL0MsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHlDQUF5QyxFQUFFLCtEQUErRCxDQUFDO1lBQ2pJLFFBQVEsRUFBRSxxQ0FBcUM7U0FDL0M7UUFDRDtZQUNDLEdBQUcsRUFBRSwyQkFBMkI7WUFDaEMsRUFBRSxFQUFFLGdCQUFNLENBQUMsNEJBQTRCO1lBQ3ZDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxnQ0FBZ0MsRUFBRSw2Q0FBNkMsQ0FBQztZQUN0RyxnQkFBZ0IsRUFBRSxLQUFLO1NBQ3ZCO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsa0JBQWtCO1lBQ3ZCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLHVCQUF1QjtZQUNsQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsMkJBQTJCLENBQUM7U0FDM0U7UUFDRDtZQUNDLEdBQUcsRUFBRSx3QkFBd0I7WUFDN0IsRUFBRSxFQUFFLGdCQUFNLENBQUMsa0JBQWtCO1lBQzdCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSxnQ0FBZ0MsQ0FBQztTQUNuRjtRQUNEO1lBQ0MsR0FBRyxFQUFFLFlBQVk7WUFDakIsRUFBRSxFQUFFLGdCQUFNLENBQUMsU0FBUztZQUNwQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsaUNBQWlDLENBQUM7U0FDMUU7UUFDRDtZQUNDLEdBQUcsRUFBRSxtQkFBbUI7WUFDeEIsRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTtZQUMxQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsd0NBQXdDLENBQUM7U0FDbkY7UUFDRDtZQUNDLEdBQUcsRUFBRSxnQ0FBZ0M7WUFDckMsRUFBRSxFQUFFLGdCQUFNLENBQUMsb0JBQW9CO1lBQy9CLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSx3Q0FBd0MsQ0FBQztZQUM5RixRQUFRLEVBQUUsaUNBQWlDO1NBQzNDO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsOEJBQThCO1lBQ25DLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGtCQUFrQjtZQUM3QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsMkNBQTJDLENBQUM7U0FDekY7UUFDRDtZQUNDLEdBQUcsRUFBRSxnQ0FBZ0M7WUFDckMsRUFBRSxFQUFFLGdCQUFNLENBQUMsb0JBQW9CO1lBQy9CLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSwyRkFBMkYsQ0FBQztZQUMzSSxnQkFBZ0IsRUFBRSxLQUFLO1NBQ3ZCO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsMENBQTBDO1lBQy9DLEVBQUUsRUFBRSxnQkFBTSxDQUFDLDhCQUE4QjtZQUN6QyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsMkZBQTJGLENBQUM7WUFDM0ksZ0JBQWdCLEVBQUUsS0FBSztZQUN2QixRQUFRLEVBQUUsb0NBQW9DO1NBQzlDO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsc0NBQXNDO1lBQzNDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLHlCQUF5QjtZQUNwQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsOEhBQThILENBQUM7WUFDbkwsUUFBUSxFQUFFLDJCQUEyQjtTQUNyQztRQUNEO1lBQ0MsR0FBRyxFQUFFLHdCQUF3QjtZQUM3QixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxZQUFZO1lBQ3ZCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsb0NBQW9DLENBQUM7U0FDNUU7UUFDRDtZQUNDLEdBQUcsRUFBRSwwQkFBMEI7WUFDL0IsRUFBRSxFQUFFLGdCQUFNLENBQUMsY0FBYztZQUN6QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsb0ZBQW9GLENBQUM7WUFDOUgsZ0JBQWdCLEVBQUUsS0FBSztTQUN2QjtRQUNEO1lBQ0MsR0FBRyxFQUFFLHdDQUF3QztZQUM3QyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQywyQkFBMkI7WUFDdEMsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLHNJQUFzSSxDQUFDO1lBQ3ZMLFFBQVEsRUFBRSwyQkFBMkI7U0FDckM7UUFDRDtZQUNDLEdBQUcsRUFBRSxvQ0FBb0M7WUFDekMsRUFBRSxFQUFFLGdCQUFNLENBQUMseUJBQXlCO1lBQ3BDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSxrRUFBa0UsQ0FBQztZQUN2SCxRQUFRLEVBQUUsZ0NBQWdDO1NBQzFDO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsa0JBQWtCO1lBQ3ZCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGVBQWU7WUFDMUIsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLHVDQUF1QyxDQUFDO1NBQ2xGO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsdUJBQXVCO1lBQzVCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLG9CQUFvQjtZQUMvQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsOENBQThDLENBQUM7WUFDOUYsUUFBUSxFQUFFLHNCQUFzQjtTQUNoQztRQUNEO1lBQ0MsR0FBRyxFQUFFLHFCQUFxQjtZQUMxQixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxpQkFBaUI7WUFDNUIsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLDBDQUEwQyxDQUFDO1NBQ3hGO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsdUJBQXVCO1lBQzVCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLG1CQUFtQjtZQUM5QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsOENBQThDLENBQUM7U0FDOUY7UUFDRDtZQUNDLEdBQUcsRUFBRSxxQkFBcUI7WUFDMUIsRUFBRSxFQUFFLGdCQUFNLENBQUMsa0JBQWtCO1lBQzdCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSwwQ0FBMEMsQ0FBQztTQUN4RjtRQUNEO1lBQ0MsR0FBRyxFQUFFLHdCQUF3QjtZQUM3QixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxvQkFBb0I7WUFDL0IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLDZDQUE2QyxDQUFDO1NBQzlGO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsZ0JBQWdCO1lBQ3JCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGFBQWE7WUFDeEIsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLHFDQUFxQyxDQUFDO1lBQzlFLFFBQVEsRUFBRSxzQkFBc0I7U0FDaEM7UUFDRDtZQUNDLEdBQUcsRUFBRSxzQkFBc0I7WUFDM0IsRUFBRSxFQUFFLGdCQUFNLENBQUMsUUFBUTtZQUNuQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsZ0NBQWdDLENBQUM7U0FDL0U7UUFDRDtZQUNDLEdBQUcsRUFBRSxxQkFBcUI7WUFDMUIsRUFBRSxFQUFFLGdCQUFNLENBQUMsY0FBYztZQUN6QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsa0RBQWtELENBQUM7U0FDdEc7UUFDRDtZQUNDLEdBQUcsRUFBRSxxQkFBcUI7WUFDMUIsRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTtZQUMxQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsd0RBQXdELENBQUM7U0FDNUc7UUFDRDtZQUNDLEdBQUcsRUFBRSx5QkFBeUI7WUFDOUIsRUFBRSxFQUFFLGdCQUFNLENBQUMsa0JBQWtCO1lBQzdCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSw2RUFBNkUsQ0FBQztTQUNySTtRQUNEO1lBQ0MsR0FBRyxFQUFFLHlCQUF5QjtZQUM5QixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxrQkFBa0I7WUFDN0IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLCtCQUErQixFQUFFLGtEQUFrRCxDQUFDO1NBQzFHO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsbUJBQW1CO1lBQ3hCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGdCQUFnQjtZQUMzQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsNEJBQTRCLENBQUM7U0FDN0U7UUFDRDtZQUNDLEdBQUcsRUFBRSxnQkFBZ0I7WUFDckIsRUFBRSxFQUFFLGdCQUFNLENBQUMsYUFBYTtZQUN4QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsOEJBQThCLENBQUM7U0FDM0U7UUFDRDtZQUNDLEdBQUcsRUFBRSx1QkFBdUI7WUFDNUIsRUFBRSxFQUFFLGdCQUFNLENBQUMsbUJBQW1CO1lBQzlCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxxQ0FBcUMsQ0FBQztTQUNwRjtRQUNEO1lBQ0MsR0FBRyxFQUFFLG9CQUFvQjtZQUN6QixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxhQUFhO1lBQ3hCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxrQ0FBa0MsQ0FBQztTQUMvRTtRQUNEO1lBQ0MsR0FBRyxFQUFFLDBCQUEwQjtZQUMvQixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxrQkFBa0I7WUFDN0IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLHdDQUF3QyxDQUFDO1NBQzFGO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsd0JBQXdCO1lBQzdCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGdCQUFnQjtZQUMzQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsc0NBQXNDLENBQUM7U0FDdEY7UUFDRDtZQUNDLEdBQUcsRUFBRSxjQUFjO1lBQ25CLEVBQUUsRUFBRSxnQkFBTSxDQUFDLE9BQU87WUFDbEIsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxvRUFBb0UsQ0FBQztZQUMzRyxnQkFBZ0IsRUFBRSxLQUFLO1NBQ3ZCO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsaUJBQWlCO1lBQ3RCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGNBQWM7WUFDekIsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLDBCQUEwQixDQUFDO1NBQ3BFO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsWUFBWTtZQUNqQixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxZQUFZO1lBQ3ZCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUsaURBQWlELENBQUM7WUFDdkYsUUFBUSxFQUFFLGtCQUFrQjtTQUM1QjtRQUNEO1lBQ0MsR0FBRyxFQUFFLGtDQUFrQztZQUN2QyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyx3QkFBd0I7WUFDbkMsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLHlEQUF5RCxDQUFDO1lBQzdHLGdCQUFnQixFQUFFLEtBQUs7WUFDdkIsUUFBUSxFQUFFLDRCQUE0QjtTQUN0QztRQUNEO1lBQ0MsR0FBRyxFQUFFLDJCQUEyQjtZQUNoQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxpQkFBaUI7WUFDNUIsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLG1EQUFtRCxDQUFDO1lBQ2hHLGdCQUFnQixFQUFFLEtBQUs7WUFDdkIsUUFBUSxFQUFFLFlBQVk7U0FDdEI7UUFDRDtZQUNDLEdBQUcsRUFBRSxnQkFBZ0I7WUFDckIsRUFBRSxFQUFFLGdCQUFNLENBQUMsYUFBYTtZQUN4QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLHlEQUF5RCxDQUFDO1lBQ2pHLFFBQVEsRUFBRSwwQkFBMEI7U0FDcEM7UUFDRDtZQUNDLEdBQUcsRUFBRSwyQkFBMkI7WUFDaEMsRUFBRSxFQUFFLGdCQUFNLENBQUMsdUJBQXVCO1lBQ2xDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSxpREFBaUQsQ0FBQztTQUNuRztRQUNEO1lBQ0MsR0FBRyxFQUFFLDBCQUEwQjtZQUMvQixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyx1QkFBdUI7WUFDbEMsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLHdDQUF3QyxDQUFDO1lBQzFGLFFBQVEsRUFBRSx5QkFBeUI7U0FDbkM7UUFDRDtZQUNDLEdBQUcsRUFBRSxnQ0FBZ0M7WUFDckMsRUFBRSxFQUFFLGdCQUFNLENBQUMsMEJBQTBCO1lBQ3JDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSwrQ0FBK0MsQ0FBQztZQUN2RyxRQUFRLEVBQUUsNkJBQTZCO1NBQ3ZDO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsd0JBQXdCO1lBQzdCLEVBQUUsRUFBRSxnQkFBTSxDQUFDLHFCQUFxQjtZQUNoQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0NBQW9DLEVBQUUsdUNBQXVDLENBQUM7WUFDcEcsUUFBUSxFQUFFLHFDQUFxQztTQUMvQztRQUNEO1lBQ0MsR0FBRyxFQUFFLDZCQUE2QjtZQUNsQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQywwQkFBMEI7WUFDckMsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLHVDQUF1QyxDQUFDO1lBQ3BHLFFBQVEsRUFBRSxxQ0FBcUM7U0FDL0M7S0FDRCxDQUFDO0lBRUYsSUFBVSxNQUFNLENBc1VmO0lBdFVELFdBQVUsTUFBTTtRQUVmLHlDQUF5QztRQXFCekMsU0FBZ0IsVUFBVSxDQUFDLElBQXNEO1lBQ2hGLE9BQU8sT0FBUSxJQUE4QixDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUM7UUFDcEUsQ0FBQztRQUZlLGlCQUFVLGFBRXpCLENBQUE7UUFFRCxTQUFnQixlQUFlLENBQUMsSUFBMkIsRUFBRSxTQUFvQztZQUNoRyxJQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDdEMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsMERBQTBELEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDbEgsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLE9BQU8sSUFBSSxDQUFDLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDOUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsMkRBQTJELEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDM0csT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDaEQsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsMkRBQTJELEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDNUcsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDbEQsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsMkRBQTJELEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDN0csT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBbkJlLHNCQUFlLGtCQW1COUIsQ0FBQTtRQUVELFNBQWdCLGtCQUFrQixDQUFDLElBQThCLEVBQUUsU0FBb0M7WUFDdEcsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3RDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLDBEQUEwRCxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xILE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2hELFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLDJEQUEyRCxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQzVHLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2xELFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLDJEQUEyRCxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQzdHLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQWZlLHlCQUFrQixxQkFlakMsQ0FBQTtRQUVELFNBQWdCLFlBQVksQ0FBQyxLQUEyRCxFQUFFLFNBQW9DO1lBQzdILElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztnQkFDNUUsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDdEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQzt3QkFDdkMsT0FBTyxLQUFLLENBQUM7b0JBQ2QsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDO3dCQUMxQyxPQUFPLEtBQUssQ0FBQztvQkFDZCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBbkJlLG1CQUFZLGVBbUIzQixDQUFBO1FBRUQsU0FBZ0IsY0FBYyxDQUFDLE9BQTZCLEVBQUUsU0FBb0M7WUFDakcsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDakMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsaUNBQWlDLENBQUMsQ0FBQyxDQUFDO2dCQUN4RSxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLE9BQU8sT0FBTyxDQUFDLEVBQUUsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDcEMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsMERBQTBELEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDN0csT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsSUFBSSxPQUFPLE9BQU8sQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3ZDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLDBEQUEwRCxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ2hILE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQWhCZSxxQkFBYyxpQkFnQjdCLENBQUE7UUFFRCxNQUFNLFFBQVEsR0FBZ0I7WUFDN0IsSUFBSSxFQUFFLFFBQVE7WUFDZCxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUM7WUFDckIsVUFBVSxFQUFFO2dCQUNYLE9BQU8sRUFBRTtvQkFDUixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsK0NBQStDLEVBQUUsZ0dBQWdHLENBQUM7b0JBQ3hLLElBQUksRUFBRSxRQUFRO2lCQUNkO2dCQUNELEdBQUcsRUFBRTtvQkFDSixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkNBQTJDLEVBQUUsMkdBQTJHLENBQUM7b0JBQy9LLElBQUksRUFBRSxRQUFRO2lCQUNkO2dCQUNELElBQUksRUFBRTtvQkFDTCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsNENBQTRDLEVBQUUsZ0RBQWdELENBQUM7b0JBQ3JILElBQUksRUFBRSxRQUFRO2lCQUNkO2dCQUNELEtBQUssRUFBRTtvQkFDTixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkNBQTZDLEVBQUUsb0NBQW9DLENBQUM7b0JBQzFHLElBQUksRUFBRSxRQUFRO2lCQUNkO2FBQ0Q7U0FDRCxDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQWdCO1lBQ2hDLElBQUksRUFBRSxRQUFRO1lBQ2QsUUFBUSxFQUFFLENBQUMsU0FBUyxDQUFDO1lBQ3JCLFVBQVUsRUFBRTtnQkFDWCxPQUFPLEVBQUU7b0JBQ1IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLCtDQUErQyxFQUFFLG9EQUFvRCxDQUFDO29CQUM1SCxJQUFJLEVBQUUsUUFBUTtpQkFDZDtnQkFDRCxJQUFJLEVBQUU7b0JBQ0wsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDRDQUE0QyxFQUFFLGdEQUFnRCxDQUFDO29CQUNySCxJQUFJLEVBQUUsUUFBUTtpQkFDZDtnQkFDRCxLQUFLLEVBQUU7b0JBQ04sV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDZDQUE2QyxFQUFFLG9DQUFvQyxDQUFDO29CQUMxRyxJQUFJLEVBQUUsUUFBUTtpQkFDZDthQUNEO1NBQ0QsQ0FBQztRQUVGLE1BQU0sT0FBTyxHQUFnQjtZQUM1QixJQUFJLEVBQUUsUUFBUTtZQUNkLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUM7WUFDekIsVUFBVSxFQUFFO2dCQUNYLEVBQUUsRUFBRTtvQkFDSCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMseUNBQXlDLEVBQUUsaURBQWlELENBQUM7b0JBQ25ILElBQUksRUFBRSxRQUFRO2lCQUNkO2dCQUNELEtBQUssRUFBRTtvQkFDTixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsNENBQTRDLEVBQUUseURBQXlELENBQUM7b0JBQzlILElBQUksRUFBRSxRQUFRO2lCQUNkO2dCQUNELElBQUksRUFBRTtvQkFDTCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsMkNBQTJDLEVBQUUsT0FBTyxFQUFFLENBQUMsdUVBQXVFLENBQUMsRUFBRSxFQUFFLHdMQUF3TCxDQUFDO29CQUN6VixLQUFLLEVBQUUsQ0FBQzs0QkFDUCxJQUFJLEVBQUUsUUFBUTt5QkFDZDt3QkFDRDs0QkFDQyxJQUFJLEVBQUUsUUFBUTs0QkFDZCxVQUFVLEVBQUU7Z0NBQ1gsS0FBSyxFQUFFO29DQUNOLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxpREFBaUQsRUFBRSxzQ0FBc0MsQ0FBQztvQ0FDaEgsSUFBSSxFQUFFLFFBQVE7aUNBQ2Q7Z0NBQ0QsSUFBSSxFQUFFO29DQUNMLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxnREFBZ0QsRUFBRSxxQ0FBcUMsQ0FBQztvQ0FDOUcsSUFBSSxFQUFFLFFBQVE7aUNBQ2Q7NkJBQ0Q7eUJBQ0QsQ0FBQztpQkFDRjthQUNEO1NBQ0QsQ0FBQztRQUVXLHdCQUFpQixHQUFnQjtZQUM3QyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0NBQW9DLEVBQUUsc0NBQXNDLENBQUM7WUFDbkcsSUFBSSxFQUFFLFFBQVE7WUFDZCxVQUFVLEVBQUUsSUFBQSxjQUFLLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3RELG1CQUFtQixFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSw4REFBOEQsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQzdLLElBQUksRUFBRSxPQUFPO2dCQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxFQUFFO2FBQ3RGLENBQUMsQ0FBQztZQUNILG9CQUFvQixFQUFFO2dCQUNyQixXQUFXLEVBQUUsU0FBUztnQkFDdEIsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxFQUFFO2FBQ3pDO1NBQ0QsQ0FBQztRQUVXLDJCQUFvQixHQUFnQjtZQUNoRCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUNBQXVDLEVBQUUseUNBQXlDLENBQUM7WUFDekcsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsT0FBTztTQUNkLENBQUM7UUFlRixTQUFnQixjQUFjLENBQUMsT0FBNkIsRUFBRSxTQUFvQztZQUNqRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLElBQUEsNkJBQW1CLEVBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLDBEQUEwRCxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xILE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNoRSxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxZQUFZLENBQUMsRUFBRSxDQUFDO2dCQUNoRyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLElBQUksT0FBTyxPQUFPLENBQUMsVUFBVSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNsRSxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSwyREFBMkQsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUNwSCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUMxRixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBMUJlLHFCQUFjLGlCQTBCN0IsQ0FBQTtRQUVELFNBQVMsV0FBVyxDQUFDLElBQW1DLEVBQUUsU0FBb0M7WUFDN0YsSUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO2lCQUFNLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzVFLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLDZGQUE2RixDQUFDLENBQUMsQ0FBQztZQUNwSSxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxTQUFTLHNCQUFzQixDQUFDLFNBQW9DLEVBQUUsU0FBb0MsRUFBRSxZQUFvQjtZQUMvSCxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUN0QyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLHNFQUFzRSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBQ3pJLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztpQkFBTSxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsSUFBSSxJQUFBLDZCQUFtQixFQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQzVFLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLDBEQUEwRCxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBQ3JILE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztpQkFBTSxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsSUFBSSxDQUFDLElBQUEsNkJBQW1CLEVBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUEsNkJBQW1CLEVBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDL0gsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSx1RUFBdUUsRUFBRSxHQUFHLFlBQVksUUFBUSxFQUFFLEdBQUcsWUFBWSxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUMxSyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBZ0I7WUFDaEMsSUFBSSxFQUFFLFFBQVE7WUFDZCxRQUFRLEVBQUUsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDO1lBQzlCLFVBQVUsRUFBRTtnQkFDWCxPQUFPLEVBQUU7b0JBQ1IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGtEQUFrRCxFQUFFLHNDQUFzQyxDQUFDO29CQUNqSCxJQUFJLEVBQUUsUUFBUTtpQkFDZDtnQkFDRCxLQUFLLEVBQUU7b0JBQ04sV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGdEQUFnRCxFQUFFLHFEQUFxRCxDQUFDO29CQUM5SCxJQUFJLEVBQUUsUUFBUTtpQkFDZDtnQkFDRCxVQUFVLEVBQUU7b0JBQ1gsbUJBQW1CLEVBQUUsSUFBQSxjQUFRLEVBQUMscURBQXFELEVBQUUsdUtBQXVLLENBQUM7b0JBQzdQLElBQUksRUFBRSxRQUFRO2lCQUNkO2dCQUNELFFBQVEsRUFBRTtvQkFDVCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsbURBQW1ELEVBQUUsc0VBQXNFLENBQUM7b0JBQ2xKLElBQUksRUFBRSxRQUFRO2lCQUNkO2dCQUNELFVBQVUsRUFBRTtvQkFDWCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdURBQXVELEVBQUUsdUxBQXVMLENBQUM7b0JBQ3ZRLElBQUksRUFBRSxRQUFRO2lCQUNkO2dCQUNELElBQUksRUFBRTtvQkFDTCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsK0NBQStDLEVBQUUsT0FBTyxFQUFFLENBQUMsdUVBQXVFLENBQUMsRUFBRSxFQUFFLHdMQUF3TCxDQUFDO29CQUM3VixLQUFLLEVBQUUsQ0FBQzs0QkFDUCxJQUFJLEVBQUUsUUFBUTt5QkFDZDt3QkFDRDs0QkFDQyxJQUFJLEVBQUUsUUFBUTs0QkFDZCxVQUFVLEVBQUU7Z0NBQ1gsS0FBSyxFQUFFO29DQUNOLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxxREFBcUQsRUFBRSxzQ0FBc0MsQ0FBQztvQ0FDcEgsSUFBSSxFQUFFLFFBQVE7aUNBQ2Q7Z0NBQ0QsSUFBSSxFQUFFO29DQUNMLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxvREFBb0QsRUFBRSxxQ0FBcUMsQ0FBQztvQ0FDbEgsSUFBSSxFQUFFLFFBQVE7aUNBQ2Q7NkJBQ0Q7eUJBQ0QsQ0FBQztpQkFDRjthQUNEO1NBQ0QsQ0FBQztRQUVXLDJCQUFvQixHQUFnQjtZQUNoRCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUNBQXVDLEVBQUUsOENBQThDLENBQUM7WUFDOUcsS0FBSyxFQUFFO2dCQUNOLFdBQVc7Z0JBQ1g7b0JBQ0MsSUFBSSxFQUFFLE9BQU87b0JBQ2IsS0FBSyxFQUFFLFdBQVc7aUJBQ2xCO2FBQ0Q7U0FDRCxDQUFDO0lBQ0gsQ0FBQyxFQXRVUyxNQUFNLEtBQU4sTUFBTSxRQXNVZjtJQUVELE1BQU0scUJBQXFCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7SUFFdkMsUUFBQSxzQkFBc0IsR0FBRyx1Q0FBa0IsQ0FBQyxzQkFBc0IsQ0FBOEQ7UUFDNUksY0FBYyxFQUFFLFVBQVU7UUFDMUIsVUFBVSxFQUFFLE1BQU0sQ0FBQyxvQkFBb0I7UUFDdkMseUJBQXlCLEVBQUUsQ0FBQyxRQUF1QyxFQUFFLE1BQW9DLEVBQUUsRUFBRTtZQUM1RyxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDckIsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCw4QkFBc0IsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUU7UUFFOUMsU0FBUyxhQUFhLENBQUMsbUJBQWdELEVBQUUsU0FBbUM7WUFFM0csSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RFLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLEdBQUcsbUJBQW1CLENBQUM7WUFFdkYsSUFBSSxZQUFnRSxDQUFDO1lBQ3JFLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDOUIsWUFBWSxHQUFHLHFCQUFTLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBRXBNLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxZQUFZLEdBQUc7d0JBQ2QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDO3dCQUM1RSxLQUFLLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxLQUFLLENBQUM7cUJBQzlFLENBQUM7Z0JBQ0gsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLFdBQVcsR0FBRyxzQkFBWSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyRCxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDeEIsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLCtDQUErQyxFQUFFLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNLLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsa0NBQWtDLEVBQUUsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDN0csQ0FBQztZQUNGLENBQUM7WUFDRCxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsc0JBQVksQ0FBQyxVQUFVLENBQUM7Z0JBQ2pELEVBQUUsRUFBRSxPQUFPO2dCQUNYLEtBQUs7Z0JBQ0wsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLFdBQVcsQ0FBQyxXQUFXLElBQUksU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUU7Z0JBQzlILFVBQVU7Z0JBQ1YsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsUUFBUTtnQkFDUixZQUFZLEVBQUUsMkJBQWMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDO2dCQUNwRCxJQUFJLEVBQUUsWUFBWTthQUNsQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCw0Q0FBNEM7UUFDNUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFOUIsS0FBSyxNQUFNLFNBQVMsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNwQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMxQixLQUFLLE1BQU0sT0FBTyxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUM3QixhQUFhLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLGFBQWEsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDakMsQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQztJQVFILE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO0lBRXhELE1BQU0sc0JBQXNCLEdBQUcsdUNBQWtCLENBQUMsc0JBQXNCLENBQWdDO1FBQ3ZHLGNBQWMsRUFBRSxVQUFVO1FBQzFCLFVBQVUsRUFBRSxNQUFNLENBQUMsb0JBQW9CO0tBQ3ZDLENBQUMsQ0FBQztJQUVILHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUU5QyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFbEIsS0FBSyxNQUFNLFNBQVMsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNwQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxHQUFHLFNBQVMsQ0FBQztZQUV2QyxLQUFLLE1BQU0sQ0FBQyxFQUFFLFdBQVcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFFckQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUM7b0JBQ3BELFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUNyQixTQUFTLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLHlDQUF5QyxFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUM1RyxTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUNuQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLHNEQUFzRCxFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUMzSCxTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDeEIsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSxvQ0FBb0MsRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDN0csU0FBUztnQkFDVixDQUFDO2dCQUVELElBQUksWUFBZ0UsQ0FBQztnQkFDckUsSUFBSSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3RCLElBQUksT0FBTyxXQUFXLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUMxQyxZQUFZLEdBQUcscUJBQVMsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDbEosQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLFlBQVksR0FBRzs0QkFDZCxJQUFJLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDOzRCQUN4RixLQUFLLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO3lCQUMxRixDQUFDO29CQUNILENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLElBQUksR0FBdUI7b0JBQ2hDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLFdBQVcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDdkMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxLQUFLO29CQUN4QixJQUFJLEVBQUUsWUFBWTtpQkFDbEIsQ0FBQztnQkFFRixTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6RSxNQUFNLGtCQUFrQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO0lBQ2pELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQXNELENBQUM7SUFFeEYsTUFBTSxtQkFBbUIsR0FBRyx1Q0FBa0IsQ0FBQyxzQkFBc0IsQ0FBd0Y7UUFDNUosY0FBYyxFQUFFLE9BQU87UUFDdkIsVUFBVSxFQUFFLE1BQU0sQ0FBQyxpQkFBaUI7UUFDcEMsSUFBSSxFQUFFLENBQUMsc0JBQXNCLENBQUM7S0FDOUIsQ0FBQyxDQUFDO0lBRUgsbUJBQW1CLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBRTNDLHlDQUF5QztRQUN6QyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMzQixpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUUxQixLQUFLLE1BQU0sU0FBUyxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEdBQUcsU0FBUyxDQUFDO1lBRXZDLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDL0MsU0FBUztnQkFDVixDQUFDO2dCQUVELElBQUksSUFBSSxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXhDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUV4QyxJQUFJLE9BQU8sRUFBRSxDQUFDO3dCQUNiLElBQUksR0FBRzs0QkFDTixHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQzs0QkFDYixFQUFFLEVBQUUsT0FBTyxDQUFDLEVBQUU7NEJBQ2QsV0FBVyxFQUFFLEVBQUU7eUJBQ2YsQ0FBQztvQkFDSCxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxJQUFBLGlDQUFvQixFQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ2xGLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsaU5BQWlOLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDclUsU0FBUztnQkFDVixDQUFDO2dCQUVELEtBQUssTUFBTSxRQUFRLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLElBQUksSUFBOEIsQ0FBQztvQkFFbkMsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7d0JBQ2pDLE1BQU0sT0FBTyxHQUFHLHNCQUFZLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDMUQsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsSUFBSSxzQkFBWSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksU0FBUyxDQUFDO3dCQUUvRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7NEJBQ2QsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxzRkFBc0YsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzs0QkFDdkosU0FBUzt3QkFDVixDQUFDO3dCQUNELElBQUksUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDOzRCQUMxQixTQUFTLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLDJGQUEyRixFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUMzSixDQUFDO3dCQUNELElBQUksUUFBUSxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQ3ZDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLGtFQUFrRSxDQUFDLENBQUMsQ0FBQzt3QkFDOUcsQ0FBQzt3QkFFRCxJQUFJLEdBQUcsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUM7b0JBQzlFLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxLQUFLLEVBQUUsQ0FBQzs0QkFDckMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSwrRUFBK0UsQ0FBQyxDQUFDLENBQUM7NEJBQzNJLFNBQVM7d0JBQ1YsQ0FBQzt3QkFFRCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFFaEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDOzRCQUNkLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsc0ZBQXNGLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7NEJBQ3ZKLFNBQVM7d0JBQ1YsQ0FBQzt3QkFFRCxJQUFJLG9CQUFvQixHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUU3RCxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQzs0QkFDM0Isb0JBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQzs0QkFDakMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLG9CQUFvQixDQUFDLENBQUM7d0JBQ3pELENBQUM7d0JBRUQsSUFBSSxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDOzRCQUM3QyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLDhEQUE4RCxFQUFFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDOUksU0FBUzt3QkFDVixDQUFDO3dCQUVELG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUV4QyxJQUFJLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDO29CQUMvSCxDQUFDO29CQUVELElBQUksUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNwQixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDNUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7NEJBQzNDLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQzt3QkFDbEUsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQzt3QkFDN0IsQ0FBQztvQkFDRixDQUFDO29CQUVELElBQUksQ0FBQyxJQUFJLEdBQUcsMkJBQWMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN0RCxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsc0JBQVksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQztJQUVILElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7UUFJN0MsWUFDcUIsa0JBQXVEO1lBQ3hFLEtBQUssRUFBRSxDQUFDO1lBRDBCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFIbkUsU0FBSSxHQUFHLE9BQU8sQ0FBQztRQUlYLENBQUM7UUFFZCxZQUFZLENBQUMsUUFBNEI7WUFDeEMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUM7UUFDekMsQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUE0QjtZQUNsQyxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLFFBQVEsSUFBSSxFQUFFLENBQUM7WUFDekQsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3RDLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTztnQkFDYixLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUs7Z0JBQ2QsV0FBVyxFQUFFLEVBQTBCO2dCQUN2QyxLQUFLLEVBQUUsRUFBYzthQUNyQixDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sSUFBSSxHQUFHLElBQUEsY0FBSyxFQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUV4QyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUM7WUFFaEQsS0FBSyxNQUFNLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDN0IsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDbkMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2xCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQ2pDLElBQUksT0FBTyxFQUFFLENBQUM7NEJBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzdCLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxPQUFPLEdBQUcsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzs0QkFDN0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUM7NEJBQzNCLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQ3hCLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFFMUwsY0FBYyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRTtnQkFDdEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUV6RCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ2pCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUUxQyxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNiLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxHQUFHLEVBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUM7b0JBQ3pGLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDO29CQUMzQixRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN4QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN0QixPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2hFLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRztnQkFDZixJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsSUFBSSxDQUFDO2dCQUM5QixJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsT0FBTyxDQUFDO2dCQUNsQyxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxvQkFBb0IsQ0FBQztnQkFDcEQsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQzthQUN6QyxDQUFDO1lBRUYsTUFBTSxJQUFJLEdBQWlCLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQzFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDZCxPQUFPO29CQUNOLElBQUksNEJBQWMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQztvQkFDeEQsT0FBTyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLO29CQUN2RSxPQUFPLENBQUMsV0FBVztvQkFDbkIsSUFBSSw0QkFBYyxFQUFFLENBQUMsY0FBYyxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7aUJBQ2pHLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU87Z0JBQ04sSUFBSSxFQUFFO29CQUNMLE9BQU87b0JBQ1AsSUFBSTtpQkFDSjtnQkFDRCxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQzthQUNsQixDQUFDO1FBQ0gsQ0FBQztRQUVPLGlCQUFpQixDQUFDLGFBQTBCO1lBQ25ELElBQUksR0FBdUIsQ0FBQztZQUU1QixRQUFRLGtCQUFRLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxPQUFPO29CQUFFLEdBQUcsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDO29CQUFDLE1BQU07Z0JBQzdDLEtBQUssT0FBTztvQkFBRSxHQUFHLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQztvQkFBQyxNQUFNO2dCQUMvQyxLQUFLLFFBQVE7b0JBQUUsR0FBRyxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUM7b0JBQUMsTUFBTTtZQUMvQyxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxJQUFJLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRixDQUFDO0tBRUQsQ0FBQTtJQXRHSyxxQkFBcUI7UUFLeEIsV0FBQSwrQkFBa0IsQ0FBQTtPQUxmLHFCQUFxQixDQXNHMUI7SUFFRCxtQkFBUSxDQUFDLEVBQUUsQ0FBNkIsOEJBQTJCLENBQUMseUJBQXlCLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQztRQUN2SCxFQUFFLEVBQUUsVUFBVTtRQUNkLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO1FBQ3ZDLE1BQU0sRUFBRTtZQUNQLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsUUFBUSxFQUFFLElBQUksNEJBQWMsQ0FBQyxxQkFBcUIsQ0FBQztLQUNuRCxDQUFDLENBQUMifQ==