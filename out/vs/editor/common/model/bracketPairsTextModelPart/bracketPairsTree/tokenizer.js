/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/editor/common/encodedTokenAttributes", "./ast", "./length", "./smallImmutableSet"], function (require, exports, errors_1, encodedTokenAttributes_1, ast_1, length_1, smallImmutableSet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FastTokenizer = exports.TextBufferTokenizer = exports.Token = exports.TokenKind = void 0;
    var TokenKind;
    (function (TokenKind) {
        TokenKind[TokenKind["Text"] = 0] = "Text";
        TokenKind[TokenKind["OpeningBracket"] = 1] = "OpeningBracket";
        TokenKind[TokenKind["ClosingBracket"] = 2] = "ClosingBracket";
    })(TokenKind || (exports.TokenKind = TokenKind = {}));
    class Token {
        constructor(length, kind, 
        /**
         * If this token is an opening bracket, this is the id of the opening bracket.
         * If this token is a closing bracket, this is the id of the first opening bracket that is closed by this bracket.
         * Otherwise, it is -1.
         */
        bracketId, 
        /**
         * If this token is an opening bracket, this just contains `bracketId`.
         * If this token is a closing bracket, this lists all opening bracket ids, that it closes.
         * Otherwise, it is empty.
         */
        bracketIds, astNode) {
            this.length = length;
            this.kind = kind;
            this.bracketId = bracketId;
            this.bracketIds = bracketIds;
            this.astNode = astNode;
        }
    }
    exports.Token = Token;
    class TextBufferTokenizer {
        constructor(textModel, bracketTokens) {
            this.textModel = textModel;
            this.bracketTokens = bracketTokens;
            this.reader = new NonPeekableTextBufferTokenizer(this.textModel, this.bracketTokens);
            this._offset = length_1.lengthZero;
            this.didPeek = false;
            this.peeked = null;
            this.textBufferLineCount = textModel.getLineCount();
            this.textBufferLastLineLength = textModel.getLineLength(this.textBufferLineCount);
        }
        get offset() {
            return this._offset;
        }
        get length() {
            return (0, length_1.toLength)(this.textBufferLineCount - 1, this.textBufferLastLineLength);
        }
        getText() {
            return this.textModel.getValue();
        }
        skip(length) {
            this.didPeek = false;
            this._offset = (0, length_1.lengthAdd)(this._offset, length);
            const obj = (0, length_1.lengthToObj)(this._offset);
            this.reader.setPosition(obj.lineCount, obj.columnCount);
        }
        read() {
            let token;
            if (this.peeked) {
                this.didPeek = false;
                token = this.peeked;
            }
            else {
                token = this.reader.read();
            }
            if (token) {
                this._offset = (0, length_1.lengthAdd)(this._offset, token.length);
            }
            return token;
        }
        peek() {
            if (!this.didPeek) {
                this.peeked = this.reader.read();
                this.didPeek = true;
            }
            return this.peeked;
        }
    }
    exports.TextBufferTokenizer = TextBufferTokenizer;
    /**
     * Does not support peek.
    */
    class NonPeekableTextBufferTokenizer {
        constructor(textModel, bracketTokens) {
            this.textModel = textModel;
            this.bracketTokens = bracketTokens;
            this.lineIdx = 0;
            this.line = null;
            this.lineCharOffset = 0;
            this.lineTokens = null;
            this.lineTokenOffset = 0;
            /** Must be a zero line token. The end of the document cannot be peeked. */
            this.peekedToken = null;
            this.textBufferLineCount = textModel.getLineCount();
            this.textBufferLastLineLength = textModel.getLineLength(this.textBufferLineCount);
        }
        setPosition(lineIdx, column) {
            // We must not jump into a token!
            if (lineIdx === this.lineIdx) {
                this.lineCharOffset = column;
                if (this.line !== null) {
                    this.lineTokenOffset = this.lineCharOffset === 0 ? 0 : this.lineTokens.findTokenIndexAtOffset(this.lineCharOffset);
                }
            }
            else {
                this.lineIdx = lineIdx;
                this.lineCharOffset = column;
                this.line = null;
            }
            this.peekedToken = null;
        }
        read() {
            if (this.peekedToken) {
                const token = this.peekedToken;
                this.peekedToken = null;
                this.lineCharOffset += (0, length_1.lengthGetColumnCountIfZeroLineCount)(token.length);
                return token;
            }
            if (this.lineIdx > this.textBufferLineCount - 1 || (this.lineIdx === this.textBufferLineCount - 1 && this.lineCharOffset >= this.textBufferLastLineLength)) {
                // We are after the end
                return null;
            }
            if (this.line === null) {
                this.lineTokens = this.textModel.tokenization.getLineTokens(this.lineIdx + 1);
                this.line = this.lineTokens.getLineContent();
                this.lineTokenOffset = this.lineCharOffset === 0 ? 0 : this.lineTokens.findTokenIndexAtOffset(this.lineCharOffset);
            }
            const startLineIdx = this.lineIdx;
            const startLineCharOffset = this.lineCharOffset;
            // limits the length of text tokens.
            // If text tokens get too long, incremental updates will be slow
            let lengthHeuristic = 0;
            while (true) {
                const lineTokens = this.lineTokens;
                const tokenCount = lineTokens.getCount();
                let peekedBracketToken = null;
                if (this.lineTokenOffset < tokenCount) {
                    const tokenMetadata = lineTokens.getMetadata(this.lineTokenOffset);
                    while (this.lineTokenOffset + 1 < tokenCount && tokenMetadata === lineTokens.getMetadata(this.lineTokenOffset + 1)) {
                        // Skip tokens that are identical.
                        // Sometimes, (bracket) identifiers are split up into multiple tokens.
                        this.lineTokenOffset++;
                    }
                    const isOther = encodedTokenAttributes_1.TokenMetadata.getTokenType(tokenMetadata) === 0 /* StandardTokenType.Other */;
                    const containsBracketType = encodedTokenAttributes_1.TokenMetadata.containsBalancedBrackets(tokenMetadata);
                    const endOffset = lineTokens.getEndOffset(this.lineTokenOffset);
                    // Is there a bracket token next? Only consume text.
                    if (containsBracketType && isOther && this.lineCharOffset < endOffset) {
                        const languageId = lineTokens.getLanguageId(this.lineTokenOffset);
                        const text = this.line.substring(this.lineCharOffset, endOffset);
                        const brackets = this.bracketTokens.getSingleLanguageBracketTokens(languageId);
                        const regexp = brackets.regExpGlobal;
                        if (regexp) {
                            regexp.lastIndex = 0;
                            const match = regexp.exec(text);
                            if (match) {
                                peekedBracketToken = brackets.getToken(match[0]);
                                if (peekedBracketToken) {
                                    // Consume leading text of the token
                                    this.lineCharOffset += match.index;
                                }
                            }
                        }
                    }
                    lengthHeuristic += endOffset - this.lineCharOffset;
                    if (peekedBracketToken) {
                        // Don't skip the entire token, as a single token could contain multiple brackets.
                        if (startLineIdx !== this.lineIdx || startLineCharOffset !== this.lineCharOffset) {
                            // There is text before the bracket
                            this.peekedToken = peekedBracketToken;
                            break;
                        }
                        else {
                            // Consume the peeked token
                            this.lineCharOffset += (0, length_1.lengthGetColumnCountIfZeroLineCount)(peekedBracketToken.length);
                            return peekedBracketToken;
                        }
                    }
                    else {
                        // Skip the entire token, as the token contains no brackets at all.
                        this.lineTokenOffset++;
                        this.lineCharOffset = endOffset;
                    }
                }
                else {
                    if (this.lineIdx === this.textBufferLineCount - 1) {
                        break;
                    }
                    this.lineIdx++;
                    this.lineTokens = this.textModel.tokenization.getLineTokens(this.lineIdx + 1);
                    this.lineTokenOffset = 0;
                    this.line = this.lineTokens.getLineContent();
                    this.lineCharOffset = 0;
                    lengthHeuristic += 33; // max 1000/33 = 30 lines
                    // This limits the amount of work to recompute min-indentation
                    if (lengthHeuristic > 1000) {
                        // only break (automatically) at the end of line.
                        break;
                    }
                }
                if (lengthHeuristic > 1500) {
                    // Eventually break regardless of the line length so that
                    // very long lines do not cause bad performance.
                    // This effective limits max indentation to 500, as
                    // indentation is not computed across multiple text nodes.
                    break;
                }
            }
            // If a token contains some proper indentation, it also contains \n{INDENTATION+}(?!{INDENTATION}),
            // unless the line is too long.
            // Thus, the min indentation of the document is the minimum min indentation of every text node.
            const length = (0, length_1.lengthDiff)(startLineIdx, startLineCharOffset, this.lineIdx, this.lineCharOffset);
            return new Token(length, 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode(length));
        }
    }
    class FastTokenizer {
        constructor(text, brackets) {
            this.text = text;
            this._offset = length_1.lengthZero;
            this.idx = 0;
            const regExpStr = brackets.getRegExpStr();
            const regexp = regExpStr ? new RegExp(regExpStr + '|\n', 'gi') : null;
            const tokens = [];
            let match;
            let curLineCount = 0;
            let lastLineBreakOffset = 0;
            let lastTokenEndOffset = 0;
            let lastTokenEndLine = 0;
            const smallTextTokens0Line = [];
            for (let i = 0; i < 60; i++) {
                smallTextTokens0Line.push(new Token((0, length_1.toLength)(0, i), 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode((0, length_1.toLength)(0, i))));
            }
            const smallTextTokens1Line = [];
            for (let i = 0; i < 60; i++) {
                smallTextTokens1Line.push(new Token((0, length_1.toLength)(1, i), 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode((0, length_1.toLength)(1, i))));
            }
            if (regexp) {
                regexp.lastIndex = 0;
                // If a token contains indentation, it also contains \n{INDENTATION+}(?!{INDENTATION})
                while ((match = regexp.exec(text)) !== null) {
                    const curOffset = match.index;
                    const value = match[0];
                    if (value === '\n') {
                        curLineCount++;
                        lastLineBreakOffset = curOffset + 1;
                    }
                    else {
                        if (lastTokenEndOffset !== curOffset) {
                            let token;
                            if (lastTokenEndLine === curLineCount) {
                                const colCount = curOffset - lastTokenEndOffset;
                                if (colCount < smallTextTokens0Line.length) {
                                    token = smallTextTokens0Line[colCount];
                                }
                                else {
                                    const length = (0, length_1.toLength)(0, colCount);
                                    token = new Token(length, 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode(length));
                                }
                            }
                            else {
                                const lineCount = curLineCount - lastTokenEndLine;
                                const colCount = curOffset - lastLineBreakOffset;
                                if (lineCount === 1 && colCount < smallTextTokens1Line.length) {
                                    token = smallTextTokens1Line[colCount];
                                }
                                else {
                                    const length = (0, length_1.toLength)(lineCount, colCount);
                                    token = new Token(length, 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode(length));
                                }
                            }
                            tokens.push(token);
                        }
                        // value is matched by regexp, so the token must exist
                        tokens.push(brackets.getToken(value));
                        lastTokenEndOffset = curOffset + value.length;
                        lastTokenEndLine = curLineCount;
                    }
                }
            }
            const offset = text.length;
            if (lastTokenEndOffset !== offset) {
                const length = (lastTokenEndLine === curLineCount)
                    ? (0, length_1.toLength)(0, offset - lastTokenEndOffset)
                    : (0, length_1.toLength)(curLineCount - lastTokenEndLine, offset - lastLineBreakOffset);
                tokens.push(new Token(length, 0 /* TokenKind.Text */, -1, smallImmutableSet_1.SmallImmutableSet.getEmpty(), new ast_1.TextAstNode(length)));
            }
            this.length = (0, length_1.toLength)(curLineCount, offset - lastLineBreakOffset);
            this.tokens = tokens;
        }
        get offset() {
            return this._offset;
        }
        read() {
            return this.tokens[this.idx++] || null;
        }
        peek() {
            return this.tokens[this.idx] || null;
        }
        skip(length) {
            throw new errors_1.NotSupportedError();
        }
        getText() {
            return this.text;
        }
    }
    exports.FastTokenizer = FastTokenizer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9icmFja2V0UGFpcnNUZXh0TW9kZWxQYXJ0L2JyYWNrZXRQYWlyc1RyZWUvdG9rZW5pemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFCaEcsSUFBa0IsU0FJakI7SUFKRCxXQUFrQixTQUFTO1FBQzFCLHlDQUFRLENBQUE7UUFDUiw2REFBa0IsQ0FBQTtRQUNsQiw2REFBa0IsQ0FBQTtJQUNuQixDQUFDLEVBSmlCLFNBQVMseUJBQVQsU0FBUyxRQUkxQjtJQUlELE1BQWEsS0FBSztRQUNqQixZQUNVLE1BQWMsRUFDZCxJQUFlO1FBQ3hCOzs7O1dBSUc7UUFDTSxTQUEyQjtRQUNwQzs7OztXQUlHO1FBQ00sVUFBK0MsRUFDL0MsT0FBaUQ7WUFkakQsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUNkLFNBQUksR0FBSixJQUFJLENBQVc7WUFNZixjQUFTLEdBQVQsU0FBUyxDQUFrQjtZQU0zQixlQUFVLEdBQVYsVUFBVSxDQUFxQztZQUMvQyxZQUFPLEdBQVAsT0FBTyxDQUEwQztRQUN2RCxDQUFDO0tBQ0w7SUFsQkQsc0JBa0JDO0lBWUQsTUFBYSxtQkFBbUI7UUFNL0IsWUFDa0IsU0FBMkIsRUFDM0IsYUFBNEM7WUFENUMsY0FBUyxHQUFULFNBQVMsQ0FBa0I7WUFDM0Isa0JBQWEsR0FBYixhQUFhLENBQStCO1lBSjdDLFdBQU0sR0FBRyxJQUFJLDhCQUE4QixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBVXpGLFlBQU8sR0FBVyxtQkFBVSxDQUFDO1lBcUI3QixZQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ2hCLFdBQU0sR0FBaUIsSUFBSSxDQUFDO1lBMUJu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