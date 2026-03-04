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
define(["require", "exports", "vs/editor/common/encodedTokenAttributes", "vs/platform/theme/common/themeService", "vs/platform/log/common/log", "vs/editor/common/tokens/sparseMultilineTokens", "vs/editor/common/languages/language"], function (require, exports, encodedTokenAttributes_1, themeService_1, log_1, sparseMultilineTokens_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SemanticTokensProviderStyling = void 0;
    exports.toMultilineTokens2 = toMultilineTokens2;
    var SemanticTokensProviderStylingConstants;
    (function (SemanticTokensProviderStylingConstants) {
        SemanticTokensProviderStylingConstants[SemanticTokensProviderStylingConstants["NO_STYLING"] = 2147483647] = "NO_STYLING";
    })(SemanticTokensProviderStylingConstants || (SemanticTokensProviderStylingConstants = {}));
    let SemanticTokensProviderStyling = class SemanticTokensProviderStyling {
        constructor(_legend, _themeService, _languageService, _logService) {
            this._legend = _legend;
            this._themeService = _themeService;
            this._languageService = _languageService;
            this._logService = _logService;
            this._hasWarnedOverlappingTokens = false;
            this._hasWarnedInvalidLengthTokens = false;
            this._hasWarnedInvalidEditStart = false;
            this._hashTable = new HashTable();
        }
        getMetadata(tokenTypeIndex, tokenModifierSet, languageId) {
            const encodedLanguageId = this._languageService.languageIdCodec.encodeLanguageId(languageId);
            const entry = this._hashTable.get(tokenTypeIndex, tokenModifierSet, encodedLanguageId);
            let metadata;
            if (entry) {
                metadata = entry.metadata;
                if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                    this._logService.trace(`SemanticTokensProviderStyling [CACHED] ${tokenTypeIndex} / ${tokenModifierSet}: foreground ${encodedTokenAttributes_1.TokenMetadata.getForeground(metadata)}, fontStyle ${encodedTokenAttributes_1.TokenMetadata.getFontStyle(metadata).toString(2)}`);
                }
            }
            else {
                let tokenType = this._legend.tokenTypes[tokenTypeIndex];
                const tokenModifiers = [];
                if (tokenType) {
                    let modifierSet = tokenModifierSet;
                    for (let modifierIndex = 0; modifierSet > 0 && modifierIndex < this._legend.tokenModifiers.length; modifierIndex++) {
                        if (modifierSet & 1) {
                            tokenModifiers.push(this._legend.tokenModifiers[modifierIndex]);
                        }
                        modifierSet = modifierSet >> 1;
                    }
                    if (modifierSet > 0 && this._logService.getLevel() === log_1.LogLevel.Trace) {
                        this._logService.trace(`SemanticTokensProviderStyling: unknown token modifier index: ${tokenModifierSet.toString(2)} for legend: ${JSON.stringify(this._legend.tokenModifiers)}`);
                        tokenModifiers.push('not-in-legend');
                    }
                    const tokenStyle = this._themeService.getColorTheme().getTokenStyleMetadata(tokenType, tokenModifiers, languageId);
                    if (typeof tokenStyle === 'undefined') {
                        metadata = 2147483647 /* SemanticTokensProviderStylingConstants.NO_STYLING */;
                    }
                    else {
                        metadata = 0;
                        if (typeof tokenStyle.italic !== 'undefined') {
                            const italicBit = (tokenStyle.italic ? 1 /* FontStyle.Italic */ : 0) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */;
                            metadata |= italicBit | 1 /* MetadataConsts.SEMANTIC_USE_ITALIC */;
                        }
                        if (typeof tokenStyle.bold !== 'undefined') {
                            const boldBit = (tokenStyle.bold ? 2 /* FontStyle.Bold */ : 0) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */;
                            metadata |= boldBit | 2 /* MetadataConsts.SEMANTIC_USE_BOLD */;
                        }
                        if (typeof tokenStyle.underline !== 'undefined') {
                            const underlineBit = (tokenStyle.underline ? 4 /* FontStyle.Underline */ : 0) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */;
                            metadata |= underlineBit | 4 /* MetadataConsts.SEMANTIC_USE_UNDERLINE */;
                        }
                        if (typeof tokenStyle.strikethrough !== 'undefined') {
                            const strikethroughBit = (tokenStyle.strikethrough ? 8 /* FontStyle.Strikethrough */ : 0) << 11 /* MetadataConsts.FONT_STYLE_OFFSET */;
                            metadata |= strikethroughBit | 8 /* MetadataConsts.SEMANTIC_USE_STRIKETHROUGH */;
                        }
                        if (tokenStyle.foreground) {
                            const foregroundBits = (tokenStyle.foreground) << 15 /* MetadataConsts.FOREGROUND_OFFSET */;
                            metadata |= foregroundBits | 16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */;
                        }
                        if (metadata === 0) {
                            // Nothing!
                            metadata = 2147483647 /* SemanticTokensProviderStylingConstants.NO_STYLING */;
                        }
                    }
                }
                else {
                    if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                        this._logService.trace(`SemanticTokensProviderStyling: unknown token type index: ${tokenTypeIndex} for legend: ${JSON.stringify(this._legend.tokenTypes)}`);
                    }
                    metadata = 2147483647 /* SemanticTokensProviderStylingConstants.NO_STYLING */;
                    tokenType = 'not-in-legend';
                }
                this._hashTable.add(tokenTypeIndex, tokenModifierSet, encodedLanguageId, metadata);
                if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                    this._logService.trace(`SemanticTokensProviderStyling ${tokenTypeIndex} (${tokenType}) / ${tokenModifierSet} (${tokenModifiers.join(' ')}): foreground ${encodedTokenAttributes_1.TokenMetadata.getForeground(metadata)}, fontStyle ${encodedTokenAttributes_1.TokenMetadata.getFontStyle(metadata).toString(2)}`);
                }
            }
            return metadata;
        }
        warnOverlappingSemanticTokens(lineNumber, startColumn) {
            if (!this._hasWarnedOverlappingTokens) {
                this._hasWarnedOverlappingTokens = true;
                this._logService.warn(`Overlapping semantic tokens detected at lineNumber ${lineNumber}, column ${startColumn}`);
            }
        }
        warnInvalidLengthSemanticTokens(lineNumber, startColumn) {
            if (!this._hasWarnedInvalidLengthTokens) {
                this._hasWarnedInvalidLengthTokens = true;
                this._logService.warn(`Semantic token with invalid length detected at lineNumber ${lineNumber}, column ${startColumn}`);
            }
        }
        warnInvalidEditStart(previousResultId, resultId, editIndex, editStart, maxExpectedStart) {
            if (!this._hasWarnedInvalidEditStart) {
                this._hasWarnedInvalidEditStart = true;
                this._logService.warn(`Invalid semantic tokens edit detected (previousResultId: ${previousResultId}, resultId: ${resultId}) at edit #${editIndex}: The provided start offset ${editStart} is outside the previous data (length ${maxExpectedStart}).`);
            }
        }
    };
    exports.SemanticTokensProviderStyling = SemanticTokensProviderStyling;
    exports.SemanticTokensProviderStyling = SemanticTokensProviderStyling = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, language_1.ILanguageService),
        __param(3, log_1.ILogService)
    ], SemanticTokensProviderStyling);
    var SemanticColoringConstants;
    (function (SemanticColoringConstants) {
        /**
         * Let's aim at having 8KB buffers if possible...
         * So that would be 8192 / (5 * 4) = 409.6 tokens per area
         */
        SemanticColoringConstants[SemanticColoringConstants["DesiredTokensPerArea"] = 400] = "DesiredTokensPerArea";
        /**
         * Try to keep the total number of areas under 1024 if possible,
         * simply compensate by having more tokens per area...
         */
        SemanticColoringConstants[SemanticColoringConstants["DesiredMaxAreas"] = 1024] = "DesiredMaxAreas";
    })(SemanticColoringConstants || (SemanticColoringConstants = {}));
    function toMultilineTokens2(tokens, styling, languageId) {
        const srcData = tokens.data;
        const tokenCount = (tokens.data.length / 5) | 0;
        const tokensPerArea = Math.max(Math.ceil(tokenCount / 1024 /* SemanticColoringConstants.DesiredMaxAreas */), 400 /* SemanticColoringConstants.DesiredTokensPerArea */);
        const result = [];
        let tokenIndex = 0;
        let lastLineNumber = 1;
        let lastStartCharacter = 0;
        while (tokenIndex < tokenCount) {
            const tokenStartIndex = tokenIndex;
            let tokenEndIndex = Math.min(tokenStartIndex + tokensPerArea, tokenCount);
            // Keep tokens on the same line in the same area...
            if (tokenEndIndex < tokenCount) {
                let smallTokenEndIndex = tokenEndIndex;
                while (smallTokenEndIndex - 1 > tokenStartIndex && srcData[5 * smallTokenEndIndex] === 0) {
                    smallTokenEndIndex--;
                }
                if (smallTokenEndIndex - 1 === tokenStartIndex) {
                    // there are so many tokens on this line that our area would be empty, we must now go right
                    let bigTokenEndIndex = tokenEndIndex;
                    while (bigTokenEndIndex + 1 < tokenCount && srcData[5 * bigTokenEndIndex] === 0) {
                        bigTokenEndIndex++;
                    }
                    tokenEndIndex = bigTokenEndIndex;
                }
                else {
                    tokenEndIndex = smallTokenEndIndex;
                }
            }
            let destData = new Uint32Array((tokenEndIndex - tokenStartIndex) * 4);
            let destOffset = 0;
            let areaLine = 0;
            let prevLineNumber = 0;
            let prevEndCharacter = 0;
            while (tokenIndex < tokenEndIndex) {
                const srcOffset = 5 * tokenIndex;
                const deltaLine = srcData[srcOffset];
                const deltaCharacter = srcData[srcOffset + 1];
                // Casting both `lineNumber`, `startCharacter` and `endCharacter` here to uint32 using `|0`
                // to validate below with the actual values that will be inserted in the Uint32Array result
                const lineNumber = (lastLineNumber + deltaLine) | 0;
                const startCharacter = (deltaLine === 0 ? (lastStartCharacter + deltaCharacter) | 0 : deltaCharacter);
                const length = srcData[srcOffset + 2];
                const endCharacter = (startCharacter + length) | 0;
                const tokenTypeIndex = srcData[srcOffset + 3];
                const tokenModifierSet = srcData[srcOffset + 4];
                if (endCharacter <= startCharacter) {
                    // this token is invalid (most likely a negative length casted to uint32)
                    styling.warnInvalidLengthSemanticTokens(lineNumber, startCharacter + 1);
                }
                else if (prevLineNumber === lineNumber && prevEndCharacter > startCharacter) {
                    // this token overlaps with the previous token
                    styling.warnOverlappingSemanticTokens(lineNumber, startCharacter + 1);
                }
                else {
                    const metadata = styling.getMetadata(tokenTypeIndex, tokenModifierSet, languageId);
                    if (metadata !== 2147483647 /* SemanticTokensProviderStylingConstants.NO_STYLING */) {
                        if (areaLine === 0) {
                            areaLine = lineNumber;
                        }
                        destData[destOffset] = lineNumber - areaLine;
                        destData[destOffset + 1] = startCharacter;
                        destData[destOffset + 2] = endCharacter;
                        destData[destOffset + 3] = metadata;
                        destOffset += 4;
                        prevLineNumber = lineNumber;
                        prevEndCharacter = endCharacter;
                    }
                }
                lastLineNumber = lineNumber;
                lastStartCharacter = startCharacter;
                tokenIndex++;
            }
            if (destOffset !== destData.length) {
                destData = destData.subarray(0, destOffset);
            }
            const tokens = sparseMultilineTokens_1.SparseMultilineTokens.create(areaLine, destData);
            result.push(tokens);
        }
        return result;
    }
    class HashTableEntry {
        constructor(tokenTypeIndex, tokenModifierSet, languageId, metadata) {
            this.tokenTypeIndex = tokenTypeIndex;
            this.tokenModifierSet = tokenModifierSet;
            this.languageId = languageId;
            this.metadata = metadata;
            this.next = null;
        }
    }
    class HashTable {
        static { this._SIZES = [3, 7, 13, 31, 61, 127, 251, 509, 1021, 2039, 4093, 8191, 16381, 32749, 65521, 131071, 262139, 524287, 1048573, 2097143]; }
        constructor() {
            this._elementsCount = 0;
            this._currentLengthIndex = 0;
            this._currentLength = HashTable._SIZES[this._currentLengthIndex];
            this._growCount = Math.round(this._currentLengthIndex + 1 < HashTable._SIZES.length ? 2 / 3 * this._currentLength : 0);
            this._elements = [];
            HashTable._nullOutEntries(this._elements, this._currentLength);
        }
        static _nullOutEntries(entries, length) {
            for (let i = 0; i < length; i++) {
                entries[i] = null;
            }
        }
        _hash2(n1, n2) {
            return (((n1 << 5) - n1) + n2) | 0; // n1 * 31 + n2, keep as int32
        }
        _hashFunc(tokenTypeIndex, tokenModifierSet, languageId) {
            return this._hash2(this._hash2(tokenTypeIndex, tokenModifierSet), languageId) % this._currentLength;
        }
        get(tokenTypeIndex, tokenModifierSet, languageId) {
            const hash = this._hashFunc(tokenTypeIndex, tokenModifierSet, languageId);
            let p = this._elements[hash];
            while (p) {
                if (p.tokenTypeIndex === tokenTypeIndex && p.tokenModifierSet === tokenModifierSet && p.languageId === languageId) {
                    return p;
                }
                p = p.next;
            }
            return null;
        }
        add(tokenTypeIndex, tokenModifierSet, languageId, metadata) {
            this._elementsCount++;
            if (this._growCount !== 0 && this._elementsCount >= this._growCount) {
                // expand!
                const oldElements = this._elements;
                this._currentLengthIndex++;
                this._currentLength = HashTable._SIZES[this._currentLengthIndex];
                this._growCount = Math.round(this._currentLengthIndex + 1 < HashTable._SIZES.length ? 2 / 3 * this._currentLength : 0);
                this._elements = [];
                HashTable._nullOutEntries(this._elements, this._currentLength);
                for (const first of oldElements) {
                    let p = first;
                    while (p) {
                        const oldNext = p.next;
                        p.next = null;
                        this._add(p);
                        p = oldNext;
                    }
                }
            }
            this._add(new HashTableEntry(tokenTypeIndex, tokenModifierSet, languageId, metadata));
        }
        _add(element) {
            const hash = this._hashFunc(element.tokenTypeIndex, element.tokenModifierSet, element.languageId);
            element.next = this._elements[hash];
            this._elements[hash] = element;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VtYW50aWNUb2tlbnNQcm92aWRlclN0eWxpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL3NlbWFudGljVG9rZW5zUHJvdmlkZXJTdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTBJaEcsZ0RBeUZDO0lBMU5ELElBQVcsc0NBRVY7SUFGRCxXQUFXLHNDQUFzQztRQUNoRCx3SEFBK0MsQ0FBQTtJQUNoRCxDQUFDLEVBRlUsc0NBQXNDLEtBQXRDLHNDQUFzQyxRQUVoRDtJQUVNLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQTZCO1FBT3pDLFlBQ2tCLE9BQTZCLEVBQy9CLGFBQTZDLEVBQzFDLGdCQUFtRCxFQUN4RCxXQUF5QztZQUhyQyxZQUFPLEdBQVAsT0FBTyxDQUFzQjtZQUNkLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ3pCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDdkMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFSL0MsZ0NBQTJCLEdBQUcsS0FBSyxDQUFDO1lBQ3BDLGtDQUE2QixHQUFHLEtBQUssQ0FBQztZQUN0QywrQkFBMEIsR0FBRyxLQUFLLENBQUM7WUFRMUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ25DLENBQUM7UUFFTSxXQUFXLENBQUMsY0FBc0IsRUFBRSxnQkFBd0IsRUFBRSxVQUFrQjtZQUN0RixNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0YsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLGdCQUFnQixF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