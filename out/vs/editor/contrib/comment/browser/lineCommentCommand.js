/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/contrib/comment/browser/blockCommentCommand"], function (require, exports, strings, editOperation_1, position_1, range_1, selection_1, blockCommentCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineCommentCommand = exports.Type = void 0;
    var Type;
    (function (Type) {
        Type[Type["Toggle"] = 0] = "Toggle";
        Type[Type["ForceAdd"] = 1] = "ForceAdd";
        Type[Type["ForceRemove"] = 2] = "ForceRemove";
    })(Type || (exports.Type = Type = {}));
    class LineCommentCommand {
        constructor(languageConfigurationService, selection, indentSize, type, insertSpace, ignoreEmptyLines, ignoreFirstLine) {
            this.languageConfigurationService = languageConfigurationService;
            this._selection = selection;
            this._indentSize = indentSize;
            this._type = type;
            this._insertSpace = insertSpace;
            this._selectionId = null;
            this._deltaColumn = 0;
            this._moveEndPositionDown = false;
            this._ignoreEmptyLines = ignoreEmptyLines;
            this._ignoreFirstLine = ignoreFirstLine || false;
        }
        /**
         * Do an initial pass over the lines and gather info about the line comment string.
         * Returns null if any of the lines doesn't support a line comment string.
         */
        static _gatherPreflightCommentStrings(model, startLineNumber, endLineNumber, languageConfigurationService) {
            model.tokenization.tokenizeIfCheap(startLineNumber);
            const languageId = model.getLanguageIdAtPosition(startLineNumber, 1);
            const config = languageConfigurationService.getLanguageConfiguration(languageId).comments;
            const commentStr = (config ? config.lineCommentToken : null);
            if (!commentStr) {
                // Mode does not support line comments
                return null;
            }
            const lines = [];
            for (let i = 0, lineCount = endLineNumber - startLineNumber + 1; i < lineCount; i++) {
                lines[i] = {
                    ignore: false,
                    commentStr: commentStr,
                    commentStrOffset: 0,
                    commentStrLength: commentStr.length
                };
            }
            return lines;
        }
        /**
         * Analyze lines and decide which lines are relevant and what the toggle should do.
         * Also, build up several offsets and lengths useful in the generation of editor operations.
         */
        static _analyzeLines(type, insertSpace, model, lines, startLineNumber, ignoreEmptyLines, ignoreFirstLine, languageConfigurationService) {
            let onlyWhitespaceLines = true;
            let shouldRemoveComments;
            if (type === 0 /* Type.Toggle */) {
                shouldRemoveComments = true;
            }
            else if (type === 1 /* Type.ForceAdd */) {
                shouldRemoveComments = false;
            }
            else {
                shouldRemoveComments = true;
            }
            for (let i = 0, lineCount = lines.length; i < lineCount; i++) {
                const lineData = lines[i];
                const lineNumber = startLineNumber + i;
                if (lineNumber === startLineNumber && ignoreFirstLine) {
                    // first line ignored
                    lineData.ignore = true;
                    continue;
                }
                const lineContent = model.getLineContent(lineNumber);
                const lineContentStartOffset = strings.firstNonWhitespaceIndex(lineContent);
                if (lineContentStartOffset === -1) {
                    // Empty or whitespace only line
                    lineData.ignore = ignoreEmptyLines;
                    lineData.commentStrOffset = lineContent.length;
                    continue;
                }
                onlyWhitespaceLines = false;
                lineData.ignore = false;
                lineData.commentStrOffset = lineContentStartOffset;
                if (shouldRemoveComments && !blockCommentCommand_1.BlockCommentCommand._haystackHasNeedleAtOffset(lineContent, lineData.commentStr, lineContentStartOffset)) {
                    if (type === 0 /* Type.Toggle */) {
                        // Every line so far has been a line comment, but this one is not
                        shouldRemoveComments = false;
                    }
                    else if (type === 1 /* Type.ForceAdd */) {
                        // Will not happen
                    }
                    else {
                        lineData.ignore = true;
                    }
                }
                if (shouldRemoveComments && insertSpace) {
                    // Remove a following space if present
                    const commentStrEndOffset = lineContentStartOffset + lineData.commentStrLength;
                    if (commentStrEndOffset < lineContent.length && lineContent.charCodeAt(commentStrEndOffset) === 32 /* CharCode.Space */) {
                        lineData.commentStrLength += 1;
                    }
                }
            }
            if (type === 0 /* Type.Toggle */ && onlyWhitespaceLines) {
                // For only whitespace lines, we insert comments
                shouldRemoveComments = false;
                // Also, no longer ignore them
                for (let i = 0, lineCount = lines.length; i < lineCount; i++) {
                    lines[i].ignore = false;
                }
            }
            return {
                supported: true,
                shouldRemoveComments: shouldRemoveComments,
                lines: lines
            };
        }
        /**
         * Analyze all lines and decide exactly what to do => not supported | insert line comments | remove line comments
         */
        static _gatherPreflightData(type, insertSpace, model, startLineNumber, endLineNumber, ignoreEmptyLines, ignoreFirstLine, languageConfigurationService) {
            const lines = LineCommentCommand._gatherPreflightCommentStrings(model, startLineNumber, endLineNumber, languageConfigurationService);
            if (lines === null) {
                return {
                    supported: false
                };
            }
            return LineCommentCommand._analyzeLines(type, insertSpace, model, lines, startLineNumber, ignoreEmptyLines, ignoreFirstLine, languageConfigurationService);
        }
        /**
         * Given a successful analysis, execute either insert line comments, either remove line comments
         */
        _executeLineComments(model, builder, data, s) {
            let ops;
            if (data.shouldRemoveComments) {
                ops = LineCommentCommand._createRemoveLineCommentsOperations(data.lines, s.startLineNumber);
            }
            else {
                LineCommentCommand._normalizeInsertionPoint(model, data.lines, s.startLineNumber, this._indentSize);
                ops = this._createAddLineCommentsOperations(data.lines, s.startLineNumber);
            }
            const cursorPosition = new position_1.Position(s.positionLineNumber, s.positionColumn);
            for (let i = 0, len = ops.length; i < len; i++) {
                builder.addEditOperation(ops[i].range, ops[i].text);
                if (range_1.Range.isEmpty(ops[i].range) && range_1.Range.getStartPosition(ops[i].range).equals(cursorPosition)) {
                    const lineContent = model.getLineContent(cursorPosition.lineNumber);
                    if (lineContent.length + 1 === cursorPosition.column) {
                        this._deltaColumn = (ops[i].text || '').length;
                    }
                }
            }
            this._selectionId = builder.trackSelection(s);
        }
        _attemptRemoveBlockComment(model, s, startToken, endToken) {
            let startLineNumber = s.startLineNumber;
            let endLineNumber = s.endLineNumber;
            const startTokenAllowedBeforeColumn = endToken.length + Math.max(model.getLineFirstNonWhitespaceColumn(s.startLineNumber), s.startColumn);
            let startTokenIndex = model.getLineContent(startLineNumber).lastIndexOf(startToken, startTokenAllowedBeforeColumn - 1);
            let endTokenIndex = model.getLineContent(endLineNumber).indexOf(endToken, s.endColumn - 1 - startToken.length);
            if (startTokenIndex !== -1 && endTokenIndex === -1) {
                endTokenIndex = model.getLineContent(startLineNumber).indexOf(endToken, startTokenIndex + startToken.length);
                endLineNumber = startLineNumber;
            }
            if (startTokenIndex === -1 && endTokenIndex !== -1) {
                startTokenIndex = model.getLineContent(endLineNumber).lastIndexOf(startToken, endTokenIndex);
                startLineNumber = endLineNumber;
            }
            if (s.isEmpty() && (startTokenIndex === -1 || endTokenIndex === -1)) {
                startTokenIndex = model.getLineContent(startLineNumber).indexOf(startToken);
                if (startTokenIndex !== -1) {
                    endTokenIndex = model.getLineContent(startLineNumber).indexOf(endToken, startTokenIndex + startToken.length);
                }
            }
            // We have to adjust to possible inner white space.
            // For Space after startToken, add Space to startToken - range math will work out.
            if (startTokenIndex !== -1 && model.getLineContent(startLineNumber).charCodeAt(startTokenIndex + startToken.length) === 32 /* CharCode.Space */) {
                startToken += ' ';
            }
            // For Space before endToken, add Space before endToken and shift index one left.
            if (endTokenIndex !== -1 && model.getLineContent(endLineNumber).charCodeAt(endTokenIndex - 1) === 32 /* CharCode.Space */) {
                endToken = ' ' + endToken;
                endTokenIndex -= 1;
            }
            if (startTokenIndex !== -1 && endTokenIndex !== -1) {
                return blockCommentCommand_1.BlockCommentCommand._createRemoveBlockCommentOperations(new range_1.Range(startLineNumber, startTokenIndex + startToken.length + 1, endLineNumber, endTokenIndex + 1), startToken, endToken);
            }
            return null;
        }
        /**
         * Given an unsuccessful analysis, delegate to the block comment command
         */
        _executeBlockComment(model, builder, s) {
            model.tokenization.tokenizeIfCheap(s.startLineNumber);
            const languageId = model.getLanguageIdAtPosition(s.startLineNumber, 1);
            const config = this.languageConfigurationService.getLanguageConfiguration(languageId).comments;
            if (!config || !config.blockCommentStartToken || !config.blockCommentEndToken) {
                // Mode does not support block comments
                return;
            }
            const startToken = config.blockCommentStartToken;
            const endToken = config.blockCommentEndToken;
            let ops = this._attemptRemoveBlockComment(model, s, startToken, endToken);
            if (!ops) {
                if (s.isEmpty()) {
                    const lineContent = model.getLineContent(s.startLineNumber);
                    let firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineContent);
                    if (firstNonWhitespaceIndex === -1) {
                        // Line is empty or contains only whitespace
                        firstNonWhitespaceIndex = lineContent.length;
                    }
                    ops = blockCommentCommand_1.BlockCommentCommand._createAddBlockCommentOperations(new range_1.Range(s.startLineNumber, firstNonWhitespaceIndex + 1, s.startLineNumber, lineContent.length + 1), startToken, endToken, this._insertSpace);
                }
                else {
                    ops = blockCommentCommand_1.BlockCommentCommand._createAddBlockCommentOperations(new range_1.Range(s.startLineNumber, model.getLineFirstNonWhitespaceColumn(s.startLineNumber), s.endLineNumber, model.getLineMaxColumn(s.endLineNumber)), startToken, endToken, this._insertSpace);
                }
                if (ops.length === 1) {
                    // Leave cursor after token and Space
                    this._deltaColumn = startToken.length + 1;
                }
            }
            this._selectionId = builder.trackSelection(s);
            for (const op of ops) {
                builder.addEditOperation(op.range, op.text);
            }
        }
        getEditOperations(model, builder) {
            let s = this._selection;
            this._moveEndPositionDown = false;
            if (s.startLineNumber === s.endLineNumber && this._ignoreFirstLine) {
                builder.addEditOperation(new range_1.Range(s.startLineNumber, model.getLineMaxColumn(s.startLineNumber), s.startLineNumber + 1, 1), s.startLineNumber === model.getLineCount() ? '' : '\n');
                this._selectionId = builder.trackSelection(s);
                return;
            }
            if (s.startLineNumber < s.endLineNumber && s.endColumn === 1) {
                this._moveEndPositionDown = true;
                s = s.setEndPosition(s.endLineNumber - 1, model.getLineMaxColumn(s.endLineNumber - 1));
            }
            const data = LineCommentCommand._gatherPreflightData(this._type, this._insertSpace, model, s.startLineNumber, s.endLineNumber, this._ignoreEmptyLines, this._ignoreFirstLine, this.languageConfigurationService);
            if (data.supported) {
                return this._executeLineComments(model, builder, data, s);
            }
            return this._executeBlockComment(model, builder, s);
        }
        computeCursorState(model, helper) {
            let result = helper.getTrackedSelection(this._selectionId);
            if (this._moveEndPositionDown) {
                result = result.setEndPosition(result.endLineNumber + 1, 1);
            }
            return new selection_1.Selection(result.selectionStartLineNumber, result.selectionStartColumn + this._deltaColumn, result.positionLineNumber, result.positionColumn + this._deltaColumn);
        }
        /**
         * Generate edit operations in the remove line comment case
         */
        static _createRemoveLineCommentsOperations(lines, startLineNumber) {
            const res = [];
            for (let i = 0, len = lines.length; i < len; i++) {
                const lineData = lines[i];
                if (lineData.ignore) {
                    continue;
                }
                res.push(editOperation_1.EditOperation.delete(new range_1.Range(startLineNumber + i, lineData.commentStrOffset + 1, startLineNumber + i, lineData.commentStrOffset + lineData.commentStrLength + 1)));
            }
            return res;
        }
        /**
         * Generate edit operations in the add line comment case
         */
        _createAddLineCommentsOperations(lines, startLineNumber) {
            const res = [];
            const afterCommentStr = this._insertSpace ? ' ' : '';
            for (let i = 0, len = lines.length; i < len; i++) {
                const lineData = lines[i];
                if (lineData.ignore) {
                    continue;
                }
                res.push(editOperation_1.EditOperation.insert(new position_1.Position(startLineNumber + i, lineData.commentStrOffset + 1), lineData.commentStr + afterCommentStr));
            }
            return res;
        }
        static nextVisibleColumn(currentVisibleColumn, indentSize, isTab, columnSize) {
            if (isTab) {
                return currentVisibleColumn + (indentSize - (currentVisibleColumn % indentSize));
            }
            return currentVisibleColumn + columnSize;
        }
        /**
         * Adjust insertion points to have them vertically aligned in the add line comment case
         */
        static _normalizeInsertionPoint(model, lines, startLineNumber, indentSize) {
            let minVisibleColumn = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
            let j;
            let lenJ;
            for (let i = 0, len = lines.length; i < len; i++) {
                if (lines[i].ignore) {
                    continue;
                }
                const lineContent = model.getLineContent(startLineNumber + i);
                let currentVisibleColumn = 0;
                for (let j = 0, lenJ = lines[i].commentStrOffset; currentVisibleColumn < minVisibleColumn && j < lenJ; j++) {
                    currentVisibleColumn = LineCommentCommand.nextVisibleColumn(currentVisibleColumn, indentSize, lineContent.charCodeAt(j) === 9 /* CharCode.Tab */, 1);
                }
                if (currentVisibleColumn < minVisibleColumn) {
                    minVisibleColumn = currentVisibleColumn;
                }
            }
            minVisibleColumn = Math.floor(minVisibleColumn / indentSize) * indentSize;
            for (let i = 0, len = lines.length; i < len; i++) {
                if (lines[i].ignore) {
                    continue;
                }
                const lineContent = model.getLineContent(startLineNumber + i);
                let currentVisibleColumn = 0;
                for (j = 0, lenJ = lines[i].commentStrOffset; currentVisibleColumn < minVisibleColumn && j < lenJ; j++) {
                    currentVisibleColumn = LineCommentCommand.nextVisibleColumn(currentVisibleColumn, indentSize, lineContent.charCodeAt(j) === 9 /* CharCode.Tab */, 1);
                }
                if (currentVisibleColumn > minVisibleColumn) {
                    lines[i].commentStrOffset = j - 1;
                }
                else {
                    lines[i].commentStrOffset = j;
                }
            }
        }
    }
    exports.LineCommentCommand = LineCommentCommand;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZUNvbW1lbnRDb21tYW5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29tbWVudC9icm93c2VyL2xpbmVDb21tZW50Q29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3Q2hHLElBQWtCLElBSWpCO0lBSkQsV0FBa0IsSUFBSTtRQUNyQixtQ0FBVSxDQUFBO1FBQ1YsdUNBQVksQ0FBQTtRQUNaLDZDQUFlLENBQUE7SUFDaEIsQ0FBQyxFQUppQixJQUFJLG9CQUFKLElBQUksUUFJckI7SUFFRCxNQUFhLGtCQUFrQjtRQVk5QixZQUNrQiw0QkFBMkQsRUFDNUUsU0FBb0IsRUFDcEIsVUFBa0IsRUFDbEIsSUFBVSxFQUNWLFdBQW9CLEVBQ3BCLGdCQUF5QixFQUN6QixlQUF5QjtZQU5SLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7WUFRNUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDNUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7WUFDaEMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDekIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7WUFDdEIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLEtBQUssQ0FBQztZQUNsQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsZ0JBQWdCLENBQUM7WUFDMUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsSUFBSSxLQUFLLENBQUM7UUFDbEQsQ0FBQztRQUVEOzs7V0FHRztRQUNLLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxLQUFpQixFQUFFLGVBQXVC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