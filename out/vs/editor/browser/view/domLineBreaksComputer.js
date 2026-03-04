/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/trustedTypes", "vs/base/common/strings", "vs/base/common/types", "vs/editor/browser/config/domFontInfo", "vs/editor/common/core/stringBuilder", "vs/editor/common/modelLineProjectionData", "vs/editor/common/textModelEvents"], function (require, exports, trustedTypes_1, strings, types_1, domFontInfo_1, stringBuilder_1, modelLineProjectionData_1, textModelEvents_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DOMLineBreaksComputerFactory = void 0;
    const ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('domLineBreaksComputer', { createHTML: value => value });
    class DOMLineBreaksComputerFactory {
        static create(targetWindow) {
            return new DOMLineBreaksComputerFactory(new WeakRef(targetWindow));
        }
        constructor(targetWindow) {
            this.targetWindow = targetWindow;
        }
        createLineBreaksComputer(fontInfo, tabSize, wrappingColumn, wrappingIndent, wordBreak) {
            const requests = [];
            const injectedTexts = [];
            return {
                addRequest: (lineText, injectedText, previousLineBreakData) => {
                    requests.push(lineText);
                    injectedTexts.push(injectedText);
                },
                finalize: () => {
                    return createLineBreaks((0, types_1.assertIsDefined)(this.targetWindow.deref()), requests, fontInfo, tabSize, wrappingColumn, wrappingIndent, wordBreak, injectedTexts);
                }
            };
        }
    }
    exports.DOMLineBreaksComputerFactory = DOMLineBreaksComputerFactory;
    function createLineBreaks(targetWindow, requests, fontInfo, tabSize, firstLineBreakColumn, wrappingIndent, wordBreak, injectedTextsPerLine) {
        function createEmptyLineBreakWithPossiblyInjectedText(requestIdx) {
            const injectedTexts = injectedTextsPerLine[requestIdx];
            if (injectedTexts) {
                const lineText = textModelEvents_1.LineInjectedText.applyInjectedText(requests[requestIdx], injectedTexts);
                const injectionOptions = injectedTexts.map(t => t.options);
                const injectionOffsets = injectedTexts.map(text => text.column - 1);
                // creating a `LineBreakData` with an invalid `breakOffsetsVisibleColumn` is OK
                // because `breakOffsetsVisibleColumn` will never be used because it contains injected text
                return new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, [lineText.length], [], 0);
            }
            else {
                return null;
            }
        }
        if (firstLineBreakColumn === -1) {
            const result = [];
            for (let i = 0, len = requests.length; i < len; i++) {
                result[i] = createEmptyLineBreakWithPossiblyInjectedText(i);
            }
            return result;
        }
        const overallWidth = Math.round(firstLineBreakColumn * fontInfo.typicalHalfwidthCharacterWidth);
        const additionalIndent = (wrappingIndent === 3 /* WrappingIndent.DeepIndent */ ? 2 : wrappingIndent === 2 /* WrappingIndent.Indent */ ? 1 : 0);
        const additionalIndentSize = Math.round(tabSize * additionalIndent);
        const additionalIndentLength = Math.ceil(fontInfo.spaceWidth * additionalIndentSize);
        const containerDomNode = document.createElement('div');
        (0, domFontInfo_1.applyFontInfo)(containerDomNode, fontInfo);
        const sb = new stringBuilder_1.StringBuilder(10000);
        const firstNonWhitespaceIndices = [];
        const wrappedTextIndentLengths = [];
        const renderLineContents = [];
        const allCharOffsets = [];
        const allVisibleColumns = [];
        for (let i = 0; i < requests.length; i++) {
            const lineContent = textModelEvents_1.LineInjectedText.applyInjectedText(requests[i], injectedTextsPerLine[i]);
            let firstNonWhitespaceIndex = 0;
            let wrappedTextIndentLength = 0;
            let width = overallWidth;
            if (wrappingIndent !== 0 /* WrappingIndent.None */) {
                firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(lineContent);
                if (firstNonWhitespaceIndex === -1) {
                    // all whitespace line
                    firstNonWhitespaceIndex = 0;
                }
                else {
                    // Track existing indent
                    for (let i = 0; i < firstNonWhitespaceIndex; i++) {
                        const charWidth = (lineContent.charCodeAt(i) === 9 /* CharCode.Tab */
                            ? (tabSize - (wrappedTextIndentLength % tabSize))
                            : 1);
                        wrappedTextIndentLength += charWidth;
                    }
                    const indentWidth = Math.ceil(fontInfo.spaceWidth * wrappedTextIndentLength);
                    // Force sticking to beginning of line if no character would fit except for the indentation
                    if (indentWidth + fontInfo.typicalFullwidthCharacterWidth > overallWidth) {
                        firstNonWhitespaceIndex = 0;
                        wrappedTextIndentLength = 0;
                    }
                    else {
                        width = overallWidth - indentWidth;
                    }
                }
            }
            const renderLineContent = lineContent.substr(firstNonWhitespaceIndex);
            const tmp = renderLine(renderLineContent, wrappedTextIndentLength, tabSize, width, sb, additionalIndentLength);
            firstNonWhitespaceIndices[i] = firstNonWhitespaceIndex;
            wrappedTextIndentLengths[i] = wrappedTextIndentLength;
            renderLineContents[i] = renderLineContent;
            allCharOffsets[i] = tmp[0];
            allVisibleColumns[i] = tmp[1];
        }
        const html = sb.build();
        const trustedhtml = ttPolicy?.createHTML(html) ?? html;
        containerDomNode.innerHTML = trustedhtml;
        containerDomNode.style.position = 'absolute';
        containerDomNode.style.top = '10000';
        if (wordBreak === 'keepAll') {
            // word-break: keep-all; overflow-wrap: anywhere
            containerDomNode.style.wordBreak = 'keep-all';
            containerDomNode.style.overflowWrap = 'anywhere';
        }
        else {
            // overflow-wrap: break-word
            containerDomNode.style.wordBreak = 'inherit';
            containerDomNode.style.overflowWrap = 'break-word';
        }
        targetWindow.document.body.appendChild(containerDomNode);
        const range = document.createRange();
        const lineDomNodes = Array.prototype.slice.call(containerDomNode.children, 0);
        const result = [];
        for (let i = 0; i < requests.length; i++) {
            const lineDomNode = lineDomNodes[i];
            const breakOffsets = readLineBreaks(range, lineDomNode, renderLineContents[i], allCharOffsets[i]);
            if (breakOffsets === null) {
                result[i] = createEmptyLineBreakWithPossiblyInjectedText(i);
                continue;
            }
            const firstNonWhitespaceIndex = firstNonWhitespaceIndices[i];
            const wrappedTextIndentLength = wrappedTextIndentLengths[i] + additionalIndentSize;
            const visibleColumns = allVisibleColumns[i];
            const breakOffsetsVisibleColumn = [];
            for (let j = 0, len = breakOffsets.length; j < len; j++) {
                breakOffsetsVisibleColumn[j] = visibleColumns[breakOffsets[j]];
            }
            if (firstNonWhitespaceIndex !== 0) {
                // All break offsets are relative to the renderLineContent, make them absolute again
                for (let j = 0, len = breakOffsets.length; j < len; j++) {
                    breakOffsets[j] += firstNonWhitespaceIndex;
                }
            }
            let injectionOptions;
            let injectionOffsets;
            const curInjectedTexts = injectedTextsPerLine[i];
            if (curInjectedTexts) {
                injectionOptions = curInjectedTexts.map(t => t.options);
                injectionOffsets = curInjectedTexts.map(text => text.column - 1);
            }
            else {
                injectionOptions = null;
                injectionOffsets = null;
            }
            result[i] = new modelLineProjectionData_1.ModelLineProjectionData(injectionOffsets, injectionOptions, breakOffsets, breakOffsetsVisibleColumn, wrappedTextIndentLength);
        }
        targetWindow.document.body.removeChild(containerDomNode);
        return result;
    }
    var Constants;
    (function (Constants) {
        Constants[Constants["SPAN_MODULO_LIMIT"] = 16384] = "SPAN_MODULO_LIMIT";
    })(Constants || (Constants = {}));
    function renderLine(lineContent, initialVisibleColumn, tabSize, width, sb, wrappingIndentLength) {
        if (wrappingIndentLength !== 0) {
            const hangingOffset = String(wrappingIndentLength);
            sb.appendString('<div style="text-indent: -');
            sb.appendString(hangingOffset);
            sb.appendString('px; padding-left: ');
            sb.appendString(hangingOffset);
            sb.appendString('px; box-sizing: border-box; width:');
        }
        else {
            sb.appendString('<div style="width:');
        }
        sb.appendString(String(width));
        sb.appendString('px;">');
        // if (containsRTL) {
        // 	sb.appendASCIIString('" dir="ltr');
        // }
        const len = lineContent.length;
        let visibleColumn = initialVisibleColumn;
        let charOffset = 0;
        const charOffsets = [];
        const visibleColumns = [];
        let nextCharCode = (0 < len ? lineContent.charCodeAt(0) : 0 /* CharCode.Null */);
        sb.appendString('<span>');
        for (let charIndex = 0; charIndex < len; charIndex++) {
            if (charIndex !== 0 && charIndex % 16384 /* Constants.SPAN_MODULO_LIMIT */ === 0) {
                sb.appendString('</span><span>');
            }
            charOffsets[charIndex] = charOffset;
            visibleColumns[charIndex] = visibleColumn;
            const charCode = nextCharCode;
            nextCharCode = (charIndex + 1 < len ? lineContent.charCodeAt(charIndex + 1) : 0 /* CharCode.Null */);
            let producedCharacters = 1;
            let charWidth = 1;
            switch (charCode) {
                case 9 /* CharCode.Tab */:
                    producedCharacters = (tabSize - (visibleColumn % tabSize));
                    charWidth = producedCharacters;
                    for (let space = 1; space <= producedCharacters; space++) {
                        if (space < producedCharacters) {
                            sb.appendCharCode(0xA0); // &nbsp;
                        }
                        else {
                            sb.appendASCIICharCode(32 /* CharCode.Space */);
                        }
                    }
                    break;
                case 32 /* CharCode.Space */:
                    if (nextCharCode === 32 /* CharCode.Space */) {
                        sb.appendCharCode(0xA0); // &nbsp;
                    }
                    else {
                        sb.appendASCIICharCode(32 /* CharCode.Space */);
                    }
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
                    sb.appendString('&#00;');
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
                    if (charCode < 32) {
                        sb.appendCharCode(9216 + charCode);
                    }
                    else {
                        sb.appendCharCode(charCode);
                    }
            }
            charOffset += producedCharacters;
            visibleColumn += charWidth;
        }
        sb.appendString('</span>');
        charOffsets[lineContent.length] = charOffset;
        visibleColumns[lineContent.length] = visibleColumn;
        sb.appendString('</div>');
        return [charOffsets, visibleColumns];
    }
    function readLineBreaks(range, lineDomNode, lineContent, charOffsets) {
        if (lineContent.length <= 1) {
            return null;
        }
        const spans = Array.prototype.slice.call(lineDomNode.children, 0);
        const breakOffsets = [];
        try {
            discoverBreaks(range, spans, charOffsets, 0, null, lineContent.length - 1, null, breakOffsets);
        }
        catch (err) {
            console.log(err);
            return null;
        }
        if (breakOffsets.length === 0) {
            return null;
        }
        breakOffsets.push(lineContent.length);
        return breakOffsets;
    }
    function discoverBreaks(range, spans, charOffsets, low, lowRects, high, highRects, result) {
        if (low === high) {
            return;
        }
        lowRects = lowRects || readClientRect(range, spans, charOffsets[low], charOffsets[low + 1]);
        highRects = highRects || readClientRect(range, spans, charOffsets[high], charOffsets[high + 1]);
        if (Math.abs(lowRects[0].top - highRects[0].top) <= 0.1) {
            // same line
            return;
        }
        // there is at least one line break between these two offsets
        if (low + 1 === high) {
            // the two characters are adjacent, so the line break must be exactly between them
            result.push(high);
            return;
        }
        const mid = low + ((high - low) / 2) | 0;
        const midRects = readClientRect(range, spans, charOffsets[mid], charOffsets[mid + 1]);
        discoverBreaks(range, spans, charOffsets, low, lowRects, mid, midRects, result);
        discoverBreaks(range, spans, charOffsets, mid, midRects, high, highRects, result);
    }
    function readClientRect(range, spans, startOffset, endOffset) {
        range.setStart(spans[(startOffset / 16384 /* Constants.SPAN_MODULO_LIMIT */) | 0].firstChild, startOffset % 16384 /* Constants.SPAN_MODULO_LIMIT */);
        range.setEnd(spans[(endOffset / 16384 /* Constants.SPAN_MODULO_LIMIT */) | 0].firstChild, endOffset % 16384 /* Constants.SPAN_MODULO_LIMIT */);
        return range.getClientRects();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tTGluZUJyZWFrc0NvbXB1dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlldy9kb21MaW5lQnJlYWtzQ29tcHV0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLE1BQU0sUUFBUSxHQUFHLElBQUEsdUNBQXdCLEVBQUMsdUJBQXVCLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBRW5HLE1BQWEsNEJBQTRCO1FBRWpDLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBb0I7WUFDeEMsT0FBTyxJQUFJLDRCQUE0QixDQUFDLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUVELFlBQW9CLFlBQTZCO1lBQTdCLGlCQUFZLEdBQVosWUFBWSxDQUFpQjtRQUNqRCxDQUFDO1FBRU0sd0JBQXdCLENBQUMsUUFBa0IsRUFBRSxPQUFlLEVBQUUsY0FBc0IsRUFBRSxjQUE4QixFQUFFLFNBQStCO1lBQzNKLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztZQUM5QixNQUFNLGFBQWEsR0FBa0MsRUFBRSxDQUFDO1lBQ3hELE9BQU87Z0JBQ04sVUFBVSxFQUFFLENBQUMsUUFBZ0IsRUFBRSxZQUF1QyxFQUFFLHFCQUFxRCxFQUFFLEVBQUU7b0JBQ2hJLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3hCLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7Z0JBQ0QsUUFBUSxFQUFFLEdBQUcsRUFBRTtvQkFDZCxPQUFPLGdCQUFnQixDQUFDLElBQUEsdUJBQWUsRUFBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFB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