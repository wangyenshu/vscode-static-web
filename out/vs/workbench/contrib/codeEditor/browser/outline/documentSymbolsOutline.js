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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/outline/browser/outline", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/contrib/codeEditor/browser/outline/documentSymbolsTree", "vs/editor/browser/editorBrowser", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/base/common/cancellation", "vs/base/common/async", "vs/base/common/errors", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/editor/common/core/range", "vs/editor/browser/services/codeEditorService", "vs/platform/configuration/common/configuration", "vs/nls", "vs/editor/common/services/markerDecorations", "vs/platform/markers/common/markers", "vs/base/common/resources", "vs/editor/common/services/languageFeatures"], function (require, exports, event_1, lifecycle_1, outline_1, contributions_1, platform_1, documentSymbolsTree_1, editorBrowser_1, outlineModel_1, cancellation_1, async_1, errors_1, textResourceConfiguration_1, instantiation_1, range_1, codeEditorService_1, configuration_1, nls_1, markerDecorations_1, markers_1, resources_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DocumentSymbolBreadcrumbsSource = class DocumentSymbolBreadcrumbsSource {
        constructor(_editor, _textResourceConfigurationService) {
            this._editor = _editor;
            this._textResourceConfigurationService = _textResourceConfigurationService;
            this._breadcrumbs = [];
        }
        getBreadcrumbElements() {
            return this._breadcrumbs;
        }
        clear() {
            this._breadcrumbs = [];
        }
        update(model, position) {
            const newElements = this._computeBreadcrumbs(model, position);
            this._breadcrumbs = newElements;
        }
        _computeBreadcrumbs(model, position) {
            let item = model.getItemEnclosingPosition(position);
            if (!item) {
                return [];
            }
            const chain = [];
            while (item) {
                chain.push(item);
                const parent = item.parent;
                if (parent instanceof outlineModel_1.OutlineModel) {
                    break;
                }
                if (parent instanceof outlineModel_1.OutlineGroup && parent.parent && parent.parent.children.size === 1) {
                    break;
                }
                item = parent;
            }
            const result = [];
            for (let i = chain.length - 1; i >= 0; i--) {
                const element = chain[i];
                if (this._isFiltered(element)) {
                    break;
                }
                result.push(element);
            }
            if (result.length === 0) {
                return [];
            }
            return result;
        }
        _isFiltered(element) {
            if (!(element instanceof outlineModel_1.OutlineElement)) {
                return false;
            }
            const key = `breadcrumbs.${documentSymbolsTree_1.DocumentSymbolFilter.kindToConfigName[element.symbol.kind]}`;
            let uri;
            if (this._editor && this._editor.getModel()) {
                const model = this._editor.getModel();
                uri = model.uri;
            }
            return !this._textResourceConfigurationService.getValue(uri, key);
        }
    };
    DocumentSymbolBreadcrumbsSource = __decorate([
        __param(1, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], DocumentSymbolBreadcrumbsSource);
    let DocumentSymbolsOutline = class DocumentSymbolsOutline {
        get activeElement() {
            const posistion = this._editor.getPosition();
            if (!posistion || !this._outlineModel) {
                return undefined;
            }
            else {
                return this._outlineModel.getItemEnclosingPosition(posistion);
            }
        }
        constructor(_editor, target, firstLoadBarrier, _languageFeaturesService, _codeEditorService, _outlineModelService, _configurationService, _markerDecorationsService, textResourceConfigurationService, instantiationService) {
            this._editor = _editor;
            this._languageFeaturesService = _languageFeaturesService;
            this._codeEditorService = _codeEditorService;
            this._outlineModelService = _outlineModelService;
            this._configurationService = _configurationService;
            this._markerDecorationsService = _markerDecorationsService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._outlineDisposables = new lifecycle_1.DisposableStore();
            this.outlineKind = 'documentSymbols';
            this._breadcrumbsDataSource = new DocumentSymbolBreadcrumbsSource(_editor, textResourceConfigurationService);
            const delegate = new documentSymbolsTree_1.DocumentSymbolVirtualDelegate();
            const renderers = [new documentSymbolsTree_1.DocumentSymbolGroupRenderer(), instantiationService.createInstance(documentSymbolsTree_1.DocumentSymbolRenderer, true, target)];
            const treeDataSource = {
                getChildren: (parent) => {
                    if (parent instanceof outlineModel_1.OutlineElement || parent instanceof outlineModel_1.OutlineGroup) {
                        return parent.children.values();
                    }
                    if (parent === this && this._outlineModel) {
                        return this._outlineModel.children.values();
                    }
                    return [];
                }
            };
            const comparator = new documentSymbolsTree_1.DocumentSymbolComparator();
            const initialState = textResourceConfigurationService.getValue(_editor.getModel()?.uri, "outline.collapseItems" /* OutlineConfigKeys.collapseItems */);
            const options = {
                collapseByDefault: target === 2 /* OutlineTarget.Breadcrumbs */ || (target === 1 /* OutlineTarget.OutlinePane */ && initialState === "alwaysCollapse" /* OutlineConfigCollapseItemsValues.Collapsed */),
                expandOnlyOnTwistieClick: true,
                multipleSelectionSupport: false,
                identityProvider: new documentSymbolsTree_1.DocumentSymbolIdentityProvider(),
                keyboardNavigationLabelProvider: new documentSymbolsTree_1.DocumentSymbolNavigationLabelProvider(),
                accessibilityProvider: new documentSymbolsTree_1.DocumentSymbolAccessibilityProvider((0, nls_1.localize)('document', "Document Symbols")),
                filter: target === 1 /* OutlineTarget.OutlinePane */
                    ? instantiationService.createInstance(documentSymbolsTree_1.DocumentSymbolFilter, 'outline')
                    : target === 2 /* OutlineTarget.Breadcrumbs */
                        ? instantiationService.createInstance(documentSymbolsTree_1.DocumentSymbolFilter, 'breadcrumbs')
                        : undefined
            };
            this.config = {
                breadcrumbsDataSource: this._breadcrumbsDataSource,
                delegate,
                renderers,
                treeDataSource,
                comparator,
                options,
                quickPickDataSource: { getQuickPickElements: () => { throw new Error('not implemented'); } }
            };
            // update as language, model, providers changes
            this._disposables.add(_languageFeaturesService.documentSymbolProvider.onDidChange(_ => this._createOutline()));
            this._disposables.add(this._editor.onDidChangeModel(_ => this._createOutline()));
            this._disposables.add(this._editor.onDidChangeModelLanguage(_ => this._createOutline()));
            // update soon'ish as model content change
            const updateSoon = new async_1.TimeoutTimer();
            this._disposables.add(updateSoon);
            this._disposables.add(this._editor.onDidChangeModelContent(event => {
                const model = this._editor.getModel();
                if (model) {
                    const timeout = _outlineModelService.getDebounceValue(model);
                    updateSoon.cancelAndSet(() => this._createOutline(event), timeout);
                }
            }));
            // stop when editor dies
            this._disposables.add(this._editor.onDidDispose(() => this._outlineDisposables.clear()));
            // initial load
            this._createOutline().finally(() => firstLoadBarrier.open());
        }
        dispose() {
            this._disposables.dispose();
            this._outlineDisposables.dispose();
        }
        get isEmpty() {
            return !this._outlineModel || outlineModel_1.TreeElement.empty(this._outlineModel);
        }
        get uri() {
            return this._outlineModel?.uri;
        }
        async reveal(entry, options, sideBySide, select) {
            const model = outlineModel_1.OutlineModel.get(entry);
            if (!model || !(entry instanceof outlineModel_1.OutlineElement)) {
                return;
            }
            await this._codeEditorService.openCodeEditor({
                resource: model.uri,
                options: {
                    ...options,
                    selection: select ? entry.symbol.range : range_1.Range.collapseToStart(entry.symbol.selectionRange),
                    selectionRevealType: 3 /* TextEditorSelectionRevealType.NearTopIfOutsideViewport */,
                }
            }, this._editor, sideBySide);
        }
        preview(entry) {
            if (!(entry instanceof outlineModel_1.OutlineElement)) {
                return lifecycle_1.Disposable.None;
            }
            const { symbol } = entry;
            this._editor.revealRangeInCenterIfOutsideViewport(symbol.range, 0 /* ScrollType.Smooth */);
            const decorationsCollection = this._editor.createDecorationsCollection([{
                    range: symbol.range,
                    options: {
                        description: 'document-symbols-outline-range-highlight',
                        className: 'rangeHighlight',
                        isWholeLine: true
                    }
                }]);
            return (0, lifecycle_1.toDisposable)(() => decorationsCollection.clear());
        }
        captureViewState() {
            const viewState = this._editor.saveViewState();
            return (0, lifecycle_1.toDisposable)(() => {
                if (viewState) {
                    this._editor.restoreViewState(viewState);
                }
            });
        }
        async _createOutline(contentChangeEvent) {
            this._outlineDisposables.clear();
            if (!contentChangeEvent) {
                this._setOutlineModel(undefined);
            }
            if (!this._editor.hasModel()) {
                return;
            }
            const buffer = this._editor.getModel();
            if (!this._languageFeaturesService.documentSymbolProvider.has(buffer)) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const versionIdThen = buffer.getVersionId();
            const timeoutTimer = new async_1.TimeoutTimer();
            this._outlineDisposables.add(timeoutTimer);
            this._outlineDisposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            try {
                const model = await this._outlineModelService.getOrCreate(buffer, cts.token);
                if (cts.token.isCancellationRequested) {
                    // cancelled -> do nothing
                    return;
                }
                if (outlineModel_1.TreeElement.empty(model) || !this._editor.hasModel()) {
                    // empty -> no outline elements
                    this._setOutlineModel(model);
                    return;
                }
                // heuristic: when the symbols-to-lines ratio changes by 50% between edits
                // wait a little (and hope that the next change isn't as drastic).
                if (contentChangeEvent && this._outlineModel && buffer.getLineCount() >= 25) {
                    const newSize = outlineModel_1.TreeElement.size(model);
                    const newLength = buffer.getValueLength();
                    const newRatio = newSize / newLength;
                    const oldSize = outlineModel_1.TreeElement.size(this._outlineModel);
                    const oldLength = newLength - contentChangeEvent.changes.reduce((prev, value) => prev + value.rangeLength, 0);
                    const oldRatio = oldSize / oldLength;
                    if (newRatio <= oldRatio * 0.5 || newRatio >= oldRatio * 1.5) {
                        // wait for a better state and ignore current model when more
                        // typing has happened
                        const value = await (0, async_1.raceCancellation)((0, async_1.timeout)(2000).then(() => true), cts.token, false);
                        if (!value) {
                            return;
                        }
                    }
                }
                // feature: show markers with outline element
                this._applyMarkersToOutline(model);
                this._outlineDisposables.add(this._markerDecorationsService.onDidChangeMarker(textModel => {
                    if ((0, resources_1.isEqual)(model.uri, textModel.uri)) {
                        this._applyMarkersToOutline(model);
                        this._onDidChange.fire({});
                    }
                }));
                this._outlineDisposables.add(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */) || e.affectsConfiguration('problems.visibility')) {
                        const problem = this._configurationService.getValue('problems.visibility');
                        const config = this._configurationService.getValue("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */);
                        if (!problem || !config) {
                            model.updateMarker([]);
                        }
                        else {
                            this._applyMarkersToOutline(model);
                        }
                        this._onDidChange.fire({});
                    }
                    if (e.affectsConfiguration('outline')) {
                        // outline filtering, problems on/off
                        this._onDidChange.fire({});
                    }
                    if (e.affectsConfiguration('breadcrumbs') && this._editor.hasModel()) {
                        // breadcrumbs filtering
                        this._breadcrumbsDataSource.update(model, this._editor.getPosition());
                        this._onDidChange.fire({});
                    }
                }));
                // feature: toggle icons
                this._outlineDisposables.add(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration("outline.icons" /* OutlineConfigKeys.icons */)) {
                        this._onDidChange.fire({});
                    }
                    if (e.affectsConfiguration('outline')) {
                        this._onDidChange.fire({});
                    }
                }));
                // feature: update active when cursor changes
                this._outlineDisposables.add(this._editor.onDidChangeCursorPosition(_ => {
                    timeoutTimer.cancelAndSet(() => {
                        if (!buffer.isDisposed() && versionIdThen === buffer.getVersionId() && this._editor.hasModel()) {
                            this._breadcrumbsDataSource.update(model, this._editor.getPosition());
                            this._onDidChange.fire({ affectOnlyActiveElement: true });
                        }
                    }, 150);
                }));
                // update properties, send event
                this._setOutlineModel(model);
            }
            catch (err) {
                this._setOutlineModel(undefined);
                (0, errors_1.onUnexpectedError)(err);
            }
        }
        _applyMarkersToOutline(model) {
            const problem = this._configurationService.getValue('problems.visibility');
            const config = this._configurationService.getValue("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */);
            if (!model || !problem || !config) {
                return;
            }
            const markers = [];
            for (const [range, marker] of this._markerDecorationsService.getLiveMarkers(model.uri)) {
                if (marker.severity === markers_1.MarkerSeverity.Error || marker.severity === markers_1.MarkerSeverity.Warning) {
                    markers.push({ ...range, severity: marker.severity });
                }
            }
            model.updateMarker(markers);
        }
        _setOutlineModel(model) {
            const position = this._editor.getPosition();
            if (!position || !model) {
                this._outlineModel = undefined;
                this._breadcrumbsDataSource.clear();
            }
            else {
                if (!this._outlineModel?.merge(model)) {
                    this._outlineModel = model;
                }
                this._breadcrumbsDataSource.update(model, position);
            }
            this._onDidChange.fire({});
        }
    };
    DocumentSymbolsOutline = __decorate([
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, outlineModel_1.IOutlineModelService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, markerDecorations_1.IMarkerDecorationsService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, instantiation_1.IInstantiationService)
    ], DocumentSymbolsOutline);
    let DocumentSymbolsOutlineCreator = class DocumentSymbolsOutlineCreator {
        constructor(outlineService) {
            const reg = outlineService.registerOutlineCreator(this);
            this.dispose = () => reg.dispose();
        }
        matches(candidate) {
            const ctrl = candidate.getControl();
            return (0, editorBrowser_1.isCodeEditor)(ctrl) || (0, editorBrowser_1.isDiffEditor)(ctrl);
        }
        async createOutline(pane, target, _token) {
            const control = pane.getControl();
            let editor;
            if ((0, editorBrowser_1.isCodeEditor)(control)) {
                editor = control;
            }
            else if ((0, editorBrowser_1.isDiffEditor)(control)) {
                editor = control.getModifiedEditor();
            }
            if (!editor) {
                return undefined;
            }
            const firstLoadBarrier = new async_1.Barrier();
            const result = editor.invokeWithinContext(accessor => accessor.get(instantiation_1.IInstantiationService).createInstance(DocumentSymbolsOutline, editor, target, firstLoadBarrier));
            await firstLoadBarrier.wait();
            return result;
        }
    };
    DocumentSymbolsOutlineCreator = __decorate([
        __param(0, outline_1.IOutlineService)
    ], DocumentSymbolsOutlineCreator);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(DocumentSymbolsOutlineCreator, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRTeW1ib2xzT3V0bGluZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvYnJvd3Nlci9vdXRsaW5lL2RvY3VtZW50U3ltYm9sc091dGxpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFtQ2hHLElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQStCO1FBSXBDLFlBQ2tCLE9BQW9CLEVBQ0YsaUNBQXFGO1lBRHZHLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDZSxzQ0FBaUMsR0FBakMsaUNBQWlDLENBQW1DO1lBSmpILGlCQUFZLEdBQXNDLEVBQUUsQ0FBQztRQUt6RCxDQUFDO1FBRUwscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBbUIsRUFBRSxRQUFtQjtZQUM5QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzlELElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1FBQ2pDLENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxLQUFtQixFQUFFLFFBQW1CO1lBQ25FLElBQUksSUFBSSxHQUE4QyxLQUFLLENBQUMsd0JBQXdCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0YsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE1BQU0sS0FBSyxHQUF5QyxFQUFFLENBQUM7WUFDdkQsT0FBTyxJQUFJLEVBQUUsQ0FBQztnQkFDYixL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