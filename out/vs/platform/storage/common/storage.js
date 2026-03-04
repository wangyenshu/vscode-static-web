/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/performance", "vs/base/common/types", "vs/base/parts/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, async_1, event_1, lifecycle_1, performance_1, types_1, storage_1, instantiation_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryStorageService = exports.AbstractStorageService = exports.StorageTarget = exports.StorageScope = exports.WillSaveStateReason = exports.IStorageService = exports.TARGET_KEY = exports.IS_NEW_KEY = void 0;
    exports.loadKeyTargets = loadKeyTargets;
    exports.isProfileUsingDefaultStorage = isProfileUsingDefaultStorage;
    exports.logStorage = logStorage;
    exports.IS_NEW_KEY = '__$__isNewStorageMarker';
    exports.TARGET_KEY = '__$__targetStorageMarker';
    exports.IStorageService = (0, instantiation_1.createDecorator)('storageService');
    var WillSaveStateReason;
    (function (WillSaveStateReason) {
        /**
         * No specific reason to save state.
         */
        WillSaveStateReason[WillSaveStateReason["NONE"] = 0] = "NONE";
        /**
         * A hint that the workbench is about to shutdown.
         */
        WillSaveStateReason[WillSaveStateReason["SHUTDOWN"] = 1] = "SHUTDOWN";
    })(WillSaveStateReason || (exports.WillSaveStateReason = WillSaveStateReason = {}));
    var StorageScope;
    (function (StorageScope) {
        /**
         * The stored data will be scoped to all workspaces across all profiles.
         */
        StorageScope[StorageScope["APPLICATION"] = -1] = "APPLICATION";
        /**
         * The stored data will be scoped to all workspaces of the same profile.
         */
        StorageScope[StorageScope["PROFILE"] = 0] = "PROFILE";
        /**
         * The stored data will be scoped to the current workspace.
         */
        StorageScope[StorageScope["WORKSPACE"] = 1] = "WORKSPACE";
    })(StorageScope || (exports.StorageScope = StorageScope = {}));
    var StorageTarget;
    (function (StorageTarget) {
        /**
         * The stored data is user specific and applies across machines.
         */
        StorageTarget[StorageTarget["USER"] = 0] = "USER";
        /**
         * The stored data is machine specific.
         */
        StorageTarget[StorageTarget["MACHINE"] = 1] = "MACHINE";
    })(StorageTarget || (exports.StorageTarget = StorageTarget = {}));
    function loadKeyTargets(storage) {
        const keysRaw = storage.get(exports.TARGET_KEY);
        if (keysRaw) {
            try {
                return JSON.parse(keysRaw);
            }
            catch (error) {
                // Fail gracefully
            }
        }
        return Object.create(null);
    }
    class AbstractStorageService extends lifecycle_1.Disposable {
        static { this.DEFAULT_FLUSH_INTERVAL = 60 * 1000; } // every minute
        constructor(options = { flushInterval: AbstractStorageService.DEFAULT_FLUSH_INTERVAL }) {
            super();
            this.options = options;
            this._onDidChangeValue = this._register(new event_1.PauseableEmitter());
            this._onDidChangeTarget = this._register(new event_1.PauseableEmitter());
            this.onDidChangeTarget = this._onDidChangeTarget.event;
            this._onWillSaveState = this._register(new event_1.Emitter());
            this.onWillSaveState = this._onWillSaveState.event;
            this.flushWhenIdleScheduler = this._register(new async_1.RunOnceScheduler(() => this.doFlushWhenIdle(), this.options.flushInterval));
            this.runFlushWhenIdle = this._register(new lifecycle_1.MutableDisposable());
            this._workspaceKeyTargets = undefined;
            this._profileKeyTargets = undefined;
            this._applicationKeyTargets = undefined;
        }
        onDidChangeValue(scope, key, disposable) {
            return event_1.Event.filter(this._onDidChangeValue.event, e => e.scope === scope && (key === undefined || e.key === key), disposable);
        }
        doFlushWhenIdle() {
            this.runFlushWhenIdle.value = (0, async_1.runWhenGlobalIdle)(() => {
                if (this.shouldFlushWhenIdle()) {
                    this.flush();
                }
                // repeat
                this.flushWhenIdleScheduler.schedule();
            });
        }
        shouldFlushWhenIdle() {
            return true;
        }
        stopFlushWhenIdle() {
            (0, lifecycle_1.dispose)([this.runFlushWhenIdle, this.flushWhenIdleScheduler]);
        }
        initialize() {
            if (!this.initializationPromise) {
                this.initializationPromise = (async () => {
                    // Init all storage locations
                    (0, performance_1.mark)('code/willInitStorage');
                    try {
                        await this.doInitialize(); // Ask subclasses to initialize storage
                    }
                    finally {
                        (0, performance_1.mark)('code/didInitStorage');
                    }
                    // On some OS we do not get enough time to persist state on shutdown (e.g. when
                    // Windows restarts after applying updates). In other cases, VSCode might crash,
                    // so we periodically save state to reduce the chance of loosing any state.
                    // In the browser we do not have support for long running unload sequences. As such,
                    // we cannot ask for saving state in that moment, because that would result in a
                    // long running operation.
                    // Instead, periodically ask customers to save save. The library will be clever enough
                    // to only save state that has actually changed.
                    this.flushWhenIdleScheduler.schedule();
                })();
            }
            return this.initializationPromise;
        }
        emitDidChangeValue(scope, event) {
            const { key, external } = event;
            // Specially handle `TARGET_KEY`
            if (key === exports.TARGET_KEY) {
                // Clear our cached version which is now out of date
                switch (scope) {
                    case -1 /* StorageScope.APPLICATION */:
                        this._applicationKeyTargets = undefined;
                        break;
                    case 0 /* StorageScope.PROFILE */:
                        this._profileKeyTargets = undefined;
                        break;
                    case 1 /* StorageScope.WORKSPACE */:
                        this._workspaceKeyTargets = undefined;
                        break;
                }
                // Emit as `didChangeTarget` event
                this._onDidChangeTarget.fire({ scope });
            }
            // Emit any other key to outside
            else {
                this._onDidChangeValue.fire({ scope, key, target: this.getKeyTargets(scope)[key], external });
            }
        }
        emitWillSaveState(reason) {
            this._onWillSaveState.fire({ reason });
        }
        get(key, scope, fallbackValue) {
            return this.getStorage(scope)?.get(key, fallbackValue);
        }
        getBoolean(key, scope, fallbackValue) {
            return this.getStorage(scope)?.getBoolean(key, fallbackValue);
        }
        getNumber(key, scope, fallbackValue) {
            return this.getStorage(scope)?.getNumber(key, fallbackValue);
        }
        getObject(key, scope, fallbackValue) {
            return this.getStorage(scope)?.getObject(key, fallbackValue);
        }
        storeAll(entries, external) {
            this.withPausedEmitters(() => {
                for (const entry of entries) {
                    this.store(entry.key, entry.value, entry.scope, entry.target, external);
                }
            });
        }
        store(key, value, scope, target, external = false) {
            // We remove the key for undefined/null values
            if ((0, types_1.isUndefinedOrNull)(value)) {
                this.remove(key, scope, external);
                return;
            }
            // Update our datastructures but send events only after
            this.withPausedEmitters(() => {
                // Update key-target map
                this.updateKeyTarget(key, scope, target);
                // Store actual value
                this.getStorage(scope)?.set(key, value, external);
            });
        }
        remove(key, scope, external = false) {
            // Update our datastructures but send events only after
            this.withPausedEmitters(() => {
                // Update key-target map
                this.updateKeyTarget(key, scope, undefined);
                // Remove actual key
                this.getStorage(scope)?.delete(key, external);
            });
        }
        withPausedEmitters(fn) {
            // Pause emitters
            this._onDidChangeValue.pause();
            this._onDidChangeTarget.pause();
            try {
                fn();
            }
            finally {
                // Resume emitters
                this._onDidChangeValue.resume();
                this._onDidChangeTarget.resume();
            }
        }
        keys(scope, target) {
            const keys = [];
            const keyTargets = this.getKeyTargets(scope);
            for (const key of Object.keys(keyTargets)) {
                const keyTarget = keyTargets[key];
                if (keyTarget === target) {
                    keys.push(key);
                }
            }
            return keys;
        }
        updateKeyTarget(key, scope, target, external = false) {
            // Add
            const keyTargets = this.getKeyTargets(scope);
            if (typeof target === 'number') {
                if (keyTargets[key] !== target) {
                    keyTargets[key] = target;
                    this.getStorage(scope)?.set(exports.TARGET_KEY, JSON.stringify(keyTargets), external);
                }
            }
            // Remove
            else {
                if (typeof keyTargets[key] === 'number') {
                    delete keyTargets[key];
                    this.getStorage(scope)?.set(exports.TARGET_KEY, JSON.stringify(keyTargets), external);
                }
            }
        }
        get workspaceKeyTargets() {
            if (!this._workspaceKeyTargets) {
                this._workspaceKeyTargets = this.loadKeyTargets(1 /* StorageScope.WORKSPACE */);
            }
            return this._workspaceKeyTargets;
        }
        get profileKeyTargets() {
            if (!this._profileKeyTargets) {
                this._profileKeyTargets = this.loadKeyTargets(0 /* StorageScope.PROFILE */);
            }
            return this._profileKeyTargets;
        }
        get applicationKeyTargets() {
            if (!this._applicationKeyTargets) {
                this._applicationKeyTargets = this.loadKeyTargets(-1 /* StorageScope.APPLICATION */);
            }
            return this._applicationKeyTargets;
        }
        getKeyTargets(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return this.applicationKeyTargets;
                case 0 /* StorageScope.PROFILE */:
                    return this.profileKeyTargets;
                default:
                    return this.workspaceKeyTargets;
            }
        }
        loadKeyTargets(scope) {
            const storage = this.getStorage(scope);
            return storage ? loadKeyTargets(storage) : Object.create(null);
        }
        isNew(scope) {
            return this.getBoolean(exports.IS_NEW_KEY, scope) === true;
        }
        async flush(reason = WillSaveStateReason.NONE) {
            // Signal event to collect changes
            this._onWillSaveState.fire({ reason });
            const applicationStorage = this.getStorage(-1 /* StorageScope.APPLICATION */);
            const profileStorage = this.getStorage(0 /* StorageScope.PROFILE */);
            const workspaceStorage = this.getStorage(1 /* StorageScope.WORKSPACE */);
            switch (reason) {
                // Unspecific reason: just wait when data is flushed
                case WillSaveStateReason.NONE:
                    await async_1.Promises.settled([
                        applicationStorage?.whenFlushed() ?? Promise.resolve(),
                        profileStorage?.whenFlushed() ?? Promise.resolve(),
                        workspaceStorage?.whenFlushed() ?? Promise.resolve()
                    ]);
                    break;
                // Shutdown: we want to flush as soon as possible
                // and not hit any delays that might be there
                case WillSaveStateReason.SHUTDOWN:
                    await async_1.Promises.settled([
                        applicationStorage?.flush(0) ?? Promise.resolve(),
                        profileStorage?.flush(0) ?? Promise.resolve(),
                        workspaceStorage?.flush(0) ?? Promise.resolve()
                    ]);
                    break;
            }
        }
        async log() {
            const applicationItems = this.getStorage(-1 /* StorageScope.APPLICATION */)?.items ?? new Map();
            const profileItems = this.getStorage(0 /* StorageScope.PROFILE */)?.items ?? new Map();
            const workspaceItems = this.getStorage(1 /* StorageScope.WORKSPACE */)?.items ?? new Map();
            return logStorage(applicationItems, profileItems, workspaceItems, this.getLogDetails(-1 /* StorageScope.APPLICATION */) ?? '', this.getLogDetails(0 /* StorageScope.PROFILE */) ?? '', this.getLogDetails(1 /* StorageScope.WORKSPACE */) ?? '');
        }
        async optimize(scope) {
            // Await pending data to be flushed to the DB
            // before attempting to optimize the DB
            await this.flush();
            return this.getStorage(scope)?.optimize();
        }
        async switch(to, preserveData) {
            // Signal as event so that clients can store data before we switch
            this.emitWillSaveState(WillSaveStateReason.NONE);
            if ((0, userDataProfile_1.isUserDataProfile)(to)) {
                return this.switchToProfile(to, preserveData);
            }
            return this.switchToWorkspace(to, preserveData);
        }
        canSwitchProfile(from, to) {
            if (from.id === to.id) {
                return false; // both profiles are same
            }
            if (isProfileUsingDefaultStorage(to) && isProfileUsingDefaultStorage(from)) {
                return false; // both profiles are using default
            }
            return true;
        }
        switchData(oldStorage, newStorage, scope) {
            this.withPausedEmitters(() => {
                // Signal storage keys that have changed
                const handledkeys = new Set();
                for (const [key, oldValue] of oldStorage) {
                    handledkeys.add(key);
                    const newValue = newStorage.get(key);
                    if (newValue !== oldValue) {
                        this.emitDidChangeValue(scope, { key, external: true });
                    }
                }
                for (const [key] of newStorage.items) {
                    if (!handledkeys.has(key)) {
                        this.emitDidChangeValue(scope, { key, external: true });
                    }
                }
            });
        }
    }
    exports.AbstractStorageService = AbstractStorageService;
    function isProfileUsingDefaultStorage(profile) {
        return profile.isDefault || !!profile.useDefaultFlags?.globalState;
    }
    class InMemoryStorageService extends AbstractStorageService {
        constructor() {
            super();
            this.applicationStorage = this._register(new storage_1.Storage(new storage_1.InMemoryStorageDatabase(), { hint: storage_1.StorageHint.STORAGE_IN_MEMORY }));
            this.profileStorage = this._register(new storage_1.Storage(new storage_1.InMemoryStorageDatabase(), { hint: storage_1.StorageHint.STORAGE_IN_MEMORY }));
            this.workspaceStorage = this._register(new storage_1.Storage(new storage_1.InMemoryStorageDatabase(), { hint: storage_1.StorageHint.STORAGE_IN_MEMORY }));
            this._register(this.workspaceStorage.onDidChangeStorage(e => this.emitDidChangeValue(1 /* StorageScope.WORKSPACE */, e)));
            this._register(this.profileStorage.onDidChangeStorage(e => this.emitDidChangeValue(0 /* StorageScope.PROFILE */, e)));
            this._register(this.applicationStorage.onDidChangeStorage(e => this.emitDidChangeValue(-1 /* StorageScope.APPLICATION */, e)));
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
                    return 'inMemory (application)';
                case 0 /* StorageScope.PROFILE */:
                    return 'inMemory (profile)';
                default:
                    return 'inMemory (workspace)';
            }
        }
        async doInitialize() { }
        async switchToProfile() {
            // no-op when in-memory
        }
        async switchToWorkspace() {
            // no-op when in-memory
        }
        shouldFlushWhenIdle() {
            return false;
        }
        hasScope(scope) {
            return false;
        }
    }
    exports.InMemoryStorageService = InMemoryStorageService;
    async function logStorage(application, profile, workspace, applicationPath, profilePath, workspacePath) {
        const safeParse = (value) => {
            try {
                return JSON.parse(value);
            }
            catch (error) {
                return value;
            }
        };
        const applicationItems = new Map();
        const applicationItemsParsed = new Map();
        application.forEach((value, key) => {
            applicationItems.set(key, value);
            applicationItemsParsed.set(key, safeParse(value));
        });
        const profileItems = new Map();
        const profileItemsParsed = new Map();
        profile.forEach((value, key) => {
            profileItems.set(key, value);
            profileItemsParsed.set(key, safeParse(value));
        });
        const workspaceItems = new Map();
        const workspaceItemsParsed = new Map();
        workspace.forEach((value, key) => {
            workspaceItems.set(key, value);
            workspaceItemsParsed.set(key, safeParse(value));
        });
        if (applicationPath !== profilePath) {
            console.group(`Storage: Application (path: ${applicationPath})`);
        }
        else {
            console.group(`Storage: Application & Profile (path: ${applicationPath}, default profile)`);
        }
        const applicationValues = [];
        applicationItems.forEach((value, key) => {
            applicationValues.push({ key, value });
        });
        console.table(applicationValues);
        console.groupEnd();
        console.log(applicationItemsParsed);
        if (applicationPath !== profilePath) {
            console.group(`Storage: Profile (path: ${profilePath}, profile specific)`);
            const profileValues = [];
            profileItems.forEach((value, key) => {
                profileValues.push({ key, value });
            });
            console.table(profileValues);
            console.groupEnd();
            console.log(profileItemsParsed);
        }
        console.group(`Storage: Workspace (path: ${workspacePath})`);
        const workspaceValues = [];
        workspaceItems.forEach((value, key) => {
            workspaceValues.push({ key, value });
        });
        console.table(workspaceValues);
        console.groupEnd();
        console.log(workspaceItemsParsed);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3N0b3JhZ2UvY29tbW9uL3N0b3JhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMFNoRyx3Q0FXQztJQW9ZRCxvRUFFQztJQXlERCxnQ0FpRUM7SUF6eUJZLFFBQUEsVUFBVSxHQUFHLHlCQUF5QixDQUFDO0lBQ3ZDLFFBQUEsVUFBVSxHQUFHLDBCQUEwQixDQUFDO0lBRXhDLFFBQUEsZUFBZSxHQUFHLElBQUEsK0JBQWUsRUFBa0IsZ0JBQWdCLENBQUMsQ0FBQztJQUVsRixJQUFZLG1CQVdYO0lBWEQsV0FBWSxtQkFBbUI7UUFFOUI7O1dBRUc7UUFDSCw2REFBSSxDQUFBO1FBRUo7O1dBRUc7UUFDSCxxRUFBUSxDQUFBO0lBQ1QsQ0FBQyxFQVhXLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBVzlCO0lBK0xELElBQWtCLFlBZ0JqQjtJQWhCRCxXQUFrQixZQUFZO1FBRTdCOztXQUVHO1FBQ0gsOERBQWdCLENBQUE7UUFFaEI7O1dBRUc7UUFDSCxxREFBVyxDQUFBO1FBRVg7O1dBRUc7UUFDSCx5REFBYSxDQUFBO0lBQ2QsQ0FBQyxFQWhCaUIsWUFBWSw0QkFBWixZQUFZLFFBZ0I3QjtJQUVELElBQWtCLGFBV2pCO0lBWEQsV0FBa0IsYUFBYTtRQUU5Qjs7V0FFRztRQUNILGlEQUFJLENBQUE7UUFFSjs7V0FFRztRQUNILHVEQUFPLENBQUE7SUFDUixDQUFDLEVBWGlCLGFBQWEsNkJBQWIsYUFBYSxRQVc5QjtJQWtERCxTQUFnQixjQUFjLENBQUMsT0FBaUI7UUFDL0MsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBVSxDQUFDLENBQUM7UUFDeEMsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNiLElBQUks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