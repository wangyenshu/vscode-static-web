/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/assert", "vs/editor/common/core/lineRange", "vs/editor/common/core/offsetRange", "vs/editor/common/core/range", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/dynamicProgrammingDiffing", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/myersDiffAlgorithm", "vs/editor/common/diff/defaultLinesDiffComputer/computeMovedLines", "vs/editor/common/diff/defaultLinesDiffComputer/heuristicSequenceOptimizations", "vs/editor/common/diff/defaultLinesDiffComputer/lineSequence", "vs/editor/common/diff/defaultLinesDiffComputer/linesSliceCharSequence", "vs/editor/common/diff/linesDiffComputer", "../rangeMapping"], function (require, exports, arrays_1, assert_1, lineRange_1, offsetRange_1, range_1, diffAlgorithm_1, dynamicProgrammingDiffing_1, myersDiffAlgorithm_1, computeMovedLines_1, heuristicSequenceOptimizations_1, lineSequence_1, linesSliceCharSequence_1, linesDiffComputer_1, rangeMapping_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultLinesDiffComputer = void 0;
    exports.lineRangeMappingFromRangeMappings = lineRangeMappingFromRangeMappings;
    exports.getLineRangeMapping = getLineRangeMapping;
    class DefaultLinesDiffComputer {
        constructor() {
            this.dynamicProgrammingDiffing = new dynamicProgrammingDiffing_1.DynamicProgrammingDiffing();
            this.myersDiffingAlgorithm = new myersDiffAlgorithm_1.MyersDiffAlgorithm();
        }
        computeDiff(originalLines, modifiedLines, options) {
            if (originalLines.length <= 1 && (0, arrays_1.equals)(originalLines, modifiedLines, (a, b) => a === b)) {
                return new linesDiffComputer_1.LinesDiff([], [], false);
            }
            if (originalLines.length === 1 && originalLines[0].length === 0 || modifiedLines.length === 1 && modifiedLines[0].length === 0) {
                return new linesDiffComputer_1.LinesDiff([
                    new rangeMapping_1.DetailedLineRangeMapping(new lineRange_1.LineRange(1, originalLines.length + 1), new lineRange_1.LineRange(1, modifiedLines.length + 1), [
                        new rangeMapping_1.RangeMapping(new range_1.Range(1, 1, originalLines.length, originalLines[originalLines.length - 1].length + 1), new range_1.Range(1, 1, modifiedLines.length, modifiedLines[modifiedLines.length - 1].length + 1))
                    ])
                ], [], false);
            }
            const timeout = options.maxComputationTimeMs === 0 ? diffAlgorithm_1.InfiniteTimeout.instance : new diffAlgorithm_1.DateTimeout(options.maxComputationTimeMs);
            const considerWhitespaceChanges = !options.ignoreTrimWhitespace;
            const perfectHashes = new Map();
            function getOrCreateHash(text) {
                let hash = perfectHashes.get(text);
                if (hash === undefined) {
                    hash = perfectHashes.size;
                    perfectHashes.set(text, hash);
                }
                return hash;
            }
            const originalLinesHashes = originalLines.map((l) => getOrCreateHash(l.trim()));
            const modifiedLinesHashes = modifiedLines.map((l) => getOrCreateHash(l.trim()));
            const sequence1 = new lineSequence_1.LineSequence(originalLinesHashes, originalLines);
            const sequence2 = new lineSequence_1.LineSequence(modifiedLinesHashes, modifiedLines);
            const lineAlignmentResult = (() => {
                if (sequence1.length + sequence2.length < 1700) {
                    // Use the improved algorithm for small files
                    return this.dynamicProgrammingDiffing.compute(sequence1, sequence2, timeout, (offset1, offset2) => originalLines[offset1] === modifiedLines[offset2]
                        ? modifiedLines[offset2].length === 0
                            ? 0.1
                            : 1 + Math.log(1 + modifiedLines[offset2].length)
                        : 0.99);
                }
                return this.myersDiffingAlgorithm.compute(sequence1, sequence2);
            })();
            let lineAlignments = lineAlignmentResult.diffs;
            let hitTimeout = lineAlignmentResult.hitTimeout;
            lineAlignments = (0, heuristicSequenceOptimizations_1.optimizeSequenceDiffs)(sequence1, sequence2, lineAlignments);
            lineAlignments = (0, heuristicSequenceOptimizations_1.removeVeryShortMatchingLinesBetweenDiffs)(sequence1, sequence2, lineAlignments);
            const alignments = [];
            const scanForWhitespaceChanges = (equalLinesCount) => {
                if (!considerWhitespaceChanges) {
                    return;
                }
                for (let i = 0; i < equalLinesCount; i++) {
                    const seq1Offset = seq1LastStart + i;
                    const seq2Offset = seq2LastStart + i;
                    if (originalLines[seq1Offset] !== modifiedLines[seq2Offset]) {
                        // This is because of whitespace changes, diff these lines
                        const characterDiffs = this.refineDiff(originalLines, modifiedLines, new diffAlgorithm_1.SequenceDiff(new offsetRange_1.OffsetRange(seq1Offset, seq1Offset + 1), new offsetRange_1.OffsetRange(seq2Offset, seq2Offset + 1)), timeout, considerWhitespaceChanges);
                        for (const a of characterDiffs.mappings) {
                            alignments.push(a);
                        }
                        if (characterDiffs.hitTimeout) {
                            hitTimeout = true;
                        }
                    }
                }
            };
            let seq1LastStart = 0;
            let seq2LastStart = 0;
            for (const diff of lineAlignments) {
                (0, assert_1.assertFn)(() => diff.seq1Range.start - seq1LastStart === diff.seq2Range.start - seq2LastStart);
                const equalLinesCount = diff.seq1Range.start - seq1LastStart;
                scanForWhitespaceChanges(equalLinesCount);
                seq1LastStart = diff.seq1Range.endExclusive;
                seq2LastStart = diff.seq2Range.endExclusive;
                const characterDiffs = this.refineDiff(originalLines, modifiedLines, diff, timeout, considerWhitespaceChanges);
                if (characterDiffs.hitTimeout) {
                    hitTimeout = true;
                }
                for (const a of characterDiffs.mappings) {
                    alignments.push(a);
                }
            }
            scanForWhitespaceChanges(originalLines.length - seq1LastStart);
            const changes = lineRangeMappingFromRangeMappings(alignments, originalLines, modifiedLines);
            let moves = [];
            if (options.computeMoves) {
                moves = this.computeMoves(changes, originalLines, modifiedLines, originalLinesHashes, modifiedLinesHashes, timeout, considerWhitespaceChanges);
            }
            // Make sure all ranges are valid
            (0, assert_1.assertFn)(() => {
                function validatePosition(pos, lines) {
                    if (pos.lineNumber < 1 || pos.lineNumber > lines.length) {
                        return false;
                    }
                    const line = lines[pos.lineNumber - 1];
                    if (pos.column < 1 || pos.column > line.length + 1) {
                        return false;
                    }
                    return true;
                }
                function validateRange(range, lines) {
                    if (range.startLineNumber < 1 || range.startLineNumber > lines.length + 1) {
                        return false;
                    }
                    if (range.endLineNumberExclusive < 1 || range.endLineNumberExclusive > lines.length + 1) {
                        return false;
                    }
                    return true;
                }
                for (const c of changes) {
                    if (!c.innerChanges) {
                        return false;
                    }
                    for (const ic of c.innerChanges) {
                        const valid = validatePosition(ic.modifiedRange.getStartPosition(), modifiedLines) && validatePosition(ic.modifiedRange.getEndPosition(), modifiedLines) &&
                            validatePosition(ic.originalRange.getStartPosition(), originalLines) && validatePosition(ic.originalRange.getEndPosition(), originalLines);
                        if (!valid) {
                            return false;
                        }
                    }
                    if (!validateRange(c.modified, modifiedLines) || !validateRange(c.original, originalLines)) {
                        return false;
                    }
                }
                return true;
            });
            return new linesDiffComputer_1.LinesDiff(changes, moves, hitTimeout);
        }
        computeMoves(changes, originalLines, modifiedLines, hashedOriginalLines, hashedModifiedLines, timeout, considerWhitespaceChanges) {
            const moves = (0, computeMovedLines_1.computeMovedLines)(changes, originalLines, modifiedLines, hashedOriginalLines, hashedModifiedLines, timeout);
            const movesWithDiffs = moves.map(m => {
                const moveChanges = this.refineDiff(originalLines, modifiedLines, new diffAlgorithm_1.SequenceDiff(m.original.toOffsetRange(), m.modified.toOffsetRange()), timeout, considerWhitespaceChanges);
                const mappings = lineRangeMappingFromRangeMappings(moveChanges.mappings, originalLines, modifiedLines, true);
                return new linesDiffComputer_1.MovedText(m, mappings);
            });
            return movesWithDiffs;
        }
        refineDiff(originalLines, modifiedLines, diff, timeout, considerWhitespaceChanges) {
            const slice1 = new linesSliceCharSequence_1.LinesSliceCharSequence(originalLines, diff.seq1Range, considerWhitespaceChanges);
            const slice2 = new linesSliceCharSequence_1.LinesSliceCharSequence(modifiedLines, diff.seq2Range, considerWhitespaceChanges);
            const diffResult = slice1.length + slice2.length < 500
                ? this.dynamicProgrammingDiffing.compute(slice1, slice2, timeout)
                : this.myersDiffingAlgorithm.compute(slice1, slice2, timeout);
            let diffs = diffResult.diffs;
            diffs = (0, heuristicSequenceOptimizations_1.optimizeSequenceDiffs)(slice1, slice2, diffs);
            diffs = (0, heuristicSequenceOptimizations_1.extendDiffsToEntireWordIfAppropriate)(slice1, slice2, diffs);
            diffs = (0, heuristicSequenceOptimizations_1.removeShortMatches)(slice1, slice2, diffs);
            diffs = (0, heuristicSequenceOptimizations_1.removeVeryShortMatchingTextBetweenLongDiffs)(slice1, slice2, diffs);
            const result = diffs.map((d) => new rangeMapping_1.RangeMapping(slice1.translateRange(d.seq1Range), slice2.translateRange(d.seq2Range)));
            // Assert: result applied on original should be the same as diff applied to original
            return {
                mappings: result,
                hitTimeout: diffResult.hitTimeout,
            };
        }
    }
    exports.DefaultLinesDiffComputer = DefaultLinesDiffComputer;
    function lineRangeMappingFromRangeMappings(alignments, originalLines, modifiedLines, dontAssertStartLine = false) {
        const changes = [];
        for (const g of (0, arrays_1.groupAdjacentBy)(alignments.map(a => getLineRangeMapping(a, originalLines, modifiedLines)), (a1, a2) => a1.original.overlapOrTouch(a2.original)
            || a1.modified.overlapOrTouch(a2.modified))) {
            const first = g[0];
            const last = g[g.length - 1];
            changes.push(new rangeMapping_1.DetailedLineRangeMapping(first.original.join(last.original), first.modified.join(last.modified), g.map(a => a.innerChanges[0])));
        }
        (0, assert_1.assertFn)(() => {
            if (!dontAssertStartLine && changes.length > 0) {
                if (changes[0].modified.startLineNumber !== changes[0].original.startLineNumber) {
                    return false;
                }
                if (modifiedLines.length - changes[changes.length - 1].modified.endLineNumberExclusive !== originalLines.length - changes[changes.length - 1].original.endLineNumberExclusive) {
                    return false;
                }
            }
            return (0, assert_1.checkAdjacentItems)(changes, (m1, m2) => m2.original.startLineNumber - m1.original.endLineNumberExclusive === m2.modified.startLineNumber - m1.modified.endLineNumberExclusive &&
                // There has to be an unchanged line in between (otherwise both diffs should have been joined)
                m1.original.endLineNumberExclusive < m2.original.startLineNumber &&
                m1.modified.endLineNumberExclusive < m2.modified.startLineNumber);
        });
        return changes;
    }
    function getLineRangeMapping(rangeMapping, originalLines, modifiedLines) {
        let lineStartDelta = 0;
        let lineEndDelta = 0;
        // rangeMapping describes the edit that replaces `rangeMapping.originalRange` with `newText := getText(modifiedLines, rangeMapping.modifiedRange)`.
        // original: ]xxx \n <- this line is not modified
        // modified: ]xx  \n
        if (rangeMapping.modifiedRange.endColumn === 1 && rangeMapping.originalRange.endColumn === 1
            && rangeMapping.originalRange.startLineNumber + lineStartDelta <= rangeMapping.originalRange.endLineNumber
            && rangeMapping.modifiedRange.startLineNumber + lineStartDelta <= rangeMapping.modifiedRange.endLineNumber) {
            // We can only do this if the range is not empty yet
            lineEndDelta = -1;
        }
        // original: xxx[ \n <- this line is not modified
        // modified: xxx[ \n
        if (rangeMapping.modifiedRange.startColumn - 1 >= modifiedLines[rangeMapping.modifiedRange.startLineNumber - 1].length
            && rangeMapping.originalRange.startColumn - 1 >= originalLines[rangeMapping.originalRange.startLineNumber - 1].length
            && rangeMapping.originalRange.startLineNumber <= rangeMapping.originalRange.endLineNumber + lineEndDelta
            && rangeMapping.modifiedRange.startLineNumber <= rangeMapping.modifiedRange.endLineNumber + lineEndDelta) {
            // We can only do this if the range is not empty yet
            lineStartDelta = 1;
        }
        const originalLineRange = new lineRange_1.LineRange(rangeMapping.originalRange.startLineNumber + lineStartDelta, rangeMapping.originalRange.endLineNumber + 1 + lineEndDelta);
        const modifiedLineRange = new lineRange_1.LineRange(rangeMapping.modifiedRange.startLineNumber + lineStartDelta, rangeMapping.modifiedRange.endLineNumber + 1 + lineEndDelta);
        return new rangeMapping_1.DetailedLineRangeMapping(originalLineRange, modifiedLineRange, [rangeMapping]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdExpbmVzRGlmZkNvbXB1dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9kaWZmL2RlZmF1bHRMaW5lc0RpZmZDb21wdXRlci9kZWZhdWx0TGluZXNEaWZmQ29tcHV0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNE9oRyw4RUFvQ0M7SUFFRCxrREFtQ0M7SUFuU0QsTUFBYSx3QkFBd0I7UUFBckM7WUFDa0IsOEJBQXlCLEdBQUcsSUFBSSxxREFBeUIsRUFBRSxDQUFDO1lBQzVELDBCQUFxQixHQUFHLElBQUksdUNBQWtCLEVBQUUsQ0FBQztRQXNObkUsQ0FBQztRQXBOQSxXQUFXLENBQUMsYUFBdUIsRUFBRSxhQUF1QixFQUFFLE9BQWtDO1lBQy9GLElBQUksYUFBYSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksSUFBQSxlQUFNLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUMxRixPQUFPLElBQUksNkJBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFFRCxJQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2hJLE9BQU8sSUFBSSw2QkFBUyxDQUFDO29CQUNwQixJQUFJLHVDQUF3QixDQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFF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