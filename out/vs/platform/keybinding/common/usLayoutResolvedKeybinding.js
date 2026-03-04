/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/keybindings", "vs/platform/keybinding/common/baseResolvedKeybinding", "vs/platform/keybinding/common/resolvedKeybindingItem"], function (require, exports, keyCodes_1, keybindings_1, baseResolvedKeybinding_1, resolvedKeybindingItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.USLayoutResolvedKeybinding = void 0;
    /**
     * Do not instantiate. Use KeybindingService to get a ResolvedKeybinding seeded with information about the current kb layout.
     */
    class USLayoutResolvedKeybinding extends baseResolvedKeybinding_1.BaseResolvedKeybinding {
        constructor(chords, os) {
            super(os, chords);
        }
        _keyCodeToUILabel(keyCode) {
            if (this._os === 2 /* OperatingSystem.Macintosh */) {
                switch (keyCode) {
                    case 15 /* KeyCode.LeftArrow */:
                        return '←';
                    case 16 /* KeyCode.UpArrow */:
                        return '↑';
                    case 17 /* KeyCode.RightArrow */:
                        return '→';
                    case 18 /* KeyCode.DownArrow */:
                        return '↓';
                }
            }
            return keyCodes_1.KeyCodeUtils.toString(keyCode);
        }
        _getLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return this._keyCodeToUILabel(chord.keyCode);
        }
        _getAriaLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            return keyCodes_1.KeyCodeUtils.toString(chord.keyCode);
        }
        _getElectronAccelerator(chord) {
            return keyCodes_1.KeyCodeUtils.toElectronAccelerator(chord.keyCode);
        }
        _getUserSettingsLabel(chord) {
            if (chord.isDuplicateModifierCase()) {
                return '';
            }
            const result = keyCodes_1.KeyCodeUtils.toUserSettingsUS(chord.keyCode);
            return (result ? result.toLowerCase() : result);
        }
        _isWYSIWYG() {
            return true;
        }
        _getChordDispatch(chord) {
            return USLayoutResolvedKeybinding.getDispatchStr(chord);
        }
        static getDispatchStr(chord) {
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
        _getSingleModifierChordDispatch(keybinding) {
            if (keybinding.keyCode === 5 /* KeyCode.Ctrl */ && !keybinding.shiftKey && !keybinding.altKey && !keybinding.metaKey) {
                return 'ctrl';
            }
            if (keybinding.keyCode === 4 /* KeyCode.Shift */ && !keybinding.ctrlKey && !keybinding.altKey && !keybinding.metaKey) {
                return 'shift';
            }
            if (keybinding.keyCode === 6 /* KeyCode.Alt */ && !keybinding.ctrlKey && !keybinding.shiftKey && !keybinding.metaKey) {
                return 'alt';
            }
            if (keybinding.keyCode === 57 /* KeyCode.Meta */ && !keybinding.ctrlKey && !keybinding.shiftKey && !keybinding.altKey) {
                return 'meta';
            }
            return null;
        }
        /**
         * *NOTE*: Check return value for `KeyCode.Unknown`.
         */
        static _scanCodeToKeyCode(scanCode) {
            const immutableKeyCode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode];
            if (immutableKeyCode !== -1 /* KeyCode.DependsOnKbLayout */) {
                return immutableKeyCode;
            }
            switch (scanCode) {
                case 10 /* ScanCode.KeyA */: return 31 /* KeyCode.KeyA */;
                case 11 /* ScanCode.KeyB */: return 32 /* KeyCode.KeyB */;
                case 12 /* ScanCode.KeyC */: return 33 /* KeyCode.KeyC */;
                case 13 /* ScanCode.KeyD */: return 34 /* KeyCode.KeyD */;
                case 14 /* ScanCode.KeyE */: return 35 /* KeyCode.KeyE */;
                case 15 /* ScanCode.KeyF */: return 36 /* KeyCode.KeyF */;
                case 16 /* ScanCode.KeyG */: return 37 /* KeyCode.KeyG */;
                case 17 /* ScanCode.KeyH */: return 38 /* KeyCode.KeyH */;
                case 18 /* ScanCode.KeyI */: return 39 /* KeyCode.KeyI */;
                case 19 /* ScanCode.KeyJ */: return 40 /* KeyCode.KeyJ */;
                case 20 /* ScanCode.KeyK */: return 41 /* KeyCode.KeyK */;
                case 21 /* ScanCode.KeyL */: return 42 /* KeyCode.KeyL */;
                case 22 /* ScanCode.KeyM */: return 43 /* KeyCode.KeyM */;
                case 23 /* ScanCode.KeyN */: return 44 /* KeyCode.KeyN */;
                case 24 /* ScanCode.KeyO */: return 45 /* KeyCode.KeyO */;
                case 25 /* ScanCode.KeyP */: return 46 /* KeyCode.KeyP */;
                case 26 /* ScanCode.KeyQ */: return 47 /* KeyCode.KeyQ */;
                case 27 /* ScanCode.KeyR */: return 48 /* KeyCode.KeyR */;
                case 28 /* ScanCode.KeyS */: return 49 /* KeyCode.KeyS */;
                case 29 /* ScanCode.KeyT */: return 50 /* KeyCode.KeyT */;
                case 30 /* ScanCode.KeyU */: return 51 /* KeyCode.KeyU */;
                case 31 /* ScanCode.KeyV */: return 52 /* KeyCode.KeyV */;
                case 32 /* ScanCode.KeyW */: return 53 /* KeyCode.KeyW */;
                case 33 /* ScanCode.KeyX */: return 54 /* KeyCode.KeyX */;
                case 34 /* ScanCode.KeyY */: return 55 /* KeyCode.KeyY */;
                case 35 /* ScanCode.KeyZ */: return 56 /* KeyCode.KeyZ */;
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
                case 51 /* ScanCode.Minus */: return 88 /* KeyCode.Minus */;
                case 52 /* ScanCode.Equal */: return 86 /* KeyCode.Equal */;
                case 53 /* ScanCode.BracketLeft */: return 92 /* KeyCode.BracketLeft */;
                case 54 /* ScanCode.BracketRight */: return 94 /* KeyCode.BracketRight */;
                case 55 /* ScanCode.Backslash */: return 93 /* KeyCode.Backslash */;
                case 56 /* ScanCode.IntlHash */: return 0 /* KeyCode.Unknown */; // missing
                case 57 /* ScanCode.Semicolon */: return 85 /* KeyCode.Semicolon */;
                case 58 /* ScanCode.Quote */: return 95 /* KeyCode.Quote */;
                case 59 /* ScanCode.Backquote */: return 91 /* KeyCode.Backquote */;
                case 60 /* ScanCode.Comma */: return 87 /* KeyCode.Comma */;
                case 61 /* ScanCode.Period */: return 89 /* KeyCode.Period */;
                case 62 /* ScanCode.Slash */: return 90 /* KeyCode.Slash */;
                case 106 /* ScanCode.IntlBackslash */: return 97 /* KeyCode.IntlBackslash */;
            }
            return 0 /* KeyCode.Unknown */;
        }
        static _toKeyCodeChord(chord) {
            if (!chord) {
                return null;
            }
            if (chord instanceof keybindings_1.KeyCodeChord) {
                return chord;
            }
            const keyCode = this._scanCodeToKeyCode(chord.scanCode);
            if (keyCode === 0 /* KeyCode.Unknown */) {
                return null;
            }
            return new keybindings_1.KeyCodeChord(chord.ctrlKey, chord.shiftKey, chord.altKey, chord.metaKey, keyCode);
        }
        static resolveKeybinding(keybinding, os) {
            const chords = (0, resolvedKeybindingItem_1.toEmptyArrayIfContainsNull)(keybinding.chords.map(chord => this._toKeyCodeChord(chord)));
            if (chords.length > 0) {
                return [new USLayoutResolvedKeybinding(chords, os)];
            }
            return [];
        }
    }
    exports.USLayoutResolvedKeybinding = USLayoutResolvedKeybinding;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNMYXlvdXRSZXNvbHZlZEtleWJpbmRpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9rZXliaW5kaW5nL2NvbW1vbi91c0xheW91dFJlc29sdmVkS2V5YmluZGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEc7O09BRUc7SUFDSCxNQUFhLDBCQUEyQixTQUFRLCtDQUFvQztRQUVuRixZQUFZLE1BQXNCLEVBQUUsRUFBbUI7WUFDdEQsS0FBSyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNuQixDQUFDO1FBRU8saUJBQWlCLENBQUMsT0FBZ0I7WUFDekMsSUFBSSxJQUFJLENBQUMsR0FBRyxzQ0FBOEIsRUFBRSxDQUFDO2dCQUM1QyxRQUFRLE9BQU8sRUFBRSxDQUFDO29CQUNqQjt3QkFDQyxPQUFPLEdBQUcsQ0FBQztvQkFDWjt3QkFDQyxPQUFPLEdBQUcsQ0FBQztvQkFDWjt3QkFDQyxPQUFPLEdBQUcsQ0FBQztvQkFDWjt3QkFDQyxPQUFPLEdBQUcsQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sdUJBQVksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVTLFNBQVMsQ0FBQyxLQUFtQjtZQUN0QyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRVMsYUFBYSxDQUFDLEtBQW1CO1lBQzFDLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxFQUFFLENBQUM7WUFDWCxD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