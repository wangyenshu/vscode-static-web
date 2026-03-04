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
define(["require", "exports", "vs/nls", "vs/base/common/cancellation", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/resources", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/uri", "vs/workbench/services/host/browser/host", "vs/platform/workspace/common/workspace", "vs/platform/dnd/browser/dnd", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/base/common/platform", "vs/base/browser/dom", "vs/platform/log/common/log", "vs/base/common/network", "vs/base/common/labels", "vs/base/common/stream", "vs/base/common/lifecycle", "vs/base/common/functional", "vs/base/common/arrays", "vs/base/common/errors", "vs/platform/configuration/common/configuration", "vs/platform/files/browser/webFileSystemAccess", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage"], function (require, exports, nls_1, cancellation_1, dialogs_1, files_1, notification_1, progress_1, files_2, files_3, editorService_1, async_1, buffer_1, resources_1, bulkEditService_1, explorerModel_1, uri_1, host_1, workspace_1, dnd_1, workspaceEditing_1, platform_1, dom_1, log_1, network_1, labels_1, stream_1, lifecycle_1, functional_1, arrays_1, errors_1, configuration_1, webFileSystemAccess_1, instantiation_1, storage_1) {
    "use strict";
    var BrowserFileUpload_1, FileDownload_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileDownload = exports.ExternalFileImport = exports.BrowserFileUpload = void 0;
    exports.getFileOverwriteConfirm = getFileOverwriteConfirm;
    exports.getMultipleFilesOverwriteConfirm = getMultipleFilesOverwriteConfirm;
    let BrowserFileUpload = class BrowserFileUpload {
        static { BrowserFileUpload_1 = this; }
        static { this.MAX_PARALLEL_UPLOADS = 20; }
        constructor(progressService, dialogService, explorerService, editorService, fileService) {
            this.progressService = progressService;
            this.dialogService = dialogService;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.fileService = fileService;
        }
        upload(target, source) {
            const cts = new cancellation_1.CancellationTokenSource();
            // Indicate progress globally
            const uploadPromise = this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                delay: 800,
                cancellable: true,
                title: (0, nls_1.localize)('uploadingFiles', "Uploading")
            }, async (progress) => this.doUpload(target, this.toTransfer(source), progress, cts.token), () => cts.dispose(true));
            // Also indicate progress in the files view
            this.progressService.withProgress({ location: files_3.VIEW_ID, delay: 500 }, () => uploadPromise);
            return uploadPromise;
        }
        toTransfer(source) {
            if ((0, dom_1.isDragEvent)(source)) {
                return source.dataTransfer;
            }
            const transfer = { items: [] };
            // We want to reuse the same code for uploading from
            // Drag & Drop as well as input element based upload
            // so we convert into webkit data transfer when the
            // input element approach is used (simplified).
            for (const file of source) {
                transfer.items.push({
                    webkitGetAsEntry: () => {
                        return {
                            name: file.name,
                            isDirectory: false,
                            isFile: true,
                            createReader: () => { throw new Error('Unsupported for files'); },
                            file: resolve => resolve(file)
                        };
                    }
                });
            }
            return transfer;
        }
        async doUpload(target, source, progress, token) {
            const items = source.items;
            // Somehow the items thing is being modified at random, maybe as a security
            // measure since this is a DND operation. As such, we copy the items into
            // an array we own as early as possible before using it.
            const entries = [];
            for (const item of items) {
                entries.push(item.webkitGetAsEntry());
            }
            const results = [];
            const operation = {
                startTime: Date.now(),
                progressScheduler: new async_1.RunOnceWorker(steps => { progress.report(steps[steps.length - 1]); }, 1000),
                filesTotal: entries.length,
                filesUploaded: 0,
                totalBytesUploaded: 0
            };
            // Upload all entries in parallel up to a
            // certain maximum leveraging the `Limiter`
            const uploadLimiter = new async_1.Limiter(BrowserFileUpload_1.MAX_PARALLEL_UPLOADS);
            await async_1.Promises.settled(entries.map(entry => {
                return uploadLimiter.queue(async () => {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    // Confirm overwrite as needed
                    if (target && entry.name && target.getChild(entry.name)) {
                        const { confirmed } = await this.dialogService.confirm(getFileOverwriteConfirm(entry.name));
                        if (!confirmed) {
                            return;
                        }
                        await this.explorerService.applyBulkEdit([new bulkEditService_1.ResourceFileEdit((0, resources_1.joinPath)(target.resource, entry.name), undefined, { recursive: true, folder: target.getChild(entry.name)?.isDirectory })], {
                            undoLabel: (0, nls_1.localize)('overwrite', "Overwrite {0}", entry.name),
                            progressLabel: (0, nls_1.localize)('overwriting', "Overwriting {0}", entry.name),
                        });
                        if (token.isCancellationRequested) {
                            return;
                        }
                    }
                    // Upload entry
                    const result = await this.doUploadEntry(entry, target.resource, target, progress, operation, token);
                    if (result) {
                        results.push(result);
                    }
                });
            }));
            operation.progressScheduler.dispose();
            // Open uploaded file in editor only if we upload just one
            const firstUploadedFile = results[0];
            if (!token.isCancellationRequested && firstUploadedFile?.isFile) {
                await this.editorService.openEditor({ resource: firstUploadedFile.resource, options: { pinned: true } });
            }
        }
        async doUploadEntry(entry, parentResource, target, progress, operation, token) {
            if (token.isCancellationRequested || !entry.name || (!entry.isFile && !entry.isDirectory)) {
                return undefined;
            }
            // Report progress
            let fileBytesUploaded = 0;
            const reportProgress = (fileSize, bytesUploaded) => {
                fileBytesUploaded += bytesUploaded;
                operation.totalBytesUploaded += bytesUploaded;
                const bytesUploadedPerSecond = operation.totalBytesUploaded / ((Date.now() - operation.startTime) / 1000);
                // Small file
                let message;
                if (fileSize < files_1.ByteSize.MB) {
                    if (operation.filesTotal === 1) {
                        message = `${entry.name}`;
                    }
                    else {
                        message = (0, nls_1.localize)('uploadProgressSmallMany', "{0} of {1} files ({2}/s)", operation.filesUploaded, operation.filesTotal, files_1.ByteSize.formatSize(bytesUploadedPerSecond));
                    }
                }
                // Large file
                else {
                    message = (0, nls_1.localize)('uploadProgressLarge', "{0} ({1} of {2}, {3}/s)", entry.name, files_1.ByteSize.formatSize(fileBytesUploaded), files_1.ByteSize.formatSize(fileSize), files_1.ByteSize.formatSize(bytesUploadedPerSecond));
                }
                // Report progress but limit to update only once per second
                operation.progressScheduler.work({ message });
            };
            operation.filesUploaded++;
            reportProgress(0, 0);
            // Handle file upload
            const resource = (0, resources_1.joinPath)(parentResource, entry.name);
            if (entry.isFile) {
                const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // Chrome/Edge/Firefox support stream method, but only use it for
                // larger files to reduce the overhead of the streaming approach
                if (typeof file.stream === 'function' && file.size > files_1.ByteSize.MB) {
                    await this.doUploadFileBuffered(resource, file, reportProgress, token);
                }
                // Fallback to unbuffered upload for other browsers or small files
                else {
                    await this.doUploadFileUnbuffered(resource, file, reportProgress);
                }
                return { isFile: true, resource };
            }
            // Handle folder upload
            else {
                // Create target folder
                await this.fileService.createFolder(resource);
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // Recursive upload files in this directory
                const dirReader = entry.createReader();
                const childEntries = [];
                let done = false;
                do {
                    const childEntriesChunk = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
                    if (childEntriesChunk.length > 0) {
                        childEntries.push(...childEntriesChunk);
                    }
                    else {
                        done = true; // an empty array is a signal that all entries have been read
                    }
                } while (!done && !token.isCancellationRequested);
                // Update operation total based on new counts
                operation.filesTotal += childEntries.length;
                // Split up files from folders to upload
                const folderTarget = target && target.getChild(entry.name) || undefined;
                const fileChildEntries = [];
                const folderChildEntries = [];
                for (const childEntry of childEntries) {
                    if (childEntry.isFile) {
                        fileChildEntries.push(childEntry);
                    }
                    else if (childEntry.isDirectory) {
                        folderChildEntries.push(childEntry);
                    }
                }
                // Upload files (up to `MAX_PARALLEL_UPLOADS` in parallel)
                const fileUploadQueue = new async_1.Limiter(BrowserFileUpload_1.MAX_PARALLEL_UPLOADS);
                await async_1.Promises.settled(fileChildEntries.map(fileChildEntry => {
                    return fileUploadQueue.queue(() => this.doUploadEntry(fileChildEntry, resource, folderTarget, progress, operation, token));
                }));
                // Upload folders (sequentially give we don't know their sizes)
                for (const folderChildEntry of folderChildEntries) {
                    await this.doUploadEntry(folderChildEntry, resource, folderTarget, progress, operation, token);
                }
                return { isFile: false, resource };
            }
        }
        async doUploadFileBuffered(resource, file, progressReporter, token) {
            const writeableStream = (0, buffer_1.newWriteableBufferStream)({
                // Set a highWaterMark to prevent the stream
                // for file upload to produce large buffers
                // in-memory
                highWaterMark: 10
            });
            const writeFilePromise = this.fileService.writeFile(resource, writeableStream);
            // Read the file in chunks using File.stream() web APIs
            try {
                const reader = file.stream().getReader();
                let res = await reader.read();
                while (!res.done) {
                    if (token.isCancellationRequested) {
                        break;
                    }
                    // Write buffer into stream but make sure to wait
                    // in case the `highWaterMark` is reached
                    const buffer = buffer_1.VSBuffer.wrap(res.value);
                    await writeableStream.write(buffer);
                    if (token.isCancellationRequested) {
                        break;
                    }
                    // Report progress
                    progressReporter(file.size, buffer.byteLength);
                    res = await reader.read();
                }
                writeableStream.end(undefined);
            }
            catch (error) {
                writeableStream.error(error);
                writeableStream.end();
            }
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Wait for file being written to target
            await writeFilePromise;
        }
        doUploadFileUnbuffered(resource, file, progressReporter) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        if (event.target?.result instanceof ArrayBuffer) {
                            const buffer = buffer_1.VSBuffer.wrap(new Uint8Array(event.target.result));
                            await this.fileService.writeFile(resource, buffer);
                            // Report progress
                            progressReporter(file.size, buffer.byteLength);
                        }
                        else {
                            throw new Error('Could not read from dropped file.');
                        }
                        resolve();
                    }
                    catch (error) {
                        reject(error);
                    }
                };
                // Start reading the file to trigger `onload`
                reader.readAsArrayBuffer(file);
            });
        }
    };
    exports.BrowserFileUpload = BrowserFileUpload;
    exports.BrowserFileUpload = BrowserFileUpload = BrowserFileUpload_1 = __decorate([
        __param(0, progress_1.IProgressService),
        __param(1, dialogs_1.IDialogService),
        __param(2, files_2.IExplorerService),
        __param(3, editorService_1.IEditorService),
        __param(4, files_1.IFileService)
    ], BrowserFileUpload);
    //#endregion
    //#region External File Import (drag and drop)
    let ExternalFileImport = class ExternalFileImport {
        constructor(fileService, hostService, contextService, configurationService, dialogService, workspaceEditingService, explorerService, editorService, progressService, notificationService, instantiationService) {
            this.fileService = fileService;
            this.hostService = hostService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.dialogService = dialogService;
            this.workspaceEditingService = workspaceEditingService;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.progressService = progressService;
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
        }
        async import(target, source, targetWindow) {
            const cts = new cancellation_1.CancellationTokenSource();
            // Indicate progress globally
            const importPromise = this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                delay: 800,
                cancellable: true,
                title: (0, nls_1.localize)('copyingFiles', "Copying...")
            }, async () => await this.doImport(target, source, targetWindow, cts.token), () => cts.dispose(true));
            // Also indicate progress in the files view
            this.progressService.withProgress({ location: files_3.VIEW_ID, delay: 500 }, () => importPromise);
            return importPromise;
        }
        async doImport(target, source, targetWindow, token) {
            // Activate all providers for the resources dropped
            const candidateFiles = (0, arrays_1.coalesce)((await this.instantiationService.invokeFunction(accessor => (0, dnd_1.extractEditorsAndFilesDropData)(accessor, source))).map(editor => editor.resource));
            await Promise.all(candidateFiles.map(resource => this.fileService.activateProvider(resource.scheme)));
            // Check for dropped external files to be folders
            const files = (0, arrays_1.coalesce)(candidateFiles.filter(resource => this.fileService.hasProvider(resource)));
            const resolvedFiles = await this.fileService.resolveAll(files.map(file => ({ resource: file })));
            if (token.isCancellationRequested) {
                return;
            }
            // Pass focus to window
            this.hostService.focus(targetWindow);
            // Handle folders by adding to workspace if we are in workspace context and if dropped on top
            const folders = resolvedFiles.filter(resolvedFile => resolvedFile.success && resolvedFile.stat?.isDirectory).map(resolvedFile => ({ uri: resolvedFile.stat.resource }));
            if (folders.length > 0 && target.isRoot) {
                let ImportChoice;
                (function (ImportChoice) {
                    ImportChoice[ImportChoice["Copy"] = 1] = "Copy";
                    ImportChoice[ImportChoice["Add"] = 2] = "Add";
                })(ImportChoice || (ImportChoice = {}));
                const buttons = [
                    {
                        label: folders.length > 1 ?
                            (0, nls_1.localize)('copyFolders', "&&Copy Folders") :
                            (0, nls_1.localize)('copyFolder', "&&Copy Folder"),
                        run: () => ImportChoice.Copy
                    }
                ];
                let message;
                // We only allow to add a folder to the workspace if there is already a workspace folder with that scheme
                const workspaceFolderSchemas = this.contextService.getWorkspace().folders.map(folder => folder.uri.scheme);
                if (folders.some(folder => workspaceFolderSchemas.indexOf(folder.uri.scheme) >= 0)) {
                    buttons.unshift({
                        label: folders.length > 1 ?
                            (0, nls_1.localize)('addFolders', "&&Add Folders to Workspace") :
                            (0, nls_1.localize)('addFolder', "&&Add Folder to Workspace"),
                        run: () => ImportChoice.Add
                    });
                    message = folders.length > 1 ?
                        (0, nls_1.localize)('dropFolders', "Do you want to copy the folders or add the folders to the workspace?") :
                        (0, nls_1.localize)('dropFolder', "Do you want to copy '{0}' or add '{0}' as a folder to the workspace?", (0, resources_1.basename)(folders[0].uri));
                }
                else {
                    message = folders.length > 1 ?
                        (0, nls_1.localize)('copyfolders', "Are you sure to want to copy folders?") :
                        (0, nls_1.localize)('copyfolder', "Are you sure to want to copy '{0}'?", (0, resources_1.basename)(folders[0].uri));
                }
                const { result } = await this.dialogService.prompt({
                    type: notification_1.Severity.Info,
                    message,
                    buttons,
                    cancelButton: true
                });
                // Add folders
                if (result === ImportChoice.Add) {
                    return this.workspaceEditingService.addFolders(folders);
                }
                // Copy resources
                if (result === ImportChoice.Copy) {
                    return this.importResources(target, files, token);
                }
            }
            // Handle dropped files (only support FileStat as target)
            else if (target instanceof explorerModel_1.ExplorerItem) {
                return this.importResources(target, files, token);
            }
        }
        async importResources(target, resources, token) {
            if (resources && resources.length > 0) {
                // Resolve target to check for name collisions and ask user
                const targetStat = await this.fileService.resolve(target.resource);
                if (token.isCancellationRequested) {
                    return;
                }
                // Check for name collisions
                const targetNames = new Set();
                const caseSensitive = this.fileService.hasCapability(target.resource, 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
                if (targetStat.children) {
                    targetStat.children.forEach(child => {
                        targetNames.add(caseSensitive ? child.name : child.name.toLowerCase());
                    });
                }
                let inaccessibleFileCount = 0;
                const resourcesFiltered = (0, arrays_1.coalesce)((await async_1.Promises.settled(resources.map(async (resource) => {
                    const fileDoesNotExist = !(await this.fileService.exists(resource));
                    if (fileDoesNotExist) {
                        inaccessibleFileCount++;
                        return undefined;
                    }
                    if (targetNames.has(caseSensitive ? (0, resources_1.basename)(resource) : (0, resources_1.basename)(resource).toLowerCase())) {
                        const confirmationResult = await this.dialogService.confirm(getFileOverwriteConfirm((0, resources_1.basename)(resource)));
                        if (!confirmationResult.confirmed) {
                            return undefined;
                        }
                    }
                    return resource;
                }))));
                if (inaccessibleFileCount > 0) {
                    this.notificationService.error(inaccessibleFileCount > 1 ? (0, nls_1.localize)('filesInaccessible', "Some or all of the dropped files could not be accessed for import.") : (0, nls_1.localize)('fileInaccessible', "The dropped file could not be accessed for import."));
                }
                // Copy resources through bulk edit API
                const resourceFileEdits = resourcesFiltered.map(resource => {
                    const sourceFileName = (0, resources_1.basename)(resource);
                    const targetFile = (0, resources_1.joinPath)(target.resource, sourceFileName);
                    return new bulkEditService_1.ResourceFileEdit(resource, targetFile, { overwrite: true, copy: true });
                });
                const undoLevel = this.configurationService.getValue().explorer.confirmUndo;
                await this.explorerService.applyBulkEdit(resourceFileEdits, {
                    undoLabel: resourcesFiltered.length === 1 ?
                        (0, nls_1.localize)({ comment: ['substitution will be the name of the file that was imported'], key: 'importFile' }, "Import {0}", (0, resources_1.basename)(resourcesFiltered[0])) :
                        (0, nls_1.localize)({ comment: ['substitution will be the number of files that were imported'], key: 'importnFile' }, "Import {0} resources", resourcesFiltered.length),
                    progressLabel: resourcesFiltered.length === 1 ?
                        (0, nls_1.localize)({ comment: ['substitution will be the name of the file that was copied'], key: 'copyingFile' }, "Copying {0}", (0, resources_1.basename)(resourcesFiltered[0])) :
                        (0, nls_1.localize)({ comment: ['substitution will be the number of files that were copied'], key: 'copyingnFile' }, "Copying {0} resources", resourcesFiltered.length),
                    progressLocation: 10 /* ProgressLocation.Window */,
                    confirmBeforeUndo: undoLevel === "verbose" /* UndoConfirmLevel.Verbose */ || undoLevel === "default" /* UndoConfirmLevel.Default */,
                });
                // if we only add one file, just open it directly
                if (resourceFileEdits.length === 1) {
                    const item = this.explorerService.findClosest(resourceFileEdits[0].newResource);
                    if (item && !item.isDirectory) {
                        this.editorService.openEditor({ resource: item.resource, options: { pinned: true } });
                    }
                }
            }
        }
    };
    exports.ExternalFileImport = ExternalFileImport;
    exports.ExternalFileImport = ExternalFileImport = __decorate([
        __param(0, files_1.IFileService),
        __param(1, host_1.IHostService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, workspaceEditing_1.IWorkspaceEditingService),
        __param(6, files_2.IExplorerService),
        __param(7, editorService_1.IEditorService),
        __param(8, progress_1.IProgressService),
        __param(9, notification_1.INotificationService),
        __param(10, instantiation_1.IInstantiationService)
    ], ExternalFileImport);
    let FileDownload = class FileDownload {
        static { FileDownload_1 = this; }
        static { this.LAST_USED_DOWNLOAD_PATH_STORAGE_KEY = 'workbench.explorer.downloadPath'; }
        constructor(fileService, explorerService, progressService, logService, fileDialogService, storageService) {
            this.fileService = fileService;
            this.explorerService = explorerService;
            this.progressService = progressService;
            this.logService = logService;
            this.fileDialogService = fileDialogService;
            this.storageService = storageService;
        }
        download(source) {
            const cts = new cancellation_1.CancellationTokenSource();
            // Indicate progress globally
            const downloadPromise = this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                delay: 800,
                cancellable: platform_1.isWeb,
                title: (0, nls_1.localize)('downloadingFiles', "Downloading")
            }, async (progress) => this.doDownload(source, progress, cts), () => cts.dispose(true));
            // Also indicate progress in the files view
            this.progressService.withProgress({ location: files_3.VIEW_ID, delay: 500 }, () => downloadPromise);
            return downloadPromise;
        }
        async doDownload(sources, progress, cts) {
            for (const source of sources) {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                // Web: use DOM APIs to download files with optional support
                // for folders and large files
                if (platform_1.isWeb) {
                    await this.doDownloadBrowser(source.resource, progress, cts);
                }
                // Native: use working copy file service to get at the contents
                else {
                    await this.doDownloadNative(source, progress, cts);
                }
            }
        }
        async doDownloadBrowser(resource, progress, cts) {
            const stat = await this.fileService.resolve(resource, { resolveMetadata: true });
            if (cts.token.isCancellationRequested) {
                return;
            }
            const maxBlobDownloadSize = 32 * files_1.ByteSize.MB; // avoid to download via blob-trick >32MB to avoid memory pressure
            const preferFileSystemAccessWebApis = stat.isDirectory || stat.size > maxBlobDownloadSize;
            // Folder: use FS APIs to download files and folders if available and preferred
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (preferFileSystemAccessWebApis && webFileSystemAccess_1.WebFileSystemAccess.supported(activeWindow)) {
                try {
                    const parentFolder = await activeWindow.showDirectoryPicker();
                    const operation = {
                        startTime: Date.now(),
                        progressScheduler: new async_1.RunOnceWorker(steps => { progress.report(steps[steps.length - 1]); }, 1000),
                        filesTotal: stat.isDirectory ? 0 : 1, // folders increment filesTotal within downloadFolder method
                        filesDownloaded: 0,
                        totalBytesDownloaded: 0,
                        fileBytesDownloaded: 0
                    };
                    if (stat.isDirectory) {
                        const targetFolder = await parentFolder.getDirectoryHandle(stat.name, { create: true });
                        await this.downloadFolderBrowser(stat, targetFolder, operation, cts.token);
                    }
                    else {
                        await this.downloadFileBrowser(parentFolder, stat, operation, cts.token);
                    }
                    operation.progressScheduler.dispose();
                }
                catch (error) {
                    this.logService.warn(error);
                    cts.cancel(); // `showDirectoryPicker` will throw an error when the user cancels
                }
            }
            // File: use traditional download to circumvent browser limitations
            else if (stat.isFile) {
                let bufferOrUri;
                try {
                    bufferOrUri = (await this.fileService.readFile(stat.resource, { limits: { size: maxBlobDownloadSize } }, cts.token)).value.buffer;
                }
                catch (error) {
                    bufferOrUri = network_1.FileAccess.uriToBrowserUri(stat.resource);
                }
                if (!cts.token.isCancellationRequested) {
                    (0, dom_1.triggerDownload)(bufferOrUri, stat.name);
                }
            }
        }
        async downloadFileBufferedBrowser(resource, target, operation, token) {
            const contents = await this.fileService.readFileStream(resource, undefined, token);
            if (token.isCancellationRequested) {
                target.close();
                return;
            }
            return new Promise((resolve, reject) => {
                const sourceStream = contents.value;
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add((0, lifecycle_1.toDisposable)(() => target.close()));
                disposables.add((0, functional_1.createSingleCallFunction)(token.onCancellationRequested)(() => {
                    disposables.dispose();
                    reject((0, errors_1.canceled)());
                }));
                (0, stream_1.listenStream)(sourceStream, {
                    onData: data => {
                        target.write(data.buffer);
                        this.reportProgress(contents.name, contents.size, data.byteLength, operation);
                    },
                    onError: error => {
                        disposables.dispose();
                        reject(error);
                    },
                    onEnd: () => {
                        disposables.dispose();
                        resolve();
                    }
                }, token);
            });
        }
        async downloadFileUnbufferedBrowser(resource, target, operation, token) {
            const contents = await this.fileService.readFile(resource, undefined, token);
            if (!token.isCancellationRequested) {
                target.write(contents.value.buffer);
                this.reportProgress(contents.name, contents.size, contents.value.byteLength, operation);
            }
            target.close();
        }
        async downloadFileBrowser(targetFolder, file, operation, token) {
            // Report progress
            operation.filesDownloaded++;
            operation.fileBytesDownloaded = 0; // reset for this file
            this.reportProgress(file.name, 0, 0, operation);
            // Start to download
            const targetFile = await targetFolder.getFileHandle(file.name, { create: true });
            const targetFileWriter = await targetFile.createWritable();
            // For large files, write buffered using streams
            if (file.size > files_1.ByteSize.MB) {
                return this.downloadFileBufferedBrowser(file.resource, targetFileWriter, operation, token);
            }
            // For small files prefer to write unbuffered to reduce overhead
            return this.downloadFileUnbufferedBrowser(file.resource, targetFileWriter, operation, token);
        }
        async downloadFolderBrowser(folder, targetFolder, operation, token) {
            if (folder.children) {
                operation.filesTotal += (folder.children.map(child => child.isFile)).length;
                for (const child of folder.children) {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    if (child.isFile) {
                        await this.downloadFileBrowser(targetFolder, child, operation, token);
                    }
                    else {
                        const childFolder = await targetFolder.getDirectoryHandle(child.name, { create: true });
                        const resolvedChildFolder = await this.fileService.resolve(child.resource, { resolveMetadata: true });
                        await this.downloadFolderBrowser(resolvedChildFolder, childFolder, operation, token);
                    }
                }
            }
        }
        reportProgress(name, fileSize, bytesDownloaded, operation) {
            operation.fileBytesDownloaded += bytesDownloaded;
            operation.totalBytesDownloaded += bytesDownloaded;
            const bytesDownloadedPerSecond = operation.totalBytesDownloaded / ((Date.now() - operation.startTime) / 1000);
            // Small file
            let message;
            if (fileSize < files_1.ByteSize.MB) {
                if (operation.filesTotal === 1) {
                    message = name;
                }
                else {
                    message = (0, nls_1.localize)('downloadProgressSmallMany', "{0} of {1} files ({2}/s)", operation.filesDownloaded, operation.filesTotal, files_1.ByteSize.formatSize(bytesDownloadedPerSecond));
                }
            }
            // Large file
            else {
                message = (0, nls_1.localize)('downloadProgressLarge', "{0} ({1} of {2}, {3}/s)", name, files_1.ByteSize.formatSize(operation.fileBytesDownloaded), files_1.ByteSize.formatSize(fileSize), files_1.ByteSize.formatSize(bytesDownloadedPerSecond));
            }
            // Report progress but limit to update only once per second
            operation.progressScheduler.work({ message });
        }
        async doDownloadNative(explorerItem, progress, cts) {
            progress.report({ message: explorerItem.name });
            let defaultUri;
            const lastUsedDownloadPath = this.storageService.get(FileDownload_1.LAST_USED_DOWNLOAD_PATH_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
            if (lastUsedDownloadPath) {
                defaultUri = (0, resources_1.joinPath)(uri_1.URI.file(lastUsedDownloadPath), explorerItem.name);
            }
            else {
                defaultUri = (0, resources_1.joinPath)(explorerItem.isDirectory ?
                    await this.fileDialogService.defaultFolderPath(network_1.Schemas.file) :
                    await this.fileDialogService.defaultFilePath(network_1.Schemas.file), explorerItem.name);
            }
            const destination = await this.fileDialogService.showSaveDialog({
                availableFileSystems: [network_1.Schemas.file],
                saveLabel: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)('downloadButton', "Download")),
                title: (0, nls_1.localize)('chooseWhereToDownload', "Choose Where to Download"),
                defaultUri
            });
            if (destination) {
                // Remember as last used download folder
                this.storageService.store(FileDownload_1.LAST_USED_DOWNLOAD_PATH_STORAGE_KEY, (0, resources_1.dirname)(destination).fsPath, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                // Perform download
                await this.explorerService.applyBulkEdit([new bulkEditService_1.ResourceFileEdit(explorerItem.resource, destination, { overwrite: true, copy: true })], {
                    undoLabel: (0, nls_1.localize)('downloadBulkEdit', "Download {0}", explorerItem.name),
                    progressLabel: (0, nls_1.localize)('downloadingBulkEdit', "Downloading {0}", explorerItem.name),
                    progressLocation: 10 /* ProgressLocation.Window */
                });
            }
            else {
                cts.cancel(); // User canceled a download. In case there were multiple files selected we should cancel the remainder of the prompts #86100
            }
        }
    };
    exports.FileDownload = FileDownload;
    exports.FileDownload = FileDownload = FileDownload_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, files_2.IExplorerService),
        __param(2, progress_1.IProgressService),
        __param(3, log_1.ILogService),
        __param(4, dialogs_1.IFileDialogService),
        __param(5, storage_1.IStorageService)
    ], FileDownload);
    //#endregion
    //#region Helpers
    function getFileOverwriteConfirm(name) {
        return {
            message: (0, nls_1.localize)('confirmOverwrite', "A file or folder with the name '{0}' already exists in the destination folder. Do you want to replace it?", name),
            detail: (0, nls_1.localize)('irreversible', "This action is irreversible!"),
            primaryButton: (0, nls_1.localize)({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
            type: 'warning'
        };
    }
    function getMultipleFilesOverwriteConfirm(files) {
        if (files.length > 1) {
            return {
                message: (0, nls_1.localize)('confirmManyOverwrites', "The following {0} files and/or folders already exist in the destination folder. Do you want to replace them?", files.length),
                detail: (0, dialogs_1.getFileNamesMessage)(files) + '\n' + (0, nls_1.localize)('irreversible', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
                type: 'warning'
            };
        }
        return getFileOverwriteConfirm((0, resources_1.basename)(files[0]));
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUltcG9ydEV4cG9ydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL2Jyb3dzZXIvZmlsZUltcG9ydEV4cG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBbzFCaEcsMERBT0M7SUFFRCw0RUFXQztJQW55Qk0sSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7O2lCQUVMLHlCQUFvQixHQUFHLEVBQUUsQUFBTCxDQUFNO1FBRWxELFlBQ29DLGVBQWlDLEVBQ25DLGFBQTZCLEVBQzNCLGVBQWlDLEVBQ25DLGFBQTZCLEVBQy9CLFdBQXlCO1lBSnJCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNuQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDM0Isb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ25DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMvQixnQkFBVyxHQUFYLFdBQVcsQ0FBYztRQUV6RCxDQUFDO1FBRUQsTUFBTSxDQUFDLE1BQW9CLEVBQUUsTUFBNEI7WUFDeEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxzQ0FBdUIsRUFBRSxDQUFDO1lBRTFDLDZCQUE2QjtZQUM3QixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FDdEQ7Z0JBQ0MsUUFBUSxrQ0FBeUI7Z0JBQ2pDLEtBQUssRUFBRSxHQUFHO2dCQUNWLFdBQVcsRUFBRSxJQUFJO2dCQUNqQixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDO2FBQzlDLEVBQ0QsS0FBSyxFQUFDLFFBQVEsRUFBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFN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