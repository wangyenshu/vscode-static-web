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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/core/textModelDefaults", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/language", "vs/editor/common/services/textResourceConfiguration", "vs/platform/configuration/common/configuration", "vs/platform/undoRedo/common/undoRedo", "vs/base/common/hash", "vs/editor/common/model/editStack", "vs/base/common/network", "vs/base/common/objects", "vs/editor/common/languages/languageConfigurationRegistry"], function (require, exports, event_1, lifecycle_1, platform, editOperation_1, range_1, textModel_1, textModelDefaults_1, modesRegistry_1, language_1, textResourceConfiguration_1, configuration_1, undoRedo_1, hash_1, editStack_1, network_1, objects_1, languageConfigurationRegistry_1) {
    "use strict";
    var ModelService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultModelSHA1Computer = exports.ModelService = void 0;
    function MODEL_ID(resource) {
        return resource.toString();
    }
    class ModelData {
        constructor(model, onWillDispose, onDidChangeLanguage) {
            this.model = model;
            this._modelEventListeners = new lifecycle_1.DisposableStore();
            this.model = model;
            this._modelEventListeners.add(model.onWillDispose(() => onWillDispose(model)));
            this._modelEventListeners.add(model.onDidChangeLanguage((e) => onDidChangeLanguage(model, e)));
        }
        dispose() {
            this._modelEventListeners.dispose();
        }
    }
    const DEFAULT_EOL = (platform.isLinux || platform.isMacintosh) ? 1 /* DefaultEndOfLine.LF */ : 2 /* DefaultEndOfLine.CRLF */;
    class DisposedModelInfo {
        constructor(uri, initialUndoRedoSnapshot, time, sharesUndoRedoStack, heapSize, sha1, versionId, alternativeVersionId) {
            this.uri = uri;
            this.initialUndoRedoSnapshot = initialUndoRedoSnapshot;
            this.time = time;
            this.sharesUndoRedoStack = sharesUndoRedoStack;
            this.heapSize = heapSize;
            this.sha1 = sha1;
            this.versionId = versionId;
            this.alternativeVersionId = alternativeVersionId;
        }
    }
    let ModelService = class ModelService extends lifecycle_1.Disposable {
        static { ModelService_1 = this; }
        static { this.MAX_MEMORY_FOR_CLOSED_FILES_UNDO_STACK = 20 * 1024 * 1024; }
        constructor(_configurationService, _resourcePropertiesService, _undoRedoService, _languageService, _languageConfigurationService) {
            super();
            this._configurationService = _configurationService;
            this._resourcePropertiesService = _resourcePropertiesService;
            this._undoRedoService = _undoRedoService;
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            this._onModelAdded = this._register(new event_1.Emitter());
            this.onModelAdded = this._onModelAdded.event;
            this._onModelRemoved = this._register(new event_1.Emitter());
            this.onModelRemoved = this._onModelRemoved.event;
            this._onModelModeChanged = this._register(new event_1.Emitter());
            this.onModelLanguageChanged = this._onModelModeChanged.event;
            this._modelCreationOptionsByLanguageAndResource = Object.create(null);
            this._models = {};
            this._disposedModels = new Map();
            this._disposedModelsHeapSize = 0;
            this._register(this._configurationService.onDidChangeConfiguration(e => this._updateModelOptions(e)));
            this._updateModelOptions(undefined);
        }
        static _readModelOptions(config, isForSimpleWidget) {
            let tabSize = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.tabSize;
            if (config.editor && typeof config.editor.tabSize !== 'undefined') {
                const parsedTabSize = parseInt(config.editor.tabSize, 10);
                if (!isNaN(parsedTabSize)) {
                    tabSize = parsedTabSize;
                }
                if (tabSize < 1) {
                    tabSize = 1;
                }
            }
            let indentSize = 'tabSize';
            if (config.editor && typeof config.editor.indentSize !== 'undefined' && config.editor.indentSize !== 'tabSize') {
                const parsedIndentSize = parseInt(config.editor.indentSize, 10);
                if (!isNaN(parsedIndentSize)) {
                    indentSize = Math.max(parsedIndentSize, 1);
                }
            }
            let insertSpaces = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.insertSpaces;
            if (config.editor && typeof config.editor.insertSpaces !== 'undefined') {
                insertSpaces = (config.editor.insertSpaces === 'false' ? false : Boolean(config.editor.insertSpaces));
            }
            let newDefaultEOL = DEFAULT_EOL;
            const eol = config.eol;
            if (eol === '\r\n') {
                newDefaultEOL = 2 /* DefaultEndOfLine.CRLF */;
            }
            else if (eol === '\n') {
                newDefaultEOL = 1 /* DefaultEndOfLine.LF */;
            }
            let trimAutoWhitespace = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.trimAutoWhitespace;
            if (config.editor && typeof config.editor.trimAutoWhitespace !== 'undefined') {
                trimAutoWhitespace = (config.editor.trimAutoWhitespace === 'false' ? false : Boolean(config.editor.trimAutoWhitespace));
            }
            let detectIndentation = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.detectIndentation;
            if (config.editor && typeof config.editor.detectIndentation !== 'undefined') {
                detectIndentation = (config.editor.detectIndentation === 'false' ? false : Boolean(config.editor.detectIndentation));
            }
            let largeFileOptimizations = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.largeFileOptimizations;
            if (config.editor && typeof config.editor.largeFileOptimizations !== 'undefined') {
                largeFileOptimizations = (config.editor.largeFileOptimizations === 'false' ? false : Boolean(config.editor.largeFileOptimizations));
            }
            let bracketPairColorizationOptions = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.bracketPairColorizationOptions;
            if (config.editor?.bracketPairColorization && typeof config.editor.bracketPairColorization === 'object') {
                bracketPairColorizationOptions = {
                    enabled: !!config.editor.bracketPairColorization.enabled,
                    independentColorPoolPerBracketType: !!config.editor.bracketPairColorization.independentColorPoolPerBracketType
                };
            }
            return {
                isForSimpleWidget: isForSimpleWidget,
                tabSize: tabSize,
                indentSize: indentSize,
                insertSpaces: insertSpaces,
                detectIndentation: detectIndentation,
                defaultEOL: newDefaultEOL,
                trimAutoWhitespace: trimAutoWhitespace,
                largeFileOptimizations: largeFileOptimizations,
                bracketPairColorizationOptions
            };
        }
        _getEOL(resource, language) {
            if (resource) {
                return this._resourcePropertiesService.getEOL(resource, language);
            }
            const eol = this._configurationService.getValue('files.eol', { overrideIdentifier: language });
            if (eol && typeof eol === 'string' && eol !== 'auto') {
                return eol;
            }
            return platform.OS === 3 /* platform.OperatingSystem.Linux */ || platform.OS === 2 /* platform.OperatingSystem.Macintosh */ ? '\n' : '\r\n';
        }
        _shouldRestoreUndoStack() {
            const result = this._configurationService.getValue('files.restoreUndoStack');
            if (typeof result === 'boolean') {
                return result;
            }
            return true;
        }
        getCreationOptions(languageIdOrSelection, resource, isForSimpleWidget) {
            const language = (typeof languageIdOrSelection === 'string' ? languageIdOrSelection : languageIdOrSelection.languageId);
            let creationOptions = this._modelCreationOptionsByLanguageAndResource[language + resource];
            if (!creationOptions) {
                const editor = this._configurationService.getValue('editor', { overrideIdentifier: language, resource });
                const eol = this._getEOL(resource, language);
                creationOptions = ModelService_1._readModelOptions({ editor, eol }, isForSimpleWidget);
                this._modelCreationOptionsByLanguageAndResource[language + resource] = creationOptions;
            }
            return creationOptions;
        }
        _updateModelOptions(e) {
            const oldOptionsByLanguageAndResource = this._modelCreationOptionsByLanguageAndResource;
            this._modelCreationOptionsByLanguageAndResource = Object.create(null);
            // Update options on all models
            const keys = Object.keys(this._models);
            for (let i = 0, len = keys.length; i < len; i++) {
                const modelId = keys[i];
                const modelData = this._models[modelId];
                const language = modelData.model.getLanguageId();
                const uri = modelData.model.uri;
                if (e && !e.affectsConfiguration('editor', { overrideIdentifier: language, resource: uri }) && !e.affectsConfiguration('files.eol', { overrideIdentifier: language, resource: uri })) {
                    continue; // perf: skip if this model is not affected by configuration change
                }
                const oldOptions = oldOptionsByLanguageAndResource[language + uri];
                const newOptions = this.getCreationOptions(language, uri, modelData.model.isForSimpleWidget);
                ModelService_1._setModelOptionsForModel(modelData.model, newOptions, oldOptions);
            }
        }
        static _setModelOptionsForModel(model, newOptions, currentOptions) {
            if (currentOptions && currentOptions.defaultEOL !== newOptions.defaultEOL && model.getLineCount() === 1) {
                model.setEOL(newOptions.defaultEOL === 1 /* DefaultEndOfLine.LF */ ? 0 /* EndOfLineSequence.LF */ : 1 /* EndOfLineSequence.CRLF */);
            }
            if (currentOptions
                && (currentOptions.detectIndentation === newOptions.detectIndentation)
                && (currentOptions.insertSpaces === newOptions.insertSpaces)
                && (currentOptions.tabSize === newOptions.tabSize)
                && (currentOptions.indentSize === newOptions.indentSize)
                && (currentOptions.trimAutoWhitespace === newOptions.trimAutoWhitespace)
                && (0, objects_1.equals)(currentOptions.bracketPairColorizationOptions, newOptions.bracketPairColorizationOptions)) {
                // Same indent opts, no need to touch the model
                return;
            }
            if (newOptions.detectIndentation) {
                model.detectIndentation(newOptions.insertSpaces, newOptions.tabSize);
                model.updateOptions({
                    trimAutoWhitespace: newOptions.trimAutoWhitespace,
                    bracketColorizationOptions: newOptions.bracketPairColorizationOptions
                });
            }
            else {
                model.updateOptions({
                    insertSpaces: newOptions.insertSpaces,
                    tabSize: newOptions.tabSize,
                    indentSize: newOptions.indentSize,
                    trimAutoWhitespace: newOptions.trimAutoWhitespace,
                    bracketColorizationOptions: newOptions.bracketPairColorizationOptions
                });
            }
        }
        // --- begin IModelService
        _insertDisposedModel(disposedModelData) {
            this._disposedModels.set(MODEL_ID(disposedModelData.uri), disposedModelData);
            this._disposedModelsHeapSize += disposedModelData.heapSize;
        }
        _removeDisposedModel(resource) {
            const disposedModelData = this._disposedModels.get(MODEL_ID(resource));
            if (disposedModelData) {
                this._disposedModelsHeapSize -= disposedModelData.heapSize;
            }
            this._disposedModels.delete(MODEL_ID(resource));
            return disposedModelData;
        }
        _ensureDisposedModelsHeapSize(maxModelsHeapSize) {
            if (this._disposedModelsHeapSize > maxModelsHeapSize) {
                // we must remove some old undo stack elements to free up some memory
                const disposedModels = [];
                this._disposedModels.forEach(entry => {
                    if (!entry.sharesUndoRedoStack) {
                        disposedModels.push(entry);
                    }
                });
                disposedModels.sort((a, b) => a.time - b.time);
                while (disposedModels.length > 0 && this._disposedModelsHeapSize > maxModelsHeapSize) {
                    const disposedModel = disposedModels.shift();
                    this._removeDisposedModel(disposedModel.uri);
                    if (disposedModel.initialUndoRedoSnapshot !== null) {
                        this._undoRedoService.restoreSnapshot(disposedModel.initialUndoRedoSnapshot);
                    }
                }
            }
        }
        _createModelData(value, languageIdOrSelection, resource, isForSimpleWidget) {
            // create & save the model
            const options = this.getCreationOptions(languageIdOrSelection, resource, isForSimpleWidget);
            const model = new textModel_1.TextModel(value, languageIdOrSelection, options, resource, this._undoRedoService, this._languageService, this._languageConfigurationService);
            if (resource && this._disposedModels.has(MODEL_ID(resource))) {
                const disposedModelData = this._removeDisposedModel(resource);
                const elements = this._undoRedoService.getElements(resource);
                const sha1Computer = this._getSHA1Computer();
                const sha1IsEqual = (sha1Computer.canComputeSHA1(model)
                    ? sha1Computer.computeSHA1(model) === disposedModelData.sha1
                    : false);
                if (sha1IsEqual || disposedModelData.sharesUndoRedoStack) {
                    for (const element of elements.past) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(resource)) {
                            element.setModel(model);
                        }
                    }
                    for (const element of elements.future) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(resource)) {
                            element.setModel(model);
                        }
                    }
                    this._undoRedoService.setElementsValidFlag(resource, true, (element) => ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(resource)));
                    if (sha1IsEqual) {
                        model._overwriteVersionId(disposedModelData.versionId);
                        model._overwriteAlternativeVersionId(disposedModelData.alternativeVersionId);
                        model._overwriteInitialUndoRedoSnapshot(disposedModelData.initialUndoRedoSnapshot);
                    }
                }
                else {
                    if (disposedModelData.initialUndoRedoSnapshot !== null) {
                        this._undoRedoService.restoreSnapshot(disposedModelData.initialUndoRedoSnapshot);
                    }
                }
            }
            const modelId = MODEL_ID(model.uri);
            if (this._models[modelId]) {
                // There already exists a model with this id => this is a programmer error
                throw new Error('ModelService: Cannot add model because it already exists!');
            }
            const modelData = new ModelData(model, (model) => this._onWillDispose(model), (model, e) => this._onDidChangeLanguage(model, e));
            this._models[modelId] = modelData;
            return modelData;
        }
        updateModel(model, value) {
            const options = this.getCreationOptions(model.getLanguageId(), model.uri, model.isForSimpleWidget);
            const { textBuffer, disposable } = (0, textModel_1.createTextBuffer)(value, options.defaultEOL);
            // Return early if the text is already set in that form
            if (model.equalsTextBuffer(textBuffer)) {
                disposable.dispose();
                return;
            }
            // Otherwise find a diff between the values and update model
            model.pushStackElement();
            model.pushEOL(textBuffer.getEOL() === '\r\n' ? 1 /* EndOfLineSequence.CRLF */ : 0 /* EndOfLineSequence.LF */);
            model.pushEditOperations([], ModelService_1._computeEdits(model, textBuffer), () => []);
            model.pushStackElement();
            disposable.dispose();
        }
        static _commonPrefix(a, aLen, aDelta, b, bLen, bDelta) {
            const maxResult = Math.min(aLen, bLen);
            let result = 0;
            for (let i = 0; i < maxResult && a.getLineContent(aDelta + i) === b.getLineContent(bDelta + i); i++) {
                result++;
            }
            return result;
        }
        static _commonSuffix(a, aLen, aDelta, b, bLen, bDelta) {
            const maxResult = Math.min(aLen, bLen);
            let result = 0;
            for (let i = 0; i < maxResult && a.getLineContent(aDelta + aLen - i) === b.getLineContent(bDelta + bLen - i); i++) {
                result++;
            }
            return result;
        }
        /**
         * Compute edits to bring `model` to the state of `textSource`.
         */
        static _computeEdits(model, textBuffer) {
            const modelLineCount = model.getLineCount();
            const textBufferLineCount = textBuffer.getLineCount();
            const commonPrefix = this._commonPrefix(model, modelLineCount, 1, textBuffer, textBufferLineCount, 1);
            if (modelLineCount === textBufferLineCount && commonPrefix === modelLineCount) {
                // equality case
                return [];
            }
            const commonSuffix = this._commonSuffix(model, modelLineCount - commonPrefix, commonPrefix, textBuffer, textBufferLineCount - commonPrefix, commonPrefix);
            let oldRange;
            let newRange;
            if (commonSuffix > 0) {
                oldRange = new range_1.Range(commonPrefix + 1, 1, modelLineCount - commonSuffix + 1, 1);
                newRange = new range_1.Range(commonPrefix + 1, 1, textBufferLineCount - commonSuffix + 1, 1);
            }
            else if (commonPrefix > 0) {
                oldRange = new range_1.Range(commonPrefix, model.getLineMaxColumn(commonPrefix), modelLineCount, model.getLineMaxColumn(modelLineCount));
                newRange = new range_1.Range(commonPrefix, 1 + textBuffer.getLineLength(commonPrefix), textBufferLineCount, 1 + textBuffer.getLineLength(textBufferLineCount));
            }
            else {
                oldRange = new range_1.Range(1, 1, modelLineCount, model.getLineMaxColumn(modelLineCount));
                newRange = new range_1.Range(1, 1, textBufferLineCount, 1 + textBuffer.getLineLength(textBufferLineCount));
            }
            return [editOperation_1.EditOperation.replaceMove(oldRange, textBuffer.getValueInRange(newRange, 0 /* EndOfLinePreference.TextDefined */))];
        }
        createModel(value, languageSelection, resource, isForSimpleWidget = false) {
            let modelData;
            if (languageSelection) {
                modelData = this._createModelData(value, languageSelection, resource, isForSimpleWidget);
            }
            else {
                modelData = this._createModelData(value, modesRegistry_1.PLAINTEXT_LANGUAGE_ID, resource, isForSimpleWidget);
            }
            this._onModelAdded.fire(modelData.model);
            return modelData.model;
        }
        destroyModel(resource) {
            // We need to support that not all models get disposed through this service (i.e. model.dispose() should work!)
            const modelData = this._models[MODEL_ID(resource)];
            if (!modelData) {
                return;
            }
            modelData.model.dispose();
        }
        getModels() {
            const ret = [];
            const keys = Object.keys(this._models);
            for (let i = 0, len = keys.length; i < len; i++) {
                const modelId = keys[i];
                ret.push(this._models[modelId].model);
            }
            return ret;
        }
        getModel(resource) {
            const modelId = MODEL_ID(resource);
            const modelData = this._models[modelId];
            if (!modelData) {
                return null;
            }
            return modelData.model;
        }
        // --- end IModelService
        _schemaShouldMaintainUndoRedoElements(resource) {
            return (resource.scheme === network_1.Schemas.file
                || resource.scheme === network_1.Schemas.vscodeRemote
                || resource.scheme === network_1.Schemas.vscodeUserData
                || resource.scheme === network_1.Schemas.vscodeNotebookCell
                || resource.scheme === 'fake-fs' // for tests
            );
        }
        _onWillDispose(model) {
            const modelId = MODEL_ID(model.uri);
            const modelData = this._models[modelId];
            const sharesUndoRedoStack = (this._undoRedoService.getUriComparisonKey(model.uri) !== model.uri.toString());
            let maintainUndoRedoStack = false;
            let heapSize = 0;
            if (sharesUndoRedoStack || (this._shouldRestoreUndoStack() && this._schemaShouldMaintainUndoRedoElements(model.uri))) {
                const elements = this._undoRedoService.getElements(model.uri);
                if (elements.past.length > 0 || elements.future.length > 0) {
                    for (const element of elements.past) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(model.uri)) {
                            maintainUndoRedoStack = true;
                            heapSize += element.heapSize(model.uri);
                            element.setModel(model.uri); // remove reference from text buffer instance
                        }
                    }
                    for (const element of elements.future) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(model.uri)) {
                            maintainUndoRedoStack = true;
                            heapSize += element.heapSize(model.uri);
                            element.setModel(model.uri); // remove reference from text buffer instance
                        }
                    }
                }
            }
            const maxMemory = ModelService_1.MAX_MEMORY_FOR_CLOSED_FILES_UNDO_STACK;
            const sha1Computer = this._getSHA1Computer();
            if (!maintainUndoRedoStack) {
                if (!sharesUndoRedoStack) {
                    const initialUndoRedoSnapshot = modelData.model.getInitialUndoRedoSnapshot();
                    if (initialUndoRedoSnapshot !== null) {
                        this._undoRedoService.restoreSnapshot(initialUndoRedoSnapshot);
                    }
                }
            }
            else if (!sharesUndoRedoStack && (heapSize > maxMemory || !sha1Computer.canComputeSHA1(model))) {
                // the undo stack for this file would never fit in the configured memory or the file is very large, so don't bother with it.
                const initialUndoRedoSnapshot = modelData.model.getInitialUndoRedoSnapshot();
                if (initialUndoRedoSnapshot !== null) {
                    this._undoRedoService.restoreSnapshot(initialUndoRedoSnapshot);
                }
            }
            else {
                this._ensureDisposedModelsHeapSize(maxMemory - heapSize);
                // We only invalidate the elements, but they remain in the undo-redo service.
                this._undoRedoService.setElementsValidFlag(model.uri, false, (element) => ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(model.uri)));
                this._insertDisposedModel(new DisposedModelInfo(model.uri, modelData.model.getInitialUndoRedoSnapshot(), Date.now(), sharesUndoRedoStack, heapSize, sha1Computer.computeSHA1(model), model.getVersionId(), model.getAlternativeVersionId()));
            }
            delete this._models[modelId];
            modelData.dispose();
            // clean up cache
            delete this._modelCreationOptionsByLanguageAndResource[model.getLanguageId() + model.uri];
            this._onModelRemoved.fire(model);
        }
        _onDidChangeLanguage(model, e) {
            const oldLanguageId = e.oldLanguage;
            const newLanguageId = model.getLanguageId();
            const oldOptions = this.getCreationOptions(oldLanguageId, model.uri, model.isForSimpleWidget);
            const newOptions = this.getCreationOptions(newLanguageId, model.uri, model.isForSimpleWidget);
            ModelService_1._setModelOptionsForModel(model, newOptions, oldOptions);
            this._onModelModeChanged.fire({ model, oldLanguageId: oldLanguageId });
        }
        _getSHA1Computer() {
            return new DefaultModelSHA1Computer();
        }
    };
    exports.ModelService = ModelService;
    exports.ModelService = ModelService = ModelService_1 = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, textResourceConfiguration_1.ITextResourcePropertiesService),
        __param(2, undoRedo_1.IUndoRedoService),
        __param(3, language_1.ILanguageService),
        __param(4, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], ModelService);
    class DefaultModelSHA1Computer {
        static { this.MAX_MODEL_SIZE = 10 * 1024 * 1024; } // takes 200ms to compute a sha1 on a 10MB model on a new machine
        canComputeSHA1(model) {
            return (model.getValueLength() <= DefaultModelSHA1Computer.MAX_MODEL_SIZE);
        }
        computeSHA1(model) {
            // compute the sha1
            const shaComputer = new hash_1.StringSHA1();
            const snapshot = model.createSnapshot();
            let text;
            while ((text = snapshot.read())) {
                shaComputer.update(text);
            }
            return shaComputer.digest();
        }
    }
    exports.DefaultModelSHA1Computer = DefaultModelSHA1Computer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9zZXJ2aWNlcy9tb2RlbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXdCaEcsU0FBUyxRQUFRLENBQUMsUUFBYTtRQUM5QixPQUFPLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsTUFBTSxTQUFTO1FBSWQsWUFDaUIsS0FBZ0IsRUFDaEMsYUFBMEMsRUFDMUMsbUJBQStFO1lBRi9ELFVBQUssR0FBTCxLQUFLLENBQVc7WUFIaEIseUJBQW9CLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFPN0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0UsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEcsQ0FBQztRQUVNLE9BQU87WUFDYixJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDckMsQ0FBQztLQUNEO0lBa0JELE1BQU0sV0FBVyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyw2QkFBcUIsQ0FBQyw4QkFBc0IsQ0FBQztJQUU3RyxNQUFNLGlCQUFpQjtRQUN0QixZQUNp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