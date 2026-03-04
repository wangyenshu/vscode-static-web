/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/eolCounter", "vs/editor/common/core/lineRange", "vs/editor/common/core/position", "vs/editor/common/core/wordHelper", "vs/editor/common/languages", "vs/editor/common/model/textModelPart", "vs/editor/common/model/textModelTokens", "vs/editor/common/tokens/contiguousMultilineTokensBuilder", "vs/editor/common/tokens/contiguousTokensStore", "vs/editor/common/tokens/sparseTokensStore"], function (require, exports, arrays_1, async_1, errors_1, event_1, lifecycle_1, eolCounter_1, lineRange_1, position_1, wordHelper_1, languages_1, textModelPart_1, textModelTokens_1, contiguousMultilineTokensBuilder_1, contiguousTokensStore_1, sparseTokensStore_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenizationTextModelPart = void 0;
    class TokenizationTextModelPart extends textModelPart_1.TextModelPart {
        constructor(_languageService, _languageConfigurationService, _textModel, _bracketPairsTextModelPart, _languageId, _attachedViews) {
            super();
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            this._textModel = _textModel;
            this._bracketPairsTextModelPart = _bracketPairsTextModelPart;
            this._languageId = _languageId;
            this._attachedViews = _attachedViews;
            this._semanticTokens = new sparseTokensStore_1.SparseTokensStore(this._languageService.languageIdCodec);
            this._onDidChangeLanguage = this._register(new event_1.Emitter());
            this.onDidChangeLanguage = this._onDidChangeLanguage.event;
            this._onDidChangeLanguageConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeLanguageConfiguration = this._onDidChangeLanguageConfiguration.event;
            this._onDidChangeTokens = this._register(new event_1.Emitter());
            this.onDidChangeTokens = this._onDidChangeTokens.event;
            this.grammarTokens = this._register(new GrammarTokens(this._languageService.languageIdCodec, this._textModel, () => this._languageId, this._attachedViews));
            this._register(this._languageConfigurationService.onDidChange(e => {
                if (e.affects(this._languageId)) {
                    this._onDidChangeLanguageConfiguration.fire({});
                }
            }));
            this._register(this.grammarTokens.onDidChangeTokens(e => {
                this._emitModelTokensChangedEvent(e);
            }));
            this._register(this.grammarTokens.onDidChangeBackgroundTokenizationState(e => {
                this._bracketPairsTextModelPart.handleDidChangeBackgroundTokenizationState();
            }));
        }
        _hasListeners() {
            return (this._onDidChangeLanguage.hasListeners()
                || this._onDidChangeLanguageConfiguration.hasListeners()
                || this._onDidChangeTokens.hasListeners());
        }
        handleDidChangeContent(e) {
            if (e.isFlush) {
                this._semanticTokens.flush();
            }
            else if (!e.isEolChange) { // We don't have to do anything on an EOL change
                for (const c of e.changes) {
                    const [eolCount, firstLineLength, lastLineLength] = (0, eolCounter_1.countEOL)(c.text);
                    this._semanticTokens.acceptEdit(c.range, eolCount, firstLineLength, lastLineLength, c.text.length > 0 ? c.text.charCodeAt(0) : 0 /* CharCode.Null */);
                }
            }
            this.grammarTokens.handleDidChangeContent(e);
        }
        handleDidChangeAttached() {
            this.grammarTokens.handleDidChangeAttached();
        }
        /**
         * Includes grammar and semantic tokens.
         */
        getLineTokens(lineNumber) {
            this.validateLineNumber(lineNumber);
            const syntacticTokens = this.grammarTokens.getLineTokens(lineNumber);
            return this._semanticTokens.addSparseTokens(lineNumber, syntacticTokens);
        }
        _emitModelTokensChangedEvent(e) {
            if (!this._textModel._isDisposing()) {
                this._bracketPairsTextModelPart.handleDidChangeTokens(e);
                this._onDidChangeTokens.fire(e);
            }
        }
        // #region Grammar Tokens
        validateLineNumber(lineNumber) {
            if (lineNumber < 1 || lineNumber > this._textModel.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
        }
        get hasTokens() {
            return this.grammarTokens.hasTokens;
        }
        resetTokenization() {
            this.grammarTokens.resetTokenization();
        }
        get backgroundTokenizationState() {
            return this.grammarTokens.backgroundTokenizationState;
        }
        forceTokenization(lineNumber) {
            this.validateLineNumber(lineNumber);
            this.grammarTokens.forceTokenization(lineNumber);
        }
        hasAccurateTokensForLine(lineNumber) {
            this.validateLineNumber(lineNumber);
            return this.grammarTokens.hasAccurateTokensForLine(lineNumber);
        }
        isCheapToTokenize(lineNumber) {
            this.validateLineNumber(lineNumber);
            return this.grammarTokens.isCheapToTokenize(lineNumber);
        }
        tokenizeIfCheap(lineNumber) {
            this.validateLineNumber(lineNumber);
            this.grammarTokens.tokenizeIfCheap(lineNumber);
        }
        getTokenTypeIfInsertingCharacter(lineNumber, column, character) {
            return this.grammarTokens.getTokenTypeIfInsertingCharacter(lineNumber, column, character);
        }
        tokenizeLineWithEdit(position, length, newText) {
            return this.grammarTokens.tokenizeLineWithEdit(position, length, newText);
        }
        // #endregion
        // #region Semantic Tokens
        setSemanticTokens(tokens, isComplete) {
            this._semanticTokens.set(tokens, isComplete);
            this._emitModelTokensChangedEvent({
                semanticTokensApplied: tokens !== null,
                ranges: [{ fromLineNumber: 1, toLineNumber: this._textModel.getLineCount() }],
            });
        }
        hasCompleteSemanticTokens() {
            return this._semanticTokens.isComplete();
        }
        hasSomeSemanticTokens() {
            return !this._semanticTokens.isEmpty();
        }
        setPartialSemanticTokens(range, tokens) {
            if (this.hasCompleteSemanticTokens()) {
                return;
            }
            const changedRange = this._textModel.validateRange(this._semanticTokens.setPartial(range, tokens));
            this._emitModelTokensChangedEvent({
                semanticTokensApplied: true,
                ranges: [
                    {
                        fromLineNumber: changedRange.startLineNumber,
                        toLineNumber: changedRange.endLineNumber,
                    },
                ],
            });
        }
        // #endregion
        // #region Utility Methods
        getWordAtPosition(_position) {
            this.assertNotDisposed();
            const position = this._textModel.validatePosition(_position);
            const lineContent = this._textModel.getLineContent(position.lineNumber);
            const lineTokens = this.getLineTokens(position.lineNumber);
            const tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
            // (1). First try checking right biased word
            const [rbStartOffset, rbEndOffset] = TokenizationTextModelPart._findLanguageBoundaries(lineTokens, tokenIndex);
            const rightBiasedWord = (0, wordHelper_1.getWordAtText)(position.column, this.getLanguageConfiguration(lineTokens.getLanguageId(tokenIndex)).getWordDefinition(), lineContent.substring(rbStartOffset, rbEndOffset), rbStartOffset);
            // Make sure the result touches the original passed in position
            if (rightBiasedWord &&
                rightBiasedWord.startColumn <= _position.column &&
                _position.column <= rightBiasedWord.endColumn) {
                return rightBiasedWord;
            }
            // (2). Else, if we were at a language boundary, check the left biased word
            if (tokenIndex > 0 && rbStartOffset === position.column - 1) {
                // edge case, where `position` sits between two tokens belonging to two different languages
                const [lbStartOffset, lbEndOffset] = TokenizationTextModelPart._findLanguageBoundaries(lineTokens, tokenIndex - 1);
                const leftBiasedWord = (0, wordHelper_1.getWordAtText)(position.column, this.getLanguageConfiguration(lineTokens.getLanguageId(tokenIndex - 1)).getWordDefinition(), lineContent.substring(lbStartOffset, lbEndOffset), lbStartOffset);
                // Make sure the result touches the original passed in position
                if (leftBiasedWord &&
                    leftBiasedWord.startColumn <= _position.column &&
                    _position.column <= leftBiasedWord.endColumn) {
                    return leftBiasedWord;
                }
            }
            return null;
        }
        getLanguageConfiguration(languageId) {
            return this._languageConfigurationService.getLanguageConfiguration(languageId);
        }
        static _findLanguageBoundaries(lineTokens, tokenIndex) {
            const languageId = lineTokens.getLanguageId(tokenIndex);
            // go left until a different language is hit
            let startOffset = 0;
            for (let i = tokenIndex; i >= 0 && lineTokens.getLanguageId(i) === languageId; i--) {
                startOffset = lineTokens.getStartOffset(i);
            }
            // go right until a different language is hit
            let endOffset = lineTokens.getLineContent().length;
            for (let i = tokenIndex, tokenCount = lineTokens.getCount(); i < tokenCount && lineTokens.getLanguageId(i) === languageId; i++) {
                endOffset = lineTokens.getEndOffset(i);
            }
            return [startOffset, endOffset];
        }
        getWordUntilPosition(position) {
            const wordAtPosition = this.getWordAtPosition(position);
            if (!wordAtPosition) {
                return { word: '', startColumn: position.column, endColumn: position.column, };
            }
            return {
                word: wordAtPosition.word.substr(0, position.column - wordAtPosition.startColumn),
                startColumn: wordAtPosition.startColumn,
                endColumn: position.column,
            };
        }
        // #endregion
        // #region Language Id handling
        getLanguageId() {
            return this._languageId;
        }
        getLanguageIdAtPosition(lineNumber, column) {
            const position = this._textModel.validatePosition(new position_1.Position(lineNumber, column));
            const lineTokens = this.getLineTokens(position.lineNumber);
            return lineTokens.getLanguageId(lineTokens.findTokenIndexAtOffset(position.column - 1));
        }
        setLanguageId(languageId, source = 'api') {
            if (this._languageId === languageId) {
                // There's nothing to do
                return;
            }
            const e = {
                oldLanguage: this._languageId,
                newLanguage: languageId,
                source
            };
            this._languageId = languageId;
            this._bracketPairsTextModelPart.handleDidChangeLanguage(e);
            this.grammarTokens.resetTokenization();
            this._onDidChangeLanguage.fire(e);
            this._onDidChangeLanguageConfiguration.fire({});
        }
    }
    exports.TokenizationTextModelPart = TokenizationTextModelPart;
    class GrammarTokens extends lifecycle_1.Disposable {
        get backgroundTokenizationState() {
            return this._backgroundTokenizationState;
        }
        constructor(_languageIdCodec, _textModel, getLanguageId, attachedViews) {
            super();
            this._languageIdCodec = _languageIdCodec;
            this._textModel = _textModel;
            this.getLanguageId = getLanguageId;
            this._tokenizer = null;
            this._defaultBackgroundTokenizer = null;
            this._backgroundTokenizer = this._register(new lifecycle_1.MutableDisposable());
            this._tokens = new contiguousTokensStore_1.ContiguousTokensStore(this._languageIdCodec);
            this._debugBackgroundTokenizer = this._register(new lifecycle_1.MutableDisposable());
            this._backgroundTokenizationState = 1 /* BackgroundTokenizationState.InProgress */;
            this._onDidChangeBackgroundTokenizationState = this._register(new event_1.Emitter());
            /** @internal, should not be exposed by the text model! */
            this.onDidChangeBackgroundTokenizationState = this._onDidChangeBackgroundTokenizationState.event;
            this._onDidChangeTokens = this._register(new event_1.Emitter());
            /** @internal, should not be exposed by the text model! */
            this.onDidChangeTokens = this._onDidChangeTokens.event;
            this._attachedViewStates = this._register(new lifecycle_1.DisposableMap());
            this._register(languages_1.TokenizationRegistry.onDidChange((e) => {
                const languageId = this.getLanguageId();
                if (e.changedLanguages.indexOf(languageId) === -1) {
                    return;
                }
                this.resetTokenization();
            }));
            this.resetTokenization();
            this._register(attachedViews.onDidChangeVisibleRanges(({ view, state }) => {
                if (state) {
                    let existing = this._attachedViewStates.get(view);
                    if (!existing) {
                        existing = new AttachedViewHandler(() => this.refreshRanges(existing.lineRanges));
                        this._attachedViewStates.set(view, existing);
                    }
                    existing.handleStateChange(state);
                }
                else {
                    this._attachedViewStates.deleteAndDispose(view);
                }
            }));
        }
        resetTokenization(fireTokenChangeEvent = true) {
            this._tokens.flush();
            this._debugBackgroundTokens?.flush();
            if (this._debugBackgroundStates) {
                this._debugBackgroundStates = new textModelTokens_1.TrackingTokenizationStateStore(this._textModel.getLineCount());
            }
            if (fireTokenChangeEvent) {
                this._onDidChangeTokens.fire({
                    semanticTokensApplied: false,
                    ranges: [
                        {
                            fromLineNumber: 1,
                            toLineNumber: this._textModel.getLineCount(),
                        },
                    ],
                });
            }
            const initializeTokenization = () => {
                if (this._textModel.isTooLargeForTokenization()) {
                    return [null, null];
                }
                const tokenizationSupport = languages_1.TokenizationRegistry.get(this.getLanguageId());
                if (!tokenizationSupport) {
                    return [null, null];
                }
                let initialState;
                try {
                    initialState = tokenizationSupport.getInitialState();
                }
                catch (e) {
                    (0, errors_1.onUnexpectedError)(e);
                    return [null, null];
                }
                return [tokenizationSupport, initialState];
            };
            const [tokenizationSupport, initialState] = initializeTokenization();
            if (tokenizationSupport && initialState) {
                this._tokenizer = new textModelTokens_1.TokenizerWithStateStoreAndTextModel(this._textModel.getLineCount(), tokenizationSupport, this._textModel, this._languageIdCodec);
            }
            else {
                this._tokenizer = null;
            }
            this._backgroundTokenizer.clear();
            this._defaultBackgroundTokenizer = null;
            if (this._tokenizer) {
                const b = {
                    setTokens: (tokens) => {
                        this.setTokens(tokens);
                    },
                    backgroundTokenizationFinished: () => {
                        if (this._backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) {
                            // We already did a full tokenization and don't go back to progressing.
                            return;
                        }
                        const newState = 2 /* BackgroundTokenizationState.Completed */;
                        this._backgroundTokenizationState = newState;
                        this._onDidChangeBackgroundTokenizationState.fire();
                    },
                    setEndState: (lineNumber, state) => {
                        if (!this._tokenizer) {
                            return;
                        }
                        const firstInvalidEndStateLineNumber = this._tokenizer.store.getFirstInvalidEndStateLineNumber();
                        // Don't accept states for definitely valid states, the renderer is ahead of the worker!
                        if (firstInvalidEndStateLineNumber !== null && lineNumber >= firstInvalidEndStateLineNumber) {
                            this._tokenizer?.store.setEndState(lineNumber, state);
                        }
                    },
                };
                if (tokenizationSupport && tokenizationSupport.createBackgroundTokenizer && !tokenizationSupport.backgroundTokenizerShouldOnlyVerifyTokens) {
                    this._backgroundTokenizer.value = tokenizationSupport.createBackgroundTokenizer(this._textModel, b);
                }
                if (!this._backgroundTokenizer.value && !this._textModel.isTooLargeForTokenization()) {
                    this._backgroundTokenizer.value = this._defaultBackgroundTokenizer =
                        new textModelTokens_1.DefaultBackgroundTokenizer(this._tokenizer, b);
                    this._defaultBackgroundTokenizer.handleChanges();
                }
                if (tokenizationSupport?.backgroundTokenizerShouldOnlyVerifyTokens && tokenizationSupport.createBackgroundTokenizer) {
                    this._debugBackgroundTokens = new contiguousTokensStore_1.ContiguousTokensStore(this._languageIdCodec);
                    this._debugBackgroundStates = new textModelTokens_1.TrackingTokenizationStateStore(this._textModel.getLineCount());
                    this._debugBackgroundTokenizer.clear();
                    this._debugBackgroundTokenizer.value = tokenizationSupport.createBackgroundTokenizer(this._textModel, {
                        setTokens: (tokens) => {
                            this._debugBackgroundTokens?.setMultilineTokens(tokens, this._textModel);
                        },
                        backgroundTokenizationFinished() {
                            // NO OP
                        },
                        setEndState: (lineNumber, state) => {
                            this._debugBackgroundStates?.setEndState(lineNumber, state);
                        },
                    });
                }
                else {
                    this._debugBackgroundTokens = undefined;
                    this._debugBackgroundStates = undefined;
                    this._debugBackgroundTokenizer.value = undefined;
                }
            }
            this.refreshAllVisibleLineTokens();
        }
        handleDidChangeAttached() {
            this._defaultBackgroundTokenizer?.handleChanges();
        }
        handleDidChangeContent(e) {
            if (e.isFlush) {
                // Don't fire the event, as the view might not have got the text change event yet
                this.resetTokenization(false);
            }
            else if (!e.isEolChange) { // We don't have to do anything on an EOL change
                for (const c of e.changes) {
                    const [eolCount, firstLineLength] = (0, eolCounter_1.countEOL)(c.text);
                    this._tokens.acceptEdit(c.range, eolCount, firstLineLength);
                    this._debugBackgroundTokens?.acceptEdit(c.range, eolCount, firstLineLength);
                }
                this._debugBackgroundStates?.acceptChanges(e.changes);
                if (this._tokenizer) {
                    this._tokenizer.store.acceptChanges(e.changes);
                }
                this._defaultBackgroundTokenizer?.handleChanges();
            }
        }
        setTokens(tokens) {
            const { changes } = this._tokens.setMultilineTokens(tokens, this._textModel);
            if (changes.length > 0) {
                this._onDidChangeTokens.fire({ semanticTokensApplied: false, ranges: changes, });
            }
            return { changes: changes };
        }
        refreshAllVisibleLineTokens() {
            const ranges = lineRange_1.LineRange.joinMany([...this._attachedViewStates].map(([_, s]) => s.lineRanges));
            this.refreshRanges(ranges);
        }
        refreshRanges(ranges) {
            for (const range of ranges) {
                this.refreshRange(range.startLineNumber, range.endLineNumberExclusive - 1);
            }
        }
        refreshRange(startLineNumber, endLineNumber) {
            if (!this._tokenizer) {
                return;
            }
            startLineNumber = Math.max(1, Math.min(this._textModel.getLineCount(), startLineNumber));
            endLineNumber = Math.min(this._textModel.getLineCount(), endLineNumber);
            const builder = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
            const { heuristicTokens } = this._tokenizer.tokenizeHeuristically(builder, startLineNumber, endLineNumber);
            const changedTokens = this.setTokens(builder.finalize());
            if (heuristicTokens) {
                // We overrode tokens with heuristically computed ones.
                // Because old states might get reused (thus stopping invalidation),
                // we have to explicitly request the tokens for the changed ranges again.
                for (const c of changedTokens.changes) {
                    this._backgroundTokenizer.value?.requestTokens(c.fromLineNumber, c.toLineNumber + 1);
                }
            }
            this._defaultBackgroundTokenizer?.checkFinished();
        }
        forceTokenization(lineNumber) {
            const builder = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
            this._tokenizer?.updateTokensUntilLine(builder, lineNumber);
            this.setTokens(builder.finalize());
            this._defaultBackgroundTokenizer?.checkFinished();
        }
        hasAccurateTokensForLine(lineNumber) {
            if (!this._tokenizer) {
                return true;
            }
            return this._tokenizer.hasAccurateTokensForLine(lineNumber);
        }
        isCheapToTokenize(lineNumber) {
            if (!this._tokenizer) {
                return true;
            }
            return this._tokenizer.isCheapToTokenize(lineNumber);
        }
        tokenizeIfCheap(lineNumber) {
            if (this.isCheapToTokenize(lineNumber)) {
                this.forceTokenization(lineNumber);
            }
        }
        getLineTokens(lineNumber) {
            const lineText = this._textModel.getLineContent(lineNumber);
            const result = this._tokens.getTokens(this._textModel.getLanguageId(), lineNumber - 1, lineText);
            if (this._debugBackgroundTokens && this._debugBackgroundStates && this._tokenizer) {
                if (this._debugBackgroundStates.getFirstInvalidEndStateLineNumberOrMax() > lineNumber && this._tokenizer.store.getFirstInvalidEndStateLineNumberOrMax() > lineNumber) {
                    const backgroundResult = this._debugBackgroundTokens.getTokens(this._textModel.getLanguageId(), lineNumber - 1, lineText);
                    if (!result.equals(backgroundResult) && this._debugBackgroundTokenizer.value?.reportMismatchingTokens) {
                        this._debugBackgroundTokenizer.value.reportMismatchingTokens(lineNumber);
                    }
                }
            }
            return result;
        }
        getTokenTypeIfInsertingCharacter(lineNumber, column, character) {
            if (!this._tokenizer) {
                return 0 /* StandardTokenType.Other */;
            }
            const position = this._textModel.validatePosition(new position_1.Position(lineNumber, column));
            this.forceTokenization(position.lineNumber);
            return this._tokenizer.getTokenTypeIfInsertingCharacter(position, character);
        }
        tokenizeLineWithEdit(position, length, newText) {
            if (!this._tokenizer) {
                return null;
            }
            const validatedPosition = this._textModel.validatePosition(position);
            this.forceTokenization(validatedPosition.lineNumber);
            return this._tokenizer.tokenizeLineWithEdit(validatedPosition, length, newText);
        }
        get hasTokens() {
            return this._tokens.hasTokens;
        }
    }
    class AttachedViewHandler extends lifecycle_1.Disposable {
        get lineRanges() { return this._lineRanges; }
        constructor(_refreshTokens) {
            super();
            this._refreshTokens = _refreshTokens;
            this.runner = this._register(new async_1.RunOnceScheduler(() => this.update(), 50));
            this._computedLineRanges = [];
            this._lineRanges = [];
        }
        update() {
            if ((0, arrays_1.equals)(this._computedLineRanges, this._lineRanges, (a, b) => a.equals(b))) {
                return;
            }
            this._computedLineRanges = this._lineRanges;
            this._refreshTokens();
        }
        handleStateChange(state) {
            this._lineRanges = state.visibleLineRanges;
            if (state.stabilized) {
                this.runner.cancel();
                this.update();
            }
            else {
                this.runner.schedule();
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemF0aW9uVGV4dE1vZGVsUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvdG9rZW5pemF0aW9uVGV4dE1vZGVsUGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErQmhHLE1BQWEseUJBQTBCLFNBQVEsNkJBQWE7UUFjM0QsWUFDa0IsZ0JBQWtDLEVBQ2xDLDZCQUE0RCxFQUM1RCxVQUFxQixFQUNyQiwwQkFBcUQsRUFDOUQsV0FBbUIsRUFDVixjQUE2QjtZQUU5QyxLQUFLLEVBQUUsQ0FBQztZQVBTLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDbEMsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUErQjtZQUM1RCxlQUFVLEdBQVYsVUFBVSxDQUFXO1lBQ3JCLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBMkI7WUFDOUQsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFDVixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtZQW5COUIsb0JBQWUsR0FBc0IsSUFBSSxxQ0FBaUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFbEcseUJBQW9CLEdBQXdDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQThCLENBQUMsQ0FBQztZQUN2SCx3QkFBbUIsR0FBc0MsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQztZQUV4RixzQ0FBaUMsR0FBcUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMkMsQ0FBQyxDQUFDO1lBQzlKLHFDQUFnQyxHQUFtRCxJQUFJLENBQUMsaUNBQWlDLENBQUMsS0FBSyxDQUFDO1lBRS9ILHVCQUFrQixHQUFzQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE0QixD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