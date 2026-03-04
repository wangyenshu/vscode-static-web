/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/markdownRenderer", "vs/nls", "vs/workbench/contrib/notebook/browser/viewModel/foldingModel", "./OutlineEntry", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, markdownRenderer_1, nls_1, foldingModel_1, OutlineEntry_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookOutlineEntryFactory = exports.NotebookOutlineConstants = void 0;
    var NotebookOutlineConstants;
    (function (NotebookOutlineConstants) {
        NotebookOutlineConstants[NotebookOutlineConstants["NonHeaderOutlineLevel"] = 7] = "NonHeaderOutlineLevel";
    })(NotebookOutlineConstants || (exports.NotebookOutlineConstants = NotebookOutlineConstants = {}));
    function getMarkdownHeadersInCellFallbackToHtmlTags(fullContent) {
        const headers = Array.from((0, foldingModel_1.getMarkdownHeadersInCell)(fullContent));
        if (headers.length) {
            return headers;
        }
        // no markdown syntax headers, try to find html tags
        const match = fullContent.match(/<h([1-6]).*>(.*)<\/h\1>/i);
        if (match) {
            const level = parseInt(match[1]);
            const text = match[2].trim();
            headers.push({ depth: level, text });
        }
        return headers;
    }
    class NotebookOutlineEntryFactory {
        constructor(executionStateService) {
            this.executionStateService = executionStateService;
            this.cellOutlineEntryCache = {};
            this.cachedMarkdownOutlineEntries = new WeakMap();
        }
        getOutlineEntries(cell, target, index) {
            const entries = [];
            const isMarkdown = cell.cellKind === notebookCommon_1.CellKind.Markup;
            // cap the amount of characters that we look at and use the following logic
            // - for MD prefer headings (each header is an entry)
            // - otherwise use the first none-empty line of the cell (MD or code)
            let content = getCellFirstNonEmptyLine(cell);
            let hasHeader = false;
            if (isMarkdown) {
                const fullContent = cell.getText().substring(0, 10000);
                const cache = this.cachedMarkdownOutlineEntries.get(cell);
                const headers = cache?.alternativeId === cell.getAlternativeId() ? cache.headers : Array.from(getMarkdownHeadersInCellFallbackToHtmlTags(fullContent));
                this.cachedMarkdownOutlineEntries.set(cell, { alternativeId: cell.getAlternativeId(), headers });
                for (const { depth, text } of headers) {
                    hasHeader = true;
                    entries.push(new OutlineEntry_1.OutlineEntry(index++, depth, cell, text, false, false));
                }
                if (!hasHeader) {
                    content = (0, markdownRenderer_1.renderMarkdownAsPlaintext)({ value: content });
                }
            }
            if (!hasHeader) {
                const exeState = !isMarkdown && this.executionStateService.getCellExecution(cell.uri);
                let preview = content.trim();
                if (!isMarkdown && cell.model.textModel) {
                    const cachedEntries = this.cellOutlineEntryCache[cell.model.textModel.id];
                    // Gathering symbols from the model is an async operation, but this provider is syncronous.
                    // So symbols need to be precached before this function is called to get the full list.
                    if (cachedEntries) {
                        // push code cell entry that is a parent of cached symbols, always necessary. filtering done elsewhere.
                        entries.push(new OutlineEntry_1.OutlineEntry(index++, 7 /* NotebookOutlineConstants.NonHeaderOutlineLevel */, cell, preview, !!exeState, exeState ? exeState.isPaused : false));
                        cachedEntries.forEach((cached) => {
                            entries.push(new OutlineEntry_1.OutlineEntry(index++, cached.level, cell, cached.name, false, false, cached.range, cached.kind));
                        });
                    }
                }
                if (entries.length === 0) { // if there are no cached entries, use the first line of the cell as a code cell
                    if (preview.length === 0) {
                        // empty or just whitespace
                        preview = (0, nls_1.localize)('empty', "empty cell");
                    }
                    entries.push(new OutlineEntry_1.OutlineEntry(index++, 7 /* NotebookOutlineConstants.NonHeaderOutlineLevel */, cell, preview, !!exeState, exeState ? exeState.isPaused : false));
                }
            }
            return entries;
        }
        async cacheSymbols(cell, outlineModelService, cancelToken) {
            const textModel = await cell.resolveTextModel();
            const outlineModel = await outlineModelService.getOrCreate(textModel, cancelToken);
            const entries = createOutlineEntries(outlineModel.getTopLevelSymbols(), 8);
            this.cellOutlineEntryCache[textModel.id] = entries;
        }
    }
    exports.NotebookOutlineEntryFactory = NotebookOutlineEntryFactory;
    function createOutlineEntries(symbols, level) {
        const entries = [];
        symbols.forEach(symbol => {
            entries.push({ name: symbol.name, range: symbol.range, level, kind: symbol.kind });
            if (symbol.children) {
                entries.push(...createOutlineEntries(symbol.children, level + 1));
            }
        });
        return entries;
    }
    function getCellFirstNonEmptyLine(cell) {
        const textBuffer = cell.textBuffer;
        for (let i = 0; i < textBuffer.getLineCount(); i++) {
            const firstNonWhitespace = textBuffer.getLineFirstNonWhitespaceColumn(i + 1);
            const lineLength = textBuffer.getLineLength(i + 1);
            if (firstNonWhitespace < lineLength) {
                return textBuffer.getLineContent(i + 1);
            }
        }
        return cell.getText().substring(0, 100);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPdXRsaW5lRW50cnlGYWN0b3J5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3TW9kZWwvbm90ZWJvb2tPdXRsaW5lRW50cnlGYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxJQUFrQix3QkFFakI7SUFGRCxXQUFrQix3QkFBd0I7UUFDekMseUdBQXlCLENBQUE7SUFDMUIsQ0FBQyxFQUZpQix3QkFBd0Isd0NBQXhCLHdCQUF3QixRQUV6QztJQVNELFNBQVMsMENBQTBDLENBQUMsV0FBbUI7UUFDdEUsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFBLHVDQUF3QixFQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDbEUsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDcEIsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUNELG9EQUFvRDtRQUNwRCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDNUQsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNYLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDN0IsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBQ0QsT0FBTyxPQUFPLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQWEsMkJBQTJCO1FBSXZDLFlBQ2tCLHFCQUFx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