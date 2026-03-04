/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinesLayout = exports.EditorWhitespace = void 0;
    class PendingChanges {
        constructor() {
            this._hasPending = false;
            this._inserts = [];
            this._changes = [];
            this._removes = [];
        }
        insert(x) {
            this._hasPending = true;
            this._inserts.push(x);
        }
        change(x) {
            this._hasPending = true;
            this._changes.push(x);
        }
        remove(x) {
            this._hasPending = true;
            this._removes.push(x);
        }
        mustCommit() {
            return this._hasPending;
        }
        commit(linesLayout) {
            if (!this._hasPending) {
                return;
            }
            const inserts = this._inserts;
            const changes = this._changes;
            const removes = this._removes;
            this._hasPending = false;
            this._inserts = [];
            this._changes = [];
            this._removes = [];
            linesLayout._commitPendingChanges(inserts, changes, removes);
        }
    }
    class EditorWhitespace {
        constructor(id, afterLineNumber, ordinal, height, minWidth) {
            this.id = id;
            this.afterLineNumber = afterLineNumber;
            this.ordinal = ordinal;
            this.height = height;
            this.minWidth = minWidth;
            this.prefixSum = 0;
        }
    }
    exports.EditorWhitespace = EditorWhitespace;
    /**
     * Layouting of objects that take vertical space (by having a height) and push down other objects.
     *
     * These objects are basically either text (lines) or spaces between those lines (whitespaces).
     * This provides commodity operations for working with lines that contain whitespace that pushes lines lower (vertically).
     */
    class LinesLayout {
        static { this.INSTANCE_COUNT = 0; }
        constructor(lineCount, lineHeight, paddingTop, paddingBottom) {
            this._instanceId = strings.singleLetterHash(++LinesLayout.INSTANCE_COUNT);
            this._pendingChanges = new PendingChanges();
            this._lastWhitespaceId = 0;
            this._arr = [];
            this._prefixSumValidIndex = -1;
            this._minWidth = -1; /* marker for not being computed */
            this._lineCount = lineCount;
            this._lineHeight = lineHeight;
            this._paddingTop = paddingTop;
            this._paddingBottom = paddingBottom;
        }
        /**
         * Find the insertion index for a new value inside a sorted array of values.
         * If the value is already present in the sorted array, the insertion index will be after the already existing value.
         */
        static findInsertionIndex(arr, afterLineNumber, ordinal) {
            let low = 0;
            let high = arr.length;
            while (low < high) {
                const mid = ((low + high) >>> 1);
                if (afterLineNumber === arr[mid].afterLineNumber) {
                    if (ordinal < arr[mid].ordinal) {
                        high = mid;
                    }
                    else {
                        low = mid + 1;
                    }
                }
                else if (afterLineNumber < arr[mid].afterLineNumber) {
                    high = mid;
                }
                else {
                    low = mid + 1;
                }
            }
            return low;
        }
        /**
         * Change the height of a line in pixels.
         */
        setLineHeight(lineHeight) {
            this._checkPendingChanges();
            this._lineHeight = lineHeight;
        }
        /**
         * Changes the padding used to calculate vertical offsets.
         */
        setPadding(paddingTop, paddingBottom) {
            this._paddingTop = paddingTop;
            this._paddingBottom = paddingBottom;
        }
        /**
         * Set the number of lines.
         *
         * @param lineCount New number of lines.
         */
        onFlushed(lineCount) {
            this._checkPendingChanges();
            this._lineCount = lineCount;
        }
        changeWhitespace(callback) {
            let hadAChange = false;
            try {
                const accessor = {
                    insertWhitespace: (afterLineNumber, ordinal, heightInPx, minWidth) => {
                        hadAChange = true;
                        afterLineNumber = afterLineNumber | 0;
                        ordinal = ordinal | 0;
                        heightInPx = heightInPx | 0;
                        minWidth = minWidth | 0;
                        const id = this._instanceId + (++this._lastWhitespaceId);
                        this._pendingChanges.insert(new EditorWhitespace(id, afterLineNumber, ordinal, heightInPx, minWidth));
                        return id;
                    },
                    changeOneWhitespace: (id, newAfterLineNumber, newHeight) => {
                        hadAChange = true;
                        newAfterLineNumber = newAfterLineNumber | 0;
                        newHeight = newHeight | 0;
                        this._pendingChanges.change({ id, newAfterLineNumber, newHeight });
                    },
                    removeWhitespace: (id) => {
                        hadAChange = true;
                        this._pendingChanges.remove({ id });
                    }
                };
                callback(accessor);
            }
            finally {
                this._pendingChanges.commit(this);
            }
            return hadAChange;
        }
        _commitPendingChanges(inserts, changes, removes) {
            if (inserts.length > 0 || removes.length > 0) {
                this._minWidth = -1; /* marker for not being computed */
            }
            if (inserts.length + changes.length + removes.length <= 1) {
                // when only one thing happened, handle it "delicately"
                for (const insert of inserts) {
                    this._insertWhitespace(insert);
                }
                for (const change of changes) {
                    this._changeOneWhitespace(change.id, change.newAfterLineNumber, change.newHeight);
                }
                for (const remove of removes) {
                    const index = this._findWhitespaceIndex(remove.id);
                    if (index === -1) {
                        continue;
                    }
                    this._removeWhitespace(index);
                }
                return;
            }
            // simply rebuild the entire datastructure
            const toRemove = new Set();
            for (const remove of removes) {
                toRemove.add(remove.id);
            }
            const toChange = new Map();
            for (const change of changes) {
                toChange.set(change.id, change);
            }
            const applyRemoveAndChange = (whitespaces) => {
                const result = [];
                for (const whitespace of whitespaces) {
                    if (toRemove.has(whitespace.id)) {
                        continue;
                    }
                    if (toChange.has(whitespace.id)) {
                        const change = toChange.get(whitespace.id);
                        whitespace.afterLineNumber = change.newAfterLineNumber;
                        whitespace.height = change.newHeight;
                    }
                    result.push(whitespace);
                }
                return result;
            };
            const result = applyRemoveAndChange(this._arr).concat(applyRemoveAndChange(inserts));
            result.sort((a, b) => {
                if (a.afterLineNumber === b.afterLineNumber) {
                    return a.ordinal - b.ordinal;
                }
                return a.afterLineNumber - b.afterLineNumber;
            });
            this._arr = result;
            this._prefixSumValidIndex = -1;
        }
        _checkPendingChanges() {
            if (this._pendingChanges.mustCommit()) {
                this._pendingChanges.commit(this);
            }
        }
        _insertWhitespace(whitespace) {
            const insertIndex = LinesLayout.findInsertionIndex(this._arr, whitespace.afterLineNumber, whitespace.ordinal);
            this._arr.splice(insertIndex, 0, whitespace);
            this._prefixSumValidIndex = Math.min(this._prefixSumValidIndex, insertIndex - 1);
        }
        _findWhitespaceIndex(id) {
            const arr = this._arr;
            for (let i = 0, len = arr.length; i < len; i++) {
                if (arr[i].id === id) {
                    return i;
                }
            }
            return -1;
        }
        _changeOneWhitespace(id, newAfterLineNumber, newHeight) {
            const index = this._findWhitespaceIndex(id);
            if (index === -1) {
                return;
            }
            if (this._arr[index].height !== newHeight) {
                this._arr[index].height = newHeight;
                this._prefixSumValidIndex = Math.min(this._prefixSumValidIndex, index - 1);
            }
            if (this._arr[index].afterLineNumber !== newAfterLineNumber) {
                // `afterLineNumber` changed for this whitespace
                // Record old whitespace
                const whitespace = this._arr[index];
                // Since changing `afterLineNumber` can trigger a reordering, we're gonna remove this whitespace
                this._removeWhitespace(index);
                whitespace.afterLineNumber = newAfterLineNumber;
                // And add it again
                this._insertWhitespace(whitespace);
            }
        }
        _removeWhitespace(removeIndex) {
            this._arr.splice(removeIndex, 1);
            this._prefixSumValidIndex = Math.min(this._prefixSumValidIndex, removeIndex - 1);
        }
        /**
         * Notify the layouter that lines have been deleted (a continuous zone of lines).
         *
         * @param fromLineNumber The line number at which the deletion started, inclusive
         * @param toLineNumber The line number at which the deletion ended, inclusive
         */
        onLinesDeleted(fromLineNumber, toLineNumber) {
            this._checkPendingChanges();
            fromLineNumber = fromLineNumber | 0;
            toLineNumber = toLineNumber | 0;
            this._lineCount -= (toLineNumber - fromLineNumber + 1);
            for (let i = 0, len = this._arr.length; i < len; i++) {
                const afterLineNumber = this._arr[i].afterLineNumber;
                if (fromLineNumber <= afterLineNumber && afterLineNumber <= toLineNumber) {
                    // The line this whitespace was after has been deleted
                    //  => move whitespace to before first deleted line
                    this._arr[i].afterLineNumber = fromLineNumber - 1;
                }
                else if (afterLineNumber > toLineNumber) {
                    // The line this whitespace was after has been moved up
                    //  => move whitespace up
                    this._arr[i].afterLineNumber -= (toLineNumber - fromLineNumber + 1);
                }
            }
        }
        /**
         * Notify the layouter that lines have been inserted (a continuous zone of lines).
         *
         * @param fromLineNumber The line number at which the insertion started, inclusive
         * @param toLineNumber The line number at which the insertion ended, inclusive.
         */
        onLinesInserted(fromLineNumber, toLineNumber) {
            this._checkPendingChanges();
            fromLineNumber = fromLineNumber | 0;
            toLineNumber = toLineNumber | 0;
            this._lineCount += (toLineNumber - fromLineNumber + 1);
            for (let i = 0, len = this._arr.length; i < len; i++) {
                const afterLineNumber = this._arr[i].afterLineNumber;
                if (fromLineNumber <= afterLineNumber) {
                    this._arr[i].afterLineNumber += (toLineNumber - fromLineNumber + 1);
                }
            }
        }
        /**
         * Get the sum of all the whitespaces.
         */
        getWhitespacesTotalHeight() {
            this._checkPendingChanges();
            if (this._arr.length === 0) {
                return 0;
            }
            return this.getWhitespacesAccumulatedHeight(this._arr.length - 1);
        }
        /**
         * Return the sum of the heights of the whitespaces at [0..index].
         * This includes the whitespace at `index`.
         *
         * @param index The index of the whitespace.
         * @return The sum of the heights of all whitespaces before the one at `index`, including the one at `index`.
         */
        getWhitespacesAccumulatedHeight(index) {
            this._checkPendingChanges();
            index = index | 0;
            let startIndex = Math.max(0, this._prefixSumValidIndex + 1);
            if (startIndex === 0) {
                this._arr[0].prefixSum = this._arr[0].height;
                startIndex++;
            }
            for (let i = startIndex; i <= index; i++) {
                this._arr[i].prefixSum = this._arr[i - 1].prefixSum + this._arr[i].height;
            }
            this._prefixSumValidIndex = Math.max(this._prefixSumValidIndex, index);
            return this._arr[index].prefixSum;
        }
        /**
         * Get the sum of heights for all objects.
         *
         * @return The sum of heights for all objects.
         */
        getLinesTotalHeight() {
            this._checkPendingChanges();
            const linesHeight = this._lineHeight * this._lineCount;
            const whitespacesHeight = this.getWhitespacesTotalHeight();
            return linesHeight + whitespacesHeight + this._paddingTop + this._paddingBottom;
        }
        /**
         * Returns the accumulated height of whitespaces before the given line number.
         *
         * @param lineNumber The line number
         */
        getWhitespaceAccumulatedHeightBeforeLineNumber(lineNumber) {
            this._checkPendingChanges();
            lineNumber = lineNumber | 0;
            const lastWhitespaceBeforeLineNumber = this._findLastWhitespaceBeforeLineNumber(lineNumber);
            if (lastWhitespaceBeforeLineNumber === -1) {
                return 0;
            }
            return this.getWhitespacesAccumulatedHeight(lastWhitespaceBeforeLineNumber);
        }
        _findLastWhitespaceBeforeLineNumber(lineNumber) {
            lineNumber = lineNumber | 0;
            // Find the whitespace before line number
            const arr = this._arr;
            let low = 0;
            let high = arr.length - 1;
            while (low <= high) {
                const delta = (high - low) | 0;
                const halfDelta = (delta / 2) | 0;
                const mid = (low + halfDelta) | 0;
                if (arr[mid].afterLineNumber < lineNumber) {
                    if (mid + 1 >= arr.length || arr[mid + 1].afterLineNumber >= lineNumber) {
                        return mid;
                    }
                    else {
                        low = (mid + 1) | 0;
                    }
                }
                else {
                    high = (mid - 1) | 0;
                }
            }
            return -1;
        }
        _findFirstWhitespaceAfterLineNumber(lineNumber) {
            lineNumber = lineNumber | 0;
            const lastWhitespaceBeforeLineNumber = this._findLastWhitespaceBeforeLineNumber(lineNumber);
            const firstWhitespaceAfterLineNumber = lastWhitespaceBeforeLineNumber + 1;
            if (firstWhitespaceAfterLineNumber < this._arr.length) {
                return firstWhitespaceAfterLineNumber;
            }
            return -1;
        }
        /**
         * Find the index of the first whitespace which has `afterLineNumber` >= `lineNumber`.
         * @return The index of the first whitespace with `afterLineNumber` >= `lineNumber` or -1 if no whitespace is found.
         */
        getFirstWhitespaceIndexAfterLineNumber(lineNumber) {
            this._checkPendingChanges();
            lineNumber = lineNumber | 0;
            return this._findFirstWhitespaceAfterLineNumber(lineNumber);
        }
        /**
         * Get the vertical offset (the sum of heights for all objects above) a certain line number.
         *
         * @param lineNumber The line number
         * @return The sum of heights for all objects above `lineNumber`.
         */
        getVerticalOffsetForLineNumber(lineNumber, includeViewZones = false) {
            this._checkPendingChanges();
            lineNumber = lineNumber | 0;
            let previousLinesHeight;
            if (lineNumber > 1) {
                previousLinesHeight = this._lineHeight * (lineNumber - 1);
            }
            else {
                previousLinesHeight = 0;
            }
            const previousWhitespacesHeight = this.getWhitespaceAccumulatedHeightBeforeLineNumber(lineNumber - (includeViewZones ? 1 : 0));
            return previousLinesHeight + previousWhitespacesHeight + this._paddingTop;
        }
        /**
         * Get the vertical offset (the sum of heights for all objects above) a certain line number.
         *
         * @param lineNumber The line number
         * @return The sum of heights for all objects above `lineNumber`.
         */
        getVerticalOffsetAfterLineNumber(lineNumber, includeViewZones = false) {
            this._checkPendingChanges();
            lineNumber = lineNumber | 0;
            const previousLinesHeight = this._lineHeight * lineNumber;
            const previousWhitespacesHeight = this.getWhitespaceAccumulatedHeightBeforeLineNumber(lineNumber + (includeViewZones ? 1 : 0));
            return previousLinesHeight + previousWhitespacesHeight + this._paddingTop;
        }
        /**
         * Returns if there is any whitespace in the document.
         */
        hasWhitespace() {
            this._checkPendingChanges();
            return this.getWhitespacesCount() > 0;
        }
        /**
         * The maximum min width for all whitespaces.
         */
        getWhitespaceMinWidth() {
            this._checkPendingChanges();
            if (this._minWidth === -1) {
                let minWidth = 0;
                for (let i = 0, len = this._arr.length; i < len; i++) {
                    minWidth = Math.max(minWidth, this._arr[i].minWidth);
                }
                this._minWidth = minWidth;
            }
            return this._minWidth;
        }
        /**
         * Check if `verticalOffset` is below all lines.
         */
        isAfterLines(verticalOffset) {
            this._checkPendingChanges();
            const totalHeight = this.getLinesTotalHeight();
            return verticalOffset > totalHeight;
        }
        isInTopPadding(verticalOffset) {
            if (this._paddingTop === 0) {
                return false;
            }
            this._checkPendingChanges();
            return (verticalOffset < this._paddingTop);
        }
        isInBottomPadding(verticalOffset) {
            if (this._paddingBottom === 0) {
                return false;
            }
            this._checkPendingChanges();
            const totalHeight = this.getLinesTotalHeight();
            return (verticalOffset >= totalHeight - this._paddingBottom);
        }
        /**
         * Find the first line number that is at or after vertical offset `verticalOffset`.
         * i.e. if getVerticalOffsetForLine(line) is x and getVerticalOffsetForLine(line + 1) is y, then
         * getLineNumberAtOrAfterVerticalOffset(i) = line, x <= i < y.
         *
         * @param verticalOffset The vertical offset to search at.
         * @return The line number at or after vertical offset `verticalOffset`.
         */
        getLineNumberAtOrAfterVerticalOffset(verticalOffset) {
            this._checkPendingChanges();
            verticalOffset = verticalOffset | 0;
            if (verticalOffset < 0) {
                return 1;
            }
            const linesCount = this._lineCount | 0;
            const lineHeight = this._lineHeight;
            let minLineNumber = 1;
            let maxLineNumber = linesCount;
            while (minLineNumber < maxLineNumber) {
                const midLineNumber = ((minLineNumber + maxLineNumber) / 2) | 0;
                const midLineNumberVerticalOffset = this.getVerticalOffsetForLineNumber(midLineNumber) | 0;
                if (verticalOffset >= midLineNumberVerticalOffset + lineHeight) {
                    // vertical offset is after mid line number
                    minLineNumber = midLineNumber + 1;
                }
                else if (verticalOffset >= midLineNumberVerticalOffset) {
                    // Hit
                    return midLineNumber;
                }
                else {
                    // vertical offset is before mid line number, but mid line number could still be what we're searching for
                    maxLineNumber = midLineNumber;
                }
            }
            if (minLineNumber > linesCount) {
                return linesCount;
            }
            return minLineNumber;
        }
        /**
         * Get all the lines and their relative vertical offsets that are positioned between `verticalOffset1` and `verticalOffset2`.
         *
         * @param verticalOffset1 The beginning of the viewport.
         * @param verticalOffset2 The end of the viewport.
         * @return A structure describing the lines positioned between `verticalOffset1` and `verticalOffset2`.
         */
        getLinesViewportData(verticalOffset1, verticalOffset2) {
            this._checkPendingChanges();
            verticalOffset1 = verticalOffset1 | 0;
            verticalOffset2 = verticalOffset2 | 0;
            const lineHeight = this._lineHeight;
            // Find first line number
            // We don't live in a perfect world, so the line number might start before or after verticalOffset1
            const startLineNumber = this.getLineNumberAtOrAfterVerticalOffset(verticalOffset1) | 0;
            const startLineNumberVerticalOffset = this.getVerticalOffsetForLineNumber(startLineNumber) | 0;
            let endLineNumber = this._lineCount | 0;
            // Also keep track of what whitespace we've got
            let whitespaceIndex = this.getFirstWhitespaceIndexAfterLineNumber(startLineNumber) | 0;
            const whitespaceCount = this.getWhitespacesCount() | 0;
            let currentWhitespaceHeight;
            let currentWhitespaceAfterLineNumber;
            if (whitespaceIndex === -1) {
                whitespaceIndex = whitespaceCount;
                currentWhitespaceAfterLineNumber = endLineNumber + 1;
                currentWhitespaceHeight = 0;
            }
            else {
                currentWhitespaceAfterLineNumber = this.getAfterLineNumberForWhitespaceIndex(whitespaceIndex) | 0;
                currentWhitespaceHeight = this.getHeightForWhitespaceIndex(whitespaceIndex) | 0;
            }
            let currentVerticalOffset = startLineNumberVerticalOffset;
            let currentLineRelativeOffset = currentVerticalOffset;
            // IE (all versions) cannot handle units above about 1,533,908 px, so every 500k pixels bring numbers down
            const STEP_SIZE = 500000;
            let bigNumbersDelta = 0;
            if (startLineNumberVerticalOffset >= STEP_SIZE) {
                // Compute a delta that guarantees that lines are positioned at `lineHeight` increments
                bigNumbersDelta = Math.floor(startLineNumberVerticalOffset / STEP_SIZE) * STEP_SIZE;
                bigNumbersDelta = Math.floor(bigNumbersDelta / lineHeight) * lineHeight;
                currentLineRelativeOffset -= bigNumbersDelta;
            }
            const linesOffsets = [];
            const verticalCenter = verticalOffset1 + (verticalOffset2 - verticalOffset1) / 2;
            let centeredLineNumber = -1;
            // Figure out how far the lines go
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                if (centeredLineNumber === -1) {
                    const currentLineTop = currentVerticalOffset;
                    const currentLineBottom = currentVerticalOffset + lineHeight;
                    if ((currentLineTop <= verticalCenter && verticalCenter < currentLineBottom) || currentLineTop > verticalCenter) {
                        centeredLineNumber = lineNumber;
                    }
                }
                // Count current line height in the vertical offsets
                currentVerticalOffset += lineHeight;
                linesOffsets[lineNumber - startLineNumber] = currentLineRelativeOffset;
                // Next line starts immediately after this one
                currentLineRelativeOffset += lineHeight;
                while (currentWhitespaceAfterLineNumber === lineNumber) {
                    // Push down next line with the height of the current whitespace
                    currentLineRelativeOffset += currentWhitespaceHeight;
                    // Count current whitespace in the vertical offsets
                    currentVerticalOffset += currentWhitespaceHeight;
                    whitespaceIndex++;
                    if (whitespaceIndex >= whitespaceCount) {
                        currentWhitespaceAfterLineNumber = endLineNumber + 1;
                    }
                    else {
                        currentWhitespaceAfterLineNumber = this.getAfterLineNumberForWhitespaceIndex(whitespaceIndex) | 0;
                        currentWhitespaceHeight = this.getHeightForWhitespaceIndex(whitespaceIndex) | 0;
                    }
                }
                if (currentVerticalOffset >= verticalOffset2) {
                    // We have covered the entire viewport area, time to stop
                    endLineNumber = lineNumber;
                    break;
                }
            }
            if (centeredLineNumber === -1) {
                centeredLineNumber = endLineNumber;
            }
            const endLineNumberVerticalOffset = this.getVerticalOffsetForLineNumber(endLineNumber) | 0;
            let completelyVisibleStartLineNumber = startLineNumber;
            let completelyVisibleEndLineNumber = endLineNumber;
            if (completelyVisibleStartLineNumber < completelyVisibleEndLineNumber) {
                if (startLineNumberVerticalOffset < verticalOffset1) {
                    completelyVisibleStartLineNumber++;
                }
            }
            if (completelyVisibleStartLineNumber < completelyVisibleEndLineNumber) {
                if (endLineNumberVerticalOffset + lineHeight > verticalOffset2) {
                    completelyVisibleEndLineNumber--;
                }
            }
            return {
                bigNumbersDelta: bigNumbersDelta,
                startLineNumber: startLineNumber,
                endLineNumber: endLineNumber,
                relativeVerticalOffset: linesOffsets,
                centeredLineNumber: centeredLineNumber,
                completelyVisibleStartLineNumber: completelyVisibleStartLineNumber,
                completelyVisibleEndLineNumber: completelyVisibleEndLineNumber,
                lineHeight: this._lineHeight,
            };
        }
        getVerticalOffsetForWhitespaceIndex(whitespaceIndex) {
            this._checkPendingChanges();
            whitespaceIndex = whitespaceIndex | 0;
            const afterLineNumber = this.getAfterLineNumberForWhitespaceIndex(whitespaceIndex);
            let previousLinesHeight;
            if (afterLineNumber >= 1) {
                previousLinesHeight = this._lineHeight * afterLineNumber;
            }
            else {
                previousLinesHeight = 0;
            }
            let previousWhitespacesHeight;
            if (whitespaceIndex > 0) {
                previousWhitespacesHeight = this.getWhitespacesAccumulatedHeight(whitespaceIndex - 1);
            }
            else {
                previousWhitespacesHeight = 0;
            }
            return previousLinesHeight + previousWhitespacesHeight + this._paddingTop;
        }
        getWhitespaceIndexAtOrAfterVerticallOffset(verticalOffset) {
            this._checkPendingChanges();
            verticalOffset = verticalOffset | 0;
            let minWhitespaceIndex = 0;
            let maxWhitespaceIndex = this.getWhitespacesCount() - 1;
            if (maxWhitespaceIndex < 0) {
                return -1;
            }
            // Special case: nothing to be found
            const maxWhitespaceVerticalOffset = this.getVerticalOffsetForWhitespaceIndex(maxWhitespaceIndex);
            const maxWhitespaceHeight = this.getHeightForWhitespaceIndex(maxWhitespaceIndex);
            if (verticalOffset >= maxWhitespaceVerticalOffset + maxWhitespaceHeight) {
                return -1;
            }
            while (minWhitespaceIndex < maxWhitespaceIndex) {
                const midWhitespaceIndex = Math.floor((minWhitespaceIndex + maxWhitespaceIndex) / 2);
                const midWhitespaceVerticalOffset = this.getVerticalOffsetForWhitespaceIndex(midWhitespaceIndex);
                const midWhitespaceHeight = this.getHeightForWhitespaceIndex(midWhitespaceIndex);
                if (verticalOffset >= midWhitespaceVerticalOffset + midWhitespaceHeight) {
                    // vertical offset is after whitespace
                    minWhitespaceIndex = midWhitespaceIndex + 1;
                }
                else if (verticalOffset >= midWhitespaceVerticalOffset) {
                    // Hit
                    return midWhitespaceIndex;
                }
                else {
                    // vertical offset is before whitespace, but midWhitespaceIndex might still be what we're searching for
                    maxWhitespaceIndex = midWhitespaceIndex;
                }
            }
            return minWhitespaceIndex;
        }
        /**
         * Get exactly the whitespace that is layouted at `verticalOffset`.
         *
         * @param verticalOffset The vertical offset.
         * @return Precisely the whitespace that is layouted at `verticaloffset` or null.
         */
        getWhitespaceAtVerticalOffset(verticalOffset) {
            this._checkPendingChanges();
            verticalOffset = verticalOffset | 0;
            const candidateIndex = this.getWhitespaceIndexAtOrAfterVerticallOffset(verticalOffset);
            if (candidateIndex < 0) {
                return null;
            }
            if (candidateIndex >= this.getWhitespacesCount()) {
                return null;
            }
            const candidateTop = this.getVerticalOffsetForWhitespaceIndex(candidateIndex);
            if (candidateTop > verticalOffset) {
                return null;
            }
            const candidateHeight = this.getHeightForWhitespaceIndex(candidateIndex);
            const candidateId = this.getIdForWhitespaceIndex(candidateIndex);
            const candidateAfterLineNumber = this.getAfterLineNumberForWhitespaceIndex(candidateIndex);
            return {
                id: candidateId,
                afterLineNumber: candidateAfterLineNumber,
                verticalOffset: candidateTop,
                height: candidateHeight
            };
        }
        /**
         * Get a list of whitespaces that are positioned between `verticalOffset1` and `verticalOffset2`.
         *
         * @param verticalOffset1 The beginning of the viewport.
         * @param verticalOffset2 The end of the viewport.
         * @return An array with all the whitespaces in the viewport. If no whitespace is in viewport, the array is empty.
         */
        getWhitespaceViewportData(verticalOffset1, verticalOffset2) {
            this._checkPendingChanges();
            verticalOffset1 = verticalOffset1 | 0;
            verticalOffset2 = verticalOffset2 | 0;
            const startIndex = this.getWhitespaceIndexAtOrAfterVerticallOffset(verticalOffset1);
            const endIndex = this.getWhitespacesCount() - 1;
            if (startIndex < 0) {
                return [];
            }
            const result = [];
            for (let i = startIndex; i <= endIndex; i++) {
                const top = this.getVerticalOffsetForWhitespaceIndex(i);
                const height = this.getHeightForWhitespaceIndex(i);
                if (top >= verticalOffset2) {
                    break;
                }
                result.push({
                    id: this.getIdForWhitespaceIndex(i),
                    afterLineNumber: this.getAfterLineNumberForWhitespaceIndex(i),
                    verticalOffset: top,
                    height: height
                });
            }
            return result;
        }
        /**
         * Get all whitespaces.
         */
        getWhitespaces() {
            this._checkPendingChanges();
            return this._arr.slice(0);
        }
        /**
         * The number of whitespaces.
         */
        getWhitespacesCount() {
            this._checkPendingChanges();
            return this._arr.length;
        }
        /**
         * Get the `id` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `id` of whitespace at `index`.
         */
        getIdForWhitespaceIndex(index) {
            this._checkPendingChanges();
            index = index | 0;
            return this._arr[index].id;
        }
        /**
         * Get the `afterLineNumber` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `afterLineNumber` of whitespace at `index`.
         */
        getAfterLineNumberForWhitespaceIndex(index) {
            this._checkPendingChanges();
            index = index | 0;
            return this._arr[index].afterLineNumber;
        }
        /**
         * Get the `height` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `height` of whitespace at `index`.
         */
        getHeightForWhitespaceIndex(index) {
            this._checkPendingChanges();
            index = index | 0;
            return this._arr[index].height;
        }
    }
    exports.LinesLayout = LinesLayout;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZXNMYXlvdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3ZpZXdMYXlvdXQvbGluZXNMYXlvdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQU0sY0FBYztRQU1uQjtZQUNDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLENBQUM7UUFFTSxNQUFNLENBQUMsQ0FBbUI7WUFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkIsQ0FBQztRQUVNLE1BQU0sQ0FBQyxDQUFpQjtZQUM5QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixDQUFDO1FBRU0sTUFBTSxDQUFDLENBQWlCO1lBQzlCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFFTSxVQUFVO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBRU0sTUFBTSxDQUFDLFdBQXdCO1lBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcs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