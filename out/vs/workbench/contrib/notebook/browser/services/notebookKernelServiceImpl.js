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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/storage/common/storage", "vs/base/common/uri", "vs/workbench/contrib/notebook/common/notebookService", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/network", "vs/base/browser/dom"], function (require, exports, event_1, lifecycle_1, map_1, storage_1, uri_1, notebookService_1, actions_1, contextkey_1, network_1, dom_1) {
    "use strict";
    var NotebookKernelService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookKernelService = void 0;
    class KernelInfo {
        static { this._logicClock = 0; }
        constructor(kernel) {
            this.notebookPriorities = new map_1.ResourceMap();
            this.kernel = kernel;
            this.score = -1;
            this.time = KernelInfo._logicClock++;
        }
    }
    class NotebookTextModelLikeId {
        static str(k) {
            return `${k.viewType}/${k.uri.toString()}`;
        }
        static obj(s) {
            const idx = s.indexOf('/');
            return {
                viewType: s.substring(0, idx),
                uri: uri_1.URI.parse(s.substring(idx + 1))
            };
        }
    }
    class SourceAction extends lifecycle_1.Disposable {
        constructor(action, model, isPrimary) {
            super();
            this.action = action;
            this.model = model;
            this.isPrimary = isPrimary;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
        }
        async runAction() {
            if (this.execution) {
                return this.execution;
            }
            this.execution = this._runAction();
            this._onDidChangeState.fire();
            await this.execution;
            this.execution = undefined;
            this._onDidChangeState.fire();
        }
        async _runAction() {
            try {
                await this.action.run({
                    uri: this.model.uri,
                    $mid: 14 /* MarshalledId.NotebookActionContext */
                });
            }
            catch (error) {
                console.warn(`Kernel source command failed: ${error}`);
            }
        }
    }
    let NotebookKernelService = class NotebookKernelService extends lifecycle_1.Disposable {
        static { NotebookKernelService_1 = this; }
        static { this._storageNotebookBinding = 'notebook.controller2NotebookBindings'; }
        constructor(_notebookService, _storageService, _menuService, _contextKeyService) {
            super();
            this._notebookService = _notebookService;
            this._storageService = _storageService;
            this._menuService = _menuService;
            this._contextKeyService = _contextKeyService;
            this._kernels = new Map();
            this._notebookBindings = new map_1.LRUCache(1000, 0.7);
            this._onDidChangeNotebookKernelBinding = this._register(new event_1.Emitter());
            this._onDidAddKernel = this._register(new event_1.Emitter());
            this._onDidRemoveKernel = this._register(new event_1.Emitter());
            this._onDidChangeNotebookAffinity = this._register(new event_1.Emitter());
            this._onDidChangeSourceActions = this._register(new event_1.Emitter());
            this._onDidNotebookVariablesChange = this._register(new event_1.Emitter());
            this._kernelSources = new Map();
            this._kernelSourceActionsUpdates = new Map();
            this._kernelDetectionTasks = new Map();
            this._onDidChangeKernelDetectionTasks = this._register(new event_1.Emitter());
            this._kernelSourceActionProviders = new Map();
            this.onDidChangeSelectedNotebooks = this._onDidChangeNotebookKernelBinding.event;
            this.onDidAddKernel = this._onDidAddKernel.event;
            this.onDidRemoveKernel = this._onDidRemoveKernel.event;
            this.onDidChangeNotebookAffinity = this._onDidChangeNotebookAffinity.event;
            this.onDidChangeSourceActions = this._onDidChangeSourceActions.event;
            this.onDidChangeKernelDetectionTasks = this._onDidChangeKernelDetectionTasks.event;
            this.onDidNotebookVariablesUpdate = this._onDidNotebookVariablesChange.event;
            // auto associate kernels to new notebook documents, also emit event when
            // a notebook has been closed (but don't update the memento)
            this._register(_notebookService.onDidAddNotebookDocument(this._tryAutoBindNotebook, this));
            this._register(_notebookService.onWillRemoveNotebookDocument(notebook => {
                const id = NotebookTextModelLikeId.str(notebook);
                const kernelId = this._notebookBindings.get(id);
                if (kernelId && notebook.uri.scheme === network_1.Schemas.untitled) {
                    this.selectKernelForNotebook(undefined, notebook);
                }
                this._kernelSourceActionsUpdates.get(id)?.dispose();
                this._kernelSourceActionsUpdates.delete(id);
            }));
            // restore from storage
            try {
                const data = JSON.parse(this._storageService.get(NotebookKernelService_1._storageNotebookBinding, 1 /* StorageScope.WORKSPACE */, '[]'));
                this._notebookBindings.fromJSON(data);
            }
            catch {
                // ignore
            }
        }
        dispose() {
            this._kernels.clear();
            this._kernelSources.forEach(v => {
                v.menu.dispose();
                v.actions.forEach(a => a[1].dispose());
            });
            this._kernelSourceActionsUpdates.forEach(v => {
                v.dispose();
            });
            this._kernelSourceActionsUpdates.clear();
            super.dispose();
        }
        _persistMementos() {
            this._persistSoonHandle?.dispose();
            this._persistSoonHandle = (0, dom_1.runWhenWindowIdle)((0, dom_1.getActiveWindow)(), () => {
                this._storageService.store(NotebookKernelService_1._storageNotebookBinding, JSON.stringify(this._notebookBindings), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }, 100);
        }
        static _score(kernel, notebook) {
            if (kernel.viewType === '*') {
                return 5;
            }
            else if (kernel.viewType === notebook.viewType) {
                return 10;
            }
            else {
                return 0;
            }
        }
        _tryAutoBindNotebook(notebook, onlyThisKernel) {
            const id = this._notebookBindings.get(NotebookTextModelLikeId.str(notebook));
            if (!id) {
                // no kernel associated
                return;
            }
            const existingKernel = this._kernels.get(id);
            if (!existingKernel || !NotebookKernelService_1._score(existingKernel.kernel, notebook)) {
                // associated kernel not known, not matching
                return;
            }
            if (!onlyThisKernel || existingKernel.kernel === onlyThisKernel) {
                this._onDidChangeNotebookKernelBinding.fire({ notebook: notebook.uri, oldKernel: undefined, newKernel: existingKernel.kernel.id });
            }
        }
        notifyVariablesChange(notebookUri) {
            this._onDidNotebookVariablesChange.fire(notebookUri);
        }
        registerKernel(kernel) {
            if (this._kernels.has(kernel.id)) {
                throw new Error(`NOTEBOOK CONTROLLER with id '${kernel.id}' already exists`);
            }
            this._kernels.set(kernel.id, new KernelInfo(kernel));
            this._onDidAddKernel.fire(kernel);
            // auto associate the new kernel to existing notebooks it was
            // associated to in the past.
            for (const notebook of this._notebookService.getNotebookTextModels()) {
                this._tryAutoBindNotebook(notebook, kernel);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._kernels.delete(kernel.id)) {
                    this._onDidRemoveKernel.fire(kernel);
                }
                for (const [key, candidate] of Array.from(this._notebookBindings)) {
                    if (candidate === kernel.id) {
                        this._onDidChangeNotebookKernelBinding.fire({ notebook: NotebookTextModelLikeId.obj(key).uri, oldKernel: kernel.id, newKernel: undefined });
                    }
                }
            });
        }
        getMatchingKernel(notebook) {
            // all applicable kernels
            const kernels = [];
            for (const info of this._kernels.values()) {
                const score = NotebookKernelService_1._score(info.kernel, notebook);
                if (score) {
                    kernels.push({
                        score,
                        kernel: info.kernel,
                        instanceAffinity: info.notebookPriorities.get(notebook.uri) ?? 1 /* vscode.NotebookControllerPriority.Default */,
                    });
                }
            }
            kernels
                .sort((a, b) => b.instanceAffinity - a.instanceAffinity || a.score - b.score || a.kernel.label.localeCompare(b.kernel.label));
            const all = kernels.map(obj => obj.kernel);
            // bound kernel
            const selectedId = this._notebookBindings.get(NotebookTextModelLikeId.str(notebook));
            const selected = selectedId ? this._kernels.get(selectedId)?.kernel : undefined;
            const suggestions = kernels.filter(item => item.instanceAffinity > 1).map(item => item.kernel);
            const hidden = kernels.filter(item => item.instanceAffinity < 0).map(item => item.kernel);
            return { all, selected, suggestions, hidden };
        }
        getSelectedOrSuggestedKernel(notebook) {
            const info = this.getMatchingKernel(notebook);
            if (info.selected) {
                return info.selected;
            }
            const preferred = info.all.filter(kernel => this._kernels.get(kernel.id)?.notebookPriorities.get(notebook.uri) === 2 /* vscode.NotebookControllerPriority.Preferred */);
            if (preferred.length === 1) {
                return preferred[0];
            }
            return info.all.length === 1 ? info.all[0] : undefined;
        }
        // a notebook has one kernel, a kernel has N notebooks
        // notebook <-1----N-> kernel
        selectKernelForNotebook(kernel, notebook) {
            const key = NotebookTextModelLikeId.str(notebook);
            const oldKernel = this._notebookBindings.get(key);
            if (oldKernel !== kernel?.id) {
                if (kernel) {
                    this._notebookBindings.set(key, kernel.id);
                }
                else {
                    this._notebookBindings.delete(key);
                }
                this._onDidChangeNotebookKernelBinding.fire({ notebook: notebook.uri, oldKernel, newKernel: kernel?.id });
                this._persistMementos();
            }
        }
        preselectKernelForNotebook(kernel, notebook) {
            const key = NotebookTextModelLikeId.str(notebook);
            const oldKernel = this._notebookBindings.get(key);
            if (oldKernel !== kernel?.id) {
                this._notebookBindings.set(key, kernel.id);
                this._persistMementos();
            }
        }
        updateKernelNotebookAffinity(kernel, notebook, preference) {
            const info = this._kernels.get(kernel.id);
            if (!info) {
                throw new Error(`UNKNOWN kernel '${kernel.id}'`);
            }
            if (preference === undefined) {
                info.notebookPriorities.delete(notebook);
            }
            else {
                info.notebookPriorities.set(notebook, preference);
            }
            this._onDidChangeNotebookAffinity.fire();
        }
        getRunningSourceActions(notebook) {
            const id = NotebookTextModelLikeId.str(notebook);
            const existingInfo = this._kernelSources.get(id);
            if (existingInfo) {
                return existingInfo.actions.filter(action => action[0].execution).map(action => action[0]);
            }
            return [];
        }
        getSourceActions(notebook, contextKeyService) {
            contextKeyService = contextKeyService ?? this._contextKeyService;
            const id = NotebookTextModelLikeId.str(notebook);
            const existingInfo = this._kernelSources.get(id);
            if (existingInfo) {
                return existingInfo.actions.map(a => a[0]);
            }
            const sourceMenu = this._register(this._menuService.createMenu(actions_1.MenuId.NotebookKernelSource, contextKeyService));
            const info = { menu: sourceMenu, actions: [] };
            const loadActionsFromMenu = (menu, document) => {
                const groups = menu.getActions({ shouldForwardArgs: true });
                const sourceActions = [];
                groups.forEach(group => {
                    const isPrimary = /^primary/.test(group[0]);
                    group[1].forEach(action => {
                        const sourceAction = new SourceAction(action, document, isPrimary);
                        const stateChangeListener = sourceAction.onDidChangeState(() => {
                            this._onDidChangeSourceActions.fire({
                                notebook: document.uri,
                                viewType: document.viewType,
                            });
                        });
                        sourceActions.push([sourceAction, stateChangeListener]);
                    });
                });
                info.actions = sourceActions;
                this._kernelSources.set(id, info);
                this._onDidChangeSourceActions.fire({ notebook: document.uri, viewType: document.viewType });
            };
            this._kernelSourceActionsUpdates.get(id)?.dispose();
            this._kernelSourceActionsUpdates.set(id, sourceMenu.onDidChange(() => {
                loadActionsFromMenu(sourceMenu, notebook);
            }));
            loadActionsFromMenu(sourceMenu, notebook);
            return info.actions.map(a => a[0]);
        }
        registerNotebookKernelDetectionTask(task) {
            const notebookType = task.notebookType;
            const all = this._kernelDetectionTasks.get(notebookType) ?? [];
            all.push(task);
            this._kernelDetectionTasks.set(notebookType, all);
            this._onDidChangeKernelDetectionTasks.fire(notebookType);
            return (0, lifecycle_1.toDisposable)(() => {
                const all = this._kernelDetectionTasks.get(notebookType) ?? [];
                const idx = all.indexOf(task);
                if (idx >= 0) {
                    all.splice(idx, 1);
                    this._kernelDetectionTasks.set(notebookType, all);
                    this._onDidChangeKernelDetectionTasks.fire(notebookType);
                }
            });
        }
        getKernelDetectionTasks(notebook) {
            return this._kernelDetectionTasks.get(notebook.viewType) ?? [];
        }
        registerKernelSourceActionProvider(viewType, provider) {
            const providers = this._kernelSourceActionProviders.get(viewType) ?? [];
            providers.push(provider);
            this._kernelSourceActionProviders.set(viewType, providers);
            this._onDidChangeSourceActions.fire({ viewType: viewType });
            const eventEmitterDisposable = provider.onDidChangeSourceActions?.(() => {
                this._onDidChangeSourceActions.fire({ viewType: viewType });
            });
            return (0, lifecycle_1.toDisposable)(() => {
                const providers = this._kernelSourceActionProviders.get(viewType) ?? [];
                const idx = providers.indexOf(provider);
                if (idx >= 0) {
                    providers.splice(idx, 1);
                    this._kernelSourceActionProviders.set(viewType, providers);
                }
                eventEmitterDisposable?.dispose();
            });
        }
        /**
         * Get kernel source actions from providers
         */
        getKernelSourceActions2(notebook) {
            const viewType = notebook.viewType;
            const providers = this._kernelSourceActionProviders.get(viewType) ?? [];
            const promises = providers.map(provider => provider.provideKernelSourceActions());
            return Promise.all(promises).then(actions => {
                return actions.reduce((a, b) => a.concat(b), []);
            });
        }
    };
    exports.NotebookKernelService = NotebookKernelService;
    exports.NotebookKernelService = NotebookKernelService = NotebookKernelService_1 = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, storage_1.IStorageService),
        __param(2, actions_1.IMenuService),
        __param(3, contextkey_1.IContextKeyService)
    ], NotebookKernelService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXJuZWxTZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvc2VydmljZXMvbm90ZWJvb2tLZXJuZWxTZXJ2aWNlSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBaUJoRyxNQUFNLFVBQVU7aUJBRUEsZ0JBQVcsR0FBRyxDQUFDLEFBQUosQ0FBSztRQVEvQixZQUFZLE1BQXVCO1lBRjFCLHVCQUFrQixHQUFHLElBQUksaUJBQVcsRUFBVSxDQUFDO1lBR3ZELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEIsSUFBSSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDdEMsQ0FBQzs7SUFHRixNQUFNLHVCQUF1QjtRQUM1QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQXlCO1lBQ25DLE9BQU8sR0FBRyxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFTO1lBQ25CLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDM0IsT0FBTztnQkFDTixRQUFRLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO2dCQUM3QixHQUFHLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUNwQyxDQUFDO1FBQ0gs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