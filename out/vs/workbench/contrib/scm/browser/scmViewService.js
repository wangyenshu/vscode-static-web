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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/contrib/scm/common/scm", "vs/base/common/iterator", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/scm/browser/menus", "vs/platform/storage/common/storage", "vs/base/common/decorators", "vs/platform/workspace/common/workspace", "vs/base/common/comparers", "vs/base/common/resources", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/extensions/common/extensions"], function (require, exports, lifecycle_1, event_1, scm_1, iterator_1, instantiation_1, menus_1, storage_1, decorators_1, workspace_1, comparers_1, resources_1, arrays_1, configuration_1, contextkey_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMViewService = exports.RepositoryContextKeys = void 0;
    function getProviderStorageKey(provider) {
        return `${provider.contextValue}:${provider.label}${provider.rootUri ? `:${provider.rootUri.toString()}` : ''}`;
    }
    function getRepositoryName(workspaceContextService, repository) {
        if (!repository.provider.rootUri) {
            return repository.provider.label;
        }
        const folder = workspaceContextService.getWorkspaceFolder(repository.provider.rootUri);
        return folder?.uri.toString() === repository.provider.rootUri.toString() ? folder.name : (0, resources_1.basename)(repository.provider.rootUri);
    }
    exports.RepositoryContextKeys = {
        RepositorySortKey: new contextkey_1.RawContextKey('scmRepositorySortKey', "discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */),
    };
    let SCMViewService = class SCMViewService {
        get repositories() {
            return this._repositories.map(r => r.repository);
        }
        get visibleRepositories() {
            // In order to match the legacy behaviour, when the repositories are sorted by discovery time,
            // the visible repositories are sorted by the selection index instead of the discovery time.
            if (this._repositoriesSortKey === "discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */) {
                return this._repositories.filter(r => r.selectionIndex !== -1)
                    .sort((r1, r2) => r1.selectionIndex - r2.selectionIndex)
                    .map(r => r.repository);
            }
            return this._repositories
                .filter(r => r.selectionIndex !== -1)
                .map(r => r.repository);
        }
        set visibleRepositories(visibleRepositories) {
            const set = new Set(visibleRepositories);
            const added = new Set();
            const removed = new Set();
            for (const repositoryView of this._repositories) {
                // Selected -> !Selected
                if (!set.has(repositoryView.repository) && repositoryView.selectionIndex !== -1) {
                    repositoryView.selectionIndex = -1;
                    removed.add(repositoryView.repository);
                }
                // Selected | !Selected -> Selected
                if (set.has(repositoryView.repository)) {
                    if (repositoryView.selectionIndex === -1) {
                        added.add(repositoryView.repository);
                    }
                    repositoryView.selectionIndex = visibleRepositories.indexOf(repositoryView.repository);
                }
            }
            if (added.size === 0 && removed.size === 0) {
                return;
            }
            this._onDidSetVisibleRepositories.fire({ added, removed });
            // Update focus if the focused repository is not visible anymore
            if (this._repositories.find(r => r.focused && r.selectionIndex === -1)) {
                this.focus(this._repositories.find(r => r.selectionIndex !== -1)?.repository);
            }
        }
        get focusedRepository() {
            return this._repositories.find(r => r.focused)?.repository;
        }
        constructor(scmService, contextKeyService, extensionService, instantiationService, configurationService, storageService, workspaceContextService) {
            this.configurationService = configurationService;
            this.storageService = storageService;
            this.workspaceContextService = workspaceContextService;
            this.didFinishLoading = false;
            this.didSelectRepository = false;
            this.disposables = new lifecycle_1.DisposableStore();
            this._repositories = [];
            this._onDidChangeRepositories = new event_1.Emitter();
            this.onDidChangeRepositories = this._onDidChangeRepositories.event;
            this._onDidSetVisibleRepositories = new event_1.Emitter();
            this.onDidChangeVisibleRepositories = event_1.Event.any(this._onDidSetVisibleRepositories.event, event_1.Event.debounce(this._onDidChangeRepositories.event, (last, e) => {
                if (!last) {
                    return e;
                }
                const added = new Set(last.added);
                const removed = new Set(last.removed);
                for (const repository of e.added) {
                    if (removed.has(repository)) {
                        removed.delete(repository);
                    }
                    else {
                        added.add(repository);
                    }
                }
                for (const repository of e.removed) {
                    if (added.has(repository)) {
                        added.delete(repository);
                    }
                    else {
                        removed.add(repository);
                    }
                }
                return { added, removed };
            }, 0, undefined, undefined, undefined, this.disposables));
            this._onDidFocusRepository = new event_1.Emitter();
            this.onDidFocusRepository = this._onDidFocusRepository.event;
            this.menus = instantiationService.createInstance(menus_1.SCMMenus);
            try {
                this.previousState = JSON.parse(storageService.get('scm:view:visibleRepositories', 1 /* StorageScope.WORKSPACE */, ''));
            }
            catch {
                // noop
            }
            this._repositoriesSortKey = this.previousState?.sortKey ?? this.getViewSortOrder();
            this._sortKeyContextKey = exports.RepositoryContextKeys.RepositorySortKey.bindTo(contextKeyService);
            this._sortKeyContextKey.set(this._repositoriesSortKey);
            scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            scmService.onDidRemoveRepository(this.onDidRemoveRepository, this, this.disposables);
            for (const repository of scmService.repositories) {
                this.onDidAddRepository(repository);
            }
            storageService.onWillSaveState(this.onWillSaveState, this, this.disposables);
            // Maintain repository selection when the extension host restarts.
            // Extension host is restarted after installing an extension update
            // or during a profile switch.
            extensionService.onWillStop(() => {
                this.onWillSaveState();
                this.didFinishLoading = false;
            }, this, this.disposables);
        }
        onDidAddRepository(repository) {
            if (!this.didFinishLoading) {
                this.eventuallyFinishLoading();
            }
            const repositoryView = {
                repository, discoveryTime: Date.now(), focused: false, selectionIndex: -1
            };
            let removed = iterator_1.Iterable.empty();
            if (this.previousState && !this.didFinishLoading) {
                const index = this.previousState.all.indexOf(getProviderStorageKey(repository.provider));
                if (index === -1) {
                    // This repository is not part of the previous state which means that it
                    // was either manually closed in the previous session, or the repository
                    // was added after the previous session.In this case, we should select all
                    // of the repositories.
                    const added = [];
                    this.insertRepositoryView(this._repositories, repositoryView);
                    this._repositories.forEach((repositoryView, index) => {
                        if (repositoryView.selectionIndex === -1) {
                            added.push(repositoryView.repository);
                        }
                        repositoryView.selectionIndex = index;
                    });
                    this._onDidChangeRepositories.fire({ added, removed: iterator_1.Iterable.empty() });
                    this.didSelectRepository = false;
                    return;
                }
                if (this.previousState.visible.indexOf(index) === -1) {
                    // Explicit selection started
                    if (this.didSelectRepository) {
                        this.insertRepositoryView(this._repositories, repositoryView);
                        this._onDidChangeRepositories.fire({ added: iterator_1.Iterable.empty(), removed: iterator_1.Iterable.empty() });
                        return;
                    }
                }
                else {
                    // First visible repository
                    if (!this.didSelectRepository) {
                        removed = [...this.visibleRepositories];
                        this._repositories.forEach(r => {
                            r.focused = false;
                            r.selectionIndex = -1;
                        });
                        this.didSelectRepository = true;
                    }
                }
            }
            const maxSelectionIndex = this.getMaxSelectionIndex();
            this.insertRepositoryView(this._repositories, { ...repositoryView, selectionIndex: maxSelectionIndex + 1 });
            this._onDidChangeRepositories.fire({ added: [repositoryView.repository], removed });
            if (!this._repositories.find(r => r.focused)) {
                this.focus(repository);
            }
        }
        onDidRemoveRepository(repository) {
            if (!this.didFinishLoading) {
                this.eventuallyFinishLoading();
            }
            const repositoriesIndex = this._repositories.findIndex(r => r.repository === repository);
            if (repositoriesIndex === -1) {
                return;
            }
            let added = iterator_1.Iterable.empty();
            const repositoryView = this._repositories.splice(repositoriesIndex, 1);
            if (this._repositories.length > 0 && this.visibleRepositories.length === 0) {
                this._repositories[0].selectionIndex = 0;
                added = [this._repositories[0].repository];
            }
            this._onDidChangeRepositories.fire({ added, removed: repositoryView.map(r => r.repository) });
            if (repositoryView.length === 1 && repositoryView[0].focused && this.visibleRepositories.length > 0) {
                this.focus(this.visibleRepositories[0]);
            }
        }
        isVisible(repository) {
            return this._repositories.find(r => r.repository === repository)?.selectionIndex !== -1;
        }
        toggleVisibility(repository, visible) {
            if (typeof visible === 'undefined') {
                visible = !this.isVisible(repository);
            }
            else if (this.isVisible(repository) === visible) {
                return;
            }
            if (visible) {
                this.visibleRepositories = [...this.visibleRepositories, repository];
            }
            else {
                const index = this.visibleRepositories.indexOf(repository);
                if (index > -1) {
                    this.visibleRepositories = [
                        ...this.visibleRepositories.slice(0, index),
                        ...this.visibleRepositories.slice(index + 1)
                    ];
                }
            }
        }
        toggleSortKey(sortKey) {
            this._repositoriesSortKey = sortKey;
            this._sortKeyContextKey.set(this._repositoriesSortKey);
            this._repositories.sort(this.compareRepositories.bind(this));
            this._onDidChangeRepositories.fire({ added: iterator_1.Iterable.empty(), removed: iterator_1.Iterable.empty() });
        }
        focus(repository) {
            if (repository && !this.isVisible(repository)) {
                return;
            }
            this._repositories.forEach(r => r.focused = r.repository === repository);
            if (this._repositories.find(r => r.focused)) {
                this._onDidFocusRepository.fire(repository);
            }
        }
        compareRepositories(op1, op2) {
            // Sort by discovery time
            if (this._repositoriesSortKey === "discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */) {
                return op1.discoveryTime - op2.discoveryTime;
            }
            // Sort by path
            if (this._repositoriesSortKey === 'path' && op1.repository.provider.rootUri && op2.repository.provider.rootUri) {
                return (0, comparers_1.comparePaths)(op1.repository.provider.rootUri.fsPath, op2.repository.provider.rootUri.fsPath);
            }
            // Sort by name, path
            const name1 = getRepositoryName(this.workspaceContextService, op1.repository);
            const name2 = getRepositoryName(this.workspaceContextService, op2.repository);
            const nameComparison = (0, comparers_1.compareFileNames)(name1, name2);
            if (nameComparison === 0 && op1.repository.provider.rootUri && op2.repository.provider.rootUri) {
                return (0, comparers_1.comparePaths)(op1.repository.provider.rootUri.fsPath, op2.repository.provider.rootUri.fsPath);
            }
            return nameComparison;
        }
        getMaxSelectionIndex() {
            return this._repositories.length === 0 ? -1 :
                Math.max(...this._repositories.map(r => r.selectionIndex));
        }
        getViewSortOrder() {
            const sortOder = this.configurationService.getValue('scm.repositories.sortOrder');
            switch (sortOder) {
                case 'discovery time':
                    return "discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */;
                case 'name':
                    return "name" /* ISCMRepositorySortKey.Name */;
                case 'path':
                    return "path" /* ISCMRepositorySortKey.Path */;
                default:
                    return "discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */;
            }
        }
        insertRepositoryView(repositories, repositoryView) {
            const index = (0, arrays_1.binarySearch)(repositories, repositoryView, this.compareRepositories.bind(this));
            repositories.splice(index < 0 ? ~index : index, 0, repositoryView);
        }
        onWillSaveState() {
            if (!this.didFinishLoading) { // don't remember state, if the workbench didn't really finish loading
                return;
            }
            const all = this.repositories.map(r => getProviderStorageKey(r.provider));
            const visible = this.visibleRepositories.map(r => all.indexOf(getProviderStorageKey(r.provider)));
            this.previousState = { all, sortKey: this._repositoriesSortKey, visible };
            this.storageService.store('scm:view:visibleRepositories', JSON.stringify(this.previousState), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        eventuallyFinishLoading() {
            this.finishLoading();
        }
        finishLoading() {
            if (this.didFinishLoading) {
                return;
            }
            this.didFinishLoading = true;
        }
        dispose() {
            this.disposables.dispose();
            this._onDidChangeRepositories.dispose();
            this._onDidSetVisibleRepositories.dispose();
        }
    };
    exports.SCMViewService = SCMViewService;
    __decorate([
        (0, decorators_1.debounce)(5000)
    ], SCMViewService.prototype, "eventuallyFinishLoading", null);
    exports.SCMViewService = SCMViewService = __decorate([
        __param(0, scm_1.ISCMService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, extensions_1.IExtensionService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, storage_1.IStorageService),
        __param(6, workspace_1.IWorkspaceContextService)
    ], SCMViewService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtVmlld1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zY20vYnJvd3Nlci9zY21WaWV3U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQmhHLFNBQVMscUJBQXFCLENBQUMsUUFBc0I7UUFDcEQsT0FBTyxHQUFHLFFBQVEsQ0FBQyxZQUFZLElBQUksUUFBUSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDakgsQ0FBQztJQUVELFNBQVMsaUJBQWlCLENBQUMsdUJBQWlELEVBQUUsVUFBMEI7UUFDdkcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbEMsT0FBTyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztRQUNsQyxDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsdUJBQXVCLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2RixPQUFPLE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUEsb0JBQVEsRUFBQyxVQUFVLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hJLENBQUM7SUFFWSxRQUFBLHFCQUFxQixHQUFHO1FBQ3BDLGlCQUFpQixFQUFFLElBQUksMEJBQWEsQ0FBd0Is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