/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/map", "vs/base/common/path", "vs/base/node/pfs"], function (require, exports, async_1, event_1, map_1, path_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SQLiteStorageDatabase = void 0;
    class SQLiteStorageDatabase {
        static { this.IN_MEMORY_PATH = ':memory:'; }
        get onDidChangeItemsExternal() { return event_1.Event.None; } // since we are the only client, there can be no external changes
        static { this.BUSY_OPEN_TIMEOUT = 2000; } // timeout in ms to retry when opening DB fails with SQLITE_BUSY
        static { this.MAX_HOST_PARAMETERS = 256; } // maximum number of parameters within a statement
        constructor(path, options = Object.create(null)) {
            this.path = path;
            this.options = options;
            this.name = (0, path_1.basename)(this.path);
            this.logger = new SQLiteStorageDatabaseLogger(this.options.logging);
            this.whenConnected = this.connect(this.path);
        }
        async getItems() {
            const connection = await this.whenConnected;
            const items = new Map();
            const rows = await this.all(connection, 'SELECT * FROM ItemTable');
            rows.forEach(row => items.set(row.key, row.value));
            if (this.logger.isTracing) {
                this.logger.trace(`[storage ${this.name}] getItems(): ${items.size} rows`);
            }
            return items;
        }
        async updateItems(request) {
            const connection = await this.whenConnected;
            return this.doUpdateItems(connection, request);
        }
        doUpdateItems(connection, request) {
            if (this.logger.isTracing) {
                this.logger.trace(`[storage ${this.name}] updateItems(): insert(${request.insert ? (0, map_1.mapToString)(request.insert) : '0'}), delete(${request.delete ? (0, map_1.setToString)(request.delete) : '0'})`);
            }
            return this.transaction(connection, () => {
                const toInsert = request.insert;
                const toDelete = request.delete;
                // INSERT
                if (toInsert && toInsert.size > 0) {
                    const keysValuesChunks = [];
                    keysValuesChunks.push([]); // seed with initial empty chunk
                    // Split key/values into chunks of SQLiteStorageDatabase.MAX_HOST_PARAMETERS
                    // so that we can efficiently run the INSERT with as many HOST parameters as possible
                    let currentChunkIndex = 0;
                    toInsert.forEach((value, key) => {
                        let keyValueChunk = keysValuesChunks[currentChunkIndex];
                        if (keyValueChunk.length > SQLiteStorageDatabase.MAX_HOST_PARAMETERS) {
                            currentChunkIndex++;
                            keyValueChunk = [];
                            keysValuesChunks.push(keyValueChunk);
                        }
                        keyValueChunk.push(key, value);
                    });
                    keysValuesChunks.forEach(keysValuesChunk => {
                        this.prepare(connection, `INSERT INTO ItemTable VALUES ${new Array(keysValuesChunk.length / 2).fill('(?,?)').join(',')}`, stmt => stmt.run(keysValuesChunk), () => {
                            const keys = [];
                            let length = 0;
                            toInsert.forEach((value, key) => {
                                keys.push(key);
                                length += value.length;
                            });
                            return `Keys: ${keys.join(', ')} Length: ${length}`;
                        });
                    });
                }
                // DELETE
                if (toDelete && toDelete.size) {
                    const keysChunks = [];
                    keysChunks.push([]); // seed with initial empty chunk
                    // Split keys into chunks of SQLiteStorageDatabase.MAX_HOST_PARAMETERS
                    // so that we can efficiently run the DELETE with as many HOST parameters
                    // as possible
                    let currentChunkIndex = 0;
                    toDelete.forEach(key => {
                        let keyChunk = keysChunks[currentChunkIndex];
                        if (keyChunk.length > SQLiteStorageDatabase.MAX_HOST_PARAMETERS) {
                            currentChunkIndex++;
                            keyChunk = [];
                            keysChunks.push(keyChunk);
                        }
                        keyChunk.push(key);
                    });
                    keysChunks.forEach(keysChunk => {
                        this.prepare(connection, `DELETE FROM ItemTable WHERE key IN (${new Array(keysChunk.length).fill('?').join(',')})`, stmt => stmt.run(keysChunk), () => {
                            const keys = [];
                            toDelete.forEach(key => {
                                keys.push(key);
                            });
                            return `Keys: ${keys.join(', ')}`;
                        });
                    });
                }
            });
        }
        async optimize() {
            this.logger.trace(`[storage ${this.name}] vacuum()`);
            const connection = await this.whenConnected;
            return this.exec(connection, 'VACUUM');
        }
        async close(recovery) {
            this.logger.trace(`[storage ${this.name}] close()`);
            const connection = await this.whenConnected;
            return this.doClose(connection, recovery);
        }
        doClose(connection, recovery) {
            return new Promise((resolve, reject) => {
                connection.db.close(closeError => {
                    if (closeError) {
                        this.handleSQLiteError(connection, `[storage ${this.name}] close(): ${closeError}`);
                    }
                    // Return early if this storage was created only in-memory
                    // e.g. when running tests we do not need to backup.
                    if (this.path === SQLiteStorageDatabase.IN_MEMORY_PATH) {
                        return resolve();
                    }
                    // If the DB closed successfully and we are not running in-memory
                    // and the DB did not get errors during runtime, make a backup
                    // of the DB so that we can use it as fallback in case the actual
                    // DB becomes corrupt in the future.
                    if (!connection.isErroneous && !connection.isInMemory) {
                        return this.backup().then(resolve, error => {
                            this.logger.error(`[storage ${this.name}] backup(): ${error}`);
                            return resolve(); // ignore failing backup
                        });
                    }
                    // Recovery: if we detected errors while using the DB or we are using
                    // an inmemory DB (as a fallback to not being able to open the DB initially)
                    // and we have a recovery function provided, we recreate the DB with this
                    // data to recover all known data without loss if possible.
                    if (typeof recovery === 'function') {
                        // Delete the existing DB. If the path does not exist or fails to
                        // be deleted, we do not try to recover anymore because we assume
                        // that the path is no longer writeable for us.
                        return pfs_1.Promises.unlink(this.path).then(() => {
                            // Re-open the DB fresh
                            return this.doConnect(this.path).then(recoveryConnection => {
                                const closeRecoveryConnection = () => {
                                    return this.doClose(recoveryConnection, undefined /* do not attempt to recover again */);
                                };
                                // Store items
                                return this.doUpdateItems(recoveryConnection, { insert: recovery() }).then(() => closeRecoveryConnection(), error => {
                                    // In case of an error updating items, still ensure to close the connection
                                    // to prevent SQLITE_BUSY errors when the connection is reestablished
                                    closeRecoveryConnection();
                                    return Promise.reject(error);
                                });
                            });
                        }).then(resolve, reject);
                    }
                    // Finally without recovery we just reject
                    return reject(closeError || new Error('Database has errors or is in-memory without recovery option'));
                });
            });
        }
        backup() {
            const backupPath = this.toBackupPath(this.path);
            return pfs_1.Promises.copy(this.path, backupPath, { preserveSymlinks: false });
        }
        toBackupPath(path) {
            return `${path}.backup`;
        }
        async checkIntegrity(full) {
            this.logger.trace(`[storage ${this.name}] checkIntegrity(full: ${full})`);
            const connection = await this.whenConnected;
            const row = await this.get(connection, full ? 'PRAGMA integrity_check' : 'PRAGMA quick_check');
            const integrity = full ? row['integrity_check'] : row['quick_check'];
            if (connection.isErroneous) {
                return `${integrity} (last error: ${connection.lastError})`;
            }
            if (connection.isInMemory) {
                return `${integrity} (in-memory!)`;
            }
            return integrity;
        }
        async connect(path, retryOnBusy = true) {
            this.logger.trace(`[storage ${this.name}] open(${path}, retryOnBusy: ${retryOnBusy})`);
            try {
                return await this.doConnect(path);
            }
            catch (error) {
                this.logger.error(`[storage ${this.name}] open(): Unable to open DB due to ${error}`);
                // SQLITE_BUSY should only arise if another process is locking the same DB we want
                // to open at that time. This typically never happens because a DB connection is
                // limited per window. However, in the event of a window reload, it may be possible
                // that the previous connection was not properly closed while the new connection is
                // already established.
                //
                // In this case we simply wait for some time and retry once to establish the connection.
                //
                if (error.code === 'SQLITE_BUSY' && retryOnBusy) {
                    await (0, async_1.timeout)(SQLiteStorageDatabase.BUSY_OPEN_TIMEOUT);
                    return this.connect(path, false /* not another retry */);
                }
                // Otherwise, best we can do is to recover from a backup if that exists, as such we
                // move the DB to a different filename and try to load from backup. If that fails,
                // a new empty DB is being created automatically.
                //
                // The final fallback is to use an in-memory DB which should only happen if the target
                // folder is really not writeable for us.
                //
                try {
                    await pfs_1.Promises.unlink(path);
                    try {
                        await pfs_1.Promises.rename(this.toBackupPath(path), path, false /* no retry */);
                    }
                    catch (error) {
                        // ignore
                    }
                    return await this.doConnect(path);
                }
                catch (error) {
                    this.logger.error(`[storage ${this.name}] open(): Unable to use backup due to ${error}`);
                    // In case of any error to open the DB, use an in-memory
                    // DB so that we always have a valid DB to talk to.
                    return this.doConnect(SQLiteStorageDatabase.IN_MEMORY_PATH);
                }
            }
        }
        handleSQLiteError(connection, msg) {
            connection.isErroneous = true;
            connection.lastError = msg;
            this.logger.error(msg);
        }
        doConnect(path) {
            return new Promise((resolve, reject) => {
                new Promise((resolve_1, reject_1) => { require(['@vscode/sqlite3'], resolve_1, reject_1); }).then(sqlite3 => {
                    const connection = {
                        db: new (this.logger.isTracing ? sqlite3.verbose().Database : sqlite3.Database)(path, (error) => {
                            if (error) {
                                return (connection.db && error.code !== 'SQLITE_CANTOPEN' /* https://github.com/TryGhost/node-sqlite3/issues/1617 */) ? connection.db.close(() => reject(error)) : reject(error);
                            }
                            // The following exec() statement serves two purposes:
                            // - create the DB if it does not exist yet
                            // - validate that the DB is not corrupt (the open() call does not throw otherwise)
                            return this.exec(connection, [
                                'PRAGMA user_version = 1;',
                                'CREATE TABLE IF NOT EXISTS ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB)'
                            ].join('')).then(() => {
                                return resolve(connection);
                            }, error => {
                                return connection.db.close(() => reject(error));
                            });
                        }),
                        isInMemory: path === SQLiteStorageDatabase.IN_MEMORY_PATH
                    };
                    // Errors
                    connection.db.on('error', error => this.handleSQLiteError(connection, `[storage ${this.name}] Error (event): ${error}`));
                    // Tracing
                    if (this.logger.isTracing) {
                        connection.db.on('trace', sql => this.logger.trace(`[storage ${this.name}] Trace (event): ${sql}`));
                    }
                }, reject);
            });
        }
        exec(connection, sql) {
            return new Promise((resolve, reject) => {
                connection.db.exec(sql, error => {
                    if (error) {
                        this.handleSQLiteError(connection, `[storage ${this.name}] exec(): ${error}`);
                        return reject(error);
                    }
                    return resolve();
                });
            });
        }
        get(connection, sql) {
            return new Promise((resolve, reject) => {
                connection.db.get(sql, (error, row) => {
                    if (error) {
                        this.handleSQLiteError(connection, `[storage ${this.name}] get(): ${error}`);
                        return reject(error);
                    }
                    return resolve(row);
                });
            });
        }
        all(connection, sql) {
            return new Promise((resolve, reject) => {
                connection.db.all(sql, (error, rows) => {
                    if (error) {
                        this.handleSQLiteError(connection, `[storage ${this.name}] all(): ${error}`);
                        return reject(error);
                    }
                    return resolve(rows);
                });
            });
        }
        transaction(connection, transactions) {
            return new Promise((resolve, reject) => {
                connection.db.serialize(() => {
                    connection.db.run('BEGIN TRANSACTION');
                    transactions();
                    connection.db.run('END TRANSACTION', error => {
                        if (error) {
                            this.handleSQLiteError(connection, `[storage ${this.name}] transaction(): ${error}`);
                            return reject(error);
                        }
                        return resolve();
                    });
                });
            });
        }
        prepare(connection, sql, runCallback, errorDetails) {
            const stmt = connection.db.prepare(sql);
            const statementErrorListener = (error) => {
                this.handleSQLiteError(connection, `[storage ${this.name}] prepare(): ${error} (${sql}). Details: ${errorDetails()}`);
            };
            stmt.on('error', statementErrorListener);
            runCallback(stmt);
            stmt.finalize(error => {
                if (error) {
                    statementErrorListener(error);
                }
                stmt.removeListener('error', statementErrorListener);
            });
        }
    }
    exports.SQLiteStorageDatabase = SQLiteStorageDatabase;
    class SQLiteStorageDatabaseLogger {
        // to reduce lots of output, require an environment variable to enable tracing
        // this helps when running with --verbose normally where the storage tracing
        // might hide useful output to look at
        static { this.VSCODE_TRACE_STORAGE = 'VSCODE_TRACE_STORAGE'; }
        constructor(options) {
            if (options && typeof options.logTrace === 'function' && process.env[SQLiteStorageDatabaseLogger.VSCODE_TRACE_STORAGE]) {
                this.logTrace = options.logTrace;
            }
            if (options && typeof options.logError === 'function') {
                this.logError = options.logError;
            }
        }
        get isTracing() {
            return !!this.logTrace;
        }
        trace(msg) {
            this.logTrace?.(msg);
        }
        error(error) {
            this.logError?.(error);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvc3RvcmFnZS9ub2RlL3N0b3JhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkJoRyxNQUFhLHFCQUFxQjtpQkFFakIsbUJBQWMsR0FBRyxVQUFVLEFBQWIsQ0FBYztRQUU1QyxJQUFJLHdCQUF3QixLQUFzQyxPQUFPLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsaUVBQWlFO2lCQUVoSSxzQkFBaUIsR0FBRyxJQUFJLEFBQVAsQ0FBUSxHQUFDLGdFQUFnRTtpQkFDMUYsd0JBQW1CLEdBQUcsR0FBRyxBQUFOLENBQU8sR0FBQyxrREFBa0Q7UUFRckcsWUFBNkIsSUFBWSxFQUFtQixVQUF5QyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztZQUEzRixTQUFJLEdBQUosSUFBSSxDQUFRO1lBQW1CLFlBQU8sR0FBUCxPQUFPLENBQXFEO1lBTnZHLFNBQUksR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFM0IsV0FBTSxHQUFHLElBQUksMkJBQTJCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUUvRCxrQkFBYSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRW1FLENBQUM7UUFFN0gsS0FBSyxDQUFDLFFBQVE7WUFDYixNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUM7WUFFNUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFFeEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSx5QkFBeUIsQ0FB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