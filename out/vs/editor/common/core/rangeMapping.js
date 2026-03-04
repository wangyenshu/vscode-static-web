/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/editor/common/core/range", "vs/editor/common/core/textLength"], function (require, exports, arraysFind_1, range_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PositionOrRange = exports.SingleRangeMapping = exports.RangeMapping = void 0;
    /**
     * Represents a list of mappings of ranges from one document to another.
     */
    class RangeMapping {
        constructor(mappings) {
            this.mappings = mappings;
        }
        mapPosition(position) {
            const mapping = (0, arraysFind_1.findLastMonotonous)(this.mappings, m => m.original.getStartPosition().isBeforeOrEqual(position));
            if (!mapping) {
                return PositionOrRange.position(position);
            }
            if (mapping.original.containsPosition(position)) {
                return PositionOrRange.range(mapping.modified);
            }
            const l = textLength_1.TextLength.betweenPositions(mapping.original.getEndPosition(), position);
            return PositionOrRange.position(l.addToPosition(mapping.modified.getEndPosition()));
        }
        mapRange(range) {
            const start = this.mapPosition(range.getStartPosition());
            const end = this.mapPosition(range.getEndPosition());
            return range_1.Range.fromPositions(start.range?.getStartPosition() ?? start.position, end.range?.getEndPosition() ?? end.position);
        }
        reverse() {
            return new RangeMapping(this.mappings.map(mapping => mapping.reverse()));
        }
    }
    exports.RangeMapping = RangeMapping;
    class SingleRangeMapping {
        constructor(original, modified) {
            this.original = original;
            this.modified = modified;
        }
        reverse() {
            return new SingleRangeMapping(this.modified, this.original);
        }
        toString() {
            return `${this.original.toString()} -> ${this.modified.toString()}`;
        }
    }
    exports.SingleRangeMapping = SingleRangeMapping;
    class PositionOrRange {
        static position(position) {
            return new PositionOrRange(position, undefined);
        }
        static range(range) {
            return new PositionOrRange(undefined, range);
        }
        constructor(position, range) {
            this.position = position;
            this.range = range;
        }
    }
    exports.PositionOrRange = PositionOrRange;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2VNYXBwaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb3JlL3JhbmdlTWFwcGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEc7O09BRUc7SUFDSCxNQUFhLFlBQVk7UUFDeEIsWUFBNEIsUUFBdUM7WUFBdkMsYUFBUSxHQUFSLFFBQVEsQ0FBK0I7UUFDbkUsQ0FBQztRQUVELFdBQVcsQ0FBQyxRQUFrQjtZQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFBLCtCQUFrQixFQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDaEgsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLE9BQU8sZUFBZSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMzQyxDQUFDO1lBQ0QsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pELE9BQU8sZUFBZSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUNELE1BQU0sQ0FBQyxHQUFHLHVCQUFVLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNuRixPQUFPLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBRUQsUUFBUSxDQUFDLEtBQVk7WUFDcEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7WUFDckQsT0FBTyxhQUFLLENBQUMsYUFBYSxDQUN6QixLQUFLLENBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLElBQUksS0FBSyxDQUFDLFFBQVMsRUFDbEQsR0FBRyxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsSUFBSSxHQUFHLENBQUMsUUFBUyxDQUM1QyxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU87WUFDTixPQUFPLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxRSxDQUFDO0tBQ0Q7SUE1QkQsb0NBNEJDO0lBRUQsTUFBYSxrQkFBa0I7UUFDOUIsWUFDaUIsUUFBZSxFQUNmLFFBQWU7WUFEZixhQUFRLEdBQVIsUUFBUSxDQUFPO1lBQ2YsYUFBUSxHQUFSLFFBQVEsQ0FBTztRQUVoQyxDQUFDO1FBRUQsT0FBTztZQUNOLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRUQsUUFBUTtZQUNQLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztRQUNyRSxDQUFDO0tBQ0Q7SUFkRCxnREFjQztJQUVELE1BQWEsZUFBZTtRQUNwQixNQUFNLENBQUMsUUFBUSxDQUFDLFFBQWtCO1lBQ3hDLE9BQU8sSUFBSSxlQUFlLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFTSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQVk7WUFDL0IsT0FBTyxJQUFJLGVBQWUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELFlBQ2lCLFFBQThCLEVBQzlCLEtBQXdCO1lBRHhCLGFBQVEsR0FBUixRQUFRLENBQXNCO1lBQzlCLFVBQUssR0FBTCxLQUFLLENBQW1CO1FBQ3JDLENBQUM7S0FDTDtJQWJELDBDQWFDIn0=