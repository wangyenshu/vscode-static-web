var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arraysFind", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/observableInternal/derived", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/stableEditorScroll", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/browser/widget/diffEditor/components/accessibleDiffViewer", "vs/editor/browser/widget/diffEditor/components/diffEditorDecorations", "vs/editor/browser/widget/diffEditor/components/diffEditorSash", "vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/diffEditorViewZones", "vs/editor/browser/widget/diffEditor/features/gutterFeature", "vs/editor/browser/widget/diffEditor/features/hideUnchangedRegionsFeature", "vs/editor/browser/widget/diffEditor/features/movedBlocksLinesFeature", "vs/editor/browser/widget/diffEditor/features/overviewRulerFeature", "vs/editor/browser/widget/diffEditor/features/revertButtonsFeature", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorCommon", "vs/editor/common/editorContextKeys", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/progress/common/progress", "./components/diffEditorEditors", "./delegatingEditorImpl", "./diffEditorOptions", "./diffEditorViewModel", "vs/css!./style"], function (require, exports, dom_1, arraysFind_1, errors_1, event_1, lifecycle_1, observable_1, derived_1, editorExtensions_1, codeEditorService_1, stableEditorScroll_1, codeEditorWidget_1, accessibleDiffViewer_1, diffEditorDecorations_1, diffEditorSash_1, diffEditorViewZones_1, gutterFeature_1, hideUnchangedRegionsFeature_1, movedBlocksLinesFeature_1, overviewRulerFeature_1, revertButtonsFeature_1, utils_1, position_1, range_1, editorCommon_1, editorContextKeys_1, accessibilitySignalService_1, contextkey_1, instantiation_1, serviceCollection_1, progress_1, diffEditorEditors_1, delegatingEditorImpl_1, diffEditorOptions_1, diffEditorViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorWidget = void 0;
    let DiffEditorWidget = class DiffEditorWidget extends delegatingEditorImpl_1.DelegatingEditor {
        static { this.ENTIRE_DIFF_OVERVIEW_WIDTH = overviewRulerFeature_1.OverviewRulerFeature.ENTIRE_DIFF_OVERVIEW_WIDTH; }
        get onDidContentSizeChange() { return this._editors.onDidContentSizeChange; }
        get collapseUnchangedRegions() { return this._options.hideUnchangedRegions.get(); }
        constructor(_domElement, options, codeEditorWidgetOptions, _parentContextKeyService, _parentInstantiationService, codeEditorService, _accessibilitySignalService, _editorProgressService) {
            super();
            this._domElement = _domElement;
            this._parentContextKeyService = _parentContextKeyService;
            this._parentInstantiationService = _parentInstantiationService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._editorProgressService = _editorProgressService;
            this.elements = (0, dom_1.h)('div.monaco-diff-editor.side-by-side', { style: { position: 'relative', height: '100%' } }, [
                (0, dom_1.h)('div.editor.original@original', { style: { position: 'absolute', height: '100%', } }),
                (0, dom_1.h)('div.editor.modified@modified', { style: { position: 'absolute', height: '100%', } }),
                (0, dom_1.h)('div.accessibleDiffViewer@accessibleDiffViewer', { style: { position: 'absolute', height: '100%' } }),
            ]);
            this._diffModel = (0, observable_1.observableValue)(this, undefined);
            this._shouldDisposeDiffModel = false;
            this.onDidChangeModel = event_1.Event.fromObservableLight(this._diffModel);
            this._contextKeyService = this._register(this._parentContextKeyService.createScoped(this._domElement));
            this._instantiationService = this._parentInstantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this._contextKeyService]));
            this._boundarySashes = (0, observable_1.observableValue)(this, undefined);
            this._accessibleDiffViewerShouldBeVisible = (0, observable_1.observableValue)(this, false);
            this._accessibleDiffViewerVisible = (0, observable_1.derived)(this, reader => this._options.onlyShowAccessibleDiffViewer.read(reader)
                ? true
                : this._accessibleDiffViewerShouldBeVisible.read(reader));
            this._movedBlocksLinesPart = (0, observable_1.observableValue)(this, undefined);
            this._layoutInfo = (0, observable_1.derived)(this, reader => {
                const fullWidth = this._rootSizeObserver.width.read(reader);
                const fullHeight = this._rootSizeObserver.height.read(reader);
                const sash = this._sash.read(reader);
                const gutter = this._gutter.read(reader);
                const gutterWidth = gutter?.width.read(reader) ?? 0;
                const overviewRulerPartWidth = this._overviewRulerPart.read(reader)?.width ?? 0;
                let originalLeft, originalWidth, modifiedLeft, modifiedWidth, gutterLeft;
                const sideBySide = !!sash;
                if (sideBySide) {
                    const sashLeft = sash.sashLeft.read(reader);
                    const movedBlocksLinesWidth = this._movedBlocksLinesPart.read(reader)?.width.read(reader) ?? 0;
                    originalLeft = 0;
                    originalWidth = sashLeft - gutterWidth - movedBlocksLinesWidth;
                    gutterLeft = sashLeft - gutterWidth;
                    modifiedLeft = sashLeft;
                    modifiedWidth = fullWidth - modifiedLeft - overviewRulerPartWidth;
                }
                else {
                    gutterLeft = 0;
                    originalLeft = gutterWidth;
                    originalWidth = Math.max(5, this._editors.original.getLayoutInfo().decorationsLeft);
                    modifiedLeft = gutterWidth + originalWidth;
                    modifiedWidth = fullWidth - modifiedLeft - overviewRulerPartWidth;
                }
                this.elements.original.style.left = originalLeft + 'px';
                this.elements.original.style.width = originalWidth + 'px';
                this._editors.original.layout({ width: originalWidth, height: fullHeight }, true);
                gutter?.layout(gutterLeft);
                this.elements.modified.style.left = modifiedLeft + 'px';
                this.elements.modified.style.width = modifiedWidth + 'px';
                this._editors.modified.layout({ width: modifiedWidth, height: fullHeight }, true);
                return {
                    modifiedEditor: this._editors.modified.getLayoutInfo(),
                    originalEditor: this._editors.original.getLayoutInfo(),
                };
            });
            this._diffValue = this._diffModel.map((m, r) => m?.diff.read(r));
            this.onDidUpdateDiff = event_1.Event.fromObservableLight(this._diffValue);
            codeEditorService.willCreateDiffEditor();
            this._contextKeyService.createKey('isInDiffEditor', true);
            this._domElement.appendChild(this.elements.root);
            this._register((0, lifecycle_1.toDisposable)(() => this._domElement.removeChild(this.elements.root)));
            this._rootSizeObserver = this._register(new utils_1.ObservableElementSizeObserver(this.elements.root, options.dimension));
            this._rootSizeObserver.setAutomaticLayout(options.automaticLayout ?? false);
            this._options = this._instantiationService.createInstance(diffEditorOptions_1.DiffEditorOptions, options);
            this._register((0, observable_1.autorun)(reader => {
                this._options.setWidth(this._rootSizeObserver.width.read(reader));
            }));
            this._contextKeyService.createKey(editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.key, false);
            this._register((0, utils_1.bindContextKey)(editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor, this._contextKeyService, reader => this._options.isInEmbeddedEditor.read(reader)));
            this._register((0, utils_1.bindContextKey)(editorContextKeys_1.EditorContextKeys.comparingMovedCode, this._contextKeyService, reader => !!this._diffModel.read(reader)?.movedTextToCompare.read(reader)));
            this._register((0, utils_1.bindContextKey)(editorContextKeys_1.EditorContextKeys.diffEditorRenderSideBySideInlineBreakpointReached, this._contextKeyService, reader => this._options.couldShowInlineViewBecauseOfSize.read(reader)));
            this._register((0, utils_1.bindContextKey)(editorContextKeys_1.EditorContextKeys.diffEditorInlineMode, this._contextKeyService, reader => !this._options.renderSideBySide.read(reader)));
            this._register((0, utils_1.bindContextKey)(editorContextKeys_1.EditorContextKeys.hasChanges, this._contextKeyService, reader => (this._diffModel.read(reader)?.diff.read(reader)?.mappings.length ?? 0) > 0));
            this._editors = this._register(this._instantiationService.createInstance(diffEditorEditors_1.DiffEditorEditors, this.elements.original, this.elements.modified, this._options, codeEditorWidgetOptions, (i, c, o, o2) => this._createInnerEditor(i, c, o, o2)));
            this._register((0, utils_1.bindContextKey)(editorContextKeys_1.EditorContextKeys.diffEditorOriginalWritable, this._contextKeyService, reader => this._options.originalEditable.read(reader)));
            this._register((0, utils_1.bindContextKey)(editorContextKeys_1.EditorContextKeys.diffEditorModifiedWritable, this._contextKeyService, reader => !this._options.readOnly.read(reader)));
            this._register((0, utils_1.bindContextKey)(editorContextKeys_1.EditorContextKeys.diffEditorOriginalUri, this._contextKeyService, reader => this._diffModel.read(reader)?.model.original.uri.toString() ?? ''));
            this._register((0, utils_1.bindContextKey)(editorContextKeys_1.EditorContextKeys.diffEditorModifiedUri, this._contextKeyService, reader => this._diffModel.read(reader)?.model.modified.uri.toString() ?? ''));
            this._overviewRulerPart = (0, derived_1.derivedDisposable)(this, reader => !this._options.renderOverviewRuler.read(reader)
                ? undefined
                : this._instantiationService.createInstance((0, utils_1.readHotReloadableExport)(overviewRulerFeature_1.OverviewRulerFeature, reader), this._editors, this.elements.root, this._diffModel, this._rootSizeObserver.width, this._rootSizeObserver.height, this._layoutInfo.map(i => i.modifiedEditor))).recomputeInitiallyAndOnChange(this._store);
            this._sash = (0, derived_1.derivedDisposable)(this, reader => {
                const showSash = this._options.renderSideBySide.read(reader);
                this.elements.root.classList.toggle('side-by-side', showSash);
                return !showSash ? undefined : new diffEditorSash_1.DiffEditorSash(this._options, this.elements.root, {
                    height: this._rootSizeObserver.height,
                    width: this._rootSizeObserver.width.map((w, reader) => w - (this._overviewRulerPart.read(reader)?.width ?? 0)),
                }, this._boundarySashes);
            }).recomputeInitiallyAndOnChange(this._store);
            const unchangedRangesFeature = (0, derived_1.derivedDisposable)(this, reader => /** @description UnchangedRangesFeature */ this._instantiationService.createInstance((0, utils_1.readHotReloadableExport)(hideUnchangedRegionsFeature_1.HideUnchangedRegionsFeature, reader), this._editors, this._diffModel, this._options)).recomputeInitiallyAndOnChange(this._store);
            (0, derived_1.derivedDisposable)(this, reader => /** @description DiffEditorDecorations */ this._instantiationService.createInstance((0, utils_1.readHotReloadableExport)(diffEditorDecorations_1.DiffEditorDecorations, reader), this._editors, this._diffModel, this._options, this)).recomputeInitiallyAndOnChange(this._store);
            const origViewZoneIdsToIgnore = new Set();
            const modViewZoneIdsToIgnore = new Set();
            let isUpdatingViewZones = false;
            const viewZoneManager = (0, derived_1.derivedDisposable)(this, reader => /** @description ViewZoneManager */ this._instantiationService.createInstance((0, utils_1.readHotReloadableExport)(diffEditorViewZones_1.DiffEditorViewZones, reader), (0, dom_1.getWindow)(this._domElement), this._editors, this._diffModel, this._options, this, () => isUpdatingViewZones || unchangedRangesFeature.get().isUpdatingHiddenAreas, origViewZoneIdsToIgnore, modViewZoneIdsToIgnore)).recomputeInitiallyAndOnChange(this._store);
            const originalViewZones = (0, observable_1.derived)(this, (reader) => {
                const orig = viewZoneManager.read(reader).viewZones.read(reader).orig;
                const orig2 = unchangedRangesFeature.read(reader).viewZones.read(reader).origViewZones;
                return orig.concat(orig2);
            });
            const modifiedViewZones = (0, observable_1.derived)(this, (reader) => {
                const mod = viewZoneManager.read(reader).viewZones.read(reader).mod;
                const mod2 = unchangedRangesFeature.read(reader).viewZones.read(reader).modViewZones;
                return mod.concat(mod2);
            });
            this._register((0, utils_1.applyViewZones)(this._editors.original, originalViewZones, isUpdatingOrigViewZones => {
                isUpdatingViewZones = isUpdatingOrigViewZones;
            }, origViewZoneIdsToIgnore));
            let scrollState;
            this._register((0, utils_1.applyViewZones)(this._editors.modified, modifiedViewZones, isUpdatingModViewZones => {
                isUpdatingViewZones = isUpdatingModViewZones;
                if (isUpdatingViewZones) {
                    scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this._editors.modified);
                }
                else {
                    scrollState?.restore(this._editors.modified);
                    scrollState = undefined;
                }
            }, modViewZoneIdsToIgnore));
            this._accessibleDiffViewer = (0, derived_1.derivedDisposable)(this, reader => this._instantiationService.createInstance((0, utils_1.readHotReloadableExport)(accessibleDiffViewer_1.AccessibleDiffViewer, reader), this.elements.accessibleDiffViewer, this._accessibleDiffViewerVisible, (visible, tx) => this._accessibleDiffViewerShouldBeVisible.set(visible, tx), this._options.onlyShowAccessibleDiffViewer.map(v => !v), this._rootSizeObserver.width, this._rootSizeObserver.height, this._diffModel.map((m, r) => m?.diff.read(r)?.mappings.map(m => m.lineRangeMapping)), new accessibleDiffViewer_1.AccessibleDiffViewerModelFromEditors(this._editors))).recomputeInitiallyAndOnChange(this._store);
            const visibility = this._accessibleDiffViewerVisible.map(v => v ? 'hidden' : 'visible');
            this._register((0, utils_1.applyStyle)(this.elements.modified, { visibility }));
            this._register((0, utils_1.applyStyle)(this.elements.original, { visibility }));
            this._createDiffEditorContributions();
            codeEditorService.addDiffEditor(this);
            this._gutter = (0, derived_1.derivedDisposable)(this, reader => {
                return this._options.shouldRenderGutterMenu.read(reader)
                    ? this._instantiationService.createInstance((0, utils_1.readHotReloadableExport)(gutterFeature_1.DiffEditorGutter, reader), this.elements.root, this._diffModel, this._editors)
                    : undefined;
            });
            this._register((0, observable_1.recomputeInitiallyAndOnChange)(this._layoutInfo));
            (0, derived_1.derivedDisposable)(this, reader => /** @description MovedBlocksLinesPart */ new ((0, utils_1.readHotReloadableExport)(movedBlocksLinesFeature_1.MovedBlocksLinesFeature, reader))(this.elements.root, this._diffModel, this._layoutInfo.map(i => i.originalEditor), this._layoutInfo.map(i => i.modifiedEditor), this._editors)).recomputeInitiallyAndOnChange(this._store, value => {
                // This is to break the layout info <-> moved blocks lines part dependency cycle.
                this._movedBlocksLinesPart.set(value, undefined);
            });
            this._register(event_1.Event.runAndSubscribe(this._editors.modified.onDidChangeCursorPosition, e => this._handleCursorPositionChange(e, true)));
            this._register(event_1.Event.runAndSubscribe(this._editors.original.onDidChangeCursorPosition, e => this._handleCursorPositionChange(e, false)));
            const isInitializingDiff = this._diffModel.map(this, (m, reader) => {
                /** @isInitializingDiff isDiffUpToDate */
                if (!m) {
                    return undefined;
                }
                return m.diff.read(reader) === undefined && !m.isDiffUpToDate.read(reader);
            });
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description DiffEditorWidgetHelper.ShowProgress */
                if (isInitializingDiff.read(reader) === true) {
                    const r = this._editorProgressService.show(true, 1000);
                    store.add((0, lifecycle_1.toDisposable)(() => r.done()));
                }
            }));
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this._shouldDisposeDiffModel) {
                    this._diffModel.get()?.dispose();
                }
            }));
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                store.add(new ((0, utils_1.readHotReloadableExport)(revertButtonsFeature_1.RevertButtonsFeature, reader))(this._editors, this._diffModel, this._options, this));
            }));
        }
        getViewWidth() {
            return this._rootSizeObserver.width.get();
        }
        getContentHeight() {
            return this._editors.modified.getContentHeight();
        }
        _createInnerEditor(instantiationService, container, options, editorWidgetOptions) {
            const editor = instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, container, options, editorWidgetOptions);
            return editor;
        }
        _createDiffEditorContributions() {
            const contributions = editorExtensions_1.EditorExtensionsRegistry.getDiffEditorContributions();
            for (const desc of contributions) {
                try {
                    this._register(this._instantiationService.createInstance(desc.ctor, this));
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
            }
        }
        get _targetEditor() { return this._editors.modified; }
        getEditorType() { return editorCommon_1.EditorType.IDiffEditor; }
        onVisible() {
            // TODO: Only compute diffs when diff editor is visible
            this._editors.original.onVisible();
            this._editors.modified.onVisible();
        }
        onHide() {
            this._editors.original.onHide();
            this._editors.modified.onHide();
        }
        layout(dimension) {
            this._rootSizeObserver.observe(dimension);
        }
        hasTextFocus() { return this._editors.original.hasTextFocus() || this._editors.modified.hasTextFocus(); }
        saveViewState() {
            const originalViewState = this._editors.original.saveViewState();
            const modifiedViewState = this._editors.modified.saveViewState();
            return {
                original: originalViewState,
                modified: modifiedViewState,
                modelState: this._diffModel.get()?.serializeState(),
            };
        }
        restoreViewState(s) {
            if (s && s.original && s.modified) {
                const diffEditorState = s;
                this._editors.original.restoreViewState(diffEditorState.original);
                this._editors.modified.restoreViewState(diffEditorState.modified);
                if (diffEditorState.modelState) {
                    this._diffModel.get()?.restoreSerializedState(diffEditorState.modelState);
                }
            }
        }
        handleInitialized() {
            this._editors.original.handleInitialized();
            this._editors.modified.handleInitialized();
        }
        createViewModel(model) {
            return this._instantiationService.createInstance(diffEditorViewModel_1.DiffEditorViewModel, model, this._options);
        }
        getModel() { return this._diffModel.get()?.model ?? null; }
        setModel(model, tx) {
            if (!model && this._diffModel.get()) {
                // Transitioning from a model to no-model
                this._accessibleDiffViewer.get().close();
            }
            const vm = model ? ('model' in model) ? { model, shouldDispose: false } : { model: this.createViewModel(model), shouldDispose: true } : undefined;
            if (this._diffModel.get() !== vm?.model) {
                (0, observable_1.subtransaction)(tx, tx => {
                    /** @description DiffEditorWidget.setModel */
                    observable_1.observableFromEvent.batchEventsGlobally(tx, () => {
                        this._editors.original.setModel(vm ? vm.model.model.original : null);
                        this._editors.modified.setModel(vm ? vm.model.model.modified : null);
                    });
                    const prevValue = this._diffModel.get();
                    const shouldDispose = this._shouldDisposeDiffModel;
                    this._shouldDisposeDiffModel = vm?.shouldDispose ?? false;
                    this._diffModel.set(vm?.model, tx);
                    if (shouldDispose) {
                        prevValue?.dispose();
                    }
                });
            }
        }
        /**
         * @param changedOptions Only has values for top-level options that have actually changed.
         */
        updateOptions(changedOptions) {
            this._options.updateOptions(changedOptions);
        }
        getContainerDomNode() { return this._domElement; }
        getOriginalEditor() { return this._editors.original; }
        getModifiedEditor() { return this._editors.modified; }
        setBoundarySashes(sashes) {
            this._boundarySashes.set(sashes, undefined);
        }
        get ignoreTrimWhitespace() { return this._options.ignoreTrimWhitespace.get(); }
        get maxComputationTime() { return this._options.maxComputationTimeMs.get(); }
        get renderSideBySide() { return this._options.renderSideBySide.get(); }
        /**
         * @deprecated Use `this.getDiffComputationResult().changes2` instead.
         */
        getLineChanges() {
            const diffState = this._diffModel.get()?.diff.get();
            if (!diffState) {
                return null;
            }
            return toLineChanges(diffState);
        }
        getDiffComputationResult() {
            const diffState = this._diffModel.get()?.diff.get();
            if (!diffState) {
                return null;
            }
            return {
                changes: this.getLineChanges(),
                changes2: diffState.mappings.map(m => m.lineRangeMapping),
                identical: diffState.identical,
                quitEarly: diffState.quitEarly,
            };
        }
        revert(diff) {
            const model = this._diffModel.get();
            if (!model || !model.isDiffUpToDate.get()) {
                return;
            }
            this._editors.modified.executeEdits('diffEditor', [
                {
                    range: diff.modified.toExclusiveRange(),
                    text: model.model.original.getValueInRange(diff.original.toExclusiveRange())
                }
            ]);
        }
        revertRangeMappings(diffs) {
            const model = this._diffModel.get();
            if (!model || !model.isDiffUpToDate.get()) {
                return;
            }
            const changes = diffs.map(c => ({
                range: c.modifiedRange,
                text: model.model.original.getValueInRange(c.originalRange)
            }));
            this._editors.modified.executeEdits('diffEditor', changes);
        }
        _goTo(diff) {
            this._editors.modified.setPosition(new position_1.Position(diff.lineRangeMapping.modified.startLineNumber, 1));
            this._editors.modified.revealRangeInCenter(diff.lineRangeMapping.modified.toExclusiveRange());
        }
        goToDiff(target) {
            const diffs = this._diffModel.get()?.diff.get()?.mappings;
            if (!diffs || diffs.length === 0) {
                return;
            }
            const curLineNumber = this._editors.modified.getPosition().lineNumber;
            let diff;
            if (target === 'next') {
                diff = diffs.find(d => d.lineRangeMapping.modified.startLineNumber > curLineNumber) ?? diffs[0];
            }
            else {
                diff = (0, arraysFind_1.findLast)(diffs, d => d.lineRangeMapping.modified.startLineNumber < curLineNumber) ?? diffs[diffs.length - 1];
            }
            this._goTo(diff);
            if (diff.lineRangeMapping.modified.isEmpty) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineDeleted, { source: 'diffEditor.goToDiff' });
            }
            else if (diff.lineRangeMapping.original.isEmpty) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineInserted, { source: 'diffEditor.goToDiff' });
            }
            else if (diff) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineModified, { source: 'diffEditor.goToDiff' });
            }
        }
        revealFirstDiff() {
            const diffModel = this._diffModel.get();
            if (!diffModel) {
                return;
            }
            // wait for the diff computation to finish
            this.waitForDiff().then(() => {
                const diffs = diffModel.diff.get()?.mappings;
                if (!diffs || diffs.length === 0) {
                    return;
                }
                this._goTo(diffs[0]);
            });
        }
        accessibleDiffViewerNext() { this._accessibleDiffViewer.get().next(); }
        accessibleDiffViewerPrev() { this._accessibleDiffViewer.get().prev(); }
        async waitForDiff() {
            const diffModel = this._diffModel.get();
            if (!diffModel) {
                return;
            }
            await diffModel.waitForDiff();
        }
        mapToOtherSide() {
            const isModifiedFocus = this._editors.modified.hasWidgetFocus();
            const source = isModifiedFocus ? this._editors.modified : this._editors.original;
            const destination = isModifiedFocus ? this._editors.original : this._editors.modified;
            let destinationSelection;
            const sourceSelection = source.getSelection();
            if (sourceSelection) {
                const mappings = this._diffModel.get()?.diff.get()?.mappings.map(m => isModifiedFocus ? m.lineRangeMapping.flip() : m.lineRangeMapping);
                if (mappings) {
                    const newRange1 = (0, utils_1.translatePosition)(sourceSelection.getStartPosition(), mappings);
                    const newRange2 = (0, utils_1.translatePosition)(sourceSelection.getEndPosition(), mappings);
                    destinationSelection = range_1.Range.plusRange(newRange1, newRange2);
                }
            }
            return { destination, destinationSelection };
        }
        switchSide() {
            const { destination, destinationSelection } = this.mapToOtherSide();
            destination.focus();
            if (destinationSelection) {
                destination.setSelection(destinationSelection);
            }
        }
        exitCompareMove() {
            const model = this._diffModel.get();
            if (!model) {
                return;
            }
            model.movedTextToCompare.set(undefined, undefined);
        }
        collapseAllUnchangedRegions() {
            const unchangedRegions = this._diffModel.get()?.unchangedRegions.get();
            if (!unchangedRegions) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                for (const region of unchangedRegions) {
                    region.collapseAll(tx);
                }
            });
        }
        showAllUnchangedRegions() {
            const unchangedRegions = this._diffModel.get()?.unchangedRegions.get();
            if (!unchangedRegions) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                for (const region of unchangedRegions) {
                    region.showAll(tx);
                }
            });
        }
        _handleCursorPositionChange(e, isModifiedEditor) {
            if (e?.reason === 3 /* CursorChangeReason.Explicit */) {
                const diff = this._diffModel.get()?.diff.get()?.mappings.find(m => isModifiedEditor ? m.lineRangeMapping.modified.contains(e.position.lineNumber) : m.lineRangeMapping.original.contains(e.position.lineNumber));
                if (diff?.lineRangeMapping.modified.isEmpty) {
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineDeleted, { source: 'diffEditor.cursorPositionChanged' });
                }
                else if (diff?.lineRangeMapping.original.isEmpty) {
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineInserted, { source: 'diffEditor.cursorPositionChanged' });
                }
                else if (diff) {
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineModified, { source: 'diffEditor.cursorPositionChanged' });
                }
            }
        }
    };
    exports.DiffEditorWidget = DiffEditorWidget;
    exports.DiffEditorWidget = DiffEditorWidget = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, codeEditorService_1.ICodeEditorService),
        __param(6, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(7, progress_1.IEditorProgressService)
    ], DiffEditorWidget);
    function toLineChanges(state) {
        return state.mappings.map(x => {
            const m = x.lineRangeMapping;
            let originalStartLineNumber;
            let originalEndLineNumber;
            let modifiedStartLineNumber;
            let modifiedEndLineNumber;
            let innerChanges = m.innerChanges;
            if (m.original.isEmpty) {
                // Insertion
                originalStartLineNumber = m.original.startLineNumber - 1;
                originalEndLineNumber = 0;
                innerChanges = undefined;
            }
            else {
                originalStartLineNumber = m.original.startLineNumber;
                originalEndLineNumber = m.original.endLineNumberExclusive - 1;
            }
            if (m.modified.isEmpty) {
                // Deletion
                modifiedStartLineNumber = m.modified.startLineNumber - 1;
                modifiedEndLineNumber = 0;
                innerChanges = undefined;
            }
            else {
                modifiedStartLineNumber = m.modified.startLineNumber;
                modifiedEndLineNumber = m.modified.endLineNumberExclusive - 1;
            }
            return {
                originalStartLineNumber,
                originalEndLineNumber,
                modifiedStartLineNumber,
                modifiedEndLineNumber,
                charChanges: innerChanges?.map(m => ({
                    originalStartLineNumber: m.originalRange.startLineNumber,
                    originalStartColumn: m.originalRange.startColumn,
                    originalEndLineNumber: m.originalRange.endLineNumber,
                    originalEndColumn: m.originalRange.endColumn,
                    modifiedStartLineNumber: m.modifiedRange.startLineNumber,
                    modifiedStartColumn: m.modifiedRange.startColumn,
                    modifiedEndLineNumber: m.modifiedRange.endLineNumber,
                    modifiedEndColumn: m.modifiedRange.endColumn,
                }))
            };
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvcldpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2RpZmZFZGl0b3JXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQXNETyxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHVDQUFnQjtpQkFDdkMsK0JBQTBCLEdBQUcsMkNBQW9CLENBQUMsMEJBQTBCLEFBQWxELENBQW1EO1FBVzNGLElBQVcsc0JBQXNCLEtBQUssT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQTZCcEYsSUFBVyx3QkFBd0IsS0FBSyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRTFGLFlBQ2tCLFdBQXdCLEVBQ3pDLE9BQWlELEVBQ2pELHVCQUFxRCxFQUNqQyx3QkFBNkQsRUFDMUQsMkJBQW1FLEVBQ3RFLGlCQUFxQyxFQUM1QiwyQkFBeUUsRUFDOUUsc0JBQStEO1lBRXZGLEtBQUssRUFBRSxDQUFDO1lBVFMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFHSiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQW9CO1lBQ3pDLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBdUI7WUFFNUMsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE2QjtZQUM3RCwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBaER2RSxhQUFRLEdBQUcsSUFBQSxPQUFDLEVBQUMscUNBQXFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFO2dCQUN6SCxJQUFBLE9BQUMsRUFBQyw4QkFB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