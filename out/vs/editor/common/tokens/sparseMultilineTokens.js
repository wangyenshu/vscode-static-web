/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/eolCounter"], function (require, exports, position_1, range_1, eolCounter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SparseLineTokens = exports.SparseMultilineTokens = void 0;
    /**
     * Represents sparse tokens over a contiguous range of lines.
     */
    class SparseMultilineTokens {
        static create(startLineNumber, tokens) {
            return new SparseMultilineTokens(startLineNumber, new SparseMultilineTokensStorage(tokens));
        }
        /**
         * (Inclusive) start line number for these tokens.
         */
        get startLineNumber() {
            return this._startLineNumber;
        }
        /**
         * (Inclusive) end line number for these tokens.
         */
        get endLineNumber() {
            return this._endLineNumber;
        }
        constructor(startLineNumber, tokens) {
            this._startLineNumber = startLineNumber;
            this._tokens = tokens;
            this._endLineNumber = this._startLineNumber + this._tokens.getMaxDeltaLine();
        }
        toString() {
            return this._tokens.toString(this._startLineNumber);
        }
        _updateEndLineNumber() {
            this._endLineNumber = this._startLineNumber + this._tokens.getMaxDeltaLine();
        }
        isEmpty() {
            return this._tokens.isEmpty();
        }
        getLineTokens(lineNumber) {
            if (this._startLineNumber <= lineNumber && lineNumber <= this._endLineNumber) {
                return this._tokens.getLineTokens(lineNumber - this._startLineNumber);
            }
            return null;
        }
        getRange() {
            const deltaRange = this._tokens.getRange();
            if (!deltaRange) {
                return deltaRange;
            }
            return new range_1.Range(this._startLineNumber + deltaRange.startLineNumber, deltaRange.startColumn, this._startLineNumber + deltaRange.endLineNumber, deltaRange.endColumn);
        }
        removeTokens(range) {
            const startLineIndex = range.startLineNumber - this._startLineNumber;
            const endLineIndex = range.endLineNumber - this._startLineNumber;
            this._startLineNumber += this._tokens.removeTokens(startLineIndex, range.startColumn - 1, endLineIndex, range.endColumn - 1);
            this._updateEndLineNumber();
        }
        split(range) {
            // split tokens to two:
            // a) all the tokens before `range`
            // b) all the tokens after `range`
            const startLineIndex = range.startLineNumber - this._startLineNumber;
            const endLineIndex = range.endLineNumber - this._startLineNumber;
            const [a, b, bDeltaLine] = this._tokens.split(startLineIndex, range.startColumn - 1, endLineIndex, range.endColumn - 1);
            return [new SparseMultilineTokens(this._startLineNumber, a), new SparseMultilineTokens(this._startLineNumber + bDeltaLine, b)];
        }
        applyEdit(range, text) {
            const [eolCount, firstLineLength, lastLineLength] = (0, eolCounter_1.countEOL)(text);
            this.acceptEdit(range, eolCount, firstLineLength, lastLineLength, text.length > 0 ? text.charCodeAt(0) : 0 /* CharCode.Null */);
        }
        acceptEdit(range, eolCount, firstLineLength, lastLineLength, firstCharCode) {
            this._acceptDeleteRange(range);
            this._acceptInsertText(new position_1.Position(range.startLineNumber, range.startColumn), eolCount, firstLineLength, lastLineLength, firstCharCode);
            this._updateEndLineNumber();
        }
        _acceptDeleteRange(range) {
            if (range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn) {
                // Nothing to delete
                return;
            }
            const firstLineIndex = range.startLineNumber - this._startLineNumber;
            const lastLineIndex = range.endLineNumber - this._startLineNumber;
            if (lastLineIndex < 0) {
                // this deletion occurs entirely before this block, so we only need to adjust line numbers
                const deletedLinesCount = lastLineIndex - firstLineIndex;
                this._startLineNumber -= deletedLinesCount;
                return;
            }
            const tokenMaxDeltaLine = this._tokens.getMaxDeltaLine();
            if (firstLineIndex >= tokenMaxDeltaLine + 1) {
                // this deletion occurs entirely after this block, so there is nothing to do
                return;
            }
            if (firstLineIndex < 0 && lastLineIndex >= tokenMaxDeltaLine + 1) {
                // this deletion completely encompasses this block
                this._startLineNumber = 0;
                this._tokens.clear();
                return;
            }
            if (firstLineIndex < 0) {
                const deletedBefore = -firstLineIndex;
                this._startLineNumber -= deletedBefore;
                this._tokens.acceptDeleteRange(range.startColumn - 1, 0, 0, lastLineIndex, range.endColumn - 1);
            }
            else {
                this._tokens.acceptDeleteRange(0, firstLineIndex, range.startColumn - 1, lastLineIndex, range.endColumn - 1);
            }
        }
        _acceptInsertText(position, eolCount, firstLineLength, lastLineLength, firstCharCode) {
            if (eolCount === 0 && firstLineLength === 0) {
                // Nothing to insert
                return;
            }
            const lineIndex = position.lineNumber - this._startLineNumber;
            if (lineIndex < 0) {
                // this insertion occurs before this block, so we only need to adjust line numbers
                this._startLineNumber += eolCount;
                return;
            }
            const tokenMaxDeltaLine = this._tokens.getMaxDeltaLine();
            if (lineIndex >= tokenMaxDeltaLine + 1) {
                // this insertion occurs after this block, so there is nothing to do
                return;
            }
            this._tokens.acceptInsertText(lineIndex, position.column - 1, eolCount, firstLineLength, lastLineLength, firstCharCode);
        }
    }
    exports.SparseMultilineTokens = SparseMultilineTokens;
    class SparseMultilineTokensStorage {
        constructor(tokens) {
            this._tokens = tokens;
            this._tokenCount = tokens.length / 4;
        }
        toString(startLineNumber) {
            const pieces = [];
            for (let i = 0; i < this._tokenCount; i++) {
                pieces.push(`(${this._getDeltaLine(i) + startLineNumber},${this._getStartCharacter(i)}-${this._getEndCharacter(i)})`);
            }
            return `[${pieces.join(',')}]`;
        }
        getMaxDeltaLine() {
            const tokenCount = this._getTokenCount();
            if (tokenCount === 0) {
                return -1;
            }
            return this._getDeltaLine(tokenCount - 1);
        }
        getRange() {
            const tokenCount = this._getTokenCount();
            if (tokenCount === 0) {
                return null;
            }
            const startChar = this._getStartCharacter(0);
            const maxDeltaLine = this._getDeltaLine(tokenCount - 1);
            const endChar = this._getEndCharacter(tokenCount - 1);
            return new range_1.Range(0, startChar + 1, maxDeltaLine, endChar + 1);
        }
        _getTokenCount() {
            return this._tokenCount;
        }
        _getDeltaLine(tokenIndex) {
            return this._tokens[4 * tokenIndex];
        }
        _getStartCharacter(tokenIndex) {
            return this._tokens[4 * tokenIndex + 1];
        }
        _getEndCharacter(tokenIndex) {
            return this._tokens[4 * tokenIndex + 2];
        }
        isEmpty() {
            return (this._getTokenCount() === 0);
        }
        getLineTokens(deltaLine) {
            let low = 0;
            let high = this._getTokenCount() - 1;
            while (low < high) {
                const mid = low + Math.floor((high - low) / 2);
                const midDeltaLine = this._getDeltaLine(mid);
                if (midDeltaLine < deltaLine) {
                    low = mid + 1;
                }
                else if (midDeltaLine > deltaLine) {
                    high = mid - 1;
                }
                else {
                    let min = mid;
                    while (min > low && this._getDeltaLine(min - 1) === deltaLine) {
                        min--;
                    }
                    let max = mid;
                    while (max < high && this._getDeltaLine(max + 1) === deltaLine) {
                        max++;
                    }
                    return new SparseLineTokens(this._tokens.subarray(4 * min, 4 * max + 4));
                }
            }
            if (this._getDeltaLine(low) === deltaLine) {
                return new SparseLineTokens(this._tokens.subarray(4 * low, 4 * low + 4));
            }
            return null;
        }
        clear() {
            this._tokenCount = 0;
        }
        removeTokens(startDeltaLine, startChar, endDeltaLine, endChar) {
            const tokens = this._tokens;
            const tokenCount = this._tokenCount;
            let newTokenCount = 0;
            let hasDeletedTokens = false;
            let firstDeltaLine = 0;
            for (let i = 0; i < tokenCount; i++) {
                const srcOffset = 4 * i;
                const tokenDeltaLine = tokens[srcOffset];
                const tokenStartCharacter = tokens[srcOffset + 1];
                const tokenEndCharacter = tokens[srcOffset + 2];
                const tokenMetadata = tokens[srcOffset + 3];
                if ((tokenDeltaLine > startDeltaLine || (tokenDeltaLine === startDeltaLine && tokenEndCharacter >= startChar))
                    && (tokenDeltaLine < endDeltaLine || (tokenDeltaLine === endDeltaLine && tokenStartCharacter <= endChar))) {
                    hasDeletedTokens = true;
                }
                else {
                    if (newTokenCount === 0) {
                        firstDeltaLine = tokenDeltaLine;
                    }
                    if (hasDeletedTokens) {
                        // must move the token to the left
                        const destOffset = 4 * newTokenCount;
                        tokens[destOffset] = tokenDeltaLine - firstDeltaLine;
                        tokens[destOffset + 1] = tokenStartCharacter;
                        tokens[destOffset + 2] = tokenEndCharacter;
                        tokens[destOffset + 3] = tokenMetadata;
                    }
                    newTokenCount++;
                }
            }
            this._tokenCount = newTokenCount;
            return firstDeltaLine;
        }
        split(startDeltaLine, startChar, endDeltaLine, endChar) {
            const tokens = this._tokens;
            const tokenCount = this._tokenCount;
            const aTokens = [];
            const bTokens = [];
            let destTokens = aTokens;
            let destOffset = 0;
            let destFirstDeltaLine = 0;
            for (let i = 0; i < tokenCount; i++) {
                const srcOffset = 4 * i;
                const tokenDeltaLine = tokens[srcOffset];
                const tokenStartCharacter = tokens[srcOffset + 1];
                const tokenEndCharacter = tokens[srcOffset + 2];
                const tokenMetadata = tokens[srcOffset + 3];
                if ((tokenDeltaLine > startDeltaLine || (tokenDeltaLine === startDeltaLine && tokenEndCharacter >= startChar))) {
                    if ((tokenDeltaLine < endDeltaLine || (tokenDeltaLine === endDeltaLine && tokenStartCharacter <= endChar))) {
                        // this token is touching the range
                        continue;
                    }
                    else {
                        // this token is after the range
                        if (destTokens !== bTokens) {
                            // this token is the first token after the range
                            destTokens = bTokens;
                            destOffset = 0;
                            destFirstDeltaLine = tokenDeltaLine;
                        }
                    }
                }
                destTokens[destOffset++] = tokenDeltaLine - destFirstDeltaLine;
                destTokens[destOffset++] = tokenStartCharacter;
                destTokens[destOffset++] = tokenEndCharacter;
                destTokens[destOffset++] = tokenMetadata;
            }
            return [new SparseMultilineTokensStorage(new Uint32Array(aTokens)), new SparseMultilineTokensStorage(new Uint32Array(bTokens)), destFirstDeltaLine];
        }
        acceptDeleteRange(horizontalShiftForFirstLineTokens, startDeltaLine, startCharacter, endDeltaLine, endCharacter) {
            // This is a bit complex, here are the cases I used to think about this:
            //
            // 1. The token starts before the deletion range
            // 1a. The token is completely before the deletion range
            //               -----------
            //                          xxxxxxxxxxx
            // 1b. The token starts before, the deletion range ends after the token
            //               -----------
            //                      xxxxxxxxxxx
            // 1c. The token starts before, the deletion range ends precisely with the token
            //               ---------------
            //                      xxxxxxxx
            // 1d. The token starts before, the deletion range is inside the token
            //               ---------------
            //                    xxxxx
            //
            // 2. The token starts at the same position with the deletion range
            // 2a. The token starts at the same position, and ends inside the deletion range
            //               -------
            //               xxxxxxxxxxx
            // 2b. The token starts at the same position, and ends at the same position as the deletion range
            //               ----------
            //               xxxxxxxxxx
            // 2c. The token starts at the same position, and ends after the deletion range
            //               -------------
            //               xxxxxxx
            //
            // 3. The token starts inside the deletion range
            // 3a. The token is inside the deletion range
            //                -------
            //             xxxxxxxxxxxxx
            // 3b. The token starts inside the deletion range, and ends at the same position as the deletion range
            //                ----------
            //             xxxxxxxxxxxxx
            // 3c. The token starts inside the deletion range, and ends after the deletion range
            //                ------------
            //             xxxxxxxxxxx
            //
            // 4. The token starts after the deletion range
            //                  -----------
            //          xxxxxxxx
            //
            const tokens = this._tokens;
            const tokenCount = this._tokenCount;
            const deletedLineCount = (endDeltaLine - startDeltaLine);
            let newTokenCount = 0;
            let hasDeletedTokens = false;
            for (let i = 0; i < tokenCount; i++) {
                const srcOffset = 4 * i;
                let tokenDeltaLine = tokens[srcOffset];
                let tokenStartCharacter = tokens[srcOffset + 1];
                let tokenEndCharacter = tokens[srcOffset + 2];
                const tokenMetadata = tokens[srcOffset + 3];
                if (tokenDeltaLine < startDeltaLine || (tokenDeltaLine === startDeltaLine && tokenEndCharacter <= startCharacter)) {
                    // 1a. The token is completely before the deletion range
                    // => nothing to do
                    newTokenCount++;
                    continue;
                }
                else if (tokenDeltaLine === startDeltaLine && tokenStartCharacter < startCharacter) {
                    // 1b, 1c, 1d
                    // => the token survives, but it needs to shrink
                    if (tokenDeltaLine === endDeltaLine && tokenEndCharacter > endCharacter) {
                        // 1d. The token starts before, the deletion range is inside the token
                        // => the token shrinks by the deletion character count
                        tokenEndCharacter -= (endCharacter - startCharacter);
                    }
                    else {
                        // 1b. The token starts before, the deletion range ends after the token
                        // 1c. The token starts before, the deletion range ends precisely with the token
                        // => the token shrinks its ending to the deletion start
                        tokenEndCharacter = startCharacter;
                    }
                }
                else if (tokenDeltaLine === startDeltaLine && tokenStartCharacter === startCharacter) {
                    // 2a, 2b, 2c
                    if (tokenDeltaLine === endDeltaLine && tokenEndCharacter > endCharacter) {
                        // 2c. The token starts at the same position, and ends after the deletion range
                        // => the token shrinks by the deletion character count
                        tokenEndCharacter -= (endCharacter - startCharacter);
                    }
                    else {
                        // 2a. The token starts at the same position, and ends inside the deletion range
                        // 2b. The token starts at the same position, and ends at the same position as the deletion range
                        // => the token is deleted
                        hasDeletedTokens = true;
                        continue;
                    }
                }
                else if (tokenDeltaLine < endDeltaLine || (tokenDeltaLine === endDeltaLine && tokenStartCharacter < endCharacter)) {
                    // 3a, 3b, 3c
                    if (tokenDeltaLine === endDeltaLine && tokenEndCharacter > endCharacter) {
                        // 3c. The token starts inside the deletion range, and ends after the deletion range
                        // => the token moves to continue right after the deletion
                        tokenDeltaLine = startDeltaLine;
                        tokenStartCharacter = startCharacter;
                        tokenEndCharacter = tokenStartCharacter + (tokenEndCharacter - endCharacter);
                    }
                    else {
                        // 3a. The token is inside the deletion range
                        // 3b. The token starts inside the deletion range, and ends at the same position as the deletion range
                        // => the token is deleted
                        hasDeletedTokens = true;
                        continue;
                    }
                }
                else if (tokenDeltaLine > endDeltaLine) {
                    // 4. (partial) The token starts after the deletion range, on a line below...
                    if (deletedLineCount === 0 && !hasDeletedTokens) {
                        // early stop, there is no need to walk all the tokens and do nothing...
                        newTokenCount = tokenCount;
                        break;
                    }
                    tokenDeltaLine -= deletedLineCount;
                }
                else if (tokenDeltaLine === endDeltaLine && tokenStartCharacter >= endCharacter) {
                    // 4. (continued) The token starts after the deletion range, on the last line where a deletion occurs
                    if (horizontalShiftForFirstLineTokens && tokenDeltaLine === 0) {
                        tokenStartCharacter += horizontalShiftForFirstLineTokens;
                        tokenEndCharacter += horizontalShiftForFirstLineTokens;
                    }
                    tokenDeltaLine -= deletedLineCount;
                    tokenStartCharacter -= (endCharacter - startCharacter);
                    tokenEndCharacter -= (endCharacter - startCharacter);
                }
                else {
                    throw new Error(`Not possible!`);
                }
                const destOffset = 4 * newTokenCount;
                tokens[destOffset] = tokenDeltaLine;
                tokens[destOffset + 1] = tokenStartCharacter;
                tokens[destOffset + 2] = tokenEndCharacter;
                tokens[destOffset + 3] = tokenMetadata;
                newTokenCount++;
            }
            this._tokenCount = newTokenCount;
        }
        acceptInsertText(deltaLine, character, eolCount, firstLineLength, lastLineLength, firstCharCode) {
            // Here are the cases I used to think about this:
            //
            // 1. The token is completely before the insertion point
            //            -----------   |
            // 2. The token ends precisely at the insertion point
            //            -----------|
            // 3. The token contains the insertion point
            //            -----|------
            // 4. The token starts precisely at the insertion point
            //            |-----------
            // 5. The token is completely after the insertion point
            //            |   -----------
            //
            const isInsertingPreciselyOneWordCharacter = (eolCount === 0
                && firstLineLength === 1
                && ((firstCharCode >= 48 /* CharCode.Digit0 */ && firstCharCode <= 57 /* CharCode.Digit9 */)
                    || (firstCharCode >= 65 /* CharCode.A */ && firstCharCode <= 90 /* CharCode.Z */)
                    || (firstCharCode >= 97 /* CharCode.a */ && firstCharCode <= 122 /* CharCode.z */)));
            const tokens = this._tokens;
            const tokenCount = this._tokenCount;
            for (let i = 0; i < tokenCount; i++) {
                const offset = 4 * i;
                let tokenDeltaLine = tokens[offset];
                let tokenStartCharacter = tokens[offset + 1];
                let tokenEndCharacter = tokens[offset + 2];
                if (tokenDeltaLine < deltaLine || (tokenDeltaLine === deltaLine && tokenEndCharacter < character)) {
                    // 1. The token is completely before the insertion point
                    // => nothing to do
                    continue;
                }
                else if (tokenDeltaLine === deltaLine && tokenEndCharacter === character) {
                    // 2. The token ends precisely at the insertion point
                    // => expand the end character only if inserting precisely one character that is a word character
                    if (isInsertingPreciselyOneWordCharacter) {
                        tokenEndCharacter += 1;
                    }
                    else {
                        continue;
                    }
                }
                else if (tokenDeltaLine === deltaLine && tokenStartCharacter < character && character < tokenEndCharacter) {
                    // 3. The token contains the insertion point
                    if (eolCount === 0) {
                        // => just expand the end character
                        tokenEndCharacter += firstLineLength;
                    }
                    else {
                        // => cut off the token
                        tokenEndCharacter = character;
                    }
                }
                else {
                    // 4. or 5.
                    if (tokenDeltaLine === deltaLine && tokenStartCharacter === character) {
                        // 4. The token starts precisely at the insertion point
                        // => grow the token (by keeping its start constant) only if inserting precisely one character that is a word character
                        // => otherwise behave as in case 5.
                        if (isInsertingPreciselyOneWordCharacter) {
                            continue;
                        }
                    }
                    // => the token must move and keep its size constant
                    if (tokenDeltaLine === deltaLine) {
                        tokenDeltaLine += eolCount;
                        // this token is on the line where the insertion is taking place
                        if (eolCount === 0) {
                            tokenStartCharacter += firstLineLength;
                            tokenEndCharacter += firstLineLength;
                        }
                        else {
                            const tokenLength = tokenEndCharacter - tokenStartCharacter;
                            tokenStartCharacter = lastLineLength + (tokenStartCharacter - character);
                            tokenEndCharacter = tokenStartCharacter + tokenLength;
                        }
                    }
                    else {
                        tokenDeltaLine += eolCount;
                    }
                }
                tokens[offset] = tokenDeltaLine;
                tokens[offset + 1] = tokenStartCharacter;
                tokens[offset + 2] = tokenEndCharacter;
            }
        }
    }
    class SparseLineTokens {
        constructor(tokens) {
            this._tokens = tokens;
        }
        getCount() {
            return this._tokens.length / 4;
        }
        getStartCharacter(tokenIndex) {
            return this._tokens[4 * tokenIndex + 1];
        }
        getEndCharacter(tokenIndex) {
            return this._tokens[4 * tokenIndex + 2];
        }
        getMetadata(tokenIndex) {
            return this._tokens[4 * tokenIndex + 3];
        }
    }
    exports.SparseLineTokens = SparseLineTokens;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BhcnNlTXVsdGlsaW5lVG9rZW5zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi90b2tlbnMvc3BhcnNlTXVsdGlsaW5lVG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRzs7T0FFRztJQUNILE1BQWEscUJBQXFCO1FBRTFCLE1BQU0sQ0FBQyxNQUFNLENBQUMsZUFBdUIsRUFBRSxNQUFtQjtZQUNoRSxPQUFPLElBQUkscUJBQXFCLENBQUMsZUFBZSxFQUFFLElBQUksNEJBQTRCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM3RixDQUFDO1FBTUQ7O1dBRUc7UUFDSCxJQUFXLGVBQWU7WUFDekIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFDOUIsQ0FBQztRQUVEOztXQUVHO1FBQ0gsSUFBVyxhQUFhO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUM1QixDQUFDO1FBRUQsWUFBb0IsZUFBdUIsRUFBRSxNQUFvQztZQUNoRixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDOUUsQ0FBQztRQUVNLFFBQVE7WUFDZCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFTyxvQkFBb0I7WUFDM0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FB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