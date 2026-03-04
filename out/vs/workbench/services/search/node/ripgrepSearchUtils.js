/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/arrays", "vs/platform/log/common/log", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchExtTypes"], function (require, exports, arrays_1, log_1, search_1, searchExtTypes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputChannel = void 0;
    exports.anchorGlob = anchorGlob;
    exports.createTextSearchResult = createTextSearchResult;
    function anchorGlob(glob) {
        return glob.startsWith('**') || glob.startsWith('/') ? glob : `/${glob}`;
    }
    /**
     * Create a vscode.TextSearchMatch by using our internal TextSearchMatch type for its previewOptions logic.
     */
    function createTextSearchResult(uri, text, range, previewOptions) {
        const searchRange = (0, arrays_1.mapArrayOrNot)(range, rangeToSearchRange);
        const internalResult = new search_1.TextSearchMatch(text, searchRange, previewOptions);
        const internalPreviewRange = internalResult.preview.matches;
        return {
            ranges: (0, arrays_1.mapArrayOrNot)(searchRange, searchRangeToRange),
            uri,
            preview: {
                text: internalResult.preview.text,
                matches: (0, arrays_1.mapArrayOrNot)(internalPreviewRange, searchRangeToRange)
            }
        };
    }
    function rangeToSearchRange(range) {
        return new search_1.SearchRange(range.start.line, range.start.character, range.end.line, range.end.character);
    }
    function searchRangeToRange(range) {
        return new searchExtTypes.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
    }
    let OutputChannel = class OutputChannel {
        constructor(prefix, logService) {
            this.prefix = prefix;
            this.logService = logService;
        }
        appendLine(msg) {
            this.logService.debug(`${this.prefix}#search`, msg);
        }
    };
    exports.OutputChannel = OutputChannel;
    exports.OutputChannel = OutputChannel = __decorate([
        __param(1, log_1.ILogService)
    ], OutputChannel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlwZ3JlcFNlYXJjaFV0aWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC9ub2RlL3JpcGdyZXBTZWFyY2hVdGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVaEcsZ0NBRUM7SUFLRCx3REFhQztJQXBCRCxTQUFnQixVQUFVLENBQUMsSUFBWTtRQUN0QyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQzFFLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLHNCQUFzQixDQUFDLEdBQVEsRUFBRSxJQUFZLEVBQUUsS0FBb0QsRUFBRSxjQUF3RDtRQUM1SyxNQUFNLFdBQVcsR0FBRyxJQUFBLHNCQUFhLEVBQUMsS0FBSyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFFN0QsTUFBTSxjQUFjLEdBQUcsSUFBSSx3QkFBZSxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDOUUsTUFBTSxvQkFBb0IsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUM1RCxPQUFPO1lBQ04sTUFBTSxFQUFFLElBQUEsc0JBQWEsRUFBQyxXQUFXLEVBQUUsa0JBQWtCLENBQUM7WUFDdEQsR0FBRztZQUNILE9BQU8sRUFBRTtnQkFDUixJQUFJLEVBQUUsY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJO2dCQUNqQyxPQUFPLEVBQUUsSUFBQSxzQkFBYSxFQUFDLG9CQUFvQixFQUFFLGtCQUFrQixDQUFDO2FBQ2hFO1NBQ0QsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFTLGtCQUFrQixDQUFDLEtBQTJCO1FBQ3RELE9BQU8sSUFBSSxvQkFBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdEcsQ0FBQztJQUVELFNBQVMsa0JBQWtCLENBQUMsS0FBa0I7UUFDN0MsT0FBTyxJQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2pILENBQUM7SUFNTSxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFhO1FBQ3pCLFlBQW9CLE1BQWMsRUFBZ0MsVUFBdUI7WUFBckUsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUFnQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1FBQUksQ0FBQztRQUU5RixVQUFVLENBQUMsR0FBVztZQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNyRCxDQUFDO0tBQ0QsQ0FBQTtJQU5ZLHNDQUFhOzRCQUFiLGFBQWE7UUFDWSxXQUFBLGlCQUFXLENBQUE7T0FEcEMsYUFBYSxDQU16QiJ9