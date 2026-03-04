/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PartialTerminalCommand = exports.TerminalCommand = void 0;
    class TerminalCommand {
        get command() { return this._properties.command; }
        get commandLineConfidence() { return this._properties.commandLineConfidence; }
        get isTrusted() { return this._properties.isTrusted; }
        get timestamp() { return this._properties.timestamp; }
        get duration() { return this._properties.duration; }
        get promptStartMarker() { return this._properties.promptStartMarker; }
        get marker() { return this._properties.marker; }
        get endMarker() { return this._properties.endMarker; }
        set endMarker(value) { this._properties.endMarker = value; }
        get executedMarker() { return this._properties.executedMarker; }
        get aliases() { return this._properties.aliases; }
        get wasReplayed() { return this._properties.wasReplayed; }
        get cwd() { return this._properties.cwd; }
        get exitCode() { return this._properties.exitCode; }
        get commandStartLineContent() { return this._properties.commandStartLineContent; }
        get markProperties() { return this._properties.markProperties; }
        get executedX() { return this._properties.executedX; }
        get startX() { return this._properties.startX; }
        constructor(_xterm, _properties) {
            this._xterm = _xterm;
            this._properties = _properties;
        }
        static deserialize(xterm, serialized, isCommandStorageDisabled) {
            const buffer = xterm.buffer.normal;
            const marker = serialized.startLine !== undefined ? xterm.registerMarker(serialized.startLine - (buffer.baseY + buffer.cursorY)) : undefined;
            // Check for invalid command
            if (!marker) {
                return undefined;
            }
            const promptStartMarker = serialized.promptStartLine !== undefined ? xterm.registerMarker(serialized.promptStartLine - (buffer.baseY + buffer.cursorY)) : undefined;
            // Valid full command
            const endMarker = serialized.endLine !== undefined ? xterm.registerMarker(serialized.endLine - (buffer.baseY + buffer.cursorY)) : undefined;
            const executedMarker = serialized.executedLine !== undefined ? xterm.registerMarker(serialized.executedLine - (buffer.baseY + buffer.cursorY)) : undefined;
            const newCommand = new TerminalCommand(xterm, {
                command: isCommandStorageDisabled ? '' : serialized.command,
                commandLineConfidence: serialized.commandLineConfidence ?? 'low',
                isTrusted: serialized.isTrusted,
                promptStartMarker,
                marker,
                startX: serialized.startX,
                endMarker,
                executedMarker,
                executedX: serialized.executedX,
                timestamp: serialized.timestamp,
                duration: serialized.duration,
                cwd: serialized.cwd,
                commandStartLineContent: serialized.commandStartLineContent,
                exitCode: serialized.exitCode,
                markProperties: serialized.markProperties,
                aliases: undefined,
                wasReplayed: true
            });
            return newCommand;
        }
        serialize(isCommandStorageDisabled) {
            return {
                promptStartLine: this.promptStartMarker?.line,
                startLine: this.marker?.line,
                startX: undefined,
                endLine: this.endMarker?.line,
                executedLine: this.executedMarker?.line,
                executedX: this.executedX,
                command: isCommandStorageDisabled ? '' : this.command,
                commandLineConfidence: isCommandStorageDisabled ? 'low' : this.commandLineConfidence,
                isTrusted: this.isTrusted,
                cwd: this.cwd,
                exitCode: this.exitCode,
                commandStartLineContent: this.commandStartLineContent,
                timestamp: this.timestamp,
                duration: this.duration,
                markProperties: this.markProperties,
            };
        }
        extractCommandLine() {
            return extractCommandLine(this._xterm.buffer.active, this._xterm.cols, this.marker, this.startX, this.executedMarker, this.executedX);
        }
        getOutput() {
            if (!this.executedMarker || !this.endMarker) {
                return undefined;
            }
            const startLine = this.executedMarker.line;
            const endLine = this.endMarker.line;
            if (startLine === endLine) {
                return undefined;
            }
            let output = '';
            let line;
            for (let i = startLine; i < endLine; i++) {
                line = this._xterm.buffer.active.getLine(i);
                if (!line) {
                    continue;
                }
                output += line.translateToString(!line.isWrapped) + (line.isWrapped ? '' : '\n');
            }
            return output === '' ? undefined : output;
        }
        getOutputMatch(outputMatcher) {
            // TODO: Add back this check? this._ptyHeuristics.value instanceof WindowsPtyHeuristics && (executedMarker?.line === endMarker?.line) ? this._currentCommand.commandStartMarker : executedMarker
            if (!this.executedMarker || !this.endMarker) {
                return undefined;
            }
            const endLine = this.endMarker.line;
            if (endLine === -1) {
                return undefined;
            }
            const buffer = this._xterm.buffer.active;
            const startLine = Math.max(this.executedMarker.line, 0);
            const matcher = outputMatcher.lineMatcher;
            const linesToCheck = typeof matcher === 'string' ? 1 : outputMatcher.length || countNewLines(matcher);
            const lines = [];
            let match;
            if (outputMatcher.anchor === 'bottom') {
                for (let i = endLine - (outputMatcher.offset || 0); i >= startLine; i--) {
                    let wrappedLineStart = i;
                    const wrappedLineEnd = i;
                    while (wrappedLineStart >= startLine && buffer.getLine(wrappedLineStart)?.isWrapped) {
                        wrappedLineStart--;
                    }
                    i = wrappedLineStart;
                    lines.unshift(getXtermLineContent(buffer, wrappedLineStart, wrappedLineEnd, this._xterm.cols));
                    if (!match) {
                        match = lines[0].match(matcher);
                    }
                    if (lines.length >= linesToCheck) {
                        break;
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
                    lines.push(getXtermLineContent(buffer, wrappedLineStart, wrappedLineEnd, this._xterm.cols));
                    if (!match) {
                        match = lines[lines.length - 1].match(matcher);
                    }
                    if (lines.length >= linesToCheck) {
                        break;
                    }
                }
            }
            return match ? { regexMatch: match, outputLines: lines } : undefined;
        }
        hasOutput() {
            return (!this.executedMarker?.isDisposed &&
                !this.endMarker?.isDisposed &&
                !!(this.executedMarker &&
                    this.endMarker &&
                    this.executedMarker.line < this.endMarker.line));
        }
        getPromptRowCount() {
            return getPromptRowCount(this, this._xterm.buffer.active);
        }
        getCommandRowCount() {
            return getCommandRowCount(this);
        }
    }
    exports.TerminalCommand = TerminalCommand;
    class PartialTerminalCommand {
        constructor(_xterm) {
            this._xterm = _xterm;
        }
        serialize(cwd) {
            if (!this.commandStartMarker) {
                return undefined;
            }
            return {
                promptStartLine: this.promptStartMarker?.line,
                startLine: this.commandStartMarker.line,
                startX: this.commandStartX,
                endLine: undefined,
                executedLine: undefined,
                executedX: undefined,
                command: '',
                commandLineConfidence: 'low',
                isTrusted: true,
                cwd,
                exitCode: undefined,
                commandStartLineContent: undefined,
                timestamp: 0,
                duration: 0,
                markProperties: undefined
            };
        }
        promoteToFullCommand(cwd, exitCode, ignoreCommandLine, markProperties) {
            // When the command finishes and executed never fires the placeholder selector should be used.
            if (exitCode === undefined && this.command === undefined) {
                this.command = '';
            }
            if ((this.command !== undefined && !this.command.startsWith('\\')) || ignoreCommandLine) {
                return new TerminalCommand(this._xterm, {
                    command: ignoreCommandLine ? '' : (this.command || ''),
                    commandLineConfidence: ignoreCommandLine ? 'low' : (this.commandLineConfidence || 'low'),
                    isTrusted: !!this.isTrusted,
                    promptStartMarker: this.promptStartMarker,
                    marker: this.commandStartMarker,
                    startX: this.commandStartX,
                    endMarker: this.commandFinishedMarker,
                    executedMarker: this.commandExecutedMarker,
                    executedX: this.commandExecutedX,
                    timestamp: Date.now(),
                    duration: this.commandDuration || 0,
                    cwd,
                    exitCode,
                    commandStartLineContent: this.commandStartLineContent,
                    markProperties
                });
            }
            return undefined;
        }
        markExecutedTime() {
            if (this.commandExecutedTimestamp === undefined) {
                this.commandExecutedTimestamp = Date.now();
            }
        }
        markFinishedTime() {
            if (this.commandDuration === undefined && this.commandExecutedTimestamp !== undefined) {
                this.commandDuration = Date.now() - this.commandExecutedTimestamp;
            }
        }
        extractCommandLine() {
            return extractCommandLine(this._xterm.buffer.active, this._xterm.cols, this.commandStartMarker, this.commandStartX, this.commandExecutedMarker, this.commandExecutedX);
        }
        getPromptRowCount() {
            return getPromptRowCount(this, this._xterm.buffer.active);
        }
        getCommandRowCount() {
            return getCommandRowCount(this);
        }
    }
    exports.PartialTerminalCommand = PartialTerminalCommand;
    function extractCommandLine(buffer, cols, commandStartMarker, commandStartX, commandExecutedMarker, commandExecutedX) {
        if (!commandStartMarker || !commandExecutedMarker || commandStartX === undefined || commandExecutedX === undefined) {
            return '';
        }
        let content = '';
        for (let i = commandStartMarker.line; i <= commandExecutedMarker.line; i++) {
            const line = buffer.getLine(i);
            if (line) {
                content += line.translateToString(true, i === commandStartMarker.line ? commandStartX : 0, i === commandExecutedMarker.line ? commandExecutedX : cols);
            }
        }
        return content;
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
    function countNewLines(regex) {
        if (!regex.multiline) {
            return 1;
        }
        const source = regex.source;
        let count = 1;
        let i = source.indexOf('\\n');
        while (i !== -1) {
            count++;
            i = source.indexOf('\\n', i + 1);
        }
        return count;
    }
    function getPromptRowCount(command, buffer) {
        const marker = 'hasOutput' in command ? command.marker : command.commandStartMarker;
        if (!marker || !command.promptStartMarker) {
            return 1;
        }
        let promptRowCount = 1;
        let promptStartLine = command.promptStartMarker.line;
        // Trim any leading whitespace-only lines to retain vertical space
        while (promptStartLine < marker.line && (buffer.getLine(promptStartLine)?.translateToString(true) ?? '').length === 0) {
            promptStartLine++;
        }
        promptRowCount = marker.line - promptStartLine + 1;
        return promptRowCount;
    }
    function getCommandRowCount(command) {
        const marker = 'hasOutput' in command ? command.marker : command.commandStartMarker;
        const executedMarker = 'hasOutput' in command ? command.executedMarker : command.commandExecutedMarker;
        if (!marker || !executedMarker) {
            return 1;
        }
        const commandExecutedLine = Math.max(executedMarker.line, marker.line);
        let commandRowCount = commandExecutedLine - marker.line + 1;
        // Trim the last line if the cursor X is in the left-most cell
        const executedX = 'hasOutput' in command ? command.executedX : command.commandExecutedX;
        if (executedX === 0) {
            commandRowCount--;
        }
        return commandRowCount;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb21tYW5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvY29tbW9uL2NhcGFiaWxpdGllcy9jb21tYW5kRGV0ZWN0aW9uL3Rlcm1pbmFsQ29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE4QmhHLE1BQWEsZUFBZTtRQUUzQixJQUFJLE9BQU8sS0FBSyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNsRCxJQUFJLHFCQUFxQixLQUFLLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFDOUUsSUFBSSxTQUFTLEtBQUssT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDdEQsSUFBSSxTQUFTLEtBQUssT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDdEQsSUFBSSxRQUFRLEtBQUssT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDcEQsSUFBSSxpQkFBaUIsS0FBSyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLElBQUksTUFBTSxLQUFLLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ2hELElBQUksU0FBUyxLQUFLLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3RELElBQUksU0FBUyxDQUFDLEtBQStCLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN0RixJQUFJLGNBQWMs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