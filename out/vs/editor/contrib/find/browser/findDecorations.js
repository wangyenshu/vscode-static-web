/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, range_1, model_1, textModel_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindDecorations = void 0;
    class FindDecorations {
        constructor(editor) {
            this._editor = editor;
            this._decorations = [];
            this._overviewRulerApproximateDecorations = [];
            this._findScopeDecorationIds = [];
            this._rangeHighlightDecorationId = null;
            this._highlightedDecorationId = null;
            this._startPosition = this._editor.getPosition();
        }
        dispose() {
            this._editor.removeDecorations(this._allDecorations());
            this._decorations = [];
            this._overviewRulerApproximateDecorations = [];
            this._findScopeDecorationIds = [];
            this._rangeHighlightDecorationId = null;
            this._highlightedDecorationId = null;
        }
        reset() {
            this._decorations = [];
            this._overviewRulerApproximateDecorations = [];
            this._findScopeDecorationIds = [];
            this._rangeHighlightDecorationId = null;
            this._highlightedDecorationId = null;
        }
        getCount() {
            return this._decorations.length;
        }
        /** @deprecated use getFindScopes to support multiple selections */
        getFindScope() {
            if (this._findScopeDecorationIds[0]) {
                return this._editor.getModel().getDecorationRange(this._findScopeDecorationIds[0]);
            }
            return null;
        }
        getFindScopes() {
            if (this._findScopeDecorationIds.length) {
                const scopes = this._findScopeDecorationIds.map(findScopeDecorationId => this._editor.getModel().getDecorationRange(findScopeDecorationId)).filter(element => !!element);
                if (scopes.length) {
                    return scopes;
                }
            }
            return null;
        }
        getStartPosition() {
            return this._startPosition;
        }
        setStartPosition(newStartPosition) {
            this._startPosition = newStartPosition;
            this.setCurrentFindMatch(null);
        }
        _getDecorationIndex(decorationId) {
            const index = this._decorations.indexOf(decorationId);
            if (index >= 0) {
                return index + 1;
            }
            return 1;
        }
        getDecorationRangeAt(index) {
            const decorationId = index < this._decorations.length ? this._decorations[index] : null;
            if (decorationId) {
                return this._editor.getModel().getDecorationRange(decorationId);
            }
            return null;
        }
        getCurrentMatchesPosition(desiredRange) {
            const candidates = this._editor.getModel().getDecorationsInRange(desiredRange);
            for (const candidate of candidates) {
                const candidateOpts = candidate.options;
                if (candidateOpts === FindDecorations._FIND_MATCH_DECORATION || candidateOpts === FindDecorations._CURRENT_FIND_MATCH_DECORATION) {
                    return this._getDecorationIndex(candidate.id);
                }
            }
            // We don't know the current match position, so returns zero to show '?' in find widget
            return 0;
        }
        setCurrentFindMatch(nextMatch) {
            let newCurrentDecorationId = null;
            let matchPosition = 0;
            if (nextMatch) {
                for (let i = 0, len = this._decorations.length; i < len; i++) {
                    const range = this._editor.getModel().getDecorationRange(this._decorations[i]);
                    if (nextMatch.equalsRange(range)) {
                        newCurrentDecorationId = this._decorations[i];
                        matchPosition = (i + 1);
                        break;
                    }
                }
            }
            if (this._highlightedDecorationId !== null || newCurrentDecorationId !== null) {
                this._editor.changeDecorations((changeAccessor) => {
                    if (this._highlightedDecorationId !== null) {
                        changeAccessor.changeDecorationOptions(this._highlightedDecorationId, FindDecorations._FIND_MATCH_DECORATION);
                        this._highlightedDecorationId = null;
                    }
                    if (newCurrentDecorationId !== null) {
                        this._highlightedDecorationId = newCurrentDecorationId;
                        changeAccessor.changeDecorationOptions(this._highlightedDecorationId, FindDecorations._CURRENT_FIND_MATCH_DECORATION);
                    }
                    if (this._rangeHighlightDecorationId !== null) {
                        changeAccessor.removeDecoration(this._rangeHighlightDecorationId);
                        this._rangeHighlightDecorationId = null;
                    }
                    if (newCurrentDecorationId !== null) {
                        let rng = this._editor.getModel().getDecorationRange(newCurrentDecorationId);
                        if (rng.startLineNumber !== rng.endLineNumber && rng.endColumn === 1) {
                            const lineBeforeEnd = rng.endLineNumber - 1;
                            const lineBeforeEndMaxColumn = this._editor.getModel().getLineMaxColumn(lineBeforeEnd);
                            rng = new range_1.Range(rng.startLineNumber, rng.startColumn, lineBeforeEnd, lineBeforeEndMaxColumn);
                        }
                        this._rangeHighlightDecorationId = changeAccessor.addDecoration(rng, FindDecorations._RANGE_HIGHLIGHT_DECORATION);
                    }
                });
            }
            return matchPosition;
        }
        set(findMatches, findScopes) {
            this._editor.changeDecorations((accessor) => {
                let findMatchesOptions = FindDecorations._FIND_MATCH_DECORATION;
                const newOverviewRulerApproximateDecorations = [];
                if (findMatches.length > 1000) {
                    // we go into a mode where the overview ruler gets "approximate" decorations
                    // the reason is that the overview ruler paints all the decorations in the file and we don't want to cause freezes
                    findMatchesOptions = FindDecorations._FIND_MATCH_NO_OVERVIEW_DECORATION;
                    // approximate a distance in lines where matches should be merged
                    const lineCount = this._editor.getModel().getLineCount();
                    const height = this._editor.getLayoutInfo().height;
                    const approxPixelsPerLine = height / lineCount;
                    const mergeLinesDelta = Math.max(2, Math.ceil(3 / approxPixelsPerLine));
                    // merge decorations as much as possible
                    let prevStartLineNumber = findMatches[0].range.startLineNumber;
                    let prevEndLineNumber = findMatches[0].range.endLineNumber;
                    for (let i = 1, len = findMatches.length; i < len; i++) {
                        const range = findMatches[i].range;
                        if (prevEndLineNumber + mergeLinesDelta >= range.startLineNumber) {
                            if (range.endLineNumber > prevEndLineNumber) {
                                prevEndLineNumber = range.endLineNumber;
                            }
                        }
                        else {
                            newOverviewRulerApproximateDecorations.push({
                                range: new range_1.Range(prevStartLineNumber, 1, prevEndLineNumber, 1),
                                options: FindDecorations._FIND_MATCH_ONLY_OVERVIEW_DECORATION
                            });
                            prevStartLineNumber = range.startLineNumber;
                            prevEndLineNumber = range.endLineNumber;
                        }
                    }
                    newOverviewRulerApproximateDecorations.push({
                        range: new range_1.Range(prevStartLineNumber, 1, prevEndLineNumber, 1),
                        options: FindDecorations._FIND_MATCH_ONLY_OVERVIEW_DECORATION
                    });
                }
                // Find matches
                const newFindMatchesDecorations = new Array(findMatches.length);
                for (let i = 0, len = findMatches.length; i < len; i++) {
                    newFindMatchesDecorations[i] = {
                        range: findMatches[i].range,
                        options: findMatchesOptions
                    };
                }
                this._decorations = accessor.deltaDecorations(this._decorations, newFindMatchesDecorations);
                // Overview ruler approximate decorations
                this._overviewRulerApproximateDecorations = accessor.deltaDecorations(this._overviewRulerApproximateDecorations, newOverviewRulerApproximateDecorations);
                // Range highlight
                if (this._rangeHighlightDecorationId) {
                    accessor.removeDecoration(this._rangeHighlightDecorationId);
                    this._rangeHighlightDecorationId = null;
                }
                // Find scope
                if (this._findScopeDecorationIds.length) {
                    this._findScopeDecorationIds.forEach(findScopeDecorationId => accessor.removeDecoration(findScopeDecorationId));
                    this._findScopeDecorationIds = [];
                }
                if (findScopes?.length) {
                    this._findScopeDecorationIds = findScopes.map(findScope => accessor.addDecoration(findScope, FindDecorations._FIND_SCOPE_DECORATION));
                }
            });
        }
        matchBeforePosition(position) {
            if (this._decorations.length === 0) {
                return null;
            }
            for (let i = this._decorations.length - 1; i >= 0; i--) {
                const decorationId = this._decorations[i];
                const r = this._editor.getModel().getDecorationRange(decorationId);
                if (!r || r.endLineNumber > position.lineNumber) {
                    continue;
                }
                if (r.endLineNumber < position.lineNumber) {
                    return r;
                }
                if (r.endColumn > position.column) {
                    continue;
                }
                return r;
            }
            return this._editor.getModel().getDecorationRange(this._decorations[this._decorations.length - 1]);
        }
        matchAfterPosition(position) {
            if (this._decorations.length === 0) {
                return null;
            }
            for (let i = 0, len = this._decorations.length; i < len; i++) {
                const decorationId = this._decorations[i];
                const r = this._editor.getModel().getDecorationRange(decorationId);
                if (!r || r.startLineNumber < position.lineNumber) {
                    continue;
                }
                if (r.startLineNumber > position.lineNumber) {
                    return r;
                }
                if (r.startColumn < position.column) {
                    continue;
                }
                return r;
            }
            return this._editor.getModel().getDecorationRange(this._decorations[0]);
        }
        _allDecorations() {
            let result = [];
            result = result.concat(this._decorations);
            result = result.concat(this._overviewRulerApproximateDecorations);
            if (this._findScopeDecorationIds.length) {
                result.push(...this._findScopeDecorationIds);
            }
            if (this._rangeHighlightDecorationId) {
                result.push(this._rangeHighlightDecorationId);
            }
            return result;
        }
        static { this._CURRENT_FIND_MATCH_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'current-find-match',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            zIndex: 13,
            className: 'currentFindMatch',
            showIfCollapsed: true,
            overviewRuler: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerFindMatchForeground),
                position: model_1.OverviewRulerLane.Center
            },
            minimap: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapFindMatch),
                position: 1 /* MinimapPosition.Inline */
            }
        }); }
        static { this._FIND_MATCH_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'find-match',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            zIndex: 10,
            className: 'findMatch',
            showIfCollapsed: true,
            overviewRuler: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerFindMatchForeground),
                position: model_1.OverviewRulerLane.Center
            },
            minimap: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapFindMatch),
                position: 1 /* MinimapPosition.Inline */
            }
        }); }
        static { this._FIND_MATCH_NO_OVERVIEW_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'find-match-no-overview',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'findMatch',
            showIfCollapsed: true
        }); }
        static { this._FIND_MATCH_ONLY_OVERVIEW_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'find-match-only-overview',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            overviewRuler: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerFindMatchForeground),
                position: model_1.OverviewRulerLane.Center
            }
        }); }
        static { this._RANGE_HIGHLIGHT_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'find-range-highlight',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'rangeHighlight',
            isWholeLine: true
        }); }
        static { this._FIND_SCOPE_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'find-scope',
            className: 'findScope',
            isWholeLine: true
        }); }
    }
    exports.FindDecorations = FindDecorations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZERlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZmluZC9icm93c2VyL2ZpbmREZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxlQUFlO1FBVTNCLFlBQVksTUFBeUI7WUFDcEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLG9DQUFvQyxHQUFHLEVBQUUsQ0FBQztZQUMvQyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUM7WUFDeEMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQztZQUNyQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbEQsQ0FBQztRQUVNLE9BQU87WUFDYixJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1lBRXZELElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxvQ0FBb0MsR0FBRyxFQUFFLENBQUM7WUFDL0MsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFDO1lBQ3hDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUM7UUFDdEMsQ0FBQztRQUVNLEtBQUs7WUFDWCxJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsb0NBQW9DLEdBQUcs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