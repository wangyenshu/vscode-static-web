define(["require", "exports", "assert", "vs/base/common/keyCodes", "vs/base/common/keybindings", "vs/base/common/keybindingParser", "vs/workbench/services/keybinding/common/keybindingIO", "vs/platform/keybinding/test/common/keybindingsTestUtils", "vs/base/test/common/utils"], function (require, exports, assert, keyCodes_1, keybindings_1, keybindingParser_1, keybindingIO_1, keybindingsTestUtils_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('keybindingIO', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('serialize/deserialize', () => {
            function testOneSerialization(keybinding, expected, msg, OS) {
                const usLayoutResolvedKeybinding = (0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(keybinding, OS);
                const actualSerialized = usLayoutResolvedKeybinding.getUserSettingsLabel();
                assert.strictEqual(actualSerialized, expected, expected + ' - ' + msg);
            }
            function testSerialization(keybinding, expectedWin, expectedMac, expectedLinux) {
                testOneSerialization(keybinding, expectedWin, 'win', 1 /* OperatingSystem.Windows */);
                testOneSerialization(keybinding, expectedMac, 'mac', 2 /* OperatingSystem.Macintosh */);
                testOneSerialization(keybinding, expectedLinux, 'linux', 3 /* OperatingSystem.Linux */);
            }
            function testOneDeserialization(keybinding, _expected, msg, OS) {
                const actualDeserialized = keybindingParser_1.KeybindingParser.parseKeybinding(keybinding);
                const expected = (0, keybindings_1.decodeKeybinding)(_expected, OS);
                assert.deepStrictEqual(actualDeserialized, expected, keybinding + ' - ' + msg);
            }
            function testDeserialization(inWin, inMac, inLinux, expected) {
                testOneDeserialization(inWin, expected, 'win', 1 /* OperatingSystem.Windows */);
                testOneDeserialization(inMac, expected, 'mac', 2 /* OperatingSystem.Macintosh */);
                testOneDeserialization(inLinux, expected, 'linux', 3 /* OperatingSystem.Linux */);
            }
            function testRoundtrip(keybinding, expectedWin, expectedMac, expectedLinux) {
                testSerialization(keybinding, expectedWin, expectedMac, expectedLinux);
                testDeserialization(expectedWin, expectedMac, expectedLinux, keybinding);
            }
            testRoundtrip(21 /* KeyCode.Digit0 */, '0', '0', '0');
            testRoundtrip(31 /* KeyCode.KeyA */, 'a', 'a', 'a');
            testRoundtrip(16 /* KeyCode.UpArrow */, 'up', 'up', 'up');
            testRoundtrip(17 /* KeyCode.RightArrow */, 'right', 'right', 'right');
            testRoundtrip(18 /* KeyCode.DownArrow */, 'down', 'down', 'down');
            testRoundtrip(15 /* KeyCode.LeftArrow */, 'left', 'left', 'left');
            // one modifier
            testRoundtrip(512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'alt+a', 'alt+a', 'alt+a');
            testRoundtrip(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 'ctrl+a', 'cmd+a', 'ctrl+a');
            testRoundtrip(1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */, 'shift+a', 'shift+a', 'shift+a');
            testRoundtrip(256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'win+a', 'ctrl+a', 'meta+a');
            // two modifiers
            testRoundtrip(2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'ctrl+alt+a', 'alt+cmd+a', 'ctrl+alt+a');
            testRoundtrip(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */, 'ctrl+shift+a', 'shift+cmd+a', 'ctrl+shift+a');
            testRoundtrip(2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'ctrl+win+a', 'ctrl+cmd+a', 'ctrl+meta+a');
            testRoundtrip(1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'shift+alt+a', 'shift+alt+a', 'shift+alt+a');
            testRoundtrip(1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'shift+win+a', 'ctrl+shift+a', 'shift+meta+a');
            testRoundtrip(512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'alt+win+a', 'ctrl+alt+a', 'alt+meta+a');
            // three modifiers
            testRoundtrip(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */, 'ctrl+shift+alt+a', 'shift+alt+cmd+a', 'ctrl+shift+alt+a');
            testRoundtrip(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'ctrl+shift+win+a', 'ctrl+shift+cmd+a', 'ctrl+shift+meta+a');
            testRoundtrip(1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'shift+alt+win+a', 'ctrl+shift+alt+a', 'shift+alt+meta+a');
            // all modifiers
            testRoundtrip(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */, 'ctrl+shift+alt+win+a', 'ctrl+shift+alt+cmd+a', 'ctrl+shift+alt+meta+a');
            // chords
            testRoundtrip((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */), 'ctrl+a ctrl+a', 'cmd+a cmd+a', 'ctrl+a ctrl+a');
            testRoundtrip((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */, 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */), 'ctrl+up ctrl+up', 'cmd+up cmd+up', 'ctrl+up ctrl+up');
            // OEM keys
            testRoundtrip(85 /* KeyCode.Semicolon */, ';', ';', ';');
            testRoundtrip(86 /* KeyCode.Equal */, '=', '=', '=');
            testRoundtrip(87 /* KeyCode.Comma */, ',', ',', ',');
            testRoundtrip(88 /* KeyCode.Minus */, '-', '-', '-');
            testRoundtrip(89 /* KeyCode.Period */, '.', '.', '.');
            testRoundtrip(90 /* KeyCode.Slash */, '/', '/', '/');
            testRoundtrip(91 /* KeyCode.Backquote */, '`', '`', '`');
            testRoundtrip(115 /* KeyCode.ABNT_C1 */, 'abnt_c1', 'abnt_c1', 'abnt_c1');
            testRoundtrip(116 /* KeyCode.ABNT_C2 */, 'abnt_c2', 'abnt_c2', 'abnt_c2');
            testRoundtrip(92 /* KeyCode.BracketLeft */, '[', '[', '[');
            testRoundtrip(93 /* KeyCode.Backslash */, '\\', '\\', '\\');
            testRoundtrip(94 /* KeyCode.BracketRight */, ']', ']', ']');
            testRoundtrip(95 /* KeyCode.Quote */, '\'', '\'', '\'');
            testRoundtrip(96 /* KeyCode.OEM_8 */, 'oem_8', 'oem_8', 'oem_8');
            testRoundtrip(97 /* KeyCode.IntlBackslash */, 'oem_102', 'oem_102', 'oem_102');
            // OEM aliases
            testDeserialization('OEM_1', 'OEM_1', 'OEM_1', 85 /* KeyCode.Semicolon */);
            testDeserialization('OEM_PLUS', 'OEM_PLUS', 'OEM_PLUS', 86 /* KeyCode.Equal */);
            testDeserialization('OEM_COMMA', 'OEM_COMMA', 'OEM_COMMA', 87 /* KeyCode.Comma */);
            testDeserialization('OEM_MINUS', 'OEM_MINUS', 'OEM_MINUS', 88 /* KeyCode.Minus */);
            testDeserialization('OEM_PERIOD', 'OEM_PERIOD', 'OEM_PERIOD', 89 /* KeyCode.Period */);
            testDeserialization('OEM_2', 'OEM_2', 'OEM_2', 90 /* KeyCode.Slash */);
            testDeserialization('OEM_3', 'OEM_3', 'OEM_3', 91 /* KeyCode.Backquote */);
            testDeserialization('ABNT_C1', 'ABNT_C1', 'ABNT_C1', 115 /* KeyCode.ABNT_C1 */);
            testDeserialization('ABNT_C2', 'ABNT_C2', 'ABNT_C2', 116 /* KeyCode.ABNT_C2 */);
            testDeserialization('OEM_4', 'OEM_4', 'OEM_4', 92 /* KeyCode.BracketLeft */);
            testDeserialization('OEM_5', 'OEM_5', 'OEM_5', 93 /* KeyCode.Backslash */);
            testDeserialization('OEM_6', 'OEM_6', 'OEM_6', 94 /* KeyCode.BracketRight */);
            testDeserialization('OEM_7', 'OEM_7', 'OEM_7', 95 /* KeyCode.Quote */);
            testDeserialization('OEM_8', 'OEM_8', 'OEM_8', 96 /* KeyCode.OEM_8 */);
            testDeserialization('OEM_102', 'OEM_102', 'OEM_102', 97 /* KeyCode.IntlBackslash */);
            // accepts '-' as separator
            testDeserialization('ctrl-shift-alt-win-a', 'ctrl-shift-alt-cmd-a', 'ctrl-shift-alt-meta-a', 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */);
            // various input mistakes
            testDeserialization(' ctrl-shift-alt-win-A ', ' shift-alt-cmd-Ctrl-A ', ' ctrl-shift-alt-META-A ', 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */);
        });
        test('deserialize scan codes', () => {
            assert.deepStrictEqual(keybindingParser_1.KeybindingParser.parseKeybinding('ctrl+shift+[comma] ctrl+/'), new keybindings_1.Keybinding([new keybindings_1.ScanCodeChord(true, true, false, false, 60 /* ScanCode.Comma */), new keybindings_1.KeyCodeChord(true, false, false, false, 90 /* KeyCode.Slash */)]));
        });
        test('issue #10452 - invalid command', () => {
            const strJSON = `[{ "key": "ctrl+k ctrl+f", "command": ["firstcommand", "seccondcommand"] }]`;
            const userKeybinding = JSON.parse(strJSON)[0];
            const keybindingItem = keybindingIO_1.KeybindingIO.readUserKeybindingItem(userKeybinding);
            assert.strictEqual(keybindingItem.command, null);
        });
        test('issue #10452 - invalid when', () => {
            const strJSON = `[{ "key": "ctrl+k ctrl+f", "command": "firstcommand", "when": [] }]`;
            const userKeybinding = JSON.parse(strJSON)[0];
            const keybindingItem = keybindingIO_1.KeybindingIO.readUserKeybindingItem(userKeybinding);
            assert.strictEqual(keybindingItem.when, undefined);
        });
        test('issue #10452 - invalid key', () => {
            const strJSON = `[{ "key": [], "command": "firstcommand" }]`;
            const userKeybinding = JSON.parse(strJSON)[0];
            const keybindingItem = keybindingIO_1.KeybindingIO.readUserKeybindingItem(userKeybinding);
            assert.deepStrictEqual(keybindingItem.keybinding, null);
        });
        test('issue #10452 - invalid key 2', () => {
            const strJSON = `[{ "key": "", "command": "firstcommand" }]`;
            const userKeybinding = JSON.parse(strJSON)[0];
            const keybindingItem = keybindingIO_1.KeybindingIO.readUserKeybindingItem(userKeybinding);
            assert.deepStrictEqual(keybindingItem.keybinding, null);
        });
        test('test commands args', () => {
            const strJSON = `[{ "key": "ctrl+k ctrl+f", "command": "firstcommand", "when": [], "args": { "text": "theText" } }]`;
            const userKeybinding = JSON.parse(strJSON)[0];
            const keybindingItem = keybindingIO_1.KeybindingIO.readUserKeybindingItem(userKeybinding);
            assert.strictEqual(keybindingItem.commandArgs.text, 'theText');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ0lPLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMva2V5YmluZGluZy90ZXN0L2Jyb3dzZXIva2V5YmluZGluZ0lPLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBYUEsS0FBSyxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7UUFDMUIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7WUFFbEMsU0FBUyxvQkFBb0IsQ0FBQyxVQUFrQixFQUFFLFFBQWdCLEVBQUUsR0FBVyxFQUFFLEVBQW1CO2dCQUNuRyxNQUFNLDBCQUEwQixHQUFHLElBQUEsdURBQWdDLEVBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBRSxDQUFDO2dCQUNyRixNQUFNLGdCQUFnQixHQUFHLDBCQUEwQixDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLFFBQVEsR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDeEUsQ0FBQztZQUNELFNBQVMsaUJBQWlCLENBQUMsVUFBa0IsRUFBRSxXQUFtQixFQUFFLFdBQW1CLEVBQUUsYUFBcUI7Z0JBQzdHLG9CQUFvQixDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsS0FBSyxrQ0FBMEIsQ0FBQztnQkFDOUUsb0JBQW9CLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxLQUFLLG9DQUE0QixDQUFDO2dCQUNoRixvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsYUFBYSxFQUFFLE9BQU8sZ0NBQXdCLENBQUM7WUFDakYsQ0FBQztZQUVELFNBQVMsc0JBQXNCLENBQUMsVUFBa0IsRUFBRSxTQUFpQixFQUFFLEdBQVcsRUFBRSxFQUFtQjtnQkFDdEcsTUFBTSxrQkFBa0IsR0FBRyxtQ0FBZ0IsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hFLE1BQU0sUUFBUSxHQUFHLElBQUEsOEJBQWdCLEVBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLENBQUMsZUFBZSxDQUFDLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxVQUFVLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ2hGLENBQUM7WUFDRCxTQUFTLG1CQUFtQixDQUFDLEtBQWEsRUFBRSxLQUFhLEVBQUUsT0FBZSxFQUFFLFFBQWdCO2dCQUMzRixzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssa0NBQTBCLENBQUM7Z0JBQ3hFLHNCQUFzQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxvQ0FBNEIsQ0FBQztnQkFDMUUsc0JBQXNCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLGdDQUF3QixDQUFDO1lBQzNFLENBQUM7WUFFRCxTQUFTLGFBQWEsQ0FBQyxVQUFrQixFQUFFLFdBQW1CLEVBQUUsV0FBbUIsRUFBRSxhQUFxQjtnQkFDekcsaUJBQWlCLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3ZFLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzFFLENBQUM7WUFFRCxhQUFhLDBCQUFpQixHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzdDLGFBQWEsd0JBQWUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMzQyxhQUFhLDJCQUFrQixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pELGFBQWEsOEJBQXFCLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDN0QsYUFBYSw2QkFBb0IsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN6RCxhQUFhLDZCQUFvQixNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRXpELGVBQWU7WUFDZixhQUFhLENBQUMsNENBQXlCLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNwRSxhQUFhLENBQUMsaURBQTZCLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMxRSxhQUFhLENBQUMsK0NBQTJCLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM1RSxhQUFhLENBQUMsZ0RBQTZCLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUUxRSxnQkFBZ0I7WUFDaEIsYUFBYSxDQUFDLGdEQUEyQix3QkFBZSxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDbkcsYUFBYSxDQUFDLG1EQUE2Qix3QkFBZSxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDM0csYUFBYSxDQUFDLG9EQUErQix3QkFBZSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDekcsYUFBYSxDQUFDLDhDQUF5Qix3QkFBZSxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDckcsYUFBYSxDQUFDLGtEQUE2Qix3QkFBZSxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDM0csYUFBYSxDQUFDLCtDQUEyQix3QkFBZSxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFbkcsa0JBQWtCO1lBQ2xCLGFBQWEsQ0FBQyxtREFBNkIsdUJBQWEsd0JBQWUsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3BJLGFBQWEsQ0FBQyxtREFBNkIsMkJBQWlCLHdCQUFlLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUMxSSxhQUFhLENBQUMsOENBQXlCLDJCQUFpQix3QkFBZSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFFcEksZ0JBQWdCO1lBQ2hCLGFBQWEsQ0FBQyxtREFBNkIsdUJBQWEsMkJBQWlCLHdCQUFlLEVBQUUsc0JBQXNCLEVBQUUsc0JBQXNCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUVuSyxTQUFTO1lBQ1QsYUFBYSxDQUFDLElBQUEsbUJBQVEsRUFBQyxpREFBNkIsRUFBRSxpREFBNkIsQ0FBQyxFQUFFLGVBQWUsRUFBRSxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDdkksYUFBYSxDQUFDLElBQUEsbUJBQVEsRUFBQyxvREFBZ0MsRUFBRSxvREFBZ0MsQ0FBQyxFQUFFLGlCQUFpQixFQUFFLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBRW5KLFdBQVc7WUFDWCxhQUFhLDZCQUFvQixHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2hELGFBQWEseUJBQWdCLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDNUMsYUFBYSx5QkFBZ0IsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM1QyxhQUFhLHlCQUFnQixHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzVDLGFBQWEsMEJBQWlCLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDN0MsYUFBYSx5QkFBZ0IsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM1QyxhQUFhLDZCQUFvQixHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2hELGFBQWEsNEJBQWtCLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDaEUsYUFBYSw0QkFBa0IsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNoRSxhQUFhLCtCQUFzQixHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2xELGFBQWEsNkJBQW9CLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkQsYUFBYSxnQ0FBdUIsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNuRCxhQUFhLHlCQUFnQixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9DLGFBQWEseUJBQWdCLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDeEQsYUFBYSxpQ0FBd0IsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUV0RSxjQUFjO1lBQ2QsbUJBQW1CLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLDZCQUFvQixDQUFDO1lBQ2xFLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSx5QkFBZ0IsQ0FBQztZQUN2RSxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFdBQVcseUJBQWdCLENBQUM7WUFDMUUsbUJBQW1CLENBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxXQUFXLHlCQUFnQixDQUFDO1lBQzFFLG1CQUFtQixDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUsWUFBWSwwQkFBaUIsQ0FBQztZQUM5RSxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8seUJBQWdCLENBQUM7WUFDOUQsbUJBQW1CLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLDZCQUFvQixDQUFDO1lBQ2xFLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyw0QkFBa0IsQ0FBQztZQUN0RSxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsNEJBQWtCLENBQUM7WUFDdEUsbUJBQW1CLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLCtCQUFzQixDQUFDO1lBQ3BFLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyw2QkFBb0IsQ0FBQztZQUNsRSxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sZ0NBQXVCLENBQUM7WUFDckUsbUJBQW1CLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLHlCQUFnQixDQUFDO1lBQzlELG1CQUFtQixDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyx5QkFBZ0IsQ0FBQztZQUM5RCxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsaUNBQXdCLENBQUM7WUFFNUUsMkJBQTJCO1lBQzNCLG1CQUFtQixDQUFDLHNCQUFzQixFQUFFLHNCQUFzQixFQUFFLHVCQUF1QixFQUFFLG1EQUE2Qix1QkFBYSwyQkFBaUIsd0JBQWUsQ0FBQyxDQUFDO1lBRXpLLHlCQUF5QjtZQUN6QixtQkFBbUIsQ0FBQyx3QkFBd0IsRUFBRSx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBRSxtREFBNkIsdUJBQWEsMkJBQWlCLHdCQUFlLENBQUMsQ0FBQztRQUNoTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7WUFDbkMsTUFBTSxDQUFDLGVBQWUsQ0FDckIsbUNBQWdCLENBQUMsZUFBZSxDQUFDLDJCQUEyQixDQUFDLEVBQzdELElBQUksd0JBQVUsQ0FBQyxDQUFDLElBQUksMkJBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLDBCQUFpQixFQUFFLElBQUksMEJBQVksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLHlCQUFnQixDQUFDLENBQUMsQ0FDekksQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtZQUMzQyxNQUFNLE9BQU8sR0FBRyw2RUFBNkUsQ0FBQztZQUM5RixNQUFNLGNBQWMsR0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sY0FBYyxHQUFHLDJCQUFZLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtZQUN4QyxNQUFNLE9BQU8sR0FBRyxxRUFBcUUsQ0FBQztZQUN0RixNQUFNLGNBQWMsR0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sY0FBYyxHQUFHLDJCQUFZLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsRUFBRTtZQUN2QyxNQUFNLE9BQU8sR0FBRyw0Q0FBNEMsQ0FBQztZQUM3RCxNQUFNLGNBQWMsR0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sY0FBYyxHQUFHLDJCQUFZLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtZQUN6QyxNQUFNLE9BQU8sR0FBRyw0Q0FBNEMsQ0FBQztZQUM3RCxNQUFNLGNBQWMsR0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sY0FBYyxHQUFHLDJCQUFZLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtZQUMvQixNQUFNLE9BQU8sR0FBRyxvR0FBb0csQ0FBQztZQUNySCxNQUFNLGNBQWMsR0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sY0FBYyxHQUFHLDJCQUFZLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNoRSxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=