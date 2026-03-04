/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/editor/common/core/lineRange", "vs/editor/common/core/range", "vs/editor/common/core/textEdit"], function (require, exports, errors_1, lineRange_1, range_1, textEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangeMapping = exports.DetailedLineRangeMapping = exports.LineRangeMapping = void 0;
    /**
     * Maps a line range in the original text model to a line range in the modified text model.
     */
    class LineRangeMapping {
        static inverse(mapping, originalLineCount, modifiedLineCount) {
            const result = [];
            let lastOriginalEndLineNumber = 1;
            let lastModifiedEndLineNumber = 1;
            for (const m of mapping) {
                const r = new LineRangeMapping(new lineRange_1.LineRange(lastOriginalEndLineNumber, m.original.startLineNumber), new lineRange_1.LineRange(lastModifiedEndLineNumber, m.modified.startLineNumber));
                if (!r.modified.isEmpty) {
                    result.push(r);
                }
                lastOriginalEndLineNumber = m.original.endLineNumberExclusive;
                lastModifiedEndLineNumber = m.modified.endLineNumberExclusive;
            }
            const r = new LineRangeMapping(new lineRange_1.LineRange(lastOriginalEndLineNumber, originalLineCount + 1), new lineRange_1.LineRange(lastModifiedEndLineNumber, modifiedLineCount + 1));
            if (!r.modified.isEmpty) {
                result.push(r);
            }
            return result;
        }
        static clip(mapping, originalRange, modifiedRange) {
            const result = [];
            for (const m of mapping) {
                const original = m.original.intersect(originalRange);
                const modified = m.modified.intersect(modifiedRange);
                if (original && !original.isEmpty && modified && !modified.isEmpty) {
                    result.push(new LineRangeMapping(original, modified));
                }
            }
            return result;
        }
        constructor(originalRange, modifiedRange) {
            this.original = originalRange;
            this.modified = modifiedRange;
        }
        toString() {
            return `{${this.original.toString()}->${this.modified.toString()}}`;
        }
        flip() {
            return new LineRangeMapping(this.modified, this.original);
        }
        join(other) {
            return new LineRangeMapping(this.original.join(other.original), this.modified.join(other.modified));
        }
        get changedLineCount() {
            return Math.max(this.original.length, this.modified.length);
        }
        /**
         * This method assumes that the LineRangeMapping describes a valid diff!
         * I.e. if one range is empty, the other range cannot be the entire document.
         * It avoids various problems when the line range points to non-existing line-numbers.
        */
        toRangeMapping() {
            const origInclusiveRange = this.original.toInclusiveRange();
            const modInclusiveRange = this.modified.toInclusiveRange();
            if (origInclusiveRange && modInclusiveRange) {
                return new RangeMapping(origInclusiveRange, modInclusiveRange);
            }
            else if (this.original.startLineNumber === 1 || this.modified.startLineNumber === 1) {
                if (!(this.modified.startLineNumber === 1 && this.original.startLineNumber === 1)) {
                    // If one line range starts at 1, the other one must start at 1 as well.
                    throw new errors_1.BugIndicatingError('not a valid diff');
                }
                // Because one range is empty and both ranges start at line 1, none of the ranges can cover all lines.
                // Thus, `endLineNumberExclusive` is a valid line number.
                return new RangeMapping(new range_1.Range(this.original.startLineNumber, 1, this.original.endLineNumberExclusive, 1), new range_1.Range(this.modified.startLineNumber, 1, this.modified.endLineNumberExclusive, 1));
            }
            else {
                // We can assume here that both startLineNumbers are greater than 1.
                return new RangeMapping(new range_1.Range(this.original.startLineNumber - 1, Number.MAX_SAFE_INTEGER, this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), new range_1.Range(this.modified.startLineNumber - 1, Number.MAX_SAFE_INTEGER, this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER));
            }
        }
    }
    exports.LineRangeMapping = LineRangeMapping;
    /**
     * Maps a line range in the original text model to a line range in the modified text model.
     * Also contains inner range mappings.
     */
    class DetailedLineRangeMapping extends LineRangeMapping {
        static fromRangeMappings(rangeMappings) {
            const originalRange = lineRange_1.LineRange.join(rangeMappings.map(r => lineRange_1.LineRange.fromRangeInclusive(r.originalRange)));
            const modifiedRange = lineRange_1.LineRange.join(rangeMappings.map(r => lineRange_1.LineRange.fromRangeInclusive(r.modifiedRange)));
            return new DetailedLineRangeMapping(originalRange, modifiedRange, rangeMappings);
        }
        constructor(originalRange, modifiedRange, innerChanges) {
            super(originalRange, modifiedRange);
            this.innerChanges = innerChanges;
        }
        flip() {
            return new DetailedLineRangeMapping(this.modified, this.original, this.innerChanges?.map(c => c.flip()));
        }
        withInnerChangesFromLineRanges() {
            return new DetailedLineRangeMapping(this.original, this.modified, [this.toRangeMapping()]);
        }
    }
    exports.DetailedLineRangeMapping = DetailedLineRangeMapping;
    /**
     * Maps a range in the original text model to a range in the modified text model.
     */
    class RangeMapping {
        constructor(originalRange, modifiedRange) {
            this.originalRange = originalRange;
            this.modifiedRange = modifiedRange;
        }
        toString() {
            return `{${this.originalRange.toString()}->${this.modifiedRange.toString()}}`;
        }
        flip() {
            return new RangeMapping(this.modifiedRange, this.originalRange);
        }
        /**
         * Creates a single text edit that describes the change from the original to the modified text.
        */
        toTextEdit(modified) {
            const newText = modified.getValueOfRange(this.modifiedRange);
            return new textEdit_1.SingleTextEdit(this.originalRange, newText);
        }
    }
    exports.RangeMapping = RangeMapping;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2VNYXBwaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9kaWZmL3JhbmdlTWFwcGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEc7O09BRUc7SUFDSCxNQUFhLGdCQUFnQjtRQUNyQixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQW9DLEVBQUUsaUJBQXlCLEVBQUUsaUJBQXlCO1lBQy9HLE1BQU0sTUFBTSxHQUF1QixFQUFFLENBQUM7WUFDdEMsSUFBSSx5QkFBeUIsR0FBRyxDQUFDLENBQUM7WUFDbEMsSUFBSSx5QkFBeUIsR0FBRyxDQUFDLENBQUM7WUFFbEMsS0FBSyxNQUFNLENBQUMsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxDQUFDLEdBQUcsSUFBSSxnQkFBZ0IsQ0FDN0IsSUFBSSxxQkFBUyxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQ3BFLElBQUkscUJBQVMsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUNwRSxDQUFDO2dCQUNGLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixDQUFDO2dCQUNELHlCQUF5QixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUM7Z0JBQzlELHlCQUF5QixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUM7WUFDL0QsQ0FBQztZQUNELE1BQU0sQ0FBQyxHQUFHLElBQUksZ0JBQWdCLENBQzdCLElBQUkscUJBQVMsQ0FBQyx5QkFBeUIsRUFBRSxpQkFBaUIsR0FBRyxD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