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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages", "vs/editor/common/model", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/wordHighlighter/browser/highlightDecorations", "vs/platform/contextkey/common/contextkey", "vs/base/common/network", "vs/base/common/map", "vs/editor/common/languageSelector"], function (require, exports, nls, arrays, aria_1, async_1, cancellation_1, errors_1, lifecycle_1, editorBrowser_1, editorExtensions_1, codeEditorService_1, range_1, editorContextKeys_1, languages_1, model_1, languageFeatures_1, highlightDecorations_1, contextkey_1, network_1, map_1, languageSelector_1) {
    "use strict";
    var WordHighlighter_1, WordHighlighterContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordHighlighterContribution = void 0;
    exports.getOccurrencesAtPosition = getOccurrencesAtPosition;
    exports.getOccurrencesAcrossMultipleModels = getOccurrencesAcrossMultipleModels;
    // import { TextualMultiDocumentHighlightFeature } from 'vs/editor/contrib/wordHighlighter/browser/textualHighlightProvider';
    // import { registerEditorFeature } from 'vs/editor/common/editorFeatures';
    const ctxHasWordHighlights = new contextkey_1.RawContextKey('hasWordHighlights', false);
    function getOccurrencesAtPosition(registry, model, position, token) {
        const orderedByScore = registry.ordered(model);
        // in order of score ask the occurrences provider
        // until someone response with a good result
        // (good = none empty array)
        return (0, async_1.first)(orderedByScore.map(provider => () => {
            return Promise.resolve(provider.provideDocumentHighlights(model, position, token))
                .then(undefined, errors_1.onUnexpectedExternalError);
        }), arrays.isNonEmptyArray).then(result => {
            if (result) {
                const map = new map_1.ResourceMap();
                map.set(model.uri, result);
                return map;
            }
            return new map_1.ResourceMap();
        });
    }
    function getOccurrencesAcrossMultipleModels(registry, model, position, wordSeparators, token, otherModels) {
        const orderedByScore = registry.ordered(model);
        // in order of score ask the occurrences provider
        // until someone response with a good result
        // (good = none empty array)
        return (0, async_1.first)(orderedByScore.map(provider => () => {
            const filteredModels = otherModels.filter(otherModel => {
                return (0, model_1.shouldSynchronizeModel)(otherModel);
            }).filter(otherModel => {
                return (0, languageSelector_1.score)(provider.selector, otherModel.uri, otherModel.getLanguageId(), true, undefined, undefined) > 0;
            });
            return Promise.resolve(provider.provideMultiDocumentHighlights(model, position, filteredModels, token))
                .then(undefined, errors_1.onUnexpectedExternalError);
        }), (t) => t instanceof map_1.ResourceMap && t.size > 0);
    }
    class OccurenceAtPositionRequest {
        constructor(_model, _selection, _wordSeparators) {
            this._model = _model;
            this._selection = _selection;
            this._wordSeparators = _wordSeparators;
            this._wordRange = this._getCurrentWordRange(_model, _selection);
            this._result = null;
        }
        get result() {
            if (!this._result) {
                this._result = (0, async_1.createCancelablePromise)(token => this._compute(this._model, this._selection, this._wordSeparators, token));
            }
            return this._result;
        }
        _getCurrentWordRange(model, selection) {
            const word = model.getWordAtPosition(selection.getPosition());
            if (word) {
                return new range_1.Range(selection.startLineNumber, word.startColumn, selection.startLineNumber, word.endColumn);
            }
            return null;
        }
        isValid(model, selection, decorations) {
            const lineNumber = selection.startLineNumber;
            const startColumn = selection.startColumn;
            const endColumn = selection.endColumn;
            const currentWordRange = this._getCurrentWordRange(model, selection);
            let requestIsValid = Boolean(this._wordRange && this._wordRange.equalsRange(currentWordRange));
            // Even if we are on a different word, if that word is in the decorations ranges, the request is still valid
            // (Same symbol)
            for (let i = 0, len = decorations.length; !requestIsValid && i < len; i++) {
                const range = decorations.getRange(i);
                if (range && range.startLineNumber === lineNumber) {
                    if (range.startColumn <= startColumn && range.endColumn >= endColumn) {
                        requestIsValid = true;
                    }
                }
            }
            return requestIsValid;
        }
        cancel() {
            this.result.cancel();
        }
    }
    class SemanticOccurenceAtPositionRequest extends OccurenceAtPositionRequest {
        constructor(model, selection, wordSeparators, providers) {
            super(model, selection, wordSeparators);
            this._providers = providers;
        }
        _compute(model, selection, wordSeparators, token) {
            return getOccurrencesAtPosition(this._providers, model, selection.getPosition(), token).then(value => {
                if (!value) {
                    return new map_1.ResourceMap();
                }
                return value;
            });
        }
    }
    class MultiModelOccurenceRequest extends OccurenceAtPositionRequest {
        constructor(model, selection, wordSeparators, providers, otherModels) {
            super(model, selection, wordSeparators);
            this._providers = providers;
            this._otherModels = otherModels;
        }
        _compute(model, selection, wordSeparators, token) {
            return getOccurrencesAcrossMultipleModels(this._providers, model, selection.getPosition(), wordSeparators, token, this._otherModels).then(value => {
                if (!value) {
                    return new map_1.ResourceMap();
                }
                return value;
            });
        }
    }
    class TextualOccurenceRequest extends OccurenceAtPositionRequest {
        constructor(model, selection, word, wordSeparators, otherModels) {
            super(model, selection, wordSeparators);
            this._otherModels = otherModels;
            this._selectionIsEmpty = selection.isEmpty();
            this._word = word;
        }
        _compute(model, selection, wordSeparators, token) {
            return (0, async_1.timeout)(250, token).then(() => {
                const result = new map_1.ResourceMap();
                let wordResult;
                if (this._word) {
                    wordResult = this._word;
                }
                else {
                    wordResult = model.getWordAtPosition(selection.getPosition());
                }
                if (!wordResult) {
                    return new map_1.ResourceMap();
                }
                const allModels = [model, ...this._otherModels];
                for (const otherModel of allModels) {
                    if (otherModel.isDisposed()) {
                        continue;
                    }
                    const matches = otherModel.findMatches(wordResult.word, true, false, true, wordSeparators, false);
                    const highlights = matches.map(m => ({
                        range: m.range,
                        kind: languages_1.DocumentHighlightKind.Text
                    }));
                    if (highlights) {
                        result.set(otherModel.uri, highlights);
                    }
                }
                return result;
            });
        }
        isValid(model, selection, decorations) {
            const currentSelectionIsEmpty = selection.isEmpty();
            if (this._selectionIsEmpty !== currentSelectionIsEmpty) {
                return false;
            }
            return super.isValid(model, selection, decorations);
        }
    }
    function computeOccurencesAtPosition(registry, model, selection, word, wordSeparators) {
        if (registry.has(model)) {
            return new SemanticOccurenceAtPositionRequest(model, selection, wordSeparators, registry);
        }
        return new TextualOccurenceRequest(model, selection, word, wordSeparators, []);
    }
    function computeOccurencesMultiModel(registry, model, selection, word, wordSeparators, otherModels) {
        if (registry.has(model)) {
            return new MultiModelOccurenceRequest(model, selection, wordSeparators, registry, otherModels);
        }
        return new TextualOccurenceRequest(model, selection, word, wordSeparators, otherModels);
    }
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeDocumentHighlights', async (accessor, model, position) => {
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const map = await getOccurrencesAtPosition(languageFeaturesService.documentHighlightProvider, model, position, cancellation_1.CancellationToken.None);
        return map?.get(model.uri);
    });
    let WordHighlighter = class WordHighlighter {
        static { WordHighlighter_1 = this; }
        static { this.storedDecorations = new map_1.ResourceMap(); }
        static { this.query = null; }
        constructor(editor, providers, multiProviders, contextKeyService, codeEditorService) {
            this.toUnhook = new lifecycle_1.DisposableStore();
            this.workerRequestTokenId = 0;
            this.workerRequestCompleted = false;
            this.workerRequestValue = new map_1.ResourceMap();
            this.lastCursorPositionChangeTime = 0;
            this.renderDecorationsTimer = -1;
            this.editor = editor;
            this.providers = providers;
            this.multiDocumentProviders = multiProviders;
            this.codeEditorService = codeEditorService;
            this._hasWordHighlights = ctxHasWordHighlights.bindTo(contextKeyService);
            this._ignorePositionChangeEvent = false;
            this.occurrencesHighlight = this.editor.getOption(81 /* EditorOption.occurrencesHighlight */);
            this.model = this.editor.getModel();
            this.toUnhook.add(editor.onDidChangeCursorPosition((e) => {
                if (this._ignorePositionChangeEvent) {
                    // We are changing the position => ignore this event
                    return;
                }
                if (this.occurrencesHighlight === 'off') {
                    // Early exit if nothing needs to be done!
                    // Leave some form of early exit check here if you wish to continue being a cursor position change listener ;)
                    return;
                }
                this._onPositionChanged(e);
            }));
            this.toUnhook.add(editor.onDidFocusEditorText((e) => {
                if (this.occurrencesHighlight === 'off') {
                    // Early exit if nothing needs to be done
                    return;
                }
                if (!this.workerRequest) {
                    this._run();
                }
            }));
            this.toUnhook.add(editor.onDidChangeModelContent((e) => {
                this._stopAll();
            }));
            this.toUnhook.add(editor.onDidChangeModel((e) => {
                if (!e.newModelUrl && e.oldModelUrl) {
                    this._stopSingular();
                }
                else {
                    if (WordHighlighter_1.query) {
                        this._run();
                    }
                }
            }));
            this.toUnhook.add(editor.onDidChangeConfiguration((e) => {
                const newValue = this.editor.getOption(81 /* EditorOption.occurrencesHighlight */);
                if (this.occurrencesHighlight !== newValue) {
                    this.occurrencesHighlight = newValue;
                    this._stopAll();
                }
            }));
            this.decorations = this.editor.createDecorationsCollection();
            this.workerRequestTokenId = 0;
            this.workerRequest = null;
            this.workerRequestCompleted = false;
            this.lastCursorPositionChangeTime = 0;
            this.renderDecorationsTimer = -1;
            // if there is a query already, highlight off that query
            if (WordHighlighter_1.query) {
                this._run();
            }
        }
        hasDecorations() {
            return (this.decorations.length > 0);
        }
        restore() {
            if (this.occurrencesHighlight === 'off') {
                return;
            }
            this._run();
        }
        stop() {
            if (this.occurrencesHighlight === 'off') {
                return;
            }
            this._stopAll();
        }
        _getSortedHighlights() {
            return (this.decorations.getRanges()
                .sort(range_1.Range.compareRangesUsingStarts));
        }
        moveNext() {
            const highlights = this._getSortedHighlights();
            const index = highlights.findIndex((range) => range.containsPosition(this.editor.getPosition()));
            const newIndex = ((index + 1) % highlights.length);
            const dest = highlights[newIndex];
            try {
                this._ignorePositionChangeEvent = true;
                this.editor.setPosition(dest.getStartPosition());
                this.editor.revealRangeInCenterIfOutsideViewport(dest);
                const word = this._getWord();
                if (word) {
                    const lineContent = this.editor.getModel().getLineContent(dest.startLineNumber);
                    (0, aria_1.alert)(`${lineContent}, ${newIndex + 1} of ${highlights.length} for '${word.word}'`);
                }
            }
            finally {
                this._ignorePositionChangeEvent = false;
            }
        }
        moveBack() {
            const highlights = this._getSortedHighlights();
            const index = highlights.findIndex((range) => range.containsPosition(this.editor.getPosition()));
            const newIndex = ((index - 1 + highlights.length) % highlights.length);
            const dest = highlights[newIndex];
            try {
                this._ignorePositionChangeEvent = true;
                this.editor.setPosition(dest.getStartPosition());
                this.editor.revealRangeInCenterIfOutsideViewport(dest);
                const word = this._getWord();
                if (word) {
                    const lineContent = this.editor.getModel().getLineContent(dest.startLineNumber);
                    (0, aria_1.alert)(`${lineContent}, ${newIndex + 1} of ${highlights.length} for '${word.word}'`);
                }
            }
            finally {
                this._ignorePositionChangeEvent = false;
            }
        }
        _removeSingleDecorations() {
            // return if no model
            if (!this.editor.hasModel()) {
                return;
            }
            const currentDecorationIDs = WordHighlighter_1.storedDecorations.get(this.editor.getModel().uri);
            if (!currentDecorationIDs) {
                return;
            }
            this.editor.removeDecorations(currentDecorationIDs);
            WordHighlighter_1.storedDecorations.delete(this.editor.getModel().uri);
            if (this.decorations.length > 0) {
                this.decorations.clear();
                this._hasWordHighlights.set(false);
            }
        }
        _removeAllDecorations() {
            const currentEditors = this.codeEditorService.listCodeEditors();
            const deleteURI = [];
            // iterate over editors and store models in currentModels
            for (const editor of currentEditors) {
                if (!editor.hasModel()) {
                    continue;
                }
                const currentDecorationIDs = WordHighlighter_1.storedDecorations.get(editor.getModel().uri);
                if (!currentDecorationIDs) {
                    continue;
                }
                editor.removeDecorations(currentDecorationIDs);
                deleteURI.push(editor.getModel().uri);
                const editorHighlighterContrib = WordHighlighterContribution.get(editor);
                if (!editorHighlighterContrib?.wordHighlighter) {
                    continue;
                }
                if (editorHighlighterContrib.wordHighlighter.decorations.length > 0) {
                    editorHighlighterContrib.wordHighlighter.decorations.clear();
                    editorHighlighterContrib.wordHighlighter.workerRequest = null;
                    editorHighlighterContrib.wordHighlighter._hasWordHighlights.set(false);
                }
            }
            for (const uri of deleteURI) {
                WordHighlighter_1.storedDecorations.delete(uri);
            }
        }
        _stopSingular() {
            // Remove any existing decorations + a possible query, and re - run to update decorations
            this._removeSingleDecorations();
            if (this.editor.hasTextFocus()) {
                if (this.editor.getModel()?.uri.scheme !== network_1.Schemas.vscodeNotebookCell && WordHighlighter_1.query?.modelInfo?.model.uri.scheme !== network_1.Schemas.vscodeNotebookCell) { // clear query if focused non-nb editor
                    WordHighlighter_1.query = null;
                    this._run(); // TODO: @Yoyokrazy -- investigate why we need a full rerun here. likely addressed a case/patch in the first iteration of this feature
                }
                else { // remove modelInfo to account for nb cell being disposed
                    if (WordHighlighter_1.query?.modelInfo) {
                        WordHighlighter_1.query.modelInfo = null;
                    }
                }
            }
            // Cancel any renderDecorationsTimer
            if (this.renderDecorationsTimer !== -1) {
                clearTimeout(this.renderDecorationsTimer);
                this.renderDecorationsTimer = -1;
            }
            // Cancel any worker request
            if (this.workerRequest !== null) {
                this.workerRequest.cancel();
                this.workerRequest = null;
            }
            // Invalidate any worker request callback
            if (!this.workerRequestCompleted) {
                this.workerRequestTokenId++;
                this.workerRequestCompleted = true;
            }
        }
        _stopAll() {
            // Remove any existing decorations
            // TODO: @Yoyokrazy -- this triggers as notebooks scroll, causing highlights to disappear momentarily.
            // maybe a nb type check?
            this._removeAllDecorations();
            // Cancel any renderDecorationsTimer
            if (this.renderDecorationsTimer !== -1) {
                clearTimeout(this.renderDecorationsTimer);
                this.renderDecorationsTimer = -1;
            }
            // Cancel any worker request
            if (this.workerRequest !== null) {
                this.workerRequest.cancel();
                this.workerRequest = null;
            }
            // Invalidate any worker request callback
            if (!this.workerRequestCompleted) {
                this.workerRequestTokenId++;
                this.workerRequestCompleted = true;
            }
        }
        _onPositionChanged(e) {
            // disabled
            if (this.occurrencesHighlight === 'off') {
                this._stopAll();
                return;
            }
            // ignore typing & other
            // need to check if the model is a notebook cell, should not stop if nb
            if (e.reason !== 3 /* CursorChangeReason.Explicit */ && this.editor.getModel()?.uri.scheme !== network_1.Schemas.vscodeNotebookCell) {
                this._stopAll();
                return;
            }
            this._run();
        }
        _getWord() {
            const editorSelection = this.editor.getSelection();
            const lineNumber = editorSelection.startLineNumber;
            const startColumn = editorSelection.startColumn;
            if (this.model.isDisposed()) {
                return null;
            }
            return this.model.getWordAtPosition({
                lineNumber: lineNumber,
                column: startColumn
            });
        }
        getOtherModelsToHighlight(model) {
            if (!model) {
                return [];
            }
            // notebook case
            const isNotebookEditor = model.uri.scheme === network_1.Schemas.vscodeNotebookCell;
            if (isNotebookEditor) {
                const currentModels = [];
                const currentEditors = this.codeEditorService.listCodeEditors();
                for (const editor of currentEditors) {
                    const tempModel = editor.getModel();
                    if (tempModel && tempModel !== model && tempModel.uri.scheme === network_1.Schemas.vscodeNotebookCell) {
                        currentModels.push(tempModel);
                    }
                }
                return currentModels;
            }
            // inline case
            // ? current works when highlighting outside of an inline diff, highlighting in.
            // ? broken when highlighting within a diff editor. highlighting the main editor does not work
            // ? editor group service could be useful here
            const currentModels = [];
            const currentEditors = this.codeEditorService.listCodeEditors();
            for (const editor of currentEditors) {
                if (!(0, editorBrowser_1.isDiffEditor)(editor)) {
                    continue;
                }
                const diffModel = editor.getModel();
                if (!diffModel) {
                    continue;
                }
                if (model === diffModel.modified) { // embedded inline chat diff would pass this, allowing highlights
                    //? currentModels.push(diffModel.original);
                    currentModels.push(diffModel.modified);
                }
            }
            if (currentModels.length) { // no matching editors have been found
                return currentModels;
            }
            // multi-doc OFF
            if (this.occurrencesHighlight === 'singleFile') {
                return [];
            }
            // multi-doc ON
            for (const editor of currentEditors) {
                const tempModel = editor.getModel();
                const isValidModel = tempModel && tempModel !== model;
                if (isValidModel) {
                    currentModels.push(tempModel);
                }
            }
            return currentModels;
        }
        _run() {
            let workerRequestIsValid;
            const hasTextFocus = this.editor.hasTextFocus();
            if (!hasTextFocus) { // new nb cell scrolled in, didChangeModel fires
                if (!WordHighlighter_1.query) { // no previous query, nothing to highlight off of
                    return;
                }
            }
            else { // has text focus
                const editorSelection = this.editor.getSelection();
                // ignore multiline selection
                if (!editorSelection || editorSelection.startLineNumber !== editorSelection.endLineNumber) {
                    WordHighlighter_1.query = null;
                    this._stopAll();
                    return;
                }
                const startColumn = editorSelection.startColumn;
                const endColumn = editorSelection.endColumn;
                const word = this._getWord();
                // The selection must be inside a word or surround one word at most
                if (!word || word.startColumn > startColumn || word.endColumn < endColumn) {
                    // no previous query, nothing to highlight
                    WordHighlighter_1.query = null;
                    this._stopAll();
                    return;
                }
                // All the effort below is trying to achieve this:
                // - when cursor is moved to a word, trigger immediately a findOccurrences request
                // - 250ms later after the last cursor move event, render the occurrences
                // - no flickering!
                workerRequestIsValid = (this.workerRequest && this.workerRequest.isValid(this.model, editorSelection, this.decorations));
                WordHighlighter_1.query = {
                    modelInfo: {
                        model: this.model,
                        selection: editorSelection,
                    },
                    word: word
                };
            }
            // There are 4 cases:
            // a) old workerRequest is valid & completed, renderDecorationsTimer fired
            // b) old workerRequest is valid & completed, renderDecorationsTimer not fired
            // c) old workerRequest is valid, but not completed
            // d) old workerRequest is not valid
            // For a) no action is needed
            // For c), member 'lastCursorPositionChangeTime' will be used when installing the timer so no action is needed
            this.lastCursorPositionChangeTime = (new Date()).getTime();
            if (workerRequestIsValid) {
                if (this.workerRequestCompleted && this.renderDecorationsTimer !== -1) {
                    // case b)
                    // Delay the firing of renderDecorationsTimer by an extra 250 ms
                    clearTimeout(this.renderDecorationsTimer);
                    this.renderDecorationsTimer = -1;
                    this._beginRenderDecorations();
                }
            }
            else {
                // case d)
                // Stop all previous actions and start fresh
                this._stopAll();
                const myRequestId = ++this.workerRequestTokenId;
                this.workerRequestCompleted = false;
                const otherModelsToHighlight = this.getOtherModelsToHighlight(this.editor.getModel());
                // when reaching here, there are two possible states.
                // 		1) we have text focus, and a valid query was updated.
                // 		2) we do not have text focus, and a valid query is cached.
                // the query will ALWAYS have the correct data for the current highlight request, so it can always be passed to the workerRequest safely
                if (!WordHighlighter_1.query.modelInfo || WordHighlighter_1.query.modelInfo.model.isDisposed()) {
                    return;
                }
                this.workerRequest = this.computeWithModel(WordHighlighter_1.query.modelInfo.model, WordHighlighter_1.query.modelInfo.selection, WordHighlighter_1.query.word, otherModelsToHighlight);
                this.workerRequest?.result.then(data => {
                    if (myRequestId === this.workerRequestTokenId) {
                        this.workerRequestCompleted = true;
                        this.workerRequestValue = data || [];
                        this._beginRenderDecorations();
                    }
                }, errors_1.onUnexpectedError);
            }
        }
        computeWithModel(model, selection, word, otherModels) {
            if (!otherModels.length) {
                return computeOccurencesAtPosition(this.providers, model, selection, word, this.editor.getOption(131 /* EditorOption.wordSeparators */));
            }
            else {
                return computeOccurencesMultiModel(this.multiDocumentProviders, model, selection, word, this.editor.getOption(131 /* EditorOption.wordSeparators */), otherModels);
            }
        }
        _beginRenderDecorations() {
            const currentTime = (new Date()).getTime();
            const minimumRenderTime = this.lastCursorPositionChangeTime + 250;
            if (currentTime >= minimumRenderTime) {
                // Synchronous
                this.renderDecorationsTimer = -1;
                this.renderDecorations();
            }
            else {
                // Asynchronous
                this.renderDecorationsTimer = setTimeout(() => {
                    this.renderDecorations();
                }, (minimumRenderTime - currentTime));
            }
        }
        renderDecorations() {
            this.renderDecorationsTimer = -1;
            // create new loop, iterate over current editors using this.codeEditorService.listCodeEditors(),
            // if the URI of that codeEditor is in the map, then add the decorations to the decorations array
            // then set the decorations for the editor
            const currentEditors = this.codeEditorService.listCodeEditors();
            for (const editor of currentEditors) {
                const editorHighlighterContrib = WordHighlighterContribution.get(editor);
                if (!editorHighlighterContrib) {
                    continue;
                }
                const newDecorations = [];
                const uri = editor.getModel()?.uri;
                if (uri && this.workerRequestValue.has(uri)) {
                    const oldDecorationIDs = WordHighlighter_1.storedDecorations.get(uri);
                    const newDocumentHighlights = this.workerRequestValue.get(uri);
                    if (newDocumentHighlights) {
                        for (const highlight of newDocumentHighlights) {
                            if (!highlight.range) {
                                continue;
                            }
                            newDecorations.push({
                                range: highlight.range,
                                options: (0, highlightDecorations_1.getHighlightDecorationOptions)(highlight.kind)
                            });
                        }
                    }
                    let newDecorationIDs = [];
                    editor.changeDecorations((changeAccessor) => {
                        newDecorationIDs = changeAccessor.deltaDecorations(oldDecorationIDs ?? [], newDecorations);
                    });
                    WordHighlighter_1.storedDecorations = WordHighlighter_1.storedDecorations.set(uri, newDecorationIDs);
                    if (newDecorations.length > 0) {
                        editorHighlighterContrib.wordHighlighter?.decorations.set(newDecorations);
                        editorHighlighterContrib.wordHighlighter?._hasWordHighlights.set(true);
                    }
                }
            }
        }
        dispose() {
            this._stopSingular();
            this.toUnhook.dispose();
        }
    };
    WordHighlighter = WordHighlighter_1 = __decorate([
        __param(4, codeEditorService_1.ICodeEditorService)
    ], WordHighlighter);
    let WordHighlighterContribution = class WordHighlighterContribution extends lifecycle_1.Disposable {
        static { WordHighlighterContribution_1 = this; }
        static { this.ID = 'editor.contrib.wordHighlighter'; }
        static get(editor) {
            return editor.getContribution(WordHighlighterContribution_1.ID);
        }
        constructor(editor, contextKeyService, languageFeaturesService, codeEditorService) {
            super();
            this._wordHighlighter = null;
            const createWordHighlighterIfPossible = () => {
                if (editor.hasModel() && !editor.getModel().isTooLargeForTokenization()) {
                    this._wordHighlighter = new WordHighlighter(editor, languageFeaturesService.documentHighlightProvider, languageFeaturesService.multiDocumentHighlightProvider, contextKeyService, codeEditorService);
                }
            };
            this._register(editor.onDidChangeModel((e) => {
                if (this._wordHighlighter) {
                    this._wordHighlighter.dispose();
                    this._wordHighlighter = null;
                }
                createWordHighlighterIfPossible();
            }));
            createWordHighlighterIfPossible();
        }
        get wordHighlighter() {
            return this._wordHighlighter;
        }
        saveViewState() {
            if (this._wordHighlighter && this._wordHighlighter.hasDecorations()) {
                return true;
            }
            return false;
        }
        moveNext() {
            this._wordHighlighter?.moveNext();
        }
        moveBack() {
            this._wordHighlighter?.moveBack();
        }
        restoreViewState(state) {
            if (this._wordHighlighter && state) {
                this._wordHighlighter.restore();
            }
        }
        stopHighlighting() {
            this._wordHighlighter?.stop();
        }
        dispose() {
            if (this._wordHighlighter) {
                this._wordHighlighter.dispose();
                this._wordHighlighter = null;
            }
            super.dispose();
        }
    };
    exports.WordHighlighterContribution = WordHighlighterContribution;
    exports.WordHighlighterContribution = WordHighlighterContribution = WordHighlighterContribution_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, codeEditorService_1.ICodeEditorService)
    ], WordHighlighterContribution);
    class WordHighlightNavigationAction extends editorExtensions_1.EditorAction {
        constructor(next, opts) {
            super(opts);
            this._isNext = next;
        }
        run(accessor, editor) {
            const controller = WordHighlighterContribution.get(editor);
            if (!controller) {
                return;
            }
            if (this._isNext) {
                controller.moveNext();
            }
            else {
                controller.moveBack();
            }
        }
    }
    class NextWordHighlightAction extends WordHighlightNavigationAction {
        constructor() {
            super(true, {
                id: 'editor.action.wordHighlight.next',
                label: nls.localize('wordHighlight.next.label', "Go to Next Symbol Highlight"),
                alias: 'Go to Next Symbol Highlight',
                precondition: ctxHasWordHighlights,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 65 /* KeyCode.F7 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    class PrevWordHighlightAction extends WordHighlightNavigationAction {
        constructor() {
            super(false, {
                id: 'editor.action.wordHighlight.prev',
                label: nls.localize('wordHighlight.previous.label', "Go to Previous Symbol Highlight"),
                alias: 'Go to Previous Symbol Highlight',
                precondition: ctxHasWordHighlights,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 65 /* KeyCode.F7 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    class TriggerWordHighlightAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.wordHighlight.trigger',
                label: nls.localize('wordHighlight.trigger.label', "Trigger Symbol Highlight"),
                alias: 'Trigger Symbol Highlight',
                precondition: ctxHasWordHighlights.toNegated(),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 0,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor, args) {
            const controller = WordHighlighterContribution.get(editor);
            if (!controller) {
                return;
            }
            controller.restoreViewState(true);
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(WordHighlighterContribution.ID, WordHighlighterContribution, 0 /* EditorContributionInstantiation.Eager */); // eager because it uses `saveViewState`/`restoreViewState`
    (0, editorExtensions_1.registerEditorAction)(NextWordHighlightAction);
    (0, editorExtensions_1.registerEditorAction)(PrevWordHighlightAction);
    (0, editorExtensions_1.registerEditorAction)(TriggerWordHighlightAction);
});
// registerEditorFeature(TextualMultiDocumentHighlightFeature);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZEhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvd29yZEhpZ2hsaWdodGVyL2Jyb3dzZXIvd29yZEhpZ2hsaWdodGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxQ2hHLDREQWlCQztJQUVELGdGQWdCQztJQXhDRCw2SEFBNkg7SUFDN0gsMkVBQTJFO0lBRTNFLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSwwQkFBYSxDQUFVLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXBGLFNBQWdCLHdCQUF3QixDQUFDLFFBQTRELEVBQUUsS0FBaUIsRUFBRSxRQUFrQixFQUFFLEtBQXdCO1FBQ3JLLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFL0MsaURBQWlEO1FBQ2pELDRDQUE0QztRQUM1Qyw0QkFBNEI7UUFDNUIsT0FBTyxJQUFBLGFBQUssRUFBeUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRTtZQUN4RixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLHlCQUF5QixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7aUJBQ2hGLElBQUksQ0FBQyxTQUFTLEVBQUUsa0NBQXlCLENBQUMsQ0FBQztRQUM5QyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3pDLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBVyxFQUF1QixDQUFDO2dCQUNuRCxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzNCLE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztZQUNELE9BQU8sSUFBSSxpQkFBVyxFQUF1QixDQUFDO1FBQy9DLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELFNBQWdCLGtDQUFrQyxDQUFDLFFBQWlFLEVBQUUsS0FBaUIsRUFBRSxRQUFrQixFQUFFLGNBQXNCLEVBQUUsS0FBd0IsRUFBRSxXQUF5QjtRQUN2TyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRS9DLGlEQUFpRDtRQUNqRCw0Q0FBNEM7UUFDNUMsNEJBQTRCO1FBQzVCLE9BQU8sSUFBQSxhQUFLLEVBQXNELGNBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUU7WUFDckcsTUFBTSxjQUFjLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDdEQsT0FBTyxJQUFBLDhCQUFzQixFQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzNDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDdEIsT0FBTyxJQUFBLHdCQUFLLEVBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxhQUFhLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3RyxDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsOEJBQThCLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7aUJBQ3JHLElBQUksQ0FBQyxTQUFTLEVBQUUsa0NBQXlCLENBQUMsQ0FBQztRQUM5QyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQXNELEVBQXlDLEVBQUUsQ0FBQyxDQUFDLFlBQVksaUJBQVcsSUFBSSxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2hKLENBQUM7SUFnQkQsTUFBZSwwQkFBMEI7UUFLeEMsWUFBNkIsTUFBa0IsRUFBbUIsVUFBcUIsRUFBbUIsZUFBdUI7WUFBcEcsV0FBTSxHQUFOLE1BQU0sQ0FBWTtZQUFtQixlQUFVLEdBQVYsVUFBVSxDQUFXO1lBQW1CLG9CQUFlLEdBQWYsZUFBZSxDQUFRO1lBQ2hJLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNyQixDQUFDO1FBRUQsSUFBSSxNQUFNO1lBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLCtCQUF1QixFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzNILENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUlPLG9CQUFvQixDQUFDLEtBQWlCLEVBQUUsU0FBb0I7WUFDbkUsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQzlELElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsT0FBTyxJQUFJLGFBQUssQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDMUcsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVNLE9BQU8sQ0FBQyxLQUFpQixFQUFFLFNBQW9CLEVBQUUsV0FBeUM7WUFFaEcsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQztZQUM3QyxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFDO1lBQzFDLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUM7WUFDdEMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXJFLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUUvRiw0R0FBNEc7WUFDNUcsZ0JBQWdCO1lBQ2hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsY0FBYyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDM0UsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLGVBQWUsS0FBSyxVQUFVLEVBQUUsQ0FBQztvQkFDbkQsSUFBSSxLQUFLLENBQUMsV0FBVyxJQUFJLFdBQVcsSUFBSSxLQUFLLENBQUMsU0FBUyxJQUFJLFNBQVMsRUFBRSxDQUFDO3dCQUN0RSxjQUFjLEdBQUcsSUFBSSxDQUFDO29CQUN2QixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxjQUFjLENBQUM7UUFDdkIsQ0FBQztRQUVNLE1BQU07WUFDWixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3RCLENBQUM7S0FDRDtJQUVELE1BQU0sa0NBQW1DLFNBQVEsMEJBQTBCO1FBSTFFLFlBQVksS0FBaUIsRUFBRSxTQUFvQixFQUFFLGNBQXNCLEVBQUUsU0FBNkQ7WUFDekksS0FBSyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7UUFDN0IsQ0FBQztRQUVTLFFBQVEsQ0FBQyxLQUFpQixFQUFFLFNBQW9CLEVBQUUsY0FBc0IsRUFBRSxLQUF3QjtZQUMzRyxPQUFPLHdCQUF3QixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ3BHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDWixPQUFPLElBQUksaUJBQVcsRUFBdUIsQ0FBQztnQkFDL0MsQ0FBQztnQkFDRCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBRUQsTUFBTSwwQkFBMkIsU0FBUSwwQkFBMEI7UUFJbEUsWUFBWSxLQUFpQixFQUFFLFNBQW9CLEVBQUUsY0FBc0IsRUFBRSxTQUFrRSxFQUFFLFdBQXlCO1lBQ3pLLEtBQUssQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1FBQ2pDLENBQUM7UUFFa0IsUUFBUSxDQUFDLEtBQWlCLEVBQUUsU0FBb0IsRUFBRSxjQUFzQixFQUFFLEtBQXdCO1lBQ3BILE9BQU8sa0NBQWtDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLFdBQVcsRUFBRSxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDakosSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNaLE9BQU8sSUFBSSxpQkFBVyxFQUF1QixDQUFDO2dCQUMvQyxDQUFDO2dCQUNELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFFRCxNQUFNLHVCQUF3QixTQUFRLDBCQUEwQjtRQU0vRCxZQUFZLEtBQWlCLEVBQUUsU0FBb0IsRUFBRSxJQUE0QixFQUFFLGNBQXNCLEVBQUUsV0FBeUI7WUFDbkksS0FBSyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7WUFDaEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM3QyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNuQixDQUFDO1FBRVMsUUFBUSxDQUFDLEtBQWlCLEVBQUUsU0FBb0IsRUFBRSxjQUFzQixFQUFFLEtBQXdCO1lBQzNHLE9BQU8sSUFBQSxlQUFPLEVBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ3BDLE1BQU0sTUFBTSxHQUFHLElBQUksaUJBQVcsRUFBdUIsQ0FBQztnQkFFdEQsSUFBSSxVQUFVLENBQUM7Z0JBQ2YsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2hCLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUN6QixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsVUFBVSxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztnQkFDL0QsQ0FBQztnQkFFRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ2pCLE9BQU8sSUFBSSxpQkFBVyxFQUF1QixDQUFDO2dCQUMvQyxDQUFDO2dCQUVELE1BQU0sU0FBUyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUVoRCxLQUFLLE1BQU0sVUFBVSxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUNwQyxJQUFJLFVBQVUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO3dCQUM3QixTQUFTO29CQUNWLENBQUM7b0JBRUQsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDbEcsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQ3BDLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSzt3QkFDZCxJQUFJLEVBQUUsaUNBQXFCLENBQUMsSUFBSTtxQkFDaEMsQ0FBQyxDQUFDLENBQUM7b0JBRUosSUFBSSxVQUFVLEVBQUUsQ0FBQzt3QkFDaEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUN4QyxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFZSxPQUFPLENBQUMsS0FBaUIsRUFBRSxTQUFvQixFQUFFLFdBQXlDO1lBQ3pHLE1BQU0sdUJBQXVCLEdBQUcsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BELElBQUksSUFBSSxDQUFDLGlCQUFpQixLQUFLLHVCQUF1QixFQUFFLENBQUM7Z0JBQ3hELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3JELENBQUM7S0FDRDtJQUVELFNBQVMsMkJBQTJCLENBQUMsUUFBNEQsRUFBRSxLQUFpQixFQUFFLFNBQW9CLEVBQUUsSUFBNEIsRUFBRSxjQUFzQjtRQUMvTCxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN6QixPQUFPLElBQUksa0NBQWtDLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDM0YsQ0FBQztRQUNELE9BQU8sSUFBSSx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDaEYsQ0FBQztJQUVELFNBQVMsMkJBQTJCLENBQUMsUUFBaUUsRUFBRSxLQUFpQixFQUFFLFNBQW9CLEVBQUUsSUFBNEIsRUFBRSxjQUFzQixFQUFFLFdBQXlCO1FBQy9OLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3pCLE9BQU8sSUFBSSwwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDaEcsQ0FBQztRQUNELE9BQU8sSUFBSSx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDekYsQ0FBQztJQUVELElBQUEsa0RBQStCLEVBQUMsNEJBQTRCLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDakcsTUFBTSx1QkFBdUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJDQUF3QixDQUFDLENBQUM7UUFDdkUsTUFBTSxHQUFHLEdBQUcsTUFBTSx3QkFBd0IsQ0FBQyx1QkFBdUIsQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZJLE9BQU8sR0FBRyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFlOztpQkFzQkwsc0JBQWlCLEdBQTBCLElBQUksaUJBQVcsRUFBRSxBQUEzQyxDQUE0QztpQkFDN0QsVUFBSyxHQUFpQyxJQUFJLEFBQXJDLENBQXNDO1FBRTFELFlBQVksTUFBeUIsRUFBRSxTQUE2RCxFQUFFLGNBQXVFLEVBQUUsaUJBQXFDLEVBQXNCLGlCQUFxQztZQWpCOVAsYUFBUSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRzFDLHlCQUFvQixHQUFXLENBQUMsQ0FBQztZQUVqQywyQkFBc0IsR0FBWSxLQUFLLENBQUM7WUFDeEMsdUJBQWtCLEdBQXFDLElBQUksaUJBQVcsRUFBRSxDQUFDO1lBRXpFLGlDQUE0QixHQUFXLENBQUMsQ0FBQztZQUN6QywyQkFBc0IsR0FBUSxDQUFDLENBQUMsQ0FBQztZQVN4QyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUMzQixJQUFJLENBQUMsc0JBQXNCLEdBQUcsY0FBYyxDQUFDO1lBQzdDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztZQUMzQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsb0JBQW9CLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDekUsSUFBSSxDQUFDLDBCQUEwQixHQUFHLEtBQUssQ0FBQztZQUN4QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLDRDQUFtQyxDQUFDO1lBQ3JGLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUE4QixFQUFFLEVBQUU7Z0JBQ3JGLElBQUksSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7b0JBQ3JDLG9EQUFvRDtvQkFDcEQsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksSUFBSSxDQUFDLG9CQUFvQixLQUFLLEtBQUssRUFBRSxDQUFDO29CQUN6QywwQ0FBMEM7b0JBQzFDLDhHQUE4RztvQkFDOUcsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25ELElBQUksSUFBSSxDQUFDLG9CQUFvQixLQUFLLEtBQUssRUFBRSxDQUFDO29CQUN6Qyx5Q0FBeUM7b0JBQ3pDLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDdEQsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDL0MsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNyQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3RCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLGlCQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQzNCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDYixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3ZELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyw0Q0FBbUMsQ0FBQztnQkFDMUUsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQzVDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxRQUFRLENBQUM7b0JBQ3JDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDakIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQUM3RCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1lBQzFCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUM7WUFFcEMsSUFBSSxDQUFDLDRCQUE0QixHQUFHLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFakMsd0RBQXdEO1lBQ3hELElBQUksaUJBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUM7UUFFTSxjQUFjO1lBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRU0sT0FBTztZQUNiLElBQUksSUFBSSxDQUFDLG9CQUFvQixLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUN6QyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNiLENBQUM7UUFFTSxJQUFJO1lBQ1YsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ3pDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFTyxvQkFBb0I7WUFDM0IsT0FBTyxDQUNOLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFO2lCQUMxQixJQUFJLENBQUMsYUFBSyxDQUFDLHdCQUF3QixDQUFDLENBQ3RDLENBQUM7UUFDSCxDQUFDO1FBRU0sUUFBUTtZQUNkLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQy9DLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRCxNQUFNLElBQUksR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQywwQkFBMEIsR0FBRyxJQUFJLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxNQUFNLENBQUMsb0NBQW9DLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDVixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ2hGLElBQUEsWUFBSyxFQUFDLEdBQUcsV0FBVyxLQUFLLFFBQVEsR0FBRyxDQUFDLE9BQU8sVUFBVSxDQUFDLE1BQU0sU0FBUyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztnQkFDckYsQ0FBQztZQUNGLENBQUM7b0JBQVMsQ0FBQztnQkFDVixJQUFJLENBQUMsMEJBQTBCLEdBQUcsS0FBSyxDQUFDO1lBQ3pDLENBQUM7UUFDRixDQUFDO1FBRU0sUUFBUTtZQUNkLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQy9DLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUM7Z0JBQ0osSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQztnQkFDdkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQztnQkFDakQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQ0FBb0MsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM3QixJQUFJLElBQUksRUFBRSxDQUFDO29CQUNWLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDaEYsSUFBQSxZQUFLLEVBQUMsR0FBRyxXQUFXLEtBQUssUUFBUSxHQUFHLENBQUMsT0FBTyxVQUFVLENBQUMsTUFBTSxTQUFTLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO2dCQUNyRixDQUFDO1lBQ0YsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLElBQUksQ0FBQywwQkFBMEIsR0FBRyxLQUFLLENBQUM7WUFDekMsQ0FBQztRQUNGLENBQUM7UUFFTyx3QkFBd0I7WUFDL0IscUJBQXFCO1lBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQzdCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxvQkFBb0IsR0FBRyxpQkFBZSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQy9GLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUMzQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNwRCxpQkFBZSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXJFLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsQ0FBQztRQUNGLENBQUM7UUFFTyxxQkFBcUI7WUFDNUIsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ2hFLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNyQix5REFBeUQ7WUFDekQsS0FBSyxNQUFNLE1BQU0sSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUN4QixTQUFTO2dCQUNWLENBQUM7Z0JBRUQsTUFBTSxvQkFBb0IsR0FBRyxpQkFBZSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzFGLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO29CQUMzQixTQUFTO2dCQUNWLENBQUM7Z0JBRUQsTUFBTSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBQy9DLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUV0QyxNQUFNLHdCQUF3QixHQUFHLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDekUsSUFBSSxDQUFDLHdCQUF3QixFQUFFLGVBQWUsRUFBRSxDQUFDO29CQUNoRCxTQUFTO2dCQUNWLENBQUM7Z0JBRUQsSUFBSSx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDckUsd0JBQXdCLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDN0Qsd0JBQXdCLENBQUMsZUFBZSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7b0JBQzlELHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hFLENBQUM7WUFDRixDQUFDO1lBRUQsS0FBSyxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDN0IsaUJBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDL0MsQ0FBQztRQUNGLENBQUM7UUFFTyxhQUFhO1lBQ3BCLHlGQUF5RjtZQUN6RixJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUVoQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxrQkFBa0IsSUFBSSxpQkFBZSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsdUNBQXVDO29CQUNwTSxpQkFBZSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7b0JBQzdCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLHNJQUFzSTtnQkFDcEosQ0FBQztxQkFBTSxDQUFDLENBQUMseURBQXlEO29CQUNqRSxJQUFJLGlCQUFlLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDO3dCQUN0QyxpQkFBZSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO29CQUN4QyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsb0NBQW9DO1lBQ3BDLElBQUksSUFBSSxDQUFDLHNCQUFzQixLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLFlBQVksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7WUFFRCw0QkFBNEI7WUFDNUIsSUFBSSxJQUFJLENBQUMsYUFBYSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUMzQixDQUFDO1lBRUQseUNBQXlDO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7WUFDcEMsQ0FBQztRQUNGLENBQUM7UUFFTyxRQUFRO1lBQ2Ysa0NBQWtDO1lBQ2xDLHNHQUFzRztZQUN0Ryx5QkFBeUI7WUFDekIsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFFN0Isb0NBQW9DO1lBQ3BDLElBQUksSUFBSSxDQUFDLHNCQUFzQixLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLFlBQVksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7WUFFRCw0QkFBNEI7WUFDNUIsSUFBSSxJQUFJLENBQUMsYUFBYSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUMzQixDQUFDO1lBRUQseUNBQXlDO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7WUFDcEMsQ0FBQztRQUNGLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxDQUE4QjtZQUV4RCxXQUFXO1lBQ1gsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ3pDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDaEIsT0FBTztZQUNSLENBQUM7WUFFRCx3QkFBd0I7WUFDeEIsdUVBQXVFO1lBQ3ZFLElBQUksQ0FBQyxDQUFDLE1BQU0sd0NBQWdDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDbkgsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNoQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNiLENBQUM7UUFFTyxRQUFRO1lBQ2YsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNuRCxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMsZUFBZSxDQUFDO1lBQ25ELE1BQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQyxXQUFXLENBQUM7WUFFaEQsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztnQkFDbkMsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLE1BQU0sRUFBRSxXQUFXO2FBQ25CLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyx5QkFBeUIsQ0FBQyxLQUFpQjtZQUNsRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsZ0JBQWdCO1lBQ2hCLE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQztZQUN6RSxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sYUFBYSxHQUFpQixFQUFFLENBQUM7Z0JBQ3ZDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDaEUsS0FBSyxNQUFNLE1BQU0sSUFBSSxjQUFjLEVBQUUsQ0FBQztvQkFDckMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNwQyxJQUFJLFNBQVMsSUFBSSxTQUFTLEtBQUssS0FBSyxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQzt3QkFDN0YsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDL0IsQ0FBQztnQkFDRixDQUFDO2dCQUNELE9BQU8sYUFBYSxDQUFDO1lBQ3RCLENBQUM7WUFFRCxjQUFjO1lBQ2QsZ0ZBQWdGO1lBQ2hGLDhGQUE4RjtZQUM5Riw4Q0FBOEM7WUFDOUMsTUFBTSxhQUFhLEdBQWlCLEVBQUUsQ0FBQztZQUN2QyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDaEUsS0FBSyxNQUFNLE1BQU0sSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLElBQUEsNEJBQVksRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUMzQixTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsTUFBTSxTQUFTLEdBQUksTUFBc0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDckQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNoQixTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsSUFBSSxLQUFLLEtBQUssU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsaUVBQWlFO29CQUNwRywyQ0FBMkM7b0JBQzNDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN4QyxDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsc0NBQXNDO2dCQUNqRSxPQUFPLGFBQWEsQ0FBQztZQUN0QixDQUFDO1lBRUQsZ0JBQWdCO1lBQ2hCLElBQUksSUFBSSxDQUFDLG9CQUFvQixLQUFLLFlBQVksRUFBRSxDQUFDO2dCQUNoRCxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxlQUFlO1lBQ2YsS0FBSyxNQUFNLE1BQU0sSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUVwQyxNQUFNLFlBQVksR0FBRyxTQUFTLElBQUksU0FBUyxLQUFLLEtBQUssQ0FBQztnQkFFdEQsSUFBSSxZQUFZLEVBQUUsQ0FBQztvQkFDbEIsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDL0IsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLGFBQWEsQ0FBQztRQUN0QixDQUFDO1FBRU8sSUFBSTtZQUVYLElBQUksb0JBQW9CLENBQUM7WUFDekIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUVoRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxnREFBZ0Q7Z0JBQ3BFLElBQUksQ0FBQyxpQkFBZSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsaURBQWlEO29CQUM5RSxPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUMsQ0FBQyxpQkFBaUI7Z0JBQ3pCLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBRW5ELDZCQUE2QjtnQkFDN0IsSUFBSSxDQUFDLGVBQWUsSUFBSSxlQUFlLENBQUMsZUFBZSxLQUFLLGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDM0YsaUJBQWUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO29CQUM3QixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2hCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsV0FBVyxDQUFDO2dCQUNoRCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDO2dCQUU1QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBRTdCLG1FQUFtRTtnQkFDbkUsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsRUFBRSxDQUFDO29CQUMzRSwwQ0FBMEM7b0JBQzFDLGlCQUFlLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztvQkFDN0IsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNoQixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsa0RBQWtEO2dCQUNsRCxrRkFBa0Y7Z0JBQ2xGLHlFQUF5RTtnQkFDekUsbUJBQW1CO2dCQUNuQixvQkFBb0IsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBRXpILGlCQUFlLENBQUMsS0FBSyxHQUFHO29CQUN2QixTQUFTLEVBQUU7d0JBQ1YsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO3dCQUNqQixTQUFTLEVBQUUsZUFBZTtxQkFDMUI7b0JBQ0QsSUFBSSxFQUFFLElBQUk7aUJBQ1YsQ0FBQztZQUNILENBQUM7WUFFRCxxQkFBcUI7WUFDckIsMEVBQTBFO1lBQzFFLDhFQUE4RTtZQUM5RSxtREFBbUQ7WUFDbkQsb0NBQW9DO1lBRXBDLDZCQUE2QjtZQUM3Qiw4R0FBOEc7WUFFOUcsSUFBSSxDQUFDLDRCQUE0QixHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRTNELElBQUksb0JBQW9CLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxJQUFJLENBQUMsc0JBQXNCLElBQUksSUFBSSxDQUFDLHNCQUFzQixLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZFLFVBQVU7b0JBQ1YsZ0VBQWdFO29CQUNoRSxZQUFZLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7b0JBQzFDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDakMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQ2hDLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsVUFBVTtnQkFDViw0Q0FBNEM7Z0JBQzVDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFFaEIsTUFBTSxXQUFXLEdBQUcsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUM7Z0JBRXBDLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFFdEYscURBQXFEO2dCQUNyRCwwREFBMEQ7Z0JBQzFELCtEQUErRDtnQkFDL0Qsd0lBQXdJO2dCQUN4SSxJQUFJLENBQUMsaUJBQWUsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLGlCQUFlLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztvQkFDNUYsT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFlLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsaUJBQWUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxpQkFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztnQkFFakwsSUFBSSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN0QyxJQUFJLFdBQVcsS0FBSyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQzt3QkFDL0MsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQzt3QkFDbkMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7d0JBQ3JDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUNoQyxDQUFDO2dCQUNGLENBQUMsRUFBRSwwQkFBaUIsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDO1FBRU8sZ0JBQWdCLENBQUMsS0FBaUIsRUFBRSxTQUFvQixFQUFFLElBQTRCLEVBQUUsV0FBeUI7WUFDeEgsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDekIsT0FBTywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyx1Q0FBNkIsQ0FBQyxDQUFDO1lBQ2hJLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLDJCQUEyQixDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsdUNBQTZCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDMUosQ0FBQztRQUNGLENBQUM7UUFFTyx1QkFBdUI7WUFDOUIsTUFBTSxXQUFXLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDM0MsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsNEJBQTRCLEdBQUcsR0FBRyxDQUFDO1lBRWxFLElBQUksV0FBVyxJQUFJLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3RDLGNBQWM7Z0JBQ2QsSUFBSSxDQUFDLHNCQUFzQixHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUMxQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsZUFBZTtnQkFDZixJQUFJLENBQUMsc0JBQXNCLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtvQkFDN0MsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzFCLENBQUMsRUFBRSxDQUFDLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDdkMsQ0FBQztRQUNGLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLHNCQUFzQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLGdHQUFnRztZQUNoRyxpR0FBaUc7WUFDakcsMENBQTBDO1lBQzFDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNoRSxLQUFLLE1BQU0sTUFBTSxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUNyQyxNQUFNLHdCQUF3QixHQUFHLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDekUsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7b0JBQy9CLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCxNQUFNLGNBQWMsR0FBNEIsRUFBRSxDQUFDO2dCQUNuRCxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDO2dCQUNuQyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzdDLE1BQU0sZ0JBQWdCLEdBQXlCLGlCQUFlLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUMxRixNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQy9ELElBQUkscUJBQXFCLEVBQUUsQ0FBQzt3QkFDM0IsS0FBSyxNQUFNLFNBQVMsSUFBSSxxQkFBcUIsRUFBRSxDQUFDOzRCQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO2dDQUN0QixTQUFTOzRCQUNWLENBQUM7NEJBQ0QsY0FBYyxDQUFDLElBQUksQ0FBQztnQ0FDbkIsS0FBSyxFQUFFLFNBQVMsQ0FBQyxLQUFLO2dDQUN0QixPQUFPLEVBQUUsSUFBQSxvREFBNkIsRUFBQyxTQUFTLENBQUMsSUFBSSxDQUFDOzZCQUN0RCxDQUFDLENBQUM7d0JBQ0osQ0FBQztvQkFDRixDQUFDO29CQUVELElBQUksZ0JBQWdCLEdBQWEsRUFBRSxDQUFDO29CQUNwQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxjQUFjLEVBQUUsRUFBRTt3QkFDM0MsZ0JBQWdCLEdBQUcsY0FBYyxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixJQUFJLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztvQkFDNUYsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsaUJBQWUsQ0FBQyxpQkFBaUIsR0FBRyxpQkFBZSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztvQkFFakcsSUFBSSxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUMvQix3QkFBd0IsQ0FBQyxlQUFlLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQzt3QkFDMUUsd0JBQXdCLENBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDeEUsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTSxPQUFPO1lBQ2IsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDekIsQ0FBQzs7SUEvZ0JJLGVBQWU7UUF5Qm1NLFdBQUEsc0NBQWtCLENBQUE7T0F6QnBPLGVBQWUsQ0FnaEJwQjtJQUVNLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7O2lCQUVuQyxPQUFFLEdBQUcsZ0NBQWdDLEFBQW5DLENBQW9DO1FBRXRELE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDcEMsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUE4Qiw2QkFBMkIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1RixDQUFDO1FBSUQsWUFBWSxNQUFtQixFQUFzQixpQkFBcUMsRUFBNEIsdUJBQWlELEVBQXNCLGlCQUFxQztZQUNqTyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7WUFDN0IsTUFBTSwrQkFBK0IsR0FBRyxHQUFHLEVBQUU7Z0JBQzVDLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLHlCQUF5QixFQUFFLEVBQUUsQ0FBQztvQkFDekUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksZUFBZSxDQUFDLE1BQU0sRUFBRSx1QkFBdUIsQ0FBQyx5QkFBeUIsRUFBRSx1QkFBdUIsQ0FBQyw4QkFBOEIsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2dCQUN0TSxDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBQ0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDNUMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNoQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO2dCQUM5QixDQUFDO2dCQUNELCtCQUErQixFQUFFLENBQUM7WUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLCtCQUErQixFQUFFLENBQUM7UUFDbkMsQ0FBQztRQUVELElBQVcsZUFBZTtZQUN6QixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixDQUFDO1FBRU0sYUFBYTtZQUNuQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQztnQkFDckUsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU0sUUFBUTtZQUNkLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRU0sUUFBUTtZQUNkLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRU0sZ0JBQWdCLENBQUMsS0FBMEI7WUFDakQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqQyxDQUFDO1FBQ0YsQ0FBQztRQUVNLGdCQUFnQjtZQUN0QixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUVlLE9BQU87WUFDdEIsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBQzlCLENBQUM7WUFDRCxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQzs7SUEvRFcsa0VBQTJCOzBDQUEzQiwyQkFBMkI7UUFVTCxXQUFBLCtCQUFrQixDQUFBO1FBQXlDLFdBQUEsMkNBQXdCLENBQUE7UUFBcUQsV0FBQSxzQ0FBa0IsQ0FBQTtPQVZoTCwyQkFBMkIsQ0FnRXZDO0lBR0QsTUFBTSw2QkFBOEIsU0FBUSwrQkFBWTtRQUl2RCxZQUFZLElBQWEsRUFBRSxJQUFvQjtZQUM5QyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDWixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNyQixDQUFDO1FBRU0sR0FBRyxDQUFDLFFBQTBCLEVBQUUsTUFBbUI7WUFDekQsTUFBTSxVQUFVLEdBQUcsMkJBQTJCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDakIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEIsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3ZCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdkIsQ0FBQztRQUNGLENBQUM7S0FDRDtJQUVELE1BQU0sdUJBQXdCLFNBQVEsNkJBQTZCO1FBQ2xFO1lBQ0MsS0FBSyxDQUFDLElBQUksRUFBRTtnQkFDWCxFQUFFLEVBQUUsa0NBQWtDO2dCQUN0QyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSw2QkFBNkIsQ0FBQztnQkFDOUUsS0FBSyxFQUFFLDZCQUE2QjtnQkFDcEMsWUFBWSxFQUFFLG9CQUFvQjtnQkFDbEMsTUFBTSxFQUFFO29CQUNQLE1BQU0sRUFBRSxxQ0FBaUIsQ0FBQyxlQUFlO29CQUN6QyxPQUFPLHFCQUFZO29CQUNuQixNQUFNLDBDQUFnQztpQkFDdEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFFRCxNQUFNLHVCQUF3QixTQUFRLDZCQUE2QjtRQUNsRTtZQUNDLEtBQUssQ0FBQyxLQUFLLEVBQUU7Z0JBQ1osRUFBRSxFQUFFLGtDQUFrQztnQkFDdEMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsOEJBQThCLEVBQUUsaUNBQWlDLENBQUM7Z0JBQ3RGLEtBQUssRUFBRSxpQ0FBaUM7Z0JBQ3hDLFlBQVksRUFBRSxvQkFBb0I7Z0JBQ2xDLE1BQU0sRUFBRTtvQkFDUCxNQUFNLEVBQUUscUNBQWlCLENBQUMsZUFBZTtvQkFDekMsT0FBTyxFQUFFLDZDQUF5QjtvQkFDbEMsTUFBTSwwQ0FBZ0M7aUJBQ3RDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBRUQsTUFBTSwwQkFBMkIsU0FBUSwrQkFBWTtRQUNwRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUscUNBQXFDO2dCQUN6QyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsRUFBRSwwQkFBMEIsQ0FBQztnQkFDOUUsS0FBSyxFQUFFLDBCQUEwQjtnQkFDakMsWUFBWSxFQUFFLG9CQUFvQixDQUFDLFNBQVMsRUFBRTtnQkFDOUMsTUFBTSxFQUFFO29CQUNQLE1BQU0sRUFBRSxxQ0FBaUIsQ0FBQyxlQUFlO29CQUN6QyxPQUFPLEVBQUUsQ0FBQztvQkFDVixNQUFNLDBDQUFnQztpQkFDdEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sR0FBRyxDQUFDLFFBQTBCLEVBQUUsTUFBbUIsRUFBRSxJQUFTO1lBQ3BFLE1BQU0sVUFBVSxHQUFHLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU87WUFDUixDQUFDO1lBRUQsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25DLENBQUM7S0FDRDtJQUVELElBQUEsNkNBQTBCLEVBQUMsMkJBQTJCLENBQUMsRUFBRSxFQUFFLDJCQUEyQixnREFBd0MsQ0FBQyxDQUFDLDJEQUEyRDtJQUMzTCxJQUFBLHVDQUFvQixFQUFDLHVCQUF1QixDQUFDLENBQUM7SUFDOUMsSUFBQSx1Q0FBb0IsRUFBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQzlDLElBQUEsdUNBQW9CLEVBQUMsMEJBQTBCLENBQUMsQ0FBQzs7QUFDakQsK0RBQStEIn0=