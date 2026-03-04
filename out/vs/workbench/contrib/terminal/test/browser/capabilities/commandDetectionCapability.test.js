/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/amdX", "vs/base/test/common/utils", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/workbench/contrib/terminal/browser/terminalTestHelpers", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert_1, amdX_1, utils_1, commandDetectionCapability_1, terminalTestHelpers_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestCommandDetectionCapability extends commandDetectionCapability_1.CommandDetectionCapability {
        clearCommands() {
            this._commands.length = 0;
        }
    }
    suite('CommandDetectionCapability', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let xterm;
        let capability;
        let addEvents;
        function assertCommands(expectedCommands) {
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.command), expectedCommands.map(e => e.command));
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.cwd), expectedCommands.map(e => e.cwd));
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.exitCode), expectedCommands.map(e => e.exitCode));
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.marker?.line), expectedCommands.map(e => e.marker?.line));
            // Ensure timestamps are set and were captured recently
            for (const command of capability.commands) {
                (0, assert_1.ok)(Math.abs(Date.now() - command.timestamp) < 2000);
            }
            (0, assert_1.deepStrictEqual)(addEvents, capability.commands);
            // Clear the commands to avoid re-asserting past commands
            addEvents.length = 0;
            capability.clearCommands();
        }
        async function printStandardCommand(prompt, command, output, cwd, exitCode) {
            if (cwd !== undefined) {
                capability.setCwd(cwd);
            }
            capability.handlePromptStart();
            await (0, terminalTestHelpers_1.writeP)(xterm, `\r${prompt}`);
            capability.handleCommandStart();
            await (0, terminalTestHelpers_1.writeP)(xterm, command);
            capability.handleCommandExecuted();
            await (0, terminalTestHelpers_1.writeP)(xterm, `\r\n${output}\r\n`);
            capability.handleCommandFinished(exitCode);
        }
        async function printCommandStart(prompt) {
            capability.handlePromptStart();
            await (0, terminalTestHelpers_1.writeP)(xterm, `\r${prompt}`);
            capability.handleCommandStart();
        }
        setup(async () => {
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = store.add(new TerminalCtor({ allowProposedApi: true, cols: 80 }));
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, store);
            capability = store.add(instantiationService.createInstance(TestCommandDetectionCapability, xterm));
            addEvents = [];
            store.add(capability.onCommandFinished(e => addEvents.push(e)));
            assertCommands([]);
        });
        test('should not add commands when no capability methods are triggered', async () => {
            await (0, terminalTestHelpers_1.writeP)(xterm, 'foo\r\nbar\r\n');
            assertCommands([]);
            await (0, terminalTestHelpers_1.writeP)(xterm, 'baz\r\n');
            assertCommands([]);
        });
        test('should add commands for expected capability method calls', async () => {
            await printStandardCommand('$ ', 'echo foo', 'foo', undefined, 0);
            await printCommandStart('$ ');
            assertCommands([{
                    command: 'echo foo',
                    exitCode: 0,
                    cwd: undefined,
                    marker: { line: 0 }
                }]);
        });
        test('should trim the command when command executed appears on the following line', async () => {
            await printStandardCommand('$ ', 'echo foo\r\n', 'foo', undefined, 0);
            await printCommandStart('$ ');
            assertCommands([{
                    command: 'echo foo',
                    exitCode: 0,
                    cwd: undefined,
                    marker: { line: 0 }
                }]);
        });
        suite('cwd', () => {
            test('should add cwd to commands when it\'s set', async () => {
                await printStandardCommand('$ ', 'echo foo', 'foo', '/home', 0);
                await printStandardCommand('$ ', 'echo bar', 'bar', '/home/second', 0);
                await printCommandStart('$ ');
                assertCommands([
                    { command: 'echo foo', exitCode: 0, cwd: '/home', marker: { line: 0 } },
                    { command: 'echo bar', exitCode: 0, cwd: '/home/second', marker: { line: 2 } }
                ]);
            });
            test('should add old cwd to commands if no cwd sequence is output', async () => {
                await printStandardCommand('$ ', 'echo foo', 'foo', '/home', 0);
                await printStandardCommand('$ ', 'echo bar', 'bar', undefined, 0);
                await printCommandStart('$ ');
                assertCommands([
                    { command: 'echo foo', exitCode: 0, cwd: '/home', marker: { line: 0 } },
                    { command: 'echo bar', exitCode: 0, cwd: '/home', marker: { line: 2 } }
                ]);
            });
            test('should use an undefined cwd if it\'s not set initially', async () => {
                await printStandardCommand('$ ', 'echo foo', 'foo', undefined, 0);
                await printStandardCommand('$ ', 'echo bar', 'bar', '/home', 0);
                await printCommandStart('$ ');
                assertCommands([
                    { command: 'echo foo', exitCode: 0, cwd: undefined, marker: { line: 0 } },
                    { command: 'echo bar', exitCode: 0, cwd: '/home', marker: { line: 2 } }
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZERldGVjdGlvbkNhcGFiaWxpdHkudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL3Rlc3QvYnJvd3Nlci9jYXBhYmlsaXRpZXMvY29tbWFuZERldGVjdGlvbkNhcGFiaWxpdHkudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxNQUFNLDhCQUErQixTQUFRLHVEQUEwQjtRQUN0RSxhQUFhO1lBQ1osSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLENBQUM7S0FDRDtJQUVELEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7UUFDeEMsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELElBQUksS0FBZSxDQUFDO1FBQ3BCLElBQUksVUFBMEMsQ0FBQztRQUMvQyxJQUFJLFNBQTZCLENBQUM7UUFFbEMsU0FBUyxjQUFjLENBQUMsZ0JBQTRDO1lBQ25FLElBQUEsd0JBQWUsRUFBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUMvRixJQUFBLHdCQUFlLEVBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdkYsSUFB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