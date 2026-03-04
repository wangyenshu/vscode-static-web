/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalService", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert_1, event_1, utils_1, testConfigurationService_1, dialogs_1, testDialogService_1, terminal_1, terminal_2, terminalService_1, terminal_3, remoteAgentService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - TerminalService', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let terminalService;
        let configurationService;
        let dialogService;
        setup(async () => {
            dialogService = new testDialogService_1.TestDialogService();
            configurationService = new testConfigurationService_1.TestConfigurationService({
                files: {},
                terminal: {
                    integrated: {
                        confirmOnKill: 'never'
                    }
                }
            });
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({
                configurationService: () => configurationService,
            }, store);
            instantiationService.stub(dialogs_1.IDialogService, dialogService);
            instantiationService.stub(terminal_2.ITerminalInstanceService, 'getBackend', undefined);
            instantiationService.stub(terminal_2.ITerminalInstanceService, 'getRegisteredBackends', []);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, 'getConnection', null);
            terminalService = store.add(instantiationService.createInstance(terminalService_1.TerminalService));
            instantiationService.stub(terminal_2.ITerminalService, terminalService);
        });
        suite('safeDisposeTerminal', () => {
            let onExitEmitter;
            setup(() => {
                onExitEmitter = store.add(new event_1.Emitter());
            });
            test('should not show prompt when confirmOnKill is never', async () => {
                await setConfirmOnKill(configurationService, 'never');
                await terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Editor,
                    hasChildProcesses: true,
                    onExit: onExitEmitter.event,
                    dispose: () => onExitEmitter.fire(undefined)
                });
                await terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: true,
                    onExit: onExitEmitter.event,
                    dispose: () => onExitEmitter.fire(undefined)
                });
            });
            test('should not show prompt when any terminal editor is closed (handled by editor itself)', async () => {
                await setConfirmOnKill(configurationService, 'editor');
                terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Editor,
                    hasChildProcesses: true,
                    onExit: onExitEmitter.event,
                    dispose: () => onExitEmitter.fire(undefined)
                });
                await setConfirmOnKill(configurationService, 'always');
                terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Editor,
                    hasChildProcesses: true,
                    onExit: onExitEmitter.event,
                    dispose: () => onExitEmitter.fire(undefined)
                });
            });
            test('should not show prompt when confirmOnKill is editor and panel terminal is closed', async () => {
                await setConfirmOnKill(configurationService, 'editor');
                terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: true,
                    onExit: onExitEmitter.event,
                    dispose: () => onExitEmitter.fire(undefined)
                });
            });
            test('should show prompt when confirmOnKill is panel and panel terminal is closed', async () => {
                await setConfirmOnKill(configurationService, 'panel');
                // No child process cases
                dialogService.setConfirmResult({ confirmed: false });
                terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: false,
                    onExit: onExitEmitter.event,
                    dispose: () => onExitEmitter.fire(undefined)
                });
                dialogService.setConfirmResult({ confirmed: true });
                terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: false,
                    onExit: onExitEmitter.event,
                    dispose: () => onExitEmitter.fire(undefined)
                });
                // Child process cases
                dialogService.setConfirmResult({ confirmed: false });
                await terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: true,
                    dispose: () => (0, assert_1.fail)()
                });
                dialogService.setConfirmResult({ confirmed: true });
                terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: true,
                    onExit: onExitEmitter.event,
                    dispose: () => onExitEmitter.fire(undefined)
                });
            });
            test('should show prompt when confirmOnKill is always and panel terminal is closed', async () => {
                await setConfirmOnKill(configurationService, 'always');
                // No child process cases
                dialogService.setConfirmResult({ confirmed: false });
                terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: false,
                    onExit: onExitEmitter.event,
                    dispose: () => onExitEmitter.fire(undefined)
                });
                dialogService.setConfirmResult({ confirmed: true });
                terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: false,
                    onExit: onExitEmitter.event,
                    dispose: () => onExitEmitter.fire(undefined)
                });
                // Child process cases
                dialogService.setConfirmResult({ confirmed: false });
                await terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: true,
                    dispose: () => (0, assert_1.fail)()
                });
                dialogService.setConfirmResult({ confirmed: true });
                terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: true,
                    onExit: onExitEmitter.event,
                    dispose: () => onExitEmitter.fire(undefined)
                });
            });
        });
    });
    async function setConfirmOnKill(configurationService, value) {
        await configurationService.setUserConfiguration(terminal_3.TERMINAL_CONFIG_SECTION, { confirmOnKill: value });
        configurationService.onDidChangeConfigurationEmitter.fire({
            affectsConfiguration: () => true,
            affectedKeys: ['terminal.integrated.confirmOnKill']
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L2Jyb3dzZXIvdGVybWluYWxTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFlaEcsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUN6QyxNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsSUFBSSxlQUFnQyxDQUFDO1FBQ3JDLElBQUksb0JBQThDLENBQUM7UUFDbkQsSUFBSSxhQUFnQyxDQUFDO1FBRXJDLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNoQixhQUFhLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1lBQ3hDLG9CQUFvQixHQUFHLElBQUksbURBQXdCLENBQUM7Z0JBQ25ELEtBQUssRUFBRSxFQUFFO2dCQUNULFFBQVEsRUFBRTtvQkFDVCxVQUFVLEVBQUU7d0JBQ1gsYUFBYSxFQUFFLE9BQU87cUJBQ3RCO2lCQUNEO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLHFEQUE2QixFQUFDO2dCQUMxRCxvQkFBb0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxvQkFBb0I7YUFDaEQsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNWLG9CQUFvQixDQUFDLElBQUksQ0FBQyx3QkFBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3pELG9CQUFvQixDQUFDLElBQUksQ0FBQyxtQ0FBd0IsRUFBRSxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDN0Usb0JBQW9CLENBQUMsSUFBSSxDQUFDLG1DQUF3QixFQUFFLHVCQUF1QixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2pGLG9CQUFv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