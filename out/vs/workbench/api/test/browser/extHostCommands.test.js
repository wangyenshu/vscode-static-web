/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/common/extHostCommands", "vs/platform/commands/common/commands", "vs/workbench/api/test/common/testRPCProtocol", "vs/base/test/common/mock", "vs/platform/log/common/log", "vs/base/test/common/utils"], function (require, exports, assert, extHostCommands_1, commands_1, testRPCProtocol_1, mock_1, log_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostCommands', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('dispose calls unregister', function () {
            let lastUnregister;
            const shape = new class extends (0, mock_1.mock)() {
                $registerCommand(id) {
                    //
                }
                $unregisterCommand(id) {
                    lastUnregister = id;
                }
            };
            const commands = new extHostCommands_1.ExtHostCommands((0, testRPCProtocol_1.SingleProxyRPCProtocol)(shape), new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
                onExtensionError() {
                    return true;
                }
            });
            commands.registerCommand(true, 'foo', () => { }).dispose();
            assert.strictEqual(lastUnregister, 'foo');
            assert.strictEqual(commands_1.CommandsRegistry.getCommand('foo'), undefined);
        });
        test('dispose bubbles only once', function () {
            let unregisterCounter = 0;
            const shape = new class extends (0, mock_1.mock)() {
                $registerCommand(id) {
                    //
                }
                $unregisterCommand(id) {
                    unregisterCounter += 1;
                }
            };
            const commands = new extHostCommands_1.ExtHostCommands((0, testRPCProtocol_1.SingleProxyRPCProtocol)(shape), new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
                onExtensionError() {
                    return true;
                }
            });
            const reg = commands.registerCommand(true, 'foo', () => { });
            reg.dispose();
            reg.dispose();
            reg.dispose();
            assert.strictEqual(unregisterCounter, 1);
        });
        test('execute with retry', async function () {
            let count = 0;
            const shape = new class extends (0, mock_1.mock)() {
                $registerCommand(id) {
                    //
                }
                async $executeCommand(id, args, retry) {
                    count++;
                    assert.strictEqual(retry, count === 1);
                    if (count === 1) {
                        assert.strictEqual(retry, true);
                        throw new Error('$executeCommand:retry');
                    }
                    else {
                        assert.strictEqual(retry, false);
                        return 17;
                    }
                }
            };
            const commands = new extHostCommands_1.ExtHostCommands((0, testRPCProtocol_1.SingleProxyRPCProtocol)(shape), new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
                onExtensionError() {
                    return true;
                }
            });
            const result = await commands.executeCommand('fooo', [this, true]);
            assert.strictEqual(result, 17);
            assert.strictEqual(count, 2);
        });
        test('onCommand:abc activates extensions when executed from command palette, but not when executed programmatically with vscode.commands.executeCommand #150293', async function () {
            const activationEvents = [];
            const shape = new class extends (0, mock_1.mock)() {
                $registerCommand(id) {
                    //
                }
                $fireCommandActivationEvent(id) {
                    activationEvents.push(id);
                }
            };
            const commands = new extHostCommands_1.ExtHostCommands((0, testRPCProtocol_1.SingleProxyRPCProtocol)(shape), new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
                onExtensionError() {
                    return true;
                }
            });
            commands.registerCommand(true, 'extCmd', (args) => args);
            const result = await commands.executeCommand('extCmd', this);
            assert.strictEqual(result, this);
            assert.deepStrictEqual(activationEvents, ['extCmd']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvbW1hbmRzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9leHRIb3N0Q29tbWFuZHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyxLQUFLLENBQUMsaUJBQWlCLEVBQUU7UUFDeEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQywwQkFBMEIsRUFBRTtZQUVoQyxJQUFJLGNBQXNCLENBQUM7WUFFM0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQTJCO2dCQUNyRCxnQkFBZ0IsQ0FBQyxFQUFVO29CQUNuQyxFQUFFO2dCQUNILENBQUM7Z0JBQ1Esa0JBQWtCLENBQUMsRUFBVTtvQkFDckMsY0FBYyxHQUFHLEVBQUUsQ0FBQztnQkFDckIsQ0FBQzthQUNELENBQUM7WUFFRixNQUFNLFFBQVEsR0FBRyxJQUFJLGlDQUFlLENBQ25DLElBQUEsd0NBQXNCLEVBQUMsS0FBSyxDQUFDLEVBQzdCLElBQUksb0JBQWMsRUFBRSxFQUNwQixJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBcUI7Z0JBQ2pDLGdCQUFnQjtvQkFDeEIsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQzthQUNELENBQ0QsQ0FBQztZQUNGLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLGNBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLDJCQUFnQixDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRSxTQUFT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