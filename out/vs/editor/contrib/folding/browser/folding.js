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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/types", "vs/editor/browser/stableEditorScroll", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/folding/browser/foldingModel", "vs/editor/contrib/folding/browser/hiddenRangeModel", "vs/editor/contrib/folding/browser/indentRangeProvider", "vs/nls", "vs/platform/contextkey/common/contextkey", "./foldingDecorations", "./foldingRanges", "./syntaxRangeProvider", "vs/platform/notification/common/notification", "vs/editor/common/services/languageFeatureDebounce", "vs/base/common/stopwatch", "vs/editor/common/services/languageFeatures", "vs/base/common/event", "vs/platform/commands/common/commands", "vs/base/common/uri", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration", "vs/css!./folding"], function (require, exports, async_1, cancellation_1, errors_1, keyCodes_1, lifecycle_1, strings_1, types, stableEditorScroll_1, editorExtensions_1, editorContextKeys_1, languages_1, languageConfigurationRegistry_1, foldingModel_1, hiddenRangeModel_1, indentRangeProvider_1, nls, contextkey_1, foldingDecorations_1, foldingRanges_1, syntaxRangeProvider_1, notification_1, languageFeatureDebounce_1, stopwatch_1, languageFeatures_1, event_1, commands_1, uri_1, model_1, configuration_1) {
    "use strict";
    var FoldingController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangesLimitReporter = exports.FoldingController = void 0;
    const CONTEXT_FOLDING_ENABLED = new contextkey_1.RawContextKey('foldingEnabled', false);
    let FoldingController = class FoldingController extends lifecycle_1.Disposable {
        static { FoldingController_1 = this; }
        static { this.ID = 'editor.contrib.folding'; }
        static get(editor) {
            return editor.getContribution(FoldingController_1.ID);
        }
        static getFoldingRangeProviders(languageFeaturesService, model) {
            const foldingRangeProviders = languageFeaturesService.foldingRangeProvider.ordered(model);
            return (FoldingController_1._foldingRangeSelector?.(foldingRangeProviders, model)) ?? foldingRangeProviders;
        }
        static setFoldingRangeProviderSelector(foldingRangeSelector) {
            FoldingController_1._foldingRangeSelector = foldingRangeSelector;
            return { dispose: () => { FoldingController_1._foldingRangeSelector = undefined; } };
        }
        constructor(editor, contextKeyService, languageConfigurationService, notificationService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this.contextKeyService = contextKeyService;
            this.languageConfigurationService = languageConfigurationService;
            this.languageFeaturesService = languageFeaturesService;
            this.localToDispose = this._register(new lifecycle_1.DisposableStore());
            this.editor = editor;
            this._foldingLimitReporter = new RangesLimitReporter(editor);
            const options = this.editor.getOptions();
            this._isEnabled = options.get(43 /* EditorOption.folding */);
            this._useFoldingProviders = options.get(44 /* EditorOption.foldingStrategy */) !== 'indentation';
            this._unfoldOnClickAfterEndOfLine = options.get(48 /* EditorOption.unfoldOnClickAfterEndOfLine */);
            this._restoringViewState = false;
            this._currentModelHasFoldedImports = false;
            this._foldingImportsByDefault = options.get(46 /* EditorOption.foldingImportsByDefault */);
            this.updateDebounceInfo = languageFeatureDebounceService.for(languageFeaturesService.foldingRangeProvider, 'Folding', { min: 200 });
            this.foldingModel = null;
            this.hiddenRangeModel = null;
            this.rangeProvider = null;
            this.foldingRegionPromise = null;
            this.foldingModelPromise = null;
            this.updateScheduler = null;
            this.cursorChangedScheduler = null;
            this.mouseDownInfo = null;
            this.foldingDecorationProvider = new foldingDecorations_1.FoldingDecorationProvider(editor);
            this.foldingDecorationProvider.showFoldingControls = options.get(110 /* EditorOption.showFoldingControls */);
            this.foldingDecorationProvider.showFoldingHighlights = options.get(45 /* EditorOption.foldingHighlight */);
            this.foldingEnabled = CONTEXT_FOLDING_ENABLED.bindTo(this.contextKeyService);
            this.foldingEnabled.set(this._isEnabled);
            this._register(this.editor.onDidChangeModel(() => this.onModelChanged()));
            this._register(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(43 /* EditorOption.folding */)) {
                    this._isEnabled = this.editor.getOptions().get(43 /* EditorOption.folding */);
                    this.foldingEnabled.set(this._isEnabled);
                    this.onModelChanged();
                }
                if (e.hasChanged(47 /* EditorOption.foldingMaximumRegions */)) {
                    this.onModelChanged();
                }
                if (e.hasChanged(110 /* EditorOption.showFoldingControls */) || e.hasChanged(45 /* EditorOption.foldingHighlight */)) {
                    const options = this.editor.getOptions();
                    this.foldingDecorationProvider.showFoldingControls = options.get(110 /* EditorOption.showFoldingControls */);
                    this.foldingDecorationProvider.showFoldingHighlights = options.get(45 /* EditorOption.foldingHighlight */);
                    this.triggerFoldingModelChanged();
                }
                if (e.hasChanged(44 /* EditorOption.foldingStrategy */)) {
                    this._useFoldingProviders = this.editor.getOptions().get(44 /* EditorOption.foldingStrategy */) !== 'indentation';
                    this.onFoldingStrategyChanged();
                }
                if (e.hasChanged(48 /* EditorOption.unfoldOnClickAfterEndOfLine */)) {
                    this._unfoldOnClickAfterEndOfLine = this.editor.getOptions().get(48 /* EditorOption.unfoldOnClickAfterEndOfLine */);
                }
                if (e.hasChanged(46 /* EditorOption.foldingImportsByDefault */)) {
                    this._foldingImportsByDefault = this.editor.getOptions().get(46 /* EditorOption.foldingImportsByDefault */);
                }
            }));
            this.onModelChanged();
        }
        get limitReporter() {
            return this._foldingLimitReporter;
        }
        /**
         * Store view state.
         */
        saveViewState() {
            const model = this.editor.getModel();
            if (!model || !this._isEnabled || model.isTooLargeForTokenization()) {
                return {};
            }
            if (this.foldingModel) { // disposed ?
                const collapsedRegions = this.foldingModel.getMemento();
                const provider = this.rangeProvider ? this.rangeProvider.id : undefined;
                return { collapsedRegions, lineCount: model.getLineCount(), provider, foldedImports: this._currentModelHasFoldedImports };
            }
            return undefined;
        }
        /**
         * Restore view state.
         */
        restoreViewState(state) {
            const model = this.editor.getModel();
            if (!model || !this._isEnabled || model.isTooLargeForTokenization() || !this.hiddenRangeModel) {
                return;
            }
            if (!state) {
                return;
            }
            this._currentModelHasFoldedImports = !!state.foldedImports;
            if (state.collapsedRegions && state.collapsedRegions.length > 0 && this.foldingModel) {
                this._restoringViewState = true;
                try {
                    this.foldingModel.applyMemento(state.collapsedRegions);
                }
                finally {
                    this._restoringViewState = false;
                }
            }
        }
        onModelChanged() {
            this.localToDispose.clear();
            const model = this.editor.getModel();
            if (!this._isEnabled || !model || model.isTooLargeForTokenization()) {
                // huge files get no view model, so they cannot support hidden areas
                return;
            }
            this._currentModelHasFoldedImports = false;
            this.foldingModel = new foldingModel_1.FoldingModel(model, this.foldingDecorationProvider);
            this.localToDispose.add(this.foldingModel);
            this.hiddenRangeModel = new hiddenRangeModel_1.HiddenRangeModel(this.foldingModel);
            this.localToDispose.add(this.hiddenRangeModel);
            this.localToDispose.add(this.hiddenRangeModel.onDidChange(hr => this.onHiddenRangesChanges(hr)));
            this.updateScheduler = new async_1.Delayer(this.updateDebounceInfo.get(model));
            this.cursorChangedScheduler = new async_1.RunOnceScheduler(() => this.revealCursor(), 200);
            this.localToDispose.add(this.cursorChangedScheduler);
            this.localToDispose.add(this.languageFeaturesService.foldingRangeProvider.onDidChange(() => this.onFoldingStrategyChanged()));
            this.localToDispose.add(this.editor.onDidChangeModelLanguageConfiguration(() => this.onFoldingStrategyChanged())); // covers model language changes as well
            this.localToDispose.add(this.editor.onDidChangeModelContent(e => this.onDidChangeModelContent(e)));
            this.localToDispose.add(this.editor.onDidChangeCursorPosition(() => this.onCursorPositionChanged()));
            this.localToDispose.add(this.editor.onMouseDown(e => this.onEditorMouseDown(e)));
            this.localToDispose.add(this.editor.onMouseUp(e => this.onEditorMouseUp(e)));
            this.localToDispose.add({
                dispose: () => {
                    if (this.foldingRegionPromise) {
                        this.foldingRegionPromise.cancel();
                        this.foldingRegionPromise = null;
                    }
                    this.updateScheduler?.cancel();
                    this.updateScheduler = null;
                    this.foldingModel = null;
                    this.foldingModelPromise = null;
                    this.hiddenRangeModel = null;
                    this.cursorChangedScheduler = null;
                    this.rangeProvider?.dispose();
                    this.rangeProvider = null;
                }
            });
            this.triggerFoldingModelChanged();
        }
        onFoldingStrategyChanged() {
            this.rangeProvider?.dispose();
            this.rangeProvider = null;
            this.triggerFoldingModelChanged();
        }
        getRangeProvider(editorModel) {
            if (this.rangeProvider) {
                return this.rangeProvider;
            }
            const indentRangeProvider = new indentRangeProvider_1.IndentRangeProvider(editorModel, this.languageConfigurationService, this._foldingLimitReporter);
            this.rangeProvider = indentRangeProvider; // fallback
            if (this._useFoldingProviders && this.foldingModel) {
                const selectedProviders = FoldingController_1.getFoldingRangeProviders(this.languageFeaturesService, editorModel);
                if (selectedProviders.length > 0) {
                    this.rangeProvider = new syntaxRangeProvider_1.SyntaxRangeProvider(editorModel, selectedProviders, () => this.triggerFoldingModelChanged(), this._foldingLimitReporter, indentRangeProvider);
                }
            }
            return this.rangeProvider;
        }
        getFoldingModel() {
            return this.foldingModelPromise;
        }
        onDidChangeModelContent(e) {
            this.hiddenRangeModel?.notifyChangeModelContent(e);
            this.triggerFoldingModelChanged();
        }
        triggerFoldingModelChanged() {
            if (this.updateScheduler) {
                if (this.foldingRegionPromise) {
                    this.foldingRegionPromise.cancel();
                    this.foldingRegionPromise = null;
                }
                this.foldingModelPromise = this.updateScheduler.trigger(() => {
                    const foldingModel = this.foldingModel;
                    if (!foldingModel) { // null if editor has been disposed, or folding turned off
                        return null;
                    }
                    const sw = new stopwatch_1.StopWatch();
                    const provider = this.getRangeProvider(foldingModel.textModel);
                    const foldingRegionPromise = this.foldingRegionPromise = (0, async_1.createCancelablePromise)(token => provider.compute(token));
                    return foldingRegionPromise.then(foldingRanges => {
                        if (foldingRanges && foldingRegionPromise === this.foldingRegionPromise) { // new request or cancelled in the meantime?
                            let scrollState;
                            if (this._foldingImportsByDefault && !this._currentModelHasFoldedImports) {
                                const hasChanges = foldingRanges.setCollapsedAllOfType(languages_1.FoldingRangeKind.Imports.value, true);
                                if (hasChanges) {
                                    scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this.editor);
                                    this._currentModelHasFoldedImports = hasChanges;
                                }
                            }
                            // some cursors might have moved into hidden regions, make sure they are in expanded regions
                            const selections = this.editor.getSelections();
                            const selectionLineNumbers = selections ? selections.map(s => s.startLineNumber) : [];
                            foldingModel.update(foldingRanges, selectionLineNumbers);
                            scrollState?.restore(this.editor);
                            // update debounce info
                            const newValue = this.updateDebounceInfo.update(foldingModel.textModel, sw.elapsed());
                            if (this.updateScheduler) {
                                this.updateScheduler.defaultDelay = newValue;
                            }
                        }
                        return foldingModel;
                    });
                }).then(undefined, (err) => {
                    (0, errors_1.onUnexpectedError)(err);
                    return null;
                });
            }
        }
        onHiddenRangesChanges(hiddenRanges) {
            if (this.hiddenRangeModel && hiddenRanges.length && !this._restoringViewState) {
                const selections = this.editor.getSelections();
                if (selections) {
                    if (this.hiddenRangeModel.adjustSelections(selections)) {
                        this.editor.setSelections(selections);
                    }
                }
            }
            this.editor.setHiddenAreas(hiddenRanges, this);
        }
        onCursorPositionChanged() {
            if (this.hiddenRangeModel && this.hiddenRangeModel.hasRanges()) {
                this.cursorChangedScheduler.schedule();
            }
        }
        revealCursor() {
            const foldingModel = this.getFoldingModel();
            if (!foldingModel) {
                return;
            }
            foldingModel.then(foldingModel => {
                if (foldingModel) {
                    const selections = this.editor.getSelections();
                    if (selections && selections.length > 0) {
                        const toToggle = [];
                        for (const selection of selections) {
                            const lineNumber = selection.selectionStartLineNumber;
                            if (this.hiddenRangeModel && this.hiddenRangeModel.isHidden(lineNumber)) {
                                toToggle.push(...foldingModel.getAllRegionsAtLine(lineNumber, r => r.isCollapsed && lineNumber > r.startLineNumber));
                            }
                        }
                        if (toToggle.length) {
                            foldingModel.toggleCollapseState(toToggle);
                            this.reveal(selections[0].getPosition());
                        }
                    }
                }
            }).then(undefined, errors_1.onUnexpectedError);
        }
        onEditorMouseDown(e) {
            this.mouseDownInfo = null;
            if (!this.hiddenRangeModel || !e.target || !e.target.range) {
                return;
            }
            if (!e.event.leftButton && !e.event.middleButton) {
                return;
            }
            const range = e.target.range;
            let iconClicked = false;
            switch (e.target.type) {
                case 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */: {
                    const data = e.target.detail;
                    const offsetLeftInGutter = e.target.element.offsetLeft;
                    const gutterOffsetX = data.offsetX - offsetLeftInGutter;
                    // const gutterOffsetX = data.offsetX - data.glyphMarginWidth - data.lineNumbersWidth - data.glyphMarginLeft;
                    // TODO@joao TODO@alex TODO@martin this is such that we don't collide with dirty diff
                    if (gutterOffsetX < 4) { // the whitespace between the border and the real folding icon border is 4px
                        return;
                    }
                    iconClicked = true;
                    break;
                }
                case 7 /* MouseTargetType.CONTENT_EMPTY */: {
                    if (this._unfoldOnClickAfterEndOfLine && this.hiddenRangeModel.hasRanges()) {
                        const data = e.target.detail;
                        if (!data.isAfterLines) {
                            break;
                        }
                    }
                    return;
                }
                case 6 /* MouseTargetType.CONTENT_TEXT */: {
                    if (this.hiddenRangeModel.hasRanges()) {
                        const model = this.editor.getModel();
                        if (model && range.startColumn === model.getLineMaxColumn(range.startLineNumber)) {
                            break;
                        }
                    }
                    return;
                }
                default:
                    return;
            }
            this.mouseDownInfo = { lineNumber: range.startLineNumber, iconClicked };
        }
        onEditorMouseUp(e) {
            const foldingModel = this.foldingModel;
            if (!foldingModel || !this.mouseDownInfo || !e.target) {
                return;
            }
            const lineNumber = this.mouseDownInfo.lineNumber;
            const iconClicked = this.mouseDownInfo.iconClicked;
            const range = e.target.range;
            if (!range || range.startLineNumber !== lineNumber) {
                return;
            }
            if (iconClicked) {
                if (e.target.type !== 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
                    return;
                }
            }
            else {
                const model = this.editor.getModel();
                if (!model || range.startColumn !== model.getLineMaxColumn(lineNumber)) {
                    return;
                }
            }
            const region = foldingModel.getRegionAtLine(lineNumber);
            if (region && region.startLineNumber === lineNumber) {
                const isCollapsed = region.isCollapsed;
                if (iconClicked || isCollapsed) {
                    const surrounding = e.event.altKey;
                    let toToggle = [];
                    if (surrounding) {
                        const filter = (otherRegion) => !otherRegion.containedBy(region) && !region.containedBy(otherRegion);
                        const toMaybeToggle = foldingModel.getRegionsInside(null, filter);
                        for (const r of toMaybeToggle) {
                            if (r.isCollapsed) {
                                toToggle.push(r);
                            }
                        }
                        // if any surrounding regions are folded, unfold those. Otherwise, fold all surrounding
                        if (toToggle.length === 0) {
                            toToggle = toMaybeToggle;
                        }
                    }
                    else {
                        const recursive = e.event.middleButton || e.event.shiftKey;
                        if (recursive) {
                            for (const r of foldingModel.getRegionsInside(region)) {
                                if (r.isCollapsed === isCollapsed) {
                                    toToggle.push(r);
                                }
                            }
                        }
                        // when recursive, first only collapse all children. If all are already folded or there are no children, also fold parent.
                        if (isCollapsed || !recursive || toToggle.length === 0) {
                            toToggle.push(region);
                        }
                    }
                    foldingModel.toggleCollapseState(toToggle);
                    this.reveal({ lineNumber, column: 1 });
                }
            }
        }
        reveal(position) {
            this.editor.revealPositionInCenterIfOutsideViewport(position, 0 /* ScrollType.Smooth */);
        }
    };
    exports.FoldingController = FoldingController;
    exports.FoldingController = FoldingController = FoldingController_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(5, languageFeatures_1.ILanguageFeaturesService)
    ], FoldingController);
    class RangesLimitReporter {
        constructor(editor) {
            this.editor = editor;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._computed = 0;
            this._limited = false;
        }
        get limit() {
            return this.editor.getOptions().get(47 /* EditorOption.foldingMaximumRegions */);
        }
        get computed() {
            return this._computed;
        }
        get limited() {
            return this._limited;
        }
        update(computed, limited) {
            if (computed !== this._computed || limited !== this._limited) {
                this._computed = computed;
                this._limited = limited;
                this._onDidChange.fire();
            }
        }
    }
    exports.RangesLimitReporter = RangesLimitReporter;
    class FoldingAction extends editorExtensions_1.EditorAction {
        runEditorCommand(accessor, editor, args) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const foldingController = FoldingController.get(editor);
            if (!foldingController) {
                return;
            }
            const foldingModelPromise = foldingController.getFoldingModel();
            if (foldingModelPromise) {
                this.reportTelemetry(accessor, editor);
                return foldingModelPromise.then(foldingModel => {
                    if (foldingModel) {
                        this.invoke(foldingController, foldingModel, editor, args, languageConfigurationService);
                        const selection = editor.getSelection();
                        if (selection) {
                            foldingController.reveal(selection.getStartPosition());
                        }
                    }
                });
            }
        }
        getSelectedLines(editor) {
            const selections = editor.getSelections();
            return selections ? selections.map(s => s.startLineNumber) : [];
        }
        getLineNumbers(args, editor) {
            if (args && args.selectionLines) {
                return args.selectionLines.map(l => l + 1); // to 0-bases line numbers
            }
            return this.getSelectedLines(editor);
        }
        run(_accessor, _editor) {
        }
    }
    function foldingArgumentsConstraint(args) {
        if (!types.isUndefined(args)) {
            if (!types.isObject(args)) {
                return false;
            }
            const foldingArgs = args;
            if (!types.isUndefined(foldingArgs.levels) && !types.isNumber(foldingArgs.levels)) {
                return false;
            }
            if (!types.isUndefined(foldingArgs.direction) && !types.isString(foldingArgs.direction)) {
                return false;
            }
            if (!types.isUndefined(foldingArgs.selectionLines) && (!Array.isArray(foldingArgs.selectionLines) || !foldingArgs.selectionLines.every(types.isNumber))) {
                return false;
            }
        }
        return true;
    }
    class UnfoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfold',
                label: nls.localize('unfoldAction.label', "Unfold"),
                alias: 'Unfold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 94 /* KeyCode.BracketRight */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 94 /* KeyCode.BracketRight */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: 'Unfold the content in the editor',
                    args: [
                        {
                            name: 'Unfold editor argument',
                            description: `Property-value pairs that can be passed through this argument:
						* 'levels': Number of levels to unfold. If not set, defaults to 1.
						* 'direction': If 'up', unfold given number of levels up otherwise unfolds down.
						* 'selectionLines': Array of the start lines (0-based) of the editor selections to apply the unfold action to. If not set, the active selection(s) will be used.
						`,
                            constraint: foldingArgumentsConstraint,
                            schema: {
                                'type': 'object',
                                'properties': {
                                    'levels': {
                                        'type': 'number',
                                        'default': 1
                                    },
                                    'direction': {
                                        'type': 'string',
                                        'enum': ['up', 'down'],
                                        'default': 'down'
                                    },
                                    'selectionLines': {
                                        'type': 'array',
                                        'items': {
                                            'type': 'number'
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args) {
            const levels = args && args.levels || 1;
            const lineNumbers = this.getLineNumbers(args, editor);
            if (args && args.direction === 'up') {
                (0, foldingModel_1.setCollapseStateLevelsUp)(foldingModel, false, levels, lineNumbers);
            }
            else {
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false, levels, lineNumbers);
            }
        }
    }
    class UnFoldRecursivelyAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldRecursively',
                label: nls.localize('unFoldRecursivelyAction.label', "Unfold Recursively"),
                alias: 'Unfold Recursively',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 94 /* KeyCode.BracketRight */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, _args) {
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false, Number.MAX_VALUE, this.getSelectedLines(editor));
        }
    }
    class FoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.fold',
                label: nls.localize('foldAction.label', "Fold"),
                alias: 'Fold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 92 /* KeyCode.BracketLeft */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 92 /* KeyCode.BracketLeft */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: {
                    description: 'Fold the content in the editor',
                    args: [
                        {
                            name: 'Fold editor argument',
                            description: `Property-value pairs that can be passed through this argument:
							* 'levels': Number of levels to fold.
							* 'direction': If 'up', folds given number of levels up otherwise folds down.
							* 'selectionLines': Array of the start lines (0-based) of the editor selections to apply the fold action to. If not set, the active selection(s) will be used.
							If no levels or direction is set, folds the region at the locations or if already collapsed, the first uncollapsed parent instead.
						`,
                            constraint: foldingArgumentsConstraint,
                            schema: {
                                'type': 'object',
                                'properties': {
                                    'levels': {
                                        'type': 'number',
                                    },
                                    'direction': {
                                        'type': 'string',
                                        'enum': ['up', 'down'],
                                    },
                                    'selectionLines': {
                                        'type': 'array',
                                        'items': {
                                            'type': 'number'
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args) {
            const lineNumbers = this.getLineNumbers(args, editor);
            const levels = args && args.levels;
            const direction = args && args.direction;
            if (typeof levels !== 'number' && typeof direction !== 'string') {
                // fold the region at the location or if already collapsed, the first uncollapsed parent instead.
                (0, foldingModel_1.setCollapseStateUp)(foldingModel, true, lineNumbers);
            }
            else {
                if (direction === 'up') {
                    (0, foldingModel_1.setCollapseStateLevelsUp)(foldingModel, true, levels || 1, lineNumbers);
                }
                else {
                    (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true, levels || 1, lineNumbers);
                }
            }
        }
    }
    class ToggleFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.toggleFold',
                label: nls.localize('toggleFoldAction.label', "Toggle Fold"),
                alias: 'Toggle Fold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.toggleCollapseState)(foldingModel, 1, selectedLines);
        }
    }
    class FoldRecursivelyAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldRecursively',
                label: nls.localize('foldRecursivelyAction.label', "Fold Recursively"),
                alias: 'Fold Recursively',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 92 /* KeyCode.BracketLeft */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true, Number.MAX_VALUE, selectedLines);
        }
    }
    class FoldAllBlockCommentsAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAllBlockComments',
                label: nls.localize('foldAllBlockComments.label', "Fold All Block Comments"),
                alias: 'Fold All Block Comments',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 90 /* KeyCode.Slash */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args, languageConfigurationService) {
            if (foldingModel.regions.hasTypes()) {
                (0, foldingModel_1.setCollapseStateForType)(foldingModel, languages_1.FoldingRangeKind.Comment.value, true);
            }
            else {
                const editorModel = editor.getModel();
                if (!editorModel) {
                    return;
                }
                const comments = languageConfigurationService.getLanguageConfiguration(editorModel.getLanguageId()).comments;
                if (comments && comments.blockCommentStartToken) {
                    const regExp = new RegExp('^\\s*' + (0, strings_1.escapeRegExpCharacters)(comments.blockCommentStartToken));
                    (0, foldingModel_1.setCollapseStateForMatchingLines)(foldingModel, regExp, true);
                }
            }
        }
    }
    class FoldAllRegionsAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAllMarkerRegions',
                label: nls.localize('foldAllMarkerRegions.label', "Fold All Regions"),
                alias: 'Fold All Regions',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 29 /* KeyCode.Digit8 */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args, languageConfigurationService) {
            if (foldingModel.regions.hasTypes()) {
                (0, foldingModel_1.setCollapseStateForType)(foldingModel, languages_1.FoldingRangeKind.Region.value, true);
            }
            else {
                const editorModel = editor.getModel();
                if (!editorModel) {
                    return;
                }
                const foldingRules = languageConfigurationService.getLanguageConfiguration(editorModel.getLanguageId()).foldingRules;
                if (foldingRules && foldingRules.markers && foldingRules.markers.start) {
                    const regExp = new RegExp(foldingRules.markers.start);
                    (0, foldingModel_1.setCollapseStateForMatchingLines)(foldingModel, regExp, true);
                }
            }
        }
    }
    class UnfoldAllRegionsAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldAllMarkerRegions',
                label: nls.localize('unfoldAllMarkerRegions.label', "Unfold All Regions"),
                alias: 'Unfold All Regions',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 30 /* KeyCode.Digit9 */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args, languageConfigurationService) {
            if (foldingModel.regions.hasTypes()) {
                (0, foldingModel_1.setCollapseStateForType)(foldingModel, languages_1.FoldingRangeKind.Region.value, false);
            }
            else {
                const editorModel = editor.getModel();
                if (!editorModel) {
                    return;
                }
                const foldingRules = languageConfigurationService.getLanguageConfiguration(editorModel.getLanguageId()).foldingRules;
                if (foldingRules && foldingRules.markers && foldingRules.markers.start) {
                    const regExp = new RegExp(foldingRules.markers.start);
                    (0, foldingModel_1.setCollapseStateForMatchingLines)(foldingModel, regExp, false);
                }
            }
        }
    }
    class FoldAllExceptAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAllExcept',
                label: nls.localize('foldAllExcept.label', "Fold All Except Selected"),
                alias: 'Fold All Except Selected',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 88 /* KeyCode.Minus */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.setCollapseStateForRest)(foldingModel, true, selectedLines);
        }
    }
    class UnfoldAllExceptAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldAllExcept',
                label: nls.localize('unfoldAllExcept.label', "Unfold All Except Selected"),
                alias: 'Unfold All Except Selected',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 86 /* KeyCode.Equal */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.setCollapseStateForRest)(foldingModel, false, selectedLines);
        }
    }
    class FoldAllAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAll',
                label: nls.localize('foldAllAction.label', "Fold All"),
                alias: 'Fold All',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 21 /* KeyCode.Digit0 */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, _editor) {
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true);
        }
    }
    class UnfoldAllAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldAll',
                label: nls.localize('unfoldAllAction.label', "Unfold All"),
                alias: 'Unfold All',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 40 /* KeyCode.KeyJ */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, _editor) {
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false);
        }
    }
    class FoldLevelAction extends FoldingAction {
        static { this.ID_PREFIX = 'editor.foldLevel'; }
        static { this.ID = (level) => FoldLevelAction.ID_PREFIX + level; }
        getFoldingLevel() {
            return parseInt(this.id.substr(FoldLevelAction.ID_PREFIX.length));
        }
        invoke(_foldingController, foldingModel, editor) {
            (0, foldingModel_1.setCollapseStateAtLevel)(foldingModel, this.getFoldingLevel(), true, this.getSelectedLines(editor));
        }
    }
    /** Action to go to the parent fold of current line */
    class GotoParentFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.gotoParentFold',
                label: nls.localize('gotoParentFold.label', "Go to Parent Fold"),
                alias: 'Go to Parent Fold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            if (selectedLines.length > 0) {
                const startLineNumber = (0, foldingModel_1.getParentFoldLine)(selectedLines[0], foldingModel);
                if (startLineNumber !== null) {
                    editor.setSelection({
                        startLineNumber: startLineNumber,
                        startColumn: 1,
                        endLineNumber: startLineNumber,
                        endColumn: 1
                    });
                }
            }
        }
    }
    /** Action to go to the previous fold of current line */
    class GotoPreviousFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.gotoPreviousFold',
                label: nls.localize('gotoPreviousFold.label', "Go to Previous Folding Range"),
                alias: 'Go to Previous Folding Range',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            if (selectedLines.length > 0) {
                const startLineNumber = (0, foldingModel_1.getPreviousFoldLine)(selectedLines[0], foldingModel);
                if (startLineNumber !== null) {
                    editor.setSelection({
                        startLineNumber: startLineNumber,
                        startColumn: 1,
                        endLineNumber: startLineNumber,
                        endColumn: 1
                    });
                }
            }
        }
    }
    /** Action to go to the next fold of current line */
    class GotoNextFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.gotoNextFold',
                label: nls.localize('gotoNextFold.label', "Go to Next Folding Range"),
                alias: 'Go to Next Folding Range',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const selectedLines = this.getSelectedLines(editor);
            if (selectedLines.length > 0) {
                const startLineNumber = (0, foldingModel_1.getNextFoldLine)(selectedLines[0], foldingModel);
                if (startLineNumber !== null) {
                    editor.setSelection({
                        startLineNumber: startLineNumber,
                        startColumn: 1,
                        endLineNumber: startLineNumber,
                        endColumn: 1
                    });
                }
            }
        }
    }
    class FoldRangeFromSelectionAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.createFoldingRangeFromSelection',
                label: nls.localize('createManualFoldRange.label', "Create Folding Range from Selection"),
                alias: 'Create Folding Range from Selection',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 87 /* KeyCode.Comma */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            const collapseRanges = [];
            const selections = editor.getSelections();
            if (selections) {
                for (const selection of selections) {
                    let endLineNumber = selection.endLineNumber;
                    if (selection.endColumn === 1) {
                        --endLineNumber;
                    }
                    if (endLineNumber > selection.startLineNumber) {
                        collapseRanges.push({
                            startLineNumber: selection.startLineNumber,
                            endLineNumber: endLineNumber,
                            type: undefined,
                            isCollapsed: true,
                            source: 1 /* FoldSource.userDefined */
                        });
                        editor.setSelection({
                            startLineNumber: selection.startLineNumber,
                            startColumn: 1,
                            endLineNumber: selection.startLineNumber,
                            endColumn: 1
                        });
                    }
                }
                if (collapseRanges.length > 0) {
                    collapseRanges.sort((a, b) => {
                        return a.startLineNumber - b.startLineNumber;
                    });
                    const newRanges = foldingRanges_1.FoldingRegions.sanitizeAndMerge(foldingModel.regions, collapseRanges, editor.getModel()?.getLineCount());
                    foldingModel.updatePost(foldingRanges_1.FoldingRegions.fromFoldRanges(newRanges));
                }
            }
        }
    }
    class RemoveFoldRangeFromSelectionAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.removeManualFoldingRanges',
                label: nls.localize('removeManualFoldingRanges.label', "Remove Manual Folding Ranges"),
                alias: 'Remove Manual Folding Ranges',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(foldingController, foldingModel, editor) {
            const selections = editor.getSelections();
            if (selections) {
                const ranges = [];
                for (const selection of selections) {
                    const { startLineNumber, endLineNumber } = selection;
                    ranges.push(endLineNumber >= startLineNumber ? { startLineNumber, endLineNumber } : { endLineNumber, startLineNumber });
                }
                foldingModel.removeManualRanges(ranges);
                foldingController.triggerFoldingModelChanged();
            }
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(FoldingController.ID, FoldingController, 0 /* EditorContributionInstantiation.Eager */); // eager because it uses `saveViewState`/`restoreViewState`
    (0, editorExtensions_1.registerEditorAction)(UnfoldAction);
    (0, editorExtensions_1.registerEditorAction)(UnFoldRecursivelyAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAction);
    (0, editorExtensions_1.registerEditorAction)(FoldRecursivelyAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllAction);
    (0, editorExtensions_1.registerEditorAction)(UnfoldAllAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllBlockCommentsAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllRegionsAction);
    (0, editorExtensions_1.registerEditorAction)(UnfoldAllRegionsAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllExceptAction);
    (0, editorExtensions_1.registerEditorAction)(UnfoldAllExceptAction);
    (0, editorExtensions_1.registerEditorAction)(ToggleFoldAction);
    (0, editorExtensions_1.registerEditorAction)(GotoParentFoldAction);
    (0, editorExtensions_1.registerEditorAction)(GotoPreviousFoldAction);
    (0, editorExtensions_1.registerEditorAction)(GotoNextFoldAction);
    (0, editorExtensions_1.registerEditorAction)(FoldRangeFromSelectionAction);
    (0, editorExtensions_1.registerEditorAction)(RemoveFoldRangeFromSelectionAction);
    for (let i = 1; i <= 7; i++) {
        (0, editorExtensions_1.registerInstantiatedEditorAction)(new FoldLevelAction({
            id: FoldLevelAction.ID(i),
            label: nls.localize('foldLevelAction.label', "Fold Level {0}", i),
            alias: `Fold Level ${i}`,
            precondition: CONTEXT_FOLDING_ENABLED,
            kbOpts: {
                kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | (21 /* KeyCode.Digit0 */ + i)),
                weight: 100 /* KeybindingWeight.EditorContrib */
            }
        }));
    }
    commands_1.CommandsRegistry.registerCommand('_executeFoldingRangeProvider', async function (accessor, ...args) {
        const [resource] = args;
        if (!(resource instanceof uri_1.URI)) {
            throw (0, errors_1.illegalArgument)();
        }
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = accessor.get(model_1.IModelService).getModel(resource);
        if (!model) {
            throw (0, errors_1.illegalArgument)();
        }
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        if (!configurationService.getValue('editor.folding', { resource })) {
            return [];
        }
        const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
        const strategy = configurationService.getValue('editor.foldingStrategy', { resource });
        const foldingLimitReporter = {
            get limit() {
                return configurationService.getValue('editor.foldingMaximumRegions', { resource });
            },
            update: (computed, limited) => { }
        };
        const indentRangeProvider = new indentRangeProvider_1.IndentRangeProvider(model, languageConfigurationService, foldingLimitReporter);
        let rangeProvider = indentRangeProvider;
        if (strategy !== 'indentation') {
            const providers = FoldingController.getFoldingRangeProviders(languageFeaturesService, model);
            if (providers.length) {
                rangeProvider = new syntaxRangeProvider_1.SyntaxRangeProvider(model, providers, () => { }, foldingLimitReporter, indentRangeProvider);
            }
        }
        const ranges = await rangeProvider.compute(cancellation_1.CancellationToken.None);
        const result = [];
        try {
            if (ranges) {
                for (let i = 0; i < ranges.length; i++) {
                    const type = ranges.getType(i);
                    result.push({ start: ranges.getStartLineNumber(i), end: ranges.getEndLineNumber(i), kind: type ? languages_1.FoldingRangeKind.fromValue(type) : undefined });
                }
            }
            return result;
        }
        finally {
            rangeProvider.dispose();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2ZvbGRpbmcvYnJvd3Nlci9mb2xkaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5Q2hHLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBc0I3RSxJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHNCQUFVOztpQkFFekIsT0FBRSxHQUFHLHdCQUF3QixBQUEzQixDQUE0QjtRQUU5QyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQ3BDLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBb0IsbUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUlNLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyx1QkFBaUQsRUFBRSxLQUFpQjtZQUMxRyxNQUFNLHFCQUFxQixHQUFHLHVCQUF1QixDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxRixPQUFPLENBQUMsbUJBQWlCLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLHFCQUFxQixDQUFDO1FBQzNHLENBQUM7UUFFTSxNQUFNLENBQUMsK0JBQStCLENBQUMsb0JBQWtEO1lBQy9GLG1CQUFpQixDQUFDLHFCQUFxQixHQUFHLG9CQUFvQixDQUFDO1lBQy9ELE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsbUJBQWlCLENBQUMscUJBQXFCLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDcEYsQ0FBQztRQThCRCxZQUNDLE1BQW1CLEVBQ0MsaUJBQXNE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