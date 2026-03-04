/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/editor/common/cursorCommon", "vs/editor/common/cursor/oneCursor", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection"], function (require, exports, arrays_1, arraysFind_1, cursorCommon_1, oneCursor_1, position_1, range_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorCollection = void 0;
    class CursorCollection {
        constructor(context) {
            this.context = context;
            this.cursors = [new oneCursor_1.Cursor(context)];
            this.lastAddedCursorIndex = 0;
        }
        dispose() {
            for (const cursor of this.cursors) {
                cursor.dispose(this.context);
            }
        }
        startTrackingSelections() {
            for (const cursor of this.cursors) {
                cursor.startTrackingSelection(this.context);
            }
        }
        stopTrackingSelections() {
            for (const cursor of this.cursors) {
                cursor.stopTrackingSelection(this.context);
            }
        }
        updateContext(context) {
            this.context = context;
        }
        ensureValidState() {
            for (const cursor of this.cursors) {
                cursor.ensureValidState(this.context);
            }
        }
        readSelectionFromMarkers() {
            return this.cursors.map(c => c.readSelectionFromMarkers(this.context));
        }
        getAll() {
            return this.cursors.map(c => c.asCursorState());
        }
        getViewPositions() {
            return this.cursors.map(c => c.viewState.position);
        }
        getTopMostViewPosition() {
            return (0, arraysFind_1.findFirstMin)(this.cursors, (0, arrays_1.compareBy)(c => c.viewState.position, position_1.Position.compare)).viewState.position;
        }
        getBottomMostViewPosition() {
            return (0, arraysFind_1.findLastMax)(this.cursors, (0, arrays_1.compareBy)(c => c.viewState.position, position_1.Position.compare)).viewState.position;
        }
        getSelections() {
            return this.cursors.map(c => c.modelState.selection);
        }
        getViewSelections() {
            return this.cursors.map(c => c.viewState.selection);
        }
        setSelections(selections) {
            this.setStates(cursorCommon_1.CursorState.fromModelSelections(selections));
        }
        getPrimaryCursor() {
            return this.cursors[0].asCursorState();
        }
        setStates(states) {
            if (states === null) {
                return;
            }
            this.cursors[0].setState(this.context, states[0].modelState, states[0].viewState);
            this._setSecondaryStates(states.slice(1));
        }
        /**
         * Creates or disposes secondary cursors as necessary to match the number of `secondarySelections`.
         */
        _setSecondaryStates(secondaryStates) {
            const secondaryCursorsLength = this.cursors.length - 1;
            const secondaryStatesLength = secondaryStates.length;
            if (secondaryCursorsLength < secondaryStatesLength) {
                const createCnt = secondaryStatesLength - secondaryCursorsLength;
                for (let i = 0; i < createCnt; i++) {
                    this._addSecondaryCursor();
                }
            }
            else if (secondaryCursorsLength > secondaryStatesLength) {
                const removeCnt = secondaryCursorsLength - secondaryStatesLength;
                for (let i = 0; i < removeCnt; i++) {
                    this._removeSecondaryCursor(this.cursors.length - 2);
                }
            }
            for (let i = 0; i < secondaryStatesLength; i++) {
                this.cursors[i + 1].setState(this.context, secondaryStates[i].modelState, secondaryStates[i].viewState);
            }
        }
        killSecondaryCursors() {
            this._setSecondaryStates([]);
        }
        _addSecondaryCursor() {
            this.cursors.push(new oneCursor_1.Cursor(this.context));
            this.lastAddedCursorIndex = this.cursors.length - 1;
        }
        getLastAddedCursorIndex() {
            if (this.cursors.length === 1 || this.lastAddedCursorIndex === 0) {
                return 0;
            }
            return this.lastAddedCursorIndex;
        }
        _removeSecondaryCursor(removeIndex) {
            if (this.lastAddedCursorIndex >= removeIndex + 1) {
                this.lastAddedCursorIndex--;
            }
            this.cursors[removeIndex + 1].dispose(this.context);
            this.cursors.splice(removeIndex + 1, 1);
        }
        normalize() {
            if (this.cursors.length === 1) {
                return;
            }
            const cursors = this.cursors.slice(0);
            const sortedCursors = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                sortedCursors.push({
                    index: i,
                    selection: cursors[i].modelState.selection,
                });
            }
            sortedCursors.sort((0, arrays_1.compareBy)(s => s.selection, range_1.Range.compareRangesUsingStarts));
            for (let sortedCursorIndex = 0; sortedCursorIndex < sortedCursors.length - 1; sortedCursorIndex++) {
                const current = sortedCursors[sortedCursorIndex];
                const next = sortedCursors[sortedCursorIndex + 1];
                const currentSelection = current.selection;
                const nextSelection = next.selection;
                if (!this.context.cursorConfig.multiCursorMergeOverlapping) {
                    continue;
                }
                let shouldMergeCursors;
                if (nextSelection.isEmpty() || currentSelection.isEmpty()) {
                    // Merge touching cursors if one of them is collapsed
                    shouldMergeCursors = nextSelection.getStartPosition().isBeforeOrEqual(currentSelection.getEndPosition());
                }
                else {
                    // Merge only overlapping cursors (i.e. allow touching ranges)
                    shouldMergeCursors = nextSelection.getStartPosition().isBefore(currentSelection.getEndPosition());
                }
                if (shouldMergeCursors) {
                    const winnerSortedCursorIndex = current.index < next.index ? sortedCursorIndex : sortedCursorIndex + 1;
                    const looserSortedCursorIndex = current.index < next.index ? sortedCursorIndex + 1 : sortedCursorIndex;
                    const looserIndex = sortedCursors[looserSortedCursorIndex].index;
                    const winnerIndex = sortedCursors[winnerSortedCursorIndex].index;
                    const looserSelection = sortedCursors[looserSortedCursorIndex].selection;
                    const winnerSelection = sortedCursors[winnerSortedCursorIndex].selection;
                    if (!looserSelection.equalsSelection(winnerSelection)) {
                        const resultingRange = looserSelection.plusRange(winnerSelection);
                        const looserSelectionIsLTR = (looserSelection.selectionStartLineNumber === looserSelection.startLineNumber && looserSelection.selectionStartColumn === looserSelection.startColumn);
                        const winnerSelectionIsLTR = (winnerSelection.selectionStartLineNumber === winnerSelection.startLineNumber && winnerSelection.selectionStartColumn === winnerSelection.startColumn);
                        // Give more importance to the last added cursor (think Ctrl-dragging + hitting another cursor)
                        let resultingSelectionIsLTR;
                        if (looserIndex === this.lastAddedCursorIndex) {
                            resultingSelectionIsLTR = looserSelectionIsLTR;
                            this.lastAddedCursorIndex = winnerIndex;
                        }
                        else {
                            // Winner takes it all
                            resultingSelectionIsLTR = winnerSelectionIsLTR;
                        }
                        let resultingSelection;
                        if (resultingSelectionIsLTR) {
                            resultingSelection = new selection_1.Selection(resultingRange.startLineNumber, resultingRange.startColumn, resultingRange.endLineNumber, resultingRange.endColumn);
                        }
                        else {
                            resultingSelection = new selection_1.Selection(resultingRange.endLineNumber, resultingRange.endColumn, resultingRange.startLineNumber, resultingRange.startColumn);
                        }
                        sortedCursors[winnerSortedCursorIndex].selection = resultingSelection;
                        const resultingState = cursorCommon_1.CursorState.fromModelSelection(resultingSelection);
                        cursors[winnerIndex].setState(this.context, resultingState.modelState, resultingState.viewState);
                    }
                    for (const sortedCursor of sortedCursors) {
                        if (sortedCursor.index > looserIndex) {
                            sortedCursor.index--;
                        }
                    }
                    cursors.splice(looserIndex, 1);
                    sortedCursors.splice(looserSortedCursorIndex, 1);
                    this._removeSecondaryCursor(looserIndex - 1);
                    sortedCursorIndex--;
                }
            }
        }
    }
    exports.CursorCollection = CursorCollection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQ29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY3Vyc29yL2N1cnNvckNvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEsZ0JBQWdCO1FBYzVCLFlBQVksT0FBc0I7WUFDakMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUksa0JBQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVNLE9BQU87WUFDYixLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7UUFFTSx1QkFBdUI7WUFDN0IsS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25DLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0MsQ0FBQztRQUNGLENBQUM7UUFFTSxzQkFBc0I7WUFDNUIsS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25DLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDNUMsQ0FBQztRQUNGLENBQUM7UUFFTSxhQUFhLENBQUMsT0FBc0I7WUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDeEIsQ0FBQztRQUVNLGdCQUFnQjtZQUN0QixL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