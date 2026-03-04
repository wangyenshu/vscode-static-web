/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/path", "vs/base/common/uri", "vs/workbench/api/common/extHostStoragePaths", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/async", "vs/base/node/pfs"], function (require, exports, fs, path, uri_1, extHostStoragePaths_1, lifecycle_1, network_1, async_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionStoragePaths = void 0;
    class ExtensionStoragePaths extends extHostStoragePaths_1.ExtensionStoragePaths {
        constructor() {
            super(...arguments);
            this._workspaceStorageLock = null;
        }
        async _getWorkspaceStorageURI(storageName) {
            const workspaceStorageURI = await super._getWorkspaceStorageURI(storageName);
            if (workspaceStorageURI.scheme !== network_1.Schemas.file) {
                return workspaceStorageURI;
            }
            if (this._environment.skipWorkspaceStorageLock) {
                this._logService.info(`Skipping acquiring lock for ${workspaceStorageURI.fsPath}.`);
                return workspaceStorageURI;
            }
            const workspaceStorageBase = workspaceStorageURI.fsPath;
            let attempt = 0;
            do {
                let workspaceStoragePath;
                if (attempt === 0) {
                    workspaceStoragePath = workspaceStorageBase;
                }
                else {
                    workspaceStoragePath = (/[/\\]$/.test(workspaceStorageBase)
                        ? `${workspaceStorageBase.substr(0, workspaceStorageBase.length - 1)}-${attempt}`
                        : `${workspaceStorageBase}-${attempt}`);
                }
                await mkdir(workspaceStoragePath);
                const lockfile = path.join(workspaceStoragePath, 'vscode.lock');
                const lock = await tryAcquireLock(this._logService, lockfile, false);
                if (lock) {
                    this._workspaceStorageLock = lock;
                    process.on('exit', () => {
                        lock.dispose();
                    });
                    return uri_1.URI.file(workspaceStoragePath);
                }
                attempt++;
            } while (attempt < 10);
            // just give up
            return workspaceStorageURI;
        }
        onWillDeactivateAll() {
            // the lock will be released soon
            this._workspaceStorageLock?.setWillRelease(6000);
        }
    }
    exports.ExtensionStoragePaths = ExtensionStoragePaths;
    async function mkdir(dir) {
        try {
            await pfs_1.Promises.stat(dir);
            return;
        }
        catch {
            // doesn't exist, that's OK
        }
        try {
            await pfs_1.Promises.mkdir(dir, { recursive: true });
        }
        catch {
        }
    }
    const MTIME_UPDATE_TIME = 1000; // 1s
    const STALE_LOCK_TIME = 10 * 60 * 1000; // 10 minutes
    class Lock extends lifecycle_1.Disposable {
        constructor(logService, filename) {
            super();
            this.logService = logService;
            this.filename = filename;
            this._timer = this._register(new async_1.IntervalTimer());
            this._timer.cancelAndSet(async () => {
                const contents = await readLockfileContents(logService, filename);
                if (!contents || contents.pid !== process.pid) {
                    // we don't hold the lock anymore ...
                    logService.info(`Lock '${filename}': The lock was lost unexpectedly.`);
                    this._timer.cancel();
                }
                try {
                    await pfs_1.Promises.utimes(filename, new Date(), new Date());
                }
                catch (err) {
                    logService.error(err);
                    logService.info(`Lock '${filename}': Could not update mtime.`);
                }
            }, MTIME_UPDATE_TIME);
        }
        dispose() {
            super.dispose();
            try {
                fs.unlinkSync(this.filename);
            }
            catch (err) { }
        }
        async setWillRelease(timeUntilReleaseMs) {
            this.logService.info(`Lock '${this.filename}': Marking the lockfile as scheduled to be released in ${timeUntilReleaseMs} ms.`);
            try {
                const contents = {
                    pid: process.pid,
                    willReleaseAt: Date.now() + timeUntilReleaseMs
                };
                await pfs_1.Promises.writeFile(this.filename, JSON.stringify(contents), { flag: 'w' });
            }
            catch (err) {
                this.logService.error(err);
            }
        }
    }
    /**
     * Attempt to acquire a lock on a directory.
     * This does not use the real `flock`, but uses a file.
     * @returns a disposable if the lock could be acquired or null if it could not.
     */
    async function tryAcquireLock(logService, filename, isSecondAttempt) {
        try {
            const contents = {
                pid: process.pid,
                willReleaseAt: 0
            };
            await pfs_1.Promises.writeFile(filename, JSON.stringify(contents), { flag: 'wx' });
        }
        catch (err) {
            logService.error(err);
        }
        // let's see if we got the lock
        const contents = await readLockfileContents(logService, filename);
        if (!contents || contents.pid !== process.pid) {
            // we didn't get the lock
            if (isSecondAttempt) {
                logService.info(`Lock '${filename}': Could not acquire lock, giving up.`);
                return null;
            }
            logService.info(`Lock '${filename}': Could not acquire lock, checking if the file is stale.`);
            return checkStaleAndTryAcquireLock(logService, filename);
        }
        // we got the lock
        logService.info(`Lock '${filename}': Lock acquired.`);
        return new Lock(logService, filename);
    }
    /**
     * @returns 0 if the pid cannot be read
     */
    async function readLockfileContents(logService, filename) {
        let contents;
        try {
            contents = await pfs_1.Promises.readFile(filename);
        }
        catch (err) {
            // cannot read the file
            logService.error(err);
            return null;
        }
        try {
            return JSON.parse(String(contents));
        }
        catch (err) {
            // cannot parse the file
            logService.error(err);
            return null;
        }
    }
    /**
     * @returns 0 if the mtime cannot be read
     */
    async function readmtime(logService, filename) {
        let stats;
        try {
            stats = await pfs_1.Promises.stat(filename);
        }
        catch (err) {
            // cannot read the file stats to check if it is stale or not
            logService.error(err);
            return 0;
        }
        return stats.mtime.getTime();
    }
    function processExists(pid) {
        try {
            process.kill(pid, 0); // throws an exception if the process doesn't exist anymore.
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async function checkStaleAndTryAcquireLock(logService, filename) {
        const contents = await readLockfileContents(logService, filename);
        if (!contents) {
            logService.info(`Lock '${filename}': Could not read pid of lock holder.`);
            return tryDeleteAndAcquireLock(logService, filename);
        }
        if (contents.willReleaseAt) {
            let timeUntilRelease = contents.willReleaseAt - Date.now();
            if (timeUntilRelease < 5000) {
                if (timeUntilRelease > 0) {
                    logService.info(`Lock '${filename}': The lockfile is scheduled to be released in ${timeUntilRelease} ms.`);
                }
                else {
                    logService.info(`Lock '${filename}': The lockfile is scheduled to have been released.`);
                }
                while (timeUntilRelease > 0) {
                    await (0, async_1.timeout)(Math.min(100, timeUntilRelease));
                    const mtime = await readmtime(logService, filename);
                    if (mtime === 0) {
                        // looks like the lock was released
                        return tryDeleteAndAcquireLock(logService, filename);
                    }
                    timeUntilRelease = contents.willReleaseAt - Date.now();
                }
                return tryDeleteAndAcquireLock(logService, filename);
            }
        }
        if (!processExists(contents.pid)) {
            logService.info(`Lock '${filename}': The pid ${contents.pid} appears to be gone.`);
            return tryDeleteAndAcquireLock(logService, filename);
        }
        const mtime1 = await readmtime(logService, filename);
        const elapsed1 = Date.now() - mtime1;
        if (elapsed1 <= STALE_LOCK_TIME) {
            // the lock does not look stale
            logService.info(`Lock '${filename}': The lock does not look stale, elapsed: ${elapsed1} ms, giving up.`);
            return null;
        }
        // the lock holder updates the mtime every 1s.
        // let's give it a chance to update the mtime
        // in case of a wake from sleep or something similar
        logService.info(`Lock '${filename}': The lock looks stale, waiting for 2s.`);
        await (0, async_1.timeout)(2000);
        const mtime2 = await readmtime(logService, filename);
        const elapsed2 = Date.now() - mtime2;
        if (elapsed2 <= STALE_LOCK_TIME) {
            // the lock does not look stale
            logService.info(`Lock '${filename}': The lock does not look stale, elapsed: ${elapsed2} ms, giving up.`);
            return null;
        }
        // the lock looks stale
        logService.info(`Lock '${filename}': The lock looks stale even after waiting for 2s.`);
        return tryDeleteAndAcquireLock(logService, filename);
    }
    async function tryDeleteAndAcquireLock(logService, filename) {
        logService.info(`Lock '${filename}': Deleting a stale lock.`);
        try {
            await pfs_1.Promises.unlink(filename);
        }
        catch (err) {
            // cannot delete the file
            // maybe the file is already deleted
        }
        return tryAcquireLock(logService, filename, true);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFN0b3JhZ2VQYXRocy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS9leHRIb3N0U3RvcmFnZVBhdGhzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFhLHFCQUFzQixTQUFRLDJDQUEyQjtRQUF0RTs7WUFFUywwQkFBcUIsR0FBZ0IsSUFBSSxDQUFDO1FBa0RuRCxDQUFDO1FBaERtQixLQUFLLENBQUMsdUJBQXVCLENBQUMsV0FBbUI7WUFDbkUsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3RSxJQUFJLG1CQUFtQixDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNqRCxPQUFPLG1CQUFtQixDQUFDO1lBQzVCLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsK0JBQStCLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ3BGLE9BQU8sbUJBQW1CLENBQUM7WUFDNUIsQ0FBQztZQUVELE1BQU0sb0JBQW9CLEdBQUcsbUJBQW1CLENBQUMsTUFBTSxDQUFDO1lBQ3hELElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztZQUNoQixHQUFHLENBQUM7Z0JBQ0gsSUFBSSxvQkFBNEIsQ0FBQztnQkFDakMsSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ25CLG9CQUFvQixHQUFHLG9CQUFvQixDQUFDO2dCQUM3QyxDQUFDO3FCQUFNLENBQUM7b0JBQ1Asb0JBQW9CLEdBQUcsQ0FDdEIsUUFBUSxDQUFDLElBQUksQ0FBQyxv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