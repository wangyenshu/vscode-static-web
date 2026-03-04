/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/base/common/naturalLanguage/korean", "vs/base/common/strings"], function (require, exports, map_1, korean_1, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FuzzyScoreOptions = exports.FuzzyScore = exports.matchesPrefix = exports.matchesStrictPrefix = void 0;
    exports.or = or;
    exports.matchesContiguousSubString = matchesContiguousSubString;
    exports.matchesSubString = matchesSubString;
    exports.isUpper = isUpper;
    exports.matchesCamelCase = matchesCamelCase;
    exports.matchesWords = matchesWords;
    exports.matchesFuzzy = matchesFuzzy;
    exports.matchesFuzzy2 = matchesFuzzy2;
    exports.anyScore = anyScore;
    exports.createMatches = createMatches;
    exports.isPatternInWord = isPatternInWord;
    exports.fuzzyScore = fuzzyScore;
    exports.fuzzyScoreGracefulAggressive = fuzzyScoreGracefulAggressive;
    exports.fuzzyScoreGraceful = fuzzyScoreGraceful;
    // Combined filters
    /**
     * @returns A filter which combines the provided set
     * of filters with an or. The *first* filters that
     * matches defined the return value of the returned
     * filter.
     */
    function or(...filter) {
        return function (word, wordToMatchAgainst) {
            for (let i = 0, len = filter.length; i < len; i++) {
                const match = filter[i](word, wordToMatchAgainst);
                if (match) {
                    return match;
                }
            }
            return null;
        };
    }
    // Prefix
    exports.matchesStrictPrefix = _matchesPrefix.bind(undefined, false);
    exports.matchesPrefix = _matchesPrefix.bind(undefined, true);
    function _matchesPrefix(ignoreCase, word, wordToMatchAgainst) {
        if (!wordToMatchAgainst || wordToMatchAgainst.length < word.length) {
            return null;
        }
        let matches;
        if (ignoreCase) {
            matches = strings.startsWithIgnoreCase(wordToMatchAgainst, word);
        }
        else {
            matches = wordToMatchAgainst.indexOf(word) === 0;
        }
        if (!matches) {
            return null;
        }
        return word.length > 0 ? [{ start: 0, end: word.length }] : [];
    }
    // Contiguous Substring
    function matchesContiguousSubString(word, wordToMatchAgainst) {
        const index = wordToMatchAgainst.toLowerCase().indexOf(word.toLowerCase());
        if (index === -1) {
            return null;
        }
        return [{ start: index, end: index + word.length }];
    }
    // Substring
    function matchesSubString(word, wordToMatchAgainst) {
        return _matchesSubString(word.toLowerCase(), wordToMatchAgainst.toLowerCase(), 0, 0);
    }
    function _matchesSubString(word, wordToMatchAgainst, i, j) {
        if (i === word.length) {
            return [];
        }
        else if (j === wordToMatchAgainst.length) {
            return null;
        }
        else {
            if (word[i] === wordToMatchAgainst[j]) {
                let result = null;
                if (result = _matchesSubString(word, wordToMatchAgainst, i + 1, j + 1)) {
                    return join({ start: j, end: j + 1 }, result);
                }
                return null;
            }
            return _matchesSubString(word, wordToMatchAgainst, i, j + 1);
        }
    }
    // CamelCase
    function isLower(code) {
        return 97 /* CharCode.a */ <= code && code <= 122 /* CharCode.z */;
    }
    function isUpper(code) {
        return 65 /* CharCode.A */ <= code && code <= 90 /* CharCode.Z */;
    }
    function isNumber(code) {
        return 48 /* CharCode.Digit0 */ <= code && code <= 57 /* CharCode.Digit9 */;
    }
    function isWhitespace(code) {
        return (code === 32 /* CharCode.Space */
            || code === 9 /* CharCode.Tab */
            || code === 10 /* CharCode.LineFeed */
            || code === 13 /* CharCode.CarriageReturn */);
    }
    const wordSeparators = new Set();
    // These are chosen as natural word separators based on writen text.
    // It is a subset of the word separators used by the monaco editor.
    '()[]{}<>`\'"-/;:,.?!'
        .split('')
        .forEach(s => wordSeparators.add(s.charCodeAt(0)));
    function isWordSeparator(code) {
        return isWhitespace(code) || wordSeparators.has(code);
    }
    function charactersMatch(codeA, codeB) {
        return (codeA === codeB) || (isWordSeparator(codeA) && isWordSeparator(codeB));
    }
    const alternateCharsCache = new Map();
    /**
     * Gets alternative codes to the character code passed in. This comes in the
     * form of an array of character codes, all of which must match _in order_ to
     * successfully match.
     *
     * @param code The character code to check.
     */
    function getAlternateCodes(code) {
        if (alternateCharsCache.has(code)) {
            return alternateCharsCache.get(code);
        }
        // NOTE: This function is written in such a way that it can be extended in
        // the future, but right now the return type takes into account it's only
        // supported by a single "alt codes provider".
        // `ArrayLike<ArrayLike<number>>` is a more appropriate type if changed.
        let result;
        const codes = (0, korean_1.getKoreanAltChars)(code);
        if (codes) {
            result = codes;
        }
        alternateCharsCache.set(code, result);
        return result;
    }
    function isAlphanumeric(code) {
        return isLower(code) || isUpper(code) || isNumber(code);
    }
    function join(head, tail) {
        if (tail.length === 0) {
            tail = [head];
        }
        else if (head.end === tail[0].start) {
            tail[0].start = head.start;
        }
        else {
            tail.unshift(head);
        }
        return tail;
    }
    function nextAnchor(camelCaseWord, start) {
        for (let i = start; i < camelCaseWord.length; i++) {
            const c = camelCaseWord.charCodeAt(i);
            if (isUpper(c) || isNumber(c) || (i > 0 && !isAlphanumeric(camelCaseWord.charCodeAt(i - 1)))) {
                return i;
            }
        }
        return camelCaseWord.length;
    }
    function _matchesCamelCase(word, camelCaseWord, i, j) {
        if (i === word.length) {
            return [];
        }
        else if (j === camelCaseWord.length) {
            return null;
        }
        else if (word[i] !== camelCaseWord[j].toLowerCase()) {
            return null;
        }
        else {
            let result = null;
            let nextUpperIndex = j + 1;
            result = _matchesCamelCase(word, camelCaseWord, i + 1, j + 1);
            while (!result && (nextUpperIndex = nextAnchor(camelCaseWord, nextUpperIndex)) < camelCaseWord.length) {
                result = _matchesCamelCase(word, camelCaseWord, i + 1, nextUpperIndex);
                nextUpperIndex++;
            }
            return result === null ? null : join({ start: j, end: j + 1 }, result);
        }
    }
    // Heuristic to avoid computing camel case matcher for words that don't
    // look like camelCaseWords.
    function analyzeCamelCaseWord(word) {
        let upper = 0, lower = 0, alpha = 0, numeric = 0, code = 0;
        for (let i = 0; i < word.length; i++) {
            code = word.charCodeAt(i);
            if (isUpper(code)) {
                upper++;
            }
            if (isLower(code)) {
                lower++;
            }
            if (isAlphanumeric(code)) {
                alpha++;
            }
            if (isNumber(code)) {
                numeric++;
            }
        }
        const upperPercent = upper / word.length;
        const lowerPercent = lower / word.length;
        const alphaPercent = alpha / word.length;
        const numericPercent = numeric / word.length;
        return { upperPercent, lowerPercent, alphaPercent, numericPercent };
    }
    function isUpperCaseWord(analysis) {
        const { upperPercent, lowerPercent } = analysis;
        return lowerPercent === 0 && upperPercent > 0.6;
    }
    function isCamelCaseWord(analysis) {
        const { upperPercent, lowerPercent, alphaPercent, numericPercent } = analysis;
        return lowerPercent > 0.2 && upperPercent < 0.8 && alphaPercent > 0.6 && numericPercent < 0.2;
    }
    // Heuristic to avoid computing camel case matcher for words that don't
    // look like camel case patterns.
    function isCamelCasePattern(word) {
        let upper = 0, lower = 0, code = 0, whitespace = 0;
        for (let i = 0; i < word.length; i++) {
            code = word.charCodeAt(i);
            if (isUpper(code)) {
                upper++;
            }
            if (isLower(code)) {
                lower++;
            }
            if (isWhitespace(code)) {
                whitespace++;
            }
        }
        if ((upper === 0 || lower === 0) && whitespace === 0) {
            return word.length <= 30;
        }
        else {
            return upper <= 5;
        }
    }
    function matchesCamelCase(word, camelCaseWord) {
        if (!camelCaseWord) {
            return null;
        }
        camelCaseWord = camelCaseWord.trim();
        if (camelCaseWord.length === 0) {
            return null;
        }
        if (!isCamelCasePattern(word)) {
            return null;
        }
        // TODO: Consider removing this check
        if (camelCaseWord.length > 60) {
            camelCaseWord = camelCaseWord.substring(0, 60);
        }
        const analysis = analyzeCamelCaseWord(camelCaseWord);
        if (!isCamelCaseWord(analysis)) {
            if (!isUpperCaseWord(analysis)) {
                return null;
            }
            camelCaseWord = camelCaseWord.toLowerCase();
        }
        let result = null;
        let i = 0;
        word = word.toLowerCase();
        while (i < camelCaseWord.length && (result = _matchesCamelCase(word, camelCaseWord, 0, i)) === null) {
            i = nextAnchor(camelCaseWord, i + 1);
        }
        return result;
    }
    // Matches beginning of words supporting non-ASCII languages
    // If `contiguous` is true then matches word with beginnings of the words in the target. E.g. "pul" will match "Git: Pull"
    // Otherwise also matches sub string of the word with beginnings of the words in the target. E.g. "gp" or "g p" will match "Git: Pull"
    // Useful in cases where the target is words (e.g. command labels)
    function matchesWords(word, target, contiguous = false) {
        if (!target || target.length === 0) {
            return null;
        }
        let result = null;
        let targetIndex = 0;
        word = word.toLowerCase();
        target = target.toLowerCase();
        while (targetIndex < target.length) {
            result = _matchesWords(word, target, 0, targetIndex, contiguous);
            if (result !== null) {
                break;
            }
            targetIndex = nextWord(target, targetIndex + 1);
        }
        return result;
    }
    function _matchesWords(word, target, wordIndex, targetIndex, contiguous) {
        let targetIndexOffset = 0;
        if (wordIndex === word.length) {
            return [];
        }
        else if (targetIndex === target.length) {
            return null;
        }
        else if (!charactersMatch(word.charCodeAt(wordIndex), target.charCodeAt(targetIndex))) {
            // Verify alternate characters before exiting
            const altChars = getAlternateCodes(word.charCodeAt(wordIndex));
            if (!altChars) {
                return null;
            }
            for (let k = 0; k < altChars.length; k++) {
                if (!charactersMatch(altChars[k], target.charCodeAt(targetIndex + k))) {
                    return null;
                }
            }
            targetIndexOffset += altChars.length - 1;
        }
        let result = null;
        let nextWordIndex = targetIndex + targetIndexOffset + 1;
        result = _matchesWords(word, target, wordIndex + 1, nextWordIndex, contiguous);
        if (!contiguous) {
            while (!result && (nextWordIndex = nextWord(target, nextWordIndex)) < target.length) {
                result = _matchesWords(word, target, wordIndex + 1, nextWordIndex, contiguous);
                nextWordIndex++;
            }
        }
        if (!result) {
            return null;
        }
        // If the characters don't exactly match, then they must be word separators (see charactersMatch(...)).
        // We don't want to include this in the matches but we don't want to throw the target out all together so we return `result`.
        if (word.charCodeAt(wordIndex) !== target.charCodeAt(targetIndex)) {
            // Verify alternate characters before exiting
            const altChars = getAlternateCodes(word.charCodeAt(wordIndex));
            if (!altChars) {
                return result;
            }
            for (let k = 0; k < altChars.length; k++) {
                if (altChars[k] !== target.charCodeAt(targetIndex + k)) {
                    return result;
                }
            }
        }
        return join({ start: targetIndex, end: targetIndex + targetIndexOffset + 1 }, result);
    }
    function nextWord(word, start) {
        for (let i = start; i < word.length; i++) {
            if (isWordSeparator(word.charCodeAt(i)) ||
                (i > 0 && isWordSeparator(word.charCodeAt(i - 1)))) {
                return i;
            }
        }
        return word.length;
    }
    // Fuzzy
    const fuzzyContiguousFilter = or(exports.matchesPrefix, matchesCamelCase, matchesContiguousSubString);
    const fuzzySeparateFilter = or(exports.matchesPrefix, matchesCamelCase, matchesSubString);
    const fuzzyRegExpCache = new map_1.LRUCache(10000); // bounded to 10000 elements
    function matchesFuzzy(word, wordToMatchAgainst, enableSeparateSubstringMatching = false) {
        if (typeof word !== 'string' || typeof wordToMatchAgainst !== 'string') {
            return null; // return early for invalid input
        }
        // Form RegExp for wildcard matches
        let regexp = fuzzyRegExpCache.get(word);
        if (!regexp) {
            regexp = new RegExp(strings.convertSimple2RegExpPattern(word), 'i');
            fuzzyRegExpCache.set(word, regexp);
        }
        // RegExp Filter
        const match = regexp.exec(wordToMatchAgainst);
        if (match) {
            return [{ start: match.index, end: match.index + match[0].length }];
        }
        // Default Filter
        return enableSeparateSubstringMatching ? fuzzySeparateFilter(word, wordToMatchAgainst) : fuzzyContiguousFilter(word, wordToMatchAgainst);
    }
    /**
     * Match pattern against word in a fuzzy way. As in IntelliSense and faster and more
     * powerful than `matchesFuzzy`
     */
    function matchesFuzzy2(pattern, word) {
        const score = fuzzyScore(pattern, pattern.toLowerCase(), 0, word, word.toLowerCase(), 0, { firstMatchCanBeWeak: true, boostFullMatch: true });
        return score ? createMatches(score) : null;
    }
    function anyScore(pattern, lowPattern, patternPos, word, lowWord, wordPos) {
        const max = Math.min(13, pattern.length);
        for (; patternPos < max; patternPos++) {
            const result = fuzzyScore(pattern, lowPattern, patternPos, word, lowWord, wordPos, { firstMatchCanBeWeak: true, boostFullMatch: true });
            if (result) {
                return result;
            }
        }
        return [0, wordPos];
    }
    //#region --- fuzzyScore ---
    function createMatches(score) {
        if (typeof score === 'undefined') {
            return [];
        }
        const res = [];
        const wordPos = score[1];
        for (let i = score.length - 1; i > 1; i--) {
            const pos = score[i] + wordPos;
            const last = res[res.length - 1];
            if (last && last.end === pos) {
                last.end = pos + 1;
            }
            else {
                res.push({ start: pos, end: pos + 1 });
            }
        }
        return res;
    }
    const _maxLen = 128;
    function initTable() {
        const table = [];
        const row = [];
        for (let i = 0; i <= _maxLen; i++) {
            row[i] = 0;
        }
        for (let i = 0; i <= _maxLen; i++) {
            table.push(row.slice(0));
        }
        return table;
    }
    function initArr(maxLen) {
        const row = [];
        for (let i = 0; i <= maxLen; i++) {
            row[i] = 0;
        }
        return row;
    }
    const _minWordMatchPos = initArr(2 * _maxLen); // min word position for a certain pattern position
    const _maxWordMatchPos = initArr(2 * _maxLen); // max word position for a certain pattern position
    const _diag = initTable(); // the length of a contiguous diagonal match
    const _table = initTable();
    const _arrows = initTable();
    const _debug = false;
    function printTable(table, pattern, patternLen, word, wordLen) {
        function pad(s, n, pad = ' ') {
            while (s.length < n) {
                s = pad + s;
            }
            return s;
        }
        let ret = ` |   |${word.split('').map(c => pad(c, 3)).join('|')}\n`;
        for (let i = 0; i <= patternLen; i++) {
            if (i === 0) {
                ret += ' |';
            }
            else {
                ret += `${pattern[i - 1]}|`;
            }
            ret += table[i].slice(0, wordLen + 1).map(n => pad(n.toString(), 3)).join('|') + '\n';
        }
        return ret;
    }
    function printTables(pattern, patternStart, word, wordStart) {
        pattern = pattern.substr(patternStart);
        word = word.substr(wordStart);
        console.log(printTable(_table, pattern, pattern.length, word, word.length));
        console.log(printTable(_arrows, pattern, pattern.length, word, word.length));
        console.log(printTable(_diag, pattern, pattern.length, word, word.length));
    }
    function isSeparatorAtPos(value, index) {
        if (index < 0 || index >= value.length) {
            return false;
        }
        const code = value.codePointAt(index);
        switch (code) {
            case 95 /* CharCode.Underline */:
            case 45 /* CharCode.Dash */:
            case 46 /* CharCode.Period */:
            case 32 /* CharCode.Space */:
            case 47 /* CharCode.Slash */:
            case 92 /* CharCode.Backslash */:
            case 39 /* CharCode.SingleQuote */:
            case 34 /* CharCode.DoubleQuote */:
            case 58 /* CharCode.Colon */:
            case 36 /* CharCode.DollarSign */:
            case 60 /* CharCode.LessThan */:
            case 62 /* CharCode.GreaterThan */:
            case 40 /* CharCode.OpenParen */:
            case 41 /* CharCode.CloseParen */:
            case 91 /* CharCode.OpenSquareBracket */:
            case 93 /* CharCode.CloseSquareBracket */:
            case 123 /* CharCode.OpenCurlyBrace */:
            case 125 /* CharCode.CloseCurlyBrace */:
                return true;
            case undefined:
                return false;
            default:
                if (strings.isEmojiImprecise(code)) {
                    return true;
                }
                return false;
        }
    }
    function isWhitespaceAtPos(value, index) {
        if (index < 0 || index >= value.length) {
            return false;
        }
        const code = value.charCodeAt(index);
        switch (code) {
            case 32 /* CharCode.Space */:
            case 9 /* CharCode.Tab */:
                return true;
            default:
                return false;
        }
    }
    function isUpperCaseAtPos(pos, word, wordLow) {
        return word[pos] !== wordLow[pos];
    }
    function isPatternInWord(patternLow, patternPos, patternLen, wordLow, wordPos, wordLen, fillMinWordPosArr = false) {
        while (patternPos < patternLen && wordPos < wordLen) {
            if (patternLow[patternPos] === wordLow[wordPos]) {
                if (fillMinWordPosArr) {
                    // Remember the min word position for each pattern position
                    _minWordMatchPos[patternPos] = wordPos;
                }
                patternPos += 1;
            }
            wordPos += 1;
        }
        return patternPos === patternLen; // pattern must be exhausted
    }
    var Arrow;
    (function (Arrow) {
        Arrow[Arrow["Diag"] = 1] = "Diag";
        Arrow[Arrow["Left"] = 2] = "Left";
        Arrow[Arrow["LeftLeft"] = 3] = "LeftLeft";
    })(Arrow || (Arrow = {}));
    var FuzzyScore;
    (function (FuzzyScore) {
        /**
         * No matches and value `-100`
         */
        FuzzyScore.Default = ([-100, 0]);
        function isDefault(score) {
            return !score || (score.length === 2 && score[0] === -100 && score[1] === 0);
        }
        FuzzyScore.isDefault = isDefault;
    })(FuzzyScore || (exports.FuzzyScore = FuzzyScore = {}));
    class FuzzyScoreOptions {
        static { this.default = { boostFullMatch: true, firstMatchCanBeWeak: false }; }
        constructor(firstMatchCanBeWeak, boostFullMatch) {
            this.firstMatchCanBeWeak = firstMatchCanBeWeak;
            this.boostFullMatch = boostFullMatch;
        }
    }
    exports.FuzzyScoreOptions = FuzzyScoreOptions;
    function fuzzyScore(pattern, patternLow, patternStart, word, wordLow, wordStart, options = FuzzyScoreOptions.default) {
        const patternLen = pattern.length > _maxLen ? _maxLen : pattern.length;
        const wordLen = word.length > _maxLen ? _maxLen : word.length;
        if (patternStart >= patternLen || wordStart >= wordLen || (patternLen - patternStart) > (wordLen - wordStart)) {
            return undefined;
        }
        // Run a simple check if the characters of pattern occur
        // (in order) at all in word. If that isn't the case we
        // stop because no match will be possible
        if (!isPatternInWord(patternLow, patternStart, patternLen, wordLow, wordStart, wordLen, true)) {
            return undefined;
        }
        // Find the max matching word position for each pattern position
        // NOTE: the min matching word position was filled in above, in the `isPatternInWord` call
        _fillInMaxWordMatchPos(patternLen, wordLen, patternStart, wordStart, patternLow, wordLow);
        let row = 1;
        let column = 1;
        let patternPos = patternStart;
        let wordPos = wordStart;
        const hasStrongFirstMatch = [false];
        // There will be a match, fill in tables
        for (row = 1, patternPos = patternStart; patternPos < patternLen; row++, patternPos++) {
            // Reduce search space to possible matching word positions and to possible access from next row
            const minWordMatchPos = _minWordMatchPos[patternPos];
            const maxWordMatchPos = _maxWordMatchPos[patternPos];
            const nextMaxWordMatchPos = (patternPos + 1 < patternLen ? _maxWordMatchPos[patternPos + 1] : wordLen);
            for (column = minWordMatchPos - wordStart + 1, wordPos = minWordMatchPos; wordPos < nextMaxWordMatchPos; column++, wordPos++) {
                let score = Number.MIN_SAFE_INTEGER;
                let canComeDiag = false;
                if (wordPos <= maxWordMatchPos) {
                    score = _doScore(pattern, patternLow, patternPos, patternStart, word, wordLow, wordPos, wordLen, wordStart, _diag[row - 1][column - 1] === 0, hasStrongFirstMatch);
                }
                let diagScore = 0;
                if (score !== Number.MAX_SAFE_INTEGER) {
                    canComeDiag = true;
                    diagScore = score + _table[row - 1][column - 1];
                }
                const canComeLeft = wordPos > minWordMatchPos;
                const leftScore = canComeLeft ? _table[row][column - 1] + (_diag[row][column - 1] > 0 ? -5 : 0) : 0; // penalty for a gap start
                const canComeLeftLeft = wordPos > minWordMatchPos + 1 && _diag[row][column - 1] > 0;
                const leftLeftScore = canComeLeftLeft ? _table[row][column - 2] + (_diag[row][column - 2] > 0 ? -5 : 0) : 0; // penalty for a gap start
                if (canComeLeftLeft && (!canComeLeft || leftLeftScore >= leftScore) && (!canComeDiag || leftLeftScore >= diagScore)) {
                    // always prefer choosing left left to jump over a diagonal because that means a match is earlier in the word
                    _table[row][column] = leftLeftScore;
                    _arrows[row][column] = 3 /* Arrow.LeftLeft */;
                    _diag[row][column] = 0;
                }
                else if (canComeLeft && (!canComeDiag || leftScore >= diagScore)) {
                    // always prefer choosing left since that means a match is earlier in the word
                    _table[row][column] = leftScore;
                    _arrows[row][column] = 2 /* Arrow.Left */;
                    _diag[row][column] = 0;
                }
                else if (canComeDiag) {
                    _table[row][column] = diagScore;
                    _arrows[row][column] = 1 /* Arrow.Diag */;
                    _diag[row][column] = _diag[row - 1][column - 1] + 1;
                }
                else {
                    throw new Error(`not possible`);
                }
            }
        }
        if (_debug) {
            printTables(pattern, patternStart, word, wordStart);
        }
        if (!hasStrongFirstMatch[0] && !options.firstMatchCanBeWeak) {
            return undefined;
        }
        row--;
        column--;
        const result = [_table[row][column], wordStart];
        let backwardsDiagLength = 0;
        let maxMatchColumn = 0;
        while (row >= 1) {
            // Find the column where we go diagonally up
            let diagColumn = column;
            do {
                const arrow = _arrows[row][diagColumn];
                if (arrow === 3 /* Arrow.LeftLeft */) {
                    diagColumn = diagColumn - 2;
                }
                else if (arrow === 2 /* Arrow.Left */) {
                    diagColumn = diagColumn - 1;
                }
                else {
                    // found the diagonal
                    break;
                }
            } while (diagColumn >= 1);
            // Overturn the "forwards" decision if keeping the "backwards" diagonal would give a better match
            if (backwardsDiagLength > 1 // only if we would have a contiguous match of 3 characters
                && patternLow[patternStart + row - 1] === wordLow[wordStart + column - 1] // only if we can do a contiguous match diagonally
                && !isUpperCaseAtPos(diagColumn + wordStart - 1, word, wordLow) // only if the forwards chose diagonal is not an uppercase
                && backwardsDiagLength + 1 > _diag[row][diagColumn] // only if our contiguous match would be longer than the "forwards" contiguous match
            ) {
                diagColumn = column;
            }
            if (diagColumn === column) {
                // this is a contiguous match
                backwardsDiagLength++;
            }
            else {
                backwardsDiagLength = 1;
            }
            if (!maxMatchColumn) {
                // remember the last matched column
                maxMatchColumn = diagColumn;
            }
            row--;
            column = diagColumn - 1;
            result.push(column);
        }
        if (wordLen === patternLen && options.boostFullMatch) {
            // the word matches the pattern with all characters!
            // giving the score a total match boost (to come up ahead other words)
            result[0] += 2;
        }
        // Add 1 penalty for each skipped character in the word
        const skippedCharsCount = maxMatchColumn - patternLen;
        result[0] -= skippedCharsCount;
        return result;
    }
    function _fillInMaxWordMatchPos(patternLen, wordLen, patternStart, wordStart, patternLow, wordLow) {
        let patternPos = patternLen - 1;
        let wordPos = wordLen - 1;
        while (patternPos >= patternStart && wordPos >= wordStart) {
            if (patternLow[patternPos] === wordLow[wordPos]) {
                _maxWordMatchPos[patternPos] = wordPos;
                patternPos--;
            }
            wordPos--;
        }
    }
    function _doScore(pattern, patternLow, patternPos, patternStart, word, wordLow, wordPos, wordLen, wordStart, newMatchStart, outFirstMatchStrong) {
        if (patternLow[patternPos] !== wordLow[wordPos]) {
            return Number.MIN_SAFE_INTEGER;
        }
        let score = 1;
        let isGapLocation = false;
        if (wordPos === (patternPos - patternStart)) {
            // common prefix: `foobar <-> foobaz`
            //                            ^^^^^
            score = pattern[patternPos] === word[wordPos] ? 7 : 5;
        }
        else if (isUpperCaseAtPos(wordPos, word, wordLow) && (wordPos === 0 || !isUpperCaseAtPos(wordPos - 1, word, wordLow))) {
            // hitting upper-case: `foo <-> forOthers`
            //                              ^^ ^
            score = pattern[patternPos] === word[wordPos] ? 7 : 5;
            isGapLocation = true;
        }
        else if (isSeparatorAtPos(wordLow, wordPos) && (wordPos === 0 || !isSeparatorAtPos(wordLow, wordPos - 1))) {
            // hitting a separator: `. <-> foo.bar`
            //                                ^
            score = 5;
        }
        else if (isSeparatorAtPos(wordLow, wordPos - 1) || isWhitespaceAtPos(wordLow, wordPos - 1)) {
            // post separator: `foo <-> bar_foo`
            //                              ^^^
            score = 5;
            isGapLocation = true;
        }
        if (score > 1 && patternPos === patternStart) {
            outFirstMatchStrong[0] = true;
        }
        if (!isGapLocation) {
            isGapLocation = isUpperCaseAtPos(wordPos, word, wordLow) || isSeparatorAtPos(wordLow, wordPos - 1) || isWhitespaceAtPos(wordLow, wordPos - 1);
        }
        //
        if (patternPos === patternStart) { // first character in pattern
            if (wordPos > wordStart) {
                // the first pattern character would match a word character that is not at the word start
                // so introduce a penalty to account for the gap preceding this match
                score -= isGapLocation ? 3 : 5;
            }
        }
        else {
            if (newMatchStart) {
                // this would be the beginning of a new match (i.e. there would be a gap before this location)
                score += isGapLocation ? 2 : 0;
            }
            else {
                // this is part of a contiguous match, so give it a slight bonus, but do so only if it would not be a preferred gap location
                score += isGapLocation ? 0 : 1;
            }
        }
        if (wordPos + 1 === wordLen) {
            // we always penalize gaps, but this gives unfair advantages to a match that would match the last character in the word
            // so pretend there is a gap after the last character in the word to normalize things
            score -= isGapLocation ? 3 : 5;
        }
        return score;
    }
    //#endregion
    //#region --- graceful ---
    function fuzzyScoreGracefulAggressive(pattern, lowPattern, patternPos, word, lowWord, wordPos, options) {
        return fuzzyScoreWithPermutations(pattern, lowPattern, patternPos, word, lowWord, wordPos, true, options);
    }
    function fuzzyScoreGraceful(pattern, lowPattern, patternPos, word, lowWord, wordPos, options) {
        return fuzzyScoreWithPermutations(pattern, lowPattern, patternPos, word, lowWord, wordPos, false, options);
    }
    function fuzzyScoreWithPermutations(pattern, lowPattern, patternPos, word, lowWord, wordPos, aggressive, options) {
        let top = fuzzyScore(pattern, lowPattern, patternPos, word, lowWord, wordPos, options);
        if (top && !aggressive) {
            // when using the original pattern yield a result we`
            // return it unless we are aggressive and try to find
            // a better alignment, e.g. `cno` -> `^co^ns^ole` or `^c^o^nsole`.
            return top;
        }
        if (pattern.length >= 3) {
            // When the pattern is long enough then try a few (max 7)
            // permutations of the pattern to find a better match. The
            // permutations only swap neighbouring characters, e.g
            // `cnoso` becomes `conso`, `cnsoo`, `cnoos`.
            const tries = Math.min(7, pattern.length - 1);
            for (let movingPatternPos = patternPos + 1; movingPatternPos < tries; movingPatternPos++) {
                const newPattern = nextTypoPermutation(pattern, movingPatternPos);
                if (newPattern) {
                    const candidate = fuzzyScore(newPattern, newPattern.toLowerCase(), patternPos, word, lowWord, wordPos, options);
                    if (candidate) {
                        candidate[0] -= 3; // permutation penalty
                        if (!top || candidate[0] > top[0]) {
                            top = candidate;
                        }
                    }
                }
            }
        }
        return top;
    }
    function nextTypoPermutation(pattern, patternPos) {
        if (patternPos + 1 >= pattern.length) {
            return undefined;
        }
        const swap1 = pattern[patternPos];
        const swap2 = pattern[patternPos + 1];
        if (swap1 === swap2) {
            return undefined;
        }
        return pattern.slice(0, patternPos)
            + swap2
            + swap1
            + pattern.slice(patternPos + 2);
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2ZpbHRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBeUJoRyxnQkFVQztJQTRCRCxnRUFPQztJQUlELDRDQUVDO0lBMEJELDBCQUVDO0lBZ0tELDRDQXVDQztJQU9ELG9DQW1CQztJQXVFRCxvQ0FvQkM7SUFNRCxzQ0FHQztJQUVELDRCQVNDO0lBSUQsc0NBZ0JDO0lBZ0hELDBDQVlDO0lBd0NELGdDQXNKQztJQXdGRCxvRUFFQztJQUVELGdEQUVDO0lBbjFCRCxtQkFBbUI7SUFFbkI7Ozs7O09BS0c7SUFDSCxTQUFnQixFQUFFLENBQUMsR0FBRyxNQUFpQjtRQUN0QyxPQUFPLFVBQVUsSUFBWSxFQUFFLGtCQUEwQjtZQUN4RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDWCxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQyxDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQVM7SUFFSSxRQUFBLG1CQUFtQixHQUFZLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3JFLFFBQUEsYUFBYSxHQUFZLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRTNFLFNBQVMs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