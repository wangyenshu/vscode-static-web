/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/offsetRange", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm", "vs/editor/common/diff/defaultLinesDiffComputer/utils"], function (require, exports, offsetRange_1, diffAlgorithm_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicProgrammingDiffing = void 0;
    /**
     * A O(MN) diffing algorithm that supports a score function.
     * The algorithm can be improved by processing the 2d array diagonally.
    */
    class DynamicProgrammingDiffing {
        compute(sequence1, sequence2, timeout = diffAlgorithm_1.InfiniteTimeout.instance, equalityScore) {
            if (sequence1.length === 0 || sequence2.length === 0) {
                return diffAlgorithm_1.DiffAlgorithmResult.trivial(sequence1, sequence2);
            }
            /**
             * lcsLengths.get(i, j): Length of the longest common subsequence of sequence1.substring(0, i + 1) and sequence2.substring(0, j + 1).
             */
            const lcsLengths = new utils_1.Array2D(sequence1.length, sequence2.length);
            const directions = new utils_1.Array2D(sequence1.length, sequence2.length);
            const lengths = new utils_1.Array2D(sequence1.length, sequence2.length);
            // ==== Initializing lcsLengths ====
            for (let s1 = 0; s1 < sequence1.length; s1++) {
                for (let s2 = 0; s2 < sequence2.length; s2++) {
                    if (!timeout.isValid()) {
                        return diffAlgorithm_1.DiffAlgorithmResult.trivialTimedOut(sequence1, sequence2);
                    }
                    const horizontalLen = s1 === 0 ? 0 : lcsLengths.get(s1 - 1, s2);
                    const verticalLen = s2 === 0 ? 0 : lcsLengths.get(s1, s2 - 1);
                    let extendedSeqScore;
                    if (sequence1.getElement(s1) === sequence2.getElement(s2)) {
                        if (s1 === 0 || s2 === 0) {
                            extendedSeqScore = 0;
                        }
                        else {
                            extendedSeqScore = lcsLengths.get(s1 - 1, s2 - 1);
                        }
                        if (s1 > 0 && s2 > 0 && directions.get(s1 - 1, s2 - 1) === 3) {
                            // Prefer consecutive diagonals
                            extendedSeqScore += lengths.get(s1 - 1, s2 - 1);
                        }
                        extendedSeqScore += (equalityScore ? equalityScore(s1, s2) : 1);
                    }
                    else {
                        extendedSeqScore = -1;
                    }
                    const newValue = Math.max(horizontalLen, verticalLen, extendedSeqScore);
                    if (newValue === extendedSeqScore) {
                        // Prefer diagonals
                        const prevLen = s1 > 0 && s2 > 0 ? lengths.get(s1 - 1, s2 - 1) : 0;
                        lengths.set(s1, s2, prevLen + 1);
                        directions.set(s1, s2, 3);
                    }
                    else if (newValue === horizontalLen) {
                        lengths.set(s1, s2, 0);
                        directions.set(s1, s2, 1);
                    }
                    else if (newValue === verticalLen) {
                        lengths.set(s1, s2, 0);
                        directions.set(s1, s2, 2);
                    }
                    lcsLengths.set(s1, s2, newValue);
                }
            }
            // ==== Backtracking ====
            const result = [];
            let lastAligningPosS1 = sequence1.length;
            let lastAligningPosS2 = sequence2.length;
            function reportDecreasingAligningPositions(s1, s2) {
                if (s1 + 1 !== lastAligningPosS1 || s2 + 1 !== lastAligningPosS2) {
                    result.push(new diffAlgorithm_1.SequenceDiff(new offsetRange_1.OffsetRange(s1 + 1, lastAligningPosS1), new offsetRange_1.OffsetRange(s2 + 1, lastAligningPosS2)));
                }
                lastAligningPosS1 = s1;
                lastAligningPosS2 = s2;
            }
            let s1 = sequence1.length - 1;
            let s2 = sequence2.length - 1;
            while (s1 >= 0 && s2 >= 0) {
                if (directions.get(s1, s2) === 3) {
                    reportDecreasingAligningPositions(s1, s2);
                    s1--;
                    s2--;
                }
                else {
                    if (directions.get(s1, s2) === 1) {
                        s1--;
                    }
                    else {
                        s2--;
                    }
                }
            }
            reportDecreasingAligningPositions(-1, -1);
            result.reverse();
            return new diffAlgorithm_1.DiffAlgorithmResult(result, false);
        }
    }
    exports.DynamicProgrammingDiffing = DynamicProgrammingDiffing;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1pY1Byb2dyYW1taW5nRGlmZmluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vZGlmZi9kZWZhdWx0TGluZXNEaWZmQ29tcHV0ZXIvYWxnb3JpdGhtcy9keW5hbWljUHJvZ3JhbW1pbmdEaWZmaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRzs7O01BR0U7SUFDRixNQUFhLHlCQUF5QjtRQUNyQyxPQUFPLENBQUMsU0FBb0IsRUFBRSxTQUFvQixFQUFFLFVBQW9CLCtCQUFlLENBQUMsUUFBUSxFQUFFLGFBQTREO1lBQzdKLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdEQsT0FBTyxtQ0FBbUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFELENBQUM7WUFFRDs7ZUFFRztZQUNILE1BQU0sVUFBVSxHQUFHLElBQUksZUFBTyxDQUFTLFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNFLE1BQU0sVUFBVSxHQUFHLElBQUksZUFBTyxDQUFTLFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNFLE1BQU0sT0FBTyxHQUFHLElBQUksZUFBTyxDQUFTLFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXhFLG9DQUFvQztZQUNwQyxLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO29CQUM5QyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7d0JBQ3hCLE9BQU8sbUNBQW1CLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDbEUsQ0FBQztvQkFFRCxNQUFNLGFBQWEsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDaEUsTUFBTSxXQUFXLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBRTlELElBQUksZ0JBQXdCLENBQUM7b0JBQzdCLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsS0FBSyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQzNELElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7NEJBQzFCLGdCQUFnQixHQUFHLENBQUMsQ0FBQzt3QkFDdEIsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ25ELENBQUM7d0JBQ0QsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQzs0QkFDOUQsK0JBQStCOzRCQUMvQixnQkFBZ0IsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUNqRCxDQUFDO3dCQUNELGdCQUFnQixJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDakUsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN2QixDQUFDO29CQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO29CQUV4RSxJQUFJLFFBQVEsS0FBSyxnQkFBZ0IsRUFBRSxDQUFDO3dCQUNuQyxtQkFBbUI7d0JBQ25CLE1BQU0sT0FBTyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNuRSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUNqQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzNCLENBQUM7eUJBQU0sSUFBSSxRQUFRLEtBQUssYUFBYSxFQUFFLENBQUM7d0JBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdkIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUMzQixDQUFDO3lCQUFNLElBQUksUUFBUSxLQUFLLFdBQVcsRUFBRSxDQUFDO3dCQUNyQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3ZCLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDM0IsQ0FBQztvQkFFRCxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7WUFDRixDQUFDO1lBRUQseUJBQXlCO1lBQ3pCLE1BQU0sTUFBTSxHQUFtQixFQUFFLENBQUM7WUFDbEMsSUFBSSxpQkFBaUIsR0FBVyxTQUFTLENBQUMsTUFBTSxDQUFDO1lBQ2pELElBQUksaUJBQWlCLEdBQVcsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUVqRCxTQUFTLGlDQUFpQyxDQUFDLEVBQVUsRUFBRSxFQUFVO2dCQUNoRSxJQUFJLEVBQUUsR0FBRyxDQUFDLEtBQUssaUJBQWlCLElBQUksRUFBRSxHQUFHLENBQUMsS0FBSyxpQkFBaUIsRUFBRSxDQUFDO29CQUNsRSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksNEJBQVksQ0FDM0IsSUFBSSx5QkFBVyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsRUFDMUMsSUFBSSx5QkFBVyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FDMUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBQ0QsaUJBQWlCLEdBQUcsRUFBRSxDQUFDO2dCQUN2QixpQkFBaUIsR0FBRyxFQUFFLENBQUM7WUFDeEIsQ0FBQztZQUVELElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2xDLGlDQUFpQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDMUMsRUFBRSxFQUFFLENBQUM7b0JBQ0wsRUFBRSxFQUFFLENBQUM7Z0JBQ04sQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ2xDLEVBQUUsRUFBRSxDQUFDO29CQUNOLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxFQUFFLEVBQUUsQ0FBQztvQkFDTixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsaUNBQWlDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakIsT0FBTyxJQUFJLG1DQUFtQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxDQUFDO0tBQ0Q7SUE3RkQsOERBNkZDIn0=