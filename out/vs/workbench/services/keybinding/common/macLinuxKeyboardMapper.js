/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/keybindings", "vs/platform/keybinding/common/baseResolvedKeybinding"], function (require, exports, keyCodes_1, keybindings_1, baseResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MacLinuxKeyboardMapper = exports.NativeResolvedKeybinding = void 0;
    /**
     * A map from character to key codes.
     * e.g. Contains entries such as:
     *  - '/' => { keyCode: KeyCode.US_SLASH, shiftKey: false }
     *  - '?' => { keyCode: KeyCode.US_SLASH, shiftKey: true }
     */
    const CHAR_CODE_TO_KEY_CODE = [];
    class NativeResolvedKeybinding extends baseResolvedKeybinding_1.BaseResolvedKeybinding {
        constructor(mapper, os, chords) {
            super(os, chords);
            this._mapper = mapper;
        }
        _getLabel(chord) {
            return this._mapper.getUILabelForScanCodeChord(chord);
        }
        _getAriaLabel(chord) {
            return this._mapper.getAriaLabelForScanCodeChord(chord);
        }
        _getElectronAccelerator(chord) {
            return this._mapper.getElectronAcceleratorLabelForScanCodeChord(chord);
        }
        _getUserSettingsLabel(chord) {
            return this._mapper.getUserSettingsLabelForScanCodeChord(chord);
        }
        _isWYSIWYG(binding) {
            if (!binding) {
                return true;
            }
            if (keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[binding.scanCode] !== -1 /* KeyCode.DependsOnKbLayout */) {
                return true;
            }
            const a = this._mapper.getAriaLabelForScanCodeChord(binding);
            const b = this._mapper.getUserSettingsLabelForScanCodeChord(binding);
            if (!a && !b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return (a.toLowerCase() === b.toLowerCase());
        }
        _getChordDispatch(chord) {
            return this._mapper.getDispatchStrForScanCodeChord(chord);
        }
        _getSingleModifierChordDispatch(chord) {
            if ((chord.scanCode === 157 /* ScanCode.ControlLeft */ || chord.scanCode === 161 /* ScanCode.ControlRight */) && !chord.shiftKey && !chord.altKey && !chord.metaKey) {
                return 'ctrl';
            }
            if ((chord.scanCode === 159 /* ScanCode.AltLeft */ || chord.scanCode === 163 /* ScanCode.AltRight */) && !chord.ctrlKey && !chord.shiftKey && !chord.metaKey) {
                return 'alt';
            }
            if ((chord.scanCode === 158 /* ScanCode.ShiftLeft */ || chord.scanCode === 162 /* ScanCode.ShiftRight */) && !chord.ctrlKey && !chord.altKey && !chord.metaKey) {
                return 'shift';
            }
            if ((chord.scanCode === 160 /* ScanCode.MetaLeft */ || chord.scanCode === 164 /* ScanCode.MetaRight */) && !chord.ctrlKey && !chord.shiftKey && !chord.altKey) {
                return 'meta';
            }
            return null;
        }
    }
    exports.NativeResolvedKeybinding = NativeResolvedKeybinding;
    class ScanCodeCombo {
        constructor(ctrlKey, shiftKey, altKey, scanCode) {
            this.ctrlKey = ctrlKey;
            this.shiftKey = shiftKey;
            this.altKey = altKey;
            this.scanCode = scanCode;
        }
        toString() {
            return `${this.ctrlKey ? 'Ctrl+' : ''}${this.shiftKey ? 'Shift+' : ''}${this.altKey ? 'Alt+' : ''}${keyCodes_1.ScanCodeUtils.toString(this.scanCode)}`;
        }
        equals(other) {
            return (this.ctrlKey === other.ctrlKey
                && this.shiftKey === other.shiftKey
                && this.altKey === other.altKey
                && this.scanCode === other.scanCode);
        }
        getProducedCharCode(mapping) {
            if (!mapping) {
                return '';
            }
            if (this.ctrlKey && this.shiftKey && this.altKey) {
                return mapping.withShiftAltGr;
            }
            if (this.ctrlKey && this.altKey) {
                return mapping.withAltGr;
            }
            if (this.shiftKey) {
                return mapping.withShift;
            }
            return mapping.value;
        }
        getProducedChar(mapping) {
            const charCode = MacLinuxKeyboardMapper.getCharCode(this.getProducedCharCode(mapping));
            if (charCode === 0) {
                return ' --- ';
            }
            if (charCode >= 768 /* CharCode.U_Combining_Grave_Accent */ && charCode <= 879 /* CharCode.U_Combining_Latin_Small_Letter_X */) {
                // combining
                return 'U+' + charCode.toString(16);
            }
            return '  ' + String.fromCharCode(charCode) + '  ';
        }
    }
    class KeyCodeCombo {
        constructor(ctrlKey, shiftKey, altKey, keyCode) {
            this.ctrlKey = ctrlKey;
            this.shiftKey = shiftKey;
            this.altKey = altKey;
            this.keyCode = keyCode;
        }
        toString() {
            return `${this.ctrlKey ? 'Ctrl+' : ''}${this.shiftKey ? 'Shift+' : ''}${this.altKey ? 'Alt+' : ''}${keyCodes_1.KeyCodeUtils.toString(this.keyCode)}`;
        }
    }
    class ScanCodeKeyCodeMapper {
        constructor() {
            /**
             * ScanCode combination => KeyCode combination.
             * Only covers relevant modifiers ctrl, shift, alt (since meta does not influence the mappings).
             */
            this._scanCodeToKeyCode = [];
            /**
             * inverse of `_scanCodeToKeyCode`.
             * KeyCode combination => ScanCode combination.
             * Only covers relevant modifiers ctrl, shift, alt (since meta does not influence the mappings).
             */
            this._keyCodeToScanCode = [];
            this._scanCodeToKeyCode = [];
            this._keyCodeToScanCode = [];
        }
        registrationComplete() {
            // IntlHash and IntlBackslash are rare keys, so ensure they don't end up being the preferred...
            this._moveToEnd(56 /* ScanCode.IntlHash */);
            this._moveToEnd(106 /* ScanCode.IntlBackslash */);
        }
        _moveToEnd(scanCode) {
            for (let mod = 0; mod < 8; mod++) {
                const encodedKeyCodeCombos = this._scanCodeToKeyCode[(scanCode << 3) + mod];
                if (!encodedKeyCodeCombos) {
                    continue;
                }
                for (let i = 0, len = encodedKeyCodeCombos.length; i < len; i++) {
                    const encodedScanCodeCombos = this._keyCodeToScanCode[encodedKeyCodeCombos[i]];
                    if (encodedScanCodeCombos.length === 1) {
                        continue;
                    }
                    for (let j = 0, len = encodedScanCodeCombos.length; j < len; j++) {
                        const entry = encodedScanCodeCombos[j];
                        const entryScanCode = (entry >>> 3);
                        if (entryScanCode === scanCode) {
                            // Move this entry to the end
                            for (let k = j + 1; k < len; k++) {
                                encodedScanCodeCombos[k - 1] = encodedScanCodeCombos[k];
                            }
                            encodedScanCodeCombos[len - 1] = entry;
                        }
                    }
                }
            }
        }
        registerIfUnknown(scanCodeCombo, keyCodeCombo) {
            if (keyCodeCombo.keyCode === 0 /* KeyCode.Unknown */) {
                return;
            }
            const scanCodeComboEncoded = this._encodeScanCodeCombo(scanCodeCombo);
            const keyCodeComboEncoded = this._encodeKeyCodeCombo(keyCodeCombo);
            const keyCodeIsDigit = (keyCodeCombo.keyCode >= 21 /* KeyCode.Digit0 */ && keyCodeCombo.keyCode <= 30 /* KeyCode.Digit9 */);
            const keyCodeIsLetter = (keyCodeCombo.keyCode >= 31 /* KeyCode.KeyA */ && keyCodeCombo.keyCode <= 56 /* KeyCode.KeyZ */);
            const existingKeyCodeCombos = this._scanCodeToKeyCode[scanCodeComboEncoded];
            // Allow a scan code to map to multiple key codes if it is a digit or a letter key code
            if (keyCodeIsDigit || keyCodeIsLetter) {
                // Only check that we don't insert the same entry twice
                if (existingKeyCodeCombos) {
                    for (let i = 0, len = existingKeyCodeCombos.length; i < len; i++) {
                        if (existingKeyCodeCombos[i] === keyCodeComboEncoded) {
                            // avoid duplicates
                            return;
                        }
                    }
                }
            }
            else {
                // Don't allow multiples
                if (existingKeyCodeCombos && existingKeyCodeCombos.length !== 0) {
                    return;
                }
            }
            this._scanCodeToKeyCode[scanCodeComboEncoded] = this._scanCodeToKeyCode[scanCodeComboEncoded] || [];
            this._scanCodeToKeyCode[scanCodeComboEncoded].unshift(keyCodeComboEncoded);
            this._keyCodeToScanCode[keyCodeComboEncoded] = this._keyCodeToScanCode[keyCodeComboEncoded] || [];
            this._keyCodeToScanCode[keyCodeComboEncoded].unshift(scanCodeComboEncoded);
        }
        lookupKeyCodeCombo(keyCodeCombo) {
            const keyCodeComboEncoded = this._encodeKeyCodeCombo(keyCodeCombo);
            const scanCodeCombosEncoded = this._keyCodeToScanCode[keyCodeComboEncoded];
            if (!scanCodeCombosEncoded || scanCodeCombosEncoded.length === 0) {
                return [];
            }
            const result = [];
            for (let i = 0, len = scanCodeCombosEncoded.length; i < len; i++) {
                const scanCodeComboEncoded = scanCodeCombosEncoded[i];
                const ctrlKey = (scanCodeComboEncoded & 0b001) ? true : false;
                const shiftKey = (scanCodeComboEncoded & 0b010) ? true : false;
                const altKey = (scanCodeComboEncoded & 0b100) ? true : false;
                const scanCode = (scanCodeComboEncoded >>> 3);
                result[i] = new ScanCodeCombo(ctrlKey, shiftKey, altKey, scanCode);
            }
            return result;
        }
        lookupScanCodeCombo(scanCodeCombo) {
            const scanCodeComboEncoded = this._encodeScanCodeCombo(scanCodeCombo);
            const keyCodeCombosEncoded = this._scanCodeToKeyCode[scanCodeComboEncoded];
            if (!keyCodeCombosEncoded || keyCodeCombosEncoded.length === 0) {
                return [];
            }
            const result = [];
            for (let i = 0, len = keyCodeCombosEncoded.length; i < len; i++) {
                const keyCodeComboEncoded = keyCodeCombosEncoded[i];
                const ctrlKey = (keyCodeComboEncoded & 0b001) ? true : false;
                const shiftKey = (keyCodeComboEncoded & 0b010) ? true : false;
                const altKey = (keyCodeComboEncoded & 0b100) ? true : false;
                const keyCode = (keyCodeComboEncoded >>> 3);
                result[i] = new KeyCodeCombo(ctrlKey, shiftKey, altKey, keyCode);
            }
            return result;
        }
        guessStableKeyCode(scanCode) {
            if (scanCode >= 36 /* ScanCode.Digit1 */ && scanCode <= 45 /* ScanCode.Digit0 */) {
                // digits are ok
                switch (scanCode) {
                    case 36 /* ScanCode.Digit1 */: return 22 /* KeyCode.Digit1 */;
                    case 37 /* ScanCode.Digit2 */: return 23 /* KeyCode.Digit2 */;
                    case 38 /* ScanCode.Digit3 */: return 24 /* KeyCode.Digit3 */;
                    case 39 /* ScanCode.Digit4 */: return 25 /* KeyCode.Digit4 */;
                    case 40 /* ScanCode.Digit5 */: return 26 /* KeyCode.Digit5 */;
                    case 41 /* ScanCode.Digit6 */: return 27 /* KeyCode.Digit6 */;
                    case 42 /* ScanCode.Digit7 */: return 28 /* KeyCode.Digit7 */;
                    case 43 /* ScanCode.Digit8 */: return 29 /* KeyCode.Digit8 */;
                    case 44 /* ScanCode.Digit9 */: return 30 /* KeyCode.Digit9 */;
                    case 45 /* ScanCode.Digit0 */: return 21 /* KeyCode.Digit0 */;
                }
            }
            // Lookup the scanCode with and without shift and see if the keyCode is stable
            const keyCodeCombos1 = this.lookupScanCodeCombo(new ScanCodeCombo(false, false, false, scanCode));
            const keyCodeCombos2 = this.lookupScanCodeCombo(new ScanCodeCombo(false, true, false, scanCode));
            if (keyCodeCombos1.length === 1 && keyCodeCombos2.length === 1) {
                const shiftKey1 = keyCodeCombos1[0].shiftKey;
                const keyCode1 = keyCodeCombos1[0].keyCode;
                const shiftKey2 = keyCodeCombos2[0].shiftKey;
                const keyCode2 = keyCodeCombos2[0].keyCode;
                if (keyCode1 === keyCode2 && shiftKey1 !== shiftKey2) {
                    // This looks like a stable mapping
                    return keyCode1;
                }
            }
            return -1 /* KeyCode.DependsOnKbLayout */;
        }
        _encodeScanCodeCombo(scanCodeCombo) {
            return this._encode(scanCodeCombo.ctrlKey, scanCodeCombo.shiftKey, scanCodeCombo.altKey, scanCodeCombo.scanCode);
        }
        _encodeKeyCodeCombo(keyCodeCombo) {
            return this._encode(keyCodeCombo.ctrlKey, keyCodeCombo.shiftKey, keyCodeCombo.altKey, keyCodeCombo.keyCode);
        }
        _encode(ctrlKey, shiftKey, altKey, principal) {
            return (((ctrlKey ? 1 : 0) << 0)
                | ((shiftKey ? 1 : 0) << 1)
                | ((altKey ? 1 : 0) << 2)
                | principal << 3) >>> 0;
        }
    }
    class MacLinuxKeyboardMapper {
        constructor(_isUSStandard, rawMappings, _mapAltGrToCtrlAlt, _OS) {
            this._isUSStandard = _isUSStandard;
            this._mapAltGrToCtrlAlt = _mapAltGrToCtrlAlt;
            this._OS = _OS;
            /**
             * UI label for a ScanCode.
             */
            this._scanCodeToLabel = [];
            /**
             * Dispatching string for a ScanCode.
             */
            this._scanCodeToDispatch = [];
            this._codeInfo = [];
            this._scanCodeKeyCodeMapper = new ScanCodeKeyCodeMapper();
            this._scanCodeToLabel = [];
            this._scanCodeToDispatch = [];
            const _registerIfUnknown = (hwCtrlKey, hwShiftKey, hwAltKey, scanCode, kbCtrlKey, kbShiftKey, kbAltKey, keyCode) => {
                this._scanCodeKeyCodeMapper.registerIfUnknown(new ScanCodeCombo(hwCtrlKey ? true : false, hwShiftKey ? true : false, hwAltKey ? true : false, scanCode), new KeyCodeCombo(kbCtrlKey ? true : false, kbShiftKey ? true : false, kbAltKey ? true : false, keyCode));
            };
            const _registerAllCombos = (_ctrlKey, _shiftKey, _altKey, scanCode, keyCode) => {
                for (let ctrlKey = _ctrlKey; ctrlKey <= 1; ctrlKey++) {
                    for (let shiftKey = _shiftKey; shiftKey <= 1; shiftKey++) {
                        for (let altKey = _altKey; altKey <= 1; altKey++) {
                            _registerIfUnknown(ctrlKey, shiftKey, altKey, scanCode, ctrlKey, shiftKey, altKey, keyCode);
                        }
                    }
                }
            };
            // Initialize `_scanCodeToLabel`
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                this._scanCodeToLabel[scanCode] = null;
            }
            // Initialize `_scanCodeToDispatch`
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                this._scanCodeToDispatch[scanCode] = null;
            }
            // Handle immutable mappings
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                const keyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode];
                if (keyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                    _registerAllCombos(0, 0, 0, scanCode, keyCode);
                    this._scanCodeToLabel[scanCode] = keyCodes_1.KeyCodeUtils.toString(keyCode);
                    if (keyCode === 0 /* KeyCode.Unknown */ || keyCode === 5 /* KeyCode.Ctrl */ || keyCode === 57 /* KeyCode.Meta */ || keyCode === 6 /* KeyCode.Alt */ || keyCode === 4 /* KeyCode.Shift */) {
                        this._scanCodeToDispatch[scanCode] = null; // cannot dispatch on this ScanCode
                    }
                    else {
                        this._scanCodeToDispatch[scanCode] = `[${keyCodes_1.ScanCodeUtils.toString(scanCode)}]`;
                    }
                }
            }
            // Try to identify keyboard layouts where characters A-Z are missing
            // and forcibly map them to their corresponding scan codes if that is the case
            const missingLatinLettersOverride = {};
            {
                const producesLatinLetter = [];
                for (const strScanCode in rawMappings) {
                    if (rawMappings.hasOwnProperty(strScanCode)) {
                        const scanCode = keyCodes_1.ScanCodeUtils.toEnum(strScanCode);
                        if (scanCode === 0 /* ScanCode.None */) {
                            continue;
                        }
                        if (keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode] !== -1 /* KeyCode.DependsOnKbLayout */) {
                            continue;
                        }
                        const rawMapping = rawMappings[strScanCode];
                        const value = MacLinuxKeyboardMapper.getCharCode(rawMapping.value);
                        if (value >= 97 /* CharCode.a */ && value <= 122 /* CharCode.z */) {
                            const upperCaseValue = 65 /* CharCode.A */ + (value - 97 /* CharCode.a */);
                            producesLatinLetter[upperCaseValue] = true;
                        }
                    }
                }
                const _registerLetterIfMissing = (charCode, scanCode, value, withShift) => {
                    if (!producesLatinLetter[charCode]) {
                        missingLatinLettersOverride[keyCodes_1.ScanCodeUtils.toString(scanCode)] = {
                            value: value,
                            withShift: withShift,
                            withAltGr: '',
                            withShiftAltGr: ''
                        };
                    }
                };
                // Ensure letters are mapped
                _registerLetterIfMissing(65 /* CharCode.A */, 10 /* ScanCode.KeyA */, 'a', 'A');
                _registerLetterIfMissing(66 /* CharCode.B */, 11 /* ScanCode.KeyB */, 'b', 'B');
                _registerLetterIfMissing(67 /* CharCode.C */, 12 /* ScanCode.KeyC */, 'c', 'C');
                _registerLetterIfMissing(68 /* CharCode.D */, 13 /* ScanCode.KeyD */, 'd', 'D');
                _registerLetterIfMissing(69 /* CharCode.E */, 14 /* ScanCode.KeyE */, 'e', 'E');
                _registerLetterIfMissing(70 /* CharCode.F */, 15 /* ScanCode.KeyF */, 'f', 'F');
                _registerLetterIfMissing(71 /* CharCode.G */, 16 /* ScanCode.KeyG */, 'g', 'G');
                _registerLetterIfMissing(72 /* CharCode.H */, 17 /* ScanCode.KeyH */, 'h', 'H');
                _registerLetterIfMissing(73 /* CharCode.I */, 18 /* ScanCode.KeyI */, 'i', 'I');
                _registerLetterIfMissing(74 /* CharCode.J */, 19 /* ScanCode.KeyJ */, 'j', 'J');
                _registerLetterIfMissing(75 /* CharCode.K */, 20 /* ScanCode.KeyK */, 'k', 'K');
                _registerLetterIfMissing(76 /* CharCode.L */, 21 /* ScanCode.KeyL */, 'l', 'L');
                _registerLetterIfMissing(77 /* CharCode.M */, 22 /* ScanCode.KeyM */, 'm', 'M');
                _registerLetterIfMissing(78 /* CharCode.N */, 23 /* ScanCode.KeyN */, 'n', 'N');
                _registerLetterIfMissing(79 /* CharCode.O */, 24 /* ScanCode.KeyO */, 'o', 'O');
                _registerLetterIfMissing(80 /* CharCode.P */, 25 /* ScanCode.KeyP */, 'p', 'P');
                _registerLetterIfMissing(81 /* CharCode.Q */, 26 /* ScanCode.KeyQ */, 'q', 'Q');
                _registerLetterIfMissing(82 /* CharCode.R */, 27 /* ScanCode.KeyR */, 'r', 'R');
                _registerLetterIfMissing(83 /* CharCode.S */, 28 /* ScanCode.KeyS */, 's', 'S');
                _registerLetterIfMissing(84 /* CharCode.T */, 29 /* ScanCode.KeyT */, 't', 'T');
                _registerLetterIfMissing(85 /* CharCode.U */, 30 /* ScanCode.KeyU */, 'u', 'U');
                _registerLetterIfMissing(86 /* CharCode.V */, 31 /* ScanCode.KeyV */, 'v', 'V');
                _registerLetterIfMissing(87 /* CharCode.W */, 32 /* ScanCode.KeyW */, 'w', 'W');
                _registerLetterIfMissing(88 /* CharCode.X */, 33 /* ScanCode.KeyX */, 'x', 'X');
                _registerLetterIfMissing(89 /* CharCode.Y */, 34 /* ScanCode.KeyY */, 'y', 'Y');
                _registerLetterIfMissing(90 /* CharCode.Z */, 35 /* ScanCode.KeyZ */, 'z', 'Z');
            }
            const mappings = [];
            let mappingsLen = 0;
            for (const strScanCode in rawMappings) {
                if (rawMappings.hasOwnProperty(strScanCode)) {
                    const scanCode = keyCodes_1.ScanCodeUtils.toEnum(strScanCode);
                    if (scanCode === 0 /* ScanCode.None */) {
                        continue;
                    }
                    if (keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode] !== -1 /* KeyCode.DependsOnKbLayout */) {
                        continue;
                    }
                    this._codeInfo[scanCode] = rawMappings[strScanCode];
                    const rawMapping = missingLatinLettersOverride[strScanCode] || rawMappings[strScanCode];
                    const value = MacLinuxKeyboardMapper.getCharCode(rawMapping.value);
                    const withShift = MacLinuxKeyboardMapper.getCharCode(rawMapping.withShift);
                    const withAltGr = MacLinuxKeyboardMapper.getCharCode(rawMapping.withAltGr);
                    const withShiftAltGr = MacLinuxKeyboardMapper.getCharCode(rawMapping.withShiftAltGr);
                    const mapping = {
                        scanCode: scanCode,
                        value: value,
                        withShift: withShift,
                        withAltGr: withAltGr,
                        withShiftAltGr: withShiftAltGr,
                    };
                    mappings[mappingsLen++] = mapping;
                    this._scanCodeToDispatch[scanCode] = `[${keyCodes_1.ScanCodeUtils.toString(scanCode)}]`;
                    if (value >= 97 /* CharCode.a */ && value <= 122 /* CharCode.z */) {
                        const upperCaseValue = 65 /* CharCode.A */ + (value - 97 /* CharCode.a */);
                        this._scanCodeToLabel[scanCode] = String.fromCharCode(upperCaseValue);
                    }
                    else if (value >= 65 /* CharCode.A */ && value <= 90 /* CharCode.Z */) {
                        this._scanCodeToLabel[scanCode] = String.fromCharCode(value);
                    }
                    else if (value) {
                        this._scanCodeToLabel[scanCode] = String.fromCharCode(value);
                    }
                    else {
                        this._scanCodeToLabel[scanCode] = null;
                    }
                }
            }
            // Handle all `withShiftAltGr` entries
            for (let i = mappings.length - 1; i >= 0; i--) {
                const mapping = mappings[i];
                const scanCode = mapping.scanCode;
                const withShiftAltGr = mapping.withShiftAltGr;
                if (withShiftAltGr === mapping.withAltGr || withShiftAltGr === mapping.withShift || withShiftAltGr === mapping.value) {
                    // handled below
                    continue;
                }
                const kb = MacLinuxKeyboardMapper._charCodeToKb(withShiftAltGr);
                if (!kb) {
                    continue;
                }
                const kbShiftKey = kb.shiftKey;
                const keyCode = kb.keyCode;
                if (kbShiftKey) {
                    // Ctrl+Shift+Alt+ScanCode => Shift+KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 0, 1, 0, keyCode); //       Ctrl+Alt+ScanCode =>          Shift+KeyCode
                }
                else {
                    // Ctrl+Shift+Alt+ScanCode => KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 0, 0, 0, keyCode); //       Ctrl+Alt+ScanCode =>                KeyCode
                }
            }
            // Handle all `withAltGr` entries
            for (let i = mappings.length - 1; i >= 0; i--) {
                const mapping = mappings[i];
                const scanCode = mapping.scanCode;
                const withAltGr = mapping.withAltGr;
                if (withAltGr === mapping.withShift || withAltGr === mapping.value) {
                    // handled below
                    continue;
                }
                const kb = MacLinuxKeyboardMapper._charCodeToKb(withAltGr);
                if (!kb) {
                    continue;
                }
                const kbShiftKey = kb.shiftKey;
                const keyCode = kb.keyCode;
                if (kbShiftKey) {
                    // Ctrl+Alt+ScanCode => Shift+KeyCode
                    _registerIfUnknown(1, 0, 1, scanCode, 0, 1, 0, keyCode); //       Ctrl+Alt+ScanCode =>          Shift+KeyCode
                }
                else {
                    // Ctrl+Alt+ScanCode => KeyCode
                    _registerIfUnknown(1, 0, 1, scanCode, 0, 0, 0, keyCode); //       Ctrl+Alt+ScanCode =>                KeyCode
                }
            }
            // Handle all `withShift` entries
            for (let i = mappings.length - 1; i >= 0; i--) {
                const mapping = mappings[i];
                const scanCode = mapping.scanCode;
                const withShift = mapping.withShift;
                if (withShift === mapping.value) {
                    // handled below
                    continue;
                }
                const kb = MacLinuxKeyboardMapper._charCodeToKb(withShift);
                if (!kb) {
                    continue;
                }
                const kbShiftKey = kb.shiftKey;
                const keyCode = kb.keyCode;
                if (kbShiftKey) {
                    // Shift+ScanCode => Shift+KeyCode
                    _registerIfUnknown(0, 1, 0, scanCode, 0, 1, 0, keyCode); //          Shift+ScanCode =>          Shift+KeyCode
                    _registerIfUnknown(0, 1, 1, scanCode, 0, 1, 1, keyCode); //      Shift+Alt+ScanCode =>      Shift+Alt+KeyCode
                    _registerIfUnknown(1, 1, 0, scanCode, 1, 1, 0, keyCode); //     Ctrl+Shift+ScanCode =>     Ctrl+Shift+KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 1, 1, 1, keyCode); // Ctrl+Shift+Alt+ScanCode => Ctrl+Shift+Alt+KeyCode
                }
                else {
                    // Shift+ScanCode => KeyCode
                    _registerIfUnknown(0, 1, 0, scanCode, 0, 0, 0, keyCode); //          Shift+ScanCode =>                KeyCode
                    _registerIfUnknown(0, 1, 0, scanCode, 0, 1, 0, keyCode); //          Shift+ScanCode =>          Shift+KeyCode
                    _registerIfUnknown(0, 1, 1, scanCode, 0, 0, 1, keyCode); //      Shift+Alt+ScanCode =>            Alt+KeyCode
                    _registerIfUnknown(0, 1, 1, scanCode, 0, 1, 1, keyCode); //      Shift+Alt+ScanCode =>      Shift+Alt+KeyCode
                    _registerIfUnknown(1, 1, 0, scanCode, 1, 0, 0, keyCode); //     Ctrl+Shift+ScanCode =>           Ctrl+KeyCode
                    _registerIfUnknown(1, 1, 0, scanCode, 1, 1, 0, keyCode); //     Ctrl+Shift+ScanCode =>     Ctrl+Shift+KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 1, 0, 1, keyCode); // Ctrl+Shift+Alt+ScanCode =>       Ctrl+Alt+KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 1, 1, 1, keyCode); // Ctrl+Shift+Alt+ScanCode => Ctrl+Shift+Alt+KeyCode
                }
            }
            // Handle all `value` entries
            for (let i = mappings.length - 1; i >= 0; i--) {
                const mapping = mappings[i];
                const scanCode = mapping.scanCode;
                const kb = MacLinuxKeyboardMapper._charCodeToKb(mapping.value);
                if (!kb) {
                    continue;
                }
                const kbShiftKey = kb.shiftKey;
                const keyCode = kb.keyCode;
                if (kbShiftKey) {
                    // ScanCode => Shift+KeyCode
                    _registerIfUnknown(0, 0, 0, scanCode, 0, 1, 0, keyCode); //                ScanCode =>          Shift+KeyCode
                    _registerIfUnknown(0, 0, 1, scanCode, 0, 1, 1, keyCode); //            Alt+ScanCode =>      Shift+Alt+KeyCode
                    _registerIfUnknown(1, 0, 0, scanCode, 1, 1, 0, keyCode); //           Ctrl+ScanCode =>     Ctrl+Shift+KeyCode
                    _registerIfUnknown(1, 0, 1, scanCode, 1, 1, 1, keyCode); //       Ctrl+Alt+ScanCode => Ctrl+Shift+Alt+KeyCode
                }
                else {
                    // ScanCode => KeyCode
                    _registerIfUnknown(0, 0, 0, scanCode, 0, 0, 0, keyCode); //                ScanCode =>                KeyCode
                    _registerIfUnknown(0, 0, 1, scanCode, 0, 0, 1, keyCode); //            Alt+ScanCode =>            Alt+KeyCode
                    _registerIfUnknown(0, 1, 0, scanCode, 0, 1, 0, keyCode); //          Shift+ScanCode =>          Shift+KeyCode
                    _registerIfUnknown(0, 1, 1, scanCode, 0, 1, 1, keyCode); //      Shift+Alt+ScanCode =>      Shift+Alt+KeyCode
                    _registerIfUnknown(1, 0, 0, scanCode, 1, 0, 0, keyCode); //           Ctrl+ScanCode =>           Ctrl+KeyCode
                    _registerIfUnknown(1, 0, 1, scanCode, 1, 0, 1, keyCode); //       Ctrl+Alt+ScanCode =>       Ctrl+Alt+KeyCode
                    _registerIfUnknown(1, 1, 0, scanCode, 1, 1, 0, keyCode); //     Ctrl+Shift+ScanCode =>     Ctrl+Shift+KeyCode
                    _registerIfUnknown(1, 1, 1, scanCode, 1, 1, 1, keyCode); // Ctrl+Shift+Alt+ScanCode => Ctrl+Shift+Alt+KeyCode
                }
            }
            // Handle all left-over available digits
            _registerAllCombos(0, 0, 0, 36 /* ScanCode.Digit1 */, 22 /* KeyCode.Digit1 */);
            _registerAllCombos(0, 0, 0, 37 /* ScanCode.Digit2 */, 23 /* KeyCode.Digit2 */);
            _registerAllCombos(0, 0, 0, 38 /* ScanCode.Digit3 */, 24 /* KeyCode.Digit3 */);
            _registerAllCombos(0, 0, 0, 39 /* ScanCode.Digit4 */, 25 /* KeyCode.Digit4 */);
            _registerAllCombos(0, 0, 0, 40 /* ScanCode.Digit5 */, 26 /* KeyCode.Digit5 */);
            _registerAllCombos(0, 0, 0, 41 /* ScanCode.Digit6 */, 27 /* KeyCode.Digit6 */);
            _registerAllCombos(0, 0, 0, 42 /* ScanCode.Digit7 */, 28 /* KeyCode.Digit7 */);
            _registerAllCombos(0, 0, 0, 43 /* ScanCode.Digit8 */, 29 /* KeyCode.Digit8 */);
            _registerAllCombos(0, 0, 0, 44 /* ScanCode.Digit9 */, 30 /* KeyCode.Digit9 */);
            _registerAllCombos(0, 0, 0, 45 /* ScanCode.Digit0 */, 21 /* KeyCode.Digit0 */);
            this._scanCodeKeyCodeMapper.registrationComplete();
        }
        dumpDebugInfo() {
            const result = [];
            const immutableSamples = [
                88 /* ScanCode.ArrowUp */,
                104 /* ScanCode.Numpad0 */
            ];
            let cnt = 0;
            result.push(`isUSStandard: ${this._isUSStandard}`);
            result.push(`----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------`);
            for (let scanCode = 0 /* ScanCode.None */; scanCode < 193 /* ScanCode.MAX_VALUE */; scanCode++) {
                if (keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode] !== -1 /* KeyCode.DependsOnKbLayout */) {
                    if (immutableSamples.indexOf(scanCode) === -1) {
                        continue;
                    }
                }
                if (cnt % 4 === 0) {
                    result.push(`|       HW Code combination      |  Key  |    KeyCode combination    | Pri |          UI label         |         User settings          |    Electron accelerator   |       Dispatching string       | WYSIWYG |`);
                    result.push(`----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------`);
                }
                cnt++;
                const mapping = this._codeInfo[scanCode];
                for (let mod = 0; mod < 8; mod++) {
                    const hwCtrlKey = (mod & 0b001) ? true : false;
                    const hwShiftKey = (mod & 0b010) ? true : false;
                    const hwAltKey = (mod & 0b100) ? true : false;
                    const scanCodeCombo = new ScanCodeCombo(hwCtrlKey, hwShiftKey, hwAltKey, scanCode);
                    const resolvedKb = this.resolveKeyboardEvent({
                        _standardKeyboardEventBrand: true,
                        ctrlKey: scanCodeCombo.ctrlKey,
                        shiftKey: scanCodeCombo.shiftKey,
                        altKey: scanCodeCombo.altKey,
                        metaKey: false,
                        altGraphKey: false,
                        keyCode: -1 /* KeyCode.DependsOnKbLayout */,
                        code: keyCodes_1.ScanCodeUtils.toString(scanCode)
                    });
                    const outScanCodeCombo = scanCodeCombo.toString();
                    const outKey = scanCodeCombo.getProducedChar(mapping);
                    const ariaLabel = resolvedKb.getAriaLabel();
                    const outUILabel = (ariaLabel ? ariaLabel.replace(/Control\+/, 'Ctrl+') : null);
                    const outUserSettings = resolvedKb.getUserSettingsLabel();
                    const outElectronAccelerator = resolvedKb.getElectronAccelerator();
                    const outDispatchStr = resolvedKb.getDispatchChords()[0];
                    const isWYSIWYG = (resolvedKb ? resolvedKb.isWYSIWYG() : false);
                    const outWYSIWYG = (isWYSIWYG ? '       ' : '   NO  ');
                    const kbCombos = this._scanCodeKeyCodeMapper.lookupScanCodeCombo(scanCodeCombo);
                    if (kbCombos.length === 0) {
                        result.push(`| ${this._leftPad(outScanCodeCombo, 30)} | ${outKey} | ${this._leftPad('', 25)} | ${this._leftPad('', 3)} | ${this._leftPad(outUILabel, 25)} | ${this._leftPad(outUserSettings, 30)} | ${this._leftPad(outElectronAccelerator, 25)} | ${this._leftPad(outDispatchStr, 30)} | ${outWYSIWYG} |`);
                    }
                    else {
                        for (let i = 0, len = kbCombos.length; i < len; i++) {
                            const kbCombo = kbCombos[i];
                            // find out the priority of this scan code for this key code
                            let colPriority;
                            const scanCodeCombos = this._scanCodeKeyCodeMapper.lookupKeyCodeCombo(kbCombo);
                            if (scanCodeCombos.length === 1) {
                                // no need for priority, this key code combo maps to precisely this scan code combo
                                colPriority = '';
                            }
                            else {
                                let priority = -1;
                                for (let j = 0; j < scanCodeCombos.length; j++) {
                                    if (scanCodeCombos[j].equals(scanCodeCombo)) {
                                        priority = j + 1;
                                        break;
                                    }
                                }
                                colPriority = String(priority);
                            }
                            const outKeybinding = kbCombo.toString();
                            if (i === 0) {
                                result.push(`| ${this._leftPad(outScanCodeCombo, 30)} | ${outKey} | ${this._leftPad(outKeybinding, 25)} | ${this._leftPad(colPriority, 3)} | ${this._leftPad(outUILabel, 25)} | ${this._leftPad(outUserSettings, 30)} | ${this._leftPad(outElectronAccelerator, 25)} | ${this._leftPad(outDispatchStr, 30)} | ${outWYSIWYG} |`);
                            }
                            else {
                                // secondary keybindings
                                result.push(`| ${this._leftPad('', 30)} |       | ${this._leftPad(outKeybinding, 25)} | ${this._leftPad(colPriority, 3)} | ${this._leftPad('', 25)} | ${this._leftPad('', 30)} | ${this._leftPad('', 25)} | ${this._leftPad('', 30)} |         |`);
                            }
                        }
                    }
                }
                result.push(`----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------`);
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
        keyCodeChordToScanCodeChord(chord) {
            // Avoid double Enter bindings (both ScanCode.NumpadEnter and ScanCode.Enter point to KeyCode.Enter)
            if (chord.keyCode === 3 /* KeyCode.Enter */) {
                return [new keybindings_1.ScanCodeChord(chord.ctrlKey, chord.shiftKey, chord.altKey, chord.metaKey, 46 /* ScanCode.Enter */)];
            }
            const scanCodeCombos = this._scanCodeKeyCodeMapper.lookupKeyCodeCombo(new KeyCodeCombo(chord.ctrlKey, chord.shiftKey, chord.altKey, chord.keyCode));
            const result = [];
            for (let i = 0, len = scanCodeCombos.length; i < len; i++) {
                const scanCodeCombo = scanCodeCombos[i];
                result[i] = new keybindings_1.ScanCodeChord(scanCodeCombo.ctrlKey, scanCodeCombo.shiftKey, scanCodeCombo.altKey, chord.metaKey, scanCodeCombo.scanCode);
            }
            return result;
        }
        getUILabelForScanCodeChord(chord) {
            if (!chord) {
                return null;
            }
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            if (this._OS === 2 /* OperatingSystem.Macintosh */) {
                switch (chord.scanCode) {
                    case 86 /* ScanCode.ArrowLeft */:
                        return '←';
                    case 88 /* ScanCode.ArrowUp */:
                        return '↑';
                    case 85 /* ScanCode.ArrowRight */:
                        return '→';
                    case 87 /* ScanCode.ArrowDown */:
                        return '↓';
                }
            }
            return this._scanCodeToLabel[chord.scanCode];
        }
        getAriaLabelForScanCodeChord(chord) {
            if (!chord) {
                return null;
            }
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return this._scanCodeToLabel[chord.scanCode];
        }
        getDispatchStrForScanCodeChord(chord) {
            const codeDispatch = this._scanCodeToDispatch[chord.scanCode];
            if (!codeDispatch) {
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
            result += codeDispatch;
            return result;
        }
        getUserSettingsLabelForScanCodeChord(chord) {
            if (!chord) {
                return null;
            }
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            const immutableKeyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[chord.scanCode];
            if (immutableKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                return keyCodes_1.KeyCodeUtils.toUserSettingsUS(immutableKeyCode).toLowerCase();
            }
            // Check if this scanCode always maps to the same keyCode and back
            const constantKeyCode = this._scanCodeKeyCodeMapper.guessStableKeyCode(chord.scanCode);
            if (constantKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                // Verify that this is a good key code that can be mapped back to the same scan code
                const reverseChords = this.keyCodeChordToScanCodeChord(new keybindings_1.KeyCodeChord(chord.ctrlKey, chord.shiftKey, chord.altKey, chord.metaKey, constantKeyCode));
                for (let i = 0, len = reverseChords.length; i < len; i++) {
                    const reverseChord = reverseChords[i];
                    if (reverseChord.scanCode === chord.scanCode) {
                        return keyCodes_1.KeyCodeUtils.toUserSettingsUS(constantKeyCode).toLowerCase();
                    }
                }
            }
            return this._scanCodeToDispatch[chord.scanCode];
        }
        getElectronAcceleratorLabelForScanCodeChord(chord) {
            if (!chord) {
                return null;
            }
            const immutableKeyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[chord.scanCode];
            if (immutableKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                return keyCodes_1.KeyCodeUtils.toElectronAccelerator(immutableKeyCode);
            }
            // Check if this scanCode always maps to the same keyCode and back
            const constantKeyCode = this._scanCodeKeyCodeMapper.guessStableKeyCode(chord.scanCode);
            if (this._OS === 3 /* OperatingSystem.Linux */ && !this._isUSStandard) {
                // [Electron Accelerators] On Linux, Electron does not handle correctly OEM keys.
                // when using a different keyboard layout than US Standard.
                // See https://github.com/microsoft/vscode/issues/23706
                // See https://github.com/microsoft/vscode/pull/134890#issuecomment-941671791
                const isOEMKey = (constantKeyCode === 85 /* KeyCode.Semicolon */
                    || constantKeyCode === 86 /* KeyCode.Equal */
                    || constantKeyCode === 87 /* KeyCode.Comma */
                    || constantKeyCode === 88 /* KeyCode.Minus */
                    || constantKeyCode === 89 /* KeyCode.Period */
                    || constantKeyCode === 90 /* KeyCode.Slash */
                    || constantKeyCode === 91 /* KeyCode.Backquote */
                    || constantKeyCode === 92 /* KeyCode.BracketLeft */
                    || constantKeyCode === 93 /* KeyCode.Backslash */
                    || constantKeyCode === 94 /* KeyCode.BracketRight */);
                if (isOEMKey) {
                    return null;
                }
            }
            if (constantKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                return keyCodes_1.KeyCodeUtils.toElectronAccelerator(constantKeyCode);
            }
            return null;
        }
        _toResolvedKeybinding(chordParts) {
            if (chordParts.length === 0) {
                return [];
            }
            const result = [];
            this._generateResolvedKeybindings(chordParts, 0, [], result);
            return result;
        }
        _generateResolvedKeybindings(chordParts, currentIndex, previousParts, result) {
            const chordPart = chordParts[currentIndex];
            const isFinalIndex = currentIndex === chordParts.length - 1;
            for (let i = 0, len = chordPart.length; i < len; i++) {
                const chords = [...previousParts, chordPart[i]];
                if (isFinalIndex) {
                    result.push(new NativeResolvedKeybinding(this, this._OS, chords));
                }
                else {
                    this._generateResolvedKeybindings(chordParts, currentIndex + 1, chords, result);
                }
            }
        }
        resolveKeyboardEvent(keyboardEvent) {
            let code = keyCodes_1.ScanCodeUtils.toEnum(keyboardEvent.code);
            // Treat NumpadEnter as Enter
            if (code === 94 /* ScanCode.NumpadEnter */) {
                code = 46 /* ScanCode.Enter */;
            }
            const keyCode = keyboardEvent.keyCode;
            if ((keyCode === 15 /* KeyCode.LeftArrow */)
                || (keyCode === 16 /* KeyCode.UpArrow */)
                || (keyCode === 17 /* KeyCode.RightArrow */)
                || (keyCode === 18 /* KeyCode.DownArrow */)
                || (keyCode === 20 /* KeyCode.Delete */)
                || (keyCode === 19 /* KeyCode.Insert */)
                || (keyCode === 14 /* KeyCode.Home */)
                || (keyCode === 13 /* KeyCode.End */)
                || (keyCode === 12 /* KeyCode.PageDown */)
                || (keyCode === 11 /* KeyCode.PageUp */)
                || (keyCode === 1 /* KeyCode.Backspace */)) {
                // "Dispatch" on keyCode for these key codes to workaround issues with remote desktoping software
                // where the scan codes appear to be incorrect (see https://github.com/microsoft/vscode/issues/24107)
                const immutableScanCode = keyCodes_1.IMMUTABLE_KEY_CODE_TO_CODE[keyCode];
                if (immutableScanCode !== -1 /* ScanCode.DependsOnKbLayout */) {
                    code = immutableScanCode;
                }
            }
            else {
                if ((code === 95 /* ScanCode.Numpad1 */)
                    || (code === 96 /* ScanCode.Numpad2 */)
                    || (code === 97 /* ScanCode.Numpad3 */)
                    || (code === 98 /* ScanCode.Numpad4 */)
                    || (code === 99 /* ScanCode.Numpad5 */)
                    || (code === 100 /* ScanCode.Numpad6 */)
                    || (code === 101 /* ScanCode.Numpad7 */)
                    || (code === 102 /* ScanCode.Numpad8 */)
                    || (code === 103 /* ScanCode.Numpad9 */)
                    || (code === 104 /* ScanCode.Numpad0 */)
                    || (code === 105 /* ScanCode.NumpadDecimal */)) {
                    // "Dispatch" on keyCode for all numpad keys in order for NumLock to work correctly
                    if (keyCode >= 0) {
                        const immutableScanCode = keyCodes_1.IMMUTABLE_KEY_CODE_TO_CODE[keyCode];
                        if (immutableScanCode !== -1 /* ScanCode.DependsOnKbLayout */) {
                            code = immutableScanCode;
                        }
                    }
                }
            }
            const ctrlKey = keyboardEvent.ctrlKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey);
            const altKey = keyboardEvent.altKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey);
            const chord = new keybindings_1.ScanCodeChord(ctrlKey, keyboardEvent.shiftKey, altKey, keyboardEvent.metaKey, code);
            return new NativeResolvedKeybinding(this, this._OS, [chord]);
        }
        _resolveChord(chord) {
            if (!chord) {
                return [];
            }
            if (chord instanceof keybindings_1.ScanCodeChord) {
                return [chord];
            }
            return this.keyCodeChordToScanCodeChord(chord);
        }
        resolveKeybinding(keybinding) {
            const chords = keybinding.chords.map(chord => this._resolveChord(chord));
            return this._toResolvedKeybinding(chords);
        }
        static _redirectCharCode(charCode) {
            switch (charCode) {
                // allow-any-unicode-next-line
                // CJK: 。 「 」 【 】 ； ，
                // map: . [ ] [ ] ; ,
                case 12290 /* CharCode.U_IDEOGRAPHIC_FULL_STOP */: return 46 /* CharCode.Period */;
                case 12300 /* CharCode.U_LEFT_CORNER_BRACKET */: return 91 /* CharCode.OpenSquareBracket */;
                case 12301 /* CharCode.U_RIGHT_CORNER_BRACKET */: return 93 /* CharCode.CloseSquareBracket */;
                case 12304 /* CharCode.U_LEFT_BLACK_LENTICULAR_BRACKET */: return 91 /* CharCode.OpenSquareBracket */;
                case 12305 /* CharCode.U_RIGHT_BLACK_LENTICULAR_BRACKET */: return 93 /* CharCode.CloseSquareBracket */;
                case 65307 /* CharCode.U_FULLWIDTH_SEMICOLON */: return 59 /* CharCode.Semicolon */;
                case 65292 /* CharCode.U_FULLWIDTH_COMMA */: return 44 /* CharCode.Comma */;
            }
            return charCode;
        }
        static _charCodeToKb(charCode) {
            charCode = this._redirectCharCode(charCode);
            if (charCode < CHAR_CODE_TO_KEY_CODE.length) {
                return CHAR_CODE_TO_KEY_CODE[charCode];
            }
            return null;
        }
        /**
         * Attempt to map a combining character to a regular one that renders the same way.
         *
         * https://www.compart.com/en/unicode/bidiclass/NSM
         */
        static getCharCode(char) {
            if (char.length === 0) {
                return 0;
            }
            const charCode = char.charCodeAt(0);
            switch (charCode) {
                case 768 /* CharCode.U_Combining_Grave_Accent */: return 96 /* CharCode.U_GRAVE_ACCENT */;
                case 769 /* CharCode.U_Combining_Acute_Accent */: return 180 /* CharCode.U_ACUTE_ACCENT */;
                case 770 /* CharCode.U_Combining_Circumflex_Accent */: return 94 /* CharCode.U_CIRCUMFLEX */;
                case 771 /* CharCode.U_Combining_Tilde */: return 732 /* CharCode.U_SMALL_TILDE */;
                case 772 /* CharCode.U_Combining_Macron */: return 175 /* CharCode.U_MACRON */;
                case 773 /* CharCode.U_Combining_Overline */: return 8254 /* CharCode.U_OVERLINE */;
                case 774 /* CharCode.U_Combining_Breve */: return 728 /* CharCode.U_BREVE */;
                case 775 /* CharCode.U_Combining_Dot_Above */: return 729 /* CharCode.U_DOT_ABOVE */;
                case 776 /* CharCode.U_Combining_Diaeresis */: return 168 /* CharCode.U_DIAERESIS */;
                case 778 /* CharCode.U_Combining_Ring_Above */: return 730 /* CharCode.U_RING_ABOVE */;
                case 779 /* CharCode.U_Combining_Double_Acute_Accent */: return 733 /* CharCode.U_DOUBLE_ACUTE_ACCENT */;
            }
            return charCode;
        }
    }
    exports.MacLinuxKeyboardMapper = MacLinuxKeyboardMapper;
    (function () {
        function define(charCode, keyCode, shiftKey) {
            for (let i = CHAR_CODE_TO_KEY_CODE.length; i < charCode; i++) {
                CHAR_CODE_TO_KEY_CODE[i] = null;
            }
            CHAR_CODE_TO_KEY_CODE[charCode] = { keyCode: keyCode, shiftKey: shiftKey };
        }
        for (let chCode = 65 /* CharCode.A */; chCode <= 90 /* CharCode.Z */; chCode++) {
            define(chCode, 31 /* KeyCode.KeyA */ + (chCode - 65 /* CharCode.A */), true);
        }
        for (let chCode = 97 /* CharCode.a */; chCode <= 122 /* CharCode.z */; chCode++) {
            define(chCode, 31 /* KeyCode.KeyA */ + (chCode - 97 /* CharCode.a */), false);
        }
        define(59 /* CharCode.Semicolon */, 85 /* KeyCode.Semicolon */, false);
        define(58 /* CharCode.Colon */, 85 /* KeyCode.Semicolon */, true);
        define(61 /* CharCode.Equals */, 86 /* KeyCode.Equal */, false);
        define(43 /* CharCode.Plus */, 86 /* KeyCode.Equal */, true);
        define(44 /* CharCode.Comma */, 87 /* KeyCode.Comma */, false);
        define(60 /* CharCode.LessThan */, 87 /* KeyCode.Comma */, true);
        define(45 /* CharCode.Dash */, 88 /* KeyCode.Minus */, false);
        define(95 /* CharCode.Underline */, 88 /* KeyCode.Minus */, true);
        define(46 /* CharCode.Period */, 89 /* KeyCode.Period */, false);
        define(62 /* CharCode.GreaterThan */, 89 /* KeyCode.Period */, true);
        define(47 /* CharCode.Slash */, 90 /* KeyCode.Slash */, false);
        define(63 /* CharCode.QuestionMark */, 90 /* KeyCode.Slash */, true);
        define(96 /* CharCode.BackTick */, 91 /* KeyCode.Backquote */, false);
        define(126 /* CharCode.Tilde */, 91 /* KeyCode.Backquote */, true);
        define(91 /* CharCode.OpenSquareBracket */, 92 /* KeyCode.BracketLeft */, false);
        define(123 /* CharCode.OpenCurlyBrace */, 92 /* KeyCode.BracketLeft */, true);
        define(92 /* CharCode.Backslash */, 93 /* KeyCode.Backslash */, false);
        define(124 /* CharCode.Pipe */, 93 /* KeyCode.Backslash */, true);
        define(93 /* CharCode.CloseSquareBracket */, 94 /* KeyCode.BracketRight */, false);
        define(125 /* CharCode.CloseCurlyBrace */, 94 /* KeyCode.BracketRight */, true);
        define(39 /* CharCode.SingleQuote */, 95 /* KeyCode.Quote */, false);
        define(34 /* CharCode.DoubleQuote */, 95 /* KeyCode.Quote */, true);
    })();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFjTGludXhLZXlib2FyZE1hcHBlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9rZXliaW5kaW5nL2NvbW1vbi9tYWNMaW51eEtleWJvYXJkTWFwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRzs7Ozs7T0FLRztJQUNILE1BQU0scUJBQXFCLEdBQXVELEVBQUUsQ0FBQztJQUVyRixNQUFhLHdCQUF5QixTQUFRLCtDQUFxQztRQUlsRixZQUFZLE1BQThCLEVBQUUsRUFBbUIsRUFBRSxNQUF1QjtZQUN2RixLQUFLLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ3ZCLENBQUM7UUFFUyxTQUFTLENBQUMsS0FBb0I7WUFDdkMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFUyxhQUFhLENBQUMsS0FBb0I7WUFDM0MsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLDRCQUE0QixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFFUyx1QkFBdUIsQ0FBQyxLQUFvQjtZQUNyRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsMkNBQTJDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVTLHFCQUFxQixDQUFDLEtBQW9CO1lBQ25ELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQ0FBb0MsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBRVMsVUFBVSxDQUFDLE9BQTZCO1lBQ2pELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFD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