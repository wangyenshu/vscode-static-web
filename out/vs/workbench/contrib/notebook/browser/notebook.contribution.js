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
define(["require", "exports", "vs/base/common/network", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/jsonFormatter", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/browser/services/notebookServiceImpl", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/editor/common/editorService", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/workbench/contrib/notebook/common/notebookDiffEditorInput", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditor", "vs/workbench/contrib/notebook/common/services/notebookWorkerService", "vs/workbench/contrib/notebook/browser/services/notebookWorkerServiceImpl", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/browser/services/notebookCellStatusBarServiceImpl", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/browser/services/notebookEditorServiceImpl", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/base/common/event", "vs/workbench/contrib/notebook/browser/diff/diffElementViewModel", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverServiceImpl", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/browser/services/notebookKernelServiceImpl", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/platform/configuration/common/configuration", "vs/platform/label/common/label", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/notebook/browser/services/notebookRendererMessagingServiceImpl", "vs/workbench/contrib/notebook/common/notebookRendererMessagingService", "vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineProviderFactory", "vs/editor/common/config/editorOptions", "vs/workbench/contrib/notebook/browser/services/notebookExecutionStateServiceImpl", "vs/workbench/contrib/notebook/browser/services/notebookExecutionServiceImpl", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookKeymapService", "vs/workbench/contrib/notebook/browser/services/notebookKeymapServiceImpl", "vs/editor/common/languages/modesRegistry", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/editor/common/services/languageFeatures", "vs/workbench/contrib/comments/browser/commentReply", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/notebook/browser/services/notebookKernelHistoryServiceImpl", "vs/workbench/contrib/notebook/common/notebookLoggingService", "vs/workbench/contrib/notebook/browser/services/notebookLoggingServiceImpl", "vs/platform/product/common/product", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookAccessibility", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/notebook/browser/contrib/notebookVariables/notebookVariables", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/controller/insertCellActions", "vs/workbench/contrib/notebook/browser/controller/executeActions", "vs/workbench/contrib/notebook/browser/controller/sectionActions", "vs/workbench/contrib/notebook/browser/controller/layoutActions", "vs/workbench/contrib/notebook/browser/controller/editActions", "vs/workbench/contrib/notebook/browser/controller/cellOutputActions", "vs/workbench/contrib/notebook/browser/controller/apiActions", "vs/workbench/contrib/notebook/browser/controller/foldingController", "vs/workbench/contrib/notebook/browser/controller/chat/notebook.chat.contribution", "vs/workbench/contrib/notebook/browser/contrib/editorHint/emptyCellEditorHint", "vs/workbench/contrib/notebook/browser/contrib/clipboard/notebookClipboard", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFind", "vs/workbench/contrib/notebook/browser/contrib/format/formatting", "vs/workbench/contrib/notebook/browser/contrib/saveParticipants/saveParticipants", "vs/workbench/contrib/notebook/browser/contrib/gettingStarted/notebookGettingStarted", "vs/workbench/contrib/notebook/browser/contrib/layout/layoutActions", "vs/workbench/contrib/notebook/browser/contrib/marker/markerProvider", "vs/workbench/contrib/notebook/browser/contrib/navigation/arrow", "vs/workbench/contrib/notebook/browser/contrib/outline/notebookOutline", "vs/workbench/contrib/notebook/browser/contrib/profile/notebookProfile", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/statusBarProviders", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/contributedStatusBarItemController", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/executionStatusBarItemController", "vs/workbench/contrib/notebook/browser/contrib/editorStatusBar/editorStatusBar", "vs/workbench/contrib/notebook/browser/contrib/undoRedo/notebookUndoRedo", "vs/workbench/contrib/notebook/browser/contrib/cellCommands/cellCommands", "vs/workbench/contrib/notebook/browser/contrib/viewportWarmup/viewportWarmup", "vs/workbench/contrib/notebook/browser/contrib/troubleshoot/layout", "vs/workbench/contrib/notebook/browser/contrib/debug/notebookBreakpoints", "vs/workbench/contrib/notebook/browser/contrib/debug/notebookCellPausing", "vs/workbench/contrib/notebook/browser/contrib/debug/notebookDebugDecorations", "vs/workbench/contrib/notebook/browser/contrib/execute/executionEditorProgress", "vs/workbench/contrib/notebook/browser/contrib/kernelDetection/notebookKernelDetection", "vs/workbench/contrib/notebook/browser/diff/notebookDiffActions"], function (require, exports, network_1, lifecycle_1, marshalling_1, resources_1, types_1, uri_1, jsonFormatter_1, model_1, language_1, resolverService_1, nls, configurationRegistry_1, descriptors_1, extensions_1, instantiation_1, platform_1, editor_1, contributions_1, editor_2, notebookEditor_1, notebookEditorInput_1, notebookService_1, notebookServiceImpl_1, notebookCommon_1, editorService_1, undoRedo_1, notebookEditorModelResolverService_1, notebookDiffEditorInput_1, notebookDiffEditor_1, notebookWorkerService_1, notebookWorkerServiceImpl_1, notebookCellStatusBarService_1, notebookCellStatusBarServiceImpl_1, notebookEditorService_1, notebookEditorServiceImpl_1, jsonContributionRegistry_1, event_1, diffElementViewModel_1, notebookEditorModelResolverServiceImpl_1, notebookKernelService_1, notebookKernelServiceImpl_1, extensions_2, workingCopyEditorService_1, configuration_1, label_1, editorGroupsService_1, notebookRendererMessagingServiceImpl_1, notebookRendererMessagingService_1, notebookOutlineProviderFactory_1, editorOptions_1, notebookExecutionStateServiceImpl_1, notebookExecutionServiceImpl_1, notebookExecutionService_1, notebookKeymapService_1, notebookKeymapServiceImpl_1, modesRegistry_1, notebookExecutionStateService_1, languageFeatures_1, commentReply_1, codeEditorService_1, notebookKernelHistoryServiceImpl_1, notebookLoggingService_1, notebookLoggingServiceImpl_1, product_1, notebookContextKeys_1, notebookAccessibility_1, accessibleView_1, contextkey_1, accessibleViewActions_1, notebookVariables_1) {
    "use strict";
    var NotebookContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookContribution = void 0;
    /*--------------------------------------------------------------------------------------------- */
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(notebookEditor_1.NotebookEditor, notebookEditor_1.NotebookEditor.ID, 'Notebook Editor'), [
        new descriptors_1.SyncDescriptor(notebookEditorInput_1.NotebookEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(notebookDiffEditor_1.NotebookTextDiffEditor, notebookDiffEditor_1.NotebookTextDiffEditor.ID, 'Notebook Diff Editor'), [
        new descriptors_1.SyncDescriptor(notebookDiffEditorInput_1.NotebookDiffEditorInput)
    ]);
    class NotebookDiffEditorSerializer {
        canSerialize() {
            return true;
        }
        serialize(input) {
            (0, types_1.assertType)(input instanceof notebookDiffEditorInput_1.NotebookDiffEditorInput);
            return JSON.stringify({
                resource: input.resource,
                originalResource: input.original.resource,
                name: input.getName(),
                originalName: input.original.getName(),
                textDiffName: input.getName(),
                viewType: input.viewType,
            });
        }
        deserialize(instantiationService, raw) {
            const data = (0, marshalling_1.parse)(raw);
            if (!data) {
                return undefined;
            }
            const { resource, originalResource, name, viewType } = data;
            if (!data || !uri_1.URI.isUri(resource) || !uri_1.URI.isUri(originalResource) || typeof name !== 'string' || typeof viewType !== 'string') {
                return undefined;
            }
            const input = notebookDiffEditorInput_1.NotebookDiffEditorInput.create(instantiationService, resource, name, undefined, originalResource, viewType);
            return input;
        }
        static canResolveBackup(editorInput, backupResource) {
            return false;
        }
    }
    class NotebookEditorSerializer {
        canSerialize() {
            return true;
        }
        serialize(input) {
            (0, types_1.assertType)(input instanceof notebookEditorInput_1.NotebookEditorInput);
            const data = {
                resource: input.resource,
                preferredResource: input.preferredResource,
                viewType: input.viewType,
                options: input.options
            };
            return JSON.stringify(data);
        }
        deserialize(instantiationService, raw) {
            const data = (0, marshalling_1.parse)(raw);
            if (!data) {
                return undefined;
            }
            const { resource, preferredResource, viewType, options } = data;
            if (!data || !uri_1.URI.isUri(resource) || typeof viewType !== 'string') {
                return undefined;
            }
            const input = notebookEditorInput_1.NotebookEditorInput.getOrCreate(instantiationService, resource, preferredResource, viewType, options);
            return input;
        }
    }
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(notebookEditorInput_1.NotebookEditorInput.ID, NotebookEditorSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(notebookDiffEditorInput_1.NotebookDiffEditorInput.ID, NotebookDiffEditorSerializer);
    let NotebookContribution = class NotebookContribution extends lifecycle_1.Disposable {
        static { NotebookContribution_1 = this; }
        static { this.ID = 'workbench.contrib.notebook'; }
        constructor(undoRedoService, configurationService, codeEditorService) {
            super();
            this.codeEditorService = codeEditorService;
            this.updateCellUndoRedoComparisonKey(configurationService, undoRedoService);
            // Watch for changes to undoRedoPerCell setting
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.undoRedoPerCell)) {
                    this.updateCellUndoRedoComparisonKey(configurationService, undoRedoService);
                }
            }));
            // register comment decoration
            this.codeEditorService.registerDecorationType('comment-controller', commentReply_1.COMMENTEDITOR_DECORATION_KEY, {});
        }
        // Add or remove the cell undo redo comparison key based on the user setting
        updateCellUndoRedoComparisonKey(configurationService, undoRedoService) {
            const undoRedoPerCell = configurationService.getValue(notebookCommon_1.NotebookSetting.undoRedoPerCell);
            if (!undoRedoPerCell) {
                // Add comparison key to map cell => main document
                if (!this._uriComparisonKeyComputer) {
                    this._uriComparisonKeyComputer = undoRedoService.registerUriComparisonKeyComputer(notebookCommon_1.CellUri.scheme, {
                        getComparisonKey: (uri) => {
                            if (undoRedoPerCell) {
                                return uri.toString();
                            }
                            return NotebookContribution_1._getCellUndoRedoComparisonKey(uri);
                        }
                    });
                }
            }
            else {
                // Dispose comparison key
                this._uriComparisonKeyComputer?.dispose();
                this._uriComparisonKeyComputer = undefined;
            }
        }
        static _getCellUndoRedoComparisonKey(uri) {
            const data = notebookCommon_1.CellUri.parse(uri);
            if (!data) {
                return uri.toString();
            }
            return data.notebook.toString();
        }
        dispose() {
            super.dispose();
            this._uriComparisonKeyComputer?.dispose();
        }
    };
    exports.NotebookContribution = NotebookContribution;
    exports.NotebookContribution = NotebookContribution = NotebookContribution_1 = __decorate([
        __param(0, undoRedo_1.IUndoRedoService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, codeEditorService_1.ICodeEditorService)
    ], NotebookContribution);
    let CellContentProvider = class CellContentProvider {
        static { this.ID = 'workbench.contrib.cellContentProvider'; }
        constructor(textModelService, _modelService, _languageService, _notebookModelResolverService) {
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._notebookModelResolverService = _notebookModelResolverService;
            this._registration = textModelService.registerTextModelContentProvider(notebookCommon_1.CellUri.scheme, this);
        }
        dispose() {
            this._registration.dispose();
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const data = notebookCommon_1.CellUri.parse(resource);
            // const data = parseCellUri(resource);
            if (!data) {
                return null;
            }
            const ref = await this._notebookModelResolverService.resolve(data.notebook);
            let result = null;
            if (!ref.object.isResolved()) {
                return null;
            }
            for (const cell of ref.object.notebook.cells) {
                if (cell.uri.toString() === resource.toString()) {
                    const bufferFactory = {
                        create: (defaultEOL) => {
                            const newEOL = (defaultEOL === 2 /* DefaultEndOfLine.CRLF */ ? '\r\n' : '\n');
                            cell.textBuffer.setEOL(newEOL);
                            return { textBuffer: cell.textBuffer, disposable: lifecycle_1.Disposable.None };
                        },
                        getFirstLineText: (limit) => {
                            return cell.textBuffer.getLineContent(1).substring(0, limit);
                        }
                    };
                    const languageId = this._languageService.getLanguageIdByLanguageName(cell.language);
                    const languageSelection = languageId ? this._languageService.createById(languageId) : (cell.cellKind === notebookCommon_1.CellKind.Markup ? this._languageService.createById('markdown') : this._languageService.createByFilepathOrFirstLine(resource, cell.textBuffer.getLineContent(1)));
                    result = this._modelService.createModel(bufferFactory, languageSelection, resource);
                    break;
                }
            }
            if (!result) {
                ref.dispose();
                return null;
            }
            const once = event_1.Event.any(result.onWillDispose, ref.object.notebook.onWillDispose)(() => {
                once.dispose();
                ref.dispose();
            });
            return result;
        }
    };
    CellContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService),
        __param(3, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], CellContentProvider);
    let CellInfoContentProvider = class CellInfoContentProvider {
        static { this.ID = 'workbench.contrib.cellInfoContentProvider'; }
        constructor(textModelService, _modelService, _languageService, _labelService, _notebookModelResolverService) {
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._labelService = _labelService;
            this._notebookModelResolverService = _notebookModelResolverService;
            this._disposables = [];
            this._disposables.push(textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeNotebookCellMetadata, {
                provideTextContent: this.provideMetadataTextContent.bind(this)
            }));
            this._disposables.push(textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeNotebookCellOutput, {
                provideTextContent: this.provideOutputTextContent.bind(this)
            }));
            this._disposables.push(this._labelService.registerFormatter({
                scheme: network_1.Schemas.vscodeNotebookCellMetadata,
                formatting: {
                    label: '${path} (metadata)',
                    separator: '/'
                }
            }));
            this._disposables.push(this._labelService.registerFormatter({
                scheme: network_1.Schemas.vscodeNotebookCellOutput,
                formatting: {
                    label: '${path} (output)',
                    separator: '/'
                }
            }));
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._disposables);
        }
        async provideMetadataTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const data = notebookCommon_1.CellUri.parseCellPropertyUri(resource, network_1.Schemas.vscodeNotebookCellMetadata);
            if (!data) {
                return null;
            }
            const ref = await this._notebookModelResolverService.resolve(data.notebook);
            let result = null;
            const mode = this._languageService.createById('json');
            for (const cell of ref.object.notebook.cells) {
                if (cell.handle === data.handle) {
                    const metadataSource = (0, diffElementViewModel_1.getFormattedMetadataJSON)(ref.object.notebook, cell.metadata, cell.language);
                    result = this._modelService.createModel(metadataSource, mode, resource);
                    break;
                }
            }
            if (!result) {
                ref.dispose();
                return null;
            }
            const once = result.onWillDispose(() => {
                once.dispose();
                ref.dispose();
            });
            return result;
        }
        parseStreamOutput(op) {
            if (!op) {
                return;
            }
            const streamOutputData = (0, diffElementViewModel_1.getStreamOutputData)(op.outputs);
            if (streamOutputData) {
                return {
                    content: streamOutputData,
                    mode: this._languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID)
                };
            }
            return;
        }
        _getResult(data, cell) {
            let result = undefined;
            const mode = this._languageService.createById('json');
            const op = cell.outputs.find(op => op.outputId === data.outputId || op.alternativeOutputId === data.outputId);
            const streamOutputData = this.parseStreamOutput(op);
            if (streamOutputData) {
                result = streamOutputData;
                return result;
            }
            const obj = cell.outputs.map(output => ({
                metadata: output.metadata,
                outputItems: output.outputs.map(opit => ({
                    mimeType: opit.mime,
                    data: opit.data.toString()
                }))
            }));
            const outputSource = (0, jsonFormatter_1.toFormattedString)(obj, {});
            result = {
                content: outputSource,
                mode
            };
            return result;
        }
        async provideOutputTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const data = notebookCommon_1.CellUri.parseCellOutputUri(resource);
            if (!data) {
                return null;
            }
            const ref = await this._notebookModelResolverService.resolve(data.notebook);
            const cell = ref.object.notebook.cells.find(cell => !!cell.outputs.find(op => op.outputId === data.outputId || op.alternativeOutputId === data.outputId));
            if (!cell) {
                ref.dispose();
                return null;
            }
            const result = this._getResult(data, cell);
            if (!result) {
                ref.dispose();
                return null;
            }
            const model = this._modelService.createModel(result.content, result.mode, resource);
            const cellModelListener = event_1.Event.any(cell.onDidChangeOutputs ?? event_1.Event.None, cell.onDidChangeOutputItems ?? event_1.Event.None)(() => {
                const newResult = this._getResult(data, cell);
                if (!newResult) {
                    return;
                }
                model.setValue(newResult.content);
                model.setLanguage(newResult.mode.languageId);
            });
            const once = model.onWillDispose(() => {
                once.dispose();
                cellModelListener.dispose();
                ref.dispose();
            });
            return model;
        }
    };
    CellInfoContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService),
        __param(3, label_1.ILabelService),
        __param(4, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], CellInfoContentProvider);
    class RegisterSchemasContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.registerCellSchemas'; }
        constructor() {
            super();
            this.registerMetadataSchemas();
        }
        registerMetadataSchemas() {
            const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
            const metadataSchema = {
                properties: {
                    ['language']: {
                        type: 'string',
                        description: 'The language for the cell'
                    }
                },
                // patternProperties: allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            jsonRegistry.registerSchema('vscode://schemas/notebook/cellmetadata', metadataSchema);
        }
    }
    let NotebookEditorManager = class NotebookEditorManager {
        static { this.ID = 'workbench.contrib.notebookEditorManager'; }
        constructor(_editorService, _notebookEditorModelService, editorGroups) {
            this._editorService = _editorService;
            this._notebookEditorModelService = _notebookEditorModelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._disposables.add(event_1.Event.debounce(this._notebookEditorModelService.onDidChangeDirty, (last, current) => !last ? [current] : [...last, current], 100)(this._openMissingDirtyNotebookEditors, this));
            // CLOSE editors when we are about to open conflicting notebooks
            this._disposables.add(_notebookEditorModelService.onWillFailWithConflict(e => {
                for (const group of editorGroups.groups) {
                    const conflictInputs = group.editors.filter(input => input instanceof notebookEditorInput_1.NotebookEditorInput && input.viewType !== e.viewType && (0, resources_1.isEqual)(input.resource, e.resource));
                    const p = group.closeEditors(conflictInputs);
                    e.waitUntil(p);
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
        }
        _openMissingDirtyNotebookEditors(models) {
            const result = [];
            for (const model of models) {
                if (model.isDirty() && !this._editorService.isOpened({ resource: model.resource, typeId: notebookEditorInput_1.NotebookEditorInput.ID, editorId: model.viewType }) && (0, resources_1.extname)(model.resource) !== '.interactive') {
                    result.push({
                        resource: model.resource,
                        options: { inactive: true, preserveFocus: true, pinned: true, override: model.viewType }
                    });
                }
            }
            if (result.length > 0) {
                this._editorService.openEditors(result);
            }
        }
    };
    NotebookEditorManager = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, notebookEditorModelResolverService_1.INotebookEditorModelResolverService),
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NotebookEditorManager);
    let SimpleNotebookWorkingCopyEditorHandler = class SimpleNotebookWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.simpleNotebookWorkingCopyEditorHandler'; }
        constructor(_instantiationService, _workingCopyEditorService, _extensionService, _notebookService) {
            super();
            this._instantiationService = _instantiationService;
            this._workingCopyEditorService = _workingCopyEditorService;
            this._extensionService = _extensionService;
            this._notebookService = _notebookService;
            this._installHandler();
        }
        async handles(workingCopy) {
            const viewType = this.handlesSync(workingCopy);
            if (!viewType) {
                return false;
            }
            return this._notebookService.canResolve(viewType);
        }
        handlesSync(workingCopy) {
            const viewType = this._getViewType(workingCopy);
            if (!viewType || viewType === 'interactive') {
                return undefined;
            }
            return viewType;
        }
        isOpen(workingCopy, editor) {
            if (!this.handlesSync(workingCopy)) {
                return false;
            }
            return editor instanceof notebookEditorInput_1.NotebookEditorInput && editor.viewType === this._getViewType(workingCopy) && (0, resources_1.isEqual)(workingCopy.resource, editor.resource);
        }
        createEditor(workingCopy) {
            return notebookEditorInput_1.NotebookEditorInput.getOrCreate(this._instantiationService, workingCopy.resource, undefined, this._getViewType(workingCopy));
        }
        async _installHandler() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            this._register(this._workingCopyEditorService.registerHandler(this));
        }
        _getViewType(workingCopy) {
            return notebookCommon_1.NotebookWorkingCopyTypeIdentifier.parse(workingCopy.typeId);
        }
    };
    SimpleNotebookWorkingCopyEditorHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(2, extensions_2.IExtensionService),
        __param(3, notebookService_1.INotebookService)
    ], SimpleNotebookWorkingCopyEditorHandler);
    let NotebookLanguageSelectorScoreRefine = class NotebookLanguageSelectorScoreRefine {
        static { this.ID = 'workbench.contrib.notebookLanguageSelectorScoreRefine'; }
        constructor(_notebookService, languageFeaturesService) {
            this._notebookService = _notebookService;
            languageFeaturesService.setNotebookTypeResolver(this._getNotebookInfo.bind(this));
        }
        _getNotebookInfo(uri) {
            const cellUri = notebookCommon_1.CellUri.parse(uri);
            if (!cellUri) {
                return undefined;
            }
            const notebook = this._notebookService.getNotebookTextModel(cellUri.notebook);
            if (!notebook) {
                return undefined;
            }
            return {
                uri: notebook.uri,
                type: notebook.viewType
            };
        }
    };
    NotebookLanguageSelectorScoreRefine = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, languageFeatures_1.ILanguageFeaturesService)
    ], NotebookLanguageSelectorScoreRefine);
    class NotebookAccessibilityHelpContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(105, 'notebook', async (accessor) => {
                const activeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getActiveCodeEditor()
                    || accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor()
                    || accessor.get(editorService_1.IEditorService).activeEditorPane;
                if (activeEditor) {
                    (0, notebookAccessibility_1.runAccessibilityHelpAction)(accessor, activeEditor);
                }
            }, notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR));
        }
    }
    class NotebookAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(100, 'notebook', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const editorService = accessor.get(editorService_1.IEditorService);
                return (0, notebookAccessibility_1.showAccessibleOutput)(accessibleViewService, editorService);
            }, contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED, contextkey_1.ContextKeyExpr.equals('resourceExtname', '.ipynb'))));
        }
    }
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    (0, contributions_1.registerWorkbenchContribution2)(NotebookContribution.ID, NotebookContribution, 1 /* WorkbenchPhase.BlockStartup */);
    (0, contributions_1.registerWorkbenchContribution2)(CellContentProvider.ID, CellContentProvider, 1 /* WorkbenchPhase.BlockStartup */);
    (0, contributions_1.registerWorkbenchContribution2)(CellInfoContentProvider.ID, CellInfoContentProvider, 1 /* WorkbenchPhase.BlockStartup */);
    (0, contributions_1.registerWorkbenchContribution2)(RegisterSchemasContribution.ID, RegisterSchemasContribution, 1 /* WorkbenchPhase.BlockStartup */);
    (0, contributions_1.registerWorkbenchContribution2)(NotebookEditorManager.ID, NotebookEditorManager, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(NotebookLanguageSelectorScoreRefine.ID, NotebookLanguageSelectorScoreRefine, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(SimpleNotebookWorkingCopyEditorHandler.ID, SimpleNotebookWorkingCopyEditorHandler, 2 /* WorkbenchPhase.BlockRestore */);
    workbenchContributionsRegistry.registerWorkbenchContribution(NotebookAccessibilityHelpContribution, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(NotebookAccessibleViewContribution, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(notebookVariables_1.NotebookVariables, 4 /* LifecyclePhase.Eventually */);
    (0, extensions_1.registerSingleton)(notebookService_1.INotebookService, notebookServiceImpl_1.NotebookService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookWorkerService_1.INotebookEditorWorkerService, notebookWorkerServiceImpl_1.NotebookEditorWorkerServiceImpl, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookEditorModelResolverService_1.INotebookEditorModelResolverService, notebookEditorModelResolverServiceImpl_1.NotebookModelResolverServiceImpl, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookCellStatusBarService_1.INotebookCellStatusBarService, notebookCellStatusBarServiceImpl_1.NotebookCellStatusBarService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookEditorService_1.INotebookEditorService, notebookEditorServiceImpl_1.NotebookEditorWidgetService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookKernelService_1.INotebookKernelService, notebookKernelServiceImpl_1.NotebookKernelService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookKernelService_1.INotebookKernelHistoryService, notebookKernelHistoryServiceImpl_1.NotebookKernelHistoryService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookExecutionService_1.INotebookExecutionService, notebookExecutionServiceImpl_1.NotebookExecutionService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookExecutionStateService_1.INotebookExecutionStateService, notebookExecutionStateServiceImpl_1.NotebookExecutionStateService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookRendererMessagingService_1.INotebookRendererMessagingService, notebookRendererMessagingServiceImpl_1.NotebookRendererMessagingService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookKeymapService_1.INotebookKeymapService, notebookKeymapServiceImpl_1.NotebookKeymapService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookLoggingService_1.INotebookLoggingService, notebookLoggingServiceImpl_1.NotebookLoggingService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(notebookOutlineProviderFactory_1.INotebookCellOutlineProviderFactory, notebookOutlineProviderFactory_1.NotebookCellOutlineProviderFactory, 1 /* InstantiationType.Delayed */);
    const schemas = {};
    function isConfigurationPropertySchema(x) {
        return (typeof x.type !== 'undefined' || typeof x.anyOf !== 'undefined');
    }
    for (const editorOption of editorOptions_1.editorOptionsRegistry) {
        const schema = editorOption.schema;
        if (schema) {
            if (isConfigurationPropertySchema(schema)) {
                schemas[`editor.${editorOption.name}`] = schema;
            }
            else {
                for (const key in schema) {
                    if (Object.hasOwnProperty.call(schema, key)) {
                        schemas[key] = schema[key];
                    }
                }
            }
        }
    }
    const editorOptionsCustomizationSchema = {
        description: nls.localize('notebook.editorOptions.experimentalCustomization', 'Settings for code editors used in notebooks. This can be used to customize most editor.* settings.'),
        default: {},
        allOf: [
            {
                properties: schemas,
            }
            // , {
            // 	patternProperties: {
            // 		'^\\[.*\\]$': {
            // 			type: 'object',
            // 			default: {},
            // 			properties: schemas
            // 		}
            // 	}
            // }
        ],
        tags: ['notebookLayout']
    };
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'notebook',
        order: 100,
        title: nls.localize('notebookConfigurationTitle', "Notebook"),
        type: 'object',
        properties: {
            [notebookCommon_1.NotebookSetting.displayOrder]: {
                description: nls.localize('notebook.displayOrder.description', "Priority list for output mime types"),
                type: 'array',
                items: {
                    type: 'string'
                },
                default: []
            },
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: {
                description: nls.localize('notebook.cellToolbarLocation.description', "Where the cell toolbar should be shown, or whether it should be hidden."),
                type: 'object',
                additionalProperties: {
                    markdownDescription: nls.localize('notebook.cellToolbarLocation.viewType', "Configure the cell toolbar position for for specific file types"),
                    type: 'string',
                    enum: ['left', 'right', 'hidden']
                },
                default: {
                    'default': 'right'
                },
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: {
                description: nls.localize('notebook.showCellStatusbar.description', "Whether the cell status bar should be shown."),
                type: 'string',
                enum: ['hidden', 'visible', 'visibleAfterExecute'],
                enumDescriptions: [
                    nls.localize('notebook.showCellStatusbar.hidden.description', "The cell Status bar is always hidden."),
                    nls.localize('notebook.showCellStatusbar.visible.description', "The cell Status bar is always visible."),
                    nls.localize('notebook.showCellStatusbar.visibleAfterExecute.description', "The cell Status bar is hidden until the cell has executed. Then it becomes visible to show the execution status.")
                ],
                default: 'visible',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.textDiffEditorPreview]: {
                description: nls.localize('notebook.diff.enablePreview.description', "Whether to use the enhanced text diff editor for notebook."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.diffOverviewRuler]: {
                description: nls.localize('notebook.diff.enableOverviewRuler.description', "Whether to render the overview ruler in the diff editor for notebook."),
                type: 'boolean',
                default: false,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.cellToolbarVisibility]: {
                markdownDescription: nls.localize('notebook.cellToolbarVisibility.description', "Whether the cell toolbar should appear on hover or click."),
                type: 'string',
                enum: ['hover', 'click'],
                default: 'click',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: {
                description: nls.localize('notebook.undoRedoPerCell.description', "Whether to use separate undo/redo stack for each cell."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.compactView]: {
                description: nls.localize('notebook.compactView.description', "Control whether the notebook editor should be rendered in a compact form. For example, when turned on, it will decrease the left margin width."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.focusIndicator]: {
                description: nls.localize('notebook.focusIndicator.description', "Controls where the focus indicator is rendered, either along the cell borders or on the left gutter."),
                type: 'string',
                enum: ['border', 'gutter'],
                default: 'gutter',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: {
                description: nls.localize('notebook.insertToolbarPosition.description', "Control where the insert cell actions should appear."),
                type: 'string',
                enum: ['betweenCells', 'notebookToolbar', 'both', 'hidden'],
                enumDescriptions: [
                    nls.localize('insertToolbarLocation.betweenCells', "A toolbar that appears on hover between cells."),
                    nls.localize('insertToolbarLocation.notebookToolbar', "The toolbar at the top of the notebook editor."),
                    nls.localize('insertToolbarLocation.both', "Both toolbars."),
                    nls.localize('insertToolbarLocation.hidden', "The insert actions don't appear anywhere."),
                ],
                default: 'both',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.globalToolbar]: {
                description: nls.localize('notebook.globalToolbar.description', "Control whether to render a global toolbar inside the notebook editor."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.stickyScrollEnabled]: {
                description: nls.localize('notebook.stickyScrollEnabled.description', "Experimental. Control whether to render notebook Sticky Scroll headers in the notebook editor."),
                type: 'boolean',
                default: false,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.stickyScrollMode]: {
                description: nls.localize('notebook.stickyScrollMode.description', "Control whether nested sticky lines appear to stack flat or indented."),
                type: 'string',
                enum: ['flat', 'indented'],
                enumDescriptions: [
                    nls.localize('notebook.stickyScrollMode.flat', "Nested sticky lines appear flat."),
                    nls.localize('notebook.stickyScrollMode.indented', "Nested sticky lines appear indented."),
                ],
                default: 'indented',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.consolidatedOutputButton]: {
                description: nls.localize('notebook.consolidatedOutputButton.description', "Control whether outputs action should be rendered in the output toolbar."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.showFoldingControls]: {
                description: nls.localize('notebook.showFoldingControls.description', "Controls when the Markdown header folding arrow is shown."),
                type: 'string',
                enum: ['always', 'never', 'mouseover'],
                enumDescriptions: [
                    nls.localize('showFoldingControls.always', "The folding controls are always visible."),
                    nls.localize('showFoldingControls.never', "Never show the folding controls and reduce the gutter size."),
                    nls.localize('showFoldingControls.mouseover', "The folding controls are visible only on mouseover."),
                ],
                default: 'mouseover',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.dragAndDropEnabled]: {
                description: nls.localize('notebook.dragAndDrop.description', "Control whether the notebook editor should allow moving cells through drag and drop."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: {
                description: nls.localize('notebook.consolidatedRunButton.description', "Control whether extra actions are shown in a dropdown next to the run button."),
                type: 'boolean',
                default: false,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.globalToolbarShowLabel]: {
                description: nls.localize('notebook.globalToolbarShowLabel', "Control whether the actions on the notebook toolbar should render label or not."),
                type: 'string',
                enum: ['always', 'never', 'dynamic'],
                default: 'always',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.textOutputLineLimit]: {
                markdownDescription: nls.localize('notebook.textOutputLineLimit', "Controls how many lines of text are displayed in a text output. If {0} is enabled, this setting is used to determine the scroll height of the output.", '`#notebook.output.scrolling#`'),
                type: 'number',
                default: 30,
                tags: ['notebookLayout', 'notebookOutputLayout'],
                minimum: 1,
            },
            [notebookCommon_1.NotebookSetting.LinkifyOutputFilePaths]: {
                description: nls.localize('notebook.disableOutputFilePathLinks', "Control whether to disable filepath links in the output of notebook cells."),
                type: 'boolean',
                default: true,
                tags: ['notebookOutputLayout']
            },
            [notebookCommon_1.NotebookSetting.minimalErrorRendering]: {
                description: nls.localize('notebook.minimalErrorRendering', "Control whether to render error output in a minimal style."),
                type: 'boolean',
                default: false,
                tags: ['notebookOutputLayout']
            },
            [notebookCommon_1.NotebookSetting.markupFontSize]: {
                markdownDescription: nls.localize('notebook.markup.fontSize', "Controls the font size in pixels of rendered markup in notebooks. When set to {0}, 120% of {1} is used.", '`0`', '`#editor.fontSize#`'),
                type: 'number',
                default: 0,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations]: editorOptionsCustomizationSchema,
            [notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells]: {
                markdownDescription: nls.localize('notebook.interactiveWindow.collapseCodeCells', "Controls whether code cells in the interactive window are collapsed by default."),
                type: 'string',
                enum: ['always', 'never', 'fromEditor'],
                default: 'fromEditor'
            },
            [notebookCommon_1.NotebookSetting.outputLineHeight]: {
                markdownDescription: nls.localize('notebook.outputLineHeight', "Line height of the output text within notebook cells.\n - When set to 0, editor line height is used.\n - Values between 0 and 8 will be used as a multiplier with the font size.\n - Values greater than or equal to 8 will be used as effective values."),
                type: 'number',
                default: 0,
                tags: ['notebookLayout', 'notebookOutputLayout']
            },
            [notebookCommon_1.NotebookSetting.outputFontSize]: {
                markdownDescription: nls.localize('notebook.outputFontSize', "Font size for the output text within notebook cells. When set to 0, {0} is used.", '`#editor.fontSize#`'),
                type: 'number',
                default: 0,
                tags: ['notebookLayout', 'notebookOutputLayout']
            },
            [notebookCommon_1.NotebookSetting.outputFontFamily]: {
                markdownDescription: nls.localize('notebook.outputFontFamily', "The font family of the output text within notebook cells. When set to empty, the {0} is used.", '`#editor.fontFamily#`'),
                type: 'string',
                tags: ['notebookLayout', 'notebookOutputLayout']
            },
            [notebookCommon_1.NotebookSetting.outputScrolling]: {
                markdownDescription: nls.localize('notebook.outputScrolling', "Initially render notebook outputs in a scrollable region when longer than the limit."),
                type: 'boolean',
                tags: ['notebookLayout', 'notebookOutputLayout'],
                default: typeof product_1.default.quality === 'string' && product_1.default.quality !== 'stable' // only enable as default in insiders
            },
            [notebookCommon_1.NotebookSetting.outputWordWrap]: {
                markdownDescription: nls.localize('notebook.outputWordWrap', "Controls whether the lines in output should wrap."),
                type: 'boolean',
                tags: ['notebookLayout', 'notebookOutputLayout'],
                default: false
            },
            [notebookCommon_1.NotebookSetting.formatOnSave]: {
                markdownDescription: nls.localize('notebook.formatOnSave', "Format a notebook on save. A formatter must be available, the file must not be saved after delay, and the editor must not be shutting down."),
                type: 'boolean',
                tags: ['notebookLayout'],
                default: false
            },
            [notebookCommon_1.NotebookSetting.insertFinalNewline]: {
                markdownDescription: nls.localize('notebook.insertFinalNewline', "When enabled, insert a final new line into the end of code cells when saving a notebook."),
                type: 'boolean',
                tags: ['notebookLayout'],
                default: false
            },
            [notebookCommon_1.NotebookSetting.codeActionsOnSave]: {
                markdownDescription: nls.localize('notebook.codeActionsOnSave', 'Run a series of Code Actions for a notebook on save. Code Actions must be specified, the file must not be saved after delay, and the editor must not be shutting down. Example: `"notebook.source.organizeImports": "explicit"`'),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'boolean'],
                    enum: ['explicit', 'never', true, false],
                    // enum: ['explicit', 'always', 'never'], -- autosave support needs to be built first
                    // nls.localize('always', 'Always triggers Code Actions on save, including autosave, focus, and window change events.'),
                    enumDescriptions: [nls.localize('explicit', 'Triggers Code Actions only when explicitly saved.'), nls.localize('never', 'Never triggers Code Actions on save.'), nls.localize('explicitBoolean', 'Triggers Code Actions only when explicitly saved. This value will be deprecated in favor of "explicit".'), nls.localize('neverBoolean', 'Triggers Code Actions only when explicitly saved. This value will be deprecated in favor of "never".')],
                },
                default: {}
            },
            [notebookCommon_1.NotebookSetting.formatOnCellExecution]: {
                markdownDescription: nls.localize('notebook.formatOnCellExecution', "Format a notebook cell upon execution. A formatter must be available."),
                type: 'boolean',
                default: false
            },
            [notebookCommon_1.NotebookSetting.confirmDeleteRunningCell]: {
                markdownDescription: nls.localize('notebook.confirmDeleteRunningCell', "Control whether a confirmation prompt is required to delete a running cell."),
                type: 'boolean',
                default: true
            },
            [notebookCommon_1.NotebookSetting.findScope]: {
                markdownDescription: nls.localize('notebook.findScope', "Customize the Find Widget behavior for searching within notebook cells. When both markup source and markup preview are enabled, the Find Widget will search either the source code or preview based on the current state of the cell."),
                type: 'object',
                properties: {
                    markupSource: {
                        type: 'boolean',
                        default: true
                    },
                    markupPreview: {
                        type: 'boolean',
                        default: true
                    },
                    codeSource: {
                        type: 'boolean',
                        default: true
                    },
                    codeOutput: {
                        type: 'boolean',
                        default: true
                    }
                },
                default: {
                    markupSource: true,
                    markupPreview: true,
                    codeSource: true,
                    codeOutput: true
                },
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.remoteSaving]: {
                markdownDescription: nls.localize('notebook.remoteSaving', "Enables the incremental saving of notebooks in Remote environment. When enabled, only the changes to the notebook are sent to the extension host, improving performance for large notebooks and slow network connections."),
                type: 'boolean',
                default: typeof product_1.default.quality === 'string' && product_1.default.quality !== 'stable' // only enable as default in insiders
            },
            [notebookCommon_1.NotebookSetting.scrollToRevealCell]: {
                markdownDescription: nls.localize('notebook.scrolling.revealNextCellOnExecute.description', "How far to scroll when revealing the next cell upon running {0}.", 'notebook.cell.executeAndSelectBelow'),
                type: 'string',
                enum: ['fullCell', 'firstLine', 'none'],
                markdownEnumDescriptions: [
                    nls.localize('notebook.scrolling.revealNextCellOnExecute.fullCell.description', 'Scroll to fully reveal the next cell.'),
                    nls.localize('notebook.scrolling.revealNextCellOnExecute.firstLine.description', 'Scroll to reveal the first line of the next cell.'),
                    nls.localize('notebook.scrolling.revealNextCellOnExecute.none.description', 'Do not scroll.'),
                ],
                default: 'fullCell'
            },
            [notebookCommon_1.NotebookSetting.cellChat]: {
                markdownDescription: nls.localize('notebook.cellChat', "Enable experimental floating chat widget in notebooks."),
                type: 'boolean',
                default: false
            },
            [notebookCommon_1.NotebookSetting.cellGenerate]: {
                markdownDescription: nls.localize('notebook.cellGenerate', "Enable experimental generate action to create code cell with inline chat enabled."),
                type: 'boolean',
                default: typeof product_1.default.quality === 'string' && product_1.default.quality !== 'stable',
                tags: ['experimental']
            },
            [notebookCommon_1.NotebookSetting.notebookVariablesView]: {
                markdownDescription: nls.localize('notebook.VariablesView.description', "Enable the experimental notebook variables view within the debug panel."),
                type: 'boolean',
                default: false
            },
            [notebookCommon_1.NotebookSetting.cellFailureDiagnostics]: {
                markdownDescription: nls.localize('notebook.cellFailureDiagnostics', "Show available diagnostics for cell failures."),
                type: 'boolean',
                default: true
            },
            [notebookCommon_1.NotebookSetting.outputBackupSizeLimit]: {
                markdownDescription: nls.localize('notebook.backup.sizeLimit', "The limit of notebook output size in kilobytes (KB) where notebook files will no longer be backed up for hot reload. Use 0 for unlimited."),
                type: 'number',
                default: 10000
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2suY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9ub3RlYm9vay5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTJIaEcsa0dBQWtHO0lBRWxHLG1CQUFRLENBQUMsRUFBRSxDQUFzQix5QkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxrQkFBa0IsQ0FDL0UsNkJBQW9CLENBQUMsTUFBTSxDQUMxQiwrQkFBYyxFQUNkLCtCQUFjLENBQUMsRUFBRSxFQUNqQixpQkFBaUIsQ0FDakIsRUFDRDtRQUNDLElBQUksNEJBQWMsQ0FBQyx5Q0FBbUIsQ0FBQztLQUN2QyxDQUNELENBQUM7SUFFRixtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsa0JBQWtCLENBQy9FLDZCQUFvQixDQUFDLE1BQU0sQ0FDMUIsMkNBQXNCLEVBQ3RCLDJDQUFzQixDQUFDLEVBQUUsRUFDekIsc0JBQXNCLENBQ3RCLEVBQ0Q7UUFDQyxJQUFJLDRCQUFjLENBQUMsaURBQXVCLENBQUM7S0FDM0MsQ0FDRCxDQUFDO0lBRUYsTUFBTSw0QkFBNEI7UUFDakMsWUFBWTtZQUNYLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELFNBQVMsQ0FBQyxLQUFrQjtZQUMzQixJQUFBLGtCQUFVLEVBQUMsS0FBSyxZQUFZLGlEQUF1QixDQUFDLENBQUM7WUFDckQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNyQixRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVE7Z0JBQ3hCLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUTtnQkFDekMsSUFBSSxFQUFF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