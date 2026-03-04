/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/amdX", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/platform/terminal/common/xterm/shellIntegrationAddon", "vs/workbench/contrib/terminal/browser/terminalTestHelpers"], function (require, exports, assert_1, sinon, amdX_1, utils_1, log_1, shellIntegrationAddon_1, terminalTestHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestShellIntegrationAddon extends shellIntegrationAddon_1.ShellIntegrationAddon {
        getCommandDetectionMock(terminal) {
            const capability = super._createOrGetCommandDetection(terminal);
            this.capabilities.add(2 /* TerminalCapability.CommandDetection */, capability);
            return sinon.mock(capability);
        }
        getCwdDectionMock() {
            const capability = super._createOrGetCwdDetection();
            this.capabilities.add(0 /* TerminalCapability.CwdDetection */, capability);
            return sinon.mock(capability);
        }
    }
    suite('ShellIntegrationAddon', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let xterm;
        let shellIntegrationAddon;
        let capabilities;
        setup(async () => {
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = store.add(new TerminalCtor({ allowProposedApi: true, cols: 80, rows: 30 }));
            shellIntegrationAddon = store.add(new TestShellIntegrationAddon('', true, undefined, new log_1.NullLogService()));
            xterm.loadAddon(shellIntegrationAddon);
            capabilities = shellIntegrationAddon.capabilities;
        });
        suite('cwd detection', () => {
            test('should activate capability on the cwd sequence (OSC 633 ; P ; Cwd=<cwd> ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(0 /* TerminalCapability.CwdDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(0 /* TerminalCapability.CwdDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;P;Cwd=/foo\x07');
                (0, assert_1.strictEqual)(capabilities.has(0 /* TerminalCapability.CwdDetection */), true);
            });
            test('should pass cwd sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCwdDectionMock();
                mock.expects('updateCwd').once().withExactArgs('/foo');
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;P;Cwd=/foo\x07');
                mock.verify();
            });
            test('detect ITerm sequence: `OSC 1337 ; CurrentDir=<Cwd> ST`', async () => {
                const cases = [
                    ['root', '/', '/'],
                    ['non-root', '/some/path', '/some/path'],
                ];
                for (const x of cases) {
                    const [title, input, expected] = x;
                    const mock = shellIntegrationAddon.getCwdDectionMock();
                    mock.expects('updateCwd').once().withExactArgs(expected).named(title);
                    await (0, terminalTestHelpers_1.writeP)(xterm, `\x1b]1337;CurrentDir=${input}\x07`);
                    mock.verify();
                }
            });
            suite('detect `SetCwd` sequence: `OSC 7; scheme://cwd ST`', () => {
                test('should accept well-formatted URLs', async () => {
                    const cases = [
                        // Different hostname values:
                        ['empty hostname, pointing root', 'file:///', '/'],
                        ['empty hostname', 'file:///test-root/local', '/test-root/local'],
                        ['non-empty hostname', 'file://some-hostname/test-root/local', '/test-root/local'],
                        // URL-encoded chars:
                        ['URL-encoded value (1)', 'file:///test-root/%6c%6f%63%61%6c', '/test-root/local'],
                        ['URL-encoded value (2)', 'file:///test-root/local%22', '/test-root/local"'],
                        ['URL-encoded value (3)', 'file:///test-root/local"', '/test-root/local"'],
                    ];
                    for (const x of cases) {
                        const [title, input, expected] = x;
                        const mock = shellIntegrationAddon.getCwdDectionMock();
                        mock.expects('updateCwd').once().withExactArgs(expected).named(title);
                        await (0, terminalTestHelpers_1.writeP)(xterm, `\x1b]7;${input}\x07`);
                        mock.verify();
                    }
                });
                test('should ignore ill-formatted URLs', async () => {
                    const cases = [
                        // Different hostname values:
                        ['no hostname, pointing root', 'file://'],
                        // Non-`file` scheme values:
                        ['no scheme (1)', '/test-root'],
                        ['no scheme (2)', '//test-root'],
                        ['no scheme (3)', '///test-root'],
                        ['no scheme (4)', ':///test-root'],
                        ['http', 'http:///test-root'],
                        ['ftp', 'ftp:///test-root'],
                        ['ssh', 'ssh:///test-root'],
                    ];
                    for (const x of cases) {
                        const [title, input] = x;
                        const mock = shellIntegrationAddon.getCwdDectionMock();
                        mock.expects('updateCwd').never().named(title);
                        await (0, terminalTestHelpers_1.writeP)(xterm, `\x1b]7;${input}\x07`);
                        mock.verify();
                    }
                });
            });
            test('detect `SetWindowsFrindlyCwd` sequence: `OSC 9 ; 9 ; <cwd> ST`', async () => {
                const cases = [
                    ['root', '/', '/'],
                    ['non-root', '/some/path', '/some/path'],
                ];
                for (const x of cases) {
                    const [title, input, expected] = x;
                    const mock = shellIntegrationAddon.getCwdDectionMock();
                    mock.expects('updateCwd').once().withExactArgs(expected).named(title);
                    await (0, terminalTestHelpers_1.writeP)(xterm, `\x1b]9;9;${input}\x07`);
                    mock.verify();
                }
            });
        });
        suite('command tracking', () => {
            test('should activate capability on the prompt start sequence (OSC 633 ; A ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;A\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass prompt start sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handlePromptStart').once().withExactArgs();
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;A\x07');
                mock.verify();
            });
            test('should activate capability on the command start sequence (OSC 633 ; B ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;B\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass command start sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handleCommandStart').once().withExactArgs();
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;B\x07');
                mock.verify();
            });
            test('should activate capability on the command executed sequence (OSC 633 ; C ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;C\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass command executed sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handleCommandExecuted').once().withExactArgs();
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;C\x07');
                mock.verify();
            });
            test('should activate capability on the command finished sequence (OSC 633 ; D ; <ExitCode> ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;D;7\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass command finished sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handleCommandFinished').once().withExactArgs(7);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;D;7\x07');
                mock.verify();
            });
            test('should pass command line sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('setCommandLine').once().withExactArgs('', false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;E\x07');
                mock.verify();
                const mock2 = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock2.expects('setCommandLine').twice().withExactArgs('cmd', false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;E;cmd\x07');
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;E;cmd;invalid-nonce\x07');
                mock2.verify();
            });
            test('should not activate capability on the cwd sequence (OSC 633 ; P=Cwd=<cwd> ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;P;Cwd=/foo\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
            });
            test('should pass cwd sequence to the capability if it\'s initialized', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('setCwd').once().withExactArgs('/foo');
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;P;Cwd=/foo\x07');
                mock.verify();
            });
        });
        suite('BufferMarkCapability', () => {
            test('SetMark', async () => {
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;SetMark;\x07');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), true);
            });
            test('SetMark - ID', async () => {
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;SetMark;1;\x07');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), true);
            });
            test('SetMark - hidden', async () => {
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;SetMark;;Hidden\x07');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), true);
            });
            test('SetMark - hidden & ID', async () => {
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), false);
                await (0, terminalTestHelpers_1.writeP)(xterm, '\x1b]633;SetMark;1;Hidden\x07');
                (0, assert_1.strictEqual)(capabilities.has(4 /* TerminalCapability.BufferMarkDetection */), true);
            });
            suite('parseMarkSequence', () => {
                test('basic', async () => {
                    (0, assert_1.deepEqual)((0, shellIntegrationAddon_1.parseMarkSequence)(['', '']), { id: undefined, hidden: false });
                });
                test('ID', async () => {
                    (0, assert_1.deepEqual)((0, shellIntegrationAddon_1.parseMarkSequence)(['Id=3', '']), { id: "3", hidden: false });
                });
                test('hidden', async () => {
                    (0, assert_1.deepEqual)((0, shellIntegrationAddon_1.parseMarkSequence)(['', 'Hidden']), { id: undefined, hidden: true });
                });
                test('ID + hidden', async () => {
                    (0, assert_1.deepEqual)((0, shellIntegrationAddon_1.parseMarkSequence)(['Id=4555', 'Hidden']), { id: "4555", hidden: true });
                });
            });
        });
        suite('deserializeMessage', () => {
            // A single literal backslash, in order to avoid confusion about whether we are escaping test data or testing escapes.
            const Backslash = '\\';
            const Newline = '\n';
            const Semicolon = ';';
            const cases = [
                ['empty', '', ''],
                ['basic', 'value', 'value'],
                ['space', 'some thing', 'some thing'],
                ['escaped backslash', `${Backslash}${Backslash}`, Backslash],
                ['non-initial escaped backslash', `foo${Backslash}${Backslash}`, `foo${Backslash}`],
                ['two escaped backslashes', `${Backslash}${Backslash}${Backslash}${Backslash}`, `${Backslash}${Backslash}`],
                ['escaped backslash amidst text', `Hello${Backslash}${Backslash}there`, `Hello${Backslash}there`],
                ['backslash escaped literally and as hex', `${Backslash}${Backslash} is same as ${Backslash}x5c`, `${Backslash} is same as ${Backslash}`],
                ['escaped semicolon', `${Backslash}x3b`, Semicolon],
                ['non-initial escaped semicolon', `foo${Backslash}x3b`, `foo${Semicolon}`],
                ['escaped semicolon (upper hex)', `${Backslash}x3B`, Semicolon],
                ['escaped backslash followed by literal "x3b" is not a semicolon', `${Backslash}${Backslash}x3b`, `${Backslash}x3b`],
                ['non-initial escaped backslash followed by literal "x3b" is not a semicolon', `foo${Backslash}${Backslash}x3b`, `foo${Backslash}x3b`],
                ['escaped backslash followed by escaped semicolon', `${Backslash}${Backslash}${Backslash}x3b`, `${Backslash}${Semicolon}`],
                ['escaped semicolon amidst text', `some${Backslash}x3bthing`, `some${Semicolon}thing`],
                ['escaped newline', `${Backslash}x0a`, Newline],
                ['non-initial escaped newline', `foo${Backslash}x0a`, `foo${Newline}`],
                ['escaped newline (upper hex)', `${Backslash}x0A`, Newline],
                ['escaped backslash followed by literal "x0a" is not a newline', `${Backslash}${Backslash}x0a`, `${Backslash}x0a`],
                ['non-initial escaped backslash followed by literal "x0a" is not a newline', `foo${Backslash}${Backslash}x0a`, `foo${Backslash}x0a`],
            ];
            cases.forEach(([title, input, expected]) => {
                test(title, () => (0, assert_1.strictEqual)((0, shellIntegrationAddon_1.deserializeMessage)(input), expected));
            });
        });
        test('parseKeyValueAssignment', () => {
            const cases = [
                ['empty', '', ['', undefined]],
                ['no "=" sign', 'some-text', ['some-text', undefined]],
                ['empty value', 'key=', ['key', '']],
                ['empty key', '=value', ['', 'value']],
                ['normal', 'key=value', ['key', 'value']],
                ['multiple "=" signs (1)', 'key==value', ['key', '=value']],
                ['multiple "=" signs (2)', 'key=value===true', ['key', 'value===true']],
                ['just a "="', '=', ['', '']],
                ['just a "=="', '==', ['', '=']],
            ];
            cases.forEach(x => {
                const [title, input, [key, value]] = x;
                (0, assert_1.deepStrictEqual)((0, shellIntegrationAddon_1.parseKeyValueAssignment)(input), { key, value }, title);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGxJbnRlZ3JhdGlvbkFkZG9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L2Jyb3dzZXIveHRlcm0vc2hlbGxJbnRlZ3JhdGlvbkFkZG9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsTUFBTSx5QkFBMEIsU0FBUSw2Q0FBcUI7UUFDNUQsdUJBQXVCLENBQUMsUUFBa0I7WUFDekMsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLDRCQUE0QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyw4Q0FBc0MsVUFBVSxDQUFDLENBQUM7WUFDdkUsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFDRCxpQkFBaUI7WUFDaEIsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDcEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLDBDQUFrQyxVQUFVLENBQUMsQ0FBQztZQUNuRSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0IsQ0FBQztLQUNEO0lBRUQsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtRQUNuQyxNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsSUFBSSxLQUFlLENBQUM7UUFDcEIsSUFBSSxxQkFBZ0QsQ0FBQztRQUNyRCxJQUFJLFlBQXNDLENBQUM7UUFFM0MsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2hCLE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBTSxJQUFBLDBCQUFtQixFQUFnQyxjQUFjLEVBQUUsY0FBYyxD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