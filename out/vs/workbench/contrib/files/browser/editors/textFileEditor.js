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
define(["require", "exports", "vs/nls", "vs/base/common/performance", "vs/base/common/types", "vs/workbench/services/path/common/pathService", "vs/base/common/actions", "vs/workbench/contrib/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/browser/parts/editor/textCodeEditor", "vs/workbench/common/editor", "vs/workbench/common/editor/editorOptions", "vs/workbench/common/editor/binaryEditorModel", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/editor/common/editor", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/files/browser/files", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/configuration/common/configuration", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/host/browser/host", "vs/workbench/services/filesConfiguration/common/filesConfigurationService"], function (require, exports, nls_1, performance_1, types_1, pathService_1, actions_1, files_1, textfiles_1, textCodeEditor_1, editor_1, editorOptions_1, binaryEditorModel_1, fileEditorInput_1, files_2, telemetry_1, workspace_1, storage_1, textResourceConfiguration_1, instantiation_1, themeService_1, editorService_1, editorGroupsService_1, editor_2, uriIdentity_1, files_3, panecomposite_1, configuration_1, preferences_1, host_1, filesConfigurationService_1) {
    "use strict";
    var TextFileEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileEditor = void 0;
    /**
     * An implementation of editor for file system resources.
     */
    let TextFileEditor = class TextFileEditor extends textCodeEditor_1.AbstractTextCodeEditor {
        static { TextFileEditor_1 = this; }
        static { this.ID = files_1.TEXT_FILE_EDITOR_ID; }
        constructor(group, telemetryService, fileService, paneCompositeService, instantiationService, contextService, storageService, textResourceConfigurationService, editorService, themeService, editorGroupService, textFileService, explorerService, uriIdentityService, pathService, configurationService, preferencesService, hostService, filesConfigurationService) {
            super(TextFileEditor_1.ID, group, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService, fileService);
            this.paneCompositeService = paneCompositeService;
            this.contextService = contextService;
            this.textFileService = textFileService;
            this.explorerService = explorerService;
            this.uriIdentityService = uriIdentityService;
            this.pathService = pathService;
            this.configurationService = configurationService;
            this.preferencesService = preferencesService;
            this.hostService = hostService;
            this.filesConfigurationService = filesConfigurationService;
            // Clear view state for deleted files
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // Move view state for moved files
            this._register(this.fileService.onDidRunOperation(e => this.onDidRunOperation(e)));
        }
        onDidFilesChange(e) {
            for (const resource of e.rawDeleted) {
                this.clearEditorViewState(resource);
            }
        }
        onDidRunOperation(e) {
            if (e.operation === 2 /* FileOperation.MOVE */ && e.target) {
                this.moveEditorViewState(e.resource, e.target.resource, this.uriIdentityService.extUri);
            }
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('textFileEditor', "Text File Editor");
        }
        get input() {
            return this._input;
        }
        async setInput(input, options, context, token) {
            (0, performance_1.mark)('code/willSetInputToTextFileEditor');
            // Set input and resolve
            await super.setInput(input, options, context, token);
            try {
                const resolvedModel = await input.resolve(options);
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return;
                }
                // There is a special case where the text editor has to handle binary
                // file editor input: if a binary file has been resolved and cached
                // before, it maybe an actual instance of BinaryEditorModel. In this
                // case our text editor has to open this model using the binary editor.
                // We return early in this case.
                if (resolvedModel instanceof binaryEditorModel_1.BinaryEditorModel) {
                    return this.openAsBinary(input, options);
                }
                const textFileModel = resolvedModel;
                // Editor
                const control = (0, types_1.assertIsDefined)(this.editorControl);
                control.setModel(textFileModel.textEditorModel);
                // Restore view state (unless provided by options)
                if (!(0, editor_1.isTextEditorViewState)(options?.viewState)) {
                    const editorViewState = this.loadEditorViewState(input, context);
                    if (editorViewState) {
                        if (options?.selection) {
                            editorViewState.cursorState = []; // prevent duplicate selections via options
                        }
                        control.restoreViewState(editorViewState);
                    }
                }
                // Apply options to editor if any
                if (options) {
                    (0, editorOptions_1.applyTextEditorOptions)(options, control, 1 /* ScrollType.Immediate */);
                }
                // Since the resolved model provides information about being readonly
                // or not, we apply it here to the editor even though the editor input
                // was already asked for being readonly or not. The rationale is that
                // a resolved model might have more specific information about being
                // readonly or not that the input did not have.
                control.updateOptions(this.getReadonlyConfiguration(textFileModel.isReadonly()));
                if (control.handleInitialized) {
                    control.handleInitialized();
                }
            }
            catch (error) {
                await this.handleSetInputError(error, input, options);
            }
            (0, performance_1.mark)('code/didSetInputToTextFileEditor');
        }
        async handleSetInputError(error, input, options) {
            // Handle case where content appears to be binary
            if (error.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */) {
                return this.openAsBinary(input, options);
            }
            // Handle case where we were asked to open a folder
            if (error.fileOperationResult === 0 /* FileOperationResult.FILE_IS_DIRECTORY */) {
                const actions = [];
                actions.push((0, actions_1.toAction)({
                    id: 'workbench.files.action.openFolder', label: (0, nls_1.localize)('openFolder', "Open Folder"), run: async () => {
                        return this.hostService.openWindow([{ folderUri: input.resource }], { forceNewWindow: true });
                    }
                }));
                if (this.contextService.isInsideWorkspace(input.preferredResource)) {
                    actions.push((0, actions_1.toAction)({
                        id: 'workbench.files.action.reveal', label: (0, nls_1.localize)('reveal', "Reveal Folder"), run: async () => {
                            await this.paneCompositeService.openPaneComposite(files_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
                            return this.explorerService.select(input.preferredResource, true);
                        }
                    }));
                }
                throw (0, editor_1.createEditorOpenError)((0, nls_1.localize)('fileIsDirectory', "The file is not displayed in the text editor because it is a directory."), actions, { forceMessage: true });
            }
            // Handle case where a file is too large to open without confirmation
            if (error.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                let message;
                if (error instanceof files_2.TooLargeFileOperationError) {
                    message = (0, nls_1.localize)('fileTooLargeForHeapErrorWithSize', "The file is not displayed in the text editor because it is very large ({0}).", files_2.ByteSize.formatSize(error.size));
                }
                else {
                    message = (0, nls_1.localize)('fileTooLargeForHeapErrorWithoutSize', "The file is not displayed in the text editor because it is very large.");
                }
                throw (0, editor_1.createTooLargeFileError)(this.group, input, options, message, this.preferencesService);
            }
            // Offer to create a file from the error if we have a file not found and the name is valid and not readonly
            if (error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */ &&
                !this.filesConfigurationService.isReadonly(input.preferredResource) &&
                await this.pathService.hasValidBasename(input.preferredResource)) {
                const fileNotFoundError = (0, editor_1.createEditorOpenError)(new files_2.FileOperationError((0, nls_1.localize)('unavailableResourceErrorEditorText', "The editor could not be opened because the file was not found."), 1 /* FileOperationResult.FILE_NOT_FOUND */), [
                    (0, actions_1.toAction)({
                        id: 'workbench.files.action.createMissingFile', label: (0, nls_1.localize)('createFile', "Create File"), run: async () => {
                            await this.textFileService.create([{ resource: input.preferredResource }]);
                            return this.editorService.openEditor({
                                resource: input.preferredResource,
                                options: {
                                    pinned: true // new file gets pinned by default
                                }
                            });
                        }
                    })
                ], {
                    // Support the flow of directly pressing `Enter` on the dialog to
                    // create the file on the go. This is nice when for example following
                    // a link to a file that does not exist to scaffold it quickly.
                    allowDialog: true
                });
                throw fileNotFoundError;
            }
            // Otherwise make sure the error bubbles up
            throw error;
        }
        openAsBinary(input, options) {
            const defaultBinaryEditor = this.configurationService.getValue('workbench.editor.defaultBinaryEditor');
            const editorOptions = {
                ...options,
                // Make sure to not steal away the currently active group
                // because we are triggering another openEditor() call
                // and do not control the initial intent that resulted
                // in us now opening as binary.
                activation: editor_2.EditorActivation.PRESERVE
            };
            // Check configuration and determine whether we open the binary
            // file input in a different editor or going through the same
            // editor.
            // Going through the same editor is debt, and a better solution
            // would be to introduce a real editor for the binary case
            // and avoid enforcing binary or text on the file editor input.
            if (defaultBinaryEditor && defaultBinaryEditor !== '' && defaultBinaryEditor !== editor_1.DEFAULT_EDITOR_ASSOCIATION.id) {
                this.doOpenAsBinaryInDifferentEditor(this.group, defaultBinaryEditor, input, editorOptions);
            }
            else {
                this.doOpenAsBinaryInSameEditor(this.group, defaultBinaryEditor, input, editorOptions);
            }
        }
        doOpenAsBinaryInDifferentEditor(group, editorId, editor, editorOptions) {
            this.editorService.replaceEditors([{
                    editor,
                    replacement: { resource: editor.resource, options: { ...editorOptions, override: editorId } }
                }], group);
        }
        doOpenAsBinaryInSameEditor(group, editorId, editor, editorOptions) {
            // Open binary as text
            if (editorId === editor_1.DEFAULT_EDITOR_ASSOCIATION.id) {
                editor.setForceOpenAsText();
                editor.setPreferredLanguageId(files_1.BINARY_TEXT_FILE_MODE); // https://github.com/microsoft/vscode/issues/131076
                editorOptions = { ...editorOptions, forceReload: true }; // Same pane and same input, must force reload to clear cached state
            }
            // Open as binary
            else {
                editor.setForceOpenAsBinary();
            }
            group.openEditor(editor, editorOptions);
        }
        clearInput() {
            super.clearInput();
            // Clear Model
            this.editorControl?.setModel(null);
        }
        createEditorControl(parent, initialOptions) {
            (0, performance_1.mark)('code/willCreateTextFileEditorControl');
            super.createEditorControl(parent, initialOptions);
            (0, performance_1.mark)('code/didCreateTextFileEditorControl');
        }
        tracksEditorViewState(input) {
            return input instanceof fileEditorInput_1.FileEditorInput;
        }
        tracksDisposedEditorViewState() {
            return true; // track view state even for disposed editors
        }
    };
    exports.TextFileEditor = TextFileEditor;
    exports.TextFileEditor = TextFileEditor = TextFileEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, files_2.IFileService),
        __param(3, panecomposite_1.IPaneCompositePartService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, storage_1.IStorageService),
        __param(7, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(8, editorService_1.IEditorService),
        __param(9, themeService_1.IThemeService),
        __param(10, editorGroupsService_1.IEditorGroupsService),
        __param(11, textfiles_1.ITextFileService),
        __param(12, files_3.IExplorerService),
        __param(13, uriIdentity_1.IUriIdentityService),
        __param(14, pathService_1.IPathService),
        __param(15, configuration_1.IConfigurationService),
        __param(16, preferences_1.IPreferencesService),
        __param(17, host_1.IHostService),
        __param(18, filesConfigurationService_1.IFilesConfigurationService)
    ], TextFileEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL2VkaXRvcnMvdGV4dEZpbGVFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFDaEc7O09BRUc7SUFDSSxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsdUNBQTRDOztpQkFFL0QsT0FBRSxHQUFHLDJCQUFtQixBQUF0QixDQUF1QjtRQUV6QyxZQUNDLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQ3hDLFdBQXlCLEVBQ0ssb0JBQStDLEVBQ3BFLG9CQUEyQyxFQUN2QixjQUF3QyxFQUNsRSxjQUErQixFQUNiLGdDQUFtRSxFQUN0RixhQUE2QixFQUM5QixZQUEyQixFQUNwQixrQkFBd0MsRUFDM0IsZUFBaUMsRUFDakMsZUFBaUMsRUFDOUIsa0JBQXVDLEVBQzlDLFdBQXlCLEVBQ2hCLG9CQUEyQyxFQUMzQyxrQkFBdUMsRUFDaEQsV0FBeUIsRUFDWCx5QkFBcUQ7WUFFbEcsS0FBSyxDQUFDLGdCQUFjLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxjQUFjLEVBQUUsZ0NBQWdDLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLENBQUMsQ0FBQztZQWpCNUkseUJBQW9CLEdBQXBCLG9CQUFvQixDQUEyQjtZQUVoRCxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFNaEQsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ2pDLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUM5Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzlDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2hCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUNoRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNYLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBNEI7WUFJbEcscUNBQXFDO1lBQ3JDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFakYsa0NBQWtDO1lBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUVPLGdCQUFnQixDQUFDLENBQW1CO1lBQzNDLEtBQUssTUFBTSxRQUFRLElBQUksQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxDQUFxQjtZQUM5QyxJQUFJLENBQUMsQ0FBQyxTQUFTLCtCQUF1QixJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pGLENBQUM7UUFDRixDQUFDO1FBRVEsUUFBUTtZQUNoQixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzdCLENBQUM7WUFFRCxPQUFPLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELElBQWEsS0FBSztZQUNqQixPQUFPLElBQUksQ0FBQyxNQUF5QixDQUFDO1FBQ3ZDLENBQUM7UUFFUSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQXNCLEVBQUUsT0FBNEMsRUFBRSxPQUEyQixFQUFFLEtBQXdCO1lBQ2xKLElBQUEsa0JBQUksRUFBQyxtQ0FBbUMsQ0FBQyxDQUFDO1lBRTFDLHdCQUF3QjtZQUN4QixNQUFNLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckQsSUFBSSxDQUFDO2dCQUNKLE1BQU0sYUFBYSxHQUFHLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFbkQseUJBQXlCO2dCQUN6QixJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUNuQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQscUVBQXFFO2dCQUNyRSxtRUFBbUU7Z0JBQ25FLG9FQUFvRTtnQkFDcEUsdUVBQXVFO2dCQUN2RSxnQ0FBZ0M7Z0JBRWhDLElBQUksYUFBYSxZQUFZLHFDQUFpQixFQUFFLENBQUM7b0JBQ2hELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzFDLENBQUM7Z0JBRUQsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDO2dCQUVwQyxTQUFTO2dCQUNULE1BQU0sT0FBTyxHQUFHLElBQUEsdUJBQWUsRUFBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3BELE9BQU8sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUVoRCxrREFBa0Q7Z0JBQ2xELElBQUksQ0FBQyxJQUFBLDhCQUFxQixFQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUNoRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUNqRSxJQUFJLGVBQWUsRUFBRSxDQUFDO3dCQUNyQixJQUFJLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQzs0QkFDeEIsZUFBZSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUMsQ0FBQywyQ0FBMkM7d0JBQzlFLENBQUM7d0JBRUQsT0FBTyxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUMzQyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsaUNBQWlDO2dCQUNqQyxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNiLElBQUEsc0NBQXNCLEVBQUMsT0FBTyxFQUFFLE9BQU8sK0JBQXVCLENBQUM7Z0JBQ2hFLENBQUM7Z0JBRUQscUVBQXFFO2dCQUNyRSxzRUFBc0U7Z0JBQ3RFLHFFQUFxRTtnQkFDckUsb0VBQW9FO2dCQUNwRSwrQ0FBK0M7Z0JBQy9DLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRWpGLElBQUksT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQy9CLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM3QixDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdkQsQ0FBQztZQUVELElBQUEsa0JBQUksRUFBQyxrQ0FBa0MsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFUyxLQUFLLENBQUMsbUJBQW1CLENBQUMsS0FBWSxFQUFFLEtBQXNCLEVBQUUsT0FBdUM7WUFFaEgsaURBQWlEO1lBQ2pELElBQTZCLEtBQU0sQ0FBQyx1QkFBdUIsbURBQTJDLEVBQUUsQ0FBQztnQkFDeEcsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBRUQsbURBQW1EO1lBQ25ELElBQXlCLEtBQU0sQ0FBQyxtQkFBbUIsa0RBQTBDLEVBQUUsQ0FBQztnQkFDL0YsTUFBTSxPQUFPLEdBQWMsRUFBRSxDQUFDO2dCQUU5QixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUEsa0JBQVEsRUFBQztvQkFDckIsRUFBRSxFQUFFLG1DQUFtQyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssSUFBSSxFQUFFO3dCQUN0RyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFDL0YsQ0FBQztpQkFDRCxDQUFDLENBQUMsQ0FBQztnQkFFSixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQztvQkFDcEUsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFBLGtCQUFRLEVBQUM7d0JBQ3JCLEVBQUUsRUFBRSwrQkFBK0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLElBQUksRUFBRTs0QkFDaEcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCLENBQUMsa0JBQVUseUNBQWlDLElBQUksQ0FBQyxDQUFDOzRCQUVuRyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDbkUsQ0FBQztxQkFDRCxDQUFDLENBQUMsQ0FBQztnQkFDTCxDQUFDO2dCQUVELE1BQU0sSUFBQSw4QkFBcUIsRUFBQyxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSx5RUFBeUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3RLLENBQUM7WUFFRCxxRUFBcUU7WUFDckUsSUFBeUIsS0FBTSxDQUFDLG1CQUFtQiwrQ0FBdUMsRUFBRSxDQUFDO2dCQUM1RixJQUFJLE9BQWUsQ0FBQztnQkFDcEIsSUFBSSxLQUFLLFlBQVksa0NBQTBCLEVBQUUsQ0FBQztvQkFDakQsT0FBTyxHQUFHLElBQUEsY0FBUSxFQUFDLGtDQUFrQyxFQUFFLDhFQUE4RSxFQUFFLGdCQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN6SyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxHQUFHLElBQUEsY0FBUSxFQUFDLHFDQUFxQyxFQUFFLHdFQUF3RSxDQUFDLENBQUM7Z0JBQ3JJLENBQUM7Z0JBRUQsTUFBTSxJQUFBLGdDQUF1QixFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDN0YsQ0FBQztZQUVELDJHQUEyRztZQUMzRyxJQUNzQixLQUFNLENBQUMsbUJBQW1CLCtDQUF1QztnQkFDdEYsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztnQkFDbkUsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxFQUMvRCxDQUFDO2dCQUNGLE1BQU0saUJBQWlCLEdBQUcsSUFBQSw4QkFBcUIsRUFBQyxJQUFJLDBCQUFrQixDQUFDLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLGdFQUFnRSxDQUFDLDZDQUFxQyxFQUFFO29CQUM3TixJQUFBLGtCQUFRLEVBQUM7d0JBQ1IsRUFBRSxFQUFFLDBDQUEwQyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssSUFBSSxFQUFFOzRCQUM3RyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUUzRSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDO2dDQUNwQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGlCQUFpQjtnQ0FDakMsT0FBTyxFQUFFO29DQUNSLE1BQU0sRUFBRSxJQUFJLENBQUMsa0NBQWtDO2lDQUMvQzs2QkFDRCxDQUFDLENBQUM7d0JBQ0osQ0FBQztxQkFDRCxDQUFDO2lCQUNGLEVBQUU7b0JBRUYsaUVBQWlFO29CQUNqRSxxRUFBcUU7b0JBQ3JFLCtEQUErRDtvQkFFL0QsV0FBVyxFQUFFLElBQUk7aUJBQ2pCLENBQUMsQ0FBQztnQkFFSCxNQUFNLGlCQUFpQixDQUFDO1lBQ3pCLENBQUM7WUFFRCwyQ0FBMkM7WUFDM0MsTUFBTSxLQUFLLENBQUM7UUFDYixDQUFDO1FBRU8sWUFBWSxDQUFDLEtBQXNCLEVBQUUsT0FBdUM7WUFDbkYsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFxQixzQ0FBc0MsQ0FBQyxDQUFDO1lBRTNILE1BQU0sYUFBYSxHQUFHO2dCQUNyQixHQUFHLE9BQU87Z0JBQ1YseURBQXlEO2dCQUN6RCxzREFBc0Q7Z0JBQ3RELHNEQUFzRDtnQkFDdEQsK0JBQStCO2dCQUMvQixVQUFVLEVBQUUseUJBQWdCLENBQUMsUUFBUTthQUNyQyxDQUFDO1lBRUYsK0RBQStEO1lBQy9ELDZEQUE2RDtZQUM3RCxVQUFVO1lBQ1YsK0RBQStEO1lBQy9ELDBEQUEwRDtZQUMxRCwrREFBK0Q7WUFFL0QsSUFBSSxtQkFBbUIsSUFBSSxtQkFBbUIsS0FBSyxFQUFFLElBQUksbUJBQW1CLEtBQUssbUNBQTBCLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2hILElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQztZQUM3RixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3hGLENBQUM7UUFDRixDQUFDO1FBRU8sK0JBQStCLENBQUMsS0FBbUIsRUFBRSxRQUE0QixFQUFFLE1BQXVCLEVBQUUsYUFBaUM7WUFDcEosSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDbEMsTUFBTTtvQkFDTixXQUFXLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRSxHQUFHLGFBQWEsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEVBQUU7aUJBQzdGLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNaLENBQUM7UUFFTywwQkFBMEIsQ0FBQyxLQUFtQixFQUFFLFFBQTRCLEVBQUUsTUFBdUIsRUFBRSxhQUFpQztZQUUvSSxzQkFBc0I7WUFDdEIsSUFBSSxRQUFRLEtBQUssbUNBQTBCLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUM1QixNQUFNLENBQUMsc0JBQXNCLENBQUMsNkJBQXFCLENBQUMsQ0FBQyxDQUFDLG9EQUFvRDtnQkFFMUcsYUFBYSxHQUFHLEVBQUUsR0FBRyxhQUFhLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsb0VBQW9FO1lBQzlILENBQUM7WUFFRCxpQkFBaUI7aUJBQ1osQ0FBQztnQkFDTCxNQUFNLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUMvQixDQUFDO1lBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVRLFVBQVU7WUFDbEIsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRW5CLGNBQWM7WUFDZCxJQUFJLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRWtCLG1CQUFtQixDQUFDLE1BQW1CLEVBQUUsY0FBa0M7WUFDN0YsSUFBQSxrQkFBSSxFQUFDLHNDQUFzQyxDQUFDLENBQUM7WUFFN0MsS0FBSyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQztZQUVsRCxJQUFBLGtCQUFJLEVBQUMscUNBQXFDLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRWtCLHFCQUFxQixDQUFDLEtBQWtCO1lBQzFELE9BQU8sS0FBSyxZQUFZLGlDQUFlLENBQUM7UUFDekMsQ0FBQztRQUVrQiw2QkFBNkI7WUFDL0MsT0FBTyxJQUFJLENBQUMsQ0FBQyw2Q0FBNkM7UUFDM0QsQ0FBQzs7SUE5UVcsd0NBQWM7NkJBQWQsY0FBYztRQU14QixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEseUNBQXlCLENBQUE7UUFDekIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLG9DQUF3QixDQUFBO1FBQ3hCLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEsNkRBQWlDLENBQUE7UUFDakMsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsWUFBQSwwQ0FBb0IsQ0FBQTtRQUNwQixZQUFBLDRCQUFnQixDQUFBO1FBQ2hCLFlBQUEsd0JBQWdCLENBQUE7UUFDaEIsWUFBQSxpQ0FBbUIsQ0FBQTtRQUNuQixZQUFBLDBCQUFZLENBQUE7UUFDWixZQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFlBQUEsaUNBQW1CLENBQUE7UUFDbkIsWUFBQSxtQkFBWSxDQUFBO1FBQ1osWUFBQSxzREFBMEIsQ0FBQTtPQXZCaEIsY0FBYyxDQStRMUIifQ==