/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/performance"], function (require, exports, errorMessage_1, errors_1, performance_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexedDB = exports.DBClosedError = void 0;
    class MissingStoresError extends Error {
        constructor(db) {
            super('Missing stores');
            this.db = db;
        }
    }
    class DBClosedError extends Error {
        constructor(dbName) {
            super(`IndexedDB database '${dbName}' is closed.`);
            this.code = 'DBClosed';
        }
    }
    exports.DBClosedError = DBClosedError;
    class IndexedDB {
        static async create(name, version, stores) {
            const database = await IndexedDB.openDatabase(name, version, stores);
            return new IndexedDB(database, name);
        }
        static async openDatabase(name, version, stores) {
            (0, performance_1.mark)(`code/willOpenDatabase/${name}`);
            try {
                return await IndexedDB.doOpenDatabase(name, version, stores);
            }
            catch (err) {
                if (err instanceof MissingStoresError) {
                    console.info(`Attempting to recreate the IndexedDB once.`, name);
                    try {
                        // Try to delete the db
                        await IndexedDB.deleteDatabase(err.db);
                    }
                    catch (error) {
                        console.error(`Error while deleting the IndexedDB`, (0, errors_1.getErrorMessage)(error));
                        throw error;
                    }
                    return await IndexedDB.doOpenDatabase(name, version, stores);
                }
                throw err;
            }
            finally {
                (0, performance_1.mark)(`code/didOpenDatabase/${name}`);
            }
        }
        static doOpenDatabase(name, version, stores) {
            return new Promise((c, e) => {
                const request = indexedDB.open(name, version);
                request.onerror = () => e(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    for (const store of stores) {
                        if (!db.objectStoreNames.contains(store)) {
                            console.error(`Error while opening IndexedDB. Could not find '${store}'' object store`);
                            e(new MissingStoresError(db));
                            return;
                        }
                    }
                    c(db);
                };
                request.onupgradeneeded = () => {
                    const db = request.result;
                    for (const store of stores) {
                        if (!db.objectStoreNames.contains(store)) {
                            db.createObjectStore(store);
                        }
                    }
                };
            });
        }
        static deleteDatabase(database) {
            return new Promise((c, e) => {
                // Close any opened connections
                database.close();
                // Delete the db
                const deleteRequest = indexedDB.deleteDatabase(database.name);
                deleteRequest.onerror = (err) => e(deleteRequest.error);
                deleteRequest.onsuccess = () => c();
            });
        }
        constructor(database, name) {
            this.name = name;
            this.database = null;
            this.pendingTransactions = [];
            this.database = database;
        }
        hasPendingTransactions() {
            return this.pendingTransactions.length > 0;
        }
        close() {
            if (this.pendingTransactions.length) {
                this.pendingTransactions.splice(0, this.pendingTransactions.length).forEach(transaction => transaction.abort());
            }
            this.database?.close();
            this.database = null;
        }
        async runInTransaction(store, transactionMode, dbRequestFn) {
            if (!this.database) {
                throw new DBClosedError(this.name);
            }
            const transaction = this.database.transaction(store, transactionMode);
            this.pendingTransactions.push(transaction);
            return new Promise((c, e) => {
                transaction.oncomplete = () => {
                    if (Array.isArray(request)) {
                        c(request.map(r => r.result));
                    }
                    else {
                        c(request.result);
                    }
                };
                transaction.onerror = () => e(transaction.error ? errors_1.ErrorNoTelemetry.fromError(transaction.error) : new errors_1.ErrorNoTelemetry('unknown error'));
                transaction.onabort = () => e(transaction.error ? errors_1.ErrorNoTelemetry.fromError(transaction.error) : new errors_1.ErrorNoTelemetry('unknown error'));
                const request = dbRequestFn(transaction.objectStore(store));
            }).finally(() => this.pendingTransactions.splice(this.pendingTransactions.indexOf(transaction), 1));
        }
        async getKeyValues(store, isValid) {
            if (!this.database) {
                throw new DBClosedError(this.name);
            }
            const transaction = this.database.transaction(store, 'readonly');
            this.pendingTransactions.push(transaction);
            return new Promise(resolve => {
                const items = new Map();
                const objectStore = transaction.objectStore(store);
                // Open a IndexedDB Cursor to iterate over key/values
                const cursor = objectStore.openCursor();
                if (!cursor) {
                    return resolve(items); // this means the `ItemTable` was empty
                }
                // Iterate over rows of `ItemTable` until the end
                cursor.onsuccess = () => {
                    if (cursor.result) {
                        // Keep cursor key/value in our map
                        if (isValid(cursor.result.value)) {
                            items.set(cursor.result.key.toString(), cursor.result.value);
                        }
                        // Advance cursor to next row
                        cursor.result.continue();
                    }
                    else {
                        resolve(items); // reached end of table
                    }
                };
                // Error handlers
                const onError = (error) => {
                    console.error(`IndexedDB getKeyValues(): ${(0, errorMessage_1.toErrorMessage)(error, true)}`);
                    resolve(items);
                };
                cursor.onerror = () => onError(cursor.error);
                transaction.onerror = () => onError(transaction.error);
            }).finally(() => this.pendingTransactions.splice(this.pendingTransactions.indexOf(transaction), 1));
        }
    }
    exports.IndexedDB = IndexedDB;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlZERCLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL2luZGV4ZWREQi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBTSxrQkFBbUIsU0FBUSxLQUFLO1FBQ3JDLFlBQXFCLEVBQWU7WUFDbkMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFESixPQUFFLEdBQUYsRUFBRSxDQUFhO1FBRXBDLENBQUM7S0FDRDtJQUVELE1BQWEsYUFBYyxTQUFRLEtBQUs7UUFFdkMsWUFBWSxNQUFjO1lBQ3pCLEtBQUssQ0FBQyx1QkFBdUIsTUFBTSxjQUFjLENBQUMsQ0FBQztZQUYzQyxTQUFJLEdBQUcsVUFBVSxDQUFDO1FBRzNCLENBQUM7S0FDRDtJQUxELHNDQUtDO0lBRUQsTUFBYSxTQUFTO1FBRXJCLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQVksRUFBRSxPQUEyQixFQUFFLE1BQWdCO1lBQzlFLE1BQU0sUUFBUSxHQUFHLE1BQU0sU0FBUyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3JFLE9BQU8sSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFTyxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFZLEVBQUUsT0FBMkIsRUFBRSxNQUFnQjtZQUM1RixJQUFBLGtCQUFJLEVBQUMseUJBQXlCLElBQUksRUFBRSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDO2dCQUNKLE9BQU8sTUFBTSxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFF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