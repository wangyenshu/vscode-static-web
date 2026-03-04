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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/workbench/contrib/notebook/browser/notebookExtensionPoint", "vs/workbench/contrib/notebook/common/notebookDiffEditorInput", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/workbench/contrib/notebook/common/notebookOutputRenderer", "vs/workbench/contrib/notebook/common/notebookProvider", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/notebook/common/notebookDocumentService"], function (require, exports, nls_1, actions_1, errorMessage_1, event_1, iterator_1, lazy_1, lifecycle_1, map_1, network_1, resources_1, types_1, uri_1, accessibility_1, configuration_1, files_1, instantiation_1, storage_1, memento_1, notebookExtensionPoint_1, notebookDiffEditorInput_1, notebookTextModel_1, notebookCommon_1, notebookEditorInput_1, notebookEditorModelResolverService_1, notebookOutputRenderer_1, notebookProvider_1, notebookService_1, editorResolverService_1, extensions_1, extensionsActions_1, uriIdentity_1, notebookDocumentService_1) {
    "use strict";
    var NotebookProviderInfoStore_1, NotebookService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookService = exports.NotebookOutputRendererInfoStore = exports.NotebookProviderInfoStore = void 0;
    let NotebookProviderInfoStore = class NotebookProviderInfoStore extends lifecycle_1.Disposable {
        static { NotebookProviderInfoStore_1 = this; }
        static { this.CUSTOM_EDITORS_STORAGE_ID = 'notebookEditors'; }
        static { this.CUSTOM_EDITORS_ENTRY_ID = 'editors'; }
        constructor(storageService, extensionService, _editorResolverService, _configurationService, _accessibilityService, _instantiationService, _fileService, _notebookEditorModelResolverService, uriIdentService) {
            super();
            this._editorResolverService = _editorResolverService;
            this._configurationService = _configurationService;
            this._accessibilityService = _accessibilityService;
            this._instantiationService = _instantiationService;
            this._fileService = _fileService;
            this._notebookEditorModelResolverService = _notebookEditorModelResolverService;
            this.uriIdentService = uriIdentService;
            this._handled = false;
            this._contributedEditors = new Map();
            this._contributedEditorDisposables = this._register(new lifecycle_1.DisposableStore());
            this._memento = new memento_1.Memento(NotebookProviderInfoStore_1.CUSTOM_EDITORS_STORAGE_ID, storageService);
            const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            // Process the notebook contributions but buffer changes from the resolver
            this._editorResolverService.bufferChangeEvents(() => {
                for (const info of (mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] || [])) {
                    this.add(new notebookProvider_1.NotebookProviderInfo(info));
                }
            });
            this._register(extensionService.onDidRegisterExtensions(() => {
                if (!this._handled) {
                    // there is no extension point registered for notebook content provider
                    // clear the memento and cache
                    this._clear();
                    mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] = [];
                    this._memento.saveMemento();
                }
            }));
            notebookExtensionPoint_1.notebooksExtensionPoint.setHandler(extensions => this._setupHandler(extensions));
        }
        dispose() {
            this._clear();
            super.dispose();
        }
        _setupHandler(extensions) {
            this._handled = true;
            const builtins = [...this._contributedEditors.values()].filter(info => !info.extension);
            this._clear();
            const builtinProvidersFromCache = new Map();
            builtins.forEach(builtin => {
                builtinProvidersFromCache.set(builtin.id, this.add(builtin));
            });
            for (const extension of extensions) {
                for (const notebookContribution of extension.value) {
                    if (!notebookContribution.type) {
                        extension.collector.error(`Notebook does not specify type-property`);
                        continue;
                    }
                    const existing = this.get(notebookContribution.type);
                    if (existing) {
                        if (!existing.extension && extension.description.isBuiltin && builtins.find(builtin => builtin.id === notebookContribution.type)) {
                            // we are registering an extension which is using the same view type which is already cached
                            builtinProvidersFromCache.get(notebookContribution.type)?.dispose();
                        }
                        else {
                            extension.collector.error(`Notebook type '${notebookContribution.type}' already used`);
                            continue;
                        }
                    }
                    this.add(new notebookProvider_1.NotebookProviderInfo({
                        extension: extension.description.identifier,
                        id: notebookContribution.type,
                        displayName: notebookContribution.displayName,
                        selectors: notebookContribution.selector || [],
                        priority: this._convertPriority(notebookContribution.priority),
                        providerDisplayName: extension.description.displayName ?? extension.description.identifier.value,
                        exclusive: false
                    }));
                }
            }
            const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._contributedEditors.values());
            this._memento.saveMemento();
        }
        clearEditorCache() {
            const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] = [];
            this._memento.saveMemento();
        }
        _convertPriority(priority) {
            if (!priority) {
                return editorResolverService_1.RegisteredEditorPriority.default;
            }
            if (priority === notebookCommon_1.NotebookEditorPriority.default) {
                return editorResolverService_1.RegisteredEditorPriority.default;
            }
            return editorResolverService_1.RegisteredEditorPriority.option;
        }
        _registerContributionPoint(notebookProviderInfo) {
            const disposables = new lifecycle_1.DisposableStore();
            for (const selector of notebookProviderInfo.selectors) {
                const globPattern = selector.include || selector;
                const notebookEditorInfo = {
                    id: notebookProviderInfo.id,
                    label: notebookProviderInfo.displayName,
                    detail: notebookProviderInfo.providerDisplayName,
                    priority: notebookProviderInfo.exclusive ? editorResolverService_1.RegisteredEditorPriority.exclusive : notebookProviderInfo.priority,
                };
                const notebookEditorOptions = {
                    canHandleDiff: () => !!this._configurationService.getValue(notebookCommon_1.NotebookSetting.textDiffEditorPreview) && !this._accessibilityService.isScreenReaderOptimized(),
                    canSupportResource: (resource) => resource.scheme === network_1.Schemas.untitled || resource.scheme === network_1.Schemas.vscodeNotebookCell || this._fileService.hasProvider(resource)
                };
                const notebookEditorInputFactory = ({ resource, options }) => {
                    const data = notebookCommon_1.CellUri.parse(resource);
                    let notebookUri;
                    let cellOptions;
                    let preferredResource = resource;
                    if (data) {
                        // resource is a notebook cell
                        notebookUri = this.uriIdentService.asCanonicalUri(data.notebook);
                        preferredResource = data.notebook;
                        cellOptions = { resource, options };
                    }
                    else {
                        notebookUri = this.uriIdentService.asCanonicalUri(resource);
                    }
                    if (!cellOptions) {
                        cellOptions = options?.cellOptions;
                    }
                    const notebookOptions = { ...options, cellOptions };
                    const editor = notebookEditorInput_1.NotebookEditorInput.getOrCreate(this._instantiationService, notebookUri, preferredResource, notebookProviderInfo.id);
                    return { editor, options: notebookOptions };
                };
                const notebookUntitledEditorFactory = async ({ resource, options }) => {
                    const ref = await this._notebookEditorModelResolverService.resolve({ untitledResource: resource }, notebookProviderInfo.id);
                    // untitled notebooks are disposed when they get saved. we should not hold a reference
                    // to such a disposed notebook and therefore dispose the reference as well
                    ref.object.notebook.onWillDispose(() => {
                        ref.dispose();
                    });
                    return { editor: notebookEditorInput_1.NotebookEditorInput.getOrCreate(this._instantiationService, ref.object.resource, undefined, notebookProviderInfo.id), options };
                };
                const notebookDiffEditorInputFactory = ({ modified, original, label, description }) => {
                    return { editor: notebookDiffEditorInput_1.NotebookDiffEditorInput.create(this._instantiationService, modified.resource, label, description, original.resource, notebookProviderInfo.id) };
                };
                const notebookFactoryObject = {
                    createEditorInput: notebookEditorInputFactory,
                    createDiffEditorInput: notebookDiffEditorInputFactory,
                    createUntitledEditorInput: notebookUntitledEditorFactory,
                };
                const notebookCellFactoryObject = {
                    createEditorInput: notebookEditorInputFactory,
                    createDiffEditorInput: notebookDiffEditorInputFactory,
                };
                // TODO @lramos15 find a better way to toggle handling diff editors than needing these listeners for every registration
                // This is a lot of event listeners especially if there are many notebooks
                disposables.add(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.textDiffEditorPreview)) {
                        const canHandleDiff = !!this._configurationService.getValue(notebookCommon_1.NotebookSetting.textDiffEditorPreview) && !this._accessibilityService.isScreenReaderOptimized();
                        if (canHandleDiff) {
                            notebookFactoryObject.createDiffEditorInput = notebookDiffEditorInputFactory;
                            notebookCellFactoryObject.createDiffEditorInput = notebookDiffEditorInputFactory;
                        }
                        else {
                            notebookFactoryObject.createDiffEditorInput = undefined;
                            notebookCellFactoryObject.createDiffEditorInput = undefined;
                        }
                    }
                }));
                disposables.add(this._accessibilityService.onDidChangeScreenReaderOptimized(() => {
                    const canHandleDiff = !!this._configurationService.getValue(notebookCommon_1.NotebookSetting.textDiffEditorPreview) && !this._accessibilityService.isScreenReaderOptimized();
                    if (canHandleDiff) {
                        notebookFactoryObject.createDiffEditorInput = notebookDiffEditorInputFactory;
                        notebookCellFactoryObject.createDiffEditorInput = notebookDiffEditorInputFactory;
                    }
                    else {
                        notebookFactoryObject.createDiffEditorInput = undefined;
                        notebookCellFactoryObject.createDiffEditorInput = undefined;
                    }
                }));
                // Register the notebook editor
                disposables.add(this._editorResolverService.registerEditor(globPattern, notebookEditorInfo, notebookEditorOptions, notebookFactoryObject));
                // Then register the schema handler as exclusive for that notebook
                disposables.add(this._editorResolverService.registerEditor(`${network_1.Schemas.vscodeNotebookCell}:/**/${globPattern}`, { ...notebookEditorInfo, priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, notebookEditorOptions, notebookCellFactoryObject));
            }
            return disposables;
        }
        _clear() {
            this._contributedEditors.clear();
            this._contributedEditorDisposables.clear();
        }
        get(viewType) {
            return this._contributedEditors.get(viewType);
        }
        add(info) {
            if (this._contributedEditors.has(info.id)) {
                throw new Error(`notebook type '${info.id}' ALREADY EXISTS`);
            }
            this._contributedEditors.set(info.id, info);
            let editorRegistration;
            // built-in notebook providers contribute their own editors
            if (info.extension) {
                editorRegistration = this._registerContributionPoint(info);
                this._contributedEditorDisposables.add(editorRegistration);
            }
            const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._contributedEditors.values());
            this._memento.saveMemento();
            return this._register((0, lifecycle_1.toDisposable)(() => {
                const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._contributedEditors.values());
                this._memento.saveMemento();
                editorRegistration?.dispose();
                this._contributedEditors.delete(info.id);
            }));
        }
        getContributedNotebook(resource) {
            const result = [];
            for (const info of this._contributedEditors.values()) {
                if (info.matches(resource)) {
                    result.push(info);
                }
            }
            if (result.length === 0 && resource.scheme === network_1.Schemas.untitled) {
                // untitled resource and no path-specific match => all providers apply
                return Array.from(this._contributedEditors.values());
            }
            return result;
        }
        [Symbol.iterator]() {
            return this._contributedEditors.values();
        }
    };
    exports.NotebookProviderInfoStore = NotebookProviderInfoStore;
    exports.NotebookProviderInfoStore = NotebookProviderInfoStore = NotebookProviderInfoStore_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensions_1.IExtensionService),
        __param(2, editorResolverService_1.IEditorResolverService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, accessibility_1.IAccessibilityService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, files_1.IFileService),
        __param(7, notebookEditorModelResolverService_1.INotebookEditorModelResolverService),
        __param(8, uriIdentity_1.IUriIdentityService)
    ], NotebookProviderInfoStore);
    let NotebookOutputRendererInfoStore = class NotebookOutputRendererInfoStore {
        constructor(storageService) {
            this.contributedRenderers = new Map();
            this.preferredMimetype = new lazy_1.Lazy(() => this.preferredMimetypeMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */));
            this.preferredMimetypeMemento = new memento_1.Memento('workbench.editor.notebook.preferredRenderer2', storageService);
        }
        clear() {
            this.contributedRenderers.clear();
        }
        get(rendererId) {
            return this.contributedRenderers.get(rendererId);
        }
        getAll() {
            return Array.from(this.contributedRenderers.values());
        }
        add(info) {
            if (this.contributedRenderers.has(info.id)) {
                return;
            }
            this.contributedRenderers.set(info.id, info);
        }
        /** Update and remember the preferred renderer for the given mimetype in this workspace */
        setPreferred(notebookProviderInfo, mimeType, rendererId) {
            const mementoObj = this.preferredMimetype.value;
            const forNotebook = mementoObj[notebookProviderInfo.id];
            if (forNotebook) {
                forNotebook[mimeType] = rendererId;
            }
            else {
                mementoObj[notebookProviderInfo.id] = { [mimeType]: rendererId };
            }
            this.preferredMimetypeMemento.saveMemento();
        }
        findBestRenderers(notebookProviderInfo, mimeType, kernelProvides) {
            let ReuseOrder;
            (function (ReuseOrder) {
                ReuseOrder[ReuseOrder["PreviouslySelected"] = 256] = "PreviouslySelected";
                ReuseOrder[ReuseOrder["SameExtensionAsNotebook"] = 512] = "SameExtensionAsNotebook";
                ReuseOrder[ReuseOrder["OtherRenderer"] = 768] = "OtherRenderer";
                ReuseOrder[ReuseOrder["BuiltIn"] = 1024] = "BuiltIn";
            })(ReuseOrder || (ReuseOrder = {}));
            const preferred = notebookProviderInfo && this.preferredMimetype.value[notebookProviderInfo.id]?.[mimeType];
            const notebookExtId = notebookProviderInfo?.extension?.value;
            const notebookId = notebookProviderInfo?.id;
            const renderers = Array.from(this.contributedRenderers.values())
                .map(renderer => {
                const ownScore = kernelProvides === undefined
                    ? renderer.matchesWithoutKernel(mimeType)
                    : renderer.matches(mimeType, kernelProvides);
                if (ownScore === 3 /* NotebookRendererMatch.Never */) {
                    return undefined;
                }
                const rendererExtId = renderer.extensionId.value;
                const reuseScore = preferred === renderer.id
                    ? 256 /* ReuseOrder.PreviouslySelected */
                    : rendererExtId === notebookExtId || notebookCommon_1.RENDERER_EQUIVALENT_EXTENSIONS.get(rendererExtId)?.has(notebookId)
                        ? 512 /* ReuseOrder.SameExtensionAsNotebook */
                        : renderer.isBuiltin ? 1024 /* ReuseOrder.BuiltIn */ : 768 /* ReuseOrder.OtherRenderer */;
                return {
                    ordered: { mimeType, rendererId: renderer.id, isTrusted: true },
                    score: reuseScore | ownScore,
                };
            }).filter(types_1.isDefined);
            if (renderers.length === 0) {
                return [{ mimeType, rendererId: notebookCommon_1.RENDERER_NOT_AVAILABLE, isTrusted: true }];
            }
            return renderers.sort((a, b) => a.score - b.score).map(r => r.ordered);
        }
    };
    exports.NotebookOutputRendererInfoStore = NotebookOutputRendererInfoStore;
    exports.NotebookOutputRendererInfoStore = NotebookOutputRendererInfoStore = __decorate([
        __param(0, storage_1.IStorageService)
    ], NotebookOutputRendererInfoStore);
    class ModelData {
        get uri() { return this.model.uri; }
        constructor(model, onWillDispose) {
            this.model = model;
            this._modelEventListeners = new lifecycle_1.DisposableStore();
            this._modelEventListeners.add(model.onWillDispose(() => onWillDispose(model)));
        }
        getCellIndex(cellUri) {
            return this.model.cells.findIndex(cell => (0, resources_1.isEqual)(cell.uri, cellUri));
        }
        dispose() {
            this._modelEventListeners.dispose();
        }
    }
    let NotebookService = class NotebookService extends lifecycle_1.Disposable {
        static { NotebookService_1 = this; }
        static { this._storageNotebookViewTypeProvider = 'notebook.viewTypeProvider'; }
        get notebookProviderInfoStore() {
            if (!this._notebookProviderInfoStore) {
                this._notebookProviderInfoStore = this._register(this._instantiationService.createInstance(NotebookProviderInfoStore));
            }
            return this._notebookProviderInfoStore;
        }
        constructor(_extensionService, _configurationService, _accessibilityService, _instantiationService, _storageService, _notebookDocumentService) {
            super();
            this._extensionService = _extensionService;
            this._configurationService = _configurationService;
            this._accessibilityService = _accessibilityService;
            this._instantiationService = _instantiationService;
            this._storageService = _storageService;
            this._notebookDocumentService = _notebookDocumentService;
            this._notebookProviders = new Map();
            this._notebookProviderInfoStore = undefined;
            this._notebookRenderersInfoStore = this._instantiationService.createInstance(NotebookOutputRendererInfoStore);
            this._onDidChangeOutputRenderers = this._register(new event_1.Emitter());
            this.onDidChangeOutputRenderers = this._onDidChangeOutputRenderers.event;
            this._notebookStaticPreloadInfoStore = new Set();
            this._models = new map_1.ResourceMap();
            this._onWillAddNotebookDocument = this._register(new event_1.Emitter());
            this._onDidAddNotebookDocument = this._register(new event_1.Emitter());
            this._onWillRemoveNotebookDocument = this._register(new event_1.Emitter());
            this._onDidRemoveNotebookDocument = this._register(new event_1.Emitter());
            this.onWillAddNotebookDocument = this._onWillAddNotebookDocument.event;
            this.onDidAddNotebookDocument = this._onDidAddNotebookDocument.event;
            this.onDidRemoveNotebookDocument = this._onDidRemoveNotebookDocument.event;
            this.onWillRemoveNotebookDocument = this._onWillRemoveNotebookDocument.event;
            this._onAddViewType = this._register(new event_1.Emitter());
            this.onAddViewType = this._onAddViewType.event;
            this._onWillRemoveViewType = this._register(new event_1.Emitter());
            this.onWillRemoveViewType = this._onWillRemoveViewType.event;
            this._onDidChangeEditorTypes = this._register(new event_1.Emitter());
            this.onDidChangeEditorTypes = this._onDidChangeEditorTypes.event;
            this._lastClipboardIsCopy = true;
            notebookExtensionPoint_1.notebookRendererExtensionPoint.setHandler((renderers) => {
                this._notebookRenderersInfoStore.clear();
                for (const extension of renderers) {
                    for (const notebookContribution of extension.value) {
                        if (!notebookContribution.entrypoint) { // avoid crashing
                            extension.collector.error(`Notebook renderer does not specify entry point`);
                            continue;
                        }
                        const id = notebookContribution.id;
                        if (!id) {
                            extension.collector.error(`Notebook renderer does not specify id-property`);
                            continue;
                        }
                        this._notebookRenderersInfoStore.add(new notebookOutputRenderer_1.NotebookOutputRendererInfo({
                            id,
                            extension: extension.description,
                            entrypoint: notebookContribution.entrypoint,
                            displayName: notebookContribution.displayName,
                            mimeTypes: notebookContribution.mimeTypes || [],
                            dependencies: notebookContribution.dependencies,
                            optionalDependencies: notebookContribution.optionalDependencies,
                            requiresMessaging: notebookContribution.requiresMessaging,
                        }));
                    }
                }
                this._onDidChangeOutputRenderers.fire();
            });
            notebookExtensionPoint_1.notebookPreloadExtensionPoint.setHandler(extensions => {
                this._notebookStaticPreloadInfoStore.clear();
                for (const extension of extensions) {
                    if (!(0, extensions_1.isProposedApiEnabled)(extension.description, 'contribNotebookStaticPreloads')) {
                        continue;
                    }
                    for (const notebookContribution of extension.value) {
                        if (!notebookContribution.entrypoint) { // avoid crashing
                            extension.collector.error(`Notebook preload does not specify entry point`);
                            continue;
                        }
                        const type = notebookContribution.type;
                        if (!type) {
                            extension.collector.error(`Notebook preload does not specify type-property`);
                            continue;
                        }
                        this._notebookStaticPreloadInfoStore.add(new notebookOutputRenderer_1.NotebookStaticPreloadInfo({
                            type,
                            extension: extension.description,
                            entrypoint: notebookContribution.entrypoint,
                            localResourceRoots: notebookContribution.localResourceRoots ?? [],
                        }));
                    }
                }
            });
            const updateOrder = () => {
                this._displayOrder = new notebookCommon_1.MimeTypeDisplayOrder(this._configurationService.getValue(notebookCommon_1.NotebookSetting.displayOrder) || [], this._accessibilityService.isScreenReaderOptimized()
                    ? notebookCommon_1.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER
                    : notebookCommon_1.NOTEBOOK_DISPLAY_ORDER);
            };
            updateOrder();
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.displayOrder)) {
                    updateOrder();
                }
            }));
            this._register(this._accessibilityService.onDidChangeScreenReaderOptimized(() => {
                updateOrder();
            }));
            this._memento = new memento_1.Memento(NotebookService_1._storageNotebookViewTypeProvider, this._storageService);
            this._viewTypeCache = this._memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        getEditorTypes() {
            return [...this.notebookProviderInfoStore].map(info => ({
                id: info.id,
                displayName: info.displayName,
                providerDisplayName: info.providerDisplayName
            }));
        }
        clearEditorCache() {
            this.notebookProviderInfoStore.clearEditorCache();
        }
        _postDocumentOpenActivation(viewType) {
            // send out activations on notebook text model creation
            this._extensionService.activateByEvent(`onNotebook:${viewType}`);
            this._extensionService.activateByEvent(`onNotebook:*`);
        }
        async canResolve(viewType) {
            if (this._notebookProviders.has(viewType)) {
                return true;
            }
            await this._extensionService.whenInstalledExtensionsRegistered();
            await this._extensionService.activateByEvent(`onNotebookSerializer:${viewType}`);
            return this._notebookProviders.has(viewType);
        }
        registerContributedNotebookType(viewType, data) {
            const info = new notebookProvider_1.NotebookProviderInfo({
                extension: data.extension,
                id: viewType,
                displayName: data.displayName,
                providerDisplayName: data.providerDisplayName,
                exclusive: data.exclusive,
                priority: editorResolverService_1.RegisteredEditorPriority.default,
                selectors: []
            });
            info.update({ selectors: data.filenamePattern });
            const reg = this.notebookProviderInfoStore.add(info);
            this._onDidChangeEditorTypes.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                reg.dispose();
                this._onDidChangeEditorTypes.fire();
            });
        }
        _registerProviderData(viewType, data) {
            if (this._notebookProviders.has(viewType)) {
                throw new Error(`notebook provider for viewtype '${viewType}' already exists`);
            }
            this._notebookProviders.set(viewType, data);
            this._onAddViewType.fire(viewType);
            return (0, lifecycle_1.toDisposable)(() => {
                this._onWillRemoveViewType.fire(viewType);
                this._notebookProviders.delete(viewType);
            });
        }
        registerNotebookSerializer(viewType, extensionData, serializer) {
            this.notebookProviderInfoStore.get(viewType)?.update({ options: serializer.options });
            this._viewTypeCache[viewType] = extensionData.id.value;
            this._persistMementos();
            return this._registerProviderData(viewType, new notebookService_1.SimpleNotebookProviderInfo(viewType, serializer, extensionData));
        }
        async withNotebookDataProvider(viewType) {
            const selected = this.notebookProviderInfoStore.get(viewType);
            if (!selected) {
                const knownProvider = this.getViewTypeProvider(viewType);
                const actions = knownProvider ? [
                    (0, actions_1.toAction)({
                        id: 'workbench.notebook.action.installMissingViewType', label: (0, nls_1.localize)('notebookOpenInstallMissingViewType', "Install extension for '{0}'", viewType), run: async () => {
                            await this._instantiationService.createInstance(extensionsActions_1.InstallRecommendedExtensionAction, knownProvider).run();
                        }
                    })
                ] : [];
                throw (0, errorMessage_1.createErrorWithActions)(`UNKNOWN notebook type '${viewType}'`, actions);
            }
            await this.canResolve(selected.id);
            const result = this._notebookProviders.get(selected.id);
            if (!result) {
                throw new Error(`NO provider registered for view type: '${selected.id}'`);
            }
            return result;
        }
        _persistMementos() {
            this._memento.saveMemento();
        }
        getViewTypeProvider(viewType) {
            return this._viewTypeCache[viewType];
        }
        getRendererInfo(rendererId) {
            return this._notebookRenderersInfoStore.get(rendererId);
        }
        updateMimePreferredRenderer(viewType, mimeType, rendererId, otherMimetypes) {
            const info = this.notebookProviderInfoStore.get(viewType);
            if (info) {
                this._notebookRenderersInfoStore.setPreferred(info, mimeType, rendererId);
            }
            this._displayOrder.prioritize(mimeType, otherMimetypes);
        }
        saveMimeDisplayOrder(target) {
            this._configurationService.updateValue(notebookCommon_1.NotebookSetting.displayOrder, this._displayOrder.toArray(), target);
        }
        getRenderers() {
            return this._notebookRenderersInfoStore.getAll();
        }
        *getStaticPreloads(viewType) {
            for (const preload of this._notebookStaticPreloadInfoStore) {
                if (preload.type === viewType) {
                    yield preload;
                }
            }
        }
        // --- notebook documents: create, destory, retrieve, enumerate
        createNotebookTextModel(viewType, uri, data, transientOptions) {
            if (this._models.has(uri)) {
                throw new Error(`notebook for ${uri} already exists`);
            }
            const notebookModel = this._instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, viewType, uri, data.cells, data.metadata, transientOptions);
            const modelData = new ModelData(notebookModel, this._onWillDisposeDocument.bind(this));
            this._models.set(uri, modelData);
            this._notebookDocumentService.addNotebookDocument(modelData);
            this._onWillAddNotebookDocument.fire(notebookModel);
            this._onDidAddNotebookDocument.fire(notebookModel);
            this._postDocumentOpenActivation(viewType);
            return notebookModel;
        }
        getNotebookTextModel(uri) {
            return this._models.get(uri)?.model;
        }
        getNotebookTextModels() {
            return iterator_1.Iterable.map(this._models.values(), data => data.model);
        }
        listNotebookDocuments() {
            return [...this._models].map(e => e[1].model);
        }
        _onWillDisposeDocument(model) {
            const modelData = this._models.get(model.uri);
            if (modelData) {
                this._onWillRemoveNotebookDocument.fire(modelData.model);
                this._models.delete(model.uri);
                this._notebookDocumentService.removeNotebookDocument(modelData);
                modelData.dispose();
                this._onDidRemoveNotebookDocument.fire(modelData.model);
            }
        }
        getOutputMimeTypeInfo(textModel, kernelProvides, output) {
            const sorted = this._displayOrder.sort(new Set(output.outputs.map(op => op.mime)));
            const notebookProviderInfo = this.notebookProviderInfoStore.get(textModel.viewType);
            return sorted
                .flatMap(mimeType => this._notebookRenderersInfoStore.findBestRenderers(notebookProviderInfo, mimeType, kernelProvides))
                .sort((a, b) => (a.rendererId === notebookCommon_1.RENDERER_NOT_AVAILABLE ? 1 : 0) - (b.rendererId === notebookCommon_1.RENDERER_NOT_AVAILABLE ? 1 : 0));
        }
        getContributedNotebookTypes(resource) {
            if (resource) {
                return this.notebookProviderInfoStore.getContributedNotebook(resource);
            }
            return [...this.notebookProviderInfoStore];
        }
        getContributedNotebookType(viewType) {
            return this.notebookProviderInfoStore.get(viewType);
        }
        getNotebookProviderResourceRoots() {
            const ret = [];
            this._notebookProviders.forEach(val => {
                if (val.extensionData.location) {
                    ret.push(uri_1.URI.revive(val.extensionData.location));
                }
            });
            return ret;
        }
        // --- copy & paste
        setToCopy(items, isCopy) {
            this._cutItems = items;
            this._lastClipboardIsCopy = isCopy;
        }
        getToCopy() {
            if (this._cutItems) {
                return { items: this._cutItems, isCopy: this._lastClipboardIsCopy };
            }
            return undefined;
        }
    };
    exports.NotebookService = NotebookService;
    exports.NotebookService = NotebookService = NotebookService_1 = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, accessibility_1.IAccessibilityService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, storage_1.IStorageService),
        __param(5, notebookDocumentService_1.INotebookDocumentService)
    ], NotebookService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvc2VydmljZXMvbm90ZWJvb2tTZXJ2aWNlSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBd0N6RixJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUEwQixTQUFRLHNCQUFVOztpQkFFaEMsOEJBQXlCLEdBQUcsaUJBQWlCLEFBQXBCLENBQXFCO2lCQUM5Qyw0QkFBdUIsR0FBRyxTQUFTLEFBQVosQ0FBYTtRQVE1RCxZQUNrQixjQUErQixFQUM3QixnQkFBbUMsRUFDOUIsc0JBQStELEVBQ2hFLHFCQUE2RCxFQUM3RCxxQkFBNkQsRUFDN0QscUJBQTZELEVBQ3RFLFlBQTJDLEVBQ3BCLG1DQUF5RixFQUN6RyxlQUFxRDtZQUUxRSxLQUFLLEVBQUUsQ0FBQztZQVJpQywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQy9DLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDNUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM1QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3JELGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQ0gsd0NBQW1DLEdBQW5DLG1DQUFtQyxDQUFxQztZQUN4RixvQkFBZSxHQUFmLGVBQWUsQ0FBcUI7WUFkbkUsYUFBUSxHQUFZLEtBQUssQ0FBQztZQUVqQix3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBZ0MsQ0FBQztZQUM5RCxrQ0FBNkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFldEYsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGlCQUFPLENB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