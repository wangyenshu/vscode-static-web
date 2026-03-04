/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/keybindings", "vs/base/common/keybindingLabels", "vs/platform/keybinding/common/baseResolvedKeybinding", "vs/platform/keybinding/common/resolvedKeybindingItem"], function (require, exports, keyCodes_1, keybindings_1, keybindingLabels_1, baseResolvedKeybinding_1, resolvedKeybindingItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowsKeyboardMapper = exports.WindowsNativeResolvedKeybinding = void 0;
    const LOG = false;
    function log(str) {
        if (LOG) {
            console.info(str);
        }
    }
    class WindowsNativeResolvedKeybinding extends baseResolvedKeybinding_1.BaseResolvedKeybinding {
        constructor(mapper, chords) {
            super(1 /* OperatingSystem.Windows */, chords);
            this._mapper = mapper;
        }
        _getLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return this._mapper.getUILabelForKeyCode(chord.keyCode);
        }
        _getUSLabelForKeybinding(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return keyCodes_1.KeyCodeUtils.toString(chord.keyCode);
        }
        getUSLabel() {
            return keybindingLabels_1.UILabelProvider.toLabel(this._os, this._chords, (keybinding) => this._getUSLabelForKeybinding(keybinding));
        }
        _getAriaLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return this._mapper.getAriaLabelForKeyCode(chord.keyCode);
        }
        _getElectronAccelerator(chord) {
            return this._mapper.getElectronAcceleratorForKeyBinding(chord);
        }
        _getUserSettingsLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            const result = this._mapper.getUserSettingsLabelForKeyCode(chord.keyCode);
            return (result ? result.toLowerCase() : result);
        }
        _isWYSIWYG(chord) {
            return this.__isWYSIWYG(chord.keyCode);
        }
        __isWYSIWYG(keyCode) {
            if (keyCode === 15 /* KeyCode.LeftArrow */
                || keyCode === 16 /* KeyCode.UpArrow */
                || keyCode === 17 /* KeyCode.RightArrow */
                || keyCode === 18 /* KeyCode.DownArrow */) {
                return true;
            }
            const ariaLabel = this._mapper.getAriaLabelForKeyCode(keyCode);
            const userSettingsLabel = this._mapper.getUserSettingsLabelForKeyCode(keyCode);
            return (ariaLabel === userSettingsLabel);
        }
        _getChordDispatch(chord) {
            if (chord.isModifierKey()) {
                return null;
            }
            let result = '';
            if (chord.ctrlKey) {
                result += 'ctrl+';
            }
            if (chord.shiftKey) {
                result += 'shift+';
            }
            if (chord.altKey) {
                result += 'alt+';
            }
            if (chord.metaKey) {
                result += 'meta+';
            }
            result += keyCodes_1.KeyCodeUtils.toString(chord.keyCode);
            return result;
        }
        _getSingleModifierChordDispatch(chord) {
            if (chord.keyCode === 5 /* KeyCode.Ctrl */ && !chord.shiftKey && !chord.altKey && !chord.metaKey) {
                return 'ctrl';
            }
            if (chord.keyCode === 4 /* KeyCode.Shift */ && !chord.ctrlKey && !chord.altKey && !chord.metaKey) {
                return 'shift';
            }
            if (chord.keyCode === 6 /* KeyCode.Alt */ && !chord.ctrlKey && !chord.shiftKey && !chord.metaKey) {
                return 'alt';
            }
            if (chord.keyCode === 57 /* KeyCode.Meta */ && !chord.ctrlKey && !chord.shiftKey && !chord.altKey) {
                return 'meta';
            }
            return null;
        }
        static getProducedCharCode(chord, mapping) {
            if (!mapping) {
                return null;
            }
            if (chord.ctrlKey && chord.shiftKey && chord.altKey) {
                return mapping.withShiftAltGr;
            }
            if (chord.ctrlKey && chord.altKey) {
                return mapping.withAltGr;
            }
            if (chord.shiftKey) {
                return mapping.withShift;
            }
            return mapping.value;
        }
        static getProducedChar(chord, mapping) {
            const char = this.getProducedCharCode(chord, mapping);
            if (char === null || char.length === 0) {
                return ' --- ';
            }
            return '  ' + char + '  ';
        }
    }
    exports.WindowsNativeResolvedKeybinding = WindowsNativeResolvedKeybinding;
    class WindowsKeyboardMapper {
        constructor(_isUSStandard, rawMappings, _mapAltGrToCtrlAlt) {
            this._isUSStandard = _isUSStandard;
            this._mapAltGrToCtrlAlt = _mapAltGrToCtrlAlt;
            this._keyCodeToLabel = [];
            this._scanCodeToKeyCode = [];
            this._keyCodeToLabel = [];
            this._keyCodeExists = [];
            this._keyCodeToLabel[0 /* KeyCode.Unknown */] = keyCodes_1.KeyCodeUtils.toString(0 /* KeyCode.Unknown */);
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                const immutableKeyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode];
                if (immutableKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                    this._scanCodeToKeyCode[scanCode] = immutableKeyCode;
                    this._keyCodeToLabel[immutableKeyCode] = keyCodes_1.KeyCodeUtils.toString(immutableKeyCode);
                    this._keyCodeExists[immutableKeyCode] = true;
                }
            }
            const producesLetter = [];
            let producesLetters = false;
            this._codeInfo = [];
            for (const strCode in rawMappings) {
                if (rawMappings.hasOwnProperty(strCode)) {
                    const scanCode = keyCodes_1.ScanCodeUtils.toEnum(strCode);
                    if (scanCode === 0 /* ScanCode.None */) {
                        log(`Unknown scanCode ${strCode} in mapping.`);
                        continue;
                    }
                    const rawMapping = rawMappings[strCode];
                    const immutableKeyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode];
                    if (immutableKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                        const keyCode = keyCodes_1.NATIVE_WINDOWS_KEY_CODE_TO_KEY_CODE[rawMapping.vkey] || 0 /* KeyCode.Unknown */;
                        if (keyCode === 0 /* KeyCode.Unknown */ || immutableKeyCode === keyCode) {
                            continue;
                        }
                        if (scanCode !== 134 /* ScanCode.NumpadComma */) {
                            // Looks like ScanCode.NumpadComma doesn't always map to KeyCode.NUMPAD_SEPARATOR
                            // e.g. on POR - PTB
                            continue;
                        }
                    }
                    const value = rawMapping.value;
                    const withShift = rawMapping.withShift;
                    const withAltGr = rawMapping.withAltGr;
                    const withShiftAltGr = rawMapping.withShiftAltGr;
                    const keyCode = keyCodes_1.NATIVE_WINDOWS_KEY_CODE_TO_KEY_CODE[rawMapping.vkey] || 0 /* KeyCode.Unknown */;
                    const mapping = {
                        scanCode: scanCode,
                        keyCode: keyCode,
                        value: value,
                        withShift: withShift,
                        withAltGr: withAltGr,
                        withShiftAltGr: withShiftAltGr,
                    };
                    this._codeInfo[scanCode] = mapping;
                    this._scanCodeToKeyCode[scanCode] = keyCode;
                    if (keyCode === 0 /* KeyCode.Unknown */) {
                        continue;
                    }
                    this._keyCodeExists[keyCode] = true;
                    if (value.length === 0) {
                        // This key does not produce strings
                        this._keyCodeToLabel[keyCode] = null;
                    }
                    else if (value.length > 1) {
                        // This key produces a letter representable with multiple UTF-16 code units.
                        this._keyCodeToLabel[keyCode] = value;
                    }
                    else {
                        const charCode = value.charCodeAt(0);
                        if (charCode >= 97 /* CharCode.a */ && charCode <= 122 /* CharCode.z */) {
                            const upperCaseValue = 65 /* CharCode.A */ + (charCode - 97 /* CharCode.a */);
                            producesLetter[upperCaseValue] = true;
                            producesLetters = true;
                            this._keyCodeToLabel[keyCode] = String.fromCharCode(65 /* CharCode.A */ + (charCode - 97 /* CharCode.a */));
                        }
                        else if (charCode >= 65 /* CharCode.A */ && charCode <= 90 /* CharCode.Z */) {
                            producesLetter[charCode] = true;
                            producesLetters = true;
                            this._keyCodeToLabel[keyCode] = value;
                        }
                        else {
                            this._keyCodeToLabel[keyCode] = value;
                        }
                    }
                }
            }
            // Handle keyboard layouts where latin characters are not produced e.g. Cyrillic
            const _registerLetterIfMissing = (charCode, keyCode) => {
                if (!producesLetter[charCode]) {
                    this._keyCodeToLabel[keyCode] = String.fromCharCode(charCode);
                }
            };
            _registerLetterIfMissing(65 /* CharCode.A */, 31 /* KeyCode.KeyA */);
            _registerLetterIfMissing(66 /* CharCode.B */, 32 /* KeyCode.KeyB */);
            _registerLetterIfMissing(67 /* CharCode.C */, 33 /* KeyCode.KeyC */);
            _registerLetterIfMissing(68 /* CharCode.D */, 34 /* KeyCode.KeyD */);
            _registerLetterIfMissing(69 /* CharCode.E */, 35 /* KeyCode.KeyE */);
            _registerLetterIfMissing(70 /* CharCode.F */, 36 /* KeyCode.KeyF */);
            _registerLetterIfMissing(71 /* CharCode.G */, 37 /* KeyCode.KeyG */);
            _registerLetterIfMissing(72 /* CharCode.H */, 38 /* KeyCode.KeyH */);
            _registerLetterIfMissing(73 /* CharCode.I */, 39 /* KeyCode.KeyI */);
            _registerLetterIfMissing(74 /* CharCode.J */, 40 /* KeyCode.KeyJ */);
            _registerLetterIfMissing(75 /* CharCode.K */, 41 /* KeyCode.KeyK */);
            _registerLetterIfMissing(76 /* CharCode.L */, 42 /* KeyCode.KeyL */);
            _registerLetterIfMissing(77 /* CharCode.M */, 43 /* KeyCode.KeyM */);
            _registerLetterIfMissing(78 /* CharCode.N */, 44 /* KeyCode.KeyN */);
            _registerLetterIfMissing(79 /* CharCode.O */, 45 /* KeyCode.KeyO */);
            _registerLetterIfMissing(80 /* CharCode.P */, 46 /* KeyCode.KeyP */);
            _registerLetterIfMissing(81 /* CharCode.Q */, 47 /* KeyCode.KeyQ */);
            _registerLetterIfMissing(82 /* CharCode.R */, 48 /* KeyCode.KeyR */);
            _registerLetterIfMissing(83 /* CharCode.S */, 49 /* KeyCode.KeyS */);
            _registerLetterIfMissing(84 /* CharCode.T */, 50 /* KeyCode.KeyT */);
            _registerLetterIfMissing(85 /* CharCode.U */, 51 /* KeyCode.KeyU */);
            _registerLetterIfMissing(86 /* CharCode.V */, 52 /* KeyCode.KeyV */);
            _registerLetterIfMissing(87 /* CharCode.W */, 53 /* KeyCode.KeyW */);
            _registerLetterIfMissing(88 /* CharCode.X */, 54 /* KeyCode.KeyX */);
            _registerLetterIfMissing(89 /* CharCode.Y */, 55 /* KeyCode.KeyY */);
            _registerLetterIfMissing(90 /* CharCode.Z */, 56 /* KeyCode.KeyZ */);
            if (!producesLetters) {
                // Since this keyboard layout produces no latin letters at all, most of the UI will use the
                // US kb layout equivalent for UI labels, so also try to render other keys with the US labels
                // for consistency...
                const _registerLabel = (keyCode, charCode) => {
                    // const existingLabel = this._keyCodeToLabel[keyCode];
                    // const existingCharCode = (existingLabel ? existingLabel.charCodeAt(0) : CharCode.Null);
                    // if (existingCharCode < 32 || existingCharCode > 126) {
                    this._keyCodeToLabel[keyCode] = String.fromCharCode(charCode);
                    // }
                };
                _registerLabel(85 /* KeyCode.Semicolon */, 59 /* CharCode.Semicolon */);
                _registerLabel(86 /* KeyCode.Equal */, 61 /* CharCode.Equals */);
                _registerLabel(87 /* KeyCode.Comma */, 44 /* CharCode.Comma */);
                _registerLabel(88 /* KeyCode.Minus */, 45 /* CharCode.Dash */);
                _registerLabel(89 /* KeyCode.Period */, 46 /* CharCode.Period */);
                _registerLabel(90 /* KeyCode.Slash */, 47 /* CharCode.Slash */);
                _registerLabel(91 /* KeyCode.Backquote */, 96 /* CharCode.BackTick */);
                _registerLabel(92 /* KeyCode.BracketLeft */, 91 /* CharCode.OpenSquareBracket */);
                _registerLabel(93 /* KeyCode.Backslash */, 92 /* CharCode.Backslash */);
                _registerLabel(94 /* KeyCode.BracketRight */, 93 /* CharCode.CloseSquareBracket */);
                _registerLabel(95 /* KeyCode.Quote */, 39 /* CharCode.SingleQuote */);
            }
        }
        dumpDebugInfo() {
            const result = [];
            const immutableSamples = [
                88 /* ScanCode.ArrowUp */,
                104 /* ScanCode.Numpad0 */
            ];
            let cnt = 0;
            result.push(`-----------------------------------------------------------------------------------------------------------------------------------------`);
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                if (keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode] !== -1 /* KeyCode.DependsOnKbLayout */) {
                    if (immutableSamples.indexOf(scanCode) === -1) {
                        continue;
                    }
                }
                if (cnt % 6 === 0) {
                    result.push(`|       HW Code combination      |  Key  |    KeyCode combination    |          UI label         |        User settings       | WYSIWYG |`);
                    result.push(`-----------------------------------------------------------------------------------------------------------------------------------------`);
                }
                cnt++;
                const mapping = this._codeInfo[scanCode];
                const strCode = keyCodes_1.ScanCodeUtils.toString(scanCode);
                const mods = [0b000, 0b010, 0b101, 0b111];
                for (const mod of mods) {
                    const ctrlKey = (mod & 0b001) ? true : false;
                    const shiftKey = (mod & 0b010) ? true : false;
                    const altKey = (mod & 0b100) ? true : false;
                    const scanCodeChord = new keybindings_1.ScanCodeChord(ctrlKey, shiftKey, altKey, false, scanCode);
                    const keyCodeChord = this._resolveChord(scanCodeChord);
                    const strKeyCode = (keyCodeChord ? keyCodes_1.KeyCodeUtils.toString(keyCodeChord.keyCode) : null);
                    const resolvedKb = (keyCodeChord ? new WindowsNativeResolvedKeybinding(this, [keyCodeChord]) : null);
                    const outScanCode = `${ctrlKey ? 'Ctrl+' : ''}${shiftKey ? 'Shift+' : ''}${altKey ? 'Alt+' : ''}${strCode}`;
                    const ariaLabel = (resolvedKb ? resolvedKb.getAriaLabel() : null);
                    const outUILabel = (ariaLabel ? ariaLabel.replace(/Control\+/, 'Ctrl+') : null);
                    const outUserSettings = (resolvedKb ? resolvedKb.getUserSettingsLabel() : null);
                    const outKey = WindowsNativeResolvedKeybinding.getProducedChar(scanCodeChord, mapping);
                    const outKb = (strKeyCode ? `${ctrlKey ? 'Ctrl+' : ''}${shiftKey ? 'Shift+' : ''}${altKey ? 'Alt+' : ''}${strKeyCode}` : null);
                    const isWYSIWYG = (resolvedKb ? resolvedKb.isWYSIWYG() : false);
                    const outWYSIWYG = (isWYSIWYG ? '       ' : '   NO  ');
                    result.push(`| ${this._leftPad(outScanCode, 30)} | ${outKey} | ${this._leftPad(outKb, 25)} | ${this._leftPad(outUILabel, 25)} |  ${this._leftPad(outUserSettings, 25)} | ${outWYSIWYG} |`);
                }
                result.push(`-----------------------------------------------------------------------------------------------------------------------------------------`);
            }
            return result.join('\n');
        }
        _leftPad(str, cnt) {
            if (str === null) {
                str = 'null';
            }
            while (str.length < cnt) {
                str = ' ' + str;
            }
            return str;
        }
        getUILabelForKeyCode(keyCode) {
            return this._getLabelForKeyCode(keyCode);
        }
        getAriaLabelForKeyCode(keyCode) {
            return this._getLabelForKeyCode(keyCode);
        }
        getUserSettingsLabelForKeyCode(keyCode) {
            if (this._isUSStandard) {
                return keyCodes_1.KeyCodeUtils.toUserSettingsUS(keyCode);
            }
            return keyCodes_1.KeyCodeUtils.toUserSettingsGeneral(keyCode);
        }
        getElectronAcceleratorForKeyBinding(chord) {
            return keyCodes_1.KeyCodeUtils.toElectronAccelerator(chord.keyCode);
        }
        _getLabelForKeyCode(keyCode) {
            return this._keyCodeToLabel[keyCode] || keyCodes_1.KeyCodeUtils.toString(0 /* KeyCode.Unknown */);
        }
        resolveKeyboardEvent(keyboardEvent) {
            const ctrlKey = keyboardEvent.ctrlKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey);
            const altKey = keyboardEvent.altKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey);
            const chord = new keybindings_1.KeyCodeChord(ctrlKey, keyboardEvent.shiftKey, altKey, keyboardEvent.metaKey, keyboardEvent.keyCode);
            return new WindowsNativeResolvedKeybinding(this, [chord]);
        }
        _resolveChord(chord) {
            if (!chord) {
                return null;
            }
            if (chord instanceof keybindings_1.KeyCodeChord) {
                if (!this._keyCodeExists[chord.keyCode]) {
                    return null;
                }
                return chord;
            }
            const keyCode = this._scanCodeToKeyCode[chord.scanCode] || 0 /* KeyCode.Unknown */;
            if (keyCode === 0 /* KeyCode.Unknown */ || !this._keyCodeExists[keyCode]) {
                return null;
            }
            return new keybindings_1.KeyCodeChord(chord.ctrlKey, chord.shiftKey, chord.altKey, chord.metaKey, keyCode);
        }
        resolveKeybinding(keybinding) {
            const chords = (0, resolvedKeybindingItem_1.toEmptyArrayIfContainsNull)(keybinding.chords.map(chord => this._resolveChord(chord)));
            if (chords.length > 0) {
                return [new WindowsNativeResolvedKeybinding(this, chords)];
            }
            return [];
        }
    }
    exports.WindowsKeyboardMapper = WindowsKeyboardMapper;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93c0tleWJvYXJkTWFwcGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2tleWJpbmRpbmcvY29tbW9uL3dpbmRvd3NLZXlib2FyZE1hcHBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDO0lBQ2xCLFNBQVMsR0FBRyxDQUFDLEdBQVc7UUFDdkIsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNULE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQztJQUNGLENBQUM7SUFZRCxNQUFhLCtCQUFnQyxTQUFRLCtDQUFvQztRQUl4RixZQUFZLE1BQTZCLEVBQUUsTUFBc0I7WUFDaEUsS0FBSyxrQ0FBMEIsTUFBTSxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdkIsQ0FBQztRQUVTLFNBQVMsQ0FBQyxLQUFtQjtZQUN0QyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVPLHdCQUF3QixDQUFDLEtBQW1CO1lBQ25ELElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBQ0QsT0FBTyx1QkFBWSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUVNLFVBQVU7WUFDaEIsT0FBTyxrQ0FBZSxDQUFDLE9BQU8s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