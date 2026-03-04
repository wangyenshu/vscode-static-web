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
define(["require", "exports", "vs/base/common/event", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/common/services/model", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/workbench/common/editor", "vs/workbench/common/memento", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/searchEditor/browser/searchEditorModel", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/path/common/pathService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/configuration/common/configuration", "vs/base/common/buffer", "vs/workbench/common/editor/editorInput", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/css!./media/searchEditor"], function (require, exports, event_1, path_1, resources_1, uri_1, model_1, nls_1, dialogs_1, instantiation_1, storage_1, telemetry_1, editor_1, memento_1, constants_1, searchEditorModel_1, searchEditorSerialization_1, pathService_1, textfiles_1, workingCopyService_1, configuration_1, buffer_1, editorInput_1, codicons_1, iconRegistry_1) {
    "use strict";
    var SearchEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getOrMakeSearchEditorInput = exports.SearchEditorInput = exports.SEARCH_EDITOR_EXT = void 0;
    exports.SEARCH_EDITOR_EXT = '.code-search';
    const SearchEditorIcon = (0, iconRegistry_1.registerIcon)('search-editor-label-icon', codicons_1.Codicon.search, (0, nls_1.localize)('searchEditorLabelIcon', 'Icon of the search editor label.'));
    let SearchEditorInput = class SearchEditorInput extends editorInput_1.EditorInput {
        static { SearchEditorInput_1 = this; }
        static { this.ID = constants_1.SearchEditorInputTypeId; }
        get typeId() {
            return SearchEditorInput_1.ID;
        }
        get editorId() {
            return this.typeId;
        }
        getIcon() {
            return SearchEditorIcon;
        }
        get capabilities() {
            let capabilities = 8 /* EditorInputCapabilities.Singleton */;
            if (!this.backingUri) {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            return capabilities;
        }
        get resource() {
            return this.backingUri || this.modelUri;
        }
        constructor(modelUri, backingUri, modelService, textFileService, fileDialogService, instantiationService, workingCopyService, telemetryService, pathService, storageService) {
            super();
            this.modelUri = modelUri;
            this.backingUri = backingUri;
            this.modelService = modelService;
            this.textFileService = textFileService;
            this.fileDialogService = fileDialogService;
            this.instantiationService = instantiationService;
            this.workingCopyService = workingCopyService;
            this.telemetryService = telemetryService;
            this.pathService = pathService;
            this.dirty = false;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this.oldDecorationsIDs = [];
            this.model = instantiationService.createInstance(searchEditorModel_1.SearchEditorModel, modelUri);
            if (this.modelUri.scheme !== constants_1.SearchEditorScheme) {
                throw Error('SearchEditorInput must be invoked with a SearchEditorScheme uri');
            }
            this.memento = new memento_1.Memento(SearchEditorInput_1.ID, storageService);
            storageService.onWillSaveState(() => this.memento.saveMemento());
            const input = this;
            const workingCopyAdapter = new class {
                constructor() {
                    this.typeId = constants_1.SearchEditorWorkingCopyTypeId;
                    this.resource = input.modelUri;
                    this.capabilities = input.hasCapability(4 /* EditorInputCapabilities.Untitled */) ? 2 /* WorkingCopyCapabilities.Untitled */ : 0 /* WorkingCopyCapabilities.None */;
                    this.onDidChangeDirty = input.onDidChangeDirty;
                    this.onDidChangeContent = input.onDidChangeContent;
                    this.onDidSave = input.onDidSave;
                }
                get name() { return input.getName(); }
                isDirty() { return input.isDirty(); }
                isModified() { return input.isDirty(); }
                backup(token) { return input.backup(token); }
                save(options) { return input.save(0, options).then(editor => !!editor); }
                revert(options) { return input.revert(0, options); }
            };
            this._register(this.workingCopyService.registerWorkingCopy(workingCopyAdapter));
        }
        async save(group, options) {
            if (((await this.resolveModels()).resultsModel).isDisposed()) {
                return;
            }
            if (this.backingUri) {
                await this.textFileService.write(this.backingUri, await this.serializeForDisk(), options);
                this.setDirty(false);
                this._onDidSave.fire({ reason: options?.reason, source: options?.source });
                return this;
            }
            else {
                return this.saveAs(group, options);
            }
        }
        tryReadConfigSync() {
            return this._cachedConfigurationModel?.config;
        }
        async serializeForDisk() {
            const { configurationModel, resultsModel } = await this.resolveModels();
            return (0, searchEditorSerialization_1.serializeSearchConfiguration)(configurationModel.config) + '\n' + resultsModel.getValue();
        }
        registerConfigChangeListeners(model) {
            this.configChangeListenerDisposable?.dispose();
            if (!this.isDisposed()) {
                this.configChangeListenerDisposable = model.onConfigDidUpdate(() => {
                    if (this.lastLabel !== this.getName()) {
                        this._onDidChangeLabel.fire();
                        this.lastLabel = this.getName();
                    }
                    this.memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */).searchConfig = model.config;
                });
                this._register(this.configChangeListenerDisposable);
            }
        }
        async resolveModels() {
            return this.model.resolve().then(data => {
                this._cachedResultsModel = data.resultsModel;
                this._cachedConfigurationModel = data.configurationModel;
                if (this.lastLabel !== this.getName()) {
                    this._onDidChangeLabel.fire();
                    this.lastLabel = this.getName();
                }
                this.registerConfigChangeListeners(data.configurationModel);
                return data;
            });
        }
        async saveAs(group, options) {
            const path = await this.fileDialogService.pickFileToSave(await this.suggestFileName(), options?.availableFileSystems);
            if (path) {
                this.telemetryService.publicLog2('searchEditor/saveSearchResults');
                const toWrite = await this.serializeForDisk();
                if (await this.textFileService.create([{ resource: path, value: toWrite, options: { overwrite: true } }])) {
                    this.setDirty(false);
                    if (!(0, resources_1.isEqual)(path, this.modelUri)) {
                        const input = this.instantiationService.invokeFunction(exports.getOrMakeSearchEditorInput, { fileUri: path, from: 'existingFile' });
                        input.setMatchRanges(this.getMatchRanges());
                        return input;
                    }
                    return this;
                }
            }
            return undefined;
        }
        getName(maxLength = 12) {
            const trimToMax = (label) => (label.length < maxLength ? label : `${label.slice(0, maxLength - 3)}...`);
            if (this.backingUri) {
                const originalURI = editor_1.EditorResourceAccessor.getOriginalUri(this);
                return (0, nls_1.localize)('searchTitle.withQuery', "Search: {0}", (0, path_1.basename)((originalURI ?? this.backingUri).path, exports.SEARCH_EDITOR_EXT));
            }
            const query = this._cachedConfigurationModel?.config?.query?.trim();
            if (query) {
                return (0, nls_1.localize)('searchTitle.withQuery', "Search: {0}", trimToMax(query));
            }
            return (0, nls_1.localize)('searchTitle', "Search");
        }
        setDirty(dirty) {
            const wasDirty = this.dirty;
            this.dirty = dirty;
            if (wasDirty !== dirty) {
                this._onDidChangeDirty.fire();
            }
        }
        isDirty() {
            return this.dirty;
        }
        async rename(group, target) {
            if ((0, resources_1.extname)(target) === exports.SEARCH_EDITOR_EXT) {
                return {
                    editor: this.instantiationService.invokeFunction(exports.getOrMakeSearchEditorInput, { from: 'existingFile', fileUri: target })
                };
            }
            // Ignore move if editor was renamed to a different file extension
            return undefined;
        }
        dispose() {
            this.modelService.destroyModel(this.modelUri);
            super.dispose();
        }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            if (other instanceof SearchEditorInput_1) {
                return !!(other.modelUri.fragment && other.modelUri.fragment === this.modelUri.fragment) || !!(other.backingUri && (0, resources_1.isEqual)(other.backingUri, this.backingUri));
            }
            return false;
        }
        getMatchRanges() {
            return (this._cachedResultsModel?.getAllDecorations() ?? [])
                .filter(decoration => decoration.options.className === constants_1.SearchEditorFindMatchClass)
                .filter(({ range }) => !(range.startColumn === 1 && range.endColumn === 1))
                .map(({ range }) => range);
        }
        async setMatchRanges(ranges) {
            this.oldDecorationsIDs = (await this.resolveModels()).resultsModel.deltaDecorations(this.oldDecorationsIDs, ranges.map(range => ({ range, options: { description: 'search-editor-find-match', className: constants_1.SearchEditorFindMatchClass, stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */ } })));
        }
        async revert(group, options) {
            if (options?.soft) {
                this.setDirty(false);
                return;
            }
            if (this.backingUri) {
                const { config, text } = await this.instantiationService.invokeFunction(searchEditorSerialization_1.parseSavedSearchEditor, this.backingUri);
                const { resultsModel, configurationModel } = await this.resolveModels();
                resultsModel.setValue(text);
                configurationModel.updateConfig(config);
            }
            else {
                (await this.resolveModels()).resultsModel.setValue('');
            }
            super.revert(group, options);
            this.setDirty(false);
        }
        async backup(token) {
            const contents = await this.serializeForDisk();
            if (token.isCancellationRequested) {
                return {};
            }
            return {
                content: (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents))
            };
        }
        async suggestFileName() {
            const query = (await this.resolveModels()).configurationModel.config.query;
            const searchFileName = (query.replace(/[^\w \-_]+/g, '_') || 'Search') + exports.SEARCH_EDITOR_EXT;
            return (0, resources_1.joinPath)(await this.fileDialogService.defaultFilePath(this.pathService.defaultUriScheme), searchFileName);
        }
        toUntyped() {
            if (this.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                return undefined;
            }
            return {
                resource: this.resource,
                options: {
                    override: SearchEditorInput_1.ID
                }
            };
        }
    };
    exports.SearchEditorInput = SearchEditorInput;
    exports.SearchEditorInput = SearchEditorInput = SearchEditorInput_1 = __decorate([
        __param(2, model_1.IModelService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, dialogs_1.IFileDialogService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, workingCopyService_1.IWorkingCopyService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, pathService_1.IPathService),
        __param(9, storage_1.IStorageService)
    ], SearchEditorInput);
    const getOrMakeSearchEditorInput = (accessor, existingData) => {
        const storageService = accessor.get(storage_1.IStorageService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const modelUri = existingData.from === 'model' ? existingData.modelUri : uri_1.URI.from({ scheme: constants_1.SearchEditorScheme, fragment: `${Math.random()}` });
        if (!searchEditorModel_1.searchEditorModelFactory.models.has(modelUri)) {
            if (existingData.from === 'existingFile') {
                instantiationService.invokeFunction(accessor => searchEditorModel_1.searchEditorModelFactory.initializeModelFromExistingFile(accessor, modelUri, existingData.fileUri));
            }
            else {
                const searchEditorSettings = configurationService.getValue('search').searchEditor;
                const reuseOldSettings = searchEditorSettings.reusePriorSearchConfiguration;
                const defaultNumberOfContextLines = searchEditorSettings.defaultNumberOfContextLines;
                const priorConfig = reuseOldSettings ? new memento_1.Memento(SearchEditorInput.ID, storageService).getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */).searchConfig : {};
                const defaultConfig = (0, searchEditorSerialization_1.defaultSearchConfig)();
                const config = { ...defaultConfig, ...priorConfig, ...existingData.config };
                if (defaultNumberOfContextLines !== null && defaultNumberOfContextLines !== undefined) {
                    config.contextLines = existingData?.config?.contextLines ?? defaultNumberOfContextLines;
                }
                if (existingData.from === 'rawData') {
                    if (existingData.resultsContents) {
                        config.contextLines = 0;
                    }
                    instantiationService.invokeFunction(accessor => searchEditorModel_1.searchEditorModelFactory.initializeModelFromRawData(accessor, modelUri, config, existingData.resultsContents));
                }
                else {
                    instantiationService.invokeFunction(accessor => searchEditorModel_1.searchEditorModelFactory.initializeModelFromExistingModel(accessor, modelUri, config));
                }
            }
        }
        return instantiationService.createInstance(SearchEditorInput, modelUri, existingData.from === 'existingFile'
            ? existingData.fileUri
            : existingData.from === 'model'
                ? existingData.backupOf
                : undefined);
    };
    exports.getOrMakeSearchEditorInput = getOrMakeSearchEditorInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRWRpdG9ySW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2hFZGl0b3IvYnJvd3Nlci9zZWFyY2hFZGl0b3JJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0RuRixRQUFBLGlCQUFpQixHQUFHLGNBQWMsQ0FBQztJQUVoRCxNQUFNLGdCQUFnQixHQUFHLElBQUEsMkJBQVksRUFBQywwQkFBMEIsRUFBRSxrQkFBTyxDQUFDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7SUFFbEosSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSx5QkFBVzs7aUJBQ2pDLE9BQUUsR0FBVyxtQ0FBdUIsQUFBbEMsQ0FBbUM7UUFFckQsSUFBYSxNQUFNO1lBQ2xCLE9BQU8sbUJBQWlCLENBQUMsRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFFRCxJQUFhLFFBQVE7WUFDcEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFUSxPQUFPO1lBQ2YsT0FBTyxnQkFBZ0IsQ0FBQztRQUN6QixDQUFDO1FBRUQsSUFBYSxZQUFZO1lBQ3hCLElBQUksWUFBWSw0Q0FBb0MsQ0FBQztZQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN0QixZQUFZLDRDQUFvQyxDQUFDO1lBQ2xELENBQUM7WUFFRCxPQUFPLFlBQVksQ0FBQztRQUNyQixDQUFDO1FBZ0JELElBQUksUUFBUTtZQUNYLE9BQU8sSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3pDLENBQUM7UUFRRCxZQUNpQixRQUFhLEVBQ2IsVUFBMkIs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