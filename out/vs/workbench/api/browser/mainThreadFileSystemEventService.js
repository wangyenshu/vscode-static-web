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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol", "vs/nls", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/editor/browser/services/bulkEditService", "vs/platform/progress/common/progress", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/platform/storage/common/storage", "vs/platform/actions/common/actions", "vs/platform/log/common/log", "vs/platform/environment/common/environment", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/api/browser/mainThreadBulkEdits", "vs/base/common/glob", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/files/common/watcher", "vs/platform/workspace/common/workspace"], function (require, exports, lifecycle_1, files_1, extHostCustomers_1, extHost_protocol_1, nls_1, workingCopyFileService_1, bulkEditService_1, progress_1, async_1, cancellation_1, dialogs_1, severity_1, storage_1, actions_1, log_1, environment_1, uriIdentity_1, mainThreadBulkEdits_1, glob_1, strings_1, uri_1, configuration_1, watcher_1, workspace_1) {
    "use strict";
    var MainThreadFileSystemEventService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadFileSystemEventService = void 0;
    let MainThreadFileSystemEventService = class MainThreadFileSystemEventService {
        static { MainThreadFileSystemEventService_1 = this; }
        static { this.MementoKeyAdditionalEdits = `file.particpants.additionalEdits`; }
        constructor(extHostContext, _fileService, workingCopyFileService, bulkEditService, progressService, dialogService, storageService, logService, envService, uriIdentService, _contextService, _logService, _configurationService) {
            this._fileService = _fileService;
            this._contextService = _contextService;
            this._logService = _logService;
            this._configurationService = _configurationService;
            this._listener = new lifecycle_1.DisposableStore();
            this._watches = new lifecycle_1.DisposableMap();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostFileSystemEventService);
            this._listener.add(_fileService.onDidFilesChange(event => {
                this._proxy.$onFileEvent({
                    created: event.rawAdded,
                    changed: event.rawUpdated,
                    deleted: event.rawDeleted
                });
            }));
            const that = this;
            const fileOperationParticipant = new class {
                async participate(files, operation, undoInfo, timeout, token) {
                    if (undoInfo?.isUndoing) {
                        return;
                    }
                    const cts = new cancellation_1.CancellationTokenSource(token);
                    const timer = setTimeout(() => cts.cancel(), timeout);
                    const data = await progressService.withProgress({
                        location: 15 /* ProgressLocation.Notification */,
                        title: this._progressLabel(operation),
                        cancellable: true,
                        delay: Math.min(timeout / 2, 3000)
                    }, () => {
                        // race extension host event delivery against timeout AND user-cancel
                        const onWillEvent = that._proxy.$onWillRunFileOperation(operation, files, timeout, cts.token);
                        return (0, async_1.raceCancellation)(onWillEvent, cts.token);
                    }, () => {
                        // user-cancel
                        cts.cancel();
                    }).finally(() => {
                        cts.dispose();
                        clearTimeout(timer);
                    });
                    if (!data || data.edit.edits.length === 0) {
                        // cancelled, no reply, or no edits
                        return;
                    }
                    const needsConfirmation = data.edit.edits.some(edit => edit.metadata?.needsConfirmation);
                    let showPreview = storageService.getBoolean(MainThreadFileSystemEventService_1.MementoKeyAdditionalEdits, 0 /* StorageScope.PROFILE */);
                    if (envService.extensionTestsLocationURI) {
                        // don't show dialog in tests
                        showPreview = false;
                    }
                    if (showPreview === undefined) {
                        // show a user facing message
                        let message;
                        if (data.extensionNames.length === 1) {
                            if (operation === 0 /* FileOperation.CREATE */) {
                                message = (0, nls_1.localize)('ask.1.create', "Extension '{0}' wants to make refactoring changes with this file creation", data.extensionNames[0]);
                            }
                            else if (operation === 3 /* FileOperation.COPY */) {
                                message = (0, nls_1.localize)('ask.1.copy', "Extension '{0}' wants to make refactoring changes with this file copy", data.extensionNames[0]);
                            }
                            else if (operation === 2 /* FileOperation.MOVE */) {
                                message = (0, nls_1.localize)('ask.1.move', "Extension '{0}' wants to make refactoring changes with this file move", data.extensionNames[0]);
                            }
                            else /* if (operation === FileOperation.DELETE) */ {
                                message = (0, nls_1.localize)('ask.1.delete', "Extension '{0}' wants to make refactoring changes with this file deletion", data.extensionNames[0]);
                            }
                        }
                        else {
                            if (operation === 0 /* FileOperation.CREATE */) {
                                message = (0, nls_1.localize)({ key: 'ask.N.create', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file creation", data.extensionNames.length);
                            }
                            else if (operation === 3 /* FileOperation.COPY */) {
                                message = (0, nls_1.localize)({ key: 'ask.N.copy', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file copy", data.extensionNames.length);
                            }
                            else if (operation === 2 /* FileOperation.MOVE */) {
                                message = (0, nls_1.localize)({ key: 'ask.N.move', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file move", data.extensionNames.length);
                            }
                            else /* if (operation === FileOperation.DELETE) */ {
                                message = (0, nls_1.localize)({ key: 'ask.N.delete', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file deletion", data.extensionNames.length);
                            }
                        }
                        if (needsConfirmation) {
                            // edit which needs confirmation -> always show dialog
                            const { confirmed } = await dialogService.confirm({
                                type: severity_1.default.Info,
                                message,
                                primaryButton: (0, nls_1.localize)('preview', "Show &&Preview"),
                                cancelButton: (0, nls_1.localize)('cancel', "Skip Changes")
                            });
                            showPreview = true;
                            if (!confirmed) {
                                // no changes wanted
                                return;
                            }
                        }
                        else {
                            // choice
                            let Choice;
                            (function (Choice) {
                                Choice[Choice["OK"] = 0] = "OK";
                                Choice[Choice["Preview"] = 1] = "Preview";
                                Choice[Choice["Cancel"] = 2] = "Cancel";
                            })(Choice || (Choice = {}));
                            const { result, checkboxChecked } = await dialogService.prompt({
                                type: severity_1.default.Info,
                                message,
                                buttons: [
                                    {
                                        label: (0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"),
                                        run: () => Choice.OK
                                    },
                                    {
                                        label: (0, nls_1.localize)({ key: 'preview', comment: ['&& denotes a mnemonic'] }, "Show &&Preview"),
                                        run: () => Choice.Preview
                                    }
                                ],
                                cancelButton: {
                                    label: (0, nls_1.localize)('cancel', "Skip Changes"),
                                    run: () => Choice.Cancel
                                },
                                checkbox: { label: (0, nls_1.localize)('again', "Do not ask me again") }
                            });
                            if (result === Choice.Cancel) {
                                // no changes wanted, don't persist cancel option
                                return;
                            }
                            showPreview = result === Choice.Preview;
                            if (checkboxChecked) {
                                storageService.store(MainThreadFileSystemEventService_1.MementoKeyAdditionalEdits, showPreview, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                            }
                        }
                    }
                    logService.info('[onWill-handler] applying additional workspace edit from extensions', data.extensionNames);
                    await bulkEditService.apply((0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)(data.edit, uriIdentService), { undoRedoGroupId: undoInfo?.undoRedoGroupId, showPreview });
                }
                _progressLabel(operation) {
                    switch (operation) {
                        case 0 /* FileOperation.CREATE */:
                            return (0, nls_1.localize)('msg-create', "Running 'File Create' participants...");
                        case 2 /* FileOperation.MOVE */:
                            return (0, nls_1.localize)('msg-rename', "Running 'File Rename' participants...");
                        case 3 /* FileOperation.COPY */:
                            return (0, nls_1.localize)('msg-copy', "Running 'File Copy' participants...");
                        case 1 /* FileOperation.DELETE */:
                            return (0, nls_1.localize)('msg-delete', "Running 'File Delete' participants...");
                        case 4 /* FileOperation.WRITE */:
                            return (0, nls_1.localize)('msg-write', "Running 'File Write' participants...");
                    }
                }
            };
            // BEFORE file operation
            this._listener.add(workingCopyFileService.addFileOperationParticipant(fileOperationParticipant));
            // AFTER file operation
            this._listener.add(workingCopyFileService.onDidRunWorkingCopyFileOperation(e => this._proxy.$onDidRunFileOperation(e.operation, e.files)));
        }
        async $watch(extensionId, session, resource, unvalidatedOpts, correlate) {
            const uri = uri_1.URI.revive(resource);
            const opts = {
                ...unvalidatedOpts
            };
            // Convert a recursive watcher to a flat watcher if the path
            // turns out to not be a folder. Recursive watching is only
            // possible on folders, so we help all file watchers by checking
            // early.
            if (opts.recursive) {
                try {
                    const stat = await this._fileService.stat(uri);
                    if (!stat.isDirectory) {
                        opts.recursive = false;
                    }
                }
                catch (error) {
                    // ignore
                }
            }
            // Correlated file watching is taken as is
            if (correlate) {
                this._logService.trace(`MainThreadFileSystemEventService#$watch(): request to start watching correlated (extension: ${extensionId}, path: ${uri.toString(true)}, recursive: ${opts.recursive}, session: ${session})`);
                const watcherDisposables = new lifecycle_1.DisposableStore();
                const subscription = watcherDisposables.add(this._fileService.createWatcher(uri, opts));
                watcherDisposables.add(subscription.onDidChange(event => {
                    this._proxy.$onFileEvent({
                        session,
                        created: event.rawAdded,
                        changed: event.rawUpdated,
                        deleted: event.rawDeleted
                    });
                }));
                this._watches.set(session, watcherDisposables);
            }
            // Uncorrelated file watching gets special treatment
            else {
                this._logService.trace(`MainThreadFileSystemEventService#$watch(): request to start watching uncorrelated (extension: ${extensionId}, path: ${uri.toString(true)}, recursive: ${opts.recursive}, session: ${session})`);
                const workspaceFolder = this._contextService.getWorkspaceFolder(uri);
                // Automatically add `files.watcherExclude` patterns when watching
                // recursively to give users a chance to configure exclude rules
                // for reducing the overhead of watching recursively
                if (opts.recursive && opts.excludes.length === 0) {
                    const config = this._configurationService.getValue();
                    if (config.files?.watcherExclude) {
                        for (const key in config.files.watcherExclude) {
                            if (key && config.files.watcherExclude[key] === true) {
                                opts.excludes.push(key);
                            }
                        }
                    }
                }
                // Non-recursive watching inside the workspace will overlap with
                // our standard workspace watchers. To prevent duplicate events,
                // we only want to include events for files that are otherwise
                // excluded via `files.watcherExclude`. As such, we configure
                // to include each configured exclude pattern so that only those
                // events are reported that are otherwise excluded.
                // However, we cannot just use the pattern as is, because a pattern
                // such as `bar` for a exclude, will work to exclude any of
                // `<workspace path>/bar` but will not work as include for files within
                // `bar` unless a suffix of `/**` if added.
                // (https://github.com/microsoft/vscode/issues/148245)
                else if (!opts.recursive && workspaceFolder) {
                    const config = this._configurationService.getValue();
                    if (config.files?.watcherExclude) {
                        for (const key in config.files.watcherExclude) {
                            if (key && config.files.watcherExclude[key] === true) {
                                if (!opts.includes) {
                                    opts.includes = [];
                                }
                                const includePattern = `${(0, strings_1.rtrim)(key, '/')}/${glob_1.GLOBSTAR}`;
                                opts.includes.push((0, watcher_1.normalizeWatcherPattern)(workspaceFolder.uri.fsPath, includePattern));
                            }
                        }
                    }
                    // Still ignore watch request if there are actually no configured
                    // exclude rules, because in that case our default recursive watcher
                    // should be able to take care of all events.
                    if (!opts.includes || opts.includes.length === 0) {
                        this._logService.trace(`MainThreadFileSystemEventService#$watch(): ignoring request to start watching because path is inside workspace and no excludes are configured (extension: ${extensionId}, path: ${uri.toString(true)}, recursive: ${opts.recursive}, session: ${session})`);
                        return;
                    }
                }
                const subscription = this._fileService.watch(uri, opts);
                this._watches.set(session, subscription);
            }
        }
        $unwatch(session) {
            if (this._watches.has(session)) {
                this._logService.trace(`MainThreadFileSystemEventService#$unwatch(): request to stop watching (session: ${session})`);
                this._watches.deleteAndDispose(session);
            }
        }
        dispose() {
            this._listener.dispose();
            this._watches.dispose();
        }
    };
    exports.MainThreadFileSystemEventService = MainThreadFileSystemEventService;
    exports.MainThreadFileSystemEventService = MainThreadFileSystemEventService = MainThreadFileSystemEventService_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadFileSystemEventService),
        __param(1, files_1.IFileService),
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, bulkEditService_1.IBulkEditService),
        __param(4, progress_1.IProgressService),
        __param(5, dialogs_1.IDialogService),
        __param(6, storage_1.IStorageService),
        __param(7, log_1.ILogService),
        __param(8, environment_1.IEnvironmentService),
        __param(9, uriIdentity_1.IUriIdentityService),
        __param(10, workspace_1.IWorkspaceContextService),
        __param(11, log_1.ILogService),
        __param(12, configuration_1.IConfigurationService)
    ], MainThreadFileSystemEventService);
    (0, actions_1.registerAction2)(class ResetMemento extends actions_1.Action2 {
        constructor() {
            super({
                id: 'files.participants.resetChoice',
                title: {
                    value: (0, nls_1.localize)('label', "Reset choice for 'File operation needs preview'"),
                    original: `Reset choice for 'File operation needs preview'`
                },
                f1: true
            });
        }
        run(accessor) {
            accessor.get(storage_1.IStorageService).remove(MainThreadFileSystemEventService.MementoKeyAdditionalEdits, 0 /* StorageScope.PROFILE */);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEZpbGVTeXN0ZW1FdmVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZEZpbGVTeXN0ZW1FdmVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTZCekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBZ0M7O2lCQUU1Qiw4QkFBeUIsR0FBRyxrQ0FBa0MsQUFBckMsQ0FBc0M7UUFPL0UsWUFDQyxjQUErQixFQUNqQixZQUEyQyxFQUNoQyxzQkFBK0MsRUFDdEQsZUFBaUMsRUFDakMsZUFBaUMsRUFDbkMsYUFBNkIsRUFDNUIsY0FBK0IsRUFDbkMsVUFBdUIsRUFDZixVQUErQixFQUMvQixlQUFvQyxFQUMvQixlQUEwRCxFQUN2RSxXQUF5QyxFQUMvQixxQkFBNkQ7WUFYckQsaUJBQVksR0FBWixZQUFZLENBQWM7WUFTZCxvQkFBZSxHQUFmLGVBQWUsQ0FBMEI7WUFDdEQsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDZCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBaEJwRSxjQUFTLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDbEMsYUFBUSxHQUFHLElBQUkseUJBQWEsRUFBVSxDQUFDO1lBaUJ2RCxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1lBRXBGLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDeEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7b0JBQ3hCLE9BQU8sRUFBRSxLQUFLLENBQUMsUUFB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