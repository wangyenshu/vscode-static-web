/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/stringBuilder", "vs/editor/common/core/range"], function (require, exports, strings, stringBuilder, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketsUtils = exports.RichEditBrackets = exports.RichEditBracket = void 0;
    /**
     * Represents a grouping of colliding bracket pairs.
     *
     * Most of the times this contains a single bracket pair,
     * but sometimes this contains multiple bracket pairs in cases
     * where the same string appears as a closing bracket for multiple
     * bracket pairs, or the same string appears an opening bracket for
     * multiple bracket pairs.
     *
     * e.g. of a group containing a single pair:
     *   open: ['{'], close: ['}']
     *
     * e.g. of a group containing multiple pairs:
     *   open: ['if', 'for'], close: ['end', 'end']
     */
    class RichEditBracket {
        constructor(languageId, index, open, close, forwardRegex, reversedRegex) {
            this._richEditBracketBrand = undefined;
            this.languageId = languageId;
            this.index = index;
            this.open = open;
            this.close = close;
            this.forwardRegex = forwardRegex;
            this.reversedRegex = reversedRegex;
            this._openSet = RichEditBracket._toSet(this.open);
            this._closeSet = RichEditBracket._toSet(this.close);
        }
        /**
         * Check if the provided `text` is an open bracket in this group.
         */
        isOpen(text) {
            return this._openSet.has(text);
        }
        /**
         * Check if the provided `text` is a close bracket in this group.
         */
        isClose(text) {
            return this._closeSet.has(text);
        }
        static _toSet(arr) {
            const result = new Set();
            for (const element of arr) {
                result.add(element);
            }
            return result;
        }
    }
    exports.RichEditBracket = RichEditBracket;
    /**
     * Groups together brackets that have equal open or close sequences.
     *
     * For example, if the following brackets are defined:
     *   ['IF','END']
     *   ['for','end']
     *   ['{','}']
     *
     * Then the grouped brackets would be:
     *   { open: ['if', 'for'], close: ['end', 'end'] }
     *   { open: ['{'], close: ['}'] }
     *
     */
    function groupFuzzyBrackets(brackets) {
        const N = brackets.length;
        brackets = brackets.map(b => [b[0].toLowerCase(), b[1].toLowerCase()]);
        const group = [];
        for (let i = 0; i < N; i++) {
            group[i] = i;
        }
        const areOverlapping = (a, b) => {
            const [aOpen, aClose] = a;
            const [bOpen, bClose] = b;
            return (aOpen === bOpen || aOpen === bClose || aClose === bOpen || aClose === bClose);
        };
        const mergeGroups = (g1, g2) => {
            const newG = Math.min(g1, g2);
            const oldG = Math.max(g1, g2);
            for (let i = 0; i < N; i++) {
                if (group[i] === oldG) {
                    group[i] = newG;
                }
            }
        };
        // group together brackets that have the same open or the same close sequence
        for (let i = 0; i < N; i++) {
            const a = brackets[i];
            for (let j = i + 1; j < N; j++) {
                const b = brackets[j];
                if (areOverlapping(a, b)) {
                    mergeGroups(group[i], group[j]);
                }
            }
        }
        const result = [];
        for (let g = 0; g < N; g++) {
            const currentOpen = [];
            const currentClose = [];
            for (let i = 0; i < N; i++) {
                if (group[i] === g) {
                    const [open, close] = brackets[i];
                    currentOpen.push(open);
                    currentClose.push(close);
                }
            }
            if (currentOpen.length > 0) {
                result.push({
                    open: currentOpen,
                    close: currentClose
                });
            }
        }
        return result;
    }
    class RichEditBrackets {
        constructor(languageId, _brackets) {
            this._richEditBracketsBrand = undefined;
            const brackets = groupFuzzyBrackets(_brackets);
            this.brackets = brackets.map((b, index) => {
                return new RichEditBracket(languageId, index, b.open, b.close, getRegexForBracketPair(b.open, b.close, brackets, index), getReversedRegexForBracketPair(b.open, b.close, brackets, index));
            });
            this.forwardRegex = getRegexForBrackets(this.brackets);
            this.reversedRegex = getReversedRegexForBrackets(this.brackets);
            this.textIsBracket = {};
            this.textIsOpenBracket = {};
            this.maxBracketLength = 0;
            for (const bracket of this.brackets) {
                for (const open of bracket.open) {
                    this.textIsBracket[open] = bracket;
                    this.textIsOpenBracket[open] = true;
                    this.maxBracketLength = Math.max(this.maxBracketLength, open.length);
                }
                for (const close of bracket.close) {
                    this.textIsBracket[close] = bracket;
                    this.textIsOpenBracket[close] = false;
                    this.maxBracketLength = Math.max(this.maxBracketLength, close.length);
                }
            }
        }
    }
    exports.RichEditBrackets = RichEditBrackets;
    function collectSuperstrings(str, brackets, currentIndex, dest) {
        for (let i = 0, len = brackets.length; i < len; i++) {
            if (i === currentIndex) {
                continue;
            }
            const bracket = brackets[i];
            for (const open of bracket.open) {
                if (open.indexOf(str) >= 0) {
                    dest.push(open);
                }
            }
            for (const close of bracket.close) {
                if (close.indexOf(str) >= 0) {
                    dest.push(close);
                }
            }
        }
    }
    function lengthcmp(a, b) {
        return a.length - b.length;
    }
    function unique(arr) {
        if (arr.length <= 1) {
            return arr;
        }
        const result = [];
        const seen = new Set();
        for (const element of arr) {
            if (seen.has(element)) {
                continue;
            }
            result.push(element);
            seen.add(element);
        }
        return result;
    }
    /**
     * Create a regular expression that can be used to search forward in a piece of text
     * for a group of bracket pairs. But this regex must be built in a way in which
     * it is aware of the other bracket pairs defined for the language.
     *
     * For example, if a language contains the following bracket pairs:
     *   ['begin', 'end']
     *   ['if', 'end if']
     * The two bracket pairs do not collide because no open or close brackets are equal.
     * So the function getRegexForBracketPair is called twice, once with
     * the ['begin'], ['end'] group consisting of one bracket pair, and once with
     * the ['if'], ['end if'] group consiting of the other bracket pair.
     *
     * But there could be a situation where an occurrence of 'end if' is mistaken
     * for an occurrence of 'end'.
     *
     * Therefore, for the bracket pair ['begin', 'end'], the regex will also
     * target 'end if'. The regex will be something like:
     *   /(\bend if\b)|(\bend\b)|(\bif\b)/
     *
     * The regex also searches for "superstrings" (other brackets that might be mistaken with the current bracket).
     *
     */
    function getRegexForBracketPair(open, close, brackets, currentIndex) {
        // search in all brackets for other brackets that are a superstring of these brackets
        let pieces = [];
        pieces = pieces.concat(open);
        pieces = pieces.concat(close);
        for (let i = 0, len = pieces.length; i < len; i++) {
            collectSuperstrings(pieces[i], brackets, currentIndex, pieces);
        }
        pieces = unique(pieces);
        pieces.sort(lengthcmp);
        pieces.reverse();
        return createBracketOrRegExp(pieces);
    }
    /**
     * Matching a regular expression in JS can only be done "forwards". So JS offers natively only
     * methods to find the first match of a regex in a string. But sometimes, it is useful to
     * find the last match of a regex in a string. For such a situation, a nice solution is to
     * simply reverse the string and then search for a reversed regex.
     *
     * This function also has the fine details of `getRegexForBracketPair`. For the same example
     * given above, the regex produced here would look like:
     *   /(\bfi dne\b)|(\bdne\b)|(\bfi\b)/
     */
    function getReversedRegexForBracketPair(open, close, brackets, currentIndex) {
        // search in all brackets for other brackets that are a superstring of these brackets
        let pieces = [];
        pieces = pieces.concat(open);
        pieces = pieces.concat(close);
        for (let i = 0, len = pieces.length; i < len; i++) {
            collectSuperstrings(pieces[i], brackets, currentIndex, pieces);
        }
        pieces = unique(pieces);
        pieces.sort(lengthcmp);
        pieces.reverse();
        return createBracketOrRegExp(pieces.map(toReversedString));
    }
    /**
     * Creates a regular expression that targets all bracket pairs.
     *
     * e.g. for the bracket pairs:
     *  ['{','}']
     *  ['begin,'end']
     *  ['for','end']
     * the regex would look like:
     *  /(\{)|(\})|(\bbegin\b)|(\bend\b)|(\bfor\b)/
     */
    function getRegexForBrackets(brackets) {
        let pieces = [];
        for (const bracket of brackets) {
            for (const open of bracket.open) {
                pieces.push(open);
            }
            for (const close of bracket.close) {
                pieces.push(close);
            }
        }
        pieces = unique(pieces);
        return createBracketOrRegExp(pieces);
    }
    /**
     * Matching a regular expression in JS can only be done "forwards". So JS offers natively only
     * methods to find the first match of a regex in a string. But sometimes, it is useful to
     * find the last match of a regex in a string. For such a situation, a nice solution is to
     * simply reverse the string and then search for a reversed regex.
     *
     * e.g. for the bracket pairs:
     *  ['{','}']
     *  ['begin,'end']
     *  ['for','end']
     * the regex would look like:
     *  /(\{)|(\})|(\bnigeb\b)|(\bdne\b)|(\brof\b)/
     */
    function getReversedRegexForBrackets(brackets) {
        let pieces = [];
        for (const bracket of brackets) {
            for (const open of bracket.open) {
                pieces.push(open);
            }
            for (const close of bracket.close) {
                pieces.push(close);
            }
        }
        pieces = unique(pieces);
        return createBracketOrRegExp(pieces.map(toReversedString));
    }
    function prepareBracketForRegExp(str) {
        // This bracket pair uses letters like e.g. "begin" - "end"
        const insertWordBoundaries = (/^[\w ]+$/.test(str));
        str = strings.escapeRegExpCharacters(str);
        return (insertWordBoundaries ? `\\b${str}\\b` : str);
    }
    function createBracketOrRegExp(pieces) {
        const regexStr = `(${pieces.map(prepareBracketForRegExp).join(')|(')})`;
        return strings.createRegExp(regexStr, true);
    }
    const toReversedString = (function () {
        function reverse(str) {
            // create a Uint16Array and then use a TextDecoder to create a string
            const arr = new Uint16Array(str.length);
            let offset = 0;
            for (let i = str.length - 1; i >= 0; i--) {
                arr[offset++] = str.charCodeAt(i);
            }
            return stringBuilder.getPlatformTextDecoder().decode(arr);
        }
        let lastInput = null;
        let lastOutput = null;
        return function toReversedString(str) {
            if (lastInput !== str) {
                lastInput = str;
                lastOutput = reverse(lastInput);
            }
            return lastOutput;
        };
    })();
    class BracketsUtils {
        static _findPrevBracketInText(reversedBracketRegex, lineNumber, reversedText, offset) {
            const m = reversedText.match(reversedBracketRegex);
            if (!m) {
                return null;
            }
            const matchOffset = reversedText.length - (m.index || 0);
            const matchLength = m[0].length;
            const absoluteMatchOffset = offset + matchOffset;
            return new range_1.Range(lineNumber, absoluteMatchOffset - matchLength + 1, lineNumber, absoluteMatchOffset + 1);
        }
        static findPrevBracketInRange(reversedBracketRegex, lineNumber, lineText, startOffset, endOffset) {
            // Because JS does not support backwards regex search, we search forwards in a reversed string with a reversed regex ;)
            const reversedLineText = toReversedString(lineText);
            const reversedSubstr = reversedLineText.substring(lineText.length - endOffset, lineText.length - startOffset);
            return this._findPrevBracketInText(reversedBracketRegex, lineNumber, reversedSubstr, startOffset);
        }
        static findNextBracketInText(bracketRegex, lineNumber, text, offset) {
            const m = text.match(bracketRegex);
            if (!m) {
                return null;
            }
            const matchOffset = m.index || 0;
            const matchLength = m[0].length;
            if (matchLength === 0) {
                return null;
            }
            const absoluteMatchOffset = offset + matchOffset;
            return new range_1.Range(lineNumber, absoluteMatchOffset + 1, lineNumber, absoluteMatchOffset + 1 + matchLength);
        }
        static findNextBracketInRange(bracketRegex, lineNumber, lineText, startOffset, endOffset) {
            const substr = lineText.substring(startOffset, endOffset);
            return this.findNextBracketInText(bracketRegex, lineNumber, substr, startOffset);
        }
    }
    exports.BracketsUtils = BracketsUtils;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmljaEVkaXRCcmFja2V0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VzL3N1cHBvcnRzL3JpY2hFZGl0QnJhY2tldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHOzs7Ozs7Ozs7Ozs7OztPQWNHO0lBQ0gsTUFBYSxlQUFlO1FBaUQzQixZQUFZLFVBQWtCLEVBQUUsS0FBYSxFQUFFLElBQWMsRUFBRSxLQUFlLEVBQUUsWUFBb0IsRUFBRSxhQUFxQjtZQWhEM0gsMEJBQXFCLEdBQVMsU0FBUyxDQUFDO1lBaUR2QyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUM3QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztZQUNqQyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztZQUNuQyxJQUFJLENBQUMsUUFBUSxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVEOztXQUVHO1FBQ0ksTUFBTSxDQUFDLElBQVk7WUFDekIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRUQ7O1dBRUc7UUFDSSxPQUFPLENBQUMsSUFBWTtZQUMxQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FB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