/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/common/views", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalConfigurationService", "vs/workbench/contrib/terminal/browser/terminalInstance", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/common/environmentVariableService", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/test/browser/xterm/xtermTerminal.test", "vs/workbench/services/search/test/browser/queryBuilder.test", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert_1, event_1, lifecycle_1, network_1, platform_1, uri_1, utils_1, configuration_1, testConfigurationService_1, terminalCapabilityStore_1, views_1, terminal_1, terminalConfigurationService_1, terminalInstance_1, environmentVariable_1, environmentVariableService_1, terminal_2, xtermTerminal_test_1, queryBuilder_test_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const root1 = '/foo/root1';
    const ROOT_1 = (0, queryBuilder_test_1.fixPath)(root1);
    const root2 = '/foo/root2';
    const ROOT_2 = (0, queryBuilder_test_1.fixPath)(root2);
    class MockTerminalProfileResolverService extends workbenchTestServices_1.TestTerminalProfileResolverService {
        async getDefaultProfile() {
            return {
                profileName: "my-sh",
                path: "/usr/bin/zsh",
                env: {
                    TEST: "TEST",
                },
                isDefault: true,
                isUnsafePath: false,
                isFromPath: true,
                icon: {
                    id: "terminal-linux",
                },
                color: "terminal.ansiYellow",
            };
        }
    }
    const terminalShellTypeContextKey = {
        set: () => { },
        reset: () => { },
        get: () => undefined
    };
    const terminalInRunCommandPicker = {
        set: () => { },
        reset: () => { },
        get: () => undefined
    };
    class TestTerminalChildProcess extends lifecycle_1.Disposable {
        get capabilities() { return []; }
        constructor(shouldPersist) {
            super();
            this.shouldPersist = shouldPersist;
            this.id = 0;
            this.onDidChangeProperty = event_1.Event.None;
            this.onProcessData = event_1.Event.None;
            this.onProcessExit = event_1.Event.None;
            this.onProcessReady = event_1.Event.None;
            this.onProcessTitleChanged = event_1.Event.None;
            this.onProcessShellTypeChanged = event_1.Event.None;
        }
        updateProperty(property, value) {
            throw new Error('Method not implemented.');
        }
        async start() { return undefined; }
        shutdown(immediate) { }
        input(data) { }
        resize(cols, rows) { }
        clearBuffer() { }
        acknowledgeDataEvent(charCount) { }
        async setUnicodeVersion(version) { }
        async getInitialCwd() { return ''; }
        async getCwd() { return ''; }
        async processBinary(data) { }
        refreshProperty(property) { return Promise.resolve(''); }
    }
    class TestTerminalInstanceService extends lifecycle_1.Disposable {
        getBackend() {
            return {
                onPtyHostExit: event_1.Event.None,
                onPtyHostUnresponsive: event_1.Event.None,
                onPtyHostResponsive: event_1.Event.None,
                onPtyHostRestart: event_1.Event.None,
                onDidMoveWindowInstance: event_1.Event.None,
                onDidRequestDetach: event_1.Event.None,
                createProcess: (shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, windowsEnableConpty, shouldPersist) => this._register(new TestTerminalChildProcess(shouldPersist)),
                getLatency: () => Promise.resolve([])
            };
        }
    }
    suite('Workbench - TerminalInstance', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('TerminalInstance', () => {
            let terminalInstance;
            test('should create an instance of TerminalInstance with env from default profile', async () => {
                const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({
                    configurationService: () => new testConfigurationService_1.TestConfigurationService({
                        files: {},
                        terminal: {
                            integrated: {
                                fontFamily: 'monospace',
                                scrollback: 1000,
                                fastScrollSensitivity: 2,
                                mouseWheelScrollSensitivity: 1,
                                unicodeVersion: '6',
                                shellIntegration: {
                                    enabled: true
                                },
                            }
                        },
                    })
                }, store);
                instantiationService.set(terminal_2.ITerminalProfileResolverService, new MockTerminalProfileResolverService());
                instantiationService.stub(views_1.IViewDescriptorService, new xtermTerminal_test_1.TestViewDescriptorService());
                instantiationService.stub(environmentVariable_1.IEnvironmentVariableService, store.add(instantiationService.createInstance(environmentVariableService_1.EnvironmentVariableService)));
                instantiationService.stub(terminal_1.ITerminalInstanceService, store.add(new TestTerminalInstanceService()));
                terminalInstance = store.add(instantiationService.createInstance(terminalInstance_1.TerminalInstance, terminalShellTypeContextKey, terminalInRunCommandPicker, {}));
                // //Wait for the teminalInstance._xtermReadyPromise to resolve
                await new Promise(resolve => setTimeout(resolve, 100));
                (0, assert_1.deepStrictEqual)(terminalInstance.shellLaunchConfig.env, { TEST: 'TEST' });
            });
        });
        suite('parseExitResult', () => {
            test('should return no message for exit code = undefined', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(undefined, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: undefined, message: undefined });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(undefined, {}, 5 /* ProcessState.KilledByUser */, undefined), { code: undefined, message: undefined });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(undefined, {}, 6 /* ProcessState.KilledByProcess */, undefined), { code: undefined, message: undefined });
            });
            test('should return no message for exit code = 0', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(0, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 0, message: undefined });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(0, {}, 5 /* ProcessState.KilledByUser */, undefined), { code: 0, message: undefined });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(0, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 0, message: undefined });
            });
            test('should return friendly message when executable is specified for non-zero exit codes', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo' }, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 1, message: 'The terminal process "foo" failed to launch (exit code: 1).' });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo' }, 5 /* ProcessState.KilledByUser */, undefined), { code: 1, message: 'The terminal process "foo" terminated with exit code: 1.' });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo' }, 6 /* ProcessState.KilledByProcess */, undefined), { code: 1, message: 'The terminal process "foo" terminated with exit code: 1.' });
            });
            test('should return friendly message when executable and args are specified for non-zero exit codes', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo', args: ['bar', 'baz'] }, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 1, message: `The terminal process "foo 'bar', 'baz'" failed to launch (exit code: 1).` });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo', args: ['bar', 'baz'] }, 5 /* ProcessState.KilledByUser */, undefined), { code: 1, message: `The terminal process "foo 'bar', 'baz'" terminated with exit code: 1.` });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo', args: ['bar', 'baz'] }, 6 /* ProcessState.KilledByProcess */, undefined), { code: 1, message: `The terminal process "foo 'bar', 'baz'" terminated with exit code: 1.` });
            });
            test('should return friendly message when executable and arguments are omitted for non-zero exit codes', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 1, message: `The terminal process failed to launch (exit code: 1).` });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, {}, 5 /* ProcessState.KilledByUser */, undefined), { code: 1, message: `The terminal process terminated with exit code: 1.` });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, {}, 6 /* ProcessState.KilledByProcess */, undefined), { code: 1, message: `The terminal process terminated with exit code: 1.` });
            });
            test('should ignore pty host-related errors', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ message: 'Could not find pty with id 16' }, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: undefined, message: undefined });
            });
            test('should format conpty failure code 5', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ code: 5, message: 'A native exception occurred during launch (Cannot create process, error code: 5)' }, { executable: 'foo' }, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 5, message: `The terminal process failed to launch: Access was denied to the path containing your executable "foo". Manage and change your permissions to get this to work.` });
            });
            test('should format conpty failure code 267', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ code: 267, message: 'A native exception occurred during launch (Cannot create process, error code: 267)' }, {}, 4 /* ProcessState.KilledDuringLaunch */, '/foo'), { code: 267, message: `The terminal process failed to launch: Invalid starting directory "/foo", review your terminal.integrated.cwd setting.` });
            });
            test('should format conpty failure code 1260', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ code: 1260, message: 'A native exception occurred during launch (Cannot create process, error code: 1260)' }, { executable: 'foo' }, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 1260, message: `The terminal process failed to launch: Windows cannot open this program because it has been prevented by a software restriction policy. For more information, open Event Viewer or contact your system Administrator.` });
            });
            test('should format generic failures', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ code: 123, message: 'A native exception occurred during launch (Cannot create process, error code: 123)' }, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 123, message: `The terminal process failed to launch: A native exception occurred during launch (Cannot create process, error code: 123).` });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ code: 123, message: 'foo' }, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 123, message: `The terminal process failed to launch: foo.` });
            });
        });
        suite('TerminalLabelComputer', () => {
            let instantiationService;
            let capabilities;
            function createInstance(partial) {
                const capabilities = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
                if (!platform_1.isWindows) {
                    capabilities.add(1 /* TerminalCapability.NaiveCwdDetection */, null);
                }
                return {
                    shellLaunchConfig: {},
                    cwd: 'cwd',
                    initialCwd: undefined,
                    processName: '',
                    sequence: undefined,
                    workspaceFolder: undefined,
                    staticTitle: undefined,
                    capabilities,
                    title: '',
                    description: '',
                    userHome: undefined,
                    ...partial
                };
            }
            setup(async () => {
                instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, store);
                capabilities = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
                if (!platform_1.isWindows) {
                    capabilities.add(1 /* TerminalCapability.NaiveCwdDetection */, null);
                }
            });
            function createLabelComputer(configuration) {
                instantiationService.set(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService(configuration));
                instantiationService.set(terminal_1.ITerminalConfigurationService, store.add(instantiationService.createInstance(terminalConfigurationService_1.TerminalConfigurationService)));
                return store.add(instantiationService.createInstance(terminalInstance_1.TerminalLabelComputer));
            }
            test('should resolve to "" when the template variables are empty', () => {
                const terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' - ', title: '', description: '' } } } });
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: '' }));
                // TODO:
                // terminalLabelComputer.onLabelChanged(e => {
                // 	strictEqual(e.title, '');
                // 	strictEqual(e.description, '');
                // });
                (0, assert_1.strictEqual)(terminalLabelComputer.title, '');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, '');
            });
            test('should resolve cwd', () => {
                const terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' - ', title: '${cwd}', description: '${cwd}' } } } });
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, cwd: ROOT_1 }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, ROOT_1);
                (0, assert_1.strictEqual)(terminalLabelComputer.description, ROOT_1);
            });
            test('should resolve workspaceFolder', () => {
                const terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' - ', title: '${workspaceFolder}', description: '${workspaceFolder}' } } } });
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'zsh', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'folder' }) } }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'folder');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'folder');
            });
            test('should resolve local', () => {
                const terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' - ', title: '${local}', description: '${local}' } } } });
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'zsh', shellLaunchConfig: { type: 'Local' } }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'Local');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'Local');
            });
            test('should resolve process', () => {
                const terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' - ', title: '${process}', description: '${process}' } } } });
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'zsh' }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'zsh');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'zsh');
            });
            test('should resolve sequence', () => {
                const terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' - ', title: '${sequence}', description: '${sequence}' } } } });
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, sequence: 'sequence' }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'sequence');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'sequence');
            });
            test('should resolve task', () => {
                const terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${process}${separator}${task}', description: '${task}' } } } });
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'zsh', shellLaunchConfig: { type: 'Task' } }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'zsh ~ Task');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'Task');
            });
            test('should resolve separator', () => {
                const terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${separator}', description: '${separator}' } } } });
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'zsh', shellLaunchConfig: { type: 'Task' } }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'zsh');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, '');
            });
            test('should always return static title when specified', () => {
                const terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${process}', description: '${workspaceFolder}' } } } });
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'process', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'folder' }) }, staticTitle: 'my-title' }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'my-title');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'folder');
            });
            test('should provide cwdFolder for all cwds only when in multi-root', () => {
                const terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${process}${separator}${cwdFolder}', description: '${cwdFolder}' } } } });
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'process', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: ROOT_1 }) }, cwd: ROOT_1 }));
                // single-root, cwd is same as root
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'process');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, '');
                // multi-root
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'process', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: ROOT_1 }) }, cwd: ROOT_2 }));
                if (platform_1.isWindows) {
                    (0, assert_1.strictEqual)(terminalLabelComputer.title, 'process');
                    (0, assert_1.strictEqual)(terminalLabelComputer.description, '');
                }
                else {
                    (0, assert_1.strictEqual)(terminalLabelComputer.title, 'process ~ root2');
                    (0, assert_1.strictEqual)(terminalLabelComputer.description, 'root2');
                }
            });
            test('should hide cwdFolder in single folder workspaces when cwd matches the workspace\'s default cwd even when slashes differ', async () => {
                let terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${process}${separator}${cwdFolder}', description: '${cwdFolder}' } } } });
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'process', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: ROOT_1 }) }, cwd: ROOT_1 }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'process');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, '');
                if (!platform_1.isWindows) {
                    terminalLabelComputer = createLabelComputer({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${process}${separator}${cwdFolder}', description: '${cwdFolder}' } } } });
                    terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'process', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: ROOT_1 }) }, cwd: ROOT_2 }));
                    (0, assert_1.strictEqual)(terminalLabelComputer.title, 'process ~ root2');
                    (0, assert_1.strictEqual)(terminalLabelComputer.description, 'root2');
                }
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxJbnN0YW5jZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9icm93c2VyL3Rlcm1pbmFsSW5zdGFuY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTJCaEcsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDO0lBQzNCLE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQU8sRUFBQyxLQUFLLENBQUMsQ0FBQztJQUM5QixNQUFNLEtBQUssR0FBRyxZQUFZLENBQUM7SUFDM0IsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBTyxFQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTlCLE1BQU0sa0NBQW1DLFNBQVEsMERBQWtDO1FBQ3pFLEtBQUssQ0FBQyxpQkFBaUI7WUFDL0IsT0FBTztnQkFDTixXQUFXLEVBQUUsT0FBTztnQkFDcEIsSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLEdBQUcsRUFBRTtvQkFDSixJQUFJLEVBQUUsTUFBTTtpQkFDWjtnQkFDRCxTQUFTLEVBQUUsSUFBSTtnQkFDZixZQUFZLEVBQUUsS0FBSztnQkFDbkIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQWdCO2lCQUNwQjtnQkFDRCxLQUFLLEVBQUUscUJBQXFCO2FBQzVCLENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUFFRCxNQUFNLDJCQUEyQixHQUFHO1FBQ25DLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDO1FBQ2QsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7UUFDaEIsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVM7S0FDcEIsQ0FBQztJQUVGLE1BQU0sMEJBQTBCLEdBQUc7UUFDbEMsR0FBRyxFQUFF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