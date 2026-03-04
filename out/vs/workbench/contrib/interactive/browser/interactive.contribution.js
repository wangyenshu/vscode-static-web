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
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/editOperation", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/editor/contrib/peekView/browser/peekView", "vs/editor/contrib/suggest/browser/suggest", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/common/theme", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/interactive/browser/interactiveCommon", "vs/workbench/contrib/interactive/browser/interactiveDocumentService", "vs/workbench/contrib/interactive/browser/interactiveEditor", "vs/workbench/contrib/interactive/browser/interactiveEditorInput", "vs/workbench/contrib/interactive/browser/interactiveHistoryService", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyEditorService"], function (require, exports, iterator_1, lifecycle_1, marshalling_1, network_1, resources_1, strings_1, uri_1, bulkEditService_1, editOperation_1, modesRegistry_1, model_1, resolverService_1, peekView_1, suggest_1, nls_1, actions_1, configuration_1, configurationRegistry_1, contextkey_1, editor_1, descriptors_1, extensions_1, instantiation_1, log_1, platform_1, colorRegistry_1, editor_2, contributions_1, editor_3, theme_1, bulkCellEdits_1, interactiveCommon_1, interactiveDocumentService_1, interactiveEditor_1, interactiveEditorInput_1, interactiveHistoryService_1, coreActions_1, icons, notebookEditorService_1, notebookCommon_1, notebookContextKeys_1, notebookKernelService_1, notebookService_1, editorGroupColumn_1, editorGroupsService_1, editorResolverService_1, editorService_1, extensions_2, workingCopyEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveEditorSerializer = exports.InteractiveDocumentContribution = void 0;
    const interactiveWindowCategory = (0, nls_1.localize2)('interactiveWindow', "Interactive Window");
    platform_1.Registry.as(editor_3.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(interactiveEditor_1.InteractiveEditor, notebookCommon_1.INTERACTIVE_WINDOW_EDITOR_ID, 'Interactive Window'), [
        new descriptors_1.SyncDescriptor(interactiveEditorInput_1.InteractiveEditorInput)
    ]);
    let InteractiveDocumentContribution = class InteractiveDocumentContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.interactiveDocument'; }
        constructor(notebookService, editorResolverService, editorService, instantiationService) {
            super();
            this.instantiationService = instantiationService;
            const info = notebookService.getContributedNotebookType('interactive');
            // We need to contribute a notebook type for the Interactive Window to provide notebook models.
            if (!info) {
                this._register(notebookService.registerContributedNotebookType('interactive', {
                    providerDisplayName: 'Interactive Notebook',
                    displayName: 'Interactive',
                    filenamePattern: ['*.interactive'],
                    exclusive: true
                }));
            }
            editorResolverService.registerEditor(`${network_1.Schemas.vscodeInteractiveInput}:/**`, {
                id: 'vscode-interactive-input',
                label: 'Interactive Editor',
                priority: editorResolverService_1.RegisteredEditorPriority.exclusive
            }, {
                canSupportResource: uri => uri.scheme === network_1.Schemas.vscodeInteractiveInput,
                singlePerResource: true
            }, {
                createEditorInput: ({ resource }) => {
                    const editorInput = editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */).find(editor => editor.editor instanceof interactiveEditorInput_1.InteractiveEditorInput && editor.editor.inputResource.toString() === resource.toString());
                    return editorInput;
                }
            });
            editorResolverService.registerEditor(`*.interactive`, {
                id: 'interactive',
                label: 'Interactive Editor',
                priority: editorResolverService_1.RegisteredEditorPriority.exclusive
            }, {
                canSupportResource: uri => (uri.scheme === network_1.Schemas.untitled && (0, resources_1.extname)(uri) === '.interactive') ||
                    (uri.scheme === network_1.Schemas.vscodeNotebookCell && (0, resources_1.extname)(uri) === '.interactive'),
                singlePerResource: true
            }, {
                createEditorInput: ({ resource, options }) => {
                    const data = notebookCommon_1.CellUri.parse(resource);
                    let cellOptions;
                    let IwResource = resource;
                    if (data) {
                        cellOptions = { resource, options };
                        IwResource = data.notebook;
                    }
                    const notebookOptions = { ...options, cellOptions };
                    const editorInput = createEditor(IwResource, this.instantiationService);
                    return {
                        editor: editorInput,
                        options: notebookOptions
                    };
                },
                createUntitledEditorInput: ({ resource, options }) => {
                    if (!resource) {
                        throw new Error('Interactive window editors must have a resource name');
                    }
                    const data = notebookCommon_1.CellUri.parse(resource);
                    let cellOptions;
                    if (data) {
                        cellOptions = { resource, options };
                    }
                    const notebookOptions = { ...options, cellOptions };
                    const editorInput = createEditor(resource, this.instantiationService);
                    return {
                        editor: editorInput,
                        options: notebookOptions
                    };
                }
            });
        }
    };
    exports.InteractiveDocumentContribution = InteractiveDocumentContribution;
    exports.InteractiveDocumentContribution = InteractiveDocumentContribution = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, editorResolverService_1.IEditorResolverService),
        __param(2, editorService_1.IEditorService),
        __param(3, instantiation_1.IInstantiationService)
    ], InteractiveDocumentContribution);
    let InteractiveInputContentProvider = class InteractiveInputContentProvider {
        static { this.ID = 'workbench.contrib.interactiveInputContentProvider'; }
        constructor(textModelService, _modelService) {
            this._modelService = _modelService;
            this._registration = textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeInteractiveInput, this);
        }
        dispose() {
            this._registration.dispose();
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const result = this._modelService.createModel('', null, resource, false);
            return result;
        }
    };
    InteractiveInputContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService)
    ], InteractiveInputContentProvider);
    function createEditor(resource, instantiationService) {
        const counter = /\/Interactive-(\d+)/.exec(resource.path);
        const inputBoxPath = counter && counter[1] ? `/InteractiveInput-${counter[1]}` : 'InteractiveInput';
        const inputUri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeInteractiveInput, path: inputBoxPath });
        const editorInput = interactiveEditorInput_1.InteractiveEditorInput.create(instantiationService, resource, inputUri);
        return editorInput;
    }
    let InteractiveWindowWorkingCopyEditorHandler = class InteractiveWindowWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.interactiveWindowWorkingCopyEditorHandler'; }
        constructor(_instantiationService, _workingCopyEditorService, _extensionService) {
            super();
            this._instantiationService = _instantiationService;
            this._workingCopyEditorService = _workingCopyEditorService;
            this._extensionService = _extensionService;
            this._installHandler();
        }
        handles(workingCopy) {
            const viewType = this._getViewType(workingCopy);
            return !!viewType && viewType === 'interactive';
        }
        isOpen(workingCopy, editor) {
            if (!this.handles(workingCopy)) {
                return false;
            }
            return editor instanceof interactiveEditorInput_1.InteractiveEditorInput && (0, resources_1.isEqual)(workingCopy.resource, editor.resource);
        }
        createEditor(workingCopy) {
            return createEditor(workingCopy.resource, this._instantiationService);
        }
        async _installHandler() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            this._register(this._workingCopyEditorService.registerHandler(this));
        }
        _getViewType(workingCopy) {
            return notebookCommon_1.NotebookWorkingCopyTypeIdentifier.parse(workingCopy.typeId);
        }
    };
    InteractiveWindowWorkingCopyEditorHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(2, extensions_2.IExtensionService)
    ], InteractiveWindowWorkingCopyEditorHandler);
    (0, contributions_1.registerWorkbenchContribution2)(InteractiveDocumentContribution.ID, InteractiveDocumentContribution, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(InteractiveInputContentProvider.ID, InteractiveInputContentProvider, {
        editorTypeId: notebookCommon_1.INTERACTIVE_WINDOW_EDITOR_ID
    });
    (0, contributions_1.registerWorkbenchContribution2)(InteractiveWindowWorkingCopyEditorHandler.ID, InteractiveWindowWorkingCopyEditorHandler, {
        editorTypeId: notebookCommon_1.INTERACTIVE_WINDOW_EDITOR_ID
    });
    class InteractiveEditorSerializer {
        static { this.ID = interactiveEditorInput_1.InteractiveEditorInput.ID; }
        canSerialize(editor) {
            if (!(editor instanceof interactiveEditorInput_1.InteractiveEditorInput)) {
                return false;
            }
            return uri_1.URI.isUri(editor.primary.resource) && uri_1.URI.isUri(editor.inputResource);
        }
        serialize(input) {
            if (!this.canSerialize(input)) {
                return undefined;
            }
            return JSON.stringify({
                resource: input.primary.resource,
                inputResource: input.inputResource,
                name: input.getName(),
                language: input.language
            });
        }
        deserialize(instantiationService, raw) {
            const data = (0, marshalling_1.parse)(raw);
            if (!data) {
                return undefined;
            }
            const { resource, inputResource, name, language } = data;
            if (!uri_1.URI.isUri(resource) || !uri_1.URI.isUri(inputResource)) {
                return undefined;
            }
            const input = interactiveEditorInput_1.InteractiveEditorInput.create(instantiationService, resource, inputResource, name, language);
            return input;
        }
    }
    exports.InteractiveEditorSerializer = InteractiveEditorSerializer;
    platform_1.Registry.as(editor_3.EditorExtensions.EditorFactory)
        .registerEditorSerializer(InteractiveEditorSerializer.ID, InteractiveEditorSerializer);
    (0, extensions_1.registerSingleton)(interactiveHistoryService_1.IInteractiveHistoryService, interactiveHistoryService_1.InteractiveHistoryService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(interactiveDocumentService_1.IInteractiveDocumentService, interactiveDocumentService_1.InteractiveDocumentService, 1 /* InstantiationType.Delayed */);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: '_interactive.open',
                title: (0, nls_1.localize2)('interactive.open', 'Open Interactive Window'),
                f1: false,
                category: interactiveWindowCategory,
                metadata: {
                    description: (0, nls_1.localize)('interactive.open', 'Open Interactive Window'),
                    args: [
                        {
                            name: 'showOptions',
                            description: 'Show Options',
                            schema: {
                                type: 'object',
                                properties: {
                                    'viewColumn': {
                                        type: 'number',
                                        default: -1
                                    },
                                    'preserveFocus': {
                                        type: 'boolean',
                                        default: true
                                    }
                                },
                            }
                        },
                        {
                            name: 'resource',
                            description: 'Interactive resource Uri',
                            isOptional: true
                        },
                        {
                            name: 'controllerId',
                            description: 'Notebook controller Id',
                            isOptional: true
                        },
                        {
                            name: 'title',
                            description: 'Notebook editor title',
                            isOptional: true
                        }
                    ]
                }
            });
        }
        async run(accessor, showOptions, resource, id, title) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const kernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            const logService = accessor.get(log_1.ILogService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const group = (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupService, configurationService, typeof showOptions === 'number' ? showOptions : showOptions?.viewColumn);
            const editorOptions = {
                activation: editor_1.EditorActivation.PRESERVE,
                preserveFocus: typeof showOptions !== 'number' ? (showOptions?.preserveFocus ?? false) : false
            };
            if (resource && (0, resources_1.extname)(resource) === '.interactive') {
                logService.debug('Open interactive window from resource:', resource.toString());
                const resourceUri = uri_1.URI.revive(resource);
                const editors = editorService.findEditors(resourceUri).filter(id => id.editor instanceof interactiveEditorInput_1.InteractiveEditorInput && id.editor.resource?.toString() === resourceUri.toString());
                if (editors.length) {
                    logService.debug('Find existing interactive window:', resource.toString());
                    const editorInput = editors[0].editor;
                    const currentGroup = editors[0].groupId;
                    const editor = await editorService.openEditor(editorInput, editorOptions, currentGroup);
                    const editorControl = editor?.getControl();
                    return {
                        notebookUri: editorInput.resource,
                        inputUri: editorInput.inputResource,
                        notebookEditorId: editorControl?.notebookEditor?.getId()
                    };
                }
            }
            const existingNotebookDocument = new Set();
            editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */).forEach(editor => {
                if (editor.editor.resource) {
                    existingNotebookDocument.add(editor.editor.resource.toString());
                }
            });
            let notebookUri = undefined;
            let inputUri = undefined;
            let counter = 1;
            do {
                notebookUri = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: `/Interactive-${counter}.interactive` });
                inputUri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeInteractiveInput, path: `/InteractiveInput-${counter}` });
                counter++;
            } while (existingNotebookDocument.has(notebookUri.toString()));
            interactiveEditorInput_1.InteractiveEditorInput.setName(notebookUri, title);
            logService.debug('Open new interactive window:', notebookUri.toString(), inputUri.toString());
            if (id) {
                const allKernels = kernelService.getMatchingKernel({ uri: notebookUri, viewType: 'interactive' }).all;
                const preferredKernel = allKernels.find(kernel => kernel.id === id);
                if (preferredKernel) {
                    kernelService.preselectKernelForNotebook(preferredKernel, { uri: notebookUri, viewType: 'interactive' });
                }
            }
            historyService.clearHistory(notebookUri);
            const editorInput = { resource: notebookUri, options: editorOptions };
            const editorPane = await editorService.openEditor(editorInput, group);
            const editorControl = editorPane?.getControl();
            // Extensions must retain references to these URIs to manipulate the interactive editor
            logService.debug('New interactive window opened. Notebook editor id', editorControl?.notebookEditor?.getId());
            return { notebookUri, inputUri, notebookEditorId: editorControl?.notebookEditor?.getId() };
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.execute',
                title: (0, nls_1.localize2)('interactive.execute', 'Execute Code'),
                category: interactiveWindowCategory,
                keybinding: {
                    // when: NOTEBOOK_CELL_LIST_FOCUSED,
                    when: contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'),
                    primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */,
                    win: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */
                    },
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
                menu: [
                    {
                        id: actions_1.MenuId.InteractiveInputExecute
                    }
                ],
                icon: icons.executeIcon,
                f1: false,
                metadata: {
                    description: 'Execute the Contents of the Input Box',
                    args: [
                        {
                            name: 'resource',
                            description: 'Interactive resource Uri',
                            isOptional: true
                        }
                    ]
                }
            });
        }
        async run(accessor, context) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const notebookEditorService = accessor.get(notebookEditorService_1.INotebookEditorService);
            let editorControl;
            if (context) {
                const resourceUri = uri_1.URI.revive(context);
                const editors = editorService.findEditors(resourceUri)
                    .filter(id => id.editor instanceof interactiveEditorInput_1.InteractiveEditorInput && id.editor.resource?.toString() === resourceUri.toString());
                if (editors.length) {
                    const editorInput = editors[0].editor;
                    const currentGroup = editors[0].groupId;
                    const editor = await editorService.openEditor(editorInput, currentGroup);
                    editorControl = editor?.getControl();
                }
            }
            else {
                editorControl = editorService.activeEditorPane?.getControl();
            }
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                const activeKernel = editorControl.notebookEditor.activeKernel;
                const language = activeKernel?.supportedLanguages[0] ?? modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
                if (notebookDocument && textModel) {
                    const index = notebookDocument.length;
                    const value = textModel.getValue();
                    if ((0, strings_1.isFalsyOrWhitespace)(value)) {
                        return;
                    }
                    historyService.addToHistory(notebookDocument.uri, '');
                    textModel.setValue('');
                    const collapseState = editorControl.notebookEditor.notebookOptions.getDisplayOptions().interactiveWindowCollapseCodeCells === 'fromEditor' ?
                        {
                            inputCollapsed: false,
                            outputCollapsed: false
                        } :
                        undefined;
                    await bulkEditService.apply([
                        new bulkCellEdits_1.ResourceNotebookCellEdit(notebookDocument.uri, {
                            editType: 1 /* CellEditType.Replace */,
                            index: index,
                            count: 0,
                            cells: [{
                                    cellKind: notebookCommon_1.CellKind.Code,
                                    mime: undefined,
                                    language,
                                    source: value,
                                    outputs: [],
                                    metadata: {},
                                    collapseState
                                }]
                        })
                    ]);
                    // reveal the cell into view first
                    const range = { start: index, end: index + 1 };
                    editorControl.notebookEditor.revealCellRangeInView(range);
                    await editorControl.notebookEditor.executeNotebookCells(editorControl.notebookEditor.getCellsInRange({ start: index, end: index + 1 }));
                    // update the selection and focus in the extension host model
                    const editor = notebookEditorService.getNotebookEditor(editorControl.notebookEditor.getId());
                    if (editor) {
                        editor.setSelections([range]);
                        editor.setFocus(range);
                    }
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.input.clear',
                title: (0, nls_1.localize2)('interactive.input.clear', 'Clear the interactive window input editor contents'),
                category: interactiveWindowCategory,
                f1: false
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                const range = editorControl.codeEditor.getModel()?.getFullModelRange();
                if (notebookDocument && textModel && range) {
                    editorControl.codeEditor.executeEdits('', [editOperation_1.EditOperation.replace(range, null)]);
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.history.previous',
                title: (0, nls_1.localize2)('interactive.history.previous', 'Previous value in history'),
                category: interactiveWindowCategory,
                f1: false,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('bottom'), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('none'), suggest_1.Context.Visible.toNegated()),
                    primary: 16 /* KeyCode.UpArrow */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                if (notebookDocument && textModel) {
                    const previousValue = historyService.getPreviousValue(notebookDocument.uri);
                    if (previousValue) {
                        textModel.setValue(previousValue);
                    }
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.history.next',
                title: (0, nls_1.localize2)('interactive.history.next', 'Next value in history'),
                category: interactiveWindowCategory,
                f1: false,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('top'), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('none'), suggest_1.Context.Visible.toNegated()),
                    primary: 18 /* KeyCode.DownArrow */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                if (notebookDocument && textModel) {
                    const previousValue = historyService.getNextValue(notebookDocument.uri);
                    if (previousValue) {
                        textModel.setValue(previousValue);
                    }
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.scrollToTop',
                title: (0, nls_1.localize)('interactiveScrollToTop', 'Scroll to Top'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                category: interactiveWindowCategory,
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                if (editorControl.notebookEditor.getLength() === 0) {
                    return;
                }
                editorControl.notebookEditor.revealCellRangeInView({ start: 0, end: 1 });
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.scrollToBottom',
                title: (0, nls_1.localize)('interactiveScrollToBottom', 'Scroll to Bottom'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                category: interactiveWindowCategory,
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                if (editorControl.notebookEditor.getLength() === 0) {
                    return;
                }
                const len = editorControl.notebookEditor.getLength();
                editorControl.notebookEditor.revealCellRangeInView({ start: len - 1, end: len });
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.input.focus',
                title: (0, nls_1.localize2)('interactive.input.focus', 'Focus Input Editor'),
                category: interactiveWindowCategory,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: notebookContextKeys_1.InteractiveWindowOpen,
                },
                precondition: notebookContextKeys_1.InteractiveWindowOpen,
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                editorService.activeEditorPane?.focus();
            }
            else {
                // find and open the most recent interactive window
                const openEditors = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
                const interactiveWindow = iterator_1.Iterable.find(openEditors, identifier => { return identifier.editor.typeId === interactiveEditorInput_1.InteractiveEditorInput.ID; });
                if (interactiveWindow) {
                    const editorInput = interactiveWindow.editor;
                    const currentGroup = interactiveWindow.groupId;
                    const editor = await editorService.openEditor(editorInput, currentGroup);
                    const editorControl = editor?.getControl();
                    if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                        editorService.activeEditorPane?.focus();
                    }
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.history.focus',
                title: (0, nls_1.localize2)('interactive.history.focus', 'Focus History'),
                category: interactiveWindowCategory,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'),
                },
                precondition: contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive'),
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = editorService.activeEditorPane?.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                editorControl.notebookEditor.focus();
            }
        }
    });
    (0, colorRegistry_1.registerColor)('interactive.activeCodeBorder', {
        dark: (0, colorRegistry_1.ifDefinedThenElse)(peekView_1.peekViewBorder, peekView_1.peekViewBorder, '#007acc'),
        light: (0, colorRegistry_1.ifDefinedThenElse)(peekView_1.peekViewBorder, peekView_1.peekViewBorder, '#007acc'),
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('interactive.activeCodeBorder', 'The border color for the current interactive code cell when the editor has focus.'));
    (0, colorRegistry_1.registerColor)('interactive.inactiveCodeBorder', {
        //dark: theme.getColor(listInactiveSelectionBackground) ?? transparent(listInactiveSelectionBackground, 1),
        dark: (0, colorRegistry_1.ifDefinedThenElse)(colorRegistry_1.listInactiveSelectionBackground, colorRegistry_1.listInactiveSelectionBackground, '#37373D'),
        light: (0, colorRegistry_1.ifDefinedThenElse)(colorRegistry_1.listInactiveSelectionBackground, colorRegistry_1.listInactiveSelectionBackground, '#E4E6F1'),
        hcDark: theme_1.PANEL_BORDER,
        hcLight: theme_1.PANEL_BORDER
    }, (0, nls_1.localize)('interactive.inactiveCodeBorder', 'The border color for the current interactive code cell when the editor does not have focus.'));
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'interactiveWindow',
        order: 100,
        type: 'object',
        'properties': {
            [interactiveCommon_1.InteractiveWindowSetting.interactiveWindowAlwaysScrollOnNewCell]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('interactiveWindow.alwaysScrollOnNewCell', "Automatically scroll the interactive window to show the output of the last statement executed. If this value is false, the window will only scroll if the last cell was already the one scrolled to.")
            }
        }
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'interactiveWindow',
        order: 100,
        type: 'object',
        'properties': {
            [notebookCommon_1.NotebookSetting.InteractiveWindowPromptToSave]: {
                type: 'boolean',
                default: false,
                markdownDescription: (0, nls_1.localize)('interactiveWindow.promptToSaveOnClose', "Prompt to save the interactive window when it is closed. Only new interactive windows will be affected by this setting change.")
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RpdmUuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW50ZXJhY3RpdmUvYnJvd3Nlci9pbnRlcmFjdGl2ZS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNkRoRyxNQUFNLHlCQUF5QixHQUFxQixJQUFBLGVBQVMsRUFBQyxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBRXpHLG1CQUFRLENBQUMsRUFBRSxDQUFzQix5QkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxrQkFBa0IsQ0FDL0UsNkJBQW9CLENBQUMsTUFBTSxDQUMxQixxQ0FBaUIsRUFDakIsNkNBQTRCLEVBQzVCLG9CQUFvQixDQUNwQixFQUNEO1FBQ0MsSUFBSSw0QkFBYyxDQUFDLCtDQUFzQixDQUFDO0tBQzFDLENBQ0QsQ0FBQztJQUVLLElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQWdDLFNBQVEsc0JBQVU7aUJBRTlDLE9BQUUsR0FBRyx1Q0FBdUMsQUFBMUMsQ0FBMkM7UUFFN0QsWUFDbUIsZUFBaUMsRUFDM0IscUJBQTZDLEVBQ3JELGFBQTZCLEVBQ0wsb0JBQTJDO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBRmdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFJbkYsTUFBTSxJQUFJLEdBQUcsZUFBZSxDQUFDLDBCQUEwQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRXZFLCtGQUErRjtZQUMvRixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsK0JBQStCLENBQUMsYUFBYSxFQUFFO29CQUM3RSxtQkFBbUIsRUFBRSxzQkFBc0I7b0JBQzNDLFdBQVcs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