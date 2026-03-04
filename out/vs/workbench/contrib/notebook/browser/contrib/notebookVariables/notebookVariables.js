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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/notebook/browser/contrib/notebookVariables/notebookVariableContextKeys", "vs/workbench/contrib/notebook/browser/contrib/notebookVariables/notebookVariablesView", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorService"], function (require, exports, lifecycle_1, nls, configuration_1, contextkey_1, descriptors_1, platform_1, views_1, debug_1, notebookVariableContextKeys_1, notebookVariablesView_1, notebookBrowser_1, notebookIcons_1, notebookCommon_1, notebookExecutionStateService_1, notebookKernelService_1, notebookService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookVariables = void 0;
    let NotebookVariables = class NotebookVariables extends lifecycle_1.Disposable {
        constructor(contextKeyService, configurationService, editorService, notebookExecutionStateService, notebookKernelService, notebookDocumentService) {
            super();
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.notebookKernelService = notebookKernelService;
            this.notebookDocumentService = notebookDocumentService;
            this.listeners = [];
            this.initialized = false;
            this.viewEnabled = notebookVariableContextKeys_1.NOTEBOOK_VARIABLE_VIEW_ENABLED.bindTo(contextKeyService);
            this.listeners.push(this.editorService.onDidActiveEditorChange(() => this.handleInitEvent()));
            this.listeners.push(this.notebookExecutionStateService.onDidChangeExecution((e) => this.handleInitEvent(e.notebook)));
            this.configListener = configurationService.onDidChangeConfiguration((e) => this.handleConfigChange(e));
        }
        handleConfigChange(e) {
            if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.notebookVariablesView)) {
                if (!this.configurationService.getValue(notebookCommon_1.NotebookSetting.notebookVariablesView)) {
                    this.viewEnabled.set(false);
                }
                else if (this.initialized) {
                    this.viewEnabled.set(true);
                }
                else {
                    this.handleInitEvent();
                }
            }
        }
        handleInitEvent(notebook) {
            if (this.configurationService.getValue(notebookCommon_1.NotebookSetting.notebookVariablesView)
                && (!!notebook || this.editorService.activeEditorPane?.getId() === 'workbench.editor.notebook')) {
                if (this.hasVariableProvider(notebook) && !this.initialized && this.initializeView()) {
                    this.viewEnabled.set(true);
                    this.initialized = true;
                    this.listeners.forEach(listener => listener.dispose());
                }
            }
        }
        hasVariableProvider(notebookUri) {
            const notebook = notebookUri ?
                this.notebookDocumentService.getNotebookTextModel(notebookUri) :
                (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this.editorService.activeEditorPane)?.getViewModel()?.notebookDocument;
            return notebook && this.notebookKernelService.getMatchingKernel(notebook).selected?.hasVariableProvider;
        }
        initializeView() {
            const debugViewContainer = platform_1.Registry.as('workbench.registry.view.containers').get(debug_1.VIEWLET_ID);
            if (debugViewContainer) {
                const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
                const viewDescriptor = {
                    id: 'NOTEBOOK_VARIABLES', name: nls.localize2('notebookVariables', "Notebook Variables"),
                    containerIcon: notebookIcons_1.variablesViewIcon, ctorDescriptor: new descriptors_1.SyncDescriptor(notebookVariablesView_1.NotebookVariablesView),
                    order: 50, weight: 5, canToggleVisibility: true, canMoveView: true, collapsed: true, when: notebookVariableContextKeys_1.NOTEBOOK_VARIABLE_VIEW_ENABLED,
                };
                viewsRegistry.registerViews([viewDescriptor], debugViewContainer);
                return true;
            }
            return false;
        }
        dispose() {
            super.dispose();
            this.listeners.forEach(listener => listener.dispose());
            this.configListener.dispose();
        }
    };
    exports.NotebookVariables = NotebookVariables;
    exports.NotebookVariables = NotebookVariables = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, editorService_1.IEditorService),
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(4, notebookKernelService_1.INotebookKernelService),
        __param(5, notebookService_1.INotebookService)
    ], NotebookVariables);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWYXJpYWJsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvbm90ZWJvb2tWYXJpYWJsZXMvbm90ZWJvb2tWYXJpYWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0J6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHNCQUFVO1FBT2hELFlBQ3FCLGlCQUFxQyxFQUNsQyxvQkFBNEQsRUFDbkUsYUFBOEMsRUFDOUIsNkJBQThFLEVBQ3RGLHFCQUE4RCxFQUNwRSx1QkFBMEQ7WUFFNUUsS0FBSyxFQUFFLENBQUM7WUFOZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNsRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDYixrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1lBQ3JFLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDbkQsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUFrQjtZQVpyRSxjQUFTLEdBQWtCLEVBQUUsQ0FBQztZQUU5QixnQkFBVyxHQUFHLEtBQUssQ0FBQztZQWMzQixJQUFJLENBQUMsV0FBVyxHQUFHLDREQUE4QixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRTVFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFB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