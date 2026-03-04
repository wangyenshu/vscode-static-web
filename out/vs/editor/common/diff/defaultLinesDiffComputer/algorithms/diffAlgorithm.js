/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/editor/common/core/offsetRange"], function (require, exports, arrays_1, errors_1, offsetRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DateTimeout = exports.InfiniteTimeout = exports.OffsetPair = exports.SequenceDiff = exports.DiffAlgorithmResult = void 0;
    class DiffAlgorithmResult {
        static trivial(seq1, seq2) {
            return new DiffAlgorithmResult([new SequenceDiff(offsetRange_1.OffsetRange.ofLength(seq1.length), offsetRange_1.OffsetRange.ofLength(seq2.length))], false);
        }
        static trivialTimedOut(seq1, seq2) {
            return new DiffAlgorithmResult([new SequenceDiff(offsetRange_1.OffsetRange.ofLength(seq1.length), offsetRange_1.OffsetRange.ofLength(seq2.length))], true);
        }
        constructor(diffs, 
        /**
         * Indicates if the time out was reached.
         * In that case, the diffs might be an approximation and the user should be asked to rerun the diff with more time.
         */
        hitTimeout) {
            this.diffs = diffs;
            this.hitTimeout = hitTimeout;
        }
    }
    exports.DiffAlgorithmResult = DiffAlgorithmResult;
    class SequenceDiff {
        static invert(sequenceDiffs, doc1Length) {
            const result = [];
            (0, arrays_1.forEachAdjacent)(sequenceDiffs, (a, b) => {
                result.push(SequenceDiff.fromOffsetPairs(a ? a.getEndExclusives() : OffsetPair.zero, b ? b.getStarts() : new OffsetPair(doc1Length, (a ? a.seq2Range.endExclusive - a.seq1Range.endExclusive : 0) + doc1Length)));
            });
            return result;
        }
        static fromOffsetPairs(start, endExclusive) {
            return new SequenceDiff(new offsetRange_1.OffsetRange(start.offset1, endExclusive.offset1), new offsetRange_1.OffsetRange(start.offset2, endExclusive.offset2));
        }
        constructor(seq1Range, seq2Range) {
            this.seq1Range = seq1Range;
            this.seq2Range = seq2Range;
        }
        swap() {
            return new SequenceDiff(this.seq2Range, this.seq1Range);
        }
        toString() {
            return `${this.seq1Range} <-> ${this.seq2Range}`;
        }
        join(other) {
            return new SequenceDiff(this.seq1Range.join(other.seq1Range), this.seq2Range.join(other.seq2Range));
        }
        delta(offset) {
            if (offset === 0) {
                return this;
            }
            return new SequenceDiff(this.seq1Range.delta(offset), this.seq2Range.delta(offset));
        }
        deltaStart(offset) {
            if (offset === 0) {
                return this;
            }
            return new SequenceDiff(this.seq1Range.deltaStart(offset), this.seq2Range.deltaStart(offset));
        }
        deltaEnd(offset) {
            if (offset === 0) {
                return this;
            }
            return new SequenceDiff(this.seq1Range.deltaEnd(offset), this.seq2Range.deltaEnd(offset));
        }
        intersectsOrTouches(other) {
            return this.seq1Range.intersectsOrTouches(other.seq1Range) || this.seq2Range.intersectsOrTouches(other.seq2Range);
        }
        intersect(other) {
            const i1 = this.seq1Range.intersect(other.seq1Range);
            const i2 = this.seq2Range.intersect(other.seq2Range);
            if (!i1 || !i2) {
                return undefined;
            }
            return new SequenceDiff(i1, i2);
        }
        getStarts() {
            return new OffsetPair(this.seq1Range.start, this.seq2Range.start);
        }
        getEndExclusives() {
            return new OffsetPair(this.seq1Range.endExclusive, this.seq2Range.endExclusive);
        }
    }
    exports.SequenceDiff = SequenceDiff;
    class OffsetPair {
        static { this.zero = new OffsetPair(0, 0); }
        static { this.max = new OffsetPair(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER); }
        constructor(offset1, offset2) {
            this.offset1 = offset1;
            this.offset2 = offset2;
        }
        toString() {
            return `${this.offset1} <-> ${this.offset2}`;
        }
        delta(offset) {
            if (offset === 0) {
                return this;
            }
            return new OffsetPair(this.offset1 + offset, this.offset2 + offset);
        }
        equals(other) {
            return this.offset1 === other.offset1 && this.offset2 === other.offset2;
        }
    }
    exports.OffsetPair = OffsetPair;
    class InfiniteTimeout {
        static { this.instance = new InfiniteTimeout(); }
        isValid() {
            return true;
        }
    }
    exports.InfiniteTimeout = InfiniteTimeout;
    class DateTimeout {
        constructor(timeout) {
            this.timeout = timeout;
            this.startTime = Date.now();
            this.valid = true;
            if (timeout <= 0) {
                throw new errors_1.BugIndicatingError('timeout must be positive');
            }
        }
        // Recommendation: Set a log-point `{this.disable()}` in the body
        isValid() {
            const valid = Date.now() - this.startTime < this.timeout;
            if (!valid && this.valid) {
                this.valid = false; // timeout reached
                // eslint-disable-next-line no-debugger
                debugger; // WARNING: Most likely debugging caused the timeout. Call `this.disable()` to continue without timing out.
            }
            return this.valid;
        }
        disable() {
            this.timeout = Number.MAX_SAFE_INTEGER;
            this.isValid = () => true;
            this.valid = true;
        }
    }
    exports.DateTimeout = DateTimeout;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkFsZ29yaXRobS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vZGlmZi9kZWZhdWx0TGluZXNEaWZmQ29tcHV0ZXIvYWxnb3JpdGhtcy9kaWZmQWxnb3JpdGhtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFhLG1CQUFtQjtRQUMvQixNQUFNLENBQUMsT0FBTyxDQUFDLElBQWUsRUFBRSxJQUFlO1lBQzlDLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLElBQUksWUFBWSxDQUFDLHlCQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSx5QkFBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pJLENBQUM7UUFFRCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQWUsRUFBRSxJQUFlO1lBQ3RELE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLElBQUksWUFBWSxDQUFDLHlCQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSx5QkFBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hJLENBQUM7UUFFRCxZQUNpQixLQUFxQjtRQUNyQzs7O1dBR0c7UUFDYSxVQUFtQjtZQUxuQixVQUFLLEdBQUwsS0FBSyxDQUFnQjtZQUtyQixlQUFVLEdBQVYsVUFBVSxDQUFTO1FBQ2hDLENBQUM7S0FDTDtJQWpCRCxrREFpQkM7SUFFRCxNQUFhLFlBQVk7UUFDakIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUE2QixFQUFFLFVBQWtCO1lBQ3JFLE1BQU0sTUFBTSxHQUFtQixFQUFFLENBQUM7WUFDbEMsSUFBQSx3QkFBZSxFQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUN2QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUMxQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQzFILENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRU0sTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFpQixFQUFFLFlBQXdCO1lBQ3hFLE9BQU8sSUFBSSxZQUFZLENBQ3RCLElBQUkseUJBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFDcEQsSUFBSSx5QkFBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUNwRCxDQUFDO1FBQ0gsQ0FBQztRQUVELFlBQ2lCLFNBQXNCLEVBQ3RCLFNBQXNCO1lBRHRCLGNBQVMsR0FBVCxTQUFTLENBQWE7WUFDdEIsY0FBUyxHQUFULFNBQVMsQ0FBYTtRQUNuQyxDQUFDO1FBRUUsSUFBSTtZQUNWLE9BQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVNLFFBQVE7WUFDZCxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsUUFBUSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDbEQsQ0FBQztRQUVNLElBQUksQ0FBQyxLQUFtQjtZQUM5QixPQUFPLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNyRyxDQUFDO1FBRU0sS0FBSyxDQUFDLE1BQWM7WUFDMUIsSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBRU0sVUFBVSxDQUFDLE1BQWM7WUFDL0IsSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMvRixDQUFDO1FBRU0sUUFBUSxDQUFDLE1BQWM7WUFDN0IsSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMzRixDQUFDO1FBRU0sbUJBQW1CLENBQUMsS0FBbUI7WUFDN0MsT0FBTyxJ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