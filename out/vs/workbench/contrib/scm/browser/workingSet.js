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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/workbench/contrib/scm/browser/util", "vs/workbench/contrib/scm/common/scm", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, event_1, lifecycle_1, configuration_1, storage_1, util_1, scm_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMWorkingSetController = void 0;
    let SCMWorkingSetController = class SCMWorkingSetController {
        static { this.ID = 'workbench.contrib.scmWorkingSets'; }
        constructor(configurationService, editorGroupsService, scmService, storageService) {
            this.configurationService = configurationService;
            this.editorGroupsService = editorGroupsService;
            this.scmService = scmService;
            this.storageService = storageService;
            this._repositoryDisposables = new lifecycle_1.DisposableMap();
            this._scmServiceDisposables = new lifecycle_1.DisposableStore();
            this._disposables = new lifecycle_1.DisposableStore();
            const onDidChangeConfiguration = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.workingSets.enabled'), this._disposables);
            this._disposables.add(event_1.Event.runAndSubscribe(onDidChangeConfiguration, () => this._onDidChangeConfiguration()));
        }
        _onDidChangeConfiguration() {
            if (!this.configurationService.getValue('scm.workingSets.enabled')) {
                this.storageService.remove('scm.workingSets', 1 /* StorageScope.WORKSPACE */);
                this._scmServiceDisposables.clear();
                this._repositoryDisposables.clearAndDisposeAll();
                return;
            }
            this._workingSets = this._loadWorkingSets();
            this.scmService.onDidAddRepository(this._onDidAddRepository, this, this._scmServiceDisposables);
            this.scmService.onDidRemoveRepository(this._onDidRemoveRepository, this, this._scmServiceDisposables);
            for (const repository of this.scmService.repositories) {
                this._onDidAddRepository(repository);
            }
        }
        _onDidAddRepository(repository) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(event_1.Event.runAndSubscribe(repository.provider.onDidChangeHistoryProvider, () => {
                if (!repository.provider.historyProvider) {
                    return;
                }
                disposables.add(event_1.Event.runAndSubscribe(repository.provider.historyProvider.onDidChangeCurrentHistoryItemGroup, async () => {
                    if (!repository.provider.historyProvider?.currentHistoryItemGroup?.id) {
                        return;
                    }
                    const providerKey = (0, util_1.getProviderKey)(repository.provider);
                    const currentHistoryItemGroupId = repository.provider.historyProvider.currentHistoryItemGroup.id;
                    const repositoryWorkingSets = this._workingSets.get(providerKey);
                    if (!repositoryWorkingSets) {
                        this._workingSets.set(providerKey, { currentHistoryItemGroupId, editorWorkingSets: new Map() });
                        return;
                    }
                    if (repositoryWorkingSets.currentHistoryItemGroupId === currentHistoryItemGroupId) {
                        return;
                    }
                    // Save the working set
                    this._saveWorkingSet(providerKey, currentHistoryItemGroupId, repositoryWorkingSets);
                    // Restore the working set
                    await this._restoreWorkingSet(providerKey, currentHistoryItemGroupId);
                }));
            }));
            this._repositoryDisposables.set(repository, disposables);
        }
        _onDidRemoveRepository(repository) {
            this._workingSets.delete((0, util_1.getProviderKey)(repository.provider));
            this._repositoryDisposables.deleteAndDispose(repository);
        }
        _loadWorkingSets() {
            const workingSets = new Map();
            const workingSetsRaw = this.storageService.get('scm.workingSets', 1 /* StorageScope.WORKSPACE */);
            if (!workingSetsRaw) {
                return workingSets;
            }
            for (const serializedWorkingSet of JSON.parse(workingSetsRaw)) {
                workingSets.set(serializedWorkingSet.providerKey, {
                    currentHistoryItemGroupId: serializedWorkingSet.currentHistoryItemGroupId,
                    editorWorkingSets: new Map(serializedWorkingSet.editorWorkingSets)
                });
            }
            return workingSets;
        }
        _saveWorkingSet(providerKey, currentHistoryItemGroupId, repositoryWorkingSets) {
            const previousHistoryItemGroupId = repositoryWorkingSets.currentHistoryItemGroupId;
            const editorWorkingSets = repositoryWorkingSets.editorWorkingSets;
            const editorWorkingSet = this.editorGroupsService.saveWorkingSet(previousHistoryItemGroupId);
            this._workingSets.set(providerKey, { currentHistoryItemGroupId, editorWorkingSets: editorWorkingSets.set(previousHistoryItemGroupId, editorWorkingSet) });
            // Save to storage
            const workingSets = [];
            for (const [providerKey, { currentHistoryItemGroupId, editorWorkingSets }] of this._workingSets) {
                workingSets.push({ providerKey, currentHistoryItemGroupId, editorWorkingSets: [...editorWorkingSets] });
            }
            this.storageService.store('scm.workingSets', JSON.stringify(workingSets), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async _restoreWorkingSet(providerKey, currentHistoryItemGroupId) {
            const workingSets = this._workingSets.get(providerKey);
            if (!workingSets) {
                return;
            }
            let editorWorkingSetId = workingSets.editorWorkingSets.get(currentHistoryItemGroupId);
            if (!editorWorkingSetId && this.configurationService.getValue('scm.workingSets.default') === 'empty') {
                editorWorkingSetId = 'empty';
            }
            if (editorWorkingSetId) {
                await this.editorGroupsService.applyWorkingSet(editorWorkingSetId);
            }
        }
        dispose() {
            this._repositoryDisposables.dispose();
            this._scmServiceDisposables.dispose();
            this._disposables.dispose();
        }
    };
    exports.SCMWorkingSetController = SCMWorkingSetController;
    exports.SCMWorkingSetController = SCMWorkingSetController = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, scm_1.ISCMService),
        __param(3, storage_1.IStorageService)
    ], SCMWorkingSetController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ1NldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NjbS9icm93c2VyL3dvcmtpbmdTZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0J6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtpQkFDbkIsT0FBRSxHQUFHLGtDQUFrQyxBQUFyQyxDQUFzQztRQU94RCxZQUN3QixvQkFBNEQsRUFDN0QsbUJBQTBELEVBQ25FLFVBQXdDLEVBQ3BDLGNBQWdEO1lBSHpCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDNUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUNsRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ25CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQVJqRCwyQkFBc0IsR0FBRyxJQUFJLHlCQUFhLEVBQWtCLENBQUM7WUFDN0QsMkJBQXNCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDL0MsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQVFyRCxNQUFNLHdCQUF3QixHQUFHLGFBQUssQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMseUJBQXlCLENBQUMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDeEssSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEgsQ0FBQztRQUVPLHlCQUF5QjtZQUNoQyxJQUFJLENBQUMsSUFB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