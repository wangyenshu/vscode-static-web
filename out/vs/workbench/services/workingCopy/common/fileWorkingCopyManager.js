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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/path/common/pathService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/workingCopy/common/storedFileWorkingCopyManager", "vs/workbench/services/workingCopy/common/untitledFileWorkingCopy", "vs/workbench/services/workingCopy/common/untitledFileWorkingCopyManager", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/network", "vs/workbench/services/decorations/common/decorations", "vs/base/common/codicons", "vs/platform/theme/common/colorRegistry"], function (require, exports, nls_1, event_1, async_1, cancellation_1, lifecycle_1, resources_1, uri_1, dialogs_1, files_1, editor_1, environmentService_1, pathService_1, uriIdentity_1, storedFileWorkingCopyManager_1, untitledFileWorkingCopy_1, untitledFileWorkingCopyManager_1, workingCopyFileService_1, label_1, log_1, notification_1, editorService_1, elevatedFileService_1, filesConfigurationService_1, lifecycle_2, workingCopyBackup_1, workingCopyEditorService_1, workingCopyService_1, network_1, decorations_1, codicons_1, colorRegistry_1) {
    "use strict";
    var FileWorkingCopyManager_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileWorkingCopyManager = void 0;
    let FileWorkingCopyManager = class FileWorkingCopyManager extends lifecycle_1.Disposable {
        static { FileWorkingCopyManager_1 = this; }
        static { this.FILE_WORKING_COPY_SAVE_CREATE_SOURCE = editor_1.SaveSourceRegistry.registerSource('fileWorkingCopyCreate.source', (0, nls_1.localize)('fileWorkingCopyCreate.source', "File Created")); }
        static { this.FILE_WORKING_COPY_SAVE_REPLACE_SOURCE = editor_1.SaveSourceRegistry.registerSource('fileWorkingCopyReplace.source', (0, nls_1.localize)('fileWorkingCopyReplace.source', "File Replaced")); }
        constructor(workingCopyTypeId, storedWorkingCopyModelFactory, untitledWorkingCopyModelFactory, fileService, lifecycleService, labelService, logService, workingCopyFileService, workingCopyBackupService, uriIdentityService, fileDialogService, filesConfigurationService, workingCopyService, notificationService, workingCopyEditorService, editorService, elevatedFileService, pathService, environmentService, dialogService, decorationsService) {
            super();
            this.workingCopyTypeId = workingCopyTypeId;
            this.storedWorkingCopyModelFactory = storedWorkingCopyModelFactory;
            this.untitledWorkingCopyModelFactory = untitledWorkingCopyModelFactory;
            this.fileService = fileService;
            this.logService = logService;
            this.workingCopyFileService = workingCopyFileService;
            this.uriIdentityService = uriIdentityService;
            this.fileDialogService = fileDialogService;
            this.filesConfigurationService = filesConfigurationService;
            this.pathService = pathService;
            this.environmentService = environmentService;
            this.dialogService = dialogService;
            this.decorationsService = decorationsService;
            // Stored file working copies manager
            this.stored = this._register(new storedFileWorkingCopyManager_1.StoredFileWorkingCopyManager(this.workingCopyTypeId, this.storedWorkingCopyModelFactory, fileService, lifecycleService, labelService, logService, workingCopyFileService, workingCopyBackupService, uriIdentityService, filesConfigurationService, workingCopyService, notificationService, workingCopyEditorService, editorService, elevatedFileService));
            // Untitled file working copies manager
            this.untitled = this._register(new untitledFileWorkingCopyManager_1.UntitledFileWorkingCopyManager(this.workingCopyTypeId, this.untitledWorkingCopyModelFactory, async (workingCopy, options) => {
                const result = await this.saveAs(workingCopy.resource, undefined, options);
                return result ? true : false;
            }, fileService, labelService, logService, workingCopyBackupService, workingCopyService));
            // Events
            this.onDidCreate = event_1.Event.any(this.stored.onDidCreate, this.untitled.onDidCreate);
            // Decorations
            this.provideDecorations();
        }
        //#region decorations
        provideDecorations() {
            // File working copy decorations
            const provider = this._register(new class extends lifecycle_1.Disposable {
                constructor(stored) {
                    super();
                    this.stored = stored;
                    this.label = (0, nls_1.localize)('fileWorkingCopyDecorations', "File Working Copy Decorations");
                    this._onDidChange = this._register(new event_1.Emitter());
                    this.onDidChange = this._onDidChange.event;
                    this.registerListeners();
                }
                registerListeners() {
                    // Creates
                    this._register(this.stored.onDidResolve(workingCopy => {
                        if (workingCopy.isReadonly() || workingCopy.hasState(4 /* StoredFileWorkingCopyState.ORPHAN */)) {
                            this._onDidChange.fire([workingCopy.resource]);
                        }
                    }));
                    // Removals: once a stored working copy is no longer
                    // under our control, make sure to signal this as
                    // decoration change because from this point on we
                    // have no way of updating the decoration anymore.
                    this._register(this.stored.onDidRemove(workingCopyUri => this._onDidChange.fire([workingCopyUri])));
                    // Changes
                    this._register(this.stored.onDidChangeReadonly(workingCopy => this._onDidChange.fire([workingCopy.resource])));
                    this._register(this.stored.onDidChangeOrphaned(workingCopy => this._onDidChange.fire([workingCopy.resource])));
                }
                provideDecorations(uri) {
                    const workingCopy = this.stored.get(uri);
                    if (!workingCopy || workingCopy.isDisposed()) {
                        return undefined;
                    }
                    const isReadonly = workingCopy.isReadonly();
                    const isOrphaned = workingCopy.hasState(4 /* StoredFileWorkingCopyState.ORPHAN */);
                    // Readonly + Orphaned
                    if (isReadonly && isOrphaned) {
                        return {
                            color: colorRegistry_1.listErrorForeground,
                            letter: codicons_1.Codicon.lockSmall,
                            strikethrough: true,
                            tooltip: (0, nls_1.localize)('readonlyAndDeleted', "Deleted, Read-only"),
                        };
                    }
                    // Readonly
                    else if (isReadonly) {
                        return {
                            letter: codicons_1.Codicon.lockSmall,
                            tooltip: (0, nls_1.localize)('readonly', "Read-only"),
                        };
                    }
                    // Orphaned
                    else if (isOrphaned) {
                        return {
                            color: colorRegistry_1.listErrorForeground,
                            strikethrough: true,
                            tooltip: (0, nls_1.localize)('deleted', "Deleted"),
                        };
                    }
                    return undefined;
                }
            }(this.stored));
            this._register(this.decorationsService.registerDecorationsProvider(provider));
        }
        //#endregin
        //#region get / get all
        get workingCopies() {
            return [...this.stored.workingCopies, ...this.untitled.workingCopies];
        }
        get(resource) {
            return this.stored.get(resource) ?? this.untitled.get(resource);
        }
        resolve(arg1, arg2) {
            if (uri_1.URI.isUri(arg1)) {
                // Untitled: via untitled manager
                if (arg1.scheme === network_1.Schemas.untitled) {
                    return this.untitled.resolve({ untitledResource: arg1 });
                }
                // else: via stored file manager
                else {
                    return this.stored.resolve(arg1, arg2);
                }
            }
            return this.untitled.resolve(arg1);
        }
        //#endregion
        //#region Save
        async saveAs(source, target, options) {
            // Get to target resource
            if (!target) {
                const workingCopy = this.get(source);
                if (workingCopy instanceof untitledFileWorkingCopy_1.UntitledFileWorkingCopy && workingCopy.hasAssociatedFilePath) {
                    target = await this.suggestSavePath(source);
                }
                else {
                    target = await this.fileDialogService.pickFileToSave(await this.suggestSavePath(options?.suggestedTarget ?? source), options?.availableFileSystems);
                }
            }
            if (!target) {
                return; // user canceled
            }
            // Ensure target is not marked as readonly and prompt otherwise
            if (this.filesConfigurationService.isReadonly(target)) {
                const confirmed = await this.confirmMakeWriteable(target);
                if (!confirmed) {
                    return;
                }
                else {
                    this.filesConfigurationService.updateReadonly(target, false);
                }
            }
            // Just save if target is same as working copies own resource
            // and we are not saving an untitled file working copy
            if (this.fileService.hasProvider(source) && (0, resources_1.isEqual)(source, target)) {
                return this.doSave(source, { ...options, force: true /* force to save, even if not dirty (https://github.com/microsoft/vscode/issues/99619) */ });
            }
            // If the target is different but of same identity, we
            // move the source to the target, knowing that the
            // underlying file system cannot have both and then save.
            // However, this will only work if the source exists
            // and is not orphaned, so we need to check that too.
            if (this.fileService.hasProvider(source) && this.uriIdentityService.extUri.isEqual(source, target) && (await this.fileService.exists(source))) {
                // Move via working copy file service to enable participants
                await this.workingCopyFileService.move([{ file: { source, target } }], cancellation_1.CancellationToken.None);
                // At this point we don't know whether we have a
                // working copy for the source or the target URI so we
                // simply try to save with both resources.
                return (await this.doSave(source, options)) ?? (await this.doSave(target, options));
            }
            // Perform normal "Save As"
            return this.doSaveAs(source, target, options);
        }
        async doSave(resource, options) {
            // Save is only possible with stored file working copies,
            // any other have to go via `saveAs` flow.
            const storedFileWorkingCopy = this.stored.get(resource);
            if (storedFileWorkingCopy) {
                const success = await storedFileWorkingCopy.save(options);
                if (success) {
                    return storedFileWorkingCopy;
                }
            }
            return undefined;
        }
        async doSaveAs(source, target, options) {
            let sourceContents;
            // If the source is an existing file working copy, we can directly
            // use that to copy the contents to the target destination
            const sourceWorkingCopy = this.get(source);
            if (sourceWorkingCopy?.isResolved()) {
                sourceContents = await sourceWorkingCopy.model.snapshot(1 /* SnapshotContext.Save */, cancellation_1.CancellationToken.None);
            }
            // Otherwise we resolve the contents from the underlying file
            else {
                sourceContents = (await this.fileService.readFileStream(source)).value;
            }
            // Resolve target
            const { targetFileExists, targetStoredFileWorkingCopy } = await this.doResolveSaveTarget(source, target);
            // Confirm to overwrite if we have an untitled file working copy with associated path where
            // the file actually exists on disk and we are instructed to save to that file path.
            // This can happen if the file was created after the untitled file was opened.
            // See https://github.com/microsoft/vscode/issues/67946
            if (sourceWorkingCopy instanceof untitledFileWorkingCopy_1.UntitledFileWorkingCopy &&
                sourceWorkingCopy.hasAssociatedFilePath &&
                targetFileExists &&
                this.uriIdentityService.extUri.isEqual(target, (0, resources_1.toLocalResource)(sourceWorkingCopy.resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme))) {
                const overwrite = await this.confirmOverwrite(target);
                if (!overwrite) {
                    return undefined;
                }
            }
            // Take over content from source to target
            await targetStoredFileWorkingCopy.model?.update(sourceContents, cancellation_1.CancellationToken.None);
            // Set source options depending on target exists or not
            if (!options?.source) {
                options = {
                    ...options,
                    source: targetFileExists ? FileWorkingCopyManager_1.FILE_WORKING_COPY_SAVE_REPLACE_SOURCE : FileWorkingCopyManager_1.FILE_WORKING_COPY_SAVE_CREATE_SOURCE
                };
            }
            // Save target
            const success = await targetStoredFileWorkingCopy.save({
                ...options,
                from: source,
                force: true /* force to save, even if not dirty (https://github.com/microsoft/vscode/issues/99619) */
            });
            if (!success) {
                return undefined;
            }
            // Revert the source
            try {
                await sourceWorkingCopy?.revert();
            }
            catch (error) {
                // It is possible that reverting the source fails, for example
                // when a remote is disconnected and we cannot read it anymore.
                // However, this should not interrupt the "Save As" flow, so
                // we gracefully catch the error and just log it.
                this.logService.error(error);
            }
            return targetStoredFileWorkingCopy;
        }
        async doResolveSaveTarget(source, target) {
            // Prefer an existing stored file working copy if it is already resolved
            // for the given target resource
            let targetFileExists = false;
            let targetStoredFileWorkingCopy = this.stored.get(target);
            if (targetStoredFileWorkingCopy?.isResolved()) {
                targetFileExists = true;
            }
            // Otherwise create the target working copy empty if
            // it does not exist already and resolve it from there
            else {
                targetFileExists = await this.fileService.exists(target);
                // Create target file adhoc if it does not exist yet
                if (!targetFileExists) {
                    await this.workingCopyFileService.create([{ resource: target }], cancellation_1.CancellationToken.None);
                }
                // At this point we need to resolve the target working copy
                // and we have to do an explicit check if the source URI
                // equals the target via URI identity. If they match and we
                // have had an existing working copy with the source, we
                // prefer that one over resolving the target. Otherwise we
                // would potentially introduce a
                if (this.uriIdentityService.extUri.isEqual(source, target) && this.get(source)) {
                    targetStoredFileWorkingCopy = await this.stored.resolve(source);
                }
                else {
                    targetStoredFileWorkingCopy = await this.stored.resolve(target);
                }
            }
            return { targetFileExists, targetStoredFileWorkingCopy };
        }
        async confirmOverwrite(resource) {
            const { confirmed } = await this.dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmOverwrite', "'{0}' already exists. Do you want to replace it?", (0, resources_1.basename)(resource)),
                detail: (0, nls_1.localize)('overwriteIrreversible', "A file or folder with the name '{0}' already exists in the folder '{1}'. Replacing it will overwrite its current contents.", (0, resources_1.basename)(resource), (0, resources_1.basename)((0, resources_1.dirname)(resource))),
                primaryButton: (0, nls_1.localize)({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace")
            });
            return confirmed;
        }
        async confirmMakeWriteable(resource) {
            const { confirmed } = await this.dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmMakeWriteable', "'{0}' is marked as read-only. Do you want to save anyway?", (0, resources_1.basename)(resource)),
                detail: (0, nls_1.localize)('confirmMakeWriteableDetail', "Paths can be configured as read-only via settings."),
                primaryButton: (0, nls_1.localize)({ key: 'makeWriteableButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Save Anyway")
            });
            return confirmed;
        }
        async suggestSavePath(resource) {
            // 1.) Just take the resource as is if the file service can handle it
            if (this.fileService.hasProvider(resource)) {
                return resource;
            }
            // 2.) Pick the associated file path for untitled working copies if any
            const workingCopy = this.get(resource);
            if (workingCopy instanceof untitledFileWorkingCopy_1.UntitledFileWorkingCopy && workingCopy.hasAssociatedFilePath) {
                return (0, resources_1.toLocalResource)(resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme);
            }
            const defaultFilePath = await this.fileDialogService.defaultFilePath();
            // 3.) Pick the working copy name if valid joined with default path
            if (workingCopy) {
                const candidatePath = (0, resources_1.joinPath)(defaultFilePath, workingCopy.name);
                if (await this.pathService.hasValidBasename(candidatePath, workingCopy.name)) {
                    return candidatePath;
                }
            }
            // 4.) Finally fallback to the name of the resource joined with default path
            return (0, resources_1.joinPath)(defaultFilePath, (0, resources_1.basename)(resource));
        }
        //#endregion
        //#region Lifecycle
        async destroy() {
            await async_1.Promises.settled([
                this.stored.destroy(),
                this.untitled.destroy()
            ]);
        }
    };
    exports.FileWorkingCopyManager = FileWorkingCopyManager;
    exports.FileWorkingCopyManager = FileWorkingCopyManager = FileWorkingCopyManager_1 = __decorate([
        __param(3, files_1.IFileService),
        __param(4, lifecycle_2.ILifecycleService),
        __param(5, label_1.ILabelService),
        __param(6, log_1.ILogService),
        __param(7, workingCopyFileService_1.IWorkingCopyFileService),
        __param(8, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(9, uriIdentity_1.IUriIdentityService),
        __param(10, dialogs_1.IFileDialogService),
        __param(11, filesConfigurationService_1.IFilesConfigurationService),
        __param(12, workingCopyService_1.IWorkingCopyService),
        __param(13, notification_1.INotificationService),
        __param(14, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(15, editorService_1.IEditorService),
        __param(16, elevatedFileService_1.IElevatedFileService),
        __param(17, pathService_1.IPathService),
        __param(18, environmentService_1.IWorkbenchEnvironmentService),
        __param(19, dialogs_1.IDialogService),
        __param(20, decorations_1.IDecorationsService)
    ], FileWorkingCopyManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVdvcmtpbmdDb3B5TWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3JraW5nQ29weS9jb21tb24vZmlsZVdvcmtpbmdDb3B5TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0l6RixJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1RyxTQUFRLHNCQUFVOztpQkFJN0cseUNBQW9DLEdBQUcsMkJBQWtCLENBQUMsY0FBYyxDQUFDLDhCQUE4QixFQUFFLElBQUEsY0FBUSxFQUFDLDhCQUE4QixFQUFFLGNBQWMsQ0FBQyxDQUFDLEFBQTlILENBQStIO2lCQUNuSywwQ0FBcUMsR0FBRywyQkFBa0IsQ0FBQyxjQUFjLENBQUMsK0JBQStCLEVBQUUsSUFBQSxjQUFRLEVBQUMsK0JBQStCLEVBQUUsZUFBZSxDQUFDLENBQUMsQUFBakksQ0FBa0k7UUFLL0wsWUFDa0IsaUJBQXlCLEVBQ3pCLDZCQUFvRSxFQUNwRSwrQkFBd0UsRUFDMUQsV0FBeUIsRUFDckMsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ1osVUFBdUIsRUFDWCxzQkFBK0MsRUFDOUQsd0JBQW1ELEVBQ3hDLGtCQUF1QyxFQUN4QyxpQkFBcUMsRUFDN0IseUJBQXFELEVBQzdFLGtCQUF1QyxFQUN0QyxtQkFBeUMsRUFDcEMsd0JBQW1ELEVBQzlELGFBQTZCLEVBQ3ZCLG1CQUF5QyxFQUNoQyxXQUF5QixFQUNULGtCQUFnRCxFQUM5RCxhQUE2QixFQUN4QixrQkFBdUM7WUFFN0UsS0FBSyxFQUFFLENBQUM7WUF0QlMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFRO1lBQ3pCLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBdUM7WUFDcEUsb0NBQStCLEdBQS9CLCtCQUErQixD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