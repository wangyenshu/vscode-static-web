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
define(["require", "exports", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/editor", "vs/base/common/event", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/textmodelResolver/common/textModelResolverService", "vs/editor/common/services/resolverService", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/platform/workspace/common/workspace", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/instantiation/common/serviceCollection", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/editor/common/services/languageService", "vs/editor/common/services/modelService", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/languages/language", "vs/workbench/services/history/common/history", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/workspace/test/common/testWorkspace", "vs/platform/environment/common/environment", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/editor/common/services/textResourceConfiguration", "vs/editor/common/core/position", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/editor/common/core/range", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/services/extensions/common/extensions", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/decorations/common/decorations", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/services/codeEditorService", "vs/workbench/browser/editor", "vs/platform/log/common/log", "vs/platform/label/common/label", "vs/base/common/async", "vs/platform/storage/common/storage", "vs/base/common/platform", "vs/workbench/services/label/common/labelService", "vs/base/common/buffer", "vs/base/common/network", "vs/platform/product/common/productService", "vs/platform/product/common/product", "vs/workbench/services/host/browser/host", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/accessibility/common/accessibility", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/textfile/browser/browserTextFileService", "vs/workbench/services/environment/common/environmentService", "vs/editor/common/model/textModel", "vs/workbench/services/path/common/pathService", "vs/platform/progress/common/progress", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/editor/editorPane", "vs/base/common/cancellation", "vs/platform/instantiation/common/descriptors", "vs/platform/dialogs/test/common/testDialogService", "vs/workbench/services/editor/browser/codeEditorService", "vs/workbench/browser/parts/editor/editorPart", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/quickinput/browser/quickInputService", "vs/platform/list/browser/listService", "vs/base/common/path", "vs/workbench/test/common/workbenchTestServices", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/common/stream", "vs/workbench/services/textfile/browser/textFileService", "vs/workbench/services/textfile/common/encoding", "vs/platform/theme/common/theme", "vs/base/common/iterator", "vs/workbench/services/workingCopy/common/workingCopyBackupService", "vs/workbench/services/workingCopy/browser/workingCopyBackupService", "vs/platform/files/common/fileService", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/editor/test/browser/testCodeEditor", "vs/workbench/contrib/files/browser/editors/textFileEditor", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/platform/workspaces/common/workspaces", "vs/platform/workspace/common/workspaceTrust", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/types", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/editor/browser/editorResolverService", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/files/browser/elevatedFileService", "vs/editor/common/services/editorWorker", "vs/base/common/map", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/textfile/common/textEditorService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/base/common/process", "vs/base/common/extpath", "vs/platform/accessibility/test/common/testAccessibilityService", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeaturesService", "vs/workbench/browser/parts/editor/textEditor", "vs/editor/common/core/selection", "vs/editor/test/common/services/testEditorWorkerService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/userDataProfileService", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/codicons", "vs/platform/remote/common/remoteSocketFactoryService", "vs/workbench/browser/parts/editor/editorParts", "vs/base/browser/window", "vs/platform/markers/common/markers", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/services/editor/common/editorPaneService", "vs/workbench/services/editor/browser/editorPaneService", "vs/platform/contextview/browser/contextView", "vs/platform/contextview/browser/contextViewService", "vs/workbench/services/editor/common/customEditorLabelService", "vs/workbench/contrib/terminal/browser/terminalConfigurationService", "vs/platform/terminal/common/terminalLogService", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/common/environmentVariableService", "vs/platform/contextview/browser/contextMenuService"], function (require, exports, fileEditorInput_1, instantiationServiceMock_1, resources_1, uri_1, telemetry_1, telemetryUtils_1, editorInput_1, editor_1, editor_2, event_1, workingCopyBackup_1, configuration_1, layoutService_1, textModelResolverService_1, resolverService_1, untitledTextEditorService_1, workspace_1, lifecycle_1, serviceCollection_1, files_1, model_1, languageService_1, modelService_1, textfiles_1, language_1, history_1, instantiation_1, testConfigurationService_1, testWorkspace_1, environment_1, themeService_1, testThemeService_1, textResourceConfiguration_1, position_1, actions_1, contextkey_1, mockKeybindingService_1, range_1, dialogs_1, notification_1, testNotificationService_1, extensions_1, keybinding_1, decorations_1, lifecycle_2, editorGroupsService_1, editorService_1, codeEditorService_1, editor_3, log_1, label_1, async_1, storage_1, platform_1, labelService_1, buffer_1, network_1, productService_1, product_1, host_1, workingCopyService_1, filesConfigurationService_1, accessibility_1, environmentService_1, browserTextFileService_1, environmentService_2, textModel_1, pathService_1, progress_1, workingCopyFileService_1, undoRedoService_1, undoRedo_1, textFileEditorModel_1, platform_2, editorPane_1, cancellation_1, descriptors_1, testDialogService_1, codeEditorService_2, editorPart_1, quickInput_1, quickInputService_1, listService_1, path_1, workbenchTestServices_1, uriIdentity_1, uriIdentityService_1, inMemoryFilesystemProvider_1, stream_1, textFileService_1, encoding_1, theme_1, iterator_1, workingCopyBackupService_1, workingCopyBackupService_2, fileService_1, textResourceEditor_1, testCodeEditor_1, textFileEditor_1, textResourceEditorInput_1, untitledTextEditorInput_1, sideBySideEditor_1, workspaces_1, workspaceTrust_1, terminal_1, terminal_2, types_1, terminal_3, editorResolverService_1, files_2, editorResolverService_2, workingCopyEditorService_1, elevatedFileService_1, elevatedFileService_2, editorWorker_1, map_1, sideBySideEditorInput_1, textEditorService_1, panecomposite_1, languageConfigurationRegistry_1, testLanguageConfigurationService_1, process_1, extpath_1, testAccessibilityService_1, languageFeatureDebounce_1, languageFeatures_1, languageFeaturesService_1, textEditor_1, selection_1, testEditorWorkerService_1, remoteAgentService_1, languageDetectionWorkerService_1, userDataProfile_1, userDataProfileService_1, userDataProfile_2, codicons_1, remoteSocketFactoryService_1, editorParts_1, window_1, markers_1, accessibilitySignalService_1, editorPaneService_1, editorPaneService_2, contextView_1, contextViewService_1, customEditorLabelService_1, terminalConfigurationService_1, terminalLogService_1, environmentVariable_1, environmentVariableService_1, contextMenuService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestWebExtensionsScannerService = exports.TestUserDataProfileService = exports.TestWorkbenchExtensionManagementService = exports.TestWorkbenchExtensionEnablementService = exports.TestRemoteExtensionsScannerService = exports.TestRemoteAgentService = exports.TestQuickInputService = exports.TestTerminalProfileResolverService = exports.TestTerminalProfileService = exports.TestTerminalGroupService = exports.TestTerminalEditorService = exports.TestTerminalInstanceService = exports.TestWorkspacesService = exports.TestPathService = exports.TestListService = exports.TestEditorPart = exports.TestSingletonFileEditorInput = exports.TestFileEditorInput = exports.TestEditorInput = exports.TestReadonlyTextFileEditorModel = exports.TestFilesConfigurationService = exports.TestHostService = exports.productService = exports.TestInMemoryFileSystemProvider = exports.RemoteFileSystemProvider = exports.TestTextResourceConfigurationService = exports.TestWillShutdownEvent = exports.TestBeforeShutdownEvent = exports.TestLifecycleService = exports.InMemoryTestWorkingCopyBackupService = exports.TestWorkingCopyBackupService = exports.TestFileService = exports.TestEditorService = exports.TestEditorGroupAccessor = exports.TestEditorGroupView = exports.TestEditorGroupsService = exports.TestViewsService = exports.TestPanelPart = exports.TestSideBarPart = exports.TestPaneCompositeService = exports.TestLayoutService = exports.TestFileDialogService = exports.TestMenuService = exports.TestDecorationsService = exports.TestProgressService = exports.TestEnvironmentService = exports.TestEncodingOracle = exports.TestBrowserTextFileServiceWithEncodingOverrides = exports.TestTextFileService = exports.TestServiceAccessor = exports.TestWorkingCopyService = exports.TestTextFileEditor = exports.TestTextResourceEditor = void 0;
    exports.createFileEditorInput = createFileEditorInput;
    exports.workbenchInstantiationService = workbenchInstantiationService;
    exports.toUntypedWorkingCopyId = toUntypedWorkingCopyId;
    exports.toTypedWorkingCopyId = toTypedWorkingCopyId;
    exports.registerTestEditor = registerTestEditor;
    exports.registerTestFileEditor = registerTestFileEditor;
    exports.registerTestResourceEditor = registerTestResourceEditor;
    exports.registerTestSideBySideEditor = registerTestSideBySideEditor;
    exports.createEditorPart = createEditorPart;
    exports.getLastResolvedFileStat = getLastResolvedFileStat;
    exports.workbenchTeardown = workbenchTeardown;
    function createFileEditorInput(instantiationService, resource) {
        return instantiationService.createInstance(fileEditorInput_1.FileEditorInput, resource, undefined, undefined, undefined, undefined, undefined, undefined);
    }
    platform_2.Registry.as(editor_1.EditorExtensions.EditorFactory).registerFileEditorFactory({
        typeId: files_2.FILE_EDITOR_INPUT_ID,
        createFileEditor: (resource, preferredResource, preferredName, preferredDescription, preferredEncoding, preferredLanguageId, preferredContents, instantiationService) => {
            return instantiationService.createInstance(fileEditorInput_1.FileEditorInput, resource, preferredResource, preferredName, preferredDescription, preferredEncoding, preferredLanguageId, preferredContents);
        },
        isFileEditor: (obj) => {
            return obj instanceof fileEditorInput_1.FileEditorInput;
        }
    });
    class TestTextResourceEditor extends textResourceEditor_1.TextResourceEditor {
        createEditorControl(parent, configuration) {
            this.editorControl = this._register(this.instantiationService.createInstance(testCodeEditor_1.TestCodeEditor, parent, configuration, {}));
        }
    }
    exports.TestTextResourceEditor = TestTextResourceEditor;
    class TestTextFileEditor extends textFileEditor_1.TextFileEditor {
        createEditorControl(parent, configuration) {
            this.editorControl = this._register(this.instantiationService.createInstance(testCodeEditor_1.TestCodeEditor, parent, configuration, { contributions: [] }));
        }
        setSelection(selection, reason) {
            this._options = selection ? { selection } : undefined;
            this._onDidChangeSelection.fire({ reason });
        }
        getSelection() {
            const options = this.options;
            if (!options) {
                return undefined;
            }
            const textSelection = options.selection;
            if (!textSelection) {
                return undefined;
            }
            return new textEditor_1.TextEditorPaneSelection(new selection_1.Selection(textSelection.startLineNumber, textSelection.startColumn, textSelection.endLineNumber ?? textSelection.startLineNumber, textSelection.endColumn ?? textSelection.startColumn));
        }
    }
    exports.TestTextFileEditor = TestTextFileEditor;
    class TestWorkingCopyService extends workingCopyService_1.WorkingCopyService {
        testUnregisterWorkingCopy(workingCopy) {
            return super.unregisterWorkingCopy(workingCopy);
        }
    }
    exports.TestWorkingCopyService = TestWorkingCopyService;
    function workbenchInstantiationService(overrides, disposables = new lifecycle_2.DisposableStore()) {
        const instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService(new serviceCollection_1.ServiceCollection([lifecycle_1.ILifecycleService, disposables.add(new TestLifecycleService())])));
        instantiationService.stub(productService_1.IProductService, workbenchTestServices_1.TestProductService);
        instantiationService.stub(editorWorker_1.IEditorWorkerService, new testEditorWorkerService_1.TestEditorWorkerService());
        instantiationService.stub(workingCopyService_1.IWorkingCopyService, disposables.add(new TestWorkingCopyService()));
        const environmentService = overrides?.environmentService ? overrides.environmentService(instantiationService) : exports.TestEnvironmentService;
        instantiationService.stub(environment_1.IEnvironmentService, environmentService);
        instantiationService.stub(environmentService_2.IWorkbenchEnvironmentService, environmentService);
        instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
        const contextKeyService = overrides?.contextKeyService ? overrides.contextKeyService(instantiationService) : instantiationService.createInstance(mockKeybindingService_1.MockContextKeyService);
        instantiationService.stub(contextkey_1.IContextKeyService, contextKeyService);
        instantiationService.stub(progress_1.IProgressService, new TestProgressService());
        const workspaceContextService = new workbenchTestServices_1.TestContextService(testWorkspace_1.TestWorkspace);
        instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceContextService);
        const configService = overrides?.configurationService ? overrides.configurationService(instantiationService) : new testConfigurationService_1.TestConfigurationService({
            files: {
                participants: {
                    timeout: 60000
                }
            }
        });
        instantiationService.stub(configuration_1.IConfigurationService, configService);
        const textResourceConfigurationService = new TestTextResourceConfigurationService(configService);
        instantiationService.stub(textResourceConfiguration_1.ITextResourceConfigurationService, textResourceConfigurationService);
        instantiationService.stub(untitledTextEditorService_1.IUntitledTextEditorService, disposables.add(instantiationService.createInstance(untitledTextEditorService_1.UntitledTextEditorService)));
        instantiationService.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_1.TestStorageService()));
        instantiationService.stub(remoteAgentService_1.IRemoteAgentService, new TestRemoteAgentService());
        instantiationService.stub(languageDetectionWorkerService_1.ILanguageDetectionService, new TestLanguageDetectionService());
        instantiationService.stub(pathService_1.IPathService, overrides?.pathService ? overrides.pathService(instantiationService) : new TestPathService());
        const layoutService = new TestLayoutService();
        instantiationService.stub(layoutService_1.IWorkbenchLayoutService, layoutService);
        instantiationService.stub(dialogs_1.IDialogService, new testDialogService_1.TestDialogService());
        const accessibilityService = new testAccessibilityService_1.TestAccessibilityService();
        instantiationService.stub(accessibility_1.IAccessibilityService, accessibilityService);
        instantiationService.stub(accessibilitySignalService_1.IAccessibilitySignalService, {
            playSignal: async () => { },
            isSoundEnabled(signal) { return false; },
        });
        instantiationService.stub(dialogs_1.IFileDialogService, instantiationService.createInstance(TestFileDialogService));
        instantiationService.stub(language_1.ILanguageService, disposables.add(instantiationService.createInstance(languageService_1.LanguageService)));
        instantiationService.stub(languageFeatures_1.ILanguageFeaturesService, new languageFeaturesService_1.LanguageFeaturesService());
        instantiationService.stub(languageFeatureDebounce_1.ILanguageFeatureDebounceService, instantiationService.createInstance(languageFeatureDebounce_1.LanguageFeatureDebounceService));
        instantiationService.stub(history_1.IHistoryService, new workbenchTestServices_1.TestHistoryService());
        instantiationService.stub(textResourceConfiguration_1.ITextResourcePropertiesService, new workbenchTestServices_1.TestTextResourcePropertiesService(configService));
        instantiationService.stub(undoRedo_1.IUndoRedoService, instantiationService.createInstance(undoRedoService_1.UndoRedoService));
        const themeService = new testThemeService_1.TestThemeService();
        instantiationService.stub(themeService_1.IThemeService, themeService);
        instantiationService.stub(languageConfigurationRegistry_1.ILanguageConfigurationService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
        instantiationService.stub(model_1.IModelService, disposables.add(instantiationService.createInstance(modelService_1.ModelService)));
        const fileService = overrides?.fileService ? overrides.fileService(instantiationService) : disposables.add(new TestFileService());
        instantiationService.stub(files_1.IFileService, fileService);
        instantiationService.stub(uriIdentity_1.IUriIdentityService, disposables.add(new uriIdentityService_1.UriIdentityService(fileService)));
        const markerService = new workbenchTestServices_1.TestMarkerService();
        instantiationService.stub(markers_1.IMarkerService, markerService);
        instantiationService.stub(filesConfigurationService_1.IFilesConfigurationService, disposables.add(instantiationService.createInstance(TestFilesConfigurationService)));
        const userDataProfilesService = instantiationService.stub(userDataProfile_1.IUserDataProfilesService, disposables.add(instantiationService.createInstance(userDataProfile_1.UserDataProfilesService)));
        instantiationService.stub(userDataProfile_2.IUserDataProfileService, disposables.add(new userDataProfileService_1.UserDataProfileService(userDataProfilesService.defaultProfile)));
        instantiationService.stub(workingCopyBackup_1.IWorkingCopyBackupService, overrides?.workingCopyBackupService ? overrides?.workingCopyBackupService(instantiationService) : disposables.add(new TestWorkingCopyBackupService()));
        instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
        instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
        instantiationService.stub(untitledTextEditorService_1.IUntitledTextEditorService, disposables.add(instantiationService.createInstance(untitledTextEditorService_1.UntitledTextEditorService)));
        instantiationService.stub(actions_1.IMenuService, new TestMenuService());
        const keybindingService = new mockKeybindingService_1.MockKeybindingService();
        instantiationService.stub(keybinding_1.IKeybindingService, keybindingService);
        instantiationService.stub(decorations_1.IDecorationsService, new TestDecorationsService());
        instantiationService.stub(extensions_1.IExtensionService, new workbenchTestServices_1.TestExtensionService());
        instantiationService.stub(workingCopyFileService_1.IWorkingCopyFileService, disposables.add(instantiationService.createInstance(workingCopyFileService_1.WorkingCopyFileService)));
        instantiationService.stub(textfiles_1.ITextFileService, overrides?.textFileService ? overrides.textFileService(instantiationService) : disposables.add(instantiationService.createInstance(TestTextFileService)));
        instantiationService.stub(host_1.IHostService, instantiationService.createInstance(TestHostService));
        instantiationService.stub(resolverService_1.ITextModelService, disposables.add(instantiationService.createInstance(textModelResolverService_1.TextModelResolverService)));
        instantiationService.stub(log_1.ILoggerService, disposables.add(new workbenchTestServices_1.TestLoggerService(exports.TestEnvironmentService.logsHome)));
        const editorGroupService = new TestEditorGroupsService([new TestEditorGroupView(0)]);
        instantiationService.stub(editorGroupsService_1.IEditorGroupsService, editorGroupService);
        instantiationService.stub(label_1.ILabelService, disposables.add(instantiationService.createInstance(labelService_1.LabelService)));
        const editorService = overrides?.editorService ? overrides.editorService(instantiationService) : disposables.add(new TestEditorService(editorGroupService));
        instantiationService.stub(editorService_1.IEditorService, editorService);
        instantiationService.stub(editorPaneService_1.IEditorPaneService, new editorPaneService_2.EditorPaneService());
        instantiationService.stub(workingCopyEditorService_1.IWorkingCopyEditorService, disposables.add(instantiationService.createInstance(workingCopyEditorService_1.WorkingCopyEditorService)));
        instantiationService.stub(editorResolverService_2.IEditorResolverService, disposables.add(instantiationService.createInstance(editorResolverService_1.EditorResolverService)));
        const textEditorService = overrides?.textEditorService ? overrides.textEditorService(instantiationService) : disposables.add(instantiationService.createInstance(textEditorService_1.TextEditorService));
        instantiationService.stub(textEditorService_1.ITextEditorService, textEditorService);
        instantiationService.stub(codeEditorService_1.ICodeEditorService, disposables.add(new codeEditorService_2.CodeEditorService(editorService, themeService, configService)));
        instantiationService.stub(panecomposite_1.IPaneCompositePartService, disposables.add(new TestPaneCompositeService()));
        instantiationService.stub(listService_1.IListService, new TestListService());
        instantiationService.stub(contextView_1.IContextViewService, disposables.add(instantiationService.createInstance(contextViewService_1.ContextViewService)));
        instantiationService.stub(contextView_1.IContextMenuService, disposables.add(instantiationService.createInstance(contextMenuService_1.ContextMenuService)));
        instantiationService.stub(quickInput_1.IQuickInputService, disposables.add(new quickInputService_1.QuickInputService(configService, instantiationService, keybindingService, contextKeyService, themeService, layoutService)));
        instantiationService.stub(workspaces_1.IWorkspacesService, new TestWorkspacesService());
        instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, disposables.add(new workbenchTestServices_1.TestWorkspaceTrustManagementService()));
        instantiationService.stub(workspaceTrust_1.IWorkspaceTrustRequestService, disposables.add(new workbenchTestServices_1.TestWorkspaceTrustRequestService(false)));
        instantiationService.stub(terminal_2.ITerminalInstanceService, new TestTerminalInstanceService());
        instantiationService.stub(terminal_2.ITerminalEditorService, new TestTerminalEditorService());
        instantiationService.stub(terminal_2.ITerminalGroupService, new TestTerminalGroupService());
        instantiationService.stub(terminal_2.ITerminalInstanceService, new TestTerminalInstanceService());
        instantiationService.stub(terminal_3.ITerminalProfileService, new TestTerminalProfileService());
        instantiationService.stub(terminal_3.ITerminalProfileResolverService, new TestTerminalProfileResolverService());
        instantiationService.stub(terminal_2.ITerminalConfigurationService, disposables.add(instantiationService.createInstance(terminalConfigurationService_1.TerminalConfigurationService)));
        instantiationService.stub(terminal_1.ITerminalLogService, disposables.add(instantiationService.createInstance(terminalLogService_1.TerminalLogService)));
        instantiationService.stub(environmentVariable_1.IEnvironmentVariableService, disposables.add(instantiationService.createInstance(environmentVariableService_1.EnvironmentVariableService)));
        instantiationService.stub(elevatedFileService_1.IElevatedFileService, new elevatedFileService_2.BrowserElevatedFileService());
        instantiationService.stub(remoteSocketFactoryService_1.IRemoteSocketFactoryService, new remoteSocketFactoryService_1.RemoteSocketFactoryService());
        instantiationService.stub(customEditorLabelService_1.ICustomEditorLabelService, disposables.add(new customEditorLabelService_1.CustomEditorLabelService(configService, workspaceContextService)));
        return instantiationService;
    }
    let TestServiceAccessor = class TestServiceAccessor {
        constructor(lifecycleService, textFileService, textEditorService, workingCopyFileService, filesConfigurationService, contextService, modelService, fileService, fileDialogService, dialogService, workingCopyService, editorService, editorPaneService, environmentService, pathService, editorGroupService, editorResolverService, languageService, textModelResolverService, untitledTextEditorService, testConfigurationService, workingCopyBackupService, hostService, quickInputService, labelService, logService, uriIdentityService, instantitionService, notificationService, workingCopyEditorService, instantiationService, elevatedFileService, workspaceTrustRequestService, decorationsService) {
            this.lifecycleService = lifecycleService;
            this.textFileService = textFileService;
            this.textEditorService = textEditorService;
            this.workingCopyFileService = workingCopyFileService;
            this.filesConfigurationService = filesConfigurationService;
            this.contextService = contextService;
            this.modelService = modelService;
            this.fileService = fileService;
            this.fileDialogService = fileDialogService;
            this.dialogService = dialogService;
            this.workingCopyService = workingCopyService;
            this.editorService = editorService;
            this.editorPaneService = editorPaneService;
            this.environmentService = environmentService;
            this.pathService = pathService;
            this.editorGroupService = editorGroupService;
            this.editorResolverService = editorResolverService;
            this.languageService = languageService;
            this.textModelResolverService = textModelResolverService;
            this.untitledTextEditorService = untitledTextEditorService;
            this.testConfigurationService = testConfigurationService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.hostService = hostService;
            this.quickInputService = quickInputService;
            this.labelService = labelService;
            this.logService = logService;
            this.uriIdentityService = uriIdentityService;
            this.instantitionService = instantitionService;
            this.notificationService = notificationService;
            this.workingCopyEditorService = workingCopyEditorService;
            this.instantiationService = instantiationService;
            this.elevatedFileService = elevatedFileService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.decorationsService = decorationsService;
        }
    };
    exports.TestServiceAccessor = TestServiceAccessor;
    exports.TestServiceAccessor = TestServiceAccessor = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, textEditorService_1.ITextEditorService),
        __param(3, workingCopyFileService_1.IWorkingCopyFileService),
        __param(4, filesConfigurationService_1.IFilesConfigurationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, model_1.IModelService),
        __param(7, files_1.IFileService),
        __param(8, dialogs_1.IFileDialogService),
        __param(9, dialogs_1.IDialogService),
        __param(10, workingCopyService_1.IWorkingCopyService),
        __param(11, editorService_1.IEditorService),
        __param(12, editorPaneService_1.IEditorPaneService),
        __param(13, environmentService_2.IWorkbenchEnvironmentService),
        __param(14, pathService_1.IPathService),
        __param(15, editorGroupsService_1.IEditorGroupsService),
        __param(16, editorResolverService_2.IEditorResolverService),
        __param(17, language_1.ILanguageService),
        __param(18, resolverService_1.ITextModelService),
        __param(19, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(20, configuration_1.IConfigurationService),
        __param(21, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(22, host_1.IHostService),
        __param(23, quickInput_1.IQuickInputService),
        __param(24, label_1.ILabelService),
        __param(25, log_1.ILogService),
        __param(26, uriIdentity_1.IUriIdentityService),
        __param(27, instantiation_1.IInstantiationService),
        __param(28, notification_1.INotificationService),
        __param(29, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(30, instantiation_1.IInstantiationService),
        __param(31, elevatedFileService_1.IElevatedFileService),
        __param(32, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(33, decorations_1.IDecorationsService)
    ], TestServiceAccessor);
    let TestTextFileService = class TestTextFileService extends browserTextFileService_1.BrowserTextFileService {
        constructor(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, logService, elevatedFileService, decorationsService) {
            super(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, elevatedFileService, logService, decorationsService);
            this.readStreamError = undefined;
            this.writeError = undefined;
        }
        setReadStreamErrorOnce(error) {
            this.readStreamError = error;
        }
        async readStream(resource, options) {
            if (this.readStreamError) {
                const error = this.readStreamError;
                this.readStreamError = undefined;
                throw error;
            }
            const content = await this.fileService.readFileStream(resource, options);
            return {
                resource: content.resource,
                name: content.name,
                mtime: content.mtime,
                ctime: content.ctime,
                etag: content.etag,
                encoding: 'utf8',
                value: await (0, textModel_1.createTextBufferFactoryFromStream)(content.value),
                size: 10,
                readonly: false,
                locked: false
            };
        }
        setWriteErrorOnce(error) {
            this.writeError = error;
        }
        async write(resource, value, options) {
            if (this.writeError) {
                const error = this.writeError;
                this.writeError = undefined;
                throw error;
            }
            return super.write(resource, value, options);
        }
    };
    exports.TestTextFileService = TestTextFileService;
    exports.TestTextFileService = TestTextFileService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, model_1.IModelService),
        __param(5, environmentService_2.IWorkbenchEnvironmentService),
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
    ], TestTextFileService);
    class TestBrowserTextFileServiceWithEncodingOverrides extends browserTextFileService_1.BrowserTextFileService {
        get encoding() {
            if (!this._testEncoding) {
                this._testEncoding = this._register(this.instantiationService.createInstance(TestEncodingOracle));
            }
            return this._testEncoding;
        }
    }
    exports.TestBrowserTextFileServiceWithEncodingOverrides = TestBrowserTextFileServiceWithEncodingOverrides;
    class TestEncodingOracle extends textFileService_1.EncodingOracle {
        get encodingOverrides() {
            return [
                { extension: 'utf16le', encoding: encoding_1.UTF16le },
                { extension: 'utf16be', encoding: encoding_1.UTF16be },
                { extension: 'utf8bom', encoding: encoding_1.UTF8_with_bom }
            ];
        }
        set encodingOverrides(overrides) { }
    }
    exports.TestEncodingOracle = TestEncodingOracle;
    class TestEnvironmentServiceWithArgs extends environmentService_1.BrowserWorkbenchEnvironmentService {
        constructor() {
            super(...arguments);
            this.args = [];
        }
    }
    exports.TestEnvironmentService = new TestEnvironmentServiceWithArgs('', uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }), Object.create(null), workbenchTestServices_1.TestProductService);
    class TestProgressService {
        withProgress(options, task, onDidCancel) {
            return task(progress_1.Progress.None);
        }
    }
    exports.TestProgressService = TestProgressService;
    class TestDecorationsService {
        constructor() {
            this.onDidChangeDecorations = event_1.Event.None;
        }
        registerDecorationsProvider(_provider) { return lifecycle_2.Disposable.None; }
        getDecoration(_uri, _includeChildren, _overwrite) { return undefined; }
    }
    exports.TestDecorationsService = TestDecorationsService;
    class TestMenuService {
        createMenu(_id, _scopedKeybindingService) {
            return {
                onDidChange: event_1.Event.None,
                dispose: () => undefined,
                getActions: () => []
            };
        }
        resetHiddenStates() {
            // nothing
        }
    }
    exports.TestMenuService = TestMenuService;
    let TestFileDialogService = class TestFileDialogService {
        constructor(pathService) {
            this.pathService = pathService;
        }
        async defaultFilePath(_schemeFilter) { return this.pathService.userHome(); }
        async defaultFolderPath(_schemeFilter) { return this.pathService.userHome(); }
        async defaultWorkspacePath(_schemeFilter) { return this.pathService.userHome(); }
        async preferredHome(_schemeFilter) { return this.pathService.userHome(); }
        pickFileFolderAndOpen(_options) { return Promise.resolve(0); }
        pickFileAndOpen(_options) { return Promise.resolve(0); }
        pickFolderAndOpen(_options) { return Promise.resolve(0); }
        pickWorkspaceAndOpen(_options) { return Promise.resolve(0); }
        setPickFileToSave(path) { this.fileToSave = path; }
        pickFileToSave(defaultUri, availableFileSystems) { return Promise.resolve(this.fileToSave); }
        showSaveDialog(_options) { return Promise.resolve(undefined); }
        showOpenDialog(_options) { return Promise.resolve(undefined); }
        setConfirmResult(result) { this.confirmResult = result; }
        showSaveConfirm(fileNamesOrResources) { return Promise.resolve(this.confirmResult); }
    };
    exports.TestFileDialogService = TestFileDialogService;
    exports.TestFileDialogService = TestFileDialogService = __decorate([
        __param(0, pathService_1.IPathService)
    ], TestFileDialogService);
    class TestLayoutService {
        constructor() {
            this.openedDefaultEditors = false;
            this.mainContainerDimension = { width: 800, height: 600 };
            this.activeContainerDimension = { width: 800, height: 600 };
            this.mainContainerOffset = { top: 0, quickPickTop: 0 };
            this.activeContainerOffset = { top: 0, quickPickTop: 0 };
            this.mainContainer = window_1.mainWindow.document.body;
            this.containers = [window_1.mainWindow.document.body];
            this.activeContainer = window_1.mainWindow.document.body;
            this.onDidChangeZenMode = event_1.Event.None;
            this.onDidChangeMainEditorCenteredLayout = event_1.Event.None;
            this.onDidChangeWindowMaximized = event_1.Event.None;
            this.onDidChangePanelPosition = event_1.Event.None;
            this.onDidChangePanelAlignment = event_1.Event.None;
            this.onDidChangePartVisibility = event_1.Event.None;
            this.onDidLayoutMainContainer = event_1.Event.None;
            this.onDidLayoutActiveContainer = event_1.Event.None;
            this.onDidLayoutContainer = event_1.Event.None;
            this.onDidChangeNotificationsVisibility = event_1.Event.None;
            this.onDidAddContainer = event_1.Event.None;
            this.onDidChangeActiveContainer = event_1.Event.None;
            this.whenReady = Promise.resolve(undefined);
            this.whenRestored = Promise.resolve(undefined);
        }
        layout() { }
        isRestored() { return true; }
        hasFocus(_part) { return false; }
        focusPart(_part) { }
        hasMainWindowBorder() { return false; }
        getMainWindowBorderRadius() { return undefined; }
        isVisible(_part) { return true; }
        getContainer() { return null; }
        whenContainerStylesLoaded() { return undefined; }
        isTitleBarHidden() { return false; }
        isStatusBarHidden() { return false; }
        isActivityBarHidden() { return false; }
        setActivityBarHidden(_hidden) { }
        setBannerHidden(_hidden) { }
        isSideBarHidden() { return false; }
        async setEditorHidden(_hidden) { }
        async setSideBarHidden(_hidden) { }
        async setAuxiliaryBarHidden(_hidden) { }
        async setPartHidden(_hidden, part) { }
        isPanelHidden() { return false; }
        async setPanelHidden(_hidden) { }
        toggleMaximizedPanel() { }
        isPanelMaximized() { return false; }
        getMenubarVisibility() { throw new Error('not implemented'); }
        toggleMenuBar() { }
        getSideBarPosition() { return 0; }
        getPanelPosition() { return 0; }
        getPanelAlignment() { return 'center'; }
        async setPanelPosition(_position) { }
        async setPanelAlignment(_alignment) { }
        addClass(_clazz) { }
        removeClass(_clazz) { }
        getMaximumEditorDimensions() { throw new Error('not implemented'); }
        toggleZenMode() { }
        isMainEditorLayoutCentered() { return false; }
        centerMainEditorLayout(_active) { }
        resizePart(_part, _sizeChangeWidth, _sizeChangeHeight) { }
        registerPart(part) { return lifecycle_2.Disposable.None; }
        isWindowMaximized(targetWindow) { return false; }
        updateWindowMaximizedState(targetWindow, maximized) { }
        getVisibleNeighborPart(part, direction) { return undefined; }
        focus() { }
    }
    exports.TestLayoutService = TestLayoutService;
    const activeViewlet = {};
    class TestPaneCompositeService extends lifecycle_2.Disposable {
        constructor() {
            super();
            this.parts = new Map();
            this.parts.set(1 /* ViewContainerLocation.Panel */, new TestPanelPart());
            this.parts.set(0 /* ViewContainerLocation.Sidebar */, new TestSideBarPart());
            this.onDidPaneCompositeOpen = event_1.Event.any(...([1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */].map(loc => event_1.Event.map(this.parts.get(loc).onDidPaneCompositeOpen, composite => { return { composite, viewContainerLocation: loc }; }))));
            this.onDidPaneCompositeClose = event_1.Event.any(...([1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */].map(loc => event_1.Event.map(this.parts.get(loc).onDidPaneCompositeClose, composite => { return { composite, viewContainerLocation: loc }; }))));
        }
        openPaneComposite(id, viewContainerLocation, focus) {
            return this.getPartByLocation(viewContainerLocation).openPaneComposite(id, focus);
        }
        getActivePaneComposite(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getActivePaneComposite();
        }
        getPaneComposite(id, viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPaneComposite(id);
        }
        getPaneComposites(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPaneComposites();
        }
        getProgressIndicator(id, viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getProgressIndicator(id);
        }
        hideActivePaneComposite(viewContainerLocation) {
            this.getPartByLocation(viewContainerLocation).hideActivePaneComposite();
        }
        getLastActivePaneCompositeId(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getLastActivePaneCompositeId();
        }
        getPinnedPaneCompositeIds(viewContainerLocation) {
            throw new Error('Method not implemented.');
        }
        getVisiblePaneCompositeIds(viewContainerLocation) {
            throw new Error('Method not implemented.');
        }
        getPartByLocation(viewContainerLocation) {
            return (0, types_1.assertIsDefined)(this.parts.get(viewContainerLocation));
        }
    }
    exports.TestPaneCompositeService = TestPaneCompositeService;
    class TestSideBarPart {
        constructor() {
            this.onDidViewletRegisterEmitter = new event_1.Emitter();
            this.onDidViewletDeregisterEmitter = new event_1.Emitter();
            this.onDidViewletOpenEmitter = new event_1.Emitter();
            this.onDidViewletCloseEmitter = new event_1.Emitter();
            this.partId = "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */;
            this.element = undefined;
            this.minimumWidth = 0;
            this.maximumWidth = 0;
            this.minimumHeight = 0;
            this.maximumHeight = 0;
            this.onDidChange = event_1.Event.None;
            this.onDidPaneCompositeOpen = this.onDidViewletOpenEmitter.event;
            this.onDidPaneCompositeClose = this.onDidViewletCloseEmitter.event;
        }
        openPaneComposite(id, focus) { return Promise.resolve(undefined); }
        getPaneComposites() { return []; }
        getAllViewlets() { return []; }
        getActivePaneComposite() { return activeViewlet; }
        getDefaultViewletId() { return 'workbench.view.explorer'; }
        getPaneComposite(id) { return undefined; }
        getProgressIndicator(id) { return undefined; }
        hideActivePaneComposite() { }
        getLastActivePaneCompositeId() { return undefined; }
        dispose() { }
        getPinnedPaneCompositeIds() { return []; }
        getVisiblePaneCompositeIds() { return []; }
        layout(width, height, top, left) { }
    }
    exports.TestSideBarPart = TestSideBarPart;
    class TestPanelPart {
        constructor() {
            this.element = undefined;
            this.minimumWidth = 0;
            this.maximumWidth = 0;
            this.minimumHeight = 0;
            this.maximumHeight = 0;
            this.onDidChange = event_1.Event.None;
            this.onDidPaneCompositeOpen = new event_1.Emitter().event;
            this.onDidPaneCompositeClose = new event_1.Emitter().event;
            this.partId = "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */;
        }
        async openPaneComposite(id, focus) { return undefined; }
        getPaneComposite(id) { return activeViewlet; }
        getPaneComposites() { return []; }
        getPinnedPaneCompositeIds() { return []; }
        getVisiblePaneCompositeIds() { return []; }
        getActivePaneComposite() { return activeViewlet; }
        setPanelEnablement(id, enabled) { }
        dispose() { }
        getProgressIndicator(id) { return null; }
        hideActivePaneComposite() { }
        getLastActivePaneCompositeId() { return undefined; }
        layout(width, height, top, left) { }
    }
    exports.TestPanelPart = TestPanelPart;
    class TestViewsService {
        constructor() {
            this.onDidChangeViewContainerVisibility = new event_1.Emitter().event;
            this.onDidChangeViewVisibilityEmitter = new event_1.Emitter();
            this.onDidChangeViewVisibility = this.onDidChangeViewVisibilityEmitter.event;
            this.onDidChangeFocusedViewEmitter = new event_1.Emitter();
            this.onDidChangeFocusedView = this.onDidChangeFocusedViewEmitter.event;
        }
        isViewContainerVisible(id) { return true; }
        getVisibleViewContainer() { return null; }
        openViewContainer(id, focus) { return Promise.resolve(null); }
        closeViewContainer(id) { }
        isViewVisible(id) { return true; }
        getActiveViewWithId(id) { return null; }
        getViewWithId(id) { return null; }
        openView(id, focus) { return Promise.resolve(null); }
        closeView(id) { }
        getViewProgressIndicator(id) { return null; }
        getActiveViewPaneContainerWithId(id) { return null; }
        getFocusedViewName() { return ''; }
    }
    exports.TestViewsService = TestViewsService;
    class TestEditorGroupsService {
        constructor(groups = []) {
            this.groups = groups;
            this.parts = [this];
            this.windowId = window_1.mainWindow.vscodeWindowId;
            this.onDidCreateAuxiliaryEditorPart = event_1.Event.None;
            this.onDidChangeActiveGroup = event_1.Event.None;
            this.onDidActivateGroup = event_1.Event.None;
            this.onDidAddGroup = event_1.Event.None;
            this.onDidRemoveGroup = event_1.Event.None;
            this.onDidMoveGroup = event_1.Event.None;
            this.onDidChangeGroupIndex = event_1.Event.None;
            this.onDidChangeGroupLabel = event_1.Event.None;
            this.onDidChangeGroupLocked = event_1.Event.None;
            this.onDidChangeGroupMaximized = event_1.Event.None;
            this.onDidLayout = event_1.Event.None;
            this.onDidChangeEditorPartOptions = event_1.Event.None;
            this.onDidScroll = event_1.Event.None;
            this.orientation = 0 /* GroupOrientation.HORIZONTAL */;
            this.isReady = true;
            this.whenReady = Promise.resolve(undefined);
            this.whenRestored = Promise.resolve(undefined);
            this.hasRestorableState = false;
            this.contentDimension = { width: 800, height: 600 };
            this.mainPart = this;
        }
        get activeGroup() { return this.groups[0]; }
        get sideGroup() { return this.groups[0]; }
        get count() { return this.groups.length; }
        getPart(group) { return this; }
        saveWorkingSet(name) { throw new Error('Method not implemented.'); }
        getWorkingSets() { throw new Error('Method not implemented.'); }
        applyWorkingSet(workingSet) { throw new Error('Method not implemented.'); }
        deleteWorkingSet(workingSet) { throw new Error('Method not implemented.'); }
        getGroups(_order) { return this.groups; }
        getGroup(identifier) { return this.groups.find(group => group.id === identifier); }
        getLabel(_identifier) { return 'Group 1'; }
        findGroup(_scope, _source, _wrap) { throw new Error('not implemented'); }
        activateGroup(_group) { throw new Error('not implemented'); }
        restoreGroup(_group) { throw new Error('not implemented'); }
        getSize(_group) { return { width: 100, height: 100 }; }
        setSize(_group, _size) { }
        arrangeGroups(_arrangement) { }
        toggleMaximizeGroup() { }
        hasMaximizedGroup() { throw new Error('not implemented'); }
        toggleExpandGroup() { }
        applyLayout(_layout) { }
        getLayout() { throw new Error('not implemented'); }
        setGroupOrientation(_orientation) { }
        addGroup(_location, _direction) { throw new Error('not implemented'); }
        removeGroup(_group) { }
        moveGroup(_group, _location, _direction) { throw new Error('not implemented'); }
        mergeGroup(_group, _target, _options) { throw new Error('not implemented'); }
        mergeAllGroups(_group) { throw new Error('not implemented'); }
        copyGroup(_group, _location, _direction) { throw new Error('not implemented'); }
        centerLayout(active) { }
        isLayoutCentered() { return false; }
        createEditorDropTarget(container, delegate) { return lifecycle_2.Disposable.None; }
        enforcePartOptions(options) { return lifecycle_2.Disposable.None; }
        registerEditorPart(part) { return lifecycle_2.Disposable.None; }
        createAuxiliaryEditorPart() { throw new Error('Method not implemented.'); }
    }
    exports.TestEditorGroupsService = TestEditorGroupsService;
    class TestEditorGroupView {
        constructor(id) {
            this.id = id;
            this.windowId = window_1.mainWindow.vscodeWindowId;
            this.groupsView = undefined;
            this.editors = [];
            this.whenRestored = Promise.resolve(undefined);
            this.isEmpty = true;
            this.onWillDispose = event_1.Event.None;
            this.onDidModelChange = event_1.Event.None;
            this.onWillCloseEditor = event_1.Event.None;
            this.onDidCloseEditor = event_1.Event.None;
            this.onDidOpenEditorFail = event_1.Event.None;
            this.onDidFocus = event_1.Event.None;
            this.onDidChange = event_1.Event.None;
            this.onWillMoveEditor = event_1.Event.None;
            this.onWillOpenEditor = event_1.Event.None;
            this.onDidActiveEditorChange = event_1.Event.None;
        }
        getEditors(_order) { return []; }
        findEditors(_resource) { return []; }
        getEditorByIndex(_index) { throw new Error('not implemented'); }
        getIndexOfEditor(_editor) { return -1; }
        isFirst(editor) { return false; }
        isLast(editor) { return false; }
        openEditor(_editor, _options) { throw new Error('not implemented'); }
        openEditors(_editors) { throw new Error('not implemented'); }
        isPinned(_editor) { return false; }
        isSticky(_editor) { return false; }
        isTransient(_editor) { return false; }
        isActive(_editor) { return false; }
        contains(candidate) { return false; }
        moveEditor(_editor, _target, _options) { return true; }
        moveEditors(_editors, _target) { return true; }
        copyEditor(_editor, _target, _options) { }
        copyEditors(_editors, _target) { }
        async closeEditor(_editor, options) { return true; }
        async closeEditors(_editors, options) { return true; }
        async closeAllEditors(options) { return true; }
        async replaceEditors(_editors) { }
        pinEditor(_editor) { }
        stickEditor(editor) { }
        unstickEditor(editor) { }
        lock(locked) { }
        focus() { }
        get scopedContextKeyService() { throw new Error('not implemented'); }
        setActive(_isActive) { }
        notifyIndexChanged(_index) { }
        notifyLabelChanged(_label) { }
        dispose() { }
        toJSON() { return Object.create(null); }
        layout(_width, _height) { }
        relayout() { }
        createEditorActions(_menuDisposable) { throw new Error('not implemented'); }
    }
    exports.TestEditorGroupView = TestEditorGroupView;
    class TestEditorGroupAccessor {
        constructor() {
            this.label = '';
            this.windowId = window_1.mainWindow.vscodeWindowId;
            this.groups = [];
            this.partOptions = { ...editor_2.DEFAULT_EDITOR_PART_OPTIONS };
            this.onDidChangeEditorPartOptions = event_1.Event.None;
            this.onDidVisibilityChange = event_1.Event.None;
        }
        getGroup(identifier) { throw new Error('Method not implemented.'); }
        getGroups(order) { throw new Error('Method not implemented.'); }
        activateGroup(identifier) { throw new Error('Method not implemented.'); }
        restoreGroup(identifier) { throw new Error('Method not implemented.'); }
        addGroup(location, direction) { throw new Error('Method not implemented.'); }
        mergeGroup(group, target, options) { throw new Error('Method not implemented.'); }
        moveGroup(group, location, direction) { throw new Error('Method not implemented.'); }
        copyGroup(group, location, direction) { throw new Error('Method not implemented.'); }
        removeGroup(group) { throw new Error('Method not implemented.'); }
        arrangeGroups(arrangement, target) { throw new Error('Method not implemented.'); }
        toggleMaximizeGroup(group) { throw new Error('Method not implemented.'); }
        toggleExpandGroup(group) { throw new Error('Method not implemented.'); }
    }
    exports.TestEditorGroupAccessor = TestEditorGroupAccessor;
    class TestEditorService extends lifecycle_2.Disposable {
        get activeTextEditorControl() { return this._activeTextEditorControl; }
        set activeTextEditorControl(value) { this._activeTextEditorControl = value; }
        get activeEditor() { return this._activeEditor; }
        set activeEditor(value) { this._activeEditor = value; }
        constructor(editorGroupService) {
            super();
            this.editorGroupService = editorGroupService;
            this.onDidActiveEditorChange = event_1.Event.None;
            this.onDidVisibleEditorsChange = event_1.Event.None;
            this.onDidEditorsChange = event_1.Event.None;
            this.onWillOpenEditor = event_1.Event.None;
            this.onDidCloseEditor = event_1.Event.None;
            this.onDidOpenEditorFail = event_1.Event.None;
            this.onDidMostRecentlyActiveEditorsChange = event_1.Event.None;
            this.editors = [];
            this.mostRecentlyActiveEditors = [];
            this.visibleEditorPanes = [];
            this.visibleTextEditorControls = [];
            this.visibleEditors = [];
            this.count = this.editors.length;
        }
        createScoped(editorGroupsContainer) { return this; }
        getEditors() { return []; }
        findEditors() { return []; }
        async openEditor(editor, optionsOrGroup, group) {
            // openEditor takes ownership of the input, register it to the TestEditorService
            // so it's not marked as leaked during tests.
            if ('dispose' in editor) {
                this._register(editor);
            }
            return undefined;
        }
        async closeEditor(editor, options) { }
        async closeEditors(editors, options) { }
        doResolveEditorOpenRequest(editor) {
            if (!this.editorGroupService) {
                return undefined;
            }
            return [this.editorGroupService.activeGroup, editor, undefined];
        }
        openEditors(_editors, _group) { throw new Error('not implemented'); }
        isOpened(_editor) { return false; }
        isVisible(_editor) { return false; }
        replaceEditors(_editors, _group) { return Promise.resolve(undefined); }
        save(editors, options) { throw new Error('Method not implemented.'); }
        saveAll(options) { throw new Error('Method not implemented.'); }
        revert(editors, options) { throw new Error('Method not implemented.'); }
        revertAll(options) { throw new Error('Method not implemented.'); }
    }
    exports.TestEditorService = TestEditorService;
    class TestFileService {
        constructor() {
            this._onDidFilesChange = new event_1.Emitter();
            this._onDidRunOperation = new event_1.Emitter();
            this._onDidChangeFileSystemProviderCapabilities = new event_1.Emitter();
            this._onWillActivateFileSystemProvider = new event_1.Emitter();
            this.onWillActivateFileSystemProvider = this._onWillActivateFileSystemProvider.event;
            this.onDidWatchError = event_1.Event.None;
            this.content = 'Hello Html';
            this.readonly = false;
            this.notExistsSet = new map_1.ResourceMap();
            this.readShouldThrowError = undefined;
            this.writeShouldThrowError = undefined;
            this.onDidChangeFileSystemProviderRegistrations = event_1.Event.None;
            this.providers = new Map();
            this.watches = [];
        }
        get onDidFilesChange() { return this._onDidFilesChange.event; }
        fireFileChanges(event) { this._onDidFilesChange.fire(event); }
        get onDidRunOperation() { return this._onDidRunOperation.event; }
        fireAfterOperation(event) { this._onDidRunOperation.fire(event); }
        get onDidChangeFileSystemProviderCapabilities() { return this._onDidChangeFileSystemProviderCapabilities.event; }
        fireFileSystemProviderCapabilitiesChangeEvent(event) { this._onDidChangeFileSystemProviderCapabilities.fire(event); }
        setContent(content) { this.content = content; }
        getContent() { return this.content; }
        getLastReadFileUri() { return this.lastReadFileUri; }
        async resolve(resource, _options) {
            return (0, workbenchTestServices_1.createFileStat)(resource, this.readonly);
        }
        stat(resource) {
            return this.resolve(resource, { resolveMetadata: true });
        }
        async resolveAll(toResolve) {
            const stats = await Promise.all(toResolve.map(resourceAndOption => this.resolve(resourceAndOption.resource, resourceAndOption.options)));
            return stats.map(stat => ({ stat, success: true }));
        }
        async exists(_resource) { return !this.notExistsSet.has(_resource); }
        async readFile(resource, options) {
            if (this.readShouldThrowError) {
                throw this.readShouldThrowError;
            }
            this.lastReadFileUri = resource;
            return {
                ...(0, workbenchTestServices_1.createFileStat)(resource, this.readonly),
                value: buffer_1.VSBuffer.fromString(this.content)
            };
        }
        async readFileStream(resource, options) {
            if (this.readShouldThrowError) {
                throw this.readShouldThrowError;
            }
            this.lastReadFileUri = resource;
            return {
                ...(0, workbenchTestServices_1.createFileStat)(resource, this.readonly),
                value: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(this.content))
            };
        }
        async writeFile(resource, bufferOrReadable, options) {
            await (0, async_1.timeout)(0);
            if (this.writeShouldThrowError) {
                throw this.writeShouldThrowError;
            }
            return (0, workbenchTestServices_1.createFileStat)(resource, this.readonly);
        }
        move(_source, _target, _overwrite) { return Promise.resolve(null); }
        copy(_source, _target, _overwrite) { return Promise.resolve(null); }
        async cloneFile(_source, _target) { }
        createFile(_resource, _content, _options) { return Promise.resolve(null); }
        createFolder(_resource) { return Promise.resolve(null); }
        registerProvider(scheme, provider) {
            this.providers.set(scheme, provider);
            return (0, lifecycle_2.toDisposable)(() => this.providers.delete(scheme));
        }
        getProvider(scheme) {
            return this.providers.get(scheme);
        }
        async activateProvider(_scheme) {
            this._onWillActivateFileSystemProvider.fire({ scheme: _scheme, join: () => { } });
        }
        async canHandleResource(resource) { return this.hasProvider(resource); }
        hasProvider(resource) { return resource.scheme === network_1.Schemas.file || this.providers.has(resource.scheme); }
        listCapabilities() {
            return [
                { scheme: network_1.Schemas.file, capabilities: 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ },
                ...iterator_1.Iterable.map(this.providers, ([scheme, p]) => { return { scheme, capabilities: p.capabilities }; })
            ];
        }
        hasCapability(resource, capability) {
            if (capability === 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */ && platform_1.isLinux) {
                return true;
            }
            const provider = this.getProvider(resource.scheme);
            return !!(provider && (provider.capabilities & capability));
        }
        async del(_resource, _options) { }
        createWatcher(resource, options) {
            return {
                onDidChange: event_1.Event.None,
                dispose: () => { }
            };
        }
        watch(_resource) {
            this.watches.push(_resource);
            return (0, lifecycle_2.toDisposable)(() => this.watches.splice(this.watches.indexOf(_resource), 1));
        }
        getWriteEncoding(_resource) { return { encoding: 'utf8', hasBOM: false }; }
        dispose() { }
        async canCreateFile(source, options) { return true; }
        async canMove(source, target, overwrite) { return true; }
        async canCopy(source, target, overwrite) { return true; }
        async canDelete(resource, options) { return true; }
    }
    exports.TestFileService = TestFileService;
    class TestWorkingCopyBackupService extends workingCopyBackupService_1.InMemoryWorkingCopyBackupService {
        constructor() {
            super();
            this.resolved = new Set();
        }
        parseBackupContent(textBufferFactory) {
            const textBuffer = textBufferFactory.create(1 /* DefaultEndOfLine.LF */).textBuffer;
            const lineCount = textBuffer.getLineCount();
            const range = new range_1.Range(1, 1, lineCount, textBuffer.getLineLength(lineCount) + 1);
            return textBuffer.getValueInRange(range, 0 /* EndOfLinePreference.TextDefined */);
        }
        async resolve(identifier) {
            this.resolved.add(identifier);
            return super.resolve(identifier);
        }
    }
    exports.TestWorkingCopyBackupService = TestWorkingCopyBackupService;
    function toUntypedWorkingCopyId(resource) {
        return toTypedWorkingCopyId(resource, '');
    }
    function toTypedWorkingCopyId(resource, typeId = 'testBackupTypeId') {
        return { typeId, resource };
    }
    class InMemoryTestWorkingCopyBackupService extends workingCopyBackupService_2.BrowserWorkingCopyBackupService {
        constructor() {
            const disposables = new lifecycle_2.DisposableStore();
            const environmentService = exports.TestEnvironmentService;
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            disposables.add(fileService.registerProvider(network_1.Schemas.file, disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
            super(new workbenchTestServices_1.TestContextService(testWorkspace_1.TestWorkspace), environmentService, fileService, logService);
            this.backupResourceJoiners = [];
            this.discardBackupJoiners = [];
            this.discardedBackups = [];
            this._register(disposables);
        }
        testGetFileService() {
            return this.fileService;
        }
        joinBackupResource() {
            return new Promise(resolve => this.backupResourceJoiners.push(resolve));
        }
        joinDiscardBackup() {
            return new Promise(resolve => this.discardBackupJoiners.push(resolve));
        }
        async backup(identifier, content, versionId, meta, token) {
            await super.backup(identifier, content, versionId, meta, token);
            while (this.backupResourceJoiners.length) {
                this.backupResourceJoiners.pop()();
            }
        }
        async discardBackup(identifier) {
            await super.discardBackup(identifier);
            this.discardedBackups.push(identifier);
            while (this.discardBackupJoiners.length) {
                this.discardBackupJoiners.pop()();
            }
        }
        async getBackupContents(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const fileContents = await this.fileService.readFile(backupResource);
            return fileContents.value.toString();
        }
    }
    exports.InMemoryTestWorkingCopyBackupService = InMemoryTestWorkingCopyBackupService;
    class TestLifecycleService extends lifecycle_2.Disposable {
        constructor() {
            super(...arguments);
            this.usePhases = false;
            this.whenStarted = new async_1.DeferredPromise();
            this.whenReady = new async_1.DeferredPromise();
            this.whenRestored = new async_1.DeferredPromise();
            this.whenEventually = new async_1.DeferredPromise();
            this._onBeforeShutdown = this._register(new event_1.Emitter());
            this._onBeforeShutdownError = this._register(new event_1.Emitter());
            this._onShutdownVeto = this._register(new event_1.Emitter());
            this._onWillShutdown = this._register(new event_1.Emitter());
            this._onDidShutdown = this._register(new event_1.Emitter());
            this.shutdownJoiners = [];
        }
        get phase() { return this._phase; }
        set phase(value) {
            this._phase = value;
            if (value === 1 /* LifecyclePhase.Starting */) {
                this.whenStarted.complete();
            }
            else if (value === 2 /* LifecyclePhase.Ready */) {
                this.whenReady.complete();
            }
            else if (value === 3 /* LifecyclePhase.Restored */) {
                this.whenRestored.complete();
            }
            else if (value === 4 /* LifecyclePhase.Eventually */) {
                this.whenEventually.complete();
            }
        }
        async when(phase) {
            if (!this.usePhases) {
                return;
            }
            if (phase === 1 /* LifecyclePhase.Starting */) {
                await this.whenStarted.p;
            }
            else if (phase === 2 /* LifecyclePhase.Ready */) {
                await this.whenReady.p;
            }
            else if (phase === 3 /* LifecyclePhase.Restored */) {
                await this.whenRestored.p;
            }
            else if (phase === 4 /* LifecyclePhase.Eventually */) {
                await this.whenEventually.p;
            }
        }
        get onBeforeShutdown() { return this._onBeforeShutdown.event; }
        get onBeforeShutdownError() { return this._onBeforeShutdownError.event; }
        get onShutdownVeto() { return this._onShutdownVeto.event; }
        get onWillShutdown() { return this._onWillShutdown.event; }
        get onDidShutdown() { return this._onDidShutdown.event; }
        fireShutdown(reason = 2 /* ShutdownReason.QUIT */) {
            this.shutdownJoiners = [];
            this._onWillShutdown.fire({
                join: p => {
                    this.shutdownJoiners.push(p);
                },
                joiners: () => [],
                force: () => { },
                token: cancellation_1.CancellationToken.None,
                reason
            });
        }
        fireBeforeShutdown(event) { this._onBeforeShutdown.fire(event); }
        fireWillShutdown(event) { this._onWillShutdown.fire(event); }
        async shutdown() {
            this.fireShutdown();
        }
    }
    exports.TestLifecycleService = TestLifecycleService;
    class TestBeforeShutdownEvent {
        constructor() {
            this.reason = 1 /* ShutdownReason.CLOSE */;
        }
        veto(value) {
            this.value = value;
        }
        finalVeto(vetoFn) {
            this.value = vetoFn();
            this.finalValue = vetoFn;
        }
    }
    exports.TestBeforeShutdownEvent = TestBeforeShutdownEvent;
    class TestWillShutdownEvent {
        constructor() {
            this.value = [];
            this.joiners = () => [];
            this.reason = 1 /* ShutdownReason.CLOSE */;
            this.token = cancellation_1.CancellationToken.None;
        }
        join(promise, joiner) {
            this.value.push(promise);
        }
        force() { }
    }
    exports.TestWillShutdownEvent = TestWillShutdownEvent;
    class TestTextResourceConfigurationService {
        constructor(configurationService = new testConfigurationService_1.TestConfigurationService()) {
            this.configurationService = configurationService;
        }
        onDidChangeConfiguration() {
            return { dispose() { } };
        }
        getValue(resource, arg2, arg3) {
            const position = position_1.Position.isIPosition(arg2) ? arg2 : null;
            const section = position ? (typeof arg3 === 'string' ? arg3 : undefined) : (typeof arg2 === 'string' ? arg2 : undefined);
            return this.configurationService.getValue(section, { resource });
        }
        inspect(resource, position, section) {
            return this.configurationService.inspect(section, { resource });
        }
        updateValue(resource, key, value, configurationTarget) {
            return this.configurationService.updateValue(key, value);
        }
    }
    exports.TestTextResourceConfigurationService = TestTextResourceConfigurationService;
    class RemoteFileSystemProvider {
        constructor(wrappedFsp, remoteAuthority) {
            this.wrappedFsp = wrappedFsp;
            this.remoteAuthority = remoteAuthority;
            this.capabilities = this.wrappedFsp.capabilities;
            this.onDidChangeCapabilities = this.wrappedFsp.onDidChangeCapabilities;
            this.onDidChangeFile = event_1.Event.map(this.wrappedFsp.onDidChangeFile, changes => changes.map(c => {
                return {
                    type: c.type,
                    resource: c.resource.with({ scheme: network_1.Schemas.vscodeRemote, authority: this.remoteAuthority }),
                };
            }));
        }
        watch(resource, opts) { return this.wrappedFsp.watch(this.toFileResource(resource), opts); }
        stat(resource) { return this.wrappedFsp.stat(this.toFileResource(resource)); }
        mkdir(resource) { return this.wrappedFsp.mkdir(this.toFileResource(resource)); }
        readdir(resource) { return this.wrappedFsp.readdir(this.toFileResource(resource)); }
        delete(resource, opts) { return this.wrappedFsp.delete(this.toFileResource(resource), opts); }
        rename(from, to, opts) { return this.wrappedFsp.rename(this.toFileResource(from), this.toFileResource(to), opts); }
        copy(from, to, opts) { return this.wrappedFsp.copy(this.toFileResource(from), this.toFileResource(to), opts); }
        readFile(resource) { return this.wrappedFsp.readFile(this.toFileResource(resource)); }
        writeFile(resource, content, opts) { return this.wrappedFsp.writeFile(this.toFileResource(resource), content, opts); }
        open(resource, opts) { return this.wrappedFsp.open(this.toFileResource(resource), opts); }
        close(fd) { return this.wrappedFsp.close(fd); }
        read(fd, pos, data, offset, length) { return this.wrappedFsp.read(fd, pos, data, offset, length); }
        write(fd, pos, data, offset, length) { return this.wrappedFsp.write(fd, pos, data, offset, length); }
        readFileStream(resource, opts, token) { return this.wrappedFsp.readFileStream(this.toFileResource(resource), opts, token); }
        toFileResource(resource) { return resource.with({ scheme: network_1.Schemas.file, authority: '' }); }
    }
    exports.RemoteFileSystemProvider = RemoteFileSystemProvider;
    class TestInMemoryFileSystemProvider extends inMemoryFilesystemProvider_1.InMemoryFileSystemProvider {
        get capabilities() {
            return 2 /* FileSystemProviderCapabilities.FileReadWrite */
                | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */
                | 16 /* FileSystemProviderCapabilities.FileReadStream */;
        }
        readFileStream(resource) {
            const BUFFER_SIZE = 64 * 1024;
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer);
            (async () => {
                try {
                    const data = await this.readFile(resource);
                    let offset = 0;
                    while (offset < data.length) {
                        await (0, async_1.timeout)(0);
                        await stream.write(data.subarray(offset, offset + BUFFER_SIZE));
                        offset += BUFFER_SIZE;
                    }
                    await (0, async_1.timeout)(0);
                    stream.end();
                }
                catch (error) {
                    stream.end(error);
                }
            })();
            return stream;
        }
    }
    exports.TestInMemoryFileSystemProvider = TestInMemoryFileSystemProvider;
    exports.productService = { _serviceBrand: undefined, ...product_1.default };
    class TestHostService {
        constructor() {
            this._hasFocus = true;
            this._onDidChangeFocus = new event_1.Emitter();
            this.onDidChangeFocus = this._onDidChangeFocus.event;
            this._onDidChangeWindow = new event_1.Emitter();
            this.onDidChangeActiveWindow = this._onDidChangeWindow.event;
            this.onDidChangeFullScreen = event_1.Event.None;
            this.colorScheme = theme_1.ColorScheme.DARK;
            this.onDidChangeColorScheme = event_1.Event.None;
        }
        get hasFocus() { return this._hasFocus; }
        async hadLastFocus() { return this._hasFocus; }
        setFocus(focus) {
            this._hasFocus = focus;
            this._onDidChangeFocus.fire(this._hasFocus);
        }
        async restart() { }
        async reload() { }
        async close() { }
        async withExpectedShutdown(expectedShutdownTask) {
            return await expectedShutdownTask();
        }
        async focus() { }
        async moveTop() { }
        async getCursorScreenPoint() { return undefined; }
        async openWindow(arg1, arg2) { }
        async toggleFullScreen() { }
    }
    exports.TestHostService = TestHostService;
    class TestFilesConfigurationService extends filesConfigurationService_1.FilesConfigurationService {
        testOnFilesConfigurationChange(configuration) {
            super.onFilesConfigurationChange(configuration, true);
        }
    }
    exports.TestFilesConfigurationService = TestFilesConfigurationService;
    class TestReadonlyTextFileEditorModel extends textFileEditorModel_1.TextFileEditorModel {
        isReadonly() {
            return true;
        }
    }
    exports.TestReadonlyTextFileEditorModel = TestReadonlyTextFileEditorModel;
    class TestEditorInput extends editorInput_1.EditorInput {
        constructor(resource, _typeId) {
            super();
            this.resource = resource;
            this._typeId = _typeId;
        }
        get typeId() {
            return this._typeId;
        }
        get editorId() {
            return this._typeId;
        }
        resolve() {
            return Promise.resolve(null);
        }
    }
    exports.TestEditorInput = TestEditorInput;
    function registerTestEditor(id, inputs, serializerInputId) {
        const disposables = new lifecycle_2.DisposableStore();
        class TestEditor extends editorPane_1.EditorPane {
            constructor(group) {
                super(id, group, telemetryUtils_1.NullTelemetryService, new testThemeService_1.TestThemeService(), disposables.add(new workbenchTestServices_1.TestStorageService()));
                this._scopedContextKeyService = new mockKeybindingService_1.MockContextKeyService();
            }
            async setInput(input, options, context, token) {
                super.setInput(input, options, context, token);
                await input.resolve();
            }
            getId() { return id; }
            layout() { }
            createEditor() { }
            get scopedContextKeyService() {
                return this._scopedContextKeyService;
            }
        }
        disposables.add(platform_2.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_3.EditorPaneDescriptor.create(TestEditor, id, 'Test Editor Control'), inputs));
        if (serializerInputId) {
            class EditorsObserverTestEditorInputSerializer {
                canSerialize(editorInput) {
                    return true;
                }
                serialize(editorInput) {
                    const testEditorInput = editorInput;
                    const testInput = {
                        resource: testEditorInput.resource.toString()
                    };
                    return JSON.stringify(testInput);
                }
                deserialize(instantiationService, serializedEditorInput) {
                    const testInput = JSON.parse(serializedEditorInput);
                    return new TestFileEditorInput(uri_1.URI.parse(testInput.resource), serializerInputId);
                }
            }
            disposables.add(platform_2.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(serializerInputId, EditorsObserverTestEditorInputSerializer));
        }
        return disposables;
    }
    function registerTestFileEditor() {
        const disposables = new lifecycle_2.DisposableStore();
        disposables.add(platform_2.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_3.EditorPaneDescriptor.create(TestTextFileEditor, TestTextFileEditor.ID, 'Text File Editor'), [new descriptors_1.SyncDescriptor(fileEditorInput_1.FileEditorInput)]));
        return disposables;
    }
    function registerTestResourceEditor() {
        const disposables = new lifecycle_2.DisposableStore();
        disposables.add(platform_2.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_3.EditorPaneDescriptor.create(TestTextResourceEditor, TestTextResourceEditor.ID, 'Text Editor'), [
            new descriptors_1.SyncDescriptor(untitledTextEditorInput_1.UntitledTextEditorInput),
            new descriptors_1.SyncDescriptor(textResourceEditorInput_1.TextResourceEditorInput)
        ]));
        return disposables;
    }
    function registerTestSideBySideEditor() {
        const disposables = new lifecycle_2.DisposableStore();
        disposables.add(platform_2.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_3.EditorPaneDescriptor.create(sideBySideEditor_1.SideBySideEditor, sideBySideEditor_1.SideBySideEditor.ID, 'Text Editor'), [
            new descriptors_1.SyncDescriptor(sideBySideEditorInput_1.SideBySideEditorInput)
        ]));
        return disposables;
    }
    class TestFileEditorInput extends editorInput_1.EditorInput {
        constructor(resource, _typeId) {
            super();
            this.resource = resource;
            this._typeId = _typeId;
            this.preferredResource = this.resource;
            this.gotDisposed = false;
            this.gotSaved = false;
            this.gotSavedAs = false;
            this.gotReverted = false;
            this.dirty = false;
            this.fails = false;
            this.disableToUntyped = false;
            this._capabilities = 0 /* EditorInputCapabilities.None */;
            this.movedEditor = undefined;
            this.moveDisabledReason = undefined;
        }
        get typeId() { return this._typeId; }
        get editorId() { return this._typeId; }
        get capabilities() { return this._capabilities; }
        set capabilities(capabilities) {
            if (this._capabilities !== capabilities) {
                this._capabilities = capabilities;
                this._onDidChangeCapabilities.fire();
            }
        }
        resolve() { return !this.fails ? Promise.resolve(null) : Promise.reject(new Error('fails')); }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            if (other instanceof editorInput_1.EditorInput) {
                return !!(other?.resource && this.resource.toString() === other.resource.toString() && other instanceof TestFileEditorInput && other.typeId === this.typeId);
            }
            return (0, resources_1.isEqual)(this.resource, other.resource) && (this.editorId === other.options?.override || other.options?.override === undefined);
        }
        setPreferredResource(resource) { }
        async setEncoding(encoding) { }
        getEncoding() { return undefined; }
        setPreferredName(name) { }
        setPreferredDescription(description) { }
        setPreferredEncoding(encoding) { }
        setPreferredContents(contents) { }
        setLanguageId(languageId, source) { }
        setPreferredLanguageId(languageId) { }
        setForceOpenAsBinary() { }
        setFailToOpen() {
            this.fails = true;
        }
        async save(groupId, options) {
            this.gotSaved = true;
            this.dirty = false;
            return this;
        }
        async saveAs(groupId, options) {
            this.gotSavedAs = true;
            return this;
        }
        async revert(group, options) {
            this.gotReverted = true;
            this.gotSaved = false;
            this.gotSavedAs = false;
            this.dirty = false;
        }
        toUntyped() {
            if (this.disableToUntyped) {
                return undefined;
            }
            return { resource: this.resource };
        }
        setModified() { this.modified = true; }
        isModified() {
            return this.modified === undefined ? this.dirty : this.modified;
        }
        setDirty() { this.dirty = true; }
        isDirty() {
            return this.dirty;
        }
        isResolved() { return false; }
        dispose() {
            super.dispose();
            this.gotDisposed = true;
        }
        async rename() { return this.movedEditor; }
        setMoveDisabled(reason) {
            this.moveDisabledReason = reason;
        }
        canMove(sourceGroup, targetGroup) {
            if (typeof this.moveDisabledReason === 'string') {
                return this.moveDisabledReason;
            }
            return super.canMove(sourceGroup, targetGroup);
        }
    }
    exports.TestFileEditorInput = TestFileEditorInput;
    class TestSingletonFileEditorInput extends TestFileEditorInput {
        get capabilities() { return 8 /* EditorInputCapabilities.Singleton */; }
    }
    exports.TestSingletonFileEditorInput = TestSingletonFileEditorInput;
    class TestEditorPart extends editorPart_1.MainEditorPart {
        constructor() {
            super(...arguments);
            this.mainPart = this;
            this.parts = [this];
            this.onDidCreateAuxiliaryEditorPart = event_1.Event.None;
        }
        testSaveState() {
            return super.saveState();
        }
        clearState() {
            const workspaceMemento = this.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            for (const key of Object.keys(workspaceMemento)) {
                delete workspaceMemento[key];
            }
            const profileMemento = this.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            for (const key of Object.keys(profileMemento)) {
                delete profileMemento[key];
            }
        }
        registerEditorPart(part) {
            return lifecycle_2.Disposable.None;
        }
        createAuxiliaryEditorPart() {
            throw new Error('Method not implemented.');
        }
        getPart(group) { return this; }
        saveWorkingSet(name) { throw new Error('Method not implemented.'); }
        getWorkingSets() { throw new Error('Method not implemented.'); }
        applyWorkingSet(workingSet) { throw new Error('Method not implemented.'); }
        deleteWorkingSet(workingSet) { throw new Error('Method not implemented.'); }
    }
    exports.TestEditorPart = TestEditorPart;
    async function createEditorPart(instantiationService, disposables) {
        class TestEditorParts extends editorParts_1.EditorParts {
            createMainEditorPart() {
                this.testMainPart = instantiationService.createInstance(TestEditorPart, this);
                return this.testMainPart;
            }
        }
        const part = disposables.add(instantiationService.createInstance(TestEditorParts)).testMainPart;
        part.create(document.createElement('div'));
        part.layout(1080, 800, 0, 0);
        await part.whenReady;
        return part;
    }
    class TestListService {
        constructor() {
            this.lastFocusedList = undefined;
        }
        register() {
            return lifecycle_2.Disposable.None;
        }
    }
    exports.TestListService = TestListService;
    class TestPathService {
        constructor(fallbackUserHome = uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/' }), defaultUriScheme = network_1.Schemas.file) {
            this.fallbackUserHome = fallbackUserHome;
            this.defaultUriScheme = defaultUriScheme;
        }
        hasValidBasename(resource, arg2, name) {
            if (typeof arg2 === 'string' || typeof arg2 === 'undefined') {
                return (0, extpath_1.isValidBasename)(arg2 ?? (0, resources_1.basename)(resource));
            }
            return (0, extpath_1.isValidBasename)(name ?? (0, resources_1.basename)(resource));
        }
        get path() { return Promise.resolve(platform_1.isWindows ? path_1.win32 : path_1.posix); }
        userHome(options) {
            return options?.preferLocal ? this.fallbackUserHome : Promise.resolve(this.fallbackUserHome);
        }
        get resolvedUserHome() { return this.fallbackUserHome; }
        async fileURI(path) {
            return uri_1.URI.file(path);
        }
    }
    exports.TestPathService = TestPathService;
    function getLastResolvedFileStat(model) {
        const candidate = model;
        return candidate?.lastResolvedFileStat;
    }
    class TestWorkspacesService {
        constructor() {
            this.onDidChangeRecentlyOpened = event_1.Event.None;
        }
        async createUntitledWorkspace(folders, remoteAuthority) { throw new Error('Method not implemented.'); }
        async deleteUntitledWorkspace(workspace) { }
        async addRecentlyOpened(recents) { }
        async removeRecentlyOpened(workspaces) { }
        async clearRecentlyOpened() { }
        async getRecentlyOpened() { return { files: [], workspaces: [] }; }
        async getDirtyWorkspaces() { return []; }
        async enterWorkspace(path) { throw new Error('Method not implemented.'); }
        async getWorkspaceIdentifier(workspacePath) { throw new Error('Method not implemented.'); }
    }
    exports.TestWorkspacesService = TestWorkspacesService;
    class TestTerminalInstanceService {
        constructor() {
            this.onDidCreateInstance = event_1.Event.None;
        }
        convertProfileToShellLaunchConfig(shellLaunchConfigOrProfile, cwd) { throw new Error('Method not implemented.'); }
        preparePathForTerminalAsync(path, executable, title, shellType, remoteAuthority) { throw new Error('Method not implemented.'); }
        createInstance(options, target) { throw new Error('Method not implemented.'); }
        async getBackend(remoteAuthority) { throw new Error('Method not implemented.'); }
        didRegisterBackend(remoteAuthority) { throw new Error('Method not implemented.'); }
        getRegisteredBackends() { throw new Error('Method not implemented.'); }
    }
    exports.TestTerminalInstanceService = TestTerminalInstanceService;
    class TestTerminalEditorService {
        constructor() {
            this.instances = [];
            this.onDidDisposeInstance = event_1.Event.None;
            this.onDidFocusInstance = event_1.Event.None;
            this.onDidChangeInstanceCapability = event_1.Event.None;
            this.onDidChangeActiveInstance = event_1.Event.None;
            this.onDidChangeInstances = event_1.Event.None;
        }
        openEditor(instance, editorOptions) { throw new Error('Method not implemented.'); }
        detachInstance(instance) { throw new Error('Method not implemented.'); }
        splitInstance(instanceToSplit, shellLaunchConfig) { throw new Error('Method not implemented.'); }
        revealActiveEditor(preserveFocus) { throw new Error('Method not implemented.'); }
        resolveResource(instance) { throw new Error('Method not implemented.'); }
        reviveInput(deserializedInput) { throw new Error('Method not implemented.'); }
        getInputFromResource(resource) { throw new Error('Method not implemented.'); }
        setActiveInstance(instance) { throw new Error('Method not implemented.'); }
        focusActiveInstance() { throw new Error('Method not implemented.'); }
        getInstanceFromResource(resource) { throw new Error('Method not implemented.'); }
        focusFindWidget() { throw new Error('Method not implemented.'); }
        hideFindWidget() { throw new Error('Method not implemented.'); }
        findNext() { throw new Error('Method not implemented.'); }
        findPrevious() { throw new Error('Method not implemented.'); }
    }
    exports.TestTerminalEditorService = TestTerminalEditorService;
    class TestTerminalGroupService {
        constructor() {
            this.instances = [];
            this.groups = [];
            this.activeGroupIndex = 0;
            this.lastAccessedMenu = 'inline-tab';
            this.onDidChangeActiveGroup = event_1.Event.None;
            this.onDidDisposeGroup = event_1.Event.None;
            this.onDidShow = event_1.Event.None;
            this.onDidChangeGroups = event_1.Event.None;
            this.onDidChangePanelOrientation = event_1.Event.None;
            this.onDidDisposeInstance = event_1.Event.None;
            this.onDidFocusInstance = event_1.Event.None;
            this.onDidChangeInstanceCapability = event_1.Event.None;
            this.onDidChangeActiveInstance = event_1.Event.None;
            this.onDidChangeInstances = event_1.Event.None;
        }
        createGroup(instance) { throw new Error('Method not implemented.'); }
        getGroupForInstance(instance) { throw new Error('Method not implemented.'); }
        moveGroup(source, target) { throw new Error('Method not implemented.'); }
        moveGroupToEnd(source) { throw new Error('Method not implemented.'); }
        moveInstance(source, target, side) { throw new Error('Method not implemented.'); }
        unsplitInstance(instance) { throw new Error('Method not implemented.'); }
        joinInstances(instances) { throw new Error('Method not implemented.'); }
        instanceIsSplit(instance) { throw new Error('Method not implemented.'); }
        getGroupLabels() { throw new Error('Method not implemented.'); }
        setActiveGroupByIndex(index) { throw new Error('Method not implemented.'); }
        setActiveGroupToNext() { throw new Error('Method not implemented.'); }
        setActiveGroupToPrevious() { throw new Error('Method not implemented.'); }
        setActiveInstanceByIndex(terminalIndex) { throw new Error('Method not implemented.'); }
        setContainer(container) { throw new Error('Method not implemented.'); }
        showPanel(focus) { throw new Error('Method not implemented.'); }
        hidePanel() { throw new Error('Method not implemented.'); }
        focusTabs() { throw new Error('Method not implemented.'); }
        focusHover() { throw new Error('Method not implemented.'); }
        setActiveInstance(instance) { throw new Error('Method not implemented.'); }
        focusActiveInstance() { throw new Error('Method not implemented.'); }
        getInstanceFromResource(resource) { throw new Error('Method not implemented.'); }
        focusFindWidget() { throw new Error('Method not implemented.'); }
        hideFindWidget() { throw new Error('Method not implemented.'); }
        findNext() { throw new Error('Method not implemented.'); }
        findPrevious() { throw new Error('Method not implemented.'); }
        updateVisibility() { throw new Error('Method not implemented.'); }
    }
    exports.TestTerminalGroupService = TestTerminalGroupService;
    class TestTerminalProfileService {
        constructor() {
            this.availableProfiles = [];
            this.contributedProfiles = [];
            this.profilesReady = Promise.resolve();
            this.onDidChangeAvailableProfiles = event_1.Event.None;
        }
        getPlatformKey() { throw new Error('Method not implemented.'); }
        refreshAvailableProfiles() { throw new Error('Method not implemented.'); }
        getDefaultProfileName() { throw new Error('Method not implemented.'); }
        getDefaultProfile() { throw new Error('Method not implemented.'); }
        getContributedDefaultProfile(shellLaunchConfig) { throw new Error('Method not implemented.'); }
        registerContributedProfile(args) { throw new Error('Method not implemented.'); }
        getContributedProfileProvider(extensionIdentifier, id) { throw new Error('Method not implemented.'); }
        registerTerminalProfileProvider(extensionIdentifier, id, profileProvider) { throw new Error('Method not implemented.'); }
    }
    exports.TestTerminalProfileService = TestTerminalProfileService;
    class TestTerminalProfileResolverService {
        constructor() {
            this.defaultProfileName = '';
        }
        resolveIcon(shellLaunchConfig) { }
        async resolveShellLaunchConfig(shellLaunchConfig, options) { }
        async getDefaultProfile(options) { return { path: '/default', profileName: 'Default', isDefault: true }; }
        async getDefaultShell(options) { return '/default'; }
        async getDefaultShellArgs(options) { return []; }
        getDefaultIcon() { return codicons_1.Codicon.terminal; }
        async getEnvironment() { return process_1.env; }
        getSafeConfigValue(key, os) { return undefined; }
        getSafeConfigValueFullKey(key) { return undefined; }
        createProfileFromShellAndShellArgs(shell, shellArgs) { throw new Error('Method not implemented.'); }
    }
    exports.TestTerminalProfileResolverService = TestTerminalProfileResolverService;
    class TestQuickInputService {
        constructor() {
            this.onShow = event_1.Event.None;
            this.onHide = event_1.Event.None;
            this.quickAccess = undefined;
        }
        async pick(picks, options, token) {
            if (Array.isArray(picks)) {
                return { label: 'selectedPick', description: 'pick description', value: 'selectedPick' };
            }
            else {
                return undefined;
            }
        }
        async input(options, token) { return options ? 'resolved' + options.prompt : 'resolved'; }
        createQuickPick() { throw new Error('not implemented.'); }
        createInputBox() { throw new Error('not implemented.'); }
        createQuickWidget() { throw new Error('Method not implemented.'); }
        focus() { throw new Error('not implemented.'); }
        toggle() { throw new Error('not implemented.'); }
        navigate(next, quickNavigate) { throw new Error('not implemented.'); }
        accept() { throw new Error('not implemented.'); }
        back() { throw new Error('not implemented.'); }
        cancel() { throw new Error('not implemented.'); }
    }
    exports.TestQuickInputService = TestQuickInputService;
    class TestLanguageDetectionService {
        isEnabledForLanguage(languageId) { return false; }
        async detectLanguage(resource, supportedLangs) { return undefined; }
    }
    class TestRemoteAgentService {
        getConnection() { return null; }
        async getEnvironment() { return null; }
        async getRawEnvironment() { return null; }
        async getExtensionHostExitInfo(reconnectionToken) { return null; }
        async getDiagnosticInfo(options) { return undefined; }
        async updateTelemetryLevel(telemetryLevel) { }
        async logTelemetry(eventName, data) { }
        async flushTelemetry() { }
        async getRoundTripTime() { return undefined; }
    }
    exports.TestRemoteAgentService = TestRemoteAgentService;
    class TestRemoteExtensionsScannerService {
        async whenExtensionsReady() { }
        scanExtensions() { throw new Error('Method not implemented.'); }
        scanSingleExtension() { throw new Error('Method not implemented.'); }
    }
    exports.TestRemoteExtensionsScannerService = TestRemoteExtensionsScannerService;
    class TestWorkbenchExtensionEnablementService {
        constructor() {
            this.onEnablementChanged = event_1.Event.None;
        }
        getEnablementState(extension) { return 8 /* EnablementState.EnabledGlobally */; }
        getEnablementStates(extensions, workspaceTypeOverrides) { return []; }
        getDependenciesEnablementStates(extension) { return []; }
        canChangeEnablement(extension) { return true; }
        canChangeWorkspaceEnablement(extension) { return true; }
        isEnabled(extension) { return true; }
        isEnabledEnablementState(enablementState) { return true; }
        isDisabledGlobally(extension) { return false; }
        async setEnablement(extensions, state) { return []; }
        async updateExtensionsEnablementsWhenWorkspaceTrustChanges() { }
    }
    exports.TestWorkbenchExtensionEnablementService = TestWorkbenchExtensionEnablementService;
    class TestWorkbenchExtensionManagementService {
        constructor() {
            this.onInstallExtension = event_1.Event.None;
            this.onDidInstallExtensions = event_1.Event.None;
            this.onUninstallExtension = event_1.Event.None;
            this.onDidUninstallExtension = event_1.Event.None;
            this.onDidUpdateExtensionMetadata = event_1.Event.None;
            this.onProfileAwareInstallExtension = event_1.Event.None;
            this.onProfileAwareDidInstallExtensions = event_1.Event.None;
            this.onProfileAwareUninstallExtension = event_1.Event.None;
            this.onProfileAwareDidUninstallExtension = event_1.Event.None;
            this.onDidChangeProfile = event_1.Event.None;
            this.onDidEnableExtensions = event_1.Event.None;
        }
        installVSIX(location, manifest, installOptions) {
            throw new Error('Method not implemented.');
        }
        installFromLocation(location) {
            throw new Error('Method not implemented.');
        }
        installGalleryExtensions(extensions) {
            throw new Error('Method not implemented.');
        }
        async updateFromGallery(gallery, extension, installOptions) { return extension; }
        zip(extension) {
            throw new Error('Method not implemented.');
        }
        unzip(zipLocation) {
            throw new Error('Method not implemented.');
        }
        getManifest(vsix) {
            throw new Error('Method not implemented.');
        }
        install(vsix, options) {
            throw new Error('Method not implemented.');
        }
        async canInstall(extension) { return false; }
        installFromGallery(extension, options) {
            throw new Error('Method not implemented.');
        }
        uninstall(extension, options) {
            throw new Error('Method not implemented.');
        }
        async reinstallFromGallery(extension) {
            throw new Error('Method not implemented.');
        }
        async getInstalled(type) { return []; }
        getExtensionsControlManifest() {
            throw new Error('Method not implemented.');
        }
        async updateMetadata(local, metadata) { return local; }
        registerParticipant(pariticipant) { }
        async getTargetPlatform() { return "undefined" /* TargetPlatform.UNDEFINED */; }
        async cleanUp() { }
        download() {
            throw new Error('Method not implemented.');
        }
        copyExtensions() { throw new Error('Not Supported'); }
        toggleAppliationScope() { throw new Error('Not Supported'); }
        installExtensionsFromProfile() { throw new Error('Not Supported'); }
        whenProfileChanged(from, to) { throw new Error('Not Supported'); }
        getInstalledWorkspaceExtensions() { throw new Error('Method not implemented.'); }
        installResourceExtension() { throw new Error('Method not implemented.'); }
        getExtensions() { throw new Error('Method not implemented.'); }
    }
    exports.TestWorkbenchExtensionManagementService = TestWorkbenchExtensionManagementService;
    class TestUserDataProfileService {
        constructor() {
            this.onDidChangeCurrentProfile = event_1.Event.None;
            this.currentProfile = (0, userDataProfile_1.toUserDataProfile)('test', 'test', uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }), uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }));
        }
        async updateCurrentProfile() { }
        getShortName(profile) { return profile.shortName ?? profile.name; }
    }
    exports.TestUserDataProfileService = TestUserDataProfileService;
    class TestWebExtensionsScannerService {
        constructor() {
            this.onDidChangeProfile = event_1.Event.None;
        }
        async scanSystemExtensions() { return []; }
        async scanUserExtensions() { return []; }
        async scanExtensionsUnderDevelopment() { return []; }
        async copyExtensions() {
            throw new Error('Method not implemented.');
        }
        scanExistingExtension(extensionLocation, extensionType) {
            throw new Error('Method not implemented.');
        }
        addExtension(location, metadata) {
            throw new Error('Method not implemented.');
        }
        addExtensionFromGallery(galleryExtension, metadata) {
            throw new Error('Method not implemented.');
        }
        removeExtension() {
            throw new Error('Method not implemented.');
        }
        updateMetadata(extension, metaData, profileLocation) {
            throw new Error('Method not implemented.');
        }
        scanExtensionManifest(extensionLocation) {
            throw new Error('Method not implemented.');
        }
    }
    exports.TestWebExtensionsScannerService = TestWebExtensionsScannerService;
    async function workbenchTeardown(instantiationService) {
        return instantiationService.invokeFunction(async (accessor) => {
            const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            for (const workingCopy of workingCopyService.workingCopies) {
                await workingCopy.revert();
            }
            for (const group of editorGroupService.groups) {
                await group.closeAllEditors();
            }
            for (const group of editorGroupService.groups) {
                editorGroupService.removeGroup(group);
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoVGVzdFNlcnZpY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvYnJvd3Nlci93b3JrYmVuY2hUZXN0U2VydmljZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUxoRyxzREFFQztJQTJERCxzRUFzSEM7SUFtMkJELHdEQUVDO0lBRUQsb0RBRUM7SUF3VkQsZ0RBNkRDO0lBRUQsd0RBYUM7SUFFRCxnRUFnQkM7SUFFRCxvRUFlQztJQTBKRCw0Q0FvQkM7SUFvREQsMERBSUM7SUF3VEQsOENBaUJDO0lBbGhFRCxTQUFnQixxQkFBcUIsQ0FBQyxvQkFBMkMsRUFBRSxRQUFhO1FBQy9GLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlDQUFlLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDekksQ0FBQztJQUVELG1CQUFRLENBQUMsRUFBRSxDQUF5Qix5QkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQztRQUU3RixNQUFNLEVBQUUsNEJBQW9CO1FBRTVCLGdCQUFnQixFQUFFLENBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxpQkFBaUIsRUFBRSxvQkFBb0IsRUFBb0IsRUFBRTtZQUN6TCxPQUFPLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpQ0FBZSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUsbUJBQW1CLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUMxTCxDQUFDO1FBRUQs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