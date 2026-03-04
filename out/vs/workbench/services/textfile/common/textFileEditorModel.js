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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/performance", "vs/base/common/types", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/common/editor", "vs/workbench/common/editor/textEditorModel", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/files/common/files", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/base/common/async", "vs/platform/log/common/log", "vs/base/common/path", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/workingCopy/common/workingCopy", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/label/common/label", "vs/base/common/cancellation", "vs/workbench/services/textfile/common/encoding", "vs/editor/common/model/textModel", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/workbench/services/path/common/pathService", "vs/base/common/resources", "vs/platform/accessibility/common/accessibility", "vs/editor/common/languages/modesRegistry", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls_1, event_1, performance_1, types_1, textfiles_1, editor_1, textEditorModel_1, workingCopyBackup_1, files_1, language_1, model_1, async_1, log_1, path_1, workingCopyService_1, workingCopy_1, filesConfigurationService_1, label_1, cancellation_1, encoding_1, textModel_1, languageDetectionWorkerService_1, pathService_1, resources_1, accessibility_1, modesRegistry_1, extensions_1) {
    "use strict";
    var TextFileEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileEditorModel = void 0;
    /**
     * The text file editor model listens to changes to its underlying code editor model and saves these changes through the file service back to the disk.
     */
    let TextFileEditorModel = class TextFileEditorModel extends textEditorModel_1.BaseTextEditorModel {
        static { TextFileEditorModel_1 = this; }
        static { this.TEXTFILE_SAVE_ENCODING_SOURCE = editor_1.SaveSourceRegistry.registerSource('textFileEncoding.source', (0, nls_1.localize)('textFileCreate.source', "File Encoding Changed")); }
        static { this.UNDO_REDO_SAVE_PARTICIPANTS_AUTO_SAVE_THROTTLE_THRESHOLD = 500; }
        constructor(resource, preferredEncoding, // encoding as chosen by the user
        preferredLanguageId, languageService, modelService, fileService, textFileService, workingCopyBackupService, logService, workingCopyService, filesConfigurationService, labelService, languageDetectionService, accessibilityService, pathService, extensionService) {
            super(modelService, languageService, languageDetectionService, accessibilityService);
            this.resource = resource;
            this.preferredEncoding = preferredEncoding;
            this.preferredLanguageId = preferredLanguageId;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.logService = logService;
            this.workingCopyService = workingCopyService;
            this.filesConfigurationService = filesConfigurationService;
            this.labelService = labelService;
            this.pathService = pathService;
            this.extensionService = extensionService;
            //#region Events
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidResolve = this._register(new event_1.Emitter());
            this.onDidResolve = this._onDidResolve.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidSaveError = this._register(new event_1.Emitter());
            this.onDidSaveError = this._onDidSaveError.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this._onDidChangeOrphaned = this._register(new event_1.Emitter());
            this.onDidChangeOrphaned = this._onDidChangeOrphaned.event;
            this._onDidChangeReadonly = this._register(new event_1.Emitter());
            this.onDidChangeReadonly = this._onDidChangeReadonly.event;
            //#endregion
            this.typeId = workingCopy_1.NO_TYPE_ID; // IMPORTANT: never change this to not break existing assumptions (e.g. backups)
            this.capabilities = 0 /* WorkingCopyCapabilities.None */;
            this.name = (0, path_1.basename)(this.labelService.getUriLabel(this.resource));
            this.resourceHasExtension = !!resources_1.extUri.extname(this.resource);
            this.versionId = 0;
            this.ignoreDirtyOnModelContentChange = false;
            this.ignoreSaveFromSaveParticipants = false;
            this.lastModelContentChangeFromUndoRedo = undefined;
            this.saveSequentializer = new async_1.TaskSequentializer();
            this.dirty = false;
            this.inConflictMode = false;
            this.inOrphanMode = false;
            this.inErrorMode = false;
            this.hasEncodingSetExplicitly = false;
            // Make known to working copy service
            this._register(this.workingCopyService.registerWorkingCopy(this));
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            this._register(this.filesConfigurationService.onDidChangeFilesAssociation(() => this.onDidChangeFilesAssociation()));
            this._register(this.filesConfigurationService.onDidChangeReadonly(() => this._onDidChangeReadonly.fire()));
        }
        async onDidFilesChange(e) {
            let fileEventImpactsModel = false;
            let newInOrphanModeGuess;
            // If we are currently orphaned, we check if the model file was added back
            if (this.inOrphanMode) {
                const modelFileAdded = e.contains(this.resource, 1 /* FileChangeType.ADDED */);
                if (modelFileAdded) {
                    newInOrphanModeGuess = false;
                    fileEventImpactsModel = true;
                }
            }
            // Otherwise we check if the model file was deleted
            else {
                const modelFileDeleted = e.contains(this.resource, 2 /* FileChangeType.DELETED */);
                if (modelFileDeleted) {
                    newInOrphanModeGuess = true;
                    fileEventImpactsModel = true;
                }
            }
            if (fileEventImpactsModel && this.inOrphanMode !== newInOrphanModeGuess) {
                let newInOrphanModeValidated = false;
                if (newInOrphanModeGuess) {
                    // We have received reports of users seeing delete events even though the file still
                    // exists (network shares issue: https://github.com/microsoft/vscode/issues/13665).
                    // Since we do not want to mark the model as orphaned, we have to check if the
                    // file is really gone and not just a faulty file event.
                    await (0, async_1.timeout)(100, cancellation_1.CancellationToken.None);
                    if (this.isDisposed()) {
                        newInOrphanModeValidated = true;
                    }
                    else {
                        const exists = await this.fileService.exists(this.resource);
                        newInOrphanModeValidated = !exists;
                    }
                }
                if (this.inOrphanMode !== newInOrphanModeValidated && !this.isDisposed()) {
                    this.setOrphaned(newInOrphanModeValidated);
                }
            }
        }
        setOrphaned(orphaned) {
            if (this.inOrphanMode !== orphaned) {
                this.inOrphanMode = orphaned;
                this._onDidChangeOrphaned.fire();
            }
        }
        onDidChangeFilesAssociation() {
            if (!this.isResolved()) {
                return;
            }
            const firstLineText = this.getFirstLineText(this.textEditorModel);
            const languageSelection = this.getOrCreateLanguage(this.resource, this.languageService, this.preferredLanguageId, firstLineText);
            this.textEditorModel.setLanguage(languageSelection);
        }
        setLanguageId(languageId, source) {
            super.setLanguageId(languageId, source);
            this.preferredLanguageId = languageId;
        }
        //#region Backup
        async backup(token) {
            // Fill in metadata if we are resolved
            let meta = undefined;
            if (this.lastResolvedFileStat) {
                meta = {
                    mtime: this.lastResolvedFileStat.mtime,
                    ctime: this.lastResolvedFileStat.ctime,
                    size: this.lastResolvedFileStat.size,
                    etag: this.lastResolvedFileStat.etag,
                    orphaned: this.inOrphanMode
                };
            }
            // Fill in content the same way we would do when
            // saving the file via the text file service
            // encoding support (hardcode UTF-8)
            const content = await this.textFileService.getEncodedReadable(this.resource, this.createSnapshot() ?? undefined, { encoding: encoding_1.UTF8 });
            return { meta, content };
        }
        //#endregion
        //#region Revert
        async revert(options) {
            if (!this.isResolved()) {
                return;
            }
            // Unset flags
            const wasDirty = this.dirty;
            const undo = this.doSetDirty(false);
            // Force read from disk unless reverting soft
            const softUndo = options?.soft;
            if (!softUndo) {
                try {
                    await this.forceResolveFromFile();
                }
                catch (error) {
                    // FileNotFound means the file got deleted meanwhile, so ignore it
                    if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        // Set flags back to previous values, we are still dirty if revert failed
                        undo();
                        throw error;
                    }
                }
            }
            // Emit file change event
            this._onDidRevert.fire();
            // Emit dirty change event
            if (wasDirty) {
                this._onDidChangeDirty.fire();
            }
        }
        //#endregion
        //#region Resolve
        async resolve(options) {
            this.trace('resolve() - enter');
            (0, performance_1.mark)('code/willResolveTextFileEditorModel');
            // Return early if we are disposed
            if (this.isDisposed()) {
                this.trace('resolve() - exit - without resolving because model is disposed');
                return;
            }
            // Unless there are explicit contents provided, it is important that we do not
            // resolve a model that is dirty or is in the process of saving to prevent data
            // loss.
            if (!options?.contents && (this.dirty || this.saveSequentializer.isRunning())) {
                this.trace('resolve() - exit - without resolving because model is dirty or being saved');
                return;
            }
            // Resolve either from backup or from file
            await this.doResolve(options);
            (0, performance_1.mark)('code/didResolveTextFileEditorModel');
        }
        async doResolve(options) {
            // First check if we have contents to use for the model
            if (options?.contents) {
                return this.resolveFromBuffer(options.contents, options);
            }
            // Second, check if we have a backup to resolve from (only for new models)
            const isNewModel = !this.isResolved();
            if (isNewModel) {
                const resolvedFromBackup = await this.resolveFromBackup(options);
                if (resolvedFromBackup) {
                    return;
                }
            }
            // Finally, resolve from file resource
            return this.resolveFromFile(options);
        }
        async resolveFromBuffer(buffer, options) {
            this.trace('resolveFromBuffer()');
            // Try to resolve metdata from disk
            let mtime;
            let ctime;
            let size;
            let etag;
            try {
                const metadata = await this.fileService.stat(this.resource);
                mtime = metadata.mtime;
                ctime = metadata.ctime;
                size = metadata.size;
                etag = metadata.etag;
                // Clear orphaned state when resolving was successful
                this.setOrphaned(false);
            }
            catch (error) {
                // Put some fallback values in error case
                mtime = Date.now();
                ctime = Date.now();
                size = 0;
                etag = files_1.ETAG_DISABLED;
                // Apply orphaned state based on error code
                this.setOrphaned(error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */);
            }
            const preferredEncoding = await this.textFileService.encoding.getPreferredWriteEncoding(this.resource, this.preferredEncoding);
            // Resolve with buffer
            this.resolveFromContent({
                resource: this.resource,
                name: this.name,
                mtime,
                ctime,
                size,
                etag,
                value: buffer,
                encoding: preferredEncoding.encoding,
                readonly: false,
                locked: false
            }, true /* dirty (resolved from buffer) */, options);
        }
        async resolveFromBackup(options) {
            // Resolve backup if any
            const backup = await this.workingCopyBackupService.resolve(this);
            // Resolve preferred encoding if we need it
            let encoding = encoding_1.UTF8;
            if (backup) {
                encoding = (await this.textFileService.encoding.getPreferredWriteEncoding(this.resource, this.preferredEncoding)).encoding;
            }
            // Abort if someone else managed to resolve the model by now
            const isNewModel = !this.isResolved();
            if (!isNewModel) {
                this.trace('resolveFromBackup() - exit - without resolving because previously new model got created meanwhile');
                return true; // imply that resolving has happened in another operation
            }
            // Try to resolve from backup if we have any
            if (backup) {
                await this.doResolveFromBackup(backup, encoding, options);
                return true;
            }
            // Otherwise signal back that resolving did not happen
            return false;
        }
        async doResolveFromBackup(backup, encoding, options) {
            this.trace('doResolveFromBackup()');
            // Resolve with backup
            this.resolveFromContent({
                resource: this.resource,
                name: this.name,
                mtime: backup.meta ? backup.meta.mtime : Date.now(),
                ctime: backup.meta ? backup.meta.ctime : Date.now(),
                size: backup.meta ? backup.meta.size : 0,
                etag: backup.meta ? backup.meta.etag : files_1.ETAG_DISABLED, // etag disabled if unknown!
                value: await (0, textModel_1.createTextBufferFactoryFromStream)(await this.textFileService.getDecodedStream(this.resource, backup.value, { encoding: encoding_1.UTF8 })),
                encoding,
                readonly: false,
                locked: false
            }, true /* dirty (resolved from backup) */, options);
            // Restore orphaned flag based on state
            if (backup.meta?.orphaned) {
                this.setOrphaned(true);
            }
        }
        async resolveFromFile(options) {
            this.trace('resolveFromFile()');
            const forceReadFromFile = options?.forceReadFromFile;
            const allowBinary = this.isResolved() /* always allow if we resolved previously */ || options?.allowBinary;
            // Decide on etag
            let etag;
            if (forceReadFromFile) {
                etag = files_1.ETAG_DISABLED; // disable ETag if we enforce to read from disk
            }
            else if (this.lastResolvedFileStat) {
                etag = this.lastResolvedFileStat.etag; // otherwise respect etag to support caching
            }
            // Remember current version before doing any long running operation
            // to ensure we are not changing a model that was changed meanwhile
            const currentVersionId = this.versionId;
            // Resolve Content
            try {
                const content = await this.textFileService.readStream(this.resource, {
                    acceptTextOnly: !allowBinary,
                    etag,
                    encoding: this.preferredEncoding,
                    limits: options?.limits
                });
                // Clear orphaned state when resolving was successful
                this.setOrphaned(false);
                // Return early if the model content has changed
                // meanwhile to prevent loosing any changes
                if (currentVersionId !== this.versionId) {
                    this.trace('resolveFromFile() - exit - without resolving because model content changed');
                    return;
                }
                return this.resolveFromContent(content, false /* not dirty (resolved from file) */, options);
            }
            catch (error) {
                const result = error.fileOperationResult;
                // Apply orphaned state based on error code
                this.setOrphaned(result === 1 /* FileOperationResult.FILE_NOT_FOUND */);
                // NotModified status is expected and can be handled gracefully
                // if we are resolved. We still want to update our last resolved
                // stat to e.g. detect changes to the file's readonly state
                if (this.isResolved() && result === 2 /* FileOperationResult.FILE_NOT_MODIFIED_SINCE */) {
                    if (error instanceof files_1.NotModifiedSinceFileOperationError) {
                        this.updateLastResolvedFileStat(error.stat);
                    }
                    return;
                }
                // Unless we are forced to read from the file, Ignore when a model has been resolved once
                // and the file was deleted meanwhile. Since we already have the model resolved, we can return
                // to this state and update the orphaned flag to indicate that this model has no version on
                // disk anymore.
                if (this.isResolved() && result === 1 /* FileOperationResult.FILE_NOT_FOUND */ && !forceReadFromFile) {
                    return;
                }
                // Otherwise bubble up the error
                throw error;
            }
        }
        resolveFromContent(content, dirty, options) {
            this.trace('resolveFromContent() - enter');
            // Return early if we are disposed
            if (this.isDisposed()) {
                this.trace('resolveFromContent() - exit - because model is disposed');
                return;
            }
            // Update our resolved disk stat model
            this.updateLastResolvedFileStat({
                resource: this.resource,
                name: content.name,
                mtime: content.mtime,
                ctime: content.ctime,
                size: content.size,
                etag: content.etag,
                readonly: content.readonly,
                locked: content.locked,
                isFile: true,
                isDirectory: false,
                isSymbolicLink: false,
                children: undefined
            });
            // Keep the original encoding to not loose it when saving
            const oldEncoding = this.contentEncoding;
            this.contentEncoding = content.encoding;
            // Handle events if encoding changed
            if (this.preferredEncoding) {
                this.updatePreferredEncoding(this.contentEncoding); // make sure to reflect the real encoding of the file (never out of sync)
            }
            else if (oldEncoding !== this.contentEncoding) {
                this._onDidChangeEncoding.fire();
            }
            // Update Existing Model
            if (this.textEditorModel) {
                this.doUpdateTextModel(content.value);
            }
            // Create New Model
            else {
                this.doCreateTextModel(content.resource, content.value);
            }
            // Update model dirty flag. This is very important to call
            // in both cases of dirty or not because it conditionally
            // updates the `bufferSavedVersionId` to determine the
            // version when to consider the model as saved again (e.g.
            // when undoing back to the saved state)
            this.setDirty(!!dirty);
            // Emit as event
            this._onDidResolve.fire(options?.reason ?? 3 /* TextFileResolveReason.OTHER */);
        }
        doCreateTextModel(resource, value) {
            this.trace('doCreateTextModel()');
            // Create model
            const textModel = this.createTextEditorModel(value, resource, this.preferredLanguageId);
            // Model Listeners
            this.installModelListeners(textModel);
            // Detect language from content
            this.autoDetectLanguage();
        }
        doUpdateTextModel(value) {
            this.trace('doUpdateTextModel()');
            // Update model value in a block that ignores content change events for dirty tracking
            this.ignoreDirtyOnModelContentChange = true;
            try {
                this.updateTextEditorModel(value, this.preferredLanguageId);
            }
            finally {
                this.ignoreDirtyOnModelContentChange = false;
            }
        }
        installModelListeners(model) {
            // See https://github.com/microsoft/vscode/issues/30189
            // This code has been extracted to a different method because it caused a memory leak
            // where `value` was captured in the content change listener closure scope.
            this._register(model.onDidChangeContent(e => this.onModelContentChanged(model, e.isUndoing || e.isRedoing)));
            this._register(model.onDidChangeLanguage(() => this.onMaybeShouldChangeEncoding())); // detect possible encoding change via language specific settings
            super.installModelListeners(model);
        }
        onModelContentChanged(model, isUndoingOrRedoing) {
            this.trace(`onModelContentChanged() - enter`);
            // In any case increment the version id because it tracks the textual content state of the model at all times
            this.versionId++;
            this.trace(`onModelContentChanged() - new versionId ${this.versionId}`);
            // Remember when the user changed the model through a undo/redo operation.
            // We need this information to throttle save participants to fix
            // https://github.com/microsoft/vscode/issues/102542
            if (isUndoingOrRedoing) {
                this.lastModelContentChangeFromUndoRedo = Date.now();
            }
            // We mark check for a dirty-state change upon model content change, unless:
            // - explicitly instructed to ignore it (e.g. from model.resolve())
            // - the model is readonly (in that case we never assume the change was done by the user)
            if (!this.ignoreDirtyOnModelContentChange && !this.isReadonly()) {
                // The contents changed as a matter of Undo and the version reached matches the saved one
                // In this case we clear the dirty flag and emit a SAVED event to indicate this state.
                if (model.getAlternativeVersionId() === this.bufferSavedVersionId) {
                    this.trace('onModelContentChanged() - model content changed back to last saved version');
                    // Clear flags
                    const wasDirty = this.dirty;
                    this.setDirty(false);
                    // Emit revert event if we were dirty
                    if (wasDirty) {
                        this._onDidRevert.fire();
                    }
                }
                // Otherwise the content has changed and we signal this as becoming dirty
                else {
                    this.trace('onModelContentChanged() - model content changed and marked as dirty');
                    // Mark as dirty
                    this.setDirty(true);
                }
            }
            // Emit as event
            this._onDidChangeContent.fire();
            // Detect language from content
            this.autoDetectLanguage();
        }
        async autoDetectLanguage() {
            // Wait to be ready to detect language
            await this.extensionService?.whenInstalledExtensionsRegistered();
            // Only perform language detection conditionally
            const languageId = this.getLanguageId();
            if (this.resource.scheme === this.pathService.defaultUriScheme && // make sure to not detect language for non-user visible documents
                (!languageId || languageId === modesRegistry_1.PLAINTEXT_LANGUAGE_ID) && // only run on files with plaintext language set or no language set at all
                !this.resourceHasExtension // only run if this particular file doesn't have an extension
            ) {
                return super.autoDetectLanguage();
            }
        }
        async forceResolveFromFile() {
            if (this.isDisposed()) {
                return; // return early when the model is invalid
            }
            // We go through the text file service to make
            // sure this kind of `resolve` is properly
            // running in sequence with any other running
            // `resolve` if any, including subsequent runs
            // that are triggered right after.
            await this.textFileService.files.resolve(this.resource, {
                reload: { async: false },
                forceReadFromFile: true
            });
        }
        //#endregion
        //#region Dirty
        isDirty() {
            return this.dirty;
        }
        isModified() {
            return this.isDirty();
        }
        setDirty(dirty) {
            if (!this.isResolved()) {
                return; // only resolved models can be marked dirty
            }
            // Track dirty state and version id
            const wasDirty = this.dirty;
            this.doSetDirty(dirty);
            // Emit as Event if dirty changed
            if (dirty !== wasDirty) {
                this._onDidChangeDirty.fire();
            }
        }
        doSetDirty(dirty) {
            const wasDirty = this.dirty;
            const wasInConflictMode = this.inConflictMode;
            const wasInErrorMode = this.inErrorMode;
            const oldBufferSavedVersionId = this.bufferSavedVersionId;
            if (!dirty) {
                this.dirty = false;
                this.inConflictMode = false;
                this.inErrorMode = false;
                this.updateSavedVersionId();
            }
            else {
                this.dirty = true;
            }
            // Return function to revert this call
            return () => {
                this.dirty = wasDirty;
                this.inConflictMode = wasInConflictMode;
                this.inErrorMode = wasInErrorMode;
                this.bufferSavedVersionId = oldBufferSavedVersionId;
            };
        }
        //#endregion
        //#region Save
        async save(options = Object.create(null)) {
            if (!this.isResolved()) {
                return false;
            }
            if (this.isReadonly()) {
                this.trace('save() - ignoring request for readonly resource');
                return false; // if model is readonly we do not attempt to save at all
            }
            if ((this.hasState(3 /* TextFileEditorModelState.CONFLICT */) || this.hasState(5 /* TextFileEditorModelState.ERROR */)) &&
                (options.reason === 2 /* SaveReason.AUTO */ || options.reason === 3 /* SaveReason.FOCUS_CHANGE */ || options.reason === 4 /* SaveReason.WINDOW_CHANGE */)) {
                this.trace('save() - ignoring auto save request for model that is in conflict or error');
                return false; // if model is in save conflict or error, do not save unless save reason is explicit
            }
            // Actually do save and log
            this.trace('save() - enter');
            await this.doSave(options);
            this.trace('save() - exit');
            return this.hasState(0 /* TextFileEditorModelState.SAVED */);
        }
        async doSave(options) {
            if (typeof options.reason !== 'number') {
                options.reason = 1 /* SaveReason.EXPLICIT */;
            }
            let versionId = this.versionId;
            this.trace(`doSave(${versionId}) - enter with versionId ${versionId}`);
            // Return early if saved from within save participant to break recursion
            //
            // Scenario: a save participant triggers a save() on the model
            if (this.ignoreSaveFromSaveParticipants) {
                this.trace(`doSave(${versionId}) - exit - refusing to save() recursively from save participant`);
                return;
            }
            // Lookup any running save for this versionId and return it if found
            //
            // Scenario: user invoked the save action multiple times quickly for the same contents
            //           while the save was not yet finished to disk
            //
            if (this.saveSequentializer.isRunning(versionId)) {
                this.trace(`doSave(${versionId}) - exit - found a running save for versionId ${versionId}`);
                return this.saveSequentializer.running;
            }
            // Return early if not dirty (unless forced)
            //
            // Scenario: user invoked save action even though the model is not dirty
            if (!options.force && !this.dirty) {
                this.trace(`doSave(${versionId}) - exit - because not dirty and/or versionId is different (this.isDirty: ${this.dirty}, this.versionId: ${this.versionId})`);
                return;
            }
            // Return if currently saving by storing this save request as the next save that should happen.
            // Never ever must 2 saves execute at the same time because this can lead to dirty writes and race conditions.
            //
            // Scenario A: auto save was triggered and is currently busy saving to disk. this takes long enough that another auto save
            //             kicks in.
            // Scenario B: save is very slow (e.g. network share) and the user manages to change the buffer and trigger another save
            //             while the first save has not returned yet.
            //
            if (this.saveSequentializer.isRunning()) {
                this.trace(`doSave(${versionId}) - exit - because busy saving`);
                // Indicate to the save sequentializer that we want to
                // cancel the running operation so that ours can run
                // before the running one finishes.
                // Currently this will try to cancel running save
                // participants but never a running save.
                this.saveSequentializer.cancelRunning();
                // Queue this as the upcoming save and return
                return this.saveSequentializer.queue(() => this.doSave(options));
            }
            // Push all edit operations to the undo stack so that the user has a chance to
            // Ctrl+Z back to the saved version.
            if (this.isResolved()) {
                this.textEditorModel.pushStackElement();
            }
            const saveCancellation = new cancellation_1.CancellationTokenSource();
            return this.saveSequentializer.run(versionId, (async () => {
                // A save participant can still change the model now and since we are so close to saving
                // we do not want to trigger another auto save or similar, so we block this
                // In addition we update our version right after in case it changed because of a model change
                //
                // Save participants can also be skipped through API.
                if (this.isResolved() && !options.skipSaveParticipants) {
                    try {
                        // Measure the time it took from the last undo/redo operation to this save. If this
                        // time is below `UNDO_REDO_SAVE_PARTICIPANTS_THROTTLE_THRESHOLD`, we make sure to
                        // delay the save participant for the remaining time if the reason is auto save.
                        //
                        // This fixes the following issue:
                        // - the user has configured auto save with delay of 100ms or shorter
                        // - the user has a save participant enabled that modifies the file on each save
                        // - the user types into the file and the file gets saved
                        // - the user triggers undo operation
                        // - this will undo the save participant change but trigger the save participant right after
                        // - the user has no chance to undo over the save participant
                        //
                        // Reported as: https://github.com/microsoft/vscode/issues/102542
                        if (options.reason === 2 /* SaveReason.AUTO */ && typeof this.lastModelContentChangeFromUndoRedo === 'number') {
                            const timeFromUndoRedoToSave = Date.now() - this.lastModelContentChangeFromUndoRedo;
                            if (timeFromUndoRedoToSave < TextFileEditorModel_1.UNDO_REDO_SAVE_PARTICIPANTS_AUTO_SAVE_THROTTLE_THRESHOLD) {
                                await (0, async_1.timeout)(TextFileEditorModel_1.UNDO_REDO_SAVE_PARTICIPANTS_AUTO_SAVE_THROTTLE_THRESHOLD - timeFromUndoRedoToSave);
                            }
                        }
                        // Run save participants unless save was cancelled meanwhile
                        if (!saveCancellation.token.isCancellationRequested) {
                            this.ignoreSaveFromSaveParticipants = true;
                            try {
                                await this.textFileService.files.runSaveParticipants(this, { reason: options.reason ?? 1 /* SaveReason.EXPLICIT */, savedFrom: options.from }, saveCancellation.token);
                            }
                            finally {
                                this.ignoreSaveFromSaveParticipants = false;
                            }
                        }
                    }
                    catch (error) {
                        this.logService.error(`[text file model] runSaveParticipants(${versionId}) - resulted in an error: ${error.toString()}`, this.resource.toString());
                    }
                }
                // It is possible that a subsequent save is cancelling this
                // running save. As such we return early when we detect that
                // However, we do not pass the token into the file service
                // because that is an atomic operation currently without
                // cancellation support, so we dispose the cancellation if
                // it was not cancelled yet.
                if (saveCancellation.token.isCancellationRequested) {
                    return;
                }
                else {
                    saveCancellation.dispose();
                }
                // We have to protect against being disposed at this point. It could be that the save() operation
                // was triggerd followed by a dispose() operation right after without waiting. Typically we cannot
                // be disposed if we are dirty, but if we are not dirty, save() and dispose() can still be triggered
                // one after the other without waiting for the save() to complete. If we are disposed(), we risk
                // saving contents to disk that are stale (see https://github.com/microsoft/vscode/issues/50942).
                // To fix this issue, we will not store the contents to disk when we got disposed.
                if (this.isDisposed()) {
                    return;
                }
                // We require a resolved model from this point on, since we are about to write data to disk.
                if (!this.isResolved()) {
                    return;
                }
                // update versionId with its new value (if pre-save changes happened)
                versionId = this.versionId;
                // Clear error flag since we are trying to save again
                this.inErrorMode = false;
                // Save to Disk. We mark the save operation as currently running with
                // the latest versionId because it might have changed from a save
                // participant triggering
                this.trace(`doSave(${versionId}) - before write()`);
                const lastResolvedFileStat = (0, types_1.assertIsDefined)(this.lastResolvedFileStat);
                const resolvedTextFileEditorModel = this;
                return this.saveSequentializer.run(versionId, (async () => {
                    try {
                        const stat = await this.textFileService.write(lastResolvedFileStat.resource, resolvedTextFileEditorModel.createSnapshot(), {
                            mtime: lastResolvedFileStat.mtime,
                            encoding: this.getEncoding(),
                            etag: (options.ignoreModifiedSince || !this.filesConfigurationService.preventSaveConflicts(lastResolvedFileStat.resource, resolvedTextFileEditorModel.getLanguageId())) ? files_1.ETAG_DISABLED : lastResolvedFileStat.etag,
                            unlock: options.writeUnlock,
                            writeElevated: options.writeElevated
                        });
                        this.handleSaveSuccess(stat, versionId, options);
                    }
                    catch (error) {
                        this.handleSaveError(error, versionId, options);
                    }
                })());
            })(), () => saveCancellation.cancel());
        }
        handleSaveSuccess(stat, versionId, options) {
            // Updated resolved stat with updated stat
            this.updateLastResolvedFileStat(stat);
            // Update dirty state unless model has changed meanwhile
            if (versionId === this.versionId) {
                this.trace(`handleSaveSuccess(${versionId}) - setting dirty to false because versionId did not change`);
                this.setDirty(false);
            }
            else {
                this.trace(`handleSaveSuccess(${versionId}) - not setting dirty to false because versionId did change meanwhile`);
            }
            // Update orphan state given save was successful
            this.setOrphaned(false);
            // Emit Save Event
            this._onDidSave.fire({ reason: options.reason, stat, source: options.source });
        }
        handleSaveError(error, versionId, options) {
            (options.ignoreErrorHandler ? this.logService.trace : this.logService.error).apply(this.logService, [`[text file model] handleSaveError(${versionId}) - exit - resulted in a save error: ${error.toString()}`, this.resource.toString()]);
            // Return early if the save() call was made asking to
            // handle the save error itself.
            if (options.ignoreErrorHandler) {
                throw error;
            }
            // In any case of an error, we mark the model as dirty to prevent data loss
            // It could be possible that the write corrupted the file on disk (e.g. when
            // an error happened after truncating the file) and as such we want to preserve
            // the model contents to prevent data loss.
            this.setDirty(true);
            // Flag as error state in the model
            this.inErrorMode = true;
            // Look out for a save conflict
            if (error.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                this.inConflictMode = true;
            }
            // Show to user
            this.textFileService.files.saveErrorHandler.onSaveError(error, this, options);
            // Emit as event
            this._onDidSaveError.fire();
        }
        updateSavedVersionId() {
            // we remember the models alternate version id to remember when the version
            // of the model matches with the saved version on disk. we need to keep this
            // in order to find out if the model changed back to a saved version (e.g.
            // when undoing long enough to reach to a version that is saved and then to
            // clear the dirty flag)
            if (this.isResolved()) {
                this.bufferSavedVersionId = this.textEditorModel.getAlternativeVersionId();
            }
        }
        updateLastResolvedFileStat(newFileStat) {
            const oldReadonly = this.isReadonly();
            // First resolve - just take
            if (!this.lastResolvedFileStat) {
                this.lastResolvedFileStat = newFileStat;
            }
            // Subsequent resolve - make sure that we only assign it if the mtime is equal or has advanced.
            // This prevents race conditions from resolving and saving. If a save comes in late after a revert
            // was called, the mtime could be out of sync.
            else if (this.lastResolvedFileStat.mtime <= newFileStat.mtime) {
                this.lastResolvedFileStat = newFileStat;
            }
            // Signal that the readonly state changed
            if (this.isReadonly() !== oldReadonly) {
                this._onDidChangeReadonly.fire();
            }
        }
        //#endregion
        hasState(state) {
            switch (state) {
                case 3 /* TextFileEditorModelState.CONFLICT */:
                    return this.inConflictMode;
                case 1 /* TextFileEditorModelState.DIRTY */:
                    return this.dirty;
                case 5 /* TextFileEditorModelState.ERROR */:
                    return this.inErrorMode;
                case 4 /* TextFileEditorModelState.ORPHAN */:
                    return this.inOrphanMode;
                case 2 /* TextFileEditorModelState.PENDING_SAVE */:
                    return this.saveSequentializer.isRunning();
                case 0 /* TextFileEditorModelState.SAVED */:
                    return !this.dirty;
            }
        }
        async joinState(state) {
            return this.saveSequentializer.running;
        }
        getLanguageId() {
            if (this.textEditorModel) {
                return this.textEditorModel.getLanguageId();
            }
            return this.preferredLanguageId;
        }
        //#region Encoding
        async onMaybeShouldChangeEncoding() {
            // This is a bit of a hack but there is a narrow case where
            // per-language configured encodings are not working:
            //
            // On startup we may not yet have all languages resolved so
            // we pick a wrong encoding. We never used to re-apply the
            // encoding when the language was then resolved, because that
            // is an operation that is will have to fetch the contents
            // again from disk.
            //
            // To mitigate this issue, when we detect the model language
            // changes, we see if there is a specific encoding configured
            // for the new language and apply it, only if the model is
            // not dirty and only if the encoding was not explicitly set.
            //
            // (see https://github.com/microsoft/vscode/issues/127936)
            if (this.hasEncodingSetExplicitly) {
                this.trace('onMaybeShouldChangeEncoding() - ignoring because encoding was set explicitly');
                return; // never change the user's choice of encoding
            }
            if (this.contentEncoding === encoding_1.UTF8_with_bom || this.contentEncoding === encoding_1.UTF16be || this.contentEncoding === encoding_1.UTF16le) {
                this.trace('onMaybeShouldChangeEncoding() - ignoring because content encoding has a BOM');
                return; // never change an encoding that we can detect 100% via BOMs
            }
            const { encoding } = await this.textFileService.encoding.getPreferredReadEncoding(this.resource);
            if (typeof encoding !== 'string' || !this.isNewEncoding(encoding)) {
                this.trace(`onMaybeShouldChangeEncoding() - ignoring because preferred encoding ${encoding} is not new`);
                return; // return early if encoding is invalid or did not change
            }
            if (this.isDirty()) {
                this.trace('onMaybeShouldChangeEncoding() - ignoring because model is dirty');
                return; // return early to prevent accident saves in this case
            }
            this.logService.info(`Adjusting encoding based on configured language override to '${encoding}' for ${this.resource.toString(true)}.`);
            // Re-open with new encoding
            return this.setEncodingInternal(encoding, 1 /* EncodingMode.Decode */);
        }
        setEncoding(encoding, mode) {
            // Remember that an explicit encoding was set
            this.hasEncodingSetExplicitly = true;
            return this.setEncodingInternal(encoding, mode);
        }
        async setEncodingInternal(encoding, mode) {
            // Encode: Save with encoding
            if (mode === 0 /* EncodingMode.Encode */) {
                this.updatePreferredEncoding(encoding);
                // Save
                if (!this.isDirty()) {
                    this.versionId++; // needs to increment because we change the model potentially
                    this.setDirty(true);
                }
                if (!this.inConflictMode) {
                    await this.save({ source: TextFileEditorModel_1.TEXTFILE_SAVE_ENCODING_SOURCE });
                }
            }
            // Decode: Resolve with encoding
            else {
                if (!this.isNewEncoding(encoding)) {
                    return; // return early if the encoding is already the same
                }
                if (this.isDirty() && !this.inConflictMode) {
                    await this.save();
                }
                this.updatePreferredEncoding(encoding);
                await this.forceResolveFromFile();
            }
        }
        updatePreferredEncoding(encoding) {
            if (!this.isNewEncoding(encoding)) {
                return;
            }
            this.preferredEncoding = encoding;
            // Emit
            this._onDidChangeEncoding.fire();
        }
        isNewEncoding(encoding) {
            if (this.preferredEncoding === encoding) {
                return false; // return early if the encoding is already the same
            }
            if (!this.preferredEncoding && this.contentEncoding === encoding) {
                return false; // also return if we don't have a preferred encoding but the content encoding is already the same
            }
            return true;
        }
        getEncoding() {
            return this.preferredEncoding || this.contentEncoding;
        }
        //#endregion
        trace(msg) {
            this.logService.trace(`[text file model] ${msg}`, this.resource.toString());
        }
        isResolved() {
            return !!this.textEditorModel;
        }
        isReadonly() {
            return this.filesConfigurationService.isReadonly(this.resource, this.lastResolvedFileStat);
        }
        dispose() {
            this.trace('dispose()');
            this.inConflictMode = false;
            this.inOrphanMode = false;
            this.inErrorMode = false;
            super.dispose();
        }
    };
    exports.TextFileEditorModel = TextFileEditorModel;
    exports.TextFileEditorModel = TextFileEditorModel = TextFileEditorModel_1 = __decorate([
        __param(3, language_1.ILanguageService),
        __param(4, model_1.IModelService),
        __param(5, files_1.IFileService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(8, log_1.ILogService),
        __param(9, workingCopyService_1.IWorkingCopyService),
        __param(10, filesConfigurationService_1.IFilesConfigurationService),
        __param(11, label_1.ILabelService),
        __param(12, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(13, accessibility_1.IAccessibilityService),
        __param(14, pathService_1.IPathService),
        __param(15, extensions_1.IExtensionService)
    ], TextFileEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVFZGl0b3JNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0ZmlsZS9jb21tb24vdGV4dEZpbGVFZGl0b3JNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeUNoRzs7T0FFRztJQUNJLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEscUNBQW1COztpQkFFbkMsa0NBQTZCLEdBQUcsMkJBQWtCLENBQUMsY0FBYyxDQUFDLHlCQUF5QixFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLHVCQUF1QixDQUFDLENBQUMsQUFBM0gsQ0FBNEg7aUJBZ0R6Siw2REFBd0QsR0FBRyxHQUFHLEFBQU4sQ0FBTztRQVl2RixZQUNVLFFBQWEsRUFDZCxpQkFBcUMsRUFBRyxpQ0FBaUM7UUFDekUsbUJBQXVDLEVBQzdCLGVBQWlDLEVBQ3BDLFlBQTJCLEVBQzVCLFdBQTBDLEVBQ3RDLGVBQWtELEVBQ3pDLHdCQUFvRSxFQUNsRixVQUF3QyxFQUNoQyxrQkFBd0QsRUFDakQseUJBQXNFLEVBQ25GLFlBQTRDLEVBQ2hDLHdCQUFtRCxFQUN2RCxvQkFBMkMsRUFDcEQsV0FBMEMsRUFDckMsZ0JBQW9EO1lBRXZFLEtBQUssQ0FBQyxZQUFZLEVBQUUsZUFBZSxFQUFFLHdCQUF3QixFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFqQjVFLGFBQVEsR0FBUixRQUFRLENBQUs7WUFDZCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3JDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBb0I7WUFHaEIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDckIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3hCLDZCQUF3QixHQUF4Qix3QkFB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