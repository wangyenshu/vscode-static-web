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
define(["require", "exports", "vs/base/common/htmlContent", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/contrib/snippet/browser/snippetParser", "vs/nls", "vs/workbench/contrib/snippets/browser/snippets", "vs/workbench/contrib/snippets/browser/snippetsFile", "vs/base/common/filters", "vs/base/common/stopwatch", "vs/editor/common/languages/languageConfigurationRegistry", "vs/platform/commands/common/commands"], function (require, exports, htmlContent_1, strings_1, position_1, range_1, language_1, snippetParser_1, nls_1, snippets_1, snippetsFile_1, filters_1, stopwatch_1, languageConfigurationRegistry_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetCompletionProvider = exports.SnippetCompletion = void 0;
    const markSnippetAsUsed = '_snippet.markAsUsed';
    commands_1.CommandsRegistry.registerCommand(markSnippetAsUsed, (accessor, ...args) => {
        const snippetsService = accessor.get(snippets_1.ISnippetsService);
        const [first] = args;
        if (first instanceof snippetsFile_1.Snippet) {
            snippetsService.updateUsageTimestamp(first);
        }
    });
    class SnippetCompletion {
        constructor(snippet, range) {
            this.snippet = snippet;
            this.label = { label: snippet.prefix, description: snippet.name };
            this.detail = (0, nls_1.localize)('detail.snippet', "{0} ({1})", snippet.description || snippet.name, snippet.source);
            this.insertText = snippet.codeSnippet;
            this.extensionId = snippet.extensionId;
            this.range = range;
            this.sortText = `${snippet.snippetSource === 3 /* SnippetSource.Extension */ ? 'z' : 'a'}-${snippet.prefix}`;
            this.kind = 27 /* CompletionItemKind.Snippet */;
            this.insertTextRules = 4 /* CompletionItemInsertTextRule.InsertAsSnippet */;
            this.command = { id: markSnippetAsUsed, title: '', arguments: [snippet] };
        }
        resolve() {
            this.documentation = new htmlContent_1.MarkdownString().appendCodeblock('', snippetParser_1.SnippetParser.asInsertText(this.snippet.codeSnippet));
            return this;
        }
        static compareByLabel(a, b) {
            return (0, strings_1.compare)(a.label.label, b.label.label);
        }
    }
    exports.SnippetCompletion = SnippetCompletion;
    let SnippetCompletionProvider = class SnippetCompletionProvider {
        constructor(_languageService, _snippets, _languageConfigurationService) {
            this._languageService = _languageService;
            this._snippets = _snippets;
            this._languageConfigurationService = _languageConfigurationService;
            this._debugDisplayName = 'snippetCompletions';
            //
        }
        async provideCompletionItems(model, position, context) {
            const sw = new stopwatch_1.StopWatch();
            // compute all snippet anchors: word starts and every non word character
            const line = position.lineNumber;
            const word = model.getWordAtPosition(position) ?? { startColumn: position.column, endColumn: position.column, word: '' };
            const lineContentLow = model.getLineContent(position.lineNumber).toLowerCase();
            const lineContentWithWordLow = lineContentLow.substring(0, word.startColumn + word.word.length - 1);
            const anchors = this._computeSnippetPositions(model, line, word, lineContentWithWordLow);
            // loop over possible snippets and match them against the anchors
            const columnOffset = position.column - 1;
            const triggerCharacterLow = context.triggerCharacter?.toLowerCase() ?? '';
            const languageId = this._getLanguageIdAtPosition(model, position);
            const languageConfig = this._languageConfigurationService.getLanguageConfiguration(languageId);
            const snippets = new Set(await this._snippets.getSnippets(languageId));
            const suggestions = [];
            for (const snippet of snippets) {
                if (context.triggerKind === 1 /* CompletionTriggerKind.TriggerCharacter */ && !snippet.prefixLow.startsWith(triggerCharacterLow)) {
                    // strict -> when having trigger characters they must prefix-match
                    continue;
                }
                let candidate;
                for (const anchor of anchors) {
                    if (anchor.prefixLow.match(/^\s/) && !snippet.prefixLow.match(/^\s/)) {
                        // only allow whitespace anchor when snippet prefix starts with whitespace too
                        continue;
                    }
                    if ((0, filters_1.isPatternInWord)(anchor.prefixLow, 0, anchor.prefixLow.length, snippet.prefixLow, 0, snippet.prefixLow.length)) {
                        candidate = anchor;
                        break;
                    }
                }
                if (!candidate) {
                    continue;
                }
                const pos = candidate.startColumn - 1;
                const prefixRestLen = snippet.prefixLow.length - (columnOffset - pos);
                const endsWithPrefixRest = (0, strings_1.compareSubstring)(lineContentLow, snippet.prefixLow, columnOffset, columnOffset + prefixRestLen, columnOffset - pos);
                const startPosition = position.with(undefined, pos + 1);
                let endColumn = endsWithPrefixRest === 0 ? position.column + prefixRestLen : position.column;
                // First check if there is anything to the right of the cursor
                if (columnOffset < lineContentLow.length) {
                    const autoClosingPairs = languageConfig.getAutoClosingPairs();
                    const standardAutoClosingPairConditionals = autoClosingPairs.autoClosingPairsCloseSingleChar.get(lineContentLow[columnOffset]);
                    // If the character to the right of the cursor is a closing character of an autoclosing pair
                    if (standardAutoClosingPairConditionals?.some(p => 
                    // and the start position is the opening character of an autoclosing pair
                    p.open === lineContentLow[startPosition.column - 1] &&
                        // and the snippet prefix contains the opening and closing pair at its edges
                        snippet.prefix.startsWith(p.open) &&
                        snippet.prefix[snippet.prefix.length - 1] === p.close)) {
                        // Eat the character that was likely inserted because of auto-closing pairs
                        endColumn++;
                    }
                }
                const replace = range_1.Range.fromPositions({ lineNumber: line, column: candidate.startColumn }, { lineNumber: line, column: endColumn });
                const insert = replace.setEndPosition(line, position.column);
                suggestions.push(new SnippetCompletion(snippet, { replace, insert }));
                snippets.delete(snippet);
            }
            // add remaing snippets when the current prefix ends in whitespace or when line is empty
            // and when not having a trigger character
            if (!triggerCharacterLow && (/\s/.test(lineContentLow[position.column - 2]) /*end in whitespace */ || !lineContentLow /*empty line*/)) {
                for (const snippet of snippets) {
                    const insert = range_1.Range.fromPositions(position);
                    const replace = lineContentLow.indexOf(snippet.prefixLow, columnOffset) === columnOffset ? insert.setEndPosition(position.lineNumber, position.column + snippet.prefixLow.length) : insert;
                    suggestions.push(new SnippetCompletion(snippet, { replace, insert }));
                }
            }
            // dismbiguate suggestions with same labels
            this._disambiguateSnippets(suggestions);
            return {
                suggestions,
                duration: sw.elapsed()
            };
        }
        _disambiguateSnippets(suggestions) {
            suggestions.sort(SnippetCompletion.compareByLabel);
            for (let i = 0; i < suggestions.length; i++) {
                const item = suggestions[i];
                let to = i + 1;
                for (; to < suggestions.length && item.label === suggestions[to].label; to++) {
                    suggestions[to].label.label = (0, nls_1.localize)('snippetSuggest.longLabel', "{0}, {1}", suggestions[to].label.label, suggestions[to].snippet.name);
                }
                if (to > i + 1) {
                    suggestions[i].label.label = (0, nls_1.localize)('snippetSuggest.longLabel', "{0}, {1}", suggestions[i].label.label, suggestions[i].snippet.name);
                    i = to;
                }
            }
        }
        resolveCompletionItem(item) {
            return (item instanceof SnippetCompletion) ? item.resolve() : item;
        }
        _computeSnippetPositions(model, line, word, lineContentWithWordLow) {
            const result = [];
            for (let column = 1; column < word.startColumn; column++) {
                const wordInfo = model.getWordAtPosition(new position_1.Position(line, column));
                result.push({
                    startColumn: column,
                    prefixLow: lineContentWithWordLow.substring(column - 1),
                    isWord: Boolean(wordInfo)
                });
                if (wordInfo) {
                    column = wordInfo.endColumn;
                    // the character right after a word is an anchor, always
                    result.push({
                        startColumn: wordInfo.endColumn,
                        prefixLow: lineContentWithWordLow.substring(wordInfo.endColumn - 1),
                        isWord: false
                    });
                }
            }
            if (word.word.length > 0 || result.length === 0) {
                result.push({
                    startColumn: word.startColumn,
                    prefixLow: lineContentWithWordLow.substring(word.startColumn - 1),
                    isWord: true
                });
            }
            return result;
        }
        _getLanguageIdAtPosition(model, position) {
            // validate the `languageId` to ensure this is a user
            // facing language with a name and the chance to have
            // snippets, else fall back to the outer language
            model.tokenization.tokenizeIfCheap(position.lineNumber);
            let languageId = model.getLanguageIdAtPosition(position.lineNumber, position.column);
            if (!this._languageService.getLanguageName(languageId)) {
                languageId = model.getLanguageId();
            }
            return languageId;
        }
    };
    exports.SnippetCompletionProvider = SnippetCompletionProvider;
    exports.SnippetCompletionProvider = SnippetCompletionProvider = __decorate([
        __param(0, language_1.ILanguageService),
        __param(1, snippets_1.ISnippetsService),
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], SnippetCompletionProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldENvbXBsZXRpb25Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NuaXBwZXRzL2Jyb3dzZXIvc25pcHBldENvbXBsZXRpb25Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQmhHLE1BQU0saUJBQWlCLEdBQUcscUJBQXFCLENBQUM7SUFFaEQsMkJBQWdCLENBQUMsZUFBZSxDQUFDLGlCQUFpQixFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxFQUFFLEVBQUU7UUFDekUsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDckIsSUFBSSxLQUFLLFlBQVksc0JBQU8sRUFBRSxDQUFDO1lBQzlCLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM3QyxDQUFDO0lBQ0YsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFhLGlCQUFpQjtRQWE3QixZQUNVLE9BQWdCLEVBQ3pCLEtBQW1EO1lBRDFDLFlBQU8sR0FBUCxPQUFPLENBQVM7WUFHekIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEUsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVcsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzRyxJQUFJLENBQUMsVUFBVSxHQUFH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