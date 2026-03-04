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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/decorators"], function (require, exports, event_1, lifecycle_1, log_1, decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PromptInputModel = void 0;
    var PromptInputState;
    (function (PromptInputState) {
        PromptInputState[PromptInputState["Unknown"] = 0] = "Unknown";
        PromptInputState[PromptInputState["Input"] = 1] = "Input";
        PromptInputState[PromptInputState["Execute"] = 2] = "Execute";
    })(PromptInputState || (PromptInputState = {}));
    let PromptInputModel = class PromptInputModel extends lifecycle_1.Disposable {
        get value() { return this._value; }
        get cursorIndex() { return this._cursorIndex; }
        get ghostTextIndex() { return this._ghostTextIndex; }
        constructor(_xterm, onCommandStart, onCommandExecuted, _logService) {
            super();
            this._xterm = _xterm;
            this._logService = _logService;
            this._state = 0 /* PromptInputState.Unknown */;
            this._commandStartX = 0;
            this._lastUserInput = '';
            this._value = '';
            this._cursorIndex = 0;
            this._ghostTextIndex = -1;
            this._onDidStartInput = this._register(new event_1.Emitter());
            this.onDidStartInput = this._onDidStartInput.event;
            this._onDidChangeInput = this._register(new event_1.Emitter());
            this.onDidChangeInput = this._onDidChangeInput.event;
            this._onDidFinishInput = this._register(new event_1.Emitter());
            this.onDidFinishInput = this._onDidFinishInput.event;
            this._onDidInterrupt = this._register(new event_1.Emitter());
            this.onDidInterrupt = this._onDidInterrupt.event;
            this._register(event_1.Event.any(this._xterm.onCursorMove, this._xterm.onData, this._xterm.onWriteParsed)(() => this._sync()));
            this._register(this._xterm.onData(e => this._handleUserInput(e)));
            this._register(onCommandStart(e => this._handleCommandStart(e)));
            this._register(onCommandExecuted(() => this._handleCommandExecuted()));
            this._register(this.onDidStartInput(() => this._logCombinedStringIfTrace('PromptInputModel#onDidStartInput')));
            this._register(this.onDidChangeInput(() => this._logCombinedStringIfTrace('PromptInputModel#onDidChangeInput')));
            this._register(this.onDidFinishInput(() => this._logCombinedStringIfTrace('PromptInputModel#onDidFinishInput')));
            this._register(this.onDidInterrupt(() => this._logCombinedStringIfTrace('PromptInputModel#onDidInterrupt')));
        }
        _logCombinedStringIfTrace(message) {
            // Only generate the combined string if trace
            if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                this._logService.trace(message, this.getCombinedString());
            }
        }
        setContinuationPrompt(value) {
            this._continuationPrompt = value;
        }
        setConfidentCommandLine(value) {
            if (this._value !== value) {
                this._value = value;
                this._cursorIndex = -1;
                this._ghostTextIndex = -1;
                this._onDidChangeInput.fire(this._createStateObject());
            }
        }
        getCombinedString() {
            const value = this._value.replaceAll('\n', '\u23CE');
            if (this._cursorIndex === -1) {
                return value;
            }
            let result = `${value.substring(0, this.cursorIndex)}|`;
            if (this.ghostTextIndex !== -1) {
                result += `${value.substring(this.cursorIndex, this.ghostTextIndex)}[`;
                result += `${value.substring(this.ghostTextIndex)}]`;
            }
            else {
                result += value.substring(this.cursorIndex);
            }
            return result;
        }
        _handleCommandStart(command) {
            if (this._state === 1 /* PromptInputState.Input */) {
                return;
            }
            this._state = 1 /* PromptInputState.Input */;
            this._commandStartMarker = command.marker;
            this._commandStartX = this._xterm.buffer.active.cursorX;
            this._value = '';
            this._cursorIndex = 0;
            this._onDidStartInput.fire(this._createStateObject());
            this._onDidChangeInput.fire(this._createStateObject());
        }
        _handleCommandExecuted() {
            if (this._state === 2 /* PromptInputState.Execute */) {
                return;
            }
            this._cursorIndex = -1;
            // Remove any ghost text from the input if it exists on execute
            if (this._ghostTextIndex !== -1) {
                this._value = this._value.substring(0, this._ghostTextIndex);
                this._ghostTextIndex = -1;
            }
            const event = this._createStateObject();
            if (this._lastUserInput === '\u0003') {
                this._onDidInterrupt.fire(event);
            }
            this._state = 2 /* PromptInputState.Execute */;
            this._onDidFinishInput.fire(event);
            this._onDidChangeInput.fire(event);
        }
        _sync() {
            if (this._state !== 1 /* PromptInputState.Input */) {
                return;
            }
            const commandStartY = this._commandStartMarker?.line;
            if (commandStartY === undefined) {
                return;
            }
            const buffer = this._xterm.buffer.active;
            let line = buffer.getLine(commandStartY);
            const commandLine = line?.translateToString(true, this._commandStartX);
            if (!line || commandLine === undefined) {
                this._logService.trace(`PromptInputModel#_sync: no line`);
                return;
            }
            const absoluteCursorY = buffer.baseY + buffer.cursorY;
            let value = commandLine;
            let cursorIndex = absoluteCursorY === commandStartY ? this._getRelativeCursorIndex(this._commandStartX, buffer, line) : commandLine.length + 1;
            let ghostTextIndex = -1;
            // Detect ghost text by looking for italic or dim text in or after the cursor and
            // non-italic/dim text in the cell closest non-whitespace cell before the cursor
            if (absoluteCursorY === commandStartY && buffer.cursorX > 1) {
                // Ghost text in pwsh only appears to happen on the cursor line
                ghostTextIndex = this._scanForGhostText(buffer, line, cursorIndex);
            }
            // IDEA: Detect line continuation if it's not set
            // From command start line to cursor line
            for (let y = commandStartY + 1; y <= absoluteCursorY; y++) {
                line = buffer.getLine(y);
                let lineText = line?.translateToString(true);
                if (lineText && line) {
                    // Verify continuation prompt if we have it, if this line doesn't have it then the
                    // user likely just pressed enter
                    if (this._continuationPrompt === undefined || this._lineContainsContinuationPrompt(lineText)) {
                        lineText = this._trimContinuationPrompt(lineText);
                        value += `\n${lineText}`;
                        cursorIndex += (absoluteCursorY === y
                            ? this._getRelativeCursorIndex(this._getContinuationPromptCellWidth(line, lineText), buffer, line)
                            : lineText.length + 1);
                    }
                    else {
                        break;
                    }
                }
            }
            // Below cursor line
            for (let y = absoluteCursorY + 1; y < buffer.baseY + this._xterm.rows; y++) {
                line = buffer.getLine(y);
                const lineText = line?.translateToString(true);
                if (lineText && line) {
                    if (this._continuationPrompt === undefined || this._lineContainsContinuationPrompt(lineText)) {
                        value += `\n${this._trimContinuationPrompt(lineText)}`;
                    }
                    else {
                        break;
                    }
                }
                else {
                    break;
                }
            }
            if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                this._logService.trace(`PromptInputModel#_sync: ${this.getCombinedString()}`);
            }
            if (this._value !== value || this._cursorIndex !== cursorIndex || this._ghostTextIndex !== ghostTextIndex) {
                this._value = value;
                this._cursorIndex = cursorIndex;
                this._ghostTextIndex = ghostTextIndex;
                this._onDidChangeInput.fire(this._createStateObject());
            }
        }
        _handleUserInput(e) {
            this._lastUserInput = e;
        }
        /**
         * Detect ghost text by looking for italic or dim text in or after the cursor and
         * non-italic/dim text in the cell closest non-whitespace cell before the cursor.
         */
        _scanForGhostText(buffer, line, cursorIndex) {
            // Check last non-whitespace character has non-ghost text styles
            let ghostTextIndex = -1;
            let proceedWithGhostTextCheck = false;
            let x = buffer.cursorX;
            while (x > 0) {
                const cell = line.getCell(--x);
                if (!cell) {
                    break;
                }
                if (cell.getChars().trim().length > 0) {
                    proceedWithGhostTextCheck = !this._isCellStyledLikeGhostText(cell);
                    break;
                }
            }
            // Check to the end of the line for possible ghost text. For example pwsh's ghost text
            // can look like this `Get-|Ch[ildItem]`
            if (proceedWithGhostTextCheck) {
                let potentialGhostIndexOffset = 0;
                let x = buffer.cursorX;
                while (x < line.length) {
                    const cell = line.getCell(x++);
                    if (!cell || cell.getCode() === 0) {
                        break;
                    }
                    if (this._isCellStyledLikeGhostText(cell)) {
                        ghostTextIndex = cursorIndex + potentialGhostIndexOffset;
                        break;
                    }
                    potentialGhostIndexOffset += cell.getChars().length;
                }
            }
            return ghostTextIndex;
        }
        _trimContinuationPrompt(lineText) {
            if (this._lineContainsContinuationPrompt(lineText)) {
                lineText = lineText.substring(this._continuationPrompt.length);
            }
            return lineText;
        }
        _lineContainsContinuationPrompt(lineText) {
            return !!(this._continuationPrompt && lineText.startsWith(this._continuationPrompt));
        }
        _getContinuationPromptCellWidth(line, lineText) {
            if (!this._continuationPrompt || !lineText.startsWith(this._continuationPrompt)) {
                return 0;
            }
            let buffer = '';
            let x = 0;
            while (buffer !== this._continuationPrompt) {
                buffer += line.getCell(x++).getChars();
            }
            return x;
        }
        _getRelativeCursorIndex(startCellX, buffer, line) {
            return line?.translateToString(true, startCellX, buffer.cursorX).length ?? 0;
        }
        _isCellStyledLikeGhostText(cell) {
            return !!(cell.isItalic() || cell.isDim());
        }
        _createStateObject() {
            return Object.freeze({
                value: this._value,
                cursorIndex: this._cursorIndex,
                ghostTextIndex: this._ghostTextIndex
            });
        }
    };
    exports.PromptInputModel = PromptInputModel;
    __decorate([
        (0, decorators_1.throttle)(0)
    ], PromptInputModel.prototype, "_sync", null);
    exports.PromptInputModel = PromptInputModel = __decorate([
        __param(3, log_1.ILogService)
    ], PromptInputModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbXB0SW5wdXRNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL2NvbW1vbi9jYXBhYmlsaXRpZXMvY29tbWFuZERldGVjdGlvbi9wcm9tcHRJbnB1dE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVloRyxJQUFXLGdCQUlWO0lBSkQsV0FBVyxnQkFBZ0I7UUFDMUIsNkRBQVcsQ0FBQTtRQUNYLHlEQUFTLENBQUE7UUFDVCw2REFBVyxDQUFBO0lBQ1osQ0FBQyxFQUpVLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFJMUI7SUFnQ00sSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSxzQkFBVTtRQVUvQyxJQUFJLEtBQUssS0FBSyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBR25DLElBQUksV0FBVyxLQUFLLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFHL0MsSUFBSSxjQUFjLEtBQUssT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQVdyRCxZQUNrQixNQUFnQixFQUNqQyxjQUF1QyxFQUN2QyxpQkFBMEMsRUFDN0IsV0FBeUM7WUFFdEQsS0FBSyxFQUFFLENBQUM7WUFMUyxXQUFNLEdBQU4sTUFBTSxDQUFVO1lBR0gsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUE5Qi9DLFdBQU0sb0NBQThDO1lBR3BELG1CQUFjLEdBQVcsQ0FBQyxDQUFDO1lBRzNCLG1CQUFjLEdBQVcsRUFBRSxDQUFDO1lBRTVCLFdBQU0sR0FBVyxFQUFFLENBQUM7WUFHcEIsaUJBQVksR0FBVyxDQUFDLENBQUM7WUFHekIsb0JBQWUsR0FBVyxDQUFDLENBQUMsQ0FBQztZQUdwQixxQkFBZ0IsR0FB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