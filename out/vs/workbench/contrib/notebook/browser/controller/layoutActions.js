/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/uri", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/common/preferences"], function (require, exports, codicons_1, uri_1, nls_1, actionCommonCategories_1, actions_1, commands_1, configuration_1, contextkey_1, quickInput_1, coreActions_1, notebookBrowser_1, notebookEditorService_1, notebookCommon_1, notebookContextKeys_1, notebookService_1, editorService_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(class NotebookConfigureLayoutAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.select',
                title: (0, nls_1.localize2)('workbench.notebook.layout.select.label', "Select between Notebook Layouts"),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.openGettingStarted}`, true),
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        group: 'notebookLayout',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true), contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.openGettingStarted}`, true)),
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        group: 'notebookLayout',
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true), contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.openGettingStarted}`, true)),
                        order: 0
                    }
                ]
            });
        }
        run(accessor) {
            accessor.get(commands_1.ICommandService).executeCommand('workbench.action.openWalkthrough', { category: 'notebooks', step: 'notebookProfile' }, true);
        }
    });
    (0, actions_1.registerAction2)(class NotebookConfigureLayoutAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.configure',
                title: (0, nls_1.localize2)('workbench.notebook.layout.configure.label', "Customize Notebook Layout"),
                f1: true,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        group: 'notebookLayout',
                        when: contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true),
                        order: 1
                    }
                ]
            });
        }
        run(accessor) {
            accessor.get(preferences_1.IPreferencesService).openSettings({ jsonEditor: false, query: '@tag:notebookLayout' });
        }
    });
    (0, actions_1.registerAction2)(class NotebookConfigureLayoutFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.configure.editorTitle',
                title: (0, nls_1.localize2)('workbench.notebook.layout.configure.label', "Customize Notebook Layout"),
                f1: false,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayout',
                        when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
                        order: 1
                    }
                ]
            });
        }
        run(accessor) {
            accessor.get(preferences_1.IPreferencesService).openSettings({ jsonEditor: false, query: '@tag:notebookLayout' });
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        submenu: actions_1.MenuId.NotebookEditorLayoutConfigure,
        rememberDefaultAction: false,
        title: (0, nls_1.localize2)('customizeNotebook', "Customize Notebook..."),
        icon: codicons_1.Codicon.gear,
        group: 'navigation',
        order: -1,
        when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR
    });
    (0, actions_1.registerAction2)(class ToggleLineNumberFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.toggleLineNumbersFromEditorTitle',
                title: (0, nls_1.localize2)('notebook.toggleLineNumbers', 'Toggle Notebook Line Numbers'),
                precondition: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayoutDetails',
                        order: 1,
                        when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR
                    }
                ],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.notEquals('config.notebook.lineNumbers', 'off'),
                    title: (0, nls_1.localize)('notebook.showLineNumbers', "Notebook Line Numbers"),
                }
            });
        }
        async run(accessor) {
            return accessor.get(commands_1.ICommandService).executeCommand('notebook.toggleLineNumbers');
        }
    });
    (0, actions_1.registerAction2)(class ToggleCellToolbarPositionFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.toggleCellToolbarPositionFromEditorTitle',
                title: (0, nls_1.localize2)('notebook.toggleCellToolbarPosition', 'Toggle Cell Toolbar Position'),
                menu: [{
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayoutDetails',
                        order: 3
                    }],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: false
            });
        }
        async run(accessor, ...args) {
            return accessor.get(commands_1.ICommandService).executeCommand('notebook.toggleCellToolbarPosition', ...args);
        }
    });
    (0, actions_1.registerAction2)(class ToggleBreadcrumbFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'breadcrumbs.toggleFromEditorTitle',
                title: (0, nls_1.localize2)('notebook.toggleBreadcrumb', 'Toggle Breadcrumbs'),
                menu: [{
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayoutDetails',
                        order: 2
                    }],
                f1: false
            });
        }
        async run(accessor) {
            return accessor.get(commands_1.ICommandService).executeCommand('breadcrumbs.toggle');
        }
    });
    (0, actions_1.registerAction2)(class SaveMimeTypeDisplayOrder extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.saveMimeTypeOrder',
                title: (0, nls_1.localize2)('notebook.saveMimeTypeOrder', "Save Mimetype Display Order"),
                f1: true,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                precondition: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
            });
        }
        run(accessor) {
            const service = accessor.get(notebookService_1.INotebookService);
            const qp = accessor.get(quickInput_1.IQuickInputService).createQuickPick();
            qp.placeholder = (0, nls_1.localize)('notebook.placeholder', 'Settings file to save in');
            qp.items = [
                { target: 2 /* ConfigurationTarget.USER */, label: (0, nls_1.localize)('saveTarget.machine', 'User Settings') },
                { target: 5 /* ConfigurationTarget.WORKSPACE */, label: (0, nls_1.localize)('saveTarget.workspace', 'Workspace Settings') },
            ];
            qp.onDidAccept(() => {
                const target = qp.selectedItems[0]?.target;
                if (target !== undefined) {
                    service.saveMimeDisplayOrder(target);
                }
                qp.dispose();
            });
            qp.onDidHide(() => qp.dispose());
            qp.show();
        }
    });
    (0, actions_1.registerAction2)(class NotebookWebviewResetAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.webview.reset',
                title: (0, nls_1.localize2)('workbench.notebook.layout.webview.reset.label', "Reset Notebook Webview"),
                f1: false,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY
            });
        }
        run(accessor, args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            if (args) {
                const uri = uri_1.URI.revive(args);
                const notebookEditorService = accessor.get(notebookEditorService_1.INotebookEditorService);
                const widgets = notebookEditorService.listNotebookEditors().filter(widget => widget.hasModel() && widget.textModel.uri.toString() === uri.toString());
                for (const widget of widgets) {
                    if (widget.hasModel()) {
                        widget.getInnerWebview()?.reload();
                    }
                }
            }
            else {
                const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
                if (!editor) {
                    return;
                }
                editor.getInnerWebview()?.reload();
            }
        }
    });
    (0, actions_1.registerAction2)(class ToggleNotebookStickyScroll extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.action.toggleNotebookStickyScroll',
                title: {
                    ...(0, nls_1.localize2)('toggleStickyScroll', "Toggle Notebook Sticky Scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mitoggleNotebookStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Toggle Notebook Sticky Scroll"),
                },
                category: actionCommonCategories_1.Categories.View,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.equals('config.notebook.stickyScroll.enabled', true),
                    title: (0, nls_1.localize)('notebookStickyScroll', "Toggle Notebook Sticky Scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mitoggleNotebookStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Toggle Notebook Sticky Scroll"),
                },
                menu: [
                    { id: actions_1.MenuId.CommandPalette },
                    {
                        id: actions_1.MenuId.NotebookStickyScrollContext,
                        group: 'notebookView',
                        order: 2
                    }
                ]
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('notebook.stickyScroll.enabled');
            return configurationService.updateValue('notebook.stickyScroll.enabled', newValue);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJvbGxlci9sYXlvdXRBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBcUJoRyxJQUFBLHlCQUFlLEVBQUMsTUFBTSw2QkFBOEIsU0FBUSxpQkFBTztRQUNsRTtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsa0NBQWtDO2dCQUN0QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsd0NBQXdDLEVBQUUsaUNBQWlDLENBQUM7Z0JBQzdGLEVBQUUsRUFBRSxJQUFJO2dCQUNSLFlBQVksRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyxVQUFVLGdDQUFlLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxJQUFJLENBQUM7Z0JBQ3pGLFFBQVEsRUFBRSx1Q0FBeUI7Z0JBQ25DLElBQUksRUFBRTtvQkFDTDt3QkFDQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxXQUFXO3dCQUN0QixLQUFLLEVBQUUsZ0JBQWdCO3dCQUN2QixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQ3ZCLCtDQUF5QixFQUN6QiwyQkFBYyxDQUFDLFNBQVMsQ0FBQywrQkFBK0IsRUFBRSxJQUFJLENBQUMsRUFDL0QsMkJBQWMsQ0FBQyxNQUFNLENBQUMsVUFBVSxnQ0FBZSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsSUFBSSxDQUFDLENBQzNFO3dCQUNELEtBQUssRUFBRSxDQUFDO3FCQUNSO29CQUNEO3dCQUNDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGVBQWU7d0JBQzFCLEtBQUssRUFBRSxnQkFBZ0I7d0JBQ3ZCLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FDdkIsMkJBQWMsQ0FBQyxNQUFN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