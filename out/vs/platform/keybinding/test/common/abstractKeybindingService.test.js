define(["require", "exports", "assert", "vs/base/common/keyCodes", "vs/base/common/keybindings", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/severity", "vs/base/test/common/utils", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/abstractKeybindingService", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/keybinding/test/common/keybindingsTestUtils", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, assert, keyCodes_1, keybindings_1, lifecycle_1, platform_1, severity_1, utils_1, contextkey_1, abstractKeybindingService_1, keybindingResolver_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, keybindingsTestUtils_1, log_1, notification_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createContext(ctx) {
        return {
            getValue: (key) => {
                return ctx[key];
            }
        };
    }
    suite('AbstractKeybindingService', () => {
        class TestKeybindingService extends abstractKeybindingService_1.AbstractKeybindingService {
            constructor(resolver, contextKeyService, commandService, notificationService) {
                super(contextKeyService, commandService, telemetryUtils_1.NullTelemetryService, notificationService, new log_1.NullLogService());
                this._resolver = resolver;
            }
            _getResolver() {
                return this._resolver;
            }
            _documentHasFocus() {
                return true;
            }
            resolveKeybinding(kb) {
                return usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveKeybinding(kb, platform_1.OS);
            }
            resolveKeyboardEvent(keyboardEvent) {
                const chord = new keybindings_1.KeyCodeChord(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode).toKeybinding();
                return this.resolveKeybinding(chord)[0];
            }
            resolveUserBinding(userBinding) {
                return [];
            }
            testDispatch(kb) {
                const keybinding = (0, keybindings_1.createSimpleKeybinding)(kb, platform_1.OS);
                return this._dispatch({
                    _standardKeyboardEventBrand: true,
                    ctrlKey: keybinding.ctrlKey,
                    shiftKey: keybinding.shiftKey,
                    altKey: keybinding.altKey,
                    metaKey: keybinding.metaKey,
                    altGraphKey: false,
                    keyCode: keybinding.keyCode,
                    code: null
                }, null);
            }
            _dumpDebugInfo() {
                return '';
            }
            _dumpDebugInfoJSON() {
                return '';
            }
            registerSchemaContribution() {
                // noop
            }
            enableKeybindingHoldMode() {
                return undefined;
            }
        }
        let createTestKeybindingService = null;
        let currentContextValue = null;
        let executeCommandCalls = null;
        let showMessageCalls = null;
        let statusMessageCalls = null;
        let statusMessageCallsDisposed = null;
        teardown(() => {
            currentContextValue = null;
            executeCommandCalls = null;
            showMessageCalls = null;
            createTestKeybindingService = null;
            statusMessageCalls = null;
            statusMessageCallsDisposed = null;
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            createTestKeybindingService = (items) => {
                const contextKeyService = {
                    _serviceBrand: undefined,
                    onDidChangeContext: undefined,
                    bufferChangeEvents() { },
                    createKey: undefined,
                    contextMatchesRules: undefined,
                    getContextKeyValue: undefined,
                    createScoped: undefined,
                    createOverlay: undefined,
                    getContext: (target) => {
                        return currentContextValue;
                    },
                    updateParent: () => { }
                };
                const commandService = {
                    _serviceBrand: undefined,
                    onWillExecuteCommand: () => lifecycle_1.Disposable.None,
                    onDidExecuteCommand: () => lifecycle_1.Disposable.None,
                    executeCommand: (commandId, ...args) => {
                        executeCommandCalls.push({
                            commandId: commandId,
                            args: args
                        });
                        return Promise.resolve(undefined);
                    }
                };
                const notificationService = {
                    _serviceBrand: undefined,
                    onDidAddNotification: undefined,
                    onDidRemoveNotification: undefined,
                    onDidChangeFilter: undefined,
                    notify: (notification) => {
                        showMessageCalls.push({ sev: notification.severity, message: notification.message });
                        return new notification_1.NoOpNotification();
                    },
                    info: (message) => {
                        showMessageCalls.push({ sev: severity_1.default.Info, message });
                        return new notification_1.NoOpNotification();
                    },
                    warn: (message) => {
                        showMessageCalls.push({ sev: severity_1.default.Warning, message });
                        return new notification_1.NoOpNotification();
                    },
                    error: (message) => {
                        showMessageCalls.push({ sev: severity_1.default.Error, message });
                        return new notification_1.NoOpNotification();
                    },
                    prompt(severity, message, choices, options) {
                        throw new Error('not implemented');
                    },
                    status(message, options) {
                        statusMessageCalls.push(message);
                        return {
                            dispose: () => {
                                statusMessageCallsDisposed.push(message);
                            }
                        };
                    },
                    setFilter() {
                        throw new Error('not implemented');
                    },
                    getFilter() {
                        throw new Error('not implemented');
                    },
                    getFilters() {
                        throw new Error('not implemented');
                    },
                    removeFilter() {
                        throw new Error('not implemented');
                    }
                };
                const resolver = new keybindingResolver_1.KeybindingResolver(items, [], () => { });
                return new TestKeybindingService(resolver, contextKeyService, commandService, notificationService);
            };
        });
        function kbItem(keybinding, command, when) {
            return new resolvedKeybindingItem_1.ResolvedKeybindingItem((0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(keybinding, platform_1.OS), command, null, when, true, null, false);
        }
        function toUsLabel(keybinding) {
            return (0, keybindingsTestUtils_1.createUSLayoutResolvedKeybinding)(keybinding, platform_1.OS).getLabel();
        }
        suite('simple tests: single- and multi-chord keybindings are dispatched', () => {
            test('a single-chord keybinding is dispatched correctly; this test makes sure the dispatch in general works before we test empty-string/null command ID', () => {
                const key = 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */;
                const kbService = createTestKeybindingService([
                    kbItem(key, 'myCommand'),
                ]);
                currentContextValue = createContext({});
                const shouldPreventDefault = kbService.testDispatch(key);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, ([{ commandId: "myCommand", args: [null] }]));
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, []);
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                kbService.dispose();
            });
            test('a multi-chord keybinding is dispatched correctly', () => {
                const chord0 = 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */;
                const chord1 = 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */;
                const key = [chord0, chord1];
                const kbService = createTestKeybindingService([
                    kbItem(key, 'myCommand'),
                ]);
                currentContextValue = createContext({});
                let shouldPreventDefault = kbService.testDispatch(chord0);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                shouldPreventDefault = kbService.testDispatch(chord1);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, ([{ commandId: "myCommand", args: [null] }]));
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                kbService.dispose();
            });
        });
        suite('keybindings with empty-string/null command ID', () => {
            test('a single-chord keybinding with an empty string command ID unbinds the keybinding (shouldPreventDefault = false)', () => {
                const kbService = createTestKeybindingService([
                    kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 'myCommand'),
                    kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, ''),
                ]);
                // send Ctrl/Cmd + K
                currentContextValue = createContext({});
                const shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
                assert.deepStrictEqual(shouldPreventDefault, false);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, []);
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                kbService.dispose();
            });
            test('a single-chord keybinding with a null command ID unbinds the keybinding (shouldPreventDefault = false)', () => {
                const kbService = createTestKeybindingService([
                    kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 'myCommand'),
                    kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, null),
                ]);
                // send Ctrl/Cmd + K
                currentContextValue = createContext({});
                const shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
                assert.deepStrictEqual(shouldPreventDefault, false);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, []);
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                kbService.dispose();
            });
            test('a multi-chord keybinding with an empty-string command ID keeps the keybinding (shouldPreventDefault = true)', () => {
                const chord0 = 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */;
                const chord1 = 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */;
                const key = [chord0, chord1];
                const kbService = createTestKeybindingService([
                    kbItem(key, 'myCommand'),
                    kbItem(key, ''),
                ]);
                currentContextValue = createContext({});
                let shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`, `The key combination (${toUsLabel(chord0)}, ${toUsLabel(chord1)}) is not a command.`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                kbService.dispose();
            });
            test('a multi-chord keybinding with a null command ID keeps the keybinding (shouldPreventDefault = true)', () => {
                const chord0 = 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */;
                const chord1 = 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */;
                const key = [chord0, chord1];
                const kbService = createTestKeybindingService([
                    kbItem(key, 'myCommand'),
                    kbItem(key, null),
                ]);
                currentContextValue = createContext({});
                let shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */);
                assert.deepStrictEqual(shouldPreventDefault, true);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`, `The key combination (${toUsLabel(chord0)}, ${toUsLabel(chord1)}) is not a command.`]));
                assert.deepStrictEqual(statusMessageCallsDisposed, ([`(${toUsLabel(chord0)}) was pressed. Waiting for second key of chord...`]));
                kbService.dispose();
            });
        });
        test('issue #16498: chord mode is quit for invalid chords', () => {
            const kbService = createTestKeybindingService([
                kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */), 'chordCommand'),
                kbItem(1 /* KeyCode.Backspace */, 'simpleCommand'),
            ]);
            // send Ctrl/Cmd + K
            let shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, []);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, [
                `(${toUsLabel(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)}) was pressed. Waiting for second key of chord...`
            ]);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send backspace
            shouldPreventDefault = kbService.testDispatch(1 /* KeyCode.Backspace */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, []);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, [
                `The key combination (${toUsLabel(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)}, ${toUsLabel(1 /* KeyCode.Backspace */)}) is not a command.`
            ]);
            assert.deepStrictEqual(statusMessageCallsDisposed, [
                `(${toUsLabel(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)}) was pressed. Waiting for second key of chord...`
            ]);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send backspace
            shouldPreventDefault = kbService.testDispatch(1 /* KeyCode.Backspace */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
        test('issue #16833: Keybinding service should not testDispatch on modifier keys', () => {
            const kbService = createTestKeybindingService([
                kbItem(5 /* KeyCode.Ctrl */, 'nope'),
                kbItem(57 /* KeyCode.Meta */, 'nope'),
                kbItem(6 /* KeyCode.Alt */, 'nope'),
                kbItem(4 /* KeyCode.Shift */, 'nope'),
                kbItem(2048 /* KeyMod.CtrlCmd */, 'nope'),
                kbItem(256 /* KeyMod.WinCtrl */, 'nope'),
                kbItem(512 /* KeyMod.Alt */, 'nope'),
                kbItem(1024 /* KeyMod.Shift */, 'nope'),
            ]);
            function assertIsIgnored(keybinding) {
                const shouldPreventDefault = kbService.testDispatch(keybinding);
                assert.strictEqual(shouldPreventDefault, false);
                assert.deepStrictEqual(executeCommandCalls, []);
                assert.deepStrictEqual(showMessageCalls, []);
                assert.deepStrictEqual(statusMessageCalls, []);
                assert.deepStrictEqual(statusMessageCallsDisposed, []);
                executeCommandCalls = [];
                showMessageCalls = [];
                statusMessageCalls = [];
                statusMessageCallsDisposed = [];
            }
            assertIsIgnored(5 /* KeyCode.Ctrl */);
            assertIsIgnored(57 /* KeyCode.Meta */);
            assertIsIgnored(6 /* KeyCode.Alt */);
            assertIsIgnored(4 /* KeyCode.Shift */);
            assertIsIgnored(2048 /* KeyMod.CtrlCmd */);
            assertIsIgnored(256 /* KeyMod.WinCtrl */);
            assertIsIgnored(512 /* KeyMod.Alt */);
            assertIsIgnored(1024 /* KeyMod.Shift */);
            kbService.dispose();
        });
        test('can trigger command that is sharing keybinding with chord', () => {
            const kbService = createTestKeybindingService([
                kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */), 'chordCommand'),
                kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 'simpleCommand', contextkey_1.ContextKeyExpr.has('key1')),
            ]);
            // send Ctrl/Cmd + K
            currentContextValue = createContext({
                key1: true
            });
            let shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + K
            currentContextValue = createContext({});
            shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, []);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, [
                `(${toUsLabel(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)}) was pressed. Waiting for second key of chord...`
            ]);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + X
            currentContextValue = createContext({});
            shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'chordCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, [
                `(${toUsLabel(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)}) was pressed. Waiting for second key of chord...`
            ]);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
        test('cannot trigger chord if command is overwriting', () => {
            const kbService = createTestKeybindingService([
                kbItem((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */), 'chordCommand', contextkey_1.ContextKeyExpr.has('key1')),
                kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 'simpleCommand'),
            ]);
            // send Ctrl/Cmd + K
            currentContextValue = createContext({});
            let shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + K
            currentContextValue = createContext({
                key1: true
            });
            shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, true);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            // send Ctrl/Cmd + X
            currentContextValue = createContext({
                key1: true
            });
            shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */);
            assert.strictEqual(shouldPreventDefault, false);
            assert.deepStrictEqual(executeCommandCalls, []);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
        test('can have spying command', () => {
            const kbService = createTestKeybindingService([
                kbItem(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, '^simpleCommand'),
            ]);
            // send Ctrl/Cmd + K
            currentContextValue = createContext({});
            const shouldPreventDefault = kbService.testDispatch(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */);
            assert.strictEqual(shouldPreventDefault, false);
            assert.deepStrictEqual(executeCommandCalls, [{
                    commandId: 'simpleCommand',
                    args: [null]
                }]);
            assert.deepStrictEqual(showMessageCalls, []);
            assert.deepStrictEqual(statusMessageCalls, []);
            assert.deepStrictEqual(statusMessageCallsDisposed, []);
            executeCommandCalls = [];
            showMessageCalls = [];
            statusMessageCalls = [];
            statusMessageCallsDisposed = [];
            kbService.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RLZXliaW5kaW5nU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0va2V5YmluZGluZy90ZXN0L2NvbW1vbi9hYnN0cmFjdEtleWJpbmRpbmdTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBdUJBLFNBQVMsYUFBYSxDQUFDLEdBQVE7UUFDOUIsT0FBTztZQUNOLFFBQVEsRUFBRSxDQUFDLEdBQVcsRUFBRSxFQUFFO2dCQUN6QixPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQixDQUFDO1NBQ0QsQ0FBQztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1FBRXZDLE1BQU0scUJBQXNCLFNBQVEscURBQXlCO1lBRzVELFlBQ0MsUUFBNEIsRUFDNUIsaUJBQXFDLEVBQ3JDLGNBQStCLEVBQy9CLG1CQUF5QztnQkFFekMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxxQ0FBb0IsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUMzQixDQUFDO1lBRVMsWUFBWTtnQkFDckIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3ZCLENBQUM7WUFFUyxpQkFBaUI7Z0JBQzFCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVNLGlCQUFpQixDQUFDLEVBQWM7Z0JBQ3RDLE9BQU8sdURBQTBCLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLGFBQUUsQ0FBQyxDQUFDO1lBQzdELENBQUM7WUFFTSxvQkFBb0IsQ0FBQyxhQUE2QjtnQkFDeEQsTUFBTSxLQUFLLEdBQUcsSUFBSSwwQkFBWSxDQUM3QixhQUFhLENB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