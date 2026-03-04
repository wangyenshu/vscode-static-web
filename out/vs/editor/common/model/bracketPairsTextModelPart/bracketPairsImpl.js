/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/languages/supports", "vs/editor/common/languages/supports/richEditBrackets", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/bracketPairsTree"], function (require, exports, arrays_1, event_1, lifecycle_1, range_1, supports_1, richEditBrackets_1, bracketPairsTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketPairsTextModelPart = void 0;
    class BracketPairsTextModelPart extends lifecycle_1.Disposable {
        get canBuildAST() {
            const maxSupportedDocumentLength = /* max lines */ 50_000 * /* average column count */ 100;
            return this.textModel.getValueLength() <= maxSupportedDocumentLength;
        }
        constructor(textModel, languageConfigurationService) {
            super();
            this.textModel = textModel;
            this.languageConfigurationService = languageConfigurationService;
            this.bracketPairsTree = this._register(new lifecycle_1.MutableDisposable());
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.bracketsRequested = false;
            this._register(this.languageConfigurationService.onDidChange(e => {
                if (!e.languageId || this.bracketPairsTree.value?.object.didLanguageChange(e.languageId)) {
                    this.bracketPairsTree.clear();
                    this.updateBracketPairsTree();
                }
            }));
        }
        //#region TextModel events
        handleDidChangeOptions(e) {
            this.bracketPairsTree.clear();
            this.updateBracketPairsTree();
        }
        handleDidChangeLanguage(e) {
            this.bracketPairsTree.clear();
            this.updateBracketPairsTree();
        }
        handleDidChangeContent(change) {
            this.bracketPairsTree.value?.object.handleContentChanged(change);
        }
        handleDidChangeBackgroundTokenizationState() {
            this.bracketPairsTree.value?.object.handleDidChangeBackgroundTokenizationState();
        }
        handleDidChangeTokens(e) {
            this.bracketPairsTree.value?.object.handleDidChangeTokens(e);
        }
        //#endregion
        updateBracketPairsTree() {
            if (this.bracketsRequested && this.canBuildAST) {
                if (!this.bracketPairsTree.value) {
                    const store = new lifecycle_1.DisposableStore();
                    this.bracketPairsTree.value = createDisposableRef(store.add(new bracketPairsTree_1.BracketPairsTree(this.textModel, (languageId) => {
                        return this.languageConfigurationService.getLanguageConfiguration(languageId);
                    })), store);
                    store.add(this.bracketPairsTree.value.object.onDidChange(e => this.onDidChangeEmitter.fire(e)));
                    this.onDidChangeEmitter.fire();
                }
            }
            else {
                if (this.bracketPairsTree.value) {
                    this.bracketPairsTree.clear();
                    // Important: Don't call fire if there was no change!
                    this.onDidChangeEmitter.fire();
                }
            }
        }
        /**
         * Returns all bracket pairs that intersect the given range.
         * The result is sorted by the start position.
        */
        getBracketPairsInRange(range) {
            this.bracketsRequested = true;
            this.updateBracketPairsTree();
            return this.bracketPairsTree.value?.object.getBracketPairsInRange(range, false) || arrays_1.CallbackIterable.empty;
        }
        getBracketPairsInRangeWithMinIndentation(range) {
            this.bracketsRequested = true;
            this.updateBracketPairsTree();
            return this.bracketPairsTree.value?.object.getBracketPairsInRange(range, true) || arrays_1.CallbackIterable.empty;
        }
        getBracketsInRange(range, onlyColorizedBrackets = false) {
            this.bracketsRequested = true;
            this.updateBracketPairsTree();
            return this.bracketPairsTree.value?.object.getBracketsInRange(range, onlyColorizedBrackets) || arrays_1.CallbackIterable.empty;
        }
        findMatchingBracketUp(_bracket, _position, maxDuration) {
            const position = this.textModel.validatePosition(_position);
            const languageId = this.textModel.getLanguageIdAtPosition(position.lineNumber, position.column);
            if (this.canBuildAST) {
                const closingBracketInfo = this.languageConfigurationService
                    .getLanguageConfiguration(languageId)
                    .bracketsNew.getClosingBracketInfo(_bracket);
                if (!closingBracketInfo) {
                    return null;
                }
                const bracketPair = this.getBracketPairsInRange(range_1.Range.fromPositions(_position, _position)).findLast((b) => closingBracketInfo.closes(b.openingBracketInfo));
                if (bracketPair) {
                    return bracketPair.openingBracketRange;
                }
                return null;
            }
            else {
                // Fallback to old bracket matching code:
                const bracket = _bracket.toLowerCase();
                const bracketsSupport = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                if (!bracketsSupport) {
                    return null;
                }
                const data = bracketsSupport.textIsBracket[bracket];
                if (!data) {
                    return null;
                }
                return stripBracketSearchCanceled(this._findMatchingBracketUp(data, position, createTimeBasedContinueBracketSearchPredicate(maxDuration)));
            }
        }
        matchBracket(position, maxDuration) {
            if (this.canBuildAST) {
                const bracketPair = this.getBracketPairsInRange(range_1.Range.fromPositions(position, position)).filter((item) => item.closingBracketRange !== undefined &&
                    (item.openingBracketRange.containsPosition(position) ||
                        item.closingBracketRange.containsPosition(position))).findLastMaxBy((0, arrays_1.compareBy)((item) => item.openingBracketRange.containsPosition(position)
                    ? item.openingBracketRange
                    : item.closingBracketRange, range_1.Range.compareRangesUsingStarts));
                if (bracketPair) {
                    return [bracketPair.openingBracketRange, bracketPair.closingBracketRange];
                }
                return null;
            }
            else {
                // Fallback to old bracket matching code:
                const continueSearchPredicate = createTimeBasedContinueBracketSearchPredicate(maxDuration);
                return this._matchBracket(this.textModel.validatePosition(position), continueSearchPredicate);
            }
        }
        _establishBracketSearchOffsets(position, lineTokens, modeBrackets, tokenIndex) {
            const tokenCount = lineTokens.getCount();
            const currentLanguageId = lineTokens.getLanguageId(tokenIndex);
            // limit search to not go before `maxBracketLength`
            let searchStartOffset = Math.max(0, position.column - 1 - modeBrackets.maxBracketLength);
            for (let i = tokenIndex - 1; i >= 0; i--) {
                const tokenEndOffset = lineTokens.getEndOffset(i);
                if (tokenEndOffset <= searchStartOffset) {
                    break;
                }
                if ((0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(i)) || lineTokens.getLanguageId(i) !== currentLanguageId) {
                    searchStartOffset = tokenEndOffset;
                    break;
                }
            }
            // limit search to not go after `maxBracketLength`
            let searchEndOffset = Math.min(lineTokens.getLineContent().length, position.column - 1 + modeBrackets.maxBracketLength);
            for (let i = tokenIndex + 1; i < tokenCount; i++) {
                const tokenStartOffset = lineTokens.getStartOffset(i);
                if (tokenStartOffset >= searchEndOffset) {
                    break;
                }
                if ((0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(i)) || lineTokens.getLanguageId(i) !== currentLanguageId) {
                    searchEndOffset = tokenStartOffset;
                    break;
                }
            }
            return { searchStartOffset, searchEndOffset };
        }
        _matchBracket(position, continueSearchPredicate) {
            const lineNumber = position.lineNumber;
            const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
            const lineText = this.textModel.getLineContent(lineNumber);
            const tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
            if (tokenIndex < 0) {
                return null;
            }
            const currentModeBrackets = this.languageConfigurationService.getLanguageConfiguration(lineTokens.getLanguageId(tokenIndex)).brackets;
            // check that the token is not to be ignored
            if (currentModeBrackets && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex))) {
                let { searchStartOffset, searchEndOffset } = this._establishBracketSearchOffsets(position, lineTokens, currentModeBrackets, tokenIndex);
                // it might be the case that [currentTokenStart -> currentTokenEnd] contains multiple brackets
                // `bestResult` will contain the most right-side result
                let bestResult = null;
                while (true) {
                    const foundBracket = richEditBrackets_1.BracketsUtils.findNextBracketInRange(currentModeBrackets.forwardRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (!foundBracket) {
                        // there are no more brackets in this text
                        break;
                    }
                    // check that we didn't hit a bracket too far away from position
                    if (foundBracket.startColumn <= position.column && position.column <= foundBracket.endColumn) {
                        const foundBracketText = lineText.substring(foundBracket.startColumn - 1, foundBracket.endColumn - 1).toLowerCase();
                        const r = this._matchFoundBracket(foundBracket, currentModeBrackets.textIsBracket[foundBracketText], currentModeBrackets.textIsOpenBracket[foundBracketText], continueSearchPredicate);
                        if (r) {
                            if (r instanceof BracketSearchCanceled) {
                                return null;
                            }
                            bestResult = r;
                        }
                    }
                    searchStartOffset = foundBracket.endColumn - 1;
                }
                if (bestResult) {
                    return bestResult;
                }
            }
            // If position is in between two tokens, try also looking in the previous token
            if (tokenIndex > 0 && lineTokens.getStartOffset(tokenIndex) === position.column - 1) {
                const prevTokenIndex = tokenIndex - 1;
                const prevModeBrackets = this.languageConfigurationService.getLanguageConfiguration(lineTokens.getLanguageId(prevTokenIndex)).brackets;
                // check that previous token is not to be ignored
                if (prevModeBrackets && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(prevTokenIndex))) {
                    const { searchStartOffset, searchEndOffset } = this._establishBracketSearchOffsets(position, lineTokens, prevModeBrackets, prevTokenIndex);
                    const foundBracket = richEditBrackets_1.BracketsUtils.findPrevBracketInRange(prevModeBrackets.reversedRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    // check that we didn't hit a bracket too far away from position
                    if (foundBracket && foundBracket.startColumn <= position.column && position.column <= foundBracket.endColumn) {
                        const foundBracketText = lineText.substring(foundBracket.startColumn - 1, foundBracket.endColumn - 1).toLowerCase();
                        const r = this._matchFoundBracket(foundBracket, prevModeBrackets.textIsBracket[foundBracketText], prevModeBrackets.textIsOpenBracket[foundBracketText], continueSearchPredicate);
                        if (r) {
                            if (r instanceof BracketSearchCanceled) {
                                return null;
                            }
                            return r;
                        }
                    }
                }
            }
            return null;
        }
        _matchFoundBracket(foundBracket, data, isOpen, continueSearchPredicate) {
            if (!data) {
                return null;
            }
            const matched = (isOpen
                ? this._findMatchingBracketDown(data, foundBracket.getEndPosition(), continueSearchPredicate)
                : this._findMatchingBracketUp(data, foundBracket.getStartPosition(), continueSearchPredicate));
            if (!matched) {
                return null;
            }
            if (matched instanceof BracketSearchCanceled) {
                return matched;
            }
            return [foundBracket, matched];
        }
        _findMatchingBracketUp(bracket, position, continueSearchPredicate) {
            // console.log('_findMatchingBracketUp: ', 'bracket: ', JSON.stringify(bracket), 'startPosition: ', String(position));
            const languageId = bracket.languageId;
            const reversedBracketRegex = bracket.reversedRegex;
            let count = -1;
            let totalCallCount = 0;
            const searchPrevMatchingBracketInRange = (lineNumber, lineText, searchStartOffset, searchEndOffset) => {
                while (true) {
                    if (continueSearchPredicate && (++totalCallCount) % 100 === 0 && !continueSearchPredicate()) {
                        return BracketSearchCanceled.INSTANCE;
                    }
                    const r = richEditBrackets_1.BracketsUtils.findPrevBracketInRange(reversedBracketRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (!r) {
                        break;
                    }
                    const hitText = lineText.substring(r.startColumn - 1, r.endColumn - 1).toLowerCase();
                    if (bracket.isOpen(hitText)) {
                        count++;
                    }
                    else if (bracket.isClose(hitText)) {
                        count--;
                    }
                    if (count === 0) {
                        return r;
                    }
                    searchEndOffset = r.startColumn - 1;
                }
                return null;
            };
            for (let lineNumber = position.lineNumber; lineNumber >= 1; lineNumber--) {
                const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
                const tokenCount = lineTokens.getCount();
                const lineText = this.textModel.getLineContent(lineNumber);
                let tokenIndex = tokenCount - 1;
                let searchStartOffset = lineText.length;
                let searchEndOffset = lineText.length;
                if (lineNumber === position.lineNumber) {
                    tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
                    searchStartOffset = position.column - 1;
                    searchEndOffset = position.column - 1;
                }
                let prevSearchInToken = true;
                for (; tokenIndex >= 0; tokenIndex--) {
                    const searchInToken = (lineTokens.getLanguageId(tokenIndex) === languageId && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex)));
                    if (searchInToken) {
                        // this token should be searched
                        if (prevSearchInToken) {
                            // the previous token should be searched, simply extend searchStartOffset
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                        }
                        else {
                            // the previous token should not be searched
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                    }
                    else {
                        // this token should not be searched
                        if (prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = searchPrevMatchingBracketInRange(lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return r;
                            }
                        }
                    }
                    prevSearchInToken = searchInToken;
                }
                if (prevSearchInToken && searchStartOffset !== searchEndOffset) {
                    const r = searchPrevMatchingBracketInRange(lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (r) {
                        return r;
                    }
                }
            }
            return null;
        }
        _findMatchingBracketDown(bracket, position, continueSearchPredicate) {
            // console.log('_findMatchingBracketDown: ', 'bracket: ', JSON.stringify(bracket), 'startPosition: ', String(position));
            const languageId = bracket.languageId;
            const bracketRegex = bracket.forwardRegex;
            let count = 1;
            let totalCallCount = 0;
            const searchNextMatchingBracketInRange = (lineNumber, lineText, searchStartOffset, searchEndOffset) => {
                while (true) {
                    if (continueSearchPredicate && (++totalCallCount) % 100 === 0 && !continueSearchPredicate()) {
                        return BracketSearchCanceled.INSTANCE;
                    }
                    const r = richEditBrackets_1.BracketsUtils.findNextBracketInRange(bracketRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (!r) {
                        break;
                    }
                    const hitText = lineText.substring(r.startColumn - 1, r.endColumn - 1).toLowerCase();
                    if (bracket.isOpen(hitText)) {
                        count++;
                    }
                    else if (bracket.isClose(hitText)) {
                        count--;
                    }
                    if (count === 0) {
                        return r;
                    }
                    searchStartOffset = r.endColumn - 1;
                }
                return null;
            };
            const lineCount = this.textModel.getLineCount();
            for (let lineNumber = position.lineNumber; lineNumber <= lineCount; lineNumber++) {
                const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
                const tokenCount = lineTokens.getCount();
                const lineText = this.textModel.getLineContent(lineNumber);
                let tokenIndex = 0;
                let searchStartOffset = 0;
                let searchEndOffset = 0;
                if (lineNumber === position.lineNumber) {
                    tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
                    searchStartOffset = position.column - 1;
                    searchEndOffset = position.column - 1;
                }
                let prevSearchInToken = true;
                for (; tokenIndex < tokenCount; tokenIndex++) {
                    const searchInToken = (lineTokens.getLanguageId(tokenIndex) === languageId && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex)));
                    if (searchInToken) {
                        // this token should be searched
                        if (prevSearchInToken) {
                            // the previous token should be searched, simply extend searchEndOffset
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                        else {
                            // the previous token should not be searched
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                    }
                    else {
                        // this token should not be searched
                        if (prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = searchNextMatchingBracketInRange(lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return r;
                            }
                        }
                    }
                    prevSearchInToken = searchInToken;
                }
                if (prevSearchInToken && searchStartOffset !== searchEndOffset) {
                    const r = searchNextMatchingBracketInRange(lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (r) {
                        return r;
                    }
                }
            }
            return null;
        }
        findPrevBracket(_position) {
            const position = this.textModel.validatePosition(_position);
            if (this.canBuildAST) {
                this.bracketsRequested = true;
                this.updateBracketPairsTree();
                return this.bracketPairsTree.value?.object.getFirstBracketBefore(position) || null;
            }
            let languageId = null;
            let modeBrackets = null;
            let bracketConfig = null;
            for (let lineNumber = position.lineNumber; lineNumber >= 1; lineNumber--) {
                const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
                const tokenCount = lineTokens.getCount();
                const lineText = this.textModel.getLineContent(lineNumber);
                let tokenIndex = tokenCount - 1;
                let searchStartOffset = lineText.length;
                let searchEndOffset = lineText.length;
                if (lineNumber === position.lineNumber) {
                    tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
                    searchStartOffset = position.column - 1;
                    searchEndOffset = position.column - 1;
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        bracketConfig = this.languageConfigurationService.getLanguageConfiguration(languageId).bracketsNew;
                    }
                }
                let prevSearchInToken = true;
                for (; tokenIndex >= 0; tokenIndex--) {
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        // language id change!
                        if (modeBrackets && bracketConfig && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = richEditBrackets_1.BracketsUtils.findPrevBracketInRange(modeBrackets.reversedRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return this._toFoundBracket(bracketConfig, r);
                            }
                            prevSearchInToken = false;
                        }
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        bracketConfig = this.languageConfigurationService.getLanguageConfiguration(languageId).bracketsNew;
                    }
                    const searchInToken = (!!modeBrackets && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex)));
                    if (searchInToken) {
                        // this token should be searched
                        if (prevSearchInToken) {
                            // the previous token should be searched, simply extend searchStartOffset
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                        }
                        else {
                            // the previous token should not be searched
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                    }
                    else {
                        // this token should not be searched
                        if (bracketConfig && modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = richEditBrackets_1.BracketsUtils.findPrevBracketInRange(modeBrackets.reversedRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return this._toFoundBracket(bracketConfig, r);
                            }
                        }
                    }
                    prevSearchInToken = searchInToken;
                }
                if (bracketConfig && modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                    const r = richEditBrackets_1.BracketsUtils.findPrevBracketInRange(modeBrackets.reversedRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (r) {
                        return this._toFoundBracket(bracketConfig, r);
                    }
                }
            }
            return null;
        }
        findNextBracket(_position) {
            const position = this.textModel.validatePosition(_position);
            if (this.canBuildAST) {
                this.bracketsRequested = true;
                this.updateBracketPairsTree();
                return this.bracketPairsTree.value?.object.getFirstBracketAfter(position) || null;
            }
            const lineCount = this.textModel.getLineCount();
            let languageId = null;
            let modeBrackets = null;
            let bracketConfig = null;
            for (let lineNumber = position.lineNumber; lineNumber <= lineCount; lineNumber++) {
                const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
                const tokenCount = lineTokens.getCount();
                const lineText = this.textModel.getLineContent(lineNumber);
                let tokenIndex = 0;
                let searchStartOffset = 0;
                let searchEndOffset = 0;
                if (lineNumber === position.lineNumber) {
                    tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
                    searchStartOffset = position.column - 1;
                    searchEndOffset = position.column - 1;
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        bracketConfig = this.languageConfigurationService.getLanguageConfiguration(languageId).bracketsNew;
                    }
                }
                let prevSearchInToken = true;
                for (; tokenIndex < tokenCount; tokenIndex++) {
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        // language id change!
                        if (bracketConfig && modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = richEditBrackets_1.BracketsUtils.findNextBracketInRange(modeBrackets.forwardRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return this._toFoundBracket(bracketConfig, r);
                            }
                            prevSearchInToken = false;
                        }
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        bracketConfig = this.languageConfigurationService.getLanguageConfiguration(languageId).bracketsNew;
                    }
                    const searchInToken = (!!modeBrackets && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex)));
                    if (searchInToken) {
                        // this token should be searched
                        if (prevSearchInToken) {
                            // the previous token should be searched, simply extend searchEndOffset
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                        else {
                            // the previous token should not be searched
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                    }
                    else {
                        // this token should not be searched
                        if (bracketConfig && modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = richEditBrackets_1.BracketsUtils.findNextBracketInRange(modeBrackets.forwardRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return this._toFoundBracket(bracketConfig, r);
                            }
                        }
                    }
                    prevSearchInToken = searchInToken;
                }
                if (bracketConfig && modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                    const r = richEditBrackets_1.BracketsUtils.findNextBracketInRange(modeBrackets.forwardRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (r) {
                        return this._toFoundBracket(bracketConfig, r);
                    }
                }
            }
            return null;
        }
        findEnclosingBrackets(_position, maxDuration) {
            const position = this.textModel.validatePosition(_position);
            if (this.canBuildAST) {
                const range = range_1.Range.fromPositions(position);
                const bracketPair = this.getBracketPairsInRange(range_1.Range.fromPositions(position, position)).findLast((item) => item.closingBracketRange !== undefined && item.range.strictContainsRange(range));
                if (bracketPair) {
                    return [bracketPair.openingBracketRange, bracketPair.closingBracketRange];
                }
                return null;
            }
            const continueSearchPredicate = createTimeBasedContinueBracketSearchPredicate(maxDuration);
            const lineCount = this.textModel.getLineCount();
            const savedCounts = new Map();
            let counts = [];
            const resetCounts = (languageId, modeBrackets) => {
                if (!savedCounts.has(languageId)) {
                    const tmp = [];
                    for (let i = 0, len = modeBrackets ? modeBrackets.brackets.length : 0; i < len; i++) {
                        tmp[i] = 0;
                    }
                    savedCounts.set(languageId, tmp);
                }
                counts = savedCounts.get(languageId);
            };
            let totalCallCount = 0;
            const searchInRange = (modeBrackets, lineNumber, lineText, searchStartOffset, searchEndOffset) => {
                while (true) {
                    if (continueSearchPredicate && (++totalCallCount) % 100 === 0 && !continueSearchPredicate()) {
                        return BracketSearchCanceled.INSTANCE;
                    }
                    const r = richEditBrackets_1.BracketsUtils.findNextBracketInRange(modeBrackets.forwardRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (!r) {
                        break;
                    }
                    const hitText = lineText.substring(r.startColumn - 1, r.endColumn - 1).toLowerCase();
                    const bracket = modeBrackets.textIsBracket[hitText];
                    if (bracket) {
                        if (bracket.isOpen(hitText)) {
                            counts[bracket.index]++;
                        }
                        else if (bracket.isClose(hitText)) {
                            counts[bracket.index]--;
                        }
                        if (counts[bracket.index] === -1) {
                            return this._matchFoundBracket(r, bracket, false, continueSearchPredicate);
                        }
                    }
                    searchStartOffset = r.endColumn - 1;
                }
                return null;
            };
            let languageId = null;
            let modeBrackets = null;
            for (let lineNumber = position.lineNumber; lineNumber <= lineCount; lineNumber++) {
                const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
                const tokenCount = lineTokens.getCount();
                const lineText = this.textModel.getLineContent(lineNumber);
                let tokenIndex = 0;
                let searchStartOffset = 0;
                let searchEndOffset = 0;
                if (lineNumber === position.lineNumber) {
                    tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
                    searchStartOffset = position.column - 1;
                    searchEndOffset = position.column - 1;
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        resetCounts(languageId, modeBrackets);
                    }
                }
                let prevSearchInToken = true;
                for (; tokenIndex < tokenCount; tokenIndex++) {
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        // language id change!
                        if (modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = searchInRange(modeBrackets, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return stripBracketSearchCanceled(r);
                            }
                            prevSearchInToken = false;
                        }
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        resetCounts(languageId, modeBrackets);
                    }
                    const searchInToken = (!!modeBrackets && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex)));
                    if (searchInToken) {
                        // this token should be searched
                        if (prevSearchInToken) {
                            // the previous token should be searched, simply extend searchEndOffset
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                        else {
                            // the previous token should not be searched
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                    }
                    else {
                        // this token should not be searched
                        if (modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = searchInRange(modeBrackets, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return stripBracketSearchCanceled(r);
                            }
                        }
                    }
                    prevSearchInToken = searchInToken;
                }
                if (modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                    const r = searchInRange(modeBrackets, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (r) {
                        return stripBracketSearchCanceled(r);
                    }
                }
            }
            return null;
        }
        _toFoundBracket(bracketConfig, r) {
            if (!r) {
                return null;
            }
            let text = this.textModel.getValueInRange(r);
            text = text.toLowerCase();
            const bracketInfo = bracketConfig.getBracketInfo(text);
            if (!bracketInfo) {
                return null;
            }
            return {
                range: r,
                bracketInfo
            };
        }
    }
    exports.BracketPairsTextModelPart = BracketPairsTextModelPart;
    function createDisposableRef(object, disposable) {
        return {
            object,
            dispose: () => disposable?.dispose(),
        };
    }
    function createTimeBasedContinueBracketSearchPredicate(maxDuration) {
        if (typeof maxDuration === 'undefined') {
            return () => true;
        }
        else {
            const startTime = Date.now();
            return () => {
                return (Date.now() - startTime <= maxDuration);
            };
        }
    }
    class BracketSearchCanceled {
        static { this.INSTANCE = new BracketSearchCanceled(); }
        constructor() {
            this._searchCanceledBrand = undefined;
        }
    }
    function stripBracketSearchCanceled(result) {
        if (result instanceof BracketSearchCanceled) {
            return null;
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldFBhaXJzSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvYnJhY2tldFBhaXJzVGV4dE1vZGVsUGFydC9icmFja2V0UGFpcnNJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlCaEcsTUFBYSx5QkFBMEIsU0FBUSxzQkFBVTtRQU14RCxJQUFZLFdBQVc7WUFDdEIsTUFBTSwwQkFBMEIsR0FBRyxlQUFlLENBQUMsTUFBTSxHQUFHLDBCQUEwQixDQUFDLEdBQUcsQ0FBQztZQUMzRixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLElBQUksMEJBQTBCLENBQUM7UUFDdEUsQ0FBQztRQUlELFlBQ2tCLFNBQW9CLEVBQ3BCLDRCQUEyRDtZQUU1RSxLQUFLLEVBQUUsQ0FBQztZQUhTLGNBQVMsR0FBVCxTQUFTLENBQVc7WUFDcEIsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUErQjtZQWQ1RCxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQWdDLENBQUMsQ0FBQztZQUV6Rix1QkFBa0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQzFDLGdCQUFXLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQU9wRCxzQkFBaUIsR0FBRyxLQUFLLENBQUM7WUFRakMsSUFBSSxDQUFDLFNBQVMsQ0FDYixJQUFJLENBQUMsNEJBQTRCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNqRCxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUs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