/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/beforeEditPositionMapper", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length"], function (require, exports, arrays_1, beforeEditPositionMapper_1, length_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.combineTextEditInfos = combineTextEditInfos;
    function combineTextEditInfos(textEditInfoFirst, textEditInfoSecond) {
        if (textEditInfoFirst.length === 0) {
            return textEditInfoSecond;
        }
        if (textEditInfoSecond.length === 0) {
            return textEditInfoFirst;
        }
        // s0: State before any edits
        const s0ToS1Map = new arrays_1.ArrayQueue(toLengthMapping(textEditInfoFirst));
        // s1: State after first edit, but before second edit
        const s1ToS2Map = toLengthMapping(textEditInfoSecond);
        s1ToS2Map.push({ modified: false, lengthBefore: undefined, lengthAfter: undefined }); // Copy everything from old to new
        // s2: State after both edits
        let curItem = s0ToS1Map.dequeue();
        /**
         * @param s1Length Use undefined for length "infinity"
         */
        function nextS0ToS1MapWithS1LengthOf(s1Length) {
            if (s1Length === undefined) {
                const arr = s0ToS1Map.takeWhile(v => true) || [];
                if (curItem) {
                    arr.unshift(curItem);
                }
                return arr;
            }
            const result = [];
            while (curItem && !(0, length_1.lengthIsZero)(s1Length)) {
                const [item, remainingItem] = curItem.splitAt(s1Length);
                result.push(item);
                s1Length = (0, length_1.lengthDiffNonNegative)(item.lengthAfter, s1Length);
                curItem = remainingItem ?? s0ToS1Map.dequeue();
            }
            if (!(0, length_1.lengthIsZero)(s1Length)) {
                result.push(new LengthMapping(false, s1Length, s1Length));
            }
            return result;
        }
        const result = [];
        function pushEdit(startOffset, endOffset, newLength) {
            if (result.length > 0 && (0, length_1.lengthEquals)(result[result.length - 1].endOffset, startOffset)) {
                const lastResult = result[result.length - 1];
                result[result.length - 1] = new beforeEditPositionMapper_1.TextEditInfo(lastResult.startOffset, endOffset, (0, length_1.lengthAdd)(lastResult.newLength, newLength));
            }
            else {
                result.push({ startOffset, endOffset, newLength });
            }
        }
        let s0offset = length_1.lengthZero;
        for (const s1ToS2 of s1ToS2Map) {
            const s0ToS1Map = nextS0ToS1MapWithS1LengthOf(s1ToS2.lengthBefore);
            if (s1ToS2.modified) {
                const s0Length = (0, length_1.sumLengths)(s0ToS1Map, s => s.lengthBefore);
                const s0EndOffset = (0, length_1.lengthAdd)(s0offset, s0Length);
                pushEdit(s0offset, s0EndOffset, s1ToS2.lengthAfter);
                s0offset = s0EndOffset;
            }
            else {
                for (const s1 of s0ToS1Map) {
                    const s0startOffset = s0offset;
                    s0offset = (0, length_1.lengthAdd)(s0offset, s1.lengthBefore);
                    if (s1.modified) {
                        pushEdit(s0startOffset, s0offset, s1.lengthAfter);
                    }
                }
            }
        }
        return result;
    }
    class LengthMapping {
        constructor(
        /**
         * If false, length before and length after equal.
         */
        modified, lengthBefore, lengthAfter) {
            this.modified = modified;
            this.lengthBefore = lengthBefore;
            this.lengthAfter = lengthAfter;
        }
        splitAt(lengthAfter) {
            const remainingLengthAfter = (0, length_1.lengthDiffNonNegative)(lengthAfter, this.lengthAfter);
            if ((0, length_1.lengthEquals)(remainingLengthAfter, length_1.lengthZero)) {
                return [this, undefined];
            }
            else if (this.modified) {
                return [
                    new LengthMapping(this.modified, this.lengthBefore, lengthAfter),
                    new LengthMapping(this.modified, length_1.lengthZero, remainingLengthAfter)
                ];
            }
            else {
                return [
                    new LengthMapping(this.modified, lengthAfter, lengthAfter),
                    new LengthMapping(this.modified, remainingLengthAfter, remainingLengthAfter)
                ];
            }
        }
        toString() {
            return `${this.modified ? 'M' : 'U'}:${(0, length_1.lengthToObj)(this.lengthBefore)} -> ${(0, length_1.lengthToObj)(this.lengthAfter)}`;
        }
    }
    function toLengthMapping(textEditInfos) {
        const result = [];
        let lastOffset = length_1.lengthZero;
        for (const textEditInfo of textEditInfos) {
            const spaceLength = (0, length_1.lengthDiffNonNegative)(lastOffset, textEditInfo.startOffset);
            if (!(0, length_1.lengthIsZero)(spaceLength)) {
                result.push(new LengthMapping(false, spaceLength, spaceLength));
            }
            const lengthBefore = (0, length_1.lengthDiffNonNegative)(textEditInfo.startOffset, textEditInfo.endOffset);
            result.push(new LengthMapping(true, lengthBefore, textEditInfo.newLength));
            lastOffset = textEditInfo.endOffset;
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tYmluZVRleHRFZGl0SW5mb3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyc1RleHRNb2RlbFBhcnQvYnJhY2tldFBhaXJzVHJlZS9jb21iaW5lVGV4dEVkaXRJbmZvcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxvREF5RUM7SUF6RUQsU0FBZ0Isb0JBQW9CLENBQUMsaUJBQWlDLEVBQUUsa0JBQWtDO1FBQ3pHLElBQUksaUJBQWlCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3BDLE9BQU8sa0JBQWtCLENBQUM7UUFDM0IsQ0FBQztRQUNELElBQUksa0JBQWtCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3JDLE9BQU8saUJBQWlCLENBQUM7UUFDMUIsQ0FBQztRQUVELDZCQUE2QjtRQUM3QixNQUFNLFNBQVMsR0FBRyxJQUFJLG1CQUFVLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztRQUNyRSxxREFBcUQ7UUFDckQsTUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLGtCQUFrQixDQUE2RixDQUFDO1FBQ2xKLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxrQ0FBa0M7UUFDeEgsNkJBQTZCO1FBRTdCLElBQUksT0FBTyxHQUE4QixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFN0Q7O1dBRUc7UUFDSCxTQUFTLDJCQUEyQixDQUFDLFFBQTRCO1lBQ2hFLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixNQUFNLEdBQUcsR0FBRyxT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