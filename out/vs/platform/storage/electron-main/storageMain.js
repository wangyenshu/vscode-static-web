/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/stopwatch", "vs/base/common/uri", "vs/base/node/pfs", "vs/base/parts/storage/common/storage", "vs/base/parts/storage/node/storage", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/base/common/network"], function (require, exports, arrays_1, async_1, event_1, lifecycle_1, path_1, stopwatch_1, uri_1, pfs_1, storage_1, storage_2, log_1, storage_3, telemetry_1, workspace_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryStorageMain = exports.WorkspaceStorageMain = exports.ApplicationStorageMain = exports.ProfileStorageMain = void 0;
    class BaseStorageMain extends lifecycle_1.Disposable {
        static { this.LOG_SLOW_CLOSE_THRESHOLD = 2000; }
        get storage() { return this._storage; }
        constructor(logService, fileService) {
            super();
            this.logService = logService;
            this.fileService = fileService;
            this._onDidChangeStorage = this._register(new event_1.Emitter());
            this.onDidChangeStorage = this._onDidChangeStorage.event;
            this._onDidCloseStorage = this._register(new event_1.Emitter());
            this.onDidCloseStorage = this._onDidCloseStorage.event;
            this._storage = this._register(new storage_1.Storage(new storage_1.InMemoryStorageDatabase(), { hint: storage_1.StorageHint.STORAGE_IN_MEMORY })); // storage is in-memory until initialized
            this.initializePromise = undefined;
            this.whenInitPromise = new async_1.DeferredPromise();
            this.whenInit = this.whenInitPromise.p;
            this.state = storage_1.StorageState.None;
        }
        isInMemory() {
            return this._storage.isInMemory();
        }
        init() {
            if (!this.initializePromise) {
                this.initializePromise = (async () => {
                    if (this.state !== storage_1.StorageState.None) {
                        return; // either closed or already initialized
                    }
                    try {
                        // Create storage via subclasses
                        const storage = this._register(await this.doCreate());
                        // Replace our in-memory storage with the real
                        // once as soon as possible without awaiting
                        // the init call.
                        this._storage.dispose();
                        this._storage = storage;
                        // Re-emit storage changes via event
                        this._register(storage.onDidChangeStorage(e => this._onDidChangeStorage.fire(e)));
                        // Await storage init
                        await this.doInit(storage);
                        // Ensure we track whether storage is new or not
                        const isNewStorage = storage.getBoolean(storage_3.IS_NEW_KEY);
                        if (isNewStorage === undefined) {
                            storage.set(storage_3.IS_NEW_KEY, true);
                        }
                        else if (isNewStorage) {
                            storage.set(storage_3.IS_NEW_KEY, false);
                        }
                    }
                    catch (error) {
                        this.logService.error(`[storage main] initialize(): Unable to init storage due to ${error}`);
                    }
                    finally {
                        // Update state
                        this.state = storage_1.StorageState.Initialized;
                        // Mark init promise as completed
                        this.whenInitPromise.complete();
                    }
                })();
            }
            return this.initializePromise;
        }
        createLoggingOptions() {
            return {
                logTrace: (this.logService.getLevel() === log_1.LogLevel.Trace) ? msg => this.logService.trace(msg) : undefined,
                logError: error => this.logService.error(error)
            };
        }
        doInit(storage) {
            return storage.init();
        }
        get items() { return this._storage.items; }
        get(key, fallbackValue) {
            return this._storage.get(key, fallbackValue);
        }
        set(key, value) {
            return this._storage.set(key, value);
        }
        delete(key) {
            return this._storage.delete(key);
        }
        optimize() {
            return this._storage.optimize();
        }
        async close() {
            // Measure how long it takes to close storage
            const watch = new stopwatch_1.StopWatch(false);
            await this.doClose();
            watch.stop();
            // If close() is taking a long time, there is
            // a chance that the underlying DB is large
            // either on disk or in general. In that case
            // log some additional info to further diagnose
            if (watch.elapsed() > BaseStorageMain.LOG_SLOW_CLOSE_THRESHOLD) {
                await this.logSlowClose(watch);
            }
            // Signal as event
            this._onDidCloseStorage.fire();
        }
        async logSlowClose(watch) {
            if (!this.path) {
                return;
            }
            try {
                const largestEntries = (0, arrays_1.top)(Array.from(this._storage.items.entries())
                    .map(([key, value]) => ({ key, length: value.length })), (entryA, entryB) => entryB.length - entryA.length, 5)
                    .map(entry => `${entry.key}:${entry.length}`).join(', ');
                const dbSize = (await this.fileService.stat(uri_1.URI.file(this.path))).size;
                this.logService.warn(`[storage main] detected slow close() operation: Time: ${watch.elapsed()}ms, DB size: ${dbSize}b, Large Keys: ${largestEntries}`);
            }
            catch (error) {
                this.logService.error('[storage main] figuring out stats for slow DB on close() resulted in an error', error);
            }
        }
        async doClose() {
            // Ensure we are not accidentally leaving
            // a pending initialized storage behind in
            // case `close()` was called before `init()`
            // finishes.
            if (this.initializePromise) {
                await this.initializePromise;
            }
            // Update state
            this.state = storage_1.StorageState.Closed;
            // Propagate to storage lib
            await this._storage.close();
        }
    }
    class BaseProfileAwareStorageMain extends BaseStorageMain {
        static { this.STORAGE_NAME = 'state.vscdb'; }
        get path() {
            if (!this.options.useInMemoryStorage) {
                return (0, path_1.join)(this.profile.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath, BaseProfileAwareStorageMain.STORAGE_NAME);
            }
            return undefined;
        }
        constructor(profile, options, logService, fileService) {
            super(logService, fileService);
            this.profile = profile;
            this.options = options;
        }
        async doCreate() {
            return new storage_1.Storage(new storage_2.SQLiteStorageDatabase(this.path ?? storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH, {
                logging: this.createLoggingOptions()
            }), !this.path ? { hint: storage_1.StorageHint.STORAGE_IN_MEMORY } : undefined);
        }
    }
    class ProfileStorageMain extends BaseProfileAwareStorageMain {
        constructor(profile, options, logService, fileService) {
            super(profile, options, logService, fileService);
        }
    }
    exports.ProfileStorageMain = ProfileStorageMain;
    class ApplicationStorageMain extends BaseProfileAwareStorageMain {
        constructor(options, userDataProfileService, logService, fileService) {
            super(userDataProfileService.defaultProfile, options, logService, fileService);
        }
        async doInit(storage) {
            await super.doInit(storage);
            // Apply telemetry values as part of the application storage initialization
            this.updateTelemetryState(storage);
        }
        updateTelemetryState(storage) {
            // First session date (once)
            const firstSessionDate = storage.get(telemetry_1.firstSessionDateStorageKey, undefined);
            if (firstSessionDate === undefined) {
                storage.set(telemetry_1.firstSessionDateStorageKey, new Date().toUTCString());
            }
            // Last / current session (always)
            // previous session date was the "current" one at that time
            // current session date is "now"
            const lastSessionDate = storage.get(telemetry_1.currentSessionDateStorageKey, undefined);
            const currentSessionDate = new Date().toUTCString();
            storage.set(telemetry_1.lastSessionDateStorageKey, typeof lastSessionDate === 'undefined' ? null : lastSessionDate);
            storage.set(telemetry_1.currentSessionDateStorageKey, currentSessionDate);
        }
    }
    exports.ApplicationStorageMain = ApplicationStorageMain;
    class WorkspaceStorageMain extends BaseStorageMain {
        static { this.WORKSPACE_STORAGE_NAME = 'state.vscdb'; }
        static { this.WORKSPACE_META_NAME = 'workspace.json'; }
        get path() {
            if (!this.options.useInMemoryStorage) {
                return (0, path_1.join)(this.environmentService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath, this.workspace.id, WorkspaceStorageMain.WORKSPACE_STORAGE_NAME);
            }
            return undefined;
        }
        constructor(workspace, options, logService, environmentService, fileService) {
            super(logService, fileService);
            this.workspace = workspace;
            this.options = options;
            this.environmentService = environmentService;
        }
        async doCreate() {
            const { storageFilePath, wasCreated } = await this.prepareWorkspaceStorageFolder();
            return new storage_1.Storage(new storage_2.SQLiteStorageDatabase(storageFilePath, {
                logging: this.createLoggingOptions()
            }), { hint: this.options.useInMemoryStorage ? storage_1.StorageHint.STORAGE_IN_MEMORY : wasCreated ? storage_1.StorageHint.STORAGE_DOES_NOT_EXIST : undefined });
        }
        async prepareWorkspaceStorageFolder() {
            // Return early if using inMemory storage
            if (this.options.useInMemoryStorage) {
                return { storageFilePath: storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH, wasCreated: true };
            }
            // Otherwise, ensure the storage folder exists on disk
            const workspaceStorageFolderPath = (0, path_1.join)(this.environmentService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath, this.workspace.id);
            const workspaceStorageDatabasePath = (0, path_1.join)(workspaceStorageFolderPath, WorkspaceStorageMain.WORKSPACE_STORAGE_NAME);
            const storageExists = await pfs_1.Promises.exists(workspaceStorageFolderPath);
            if (storageExists) {
                return { storageFilePath: workspaceStorageDatabasePath, wasCreated: false };
            }
            // Ensure storage folder exists
            await pfs_1.Promises.mkdir(workspaceStorageFolderPath, { recursive: true });
            // Write metadata into folder (but do not await)
            this.ensureWorkspaceStorageFolderMeta(workspaceStorageFolderPath);
            return { storageFilePath: workspaceStorageDatabasePath, wasCreated: true };
        }
        async ensureWorkspaceStorageFolderMeta(workspaceStorageFolderPath) {
            let meta = undefined;
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(this.workspace)) {
                meta = { folder: this.workspace.uri.toString() };
            }
            else if ((0, workspace_1.isWorkspaceIdentifier)(this.workspace)) {
                meta = { workspace: this.workspace.configPath.toString() };
            }
            if (meta) {
                try {
                    const workspaceStorageMetaPath = (0, path_1.join)(workspaceStorageFolderPath, WorkspaceStorageMain.WORKSPACE_META_NAME);
                    const storageExists = await pfs_1.Promises.exists(workspaceStorageMetaPath);
                    if (!storageExists) {
                        await pfs_1.Promises.writeFile(workspaceStorageMetaPath, JSON.stringify(meta, undefined, 2));
                    }
                }
                catch (error) {
                    this.logService.error(`[storage main] ensureWorkspaceStorageFolderMeta(): Unable to create workspace storage metadata due to ${error}`);
                }
            }
        }
    }
    exports.WorkspaceStorageMain = WorkspaceStorageMain;
    class InMemoryStorageMain extends BaseStorageMain {
        get path() {
            return undefined; // in-memory has no path
        }
        async doCreate() {
            return new storage_1.Storage(new storage_1.InMemoryStorageDatabase(), { hint: storage_1.StorageHint.STORAGE_IN_MEMORY });
        }
    }
    exports.InMemoryStorageMain = InMemoryStorageMain;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZU1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9zdG9yYWdlL2VsZWN0cm9uLW1haW4vc3RvcmFnZU1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK0doRyxNQUFlLGVBQWdCLFNBQVEsc0JBQVU7aUJBRXhCLDZCQUF3QixHQUFHLElBQUksQUFBUCxDQUFRO1FBU3hELElBQUksT0FBTyxLQUFlLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFXakQsWUFDb0IsVUFBdUIsRUFDekIsV0FBeUI7WUFFMUMsS0FBSyxFQUFFLENBQUM7WUFIVyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3pCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBcEJ4Qix3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF1QixDQUFDLENBQUM7WUFDbkYsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztZQUU1Qyx1QkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNqRSxzQkFBaUIsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBRW5ELGFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksaUJBQU8sQ0FBQyxJQUFJLGlDQUF1QixFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUscUJBQVcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLHlDQUF5QztZQUt6SixzQkFBaUIsR0FBOEIsU0FBUyxDQUFDO1lBRWhELG9CQUFlLEdBQUcsSUFBSSx1QkFBZSxFQUFRLENBQUM7WUFDdEQsYUFBUSxHQUFHLElBQUksQ0FBQyxl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