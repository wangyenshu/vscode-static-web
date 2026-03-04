/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/search/common/search", "vs/editor/common/core/range", "vs/workbench/contrib/search/common/searchNotebookHelpers"], function (require, exports, search_1, range_1, searchNotebookHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getIDFromINotebookCellMatch = getIDFromINotebookCellMatch;
    exports.isINotebookFileMatchWithModel = isINotebookFileMatchWithModel;
    exports.isINotebookCellMatchWithModel = isINotebookCellMatchWithModel;
    exports.contentMatchesToTextSearchMatches = contentMatchesToTextSearchMatches;
    exports.webviewMatchesToTextSearchMatches = webviewMatchesToTextSearchMatches;
    function getIDFromINotebookCellMatch(match) {
        if (isINotebookCellMatchWithModel(match)) {
            return match.cell.id;
        }
        else {
            return `${searchNotebookHelpers_1.rawCellPrefix}${match.index}`;
        }
    }
    function isINotebookFileMatchWithModel(object) {
        return 'cellResults' in object && object.cellResults instanceof Array && object.cellResults.every(isINotebookCellMatchWithModel);
    }
    function isINotebookCellMatchWithModel(object) {
        return 'cell' in object;
    }
    function contentMatchesToTextSearchMatches(contentMatches, cell) {
        return (0, searchNotebookHelpers_1.genericCellMatchesToTextSearchMatches)(contentMatches, cell.textBuffer);
    }
    function webviewMatchesToTextSearchMatches(webviewMatches) {
        return webviewMatches
            .map(rawMatch => (rawMatch.searchPreviewInfo) ?
            new search_1.TextSearchMatch(rawMatch.searchPreviewInfo.line, new range_1.Range(0, rawMatch.searchPreviewInfo.range.start, 0, rawMatch.searchPreviewInfo.range.end), undefined, rawMatch.index) : undefined).filter((e) => !!e);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoTm90ZWJvb2tIZWxwZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvbm90ZWJvb2tTZWFyY2gvc2VhcmNoTm90ZWJvb2tIZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLGtFQU1DO0lBU0Qsc0VBRUM7SUFFRCxzRUFFQztJQUVELDhFQUtDO0lBRUQsOEVBVUM7SUF4Q0QsU0FBZ0IsMkJBQTJCLENBQUMsS0FBeUI7UUFDcEUsSUFBSSw2QkFBNkIsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzFDLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDdEIsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLEdBQUcscUNBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDekMsQ0FBQztJQUNGLENBQUM7SUFTRCxTQUFnQiw2QkFBNkIsQ0FBQyxNQUFXO1FBQ3hELE9BQU8sYUFBYSxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsV0FBVyxZQUFZLEtBQUssSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0lBQ2xJLENBQUM7SUFFRCxTQUFnQiw2QkFBNkIsQ0FBQyxNQUFXO1FBQ3hELE9BQU8sTUFBTSxJQUFJLE1BQU0sQ0FBQztJQUN6QixDQUFDO0lBRUQsU0FBZ0IsaUNBQWlDLENBQUMsY0FBMkIsRUFBRSxJQUFvQjtRQUNsRyxPQUFPLElBQUEsNkRBQXFDLEVBQzNDLGNBQWMsRUFDZCxJQUFJLENBQUMsVUFBVSxDQUNmLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBZ0IsaUNBQWlDLENBQUMsY0FBc0M7UUFDdkYsT0FBTyxjQUFjO2FBQ25CLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUNmLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFJLHdCQUFlLENBQ2xCLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQy9CLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFDN0YsU0FBUyxFQUNULFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUM3QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBeUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM5QyxDQUFDIn0=