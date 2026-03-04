/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/files/common/files", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/storage/common/storage", "vs/workbench/contrib/terminal/common/history", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert_1, buffer_1, network_1, path_1, platform_1, process_1, uri_1, utils_1, configuration_1, testConfigurationService_1, files_1, instantiationServiceMock_1, storage_1, history_1, remoteAgentService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getConfig(limit) {
        return {
            terminal: {
                integrated: {
                    shellIntegration: {
                        history: limit
                    }
                }
            }
        };
    }
    const expectedCommands = [
        'single line command',
        'git commit -m "A wrapped line in pwsh history\n\nSome commit description\n\nFixes #xyz"',
        'git status',
        'two "\nline"'
    ];
    suite('Terminal history', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('TerminalPersistedHistory', () => {
            let history;
            let instantiationService;
            let configurationService;
            setup(() => {
                configurationService = new testConfigurationService_1.TestConfigurationService(getConfig(5));
                instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
                instantiationService.set(configuration_1.IConfigurationService, configurationService);
                instantiationService.set(storage_1.IStorageService, store.add(new workbenchTestServices_1.TestStorageService()));
                history = store.add(instantiationService.createInstance((history_1.TerminalPersistedHistory), 'test'));
            });
            teardown(() => {
                instantiationService.dispose();
            });
            test('should support adding items to the cache and respect LRU', () => {
                history.add('foo', 1);
                (0, assert_1.deepStrictEqual)(Array.from(history.entries), [
                    ['foo', 1]
                ]);
                history.add('bar', 2);
                (0, assert_1.deepStrictEqual)(Array.from(history.entries), [
                    ['foo', 1],
                    ['bar', 2]
                ]);
                history.add('foo', 1);
                (0, assert_1.deepStrictEqual)(Array.from(history.entries), [
                    ['bar', 2],
                    ['foo', 1]
                ]);
            });
            test('should support removing specific items', () => {
                history.add('1', 1);
                history.add('2', 2);
                history.add('3', 3);
                history.add('4', 4);
                history.add('5', 5);
                (0, assert_1.strictEqual)(Array.from(history.entries).length, 5);
                history.add('6', 6);
                (0, assert_1.strictEqual)(Array.from(history.entries).length, 5);
            });
            test('should limit the number of entries based on config', () => {
                history.add('1', 1);
                history.add('2', 2);
                history.add('3', 3);
                history.add('4', 4);
                history.add('5', 5);
                (0, assert_1.strictEqual)(Array.from(history.entries).length, 5);
                history.add('6', 6);
                (0, assert_1.strictEqual)(Array.from(history.entries).length, 5);
                configurationService.setUserConfiguration('terminal', getConfig(2).terminal);
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true });
                (0, assert_1.strictEqual)(Array.from(history.entries).length, 2);
                history.add('7', 7);
                (0, assert_1.strictEqual)(Array.from(history.entries).length, 2);
                configurationService.setUserConfiguration('terminal', getConfig(3).terminal);
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true });
                (0, assert_1.strictEqual)(Array.from(history.entries).length, 2);
                history.add('8', 8);
                (0, assert_1.strictEqual)(Array.from(history.entries).length, 3);
                history.add('9', 9);
                (0, assert_1.strictEqual)(Array.from(history.entries).length, 3);
            });
            test('should reload from storage service after recreation', () => {
                history.add('1', 1);
                history.add('2', 2);
                history.add('3', 3);
                (0, assert_1.strictEqual)(Array.from(history.entries).length, 3);
                const history2 = store.add(instantiationService.createInstance(history_1.TerminalPersistedHistory, 'test'));
                (0, assert_1.strictEqual)(Array.from(history2.entries).length, 3);
            });
        });
        suite('fetchBashHistory', () => {
            let fileScheme;
            let filePath;
            const fileContent = [
                'single line command',
                'git commit -m "A wrapped line in pwsh history',
                '',
                'Some commit description',
                '',
                'Fixes #xyz"',
                'git status',
                'two "',
                'line"'
            ].join('\n');
            let instantiationService;
            let remoteConnection = null;
            let remoteEnvironment = null;
            setup(() => {
                instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                instantiationService.stub(files_1.IFileService, {
                    async readFile(resource) {
                        const expected = uri_1.URI.from({ scheme: fileScheme, path: filePath });
                        (0, assert_1.strictEqual)(resource.scheme, expected.scheme);
                        (0, assert_1.strictEqual)(resource.path, expected.path);
                        return { value: buffer_1.VSBuffer.fromString(fileContent) };
                    }
                });
                instantiationService.stub(remoteAgentService_1.IRemoteAgentService, {
                    async getEnvironment() { return remoteEnvironment; },
                    getConnection() { return remoteConnection; }
                });
            });
            teardown(() => {
                instantiationService.dispose();
            });
            if (!platform_1.isWindows) {
                suite('local', () => {
                    let originalEnvValues;
                    setup(() => {
                        originalEnvValues = { HOME: process_1.env['HOME'] };
                        process_1.env['HOME'] = '/home/user';
                        remoteConnection = { remoteAuthority: 'some-remote' };
                        fileScheme = network_1.Schemas.vscodeRemote;
                        filePath = '/home/user/.bash_history';
                    });
                    teardown(() => {
                        if (originalEnvValues['HOME'] === undefined) {
                            delete process_1.env['HOME'];
                        }
                        else {
                            process_1.env['HOME'] = originalEnvValues['HOME'];
                        }
                    });
                    test('current OS', async () => {
                        filePath = '/home/user/.bash_history';
                        (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchBashHistory))), expectedCommands);
                    });
                });
            }
            suite('remote', () => {
                let originalEnvValues;
                setup(() => {
                    originalEnvValues = { HOME: process_1.env['HOME'] };
                    process_1.env['HOME'] = '/home/user';
                    remoteConnection = { remoteAuthority: 'some-remote' };
                    fileScheme = network_1.Schemas.vscodeRemote;
                    filePath = '/home/user/.bash_history';
                });
                teardown(() => {
                    if (originalEnvValues['HOME'] === undefined) {
                        delete process_1.env['HOME'];
                    }
                    else {
                        process_1.env['HOME'] = originalEnvValues['HOME'];
                    }
                });
                test('Windows', async () => {
                    remoteEnvironment = { os: 1 /* OperatingSystem.Windows */ };
                    (0, assert_1.strictEqual)(await instantiationService.invokeFunction(history_1.fetchBashHistory), undefined);
                });
                test('macOS', async () => {
                    remoteEnvironment = { os: 2 /* OperatingSystem.Macintosh */ };
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchBashHistory))), expectedCommands);
                });
                test('Linux', async () => {
                    remoteEnvironment = { os: 3 /* OperatingSystem.Linux */ };
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchBashHistory))), expectedCommands);
                });
            });
        });
        suite('fetchZshHistory', () => {
            let fileScheme;
            let filePath;
            const fileContent = [
                ': 1655252330:0;single line command',
                ': 1655252330:0;git commit -m "A wrapped line in pwsh history\\',
                '\\',
                'Some commit description\\',
                '\\',
                'Fixes #xyz"',
                ': 1655252330:0;git status',
                ': 1655252330:0;two "\\',
                'line"'
            ].join('\n');
            let instantiationService;
            let remoteConnection = null;
            let remoteEnvironment = null;
            setup(() => {
                instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                instantiationService.stub(files_1.IFileService, {
                    async readFile(resource) {
                        const expected = uri_1.URI.from({ scheme: fileScheme, path: filePath });
                        (0, assert_1.strictEqual)(resource.scheme, expected.scheme);
                        (0, assert_1.strictEqual)(resource.path, expected.path);
                        return { value: buffer_1.VSBuffer.fromString(fileContent) };
                    }
                });
                instantiationService.stub(remoteAgentService_1.IRemoteAgentService, {
                    async getEnvironment() { return remoteEnvironment; },
                    getConnection() { return remoteConnection; }
                });
            });
            teardown(() => {
                instantiationService.dispose();
            });
            if (!platform_1.isWindows) {
                suite('local', () => {
                    let originalEnvValues;
                    setup(() => {
                        originalEnvValues = { HOME: process_1.env['HOME'] };
                        process_1.env['HOME'] = '/home/user';
                        remoteConnection = { remoteAuthority: 'some-remote' };
                        fileScheme = network_1.Schemas.vscodeRemote;
                        filePath = '/home/user/.bash_history';
                    });
                    teardown(() => {
                        if (originalEnvValues['HOME'] === undefined) {
                            delete process_1.env['HOME'];
                        }
                        else {
                            process_1.env['HOME'] = originalEnvValues['HOME'];
                        }
                    });
                    test('current OS', async () => {
                        filePath = '/home/user/.zsh_history';
                        (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchZshHistory))), expectedCommands);
                    });
                });
            }
            suite('remote', () => {
                let originalEnvValues;
                setup(() => {
                    originalEnvValues = { HOME: process_1.env['HOME'] };
                    process_1.env['HOME'] = '/home/user';
                    remoteConnection = { remoteAuthority: 'some-remote' };
                    fileScheme = network_1.Schemas.vscodeRemote;
                    filePath = '/home/user/.zsh_history';
                });
                teardown(() => {
                    if (originalEnvValues['HOME'] === undefined) {
                        delete process_1.env['HOME'];
                    }
                    else {
                        process_1.env['HOME'] = originalEnvValues['HOME'];
                    }
                });
                test('Windows', async () => {
                    remoteEnvironment = { os: 1 /* OperatingSystem.Windows */ };
                    (0, assert_1.strictEqual)(await instantiationService.invokeFunction(history_1.fetchZshHistory), undefined);
                });
                test('macOS', async () => {
                    remoteEnvironment = { os: 2 /* OperatingSystem.Macintosh */ };
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchZshHistory))), expectedCommands);
                });
                test('Linux', async () => {
                    remoteEnvironment = { os: 3 /* OperatingSystem.Linux */ };
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchZshHistory))), expectedCommands);
                });
            });
        });
        suite('fetchPwshHistory', () => {
            let fileScheme;
            let filePath;
            const fileContent = [
                'single line command',
                'git commit -m "A wrapped line in pwsh history`',
                '`',
                'Some commit description`',
                '`',
                'Fixes #xyz"',
                'git status',
                'two "`',
                'line"'
            ].join('\n');
            let instantiationService;
            let remoteConnection = null;
            let remoteEnvironment = null;
            setup(() => {
                instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                instantiationService.stub(files_1.IFileService, {
                    async readFile(resource) {
                        const expected = uri_1.URI.from({ scheme: fileScheme, path: filePath });
                        if (resource.scheme !== expected.scheme || resource.fsPath !== expected.fsPath) {
                            (0, assert_1.fail)(`Unexpected file scheme/path ${resource.scheme} ${resource.fsPath}`);
                        }
                        return { value: buffer_1.VSBuffer.fromString(fileContent) };
                    }
                });
                instantiationService.stub(remoteAgentService_1.IRemoteAgentService, {
                    async getEnvironment() { return remoteEnvironment; },
                    getConnection() { return remoteConnection; }
                });
            });
            teardown(() => {
                instantiationService.dispose();
            });
            suite('local', () => {
                let originalEnvValues;
                setup(() => {
                    originalEnvValues = { HOME: process_1.env['HOME'], APPDATA: process_1.env['APPDATA'] };
                    process_1.env['HOME'] = '/home/user';
                    process_1.env['APPDATA'] = 'C:\\AppData';
                    remoteConnection = { remoteAuthority: 'some-remote' };
                    fileScheme = network_1.Schemas.vscodeRemote;
                    filePath = '/home/user/.zsh_history';
                    originalEnvValues = { HOME: process_1.env['HOME'], APPDATA: process_1.env['APPDATA'] };
                });
                teardown(() => {
                    if (originalEnvValues['HOME'] === undefined) {
                        delete process_1.env['HOME'];
                    }
                    else {
                        process_1.env['HOME'] = originalEnvValues['HOME'];
                    }
                    if (originalEnvValues['APPDATA'] === undefined) {
                        delete process_1.env['APPDATA'];
                    }
                    else {
                        process_1.env['APPDATA'] = originalEnvValues['APPDATA'];
                    }
                });
                test('current OS', async () => {
                    if (platform_1.isWindows) {
                        filePath = (0, path_1.join)(process_1.env['APPDATA'], 'Microsoft\\Windows\\PowerShell\\PSReadLine\\ConsoleHost_history.txt');
                    }
                    else {
                        filePath = (0, path_1.join)(process_1.env['HOME'], '.local/share/powershell/PSReadline/ConsoleHost_history.txt');
                    }
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchPwshHistory))), expectedCommands);
                });
            });
            suite('remote', () => {
                let originalEnvValues;
                setup(() => {
                    remoteConnection = { remoteAuthority: 'some-remote' };
                    fileScheme = network_1.Schemas.vscodeRemote;
                    originalEnvValues = { HOME: process_1.env['HOME'], APPDATA: process_1.env['APPDATA'] };
                });
                teardown(() => {
                    if (originalEnvValues['HOME'] === undefined) {
                        delete process_1.env['HOME'];
                    }
                    else {
                        process_1.env['HOME'] = originalEnvValues['HOME'];
                    }
                    if (originalEnvValues['APPDATA'] === undefined) {
                        delete process_1.env['APPDATA'];
                    }
                    else {
                        process_1.env['APPDATA'] = originalEnvValues['APPDATA'];
                    }
                });
                test('Windows', async () => {
                    remoteEnvironment = { os: 1 /* OperatingSystem.Windows */ };
                    process_1.env['APPDATA'] = 'C:\\AppData';
                    filePath = 'C:\\AppData\\Microsoft\\Windows\\PowerShell\\PSReadLine\\ConsoleHost_history.txt';
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchPwshHistory))), expectedCommands);
                });
                test('macOS', async () => {
                    remoteEnvironment = { os: 2 /* OperatingSystem.Macintosh */ };
                    process_1.env['HOME'] = '/home/user';
                    filePath = '/home/user/.local/share/powershell/PSReadline/ConsoleHost_history.txt';
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchPwshHistory))), expectedCommands);
                });
                test('Linux', async () => {
                    remoteEnvironment = { os: 3 /* OperatingSystem.Linux */ };
                    process_1.env['HOME'] = '/home/user';
                    filePath = '/home/user/.local/share/powershell/PSReadline/ConsoleHost_history.txt';
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchPwshHistory))), expectedCommands);
                });
            });
        });
        suite('fetchFishHistory', () => {
            let fileScheme;
            let filePath;
            const fileContent = [
                '- cmd: single line command',
                '  when: 1650000000',
                '- cmd: git commit -m "A wrapped line in pwsh history\\n\\nSome commit description\\n\\nFixes #xyz"',
                '  when: 1650000010',
                '- cmd: git status',
                '  when: 1650000020',
                '- cmd: two "\\nline"',
                '  when: 1650000030',
            ].join('\n');
            let instantiationService;
            let remoteConnection = null;
            let remoteEnvironment = null;
            setup(() => {
                instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                instantiationService.stub(files_1.IFileService, {
                    async readFile(resource) {
                        const expected = uri_1.URI.from({ scheme: fileScheme, path: filePath });
                        (0, assert_1.strictEqual)(resource.scheme, expected.scheme);
                        (0, assert_1.strictEqual)(resource.path, expected.path);
                        return { value: buffer_1.VSBuffer.fromString(fileContent) };
                    }
                });
                instantiationService.stub(remoteAgentService_1.IRemoteAgentService, {
                    async getEnvironment() { return remoteEnvironment; },
                    getConnection() { return remoteConnection; }
                });
            });
            teardown(() => {
                instantiationService.dispose();
            });
            if (!platform_1.isWindows) {
                suite('local', () => {
                    let originalEnvValues;
                    setup(() => {
                        originalEnvValues = { HOME: process_1.env['HOME'] };
                        process_1.env['HOME'] = '/home/user';
                        remoteConnection = { remoteAuthority: 'some-remote' };
                        fileScheme = network_1.Schemas.vscodeRemote;
                        filePath = '/home/user/.local/share/fish/fish_history';
                    });
                    teardown(() => {
                        if (originalEnvValues['HOME'] === undefined) {
                            delete process_1.env['HOME'];
                        }
                        else {
                            process_1.env['HOME'] = originalEnvValues['HOME'];
                        }
                    });
                    test('current OS', async () => {
                        filePath = '/home/user/.local/share/fish/fish_history';
                        (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchFishHistory))), expectedCommands);
                    });
                });
                suite('local (overriden path)', () => {
                    let originalEnvValues;
                    setup(() => {
                        originalEnvValues = { XDG_DATA_HOME: process_1.env['XDG_DATA_HOME'] };
                        process_1.env['XDG_DATA_HOME'] = '/home/user/data-home';
                        remoteConnection = { remoteAuthority: 'some-remote' };
                        fileScheme = network_1.Schemas.vscodeRemote;
                        filePath = '/home/user/data-home/fish/fish_history';
                    });
                    teardown(() => {
                        if (originalEnvValues['XDG_DATA_HOME'] === undefined) {
                            delete process_1.env['XDG_DATA_HOME'];
                        }
                        else {
                            process_1.env['XDG_DATA_HOME'] = originalEnvValues['XDG_DATA_HOME'];
                        }
                    });
                    test('current OS', async () => {
                        filePath = '/home/user/data-home/fish/fish_history';
                        (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchFishHistory))), expectedCommands);
                    });
                });
            }
            suite('remote', () => {
                let originalEnvValues;
                setup(() => {
                    originalEnvValues = { HOME: process_1.env['HOME'] };
                    process_1.env['HOME'] = '/home/user';
                    remoteConnection = { remoteAuthority: 'some-remote' };
                    fileScheme = network_1.Schemas.vscodeRemote;
                    filePath = '/home/user/.local/share/fish/fish_history';
                });
                teardown(() => {
                    if (originalEnvValues['HOME'] === undefined) {
                        delete process_1.env['HOME'];
                    }
                    else {
                        process_1.env['HOME'] = originalEnvValues['HOME'];
                    }
                });
                test('Windows', async () => {
                    remoteEnvironment = { os: 1 /* OperatingSystem.Windows */ };
                    (0, assert_1.strictEqual)(await instantiationService.invokeFunction(history_1.fetchFishHistory), undefined);
                });
                test('macOS', async () => {
                    remoteEnvironment = { os: 2 /* OperatingSystem.Macintosh */ };
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchFishHistory))), expectedCommands);
                });
                test('Linux', async () => {
                    remoteEnvironment = { os: 3 /* OperatingSystem.Linux */ };
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchFishHistory))), expectedCommands);
                });
            });
            suite('remote (overriden path)', () => {
                let originalEnvValues;
                setup(() => {
                    originalEnvValues = { XDG_DATA_HOME: process_1.env['XDG_DATA_HOME'] };
                    process_1.env['XDG_DATA_HOME'] = '/home/user/data-home';
                    remoteConnection = { remoteAuthority: 'some-remote' };
                    fileScheme = network_1.Schemas.vscodeRemote;
                    filePath = '/home/user/data-home/fish/fish_history';
                });
                teardown(() => {
                    if (originalEnvValues['XDG_DATA_HOME'] === undefined) {
                        delete process_1.env['XDG_DATA_HOME'];
                    }
                    else {
                        process_1.env['XDG_DATA_HOME'] = originalEnvValues['XDG_DATA_HOME'];
                    }
                });
                test('Windows', async () => {
                    remoteEnvironment = { os: 1 /* OperatingSystem.Windows */ };
                    (0, assert_1.strictEqual)(await instantiationService.invokeFunction(history_1.fetchFishHistory), undefined);
                });
                test('macOS', async () => {
                    remoteEnvironment = { os: 2 /* OperatingSystem.Macintosh */ };
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchFishHistory))), expectedCommands);
                });
                test('Linux', async () => {
                    remoteEnvironment = { os: 3 /* OperatingSystem.Linux */ };
                    (0, assert_1.deepStrictEqual)(Array.from((await instantiationService.invokeFunction(history_1.fetchFishHistory))), expectedCommands);
                });
            });
            suite('sanitizeFishHistoryCmd', () => {
                test('valid new-lines', () => {
                    /**
                     * Valid new-lines have odd number of leading backslashes: \n, \\\n, \\\\\n
                     */
                    const cases = [
                        '\\n',
                        '\\n at start',
                        'some \\n in the middle',
                        'at the end \\n',
                        '\\\\\\n',
                        '\\\\\\n valid at start',
                        'valid \\\\\\n in the middle',
                        'valid in the end \\\\\\n',
                        '\\\\\\\\\\n',
                        '\\\\\\\\\\n valid at start',
                        'valid \\\\\\\\\\n in the middle',
                        'valid in the end \\\\\\\\\\n',
                        'mixed valid \\r\\n',
                        'mixed valid \\\\\\r\\n',
                        'mixed valid \\r\\\\\\n',
                    ];
                    for (const x of cases) {
                        (0, assert_1.ok)((0, history_1.sanitizeFishHistoryCmd)(x).includes('\n'));
                    }
                });
                test('invalid new-lines', () => {
                    /**
                     * Invalid new-lines have even number of leading backslashes: \\n, \\\\n, \\\\\\n
                     */
                    const cases = [
                        '\\\\n',
                        '\\\\n invalid at start',
                        'invalid \\\\n in the middle',
                        'invalid in the end \\\\n',
                        '\\\\\\\\n',
                        '\\\\\\\\n invalid at start',
                        'invalid \\\\\\\\n in the middle',
                        'invalid in the end \\\\\\\\n',
                        'mixed invalid \\r\\\\n',
                        'mixed invalid \\r\\\\\\\\n',
                        'echo "\\\\n"',
                    ];
                    for (const x of cases) {
                        (0, assert_1.ok)(!(0, history_1.sanitizeFishHistoryCmd)(x).includes('\n'));
                    }
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9jb21tb24vaGlzdG9yeS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBb0JoRyxTQUFTLFNBQVMsQ0FBQyxLQUFhO1FBQy9CLE9BQU87WUFDTixRQUFRLEVBQUU7Z0JBQ1QsVUFBVSxFQUFFO29CQUNYLGdCQUFnQixFQUFFO3dCQUNqQixPQUFPLEVBQUUsS0FBSztxQkFDZDtpQkFDRDthQUNEO1NBQ0QsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFNLGdCQUFnQixHQUFHO1FBQ3hCLHFCQUFxQjtRQUNyQix5RkFBeUY7UUFDekYsWUFBWTtRQUNaLGNBQWM7S0FDZCxDQUFDO0lBRUYsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUM5QixNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsS0FBSyxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtZQUN0QyxJQUFJLE9BQTBDLENBQUM7WUFDL0MsSUFBSSxvQkFBOEMsQ0FBQztZQUNuRCxJQUFJLG9CQUE4QyxDQUFDO1lBRW5ELEtBQUssQ0FBQyxHQUFHLEVBQUU7Z0JBQ1Ysb0JBQW9CLEdBQUcsSUFBSSxtREFBd0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEUsb0JBQW9CLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1EQUF3QixFQUFFLENBQUMsQ0FBQztnQkFDakUsb0JBQW9CLENBQUMsR0FBRyxDQUFDLHFDQUFxQixFQUFFLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3RFLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx5QkFBZSxFQUFFLEtBQUssQ0FB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