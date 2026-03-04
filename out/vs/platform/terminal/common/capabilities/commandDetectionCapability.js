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
define(["require", "exports", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/platform/terminal/common/capabilities/commandDetection/terminalCommand", "vs/platform/terminal/common/capabilities/commandDetection/promptInputModel"], function (require, exports, async_1, decorators_1, event_1, lifecycle_1, log_1, terminalCommand_1, promptInputModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandDetectionCapability = void 0;
    exports.getLinesForCommand = getLinesForCommand;
    let CommandDetectionCapability = class CommandDetectionCapability extends lifecycle_1.Disposable {
        get promptInputModel() { return this._promptInputModel; }
        get commands() { return this._commands; }
        get executingCommand() { return this._currentCommand.command; }
        // TODO: as is unsafe here and it duplicates behavor of executingCommand
        get executingCommandObject() {
            if (this._currentCommand.commandStartMarker) {
                return { marker: this._currentCommand.commandStartMarker };
            }
            return undefined;
        }
        get currentCommand() {
            return this._currentCommand;
        }
        get cwd() { return this._cwd; }
        get _isInputting() {
            return !!(this._currentCommand.commandStartMarker && !this._currentCommand.commandExecutedMarker);
        }
        get hasInput() {
            if (!this._isInputting || !this._currentCommand?.commandStartMarker) {
                return undefined;
            }
            if (this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY === this._currentCommand.commandStartMarker?.line) {
                const line = this._terminal.buffer.active.getLine(this._terminal.buffer.active.cursorY)?.translateToString(true, this._currentCommand.commandStartX);
                if (line === undefined) {
                    return undefined;
                }
                return line.length > 0;
            }
            return true;
        }
        constructor(_terminal, _logService) {
            super();
            this._terminal = _terminal;
            this._logService = _logService;
            this.type = 2 /* TerminalCapability.CommandDetection */;
            this._commands = [];
            this._currentCommand = new terminalCommand_1.PartialTerminalCommand(this._terminal);
            this._commandMarkers = [];
            this.__isCommandStorageDisabled = false;
            this._onCommandStarted = this._register(new event_1.Emitter());
            this.onCommandStarted = this._onCommandStarted.event;
            this._onBeforeCommandFinished = this._register(new event_1.Emitter());
            this.onBeforeCommandFinished = this._onBeforeCommandFinished.event;
            this._onCommandFinished = this._register(new event_1.Emitter());
            this.onCommandFinished = this._onCommandFinished.event;
            this._onCommandExecuted = this._register(new event_1.Emitter());
            this.onCommandExecuted = this._onCommandExecuted.event;
            this._onCommandInvalidated = this._register(new event_1.Emitter());
            this.onCommandInvalidated = this._onCommandInvalidated.event;
            this._onCurrentCommandInvalidated = this._register(new event_1.Emitter());
            this.onCurrentCommandInvalidated = this._onCurrentCommandInvalidated.event;
            this._promptInputModel = this._register(new promptInputModel_1.PromptInputModel(this._terminal, this.onCommandStarted, this.onCommandExecuted, this._logService));
            // Pull command line from the buffer if it was not set explicitly
            this._register(this.onCommandExecuted(command => {
                if (command.commandLineConfidence !== 'high') {
                    // HACK: onCommandExecuted actually fired with PartialTerminalCommand
                    const typedCommand = command;
                    command.command = typedCommand.extractCommandLine();
                    command.commandLineConfidence = 'low';
                    // ITerminalCommand
                    if ('getOutput' in typedCommand) {
                        if (
                        // Markers exist
                        typedCommand.promptStartMarker && typedCommand.marker && typedCommand.executedMarker &&
                            // Single line command
                            command.command.indexOf('\n') === -1 &&
                            // Start marker is not on the left-most column
                            typedCommand.startX !== undefined && typedCommand.startX > 0) {
                            command.commandLineConfidence = 'medium';
                        }
                    }
                    // PartialTerminalCommand
                    else {
                        if (
                        // Markers exist
                        typedCommand.promptStartMarker && typedCommand.commandStartMarker && typedCommand.commandExecutedMarker &&
                            // Single line command
                            command.command.indexOf('\n') === -1 &&
                            // Start marker is not on the left-most column
                            typedCommand.commandStartX !== undefined && typedCommand.commandStartX > 0) {
                            command.commandLineConfidence = 'medium';
                        }
                    }
                }
            }));
            // Set up platform-specific behaviors
            const that = this;
            this._ptyHeuristicsHooks = new class {
                get onCurrentCommandInvalidatedEmitter() { return that._onCurrentCommandInvalidated; }
                get onCommandStartedEmitter() { return that._onCommandStarted; }
                get onCommandExecutedEmitter() { return that._onCommandExecuted; }
                get dimensions() { return that._dimensions; }
                get isCommandStorageDisabled() { return that.__isCommandStorageDisabled; }
                get commandMarkers() { return that._commandMarkers; }
                set commandMarkers(value) { that._commandMarkers = value; }
                get clearCommandsInViewport() { return that._clearCommandsInViewport.bind(that); }
                commitCommandFinished() {
                    that._commitCommandFinished?.flush();
                    that._commitCommandFinished = undefined;
                }
            };
            this._ptyHeuristics = this._register(new lifecycle_1.MandatoryMutableDisposable(new UnixPtyHeuristics(this._terminal, this, this._ptyHeuristicsHooks, this._logService)));
            this._dimensions = {
                cols: this._terminal.cols,
                rows: this._terminal.rows
            };
            this._register(this._terminal.onResize(e => this._handleResize(e)));
            this._register(this._terminal.onCursorMove(() => this._handleCursorMove()));
        }
        _handleResize(e) {
            this._ptyHeuristics.value.preHandleResize?.(e);
            this._dimensions.cols = e.cols;
            this._dimensions.rows = e.rows;
        }
        _handleCursorMove() {
            // Early versions of conpty do not have real support for an alt buffer, in addition certain
            // commands such as tsc watch will write to the top of the normal buffer. The following
            // checks when the cursor has moved while the normal buffer is empty and if it is above the
            // current command, all decorations within the viewport will be invalidated.
            //
            // This function is debounced so that the cursor is only checked when it is stable so
            // conpty's screen reprinting will not trigger decoration clearing.
            //
            // This is mostly a workaround for Windows but applies to all OS' because of the tsc watch
            // case.
            if (this._terminal.buffer.active === this._terminal.buffer.normal && this._currentCommand.commandStartMarker) {
                if (this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY < this._currentCommand.commandStartMarker.line) {
                    this._clearCommandsInViewport();
                    this._currentCommand.isInvalid = true;
                    this._onCurrentCommandInvalidated.fire({ reason: "windows" /* CommandInvalidationReason.Windows */ });
                }
            }
        }
        _clearCommandsInViewport() {
            // Find the number of commands on the tail end of the array that are within the viewport
            let count = 0;
            for (let i = this._commands.length - 1; i >= 0; i--) {
                const line = this._commands[i].marker?.line;
                if (line && line < this._terminal.buffer.active.baseY) {
                    break;
                }
                count++;
            }
            // Remove them
            if (count > 0) {
                this._onCommandInvalidated.fire(this._commands.splice(this._commands.length - count, count));
            }
        }
        setContinuationPrompt(value) {
            this._promptInputModel.setContinuationPrompt(value);
        }
        setCwd(value) {
            this._cwd = value;
        }
        setIsWindowsPty(value) {
            if (value && !(this._ptyHeuristics.value instanceof WindowsPtyHeuristics)) {
                const that = this;
                this._ptyHeuristics.value = new WindowsPtyHeuristics(this._terminal, this, new class {
                    get onCurrentCommandInvalidatedEmitter() { return that._onCurrentCommandInvalidated; }
                    get onCommandStartedEmitter() { return that._onCommandStarted; }
                    get onCommandExecutedEmitter() { return that._onCommandExecuted; }
                    get dimensions() { return that._dimensions; }
                    get isCommandStorageDisabled() { return that.__isCommandStorageDisabled; }
                    get commandMarkers() { return that._commandMarkers; }
                    set commandMarkers(value) { that._commandMarkers = value; }
                    get clearCommandsInViewport() { return that._clearCommandsInViewport.bind(that); }
                    commitCommandFinished() {
                        that._commitCommandFinished?.flush();
                        that._commitCommandFinished = undefined;
                    }
                }, this._logService);
            }
            else if (!value && !(this._ptyHeuristics.value instanceof UnixPtyHeuristics)) {
                this._ptyHeuristics.value = new UnixPtyHeuristics(this._terminal, this, this._ptyHeuristicsHooks, this._logService);
            }
        }
        setIsCommandStorageDisabled() {
            this.__isCommandStorageDisabled = true;
        }
        getCommandForLine(line) {
            // Handle the current partial command first, anything below it's prompt is considered part
            // of the current command
            if (this._currentCommand.promptStartMarker && line >= this._currentCommand.promptStartMarker?.line) {
                return this._currentCommand;
            }
            // No commands
            if (this._commands.length === 0) {
                return undefined;
            }
            // Line is before any registered commands
            if ((this._commands[0].promptStartMarker ?? this._commands[0].marker).line > line) {
                return undefined;
            }
            // Iterate backwards through commands to find the right one
            for (let i = this.commands.length - 1; i >= 0; i--) {
                if ((this.commands[i].promptStartMarker ?? this.commands[i].marker).line <= line) {
                    return this.commands[i];
                }
            }
            return undefined;
        }
        getCwdForLine(line) {
            // Handle the current partial command first, anything below it's prompt is considered part
            // of the current command
            if (this._currentCommand.promptStartMarker && line >= this._currentCommand.promptStartMarker?.line) {
                return this._cwd;
            }
            const command = this.getCommandForLine(line);
            if (command && 'cwd' in command) {
                return command.cwd;
            }
            return undefined;
        }
        handlePromptStart(options) {
            // Adjust the last command's finished marker when needed. The standard position for the
            // finished marker `D` to appear is at the same position as the following prompt started
            // `A`.
            const lastCommand = this.commands.at(-1);
            if (lastCommand?.endMarker && lastCommand?.executedMarker && lastCommand.endMarker.line === lastCommand.executedMarker.line) {
                this._logService.debug('CommandDetectionCapability#handlePromptStart adjusted commandFinished', `${lastCommand.endMarker.line} -> ${lastCommand.executedMarker.line + 1}`);
                lastCommand.endMarker = cloneMarker(this._terminal, lastCommand.executedMarker, 1);
            }
            this._currentCommand.promptStartMarker = options?.marker || (lastCommand?.endMarker ? cloneMarker(this._terminal, lastCommand.endMarker) : this._terminal.registerMarker(0));
            this._logService.debug('CommandDetectionCapability#handlePromptStart', this._terminal.buffer.active.cursorX, this._currentCommand.promptStartMarker?.line);
        }
        handleContinuationStart() {
            this._currentCommand.currentContinuationMarker = this._terminal.registerMarker(0);
            this._logService.debug('CommandDetectionCapability#handleContinuationStart', this._currentCommand.currentContinuationMarker);
        }
        handleContinuationEnd() {
            if (!this._currentCommand.currentContinuationMarker) {
                this._logService.warn('CommandDetectionCapability#handleContinuationEnd Received continuation end without start');
                return;
            }
            if (!this._currentCommand.continuations) {
                this._currentCommand.continuations = [];
            }
            this._currentCommand.continuations.push({
                marker: this._currentCommand.currentContinuationMarker,
                end: this._terminal.buffer.active.cursorX
            });
            this._currentCommand.currentContinuationMarker = undefined;
            this._logService.debug('CommandDetectionCapability#handleContinuationEnd', this._currentCommand.continuations[this._currentCommand.continuations.length - 1]);
        }
        handleRightPromptStart() {
            this._currentCommand.commandRightPromptStartX = this._terminal.buffer.active.cursorX;
            this._logService.debug('CommandDetectionCapability#handleRightPromptStart', this._currentCommand.commandRightPromptStartX);
        }
        handleRightPromptEnd() {
            this._currentCommand.commandRightPromptEndX = this._terminal.buffer.active.cursorX;
            this._logService.debug('CommandDetectionCapability#handleRightPromptEnd', this._currentCommand.commandRightPromptEndX);
        }
        handleCommandStart(options) {
            this._handleCommandStartOptions = options;
            this._currentCommand.cwd = this._cwd;
            // Only update the column if the line has already been set
            this._currentCommand.commandStartMarker = options?.marker || this._currentCommand.commandStartMarker;
            if (this._currentCommand.commandStartMarker?.line === this._terminal.buffer.active.cursorY) {
                this._currentCommand.commandStartX = this._terminal.buffer.active.cursorX;
                this._logService.debug('CommandDetectionCapability#handleCommandStart', this._currentCommand.commandStartX, this._currentCommand.commandStartMarker?.line);
                return;
            }
            this._ptyHeuristics.value.handleCommandStart(options);
        }
        handleGenericCommand(options) {
            if (options?.markProperties?.disableCommandStorage) {
                this.setIsCommandStorageDisabled();
            }
            this.handlePromptStart(options);
            this.handleCommandStart(options);
            this.handleCommandExecuted(options);
            this.handleCommandFinished(undefined, options);
        }
        handleCommandExecuted(options) {
            this._ptyHeuristics.value.handleCommandExecuted(options);
            this._currentCommand.markExecutedTime();
        }
        handleCommandFinished(exitCode, options) {
            this._currentCommand.markFinishedTime();
            this._ptyHeuristics.value.preHandleCommandFinished?.();
            this._logService.debug('CommandDetectionCapability#handleCommandFinished', this._terminal.buffer.active.cursorX, options?.marker?.line, this._currentCommand.command, this._currentCommand);
            // HACK: Handle a special case on some versions of bash where identical commands get merged
            // in the output of `history`, this detects that case and sets the exit code to the the last
            // command's exit code. This covered the majority of cases but will fail if the same command
            // runs with a different exit code, that will need a more robust fix where we send the
            // command ID and exit code over to the capability to adjust there.
            if (exitCode === undefined) {
                const lastCommand = this.commands.length > 0 ? this.commands[this.commands.length - 1] : undefined;
                if (this._currentCommand.command && this._currentCommand.command.length > 0 && lastCommand?.command === this._currentCommand.command) {
                    exitCode = lastCommand.exitCode;
                }
            }
            if (this._currentCommand.commandStartMarker === undefined || !this._terminal.buffer.active) {
                return;
            }
            this._currentCommand.commandFinishedMarker = options?.marker || this._terminal.registerMarker(0);
            this._ptyHeuristics.value.postHandleCommandFinished?.();
            const newCommand = this._currentCommand.promoteToFullCommand(this._cwd, exitCode, this._handleCommandStartOptions?.ignoreCommandLine ?? false, options?.markProperties);
            if (newCommand) {
                this._commands.push(newCommand);
                this._commitCommandFinished = new async_1.RunOnceScheduler(() => {
                    this._onBeforeCommandFinished.fire(newCommand);
                    if (!this._currentCommand.isInvalid) {
                        this._logService.debug('CommandDetectionCapability#onCommandFinished', newCommand);
                        this._onCommandFinished.fire(newCommand);
                    }
                }, 50);
                this._commitCommandFinished.schedule();
            }
            this._currentCommand = new terminalCommand_1.PartialTerminalCommand(this._terminal);
            this._handleCommandStartOptions = undefined;
        }
        setCommandLine(commandLine, isTrusted) {
            this._logService.debug('CommandDetectionCapability#setCommandLine', commandLine, isTrusted);
            this._currentCommand.command = commandLine;
            this._currentCommand.commandLineConfidence = 'high';
            this._currentCommand.isTrusted = isTrusted;
            if (isTrusted) {
                this._promptInputModel.setConfidentCommandLine(commandLine);
            }
        }
        serialize() {
            const commands = this.commands.map(e => e.serialize(this.__isCommandStorageDisabled));
            const partialCommand = this._currentCommand.serialize(this._cwd);
            if (partialCommand) {
                commands.push(partialCommand);
            }
            return {
                isWindowsPty: this._ptyHeuristics.value instanceof WindowsPtyHeuristics,
                commands
            };
        }
        deserialize(serialized) {
            if (serialized.isWindowsPty) {
                this.setIsWindowsPty(serialized.isWindowsPty);
            }
            const buffer = this._terminal.buffer.normal;
            for (const e of serialized.commands) {
                // Partial command
                if (!e.endLine) {
                    // Check for invalid command
                    const marker = e.startLine !== undefined ? this._terminal.registerMarker(e.startLine - (buffer.baseY + buffer.cursorY)) : undefined;
                    if (!marker) {
                        continue;
                    }
                    this._currentCommand.commandStartMarker = e.startLine !== undefined ? this._terminal.registerMarker(e.startLine - (buffer.baseY + buffer.cursorY)) : undefined;
                    this._currentCommand.commandStartX = e.startX;
                    this._currentCommand.promptStartMarker = e.promptStartLine !== undefined ? this._terminal.registerMarker(e.promptStartLine - (buffer.baseY + buffer.cursorY)) : undefined;
                    this._cwd = e.cwd;
                    this._onCommandStarted.fire({ marker });
                    continue;
                }
                // Full command
                const newCommand = terminalCommand_1.TerminalCommand.deserialize(this._terminal, e, this.__isCommandStorageDisabled);
                if (!newCommand) {
                    continue;
                }
                this._commands.push(newCommand);
                this._logService.debug('CommandDetectionCapability#onCommandFinished', newCommand);
                this._onCommandFinished.fire(newCommand);
            }
        }
    };
    exports.CommandDetectionCapability = CommandDetectionCapability;
    __decorate([
        (0, decorators_1.debounce)(500)
    ], CommandDetectionCapability.prototype, "_handleCursorMove", null);
    exports.CommandDetectionCapability = CommandDetectionCapability = __decorate([
        __param(1, log_1.ILogService)
    ], CommandDetectionCapability);
    /**
     * Non-Windows-specific behavior.
     */
    class UnixPtyHeuristics extends lifecycle_1.Disposable {
        constructor(_terminal, _capability, _hooks, _logService) {
            super();
            this._terminal = _terminal;
            this._capability = _capability;
            this._hooks = _hooks;
            this._logService = _logService;
            this._register(_terminal.parser.registerCsiHandler({ final: 'J' }, params => {
                if (params.length >= 1 && (params[0] === 2 || params[0] === 3)) {
                    _hooks.clearCommandsInViewport();
                }
                // We don't want to override xterm.js' default behavior, just augment it
                return false;
            }));
        }
        handleCommandStart(options) {
            this._hooks.commitCommandFinished();
            const currentCommand = this._capability.currentCommand;
            currentCommand.commandStartX = this._terminal.buffer.active.cursorX;
            currentCommand.commandStartMarker = options?.marker || this._terminal.registerMarker(0);
            // Clear executed as it must happen after command start
            currentCommand.commandExecutedMarker?.dispose();
            currentCommand.commandExecutedMarker = undefined;
            currentCommand.commandExecutedX = undefined;
            for (const m of this._hooks.commandMarkers) {
                m.dispose();
            }
            this._hooks.commandMarkers.length = 0;
            this._hooks.onCommandStartedEmitter.fire({ marker: options?.marker || currentCommand.commandStartMarker, markProperties: options?.markProperties });
            this._logService.debug('CommandDetectionCapability#handleCommandStart', currentCommand.commandStartX, currentCommand.commandStartMarker?.line);
        }
        handleCommandExecuted(options) {
            const currentCommand = this._capability.currentCommand;
            currentCommand.commandExecutedMarker = options?.marker || this._terminal.registerMarker(0);
            currentCommand.commandExecutedX = this._terminal.buffer.active.cursorX;
            this._logService.debug('CommandDetectionCapability#handleCommandExecuted', currentCommand.commandExecutedX, currentCommand.commandExecutedMarker?.line);
            // Sanity check optional props
            if (!currentCommand.commandStartMarker || !currentCommand.commandExecutedMarker || currentCommand.commandStartX === undefined) {
                return;
            }
            // Calculate the command
            currentCommand.command = this._hooks.isCommandStorageDisabled ? '' : this._terminal.buffer.active.getLine(currentCommand.commandStartMarker.line)?.translateToString(true, currentCommand.commandStartX, currentCommand.commandRightPromptStartX).trim();
            let y = currentCommand.commandStartMarker.line + 1;
            const commandExecutedLine = currentCommand.commandExecutedMarker.line;
            for (; y < commandExecutedLine; y++) {
                const line = this._terminal.buffer.active.getLine(y);
                if (line) {
                    const continuation = currentCommand.continuations?.find(e => e.marker.line === y);
                    if (continuation) {
                        currentCommand.command += '\n';
                    }
                    const startColumn = continuation?.end ?? 0;
                    currentCommand.command += line.translateToString(true, startColumn);
                }
            }
            if (y === commandExecutedLine) {
                currentCommand.command += this._terminal.buffer.active.getLine(commandExecutedLine)?.translateToString(true, undefined, currentCommand.commandExecutedX) || '';
            }
            this._hooks.onCommandExecutedEmitter.fire(currentCommand);
        }
    }
    var AdjustCommandStartMarkerConstants;
    (function (AdjustCommandStartMarkerConstants) {
        AdjustCommandStartMarkerConstants[AdjustCommandStartMarkerConstants["MaxCheckLineCount"] = 10] = "MaxCheckLineCount";
        AdjustCommandStartMarkerConstants[AdjustCommandStartMarkerConstants["Interval"] = 20] = "Interval";
        AdjustCommandStartMarkerConstants[AdjustCommandStartMarkerConstants["MaximumPollCount"] = 10] = "MaximumPollCount";
    })(AdjustCommandStartMarkerConstants || (AdjustCommandStartMarkerConstants = {}));
    /**
     * An object that integrated with and decorates the command detection capability to add heuristics
     * that adjust various markers to work better with Windows and ConPTY. This isn't depended upon the
     * frontend OS, or even the backend OS, but the `IsWindows` property which technically a non-Windows
     * client can emit (for example in tests).
     */
    let WindowsPtyHeuristics = class WindowsPtyHeuristics extends lifecycle_1.Disposable {
        constructor(_terminal, _capability, _hooks, _logService) {
            super();
            this._terminal = _terminal;
            this._capability = _capability;
            this._hooks = _hooks;
            this._logService = _logService;
            this._onCursorMoveListener = this._register(new lifecycle_1.MutableDisposable());
            this._tryAdjustCommandStartMarkerScannedLineCount = 0;
            this._tryAdjustCommandStartMarkerPollCount = 0;
            this._register(_terminal.parser.registerCsiHandler({ final: 'J' }, params => {
                // Clear commands when the viewport is cleared
                if (params.length >= 1 && (params[0] === 2 || params[0] === 3)) {
                    this._hooks.clearCommandsInViewport();
                }
                // We don't want to override xterm.js' default behavior, just augment it
                return false;
            }));
            this._register(this._capability.onBeforeCommandFinished(command => {
                // For older Windows backends we cannot listen to CSI J, instead we assume running clear
                // or cls will clear all commands in the viewport. This is not perfect but it's right
                // most of the time.
                if (command.command.trim().toLowerCase() === 'clear' || command.command.trim().toLowerCase() === 'cls') {
                    this._tryAdjustCommandStartMarkerScheduler?.cancel();
                    this._tryAdjustCommandStartMarkerScheduler = undefined;
                    this._hooks.clearCommandsInViewport();
                    this._capability.currentCommand.isInvalid = true;
                    this._hooks.onCurrentCommandInvalidatedEmitter.fire({ reason: "windows" /* CommandInvalidationReason.Windows */ });
                }
            }));
        }
        preHandleResize(e) {
            // Resize behavior is different under conpty; instead of bringing parts of the scrollback
            // back into the viewport, new lines are inserted at the bottom (ie. the same behavior as if
            // there was no scrollback).
            //
            // On resize this workaround will wait for a conpty reprint to occur by waiting for the
            // cursor to move, it will then calculate the number of lines that the commands within the
            // viewport _may have_ shifted. After verifying the content of the current line is
            // incorrect, the line after shifting is checked and if that matches delete events are fired
            // on the xterm.js buffer to move the markers.
            //
            // While a bit hacky, this approach is quite safe and seems to work great at least for pwsh.
            const baseY = this._terminal.buffer.active.baseY;
            const rowsDifference = e.rows - this._hooks.dimensions.rows;
            // Only do when rows increase, do in the next frame as this needs to happen after
            // conpty reprints the screen
            if (rowsDifference > 0) {
                this._waitForCursorMove().then(() => {
                    // Calculate the number of lines the content may have shifted, this will max out at
                    // scrollback count since the standard behavior will be used then
                    const potentialShiftedLineCount = Math.min(rowsDifference, baseY);
                    // For each command within the viewport, assume commands are in the correct order
                    for (let i = this._capability.commands.length - 1; i >= 0; i--) {
                        const command = this._capability.commands[i];
                        if (!command.marker || command.marker.line < baseY || command.commandStartLineContent === undefined) {
                            break;
                        }
                        const line = this._terminal.buffer.active.getLine(command.marker.line);
                        if (!line || line.translateToString(true) === command.commandStartLineContent) {
                            continue;
                        }
                        const shiftedY = command.marker.line - potentialShiftedLineCount;
                        const shiftedLine = this._terminal.buffer.active.getLine(shiftedY);
                        if (shiftedLine?.translateToString(true) !== command.commandStartLineContent) {
                            continue;
                        }
                        // HACK: xterm.js doesn't expose this by design as it's an internal core
                        // function an embedder could easily do damage with. Additionally, this
                        // can't really be upstreamed since the event relies on shell integration to
                        // verify the shifting is necessary.
                        this._terminal._core._bufferService.buffer.lines.onDeleteEmitter.fire({
                            index: this._terminal.buffer.active.baseY,
                            amount: potentialShiftedLineCount
                        });
                    }
                });
            }
        }
        handleCommandStart() {
            this._capability.currentCommand.commandStartX = this._terminal.buffer.active.cursorX;
            // On Windows track all cursor movements after the command start sequence
            this._hooks.commandMarkers.length = 0;
            const initialCommandStartMarker = this._capability.currentCommand.commandStartMarker = (this._capability.currentCommand.promptStartMarker
                ? cloneMarker(this._terminal, this._capability.currentCommand.promptStartMarker)
                : this._terminal.registerMarker(0));
            this._capability.currentCommand.commandStartX = 0;
            // DEBUG: Add a decoration for the original unadjusted command start position
            // if ('registerDecoration' in this._terminal) {
            // 	const d = (this._terminal as any).registerDecoration({
            // 		marker: this._capability.currentCommand.commandStartMarker,
            // 		x: this._capability.currentCommand.commandStartX
            // 	});
            // 	d?.onRender((e: HTMLElement) => {
            // 		e.textContent = 'b';
            // 		e.classList.add('xterm-sequence-decoration', 'top', 'right');
            // 		e.title = 'Initial command start position';
            // 	});
            // }
            // The command started sequence may be printed before the actual prompt is, for example a
            // multi-line prompt will typically look like this where D, A and B signify the command
            // finished, prompt started and command started sequences respectively:
            //
            //     D/my/cwdB
            //     > C
            //
            // Due to this, it's likely that this will be called before the line has been parsed.
            // Unfortunately, it is also the case that the actual command start data may not be parsed
            // by the end of the task either, so a microtask cannot be used.
            //
            // The strategy used is to begin polling and scanning downwards for up to the next 5 lines.
            // If it looks like a prompt is found, the command started location is adjusted. If the
            // command executed sequences comes in before polling is done, polling is canceled and the
            // final polling task is executed synchronously.
            this._tryAdjustCommandStartMarkerScannedLineCount = 0;
            this._tryAdjustCommandStartMarkerPollCount = 0;
            this._tryAdjustCommandStartMarkerScheduler = new async_1.RunOnceScheduler(() => this._tryAdjustCommandStartMarker(initialCommandStartMarker), 20 /* AdjustCommandStartMarkerConstants.Interval */);
            this._tryAdjustCommandStartMarkerScheduler.schedule();
            // TODO: Cache details about polling for the future - eg. if it always fails, stop bothering
        }
        _tryAdjustCommandStartMarker(start) {
            if (this._store.isDisposed) {
                return;
            }
            const buffer = this._terminal.buffer.active;
            let scannedLineCount = this._tryAdjustCommandStartMarkerScannedLineCount;
            while (scannedLineCount < 10 /* AdjustCommandStartMarkerConstants.MaxCheckLineCount */ && start.line + scannedLineCount < buffer.baseY + this._terminal.rows) {
                if (this._cursorOnNextLine()) {
                    const prompt = this._getWindowsPrompt(start.line + scannedLineCount);
                    if (prompt) {
                        const adjustedPrompt = typeof prompt === 'string' ? prompt : prompt.prompt;
                        this._capability.currentCommand.commandStartMarker = this._terminal.registerMarker(0);
                        if (typeof prompt === 'object' && prompt.likelySingleLine) {
                            this._logService.debug('CommandDetectionCapability#_tryAdjustCommandStartMarker adjusted promptStart', `${this._capability.currentCommand.promptStartMarker?.line} -> ${this._capability.currentCommand.commandStartMarker.line}`);
                            this._capability.currentCommand.promptStartMarker?.dispose();
                            this._capability.currentCommand.promptStartMarker = cloneMarker(this._terminal, this._capability.currentCommand.commandStartMarker);
                            // Adjust the last command if it's not in the same position as the following
                            // prompt start marker
                            const lastCommand = this._capability.commands.at(-1);
                            if (lastCommand && this._capability.currentCommand.commandStartMarker.line !== lastCommand.endMarker?.line) {
                                lastCommand.endMarker?.dispose();
                                lastCommand.endMarker = cloneMarker(this._terminal, this._capability.currentCommand.commandStartMarker);
                            }
                        }
                        // use the regex to set the position as it's possible input has occurred
                        this._capability.currentCommand.commandStartX = adjustedPrompt.length;
                        this._logService.debug('CommandDetectionCapability#_tryAdjustCommandStartMarker adjusted commandStart', `${start.line} -> ${this._capability.currentCommand.commandStartMarker.line}:${this._capability.currentCommand.commandStartX}`);
                        this._flushPendingHandleCommandStartTask();
                        return;
                    }
                }
                scannedLineCount++;
            }
            if (scannedLineCount < 10 /* AdjustCommandStartMarkerConstants.MaxCheckLineCount */) {
                this._tryAdjustCommandStartMarkerScannedLineCount = scannedLineCount;
                if (++this._tryAdjustCommandStartMarkerPollCount < 10 /* AdjustCommandStartMarkerConstants.MaximumPollCount */) {
                    this._tryAdjustCommandStartMarkerScheduler?.schedule();
                }
                else {
                    this._flushPendingHandleCommandStartTask();
                }
            }
            else {
                this._flushPendingHandleCommandStartTask();
            }
        }
        _flushPendingHandleCommandStartTask() {
            // Perform final try adjust if necessary
            if (this._tryAdjustCommandStartMarkerScheduler) {
                // Max out poll count to ensure it's the last run
                this._tryAdjustCommandStartMarkerPollCount = 10 /* AdjustCommandStartMarkerConstants.MaximumPollCount */;
                this._tryAdjustCommandStartMarkerScheduler.flush();
                this._tryAdjustCommandStartMarkerScheduler = undefined;
            }
            this._hooks.commitCommandFinished();
            if (!this._capability.currentCommand.commandExecutedMarker) {
                this._onCursorMoveListener.value = this._terminal.onCursorMove(() => {
                    if (this._hooks.commandMarkers.length === 0 || this._hooks.commandMarkers[this._hooks.commandMarkers.length - 1].line !== this._terminal.buffer.active.cursorY) {
                        const marker = this._terminal.registerMarker(0);
                        if (marker) {
                            this._hooks.commandMarkers.push(marker);
                        }
                    }
                });
            }
            if (this._capability.currentCommand.commandStartMarker) {
                const line = this._terminal.buffer.active.getLine(this._capability.currentCommand.commandStartMarker.line);
                if (line) {
                    this._capability.currentCommand.commandStartLineContent = line.translateToString(true);
                }
            }
            this._hooks.onCommandStartedEmitter.fire({ marker: this._capability.currentCommand.commandStartMarker });
            this._logService.debug('CommandDetectionCapability#_handleCommandStartWindows', this._capability.currentCommand.commandStartX, this._capability.currentCommand.commandStartMarker?.line);
        }
        handleCommandExecuted(options) {
            if (this._tryAdjustCommandStartMarkerScheduler) {
                this._flushPendingHandleCommandStartTask();
            }
            // Use the gathered cursor move markers to correct the command start and executed markers
            this._onCursorMoveListener.clear();
            this._evaluateCommandMarkers();
            this._capability.currentCommand.commandExecutedX = this._terminal.buffer.active.cursorX;
            this._hooks.onCommandExecutedEmitter.fire(this._capability.currentCommand);
            this._logService.debug('CommandDetectionCapability#handleCommandExecuted', this._capability.currentCommand.commandExecutedX, this._capability.currentCommand.commandExecutedMarker?.line);
        }
        preHandleCommandFinished() {
            if (this._capability.currentCommand.commandExecutedMarker) {
                return;
            }
            // This is done on command finished just in case command executed never happens (for example
            // PSReadLine tab completion)
            if (this._hooks.commandMarkers.length === 0) {
                // If the command start timeout doesn't happen before command finished, just use the
                // current marker.
                if (!this._capability.currentCommand.commandStartMarker) {
                    this._capability.currentCommand.commandStartMarker = this._terminal.registerMarker(0);
                }
                if (this._capability.currentCommand.commandStartMarker) {
                    this._hooks.commandMarkers.push(this._capability.currentCommand.commandStartMarker);
                }
            }
            this._evaluateCommandMarkers();
        }
        postHandleCommandFinished() {
            const currentCommand = this._capability.currentCommand;
            const commandText = currentCommand.command;
            const commandLine = currentCommand.commandStartMarker?.line;
            const executedLine = currentCommand.commandExecutedMarker?.line;
            if (!commandText || commandText.length === 0 ||
                commandLine === undefined || commandLine === -1 ||
                executedLine === undefined || executedLine === -1) {
                return;
            }
            // Scan downwards from the command start line and search for every character in the actual
            // command line. This may end up matching the wrong characters, but it shouldn't matter at
            // least in the typical case as the entire command will still get matched.
            let current = 0;
            let found = false;
            for (let i = commandLine; i <= executedLine; i++) {
                const line = this._terminal.buffer.active.getLine(i);
                if (!line) {
                    break;
                }
                const text = line.translateToString(true);
                for (let j = 0; j < text.length; j++) {
                    // Skip whitespace in case it was not actually rendered or could be trimmed from the
                    // end of the line
                    while (commandText.length < current && commandText[current] === ' ') {
                        current++;
                    }
                    // Character match
                    if (text[j] === commandText[current]) {
                        current++;
                    }
                    // Full command match
                    if (current === commandText.length) {
                        // It's ambiguous whether the command executed marker should ideally appear at
                        // the end of the line or at the beginning of the next line. Since it's more
                        // useful for extracting the command at the end of the current line we go with
                        // that.
                        const wrapsToNextLine = j >= this._terminal.cols - 1;
                        currentCommand.commandExecutedMarker = this._terminal.registerMarker(i - (this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY) + (wrapsToNextLine ? 1 : 0));
                        currentCommand.commandExecutedX = wrapsToNextLine ? 0 : j + 1;
                        found = true;
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
        }
        _evaluateCommandMarkers() {
            // On Windows, use the gathered cursor move markers to correct the command start and
            // executed markers.
            if (this._hooks.commandMarkers.length === 0) {
                return;
            }
            this._hooks.commandMarkers = this._hooks.commandMarkers.sort((a, b) => a.line - b.line);
            this._capability.currentCommand.commandStartMarker = this._hooks.commandMarkers[0];
            if (this._capability.currentCommand.commandStartMarker) {
                const line = this._terminal.buffer.active.getLine(this._capability.currentCommand.commandStartMarker.line);
                if (line) {
                    this._capability.currentCommand.commandStartLineContent = line.translateToString(true);
                }
            }
            this._capability.currentCommand.commandExecutedMarker = this._hooks.commandMarkers[this._hooks.commandMarkers.length - 1];
            // Fire this now to prevent issues like #197409
            this._hooks.onCommandExecutedEmitter.fire(this._capability.currentCommand);
        }
        _cursorOnNextLine() {
            const lastCommand = this._capability.commands.at(-1);
            // There is only a single command, so this check is unnecessary
            if (!lastCommand) {
                return true;
            }
            const cursorYAbsolute = this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY;
            // If the cursor position is within the last command, we should poll.
            const lastCommandYAbsolute = (lastCommand.endMarker ? lastCommand.endMarker.line : lastCommand.marker?.line) ?? -1;
            return cursorYAbsolute > lastCommandYAbsolute;
        }
        _waitForCursorMove() {
            const cursorX = this._terminal.buffer.active.cursorX;
            const cursorY = this._terminal.buffer.active.cursorY;
            let totalDelay = 0;
            return new Promise((resolve, reject) => {
                const interval = setInterval(() => {
                    if (cursorX !== this._terminal.buffer.active.cursorX || cursorY !== this._terminal.buffer.active.cursorY) {
                        resolve();
                        clearInterval(interval);
                        return;
                    }
                    totalDelay += 10;
                    if (totalDelay > 1000) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 10);
            });
        }
        _getWindowsPrompt(y = this._terminal.buffer.active.baseY + this._terminal.buffer.active.cursorY) {
            const line = this._terminal.buffer.active.getLine(y);
            if (!line) {
                return;
            }
            // TODO: fine tune prompt regex to accomodate for unique configurations.
            const lineText = line.translateToString(true);
            if (!lineText) {
                return;
            }
            // PowerShell
            const pwshPrompt = lineText.match(/(?<prompt>(\(.+\)\s)?(?:PS.+>\s?))/)?.groups?.prompt;
            if (pwshPrompt) {
                const adjustedPrompt = this._adjustPrompt(pwshPrompt, lineText, '>');
                if (adjustedPrompt) {
                    return {
                        prompt: adjustedPrompt,
                        likelySingleLine: true
                    };
                }
            }
            // Custom prompts like starship end in the common \u276f character
            const customPrompt = lineText.match(/.*\u276f(?=[^\u276f]*$)/g)?.[0];
            if (customPrompt) {
                const adjustedPrompt = this._adjustPrompt(customPrompt, lineText, '\u276f');
                if (adjustedPrompt) {
                    return adjustedPrompt;
                }
            }
            // Bash Prompt
            const bashPrompt = lineText.match(/^(?<prompt>\$)/)?.groups?.prompt;
            if (bashPrompt) {
                const adjustedPrompt = this._adjustPrompt(bashPrompt, lineText, '$');
                if (adjustedPrompt) {
                    return adjustedPrompt;
                }
            }
            // Python Prompt
            const pythonPrompt = lineText.match(/^(?<prompt>>>> )/g)?.groups?.prompt;
            if (pythonPrompt) {
                return {
                    prompt: pythonPrompt,
                    likelySingleLine: true
                };
            }
            // Command Prompt
            const cmdMatch = lineText.match(/^(?<prompt>(\(.+\)\s)?(?:[A-Z]:\\.*>))/);
            return cmdMatch?.groups?.prompt ? {
                prompt: cmdMatch.groups.prompt,
                likelySingleLine: true
            } : undefined;
        }
        _adjustPrompt(prompt, lineText, char) {
            if (!prompt) {
                return;
            }
            // Conpty may not 'render' the space at the end of the prompt
            if (lineText === prompt && prompt.endsWith(char)) {
                prompt += ' ';
            }
            return prompt;
        }
    };
    WindowsPtyHeuristics = __decorate([
        __param(3, log_1.ILogService)
    ], WindowsPtyHeuristics);
    function getLinesForCommand(buffer, command, cols, outputMatcher) {
        if (!outputMatcher) {
            return undefined;
        }
        const executedMarker = command.executedMarker;
        const endMarker = command.endMarker;
        if (!executedMarker || !endMarker) {
            return undefined;
        }
        const startLine = executedMarker.line;
        const endLine = endMarker.line;
        const linesToCheck = outputMatcher.length;
        const lines = [];
        if (outputMatcher.anchor === 'bottom') {
            for (let i = endLine - (outputMatcher.offset || 0); i >= startLine; i--) {
                let wrappedLineStart = i;
                const wrappedLineEnd = i;
                while (wrappedLineStart >= startLine && buffer.getLine(wrappedLineStart)?.isWrapped) {
                    wrappedLineStart--;
                }
                i = wrappedLineStart;
                lines.unshift(getXtermLineContent(buffer, wrappedLineStart, wrappedLineEnd, cols));
                if (lines.length > linesToCheck) {
                    lines.pop();
                }
            }
        }
        else {
            for (let i = startLine + (outputMatcher.offset || 0); i < endLine; i++) {
                const wrappedLineStart = i;
                let wrappedLineEnd = i;
                while (wrappedLineEnd + 1 < endLine && buffer.getLine(wrappedLineEnd + 1)?.isWrapped) {
                    wrappedLineEnd++;
                }
                i = wrappedLineEnd;
                lines.push(getXtermLineContent(buffer, wrappedLineStart, wrappedLineEnd, cols));
                if (lines.length === linesToCheck) {
                    lines.shift();
                }
            }
        }
        return lines;
    }
    function getXtermLineContent(buffer, lineStart, lineEnd, cols) {
        // Cap the maximum number of lines generated to prevent potential performance problems. This is
        // more of a sanity check as the wrapped line should already be trimmed down at this point.
        const maxLineLength = Math.max(2048 / cols * 2);
        lineEnd = Math.min(lineEnd, lineStart + maxLineLength);
        let content = '';
        for (let i = lineStart; i <= lineEnd; i++) {
            // Make sure only 0 to cols are considered as resizing when windows mode is enabled will
            // retain buffer data outside of the terminal width as reflow is disabled.
            const line = buffer.getLine(i);
            if (line) {
                content += line.translateToString(true, 0, cols);
            }
        }
        return content;
    }
    function cloneMarker(xterm, marker, offset = 0) {
        return xterm.registerMarker(marker.line - (xterm.buffer.active.baseY + xterm.buffer.active.cursorY) + offset);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZERldGVjdGlvbkNhcGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vY2FwYWJpbGl0aWVzL2NvbW1hbmREZXRlY3Rpb25DYXBhYmlsaXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTA5QmhHLGdEQTBDQztJQS8rQk0sSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMkIsU0FBUSxzQkFBVTtRQUl6RCxJQUFJLGdCQUFnQixLQUF3QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFlNUUsSUFBSSxRQUFRLEtBQWlDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDckUsSUFBSSxnQkFBZ0IsS0FBeUIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDbkYsd0VBQXdFO1FBQ3hFLElBQUksc0JBQXNCO1lBQ3pCLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUM3QyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsa0JBQWtCLEVBQXNCLENBQUM7WUFDaEYsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFDRCxJQUFJLGNBQWM7WUFDakIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7UUFDRCxJQUFJLEdBQUcsS0FBeUIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNuRCxJQUFZLFlBQVk7WUFDdkIsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGtCQUFrQixJQUFJLENBQUMsSUFBSSxDQUFD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