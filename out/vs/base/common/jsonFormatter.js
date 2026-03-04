/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./json"], function (require, exports, json_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.format = format;
    exports.toFormattedString = toFormattedString;
    exports.getEOL = getEOL;
    exports.isEOL = isEOL;
    function format(documentText, range, options) {
        let initialIndentLevel;
        let formatText;
        let formatTextStart;
        let rangeStart;
        let rangeEnd;
        if (range) {
            rangeStart = range.offset;
            rangeEnd = rangeStart + range.length;
            formatTextStart = rangeStart;
            while (formatTextStart > 0 && !isEOL(documentText, formatTextStart - 1)) {
                formatTextStart--;
            }
            let endOffset = rangeEnd;
            while (endOffset < documentText.length && !isEOL(documentText, endOffset)) {
                endOffset++;
            }
            formatText = documentText.substring(formatTextStart, endOffset);
            initialIndentLevel = computeIndentLevel(formatText, options);
        }
        else {
            formatText = documentText;
            initialIndentLevel = 0;
            formatTextStart = 0;
            rangeStart = 0;
            rangeEnd = documentText.length;
        }
        const eol = getEOL(options, documentText);
        let lineBreak = false;
        let indentLevel = 0;
        let indentValue;
        if (options.insertSpaces) {
            indentValue = repeat(' ', options.tabSize || 4);
        }
        else {
            indentValue = '\t';
        }
        const scanner = (0, json_1.createScanner)(formatText, false);
        let hasError = false;
        function newLineAndIndent() {
            return eol + repeat(indentValue, initialIndentLevel + indentLevel);
        }
        function scanNext() {
            let token = scanner.scan();
            lineBreak = false;
            while (token === 15 /* SyntaxKind.Trivia */ || token === 14 /* SyntaxKind.LineBreakTrivia */) {
                lineBreak = lineBreak || (token === 14 /* SyntaxKind.LineBreakTrivia */);
                token = scanner.scan();
            }
            hasError = token === 16 /* SyntaxKind.Unknown */ || scanner.getTokenError() !== 0 /* ScanError.None */;
            return token;
        }
        const editOperations = [];
        function addEdit(text, startOffset, endOffset) {
            if (!hasError && startOffset < rangeEnd && endOffset > rangeStart && documentText.substring(startOffset, endOffset) !== text) {
                editOperations.push({ offset: startOffset, length: endOffset - startOffset, content: text });
            }
        }
        let firstToken = scanNext();
        if (firstToken !== 17 /* SyntaxKind.EOF */) {
            const firstTokenStart = scanner.getTokenOffset() + formatTextStart;
            const initialIndent = repeat(indentValue, initialIndentLevel);
            addEdit(initialIndent, formatTextStart, firstTokenStart);
        }
        while (firstToken !== 17 /* SyntaxKind.EOF */) {
            let firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
            let secondToken = scanNext();
            let replaceContent = '';
            while (!lineBreak && (secondToken === 12 /* SyntaxKind.LineCommentTrivia */ || secondToken === 13 /* SyntaxKind.BlockCommentTrivia */)) {
                // comments on the same line: keep them on the same line, but ignore them otherwise
                const commentTokenStart = scanner.getTokenOffset() + formatTextStart;
                addEdit(' ', firstTokenEnd, commentTokenStart);
                firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
                replaceContent = secondToken === 12 /* SyntaxKind.LineCommentTrivia */ ? newLineAndIndent() : '';
                secondToken = scanNext();
            }
            if (secondToken === 2 /* SyntaxKind.CloseBraceToken */) {
                if (firstToken !== 1 /* SyntaxKind.OpenBraceToken */) {
                    indentLevel--;
                    replaceContent = newLineAndIndent();
                }
            }
            else if (secondToken === 4 /* SyntaxKind.CloseBracketToken */) {
                if (firstToken !== 3 /* SyntaxKind.OpenBracketToken */) {
                    indentLevel--;
                    replaceContent = newLineAndIndent();
                }
            }
            else {
                switch (firstToken) {
                    case 3 /* SyntaxKind.OpenBracketToken */:
                    case 1 /* SyntaxKind.OpenBraceToken */:
                        indentLevel++;
                        replaceContent = newLineAndIndent();
                        break;
                    case 5 /* SyntaxKind.CommaToken */:
                    case 12 /* SyntaxKind.LineCommentTrivia */:
                        replaceContent = newLineAndIndent();
                        break;
                    case 13 /* SyntaxKind.BlockCommentTrivia */:
                        if (lineBreak) {
                            replaceContent = newLineAndIndent();
                        }
                        else {
                            // symbol following comment on the same line: keep on same line, separate with ' '
                            replaceContent = ' ';
                        }
                        break;
                    case 6 /* SyntaxKind.ColonToken */:
                        replaceContent = ' ';
                        break;
                    case 10 /* SyntaxKind.StringLiteral */:
                        if (secondToken === 6 /* SyntaxKind.ColonToken */) {
                            replaceContent = '';
                            break;
                        }
                    // fall through
                    case 7 /* SyntaxKind.NullKeyword */:
                    case 8 /* SyntaxKind.TrueKeyword */:
                    case 9 /* SyntaxKind.FalseKeyword */:
                    case 11 /* SyntaxKind.NumericLiteral */:
                    case 2 /* SyntaxKind.CloseBraceToken */:
                    case 4 /* SyntaxKind.CloseBracketToken */:
                        if (secondToken === 12 /* SyntaxKind.LineCommentTrivia */ || secondToken === 13 /* SyntaxKind.BlockCommentTrivia */) {
                            replaceContent = ' ';
                        }
                        else if (secondToken !== 5 /* SyntaxKind.CommaToken */ && secondToken !== 17 /* SyntaxKind.EOF */) {
                            hasError = true;
                        }
                        break;
                    case 16 /* SyntaxKind.Unknown */:
                        hasError = true;
                        break;
                }
                if (lineBreak && (secondToken === 12 /* SyntaxKind.LineCommentTrivia */ || secondToken === 13 /* SyntaxKind.BlockCommentTrivia */)) {
                    replaceContent = newLineAndIndent();
                }
            }
            const secondTokenStart = scanner.getTokenOffset() + formatTextStart;
            addEdit(replaceContent, firstTokenEnd, secondTokenStart);
            firstToken = secondToken;
        }
        return editOperations;
    }
    /**
     * Creates a formatted string out of the object passed as argument, using the given formatting options
     * @param any The object to stringify and format
     * @param options The formatting options to use
     */
    function toFormattedString(obj, options) {
        const content = JSON.stringify(obj, undefined, options.insertSpaces ? options.tabSize || 4 : '\t');
        if (options.eol !== undefined) {
            return content.replace(/\r\n|\r|\n/g, options.eol);
        }
        return content;
    }
    function repeat(s, count) {
        let result = '';
        for (let i = 0; i < count; i++) {
            result += s;
        }
        return result;
    }
    function computeIndentLevel(content, options) {
        let i = 0;
        let nChars = 0;
        const tabSize = options.tabSize || 4;
        while (i < content.length) {
            const ch = content.charAt(i);
            if (ch === ' ') {
                nChars++;
            }
            else if (ch === '\t') {
                nChars += tabSize;
            }
            else {
                break;
            }
            i++;
        }
        return Math.floor(nChars / tabSize);
    }
    function getEOL(options, text) {
        for (let i = 0; i < text.length; i++) {
            const ch = text.charAt(i);
            if (ch === '\r') {
                if (i + 1 < text.length && text.charAt(i + 1) === '\n') {
                    return '\r\n';
                }
                return '\r';
            }
            else if (ch === '\n') {
                return '\n';
            }
        }
        return (options && options.eol) || '\n';
    }
    function isEOL(text, offset) {
        return '\r\n'.indexOf(text.charAt(offset)) !== -1;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbkZvcm1hdHRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2pzb25Gb3JtYXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvRGhHLHdCQW1KQztJQU9ELDhDQU1DO0lBNEJELHdCQWFDO0lBRUQsc0JBRUM7SUE3TUQsU0FBZ0IsTUFBTSxDQUFDLFlBQW9CLEVBQUUsS0FBd0IsRUFBRSxPQUEwQjtRQUNoRyxJQUFJLGtCQUEwQixDQUFDO1FBQy9CLElBQUksVUFBa0IsQ0FBQztRQUN2QixJQUFJLGVBQXVCLENBQUM7UUFDNUIsSUFBSSxVQUFrQixDQUFDO1FBQ3ZCLElBQUksUUFBZ0IsQ0FBQztRQUNyQixJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1gsVUFBVSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDMUIsUUFBUSxHQUFHLFVBQVUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBRXJDLGVBQWUsR0FBRyxVQUFVLENBQUM7WUFDN0IsT0FBTyxlQUFlLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxlQUFlLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDekUsZUFBZSxFQUFFLENBQUM7WUFDbkIsQ0FBQztZQUNELElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUN6QixPQUFPLFNBQVMsR0FBRyxZQUFZLENBQUMsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUMzRSxTQUFTLEVBQUUsQ0FBQztZQUNiLENBQUM7WUFDRCxVQUFVLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDaEUsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzlELENBQUM7YUFBTSxDQUFDO1lBQ1AsVUFBVSxHQUFHLFlBQVksQ0FBQztZQUMxQixrQkFBa0IsR0FBRyxDQUFDLENBQUM7WUFDdkIsZUFBZSxHQUFHLENBQUMsQ0FBQztZQUNwQixVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsUUFBUSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUM7UUFDaEMsQ0FBQztRQUNELE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFMUMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3RCLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztRQUNwQixJQUFJLFdBQW1CLENBQUM7UUFDeEIsSUFBSSxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDMUIsV0FBVyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqRCxDQUFDO2FBQU0sQ0FBQztZQUNQLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDcEIsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLElBQUEsb0JBQWEsRUFBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakQsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBRXJCLFNBQVMsZ0JBQWdCO1lBQ3hCLE9BQU8sR0FBRyxHQUFHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsa0JBQWtCLEdBQUcsV0FBVyxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUNELFNBQVMsUUFBUTtZQUNoQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDM0IsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUNsQixPQUFPLEtBQUssK0JBQXNCLElBQUksS0FBSyx3Q0FBK0IsRUFBRSxDQUFDO2dCQUM1RSxTQUFTLEdBQUcsU0FBUyxJQUFJLENBQUMsS0FBSyx3Q0FBK0IsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3hCLENBQUM7WUFDRCxRQUFRLEdBQUcsS0FBSyxnQ0FBdUIsSUFBSSxPQUFPLENBQUMsYUFBYSxFQUFFLDJCQUFtQixDQUFDO1lBQ3RGLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUNELE1BQU0sY0FBYyxHQUFXLEVBQUUsQ0FBQztRQUNsQyxTQUFTLE9BQU8sQ0FBQyxJQUFZLEVBQUUsV0FBbUIsRUFBRSxTQUFpQjtZQUNwRSxJQUFJLENBQUMsUUFBUSxJQUFJLFdBQVcsR0FBRyxRQUFRLElBQUksU0FBUyxHQUFHLFVBQVUsSUFBSSxZQUFZLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDOUgsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLFNBQVMsR0FBRyxXQUFXLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDOUYsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLFVBQVUsR0FBRyxRQUFRLEVBQUUsQ0FBQztRQUU1QixJQUFJLFVBQVUsNEJBQW1CLEVBQUUsQ0FBQztZQUNuQyxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLEdBQUcsZUFBZSxDQUFDO1lBQ25FLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUM5RCxPQUFPLENBQUMsYUFBYSxFQUFFLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsT0FBTyxVQUFVLDRCQUFtQixFQUFFLENBQUM7WUFDdEMsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsR0FBRyxlQUFlLENBQUM7WUFDMUYsSUFBSSxXQUFXLEdBQUcsUUFBUSxFQUFFLENBQUM7WUFFN0IsSUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxTQUFTLElBQUksQ0FBQyxXQUFXLDBDQUFpQyxJQUFJLFdBQVcsMkNBQWtDLENBQUMsRUFBRSxDQUFDO2dCQUN0SCxtRkFBbUY7Z0JBQ25GLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxHQUFHLGVBQWUsQ0FBQztnQkFDckUsT0FBTyxDQUFDLEdBQUcsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztnQkFDL0MsYUFBYSxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLEdBQUcsZUFBZSxDQUFDO2dCQUN0RixjQUFjLEdBQUcsV0FBVywwQ0FBaUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN4RixXQUFXLEdBQUcsUUFBUSxFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUVELElBQUksV0FBVyx1Q0FBK0IsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLFVBQVUsc0NBQThCLEVBQUUsQ0FBQztvQkFDOUMsV0FBVyxFQUFFLENBQUM7b0JBQ2QsY0FBYyxHQUFHLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3JDLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksV0FBVyx5Q0FBaUMsRUFBRSxDQUFDO2dCQUN6RCxJQUFJLFVBQVUsd0NBQWdDLEVBQUUsQ0FBQztvQkFDaEQsV0FBVyxFQUFFLENBQUM7b0JBQ2QsY0FBYyxHQUFHLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3JDLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsUUFBUSxVQUFVLEVBQUUsQ0FBQztvQkFDcEIseUNBQWlDO29CQUNqQzt3QkFDQyxXQUFXLEVBQUUsQ0FBQzt3QkFDZCxjQUFjLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQzt3QkFDcEMsTUFBTTtvQkFDUCxtQ0FBMkI7b0JBQzNCO3dCQUNDLGNBQWMsR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO3dCQUNwQyxNQUFNO29CQUNQO3dCQUNDLElBQUksU0FBUyxFQUFFLENBQUM7NEJBQ2YsY0FBYyxHQUFHLGdCQUFnQixFQUFFLENBQUM7d0JBQ3JDLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxrRkFBa0Y7NEJBQ2xGLGNBQWMsR0FBRyxHQUFHLENBQUM7d0JBQ3RCLENBQUM7d0JBQ0QsTUFBTTtvQkFDUDt3QkFDQyxjQUFjLEdBQUcsR0FBRyxDQUFDO3dCQUNyQixNQUFNO29CQUNQO3dCQUNDLElBQUksV0FBVyxrQ0FBMEIsRUFBRSxDQUFDOzRCQUMzQyxjQUFjLEdBQUcsRUFBRSxDQUFDOzRCQUNwQixNQUFNO3dCQUNQLENBQUM7b0JBQ0YsZUFBZTtvQkFDZixvQ0FBNEI7b0JBQzVCLG9DQUE0QjtvQkFDNUIscUNBQTZCO29CQUM3Qix3Q0FBK0I7b0JBQy9CLHdDQUFnQztvQkFDaEM7d0JBQ0MsSUFBSSxXQUFXLDBDQUFpQyxJQUFJLFdBQVcsMkNBQWtDLEVBQUUsQ0FBQzs0QkFDbkcsY0FBYyxHQUFHLEdBQUcsQ0FBQzt3QkFDdEIsQ0FBQzs2QkFBTSxJQUFJLFdBQVcsa0NBQTBCLElBQUksV0FBVyw0QkFBbUIsRUFBRSxDQUFDOzRCQUNwRixRQUFRLEdBQUcsSUFBSSxDQUFDO3dCQUNqQixDQUFDO3dCQUNELE1BQU07b0JBQ1A7d0JBQ0MsUUFBUSxHQUFHLElBQUksQ0FBQzt3QkFDaEIsTUFBTTtnQkFDUixDQUFDO2dCQUNELElBQUksU0FBUyxJQUFJLENBQUMsV0FBVywwQ0FBaUMsSUFBSSxXQUFXLDJDQUFrQyxDQUFDLEVBQUUsQ0FBQztvQkFDbEgsY0FBYyxHQUFHLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3JDLENBQUM7WUFFRixDQUFDO1lBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLEdBQUcsZUFBZSxDQUFDO1lBQ3BFLE9BQU8sQ0FBQyxjQUFjLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDekQsVUFBVSxHQUFHLFdBQVcsQ0FBQztRQUMxQixDQUFDO1FBQ0QsT0FBTyxjQUFjLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxHQUFRLEVBQUUsT0FBMEI7UUFDckUsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDL0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2hCLENBQUM7SUFFRCxTQUFTLE1BQU0sQ0FBQyxDQUFTLEVBQUUsS0FBYTtRQUN2QyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFDYixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxrQkFBa0IsQ0FBQyxPQUFlLEVBQUUsT0FBMEI7UUFDdEUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzNCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sRUFBRSxDQUFDO1lBQ1YsQ0FBQztpQkFBTSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxJQUFJLE9BQU8sQ0FBQztZQUNuQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTTtZQUNQLENBQUM7WUFDRCxDQUFDLEVBQUUsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxTQUFnQixNQUFNLENBQUMsT0FBMEIsRUFBRSxJQUFZO1FBQzlELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDakIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ3hELE9BQU8sTUFBTSxDQUFDO2dCQUNmLENBQUM7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO2lCQUFNLElBQUksRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN4QixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDO0lBQ3pDLENBQUM7SUFFRCxTQUFnQixLQUFLLENBQUMsSUFBWSxFQUFFLE1BQWM7UUFDakQsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNuRCxDQUFDIn0=