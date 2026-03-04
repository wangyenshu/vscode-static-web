/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/assert", "vs/base/common/types", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/textLength", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/model/rangeUtils"], function (require, exports, arrays_1, assert_1, types_1, position_1, range_1, textLength_1, mapping_1, rangeUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAlignments = getAlignments;
    function getAlignments(m) {
        const equalRanges1 = toEqualRangeMappings(m.input1Diffs.flatMap(d => d.rangeMappings), m.baseRange.toRange(), m.input1Range.toRange());
        const equalRanges2 = toEqualRangeMappings(m.input2Diffs.flatMap(d => d.rangeMappings), m.baseRange.toRange(), m.input2Range.toRange());
        const commonRanges = splitUpCommonEqualRangeMappings(equalRanges1, equalRanges2);
        let result = [];
        result.push([m.input1Range.startLineNumber - 1, m.baseRange.startLineNumber - 1, m.input2Range.startLineNumber - 1]);
        function isFullSync(lineAlignment) {
            return lineAlignment.every((i) => i !== undefined);
        }
        // One base line has either up to one full sync or up to two half syncs.
        for (const m of commonRanges) {
            const lineAlignment = [m.output1Pos?.lineNumber, m.inputPos.lineNumber, m.output2Pos?.lineNumber];
            const alignmentIsFullSync = isFullSync(lineAlignment);
            let shouldAdd = true;
            if (alignmentIsFullSync) {
                const isNewFullSyncAlignment = !result.some(r => isFullSync(r) && r.some((v, idx) => v !== undefined && v === lineAlignment[idx]));
                if (isNewFullSyncAlignment) {
                    // Remove half syncs
                    result = result.filter(r => !r.some((v, idx) => v !== undefined && v === lineAlignment[idx]));
                }
                shouldAdd = isNewFullSyncAlignment;
            }
            else {
                const isNew = !result.some(r => r.some((v, idx) => v !== undefined && v === lineAlignment[idx]));
                shouldAdd = isNew;
            }
            if (shouldAdd) {
                result.push(lineAlignment);
            }
            else {
                if (m.length.isGreaterThan(new textLength_1.TextLength(1, 0))) {
                    result.push([
                        m.output1Pos ? m.output1Pos.lineNumber + 1 : undefined,
                        m.inputPos.lineNumber + 1,
                        m.output2Pos ? m.output2Pos.lineNumber + 1 : undefined
                    ]);
                }
            }
        }
        const finalLineAlignment = [m.input1Range.endLineNumberExclusive, m.baseRange.endLineNumberExclusive, m.input2Range.endLineNumberExclusive];
        result = result.filter(r => r.every((v, idx) => v !== finalLineAlignment[idx]));
        result.push(finalLineAlignment);
        (0, assert_1.assertFn)(() => (0, assert_1.checkAdjacentItems)(result.map(r => r[0]).filter(types_1.isDefined), (a, b) => a < b)
            && (0, assert_1.checkAdjacentItems)(result.map(r => r[1]).filter(types_1.isDefined), (a, b) => a <= b)
            && (0, assert_1.checkAdjacentItems)(result.map(r => r[2]).filter(types_1.isDefined), (a, b) => a < b)
            && result.every(alignment => alignment.filter(types_1.isDefined).length >= 2));
        return result;
    }
    function toEqualRangeMappings(diffs, inputRange, outputRange) {
        const result = [];
        let equalRangeInputStart = inputRange.getStartPosition();
        let equalRangeOutputStart = outputRange.getStartPosition();
        for (const d of diffs) {
            const equalRangeMapping = new mapping_1.RangeMapping(range_1.Range.fromPositions(equalRangeInputStart, d.inputRange.getStartPosition()), range_1.Range.fromPositions(equalRangeOutputStart, d.outputRange.getStartPosition()));
            (0, assert_1.assertFn)(() => (0, rangeUtils_1.lengthOfRange)(equalRangeMapping.inputRange).equals((0, rangeUtils_1.lengthOfRange)(equalRangeMapping.outputRange)));
            if (!equalRangeMapping.inputRange.isEmpty()) {
                result.push(equalRangeMapping);
            }
            equalRangeInputStart = d.inputRange.getEndPosition();
            equalRangeOutputStart = d.outputRange.getEndPosition();
        }
        const equalRangeMapping = new mapping_1.RangeMapping(range_1.Range.fromPositions(equalRangeInputStart, inputRange.getEndPosition()), range_1.Range.fromPositions(equalRangeOutputStart, outputRange.getEndPosition()));
        (0, assert_1.assertFn)(() => (0, rangeUtils_1.lengthOfRange)(equalRangeMapping.inputRange).equals((0, rangeUtils_1.lengthOfRange)(equalRangeMapping.outputRange)));
        if (!equalRangeMapping.inputRange.isEmpty()) {
            result.push(equalRangeMapping);
        }
        return result;
    }
    /**
     * It is `result[i][0].inputRange.equals(result[i][1].inputRange)`.
    */
    function splitUpCommonEqualRangeMappings(equalRangeMappings1, equalRangeMappings2) {
        const result = [];
        const events = [];
        for (const [input, rangeMappings] of [[0, equalRangeMappings1], [1, equalRangeMappings2]]) {
            for (const rangeMapping of rangeMappings) {
                events.push({
                    input: input,
                    start: true,
                    inputPos: rangeMapping.inputRange.getStartPosition(),
                    outputPos: rangeMapping.outputRange.getStartPosition()
                });
                events.push({
                    input: input,
                    start: false,
                    inputPos: rangeMapping.inputRange.getEndPosition(),
                    outputPos: rangeMapping.outputRange.getEndPosition()
                });
            }
        }
        events.sort((0, arrays_1.compareBy)((m) => m.inputPos, position_1.Position.compare));
        const starts = [undefined, undefined];
        let lastInputPos;
        for (const event of events) {
            if (lastInputPos && starts.some(s => !!s)) {
                const length = (0, rangeUtils_1.lengthBetweenPositions)(lastInputPos, event.inputPos);
                if (!length.isZero()) {
                    result.push({
                        inputPos: lastInputPos,
                        length,
                        output1Pos: starts[0],
                        output2Pos: starts[1]
                    });
                    if (starts[0]) {
                        starts[0] = (0, rangeUtils_1.addLength)(starts[0], length);
                    }
                    if (starts[1]) {
                        starts[1] = (0, rangeUtils_1.addLength)(starts[1], length);
                    }
                }
            }
            starts[event.input] = event.start ? event.outputPos : undefined;
            lastInputPos = event.inputPos;
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZUFsaWdubWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvdmlldy9saW5lQWxpZ25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLHNDQXVEQztJQXZERCxTQUFnQixhQUFhLENBQUMsQ0FBb0I7UUFDakQsTUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDdkksTUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFFdkksTUFBTSxZQUFZLEdBQUcsK0JBQStCLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRWpGLElBQUksTUFBTSxHQUFvQixFQUFFLENBQUM7UUFDakMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLGVBQWUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVySCxTQUFT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