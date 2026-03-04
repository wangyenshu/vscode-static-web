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
define(["require", "exports", "vs/nls", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/common/editor", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/base/common/path", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/workbench/services/untitled/common/untitledTextEditorModel", "vs/workbench/services/textfile/common/textFileEditorModelManager", "vs/platform/instantiation/common/instantiation", "vs/base/common/network", "vs/editor/common/model/textModel", "vs/editor/common/services/model", "vs/base/common/resources", "vs/platform/dialogs/common/dialogs", "vs/base/common/buffer", "vs/editor/common/services/textResourceConfiguration", "vs/editor/common/languages/modesRegistry", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/common/editor/textEditorModel", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/services/textfile/common/encoding", "vs/base/common/stream", "vs/editor/common/languages/language", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/decorations/common/decorations", "vs/base/common/event", "vs/base/common/codicons", "vs/platform/theme/common/colorRegistry", "vs/base/common/arrays"], function (require, exports, nls_1, textfiles_1, editor_1, lifecycle_1, files_1, lifecycle_2, path_1, environmentService_1, untitledTextEditorService_1, untitledTextEditorModel_1, textFileEditorModelManager_1, instantiation_1, network_1, textModel_1, model_1, resources_1, dialogs_1, buffer_1, textResourceConfiguration_1, modesRegistry_1, filesConfigurationService_1, textEditorModel_1, codeEditorService_1, pathService_1, workingCopyFileService_1, uriIdentity_1, workspace_1, encoding_1, stream_1, language_1, log_1, cancellation_1, elevatedFileService_1, decorations_1, event_1, codicons_1, colorRegistry_1, arrays_1) {
    "use strict";
    var AbstractTextFileService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncodingOracle = exports.AbstractTextFileService = void 0;
    let AbstractTextFileService = class AbstractTextFileService extends lifecycle_2.Disposable {
        static { AbstractTextFileService_1 = this; }
        static { this.TEXTFILE_SAVE_CREATE_SOURCE = editor_1.SaveSourceRegistry.registerSource('textFileCreate.source', (0, nls_1.localize)('textFileCreate.source', "File Created")); }
        static { this.TEXTFILE_SAVE_REPLACE_SOURCE = editor_1.SaveSourceRegistry.registerSource('textFileOverwrite.source', (0, nls_1.localize)('textFileOverwrite.source', "File Replaced")); }
        constructor(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, logService, elevatedFileService, decorationsService) {
            super();
            this.fileService = fileService;
            this.untitledTextEditorService = untitledTextEditorService;
            this.lifecycleService = lifecycleService;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.environmentService = environmentService;
            this.dialogService = dialogService;
            this.fileDialogService = fileDialogService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.filesConfigurationService = filesConfigurationService;
            this.codeEditorService = codeEditorService;
            this.pathService = pathService;
            this.workingCopyFileService = workingCopyFileService;
            this.uriIdentityService = uriIdentityService;
            this.languageService = languageService;
            this.logService = logService;
            this.elevatedFileService = elevatedFileService;
            this.decorationsService = decorationsService;
            this.files = this._register(this.instantiationService.createInstance(textFileEditorModelManager_1.TextFileEditorModelManager));
            this.untitled = this.untitledTextEditorService;
            this.provideDecorations();
        }
        //#region decorations
        provideDecorations() {
            // Text file model decorations
            const provider = this._register(new class extends lifecycle_2.Disposable {
                constructor(files) {
                    super();
                    this.files = files;
                    this.label = (0, nls_1.localize)('textFileModelDecorations', "Text File Model Decorations");
                    this._onDidChange = this._register(new event_1.Emitter());
                    this.onDidChange = this._onDidChange.event;
                    this.registerListeners();
                }
                registerListeners() {
                    // Creates
                    this._register(this.files.onDidResolve(({ model }) => {
                        if (model.isReadonly() || model.hasState(4 /* TextFileEditorModelState.ORPHAN */)) {
                            this._onDidChange.fire([model.resource]);
                        }
                    }));
                    // Removals: once a text file model is no longer
                    // under our control, make sure to signal this as
                    // decoration change because from this point on we
                    // have no way of updating the decoration anymore.
                    this._register(this.files.onDidRemove(modelUri => this._onDidChange.fire([modelUri])));
                    // Changes
                    this._register(this.files.onDidChangeReadonly(model => this._onDidChange.fire([model.resource])));
                    this._register(this.files.onDidChangeOrphaned(model => this._onDidChange.fire([model.resource])));
                }
                provideDecorations(uri) {
                    const model = this.files.get(uri);
                    if (!model || model.isDisposed()) {
                        return undefined;
                    }
                    const isReadonly = model.isReadonly();
                    const isOrphaned = model.hasState(4 /* TextFileEditorModelState.ORPHAN */);
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
            }(this.files));
            this._register(this.decorationsService.registerDecorationsProvider(provider));
        }
        get encoding() {
            if (!this._encoding) {
                this._encoding = this._register(this.instantiationService.createInstance(EncodingOracle));
            }
            return this._encoding;
        }
        async read(resource, options) {
            const [bufferStream, decoder] = await this.doRead(resource, {
                ...options,
                // optimization: since we know that the caller does not
                // care about buffering, we indicate this to the reader.
                // this reduces all the overhead the buffered reading
                // has (open, read, close) if the provider supports
                // unbuffered reading.
                preferUnbuffered: true
            });
            return {
                ...bufferStream,
                encoding: decoder.detected.encoding || encoding_1.UTF8,
                value: await (0, stream_1.consumeStream)(decoder.stream, strings => strings.join(''))
            };
        }
        async readStream(resource, options) {
            const [bufferStream, decoder] = await this.doRead(resource, options);
            return {
                ...bufferStream,
                encoding: decoder.detected.encoding || encoding_1.UTF8,
                value: await (0, textModel_1.createTextBufferFactoryFromStream)(decoder.stream)
            };
        }
        async doRead(resource, options) {
            const cts = new cancellation_1.CancellationTokenSource();
            // read stream raw (either buffered or unbuffered)
            let bufferStream;
            if (options?.preferUnbuffered) {
                const content = await this.fileService.readFile(resource, options, cts.token);
                bufferStream = {
                    ...content,
                    value: (0, buffer_1.bufferToStream)(content.value)
                };
            }
            else {
                bufferStream = await this.fileService.readFileStream(resource, options, cts.token);
            }
            // read through encoding library
            try {
                const decoder = await this.doGetDecodedStream(resource, bufferStream.value, options);
                return [bufferStream, decoder];
            }
            catch (error) {
                // Make sure to cancel reading on error to
                // stop file service activity as soon as
                // possible. When for example a large binary
                // file is read we want to cancel the read
                // instantly.
                // Refs:
                // - https://github.com/microsoft/vscode/issues/138805
                // - https://github.com/microsoft/vscode/issues/132771
                cts.dispose(true);
                // special treatment for streams that are binary
                if (error.decodeStreamErrorKind === 1 /* DecodeStreamErrorKind.STREAM_IS_BINARY */) {
                    throw new textfiles_1.TextFileOperationError((0, nls_1.localize)('fileBinaryError', "File seems to be binary and cannot be opened as text"), 0 /* TextFileOperationResult.FILE_IS_BINARY */, options);
                }
                // re-throw any other error as it is
                else {
                    throw error;
                }
            }
        }
        async create(operations, undoInfo) {
            const operationsWithContents = await Promise.all(operations.map(async (operation) => {
                const contents = await this.getEncodedReadable(operation.resource, operation.value);
                return {
                    resource: operation.resource,
                    contents,
                    overwrite: operation.options?.overwrite
                };
            }));
            return this.workingCopyFileService.create(operationsWithContents, cancellation_1.CancellationToken.None, undoInfo);
        }
        async write(resource, value, options) {
            const readable = await this.getEncodedReadable(resource, value, options);
            if (options?.writeElevated && this.elevatedFileService.isSupported(resource)) {
                return this.elevatedFileService.writeFileElevated(resource, readable, options);
            }
            return this.fileService.writeFile(resource, readable, options);
        }
        async getEncodedReadable(resource, value, options) {
            // check for encoding
            const { encoding, addBOM } = await this.encoding.getWriteEncoding(resource, options);
            // when encoding is standard skip encoding step
            if (encoding === encoding_1.UTF8 && !addBOM) {
                return typeof value === 'undefined'
                    ? undefined
                    : (0, textfiles_1.toBufferOrReadable)(value);
            }
            // otherwise create encoded readable
            value = value || '';
            const snapshot = typeof value === 'string' ? (0, textfiles_1.stringToSnapshot)(value) : value;
            return (0, encoding_1.toEncodeReadable)(snapshot, encoding, { addBOM });
        }
        async getDecodedStream(resource, value, options) {
            return (await this.doGetDecodedStream(resource, value, options)).stream;
        }
        doGetDecodedStream(resource, stream, options) {
            // read through encoding library
            return (0, encoding_1.toDecodeStream)(stream, {
                acceptTextOnly: options?.acceptTextOnly ?? false,
                guessEncoding: options?.autoGuessEncoding || this.textResourceConfigurationService.getValue(resource, 'files.autoGuessEncoding'),
                overwriteEncoding: async (detectedEncoding) => {
                    const { encoding } = await this.encoding.getPreferredReadEncoding(resource, options, detectedEncoding ?? undefined);
                    return encoding;
                }
            });
        }
        //#endregion
        //#region save
        async save(resource, options) {
            // Untitled
            if (resource.scheme === network_1.Schemas.untitled) {
                const model = this.untitled.get(resource);
                if (model) {
                    let targetUri;
                    // Untitled with associated file path don't need to prompt
                    if (model.hasAssociatedFilePath) {
                        targetUri = await this.suggestSavePath(resource);
                    }
                    // Otherwise ask user
                    else {
                        targetUri = await this.fileDialogService.pickFileToSave(await this.suggestSavePath(resource), options?.availableFileSystems);
                    }
                    // Save as if target provided
                    if (targetUri) {
                        return this.saveAs(resource, targetUri, options);
                    }
                }
            }
            // File
            else {
                const model = this.files.get(resource);
                if (model) {
                    return await model.save(options) ? resource : undefined;
                }
            }
            return undefined;
        }
        async saveAs(source, target, options) {
            // Get to target resource
            if (!target) {
                target = await this.fileDialogService.pickFileToSave(await this.suggestSavePath(options?.suggestedTarget ?? source), options?.availableFileSystems);
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
            // Just save if target is same as models own resource
            if ((0, resources_1.isEqual)(source, target)) {
                return this.save(source, { ...options, force: true /* force to save, even if not dirty (https://github.com/microsoft/vscode/issues/99619) */ });
            }
            // If the target is different but of same identity, we
            // move the source to the target, knowing that the
            // underlying file system cannot have both and then save.
            // However, this will only work if the source exists
            // and is not orphaned, so we need to check that too.
            if (this.fileService.hasProvider(source) && this.uriIdentityService.extUri.isEqual(source, target) && (await this.fileService.exists(source))) {
                await this.workingCopyFileService.move([{ file: { source, target } }], cancellation_1.CancellationToken.None);
                // At this point we don't know whether we have a
                // model for the source or the target URI so we
                // simply try to save with both resources.
                const success = await this.save(source, options);
                if (!success) {
                    await this.save(target, options);
                }
                return target;
            }
            // Do it
            return this.doSaveAs(source, target, options);
        }
        async doSaveAs(source, target, options) {
            let success = false;
            // If the source is an existing text file model, we can directly
            // use that model to copy the contents to the target destination
            const textFileModel = this.files.get(source);
            if (textFileModel?.isResolved()) {
                success = await this.doSaveAsTextFile(textFileModel, source, target, options);
            }
            // Otherwise if the source can be handled by the file service
            // we can simply invoke the copy() function to save as
            else if (this.fileService.hasProvider(source)) {
                await this.fileService.copy(source, target, true);
                success = true;
            }
            // Finally we simply check if we can find a editor model that
            // would give us access to the contents.
            else {
                const textModel = this.modelService.getModel(source);
                if (textModel) {
                    success = await this.doSaveAsTextFile(textModel, source, target, options);
                }
            }
            if (!success) {
                return undefined;
            }
            // Revert the source
            try {
                await this.revert(source);
            }
            catch (error) {
                // It is possible that reverting the source fails, for example
                // when a remote is disconnected and we cannot read it anymore.
                // However, this should not interrupt the "Save As" flow, so
                // we gracefully catch the error and just log it.
                this.logService.error(error);
            }
            return target;
        }
        async doSaveAsTextFile(sourceModel, source, target, options) {
            // Find source encoding if any
            let sourceModelEncoding = undefined;
            const sourceModelWithEncodingSupport = sourceModel;
            if (typeof sourceModelWithEncodingSupport.getEncoding === 'function') {
                sourceModelEncoding = sourceModelWithEncodingSupport.getEncoding();
            }
            // Prefer an existing model if it is already resolved for the given target resource
            let targetExists = false;
            let targetModel = this.files.get(target);
            if (targetModel?.isResolved()) {
                targetExists = true;
            }
            // Otherwise create the target file empty if it does not exist already and resolve it from there
            else {
                targetExists = await this.fileService.exists(target);
                // create target file adhoc if it does not exist yet
                if (!targetExists) {
                    await this.create([{ resource: target, value: '' }]);
                }
                try {
                    targetModel = await this.files.resolve(target, { encoding: sourceModelEncoding });
                }
                catch (error) {
                    // if the target already exists and was not created by us, it is possible
                    // that we cannot resolve the target as text model if it is binary or too
                    // large. in that case we have to delete the target file first and then
                    // re-run the operation.
                    if (targetExists) {
                        if (error.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */ ||
                            error.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                            await this.fileService.del(target);
                            return this.doSaveAsTextFile(sourceModel, source, target, options);
                        }
                    }
                    throw error;
                }
            }
            // Confirm to overwrite if we have an untitled file with associated file where
            // the file actually exists on disk and we are instructed to save to that file
            // path. This can happen if the file was created after the untitled file was opened.
            // See https://github.com/microsoft/vscode/issues/67946
            let write;
            if (sourceModel instanceof untitledTextEditorModel_1.UntitledTextEditorModel && sourceModel.hasAssociatedFilePath && targetExists && this.uriIdentityService.extUri.isEqual(target, (0, resources_1.toLocalResource)(sourceModel.resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme))) {
                write = await this.confirmOverwrite(target);
            }
            else {
                write = true;
            }
            if (!write) {
                return false;
            }
            let sourceTextModel = undefined;
            if (sourceModel instanceof textEditorModel_1.BaseTextEditorModel) {
                if (sourceModel.isResolved()) {
                    sourceTextModel = sourceModel.textEditorModel ?? undefined;
                }
            }
            else {
                sourceTextModel = sourceModel;
            }
            let targetTextModel = undefined;
            if (targetModel.isResolved()) {
                targetTextModel = targetModel.textEditorModel;
            }
            // take over model value, encoding and language (only if more specific) from source model
            if (sourceTextModel && targetTextModel) {
                // encoding
                targetModel.updatePreferredEncoding(sourceModelEncoding);
                // content
                this.modelService.updateModel(targetTextModel, (0, textModel_1.createTextBufferFactoryFromSnapshot)(sourceTextModel.createSnapshot()));
                // language
                const sourceLanguageId = sourceTextModel.getLanguageId();
                const targetLanguageId = targetTextModel.getLanguageId();
                if (sourceLanguageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID && targetLanguageId === modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                    targetTextModel.setLanguage(sourceLanguageId); // only use if more specific than plain/text
                }
                // transient properties
                const sourceTransientProperties = this.codeEditorService.getTransientModelProperties(sourceTextModel);
                if (sourceTransientProperties) {
                    for (const [key, value] of sourceTransientProperties) {
                        this.codeEditorService.setTransientModelProperty(targetTextModel, key, value);
                    }
                }
            }
            // set source options depending on target exists or not
            if (!options?.source) {
                options = {
                    ...options,
                    source: targetExists ? AbstractTextFileService_1.TEXTFILE_SAVE_REPLACE_SOURCE : AbstractTextFileService_1.TEXTFILE_SAVE_CREATE_SOURCE
                };
            }
            // save model
            return targetModel.save({
                ...options,
                from: source
            });
        }
        async confirmOverwrite(resource) {
            const { confirmed } = await this.dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmOverwrite', "'{0}' already exists. Do you want to replace it?", (0, resources_1.basename)(resource)),
                detail: (0, nls_1.localize)('overwriteIrreversible', "A file or folder with the name '{0}' already exists in the folder '{1}'. Replacing it will overwrite its current contents.", (0, resources_1.basename)(resource), (0, resources_1.basename)((0, resources_1.dirname)(resource))),
                primaryButton: (0, nls_1.localize)({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
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
            // Just take the resource as is if the file service can handle it
            if (this.fileService.hasProvider(resource)) {
                return resource;
            }
            const remoteAuthority = this.environmentService.remoteAuthority;
            const defaultFilePath = await this.fileDialogService.defaultFilePath();
            // Otherwise try to suggest a path that can be saved
            let suggestedFilename = undefined;
            if (resource.scheme === network_1.Schemas.untitled) {
                const model = this.untitled.get(resource);
                if (model) {
                    // Untitled with associated file path
                    if (model.hasAssociatedFilePath) {
                        return (0, resources_1.toLocalResource)(resource, remoteAuthority, this.pathService.defaultUriScheme);
                    }
                    // Untitled without associated file path: use name
                    // of untitled model if it is a valid path name and
                    // figure out the file extension from the mode if any.
                    let nameCandidate;
                    if (await this.pathService.hasValidBasename((0, resources_1.joinPath)(defaultFilePath, model.name), model.name)) {
                        nameCandidate = model.name;
                    }
                    else {
                        nameCandidate = (0, resources_1.basename)(resource);
                    }
                    const languageId = model.getLanguageId();
                    if (languageId && languageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                        suggestedFilename = this.suggestFilename(languageId, nameCandidate);
                    }
                    else {
                        suggestedFilename = nameCandidate;
                    }
                }
            }
            // Fallback to basename of resource
            if (!suggestedFilename) {
                suggestedFilename = (0, resources_1.basename)(resource);
            }
            // Try to place where last active file was if any
            // Otherwise fallback to user home
            return (0, resources_1.joinPath)(defaultFilePath, suggestedFilename);
        }
        suggestFilename(languageId, untitledName) {
            const languageName = this.languageService.getLanguageName(languageId);
            if (!languageName) {
                return untitledName; // unknown language, so we cannot suggest a better name
            }
            const untitledExtension = (0, path_1.extname)(untitledName);
            const extensions = this.languageService.getExtensions(languageId);
            if (extensions.includes(untitledExtension)) {
                return untitledName; // preserve extension if it is compatible with the mode
            }
            const primaryExtension = (0, arrays_1.firstOrDefault)(extensions);
            if (primaryExtension) {
                if (untitledExtension) {
                    return `${untitledName.substring(0, untitledName.indexOf(untitledExtension))}${primaryExtension}`;
                }
                return `${untitledName}${primaryExtension}`;
            }
            const filenames = this.languageService.getFilenames(languageId);
            if (filenames.includes(untitledName)) {
                return untitledName; // preserve name if it is compatible with the mode
            }
            return (0, arrays_1.firstOrDefault)(filenames) ?? untitledName;
        }
        //#endregion
        //#region revert
        async revert(resource, options) {
            // Untitled
            if (resource.scheme === network_1.Schemas.untitled) {
                const model = this.untitled.get(resource);
                if (model) {
                    return model.revert(options);
                }
            }
            // File
            else {
                const model = this.files.get(resource);
                if (model && (model.isDirty() || options?.force)) {
                    return model.revert(options);
                }
            }
        }
        //#endregion
        //#region dirty
        isDirty(resource) {
            const model = resource.scheme === network_1.Schemas.untitled ? this.untitled.get(resource) : this.files.get(resource);
            if (model) {
                return model.isDirty();
            }
            return false;
        }
    };
    exports.AbstractTextFileService = AbstractTextFileService;
    exports.AbstractTextFileService = AbstractTextFileService = AbstractTextFileService_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, model_1.IModelService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, dialogs_1.IDialogService),
        __param(7, dialogs_1.IFileDialogService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, filesConfigurationService_1.IFilesConfigurationService),
        __param(10, codeEditorService_1.ICodeEditorService),
        __param(11, pathService_1.IPathService),
        __param(12, workingCopyFileService_1.IWorkingCopyFileService),
        __param(13, uriIdentity_1.IUriIdentityService),
        __param(14, language_1.ILanguageService),
        __param(15, log_1.ILogService),
        __param(16, elevatedFileService_1.IElevatedFileService),
        __param(17, decorations_1.IDecorationsService)
    ], AbstractTextFileService);
    let EncodingOracle = class EncodingOracle extends lifecycle_2.Disposable {
        get encodingOverrides() { return this._encodingOverrides; }
        set encodingOverrides(value) { this._encodingOverrides = value; }
        constructor(textResourceConfigurationService, environmentService, contextService, uriIdentityService) {
            super();
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.uriIdentityService = uriIdentityService;
            this._encodingOverrides = this.getDefaultEncodingOverrides();
            this.registerListeners();
        }
        registerListeners() {
            // Workspace Folder Change
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.encodingOverrides = this.getDefaultEncodingOverrides()));
        }
        getDefaultEncodingOverrides() {
            const defaultEncodingOverrides = [];
            // Global settings
            defaultEncodingOverrides.push({ parent: this.environmentService.userRoamingDataHome, encoding: encoding_1.UTF8 });
            // Workspace files (via extension and via untitled workspaces location)
            defaultEncodingOverrides.push({ extension: workspace_1.WORKSPACE_EXTENSION, encoding: encoding_1.UTF8 });
            defaultEncodingOverrides.push({ parent: this.environmentService.untitledWorkspacesHome, encoding: encoding_1.UTF8 });
            // Folder Settings
            this.contextService.getWorkspace().folders.forEach(folder => {
                defaultEncodingOverrides.push({ parent: (0, resources_1.joinPath)(folder.uri, '.vscode'), encoding: encoding_1.UTF8 });
            });
            return defaultEncodingOverrides;
        }
        async getWriteEncoding(resource, options) {
            const { encoding, hasBOM } = await this.getPreferredWriteEncoding(resource, options ? options.encoding : undefined);
            return { encoding, addBOM: hasBOM };
        }
        async getPreferredWriteEncoding(resource, preferredEncoding) {
            const resourceEncoding = await this.getEncodingForResource(resource, preferredEncoding);
            return {
                encoding: resourceEncoding,
                hasBOM: resourceEncoding === encoding_1.UTF16be || resourceEncoding === encoding_1.UTF16le || resourceEncoding === encoding_1.UTF8_with_bom // enforce BOM for certain encodings
            };
        }
        async getPreferredReadEncoding(resource, options, detectedEncoding) {
            let preferredEncoding;
            // Encoding passed in as option
            if (options?.encoding) {
                if (detectedEncoding === encoding_1.UTF8_with_bom && options.encoding === encoding_1.UTF8) {
                    preferredEncoding = encoding_1.UTF8_with_bom; // indicate the file has BOM if we are to resolve with UTF 8
                }
                else {
                    preferredEncoding = options.encoding; // give passed in encoding highest priority
                }
            }
            // Encoding detected
            else if (typeof detectedEncoding === 'string') {
                preferredEncoding = detectedEncoding;
            }
            // Encoding configured
            else if (this.textResourceConfigurationService.getValue(resource, 'files.encoding') === encoding_1.UTF8_with_bom) {
                preferredEncoding = encoding_1.UTF8; // if we did not detect UTF 8 BOM before, this can only be UTF 8 then
            }
            const encoding = await this.getEncodingForResource(resource, preferredEncoding);
            return {
                encoding,
                hasBOM: encoding === encoding_1.UTF16be || encoding === encoding_1.UTF16le || encoding === encoding_1.UTF8_with_bom // enforce BOM for certain encodings
            };
        }
        async getEncodingForResource(resource, preferredEncoding) {
            let fileEncoding;
            const override = this.getEncodingOverride(resource);
            if (override) {
                fileEncoding = override; // encoding override always wins
            }
            else if (preferredEncoding) {
                fileEncoding = preferredEncoding; // preferred encoding comes second
            }
            else {
                fileEncoding = this.textResourceConfigurationService.getValue(resource, 'files.encoding'); // and last we check for settings
            }
            if (fileEncoding !== encoding_1.UTF8) {
                if (!fileEncoding || !(await (0, encoding_1.encodingExists)(fileEncoding))) {
                    fileEncoding = encoding_1.UTF8; // the default is UTF-8
                }
            }
            return fileEncoding;
        }
        getEncodingOverride(resource) {
            if (this.encodingOverrides?.length) {
                for (const override of this.encodingOverrides) {
                    // check if the resource is child of encoding override path
                    if (override.parent && this.uriIdentityService.extUri.isEqualOrParent(resource, override.parent)) {
                        return override.encoding;
                    }
                    // check if the resource extension is equal to encoding override
                    if (override.extension && (0, resources_1.extname)(resource) === `.${override.extension}`) {
                        return override.encoding;
                    }
                }
            }
            return undefined;
        }
    };
    exports.EncodingOracle = EncodingOracle;
    exports.EncodingOracle = EncodingOracle = __decorate([
        __param(0, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], EncodingOracle);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRmaWxlL2Jyb3dzZXIvdGV4dEZpbGVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE0Q3pGLElBQWUsdUJBQXVCLEdBQXRDLE1BQWUsdUJBQXdCLFNBQVEsc0JBQVU7O2lCQUl2QyxnQ0FBMkIsR0FBRywyQkFBa0IsQ0FBQyxjQUFjLENBQUMsdUJBQXVCLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsY0FBYyxDQUFDLENBQUMsQUFBaEgsQ0FBaUg7aUJBQzVJLGlDQUE0QixHQUFHLDJCQUFrQixDQUFDLGNBQWMsQ0FBQywwQkFBMEIsRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSxlQUFlLENBQUMsQ0FBQyxBQUF2SCxDQUF3SDtRQU01SyxZQUNlLFdBQTRDLEVBQzlCLHlCQUE2RCxFQUN0RSxnQkFBc0QsRUFDbEQsb0JBQThELEVBQ3RFLFlBQTRDLEVBQzdCLGtCQUFtRSxFQUNqRixhQUE4QyxFQUMxQyxpQkFBc0QsRUFDdkMsZ0NBQXNGLEVBQzdGLHlCQUF3RSxFQUNoRixpQkFBc0QsRUFDNUQsV0FBMEMsRUFDL0Isc0JBQWdFLEVBQ3BFLGtCQUF3RCxFQUMzRCxlQUFrRCxFQUN2RCxVQUEwQyxFQUNqQyxtQkFBMEQsRUFDM0Qsa0JBQXdEO1lBRTdFLEtBQUssRUFBRSxDQUFDO1lBbkJ5QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN0Qiw4QkFBeUIsR0FBekIseUJBQXlCLENBQTRCO1lBQ25ELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDL0IseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyRCxpQkFBWSxHQUFaLFlB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