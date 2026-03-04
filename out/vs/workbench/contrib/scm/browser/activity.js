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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/contrib/scm/common/scm", "vs/workbench/services/activity/common/activity", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/network", "vs/base/common/iterator", "vs/workbench/services/title/browser/titleService"], function (require, exports, nls_1, resources_1, lifecycle_1, event_1, scm_1, activity_1, contextkey_1, statusbar_1, editorService_1, configuration_1, editor_1, uriIdentity_1, network_1, iterator_1, titleService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMActiveResourceContextKeyController = exports.SCMActiveRepositoryContextKeyController = exports.SCMStatusController = void 0;
    function getCount(repository) {
        if (typeof repository.provider.count === 'number') {
            return repository.provider.count;
        }
        else {
            return repository.provider.groups.reduce((r, g) => r + g.resources.length, 0);
        }
    }
    let SCMStatusController = class SCMStatusController {
        constructor(scmService, scmViewService, statusbarService, activityService, editorService, configurationService, uriIdentityService) {
            this.scmService = scmService;
            this.scmViewService = scmViewService;
            this.statusbarService = statusbarService;
            this.activityService = activityService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.uriIdentityService = uriIdentityService;
            this.statusBarDisposable = lifecycle_1.Disposable.None;
            this.focusDisposable = lifecycle_1.Disposable.None;
            this.focusedRepository = undefined;
            this.badgeDisposable = new lifecycle_1.MutableDisposable();
            this.disposables = new lifecycle_1.DisposableStore();
            this.repositoryDisposables = new Set();
            this.scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            this.scmService.onDidRemoveRepository(this.onDidRemoveRepository, this, this.disposables);
            const onDidChangeSCMCountBadge = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.countBadge'));
            onDidChangeSCMCountBadge(this.renderActivityCount, this, this.disposables);
            for (const repository of this.scmService.repositories) {
                this.onDidAddRepository(repository);
            }
            this.scmViewService.onDidFocusRepository(this.focusRepository, this, this.disposables);
            this.focusRepository(this.scmViewService.focusedRepository);
            editorService.onDidActiveEditorChange(() => this.tryFocusRepositoryBasedOnActiveEditor(), this, this.disposables);
            this.renderActivityCount();
        }
        tryFocusRepositoryBasedOnActiveEditor(repositories = this.scmService.repositories) {
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor);
            if (!resource) {
                return false;
            }
            let bestRepository = null;
            let bestMatchLength = Number.POSITIVE_INFINITY;
            for (const repository of repositories) {
                const root = repository.provider.rootUri;
                if (!root) {
                    continue;
                }
                const path = this.uriIdentityService.extUri.relativePath(root, resource);
                if (path && !/^\.\./.test(path) && path.length < bestMatchLength) {
                    bestRepository = repository;
                    bestMatchLength = path.length;
                }
            }
            if (!bestRepository) {
                return false;
            }
            this.focusRepository(bestRepository);
            return true;
        }
        onDidAddRepository(repository) {
            const onDidChange = event_1.Event.any(repository.provider.onDidChange, repository.provider.onDidChangeResources);
            const changeDisposable = onDidChange(() => this.renderActivityCount());
            const onDidRemove = event_1.Event.filter(this.scmService.onDidRemoveRepository, e => e === repository);
            const removeDisposable = onDidRemove(() => {
                disposable.dispose();
                this.repositoryDisposables.delete(disposable);
                this.renderActivityCount();
            });
            const disposable = (0, lifecycle_1.combinedDisposable)(changeDisposable, removeDisposable);
            this.repositoryDisposables.add(disposable);
            this.tryFocusRepositoryBasedOnActiveEditor(iterator_1.Iterable.single(repository));
        }
        onDidRemoveRepository(repository) {
            if (this.focusedRepository !== repository) {
                return;
            }
            this.focusRepository(iterator_1.Iterable.first(this.scmService.repositories));
        }
        focusRepository(repository) {
            if (this.focusedRepository === repository) {
                return;
            }
            this.focusDisposable.dispose();
            this.focusedRepository = repository;
            if (repository && repository.provider.onDidChangeStatusBarCommands) {
                this.focusDisposable = repository.provider.onDidChangeStatusBarCommands(() => this.renderStatusBar(repository));
            }
            this.renderStatusBar(repository);
            this.renderActivityCount();
        }
        renderStatusBar(repository) {
            this.statusBarDisposable.dispose();
            if (!repository) {
                return;
            }
            const commands = repository.provider.statusBarCommands || [];
            const label = repository.provider.rootUri
                ? `${(0, resources_1.basename)(repository.provider.rootUri)} (${repository.provider.label})`
                : repository.provider.label;
            const disposables = new lifecycle_1.DisposableStore();
            for (let index = 0; index < commands.length; index++) {
                const command = commands[index];
                const tooltip = `${label}${command.tooltip ? ` - ${command.tooltip}` : ''}`;
                // Get a repository agnostic name for the status bar action, derive this from the
                // first command argument which is in the form "git.<command>/<number>"
                let repoAgnosticActionName = command.arguments?.[0];
                if (repoAgnosticActionName && typeof repoAgnosticActionName === 'string') {
                    repoAgnosticActionName = repoAgnosticActionName
                        .substring(0, repoAgnosticActionName.lastIndexOf('/'))
                        .replace(/^git\./, '');
                    if (repoAgnosticActionName.length > 1) {
                        repoAgnosticActionName = repoAgnosticActionName[0].toLocaleUpperCase() + repoAgnosticActionName.slice(1);
                    }
                }
                else {
                    repoAgnosticActionName = '';
                }
                const statusbarEntry = {
                    name: (0, nls_1.localize)('status.scm', "Source Control") + (repoAgnosticActionName ? ` ${repoAgnosticActionName}` : ''),
                    text: command.title,
                    ariaLabel: tooltip,
                    tooltip,
                    command: command.id ? command : undefined
                };
                disposables.add(index === 0 ?
                    this.statusbarService.addEntry(statusbarEntry, `status.scm.${index}`, 0 /* MainThreadStatusBarAlignment.LEFT */, 10000) :
                    this.statusbarService.addEntry(statusbarEntry, `status.scm.${index}`, 0 /* MainThreadStatusBarAlignment.LEFT */, { id: `status.scm.${index - 1}`, alignment: 1 /* MainThreadStatusBarAlignment.RIGHT */, compact: true }));
            }
            this.statusBarDisposable = disposables;
        }
        renderActivityCount() {
            const countBadgeType = this.configurationService.getValue('scm.countBadge');
            let count = 0;
            if (countBadgeType === 'all') {
                count = iterator_1.Iterable.reduce(this.scmService.repositories, (r, repository) => r + getCount(repository), 0);
            }
            else if (countBadgeType === 'focused' && this.focusedRepository) {
                count = getCount(this.focusedRepository);
            }
            if (count > 0) {
                const badge = new activity_1.NumberBadge(count, num => (0, nls_1.localize)('scmPendingChangesBadge', '{0} pending changes', num));
                this.badgeDisposable.value = this.activityService.showViewActivity(scm_1.VIEW_PANE_ID, { badge });
            }
            else {
                this.badgeDisposable.value = undefined;
            }
        }
        dispose() {
            this.focusDisposable.dispose();
            this.statusBarDisposable.dispose();
            this.badgeDisposable.dispose();
            this.disposables.dispose();
            (0, lifecycle_1.dispose)(this.repositoryDisposables.values());
            this.repositoryDisposables.clear();
        }
    };
    exports.SCMStatusController = SCMStatusController;
    exports.SCMStatusController = SCMStatusController = __decorate([
        __param(0, scm_1.ISCMService),
        __param(1, scm_1.ISCMViewService),
        __param(2, statusbar_1.IStatusbarService),
        __param(3, activity_1.IActivityService),
        __param(4, editorService_1.IEditorService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, uriIdentity_1.IUriIdentityService)
    ], SCMStatusController);
    const ActiveRepositoryContextKeys = {
        ActiveRepositoryName: new contextkey_1.RawContextKey('scmActiveRepositoryName', ''),
        ActiveRepositoryBranchName: new contextkey_1.RawContextKey('scmActiveRepositoryBranchName', ''),
    };
    let SCMActiveRepositoryContextKeyController = class SCMActiveRepositoryContextKeyController {
        constructor(contextKeyService, editorService, scmViewService, titleService, uriIdentityService) {
            this.editorService = editorService;
            this.scmViewService = scmViewService;
            this.uriIdentityService = uriIdentityService;
            this.focusedRepository = undefined;
            this.focusDisposable = lifecycle_1.Disposable.None;
            this.disposables = new lifecycle_1.DisposableStore();
            this.activeRepositoryNameContextKey = ActiveRepositoryContextKeys.ActiveRepositoryName.bindTo(contextKeyService);
            this.activeRepositoryBranchNameContextKey = ActiveRepositoryContextKeys.ActiveRepositoryBranchName.bindTo(contextKeyService);
            titleService.registerVariables([
                { name: 'activeRepositoryName', contextKey: ActiveRepositoryContextKeys.ActiveRepositoryName.key },
                { name: 'activeRepositoryBranchName', contextKey: ActiveRepositoryContextKeys.ActiveRepositoryBranchName.key, }
            ]);
            editorService.onDidActiveEditorChange(this.onDidActiveEditorChange, this, this.disposables);
            scmViewService.onDidFocusRepository(this.onDidFocusRepository, this, this.disposables);
            this.onDidFocusRepository(scmViewService.focusedRepository);
        }
        onDidActiveEditorChange() {
            const activeResource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor);
            if (activeResource?.scheme !== network_1.Schemas.file && activeResource?.scheme !== network_1.Schemas.vscodeRemote) {
                return;
            }
            const repository = iterator_1.Iterable.find(this.scmViewService.repositories, r => Boolean(r.provider.rootUri && this.uriIdentityService.extUri.isEqualOrParent(activeResource, r.provider.rootUri)));
            this.onDidFocusRepository(repository);
        }
        onDidFocusRepository(repository) {
            if (!repository || this.focusedRepository === repository) {
                return;
            }
            this.focusDisposable.dispose();
            this.focusedRepository = repository;
            if (repository && repository.provider.onDidChangeStatusBarCommands) {
                this.focusDisposable = repository.provider.onDidChangeStatusBarCommands(() => this.updateContextKeys(repository));
            }
            this.updateContextKeys(repository);
        }
        updateContextKeys(repository) {
            this.activeRepositoryNameContextKey.set(repository?.provider.name ?? '');
            this.activeRepositoryBranchNameContextKey.set(repository?.provider.historyProvider?.currentHistoryItemGroup?.name ?? '');
        }
        dispose() {
            this.focusDisposable.dispose();
            this.disposables.dispose();
        }
    };
    exports.SCMActiveRepositoryContextKeyController = SCMActiveRepositoryContextKeyController;
    exports.SCMActiveRepositoryContextKeyController = SCMActiveRepositoryContextKeyController = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, editorService_1.IEditorService),
        __param(2, scm_1.ISCMViewService),
        __param(3, titleService_1.ITitleService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], SCMActiveRepositoryContextKeyController);
    let SCMActiveResourceContextKeyController = class SCMActiveResourceContextKeyController {
        constructor(contextKeyService, editorService, scmService, uriIdentityService) {
            this.editorService = editorService;
            this.scmService = scmService;
            this.uriIdentityService = uriIdentityService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.repositoryDisposables = new Set();
            this.activeResourceHasChangesContextKey = contextKeyService.createKey('scmActiveResourceHasChanges', false);
            this.activeResourceRepositoryContextKey = contextKeyService.createKey('scmActiveResourceRepository', undefined);
            this.scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            for (const repository of this.scmService.repositories) {
                this.onDidAddRepository(repository);
            }
            editorService.onDidActiveEditorChange(this.updateContextKey, this, this.disposables);
        }
        onDidAddRepository(repository) {
            const onDidChange = event_1.Event.any(repository.provider.onDidChange, repository.provider.onDidChangeResources);
            const changeDisposable = onDidChange(() => this.updateContextKey());
            const onDidRemove = event_1.Event.filter(this.scmService.onDidRemoveRepository, e => e === repository);
            const removeDisposable = onDidRemove(() => {
                disposable.dispose();
                this.repositoryDisposables.delete(disposable);
                this.updateContextKey();
            });
            const disposable = (0, lifecycle_1.combinedDisposable)(changeDisposable, removeDisposable);
            this.repositoryDisposables.add(disposable);
        }
        updateContextKey() {
            const activeResource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor);
            if (activeResource?.scheme === network_1.Schemas.file || activeResource?.scheme === network_1.Schemas.vscodeRemote) {
                const activeResourceRepository = iterator_1.Iterable.find(this.scmService.repositories, r => Boolean(r.provider.rootUri && this.uriIdentityService.extUri.isEqualOrParent(activeResource, r.provider.rootUri)));
                this.activeResourceRepositoryContextKey.set(activeResourceRepository?.id);
                for (const resourceGroup of activeResourceRepository?.provider.groups ?? []) {
                    if (resourceGroup.resources
                        .some(scmResource => this.uriIdentityService.extUri.isEqual(activeResource, scmResource.sourceUri))) {
                        this.activeResourceHasChangesContextKey.set(true);
                        return;
                    }
                }
                this.activeResourceHasChangesContextKey.set(false);
            }
            else {
                this.activeResourceHasChangesContextKey.set(false);
                this.activeResourceRepositoryContextKey.set(undefined);
            }
        }
        dispose() {
            this.disposables.dispose();
            (0, lifecycle_1.dispose)(this.repositoryDisposables.values());
            this.repositoryDisposables.clear();
        }
    };
    exports.SCMActiveResourceContextKeyController = SCMActiveResourceContextKeyController;
    exports.SCMActiveResourceContextKeyController = SCMActiveResourceContextKeyController = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, editorService_1.IEditorService),
        __param(2, scm_1.ISCMService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], SCMActiveResourceContextKeyController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aXZpdHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zY20vYnJvd3Nlci9hY3Rpdml0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLFNBQVMsUUFBUSxDQUFDLFVBQTBCO1FBQzNDLElBQUksT0FBTyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNuRCxPQUFPLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQ2xDLENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FBTyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkYsQ0FBQztJQUNGLENBQUM7SUFFTSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFtQjtRQVMvQixZQUNjLFVBQXdDLEVBQ3BDLGNBQWdELEVBQzlDLGdCQUFvRCxFQUNyRCxlQUFrRCxFQUNwRCxhQUE4QyxFQUN2QyxvQkFBNEQsRUFDOUQsa0JBQXdEO1lBTi9DLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDbkIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzdCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDcEMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ25DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN0Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzdDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFkdEUsd0JBQW1CLEdBQWdCLHNCQUFVLENBQUMsSUFBSSxD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