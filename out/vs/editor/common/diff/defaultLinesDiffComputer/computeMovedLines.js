/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm", "../rangeMapping", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/base/common/map", "vs/editor/common/core/lineRange", "vs/editor/common/core/offsetRange", "vs/editor/common/diff/defaultLinesDiffComputer/linesSliceCharSequence", "vs/editor/common/diff/defaultLinesDiffComputer/utils", "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/myersDiffAlgorithm"], function (require, exports, diffAlgorithm_1, rangeMapping_1, arrays_1, arraysFind_1, map_1, lineRange_1, offsetRange_1, linesSliceCharSequence_1, utils_1, myersDiffAlgorithm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeMovedLines = computeMovedLines;
    function computeMovedLines(changes, originalLines, modifiedLines, hashedOriginalLines, hashedModifiedLines, timeout) {
        let { moves, excludedChanges } = computeMovesFromSimpleDeletionsToSimpleInsertions(changes, originalLines, modifiedLines, timeout);
        if (!timeout.isValid()) {
            return [];
        }
        const filteredChanges = changes.filter(c => !excludedChanges.has(c));
        const unchangedMoves = computeUnchangedMoves(filteredChanges, hashedOriginalLines, hashedModifiedLines, originalLines, modifiedLines, timeout);
        (0, arrays_1.pushMany)(moves, unchangedMoves);
        moves = joinCloseConsecutiveMoves(moves);
        // Ignore too short moves
        moves = moves.filter(current => {
            const lines = current.original.toOffsetRange().slice(originalLines).map(l => l.trim());
            const originalText = lines.join('\n');
            return originalText.length >= 15 && countWhere(lines, l => l.length >= 2) >= 2;
        });
        moves = removeMovesInSameDiff(changes, moves);
        return moves;
    }
    function countWhere(arr, predicate) {
        let count = 0;
        for (const t of arr) {
            if (predicate(t)) {
                count++;
            }
        }
        return count;
    }
    function computeMovesFromSimpleDeletionsToSimpleInsertions(changes, originalLines, modifiedLines, timeout) {
        const moves = [];
        const deletions = changes
            .filter(c => c.modified.isEmpty && c.original.length >= 3)
            .map(d => new utils_1.LineRangeFragment(d.original, originalLines, d));
        const insertions = new Set(changes
            .filter(c => c.original.isEmpty && c.modified.length >= 3)
            .map(d => new utils_1.LineRangeFragment(d.modified, modifiedLines, d)));
        const excludedChanges = new Set();
        for (const deletion of deletions) {
            let highestSimilarity = -1;
            let best;
            for (const insertion of insertions) {
                const similarity = deletion.computeSimilarity(insertion);
                if (similarity > highestSimilarity) {
                    highestSimilarity = similarity;
                    best = insertion;
                }
            }
            if (highestSimilarity > 0.90 && best) {
                insertions.delete(best);
                moves.push(new rangeMapping_1.LineRangeMapping(deletion.range, best.range));
                excludedChanges.add(deletion.source);
                excludedChanges.add(best.source);
            }
            if (!timeout.isValid()) {
                return { moves, excludedChanges };
            }
        }
        return { moves, excludedChanges };
    }
    function computeUnchangedMoves(changes, hashedOriginalLines, hashedModifiedLines, originalLines, modifiedLines, timeout) {
        const moves = [];
        const original3LineHashes = new map_1.SetMap();
        for (const change of changes) {
            for (let i = change.original.startLineNumber; i < change.original.endLineNumberExclusive - 2; i++) {
                const key = `${hashedOriginalLines[i - 1]}:${hashedOriginalLines[i + 1 - 1]}:${hashedOriginalLines[i + 2 - 1]}`;
                original3LineHashes.add(key, { range: new lineRange_1.LineRange(i, i + 3) });
            }
        }
        const possibleMappings = [];
        changes.sort((0, arrays_1.compareBy)(c => c.modified.startLineNumber, arrays_1.numberComparator));
        for (const change of changes) {
            let lastMappings = [];
            for (let i = change.modified.startLineNumber; i < change.modified.endLineNumberExclusive - 2; i++) {
                const key = `${hashedModifiedLines[i - 1]}:${hashedModifiedLines[i + 1 - 1]}:${hashedModifiedLines[i + 2 - 1]}`;
                const currentModifiedRange = new lineRange_1.LineRange(i, i + 3);
                const nextMappings = [];
                original3LineHashes.forEach(key, ({ range }) => {
                    for (const lastMapping of lastMappings) {
                        // does this match extend some last match?
                        if (lastMapping.originalLineRange.endLineNumberExclusive + 1 === range.endLineNumberExclusive &&
                            lastMapping.modifiedLineRange.endLineNumberExclusive + 1 === currentModifiedRange.endLineNumberExclusive) {
                            lastMapping.originalLineRange = new lineRange_1.LineRange(lastMapping.originalLineRange.startLineNumber, range.endLineNumberExclusive);
                            lastMapping.modifiedLineRange = new lineRange_1.LineRange(lastMapping.modifiedLineRange.startLineNumber, currentModifiedRange.endLineNumberExclusive);
                            nextMappings.push(lastMapping);
                            return;
                        }
                    }
                    const mapping = {
                        modifiedLineRange: currentModifiedRange,
                        originalLineRange: range,
                    };
                    possibleMappings.push(mapping);
                    nextMappings.push(mapping);
                });
                lastMappings = nextMappings;
            }
            if (!timeout.isValid()) {
                return [];
            }
        }
        possibleMappings.sort((0, arrays_1.reverseOrder)((0, arrays_1.compareBy)(m => m.modifiedLineRange.length, arrays_1.numberComparator)));
        const modifiedSet = new lineRange_1.LineRangeSet();
        const originalSet = new lineRange_1.LineRangeSet();
        for (const mapping of possibleMappings) {
            const diffOrigToMod = mapping.modifiedLineRange.startLineNumber - mapping.originalLineRange.startLineNumber;
            const modifiedSections = modifiedSet.subtractFrom(mapping.modifiedLineRange);
            const originalTranslatedSections = originalSet.subtractFrom(mapping.originalLineRange).getWithDelta(diffOrigToMod);
            const modifiedIntersectedSections = modifiedSections.getIntersection(originalTranslatedSections);
            for (const s of modifiedIntersectedSections.ranges) {
                if (s.length < 3) {
                    continue;
                }
                const modifiedLineRange = s;
                const originalLineRange = s.delta(-diffOrigToMod);
                moves.push(new rangeMapping_1.LineRangeMapping(originalLineRange, modifiedLineRange));
                modifiedSet.addRange(modifiedLineRange);
                originalSet.addRange(originalLineRange);
            }
        }
        moves.sort((0, arrays_1.compareBy)(m => m.original.startLineNumber, arrays_1.numberComparator));
        const monotonousChanges = new arraysFind_1.MonotonousArray(changes);
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            const firstTouchingChangeOrig = monotonousChanges.findLastMonotonous(c => c.original.startLineNumber <= move.original.startLineNumber);
            const firstTouchingChangeMod = (0, arraysFind_1.findLastMonotonous)(changes, c => c.modified.startLineNumber <= move.modified.startLineNumber);
            const linesAbove = Math.max(move.original.startLineNumber - firstTouchingChangeOrig.original.startLineNumber, move.modified.startLineNumber - firstTouchingChangeMod.modified.startLineNumber);
            const lastTouchingChangeOrig = monotonousChanges.findLastMonotonous(c => c.original.startLineNumber < move.original.endLineNumberExclusive);
            const lastTouchingChangeMod = (0, arraysFind_1.findLastMonotonous)(changes, c => c.modified.startLineNumber < move.modified.endLineNumberExclusive);
            const linesBelow = Math.max(lastTouchingChangeOrig.original.endLineNumberExclusive - move.original.endLineNumberExclusive, lastTouchingChangeMod.modified.endLineNumberExclusive - move.modified.endLineNumberExclusive);
            let extendToTop;
            for (extendToTop = 0; extendToTop < linesAbove; extendToTop++) {
                const origLine = move.original.startLineNumber - extendToTop - 1;
                const modLine = move.modified.startLineNumber - extendToTop - 1;
                if (origLine > originalLines.length || modLine > modifiedLines.length) {
                    break;
                }
                if (modifiedSet.contains(modLine) || originalSet.contains(origLine)) {
                    break;
                }
                if (!areLinesSimilar(originalLines[origLine - 1], modifiedLines[modLine - 1], timeout)) {
                    break;
                }
            }
            if (extendToTop > 0) {
                originalSet.addRange(new lineRange_1.LineRange(move.original.startLineNumber - extendToTop, move.original.startLineNumber));
                modifiedSet.addRange(new lineRange_1.LineRange(move.modified.startLineNumber - extendToTop, move.modified.startLineNumber));
            }
            let extendToBottom;
            for (extendToBottom = 0; extendToBottom < linesBelow; extendToBottom++) {
                const origLine = move.original.endLineNumberExclusive + extendToBottom;
                const modLine = move.modified.endLineNumberExclusive + extendToBottom;
                if (origLine > originalLines.length || modLine > modifiedLines.length) {
                    break;
                }
                if (modifiedSet.contains(modLine) || originalSet.contains(origLine)) {
                    break;
                }
                if (!areLinesSimilar(originalLines[origLine - 1], modifiedLines[modLine - 1], timeout)) {
                    break;
                }
            }
            if (extendToBottom > 0) {
                originalSet.addRange(new lineRange_1.LineRange(move.original.endLineNumberExclusive, move.original.endLineNumberExclusive + extendToBottom));
                modifiedSet.addRange(new lineRange_1.LineRange(move.modified.endLineNumberExclusive, move.modified.endLineNumberExclusive + extendToBottom));
            }
            if (extendToTop > 0 || extendToBottom > 0) {
                moves[i] = new rangeMapping_1.LineRangeMapping(new lineRange_1.LineRange(move.original.startLineNumber - extendToTop, move.original.endLineNumberExclusive + extendToBottom), new lineRange_1.LineRange(move.modified.startLineNumber - extendToTop, move.modified.endLineNumberExclusive + extendToBottom));
            }
        }
        return moves;
    }
    function areLinesSimilar(line1, line2, timeout) {
        if (line1.trim() === line2.trim()) {
            return true;
        }
        if (line1.length > 300 && line2.length > 300) {
            return false;
        }
        const myersDiffingAlgorithm = new myersDiffAlgorithm_1.MyersDiffAlgorithm();
        const result = myersDiffingAlgorithm.compute(new linesSliceCharSequence_1.LinesSliceCharSequence([line1], new offsetRange_1.OffsetRange(0, 1), false), new linesSliceCharSequence_1.LinesSliceCharSequence([line2], new offsetRange_1.OffsetRange(0, 1), false), timeout);
        let commonNonSpaceCharCount = 0;
        const inverted = diffAlgorithm_1.SequenceDiff.invert(result.diffs, line1.length);
        for (const seq of inverted) {
            seq.seq1Range.forEach(idx => {
                if (!(0, utils_1.isSpace)(line1.charCodeAt(idx))) {
                    commonNonSpaceCharCount++;
                }
            });
        }
        function countNonWsChars(str) {
            let count = 0;
            for (let i = 0; i < line1.length; i++) {
                if (!(0, utils_1.isSpace)(str.charCodeAt(i))) {
                    count++;
                }
            }
            return count;
        }
        const longerLineLength = countNonWsChars(line1.length > line2.length ? line1 : line2);
        const r = commonNonSpaceCharCount / longerLineLength > 0.6 && longerLineLength > 10;
        return r;
    }
    function joinCloseConsecutiveMoves(moves) {
        if (moves.length === 0) {
            return moves;
        }
        moves.sort((0, arrays_1.compareBy)(m => m.original.startLineNumber, arrays_1.numberComparator));
        const result = [moves[0]];
        for (let i = 1; i < moves.length; i++) {
            const last = result[result.length - 1];
            const current = moves[i];
            const originalDist = current.original.startLineNumber - last.original.endLineNumberExclusive;
            const modifiedDist = current.modified.startLineNumber - last.modified.endLineNumberExclusive;
            const currentMoveAfterLast = originalDist >= 0 && modifiedDist >= 0;
            if (currentMoveAfterLast && originalDist + modifiedDist <= 2) {
                result[result.length - 1] = last.join(current);
                continue;
            }
            result.push(current);
        }
        return result;
    }
    function removeMovesInSameDiff(changes, moves) {
        const changesMonotonous = new arraysFind_1.MonotonousArray(changes);
        moves = moves.filter(m => {
            const diffBeforeEndOfMoveOriginal = changesMonotonous.findLastMonotonous(c => c.original.startLineNumber < m.original.endLineNumberExclusive)
                || new rangeMapping_1.LineRangeMapping(new lineRange_1.LineRange(1, 1), new lineRange_1.LineRange(1, 1));
            const diffBeforeEndOfMoveModified = (0, arraysFind_1.findLastMonotonous)(changes, c => c.modified.startLineNumber < m.modified.endLineNumberExclusive);
            const differentDiffs = diffBeforeEndOfMoveOriginal !== diffBeforeEndOfMoveModified;
            return differentDiffs;
        });
        return moves;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZU1vdmVkTGluZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2RpZmYvZGVmYXVsdExpbmVzRGlmZkNvbXB1dGVyL2NvbXB1dGVNb3ZlZExpbmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLDhDQTBCQztJQTFCRCxTQUFnQixpQkFBaUIsQ0FDaEMsT0FBbUMsRUFDbkMsYUFBdUIsRUFDdkIsYUFBdUIsRUFDdkIsbUJBQTZCLEVBQzdCLG1CQUE2QixFQUM3QixPQUFpQjtRQUVqQixJQUFJLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxHQUFHLGlEQUFpRCxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRW5JLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztZQUFDLE9BQU8sRUFBRSxDQUFDO1FBQUMsQ0FBQztRQUV0QyxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckUsTUFBTSxjQUFjLEdBQUcscUJBQXFCLENBQUMsZUFBZSxFQUFFLG1CQUFtQixFQUFFLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDL0ksSUFBQSxpQkFBUSxFQUFDLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FBQztRQUVoQyxLQUFLLEdBQUcseUJBQXlCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekMseUJBQXlCO1FBQ3pCLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzlCLE1BQU0sS0FBSyxH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