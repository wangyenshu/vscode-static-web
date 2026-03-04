/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/nls"], function (require, exports, errors_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Scanner = exports.TokenType = void 0;
    var TokenType;
    (function (TokenType) {
        TokenType[TokenType["LParen"] = 0] = "LParen";
        TokenType[TokenType["RParen"] = 1] = "RParen";
        TokenType[TokenType["Neg"] = 2] = "Neg";
        TokenType[TokenType["Eq"] = 3] = "Eq";
        TokenType[TokenType["NotEq"] = 4] = "NotEq";
        TokenType[TokenType["Lt"] = 5] = "Lt";
        TokenType[TokenType["LtEq"] = 6] = "LtEq";
        TokenType[TokenType["Gt"] = 7] = "Gt";
        TokenType[TokenType["GtEq"] = 8] = "GtEq";
        TokenType[TokenType["RegexOp"] = 9] = "RegexOp";
        TokenType[TokenType["RegexStr"] = 10] = "RegexStr";
        TokenType[TokenType["True"] = 11] = "True";
        TokenType[TokenType["False"] = 12] = "False";
        TokenType[TokenType["In"] = 13] = "In";
        TokenType[TokenType["Not"] = 14] = "Not";
        TokenType[TokenType["And"] = 15] = "And";
        TokenType[TokenType["Or"] = 16] = "Or";
        TokenType[TokenType["Str"] = 17] = "Str";
        TokenType[TokenType["QuotedStr"] = 18] = "QuotedStr";
        TokenType[TokenType["Error"] = 19] = "Error";
        TokenType[TokenType["EOF"] = 20] = "EOF";
    })(TokenType || (exports.TokenType = TokenType = {}));
    function hintDidYouMean(...meant) {
        switch (meant.length) {
            case 1:
                return (0, nls_1.localize)('contextkey.scanner.hint.didYouMean1', "Did you mean {0}?", meant[0]);
            case 2:
                return (0, nls_1.localize)('contextkey.scanner.hint.didYouMean2', "Did you mean {0} or {1}?", meant[0], meant[1]);
            case 3:
                return (0, nls_1.localize)('contextkey.scanner.hint.didYouMean3', "Did you mean {0}, {1} or {2}?", meant[0], meant[1], meant[2]);
            default: // we just don't expect that many
                return undefined;
        }
    }
    const hintDidYouForgetToOpenOrCloseQuote = (0, nls_1.localize)('contextkey.scanner.hint.didYouForgetToOpenOrCloseQuote', "Did you forget to open or close the quote?");
    const hintDidYouForgetToEscapeSlash = (0, nls_1.localize)('contextkey.scanner.hint.didYouForgetToEscapeSlash', "Did you forget to escape the '/' (slash) character? Put two backslashes before it to escape, e.g., '\\\\/\'.");
    /**
     * A simple scanner for context keys.
     *
     * Example:
     *
     * ```ts
     * const scanner = new Scanner().reset('resourceFileName =~ /docker/ && !config.docker.enabled');
     * const tokens = [...scanner];
     * if (scanner.errorTokens.length > 0) {
     *     scanner.errorTokens.forEach(err => console.error(`Unexpected token at ${err.offset}: ${err.lexeme}\nHint: ${err.additional}`));
     * } else {
     *     // process tokens
     * }
     * ```
     */
    class Scanner {
        constructor() {
            this._input = '';
            this._start = 0;
            this._current = 0;
            this._tokens = [];
            this._errors = [];
            // u - unicode, y - sticky // TODO@ulugbekna: we accept double quotes as part of the string rather than as a delimiter (to preserve old parser's behavior)
            this.stringRe = /[a-zA-Z0-9_<>\-\./\\:\*\?\+\[\]\^,#@;"%\$\p{L}-]+/uy;
        }
        static getLexeme(token) {
            switch (token.type) {
                case 0 /* TokenType.LParen */:
                    return '(';
                case 1 /* TokenType.RParen */:
                    return ')';
                case 2 /* TokenType.Neg */:
                    return '!';
                case 3 /* TokenType.Eq */:
                    return token.isTripleEq ? '===' : '==';
                case 4 /* TokenType.NotEq */:
                    return token.isTripleEq ? '!==' : '!=';
                case 5 /* TokenType.Lt */:
                    return '<';
                case 6 /* TokenType.LtEq */:
                    return '<=';
                case 7 /* TokenType.Gt */:
                    return '>=';
                case 8 /* TokenType.GtEq */:
                    return '>=';
                case 9 /* TokenType.RegexOp */:
                    return '=~';
                case 10 /* TokenType.RegexStr */:
                    return token.lexeme;
                case 11 /* TokenType.True */:
                    return 'true';
                case 12 /* TokenType.False */:
                    return 'false';
                case 13 /* TokenType.In */:
                    return 'in';
                case 14 /* TokenType.Not */:
                    return 'not';
                case 15 /* TokenType.And */:
                    return '&&';
                case 16 /* TokenType.Or */:
                    return '||';
                case 17 /* TokenType.Str */:
                    return token.lexeme;
                case 18 /* TokenType.QuotedStr */:
                    return token.lexeme;
                case 19 /* TokenType.Error */:
                    return token.lexeme;
                case 20 /* TokenType.EOF */:
                    return 'EOF';
                default:
                    throw (0, errors_1.illegalState)(`unhandled token type: ${JSON.stringify(token)}; have you forgotten to add a case?`);
            }
        }
        static { this._regexFlags = new Set(['i', 'g', 's', 'm', 'y', 'u'].map(ch => ch.charCodeAt(0))); }
        static { this._keywords = new Map([
            ['not', 14 /* TokenType.Not */],
            ['in', 13 /* TokenType.In */],
            ['false', 12 /* TokenType.False */],
            ['true', 11 /* TokenType.True */],
        ]); }
        get errors() {
            return this._errors;
        }
        reset(value) {
            this._input = value;
            this._start = 0;
            this._current = 0;
            this._tokens = [];
            this._errors = [];
            return this;
        }
        scan() {
            while (!this._isAtEnd()) {
                this._start = this._current;
                const ch = this._advance();
                switch (ch) {
                    case 40 /* CharCode.OpenParen */:
                        this._addToken(0 /* TokenType.LParen */);
                        break;
                    case 41 /* CharCode.CloseParen */:
                        this._addToken(1 /* TokenType.RParen */);
                        break;
                    case 33 /* CharCode.ExclamationMark */:
                        if (this._match(61 /* CharCode.Equals */)) {
                            const isTripleEq = this._match(61 /* CharCode.Equals */); // eat last `=` if `!==`
                            this._tokens.push({ type: 4 /* TokenType.NotEq */, offset: this._start, isTripleEq });
                        }
                        else {
                            this._addToken(2 /* TokenType.Neg */);
                        }
                        break;
                    case 39 /* CharCode.SingleQuote */:
                        this._quotedString();
                        break;
                    case 47 /* CharCode.Slash */:
                        this._regex();
                        break;
                    case 61 /* CharCode.Equals */:
                        if (this._match(61 /* CharCode.Equals */)) { // support `==`
                            const isTripleEq = this._match(61 /* CharCode.Equals */); // eat last `=` if `===`
                            this._tokens.push({ type: 3 /* TokenType.Eq */, offset: this._start, isTripleEq });
                        }
                        else if (this._match(126 /* CharCode.Tilde */)) {
                            this._addToken(9 /* TokenType.RegexOp */);
                        }
                        else {
                            this._error(hintDidYouMean('==', '=~'));
                        }
                        break;
                    case 60 /* CharCode.LessThan */:
                        this._addToken(this._match(61 /* CharCode.Equals */) ? 6 /* TokenType.LtEq */ : 5 /* TokenType.Lt */);
                        break;
                    case 62 /* CharCode.GreaterThan */:
                        this._addToken(this._match(61 /* CharCode.Equals */) ? 8 /* TokenType.GtEq */ : 7 /* TokenType.Gt */);
                        break;
                    case 38 /* CharCode.Ampersand */:
                        if (this._match(38 /* CharCode.Ampersand */)) {
                            this._addToken(15 /* TokenType.And */);
                        }
                        else {
                            this._error(hintDidYouMean('&&'));
                        }
                        break;
                    case 124 /* CharCode.Pipe */:
                        if (this._match(124 /* CharCode.Pipe */)) {
                            this._addToken(16 /* TokenType.Or */);
                        }
                        else {
                            this._error(hintDidYouMean('||'));
                        }
                        break;
                    // TODO@ulugbekna: 1) rewrite using a regex 2) reconsider what characters are considered whitespace, including unicode, nbsp, etc.
                    case 32 /* CharCode.Space */:
                    case 13 /* CharCode.CarriageReturn */:
                    case 9 /* CharCode.Tab */:
                    case 10 /* CharCode.LineFeed */:
                    case 160 /* CharCode.NoBreakSpace */: // &nbsp
                        break;
                    default:
                        this._string();
                }
            }
            this._start = this._current;
            this._addToken(20 /* TokenType.EOF */);
            return Array.from(this._tokens);
        }
        _match(expected) {
            if (this._isAtEnd()) {
                return false;
            }
            if (this._input.charCodeAt(this._current) !== expected) {
                return false;
            }
            this._current++;
            return true;
        }
        _advance() {
            return this._input.charCodeAt(this._current++);
        }
        _peek() {
            return this._isAtEnd() ? 0 /* CharCode.Null */ : this._input.charCodeAt(this._current);
        }
        _addToken(type) {
            this._tokens.push({ type, offset: this._start });
        }
        _error(additional) {
            const offset = this._start;
            const lexeme = this._input.substring(this._start, this._current);
            const errToken = { type: 19 /* TokenType.Error */, offset: this._start, lexeme };
            this._errors.push({ offset, lexeme, additionalInfo: additional });
            this._tokens.push(errToken);
        }
        _string() {
            this.stringRe.lastIndex = this._start;
            const match = this.stringRe.exec(this._input);
            if (match) {
                this._current = this._start + match[0].length;
                const lexeme = this._input.substring(this._start, this._current);
                const keyword = Scanner._keywords.get(lexeme);
                if (keyword) {
                    this._addToken(keyword);
                }
                else {
                    this._tokens.push({ type: 17 /* TokenType.Str */, lexeme, offset: this._start });
                }
            }
        }
        // captures the lexeme without the leading and trailing '
        _quotedString() {
            while (this._peek() !== 39 /* CharCode.SingleQuote */ && !this._isAtEnd()) { // TODO@ulugbekna: add support for escaping ' ?
                this._advance();
            }
            if (this._isAtEnd()) {
                this._error(hintDidYouForgetToOpenOrCloseQuote);
                return;
            }
            // consume the closing '
            this._advance();
            this._tokens.push({ type: 18 /* TokenType.QuotedStr */, lexeme: this._input.substring(this._start + 1, this._current - 1), offset: this._start + 1 });
        }
        /*
         * Lexing a regex expression: /.../[igsmyu]*
         * Based on https://github.com/microsoft/TypeScript/blob/9247ef115e617805983740ba795d7a8164babf89/src/compiler/scanner.ts#L2129-L2181
         *
         * Note that we want slashes within a regex to be escaped, e.g., /file:\\/\\/\\// should match `file:///`
         */
        _regex() {
            let p = this._current;
            let inEscape = false;
            let inCharacterClass = false;
            while (true) {
                if (p >= this._input.length) {
                    this._current = p;
                    this._error(hintDidYouForgetToEscapeSlash);
                    return;
                }
                const ch = this._input.charCodeAt(p);
                if (inEscape) { // parsing an escape character
                    inEscape = false;
                }
                else if (ch === 47 /* CharCode.Slash */ && !inCharacterClass) { // end of regex
                    p++;
                    break;
                }
                else if (ch === 91 /* CharCode.OpenSquareBracket */) {
                    inCharacterClass = true;
                }
                else if (ch === 92 /* CharCode.Backslash */) {
                    inEscape = true;
                }
                else if (ch === 93 /* CharCode.CloseSquareBracket */) {
                    inCharacterClass = false;
                }
                p++;
            }
            // Consume flags // TODO@ulugbekna: use regex instead
            while (p < this._input.length && Scanner._regexFlags.has(this._input.charCodeAt(p))) {
                p++;
            }
            this._current = p;
            const lexeme = this._input.substring(this._start, this._current);
            this._tokens.push({ type: 10 /* TokenType.RegexStr */, lexeme, offset: this._start });
        }
        _isAtEnd() {
            return this._current >= this._input.length;
        }
    }
    exports.Scanner = Scanner;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nhbm5lci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2NvbnRleHRrZXkvY29tbW9uL3NjYW5uZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLElBQWtCLFNBc0JqQjtJQXRCRCxXQUFrQixTQUFTO1FBQzFCLDZDQUFNLENBQUE7UUFDTiw2Q0FBTSxDQUFBO1FBQ04sdUNBQUcsQ0FBQTtRQUNILHFDQUFFLENBQUE7UUFDRiwyQ0FBSyxDQUFBO1FBQ0wscUNBQUUsQ0FBQTtRQUNGLHlDQUFJLENBQUE7UUFDSixxQ0FBRSxDQUFBO1FBQ0YseUNBQUksQ0FBQTtRQUNKLCtDQUFPLENBQUE7UUFDUCxrREFBUSxDQUFBO1FBQ1IsMENBQUksQ0FBQTtRQUNKLDRDQUFLLENBQUE7UUFDTCxzQ0FBRSxDQUFBO1FBQ0Ysd0NBQUcsQ0FBQTtRQUNILHdDQUFHLENBQUE7UUFDSCxzQ0FBRSxDQUFBO1FBQ0Ysd0NBQUcsQ0FBQTtRQUNILG9EQUFTLENBQUE7UUFDVCw0Q0FBSyxDQUFBO1FBQ0wsd0NBQUcsQ0FBQTtJQUNKLENBQUMsRUF0QmlCLFNBQVMseUJBQVQsU0FBUyxRQXNCMUI7SUFzREQsU0FBUyxjQUFjLENBQUMsR0FBRyxLQUFlO1FBQ3pDLFFBQVEsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3RCLEtBQUssQ0FBQztnQkFDTCxPQUFPLElBQUEsY0FBUSxFQUFDLHFDQUFxQyxFQUFFLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLEtBQUssQ0FBQztnQkFDTCxPQUFPLElBQUEsY0FBUSxFQUFDLHFDQUFxQyxFQUFFLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FB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