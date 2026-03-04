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
define(["require", "exports", "vs/base/common/event", "vs/base/common/path", "vs/base/common/resources", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor/editorInput", "vs/workbench/contrib/interactive/browser/interactiveDocumentService", "vs/workbench/contrib/interactive/browser/interactiveHistoryService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, event_1, paths, resources_1, modesRegistry_1, resolverService_1, configuration_1, dialogs_1, instantiation_1, editorInput_1, interactiveDocumentService_1, interactiveHistoryService_1, notebookCommon_1, notebookEditorInput_1, notebookService_1) {
    "use strict";
    var InteractiveEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveEditorInput = void 0;
    let InteractiveEditorInput = class InteractiveEditorInput extends editorInput_1.EditorInput {
        static { InteractiveEditorInput_1 = this; }
        static create(instantiationService, resource, inputResource, title, language) {
            return instantiationService.createInstance(InteractiveEditorInput_1, resource, inputResource, title, language);
        }
        static { this.windowNames = {}; }
        static setName(notebookUri, title) {
            if (title) {
                this.windowNames[notebookUri.path] = title;
            }
        }
        static { this.ID = 'workbench.input.interactive'; }
        get editorId() {
            return 'interactive';
        }
        get typeId() {
            return InteractiveEditorInput_1.ID;
        }
        get language() {
            return this._inputModelRef?.object.textEditorModel.getLanguageId() ?? this._initLanguage;
        }
        get notebookEditorInput() {
            return this._notebookEditorInput;
        }
        get editorInputs() {
            return [this._notebookEditorInput];
        }
        get resource() {
            return this._resource;
        }
        get inputResource() {
            return this._inputResource;
        }
        get primary() {
            return this._notebookEditorInput;
        }
        constructor(resource, inputResource, title, languageId, instantiationService, textModelService, interactiveDocumentService, historyService, _notebookService, _fileDialogService, configurationService) {
            const input = notebookEditorInput_1.NotebookEditorInput.getOrCreate(instantiationService, resource, undefined, 'interactive', {});
            super();
            this._notebookService = _notebookService;
            this._fileDialogService = _fileDialogService;
            this.isScratchpad = configurationService.getValue(notebookCommon_1.NotebookSetting.InteractiveWindowPromptToSave) !== true;
            this._notebookEditorInput = input;
            this._register(this._notebookEditorInput);
            this.name = title ?? InteractiveEditorInput_1.windowNames[resource.path] ?? paths.basename(resource.path, paths.extname(resource.path));
            this._initLanguage = languageId;
            this._resource = resource;
            this._inputResource = inputResource;
            this._inputResolver = null;
            this._editorModelReference = null;
            this._inputModelRef = null;
            this._textModelService = textModelService;
            this._interactiveDocumentService = interactiveDocumentService;
            this._historyService = historyService;
            this._registerListeners();
        }
        _registerListeners() {
            const oncePrimaryDisposed = event_1.Event.once(this.primary.onWillDispose);
            this._register(oncePrimaryDisposed(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            // Re-emit some events from the primary side to the outside
            this._register(this.primary.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this._register(this.primary.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
            // Re-emit some events from both sides to the outside
            this._register(this.primary.onDidChangeCapabilities(() => this._onDidChangeCapabilities.fire()));
        }
        get capabilities() {
            const scratchPad = this.isScratchpad ? 512 /* EditorInputCapabilities.Scratchpad */ : 0;
            return 4 /* EditorInputCapabilities.Untitled */
                | 2 /* EditorInputCapabilities.Readonly */
                | scratchPad;
        }
        async _resolveEditorModel() {
            if (!this._editorModelReference) {
                this._editorModelReference = await this._notebookEditorInput.resolve();
            }
            return this._editorModelReference;
        }
        async resolve() {
            if (this._editorModelReference) {
                return this._editorModelReference;
            }
            if (this._inputResolver) {
                return this._inputResolver;
            }
            this._inputResolver = this._resolveEditorModel();
            return this._inputResolver;
        }
        async resolveInput(language) {
            if (this._inputModelRef) {
                return this._inputModelRef.object.textEditorModel;
            }
            const resolvedLanguage = language ?? this._initLanguage ?? modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
            this._interactiveDocumentService.willCreateInteractiveDocument(this.resource, this.inputResource, resolvedLanguage);
            this._inputModelRef = await this._textModelService.createModelReference(this.inputResource);
            return this._inputModelRef.object.textEditorModel;
        }
        async save(group, options) {
            if (this._editorModelReference) {
                if (this.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                    return this.saveAs(group, options);
                }
                else {
                    await this._editorModelReference.save(options);
                }
                return this;
            }
            return undefined;
        }
        async saveAs(group, options) {
            if (!this._editorModelReference) {
                return undefined;
            }
            const provider = this._notebookService.getContributedNotebookType('interactive');
            if (!provider) {
                return undefined;
            }
            const filename = this.getName() + '.ipynb';
            const pathCandidate = (0, resources_1.joinPath)(await this._fileDialogService.defaultFilePath(), filename);
            const target = await this._fileDialogService.pickFileToSave(pathCandidate, options?.availableFileSystems);
            if (!target) {
                return undefined; // save cancelled
            }
            const saved = await this._editorModelReference.saveAs(target);
            if (saved && 'resource' in saved && saved.resource) {
                this._notebookService.getNotebookTextModel(saved.resource)?.dispose();
            }
            return saved;
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof InteractiveEditorInput_1) {
                return (0, resources_1.isEqual)(this.resource, otherInput.resource) && (0, resources_1.isEqual)(this.inputResource, otherInput.inputResource);
            }
            return false;
        }
        getName() {
            return this.name;
        }
        isDirty() {
            if (this.isScratchpad) {
                return false;
            }
            return this._editorModelReference?.isDirty() ?? false;
        }
        isModified() {
            return this._editorModelReference?.isModified() ?? false;
        }
        async revert(_group, options) {
            if (this._editorModelReference && this._editorModelReference.isDirty()) {
                await this._editorModelReference.revert(options);
            }
        }
        dispose() {
            // we support closing the interactive window without prompt, so the editor model should not be dirty
            this._editorModelReference?.revert({ soft: true });
            this._notebookEditorInput?.dispose();
            this._editorModelReference?.dispose();
            this._editorModelReference = null;
            this._interactiveDocumentService.willRemoveInteractiveDocument(this.resource, this.inputResource);
            this._inputModelRef?.dispose();
            this._inputModelRef = null;
            super.dispose();
        }
        get historyService() {
            return this._historyService;
        }
    };
    exports.InteractiveEditorInput = InteractiveEditorInput;
    exports.InteractiveEditorInput = InteractiveEditorInput = InteractiveEditorInput_1 = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, resolverService_1.ITextModelService),
        __param(6, interactiveDocumentService_1.IInteractiveDocumentService),
        __param(7, interactiveHistoryService_1.IInteractiveHistoryService),
        __param(8, notebookService_1.INotebookService),
        __param(9, dialogs_1.IFileDialogService),
        __param(10, configuration_1.IConfigurationService)
    ], InteractiveEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RpdmVFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ludGVyYWN0aXZlL2Jyb3dzZXIvaW50ZXJhY3RpdmVFZGl0b3JJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb0J6RixJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLHlCQUFXOztRQUN0RCxNQUFNLENBQUMsTUFBTSxDQUFDLG9CQUEyQyxFQUFFLFFBQWEsRUFBRSxhQUFrQixFQUFFLEtBQWMsRUFBRSxRQUFpQjtZQUM5SCxPQUFPLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx3QkFBc0IsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM5RyxDQUFDO2lCQUVjLGdCQUFXLEdBQTJCLEVBQUUsQUFBN0IsQ0FBOEI7UUFFeEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFnQixFQUFFLEtBQXlCO1lBQ3pELElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQzVDLENBQUM7UUFDRixDQUFDO2lCQUVlLE9BQUUsR0FBVyw2QkFBNkIsQUFBeEMsQ0FBeUM7UUFFM0QsSUFBb0IsUUFBUTtZQUMzQixPQUFPLGFBQWEsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBYSxNQUFNO1lBQ2xCLE9BQU8sd0JBQXNCLENBQUMsRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFLRCxJQUFJLFFBQVE7WUFDWCxPQUFPLElBQUksQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsSUFBSSxJQUFJLENBQUMs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