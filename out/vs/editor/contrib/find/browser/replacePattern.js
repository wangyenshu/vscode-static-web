/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/search"], function (require, exports, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplacePiece = exports.ReplacePattern = void 0;
    exports.parseReplaceString = parseReplaceString;
    var ReplacePatternKind;
    (function (ReplacePatternKind) {
        ReplacePatternKind[ReplacePatternKind["StaticValue"] = 0] = "StaticValue";
        ReplacePatternKind[ReplacePatternKind["DynamicPieces"] = 1] = "DynamicPieces";
    })(ReplacePatternKind || (ReplacePatternKind = {}));
    /**
     * Assigned when the replace pattern is entirely static.
     */
    class StaticValueReplacePattern {
        constructor(staticValue) {
            this.staticValue = staticValue;
            this.kind = 0 /* ReplacePatternKind.StaticValue */;
        }
    }
    /**
     * Assigned when the replace pattern has replacement patterns.
     */
    class DynamicPiecesReplacePattern {
        constructor(pieces) {
            this.pieces = pieces;
            this.kind = 1 /* ReplacePatternKind.DynamicPieces */;
        }
    }
    class ReplacePattern {
        static fromStaticValue(value) {
            return new ReplacePattern([ReplacePiece.staticValue(value)]);
        }
        get hasReplacementPatterns() {
            return (this._state.kind === 1 /* ReplacePatternKind.DynamicPieces */);
        }
        constructor(pieces) {
            if (!pieces || pieces.length === 0) {
                this._state = new StaticValueReplacePattern('');
            }
            else if (pieces.length === 1 && pieces[0].staticValue !== null) {
                this._state = new StaticValueReplacePattern(pieces[0].staticValue);
            }
            else {
                this._state = new DynamicPiecesReplacePattern(pieces);
            }
        }
        buildReplaceString(matches, preserveCase) {
            if (this._state.kind === 0 /* ReplacePatternKind.StaticValue */) {
                if (preserveCase) {
                    return (0, search_1.buildReplaceStringWithCasePreserved)(matches, this._state.staticValue);
                }
                else {
                    return this._state.staticValue;
                }
            }
            let result = '';
            for (let i = 0, len = this._state.pieces.length; i < len; i++) {
                const piece = this._state.pieces[i];
                if (piece.staticValue !== null) {
                    // static value ReplacePiece
                    result += piece.staticValue;
                    continue;
                }
                // match index ReplacePiece
                let match = ReplacePattern._substitute(piece.matchIndex, matches);
                if (piece.caseOps !== null && piece.caseOps.length > 0) {
                    const repl = [];
                    const lenOps = piece.caseOps.length;
                    let opIdx = 0;
                    for (let idx = 0, len = match.length; idx < len; idx++) {
                        if (opIdx >= lenOps) {
                            repl.push(match.slice(idx));
                            break;
                        }
                        switch (piece.caseOps[opIdx]) {
                            case 'U':
                                repl.push(match[idx].toUpperCase());
                                break;
                            case 'u':
                                repl.push(match[idx].toUpperCase());
                                opIdx++;
                                break;
                            case 'L':
                                repl.push(match[idx].toLowerCase());
                                break;
                            case 'l':
                                repl.push(match[idx].toLowerCase());
                                opIdx++;
                                break;
                            default:
                                repl.push(match[idx]);
                        }
                    }
                    match = repl.join('');
                }
                result += match;
            }
            return result;
        }
        static _substitute(matchIndex, matches) {
            if (matches === null) {
                return '';
            }
            if (matchIndex === 0) {
                return matches[0];
            }
            let remainder = '';
            while (matchIndex > 0) {
                if (matchIndex < matches.length) {
                    // A match can be undefined
                    const match = (matches[matchIndex] || '');
                    return match + remainder;
                }
                remainder = String(matchIndex % 10) + remainder;
                matchIndex = Math.floor(matchIndex / 10);
            }
            return '$' + remainder;
        }
    }
    exports.ReplacePattern = ReplacePattern;
    /**
     * A replace piece can either be a static string or an index to a specific match.
     */
    class ReplacePiece {
        static staticValue(value) {
            return new ReplacePiece(value, -1, null);
        }
        static matchIndex(index) {
            return new ReplacePiece(null, index, null);
        }
        static caseOps(index, caseOps) {
            return new ReplacePiece(null, index, caseOps);
        }
        constructor(staticValue, matchIndex, caseOps) {
            this.staticValue = staticValue;
            this.matchIndex = matchIndex;
            if (!caseOps || caseOps.length === 0) {
                this.caseOps = null;
            }
            else {
                this.caseOps = caseOps.slice(0);
            }
        }
    }
    exports.ReplacePiece = ReplacePiece;
    class ReplacePieceBuilder {
        constructor(source) {
            this._source = source;
            this._lastCharIndex = 0;
            this._result = [];
            this._resultLen = 0;
            this._currentStaticPiece = '';
        }
        emitUnchanged(toCharIndex) {
            this._emitStatic(this._source.substring(this._lastCharIndex, toCharIndex));
            this._lastCharIndex = toCharIndex;
        }
        emitStatic(value, toCharIndex) {
            this._emitStatic(value);
            this._lastCharIndex = toCharIndex;
        }
        _emitStatic(value) {
            if (value.length === 0) {
                return;
            }
            this._currentStaticPiece += value;
        }
        emitMatchIndex(index, toCharIndex, caseOps) {
            if (this._currentStaticPiece.length !== 0) {
                this._result[this._resultLen++] = ReplacePiece.staticValue(this._currentStaticPiece);
                this._currentStaticPiece = '';
            }
            this._result[this._resultLen++] = ReplacePiece.caseOps(index, caseOps);
            this._lastCharIndex = toCharIndex;
        }
        finalize() {
            this.emitUnchanged(this._source.length);
            if (this._currentStaticPiece.length !== 0) {
                this._result[this._resultLen++] = ReplacePiece.staticValue(this._currentStaticPiece);
                this._currentStaticPiece = '';
            }
            return new ReplacePattern(this._result);
        }
    }
    /**
     * \n			=> inserts a LF
     * \t			=> inserts a TAB
     * \\			=> inserts a "\".
     * \u			=> upper-cases one character in a match.
     * \U			=> upper-cases ALL remaining characters in a match.
     * \l			=> lower-cases one character in a match.
     * \L			=> lower-cases ALL remaining characters in a match.
     * $$			=> inserts a "$".
     * $& and $0	=> inserts the matched substring.
     * $n			=> Where n is a non-negative integer lesser than 100, inserts the nth parenthesized submatch string
     * everything else stays untouched
     *
     * Also see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
     */
    function parseReplaceString(replaceString) {
        if (!replaceString || replaceString.length === 0) {
            return new ReplacePattern(null);
        }
        const caseOps = [];
        const result = new ReplacePieceBuilder(replaceString);
        for (let i = 0, len = replaceString.length; i < len; i++) {
            const chCode = replaceString.charCodeAt(i);
            if (chCode === 92 /* CharCode.Backslash */) {
                // move to next char
                i++;
                if (i >= len) {
                    // string ends with a \
                    break;
                }
                const nextChCode = replaceString.charCodeAt(i);
                // let replaceWithCharacter: string | null = null;
                switch (nextChCode) {
                    case 92 /* CharCode.Backslash */:
                        // \\ => inserts a "\"
                        result.emitUnchanged(i - 1);
                        result.emitStatic('\\', i + 1);
                        break;
                    case 110 /* CharCode.n */:
                        // \n => inserts a LF
                        result.emitUnchanged(i - 1);
                        result.emitStatic('\n', i + 1);
                        break;
                    case 116 /* CharCode.t */:
                        // \t => inserts a TAB
                        result.emitUnchanged(i - 1);
                        result.emitStatic('\t', i + 1);
                        break;
                    // Case modification of string replacements, patterned after Boost, but only applied
                    // to the replacement text, not subsequent content.
                    case 117 /* CharCode.u */:
                    // \u => upper-cases one character.
                    case 85 /* CharCode.U */:
                    // \U => upper-cases ALL following characters.
                    case 108 /* CharCode.l */:
                    // \l => lower-cases one character.
                    case 76 /* CharCode.L */:
                        // \L => lower-cases ALL following characters.
                        result.emitUnchanged(i - 1);
                        result.emitStatic('', i + 1);
                        caseOps.push(String.fromCharCode(nextChCode));
                        break;
                }
                continue;
            }
            if (chCode === 36 /* CharCode.DollarSign */) {
                // move to next char
                i++;
                if (i >= len) {
                    // string ends with a $
                    break;
                }
                const nextChCode = replaceString.charCodeAt(i);
                if (nextChCode === 36 /* CharCode.DollarSign */) {
                    // $$ => inserts a "$"
                    result.emitUnchanged(i - 1);
                    result.emitStatic('$', i + 1);
                    continue;
                }
                if (nextChCode === 48 /* CharCode.Digit0 */ || nextChCode === 38 /* CharCode.Ampersand */) {
                    // $& and $0 => inserts the matched substring.
                    result.emitUnchanged(i - 1);
                    result.emitMatchIndex(0, i + 1, caseOps);
                    caseOps.length = 0;
                    continue;
                }
                if (49 /* CharCode.Digit1 */ <= nextChCode && nextChCode <= 57 /* CharCode.Digit9 */) {
                    // $n
                    let matchIndex = nextChCode - 48 /* CharCode.Digit0 */;
                    // peek next char to probe for $nn
                    if (i + 1 < len) {
                        const nextNextChCode = replaceString.charCodeAt(i + 1);
                        if (48 /* CharCode.Digit0 */ <= nextNextChCode && nextNextChCode <= 57 /* CharCode.Digit9 */) {
                            // $nn
                            // move to next char
                            i++;
                            matchIndex = matchIndex * 10 + (nextNextChCode - 48 /* CharCode.Digit0 */);
                            result.emitUnchanged(i - 2);
                            result.emitMatchIndex(matchIndex, i + 1, caseOps);
                            caseOps.length = 0;
                            continue;
                        }
                    }
                    result.emitUnchanged(i - 1);
                    result.emitMatchIndex(matchIndex, i + 1, caseOps);
                    caseOps.length = 0;
                    continue;
                }
            }
        }
        return result.finalize();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZVBhdHRlcm4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9maW5kL2Jyb3dzZXIvcmVwbGFjZVBhdHRlcm4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa09oRyxnREFxSEM7SUFsVkQsSUFBVyxrQkFHVjtJQUhELFdBQVcsa0JBQWtCO1FBQzVCLHlFQUFlLENBQUE7UUFDZiw2RUFBaUIsQ0FBQTtJQUNsQixDQUFDLEVBSFUsa0JBQWtCLEtBQWxCLGtCQUFrQixRQUc1QjtJQUVEOztPQUVHO0lBQ0gsTUFBTSx5QkFBeUI7UUFFOUIsWUFBNEIsV0FBbUI7WUFBbkIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFEL0IsU0FBSSwwQ0FBa0M7UUFDSCxDQUFDO0tBQ3BEO0lBRUQ7O09BRUc7SUFDSCxNQUFNLDJCQUEyQjtRQUVoQyxZQUE0QixNQUFzQjtZQUF0QixXQUFNLEdBQU4sTUFBTSxDQUFnQjtZQURsQyxTQUFJLDRDQUFvQztRQUNGLENBQUM7S0FDdkQ7SUFFRCxNQUFhLGNBQWM7UUFFbkIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFhO1lBQzFDLE9BQU8sSUFBSSxjQUFjLENBQUMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBSUQsSUFBVyxzQkFBc0I7WUFDaEMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSw2Q0FBcUMsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxZQUFZLE1BQTZCO1lBQ3hDLElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLHlCQUF5QixDQUFDLEVB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