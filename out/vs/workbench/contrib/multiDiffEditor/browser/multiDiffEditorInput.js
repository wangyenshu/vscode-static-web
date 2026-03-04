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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/observable", "vs/base/common/observableInternal/utils", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/widget/multiDiffEditor/model", "vs/editor/browser/widget/multiDiffEditor/multiDiffEditorViewModel", "vs/editor/common/services/resolverService", "vs/editor/common/services/textResourceConfiguration", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/contrib/multiDiffEditor/browser/icons.contribution", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, async_1, errors_1, event_1, lifecycle_1, marshalling_1, network_1, objects_1, observable_1, utils_1, types_1, uri_1, model_1, multiDiffEditorViewModel_1, resolverService_1, textResourceConfiguration_1, nls_1, instantiation_1, editor_1, editorInput_1, icons_contribution_1, multiDiffSourceResolverService_1, editorResolverService_1, textfiles_1) {
    "use strict";
    var MultiDiffEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiDiffEditorSerializer = exports.MultiDiffEditorResolverContribution = exports.MultiDiffEditorInput = void 0;
    let MultiDiffEditorInput = class MultiDiffEditorInput extends editorInput_1.EditorInput {
        static { MultiDiffEditorInput_1 = this; }
        static fromResourceMultiDiffEditorInput(input, instantiationService) {
            if (!input.multiDiffSource && !input.resources) {
                throw new errors_1.BugIndicatingError('MultiDiffEditorInput requires either multiDiffSource or resources');
            }
            const multiDiffSource = input.multiDiffSource ?? uri_1.URI.parse(`multi-diff-editor:${new Date().getMilliseconds().toString() + Math.random().toString()}`);
            return instantiationService.createInstance(MultiDiffEditorInput_1, multiDiffSource, input.label, input.resources?.map(resource => {
                return new multiDiffSourceResolverService_1.MultiDiffEditorItem(resource.original.resource, resource.modified.resource);
            }), input.isTransient ?? false);
        }
        static fromSerialized(data, instantiationService) {
            return instantiationService.createInstance(MultiDiffEditorInput_1, uri_1.URI.parse(data.multiDiffSourceUri), data.label, data.resources?.map(resource => new multiDiffSourceResolverService_1.MultiDiffEditorItem(resource.originalUri ? uri_1.URI.parse(resource.originalUri) : undefined, resource.modifiedUri ? uri_1.URI.parse(resource.modifiedUri) : undefined)), false);
        }
        static { this.ID = 'workbench.input.multiDiffEditor'; }
        get resource() { return this.multiDiffSource; }
        get capabilities() { return 2 /* EditorInputCapabilities.Readonly */; }
        get typeId() { return MultiDiffEditorInput_1.ID; }
        getName() { return this._name; }
        get editorId() { return editor_1.DEFAULT_EDITOR_ASSOCIATION.id; }
        getIcon() { return icons_contribution_1.MultiDiffEditorIcon; }
        constructor(multiDiffSource, label, initialResources, isTransient = false, _textModelService, _textResourceConfigurationService, _instantiationService, _multiDiffSourceResolverService, _textFileService) {
            super();
            this.multiDiffSource = multiDiffSource;
            this.label = label;
            this.initialResources = initialResources;
            this.isTransient = isTransient;
            this._textModelService = _textModelService;
            this._textResourceConfigurationService = _textResourceConfigurationService;
            this._instantiationService = _instantiationService;
            this._multiDiffSourceResolverService = _multiDiffSourceResolverService;
            this._textFileService = _textFileService;
            this._name = '';
            this._viewModel = new async_1.LazyStatefulPromise(async () => {
                const model = await this._createModel();
                this._register(model);
                const vm = new multiDiffEditorViewModel_1.MultiDiffEditorViewModel(model, this._instantiationService);
                this._register(vm);
                await (0, async_1.raceTimeout)(vm.waitForDiffs(), 1000);
                return vm;
            });
            this._resolvedSource = new observable_1.ObservableLazyPromise(async () => {
                const source = this.initialResources
                    ? { resources: event_1.ValueWithChangeEvent.const(this.initialResources) }
                    : await this._multiDiffSourceResolverService.resolve(this.multiDiffSource);
                return {
                    source,
                    resources: source ? (0, utils_1.observableFromValueWithChangeEvent)(this, source.resources) : (0, utils_1.constObservable)([]),
                };
            });
            this.resources = (0, observable_1.derived)(this, reader => this._resolvedSource.cachedPromiseResult.read(reader)?.data?.resources.read(reader));
            this._isDirtyObservables = (0, utils_1.mapObservableArrayCached)(this, this.resources.map(r => r ?? []), res => {
                const isModifiedDirty = res.modified ? isUriDirty(this._textFileService, res.modified) : (0, utils_1.constObservable)(false);
                const isOriginalDirty = res.original ? isUriDirty(this._textFileService, res.original) : (0, utils_1.constObservable)(false);
                return (0, observable_1.derived)(reader => /** @description modifiedDirty||originalDirty */ isModifiedDirty.read(reader) || isOriginalDirty.read(reader));
            }, i => i.getKey());
            this._isDirtyObservable = (0, observable_1.derived)(this, reader => this._isDirtyObservables.read(reader).some(isDirty => isDirty.read(reader)))
                .keepObserved(this._store);
            this.onDidChangeDirty = event_1.Event.fromObservableLight(this._isDirtyObservable);
            this.closeHandler = {
                // TODO@bpasero TODO@hediet this is a workaround for
                // not having a better way to figure out if the
                // editors this input wraps around are opened or not
                async confirm() {
                    return 1 /* ConfirmResult.DONT_SAVE */;
                },
                showConfirm() {
                    return false;
                }
            };
            this._register((0, observable_1.autorun)((reader) => {
                /** @description Updates name */
                const resources = this.resources.read(reader);
                const label = this.label ?? (0, nls_1.localize)('name', "Multi Diff Editor");
                if (resources) {
                    this._name = label + (0, nls_1.localize)({
                        key: 'files',
                        comment: ['the number of files being shown']
                    }, " ({0} files)", resources.length);
                }
                else {
                    this._name = label;
                }
                this._onDidChangeLabel.fire();
            }));
        }
        serialize() {
            return {
                label: this.label,
                multiDiffSourceUri: this.multiDiffSource.toString(),
                resources: this.initialResources?.map(resource => ({
                    originalUri: resource.original?.toString(),
                    modifiedUri: resource.modified?.toString(),
                })),
            };
        }
        setLanguageId(languageId, source) {
            const activeDiffItem = this._viewModel.requireValue().activeDiffItem.get();
            const value = activeDiffItem?.entry?.value;
            if (!value) {
                return;
            }
            const target = value.modified ?? value.original;
            if (!target) {
                return;
            }
            target.setLanguage(languageId, source);
        }
        async getViewModel() {
            return this._viewModel.getPromise();
        }
        async _createModel() {
            const source = await this._resolvedSource.getPromise();
            const textResourceConfigurationService = this._textResourceConfigurationService;
            // Enables delayed disposing
            const garbage = new lifecycle_1.DisposableStore();
            const documentsWithPromises = (0, utils_1.mapObservableArrayCached)(this, source.resources, async (r, store) => {
                /** @description documentsWithPromises */
                let original;
                let modified;
                const store2 = new lifecycle_1.DisposableStore();
                store.add((0, lifecycle_1.toDisposable)(() => {
                    // Mark the text model references as garbage when they get stale (don't dispose them yet)
                    garbage.add(store2);
                }));
                try {
                    [original, modified] = await Promise.all([
                        r.original ? this._textModelService.createModelReference(r.original) : undefined,
                        r.modified ? this._textModelService.createModelReference(r.modified) : undefined,
                    ]);
                    if (original) {
                        store2.add(original);
                    }
                    if (modified) {
                        store2.add(modified);
                    }
                }
                catch (e) {
                    // e.g. "File seems to be binary and cannot be opened as text"
                    console.error(e);
                    (0, errors_1.onUnexpectedError)(e);
                    return undefined;
                }
                const uri = (r.modified ?? r.original);
                return new model_1.ConstLazyPromise({
                    original: original?.object.textEditorModel,
                    modified: modified?.object.textEditorModel,
                    get options() {
                        return {
                            ...getReadonlyConfiguration(modified?.object.isReadonly() ?? true),
                            ...computeOptions(textResourceConfigurationService.getValue(uri)),
                        };
                    },
                    onOptionsDidChange: h => this._textResourceConfigurationService.onDidChangeConfiguration(e => {
                        if (e.affectsConfiguration(uri, 'editor') || e.affectsConfiguration(uri, 'diffEditor')) {
                            h();
                        }
                    }),
                });
            }, i => JSON.stringify([i.modified?.toString(), i.original?.toString()]));
            const documents = (0, observable_1.observableValue)('documents', []);
            const updateDocuments = (0, observable_1.derived)(async (reader) => {
                /** @description Update documents */
                const docsPromises = documentsWithPromises.read(reader);
                const docs = await Promise.all(docsPromises);
                const newDocuments = docs.filter(types_1.isDefined);
                documents.set(newDocuments, undefined);
                garbage.clear(); // Only dispose text models after the documents have been updated
            });
            const a = (0, utils_1.recomputeInitiallyAndOnChange)(updateDocuments);
            await updateDocuments.get();
            const result = {
                dispose: () => {
                    a.dispose();
                    garbage.dispose();
                },
                documents: new utils_1.ValueWithChangeEventFromObservable(documents),
                contextKeys: source.source?.contextKeys,
            };
            return result;
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof MultiDiffEditorInput_1) {
                return this.multiDiffSource.toString() === otherInput.multiDiffSource.toString();
            }
            return false;
        }
        isDirty() { return this._isDirtyObservable.get(); }
        async save(group, options) {
            await this.doSaveOrRevert('save', group, options);
            return this;
        }
        revert(group, options) {
            return this.doSaveOrRevert('revert', group, options);
        }
        async doSaveOrRevert(mode, group, options) {
            const items = this._viewModel.currentValue?.items.get();
            if (items) {
                await Promise.all(items.map(async (item) => {
                    const model = item.diffEditorViewModel.model;
                    const handleOriginal = model.original.uri.scheme !== network_1.Schemas.untitled && this._textFileService.isDirty(model.original.uri); // match diff editor behaviour
                    await Promise.all([
                        handleOriginal ? mode === 'save' ? this._textFileService.save(model.original.uri, options) : this._textFileService.revert(model.original.uri, options) : Promise.resolve(),
                        mode === 'save' ? this._textFileService.save(model.modified.uri, options) : this._textFileService.revert(model.modified.uri, options),
                    ]);
                }));
            }
            return undefined;
        }
    };
    exports.MultiDiffEditorInput = MultiDiffEditorInput;
    exports.MultiDiffEditorInput = MultiDiffEditorInput = MultiDiffEditorInput_1 = __decorate([
        __param(4, resolverService_1.ITextModelService),
        __param(5, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, multiDiffSourceResolverService_1.IMultiDiffSourceResolverService),
        __param(8, textfiles_1.ITextFileService)
    ], MultiDiffEditorInput);
    function isUriDirty(textFileService, uri) {
        return (0, observable_1.observableFromEvent)(event_1.Event.filter(textFileService.files.onDidChangeDirty, e => e.resource.toString() === uri.toString()), () => textFileService.isDirty(uri));
    }
    function getReadonlyConfiguration(isReadonly) {
        return {
            readOnly: !!isReadonly,
            readOnlyMessage: typeof isReadonly !== 'boolean' ? isReadonly : undefined
        };
    }
    function computeOptions(configuration) {
        const editorConfiguration = (0, objects_1.deepClone)(configuration.editor);
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
        return editorConfiguration;
    }
    let MultiDiffEditorResolverContribution = class MultiDiffEditorResolverContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.multiDiffEditorResolver'; }
        constructor(editorResolverService, instantiationService) {
            super();
            this._register(editorResolverService.registerEditor(`*`, {
                id: editor_1.DEFAULT_EDITOR_ASSOCIATION.id,
                label: editor_1.DEFAULT_EDITOR_ASSOCIATION.displayName,
                detail: editor_1.DEFAULT_EDITOR_ASSOCIATION.providerDisplayName,
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createMultiDiffEditorInput: (multiDiffEditor) => {
                    return {
                        editor: MultiDiffEditorInput.fromResourceMultiDiffEditorInput(multiDiffEditor, instantiationService),
                    };
                },
            }));
        }
    };
    exports.MultiDiffEditorResolverContribution = MultiDiffEditorResolverContribution;
    exports.MultiDiffEditorResolverContribution = MultiDiffEditorResolverContribution = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, instantiation_1.IInstantiationService)
    ], MultiDiffEditorResolverContribution);
    class MultiDiffEditorSerializer {
        canSerialize(editor) {
            return editor instanceof MultiDiffEditorInput && !editor.isTransient;
        }
        serialize(editor) {
            if (!this.canSerialize(editor)) {
                return undefined;
            }
            return JSON.stringify(editor.serialize());
        }
        deserialize(instantiationService, serializedEditor) {
            try {
                const data = (0, marshalling_1.parse)(serializedEditor);
                return MultiDiffEditorInput.fromSerialized(data, instantiationService);
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
                return undefined;
            }
        }
    }
    exports.MultiDiffEditorSerializer = MultiDiffEditorSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9ySW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tdWx0aURpZmZFZGl0b3IvYnJvd3Nlci9tdWx0aURpZmZFZGl0b3JJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBK0J6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHlCQUFXOztRQUM3QyxNQUFNLENBQUMsZ0NBQWdDLENBQUMsS0FBb0MsRUFBRSxvQkFBMkM7WUFDL0gsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyxtRUFBbUUsQ0FBQyxDQUFDO1lBQ25HLENBQUM7WUFDRCxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsZUFBZSxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMscUJBQXFCLElBQUksSUFBSSxFQUFFLENBQUMsZUFBZSxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0SixPQUFPLG9CQUFvQixDQUFDLGNBQWMsQ0FDekMsc0JBQW9CLEVBQ3BCLGVBQWUsRUFDZixLQUFLLENBQUMsS0FBSyxFQUNYLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUMvQixPQUFPLElBQUksb0RBQW1CLENBQzdCLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUMxQixRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FDMUIsQ0FBQztZQUNILENBQUMsQ0FBQyxFQUNGLEtBQUssQ0FBQyxXQUFXLElBQUks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