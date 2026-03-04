/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/ime", "vs/base/common/lifecycle", "vs/nls", "vs/platform/keybinding/common/keybindingResolver"], function (require, exports, arrays, async_1, errors_1, event_1, ime_1, lifecycle_1, nls, keybindingResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractKeybindingService = void 0;
    const HIGH_FREQ_COMMANDS = /^(cursor|delete|undo|redo|tab|editor\.action\.clipboard)/;
    class AbstractKeybindingService extends lifecycle_1.Disposable {
        get onDidUpdateKeybindings() {
            return this._onDidUpdateKeybindings ? this._onDidUpdateKeybindings.event : event_1.Event.None; // Sinon stubbing walks properties on prototype
        }
        get inChordMode() {
            return this._currentChords.length > 0;
        }
        constructor(_contextKeyService, _commandService, _telemetryService, _notificationService, _logService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._commandService = _commandService;
            this._telemetryService = _telemetryService;
            this._notificationService = _notificationService;
            this._logService = _logService;
            this._onDidUpdateKeybindings = this._register(new event_1.Emitter());
            this._currentChords = [];
            this._currentChordChecker = new async_1.IntervalTimer();
            this._currentChordStatusMessage = null;
            this._ignoreSingleModifiers = KeybindingModifierSet.EMPTY;
            this._currentSingleModifier = null;
            this._currentSingleModifierClearTimeout = new async_1.TimeoutTimer();
            this._currentlyDispatchingCommandId = null;
            this._logging = false;
        }
        dispose() {
            super.dispose();
        }
        getDefaultKeybindingsContent() {
            return '';
        }
        toggleLogging() {
            this._logging = !this._logging;
            return this._logging;
        }
        _log(str) {
            if (this._logging) {
                this._logService.info(`[KeybindingService]: ${str}`);
            }
        }
        getDefaultKeybindings() {
            return this._getResolver().getDefaultKeybindings();
        }
        getKeybindings() {
            return this._getResolver().getKeybindings();
        }
        customKeybindingsCount() {
            return 0;
        }
        lookupKeybindings(commandId) {
            return arrays.coalesce(this._getResolver().lookupKeybindings(commandId).map(item => item.resolvedKeybinding));
        }
        lookupKeybinding(commandId, context) {
            const result = this._getResolver().lookupPrimaryKeybinding(commandId, context || this._contextKeyService);
            if (!result) {
                return undefined;
            }
            return result.resolvedKeybinding;
        }
        dispatchEvent(e, target) {
            return this._dispatch(e, target);
        }
        // TODO@ulugbekna: update namings to align with `_doDispatch`
        // TODO@ulugbekna: this fn doesn't seem to take into account single-modifier keybindings, eg `shift shift`
        softDispatch(e, target) {
            this._log(`/ Soft dispatching keyboard event`);
            const keybinding = this.resolveKeyboardEvent(e);
            if (keybinding.hasMultipleChords()) {
                console.warn('keyboard event should not be mapped to multiple chords');
                return keybindingResolver_1.NoMatchingKb;
            }
            const [firstChord,] = keybinding.getDispatchChords();
            if (firstChord === null) {
                // cannot be dispatched, probably only modifier keys
                this._log(`\\ Keyboard event cannot be dispatched`);
                return keybindingResolver_1.NoMatchingKb;
            }
            const contextValue = this._contextKeyService.getContext(target);
            const currentChords = this._currentChords.map((({ keypress }) => keypress));
            return this._getResolver().resolve(contextValue, currentChords, firstChord);
        }
        _scheduleLeaveChordMode() {
            const chordLastInteractedTime = Date.now();
            this._currentChordChecker.cancelAndSet(() => {
                if (!this._documentHasFocus()) {
                    // Focus has been lost => leave chord mode
                    this._leaveChordMode();
                    return;
                }
                if (Date.now() - chordLastInteractedTime > 5000) {
                    // 5 seconds elapsed => leave chord mode
                    this._leaveChordMode();
                }
            }, 500);
        }
        _expectAnotherChord(firstChord, keypressLabel) {
            this._currentChords.push({ keypress: firstChord, label: keypressLabel });
            switch (this._currentChords.length) {
                case 0:
                    throw (0, errors_1.illegalState)('impossible');
                case 1:
                    // TODO@ulugbekna: revise this message and the one below (at least, fix terminology)
                    this._currentChordStatusMessage = this._notificationService.status(nls.localize('first.chord', "({0}) was pressed. Waiting for second key of chord...", keypressLabel));
                    break;
                default: {
                    const fullKeypressLabel = this._currentChords.map(({ label }) => label).join(', ');
                    this._currentChordStatusMessage = this._notificationService.status(nls.localize('next.chord', "({0}) was pressed. Waiting for next key of chord...", fullKeypressLabel));
                }
            }
            this._scheduleLeaveChordMode();
            if (ime_1.IME.enabled) {
                ime_1.IME.disable();
            }
        }
        _leaveChordMode() {
            if (this._currentChordStatusMessage) {
                this._currentChordStatusMessage.dispose();
                this._currentChordStatusMessage = null;
            }
            this._currentChordChecker.cancel();
            this._currentChords = [];
            ime_1.IME.enable();
        }
        dispatchByUserSettingsLabel(userSettingsLabel, target) {
            this._log(`/ Dispatching keybinding triggered via menu entry accelerator - ${userSettingsLabel}`);
            const keybindings = this.resolveUserBinding(userSettingsLabel);
            if (keybindings.length === 0) {
                this._log(`\\ Could not resolve - ${userSettingsLabel}`);
            }
            else {
                this._doDispatch(keybindings[0], target, /*isSingleModiferChord*/ false);
            }
        }
        _dispatch(e, target) {
            return this._doDispatch(this.resolveKeyboardEvent(e), target, /*isSingleModiferChord*/ false);
        }
        _singleModifierDispatch(e, target) {
            const keybinding = this.resolveKeyboardEvent(e);
            const [singleModifier,] = keybinding.getSingleModifierDispatchChords();
            if (singleModifier) {
                if (this._ignoreSingleModifiers.has(singleModifier)) {
                    this._log(`+ Ignoring single modifier ${singleModifier} due to it being pressed together with other keys.`);
                    this._ignoreSingleModifiers = KeybindingModifierSet.EMPTY;
                    this._currentSingleModifierClearTimeout.cancel();
                    this._currentSingleModifier = null;
                    return false;
                }
                this._ignoreSingleModifiers = KeybindingModifierSet.EMPTY;
                if (this._currentSingleModifier === null) {
                    // we have a valid `singleModifier`, store it for the next keyup, but clear it in 300ms
                    this._log(`+ Storing single modifier for possible chord ${singleModifier}.`);
                    this._currentSingleModifier = singleModifier;
                    this._currentSingleModifierClearTimeout.cancelAndSet(() => {
                        this._log(`+ Clearing single modifier due to 300ms elapsed.`);
                        this._currentSingleModifier = null;
                    }, 300);
                    return false;
                }
                if (singleModifier === this._currentSingleModifier) {
                    // bingo!
                    this._log(`/ Dispatching single modifier chord ${singleModifier} ${singleModifier}`);
                    this._currentSingleModifierClearTimeout.cancel();
                    this._currentSingleModifier = null;
                    return this._doDispatch(keybinding, target, /*isSingleModiferChord*/ true);
                }
                this._log(`+ Clearing single modifier due to modifier mismatch: ${this._currentSingleModifier} ${singleModifier}`);
                this._currentSingleModifierClearTimeout.cancel();
                this._currentSingleModifier = null;
                return false;
            }
            // When pressing a modifier and holding it pressed with any other modifier or key combination,
            // the pressed modifiers should no longer be considered for single modifier dispatch.
            const [firstChord,] = keybinding.getChords();
            this._ignoreSingleModifiers = new KeybindingModifierSet(firstChord);
            if (this._currentSingleModifier !== null) {
                this._log(`+ Clearing single modifier due to other key up.`);
            }
            this._currentSingleModifierClearTimeout.cancel();
            this._currentSingleModifier = null;
            return false;
        }
        _doDispatch(userKeypress, target, isSingleModiferChord = false) {
            let shouldPreventDefault = false;
            if (userKeypress.hasMultipleChords()) { // warn - because user can press a single chord at a time
                console.warn('Unexpected keyboard event mapped to multiple chords');
                return false;
            }
            let userPressedChord = null;
            let currentChords = null;
            if (isSingleModiferChord) {
                // The keybinding is the second keypress of a single modifier chord, e.g. "shift shift".
                // A single modifier can only occur when the same modifier is pressed in short sequence,
                // hence we disregard `_currentChord` and use the same modifier instead.
                const [dispatchKeyname,] = userKeypress.getSingleModifierDispatchChords();
                userPressedChord = dispatchKeyname;
                currentChords = dispatchKeyname ? [dispatchKeyname] : []; // TODO@ulugbekna: in the `else` case we assign an empty array - make sure `resolve` can handle an empty array well
            }
            else {
                [userPressedChord,] = userKeypress.getDispatchChords();
                currentChords = this._currentChords.map(({ keypress }) => keypress);
            }
            if (userPressedChord === null) {
                this._log(`\\ Keyboard event cannot be dispatched in keydown phase.`);
                // cannot be dispatched, probably only modifier keys
                return shouldPreventDefault;
            }
            const contextValue = this._contextKeyService.getContext(target);
            const keypressLabel = userKeypress.getLabel();
            const resolveResult = this._getResolver().resolve(contextValue, currentChords, userPressedChord);
            switch (resolveResult.kind) {
                case 0 /* ResultKind.NoMatchingKb */: {
                    this._logService.trace('KeybindingService#dispatch', keypressLabel, `[ No matching keybinding ]`);
                    if (this.inChordMode) {
                        const currentChordsLabel = this._currentChords.map(({ label }) => label).join(', ');
                        this._log(`+ Leaving multi-chord mode: Nothing bound to "${currentChordsLabel}, ${keypressLabel}".`);
                        this._notificationService.status(nls.localize('missing.chord', "The key combination ({0}, {1}) is not a command.", currentChordsLabel, keypressLabel), { hideAfter: 10 * 1000 /* 10s */ });
                        this._leaveChordMode();
                        shouldPreventDefault = true;
                    }
                    return shouldPreventDefault;
                }
                case 1 /* ResultKind.MoreChordsNeeded */: {
                    this._logService.trace('KeybindingService#dispatch', keypressLabel, `[ Several keybindings match - more chords needed ]`);
                    shouldPreventDefault = true;
                    this._expectAnotherChord(userPressedChord, keypressLabel);
                    this._log(this._currentChords.length === 1 ? `+ Entering multi-chord mode...` : `+ Continuing multi-chord mode...`);
                    return shouldPreventDefault;
                }
                case 2 /* ResultKind.KbFound */: {
                    this._logService.trace('KeybindingService#dispatch', keypressLabel, `[ Will dispatch command ${resolveResult.commandId} ]`);
                    if (resolveResult.commandId === null || resolveResult.commandId === '') {
                        if (this.inChordMode) {
                            const currentChordsLabel = this._currentChords.map(({ label }) => label).join(', ');
                            this._log(`+ Leaving chord mode: Nothing bound to "${currentChordsLabel}, ${keypressLabel}".`);
                            this._notificationService.status(nls.localize('missing.chord', "The key combination ({0}, {1}) is not a command.", currentChordsLabel, keypressLabel), { hideAfter: 10 * 1000 /* 10s */ });
                            this._leaveChordMode();
                            shouldPreventDefault = true;
                        }
                    }
                    else {
                        if (this.inChordMode) {
                            this._leaveChordMode();
                        }
                        if (!resolveResult.isBubble) {
                            shouldPreventDefault = true;
                        }
                        this._log(`+ Invoking command ${resolveResult.commandId}.`);
                        this._currentlyDispatchingCommandId = resolveResult.commandId;
                        try {
                            if (typeof resolveResult.commandArgs === 'undefined') {
                                this._commandService.executeCommand(resolveResult.commandId).then(undefined, err => this._notificationService.warn(err));
                            }
                            else {
                                this._commandService.executeCommand(resolveResult.commandId, resolveResult.commandArgs).then(undefined, err => this._notificationService.warn(err));
                            }
                        }
                        finally {
                            this._currentlyDispatchingCommandId = null;
                        }
                        if (!HIGH_FREQ_COMMANDS.test(resolveResult.commandId)) {
                            this._telemetryService.publicLog2('workbenchActionExecuted', { id: resolveResult.commandId, from: 'keybinding', detail: userKeypress.getUserSettingsLabel() ?? undefined });
                        }
                    }
                    return shouldPreventDefault;
                }
            }
        }
        mightProducePrintableCharacter(event) {
            if (event.ctrlKey || event.metaKey) {
                // ignore ctrl/cmd-combination but not shift/alt-combinatios
                return false;
            }
            // weak check for certain ranges. this is properly implemented in a subclass
            // with access to the KeyboardMapperFactory.
            if ((event.keyCode >= 31 /* KeyCode.KeyA */ && event.keyCode <= 56 /* KeyCode.KeyZ */)
                || (event.keyCode >= 21 /* KeyCode.Digit0 */ && event.keyCode <= 30 /* KeyCode.Digit9 */)) {
                return true;
            }
            return false;
        }
    }
    exports.AbstractKeybindingService = AbstractKeybindingService;
    class KeybindingModifierSet {
        static { this.EMPTY = new KeybindingModifierSet(null); }
        constructor(source) {
            this._ctrlKey = source ? source.ctrlKey : false;
            this._shiftKey = source ? source.shiftKey : false;
            this._altKey = source ? source.altKey : false;
            this._metaKey = source ? source.metaKey : false;
        }
        has(modifier) {
            switch (modifier) {
                case 'ctrl': return this._ctrlKey;
                case 'shift': return this._shiftKey;
                case 'alt': return this._altKey;
                case 'meta': return this._metaKey;
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RLZXliaW5kaW5nU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2tleWJpbmRpbmcvY29tbW9uL2Fic3RyYWN0S2V5YmluZGluZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkJoRyxNQUFNLGtCQUFrQixHQUFHLDBEQUEwRCxDQUFDO0lBRXRGLE1BQXNCLHlCQUEwQixTQUFRLHNCQUFVO1FBS2pFLElBQUksc0JBQXNCO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsK0NBQStDO1FBQ3ZJLENBQUM7UUFvQkQsSUFBVyxXQUFXO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxZQUNTLGtCQUFzQyxFQUNwQyxlQUFnQyxFQUNoQyxpQkFBb0MsRUFDdEMsb0JBQTBDLEVBQ3hDLFdBQXdCO1lBRWxDLEtBQUssRUFBRSxDQUFDO1lBTkEsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUNwQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDaEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUN0Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ3hDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBaENoQiw0QkFBdUIsR0FBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFvQy9GLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJ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