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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/filters", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/editorFeatures", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/suggest/browser/completionModel", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/suggest/browser/suggestMemory", "vs/editor/contrib/suggest/browser/suggestModel", "vs/editor/contrib/suggest/browser/wordDistance", "vs/platform/clipboard/common/clipboardService"], function (require, exports, cancellation_1, filters_1, iterator_1, lifecycle_1, codeEditorService_1, range_1, editorFeatures_1, languageFeatures_1, completionModel_1, suggest_1, suggestMemory_1, suggestModel_1, wordDistance_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestInlineCompletions = void 0;
    class SuggestInlineCompletion {
        constructor(range, insertText, filterText, additionalTextEdits, command, completion) {
            this.range = range;
            this.insertText = insertText;
            this.filterText = filterText;
            this.additionalTextEdits = additionalTextEdits;
            this.command = command;
            this.completion = completion;
        }
    }
    let InlineCompletionResults = class InlineCompletionResults extends lifecycle_1.RefCountedDisposable {
        constructor(model, line, word, completionModel, completions, _suggestMemoryService) {
            super(completions.disposable);
            this.model = model;
            this.line = line;
            this.word = word;
            this.completionModel = completionModel;
            this._suggestMemoryService = _suggestMemoryService;
        }
        canBeReused(model, line, word) {
            return this.model === model // same model
                && this.line === line
                && this.word.word.length > 0
                && this.word.startColumn === word.startColumn && this.word.endColumn < word.endColumn // same word
                && this.completionModel.getIncompleteProvider().size === 0; // no incomplete results
        }
        get items() {
            const result = [];
            // Split items by preselected index. This ensures the memory-selected item shows first and that better/worst
            // ranked items are before/after
            const { items } = this.completionModel;
            const selectedIndex = this._suggestMemoryService.select(this.model, { lineNumber: this.line, column: this.word.endColumn + this.completionModel.lineContext.characterCountDelta }, items);
            const first = iterator_1.Iterable.slice(items, selectedIndex);
            const second = iterator_1.Iterable.slice(items, 0, selectedIndex);
            let resolveCount = 5;
            for (const item of iterator_1.Iterable.concat(first, second)) {
                if (item.score === filters_1.FuzzyScore.Default) {
                    // skip items that have no overlap
                    continue;
                }
                const range = new range_1.Range(item.editStart.lineNumber, item.editStart.column, item.editInsertEnd.lineNumber, item.editInsertEnd.column + this.completionModel.lineContext.characterCountDelta // end PLUS character delta
                );
                const insertText = item.completion.insertTextRules && (item.completion.insertTextRules & 4 /* CompletionItemInsertTextRule.InsertAsSnippet */)
                    ? { snippet: item.completion.insertText }
                    : item.completion.insertText;
                result.push(new SuggestInlineCompletion(range, insertText, item.filterTextLow ?? item.labelLow, item.completion.additionalTextEdits, item.completion.command, item));
                // resolve the first N suggestions eagerly
                if (resolveCount-- >= 0) {
                    item.resolve(cancellation_1.CancellationToken.None);
                }
            }
            return result;
        }
    };
    InlineCompletionResults = __decorate([
        __param(5, suggestMemory_1.ISuggestMemoryService)
    ], InlineCompletionResults);
    let SuggestInlineCompletions = class SuggestInlineCompletions extends lifecycle_1.Disposable {
        constructor(_languageFeatureService, _clipboardService, _suggestMemoryService, _editorService) {
            super();
            this._languageFeatureService = _languageFeatureService;
            this._clipboardService = _clipboardService;
            this._suggestMemoryService = _suggestMemoryService;
            this._editorService = _editorService;
            this._store.add(_languageFeatureService.inlineCompletionsProvider.register('*', this));
        }
        async provideInlineCompletions(model, position, context, token) {
            if (context.selectedSuggestionInfo) {
                return;
            }
            let editor;
            for (const candidate of this._editorService.listCodeEditors()) {
                if (candidate.getModel() === model) {
                    editor = candidate;
                    break;
                }
            }
            if (!editor) {
                return;
            }
            const config = editor.getOption(89 /* EditorOption.quickSuggestions */);
            if (suggest_1.QuickSuggestionsOptions.isAllOff(config)) {
                // quick suggest is off (for this model/language)
                return;
            }
            model.tokenization.tokenizeIfCheap(position.lineNumber);
            const lineTokens = model.tokenization.getLineTokens(position.lineNumber);
            const tokenType = lineTokens.getStandardTokenType(lineTokens.findTokenIndexAtOffset(Math.max(position.column - 1 - 1, 0)));
            if (suggest_1.QuickSuggestionsOptions.valueFor(config, tokenType) !== 'inline') {
                // quick suggest is off (for this token)
                return undefined;
            }
            // We consider non-empty leading words and trigger characters. The latter only
            // when no word is being typed (word characters superseed trigger characters)
            let wordInfo = model.getWordAtPosition(position);
            let triggerCharacterInfo;
            if (!wordInfo?.word) {
                triggerCharacterInfo = this._getTriggerCharacterInfo(model, position);
            }
            if (!wordInfo?.word && !triggerCharacterInfo) {
                // not at word, not a trigger character
                return;
            }
            // ensure that we have word information and that we are at the end of a word
            // otherwise we stop because we don't want to do quick suggestions inside words
            if (!wordInfo) {
                wordInfo = model.getWordUntilPosition(position);
            }
            if (wordInfo.endColumn !== position.column) {
                return;
            }
            let result;
            const leadingLineContents = model.getValueInRange(new range_1.Range(position.lineNumber, 1, position.lineNumber, position.column));
            if (!triggerCharacterInfo && this._lastResult?.canBeReused(model, position.lineNumber, wordInfo)) {
                // reuse a previous result iff possible, only a refilter is needed
                // TODO@jrieken this can be improved further and only incomplete results can be updated
                // console.log(`REUSE with ${wordInfo.word}`);
                const newLineContext = new completionModel_1.LineContext(leadingLineContents, position.column - this._lastResult.word.endColumn);
                this._lastResult.completionModel.lineContext = newLineContext;
                this._lastResult.acquire();
                result = this._lastResult;
            }
            else {
                // refesh model is required
                const completions = await (0, suggest_1.provideSuggestionItems)(this._languageFeatureService.completionProvider, model, position, new suggest_1.CompletionOptions(undefined, suggestModel_1.SuggestModel.createSuggestFilter(editor).itemKind, triggerCharacterInfo?.providers), triggerCharacterInfo && { triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */, triggerCharacter: triggerCharacterInfo.ch }, token);
                let clipboardText;
                if (completions.needsClipboard) {
                    clipboardText = await this._clipboardService.readText();
                }
                const completionModel = new completionModel_1.CompletionModel(completions.items, position.column, new completionModel_1.LineContext(leadingLineContents, 0), wordDistance_1.WordDistance.None, editor.getOption(118 /* EditorOption.suggest */), editor.getOption(112 /* EditorOption.snippetSuggestions */), { boostFullMatch: false, firstMatchCanBeWeak: false }, clipboardText);
                result = new InlineCompletionResults(model, position.lineNumber, wordInfo, completionModel, completions, this._suggestMemoryService);
            }
            this._lastResult = result;
            return result;
        }
        handleItemDidShow(_completions, item) {
            item.completion.resolve(cancellation_1.CancellationToken.None);
        }
        freeInlineCompletions(result) {
            result.release();
        }
        _getTriggerCharacterInfo(model, position) {
            const ch = model.getValueInRange(range_1.Range.fromPositions({ lineNumber: position.lineNumber, column: position.column - 1 }, position));
            const providers = new Set();
            for (const provider of this._languageFeatureService.completionProvider.all(model)) {
                if (provider.triggerCharacters?.includes(ch)) {
                    providers.add(provider);
                }
            }
            if (providers.size === 0) {
                return undefined;
            }
            return { providers, ch };
        }
    };
    exports.SuggestInlineCompletions = SuggestInlineCompletions;
    exports.SuggestInlineCompletions = SuggestInlineCompletions = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, clipboardService_1.IClipboardService),
        __param(2, suggestMemory_1.ISuggestMemoryService),
        __param(3, codeEditorService_1.ICodeEditorService)
    ], SuggestInlineCompletions);
    (0, editorFeatures_1.registerEditorFeature)(SuggestInlineCompletions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdElubGluZUNvbXBsZXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3VnZ2VzdC9icm93c2VyL3N1Z2dlc3RJbmxpbmVDb21wbGV0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QmhHLE1BQU0sdUJBQXVCO1FBRTVCLFlBQ1UsS0FBYSxFQUNiLFVBQXdDLEVBQ3hDLFVBQWtCLEVBQ2xCLG1CQUF1RCxFQUN2RCxPQUE0QixFQUM1QixVQUEwQjtZQUwxQixVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2IsZUFBVSxHQUFWLFVBQVUsQ0FBOEI7WUFDeEMsZUFBVSxHQUFWLFVBQVUsQ0FBUTtZQUNsQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQW9DO1lBQ3ZELFlBQU8sR0FBUCxPQUFPLENBQXFCO1lBQzVCLGVBQVUsR0FBVixVQUFVLENBQWdCO1FBQ2hDLENBQUM7S0FDTDtJQUVELElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsZ0NBQW9CO1FBRXpELFlBQ1UsS0FBaUIsRUFDakIsSUFBWSxFQUNaLElBQXFCLEVBQ3JCLGVBQWdDLEVBQ3pDLFdBQWdDLEVBQ1EscUJBQTRDO1lBRXBGLEtBQUssQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFQckIsVUFBSyxHQUFMLEtBQUssQ0FBWTtZQUNqQixTQUFJLEdBQUosSUFBSSxDQUFRO1lBQ1osU0FBSSxHQUFKLElBQUksQ0FBaUI7WUFDckIsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBRUQsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtRQUdyRixDQUFDO1FBRUQsV0FBVyxDQUFDLEtBQWlCLEVBQUUsSUFBWSxFQUFFLElBQXFCO1lBQ2pFLE9BQU8sSUFBSSxDQUFD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