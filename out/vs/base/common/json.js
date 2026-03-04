/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParseOptions = exports.ParseErrorCode = exports.SyntaxKind = exports.ScanError = void 0;
    exports.createScanner = createScanner;
    exports.getLocation = getLocation;
    exports.parse = parse;
    exports.parseTree = parseTree;
    exports.findNodeAtLocation = findNodeAtLocation;
    exports.getNodePath = getNodePath;
    exports.getNodeValue = getNodeValue;
    exports.contains = contains;
    exports.findNodeAtOffset = findNodeAtOffset;
    exports.visit = visit;
    exports.stripComments = stripComments;
    exports.getNodeType = getNodeType;
    var ScanError;
    (function (ScanError) {
        ScanError[ScanError["None"] = 0] = "None";
        ScanError[ScanError["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
        ScanError[ScanError["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
        ScanError[ScanError["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
        ScanError[ScanError["InvalidUnicode"] = 4] = "InvalidUnicode";
        ScanError[ScanError["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
        ScanError[ScanError["InvalidCharacter"] = 6] = "InvalidCharacter";
    })(ScanError || (exports.ScanError = ScanError = {}));
    var SyntaxKind;
    (function (SyntaxKind) {
        SyntaxKind[SyntaxKind["OpenBraceToken"] = 1] = "OpenBraceToken";
        SyntaxKind[SyntaxKind["CloseBraceToken"] = 2] = "CloseBraceToken";
        SyntaxKind[SyntaxKind["OpenBracketToken"] = 3] = "OpenBracketToken";
        SyntaxKind[SyntaxKind["CloseBracketToken"] = 4] = "CloseBracketToken";
        SyntaxKind[SyntaxKind["CommaToken"] = 5] = "CommaToken";
        SyntaxKind[SyntaxKind["ColonToken"] = 6] = "ColonToken";
        SyntaxKind[SyntaxKind["NullKeyword"] = 7] = "NullKeyword";
        SyntaxKind[SyntaxKind["TrueKeyword"] = 8] = "TrueKeyword";
        SyntaxKind[SyntaxKind["FalseKeyword"] = 9] = "FalseKeyword";
        SyntaxKind[SyntaxKind["StringLiteral"] = 10] = "StringLiteral";
        SyntaxKind[SyntaxKind["NumericLiteral"] = 11] = "NumericLiteral";
        SyntaxKind[SyntaxKind["LineCommentTrivia"] = 12] = "LineCommentTrivia";
        SyntaxKind[SyntaxKind["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
        SyntaxKind[SyntaxKind["LineBreakTrivia"] = 14] = "LineBreakTrivia";
        SyntaxKind[SyntaxKind["Trivia"] = 15] = "Trivia";
        SyntaxKind[SyntaxKind["Unknown"] = 16] = "Unknown";
        SyntaxKind[SyntaxKind["EOF"] = 17] = "EOF";
    })(SyntaxKind || (exports.SyntaxKind = SyntaxKind = {}));
    var ParseErrorCode;
    (function (ParseErrorCode) {
        ParseErrorCode[ParseErrorCode["InvalidSymbol"] = 1] = "InvalidSymbol";
        ParseErrorCode[ParseErrorCode["InvalidNumberFormat"] = 2] = "InvalidNumberFormat";
        ParseErrorCode[ParseErrorCode["PropertyNameExpected"] = 3] = "PropertyNameExpected";
        ParseErrorCode[ParseErrorCode["ValueExpected"] = 4] = "ValueExpected";
        ParseErrorCode[ParseErrorCode["ColonExpected"] = 5] = "ColonExpected";
        ParseErrorCode[ParseErrorCode["CommaExpected"] = 6] = "CommaExpected";
        ParseErrorCode[ParseErrorCode["CloseBraceExpected"] = 7] = "CloseBraceExpected";
        ParseErrorCode[ParseErrorCode["CloseBracketExpected"] = 8] = "CloseBracketExpected";
        ParseErrorCode[ParseErrorCode["EndOfFileExpected"] = 9] = "EndOfFileExpected";
        ParseErrorCode[ParseErrorCode["InvalidCommentToken"] = 10] = "InvalidCommentToken";
        ParseErrorCode[ParseErrorCode["UnexpectedEndOfComment"] = 11] = "UnexpectedEndOfComment";
        ParseErrorCode[ParseErrorCode["UnexpectedEndOfString"] = 12] = "UnexpectedEndOfString";
        ParseErrorCode[ParseErrorCode["UnexpectedEndOfNumber"] = 13] = "UnexpectedEndOfNumber";
        ParseErrorCode[ParseErrorCode["InvalidUnicode"] = 14] = "InvalidUnicode";
        ParseErrorCode[ParseErrorCode["InvalidEscapeCharacter"] = 15] = "InvalidEscapeCharacter";
        ParseErrorCode[ParseErrorCode["InvalidCharacter"] = 16] = "InvalidCharacter";
    })(ParseErrorCode || (exports.ParseErrorCode = ParseErrorCode = {}));
    var ParseOptions;
    (function (ParseOptions) {
        ParseOptions.DEFAULT = {
            allowTrailingComma: true
        };
    })(ParseOptions || (exports.ParseOptions = ParseOptions = {}));
    /**
     * Creates a JSON scanner on the given text.
     * If ignoreTrivia is set, whitespaces or comments are ignored.
     */
    function createScanner(text, ignoreTrivia = false) {
        let pos = 0;
        const len = text.length;
        let value = '';
        let tokenOffset = 0;
        let token = 16 /* SyntaxKind.Unknown */;
        let scanError = 0 /* ScanError.None */;
        function scanHexDigits(count) {
            let digits = 0;
            let hexValue = 0;
            while (digits < count) {
                const ch = text.charCodeAt(pos);
                if (ch >= 48 /* CharacterCodes._0 */ && ch <= 57 /* CharacterCodes._9 */) {
                    hexValue = hexValue * 16 + ch - 48 /* CharacterCodes._0 */;
                }
                else if (ch >= 65 /* CharacterCodes.A */ && ch <= 70 /* CharacterCodes.F */) {
                    hexValue = hexValue * 16 + ch - 65 /* CharacterCodes.A */ + 10;
                }
                else if (ch >= 97 /* CharacterCodes.a */ && ch <= 102 /* CharacterCodes.f */) {
                    hexValue = hexValue * 16 + ch - 97 /* CharacterCodes.a */ + 10;
                }
                else {
                    break;
                }
                pos++;
                digits++;
            }
            if (digits < count) {
                hexValue = -1;
            }
            return hexValue;
        }
        function setPosition(newPosition) {
            pos = newPosition;
            value = '';
            tokenOffset = 0;
            token = 16 /* SyntaxKind.Unknown */;
            scanError = 0 /* ScanError.None */;
        }
        function scanNumber() {
            const start = pos;
            if (text.charCodeAt(pos) === 48 /* CharacterCodes._0 */) {
                pos++;
            }
            else {
                pos++;
                while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                    pos++;
                }
            }
            if (pos < text.length && text.charCodeAt(pos) === 46 /* CharacterCodes.dot */) {
                pos++;
                if (pos < text.length && isDigit(text.charCodeAt(pos))) {
                    pos++;
                    while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                        pos++;
                    }
                }
                else {
                    scanError = 3 /* ScanError.UnexpectedEndOfNumber */;
                    return text.substring(start, pos);
                }
            }
            let end = pos;
            if (pos < text.length && (text.charCodeAt(pos) === 69 /* CharacterCodes.E */ || text.charCodeAt(pos) === 101 /* CharacterCodes.e */)) {
                pos++;
                if (pos < text.length && text.charCodeAt(pos) === 43 /* CharacterCodes.plus */ || text.charCodeAt(pos) === 45 /* CharacterCodes.minus */) {
                    pos++;
                }
                if (pos < text.length && isDigit(text.charCodeAt(pos))) {
                    pos++;
                    while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                        pos++;
                    }
                    end = pos;
                }
                else {
                    scanError = 3 /* ScanError.UnexpectedEndOfNumber */;
                }
            }
            return text.substring(start, end);
        }
        function scanString() {
            let result = '', start = pos;
            while (true) {
                if (pos >= len) {
                    result += text.substring(start, pos);
                    scanError = 2 /* ScanError.UnexpectedEndOfString */;
                    break;
                }
                const ch = text.charCodeAt(pos);
                if (ch === 34 /* CharacterCodes.doubleQuote */) {
                    result += text.substring(start, pos);
                    pos++;
                    break;
                }
                if (ch === 92 /* CharacterCodes.backslash */) {
                    result += text.substring(start, pos);
                    pos++;
                    if (pos >= len) {
                        scanError = 2 /* ScanError.UnexpectedEndOfString */;
                        break;
                    }
                    const ch2 = text.charCodeAt(pos++);
                    switch (ch2) {
                        case 34 /* CharacterCodes.doubleQuote */:
                            result += '\"';
                            break;
                        case 92 /* CharacterCodes.backslash */:
                            result += '\\';
                            break;
                        case 47 /* CharacterCodes.slash */:
                            result += '/';
                            break;
                        case 98 /* CharacterCodes.b */:
                            result += '\b';
                            break;
                        case 102 /* CharacterCodes.f */:
                            result += '\f';
                            break;
                        case 110 /* CharacterCodes.n */:
                            result += '\n';
                            break;
                        case 114 /* CharacterCodes.r */:
                            result += '\r';
                            break;
                        case 116 /* CharacterCodes.t */:
                            result += '\t';
                            break;
                        case 117 /* CharacterCodes.u */: {
                            const ch3 = scanHexDigits(4);
                            if (ch3 >= 0) {
                                result += String.fromCharCode(ch3);
                            }
                            else {
                                scanError = 4 /* ScanError.InvalidUnicode */;
                            }
                            break;
                        }
                        default:
                            scanError = 5 /* ScanError.InvalidEscapeCharacter */;
                    }
                    start = pos;
                    continue;
                }
                if (ch >= 0 && ch <= 0x1F) {
                    if (isLineBreak(ch)) {
                        result += text.substring(start, pos);
                        scanError = 2 /* ScanError.UnexpectedEndOfString */;
                        break;
                    }
                    else {
                        scanError = 6 /* ScanError.InvalidCharacter */;
                        // mark as error but continue with string
                    }
                }
                pos++;
            }
            return result;
        }
        function scanNext() {
            value = '';
            scanError = 0 /* ScanError.None */;
            tokenOffset = pos;
            if (pos >= len) {
                // at the end
                tokenOffset = len;
                return token = 17 /* SyntaxKind.EOF */;
            }
            let code = text.charCodeAt(pos);
            // trivia: whitespace
            if (isWhitespace(code)) {
                do {
                    pos++;
                    value += String.fromCharCode(code);
                    code = text.charCodeAt(pos);
                } while (isWhitespace(code));
                return token = 15 /* SyntaxKind.Trivia */;
            }
            // trivia: newlines
            if (isLineBreak(code)) {
                pos++;
                value += String.fromCharCode(code);
                if (code === 13 /* CharacterCodes.carriageReturn */ && text.charCodeAt(pos) === 10 /* CharacterCodes.lineFeed */) {
                    pos++;
                    value += '\n';
                }
                return token = 14 /* SyntaxKind.LineBreakTrivia */;
            }
            switch (code) {
                // tokens: []{}:,
                case 123 /* CharacterCodes.openBrace */:
                    pos++;
                    return token = 1 /* SyntaxKind.OpenBraceToken */;
                case 125 /* CharacterCodes.closeBrace */:
                    pos++;
                    return token = 2 /* SyntaxKind.CloseBraceToken */;
                case 91 /* CharacterCodes.openBracket */:
                    pos++;
                    return token = 3 /* SyntaxKind.OpenBracketToken */;
                case 93 /* CharacterCodes.closeBracket */:
                    pos++;
                    return token = 4 /* SyntaxKind.CloseBracketToken */;
                case 58 /* CharacterCodes.colon */:
                    pos++;
                    return token = 6 /* SyntaxKind.ColonToken */;
                case 44 /* CharacterCodes.comma */:
                    pos++;
                    return token = 5 /* SyntaxKind.CommaToken */;
                // strings
                case 34 /* CharacterCodes.doubleQuote */:
                    pos++;
                    value = scanString();
                    return token = 10 /* SyntaxKind.StringLiteral */;
                // comments
                case 47 /* CharacterCodes.slash */: {
                    const start = pos - 1;
                    // Single-line comment
                    if (text.charCodeAt(pos + 1) === 47 /* CharacterCodes.slash */) {
                        pos += 2;
                        while (pos < len) {
                            if (isLineBreak(text.charCodeAt(pos))) {
                                break;
                            }
                            pos++;
                        }
                        value = text.substring(start, pos);
                        return token = 12 /* SyntaxKind.LineCommentTrivia */;
                    }
                    // Multi-line comment
                    if (text.charCodeAt(pos + 1) === 42 /* CharacterCodes.asterisk */) {
                        pos += 2;
                        const safeLength = len - 1; // For lookahead.
                        let commentClosed = false;
                        while (pos < safeLength) {
                            const ch = text.charCodeAt(pos);
                            if (ch === 42 /* CharacterCodes.asterisk */ && text.charCodeAt(pos + 1) === 47 /* CharacterCodes.slash */) {
                                pos += 2;
                                commentClosed = true;
                                break;
                            }
                            pos++;
                        }
                        if (!commentClosed) {
                            pos++;
                            scanError = 1 /* ScanError.UnexpectedEndOfComment */;
                        }
                        value = text.substring(start, pos);
                        return token = 13 /* SyntaxKind.BlockCommentTrivia */;
                    }
                    // just a single slash
                    value += String.fromCharCode(code);
                    pos++;
                    return token = 16 /* SyntaxKind.Unknown */;
                }
                // numbers
                case 45 /* CharacterCodes.minus */:
                    value += String.fromCharCode(code);
                    pos++;
                    if (pos === len || !isDigit(text.charCodeAt(pos))) {
                        return token = 16 /* SyntaxKind.Unknown */;
                    }
                // found a minus, followed by a number so
                // we fall through to proceed with scanning
                // numbers
                case 48 /* CharacterCodes._0 */:
                case 49 /* CharacterCodes._1 */:
                case 50 /* CharacterCodes._2 */:
                case 51 /* CharacterCodes._3 */:
                case 52 /* CharacterCodes._4 */:
                case 53 /* CharacterCodes._5 */:
                case 54 /* CharacterCodes._6 */:
                case 55 /* CharacterCodes._7 */:
                case 56 /* CharacterCodes._8 */:
                case 57 /* CharacterCodes._9 */:
                    value += scanNumber();
                    return token = 11 /* SyntaxKind.NumericLiteral */;
                // literals and unknown symbols
                default:
                    // is a literal? Read the full word.
                    while (pos < len && isUnknownContentCharacter(code)) {
                        pos++;
                        code = text.charCodeAt(pos);
                    }
                    if (tokenOffset !== pos) {
                        value = text.substring(tokenOffset, pos);
                        // keywords: true, false, null
                        switch (value) {
                            case 'true': return token = 8 /* SyntaxKind.TrueKeyword */;
                            case 'false': return token = 9 /* SyntaxKind.FalseKeyword */;
                            case 'null': return token = 7 /* SyntaxKind.NullKeyword */;
                        }
                        return token = 16 /* SyntaxKind.Unknown */;
                    }
                    // some
                    value += String.fromCharCode(code);
                    pos++;
                    return token = 16 /* SyntaxKind.Unknown */;
            }
        }
        function isUnknownContentCharacter(code) {
            if (isWhitespace(code) || isLineBreak(code)) {
                return false;
            }
            switch (code) {
                case 125 /* CharacterCodes.closeBrace */:
                case 93 /* CharacterCodes.closeBracket */:
                case 123 /* CharacterCodes.openBrace */:
                case 91 /* CharacterCodes.openBracket */:
                case 34 /* CharacterCodes.doubleQuote */:
                case 58 /* CharacterCodes.colon */:
                case 44 /* CharacterCodes.comma */:
                case 47 /* CharacterCodes.slash */:
                    return false;
            }
            return true;
        }
        function scanNextNonTrivia() {
            let result;
            do {
                result = scanNext();
            } while (result >= 12 /* SyntaxKind.LineCommentTrivia */ && result <= 15 /* SyntaxKind.Trivia */);
            return result;
        }
        return {
            setPosition: setPosition,
            getPosition: () => pos,
            scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
            getToken: () => token,
            getTokenValue: () => value,
            getTokenOffset: () => tokenOffset,
            getTokenLength: () => pos - tokenOffset,
            getTokenError: () => scanError
        };
    }
    function isWhitespace(ch) {
        return ch === 32 /* CharacterCodes.space */ || ch === 9 /* CharacterCodes.tab */ || ch === 11 /* CharacterCodes.verticalTab */ || ch === 12 /* CharacterCodes.formFeed */ ||
            ch === 160 /* CharacterCodes.nonBreakingSpace */ || ch === 5760 /* CharacterCodes.ogham */ || ch >= 8192 /* CharacterCodes.enQuad */ && ch <= 8203 /* CharacterCodes.zeroWidthSpace */ ||
            ch === 8239 /* CharacterCodes.narrowNoBreakSpace */ || ch === 8287 /* CharacterCodes.mathematicalSpace */ || ch === 12288 /* CharacterCodes.ideographicSpace */ || ch === 65279 /* CharacterCodes.byteOrderMark */;
    }
    function isLineBreak(ch) {
        return ch === 10 /* CharacterCodes.lineFeed */ || ch === 13 /* CharacterCodes.carriageReturn */ || ch === 8232 /* CharacterCodes.lineSeparator */ || ch === 8233 /* CharacterCodes.paragraphSeparator */;
    }
    function isDigit(ch) {
        return ch >= 48 /* CharacterCodes._0 */ && ch <= 57 /* CharacterCodes._9 */;
    }
    var CharacterCodes;
    (function (CharacterCodes) {
        CharacterCodes[CharacterCodes["nullCharacter"] = 0] = "nullCharacter";
        CharacterCodes[CharacterCodes["maxAsciiCharacter"] = 127] = "maxAsciiCharacter";
        CharacterCodes[CharacterCodes["lineFeed"] = 10] = "lineFeed";
        CharacterCodes[CharacterCodes["carriageReturn"] = 13] = "carriageReturn";
        CharacterCodes[CharacterCodes["lineSeparator"] = 8232] = "lineSeparator";
        CharacterCodes[CharacterCodes["paragraphSeparator"] = 8233] = "paragraphSeparator";
        // REVIEW: do we need to support this?  The scanner doesn't, but our IText does.  This seems
        // like an odd disparity?  (Or maybe it's completely fine for them to be different).
        CharacterCodes[CharacterCodes["nextLine"] = 133] = "nextLine";
        // Unicode 3.0 space characters
        CharacterCodes[CharacterCodes["space"] = 32] = "space";
        CharacterCodes[CharacterCodes["nonBreakingSpace"] = 160] = "nonBreakingSpace";
        CharacterCodes[CharacterCodes["enQuad"] = 8192] = "enQuad";
        CharacterCodes[CharacterCodes["emQuad"] = 8193] = "emQuad";
        CharacterCodes[CharacterCodes["enSpace"] = 8194] = "enSpace";
        CharacterCodes[CharacterCodes["emSpace"] = 8195] = "emSpace";
        CharacterCodes[CharacterCodes["threePerEmSpace"] = 8196] = "threePerEmSpace";
        CharacterCodes[CharacterCodes["fourPerEmSpace"] = 8197] = "fourPerEmSpace";
        CharacterCodes[CharacterCodes["sixPerEmSpace"] = 8198] = "sixPerEmSpace";
        CharacterCodes[CharacterCodes["figureSpace"] = 8199] = "figureSpace";
        CharacterCodes[CharacterCodes["punctuationSpace"] = 8200] = "punctuationSpace";
        CharacterCodes[CharacterCodes["thinSpace"] = 8201] = "thinSpace";
        CharacterCodes[CharacterCodes["hairSpace"] = 8202] = "hairSpace";
        CharacterCodes[CharacterCodes["zeroWidthSpace"] = 8203] = "zeroWidthSpace";
        CharacterCodes[CharacterCodes["narrowNoBreakSpace"] = 8239] = "narrowNoBreakSpace";
        CharacterCodes[CharacterCodes["ideographicSpace"] = 12288] = "ideographicSpace";
        CharacterCodes[CharacterCodes["mathematicalSpace"] = 8287] = "mathematicalSpace";
        CharacterCodes[CharacterCodes["ogham"] = 5760] = "ogham";
        CharacterCodes[CharacterCodes["_"] = 95] = "_";
        CharacterCodes[CharacterCodes["$"] = 36] = "$";
        CharacterCodes[CharacterCodes["_0"] = 48] = "_0";
        CharacterCodes[CharacterCodes["_1"] = 49] = "_1";
        CharacterCodes[CharacterCodes["_2"] = 50] = "_2";
        CharacterCodes[CharacterCodes["_3"] = 51] = "_3";
        CharacterCodes[CharacterCodes["_4"] = 52] = "_4";
        CharacterCodes[CharacterCodes["_5"] = 53] = "_5";
        CharacterCodes[CharacterCodes["_6"] = 54] = "_6";
        CharacterCodes[CharacterCodes["_7"] = 55] = "_7";
        CharacterCodes[CharacterCodes["_8"] = 56] = "_8";
        CharacterCodes[CharacterCodes["_9"] = 57] = "_9";
        CharacterCodes[CharacterCodes["a"] = 97] = "a";
        CharacterCodes[CharacterCodes["b"] = 98] = "b";
        CharacterCodes[CharacterCodes["c"] = 99] = "c";
        CharacterCodes[CharacterCodes["d"] = 100] = "d";
        CharacterCodes[CharacterCodes["e"] = 101] = "e";
        CharacterCodes[CharacterCodes["f"] = 102] = "f";
        CharacterCodes[CharacterCodes["g"] = 103] = "g";
        CharacterCodes[CharacterCodes["h"] = 104] = "h";
        CharacterCodes[CharacterCodes["i"] = 105] = "i";
        CharacterCodes[CharacterCodes["j"] = 106] = "j";
        CharacterCodes[CharacterCodes["k"] = 107] = "k";
        CharacterCodes[CharacterCodes["l"] = 108] = "l";
        CharacterCodes[CharacterCodes["m"] = 109] = "m";
        CharacterCodes[CharacterCodes["n"] = 110] = "n";
        CharacterCodes[CharacterCodes["o"] = 111] = "o";
        CharacterCodes[CharacterCodes["p"] = 112] = "p";
        CharacterCodes[CharacterCodes["q"] = 113] = "q";
        CharacterCodes[CharacterCodes["r"] = 114] = "r";
        CharacterCodes[CharacterCodes["s"] = 115] = "s";
        CharacterCodes[CharacterCodes["t"] = 116] = "t";
        CharacterCodes[CharacterCodes["u"] = 117] = "u";
        CharacterCodes[CharacterCodes["v"] = 118] = "v";
        CharacterCodes[CharacterCodes["w"] = 119] = "w";
        CharacterCodes[CharacterCodes["x"] = 120] = "x";
        CharacterCodes[CharacterCodes["y"] = 121] = "y";
        CharacterCodes[CharacterCodes["z"] = 122] = "z";
        CharacterCodes[CharacterCodes["A"] = 65] = "A";
        CharacterCodes[CharacterCodes["B"] = 66] = "B";
        CharacterCodes[CharacterCodes["C"] = 67] = "C";
        CharacterCodes[CharacterCodes["D"] = 68] = "D";
        CharacterCodes[CharacterCodes["E"] = 69] = "E";
        CharacterCodes[CharacterCodes["F"] = 70] = "F";
        CharacterCodes[CharacterCodes["G"] = 71] = "G";
        CharacterCodes[CharacterCodes["H"] = 72] = "H";
        CharacterCodes[CharacterCodes["I"] = 73] = "I";
        CharacterCodes[CharacterCodes["J"] = 74] = "J";
        CharacterCodes[CharacterCodes["K"] = 75] = "K";
        CharacterCodes[CharacterCodes["L"] = 76] = "L";
        CharacterCodes[CharacterCodes["M"] = 77] = "M";
        CharacterCodes[CharacterCodes["N"] = 78] = "N";
        CharacterCodes[CharacterCodes["O"] = 79] = "O";
        CharacterCodes[CharacterCodes["P"] = 80] = "P";
        CharacterCodes[CharacterCodes["Q"] = 81] = "Q";
        CharacterCodes[CharacterCodes["R"] = 82] = "R";
        CharacterCodes[CharacterCodes["S"] = 83] = "S";
        CharacterCodes[CharacterCodes["T"] = 84] = "T";
        CharacterCodes[CharacterCodes["U"] = 85] = "U";
        CharacterCodes[CharacterCodes["V"] = 86] = "V";
        CharacterCodes[CharacterCodes["W"] = 87] = "W";
        CharacterCodes[CharacterCodes["X"] = 88] = "X";
        CharacterCodes[CharacterCodes["Y"] = 89] = "Y";
        CharacterCodes[CharacterCodes["Z"] = 90] = "Z";
        CharacterCodes[CharacterCodes["ampersand"] = 38] = "ampersand";
        CharacterCodes[CharacterCodes["asterisk"] = 42] = "asterisk";
        CharacterCodes[CharacterCodes["at"] = 64] = "at";
        CharacterCodes[CharacterCodes["backslash"] = 92] = "backslash";
        CharacterCodes[CharacterCodes["bar"] = 124] = "bar";
        CharacterCodes[CharacterCodes["caret"] = 94] = "caret";
        CharacterCodes[CharacterCodes["closeBrace"] = 125] = "closeBrace";
        CharacterCodes[CharacterCodes["closeBracket"] = 93] = "closeBracket";
        CharacterCodes[CharacterCodes["closeParen"] = 41] = "closeParen";
        CharacterCodes[CharacterCodes["colon"] = 58] = "colon";
        CharacterCodes[CharacterCodes["comma"] = 44] = "comma";
        CharacterCodes[CharacterCodes["dot"] = 46] = "dot";
        CharacterCodes[CharacterCodes["doubleQuote"] = 34] = "doubleQuote";
        CharacterCodes[CharacterCodes["equals"] = 61] = "equals";
        CharacterCodes[CharacterCodes["exclamation"] = 33] = "exclamation";
        CharacterCodes[CharacterCodes["greaterThan"] = 62] = "greaterThan";
        CharacterCodes[CharacterCodes["lessThan"] = 60] = "lessThan";
        CharacterCodes[CharacterCodes["minus"] = 45] = "minus";
        CharacterCodes[CharacterCodes["openBrace"] = 123] = "openBrace";
        CharacterCodes[CharacterCodes["openBracket"] = 91] = "openBracket";
        CharacterCodes[CharacterCodes["openParen"] = 40] = "openParen";
        CharacterCodes[CharacterCodes["percent"] = 37] = "percent";
        CharacterCodes[CharacterCodes["plus"] = 43] = "plus";
        CharacterCodes[CharacterCodes["question"] = 63] = "question";
        CharacterCodes[CharacterCodes["semicolon"] = 59] = "semicolon";
        CharacterCodes[CharacterCodes["singleQuote"] = 39] = "singleQuote";
        CharacterCodes[CharacterCodes["slash"] = 47] = "slash";
        CharacterCodes[CharacterCodes["tilde"] = 126] = "tilde";
        CharacterCodes[CharacterCodes["backspace"] = 8] = "backspace";
        CharacterCodes[CharacterCodes["formFeed"] = 12] = "formFeed";
        CharacterCodes[CharacterCodes["byteOrderMark"] = 65279] = "byteOrderMark";
        CharacterCodes[CharacterCodes["tab"] = 9] = "tab";
        CharacterCodes[CharacterCodes["verticalTab"] = 11] = "verticalTab";
    })(CharacterCodes || (CharacterCodes = {}));
    /**
     * For a given offset, evaluate the location in the JSON document. Each segment in the location path is either a property name or an array index.
     */
    function getLocation(text, position) {
        const segments = []; // strings or numbers
        const earlyReturnException = new Object();
        let previousNode = undefined;
        const previousNodeInst = {
            value: {},
            offset: 0,
            length: 0,
            type: 'object',
            parent: undefined
        };
        let isAtPropertyKey = false;
        function setPreviousNode(value, offset, length, type) {
            previousNodeInst.value = value;
            previousNodeInst.offset = offset;
            previousNodeInst.length = length;
            previousNodeInst.type = type;
            previousNodeInst.colonOffset = undefined;
            previousNode = previousNodeInst;
        }
        try {
            visit(text, {
                onObjectBegin: (offset, length) => {
                    if (position <= offset) {
                        throw earlyReturnException;
                    }
                    previousNode = undefined;
                    isAtPropertyKey = position > offset;
                    segments.push(''); // push a placeholder (will be replaced)
                },
                onObjectProperty: (name, offset, length) => {
                    if (position < offset) {
                        throw earlyReturnException;
                    }
                    setPreviousNode(name, offset, length, 'property');
                    segments[segments.length - 1] = name;
                    if (position <= offset + length) {
                        throw earlyReturnException;
                    }
                },
                onObjectEnd: (offset, length) => {
                    if (position <= offset) {
                        throw earlyReturnException;
                    }
                    previousNode = undefined;
                    segments.pop();
                },
                onArrayBegin: (offset, length) => {
                    if (position <= offset) {
                        throw earlyReturnException;
                    }
                    previousNode = undefined;
                    segments.push(0);
                },
                onArrayEnd: (offset, length) => {
                    if (position <= offset) {
                        throw earlyReturnException;
                    }
                    previousNode = undefined;
                    segments.pop();
                },
                onLiteralValue: (value, offset, length) => {
                    if (position < offset) {
                        throw earlyReturnException;
                    }
                    setPreviousNode(value, offset, length, getNodeType(value));
                    if (position <= offset + length) {
                        throw earlyReturnException;
                    }
                },
                onSeparator: (sep, offset, length) => {
                    if (position <= offset) {
                        throw earlyReturnException;
                    }
                    if (sep === ':' && previousNode && previousNode.type === 'property') {
                        previousNode.colonOffset = offset;
                        isAtPropertyKey = false;
                        previousNode = undefined;
                    }
                    else if (sep === ',') {
                        const last = segments[segments.length - 1];
                        if (typeof last === 'number') {
                            segments[segments.length - 1] = last + 1;
                        }
                        else {
                            isAtPropertyKey = true;
                            segments[segments.length - 1] = '';
                        }
                        previousNode = undefined;
                    }
                }
            });
        }
        catch (e) {
            if (e !== earlyReturnException) {
                throw e;
            }
        }
        return {
            path: segments,
            previousNode,
            isAtPropertyKey,
            matches: (pattern) => {
                let k = 0;
                for (let i = 0; k < pattern.length && i < segments.length; i++) {
                    if (pattern[k] === segments[i] || pattern[k] === '*') {
                        k++;
                    }
                    else if (pattern[k] !== '**') {
                        return false;
                    }
                }
                return k === pattern.length;
            }
        };
    }
    /**
     * Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
     * Therefore always check the errors list to find out if the input was valid.
     */
    function parse(text, errors = [], options = ParseOptions.DEFAULT) {
        let currentProperty = null;
        let currentParent = [];
        const previousParents = [];
        function onValue(value) {
            if (Array.isArray(currentParent)) {
                currentParent.push(value);
            }
            else if (currentProperty !== null) {
                currentParent[currentProperty] = value;
            }
        }
        const visitor = {
            onObjectBegin: () => {
                const object = {};
                onValue(object);
                previousParents.push(currentParent);
                currentParent = object;
                currentProperty = null;
            },
            onObjectProperty: (name) => {
                currentProperty = name;
            },
            onObjectEnd: () => {
                currentParent = previousParents.pop();
            },
            onArrayBegin: () => {
                const array = [];
                onValue(array);
                previousParents.push(currentParent);
                currentParent = array;
                currentProperty = null;
            },
            onArrayEnd: () => {
                currentParent = previousParents.pop();
            },
            onLiteralValue: onValue,
            onError: (error, offset, length) => {
                errors.push({ error, offset, length });
            }
        };
        visit(text, visitor, options);
        return currentParent[0];
    }
    /**
     * Parses the given text and returns a tree representation the JSON content. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
     */
    function parseTree(text, errors = [], options = ParseOptions.DEFAULT) {
        let currentParent = { type: 'array', offset: -1, length: -1, children: [], parent: undefined }; // artificial root
        function ensurePropertyComplete(endOffset) {
            if (currentParent.type === 'property') {
                currentParent.length = endOffset - currentParent.offset;
                currentParent = currentParent.parent;
            }
        }
        function onValue(valueNode) {
            currentParent.children.push(valueNode);
            return valueNode;
        }
        const visitor = {
            onObjectBegin: (offset) => {
                currentParent = onValue({ type: 'object', offset, length: -1, parent: currentParent, children: [] });
            },
            onObjectProperty: (name, offset, length) => {
                currentParent = onValue({ type: 'property', offset, length: -1, parent: currentParent, children: [] });
                currentParent.children.push({ type: 'string', value: name, offset, length, parent: currentParent });
            },
            onObjectEnd: (offset, length) => {
                currentParent.length = offset + length - currentParent.offset;
                currentParent = currentParent.parent;
                ensurePropertyComplete(offset + length);
            },
            onArrayBegin: (offset, length) => {
                currentParent = onValue({ type: 'array', offset, length: -1, parent: currentParent, children: [] });
            },
            onArrayEnd: (offset, length) => {
                currentParent.length = offset + length - currentParent.offset;
                currentParent = currentParent.parent;
                ensurePropertyComplete(offset + length);
            },
            onLiteralValue: (value, offset, length) => {
                onValue({ type: getNodeType(value), offset, length, parent: currentParent, value });
                ensurePropertyComplete(offset + length);
            },
            onSeparator: (sep, offset, length) => {
                if (currentParent.type === 'property') {
                    if (sep === ':') {
                        currentParent.colonOffset = offset;
                    }
                    else if (sep === ',') {
                        ensurePropertyComplete(offset);
                    }
                }
            },
            onError: (error, offset, length) => {
                errors.push({ error, offset, length });
            }
        };
        visit(text, visitor, options);
        const result = currentParent.children[0];
        if (result) {
            delete result.parent;
        }
        return result;
    }
    /**
     * Finds the node at the given path in a JSON DOM.
     */
    function findNodeAtLocation(root, path) {
        if (!root) {
            return undefined;
        }
        let node = root;
        for (const segment of path) {
            if (typeof segment === 'string') {
                if (node.type !== 'object' || !Array.isArray(node.children)) {
                    return undefined;
                }
                let found = false;
                for (const propertyNode of node.children) {
                    if (Array.isArray(propertyNode.children) && propertyNode.children[0].value === segment) {
                        node = propertyNode.children[1];
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return undefined;
                }
            }
            else {
                const index = segment;
                if (node.type !== 'array' || index < 0 || !Array.isArray(node.children) || index >= node.children.length) {
                    return undefined;
                }
                node = node.children[index];
            }
        }
        return node;
    }
    /**
     * Gets the JSON path of the given JSON DOM node
     */
    function getNodePath(node) {
        if (!node.parent || !node.parent.children) {
            return [];
        }
        const path = getNodePath(node.parent);
        if (node.parent.type === 'property') {
            const key = node.parent.children[0].value;
            path.push(key);
        }
        else if (node.parent.type === 'array') {
            const index = node.parent.children.indexOf(node);
            if (index !== -1) {
                path.push(index);
            }
        }
        return path;
    }
    /**
     * Evaluates the JavaScript object of the given JSON DOM node
     */
    function getNodeValue(node) {
        switch (node.type) {
            case 'array':
                return node.children.map(getNodeValue);
            case 'object': {
                const obj = Object.create(null);
                for (const prop of node.children) {
                    const valueNode = prop.children[1];
                    if (valueNode) {
                        obj[prop.children[0].value] = getNodeValue(valueNode);
                    }
                }
                return obj;
            }
            case 'null':
            case 'string':
            case 'number':
            case 'boolean':
                return node.value;
            default:
                return undefined;
        }
    }
    function contains(node, offset, includeRightBound = false) {
        return (offset >= node.offset && offset < (node.offset + node.length)) || includeRightBound && (offset === (node.offset + node.length));
    }
    /**
     * Finds the most inner node at the given offset. If includeRightBound is set, also finds nodes that end at the given offset.
     */
    function findNodeAtOffset(node, offset, includeRightBound = false) {
        if (contains(node, offset, includeRightBound)) {
            const children = node.children;
            if (Array.isArray(children)) {
                for (let i = 0; i < children.length && children[i].offset <= offset; i++) {
                    const item = findNodeAtOffset(children[i], offset, includeRightBound);
                    if (item) {
                        return item;
                    }
                }
            }
            return node;
        }
        return undefined;
    }
    /**
     * Parses the given text and invokes the visitor functions for each object, array and literal reached.
     */
    function visit(text, visitor, options = ParseOptions.DEFAULT) {
        const _scanner = createScanner(text, false);
        function toNoArgVisit(visitFunction) {
            return visitFunction ? () => visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength()) : () => true;
        }
        function toOneArgVisit(visitFunction) {
            return visitFunction ? (arg) => visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength()) : () => true;
        }
        const onObjectBegin = toNoArgVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisit(visitor.onObjectProperty), onObjectEnd = toNoArgVisit(visitor.onObjectEnd), onArrayBegin = toNoArgVisit(visitor.onArrayBegin), onArrayEnd = toNoArgVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisit(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
        const disallowComments = options && options.disallowComments;
        const allowTrailingComma = options && options.allowTrailingComma;
        function scanNext() {
            while (true) {
                const token = _scanner.scan();
                switch (_scanner.getTokenError()) {
                    case 4 /* ScanError.InvalidUnicode */:
                        handleError(14 /* ParseErrorCode.InvalidUnicode */);
                        break;
                    case 5 /* ScanError.InvalidEscapeCharacter */:
                        handleError(15 /* ParseErrorCode.InvalidEscapeCharacter */);
                        break;
                    case 3 /* ScanError.UnexpectedEndOfNumber */:
                        handleError(13 /* ParseErrorCode.UnexpectedEndOfNumber */);
                        break;
                    case 1 /* ScanError.UnexpectedEndOfComment */:
                        if (!disallowComments) {
                            handleError(11 /* ParseErrorCode.UnexpectedEndOfComment */);
                        }
                        break;
                    case 2 /* ScanError.UnexpectedEndOfString */:
                        handleError(12 /* ParseErrorCode.UnexpectedEndOfString */);
                        break;
                    case 6 /* ScanError.InvalidCharacter */:
                        handleError(16 /* ParseErrorCode.InvalidCharacter */);
                        break;
                }
                switch (token) {
                    case 12 /* SyntaxKind.LineCommentTrivia */:
                    case 13 /* SyntaxKind.BlockCommentTrivia */:
                        if (disallowComments) {
                            handleError(10 /* ParseErrorCode.InvalidCommentToken */);
                        }
                        else {
                            onComment();
                        }
                        break;
                    case 16 /* SyntaxKind.Unknown */:
                        handleError(1 /* ParseErrorCode.InvalidSymbol */);
                        break;
                    case 15 /* SyntaxKind.Trivia */:
                    case 14 /* SyntaxKind.LineBreakTrivia */:
                        break;
                    default:
                        return token;
                }
            }
        }
        function handleError(error, skipUntilAfter = [], skipUntil = []) {
            onError(error);
            if (skipUntilAfter.length + skipUntil.length > 0) {
                let token = _scanner.getToken();
                while (token !== 17 /* SyntaxKind.EOF */) {
                    if (skipUntilAfter.indexOf(token) !== -1) {
                        scanNext();
                        break;
                    }
                    else if (skipUntil.indexOf(token) !== -1) {
                        break;
                    }
                    token = scanNext();
                }
            }
        }
        function parseString(isValue) {
            const value = _scanner.getTokenValue();
            if (isValue) {
                onLiteralValue(value);
            }
            else {
                onObjectProperty(value);
            }
            scanNext();
            return true;
        }
        function parseLiteral() {
            switch (_scanner.getToken()) {
                case 11 /* SyntaxKind.NumericLiteral */: {
                    let value = 0;
                    try {
                        value = JSON.parse(_scanner.getTokenValue());
                        if (typeof value !== 'number') {
                            handleError(2 /* ParseErrorCode.InvalidNumberFormat */);
                            value = 0;
                        }
                    }
                    catch (e) {
                        handleError(2 /* ParseErrorCode.InvalidNumberFormat */);
                    }
                    onLiteralValue(value);
                    break;
                }
                case 7 /* SyntaxKind.NullKeyword */:
                    onLiteralValue(null);
                    break;
                case 8 /* SyntaxKind.TrueKeyword */:
                    onLiteralValue(true);
                    break;
                case 9 /* SyntaxKind.FalseKeyword */:
                    onLiteralValue(false);
                    break;
                default:
                    return false;
            }
            scanNext();
            return true;
        }
        function parseProperty() {
            if (_scanner.getToken() !== 10 /* SyntaxKind.StringLiteral */) {
                handleError(3 /* ParseErrorCode.PropertyNameExpected */, [], [2 /* SyntaxKind.CloseBraceToken */, 5 /* SyntaxKind.CommaToken */]);
                return false;
            }
            parseString(false);
            if (_scanner.getToken() === 6 /* SyntaxKind.ColonToken */) {
                onSeparator(':');
                scanNext(); // consume colon
                if (!parseValue()) {
                    handleError(4 /* ParseErrorCode.ValueExpected */, [], [2 /* SyntaxKind.CloseBraceToken */, 5 /* SyntaxKind.CommaToken */]);
                }
            }
            else {
                handleError(5 /* ParseErrorCode.ColonExpected */, [], [2 /* SyntaxKind.CloseBraceToken */, 5 /* SyntaxKind.CommaToken */]);
            }
            return true;
        }
        function parseObject() {
            onObjectBegin();
            scanNext(); // consume open brace
            let needsComma = false;
            while (_scanner.getToken() !== 2 /* SyntaxKind.CloseBraceToken */ && _scanner.getToken() !== 17 /* SyntaxKind.EOF */) {
                if (_scanner.getToken() === 5 /* SyntaxKind.CommaToken */) {
                    if (!needsComma) {
                        handleError(4 /* ParseErrorCode.ValueExpected */, [], []);
                    }
                    onSeparator(',');
                    scanNext(); // consume comma
                    if (_scanner.getToken() === 2 /* SyntaxKind.CloseBraceToken */ && allowTrailingComma) {
                        break;
                    }
                }
                else if (needsComma) {
                    handleError(6 /* ParseErrorCode.CommaExpected */, [], []);
                }
                if (!parseProperty()) {
                    handleError(4 /* ParseErrorCode.ValueExpected */, [], [2 /* SyntaxKind.CloseBraceToken */, 5 /* SyntaxKind.CommaToken */]);
                }
                needsComma = true;
            }
            onObjectEnd();
            if (_scanner.getToken() !== 2 /* SyntaxKind.CloseBraceToken */) {
                handleError(7 /* ParseErrorCode.CloseBraceExpected */, [2 /* SyntaxKind.CloseBraceToken */], []);
            }
            else {
                scanNext(); // consume close brace
            }
            return true;
        }
        function parseArray() {
            onArrayBegin();
            scanNext(); // consume open bracket
            let needsComma = false;
            while (_scanner.getToken() !== 4 /* SyntaxKind.CloseBracketToken */ && _scanner.getToken() !== 17 /* SyntaxKind.EOF */) {
                if (_scanner.getToken() === 5 /* SyntaxKind.CommaToken */) {
                    if (!needsComma) {
                        handleError(4 /* ParseErrorCode.ValueExpected */, [], []);
                    }
                    onSeparator(',');
                    scanNext(); // consume comma
                    if (_scanner.getToken() === 4 /* SyntaxKind.CloseBracketToken */ && allowTrailingComma) {
                        break;
                    }
                }
                else if (needsComma) {
                    handleError(6 /* ParseErrorCode.CommaExpected */, [], []);
                }
                if (!parseValue()) {
                    handleError(4 /* ParseErrorCode.ValueExpected */, [], [4 /* SyntaxKind.CloseBracketToken */, 5 /* SyntaxKind.CommaToken */]);
                }
                needsComma = true;
            }
            onArrayEnd();
            if (_scanner.getToken() !== 4 /* SyntaxKind.CloseBracketToken */) {
                handleError(8 /* ParseErrorCode.CloseBracketExpected */, [4 /* SyntaxKind.CloseBracketToken */], []);
            }
            else {
                scanNext(); // consume close bracket
            }
            return true;
        }
        function parseValue() {
            switch (_scanner.getToken()) {
                case 3 /* SyntaxKind.OpenBracketToken */:
                    return parseArray();
                case 1 /* SyntaxKind.OpenBraceToken */:
                    return parseObject();
                case 10 /* SyntaxKind.StringLiteral */:
                    return parseString(true);
                default:
                    return parseLiteral();
            }
        }
        scanNext();
        if (_scanner.getToken() === 17 /* SyntaxKind.EOF */) {
            if (options.allowEmptyContent) {
                return true;
            }
            handleError(4 /* ParseErrorCode.ValueExpected */, [], []);
            return false;
        }
        if (!parseValue()) {
            handleError(4 /* ParseErrorCode.ValueExpected */, [], []);
            return false;
        }
        if (_scanner.getToken() !== 17 /* SyntaxKind.EOF */) {
            handleError(9 /* ParseErrorCode.EndOfFileExpected */, [], []);
        }
        return true;
    }
    /**
     * Takes JSON with JavaScript-style comments and remove
     * them. Optionally replaces every none-newline character
     * of comments with a replaceCharacter
     */
    function stripComments(text, replaceCh) {
        const _scanner = createScanner(text);
        const parts = [];
        let kind;
        let offset = 0;
        let pos;
        do {
            pos = _scanner.getPosition();
            kind = _scanner.scan();
            switch (kind) {
                case 12 /* SyntaxKind.LineCommentTrivia */:
                case 13 /* SyntaxKind.BlockCommentTrivia */:
                case 17 /* SyntaxKind.EOF */:
                    if (offset !== pos) {
                        parts.push(text.substring(offset, pos));
                    }
                    if (replaceCh !== undefined) {
                        parts.push(_scanner.getTokenValue().replace(/[^\r\n]/g, replaceCh));
                    }
                    offset = _scanner.getPosition();
                    break;
            }
        } while (kind !== 17 /* SyntaxKind.EOF */);
        return parts.join('');
    }
    function getNodeType(value) {
        switch (typeof value) {
            case 'boolean': return 'boolean';
            case 'number': return 'number';
            case 'string': return 'string';
            case 'object': {
                if (!value) {
                    return 'null';
                }
                else if (Array.isArray(value)) {
                    return 'array';
                }
                return 'object';
            }
            default: return 'null';
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2pzb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcU1oRyxzQ0FzV0M7SUFzS0Qsa0NBa0hDO0lBT0Qsc0JBNENDO0lBTUQsOEJBNERDO0lBS0QsZ0RBOEJDO0lBS0Qsa0NBZUM7SUFLRCxvQ0F1QkM7SUFFRCw0QkFFQztJQUtELDRDQWVDO0lBTUQsc0JBZ1BDO0lBT0Qsc0NBMkJDO0lBRUQsa0NBZUM7SUExMENELElBQWtCLFNBUWpCO0lBUkQsV0FBa0IsU0FBUztRQUMxQix5Q0FBUSxDQUFBO1FBQ1IsNkVBQTBCLENBQUE7UUFDMUIsMkVBQXlCLENBQUE7UUFDekIsMkVBQXlCLENBQUE7UUFDekIsNkRBQWtCLENBQUE7UUFDbEIsNkVBQTBCLENBQUE7UUFDMUIsaUVBQW9CLENBQUE7SUFDckIsQ0FBQyxFQVJpQixTQUFTLHlCQUFULFNBQVMsUUFRMUI7SUFFRCxJQUFrQixVQWtCakI7SUFsQkQsV0FBa0IsVUFBVTtRQUMzQiwrREFBa0IsQ0FBQTtRQUNsQixpRUFBbUIsQ0FBQTtRQUNuQixtRUFBb0IsQ0FBQTtRQUNwQixxRUFBcUIsQ0FBQTtRQUNyQix1REFBYyxDQUFBO1FBQ2QsdURBQWMsQ0FBQTtRQUNkLHlEQUFlLENBQUE7UUFDZix5REFBZSxDQUFBO1FBQ2YsMkRBQWdCLENBQUE7UUFDaEIsOERBQWtCLENBQUE7UUFDbEIsZ0VBQW1CLENBQUE7UUFDbkIsc0VBQXNCLENBQUE7UUFDdEIsd0VBQXVCLENBQUE7UUFDdkIsa0VBQW9CLENBQUE7UUFDcEIsZ0RBQVcsQ0FBQTtRQUNYLGtEQUFZLENBQUE7UUFDWiwwQ0FBUSxDQUFBO0lBQ1QsQ0FBQyxFQWxCaUIsVUFBVSwwQkFBVixVQUFVLFFBa0IzQjtJQWdERCxJ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