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
define(["require", "exports", "vs/workbench/common/editor/textEditorModel", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/base/common/event", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/editor/common/services/textResourceConfiguration", "vs/editor/common/model/textModel", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/workingCopy/common/workingCopy", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/types", "vs/platform/label/common/label", "vs/editor/common/core/wordHelper", "vs/workbench/services/editor/common/editorService", "vs/base/common/strings", "vs/workbench/services/textfile/common/encoding", "vs/base/common/buffer", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/platform/accessibility/common/accessibility"], function (require, exports, textEditorModel_1, language_1, model_1, event_1, workingCopyBackup_1, textResourceConfiguration_1, textModel_1, workingCopyService_1, workingCopy_1, textfiles_1, types_1, label_1, wordHelper_1, editorService_1, strings_1, encoding_1, buffer_1, languageDetectionWorkerService_1, accessibility_1) {
    "use strict";
    var UntitledTextEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorModel = void 0;
    let UntitledTextEditorModel = class UntitledTextEditorModel extends textEditorModel_1.BaseTextEditorModel {
        static { UntitledTextEditorModel_1 = this; }
        static { this.FIRST_LINE_NAME_MAX_LENGTH = 40; }
        static { this.FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH = UntitledTextEditorModel_1.FIRST_LINE_NAME_MAX_LENGTH * 10; }
        // Support the special '${activeEditorLanguage}' language by
        // looking up the language id from the editor that is active
        // before the untitled editor opens. This special id is only
        // used for the initial language and can be changed after the
        // fact (either manually or through auto-detection).
        static { this.ACTIVE_EDITOR_LANGUAGE_ID = '${activeEditorLanguage}'; }
        get name() {
            // Take name from first line if present and only if
            // we have no associated file path. In that case we
            // prefer the file name as title.
            if (this.configuredLabelFormat === 'content' && !this.hasAssociatedFilePath && this.cachedModelFirstLineWords) {
                return this.cachedModelFirstLineWords;
            }
            // Otherwise fallback to resource
            return this.labelService.getUriBasenameLabel(this.resource);
        }
        //#endregion
        constructor(resource, hasAssociatedFilePath, initialValue, preferredLanguageId, preferredEncoding, languageService, modelService, workingCopyBackupService, textResourceConfigurationService, workingCopyService, textFileService, labelService, editorService, languageDetectionService, accessibilityService) {
            super(modelService, languageService, languageDetectionService, accessibilityService);
            this.resource = resource;
            this.hasAssociatedFilePath = hasAssociatedFilePath;
            this.initialValue = initialValue;
            this.preferredLanguageId = preferredLanguageId;
            this.preferredEncoding = preferredEncoding;
            this.workingCopyBackupService = workingCopyBackupService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.workingCopyService = workingCopyService;
            this.textFileService = textFileService;
            this.labelService = labelService;
            this.editorService = editorService;
            //#region Events
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeName = this._register(new event_1.Emitter());
            this.onDidChangeName = this._onDidChangeName.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            //#endregion
            this.typeId = workingCopy_1.NO_TYPE_ID; // IMPORTANT: never change this to not break existing assumptions (e.g. backups)
            this.capabilities = 2 /* WorkingCopyCapabilities.Untitled */;
            //#region Name
            this.configuredLabelFormat = 'content';
            this.cachedModelFirstLineWords = undefined;
            //#endregion
            //#region Dirty
            this.dirty = this.hasAssociatedFilePath || !!this.initialValue;
            //#endregion
            //#region Resolve
            this.ignoreDirtyOnModelContentChange = false;
            // Make known to working copy service
            this._register(this.workingCopyService.registerWorkingCopy(this));
            // This is typically controlled by the setting `files.defaultLanguage`.
            // If that setting is set, we should not detect the language.
            if (preferredLanguageId) {
                this.setLanguageId(preferredLanguageId);
            }
            // Fetch config
            this.onConfigurationChange(undefined, false);
            this.registerListeners();
        }
        registerListeners() {
            // Config Changes
            this._register(this.textResourceConfigurationService.onDidChangeConfiguration(e => this.onConfigurationChange(e, true)));
        }
        onConfigurationChange(e, fromEvent) {
            // Encoding
            if (!e || e.affectsConfiguration(this.resource, 'files.encoding')) {
                const configuredEncoding = this.textResourceConfigurationService.getValue(this.resource, 'files.encoding');
                if (this.configuredEncoding !== configuredEncoding && typeof configuredEncoding === 'string') {
                    this.configuredEncoding = configuredEncoding;
                    if (fromEvent && !this.preferredEncoding) {
                        this._onDidChangeEncoding.fire(); // do not fire event if we have a preferred encoding set
                    }
                }
            }
            // Label Format
            if (!e || e.affectsConfiguration(this.resource, 'workbench.editor.untitled.labelFormat')) {
                const configuredLabelFormat = this.textResourceConfigurationService.getValue(this.resource, 'workbench.editor.untitled.labelFormat');
                if (this.configuredLabelFormat !== configuredLabelFormat && (configuredLabelFormat === 'content' || configuredLabelFormat === 'name')) {
                    this.configuredLabelFormat = configuredLabelFormat;
                    if (fromEvent) {
                        this._onDidChangeName.fire();
                    }
                }
            }
        }
        //#region Language
        setLanguageId(languageId, source) {
            const actualLanguage = languageId === UntitledTextEditorModel_1.ACTIVE_EDITOR_LANGUAGE_ID
                ? this.editorService.activeTextEditorLanguageId
                : languageId;
            this.preferredLanguageId = actualLanguage;
            if (actualLanguage) {
                super.setLanguageId(actualLanguage, source);
            }
        }
        getLanguageId() {
            if (this.textEditorModel) {
                return this.textEditorModel.getLanguageId();
            }
            return this.preferredLanguageId;
        }
        getEncoding() {
            return this.preferredEncoding || this.configuredEncoding;
        }
        async setEncoding(encoding) {
            const oldEncoding = this.getEncoding();
            this.preferredEncoding = encoding;
            // Emit if it changed
            if (oldEncoding !== this.preferredEncoding) {
                this._onDidChangeEncoding.fire();
            }
        }
        isDirty() {
            return this.dirty;
        }
        isModified() {
            return this.isDirty();
        }
        setDirty(dirty) {
            if (this.dirty === dirty) {
                return;
            }
            this.dirty = dirty;
            this._onDidChangeDirty.fire();
        }
        //#endregion
        //#region Save / Revert / Backup
        async save(options) {
            const target = await this.textFileService.save(this.resource, options);
            // Emit as event
            if (target) {
                this._onDidSave.fire({ reason: options?.reason, source: options?.source });
            }
            return !!target;
        }
        async revert() {
            // Reset contents to be empty
            this.ignoreDirtyOnModelContentChange = true;
            try {
                this.updateTextEditorModel((0, textModel_1.createTextBufferFactory)(''));
            }
            finally {
                this.ignoreDirtyOnModelContentChange = false;
            }
            // No longer dirty
            this.setDirty(false);
            // Emit as event
            this._onDidRevert.fire();
        }
        async backup(token) {
            let content = undefined;
            // Make sure to check whether this model has been resolved
            // or not and fallback to the initial value - if any - to
            // prevent backing up an unresolved model and loosing the
            // initial value.
            if (this.isResolved()) {
                // Fill in content the same way we would do when saving the file
                // via the text file service encoding support (hardcode UTF-8)
                content = await this.textFileService.getEncodedReadable(this.resource, this.createSnapshot() ?? undefined, { encoding: encoding_1.UTF8 });
            }
            else if (typeof this.initialValue === 'string') {
                content = (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(this.initialValue));
            }
            return { content };
        }
        async resolve() {
            // Create text editor model if not yet done
            let createdUntitledModel = false;
            let hasBackup = false;
            if (!this.textEditorModel) {
                let untitledContents;
                // Check for backups or use initial value or empty
                const backup = await this.workingCopyBackupService.resolve(this);
                if (backup) {
                    untitledContents = backup.value;
                    hasBackup = true;
                }
                else {
                    untitledContents = (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(this.initialValue || ''));
                }
                // Determine untitled contents based on backup
                // or initial value. We must use text file service
                // to create the text factory to respect encodings
                // accordingly.
                const untitledContentsFactory = await (0, textModel_1.createTextBufferFactoryFromStream)(await this.textFileService.getDecodedStream(this.resource, untitledContents, { encoding: encoding_1.UTF8 }));
                this.createTextEditorModel(untitledContentsFactory, this.resource, this.preferredLanguageId);
                createdUntitledModel = true;
            }
            // Otherwise: the untitled model already exists and we must assume
            // that the value of the model was changed by the user. As such we
            // do not update the contents, only the language if configured.
            else {
                this.updateTextEditorModel(undefined, this.preferredLanguageId);
            }
            // Listen to text model events
            const textEditorModel = (0, types_1.assertIsDefined)(this.textEditorModel);
            this.installModelListeners(textEditorModel);
            // Only adjust name and dirty state etc. if we
            // actually created the untitled model
            if (createdUntitledModel) {
                // Name
                if (hasBackup || this.initialValue) {
                    this.updateNameFromFirstLine(textEditorModel);
                }
                // Untitled associated to file path are dirty right away as well as untitled with content
                this.setDirty(this.hasAssociatedFilePath || !!hasBackup || !!this.initialValue);
                // If we have initial contents, make sure to emit this
                // as the appropiate events to the outside.
                if (hasBackup || this.initialValue) {
                    this._onDidChangeContent.fire();
                }
            }
            return super.resolve();
        }
        installModelListeners(model) {
            this._register(model.onDidChangeContent(e => this.onModelContentChanged(model, e)));
            this._register(model.onDidChangeLanguage(() => this.onConfigurationChange(undefined, true))); // language change can have impact on config
            super.installModelListeners(model);
        }
        onModelContentChanged(textEditorModel, e) {
            if (!this.ignoreDirtyOnModelContentChange) {
                // mark the untitled text editor as non-dirty once its content becomes empty and we do
                // not have an associated path set. we never want dirty indicator in that case.
                if (!this.hasAssociatedFilePath && textEditorModel.getLineCount() === 1 && textEditorModel.getLineLength(1) === 0) {
                    this.setDirty(false);
                }
                // turn dirty otherwise
                else {
                    this.setDirty(true);
                }
            }
            // Check for name change if first line changed in the range of 0-FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH columns
            if (e.changes.some(change => (change.range.startLineNumber === 1 || change.range.endLineNumber === 1) && change.range.startColumn <= UntitledTextEditorModel_1.FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH)) {
                this.updateNameFromFirstLine(textEditorModel);
            }
            // Emit as general content change event
            this._onDidChangeContent.fire();
            // Detect language from content
            this.autoDetectLanguage();
        }
        updateNameFromFirstLine(textEditorModel) {
            if (this.hasAssociatedFilePath) {
                return; // not in case of an associated file path
            }
            // Determine the first words of the model following these rules:
            // - cannot be only whitespace (so we trim())
            // - cannot be only non-alphanumeric characters (so we run word definition regex over it)
            // - cannot be longer than FIRST_LINE_MAX_TITLE_LENGTH
            // - normalize multiple whitespaces to a single whitespace
            let modelFirstWordsCandidate = undefined;
            let firstLineText = textEditorModel
                .getValueInRange({
                startLineNumber: 1,
                endLineNumber: 1,
                startColumn: 1,
                endColumn: UntitledTextEditorModel_1.FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH + 1 // first cap at FIRST_LINE_NAME_CANDIDATE_MAX_LENGTH
            })
                .trim().replace(/\s+/g, ' ') // normalize whitespaces
                .replace(/\u202E/g, ''); // drop Right-to-Left Override character (#190133)
            firstLineText = firstLineText.substr(0, (0, strings_1.getCharContainingOffset)(// finally cap at FIRST_LINE_NAME_MAX_LENGTH (grapheme aware #111235)
            firstLineText, UntitledTextEditorModel_1.FIRST_LINE_NAME_MAX_LENGTH)[0]);
            if (firstLineText && (0, wordHelper_1.ensureValidWordDefinition)().exec(firstLineText)) {
                modelFirstWordsCandidate = firstLineText;
            }
            if (modelFirstWordsCandidate !== this.cachedModelFirstLineWords) {
                this.cachedModelFirstLineWords = modelFirstWordsCandidate;
                this._onDidChangeName.fire();
            }
        }
        //#endregion
        isReadonly() {
            return false;
        }
    };
    exports.UntitledTextEditorModel = UntitledTextEditorModel;
    exports.UntitledTextEditorModel = UntitledTextEditorModel = UntitledTextEditorModel_1 = __decorate([
        __param(5, language_1.ILanguageService),
        __param(6, model_1.IModelService),
        __param(7, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, workingCopyService_1.IWorkingCopyService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, label_1.ILabelService),
        __param(12, editorService_1.IEditorService),
        __param(13, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(14, accessibility_1.IAccessibilityService)
    ], UntitledTextEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRUZXh0RWRpdG9yTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdW50aXRsZWQvY29tbW9uL3VudGl0bGVkVGV4dEVkaXRvck1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFrRXpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEscUNBQW1COztpQkFFdkMsK0JBQTBCLEdBQUcsRUFBRSxBQUFMLENBQU07aUJBQ2hDLHlDQUFvQyxHQUFHLHlCQUF1QixDQUFDLDBCQUEwQixHQUFHLEVBQUUsQUFBMUQsQ0FBMkQ7UUFFdkgsNERBQTREO1FBQzVELDREQUE0RDtRQUM1RCw0REFBNEQ7UUFDNUQsNkRBQTZEO1FBQzdELG9EQUFvRDtpQkFDNUIsOEJBQXlCLEdBQUcseUJBQXlCLEFBQTVCLENBQTZCO1FBaUM5RSxJQUFJLElBQUk7WUFFUCxtREFBbUQ7WUFDbkQsbURBQW1EO1lBQ25ELGlDQUFpQztZQUNqQyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsS0FBSyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLElBQUksSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7Z0JBQy9HLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDO1lBQ3ZDLENBQUM7WUFFRCxpQ0FBaUM7WUFDakMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRUQsWUFBWTtRQUVaLFlBQ1UsUUFBYSxFQUNiLHFCQUE4QixFQUN0QixZQUFnQyxFQUN6QyxtQkFBdUMsRUFDdkMsaUJBQXFDLEVBQzNCLGVBQWlDLEVBQ3BDLFlBQTJCLEVBQ2Ysd0JBQW9F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