/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/keyCodes", "vs/base/test/common/utils", "vs/platform/keybinding/test/common/keybindingsTestUtils"], function (require, exports, assert, keyCodes_1, utils_1, keybindingsTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('KeybindingLabels', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertUSLabel(OS, keybinding, expected) {
            const usResolvedKeybinding = (0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(keybinding, OS);
            assert.strictEqual(usResolvedKeybinding.getLabel(), expected);
        }
        test('Windows US label', () => {
            // no modifier
            assertUSLabel(1 /* OperatingSystem.Windows */, 31 /* KeyCode.KeyA */, 'A');
            // one modifier
            assertUSLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 'Ctrl+A');
            assertUSLabel(1 /* OperatingSystem.Windows */, 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */, 'Shift+A');
            assertUSLabel(1 /* OperatingSystem.Windows */, 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'Alt+A');
            assertUSLabel(1 /* OperatingSystem.Windows */, 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Windows+A');
            // two modifiers
            assertUSLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */, 'Ctrl+Shift+A');
            assertUSLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'Ctrl+Alt+A');
            assertUSLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Ctrl+Windows+A');
            assertUSLabel(1 /* OperatingSystem.Windows */, 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'Shift+Alt+A');
            assertUSLabel(1 /* OperatingSystem.Windows */, 1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Shift+Windows+A');
            assertUSLabel(1 /* OperatingSystem.Windows */, 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Alt+Windows+A');
            // three modifiers
            assertUSLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'Ctrl+Shift+Alt+A');
            assertUSLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Ctrl+Shift+Windows+A');
            assertUSLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Ctrl+Alt+Windows+A');
            assertUSLabel(1 /* OperatingSystem.Windows */, 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Shift+Alt+Windows+A');
            // four modifiers
            assertUSLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Ctrl+Shift+Alt+Windows+A');
            // chord
            assertUSLabel(1 /* OperatingSystem.Windows */, (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */), 'Ctrl+A Ctrl+B');
        });
        test('Linux US label', () => {
            // no modifier
            assertUSLabel(3 /* OperatingSystem.Linux */, 31 /* KeyCode.KeyA */, 'A');
            // one modifier
            assertUSLabel(3 /* OperatingSystem.Linux */, 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 'Ctrl+A');
            assertUSLabel(3 /* OperatingSystem.Linux */, 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */, 'Shift+A');
            assertUSLabel(3 /* OperatingSystem.Linux */, 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'Alt+A');
            assertUSLabel(3 /* OperatingSystem.Linux */, 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Super+A');
            // two modifiers
            assertUSLabel(3 /* OperatingSystem.Linux */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */, 'Ctrl+Shift+A');
            assertUSLabel(3 /* OperatingSystem.Linux */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'Ctrl+Alt+A');
            assertUSLabel(3 /* OperatingSystem.Linux */, 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Ctrl+Super+A');
            assertUSLabel(3 /* OperatingSystem.Linux */, 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'Shift+Alt+A');
            assertUSLabel(3 /* OperatingSystem.Linux */, 1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Shift+Super+A');
            assertUSLabel(3 /* OperatingSystem.Linux */, 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Alt+Super+A');
            // three modifiers
            assertUSLabel(3 /* OperatingSystem.Linux */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'Ctrl+Shift+Alt+A');
            assertUSLabel(3 /* OperatingSystem.Linux */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Ctrl+Shift+Super+A');
            assertUSLabel(3 /* OperatingSystem.Linux */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Ctrl+Alt+Super+A');
            assertUSLabel(3 /* OperatingSystem.Linux */, 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Shift+Alt+Super+A');
            // four modifiers
            assertUSLabel(3 /* OperatingSystem.Linux */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Ctrl+Shift+Alt+Super+A');
            // chord
            assertUSLabel(3 /* OperatingSystem.Linux */, (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */), 'Ctrl+A Ctrl+B');
        });
        test('Mac US label', () => {
            // no modifier
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 31 /* KeyCode.KeyA */, 'A');
            // one modifier
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, '⌘A');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */, '⇧A');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, '⌥A');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, '⌃A');
            // two modifiers
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */, '⇧⌘A');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, '⌥⌘A');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, '⌃⌘A');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, '⇧⌥A');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, '⌃⇧A');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, '⌃⌥A');
            // three modifiers
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, '⇧⌥⌘A');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, '⌃⇧⌘A');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, '⌃⌥⌘A');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, '⌃⇧⌥A');
            // four modifiers
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, '⌃⇧⌥⌘A');
            // chord
            assertUSLabel(2 /* OperatingSystem.Macintosh */, (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */), '⌘A ⌘B');
            // special keys
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 15 /* KeyCode.LeftArrow */, '←');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 16 /* KeyCode.UpArrow */, '↑');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 17 /* KeyCode.RightArrow */, '→');
            assertUSLabel(2 /* OperatingSystem.Macintosh */, 18 /* KeyCode.DownArrow */, '↓');
        });
        test('Aria label', () => {
            function assertAriaLabel(OS, keybinding, expected) {
                const usResolvedKeybinding = (0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(keybinding, OS);
                assert.strictEqual(usResolvedKeybinding.getAriaLabel(), expected);
            }
            assertAriaLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Control+Shift+Alt+Windows+A');
            assertAriaLabel(3 /* OperatingSystem.Linux */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Control+Shift+Alt+Super+A');
            assertAriaLabel(2 /* OperatingSystem.Macintosh */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Control+Shift+Option+Command+A');
        });
        test('Electron Accelerator label', () => {
            function assertElectronAcceleratorLabel(OS, keybinding, expected) {
                const usResolvedKeybinding = (0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(keybinding, OS);
                assert.strictEqual(usResolvedKeybinding.getElectronAccelerator(), expected);
            }
            assertElectronAcceleratorLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Ctrl+Shift+Alt+Super+A');
            assertElectronAcceleratorLabel(3 /* OperatingSystem.Linux */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Ctrl+Shift+Alt+Super+A');
            assertElectronAcceleratorLabel(2 /* OperatingSystem.Macintosh */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'Ctrl+Shift+Alt+Cmd+A');
            // electron cannot handle chords
            assertElectronAcceleratorLabel(1 /* OperatingSystem.Windows */, (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */), null);
            assertElectronAcceleratorLabel(3 /* OperatingSystem.Linux */, (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */), null);
            assertElectronAcceleratorLabel(2 /* OperatingSystem.Macintosh */, (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */), null);
            // electron cannot handle numpad keys
            assertElectronAcceleratorLabel(1 /* OperatingSystem.Windows */, 99 /* KeyCode.Numpad1 */, null);
            assertElectronAcceleratorLabel(3 /* OperatingSystem.Linux */, 99 /* KeyCode.Numpad1 */, null);
            assertElectronAcceleratorLabel(2 /* OperatingSystem.Macintosh */, 99 /* KeyCode.Numpad1 */, null);
            // special
            assertElectronAcceleratorLabel(2 /* OperatingSystem.Macintosh */, 15 /* KeyCode.LeftArrow */, 'Left');
            assertElectronAcceleratorLabel(2 /* OperatingSystem.Macintosh */, 16 /* KeyCode.UpArrow */, 'Up');
            assertElectronAcceleratorLabel(2 /* OperatingSystem.Macintosh */, 17 /* KeyCode.RightArrow */, 'Right');
            assertElectronAcceleratorLabel(2 /* OperatingSystem.Macintosh */, 18 /* KeyCode.DownArrow */, 'Down');
        });
        test('User Settings label', () => {
            function assertElectronAcceleratorLabel(OS, keybinding, expected) {
                const usResolvedKeybinding = (0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(keybinding, OS);
                assert.strictEqual(usResolvedKeybinding.getUserSettingsLabel(), expected);
            }
            assertElectronAcceleratorLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'ctrl+shift+alt+win+a');
            assertElectronAcceleratorLabel(3 /* OperatingSystem.Linux */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'ctrl+shift+alt+meta+a');
            assertElectronAcceleratorLabel(2 /* OperatingSystem.Macintosh */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'ctrl+shift+alt+cmd+a');
            // electron cannot handle chords
            assertElectronAcceleratorLabel(1 /* OperatingSystem.Windows */, (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */), 'ctrl+a ctrl+b');
            assertElectronAcceleratorLabel(3 /* OperatingSystem.Linux */, (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */), 'ctrl+a ctrl+b');
            assertElectronAcceleratorLabel(2 /* OperatingSystem.Macintosh */, (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */), 'cmd+a cmd+b');
        });
        test('issue #91235: Do not end with a +', () => {
            assertUSLabel(1 /* OperatingSystem.Windows */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 6 /* KeyCode.Alt */, 'Ctrl+Alt');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ0xhYmVscy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0va2V5YmluZGluZy90ZXN0L2NvbW1vbi9rZXliaW5kaW5nTGFiZWxzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUU5QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxhQUFhLENBQUMsRUFBbUIsRUFBRSxVQUFrQixFQUFFLFFBQWdCO1lBQy9FLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSx1REFBZ0MsRUFBQyxVQUFVLEVBQUUsRUFBRSxDQUFFLENBQUM7WUFDL0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtZQUM3QixjQUFjO1lBQ2QsYUFBYSx5REFBd0MsR0FBRyxDQUFDLENBQUM7WUFFMUQsZUFBZTtZQUNmLGFBQWEsa0NBQTBCLGlEQUE2QixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2hGLGFBQWEsa0NBQTBCLCtDQUEyQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQy9FLGFBQWEsa0NBQTBCLDRDQUF5QixFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNFLGFBQWEsa0NBQTBCLGdEQUE2QixFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRW5GLGdCQUFnQjtZQUNoQixhQUFhLGtDQUEwQixtREFBNkIsd0JBQWUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNyRyxhQUFhLGtDQUEwQixnREFBMkIsd0JBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNqRyxhQUFhLGtDQUEwQixv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