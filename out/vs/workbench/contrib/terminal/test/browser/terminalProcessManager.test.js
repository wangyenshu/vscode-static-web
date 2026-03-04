/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/network", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalProcessManager", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert_1, event_1, network_1, uri_1, utils_1, configuration_1, terminal_1, terminalProcessManager_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTerminalChildProcess {
        get capabilities() { return []; }
        constructor(shouldPersist) {
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
    class TestTerminalInstanceService {
        getBackend() {
            return {
                onPtyHostExit: event_1.Event.None,
                onPtyHostUnresponsive: event_1.Event.None,
                onPtyHostResponsive: event_1.Event.None,
                onPtyHostRestart: event_1.Event.None,
                onDidMoveWindowInstance: event_1.Event.None,
                onDidRequestDetach: event_1.Event.None,
                createProcess: (shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, windowsEnableConpty, shouldPersist) => new TestTerminalChildProcess(shouldPersist),
                getLatency: () => Promise.resolve([])
            };
        }
    }
    suite('Workbench - TerminalProcessManager', () => {
        let manager;
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, store);
            const configurationService = instantiationService.get(configuration_1.IConfigurationService);
            await configurationService.setUserConfiguration('editor', { fontFamily: 'foo' });
            await configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: 'bar',
                    enablePersistentSessions: true,
                    shellIntegration: {
                        enabled: false
                    }
                }
            });
            configurationService.onDidChangeConfigurationEmitter.fire({
                affectsConfiguration: () => true,
            });
            instantiationService.stub(terminal_1.ITerminalInstanceService, new TestTerminalInstanceService());
            manager = store.add(instantiationService.createInstance(terminalProcessManager_1.TerminalProcessManager, 1, undefined, undefined, undefined));
        });
        suite('process persistence', () => {
            suite('local', () => {
                test('regular terminal should persist', async () => {
                    const p = await manager.createProcess({}, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, true);
                });
                test('task terminal should not persist', async () => {
                    const p = await manager.createProcess({
                        isFeatureTerminal: true
                    }, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, false);
                });
            });
            suite('remote', () => {
                const remoteCwd = uri_1.URI.from({
                    scheme: network_1.Schemas.vscodeRemote,
                    path: 'test/cwd'
                });
                test('regular terminal should persist', async () => {
                    const p = await manager.createProcess({
                        cwd: remoteCwd
                    }, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, true);
                });
                test('task terminal should not persist', async () => {
                    const p = await manager.createProcess({
                        isFeatureTerminal: true,
                        cwd: remoteCwd
                    }, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, false);
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9jZXNzTWFuYWdlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9icm93c2VyL3Rlcm1pbmFsUHJvY2Vzc01hbmFnZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRyxNQUFNLHdCQUF3QjtRQUU3QixJQUFJLFlBQVksS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakMsWUFDVSxhQUFzQjtZQUF0QixrQkFBYSxHQUFiLGFBQWEsQ0FBUztZQUhoQyxPQUFFLEdBQVcsQ0FBQyxDQUFDO1lBY2Ysd0JBQW1CLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNqQyxrQkFBYSxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDM0Isa0JBQWEsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzNCLG1CQUFjLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUM1QiwwQkFBcUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ25DLDhCQUF5QixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7UUFkdkMsQ0FBQztRQUNELGNBQWMsQ0FBQyxRQUFhLEVBQUUsS0FBVTtZQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQVlELEtBQUssQ0FBQyxLQUFLLEtBQXlCLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN2RCxRQUFRLENBQUMsU0FBa0IsSUFBVSxDQUFDO1FBQ3RDLEtBQUssQ0FBQyxJQUFZLElBQVUsQ0FBQztRQUM3QixNQUFNLENBQUMsSUFBWSxFQUFFLElBQVksSUFBVSxDQUFDO1FBQzVDLFdBQVcsS0FBVyxDQUFDO1FBQ3ZCLG9CQUFvQixD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