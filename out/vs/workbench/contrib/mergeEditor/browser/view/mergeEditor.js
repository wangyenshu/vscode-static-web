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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/grid/grid", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/resources", "vs/base/common/types", "vs/editor/browser/services/codeEditorService", "vs/editor/common/services/textResourceConfiguration", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/common/editor", "vs/workbench/common/editor/editorOptions", "vs/workbench/contrib/codeEditor/browser/toggleWordWrap", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput", "vs/workbench/contrib/mergeEditor/browser/utils", "vs/workbench/contrib/mergeEditor/browser/view/editors/baseCodeEditorView", "vs/workbench/contrib/mergeEditor/browser/view/scrollSynchronizer", "vs/workbench/contrib/mergeEditor/browser/view/viewModel", "vs/workbench/contrib/mergeEditor/browser/view/viewZones", "vs/workbench/contrib/mergeEditor/common/mergeEditor", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/editor/common/editorService", "./editors/inputCodeEditorView", "./editors/resultCodeEditorView", "vs/css!./media/mergeEditor", "./colors"], function (require, exports, dom_1, grid_1, color_1, errors_1, event_1, lifecycle_1, observable_1, resources_1, types_1, codeEditorService_1, textResourceConfiguration_1, nls_1, configuration_1, contextkey_1, files_1, instantiation_1, storage_1, telemetry_1, themeService_1, textEditor_1, editor_1, editorOptions_1, toggleWordWrap_1, mergeEditorInput_1, utils_1, baseCodeEditorView_1, scrollSynchronizer_1, viewModel_1, viewZones_1, mergeEditor_1, settingsEditorColorRegistry_1, editorGroupsService_1, editorResolverService_1, editorService_1, inputCodeEditorView_1, resultCodeEditorView_1) {
    "use strict";
    var MergeEditor_1, MergeEditorLayoutStore_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorResolverContribution = exports.MergeEditorOpenHandlerContribution = exports.MergeEditor = void 0;
    let MergeEditor = class MergeEditor extends textEditor_1.AbstractTextEditor {
        static { MergeEditor_1 = this; }
        static { this.ID = 'mergeEditor'; }
        get viewModel() {
            return this._viewModel;
        }
        get inputModel() {
            return this._inputModel;
        }
        get model() {
            return this.inputModel.get()?.model;
        }
        get inputsWritable() {
            return !!this._configurationService.getValue('mergeEditor.writableInputs');
        }
        constructor(group, instantiation, contextKeyService, telemetryService, storageService, themeService, textResourceConfigurationService, _configurationService, editorService, editorGroupService, fileService, _codeEditorService, configurationService) {
            super(MergeEditor_1.ID, group, telemetryService, instantiation, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService, fileService);
            this.contextKeyService = contextKeyService;
            this._configurationService = _configurationService;
            this._codeEditorService = _codeEditorService;
            this.configurationService = configurationService;
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._viewModel = (0, observable_1.observableValue)(this, undefined);
            this._grid = this._register(new lifecycle_1.MutableDisposable());
            this.input1View = this._register(this.instantiationService.createInstance(inputCodeEditorView_1.InputCodeEditorView, 1, this._viewModel));
            this.baseView = (0, observable_1.observableValue)(this, undefined);
            this.baseViewOptions = (0, observable_1.observableValue)(this, undefined);
            this.input2View = this._register(this.instantiationService.createInstance(inputCodeEditorView_1.InputCodeEditorView, 2, this._viewModel));
            this.inputResultView = this._register(this.instantiationService.createInstance(resultCodeEditorView_1.ResultCodeEditorView, this._viewModel));
            this._layoutMode = this.instantiationService.createInstance(MergeEditorLayoutStore);
            this._layoutModeObs = (0, observable_1.observableValue)(this, this._layoutMode.value);
            this._ctxIsMergeEditor = mergeEditor_1.ctxIsMergeEditor.bindTo(this.contextKeyService);
            this._ctxUsesColumnLayout = mergeEditor_1.ctxMergeEditorLayout.bindTo(this.contextKeyService);
            this._ctxShowBase = mergeEditor_1.ctxMergeEditorShowBase.bindTo(this.contextKeyService);
            this._ctxShowBaseAtTop = mergeEditor_1.ctxMergeEditorShowBaseAtTop.bindTo(this.contextKeyService);
            this._ctxResultUri = mergeEditor_1.ctxMergeResultUri.bindTo(this.contextKeyService);
            this._ctxBaseUri = mergeEditor_1.ctxMergeBaseUri.bindTo(this.contextKeyService);
            this._ctxShowNonConflictingChanges = mergeEditor_1.ctxMergeEditorShowNonConflictingChanges.bindTo(this.contextKeyService);
            this._inputModel = (0, observable_1.observableValue)(this, undefined);
            this.viewZoneComputer = new viewZones_1.ViewZoneComputer(this.input1View.editor, this.input2View.editor, this.inputResultView.editor);
            this.codeLensesVisible = (0, utils_1.observableConfigValue)('mergeEditor.showCodeLenses', true, this.configurationService);
            this.scrollSynchronizer = this._register(new scrollSynchronizer_1.ScrollSynchronizer(this._viewModel, this.input1View, this.input2View, this.baseView, this.inputResultView, this._layoutModeObs));
            // #region layout constraints
            this._onDidChangeSizeConstraints = new event_1.Emitter();
            this.onDidChangeSizeConstraints = this._onDidChangeSizeConstraints.event;
            this.baseViewDisposables = this._register(new lifecycle_1.DisposableStore());
            this.showNonConflictingChangesStore = this.instantiationService.createInstance((utils_1.PersistentStore), 'mergeEditor/showNonConflictingChanges');
            this.showNonConflictingChanges = (0, observable_1.observableValue)(this, this.showNonConflictingChangesStore.get() ?? false);
        }
        dispose() {
            this._sessionDisposables.dispose();
            this._ctxIsMergeEditor.reset();
            this._ctxUsesColumnLayout.reset();
            this._ctxShowNonConflictingChanges.reset();
            super.dispose();
        }
        get minimumWidth() {
            return this._layoutMode.value.kind === 'mixed'
                ? this.input1View.view.minimumWidth + this.input2View.view.minimumWidth
                : this.input1View.view.minimumWidth + this.input2View.view.minimumWidth + this.inputResultView.view.minimumWidth;
        }
        // #endregion
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('mergeEditor', "Text Merge Editor");
        }
        createEditorControl(parent, initialOptions) {
            this.rootHtmlElement = parent;
            parent.classList.add('merge-editor');
            this.applyLayout(this._layoutMode.value);
            this.applyOptions(initialOptions);
        }
        updateEditorControlOptions(options) {
            this.applyOptions(options);
        }
        applyOptions(options) {
            const inputOptions = (0, utils_1.deepMerge)(options, {
                minimap: { enabled: false },
                glyphMargin: false,
                lineNumbersMinChars: 2,
                readOnly: !this.inputsWritable
            });
            this.input1View.updateOptions(inputOptions);
            this.input2View.updateOptions(inputOptions);
            this.baseViewOptions.set({ ...this.input2View.editor.getRawOptions() }, undefined);
            this.inputResultView.updateOptions(options);
        }
        getMainControl() {
            return this.inputResultView.editor;
        }
        layout(dimension) {
            this._grid.value?.layout(dimension.width, dimension.height);
        }
        async setInput(input, options, context, token) {
            if (!(input instanceof mergeEditorInput_1.MergeEditorInput)) {
                throw new errors_1.BugIndicatingError('ONLY MergeEditorInput is supported');
            }
            await super.setInput(input, options, context, token);
            this._sessionDisposables.clear();
            (0, observable_1.transaction)(tx => {
                this._viewModel.set(undefined, tx);
                this._inputModel.set(undefined, tx);
            });
            const inputModel = await input.resolve();
            const model = inputModel.model;
            const viewModel = this.instantiationService.createInstance(viewModel_1.MergeEditorViewModel, model, this.input1View, this.input2View, this.inputResultView, this.baseView, this.showNonConflictingChanges);
            model.telemetry.reportMergeEditorOpened({
                combinableConflictCount: model.combinableConflictCount,
                conflictCount: model.conflictCount,
                baseTop: this._layoutModeObs.get().showBaseAtTop,
                baseVisible: this._layoutModeObs.get().showBase,
                isColumnView: this._layoutModeObs.get().kind === 'columns',
            });
            (0, observable_1.transaction)(tx => {
                this._viewModel.set(viewModel, tx);
                this._inputModel.set(inputModel, tx);
            });
            this._sessionDisposables.add(viewModel);
            // Set/unset context keys based on input
            this._ctxResultUri.set(inputModel.resultUri.toString());
            this._ctxBaseUri.set(model.base.uri.toString());
            this._sessionDisposables.add((0, lifecycle_1.toDisposable)(() => {
                this._ctxBaseUri.reset();
                this._ctxResultUri.reset();
            }));
            // Set the view zones before restoring view state!
            // Otherwise scrolling will be off
            this._sessionDisposables.add((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description update alignment view zones */
                const baseView = this.baseView.read(reader);
                this.inputResultView.editor.changeViewZones(resultViewZoneAccessor => {
                    const layout = this._layoutModeObs.read(reader);
                    const shouldAlignResult = layout.kind === 'columns';
                    const shouldAlignBase = layout.kind === 'mixed' && !layout.showBaseAtTop;
                    this.input1View.editor.changeViewZones(input1ViewZoneAccessor => {
                        this.input2View.editor.changeViewZones(input2ViewZoneAccessor => {
                            if (baseView) {
                                baseView.editor.changeViewZones(baseViewZoneAccessor => {
                                    store.add(this.setViewZones(reader, viewModel, this.input1View.editor, input1ViewZoneAccessor, this.input2View.editor, input2ViewZoneAccessor, baseView.editor, baseViewZoneAccessor, shouldAlignBase, this.inputResultView.editor, resultViewZoneAccessor, shouldAlignResult));
                                });
                            }
                            else {
                                store.add(this.setViewZones(reader, viewModel, this.input1View.editor, input1ViewZoneAccessor, this.input2View.editor, input2ViewZoneAccessor, undefined, undefined, false, this.inputResultView.editor, resultViewZoneAccessor, shouldAlignResult));
                            }
                        });
                    });
                });
                this.scrollSynchronizer.updateScrolling();
            }));
            const viewState = this.loadEditorViewState(input, context);
            if (viewState) {
                this._applyViewState(viewState);
            }
            else {
                this._sessionDisposables.add((0, utils_1.thenIfNotDisposed)(model.onInitialized, () => {
                    const firstConflict = model.modifiedBaseRanges.get().find(r => r.isConflicting);
                    if (!firstConflict) {
                        return;
                    }
                    this.input1View.editor.revealLineInCenter(firstConflict.input1Range.startLineNumber);
                    (0, observable_1.transaction)(tx => {
                        /** @description setActiveModifiedBaseRange */
                        viewModel.setActiveModifiedBaseRange(firstConflict, tx);
                    });
                }));
            }
            // word wrap special case - sync transient state from result model to input[1|2] models
            const mirrorWordWrapTransientState = (candidate) => {
                const candidateState = (0, toggleWordWrap_1.readTransientState)(candidate, this._codeEditorService);
                (0, toggleWordWrap_1.writeTransientState)(model.input2.textModel, candidateState, this._codeEditorService);
                (0, toggleWordWrap_1.writeTransientState)(model.input1.textModel, candidateState, this._codeEditorService);
                (0, toggleWordWrap_1.writeTransientState)(model.resultTextModel, candidateState, this._codeEditorService);
                const baseTextModel = this.baseView.get()?.editor.getModel();
                if (baseTextModel) {
                    (0, toggleWordWrap_1.writeTransientState)(baseTextModel, candidateState, this._codeEditorService);
                }
            };
            this._sessionDisposables.add(this._codeEditorService.onDidChangeTransientModelProperty(candidate => {
                mirrorWordWrapTransientState(candidate);
            }));
            mirrorWordWrapTransientState(this.inputResultView.editor.getModel());
            // detect when base, input1, and input2 become empty and replace THIS editor with its result editor
            // TODO@jrieken@hediet this needs a better/cleaner solution
            // https://github.com/microsoft/vscode/issues/155940
            const that = this;
            this._sessionDisposables.add(new class {
                constructor() {
                    this._disposable = new lifecycle_1.DisposableStore();
                    for (const model of this.baseInput1Input2()) {
                        this._disposable.add(model.onDidChangeContent(() => this._checkBaseInput1Input2AllEmpty()));
                    }
                }
                dispose() {
                    this._disposable.dispose();
                }
                *baseInput1Input2() {
                    yield model.base;
                    yield model.input1.textModel;
                    yield model.input2.textModel;
                }
                _checkBaseInput1Input2AllEmpty() {
                    for (const model of this.baseInput1Input2()) {
                        if (model.getValueLength() > 0) {
                            return;
                        }
                    }
                    // all empty -> replace this editor with a normal editor for result
                    that.editorService.replaceEditors([{ editor: input, replacement: { resource: input.result, options: { preserveFocus: true } }, forceReplaceDirty: true }], that.group);
                }
            });
        }
        setViewZones(reader, viewModel, input1Editor, input1ViewZoneAccessor, input2Editor, input2ViewZoneAccessor, baseEditor, baseViewZoneAccessor, shouldAlignBase, resultEditor, resultViewZoneAccessor, shouldAlignResult) {
            const input1ViewZoneIds = [];
            const input2ViewZoneIds = [];
            const baseViewZoneIds = [];
            const resultViewZoneIds = [];
            const viewZones = this.viewZoneComputer.computeViewZones(reader, viewModel, {
                codeLensesVisible: this.codeLensesVisible.read(reader),
                showNonConflictingChanges: this.showNonConflictingChanges.read(reader),
                shouldAlignBase,
                shouldAlignResult,
            });
            const disposableStore = new lifecycle_1.DisposableStore();
            if (baseViewZoneAccessor) {
                for (const v of viewZones.baseViewZones) {
                    v.create(baseViewZoneAccessor, baseViewZoneIds, disposableStore);
                }
            }
            for (const v of viewZones.resultViewZones) {
                v.create(resultViewZoneAccessor, resultViewZoneIds, disposableStore);
            }
            for (const v of viewZones.input1ViewZones) {
                v.create(input1ViewZoneAccessor, input1ViewZoneIds, disposableStore);
            }
            for (const v of viewZones.input2ViewZones) {
                v.create(input2ViewZoneAccessor, input2ViewZoneIds, disposableStore);
            }
            disposableStore.add({
                dispose: () => {
                    input1Editor.changeViewZones(a => {
                        for (const zone of input1ViewZoneIds) {
                            a.removeZone(zone);
                        }
                    });
                    input2Editor.changeViewZones(a => {
                        for (const zone of input2ViewZoneIds) {
                            a.removeZone(zone);
                        }
                    });
                    baseEditor?.changeViewZones(a => {
                        for (const zone of baseViewZoneIds) {
                            a.removeZone(zone);
                        }
                    });
                    resultEditor.changeViewZones(a => {
                        for (const zone of resultViewZoneIds) {
                            a.removeZone(zone);
                        }
                    });
                }
            });
            return disposableStore;
        }
        setOptions(options) {
            super.setOptions(options);
            if (options) {
                (0, editorOptions_1.applyTextEditorOptions)(options, this.inputResultView.editor, 0 /* ScrollType.Smooth */);
            }
        }
        clearInput() {
            super.clearInput();
            this._sessionDisposables.clear();
            for (const { editor } of [this.input1View, this.input2View, this.inputResultView]) {
                editor.setModel(null);
            }
        }
        focus() {
            super.focus();
            (this.getControl() ?? this.inputResultView.editor).focus();
        }
        hasFocus() {
            for (const { editor } of [this.input1View, this.input2View, this.inputResultView]) {
                if (editor.hasTextFocus()) {
                    return true;
                }
            }
            return super.hasFocus();
        }
        setEditorVisible(visible) {
            super.setEditorVisible(visible);
            for (const { editor } of [this.input1View, this.input2View, this.inputResultView]) {
                if (visible) {
                    editor.onVisible();
                }
                else {
                    editor.onHide();
                }
            }
            this._ctxIsMergeEditor.set(visible);
        }
        // ---- interact with "outside world" via`getControl`, `scopedContextKeyService`: we only expose the result-editor keep the others internal
        getControl() {
            return this.inputResultView.editor;
        }
        get scopedContextKeyService() {
            const control = this.getControl();
            return control?.invokeWithinContext(accessor => accessor.get(contextkey_1.IContextKeyService));
        }
        // --- layout
        toggleBase() {
            this.setLayout({
                ...this._layoutMode.value,
                showBase: !this._layoutMode.value.showBase
            });
        }
        toggleShowBaseTop() {
            const showBaseTop = this._layoutMode.value.showBase && this._layoutMode.value.showBaseAtTop;
            this.setLayout({
                ...this._layoutMode.value,
                showBaseAtTop: true,
                showBase: !showBaseTop,
            });
        }
        toggleShowBaseCenter() {
            const showBaseCenter = this._layoutMode.value.showBase && !this._layoutMode.value.showBaseAtTop;
            this.setLayout({
                ...this._layoutMode.value,
                showBaseAtTop: false,
                showBase: !showBaseCenter,
            });
        }
        setLayoutKind(kind) {
            this.setLayout({
                ...this._layoutMode.value,
                kind
            });
        }
        setLayout(newLayout) {
            const value = this._layoutMode.value;
            if (JSON.stringify(value) === JSON.stringify(newLayout)) {
                return;
            }
            this.model?.telemetry.reportLayoutChange({
                baseTop: newLayout.showBaseAtTop,
                baseVisible: newLayout.showBase,
                isColumnView: newLayout.kind === 'columns',
            });
            this.applyLayout(newLayout);
        }
        applyLayout(layout) {
            (0, observable_1.transaction)(tx => {
                /** @description applyLayout */
                if (layout.showBase && !this.baseView.get()) {
                    this.baseViewDisposables.clear();
                    const baseView = this.baseViewDisposables.add(this.instantiationService.createInstance(baseCodeEditorView_1.BaseCodeEditorView, this.viewModel));
                    this.baseViewDisposables.add((0, observable_1.autorun)(reader => {
                        /** @description Update base view options */
                        const options = this.baseViewOptions.read(reader);
                        if (options) {
                            baseView.updateOptions(options);
                        }
                    }));
                    this.baseView.set(baseView, tx);
                }
                else if (!layout.showBase && this.baseView.get()) {
                    this.baseView.set(undefined, tx);
                    this.baseViewDisposables.clear();
                }
                if (layout.kind === 'mixed') {
                    this.setGrid([
                        layout.showBaseAtTop && layout.showBase ? {
                            size: 38,
                            data: this.baseView.get().view
                        } : undefined,
                        {
                            size: 38,
                            groups: [
                                { data: this.input1View.view },
                                !layout.showBaseAtTop && layout.showBase ? { data: this.baseView.get().view } : undefined,
                                { data: this.input2View.view }
                            ].filter(types_1.isDefined)
                        },
                        {
                            size: 62,
                            data: this.inputResultView.view
                        },
                    ].filter(types_1.isDefined));
                }
                else if (layout.kind === 'columns') {
                    this.setGrid([
                        layout.showBase ? {
                            size: 40,
                            data: this.baseView.get().view
                        } : undefined,
                        {
                            size: 60,
                            groups: [{ data: this.input1View.view }, { data: this.inputResultView.view }, { data: this.input2View.view }]
                        },
                    ].filter(types_1.isDefined));
                }
                this._layoutMode.value = layout;
                this._ctxUsesColumnLayout.set(layout.kind);
                this._ctxShowBase.set(layout.showBase);
                this._ctxShowBaseAtTop.set(layout.showBaseAtTop);
                this._onDidChangeSizeConstraints.fire();
                this._layoutModeObs.set(layout, tx);
            });
        }
        setGrid(descriptor) {
            let width = -1;
            let height = -1;
            if (this._grid.value) {
                width = this._grid.value.width;
                height = this._grid.value.height;
            }
            this._grid.value = grid_1.SerializableGrid.from({
                orientation: 0 /* Orientation.VERTICAL */,
                size: 100,
                groups: descriptor,
            }, {
                styles: { separatorBorder: this.theme.getColor(settingsEditorColorRegistry_1.settingsSashBorder) ?? color_1.Color.transparent },
                proportionalLayout: true
            });
            (0, dom_1.reset)(this.rootHtmlElement, this._grid.value.element);
            // Only call layout after the elements have been added to the DOM,
            // so that they have a defined size.
            if (width !== -1) {
                this._grid.value.layout(width, height);
            }
        }
        _applyViewState(state) {
            if (!state) {
                return;
            }
            this.inputResultView.editor.restoreViewState(state);
            if (state.input1State) {
                this.input1View.editor.restoreViewState(state.input1State);
            }
            if (state.input2State) {
                this.input2View.editor.restoreViewState(state.input2State);
            }
            if (state.focusIndex >= 0) {
                [this.input1View.editor, this.input2View.editor, this.inputResultView.editor][state.focusIndex].focus();
            }
        }
        computeEditorViewState(resource) {
            if (!(0, resources_1.isEqual)(this.inputModel.get()?.resultUri, resource)) {
                return undefined;
            }
            const result = this.inputResultView.editor.saveViewState();
            if (!result) {
                return undefined;
            }
            const input1State = this.input1View.editor.saveViewState() ?? undefined;
            const input2State = this.input2View.editor.saveViewState() ?? undefined;
            const focusIndex = [this.input1View.editor, this.input2View.editor, this.inputResultView.editor].findIndex(editor => editor.hasWidgetFocus());
            return { ...result, input1State, input2State, focusIndex };
        }
        tracksEditorViewState(input) {
            return input instanceof mergeEditorInput_1.MergeEditorInput;
        }
        toggleShowNonConflictingChanges() {
            this.showNonConflictingChanges.set(!this.showNonConflictingChanges.get(), undefined);
            this.showNonConflictingChangesStore.set(this.showNonConflictingChanges.get());
            this._ctxShowNonConflictingChanges.set(this.showNonConflictingChanges.get());
        }
    };
    exports.MergeEditor = MergeEditor;
    exports.MergeEditor = MergeEditor = MergeEditor_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, storage_1.IStorageService),
        __param(5, themeService_1.IThemeService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, editorService_1.IEditorService),
        __param(9, editorGroupsService_1.IEditorGroupsService),
        __param(10, files_1.IFileService),
        __param(11, codeEditorService_1.ICodeEditorService),
        __param(12, configuration_1.IConfigurationService)
    ], MergeEditor);
    // TODO use PersistentStore
    let MergeEditorLayoutStore = class MergeEditorLayoutStore {
        static { MergeEditorLayoutStore_1 = this; }
        static { this._key = 'mergeEditor/layout'; }
        constructor(_storageService) {
            this._storageService = _storageService;
            this._value = { kind: 'mixed', showBase: false, showBaseAtTop: true };
            const value = _storageService.get(MergeEditorLayoutStore_1._key, 0 /* StorageScope.PROFILE */, 'mixed');
            if (value === 'mixed' || value === 'columns') {
                this._value = { kind: value, showBase: false, showBaseAtTop: true };
            }
            else if (value) {
                try {
                    this._value = JSON.parse(value);
                }
                catch (e) {
                    (0, errors_1.onUnexpectedError)(e);
                }
            }
        }
        get value() {
            return this._value;
        }
        set value(value) {
            if (this._value !== value) {
                this._value = value;
                this._storageService.store(MergeEditorLayoutStore_1._key, JSON.stringify(this._value), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
        }
    };
    MergeEditorLayoutStore = MergeEditorLayoutStore_1 = __decorate([
        __param(0, storage_1.IStorageService)
    ], MergeEditorLayoutStore);
    let MergeEditorOpenHandlerContribution = class MergeEditorOpenHandlerContribution extends lifecycle_1.Disposable {
        constructor(_editorService, codeEditorService) {
            super();
            this._editorService = _editorService;
            this._store.add(codeEditorService.registerCodeEditorOpenHandler(this.openCodeEditorFromMergeEditor.bind(this)));
        }
        async openCodeEditorFromMergeEditor(input, _source, sideBySide) {
            const activePane = this._editorService.activeEditorPane;
            if (!sideBySide
                && input.options
                && activePane instanceof MergeEditor
                && activePane.getControl()
                && activePane.input instanceof mergeEditorInput_1.MergeEditorInput
                && (0, resources_1.isEqual)(input.resource, activePane.input.result)) {
                // Special: stay inside the merge editor when it is active and when the input
                // targets the result editor of the merge editor.
                const targetEditor = activePane.getControl();
                (0, editorOptions_1.applyTextEditorOptions)(input.options, targetEditor, 0 /* ScrollType.Smooth */);
                return targetEditor;
            }
            // cannot handle this
            return null;
        }
    };
    exports.MergeEditorOpenHandlerContribution = MergeEditorOpenHandlerContribution;
    exports.MergeEditorOpenHandlerContribution = MergeEditorOpenHandlerContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], MergeEditorOpenHandlerContribution);
    let MergeEditorResolverContribution = class MergeEditorResolverContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.mergeEditorResolver'; }
        constructor(editorResolverService, instantiationService) {
            super();
            const mergeEditorInputFactory = (mergeEditor) => {
                return {
                    editor: instantiationService.createInstance(mergeEditorInput_1.MergeEditorInput, mergeEditor.base.resource, {
                        uri: mergeEditor.input1.resource,
                        title: mergeEditor.input1.label ?? (0, resources_1.basename)(mergeEditor.input1.resource),
                        description: mergeEditor.input1.description ?? '',
                        detail: mergeEditor.input1.detail
                    }, {
                        uri: mergeEditor.input2.resource,
                        title: mergeEditor.input2.label ?? (0, resources_1.basename)(mergeEditor.input2.resource),
                        description: mergeEditor.input2.description ?? '',
                        detail: mergeEditor.input2.detail
                    }, mergeEditor.result.resource)
                };
            };
            this._register(editorResolverService.registerEditor(`*`, {
                id: editor_1.DEFAULT_EDITOR_ASSOCIATION.id,
                label: editor_1.DEFAULT_EDITOR_ASSOCIATION.displayName,
                detail: editor_1.DEFAULT_EDITOR_ASSOCIATION.providerDisplayName,
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, {
                createMergeEditorInput: mergeEditorInputFactory
            }));
        }
    };
    exports.MergeEditorResolverContribution = MergeEditorResolverContribution;
    exports.MergeEditorResolverContribution = MergeEditorResolverContribution = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, instantiation_1.IInstantiationService)
    ], MergeEditorResolverContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL3ZpZXcvbWVyZ2VFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9EekYsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLCtCQUF5Qzs7aUJBRXpELE9BQUUsR0FBRyxhQUFhLEFBQWhCLENBQWlCO1FBS25DLElBQVcsU0FBUztZQUNuQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQW9CRCxJQUFXLFVBQVU7WUFDcEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFDRCxJQUFXLEtBQUs7WUFDZixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxJQUFZLGNBQWM7WUFDekIsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBVSw0QkFBNEIsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFnQkQsWUFDQyxLQUFtQixFQUNJLGFBQW9DLEVBQ3ZDLGlCQUFzRCxFQUN2RCxnQkFBbUMsRUFDckMsY0FBK0IsRUFDakMsWUFBMkIsRUFDUCxnQ0FBbUUsRUFDL0UscUJBQTZELEVBQ3BFLGFBQTZCLEVBQ3ZCLGtCQUF3QyxFQUNoRCxXQUF5QixFQUNuQixrQkFBdUQsRUFDcEQsb0JBQTREO1lBRW5GLEtBQUssQ0FBQyxhQUFXLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLGdDQUFnQyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsa0JBQWtCLEVBQUUs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