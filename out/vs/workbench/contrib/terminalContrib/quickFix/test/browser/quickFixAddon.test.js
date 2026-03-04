/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextview/browser/contextMenuService", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/contrib/terminalContrib/quickFix/browser/terminalQuickFixBuiltinActions", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFixAddon", "vs/base/common/uri", "vs/base/common/event", "vs/platform/label/common/label", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix", "vs/amdX", "vs/editor/test/browser/editorTestServices", "vs/base/test/common/utils"], function (require, exports, assert_1, platform_1, configuration_1, testConfigurationService_1, contextMenuService_1, contextView_1, instantiationServiceMock_1, log_1, commandDetectionCapability_1, terminalCapabilityStore_1, terminalQuickFixBuiltinActions_1, quickFixAddon_1, uri_1, event_1, label_1, opener_1, storage_1, workbenchTestServices_1, quickFix_1, amdX_1, editorTestServices_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('QuickFixAddon', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let quickFixAddon;
        let commandDetection;
        let commandService;
        let openerService;
        let labelService;
        let terminal;
        let instantiationService;
        setup(async () => {
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            terminal = store.add(new TerminalCtor({
                allowProposedApi: true,
                cols: 80,
                rows: 30
            }));
            instantiationService.stub(storage_1.IStorageService, store.add(new workbenchTestServices_1.TestStorageService()));
            instantiationService.stub(quickFix_1.ITerminalQuickFixService, {
                onDidRegisterProvider: event_1.Event.None,
                onDidUnregisterProvider: event_1.Event.None,
                onDidRegisterCommandSelector: event_1.Event.None,
                extensionQuickFixes: Promise.resolve([])
            });
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(label_1.ILabelService, {});
            const capabilities = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            commandDetection = store.add(instantiationService.createInstance(commandDetectionCapability_1.CommandDetectionCapability, terminal));
            capabilities.add(2 /* TerminalCapability.CommandDetection */, commandDetection);
            instantiationService.stub(contextView_1.IContextMenuService, store.add(instantiationService.createInstance(contextMenuService_1.ContextMenuService)));
            instantiationService.stub(opener_1.IOpenerService, {});
            commandService = new editorTestServices_1.TestCommandService(instantiationService);
            quickFixAddon = instantiationService.createInstance(quickFixAddon_1.TerminalQuickFixAddon, [], capabilities);
            terminal.loadAddon(quickFixAddon);
        });
        suite('registerCommandFinishedListener & getMatchActions', () => {
            suite('gitSimilarCommand', () => {
                const expectedMap = new Map();
                const command = `git sttatus`;
                let output = `git: 'sttatus' is not a git command. See 'git --help'.

			The most similar command is
			status`;
                const exitCode = 1;
                const actions = [{
                        id: 'Git Similar',
                        enabled: true,
                        label: 'Run: git status',
                        tooltip: 'Run: git status',
                        command: 'git status'
                    }];
                const outputLines = output.split('\n');
                setup(() => {
                    const command = (0, terminalQuickFixBuiltinActions_1.gitSimilar)();
                    expectedMap.set(command.commandLineMatcher.toString(), [command]);
                    quickFixAddon.registerCommandFinishedListener(command);
                });
                suite('returns undefined when', () => {
                    test('output does not match', async () => {
                        (0, assert_1.strictEqual)(await ((0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, [`invalid output`]), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('command does not match', async () => {
                        (0, assert_1.strictEqual)(await ((0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`gt sttatus`, output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, outputLines), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                });
                suite('returns actions when', () => {
                    test('expected unix exit code', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, outputLines), expectedMap, commandService, openerService, labelService)), actions);
                    });
                    test('matching exit status', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, 2, outputLines), expectedMap, commandService, openerService, labelService)), actions);
                    });
                });
                suite('returns match', () => {
                    test('returns match', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, outputLines), expectedMap, commandService, openerService, labelService)), actions);
                    });
                    test('returns multiple match', async () => {
                        output = `git: 'pu' is not a git command. See 'git --help'.
				The most similar commands are
						pull
						push`;
                        const actions = [{
                                id: 'Git Similar',
                                enabled: true,
                                label: 'Run: git pull',
                                tooltip: 'Run: git pull',
                                command: 'git pull'
                            }, {
                                id: 'Git Similar',
                                enabled: true,
                                label: 'Run: git push',
                                tooltip: 'Run: git push',
                                command: 'git push'
                            }];
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand('git pu', output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, output.split('\n')), expectedMap, commandService, openerService, labelService)), actions);
                    });
                    test('passes any arguments through', async () => {
                        output = `git: 'checkoutt' is not a git command. See 'git --help'.
				The most similar commands are
						checkout`;
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand('git checkoutt .', output, terminalQuickFixBuiltinActions_1.GitSimilarOutputRegex, exitCode, output.split('\n')), expectedMap, commandService, openerService, labelService)), [{
                                id: 'Git Similar',
                                enabled: true,
                                label: 'Run: git checkout .',
                                tooltip: 'Run: git checkout .',
                                command: 'git checkout .'
                            }]);
                    });
                });
            });
            suite('gitTwoDashes', () => {
                const expectedMap = new Map();
                const command = `git add . -all`;
                const output = 'error: did you mean `--all` (with two dashes)?';
                const exitCode = 1;
                const actions = [{
                        id: 'Git Two Dashes',
                        enabled: true,
                        label: 'Run: git add . --all',
                        tooltip: 'Run: git add . --all',
                        command: 'git add . --all'
                    }];
                setup(() => {
                    const command = (0, terminalQuickFixBuiltinActions_1.gitTwoDashes)();
                    expectedMap.set(command.commandLineMatcher.toString(), [command]);
                    quickFixAddon.registerCommandFinishedListener(command);
                });
                suite('returns undefined when', () => {
                    test('output does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitTwoDashesRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('command does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`gt sttatus`, output, terminalQuickFixBuiltinActions_1.GitTwoDashesRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                });
                suite('returns actions when', () => {
                    test('expected unix exit code', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitTwoDashesRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                    });
                    test('matching exit status', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitTwoDashesRegex, 2), expectedMap, commandService, openerService, labelService)), actions);
                    });
                });
            });
            suite('gitPull', () => {
                const expectedMap = new Map();
                const command = `git checkout vnext`;
                const output = 'Already on \'vnext\' \n Your branch is behind \'origin/vnext\' by 1 commit, and can be fast-forwarded.';
                const exitCode = 0;
                const actions = [{
                        id: 'Git Pull',
                        enabled: true,
                        label: 'Run: git pull',
                        tooltip: 'Run: git pull',
                        command: 'git pull'
                    }];
                setup(() => {
                    const command = (0, terminalQuickFixBuiltinActions_1.gitPull)();
                    expectedMap.set(command.commandLineMatcher.toString(), [command]);
                    quickFixAddon.registerCommandFinishedListener(command);
                });
                suite('returns undefined when', () => {
                    test('output does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitPullOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('command does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`gt add`, output, terminalQuickFixBuiltinActions_1.GitPullOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('exit code does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPullOutputRegex, 2), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                });
                suite('returns actions when', () => {
                    test('matching exit status, command, ouput', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPullOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                    });
                });
            });
            if (!platform_1.isWindows) {
                suite('freePort', () => {
                    const expectedMap = new Map();
                    const portCommand = `yarn start dev`;
                    const output = `yarn run v1.22.17
			warning ../../package.json: No license field
			Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
				at Server.setupListenHandle [as _listen2] (node:net:1315:16)
				at listenInCluster (node:net:1363:12)
				at doListen (node:net:1501:7)
				at processTicksAndRejections (node:internal/process/task_queues:84:21)
			Emitted 'error' event on WebSocketServer instance at:
				at Server.emit (node:events:394:28)
				at emitErrorNT (node:net:1342:8)
				at processTicksAndRejections (node:internal/process/task_queues:83:21) {
			}
			error Command failed with exit code 1.
			info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.`;
                    const actionOptions = [{
                            id: 'Free Port',
                            label: 'Free port 3000',
                            run: true,
                            tooltip: 'Free port 3000',
                            enabled: true
                        }];
                    setup(() => {
                        const command = (0, terminalQuickFixBuiltinActions_1.freePort)(() => Promise.resolve());
                        expectedMap.set(command.commandLineMatcher.toString(), [command]);
                        quickFixAddon.registerCommandFinishedListener(command);
                    });
                    suite('returns undefined when', () => {
                        test('output does not match', async () => {
                            (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(portCommand, `invalid output`, terminalQuickFixBuiltinActions_1.FreePortOutputRegex), expectedMap, commandService, openerService, labelService)), undefined);
                        });
                    });
                    test('returns actions', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(portCommand, output, terminalQuickFixBuiltinActions_1.FreePortOutputRegex), expectedMap, commandService, openerService, labelService)), actionOptions);
                    });
                });
            }
            suite('gitPushSetUpstream', () => {
                const expectedMap = new Map();
                const command = `git push`;
                const output = `fatal: The current branch test22 has no upstream branch.
			To push the current branch and set the remote as upstream, use

				git push --set-upstream origin test22`;
                const exitCode = 128;
                const actions = [{
                        id: 'Git Push Set Upstream',
                        enabled: true,
                        label: 'Run: git push --set-upstream origin test22',
                        tooltip: 'Run: git push --set-upstream origin test22',
                        command: 'git push --set-upstream origin test22'
                    }];
                setup(() => {
                    const command = (0, terminalQuickFixBuiltinActions_1.gitPushSetUpstream)();
                    expectedMap.set(command.commandLineMatcher.toString(), [command]);
                    quickFixAddon.registerCommandFinishedListener(command);
                });
                suite('returns undefined when', () => {
                    test('output does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('command does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`git status`, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                });
                suite('returns actions when', () => {
                    test('expected unix exit code', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                    });
                    test('matching exit status', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, 2), expectedMap, commandService, openerService, labelService)), actions);
                    });
                });
            });
            suite('gitCreatePr', () => {
                const expectedMap = new Map();
                const command = `git push`;
                const output = `Total 0 (delta 0), reused 0 (delta 0), pack-reused 0
			remote:
			remote: Create a pull request for 'test22' on GitHub by visiting:
			remote:      https://github.com/meganrogge/xterm.js/pull/new/test22
			remote:
			To https://github.com/meganrogge/xterm.js
			 * [new branch]        test22 -> test22
			Branch 'test22' set up to track remote branch 'test22' from 'origin'. `;
                const exitCode = 0;
                const actions = [{
                        id: 'Git Create Pr',
                        enabled: true,
                        label: 'Open: https://github.com/meganrogge/xterm.js/pull/new/test22',
                        tooltip: 'Open: https://github.com/meganrogge/xterm.js/pull/new/test22',
                        uri: uri_1.URI.parse('https://github.com/meganrogge/xterm.js/pull/new/test22')
                    }];
                setup(() => {
                    const command = (0, terminalQuickFixBuiltinActions_1.gitCreatePr)();
                    expectedMap.set(command.commandLineMatcher.toString(), [command]);
                    quickFixAddon.registerCommandFinishedListener(command);
                });
                suite('returns undefined when', () => {
                    test('output does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitCreatePrOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('command does not match', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`git status`, output, terminalQuickFixBuiltinActions_1.GitCreatePrOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                    test('failure exit status', async () => {
                        (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitCreatePrOutputRegex, 2), expectedMap, commandService, openerService, labelService)), undefined);
                    });
                });
                suite('returns actions when', () => {
                    test('expected unix exit code', async () => {
                        assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitCreatePrOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                    });
                });
            });
        });
        suite('gitPush - multiple providers', () => {
            const expectedMap = new Map();
            const command = `git push`;
            const output = `fatal: The current branch test22 has no upstream branch.
		To push the current branch and set the remote as upstream, use

			git push --set-upstream origin test22`;
            const exitCode = 128;
            const actions = [{
                    id: 'Git Push Set Upstream',
                    enabled: true,
                    label: 'Run: git push --set-upstream origin test22',
                    tooltip: 'Run: git push --set-upstream origin test22',
                    command: 'git push --set-upstream origin test22'
                }];
            setup(() => {
                const pushCommand = (0, terminalQuickFixBuiltinActions_1.gitPushSetUpstream)();
                const prCommand = (0, terminalQuickFixBuiltinActions_1.gitCreatePr)();
                quickFixAddon.registerCommandFinishedListener(prCommand);
                expectedMap.set(pushCommand.commandLineMatcher.toString(), [pushCommand, prCommand]);
            });
            suite('returns undefined when', () => {
                test('output does not match', async () => {
                    (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                });
                test('command does not match', async () => {
                    (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(`git status`, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                });
            });
            suite('returns actions when', () => {
                test('expected unix exit code', async () => {
                    assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                });
                test('matching exit status', async () => {
                    assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.GitPushOutputRegex, 2), expectedMap, commandService, openerService, labelService)), actions);
                });
            });
        });
        suite('pwsh feedback providers', () => {
            suite('General', () => {
                const expectedMap = new Map();
                const command = `not important`;
                const output = [
                    `...`,
                    ``,
                    `Suggestion [General]:`,
                    `  The most similar commands are: python3, python3m, pamon, python3.6, rtmon, echo, pushd, etsn, pwsh, pwconv.`,
                    ``,
                    `Suggestion [cmd-not-found]:`,
                    `  Command 'python' not found, but can be installed with:`,
                    `  sudo apt install python3`,
                    `  sudo apt install python`,
                    `  sudo apt install python-minimal`,
                    `  You also have python3 installed, you can run 'python3' instead.'`,
                    ``,
                ].join('\n');
                const exitCode = 128;
                const actions = [
                    'python3',
                    'python3m',
                    'pamon',
                    'python3.6',
                    'rtmon',
                    'echo',
                    'pushd',
                    'etsn',
                    'pwsh',
                    'pwconv',
                ].map(command => {
                    return {
                        id: 'Pwsh General Error',
                        enabled: true,
                        label: `Run: ${command}`,
                        tooltip: `Run: ${command}`,
                        command: command
                    };
                });
                setup(() => {
                    const pushCommand = (0, terminalQuickFixBuiltinActions_1.pwshGeneralError)();
                    quickFixAddon.registerCommandFinishedListener(pushCommand);
                    expectedMap.set(pushCommand.commandLineMatcher.toString(), [pushCommand]);
                });
                test('returns undefined when output does not match', async () => {
                    (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.PwshGeneralErrorOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                });
                test('returns actions when output matches', async () => {
                    assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.PwshGeneralErrorOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                });
            });
            suite('Unix cmd-not-found', () => {
                const expectedMap = new Map();
                const command = `not important`;
                const output = [
                    `...`,
                    ``,
                    `Suggestion [General]`,
                    `  The most similar commands are: python3, python3m, pamon, python3.6, rtmon, echo, pushd, etsn, pwsh, pwconv.`,
                    ``,
                    `Suggestion [cmd-not-found]:`,
                    `  Command 'python' not found, but can be installed with:`,
                    `  sudo apt install python3`,
                    `  sudo apt install python`,
                    `  sudo apt install python-minimal`,
                    `  You also have python3 installed, you can run 'python3' instead.'`,
                    ``,
                ].join('\n');
                const exitCode = 128;
                const actions = [
                    'sudo apt install python3',
                    'sudo apt install python',
                    'sudo apt install python-minimal',
                    'python3',
                ].map(command => {
                    return {
                        id: 'Pwsh Unix Command Not Found Error',
                        enabled: true,
                        label: `Run: ${command}`,
                        tooltip: `Run: ${command}`,
                        command: command
                    };
                });
                setup(() => {
                    const pushCommand = (0, terminalQuickFixBuiltinActions_1.pwshUnixCommandNotFoundError)();
                    quickFixAddon.registerCommandFinishedListener(pushCommand);
                    expectedMap.set(pushCommand.commandLineMatcher.toString(), [pushCommand]);
                });
                test('returns undefined when output does not match', async () => {
                    (0, assert_1.strictEqual)((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, `invalid output`, terminalQuickFixBuiltinActions_1.PwshUnixCommandNotFoundErrorOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), undefined);
                });
                test('returns actions when output matches', async () => {
                    assertMatchOptions((await (0, quickFixAddon_1.getQuickFixesForCommand)([], terminal, createCommand(command, output, terminalQuickFixBuiltinActions_1.PwshUnixCommandNotFoundErrorOutputRegex, exitCode), expectedMap, commandService, openerService, labelService)), actions);
                });
            });
        });
    });
    function createCommand(command, output, outputMatcher, exitCode, outputLines) {
        return {
            cwd: '',
            commandStartLineContent: '',
            markProperties: {},
            executedX: undefined,
            startX: undefined,
            command,
            isTrusted: true,
            exitCode,
            getOutput: () => { return output; },
            getOutputMatch: (_matcher) => {
                if (outputMatcher) {
                    const regexMatch = output.match(outputMatcher) ?? undefined;
                    if (regexMatch) {
                        return outputLines ? { regexMatch, outputLines } : { regexMatch, outputLines: [] };
                    }
                }
                return undefined;
            },
            timestamp: Date.now(),
            hasOutput: () => !!output
        };
    }
    function assertMatchOptions(actual, expected) {
        (0, assert_1.strictEqual)(actual?.length, expected.length);
        for (let i = 0; i < expected.length; i++) {
            const expectedItem = expected[i];
            const actualItem = actual[i];
            (0, assert_1.strictEqual)(actualItem.id, expectedItem.id, `ID`);
            (0, assert_1.strictEqual)(actualItem.enabled, expectedItem.enabled, `enabled`);
            (0, assert_1.strictEqual)(actualItem.label, expectedItem.label, `label`);
            (0, assert_1.strictEqual)(actualItem.tooltip, expectedItem.tooltip, `tooltip`);
            if (expectedItem.command) {
                (0, assert_1.strictEqual)(actualItem.command, expectedItem.command);
            }
            if (expectedItem.uri) {
                (0, assert_1.strictEqual)(actualItem.uri.toString(), expectedItem.uri.toString());
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tGaXhBZGRvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL3F1aWNrRml4L3Rlc3QvYnJvd3Nlci9xdWlja0ZpeEFkZG9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUErQmhHLEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBQzNCLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxJQUFJLGFBQW9DLENBQUM7UUFDekMsSUFBSSxnQkFBNEMsQ0FBQztRQUNqRCxJQUFJLGNBQWtDLENBQUM7UUFDdkMsSUFBSSxhQUE0QixDQUFDO1FBQ2pDLElBQUksWUFBMEIsQ0FBQztRQUMvQixJQUFJLFFBQWtCLENBQUM7UUFDdkIsSUFBSSxvQkFBOEMsQ0FBQztRQUVuRCxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsb0JBQW9CLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1EQUF3QixFQUFFLENBQUMsQ0FBQztZQUNqRSxNQUFNLFlBQVksR0FBRyxDQUFDLE1BQU0sSUFBQSwwQkFBbUIsRUFBZ0MsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ3pILFFBQVEsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDO2dCQUNyQyxnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixJQUFJLEVBQUUsRUFBRTtnQkFDUixJQUFJLEVBQUUsRUFBRTthQUNSLENBQUMsQ0FBQyxDQUFDO1lBQ0osb0JBQW9CLENBQUMsSUFBSSxDQUFDLHlCQUFlLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDBDQUFrQixFQUFFLENBQUMsQ0FBQyxD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