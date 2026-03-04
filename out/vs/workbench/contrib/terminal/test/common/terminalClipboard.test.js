/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/terminal/common/terminalClipboard"], function (require, exports, assert_1, utils_1, configuration_1, testConfigurationService_1, dialogs_1, testDialogService_1, instantiationServiceMock_1, terminalClipboard_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TerminalClipboard', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('shouldPasteTerminalText', () => {
            let instantiationService;
            let configurationService;
            setup(async () => {
                instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
                configurationService = new testConfigurationService_1.TestConfigurationService({
                    ["terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */]: 'auto'
                });
                instantiationService.stub(configuration_1.IConfigurationService, configurationService);
                instantiationService.stub(dialogs_1.IDialogService, new testDialogService_1.TestDialogService(undefined, { result: { confirmed: false } }));
            });
            function setConfigValue(value) {
                configurationService = new testConfigurationService_1.TestConfigurationService({
                    ["terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */]: value
                });
                instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            }
            test('Single line string', async () => {
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo', undefined), true);
                setConfigValue('always');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo', undefined), true);
                setConfigValue('never');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo', undefined), true);
            });
            test('Single line string with trailing new line', async () => {
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\n', undefined), true);
                setConfigValue('always');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\n', undefined), false);
                setConfigValue('never');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\n', undefined), true);
            });
            test('Multi-line string', async () => {
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', undefined), false);
                setConfigValue('always');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', undefined), false);
                setConfigValue('never');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', undefined), true);
            });
            test('Bracketed paste mode', async () => {
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), true);
                setConfigValue('always');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), false);
                setConfigValue('never');
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), true);
            });
            test('Legacy config', async () => {
                setConfigValue(true); // 'auto'
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', undefined), false);
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), true);
                setConfigValue(false); // 'never'
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), true);
            });
            test('Invalid config', async () => {
                setConfigValue(123);
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', undefined), false);
                (0, assert_1.strictEqual)(await instantiationService.invokeFunction(terminalClipboard_1.shouldPasteTerminalText, 'foo\nbar', true), true);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDbGlwYm9hcmQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL3Rlc3QvY29tbW9uL3Rlcm1pbmFsQ2xpcGJvYXJkLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFO1FBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxLQUFLLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO1lBQ3JDLElBQUksb0JBQThDLENBQUM7WUFDbkQsSUFBSSxvQkFBOEMsQ0FBQztZQUVuRCxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ2hCLG9CQUFvQixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxtREFBd0IsRUFBRSxDQUFDLENBQUM7Z0JBQ2pFLG9CQUFvQixHQUFHLElBQUksbURBQXdCLENBQUM7b0JBQ25ELHVHQUErQyxFQUFFLE1BQU07aUJBQ3ZELENBQUMsQ0FBQztnQkFDSCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMscUNBQXFCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztnQkFDdkUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHdCQUFjLEVBQUUsSUFBSSxxQ0FBaUIsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0csQ0FBQyxDQUFDLENBQUM7WUFFSCxTQUFTLGNBQWMsQ0FBQyxLQUFjO2dCQUNyQyxvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixDQUFDO29CQUNuRCx1R0FBK0MsRUFBRSxLQUFLO2lCQUN0RCxDQUFDLENBQUM7Z0JBQ0gsb0JBQW9CLENBQUMs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