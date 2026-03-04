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
define(["require", "exports", "vs/base/browser/broadcast", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/indexedDB", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/parts/storage/common/storage", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, broadcast_1, browser_1, dom_1, indexedDB_1, async_1, errorMessage_1, event_1, lifecycle_1, types_1, storage_1, log_1, storage_2, userDataProfile_1) {
    "use strict";
    var BrowserStorageService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexedDBStorageDatabase = exports.BrowserStorageService = void 0;
    let BrowserStorageService = class BrowserStorageService extends storage_2.AbstractStorageService {
        static { BrowserStorageService_1 = this; }
        static { this.BROWSER_DEFAULT_FLUSH_INTERVAL = 5 * 1000; } // every 5s because async operations are not permitted on shutdown
        get hasPendingUpdate() {
            return Boolean(this.applicationStorageDatabase?.hasPendingUpdate ||
                this.profileStorageDatabase?.hasPendingUpdate ||
                this.workspaceStorageDatabase?.hasPendingUpdate);
        }
        constructor(workspace, userDataProfileService, logService) {
            super({ flushInterval: BrowserStorageService_1.BROWSER_DEFAULT_FLUSH_INTERVAL });
            this.workspace = workspace;
            this.userDataProfileService = userDataProfileService;
            this.logService = logService;
            this.applicationStoragePromise = new async_1.DeferredPromise();
            this.profileStorageProfile = this.userDataProfileService.currentProfile;
            this.profileStorageDisposables = this._register(new lifecycle_1.DisposableStore());
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.userDataProfileService.onDidChangeCurrentProfile(e => e.join(this.switchToProfile(e.profile))));
        }
        async doInitialize() {
            // Init storages
            await async_1.Promises.settled([
                this.createApplicationStorage(),
                this.createProfileStorage(this.profileStorageProfile),
                this.createWorkspaceStorage()
            ]);
        }
        async createApplicationStorage() {
            const applicationStorageIndexedDB = await IndexedDBStorageDatabase.createApplicationStorage(this.logService);
            this.applicationStorageDatabase = this._register(applicationStorageIndexedDB);
            this.applicationStorage = this._register(new storage_1.Storage(this.applicationStorageDatabase));
            this._register(this.applicationStorage.onDidChangeStorage(e => this.emitDidChangeValue(-1 /* StorageScope.APPLICATION */, e)));
            await this.applicationStorage.init();
            this.updateIsNew(this.applicationStorage);
            this.applicationStoragePromise.complete({ indexedDb: applicationStorageIndexedDB, storage: this.applicationStorage });
        }
        async createProfileStorage(profile) {
            // First clear any previously associated disposables
            this.profileStorageDisposables.clear();
            // Remember profile associated to profile storage
            this.profileStorageProfile = profile;
            if ((0, storage_2.isProfileUsingDefaultStorage)(this.profileStorageProfile)) {
                // If we are using default profile storage, the profile storage is
                // actually the same as application storage. As such we
                // avoid creating the storage library a second time on
                // the same DB.
                const { indexedDb: applicationStorageIndexedDB, storage: applicationStorage } = await this.applicationStoragePromise.p;
                this.profileStorageDatabase = applicationStorageIndexedDB;
                this.profileStorage = applicationStorage;
                this.profileStorageDisposables.add(this.profileStorage.onDidChangeStorage(e => this.emitDidChangeValue(0 /* StorageScope.PROFILE */, e)));
            }
            else {
                const profileStorageIndexedDB = await IndexedDBStorageDatabase.createProfileStorage(this.profileStorageProfile, this.logService);
                this.profileStorageDatabase = this.profileStorageDisposables.add(profileStorageIndexedDB);
                this.profileStorage = this.profileStorageDisposables.add(new storage_1.Storage(this.profileStorageDatabase));
                this.profileStorageDisposables.add(this.profileStorage.onDidChangeStorage(e => this.emitDidChangeValue(0 /* StorageScope.PROFILE */, e)));
                await this.profileStorage.init();
                this.updateIsNew(this.profileStorage);
            }
        }
        async createWorkspaceStorage() {
            const workspaceStorageIndexedDB = await IndexedDBStorageDatabase.createWorkspaceStorage(this.workspace.id, this.logService);
            this.workspaceStorageDatabase = this._register(workspaceStorageIndexedDB);
            this.workspaceStorage = this._register(new storage_1.Storage(this.workspaceStorageDatabase));
            this._register(this.workspaceStorage.onDidChangeStorage(e => this.emitDidChangeValue(1 /* StorageScope.WORKSPACE */, e)));
            await this.workspaceStorage.init();
            this.updateIsNew(this.workspaceStorage);
        }
        updateIsNew(storage) {
            const firstOpen = storage.getBoolean(storage_2.IS_NEW_KEY);
            if (firstOpen === undefined) {
                storage.set(storage_2.IS_NEW_KEY, true);
            }
            else if (firstOpen) {
                storage.set(storage_2.IS_NEW_KEY, false);
            }
        }
        getStorage(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return this.applicationStorage;
                case 0 /* StorageScope.PROFILE */:
                    return this.profileStorage;
                default:
                    return this.workspaceStorage;
            }
        }
        getLogDetails(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return this.applicationStorageDatabase?.name;
                case 0 /* StorageScope.PROFILE */:
                    return this.profileStorageDatabase?.name;
                default:
                    return this.workspaceStorageDatabase?.name;
            }
        }
        async switchToProfile(toProfile) {
            if (!this.canSwitchProfile(this.profileStorageProfile, toProfile)) {
                return;
            }
            const oldProfileStorage = (0, types_1.assertIsDefined)(this.profileStorage);
            const oldItems = oldProfileStorage.items;
            // Close old profile storage but only if this is
            // different from application storage!
            if (oldProfileStorage !== this.applicationStorage) {
                await oldProfileStorage.close();
            }
            // Create new profile storage & init
            await this.createProfileStorage(toProfile);
            // Handle data switch and eventing
            this.switchData(oldItems, (0, types_1.assertIsDefined)(this.profileStorage), 0 /* StorageScope.PROFILE */);
        }
        async switchToWorkspace(toWorkspace, preserveData) {
            throw new Error('Migrating storage is currently unsupported in Web');
        }
        shouldFlushWhenIdle() {
            // this flush() will potentially cause new state to be stored
            // since new state will only be created while the document
            // has focus, one optimization is to not run this when the
            // document has no focus, assuming that state has not changed
            //
            // another optimization is to not collect more state if we
            // have a pending update already running which indicates
            // that the connection is either slow or disconnected and
            // thus unhealthy.
            return (0, dom_1.getActiveWindow)().document.hasFocus() && !this.hasPendingUpdate;
        }
        close() {
            // Safari: there is an issue where the page can hang on load when
            // a previous session has kept IndexedDB transactions running.
            // The only fix seems to be to cancel any pending transactions
            // (https://github.com/microsoft/vscode/issues/136295)
            //
            // On all other browsers, we keep the databases opened because
            // we expect data to be written when the unload happens.
            if (browser_1.isSafari) {
                this.applicationStorage?.close();
                this.profileStorageDatabase?.close();
                this.workspaceStorageDatabase?.close();
            }
            // Always dispose to ensure that no timeouts or callbacks
            // get triggered in this phase.
            this.dispose();
        }
        async clear() {
            // Clear key/values
            for (const scope of [-1 /* StorageScope.APPLICATION */, 0 /* StorageScope.PROFILE */, 1 /* StorageScope.WORKSPACE */]) {
                for (const target of [0 /* StorageTarget.USER */, 1 /* StorageTarget.MACHINE */]) {
                    for (const key of this.keys(scope, target)) {
                        this.remove(key, scope);
                    }
                }
                await this.getStorage(scope)?.whenFlushed();
            }
            // Clear databases
            await async_1.Promises.settled([
                this.applicationStorageDatabase?.clear() ?? Promise.resolve(),
                this.profileStorageDatabase?.clear() ?? Promise.resolve(),
                this.workspaceStorageDatabase?.clear() ?? Promise.resolve()
            ]);
        }
        hasScope(scope) {
            if ((0, userDataProfile_1.isUserDataProfile)(scope)) {
                return this.profileStorageProfile.id === scope.id;
            }
            return this.workspace.id === scope.id;
        }
    };
    exports.BrowserStorageService = BrowserStorageService;
    exports.BrowserStorageService = BrowserStorageService = BrowserStorageService_1 = __decorate([
        __param(2, log_1.ILogService)
    ], BrowserStorageService);
    class InMemoryIndexedDBStorageDatabase extends storage_1.InMemoryStorageDatabase {
        constructor() {
            super(...arguments);
            this.hasPendingUpdate = false;
            this.name = 'in-memory-indexedb-storage';
        }
        async clear() {
            (await this.getItems()).clear();
        }
        dispose() {
            // No-op
        }
    }
    class IndexedDBStorageDatabase extends lifecycle_1.Disposable {
        static async createApplicationStorage(logService) {
            return IndexedDBStorageDatabase.create({ id: 'global', broadcastChanges: true }, logService);
        }
        static async createProfileStorage(profile, logService) {
            return IndexedDBStorageDatabase.create({ id: `global-${profile.id}`, broadcastChanges: true }, logService);
        }
        static async createWorkspaceStorage(workspaceId, logService) {
            return IndexedDBStorageDatabase.create({ id: workspaceId }, logService);
        }
        static async create(options, logService) {
            try {
                const database = new IndexedDBStorageDatabase(options, logService);
                await database.whenConnected;
                return database;
            }
            catch (error) {
                logService.error(`[IndexedDB Storage ${options.id}] create(): ${(0, errorMessage_1.toErrorMessage)(error, true)}`);
                return new InMemoryIndexedDBStorageDatabase();
            }
        }
        static { this.STORAGE_DATABASE_PREFIX = 'vscode-web-state-db-'; }
        static { this.STORAGE_OBJECT_STORE = 'ItemTable'; }
        get hasPendingUpdate() { return !!this.pendingUpdate; }
        constructor(options, logService) {
            super();
            this.logService = logService;
            this._onDidChangeItemsExternal = this._register(new event_1.Emitter());
            this.onDidChangeItemsExternal = this._onDidChangeItemsExternal.event;
            this.pendingUpdate = undefined;
            this.name = `${IndexedDBStorageDatabase.STORAGE_DATABASE_PREFIX}${options.id}`;
            this.broadcastChannel = options.broadcastChanges ? this._register(new broadcast_1.BroadcastDataChannel(this.name)) : undefined;
            this.whenConnected = this.connect();
            this.registerListeners();
        }
        registerListeners() {
            // Check for storage change events from other
            // windows/tabs via `BroadcastChannel` mechanisms.
            if (this.broadcastChannel) {
                this._register(this.broadcastChannel.onDidReceiveData(data => {
                    if ((0, storage_1.isStorageItemsChangeEvent)(data)) {
                        this._onDidChangeItemsExternal.fire(data);
                    }
                }));
            }
        }
        async connect() {
            try {
                return await indexedDB_1.IndexedDB.create(this.name, undefined, [IndexedDBStorageDatabase.STORAGE_OBJECT_STORE]);
            }
            catch (error) {
                this.logService.error(`[IndexedDB Storage ${this.name}] connect() error: ${(0, errorMessage_1.toErrorMessage)(error)}`);
                throw error;
            }
        }
        async getItems() {
            const db = await this.whenConnected;
            function isValid(value) {
                return typeof value === 'string';
            }
            return db.getKeyValues(IndexedDBStorageDatabase.STORAGE_OBJECT_STORE, isValid);
        }
        async updateItems(request) {
            // Run the update
            let didUpdate = false;
            this.pendingUpdate = this.doUpdateItems(request);
            try {
                didUpdate = await this.pendingUpdate;
            }
            finally {
                this.pendingUpdate = undefined;
            }
            // Broadcast changes to other windows/tabs if enabled
            // and only if we actually did update storage items.
            if (this.broadcastChannel && didUpdate) {
                const event = {
                    changed: request.insert,
                    deleted: request.delete
                };
                this.broadcastChannel.postData(event);
            }
        }
        async doUpdateItems(request) {
            // Return early if the request is empty
            const toInsert = request.insert;
            const toDelete = request.delete;
            if ((!toInsert && !toDelete) || (toInsert?.size === 0 && toDelete?.size === 0)) {
                return false;
            }
            const db = await this.whenConnected;
            // Update `ItemTable` with inserts and/or deletes
            await db.runInTransaction(IndexedDBStorageDatabase.STORAGE_OBJECT_STORE, 'readwrite', objectStore => {
                const requests = [];
                // Inserts
                if (toInsert) {
                    for (const [key, value] of toInsert) {
                        requests.push(objectStore.put(value, key));
                    }
                }
                // Deletes
                if (toDelete) {
                    for (const key of toDelete) {
                        requests.push(objectStore.delete(key));
                    }
                }
                return requests;
            });
            return true;
        }
        async optimize() {
            // not suported in IndexedDB
        }
        async close() {
            const db = await this.whenConnected;
            // Wait for pending updates to having finished
            await this.pendingUpdate;
            // Finally, close IndexedDB
            return db.close();
        }
        async clear() {
            const db = await this.whenConnected;
            await db.runInTransaction(IndexedDBStorageDatabase.STORAGE_OBJECT_STORE, 'readwrite', objectStore => objectStore.clear());
        }
    }
    exports.IndexedDBStorageDatabase = IndexedDBStorageDatabase;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc3RvcmFnZS9icm93c2VyL3N0b3JhZ2VTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFrQnpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsZ0NBQXNCOztpQkFFakQsbUNBQThCLEdBQUcsQ0FBQyxHQUFHLElBQUksQUFBWCxDQUFZLEdBQUMsa0VBQWtFO1FBYzVILElBQUksZ0JBQWdCO1lBQ25CLE9BQU8sT0FBTyxDQUNiLElBQUksQ0FBQywwQkFBMEIsRUFBRSxnQkFBZ0I7Z0JBQ2pELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxnQkFBZ0I7Z0JBQzdDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxnQkFBZ0IsQ0FDL0MsQ0FBQztRQUNILENBQUM7UUFFRCxZQUNrQixTQUFrQyxFQUNsQyxzQkFBK0MsRUFDbkQsVUFBd0M7WUFFckQsS0FBSyxDQUFDLEVBQUUsYUFBYSxFQUFFLHVCQUFxQixDQUFDLDhCQUE4QixFQUFFLENBQUMsQ0FBQztZQUo5RCxjQUFTLEdBQVQsU0FBUyxDQUF5QjtZQUNsQywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQ2xDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFyQnJDLDhCQUF5QixHQUFHLElBQUksdUJBQWUsRUFBK0QsQ0FBQztZQUl4SCwwQkFBcUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDO1lBQzFELDhCQUF5QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQW9CbEYsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVP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