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
define(["require", "exports", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/common/actions", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/base/common/themables", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/browser/viewParts/notebookKernelQuickPickStrategy", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/editor/common/editorService"], function (require, exports, actionViewItems_1, actions_1, nls_1, actions_2, contextkey_1, extensions_1, instantiation_1, themables_1, coreActions_1, notebookBrowser_1, notebookIcons_1, notebookKernelQuickPickStrategy_1, notebookContextKeys_1, notebookKernelService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebooKernelActionViewItem = void 0;
    function getEditorFromContext(editorService, context) {
        let editor;
        if (context !== undefined && 'notebookEditorId' in context) {
            const editorId = context.notebookEditorId;
            const matchingEditor = editorService.visibleEditorPanes.find((editorPane) => {
                const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorPane);
                return notebookEditor?.getId() === editorId;
            });
            editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(matchingEditor);
        }
        else if (context !== undefined && 'notebookEditor' in context) {
            editor = context?.notebookEditor;
        }
        else {
            editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
        }
        return editor;
    }
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: coreActions_1.SELECT_KERNEL_ID,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                title: (0, nls_1.localize2)('notebookActions.selectKernel', 'Select Notebook Kernel'),
                icon: notebookIcons_1.selectKernelIcon,
                f1: true,
                precondition: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
                menu: [{
                        id: actions_2.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true)),
                        group: 'navigation',
                        order: -10
                    }, {
                        id: actions_2.MenuId.NotebookToolbar,
                        when: contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true),
                        group: 'status',
                        order: -10
                    }, {
                        id: actions_2.MenuId.InteractiveToolbar,
                        when: notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.notEqualsTo(0),
                        group: 'status',
                        order: -10
                    }],
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.selectKernel.args', "Notebook Kernel Args"),
                    args: [
                        {
                            name: 'kernelInfo',
                            description: 'The kernel info',
                            schema: {
                                'type': 'object',
                                'required': ['id', 'extension'],
                                'properties': {
                                    'id': {
                                        'type': 'string'
                                    },
                                    'extension': {
                                        'type': 'string'
                                    },
                                    'notebookEditorId': {
                                        'type': 'string'
                                    }
                                }
                            }
                        }
                    ]
                },
            });
        }
        async run(accessor, context) {
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = getEditorFromContext(editorService, context);
            if (!editor || !editor.hasModel()) {
                return false;
            }
            let controllerId = context && 'id' in context ? context.id : undefined;
            let extensionId = context && 'extension' in context ? context.extension : undefined;
            if (controllerId && (typeof controllerId !== 'string' || typeof extensionId !== 'string')) {
                // validate context: id & extension MUST be strings
                controllerId = undefined;
                extensionId = undefined;
            }
            const notebook = editor.textModel;
            const notebookKernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            const matchResult = notebookKernelService.getMatchingKernel(notebook);
            const { selected } = matchResult;
            if (selected && controllerId && selected.id === controllerId && extensions_1.ExtensionIdentifier.equals(selected.extension, extensionId)) {
                // current kernel is wanted kernel -> done
                return true;
            }
            const wantedKernelId = controllerId ? `${extensionId}/${controllerId}` : undefined;
            const strategy = instantiationService.createInstance(notebookKernelQuickPickStrategy_1.KernelPickerMRUStrategy);
            return strategy.showQuickPick(editor, wantedKernelId);
        }
    });
    let NotebooKernelActionViewItem = class NotebooKernelActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(actualAction, _editor, options, _notebookKernelService, _notebookKernelHistoryService) {
            super(undefined, new actions_1.Action('fakeAction', undefined, themables_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon), true, (event) => actualAction.run(event)), { ...options, label: false, icon: true });
            this._editor = _editor;
            this._notebookKernelService = _notebookKernelService;
            this._notebookKernelHistoryService = _notebookKernelHistoryService;
            this._register(_editor.onDidChangeModel(this._update, this));
            this._register(_notebookKernelService.onDidAddKernel(this._update, this));
            this._register(_notebookKernelService.onDidRemoveKernel(this._update, this));
            this._register(_notebookKernelService.onDidChangeNotebookAffinity(this._update, this));
            this._register(_notebookKernelService.onDidChangeSelectedNotebooks(this._update, this));
            this._register(_notebookKernelService.onDidChangeSourceActions(this._update, this));
            this._register(_notebookKernelService.onDidChangeKernelDetectionTasks(this._update, this));
        }
        render(container) {
            this._update();
            super.render(container);
            container.classList.add('kernel-action-view-item');
            this._kernelLabel = document.createElement('a');
            container.appendChild(this._kernelLabel);
            this.updateLabel();
        }
        updateLabel() {
            if (this._kernelLabel) {
                this._kernelLabel.classList.add('kernel-label');
                this._kernelLabel.innerText = this._action.label;
            }
        }
        _update() {
            const notebook = this._editor.textModel;
            if (!notebook) {
                this._resetAction();
                return;
            }
            notebookKernelQuickPickStrategy_1.KernelPickerMRUStrategy.updateKernelStatusAction(notebook, this._action, this._notebookKernelService, this._notebookKernelHistoryService);
            this.updateClass();
        }
        _resetAction() {
            this._action.enabled = false;
            this._action.label = '';
            this._action.class = '';
        }
    };
    exports.NotebooKernelActionViewItem = NotebooKernelActionViewItem;
    exports.NotebooKernelActionViewItem = NotebooKernelActionViewItem = __decorate([
        __param(3, notebookKernelService_1.INotebookKernelService),
        __param(4, notebookKernelService_1.INotebookKernelHistoryService)
    ], NotebooKernelActionViewItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXJuZWxWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3UGFydHMvbm90ZWJvb2tLZXJuZWxWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9CaEcsU0FBUyxvQkFBb0IsQ0FBQyxhQUE2QixFQUFFLE9BQWdDO1FBQzVGLElBQUksTUFBbUMsQ0FBQztRQUN4QyxJQUFJLE9BQU8sS0FBSyxTQUFTLElBQUksa0JBQWtCLElBQUksT0FBTyxFQUFFLENBQUM7WUFDNUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDO1lBQzFDLE1BQU0sY0FBYyxHQUFHLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRTtnQkFDM0UsTUFBTSxjQUFjLEdBQUcsSUFBQSxpREFBK0IsRUFBQyxVQUFVLENBQUMsQ0FBQztnQkFDbkUsT0FBTyxjQUFjLEVBQUUsS0FBSyxFQUFFLEtBQUssUUFBUSxDQUFDO1lBQzdDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxHQUFHLElBQUEsaURBQStCLEVBQUMsY0FBYyxDQUFDLENBQUM7UUFDMUQsQ0FBQzthQUFNLElBQUksT0FBTyxLQUFLLFNBQVMsSUFBSSxnQkFBZ0IsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNqRSxNQUFNLEdBQUcsT0FBTyxFQUFFLGNBQWMsQ0FBQztRQUNsQyxDQUFDO2FBQU0sQ0FBQztZQUNQLE1BQU0sR0FBRyxJQUFBLGlEQUErQixFQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRCxJQUFBLHlCQUFl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