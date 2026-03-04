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
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/cursorColumns", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/enterAction", "vs/editor/common/languages/languageConfigurationRegistry"], function (require, exports, strings, cursorColumns_1, range_1, selection_1, enterAction_1, languageConfigurationRegistry_1) {
    "use strict";
    var ShiftCommand_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShiftCommand = void 0;
    const repeatCache = Object.create(null);
    function cachedStringRepeat(str, count) {
        if (count <= 0) {
            return '';
        }
        if (!repeatCache[str]) {
            repeatCache[str] = ['', str];
        }
        const cache = repeatCache[str];
        for (let i = cache.length; i <= count; i++) {
            cache[i] = cache[i - 1] + str;
        }
        return cache[count];
    }
    let ShiftCommand = ShiftCommand_1 = class ShiftCommand {
        static unshiftIndent(line, column, tabSize, indentSize, insertSpaces) {
            // Determine the visible column where the content starts
            const contentStartVisibleColumn = cursorColumns_1.CursorColumns.visibleColumnFromColumn(line, column, tabSize);
            if (insertSpaces) {
                const indent = cachedStringRepeat(' ', indentSize);
                const desiredTabStop = cursorColumns_1.CursorColumns.prevIndentTabStop(contentStartVisibleColumn, indentSize);
                const indentCount = desiredTabStop / indentSize; // will be an integer
                return cachedStringRepeat(indent, indentCount);
            }
            else {
                const indent = '\t';
                const desiredTabStop = cursorColumns_1.CursorColumns.prevRenderTabStop(contentStartVisibleColumn, tabSize);
                const indentCount = desiredTabStop / tabSize; // will be an integer
                return cachedStringRepeat(indent, indentCount);
            }
        }
        static shiftIndent(line, column, tabSize, indentSize, insertSpaces) {
            // Determine the visible column where the content starts
            const contentStartVisibleColumn = cursorColumns_1.CursorColumns.visibleColumnFromColumn(line, column, tabSize);
            if (insertSpaces) {
                const indent = cachedStringRepeat(' ', indentSize);
                const desiredTabStop = cursorColumns_1.CursorColumns.nextIndentTabStop(contentStartVisibleColumn, indentSize);
                const indentCount = desiredTabStop / indentSize; // will be an integer
                return cachedStringRepeat(indent, indentCount);
            }
            else {
                const indent = '\t';
                const desiredTabStop = cursorColumns_1.CursorColumns.nextRenderTabStop(contentStartVisibleColumn, tabSize);
                const indentCount = desiredTabStop / tabSize; // will be an integer
                return cachedStringRepeat(indent, indentCount);
            }
        }
        constructor(range, opts, _languageConfigurationService) {
            this._languageConfigurationService = _languageConfigurationService;
            this._opts = opts;
            this._selection = range;
            this._selectionId = null;
            this._useLastEditRangeForCursorEndPosition = false;
            this._selectionStartColumnStaysPut = false;
        }
        _addEditOperation(builder, range, text) {
            if (this._useLastEditRangeForCursorEndPosition) {
                builder.addTrackedEditOperation(range, text);
            }
            else {
                builder.addEditOperation(range, text);
            }
        }
        getEditOperations(model, builder) {
            const startLine = this._selection.startLineNumber;
            let endLine = this._selection.endLineNumber;
            if (this._selection.endColumn === 1 && startLine !== endLine) {
                endLine = endLine - 1;
            }
            const { tabSize, indentSize, insertSpaces } = this._opts;
            const shouldIndentEmptyLines = (startLine === endLine);
            if (this._opts.useTabStops) {
                // if indenting or outdenting on a whitespace only line
                if (this._selection.isEmpty()) {
                    if (/^\s*$/.test(model.getLineContent(startLine))) {
                        this._useLastEditRangeForCursorEndPosition = true;
                    }
                }
                // keep track of previous line's "miss-alignment"
                let previousLineExtraSpaces = 0, extraSpaces = 0;
                for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++, previousLineExtraSpaces = extraSpaces) {
                    extraSpaces = 0;
                    const lineText = model.getLineContent(lineNumber);
                    let indentationEndIndex = strings.firstNonWhitespaceIndex(lineText);
                    if (this._opts.isUnshift && (lineText.length === 0 || indentationEndIndex === 0)) {
                        // empty line or line with no leading whitespace => nothing to do
                        continue;
                    }
                    if (!shouldIndentEmptyLines && !this._opts.isUnshift && lineText.length === 0) {
                        // do not indent empty lines => nothing to do
                        continue;
                    }
                    if (indentationEndIndex === -1) {
                        // the entire line is whitespace
                        indentationEndIndex = lineText.length;
                    }
                    if (lineNumber > 1) {
                        const contentStartVisibleColumn = cursorColumns_1.CursorColumns.visibleColumnFromColumn(lineText, indentationEndIndex + 1, tabSize);
                        if (contentStartVisibleColumn % indentSize !== 0) {
                            // The current line is "miss-aligned", so let's see if this is expected...
                            // This can only happen when it has trailing commas in the indent
                            if (model.tokenization.isCheapToTokenize(lineNumber - 1)) {
                                const enterAction = (0, enterAction_1.getEnterAction)(this._opts.autoIndent, model, new range_1.Range(lineNumber - 1, model.getLineMaxColumn(lineNumber - 1), lineNumber - 1, model.getLineMaxColumn(lineNumber - 1)), this._languageConfigurationService);
                                if (enterAction) {
                                    extraSpaces = previousLineExtraSpaces;
                                    if (enterAction.appendText) {
                                        for (let j = 0, lenJ = enterAction.appendText.length; j < lenJ && extraSpaces < indentSize; j++) {
                                            if (enterAction.appendText.charCodeAt(j) === 32 /* CharCode.Space */) {
                                                extraSpaces++;
                                            }
                                            else {
                                                break;
                                            }
                                        }
                                    }
                                    if (enterAction.removeText) {
                                        extraSpaces = Math.max(0, extraSpaces - enterAction.removeText);
                                    }
                                    // Act as if `prefixSpaces` is not part of the indentation
                                    for (let j = 0; j < extraSpaces; j++) {
                                        if (indentationEndIndex === 0 || lineText.charCodeAt(indentationEndIndex - 1) !== 32 /* CharCode.Space */) {
                                            break;
                                        }
                                        indentationEndIndex--;
                                    }
                                }
                            }
                        }
                    }
                    if (this._opts.isUnshift && indentationEndIndex === 0) {
                        // line with no leading whitespace => nothing to do
                        continue;
                    }
                    let desiredIndent;
                    if (this._opts.isUnshift) {
                        desiredIndent = ShiftCommand_1.unshiftIndent(lineText, indentationEndIndex + 1, tabSize, indentSize, insertSpaces);
                    }
                    else {
                        desiredIndent = ShiftCommand_1.shiftIndent(lineText, indentationEndIndex + 1, tabSize, indentSize, insertSpaces);
                    }
                    this._addEditOperation(builder, new range_1.Range(lineNumber, 1, lineNumber, indentationEndIndex + 1), desiredIndent);
                    if (lineNumber === startLine && !this._selection.isEmpty()) {
                        // Force the startColumn to stay put because we're inserting after it
                        this._selectionStartColumnStaysPut = (this._selection.startColumn <= indentationEndIndex + 1);
                    }
                }
            }
            else {
                // if indenting or outdenting on a whitespace only line
                if (!this._opts.isUnshift && this._selection.isEmpty() && model.getLineLength(startLine) === 0) {
                    this._useLastEditRangeForCursorEndPosition = true;
                }
                const oneIndent = (insertSpaces ? cachedStringRepeat(' ', indentSize) : '\t');
                for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
                    const lineText = model.getLineContent(lineNumber);
                    let indentationEndIndex = strings.firstNonWhitespaceIndex(lineText);
                    if (this._opts.isUnshift && (lineText.length === 0 || indentationEndIndex === 0)) {
                        // empty line or line with no leading whitespace => nothing to do
                        continue;
                    }
                    if (!shouldIndentEmptyLines && !this._opts.isUnshift && lineText.length === 0) {
                        // do not indent empty lines => nothing to do
                        continue;
                    }
                    if (indentationEndIndex === -1) {
                        // the entire line is whitespace
                        indentationEndIndex = lineText.length;
                    }
                    if (this._opts.isUnshift && indentationEndIndex === 0) {
                        // line with no leading whitespace => nothing to do
                        continue;
                    }
                    if (this._opts.isUnshift) {
                        indentationEndIndex = Math.min(indentationEndIndex, indentSize);
                        for (let i = 0; i < indentationEndIndex; i++) {
                            const chr = lineText.charCodeAt(i);
                            if (chr === 9 /* CharCode.Tab */) {
                                indentationEndIndex = i + 1;
                                break;
                            }
                        }
                        this._addEditOperation(builder, new range_1.Range(lineNumber, 1, lineNumber, indentationEndIndex + 1), '');
                    }
                    else {
                        this._addEditOperation(builder, new range_1.Range(lineNumber, 1, lineNumber, 1), oneIndent);
                        if (lineNumber === startLine && !this._selection.isEmpty()) {
                            // Force the startColumn to stay put because we're inserting after it
                            this._selectionStartColumnStaysPut = (this._selection.startColumn === 1);
                        }
                    }
                }
            }
            this._selectionId = builder.trackSelection(this._selection);
        }
        computeCursorState(model, helper) {
            if (this._useLastEditRangeForCursorEndPosition) {
                const lastOp = helper.getInverseEditOperations()[0];
                return new selection_1.Selection(lastOp.range.endLineNumber, lastOp.range.endColumn, lastOp.range.endLineNumber, lastOp.range.endColumn);
            }
            const result = helper.getTrackedSelection(this._selectionId);
            if (this._selectionStartColumnStaysPut) {
                // The selection start should not move
                const initialStartColumn = this._selection.startColumn;
                const resultStartColumn = result.startColumn;
                if (resultStartColumn <= initialStartColumn) {
                    return result;
                }
                if (result.getDirection() === 0 /* SelectionDirection.LTR */) {
                    return new selection_1.Selection(result.startLineNumber, initialStartColumn, result.endLineNumber, result.endColumn);
                }
                return new selection_1.Selection(result.endLineNumber, result.endColumn, result.startLineNumber, initialStartColumn);
            }
            return result;
        }
    };
    exports.ShiftCommand = ShiftCommand;
    exports.ShiftCommand = ShiftCommand = ShiftCommand_1 = __decorate([
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], ShiftCommand);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hpZnRDb21tYW5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb21tYW5kcy9zaGlmdENvbW1hbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXNCaEcsTUFBTSxXQUFXLEdBQWdDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckUsU0FBUyxrQkFBa0IsQ0FBQyxHQUFXLEVBQUUsS0FBYTtRQUNyRCxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNoQixPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDdkIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFDRCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM1QyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDL0IsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFFTSxJQUFNLFlBQVksb0JBQWxCLE1BQU0sWUFBWTtRQUVqQixNQUFNLENBQUMsYUFBYSxDQUFDLElBQVksRUFBRSxNQUFjLEVBQUUsT0FBZSxFQUFFLFVBQWtCLEVBQUUsWUFBcUI7WUFDbkgsd0RBQXdEO1lBQ3hELE1BQU0seUJBQXlC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