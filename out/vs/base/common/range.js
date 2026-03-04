/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Range = void 0;
    var Range;
    (function (Range) {
        /**
         * Returns the intersection between two ranges as a range itself.
         * Returns `{ start: 0, end: 0 }` if the intersection is empty.
         */
        function intersect(one, other) {
            if (one.start >= other.end || other.start >= one.end) {
                return { start: 0, end: 0 };
            }
            const start = Math.max(one.start, other.start);
            const end = Math.min(one.end, other.end);
            if (end - start <= 0) {
                return { start: 0, end: 0 };
            }
            return { start, end };
        }
        Range.intersect = intersect;
        function isEmpty(range) {
            return range.end - range.start <= 0;
        }
        Range.isEmpty = isEmpty;
        function intersects(one, other) {
            return !isEmpty(intersect(one, other));
        }
        Range.intersects = intersects;
        function relativeComplement(one, other) {
            const result = [];
            const first = { start: one.start, end: Math.min(other.start, one.end) };
            const second = { start: Math.max(other.end, one.start), end: one.end };
            if (!isEmpty(first)) {
                result.push(first);
            }
            if (!isEmpty(second)) {
                result.push(second);
            }
            return result;
        }
        Range.relativeComplement = relativeComplement;
    })(Range || (exports.Range = Range = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9yYW5nZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsSUFBaUIsS0FBSyxDQTRDckI7SUE1Q0QsV0FBaUIsS0FBSztRQUVyQjs7O1dBR0c7UUFDSCxTQUFnQixTQUFTLENBQUMsR0FBVyxFQUFFLEtBQWE7WUFDbkQsSUFBSSxHQUFHLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3RELE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUM3QixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXpDLElBQUksR0FBRyxHQUFHLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQzdCLENBQUM7WUFFRCxPQUFPLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFiZSxlQUFTLFlBYXhCLENBQUE7UUFFRCxTQUFnQixPQUFPLENBQUMsS0FBYTtZQUNwQyxPQUFPLEtBQUssQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUZlLGFBQU8sVUFFdEIsQ0FBQTtRQUVELFNBQWdCLFVBQVUsQ0FBQyxHQUFXLEVBQUUsS0FBYTtZQUNwRCxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRmUsZ0JBQVUsYUFFekIsQ0FBQTtRQUVELFNBQWdCLGtCQUFrQixDQUFDLEdBQVcsRUFBRSxLQUFhO1lBQzVELE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztZQUM1QixNQUFNLEtBQUssR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDeEUsTUFBTSxNQUFNLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRXZFLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQixDQUFDO1lBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN0QixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JCLENBQUM7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFkZSx3QkFBa0IscUJBY2pDLENBQUE7SUFDRixDQUFDLEVBNUNnQixLQUFLLHFCQUFMLEtBQUssUUE0Q3JCIn0=