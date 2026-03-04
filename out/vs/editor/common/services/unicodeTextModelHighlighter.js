/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/model/textModelSearch", "vs/base/common/strings", "vs/base/common/assert", "vs/editor/common/core/wordHelper"], function (require, exports, range_1, textModelSearch_1, strings, assert_1, wordHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnicodeHighlighterReasonKind = exports.UnicodeTextModelHighlighter = void 0;
    class UnicodeTextModelHighlighter {
        static computeUnicodeHighlights(model, options, range) {
            const startLine = range ? range.startLineNumber : 1;
            const endLine = range ? range.endLineNumber : model.getLineCount();
            const codePointHighlighter = new CodePointHighlighter(options);
            const candidates = codePointHighlighter.getCandidateCodePoints();
            let regex;
            if (candidates === 'allNonBasicAscii') {
                regex = new RegExp('[^\\t\\n\\r\\x20-\\x7E]', 'g');
            }
            else {
                regex = new RegExp(`${buildRegExpCharClassExpr(Array.from(candidates))}`, 'g');
            }
            const searcher = new textModelSearch_1.Searcher(null, regex);
            const ranges = [];
            let hasMore = false;
            let m;
            let ambiguousCharacterCount = 0;
            let invisibleCharacterCount = 0;
            let nonBasicAsciiCharacterCount = 0;
            forLoop: for (let lineNumber = startLine, lineCount = endLine; lineNumber <= lineCount; lineNumber++) {
                const lineContent = model.getLineContent(lineNumber);
                const lineLength = lineContent.length;
                // Reset regex to search from the beginning
                searcher.reset(0);
                do {
                    m = searcher.next(lineContent);
                    if (m) {
                        let startIndex = m.index;
                        let endIndex = m.index + m[0].length;
                        // Extend range to entire code point
                        if (startIndex > 0) {
                            const charCodeBefore = lineContent.charCodeAt(startIndex - 1);
                            if (strings.isHighSurrogate(charCodeBefore)) {
                                startIndex--;
                            }
                        }
                        if (endIndex + 1 < lineLength) {
                            const charCodeBefore = lineContent.charCodeAt(endIndex - 1);
                            if (strings.isHighSurrogate(charCodeBefore)) {
                                endIndex++;
                            }
                        }
                        const str = lineContent.substring(startIndex, endIndex);
                        let word = (0, wordHelper_1.getWordAtText)(startIndex + 1, wordHelper_1.DEFAULT_WORD_REGEXP, lineContent, 0);
                        if (word && word.endColumn <= startIndex + 1) {
                            // The word does not include the problematic character, ignore the word
                            word = null;
                        }
                        const highlightReason = codePointHighlighter.shouldHighlightNonBasicASCII(str, word ? word.word : null);
                        if (highlightReason !== 0 /* SimpleHighlightReason.None */) {
                            if (highlightReason === 3 /* SimpleHighlightReason.Ambiguous */) {
                                ambiguousCharacterCount++;
                            }
                            else if (highlightReason === 2 /* SimpleHighlightReason.Invisible */) {
                                invisibleCharacterCount++;
                            }
                            else if (highlightReason === 1 /* SimpleHighlightReason.NonBasicASCII */) {
                                nonBasicAsciiCharacterCount++;
                            }
                            else {
                                (0, assert_1.assertNever)(highlightReason);
                            }
                            const MAX_RESULT_LENGTH = 1000;
                            if (ranges.length >= MAX_RESULT_LENGTH) {
                                hasMore = true;
                                break forLoop;
                            }
                            ranges.push(new range_1.Range(lineNumber, startIndex + 1, lineNumber, endIndex + 1));
                        }
                    }
                } while (m);
            }
            return {
                ranges,
                hasMore,
                ambiguousCharacterCount,
                invisibleCharacterCount,
                nonBasicAsciiCharacterCount
            };
        }
        static computeUnicodeHighlightReason(char, options) {
            const codePointHighlighter = new CodePointHighlighter(options);
            const reason = codePointHighlighter.shouldHighlightNonBasicASCII(char, null);
            switch (reason) {
                case 0 /* SimpleHighlightReason.None */:
                    return null;
                case 2 /* SimpleHighlightReason.Invisible */:
                    return { kind: 1 /* UnicodeHighlighterReasonKind.Invisible */ };
                case 3 /* SimpleHighlightReason.Ambiguous */: {
                    const codePoint = char.codePointAt(0);
                    const primaryConfusable = codePointHighlighter.ambiguousCharacters.getPrimaryConfusable(codePoint);
                    const notAmbiguousInLocales = strings.AmbiguousCharacters.getLocales().filter((l) => !strings.AmbiguousCharacters.getInstance(new Set([...options.allowedLocales, l])).isAmbiguous(codePoint));
                    return { kind: 0 /* UnicodeHighlighterReasonKind.Ambiguous */, confusableWith: String.fromCodePoint(primaryConfusable), notAmbiguousInLocales };
                }
                case 1 /* SimpleHighlightReason.NonBasicASCII */:
                    return { kind: 2 /* UnicodeHighlighterReasonKind.NonBasicAscii */ };
            }
        }
    }
    exports.UnicodeTextModelHighlighter = UnicodeTextModelHighlighter;
    function buildRegExpCharClassExpr(codePoints, flags) {
        const src = `[${strings.escapeRegExpCharacters(codePoints.map((i) => String.fromCodePoint(i)).join(''))}]`;
        return src;
    }
    var UnicodeHighlighterReasonKind;
    (function (UnicodeHighlighterReasonKind) {
        UnicodeHighlighterReasonKind[UnicodeHighlighterReasonKind["Ambiguous"] = 0] = "Ambiguous";
        UnicodeHighlighterReasonKind[UnicodeHighlighterReasonKind["Invisible"] = 1] = "Invisible";
        UnicodeHighlighterReasonKind[UnicodeHighlighterReasonKind["NonBasicAscii"] = 2] = "NonBasicAscii";
    })(UnicodeHighlighterReasonKind || (exports.UnicodeHighlighterReasonKind = UnicodeHighlighterReasonKind = {}));
    class CodePointHighlighter {
        constructor(options) {
            this.options = options;
            this.allowedCodePoints = new Set(options.allowedCodePoints);
            this.ambiguousCharacters = strings.AmbiguousCharacters.getInstance(new Set(options.allowedLocales));
        }
        getCandidateCodePoints() {
            if (this.options.nonBasicASCII) {
                return 'allNonBasicAscii';
            }
            const set = new Set();
            if (this.options.invisibleCharacters) {
                for (const cp of strings.InvisibleCharacters.codePoints) {
                    if (!isAllowedInvisibleCharacter(String.fromCodePoint(cp))) {
                        set.add(cp);
                    }
                }
            }
            if (this.options.ambiguousCharacters) {
                for (const cp of this.ambiguousCharacters.getConfusableCodePoints()) {
                    set.add(cp);
                }
            }
            for (const cp of this.allowedCodePoints) {
                set.delete(cp);
            }
            return set;
        }
        shouldHighlightNonBasicASCII(character, wordContext) {
            const codePoint = character.codePointAt(0);
            if (this.allowedCodePoints.has(codePoint)) {
                return 0 /* SimpleHighlightReason.None */;
            }
            if (this.options.nonBasicASCII) {
                return 1 /* SimpleHighlightReason.NonBasicASCII */;
            }
            let hasBasicASCIICharacters = false;
            let hasNonConfusableNonBasicAsciiCharacter = false;
            if (wordContext) {
                for (const char of wordContext) {
                    const codePoint = char.codePointAt(0);
                    const isBasicASCII = strings.isBasicASCII(char);
                    hasBasicASCIICharacters = hasBasicASCIICharacters || isBasicASCII;
                    if (!isBasicASCII &&
                        !this.ambiguousCharacters.isAmbiguous(codePoint) &&
                        !strings.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
                        hasNonConfusableNonBasicAsciiCharacter = true;
                    }
                }
            }
            if (
            /* Don't allow mixing weird looking characters with ASCII */ !hasBasicASCIICharacters &&
                /* Is there an obviously weird looking character? */ hasNonConfusableNonBasicAsciiCharacter) {
                return 0 /* SimpleHighlightReason.None */;
            }
            if (this.options.invisibleCharacters) {
                // TODO check for emojis
                if (!isAllowedInvisibleCharacter(character) && strings.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
                    return 2 /* SimpleHighlightReason.Invisible */;
                }
            }
            if (this.options.ambiguousCharacters) {
                if (this.ambiguousCharacters.isAmbiguous(codePoint)) {
                    return 3 /* SimpleHighlightReason.Ambiguous */;
                }
            }
            return 0 /* SimpleHighlightReason.None */;
        }
    }
    function isAllowedInvisibleCharacter(character) {
        return character === ' ' || character === '\n' || character === '\t';
    }
    var SimpleHighlightReason;
    (function (SimpleHighlightReason) {
        SimpleHighlightReason[SimpleHighlightReason["None"] = 0] = "None";
        SimpleHighlightReason[SimpleHighlightReason["NonBasicASCII"] = 1] = "NonBasicASCII";
        SimpleHighlightReason[SimpleHighlightReason["Invisible"] = 2] = "Invisible";
        SimpleHighlightReason[SimpleHighlightReason["Ambiguous"] = 3] = "Ambiguous";
    })(SimpleHighlightReason || (SimpleHighlightReason = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pY29kZVRleHRNb2RlbEhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9zZXJ2aWNlcy91bmljb2RlVGV4dE1vZGVsSGlnaGxpZ2h0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsMkJBQTJCO1FBQ2hDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxLQUFzQyxFQUFFLE9BQWtDLEVBQUUsS0FBYztZQUNoSSxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUVuRSxNQUFNLG9CQUFvQixHQUFHLElBQUksb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFL0QsTUFBTSxVQUFVLEdBQUcsb0JBQW9CLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUNqRSxJQUFJLEtBQWEsQ0FBQztZQUNsQixJQUFJLFVBQVUsS0FBSyxrQkFBa0IsRUFBRSxDQUFDO2dCQUN2QyxLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMseUJBQXlCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDcEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2hGLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLDBCQUFRLENBQUMsSUFBSSxFQUFF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