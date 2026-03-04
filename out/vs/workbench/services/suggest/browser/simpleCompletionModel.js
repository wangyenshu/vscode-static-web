/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/filters"], function (require, exports, arrays_1, filters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleCompletionModel = exports.LineContext = void 0;
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
    class SimpleCompletionModel {
        constructor(_items, _lineContext, replacementIndex, replacementLength) {
            this._items = _items;
            this._lineContext = _lineContext;
            this.replacementIndex = replacementIndex;
            this.replacementLength = replacementLength;
            this._refilterKind = 1 /* Refilter.All */;
            this._fuzzyScoreOptions = filters_1.FuzzyScoreOptions.default;
            // TODO: Pass in options
            this._options = {};
        }
        get items() {
            this._ensureCachedState();
            return this._filteredItems;
        }
        get stats() {
            this._ensureCachedState();
            return this._stats;
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
        _ensureCachedState() {
            if (this._refilterKind !== 0 /* Refilter.Nothing */) {
                this._createCachedState();
            }
        }
        _createCachedState() {
            // this._providerInfo = new Map();
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
                // if (item.isInvalid) {
                // 	continue; // SKIP invalid items
                // }
                // collect all support, know if their result is incomplete
                // this._providerInfo.set(item.provider, Boolean(item.container.incomplete));
                // 'word' is that remainder of the current line that we
                // filter and score against. In theory each suggestion uses a
                // different word, but in practice not - that's why we cache
                // TODO: Fix
                const overwriteBefore = this.replacementLength; // item.position.column - item.editStart.column;
                const wordLen = overwriteBefore + characterCountDelta; // - (item.position.column - this._column);
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
                        // } else if (typeof item.completion.filterText === 'string') {
                        // 	// when there is a `filterText` it must match the `word`.
                        // 	// if it matches we check with the label to compute highlights
                        // 	// and if that doesn't yield a result we have no highlights,
                        // 	// despite having the match
                        // 	const match = scoreFn(word, wordLow, wordPos, item.completion.filterText, item.filterTextLow!, 0, this._fuzzyScoreOptions);
                        // 	if (!match) {
                        // 		continue; // NO match
                        // 	}
                        // 	if (compareIgnoreCase(item.completion.filterText, item.textLabel) === 0) {
                        // 		// filterText and label are actually the same -> use good highlights
                        // 		item.score = match;
                        // 	} else {
                        // 		// re-run the scorer on the label in the hope of a result BUT use the rank
                        // 		// of the filterText-match
                        // 		item.score = anyScore(word, wordLow, wordPos, item.textLabel, item.labelLow, 0);
                        // 		item.score[0] = match[0]; // use score from filterText
                        // 	}
                    }
                    else {
                        // by default match `word` against the `label`
                        const match = scoreFn(word, wordLow, wordPos, item.completion.label, item.labelLow, 0, this._fuzzyScoreOptions);
                        if (!match) {
                            continue; // NO match
                        }
                        item.score = match;
                    }
                }
                item.idx = i;
                target.push(item);
                // update stats
                labelLengths.push(item.completion.label.length);
            }
            this._filteredItems = target.sort((a, b) => b.score[0] - a.score[0]);
            this._refilterKind = 0 /* Refilter.Nothing */;
            this._stats = {
                pLabelLen: labelLengths.length ?
                    (0, arrays_1.quickSelect)(labelLengths.length - .85, labelLengths, (a, b) => a - b)
                    : 0
            };
        }
    }
    exports.SimpleCompletionModel = SimpleCompletionModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlQ29tcGxldGlvbk1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3N1Z2dlc3QvYnJvd3Nlci9zaW1wbGVDb21wbGV0aW9uTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEsV0FBVztRQUN2QixZQUNVLGtCQUEwQixFQUMxQixtQkFBMkI7WUFEM0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFRO1lBQzFCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBUTtRQUNqQyxDQUFDO0tBQ0w7SUFMRCxrQ0FLQztJQUVELElBQVcsUUFJVjtJQUpELFdBQVcsUUFBUTtRQUNsQiw2Q0FBVyxDQUFBO1FBQ1gscUNBQU8sQ0FBQTtRQUNQLHVDQUFRLENBQUE7SUFDVCxDQUFDLEVBSlUsUUFBUSxLQUFSLFFBQVEsUUFJbEI7SUFFRCxNQUFhLHFCQUFxQjtRQVdqQyxZQUNrQixNQUE4QixFQUN2QyxZQUF5QixFQUN4QixnQkFBd0IsRUFDeEIsaUJBQXlCO1lBSGpCLFdBQU0sR0FBTixNQUFNLENBQXdCO1lBQ3ZDLGlCQUFZLEdBQVosWUFBWSxDQUFhO1lBQ3hCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBUTtZQUN4QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQVE7WUFaM0Isa0JBQWEsd0JBQTBCO1lBQ3ZDLHVCQUFrQixHQUFrQywyQkFBaUIsQ0FBQyxPQUFPLENBQUM7WUFFdEYsd0JBQXdCO1lBQ2hCLGFBQVEsR0FFWixFQUFFLENBQUM7UUFRUCxDQUFDO1FBRUQsSUFBSSxLQUFLO1lBQ1IsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDMUIsT0FBTyxJQUFJLENBQUMsY0FBZSxDQUFDO1FBQzdCLENBQUM7UUFFRCxJQUFJLEtBQUs7WUFDUixJ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