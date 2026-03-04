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
define(["require", "exports", "vs/nls", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspace", "vs/base/common/platform", "vs/platform/files/common/files", "vs/platform/native/common/native", "vs/workbench/services/workingCopy/common/workingCopyBackupTracker", "vs/platform/log/common/log", "vs/workbench/services/editor/common/editorService", "vs/platform/environment/common/environment", "vs/base/common/cancellation", "vs/platform/progress/common/progress", "vs/base/common/async", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, nls_1, workingCopyBackup_1, filesConfigurationService_1, workingCopyService_1, lifecycle_1, dialogs_1, workspace_1, platform_1, files_1, native_1, workingCopyBackupTracker_1, log_1, editorService_1, environment_1, cancellation_1, progress_1, async_1, workingCopyEditorService_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkingCopyBackupTracker = void 0;
    let NativeWorkingCopyBackupTracker = class NativeWorkingCopyBackupTracker extends workingCopyBackupTracker_1.WorkingCopyBackupTracker {
        static { this.ID = 'workbench.contrib.nativeWorkingCopyBackupTracker'; }
        constructor(workingCopyBackupService, filesConfigurationService, workingCopyService, lifecycleService, fileDialogService, dialogService, contextService, nativeHostService, logService, environmentService, progressService, workingCopyEditorService, editorService, editorGroupService) {
            super(workingCopyBackupService, workingCopyService, logService, lifecycleService, filesConfigurationService, workingCopyEditorService, editorService, editorGroupService);
            this.fileDialogService = fileDialogService;
            this.dialogService = dialogService;
            this.contextService = contextService;
            this.nativeHostService = nativeHostService;
            this.environmentService = environmentService;
            this.progressService = progressService;
        }
        async onFinalBeforeShutdown(reason) {
            // Important: we are about to shutdown and handle modified working copies
            // and backups. We do not want any pending backup ops to interfer with
            // this because there is a risk of a backup being scheduled after we have
            // acknowledged to shutdown and then might end up with partial backups
            // written to disk, or even empty backups or deletes after writes.
            // (https://github.com/microsoft/vscode/issues/138055)
            this.cancelBackupOperations();
            // For the duration of the shutdown handling, suspend backup operations
            // and only resume after we have handled backups. Similar to above, we
            // do not want to trigger backup tracking during our shutdown handling
            // but we must resume, in case of a veto afterwards.
            const { resume } = this.suspendBackupOperations();
            try {
                // Modified working copies need treatment on shutdown
                const modifiedWorkingCopies = this.workingCopyService.modifiedWorkingCopies;
                if (modifiedWorkingCopies.length) {
                    return await this.onBeforeShutdownWithModified(reason, modifiedWorkingCopies);
                }
                // No modified working copies
                else {
                    return await this.onBeforeShutdownWithoutModified();
                }
            }
            finally {
                resume();
            }
        }
        async onBeforeShutdownWithModified(reason, modifiedWorkingCopies) {
            // If auto save is enabled, save all non-untitled working copies
            // and then check again for modified copies
            const workingCopiesToAutoSave = modifiedWorkingCopies.filter(wc => !(wc.capabilities & 2 /* WorkingCopyCapabilities.Untitled */) && this.filesConfigurationService.getAutoSaveMode(wc.resource).mode !== 0 /* AutoSaveMode.OFF */);
            if (workingCopiesToAutoSave.length > 0) {
                // Save all modified working copies that can be auto-saved
                try {
                    await this.doSaveAllBeforeShutdown(workingCopiesToAutoSave, 2 /* SaveReason.AUTO */);
                }
                catch (error) {
                    this.logService.error(`[backup tracker] error saving modified working copies: ${error}`); // guard against misbehaving saves, we handle remaining modified below
                }
                // If we still have modified working copies, we either have untitled ones or working copies that cannot be saved
                const remainingModifiedWorkingCopies = this.workingCopyService.modifiedWorkingCopies;
                if (remainingModifiedWorkingCopies.length) {
                    return this.handleModifiedBeforeShutdown(remainingModifiedWorkingCopies, reason);
                }
                return this.noVeto([...modifiedWorkingCopies]); // no veto (modified auto-saved)
            }
            // Auto save is not enabled
            return this.handleModifiedBeforeShutdown(modifiedWorkingCopies, reason);
        }
        async handleModifiedBeforeShutdown(modifiedWorkingCopies, reason) {
            // Trigger backup if configured and enabled for shutdown reason
            let backups = [];
            let backupError = undefined;
            const modifiedWorkingCopiesToBackup = await this.shouldBackupBeforeShutdown(reason, modifiedWorkingCopies);
            if (modifiedWorkingCopiesToBackup.length > 0) {
                try {
                    const backupResult = await this.backupBeforeShutdown(modifiedWorkingCopiesToBackup);
                    backups = backupResult.backups;
                    backupError = backupResult.error;
                    if (backups.length === modifiedWorkingCopies.length) {
                        return false; // no veto (backup was successful for all working copies)
                    }
                }
                catch (error) {
                    backupError = error;
                }
            }
            const remainingModifiedWorkingCopies = modifiedWorkingCopies.filter(workingCopy => !backups.includes(workingCopy));
            // We ran a backup but received an error that we show to the user
            if (backupError) {
                if (this.environmentService.isExtensionDevelopment) {
                    this.logService.error(`[backup tracker] error creating backups: ${backupError}`);
                    return false; // do not block shutdown during extension development (https://github.com/microsoft/vscode/issues/115028)
                }
                return this.showErrorDialog((0, nls_1.localize)('backupTrackerBackupFailed', "The following editors with unsaved changes could not be saved to the backup location."), remainingModifiedWorkingCopies, backupError, reason);
            }
            // Since a backup did not happen, we have to confirm for
            // the working copies that did not successfully backup
            try {
                return await this.confirmBeforeShutdown(remainingModifiedWorkingCopies);
            }
            catch (error) {
                if (this.environmentService.isExtensionDevelopment) {
                    this.logService.error(`[backup tracker] error saving or reverting modified working copies: ${error}`);
                    return false; // do not block shutdown during extension development (https://github.com/microsoft/vscode/issues/115028)
                }
                return this.showErrorDialog((0, nls_1.localize)('backupTrackerConfirmFailed', "The following editors with unsaved changes could not be saved or reverted."), remainingModifiedWorkingCopies, error, reason);
            }
        }
        async shouldBackupBeforeShutdown(reason, modifiedWorkingCopies) {
            if (!this.filesConfigurationService.isHotExitEnabled) {
                return []; // never backup when hot exit is disabled via settings
            }
            if (this.environmentService.isExtensionDevelopment) {
                return modifiedWorkingCopies; // always backup closing extension development window without asking to speed up debugging
            }
            switch (reason) {
                // Window Close
                case 1 /* ShutdownReason.CLOSE */:
                    if (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ && this.filesConfigurationService.hotExitConfiguration === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE) {
                        return modifiedWorkingCopies; // backup if a workspace/folder is open and onExitAndWindowClose is configured
                    }
                    if (platform_1.isMacintosh || await this.nativeHostService.getWindowCount() > 1) {
                        if (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */) {
                            return modifiedWorkingCopies.filter(modifiedWorkingCopy => modifiedWorkingCopy.capabilities & 4 /* WorkingCopyCapabilities.Scratchpad */); // backup scratchpads automatically to avoid user confirmation
                        }
                        return []; // do not backup if a window is closed that does not cause quitting of the application
                    }
                    return modifiedWorkingCopies; // backup if last window is closed on win/linux where the application quits right after
                // Application Quit
                case 2 /* ShutdownReason.QUIT */:
                    return modifiedWorkingCopies; // backup because next start we restore all backups
                // Window Reload
                case 3 /* ShutdownReason.RELOAD */:
                    return modifiedWorkingCopies; // backup because after window reload, backups restore
                // Workspace Change
                case 4 /* ShutdownReason.LOAD */:
                    if (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */) {
                        if (this.filesConfigurationService.hotExitConfiguration === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE) {
                            return modifiedWorkingCopies; // backup if a workspace/folder is open and onExitAndWindowClose is configured
                        }
                        return modifiedWorkingCopies.filter(modifiedWorkingCopy => modifiedWorkingCopy.capabilities & 4 /* WorkingCopyCapabilities.Scratchpad */); // backup scratchpads automatically to avoid user confirmation
                    }
                    return []; // do not backup because we are switching contexts with no workspace/folder open
            }
        }
        async showErrorDialog(message, workingCopies, error, reason) {
            this.logService.error(`[backup tracker] ${message}: ${error}`);
            const modifiedWorkingCopies = workingCopies.filter(workingCopy => workingCopy.isModified());
            const advice = (0, nls_1.localize)('backupErrorDetails', "Try saving or reverting the editors with unsaved changes first and then try again.");
            const detail = modifiedWorkingCopies.length
                ? `${(0, dialogs_1.getFileNamesMessage)(modifiedWorkingCopies.map(x => x.name))}\n${advice}`
                : advice;
            const { result } = await this.dialogService.prompt({
                type: 'error',
                message,
                detail,
                buttons: [
                    {
                        label: (0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"),
                        run: () => true // veto
                    },
                    {
                        label: this.toForceShutdownLabel(reason),
                        run: () => false // no veto
                    }
                ],
            });
            return result ?? true;
        }
        toForceShutdownLabel(reason) {
            switch (reason) {
                case 1 /* ShutdownReason.CLOSE */:
                case 4 /* ShutdownReason.LOAD */:
                    return (0, nls_1.localize)('shutdownForceClose', "Close Anyway");
                case 2 /* ShutdownReason.QUIT */:
                    return (0, nls_1.localize)('shutdownForceQuit', "Quit Anyway");
                case 3 /* ShutdownReason.RELOAD */:
                    return (0, nls_1.localize)('shutdownForceReload', "Reload Anyway");
            }
        }
        async backupBeforeShutdown(modifiedWorkingCopies) {
            const backups = [];
            let error = undefined;
            await this.withProgressAndCancellation(async (token) => {
                // Perform a backup of all modified working copies unless a backup already exists
                try {
                    await async_1.Promises.settled(modifiedWorkingCopies.map(async (workingCopy) => {
                        // Backup exists
                        const contentVersion = this.getContentVersion(workingCopy);
                        if (this.workingCopyBackupService.hasBackupSync(workingCopy, contentVersion)) {
                            backups.push(workingCopy);
                        }
                        // Backup does not exist
                        else {
                            const backup = await workingCopy.backup(token);
                            if (token.isCancellationRequested) {
                                return;
                            }
                            await this.workingCopyBackupService.backup(workingCopy, backup.content, contentVersion, backup.meta, token);
                            if (token.isCancellationRequested) {
                                return;
                            }
                            backups.push(workingCopy);
                        }
                    }));
                }
                catch (backupError) {
                    error = backupError;
                }
            }, (0, nls_1.localize)('backupBeforeShutdownMessage', "Backing up editors with unsaved changes is taking a bit longer..."), (0, nls_1.localize)('backupBeforeShutdownDetail', "Click 'Cancel' to stop waiting and to save or revert editors with unsaved changes."));
            return { backups, error };
        }
        async confirmBeforeShutdown(modifiedWorkingCopies) {
            // Save
            const confirm = await this.fileDialogService.showSaveConfirm(modifiedWorkingCopies.map(workingCopy => workingCopy.name));
            if (confirm === 0 /* ConfirmResult.SAVE */) {
                const modifiedCountBeforeSave = this.workingCopyService.modifiedCount;
                try {
                    await this.doSaveAllBeforeShutdown(modifiedWorkingCopies, 1 /* SaveReason.EXPLICIT */);
                }
                catch (error) {
                    this.logService.error(`[backup tracker] error saving modified working copies: ${error}`); // guard against misbehaving saves, we handle remaining modified below
                }
                const savedWorkingCopies = modifiedCountBeforeSave - this.workingCopyService.modifiedCount;
                if (savedWorkingCopies < modifiedWorkingCopies.length) {
                    return true; // veto (save failed or was canceled)
                }
                return this.noVeto(modifiedWorkingCopies); // no veto (modified saved)
            }
            // Don't Save
            else if (confirm === 1 /* ConfirmResult.DONT_SAVE */) {
                try {
                    await this.doRevertAllBeforeShutdown(modifiedWorkingCopies);
                }
                catch (error) {
                    this.logService.error(`[backup tracker] error reverting modified working copies: ${error}`); // do not block the shutdown on errors from revert
                }
                return this.noVeto(modifiedWorkingCopies); // no veto (modified reverted)
            }
            // Cancel
            return true; // veto (user canceled)
        }
        doSaveAllBeforeShutdown(workingCopies, reason) {
            return this.withProgressAndCancellation(async () => {
                // Skip save participants on shutdown for performance reasons
                const saveOptions = { skipSaveParticipants: true, reason };
                // First save through the editor service if we save all to benefit
                // from some extras like switching to untitled modified editors before saving.
                let result = undefined;
                if (workingCopies.length === this.workingCopyService.modifiedCount) {
                    result = (await this.editorService.saveAll({
                        includeUntitled: { includeScratchpad: true },
                        ...saveOptions
                    })).success;
                }
                // If we still have modified working copies, save those directly
                // unless the save was not successful (e.g. cancelled)
                if (result !== false) {
                    await async_1.Promises.settled(workingCopies.map(workingCopy => workingCopy.isModified() ? workingCopy.save(saveOptions) : Promise.resolve(true)));
                }
            }, (0, nls_1.localize)('saveBeforeShutdown', "Saving editors with unsaved changes is taking a bit longer..."));
        }
        doRevertAllBeforeShutdown(modifiedWorkingCopies) {
            return this.withProgressAndCancellation(async () => {
                // Soft revert is good enough on shutdown
                const revertOptions = { soft: true };
                // First revert through the editor service if we revert all
                if (modifiedWorkingCopies.length === this.workingCopyService.modifiedCount) {
                    await this.editorService.revertAll(revertOptions);
                }
                // If we still have modified working copies, revert those directly
                await async_1.Promises.settled(modifiedWorkingCopies.map(workingCopy => workingCopy.isModified() ? workingCopy.revert(revertOptions) : Promise.resolve()));
            }, (0, nls_1.localize)('revertBeforeShutdown', "Reverting editors with unsaved changes is taking a bit longer..."));
        }
        onBeforeShutdownWithoutModified() {
            // We are about to shutdown without modified editors
            // and will discard any backups that are still
            // around that have not been handled depending
            // on the window state.
            //
            // Empty window: discard even unrestored backups to
            // prevent empty windows from restoring that cannot
            // be closed (workaround for not having implemented
            // https://github.com/microsoft/vscode/issues/127163
            // and a fix for what users have reported in issue
            // https://github.com/microsoft/vscode/issues/126725)
            //
            // Workspace/Folder window: do not discard unrestored
            // backups to give a chance to restore them in the
            // future. Since we do not restore workspace/folder
            // windows with backups, this is fine.
            return this.noVeto({ except: this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ? [] : Array.from(this.unrestoredBackups) });
        }
        async noVeto(arg1) {
            // Discard backups from working copies the
            // user either saved or reverted
            await this.discardBackupsBeforeShutdown(arg1);
            return false; // no veto (no modified)
        }
        async discardBackupsBeforeShutdown(arg1) {
            // We never discard any backups before we are ready
            // and have resolved all backups that exist. This
            // is important to not loose backups that have not
            // been handled.
            if (!this.isReady) {
                return;
            }
            await this.withProgressAndCancellation(async () => {
                // When we shutdown either with no modified working copies left
                // or with some handled, we start to discard these backups
                // to free them up. This helps to get rid of stale backups
                // as reported in https://github.com/microsoft/vscode/issues/92962
                //
                // However, we never want to discard backups that we know
                // were not restored in the session.
                try {
                    if (Array.isArray(arg1)) {
                        await async_1.Promises.settled(arg1.map(workingCopy => this.workingCopyBackupService.discardBackup(workingCopy)));
                    }
                    else {
                        await this.workingCopyBackupService.discardBackups(arg1);
                    }
                }
                catch (error) {
                    this.logService.error(`[backup tracker] error discarding backups: ${error}`);
                }
            }, (0, nls_1.localize)('discardBackupsBeforeShutdown', "Discarding backups is taking a bit longer..."));
        }
        withProgressAndCancellation(promiseFactory, title, detail) {
            const cts = new cancellation_1.CancellationTokenSource();
            return this.progressService.withProgress({
                location: 20 /* ProgressLocation.Dialog */, // use a dialog to prevent the user from making any more changes now (https://github.com/microsoft/vscode/issues/122774)
                cancellable: true, // allow to cancel (https://github.com/microsoft/vscode/issues/112278)
                delay: 800, // delay so that it only appears when operation takes a long time
                title,
                detail
            }, () => (0, async_1.raceCancellation)(promiseFactory(cts.token), cts.token), () => cts.dispose(true));
        }
    };
    exports.NativeWorkingCopyBackupTracker = NativeWorkingCopyBackupTracker;
    exports.NativeWorkingCopyBackupTracker = NativeWorkingCopyBackupTracker = __decorate([
        __param(0, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(1, filesConfigurationService_1.IFilesConfigurationService),
        __param(2, workingCopyService_1.IWorkingCopyService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, dialogs_1.IFileDialogService),
        __param(5, dialogs_1.IDialogService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, native_1.INativeHostService),
        __param(8, log_1.ILogService),
        __param(9, environment_1.IEnvironmentService),
        __param(10, progress_1.IProgressService),
        __param(11, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(12, editorService_1.IEditorService),
        __param(13, editorGroupsService_1.IEditorGroupsService)
    ], NativeWorkingCopyBackupTracker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBUcmFja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2VsZWN0cm9uLXNhbmRib3gvd29ya2luZ0NvcHlCYWNrdXBUcmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXlCekYsSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBK0IsU0FBUSxtREFBd0I7aUJBRTNELE9BQUUsR0FBRyxrREFBa0QsQUFBckQsQ0FBc0Q7UUFFeEUsWUFDNEIsd0JBQW1ELEVBQ2xELHlCQUFxRCxFQUM1RCxrQkFBdUMsRUFDekMsZ0JBQW1DLEVBQ2pCLGlCQUFxQyxFQUN6QyxhQUE2QixFQUNuQixjQUF3QyxFQUM5QyxpQkFBcUMsRUFDN0QsVUFBdUIsRUFDRSxrQkFBdUMsRUFDMUMsZUFBaUMsRUFDekMsd0JBQW1ELEVBQzlELGFBQTZCLEVBQ3ZCLGtCQUF3QztZQUU5RCxLQUFLLENBQUMsd0JBQXdCLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLHlCQUF5QixFQUFFLHdCQUF3QixFQUFFLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBWHJJLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDekMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ25CLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUM5QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBRXBDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDMUMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1FBTXJFLENBQUM7UUFFUyxLQUFLLENBQUMscUJBQXFCLENBQUMsTUFBc0I7WUFFM0QseUVBQXlFO1lBQ3pFLHNFQUFzRTtZ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