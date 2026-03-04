/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/async", "vs/base/common/color", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/platform/configuration/common/configuration", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, async_1, color_1, decorators_1, event_1, lifecycle_1, strings_1, configuration_1, telemetry_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TypeAheadAddon = exports.CharPredictState = exports.PredictionTimeline = exports.PredictionStats = void 0;
    var VT;
    (function (VT) {
        VT["Esc"] = "\u001B";
        VT["Csi"] = "\u001B[";
        VT["ShowCursor"] = "\u001B[?25h";
        VT["HideCursor"] = "\u001B[?25l";
        VT["DeleteChar"] = "\u001B[X";
        VT["DeleteRestOfLine"] = "\u001B[K";
    })(VT || (VT = {}));
    const CSI_STYLE_RE = /^\x1b\[[0-9;]*m/;
    const CSI_MOVE_RE = /^\x1b\[?([0-9]*)(;[35])?O?([DC])/;
    const NOT_WORD_RE = /[^a-z0-9]/i;
    var StatsConstants;
    (function (StatsConstants) {
        StatsConstants[StatsConstants["StatsBufferSize"] = 24] = "StatsBufferSize";
        StatsConstants[StatsConstants["StatsSendTelemetryEvery"] = 300000] = "StatsSendTelemetryEvery";
        StatsConstants[StatsConstants["StatsMinSamplesToTurnOn"] = 5] = "StatsMinSamplesToTurnOn";
        StatsConstants[StatsConstants["StatsMinAccuracyToTurnOn"] = 0.3] = "StatsMinAccuracyToTurnOn";
        StatsConstants[StatsConstants["StatsToggleOffThreshold"] = 0.5] = "StatsToggleOffThreshold";
    })(StatsConstants || (StatsConstants = {}));
    /**
     * Codes that should be omitted from sending to the prediction engine and instead omitted directly:
     * - Hide cursor (DECTCEM): We wrap the local echo sequence in hide and show
     *   CSI ? 2 5 l
     * - Show cursor (DECTCEM): We wrap the local echo sequence in hide and show
     *   CSI ? 2 5 h
     * - Device Status Report (DSR): These sequence fire report events from xterm which could cause
     *   double reporting and potentially a stack overflow (#119472)
     *   CSI Ps n
     *   CSI ? Ps n
     */
    const PREDICTION_OMIT_RE = /^(\x1b\[(\??25[hl]|\??[0-9;]+n))+/;
    const core = (terminal) => terminal._core;
    const flushOutput = (terminal) => {
        // TODO: Flushing output is not possible anymore without async
    };
    var CursorMoveDirection;
    (function (CursorMoveDirection) {
        CursorMoveDirection["Back"] = "D";
        CursorMoveDirection["Forwards"] = "C";
    })(CursorMoveDirection || (CursorMoveDirection = {}));
    class Cursor {
        get x() {
            return this._x;
        }
        get y() {
            return this._y;
        }
        get baseY() {
            return this._baseY;
        }
        get coordinate() {
            return { x: this._x, y: this._y, baseY: this._baseY };
        }
        constructor(rows, cols, _buffer) {
            this.rows = rows;
            this.cols = cols;
            this._buffer = _buffer;
            this._x = 0;
            this._y = 1;
            this._baseY = 1;
            this._x = _buffer.cursorX;
            this._y = _buffer.cursorY;
            this._baseY = _buffer.baseY;
        }
        getLine() {
            return this._buffer.getLine(this._y + this._baseY);
        }
        getCell(loadInto) {
            return this.getLine()?.getCell(this._x, loadInto);
        }
        moveTo(coordinate) {
            this._x = coordinate.x;
            this._y = (coordinate.y + coordinate.baseY) - this._baseY;
            return this.moveInstruction();
        }
        clone() {
            const c = new Cursor(this.rows, this.cols, this._buffer);
            c.moveTo(this);
            return c;
        }
        move(x, y) {
            this._x = x;
            this._y = y;
            return this.moveInstruction();
        }
        shift(x = 0, y = 0) {
            this._x += x;
            this._y += y;
            return this.moveInstruction();
        }
        moveInstruction() {
            if (this._y >= this.rows) {
                this._baseY += this._y - (this.rows - 1);
                this._y = this.rows - 1;
            }
            else if (this._y < 0) {
                this._baseY -= this._y;
                this._y = 0;
            }
            return `${"\u001B[" /* VT.Csi */}${this._y + 1};${this._x + 1}H`;
        }
    }
    const moveToWordBoundary = (b, cursor, direction) => {
        let ateLeadingWhitespace = false;
        if (direction < 0) {
            cursor.shift(-1);
        }
        let cell;
        while (cursor.x >= 0) {
            cell = cursor.getCell(cell);
            if (!cell?.getCode()) {
                return;
            }
            const chars = cell.getChars();
            if (NOT_WORD_RE.test(chars)) {
                if (ateLeadingWhitespace) {
                    break;
                }
            }
            else {
                ateLeadingWhitespace = true;
            }
            cursor.shift(direction);
        }
        if (direction < 0) {
            cursor.shift(1); // we want to place the cursor after the whitespace starting the word
        }
    };
    var MatchResult;
    (function (MatchResult) {
        /** matched successfully */
        MatchResult[MatchResult["Success"] = 0] = "Success";
        /** failed to match */
        MatchResult[MatchResult["Failure"] = 1] = "Failure";
        /** buffer data, it might match in the future one more data comes in */
        MatchResult[MatchResult["Buffer"] = 2] = "Buffer";
    })(MatchResult || (MatchResult = {}));
    class StringReader {
        get remaining() {
            return this._input.length - this.index;
        }
        get eof() {
            return this.index === this._input.length;
        }
        get rest() {
            return this._input.slice(this.index);
        }
        constructor(_input) {
            this._input = _input;
            this.index = 0;
        }
        /**
         * Advances the reader and returns the character if it matches.
         */
        eatChar(char) {
            if (this._input[this.index] !== char) {
                return;
            }
            this.index++;
            return char;
        }
        /**
         * Advances the reader and returns the string if it matches.
         */
        eatStr(substr) {
            if (this._input.slice(this.index, substr.length) !== substr) {
                return;
            }
            this.index += substr.length;
            return substr;
        }
        /**
         * Matches and eats the substring character-by-character. If EOF is reached
         * before the substring is consumed, it will buffer. Index is not moved
         * if it's not a match.
         */
        eatGradually(substr) {
            const prevIndex = this.index;
            for (let i = 0; i < substr.length; i++) {
                if (i > 0 && this.eof) {
                    return 2 /* MatchResult.Buffer */;
                }
                if (!this.eatChar(substr[i])) {
                    this.index = prevIndex;
                    return 1 /* MatchResult.Failure */;
                }
            }
            return 0 /* MatchResult.Success */;
        }
        /**
         * Advances the reader and returns the regex if it matches.
         */
        eatRe(re) {
            const match = re.exec(this._input.slice(this.index));
            if (!match) {
                return;
            }
            this.index += match[0].length;
            return match;
        }
        /**
         * Advances the reader and returns the character if the code matches.
         */
        eatCharCode(min = 0, max = min + 1) {
            const code = this._input.charCodeAt(this.index);
            if (code < min || code >= max) {
                return undefined;
            }
            this.index++;
            return code;
        }
    }
    /**
     * Preidction which never tests true. Will always discard predictions made
     * after it.
     */
    class HardBoundary {
        constructor() {
            this.clearAfterTimeout = false;
        }
        apply() {
            return '';
        }
        rollback() {
            return '';
        }
        rollForwards() {
            return '';
        }
        matches() {
            return 1 /* MatchResult.Failure */;
        }
    }
    /**
     * Wraps another prediction. Does not apply the prediction, but will pass
     * through its `matches` request.
     */
    class TentativeBoundary {
        constructor(inner) {
            this.inner = inner;
        }
        apply(buffer, cursor) {
            this._appliedCursor = cursor.clone();
            this.inner.apply(buffer, this._appliedCursor);
            return '';
        }
        rollback(cursor) {
            this.inner.rollback(cursor.clone());
            return '';
        }
        rollForwards(cursor, withInput) {
            if (this._appliedCursor) {
                cursor.moveTo(this._appliedCursor);
            }
            return withInput;
        }
        matches(input) {
            return this.inner.matches(input);
        }
    }
    const isTenativeCharacterPrediction = (p) => p instanceof TentativeBoundary && p.inner instanceof CharacterPrediction;
    /**
     * Prediction for a single alphanumeric character.
     */
    class CharacterPrediction {
        constructor(_style, _char) {
            this._style = _style;
            this._char = _char;
            this.affectsStyle = true;
        }
        apply(_, cursor) {
            const cell = cursor.getCell();
            this.appliedAt = cell
                ? { pos: cursor.coordinate, oldAttributes: attributesToSeq(cell), oldChar: cell.getChars() }
                : { pos: cursor.coordinate, oldAttributes: '', oldChar: '' };
            cursor.shift(1);
            return this._style.apply + this._char + this._style.undo;
        }
        rollback(cursor) {
            if (!this.appliedAt) {
                return ''; // not applied
            }
            const { oldAttributes, oldChar, pos } = this.appliedAt;
            const r = cursor.moveTo(pos) + (oldChar ? `${oldAttributes}${oldChar}${cursor.moveTo(pos)}` : "\u001B[X" /* VT.DeleteChar */);
            return r;
        }
        rollForwards(cursor, input) {
            if (!this.appliedAt) {
                return ''; // not applied
            }
            return cursor.clone().moveTo(this.appliedAt.pos) + input;
        }
        matches(input, lookBehind) {
            const startIndex = input.index;
            // remove any styling CSI before checking the char
            while (input.eatRe(CSI_STYLE_RE)) { }
            if (input.eof) {
                return 2 /* MatchResult.Buffer */;
            }
            if (input.eatChar(this._char)) {
                return 0 /* MatchResult.Success */;
            }
            if (lookBehind instanceof CharacterPrediction) {
                // see #112842
                const sillyZshOutcome = input.eatGradually(`\b${lookBehind._char}${this._char}`);
                if (sillyZshOutcome !== 1 /* MatchResult.Failure */) {
                    return sillyZshOutcome;
                }
            }
            input.index = startIndex;
            return 1 /* MatchResult.Failure */;
        }
    }
    class BackspacePrediction {
        constructor(_terminal) {
            this._terminal = _terminal;
        }
        apply(_, cursor) {
            // at eol if everything to the right is whitespace (zsh will emit a "clear line" code in this case)
            // todo: can be optimized if `getTrimmedLength` is exposed from xterm
            const isLastChar = !cursor.getLine()?.translateToString(undefined, cursor.x).trim();
            const pos = cursor.coordinate;
            const move = cursor.shift(-1);
            const cell = cursor.getCell();
            this._appliedAt = cell
                ? { isLastChar, pos, oldAttributes: attributesToSeq(cell), oldChar: cell.getChars() }
                : { isLastChar, pos, oldAttributes: '', oldChar: '' };
            return move + "\u001B[X" /* VT.DeleteChar */;
        }
        rollback(cursor) {
            if (!this._appliedAt) {
                return ''; // not applied
            }
            const { oldAttributes, oldChar, pos } = this._appliedAt;
            if (!oldChar) {
                return cursor.moveTo(pos) + "\u001B[X" /* VT.DeleteChar */;
            }
            return oldAttributes + oldChar + cursor.moveTo(pos) + attributesToSeq(core(this._terminal)._inputHandler._curAttrData);
        }
        rollForwards() {
            return '';
        }
        matches(input) {
            if (this._appliedAt?.isLastChar) {
                const r1 = input.eatGradually(`\b${"\u001B[" /* VT.Csi */}K`);
                if (r1 !== 1 /* MatchResult.Failure */) {
                    return r1;
                }
                const r2 = input.eatGradually(`\b \b`);
                if (r2 !== 1 /* MatchResult.Failure */) {
                    return r2;
                }
            }
            return 1 /* MatchResult.Failure */;
        }
    }
    class NewlinePrediction {
        apply(_, cursor) {
            this._prevPosition = cursor.coordinate;
            cursor.move(0, cursor.y + 1);
            return '\r\n';
        }
        rollback(cursor) {
            return this._prevPosition ? cursor.moveTo(this._prevPosition) : '';
        }
        rollForwards() {
            return ''; // does not need to rewrite
        }
        matches(input) {
            return input.eatGradually('\r\n');
        }
    }
    /**
     * Prediction when the cursor reaches the end of the line. Similar to newline
     * prediction, but shells handle it slightly differently.
     */
    class LinewrapPrediction extends NewlinePrediction {
        apply(_, cursor) {
            this._prevPosition = cursor.coordinate;
            cursor.move(0, cursor.y + 1);
            return ' \r';
        }
        matches(input) {
            // bash and zshell add a space which wraps in the terminal, then a CR
            const r = input.eatGradually(' \r');
            if (r !== 1 /* MatchResult.Failure */) {
                // zshell additionally adds a clear line after wrapping to be safe -- eat it
                const r2 = input.eatGradually("\u001B[K" /* VT.DeleteRestOfLine */);
                return r2 === 2 /* MatchResult.Buffer */ ? 2 /* MatchResult.Buffer */ : r;
            }
            return input.eatGradually('\r\n');
        }
    }
    class CursorMovePrediction {
        constructor(_direction, _moveByWords, _amount) {
            this._direction = _direction;
            this._moveByWords = _moveByWords;
            this._amount = _amount;
        }
        apply(buffer, cursor) {
            const prevPosition = cursor.x;
            const currentCell = cursor.getCell();
            const prevAttrs = currentCell ? attributesToSeq(currentCell) : '';
            const { _amount: amount, _direction: direction, _moveByWords: moveByWords } = this;
            const delta = direction === "D" /* CursorMoveDirection.Back */ ? -1 : 1;
            const target = cursor.clone();
            if (moveByWords) {
                for (let i = 0; i < amount; i++) {
                    moveToWordBoundary(buffer, target, delta);
                }
            }
            else {
                target.shift(delta * amount);
            }
            this._applied = {
                amount: Math.abs(cursor.x - target.x),
                prevPosition,
                prevAttrs,
                rollForward: cursor.moveTo(target),
            };
            return this._applied.rollForward;
        }
        rollback(cursor) {
            if (!this._applied) {
                return '';
            }
            return cursor.move(this._applied.prevPosition, cursor.y) + this._applied.prevAttrs;
        }
        rollForwards() {
            return ''; // does not need to rewrite
        }
        matches(input) {
            if (!this._applied) {
                return 1 /* MatchResult.Failure */;
            }
            const direction = this._direction;
            const { amount, rollForward } = this._applied;
            // arg can be omitted to move one character. We don't eatGradually() here
            // or below moves that don't go as far as the cursor would be buffered
            // indefinitely
            if (input.eatStr(`${"\u001B[" /* VT.Csi */}${direction}`.repeat(amount))) {
                return 0 /* MatchResult.Success */;
            }
            // \b is the equivalent to moving one character back
            if (direction === "D" /* CursorMoveDirection.Back */) {
                if (input.eatStr(`\b`.repeat(amount))) {
                    return 0 /* MatchResult.Success */;
                }
            }
            // check if the cursor position is set absolutely
            if (rollForward) {
                const r = input.eatGradually(rollForward);
                if (r !== 1 /* MatchResult.Failure */) {
                    return r;
                }
            }
            // check for a relative move in the direction
            return input.eatGradually(`${"\u001B[" /* VT.Csi */}${amount}${direction}`);
        }
    }
    class PredictionStats extends lifecycle_1.Disposable {
        /**
         * Gets the percent (0-1) of predictions that were accurate.
         */
        get accuracy() {
            let correctCount = 0;
            for (const [, correct] of this._stats) {
                if (correct) {
                    correctCount++;
                }
            }
            return correctCount / (this._stats.length || 1);
        }
        /**
         * Gets the number of recorded stats.
         */
        get sampleSize() {
            return this._stats.length;
        }
        /**
         * Gets latency stats of successful predictions.
         */
        get latency() {
            const latencies = this._stats.filter(([, correct]) => correct).map(([s]) => s).sort();
            return {
                count: latencies.length,
                min: latencies[0],
                median: latencies[Math.floor(latencies.length / 2)],
                max: latencies[latencies.length - 1],
            };
        }
        /**
         * Gets the maximum observed latency.
         */
        get maxLatency() {
            let max = -Infinity;
            for (const [latency, correct] of this._stats) {
                if (correct) {
                    max = Math.max(latency, max);
                }
            }
            return max;
        }
        constructor(timeline) {
            super();
            this._stats = [];
            this._index = 0;
            this._addedAtTime = new WeakMap();
            this._changeEmitter = new event_1.Emitter();
            this.onChange = this._changeEmitter.event;
            this._register(timeline.onPredictionAdded(p => this._addedAtTime.set(p, Date.now())));
            this._register(timeline.onPredictionSucceeded(this._pushStat.bind(this, true)));
            this._register(timeline.onPredictionFailed(this._pushStat.bind(this, false)));
        }
        _pushStat(correct, prediction) {
            const started = this._addedAtTime.get(prediction);
            this._stats[this._index] = [Date.now() - started, correct];
            this._index = (this._index + 1) % 24 /* StatsConstants.StatsBufferSize */;
            this._changeEmitter.fire();
        }
    }
    exports.PredictionStats = PredictionStats;
    class PredictionTimeline {
        get _currentGenerationPredictions() {
            return this._expected.filter(({ gen }) => gen === this._expected[0].gen).map(({ p }) => p);
        }
        get isShowingPredictions() {
            return this._showPredictions;
        }
        get length() {
            return this._expected.length;
        }
        constructor(terminal, _style) {
            this.terminal = terminal;
            this._style = _style;
            /**
             * Expected queue of events. Only predictions for the lowest are
             * written into the terminal.
             */
            this._expected = [];
            /**
             * Current prediction generation.
             */
            this._currentGen = 0;
            /**
             * Whether predictions are echoed to the terminal. If false, predictions
             * will still be computed internally for latency metrics, but input will
             * never be adjusted.
             */
            this._showPredictions = false;
            this._addedEmitter = new event_1.Emitter();
            this.onPredictionAdded = this._addedEmitter.event;
            this._failedEmitter = new event_1.Emitter();
            this.onPredictionFailed = this._failedEmitter.event;
            this._succeededEmitter = new event_1.Emitter();
            this.onPredictionSucceeded = this._succeededEmitter.event;
        }
        setShowPredictions(show) {
            if (show === this._showPredictions) {
                return;
            }
            // console.log('set predictions:', show);
            this._showPredictions = show;
            const buffer = this._getActiveBuffer();
            if (!buffer) {
                return;
            }
            const toApply = this._currentGenerationPredictions;
            if (show) {
                this.clearCursor();
                this._style.expectIncomingStyle(toApply.reduce((count, p) => p.affectsStyle ? count + 1 : count, 0));
                this.terminal.write(toApply.map(p => p.apply(buffer, this.physicalCursor(buffer))).join(''));
            }
            else {
                this.terminal.write(toApply.reverse().map(p => p.rollback(this.physicalCursor(buffer))).join(''));
            }
        }
        /**
         * Undoes any predictions written and resets expectations.
         */
        undoAllPredictions() {
            const buffer = this._getActiveBuffer();
            if (this._showPredictions && buffer) {
                this.terminal.write(this._currentGenerationPredictions.reverse()
                    .map(p => p.rollback(this.physicalCursor(buffer))).join(''));
            }
            this._expected = [];
        }
        /**
         * Should be called when input is incoming to the temrinal.
         */
        beforeServerInput(input) {
            const originalInput = input;
            if (this._inputBuffer) {
                input = this._inputBuffer + input;
                this._inputBuffer = undefined;
            }
            if (!this._expected.length) {
                this._clearPredictionState();
                return input;
            }
            const buffer = this._getActiveBuffer();
            if (!buffer) {
                this._clearPredictionState();
                return input;
            }
            let output = '';
            const reader = new StringReader(input);
            const startingGen = this._expected[0].gen;
            const emitPredictionOmitted = () => {
                const omit = reader.eatRe(PREDICTION_OMIT_RE);
                if (omit) {
                    output += omit[0];
                }
            };
            ReadLoop: while (this._expected.length && reader.remaining > 0) {
                emitPredictionOmitted();
                const { p: prediction, gen } = this._expected[0];
                const cursor = this.physicalCursor(buffer);
                const beforeTestReaderIndex = reader.index;
                switch (prediction.matches(reader, this._lookBehind)) {
                    case 0 /* MatchResult.Success */: {
                        // if the input character matches what the next prediction expected, undo
                        // the prediction and write the real character out.
                        const eaten = input.slice(beforeTestReaderIndex, reader.index);
                        if (gen === startingGen) {
                            output += prediction.rollForwards?.(cursor, eaten);
                        }
                        else {
                            prediction.apply(buffer, this.physicalCursor(buffer)); // move cursor for additional apply
                            output += eaten;
                        }
                        this._succeededEmitter.fire(prediction);
                        this._lookBehind = prediction;
                        this._expected.shift();
                        break;
                    }
                    case 2 /* MatchResult.Buffer */:
                        // on a buffer, store the remaining data and completely read data
                        // to be output as normal.
                        this._inputBuffer = input.slice(beforeTestReaderIndex);
                        reader.index = input.length;
                        break ReadLoop;
                    case 1 /* MatchResult.Failure */: {
                        // on a failure, roll back all remaining items in this generation
                        // and clear predictions, since they are no longer valid
                        const rollback = this._expected.filter(p => p.gen === startingGen).reverse();
                        output += rollback.map(({ p }) => p.rollback(this.physicalCursor(buffer))).join('');
                        if (rollback.some(r => r.p.affectsStyle)) {
                            // reading the current style should generally be safe, since predictions
                            // always restore the style if they modify it.
                            output += attributesToSeq(core(this.terminal)._inputHandler._curAttrData);
                        }
                        this._clearPredictionState();
                        this._failedEmitter.fire(prediction);
                        break ReadLoop;
                    }
                }
            }
            emitPredictionOmitted();
            // Extra data (like the result of running a command) should cause us to
            // reset the cursor
            if (!reader.eof) {
                output += reader.rest;
                this._clearPredictionState();
            }
            // If we passed a generation boundary, apply the current generation's predictions
            if (this._expected.length && startingGen !== this._expected[0].gen) {
                for (const { p, gen } of this._expected) {
                    if (gen !== this._expected[0].gen) {
                        break;
                    }
                    if (p.affectsStyle) {
                        this._style.expectIncomingStyle();
                    }
                    output += p.apply(buffer, this.physicalCursor(buffer));
                }
            }
            if (!this._showPredictions) {
                return originalInput;
            }
            if (output.length === 0 || output === input) {
                return output;
            }
            if (this._physicalCursor) {
                output += this._physicalCursor.moveInstruction();
            }
            // prevent cursor flickering while typing
            output = "\u001B[?25l" /* VT.HideCursor */ + output + "\u001B[?25h" /* VT.ShowCursor */;
            return output;
        }
        /**
         * Clears any expected predictions and stored state. Should be called when
         * the pty gives us something we don't recognize.
         */
        _clearPredictionState() {
            this._expected = [];
            this.clearCursor();
            this._lookBehind = undefined;
        }
        /**
         * Appends a typeahead prediction.
         */
        addPrediction(buffer, prediction) {
            this._expected.push({ gen: this._currentGen, p: prediction });
            this._addedEmitter.fire(prediction);
            if (this._currentGen !== this._expected[0].gen) {
                prediction.apply(buffer, this.tentativeCursor(buffer));
                return false;
            }
            const text = prediction.apply(buffer, this.physicalCursor(buffer));
            this._tenativeCursor = undefined; // next read will get or clone the physical cursor
            if (this._showPredictions && text) {
                if (prediction.affectsStyle) {
                    this._style.expectIncomingStyle();
                }
                // console.log('predict:', JSON.stringify(text));
                this.terminal.write(text);
            }
            return true;
        }
        addBoundary(buffer, prediction) {
            let applied = false;
            if (buffer && prediction) {
                // We apply the prediction so that it's matched against, but wrapped
                // in a tentativeboundary so that it doesn't affect the physical cursor.
                // Then we apply it specifically to the tentative cursor.
                applied = this.addPrediction(buffer, new TentativeBoundary(prediction));
                prediction.apply(buffer, this.tentativeCursor(buffer));
            }
            this._currentGen++;
            return applied;
        }
        /**
         * Peeks the last prediction written.
         */
        peekEnd() {
            return this._expected[this._expected.length - 1]?.p;
        }
        /**
         * Peeks the first pending prediction.
         */
        peekStart() {
            return this._expected[0]?.p;
        }
        /**
         * Current position of the cursor in the terminal.
         */
        physicalCursor(buffer) {
            if (!this._physicalCursor) {
                if (this._showPredictions) {
                    flushOutput(this.terminal);
                }
                this._physicalCursor = new Cursor(this.terminal.rows, this.terminal.cols, buffer);
            }
            return this._physicalCursor;
        }
        /**
         * Cursor position if all predictions and boundaries that have been inserted
         * so far turn out to be successfully predicted.
         */
        tentativeCursor(buffer) {
            if (!this._tenativeCursor) {
                this._tenativeCursor = this.physicalCursor(buffer).clone();
            }
            return this._tenativeCursor;
        }
        clearCursor() {
            this._physicalCursor = undefined;
            this._tenativeCursor = undefined;
        }
        _getActiveBuffer() {
            const buffer = this.terminal.buffer.active;
            return buffer.type === 'normal' ? buffer : undefined;
        }
    }
    exports.PredictionTimeline = PredictionTimeline;
    /**
     * Gets the escape sequence args to restore state/appearance in the cell.
     */
    const attributesToArgs = (cell) => {
        if (cell.isAttributeDefault()) {
            return [0];
        }
        const args = [];
        if (cell.isBold()) {
            args.push(1);
        }
        if (cell.isDim()) {
            args.push(2);
        }
        if (cell.isItalic()) {
            args.push(3);
        }
        if (cell.isUnderline()) {
            args.push(4);
        }
        if (cell.isBlink()) {
            args.push(5);
        }
        if (cell.isInverse()) {
            args.push(7);
        }
        if (cell.isInvisible()) {
            args.push(8);
        }
        if (cell.isFgRGB()) {
            args.push(38, 2, cell.getFgColor() >>> 24, (cell.getFgColor() >>> 16) & 0xFF, cell.getFgColor() & 0xFF);
        }
        if (cell.isFgPalette()) {
            args.push(38, 5, cell.getFgColor());
        }
        if (cell.isFgDefault()) {
            args.push(39);
        }
        if (cell.isBgRGB()) {
            args.push(48, 2, cell.getBgColor() >>> 24, (cell.getBgColor() >>> 16) & 0xFF, cell.getBgColor() & 0xFF);
        }
        if (cell.isBgPalette()) {
            args.push(48, 5, cell.getBgColor());
        }
        if (cell.isBgDefault()) {
            args.push(49);
        }
        return args;
    };
    /**
     * Gets the escape sequence to restore state/appearance in the cell.
     */
    const attributesToSeq = (cell) => `${"\u001B[" /* VT.Csi */}${attributesToArgs(cell).join(';')}m`;
    const arrayHasPrefixAt = (a, ai, b) => {
        if (a.length - ai > b.length) {
            return false;
        }
        for (let bi = 0; bi < b.length; bi++, ai++) {
            if (b[ai] !== a[ai]) {
                return false;
            }
        }
        return true;
    };
    /**
     * @see https://github.com/xtermjs/xterm.js/blob/065eb13a9d3145bea687239680ec9696d9112b8e/src/common/InputHandler.ts#L2127
     */
    const getColorWidth = (params, pos) => {
        const accu = [0, 0, -1, 0, 0, 0];
        let cSpace = 0;
        let advance = 0;
        do {
            const v = params[pos + advance];
            accu[advance + cSpace] = typeof v === 'number' ? v : v[0];
            if (typeof v !== 'number') {
                let i = 0;
                do {
                    if (accu[1] === 5) {
                        cSpace = 1;
                    }
                    accu[advance + i + 1 + cSpace] = v[i];
                } while (++i < v.length && i + advance + 1 + cSpace < accu.length);
                break;
            }
            // exit early if can decide color mode with semicolons
            if ((accu[1] === 5 && advance + cSpace >= 2)
                || (accu[1] === 2 && advance + cSpace >= 5)) {
                break;
            }
            // offset colorSpace slot for semicolon mode
            if (accu[1]) {
                cSpace = 1;
            }
        } while (++advance + pos < params.length && advance + cSpace < accu.length);
        return advance;
    };
    class TypeAheadStyle {
        static _compileArgs(args) {
            return `${"\u001B[" /* VT.Csi */}${args.join(';')}m`;
        }
        constructor(value, _terminal) {
            this._terminal = _terminal;
            /**
             * Number of typeahead style arguments we expect to read. If this is 0 and
             * we see a style coming in, we know that the PTY actually wanted to update.
             */
            this._expectedIncomingStyles = 0;
            this.onUpdate(value);
        }
        /**
         * Signals that a style was written to the terminal and we should watch
         * for it coming in.
         */
        expectIncomingStyle(n = 1) {
            this._expectedIncomingStyles += n * 2;
        }
        /**
         * Starts tracking for CSI changes in the terminal.
         */
        startTracking() {
            this._expectedIncomingStyles = 0;
            this._onDidWriteSGR(attributesToArgs(core(this._terminal)._inputHandler._curAttrData));
            this._csiHandler = this._terminal.parser.registerCsiHandler({ final: 'm' }, args => {
                this._onDidWriteSGR(args);
                return false;
            });
        }
        /**
         * Stops tracking terminal CSI changes.
         */
        debounceStopTracking() {
            this._stopTracking();
        }
        /**
         * @inheritdoc
         */
        dispose() {
            this._stopTracking();
        }
        _stopTracking() {
            this._csiHandler?.dispose();
            this._csiHandler = undefined;
        }
        _onDidWriteSGR(args) {
            const originalUndo = this._undoArgs;
            for (let i = 0; i < args.length;) {
                const px = args[i];
                const p = typeof px === 'number' ? px : px[0];
                if (this._expectedIncomingStyles) {
                    if (arrayHasPrefixAt(args, i, this._undoArgs)) {
                        this._expectedIncomingStyles--;
                        i += this._undoArgs.length;
                        continue;
                    }
                    if (arrayHasPrefixAt(args, i, this._applyArgs)) {
                        this._expectedIncomingStyles--;
                        i += this._applyArgs.length;
                        continue;
                    }
                }
                const width = p === 38 || p === 48 || p === 58 ? getColorWidth(args, i) : 1;
                switch (this._applyArgs[0]) {
                    case 1:
                        if (p === 2) {
                            this._undoArgs = [22, 2];
                        }
                        else if (p === 22 || p === 0) {
                            this._undoArgs = [22];
                        }
                        break;
                    case 2:
                        if (p === 1) {
                            this._undoArgs = [22, 1];
                        }
                        else if (p === 22 || p === 0) {
                            this._undoArgs = [22];
                        }
                        break;
                    case 38:
                        if (p === 0 || p === 39 || p === 100) {
                            this._undoArgs = [39];
                        }
                        else if ((p >= 30 && p <= 38) || (p >= 90 && p <= 97)) {
                            this._undoArgs = args.slice(i, i + width);
                        }
                        break;
                    default:
                        if (p === this._applyArgs[0]) {
                            this._undoArgs = this._applyArgs;
                        }
                        else if (p === 0) {
                            this._undoArgs = this._originalUndoArgs;
                        }
                    // no-op
                }
                i += width;
            }
            if (originalUndo !== this._undoArgs) {
                this.undo = TypeAheadStyle._compileArgs(this._undoArgs);
            }
        }
        /**
         * Updates the current typeahead style.
         */
        onUpdate(style) {
            const { applyArgs, undoArgs } = this._getArgs(style);
            this._applyArgs = applyArgs;
            this._undoArgs = this._originalUndoArgs = undoArgs;
            this.apply = TypeAheadStyle._compileArgs(this._applyArgs);
            this.undo = TypeAheadStyle._compileArgs(this._undoArgs);
        }
        _getArgs(style) {
            switch (style) {
                case 'bold':
                    return { applyArgs: [1], undoArgs: [22] };
                case 'dim':
                    return { applyArgs: [2], undoArgs: [22] };
                case 'italic':
                    return { applyArgs: [3], undoArgs: [23] };
                case 'underlined':
                    return { applyArgs: [4], undoArgs: [24] };
                case 'inverted':
                    return { applyArgs: [7], undoArgs: [27] };
                default: {
                    let color;
                    try {
                        color = color_1.Color.fromHex(style);
                    }
                    catch {
                        color = new color_1.Color(new color_1.RGBA(255, 0, 0, 1));
                    }
                    const { r, g, b } = color.rgba;
                    return { applyArgs: [38, 2, r, g, b], undoArgs: [39] };
                }
            }
        }
    }
    __decorate([
        (0, decorators_1.debounce)(2000)
    ], TypeAheadStyle.prototype, "debounceStopTracking", null);
    const compileExcludeRegexp = (programs = terminal_1.DEFAULT_LOCAL_ECHO_EXCLUDE) => new RegExp(`\\b(${programs.map(strings_1.escapeRegExpCharacters).join('|')})\\b`, 'i');
    var CharPredictState;
    (function (CharPredictState) {
        /** No characters typed on this line yet */
        CharPredictState[CharPredictState["Unknown"] = 0] = "Unknown";
        /** Has a pending character prediction */
        CharPredictState[CharPredictState["HasPendingChar"] = 1] = "HasPendingChar";
        /** Character validated on this line */
        CharPredictState[CharPredictState["Validated"] = 2] = "Validated";
    })(CharPredictState || (exports.CharPredictState = CharPredictState = {}));
    let TypeAheadAddon = class TypeAheadAddon extends lifecycle_1.Disposable {
        constructor(_processManager, _configurationService, _telemetryService) {
            super();
            this._processManager = _processManager;
            this._configurationService = _configurationService;
            this._telemetryService = _telemetryService;
            this._typeaheadThreshold = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoLatencyThreshold;
            this._excludeProgramRe = compileExcludeRegexp(this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoExcludePrograms);
            this._terminalTitle = '';
            this._register((0, lifecycle_1.toDisposable)(() => this._clearPredictionDebounce?.dispose()));
        }
        activate(terminal) {
            const style = this._typeaheadStyle = this._register(new TypeAheadStyle(this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoStyle, terminal));
            const timeline = this._timeline = new PredictionTimeline(terminal, this._typeaheadStyle);
            const stats = this.stats = this._register(new PredictionStats(this._timeline));
            timeline.setShowPredictions(this._typeaheadThreshold === 0);
            this._register(terminal.onData(e => this._onUserData(e)));
            this._register(terminal.onTitleChange(title => {
                this._terminalTitle = title;
                this._reevaluatePredictorState(stats, timeline);
            }));
            this._register(terminal.onResize(() => {
                timeline.setShowPredictions(false);
                timeline.clearCursor();
                this._reevaluatePredictorState(stats, timeline);
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(terminal_1.TERMINAL_CONFIG_SECTION)) {
                    style.onUpdate(this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoStyle);
                    this._typeaheadThreshold = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoLatencyThreshold;
                    this._excludeProgramRe = compileExcludeRegexp(this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoExcludePrograms);
                    this._reevaluatePredictorState(stats, timeline);
                }
            }));
            this._register(this._timeline.onPredictionSucceeded(p => {
                if (this._lastRow?.charState === 1 /* CharPredictState.HasPendingChar */ && isTenativeCharacterPrediction(p) && p.inner.appliedAt) {
                    if (p.inner.appliedAt.pos.y + p.inner.appliedAt.pos.baseY === this._lastRow.y) {
                        this._lastRow.charState = 2 /* CharPredictState.Validated */;
                    }
                }
            }));
            this._register(this._processManager.onBeforeProcessData(e => this._onBeforeProcessData(e)));
            let nextStatsSend;
            this._register(stats.onChange(() => {
                if (!nextStatsSend) {
                    nextStatsSend = setTimeout(() => {
                        this._sendLatencyStats(stats);
                        nextStatsSend = undefined;
                    }, 300000 /* StatsConstants.StatsSendTelemetryEvery */);
                }
                if (timeline.length === 0) {
                    style.debounceStopTracking();
                }
                this._reevaluatePredictorState(stats, timeline);
            }));
        }
        reset() {
            this._lastRow = undefined;
        }
        _deferClearingPredictions() {
            if (!this.stats || !this._timeline) {
                return;
            }
            this._clearPredictionDebounce?.dispose();
            if (this._timeline.length === 0 || this._timeline.peekStart()?.clearAfterTimeout === false) {
                this._clearPredictionDebounce = undefined;
                return;
            }
            this._clearPredictionDebounce = (0, async_1.disposableTimeout)(() => {
                this._timeline?.undoAllPredictions();
                if (this._lastRow?.charState === 1 /* CharPredictState.HasPendingChar */) {
                    this._lastRow.charState = 0 /* CharPredictState.Unknown */;
                }
            }, Math.max(500, this.stats.maxLatency * 3 / 2), this._store);
        }
        /**
         * Note on debounce:
         *
         * We want to toggle the state only when the user has a pause in their
         * typing. Otherwise, we could turn this on when the PTY sent data but the
         * terminal cursor is not updated, causes issues.
         */
        _reevaluatePredictorState(stats, timeline) {
            this._reevaluatePredictorStateNow(stats, timeline);
        }
        _reevaluatePredictorStateNow(stats, timeline) {
            if (this._excludeProgramRe.test(this._terminalTitle)) {
                timeline.setShowPredictions(false);
            }
            else if (this._typeaheadThreshold < 0) {
                timeline.setShowPredictions(false);
            }
            else if (this._typeaheadThreshold === 0) {
                timeline.setShowPredictions(true);
            }
            else if (stats.sampleSize > 5 /* StatsConstants.StatsMinSamplesToTurnOn */ && stats.accuracy > 0.3 /* StatsConstants.StatsMinAccuracyToTurnOn */) {
                const latency = stats.latency.median;
                if (latency >= this._typeaheadThreshold) {
                    timeline.setShowPredictions(true);
                }
                else if (latency < this._typeaheadThreshold / 0.5 /* StatsConstants.StatsToggleOffThreshold */) {
                    timeline.setShowPredictions(false);
                }
            }
        }
        _sendLatencyStats(stats) {
            /* __GDPR__
                "terminalLatencyStats" : {
                    "owner": "Tyriar",
                    "min" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "max" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "median" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "count" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "predictionAccuracy" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                }
             */
            this._telemetryService.publicLog('terminalLatencyStats', {
                ...stats.latency,
                predictionAccuracy: stats.accuracy,
            });
        }
        _onUserData(data) {
            if (this._timeline?.terminal.buffer.active.type !== 'normal') {
                return;
            }
            // console.log('user data:', JSON.stringify(data));
            const terminal = this._timeline.terminal;
            const buffer = terminal.buffer.active;
            // Detect programs like git log/less that use the normal buffer but don't
            // take input by deafult (fixes #109541)
            if (buffer.cursorX === 1 && buffer.cursorY === terminal.rows - 1) {
                if (buffer.getLine(buffer.cursorY + buffer.baseY)?.getCell(0)?.getChars() === ':') {
                    return;
                }
            }
            // the following code guards the terminal prompt to avoid being able to
            // arrow or backspace-into the prompt. Record the lowest X value at which
            // the user gave input, and mark all additions before that as tentative.
            const actualY = buffer.baseY + buffer.cursorY;
            if (actualY !== this._lastRow?.y) {
                this._lastRow = { y: actualY, startingX: buffer.cursorX, endingX: buffer.cursorX, charState: 0 /* CharPredictState.Unknown */ };
            }
            else {
                this._lastRow.startingX = Math.min(this._lastRow.startingX, buffer.cursorX);
                this._lastRow.endingX = Math.max(this._lastRow.endingX, this._timeline.physicalCursor(buffer).x);
            }
            const addLeftNavigating = (p) => this._timeline.tentativeCursor(buffer).x <= this._lastRow.startingX
                ? this._timeline.addBoundary(buffer, p)
                : this._timeline.addPrediction(buffer, p);
            const addRightNavigating = (p) => this._timeline.tentativeCursor(buffer).x >= this._lastRow.endingX - 1
                ? this._timeline.addBoundary(buffer, p)
                : this._timeline.addPrediction(buffer, p);
            /** @see https://github.com/xtermjs/xterm.js/blob/1913e9512c048e3cf56bb5f5df51bfff6899c184/src/common/input/Keyboard.ts */
            const reader = new StringReader(data);
            while (reader.remaining > 0) {
                if (reader.eatCharCode(127)) { // backspace
                    const previous = this._timeline.peekEnd();
                    if (previous && previous instanceof CharacterPrediction) {
                        this._timeline.addBoundary();
                    }
                    // backspace must be able to read the previously-written character in
                    // the event that it needs to undo it
                    if (this._timeline.isShowingPredictions) {
                        flushOutput(this._timeline.terminal);
                    }
                    if (this._timeline.tentativeCursor(buffer).x <= this._lastRow.startingX) {
                        this._timeline.addBoundary(buffer, new BackspacePrediction(this._timeline.terminal));
                    }
                    else {
                        // Backspace decrements our ability to go right.
                        this._lastRow.endingX--;
                        this._timeline.addPrediction(buffer, new BackspacePrediction(this._timeline.terminal));
                    }
                    continue;
                }
                if (reader.eatCharCode(32, 126)) { // alphanum
                    const char = data[reader.index - 1];
                    const prediction = new CharacterPrediction(this._typeaheadStyle, char);
                    if (this._lastRow.charState === 0 /* CharPredictState.Unknown */) {
                        this._timeline.addBoundary(buffer, prediction);
                        this._lastRow.charState = 1 /* CharPredictState.HasPendingChar */;
                    }
                    else {
                        this._timeline.addPrediction(buffer, prediction);
                    }
                    if (this._timeline.tentativeCursor(buffer).x >= terminal.cols) {
                        this._timeline.addBoundary(buffer, new LinewrapPrediction());
                    }
                    continue;
                }
                const cursorMv = reader.eatRe(CSI_MOVE_RE);
                if (cursorMv) {
                    const direction = cursorMv[3];
                    const p = new CursorMovePrediction(direction, !!cursorMv[2], Number(cursorMv[1]) || 1);
                    if (direction === "D" /* CursorMoveDirection.Back */) {
                        addLeftNavigating(p);
                    }
                    else {
                        addRightNavigating(p);
                    }
                    continue;
                }
                if (reader.eatStr(`${"\u001B" /* VT.Esc */}f`)) {
                    addRightNavigating(new CursorMovePrediction("C" /* CursorMoveDirection.Forwards */, true, 1));
                    continue;
                }
                if (reader.eatStr(`${"\u001B" /* VT.Esc */}b`)) {
                    addLeftNavigating(new CursorMovePrediction("D" /* CursorMoveDirection.Back */, true, 1));
                    continue;
                }
                if (reader.eatChar('\r') && buffer.cursorY < terminal.rows - 1) {
                    this._timeline.addPrediction(buffer, new NewlinePrediction());
                    continue;
                }
                // something else
                this._timeline.addBoundary(buffer, new HardBoundary());
                break;
            }
            if (this._timeline.length === 1) {
                this._deferClearingPredictions();
                this._typeaheadStyle.startTracking();
            }
        }
        _onBeforeProcessData(event) {
            if (!this._timeline) {
                return;
            }
            // console.log('incoming data:', JSON.stringify(event.data));
            event.data = this._timeline.beforeServerInput(event.data);
            // console.log('emitted data:', JSON.stringify(event.data));
            this._deferClearingPredictions();
        }
    };
    exports.TypeAheadAddon = TypeAheadAddon;
    __decorate([
        (0, decorators_1.debounce)(100)
    ], TypeAheadAddon.prototype, "_reevaluatePredictorState", null);
    exports.TypeAheadAddon = TypeAheadAddon = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, telemetry_1.ITelemetryService)
    ], TypeAheadAddon);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUeXBlQWhlYWRBZGRvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi90eXBlQWhlYWQvYnJvd3Nlci90ZXJtaW5hbFR5cGVBaGVhZEFkZG9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNoRyxJQUFXLEVBT1Y7SUFQRCxXQUFXLEVBQUU7UUFDWixvQkFBWSxDQUFBO1FBQ1oscUJBQWEsQ0FBQTtRQUNiLGdDQUF3QixDQUFBO1FBQ3hCLGdDQUF3QixDQUFBO1FBQ3hCLDZCQUFxQixDQUFBO1FBQ3JCLG1DQUEyQixDQUFBO0lBQzVCLENBQUMsRUFQVSxFQUFFLEtBQUYsRUFBRSxRQU9aO0lBRUQsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUM7SUFDdkMsTUFBTSxXQUFXLEdBQUcsa0NBQWtDLENBQUM7SUFDdkQsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0lBRWpDLElBQVcsY0FNVjtJQU5ELFdBQVcsY0FBYztRQUN4QiwwRUFBb0IsQ0FBQTtRQUNwQiw4RkFBdUMsQ0FBQTtRQUN2Qyx5RkFBMkIsQ0FBQTtRQUMzQiw2RkFBOEIsQ0FBQTtRQUM5QiwyRkFBNkIsQ0FBQTtJQUM5QixDQUFDLEVBTlUsY0FBYyxLQUFkLGNBQWMsUUFNeEI7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsTUFBTSxrQkFBa0IsR0FBRyxtQ0FBbUMsQ0FBQztJQUUvRCxNQUFNLElBQUksR0FBRyxDQUFDLFFBQWtCLEVBQWMsRUFBRSxDQUFFLFFBQWdCLENBQUMsS0FBSyxDQUFDO0lBQ3pFLE1BQU0sV0FBVyxHQUFHLENBQUMsUUFBa0IsRUFBRSxFQUFFO1FBQzFDLDhEQUE4RDtJQUMvRCxDQUFDLENBQUM7SUFFRixJQUFXLG1CQUdW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QUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDO1FBQ25DLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7WUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQztRQUN0QyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1lBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUM7UUFDekMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztZQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDO1FBQ3JDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUM7WUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQztRQUN2QyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1lBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUM7UUFFekMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztZQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFBQyxDQUFDO1FBQ2hJLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7WUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFBQyxDQUFDO1FBQ2hFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7WUFB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