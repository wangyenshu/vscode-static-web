/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model/utils", "vs/editor/contrib/folding/browser/foldingRanges"], function (require, exports, utils_1, foldingRanges_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangesCollector = exports.IndentRangeProvider = void 0;
    exports.computeRanges = computeRanges;
    const MAX_FOLDING_REGIONS_FOR_INDENT_DEFAULT = 5000;
    const ID_INDENT_PROVIDER = 'indent';
    class IndentRangeProvider {
        constructor(editorModel, languageConfigurationService, foldingRangesLimit) {
            this.editorModel = editorModel;
            this.languageConfigurationService = languageConfigurationService;
            this.foldingRangesLimit = foldingRangesLimit;
            this.id = ID_INDENT_PROVIDER;
        }
        dispose() { }
        compute(cancelationToken) {
            const foldingRules = this.languageConfigurationService.getLanguageConfiguration(this.editorModel.getLanguageId()).foldingRules;
            const offSide = foldingRules && !!foldingRules.offSide;
            const markers = foldingRules && foldingRules.markers;
            return Promise.resolve(computeRanges(this.editorModel, offSide, markers, this.foldingRangesLimit));
        }
    }
    exports.IndentRangeProvider = IndentRangeProvider;
    // public only for testing
    class RangesCollector {
        constructor(foldingRangesLimit) {
            this._startIndexes = [];
            this._endIndexes = [];
            this._indentOccurrences = [];
            this._length = 0;
            this._foldingRangesLimit = foldingRangesLimit;
        }
        insertFirst(startLineNumber, endLineNumber, indent) {
            if (startLineNumber > foldingRanges_1.MAX_LINE_NUMBER || endLineNumber > foldingRanges_1.MAX_LINE_NUMBER) {
                return;
            }
            const index = this._length;
            this._startIndexes[index] = startLineNumber;
            this._endIndexes[index] = endLineNumber;
            this._length++;
            if (indent < 1000) {
                this._indentOccurrences[indent] = (this._indentOccurrences[indent] || 0) + 1;
            }
        }
        toIndentRanges(model) {
            const limit = this._foldingRangesLimit.limit;
            if (this._length <= limit) {
                this._foldingRangesLimit.update(this._length, false);
                // reverse and create arrays of the exact length
                const startIndexes = new Uint32Array(this._length);
                const endIndexes = new Uint32Array(this._length);
                for (let i = this._length - 1, k = 0; i >= 0; i--, k++) {
                    startIndexes[k] = this._startIndexes[i];
                    endIndexes[k] = this._endIndexes[i];
                }
                return new foldingRanges_1.FoldingRegions(startIndexes, endIndexes);
            }
            else {
                this._foldingRangesLimit.update(this._length, limit);
                let entries = 0;
                let maxIndent = this._indentOccurrences.length;
                for (let i = 0; i < this._indentOccurrences.length; i++) {
                    const n = this._indentOccurrences[i];
                    if (n) {
                        if (n + entries > limit) {
                            maxIndent = i;
                            break;
                        }
                        entries += n;
                    }
                }
                const tabSize = model.getOptions().tabSize;
                // reverse and create arrays of the exact length
                const startIndexes = new Uint32Array(limit);
                const endIndexes = new Uint32Array(limit);
                for (let i = this._length - 1, k = 0; i >= 0; i--) {
                    const startIndex = this._startIndexes[i];
                    const lineContent = model.getLineContent(startIndex);
                    const indent = (0, utils_1.computeIndentLevel)(lineContent, tabSize);
                    if (indent < maxIndent || (indent === maxIndent && entries++ < limit)) {
                        startIndexes[k] = startIndex;
                        endIndexes[k] = this._endIndexes[i];
                        k++;
                    }
                }
                return new foldingRanges_1.FoldingRegions(startIndexes, endIndexes);
            }
        }
    }
    exports.RangesCollector = RangesCollector;
    const foldingRangesLimitDefault = {
        limit: MAX_FOLDING_REGIONS_FOR_INDENT_DEFAULT,
        update: () => { }
    };
    function computeRanges(model, offSide, markers, foldingRangesLimit = foldingRangesLimitDefault) {
        const tabSize = model.getOptions().tabSize;
        const result = new RangesCollector(foldingRangesLimit);
        let pattern = undefined;
        if (markers) {
            pattern = new RegExp(`(${markers.start.source})|(?:${markers.end.source})`);
        }
        const previousRegions = [];
        const line = model.getLineCount() + 1;
        previousRegions.push({ indent: -1, endAbove: line, line }); // sentinel, to make sure there's at least one entry
        for (let line = model.getLineCount(); line > 0; line--) {
            const lineContent = model.getLineContent(line);
            const indent = (0, utils_1.computeIndentLevel)(lineContent, tabSize);
            let previous = previousRegions[previousRegions.length - 1];
            if (indent === -1) {
                if (offSide) {
                    // for offSide languages, empty lines are associated to the previous block
                    // note: the next block is already written to the results, so this only
                    // impacts the end position of the block before
                    previous.endAbove = line;
                }
                continue; // only whitespace
            }
            let m;
            if (pattern && (m = lineContent.match(pattern))) {
                // folding pattern match
                if (m[1]) { // start pattern match
                    // discard all regions until the folding pattern
                    let i = previousRegions.length - 1;
                    while (i > 0 && previousRegions[i].indent !== -2) {
                        i--;
                    }
                    if (i > 0) {
                        previousRegions.length = i + 1;
                        previous = previousRegions[i];
                        // new folding range from pattern, includes the end line
                        result.insertFirst(line, previous.line, indent);
                        previous.line = line;
                        previous.indent = indent;
                        previous.endAbove = line;
                        continue;
                    }
                    else {
                        // no end marker found, treat line as a regular line
                    }
                }
                else { // end pattern match
                    previousRegions.push({ indent: -2, endAbove: line, line });
                    continue;
                }
            }
            if (previous.indent > indent) {
                // discard all regions with larger indent
                do {
                    previousRegions.pop();
                    previous = previousRegions[previousRegions.length - 1];
                } while (previous.indent > indent);
                // new folding range
                const endLineNumber = previous.endAbove - 1;
                if (endLineNumber - line >= 1) { // needs at east size 1
                    result.insertFirst(line, endLineNumber, indent);
                }
            }
            if (previous.indent === indent) {
                previous.endAbove = line;
            }
            else { // previous.indent < indent
                // new region with a bigger indent
                previousRegions.push({ indent, endAbove: line, line });
            }
        }
        return result.toIndentRanges(model);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50UmFuZ2VQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2ZvbGRpbmcvYnJvd3Nlci9pbmRlbnRSYW5nZVByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTBIaEcsc0NBMEVDO0lBMUxELE1BQU0sc0NBQXNDLEdBQUcsSUFBSSxDQUFDO0lBRXBELE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDO0lBRXBDLE1BQWEsbUJBQW1CO1FBRy9CLFlBQ2tCLFdBQXVCLEVBQ3ZCLDRCQUEyRCxFQUMzRCxrQkFBd0M7WUFGeEMsZ0JBQVcsR0FBWCxXQUFXLENBQVk7WUFDdkIsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUErQjtZQUMzRCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXNCO1lBTGpELE9BQUUsR0FBRyxrQkFBa0IsQ0FBQztRQU03QixDQUFDO1FBRUwsT0FBTyxLQUFLLENBQUM7UUFFYixPQUFPLENBQUMsZ0JBQW1DO1lBQzFDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDO1lBQy9ILE1BQU0sT0FBTyxHQUFHLFlBQVksSUFBSSxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQztZQUN2RCxNQUFNLE9BQU8sR0FBRyxZQUFZLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQztZQUNyRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLENBQUM7S0FDRDtJQWpCRCxr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