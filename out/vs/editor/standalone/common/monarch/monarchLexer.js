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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/languages", "vs/editor/common/languages/nullTokenize", "vs/editor/standalone/common/monarch/monarchCommon", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, languages, nullTokenize_1, monarchCommon, configuration_1) {
    "use strict";
    var MonarchTokenizer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MonarchTokenizer = void 0;
    const CACHE_STACK_DEPTH = 5;
    /**
     * Reuse the same stack elements up to a certain depth.
     */
    class MonarchStackElementFactory {
        static { this._INSTANCE = new MonarchStackElementFactory(CACHE_STACK_DEPTH); }
        static create(parent, state) {
            return this._INSTANCE.create(parent, state);
        }
        constructor(maxCacheDepth) {
            this._maxCacheDepth = maxCacheDepth;
            this._entries = Object.create(null);
        }
        create(parent, state) {
            if (parent !== null && parent.depth >= this._maxCacheDepth) {
                // no caching above a certain depth
                return new MonarchStackElement(parent, state);
            }
            let stackElementId = MonarchStackElement.getStackElementId(parent);
            if (stackElementId.length > 0) {
                stackElementId += '|';
            }
            stackElementId += state;
            let result = this._entries[stackElementId];
            if (result) {
                return result;
            }
            result = new MonarchStackElement(parent, state);
            this._entries[stackElementId] = result;
            return result;
        }
    }
    class MonarchStackElement {
        constructor(parent, state) {
            this.parent = parent;
            this.state = state;
            this.depth = (this.parent ? this.parent.depth : 0) + 1;
        }
        static getStackElementId(element) {
            let result = '';
            while (element !== null) {
                if (result.length > 0) {
                    result += '|';
                }
                result += element.state;
                element = element.parent;
            }
            return result;
        }
        static _equals(a, b) {
            while (a !== null && b !== null) {
                if (a === b) {
                    return true;
                }
                if (a.state !== b.state) {
                    return false;
                }
                a = a.parent;
                b = b.parent;
            }
            if (a === null && b === null) {
                return true;
            }
            return false;
        }
        equals(other) {
            return MonarchStackElement._equals(this, other);
        }
        push(state) {
            return MonarchStackElementFactory.create(this, state);
        }
        pop() {
            return this.parent;
        }
        popall() {
            let result = this;
            while (result.parent) {
                result = result.parent;
            }
            return result;
        }
        switchTo(state) {
            return MonarchStackElementFactory.create(this.parent, state);
        }
    }
    class EmbeddedLanguageData {
        constructor(languageId, state) {
            this.languageId = languageId;
            this.state = state;
        }
        equals(other) {
            return (this.languageId === other.languageId
                && this.state.equals(other.state));
        }
        clone() {
            const stateClone = this.state.clone();
            // save an object
            if (stateClone === this.state) {
                return this;
            }
            return new EmbeddedLanguageData(this.languageId, this.state);
        }
    }
    /**
     * Reuse the same line states up to a certain depth.
     */
    class MonarchLineStateFactory {
        static { this._INSTANCE = new MonarchLineStateFactory(CACHE_STACK_DEPTH); }
        static create(stack, embeddedLanguageData) {
            return this._INSTANCE.create(stack, embeddedLanguageData);
        }
        constructor(maxCacheDepth) {
            this._maxCacheDepth = maxCacheDepth;
            this._entries = Object.create(null);
        }
        create(stack, embeddedLanguageData) {
            if (embeddedLanguageData !== null) {
                // no caching when embedding
                return new MonarchLineState(stack, embeddedLanguageData);
            }
            if (stack !== null && stack.depth >= this._maxCacheDepth) {
                // no caching above a certain depth
                return new MonarchLineState(stack, embeddedLanguageData);
            }
            const stackElementId = MonarchStackElement.getStackElementId(stack);
            let result = this._entries[stackElementId];
            if (result) {
                return result;
            }
            result = new MonarchLineState(stack, null);
            this._entries[stackElementId] = result;
            return result;
        }
    }
    class MonarchLineState {
        constructor(stack, embeddedLanguageData) {
            this.stack = stack;
            this.embeddedLanguageData = embeddedLanguageData;
        }
        clone() {
            const embeddedlanguageDataClone = this.embeddedLanguageData ? this.embeddedLanguageData.clone() : null;
            // save an object
            if (embeddedlanguageDataClone === this.embeddedLanguageData) {
                return this;
            }
            return MonarchLineStateFactory.create(this.stack, this.embeddedLanguageData);
        }
        equals(other) {
            if (!(other instanceof MonarchLineState)) {
                return false;
            }
            if (!this.stack.equals(other.stack)) {
                return false;
            }
            if (this.embeddedLanguageData === null && other.embeddedLanguageData === null) {
                return true;
            }
            if (this.embeddedLanguageData === null || other.embeddedLanguageData === null) {
                return false;
            }
            return this.embeddedLanguageData.equals(other.embeddedLanguageData);
        }
    }
    class MonarchClassicTokensCollector {
        constructor() {
            this._tokens = [];
            this._languageId = null;
            this._lastTokenType = null;
            this._lastTokenLanguage = null;
        }
        enterLanguage(languageId) {
            this._languageId = languageId;
        }
        emit(startOffset, type) {
            if (this._lastTokenType === type && this._lastTokenLanguage === this._languageId) {
                return;
            }
            this._lastTokenType = type;
            this._lastTokenLanguage = this._languageId;
            this._tokens.push(new languages.Token(startOffset, type, this._languageId));
        }
        nestedLanguageTokenize(embeddedLanguageLine, hasEOL, embeddedLanguageData, offsetDelta) {
            const nestedLanguageId = embeddedLanguageData.languageId;
            const embeddedModeState = embeddedLanguageData.state;
            const nestedLanguageTokenizationSupport = languages.TokenizationRegistry.get(nestedLanguageId);
            if (!nestedLanguageTokenizationSupport) {
                this.enterLanguage(nestedLanguageId);
                this.emit(offsetDelta, '');
                return embeddedModeState;
            }
            const nestedResult = nestedLanguageTokenizationSupport.tokenize(embeddedLanguageLine, hasEOL, embeddedModeState);
            if (offsetDelta !== 0) {
                for (const token of nestedResult.tokens) {
                    this._tokens.push(new languages.Token(token.offset + offsetDelta, token.type, token.language));
                }
            }
            else {
                this._tokens = this._tokens.concat(nestedResult.tokens);
            }
            this._lastTokenType = null;
            this._lastTokenLanguage = null;
            this._languageId = null;
            return nestedResult.endState;
        }
        finalize(endState) {
            return new languages.TokenizationResult(this._tokens, endState);
        }
    }
    class MonarchModernTokensCollector {
        constructor(languageService, theme) {
            this._languageService = languageService;
            this._theme = theme;
            this._prependTokens = null;
            this._tokens = [];
            this._currentLanguageId = 0 /* LanguageId.Null */;
            this._lastTokenMetadata = 0;
        }
        enterLanguage(languageId) {
            this._currentLanguageId = this._languageService.languageIdCodec.encodeLanguageId(languageId);
        }
        emit(startOffset, type) {
            const metadata = this._theme.match(this._currentLanguageId, type) | 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */;
            if (this._lastTokenMetadata === metadata) {
                return;
            }
            this._lastTokenMetadata = metadata;
            this._tokens.push(startOffset);
            this._tokens.push(metadata);
        }
        static _merge(a, b, c) {
            const aLen = (a !== null ? a.length : 0);
            const bLen = b.length;
            const cLen = (c !== null ? c.length : 0);
            if (aLen === 0 && bLen === 0 && cLen === 0) {
                return new Uint32Array(0);
            }
            if (aLen === 0 && bLen === 0) {
                return c;
            }
            if (bLen === 0 && cLen === 0) {
                return a;
            }
            const result = new Uint32Array(aLen + bLen + cLen);
            if (a !== null) {
                result.set(a);
            }
            for (let i = 0; i < bLen; i++) {
                result[aLen + i] = b[i];
            }
            if (c !== null) {
                result.set(c, aLen + bLen);
            }
            return result;
        }
        nestedLanguageTokenize(embeddedLanguageLine, hasEOL, embeddedLanguageData, offsetDelta) {
            const nestedLanguageId = embeddedLanguageData.languageId;
            const embeddedModeState = embeddedLanguageData.state;
            const nestedLanguageTokenizationSupport = languages.TokenizationRegistry.get(nestedLanguageId);
            if (!nestedLanguageTokenizationSupport) {
                this.enterLanguage(nestedLanguageId);
                this.emit(offsetDelta, '');
                return embeddedModeState;
            }
            const nestedResult = nestedLanguageTokenizationSupport.tokenizeEncoded(embeddedLanguageLine, hasEOL, embeddedModeState);
            if (offsetDelta !== 0) {
                for (let i = 0, len = nestedResult.tokens.length; i < len; i += 2) {
                    nestedResult.tokens[i] += offsetDelta;
                }
            }
            this._prependTokens = MonarchModernTokensCollector._merge(this._prependTokens, this._tokens, nestedResult.tokens);
            this._tokens = [];
            this._currentLanguageId = 0;
            this._lastTokenMetadata = 0;
            return nestedResult.endState;
        }
        finalize(endState) {
            return new languages.EncodedTokenizationResult(MonarchModernTokensCollector._merge(this._prependTokens, this._tokens, null), endState);
        }
    }
    let MonarchTokenizer = MonarchTokenizer_1 = class MonarchTokenizer extends lifecycle_1.Disposable {
        constructor(languageService, standaloneThemeService, languageId, lexer, _configurationService) {
            super();
            this._configurationService = _configurationService;
            this._languageService = languageService;
            this._standaloneThemeService = standaloneThemeService;
            this._languageId = languageId;
            this._lexer = lexer;
            this._embeddedLanguages = Object.create(null);
            this.embeddedLoaded = Promise.resolve(undefined);
            // Set up listening for embedded modes
            let emitting = false;
            this._register(languages.TokenizationRegistry.onDidChange((e) => {
                if (emitting) {
                    return;
                }
                let isOneOfMyEmbeddedModes = false;
                for (let i = 0, len = e.changedLanguages.length; i < len; i++) {
                    const language = e.changedLanguages[i];
                    if (this._embeddedLanguages[language]) {
                        isOneOfMyEmbeddedModes = true;
                        break;
                    }
                }
                if (isOneOfMyEmbeddedModes) {
                    emitting = true;
                    languages.TokenizationRegistry.handleChange([this._languageId]);
                    emitting = false;
                }
            }));
            this._maxTokenizationLineLength = this._configurationService.getValue('editor.maxTokenizationLineLength', {
                overrideIdentifier: this._languageId
            });
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.maxTokenizationLineLength')) {
                    this._maxTokenizationLineLength = this._configurationService.getValue('editor.maxTokenizationLineLength', {
                        overrideIdentifier: this._languageId
                    });
                }
            }));
        }
        getLoadStatus() {
            const promises = [];
            for (const nestedLanguageId in this._embeddedLanguages) {
                const tokenizationSupport = languages.TokenizationRegistry.get(nestedLanguageId);
                if (tokenizationSupport) {
                    // The nested language is already loaded
                    if (tokenizationSupport instanceof MonarchTokenizer_1) {
                        const nestedModeStatus = tokenizationSupport.getLoadStatus();
                        if (nestedModeStatus.loaded === false) {
                            promises.push(nestedModeStatus.promise);
                        }
                    }
                    continue;
                }
                if (!languages.TokenizationRegistry.isResolved(nestedLanguageId)) {
                    // The nested language is in the process of being loaded
                    promises.push(languages.TokenizationRegistry.getOrCreate(nestedLanguageId));
                }
            }
            if (promises.length === 0) {
                return {
                    loaded: true
                };
            }
            return {
                loaded: false,
                promise: Promise.all(promises).then(_ => undefined)
            };
        }
        getInitialState() {
            const rootState = MonarchStackElementFactory.create(null, this._lexer.start);
            return MonarchLineStateFactory.create(rootState, null);
        }
        tokenize(line, hasEOL, lineState) {
            if (line.length >= this._maxTokenizationLineLength) {
                return (0, nullTokenize_1.nullTokenize)(this._languageId, lineState);
            }
            const tokensCollector = new MonarchClassicTokensCollector();
            const endLineState = this._tokenize(line, hasEOL, lineState, tokensCollector);
            return tokensCollector.finalize(endLineState);
        }
        tokenizeEncoded(line, hasEOL, lineState) {
            if (line.length >= this._maxTokenizationLineLength) {
                return (0, nullTokenize_1.nullTokenizeEncoded)(this._languageService.languageIdCodec.encodeLanguageId(this._languageId), lineState);
            }
            const tokensCollector = new MonarchModernTokensCollector(this._languageService, this._standaloneThemeService.getColorTheme().tokenTheme);
            const endLineState = this._tokenize(line, hasEOL, lineState, tokensCollector);
            return tokensCollector.finalize(endLineState);
        }
        _tokenize(line, hasEOL, lineState, collector) {
            if (lineState.embeddedLanguageData) {
                return this._nestedTokenize(line, hasEOL, lineState, 0, collector);
            }
            else {
                return this._myTokenize(line, hasEOL, lineState, 0, collector);
            }
        }
        _findLeavingNestedLanguageOffset(line, state) {
            let rules = this._lexer.tokenizer[state.stack.state];
            if (!rules) {
                rules = monarchCommon.findRules(this._lexer, state.stack.state); // do parent matching
                if (!rules) {
                    throw monarchCommon.createError(this._lexer, 'tokenizer state is not defined: ' + state.stack.state);
                }
            }
            let popOffset = -1;
            let hasEmbeddedPopRule = false;
            for (const rule of rules) {
                if (!monarchCommon.isIAction(rule.action) || rule.action.nextEmbedded !== '@pop') {
                    continue;
                }
                hasEmbeddedPopRule = true;
                let regex = rule.resolveRegex(state.stack.state);
                const regexSource = regex.source;
                if (regexSource.substr(0, 4) === '^(?:' && regexSource.substr(regexSource.length - 1, 1) === ')') {
                    const flags = (regex.ignoreCase ? 'i' : '') + (regex.unicode ? 'u' : '');
                    regex = new RegExp(regexSource.substr(4, regexSource.length - 5), flags);
                }
                const result = line.search(regex);
                if (result === -1 || (result !== 0 && rule.matchOnlyAtLineStart)) {
                    continue;
                }
                if (popOffset === -1 || result < popOffset) {
                    popOffset = result;
                }
            }
            if (!hasEmbeddedPopRule) {
                throw monarchCommon.createError(this._lexer, 'no rule containing nextEmbedded: "@pop" in tokenizer embedded state: ' + state.stack.state);
            }
            return popOffset;
        }
        _nestedTokenize(line, hasEOL, lineState, offsetDelta, tokensCollector) {
            const popOffset = this._findLeavingNestedLanguageOffset(line, lineState);
            if (popOffset === -1) {
                // tokenization will not leave nested language
                const nestedEndState = tokensCollector.nestedLanguageTokenize(line, hasEOL, lineState.embeddedLanguageData, offsetDelta);
                return MonarchLineStateFactory.create(lineState.stack, new EmbeddedLanguageData(lineState.embeddedLanguageData.languageId, nestedEndState));
            }
            const nestedLanguageLine = line.substring(0, popOffset);
            if (nestedLanguageLine.length > 0) {
                // tokenize with the nested language
                tokensCollector.nestedLanguageTokenize(nestedLanguageLine, false, lineState.embeddedLanguageData, offsetDelta);
            }
            const restOfTheLine = line.substring(popOffset);
            return this._myTokenize(restOfTheLine, hasEOL, lineState, offsetDelta + popOffset, tokensCollector);
        }
        _safeRuleName(rule) {
            if (rule) {
                return rule.name;
            }
            return '(unknown)';
        }
        _myTokenize(lineWithoutLF, hasEOL, lineState, offsetDelta, tokensCollector) {
            tokensCollector.enterLanguage(this._languageId);
            const lineWithoutLFLength = lineWithoutLF.length;
            const line = (hasEOL && this._lexer.includeLF ? lineWithoutLF + '\n' : lineWithoutLF);
            const lineLength = line.length;
            let embeddedLanguageData = lineState.embeddedLanguageData;
            let stack = lineState.stack;
            let pos = 0;
            let groupMatching = null;
            // See https://github.com/microsoft/monaco-editor/issues/1235
            // Evaluate rules at least once for an empty line
            let forceEvaluation = true;
            while (forceEvaluation || pos < lineLength) {
                const pos0 = pos;
                const stackLen0 = stack.depth;
                const groupLen0 = groupMatching ? groupMatching.groups.length : 0;
                const state = stack.state;
                let matches = null;
                let matched = null;
                let action = null;
                let rule = null;
                let enteringEmbeddedLanguage = null;
                // check if we need to process group matches first
                if (groupMatching) {
                    matches = groupMatching.matches;
                    const groupEntry = groupMatching.groups.shift();
                    matched = groupEntry.matched;
                    action = groupEntry.action;
                    rule = groupMatching.rule;
                    // cleanup if necessary
                    if (groupMatching.groups.length === 0) {
                        groupMatching = null;
                    }
                }
                else {
                    // otherwise we match on the token stream
                    if (!forceEvaluation && pos >= lineLength) {
                        // nothing to do
                        break;
                    }
                    forceEvaluation = false;
                    // get the rules for this state
                    let rules = this._lexer.tokenizer[state];
                    if (!rules) {
                        rules = monarchCommon.findRules(this._lexer, state); // do parent matching
                        if (!rules) {
                            throw monarchCommon.createError(this._lexer, 'tokenizer state is not defined: ' + state);
                        }
                    }
                    // try each rule until we match
                    const restOfLine = line.substr(pos);
                    for (const rule of rules) {
                        if (pos === 0 || !rule.matchOnlyAtLineStart) {
                            matches = restOfLine.match(rule.resolveRegex(state));
                            if (matches) {
                                matched = matches[0];
                                action = rule.action;
                                break;
                            }
                        }
                    }
                }
                // We matched 'rule' with 'matches' and 'action'
                if (!matches) {
                    matches = [''];
                    matched = '';
                }
                if (!action) {
                    // bad: we didn't match anything, and there is no action to take
                    // we need to advance the stream or we get progress trouble
                    if (pos < lineLength) {
                        matches = [line.charAt(pos)];
                        matched = matches[0];
                    }
                    action = this._lexer.defaultToken;
                }
                if (matched === null) {
                    // should never happen, needed for strict null checking
                    break;
                }
                // advance stream
                pos += matched.length;
                // maybe call action function (used for 'cases')
                while (monarchCommon.isFuzzyAction(action) && monarchCommon.isIAction(action) && action.test) {
                    action = action.test(matched, matches, state, pos === lineLength);
                }
                let result = null;
                // set the result: either a string or an array of actions
                if (typeof action === 'string' || Array.isArray(action)) {
                    result = action;
                }
                else if (action.group) {
                    result = action.group;
                }
                else if (action.token !== null && action.token !== undefined) {
                    // do $n replacements?
                    if (action.tokenSubst) {
                        result = monarchCommon.substituteMatches(this._lexer, action.token, matched, matches, state);
                    }
                    else {
                        result = action.token;
                    }
                    // enter embedded language?
                    if (action.nextEmbedded) {
                        if (action.nextEmbedded === '@pop') {
                            if (!embeddedLanguageData) {
                                throw monarchCommon.createError(this._lexer, 'cannot pop embedded language if not inside one');
                            }
                            embeddedLanguageData = null;
                        }
                        else if (embeddedLanguageData) {
                            throw monarchCommon.createError(this._lexer, 'cannot enter embedded language from within an embedded language');
                        }
                        else {
                            enteringEmbeddedLanguage = monarchCommon.substituteMatches(this._lexer, action.nextEmbedded, matched, matches, state);
                        }
                    }
                    // state transformations
                    if (action.goBack) { // back up the stream..
                        pos = Math.max(0, pos - action.goBack);
                    }
                    if (action.switchTo && typeof action.switchTo === 'string') {
                        let nextState = monarchCommon.substituteMatches(this._lexer, action.switchTo, matched, matches, state); // switch state without a push...
                        if (nextState[0] === '@') {
                            nextState = nextState.substr(1); // peel off starting '@'
                        }
                        if (!monarchCommon.findRules(this._lexer, nextState)) {
                            throw monarchCommon.createError(this._lexer, 'trying to switch to a state \'' + nextState + '\' that is undefined in rule: ' + this._safeRuleName(rule));
                        }
                        else {
                            stack = stack.switchTo(nextState);
                        }
                    }
                    else if (action.transform && typeof action.transform === 'function') {
                        throw monarchCommon.createError(this._lexer, 'action.transform not supported');
                    }
                    else if (action.next) {
                        if (action.next === '@push') {
                            if (stack.depth >= this._lexer.maxStack) {
                                throw monarchCommon.createError(this._lexer, 'maximum tokenizer stack size reached: [' +
                                    stack.state + ',' + stack.parent.state + ',...]');
                            }
                            else {
                                stack = stack.push(state);
                            }
                        }
                        else if (action.next === '@pop') {
                            if (stack.depth <= 1) {
                                throw monarchCommon.createError(this._lexer, 'trying to pop an empty stack in rule: ' + this._safeRuleName(rule));
                            }
                            else {
                                stack = stack.pop();
                            }
                        }
                        else if (action.next === '@popall') {
                            stack = stack.popall();
                        }
                        else {
                            let nextState = monarchCommon.substituteMatches(this._lexer, action.next, matched, matches, state);
                            if (nextState[0] === '@') {
                                nextState = nextState.substr(1); // peel off starting '@'
                            }
                            if (!monarchCommon.findRules(this._lexer, nextState)) {
                                throw monarchCommon.createError(this._lexer, 'trying to set a next state \'' + nextState + '\' that is undefined in rule: ' + this._safeRuleName(rule));
                            }
                            else {
                                stack = stack.push(nextState);
                            }
                        }
                    }
                    if (action.log && typeof (action.log) === 'string') {
                        monarchCommon.log(this._lexer, this._lexer.languageId + ': ' + monarchCommon.substituteMatches(this._lexer, action.log, matched, matches, state));
                    }
                }
                // check result
                if (result === null) {
                    throw monarchCommon.createError(this._lexer, 'lexer rule has no well-defined action in rule: ' + this._safeRuleName(rule));
                }
                const computeNewStateForEmbeddedLanguage = (enteringEmbeddedLanguage) => {
                    // support language names, mime types, and language ids
                    const languageId = (this._languageService.getLanguageIdByLanguageName(enteringEmbeddedLanguage)
                        || this._languageService.getLanguageIdByMimeType(enteringEmbeddedLanguage)
                        || enteringEmbeddedLanguage);
                    const embeddedLanguageData = this._getNestedEmbeddedLanguageData(languageId);
                    if (pos < lineLength) {
                        // there is content from the embedded language on this line
                        const restOfLine = lineWithoutLF.substr(pos);
                        return this._nestedTokenize(restOfLine, hasEOL, MonarchLineStateFactory.create(stack, embeddedLanguageData), offsetDelta + pos, tokensCollector);
                    }
                    else {
                        return MonarchLineStateFactory.create(stack, embeddedLanguageData);
                    }
                };
                // is the result a group match?
                if (Array.isArray(result)) {
                    if (groupMatching && groupMatching.groups.length > 0) {
                        throw monarchCommon.createError(this._lexer, 'groups cannot be nested: ' + this._safeRuleName(rule));
                    }
                    if (matches.length !== result.length + 1) {
                        throw monarchCommon.createError(this._lexer, 'matched number of groups does not match the number of actions in rule: ' + this._safeRuleName(rule));
                    }
                    let totalLen = 0;
                    for (let i = 1; i < matches.length; i++) {
                        totalLen += matches[i].length;
                    }
                    if (totalLen !== matched.length) {
                        throw monarchCommon.createError(this._lexer, 'with groups, all characters should be matched in consecutive groups in rule: ' + this._safeRuleName(rule));
                    }
                    groupMatching = {
                        rule: rule,
                        matches: matches,
                        groups: []
                    };
                    for (let i = 0; i < result.length; i++) {
                        groupMatching.groups[i] = {
                            action: result[i],
                            matched: matches[i + 1]
                        };
                    }
                    pos -= matched.length;
                    // call recursively to initiate first result match
                    continue;
                }
                else {
                    // regular result
                    // check for '@rematch'
                    if (result === '@rematch') {
                        pos -= matched.length;
                        matched = ''; // better set the next state too..
                        matches = null;
                        result = '';
                        // Even though `@rematch` was specified, if `nextEmbedded` also specified,
                        // a state transition should occur.
                        if (enteringEmbeddedLanguage !== null) {
                            return computeNewStateForEmbeddedLanguage(enteringEmbeddedLanguage);
                        }
                    }
                    // check progress
                    if (matched.length === 0) {
                        if (lineLength === 0 || stackLen0 !== stack.depth || state !== stack.state || (!groupMatching ? 0 : groupMatching.groups.length) !== groupLen0) {
                            continue;
                        }
                        else {
                            throw monarchCommon.createError(this._lexer, 'no progress in tokenizer in rule: ' + this._safeRuleName(rule));
                        }
                    }
                    // return the result (and check for brace matching)
                    // todo: for efficiency we could pre-sanitize tokenPostfix and substitutions
                    let tokenType = null;
                    if (monarchCommon.isString(result) && result.indexOf('@brackets') === 0) {
                        const rest = result.substr('@brackets'.length);
                        const bracket = findBracket(this._lexer, matched);
                        if (!bracket) {
                            throw monarchCommon.createError(this._lexer, '@brackets token returned but no bracket defined as: ' + matched);
                        }
                        tokenType = monarchCommon.sanitize(bracket.token + rest);
                    }
                    else {
                        const token = (result === '' ? '' : result + this._lexer.tokenPostfix);
                        tokenType = monarchCommon.sanitize(token);
                    }
                    if (pos0 < lineWithoutLFLength) {
                        tokensCollector.emit(pos0 + offsetDelta, tokenType);
                    }
                }
                if (enteringEmbeddedLanguage !== null) {
                    return computeNewStateForEmbeddedLanguage(enteringEmbeddedLanguage);
                }
            }
            return MonarchLineStateFactory.create(stack, embeddedLanguageData);
        }
        _getNestedEmbeddedLanguageData(languageId) {
            if (!this._languageService.isRegisteredLanguageId(languageId)) {
                return new EmbeddedLanguageData(languageId, nullTokenize_1.NullState);
            }
            if (languageId !== this._languageId) {
                // Fire language loading event
                this._languageService.requestBasicLanguageFeatures(languageId);
                languages.TokenizationRegistry.getOrCreate(languageId);
                this._embeddedLanguages[languageId] = true;
            }
            const tokenizationSupport = languages.TokenizationRegistry.get(languageId);
            if (tokenizationSupport) {
                return new EmbeddedLanguageData(languageId, tokenizationSupport.getInitialState());
            }
            return new EmbeddedLanguageData(languageId, nullTokenize_1.NullState);
        }
    };
    exports.MonarchTokenizer = MonarchTokenizer;
    exports.MonarchTokenizer = MonarchTokenizer = MonarchTokenizer_1 = __decorate([
        __param(4, configuration_1.IConfigurationService)
    ], MonarchTokenizer);
    /**
     * Searches for a bracket in the 'brackets' attribute that matches the input.
     */
    function findBracket(lexer, matched) {
        if (!matched) {
            return null;
        }
        matched = monarchCommon.fixCase(lexer, matched);
        const brackets = lexer.brackets;
        for (const bracket of brackets) {
            if (bracket.open === matched) {
                return { token: bracket.token, bracketType: 1 /* monarchCommon.MonarchBracket.Open */ };
            }
            else if (bracket.close === matched) {
                return { token: bracket.token, bracketType: -1 /* monarchCommon.MonarchBracket.Close */ };
            }
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uYXJjaExleGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvY29tbW9uL21vbmFyY2gvbW9uYXJjaExleGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpQmhHLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0lBRTVCOztPQUVHO0lBQ0gsTUFBTSwwQkFBMEI7aUJBRVAsY0FBUyxHQUFHLElBQUksMEJBQTBCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMvRSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQWtDLEVBQUUsS0FBYTtZQUNyRSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBS0QsWUFBWSxhQUFxQjtZQUNoQyxJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztZQUNwQyxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVNLE1BQU0sQ0FBQyxNQUFrQyxFQUFFLEtBQWE7WUFDOUQsSUFBSSxNQUFNLEtBQUssSUFBSSxJQUFJLE1BQU0sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUM1RCxtQ0FBbUM7Z0JBQ25DLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDL0MsQ0FBQztZQUNELElBQUksY0FBYyxHQUFHLG1CQUFtQixDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25FLElBQUksY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsY0FBYyxJQUFJLEdBQUcs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