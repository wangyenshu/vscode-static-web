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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "./scm", "vs/platform/log/common/log", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/base/common/history", "vs/base/common/map", "vs/base/common/uri", "vs/base/common/iterator", "vs/platform/workspace/common/workspace"], function (require, exports, lifecycle_1, event_1, scm_1, log_1, contextkey_1, storage_1, history_1, map_1, uri_1, iterator_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMService = void 0;
    class SCMInput {
        get value() {
            return this._value;
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            this._placeholder = placeholder;
            this._onDidChangePlaceholder.fire(placeholder);
        }
        get enabled() {
            return this._enabled;
        }
        set enabled(enabled) {
            this._enabled = enabled;
            this._onDidChangeEnablement.fire(enabled);
        }
        get visible() {
            return this._visible;
        }
        set visible(visible) {
            this._visible = visible;
            this._onDidChangeVisibility.fire(visible);
        }
        get actionButton() {
            return this._actionButton;
        }
        set actionButton(actionButton) {
            this._actionButton = actionButton;
            this._onDidChangeActionButton.fire();
        }
        setFocus() {
            this._onDidChangeFocus.fire();
        }
        showValidationMessage(message, type) {
            this._onDidChangeValidationMessage.fire({ message: message, type: type });
        }
        get validateInput() {
            return this._validateInput;
        }
        set validateInput(validateInput) {
            this._validateInput = validateInput;
            this._onDidChangeValidateInput.fire();
        }
        constructor(repository, history) {
            this.repository = repository;
            this.history = history;
            this._value = '';
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._placeholder = '';
            this._onDidChangePlaceholder = new event_1.Emitter();
            this.onDidChangePlaceholder = this._onDidChangePlaceholder.event;
            this._enabled = true;
            this._onDidChangeEnablement = new event_1.Emitter();
            this.onDidChangeEnablement = this._onDidChangeEnablement.event;
            this._visible = true;
            this._onDidChangeVisibility = new event_1.Emitter();
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidChangeActionButton = new event_1.Emitter();
            this.onDidChangeActionButton = this._onDidChangeActionButton.event;
            this._onDidChangeFocus = new event_1.Emitter();
            this.onDidChangeFocus = this._onDidChangeFocus.event;
            this._onDidChangeValidationMessage = new event_1.Emitter();
            this.onDidChangeValidationMessage = this._onDidChangeValidationMessage.event;
            this._validateInput = () => Promise.resolve(undefined);
            this._onDidChangeValidateInput = new event_1.Emitter();
            this.onDidChangeValidateInput = this._onDidChangeValidateInput.event;
            this.didChangeHistory = false;
            if (this.repository.provider.rootUri) {
                this.historyNavigator = history.getHistory(this.repository.provider.label, this.repository.provider.rootUri);
                this.history.onWillSaveHistory(event => {
                    if (this.historyNavigator.isAtEnd()) {
                        this.saveValue();
                    }
                    if (this.didChangeHistory) {
                        event.historyDidIndeedChange();
                    }
                    this.didChangeHistory = false;
                });
            }
            else { // in memory only
                this.historyNavigator = new history_1.HistoryNavigator2([''], 100);
            }
            this._value = this.historyNavigator.current();
        }
        setValue(value, transient, reason) {
            if (value === this._value) {
                return;
            }
            if (!transient) {
                this.historyNavigator.add(this._value);
                this.historyNavigator.add(value);
                this.didChangeHistory = true;
            }
            this._value = value;
            this._onDidChange.fire({ value, reason });
        }
        showNextHistoryValue() {
            if (this.historyNavigator.isAtEnd()) {
                return;
            }
            else if (!this.historyNavigator.has(this.value)) {
                this.saveValue();
                this.historyNavigator.resetCursor();
            }
            const value = this.historyNavigator.next();
            this.setValue(value, true, scm_1.SCMInputChangeReason.HistoryNext);
        }
        showPreviousHistoryValue() {
            if (this.historyNavigator.isAtEnd()) {
                this.saveValue();
            }
            else if (!this.historyNavigator.has(this._value)) {
                this.saveValue();
                this.historyNavigator.resetCursor();
            }
            const value = this.historyNavigator.previous();
            this.setValue(value, true, scm_1.SCMInputChangeReason.HistoryPrevious);
        }
        saveValue() {
            const oldValue = this.historyNavigator.replaceLast(this._value);
            this.didChangeHistory = this.didChangeHistory || (oldValue !== this._value);
        }
    }
    class SCMRepository {
        get selected() {
            return this._selected;
        }
        constructor(id, provider, disposable, inputHistory) {
            this.id = id;
            this.provider = provider;
            this.disposable = disposable;
            this._selected = false;
            this._onDidChangeSelection = new event_1.Emitter();
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this.input = new SCMInput(this, inputHistory);
        }
        setSelected(selected) {
            if (this._selected === selected) {
                return;
            }
            this._selected = selected;
            this._onDidChangeSelection.fire(selected);
        }
        dispose() {
            this.disposable.dispose();
            this.provider.dispose();
        }
    }
    class WillSaveHistoryEvent {
        constructor() {
            this._didChangeHistory = false;
        }
        get didChangeHistory() { return this._didChangeHistory; }
        historyDidIndeedChange() { this._didChangeHistory = true; }
    }
    let SCMInputHistory = class SCMInputHistory {
        constructor(storageService, workspaceContextService) {
            this.storageService = storageService;
            this.workspaceContextService = workspaceContextService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.histories = new Map();
            this._onWillSaveHistory = this.disposables.add(new event_1.Emitter());
            this.onWillSaveHistory = this._onWillSaveHistory.event;
            this.histories = new Map();
            const entries = this.storageService.getObject('scm.history', 1 /* StorageScope.WORKSPACE */, []);
            for (const [providerLabel, rootUri, history] of entries) {
                let providerHistories = this.histories.get(providerLabel);
                if (!providerHistories) {
                    providerHistories = new map_1.ResourceMap();
                    this.histories.set(providerLabel, providerHistories);
                }
                providerHistories.set(rootUri, new history_1.HistoryNavigator2(history, 100));
            }
            if (this.migrateStorage()) {
                this.saveToStorage();
            }
            this.disposables.add(this.storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, 'scm.history', this.disposables)(e => {
                if (e.external && e.key === 'scm.history') {
                    const raw = this.storageService.getObject('scm.history', 1 /* StorageScope.WORKSPACE */, []);
                    for (const [providerLabel, uri, rawHistory] of raw) {
                        const history = this.getHistory(providerLabel, uri);
                        for (const value of iterator_1.Iterable.reverse(rawHistory)) {
                            history.prepend(value);
                        }
                    }
                }
            }));
            this.disposables.add(this.storageService.onWillSaveState(_ => {
                const event = new WillSaveHistoryEvent();
                this._onWillSaveHistory.fire(event);
                if (event.didChangeHistory) {
                    this.saveToStorage();
                }
            }));
        }
        saveToStorage() {
            const raw = [];
            for (const [providerLabel, providerHistories] of this.histories) {
                for (const [rootUri, history] of providerHistories) {
                    if (!(history.size === 1 && history.current() === '')) {
                        raw.push([providerLabel, rootUri, [...history]]);
                    }
                }
            }
            this.storageService.store('scm.history', raw, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        getHistory(providerLabel, rootUri) {
            let providerHistories = this.histories.get(providerLabel);
            if (!providerHistories) {
                providerHistories = new map_1.ResourceMap();
                this.histories.set(providerLabel, providerHistories);
            }
            let history = providerHistories.get(rootUri);
            if (!history) {
                history = new history_1.HistoryNavigator2([''], 100);
                providerHistories.set(rootUri, history);
            }
            return history;
        }
        // Migrates from Application scope storage to Workspace scope.
        // TODO@joaomoreno: Change from January 2024 onwards such that the only code is to remove all `scm/input:` storage keys
        migrateStorage() {
            let didSomethingChange = false;
            const machineKeys = iterator_1.Iterable.filter(this.storageService.keys(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */), key => key.startsWith('scm/input:'));
            for (const key of machineKeys) {
                try {
                    const legacyHistory = JSON.parse(this.storageService.get(key, -1 /* StorageScope.APPLICATION */, ''));
                    const match = /^scm\/input:([^:]+):(.+)$/.exec(key);
                    if (!match || !Array.isArray(legacyHistory?.history) || !Number.isInteger(legacyHistory?.timestamp)) {
                        this.storageService.remove(key, -1 /* StorageScope.APPLICATION */);
                        continue;
                    }
                    const [, providerLabel, rootPath] = match;
                    const rootUri = uri_1.URI.file(rootPath);
                    if (this.workspaceContextService.getWorkspaceFolder(rootUri)) {
                        const history = this.getHistory(providerLabel, rootUri);
                        for (const entry of iterator_1.Iterable.reverse(legacyHistory.history)) {
                            history.prepend(entry);
                        }
                        didSomethingChange = true;
                        this.storageService.remove(key, -1 /* StorageScope.APPLICATION */);
                    }
                }
                catch {
                    this.storageService.remove(key, -1 /* StorageScope.APPLICATION */);
                }
            }
            return didSomethingChange;
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    SCMInputHistory = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], SCMInputHistory);
    let SCMService = class SCMService {
        get repositories() { return this._repositories.values(); }
        get repositoryCount() { return this._repositories.size; }
        constructor(logService, workspaceContextService, contextKeyService, storageService) {
            this.logService = logService;
            this._repositories = new Map(); // used in tests
            this._onDidAddProvider = new event_1.Emitter();
            this.onDidAddRepository = this._onDidAddProvider.event;
            this._onDidRemoveProvider = new event_1.Emitter();
            this.onDidRemoveRepository = this._onDidRemoveProvider.event;
            this.inputHistory = new SCMInputHistory(storageService, workspaceContextService);
            this.providerCount = contextKeyService.createKey('scm.providerCount', 0);
        }
        registerSCMProvider(provider) {
            this.logService.trace('SCMService#registerSCMProvider');
            if (this._repositories.has(provider.id)) {
                throw new Error(`SCM Provider ${provider.id} already exists.`);
            }
            const disposable = (0, lifecycle_1.toDisposable)(() => {
                this._repositories.delete(provider.id);
                this._onDidRemoveProvider.fire(repository);
                this.providerCount.set(this._repositories.size);
            });
            const repository = new SCMRepository(provider.id, provider, disposable, this.inputHistory);
            this._repositories.set(provider.id, repository);
            this._onDidAddProvider.fire(repository);
            this.providerCount.set(this._repositories.size);
            return repository;
        }
        getRepository(id) {
            return this._repositories.get(id);
        }
    };
    exports.SCMService = SCMService;
    exports.SCMService = SCMService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, storage_1.IStorageService)
    ], SCMService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NjbS9jb21tb24vc2NtU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlaEcsTUFBTSxRQUFRO1FBSWIsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFPRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztRQUVELElBQUksV0FBVyxDQUFDLFdBQW1CO1lBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1lBQ2hDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQU9ELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBSSxPQUFPLENBQUMsT0FBZ0I7WUFDM0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBT0QsSUFBSSxPQUFPO1lBQ1YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxJQUFJLE9BQU8sQ0FBQyxPQUFnQjtZQUMzQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFNRCxJQUFJLFlBQVk7WUFDZixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVE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