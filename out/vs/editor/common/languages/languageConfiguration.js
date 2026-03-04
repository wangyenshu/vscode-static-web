/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AutoClosingPairs = exports.StandardAutoClosingPairConditional = exports.IndentAction = void 0;
    /**
     * Describes what to do with the indentation when pressing Enter.
     */
    var IndentAction;
    (function (IndentAction) {
        /**
         * Insert new line and copy the previous line's indentation.
         */
        IndentAction[IndentAction["None"] = 0] = "None";
        /**
         * Insert new line and indent once (relative to the previous line's indentation).
         */
        IndentAction[IndentAction["Indent"] = 1] = "Indent";
        /**
         * Insert two new lines:
         *  - the first one indented which will hold the cursor
         *  - the second one at the same indentation level
         */
        IndentAction[IndentAction["IndentOutdent"] = 2] = "IndentOutdent";
        /**
         * Insert new line and outdent once (relative to the previous line's indentation).
         */
        IndentAction[IndentAction["Outdent"] = 3] = "Outdent";
    })(IndentAction || (exports.IndentAction = IndentAction = {}));
    /**
     * @internal
     */
    class StandardAutoClosingPairConditional {
        constructor(source) {
            this._neutralCharacter = null;
            this._neutralCharacterSearched = false;
            this.open = source.open;
            this.close = source.close;
            // initially allowed in all tokens
            this._inString = true;
            this._inComment = true;
            this._inRegEx = true;
            if (Array.isArray(source.notIn)) {
                for (let i = 0, len = source.notIn.length; i < len; i++) {
                    const notIn = source.notIn[i];
                    switch (notIn) {
                        case 'string':
                            this._inString = false;
                            break;
                        case 'comment':
                            this._inComment = false;
                            break;
                        case 'regex':
                            this._inRegEx = false;
                            break;
                    }
                }
            }
        }
        isOK(standardToken) {
            switch (standardToken) {
                case 0 /* StandardTokenType.Other */:
                    return true;
                case 1 /* StandardTokenType.Comment */:
                    return this._inComment;
                case 2 /* StandardTokenType.String */:
                    return this._inString;
                case 3 /* StandardTokenType.RegEx */:
                    return this._inRegEx;
            }
        }
        shouldAutoClose(context, column) {
            // Always complete on empty line
            if (context.getTokenCount() === 0) {
                return true;
            }
            const tokenIndex = context.findTokenIndexAtOffset(column - 2);
            const standardTokenType = context.getStandardTokenType(tokenIndex);
            return this.isOK(standardTokenType);
        }
        _findNeutralCharacterInRange(fromCharCode, toCharCode) {
            for (let charCode = fromCharCode; charCode <= toCharCode; charCode++) {
                const character = String.fromCharCode(charCode);
                if (!this.open.includes(character) && !this.close.includes(character)) {
                    return character;
                }
            }
            return null;
        }
        /**
         * Find a character in the range [0-9a-zA-Z] that does not appear in the open or close
         */
        findNeutralCharacter() {
            if (!this._neutralCharacterSearched) {
                this._neutralCharacterSearched = true;
                if (!this._neutralCharacter) {
                    this._neutralCharacter = this._findNeutralCharacterInRange(48 /* CharCode.Digit0 */, 57 /* CharCode.Digit9 */);
                }
                if (!this._neutralCharacter) {
                    this._neutralCharacter = this._findNeutralCharacterInRange(97 /* CharCode.a */, 122 /* CharCode.z */);
                }
                if (!this._neutralCharacter) {
                    this._neutralCharacter = this._findNeutralCharacterInRange(65 /* CharCode.A */, 90 /* CharCode.Z */);
                }
            }
            return this._neutralCharacter;
        }
    }
    exports.StandardAutoClosingPairConditional = StandardAutoClosingPairConditional;
    /**
     * @internal
     */
    class AutoClosingPairs {
        constructor(autoClosingPairs) {
            this.autoClosingPairsOpenByStart = new Map();
            this.autoClosingPairsOpenByEnd = new Map();
            this.autoClosingPairsCloseByStart = new Map();
            this.autoClosingPairsCloseByEnd = new Map();
            this.autoClosingPairsCloseSingleChar = new Map();
            for (const pair of autoClosingPairs) {
                appendEntry(this.autoClosingPairsOpenByStart, pair.open.charAt(0), pair);
                appendEntry(this.autoClosingPairsOpenByEnd, pair.open.charAt(pair.open.length - 1), pair);
                appendEntry(this.autoClosingPairsCloseByStart, pair.close.charAt(0), pair);
                appendEntry(this.autoClosingPairsCloseByEnd, pair.close.charAt(pair.close.length - 1), pair);
                if (pair.close.length === 1 && pair.open.length === 1) {
                    appendEntry(this.autoClosingPairsCloseSingleChar, pair.close, pair);
                }
            }
        }
    }
    exports.AutoClosingPairs = AutoClosingPairs;
    function appendEntry(target, key, value) {
        if (target.has(key)) {
            target.get(key).push(value);
        }
        else {
            target.set(key, [value]);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VDb25maWd1cmF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9sYW5ndWFnZXMvbGFuZ3VhZ2VDb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlNaEc7O09BRUc7SUFDSCxJQUFZLFlBbUJYO0lBbkJELFdBQVksWUFBWTtRQUN2Qjs7V0FFRztRQUNILCtDQUFRLENBQUE7UUFDUjs7V0FFRztRQUNILG1EQUFVLENBQUE7UUFDVjs7OztXQUlHO1FBQ0gsaUVBQWlCLENBQUE7UUFDakI7O1dBRUc7UUFDSCxxREFBVyxDQUFBO0lBQ1osQ0FBQyxFQW5CVyxZQUFZLDRCQUFaLFlBQVksUUFtQnZCO0lBMENEOztPQUVHO0lBQ0gsTUFBYSxrQ0FBa0M7UUFVOUMsWUFBWSxNQUFtQztZQUh2QyxzQkFBaUIsR0FBa0IsSUFBSSxDQUFDO1lBQ3hDLDhCQUF5QixHQUFZLEtBQUssQ0FBQztZQUdsRCxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBRTFCLGtDQUFrQztZQUNsQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUN0QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUVyQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFF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