/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/characterClassifier", "vs/editor/common/textModelEvents", "vs/editor/common/modelLineProjectionData"], function (require, exports, strings, characterClassifier_1, textModelEvents_1, modelLineProjectionData_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MonospaceLineBreaksComputerFactory = void 0;
    class MonospaceLineBreaksComputerFactory {
        static create(options) {
            return new MonospaceLineBreaksComputerFactory(options.get(134 /* EditorOption.wordWrapBreakBeforeCharacters */), options.get(133 /* EditorOption.wordWrapBreakAfterCharacters */));
        }
        constructor(breakBeforeChars, breakAfterChars) {
            this.classifier = new WrappingCharacterClassifier(breakBeforeChars, breakAfterChars);
        }
        createLineBreaksComputer(fontInfo, tabSize, wrappingColumn, wrappingIndent, wordBreak) {
            const requests = [];
            const injectedTexts = [];
            const previousBreakingData = [];
            return {
                addRequest: (lineText, injectedText, previousLineBreakData) => {
                    requests.push(lineText);
                    injectedTexts.push(injectedText);
                    previousBreakingData.push(previousLineBreakData);
                },
                finalize: () => {
                    const columnsForFullWidthChar = fontInfo.typicalFullwidthCharacterWidth / fontInfo.typicalHalfwidthCharacterWidth;
                    const result = [];
                    for (let i = 0, len = requests.length; i < len; i++) {
                        const injectedText = injectedTexts[i];
                        const previousLineBreakData = previousBreakingData[i];
                        if (previousLineBreakData && !previousLineBreakData.injectionOptions && !injectedText) {
                            result[i] = createLineBreaksFromPreviousLineBreaks(this.classifier, previousLineBreakData, requests[i], tabSize, wrappingColumn, columnsForFullWidthChar, wrappingIndent, wordBreak);
                        }
                        else {
                            result[i] = createLineBreaks(this.classifier, requests[i], injectedText, tabSize, wrappingColumn, columnsForFullWidthChar, wrappingIndent, wordBreak);
                        }
                    }
                    arrPool1.length = 0;
                    arrPool2.length = 0;
                    return result;
                }
            };
        }
    }
    exports.MonospaceLineBreaksComputerFactory = MonospaceLineBreaksComputerFactory;
    var CharacterClass;
    (function (CharacterClass) {
        CharacterClass[CharacterClass["NONE"] = 0] = "NONE";
        CharacterClass[CharacterClass["BREAK_BEFORE"] = 1] = "BREAK_BEFORE";
        CharacterClass[CharacterClass["BREAK_AFTER"] = 2] = "BREAK_AFTER";
        CharacterClass[CharacterClass["BREAK_IDEOGRAPHIC"] = 3] = "BREAK_IDEOGRAPHIC"; // for Han and Kana.
    })(CharacterClass || (CharacterClass = {}));
    class WrappingCharacterClassifier extends characterClassifier_1.CharacterClassifier {
        constructor(BREAK_BEFORE, BREAK_AFTER) {
            super(0 /* CharacterClass.NONE */);
            for (let i = 0; i < BREAK_BEFORE.length; i++) {
                this.set(BREAK_BEFORE.charCodeAt(i), 1 /* CharacterClass.BREAK_BEFORE */);
            }
            for (let i = 0; i < BREAK_AFTER.length; i++) {
                this.set(BREAK_AFTER.charCodeAt(i), 2 /* CharacterClass.BREAK_AFTER */);
            }
        }
        get(charCode) {
            if (charCode >= 0 && charCode < 256) {
                return this._asciiMap[charCode];
            }
            else {
                // Initialize CharacterClass.BREAK_IDEOGRAPHIC for these Unicode ranges:
                // 1. CJK Unified Ideographs (0x4E00 -- 0x9FFF)
                // 2. CJK Unified Ideographs Extension A (0x3400 -- 0x4DBF)
                // 3. Hiragana and Katakana (0x3040 -- 0x30FF)
                if ((charCode >= 0x3040 && charCode <= 0x30FF)
                    || (charCode >= 0x3400 && charCode <= 0x4DBF)
                    || (charCode >= 0x4E00 && charCode <= 0x9FFF)) {
                    return 3 /* CharacterClass.BREAK_IDEOGRAPHIC */;
                }
                return (this._map.get(charCode) || this._defaultValue);
            }
        }
    }
    let arrPool1 = [];
    let arrPool2 = [];
    function createLineBreaksFromPreviousLineBreaks(classifier, previousBreakingData, lineText, tabSize, firstLineBreakColumn, columnsForFullWidthChar, wrappingIndent, wordBreak) {
        if (firstLineBreakColumn === -1) {
            return null;
        }
        const len = lineText.length;
        if (len <= 1) {
            return null;
        }
        const isKeepAll = (wordBreak === 'keepAll');
        const prevBreakingOffsets = previousBreakingData.breakOffsets;
        const prevBreakingOffsetsVisibleColumn = previousBreakingData.breakOffsetsVisibleColumn;
        const wrappedTextIndentLength = computeWrappedTextIndentLength(lineText, tabSize, firstLineBreakColumn, columnsForFullWidthChar, wrappingIndent);
        const wrappedLineBreakColumn = firstLineBreakColumn - wrappedTextIndentLength;
        const breakingOffsets = arrPool1;
        const breakingOffsetsVisibleColumn = arrPool2;
        let breakingOffsetsCount = 0;
        let lastBreakingOffset = 0;
        let lastBreakingOffsetVisibleColumn = 0;
        let breakingColumn = firstLineBreakColumn;
        const prevLen = prevBreakingOffsets.length;
        let prevIndex = 0;
        if (prevIndex >= 0) {
            let bestDistance = Math.abs(prevBreakingOffsetsVisibleColumn[prevIndex] - breakingColumn);
            while (prevIndex + 1 < prevLen) {
                const distance = Math.abs(prevBreakingOffsetsVisibleColumn[prevIndex + 1] - breakingColumn);
                if (distance >= bestDistance) {
                    break;
                }
                bestDistance = distance;
                prevIndex++;
            }
        }
        while (prevIndex < prevLen) {
            // Allow for prevIndex to be -1 (for the case where we hit a tab when walking backwards from the first break)
            let prevBreakOffset = prevIndex < 0 ? 0 : prevBreakingOffsets[prevIndex];
            let prevBreakOffsetVisibleColumn = prevIndex < 0 ? 0 : prevBreakingOffsetsVisibleColumn[prevIndex];
            if (lastBreakingOffset > prevBreakOffset) {
                prevBreakOffset = lastBreakingOffset;
                prevBreakOffsetVisibleColumn = lastBreakingOffsetVisibleColumn;
            }
            let breakOffset = 0;
            let breakOffsetVisibleColumn = 0;
            let forcedBreakOffset = 0;
            let forcedBreakOffsetVisibleColumn = 0;
            // initially, we search as much as possible to the right (if it fits)
            if (prevBreakOffsetVisibleColumn <= breakingColumn) {
                let visibleColumn = prevBreakOffsetVisibleColumn;
                let prevCharCode = prevBreakOffset === 0 ? 0 /* CharCode.Null */ : lineText.charCodeAt(prevBreakOffset - 1);
                let prevCharCodeClass = prevBreakOffset === 0 ? 0 /* CharacterClass.NONE */ : classifier.get(prevCharCode);
                let entireLineFits = true;
                for (let i = prevBreakOffset; i < len; i++) {
                    const charStartOffset = i;
                    const charCode = lineText.charCodeAt(i);
                    let charCodeClass;
                    let charWidth;
                    if (strings.isHighSurrogate(charCode)) {
                        // A surrogate pair must always be considered as a single unit, so it is never to be broken
                        i++;
                        charCodeClass = 0 /* CharacterClass.NONE */;
                        charWidth = 2;
                    }
                    else {
                        charCodeClass = classifier.get(charCode);
                        charWidth = computeCharWidth(charCode, visibleColumn, tabSize, columnsForFullWidthChar);
                    }
                    if (charStartOffset > lastBreakingOffset && canBreak(prevCharCode, prevCharCodeClass, charCode, charCodeClass, isKeepAll)) {
                        breakOffset = charStartOffset;
                        breakOffsetVisibleColumn = visibleColumn;
                    }
                    visibleColumn += charWidth;
                    // check if adding character at `i` will go over the breaking column
                    if (visibleColumn > breakingColumn) {
                        // We need to break at least before character at `i`:
                        if (charStartOffset > lastBreakingOffset) {
                            forcedBreakOffset = charStartOffset;
                            forcedBreakOffsetVisibleColumn = visibleColumn - charWidth;
                        }
                        else {
                            // we need to advance at least by one character
                            forcedBreakOffset = i + 1;
                            forcedBreakOffsetVisibleColumn = visibleColumn;
                        }
                        if (visibleColumn - breakOffsetVisibleColumn > wrappedLineBreakColumn) {
                            // Cannot break at `breakOffset` => reset it if it was set
                            breakOffset = 0;
                        }
                        entireLineFits = false;
                        break;
                    }
                    prevCharCode = charCode;
                    prevCharCodeClass = charCodeClass;
                }
                if (entireLineFits) {
                    // there is no more need to break => stop the outer loop!
                    if (breakingOffsetsCount > 0) {
                        // Add last segment, no need to assign to `lastBreakingOffset` and `lastBreakingOffsetVisibleColumn`
                        breakingOffsets[breakingOffsetsCount] = prevBreakingOffsets[prevBreakingOffsets.length - 1];
                        breakingOffsetsVisibleColumn[breakingOffsetsCount] = prevBreakingOffsetsVisibleColumn[prevBreakingOffsets.length - 1];
                        breakingOffsetsCount++;
                    }
                    break;
                }
            }
            if (breakOffset === 0) {
                // must search left
                let visibleColumn = prevBreakOffsetVisibleColumn;
                let charCode = lineText.charCodeAt(prevBreakOffset);
                let charCodeClass = classifier.get(charCode);
                let hitATabCharacter = false;
                for (let i = prevBreakOffset - 1; i >= lastBreakingOffset; i--) {
                    const charStartOffset = i + 1;
                    const prevCharCode = lineText.charCodeAt(i);
                    if (prevCharCode === 9 /* CharCode.Tab */) {
                        // cannot determine the width of a tab when going backwards, so we must go forwards
                        hitATabCharacter = true;
                        break;
                    }
                    let prevCharCodeClass;
                    let prevCharWidth;
                    if (strings.isLowSurrogate(prevCharCode)) {
                        // A surrogate pair must always be considered as a single unit, so it is never to be broken
                        i--;
                        prevCharCodeClass = 0 /* CharacterClass.NONE */;
                        prevCharWidth = 2;
                    }
                    else {
                        prevCharCodeClass = classifier.get(prevCharCode);
                        prevCharWidth = (strings.isFullWidthCharacter(prevCharCode) ? columnsForFullWidthChar : 1);
                    }
                    if (visibleColumn <= breakingColumn) {
                        if (forcedBreakOffset === 0) {
                            forcedBreakOffset = charStartOffset;
                            forcedBreakOffsetVisibleColumn = visibleColumn;
                        }
                        if (visibleColumn <= breakingColumn - wrappedLineBreakColumn) {
                            // went too far!
                            break;
                        }
                        if (canBreak(prevCharCode, prevCharCodeClass, charCode, charCodeClass, isKeepAll)) {
                            breakOffset = charStartOffset;
                            breakOffsetVisibleColumn = visibleColumn;
                            break;
                        }
                    }
                    visibleColumn -= prevCharWidth;
                    charCode = prevCharCode;
                    charCodeClass = prevCharCodeClass;
                }
                if (breakOffset !== 0) {
                    const remainingWidthOfNextLine = wrappedLineBreakColumn - (forcedBreakOffsetVisibleColumn - breakOffsetVisibleColumn);
                    if (remainingWidthOfNextLine <= tabSize) {
                        const charCodeAtForcedBreakOffset = lineText.charCodeAt(forcedBreakOffset);
                        let charWidth;
                        if (strings.isHighSurrogate(charCodeAtForcedBreakOffset)) {
                            // A surrogate pair must always be considered as a single unit, so it is never to be broken
                            charWidth = 2;
                        }
                        else {
                            charWidth = computeCharWidth(charCodeAtForcedBreakOffset, forcedBreakOffsetVisibleColumn, tabSize, columnsForFullWidthChar);
                        }
                        if (remainingWidthOfNextLine - charWidth < 0) {
                            // it is not worth it to break at breakOffset, it just introduces an extra needless line!
                            breakOffset = 0;
                        }
                    }
                }
                if (hitATabCharacter) {
                    // cannot determine the width of a tab when going backwards, so we must go forwards from the previous break
                    prevIndex--;
                    continue;
                }
            }
            if (breakOffset === 0) {
                // Could not find a good breaking point
                breakOffset = forcedBreakOffset;
                breakOffsetVisibleColumn = forcedBreakOffsetVisibleColumn;
            }
            if (breakOffset <= lastBreakingOffset) {
                // Make sure that we are advancing (at least one character)
                const charCode = lineText.charCodeAt(lastBreakingOffset);
                if (strings.isHighSurrogate(charCode)) {
                    // A surrogate pair must always be considered as a single unit, so it is never to be broken
                    breakOffset = lastBreakingOffset + 2;
                    breakOffsetVisibleColumn = lastBreakingOffsetVisibleColumn + 2;
                }
                else {
                    breakOffset = lastBreakingOffset + 1;
                    breakOffsetVisibleColumn = lastBreakingOffsetVisibleColumn + computeCharWidth(charCode, lastBreakingOffsetVisibleColumn, tabSize, columnsForFullWidthChar);
                }
            }
            lastBreakingOffset = breakOffset;
            breakingOffsets[breakingOffsetsCount] = breakOffset;
            lastBreakingOffsetVisibleColumn = breakOffsetVisibleColumn;
            breakingOffsetsVisibleColumn[breakingOffsetsCount] = breakOffsetVisibleColumn;
            breakingOffsetsCount++;
            breakingColumn = breakOffsetVisibleColumn + wrappedLineBreakColumn;
            while (prevIndex < 0 || (prevIndex < prevLen && prevBreakingOffsetsVisibleColumn[prevIndex] < breakOffsetVisibleColumn)) {
                prevIndex++;
            }
            let bestDistance = Math.abs(prevBreakingOffsetsVisibleColumn[prevIndex] - breakingColumn);
            while (prevIndex + 1 < prevLen) {
                const distance = Math.abs(prevBreakingOffsetsVisibleColumn[prevIndex + 1] - breakingColumn);
                if (distance >= bestDistance) {
                    break;
                }
                bestDistance = distance;
                prevIndex++;
            }
        }
        if (breakingOffsetsCount === 0) {
            return null;
        }
        // Doing here some object reuse which ends up helping a huge deal with GC pauses!
        breakingOffsets.length = breakingOffsetsCount;
        breakingOffsetsVisibleColumn.length = breakingOffsetsCount;
        arrPool1 = previousBreakingData.breakOffsets;
        arrPool2 = previousBreakingData.breakOffsetsVisibleColumn;
        previousBreakingData.breakOffsets = breakingOffsets;
        previousBreakingData.breakOffsetsVisibleColumn = breakingOffsetsVisibleColumn;
        previousBreakingData.wrappedTextIndentLength = wrappedTextIndentLength;
        return previousBreakingData;
    }
    function createLineBreaks(classifier, _lineText, injectedTexts, tabSize, firstLineBreakColumn, columnsForFullWidthChar, wrappingIndent, wordBreak) {
        const lineText = textModelEvents_1.LineInjectedText.applyInjectedText(_lineText, injectedTexts);
        let injectionOptions;
        let injectionOffsets;
        if (injectedTexts && injectedTexts.length > 0) {
            injectionOptions = injectedTexts.map(t => t.options);
            injectionOffsets = injectedTexts.map(text => text.column - 1);
        }
        else {
            injectionOptions = null;
            injectionOffsets = null;
        }
        if (firstLineBreakColumn === -1) {
            if (!injectionOptions) {
                return null;
            }
            // creating a `LineBreakData` with an invalid `breakOffsetsVisibleColumn` is OK
            // because `breakOffsetsVisibleColumn` will never be used because it contains injected text
            return new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, [lineText.length], [], 0);
        }
        const len = lineText.length;
        if (len <= 1) {
            if (!injectionOptions) {
                return null;
            }
            // creating a `LineBreakData` with an invalid `breakOffsetsVisibleColumn` is OK
            // because `breakOffsetsVisibleColumn` will never be used because it contains injected text
            return new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, [lineText.length], [], 0);
        }
        const isKeepAll = (wordBreak === 'keepAll');
        const wrappedTextIndentLength = computeWrappedTextIndentLength(lineText, tabSize, firstLineBreakColumn, columnsForFullWidthChar, wrappingIndent);
        const wrappedLineBreakColumn = firstLineBreakColumn - wrappedTextIndentLength;
        const breakingOffsets = [];
        const breakingOffsetsVisibleColumn = [];
        let breakingOffsetsCount = 0;
        let breakOffset = 0;
        let breakOffsetVisibleColumn = 0;
        let breakingColumn = firstLineBreakColumn;
        let prevCharCode = lineText.charCodeAt(0);
        let prevCharCodeClass = classifier.get(prevCharCode);
        let visibleColumn = computeCharWidth(prevCharCode, 0, tabSize, columnsForFullWidthChar);
        let startOffset = 1;
        if (strings.isHighSurrogate(prevCharCode)) {
            // A surrogate pair must always be considered as a single unit, so it is never to be broken
            visibleColumn += 1;
            prevCharCode = lineText.charCodeAt(1);
            prevCharCodeClass = classifier.get(prevCharCode);
            startOffset++;
        }
        for (let i = startOffset; i < len; i++) {
            const charStartOffset = i;
            const charCode = lineText.charCodeAt(i);
            let charCodeClass;
            let charWidth;
            if (strings.isHighSurrogate(charCode)) {
                // A surrogate pair must always be considered as a single unit, so it is never to be broken
                i++;
                charCodeClass = 0 /* CharacterClass.NONE */;
                charWidth = 2;
            }
            else {
                charCodeClass = classifier.get(charCode);
                charWidth = computeCharWidth(charCode, visibleColumn, tabSize, columnsForFullWidthChar);
            }
            if (canBreak(prevCharCode, prevCharCodeClass, charCode, charCodeClass, isKeepAll)) {
                breakOffset = charStartOffset;
                breakOffsetVisibleColumn = visibleColumn;
            }
            visibleColumn += charWidth;
            // check if adding character at `i` will go over the breaking column
            if (visibleColumn > breakingColumn) {
                // We need to break at least before character at `i`:
                if (breakOffset === 0 || visibleColumn - breakOffsetVisibleColumn > wrappedLineBreakColumn) {
                    // Cannot break at `breakOffset`, must break at `i`
                    breakOffset = charStartOffset;
                    breakOffsetVisibleColumn = visibleColumn - charWidth;
                }
                breakingOffsets[breakingOffsetsCount] = breakOffset;
                breakingOffsetsVisibleColumn[breakingOffsetsCount] = breakOffsetVisibleColumn;
                breakingOffsetsCount++;
                breakingColumn = breakOffsetVisibleColumn + wrappedLineBreakColumn;
                breakOffset = 0;
            }
            prevCharCode = charCode;
            prevCharCodeClass = charCodeClass;
        }
        if (breakingOffsetsCount === 0 && (!injectedTexts || injectedTexts.length === 0)) {
            return null;
        }
        // Add last segment
        breakingOffsets[breakingOffsetsCount] = len;
        breakingOffsetsVisibleColumn[breakingOffsetsCount] = visibleColumn;
        return new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, breakingOffsets, breakingOffsetsVisibleColumn, wrappedTextIndentLength);
    }
    function computeCharWidth(charCode, visibleColumn, tabSize, columnsForFullWidthChar) {
        if (charCode === 9 /* CharCode.Tab */) {
            return (tabSize - (visibleColumn % tabSize));
        }
        if (strings.isFullWidthCharacter(charCode)) {
            return columnsForFullWidthChar;
        }
        if (charCode < 32) {
            // when using `editor.renderControlCharacters`, the substitutions are often wide
            return columnsForFullWidthChar;
        }
        return 1;
    }
    function tabCharacterWidth(visibleColumn, tabSize) {
        return (tabSize - (visibleColumn % tabSize));
    }
    /**
     * Kinsoku Shori : Don't break after a leading character, like an open bracket
     * Kinsoku Shori : Don't break before a trailing character, like a period
     */
    function canBreak(prevCharCode, prevCharCodeClass, charCode, charCodeClass, isKeepAll) {
        return (charCode !== 32 /* CharCode.Space */
            && ((prevCharCodeClass === 2 /* CharacterClass.BREAK_AFTER */ && charCodeClass !== 2 /* CharacterClass.BREAK_AFTER */) // break at the end of multiple BREAK_AFTER
                || (prevCharCodeClass !== 1 /* CharacterClass.BREAK_BEFORE */ && charCodeClass === 1 /* CharacterClass.BREAK_BEFORE */) // break at the start of multiple BREAK_BEFORE
                || (!isKeepAll && prevCharCodeClass === 3 /* CharacterClass.BREAK_IDEOGRAPHIC */ && charCodeClass !== 2 /* CharacterClass.BREAK_AFTER */)
                || (!isKeepAll && charCodeClass === 3 /* CharacterClass.BREAK_IDEOGRAPHIC */ && prevCharCodeClass !== 1 /* CharacterClass.BREAK_BEFORE */)));
    }
    function computeWrappedTextIndentLength(lineText, tabSize, firstLineBreakColumn, columnsForFullWidthChar, wrappingIndent) {
        let wrappedTextIndentLength = 0;
        if (wrappingIndent !== 0 /* WrappingIndent.None */) {
            const firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineText);
            if (firstNonWhitespaceIndex !== -1) {
                // Track existing indent
                for (let i = 0; i < firstNonWhitespaceIndex; i++) {
                    const charWidth = (lineText.charCodeAt(i) === 9 /* CharCode.Tab */ ? tabCharacterWidth(wrappedTextIndentLength, tabSize) : 1);
                    wrappedTextIndentLength += charWidth;
                }
                // Increase indent of continuation lines, if desired
                const numberOfAdditionalTabs = (wrappingIndent === 3 /* WrappingIndent.DeepIndent */ ? 2 : wrappingIndent === 2 /* WrappingIndent.Indent */ ? 1 : 0);
                for (let i = 0; i < numberOfAdditionalTabs; i++) {
                    const charWidth = tabCharacterWidth(wrappedTextIndentLength, tabSize);
                    wrappedTextIndentLength += charWidth;
                }
                // Force sticking to beginning of line if no character would fit except for the indentation
                if (wrappedTextIndentLength + columnsForFullWidthChar > firstLineBreakColumn) {
                    wrappedTextIndentLength = 0;
                }
            }
        }
        return wrappedTextIndentLength;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ub3NwYWNlTGluZUJyZWFrc0NvbXB1dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3TW9kZWwvbW9ub3NwYWNlTGluZUJyZWFrc0NvbXB1dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFhLGtDQUFrQztRQUN2QyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQStCO1lBQ25ELE9BQU8sSUFBSSxrQ0FBa0MsQ0FDNUMsT0FBTyxDQUFDLEdBQUcsc0RBQTRDLEVBQ3ZELE9BQU8sQ0FBQyxHQUFHLHFEQUEyQyxDQUN0RCxDQUFDO1FBQ0gsQ0FBQztRQUlELFlBQVksZ0JBQXdCLEVBQUUsZUFBdUI7WUFDNUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLDJCQUEyQixDQUFDLGdCQUFnQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFFTSx3QkFBd0IsQ0FBQyxRQUFrQixFQUFFLE9BQWUsRUFBRSxjQUFzQixFQUFFLGNBQThCLEVBQUUsU0FBK0I7WUFDM0osTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1lBQzlCLE1BQU0sYUFBYSxHQUFrQyxFQUFFLENBQUM7WUFDeEQsTUFBTSxvQkFBb0IsR0FBdUMsRUFBRSxDQUFDO1lBQ3BFLE9BQU87Z0JBQ04sVUFBVSxFQUFFLENBQUMsUUFBZ0IsRUFBRSxZQUF1QyxFQUFFLHFCQUFxRCxFQUFFLEVBQUU7b0JBQ2hJLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3hCLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ2pDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO2dCQUNELFFBQVEsRUFBRSxHQUFHLEVB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