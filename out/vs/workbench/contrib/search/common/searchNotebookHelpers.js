/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/search/common/search", "vs/editor/common/core/range"], function (require, exports, search_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.rawCellPrefix = void 0;
    exports.isINotebookFileMatchNoModel = isINotebookFileMatchNoModel;
    exports.genericCellMatchesToTextSearchMatches = genericCellMatchesToTextSearchMatches;
    function isINotebookFileMatchNoModel(object) {
        return 'cellResults' in object;
    }
    exports.rawCellPrefix = 'rawCell#';
    function genericCellMatchesToTextSearchMatches(contentMatches, buffer) {
        let previousEndLine = -1;
        const contextGroupings = [];
        let currentContextGrouping = [];
        contentMatches.forEach((match) => {
            if (match.range.startLineNumber !== previousEndLine) {
                if (currentContextGrouping.length > 0) {
                    contextGroupings.push([...currentContextGrouping]);
                    currentContextGrouping = [];
                }
            }
            currentContextGrouping.push(match);
            previousEndLine = match.range.endLineNumber;
        });
        if (currentContextGrouping.length > 0) {
            contextGroupings.push([...currentContextGrouping]);
        }
        const textSearchResults = contextGroupings.map((grouping) => {
            const lineTexts = [];
            const firstLine = grouping[0].range.startLineNumber;
            const lastLine = grouping[grouping.length - 1].range.endLineNumber;
            for (let i = firstLine; i <= lastLine; i++) {
                lineTexts.push(buffer.getLineContent(i));
            }
            return new search_1.TextSearchMatch(lineTexts.join('\n') + '\n', grouping.map(m => new range_1.Range(m.range.startLineNumber - 1, m.range.startColumn - 1, m.range.endLineNumber - 1, m.range.endColumn - 1)));
        });
        return textSearchResults;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoTm90ZWJvb2tIZWxwZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2NvbW1vbi9zZWFyY2hOb3RlYm9va0hlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyxrRUFFQztJQUlELHNGQW1DQztJQXpDRCxTQUFnQiwyQkFBMkIsQ0FBQyxNQUFrQjtRQUM3RCxPQUFPLGFBQWEsSUFBSSxNQUFNLENBQUM7SUFDaEMsQ0FBQztJQUVZLFFBQUEsYUFBYSxHQUFHLFVBQVUsQ0FBQztJQUV4QyxTQUFnQixxQ0FBcUMsQ0FBQyxjQUEyQixFQUFFLE1BQTJCO1FBQzdHLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLE1BQU0sZ0JBQWdCLEdBQWtCLEVBQUUsQ0FBQztRQUMzQyxJQUFJLHNCQUFzQixHQUFnQixFQUFFLENBQUM7UUFFN0MsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2hDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxlQUFlLEtBQUssZUFBZSxFQUFFLENBQUM7Z0JBQ3JELElBQUksc0JBQXNCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN2QyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLHNCQUFzQixDQUFDLENBQUMsQ0FBQztvQkFDbkQsc0JBQXNCLEdBQUcsRUFBRSxDQUFDO2dCQUM3QixDQUFDO1lBQ0YsQ0FBQztZQUVELHNCQUFzQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQyxlQUFlLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7UUFDN0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLHNCQUFzQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN2QyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRUQsTUFBTSxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUMzRCxNQUFNLFNBQVMsR0FBYSxFQUFFLENBQUM7WUFDL0IsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUM7WUFDcEQsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQztZQUNuRSxLQUFLLElBQUksQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLElBQUksUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzVDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFDRCxPQUFPLElBQUksd0JBQWUsQ0FDekIsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEVBQzNCLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUNwSSxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLGlCQUFpQixDQUFDO0lBQzFCLENBQUMifQ==