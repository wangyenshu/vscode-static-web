/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/platform", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalProfileQuickpick", "vs/workbench/contrib/terminal/browser/terminalProfileService", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalExtensionPoints", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert_1, codicons_1, event_1, platform_1, utils_1, configuration_1, testConfigurationService_1, quickInput_1, themeService_1, testThemeService_1, terminal_1, terminalProfileQuickpick_1, terminalProfileService_1, terminal_2, terminalExtensionPoints_1, environmentService_1, extensions_1, remoteAgentService_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTerminalProfileService extends terminalProfileService_1.TerminalProfileService {
        refreshAvailableProfiles() {
            this.hasRefreshedProfiles = this._refreshAvailableProfilesNow();
        }
        refreshAndAwaitAvailableProfiles() {
            this.refreshAvailableProfiles();
            if (!this.hasRefreshedProfiles) {
                throw new Error('has not refreshed profiles yet');
            }
            return this.hasRefreshedProfiles;
        }
    }
    class MockTerminalProfileService {
        constructor() {
            this.availableProfiles = [];
            this.contributedProfiles = [];
        }
        async getPlatformKey() {
            return 'linux';
        }
        getDefaultProfileName() {
            return this._defaultProfileName;
        }
        setProfiles(profiles, contributed) {
            this.availableProfiles = profiles;
            this.contributedProfiles = contributed;
        }
        setDefaultProfileName(name) {
            this._defaultProfileName = name;
        }
    }
    class MockQuickInputService {
        constructor() {
            this._pick = powershellPick;
        }
        async pick(picks, options, token) {
            Promise.resolve(picks);
            return this._pick;
        }
        setPick(pick) {
            this._pick = pick;
        }
    }
    class TestTerminalProfileQuickpick extends terminalProfileQuickpick_1.TerminalProfileQuickpick {
    }
    class TestTerminalExtensionService extends workbenchTestServices_2.TestExtensionService {
        constructor() {
            super(...arguments);
            this._onDidChangeExtensions = new event_1.Emitter();
        }
    }
    class TestTerminalContributionService {
        constructor() {
            this.terminalProfiles = [];
        }
        setProfiles(profiles) {
            this.terminalProfiles = profiles;
        }
    }
    class TestTerminalInstanceService {
        constructor() {
            this._profiles = new Map();
            this._hasReturnedNone = true;
        }
        async getBackend(remoteAuthority) {
            return {
                getProfiles: async () => {
                    if (this._hasReturnedNone) {
                        return this._profiles.get(remoteAuthority ?? '') || [];
                    }
                    else {
                        this._hasReturnedNone = true;
                        return [];
                    }
                }
            };
        }
        setProfiles(remoteAuthority, profiles) {
            this._profiles.set(remoteAuthority ?? '', profiles);
        }
        setReturnNone() {
            this._hasReturnedNone = false;
        }
    }
    class TestRemoteAgentService {
        setEnvironment(os) {
            this._os = os;
        }
        async getEnvironment() {
            return { os: this._os };
        }
    }
    const defaultTerminalConfig = { profiles: { windows: {}, linux: {}, osx: {} } };
    let powershellProfile = {
        profileName: 'PowerShell',
        path: 'C:\\Powershell.exe',
        isDefault: true,
        icon: codicons_1.Codicon.terminalPowershell
    };
    let jsdebugProfile = {
        extensionIdentifier: 'ms-vscode.js-debug-nightly',
        icon: 'debug',
        id: 'extension.js-debug.debugTerminal',
        title: 'JavaScript Debug Terminal'
    };
    const powershellPick = { label: 'Powershell', profile: powershellProfile, profileName: powershellProfile.profileName };
    const jsdebugPick = { label: 'Javascript Debug Terminal', profile: jsdebugProfile, profileName: jsdebugProfile.title };
    suite('TerminalProfileService', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let configurationService;
        let terminalInstanceService;
        let terminalProfileService;
        let remoteAgentService;
        let extensionService;
        let environmentService;
        let instantiationService;
        setup(async () => {
            configurationService = new testConfigurationService_1.TestConfigurationService({
                files: {},
                terminal: {
                    integrated: defaultTerminalConfig
                }
            });
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({
                configurationService: () => configurationService
            }, store);
            remoteAgentService = new TestRemoteAgentService();
            terminalInstanceService = new TestTerminalInstanceService();
            extensionService = new TestTerminalExtensionService();
            environmentService = { remoteAuthority: undefined };
            const themeService = new testThemeService_1.TestThemeService();
            const terminalContributionService = new TestTerminalContributionService();
            instantiationService.stub(extensions_1.IExtensionService, extensionService);
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            instantiationService.stub(terminalExtensionPoints_1.ITerminalContributionService, terminalContributionService);
            instantiationService.stub(terminal_1.ITerminalInstanceService, terminalInstanceService);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(themeService_1.IThemeService, themeService);
            terminalProfileService = store.add(instantiationService.createInstance(TestTerminalProfileService));
            //reset as these properties are changed in each test
            powershellProfile = {
                profileName: 'PowerShell',
                path: 'C:\\Powershell.exe',
                isDefault: true,
                icon: codicons_1.Codicon.terminalPowershell
            };
            jsdebugProfile = {
                extensionIdentifier: 'ms-vscode.js-debug-nightly',
                icon: 'debug',
                id: 'extension.js-debug.debugTerminal',
                title: 'JavaScript Debug Terminal'
            };
            terminalInstanceService.setProfiles(undefined, [powershellProfile]);
            terminalInstanceService.setProfiles('fakeremote', []);
            terminalContributionService.setProfiles([jsdebugProfile]);
            if (platform_1.isWindows) {
                remoteAgentService.setEnvironment(1 /* OperatingSystem.Windows */);
            }
            else if (platform_1.isLinux) {
                remoteAgentService.setEnvironment(3 /* OperatingSystem.Linux */);
            }
            else {
                remoteAgentService.setEnvironment(2 /* OperatingSystem.Macintosh */);
            }
            configurationService.setUserConfiguration('terminal', { integrated: defaultTerminalConfig });
        });
        suite('Contributed Profiles', () => {
            test('should filter out contributed profiles set to null (Linux)', async () => {
                remoteAgentService.setEnvironment(3 /* OperatingSystem.Linux */);
                await configurationService.setUserConfiguration('terminal', {
                    integrated: {
                        profiles: {
                            linux: {
                                'JavaScript Debug Terminal': null
                            }
                        }
                    }
                });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true, source: 2 /* ConfigurationTarget.USER */ });
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, []);
            });
            test('should filter out contributed profiles set to null (Windows)', async () => {
                remoteAgentService.setEnvironment(1 /* OperatingSystem.Windows */);
                await configurationService.setUserConfiguration('terminal', {
                    integrated: {
                        profiles: {
                            windows: {
                                'JavaScript Debug Terminal': null
                            }
                        }
                    }
                });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true, source: 2 /* ConfigurationTarget.USER */ });
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, []);
            });
            test('should filter out contributed profiles set to null (macOS)', async () => {
                remoteAgentService.setEnvironment(2 /* OperatingSystem.Macintosh */);
                await configurationService.setUserConfiguration('terminal', {
                    integrated: {
                        profiles: {
                            osx: {
                                'JavaScript Debug Terminal': null
                            }
                        }
                    }
                });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true, source: 2 /* ConfigurationTarget.USER */ });
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, []);
            });
            test('should include contributed profiles', async () => {
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
            });
        });
        test('should get profiles from remoteTerminalService when there is a remote authority', async () => {
            environmentService = { remoteAuthority: 'fakeremote' };
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, environmentService);
            terminalProfileService = store.add(instantiationService.createInstance(TestTerminalProfileService));
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, []);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
            terminalInstanceService.setProfiles('fakeremote', [powershellProfile]);
            await terminalProfileService.refreshAndAwaitAvailableProfiles();
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
        });
        test('should fire onDidChangeAvailableProfiles only when available profiles have changed via user config', async () => {
            powershellProfile.icon = codicons_1.Codicon.lightBulb;
            let calls = [];
            store.add(terminalProfileService.onDidChangeAvailableProfiles(e => calls.push(e)));
            await configurationService.setUserConfiguration('terminal', {
                integrated: {
                    profiles: {
                        windows: powershellProfile,
                        linux: powershellProfile,
                        osx: powershellProfile
                    }
                }
            });
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(calls, [
                [powershellProfile]
            ]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
            calls = [];
            await terminalProfileService.refreshAndAwaitAvailableProfiles();
            (0, assert_1.deepStrictEqual)(calls, []);
        });
        test('should fire onDidChangeAvailableProfiles when available or contributed profiles have changed via remote/localTerminalService', async () => {
            powershellProfile.isDefault = false;
            terminalInstanceService.setProfiles(undefined, [powershellProfile]);
            const calls = [];
            store.add(terminalProfileService.onDidChangeAvailableProfiles(e => calls.push(e)));
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(calls, [
                [powershellProfile]
            ]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
        });
        test('should call refreshAvailableProfiles _onDidChangeExtensions', async () => {
            extensionService._onDidChangeExtensions.fire();
            const calls = [];
            store.add(terminalProfileService.onDidChangeAvailableProfiles(e => calls.push(e)));
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(calls, [
                [powershellProfile]
            ]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
        });
        suite('Profiles Quickpick', () => {
            let quickInputService;
            let mockTerminalProfileService;
            let terminalProfileQuickpick;
            setup(async () => {
                quickInputService = new MockQuickInputService();
                mockTerminalProfileService = new MockTerminalProfileService();
                instantiationService.stub(quickInput_1.IQuickInputService, quickInputService);
                instantiationService.stub(terminal_2.ITerminalProfileService, mockTerminalProfileService);
                terminalProfileQuickpick = instantiationService.createInstance(TestTerminalProfileQuickpick);
            });
            test('setDefault', async () => {
                powershellProfile.isDefault = false;
                mockTerminalProfileService.setProfiles([powershellProfile], [jsdebugProfile]);
                mockTerminalProfileService.setDefaultProfileName(jsdebugProfile.title);
                const result = await terminalProfileQuickpick.showAndGetResult('setDefault');
                (0, assert_1.deepStrictEqual)(result, powershellProfile.profileName);
            });
            test('setDefault to contributed', async () => {
                mockTerminalProfileService.setDefaultProfileName(powershellProfile.profileName);
                quickInputService.setPick(jsdebugPick);
                const result = await terminalProfileQuickpick.showAndGetResult('setDefault');
                const expected = {
                    config: {
                        extensionIdentifier: jsdebugProfile.extensionIdentifier,
                        id: jsdebugProfile.id,
                        options: { color: undefined, icon: 'debug' },
                        title: jsdebugProfile.title,
                    },
                    keyMods: undefined
                };
                (0, assert_1.deepStrictEqual)(result, expected);
            });
            test('createInstance', async () => {
                mockTerminalProfileService.setDefaultProfileName(powershellProfile.profileName);
                const pick = { ...powershellPick, keyMods: { alt: true, ctrlCmd: false } };
                quickInputService.setPick(pick);
                const result = await terminalProfileQuickpick.showAndGetResult('createInstance');
                (0, assert_1.deepStrictEqual)(result, { config: powershellProfile, keyMods: { alt: true, ctrlCmd: false } });
            });
            test('createInstance with contributed', async () => {
                const pick = { ...jsdebugPick, keyMods: { alt: true, ctrlCmd: false } };
                quickInputService.setPick(pick);
                const result = await terminalProfileQuickpick.showAndGetResult('createInstance');
                const expected = {
                    config: {
                        extensionIdentifier: jsdebugProfile.extensionIdentifier,
                        id: jsdebugProfile.id,
                        options: { color: undefined, icon: 'debug' },
                        title: jsdebugProfile.title,
                    },
                    keyMods: { alt: true, ctrlCmd: false }
                };
                (0, assert_1.deepStrictEqual)(result, expected);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlU2VydmljZS5pbnRlZ3JhdGlvblRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L2Jyb3dzZXIvdGVybWluYWxQcm9maWxlU2VydmljZS5pbnRlZ3JhdGlvblRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUEyQmhHLE1BQU0sMEJBQTJCLFNBQVEsK0NBQXNCO1FBRXJELHdCQUF3QjtZQUNoQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7UUFDakUsQ0FBQztRQUNELGdDQUFnQztZQUMvQixJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDbEMsQ0FBQztLQUNEO0lBRUQsTUFBTSwwQkFBMEI7UUFBaEM7WUFHQyxzQkFBaUIsR0FBb0MsRUFBRSxDQUFDO1lBQ3hELHdCQUFtQixHQUE2QyxFQUFFLENBQUM7UUFjcEUsQ0FBQztRQWJBLEtBQUssQ0FBQyxjQUFjO1lBQ25CLE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFDRCxxQkFBcUI7WUFDcEIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDakMsQ0FBQztRQUNELFdBQVcsQ0FBQyxRQUE0QixFQUFFLFdBQXdDO1lBQ2pGLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxRQUFRLENBQUM7WUFDbEMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLFdBQVcsQ0FBQztRQUN4QyxDQUFDO1FB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