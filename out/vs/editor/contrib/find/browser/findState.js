/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "./findModel"], function (require, exports, event_1, lifecycle_1, range_1, findModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindReplaceState = exports.FindOptionOverride = void 0;
    var FindOptionOverride;
    (function (FindOptionOverride) {
        FindOptionOverride[FindOptionOverride["NotSet"] = 0] = "NotSet";
        FindOptionOverride[FindOptionOverride["True"] = 1] = "True";
        FindOptionOverride[FindOptionOverride["False"] = 2] = "False";
    })(FindOptionOverride || (exports.FindOptionOverride = FindOptionOverride = {}));
    function effectiveOptionValue(override, value) {
        if (override === 1 /* FindOptionOverride.True */) {
            return true;
        }
        if (override === 2 /* FindOptionOverride.False */) {
            return false;
        }
        return value;
    }
    class FindReplaceState extends lifecycle_1.Disposable {
        get searchString() { return this._searchString; }
        get replaceString() { return this._replaceString; }
        get isRevealed() { return this._isRevealed; }
        get isReplaceRevealed() { return this._isReplaceRevealed; }
        get isRegex() { return effectiveOptionValue(this._isRegexOverride, this._isRegex); }
        get wholeWord() { return effectiveOptionValue(this._wholeWordOverride, this._wholeWord); }
        get matchCase() { return effectiveOptionValue(this._matchCaseOverride, this._matchCase); }
        get preserveCase() { return effectiveOptionValue(this._preserveCaseOverride, this._preserveCase); }
        get actualIsRegex() { return this._isRegex; }
        get actualWholeWord() { return this._wholeWord; }
        get actualMatchCase() { return this._matchCase; }
        get actualPreserveCase() { return this._preserveCase; }
        get searchScope() { return this._searchScope; }
        get matchesPosition() { return this._matchesPosition; }
        get matchesCount() { return this._matchesCount; }
        get currentMatch() { return this._currentMatch; }
        get isSearching() { return this._isSearching; }
        get filters() { return this._filters; }
        constructor() {
            super();
            this._onFindReplaceStateChange = this._register(new event_1.Emitter());
            this.onFindReplaceStateChange = this._onFindReplaceStateChange.event;
            this._searchString = '';
            this._replaceString = '';
            this._isRevealed = false;
            this._isReplaceRevealed = false;
            this._isRegex = false;
            this._isRegexOverride = 0 /* FindOptionOverride.NotSet */;
            this._wholeWord = false;
            this._wholeWordOverride = 0 /* FindOptionOverride.NotSet */;
            this._matchCase = false;
            this._matchCaseOverride = 0 /* FindOptionOverride.NotSet */;
            this._preserveCase = false;
            this._preserveCaseOverride = 0 /* FindOptionOverride.NotSet */;
            this._searchScope = null;
            this._matchesPosition = 0;
            this._matchesCount = 0;
            this._currentMatch = null;
            this._loop = true;
            this._isSearching = false;
            this._filters = null;
        }
        changeMatchInfo(matchesPosition, matchesCount, currentMatch) {
            const changeEvent = {
                moveCursor: false,
                updateHistory: false,
                searchString: false,
                replaceString: false,
                isRevealed: false,
                isReplaceRevealed: false,
                isRegex: false,
                wholeWord: false,
                matchCase: false,
                preserveCase: false,
                searchScope: false,
                matchesPosition: false,
                matchesCount: false,
                currentMatch: false,
                loop: false,
                isSearching: false,
                filters: false
            };
            let somethingChanged = false;
            if (matchesCount === 0) {
                matchesPosition = 0;
            }
            if (matchesPosition > matchesCount) {
                matchesPosition = matchesCount;
            }
            if (this._matchesPosition !== matchesPosition) {
                this._matchesPosition = matchesPosition;
                changeEvent.matchesPosition = true;
                somethingChanged = true;
            }
            if (this._matchesCount !== matchesCount) {
                this._matchesCount = matchesCount;
                changeEvent.matchesCount = true;
                somethingChanged = true;
            }
            if (typeof currentMatch !== 'undefined') {
                if (!range_1.Range.equalsRange(this._currentMatch, currentMatch)) {
                    this._currentMatch = currentMatch;
                    changeEvent.currentMatch = true;
                    somethingChanged = true;
                }
            }
            if (somethingChanged) {
                this._onFindReplaceStateChange.fire(changeEvent);
            }
        }
        change(newState, moveCursor, updateHistory = true) {
            const changeEvent = {
                moveCursor: moveCursor,
                updateHistory: updateHistory,
                searchString: false,
                replaceString: false,
                isRevealed: false,
                isReplaceRevealed: false,
                isRegex: false,
                wholeWord: false,
                matchCase: false,
                preserveCase: false,
                searchScope: false,
                matchesPosition: false,
                matchesCount: false,
                currentMatch: false,
                loop: false,
                isSearching: false,
                filters: false
            };
            let somethingChanged = false;
            const oldEffectiveIsRegex = this.isRegex;
            const oldEffectiveWholeWords = this.wholeWord;
            const oldEffectiveMatchCase = this.matchCase;
            const oldEffectivePreserveCase = this.preserveCase;
            if (typeof newState.searchString !== 'undefined') {
                if (this._searchString !== newState.searchString) {
                    this._searchString = newState.searchString;
                    changeEvent.searchString = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.replaceString !== 'undefined') {
                if (this._replaceString !== newState.replaceString) {
                    this._replaceString = newState.replaceString;
                    changeEvent.replaceString = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.isRevealed !== 'undefined') {
                if (this._isRevealed !== newState.isRevealed) {
                    this._isRevealed = newState.isRevealed;
                    changeEvent.isRevealed = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.isReplaceRevealed !== 'undefined') {
                if (this._isReplaceRevealed !== newState.isReplaceRevealed) {
                    this._isReplaceRevealed = newState.isReplaceRevealed;
                    changeEvent.isReplaceRevealed = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.isRegex !== 'undefined') {
                this._isRegex = newState.isRegex;
            }
            if (typeof newState.wholeWord !== 'undefined') {
                this._wholeWord = newState.wholeWord;
            }
            if (typeof newState.matchCase !== 'undefined') {
                this._matchCase = newState.matchCase;
            }
            if (typeof newState.preserveCase !== 'undefined') {
                this._preserveCase = newState.preserveCase;
            }
            if (typeof newState.searchScope !== 'undefined') {
                if (!newState.searchScope?.every((newSearchScope) => {
                    return this._searchScope?.some(existingSearchScope => {
                        return !range_1.Range.equalsRange(existingSearchScope, newSearchScope);
                    });
                })) {
                    this._searchScope = newState.searchScope;
                    changeEvent.searchScope = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.loop !== 'undefined') {
                if (this._loop !== newState.loop) {
                    this._loop = newState.loop;
                    changeEvent.loop = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.isSearching !== 'undefined') {
                if (this._isSearching !== newState.isSearching) {
                    this._isSearching = newState.isSearching;
                    changeEvent.isSearching = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.filters !== 'undefined') {
                if (this._filters) {
                    this._filters.update(newState.filters);
                }
                else {
                    this._filters = newState.filters;
                }
                changeEvent.filters = true;
                somethingChanged = true;
            }
            // Overrides get set when they explicitly come in and get reset anytime something else changes
            this._isRegexOverride = (typeof newState.isRegexOverride !== 'undefined' ? newState.isRegexOverride : 0 /* FindOptionOverride.NotSet */);
            this._wholeWordOverride = (typeof newState.wholeWordOverride !== 'undefined' ? newState.wholeWordOverride : 0 /* FindOptionOverride.NotSet */);
            this._matchCaseOverride = (typeof newState.matchCaseOverride !== 'undefined' ? newState.matchCaseOverride : 0 /* FindOptionOverride.NotSet */);
            this._preserveCaseOverride = (typeof newState.preserveCaseOverride !== 'undefined' ? newState.preserveCaseOverride : 0 /* FindOptionOverride.NotSet */);
            if (oldEffectiveIsRegex !== this.isRegex) {
                somethingChanged = true;
                changeEvent.isRegex = true;
            }
            if (oldEffectiveWholeWords !== this.wholeWord) {
                somethingChanged = true;
                changeEvent.wholeWord = true;
            }
            if (oldEffectiveMatchCase !== this.matchCase) {
                somethingChanged = true;
                changeEvent.matchCase = true;
            }
            if (oldEffectivePreserveCase !== this.preserveCase) {
                somethingChanged = true;
                changeEvent.preserveCase = true;
            }
            if (somethingChanged) {
                this._onFindReplaceStateChange.fire(changeEvent);
            }
        }
        canNavigateBack() {
            return this.canNavigateInLoop() || (this.matchesPosition !== 1);
        }
        canNavigateForward() {
            return this.canNavigateInLoop() || (this.matchesPosition < this.matchesCount);
        }
        canNavigateInLoop() {
            return this._loop || (this.matchesCount >= findModel_1.MATCHES_LIMIT);
        }
    }
    exports.FindReplaceState = FindReplaceState;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZFN0YXRlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZmluZC9icm93c2VyL2ZpbmRTdGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0QmhHLElBQWtCLGtCQUlqQjtJQUpELFdBQWtCLGtCQUFrQjtRQUNuQywrREFBVSxDQUFBO1FBQ1YsMkRBQVEsQ0FBQTtRQUNSLDZEQUFTLENBQUE7SUFDVixDQUFDLEVBSmlCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBSW5DO0lBcUJELFNBQVMsb0JBQW9CLENBQUMsUUFBNEIsRUFBRSxLQUFjO1FBQ3pFLElBQUksUUFBUSxvQ0FBNEIsRUFBRSxDQUFDO1lBQzFDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNELElBQUksUUFBUSxxQ0FBNkIsRUFBRSxDQUFDO1lBQzNDLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQWEsZ0JBQWtGLFNBQVEsc0JBQVU7UUFzQmhILElBQVcsWUFBWSxLQUFhLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDaEUsSUFBVyxhQUFhLEtBQWEsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUNsRSxJQUFXLFVBQVUsS0FBYyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQzdELElBQVcsaUJBQWlCLEtBQWMsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBQzNFLElBQVcsT0FBTyxLQUFjLE9BQU8sb0JBQW9CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEcsSUFBVyxT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