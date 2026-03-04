/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldingRegion = exports.FoldingRegions = exports.MAX_LINE_NUMBER = exports.MAX_FOLDING_REGIONS = exports.foldSourceAbbr = exports.FoldSource = void 0;
    var FoldSource;
    (function (FoldSource) {
        FoldSource[FoldSource["provider"] = 0] = "provider";
        FoldSource[FoldSource["userDefined"] = 1] = "userDefined";
        FoldSource[FoldSource["recovered"] = 2] = "recovered";
    })(FoldSource || (exports.FoldSource = FoldSource = {}));
    exports.foldSourceAbbr = {
        [0 /* FoldSource.provider */]: ' ',
        [1 /* FoldSource.userDefined */]: 'u',
        [2 /* FoldSource.recovered */]: 'r',
    };
    exports.MAX_FOLDING_REGIONS = 0xFFFF;
    exports.MAX_LINE_NUMBER = 0xFFFFFF;
    const MASK_INDENT = 0xFF000000;
    class BitField {
        constructor(size) {
            const numWords = Math.ceil(size / 32);
            this._states = new Uint32Array(numWords);
        }
        get(index) {
            const arrayIndex = (index / 32) | 0;
            const bit = index % 32;
            return (this._states[arrayIndex] & (1 << bit)) !== 0;
        }
        set(index, newState) {
            const arrayIndex = (index / 32) | 0;
            const bit = index % 32;
            const value = this._states[arrayIndex];
            if (newState) {
                this._states[arrayIndex] = value | (1 << bit);
            }
            else {
                this._states[arrayIndex] = value & ~(1 << bit);
            }
        }
    }
    class FoldingRegions {
        constructor(startIndexes, endIndexes, types) {
            if (startIndexes.length !== endIndexes.length || startIndexes.length > exports.MAX_FOLDING_REGIONS) {
                throw new Error('invalid startIndexes or endIndexes size');
            }
            this._startIndexes = startIndexes;
            this._endIndexes = endIndexes;
            this._collapseStates = new BitField(startIndexes.length);
            this._userDefinedStates = new BitField(startIndexes.length);
            this._recoveredStates = new BitField(startIndexes.length);
            this._types = types;
            this._parentsComputed = false;
        }
        ensureParentIndices() {
            if (!this._parentsComputed) {
                this._parentsComputed = true;
                const parentIndexes = [];
                const isInsideLast = (startLineNumber, endLineNumber) => {
                    const index = parentIndexes[parentIndexes.length - 1];
                    return this.getStartLineNumber(index) <= startLineNumber && this.getEndLineNumber(index) >= endLineNumber;
                };
                for (let i = 0, len = this._startIndexes.length; i < len; i++) {
                    const startLineNumber = this._startIndexes[i];
                    const endLineNumber = this._endIndexes[i];
                    if (startLineNumber > exports.MAX_LINE_NUMBER || endLineNumber > exports.MAX_LINE_NUMBER) {
                        throw new Error('startLineNumber or endLineNumber must not exceed ' + exports.MAX_LINE_NUMBER);
                    }
                    while (parentIndexes.length > 0 && !isInsideLast(startLineNumber, endLineNumber)) {
                        parentIndexes.pop();
                    }
                    const parentIndex = parentIndexes.length > 0 ? parentIndexes[parentIndexes.length - 1] : -1;
                    parentIndexes.push(i);
                    this._startIndexes[i] = startLineNumber + ((parentIndex & 0xFF) << 24);
                    this._endIndexes[i] = endLineNumber + ((parentIndex & 0xFF00) << 16);
                }
            }
        }
        get length() {
            return this._startIndexes.length;
        }
        getStartLineNumber(index) {
            return this._startIndexes[index] & exports.MAX_LINE_NUMBER;
        }
        getEndLineNumber(index) {
            return this._endIndexes[index] & exports.MAX_LINE_NUMBER;
        }
        getType(index) {
            return this._types ? this._types[index] : undefined;
        }
        hasTypes() {
            return !!this._types;
        }
        isCollapsed(index) {
            return this._collapseStates.get(index);
        }
        setCollapsed(index, newState) {
            this._collapseStates.set(index, newState);
        }
        isUserDefined(index) {
            return this._userDefinedStates.get(index);
        }
        setUserDefined(index, newState) {
            return this._userDefinedStates.set(index, newState);
        }
        isRecovered(index) {
            return this._recoveredStates.get(index);
        }
        setRecovered(index, newState) {
            return this._recoveredStates.set(index, newState);
        }
        getSource(index) {
            if (this.isUserDefined(index)) {
                return 1 /* FoldSource.userDefined */;
            }
            else if (this.isRecovered(index)) {
                return 2 /* FoldSource.recovered */;
            }
            return 0 /* FoldSource.provider */;
        }
        setSource(index, source) {
            if (source === 1 /* FoldSource.userDefined */) {
                this.setUserDefined(index, true);
                this.setRecovered(index, false);
            }
            else if (source === 2 /* FoldSource.recovered */) {
                this.setUserDefined(index, false);
                this.setRecovered(index, true);
            }
            else {
                this.setUserDefined(index, false);
                this.setRecovered(index, false);
            }
        }
        setCollapsedAllOfType(type, newState) {
            let hasChanged = false;
            if (this._types) {
                for (let i = 0; i < this._types.length; i++) {
                    if (this._types[i] === type) {
                        this.setCollapsed(i, newState);
                        hasChanged = true;
                    }
                }
            }
            return hasChanged;
        }
        toRegion(index) {
            return new FoldingRegion(this, index);
        }
        getParentIndex(index) {
            this.ensureParentIndices();
            const parent = ((this._startIndexes[index] & MASK_INDENT) >>> 24) + ((this._endIndexes[index] & MASK_INDENT) >>> 16);
            if (parent === exports.MAX_FOLDING_REGIONS) {
                return -1;
            }
            return parent;
        }
        contains(index, line) {
            return this.getStartLineNumber(index) <= line && this.getEndLineNumber(index) >= line;
        }
        findIndex(line) {
            let low = 0, high = this._startIndexes.length;
            if (high === 0) {
                return -1; // no children
            }
            while (low < high) {
                const mid = Math.floor((low + high) / 2);
                if (line < this.getStartLineNumber(mid)) {
                    high = mid;
                }
                else {
                    low = mid + 1;
                }
            }
            return low - 1;
        }
        findRange(line) {
            let index = this.findIndex(line);
            if (index >= 0) {
                const endLineNumber = this.getEndLineNumber(index);
                if (endLineNumber >= line) {
                    return index;
                }
                index = this.getParentIndex(index);
                while (index !== -1) {
                    if (this.contains(index, line)) {
                        return index;
                    }
                    index = this.getParentIndex(index);
                }
            }
            return -1;
        }
        toString() {
            const res = [];
            for (let i = 0; i < this.length; i++) {
                res[i] = `[${exports.foldSourceAbbr[this.getSource(i)]}${this.isCollapsed(i) ? '+' : '-'}] ${this.getStartLineNumber(i)}/${this.getEndLineNumber(i)}`;
            }
            return res.join(', ');
        }
        toFoldRange(index) {
            return {
                startLineNumber: this._startIndexes[index] & exports.MAX_LINE_NUMBER,
                endLineNumber: this._endIndexes[index] & exports.MAX_LINE_NUMBER,
                type: this._types ? this._types[index] : undefined,
                isCollapsed: this.isCollapsed(index),
                source: this.getSource(index)
            };
        }
        static fromFoldRanges(ranges) {
            const rangesLength = ranges.length;
            const startIndexes = new Uint32Array(rangesLength);
            const endIndexes = new Uint32Array(rangesLength);
            let types = [];
            let gotTypes = false;
            for (let i = 0; i < rangesLength; i++) {
                const range = ranges[i];
                startIndexes[i] = range.startLineNumber;
                endIndexes[i] = range.endLineNumber;
                types.push(range.type);
                if (range.type) {
                    gotTypes = true;
                }
            }
            if (!gotTypes) {
                types = undefined;
            }
            const regions = new FoldingRegions(startIndexes, endIndexes, types);
            for (let i = 0; i < rangesLength; i++) {
                if (ranges[i].isCollapsed) {
                    regions.setCollapsed(i, true);
                }
                regions.setSource(i, ranges[i].source);
            }
            return regions;
        }
        /**
         * Two inputs, each a FoldingRegions or a FoldRange[], are merged.
         * Each input must be pre-sorted on startLineNumber.
         * The first list is assumed to always include all regions currently defined by range providers.
         * The second list only contains the previously collapsed and all manual ranges.
         * If the line position matches, the range of the new range is taken, and the range is no longer manual
         * When an entry in one list overlaps an entry in the other, the second list's entry "wins" and
         * overlapping entries in the first list are discarded.
         * Invalid entries are discarded. An entry is invalid if:
         * 		the start and end line numbers aren't a valid range of line numbers,
         * 		it is out of sequence or has the same start line as a preceding entry,
         * 		it overlaps a preceding entry and is not fully contained by that entry.
         */
        static sanitizeAndMerge(rangesA, rangesB, maxLineNumber) {
            maxLineNumber = maxLineNumber ?? Number.MAX_VALUE;
            const getIndexedFunction = (r, limit) => {
                return Array.isArray(r)
                    ? ((i) => { return (i < limit) ? r[i] : undefined; })
                    : ((i) => { return (i < limit) ? r.toFoldRange(i) : undefined; });
            };
            const getA = getIndexedFunction(rangesA, rangesA.length);
            const getB = getIndexedFunction(rangesB, rangesB.length);
            let indexA = 0;
            let indexB = 0;
            let nextA = getA(0);
            let nextB = getB(0);
            const stackedRanges = [];
            let topStackedRange;
            let prevLineNumber = 0;
            const resultRanges = [];
            while (nextA || nextB) {
                let useRange = undefined;
                if (nextB && (!nextA || nextA.startLineNumber >= nextB.startLineNumber)) {
                    if (nextA && nextA.startLineNumber === nextB.startLineNumber) {
                        if (nextB.source === 1 /* FoldSource.userDefined */) {
                            // a user defined range (possibly unfolded)
                            useRange = nextB;
                        }
                        else {
                            // a previously folded range or a (possibly unfolded) recovered range
                            useRange = nextA;
                            useRange.isCollapsed = nextB.isCollapsed && nextA.endLineNumber === nextB.endLineNumber;
                            useRange.source = 0 /* FoldSource.provider */;
                        }
                        nextA = getA(++indexA); // not necessary, just for speed
                    }
                    else {
                        useRange = nextB;
                        if (nextB.isCollapsed && nextB.source === 0 /* FoldSource.provider */) {
                            // a previously collapsed range
                            useRange.source = 2 /* FoldSource.recovered */;
                        }
                    }
                    nextB = getB(++indexB);
                }
                else {
                    // nextA is next. The user folded B set takes precedence and we sometimes need to look
                    // ahead in it to check for an upcoming conflict.
                    let scanIndex = indexB;
                    let prescanB = nextB;
                    while (true) {
                        if (!prescanB || prescanB.startLineNumber > nextA.endLineNumber) {
                            useRange = nextA;
                            break; // no conflict, use this nextA
                        }
                        if (prescanB.source === 1 /* FoldSource.userDefined */ && prescanB.endLineNumber > nextA.endLineNumber) {
                            // we found a user folded range, it wins
                            break; // without setting nextResult, so this nextA gets skipped
                        }
                        prescanB = getB(++scanIndex);
                    }
                    nextA = getA(++indexA);
                }
                if (useRange) {
                    while (topStackedRange
                        && topStackedRange.endLineNumber < useRange.startLineNumber) {
                        topStackedRange = stackedRanges.pop();
                    }
                    if (useRange.endLineNumber > useRange.startLineNumber
                        && useRange.startLineNumber > prevLineNumber
                        && useRange.endLineNumber <= maxLineNumber
                        && (!topStackedRange
                            || topStackedRange.endLineNumber >= useRange.endLineNumber)) {
                        resultRanges.push(useRange);
                        prevLineNumber = useRange.startLineNumber;
                        if (topStackedRange) {
                            stackedRanges.push(topStackedRange);
                        }
                        topStackedRange = useRange;
                    }
                }
            }
            return resultRanges;
        }
    }
    exports.FoldingRegions = FoldingRegions;
    class FoldingRegion {
        constructor(ranges, index) {
            this.ranges = ranges;
            this.index = index;
        }
        get startLineNumber() {
            return this.ranges.getStartLineNumber(this.index);
        }
        get endLineNumber() {
            return this.ranges.getEndLineNumber(this.index);
        }
        get regionIndex() {
            return this.index;
        }
        get parentIndex() {
            return this.ranges.getParentIndex(this.index);
        }
        get isCollapsed() {
            return this.ranges.isCollapsed(this.index);
        }
        containedBy(range) {
            return range.startLineNumber <= this.startLineNumber && range.endLineNumber >= this.endLineNumber;
        }
        containsLine(lineNumber) {
            return this.startLineNumber <= lineNumber && lineNumber <= this.endLineNumber;
        }
        hidesLine(lineNumber) {
            return this.startLineNumber < lineNumber && lineNumber <= this.endLineNumber;
        }
    }
    exports.FoldingRegion = FoldingRegion;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZ1Jhbmdlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2ZvbGRpbmcvYnJvd3Nlci9mb2xkaW5nUmFuZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxJQUFrQixVQUlqQjtJQUpELFdBQWtCLFVBQVU7UUFDM0IsbURBQVksQ0FBQTtRQUNaLHlEQUFlLENBQUE7UUFDZixxREFBYSxDQUFBO0lBQ2QsQ0FBQyxFQUppQixVQUFVLDBCQUFWLFVBQVUsUUFJM0I7SUFFWSxRQUFBLGNBQWMsR0FBRztRQUM3Qiw2QkFBcUIsRUFBRSxHQUFHO1FBQzFCLGdDQUF3QixFQUFFLEdBQUc7UUFDN0IsOEJBQXNCLEVBQUUsR0FBRztLQUMzQixDQUFDO0lBVVcsUUFBQSxtQkFBbUIsR0FBRyxNQUFNLENBQUM7SUFDN0IsUUFBQSxlQUFlLEdBQUcsUUFBUSxDQUFDO0lBRXhDLE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUUvQixNQUFNLFFBQVE7UUFFYixZQUFZLElBQVk7WUFDdkIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRU0sR0FBRyxDQUFDLEtBQWE7WUFDdkIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sR0FBRyxHQUFHLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENB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