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
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/types", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/common/editor", "vs/workbench/common/editor/editorOptions", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/textDiffEditorModel", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/registry/common/platform", "vs/base/common/uri", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/editor/common/editor", "vs/platform/contextkey/common/contextkey", "vs/base/common/resources", "vs/base/browser/dom", "vs/platform/files/common/files", "vs/workbench/services/preferences/common/preferences", "vs/base/common/stopwatch", "vs/editor/browser/widget/diffEditor/diffEditorWidget"], function (require, exports, nls_1, objects_1, types_1, textEditor_1, editor_1, editorOptions_1, diffEditorInput_1, textDiffEditorModel_1, telemetry_1, storage_1, textResourceConfiguration_1, instantiation_1, themeService_1, platform_1, uri_1, editorGroupsService_1, editorService_1, editor_2, contextkey_1, resources_1, dom_1, files_1, preferences_1, stopwatch_1, diffEditorWidget_1) {
    "use strict";
    var TextDiffEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextDiffEditor = void 0;
    /**
     * The text editor that leverages the diff text editor for the editing experience.
     */
    let TextDiffEditor = class TextDiffEditor extends textEditor_1.AbstractTextEditor {
        static { TextDiffEditor_1 = this; }
        static { this.ID = editor_1.TEXT_DIFF_EDITOR_ID; }
        get scopedContextKeyService() {
            if (!this.diffEditorControl) {
                return undefined;
            }
            const originalEditor = this.diffEditorControl.getOriginalEditor();
            const modifiedEditor = this.diffEditorControl.getModifiedEditor();
            return (originalEditor.hasTextFocus() ? originalEditor : modifiedEditor).invokeWithinContext(accessor => accessor.get(contextkey_1.IContextKeyService));
        }
        constructor(group, telemetryService, instantiationService, storageService, configurationService, editorService, themeService, editorGroupService, fileService, preferencesService) {
            super(TextDiffEditor_1.ID, group, telemetryService, instantiationService, storageService, configurationService, themeService, editorService, editorGroupService, fileService);
            this.preferencesService = preferencesService;
            this.diffEditorControl = undefined;
            this.inputLifecycleStopWatch = undefined;
            this._previousViewModel = null;
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('textDiffEditor', "Text Diff Editor");
        }
        createEditorControl(parent, configuration) {
            this.diffEditorControl = this._register(this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, parent, configuration, {}));
        }
        updateEditorControlOptions(options) {
            this.diffEditorControl?.updateOptions(options);
        }
        getMainControl() {
            return this.diffEditorControl?.getModifiedEditor();
        }
        async setInput(input, options, context, token) {
            if (this._previousViewModel) {
                this._previousViewModel.dispose();
                this._previousViewModel = null;
            }
            // Cleanup previous things associated with the input
            this.inputLifecycleStopWatch = undefined;
            // Set input and resolve
            await super.setInput(input, options, context, token);
            try {
                const resolvedModel = await input.resolve();
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // Fallback to open as binary if not text
                if (!(resolvedModel instanceof textDiffEditorModel_1.TextDiffEditorModel)) {
                    this.openAsBinary(input, options);
                    return undefined;
                }
                // Set Editor Model
                const control = (0, types_1.assertIsDefined)(this.diffEditorControl);
                const resolvedDiffEditorModel = resolvedModel;
                const vm = resolvedDiffEditorModel.textDiffEditorModel ? control.createViewModel(resolvedDiffEditorModel.textDiffEditorModel) : null;
                this._previousViewModel = vm;
                await vm?.waitForDiff();
                control.setModel(vm);
                // Restore view state (unless provided by options)
                let hasPreviousViewState = false;
                if (!(0, editor_1.isTextEditorViewState)(options?.viewState)) {
                    hasPreviousViewState = this.restoreTextDiffEditorViewState(input, options, context, control);
                }
                // Apply options to editor if any
                let optionsGotApplied = false;
                if (options) {
                    optionsGotApplied = (0, editorOptions_1.applyTextEditorOptions)(options, control, 1 /* ScrollType.Immediate */);
                }
                if (!optionsGotApplied && !hasPreviousViewState) {
                    control.revealFirstDiff();
                }
                // Since the resolved model provides information about being readonly
                // or not, we apply it here to the editor even though the editor input
                // was already asked for being readonly or not. The rationale is that
                // a resolved model might have more specific information about being
                // readonly or not that the input did not have.
                control.updateOptions({
                    ...this.getReadonlyConfiguration(resolvedDiffEditorModel.modifiedModel?.isReadonly()),
                    originalEditable: !resolvedDiffEditorModel.originalModel?.isReadonly()
                });
                control.handleInitialized();
                // Start to measure input lifecycle
                this.inputLifecycleStopWatch = new stopwatch_1.StopWatch(false);
            }
            catch (error) {
                await this.handleSetInputError(error, input, options);
            }
        }
        async handleSetInputError(error, input, options) {
            // Handle case where content appears to be binary
            if (this.isFileBinaryError(error)) {
                return this.openAsBinary(input, options);
            }
            // Handle case where a file is too large to open without confirmation
            if (error.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                let message;
                if (error instanceof files_1.TooLargeFileOperationError) {
                    message = (0, nls_1.localize)('fileTooLargeForHeapErrorWithSize', "At least one file is not displayed in the text compare editor because it is very large ({0}).", files_1.ByteSize.formatSize(error.size));
                }
                else {
                    message = (0, nls_1.localize)('fileTooLargeForHeapErrorWithoutSize', "At least one file is not displayed in the text compare editor because it is very large.");
                }
                throw (0, editor_1.createTooLargeFileError)(this.group, input, options, message, this.preferencesService);
            }
            // Otherwise make sure the error bubbles up
            throw error;
        }
        restoreTextDiffEditorViewState(editor, options, context, control) {
            const editorViewState = this.loadEditorViewState(editor, context);
            if (editorViewState) {
                if (options?.selection && editorViewState.modified) {
                    editorViewState.modified.cursorState = []; // prevent duplicate selections via options
                }
                control.restoreViewState(editorViewState);
                if (options?.revealIfVisible) {
                    control.revealFirstDiff();
                }
                return true;
            }
            return false;
        }
        openAsBinary(input, options) {
            const original = input.original;
            const modified = input.modified;
            const binaryDiffInput = this.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, input.getName(), input.getDescription(), original, modified, true);
            // Forward binary flag to input if supported
            const fileEditorFactory = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).getFileEditorFactory();
            if (fileEditorFactory.isFileEditor(original)) {
                original.setForceOpenAsBinary();
            }
            if (fileEditorFactory.isFileEditor(modified)) {
                modified.setForceOpenAsBinary();
            }
            // Replace this editor with the binary one
            this.group.replaceEditors([{
                    editor: input,
                    replacement: binaryDiffInput,
                    options: {
                        ...options,
                        // Make sure to not steal away the currently active group
                        // because we are triggering another openEditor() call
                        // and do not control the initial intent that resulted
                        // in us now opening as binary.
                        activation: editor_2.EditorActivation.PRESERVE,
                        pinned: this.group.isPinned(input),
                        sticky: this.group.isSticky(input)
                    }
                }]);
        }
        setOptions(options) {
            super.setOptions(options);
            if (options) {
                (0, editorOptions_1.applyTextEditorOptions)(options, (0, types_1.assertIsDefined)(this.diffEditorControl), 0 /* ScrollType.Smooth */);
            }
        }
        shouldHandleConfigurationChangeEvent(e, resource) {
            if (super.shouldHandleConfigurationChangeEvent(e, resource)) {
                return true;
            }
            return e.affectsConfiguration(resource, 'diffEditor') || e.affectsConfiguration(resource, 'accessibility.verbosity.diffEditor');
        }
        computeConfiguration(configuration) {
            const editorConfiguration = super.computeConfiguration(configuration);
            // Handle diff editor specially by merging in diffEditor configuration
            if ((0, types_1.isObject)(configuration.diffEditor)) {
                const diffEditorConfiguration = (0, objects_1.deepClone)(configuration.diffEditor);
                // User settings defines `diffEditor.codeLens`, but here we rename that to `diffEditor.diffCodeLens` to avoid collisions with `editor.codeLens`.
                diffEditorConfiguration.diffCodeLens = diffEditorConfiguration.codeLens;
                delete diffEditorConfiguration.codeLens;
                // User settings defines `diffEditor.wordWrap`, but here we rename that to `diffEditor.diffWordWrap` to avoid collisions with `editor.wordWrap`.
                diffEditorConfiguration.diffWordWrap = diffEditorConfiguration.wordWrap;
                delete diffEditorConfiguration.wordWrap;
                Object.assign(editorConfiguration, diffEditorConfiguration);
            }
            const verbose = configuration.accessibility?.verbosity?.diffEditor ?? false;
            editorConfiguration.accessibilityVerbose = verbose;
            return editorConfiguration;
        }
        getConfigurationOverrides(configuration) {
            return {
                ...super.getConfigurationOverrides(configuration),
                ...this.getReadonlyConfiguration(this.input?.isReadonly()),
                originalEditable: this.input instanceof diffEditorInput_1.DiffEditorInput && !this.input.original.isReadonly(),
                lineDecorationsWidth: '2ch'
            };
        }
        updateReadonly(input) {
            if (input instanceof diffEditorInput_1.DiffEditorInput) {
                this.diffEditorControl?.updateOptions({
                    ...this.getReadonlyConfiguration(input.isReadonly()),
                    originalEditable: !input.original.isReadonly(),
                });
            }
            else {
                super.updateReadonly(input);
            }
        }
        isFileBinaryError(error) {
            if (Array.isArray(error)) {
                const errors = error;
                return errors.some(error => this.isFileBinaryError(error));
            }
            return error.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */;
        }
        clearInput() {
            if (this._previousViewModel) {
                this._previousViewModel.dispose();
                this._previousViewModel = null;
            }
            super.clearInput();
            // Log input lifecycle telemetry
            const inputLifecycleElapsed = this.inputLifecycleStopWatch?.elapsed();
            this.inputLifecycleStopWatch = undefined;
            if (typeof inputLifecycleElapsed === 'number') {
                this.logInputLifecycleTelemetry(inputLifecycleElapsed, this.getControl()?.getModel()?.modified?.getLanguageId());
            }
            // Clear Model
            this.diffEditorControl?.setModel(null);
        }
        logInputLifecycleTelemetry(duration, languageId) {
            let collapseUnchangedRegions = false;
            if (this.diffEditorControl instanceof diffEditorWidget_1.DiffEditorWidget) {
                collapseUnchangedRegions = this.diffEditorControl.collapseUnchangedRegions;
            }
            this.telemetryService.publicLog2('diffEditor.editorVisibleTime', {
                editorVisibleTimeMs: duration,
                languageId: languageId ?? '',
                collapseUnchangedRegions,
            });
        }
        getControl() {
            return this.diffEditorControl;
        }
        focus() {
            super.focus();
            this.diffEditorControl?.focus();
        }
        hasFocus() {
            return this.diffEditorControl?.hasTextFocus() || super.hasFocus();
        }
        setEditorVisible(visible) {
            super.setEditorVisible(visible);
            if (visible) {
                this.diffEditorControl?.onVisible();
            }
            else {
                this.diffEditorControl?.onHide();
            }
        }
        layout(dimension) {
            this.diffEditorControl?.layout(dimension);
        }
        setBoundarySashes(sashes) {
            this.diffEditorControl?.setBoundarySashes(sashes);
        }
        tracksEditorViewState(input) {
            return input instanceof diffEditorInput_1.DiffEditorInput;
        }
        computeEditorViewState(resource) {
            if (!this.diffEditorControl) {
                return undefined;
            }
            const model = this.diffEditorControl.getModel();
            if (!model || !model.modified || !model.original) {
                return undefined; // view state always needs a model
            }
            const modelUri = this.toEditorViewStateResource(model);
            if (!modelUri) {
                return undefined; // model URI is needed to make sure we save the view state correctly
            }
            if (!(0, resources_1.isEqual)(modelUri, resource)) {
                return undefined; // prevent saving view state for a model that is not the expected one
            }
            return this.diffEditorControl.saveViewState() ?? undefined;
        }
        toEditorViewStateResource(modelOrInput) {
            let original;
            let modified;
            if (modelOrInput instanceof diffEditorInput_1.DiffEditorInput) {
                original = modelOrInput.original.resource;
                modified = modelOrInput.modified.resource;
            }
            else if (!(0, editor_1.isEditorInput)(modelOrInput)) {
                original = modelOrInput.original.uri;
                modified = modelOrInput.modified.uri;
            }
            if (!original || !modified) {
                return undefined;
            }
            // create a URI that is the Base64 concatenation of original + modified resource
            return uri_1.URI.from({ scheme: 'diff', path: `${(0, dom_1.multibyteAwareBtoa)(original.toString())}${(0, dom_1.multibyteAwareBtoa)(modified.toString())}` });
        }
    };
    exports.TextDiffEditor = TextDiffEditor;
    exports.TextDiffEditor = TextDiffEditor = TextDiffEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, editorService_1.IEditorService),
        __param(6, themeService_1.IThemeService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, files_1.IFileService),
        __param(9, preferences_1.IPreferencesService)
    ], TextDiffEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dERpZmZFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvdGV4dERpZmZFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW1DaEc7O09BRUc7SUFDSSxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsK0JBQXdDOztpQkFDM0QsT0FBRSxHQUFHLDRCQUFtQixBQUF0QixDQUF1QjtRQU16QyxJQUFhLHVCQUF1QjtZQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzdCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUNsRSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUVsRSxPQUFPLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDNUksQ0FBQztRQUVELFlBQ0MsS0FBbUIsRUFDQSxnQkFBbUMsRUFDL0Isb0JBQTJDLEVBQ2pELGNBQStCLEVBQ2Isb0JBQXVELEVBQzFFLGFBQTZCLEVBQzlCLFlBQTJCLEVBQ3BCLGtCQUF3QyxFQUNoRCxXQUF5QixFQUNsQixrQkFBd0Q7WUFFN0UsS0FBSyxDQUFDLGdCQUFjLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxvQkFB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