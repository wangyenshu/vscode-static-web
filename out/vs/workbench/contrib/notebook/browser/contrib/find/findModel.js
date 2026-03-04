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
define(["require", "exports", "vs/base/common/async", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/editor/common/core/range", "vs/editor/common/model/prefixSumComputer", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/arraysFind", "vs/workbench/contrib/notebook/browser/contrib/find/findMatchDecorationModel"], function (require, exports, async_1, notebookBrowser_1, range_1, prefixSumComputer_1, notebookCommon_1, configuration_1, lifecycle_1, arraysFind_1, findMatchDecorationModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindModel = exports.CellFindMatchModel = void 0;
    class CellFindMatchModel {
        get length() {
            return this._contentMatches.length + this._webviewMatches.length;
        }
        get contentMatches() {
            return this._contentMatches;
        }
        get webviewMatches() {
            return this._webviewMatches;
        }
        constructor(cell, index, contentMatches, webviewMatches) {
            this.cell = cell;
            this.index = index;
            this._contentMatches = contentMatches;
            this._webviewMatches = webviewMatches;
        }
        getMatch(index) {
            if (index >= this.length) {
                throw new Error('NotebookCellFindMatch: index out of range');
            }
            if (index < this._contentMatches.length) {
                return this._contentMatches[index];
            }
            return this._webviewMatches[index - this._contentMatches.length];
        }
    }
    exports.CellFindMatchModel = CellFindMatchModel;
    let FindModel = class FindModel extends lifecycle_1.Disposable {
        get findMatches() {
            return this._findMatches;
        }
        get currentMatch() {
            return this._currentMatch;
        }
        constructor(_notebookEditor, _state, _configurationService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._state = _state;
            this._configurationService = _configurationService;
            this._findMatches = [];
            this._findMatchesStarts = null;
            this._currentMatch = -1;
            this._computePromise = null;
            this._modelDisposable = this._register(new lifecycle_1.DisposableStore());
            this._throttledDelayer = new async_1.Delayer(20);
            this._computePromise = null;
            this._register(_state.onFindReplaceStateChange(e => {
                this._updateCellStates(e);
                if (e.searchString || e.isRegex || e.matchCase || e.searchScope || e.wholeWord || (e.isRevealed && this._state.isRevealed) || e.filters || e.isReplaceRevealed) {
                    this.research();
                }
                if (e.isRevealed && !this._state.isRevealed) {
                    this.clear();
                }
            }));
            this._register(this._notebookEditor.onDidChangeModel(e => {
                this._registerModelListener(e);
            }));
            this._register(this._notebookEditor.onDidChangeCellState(e => {
                if (e.cell.cellKind === notebookCommon_1.CellKind.Markup && e.source.editStateChanged) {
                    // research when markdown cell is switching between markdown preview and editing mode.
                    this.research();
                }
            }));
            if (this._notebookEditor.hasModel()) {
                this._registerModelListener(this._notebookEditor.textModel);
            }
            this._findMatchDecorationModel = new findMatchDecorationModel_1.FindMatchDecorationModel(this._notebookEditor, this._notebookEditor.getId());
        }
        _updateCellStates(e) {
            if (!this._state.filters?.markupInput) {
                return;
            }
            if (!this._state.filters?.markupPreview) {
                return;
            }
            // we only update cell state if users are using the hybrid mode (both input and preview are enabled)
            const updateEditingState = () => {
                const viewModel = this._notebookEditor.getViewModel();
                if (!viewModel) {
                    return;
                }
                // search markup sources first to decide if a markup cell should be in editing mode
                const wordSeparators = this._configurationService.inspect('editor.wordSeparators').value;
                const options = {
                    regex: this._state.isRegex,
                    wholeWord: this._state.wholeWord,
                    caseSensitive: this._state.matchCase,
                    wordSeparators: wordSeparators,
                    includeMarkupInput: true,
                    includeCodeInput: false,
                    includeMarkupPreview: false,
                    includeOutput: false
                };
                const contentMatches = viewModel.find(this._state.searchString, options);
                for (let i = 0; i < viewModel.length; i++) {
                    const cell = viewModel.cellAt(i);
                    if (cell && cell.cellKind === notebookCommon_1.CellKind.Markup) {
                        const foundContentMatch = contentMatches.find(m => m.cell.handle === cell.handle && m.contentMatches.length > 0);
                        const targetState = foundContentMatch ? notebookBrowser_1.CellEditState.Editing : notebookBrowser_1.CellEditState.Preview;
                        const currentEditingState = cell.getEditState();
                        if (currentEditingState === notebookBrowser_1.CellEditState.Editing && cell.editStateSource !== 'find') {
                            // it's already in editing mode, we should not update
                            continue;
                        }
                        if (currentEditingState !== targetState) {
                            cell.updateEditState(targetState, 'find');
                        }
                    }
                }
            };
            if (e.isReplaceRevealed && !this._state.isReplaceRevealed) {
                // replace is hidden, we need to switch all markdown cells to preview mode
                const viewModel = this._notebookEditor.getViewModel();
                if (!viewModel) {
                    return;
                }
                for (let i = 0; i < viewModel.length; i++) {
                    const cell = viewModel.cellAt(i);
                    if (cell && cell.cellKind === notebookCommon_1.CellKind.Markup) {
                        if (cell.getEditState() === notebookBrowser_1.CellEditState.Editing && cell.editStateSource === 'find') {
                            cell.updateEditState(notebookBrowser_1.CellEditState.Preview, 'find');
                        }
                    }
                }
                return;
            }
            if (e.isReplaceRevealed) {
                updateEditingState();
            }
            else if ((e.filters || e.isRevealed || e.searchString || e.replaceString) && this._state.isRevealed && this._state.isReplaceRevealed) {
                updateEditingState();
            }
        }
        ensureFindMatches() {
            if (!this._findMatchesStarts) {
                this.set(this._findMatches, true);
            }
        }
        getCurrentMatch() {
            const nextIndex = this._findMatchesStarts.getIndexOf(this._currentMatch);
            const cell = this._findMatches[nextIndex.index].cell;
            const match = this._findMatches[nextIndex.index].getMatch(nextIndex.remainder);
            return {
                cell,
                match,
                isModelMatch: nextIndex.remainder < this._findMatches[nextIndex.index].contentMatches.length
            };
        }
        refreshCurrentMatch(focus) {
            const findMatchIndex = this.findMatches.findIndex(match => match.cell === focus.cell);
            if (findMatchIndex === -1) {
                return;
            }
            const findMatch = this.findMatches[findMatchIndex];
            const index = findMatch.contentMatches.findIndex(match => match.range.intersectRanges(focus.range) !== null);
            if (index === undefined) {
                return;
            }
            const matchesBefore = findMatchIndex === 0 ? 0 : (this._findMatchesStarts?.getPrefixSum(findMatchIndex - 1) ?? 0);
            this._currentMatch = matchesBefore + index;
            this.highlightCurrentFindMatchDecoration(findMatchIndex, index).then(offset => {
                this.revealCellRange(findMatchIndex, index, offset);
                this._state.changeMatchInfo(this._currentMatch, this._findMatches.reduce((p, c) => p + c.length, 0), undefined);
            });
        }
        find(option) {
            if (!this.findMatches.length) {
                return;
            }
            // let currCell;
            if (!this._findMatchesStarts) {
                this.set(this._findMatches, true);
                if ('index' in option) {
                    this._currentMatch = option.index;
                }
            }
            else {
                // const currIndex = this._findMatchesStarts!.getIndexOf(this._currentMatch);
                // currCell = this._findMatches[currIndex.index].cell;
                const totalVal = this._findMatchesStarts.getTotalSum();
                if ('index' in option) {
                    this._currentMatch = option.index;
                }
                else if (this._currentMatch === -1) {
                    this._currentMatch = option.previous ? totalVal - 1 : 0;
                }
                else {
                    const nextVal = (this._currentMatch + (option.previous ? -1 : 1) + totalVal) % totalVal;
                    this._currentMatch = nextVal;
                }
            }
            const nextIndex = this._findMatchesStarts.getIndexOf(this._currentMatch);
            // const newFocusedCell = this._findMatches[nextIndex.index].cell;
            this.highlightCurrentFindMatchDecoration(nextIndex.index, nextIndex.remainder).then(offset => {
                this.revealCellRange(nextIndex.index, nextIndex.remainder, offset);
                this._state.changeMatchInfo(this._currentMatch, this._findMatches.reduce((p, c) => p + c.length, 0), undefined);
            });
        }
        revealCellRange(cellIndex, matchIndex, outputOffset) {
            const findMatch = this._findMatches[cellIndex];
            if (matchIndex >= findMatch.contentMatches.length) {
                // reveal output range
                this._notebookEditor.focusElement(findMatch.cell);
                const index = this._notebookEditor.getCellIndex(findMatch.cell);
                if (index !== undefined) {
                    // const range: ICellRange = { start: index, end: index + 1 };
                    this._notebookEditor.revealCellOffsetInCenter(findMatch.cell, outputOffset ?? 0);
                }
            }
            else {
                const match = findMatch.getMatch(matchIndex);
                if (findMatch.cell.getEditState() !== notebookBrowser_1.CellEditState.Editing) {
                    findMatch.cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'find');
                }
                findMatch.cell.isInputCollapsed = false;
                this._notebookEditor.focusElement(findMatch.cell);
                this._notebookEditor.setCellEditorSelection(findMatch.cell, match.range);
                this._notebookEditor.revealRangeInCenterIfOutsideViewportAsync(findMatch.cell, match.range);
            }
        }
        _registerModelListener(notebookTextModel) {
            this._modelDisposable.clear();
            if (notebookTextModel) {
                this._modelDisposable.add(notebookTextModel.onDidChangeContent((e) => {
                    if (!e.rawEvents.some(event => event.kind === notebookCommon_1.NotebookCellsChangeType.ChangeCellContent || event.kind === notebookCommon_1.NotebookCellsChangeType.ModelChange)) {
                        return;
                    }
                    this.research();
                }));
            }
            this.research();
        }
        async research() {
            return this._throttledDelayer.trigger(async () => {
                this._state.change({ isSearching: true }, false);
                await this._research();
                this._state.change({ isSearching: false }, false);
            });
        }
        async _research() {
            this._computePromise?.cancel();
            if (!this._state.isRevealed || !this._notebookEditor.hasModel()) {
                this.set([], false);
                return;
            }
            this._computePromise = (0, async_1.createCancelablePromise)(token => this._compute(token));
            const findMatches = await this._computePromise;
            if (!findMatches) {
                this.set([], false);
                return;
            }
            if (findMatches.length === 0) {
                this.set([], false);
                return;
            }
            const findFirstMatchAfterCellIndex = (cellIndex) => {
                const matchAfterSelection = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(findMatches.map(match => match.index), index => index >= cellIndex);
                this._updateCurrentMatch(findMatches, this._matchesCountBeforeIndex(findMatches, matchAfterSelection));
            };
            if (this._currentMatch === -1) {
                // no active current match
                if (this._notebookEditor.getLength() === 0) {
                    this.set(findMatches, false);
                    return;
                }
                else {
                    const focus = this._notebookEditor.getFocus().start;
                    findFirstMatchAfterCellIndex(focus);
                    this.set(findMatches, false);
                    return;
                }
            }
            const oldCurrIndex = this._findMatchesStarts.getIndexOf(this._currentMatch);
            const oldCurrCell = this._findMatches[oldCurrIndex.index].cell;
            const oldCurrMatchCellIndex = this._notebookEditor.getCellIndex(oldCurrCell);
            if (oldCurrMatchCellIndex < 0) {
                // the cell containing the active match is deleted
                if (this._notebookEditor.getLength() === 0) {
                    this.set(findMatches, false);
                    return;
                }
                findFirstMatchAfterCellIndex(oldCurrMatchCellIndex);
                return;
            }
            // the cell still exist
            const cell = this._notebookEditor.cellAt(oldCurrMatchCellIndex);
            // we will try restore the active find match in this cell, if it contains any find match
            if (cell.cellKind === notebookCommon_1.CellKind.Markup && cell.getEditState() === notebookBrowser_1.CellEditState.Preview) {
                // find first match in this cell or below
                findFirstMatchAfterCellIndex(oldCurrMatchCellIndex);
                return;
            }
            // the cell is a markup cell in editing mode or a code cell, both should have monaco editor rendered
            if (!this._findMatchDecorationModel.currentMatchDecorations) {
                // no current highlight decoration
                findFirstMatchAfterCellIndex(oldCurrMatchCellIndex);
                return;
            }
            // check if there is monaco editor selection and find the first match, otherwise find the first match above current cell
            // this._findMatches[cellIndex].matches[matchIndex].range
            if (this._findMatchDecorationModel.currentMatchDecorations.kind === 'input') {
                const currentMatchDecorationId = this._findMatchDecorationModel.currentMatchDecorations.decorations.find(decoration => decoration.ownerId === cell.handle);
                if (!currentMatchDecorationId) {
                    // current match decoration is no longer valid
                    findFirstMatchAfterCellIndex(oldCurrMatchCellIndex);
                    return;
                }
                const matchAfterSelection = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(findMatches, match => match.index >= oldCurrMatchCellIndex) % findMatches.length;
                if (findMatches[matchAfterSelection].index > oldCurrMatchCellIndex) {
                    // there is no search result in curr cell anymore, find the nearest one (from top to bottom)
                    this._updateCurrentMatch(findMatches, this._matchesCountBeforeIndex(findMatches, matchAfterSelection));
                    return;
                }
                else {
                    // there are still some search results in current cell
                    let currMatchRangeInEditor = cell.editorAttached && currentMatchDecorationId.decorations[0] ? cell.getCellDecorationRange(currentMatchDecorationId.decorations[0]) : null;
                    if (currMatchRangeInEditor === null && oldCurrIndex.remainder < this._findMatches[oldCurrIndex.index].contentMatches.length) {
                        currMatchRangeInEditor = this._findMatches[oldCurrIndex.index].getMatch(oldCurrIndex.remainder).range;
                    }
                    if (currMatchRangeInEditor !== null) {
                        // we find a range for the previous current match, let's find the nearest one after it (can overlap)
                        const cellMatch = findMatches[matchAfterSelection];
                        const matchAfterOldSelection = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(cellMatch.contentMatches, match => range_1.Range.compareRangesUsingStarts(match.range, currMatchRangeInEditor) >= 0);
                        this._updateCurrentMatch(findMatches, this._matchesCountBeforeIndex(findMatches, matchAfterSelection) + matchAfterOldSelection);
                    }
                    else {
                        // no range found, let's fall back to finding the nearest match
                        this._updateCurrentMatch(findMatches, this._matchesCountBeforeIndex(findMatches, matchAfterSelection));
                        return;
                    }
                }
            }
            else {
                // output now has the highlight
                const matchAfterSelection = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(findMatches.map(match => match.index), index => index >= oldCurrMatchCellIndex) % findMatches.length;
                this._updateCurrentMatch(findMatches, this._matchesCountBeforeIndex(findMatches, matchAfterSelection));
            }
        }
        set(cellFindMatches, autoStart) {
            if (!cellFindMatches || !cellFindMatches.length) {
                this._findMatches = [];
                this._findMatchDecorationModel.setAllFindMatchesDecorations([]);
                this.constructFindMatchesStarts();
                this._currentMatch = -1;
                this._findMatchDecorationModel.clearCurrentFindMatchDecoration();
                this._state.changeMatchInfo(this._currentMatch, this._findMatches.reduce((p, c) => p + c.length, 0), undefined);
                return;
            }
            // all matches
            this._findMatches = cellFindMatches;
            this._findMatchDecorationModel.setAllFindMatchesDecorations(cellFindMatches || []);
            // current match
            this.constructFindMatchesStarts();
            if (autoStart) {
                this._currentMatch = 0;
                this.highlightCurrentFindMatchDecoration(0, 0);
            }
            this._state.changeMatchInfo(this._currentMatch, this._findMatches.reduce((p, c) => p + c.length, 0), undefined);
        }
        async _compute(token) {
            if (!this._notebookEditor.hasModel()) {
                return null;
            }
            let ret = null;
            const val = this._state.searchString;
            const wordSeparators = this._configurationService.inspect('editor.wordSeparators').value;
            const options = {
                regex: this._state.isRegex,
                wholeWord: this._state.wholeWord,
                caseSensitive: this._state.matchCase,
                wordSeparators: wordSeparators,
                includeMarkupInput: this._state.filters?.markupInput ?? true,
                includeCodeInput: this._state.filters?.codeInput ?? true,
                includeMarkupPreview: !!this._state.filters?.markupPreview,
                includeOutput: !!this._state.filters?.codeOutput
            };
            ret = await this._notebookEditor.find(val, options, token);
            if (token.isCancellationRequested) {
                return null;
            }
            return ret;
        }
        _updateCurrentMatch(findMatches, currentMatchesPosition) {
            this._currentMatch = currentMatchesPosition % findMatches.length;
            this.set(findMatches, false);
            const nextIndex = this._findMatchesStarts.getIndexOf(this._currentMatch);
            this.highlightCurrentFindMatchDecoration(nextIndex.index, nextIndex.remainder);
            this._state.changeMatchInfo(this._currentMatch, this._findMatches.reduce((p, c) => p + c.length, 0), undefined);
        }
        _matchesCountBeforeIndex(findMatches, index) {
            let prevMatchesCount = 0;
            for (let i = 0; i < index; i++) {
                prevMatchesCount += findMatches[i].length;
            }
            return prevMatchesCount;
        }
        constructFindMatchesStarts() {
            if (this._findMatches && this._findMatches.length) {
                const values = new Uint32Array(this._findMatches.length);
                for (let i = 0; i < this._findMatches.length; i++) {
                    values[i] = this._findMatches[i].length;
                }
                this._findMatchesStarts = new prefixSumComputer_1.PrefixSumComputer(values);
            }
            else {
                this._findMatchesStarts = null;
            }
        }
        async highlightCurrentFindMatchDecoration(cellIndex, matchIndex) {
            const cell = this._findMatches[cellIndex].cell;
            const match = this._findMatches[cellIndex].getMatch(matchIndex);
            if (matchIndex < this._findMatches[cellIndex].contentMatches.length) {
                return this._findMatchDecorationModel.highlightCurrentFindMatchDecorationInCell(cell, match.range);
            }
            else {
                return this._findMatchDecorationModel.highlightCurrentFindMatchDecorationInWebview(cell, match.index);
            }
        }
        clear() {
            this._computePromise?.cancel();
            this._throttledDelayer.cancel();
            this.set([], false);
        }
        dispose() {
            this._findMatchDecorationModel.dispose();
            super.dispose();
        }
    };
    exports.FindModel = FindModel;
    exports.FindModel = FindModel = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], FindModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2ZpbmQvZmluZE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCaEcsTUFBYSxrQkFBa0I7UUFLOUIsSUFBSSxNQUFNO1lBQ1QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQztRQUNsRSxDQUFDO1FBRUQsSUFBSSxjQUFjO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM3QixDQUFDO1FBRUQsSUFBSSxjQUFjO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM3QixDQUFDO1FBRUQsWUFBWSxJQUFvQixFQUFFLEtBQWEsRUFBRSxjQUEyQixFQUFFLGNBQXNDO1lBQ25ILElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxlQUFlLEdBQUcsY0FBYyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxlQUFlLEdBQUcsY0FBYyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxRQUFRLENBQUMsS0FBYTtZQUNyQixJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBRUQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDekMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BD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