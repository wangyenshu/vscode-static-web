/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/platform/terminal/common/capabilities/cwdDetectionCapability", "vs/platform/terminal/common/capabilities/partialCommandDetectionCapability", "vs/base/common/event", "vs/platform/terminal/common/capabilities/bufferMarkCapability", "vs/base/common/uri", "vs/platform/terminal/common/terminalEnvironment"], function (require, exports, lifecycle_1, terminalCapabilityStore_1, commandDetectionCapability_1, cwdDetectionCapability_1, partialCommandDetectionCapability_1, event_1, bufferMarkCapability_1, uri_1, terminalEnvironment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShellIntegrationAddon = exports.ShellIntegrationOscPs = void 0;
    exports.deserializeMessage = deserializeMessage;
    exports.parseKeyValueAssignment = parseKeyValueAssignment;
    exports.parseMarkSequence = parseMarkSequence;
    /**
     * Shell integration is a feature that enhances the terminal's understanding of what's happening
     * in the shell by injecting special sequences into the shell's prompt using the "Set Text
     * Parameters" sequence (`OSC Ps ; Pt ST`).
     *
     * Definitions:
     * - OSC: `\x1b]`
     * - Ps:  A single (usually optional) numeric parameter, composed of one or more digits.
     * - Pt:  A text parameter composed of printable characters.
     * - ST: `\x7`
     *
     * This is inspired by a feature of the same name in the FinalTerm, iTerm2 and kitty terminals.
     */
    /**
     * The identifier for the first numeric parameter (`Ps`) for OSC commands used by shell integration.
     */
    var ShellIntegrationOscPs;
    (function (ShellIntegrationOscPs) {
        /**
         * Sequences pioneered by FinalTerm.
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["FinalTerm"] = 133] = "FinalTerm";
        /**
         * Sequences pioneered by VS Code. The number is derived from the least significant digit of
         * "VSC" when encoded in hex ("VSC" = 0x56, 0x53, 0x43).
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["VSCode"] = 633] = "VSCode";
        /**
         * Sequences pioneered by iTerm.
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["ITerm"] = 1337] = "ITerm";
        ShellIntegrationOscPs[ShellIntegrationOscPs["SetCwd"] = 7] = "SetCwd";
        ShellIntegrationOscPs[ShellIntegrationOscPs["SetWindowsFriendlyCwd"] = 9] = "SetWindowsFriendlyCwd";
    })(ShellIntegrationOscPs || (exports.ShellIntegrationOscPs = ShellIntegrationOscPs = {}));
    /**
     * VS Code-specific shell integration sequences. Some of these are based on more common alternatives
     * like those pioneered in FinalTerm. The decision to move to entirely custom sequences was to try
     * to improve reliability and prevent the possibility of applications confusing the terminal. If
     * multiple shell integration scripts run, VS Code will prioritize the VS Code-specific ones.
     *
     * It's recommended that authors of shell integration scripts use the common sequences (eg. 133)
     * when building general purpose scripts and the VS Code-specific (633) when targeting only VS Code
     * or when there are no other alternatives.
     */
    var VSCodeOscPt;
    (function (VSCodeOscPt) {
        /**
         * The start of the prompt, this is expected to always appear at the start of a line.
         * Based on FinalTerm's `OSC 133 ; A ST`.
         */
        VSCodeOscPt["PromptStart"] = "A";
        /**
         * The start of a command, ie. where the user inputs their command.
         * Based on FinalTerm's `OSC 133 ; B ST`.
         */
        VSCodeOscPt["CommandStart"] = "B";
        /**
         * Sent just before the command output begins.
         * Based on FinalTerm's `OSC 133 ; C ST`.
         */
        VSCodeOscPt["CommandExecuted"] = "C";
        /**
         * Sent just after a command has finished. The exit code is optional, when not specified it
         * means no command was run (ie. enter on empty prompt or ctrl+c).
         * Based on FinalTerm's `OSC 133 ; D [; <ExitCode>] ST`.
         */
        VSCodeOscPt["CommandFinished"] = "D";
        /**
         * Explicitly set the command line. This helps workaround performance and reliability problems
         * with parsing out the command, such as conpty not guaranteeing the position of the sequence or
         * the shell not guaranteeing that the entire command is even visible. Ideally this is called
         * immediately before {@link CommandExecuted}, immediately before {@link CommandFinished} will
         * also work but that means terminal will only know the accurate command line when the command is
         * finished.
         *
         * The command line can escape ascii characters using the `\xAB` format, where AB are the
         * hexadecimal representation of the character code (case insensitive), and escape the `\`
         * character using `\\`. It's required to escape semi-colon (`0x3b`) and characters 0x20 and
         * below, this is particularly important for new line and semi-colon.
         *
         * Some examples:
         *
         * ```
         * "\"  -> "\\"
         * "\n" -> "\x0a"
         * ";"  -> "\x3b"
         * ```
         *
         * An optional nonce can be provided which is may be required by the terminal in order enable
         * some features. This helps ensure no malicious command injection has occurred.
         *
         * Format: `OSC 633 ; E [; <CommandLine> [; <Nonce>]] ST`.
         */
        VSCodeOscPt["CommandLine"] = "E";
        /**
         * Similar to prompt start but for line continuations.
         *
         * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
         */
        VSCodeOscPt["ContinuationStart"] = "F";
        /**
         * Similar to command start but for line continuations.
         *
         * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
         */
        VSCodeOscPt["ContinuationEnd"] = "G";
        /**
         * The start of the right prompt.
         *
         * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
         */
        VSCodeOscPt["RightPromptStart"] = "H";
        /**
         * The end of the right prompt.
         *
         * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
         */
        VSCodeOscPt["RightPromptEnd"] = "I";
        /**
         * Set an arbitrary property: `OSC 633 ; P ; <Property>=<Value> ST`, only known properties will
         * be handled.
         *
         * Known properties:
         *
         * - `Cwd` - Reports the current working directory to the terminal.
         * - `IsWindows` - Indicates whether the terminal is using a Windows backend like winpty or
         *   conpty. This may be used to enable additional heuristics as the positioning of the shell
         *   integration sequences are not guaranteed to be correct. Valid values: `True`, `False`.
         * - `ContinuationPrompt` - Reports the continuation prompt that is printed at the start of
         *   multi-line inputs.
         *
         * WARNING: Any other properties may be changed and are not guaranteed to work in the future.
         */
        VSCodeOscPt["Property"] = "P";
        /**
         * Sets a mark/point-of-interest in the buffer. `OSC 633 ; SetMark [; Id=<string>] [; Hidden]`
         * `Id` - The identifier of the mark that can be used to reference it
         * `Hidden` - When set, the mark will be available to reference internally but will not visible
         *
         * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
         */
        VSCodeOscPt["SetMark"] = "SetMark";
    })(VSCodeOscPt || (VSCodeOscPt = {}));
    /**
     * ITerm sequences
     */
    var ITermOscPt;
    (function (ITermOscPt) {
        /**
         * Sets a mark/point-of-interest in the buffer. `OSC 1337 ; SetMark`
         */
        ITermOscPt["SetMark"] = "SetMark";
        /**
         * Reports current working directory (CWD). `OSC 1337 ; CurrentDir=<Cwd> ST`
         */
        ITermOscPt["CurrentDir"] = "CurrentDir";
    })(ITermOscPt || (ITermOscPt = {}));
    /**
     * The shell integration addon extends xterm by reading shell integration sequences and creating
     * capabilities and passing along relevant sequences to the capabilities. This is meant to
     * encapsulate all handling/parsing of sequences so the capabilities don't need to.
     */
    class ShellIntegrationAddon extends lifecycle_1.Disposable {
        get status() { return this._status; }
        constructor(_nonce, _disableTelemetry, _telemetryService, _logService) {
            super();
            this._nonce = _nonce;
            this._disableTelemetry = _disableTelemetry;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this.capabilities = this._register(new terminalCapabilityStore_1.TerminalCapabilityStore());
            this._hasUpdatedTelemetry = false;
            this._commonProtocolDisposables = [];
            this._status = 0 /* ShellIntegrationStatus.Off */;
            this._onDidChangeStatus = new event_1.Emitter();
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._register((0, lifecycle_1.toDisposable)(() => {
                this._clearActivationTimeout();
                this._disposeCommonProtocol();
            }));
        }
        _disposeCommonProtocol() {
            (0, lifecycle_1.dispose)(this._commonProtocolDisposables);
            this._commonProtocolDisposables.length = 0;
        }
        activate(xterm) {
            this._terminal = xterm;
            this.capabilities.add(3 /* TerminalCapability.PartialCommandDetection */, this._register(new partialCommandDetectionCapability_1.PartialCommandDetectionCapability(this._terminal)));
            this._register(xterm.parser.registerOscHandler(633 /* ShellIntegrationOscPs.VSCode */, data => this._handleVSCodeSequence(data)));
            this._register(xterm.parser.registerOscHandler(1337 /* ShellIntegrationOscPs.ITerm */, data => this._doHandleITermSequence(data)));
            this._commonProtocolDisposables.push(xterm.parser.registerOscHandler(133 /* ShellIntegrationOscPs.FinalTerm */, data => this._handleFinalTermSequence(data)));
            this._register(xterm.parser.registerOscHandler(7 /* ShellIntegrationOscPs.SetCwd */, data => this._doHandleSetCwd(data)));
            this._register(xterm.parser.registerOscHandler(9 /* ShellIntegrationOscPs.SetWindowsFriendlyCwd */, data => this._doHandleSetWindowsFriendlyCwd(data)));
            this._ensureCapabilitiesOrAddFailureTelemetry();
        }
        getMarkerId(terminal, vscodeMarkerId) {
            this._createOrGetBufferMarkDetection(terminal).getMark(vscodeMarkerId);
        }
        _handleFinalTermSequence(data) {
            const didHandle = this._doHandleFinalTermSequence(data);
            if (this._status === 0 /* ShellIntegrationStatus.Off */) {
                this._status = 1 /* ShellIntegrationStatus.FinalTerm */;
                this._onDidChangeStatus.fire(this._status);
            }
            return didHandle;
        }
        _doHandleFinalTermSequence(data) {
            if (!this._terminal) {
                return false;
            }
            // Pass the sequence along to the capability
            // It was considered to disable the common protocol in order to not confuse the VS Code
            // shell integration if both happen for some reason. This doesn't work for powerlevel10k
            // when instant prompt is enabled though. If this does end up being a problem we could pass
            // a type flag through the capability calls
            const [command, ...args] = data.split(';');
            switch (command) {
                case 'A':
                    this._createOrGetCommandDetection(this._terminal).handlePromptStart();
                    return true;
                case 'B':
                    // Ignore the command line for these sequences as it's unreliable for example in powerlevel10k
                    this._createOrGetCommandDetection(this._terminal).handleCommandStart({ ignoreCommandLine: true });
                    return true;
                case 'C':
                    this._createOrGetCommandDetection(this._terminal).handleCommandExecuted();
                    return true;
                case 'D': {
                    const exitCode = args.length === 1 ? parseInt(args[0]) : undefined;
                    this._createOrGetCommandDetection(this._terminal).handleCommandFinished(exitCode);
                    return true;
                }
            }
            return false;
        }
        _handleVSCodeSequence(data) {
            const didHandle = this._doHandleVSCodeSequence(data);
            if (!this._hasUpdatedTelemetry && didHandle) {
                this._telemetryService?.publicLog2('terminal/shellIntegrationActivationSucceeded');
                this._hasUpdatedTelemetry = true;
                this._clearActivationTimeout();
            }
            if (this._status !== 2 /* ShellIntegrationStatus.VSCode */) {
                this._status = 2 /* ShellIntegrationStatus.VSCode */;
                this._onDidChangeStatus.fire(this._status);
            }
            return didHandle;
        }
        async _ensureCapabilitiesOrAddFailureTelemetry() {
            if (!this._telemetryService || this._disableTelemetry) {
                return;
            }
            this._activationTimeout = setTimeout(() => {
                if (!this.capabilities.get(2 /* TerminalCapability.CommandDetection */) && !this.capabilities.get(0 /* TerminalCapability.CwdDetection */)) {
                    this._telemetryService?.publicLog2('terminal/shellIntegrationActivationTimeout');
                    this._logService.warn('Shell integration failed to add capabilities within 10 seconds');
                }
                this._hasUpdatedTelemetry = true;
            }, 10000);
        }
        _clearActivationTimeout() {
            if (this._activationTimeout !== undefined) {
                clearTimeout(this._activationTimeout);
                this._activationTimeout = undefined;
            }
        }
        _doHandleVSCodeSequence(data) {
            if (!this._terminal) {
                return false;
            }
            // Pass the sequence along to the capability
            const argsIndex = data.indexOf(';');
            const sequenceCommand = argsIndex === -1 ? data : data.substring(0, argsIndex);
            // Cast to strict checked index access
            const args = argsIndex === -1 ? [] : data.substring(argsIndex + 1).split(';');
            switch (sequenceCommand) {
                case "A" /* VSCodeOscPt.PromptStart */:
                    this._createOrGetCommandDetection(this._terminal).handlePromptStart();
                    return true;
                case "B" /* VSCodeOscPt.CommandStart */:
                    this._createOrGetCommandDetection(this._terminal).handleCommandStart();
                    return true;
                case "C" /* VSCodeOscPt.CommandExecuted */:
                    this._createOrGetCommandDetection(this._terminal).handleCommandExecuted();
                    return true;
                case "D" /* VSCodeOscPt.CommandFinished */: {
                    const arg0 = args[0];
                    const exitCode = arg0 !== undefined ? parseInt(arg0) : undefined;
                    this._createOrGetCommandDetection(this._terminal).handleCommandFinished(exitCode);
                    return true;
                }
                case "E" /* VSCodeOscPt.CommandLine */: {
                    const arg0 = args[0];
                    const arg1 = args[1];
                    let commandLine;
                    if (arg0 !== undefined) {
                        commandLine = deserializeMessage(arg0);
                    }
                    else {
                        commandLine = '';
                    }
                    this._createOrGetCommandDetection(this._terminal).setCommandLine(commandLine, arg1 === this._nonce);
                    return true;
                }
                case "F" /* VSCodeOscPt.ContinuationStart */: {
                    this._createOrGetCommandDetection(this._terminal).handleContinuationStart();
                    return true;
                }
                case "G" /* VSCodeOscPt.ContinuationEnd */: {
                    this._createOrGetCommandDetection(this._terminal).handleContinuationEnd();
                    return true;
                }
                case "H" /* VSCodeOscPt.RightPromptStart */: {
                    this._createOrGetCommandDetection(this._terminal).handleRightPromptStart();
                    return true;
                }
                case "I" /* VSCodeOscPt.RightPromptEnd */: {
                    this._createOrGetCommandDetection(this._terminal).handleRightPromptEnd();
                    return true;
                }
                case "P" /* VSCodeOscPt.Property */: {
                    const arg0 = args[0];
                    const deserialized = arg0 !== undefined ? deserializeMessage(arg0) : '';
                    const { key, value } = parseKeyValueAssignment(deserialized);
                    if (value === undefined) {
                        return true;
                    }
                    switch (key) {
                        case 'ContinuationPrompt': {
                            // Exclude escape sequences and values between \[ and \]
                            const sanitizedValue = (value
                                .replace(/\x1b\[[0-9;]*m/g, '')
                                .replace(/\\\[.*?\\\]/g, ''));
                            this._updateContinuationPrompt(sanitizedValue);
                            return true;
                        }
                        case 'Cwd': {
                            this._updateCwd(value);
                            return true;
                        }
                        case 'IsWindows': {
                            this._createOrGetCommandDetection(this._terminal).setIsWindowsPty(value === 'True' ? true : false);
                            return true;
                        }
                        case 'Task': {
                            this._createOrGetBufferMarkDetection(this._terminal);
                            this.capabilities.get(2 /* TerminalCapability.CommandDetection */)?.setIsCommandStorageDisabled();
                            return true;
                        }
                    }
                }
                case "SetMark" /* VSCodeOscPt.SetMark */: {
                    this._createOrGetBufferMarkDetection(this._terminal).addMark(parseMarkSequence(args));
                    return true;
                }
            }
            // Unrecognized sequence
            return false;
        }
        _updateContinuationPrompt(value) {
            if (!this._terminal) {
                return;
            }
            this._createOrGetCommandDetection(this._terminal).setContinuationPrompt(value);
        }
        _updateCwd(value) {
            value = (0, terminalEnvironment_1.sanitizeCwd)(value);
            this._createOrGetCwdDetection().updateCwd(value);
            const commandDetection = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            commandDetection?.setCwd(value);
        }
        _doHandleITermSequence(data) {
            if (!this._terminal) {
                return false;
            }
            const [command] = data.split(';');
            switch (command) {
                case "SetMark" /* ITermOscPt.SetMark */: {
                    this._createOrGetBufferMarkDetection(this._terminal).addMark();
                }
                default: {
                    // Checking for known `<key>=<value>` pairs.
                    // Note that unlike `VSCodeOscPt.Property`, iTerm2 does not interpret backslash or hex-escape sequences.
                    // See: https://github.com/gnachman/iTerm2/blob/bb0882332cec5196e4de4a4225978d746e935279/sources/VT100Terminal.m#L2089-L2105
                    const { key, value } = parseKeyValueAssignment(command);
                    if (value === undefined) {
                        // No '=' was found, so it's not a property assignment.
                        return true;
                    }
                    switch (key) {
                        case "CurrentDir" /* ITermOscPt.CurrentDir */:
                            // Encountered: `OSC 1337 ; CurrentDir=<Cwd> ST`
                            this._updateCwd(value);
                            return true;
                    }
                }
            }
            // Unrecognized sequence
            return false;
        }
        _doHandleSetWindowsFriendlyCwd(data) {
            if (!this._terminal) {
                return false;
            }
            const [command, ...args] = data.split(';');
            switch (command) {
                case '9':
                    // Encountered `OSC 9 ; 9 ; <cwd> ST`
                    if (args.length) {
                        this._updateCwd(args[0]);
                    }
                    return true;
            }
            // Unrecognized sequence
            return false;
        }
        /**
         * Handles the sequence: `OSC 7 ; scheme://cwd ST`
         */
        _doHandleSetCwd(data) {
            if (!this._terminal) {
                return false;
            }
            const [command] = data.split(';');
            if (command.match(/^file:\/\/.*\//)) {
                const uri = uri_1.URI.parse(command);
                if (uri.path && uri.path.length > 0) {
                    this._updateCwd(uri.path);
                    return true;
                }
            }
            // Unrecognized sequence
            return false;
        }
        serialize() {
            if (!this._terminal || !this.capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                return {
                    isWindowsPty: false,
                    commands: []
                };
            }
            const result = this._createOrGetCommandDetection(this._terminal).serialize();
            return result;
        }
        deserialize(serialized) {
            if (!this._terminal) {
                throw new Error('Cannot restore commands before addon is activated');
            }
            this._createOrGetCommandDetection(this._terminal).deserialize(serialized);
        }
        _createOrGetCwdDetection() {
            let cwdDetection = this.capabilities.get(0 /* TerminalCapability.CwdDetection */);
            if (!cwdDetection) {
                cwdDetection = this._register(new cwdDetectionCapability_1.CwdDetectionCapability());
                this.capabilities.add(0 /* TerminalCapability.CwdDetection */, cwdDetection);
            }
            return cwdDetection;
        }
        _createOrGetCommandDetection(terminal) {
            let commandDetection = this.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (!commandDetection) {
                commandDetection = this._register(new commandDetectionCapability_1.CommandDetectionCapability(terminal, this._logService));
                this.capabilities.add(2 /* TerminalCapability.CommandDetection */, commandDetection);
            }
            return commandDetection;
        }
        _createOrGetBufferMarkDetection(terminal) {
            let bufferMarkDetection = this.capabilities.get(4 /* TerminalCapability.BufferMarkDetection */);
            if (!bufferMarkDetection) {
                bufferMarkDetection = this._register(new bufferMarkCapability_1.BufferMarkCapability(terminal));
                this.capabilities.add(4 /* TerminalCapability.BufferMarkDetection */, bufferMarkDetection);
            }
            return bufferMarkDetection;
        }
    }
    exports.ShellIntegrationAddon = ShellIntegrationAddon;
    function deserializeMessage(message) {
        return message.replaceAll(
        // Backslash ('\') followed by an escape operator: either another '\', or 'x' and two hex chars.
        /\\(\\|x([0-9a-f]{2}))/gi, 
        // If it's a hex value, parse it to a character.
        // Otherwise the operator is '\', which we return literally, now unescaped.
        (_match, op, hex) => hex ? String.fromCharCode(parseInt(hex, 16)) : op);
    }
    function parseKeyValueAssignment(message) {
        const separatorIndex = message.indexOf('=');
        if (separatorIndex === -1) {
            return { key: message, value: undefined }; // No '=' was found.
        }
        return {
            key: message.substring(0, separatorIndex),
            value: message.substring(1 + separatorIndex)
        };
    }
    function parseMarkSequence(sequence) {
        let id = undefined;
        let hidden = false;
        for (const property of sequence) {
            // Sanity check, this shouldn't happen in practice
            if (property === undefined) {
                continue;
            }
            if (property === 'Hidden') {
                hidden = true;
            }
            if (property.startsWith('Id=')) {
                id = property.substring(3);
            }
        }
        return { id, hidden };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGxJbnRlZ3JhdGlvbkFkZG9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvY29tbW9uL3h0ZXJtL3NoZWxsSW50ZWdyYXRpb25BZGRvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxaUJoRyxnREFPQztJQUVELDBEQVNDO0lBR0QsOENBZ0JDO0lBcGpCRDs7Ozs7Ozs7Ozs7O09BWUc7SUFFSDs7T0FFRztJQUNILElBQWtCLHFCQWdCakI7SUFoQkQsV0FBa0IscUJBQXFCO1FBQ3RDOztXQUVHO1FBQ0gsNkVBQWUsQ0FBQTtRQUNmOzs7V0FHRztRQUNILHVFQUFZLENBQUE7UUFDWjs7V0FFRztRQUNILHNFQUFZLENBQUE7UUFDWixxRUFBVSxDQUFBO1FBQ1YsbUdBQXlCLENBQUE7SUFDMUIsQ0FBQyxFQWhCaUIscUJBQXFCLHFDQUFyQixxQkFBcUIsUUFnQnRDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0gsSUFBVyxXQTJHVjtJQTNHRCxXQUFXLFdBQVc7UUFDckI7OztXQUdHO1FBQ0gsZ0NBQWlCLENBQUE7UUFFakI7OztXQUdHO1FBQ0gsaUNBQWtCLENBQUE7UUFFbEI7OztXQUdHO1FBQ0gsb0NBQXFCLENBQUE7UUFFckI7Ozs7V0FJRztRQUNILG9DQUFxQixDQUFBO1FBRXJCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBeUJHO1FBQ0gsZ0NBQWlCLENBQUE7UUFFakI7Ozs7V0FJRztRQUNILHNDQUF1QixDQUFBO1FBRXZCOzs7O1dBSUc7UUFDSCxvQ0FBcUIsQ0FBQTtRQUVyQjs7OztXQUlHO1FBQ0gscUNBQXNCLENBQUE7UUFFdEI7Ozs7V0FJRztRQUNILG1DQUFvQixDQUFBO1FBRXBCOzs7Ozs7Ozs7Ozs7OztXQWNHO1FBQ0gsNkJBQWMsQ0FBQTtRQUVk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