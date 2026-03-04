/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/types"], function (require, exports, async_1, event_1, lifecycle_1, marshalling_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryStorageDatabase = exports.Storage = exports.StorageState = exports.StorageHint = void 0;
    exports.isStorageItemsChangeEvent = isStorageItemsChangeEvent;
    var StorageHint;
    (function (StorageHint) {
        // A hint to the storage that the storage
        // does not exist on disk yet. This allows
        // the storage library to improve startup
        // time by not checking the storage for data.
        StorageHint[StorageHint["STORAGE_DOES_NOT_EXIST"] = 0] = "STORAGE_DOES_NOT_EXIST";
        // A hint to the storage that the storage
        // is backed by an in-memory storage.
        StorageHint[StorageHint["STORAGE_IN_MEMORY"] = 1] = "STORAGE_IN_MEMORY";
    })(StorageHint || (exports.StorageHint = StorageHint = {}));
    function isStorageItemsChangeEvent(thing) {
        const candidate = thing;
        return candidate?.changed instanceof Map || candidate?.deleted instanceof Set;
    }
    var StorageState;
    (function (StorageState) {
        StorageState[StorageState["None"] = 0] = "None";
        StorageState[StorageState["Initialized"] = 1] = "Initialized";
        StorageState[StorageState["Closed"] = 2] = "Closed";
    })(StorageState || (exports.StorageState = StorageState = {}));
    class Storage extends lifecycle_1.Disposable {
        static { this.DEFAULT_FLUSH_DELAY = 100; }
        constructor(database, options = Object.create(null)) {
            super();
            this.database = database;
            this.options = options;
            this._onDidChangeStorage = this._register(new event_1.PauseableEmitter());
            this.onDidChangeStorage = this._onDidChangeStorage.event;
            this.state = StorageState.None;
            this.cache = new Map();
            this.flushDelayer = this._register(new async_1.ThrottledDelayer(Storage.DEFAULT_FLUSH_DELAY));
            this.pendingDeletes = new Set();
            this.pendingInserts = new Map();
            this.pendingClose = undefined;
            this.whenFlushedCallbacks = [];
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.database.onDidChangeItemsExternal(e => this.onDidChangeItemsExternal(e)));
        }
        onDidChangeItemsExternal(e) {
            this._onDidChangeStorage.pause();
            try {
                // items that change external require us to update our
                // caches with the values. we just accept the value and
                // emit an event if there is a change.
                e.changed?.forEach((value, key) => this.acceptExternal(key, value));
                e.deleted?.forEach(key => this.acceptExternal(key, undefined));
            }
            finally {
                this._onDidChangeStorage.resume();
            }
        }
        acceptExternal(key, value) {
            if (this.state === StorageState.Closed) {
                return; // Return early if we are already closed
            }
            let changed = false;
            // Item got removed, check for deletion
            if ((0, types_1.isUndefinedOrNull)(value)) {
                changed = this.cache.delete(key);
            }
            // Item got updated, check for change
            else {
                const currentValue = this.cache.get(key);
                if (currentValue !== value) {
                    this.cache.set(key, value);
                    changed = true;
                }
            }
            // Signal to outside listeners
            if (changed) {
                this._onDidChangeStorage.fire({ key, external: true });
            }
        }
        get items() {
            return this.cache;
        }
        get size() {
            return this.cache.size;
        }
        async init() {
            if (this.state !== StorageState.None) {
                return; // either closed or already initialized
            }
            this.state = StorageState.Initialized;
            if (this.options.hint === StorageHint.STORAGE_DOES_NOT_EXIST) {
                // return early if we know the storage file does not exist. this is a performance
                // optimization to not load all items of the underlying storage if we know that
                // there can be no items because the storage does not exist.
                return;
            }
            this.cache = await this.database.getItems();
        }
        get(key, fallbackValue) {
            const value = this.cache.get(key);
            if ((0, types_1.isUndefinedOrNull)(value)) {
                return fallbackValue;
            }
            return value;
        }
        getBoolean(key, fallbackValue) {
            const value = this.get(key);
            if ((0, types_1.isUndefinedOrNull)(value)) {
                return fallbackValue;
            }
            return value === 'true';
        }
        getNumber(key, fallbackValue) {
            const value = this.get(key);
            if ((0, types_1.isUndefinedOrNull)(value)) {
                return fallbackValue;
            }
            return parseInt(value, 10);
        }
        getObject(key, fallbackValue) {
            const value = this.get(key);
            if ((0, types_1.isUndefinedOrNull)(value)) {
                return fallbackValue;
            }
            return (0, marshalling_1.parse)(value);
        }
        async set(key, value, external = false) {
            if (this.state === StorageState.Closed) {
                return; // Return early if we are already closed
            }
            // We remove the key for undefined/null values
            if ((0, types_1.isUndefinedOrNull)(value)) {
                return this.delete(key, external);
            }
            // Otherwise, convert to String and store
            const valueStr = (0, types_1.isObject)(value) || Array.isArray(value) ? (0, marshalling_1.stringify)(value) : String(value);
            // Return early if value already set
            const currentValue = this.cache.get(key);
            if (currentValue === valueStr) {
                return;
            }
            // Update in cache and pending
            this.cache.set(key, valueStr);
            this.pendingInserts.set(key, valueStr);
            this.pendingDeletes.delete(key);
            // Event
            this._onDidChangeStorage.fire({ key, external });
            // Accumulate work by scheduling after timeout
            return this.doFlush();
        }
        async delete(key, external = false) {
            if (this.state === StorageState.Closed) {
                return; // Return early if we are already closed
            }
            // Remove from cache and add to pending
            const wasDeleted = this.cache.delete(key);
            if (!wasDeleted) {
                return; // Return early if value already deleted
            }
            if (!this.pendingDeletes.has(key)) {
                this.pendingDeletes.add(key);
            }
            this.pendingInserts.delete(key);
            // Event
            this._onDidChangeStorage.fire({ key, external });
            // Accumulate work by scheduling after timeout
            return this.doFlush();
        }
        async optimize() {
            if (this.state === StorageState.Closed) {
                return; // Return early if we are already closed
            }
            // Await pending data to be flushed to the DB
            // before attempting to optimize the DB
            await this.flush(0);
            return this.database.optimize();
        }
        async close() {
            if (!this.pendingClose) {
                this.pendingClose = this.doClose();
            }
            return this.pendingClose;
        }
        async doClose() {
            // Update state
            this.state = StorageState.Closed;
            // Trigger new flush to ensure data is persisted and then close
            // even if there is an error flushing. We must always ensure
            // the DB is closed to avoid corruption.
            //
            // Recovery: we pass our cache over as recovery option in case
            // the DB is not healthy.
            try {
                await this.doFlush(0 /* as soon as possible */);
            }
            catch (error) {
                // Ignore
            }
            await this.database.close(() => this.cache);
        }
        get hasPending() {
            return this.pendingInserts.size > 0 || this.pendingDeletes.size > 0;
        }
        async flushPending() {
            if (!this.hasPending) {
                return; // return early if nothing to do
            }
            // Get pending data
            const updateRequest = { insert: this.pendingInserts, delete: this.pendingDeletes };
            // Reset pending data for next run
            this.pendingDeletes = new Set();
            this.pendingInserts = new Map();
            // Update in storage and release any
            // waiters we have once done
            return this.database.updateItems(updateRequest).finally(() => {
                if (!this.hasPending) {
                    while (this.whenFlushedCallbacks.length) {
                        this.whenFlushedCallbacks.pop()?.();
                    }
                }
            });
        }
        async flush(delay) {
            if (!this.hasPending) {
                return; // return early if nothing to do
            }
            return this.doFlush(delay);
        }
        async doFlush(delay) {
            if (this.options.hint === StorageHint.STORAGE_IN_MEMORY) {
                return this.flushPending(); // return early if in-memory
            }
            return this.flushDelayer.trigger(() => this.flushPending(), delay);
        }
        async whenFlushed() {
            if (!this.hasPending) {
                return; // return early if nothing to do
            }
            return new Promise(resolve => this.whenFlushedCallbacks.push(resolve));
        }
        isInMemory() {
            return this.options.hint === StorageHint.STORAGE_IN_MEMORY;
        }
    }
    exports.Storage = Storage;
    class InMemoryStorageDatabase {
        constructor() {
            this.onDidChangeItemsExternal = event_1.Event.None;
            this.items = new Map();
        }
        async getItems() {
            return this.items;
        }
        async updateItems(request) {
            request.insert?.forEach((value, key) => this.items.set(key, value));
            request.delete?.forEach(key => this.items.delete(key));
        }
        async optimize() { }
        async close() { }
    }
    exports.InMemoryStorageDatabase = InMemoryStorageDatabase;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvc3RvcmFnZS9jb21tb24vc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQ2hHLDhEQUlDO0lBL0JELElBQVksV0FXWDtJQVhELFdBQVksV0FBVztRQUV0Qix5Q0FBeUM7UUFDekMsMENBQTBDO1FBQzFDLHlDQUF5QztRQUN6Qyw2Q0FBNkM7UUFDN0MsaUZBQXNCLENBQUE7UUFFdEIseUNBQXlDO1FBQ3pDLHFDQUFxQztRQUNyQyx1RUFBaUIsQ0FBQTtJQUNsQixDQUFDLEVBWFcsV0FBVywyQkFBWCxXQUFXLFFBV3RCO0lBZ0JELFNBQWdCLHlCQUF5QixDQUFDLEtBQWM7UUFDdkQsTUFBTSxTQUFTLEdBQUcsS0FBNkMsQ0FBQztRQUVoRSxPQUFPLFNBQVMsRUFBRSxPQUFPLFlBQVksR0FBRyxJQUFJLFNBQVMsRUFBRSxPQUFPLFlBQVksR0FBRyxDQUFDO0lBQy9FLENBQUM7SUFrRUQsSUFBWSxZQUlYO0lBSkQsV0FBWSxZQUFZO1FBQ3ZCLCtDQUFJLENBQUE7UUFDSiw2REFBVyxDQUFBO1FBQ1gsbURBQU0sQ0FBQTtJQUNQLENBQUMsRUFKVyxZQUFZLDRCQUFaLFlBQVksUUFJdkI7SUFFRCxNQUFhLE9BQVEsU0FBUSxzQkFBVTtpQkFFZCx3QkFBbUIsR0FBRyxHQUFHLEFBQU4sQ0FBTztRQWtCbEQsWUFDb0IsUUFBMEIsRUFDNUIsVUFBMkIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFFL0QsS0FBSyxFQUFFLENBQUM7WUFIVyxhQUFRLEdBQVIsUUFBUSxDQUFrQjtZQUM1QixZQUFPLEdBQVAsT0FBTyxDQUF1QztZQWxCL0Msd0JBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdC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