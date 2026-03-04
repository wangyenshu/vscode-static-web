/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/cursorCommon", "vs/editor/common/cursor/cursorDeleteOperations", "vs/editor/common/core/wordCharacterClassifier", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, strings, cursorCommon_1, cursorDeleteOperations_1, wordCharacterClassifier_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordPartOperations = exports.WordOperations = exports.WordNavigationType = void 0;
    var WordType;
    (function (WordType) {
        WordType[WordType["None"] = 0] = "None";
        WordType[WordType["Regular"] = 1] = "Regular";
        WordType[WordType["Separator"] = 2] = "Separator";
    })(WordType || (WordType = {}));
    var WordNavigationType;
    (function (WordNavigationType) {
        WordNavigationType[WordNavigationType["WordStart"] = 0] = "WordStart";
        WordNavigationType[WordNavigationType["WordStartFast"] = 1] = "WordStartFast";
        WordNavigationType[WordNavigationType["WordEnd"] = 2] = "WordEnd";
        WordNavigationType[WordNavigationType["WordAccessibility"] = 3] = "WordAccessibility"; // Respect chrome definition of a word
    })(WordNavigationType || (exports.WordNavigationType = WordNavigationType = {}));
    class WordOperations {
        static _createWord(lineContent, wordType, nextCharClass, start, end) {
            // console.log('WORD ==> ' + start + ' => ' + end + ':::: <<<' + lineContent.substring(start, end) + '>>>');
            return { start: start, end: end, wordType: wordType, nextCharClass: nextCharClass };
        }
        static _createIntlWord(intlWord, nextCharClass) {
            // console.log('INTL WORD ==> ' + intlWord.index + ' => ' + intlWord.index + intlWord.segment.length + ':::: <<<' + intlWord.segment + '>>>');
            return { start: intlWord.index, end: intlWord.index + intlWord.segment.length, wordType: 1 /* WordType.Regular */, nextCharClass: nextCharClass };
        }
        static _findPreviousWordOnLine(wordSeparators, model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            return this._doFindPreviousWordOnLine(lineContent, wordSeparators, position);
        }
        static _doFindPreviousWordOnLine(lineContent, wordSeparators, position) {
            let wordType = 0 /* WordType.None */;
            const previousIntlWord = wordSeparators.findPrevIntlWordBeforeOrAtOffset(lineContent, position.column - 2);
            for (let chIndex = position.column - 2; chIndex >= 0; chIndex--) {
                const chCode = lineContent.charCodeAt(chIndex);
                const chClass = wordSeparators.get(chCode);
                if (previousIntlWord && chIndex === previousIntlWord.index) {
                    return this._createIntlWord(previousIntlWord, chClass);
                }
                if (chClass === 0 /* WordCharacterClass.Regular */) {
                    if (wordType === 2 /* WordType.Separator */) {
                        return this._createWord(lineContent, wordType, chClass, chIndex + 1, this._findEndOfWord(lineContent, wordSeparators, wordType, chIndex + 1));
                    }
                    wordType = 1 /* WordType.Regular */;
                }
                else if (chClass === 2 /* WordCharacterClass.WordSeparator */) {
                    if (wordType === 1 /* WordType.Regular */) {
                        return this._createWord(lineContent, wordType, chClass, chIndex + 1, this._findEndOfWord(lineContent, wordSeparators, wordType, chIndex + 1));
                    }
                    wordType = 2 /* WordType.Separator */;
                }
                else if (chClass === 1 /* WordCharacterClass.Whitespace */) {
                    if (wordType !== 0 /* WordType.None */) {
                        return this._createWord(lineContent, wordType, chClass, chIndex + 1, this._findEndOfWord(lineContent, wordSeparators, wordType, chIndex + 1));
                    }
                }
            }
            if (wordType !== 0 /* WordType.None */) {
                return this._createWord(lineContent, wordType, 1 /* WordCharacterClass.Whitespace */, 0, this._findEndOfWord(lineContent, wordSeparators, wordType, 0));
            }
            return null;
        }
        static _findEndOfWord(lineContent, wordSeparators, wordType, startIndex) {
            const nextIntlWord = wordSeparators.findNextIntlWordAtOrAfterOffset(lineContent, startIndex);
            const len = lineContent.length;
            for (let chIndex = startIndex; chIndex < len; chIndex++) {
                const chCode = lineContent.charCodeAt(chIndex);
                const chClass = wordSeparators.get(chCode);
                if (nextIntlWord && chIndex === nextIntlWord.index + nextIntlWord.segment.length) {
                    return chIndex;
                }
                if (chClass === 1 /* WordCharacterClass.Whitespace */) {
                    return chIndex;
                }
                if (wordType === 1 /* WordType.Regular */ && chClass === 2 /* WordCharacterClass.WordSeparator */) {
                    return chIndex;
                }
                if (wordType === 2 /* WordType.Separator */ && chClass === 0 /* WordCharacterClass.Regular */) {
                    return chIndex;
                }
            }
            return len;
        }
        static _findNextWordOnLine(wordSeparators, model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            return this._doFindNextWordOnLine(lineContent, wordSeparators, position);
        }
        static _doFindNextWordOnLine(lineContent, wordSeparators, position) {
            let wordType = 0 /* WordType.None */;
            const len = lineContent.length;
            const nextIntlWord = wordSeparators.findNextIntlWordAtOrAfterOffset(lineContent, position.column - 1);
            for (let chIndex = position.column - 1; chIndex < len; chIndex++) {
                const chCode = lineContent.charCodeAt(chIndex);
                const chClass = wordSeparators.get(chCode);
                if (nextIntlWord && chIndex === nextIntlWord.index) {
                    return this._createIntlWord(nextIntlWord, chClass);
                }
                if (chClass === 0 /* WordCharacterClass.Regular */) {
                    if (wordType === 2 /* WordType.Separator */) {
                        return this._createWord(lineContent, wordType, chClass, this._findStartOfWord(lineContent, wordSeparators, wordType, chIndex - 1), chIndex);
                    }
                    wordType = 1 /* WordType.Regular */;
                }
                else if (chClass === 2 /* WordCharacterClass.WordSeparator */) {
                    if (wordType === 1 /* WordType.Regular */) {
                        return this._createWord(lineContent, wordType, chClass, this._findStartOfWord(lineContent, wordSeparators, wordType, chIndex - 1), chIndex);
                    }
                    wordType = 2 /* WordType.Separator */;
                }
                else if (chClass === 1 /* WordCharacterClass.Whitespace */) {
                    if (wordType !== 0 /* WordType.None */) {
                        return this._createWord(lineContent, wordType, chClass, this._findStartOfWord(lineContent, wordSeparators, wordType, chIndex - 1), chIndex);
                    }
                }
            }
            if (wordType !== 0 /* WordType.None */) {
                return this._createWord(lineContent, wordType, 1 /* WordCharacterClass.Whitespace */, this._findStartOfWord(lineContent, wordSeparators, wordType, len - 1), len);
            }
            return null;
        }
        static _findStartOfWord(lineContent, wordSeparators, wordType, startIndex) {
            const previousIntlWord = wordSeparators.findPrevIntlWordBeforeOrAtOffset(lineContent, startIndex);
            for (let chIndex = startIndex; chIndex >= 0; chIndex--) {
                const chCode = lineContent.charCodeAt(chIndex);
                const chClass = wordSeparators.get(chCode);
                if (previousIntlWord && chIndex === previousIntlWord.index) {
                    return chIndex;
                }
                if (chClass === 1 /* WordCharacterClass.Whitespace */) {
                    return chIndex + 1;
                }
                if (wordType === 1 /* WordType.Regular */ && chClass === 2 /* WordCharacterClass.WordSeparator */) {
                    return chIndex + 1;
                }
                if (wordType === 2 /* WordType.Separator */ && chClass === 0 /* WordCharacterClass.Regular */) {
                    return chIndex + 1;
                }
            }
            return 0;
        }
        static moveWordLeft(wordSeparators, model, position, wordNavigationType) {
            let lineNumber = position.lineNumber;
            let column = position.column;
            if (column === 1) {
                if (lineNumber > 1) {
                    lineNumber = lineNumber - 1;
                    column = model.getLineMaxColumn(lineNumber);
                }
            }
            let prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, column));
            if (wordNavigationType === 0 /* WordNavigationType.WordStart */) {
                return new position_1.Position(lineNumber, prevWordOnLine ? prevWordOnLine.start + 1 : 1);
            }
            if (wordNavigationType === 1 /* WordNavigationType.WordStartFast */) {
                if (prevWordOnLine
                    && prevWordOnLine.wordType === 2 /* WordType.Separator */
                    && prevWordOnLine.end - prevWordOnLine.start === 1
                    && prevWordOnLine.nextCharClass === 0 /* WordCharacterClass.Regular */) {
                    // Skip over a word made up of one single separator and followed by a regular character
                    prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, prevWordOnLine.start + 1));
                }
                return new position_1.Position(lineNumber, prevWordOnLine ? prevWordOnLine.start + 1 : 1);
            }
            if (wordNavigationType === 3 /* WordNavigationType.WordAccessibility */) {
                while (prevWordOnLine
                    && prevWordOnLine.wordType === 2 /* WordType.Separator */) {
                    // Skip over words made up of only separators
                    prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, prevWordOnLine.start + 1));
                }
                return new position_1.Position(lineNumber, prevWordOnLine ? prevWordOnLine.start + 1 : 1);
            }
            // We are stopping at the ending of words
            if (prevWordOnLine && column <= prevWordOnLine.end + 1) {
                prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, prevWordOnLine.start + 1));
            }
            return new position_1.Position(lineNumber, prevWordOnLine ? prevWordOnLine.end + 1 : 1);
        }
        static _moveWordPartLeft(model, position) {
            const lineNumber = position.lineNumber;
            const maxColumn = model.getLineMaxColumn(lineNumber);
            if (position.column === 1) {
                return (lineNumber > 1 ? new position_1.Position(lineNumber - 1, model.getLineMaxColumn(lineNumber - 1)) : position);
            }
            const lineContent = model.getLineContent(lineNumber);
            for (let column = position.column - 1; column > 1; column--) {
                const left = lineContent.charCodeAt(column - 2);
                const right = lineContent.charCodeAt(column - 1);
                if (left === 95 /* CharCode.Underline */ && right !== 95 /* CharCode.Underline */) {
                    // snake_case_variables
                    return new position_1.Position(lineNumber, column);
                }
                if (left === 45 /* CharCode.Dash */ && right !== 45 /* CharCode.Dash */) {
                    // kebab-case-variables
                    return new position_1.Position(lineNumber, column);
                }
                if ((strings.isLowerAsciiLetter(left) || strings.isAsciiDigit(left)) && strings.isUpperAsciiLetter(right)) {
                    // camelCaseVariables
                    return new position_1.Position(lineNumber, column);
                }
                if (strings.isUpperAsciiLetter(left) && strings.isUpperAsciiLetter(right)) {
                    // thisIsACamelCaseWithOneLetterWords
                    if (column + 1 < maxColumn) {
                        const rightRight = lineContent.charCodeAt(column);
                        if (strings.isLowerAsciiLetter(rightRight) || strings.isAsciiDigit(rightRight)) {
                            return new position_1.Position(lineNumber, column);
                        }
                    }
                }
            }
            return new position_1.Position(lineNumber, 1);
        }
        static moveWordRight(wordSeparators, model, position, wordNavigationType) {
            let lineNumber = position.lineNumber;
            let column = position.column;
            let movedDown = false;
            if (column === model.getLineMaxColumn(lineNumber)) {
                if (lineNumber < model.getLineCount()) {
                    movedDown = true;
                    lineNumber = lineNumber + 1;
                    column = 1;
                }
            }
            let nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, column));
            if (wordNavigationType === 2 /* WordNavigationType.WordEnd */) {
                if (nextWordOnLine && nextWordOnLine.wordType === 2 /* WordType.Separator */) {
                    if (nextWordOnLine.end - nextWordOnLine.start === 1 && nextWordOnLine.nextCharClass === 0 /* WordCharacterClass.Regular */) {
                        // Skip over a word made up of one single separator and followed by a regular character
                        nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, nextWordOnLine.end + 1));
                    }
                }
                if (nextWordOnLine) {
                    column = nextWordOnLine.end + 1;
                }
                else {
                    column = model.getLineMaxColumn(lineNumber);
                }
            }
            else if (wordNavigationType === 3 /* WordNavigationType.WordAccessibility */) {
                if (movedDown) {
                    // If we move to the next line, pretend that the cursor is right before the first character.
                    // This is needed when the first word starts right at the first character - and in order not to miss it,
                    // we need to start before.
                    column = 0;
                }
                while (nextWordOnLine
                    && (nextWordOnLine.wordType === 2 /* WordType.Separator */
                        || nextWordOnLine.start + 1 <= column)) {
                    // Skip over a word made up of one single separator
                    // Also skip over word if it begins before current cursor position to ascertain we're moving forward at least 1 character.
                    nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, nextWordOnLine.end + 1));
                }
                if (nextWordOnLine) {
                    column = nextWordOnLine.start + 1;
                }
                else {
                    column = model.getLineMaxColumn(lineNumber);
                }
            }
            else {
                if (nextWordOnLine && !movedDown && column >= nextWordOnLine.start + 1) {
                    nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, nextWordOnLine.end + 1));
                }
                if (nextWordOnLine) {
                    column = nextWordOnLine.start + 1;
                }
                else {
                    column = model.getLineMaxColumn(lineNumber);
                }
            }
            return new position_1.Position(lineNumber, column);
        }
        static _moveWordPartRight(model, position) {
            const lineNumber = position.lineNumber;
            const maxColumn = model.getLineMaxColumn(lineNumber);
            if (position.column === maxColumn) {
                return (lineNumber < model.getLineCount() ? new position_1.Position(lineNumber + 1, 1) : position);
            }
            const lineContent = model.getLineContent(lineNumber);
            for (let column = position.column + 1; column < maxColumn; column++) {
                const left = lineContent.charCodeAt(column - 2);
                const right = lineContent.charCodeAt(column - 1);
                if (left !== 95 /* CharCode.Underline */ && right === 95 /* CharCode.Underline */) {
                    // snake_case_variables
                    return new position_1.Position(lineNumber, column);
                }
                if (left !== 45 /* CharCode.Dash */ && right === 45 /* CharCode.Dash */) {
                    // kebab-case-variables
                    return new position_1.Position(lineNumber, column);
                }
                if ((strings.isLowerAsciiLetter(left) || strings.isAsciiDigit(left)) && strings.isUpperAsciiLetter(right)) {
                    // camelCaseVariables
                    return new position_1.Position(lineNumber, column);
                }
                if (strings.isUpperAsciiLetter(left) && strings.isUpperAsciiLetter(right)) {
                    // thisIsACamelCaseWithOneLetterWords
                    if (column + 1 < maxColumn) {
                        const rightRight = lineContent.charCodeAt(column);
                        if (strings.isLowerAsciiLetter(rightRight) || strings.isAsciiDigit(rightRight)) {
                            return new position_1.Position(lineNumber, column);
                        }
                    }
                }
            }
            return new position_1.Position(lineNumber, maxColumn);
        }
        static _deleteWordLeftWhitespace(model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            const startIndex = position.column - 2;
            const lastNonWhitespace = strings.lastNonWhitespaceIndex(lineContent, startIndex);
            if (lastNonWhitespace + 1 < startIndex) {
                return new range_1.Range(position.lineNumber, lastNonWhitespace + 2, position.lineNumber, position.column);
            }
            return null;
        }
        static deleteWordLeft(ctx, wordNavigationType) {
            const wordSeparators = ctx.wordSeparators;
            const model = ctx.model;
            const selection = ctx.selection;
            const whitespaceHeuristics = ctx.whitespaceHeuristics;
            if (!selection.isEmpty()) {
                return selection;
            }
            if (cursorDeleteOperations_1.DeleteOperations.isAutoClosingPairDelete(ctx.autoClosingDelete, ctx.autoClosingBrackets, ctx.autoClosingQuotes, ctx.autoClosingPairs.autoClosingPairsOpenByEnd, ctx.model, [ctx.selection], ctx.autoClosedCharacters)) {
                const position = ctx.selection.getPosition();
                return new range_1.Range(position.lineNumber, position.column - 1, position.lineNumber, position.column + 1);
            }
            const position = new position_1.Position(selection.positionLineNumber, selection.positionColumn);
            let lineNumber = position.lineNumber;
            let column = position.column;
            if (lineNumber === 1 && column === 1) {
                // Ignore deleting at beginning of file
                return null;
            }
            if (whitespaceHeuristics) {
                const r = this._deleteWordLeftWhitespace(model, position);
                if (r) {
                    return r;
                }
            }
            let prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, position);
            if (wordNavigationType === 0 /* WordNavigationType.WordStart */) {
                if (prevWordOnLine) {
                    column = prevWordOnLine.start + 1;
                }
                else {
                    if (column > 1) {
                        column = 1;
                    }
                    else {
                        lineNumber--;
                        column = model.getLineMaxColumn(lineNumber);
                    }
                }
            }
            else {
                if (prevWordOnLine && column <= prevWordOnLine.end + 1) {
                    prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, prevWordOnLine.start + 1));
                }
                if (prevWordOnLine) {
                    column = prevWordOnLine.end + 1;
                }
                else {
                    if (column > 1) {
                        column = 1;
                    }
                    else {
                        lineNumber--;
                        column = model.getLineMaxColumn(lineNumber);
                    }
                }
            }
            return new range_1.Range(lineNumber, column, position.lineNumber, position.column);
        }
        static deleteInsideWord(wordSeparators, model, selection) {
            if (!selection.isEmpty()) {
                return selection;
            }
            const position = new position_1.Position(selection.positionLineNumber, selection.positionColumn);
            const r = this._deleteInsideWordWhitespace(model, position);
            if (r) {
                return r;
            }
            return this._deleteInsideWordDetermineDeleteRange(wordSeparators, model, position);
        }
        static _charAtIsWhitespace(str, index) {
            const charCode = str.charCodeAt(index);
            return (charCode === 32 /* CharCode.Space */ || charCode === 9 /* CharCode.Tab */);
        }
        static _deleteInsideWordWhitespace(model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            const lineContentLength = lineContent.length;
            if (lineContentLength === 0) {
                // empty line
                return null;
            }
            let leftIndex = Math.max(position.column - 2, 0);
            if (!this._charAtIsWhitespace(lineContent, leftIndex)) {
                // touches a non-whitespace character to the left
                return null;
            }
            let rightIndex = Math.min(position.column - 1, lineContentLength - 1);
            if (!this._charAtIsWhitespace(lineContent, rightIndex)) {
                // touches a non-whitespace character to the right
                return null;
            }
            // walk over whitespace to the left
            while (leftIndex > 0 && this._charAtIsWhitespace(lineContent, leftIndex - 1)) {
                leftIndex--;
            }
            // walk over whitespace to the right
            while (rightIndex + 1 < lineContentLength && this._charAtIsWhitespace(lineContent, rightIndex + 1)) {
                rightIndex++;
            }
            return new range_1.Range(position.lineNumber, leftIndex + 1, position.lineNumber, rightIndex + 2);
        }
        static _deleteInsideWordDetermineDeleteRange(wordSeparators, model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            const lineLength = lineContent.length;
            if (lineLength === 0) {
                // empty line
                if (position.lineNumber > 1) {
                    return new range_1.Range(position.lineNumber - 1, model.getLineMaxColumn(position.lineNumber - 1), position.lineNumber, 1);
                }
                else {
                    if (position.lineNumber < model.getLineCount()) {
                        return new range_1.Range(position.lineNumber, 1, position.lineNumber + 1, 1);
                    }
                    else {
                        // empty model
                        return new range_1.Range(position.lineNumber, 1, position.lineNumber, 1);
                    }
                }
            }
            const touchesWord = (word) => {
                return (word.start + 1 <= position.column && position.column <= word.end + 1);
            };
            const createRangeWithPosition = (startColumn, endColumn) => {
                startColumn = Math.min(startColumn, position.column);
                endColumn = Math.max(endColumn, position.column);
                return new range_1.Range(position.lineNumber, startColumn, position.lineNumber, endColumn);
            };
            const deleteWordAndAdjacentWhitespace = (word) => {
                let startColumn = word.start + 1;
                let endColumn = word.end + 1;
                let expandedToTheRight = false;
                while (endColumn - 1 < lineLength && this._charAtIsWhitespace(lineContent, endColumn - 1)) {
                    expandedToTheRight = true;
                    endColumn++;
                }
                if (!expandedToTheRight) {
                    while (startColumn > 1 && this._charAtIsWhitespace(lineContent, startColumn - 2)) {
                        startColumn--;
                    }
                }
                return createRangeWithPosition(startColumn, endColumn);
            };
            const prevWordOnLine = WordOperations._findPreviousWordOnLine(wordSeparators, model, position);
            if (prevWordOnLine && touchesWord(prevWordOnLine)) {
                return deleteWordAndAdjacentWhitespace(prevWordOnLine);
            }
            const nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, position);
            if (nextWordOnLine && touchesWord(nextWordOnLine)) {
                return deleteWordAndAdjacentWhitespace(nextWordOnLine);
            }
            if (prevWordOnLine && nextWordOnLine) {
                return createRangeWithPosition(prevWordOnLine.end + 1, nextWordOnLine.start + 1);
            }
            if (prevWordOnLine) {
                return createRangeWithPosition(prevWordOnLine.start + 1, prevWordOnLine.end + 1);
            }
            if (nextWordOnLine) {
                return createRangeWithPosition(nextWordOnLine.start + 1, nextWordOnLine.end + 1);
            }
            return createRangeWithPosition(1, lineLength + 1);
        }
        static _deleteWordPartLeft(model, selection) {
            if (!selection.isEmpty()) {
                return selection;
            }
            const pos = selection.getPosition();
            const toPosition = WordOperations._moveWordPartLeft(model, pos);
            return new range_1.Range(pos.lineNumber, pos.column, toPosition.lineNumber, toPosition.column);
        }
        static _findFirstNonWhitespaceChar(str, startIndex) {
            const len = str.length;
            for (let chIndex = startIndex; chIndex < len; chIndex++) {
                const ch = str.charAt(chIndex);
                if (ch !== ' ' && ch !== '\t') {
                    return chIndex;
                }
            }
            return len;
        }
        static _deleteWordRightWhitespace(model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            const startIndex = position.column - 1;
            const firstNonWhitespace = this._findFirstNonWhitespaceChar(lineContent, startIndex);
            if (startIndex + 1 < firstNonWhitespace) {
                // bingo
                return new range_1.Range(position.lineNumber, position.column, position.lineNumber, firstNonWhitespace + 1);
            }
            return null;
        }
        static deleteWordRight(ctx, wordNavigationType) {
            const wordSeparators = ctx.wordSeparators;
            const model = ctx.model;
            const selection = ctx.selection;
            const whitespaceHeuristics = ctx.whitespaceHeuristics;
            if (!selection.isEmpty()) {
                return selection;
            }
            const position = new position_1.Position(selection.positionLineNumber, selection.positionColumn);
            let lineNumber = position.lineNumber;
            let column = position.column;
            const lineCount = model.getLineCount();
            const maxColumn = model.getLineMaxColumn(lineNumber);
            if (lineNumber === lineCount && column === maxColumn) {
                // Ignore deleting at end of file
                return null;
            }
            if (whitespaceHeuristics) {
                const r = this._deleteWordRightWhitespace(model, position);
                if (r) {
                    return r;
                }
            }
            let nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, position);
            if (wordNavigationType === 2 /* WordNavigationType.WordEnd */) {
                if (nextWordOnLine) {
                    column = nextWordOnLine.end + 1;
                }
                else {
                    if (column < maxColumn || lineNumber === lineCount) {
                        column = maxColumn;
                    }
                    else {
                        lineNumber++;
                        nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, 1));
                        if (nextWordOnLine) {
                            column = nextWordOnLine.start + 1;
                        }
                        else {
                            column = model.getLineMaxColumn(lineNumber);
                        }
                    }
                }
            }
            else {
                if (nextWordOnLine && column >= nextWordOnLine.start + 1) {
                    nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, nextWordOnLine.end + 1));
                }
                if (nextWordOnLine) {
                    column = nextWordOnLine.start + 1;
                }
                else {
                    if (column < maxColumn || lineNumber === lineCount) {
                        column = maxColumn;
                    }
                    else {
                        lineNumber++;
                        nextWordOnLine = WordOperations._findNextWordOnLine(wordSeparators, model, new position_1.Position(lineNumber, 1));
                        if (nextWordOnLine) {
                            column = nextWordOnLine.start + 1;
                        }
                        else {
                            column = model.getLineMaxColumn(lineNumber);
                        }
                    }
                }
            }
            return new range_1.Range(lineNumber, column, position.lineNumber, position.column);
        }
        static _deleteWordPartRight(model, selection) {
            if (!selection.isEmpty()) {
                return selection;
            }
            const pos = selection.getPosition();
            const toPosition = WordOperations._moveWordPartRight(model, pos);
            return new range_1.Range(pos.lineNumber, pos.column, toPosition.lineNumber, toPosition.column);
        }
        static _createWordAtPosition(model, lineNumber, word) {
            const range = new range_1.Range(lineNumber, word.start + 1, lineNumber, word.end + 1);
            return {
                word: model.getValueInRange(range),
                startColumn: range.startColumn,
                endColumn: range.endColumn
            };
        }
        static getWordAtPosition(model, _wordSeparators, _intlSegmenterLocales, position) {
            const wordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(_wordSeparators, _intlSegmenterLocales);
            const prevWord = WordOperations._findPreviousWordOnLine(wordSeparators, model, position);
            if (prevWord && prevWord.wordType === 1 /* WordType.Regular */ && prevWord.start <= position.column - 1 && position.column - 1 <= prevWord.end) {
                return WordOperations._createWordAtPosition(model, position.lineNumber, prevWord);
            }
            const nextWord = WordOperations._findNextWordOnLine(wordSeparators, model, position);
            if (nextWord && nextWord.wordType === 1 /* WordType.Regular */ && nextWord.start <= position.column - 1 && position.column - 1 <= nextWord.end) {
                return WordOperations._createWordAtPosition(model, position.lineNumber, nextWord);
            }
            return null;
        }
        static word(config, model, cursor, inSelectionMode, position) {
            const wordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(config.wordSeparators, config.wordSegmenterLocales);
            const prevWord = WordOperations._findPreviousWordOnLine(wordSeparators, model, position);
            const nextWord = WordOperations._findNextWordOnLine(wordSeparators, model, position);
            if (!inSelectionMode) {
                // Entering word selection for the first time
                let startColumn;
                let endColumn;
                if (prevWord && prevWord.wordType === 1 /* WordType.Regular */ && prevWord.start <= position.column - 1 && position.column - 1 <= prevWord.end) {
                    // isTouchingPrevWord
                    startColumn = prevWord.start + 1;
                    endColumn = prevWord.end + 1;
                }
                else if (nextWord && nextWord.wordType === 1 /* WordType.Regular */ && nextWord.start <= position.column - 1 && position.column - 1 <= nextWord.end) {
                    // isTouchingNextWord
                    startColumn = nextWord.start + 1;
                    endColumn = nextWord.end + 1;
                }
                else {
                    if (prevWord) {
                        startColumn = prevWord.end + 1;
                    }
                    else {
                        startColumn = 1;
                    }
                    if (nextWord) {
                        endColumn = nextWord.start + 1;
                    }
                    else {
                        endColumn = model.getLineMaxColumn(position.lineNumber);
                    }
                }
                return new cursorCommon_1.SingleCursorState(new range_1.Range(position.lineNumber, startColumn, position.lineNumber, endColumn), 1 /* SelectionStartKind.Word */, 0, new position_1.Position(position.lineNumber, endColumn), 0);
            }
            let startColumn;
            let endColumn;
            if (prevWord && prevWord.wordType === 1 /* WordType.Regular */ && prevWord.start < position.column - 1 && position.column - 1 < prevWord.end) {
                // isInsidePrevWord
                startColumn = prevWord.start + 1;
                endColumn = prevWord.end + 1;
            }
            else if (nextWord && nextWord.wordType === 1 /* WordType.Regular */ && nextWord.start < position.column - 1 && position.column - 1 < nextWord.end) {
                // isInsideNextWord
                startColumn = nextWord.start + 1;
                endColumn = nextWord.end + 1;
            }
            else {
                startColumn = position.column;
                endColumn = position.column;
            }
            const lineNumber = position.lineNumber;
            let column;
            if (cursor.selectionStart.containsPosition(position)) {
                column = cursor.selectionStart.endColumn;
            }
            else if (position.isBeforeOrEqual(cursor.selectionStart.getStartPosition())) {
                column = startColumn;
                const possiblePosition = new position_1.Position(lineNumber, column);
                if (cursor.selectionStart.containsPosition(possiblePosition)) {
                    column = cursor.selectionStart.endColumn;
                }
            }
            else {
                column = endColumn;
                const possiblePosition = new position_1.Position(lineNumber, column);
                if (cursor.selectionStart.containsPosition(possiblePosition)) {
                    column = cursor.selectionStart.startColumn;
                }
            }
            return cursor.move(true, lineNumber, column, 0);
        }
    }
    exports.WordOperations = WordOperations;
    class WordPartOperations extends WordOperations {
        static deleteWordPartLeft(ctx) {
            const candidates = enforceDefined([
                WordOperations.deleteWordLeft(ctx, 0 /* WordNavigationType.WordStart */),
                WordOperations.deleteWordLeft(ctx, 2 /* WordNavigationType.WordEnd */),
                WordOperations._deleteWordPartLeft(ctx.model, ctx.selection)
            ]);
            candidates.sort(range_1.Range.compareRangesUsingEnds);
            return candidates[2];
        }
        static deleteWordPartRight(ctx) {
            const candidates = enforceDefined([
                WordOperations.deleteWordRight(ctx, 0 /* WordNavigationType.WordStart */),
                WordOperations.deleteWordRight(ctx, 2 /* WordNavigationType.WordEnd */),
                WordOperations._deleteWordPartRight(ctx.model, ctx.selection)
            ]);
            candidates.sort(range_1.Range.compareRangesUsingStarts);
            return candidates[0];
        }
        static moveWordPartLeft(wordSeparators, model, position) {
            const candidates = enforceDefined([
                WordOperations.moveWordLeft(wordSeparators, model, position, 0 /* WordNavigationType.WordStart */),
                WordOperations.moveWordLeft(wordSeparators, model, position, 2 /* WordNavigationType.WordEnd */),
                WordOperations._moveWordPartLeft(model, position)
            ]);
            candidates.sort(position_1.Position.compare);
            return candidates[2];
        }
        static moveWordPartRight(wordSeparators, model, position) {
            const candidates = enforceDefined([
                WordOperations.moveWordRight(wordSeparators, model, position, 0 /* WordNavigationType.WordStart */),
                WordOperations.moveWordRight(wordSeparators, model, position, 2 /* WordNavigationType.WordEnd */),
                WordOperations._moveWordPartRight(model, position)
            ]);
            candidates.sort(position_1.Position.compare);
            return candidates[0];
        }
    }
    exports.WordPartOperations = WordPartOperations;
    function enforceDefined(arr) {
        return arr.filter(el => Boolean(el));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yV29yZE9wZXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2N1cnNvci9jdXJzb3JXb3JkT3BlcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQ2hHLElBQVcsUUFJVjtJQUpELFdBQVcsUUFBUTtRQUNsQix1Q0FBUSxDQUFBO1FBQ1IsNkNBQVcsQ0FBQTtRQUNYLGlEQUFhLENBQUE7SUFDZCxDQUFDLEVBSlUsUUFBUSxLQUFSLFFBQVEsUUFJbEI7SUFFRCxJQUFrQixrQkFLakI7SUFMRCxXQUFrQixrQkFBa0I7UUFDbkMscUVBQWEsQ0FBQTtRQUNiLDZFQUFpQixDQUFBO1FBQ2pCLGlFQUFXLENBQUE7UUFDWCxxRkFBcUIsQ0FBQSxDQUFDLHNDQUFzQztJQUM3RCxDQUFDLEVBTGlCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBS25DO0lBY0QsTUFBYSxjQUFjO1FBRWxCLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBbUIsRUFBRSxRQUFrQixFQUFFLGFBQWlDLEVBQUUsS0FBYSxFQUFFLEdBQVc7WUFDaEksNEdBQTRHO1lBQzVHLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLENBQUM7UUFDckYsQ0FBQztRQUVPLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBNkIsRUFBRSxhQUFpQztZQUM5Riw4SUFBOEk7WUFDOUksT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFFBQVEsMEJBQWtCLEVBQUUsYUFBYSxF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