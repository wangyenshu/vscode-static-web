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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/core/selection", "vs/editor/common/services/editorWorker", "vs/editor/contrib/suggest/browser/wordDistance", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "./completionModel", "./suggest", "vs/editor/common/services/languageFeatures", "vs/base/common/filters", "vs/base/common/types", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionContextKeys", "vs/editor/contrib/snippet/browser/snippetController2", "vs/platform/environment/common/environment"], function (require, exports, async_1, cancellation_1, errors_1, event_1, lifecycle_1, strings_1, selection_1, editorWorker_1, wordDistance_1, clipboardService_1, configuration_1, contextkey_1, log_1, telemetry_1, completionModel_1, suggest_1, languageFeatures_1, filters_1, types_1, inlineCompletionContextKeys_1, snippetController2_1, environment_1) {
    "use strict";
    var SuggestModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestModel = exports.State = exports.LineContext = void 0;
    class LineContext {
        static shouldAutoTrigger(editor) {
            if (!editor.hasModel()) {
                return false;
            }
            const model = editor.getModel();
            const pos = editor.getPosition();
            model.tokenization.tokenizeIfCheap(pos.lineNumber);
            const word = model.getWordAtPosition(pos);
            if (!word) {
                return false;
            }
            if (word.endColumn !== pos.column &&
                word.startColumn + 1 !== pos.column /* after typing a single character before a word */) {
                return false;
            }
            if (!isNaN(Number(word.word))) {
                return false;
            }
            return true;
        }
        constructor(model, position, triggerOptions) {
            this.leadingLineContent = model.getLineContent(position.lineNumber).substr(0, position.column - 1);
            this.leadingWord = model.getWordUntilPosition(position);
            this.lineNumber = position.lineNumber;
            this.column = position.column;
            this.triggerOptions = triggerOptions;
        }
    }
    exports.LineContext = LineContext;
    var State;
    (function (State) {
        State[State["Idle"] = 0] = "Idle";
        State[State["Manual"] = 1] = "Manual";
        State[State["Auto"] = 2] = "Auto";
    })(State || (exports.State = State = {}));
    function canShowQuickSuggest(editor, contextKeyService, configurationService) {
        if (!Boolean(contextKeyService.getContextKeyValue(inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible.key))) {
            // Allow if there is no inline suggestion.
            return true;
        }
        const suppressSuggestions = contextKeyService.getContextKeyValue(inlineCompletionContextKeys_1.InlineCompletionContextKeys.suppressSuggestions.key);
        if (suppressSuggestions !== undefined) {
            return !suppressSuggestions;
        }
        return !editor.getOption(62 /* EditorOption.inlineSuggest */).suppressSuggestions;
    }
    function canShowSuggestOnTriggerCharacters(editor, contextKeyService, configurationService) {
        if (!Boolean(contextKeyService.getContextKeyValue('inlineSuggestionVisible'))) {
            // Allow if there is no inline suggestion.
            return true;
        }
        const suppressSuggestions = contextKeyService.getContextKeyValue(inlineCompletionContextKeys_1.InlineCompletionContextKeys.suppressSuggestions.key);
        if (suppressSuggestions !== undefined) {
            return !suppressSuggestions;
        }
        return !editor.getOption(62 /* EditorOption.inlineSuggest */).suppressSuggestions;
    }
    let SuggestModel = SuggestModel_1 = class SuggestModel {
        constructor(_editor, _editorWorkerService, _clipboardService, _telemetryService, _logService, _contextKeyService, _configurationService, _languageFeaturesService, _envService) {
            this._editor = _editor;
            this._editorWorkerService = _editorWorkerService;
            this._clipboardService = _clipboardService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._languageFeaturesService = _languageFeaturesService;
            this._envService = _envService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._triggerCharacterListener = new lifecycle_1.DisposableStore();
            this._triggerQuickSuggest = new async_1.TimeoutTimer();
            this._triggerState = undefined;
            this._completionDisposables = new lifecycle_1.DisposableStore();
            this._onDidCancel = new event_1.Emitter();
            this._onDidTrigger = new event_1.Emitter();
            this._onDidSuggest = new event_1.Emitter();
            this.onDidCancel = this._onDidCancel.event;
            this.onDidTrigger = this._onDidTrigger.event;
            this.onDidSuggest = this._onDidSuggest.event;
            this._telemetryGate = 0;
            this._currentSelection = this._editor.getSelection() || new selection_1.Selection(1, 1, 1, 1);
            // wire up various listeners
            this._toDispose.add(this._editor.onDidChangeModel(() => {
                this._updateTriggerCharacters();
                this.cancel();
            }));
            this._toDispose.add(this._editor.onDidChangeModelLanguage(() => {
                this._updateTriggerCharacters();
                this.cancel();
            }));
            this._toDispose.add(this._editor.onDidChangeConfiguration(() => {
                this._updateTriggerCharacters();
            }));
            this._toDispose.add(this._languageFeaturesService.completionProvider.onDidChange(() => {
                this._updateTriggerCharacters();
                this._updateActiveSuggestSession();
            }));
            let editorIsComposing = false;
            this._toDispose.add(this._editor.onDidCompositionStart(() => {
                editorIsComposing = true;
            }));
            this._toDispose.add(this._editor.onDidCompositionEnd(() => {
                editorIsComposing = false;
                this._onCompositionEnd();
            }));
            this._toDispose.add(this._editor.onDidChangeCursorSelection(e => {
                // only trigger suggest when the editor isn't composing a character
                if (!editorIsComposing) {
                    this._onCursorChange(e);
                }
            }));
            this._toDispose.add(this._editor.onDidChangeModelContent(() => {
                // only filter completions when the editor isn't composing a character
                // allow-any-unicode-next-line
                // e.g. ¨ + u makes ü but just ¨ cannot be used for filtering
                if (!editorIsComposing && this._triggerState !== undefined) {
                    this._refilterCompletionItems();
                }
            }));
            this._updateTriggerCharacters();
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._triggerCharacterListener);
            (0, lifecycle_1.dispose)([this._onDidCancel, this._onDidSuggest, this._onDidTrigger, this._triggerQuickSuggest]);
            this._toDispose.dispose();
            this._completionDisposables.dispose();
            this.cancel();
        }
        _updateTriggerCharacters() {
            this._triggerCharacterListener.clear();
            if (this._editor.getOption(91 /* EditorOption.readOnly */)
                || !this._editor.hasModel()
                || !this._editor.getOption(121 /* EditorOption.suggestOnTriggerCharacters */)) {
                return;
            }
            const supportsByTriggerCharacter = new Map();
            for (const support of this._languageFeaturesService.completionProvider.all(this._editor.getModel())) {
                for (const ch of support.triggerCharacters || []) {
                    let set = supportsByTriggerCharacter.get(ch);
                    if (!set) {
                        set = new Set();
                        set.add((0, suggest_1.getSnippetSuggestSupport)());
                        supportsByTriggerCharacter.set(ch, set);
                    }
                    set.add(support);
                }
            }
            const checkTriggerCharacter = (text) => {
                if (!canShowSuggestOnTriggerCharacters(this._editor, this._contextKeyService, this._configurationService)) {
                    return;
                }
                if (LineContext.shouldAutoTrigger(this._editor)) {
                    // don't trigger by trigger characters when this is a case for quick suggest
                    return;
                }
                if (!text) {
                    // came here from the compositionEnd-event
                    const position = this._editor.getPosition();
                    const model = this._editor.getModel();
                    text = model.getLineContent(position.lineNumber).substr(0, position.column - 1);
                }
                let lastChar = '';
                if ((0, strings_1.isLowSurrogate)(text.charCodeAt(text.length - 1))) {
                    if ((0, strings_1.isHighSurrogate)(text.charCodeAt(text.length - 2))) {
                        lastChar = text.substr(text.length - 2);
                    }
                }
                else {
                    lastChar = text.charAt(text.length - 1);
                }
                const supports = supportsByTriggerCharacter.get(lastChar);
                if (supports) {
                    // keep existing items that where not computed by the
                    // supports/providers that want to trigger now
                    const providerItemsToReuse = new Map();
                    if (this._completionModel) {
                        for (const [provider, items] of this._completionModel.getItemsByProvider()) {
                            if (!supports.has(provider)) {
                                providerItemsToReuse.set(provider, items);
                            }
                        }
                    }
                    this.trigger({
                        auto: true,
                        triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */,
                        triggerCharacter: lastChar,
                        retrigger: Boolean(this._completionModel),
                        clipboardText: this._completionModel?.clipboardText,
                        completionOptions: { providerFilter: supports, providerItemsToReuse }
                    });
                }
            };
            this._triggerCharacterListener.add(this._editor.onDidType(checkTriggerCharacter));
            this._triggerCharacterListener.add(this._editor.onDidCompositionEnd(() => checkTriggerCharacter()));
        }
        // --- trigger/retrigger/cancel suggest
        get state() {
            if (!this._triggerState) {
                return 0 /* State.Idle */;
            }
            else if (!this._triggerState.auto) {
                return 1 /* State.Manual */;
            }
            else {
                return 2 /* State.Auto */;
            }
        }
        cancel(retrigger = false) {
            if (this._triggerState !== undefined) {
                this._triggerQuickSuggest.cancel();
                this._requestToken?.cancel();
                this._requestToken = undefined;
                this._triggerState = undefined;
                this._completionModel = undefined;
                this._context = undefined;
                this._onDidCancel.fire({ retrigger });
            }
        }
        clear() {
            this._completionDisposables.clear();
        }
        _updateActiveSuggestSession() {
            if (this._triggerState !== undefined) {
                if (!this._editor.hasModel() || !this._languageFeaturesService.completionProvider.has(this._editor.getModel())) {
                    this.cancel();
                }
                else {
                    this.trigger({ auto: this._triggerState.auto, retrigger: true });
                }
            }
        }
        _onCursorChange(e) {
            if (!this._editor.hasModel()) {
                return;
            }
            const prevSelection = this._currentSelection;
            this._currentSelection = this._editor.getSelection();
            if (!e.selection.isEmpty()
                || (e.reason !== 0 /* CursorChangeReason.NotSet */ && e.reason !== 3 /* CursorChangeReason.Explicit */)
                || (e.source !== 'keyboard' && e.source !== 'deleteLeft')) {
                // Early exit if nothing needs to be done!
                // Leave some form of early exit check here if you wish to continue being a cursor position change listener ;)
                this.cancel();
                return;
            }
            if (this._triggerState === undefined && e.reason === 0 /* CursorChangeReason.NotSet */) {
                if (prevSelection.containsRange(this._currentSelection) || prevSelection.getEndPosition().isBeforeOrEqual(this._currentSelection.getPosition())) {
                    // cursor did move RIGHT due to typing -> trigger quick suggest
                    this._doTriggerQuickSuggest();
                }
            }
            else if (this._triggerState !== undefined && e.reason === 3 /* CursorChangeReason.Explicit */) {
                // suggest is active and something like cursor keys are used to move
                // the cursor. this means we can refilter at the new position
                this._refilterCompletionItems();
            }
        }
        _onCompositionEnd() {
            // trigger or refilter when composition ends
            if (this._triggerState === undefined) {
                this._doTriggerQuickSuggest();
            }
            else {
                this._refilterCompletionItems();
            }
        }
        _doTriggerQuickSuggest() {
            if (suggest_1.QuickSuggestionsOptions.isAllOff(this._editor.getOption(89 /* EditorOption.quickSuggestions */))) {
                // not enabled
                return;
            }
            if (this._editor.getOption(118 /* EditorOption.suggest */).snippetsPreventQuickSuggestions && snippetController2_1.SnippetController2.get(this._editor)?.isInSnippet()) {
                // no quick suggestion when in snippet mode
                return;
            }
            this.cancel();
            this._triggerQuickSuggest.cancelAndSet(() => {
                if (this._triggerState !== undefined) {
                    return;
                }
                if (!LineContext.shouldAutoTrigger(this._editor)) {
                    return;
                }
                if (!this._editor.hasModel() || !this._editor.hasWidgetFocus()) {
                    return;
                }
                const model = this._editor.getModel();
                const pos = this._editor.getPosition();
                // validate enabled now
                const config = this._editor.getOption(89 /* EditorOption.quickSuggestions */);
                if (suggest_1.QuickSuggestionsOptions.isAllOff(config)) {
                    return;
                }
                if (!suggest_1.QuickSuggestionsOptions.isAllOn(config)) {
                    // Check the type of the token that triggered this
                    model.tokenization.tokenizeIfCheap(pos.lineNumber);
                    const lineTokens = model.tokenization.getLineTokens(pos.lineNumber);
                    const tokenType = lineTokens.getStandardTokenType(lineTokens.findTokenIndexAtOffset(Math.max(pos.column - 1 - 1, 0)));
                    if (suggest_1.QuickSuggestionsOptions.valueFor(config, tokenType) !== 'on') {
                        return;
                    }
                }
                if (!canShowQuickSuggest(this._editor, this._contextKeyService, this._configurationService)) {
                    // do not trigger quick suggestions if inline suggestions are shown
                    return;
                }
                if (!this._languageFeaturesService.completionProvider.has(model)) {
                    return;
                }
                // we made it till here -> trigger now
                this.trigger({ auto: true });
            }, this._editor.getOption(90 /* EditorOption.quickSuggestionsDelay */));
        }
        _refilterCompletionItems() {
            (0, types_1.assertType)(this._editor.hasModel());
            (0, types_1.assertType)(this._triggerState !== undefined);
            const model = this._editor.getModel();
            const position = this._editor.getPosition();
            const ctx = new LineContext(model, position, { ...this._triggerState, refilter: true });
            this._onNewContext(ctx);
        }
        trigger(options) {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            const ctx = new LineContext(model, this._editor.getPosition(), options);
            // Cancel previous requests, change state & update UI
            this.cancel(options.retrigger);
            this._triggerState = options;
            this._onDidTrigger.fire({ auto: options.auto, shy: options.shy ?? false, position: this._editor.getPosition() });
            // Capture context when request was sent
            this._context = ctx;
            // Build context for request
            let suggestCtx = { triggerKind: options.triggerKind ?? 0 /* CompletionTriggerKind.Invoke */ };
            if (options.triggerCharacter) {
                suggestCtx = {
                    triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */,
                    triggerCharacter: options.triggerCharacter
                };
            }
            this._requestToken = new cancellation_1.CancellationTokenSource();
            // kind filter and snippet sort rules
            const snippetSuggestions = this._editor.getOption(112 /* EditorOption.snippetSuggestions */);
            let snippetSortOrder = 1 /* SnippetSortOrder.Inline */;
            switch (snippetSuggestions) {
                case 'top':
                    snippetSortOrder = 0 /* SnippetSortOrder.Top */;
                    break;
                // 	↓ that's the default anyways...
                // case 'inline':
                // 	snippetSortOrder = SnippetSortOrder.Inline;
                // 	break;
                case 'bottom':
                    snippetSortOrder = 2 /* SnippetSortOrder.Bottom */;
                    break;
            }
            const { itemKind: itemKindFilter, showDeprecated } = SuggestModel_1.createSuggestFilter(this._editor);
            const completionOptions = new suggest_1.CompletionOptions(snippetSortOrder, options.completionOptions?.kindFilter ?? itemKindFilter, options.completionOptions?.providerFilter, options.completionOptions?.providerItemsToReuse, showDeprecated);
            const wordDistance = wordDistance_1.WordDistance.create(this._editorWorkerService, this._editor);
            const completions = (0, suggest_1.provideSuggestionItems)(this._languageFeaturesService.completionProvider, model, this._editor.getPosition(), completionOptions, suggestCtx, this._requestToken.token);
            Promise.all([completions, wordDistance]).then(async ([completions, wordDistance]) => {
                this._requestToken?.dispose();
                if (!this._editor.hasModel()) {
                    return;
                }
                let clipboardText = options?.clipboardText;
                if (!clipboardText && completions.needsClipboard) {
                    clipboardText = await this._clipboardService.readText();
                }
                if (this._triggerState === undefined) {
                    return;
                }
                const model = this._editor.getModel();
                // const items = completions.items;
                // if (existing) {
                // 	const cmpFn = getSuggestionComparator(snippetSortOrder);
                // 	items = items.concat(existing.items).sort(cmpFn);
                // }
                const ctx = new LineContext(model, this._editor.getPosition(), options);
                const fuzzySearchOptions = {
                    ...filters_1.FuzzyScoreOptions.default,
                    firstMatchCanBeWeak: !this._editor.getOption(118 /* EditorOption.suggest */).matchOnWordStartOnly
                };
                this._completionModel = new completionModel_1.CompletionModel(completions.items, this._context.column, {
                    leadingLineContent: ctx.leadingLineContent,
                    characterCountDelta: ctx.column - this._context.column
                }, wordDistance, this._editor.getOption(118 /* EditorOption.suggest */), this._editor.getOption(112 /* EditorOption.snippetSuggestions */), fuzzySearchOptions, clipboardText);
                // store containers so that they can be disposed later
                this._completionDisposables.add(completions.disposable);
                this._onNewContext(ctx);
                // finally report telemetry about durations
                this._reportDurationsTelemetry(completions.durations);
                // report invalid completions by source
                if (!this._envService.isBuilt || this._envService.isExtensionDevelopment) {
                    for (const item of completions.items) {
                        if (item.isInvalid) {
                            this._logService.warn(`[suggest] did IGNORE invalid completion item from ${item.provider._debugDisplayName}`, item.completion);
                        }
                    }
                }
            }).catch(errors_1.onUnexpectedError);
        }
        _reportDurationsTelemetry(durations) {
            if (this._telemetryGate++ % 230 !== 0) {
                return;
            }
            setTimeout(() => {
                this._telemetryService.publicLog2('suggest.durations.json', { data: JSON.stringify(durations) });
                this._logService.debug('suggest.durations.json', durations);
            });
        }
        static createSuggestFilter(editor) {
            // kind filter and snippet sort rules
            const result = new Set();
            // snippet setting
            const snippetSuggestions = editor.getOption(112 /* EditorOption.snippetSuggestions */);
            if (snippetSuggestions === 'none') {
                result.add(27 /* CompletionItemKind.Snippet */);
            }
            // type setting
            const suggestOptions = editor.getOption(118 /* EditorOption.suggest */);
            if (!suggestOptions.showMethods) {
                result.add(0 /* CompletionItemKind.Method */);
            }
            if (!suggestOptions.showFunctions) {
                result.add(1 /* CompletionItemKind.Function */);
            }
            if (!suggestOptions.showConstructors) {
                result.add(2 /* CompletionItemKind.Constructor */);
            }
            if (!suggestOptions.showFields) {
                result.add(3 /* CompletionItemKind.Field */);
            }
            if (!suggestOptions.showVariables) {
                result.add(4 /* CompletionItemKind.Variable */);
            }
            if (!suggestOptions.showClasses) {
                result.add(5 /* CompletionItemKind.Class */);
            }
            if (!suggestOptions.showStructs) {
                result.add(6 /* CompletionItemKind.Struct */);
            }
            if (!suggestOptions.showInterfaces) {
                result.add(7 /* CompletionItemKind.Interface */);
            }
            if (!suggestOptions.showModules) {
                result.add(8 /* CompletionItemKind.Module */);
            }
            if (!suggestOptions.showProperties) {
                result.add(9 /* CompletionItemKind.Property */);
            }
            if (!suggestOptions.showEvents) {
                result.add(10 /* CompletionItemKind.Event */);
            }
            if (!suggestOptions.showOperators) {
                result.add(11 /* CompletionItemKind.Operator */);
            }
            if (!suggestOptions.showUnits) {
                result.add(12 /* CompletionItemKind.Unit */);
            }
            if (!suggestOptions.showValues) {
                result.add(13 /* CompletionItemKind.Value */);
            }
            if (!suggestOptions.showConstants) {
                result.add(14 /* CompletionItemKind.Constant */);
            }
            if (!suggestOptions.showEnums) {
                result.add(15 /* CompletionItemKind.Enum */);
            }
            if (!suggestOptions.showEnumMembers) {
                result.add(16 /* CompletionItemKind.EnumMember */);
            }
            if (!suggestOptions.showKeywords) {
                result.add(17 /* CompletionItemKind.Keyword */);
            }
            if (!suggestOptions.showWords) {
                result.add(18 /* CompletionItemKind.Text */);
            }
            if (!suggestOptions.showColors) {
                result.add(19 /* CompletionItemKind.Color */);
            }
            if (!suggestOptions.showFiles) {
                result.add(20 /* CompletionItemKind.File */);
            }
            if (!suggestOptions.showReferences) {
                result.add(21 /* CompletionItemKind.Reference */);
            }
            if (!suggestOptions.showColors) {
                result.add(22 /* CompletionItemKind.Customcolor */);
            }
            if (!suggestOptions.showFolders) {
                result.add(23 /* CompletionItemKind.Folder */);
            }
            if (!suggestOptions.showTypeParameters) {
                result.add(24 /* CompletionItemKind.TypeParameter */);
            }
            if (!suggestOptions.showSnippets) {
                result.add(27 /* CompletionItemKind.Snippet */);
            }
            if (!suggestOptions.showUsers) {
                result.add(25 /* CompletionItemKind.User */);
            }
            if (!suggestOptions.showIssues) {
                result.add(26 /* CompletionItemKind.Issue */);
            }
            return { itemKind: result, showDeprecated: suggestOptions.showDeprecated };
        }
        _onNewContext(ctx) {
            if (!this._context) {
                // happens when 24x7 IntelliSense is enabled and still in its delay
                return;
            }
            if (ctx.lineNumber !== this._context.lineNumber) {
                // e.g. happens when pressing Enter while IntelliSense is computed
                this.cancel();
                return;
            }
            if ((0, strings_1.getLeadingWhitespace)(ctx.leadingLineContent) !== (0, strings_1.getLeadingWhitespace)(this._context.leadingLineContent)) {
                // cancel IntelliSense when line start changes
                // happens when the current word gets outdented
                this.cancel();
                return;
            }
            if (ctx.column < this._context.column) {
                // typed -> moved cursor LEFT -> retrigger if still on a word
                if (ctx.leadingWord.word) {
                    this.trigger({ auto: this._context.triggerOptions.auto, retrigger: true });
                }
                else {
                    this.cancel();
                }
                return;
            }
            if (!this._completionModel) {
                // happens when IntelliSense is not yet computed
                return;
            }
            if (ctx.leadingWord.word.length !== 0 && ctx.leadingWord.startColumn > this._context.leadingWord.startColumn) {
                // started a new word while IntelliSense shows -> retrigger but reuse all items that we currently have
                const shouldAutoTrigger = LineContext.shouldAutoTrigger(this._editor);
                if (shouldAutoTrigger && this._context) {
                    // shouldAutoTrigger forces tokenization, which can cause pending cursor change events to be emitted, which can cause
                    // suggestions to be cancelled, which causes `this._context` to be undefined
                    const map = this._completionModel.getItemsByProvider();
                    this.trigger({
                        auto: this._context.triggerOptions.auto,
                        retrigger: true,
                        clipboardText: this._completionModel.clipboardText,
                        completionOptions: { providerItemsToReuse: map }
                    });
                }
                return;
            }
            if (ctx.column > this._context.column && this._completionModel.getIncompleteProvider().size > 0 && ctx.leadingWord.word.length !== 0) {
                // typed -> moved cursor RIGHT & incomple model & still on a word -> retrigger
                const providerItemsToReuse = new Map();
                const providerFilter = new Set();
                for (const [provider, items] of this._completionModel.getItemsByProvider()) {
                    if (items.length > 0 && items[0].container.incomplete) {
                        providerFilter.add(provider);
                    }
                    else {
                        providerItemsToReuse.set(provider, items);
                    }
                }
                this.trigger({
                    auto: this._context.triggerOptions.auto,
                    triggerKind: 2 /* CompletionTriggerKind.TriggerForIncompleteCompletions */,
                    retrigger: true,
                    clipboardText: this._completionModel.clipboardText,
                    completionOptions: { providerFilter, providerItemsToReuse }
                });
            }
            else {
                // typed -> moved cursor RIGHT -> update UI
                const oldLineContext = this._completionModel.lineContext;
                let isFrozen = false;
                this._completionModel.lineContext = {
                    leadingLineContent: ctx.leadingLineContent,
                    characterCountDelta: ctx.column - this._context.column
                };
                if (this._completionModel.items.length === 0) {
                    const shouldAutoTrigger = LineContext.shouldAutoTrigger(this._editor);
                    if (!this._context) {
                        // shouldAutoTrigger forces tokenization, which can cause pending cursor change events to be emitted, which can cause
                        // suggestions to be cancelled, which causes `this._context` to be undefined
                        this.cancel();
                        return;
                    }
                    if (shouldAutoTrigger && this._context.leadingWord.endColumn < ctx.leadingWord.startColumn) {
                        // retrigger when heading into a new word
                        this.trigger({ auto: this._context.triggerOptions.auto, retrigger: true });
                        return;
                    }
                    if (!this._context.triggerOptions.auto) {
                        // freeze when IntelliSense was manually requested
                        this._completionModel.lineContext = oldLineContext;
                        isFrozen = this._completionModel.items.length > 0;
                        if (isFrozen && ctx.leadingWord.word.length === 0) {
                            // there were results before but now there aren't
                            // and also we are not on a word anymore -> cancel
                            this.cancel();
                            return;
                        }
                    }
                    else {
                        // nothing left
                        this.cancel();
                        return;
                    }
                }
                this._onDidSuggest.fire({
                    completionModel: this._completionModel,
                    triggerOptions: ctx.triggerOptions,
                    isFrozen,
                });
            }
        }
    };
    exports.SuggestModel = SuggestModel;
    exports.SuggestModel = SuggestModel = SuggestModel_1 = __decorate([
        __param(1, editorWorker_1.IEditorWorkerService),
        __param(2, clipboardService_1.IClipboardService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, log_1.ILogService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, languageFeatures_1.ILanguageFeaturesService),
        __param(8, environment_1.IEnvironmentService)
    ], SuggestModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3VnZ2VzdC9icm93c2VyL3N1Z2dlc3RNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBMkRoRyxNQUFhLFdBQVc7UUFFdkIsTUFBTSxDQUFDLGlCQUFpQixDQUFDLE1BQW1CO1lBQzNDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNqQyxLQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFbkQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssR0FBRyxDQUFDLE1BQU07Z0JBQ2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUMsbURBQW1ELEVBQUUsQ0FBQztnQkFDMUYsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENB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