/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/characterClassifier"], function (require, exports, characterClassifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinkComputer = exports.StateMachine = exports.State = void 0;
    exports.computeLinks = computeLinks;
    var State;
    (function (State) {
        State[State["Invalid"] = 0] = "Invalid";
        State[State["Start"] = 1] = "Start";
        State[State["H"] = 2] = "H";
        State[State["HT"] = 3] = "HT";
        State[State["HTT"] = 4] = "HTT";
        State[State["HTTP"] = 5] = "HTTP";
        State[State["F"] = 6] = "F";
        State[State["FI"] = 7] = "FI";
        State[State["FIL"] = 8] = "FIL";
        State[State["BeforeColon"] = 9] = "BeforeColon";
        State[State["AfterColon"] = 10] = "AfterColon";
        State[State["AlmostThere"] = 11] = "AlmostThere";
        State[State["End"] = 12] = "End";
        State[State["Accept"] = 13] = "Accept";
        State[State["LastKnownState"] = 14] = "LastKnownState"; // marker, custom states may follow
    })(State || (exports.State = State = {}));
    class Uint8Matrix {
        constructor(rows, cols, defaultValue) {
            const data = new Uint8Array(rows * cols);
            for (let i = 0, len = rows * cols; i < len; i++) {
                data[i] = defaultValue;
            }
            this._data = data;
            this.rows = rows;
            this.cols = cols;
        }
        get(row, col) {
            return this._data[row * this.cols + col];
        }
        set(row, col, value) {
            this._data[row * this.cols + col] = value;
        }
    }
    class StateMachine {
        constructor(edges) {
            let maxCharCode = 0;
            let maxState = 0 /* State.Invalid */;
            for (let i = 0, len = edges.length; i < len; i++) {
                const [from, chCode, to] = edges[i];
                if (chCode > maxCharCode) {
                    maxCharCode = chCode;
                }
                if (from > maxState) {
                    maxState = from;
                }
                if (to > maxState) {
                    maxState = to;
                }
            }
            maxCharCode++;
            maxState++;
            const states = new Uint8Matrix(maxState, maxCharCode, 0 /* State.Invalid */);
            for (let i = 0, len = edges.length; i < len; i++) {
                const [from, chCode, to] = edges[i];
                states.set(from, chCode, to);
            }
            this._states = states;
            this._maxCharCode = maxCharCode;
        }
        nextState(currentState, chCode) {
            if (chCode < 0 || chCode >= this._maxCharCode) {
                return 0 /* State.Invalid */;
            }
            return this._states.get(currentState, chCode);
        }
    }
    exports.StateMachine = StateMachine;
    // State machine for http:// or https:// or file://
    let _stateMachine = null;
    function getStateMachine() {
        if (_stateMachine === null) {
            _stateMachine = new StateMachine([
                [1 /* State.Start */, 104 /* CharCode.h */, 2 /* State.H */],
                [1 /* State.Start */, 72 /* CharCode.H */, 2 /* State.H */],
                [1 /* State.Start */, 102 /* CharCode.f */, 6 /* State.F */],
                [1 /* State.Start */, 70 /* CharCode.F */, 6 /* State.F */],
                [2 /* State.H */, 116 /* CharCode.t */, 3 /* State.HT */],
                [2 /* State.H */, 84 /* CharCode.T */, 3 /* State.HT */],
                [3 /* State.HT */, 116 /* CharCode.t */, 4 /* State.HTT */],
                [3 /* State.HT */, 84 /* CharCode.T */, 4 /* State.HTT */],
                [4 /* State.HTT */, 112 /* CharCode.p */, 5 /* State.HTTP */],
                [4 /* State.HTT */, 80 /* CharCode.P */, 5 /* State.HTTP */],
                [5 /* State.HTTP */, 115 /* CharCode.s */, 9 /* State.BeforeColon */],
                [5 /* State.HTTP */, 83 /* CharCode.S */, 9 /* State.BeforeColon */],
                [5 /* State.HTTP */, 58 /* CharCode.Colon */, 10 /* State.AfterColon */],
                [6 /* State.F */, 105 /* CharCode.i */, 7 /* State.FI */],
                [6 /* State.F */, 73 /* CharCode.I */, 7 /* State.FI */],
                [7 /* State.FI */, 108 /* CharCode.l */, 8 /* State.FIL */],
                [7 /* State.FI */, 76 /* CharCode.L */, 8 /* State.FIL */],
                [8 /* State.FIL */, 101 /* CharCode.e */, 9 /* State.BeforeColon */],
                [8 /* State.FIL */, 69 /* CharCode.E */, 9 /* State.BeforeColon */],
                [9 /* State.BeforeColon */, 58 /* CharCode.Colon */, 10 /* State.AfterColon */],
                [10 /* State.AfterColon */, 47 /* CharCode.Slash */, 11 /* State.AlmostThere */],
                [11 /* State.AlmostThere */, 47 /* CharCode.Slash */, 12 /* State.End */],
            ]);
        }
        return _stateMachine;
    }
    var CharacterClass;
    (function (CharacterClass) {
        CharacterClass[CharacterClass["None"] = 0] = "None";
        CharacterClass[CharacterClass["ForceTermination"] = 1] = "ForceTermination";
        CharacterClass[CharacterClass["CannotEndIn"] = 2] = "CannotEndIn";
    })(CharacterClass || (CharacterClass = {}));
    let _classifier = null;
    function getClassifier() {
        if (_classifier === null) {
            _classifier = new characterClassifier_1.CharacterClassifier(0 /* CharacterClass.None */);
            // allow-any-unicode-next-line
            const FORCE_TERMINATION_CHARACTERS = ' \t<>\'\"、。｡､，．：；‘〈「『〔（［｛｢｣｝］）〕』」〉’｀～…';
            for (let i = 0; i < FORCE_TERMINATION_CHARACTERS.length; i++) {
                _classifier.set(FORCE_TERMINATION_CHARACTERS.charCodeAt(i), 1 /* CharacterClass.ForceTermination */);
            }
            const CANNOT_END_WITH_CHARACTERS = '.,;:';
            for (let i = 0; i < CANNOT_END_WITH_CHARACTERS.length; i++) {
                _classifier.set(CANNOT_END_WITH_CHARACTERS.charCodeAt(i), 2 /* CharacterClass.CannotEndIn */);
            }
        }
        return _classifier;
    }
    class LinkComputer {
        static _createLink(classifier, line, lineNumber, linkBeginIndex, linkEndIndex) {
            // Do not allow to end link in certain characters...
            let lastIncludedCharIndex = linkEndIndex - 1;
            do {
                const chCode = line.charCodeAt(lastIncludedCharIndex);
                const chClass = classifier.get(chCode);
                if (chClass !== 2 /* CharacterClass.CannotEndIn */) {
                    break;
                }
                lastIncludedCharIndex--;
            } while (lastIncludedCharIndex > linkBeginIndex);
            // Handle links enclosed in parens, square brackets and curlys.
            if (linkBeginIndex > 0) {
                const charCodeBeforeLink = line.charCodeAt(linkBeginIndex - 1);
                const lastCharCodeInLink = line.charCodeAt(lastIncludedCharIndex);
                if ((charCodeBeforeLink === 40 /* CharCode.OpenParen */ && lastCharCodeInLink === 41 /* CharCode.CloseParen */)
                    || (charCodeBeforeLink === 91 /* CharCode.OpenSquareBracket */ && lastCharCodeInLink === 93 /* CharCode.CloseSquareBracket */)
                    || (charCodeBeforeLink === 123 /* CharCode.OpenCurlyBrace */ && lastCharCodeInLink === 125 /* CharCode.CloseCurlyBrace */)) {
                    // Do not end in ) if ( is before the link start
                    // Do not end in ] if [ is before the link start
                    // Do not end in } if { is before the link start
                    lastIncludedCharIndex--;
                }
            }
            return {
                range: {
                    startLineNumber: lineNumber,
                    startColumn: linkBeginIndex + 1,
                    endLineNumber: lineNumber,
                    endColumn: lastIncludedCharIndex + 2
                },
                url: line.substring(linkBeginIndex, lastIncludedCharIndex + 1)
            };
        }
        static computeLinks(model, stateMachine = getStateMachine()) {
            const classifier = getClassifier();
            const result = [];
            for (let i = 1, lineCount = model.getLineCount(); i <= lineCount; i++) {
                const line = model.getLineContent(i);
                const len = line.length;
                let j = 0;
                let linkBeginIndex = 0;
                let linkBeginChCode = 0;
                let state = 1 /* State.Start */;
                let hasOpenParens = false;
                let hasOpenSquareBracket = false;
                let inSquareBrackets = false;
                let hasOpenCurlyBracket = false;
                while (j < len) {
                    let resetStateMachine = false;
                    const chCode = line.charCodeAt(j);
                    if (state === 13 /* State.Accept */) {
                        let chClass;
                        switch (chCode) {
                            case 40 /* CharCode.OpenParen */:
                                hasOpenParens = true;
                                chClass = 0 /* CharacterClass.None */;
                                break;
                            case 41 /* CharCode.CloseParen */:
                                chClass = (hasOpenParens ? 0 /* CharacterClass.None */ : 1 /* CharacterClass.ForceTermination */);
                                break;
                            case 91 /* CharCode.OpenSquareBracket */:
                                inSquareBrackets = true;
                                hasOpenSquareBracket = true;
                                chClass = 0 /* CharacterClass.None */;
                                break;
                            case 93 /* CharCode.CloseSquareBracket */:
                                inSquareBrackets = false;
                                chClass = (hasOpenSquareBracket ? 0 /* CharacterClass.None */ : 1 /* CharacterClass.ForceTermination */);
                                break;
                            case 123 /* CharCode.OpenCurlyBrace */:
                                hasOpenCurlyBracket = true;
                                chClass = 0 /* CharacterClass.None */;
                                break;
                            case 125 /* CharCode.CloseCurlyBrace */:
                                chClass = (hasOpenCurlyBracket ? 0 /* CharacterClass.None */ : 1 /* CharacterClass.ForceTermination */);
                                break;
                            // The following three rules make it that ' or " or ` are allowed inside links
                            // only if the link is wrapped by some other quote character
                            case 39 /* CharCode.SingleQuote */:
                            case 34 /* CharCode.DoubleQuote */:
                            case 96 /* CharCode.BackTick */:
                                if (linkBeginChCode === chCode) {
                                    chClass = 1 /* CharacterClass.ForceTermination */;
                                }
                                else if (linkBeginChCode === 39 /* CharCode.SingleQuote */ || linkBeginChCode === 34 /* CharCode.DoubleQuote */ || linkBeginChCode === 96 /* CharCode.BackTick */) {
                                    chClass = 0 /* CharacterClass.None */;
                                }
                                else {
                                    chClass = 1 /* CharacterClass.ForceTermination */;
                                }
                                break;
                            case 42 /* CharCode.Asterisk */:
                                // `*` terminates a link if the link began with `*`
                                chClass = (linkBeginChCode === 42 /* CharCode.Asterisk */) ? 1 /* CharacterClass.ForceTermination */ : 0 /* CharacterClass.None */;
                                break;
                            case 124 /* CharCode.Pipe */:
                                // `|` terminates a link if the link began with `|`
                                chClass = (linkBeginChCode === 124 /* CharCode.Pipe */) ? 1 /* CharacterClass.ForceTermination */ : 0 /* CharacterClass.None */;
                                break;
                            case 32 /* CharCode.Space */:
                                // ` ` allow space in between [ and ]
                                chClass = (inSquareBrackets ? 0 /* CharacterClass.None */ : 1 /* CharacterClass.ForceTermination */);
                                break;
                            default:
                                chClass = classifier.get(chCode);
                        }
                        // Check if character terminates link
                        if (chClass === 1 /* CharacterClass.ForceTermination */) {
                            result.push(LinkComputer._createLink(classifier, line, i, linkBeginIndex, j));
                            resetStateMachine = true;
                        }
                    }
                    else if (state === 12 /* State.End */) {
                        let chClass;
                        if (chCode === 91 /* CharCode.OpenSquareBracket */) {
                            // Allow for the authority part to contain ipv6 addresses which contain [ and ]
                            hasOpenSquareBracket = true;
                            chClass = 0 /* CharacterClass.None */;
                        }
                        else {
                            chClass = classifier.get(chCode);
                        }
                        // Check if character terminates link
                        if (chClass === 1 /* CharacterClass.ForceTermination */) {
                            resetStateMachine = true;
                        }
                        else {
                            state = 13 /* State.Accept */;
                        }
                    }
                    else {
                        state = stateMachine.nextState(state, chCode);
                        if (state === 0 /* State.Invalid */) {
                            resetStateMachine = true;
                        }
                    }
                    if (resetStateMachine) {
                        state = 1 /* State.Start */;
                        hasOpenParens = false;
                        hasOpenSquareBracket = false;
                        hasOpenCurlyBracket = false;
                        // Record where the link started
                        linkBeginIndex = j + 1;
                        linkBeginChCode = chCode;
                    }
                    j++;
                }
                if (state === 13 /* State.Accept */) {
                    result.push(LinkComputer._createLink(classifier, line, i, linkBeginIndex, len));
                }
            }
            return result;
        }
    }
    exports.LinkComputer = LinkComputer;
    /**
     * Returns an array of all links contains in the provided
     * document. *Note* that this operation is computational
     * expensive and should not run in the UI thread.
     */
    function computeLinks(model) {
        if (!model || typeof model.getLineCount !== 'function' || typeof model.getLineContent !== 'function') {
            // Unknown caller!
            return [];
        }
        return LinkComputer.computeLinks(model);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua0NvbXB1dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9sYW5ndWFnZXMvbGlua0NvbXB1dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlWaEcsb0NBTUM7SUFwVkQsSUFBa0IsS0FnQmpCO0lBaEJELFdBQWtCLEtBQUs7UUFDdEIsdUNBQVcsQ0FBQTtRQUNYLG1DQUFTLENBQUE7UUFDVCwyQkFBSyxDQUFBO1FBQ0wsNkJBQU0sQ0FBQTtRQUNOLCtCQUFPLENBQUE7UUFDUCxpQ0FBUSxDQUFBO1FBQ1IsMkJBQUssQ0FBQTtRQUNMLDZCQUFNLENBQUE7UUFDTiwrQkFBTyxDQUFBO1FBQ1AsK0NBQWUsQ0FBQTtRQUNmLDhDQUFlLENBQUE7UUFDZixnREFBZ0IsQ0FBQTtRQUNoQixnQ0FBUSxDQUFBO1FBQ1Isc0NBQVcsQ0FBQTtRQUNYLHNEQUFtQixDQUFBLENBQUMsbUNBQW1DO0lBQ3hELENBQUMsRUFoQmlCLEtBQUsscUJBQUwsS0FBSyxRQWdCdEI7SUFJRCxNQUFNLFdBQVc7UUFNaEIsWUFBWSxJQUFZLEVBQUUsSUFBWSxFQUFFLFlBQW9CO1lBQzNELE1BQU0sSUFBSSxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztZQUN6QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUM7WUFDeEIsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFD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