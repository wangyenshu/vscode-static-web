/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/filters", "vs/base/common/strings"], function (require, exports, arrays_1, filters_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompletionModel = exports.LineContext = void 0;
    class LineContext {
        constructor(leadingLineContent, characterCountDelta) {
            this.leadingLineContent = leadingLineContent;
            this.characterCountDelta = characterCountDelta;
        }
    }
    exports.LineContext = LineContext;
    var Refilter;
    (function (Refilter) {
        Refilter[Refilter["Nothing"] = 0] = "Nothing";
        Refilter[Refilter["All"] = 1] = "All";
        Refilter[Refilter["Incr"] = 2] = "Incr";
    })(Refilter || (Refilter = {}));
    /**
     * Sorted, filtered completion view model
     * */
    class CompletionModel {
        constructor(items, column, lineContext, wordDistance, options, snippetSuggestions, fuzzyScoreOptions = filters_1.FuzzyScoreOptions.default, clipboardText = undefined) {
            this.clipboardText = clipboardText;
            this._snippetCompareFn = CompletionModel._compareCompletionItems;
            this._items = items;
            this._column = column;
            this._wordDistance = wordDistance;
            this._options = options;
            this._refilterKind = 1 /* Refilter.All */;
            this._lineContext = lineContext;
            this._fuzzyScoreOptions = fuzzyScoreOptions;
            if (snippetSuggestions === 'top') {
                this._snippetCompareFn = CompletionModel._compareCompletionItemsSnippetsUp;
            }
            else if (snippetSuggestions === 'bottom') {
                this._snippetCompareFn = CompletionModel._compareCompletionItemsSnippetsDown;
            }
        }
        get lineContext() {
            return this._lineContext;
        }
        set lineContext(value) {
            if (this._lineContext.leadingLineContent !== value.leadingLineContent
                || this._lineContext.characterCountDelta !== value.characterCountDelta) {
                this._refilterKind = this._lineContext.characterCountDelta < value.characterCountDelta && this._filteredItems ? 2 /* Refilter.Incr */ : 1 /* Refilter.All */;
                this._lineContext = value;
            }
        }
        get items() {
            this._ensureCachedState();
            return this._filteredItems;
        }
        getItemsByProvider() {
            this._ensureCachedState();
            return this._itemsByProvider;
        }
        getIncompleteProvider() {
            this._ensureCachedState();
            const result = new Set();
            for (const [provider, items] of this.getItemsByProvider()) {
                if (items.length > 0 && items[0].container.incomplete) {
                    result.add(provider);
                }
            }
            return result;
        }
        get stats() {
            this._ensureCachedState();
            return this._stats;
        }
        _ensureCachedState() {
            if (this._refilterKind !== 0 /* Refilter.Nothing */) {
                this._createCachedState();
            }
        }
        _createCachedState() {
            this._itemsByProvider = new Map();
            const labelLengths = [];
            const { leadingLineContent, characterCountDelta } = this._lineContext;
            let word = '';
            let wordLow = '';
            // incrementally filter less
            const source = this._refilterKind === 1 /* Refilter.All */ ? this._items : this._filteredItems;
            const target = [];
            // picks a score function based on the number of
            // items that we have to score/filter and based on the
            // user-configuration
            const scoreFn = (!this._options.filterGraceful || source.length > 2000) ? filters_1.fuzzyScore : filters_1.fuzzyScoreGracefulAggressive;
            for (let i = 0; i < source.length; i++) {
                const item = source[i];
                if (item.isInvalid) {
                    continue; // SKIP invalid items
                }
                // keep all items by their provider
                const arr = this._itemsByProvider.get(item.provider);
                if (arr) {
                    arr.push(item);
                }
                else {
                    this._itemsByProvider.set(item.provider, [item]);
                }
                // 'word' is that remainder of the current line that we
                // filter and score against. In theory each suggestion uses a
                // different word, but in practice not - that's why we cache
                const overwriteBefore = item.position.column - item.editStart.column;
                const wordLen = overwriteBefore + characterCountDelta - (item.position.column - this._column);
                if (word.length !== wordLen) {
                    word = wordLen === 0 ? '' : leadingLineContent.slice(-wordLen);
                    wordLow = word.toLowerCase();
                }
                // remember the word against which this item was
                // scored
                item.word = word;
                if (wordLen === 0) {
                    // when there is nothing to score against, don't
                    // event try to do. Use a const rank and rely on
                    // the fallback-sort using the initial sort order.
                    // use a score of `-100` because that is out of the
                    // bound of values `fuzzyScore` will return
                    item.score = filters_1.FuzzyScore.Default;
                }
                else {
                    // skip word characters that are whitespace until
                    // we have hit the replace range (overwriteBefore)
                    let wordPos = 0;
                    while (wordPos < overwriteBefore) {
                        const ch = word.charCodeAt(wordPos);
                        if (ch === 32 /* CharCode.Space */ || ch === 9 /* CharCode.Tab */) {
                            wordPos += 1;
                        }
                        else {
                            break;
                        }
                    }
                    if (wordPos >= wordLen) {
                        // the wordPos at which scoring starts is the whole word
                        // and therefore the same rules as not having a word apply
                        item.score = filters_1.FuzzyScore.Default;
                    }
                    else if (typeof item.completion.filterText === 'string') {
                        // when there is a `filterText` it must match the `word`.
                        // if it matches we check with the label to compute highlights
                        // and if that doesn't yield a result we have no highlights,
                        // despite having the match
                        const match = scoreFn(word, wordLow, wordPos, item.completion.filterText, item.filterTextLow, 0, this._fuzzyScoreOptions);
                        if (!match) {
                            continue; // NO match
                        }
                        if ((0, strings_1.compareIgnoreCase)(item.completion.filterText, item.textLabel) === 0) {
                            // filterText and label are actually the same -> use good highlights
                            item.score = match;
                        }
                        else {
                            // re-run the scorer on the label in the hope of a result BUT use the rank
                            // of the filterText-match
                            item.score = (0, filters_1.anyScore)(word, wordLow, wordPos, item.textLabel, item.labelLow, 0);
                            item.score[0] = match[0]; // use score from filterText
                        }
                    }
                    else {
                        // by default match `word` against the `label`
                        const match = scoreFn(word, wordLow, wordPos, item.textLabel, item.labelLow, 0, this._fuzzyScoreOptions);
                        if (!match) {
                            continue; // NO match
                        }
                        item.score = match;
                    }
                }
                item.idx = i;
                item.distance = this._wordDistance.distance(item.position, item.completion);
                target.push(item);
                // update stats
                labelLengths.push(item.textLabel.length);
            }
            this._filteredItems = target.sort(this._snippetCompareFn);
            this._refilterKind = 0 /* Refilter.Nothing */;
            this._stats = {
                pLabelLen: labelLengths.length ?
                    (0, arrays_1.quickSelect)(labelLengths.length - .85, labelLengths, (a, b) => a - b)
                    : 0
            };
        }
        static _compareCompletionItems(a, b) {
            if (a.score[0] > b.score[0]) {
                return -1;
            }
            else if (a.score[0] < b.score[0]) {
                return 1;
            }
            else if (a.distance < b.distance) {
                return -1;
            }
            else if (a.distance > b.distance) {
                return 1;
            }
            else if (a.idx < b.idx) {
                return -1;
            }
            else if (a.idx > b.idx) {
                return 1;
            }
            else {
                return 0;
            }
        }
        static _compareCompletionItemsSnippetsDown(a, b) {
            if (a.completion.kind !== b.completion.kind) {
                if (a.completion.kind === 27 /* CompletionItemKind.Snippet */) {
                    return 1;
                }
                else if (b.completion.kind === 27 /* CompletionItemKind.Snippet */) {
                    return -1;
                }
            }
            return CompletionModel._compareCompletionItems(a, b);
        }
        static _compareCompletionItemsSnippetsUp(a, b) {
            if (a.completion.kind !== b.completion.kind) {
                if (a.completion.kind === 27 /* CompletionItemKind.Snippet */) {
                    return -1;
                }
                else if (b.completion.kind === 27 /* CompletionItemKind.Snippet */) {
                    return 1;
                }
            }
            return CompletionModel._compareCompletionItems(a, b);
        }
    }
    exports.CompletionModel = CompletionModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxldGlvbk1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3VnZ2VzdC9icm93c2VyL2NvbXBsZXRpb25Nb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLE1BQWEsV0FBVztRQUN2QixZQUNVLGtCQUEwQixFQUMxQixtQkFBMkI7WUFEM0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFRO1lBQzFCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBUTtRQUNqQyxDQUFDO0tBQ0w7SUFMRCxrQ0FLQztJQUVELElBQVcsUUFJVjtJQUpELFdBQVcsUUFBUTtRQUNsQiw2Q0FBVyxDQUFBO1FBQ1gscUNBQU8sQ0FBQTtRQUNQLHVDQUFRLENBQUE7SUFDVCxDQUFDLEVBSlUsUUFBUSxLQUFSLFFBQVEsUUFJbEI7SUFFRDs7U0FFSztJQUNMLE1BQWEsZUFBZTtRQWdCM0IsWUFDQyxLQUF1QixFQUN2QixNQUFjLEVBQ2QsV0FBd0IsRUFDeEIsWUFBMEIsRUFDMUIsT0FBK0IsRUFDL0Isa0JBQXdELEVBQ3hELG9CQUFtRCwyQkFBaUIsQ0FBQyxPQUFPLEVBQ25FLGdCQUFvQyxTQUFTO1lBQTdDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQztZQWxCdEMsc0JBQWlCLEdBQUcsZUFBZSxDQUFDLHVCQUF1QixDQUFDO1lBb0I1RSxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztZQUNsQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixJQUFJLENBQUMsYUFBYSx1QkFBZSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcs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