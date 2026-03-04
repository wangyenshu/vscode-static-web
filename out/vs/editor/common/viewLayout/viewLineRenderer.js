/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/editor/common/core/stringBuilder", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/linePart"], function (require, exports, nls, strings, stringBuilder_1, lineDecorations_1, linePart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenderLineOutput2 = exports.RenderLineOutput = exports.ForeignElementType = exports.CharacterMapping = exports.DomPosition = exports.RenderLineInput = exports.LineRange = exports.RenderWhitespace = void 0;
    exports.renderViewLine = renderViewLine;
    exports.renderViewLine2 = renderViewLine2;
    var RenderWhitespace;
    (function (RenderWhitespace) {
        RenderWhitespace[RenderWhitespace["None"] = 0] = "None";
        RenderWhitespace[RenderWhitespace["Boundary"] = 1] = "Boundary";
        RenderWhitespace[RenderWhitespace["Selection"] = 2] = "Selection";
        RenderWhitespace[RenderWhitespace["Trailing"] = 3] = "Trailing";
        RenderWhitespace[RenderWhitespace["All"] = 4] = "All";
    })(RenderWhitespace || (exports.RenderWhitespace = RenderWhitespace = {}));
    class LineRange {
        constructor(startIndex, endIndex) {
            this.startOffset = startIndex;
            this.endOffset = endIndex;
        }
        equals(otherLineRange) {
            return this.startOffset === otherLineRange.startOffset
                && this.endOffset === otherLineRange.endOffset;
        }
    }
    exports.LineRange = LineRange;
    class RenderLineInput {
        constructor(useMonospaceOptimizations, canUseHalfwidthRightwardsArrow, lineContent, continuesWithWrappedLine, isBasicASCII, containsRTL, fauxIndentLength, lineTokens, lineDecorations, tabSize, startVisibleColumn, spaceWidth, middotWidth, wsmiddotWidth, stopRenderingLineAfter, renderWhitespace, renderControlCharacters, fontLigatures, selectionsOnLine) {
            this.useMonospaceOptimizations = useMonospaceOptimizations;
            this.canUseHalfwidthRightwardsArrow = canUseHalfwidthRightwardsArrow;
            this.lineContent = lineContent;
            this.continuesWithWrappedLine = continuesWithWrappedLine;
            this.isBasicASCII = isBasicASCII;
            this.containsRTL = containsRTL;
            this.fauxIndentLength = fauxIndentLength;
            this.lineTokens = lineTokens;
            this.lineDecorations = lineDecorations.sort(lineDecorations_1.LineDecoration.compare);
            this.tabSize = tabSize;
            this.startVisibleColumn = startVisibleColumn;
            this.spaceWidth = spaceWidth;
            this.stopRenderingLineAfter = stopRenderingLineAfter;
            this.renderWhitespace = (renderWhitespace === 'all'
                ? 4 /* RenderWhitespace.All */
                : renderWhitespace === 'boundary'
                    ? 1 /* RenderWhitespace.Boundary */
                    : renderWhitespace === 'selection'
                        ? 2 /* RenderWhitespace.Selection */
                        : renderWhitespace === 'trailing'
                            ? 3 /* RenderWhitespace.Trailing */
                            : 0 /* RenderWhitespace.None */);
            this.renderControlCharacters = renderControlCharacters;
            this.fontLigatures = fontLigatures;
            this.selectionsOnLine = selectionsOnLine && selectionsOnLine.sort((a, b) => a.startOffset < b.startOffset ? -1 : 1);
            const wsmiddotDiff = Math.abs(wsmiddotWidth - spaceWidth);
            const middotDiff = Math.abs(middotWidth - spaceWidth);
            if (wsmiddotDiff < middotDiff) {
                this.renderSpaceWidth = wsmiddotWidth;
                this.renderSpaceCharCode = 0x2E31; // U+2E31 - WORD SEPARATOR MIDDLE DOT
            }
            else {
                this.renderSpaceWidth = middotWidth;
                this.renderSpaceCharCode = 0xB7; // U+00B7 - MIDDLE DOT
            }
        }
        sameSelection(otherSelections) {
            if (this.selectionsOnLine === null) {
                return otherSelections === null;
            }
            if (otherSelections === null) {
                return false;
            }
            if (otherSelections.length !== this.selectionsOnLine.length) {
                return false;
            }
            for (let i = 0; i < this.selectionsOnLine.length; i++) {
                if (!this.selectionsOnLine[i].equals(otherSelections[i])) {
                    return false;
                }
            }
            return true;
        }
        equals(other) {
            return (this.useMonospaceOptimizations === other.useMonospaceOptimizations
                && this.canUseHalfwidthRightwardsArrow === other.canUseHalfwidthRightwardsArrow
                && this.lineContent === other.lineContent
                && this.continuesWithWrappedLine === other.continuesWithWrappedLine
                && this.isBasicASCII === other.isBasicASCII
                && this.containsRTL === other.containsRTL
                && this.fauxIndentLength === other.fauxIndentLength
                && this.tabSize === other.tabSize
                && this.startVisibleColumn === other.startVisibleColumn
                && this.spaceWidth === other.spaceWidth
                && this.renderSpaceWidth === other.renderSpaceWidth
                && this.renderSpaceCharCode === other.renderSpaceCharCode
                && this.stopRenderingLineAfter === other.stopRenderingLineAfter
                && this.renderWhitespace === other.renderWhitespace
                && this.renderControlCharacters === other.renderControlCharacters
                && this.fontLigatures === other.fontLigatures
                && lineDecorations_1.LineDecoration.equalsArr(this.lineDecorations, other.lineDecorations)
                && this.lineTokens.equals(other.lineTokens)
                && this.sameSelection(other.selectionsOnLine));
        }
    }
    exports.RenderLineInput = RenderLineInput;
    var CharacterMappingConstants;
    (function (CharacterMappingConstants) {
        CharacterMappingConstants[CharacterMappingConstants["PART_INDEX_MASK"] = 4294901760] = "PART_INDEX_MASK";
        CharacterMappingConstants[CharacterMappingConstants["CHAR_INDEX_MASK"] = 65535] = "CHAR_INDEX_MASK";
        CharacterMappingConstants[CharacterMappingConstants["CHAR_INDEX_OFFSET"] = 0] = "CHAR_INDEX_OFFSET";
        CharacterMappingConstants[CharacterMappingConstants["PART_INDEX_OFFSET"] = 16] = "PART_INDEX_OFFSET";
    })(CharacterMappingConstants || (CharacterMappingConstants = {}));
    class DomPosition {
        constructor(partIndex, charIndex) {
            this.partIndex = partIndex;
            this.charIndex = charIndex;
        }
    }
    exports.DomPosition = DomPosition;
    /**
     * Provides a both direction mapping between a line's character and its rendered position.
     */
    class CharacterMapping {
        static getPartIndex(partData) {
            return (partData & 4294901760 /* CharacterMappingConstants.PART_INDEX_MASK */) >>> 16 /* CharacterMappingConstants.PART_INDEX_OFFSET */;
        }
        static getCharIndex(partData) {
            return (partData & 65535 /* CharacterMappingConstants.CHAR_INDEX_MASK */) >>> 0 /* CharacterMappingConstants.CHAR_INDEX_OFFSET */;
        }
        constructor(length, partCount) {
            this.length = length;
            this._data = new Uint32Array(this.length);
            this._horizontalOffset = new Uint32Array(this.length);
        }
        setColumnInfo(column, partIndex, charIndex, horizontalOffset) {
            const partData = ((partIndex << 16 /* CharacterMappingConstants.PART_INDEX_OFFSET */)
                | (charIndex << 0 /* CharacterMappingConstants.CHAR_INDEX_OFFSET */)) >>> 0;
            this._data[column - 1] = partData;
            this._horizontalOffset[column - 1] = horizontalOffset;
        }
        getHorizontalOffset(column) {
            if (this._horizontalOffset.length === 0) {
                // No characters on this line
                return 0;
            }
            return this._horizontalOffset[column - 1];
        }
        charOffsetToPartData(charOffset) {
            if (this.length === 0) {
                return 0;
            }
            if (charOffset < 0) {
                return this._data[0];
            }
            if (charOffset >= this.length) {
                return this._data[this.length - 1];
            }
            return this._data[charOffset];
        }
        getDomPosition(column) {
            const partData = this.charOffsetToPartData(column - 1);
            const partIndex = CharacterMapping.getPartIndex(partData);
            const charIndex = CharacterMapping.getCharIndex(partData);
            return new DomPosition(partIndex, charIndex);
        }
        getColumn(domPosition, partLength) {
            const charOffset = this.partDataToCharOffset(domPosition.partIndex, partLength, domPosition.charIndex);
            return charOffset + 1;
        }
        partDataToCharOffset(partIndex, partLength, charIndex) {
            if (this.length === 0) {
                return 0;
            }
            const searchEntry = ((partIndex << 16 /* CharacterMappingConstants.PART_INDEX_OFFSET */)
                | (charIndex << 0 /* CharacterMappingConstants.CHAR_INDEX_OFFSET */)) >>> 0;
            let min = 0;
            let max = this.length - 1;
            while (min + 1 < max) {
                const mid = ((min + max) >>> 1);
                const midEntry = this._data[mid];
                if (midEntry === searchEntry) {
                    return mid;
                }
                else if (midEntry > searchEntry) {
                    max = mid;
                }
                else {
                    min = mid;
                }
            }
            if (min === max) {
                return min;
            }
            const minEntry = this._data[min];
            const maxEntry = this._data[max];
            if (minEntry === searchEntry) {
                return min;
            }
            if (maxEntry === searchEntry) {
                return max;
            }
            const minPartIndex = CharacterMapping.getPartIndex(minEntry);
            const minCharIndex = CharacterMapping.getCharIndex(minEntry);
            const maxPartIndex = CharacterMapping.getPartIndex(maxEntry);
            let maxCharIndex;
            if (minPartIndex !== maxPartIndex) {
                // sitting between parts
                maxCharIndex = partLength;
            }
            else {
                maxCharIndex = CharacterMapping.getCharIndex(maxEntry);
            }
            const minEntryDistance = charIndex - minCharIndex;
            const maxEntryDistance = maxCharIndex - charIndex;
            if (minEntryDistance <= maxEntryDistance) {
                return min;
            }
            return max;
        }
        inflate() {
            const result = [];
            for (let i = 0; i < this.length; i++) {
                const partData = this._data[i];
                const partIndex = CharacterMapping.getPartIndex(partData);
                const charIndex = CharacterMapping.getCharIndex(partData);
                const visibleColumn = this._horizontalOffset[i];
                result.push([partIndex, charIndex, visibleColumn]);
            }
            return result;
        }
    }
    exports.CharacterMapping = CharacterMapping;
    var ForeignElementType;
    (function (ForeignElementType) {
        ForeignElementType[ForeignElementType["None"] = 0] = "None";
        ForeignElementType[ForeignElementType["Before"] = 1] = "Before";
        ForeignElementType[ForeignElementType["After"] = 2] = "After";
    })(ForeignElementType || (exports.ForeignElementType = ForeignElementType = {}));
    class RenderLineOutput {
        constructor(characterMapping, containsRTL, containsForeignElements) {
            this._renderLineOutputBrand = undefined;
            this.characterMapping = characterMapping;
            this.containsRTL = containsRTL;
            this.containsForeignElements = containsForeignElements;
        }
    }
    exports.RenderLineOutput = RenderLineOutput;
    function renderViewLine(input, sb) {
        if (input.lineContent.length === 0) {
            if (input.lineDecorations.length > 0) {
                // This line is empty, but it contains inline decorations
                sb.appendString(`<span>`);
                let beforeCount = 0;
                let afterCount = 0;
                let containsForeignElements = 0 /* ForeignElementType.None */;
                for (const lineDecoration of input.lineDecorations) {
                    if (lineDecoration.type === 1 /* InlineDecorationType.Before */ || lineDecoration.type === 2 /* InlineDecorationType.After */) {
                        sb.appendString(`<span class="`);
                        sb.appendString(lineDecoration.className);
                        sb.appendString(`"></span>`);
                        if (lineDecoration.type === 1 /* InlineDecorationType.Before */) {
                            containsForeignElements |= 1 /* ForeignElementType.Before */;
                            beforeCount++;
                        }
                        if (lineDecoration.type === 2 /* InlineDecorationType.After */) {
                            containsForeignElements |= 2 /* ForeignElementType.After */;
                            afterCount++;
                        }
                    }
                }
                sb.appendString(`</span>`);
                const characterMapping = new CharacterMapping(1, beforeCount + afterCount);
                characterMapping.setColumnInfo(1, beforeCount, 0, 0);
                return new RenderLineOutput(characterMapping, false, containsForeignElements);
            }
            // completely empty line
            sb.appendString('<span><span></span></span>');
            return new RenderLineOutput(new CharacterMapping(0, 0), false, 0 /* ForeignElementType.None */);
        }
        return _renderLine(resolveRenderLineInput(input), sb);
    }
    class RenderLineOutput2 {
        constructor(characterMapping, html, containsRTL, containsForeignElements) {
            this.characterMapping = characterMapping;
            this.html = html;
            this.containsRTL = containsRTL;
            this.containsForeignElements = containsForeignElements;
        }
    }
    exports.RenderLineOutput2 = RenderLineOutput2;
    function renderViewLine2(input) {
        const sb = new stringBuilder_1.StringBuilder(10000);
        const out = renderViewLine(input, sb);
        return new RenderLineOutput2(out.characterMapping, sb.build(), out.containsRTL, out.containsForeignElements);
    }
    class ResolvedRenderLineInput {
        constructor(fontIsMonospace, canUseHalfwidthRightwardsArrow, lineContent, len, isOverflowing, overflowingCharCount, parts, containsForeignElements, fauxIndentLength, tabSize, startVisibleColumn, containsRTL, spaceWidth, renderSpaceCharCode, renderWhitespace, renderControlCharacters) {
            this.fontIsMonospace = fontIsMonospace;
            this.canUseHalfwidthRightwardsArrow = canUseHalfwidthRightwardsArrow;
            this.lineContent = lineContent;
            this.len = len;
            this.isOverflowing = isOverflowing;
            this.overflowingCharCount = overflowingCharCount;
            this.parts = parts;
            this.containsForeignElements = containsForeignElements;
            this.fauxIndentLength = fauxIndentLength;
            this.tabSize = tabSize;
            this.startVisibleColumn = startVisibleColumn;
            this.containsRTL = containsRTL;
            this.spaceWidth = spaceWidth;
            this.renderSpaceCharCode = renderSpaceCharCode;
            this.renderWhitespace = renderWhitespace;
            this.renderControlCharacters = renderControlCharacters;
            //
        }
    }
    function resolveRenderLineInput(input) {
        const lineContent = input.lineContent;
        let isOverflowing;
        let overflowingCharCount;
        let len;
        if (input.stopRenderingLineAfter !== -1 && input.stopRenderingLineAfter < lineContent.length) {
            isOverflowing = true;
            overflowingCharCount = lineContent.length - input.stopRenderingLineAfter;
            len = input.stopRenderingLineAfter;
        }
        else {
            isOverflowing = false;
            overflowingCharCount = 0;
            len = lineContent.length;
        }
        let tokens = transformAndRemoveOverflowing(lineContent, input.containsRTL, input.lineTokens, input.fauxIndentLength, len);
        if (input.renderControlCharacters && !input.isBasicASCII) {
            // Calling `extractControlCharacters` before adding (possibly empty) line parts
            // for inline decorations. `extractControlCharacters` removes empty line parts.
            tokens = extractControlCharacters(lineContent, tokens);
        }
        if (input.renderWhitespace === 4 /* RenderWhitespace.All */ ||
            input.renderWhitespace === 1 /* RenderWhitespace.Boundary */ ||
            (input.renderWhitespace === 2 /* RenderWhitespace.Selection */ && !!input.selectionsOnLine) ||
            (input.renderWhitespace === 3 /* RenderWhitespace.Trailing */ && !input.continuesWithWrappedLine)) {
            tokens = _applyRenderWhitespace(input, lineContent, len, tokens);
        }
        let containsForeignElements = 0 /* ForeignElementType.None */;
        if (input.lineDecorations.length > 0) {
            for (let i = 0, len = input.lineDecorations.length; i < len; i++) {
                const lineDecoration = input.lineDecorations[i];
                if (lineDecoration.type === 3 /* InlineDecorationType.RegularAffectingLetterSpacing */) {
                    // Pretend there are foreign elements... although not 100% accurate.
                    containsForeignElements |= 1 /* ForeignElementType.Before */;
                }
                else if (lineDecoration.type === 1 /* InlineDecorationType.Before */) {
                    containsForeignElements |= 1 /* ForeignElementType.Before */;
                }
                else if (lineDecoration.type === 2 /* InlineDecorationType.After */) {
                    containsForeignElements |= 2 /* ForeignElementType.After */;
                }
            }
            tokens = _applyInlineDecorations(lineContent, len, tokens, input.lineDecorations);
        }
        if (!input.containsRTL) {
            // We can never split RTL text, as it ruins the rendering
            tokens = splitLargeTokens(lineContent, tokens, !input.isBasicASCII || input.fontLigatures);
        }
        return new ResolvedRenderLineInput(input.useMonospaceOptimizations, input.canUseHalfwidthRightwardsArrow, lineContent, len, isOverflowing, overflowingCharCount, tokens, containsForeignElements, input.fauxIndentLength, input.tabSize, input.startVisibleColumn, input.containsRTL, input.spaceWidth, input.renderSpaceCharCode, input.renderWhitespace, input.renderControlCharacters);
    }
    /**
     * In the rendering phase, characters are always looped until token.endIndex.
     * Ensure that all tokens end before `len` and the last one ends precisely at `len`.
     */
    function transformAndRemoveOverflowing(lineContent, lineContainsRTL, tokens, fauxIndentLength, len) {
        const result = [];
        let resultLen = 0;
        // The faux indent part of the line should have no token type
        if (fauxIndentLength > 0) {
            result[resultLen++] = new linePart_1.LinePart(fauxIndentLength, '', 0, false);
        }
        let startOffset = fauxIndentLength;
        for (let tokenIndex = 0, tokensLen = tokens.getCount(); tokenIndex < tokensLen; tokenIndex++) {
            const endIndex = tokens.getEndOffset(tokenIndex);
            if (endIndex <= fauxIndentLength) {
                // The faux indent part of the line should have no token type
                continue;
            }
            const type = tokens.getClassName(tokenIndex);
            if (endIndex >= len) {
                const tokenContainsRTL = (lineContainsRTL ? strings.containsRTL(lineContent.substring(startOffset, len)) : false);
                result[resultLen++] = new linePart_1.LinePart(len, type, 0, tokenContainsRTL);
                break;
            }
            const tokenContainsRTL = (lineContainsRTL ? strings.containsRTL(lineContent.substring(startOffset, endIndex)) : false);
            result[resultLen++] = new linePart_1.LinePart(endIndex, type, 0, tokenContainsRTL);
            startOffset = endIndex;
        }
        return result;
    }
    /**
     * written as a const enum to get value inlining.
     */
    var Constants;
    (function (Constants) {
        Constants[Constants["LongToken"] = 50] = "LongToken";
    })(Constants || (Constants = {}));
    /**
     * See https://github.com/microsoft/vscode/issues/6885.
     * It appears that having very large spans causes very slow reading of character positions.
     * So here we try to avoid that.
     */
    function splitLargeTokens(lineContent, tokens, onlyAtSpaces) {
        let lastTokenEndIndex = 0;
        const result = [];
        let resultLen = 0;
        if (onlyAtSpaces) {
            // Split only at spaces => we need to walk each character
            for (let i = 0, len = tokens.length; i < len; i++) {
                const token = tokens[i];
                const tokenEndIndex = token.endIndex;
                if (lastTokenEndIndex + 50 /* Constants.LongToken */ < tokenEndIndex) {
                    const tokenType = token.type;
                    const tokenMetadata = token.metadata;
                    const tokenContainsRTL = token.containsRTL;
                    let lastSpaceOffset = -1;
                    let currTokenStart = lastTokenEndIndex;
                    for (let j = lastTokenEndIndex; j < tokenEndIndex; j++) {
                        if (lineContent.charCodeAt(j) === 32 /* CharCode.Space */) {
                            lastSpaceOffset = j;
                        }
                        if (lastSpaceOffset !== -1 && j - currTokenStart >= 50 /* Constants.LongToken */) {
                            // Split at `lastSpaceOffset` + 1
                            result[resultLen++] = new linePart_1.LinePart(lastSpaceOffset + 1, tokenType, tokenMetadata, tokenContainsRTL);
                            currTokenStart = lastSpaceOffset + 1;
                            lastSpaceOffset = -1;
                        }
                    }
                    if (currTokenStart !== tokenEndIndex) {
                        result[resultLen++] = new linePart_1.LinePart(tokenEndIndex, tokenType, tokenMetadata, tokenContainsRTL);
                    }
                }
                else {
                    result[resultLen++] = token;
                }
                lastTokenEndIndex = tokenEndIndex;
            }
        }
        else {
            // Split anywhere => we don't need to walk each character
            for (let i = 0, len = tokens.length; i < len; i++) {
                const token = tokens[i];
                const tokenEndIndex = token.endIndex;
                const diff = (tokenEndIndex - lastTokenEndIndex);
                if (diff > 50 /* Constants.LongToken */) {
                    const tokenType = token.type;
                    const tokenMetadata = token.metadata;
                    const tokenContainsRTL = token.containsRTL;
                    const piecesCount = Math.ceil(diff / 50 /* Constants.LongToken */);
                    for (let j = 1; j < piecesCount; j++) {
                        const pieceEndIndex = lastTokenEndIndex + (j * 50 /* Constants.LongToken */);
                        result[resultLen++] = new linePart_1.LinePart(pieceEndIndex, tokenType, tokenMetadata, tokenContainsRTL);
                    }
                    result[resultLen++] = new linePart_1.LinePart(tokenEndIndex, tokenType, tokenMetadata, tokenContainsRTL);
                }
                else {
                    result[resultLen++] = token;
                }
                lastTokenEndIndex = tokenEndIndex;
            }
        }
        return result;
    }
    function isControlCharacter(charCode) {
        if (charCode < 32) {
            return (charCode !== 9 /* CharCode.Tab */);
        }
        if (charCode === 127) {
            // DEL
            return true;
        }
        if ((charCode >= 0x202A && charCode <= 0x202E)
            || (charCode >= 0x2066 && charCode <= 0x2069)
            || (charCode >= 0x200E && charCode <= 0x200F)
            || charCode === 0x061C) {
            // Unicode Directional Formatting Characters
            // LRE	U+202A	LEFT-TO-RIGHT EMBEDDING
            // RLE	U+202B	RIGHT-TO-LEFT EMBEDDING
            // PDF	U+202C	POP DIRECTIONAL FORMATTING
            // LRO	U+202D	LEFT-TO-RIGHT OVERRIDE
            // RLO	U+202E	RIGHT-TO-LEFT OVERRIDE
            // LRI	U+2066	LEFT-TO-RIGHT ISOLATE
            // RLI	U+2067	RIGHT-TO-LEFT ISOLATE
            // FSI	U+2068	FIRST STRONG ISOLATE
            // PDI	U+2069	POP DIRECTIONAL ISOLATE
            // LRM	U+200E	LEFT-TO-RIGHT MARK
            // RLM	U+200F	RIGHT-TO-LEFT MARK
            // ALM	U+061C	ARABIC LETTER MARK
            return true;
        }
        return false;
    }
    function extractControlCharacters(lineContent, tokens) {
        const result = [];
        let lastLinePart = new linePart_1.LinePart(0, '', 0, false);
        let charOffset = 0;
        for (const token of tokens) {
            const tokenEndIndex = token.endIndex;
            for (; charOffset < tokenEndIndex; charOffset++) {
                const charCode = lineContent.charCodeAt(charOffset);
                if (isControlCharacter(charCode)) {
                    if (charOffset > lastLinePart.endIndex) {
                        // emit previous part if it has text
                        lastLinePart = new linePart_1.LinePart(charOffset, token.type, token.metadata, token.containsRTL);
                        result.push(lastLinePart);
                    }
                    lastLinePart = new linePart_1.LinePart(charOffset + 1, 'mtkcontrol', token.metadata, false);
                    result.push(lastLinePart);
                }
            }
            if (charOffset > lastLinePart.endIndex) {
                // emit previous part if it has text
                lastLinePart = new linePart_1.LinePart(tokenEndIndex, token.type, token.metadata, token.containsRTL);
                result.push(lastLinePart);
            }
        }
        return result;
    }
    /**
     * Whitespace is rendered by "replacing" tokens with a special-purpose `mtkw` type that is later recognized in the rendering phase.
     * Moreover, a token is created for every visual indent because on some fonts the glyphs used for rendering whitespace (&rarr; or &middot;) do not have the same width as &nbsp;.
     * The rendering phase will generate `style="width:..."` for these tokens.
     */
    function _applyRenderWhitespace(input, lineContent, len, tokens) {
        const continuesWithWrappedLine = input.continuesWithWrappedLine;
        const fauxIndentLength = input.fauxIndentLength;
        const tabSize = input.tabSize;
        const startVisibleColumn = input.startVisibleColumn;
        const useMonospaceOptimizations = input.useMonospaceOptimizations;
        const selections = input.selectionsOnLine;
        const onlyBoundary = (input.renderWhitespace === 1 /* RenderWhitespace.Boundary */);
        const onlyTrailing = (input.renderWhitespace === 3 /* RenderWhitespace.Trailing */);
        const generateLinePartForEachWhitespace = (input.renderSpaceWidth !== input.spaceWidth);
        const result = [];
        let resultLen = 0;
        let tokenIndex = 0;
        let tokenType = tokens[tokenIndex].type;
        let tokenContainsRTL = tokens[tokenIndex].containsRTL;
        let tokenEndIndex = tokens[tokenIndex].endIndex;
        const tokensLength = tokens.length;
        let lineIsEmptyOrWhitespace = false;
        let firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineContent);
        let lastNonWhitespaceIndex;
        if (firstNonWhitespaceIndex === -1) {
            lineIsEmptyOrWhitespace = true;
            firstNonWhitespaceIndex = len;
            lastNonWhitespaceIndex = len;
        }
        else {
            lastNonWhitespaceIndex = strings.lastNonWhitespaceIndex(lineContent);
        }
        let wasInWhitespace = false;
        let currentSelectionIndex = 0;
        let currentSelection = selections && selections[currentSelectionIndex];
        let tmpIndent = startVisibleColumn % tabSize;
        for (let charIndex = fauxIndentLength; charIndex < len; charIndex++) {
            const chCode = lineContent.charCodeAt(charIndex);
            if (currentSelection && charIndex >= currentSelection.endOffset) {
                currentSelectionIndex++;
                currentSelection = selections && selections[currentSelectionIndex];
            }
            let isInWhitespace;
            if (charIndex < firstNonWhitespaceIndex || charIndex > lastNonWhitespaceIndex) {
                // in leading or trailing whitespace
                isInWhitespace = true;
            }
            else if (chCode === 9 /* CharCode.Tab */) {
                // a tab character is rendered both in all and boundary cases
                isInWhitespace = true;
            }
            else if (chCode === 32 /* CharCode.Space */) {
                // hit a space character
                if (onlyBoundary) {
                    // rendering only boundary whitespace
                    if (wasInWhitespace) {
                        isInWhitespace = true;
                    }
                    else {
                        const nextChCode = (charIndex + 1 < len ? lineContent.charCodeAt(charIndex + 1) : 0 /* CharCode.Null */);
                        isInWhitespace = (nextChCode === 32 /* CharCode.Space */ || nextChCode === 9 /* CharCode.Tab */);
                    }
                }
                else {
                    isInWhitespace = true;
                }
            }
            else {
                isInWhitespace = false;
            }
            // If rendering whitespace on selection, check that the charIndex falls within a selection
            if (isInWhitespace && selections) {
                isInWhitespace = !!currentSelection && currentSelection.startOffset <= charIndex && currentSelection.endOffset > charIndex;
            }
            // If rendering only trailing whitespace, check that the charIndex points to trailing whitespace.
            if (isInWhitespace && onlyTrailing) {
                isInWhitespace = lineIsEmptyOrWhitespace || charIndex > lastNonWhitespaceIndex;
            }
            if (isInWhitespace && tokenContainsRTL) {
                // If the token contains RTL text, breaking it up into multiple line parts
                // to render whitespace might affect the browser's bidi layout.
                //
                // We render whitespace in such tokens only if the whitespace
                // is the leading or the trailing whitespace of the line,
                // which doesn't affect the browser's bidi layout.
                if (charIndex >= firstNonWhitespaceIndex && charIndex <= lastNonWhitespaceIndex) {
                    isInWhitespace = false;
                }
            }
            if (wasInWhitespace) {
                // was in whitespace token
                if (!isInWhitespace || (!useMonospaceOptimizations && tmpIndent >= tabSize)) {
                    // leaving whitespace token or entering a new indent
                    if (generateLinePartForEachWhitespace) {
                        const lastEndIndex = (resultLen > 0 ? result[resultLen - 1].endIndex : fauxIndentLength);
                        for (let i = lastEndIndex + 1; i <= charIndex; i++) {
                            result[resultLen++] = new linePart_1.LinePart(i, 'mtkw', 1 /* LinePartMetadata.IS_WHITESPACE */, false);
                        }
                    }
                    else {
                        result[resultLen++] = new linePart_1.LinePart(charIndex, 'mtkw', 1 /* LinePartMetadata.IS_WHITESPACE */, false);
                    }
                    tmpIndent = tmpIndent % tabSize;
                }
            }
            else {
                // was in regular token
                if (charIndex === tokenEndIndex || (isInWhitespace && charIndex > fauxIndentLength)) {
                    result[resultLen++] = new linePart_1.LinePart(charIndex, tokenType, 0, tokenContainsRTL);
                    tmpIndent = tmpIndent % tabSize;
                }
            }
            if (chCode === 9 /* CharCode.Tab */) {
                tmpIndent = tabSize;
            }
            else if (strings.isFullWidthCharacter(chCode)) {
                tmpIndent += 2;
            }
            else {
                tmpIndent++;
            }
            wasInWhitespace = isInWhitespace;
            while (charIndex === tokenEndIndex) {
                tokenIndex++;
                if (tokenIndex < tokensLength) {
                    tokenType = tokens[tokenIndex].type;
                    tokenContainsRTL = tokens[tokenIndex].containsRTL;
                    tokenEndIndex = tokens[tokenIndex].endIndex;
                }
                else {
                    break;
                }
            }
        }
        let generateWhitespace = false;
        if (wasInWhitespace) {
            // was in whitespace token
            if (continuesWithWrappedLine && onlyBoundary) {
                const lastCharCode = (len > 0 ? lineContent.charCodeAt(len - 1) : 0 /* CharCode.Null */);
                const prevCharCode = (len > 1 ? lineContent.charCodeAt(len - 2) : 0 /* CharCode.Null */);
                const isSingleTrailingSpace = (lastCharCode === 32 /* CharCode.Space */ && (prevCharCode !== 32 /* CharCode.Space */ && prevCharCode !== 9 /* CharCode.Tab */));
                if (!isSingleTrailingSpace) {
                    generateWhitespace = true;
                }
            }
            else {
                generateWhitespace = true;
            }
        }
        if (generateWhitespace) {
            if (generateLinePartForEachWhitespace) {
                const lastEndIndex = (resultLen > 0 ? result[resultLen - 1].endIndex : fauxIndentLength);
                for (let i = lastEndIndex + 1; i <= len; i++) {
                    result[resultLen++] = new linePart_1.LinePart(i, 'mtkw', 1 /* LinePartMetadata.IS_WHITESPACE */, false);
                }
            }
            else {
                result[resultLen++] = new linePart_1.LinePart(len, 'mtkw', 1 /* LinePartMetadata.IS_WHITESPACE */, false);
            }
        }
        else {
            result[resultLen++] = new linePart_1.LinePart(len, tokenType, 0, tokenContainsRTL);
        }
        return result;
    }
    /**
     * Inline decorations are "merged" on top of tokens.
     * Special care must be taken when multiple inline decorations are at play and they overlap.
     */
    function _applyInlineDecorations(lineContent, len, tokens, _lineDecorations) {
        _lineDecorations.sort(lineDecorations_1.LineDecoration.compare);
        const lineDecorations = lineDecorations_1.LineDecorationsNormalizer.normalize(lineContent, _lineDecorations);
        const lineDecorationsLen = lineDecorations.length;
        let lineDecorationIndex = 0;
        const result = [];
        let resultLen = 0;
        let lastResultEndIndex = 0;
        for (let tokenIndex = 0, len = tokens.length; tokenIndex < len; tokenIndex++) {
            const token = tokens[tokenIndex];
            const tokenEndIndex = token.endIndex;
            const tokenType = token.type;
            const tokenMetadata = token.metadata;
            const tokenContainsRTL = token.containsRTL;
            while (lineDecorationIndex < lineDecorationsLen && lineDecorations[lineDecorationIndex].startOffset < tokenEndIndex) {
                const lineDecoration = lineDecorations[lineDecorationIndex];
                if (lineDecoration.startOffset > lastResultEndIndex) {
                    lastResultEndIndex = lineDecoration.startOffset;
                    result[resultLen++] = new linePart_1.LinePart(lastResultEndIndex, tokenType, tokenMetadata, tokenContainsRTL);
                }
                if (lineDecoration.endOffset + 1 <= tokenEndIndex) {
                    // This line decoration ends before this token ends
                    lastResultEndIndex = lineDecoration.endOffset + 1;
                    result[resultLen++] = new linePart_1.LinePart(lastResultEndIndex, tokenType + ' ' + lineDecoration.className, tokenMetadata | lineDecoration.metadata, tokenContainsRTL);
                    lineDecorationIndex++;
                }
                else {
                    // This line decoration continues on to the next token
                    lastResultEndIndex = tokenEndIndex;
                    result[resultLen++] = new linePart_1.LinePart(lastResultEndIndex, tokenType + ' ' + lineDecoration.className, tokenMetadata | lineDecoration.metadata, tokenContainsRTL);
                    break;
                }
            }
            if (tokenEndIndex > lastResultEndIndex) {
                lastResultEndIndex = tokenEndIndex;
                result[resultLen++] = new linePart_1.LinePart(lastResultEndIndex, tokenType, tokenMetadata, tokenContainsRTL);
            }
        }
        const lastTokenEndIndex = tokens[tokens.length - 1].endIndex;
        if (lineDecorationIndex < lineDecorationsLen && lineDecorations[lineDecorationIndex].startOffset === lastTokenEndIndex) {
            while (lineDecorationIndex < lineDecorationsLen && lineDecorations[lineDecorationIndex].startOffset === lastTokenEndIndex) {
                const lineDecoration = lineDecorations[lineDecorationIndex];
                result[resultLen++] = new linePart_1.LinePart(lastResultEndIndex, lineDecoration.className, lineDecoration.metadata, false);
                lineDecorationIndex++;
            }
        }
        return result;
    }
    /**
     * This function is on purpose not split up into multiple functions to allow runtime type inference (i.e. performance reasons).
     * Notice how all the needed data is fully resolved and passed in (i.e. no other calls).
     */
    function _renderLine(input, sb) {
        const fontIsMonospace = input.fontIsMonospace;
        const canUseHalfwidthRightwardsArrow = input.canUseHalfwidthRightwardsArrow;
        const containsForeignElements = input.containsForeignElements;
        const lineContent = input.lineContent;
        const len = input.len;
        const isOverflowing = input.isOverflowing;
        const overflowingCharCount = input.overflowingCharCount;
        const parts = input.parts;
        const fauxIndentLength = input.fauxIndentLength;
        const tabSize = input.tabSize;
        const startVisibleColumn = input.startVisibleColumn;
        const containsRTL = input.containsRTL;
        const spaceWidth = input.spaceWidth;
        const renderSpaceCharCode = input.renderSpaceCharCode;
        const renderWhitespace = input.renderWhitespace;
        const renderControlCharacters = input.renderControlCharacters;
        const characterMapping = new CharacterMapping(len + 1, parts.length);
        let lastCharacterMappingDefined = false;
        let charIndex = 0;
        let visibleColumn = startVisibleColumn;
        let charOffsetInPart = 0; // the character offset in the current part
        let charHorizontalOffset = 0; // the character horizontal position in terms of chars relative to line start
        let partDisplacement = 0;
        if (containsRTL) {
            sb.appendString('<span dir="ltr">');
        }
        else {
            sb.appendString('<span>');
        }
        for (let partIndex = 0, tokensLen = parts.length; partIndex < tokensLen; partIndex++) {
            const part = parts[partIndex];
            const partEndIndex = part.endIndex;
            const partType = part.type;
            const partContainsRTL = part.containsRTL;
            const partRendersWhitespace = (renderWhitespace !== 0 /* RenderWhitespace.None */ && part.isWhitespace());
            const partRendersWhitespaceWithWidth = partRendersWhitespace && !fontIsMonospace && (partType === 'mtkw' /*only whitespace*/ || !containsForeignElements);
            const partIsEmptyAndHasPseudoAfter = (charIndex === partEndIndex && part.isPseudoAfter());
            charOffsetInPart = 0;
            sb.appendString('<span ');
            if (partContainsRTL) {
                sb.appendString('style="unicode-bidi:isolate" ');
            }
            sb.appendString('class="');
            sb.appendString(partRendersWhitespaceWithWidth ? 'mtkz' : partType);
            sb.appendASCIICharCode(34 /* CharCode.DoubleQuote */);
            if (partRendersWhitespace) {
                let partWidth = 0;
                {
                    let _charIndex = charIndex;
                    let _visibleColumn = visibleColumn;
                    for (; _charIndex < partEndIndex; _charIndex++) {
                        const charCode = lineContent.charCodeAt(_charIndex);
                        const charWidth = (charCode === 9 /* CharCode.Tab */ ? (tabSize - (_visibleColumn % tabSize)) : 1) | 0;
                        partWidth += charWidth;
                        if (_charIndex >= fauxIndentLength) {
                            _visibleColumn += charWidth;
                        }
                    }
                }
                if (partRendersWhitespaceWithWidth) {
                    sb.appendString(' style="width:');
                    sb.appendString(String(spaceWidth * partWidth));
                    sb.appendString('px"');
                }
                sb.appendASCIICharCode(62 /* CharCode.GreaterThan */);
                for (; charIndex < partEndIndex; charIndex++) {
                    characterMapping.setColumnInfo(charIndex + 1, partIndex - partDisplacement, charOffsetInPart, charHorizontalOffset);
                    partDisplacement = 0;
                    const charCode = lineContent.charCodeAt(charIndex);
                    let producedCharacters;
                    let charWidth;
                    if (charCode === 9 /* CharCode.Tab */) {
                        producedCharacters = (tabSize - (visibleColumn % tabSize)) | 0;
                        charWidth = producedCharacters;
                        if (!canUseHalfwidthRightwardsArrow || charWidth > 1) {
                            sb.appendCharCode(0x2192); // RIGHTWARDS ARROW
                        }
                        else {
                            sb.appendCharCode(0xFFEB); // HALFWIDTH RIGHTWARDS ARROW
                        }
                        for (let space = 2; space <= charWidth; space++) {
                            sb.appendCharCode(0xA0); // &nbsp;
                        }
                    }
                    else { // must be CharCode.Space
                        producedCharacters = 2;
                        charWidth = 1;
                        sb.appendCharCode(renderSpaceCharCode); // &middot; or word separator middle dot
                        sb.appendCharCode(0x200C); // ZERO WIDTH NON-JOINER
                    }
                    charOffsetInPart += producedCharacters;
                    charHorizontalOffset += charWidth;
                    if (charIndex >= fauxIndentLength) {
                        visibleColumn += charWidth;
                    }
                }
            }
            else {
                sb.appendASCIICharCode(62 /* CharCode.GreaterThan */);
                for (; charIndex < partEndIndex; charIndex++) {
                    characterMapping.setColumnInfo(charIndex + 1, partIndex - partDisplacement, charOffsetInPart, charHorizontalOffset);
                    partDisplacement = 0;
                    const charCode = lineContent.charCodeAt(charIndex);
                    let producedCharacters = 1;
                    let charWidth = 1;
                    switch (charCode) {
                        case 9 /* CharCode.Tab */:
                            producedCharacters = (tabSize - (visibleColumn % tabSize));
                            charWidth = producedCharacters;
                            for (let space = 1; space <= producedCharacters; space++) {
                                sb.appendCharCode(0xA0); // &nbsp;
                            }
                            break;
                        case 32 /* CharCode.Space */:
                            sb.appendCharCode(0xA0); // &nbsp;
                            break;
                        case 60 /* CharCode.LessThan */:
                            sb.appendString('&lt;');
                            break;
                        case 62 /* CharCode.GreaterThan */:
                            sb.appendString('&gt;');
                            break;
                        case 38 /* CharCode.Ampersand */:
                            sb.appendString('&amp;');
                            break;
                        case 0 /* CharCode.Null */:
                            if (renderControlCharacters) {
                                // See https://unicode-table.com/en/blocks/control-pictures/
                                sb.appendCharCode(9216);
                            }
                            else {
                                sb.appendString('&#00;');
                            }
                            break;
                        case 65279 /* CharCode.UTF8_BOM */:
                        case 8232 /* CharCode.LINE_SEPARATOR */:
                        case 8233 /* CharCode.PARAGRAPH_SEPARATOR */:
                        case 133 /* CharCode.NEXT_LINE */:
                            sb.appendCharCode(0xFFFD);
                            break;
                        default:
                            if (strings.isFullWidthCharacter(charCode)) {
                                charWidth++;
                            }
                            // See https://unicode-table.com/en/blocks/control-pictures/
                            if (renderControlCharacters && charCode < 32) {
                                sb.appendCharCode(9216 + charCode);
                            }
                            else if (renderControlCharacters && charCode === 127) {
                                // DEL
                                sb.appendCharCode(9249);
                            }
                            else if (renderControlCharacters && isControlCharacter(charCode)) {
                                sb.appendString('[U+');
                                sb.appendString(to4CharHex(charCode));
                                sb.appendString(']');
                                producedCharacters = 8;
                                charWidth = producedCharacters;
                            }
                            else {
                                sb.appendCharCode(charCode);
                            }
                    }
                    charOffsetInPart += producedCharacters;
                    charHorizontalOffset += charWidth;
                    if (charIndex >= fauxIndentLength) {
                        visibleColumn += charWidth;
                    }
                }
            }
            if (partIsEmptyAndHasPseudoAfter) {
                partDisplacement++;
            }
            else {
                partDisplacement = 0;
            }
            if (charIndex >= len && !lastCharacterMappingDefined && part.isPseudoAfter()) {
                lastCharacterMappingDefined = true;
                characterMapping.setColumnInfo(charIndex + 1, partIndex, charOffsetInPart, charHorizontalOffset);
            }
            sb.appendString('</span>');
        }
        if (!lastCharacterMappingDefined) {
            // When getting client rects for the last character, we will position the
            // text range at the end of the span, insteaf of at the beginning of next span
            characterMapping.setColumnInfo(len + 1, parts.length - 1, charOffsetInPart, charHorizontalOffset);
        }
        if (isOverflowing) {
            sb.appendString('<span class="mtkoverflow">');
            sb.appendString(nls.localize('showMore', "Show more ({0})", renderOverflowingCharCount(overflowingCharCount)));
            sb.appendString('</span>');
        }
        sb.appendString('</span>');
        return new RenderLineOutput(characterMapping, containsRTL, containsForeignElements);
    }
    function to4CharHex(n) {
        return n.toString(16).toUpperCase().padStart(4, '0');
    }
    function renderOverflowingCharCount(n) {
        if (n < 1024) {
            return nls.localize('overflow.chars', "{0} chars", n);
        }
        if (n < 1024 * 1024) {
            return `${(n / 1024).toFixed(1)} KB`;
        }
        return `${(n / 1024 / 1024).toFixed(1)} MB`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xpbmVSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdmlld0xheW91dC92aWV3TGluZVJlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRWaEcsd0NBaURDO0lBWUQsMENBSUM7SUFsWkQsSUFBa0IsZ0JBTWpCO0lBTkQsV0FBa0IsZ0JBQWdCO1FBQ2pDLHVEQUFRLENBQUE7UUFDUiwrREFBWSxDQUFBO1FBQ1osaUVBQWEsQ0FBQTtRQUNiLCtEQUFZLENBQUE7UUFDWixxREFBTyxDQUFBO0lBQ1IsQ0FBQyxFQU5pQixnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQU1qQztJQUVELE1BQWEsU0FBUztRQVdyQixZQUFZLFVBQWtCLEVBQUUsUUFBZ0I7WUFDL0MsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDM0IsQ0FBQztRQUVNLE1BQU0sQ0FBQyxjQUF5QjtZQUN0QyxPQUFPLElBQUksQ0FBQyxXQUFXLEtBQUssY0FBYyxDQUFDLFdBQVc7bUJBQ2xELElBQUksQ0FBQyxTQUFTLEtBQUssY0FBYyxDQUFDLFNBQVMsQ0FBQztRQUNqRCxDQUFDO0tBQ0Q7SUFwQkQsOEJBb0JDO0lBRUQsTUFBYSxlQUFlO1FBMkIzQixZQUNDLHlCQUFrQyxFQUNsQyw4QkFBdUMsRUFDdkMsV0FBbUIsRUFDbkIsd0JBQWlDLEVBQ2pDLFlBQXFCLEVBQ3JCLFdBQW9CLEVBQ3BCLGdCQUF3QixFQUN4QixVQUEyQixFQUMzQixlQUFpQyxFQUNqQyxPQUFlLEVBQ2Ysa0JBQTBCLEVBQzFCLFVBQWtCLEVBQ2xCLFdBQW1CLEVBQ25CLGFBQXFCLEVBQ3JCLHNCQUE4QixFQUM5QixnQkFBd0UsRUFDeEUs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