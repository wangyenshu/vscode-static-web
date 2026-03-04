/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findSectionHeaders = findSectionHeaders;
    const markRegex = /\bMARK:\s*(.*)$/d;
    const trimDashesRegex = /^-+|-+$/g;
    /**
     * Find section headers in the model.
     *
     * @param model the text model to search in
     * @param options options to search with
     * @returns an array of section headers
     */
    function findSectionHeaders(model, options) {
        let headers = [];
        if (options.findRegionSectionHeaders && options.foldingRules?.markers) {
            const regionHeaders = collectRegionHeaders(model, options);
            headers = headers.concat(regionHeaders);
        }
        if (options.findMarkSectionHeaders) {
            const markHeaders = collectMarkHeaders(model);
            headers = headers.concat(markHeaders);
        }
        return headers;
    }
    function collectRegionHeaders(model, options) {
        const regionHeaders = [];
        const endLineNumber = model.getLineCount();
        for (let lineNumber = 1; lineNumber <= endLineNumber; lineNumber++) {
            const lineContent = model.getLineContent(lineNumber);
            const match = lineContent.match(options.foldingRules.markers.start);
            if (match) {
                const range = { startLineNumber: lineNumber, startColumn: match[0].length + 1, endLineNumber: lineNumber, endColumn: lineContent.length + 1 };
                if (range.endColumn > range.startColumn) {
                    const sectionHeader = {
                        range,
                        ...getHeaderText(lineContent.substring(match[0].length)),
                        shouldBeInComments: false
                    };
                    if (sectionHeader.text || sectionHeader.hasSeparatorLine) {
                        regionHeaders.push(sectionHeader);
                    }
                }
            }
        }
        return regionHeaders;
    }
    function collectMarkHeaders(model) {
        const markHeaders = [];
        const endLineNumber = model.getLineCount();
        for (let lineNumber = 1; lineNumber <= endLineNumber; lineNumber++) {
            const lineContent = model.getLineContent(lineNumber);
            addMarkHeaderIfFound(lineContent, lineNumber, markHeaders);
        }
        return markHeaders;
    }
    function addMarkHeaderIfFound(lineContent, lineNumber, sectionHeaders) {
        markRegex.lastIndex = 0;
        const match = markRegex.exec(lineContent);
        if (match) {
            const column = match.indices[1][0] + 1;
            const endColumn = match.indices[1][1] + 1;
            const range = { startLineNumber: lineNumber, startColumn: column, endLineNumber: lineNumber, endColumn: endColumn };
            if (range.endColumn > range.startColumn) {
                const sectionHeader = {
                    range,
                    ...getHeaderText(match[1]),
                    shouldBeInComments: true
                };
                if (sectionHeader.text || sectionHeader.hasSeparatorLine) {
                    sectionHeaders.push(sectionHeader);
                }
            }
        }
    }
    function getHeaderText(text) {
        text = text.trim();
        const hasSeparatorLine = text.startsWith('-');
        text = text.replace(trimDashesRegex, '');
        return { text, hasSeparatorLine };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZFNlY3Rpb25IZWFkZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9zZXJ2aWNlcy9maW5kU2VjdGlvbkhlYWRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE2Q2hHLGdEQVdDO0lBckJELE1BQU0sU0FBUyxHQUFHLGtCQUFrQixDQUFDO0lBQ3JDLE1BQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQztJQUVuQzs7Ozs7O09BTUc7SUFDSCxTQUFnQixrQkFBa0IsQ0FBQyxLQUFpQyxFQUFFLE9BQWlDO1FBQ3RHLElBQUksT0FBTyxHQUFvQixFQUFFLENBQUM7UUFDbEMsSUFBSSxPQUFPLENBQUMsd0JBQXdCLElBQUksT0FBTyxDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUN2RSxNQUFNLGFBQWEsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDM0QsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUNELElBQUksT0FBTyxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDcEMsTUFBTSxXQUFXLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2hCLENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFDLEtBQWlDLEVBQUUsT0FBaUM7UUFDakcsTUFBTSxhQUFhLEdBQW9CLEVBQUUsQ0FBQztRQUMxQyxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDM0MsS0FBSyxJQUFJLFVBQVUsR0FBRyxDQUFD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