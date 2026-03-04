/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/cancellation", "vs/base/common/async"], function (require, exports, lifecycle_1, cancellation_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyBackupTracker = void 0;
    /**
     * The working copy backup tracker deals with:
     * - restoring backups that exist
     * - creating backups for modified working copies
     * - deleting backups for saved working copies
     * - handling backups on shutdown
     */
    class WorkingCopyBackupTracker extends lifecycle_1.Disposable {
        constructor(workingCopyBackupService, workingCopyService, logService, lifecycleService, filesConfigurationService, workingCopyEditorService, editorService, editorGroupService) {
            super();
            this.workingCopyBackupService = workingCopyBackupService;
            this.workingCopyService = workingCopyService;
            this.logService = logService;
            this.lifecycleService = lifecycleService;
            this.filesConfigurationService = filesConfigurationService;
            this.workingCopyEditorService = workingCopyEditorService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            // A map from working copy to a version ID we compute on each content
            // change. This version ID allows to e.g. ask if a backup for a specific
            // content has been made before closing.
            this.mapWorkingCopyToContentVersion = new Map();
            // A map of scheduled pending backup operations for working copies
            // Given https://github.com/microsoft/vscode/issues/158038, we explicitly
            // do not store `IWorkingCopy` but the identifier in the map, since it
            // looks like GC is not running for the working copy otherwise.
            this.pendingBackupOperations = new Map();
            this.suspended = false;
            //#endregion
            //#region Backup Restorer
            this.unrestoredBackups = new Set();
            this.whenReady = this.resolveBackupsToRestore();
            this._isReady = false;
            // Fill in initial modified working copies
            for (const workingCopy of this.workingCopyService.modifiedWorkingCopies) {
                this.onDidRegister(workingCopy);
            }
            this.registerListeners();
        }
        registerListeners() {
            // Working Copy events
            this._register(this.workingCopyService.onDidRegister(workingCopy => this.onDidRegister(workingCopy)));
            this._register(this.workingCopyService.onDidUnregister(workingCopy => this.onDidUnregister(workingCopy)));
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.onDidChangeDirty(workingCopy)));
            this._register(this.workingCopyService.onDidChangeContent(workingCopy => this.onDidChangeContent(workingCopy)));
            // Lifecycle
            this._register(this.lifecycleService.onBeforeShutdown(event => event.finalVeto(() => this.onFinalBeforeShutdown(event.reason), 'veto.backups')));
            this._register(this.lifecycleService.onWillShutdown(() => this.onWillShutdown()));
            // Once a handler registers, restore backups
            this._register(this.workingCopyEditorService.onDidRegisterHandler(handler => this.restoreBackups(handler)));
        }
        onWillShutdown() {
            // Here we know that we will shutdown. Any backup operation that is
            // already scheduled or being scheduled from this moment on runs
            // at the risk of corrupting a backup because the backup operation
            // might terminate at any given time now. As such, we need to disable
            // this tracker from performing more backups by cancelling pending
            // operations and suspending the tracker without resuming.
            this.cancelBackupOperations();
            this.suspendBackupOperations();
        }
        //#region Backup Creator
        // Delay creation of backups when content changes to avoid too much
        // load on the backup service when the user is typing into the editor
        // Since we always schedule a backup, even when auto save is on, we
        // have different scheduling delays based on auto save configuration.
        // With 'delayed' we avoid a (not critical but also not really wanted)
        // race between saving (after 1s per default) and making a backup of
        // the working copy.
        static { this.DEFAULT_BACKUP_SCHEDULE_DELAYS = {
            ['default']: 1000,
            ['delayed']: 2000
        }; }
        onDidRegister(workingCopy) {
            if (this.suspended) {
                this.logService.warn(`[backup tracker] suspended, ignoring register event`, workingCopy.resource.toString(), workingCopy.typeId);
                return;
            }
            if (workingCopy.isModified()) {
                this.scheduleBackup(workingCopy);
            }
        }
        onDidUnregister(workingCopy) {
            // Remove from content version map
            this.mapWorkingCopyToContentVersion.delete(workingCopy);
            // Check suspended
            if (this.suspended) {
                this.logService.warn(`[backup tracker] suspended, ignoring unregister event`, workingCopy.resource.toString(), workingCopy.typeId);
                return;
            }
            // Discard backup
            this.discardBackup(workingCopy);
        }
        onDidChangeDirty(workingCopy) {
            if (this.suspended) {
                this.logService.warn(`[backup tracker] suspended, ignoring dirty change event`, workingCopy.resource.toString(), workingCopy.typeId);
                return;
            }
            if (workingCopy.isDirty()) {
                this.scheduleBackup(workingCopy);
            }
            else {
                this.discardBackup(workingCopy);
            }
        }
        onDidChangeContent(workingCopy) {
            // Increment content version ID
            const contentVersionId = this.getContentVersion(workingCopy);
            this.mapWorkingCopyToContentVersion.set(workingCopy, contentVersionId + 1);
            // Check suspended
            if (this.suspended) {
                this.logService.warn(`[backup tracker] suspended, ignoring content change event`, workingCopy.resource.toString(), workingCopy.typeId);
                return;
            }
            // Schedule backup for modified working copies
            if (workingCopy.isModified()) {
                // this listener will make sure that the backup is
                // pushed out for as long as the user is still changing
                // the content of the working copy.
                this.scheduleBackup(workingCopy);
            }
        }
        scheduleBackup(workingCopy) {
            // Clear any running backup operation
            this.cancelBackupOperation(workingCopy);
            this.logService.trace(`[backup tracker] scheduling backup`, workingCopy.resource.toString(), workingCopy.typeId);
            // Schedule new backup
            const workingCopyIdentifier = { resource: workingCopy.resource, typeId: workingCopy.typeId };
            const cts = new cancellation_1.CancellationTokenSource();
            const handle = setTimeout(async () => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                // Backup if modified
                if (workingCopy.isModified()) {
                    this.logService.trace(`[backup tracker] creating backup`, workingCopy.resource.toString(), workingCopy.typeId);
                    try {
                        const backup = await workingCopy.backup(cts.token);
                        if (cts.token.isCancellationRequested) {
                            return;
                        }
                        if (workingCopy.isModified()) {
                            this.logService.trace(`[backup tracker] storing backup`, workingCopy.resource.toString(), workingCopy.typeId);
                            await this.workingCopyBackupService.backup(workingCopy, backup.content, this.getContentVersion(workingCopy), backup.meta, cts.token);
                        }
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                }
                // Clear disposable unless we got canceled which would
                // indicate another operation has started meanwhile
                if (!cts.token.isCancellationRequested) {
                    this.doClearPendingBackupOperation(workingCopyIdentifier);
                }
            }, this.getBackupScheduleDelay(workingCopy));
            // Keep in map for disposal as needed
            this.pendingBackupOperations.set(workingCopyIdentifier, {
                cancel: () => {
                    this.logService.trace(`[backup tracker] clearing pending backup creation`, workingCopy.resource.toString(), workingCopy.typeId);
                    cts.cancel();
                },
                disposable: (0, lifecycle_1.toDisposable)(() => {
                    cts.dispose();
                    clearTimeout(handle);
                })
            });
        }
        getBackupScheduleDelay(workingCopy) {
            if (typeof workingCopy.backupDelay === 'number') {
                return workingCopy.backupDelay; // respect working copy override
            }
            let backupScheduleDelay;
            if (workingCopy.capabilities & 2 /* WorkingCopyCapabilities.Untitled */) {
                backupScheduleDelay = 'default'; // auto-save is never on for untitled working copies
            }
            else {
                backupScheduleDelay = this.filesConfigurationService.hasShortAutoSaveDelay(workingCopy.resource) ? 'delayed' : 'default';
            }
            return WorkingCopyBackupTracker.DEFAULT_BACKUP_SCHEDULE_DELAYS[backupScheduleDelay];
        }
        getContentVersion(workingCopy) {
            return this.mapWorkingCopyToContentVersion.get(workingCopy) || 0;
        }
        discardBackup(workingCopy) {
            // Clear any running backup operation
            this.cancelBackupOperation(workingCopy);
            // Schedule backup discard asap
            const workingCopyIdentifier = { resource: workingCopy.resource, typeId: workingCopy.typeId };
            const cts = new cancellation_1.CancellationTokenSource();
            this.doDiscardBackup(workingCopyIdentifier, cts);
            // Keep in map for disposal as needed
            this.pendingBackupOperations.set(workingCopyIdentifier, {
                cancel: () => {
                    this.logService.trace(`[backup tracker] clearing pending backup discard`, workingCopy.resource.toString(), workingCopy.typeId);
                    cts.cancel();
                },
                disposable: cts
            });
        }
        async doDiscardBackup(workingCopyIdentifier, cts) {
            this.logService.trace(`[backup tracker] discarding backup`, workingCopyIdentifier.resource.toString(), workingCopyIdentifier.typeId);
            // Discard backup
            try {
                await this.workingCopyBackupService.discardBackup(workingCopyIdentifier, cts.token);
            }
            catch (error) {
                this.logService.error(error);
            }
            // Clear disposable unless we got canceled which would
            // indicate another operation has started meanwhile
            if (!cts.token.isCancellationRequested) {
                this.doClearPendingBackupOperation(workingCopyIdentifier);
            }
        }
        cancelBackupOperation(workingCopy) {
            // Given a working copy we want to find the matching
            // identifier in our pending operations map because
            // we cannot use the working copy directly, as the
            // identifier might have different object identity.
            let workingCopyIdentifier = undefined;
            for (const [identifier] of this.pendingBackupOperations) {
                if (identifier.resource.toString() === workingCopy.resource.toString() && identifier.typeId === workingCopy.typeId) {
                    workingCopyIdentifier = identifier;
                    break;
                }
            }
            if (workingCopyIdentifier) {
                this.doClearPendingBackupOperation(workingCopyIdentifier, { cancel: true });
            }
        }
        doClearPendingBackupOperation(workingCopyIdentifier, options) {
            const pendingBackupOperation = this.pendingBackupOperations.get(workingCopyIdentifier);
            if (!pendingBackupOperation) {
                return;
            }
            if (options?.cancel) {
                pendingBackupOperation.cancel();
            }
            pendingBackupOperation.disposable.dispose();
            this.pendingBackupOperations.delete(workingCopyIdentifier);
        }
        cancelBackupOperations() {
            for (const [, operation] of this.pendingBackupOperations) {
                operation.cancel();
                operation.disposable.dispose();
            }
            this.pendingBackupOperations.clear();
        }
        suspendBackupOperations() {
            this.suspended = true;
            return { resume: () => this.suspended = false };
        }
        get isReady() { return this._isReady; }
        async resolveBackupsToRestore() {
            // Wait for resolving backups until we are restored to reduce startup pressure
            await this.lifecycleService.when(3 /* LifecyclePhase.Restored */);
            // Remember each backup that needs to restore
            for (const backup of await this.workingCopyBackupService.getBackups()) {
                this.unrestoredBackups.add(backup);
            }
            this._isReady = true;
        }
        async restoreBackups(handler) {
            // Wait for backups to be resolved
            await this.whenReady;
            // Figure out already opened editors for backups vs
            // non-opened.
            const openedEditorsForBackups = new Set();
            const nonOpenedEditorsForBackups = new Set();
            // Ensure each backup that can be handled has an
            // associated editor.
            const restoredBackups = new Set();
            for (const unrestoredBackup of this.unrestoredBackups) {
                const canHandleUnrestoredBackup = await handler.handles(unrestoredBackup);
                if (!canHandleUnrestoredBackup) {
                    continue;
                }
                // Collect already opened editors for backup
                let hasOpenedEditorForBackup = false;
                for (const { editor } of this.editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)) {
                    const isUnrestoredBackupOpened = handler.isOpen(unrestoredBackup, editor);
                    if (isUnrestoredBackupOpened) {
                        openedEditorsForBackups.add(editor);
                        hasOpenedEditorForBackup = true;
                    }
                }
                // Otherwise, make sure to create at least one editor
                // for the backup to show
                if (!hasOpenedEditorForBackup) {
                    nonOpenedEditorsForBackups.add(await handler.createEditor(unrestoredBackup));
                }
                // Remember as (potentially) restored
                restoredBackups.add(unrestoredBackup);
            }
            // Ensure editors are opened for each backup without editor
            // in the background without stealing focus
            if (nonOpenedEditorsForBackups.size > 0) {
                await this.editorGroupService.activeGroup.openEditors([...nonOpenedEditorsForBackups].map(nonOpenedEditorForBackup => ({
                    editor: nonOpenedEditorForBackup,
                    options: {
                        pinned: true,
                        preserveFocus: true,
                        inactive: true
                    }
                })));
                for (const nonOpenedEditorForBackup of nonOpenedEditorsForBackups) {
                    openedEditorsForBackups.add(nonOpenedEditorForBackup);
                }
            }
            // Then, resolve each opened editor to make sure the working copy
            // is loaded and the modified editor appears properly.
            // We only do that for editors that are not active in a group
            // already to prevent calling `resolve` twice!
            await async_1.Promises.settled([...openedEditorsForBackups].map(async (openedEditorForBackup) => {
                if (this.editorService.isVisible(openedEditorForBackup)) {
                    return;
                }
                return openedEditorForBackup.resolve();
            }));
            // Finally, remove all handled backups from the list
            for (const restoredBackup of restoredBackups) {
                this.unrestoredBackups.delete(restoredBackup);
            }
        }
    }
    exports.WorkingCopyBackupTracker = WorkingCopyBackupTracker;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBUcmFja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2NvbW1vbi93b3JraW5nQ29weUJhY2t1cFRyYWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUJoRzs7Ozs7O09BTUc7SUFDSCxNQUFzQix3QkFBeUIsU0FBUSxzQkFBVTtRQUVoRSxZQUNvQix3QkFBbUQsRUFDbkQsa0JBQXVDLEVBQ3ZDLFVBQXVCLEVBQ3pCLGdCQUFtQyxFQUNqQyx5QkFBcUQsRUFDdkQsd0JBQW1ELEVBQ2pELGFBQTZCLEVBQy9CLGtCQUF3QztZQUV6RCxLQUFLLEVBQUUsQ0FBQztZQVRXLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMkI7WUFDbkQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN2QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3pCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDakMsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUE0QjtZQUN2RCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBQ2pELGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMvQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXNCO1lBMEQxRCxxRUFBcUU7WUFDckUsd0VBQXdFO1lBQ3hFLHdDQUF3QztZQUN2QixtQ0FBOEIsR0FBRyxJQUFJLEdBQUcsRUFBd0IsQ0FBQztZQUVsRixrRUFBa0U7WUFDbEUseUVBQXlFO1lBQ3pFLHNFQUFzRTtZQUN0RSwrREFBK0Q7WUFDNUMsNEJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQTJFLENBQUM7WUFFeEgsY0FBUyxHQUFHLEtBQUssQ0FBQztZQWlPMUIsWUFBWTtZQUdaLHlCQUF5QjtZQUVOLHNCQUFp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