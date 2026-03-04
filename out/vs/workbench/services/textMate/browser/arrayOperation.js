/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays"], function (require, exports, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CombinedIndexTransformer = exports.MonotonousIndexTransformer = exports.SingleArrayEdit = exports.ArrayEdit = void 0;
    class ArrayEdit {
        constructor(
        /**
         * Disjoint edits that are applied in parallel
         */
        edits) {
            this.edits = edits.slice().sort((0, arrays_1.compareBy)(c => c.offset, arrays_1.numberComparator));
        }
        applyToArray(array) {
            for (let i = this.edits.length - 1; i >= 0; i--) {
                const c = this.edits[i];
                array.splice(c.offset, c.length, ...new Array(c.newLength));
            }
        }
    }
    exports.ArrayEdit = ArrayEdit;
    class SingleArrayEdit {
        constructor(offset, length, newLength) {
            this.offset = offset;
            this.length = length;
            this.newLength = newLength;
        }
        toString() {
            return `[${this.offset}, +${this.length}) -> +${this.newLength}}`;
        }
    }
    exports.SingleArrayEdit = SingleArrayEdit;
    /**
     * Can only be called with increasing values of `index`.
    */
    class MonotonousIndexTransformer {
        static fromMany(transformations) {
            // TODO improve performance by combining transformations first
            const transformers = transformations.map(t => new MonotonousIndexTransformer(t));
            return new CombinedIndexTransformer(transformers);
        }
        constructor(transformation) {
            this.transformation = transformation;
            this.idx = 0;
            this.offset = 0;
        }
        /**
         * Precondition: index >= previous-value-of(index).
         */
        transform(index) {
            let nextChange = this.transformation.edits[this.idx];
            while (nextChange && nextChange.offset + nextChange.length <= index) {
                this.offset += nextChange.newLength - nextChange.length;
                this.idx++;
                nextChange = this.transformation.edits[this.idx];
            }
            // assert nextChange === undefined || index < nextChange.offset + nextChange.length
            if (nextChange && nextChange.offset <= index) {
                // Offset is touched by the change
                return undefined;
            }
            return index + this.offset;
        }
    }
    exports.MonotonousIndexTransformer = MonotonousIndexTransformer;
    class CombinedIndexTransformer {
        constructor(transformers) {
            this.transformers = transformers;
        }
        transform(index) {
            for (const transformer of this.transformers) {
                const result = transformer.transform(index);
                if (result === undefined) {
                    return undefined;
                }
                index = result;
            }
            return index;
        }
    }
    exports.CombinedIndexTransformer = CombinedIndexTransformer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlPcGVyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dE1hdGUvYnJvd3Nlci9hcnJheU9wZXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsTUFBYSxTQUFTO1FBR3JCO1FBQ0M7O1dBRUc7UUFDSCxLQUFpQztZQUVqQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBQSxrQkFBUyxFQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSx5QkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDN0UsQ0FBQztRQUVELFlBQVksQ0FBQyxLQUFZO1lBQ3hCLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDakQsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUM3RCxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBbEJELDhCQWtCQztJQUVELE1BQWEsZUFBZTtRQUMzQixZQUNpQixNQUFjLEVBQ2QsTUFBYyxFQUNkLFNBQWlCO1lBRmpCLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQ2QsY0FBUyxHQUFULFNBQVMsQ0FBUTtRQUM5QixDQUFDO1FBRUwsUUFBUTtZQUNQLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxNQUFNLElBQUksQ0FBQyxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDO1FBQ25FLENBQUM7S0FDRDtJQVZELDBDQVVDO0lBTUQ7O01BRUU7SUFDRixNQUFhLDBCQUEwQjtRQUMvQixNQUFNLENBQUMsUUFBUSxDQUFDLGVBQTRCO1lBQ2xELDhEQUE4RDtZQUM5RCxNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSwwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLE9BQU8sSUFBSSx3QkFBd0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBS0QsWUFBNkIsY0FBeUI7WUFBekIsbUJBQWMsR0FBZCxjQUFjLENBQVc7WUFIOUMsUUFBRyxHQUFHLENBQUMsQ0FBQztZQUNSLFdBQU0sR0FBRyxDQUFDLENBQUM7UUFHbkIsQ0FBQztRQUVEOztXQUVHO1FBQ0gsU0FBUyxDQUFDLEtBQWE7WUFDdEIsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBZ0MsQ0FBQztZQUNwRixPQUFPLFVBQVUsSUFBSSxVQUFVLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ3JFLElBQUksQ0FBQyxNQUFNLElBQUksVUFBVSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO2dCQUN4RCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ1gsVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsRCxDQUFDO1lBQ0QsbUZBQW1GO1lBRW5GLElBQUksVUFBVSxJQUFJLFVBQVUsQ0FBQyxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQzlDLGtDQUFrQztnQkFDbEMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE9BQU8sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDNUIsQ0FBQztLQUNEO0lBaENELGdFQWdDQztJQUVELE1BQWEsd0JBQXdCO1FBQ3BDLFlBQ2tCLFlBQWlDO1lBQWpDLGlCQUFZLEdBQVosWUFBWSxDQUFxQjtRQUMvQyxDQUFDO1FBRUwsU0FBUyxDQUFDLEtBQWE7WUFDdEIsS0FBSyxNQUFNLFdBQVcsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzVDLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUMxQixPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCxLQUFLLEdBQUcsTUFBTSxDQUFDO1lBQ2hCLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7S0FDRDtJQWZELDREQWVDIn0=