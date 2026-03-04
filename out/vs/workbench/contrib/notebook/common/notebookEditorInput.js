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
define(["require", "exports", "vs/base/common/glob", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/common/resources", "vs/platform/dialogs/common/dialogs", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/platform/label/common/label", "vs/base/common/network", "vs/platform/files/common/files", "vs/workbench/common/editor/resourceEditorInput", "vs/base/common/errors", "vs/base/common/buffer", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/extensions/common/extensions", "vs/nls", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/customEditorLabelService"], function (require, exports, glob, notebookService_1, resources_1, dialogs_1, notebookEditorModelResolverService_1, label_1, network_1, files_1, resourceEditorInput_1, errors_1, buffer_1, filesConfigurationService_1, extensions_1, nls_1, editorService_1, textResourceConfiguration_1, customEditorLabelService_1) {
    "use strict";
    var NotebookEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorInput = void 0;
    exports.isCompositeNotebookEditorInput = isCompositeNotebookEditorInput;
    exports.isNotebookEditorInput = isNotebookEditorInput;
    let NotebookEditorInput = class NotebookEditorInput extends resourceEditorInput_1.AbstractResourceEditorInput {
        static { NotebookEditorInput_1 = this; }
        static getOrCreate(instantiationService, resource, preferredResource, viewType, options = {}) {
            const editor = instantiationService.createInstance(NotebookEditorInput_1, resource, preferredResource, viewType, options);
            if (preferredResource) {
                editor.setPreferredResource(preferredResource);
            }
            return editor;
        }
        static { this.ID = 'workbench.input.notebook'; }
        constructor(resource, preferredResource, viewType, options, _notebookService, _notebookModelResolverService, _fileDialogService, labelService, fileService, filesConfigurationService, extensionService, editorService, textResourceConfigurationService, customEditorLabelService) {
            super(resource, preferredResource, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService);
            this.viewType = viewType;
            this.options = options;
            this._notebookService = _notebookService;
            this._notebookModelResolverService = _notebookModelResolverService;
            this._fileDialogService = _fileDialogService;
            this._editorModelReference = null;
            this._defaultDirtyState = false;
            this._defaultDirtyState = !!options.startDirty;
            // Automatically resolve this input when the "wanted" model comes to life via
            // some other way. This happens only once per input and resolve disposes
            // this listener
            this._sideLoadedListener = _notebookService.onDidAddNotebookDocument(e => {
                if (e.viewType === this.viewType && e.uri.toString() === this.resource.toString()) {
                    this.resolve().catch(errors_1.onUnexpectedError);
                }
            });
            this._register(extensionService.onWillStop(e => {
                if (!this.isDirty()) {
                    return;
                }
                e.veto((async () => {
                    const editors = editorService.findEditors(this);
                    if (editors.length > 0) {
                        const result = await editorService.save(editors[0]);
                        if (result.success) {
                            return false; // Don't Veto
                        }
                    }
                    return true; // Veto
                })(), (0, nls_1.localize)('vetoExtHostRestart', "Notebook '{0}' could not be saved.", this.resource.path));
            }));
        }
        dispose() {
            this._sideLoadedListener.dispose();
            this._editorModelReference?.dispose();
            this._editorModelReference = null;
            super.dispose();
        }
        get typeId() {
            return NotebookEditorInput_1.ID;
        }
        get editorId() {
            return this.viewType;
        }
        get capabilities() {
            let capabilities = 0 /* EditorInputCapabilities.None */;
            if (this.resource.scheme === network_1.Schemas.untitled) {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            if (this._editorModelReference) {
                if (this._editorModelReference.object.isReadonly()) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            else {
                if (this.filesConfigurationService.isReadonly(this.resource)) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            if (!(capabilities & 2 /* EditorInputCapabilities.Readonly */)) {
                capabilities |= 128 /* EditorInputCapabilities.CanDropIntoEditor */;
            }
            return capabilities;
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            if (!this.hasCapability(4 /* EditorInputCapabilities.Untitled */) || this._editorModelReference?.object.hasAssociatedFilePath()) {
                return super.getDescription(verbosity);
            }
            return undefined; // no description for untitled notebooks without associated file path
        }
        isReadonly() {
            if (!this._editorModelReference) {
                return this.filesConfigurationService.isReadonly(this.resource);
            }
            return this._editorModelReference.object.isReadonly();
        }
        isDirty() {
            if (!this._editorModelReference) {
                return this._defaultDirtyState;
            }
            return this._editorModelReference.object.isDirty();
        }
        isSaving() {
            const model = this._editorModelReference?.object;
            if (!model || !model.isDirty() || model.hasErrorState || this.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                return false; // require the model to be dirty, file-backed and not in an error state
            }
            // if a short auto save is configured, treat this as being saved
            return this.filesConfigurationService.hasShortAutoSaveDelay(this);
        }
        async save(group, options) {
            if (this._editorModelReference) {
                if (this.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                    return this.saveAs(group, options);
                }
                else {
                    await this._editorModelReference.object.save(options);
                }
                return this;
            }
            return undefined;
        }
        async saveAs(group, options) {
            if (!this._editorModelReference) {
                return undefined;
            }
            const provider = this._notebookService.getContributedNotebookType(this.viewType);
            if (!provider) {
                return undefined;
            }
            const pathCandidate = this.hasCapability(4 /* EditorInputCapabilities.Untitled */) ? await this._suggestName(provider, this.labelService.getUriBasenameLabel(this.resource)) : this._editorModelReference.object.resource;
            let target;
            if (this._editorModelReference.object.hasAssociatedFilePath()) {
                target = pathCandidate;
            }
            else {
                target = await this._fileDialogService.pickFileToSave(pathCandidate, options?.availableFileSystems);
                if (!target) {
                    return undefined; // save cancelled
                }
            }
            if (!provider.matches(target)) {
                const patterns = provider.selectors.map(pattern => {
                    if (typeof pattern === 'string') {
                        return pattern;
                    }
                    if (glob.isRelativePattern(pattern)) {
                        return `${pattern} (base ${pattern.base})`;
                    }
                    if (pattern.exclude) {
                        return `${pattern.include} (exclude: ${pattern.exclude})`;
                    }
                    else {
                        return `${pattern.include}`;
                    }
                }).join(', ');
                throw new Error(`File name ${target} is not supported by ${provider.providerDisplayName}.\n\nPlease make sure the file name matches following patterns:\n${patterns}`);
            }
            return await this._editorModelReference.object.saveAs(target);
        }
        async _suggestName(provider, suggestedFilename) {
            // guess file extensions
            const firstSelector = provider.selectors[0];
            let selectorStr = firstSelector && typeof firstSelector === 'string' ? firstSelector : undefined;
            if (!selectorStr && firstSelector) {
                const include = firstSelector.include;
                if (typeof include === 'string') {
                    selectorStr = include;
                }
            }
            if (selectorStr) {
                const matches = /^\*\.([A-Za-z_-]*)$/.exec(selectorStr);
                if (matches && matches.length > 1) {
                    const fileExt = matches[1];
                    if (!suggestedFilename.endsWith(fileExt)) {
                        return (0, resources_1.joinPath)(await this._fileDialogService.defaultFilePath(), suggestedFilename + '.' + fileExt);
                    }
                }
            }
            return (0, resources_1.joinPath)(await this._fileDialogService.defaultFilePath(), suggestedFilename);
        }
        // called when users rename a notebook document
        async rename(group, target) {
            if (this._editorModelReference) {
                return { editor: { resource: target }, options: { override: this.viewType } };
            }
            return undefined;
        }
        async revert(_group, options) {
            if (this._editorModelReference && this._editorModelReference.object.isDirty()) {
                await this._editorModelReference.object.revert(options);
            }
        }
        async resolve(_options, perf) {
            if (!await this._notebookService.canResolve(this.viewType)) {
                return null;
            }
            perf?.mark('extensionActivated');
            // we are now loading the notebook and don't need to listen to
            // "other" loading anymore
            this._sideLoadedListener.dispose();
            if (!this._editorModelReference) {
                const ref = await this._notebookModelResolverService.resolve(this.resource, this.viewType, this.ensureLimits(_options));
                if (this._editorModelReference) {
                    // Re-entrant, double resolve happened. Dispose the addition references and proceed
                    // with the truth.
                    ref.dispose();
                    return this._editorModelReference.object;
                }
                this._editorModelReference = ref;
                if (this.isDisposed()) {
                    this._editorModelReference.dispose();
                    this._editorModelReference = null;
                    return null;
                }
                this._register(this._editorModelReference.object.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
                this._register(this._editorModelReference.object.onDidChangeReadonly(() => this._onDidChangeCapabilities.fire()));
                this._register(this._editorModelReference.object.onDidRevertUntitled(() => this.dispose()));
                if (this._editorModelReference.object.isDirty()) {
                    this._onDidChangeDirty.fire();
                }
            }
            else {
                this._editorModelReference.object.load({ limits: this.ensureLimits(_options) });
            }
            if (this.options._backupId) {
                const info = await this._notebookService.withNotebookDataProvider(this._editorModelReference.object.notebook.viewType);
                if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
                    throw new Error('CANNOT open file notebook with this provider');
                }
                const data = await info.serializer.dataToNotebook(buffer_1.VSBuffer.fromString(JSON.stringify({ __webview_backup: this.options._backupId })));
                this._editorModelReference.object.notebook.applyEdits([
                    {
                        editType: 1 /* CellEditType.Replace */,
                        index: 0,
                        count: this._editorModelReference.object.notebook.length,
                        cells: data.cells
                    }
                ], true, undefined, () => undefined, undefined, false);
                if (this.options._workingCopy) {
                    this.options._backupId = undefined;
                    this.options._workingCopy = undefined;
                    this.options.startDirty = undefined;
                }
            }
            return this._editorModelReference.object;
        }
        toUntyped() {
            return {
                resource: this.resource,
                options: {
                    override: this.viewType
                }
            };
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof NotebookEditorInput_1) {
                return this.viewType === otherInput.viewType && (0, resources_1.isEqual)(this.resource, otherInput.resource);
            }
            return false;
        }
    };
    exports.NotebookEditorInput = NotebookEditorInput;
    exports.NotebookEditorInput = NotebookEditorInput = NotebookEditorInput_1 = __decorate([
        __param(4, notebookService_1.INotebookService),
        __param(5, notebookEditorModelResolverService_1.INotebookEditorModelResolverService),
        __param(6, dialogs_1.IFileDialogService),
        __param(7, label_1.ILabelService),
        __param(8, files_1.IFileService),
        __param(9, filesConfigurationService_1.IFilesConfigurationService),
        __param(10, extensions_1.IExtensionService),
        __param(11, editorService_1.IEditorService),
        __param(12, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(13, customEditorLabelService_1.ICustomEditorLabelService)
    ], NotebookEditorInput);
    function isCompositeNotebookEditorInput(thing) {
        return !!thing
            && typeof thing === 'object'
            && Array.isArray(thing.editorInputs)
            && (thing.editorInputs.every(input => input instanceof NotebookEditorInput));
    }
    function isNotebookEditorInput(thing) {
        return !!thing
            && typeof thing === 'object'
            && thing instanceof NotebookEditorInput;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2NvbW1vbi9ub3RlYm9va0VkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxV2hHLHdFQUtDO0lBRUQsc0RBSUM7SUF4VU0sSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxpREFBMkI7O1FBRW5FLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQTJDLEVBQUUsUUFBYSxFQUFFLGlCQUFrQyxFQUFFLFFBQWdCLEVBQUUsVUFBc0MsRUFBRTtZQUM1SyxNQUFNLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMscUJBQW1CLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN4SCxJQUFJLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2hELENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7aUJBRWUsT0FBRSxHQUFXLDBCQUEwQixBQUFyQyxDQUFzQztRQU14RCxZQUNDLFFBQWEsRUFDYixpQkFBa0MsRUFDbEIsUUFBZ0IsRUFDaEIsT0FBbUMsRUFDakMsZ0JBQW1ELEVBQ2hDLDZCQUFtRixFQUNwRyxrQkFBdUQsRUFDNUQsWUFBMkIsRUFDNUIsV0FBeUIsRUFDWCx5QkFBcUQsRUFDOUQsZ0JBQW1DLEVBQ3RDLGFBQTZCLEVBQ1YsZ0NBQW1FLEVBQzNFLHdCQUFtRDtZQUU5RSxLQUFLLENBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUseUJBQXlCLEVBQUUs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