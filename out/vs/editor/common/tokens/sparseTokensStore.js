/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/tokens/lineTokens"], function (require, exports, arrays, lineTokens_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SparseTokensStore = void 0;
    /**
     * Represents sparse tokens in a text model.
     */
    class SparseTokensStore {
        constructor(languageIdCodec) {
            this._pieces = [];
            this._isComplete = false;
            this._languageIdCodec = languageIdCodec;
        }
        flush() {
            this._pieces = [];
            this._isComplete = false;
        }
        isEmpty() {
            return (this._pieces.length === 0);
        }
        set(pieces, isComplete) {
            this._pieces = pieces || [];
            this._isComplete = isComplete;
        }
        setPartial(_range, pieces) {
            // console.log(`setPartial ${_range} ${pieces.map(p => p.toString()).join(', ')}`);
            let range = _range;
            if (pieces.length > 0) {
                const _firstRange = pieces[0].getRange();
                const _lastRange = pieces[pieces.length - 1].getRange();
                if (!_firstRange || !_lastRange) {
                    return _range;
                }
                range = _range.plusRange(_firstRange).plusRange(_lastRange);
            }
            let insertPosition = null;
            for (let i = 0, len = this._pieces.length; i < len; i++) {
                const piece = this._pieces[i];
                if (piece.endLineNumber < range.startLineNumber) {
                    // this piece is before the range
                    continue;
                }
                if (piece.startLineNumber > range.endLineNumber) {
                    // this piece is after the range, so mark the spot before this piece
                    // as a good insertion position and stop looping
                    insertPosition = insertPosition || { index: i };
                    break;
                }
                // this piece might intersect with the range
                piece.removeTokens(range);
                if (piece.isEmpty()) {
                    // remove the piece if it became empty
                    this._pieces.splice(i, 1);
                    i--;
                    len--;
                    continue;
                }
                if (piece.endLineNumber < range.startLineNumber) {
                    // after removal, this piece is before the range
                    continue;
                }
                if (piece.startLineNumber > range.endLineNumber) {
                    // after removal, this piece is after the range
                    insertPosition = insertPosition || { index: i };
                    continue;
                }
                // after removal, this piece contains the range
                const [a, b] = piece.split(range);
                if (a.isEmpty()) {
                    // this piece is actually after the range
                    insertPosition = insertPosition || { index: i };
                    continue;
                }
                if (b.isEmpty()) {
                    // this piece is actually before the range
                    continue;
                }
                this._pieces.splice(i, 1, a, b);
                i++;
                len++;
                insertPosition = insertPosition || { index: i };
            }
            insertPosition = insertPosition || { index: this._pieces.length };
            if (pieces.length > 0) {
                this._pieces = arrays.arrayInsert(this._pieces, insertPosition.index, pieces);
            }
            // console.log(`I HAVE ${this._pieces.length} pieces`);
            // console.log(`${this._pieces.map(p => p.toString()).join('\n')}`);
            return range;
        }
        isComplete() {
            return this._isComplete;
        }
        addSparseTokens(lineNumber, aTokens) {
            if (aTokens.getLineContent().length === 0) {
                // Don't do anything for empty lines
                return aTokens;
            }
            const pieces = this._pieces;
            if (pieces.length === 0) {
                return aTokens;
            }
            const pieceIndex = SparseTokensStore._findFirstPieceWithLine(pieces, lineNumber);
            const bTokens = pieces[pieceIndex].getLineTokens(lineNumber);
            if (!bTokens) {
                return aTokens;
            }
            const aLen = aTokens.getCount();
            const bLen = bTokens.getCount();
            let aIndex = 0;
            const result = [];
            let resultLen = 0;
            let lastEndOffset = 0;
            const emitToken = (endOffset, metadata) => {
                if (endOffset === lastEndOffset) {
                    return;
                }
                lastEndOffset = endOffset;
                result[resultLen++] = endOffset;
                result[resultLen++] = metadata;
            };
            for (let bIndex = 0; bIndex < bLen; bIndex++) {
                const bStartCharacter = bTokens.getStartCharacter(bIndex);
                const bEndCharacter = bTokens.getEndCharacter(bIndex);
                const bMetadata = bTokens.getMetadata(bIndex);
                const bMask = (((bMetadata & 1 /* MetadataConsts.SEMANTIC_USE_ITALIC */) ? 2048 /* MetadataConsts.ITALIC_MASK */ : 0)
                    | ((bMetadata & 2 /* MetadataConsts.SEMANTIC_USE_BOLD */) ? 4096 /* MetadataConsts.BOLD_MASK */ : 0)
                    | ((bMetadata & 4 /* MetadataConsts.SEMANTIC_USE_UNDERLINE */) ? 8192 /* MetadataConsts.UNDERLINE_MASK */ : 0)
                    | ((bMetadata & 8 /* MetadataConsts.SEMANTIC_USE_STRIKETHROUGH */) ? 16384 /* MetadataConsts.STRIKETHROUGH_MASK */ : 0)
                    | ((bMetadata & 16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */) ? 16744448 /* MetadataConsts.FOREGROUND_MASK */ : 0)
                    | ((bMetadata & 32 /* MetadataConsts.SEMANTIC_USE_BACKGROUND */) ? 4278190080 /* MetadataConsts.BACKGROUND_MASK */ : 0)) >>> 0;
                const aMask = (~bMask) >>> 0;
                // push any token from `a` that is before `b`
                while (aIndex < aLen && aTokens.getEndOffset(aIndex) <= bStartCharacter) {
                    emitToken(aTokens.getEndOffset(aIndex), aTokens.getMetadata(aIndex));
                    aIndex++;
                }
                // push the token from `a` if it intersects the token from `b`
                if (aIndex < aLen && aTokens.getStartOffset(aIndex) < bStartCharacter) {
                    emitToken(bStartCharacter, aTokens.getMetadata(aIndex));
                }
                // skip any tokens from `a` that are contained inside `b`
                while (aIndex < aLen && aTokens.getEndOffset(aIndex) < bEndCharacter) {
                    emitToken(aTokens.getEndOffset(aIndex), (aTokens.getMetadata(aIndex) & aMask) | (bMetadata & bMask));
                    aIndex++;
                }
                if (aIndex < aLen) {
                    emitToken(bEndCharacter, (aTokens.getMetadata(aIndex) & aMask) | (bMetadata & bMask));
                    if (aTokens.getEndOffset(aIndex) === bEndCharacter) {
                        // `a` ends exactly at the same spot as `b`!
                        aIndex++;
                    }
                }
                else {
                    const aMergeIndex = Math.min(Math.max(0, aIndex - 1), aLen - 1);
                    // push the token from `b`
                    emitToken(bEndCharacter, (aTokens.getMetadata(aMergeIndex) & aMask) | (bMetadata & bMask));
                }
            }
            // push the remaining tokens from `a`
            while (aIndex < aLen) {
                emitToken(aTokens.getEndOffset(aIndex), aTokens.getMetadata(aIndex));
                aIndex++;
            }
            return new lineTokens_1.LineTokens(new Uint32Array(result), aTokens.getLineContent(), this._languageIdCodec);
        }
        static _findFirstPieceWithLine(pieces, lineNumber) {
            let low = 0;
            let high = pieces.length - 1;
            while (low < high) {
                let mid = low + Math.floor((high - low) / 2);
                if (pieces[mid].endLineNumber < lineNumber) {
                    low = mid + 1;
                }
                else if (pieces[mid].startLineNumber > lineNumber) {
                    high = mid - 1;
                }
                else {
                    while (mid > low && pieces[mid - 1].startLineNumber <= lineNumber && lineNumber <= pieces[mid - 1].endLineNumber) {
                        mid--;
                    }
                    return mid;
                }
            }
            return low;
        }
        acceptEdit(range, eolCount, firstLineLength, lastLineLength, firstCharCode) {
            for (const piece of this._pieces) {
                piece.acceptEdit(range, eolCount, firstLineLength, lastLineLength, firstCharCode);
            }
        }
    }
    exports.SparseTokensStore = SparseTokensStore;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BhcnNlVG9rZW5zU3RvcmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3Rva2Vucy9zcGFyc2VUb2tlbnNTdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEc7O09BRUc7SUFDSCxNQUFhLGlCQUFpQjtRQU03QixZQUFZLGVBQWlDO1lBQzVDLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7UUFDekMsQ0FBQztRQUVNLEtBQUs7WUFDWCxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUMxQixDQUFDO1FBRU0sT0FBTztZQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRU0sR0FBRyxDQUFDLE1BQXNDLEVBQUUsVUFBbUI7WUFDckUsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLElBQUksRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQy9CLENBQUM7UUFFTSxVQUFVLENBQUMsTUFBYSxFQUFFLE1BQStCO1lBQy9ELG1GQUFtRjtZQUVuRixJQUFJLEtBQUssR0FBRyxNQUFNLENBQUM7WUFDbkIsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN2QixNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxN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