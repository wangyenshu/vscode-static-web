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
define(["require", "exports", "vs/base/common/async", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/hover/browser/hover", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/notebook/browser/contrib/notebookVariables/notebookVariablesDataSource", "vs/workbench/contrib/notebook/browser/contrib/notebookVariables/notebookVariablesTree", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/editor/common/editorService"], function (require, exports, async_1, nls, menuEntryActionViewItem_1, actions_1, commands_1, configuration_1, contextkey_1, contextView_1, hover_1, instantiation_1, keybinding_1, listService_1, opener_1, quickInput_1, telemetry_1, themeService_1, viewPane_1, views_1, debug_1, notebookVariablesDataSource_1, notebookVariablesTree_1, notebookBrowser_1, notebookExecutionStateService_1, notebookKernelService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookVariablesView = void 0;
    let NotebookVariablesView = class NotebookVariablesView extends viewPane_1.ViewPane {
        static { this.ID = 'notebookVariablesView'; }
        static { this.TITLE = nls.localize2('notebook.notebookVariables', "Notebook Variables"); }
        constructor(options, editorService, notebookKernelService, notebookExecutionStateService, keybindingService, contextMenuService, contextKeyService, configurationService, instantiationService, viewDescriptorService, openerService, quickInputService, commandService, themeService, telemetryService, hoverService, menuService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, hoverService);
            this.editorService = editorService;
            this.notebookKernelService = notebookKernelService;
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.menuService = menuService;
            this._register(this.editorService.onDidActiveEditorChange(this.handleActiveEditorChange.bind(this)));
            this._register(this.notebookKernelService.onDidNotebookVariablesUpdate(this.handleVariablesChanged.bind(this)));
            this._register(this.notebookExecutionStateService.onDidChangeExecution(this.handleExecutionStateChange.bind(this)));
            this.setActiveNotebook();
            this.dataSource = new notebookVariablesDataSource_1.NotebookVariableDataSource(this.notebookKernelService);
            this.updateScheduler = new async_1.RunOnceScheduler(() => this.tree?.updateChildren(), 100);
        }
        renderBody(container) {
            super.renderBody(container);
            this.element.classList.add('debug-pane');
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'notebookVariablesTree', container, new notebookVariablesTree_1.NotebookVariablesDelegate(), [new notebookVariablesTree_1.NotebookVariableRenderer(this.hoverService)], this.dataSource, {
                accessibilityProvider: new notebookVariablesTree_1.NotebookVariableAccessibilityProvider(),
                identityProvider: { getId: (e) => e.id },
            });
            this.tree.layout();
            if (this.activeNotebook) {
                this.tree.setInput({ kind: 'root', notebook: this.activeNotebook });
            }
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
        }
        onContextMenu(e) {
            if (!e.element) {
                return;
            }
            const element = e.element;
            const arg = {
                source: element.notebook.uri.toString(),
                name: element.name,
                value: element.value,
                type: element.type,
                expression: element.expression,
                language: element.language,
                extensionId: element.extensionId
            };
            const actions = [];
            const overlayedContext = this.contextKeyService.createOverlay([
                [debug_1.CONTEXT_VARIABLE_NAME.key, element.name],
                [debug_1.CONTEXT_VARIABLE_VALUE.key, element.value],
                [debug_1.CONTEXT_VARIABLE_TYPE.key, element.type],
                [debug_1.CONTEXT_VARIABLE_INTERFACES.key, element.interfaces],
                [debug_1.CONTEXT_VARIABLE_LANGUAGE.key, element.language],
                [debug_1.CONTEXT_VARIABLE_EXTENSIONID.key, element.extensionId]
            ]);
            const menu = this.menuService.createMenu(actions_1.MenuId.NotebookVariablesContext, overlayedContext);
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { arg, shouldForwardArgs: true }, actions);
            menu.dispose();
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions
            });
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree?.layout(height, width);
        }
        setActiveNotebook() {
            const current = this.activeNotebook;
            const activeEditorPane = this.editorService.activeEditorPane;
            if (activeEditorPane?.getId() === 'workbench.editor.notebook' || activeEditorPane?.getId() === 'workbench.editor.interactive') {
                const notebookDocument = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(activeEditorPane)?.getViewModel()?.notebookDocument;
                this.activeNotebook = notebookDocument;
            }
            return current !== this.activeNotebook;
        }
        handleActiveEditorChange() {
            if (this.setActiveNotebook() && this.activeNotebook) {
                this.tree?.setInput({ kind: 'root', notebook: this.activeNotebook });
                this.updateScheduler.schedule();
            }
        }
        handleExecutionStateChange(event) {
            if (this.activeNotebook) {
                if (event.affectsNotebook(this.activeNotebook.uri)) {
                    // new execution state means either new variables or the kernel is busy so we shouldn't ask
                    this.dataSource.cancel();
                    // changed === undefined -> excecution ended
                    if (event.changed === undefined) {
                        this.updateScheduler.schedule();
                    }
                    else {
                        this.updateScheduler.cancel();
                    }
                }
            }
        }
        handleVariablesChanged(notebookUri) {
            if (this.activeNotebook && notebookUri.toString() === this.activeNotebook.uri.toString()) {
                this.tree?.setInput({ kind: 'root', notebook: this.activeNotebook });
                this.updateScheduler.schedule();
            }
        }
    };
    exports.NotebookVariablesView = NotebookVariablesView;
    exports.NotebookVariablesView = NotebookVariablesView = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, views_1.IViewDescriptorService),
        __param(10, opener_1.IOpenerService),
        __param(11, quickInput_1.IQuickInputService),
        __param(12, commands_1.ICommandService),
        __param(13, themeService_1.IThemeService),
        __param(14, telemetry_1.ITelemetryService),
        __param(15, hover_1.IHoverService),
        __param(16, actions_1.IMenuService)
    ], NotebookVariablesView);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWYXJpYWJsZXNWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL25vdGVib29rVmFyaWFibGVzL25vdGVib29rVmFyaWFibGVzVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQ3pGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsbUJBQVE7aUJBRWxDLE9BQUUsR0FBRyx1QkFBdUIsQUFBMUIsQ0FBMkI7aUJBQzdCLFVBQUssR0FBcUIsR0FBRyxDQUFDLFNBQVMsQ0FBQyw0QkFBNEIsRUFBRSxvQkFBb0IsQ0FBQyxBQUF0RixDQUF1RjtRQVE1RyxZQUNDLE9BQXlCLEVBQ1EsYUFBNkIsRUFDckIscUJBQTZDLEVBQ3JDLDZCQUE2RCxFQUMxRixpQkFBcUMsRUFDcEMsa0JBQXVDLEVBQ3hDLGlCQUFxQyxFQUNsQyxvQkFBMkMsRUFDM0Msb0JBQTJDLEVBQzFDLHFCQUE2QyxFQUNyRCxhQUE2QixFQUNmLGlCQUFxQyxFQUN4QyxjQUErQixFQUMzQyxZQUEyQixFQUN2QixnQkFBbUMsRUFDdkMsWUFBMkIsRUFDWCxXQUF5QjtZQUV4RCxLQUFLLENBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLG9CQUFvQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFqQnhLLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUNyQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ3JDLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFRaEYsc0JBQWlC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