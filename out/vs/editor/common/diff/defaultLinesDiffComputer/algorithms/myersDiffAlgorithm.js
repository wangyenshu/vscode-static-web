/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/offsetRange", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm"], function (require, exports, offsetRange_1, diffAlgorithm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MyersDiffAlgorithm = void 0;
    /**
     * An O(ND) diff algorithm that has a quadratic space worst-case complexity.
    */
    class MyersDiffAlgorithm {
        compute(seq1, seq2, timeout = diffAlgorithm_1.InfiniteTimeout.instance) {
            // These are common special cases.
            // The early return improves performance dramatically.
            if (seq1.length === 0 || seq2.length === 0) {
                return diffAlgorithm_1.DiffAlgorithmResult.trivial(seq1, seq2);
            }
            const seqX = seq1; // Text on the x axis
            const seqY = seq2; // Text on the y axis
            function getXAfterSnake(x, y) {
                while (x < seqX.length && y < seqY.length && seqX.getElement(x) === seqY.getElement(y)) {
                    x++;
                    y++;
                }
                return x;
            }
            let d = 0;
            // V[k]: X value of longest d-line that ends in diagonal k.
            // d-line: path from (0,0) to (x,y) that uses exactly d non-diagonals.
            // diagonal k: Set of points (x,y) with x-y = k.
            // k=1 -> (1,0),(2,1)
            const V = new FastInt32Array();
            V.set(0, getXAfterSnake(0, 0));
            const paths = new FastArrayNegativeIndices();
            paths.set(0, V.get(0) === 0 ? null : new SnakePath(null, 0, 0, V.get(0)));
            let k = 0;
            loop: while (true) {
                d++;
                if (!timeout.isValid()) {
                    return diffAlgorithm_1.DiffAlgorithmResult.trivialTimedOut(seqX, seqY);
                }
                // The paper has `for (k = -d; k <= d; k += 2)`, but we can ignore diagonals that cannot influence the result.
                const lowerBound = -Math.min(d, seqY.length + (d % 2));
                const upperBound = Math.min(d, seqX.length + (d % 2));
                for (k = lowerBound; k <= upperBound; k += 2) {
                    let step = 0;
                    // We can use the X values of (d-1)-lines to compute X value of the longest d-lines.
                    const maxXofDLineTop = k === upperBound ? -1 : V.get(k + 1); // We take a vertical non-diagonal (add a symbol in seqX)
                    const maxXofDLineLeft = k === lowerBound ? -1 : V.get(k - 1) + 1; // We take a horizontal non-diagonal (+1 x) (delete a symbol in seqX)
                    step++;
                    const x = Math.min(Math.max(maxXofDLineTop, maxXofDLineLeft), seqX.length);
                    const y = x - k;
                    step++;
                    if (x > seqX.length || y > seqY.length) {
                        // This diagonal is irrelevant for the result.
                        // TODO: Don't pay the cost for this in the next iteration.
                        continue;
                    }
                    const newMaxX = getXAfterSnake(x, y);
                    V.set(k, newMaxX);
                    const lastPath = x === maxXofDLineTop ? paths.get(k + 1) : paths.get(k - 1);
                    paths.set(k, newMaxX !== x ? new SnakePath(lastPath, x, y, newMaxX - x) : lastPath);
                    if (V.get(k) === seqX.length && V.get(k) - k === seqY.length) {
                        break loop;
                    }
                }
            }
            let path = paths.get(k);
            const result = [];
            let lastAligningPosS1 = seqX.length;
            let lastAligningPosS2 = seqY.length;
            while (true) {
                const endX = path ? path.x + path.length : 0;
                const endY = path ? path.y + path.length : 0;
                if (endX !== lastAligningPosS1 || endY !== lastAligningPosS2) {
                    result.push(new diffAlgorithm_1.SequenceDiff(new offsetRange_1.OffsetRange(endX, lastAligningPosS1), new offsetRange_1.OffsetRange(endY, lastAligningPosS2)));
                }
                if (!path) {
                    break;
                }
                lastAligningPosS1 = path.x;
                lastAligningPosS2 = path.y;
                path = path.prev;
            }
            result.reverse();
            return new diffAlgorithm_1.DiffAlgorithmResult(result, false);
        }
    }
    exports.MyersDiffAlgorithm = MyersDiffAlgorithm;
    class SnakePath {
        constructor(prev, x, y, length) {
            this.prev = prev;
            this.x = x;
            this.y = y;
            this.length = length;
        }
    }
    /**
     * An array that supports fast negative indices.
    */
    class FastInt32Array {
        constructor() {
            this.positiveArr = new Int32Array(10);
            this.negativeArr = new Int32Array(10);
        }
        get(idx) {
            if (idx < 0) {
                idx = -idx - 1;
                return this.negativeArr[idx];
            }
            else {
                return this.positiveArr[idx];
            }
        }
        set(idx, value) {
            if (idx < 0) {
                idx = -idx - 1;
                if (idx >= this.negativeArr.length) {
                    const arr = this.negativeArr;
                    this.negativeArr = new Int32Array(arr.length * 2);
                    this.negativeArr.set(arr);
                }
                this.negativeArr[idx] = value;
            }
            else {
                if (idx >= this.positiveArr.length) {
                    const arr = this.positiveArr;
                    this.positiveArr = new Int32Array(arr.length * 2);
                    this.positiveArr.set(arr);
                }
                this.positiveArr[idx] = value;
            }
        }
    }
    /**
     * An array that supports fast negative indices.
    */
    class FastArrayNegativeIndices {
        constructor() {
            this.positiveArr = [];
            this.negativeArr = [];
        }
        get(idx) {
            if (idx < 0) {
                idx = -idx - 1;
                return this.negativeArr[idx];
            }
            else {
                return this.positiveArr[idx];
            }
        }
        set(idx, value) {
            if (idx < 0) {
                idx = -idx - 1;
                this.negativeArr[idx] = value;
            }
            else {
                this.positiveArr[idx] = value;
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXllcnNEaWZmQWxnb3JpdGhtLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9kaWZmL2RlZmF1bHRMaW5lc0RpZmZDb21wdXRlci9hbGdvcml0aG1zL215ZXJzRGlmZkFsZ29yaXRobS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEc7O01BRUU7SUFDRixNQUFhLGtCQUFrQjtRQUM5QixPQUFPLENBQUMsSUFBZSxFQUFFLElBQWUsRUFBRSxVQUFvQiwrQkFBZSxDQUFDLFFBQVE7WUFDckYsa0NBQWtDO1lBQ2xDLHNEQUFzRDtZQUN0RCxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzVDLE9BQU8sbUNBQW1CLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoRCxDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMscUJBQXFCO1lBQ3hDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLHFCQUFxQjtZQUV4QyxTQUFTLGNBQWMsQ0FBQyxDQUFTLEVBQUUsQ0FBUztnQkFDM0MsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDeEYsQ0FBQyxFQUFFLENBQUM7b0JBQ0osQ0FBQyxFQUFFLENBQUM7Z0JBQ0wsQ0FBQztnQkFDRCxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFFRCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFD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