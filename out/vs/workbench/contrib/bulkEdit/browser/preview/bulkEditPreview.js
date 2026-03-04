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
define(["require", "exports", "vs/editor/common/services/resolverService", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/editor/common/model/textModel", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/editor/common/core/range", "vs/editor/common/core/editOperation", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/base/common/event", "vs/workbench/contrib/bulkEdit/browser/conflicts", "vs/base/common/map", "vs/nls", "vs/base/common/resources", "vs/editor/browser/services/bulkEditService", "vs/base/common/codicons", "vs/base/common/uuid", "vs/editor/contrib/snippet/browser/snippetParser", "vs/base/common/symbols"], function (require, exports, resolverService_1, uri_1, language_1, model_1, textModel_1, lifecycle_1, arrays_1, range_1, editOperation_1, instantiation_1, files_1, event_1, conflicts_1, map_1, nls_1, resources_1, bulkEditService_1, codicons_1, uuid_1, snippetParser_1, symbols_1) {
    "use strict";
    var BulkFileOperations_1, BulkEditPreviewProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkEditPreviewProvider = exports.BulkFileOperations = exports.BulkCategory = exports.BulkFileOperation = exports.BulkFileOperationType = exports.BulkTextEdit = exports.CheckedStates = void 0;
    class CheckedStates {
        constructor() {
            this._states = new WeakMap();
            this._checkedCount = 0;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        dispose() {
            this._onDidChange.dispose();
        }
        get checkedCount() {
            return this._checkedCount;
        }
        isChecked(obj) {
            return this._states.get(obj) ?? false;
        }
        updateChecked(obj, value) {
            const valueNow = this._states.get(obj);
            if (valueNow === value) {
                return;
            }
            if (valueNow === undefined) {
                if (value) {
                    this._checkedCount += 1;
                }
            }
            else {
                if (value) {
                    this._checkedCount += 1;
                }
                else {
                    this._checkedCount -= 1;
                }
            }
            this._states.set(obj, value);
            this._onDidChange.fire(obj);
        }
    }
    exports.CheckedStates = CheckedStates;
    class BulkTextEdit {
        constructor(parent, textEdit) {
            this.parent = parent;
            this.textEdit = textEdit;
        }
    }
    exports.BulkTextEdit = BulkTextEdit;
    var BulkFileOperationType;
    (function (BulkFileOperationType) {
        BulkFileOperationType[BulkFileOperationType["TextEdit"] = 1] = "TextEdit";
        BulkFileOperationType[BulkFileOperationType["Create"] = 2] = "Create";
        BulkFileOperationType[BulkFileOperationType["Delete"] = 4] = "Delete";
        BulkFileOperationType[BulkFileOperationType["Rename"] = 8] = "Rename";
    })(BulkFileOperationType || (exports.BulkFileOperationType = BulkFileOperationType = {}));
    class BulkFileOperation {
        constructor(uri, parent) {
            this.uri = uri;
            this.parent = parent;
            this.type = 0;
            this.textEdits = [];
            this.originalEdits = new Map();
        }
        addEdit(index, type, edit) {
            this.type |= type;
            this.originalEdits.set(index, edit);
            if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                this.textEdits.push(new BulkTextEdit(this, edit));
            }
            else if (type === 8 /* BulkFileOperationType.Rename */) {
                this.newUri = edit.newResource;
            }
        }
        needsConfirmation() {
            for (const [, edit] of this.originalEdits) {
                if (!this.parent.checked.isChecked(edit)) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.BulkFileOperation = BulkFileOperation;
    class BulkCategory {
        static { this._defaultMetadata = Object.freeze({
            label: (0, nls_1.localize)('default', "Other"),
            icon: codicons_1.Codicon.symbolFile,
            needsConfirmation: false
        }); }
        static keyOf(metadata) {
            return metadata?.label || '<default>';
        }
        constructor(metadata = BulkCategory._defaultMetadata) {
            this.metadata = metadata;
            this.operationByResource = new Map();
        }
        get fileOperations() {
            return this.operationByResource.values();
        }
    }
    exports.BulkCategory = BulkCategory;
    let BulkFileOperations = BulkFileOperations_1 = class BulkFileOperations {
        static async create(accessor, bulkEdit) {
            const result = accessor.get(instantiation_1.IInstantiationService).createInstance(BulkFileOperations_1, bulkEdit);
            return await result._init();
        }
        constructor(_bulkEdit, _fileService, instaService) {
            this._bulkEdit = _bulkEdit;
            this._fileService = _fileService;
            this.checked = new CheckedStates();
            this.fileOperations = [];
            this.categories = [];
            this.conflicts = instaService.createInstance(conflicts_1.ConflictDetector, _bulkEdit);
        }
        dispose() {
            this.checked.dispose();
            this.conflicts.dispose();
        }
        async _init() {
            const operationByResource = new Map();
            const operationByCategory = new Map();
            const newToOldUri = new map_1.ResourceMap();
            for (let idx = 0; idx < this._bulkEdit.length; idx++) {
                const edit = this._bulkEdit[idx];
                let uri;
                let type;
                // store inital checked state
                this.checked.updateChecked(edit, !edit.metadata?.needsConfirmation);
                if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                    type = 1 /* BulkFileOperationType.TextEdit */;
                    uri = edit.resource;
                }
                else if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                    if (edit.newResource && edit.oldResource) {
                        type = 8 /* BulkFileOperationType.Rename */;
                        uri = edit.oldResource;
                        if (edit.options?.overwrite === undefined && edit.options?.ignoreIfExists && await this._fileService.exists(uri)) {
                            // noop -> "soft" rename to something that already exists
                            continue;
                        }
                        // map newResource onto oldResource so that text-edit appear for
                        // the same file element
                        newToOldUri.set(edit.newResource, uri);
                    }
                    else if (edit.oldResource) {
                        type = 4 /* BulkFileOperationType.Delete */;
                        uri = edit.oldResource;
                        if (edit.options?.ignoreIfNotExists && !await this._fileService.exists(uri)) {
                            // noop -> "soft" delete something that doesn't exist
                            continue;
                        }
                    }
                    else if (edit.newResource) {
                        type = 2 /* BulkFileOperationType.Create */;
                        uri = edit.newResource;
                        if (edit.options?.overwrite === undefined && edit.options?.ignoreIfExists && await this._fileService.exists(uri)) {
                            // noop -> "soft" create something that already exists
                            continue;
                        }
                    }
                    else {
                        // invalid edit -> skip
                        continue;
                    }
                }
                else {
                    // unsupported edit
                    continue;
                }
                const insert = (uri, map) => {
                    let key = resources_1.extUri.getComparisonKey(uri, true);
                    let operation = map.get(key);
                    // rename
                    if (!operation && newToOldUri.has(uri)) {
                        uri = newToOldUri.get(uri);
                        key = resources_1.extUri.getComparisonKey(uri, true);
                        operation = map.get(key);
                    }
                    if (!operation) {
                        operation = new BulkFileOperation(uri, this);
                        map.set(key, operation);
                    }
                    operation.addEdit(idx, type, edit);
                };
                insert(uri, operationByResource);
                // insert into "this" category
                const key = BulkCategory.keyOf(edit.metadata);
                let category = operationByCategory.get(key);
                if (!category) {
                    category = new BulkCategory(edit.metadata);
                    operationByCategory.set(key, category);
                }
                insert(uri, category.operationByResource);
            }
            operationByResource.forEach(value => this.fileOperations.push(value));
            operationByCategory.forEach(value => this.categories.push(value));
            // "correct" invalid parent-check child states that is
            // unchecked file edits (rename, create, delete) uncheck
            // all edits for a file, e.g no text change without rename
            for (const file of this.fileOperations) {
                if (file.type !== 1 /* BulkFileOperationType.TextEdit */) {
                    let checked = true;
                    for (const edit of file.originalEdits.values()) {
                        if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                            checked = checked && this.checked.isChecked(edit);
                        }
                    }
                    if (!checked) {
                        for (const edit of file.originalEdits.values()) {
                            this.checked.updateChecked(edit, checked);
                        }
                    }
                }
            }
            // sort (once) categories atop which have unconfirmed edits
            this.categories.sort((a, b) => {
                if (a.metadata.needsConfirmation === b.metadata.needsConfirmation) {
                    return a.metadata.label.localeCompare(b.metadata.label);
                }
                else if (a.metadata.needsConfirmation) {
                    return -1;
                }
                else {
                    return 1;
                }
            });
            return this;
        }
        getWorkspaceEdit() {
            const result = [];
            let allAccepted = true;
            for (let i = 0; i < this._bulkEdit.length; i++) {
                const edit = this._bulkEdit[i];
                if (this.checked.isChecked(edit)) {
                    result[i] = edit;
                    continue;
                }
                allAccepted = false;
            }
            if (allAccepted) {
                return this._bulkEdit;
            }
            // not all edits have been accepted
            (0, arrays_1.coalesceInPlace)(result);
            return result;
        }
        getFileEdits(uri) {
            for (const file of this.fileOperations) {
                if (file.uri.toString() === uri.toString()) {
                    const result = [];
                    let ignoreAll = false;
                    for (const edit of file.originalEdits.values()) {
                        if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                            if (this.checked.isChecked(edit)) {
                                result.push(editOperation_1.EditOperation.replaceMove(range_1.Range.lift(edit.textEdit.range), !edit.textEdit.insertAsSnippet ? edit.textEdit.text : snippetParser_1.SnippetParser.asInsertText(edit.textEdit.text)));
                            }
                        }
                        else if (!this.checked.isChecked(edit)) {
                            // UNCHECKED WorkspaceFileEdit disables all text edits
                            ignoreAll = true;
                        }
                    }
                    if (ignoreAll) {
                        return [];
                    }
                    return result.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                }
            }
            return [];
        }
        getUriOfEdit(edit) {
            for (const file of this.fileOperations) {
                for (const value of file.originalEdits.values()) {
                    if (value === edit) {
                        return file.uri;
                    }
                }
            }
            throw new Error('invalid edit');
        }
    };
    exports.BulkFileOperations = BulkFileOperations;
    exports.BulkFileOperations = BulkFileOperations = BulkFileOperations_1 = __decorate([
        __param(1, files_1.IFileService),
        __param(2, instantiation_1.IInstantiationService)
    ], BulkFileOperations);
    let BulkEditPreviewProvider = class BulkEditPreviewProvider {
        static { BulkEditPreviewProvider_1 = this; }
        static { this.Schema = 'vscode-bulkeditpreview-editor'; }
        static { this.emptyPreview = uri_1.URI.from({ scheme: BulkEditPreviewProvider_1.Schema, fragment: 'empty' }); }
        static fromPreviewUri(uri) {
            return uri_1.URI.parse(uri.query);
        }
        constructor(_operations, _languageService, _modelService, _textModelResolverService) {
            this._operations = _operations;
            this._languageService = _languageService;
            this._modelService = _modelService;
            this._textModelResolverService = _textModelResolverService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._modelPreviewEdits = new Map();
            this._instanceId = (0, uuid_1.generateUuid)();
            this._disposables.add(this._textModelResolverService.registerTextModelContentProvider(BulkEditPreviewProvider_1.Schema, this));
            this._ready = this._init();
        }
        dispose() {
            this._disposables.dispose();
        }
        asPreviewUri(uri) {
            return uri_1.URI.from({ scheme: BulkEditPreviewProvider_1.Schema, authority: this._instanceId, path: uri.path, query: uri.toString() });
        }
        async _init() {
            for (const operation of this._operations.fileOperations) {
                await this._applyTextEditsToPreviewModel(operation.uri);
            }
            this._disposables.add(event_1.Event.debounce(this._operations.checked.onDidChange, (_last, e) => e, symbols_1.MicrotaskDelay)(e => {
                const uri = this._operations.getUriOfEdit(e);
                this._applyTextEditsToPreviewModel(uri);
            }));
        }
        async _applyTextEditsToPreviewModel(uri) {
            const model = await this._getOrCreatePreviewModel(uri);
            // undo edits that have been done before
            const undoEdits = this._modelPreviewEdits.get(model.id);
            if (undoEdits) {
                model.applyEdits(undoEdits);
            }
            // apply new edits and keep (future) undo edits
            const newEdits = this._operations.getFileEdits(uri);
            const newUndoEdits = model.applyEdits(newEdits, true);
            this._modelPreviewEdits.set(model.id, newUndoEdits);
        }
        async _getOrCreatePreviewModel(uri) {
            const previewUri = this.asPreviewUri(uri);
            let model = this._modelService.getModel(previewUri);
            if (!model) {
                try {
                    // try: copy existing
                    const ref = await this._textModelResolverService.createModelReference(uri);
                    const sourceModel = ref.object.textEditorModel;
                    model = this._modelService.createModel((0, textModel_1.createTextBufferFactoryFromSnapshot)(sourceModel.createSnapshot()), this._languageService.createById(sourceModel.getLanguageId()), previewUri);
                    ref.dispose();
                }
                catch {
                    // create NEW model
                    model = this._modelService.createModel('', this._languageService.createByFilepathOrFirstLine(previewUri), previewUri);
                }
                // this is a little weird but otherwise editors and other cusomers
                // will dispose my models before they should be disposed...
                // And all of this is off the eventloop to prevent endless recursion
                queueMicrotask(async () => {
                    this._disposables.add(await this._textModelResolverService.createModelReference(model.uri));
                });
            }
            return model;
        }
        async provideTextContent(previewUri) {
            if (previewUri.toString() === BulkEditPreviewProvider_1.emptyPreview.toString()) {
                return this._modelService.createModel('', null, previewUri);
            }
            await this._ready;
            return this._modelService.getModel(previewUri);
        }
    };
    exports.BulkEditPreviewProvider = BulkEditPreviewProvider;
    exports.BulkEditPreviewProvider = BulkEditPreviewProvider = BulkEditPreviewProvider_1 = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService),
        __param(3, resolverService_1.ITextModelService)
    ], BulkEditPreviewProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0VkaXRQcmV2aWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYnVsa0VkaXQvYnJvd3Nlci9wcmV2aWV3L2J1bGtFZGl0UHJldmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRyxNQUFhLGFBQWE7UUFBMUI7WUFFa0IsWUFBTyxHQUFHLElBQUksT0FBTyxFQUFjLENBQUM7WUFDN0Msa0JBQWEsR0FBVyxDQUFDLENBQUM7WUFFakIsaUJBQVksR0FBRyxJQUFJLGVBQU8sRUFBSyxDQUFDO1lBQ3hDLGdCQUFXLEdBQWEsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7UUFpQzFELENBQUM7UUEvQkEsT0FBTztZQUNOLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDN0IsQ0FBQztRQUVELElBQUksWUFBWTtZQUNmLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRUQsU0FBUyxDQUFDLEdBQU07WUFDZixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQztRQUN2QyxDQUFDO1FBRUQsYUFBYSxDQUFDLEdBQU0sRUFBRSxLQUFjO1lBQ25DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksUUFBUSxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNYLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDO2dCQUN6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